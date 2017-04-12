(function() {
  var $$, Point, SelectListView, SymbolsView, fs, match, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  Point = require('atom').Point;

  ref = require('atom-space-pen-views'), $$ = ref.$$, SelectListView = ref.SelectListView;

  fs = require('fs-plus');

  match = require('fuzzaldrin').match;

  module.exports = SymbolsView = (function(superClass) {
    extend(SymbolsView, superClass);

    function SymbolsView() {
      return SymbolsView.__super__.constructor.apply(this, arguments);
    }

    SymbolsView.highlightMatches = function(context, name, matches, offsetIndex) {
      var i, lastIndex, len, matchIndex, matchedChars, unmatched;
      if (offsetIndex == null) {
        offsetIndex = 0;
      }
      lastIndex = 0;
      matchedChars = [];
      for (i = 0, len = matches.length; i < len; i++) {
        matchIndex = matches[i];
        matchIndex -= offsetIndex;
        if (matchIndex < 0) {
          continue;
        }
        unmatched = name.substring(lastIndex, matchIndex);
        if (unmatched) {
          if (matchedChars.length) {
            context.span(matchedChars.join(''), {
              "class": 'character-match'
            });
          }
          matchedChars = [];
          context.text(unmatched);
        }
        matchedChars.push(name[matchIndex]);
        lastIndex = matchIndex + 1;
      }
      if (matchedChars.length) {
        context.span(matchedChars.join(''), {
          "class": 'character-match'
        });
      }
      return context.text(name.substring(lastIndex));
    };

    SymbolsView.prototype.initialize = function(stack) {
      this.stack = stack;
      SymbolsView.__super__.initialize.apply(this, arguments);
      this.panel = atom.workspace.addModalPanel({
        item: this,
        visible: false
      });
      return this.addClass('symbols-view');
    };

    SymbolsView.prototype.destroy = function() {
      this.cancel();
      return this.panel.destroy();
    };

    SymbolsView.prototype.getFilterKey = function() {
      return 'name';
    };

    SymbolsView.prototype.viewForItem = function(arg) {
      var directory, file, matches, name, position;
      position = arg.position, name = arg.name, file = arg.file, directory = arg.directory;
      matches = match(name, this.getFilterQuery());
      if (atom.project.getPaths().length > 1) {
        file = path.join(path.basename(directory), file);
      }
      return $$(function() {
        return this.li({
          "class": 'two-lines'
        }, (function(_this) {
          return function() {
            if (position != null) {
              _this.div(name + ":" + (position.row + 1), {
                "class": 'primary-line'
              });
            } else {
              _this.div({
                "class": 'primary-line'
              }, function() {
                return SymbolsView.highlightMatches(_this, name, matches);
              });
            }
            return _this.div(file, {
              "class": 'secondary-line'
            });
          };
        })(this));
      });
    };

    SymbolsView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'No symbols found';
      } else {
        return SymbolsView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    SymbolsView.prototype.cancelled = function() {
      return this.panel.hide();
    };

    SymbolsView.prototype.confirmed = function(tag) {
      if (tag.file && !fs.isFileSync(path.join(tag.directory, tag.file))) {
        this.setError('Selected file does not exist');
        return setTimeout(((function(_this) {
          return function() {
            return _this.setError();
          };
        })(this)), 2000);
      } else {
        this.cancel();
        return this.openTag(tag);
      }
    };

    SymbolsView.prototype.openTag = function(tag) {
      var editor, position, previous;
      if (editor = atom.workspace.getActiveTextEditor()) {
        previous = {
          editorId: editor.id,
          position: editor.getCursorBufferPosition(),
          file: editor.getURI()
        };
      }
      position = tag.position;
      if (!position) {
        position = this.getTagLine(tag);
      }
      if (tag.file) {
        atom.workspace.open(path.join(tag.directory, tag.file)).then((function(_this) {
          return function() {
            if (position) {
              return _this.moveToPosition(position);
            }
          };
        })(this));
      } else if (position && !(previous.position.isEqual(position))) {
        this.moveToPosition(position);
      }
      return this.stack.push(previous);
    };

    SymbolsView.prototype.moveToPosition = function(position, beginningOfLine) {
      var editor;
      if (beginningOfLine == null) {
        beginningOfLine = true;
      }
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor.scrollToBufferPosition(position, {
          center: true
        });
        editor.setCursorBufferPosition(position);
        if (beginningOfLine) {
          return editor.moveToFirstCharacterOfLine();
        }
      }
    };

    SymbolsView.prototype.attach = function() {
      this.storeFocusedElement();
      this.panel.show();
      return this.focusFilterEditor();
    };

    SymbolsView.prototype.getTagLine = function(tag) {
      var file, i, index, len, line, pattern, ref1, ref2;
      pattern = (ref1 = tag.pattern) != null ? ref1.replace(/(^^\/\^)|(\$\/$)/g, '').trim() : void 0;
      if (!pattern) {
        return;
      }
      file = path.join(tag.directory, tag.file);
      if (!fs.isFileSync(file)) {
        return;
      }
      ref2 = fs.readFileSync(file, 'utf8').split('\n');
      for (index = i = 0, len = ref2.length; i < len; index = ++i) {
        line = ref2[index];
        if (pattern === line.trim()) {
          return new Point(index, 0);
        }
      }
    };

    return SymbolsView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL3N5bWJvbHMtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDREQUFBO0lBQUE7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDTixRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUNWLE1BQXVCLE9BQUEsQ0FBUSxzQkFBUixDQUF2QixFQUFDLFdBQUQsRUFBSzs7RUFDTCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0osUUFBUyxPQUFBLENBQVEsWUFBUjs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osV0FBQyxDQUFBLGdCQUFELEdBQW1CLFNBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsT0FBaEIsRUFBeUIsV0FBekI7QUFDakIsVUFBQTs7UUFEMEMsY0FBWTs7TUFDdEQsU0FBQSxHQUFZO01BQ1osWUFBQSxHQUFlO0FBRWYsV0FBQSx5Q0FBQTs7UUFDRSxVQUFBLElBQWM7UUFDZCxJQUFZLFVBQUEsR0FBYSxDQUF6QjtBQUFBLG1CQUFBOztRQUNBLFNBQUEsR0FBWSxJQUFJLENBQUMsU0FBTCxDQUFlLFNBQWYsRUFBMEIsVUFBMUI7UUFDWixJQUFHLFNBQUg7VUFDRSxJQUFnRSxZQUFZLENBQUMsTUFBN0U7WUFBQSxPQUFPLENBQUMsSUFBUixDQUFhLFlBQVksQ0FBQyxJQUFiLENBQWtCLEVBQWxCLENBQWIsRUFBb0M7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGlCQUFQO2FBQXBDLEVBQUE7O1VBQ0EsWUFBQSxHQUFlO1VBQ2YsT0FBTyxDQUFDLElBQVIsQ0FBYSxTQUFiLEVBSEY7O1FBSUEsWUFBWSxDQUFDLElBQWIsQ0FBa0IsSUFBSyxDQUFBLFVBQUEsQ0FB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LFVBQUE7O1FBRHlCLGtCQUFnQjs7TUFDekMsSUFBRyxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQVo7UUFDRSxNQUFNLENBQUMsc0JBQVAsQ0FBOEIsUUFBOUIsRUFBd0M7VUFBQSxNQUFBLEVBQVEsSUFBUjtTQUF4QztRQUNBLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixRQUEvQjtRQUNBLElBQXVDLGVBQXZDO2lCQUFBLE1BQU0sQ0FBQywwQkFBUCxDQUFBLEVBQUE7U0FIRjs7SUFEYzs7MEJBTWhCLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBQyxDQUFBLG1CQUFELENBQUE7TUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBSE07OzBCQUtSLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFFVixVQUFBO01BQUEsT0FBQSxzQ0FBcUIsQ0FBRSxPQUFiLENBQXFCLG1CQUFyQixFQUEwQyxFQUExQyxDQUE2QyxDQUFDLElBQTlDLENBQUE7TUFFVixJQUFBLENBQWMsT0FBZDtBQUFBLGVBQUE7O01BQ0EsSUFBQSxHQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBRyxDQUFDLFNBQWQsRUFBeUIsR0FBRyxDQUFDLElBQTdCO01BQ1AsSUFBQSxDQUFjLEVBQUUsQ0FBQyxVQUFILENBQWMsSUFBZCxDQUFkO0FBQUEsZUFBQTs7QUFDQTtBQUFBLFdBQUEsc0RBQUE7O1FBQ0UsSUFBOEIsT0FBQSxLQUFXLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBekM7QUFBQSxpQkFBVyxJQUFBLEtBQUEsQ0FBTSxLQUFOLEVBQWEsQ0FBYixFQUFYOztBQURGO0lBUFU7Ozs7S0E1Rlk7QUFQMUIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbntQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xueyQkLCBTZWxlY3RMaXN0Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnttYXRjaH0gPSByZXF1aXJlICdmdXp6YWxkcmluJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTeW1ib2xzVmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3XG4gIEBoaWdobGlnaHRNYXRjaGVzOiAoY29udGV4dCwgbmFtZSwgbWF0Y2hlcywgb2Zmc2V0SW5kZXg9MCkgLT5cbiAgICBsYXN0SW5kZXggPSAwXG4gICAgbWF0Y2hlZENoYXJzID0gW10gIyBCdWlsZCB1cCBhIHNldCBvZiBtYXRjaGVkIGNoYXJzIHRvIGJlIG1vcmUgc2VtYW50aWNcblxuICAgIGZvciBtYXRjaEluZGV4IGluIG1hdGNoZXNcbiAgICAgIG1hdGNoSW5kZXggLT0gb2Zmc2V0SW5kZXhcbiAgICAgIGNvbnRpbnVlIGlmIG1hdGNoSW5kZXggPCAwICMgSWYgbWFya2luZyB1cCB0aGUgYmFzZW5hbWUsIG9taXQgbmFtZSBtYXRjaGVzXG4gICAgICB1bm1hdGNoZWQgPSBuYW1lLnN1YnN0cmluZyhsYXN0SW5kZXgsIG1hdGNoSW5kZXgpXG4gICAgICBpZiB1bm1hdGNoZWRcbiAgICAgICAgY29udGV4dC5zcGFuIG1hdGNoZWRDaGFycy5qb2luKCcnKSwgY2xhc3M6ICdjaGFyYWN0ZXItbWF0Y2gnIGlmIG1hdGNoZWRDaGFycy5sZW5ndGhcbiAgICAgICAgbWF0Y2hlZENoYXJzID0gW11cbiAgICAgICAgY29udGV4dC50ZXh0IHVubWF0Y2hlZFxuICAgICAgbWF0Y2hlZENoYXJzLnB1c2gobmFtZVttYXRjaEluZGV4XSlcbiAgICAgIGxhc3RJbmRleCA9IG1hdGNoSW5kZXggKyAxXG5cbiAgICBjb250ZXh0LnNwYW4gbWF0Y2hlZENoYXJzLmpvaW4oJycpLCBjbGFzczogJ2NoYXJhY3Rlci1tYXRjaCcgaWYgbWF0Y2hlZENoYXJzLmxlbmd0aFxuXG4gICAgIyBSZW1haW5pbmcgY2hhcmFjdGVycyBhcmUgcGxhaW4gdGV4dFxuICAgIGNvbnRleHQudGV4dCBuYW1lLnN1YnN0cmluZyhsYXN0SW5kZXgpXG5cbiAgaW5pdGlhbGl6ZTogKEBzdGFjaykgLT5cbiAgICBzdXBlclxuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcywgdmlzaWJsZTogZmFsc2UpXG4gICAgQGFkZENsYXNzKCdzeW1ib2xzLXZpZXcnKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGNhbmNlbCgpXG4gICAgQHBhbmVsLmRlc3Ryb3koKVxuXG4gIGdldEZpbHRlcktleTogLT4gJ25hbWUnXG5cbiAgdmlld0Zvckl0ZW06ICh7cG9zaXRpb24sIG5hbWUsIGZpbGUsIGRpcmVjdG9yeX0pIC0+XG4gICAgIyBTdHlsZSBtYXRjaGVkIGNoYXJhY3RlcnMgaW4gc2VhcmNoIHJlc3VsdHNcbiAgICBtYXRjaGVzID0gbWF0Y2gobmFtZSwgQGdldEZpbHRlclF1ZXJ5KCkpXG5cbiAgICBpZiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGggPiAxXG4gICAgICBmaWxlID0gcGF0aC5qb2luKHBhdGguYmFzZW5hbWUoZGlyZWN0b3J5KSwgZmlsZSlcblxuICAgICQkIC0+XG4gICAgICBAbGkgY2xhc3M6ICd0d28tbGluZXMnLCA9PlxuICAgICAgICBpZiBwb3NpdGlvbj9cbiAgICAgICAgICBAZGl2IFwiI3tuYW1lfToje3Bvc2l0aW9uLnJvdyArIDF9XCIsIGNsYXNzOiAncHJpbWFyeS1saW5lJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgQGRpdiBjbGFzczogJ3ByaW1hcnktbGluZScsID0+IFN5bWJvbHNWaWV3LmhpZ2hsaWdodE1hdGNoZXModGhpcywgbmFtZSwgbWF0Y2hlcylcbiAgICAgICAgQGRpdiBmaWxlLCBjbGFzczogJ3NlY29uZGFyeS1saW5lJ1xuXG4gIGdldEVtcHR5TWVzc2FnZTogKGl0ZW1Db3VudCkgLT5cbiAgICBpZiBpdGVtQ291bnQgaXMgMFxuICAgICAgJ05vIHN5bWJvbHMgZm91bmQnXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuICBjYW5jZWxsZWQ6IC0+XG4gICAgQHBhbmVsLmhpZGUoKVxuXG4gIGNvbmZpcm1lZDogKHRhZykgLT5cbiAgICBpZiB0YWcuZmlsZSBhbmQgbm90IGZzLmlzRmlsZVN5bmMocGF0aC5qb2luKHRhZy5kaXJlY3RvcnksIHRhZy5maWxlKSlcbiAgICAgIEBzZXRFcnJvcignU2VsZWN0ZWQgZmlsZSBkb2VzIG5vdCBleGlzdCcpXG4gICAgICBzZXRUaW1lb3V0KCg9PiBAc2V0RXJyb3IoKSksIDIwMDApXG4gICAgZWxzZVxuICAgICAgQGNhbmNlbCgpXG4gICAgICBAb3BlblRhZyh0YWcpXG5cbiAgb3BlblRhZzogKHRhZykgLT5cbiAgICBpZiBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIHByZXZpb3VzID1cbiAgICAgICAgZWRpdG9ySWQ6IGVkaXRvci5pZFxuICAgICAgICBwb3NpdGlvbjogZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgZmlsZTogZWRpdG9yLmdldFVSSSgpXG5cbiAgICB7cG9zaXRpb259ID0gdGFnXG4gICAgcG9zaXRpb24gPSBAZ2V0VGFnTGluZSh0YWcpIHVubGVzcyBwb3NpdGlvblxuICAgIGlmIHRhZy5maWxlXG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKHBhdGguam9pbih0YWcuZGlyZWN0b3J5LCB0YWcuZmlsZSkpLnRoZW4gPT5cbiAgICAgICAgQG1vdmVUb1Bvc2l0aW9uKHBvc2l0aW9uKSBpZiBwb3NpdGlvblxuICAgIGVsc2UgaWYgcG9zaXRpb24gYW5kIG5vdCAocHJldmlvdXMucG9zaXRpb24uaXNFcXVhbChwb3NpdGlvbikpXG4gICAgICBAbW92ZVRvUG9zaXRpb24ocG9zaXRpb24pXG5cbiAgICBAc3RhY2sucHVzaChwcmV2aW91cylcblxuICBtb3ZlVG9Qb3NpdGlvbjogKHBvc2l0aW9uLCBiZWdpbm5pbmdPZkxpbmU9dHJ1ZSkgLT5cbiAgICBpZiBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIGVkaXRvci5zY3JvbGxUb0J1ZmZlclBvc2l0aW9uKHBvc2l0aW9uLCBjZW50ZXI6IHRydWUpXG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG4gICAgICBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKSBpZiBiZWdpbm5pbmdPZkxpbmVcblxuICBhdHRhY2g6IC0+XG4gICAgQHN0b3JlRm9jdXNlZEVsZW1lbnQoKVxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIGdldFRhZ0xpbmU6ICh0YWcpIC0+XG4gICAgIyBSZW1vdmUgbGVhZGluZyAvXiBhbmQgdHJhaWxpbmcgJC9cbiAgICBwYXR0ZXJuID0gdGFnLnBhdHRlcm4/LnJlcGxhY2UoLyheXlxcL1xcXil8KFxcJFxcLyQpL2csICcnKS50cmltKClcblxuICAgIHJldHVybiB1bmxlc3MgcGF0dGVyblxuICAgIGZpbGUgPSBwYXRoLmpvaW4odGFnLmRpcmVjdG9yeSwgdGFnLmZpbGUpXG4gICAgcmV0dXJuIHVubGVzcyBmcy5pc0ZpbGVTeW5jKGZpbGUpXG4gICAgZm9yIGxpbmUsIGluZGV4IGluIGZzLnJlYWRGaWxlU3luYyhmaWxlLCAndXRmOCcpLnNwbGl0KCdcXG4nKVxuICAgICAgcmV0dXJuIG5ldyBQb2ludChpbmRleCwgMCkgaWYgcGF0dGVybiBpcyBsaW5lLnRyaW0oKVxuIl19
