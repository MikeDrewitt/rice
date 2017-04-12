(function() {
  var copyCharacterFromAbove, copyCharacterFromBelow;

  copyCharacterFromAbove = function(editor, vimState) {
    return editor.transact(function() {
      var column, cursor, i, len, range, ref, ref1, results, row;
      ref = editor.getCursors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cursor = ref[i];
        ref1 = cursor.getScreenPosition(), row = ref1.row, column = ref1.column;
        if (row === 0) {
          continue;
        }
        range = [[row - 1, column], [row - 1, column + 1]];
        results.push(cursor.selection.insertText(editor.getTextInBufferRange(editor.bufferRangeForScreenRange(range))));
      }
      return results;
    });
  };

  copyCharacterFromBelow = function(editor, vimState) {
    return editor.transact(function() {
      var column, cursor, i, len, range, ref, ref1, results, row;
      ref = editor.getCursors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cursor = ref[i];
        ref1 = cursor.getScreenPosition(), row = ref1.row, column = ref1.column;
        range = [[row + 1, column], [row + 1, column + 1]];
        results.push(cursor.selection.insertText(editor.getTextInBufferRange(editor.bufferRangeForScreenRange(range))));
      }
      return results;
    });
  };

  module.exports = {
    copyCharacterFromAbove: copyCharacterFromAbove,
    copyCharacterFromBelow: copyCharacterFromBelow
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvaW5zZXJ0LW1vZGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxzQkFBQSxHQUF5QixTQUFDLE1BQUQsRUFBUyxRQUFUO1dBQ3ZCLE1BQU0sQ0FBQyxRQUFQLENBQWdCLFNBQUE7QUFDZCxVQUFBO0FBQUE7QUFBQTtXQUFBLHFDQUFBOztRQUNFLE9BQWdCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQWhCLEVBQUMsY0FBRCxFQUFNO1FBQ04sSUFBWSxHQUFBLEtBQU8sQ0FBbkI7QUFBQSxtQkFBQTs7UUFDQSxLQUFBLEdBQVEsQ0FBQyxDQUFDLEdBQUEsR0FBSSxDQUFMLEVBQVEsTUFBUixDQUFELEVBQWtCLENBQUMsR0FBQSxHQUFJLENBQUwsRUFBUSxNQUFBLEdBQU8sQ0FBZixDQUFsQjtxQkFDUixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQWpCLENBQTRCLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixNQUFNLENBQUMseUJBQVAsQ0FBaUMsS0FBakMsQ0FBNUIsQ0FBNUI7QUFKRjs7SUFEYyxDQUFoQjtFQUR1Qjs7RUFRekIsc0JBQUEsR0FBeUIsU0FBQyxNQUFELEVBQVMsUUFBVDtXQUN2QixNQUFNLENBQUMsUUFBUCxDQUFnQixTQUFBO0FBQ2QsVUFBQTtBQUFBO0FBQUE7V0FBQSxxQ0FBQTs7UUFDRSxPQUFnQixNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFoQixFQUFDLGNBQUQsRUFBTTtRQUNOLEtBQUEsR0FBUSxDQUFDLENBQUMsR0FBQSxHQUFJLENBQUwsRUFBUSxNQUFSLENBQUQsRUFBa0IsQ0FBQyxHQUFBLEdBQUksQ0FBTCxFQUFRLE1BQUEsR0FBTyxDQUFmLENBQWxCO3FCQUNSLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBakIsQ0FBNEIsTUFBTSxDQUFDLG9CQUFQLENBQTRCLE1BQU0sQ0FBQyx5QkFBUCxDQUFpQyxLQUFqQyxDQUE1QixDQUE1QjtBQUhGOztJQURjLENBQWhCO0VBRHVCOztFQU96QixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLHdCQUFBLHNCQURlO0lBRWYsd0JBQUEsc0JBRmU7O0FBZmpCIiwic291cmNlc0NvbnRlbnQiOlsiY29weUNoYXJhY3RlckZyb21BYm92ZSA9IChlZGl0b3IsIHZpbVN0YXRlKSAtPlxuICBlZGl0b3IudHJhbnNhY3QgLT5cbiAgICBmb3IgY3Vyc29yIGluIGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIHtyb3csIGNvbHVtbn0gPSBjdXJzb3IuZ2V0U2NyZWVuUG9zaXRpb24oKVxuICAgICAgY29udGludWUgaWYgcm93IGlzIDBcbiAgICAgIHJhbmdlID0gW1tyb3ctMSwgY29sdW1uXSwgW3Jvdy0xLCBjb2x1bW4rMV1dXG4gICAgICBjdXJzb3Iuc2VsZWN0aW9uLmluc2VydFRleHQoZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKGVkaXRvci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHJhbmdlKSkpXG5cbmNvcHlDaGFyYWN0ZXJGcm9tQmVsb3cgPSAoZWRpdG9yLCB2aW1TdGF0ZSkgLT5cbiAgZWRpdG9yLnRyYW5zYWN0IC0+XG4gICAgZm9yIGN1cnNvciBpbiBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICB7cm93LCBjb2x1bW59ID0gY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKClcbiAgICAgIHJhbmdlID0gW1tyb3crMSwgY29sdW1uXSwgW3JvdysxLCBjb2x1bW4rMV1dXG4gICAgICBjdXJzb3Iuc2VsZWN0aW9uLmluc2VydFRleHQoZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKGVkaXRvci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHJhbmdlKSkpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjb3B5Q2hhcmFjdGVyRnJvbUFib3ZlLFxuICBjb3B5Q2hhcmFjdGVyRnJvbUJlbG93XG59XG4iXX0=
