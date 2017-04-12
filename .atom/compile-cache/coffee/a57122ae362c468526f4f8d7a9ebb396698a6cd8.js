(function() {
  var OperatorWithInput, Range, Replace, ViewModel, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  OperatorWithInput = require('./general-operators').OperatorWithInput;

  ViewModel = require('../view-models/view-model').ViewModel;

  Range = require('atom').Range;

  module.exports = Replace = (function(superClass) {
    extend(Replace, superClass);

    function Replace(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
      Replace.__super__.constructor.call(this, this.editor, this.vimState);
      this.viewModel = new ViewModel(this, {
        "class": 'replace',
        hidden: true,
        singleChar: true,
        defaultText: '\n'
      });
    }

    Replace.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      if (this.input.characters === "") {
        if (this.vimState.mode === "visual") {
          this.vimState.resetVisualMode();
        } else {
          this.vimState.activateNormalMode();
        }
        return;
      }
      this.editor.transact((function(_this) {
        return function() {
          var currentRowLength, cursor, i, j, len, len1, point, pos, ref, ref1, results, selection;
          if (_this.motion != null) {
            if (_.contains(_this.motion.select(), true)) {
              _this.editor.replaceSelectedText(null, function(text) {
                return text.replace(/./g, _this.input.characters);
              });
              ref = _this.editor.getSelections();
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                selection = ref[i];
                point = selection.getBufferRange().start;
                results.push(selection.setBufferRange(Range.fromPointWithDelta(point, 0, 0)));
              }
              return results;
            }
          } else {
            ref1 = _this.editor.getCursors();
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              cursor = ref1[j];
              pos = cursor.getBufferPosition();
              currentRowLength = _this.editor.lineTextForBufferRow(pos.row).length;
              if (!(currentRowLength - pos.column >= count)) {
                continue;
              }
              _.times(count, function() {
                point = cursor.getBufferPosition();
                _this.editor.setTextInBufferRange(Range.fromPointWithDelta(point, 0, 1), _this.input.characters);
                return cursor.moveRight();
              });
              cursor.setBufferPosition(pos);
            }
            if (_this.input.characters === "\n") {
              _.times(count, function() {
                return _this.editor.moveDown();
              });
              return _this.editor.moveToFirstCharacterOfLine();
            }
          }
        };
      })(this));
      return this.vimState.activateNormalMode();
    };

    return Replace;

  })(OperatorWithInput);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvb3BlcmF0b3JzL3JlcGxhY2Utb3BlcmF0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrQ0FBQTtJQUFBOzs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILG9CQUFxQixPQUFBLENBQVEscUJBQVI7O0VBQ3JCLFlBQWEsT0FBQSxDQUFRLDJCQUFSOztFQUNiLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1MsaUJBQUMsTUFBRCxFQUFVLFFBQVY7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxXQUFEO01BQ3JCLHlDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsSUFBQyxDQUFBLFFBQWhCO01BQ0EsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxTQUFBLENBQVUsSUFBVixFQUFnQjtRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtRQUFrQixNQUFBLEVBQVEsSUFBMUI7UUFBZ0MsVUFBQSxFQUFZLElBQTVDO1FBQWtELFdBQUEsRUFBYSxJQUEvRDtPQUFoQjtJQUZOOztzQkFJYixPQUFBLEdBQVMsU0FBQyxLQUFEOztRQUFDLFFBQU07O01BQ2QsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsS0FBcUIsRUFBeEI7UUFHRSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixLQUFrQixRQUFyQjtVQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsZUFBVixDQUFBLEVBREY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxrQkFBVixDQUFBLEVBSEY7O0FBS0EsZUFSRjs7TUFVQSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2YsY0FBQTtVQUFBLElBQUcsb0JBQUg7WUFDRSxJQUFHLENBQUMsQ0FBQyxRQUFGLENBQVcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQUEsQ0FBWCxFQUE2QixJQUE3QixDQUFIO2NBQ0UsS0FBQyxDQUFBLE1BQU0sQ0FBQyxtQkFBUixDQUE0QixJQUE1QixFQUFrQyxTQUFDLElBQUQ7dUJBQ2hDLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYixFQUFtQixLQUFDLENBQUEsS0FBSyxDQUFDLFVBQTFCO2NBRGdDLENBQWxDO0FBRUE7QUFBQTttQkFBQSxxQ0FBQTs7Z0JBQ0UsS0FBQSxHQUFRLFNBQVMsQ0FBQyxjQUFWLENBQUEsQ0FBMEIsQ0FBQzs2QkFDbkMsU0FBUyxDQUFDLGNBQVYsQ0FBeUIsS0FBSyxDQUFDLGtCQUFOLENBQXlCLEtBQXpCLEVBQWdDLENBQWhDLEVBQW1DLENBQW5DLENBQXpCO0FBRkY7NkJBSEY7YUFERjtXQUFBLE1BQUE7QUFRRTtBQUFBLGlCQUFBLHdDQUFBOztjQUNFLEdBQUEsR0FBTSxNQUFNLENBQUMsaUJBQVAsQ0FBQTtjQUNOLGdCQUFBLEdBQW1CLEtBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsR0FBRyxDQUFDLEdBQWpDLENBQXFDLENBQUM7Y0FDekQsSUFBQSxDQUFBLENBQWdCLGdCQUFBLEdBQW1CLEdBQUcsQ0FBQyxNQUF2QixJQUFpQyxLQUFqRCxDQUFBO0FBQUEseUJBQUE7O2NBRUEsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtnQkFDYixLQUFBLEdBQVEsTUFBTSxDQUFDLGlCQUFQLENBQUE7Z0JBQ1IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixLQUFLLENBQUMsa0JBQU4sQ0FBeUIsS0FBekIsRUFBZ0MsQ0FBaEMsRUFBbUMsQ0FBbkMsQ0FBN0IsRUFBb0UsS0FBQyxDQUFBLEtBQUssQ0FBQyxVQUEzRTt1QkFDQSxNQUFNLENBQUMsU0FBUCxDQUFBO2NBSGEsQ0FBZjtjQUlBLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixHQUF6QjtBQVRGO1lBYUEsSUFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsS0FBcUIsSUFBeEI7Y0FDRSxDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO3VCQUNiLEtBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBO2NBRGEsQ0FBZjtxQkFFQSxLQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQUEsRUFIRjthQXJCRjs7UUFEZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7YUEyQkEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxrQkFBVixDQUFBO0lBdENPOzs7O0tBTFc7QUFOdEIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue09wZXJhdG9yV2l0aElucHV0fSA9IHJlcXVpcmUgJy4vZ2VuZXJhbC1vcGVyYXRvcnMnXG57Vmlld01vZGVsfSA9IHJlcXVpcmUgJy4uL3ZpZXctbW9kZWxzL3ZpZXctbW9kZWwnXG57UmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUmVwbGFjZSBleHRlbmRzIE9wZXJhdG9yV2l0aElucHV0XG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlKSAtPlxuICAgIHN1cGVyKEBlZGl0b3IsIEB2aW1TdGF0ZSlcbiAgICBAdmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLCBjbGFzczogJ3JlcGxhY2UnLCBoaWRkZW46IHRydWUsIHNpbmdsZUNoYXI6IHRydWUsIGRlZmF1bHRUZXh0OiAnXFxuJylcblxuICBleGVjdXRlOiAoY291bnQ9MSkgLT5cbiAgICBpZiBAaW5wdXQuY2hhcmFjdGVycyBpcyBcIlwiXG4gICAgICAjIHJlcGxhY2UgY2FuY2VsZWRcblxuICAgICAgaWYgQHZpbVN0YXRlLm1vZGUgaXMgXCJ2aXN1YWxcIlxuICAgICAgICBAdmltU3RhdGUucmVzZXRWaXN1YWxNb2RlKClcbiAgICAgIGVsc2VcbiAgICAgICAgQHZpbVN0YXRlLmFjdGl2YXRlTm9ybWFsTW9kZSgpXG5cbiAgICAgIHJldHVyblxuXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgaWYgQG1vdGlvbj9cbiAgICAgICAgaWYgXy5jb250YWlucyhAbW90aW9uLnNlbGVjdCgpLCB0cnVlKVxuICAgICAgICAgIEBlZGl0b3IucmVwbGFjZVNlbGVjdGVkVGV4dCBudWxsLCAodGV4dCkgPT5cbiAgICAgICAgICAgIHRleHQucmVwbGFjZSgvLi9nLCBAaW5wdXQuY2hhcmFjdGVycylcbiAgICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgICBwb2ludCA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHBvaW50LCAwLCAwKSlcbiAgICAgIGVsc2VcbiAgICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgICAgIHBvcyA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgICAgY3VycmVudFJvd0xlbmd0aCA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocG9zLnJvdykubGVuZ3RoXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIGN1cnJlbnRSb3dMZW5ndGggLSBwb3MuY29sdW1uID49IGNvdW50XG5cbiAgICAgICAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9pbnQsIDAsIDEpLCBAaW5wdXQuY2hhcmFjdGVycylcbiAgICAgICAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb3MpXG5cbiAgICAgICAgIyBTcGVjaWFsIGNhc2U6IHdoZW4gcmVwbGFjZWQgd2l0aCBhIG5ld2xpbmUgbW92ZSB0byB0aGUgc3RhcnQgb2YgdGhlXG4gICAgICAgICMgbmV4dCByb3cuXG4gICAgICAgIGlmIEBpbnB1dC5jaGFyYWN0ZXJzIGlzIFwiXFxuXCJcbiAgICAgICAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgICAgICAgQGVkaXRvci5tb3ZlRG93bigpXG4gICAgICAgICAgQGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbiAgICBAdmltU3RhdGUuYWN0aXZhdGVOb3JtYWxNb2RlKClcbiJdfQ==
