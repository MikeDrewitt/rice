(function() {
  var $$, DiffListView, SelectListView, ref, repositoryForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $$ = ref.$$, SelectListView = ref.SelectListView;

  repositoryForPath = require('./helpers').repositoryForPath;

  module.exports = DiffListView = (function(superClass) {
    extend(DiffListView, superClass);

    function DiffListView() {
      return DiffListView.__super__.constructor.apply(this, arguments);
    }

    DiffListView.prototype.initialize = function() {
      DiffListView.__super__.initialize.apply(this, arguments);
      this.panel = atom.workspace.addModalPanel({
        item: this,
        visible: false
      });
      return this.addClass('diff-list-view');
    };

    DiffListView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'No diffs in file';
      } else {
        return DiffListView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    DiffListView.prototype.getFilterKey = function() {
      return 'lineText';
    };

    DiffListView.prototype.attach = function() {
      this.storeFocusedElement();
      this.panel.show();
      return this.focusFilterEditor();
    };

    DiffListView.prototype.viewForItem = function(arg) {
      var lineText, newLines, newStart, oldLines, oldStart;
      oldStart = arg.oldStart, newStart = arg.newStart, oldLines = arg.oldLines, newLines = arg.newLines, lineText = arg.lineText;
      return $$(function() {
        return this.li({
          "class": 'two-lines'
        }, (function(_this) {
          return function() {
            _this.div(lineText, {
              "class": 'primary-line'
            });
            return _this.div("-" + oldStart + "," + oldLines + " +" + newStart + "," + newLines, {
              "class": 'secondary-line'
            });
          };
        })(this));
      });
    };

    DiffListView.prototype.populate = function() {
      var bufferRow, diff, diffs, i, len, ref1, ref2, ref3, ref4;
      diffs = (ref1 = (ref2 = repositoryForPath(this.editor.getPath())) != null ? ref2.getLineDiffs(this.editor.getPath(), this.editor.getText()) : void 0) != null ? ref1 : [];
      for (i = 0, len = diffs.length; i < len; i++) {
        diff = diffs[i];
        bufferRow = diff.newStart > 0 ? diff.newStart - 1 : diff.newStart;
        diff.lineText = (ref3 = (ref4 = this.editor.lineTextForBufferRow(bufferRow)) != null ? ref4.trim() : void 0) != null ? ref3 : '';
      }
      return this.setItems(diffs);
    };

    DiffListView.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.cancel();
      } else if (this.editor = atom.workspace.getActiveTextEditor()) {
        this.populate();
        return this.attach();
      }
    };

    DiffListView.prototype.cancelled = function() {
      return this.panel.hide();
    };

    DiffListView.prototype.confirmed = function(arg) {
      var bufferRow, newStart;
      newStart = arg.newStart;
      this.cancel();
      bufferRow = newStart > 0 ? newStart - 1 : newStart;
      this.editor.setCursorBufferPosition([bufferRow, 0], {
        autoscroll: true
      });
      return this.editor.moveToFirstCharacterOfLine();
    };

    return DiffListView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9naXQtZGlmZi9saWIvZGlmZi1saXN0LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3REFBQTtJQUFBOzs7RUFBQSxNQUF1QixPQUFBLENBQVEsc0JBQVIsQ0FBdkIsRUFBQyxXQUFELEVBQUs7O0VBQ0osb0JBQXFCLE9BQUEsQ0FBUSxXQUFSOztFQUV0QixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzJCQUNKLFVBQUEsR0FBWSxTQUFBO01BQ1YsOENBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1FBQUEsSUFBQSxFQUFNLElBQU47UUFBWSxPQUFBLEVBQVMsS0FBckI7T0FBN0I7YUFDVCxJQUFDLENBQUEsUUFBRCxDQUFVLGdCQUFWO0lBSFU7OzJCQUtaLGVBQUEsR0FBaUIsU0FBQyxTQUFEO01BQ2YsSUFBRyxTQUFBLEtBQWEsQ0FBaEI7ZUFDRSxtQkFERjtPQUFBLE1BQUE7ZUFHRSxtREFBQSxTQUFBLEVBSEY7O0lBRGU7OzJCQU1qQixZQUFBLEdBQWMsU0FBQTthQUNaO0lBRFk7OzJCQUdkLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBQyxDQUFBLG1CQUFELENBQUE7TUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBSE07OzJCQUtSLFdBQUEsR0FBYSxTQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEseUJBQVUseUJBQVUseUJBQVUseUJBQVU7YUFDckQsRUFBQSxDQUFHLFNBQUE7ZUFDRCxJQUFDLENBQUEsRUFBRCxDQUFJO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUFQO1NBQUosRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUN0QixLQUFDLENBQUEsR0FBRCxDQUFLLFFBQUwsRUFBZTtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDthQUFmO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUssR0FBQSxHQUFJLFFBQUosR0FBYSxHQUFiLEdBQWdCLFFBQWhCLEdBQXlCLElBQXpCLEdBQTZCLFFBQTdCLEdBQXNDLEdBQXRDLEdBQXlDLFFBQTlDLEVBQTBEO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDthQUExRDtVQUZzQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEI7TUFEQyxDQUFIO0lBRFc7OzJCQU1iLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLEtBQUEsa0tBQW1HO0FBQ25HLFdBQUEsdUNBQUE7O1FBQ0UsU0FBQSxHQUFlLElBQUksQ0FBQyxRQUFMLEdBQWdCLENBQW5CLEdBQTBCLElBQUksQ0FBQyxRQUFMLEdBQWdCLENBQTFDLEdBQWlELElBQUksQ0FBQztRQUNsRSxJQUFJLENBQUMsUUFBTCxpSEFBa0U7QUFGcEU7YUFHQSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVY7SUFMUTs7MkJBT1YsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFBLENBQUg7ZUFDRSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBREY7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBYjtRQUNILElBQUMsQ0FBQSxRQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBRkc7O0lBSEM7OzJCQU9SLFNBQUEsR0FBVyxTQUFBO2FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7SUFEUzs7MkJBR1gsU0FBQSxHQUFXLFNBQUMsR0FBRDtBQUNULFVBQUE7TUFEVyxXQUFEO01BQ1YsSUFBQyxDQUFBLE1BQUQsQ0FBQTtNQUVBLFNBQUEsR0FBZSxRQUFBLEdBQVcsQ0FBZCxHQUFxQixRQUFBLEdBQVcsQ0FBaEMsR0FBdUM7TUFDbkQsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxDQUFDLFNBQUQsRUFBWSxDQUFaLENBQWhDLEVBQWdEO1FBQUEsVUFBQSxFQUFZLElBQVo7T0FBaEQ7YUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQUE7SUFMUzs7OztLQTNDYztBQUozQiIsInNvdXJjZXNDb250ZW50IjpbInskJCwgU2VsZWN0TGlzdFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57cmVwb3NpdG9yeUZvclBhdGh9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBEaWZmTGlzdFZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB0aGlzLCB2aXNpYmxlOiBmYWxzZSlcbiAgICBAYWRkQ2xhc3MoJ2RpZmYtbGlzdC12aWV3JylcblxuICBnZXRFbXB0eU1lc3NhZ2U6IChpdGVtQ291bnQpIC0+XG4gICAgaWYgaXRlbUNvdW50IGlzIDBcbiAgICAgICdObyBkaWZmcyBpbiBmaWxlJ1xuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgICdsaW5lVGV4dCdcblxuICBhdHRhY2g6IC0+XG4gICAgQHN0b3JlRm9jdXNlZEVsZW1lbnQoKVxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIHZpZXdGb3JJdGVtOiAoe29sZFN0YXJ0LCBuZXdTdGFydCwgb2xkTGluZXMsIG5ld0xpbmVzLCBsaW5lVGV4dH0pIC0+XG4gICAgJCQgLT5cbiAgICAgIEBsaSBjbGFzczogJ3R3by1saW5lcycsID0+XG4gICAgICAgIEBkaXYgbGluZVRleHQsIGNsYXNzOiAncHJpbWFyeS1saW5lJ1xuICAgICAgICBAZGl2IFwiLSN7b2xkU3RhcnR9LCN7b2xkTGluZXN9ICsje25ld1N0YXJ0fSwje25ld0xpbmVzfVwiLCBjbGFzczogJ3NlY29uZGFyeS1saW5lJ1xuXG4gIHBvcHVsYXRlOiAtPlxuICAgIGRpZmZzID0gcmVwb3NpdG9yeUZvclBhdGgoQGVkaXRvci5nZXRQYXRoKCkpPy5nZXRMaW5lRGlmZnMoQGVkaXRvci5nZXRQYXRoKCksIEBlZGl0b3IuZ2V0VGV4dCgpKSA/IFtdXG4gICAgZm9yIGRpZmYgaW4gZGlmZnNcbiAgICAgIGJ1ZmZlclJvdyA9IGlmIGRpZmYubmV3U3RhcnQgPiAwIHRoZW4gZGlmZi5uZXdTdGFydCAtIDEgZWxzZSBkaWZmLm5ld1N0YXJ0XG4gICAgICBkaWZmLmxpbmVUZXh0ID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhidWZmZXJSb3cpPy50cmltKCkgPyAnJ1xuICAgIEBzZXRJdGVtcyhkaWZmcylcblxuICB0b2dnbGU6IC0+XG4gICAgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlIGlmIEBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIEBwb3B1bGF0ZSgpXG4gICAgICBAYXR0YWNoKClcblxuICBjYW5jZWxsZWQ6IC0+XG4gICAgQHBhbmVsLmhpZGUoKVxuXG4gIGNvbmZpcm1lZDogKHtuZXdTdGFydH0pIC0+XG4gICAgQGNhbmNlbCgpXG5cbiAgICBidWZmZXJSb3cgPSBpZiBuZXdTdGFydCA+IDAgdGhlbiBuZXdTdGFydCAtIDEgZWxzZSBuZXdTdGFydFxuICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgMF0sIGF1dG9zY3JvbGw6IHRydWUpXG4gICAgQGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4iXX0=
