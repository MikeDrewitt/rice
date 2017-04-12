(function() {
  var Change, Delete, Insert, InsertAboveWithNewline, InsertAfter, InsertAfterEndOfLine, InsertAtBeginningOfLine, InsertBelowWithNewline, Motions, Operator, ReplaceMode, _, ref, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Motions = require('../motions/index');

  ref = require('./general-operators'), Operator = ref.Operator, Delete = ref.Delete;

  _ = require('underscore-plus');

  settings = require('../settings');

  Insert = (function(superClass) {
    extend(Insert, superClass);

    function Insert() {
      return Insert.__super__.constructor.apply(this, arguments);
    }

    Insert.prototype.standalone = true;

    Insert.prototype.isComplete = function() {
      return this.standalone || Insert.__super__.isComplete.apply(this, arguments);
    };

    Insert.prototype.confirmChanges = function(changes) {
      if (changes.length > 0) {
        return this.typedText = changes[0].newText;
      } else {
        return this.typedText = "";
      }
    };

    Insert.prototype.execute = function() {
      var cursor, i, len, ref1;
      if (this.typingCompleted) {
        if (!((this.typedText != null) && this.typedText.length > 0)) {
          return;
        }
        this.editor.insertText(this.typedText, {
          normalizeLineEndings: true,
          autoIndent: true
        });
        ref1 = this.editor.getCursors();
        for (i = 0, len = ref1.length; i < len; i++) {
          cursor = ref1[i];
          if (!cursor.isAtBeginningOfLine()) {
            cursor.moveLeft();
          }
        }
      } else {
        this.vimState.activateInsertMode();
        this.typingCompleted = true;
      }
    };

    Insert.prototype.inputOperator = function() {
      return true;
    };

    return Insert;

  })(Operator);

  ReplaceMode = (function(superClass) {
    extend(ReplaceMode, superClass);

    function ReplaceMode() {
      return ReplaceMode.__super__.constructor.apply(this, arguments);
    }

    ReplaceMode.prototype.execute = function() {
      if (this.typingCompleted) {
        if (!((this.typedText != null) && this.typedText.length > 0)) {
          return;
        }
        return this.editor.transact((function(_this) {
          return function() {
            var count, cursor, i, j, len, len1, ref1, ref2, results, selection, toDelete;
            _this.editor.insertText(_this.typedText, {
              normalizeLineEndings: true
            });
            toDelete = _this.typedText.length - _this.countChars('\n', _this.typedText);
            ref1 = _this.editor.getSelections();
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              count = toDelete;
              while (count-- && !selection.cursor.isAtEndOfLine()) {
                selection["delete"]();
              }
            }
            ref2 = _this.editor.getCursors();
            results = [];
            for (j = 0, len1 = ref2.length; j < len1; j++) {
              cursor = ref2[j];
              if (!cursor.isAtBeginningOfLine()) {
                results.push(cursor.moveLeft());
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
        })(this));
      } else {
        this.vimState.activateReplaceMode();
        return this.typingCompleted = true;
      }
    };

    ReplaceMode.prototype.countChars = function(char, string) {
      return string.split(char).length - 1;
    };

    return ReplaceMode;

  })(Insert);

  InsertAfter = (function(superClass) {
    extend(InsertAfter, superClass);

    function InsertAfter() {
      return InsertAfter.__super__.constructor.apply(this, arguments);
    }

    InsertAfter.prototype.execute = function() {
      if (!this.editor.getLastCursor().isAtEndOfLine()) {
        this.editor.moveRight();
      }
      return InsertAfter.__super__.execute.apply(this, arguments);
    };

    return InsertAfter;

  })(Insert);

  InsertAfterEndOfLine = (function(superClass) {
    extend(InsertAfterEndOfLine, superClass);

    function InsertAfterEndOfLine() {
      return InsertAfterEndOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAfterEndOfLine.prototype.execute = function() {
      this.editor.moveToEndOfLine();
      return InsertAfterEndOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAfterEndOfLine;

  })(Insert);

  InsertAtBeginningOfLine = (function(superClass) {
    extend(InsertAtBeginningOfLine, superClass);

    function InsertAtBeginningOfLine() {
      return InsertAtBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtBeginningOfLine.prototype.execute = function() {
      this.editor.moveToBeginningOfLine();
      this.editor.moveToFirstCharacterOfLine();
      return InsertAtBeginningOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtBeginningOfLine;

  })(Insert);

  InsertAboveWithNewline = (function(superClass) {
    extend(InsertAboveWithNewline, superClass);

    function InsertAboveWithNewline() {
      return InsertAboveWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertAboveWithNewline.prototype.execute = function() {
      if (!this.typingCompleted) {
        this.vimState.setInsertionCheckpoint();
      }
      this.editor.insertNewlineAbove();
      this.editor.getLastCursor().skipLeadingWhitespace();
      if (this.typingCompleted) {
        this.typedText = this.typedText.trimLeft();
        return InsertAboveWithNewline.__super__.execute.apply(this, arguments);
      }
      this.vimState.activateInsertMode();
      return this.typingCompleted = true;
    };

    return InsertAboveWithNewline;

  })(Insert);

  InsertBelowWithNewline = (function(superClass) {
    extend(InsertBelowWithNewline, superClass);

    function InsertBelowWithNewline() {
      return InsertBelowWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertBelowWithNewline.prototype.execute = function() {
      if (!this.typingCompleted) {
        this.vimState.setInsertionCheckpoint();
      }
      this.editor.insertNewlineBelow();
      this.editor.getLastCursor().skipLeadingWhitespace();
      if (this.typingCompleted) {
        this.typedText = this.typedText.trimLeft();
        return InsertBelowWithNewline.__super__.execute.apply(this, arguments);
      }
      this.vimState.activateInsertMode();
      return this.typingCompleted = true;
    };

    return InsertBelowWithNewline;

  })(Insert);

  Change = (function(superClass) {
    extend(Change, superClass);

    Change.prototype.standalone = false;

    Change.prototype.register = null;

    function Change(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
      this.register = settings.defaultRegister();
    }

    Change.prototype.execute = function(count) {
      var base, i, j, len, len1, ref1, ref2, selection;
      if (_.contains(this.motion.select(count, {
        excludeWhitespace: true
      }), true)) {
        if (!this.typingCompleted) {
          this.vimState.setInsertionCheckpoint();
        }
        this.setTextRegister(this.register, this.editor.getSelectedText());
        if ((typeof (base = this.motion).isLinewise === "function" ? base.isLinewise() : void 0) && !this.typingCompleted) {
          ref1 = this.editor.getSelections();
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            if (selection.getBufferRange().end.row === 0) {
              selection.deleteSelectedText();
            } else {
              selection.insertText("\n", {
                autoIndent: true
              });
            }
            selection.cursor.moveLeft();
          }
        } else {
          ref2 = this.editor.getSelections();
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            selection = ref2[j];
            selection.deleteSelectedText();
          }
        }
        if (this.typingCompleted) {
          return Change.__super__.execute.apply(this, arguments);
        }
        this.vimState.activateInsertMode();
        return this.typingCompleted = true;
      } else {
        return this.vimState.activateNormalMode();
      }
    };

    return Change;

  })(Insert);

  module.exports = {
    Insert: Insert,
    InsertAfter: InsertAfter,
    InsertAfterEndOfLine: InsertAfterEndOfLine,
    InsertAtBeginningOfLine: InsertAtBeginningOfLine,
    InsertAboveWithNewline: InsertAboveWithNewline,
    InsertBelowWithNewline: InsertBelowWithNewline,
    ReplaceMode: ReplaceMode,
    Change: Change
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvb3BlcmF0b3JzL2lucHV0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0xBQUE7SUFBQTs7O0VBQUEsT0FBQSxHQUFVLE9BQUEsQ0FBUSxrQkFBUjs7RUFDVixNQUFxQixPQUFBLENBQVEscUJBQVIsQ0FBckIsRUFBQyx1QkFBRCxFQUFXOztFQUNYLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQU1MOzs7Ozs7O3FCQUNKLFVBQUEsR0FBWTs7cUJBRVosVUFBQSxHQUFZLFNBQUE7YUFBRyxJQUFDLENBQUEsVUFBRCxJQUFlLHdDQUFBLFNBQUE7SUFBbEI7O3FCQUVaLGNBQUEsR0FBZ0IsU0FBQyxPQUFEO01BQ2QsSUFBRyxPQUFPLENBQUMsTUFBUixHQUFpQixDQUFwQjtlQUNFLElBQUMsQ0FBQSxTQUFELEdBQWEsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBRDFCO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxTQUFELEdBQWEsR0FIZjs7SUFEYzs7cUJBTWhCLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGVBQUo7UUFDRSxJQUFBLENBQUEsQ0FBYyx3QkFBQSxJQUFnQixJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsR0FBb0IsQ0FBbEQsQ0FBQTtBQUFBLGlCQUFBOztRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFtQixJQUFDLENBQUEsU0FBcEIsRUFBK0I7VUFBQSxvQkFBQSxFQUFzQixJQUF0QjtVQUE0QixVQUFBLEVBQVksSUFBeEM7U0FBL0I7QUFDQTtBQUFBLGFBQUEsc0NBQUE7O1VBQ0UsSUFBQSxDQUF5QixNQUFNLENBQUMsbUJBQVAsQ0FBQSxDQUF6QjtZQUFBLE1BQU0s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LGVBQVIsQ0FBQSxDQUE1QjtRQUNBLGlFQUFVLENBQUMsc0JBQVIsSUFBMEIsQ0FBSSxJQUFDLENBQUEsZUFBbEM7QUFDRTtBQUFBLGVBQUEsc0NBQUE7O1lBQ0UsSUFBRyxTQUFTLENBQUMsY0FBVixDQUFBLENBQTBCLENBQUMsR0FBRyxDQUFDLEdBQS9CLEtBQXNDLENBQXpDO2NBQ0UsU0FBUyxDQUFDLGtCQUFWLENBQUEsRUFERjthQUFBLE1BQUE7Y0FHRSxTQUFTLENBQUMsVUFBVixDQUFxQixJQUFyQixFQUEyQjtnQkFBQSxVQUFBLEVBQVksSUFBWjtlQUEzQixFQUhGOztZQUlBLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBakIsQ0FBQTtBQUxGLFdBREY7U0FBQSxNQUFBO0FBUUU7QUFBQSxlQUFBLHdDQUFBOztZQUNFLFNBQVMsQ0FBQyxrQkFBVixDQUFBO0FBREYsV0FSRjs7UUFXQSxJQUFnQixJQUFDLENBQUEsZUFBakI7QUFBQSxpQkFBTyxxQ0FBQSxTQUFBLEVBQVA7O1FBRUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxrQkFBVixDQUFBO2VBQ0EsSUFBQyxDQUFBLGVBQUQsR0FBbUIsS0FwQnJCO09BQUEsTUFBQTtlQXNCRSxJQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFWLENBQUEsRUF0QkY7O0lBRE87Ozs7S0FaVTs7RUFzQ3JCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2YsUUFBQSxNQURlO0lBRWYsYUFBQSxXQUZlO0lBR2Ysc0JBQUEsb0JBSGU7SUFJZix5QkFBQSx1QkFKZTtJQUtmLHdCQUFBLHNCQUxlO0lBTWYsd0JBQUEsc0JBTmU7SUFPZixhQUFBLFdBUGU7SUFRZixRQUFBLE1BUmU7O0FBNUlqQiIsInNvdXJjZXNDb250ZW50IjpbIk1vdGlvbnMgPSByZXF1aXJlICcuLi9tb3Rpb25zL2luZGV4J1xue09wZXJhdG9yLCBEZWxldGV9ID0gcmVxdWlyZSAnLi9nZW5lcmFsLW9wZXJhdG9ycydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL3NldHRpbmdzJ1xuXG4jIFRoZSBvcGVyYXRpb24gZm9yIHRleHQgZW50ZXJlZCBpbiBpbnB1dCBtb2RlLiBCcm9hZGx5IHNwZWFraW5nLCBpbnB1dFxuIyBvcGVyYXRvcnMgbWFuYWdlIGFuIHVuZG8gdHJhbnNhY3Rpb24gYW5kIHNldCBhIEB0eXBpbmdDb21wbGV0ZWQgdmFyaWFibGUgd2hlblxuIyBpdCdzIGRvbmUuIFdoZW4gdGhlIGlucHV0IG9wZXJhdGlvbiBpcyBjb21wbGV0ZWQsIHRoZSB0eXBpbmdDb21wbGV0ZWQgdmFyaWFibGVcbiMgdGVsbHMgdGhlIG9wZXJhdGlvbiB0byByZXBlYXQgaXRzZWxmIGluc3RlYWQgb2YgZW50ZXIgaW5zZXJ0IG1vZGUuXG5jbGFzcyBJbnNlcnQgZXh0ZW5kcyBPcGVyYXRvclxuICBzdGFuZGFsb25lOiB0cnVlXG5cbiAgaXNDb21wbGV0ZTogLT4gQHN0YW5kYWxvbmUgb3Igc3VwZXJcblxuICBjb25maXJtQ2hhbmdlczogKGNoYW5nZXMpIC0+XG4gICAgaWYgY2hhbmdlcy5sZW5ndGggPiAwXG4gICAgICBAdHlwZWRUZXh0ID0gY2hhbmdlc1swXS5uZXdUZXh0XG4gICAgZWxzZVxuICAgICAgQHR5cGVkVGV4dCA9IFwiXCJcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEB0eXBpbmdDb21wbGV0ZWRcbiAgICAgIHJldHVybiB1bmxlc3MgQHR5cGVkVGV4dD8gYW5kIEB0eXBlZFRleHQubGVuZ3RoID4gMFxuICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KEB0eXBlZFRleHQsIG5vcm1hbGl6ZUxpbmVFbmRpbmdzOiB0cnVlLCBhdXRvSW5kZW50OiB0cnVlKVxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgICBjdXJzb3IubW92ZUxlZnQoKSB1bmxlc3MgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgIGVsc2VcbiAgICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZUluc2VydE1vZGUoKVxuICAgICAgQHR5cGluZ0NvbXBsZXRlZCA9IHRydWVcbiAgICByZXR1cm5cblxuICBpbnB1dE9wZXJhdG9yOiAtPiB0cnVlXG5cbmNsYXNzIFJlcGxhY2VNb2RlIGV4dGVuZHMgSW5zZXJ0XG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBAdHlwaW5nQ29tcGxldGVkXG4gICAgICByZXR1cm4gdW5sZXNzIEB0eXBlZFRleHQ/IGFuZCBAdHlwZWRUZXh0Lmxlbmd0aCA+IDBcbiAgICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KEB0eXBlZFRleHQsIG5vcm1hbGl6ZUxpbmVFbmRpbmdzOiB0cnVlKVxuICAgICAgICB0b0RlbGV0ZSA9IEB0eXBlZFRleHQubGVuZ3RoIC0gQGNvdW50Q2hhcnMoJ1xcbicsIEB0eXBlZFRleHQpXG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICBjb3VudCA9IHRvRGVsZXRlXG4gICAgICAgICAgc2VsZWN0aW9uLmRlbGV0ZSgpIHdoaWxlIGNvdW50LS0gYW5kIG5vdCBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgICAgY3Vyc29yLm1vdmVMZWZ0KCkgdW5sZXNzIGN1cnNvci5pc0F0QmVnaW5uaW5nT2ZMaW5lKClcbiAgICBlbHNlXG4gICAgICBAdmltU3RhdGUuYWN0aXZhdGVSZXBsYWNlTW9kZSgpXG4gICAgICBAdHlwaW5nQ29tcGxldGVkID0gdHJ1ZVxuXG4gIGNvdW50Q2hhcnM6IChjaGFyLCBzdHJpbmcpIC0+XG4gICAgc3RyaW5nLnNwbGl0KGNoYXIpLmxlbmd0aCAtIDFcblxuY2xhc3MgSW5zZXJ0QWZ0ZXIgZXh0ZW5kcyBJbnNlcnRcbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yLm1vdmVSaWdodCgpIHVubGVzcyBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5pc0F0RW5kT2ZMaW5lKClcbiAgICBzdXBlclxuXG5jbGFzcyBJbnNlcnRBZnRlckVuZE9mTGluZSBleHRlbmRzIEluc2VydFxuICBleGVjdXRlOiAtPlxuICAgIEBlZGl0b3IubW92ZVRvRW5kT2ZMaW5lKClcbiAgICBzdXBlclxuXG5jbGFzcyBJbnNlcnRBdEJlZ2lubmluZ09mTGluZSBleHRlbmRzIEluc2VydFxuICBleGVjdXRlOiAtPlxuICAgIEBlZGl0b3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICBzdXBlclxuXG5jbGFzcyBJbnNlcnRBYm92ZVdpdGhOZXdsaW5lIGV4dGVuZHMgSW5zZXJ0XG4gIGV4ZWN1dGU6IC0+XG4gICAgQHZpbVN0YXRlLnNldEluc2VydGlvbkNoZWNrcG9pbnQoKSB1bmxlc3MgQHR5cGluZ0NvbXBsZXRlZFxuICAgIEBlZGl0b3IuaW5zZXJ0TmV3bGluZUFib3ZlKClcbiAgICBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5za2lwTGVhZGluZ1doaXRlc3BhY2UoKVxuXG4gICAgaWYgQHR5cGluZ0NvbXBsZXRlZFxuICAgICAgIyBXZSdsbCBoYXZlIGNhcHR1cmVkIHRoZSBpbnNlcnRlZCBuZXdsaW5lLCBidXQgd2Ugd2FudCB0byBkbyB0aGF0XG4gICAgICAjIG92ZXIgYWdhaW4gYnkgaGFuZCwgb3IgZGlmZmVyaW5nIGluZGVudGF0aW9ucyB3aWxsIGJlIHdyb25nLlxuICAgICAgQHR5cGVkVGV4dCA9IEB0eXBlZFRleHQudHJpbUxlZnQoKVxuICAgICAgcmV0dXJuIHN1cGVyXG5cbiAgICBAdmltU3RhdGUuYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICBAdHlwaW5nQ29tcGxldGVkID0gdHJ1ZVxuXG5jbGFzcyBJbnNlcnRCZWxvd1dpdGhOZXdsaW5lIGV4dGVuZHMgSW5zZXJ0XG4gIGV4ZWN1dGU6IC0+XG4gICAgQHZpbVN0YXRlLnNldEluc2VydGlvbkNoZWNrcG9pbnQoKSB1bmxlc3MgQHR5cGluZ0NvbXBsZXRlZFxuICAgIEBlZGl0b3IuaW5zZXJ0TmV3bGluZUJlbG93KClcbiAgICBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5za2lwTGVhZGluZ1doaXRlc3BhY2UoKVxuXG4gICAgaWYgQHR5cGluZ0NvbXBsZXRlZFxuICAgICAgIyBXZSdsbCBoYXZlIGNhcHR1cmVkIHRoZSBpbnNlcnRlZCBuZXdsaW5lLCBidXQgd2Ugd2FudCB0byBkbyB0aGF0XG4gICAgICAjIG92ZXIgYWdhaW4gYnkgaGFuZCwgb3IgZGlmZmVyaW5nIGluZGVudGF0aW9ucyB3aWxsIGJlIHdyb25nLlxuICAgICAgQHR5cGVkVGV4dCA9IEB0eXBlZFRleHQudHJpbUxlZnQoKVxuICAgICAgcmV0dXJuIHN1cGVyXG5cbiAgICBAdmltU3RhdGUuYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICBAdHlwaW5nQ29tcGxldGVkID0gdHJ1ZVxuXG4jXG4jIERlbGV0ZSB0aGUgZm9sbG93aW5nIG1vdGlvbiBhbmQgZW50ZXIgaW5zZXJ0IG1vZGUgdG8gcmVwbGFjZSBpdC5cbiNcbmNsYXNzIENoYW5nZSBleHRlbmRzIEluc2VydFxuICBzdGFuZGFsb25lOiBmYWxzZVxuICByZWdpc3RlcjogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlKSAtPlxuICAgIEByZWdpc3RlciA9IHNldHRpbmdzLmRlZmF1bHRSZWdpc3RlcigpXG5cbiAgIyBQdWJsaWM6IENoYW5nZXMgdGhlIHRleHQgc2VsZWN0ZWQgYnkgdGhlIGdpdmVuIG1vdGlvbi5cbiAgI1xuICAjIGNvdW50IC0gVGhlIG51bWJlciBvZiB0aW1lcyB0byBleGVjdXRlLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBleGVjdXRlOiAoY291bnQpIC0+XG4gICAgaWYgXy5jb250YWlucyhAbW90aW9uLnNlbGVjdChjb3VudCwgZXhjbHVkZVdoaXRlc3BhY2U6IHRydWUpLCB0cnVlKVxuICAgICAgIyBJZiB3ZSd2ZSB0eXBlZCwgd2UncmUgYmVpbmcgcmVwZWF0ZWQuIElmIHdlJ3JlIGJlaW5nIHJlcGVhdGVkLFxuICAgICAgIyB1bmRvIHRyYW5zYWN0aW9ucyBhcmUgYWxyZWFkeSBoYW5kbGVkLlxuICAgICAgQHZpbVN0YXRlLnNldEluc2VydGlvbkNoZWNrcG9pbnQoKSB1bmxlc3MgQHR5cGluZ0NvbXBsZXRlZFxuXG4gICAgICBAc2V0VGV4dFJlZ2lzdGVyKEByZWdpc3RlciwgQGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKSlcbiAgICAgIGlmIEBtb3Rpb24uaXNMaW5ld2lzZT8oKSBhbmQgbm90IEB0eXBpbmdDb21wbGV0ZWRcbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgIGlmIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmVuZC5yb3cgaXMgMFxuICAgICAgICAgICAgc2VsZWN0aW9uLmRlbGV0ZVNlbGVjdGVkVGV4dCgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoXCJcXG5cIiwgYXV0b0luZGVudDogdHJ1ZSlcbiAgICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcbiAgICAgIGVsc2VcbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgIHNlbGVjdGlvbi5kZWxldGVTZWxlY3RlZFRleHQoKVxuXG4gICAgICByZXR1cm4gc3VwZXIgaWYgQHR5cGluZ0NvbXBsZXRlZFxuXG4gICAgICBAdmltU3RhdGUuYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICAgIEB0eXBpbmdDb21wbGV0ZWQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQHZpbVN0YXRlLmFjdGl2YXRlTm9ybWFsTW9kZSgpXG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEluc2VydCxcbiAgSW5zZXJ0QWZ0ZXIsXG4gIEluc2VydEFmdGVyRW5kT2ZMaW5lLFxuICBJbnNlcnRBdEJlZ2lubmluZ09mTGluZSxcbiAgSW5zZXJ0QWJvdmVXaXRoTmV3bGluZSxcbiAgSW5zZXJ0QmVsb3dXaXRoTmV3bGluZSxcbiAgUmVwbGFjZU1vZGUsXG4gIENoYW5nZVxufVxuIl19
