(function() {
  var AnyBracket, BracketMatchingMotion, CloseBrackets, Input, MotionWithInput, OpenBrackets, Point, Range, RepeatSearch, Search, SearchBase, SearchCurrentWord, SearchViewModel, _, ref, settings,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  MotionWithInput = require('./general-motions').MotionWithInput;

  SearchViewModel = require('../view-models/search-view-model');

  Input = require('../view-models/view-model').Input;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  settings = require('../settings');

  SearchBase = (function(superClass) {
    extend(SearchBase, superClass);

    function SearchBase(editor, vimState, options) {
      this.editor = editor;
      this.vimState = vimState;
      if (options == null) {
        options = {};
      }
      this.reversed = bind(this.reversed, this);
      SearchBase.__super__.constructor.call(this, this.editor, this.vimState);
      this.reverse = this.initiallyReversed = false;
      if (!options.dontUpdateCurrentSearch) {
        this.updateCurrentSearch();
      }
    }

    SearchBase.prototype.reversed = function() {
      this.initiallyReversed = this.reverse = true;
      this.updateCurrentSearch();
      return this;
    };

    SearchBase.prototype.moveCursor = function(cursor, count) {
      var range, ranges;
      if (count == null) {
        count = 1;
      }
      ranges = this.scan(cursor);
      if (ranges.length > 0) {
        range = ranges[(count - 1) % ranges.length];
        return cursor.setBufferPosition(range.start);
      } else {
        return atom.beep();
      }
    };

    SearchBase.prototype.scan = function(cursor) {
      var currentPosition, rangesAfter, rangesBefore, ref1;
      if (this.input.characters === "") {
        return [];
      }
      currentPosition = cursor.getBufferPosition();
      ref1 = [[], []], rangesBefore = ref1[0], rangesAfter = ref1[1];
      this.editor.scan(this.getSearchTerm(this.input.characters), (function(_this) {
        return function(arg) {
          var isBefore, range;
          range = arg.range;
          isBefore = _this.reverse ? range.start.compare(currentPosition) < 0 : range.start.compare(currentPosition) <= 0;
          if (isBefore) {
            return rangesBefore.push(range);
          } else {
            return rangesAfter.push(range);
          }
        };
      })(this));
      if (this.reverse) {
        return rangesAfter.concat(rangesBefore).reverse();
      } else {
        return rangesAfter.concat(rangesBefore);
      }
    };

    SearchBase.prototype.getSearchTerm = function(term) {
      var modFlags, modifiers;
      modifiers = {
        'g': true
      };
      if (!term.match('[A-Z]') && settings.useSmartcaseForSearch()) {
        modifiers['i'] = true;
      }
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        modifiers['i'] = true;
      }
      modFlags = Object.keys(modifiers).join('');
      try {
        return new RegExp(term, modFlags);
      } catch (error) {
        return new RegExp(_.escapeRegExp(term), modFlags);
      }
    };

    SearchBase.prototype.updateCurrentSearch = function() {
      this.vimState.globalVimState.currentSearch.reverse = this.reverse;
      return this.vimState.globalVimState.currentSearch.initiallyReversed = this.initiallyReversed;
    };

    SearchBase.prototype.replicateCurrentSearch = function() {
      this.reverse = this.vimState.globalVimState.currentSearch.reverse;
      return this.initiallyReversed = this.vimState.globalVimState.currentSearch.initiallyReversed;
    };

    return SearchBase;

  })(MotionWithInput);

  Search = (function(superClass) {
    extend(Search, superClass);

    function Search(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
      this.reversed = bind(this.reversed, this);
      Search.__super__.constructor.call(this, this.editor, this.vimState);
      this.viewModel = new SearchViewModel(this);
      this.updateViewModel();
    }

    Search.prototype.reversed = function() {
      this.initiallyReversed = this.reverse = true;
      this.updateCurrentSearch();
      this.updateViewModel();
      return this;
    };

    Search.prototype.updateViewModel = function() {
      return this.viewModel.update(this.initiallyReversed);
    };

    return Search;

  })(SearchBase);

  SearchCurrentWord = (function(superClass) {
    extend(SearchCurrentWord, superClass);

    SearchCurrentWord.keywordRegex = null;

    function SearchCurrentWord(editor, vimState) {
      var defaultIsKeyword, searchString, userIsKeyword;
      this.editor = editor;
      this.vimState = vimState;
      SearchCurrentWord.__super__.constructor.call(this, this.editor, this.vimState);
      defaultIsKeyword = "[@a-zA-Z0-9_\-]+";
      userIsKeyword = atom.config.get('vim-mode.iskeyword');
      this.keywordRegex = new RegExp(userIsKeyword || defaultIsKeyword);
      searchString = this.getCurrentWordMatch();
      this.input = new Input(searchString);
      if (searchString !== this.vimState.getSearchHistoryItem()) {
        this.vimState.pushSearchHistory(searchString);
      }
    }

    SearchCurrentWord.prototype.getCurrentWord = function() {
      var cursor, cursorPosition, wordEnd, wordStart;
      cursor = this.editor.getLastCursor();
      wordStart = cursor.getBeginningOfCurrentWordBufferPosition({
        wordRegex: this.keywordRegex,
        allowPrevious: false
      });
      wordEnd = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.keywordRegex,
        allowNext: false
      });
      cursorPosition = cursor.getBufferPosition();
      if (wordEnd.column === cursorPosition.column) {
        wordEnd = cursor.getEndOfCurrentWordBufferPosition({
          wordRegex: this.keywordRegex,
          allowNext: true
        });
        if (wordEnd.row !== cursorPosition.row) {
          return "";
        }
        cursor.setBufferPosition(wordEnd);
        wordStart = cursor.getBeginningOfCurrentWordBufferPosition({
          wordRegex: this.keywordRegex,
          allowPrevious: false
        });
      }
      cursor.setBufferPosition(wordStart);
      return this.editor.getTextInBufferRange([wordStart, wordEnd]);
    };

    SearchCurrentWord.prototype.cursorIsOnEOF = function(cursor) {
      var eofPos, pos;
      pos = cursor.getNextWordBoundaryBufferPosition({
        wordRegex: this.keywordRegex
      });
      eofPos = this.editor.getEofBufferPosition();
      return pos.row === eofPos.row && pos.column === eofPos.column;
    };

    SearchCurrentWord.prototype.getCurrentWordMatch = function() {
      var characters;
      characters = this.getCurrentWord();
      if (characters.length > 0) {
        if (/\W/.test(characters)) {
          return characters + "\\b";
        } else {
          return "\\b" + characters + "\\b";
        }
      } else {
        return characters;
      }
    };

    SearchCurrentWord.prototype.isComplete = function() {
      return true;
    };

    SearchCurrentWord.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      if (this.input.characters.length > 0) {
        return SearchCurrentWord.__super__.execute.call(this, count);
      }
    };

    return SearchCurrentWord;

  })(SearchBase);

  OpenBrackets = ['(', '{', '['];

  CloseBrackets = [')', '}', ']'];

  AnyBracket = new RegExp(OpenBrackets.concat(CloseBrackets).map(_.escapeRegExp).join("|"));

  BracketMatchingMotion = (function(superClass) {
    extend(BracketMatchingMotion, superClass);

    function BracketMatchingMotion() {
      return BracketMatchingMotion.__super__.constructor.apply(this, arguments);
    }

    BracketMatchingMotion.prototype.operatesInclusively = true;

    BracketMatchingMotion.prototype.isComplete = function() {
      return true;
    };

    BracketMatchingMotion.prototype.searchForMatch = function(startPosition, reverse, inCharacter, outCharacter) {
      var character, depth, eofPosition, increment, lineLength, point;
      depth = 0;
      point = startPosition.copy();
      lineLength = this.editor.lineTextForBufferRow(point.row).length;
      eofPosition = this.editor.getEofBufferPosition().translate([0, 1]);
      increment = reverse ? -1 : 1;
      while (true) {
        character = this.characterAt(point);
        if (character === inCharacter) {
          depth++;
        }
        if (character === outCharacter) {
          depth--;
        }
        if (depth === 0) {
          return point;
        }
        point.column += increment;
        if (depth < 0) {
          return null;
        }
        if (point.isEqual([0, -1])) {
          return null;
        }
        if (point.isEqual(eofPosition)) {
          return null;
        }
        if (point.column < 0) {
          point.row--;
          lineLength = this.editor.lineTextForBufferRow(point.row).length;
          point.column = lineLength - 1;
        } else if (point.column >= lineLength) {
          point.row++;
          lineLength = this.editor.lineTextForBufferRow(point.row).length;
          point.column = 0;
        }
      }
    };

    BracketMatchingMotion.prototype.characterAt = function(position) {
      return this.editor.getTextInBufferRange([position, position.translate([0, 1])]);
    };

    BracketMatchingMotion.prototype.getSearchData = function(position) {
      var character, index;
      character = this.characterAt(position);
      if ((index = OpenBrackets.indexOf(character)) >= 0) {
        return [character, CloseBrackets[index], false];
      } else if ((index = CloseBrackets.indexOf(character)) >= 0) {
        return [character, OpenBrackets[index], true];
      } else {
        return [];
      }
    };

    BracketMatchingMotion.prototype.moveCursor = function(cursor) {
      var inCharacter, matchPosition, outCharacter, ref1, ref2, restOfLine, reverse, startPosition;
      startPosition = cursor.getBufferPosition();
      ref1 = this.getSearchData(startPosition), inCharacter = ref1[0], outCharacter = ref1[1], reverse = ref1[2];
      if (inCharacter == null) {
        restOfLine = [startPosition, [startPosition.row, 2e308]];
        this.editor.scanInBufferRange(AnyBracket, restOfLine, function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          startPosition = range.start;
          return stop();
        });
      }
      ref2 = this.getSearchData(startPosition), inCharacter = ref2[0], outCharacter = ref2[1], reverse = ref2[2];
      if (inCharacter == null) {
        return;
      }
      if (matchPosition = this.searchForMatch(startPosition, reverse, inCharacter, outCharacter)) {
        return cursor.setBufferPosition(matchPosition);
      }
    };

    return BracketMatchingMotion;

  })(SearchBase);

  RepeatSearch = (function(superClass) {
    extend(RepeatSearch, superClass);

    function RepeatSearch(editor, vimState) {
      var ref1;
      this.editor = editor;
      this.vimState = vimState;
      RepeatSearch.__super__.constructor.call(this, this.editor, this.vimState, {
        dontUpdateCurrentSearch: true
      });
      this.input = new Input((ref1 = this.vimState.getSearchHistoryItem(0)) != null ? ref1 : "");
      this.replicateCurrentSearch();
    }

    RepeatSearch.prototype.isComplete = function() {
      return true;
    };

    RepeatSearch.prototype.reversed = function() {
      this.reverse = !this.initiallyReversed;
      return this;
    };

    return RepeatSearch;

  })(SearchBase);

  module.exports = {
    Search: Search,
    SearchCurrentWord: SearchCurrentWord,
    BracketMatchingMotion: BracketMatchingMotion,
    RepeatSearch: RepeatSearch
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvbW90aW9ucy9zZWFyY2gtbW90aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNExBQUE7SUFBQTs7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsa0JBQW1CLE9BQUEsQ0FBUSxtQkFBUjs7RUFDcEIsZUFBQSxHQUFrQixPQUFBLENBQVEsa0NBQVI7O0VBQ2pCLFFBQVMsT0FBQSxDQUFRLDJCQUFSOztFQUNWLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBRUw7OztJQUNTLG9CQUFDLE1BQUQsRUFBVSxRQUFWLEVBQXFCLE9BQXJCO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDs7UUFBVyxVQUFVOzs7TUFDMUMsNENBQU0sSUFBQyxDQUFBLE1BQVAsRUFBZSxJQUFDLENBQUEsUUFBaEI7TUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtNQUNoQyxJQUFBLENBQThCLE9BQU8sQ0FBQyx1QkFBdEM7UUFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBQSxFQUFBOztJQUhXOzt5QkFLYixRQUFBLEdBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ2hDLElBQUMsQ0FBQSxtQkFBRCxDQUFBO2FBQ0E7SUFIUTs7eUJBS1YsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDVixVQUFBOztRQURtQixRQUFNOztNQUN6QixNQUFBLEdBQVMsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOO01BQ1QsSUFBRyxNQUFNLENBQUMsTUFBUCxHQUFnQixDQUFuQjtRQUNFLEtBQUEsR0FB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QkFBTztVQUN6RCxhQUFBLEdBQWdCLEtBQUssQ0FBQztpQkFDdEIsSUFBQSxDQUFBO1FBRmdELENBQWxELEVBRkY7O01BTUEsT0FBdUMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxhQUFmLENBQXZDLEVBQUMscUJBQUQsRUFBYyxzQkFBZCxFQUE0QjtNQUU1QixJQUFjLG1CQUFkO0FBQUEsZUFBQTs7TUFFQSxJQUFHLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsYUFBaEIsRUFBK0IsT0FBL0IsRUFBd0MsV0FBeEMsRUFBcUQsWUFBckQsQ0FBbkI7ZUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsYUFBekIsRUFERjs7SUFmVTs7OztLQTlDc0I7O0VBZ0U5Qjs7O0lBQ1Msc0JBQUMsTUFBRCxFQUFVLFFBQVY7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDtNQUNyQiw4Q0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxRQUFoQixFQUEwQjtRQUFBLHVCQUFBLEVBQXlCLElBQXpCO09BQTFCO01BQ0EsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUEsaUVBQTBDLEVBQTFDO01BQ2IsSUFBQyxDQUFBLHNCQUFELENBQUE7SUFIVzs7MkJBS2IsVUFBQSxHQUFZLFNBQUE7YUFBRztJQUFIOzsyQkFFWixRQUFBLEdBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBSSxJQUFDLENBQUE7YUFDaEI7SUFGUTs7OztLQVJlOztFQWEzQixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLFFBQUEsTUFBRDtJQUFTLG1CQUFBLGlCQUFUO0lBQTRCLHVCQUFBLHFCQUE1QjtJQUFtRCxjQUFBLFlBQW5EOztBQTNOakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue01vdGlvbldpdGhJbnB1dH0gPSByZXF1aXJlICcuL2dlbmVyYWwtbW90aW9ucydcblNlYXJjaFZpZXdNb2RlbCA9IHJlcXVpcmUgJy4uL3ZpZXctbW9kZWxzL3NlYXJjaC12aWV3LW1vZGVsJ1xue0lucHV0fSA9IHJlcXVpcmUgJy4uL3ZpZXctbW9kZWxzL3ZpZXctbW9kZWwnXG57UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL3NldHRpbmdzJ1xuXG5jbGFzcyBTZWFyY2hCYXNlIGV4dGVuZHMgTW90aW9uV2l0aElucHV0XG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlLCBvcHRpb25zID0ge30pIC0+XG4gICAgc3VwZXIoQGVkaXRvciwgQHZpbVN0YXRlKVxuICAgIEByZXZlcnNlID0gQGluaXRpYWxseVJldmVyc2VkID0gZmFsc2VcbiAgICBAdXBkYXRlQ3VycmVudFNlYXJjaCgpIHVubGVzcyBvcHRpb25zLmRvbnRVcGRhdGVDdXJyZW50U2VhcmNoXG5cbiAgcmV2ZXJzZWQ6ID0+XG4gICAgQGluaXRpYWxseVJldmVyc2VkID0gQHJldmVyc2UgPSB0cnVlXG4gICAgQHVwZGF0ZUN1cnJlbnRTZWFyY2goKVxuICAgIHRoaXNcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIHJhbmdlcyA9IEBzY2FuKGN1cnNvcilcbiAgICBpZiByYW5nZXMubGVuZ3RoID4gMFxuICAgICAgcmFuZ2UgPSByYW5nZXNbKGNvdW50IC0gMSkgJSByYW5nZXMubGVuZ3RoXVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHJhbmdlLnN0YXJ0KVxuICAgIGVsc2VcbiAgICAgIGF0b20uYmVlcCgpXG5cbiAgc2NhbjogKGN1cnNvcikgLT5cbiAgICByZXR1cm4gW10gaWYgQGlucHV0LmNoYXJhY3RlcnMgaXMgXCJcIlxuXG4gICAgY3VycmVudFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIFtyYW5nZXNCZWZvcmUsIHJhbmdlc0FmdGVyXSA9IFtbXSwgW11dXG4gICAgQGVkaXRvci5zY2FuIEBnZXRTZWFyY2hUZXJtKEBpbnB1dC5jaGFyYWN0ZXJzKSwgKHtyYW5nZX0pID0+XG4gICAgICBpc0JlZm9yZSA9IGlmIEByZXZlcnNlXG4gICAgICAgIHJhbmdlLnN0YXJ0LmNvbXBhcmUoY3VycmVudFBvc2l0aW9uKSA8IDBcbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2Uuc3RhcnQuY29tcGFyZShjdXJyZW50UG9zaXRpb24pIDw9IDBcblxuICAgICAgaWYgaXNCZWZvcmVcbiAgICAgICAgcmFuZ2VzQmVmb3JlLnB1c2gocmFuZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIHJhbmdlc0FmdGVyLnB1c2gocmFuZ2UpXG5cbiAgICBpZiBAcmV2ZXJzZVxuICAgICAgcmFuZ2VzQWZ0ZXIuY29uY2F0KHJhbmdlc0JlZm9yZSkucmV2ZXJzZSgpXG4gICAgZWxzZVxuICAgICAgcmFuZ2VzQWZ0ZXIuY29uY2F0KHJhbmdlc0JlZm9yZSlcblxuICBnZXRTZWFyY2hUZXJtOiAodGVybSkgLT5cbiAgICBtb2RpZmllcnMgPSB7J2cnOiB0cnVlfVxuXG4gICAgaWYgbm90IHRlcm0ubWF0Y2goJ1tBLVpdJykgYW5kIHNldHRpbmdzLnVzZVNtYXJ0Y2FzZUZvclNlYXJjaCgpXG4gICAgICBtb2RpZmllcnNbJ2knXSA9IHRydWVcblxuICAgIGlmIHRlcm0uaW5kZXhPZignXFxcXGMnKSA+PSAwXG4gICAgICB0ZXJtID0gdGVybS5yZXBsYWNlKCdcXFxcYycsICcnKVxuICAgICAgbW9kaWZpZXJzWydpJ10gPSB0cnVlXG5cbiAgICBtb2RGbGFncyA9IE9iamVjdC5rZXlzKG1vZGlmaWVycykuam9pbignJylcblxuICAgIHRyeVxuICAgICAgbmV3IFJlZ0V4cCh0ZXJtLCBtb2RGbGFncylcbiAgICBjYXRjaFxuICAgICAgbmV3IFJlZ0V4cChfLmVzY2FwZVJlZ0V4cCh0ZXJtKSwgbW9kRmxhZ3MpXG5cbiAgdXBkYXRlQ3VycmVudFNlYXJjaDogLT5cbiAgICBAdmltU3RhdGUuZ2xvYmFsVmltU3RhdGUuY3VycmVudFNlYXJjaC5yZXZlcnNlID0gQHJldmVyc2VcbiAgICBAdmltU3RhdGUuZ2xvYmFsVmltU3RhdGUuY3VycmVudFNlYXJjaC5pbml0aWFsbHlSZXZlcnNlZCA9IEBpbml0aWFsbHlSZXZlcnNlZFxuXG4gIHJlcGxpY2F0ZUN1cnJlbnRTZWFyY2g6IC0+XG4gICAgQHJldmVyc2UgPSBAdmltU3RhdGUuZ2xvYmFsVmltU3RhdGUuY3VycmVudFNlYXJjaC5yZXZlcnNlXG4gICAgQGluaXRpYWxseVJldmVyc2VkID0gQHZpbVN0YXRlLmdsb2JhbFZpbVN0YXRlLmN1cnJlbnRTZWFyY2guaW5pdGlhbGx5UmV2ZXJzZWRcblxuY2xhc3MgU2VhcmNoIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEB2aW1TdGF0ZSkgLT5cbiAgICBzdXBlcihAZWRpdG9yLCBAdmltU3RhdGUpXG4gICAgQHZpZXdNb2RlbCA9IG5ldyBTZWFyY2hWaWV3TW9kZWwodGhpcylcbiAgICBAdXBkYXRlVmlld01vZGVsKClcblxuICByZXZlcnNlZDogPT5cbiAgICBAaW5pdGlhbGx5UmV2ZXJzZWQgPSBAcmV2ZXJzZSA9IHRydWVcbiAgICBAdXBkYXRlQ3VycmVudFNlYXJjaCgpXG4gICAgQHVwZGF0ZVZpZXdNb2RlbCgpXG4gICAgdGhpc1xuXG4gIHVwZGF0ZVZpZXdNb2RlbDogLT5cbiAgICBAdmlld01vZGVsLnVwZGF0ZShAaW5pdGlhbGx5UmV2ZXJzZWQpXG5cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBAa2V5d29yZFJlZ2V4OiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAdmltU3RhdGUpIC0+XG4gICAgc3VwZXIoQGVkaXRvciwgQHZpbVN0YXRlKVxuXG4gICAgIyBGSVhNRTogVGhpcyBtdXN0IGRlcGVuZCBvbiB0aGUgY3VycmVudCBsYW5ndWFnZVxuICAgIGRlZmF1bHRJc0tleXdvcmQgPSBcIltAYS16QS1aMC05X1xcLV0rXCJcbiAgICB1c2VySXNLZXl3b3JkID0gYXRvbS5jb25maWcuZ2V0KCd2aW0tbW9kZS5pc2tleXdvcmQnKVxuICAgIEBrZXl3b3JkUmVnZXggPSBuZXcgUmVnRXhwKHVzZXJJc0tleXdvcmQgb3IgZGVmYXVsdElzS2V5d29yZClcblxuICAgIHNlYXJjaFN0cmluZyA9IEBnZXRDdXJyZW50V29yZE1hdGNoKClcbiAgICBAaW5wdXQgPSBuZXcgSW5wdXQoc2VhcmNoU3RyaW5nKVxuICAgIEB2aW1TdGF0ZS5wdXNoU2VhcmNoSGlzdG9yeShzZWFyY2hTdHJpbmcpIHVubGVzcyBzZWFyY2hTdHJpbmcgaXMgQHZpbVN0YXRlLmdldFNlYXJjaEhpc3RvcnlJdGVtKClcblxuICBnZXRDdXJyZW50V29yZDogLT5cbiAgICBjdXJzb3IgPSBAZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgIHdvcmRTdGFydCA9IGN1cnNvci5nZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24od29yZFJlZ2V4OiBAa2V5d29yZFJlZ2V4LCBhbGxvd1ByZXZpb3VzOiBmYWxzZSlcbiAgICB3b3JkRW5kICAgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uICAgICAgKHdvcmRSZWdleDogQGtleXdvcmRSZWdleCwgYWxsb3dOZXh0OiBmYWxzZSlcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBpZiB3b3JkRW5kLmNvbHVtbiBpcyBjdXJzb3JQb3NpdGlvbi5jb2x1bW5cbiAgICAgICMgZWl0aGVyIHdlIGRvbid0IGhhdmUgYSBjdXJyZW50IHdvcmQsIG9yIGl0IGVuZHMgb24gY3Vyc29yLCBpLmUuIHByZWNlZGVzIGl0LCBzbyBsb29rIGZvciB0aGUgbmV4dCBvbmVcbiAgICAgIHdvcmRFbmQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uICAgICAgKHdvcmRSZWdleDogQGtleXdvcmRSZWdleCwgYWxsb3dOZXh0OiB0cnVlKVxuICAgICAgcmV0dXJuIFwiXCIgaWYgd29yZEVuZC5yb3cgaXNudCBjdXJzb3JQb3NpdGlvbi5yb3cgIyBkb24ndCBsb29rIGJleW9uZCB0aGUgY3VycmVudCBsaW5lXG5cbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbiB3b3JkRW5kXG4gICAgICB3b3JkU3RhcnQgPSBjdXJzb3IuZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHdvcmRSZWdleDogQGtleXdvcmRSZWdleCwgYWxsb3dQcmV2aW91czogZmFsc2UpXG5cbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24gd29yZFN0YXJ0XG5cbiAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFt3b3JkU3RhcnQsIHdvcmRFbmRdKVxuXG4gIGN1cnNvcklzT25FT0Y6IChjdXJzb3IpIC0+XG4gICAgcG9zID0gY3Vyc29yLmdldE5leHRXb3JkQm91bmRhcnlCdWZmZXJQb3NpdGlvbih3b3JkUmVnZXg6IEBrZXl3b3JkUmVnZXgpXG4gICAgZW9mUG9zID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgcG9zLnJvdyBpcyBlb2ZQb3Mucm93IGFuZCBwb3MuY29sdW1uIGlzIGVvZlBvcy5jb2x1bW5cblxuICBnZXRDdXJyZW50V29yZE1hdGNoOiAtPlxuICAgIGNoYXJhY3RlcnMgPSBAZ2V0Q3VycmVudFdvcmQoKVxuICAgIGlmIGNoYXJhY3RlcnMubGVuZ3RoID4gMFxuICAgICAgaWYgL1xcVy8udGVzdChjaGFyYWN0ZXJzKSB0aGVuIFwiI3tjaGFyYWN0ZXJzfVxcXFxiXCIgZWxzZSBcIlxcXFxiI3tjaGFyYWN0ZXJzfVxcXFxiXCJcbiAgICBlbHNlXG4gICAgICBjaGFyYWN0ZXJzXG5cbiAgaXNDb21wbGV0ZTogLT4gdHJ1ZVxuXG4gIGV4ZWN1dGU6IChjb3VudD0xKSAtPlxuICAgIHN1cGVyKGNvdW50KSBpZiBAaW5wdXQuY2hhcmFjdGVycy5sZW5ndGggPiAwXG5cbk9wZW5CcmFja2V0cyA9IFsnKCcsICd7JywgJ1snXVxuQ2xvc2VCcmFja2V0cyA9IFsnKScsICd9JywgJ10nXVxuQW55QnJhY2tldCA9IG5ldyBSZWdFeHAoT3BlbkJyYWNrZXRzLmNvbmNhdChDbG9zZUJyYWNrZXRzKS5tYXAoXy5lc2NhcGVSZWdFeHApLmpvaW4oXCJ8XCIpKVxuXG5jbGFzcyBCcmFja2V0TWF0Y2hpbmdNb3Rpb24gZXh0ZW5kcyBTZWFyY2hCYXNlXG4gIG9wZXJhdGVzSW5jbHVzaXZlbHk6IHRydWVcblxuICBpc0NvbXBsZXRlOiAtPiB0cnVlXG5cbiAgc2VhcmNoRm9yTWF0Y2g6IChzdGFydFBvc2l0aW9uLCByZXZlcnNlLCBpbkNoYXJhY3Rlciwgb3V0Q2hhcmFjdGVyKSAtPlxuICAgIGRlcHRoID0gMFxuICAgIHBvaW50ID0gc3RhcnRQb3NpdGlvbi5jb3B5KClcbiAgICBsaW5lTGVuZ3RoID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb2ludC5yb3cpLmxlbmd0aFxuICAgIGVvZlBvc2l0aW9uID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZShbMCwgMV0pXG4gICAgaW5jcmVtZW50ID0gaWYgcmV2ZXJzZSB0aGVuIC0xIGVsc2UgMVxuXG4gICAgbG9vcFxuICAgICAgY2hhcmFjdGVyID0gQGNoYXJhY3RlckF0KHBvaW50KVxuICAgICAgZGVwdGgrKyBpZiBjaGFyYWN0ZXIgaXMgaW5DaGFyYWN0ZXJcbiAgICAgIGRlcHRoLS0gaWYgY2hhcmFjdGVyIGlzIG91dENoYXJhY3RlclxuXG4gICAgICByZXR1cm4gcG9pbnQgaWYgZGVwdGggaXMgMFxuXG4gICAgICBwb2ludC5jb2x1bW4gKz0gaW5jcmVtZW50XG5cbiAgICAgIHJldHVybiBudWxsIGlmIGRlcHRoIDwgMFxuICAgICAgcmV0dXJuIG51bGwgaWYgcG9pbnQuaXNFcXVhbChbMCwgLTFdKVxuICAgICAgcmV0dXJuIG51bGwgaWYgcG9pbnQuaXNFcXVhbChlb2ZQb3NpdGlvbilcblxuICAgICAgaWYgcG9pbnQuY29sdW1uIDwgMFxuICAgICAgICBwb2ludC5yb3ctLVxuICAgICAgICBsaW5lTGVuZ3RoID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb2ludC5yb3cpLmxlbmd0aFxuICAgICAgICBwb2ludC5jb2x1bW4gPSBsaW5lTGVuZ3RoIC0gMVxuICAgICAgZWxzZSBpZiBwb2ludC5jb2x1bW4gPj0gbGluZUxlbmd0aFxuICAgICAgICBwb2ludC5yb3crK1xuICAgICAgICBsaW5lTGVuZ3RoID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb2ludC5yb3cpLmxlbmd0aFxuICAgICAgICBwb2ludC5jb2x1bW4gPSAwXG5cbiAgY2hhcmFjdGVyQXQ6IChwb3NpdGlvbikgLT5cbiAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtwb3NpdGlvbiwgcG9zaXRpb24udHJhbnNsYXRlKFswLCAxXSldKVxuXG4gIGdldFNlYXJjaERhdGE6IChwb3NpdGlvbikgLT5cbiAgICBjaGFyYWN0ZXIgPSBAY2hhcmFjdGVyQXQocG9zaXRpb24pXG4gICAgaWYgKGluZGV4ID0gT3BlbkJyYWNrZXRzLmluZGV4T2YoY2hhcmFjdGVyKSkgPj0gMFxuICAgICAgW2NoYXJhY3RlciwgQ2xvc2VCcmFja2V0c1tpbmRleF0sIGZhbHNlXVxuICAgIGVsc2UgaWYgKGluZGV4ID0gQ2xvc2VCcmFja2V0cy5pbmRleE9mKGNoYXJhY3RlcikpID49IDBcbiAgICAgIFtjaGFyYWN0ZXIsIE9wZW5CcmFja2V0c1tpbmRleF0sIHRydWVdXG4gICAgZWxzZVxuICAgICAgW11cblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHN0YXJ0UG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgW2luQ2hhcmFjdGVyLCBvdXRDaGFyYWN0ZXIsIHJldmVyc2VdID0gQGdldFNlYXJjaERhdGEoc3RhcnRQb3NpdGlvbilcblxuICAgIHVubGVzcyBpbkNoYXJhY3Rlcj9cbiAgICAgIHJlc3RPZkxpbmUgPSBbc3RhcnRQb3NpdGlvbiwgW3N0YXJ0UG9zaXRpb24ucm93LCBJbmZpbml0eV1dXG4gICAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIEFueUJyYWNrZXQsIHJlc3RPZkxpbmUsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgICBzdGFydFBvc2l0aW9uID0gcmFuZ2Uuc3RhcnRcbiAgICAgICAgc3RvcCgpXG5cbiAgICBbaW5DaGFyYWN0ZXIsIG91dENoYXJhY3RlciwgcmV2ZXJzZV0gPSBAZ2V0U2VhcmNoRGF0YShzdGFydFBvc2l0aW9uKVxuXG4gICAgcmV0dXJuIHVubGVzcyBpbkNoYXJhY3Rlcj9cblxuICAgIGlmIG1hdGNoUG9zaXRpb24gPSBAc2VhcmNoRm9yTWF0Y2goc3RhcnRQb3NpdGlvbiwgcmV2ZXJzZSwgaW5DaGFyYWN0ZXIsIG91dENoYXJhY3RlcilcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihtYXRjaFBvc2l0aW9uKVxuXG5jbGFzcyBSZXBlYXRTZWFyY2ggZXh0ZW5kcyBTZWFyY2hCYXNlXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlKSAtPlxuICAgIHN1cGVyKEBlZGl0b3IsIEB2aW1TdGF0ZSwgZG9udFVwZGF0ZUN1cnJlbnRTZWFyY2g6IHRydWUpXG4gICAgQGlucHV0ID0gbmV3IElucHV0KEB2aW1TdGF0ZS5nZXRTZWFyY2hIaXN0b3J5SXRlbSgwKSA/IFwiXCIpXG4gICAgQHJlcGxpY2F0ZUN1cnJlbnRTZWFyY2goKVxuXG4gIGlzQ29tcGxldGU6IC0+IHRydWVcblxuICByZXZlcnNlZDogLT5cbiAgICBAcmV2ZXJzZSA9IG5vdCBAaW5pdGlhbGx5UmV2ZXJzZWRcbiAgICB0aGlzXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7U2VhcmNoLCBTZWFyY2hDdXJyZW50V29yZCwgQnJhY2tldE1hdGNoaW5nTW90aW9uLCBSZXBlYXRTZWFyY2h9XG4iXX0=
