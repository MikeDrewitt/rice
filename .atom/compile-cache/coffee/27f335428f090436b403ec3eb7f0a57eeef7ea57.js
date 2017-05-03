(function() {
  var Motion, Search, SearchBackwards, SearchBase, SearchCurrentWord, SearchCurrentWordBackwards, SearchModel, _, getCaseSensitivity, getNonWordCharactersForCursor, ref, saveEditorState, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('./utils'), saveEditorState = ref.saveEditorState, getNonWordCharactersForCursor = ref.getNonWordCharactersForCursor;

  SearchModel = require('./search-model');

  settings = require('./settings');

  Motion = require('./base').getClass('Motion');

  getCaseSensitivity = function(searchName) {
    if (settings.get("useSmartcaseFor" + searchName)) {
      return 'smartcase';
    } else if (settings.get("ignoreCaseFor" + searchName)) {
      return 'insensitive';
    } else {
      return 'sensitive';
    }
  };

  SearchBase = (function(superClass) {
    extend(SearchBase, superClass);

    function SearchBase() {
      return SearchBase.__super__.constructor.apply(this, arguments);
    }

    SearchBase.extend(false);

    SearchBase.prototype.jump = true;

    SearchBase.prototype.backwards = false;

    SearchBase.prototype.useRegexp = true;

    SearchBase.prototype.configScope = null;

    SearchBase.prototype.landingPoint = null;

    SearchBase.prototype.defaultLandingPoint = 'start';

    SearchBase.prototype.relativeIndex = null;

    SearchBase.prototype.isBackwards = function() {
      return this.backwards;
    };

    SearchBase.prototype.isIncrementalSearch = function() {
      return this["instanceof"]('Search') && !this.isRepeated() && settings.get('incrementalSearch');
    };

    SearchBase.prototype.initialize = function() {
      SearchBase.__super__.initialize.apply(this, arguments);
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.finish();
        };
      })(this));
    };

    SearchBase.prototype.getCount = function() {
      var count;
      count = SearchBase.__super__.getCount.apply(this, arguments);
      if (this.isBackwards()) {
        return -count;
      } else {
        return count;
      }
    };

    SearchBase.prototype.isCaseSensitive = function(term) {
      switch (getCaseSensitivity(this.configScope)) {
        case 'smartcase':
          return term.search('[A-Z]') !== -1;
        case 'insensitive':
          return false;
        case 'sensitive':
          return true;
      }
    };

    SearchBase.prototype.finish = function() {
      var ref1;
      if (this.isIncrementalSearch() && settings.get('showHoverSearchCounter')) {
        this.vimState.hoverSearchCounter.reset();
      }
      this.relativeIndex = null;
      if ((ref1 = this.searchModel) != null) {
        ref1.destroy();
      }
      return this.searchModel = null;
    };

    SearchBase.prototype.getLandingPoint = function() {
      return this.landingPoint != null ? this.landingPoint : this.landingPoint = this.defaultLandingPoint;
    };

    SearchBase.prototype.getPoint = function(cursor) {
      var point, range;
      if (this.searchModel != null) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else {
        if (this.relativeIndex == null) {
          this.relativeIndex = this.getCount();
        }
      }
      if (range = this.search(cursor, this.input, this.relativeIndex)) {
        point = range[this.getLandingPoint()];
      }
      this.searchModel.destroy();
      this.searchModel = null;
      return point;
    };

    SearchBase.prototype.moveCursor = function(cursor) {
      var input, point;
      input = this.getInput();
      if (!input) {
        return;
      }
      if (point = this.getPoint(cursor)) {
        cursor.setBufferPosition(point, {
          autoscroll: false
        });
      }
      if (!this.isRepeated()) {
        this.globalState.set('currentSearch', this);
        this.vimState.searchHistory.save(input);
      }
      return this.globalState.set('lastSearchPattern', this.getPattern(input));
    };

    SearchBase.prototype.getSearchModel = function() {
      return this.searchModel != null ? this.searchModel : this.searchModel = new SearchModel(this.vimState, {
        incrementalSearch: this.isIncrementalSearch()
      });
    };

    SearchBase.prototype.search = function(cursor, input, relativeIndex) {
      var fromPoint, searchModel;
      searchModel = this.getSearchModel();
      if (input) {
        fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      } else {
        this.vimState.hoverSearchCounter.reset();
        return searchModel.clearMarkers();
      }
    };

    return SearchBase;

  })(Motion);

  Search = (function(superClass) {
    extend(Search, superClass);

    function Search() {
      this.handleConfirmSearch = bind(this.handleConfirmSearch, this);
      return Search.__super__.constructor.apply(this, arguments);
    }

    Search.extend();

    Search.prototype.configScope = "Search";

    Search.prototype.requireInput = true;

    Search.prototype.initialize = function() {
      Search.__super__.initialize.apply(this, arguments);
      if (this.isComplete()) {
        return;
      }
      if (this.isIncrementalSearch()) {
        this.restoreEditorState = saveEditorState(this.editor);
        this.onDidCommandSearch(this.handleCommandEvent.bind(this));
      }
      this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
      this.onDidCancelSearch(this.handleCancelSearch.bind(this));
      this.onDidChangeSearch(this.handleChangeSearch.bind(this));
      return this.vimState.searchInput.focus({
        backwards: this.backwards
      });
    };

    Search.prototype.handleCommandEvent = function(commandEvent) {
      var direction, operation;
      if (!this.input) {
        return;
      }
      switch (commandEvent.name) {
        case 'visit':
          direction = commandEvent.direction;
          if (this.isBackwards() && settings.get('incrementalSearchVisitDirection') === 'relative') {
            direction = (function() {
              switch (direction) {
                case 'next':
                  return 'prev';
                case 'prev':
                  return 'next';
              }
            })();
          }
          switch (direction) {
            case 'next':
              return this.getSearchModel().updateCurrentMatch(+1);
            case 'prev':
              return this.getSearchModel().updateCurrentMatch(-1);
          }
          break;
        case 'occurrence':
          operation = commandEvent.operation;
          if (operation != null) {
            this.vimState.occurrenceManager.resetPatterns();
          }
          this.vimState.occurrenceManager.addPattern(this.getPattern(this.input));
          this.vimState.searchHistory.save(this.input);
          this.vimState.searchInput.cancel();
          if (operation != null) {
            return this.vimState.operationStack.run(operation);
          }
      }
    };

    Search.prototype.handleCancelSearch = function() {
      if (!(this.isMode('visual') || this.isMode('insert'))) {
        this.vimState.resetNormalMode();
      }
      if (typeof this.restoreEditorState === "function") {
        this.restoreEditorState();
      }
      this.vimState.reset();
      return this.finish();
    };

    Search.prototype.isSearchRepeatCharacter = function(char) {
      var searchChar;
      if (this.isIncrementalSearch()) {
        return char === '';
      } else {
        searchChar = this.isBackwards() ? '?' : '/';
        return char === '' || char === searchChar;
      }
    };

    Search.prototype.handleConfirmSearch = function(arg) {
      this.input = arg.input, this.landingPoint = arg.landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get('prev');
        if (!this.input) {
          atom.beep();
        }
      }
      return this.processOperation();
    };

    Search.prototype.handleChangeSearch = function(input1) {
      this.input = input1;
      if (this.input.startsWith(' ')) {
        this.input = this.input.replace(/^ /, '');
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({
        useRegexp: this.useRegexp
      });
      if (this.isIncrementalSearch()) {
        return this.search(this.editor.getLastCursor(), this.input, this.getCount());
      }
    };

    Search.prototype.getPattern = function(term) {
      var modifiers;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        if (indexOf.call(modifiers, 'i') < 0) {
          modifiers += 'i';
        }
      }
      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {
          null;
        }
      }
      return new RegExp(_.escapeRegExp(term), modifiers);
    };

    return Search;

  })(SearchBase);

  SearchBackwards = (function(superClass) {
    extend(SearchBackwards, superClass);

    function SearchBackwards() {
      return SearchBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchBackwards.extend();

    SearchBackwards.prototype.backwards = true;

    return SearchBackwards;

  })(Search);

  SearchCurrentWord = (function(superClass) {
    extend(SearchCurrentWord, superClass);

    function SearchCurrentWord() {
      return SearchCurrentWord.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWord.extend();

    SearchCurrentWord.prototype.configScope = "SearchCurrentWord";

    SearchCurrentWord.prototype.getInput = function() {
      var wordRange;
      return this.input != null ? this.input : this.input = (wordRange = this.getCurrentWordBufferRange(), wordRange != null ? (this.editor.setCursorBufferPosition(wordRange.start), this.editor.getTextInBufferRange(wordRange)) : '');
    };

    SearchCurrentWord.prototype.getPattern = function(term) {
      var modifiers, pattern;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      pattern = _.escapeRegExp(term);
      if (/\W/.test(term)) {
        return new RegExp(pattern + "\\b", modifiers);
      } else {
        return new RegExp("\\b" + pattern + "\\b", modifiers);
      }
    };

    SearchCurrentWord.prototype.getCurrentWordBufferRange = function() {
      var cursor, found, nonWordCharacters, point, scanRange, wordRegex;
      cursor = this.editor.getLastCursor();
      point = cursor.getBufferPosition();
      nonWordCharacters = getNonWordCharactersForCursor(cursor);
      wordRegex = new RegExp("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+", 'g');
      found = null;
      scanRange = this.editor.bufferRangeForBufferRow(point.row);
      this.editor.scanInBufferRange(wordRegex, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(point)) {
          found = range;
          return stop();
        }
      });
      return found;
    };

    return SearchCurrentWord;

  })(SearchBase);

  SearchCurrentWordBackwards = (function(superClass) {
    extend(SearchCurrentWordBackwards, superClass);

    function SearchCurrentWordBackwards() {
      return SearchCurrentWordBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWordBackwards.extend();

    SearchCurrentWordBackwards.prototype.backwards = true;

    return SearchCurrentWordBackwards;

  })(SearchCurrentWord);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24tc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkxBQUE7SUFBQTs7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQW1ELE9BQUEsQ0FBUSxTQUFSLENBQW5ELEVBQUMscUNBQUQsRUFBa0I7O0VBQ2xCLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLFFBQWxCLENBQTJCLFFBQTNCOztFQUVULGtCQUFBLEdBQXFCLFNBQUMsVUFBRDtJQUVuQixJQUFHLFFBQVEsQ0FBQyxHQUFULENBQWEsaUJBQUEsR0FBa0IsVUFBL0IsQ0FBSDthQUNFLFlBREY7S0FBQSxNQUVLLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSxlQUFBLEdBQWdCLFVBQTdCLENBQUg7YUFDSCxjQURHO0tBQUEsTUFBQTthQUdILFlBSEc7O0VBSmM7O0VBU2Y7Ozs7Ozs7SUFDSixVQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O3lCQUNBLElBQUEsR0FBTTs7eUJBQ04sU0FBQSxHQUFXOzt5QkFDWCxTQUFBLEdBQVc7O3lCQUNYLFdBQUEsR0FBYTs7eUJBQ2IsWUFBQSxHQUFjOzt5QkFDZCxtQkFBQSxHQUFxQjs7eUJBQ3JCLGFBQUEsR0FBZTs7eUJBRWYsV0FBQSxHQUFhLFNBQUE7YUFDWCxJQUFDLENBQUE7SUFEVTs7eUJBR2IsbUJBQUEsR0FBcUIsU0FBQTthQUNuQixJQUFDLEVBQUEsVUFBQSxFQUFELENBQVksUUFBWixDQUFBLElBQTBCLENBQUksSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUE5QixJQUFnRCxRQUFRLENBQUMsR0FBVCxDQUFhLG1C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UTtNQUNSLFNBQUEsR0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLEtBQUssQ0FBQyxHQUF0QztNQUNaLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsU0FBMUIsRUFBcUMsU0FBckMsRUFBZ0QsU0FBQyxHQUFEO0FBQzlDLFlBQUE7UUFEZ0QsbUJBQU87UUFDdkQsSUFBRyxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQVYsQ0FBd0IsS0FBeEIsQ0FBSDtVQUNFLEtBQUEsR0FBUTtpQkFDUixJQUFBLENBQUEsRUFGRjs7TUFEOEMsQ0FBaEQ7YUFJQTtJQWJ5Qjs7OztLQXRCRzs7RUFxQzFCOzs7Ozs7O0lBQ0osMEJBQUMsQ0FBQSxNQUFELENBQUE7O3lDQUNBLFNBQUEsR0FBVzs7OztLQUY0QjtBQXhPekMiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG57c2F2ZUVkaXRvclN0YXRlLCBnZXROb25Xb3JkQ2hhcmFjdGVyc0ZvckN1cnNvcn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuU2VhcmNoTW9kZWwgPSByZXF1aXJlICcuL3NlYXJjaC1tb2RlbCdcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbk1vdGlvbiA9IHJlcXVpcmUoJy4vYmFzZScpLmdldENsYXNzKCdNb3Rpb24nKVxuXG5nZXRDYXNlU2Vuc2l0aXZpdHkgPSAoc2VhcmNoTmFtZSkgLT5cbiAgIyBbVE9ET10gZGVwcmVjYXRlIG9sZCBzZXR0aW5nIGFuZCBhdXRvLW1pZ3JhdGUgdG8gY2FzZVNlbnNpdGl2aXR5Rm9yWFhYXG4gIGlmIHNldHRpbmdzLmdldChcInVzZVNtYXJ0Y2FzZUZvciN7c2VhcmNoTmFtZX1cIilcbiAgICAnc21hcnRjYXNlJ1xuICBlbHNlIGlmIHNldHRpbmdzLmdldChcImlnbm9yZUNhc2VGb3Ije3NlYXJjaE5hbWV9XCIpXG4gICAgJ2luc2Vuc2l0aXZlJ1xuICBlbHNlXG4gICAgJ3NlbnNpdGl2ZSdcblxuY2xhc3MgU2VhcmNoQmFzZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBqdW1wOiB0cnVlXG4gIGJhY2t3YXJkczogZmFsc2VcbiAgdXNlUmVnZXhwOiB0cnVlXG4gIGNvbmZpZ1Njb3BlOiBudWxsXG4gIGxhbmRpbmdQb2ludDogbnVsbCAjIFsnc3RhcnQnIG9yICdlbmQnXVxuICBkZWZhdWx0TGFuZGluZ1BvaW50OiAnc3RhcnQnICMgWydzdGFydCcgb3IgJ2VuZCddXG4gIHJlbGF0aXZlSW5kZXg6IG51bGxcblxuICBpc0JhY2t3YXJkczogLT5cbiAgICBAYmFja3dhcmRzXG5cbiAgaXNJbmNyZW1lbnRhbFNlYXJjaDogLT5cbiAgICBAaW5zdGFuY2VvZignU2VhcmNoJykgYW5kIG5vdCBAaXNSZXBlYXRlZCgpIGFuZCBzZXR0aW5ncy5nZXQoJ2luY3JlbWVudGFsU2VhcmNoJylcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICBAZmluaXNoKClcblxuICBnZXRDb3VudDogLT5cbiAgICBjb3VudCA9IHN1cGVyXG4gICAgaWYgQGlzQmFja3dhcmRzKClcbiAgICAgIC1jb3VudFxuICAgIGVsc2VcbiAgICAgIGNvdW50XG5cbiAgaXNDYXNlU2Vuc2l0aXZlOiAodGVybSkgLT5cbiAgICBzd2l0Y2ggZ2V0Q2FzZVNlbnNpdGl2aXR5KEBjb25maWdTY29wZSlcbiAgICAgIHdoZW4gJ3NtYXJ0Y2FzZScgdGhlbiB0ZXJtLnNlYXJjaCgnW0EtWl0nKSBpc250IC0xXG4gICAgICB3aGVuICdpbnNlbnNpdGl2ZScgdGhlbiBmYWxzZVxuICAgICAgd2hlbiAnc2Vuc2l0aXZlJyB0aGVuIHRydWVcblxuICBmaW5pc2g6IC0+XG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKSBhbmQgc2V0dGluZ3MuZ2V0KCdzaG93SG92ZXJTZWFyY2hDb3VudGVyJylcbiAgICAgIEB2aW1TdGF0ZS5ob3ZlclNlYXJjaENvdW50ZXIucmVzZXQoKVxuICAgIEByZWxhdGl2ZUluZGV4ID0gbnVsbFxuICAgIEBzZWFyY2hNb2RlbD8uZGVzdHJveSgpXG4gICAgQHNlYXJjaE1vZGVsID0gbnVsbFxuXG4gIGdldExhbmRpbmdQb2ludDogLT5cbiAgICBAbGFuZGluZ1BvaW50ID89IEBkZWZhdWx0TGFuZGluZ1BvaW50XG5cbiAgZ2V0UG9pbnQ6IChjdXJzb3IpIC0+XG4gICAgaWYgQHNlYXJjaE1vZGVsP1xuICAgICAgQHJlbGF0aXZlSW5kZXggPSBAZ2V0Q291bnQoKSArIEBzZWFyY2hNb2RlbC5nZXRSZWxhdGl2ZUluZGV4KClcbiAgICBlbHNlXG4gICAgICBAcmVsYXRpdmVJbmRleCA/PSBAZ2V0Q291bnQoKVxuXG4gICAgaWYgcmFuZ2UgPSBAc2VhcmNoKGN1cnNvciwgQGlucHV0LCBAcmVsYXRpdmVJbmRleClcbiAgICAgIHBvaW50ID0gcmFuZ2VbQGdldExhbmRpbmdQb2ludCgpXVxuXG4gICAgQHNlYXJjaE1vZGVsLmRlc3Ryb3koKVxuICAgIEBzZWFyY2hNb2RlbCA9IG51bGxcblxuICAgIHBvaW50XG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBpbnB1dCA9IEBnZXRJbnB1dCgpXG4gICAgcmV0dXJuIHVubGVzcyBpbnB1dFxuXG4gICAgaWYgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAgIHVubGVzcyBAaXNSZXBlYXRlZCgpXG4gICAgICBAZ2xvYmFsU3RhdGUuc2V0KCdjdXJyZW50U2VhcmNoJywgdGhpcylcbiAgICAgIEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoaW5wdXQpXG5cbiAgICBAZ2xvYmFsU3RhdGUuc2V0KCdsYXN0U2VhcmNoUGF0dGVybicsIEBnZXRQYXR0ZXJuKGlucHV0KSlcblxuICBnZXRTZWFyY2hNb2RlbDogLT5cbiAgICBAc2VhcmNoTW9kZWwgPz0gbmV3IFNlYXJjaE1vZGVsKEB2aW1TdGF0ZSwgaW5jcmVtZW50YWxTZWFyY2g6IEBpc0luY3JlbWVudGFsU2VhcmNoKCkpXG5cbiAgc2VhcmNoOiAoY3Vyc29yLCBpbnB1dCwgcmVsYXRpdmVJbmRleCkgLT5cbiAgICBzZWFyY2hNb2RlbCA9IEBnZXRTZWFyY2hNb2RlbCgpXG4gICAgaWYgaW5wdXRcbiAgICAgIGZyb21Qb2ludCA9IEBnZXRCdWZmZXJQb3NpdGlvbkZvckN1cnNvcihjdXJzb3IpXG4gICAgICBzZWFyY2hNb2RlbC5zZWFyY2goZnJvbVBvaW50LCBAZ2V0UGF0dGVybihpbnB1dCksIHJlbGF0aXZlSW5kZXgpXG4gICAgZWxzZVxuICAgICAgQHZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgICBzZWFyY2hNb2RlbC5jbGVhck1hcmtlcnMoKVxuXG4jIC8sID9cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2VhcmNoIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBAZXh0ZW5kKClcbiAgY29uZmlnU2NvcGU6IFwiU2VhcmNoXCJcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIHJldHVybiBpZiBAaXNDb21wbGV0ZSgpICMgV2hlbiByZXBlYXRlZCwgbm8gbmVlZCB0byBnZXQgdXNlciBpbnB1dFxuXG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKVxuICAgICAgQHJlc3RvcmVFZGl0b3JTdGF0ZSA9IHNhdmVFZGl0b3JTdGF0ZShAZWRpdG9yKVxuICAgICAgQG9uRGlkQ29tbWFuZFNlYXJjaChAaGFuZGxlQ29tbWFuZEV2ZW50LmJpbmQodGhpcykpXG5cbiAgICBAb25EaWRDb25maXJtU2VhcmNoKEBoYW5kbGVDb25maXJtU2VhcmNoLmJpbmQodGhpcykpXG4gICAgQG9uRGlkQ2FuY2VsU2VhcmNoKEBoYW5kbGVDYW5jZWxTZWFyY2guYmluZCh0aGlzKSlcbiAgICBAb25EaWRDaGFuZ2VTZWFyY2goQGhhbmRsZUNoYW5nZVNlYXJjaC5iaW5kKHRoaXMpKVxuXG4gICAgQHZpbVN0YXRlLnNlYXJjaElucHV0LmZvY3VzKHtAYmFja3dhcmRzfSlcblxuICBoYW5kbGVDb21tYW5kRXZlbnQ6IChjb21tYW5kRXZlbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaW5wdXRcbiAgICBzd2l0Y2ggY29tbWFuZEV2ZW50Lm5hbWVcbiAgICAgIHdoZW4gJ3Zpc2l0J1xuICAgICAgICB7ZGlyZWN0aW9ufSA9IGNvbW1hbmRFdmVudFxuICAgICAgICBpZiBAaXNCYWNrd2FyZHMoKSBhbmQgc2V0dGluZ3MuZ2V0KCdpbmNyZW1lbnRhbFNlYXJjaFZpc2l0RGlyZWN0aW9uJykgaXMgJ3JlbGF0aXZlJ1xuICAgICAgICAgIGRpcmVjdGlvbiA9IHN3aXRjaCBkaXJlY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ25leHQnIHRoZW4gJ3ByZXYnXG4gICAgICAgICAgICB3aGVuICdwcmV2JyB0aGVuICduZXh0J1xuXG4gICAgICAgIHN3aXRjaCBkaXJlY3Rpb25cbiAgICAgICAgICB3aGVuICduZXh0JyB0aGVuIEBnZXRTZWFyY2hNb2RlbCgpLnVwZGF0ZUN1cnJlbnRNYXRjaCgrMSlcbiAgICAgICAgICB3aGVuICdwcmV2JyB0aGVuIEBnZXRTZWFyY2hNb2RlbCgpLnVwZGF0ZUN1cnJlbnRNYXRjaCgtMSlcblxuICAgICAgd2hlbiAnb2NjdXJyZW5jZSdcbiAgICAgICAge29wZXJhdGlvbn0gPSBjb21tYW5kRXZlbnRcbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSBpZiBvcGVyYXRpb24/XG5cbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4oQGdldFBhdHRlcm4oQGlucHV0KSlcbiAgICAgICAgQHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShAaW5wdXQpXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuXG4gICAgICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5ydW4ob3BlcmF0aW9uKSBpZiBvcGVyYXRpb24/XG5cbiAgaGFuZGxlQ2FuY2VsU2VhcmNoOiAtPlxuICAgIEB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKSB1bmxlc3MgQGlzTW9kZSgndmlzdWFsJykgb3IgQGlzTW9kZSgnaW5zZXJ0JylcbiAgICBAcmVzdG9yZUVkaXRvclN0YXRlPygpXG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICBAZmluaXNoKClcblxuICBpc1NlYXJjaFJlcGVhdENoYXJhY3RlcjogKGNoYXIpIC0+XG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKVxuICAgICAgY2hhciBpcyAnJ1xuICAgIGVsc2VcbiAgICAgIHNlYXJjaENoYXIgPSBpZiBAaXNCYWNrd2FyZHMoKSB0aGVuICc/JyBlbHNlICcvJ1xuICAgICAgY2hhciBpbiBbJycsIHNlYXJjaENoYXJdXG5cbiAgaGFuZGxlQ29uZmlybVNlYXJjaDogKHtAaW5wdXQsIEBsYW5kaW5nUG9pbnR9KSA9PlxuICAgIGlmIEBpc1NlYXJjaFJlcGVhdENoYXJhY3RlcihAaW5wdXQpXG4gICAgICBAaW5wdXQgPSBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ3ByZXYnKVxuICAgICAgYXRvbS5iZWVwKCkgdW5sZXNzIEBpbnB1dFxuICAgIEBwcm9jZXNzT3BlcmF0aW9uKClcblxuICBoYW5kbGVDaGFuZ2VTZWFyY2g6IChAaW5wdXQpIC0+XG4gICAgIyBJZiBpbnB1dCBzdGFydHMgd2l0aCBzcGFjZSwgcmVtb3ZlIGZpcnN0IHNwYWNlIGFuZCBkaXNhYmxlIHVzZVJlZ2V4cC5cbiAgICBpZiBAaW5wdXQuc3RhcnRzV2l0aCgnICcpXG4gICAgICBAaW5wdXQgPSBAaW5wdXQucmVwbGFjZSgvXiAvLCAnJylcbiAgICAgIEB1c2VSZWdleHAgPSBmYWxzZVxuICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC51cGRhdGVPcHRpb25TZXR0aW5ncyh7QHVzZVJlZ2V4cH0pXG5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpXG4gICAgICBAc2VhcmNoKEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLCBAaW5wdXQsIEBnZXRDb3VudCgpKVxuXG4gIGdldFBhdHRlcm46ICh0ZXJtKSAtPlxuICAgIG1vZGlmaWVycyA9IGlmIEBpc0Nhc2VTZW5zaXRpdmUodGVybSkgdGhlbiAnZycgZWxzZSAnZ2knXG4gICAgIyBGSVhNRSB0aGlzIHByZXZlbnQgc2VhcmNoIFxcXFxjIGl0c2VsZi5cbiAgICAjIERPTlQgdGhpbmtsZXNzbHkgbWltaWMgcHVyZSBWaW0uIEluc3RlYWQsIHByb3ZpZGUgaWdub3JlY2FzZSBidXR0b24gYW5kIHNob3J0Y3V0LlxuICAgIGlmIHRlcm0uaW5kZXhPZignXFxcXGMnKSA+PSAwXG4gICAgICB0ZXJtID0gdGVybS5yZXBsYWNlKCdcXFxcYycsICcnKVxuICAgICAgbW9kaWZpZXJzICs9ICdpJyB1bmxlc3MgJ2knIGluIG1vZGlmaWVyc1xuXG4gICAgaWYgQHVzZVJlZ2V4cFxuICAgICAgdHJ5XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRlcm0sIG1vZGlmaWVycylcbiAgICAgIGNhdGNoXG4gICAgICAgIG51bGxcblxuICAgIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcblxuY2xhc3MgU2VhcmNoQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZHM6IHRydWVcblxuIyAqLCAjXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBAZXh0ZW5kKClcbiAgY29uZmlnU2NvcGU6IFwiU2VhcmNoQ3VycmVudFdvcmRcIlxuXG4gIGdldElucHV0OiAtPlxuICAgIEBpbnB1dCA/PSAoXG4gICAgICB3b3JkUmFuZ2UgPSBAZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiB3b3JkUmFuZ2U/XG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24od29yZFJhbmdlLnN0YXJ0KVxuICAgICAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgJydcbiAgICApXG5cbiAgZ2V0UGF0dGVybjogKHRlcm0pIC0+XG4gICAgbW9kaWZpZXJzID0gaWYgQGlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSB0aGVuICdnJyBlbHNlICdnaSdcbiAgICBwYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAodGVybSlcbiAgICBpZiAvXFxXLy50ZXN0KHRlcm0pXG4gICAgICBuZXcgUmVnRXhwKFwiI3twYXR0ZXJufVxcXFxiXCIsIG1vZGlmaWVycylcbiAgICBlbHNlXG4gICAgICBuZXcgUmVnRXhwKFwiXFxcXGIje3BhdHRlcm59XFxcXGJcIiwgbW9kaWZpZXJzKVxuXG4gIGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2U6IC0+XG4gICAgY3Vyc29yID0gQGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgICB3b3JkUmVnZXggPSBuZXcgUmVnRXhwKFwiW15cXFxccyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXCIsICdnJylcblxuICAgIGZvdW5kID0gbnVsbFxuICAgIHNjYW5SYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocG9pbnQucm93KVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2Ugd29yZFJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4ocG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgZm91bmRcblxuY2xhc3MgU2VhcmNoQ3VycmVudFdvcmRCYWNrd2FyZHMgZXh0ZW5kcyBTZWFyY2hDdXJyZW50V29yZFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmRzOiB0cnVlXG4iXX0=
