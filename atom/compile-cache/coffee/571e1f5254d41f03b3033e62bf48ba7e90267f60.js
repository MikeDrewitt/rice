(function() {
  var CompositeDisposable, Range, SelectNext, _, ref;

  _ = require('underscore-plus');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Range = ref.Range;

  module.exports = SelectNext = (function() {
    SelectNext.prototype.selectionRanges = null;

    function SelectNext(editor) {
      this.editor = editor;
      this.selectionRanges = [];
    }

    SelectNext.prototype.findAndSelectNext = function() {
      if (this.editor.getLastSelection().isEmpty()) {
        return this.selectWord();
      } else {
        return this.selectNextOccurrence();
      }
    };

    SelectNext.prototype.findAndSelectAll = function() {
      if (this.editor.getLastSelection().isEmpty()) {
        this.selectWord();
      }
      return this.selectAllOccurrences();
    };

    SelectNext.prototype.undoLastSelection = function() {
      this.updateSavedSelections();
      if (this.selectionRanges.length < 1) {
        return;
      }
      if (this.selectionRanges.length > 1) {
        this.selectionRanges.pop();
        this.editor.setSelectedBufferRanges(this.selectionRanges);
      } else {
        this.editor.clearSelections();
      }
      return this.editor.scrollToCursorPosition();
    };

    SelectNext.prototype.skipCurrentSelection = function() {
      var lastSelection;
      this.updateSavedSelections();
      if (this.selectionRanges.length < 1) {
        return;
      }
      if (this.selectionRanges.length > 1) {
        lastSelection = this.selectionRanges.pop();
        this.editor.setSelectedBufferRanges(this.selectionRanges);
        return this.selectNextOccurrence({
          start: lastSelection.end
        });
      } else {
        this.selectNextOccurrence();
        this.selectionRanges.shift();
        if (this.selectionRanges.length < 1) {
          return;
        }
        return this.editor.setSelectedBufferRanges(this.selectionRanges);
      }
    };

    SelectNext.prototype.selectWord = function() {
      var clearWordSelected, disposables, lastSelection;
      this.editor.selectWordsContainingCursors();
      lastSelection = this.editor.getLastSelection();
      if (this.wordSelected = this.isWordSelected(lastSelection)) {
        disposables = new CompositeDisposable;
        clearWordSelected = (function(_this) {
          return function() {
            _this.wordSelected = null;
            return disposables.dispose();
          };
        })(this);
        disposables.add(lastSelection.onDidChangeRange(clearWordSelected));
        return disposables.add(lastSelection.onDidDestroy(clearWordSelected));
      }
    };

    SelectNext.prototype.selectAllOccurrences = function() {
      var range;
      range = [[0, 0], this.editor.getEofBufferPosition()];
      return this.scanForNextOccurrence(range, (function(_this) {
        return function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          return _this.addSelection(range);
        };
      })(this));
    };

    SelectNext.prototype.selectNextOccurrence = function(options) {
      var range, ref1, startingRange;
      if (options == null) {
        options = {};
      }
      startingRange = (ref1 = options.start) != null ? ref1 : this.editor.getSelectedBufferRange().end;
      range = this.findNextOccurrence([startingRange, this.editor.getEofBufferPosition()]);
      if (range == null) {
        range = this.findNextOccurrence([[0, 0], this.editor.getSelections()[0].getBufferRange().start]);
      }
      if (range != null) {
        return this.addSelection(range);
      }
    };

    SelectNext.prototype.findNextOccurrence = function(scanRange) {
      var foundRange;
      foundRange = null;
      this.scanForNextOccurrence(scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        foundRange = range;
        return stop();
      });
      return foundRange;
    };

    SelectNext.prototype.addSelection = function(range) {
      var selection;
      selection = this.editor.addSelectionForBufferRange(range);
      return this.updateSavedSelections(selection);
    };

    SelectNext.prototype.scanForNextOccurrence = function(range, callback) {
      var nonWordCharacters, selection, text;
      selection = this.editor.getLastSelection();
      text = _.escapeRegExp(selection.getText());
      if (this.wordSelected) {
        nonWordCharacters = atom.config.get('editor.nonWordCharacters');
        text = "(^|[ \t" + (_.escapeRegExp(nonWordCharacters)) + "]+)" + text + "(?=$|[\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+)";
      }
      return this.editor.scanInBufferRange(new RegExp(text, 'g'), range, function(result) {
        var prefix;
        if (prefix = result.match[1]) {
          result.range = result.range.translate([0, prefix.length], [0, 0]);
        }
        return callback(result);
      });
    };

    SelectNext.prototype.updateSavedSelections = function(selection) {
      var i, len, results, s, selectionRange, selections;
      if (selection == null) {
        selection = null;
      }
      selections = this.editor.getSelections();
      if (selections.length < 3) {
        this.selectionRanges = [];
      }
      if (this.selectionRanges.length === 0) {
        results = [];
        for (i = 0, len = selections.length; i < len; i++) {
          s = selections[i];
          results.push(this.selectionRanges.push(s.getBufferRange()));
        }
        return results;
      } else if (selection) {
        selectionRange = selection.getBufferRange();
        if (this.selectionRanges.some(function(existingRange) {
          return existingRange.isEqual(selectionRange);
        })) {
          return;
        }
        return this.selectionRanges.push(selectionRange);
      }
    };

    SelectNext.prototype.isNonWordCharacter = function(character) {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp("[ \t" + (_.escapeRegExp(nonWordCharacters)) + "]").test(character);
    };

    SelectNext.prototype.isNonWordCharacterToTheLeft = function(selection) {
      var range, selectionStart;
      selectionStart = selection.getBufferRange().start;
      range = Range.fromPointWithDelta(selectionStart, 0, -1);
      return this.isNonWordCharacter(this.editor.getTextInBufferRange(range));
    };

    SelectNext.prototype.isNonWordCharacterToTheRight = function(selection) {
      var range, selectionEnd;
      selectionEnd = selection.getBufferRange().end;
      range = Range.fromPointWithDelta(selectionEnd, 0, 1);
      return this.isNonWordCharacter(this.editor.getTextInBufferRange(range));
    };

    SelectNext.prototype.isWordSelected = function(selection) {
      var containsOnlyWordCharacters, lineRange, nonWordCharacterToTheLeft, nonWordCharacterToTheRight, selectionRange;
      if (selection.getBufferRange().isSingleLine()) {
        selectionRange = selection.getBufferRange();
        lineRange = this.editor.bufferRangeForBufferRow(selectionRange.start.row);
        nonWordCharacterToTheLeft = _.isEqual(selectionRange.start, lineRange.start) || this.isNonWordCharacterToTheLeft(selection);
        nonWordCharacterToTheRight = _.isEqual(selectionRange.end, lineRange.end) || this.isNonWordCharacterToTheRight(selection);
        containsOnlyWordCharacters = !this.isNonWordCharacter(selection.getText());
        return nonWordCharacterToTheLeft && nonWordCharacterToTheRight && containsOnlyWordCharacters;
      } else {
        return false;
      }
    };

    return SelectNext;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9zZWxlY3QtbmV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyw2Q0FBRCxFQUFzQjs7RUFLdEIsTUFBTSxDQUFDLE9BQVAsR0FDTTt5QkFDSixlQUFBLEdBQWlCOztJQUVKLG9CQUFDLE1BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CO0lBRFI7O3lCQUdiLGlCQUFBLEdBQW1CLFNBQUE7TUFDakIsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBMEIsQ0FBQyxPQUEzQixDQUFBLENBQUg7ZUFDRSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIRjs7SUFEaUI7O3lCQU1uQixnQkFBQSxHQUFrQixTQUFBO01BQ2hCLElBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUEwQixDQUFDLE9BQTNCLENBQUEsQ0FBakI7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O2FBQ0EsSUFBQyxDQUFBLG9CQUFELENBQUE7SUFGZ0I7O3lCQUlsQixpQkFBQSxHQUFtQixTQUFBO01BQ2pCLElBQUMsQ0FBQSxxQkFBRCxDQUFBO01BRUEsSUFBVSxJQUFDLENBQUEsZUFBZSxDQUFDLE1BQWpCLEdBQTBCLENBQXBDO0FBQUEsZUFBQTs7TUFFQSxJQUFHLElBQUMsQ0FBQSxlQUFlLENBQUMsTUFBakIsR0FBMEIsQ0FBN0I7UUFDRSxJQUFDLENB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QUMsT0FBRixDQUFVLGNBQWMsQ0FBQyxHQUF6QixFQUE4QixTQUFTLENBQUMsR0FBeEMsQ0FBQSxJQUMzQixJQUFDLENBQUEsNEJBQUQsQ0FBOEIsU0FBOUI7UUFDRiwwQkFBQSxHQUE2QixDQUFJLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFTLENBQUMsT0FBVixDQUFBLENBQXBCO2VBRWpDLHlCQUFBLElBQThCLDBCQUE5QixJQUE2RCwyQkFUL0Q7T0FBQSxNQUFBO2VBV0UsTUFYRjs7SUFEYzs7Ozs7QUF6SGxCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG4jIEZpbmQgYW5kIHNlbGVjdCB0aGUgbmV4dCBvY2N1cnJlbmNlIG9mIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgdGV4dC5cbiNcbiMgVGhlIHdvcmQgdW5kZXIgdGhlIGN1cnNvciB3aWxsIGJlIHNlbGVjdGVkIGlmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHkuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWxlY3ROZXh0XG4gIHNlbGVjdGlvblJhbmdlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT5cbiAgICBAc2VsZWN0aW9uUmFuZ2VzID0gW11cblxuICBmaW5kQW5kU2VsZWN0TmV4dDogLT5cbiAgICBpZiBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICAgIEBzZWxlY3RXb3JkKClcbiAgICBlbHNlXG4gICAgICBAc2VsZWN0TmV4dE9jY3VycmVuY2UoKVxuXG4gIGZpbmRBbmRTZWxlY3RBbGw6IC0+XG4gICAgQHNlbGVjdFdvcmQoKSBpZiBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICBAc2VsZWN0QWxsT2NjdXJyZW5jZXMoKVxuXG4gIHVuZG9MYXN0U2VsZWN0aW9uOiAtPlxuICAgIEB1cGRhdGVTYXZlZFNlbGVjdGlvbnMoKVxuXG4gICAgcmV0dXJuIGlmIEBzZWxlY3Rpb25SYW5nZXMubGVuZ3RoIDwgMVxuXG4gICAgaWYgQHNlbGVjdGlvblJhbmdlcy5sZW5ndGggPiAxXG4gICAgICBAc2VsZWN0aW9uUmFuZ2VzLnBvcCgpXG4gICAgICBAZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzIEBzZWxlY3Rpb25SYW5nZXNcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICBAZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuXG4gIHNraXBDdXJyZW50U2VsZWN0aW9uOiAtPlxuICAgIEB1cGRhdGVTYXZlZFNlbGVjdGlvbnMoKVxuXG4gICAgcmV0dXJuIGlmIEBzZWxlY3Rpb25SYW5nZXMubGVuZ3RoIDwgMVxuXG4gICAgaWYgQHNlbGVjdGlvblJhbmdlcy5sZW5ndGggPiAxXG4gICAgICBsYXN0U2VsZWN0aW9uID0gQHNlbGVjdGlvblJhbmdlcy5wb3AoKVxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyBAc2VsZWN0aW9uUmFuZ2VzXG4gICAgICBAc2VsZWN0TmV4dE9jY3VycmVuY2Uoc3RhcnQ6IGxhc3RTZWxlY3Rpb24uZW5kKVxuICAgIGVsc2VcbiAgICAgIEBzZWxlY3ROZXh0T2NjdXJyZW5jZSgpXG4gICAgICBAc2VsZWN0aW9uUmFuZ2VzLnNoaWZ0KClcbiAgICAgIHJldHVybiBpZiBAc2VsZWN0aW9uUmFuZ2VzLmxlbmd0aCA8IDFcbiAgICAgIEBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMgQHNlbGVjdGlvblJhbmdlc1xuXG4gIHNlbGVjdFdvcmQ6IC0+XG4gICAgQGVkaXRvci5zZWxlY3RXb3Jkc0NvbnRhaW5pbmdDdXJzb3JzKClcbiAgICBsYXN0U2VsZWN0aW9uID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKClcbiAgICBpZiBAd29yZFNlbGVjdGVkID0gQGlzV29yZFNlbGVjdGVkKGxhc3RTZWxlY3Rpb24pXG4gICAgICBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICBjbGVhcldvcmRTZWxlY3RlZCA9ID0+XG4gICAgICAgIEB3b3JkU2VsZWN0ZWQgPSBudWxsXG4gICAgICAgIGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgICAgZGlzcG9zYWJsZXMuYWRkIGxhc3RTZWxlY3Rpb24ub25EaWRDaGFuZ2VSYW5nZSBjbGVhcldvcmRTZWxlY3RlZFxuICAgICAgZGlzcG9zYWJsZXMuYWRkIGxhc3RTZWxlY3Rpb24ub25EaWREZXN0cm95IGNsZWFyV29yZFNlbGVjdGVkXG5cbiAgc2VsZWN0QWxsT2NjdXJyZW5jZXM6IC0+XG4gICAgcmFuZ2UgPSBbWzAsIDBdLCBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKCldXG4gICAgQHNjYW5Gb3JOZXh0T2NjdXJyZW5jZSByYW5nZSwgKHtyYW5nZSwgc3RvcH0pID0+XG4gICAgICBAYWRkU2VsZWN0aW9uKHJhbmdlKVxuXG4gIHNlbGVjdE5leHRPY2N1cnJlbmNlOiAob3B0aW9ucz17fSkgLT5cbiAgICBzdGFydGluZ1JhbmdlID0gb3B0aW9ucy5zdGFydCA/IEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpLmVuZFxuICAgIHJhbmdlID0gQGZpbmROZXh0T2NjdXJyZW5jZShbc3RhcnRpbmdSYW5nZSwgQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXSlcbiAgICByYW5nZSA/PSBAZmluZE5leHRPY2N1cnJlbmNlKFtbMCwgMF0sIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpWzBdLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRdKVxuICAgIEBhZGRTZWxlY3Rpb24ocmFuZ2UpIGlmIHJhbmdlP1xuXG4gIGZpbmROZXh0T2NjdXJyZW5jZTogKHNjYW5SYW5nZSkgLT5cbiAgICBmb3VuZFJhbmdlID0gbnVsbFxuICAgIEBzY2FuRm9yTmV4dE9jY3VycmVuY2Ugc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGZvdW5kUmFuZ2UgPSByYW5nZVxuICAgICAgc3RvcCgpXG4gICAgZm91bmRSYW5nZVxuXG4gIGFkZFNlbGVjdGlvbjogKHJhbmdlKSAtPlxuICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuYWRkU2VsZWN0aW9uRm9yQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgQHVwZGF0ZVNhdmVkU2VsZWN0aW9ucyBzZWxlY3Rpb25cblxuICBzY2FuRm9yTmV4dE9jY3VycmVuY2U6IChyYW5nZSwgY2FsbGJhY2spIC0+XG4gICAgc2VsZWN0aW9uID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKClcbiAgICB0ZXh0ID0gXy5lc2NhcGVSZWdFeHAoc2VsZWN0aW9uLmdldFRleHQoKSlcblxuICAgIGlmIEB3b3JkU2VsZWN0ZWRcbiAgICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKVxuICAgICAgdGV4dCA9IFwiKF58WyBcXHQje18uZXNjYXBlUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKX1dKykje3RleHR9KD89JHxbXFxcXHMje18uZXNjYXBlUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKX1dKylcIlxuXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBuZXcgUmVnRXhwKHRleHQsICdnJyksIHJhbmdlLCAocmVzdWx0KSAtPlxuICAgICAgaWYgcHJlZml4ID0gcmVzdWx0Lm1hdGNoWzFdXG4gICAgICAgIHJlc3VsdC5yYW5nZSA9IHJlc3VsdC5yYW5nZS50cmFuc2xhdGUoWzAsIHByZWZpeC5sZW5ndGhdLCBbMCwgMF0pXG4gICAgICBjYWxsYmFjayhyZXN1bHQpXG5cbiAgdXBkYXRlU2F2ZWRTZWxlY3Rpb25zOiAoc2VsZWN0aW9uPW51bGwpIC0+XG4gICAgc2VsZWN0aW9ucyA9IEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgQHNlbGVjdGlvblJhbmdlcyA9IFtdIGlmIHNlbGVjdGlvbnMubGVuZ3RoIDwgM1xuICAgIGlmIEBzZWxlY3Rpb25SYW5nZXMubGVuZ3RoIGlzIDBcbiAgICAgIEBzZWxlY3Rpb25SYW5nZXMucHVzaCBzLmdldEJ1ZmZlclJhbmdlKCkgZm9yIHMgaW4gc2VsZWN0aW9uc1xuICAgIGVsc2UgaWYgc2VsZWN0aW9uXG4gICAgICBzZWxlY3Rpb25SYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICByZXR1cm4gaWYgQHNlbGVjdGlvblJhbmdlcy5zb21lIChleGlzdGluZ1JhbmdlKSAtPiBleGlzdGluZ1JhbmdlLmlzRXF1YWwoc2VsZWN0aW9uUmFuZ2UpXG4gICAgICBAc2VsZWN0aW9uUmFuZ2VzLnB1c2ggc2VsZWN0aW9uUmFuZ2VcblxuICBpc05vbldvcmRDaGFyYWN0ZXI6IChjaGFyYWN0ZXIpIC0+XG4gICAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gICAgbmV3IFJlZ0V4cChcIlsgXFx0I3tfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XVwiKS50ZXN0KGNoYXJhY3RlcilcblxuICBpc05vbldvcmRDaGFyYWN0ZXJUb1RoZUxlZnQ6IChzZWxlY3Rpb24pIC0+XG4gICAgc2VsZWN0aW9uU3RhcnQgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgIHJhbmdlID0gUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHNlbGVjdGlvblN0YXJ0LCAwLCAtMSlcbiAgICBAaXNOb25Xb3JkQ2hhcmFjdGVyKEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuXG4gIGlzTm9uV29yZENoYXJhY3RlclRvVGhlUmlnaHQ6IChzZWxlY3Rpb24pIC0+XG4gICAgc2VsZWN0aW9uRW5kID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG4gICAgcmFuZ2UgPSBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoc2VsZWN0aW9uRW5kLCAwLCAxKVxuICAgIEBpc05vbldvcmRDaGFyYWN0ZXIoQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSkpXG5cbiAgaXNXb3JkU2VsZWN0ZWQ6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuaXNTaW5nbGVMaW5lKClcbiAgICAgIHNlbGVjdGlvblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIGxpbmVSYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coc2VsZWN0aW9uUmFuZ2Uuc3RhcnQucm93KVxuICAgICAgbm9uV29yZENoYXJhY3RlclRvVGhlTGVmdCA9IF8uaXNFcXVhbChzZWxlY3Rpb25SYW5nZS5zdGFydCwgbGluZVJhbmdlLnN0YXJ0KSBvclxuICAgICAgICBAaXNOb25Xb3JkQ2hhcmFjdGVyVG9UaGVMZWZ0KHNlbGVjdGlvbilcbiAgICAgIG5vbldvcmRDaGFyYWN0ZXJUb1RoZVJpZ2h0ID0gXy5pc0VxdWFsKHNlbGVjdGlvblJhbmdlLmVuZCwgbGluZVJhbmdlLmVuZCkgb3JcbiAgICAgICAgQGlzTm9uV29yZENoYXJhY3RlclRvVGhlUmlnaHQoc2VsZWN0aW9uKVxuICAgICAgY29udGFpbnNPbmx5V29yZENoYXJhY3RlcnMgPSBub3QgQGlzTm9uV29yZENoYXJhY3RlcihzZWxlY3Rpb24uZ2V0VGV4dCgpKVxuXG4gICAgICBub25Xb3JkQ2hhcmFjdGVyVG9UaGVMZWZ0IGFuZCBub25Xb3JkQ2hhcmFjdGVyVG9UaGVSaWdodCBhbmQgY29udGFpbnNPbmx5V29yZENoYXJhY3RlcnNcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuIl19
