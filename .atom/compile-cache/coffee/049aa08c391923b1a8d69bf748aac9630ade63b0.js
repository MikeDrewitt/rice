(function() {
  var Base, CompositeDisposable, Delegato, OperationAbortedError, _, getEditorState, getVimEofBufferPosition, getVimLastBufferRow, getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition, ref, selectList, settings, swrap, vimStateMethods,
    slice = [].slice,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  Delegato = require('delegato');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('./utils'), getVimEofBufferPosition = ref.getVimEofBufferPosition, getVimLastBufferRow = ref.getVimLastBufferRow, getVimLastScreenRow = ref.getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition = ref.getWordBufferRangeAndKindAtBufferPosition;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  selectList = null;

  getEditorState = null;

  OperationAbortedError = require('./errors').OperationAbortedError;

  vimStateMethods = ["onDidChangeInput", "onDidConfirmInput", "onDidCancelInput", "onDidChangeSearch", "onDidConfirmSearch", "onDidCancelSearch", "onDidCommandSearch", "onDidSetTarget", "onWillSelectTarget", "onDidSelectTarget", "preemptWillSelectTarget", "preemptDidSelectTarget", "onDidRestoreCursorPositions", "onDidSetOperatorModifier", "onDidResetOperationStack", "onWillActivateMode", "onDidActivateMode", "onWillDeactivateMode", "preemptWillDeactivateMode", "onDidDeactivateMode", "onDidFinishOperation", "onDidCancelSelectList", "subscribe", "isMode", "getBlockwiseSelections", "updateSelectionProperties", "addToClassList"];

  Base = (function() {
    var registries;

    Delegato.includeInto(Base);

    Base.delegatesMethods.apply(Base, slice.call(vimStateMethods).concat([{
      toProperty: 'vimState'
    }]));

    function Base(vimState1, properties) {
      var hover, ref1, ref2;
      this.vimState = vimState1;
      if (properties == null) {
        properties = null;
      }
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState;
      if (properties != null) {
        _.extend(this, properties);
      }
      if (settings.get('showHoverOnOperate')) {
        hover = (ref2 = this.hover) != null ? ref2[settings.get('showHoverOnOperateIcon')] : void 0;
        if ((hover != null) && !this.isComplete()) {
          this.addHover(hover);
        }
      }
    }

    Base.prototype.initialize = function() {};

    Base.prototype.isComplete = function() {
      var ref1;
      if (this.isRequireInput() && !this.hasInput()) {
        return false;
      } else if (this.isRequireTarget()) {
        return (ref1 = this.getTarget()) != null ? typeof ref1.isComplete === "function" ? ref1.isComplete() : void 0 : void 0;
      } else {
        return true;
      }
    };

    Base.prototype.target = null;

    Base.prototype.hasTarget = function() {
      return this.target != null;
    };

    Base.prototype.getTarget = function() {
      return this.target;
    };

    Base.prototype.requireTarget = false;

    Base.prototype.isRequireTarget = function() {
      return this.requireTarget;
    };

    Base.prototype.requireInput = false;

    Base.prototype.isRequireInput = function() {
      return this.requireInput;
    };

    Base.prototype.recordable = false;

    Base.prototype.isRecordable = function() {
      return this.recordable;
    };

    Base.prototype.repeated = false;

    Base.prototype.isRepeated = function() {
      return this.repeated;
    };

    Base.prototype.setRepeated = function() {
      return this.repeated = true;
    };

    Base.prototype.operator = null;

    Base.prototype.hasOperator = function() {
      return this.operator != null;
    };

    Base.prototype.getOperator = function() {
      return this.operator;
    };

    Base.prototype.setOperator = function(operator1) {
      this.operator = operator1;
      return this.operator;
    };

    Base.prototype.isAsOperatorTarget = function() {
      return this.hasOperator() && !this.getOperator()["instanceof"]('Select');
    };

    Base.prototype.abort = function() {
      throw new OperationAbortedError('aborted');
    };

    Base.prototype.count = null;

    Base.prototype.defaultCount = 1;

    Base.prototype.getCount = function() {
      var ref1;
      return this.count != null ? this.count : this.count = (ref1 = this.vimState.getCount()) != null ? ref1 : this.defaultCount;
    };

    Base.prototype.resetCount = function() {
      return this.count = null;
    };

    Base.prototype.isDefaultCount = function() {
      return this.count === this.defaultCount;
    };

    Base.prototype.register = null;

    Base.prototype.getRegisterName = function() {
      var text;
      this.vimState.register.getName();
      return text = this.vimState.register.getText(this.getInput(), selection);
    };

    Base.prototype.getRegisterValueAsText = function(name, selection) {
      if (name == null) {
        name = null;
      }
      return this.vimState.register.getText(name, selection);
    };

    Base.prototype.isDefaultRegisterName = function() {
      return this.vimState.register.isDefaultName();
    };

    Base.prototype.countTimes = function(fn) {
      var count, i, isFinal, last, ref1, results, stop, stopped;
      if ((last = this.getCount()) < 1) {
        return;
      }
      stopped = false;
      stop = function() {
        return stopped = true;
      };
      results = [];
      for (count = i = 1, ref1 = last; 1 <= ref1 ? i <= ref1 : i >= ref1; count = 1 <= ref1 ? ++i : --i) {
        isFinal = count === last;
        fn({
          count: count,
          isFinal: isFinal,
          stop: stop
        });
        if (stopped) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Base.prototype.activateMode = function(mode, submode) {
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.vimState.activate(mode, submode);
        };
      })(this));
    };

    Base.prototype.activateModeIfNecessary = function(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        return this.activateMode(mode, submode);
      }
    };

    Base.prototype.addHover = function(text, arg, point) {
      var replace;
      replace = (arg != null ? arg : {}).replace;
      if (point == null) {
        point = null;
      }
      if (replace != null ? replace : false) {
        return this.vimState.hover.replaceLastSection(text, point);
      } else {
        return this.vimState.hover.add(text, point);
      }
    };

    Base.prototype["new"] = function(name, properties) {
      var klass;
      klass = Base.getClass(name);
      return new klass(this.vimState, properties);
    };

    Base.prototype.clone = function(vimState) {
      var excludeProperties, key, klass, properties, ref1, value;
      properties = {};
      excludeProperties = ['editor', 'editorElement', 'globalState', 'vimState'];
      ref1 = this;
      for (key in ref1) {
        if (!hasProp.call(ref1, key)) continue;
        value = ref1[key];
        if (indexOf.call(excludeProperties, key) < 0) {
          properties[key] = value;
        }
      }
      klass = this.constructor;
      return new klass(vimState, properties);
    };

    Base.prototype.cancelOperation = function() {
      return this.vimState.operationStack.cancel();
    };

    Base.prototype.processOperation = function() {
      return this.vimState.operationStack.process();
    };

    Base.prototype.focusSelectList = function(options) {
      if (options == null) {
        options = {};
      }
      this.onDidCancelSelectList((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      if (selectList == null) {
        selectList = require('./select-list');
      }
      return selectList.show(this.vimState, options);
    };

    Base.prototype.input = null;

    Base.prototype.hasInput = function() {
      return this.input != null;
    };

    Base.prototype.getInput = function() {
      return this.input;
    };

    Base.prototype.focusInput = function(charsMax) {
      var replace;
      this.onDidConfirmInput((function(_this) {
        return function(input) {
          if (_this.input == null) {
            _this.input = input;
            return _this.processOperation();
          }
        };
      })(this));
      if (charsMax !== 1) {
        replace = false;
        this.onDidChangeInput((function(_this) {
          return function(input) {
            _this.addHover(input, {
              replace: replace
            });
            return replace = true;
          };
        })(this));
      }
      this.onDidCancelInput((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      return this.vimState.input.focus(charsMax);
    };

    Base.prototype.getVimEofBufferPosition = function() {
      return getVimEofBufferPosition(this.editor);
    };

    Base.prototype.getVimLastBufferRow = function() {
      return getVimLastBufferRow(this.editor);
    };

    Base.prototype.getVimLastScreenRow = function() {
      return getVimLastScreenRow(this.editor);
    };

    Base.prototype.getWordBufferRangeAndKindAtBufferPosition = function(point, options) {
      return getWordBufferRangeAndKindAtBufferPosition(this.editor, point, options);
    };

    Base.prototype["instanceof"] = function(klassName) {
      return this instanceof Base.getClass(klassName);
    };

    Base.prototype.is = function(klassName) {
      return this.constructor === Base.getClass(klassName);
    };

    Base.prototype.isOperator = function() {
      return this["instanceof"]('Operator');
    };

    Base.prototype.isMotion = function() {
      return this["instanceof"]('Motion');
    };

    Base.prototype.isTextObject = function() {
      return this["instanceof"]('TextObject');
    };

    Base.prototype.isTarget = function() {
      return this.isMotion() || this.isTextObject();
    };

    Base.prototype.getName = function() {
      return this.constructor.name;
    };

    Base.prototype.getCursorBufferPosition = function() {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(this.editor.getLastSelection());
      } else {
        return this.editor.getCursorBufferPosition();
      }
    };

    Base.prototype.getCursorBufferPositions = function() {
      if (this.isMode('visual')) {
        return this.editor.getSelections().map(this.getCursorPositionForSelection.bind(this));
      } else {
        return this.editor.getCursorBufferPositions();
      }
    };

    Base.prototype.getBufferPositionForCursor = function(cursor) {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(cursor.selection);
      } else {
        return cursor.getBufferPosition();
      }
    };

    Base.prototype.getCursorPositionForSelection = function(selection) {
      var options;
      options = {
        fromProperty: true,
        allowFallback: true
      };
      return swrap(selection).getBufferPositionFor('head', options);
    };

    Base.prototype.toString = function() {
      var str;
      str = this.getName();
      if (this.hasTarget()) {
        str += ", target=" + (this.getTarget().toString());
      }
      return str;
    };

    Base.prototype.emitWillSelectTarget = function() {
      return this.vimState.emitter.emit('will-select-target');
    };

    Base.prototype.emitDidSelectTarget = function() {
      return this.vimState.emitter.emit('did-select-target');
    };

    Base.prototype.emitDidSetTarget = function(operator) {
      return this.vimState.emitter.emit('did-set-target', operator);
    };

    Base.prototype.emitDidRestoreCursorPositions = function() {
      return this.vimState.emitter.emit('did-restore-cursor-positions');
    };

    Base.init = function(service) {
      var __, klass, ref1;
      getEditorState = service.getEditorState;
      this.subscriptions = new CompositeDisposable();
      ['./operator', './operator-insert', './operator-transform-string', './motion', './motion-search', './text-object', './insert-mode', './misc-command'].forEach(require);
      ref1 = this.getRegistries();
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          this.subscriptions.add(klass.registerCommand());
        }
      }
      return this.subscriptions;
    };

    Base.reset = function() {
      var __, klass, ref1, results;
      this.subscriptions.dispose();
      this.subscriptions = new CompositeDisposable();
      ref1 = this.getRegistries();
      results = [];
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          results.push(this.subscriptions.add(klass.registerCommand()));
        }
      }
      return results;
    };

    registries = {
      Base: Base
    };

    Base.extend = function(command) {
      this.command = command != null ? command : true;
      if ((name in registries) && (!this.suppressWarning)) {
        console.warn("Duplicate constructor " + this.name);
      }
      return registries[this.name] = this;
    };

    Base.getClass = function(name) {
      var klass;
      if ((klass = registries[name]) != null) {
        return klass;
      } else {
        throw new Error("class '" + name + "' not found");
      }
    };

    Base.getRegistries = function() {
      return registries;
    };

    Base.isCommand = function() {
      return this.command;
    };

    Base.commandPrefix = 'vim-mode-plus';

    Base.getCommandName = function() {
      return this.commandPrefix + ':' + _.dasherize(this.name);
    };

    Base.getCommandNameWithoutPrefix = function() {
      return _.dasherize(this.name);
    };

    Base.commandScope = 'atom-text-editor';

    Base.getCommandScope = function() {
      return this.commandScope;
    };

    Base.getDesctiption = function() {
      if (this.hasOwnProperty("description")) {
        return this.description;
      } else {
        return null;
      }
    };

    Base.registerCommand = function() {
      var klass;
      klass = this;
      return atom.commands.add(this.getCommandScope(), this.getCommandName(), function(event) {
        var ref1, vimState;
        vimState = (ref1 = getEditorState(this.getModel())) != null ? ref1 : getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState != null) {
          vimState.operationStack.run(klass);
        }
        return event.stopPropagation();
      });
    };

    return Base;

  })();

  module.exports = Base;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9iYXNlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOE9BQUE7SUFBQTs7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztFQUNWLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsTUFLSSxPQUFBLENBQVEsU0FBUixDQUxKLEVBQ0UscURBREYsRUFFRSw2Q0FGRixFQUdFLDZDQUhGLEVBSUU7O0VBRUYsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFFUixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsVUFBQSxHQUFhOztFQUNiLGNBQUEsR0FBaUI7O0VBQ2hCLHdCQUF5QixPQUFBLENBQVEsVUFBUjs7RUFFMUIsZUFBQSxHQUFrQixDQUNoQixrQkFEZ0IsRUFFaEIsbUJBRmdCLEVBR2hCLGtCQUhnQixFQUtoQixtQkFMZ0IsRUFNaEIsb0JBTmdCLEVBT2hCLG1CQVBnQixFQVFoQixvQkFSZ0IsRUFVaEIsZ0JBVmdCLEVBV2hCLG9CQVhnQixFQVloQixtQkFaZ0IsRUFhaEIseUJBYmdCLEVBY2hCLHdCQWRnQixFQWVoQiw2QkFmZ0IsRUFnQmhCLDBCQWhCZ0IsRUFpQmhCLDBCQWpCZ0IsRUFtQmhCLG9CQW5CZ0IsRUFvQmhCLG1CQXBCZ0IsRUFxQmhCLHNCQXJCZ0IsRUFzQmhCLDJCQXRCZ0IsRUF1QmhCLHFCQXZCZ0IsRUF5QmhCLHNCQXpCZ0IsRUEyQmhCLHVCQTNCZ0IsRUE0QmhCLFdBNUJnQixFQTZCaEIsUUE3QmdCLEVBOEJoQix3QkE5QmdCLEVBK0JoQiwyQkEvQmdCLEVBZ0NoQixnQkFoQ2dCOztFQW1DWjtBQUNKLFFBQUE7O0lBQUEsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsSUFBckI7O0lBQ0Es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LENBQWdCLGFBQWhCLENBQUg7ZUFDRSxJQUFDLENBQUEsWUFESDtPQUFBLE1BQUE7ZUFHRSxLQUhGOztJQURlOztJQU1qQixJQUFDLENBQUEsZUFBRCxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxLQUFBLEdBQVE7YUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFsQixFQUFzQyxJQUFDLENBQUEsY0FBRCxDQUFBLENBQXRDLEVBQXlELFNBQUMsS0FBRDtBQUN2RCxZQUFBO1FBQUEsUUFBQSw2REFBeUMsY0FBQSxDQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUFmO1FBQ3pDLElBQUcsZ0JBQUg7VUFFRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQXhCLENBQTRCLEtBQTVCLEVBRkY7O2VBR0EsS0FBSyxDQUFDLGVBQU4sQ0FBQTtNQUx1RCxDQUF6RDtJQUZnQjs7Ozs7O0VBU3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBN1ZqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5EZWxlZ2F0byA9IHJlcXVpcmUgJ2RlbGVnYXRvJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntcbiAgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb25cbiAgZ2V0VmltTGFzdEJ1ZmZlclJvd1xuICBnZXRWaW1MYXN0U2NyZWVuUm93XG4gIGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uXG59ID0gcmVxdWlyZSAnLi91dGlscydcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcblxuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuc2VsZWN0TGlzdCA9IG51bGxcbmdldEVkaXRvclN0YXRlID0gbnVsbCAjIHNldCBieSBCYXNlLmluaXQoKVxue09wZXJhdGlvbkFib3J0ZWRFcnJvcn0gPSByZXF1aXJlICcuL2Vycm9ycydcblxudmltU3RhdGVNZXRob2RzID0gW1xuICBcIm9uRGlkQ2hhbmdlSW5wdXRcIlxuICBcIm9uRGlkQ29uZmlybUlucHV0XCJcbiAgXCJvbkRpZENhbmNlbElucHV0XCJcblxuICBcIm9uRGlkQ2hhbmdlU2VhcmNoXCJcbiAgXCJvbkRpZENvbmZpcm1TZWFyY2hcIlxuICBcIm9uRGlkQ2FuY2VsU2VhcmNoXCJcbiAgXCJvbkRpZENvbW1hbmRTZWFyY2hcIlxuXG4gIFwib25EaWRTZXRUYXJnZXRcIlxuICBcIm9uV2lsbFNlbGVjdFRhcmdldFwiXG4gIFwib25EaWRTZWxlY3RUYXJnZXRcIlxuICBcInByZWVtcHRXaWxsU2VsZWN0VGFyZ2V0XCJcbiAgXCJwcmVlbXB0RGlkU2VsZWN0VGFyZ2V0XCJcbiAgXCJvbkRpZFJlc3RvcmVDdXJzb3JQb3NpdGlvbnNcIlxuICBcIm9uRGlkU2V0T3BlcmF0b3JNb2RpZmllclwiXG4gIFwib25EaWRSZXNldE9wZXJhdGlvblN0YWNrXCJcblxuICBcIm9uV2lsbEFjdGl2YXRlTW9kZVwiXG4gIFwib25EaWRBY3RpdmF0ZU1vZGVcIlxuICBcIm9uV2lsbERlYWN0aXZhdGVNb2RlXCJcbiAgXCJwcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlXCJcbiAgXCJvbkRpZERlYWN0aXZhdGVNb2RlXCJcblxuICBcIm9uRGlkRmluaXNoT3BlcmF0aW9uXCJcblxuICBcIm9uRGlkQ2FuY2VsU2VsZWN0TGlzdFwiXG4gIFwic3Vic2NyaWJlXCJcbiAgXCJpc01vZGVcIlxuICBcImdldEJsb2Nrd2lzZVNlbGVjdGlvbnNcIlxuICBcInVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXNcIlxuICBcImFkZFRvQ2xhc3NMaXN0XCJcbl1cblxuY2xhc3MgQmFzZVxuICBEZWxlZ2F0by5pbmNsdWRlSW50byh0aGlzKVxuICBAZGVsZWdhdGVzTWV0aG9kcyh2aW1TdGF0ZU1ldGhvZHMuLi4sIHRvUHJvcGVydHk6ICd2aW1TdGF0ZScpXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUsIHByb3BlcnRpZXM9bnVsbCkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBnbG9iYWxTdGF0ZX0gPSBAdmltU3RhdGVcbiAgICBfLmV4dGVuZCh0aGlzLCBwcm9wZXJ0aWVzKSBpZiBwcm9wZXJ0aWVzP1xuICAgIGlmIHNldHRpbmdzLmdldCgnc2hvd0hvdmVyT25PcGVyYXRlJylcbiAgICAgIGhvdmVyID0gQGhvdmVyP1tzZXR0aW5ncy5nZXQoJ3Nob3dIb3Zlck9uT3BlcmF0ZUljb24nKV1cbiAgICAgIGlmIGhvdmVyPyBhbmQgbm90IEBpc0NvbXBsZXRlKClcbiAgICAgICAgQGFkZEhvdmVyKGhvdmVyKVxuXG4gICMgVGVtcGxhdGVcbiAgaW5pdGlhbGl6ZTogLT5cblxuICAjIE9wZXJhdGlvbiBwcm9jZXNzb3IgZXhlY3V0ZSBvbmx5IHdoZW4gaXNDb21wbGV0ZSgpIHJldHVybiB0cnVlLlxuICAjIElmIGZhbHNlLCBvcGVyYXRpb24gcHJvY2Vzc29yIHBvc3Rwb25lIGl0cyBleGVjdXRpb24uXG4gIGlzQ29tcGxldGU6IC0+XG4gICAgaWYgKEBpc1JlcXVpcmVJbnB1dCgpIGFuZCBub3QgQGhhc0lucHV0KCkpXG4gICAgICBmYWxzZVxuICAgIGVsc2UgaWYgQGlzUmVxdWlyZVRhcmdldCgpXG4gICAgICAjIFdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaW4gQmFzZTo6Y29uc3RydWN0b3JcbiAgICAgICMgdGFnZXJ0IGlzIHN0aWxsIHN0cmluZyBsaWtlIGBNb3ZlVG9SaWdodGAsIGluIHRoaXMgY2FzZSBpc0NvbXBsZXRlXG4gICAgICAjIGlzIG5vdCBhdmFpbGFibGUuXG4gICAgICBAZ2V0VGFyZ2V0KCk/LmlzQ29tcGxldGU/KClcbiAgICBlbHNlXG4gICAgICB0cnVlXG5cbiAgdGFyZ2V0OiBudWxsXG4gIGhhc1RhcmdldDogLT4gQHRhcmdldD9cbiAgZ2V0VGFyZ2V0OiAtPiBAdGFyZ2V0XG5cbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgaXNSZXF1aXJlVGFyZ2V0OiAtPiBAcmVxdWlyZVRhcmdldFxuXG4gIHJlcXVpcmVJbnB1dDogZmFsc2VcbiAgaXNSZXF1aXJlSW5wdXQ6IC0+IEByZXF1aXJlSW5wdXRcblxuICByZWNvcmRhYmxlOiBmYWxzZVxuICBpc1JlY29yZGFibGU6IC0+IEByZWNvcmRhYmxlXG5cbiAgcmVwZWF0ZWQ6IGZhbHNlXG4gIGlzUmVwZWF0ZWQ6IC0+IEByZXBlYXRlZFxuICBzZXRSZXBlYXRlZDogLT4gQHJlcGVhdGVkID0gdHJ1ZVxuXG4gICMgSW50ZW5kZWQgdG8gYmUgdXNlZCBieSBUZXh0T2JqZWN0IG9yIE1vdGlvblxuICBvcGVyYXRvcjogbnVsbFxuICBoYXNPcGVyYXRvcjogLT4gQG9wZXJhdG9yP1xuICBnZXRPcGVyYXRvcjogLT4gQG9wZXJhdG9yXG4gIHNldE9wZXJhdG9yOiAoQG9wZXJhdG9yKSAtPiBAb3BlcmF0b3JcbiAgaXNBc09wZXJhdG9yVGFyZ2V0OiAtPlxuICAgIEBoYXNPcGVyYXRvcigpIGFuZCBub3QgQGdldE9wZXJhdG9yKCkuaW5zdGFuY2VvZignU2VsZWN0JylcblxuICBhYm9ydDogLT5cbiAgICB0aHJvdyBuZXcgT3BlcmF0aW9uQWJvcnRlZEVycm9yKCdhYm9ydGVkJylcblxuICAjIENvdW50XG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb3VudDogbnVsbFxuICBkZWZhdWx0Q291bnQ6IDFcbiAgZ2V0Q291bnQ6IC0+XG4gICAgQGNvdW50ID89IEB2aW1TdGF0ZS5nZXRDb3VudCgpID8gQGRlZmF1bHRDb3VudFxuXG4gIHJlc2V0Q291bnQ6IC0+XG4gICAgQGNvdW50ID0gbnVsbFxuXG4gIGlzRGVmYXVsdENvdW50OiAtPlxuICAgIEBjb3VudCBpcyBAZGVmYXVsdENvdW50XG5cbiAgIyBSZWdpc3RlclxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcmVnaXN0ZXI6IG51bGxcbiAgZ2V0UmVnaXN0ZXJOYW1lOiAtPlxuICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXROYW1lKClcbiAgICB0ZXh0ID0gQHZpbVN0YXRlLnJlZ2lzdGVyLmdldFRleHQoQGdldElucHV0KCksIHNlbGVjdGlvbilcblxuICBnZXRSZWdpc3RlclZhbHVlQXNUZXh0OiAobmFtZT1udWxsLCBzZWxlY3Rpb24pIC0+XG4gICAgQHZpbVN0YXRlLnJlZ2lzdGVyLmdldFRleHQobmFtZSwgc2VsZWN0aW9uKVxuXG4gIGlzRGVmYXVsdFJlZ2lzdGVyTmFtZTogLT5cbiAgICBAdmltU3RhdGUucmVnaXN0ZXIuaXNEZWZhdWx0TmFtZSgpXG5cbiAgIyBNaXNjXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb3VudFRpbWVzOiAoZm4pIC0+XG4gICAgcmV0dXJuIGlmIChsYXN0ID0gQGdldENvdW50KCkpIDwgMVxuXG4gICAgc3RvcHBlZCA9IGZhbHNlXG4gICAgc3RvcCA9IC0+IHN0b3BwZWQgPSB0cnVlXG4gICAgZm9yIGNvdW50IGluIFsxLi5sYXN0XVxuICAgICAgaXNGaW5hbCA9IGNvdW50IGlzIGxhc3RcbiAgICAgIGZuKHtjb3VudCwgaXNGaW5hbCwgc3RvcH0pXG4gICAgICBicmVhayBpZiBzdG9wcGVkXG5cbiAgYWN0aXZhdGVNb2RlOiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZShtb2RlLCBzdWJtb2RlKVxuXG4gIGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5OiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICB1bmxlc3MgQHZpbVN0YXRlLmlzTW9kZShtb2RlLCBzdWJtb2RlKVxuICAgICAgQGFjdGl2YXRlTW9kZShtb2RlLCBzdWJtb2RlKVxuXG4gIGFkZEhvdmVyOiAodGV4dCwge3JlcGxhY2V9PXt9LCBwb2ludD1udWxsKSAtPlxuICAgIGlmIHJlcGxhY2UgPyBmYWxzZVxuICAgICAgQHZpbVN0YXRlLmhvdmVyLnJlcGxhY2VMYXN0U2VjdGlvbih0ZXh0LCBwb2ludClcbiAgICBlbHNlXG4gICAgICBAdmltU3RhdGUuaG92ZXIuYWRkKHRleHQsIHBvaW50KVxuXG4gIG5ldzogKG5hbWUsIHByb3BlcnRpZXMpIC0+XG4gICAga2xhc3MgPSBCYXNlLmdldENsYXNzKG5hbWUpXG4gICAgbmV3IGtsYXNzKEB2aW1TdGF0ZSwgcHJvcGVydGllcylcblxuICBjbG9uZTogKHZpbVN0YXRlKSAtPlxuICAgIHByb3BlcnRpZXMgPSB7fVxuICAgIGV4Y2x1ZGVQcm9wZXJ0aWVzID0gWydlZGl0b3InLCAnZWRpdG9yRWxlbWVudCcsICdnbG9iYWxTdGF0ZScsICd2aW1TdGF0ZSddXG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkgbm90IGluIGV4Y2x1ZGVQcm9wZXJ0aWVzXG4gICAgICBwcm9wZXJ0aWVzW2tleV0gPSB2YWx1ZVxuICAgIGtsYXNzID0gdGhpcy5jb25zdHJ1Y3RvclxuICAgIG5ldyBrbGFzcyh2aW1TdGF0ZSwgcHJvcGVydGllcylcblxuICBjYW5jZWxPcGVyYXRpb246IC0+XG4gICAgQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLmNhbmNlbCgpXG5cbiAgcHJvY2Vzc09wZXJhdGlvbjogLT5cbiAgICBAdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucHJvY2VzcygpXG5cbiAgZm9jdXNTZWxlY3RMaXN0OiAob3B0aW9ucz17fSkgLT5cbiAgICBAb25EaWRDYW5jZWxTZWxlY3RMaXN0ID0+XG4gICAgICBAY2FuY2VsT3BlcmF0aW9uKClcbiAgICBzZWxlY3RMaXN0ID89IHJlcXVpcmUgJy4vc2VsZWN0LWxpc3QnXG4gICAgc2VsZWN0TGlzdC5zaG93KEB2aW1TdGF0ZSwgb3B0aW9ucylcblxuICBpbnB1dDogbnVsbFxuICBoYXNJbnB1dDogLT4gQGlucHV0P1xuICBnZXRJbnB1dDogLT4gQGlucHV0XG5cbiAgZm9jdXNJbnB1dDogKGNoYXJzTWF4KSAtPlxuICAgIEBvbkRpZENvbmZpcm1JbnB1dCAoaW5wdXQpID0+XG4gICAgICAjIFtGSVhNRSBSRUFMTFldIHdoZW4gYm90aCBvcGVyYXRvciBhbmQgbW90aW9uIHRha2UgdXNlci1pbnB1dCxcbiAgICAgICMgQ3VycmVudGx5IGlucHV0IFVJIGlzIHVuYXBwcm9wcmVhdGVseSBzaGFyZWQgYnkgb3BlcmF0b3IgYW5kIG1vdGlvbi5cbiAgICAgICMgU28gd2l0aG91dCB0aGlzIGd1YXJkLCBAaW5wdXQgaXMgb3ZlcndyaXR0ZW4gYnkgbGF0ZXIgaW5wdXQuXG4gICAgICB1bmxlc3MgQGlucHV0P1xuICAgICAgICBAaW5wdXQgPSBpbnB1dFxuICAgICAgICBAcHJvY2Vzc09wZXJhdGlvbigpXG5cbiAgICAjIEZyb20gMm5kIGFkZEhvdmVyLCB3ZSByZXBsYWNlIGxhc3Qgc2VjdGlvbiBvZiBob3ZlclxuICAgICMgdG8gc3luYyBjb250ZW50IHdpdGggaW5wdXQgbWluaSBlZGl0b3IuXG4gICAgdW5sZXNzIGNoYXJzTWF4IGlzIDFcbiAgICAgIHJlcGxhY2UgPSBmYWxzZVxuICAgICAgQG9uRGlkQ2hhbmdlSW5wdXQgKGlucHV0KSA9PlxuICAgICAgICBAYWRkSG92ZXIoaW5wdXQsIHtyZXBsYWNlfSlcbiAgICAgICAgcmVwbGFjZSA9IHRydWVcblxuICAgIEBvbkRpZENhbmNlbElucHV0ID0+XG4gICAgICBAY2FuY2VsT3BlcmF0aW9uKClcblxuICAgIEB2aW1TdGF0ZS5pbnB1dC5mb2N1cyhjaGFyc01heClcblxuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbihAZWRpdG9yKVxuXG4gIGdldFZpbUxhc3RCdWZmZXJSb3c6IC0+XG4gICAgZ2V0VmltTGFzdEJ1ZmZlclJvdyhAZWRpdG9yKVxuXG4gIGdldFZpbUxhc3RTY3JlZW5Sb3c6IC0+XG4gICAgZ2V0VmltTGFzdFNjcmVlblJvdyhAZWRpdG9yKVxuXG4gIGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uOiAocG9pbnQsIG9wdGlvbnMpIC0+XG4gICAgZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24oQGVkaXRvciwgcG9pbnQsIG9wdGlvbnMpXG5cbiAgaW5zdGFuY2VvZjogKGtsYXNzTmFtZSkgLT5cbiAgICB0aGlzIGluc3RhbmNlb2YgQmFzZS5nZXRDbGFzcyhrbGFzc05hbWUpXG5cbiAgaXM6IChrbGFzc05hbWUpIC0+XG4gICAgdGhpcy5jb25zdHJ1Y3RvciBpcyBCYXNlLmdldENsYXNzKGtsYXNzTmFtZSlcblxuICBpc09wZXJhdG9yOiAtPlxuICAgIEBpbnN0YW5jZW9mKCdPcGVyYXRvcicpXG5cbiAgaXNNb3Rpb246IC0+XG4gICAgQGluc3RhbmNlb2YoJ01vdGlvbicpXG5cbiAgaXNUZXh0T2JqZWN0OiAtPlxuICAgIEBpbnN0YW5jZW9mKCdUZXh0T2JqZWN0JylcblxuICBpc1RhcmdldDogLT5cbiAgICBAaXNNb3Rpb24oKSBvciBAaXNUZXh0T2JqZWN0KClcblxuICBnZXROYW1lOiAtPlxuICAgIEBjb25zdHJ1Y3Rvci5uYW1lXG5cbiAgZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb246IC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnM6IC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLm1hcChAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24uYmluZCh0aGlzKSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9ucygpXG5cbiAgZ2V0QnVmZmVyUG9zaXRpb25Gb3JDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihjdXJzb3Iuc2VsZWN0aW9uKVxuICAgIGVsc2VcbiAgICAgIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgb3B0aW9ucyA9IHtmcm9tUHJvcGVydHk6IHRydWUsIGFsbG93RmFsbGJhY2s6IHRydWV9XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignaGVhZCcsIG9wdGlvbnMpXG5cbiAgdG9TdHJpbmc6IC0+XG4gICAgc3RyID0gQGdldE5hbWUoKVxuICAgIHN0ciArPSBcIiwgdGFyZ2V0PSN7QGdldFRhcmdldCgpLnRvU3RyaW5nKCl9XCIgaWYgQGhhc1RhcmdldCgpXG4gICAgc3RyXG5cbiAgZW1pdFdpbGxTZWxlY3RUYXJnZXQ6IC0+XG4gICAgQHZpbVN0YXRlLmVtaXR0ZXIuZW1pdCgnd2lsbC1zZWxlY3QtdGFyZ2V0JylcblxuICBlbWl0RGlkU2VsZWN0VGFyZ2V0OiAtPlxuICAgIEB2aW1TdGF0ZS5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtdGFyZ2V0JylcblxuICBlbWl0RGlkU2V0VGFyZ2V0OiAob3BlcmF0b3IpIC0+XG4gICAgQHZpbVN0YXRlLmVtaXR0ZXIuZW1pdCgnZGlkLXNldC10YXJnZXQnLCBvcGVyYXRvcilcblxuICBlbWl0RGlkUmVzdG9yZUN1cnNvclBvc2l0aW9uczogLT5cbiAgICBAdmltU3RhdGUuZW1pdHRlci5lbWl0KCdkaWQtcmVzdG9yZS1jdXJzb3ItcG9zaXRpb25zJylcblxuICAjIENsYXNzIG1ldGhvZHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpbml0OiAoc2VydmljZSkgLT5cbiAgICB7Z2V0RWRpdG9yU3RhdGV9ID0gc2VydmljZVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgW1xuICAgICAgJy4vb3BlcmF0b3InLCAnLi9vcGVyYXRvci1pbnNlcnQnLCAnLi9vcGVyYXRvci10cmFuc2Zvcm0tc3RyaW5nJyxcbiAgICAgICcuL21vdGlvbicsICcuL21vdGlvbi1zZWFyY2gnLFxuICAgICAgJy4vdGV4dC1vYmplY3QnLFxuICAgICAgJy4vaW5zZXJ0LW1vZGUnLCAnLi9taXNjLWNvbW1hbmQnXG4gICAgXS5mb3JFYWNoKHJlcXVpcmUpXG5cbiAgICBmb3IgX18sIGtsYXNzIG9mIEBnZXRSZWdpc3RyaWVzKCkgd2hlbiBrbGFzcy5pc0NvbW1hbmQoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKGtsYXNzLnJlZ2lzdGVyQ29tbWFuZCgpKVxuICAgIEBzdWJzY3JpcHRpb25zXG5cbiAgIyBGb3IgZGV2ZWxvcG1lbnQgZWFzaW5lc3Mgd2l0aG91dCByZWxvYWRpbmcgdmltLW1vZGUtcGx1c1xuICBAcmVzZXQ6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgZm9yIF9fLCBrbGFzcyBvZiBAZ2V0UmVnaXN0cmllcygpIHdoZW4ga2xhc3MuaXNDb21tYW5kKClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChrbGFzcy5yZWdpc3RlckNvbW1hbmQoKSlcblxuICByZWdpc3RyaWVzID0ge0Jhc2V9XG4gIEBleHRlbmQ6IChAY29tbWFuZD10cnVlKSAtPlxuICAgIGlmIChuYW1lIG9mIHJlZ2lzdHJpZXMpIGFuZCAobm90IEBzdXBwcmVzc1dhcm5pbmcpXG4gICAgICBjb25zb2xlLndhcm4oXCJEdXBsaWNhdGUgY29uc3RydWN0b3IgI3tAbmFtZX1cIilcbiAgICByZWdpc3RyaWVzW0BuYW1lXSA9IHRoaXNcblxuICBAZ2V0Q2xhc3M6IChuYW1lKSAtPlxuICAgIGlmIChrbGFzcyA9IHJlZ2lzdHJpZXNbbmFtZV0pP1xuICAgICAga2xhc3NcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjbGFzcyAnI3tuYW1lfScgbm90IGZvdW5kXCIpXG5cbiAgQGdldFJlZ2lzdHJpZXM6IC0+XG4gICAgcmVnaXN0cmllc1xuXG4gIEBpc0NvbW1hbmQ6IC0+XG4gICAgQGNvbW1hbmRcblxuICBAY29tbWFuZFByZWZpeDogJ3ZpbS1tb2RlLXBsdXMnXG4gIEBnZXRDb21tYW5kTmFtZTogLT5cbiAgICBAY29tbWFuZFByZWZpeCArICc6JyArIF8uZGFzaGVyaXplKEBuYW1lKVxuXG4gIEBnZXRDb21tYW5kTmFtZVdpdGhvdXRQcmVmaXg6IC0+XG4gICAgXy5kYXNoZXJpemUoQG5hbWUpXG5cbiAgQGNvbW1hbmRTY29wZTogJ2F0b20tdGV4dC1lZGl0b3InXG4gIEBnZXRDb21tYW5kU2NvcGU6IC0+XG4gICAgQGNvbW1hbmRTY29wZVxuXG4gIEBnZXREZXNjdGlwdGlvbjogLT5cbiAgICBpZiBAaGFzT3duUHJvcGVydHkoXCJkZXNjcmlwdGlvblwiKVxuICAgICAgQGRlc2NyaXB0aW9uXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gIEByZWdpc3RlckNvbW1hbmQ6IC0+XG4gICAga2xhc3MgPSB0aGlzXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGdldENvbW1hbmRTY29wZSgpLCBAZ2V0Q29tbWFuZE5hbWUoKSwgKGV2ZW50KSAtPlxuICAgICAgdmltU3RhdGUgPSBnZXRFZGl0b3JTdGF0ZShAZ2V0TW9kZWwoKSkgPyBnZXRFZGl0b3JTdGF0ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICBpZiB2aW1TdGF0ZT9cbiAgICAgICAgIyBSZWFzb246IGh0dHBzOi8vZ2l0aHViLmNvbS90OW1kL2F0b20tdmltLW1vZGUtcGx1cy9pc3N1ZXMvODVcbiAgICAgICAgdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKGtsYXNzKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlXG4iXX0=
