(function() {
  var Find, MotionWithInput, Point, Range, Till, ViewModel, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  MotionWithInput = require('./general-motions').MotionWithInput;

  ViewModel = require('../view-models/view-model').ViewModel;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Find = (function(superClass) {
    extend(Find, superClass);

    Find.prototype.operatesInclusively = true;

    function Find(editor, vimState, opts) {
      var orig;
      this.editor = editor;
      this.vimState = vimState;
      if (opts == null) {
        opts = {};
      }
      Find.__super__.constructor.call(this, this.editor, this.vimState);
      this.offset = 0;
      if (!opts.repeated) {
        this.viewModel = new ViewModel(this, {
          "class": 'find',
          singleChar: true,
          hidden: true
        });
        this.backwards = false;
        this.repeated = false;
        this.vimState.globalVimState.currentFind = this;
      } else {
        this.repeated = true;
        orig = this.vimState.globalVimState.currentFind;
        this.backwards = orig.backwards;
        this.complete = orig.complete;
        this.input = orig.input;
        if (opts.reverse) {
          this.reverse();
        }
      }
    }

    Find.prototype.match = function(cursor, count) {
      var currentPosition, i, index, j, k, line, ref1, ref2;
      currentPosition = cursor.getBufferPosition();
      line = this.editor.lineTextForBufferRow(currentPosition.row);
      if (this.backwards) {
        index = currentPosition.column;
        for (i = j = 0, ref1 = count - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
          if (index <= 0) {
            return;
          }
          index = line.lastIndexOf(this.input.characters, index - 1 - (this.offset * this.repeated));
        }
        if (index >= 0) {
          return new Point(currentPosition.row, index + this.offset);
        }
      } else {
        index = currentPosition.column;
        for (i = k = 0, ref2 = count - 1; 0 <= ref2 ? k <= ref2 : k >= ref2; i = 0 <= ref2 ? ++k : --k) {
          index = line.indexOf(this.input.characters, index + 1 + (this.offset * this.repeated));
          if (index < 0) {
            return;
          }
        }
        if (index >= 0) {
          return new Point(currentPosition.row, index - this.offset);
        }
      }
    };

    Find.prototype.reverse = function() {
      this.backwards = !this.backwards;
      return this;
    };

    Find.prototype.moveCursor = function(cursor, count) {
      var match;
      if (count == null) {
        count = 1;
      }
      if ((match = this.match(cursor, count)) != null) {
        return cursor.setBufferPosition(match);
      }
    };

    return Find;

  })(MotionWithInput);

  Till = (function(superClass) {
    extend(Till, superClass);

    function Till(editor, vimState, opts) {
      this.editor = editor;
      this.vimState = vimState;
      if (opts == null) {
        opts = {};
      }
      Till.__super__.constructor.call(this, this.editor, this.vimState, opts);
      this.offset = 1;
    }

    Till.prototype.match = function() {
      var retval;
      this.selectAtLeastOne = false;
      retval = Till.__super__.match.apply(this, arguments);
      if ((retval != null) && !this.backwards) {
        this.selectAtLeastOne = true;
      }
      return retval;
    };

    Till.prototype.moveSelectionInclusively = function(selection, count, options) {
      Till.__super__.moveSelectionInclusively.apply(this, arguments);
      if (selection.isEmpty() && this.selectAtLeastOne) {
        return selection.modifySelection(function() {
          return selection.cursor.moveRight();
        });
      }
    };

    return Till;

  })(Find);

  module.exports = {
    Find: Find,
    Till: Till
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvbW90aW9ucy9maW5kLW1vdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHlEQUFBO0lBQUE7OztFQUFDLGtCQUFtQixPQUFBLENBQVEsbUJBQVI7O0VBQ25CLFlBQWEsT0FBQSxDQUFRLDJCQUFSOztFQUNkLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFFRjs7O21CQUNKLG1CQUFBLEdBQXFCOztJQUVSLGNBQUMsTUFBRCxFQUFVLFFBQVYsRUFBcUIsSUFBckI7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDs7UUFBVyxPQUFLOztNQUNyQyxzQ0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxRQUFoQjtNQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFFVixJQUFHLENBQUksSUFBSSxDQUFDLFFBQVo7UUFDRSxJQUFDLENBQUEsU0FBRCxHQUFpQixJQUFBLFNBQUEsQ0FBVSxJQUFWLEVBQWdCO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxNQUFQO1VBQWUsVUFBQSxFQUFZLElBQTNCO1VBQWlDLE1BQUEsRUFBUSxJQUF6QztTQUFoQjtRQUNqQixJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQXpCLEdBQXVDLEtBSnpDO09BQUEsTUFBQTtRQU9FLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFBLEdBQU8sSUFBQyxDQUFBLFFBQVEsQ0FBQyxjQUFjLENBQUM7UUFDaEMsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUM7UUFDbEIsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFJLENBQUM7UUFDakIsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7UUFFZCxJQUFjLElBQUksQ0FBQyxPQUFuQjtVQUFBLElBQUMsQ0FBQSxPQUFELENBQUEsRUFBQTtTQWRGOztJQUpXOzttQkFvQmIsS0FBQSxHQUFPLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDTCxVQUFBO01BQUEsZUFBQSxHQUFrQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNsQixJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixlQUFlLENBQUMsR0FBN0M7TUFDUCxJQUFHLElBQUMsQ0FBQSxTQUFKO1FBQ0UsS0FBQSxHQUFRLGVBQWUsQ0FBQztBQUN4QixhQUFTLHlGQUFUO1VBQ0UsSUFBVSxLQUFBLElBQVMsQ0FBbkI7QUFBQSxtQkFBQTs7VUFDQSxLQUFBLEdBQVEsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUF4QixFQUFvQyxLQUFBLEdBQU0sQ0FBTixHQUFRLENBQUMsSUFBQyxDQUFBLE1BQUQsR0FBUSxJQUFDLENBQUEsUUFBVixDQUE1QztBQUZWO1FBR0EsSUFBRyxLQUFBLElBQVMsQ0FBWjtpQkFDTSxJQUFBLEtBQUEsQ0FBTSxlQUFlLENBQUMsR0FBdEIsRUFBMkIsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFwQyxFQUROO1NBTEY7T0FBQSxNQUFBO1FBUUUsS0FBQSxHQUFRLGVBQWUsQ0FBQztBQUN4QixhQUFTLHlGQUFUO1VBQ0UsS0FBQSxHQUFRLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFwQixFQUFnQyxLQUFBLEdBQU0sQ0FBTixHQUFRLENBQUMsSUFBQyxDQUFBLE1BQUQsR0FBUSxJQUFDLENBQUEsUUFBVixDQUF4QztVQUNSLElBQVUsS0FBQSxHQUFRLENBQWxCO0FBQUEsbUJBQUE7O0FBRkY7UUFHQSxJQUFHLEtBQUEsSUFBUyxDQUFaO2lCQUNNLElBQUEsS0FBQSxDQUFNLGVBQWUsQ0FBQyxHQUF0QixFQUEyQixLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQXBDLEVBRE47U0FaRjs7SUFISzs7bUJBa0JQLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFJLElBQUMsQ0FBQTthQUNsQjtJQUZPOzttQkFJVCxVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNWLFVBQUE7O1FBRG1CLFFBQU07O01BQ3pCLElBQUcsMkNBQUg7ZUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekIsRUFERjs7SUFEVTs7OztLQTdDSzs7RUFpRGI7OztJQUNTLGNBQUMsTUFBRCxFQUFVLFFBQVYsRUFBcUIsSUFBckI7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxXQUFEOztRQUFXLE9BQUs7O01BQ3JDLHNDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsSUFBQyxDQUFBLFFBQWhCLEVBQTBCLElBQTFCO01BQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUZDOzttQkFJYixLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxJQUFDLENBQUEsZ0JBQUQsR0FBb0I7TUFDcEIsTUFBQSxHQUFTLGlDQUFBLFNBQUE7TUFDVCxJQUFHLGdCQUFBLElBQVksQ0FBSSxJQUFDLENBQUEsU0FBcEI7UUFDRSxJQUFDLENBQUEsZ0JBQUQsR0FBb0IsS0FEdEI7O2FBRUE7SUFMSzs7bUJBT1Asd0JBQUEsR0FBMEIsU0FBQyxTQUFELEVBQVksS0FBWixFQUFtQixPQUFuQjtNQUN4QixvREFBQSxTQUFBO01BQ0EsSUFBRyxTQUFTLENBQUMsT0FBVixDQUFBLENBQUEsSUFBd0IsSUFBQyxDQUFBLGdCQUE1QjtlQUNFLFNBQVMsQ0FBQyxlQUFWLENBQTBCLFNBQUE7aUJBQ3hCLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBakIsQ0FBQTtRQUR3QixDQUExQixFQURGOztJQUZ3Qjs7OztLQVpUOztFQWtCbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBQyxNQUFBLElBQUQ7SUFBTyxNQUFBLElBQVA7O0FBdkVqQiIsInNvdXJjZXNDb250ZW50IjpbIntNb3Rpb25XaXRoSW5wdXR9ID0gcmVxdWlyZSAnLi9nZW5lcmFsLW1vdGlvbnMnXG57Vmlld01vZGVsfSA9IHJlcXVpcmUgJy4uL3ZpZXctbW9kZWxzL3ZpZXctbW9kZWwnXG57UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbmNsYXNzIEZpbmQgZXh0ZW5kcyBNb3Rpb25XaXRoSW5wdXRcbiAgb3BlcmF0ZXNJbmNsdXNpdmVseTogdHJ1ZVxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlLCBvcHRzPXt9KSAtPlxuICAgIHN1cGVyKEBlZGl0b3IsIEB2aW1TdGF0ZSlcbiAgICBAb2Zmc2V0ID0gMFxuXG4gICAgaWYgbm90IG9wdHMucmVwZWF0ZWRcbiAgICAgIEB2aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMsIGNsYXNzOiAnZmluZCcsIHNpbmdsZUNoYXI6IHRydWUsIGhpZGRlbjogdHJ1ZSlcbiAgICAgIEBiYWNrd2FyZHMgPSBmYWxzZVxuICAgICAgQHJlcGVhdGVkID0gZmFsc2VcbiAgICAgIEB2aW1TdGF0ZS5nbG9iYWxWaW1TdGF0ZS5jdXJyZW50RmluZCA9IHRoaXNcblxuICAgIGVsc2VcbiAgICAgIEByZXBlYXRlZCA9IHRydWVcblxuICAgICAgb3JpZyA9IEB2aW1TdGF0ZS5nbG9iYWxWaW1TdGF0ZS5jdXJyZW50RmluZFxuICAgICAgQGJhY2t3YXJkcyA9IG9yaWcuYmFja3dhcmRzXG4gICAgICBAY29tcGxldGUgPSBvcmlnLmNvbXBsZXRlXG4gICAgICBAaW5wdXQgPSBvcmlnLmlucHV0XG5cbiAgICAgIEByZXZlcnNlKCkgaWYgb3B0cy5yZXZlcnNlXG5cbiAgbWF0Y2g6IChjdXJzb3IsIGNvdW50KSAtPlxuICAgIGN1cnJlbnRQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coY3VycmVudFBvc2l0aW9uLnJvdylcbiAgICBpZiBAYmFja3dhcmRzXG4gICAgICBpbmRleCA9IGN1cnJlbnRQb3NpdGlvbi5jb2x1bW5cbiAgICAgIGZvciBpIGluIFswLi5jb3VudC0xXVxuICAgICAgICByZXR1cm4gaWYgaW5kZXggPD0gMCAjIHdlIGNhbid0IG1vdmUgYmFja3dhcmRzIGFueSBmdXJ0aGVyLCBxdWljayByZXR1cm5cbiAgICAgICAgaW5kZXggPSBsaW5lLmxhc3RJbmRleE9mKEBpbnB1dC5jaGFyYWN0ZXJzLCBpbmRleC0xLShAb2Zmc2V0KkByZXBlYXRlZCkpXG4gICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgIG5ldyBQb2ludChjdXJyZW50UG9zaXRpb24ucm93LCBpbmRleCArIEBvZmZzZXQpXG4gICAgZWxzZVxuICAgICAgaW5kZXggPSBjdXJyZW50UG9zaXRpb24uY29sdW1uXG4gICAgICBmb3IgaSBpbiBbMC4uY291bnQtMV1cbiAgICAgICAgaW5kZXggPSBsaW5lLmluZGV4T2YoQGlucHV0LmNoYXJhY3RlcnMsIGluZGV4KzErKEBvZmZzZXQqQHJlcGVhdGVkKSlcbiAgICAgICAgcmV0dXJuIGlmIGluZGV4IDwgMCAjIG5vIG1hdGNoIGZvdW5kXG4gICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgIG5ldyBQb2ludChjdXJyZW50UG9zaXRpb24ucm93LCBpbmRleCAtIEBvZmZzZXQpXG5cbiAgcmV2ZXJzZTogLT5cbiAgICBAYmFja3dhcmRzID0gbm90IEBiYWNrd2FyZHNcbiAgICB0aGlzXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBpZiAobWF0Y2ggPSBAbWF0Y2goY3Vyc29yLCBjb3VudCkpP1xuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKG1hdGNoKVxuXG5jbGFzcyBUaWxsIGV4dGVuZHMgRmluZFxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEB2aW1TdGF0ZSwgb3B0cz17fSkgLT5cbiAgICBzdXBlcihAZWRpdG9yLCBAdmltU3RhdGUsIG9wdHMpXG4gICAgQG9mZnNldCA9IDFcblxuICBtYXRjaDogLT5cbiAgICBAc2VsZWN0QXRMZWFzdE9uZSA9IGZhbHNlXG4gICAgcmV0dmFsID0gc3VwZXJcbiAgICBpZiByZXR2YWw/IGFuZCBub3QgQGJhY2t3YXJkc1xuICAgICAgQHNlbGVjdEF0TGVhc3RPbmUgPSB0cnVlXG4gICAgcmV0dmFsXG5cbiAgbW92ZVNlbGVjdGlvbkluY2x1c2l2ZWx5OiAoc2VsZWN0aW9uLCBjb3VudCwgb3B0aW9ucykgLT5cbiAgICBzdXBlclxuICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KCkgYW5kIEBzZWxlY3RBdExlYXN0T25lXG4gICAgICBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uIC0+XG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IubW92ZVJpZ2h0KClcblxubW9kdWxlLmV4cG9ydHMgPSB7RmluZCwgVGlsbH1cbiJdfQ==
