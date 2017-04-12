(function() {
  var MotionWithInput, MoveToFirstCharacterOfLine, MoveToMark, Point, Range, ViewModel, ref, ref1,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('./general-motions'), MotionWithInput = ref.MotionWithInput, MoveToFirstCharacterOfLine = ref.MoveToFirstCharacterOfLine;

  ViewModel = require('../view-models/view-model').ViewModel;

  ref1 = require('atom'), Point = ref1.Point, Range = ref1.Range;

  module.exports = MoveToMark = (function(superClass) {
    extend(MoveToMark, superClass);

    function MoveToMark(editor, vimState, linewise) {
      this.editor = editor;
      this.vimState = vimState;
      this.linewise = linewise != null ? linewise : true;
      MoveToMark.__super__.constructor.call(this, this.editor, this.vimState);
      this.operatesLinewise = this.linewise;
      this.viewModel = new ViewModel(this, {
        "class": 'move-to-mark',
        singleChar: true,
        hidden: true
      });
    }

    MoveToMark.prototype.isLinewise = function() {
      return this.linewise;
    };

    MoveToMark.prototype.moveCursor = function(cursor, count) {
      var markPosition;
      if (count == null) {
        count = 1;
      }
      markPosition = this.vimState.getMark(this.input.characters);
      if (this.input.characters === '`') {
        if (markPosition == null) {
          markPosition = [0, 0];
        }
        this.vimState.setMark('`', cursor.getBufferPosition());
      }
      if (markPosition != null) {
        cursor.setBufferPosition(markPosition);
      }
      if (this.linewise) {
        return cursor.moveToFirstCharacterOfLine();
      }
    };

    return MoveToMark;

  })(MotionWithInput);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvbW90aW9ucy9tb3ZlLXRvLW1hcmstbW90aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkZBQUE7SUFBQTs7O0VBQUEsTUFBZ0QsT0FBQSxDQUFRLG1CQUFSLENBQWhELEVBQUMscUNBQUQsRUFBa0I7O0VBQ2pCLFlBQWEsT0FBQSxDQUFRLDJCQUFSOztFQUNkLE9BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsa0JBQUQsRUFBUTs7RUFFUixNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxvQkFBQyxNQUFELEVBQVUsUUFBVixFQUFxQixRQUFyQjtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQVMsSUFBQyxDQUFBLFdBQUQ7TUFBVyxJQUFDLENBQUEsOEJBQUQsV0FBVTtNQUMxQyw0Q0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxRQUFoQjtNQUNBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFDLENBQUE7TUFDckIsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxTQUFBLENBQVUsSUFBVixFQUFnQjtRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtRQUF1QixVQUFBLEVBQVksSUFBbkM7UUFBeUMsTUFBQSxFQUFRLElBQWpEO09BQWhCO0lBSE47O3lCQUtiLFVBQUEsR0FBWSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O3lCQUVaLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUO0FBQ1YsVUFBQTs7UUFEbUIsUUFBTTs7TUFDekIsWUFBQSxHQUFlLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFrQixJQUFDLENBQUEsS0FBSyxDQUFDLFVBQXpCO01BRWYsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVAsS0FBcUIsR0FBeEI7O1VBQ0UsZUFBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBSjs7UUFDaEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQWtCLEdBQWxCLEVBQXVCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQXZCLEVBRkY7O01BSUEsSUFBMEMsb0JBQTFDO1FBQUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLFlBQXpCLEVBQUE7O01BQ0EsSUFBRyxJQUFDLENBQUEsUUFBSjtlQUNFLE1BQU0sQ0FBQywwQkFBUCxDQUFBLEVBREY7O0lBUlU7Ozs7S0FSVztBQUx6QiIsInNvdXJjZXNDb250ZW50IjpbIntNb3Rpb25XaXRoSW5wdXQsIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lfSA9IHJlcXVpcmUgJy4vZ2VuZXJhbC1tb3Rpb25zJ1xue1ZpZXdNb2RlbH0gPSByZXF1aXJlICcuLi92aWV3LW1vZGVscy92aWV3LW1vZGVsJ1xue1BvaW50LCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBNb3ZlVG9NYXJrIGV4dGVuZHMgTW90aW9uV2l0aElucHV0XG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlLCBAbGluZXdpc2U9dHJ1ZSkgLT5cbiAgICBzdXBlcihAZWRpdG9yLCBAdmltU3RhdGUpXG4gICAgQG9wZXJhdGVzTGluZXdpc2UgPSBAbGluZXdpc2VcbiAgICBAdmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLCBjbGFzczogJ21vdmUtdG8tbWFyaycsIHNpbmdsZUNoYXI6IHRydWUsIGhpZGRlbjogdHJ1ZSlcblxuICBpc0xpbmV3aXNlOiAtPiBAbGluZXdpc2VcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIG1hcmtQb3NpdGlvbiA9IEB2aW1TdGF0ZS5nZXRNYXJrKEBpbnB1dC5jaGFyYWN0ZXJzKVxuXG4gICAgaWYgQGlucHV0LmNoYXJhY3RlcnMgaXMgJ2AnICMgZG91YmxlICdgJyBwcmVzc2VkXG4gICAgICBtYXJrUG9zaXRpb24gPz0gWzAsIDBdICMgaWYgbWFya1Bvc2l0aW9uIG5vdCBzZXQsIGdvIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGVcbiAgICAgIEB2aW1TdGF0ZS5zZXRNYXJrKCdgJywgY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obWFya1Bvc2l0aW9uKSBpZiBtYXJrUG9zaXRpb24/XG4gICAgaWYgQGxpbmV3aXNlXG4gICAgICBjdXJzb3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuIl19
