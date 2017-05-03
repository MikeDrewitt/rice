(function() {
  var Operator, Put, _, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  Operator = require('./general-operators').Operator;

  settings = require('../settings');

  module.exports = Put = (function(superClass) {
    extend(Put, superClass);

    Put.prototype.register = null;

    function Put(editor, vimState, arg) {
      this.editor = editor;
      this.vimState = vimState;
      this.location = (arg != null ? arg : {}).location;
      if (this.location == null) {
        this.location = 'after';
      }
      this.complete = true;
      this.register = settings.defaultRegister();
    }

    Put.prototype.execute = function(count) {
      var originalPosition, ref, selection, text, textToInsert, type;
      if (count == null) {
        count = 1;
      }
      ref = this.vimState.getRegister(this.register) || {}, text = ref.text, type = ref.type;
      if (!text) {
        return;
      }
      textToInsert = _.times(count, function() {
        return text;
      }).join('');
      selection = this.editor.getSelectedBufferRange();
      if (selection.isEmpty()) {
        if (type === 'linewise') {
          textToInsert = textToInsert.replace(/\n$/, '');
          if (this.location === 'after' && this.onLastRow()) {
            textToInsert = "\n" + textToInsert;
          } else {
            textToInsert = textToInsert + "\n";
          }
        }
        if (this.location === 'after') {
          if (type === 'linewise') {
            if (this.onLastRow()) {
              this.editor.moveToEndOfLine();
              originalPosition = this.editor.getCursorScreenPosition();
              originalPosition.row += 1;
            } else {
              this.editor.moveDown();
            }
          } else {
            if (!this.onLastColumn()) {
              this.editor.moveRight();
            }
          }
        }
        if (type === 'linewise' && (originalPosition == null)) {
          this.editor.moveToBeginningOfLine();
          originalPosition = this.editor.getCursorScreenPosition();
        }
      }
      this.editor.insertText(textToInsert);
      if (originalPosition != null) {
        this.editor.setCursorScreenPosition(originalPosition);
        this.editor.moveToFirstCharacterOfLine();
      }
      if (type !== 'linewise') {
        this.editor.moveLeft();
      }
      return this.vimState.activateNormalMode();
    };

    Put.prototype.onLastRow = function() {
      var column, ref, row;
      ref = this.editor.getCursorBufferPosition(), row = ref.row, column = ref.column;
      return row === this.editor.getBuffer().getLastRow();
    };

    Put.prototype.onLastColumn = function() {
      return this.editor.getLastCursor().isAtEndOfLine();
    };

    return Put;

  })(Operator);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvb3BlcmF0b3JzL3B1dC1vcGVyYXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBCQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsV0FBWSxPQUFBLENBQVEscUJBQVI7O0VBQ2IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBSU07OztrQkFDSixRQUFBLEdBQVU7O0lBRUcsYUFBQyxNQUFELEVBQVUsUUFBVixFQUFxQixHQUFyQjtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQVMsSUFBQyxDQUFBLFdBQUQ7TUFBWSxJQUFDLENBQUEsMEJBQUYsTUFBWSxJQUFWOztRQUNsQyxJQUFDLENBQUEsV0FBWTs7TUFDYixJQUFDLENBQUEsUUFBRCxHQUFZO01BQ1osSUFBQyxDQUFBLFFBQUQsR0FBWSxRQUFRLENBQUMsZUFBVCxDQUFBO0lBSEQ7O2tCQVViLE9BQUEsR0FBUyxTQUFDLEtBQUQ7QUFDUCxVQUFBOztRQURRLFFBQU07O01BQ2QsTUFBZSxJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVYsQ0FBc0IsSUFBQyxDQUFBLFFBQXZCLENBQUEsSUFBb0MsRUFBbkQsRUFBQyxlQUFELEVBQU87TUFDUCxJQUFBLENBQWMsSUFBZDtBQUFBLGVBQUE7O01BRUEsWUFBQSxHQUFlLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLFNBQUE7ZUFBRztNQUFILENBQWYsQ0FBdUIsQ0FBQyxJQUF4QixDQUE2QixFQUE3QjtNQUVmLFNBQUEsR0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLHNCQUFSLENBQUE7TUFDWixJQUFHLFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FBSDtRQUVFLElBQUcsSUFBQSxLQUFRLFVBQVg7VUFDRSxZQUFBLEdBQWUsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsS0FBckIsRUFBNEIsRUFBNUI7VUFDZixJQUFHLElBQUMsQ0FBQSxRQUFELEtBQWEsT0FBYixJQUF5QixJQUFDLENBQUEsU0FBRCxDQUFBLENBQTVCO1lBQ0UsWUFBQSxHQUFlLElBQUEsR0FBSyxhQUR0QjtXQUFBLE1BQUE7WUFHRSxZQUFBLEdBQWtCLFlBQUQsR0FBYyxLQUhqQztXQUZGOztRQU9BLElBQUcsSUFBQyxDQUFBLFFBQUQsS0FBYSxPQUFoQjtVQUNFLElBQUcsSUFBQSxLQUFRLFVBQVg7WUFDRSxJQUFHLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBSDtjQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUFBO2NBRUEsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBO2NBQ25CLGdCQUFnQixDQUFDLEdBQWpCLElBQXdCLEVBSjFCO2FBQUEsTUFBQTtjQU1FLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBLEVBTkY7YUFERjtXQUFBLE1BQUE7WUFTRSxJQUFBLENBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFQO2NBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsRUFERjthQVRGO1dBREY7O1FBYUEsSUFBRyxJQUFBLEtBQVEsVUFBUixJQUEyQiwwQkFBOUI7VUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLHFCQUFSLENBQUE7VUFDQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUEsRUFGckI7U0F0QkY7O01BMEJBLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFtQixZQUFuQjtNQUVBLElBQUcsd0JBQUg7UUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLGdCQUFoQztRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsMEJBQVIsQ0FBQSxFQUZGOztNQUlBLElBQUcsSUFBQSxLQUFVLFVBQWI7UUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBQSxFQURGOzthQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsa0JBQVYsQ0FBQTtJQXpDTzs7a0JBOENULFNBQUEsR0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLE1BQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUFoQixFQUFDLGFBQUQsRUFBTTthQUNOLEdBQUEsS0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxDQUFtQixDQUFDLFVBQXBCLENBQUE7SUFGRTs7a0JBSVgsWUFBQSxHQUFjLFNBQUE7YUFDWixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLGFBQXhCLENBQUE7SUFEWTs7OztLQS9ERTtBQVJsQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57T3BlcmF0b3J9ID0gcmVxdWlyZSAnLi9nZW5lcmFsLW9wZXJhdG9ycydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vc2V0dGluZ3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbiNcbiMgSXQgcGFzdGVzIGV2ZXJ5dGhpbmcgY29udGFpbmVkIHdpdGhpbiB0aGUgc3BlY2lmZWQgcmVnaXN0ZXJcbiNcbmNsYXNzIFB1dCBleHRlbmRzIE9wZXJhdG9yXG4gIHJlZ2lzdGVyOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAdmltU3RhdGUsIHtAbG9jYXRpb259PXt9KSAtPlxuICAgIEBsb2NhdGlvbiA/PSAnYWZ0ZXInXG4gICAgQGNvbXBsZXRlID0gdHJ1ZVxuICAgIEByZWdpc3RlciA9IHNldHRpbmdzLmRlZmF1bHRSZWdpc3RlcigpXG5cbiAgIyBQdWJsaWM6IFBhc3RlcyB0aGUgdGV4dCBpbiB0aGUgZ2l2ZW4gcmVnaXN0ZXIuXG4gICNcbiAgIyBjb3VudCAtIFRoZSBudW1iZXIgb2YgdGltZXMgdG8gZXhlY3V0ZS5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgZXhlY3V0ZTogKGNvdW50PTEpIC0+XG4gICAge3RleHQsIHR5cGV9ID0gQHZpbVN0YXRlLmdldFJlZ2lzdGVyKEByZWdpc3Rlcikgb3Ige31cbiAgICByZXR1cm4gdW5sZXNzIHRleHRcblxuICAgIHRleHRUb0luc2VydCA9IF8udGltZXMoY291bnQsIC0+IHRleHQpLmpvaW4oJycpXG5cbiAgICBzZWxlY3Rpb24gPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKVxuICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICMgQ2xlYW4gdXAgc29tZSBjb3JuZXIgY2FzZXMgb24gdGhlIGxhc3QgbGluZSBvZiB0aGUgZmlsZVxuICAgICAgaWYgdHlwZSBpcyAnbGluZXdpc2UnXG4gICAgICAgIHRleHRUb0luc2VydCA9IHRleHRUb0luc2VydC5yZXBsYWNlKC9cXG4kLywgJycpXG4gICAgICAgIGlmIEBsb2NhdGlvbiBpcyAnYWZ0ZXInIGFuZCBAb25MYXN0Um93KClcbiAgICAgICAgICB0ZXh0VG9JbnNlcnQgPSBcIlxcbiN7dGV4dFRvSW5zZXJ0fVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0ZXh0VG9JbnNlcnQgPSBcIiN7dGV4dFRvSW5zZXJ0fVxcblwiXG5cbiAgICAgIGlmIEBsb2NhdGlvbiBpcyAnYWZ0ZXInXG4gICAgICAgIGlmIHR5cGUgaXMgJ2xpbmV3aXNlJ1xuICAgICAgICAgIGlmIEBvbkxhc3RSb3coKVxuICAgICAgICAgICAgQGVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuXG4gICAgICAgICAgICBvcmlnaW5hbFBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXG4gICAgICAgICAgICBvcmlnaW5hbFBvc2l0aW9uLnJvdyArPSAxXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVkaXRvci5tb3ZlRG93bigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB1bmxlc3MgQG9uTGFzdENvbHVtbigpXG4gICAgICAgICAgICBAZWRpdG9yLm1vdmVSaWdodCgpXG5cbiAgICAgIGlmIHR5cGUgaXMgJ2xpbmV3aXNlJyBhbmQgbm90IG9yaWdpbmFsUG9zaXRpb24/XG4gICAgICAgIEBlZGl0b3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICAgICAgb3JpZ2luYWxQb3NpdGlvbiA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuXG4gICAgQGVkaXRvci5pbnNlcnRUZXh0KHRleHRUb0luc2VydClcblxuICAgIGlmIG9yaWdpbmFsUG9zaXRpb24/XG4gICAgICBAZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKG9yaWdpbmFsUG9zaXRpb24pXG4gICAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcblxuICAgIGlmIHR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICBAZWRpdG9yLm1vdmVMZWZ0KClcbiAgICBAdmltU3RhdGUuYWN0aXZhdGVOb3JtYWxNb2RlKClcblxuICAjIFByaXZhdGU6IEhlbHBlciB0byBkZXRlcm1pbmUgaWYgdGhlIGVkaXRvciBpcyBjdXJyZW50bHkgb24gdGhlIGxhc3Qgcm93LlxuICAjXG4gICMgUmV0dXJucyB0cnVlIG9uIHRoZSBsYXN0IHJvdyBhbmQgZmFsc2Ugb3RoZXJ3aXNlLlxuICBvbkxhc3RSb3c6IC0+XG4gICAge3JvdywgY29sdW1ufSA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIHJvdyBpcyBAZWRpdG9yLmdldEJ1ZmZlcigpLmdldExhc3RSb3coKVxuXG4gIG9uTGFzdENvbHVtbjogLT5cbiAgICBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5pc0F0RW5kT2ZMaW5lKClcbiJdfQ==
