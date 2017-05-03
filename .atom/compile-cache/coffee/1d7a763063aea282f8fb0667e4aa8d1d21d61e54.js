(function() {
  var Base, CompositeDisposable, Disposable, MoveToRelativeLine, OperationAbortedError, OperationStack, Select, moveCursorLeft, ref, ref1, settings, swrap;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  Base = require('./base');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ref1 = {}, Select = ref1.Select, MoveToRelativeLine = ref1.MoveToRelativeLine;

  OperationAbortedError = require('./errors').OperationAbortedError;

  swrap = require('./selection-wrapper');

  OperationStack = (function() {
    Object.defineProperty(OperationStack.prototype, 'mode', {
      get: function() {
        return this.modeManager.mode;
      }
    });

    Object.defineProperty(OperationStack.prototype, 'submode', {
      get: function() {
        return this.modeManager.submode;
      }
    });

    function OperationStack(vimState) {
      var ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement, this.modeManager = ref2.modeManager;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      if (Select == null) {
        Select = Base.getClass('Select');
      }
      if (MoveToRelativeLine == null) {
        MoveToRelativeLine = Base.getClass('MoveToRelativeLine');
      }
      this.reset();
    }

    OperationStack.prototype.subscribe = function(handler) {
      this.operationSubscriptions.add(handler);
      return handler;
    };

    OperationStack.prototype.reset = function() {
      var ref2;
      this.resetCount();
      this.stack = [];
      this.processing = false;
      this.vimState.emitDidResetOperationStack();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return this.operationSubscriptions = new CompositeDisposable;
    };

    OperationStack.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return ref3 = {}, this.stack = ref3.stack, this.operationSubscriptions = ref3.operationSubscriptions, ref3;
    };

    OperationStack.prototype.peekTop = function() {
      return this.stack[this.stack.length - 1];
    };

    OperationStack.prototype.isEmpty = function() {
      return this.stack.length === 0;
    };

    OperationStack.prototype.run = function(klass, properties) {
      var error, operation, ref2, type;
      try {
        type = typeof klass;
        if (type === 'object') {
          operation = klass;
        } else {
          if (type === 'string') {
            klass = Base.getClass(klass);
          }
          if (((ref2 = this.peekTop()) != null ? ref2.constructor : void 0) === klass) {
            operation = new MoveToRelativeLine(this.vimState);
          } else {
            operation = new klass(this.vimState, properties);
          }
        }
        if (operation.isTextObject() && this.mode !== 'operator-pending' || operation.isMotion() && this.mode === 'visual') {
          operation = new Select(this.vimState).setTarget(operation);
        }
        if (this.isEmpty() || (this.peekTop().isOperator() && operation.isTarget())) {
          this.stack.push(operation);
          return this.process();
        } else {
          if (this.peekTop().isOperator()) {
            this.vimState.emitDidFailToSetTarget();
          }
          return this.vimState.resetNormalMode();
        }
      } catch (error1) {
        error = error1;
        return this.handleError(error);
      }
    };

    OperationStack.prototype.runRecorded = function() {
      var count, operation, ref2;
      if (operation = this.recordedOperation) {
        operation.setRepeated();
        if (this.hasCount()) {
          count = this.getCount();
          operation.count = count;
          if ((ref2 = operation.target) != null) {
            ref2.count = count;
          }
        }
        return this.editor.transact((function(_this) {
          return function() {
            return _this.run(operation);
          };
        })(this));
      }
    };

    OperationStack.prototype.runRecordedMotion = function(key, arg) {
      var operation, reverse;
      reverse = (arg != null ? arg : {}).reverse;
      if (!(operation = this.vimState.globalState.get(key))) {
        return;
      }
      operation = operation.clone(this.vimState);
      operation.setRepeated();
      operation.resetCount();
      if (reverse) {
        operation.backwards = !operation.backwards;
      }
      return this.run(operation);
    };

    OperationStack.prototype.runCurrentFind = function(options) {
      return this.runRecordedMotion('currentFind', options);
    };

    OperationStack.prototype.runCurrentSearch = function(options) {
      return this.runRecordedMotion('currentSearch', options);
    };

    OperationStack.prototype.handleError = function(error) {
      this.vimState.reset();
      if (!(error instanceof OperationAbortedError)) {
        throw error;
      }
    };

    OperationStack.prototype.isProcessing = function() {
      return this.processing;
    };

    OperationStack.prototype.process = function() {
      var base, commandName, operation, top;
      this.processing = true;
      if (this.stack.length === 2) {
        if (!this.peekTop().isComplete()) {
          return;
        }
        operation = this.stack.pop();
        this.peekTop().setTarget(operation);
      }
      top = this.peekTop();
      if (top.isComplete()) {
        return this.execute(this.stack.pop());
      } else {
        if (this.mode === 'normal' && top.isOperator()) {
          this.modeManager.activate('operator-pending');
        }
        if (commandName = typeof (base = top.constructor).getCommandNameWithoutPrefix === "function" ? base.getCommandNameWithoutPrefix() : void 0) {
          return this.addToClassList(commandName + "-pending");
        }
      }
    };

    OperationStack.prototype.execute = function(operation) {
      var execution;
      if (this.mode === 'visual') {
        this.vimState.updatePreviousSelection();
      }
      execution = operation.execute();
      if (execution instanceof Promise) {
        return execution.then((function(_this) {
          return function() {
            return _this.finish(operation);
          };
        })(this))["catch"]((function(_this) {
          return function() {
            return _this.handleError();
          };
        })(this));
      } else {
        return this.finish(operation);
      }
    };

    OperationStack.prototype.cancel = function() {
      var ref2;
      if ((ref2 = this.mode) !== 'visual' && ref2 !== 'insert') {
        this.vimState.resetNormalMode();
      }
      return this.finish();
    };

    OperationStack.prototype.finish = function(operation) {
      if (operation == null) {
        operation = null;
      }
      if (operation != null ? operation.isRecordable() : void 0) {
        this.recordedOperation = operation;
      }
      this.vimState.emitter.emit('did-finish-operation');
      if (this.mode === 'normal') {
        this.ensureAllSelectionsAreEmpty(operation);
        this.ensureAllCursorsAreNotAtEndOfLine();
      } else if (this.mode === 'visual') {
        this.modeManager.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.updateCursorsVisibility();
      return this.vimState.reset();
    };

    OperationStack.prototype.ensureAllSelectionsAreEmpty = function(operation) {
      if (!this.editor.getLastSelection().isEmpty()) {
        if (settings.get('throwErrorOnNonEmptySelectionInNormalMode')) {
          throw new Error("Selection is not empty in normal-mode: " + (operation.toString()));
        } else {
          return this.editor.clearSelections();
        }
      }
    };

    OperationStack.prototype.ensureAllCursorsAreNotAtEndOfLine = function() {
      var cursor, i, len, ref2, results;
      ref2 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        if (cursor.isAtEndOfLine()) {
          results.push(moveCursorLeft(cursor, {
            preserveGoalColumn: true
          }));
        }
      }
      return results;
    };

    OperationStack.prototype.addToClassList = function(className) {
      this.editorElement.classList.add(className);
      return this.subscribe(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.classList.remove(className);
        };
      })(this)));
    };

    OperationStack.prototype.hasCount = function() {
      return (this.count['normal'] != null) || (this.count['operator-pending'] != null);
    };

    OperationStack.prototype.getCount = function() {
      var ref2, ref3;
      if (this.hasCount()) {
        return ((ref2 = this.count['normal']) != null ? ref2 : 1) * ((ref3 = this.count['operator-pending']) != null ? ref3 : 1);
      } else {
        return null;
      }
    };

    OperationStack.prototype.setCount = function(number) {
      var base, mode;
      if (this.mode === 'operator-pending') {
        mode = this.mode;
      } else {
        mode = 'normal';
      }
      if ((base = this.count)[mode] == null) {
        base[mode] = 0;
      }
      this.count[mode] = (this.count[mode] * 10) + number;
      this.vimState.hover.add(number);
      return this.vimState.toggleClassList('with-count', true);
    };

    OperationStack.prototype.resetCount = function() {
      this.count = {};
      return this.vimState.toggleClassList('with-count', false);
    };

    return OperationStack;

  })();

  module.exports = OperationStack;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRpb24tc3RhY2suY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsTUFBUixDQUFwQyxFQUFDLDJCQUFELEVBQWE7O0VBQ2IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNOLGlCQUFrQixPQUFBLENBQVEsU0FBUjs7RUFDbkIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLE9BQStCLEVBQS9CLEVBQUMsb0JBQUQsRUFBUzs7RUFDUix3QkFBeUIsT0FBQSxDQUFRLFVBQVI7O0VBQzFCLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBWUY7SUFDSixNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsTUFBbEMsRUFBMEM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUExQzs7SUFDQSxNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsU0FBbEMsRUFBNkM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUE3Qzs7SUFFYSx3QkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBMEMsSUFBQyxDQUFBLFFBQTNDLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQSxhQUFYLEVBQTBCLElBQUMsQ0FBQSxtQkFBQTtNQUUzQixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxD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QURROzs2QkFNVixRQUFBLEdBQVUsU0FBQyxNQUFEO0FBQ1IsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxrQkFBWjtRQUNFLElBQUEsR0FBTyxJQUFDLENBQUEsS0FEVjtPQUFBLE1BQUE7UUFHRSxJQUFBLEdBQU8sU0FIVDs7O1lBSU8sQ0FBQSxJQUFBLElBQVM7O01BQ2hCLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFQLEdBQWUsQ0FBQyxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLEVBQWhCLENBQUEsR0FBc0I7TUFDckMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBaEIsQ0FBb0IsTUFBcEI7YUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBMEIsWUFBMUIsRUFBd0MsSUFBeEM7SUFSUTs7NkJBVVYsVUFBQSxHQUFZLFNBQUE7TUFDVixJQUFDLENBQUEsS0FBRCxHQUFTO2FBQ1QsSUFBQyxDQUFBLFFBQVEsQ0FBQyxlQUFWLENBQTBCLFlBQTFCLEVBQXdDLEtBQXhDO0lBRlU7Ozs7OztFQUlkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBek5qQiIsInNvdXJjZXNDb250ZW50IjpbIntEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xue21vdmVDdXJzb3JMZWZ0fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG57U2VsZWN0LCBNb3ZlVG9SZWxhdGl2ZUxpbmV9ID0ge31cbntPcGVyYXRpb25BYm9ydGVkRXJyb3J9ID0gcmVxdWlyZSAnLi9lcnJvcnMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbiMgb3ByYXRpb24gbGlmZSBpbiBvcGVyYXRpb25TdGFja1xuIyAxLiBydW5cbiMgICAgaW5zdGFudGlhdGVkIGJ5IG5ldy5cbiMgICAgY29tcGxpbWVudCBpbXBsaWNpdCBPcGVyYXRvci5TZWxlY3Qgb3BlcmF0b3IgaWYgbmVjZXNzYXJ5LlxuIyAgICBwdXNoIG9wZXJhdGlvbiB0byBzdGFjay5cbiMgMi4gcHJvY2Vzc1xuIyAgICByZWR1Y2Ugc3RhY2sgYnksIHBvcHBpbmcgdG9wIG9mIHN0YWNrIHRoZW4gc2V0IGl0IGFzIHRhcmdldCBvZiBuZXcgdG9wLlxuIyAgICBjaGVjayBpZiByZW1haW5pbmcgdG9wIG9mIHN0YWNrIGlzIGV4ZWN1dGFibGUgYnkgY2FsbGluZyBpc0NvbXBsZXRlKClcbiMgICAgaWYgZXhlY3V0YWJsZSwgdGhlbiBwb3Agc3RhY2sgdGhlbiBleGVjdXRlKHBvcHBlZE9wZXJhdGlvbilcbiMgICAgaWYgbm90IGV4ZWN1dGFibGUsIGVudGVyIFwib3BlcmF0b3ItcGVuZGluZy1tb2RlXCJcbmNsYXNzIE9wZXJhdGlvblN0YWNrXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBAcHJvdG90eXBlLCAnbW9kZScsIGdldDogLT4gQG1vZGVNYW5hZ2VyLm1vZGVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsICdzdWJtb2RlJywgZ2V0OiAtPiBAbW9kZU1hbmFnZXIuc3VibW9kZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQG1vZGVNYW5hZ2VyfSA9IEB2aW1TdGF0ZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgICBTZWxlY3QgPz0gQmFzZS5nZXRDbGFzcygnU2VsZWN0JylcbiAgICBNb3ZlVG9SZWxhdGl2ZUxpbmUgPz0gQmFzZS5nZXRDbGFzcygnTW92ZVRvUmVsYXRpdmVMaW5lJylcblxuICAgIEByZXNldCgpXG5cbiAgIyBSZXR1cm4gaGFuZGxlclxuICBzdWJzY3JpYmU6IChoYW5kbGVyKSAtPlxuICAgIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmFkZChoYW5kbGVyKVxuICAgIGhhbmRsZXIgIyBET05UIFJFTU9WRVxuXG4gIHJlc2V0OiAtPlxuICAgIEByZXNldENvdW50KClcbiAgICBAc3RhY2sgPSBbXVxuICAgIEBwcm9jZXNzaW5nID0gZmFsc2VcblxuICAgICMgdGhpcyBoYXMgdG8gYmUgQkVGT1JFIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEB2aW1TdGF0ZS5lbWl0RGlkUmVzZXRPcGVyYXRpb25TdGFjaygpXG5cbiAgICBAb3BlcmF0aW9uU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIHtAc3RhY2ssIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zfSA9IHt9XG5cbiAgcGVla1RvcDogLT5cbiAgICBAc3RhY2tbQHN0YWNrLmxlbmd0aCAtIDFdXG5cbiAgaXNFbXB0eTogLT5cbiAgICBAc3RhY2subGVuZ3RoIGlzIDBcblxuICAjIE1haW5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bjogKGtsYXNzLCBwcm9wZXJ0aWVzKSAtPlxuICAgIHRyeVxuICAgICAgdHlwZSA9IHR5cGVvZihrbGFzcylcbiAgICAgIGlmIHR5cGUgaXMgJ29iamVjdCcgIyAuIHJlcGVhdCBjYXNlIHdlIGNhbiBleGVjdXRlIGFzLWl0LWlzLlxuICAgICAgICBvcGVyYXRpb24gPSBrbGFzc1xuICAgICAgZWxzZVxuICAgICAgICBrbGFzcyA9IEJhc2UuZ2V0Q2xhc3Moa2xhc3MpIGlmIHR5cGUgaXMgJ3N0cmluZydcbiAgICAgICAgIyBSZXBsYWNlIG9wZXJhdG9yIHdoZW4gaWRlbnRpY2FsIG9uZSByZXBlYXRlZCwgZS5nLiBgZGRgLCBgY2NgLCBgZ1VnVWBcbiAgICAgICAgaWYgQHBlZWtUb3AoKT8uY29uc3RydWN0b3IgaXMga2xhc3NcbiAgICAgICAgICBvcGVyYXRpb24gPSBuZXcgTW92ZVRvUmVsYXRpdmVMaW5lKEB2aW1TdGF0ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG9wZXJhdGlvbiA9IG5ldyBrbGFzcyhAdmltU3RhdGUsIHByb3BlcnRpZXMpXG5cbiAgICAgICMgQ29tcGxpbWVudCBpbXBsaWNpdCBTZWxlY3Qgb3BlcmF0b3JcbiAgICAgIGlmIG9wZXJhdGlvbi5pc1RleHRPYmplY3QoKSBhbmQgQG1vZGUgaXNudCAnb3BlcmF0b3ItcGVuZGluZycgb3Igb3BlcmF0aW9uLmlzTW90aW9uKCkgYW5kIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICAgIG9wZXJhdGlvbiA9IG5ldyBTZWxlY3QoQHZpbVN0YXRlKS5zZXRUYXJnZXQob3BlcmF0aW9uKVxuXG4gICAgICBpZiBAaXNFbXB0eSgpIG9yIChAcGVla1RvcCgpLmlzT3BlcmF0b3IoKSBhbmQgb3BlcmF0aW9uLmlzVGFyZ2V0KCkpXG4gICAgICAgIEBzdGFjay5wdXNoKG9wZXJhdGlvbilcbiAgICAgICAgQHByb2Nlc3MoKVxuICAgICAgZWxzZVxuICAgICAgICBAdmltU3RhdGUuZW1pdERpZEZhaWxUb1NldFRhcmdldCgpIGlmIEBwZWVrVG9wKCkuaXNPcGVyYXRvcigpXG4gICAgICAgIEB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBAaGFuZGxlRXJyb3IoZXJyb3IpXG5cbiAgcnVuUmVjb3JkZWQ6IC0+XG4gICAgaWYgb3BlcmF0aW9uID0gQHJlY29yZGVkT3BlcmF0aW9uXG4gICAgICBvcGVyYXRpb24uc2V0UmVwZWF0ZWQoKVxuICAgICAgaWYgQGhhc0NvdW50KClcbiAgICAgICAgY291bnQgPSBAZ2V0Q291bnQoKVxuICAgICAgICBvcGVyYXRpb24uY291bnQgPSBjb3VudFxuICAgICAgICBvcGVyYXRpb24udGFyZ2V0Py5jb3VudCA9IGNvdW50ICMgU29tZSBvcGVhcnRvciBoYXZlIG5vIHRhcmdldCBsaWtlIGN0cmwtYShpbmNyZWFzZSkuXG5cbiAgICAgICMgW0ZJWE1FXSBEZWdyYWRhdGlvbiwgdGhpcyBgdHJhbnNhY3RgIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5XG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIEBydW4ob3BlcmF0aW9uKVxuXG4gIHJ1blJlY29yZGVkTW90aW9uOiAoa2V5LCB7cmV2ZXJzZX09e30pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBvcGVyYXRpb24gPSBAdmltU3RhdGUuZ2xvYmFsU3RhdGUuZ2V0KGtleSlcblxuICAgIG9wZXJhdGlvbiA9IG9wZXJhdGlvbi5jbG9uZShAdmltU3RhdGUpXG4gICAgb3BlcmF0aW9uLnNldFJlcGVhdGVkKClcbiAgICBvcGVyYXRpb24ucmVzZXRDb3VudCgpXG4gICAgaWYgcmV2ZXJzZVxuICAgICAgb3BlcmF0aW9uLmJhY2t3YXJkcyA9IG5vdCBvcGVyYXRpb24uYmFja3dhcmRzXG4gICAgQHJ1bihvcGVyYXRpb24pXG5cbiAgcnVuQ3VycmVudEZpbmQ6IChvcHRpb25zKSAtPlxuICAgIEBydW5SZWNvcmRlZE1vdGlvbignY3VycmVudEZpbmQnLCBvcHRpb25zKVxuXG4gIHJ1bkN1cnJlbnRTZWFyY2g6IChvcHRpb25zKSAtPlxuICAgIEBydW5SZWNvcmRlZE1vdGlvbignY3VycmVudFNlYXJjaCcsIG9wdGlvbnMpXG5cbiAgaGFuZGxlRXJyb3I6IChlcnJvcikgLT5cbiAgICBAdmltU3RhdGUucmVzZXQoKVxuICAgIHVubGVzcyBlcnJvciBpbnN0YW5jZW9mIE9wZXJhdGlvbkFib3J0ZWRFcnJvclxuICAgICAgdGhyb3cgZXJyb3JcblxuICBpc1Byb2Nlc3Npbmc6IC0+XG4gICAgQHByb2Nlc3NpbmdcblxuICBwcm9jZXNzOiAtPlxuICAgIEBwcm9jZXNzaW5nID0gdHJ1ZVxuICAgIGlmIEBzdGFjay5sZW5ndGggaXMgMlxuICAgICAgIyBbRklYTUUgaWRlYWxseV1cbiAgICAgICMgSWYgdGFyZ2V0IGlzIG5vdCBjb21wbGV0ZSwgd2UgcG9zdHBvbmUgY29tcHNpbmcgdGFyZ2V0IHdpdGggb3BlcmF0b3IgdG8ga2VlcCBzaXR1YXRpb24gc2ltcGxlLlxuICAgICAgIyBXZSBjYW4gYXNzdW1lLCB3aGVuIHRhcmdldCBpcyBzZXQgdG8gb3BlcmF0b3IgaXQncyBjb21wbGV0ZS5cbiAgICAgIHJldHVybiB1bmxlc3MgQHBlZWtUb3AoKS5pc0NvbXBsZXRlKClcbiAgICAgIG9wZXJhdGlvbiA9IEBzdGFjay5wb3AoKVxuICAgICAgQHBlZWtUb3AoKS5zZXRUYXJnZXQob3BlcmF0aW9uKVxuXG4gICAgdG9wID0gQHBlZWtUb3AoKVxuICAgIGlmIHRvcC5pc0NvbXBsZXRlKClcbiAgICAgIEBleGVjdXRlKEBzdGFjay5wb3AoKSlcbiAgICBlbHNlXG4gICAgICBpZiBAbW9kZSBpcyAnbm9ybWFsJyBhbmQgdG9wLmlzT3BlcmF0b3IoKVxuICAgICAgICBAbW9kZU1hbmFnZXIuYWN0aXZhdGUoJ29wZXJhdG9yLXBlbmRpbmcnKVxuXG4gICAgICAjIFRlbXBvcmFyeSBzZXQgd2hpbGUgY29tbWFuZCBpcyBydW5uaW5nXG4gICAgICBpZiBjb21tYW5kTmFtZSA9IHRvcC5jb25zdHJ1Y3Rvci5nZXRDb21tYW5kTmFtZVdpdGhvdXRQcmVmaXg/KClcbiAgICAgICAgQGFkZFRvQ2xhc3NMaXN0KGNvbW1hbmROYW1lICsgXCItcGVuZGluZ1wiKVxuXG4gIGV4ZWN1dGU6IChvcGVyYXRpb24pIC0+XG4gICAgQHZpbVN0YXRlLnVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uKCkgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICBleGVjdXRpb24gPSBvcGVyYXRpb24uZXhlY3V0ZSgpXG4gICAgaWYgZXhlY3V0aW9uIGluc3RhbmNlb2YgUHJvbWlzZVxuICAgICAgZXhlY3V0aW9uXG4gICAgICAgIC50aGVuID0+IEBmaW5pc2gob3BlcmF0aW9uKVxuICAgICAgICAuY2F0Y2ggPT4gQGhhbmRsZUVycm9yKClcbiAgICBlbHNlXG4gICAgICBAZmluaXNoKG9wZXJhdGlvbilcblxuICBjYW5jZWw6IC0+XG4gICAgaWYgQG1vZGUgbm90IGluIFsndmlzdWFsJywgJ2luc2VydCddXG4gICAgICBAdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcbiAgICBAZmluaXNoKClcblxuICBmaW5pc2g6IChvcGVyYXRpb249bnVsbCkgLT5cbiAgICBAcmVjb3JkZWRPcGVyYXRpb24gPSBvcGVyYXRpb24gaWYgb3BlcmF0aW9uPy5pc1JlY29yZGFibGUoKVxuICAgIEB2aW1TdGF0ZS5lbWl0dGVyLmVtaXQoJ2RpZC1maW5pc2gtb3BlcmF0aW9uJylcblxuICAgIGlmIEBtb2RlIGlzICdub3JtYWwnXG4gICAgICBAZW5zdXJlQWxsU2VsZWN0aW9uc0FyZUVtcHR5KG9wZXJhdGlvbilcbiAgICAgIEBlbnN1cmVBbGxDdXJzb3JzQXJlTm90QXRFbmRPZkxpbmUoKVxuICAgIGVsc2UgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEBtb2RlTWFuYWdlci51cGRhdGVOYXJyb3dlZFN0YXRlKClcbiAgICAgIEB2aW1TdGF0ZS51cGRhdGVQcmV2aW91c1NlbGVjdGlvbigpXG4gICAgQHZpbVN0YXRlLnVwZGF0ZUN1cnNvcnNWaXNpYmlsaXR5KClcbiAgICBAdmltU3RhdGUucmVzZXQoKVxuXG4gIGVuc3VyZUFsbFNlbGVjdGlvbnNBcmVFbXB0eTogKG9wZXJhdGlvbikgLT5cbiAgICB1bmxlc3MgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNFbXB0eSgpXG4gICAgICBpZiBzZXR0aW5ncy5nZXQoJ3Rocm93RXJyb3JPbk5vbkVtcHR5U2VsZWN0aW9uSW5Ob3JtYWxNb2RlJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0aW9uIGlzIG5vdCBlbXB0eSBpbiBub3JtYWwtbW9kZTogI3tvcGVyYXRpb24udG9TdHJpbmcoKX1cIilcbiAgICAgIGVsc2VcbiAgICAgICAgQGVkaXRvci5jbGVhclNlbGVjdGlvbnMoKVxuXG4gIGVuc3VyZUFsbEN1cnNvcnNBcmVOb3RBdEVuZE9mTGluZTogLT5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpIHdoZW4gY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgbW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7cHJlc2VydmVHb2FsQ29sdW1uOiB0cnVlfSlcblxuICBhZGRUb0NsYXNzTGlzdDogKGNsYXNzTmFtZSkgLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSlcbiAgICBAc3Vic2NyaWJlIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSlcblxuICAjIENvdW50XG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIGtleXN0cm9rZSBgM2Qyd2AgZGVsZXRlIDYoMyoyKSB3b3Jkcy5cbiAgIyAgMm5kIG51bWJlcigyIGluIHRoaXMgY2FzZSkgaXMgYWx3YXlzIGVudGVyZCBpbiBvcGVyYXRvci1wZW5kaW5nLW1vZGUuXG4gICMgIFNvIGNvdW50IGhhdmUgdHdvIHRpbWluZyB0byBiZSBlbnRlcmVkLiB0aGF0J3Mgd2h5IGhlcmUgd2UgbWFuYWdlIGNvdW50ZXIgYnkgbW9kZS5cbiAgaGFzQ291bnQ6IC0+XG4gICAgQGNvdW50Wydub3JtYWwnXT8gb3IgQGNvdW50WydvcGVyYXRvci1wZW5kaW5nJ10/XG5cbiAgZ2V0Q291bnQ6IC0+XG4gICAgaWYgQGhhc0NvdW50KClcbiAgICAgIChAY291bnRbJ25vcm1hbCddID8gMSkgKiAoQGNvdW50WydvcGVyYXRvci1wZW5kaW5nJ10gPyAxKVxuICAgIGVsc2VcbiAgICAgIG51bGxcblxuICBzZXRDb3VudDogKG51bWJlcikgLT5cbiAgICBpZiBAbW9kZSBpcyAnb3BlcmF0b3ItcGVuZGluZydcbiAgICAgIG1vZGUgPSBAbW9kZVxuICAgIGVsc2VcbiAgICAgIG1vZGUgPSAnbm9ybWFsJ1xuICAgIEBjb3VudFttb2RlXSA/PSAwXG4gICAgQGNvdW50W21vZGVdID0gKEBjb3VudFttb2RlXSAqIDEwKSArIG51bWJlclxuICAgIEB2aW1TdGF0ZS5ob3Zlci5hZGQobnVtYmVyKVxuICAgIEB2aW1TdGF0ZS50b2dnbGVDbGFzc0xpc3QoJ3dpdGgtY291bnQnLCB0cnVlKVxuXG4gIHJlc2V0Q291bnQ6IC0+XG4gICAgQGNvdW50ID0ge31cbiAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLWNvdW50JywgZmFsc2UpXG5cbm1vZHVsZS5leHBvcnRzID0gT3BlcmF0aW9uU3RhY2tcbiJdfQ==
