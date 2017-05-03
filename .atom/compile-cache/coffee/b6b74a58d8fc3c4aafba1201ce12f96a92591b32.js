(function() {
  var BlockwiseSelection, CompositeDisposable, CursorStyleManager, Delegato, Disposable, Emitter, HighlightSearchManager, HoverElement, Input, MarkManager, ModeManager, MutationManager, OccurrenceManager, OperationStack, PersistentSelectionManager, Range, RegisterManager, SearchHistoryManager, SearchInputElement, VimState, _, debug, getVisibleEditors, haveSomeNonEmptySelection, highlightRanges, jQuery, matchScopes, packageScope, ref, ref1, semver, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  semver = require('semver');

  Delegato = require('delegato');

  jQuery = require('atom-space-pen-views').jQuery;

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable, Range = ref.Range;

  settings = require('./settings');

  HoverElement = require('./hover').HoverElement;

  Input = require('./input');

  SearchInputElement = require('./search-input');

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, highlightRanges = ref1.highlightRanges, getVisibleEditors = ref1.getVisibleEditors, matchScopes = ref1.matchScopes, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  OperationStack = require('./operation-stack');

  MarkManager = require('./mark-manager');

  ModeManager = require('./mode-manager');

  RegisterManager = require('./register-manager');

  SearchHistoryManager = require('./search-history-manager');

  CursorStyleManager = require('./cursor-style-manager');

  BlockwiseSelection = require('./blockwise-selection');

  OccurrenceManager = require('./occurrence-manager');

  HighlightSearchManager = require('./highlight-search-manager');

  MutationManager = require('./mutation-manager');

  PersistentSelectionManager = require('./persistent-selection-manager');

  packageScope = 'vim-mode-plus';

  module.exports = VimState = (function() {
    Delegato.includeInto(VimState);

    VimState.prototype.destroyed = false;

    VimState.delegatesProperty('mode', 'submode', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('isMode', 'activate', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('subscribe', 'getCount', 'setCount', 'hasCount', 'addToClassList', {
      toProperty: 'operationStack'
    });

    function VimState(editor, statusBarManager, globalState) {
      var refreshHighlightSearch;
      this.editor = editor;
      this.statusBarManager = statusBarManager;
      this.globalState = globalState;
      this.editorElement = this.editor.element;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.modeManager = new ModeManager(this);
      this.mark = new MarkManager(this);
      this.register = new RegisterManager(this);
      this.hover = new HoverElement().initialize(this);
      this.hoverSearchCounter = new HoverElement().initialize(this);
      this.searchHistory = new SearchHistoryManager(this);
      this.highlightSearch = new HighlightSearchManager(this);
      this.persistentSelection = new PersistentSelectionManager(this);
      this.occurrenceManager = new OccurrenceManager(this);
      this.mutationManager = new MutationManager(this);
      this.input = new Input(this);
      this.searchInput = new SearchInputElement().initialize(this);
      this.operationStack = new OperationStack(this);
      this.cursorStyleManager = new CursorStyleManager(this);
      this.blockwiseSelections = [];
      this.previousSelection = {};
      this.observeSelection();
      refreshHighlightSearch = (function(_this) {
        return function() {
          return _this.highlightSearch.refresh();
        };
      })(this);
      this.subscriptions.add(this.editor.onDidStopChanging(refreshHighlightSearch));
      this.subscriptions.add(this.editor.observeSelections((function(_this) {
        return function(selection) {
          if (_this.operationStack.isProcessing()) {
            return;
          }
          if (!swrap(selection).hasProperties()) {
            swrap(selection).saveProperties();
            _this.updateCursorsVisibility();
            return _this.editorElement.component.updateSync();
          }
        };
      })(this)));
      this.editorElement.classList.add(packageScope);
      if (settings.get('startInInsertMode') || matchScopes(this.editorElement, settings.get('startInInsertModeScopes'))) {
        this.activate('insert');
      } else {
        this.activate('normal');
      }
    }

    VimState.prototype.isNewInput = function() {
      return this.input instanceof Input;
    };

    VimState.prototype.getBlockwiseSelections = function() {
      return this.blockwiseSelections;
    };

    VimState.prototype.getLastBlockwiseSelection = function() {
      return _.last(this.blockwiseSelections);
    };

    VimState.prototype.getBlockwiseSelectionsOrderedByBufferPosition = function() {
      return this.getBlockwiseSelections().sort(function(a, b) {
        return a.getStartSelection().compare(b.getStartSelection());
      });
    };

    VimState.prototype.clearBlockwiseSelections = function() {
      return this.blockwiseSelections = [];
    };

    VimState.prototype.selectBlockwise = function() {
      var i, len, ref2, selection;
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        this.blockwiseSelections.push(new BlockwiseSelection(selection));
      }
      return this.updateSelectionProperties();
    };

    VimState.prototype.selectLinewise = function() {
      return swrap.expandOverLine(this.editor, {
        preserveGoalColumn: true
      });
    };

    VimState.prototype.updateSelectionProperties = function(options) {
      return swrap.updateSelectionProperties(this.editor, options);
    };

    VimState.prototype.toggleClassList = function(className, bool) {
      if (bool == null) {
        bool = void 0;
      }
      return this.editorElement.classList.toggle(className, bool);
    };

    VimState.prototype.swapClassName = function(className) {
      var oldClassName;
      oldClassName = this.editorElement.className;
      this.editorElement.className = className;
      return new Disposable((function(_this) {
        return function() {
          _this.editorElement.className = oldClassName;
          return _this.editorElement.classList.add('is-focused');
        };
      })(this));
    };

    VimState.prototype.onDidChangeInput = function(fn) {
      return this.subscribe(this.input.onDidChange(fn));
    };

    VimState.prototype.onDidConfirmInput = function(fn) {
      return this.subscribe(this.input.onDidConfirm(fn));
    };

    VimState.prototype.onDidCancelInput = function(fn) {
      return this.subscribe(this.input.onDidCancel(fn));
    };

    VimState.prototype.onDidChangeSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidChange(fn));
    };

    VimState.prototype.onDidConfirmSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidConfirm(fn));
    };

    VimState.prototype.onDidCancelSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCancel(fn));
    };

    VimState.prototype.onDidCommandSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCommand(fn));
    };

    VimState.prototype.onDidSetTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-set-target', fn));
    };

    VimState.prototype.onWillSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('will-select-target', fn));
    };

    VimState.prototype.onDidSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-select-target', fn));
    };

    VimState.prototype.preemptWillSelectTarget = function(fn) {
      return this.subscribe(this.emitter.preempt('will-select-target', fn));
    };

    VimState.prototype.preemptDidSelectTarget = function(fn) {
      return this.subscribe(this.emitter.preempt('did-select-target', fn));
    };

    VimState.prototype.onDidRestoreCursorPositions = function(fn) {
      return this.subscribe(this.emitter.on('did-restore-cursor-positions', fn));
    };

    VimState.prototype.onDidSetOperatorModifier = function(fn) {
      return this.subscribe(this.emitter.on('did-set-operator-modifier', fn));
    };

    VimState.prototype.emitDidSetOperatorModifier = function(options) {
      return this.emitter.emit('did-set-operator-modifier', options);
    };

    VimState.prototype.onDidFinishOperation = function(fn) {
      return this.subscribe(this.emitter.on('did-finish-operation', fn));
    };

    VimState.prototype.onDidResetOperationStack = function(fn) {
      return this.subscribe(this.emitter.on('did-reset-operation-stack', fn));
    };

    VimState.prototype.emitDidResetOperationStack = function() {
      return this.emitter.emit('did-reset-operation-stack');
    };

    VimState.prototype.onDidConfirmSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-confirm-select-list', fn));
    };

    VimState.prototype.onDidCancelSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-cancel-select-list', fn));
    };

    VimState.prototype.onWillActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillActivateMode(fn));
    };

    VimState.prototype.onDidActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidActivateMode(fn));
    };

    VimState.prototype.onWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillDeactivateMode(fn));
    };

    VimState.prototype.preemptWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.preemptWillDeactivateMode(fn));
    };

    VimState.prototype.onDidDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidDeactivateMode(fn));
    };

    VimState.prototype.onDidFailToSetTarget = function(fn) {
      return this.emitter.on('did-fail-to-set-target', fn);
    };

    VimState.prototype.emitDidFailToSetTarget = function() {
      return this.emitter.emit('did-fail-to-set-target');
    };

    VimState.prototype.onDidDestroy = function(fn) {
      return this.emitter.on('did-destroy', fn);
    };

    VimState.prototype.onDidSetMark = function(fn) {
      return this.emitter.on('did-set-mark', fn);
    };

    VimState.prototype.onDidSetInputChar = function(fn) {
      return this.emitter.on('did-set-input-char', fn);
    };

    VimState.prototype.emitDidSetInputChar = function(char) {
      return this.emitter.emit('did-set-input-char', char);
    };

    VimState.prototype.destroy = function() {
      var ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      this.subscriptions.dispose();
      if (this.editor.isAlive()) {
        this.resetNormalMode();
        this.reset();
        if ((ref2 = this.editorElement.component) != null) {
          ref2.setInputEnabled(true);
        }
        this.editorElement.classList.remove(packageScope, 'normal-mode');
      }
      if ((ref3 = this.hover) != null) {
        if (typeof ref3.destroy === "function") {
          ref3.destroy();
        }
      }
      if ((ref4 = this.hoverSearchCounter) != null) {
        if (typeof ref4.destroy === "function") {
          ref4.destroy();
        }
      }
      if ((ref5 = this.searchHistory) != null) {
        if (typeof ref5.destroy === "function") {
          ref5.destroy();
        }
      }
      if ((ref6 = this.cursorStyleManager) != null) {
        if (typeof ref6.destroy === "function") {
          ref6.destroy();
        }
      }
      if ((ref7 = this.input) != null) {
        if (typeof ref7.destroy === "function") {
          ref7.destroy();
        }
      }
      if ((ref8 = this.search) != null) {
        if (typeof ref8.destroy === "function") {
          ref8.destroy();
        }
      }
      ((ref9 = this.register) != null ? ref9.destroy : void 0) != null;
      ref10 = {}, this.hover = ref10.hover, this.hoverSearchCounter = ref10.hoverSearchCounter, this.operationStack = ref10.operationStack, this.searchHistory = ref10.searchHistory, this.cursorStyleManager = ref10.cursorStyleManager, this.input = ref10.input, this.search = ref10.search, this.modeManager = ref10.modeManager, this.register = ref10.register, this.editor = ref10.editor, this.editorElement = ref10.editorElement, this.subscriptions = ref10.subscriptions, this.inputCharSubscriptions = ref10.inputCharSubscriptions, this.occurrenceManager = ref10.occurrenceManager, this.previousSelection = ref10.previousSelection, this.persistentSelection = ref10.persistentSelection;
      return this.emitter.emit('did-destroy');
    };

    VimState.prototype.observeSelection = function() {
      var _checkSelection, _saveProperties, checkSelection, isInterestingEvent, onInterestingEvent, saveProperties;
      isInterestingEvent = (function(_this) {
        return function(arg) {
          var target, type;
          target = arg.target, type = arg.type;
          if (_this.mode === 'insert') {
            return false;
          } else {
            return (_this.editor != null) && target === _this.editorElement && !_this.isMode('visual', 'blockwise') && !type.startsWith('vim-mode-plus:');
          }
        };
      })(this);
      onInterestingEvent = function(fn) {
        return function(event) {
          if (isInterestingEvent(event)) {
            return fn();
          }
        };
      };
      _checkSelection = (function(_this) {
        return function() {
          var submode;
          if (_this.operationStack.isProcessing()) {
            return;
          }
          if (haveSomeNonEmptySelection(_this.editor)) {
            submode = swrap.detectVisualModeSubmode(_this.editor);
            if (_this.isMode('visual', submode)) {
              return _this.updateCursorsVisibility();
            } else {
              return _this.activate('visual', submode);
            }
          } else {
            if (_this.isMode('visual')) {
              return _this.activate('normal');
            }
          }
        };
      })(this);
      _saveProperties = (function(_this) {
        return function() {
          var i, len, ref2, results, selection;
          ref2 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            results.push(swrap(selection).saveProperties());
          }
          return results;
        };
      })(this);
      checkSelection = onInterestingEvent(_checkSelection);
      saveProperties = onInterestingEvent(_saveProperties);
      this.editorElement.addEventListener('mouseup', checkSelection);
      this.subscriptions.add(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.removeEventListener('mouseup', checkSelection);
        };
      })(this)));
      return this.subscriptions.add(atom.commands.onDidDispatch(checkSelection));
    };

    VimState.prototype.resetNormalMode = function(arg) {
      var userInvocation;
      userInvocation = (arg != null ? arg : {}).userInvocation;
      if (userInvocation != null ? userInvocation : false) {
        if (this.editor.hasMultipleCursors()) {
          this.editor.clearSelections();
        } else if (this.hasPersistentSelections() && settings.get('clearPersistentSelectionOnResetNormalMode')) {
          this.clearPersistentSelections();
        } else if (this.occurrenceManager.hasPatterns()) {
          this.occurrenceManager.resetPatterns();
        }
        if (settings.get('clearHighlightSearchOnResetNormalMode')) {
          this.globalState.set('highlightSearchPattern', null);
        }
      } else {
        this.editor.clearSelections();
      }
      return this.activate('normal');
    };

    VimState.prototype.reset = function() {
      this.register.reset();
      this.searchHistory.reset();
      this.hover.reset();
      this.operationStack.reset();
      return this.mutationManager.reset();
    };

    VimState.prototype.isVisible = function() {
      var ref2;
      return ref2 = this.editor, indexOf.call(getVisibleEditors(), ref2) >= 0;
    };

    VimState.prototype.updateCursorsVisibility = function() {
      return this.cursorStyleManager.refresh();
    };

    VimState.prototype.updatePreviousSelection = function() {
      var head, properties, ref2, tail;
      if (this.isMode('visual', 'blockwise')) {
        properties = (ref2 = this.getLastBlockwiseSelection()) != null ? ref2.getCharacterwiseProperties() : void 0;
      } else {
        properties = swrap(this.editor.getLastSelection()).captureProperties();
      }
      if (properties == null) {
        return;
      }
      head = properties.head, tail = properties.tail;
      if (head.isGreaterThan(tail)) {
        this.mark.setRange('<', '>', [tail, head]);
      } else {
        this.mark.setRange('<', '>', [head, tail]);
      }
      return this.previousSelection = {
        properties: properties,
        submode: this.submode
      };
    };

    VimState.prototype.hasPersistentSelections = function() {
      return this.persistentSelection.hasMarkers();
    };

    VimState.prototype.getPersistentSelectionBuffferRanges = function() {
      return this.persistentSelection.getMarkerBufferRanges();
    };

    VimState.prototype.clearPersistentSelections = function() {
      return this.persistentSelection.clearMarkers();
    };

    VimState.prototype.scrollAnimationEffect = null;

    VimState.prototype.requestScrollAnimation = function(from, to, options) {
      return this.scrollAnimationEffect = jQuery(from).animate(to, options);
    };

    VimState.prototype.finishScrollAnimation = function() {
      var ref2;
      if ((ref2 = this.scrollAnimationEffect) != null) {
        ref2.finish();
      }
      return this.scrollAnimationEffect = null;
    };

    return VimState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi92aW0tc3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2Y0FBQTtJQUFBOztFQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7RUFDVCxRQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0VBQ1YsU0FBVSxPQUFBLENBQVEsc0JBQVI7O0VBRVgsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFvRCxPQUFBLENBQVEsTUFBUixDQUFwRCxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0IsNkNBQXRCLEVBQTJDOztFQUUzQyxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1YsZUFBZ0IsT0FBQSxDQUFRLFNBQVI7O0VBQ2pCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixrQkFBQSxHQUFxQixPQUFBLENBQVEsZ0JBQVI7O0VBQ3JCLE9BT0ksT0FBQSxDQUFRLFNBQVIsQ0FQSixFQUNFLDBEQURGLEVBRUUsc0NBRkYsRUFHRSwwQ0FIRixFQUlFLDhCQUpGLEVBTUU7O0VBRUYsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFFUixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDakIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLGVBQUEsR0FBa0IsT0FBQSxDQUFRLG9CQUFSOztFQUNsQixvQkFBQSxHQUF1QixPQUFBLENBQVEsMEJBQVI7O0VBQ3ZCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx3QkFBUjs7RUFDckIsa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHVCQUFSOztFQUNyQixpQkFBQSxHQUFvQixPQUFBLENBQVEsc0JBQVI7O0VBQ3BCLHNCQUFBLEdBQXlCLE9BQUEsQ0FBUSw0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LENBQUEscUJBQUQsR0FBeUIsTUFBQSxDQUFPLElBQVAsQ0FBWSxDQUFDLE9BQWIsQ0FBcUIsRUFBckIsRUFBeUIsT0FBekI7SUFESDs7dUJBR3hCLHFCQUFBLEdBQXVCLFNBQUE7QUFDckIsVUFBQTs7WUFBc0IsQ0FBRSxNQUF4QixDQUFBOzthQUNBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtJQUZKOzs7OztBQTVUekIiLCJzb3VyY2VzQ29udGVudCI6WyJzZW12ZXIgPSByZXF1aXJlICdzZW12ZXInXG5EZWxlZ2F0byA9IHJlcXVpcmUgJ2RlbGVnYXRvJ1xue2pRdWVyeX0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG57SG92ZXJFbGVtZW50fSA9IHJlcXVpcmUgJy4vaG92ZXInXG5JbnB1dCA9IHJlcXVpcmUgJy4vaW5wdXQnXG5TZWFyY2hJbnB1dEVsZW1lbnQgPSByZXF1aXJlICcuL3NlYXJjaC1pbnB1dCdcbntcbiAgaGF2ZVNvbWVOb25FbXB0eVNlbGVjdGlvblxuICBoaWdobGlnaHRSYW5nZXNcbiAgZ2V0VmlzaWJsZUVkaXRvcnNcbiAgbWF0Y2hTY29wZXNcblxuICBkZWJ1Z1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbk9wZXJhdGlvblN0YWNrID0gcmVxdWlyZSAnLi9vcGVyYXRpb24tc3RhY2snXG5NYXJrTWFuYWdlciA9IHJlcXVpcmUgJy4vbWFyay1tYW5hZ2VyJ1xuTW9kZU1hbmFnZXIgPSByZXF1aXJlICcuL21vZGUtbWFuYWdlcidcblJlZ2lzdGVyTWFuYWdlciA9IHJlcXVpcmUgJy4vcmVnaXN0ZXItbWFuYWdlcidcblNlYXJjaEhpc3RvcnlNYW5hZ2VyID0gcmVxdWlyZSAnLi9zZWFyY2gtaGlzdG9yeS1tYW5hZ2VyJ1xuQ3Vyc29yU3R5bGVNYW5hZ2VyID0gcmVxdWlyZSAnLi9jdXJzb3Itc3R5bGUtbWFuYWdlcidcbkJsb2Nrd2lzZVNlbGVjdGlvbiA9IHJlcXVpcmUgJy4vYmxvY2t3aXNlLXNlbGVjdGlvbidcbk9jY3VycmVuY2VNYW5hZ2VyID0gcmVxdWlyZSAnLi9vY2N1cnJlbmNlLW1hbmFnZXInXG5IaWdobGlnaHRTZWFyY2hNYW5hZ2VyID0gcmVxdWlyZSAnLi9oaWdobGlnaHQtc2VhcmNoLW1hbmFnZXInXG5NdXRhdGlvbk1hbmFnZXIgPSByZXF1aXJlICcuL211dGF0aW9uLW1hbmFnZXInXG5QZXJzaXN0ZW50U2VsZWN0aW9uTWFuYWdlciA9IHJlcXVpcmUgJy4vcGVyc2lzdGVudC1zZWxlY3Rpb24tbWFuYWdlcidcblxucGFja2FnZVNjb3BlID0gJ3ZpbS1tb2RlLXBsdXMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFZpbVN0YXRlXG4gIERlbGVnYXRvLmluY2x1ZGVJbnRvKHRoaXMpXG4gIGRlc3Ryb3llZDogZmFsc2VcblxuICBAZGVsZWdhdGVzUHJvcGVydHkoJ21vZGUnLCAnc3VibW9kZScsIHRvUHJvcGVydHk6ICdtb2RlTWFuYWdlcicpXG4gIEBkZWxlZ2F0ZXNNZXRob2RzKCdpc01vZGUnLCAnYWN0aXZhdGUnLCB0b1Byb3BlcnR5OiAnbW9kZU1hbmFnZXInKVxuICBAZGVsZWdhdGVzTWV0aG9kcygnc3Vic2NyaWJlJywgJ2dldENvdW50JywgJ3NldENvdW50JywgJ2hhc0NvdW50JywgJ2FkZFRvQ2xhc3NMaXN0JywgdG9Qcm9wZXJ0eTogJ29wZXJhdGlvblN0YWNrJylcblxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEBzdGF0dXNCYXJNYW5hZ2VyLCBAZ2xvYmFsU3RhdGUpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQgPSBAZWRpdG9yLmVsZW1lbnRcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBtb2RlTWFuYWdlciA9IG5ldyBNb2RlTWFuYWdlcih0aGlzKVxuICAgIEBtYXJrID0gbmV3IE1hcmtNYW5hZ2VyKHRoaXMpXG4gICAgQHJlZ2lzdGVyID0gbmV3IFJlZ2lzdGVyTWFuYWdlcih0aGlzKVxuICAgIEBob3ZlciA9IG5ldyBIb3ZlckVsZW1lbnQoKS5pbml0aWFsaXplKHRoaXMpXG4gICAgQGhvdmVyU2VhcmNoQ291bnRlciA9IG5ldyBIb3ZlckVsZW1lbnQoKS5pbml0aWFsaXplKHRoaXMpXG4gICAgQHNlYXJjaEhpc3RvcnkgPSBuZXcgU2VhcmNoSGlzdG9yeU1hbmFnZXIodGhpcylcbiAgICBAaGlnaGxpZ2h0U2VhcmNoID0gbmV3IEhpZ2hsaWdodFNlYXJjaE1hbmFnZXIodGhpcylcbiAgICBAcGVyc2lzdGVudFNlbGVjdGlvbiA9IG5ldyBQZXJzaXN0ZW50U2VsZWN0aW9uTWFuYWdlcih0aGlzKVxuICAgIEBvY2N1cnJlbmNlTWFuYWdlciA9IG5ldyBPY2N1cnJlbmNlTWFuYWdlcih0aGlzKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIgPSBuZXcgTXV0YXRpb25NYW5hZ2VyKHRoaXMpXG5cbiAgICBAaW5wdXQgPSBuZXcgSW5wdXQodGhpcylcbiAgICBAc2VhcmNoSW5wdXQgPSBuZXcgU2VhcmNoSW5wdXRFbGVtZW50KCkuaW5pdGlhbGl6ZSh0aGlzKVxuXG4gICAgQG9wZXJhdGlvblN0YWNrID0gbmV3IE9wZXJhdGlvblN0YWNrKHRoaXMpXG4gICAgQGN1cnNvclN0eWxlTWFuYWdlciA9IG5ldyBDdXJzb3JTdHlsZU1hbmFnZXIodGhpcylcbiAgICBAYmxvY2t3aXNlU2VsZWN0aW9ucyA9IFtdXG4gICAgQHByZXZpb3VzU2VsZWN0aW9uID0ge31cbiAgICBAb2JzZXJ2ZVNlbGVjdGlvbigpXG5cbiAgICByZWZyZXNoSGlnaGxpZ2h0U2VhcmNoID0gPT5cbiAgICAgIEBoaWdobGlnaHRTZWFyY2gucmVmcmVzaCgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcocmVmcmVzaEhpZ2hsaWdodFNlYXJjaClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9ic2VydmVTZWxlY3Rpb25zIChzZWxlY3Rpb24pID0+XG4gICAgICByZXR1cm4gaWYgQG9wZXJhdGlvblN0YWNrLmlzUHJvY2Vzc2luZygpXG4gICAgICB1bmxlc3Mgc3dyYXAoc2VsZWN0aW9uKS5oYXNQcm9wZXJ0aWVzKClcbiAgICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zYXZlUHJvcGVydGllcygpXG4gICAgICAgIEB1cGRhdGVDdXJzb3JzVmlzaWJpbGl0eSgpXG4gICAgICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC51cGRhdGVTeW5jKClcblxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQocGFja2FnZVNjb3BlKVxuICAgIGlmIHNldHRpbmdzLmdldCgnc3RhcnRJbkluc2VydE1vZGUnKSBvciBtYXRjaFNjb3BlcyhAZWRpdG9yRWxlbWVudCwgc2V0dGluZ3MuZ2V0KCdzdGFydEluSW5zZXJ0TW9kZVNjb3BlcycpKVxuICAgICAgQGFjdGl2YXRlKCdpbnNlcnQnKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0ZSgnbm9ybWFsJylcblxuICBpc05ld0lucHV0OiAtPlxuICAgIEBpbnB1dCBpbnN0YW5jZW9mIElucHV0XG5cbiAgIyBCbG9ja3dpc2VTZWxlY3Rpb25zXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zOiAtPlxuICAgIEBibG9ja3dpc2VTZWxlY3Rpb25zXG5cbiAgZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbjogLT5cbiAgICBfLmxhc3QoQGJsb2Nrd2lzZVNlbGVjdGlvbnMpXG5cbiAgZ2V0QmxvY2t3aXNlU2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKCkuc29ydCAoYSwgYikgLT5cbiAgICAgIGEuZ2V0U3RhcnRTZWxlY3Rpb24oKS5jb21wYXJlKGIuZ2V0U3RhcnRTZWxlY3Rpb24oKSlcblxuICBjbGVhckJsb2Nrd2lzZVNlbGVjdGlvbnM6IC0+XG4gICAgQGJsb2Nrd2lzZVNlbGVjdGlvbnMgPSBbXVxuXG4gIHNlbGVjdEJsb2Nrd2lzZTogLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAYmxvY2t3aXNlU2VsZWN0aW9ucy5wdXNoKG5ldyBCbG9ja3dpc2VTZWxlY3Rpb24oc2VsZWN0aW9uKSlcbiAgICBAdXBkYXRlU2VsZWN0aW9uUHJvcGVydGllcygpXG5cbiAgIyBPdGhlclxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2VsZWN0TGluZXdpc2U6IC0+XG4gICAgc3dyYXAuZXhwYW5kT3ZlckxpbmUoQGVkaXRvciwgcHJlc2VydmVHb2FsQ29sdW1uOiB0cnVlKVxuXG4gIHVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXM6IChvcHRpb25zKSAtPlxuICAgIHN3cmFwLnVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXMoQGVkaXRvciwgb3B0aW9ucylcblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdG9nZ2xlQ2xhc3NMaXN0OiAoY2xhc3NOYW1lLCBib29sPXVuZGVmaW5lZCkgLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSwgYm9vbClcblxuICBzd2FwQ2xhc3NOYW1lOiAoY2xhc3NOYW1lKSAtPlxuICAgIG9sZENsYXNzTmFtZSA9IEBlZGl0b3JFbGVtZW50LmNsYXNzTmFtZVxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZVxuICAgIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc05hbWUgPSBvbGRDbGFzc05hbWVcbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2lzLWZvY3VzZWQnKVxuXG4gICMgQWxsIHN1YnNjcmlwdGlvbnMgaGVyZSBpcyBjZWxhcmVkIG9uIGVhY2ggb3BlcmF0aW9uIGZpbmlzaGVkLlxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgb25EaWRDaGFuZ2VJbnB1dDogKGZuKSAtPiBAc3Vic2NyaWJlIEBpbnB1dC5vbkRpZENoYW5nZShmbilcbiAgb25EaWRDb25maXJtSW5wdXQ6IChmbikgLT4gQHN1YnNjcmliZSBAaW5wdXQub25EaWRDb25maXJtKGZuKVxuICBvbkRpZENhbmNlbElucHV0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGlucHV0Lm9uRGlkQ2FuY2VsKGZuKVxuXG4gIG9uRGlkQ2hhbmdlU2VhcmNoOiAoZm4pIC0+IEBzdWJzY3JpYmUgQHNlYXJjaElucHV0Lm9uRGlkQ2hhbmdlKGZuKVxuICBvbkRpZENvbmZpcm1TZWFyY2g6IChmbikgLT4gQHN1YnNjcmliZSBAc2VhcmNoSW5wdXQub25EaWRDb25maXJtKGZuKVxuICBvbkRpZENhbmNlbFNlYXJjaDogKGZuKSAtPiBAc3Vic2NyaWJlIEBzZWFyY2hJbnB1dC5vbkRpZENhbmNlbChmbilcbiAgb25EaWRDb21tYW5kU2VhcmNoOiAoZm4pIC0+IEBzdWJzY3JpYmUgQHNlYXJjaElucHV0Lm9uRGlkQ29tbWFuZChmbilcblxuICAjIFNlbGVjdCBhbmQgdGV4dCBtdXRhdGlvbihDaGFuZ2UpXG4gIG9uRGlkU2V0VGFyZ2V0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1zZXQtdGFyZ2V0JywgZm4pXG4gIG9uV2lsbFNlbGVjdFRhcmdldDogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCd3aWxsLXNlbGVjdC10YXJnZXQnLCBmbilcbiAgb25EaWRTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLXNlbGVjdC10YXJnZXQnLCBmbilcbiAgcHJlZW1wdFdpbGxTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5wcmVlbXB0KCd3aWxsLXNlbGVjdC10YXJnZXQnLCBmbilcbiAgcHJlZW1wdERpZFNlbGVjdFRhcmdldDogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLnByZWVtcHQoJ2RpZC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIG9uRGlkUmVzdG9yZUN1cnNvclBvc2l0aW9uczogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtcmVzdG9yZS1jdXJzb3ItcG9zaXRpb25zJywgZm4pXG5cbiAgb25EaWRTZXRPcGVyYXRvck1vZGlmaWVyOiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1zZXQtb3BlcmF0b3ItbW9kaWZpZXInLCBmbilcbiAgZW1pdERpZFNldE9wZXJhdG9yTW9kaWZpZXI6IChvcHRpb25zKSAtPiBAZW1pdHRlci5lbWl0KCdkaWQtc2V0LW9wZXJhdG9yLW1vZGlmaWVyJywgb3B0aW9ucylcblxuICBvbkRpZEZpbmlzaE9wZXJhdGlvbjogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtZmluaXNoLW9wZXJhdGlvbicsIGZuKVxuXG4gIG9uRGlkUmVzZXRPcGVyYXRpb25TdGFjazogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtcmVzZXQtb3BlcmF0aW9uLXN0YWNrJywgZm4pXG4gIGVtaXREaWRSZXNldE9wZXJhdGlvblN0YWNrOiAtPiBAZW1pdHRlci5lbWl0KCdkaWQtcmVzZXQtb3BlcmF0aW9uLXN0YWNrJylcblxuICAjIFNlbGVjdCBsaXN0IHZpZXdcbiAgb25EaWRDb25maXJtU2VsZWN0TGlzdDogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtY29uZmlybS1zZWxlY3QtbGlzdCcsIGZuKVxuICBvbkRpZENhbmNlbFNlbGVjdExpc3Q6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLWNhbmNlbC1zZWxlY3QtbGlzdCcsIGZuKVxuXG4gICMgUHJveHlpbmcgbW9kZU1hbmdlcidzIGV2ZW50IGhvb2sgd2l0aCBzaG9ydC1saWZlIHN1YnNjcmlwdGlvbi5cbiAgb25XaWxsQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uV2lsbEFjdGl2YXRlTW9kZShmbilcbiAgb25EaWRBY3RpdmF0ZU1vZGU6IChmbikgLT4gQHN1YnNjcmliZSBAbW9kZU1hbmFnZXIub25EaWRBY3RpdmF0ZU1vZGUoZm4pXG4gIG9uV2lsbERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uV2lsbERlYWN0aXZhdGVNb2RlKGZuKVxuICBwcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLnByZWVtcHRXaWxsRGVhY3RpdmF0ZU1vZGUoZm4pXG4gIG9uRGlkRGVhY3RpdmF0ZU1vZGU6IChmbikgLT4gQHN1YnNjcmliZSBAbW9kZU1hbmFnZXIub25EaWREZWFjdGl2YXRlTW9kZShmbilcblxuICAjIEV2ZW50c1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgb25EaWRGYWlsVG9TZXRUYXJnZXQ6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1mYWlsLXRvLXNldC10YXJnZXQnLCBmbilcbiAgZW1pdERpZEZhaWxUb1NldFRhcmdldDogLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWZhaWwtdG8tc2V0LXRhcmdldCcpXG5cbiAgb25EaWREZXN0cm95OiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtZGVzdHJveScsIGZuKVxuXG4gICMgKiBgZm5gIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gbWFyayB3YXMgc2V0LlxuICAjICAgKiBgbmFtZWAgTmFtZSBvZiBtYXJrIHN1Y2ggYXMgJ2EnLlxuICAjICAgKiBgYnVmZmVyUG9zaXRpb25gOiBidWZmZXJQb3NpdGlvbiB3aGVyZSBtYXJrIHdhcyBzZXQuXG4gICMgICAqIGBlZGl0b3JgOiBlZGl0b3Igd2hlcmUgbWFyayB3YXMgc2V0LlxuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gICNcbiAgIyAgVXNhZ2U6XG4gICMgICBvbkRpZFNldE1hcmsgKHtuYW1lLCBidWZmZXJQb3NpdGlvbn0pIC0+IGRvIHNvbWV0aGluZy4uXG4gIG9uRGlkU2V0TWFyazogKGZuKSAtPiBAZW1pdHRlci5vbignZGlkLXNldC1tYXJrJywgZm4pXG5cbiAgb25EaWRTZXRJbnB1dENoYXI6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1zZXQtaW5wdXQtY2hhcicsIGZuKVxuICBlbWl0RGlkU2V0SW5wdXRDaGFyOiAoY2hhcikgLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLXNldC1pbnB1dC1jaGFyJywgY2hhcilcblxuICBkZXN0cm95OiAtPlxuICAgIHJldHVybiBpZiBAZGVzdHJveWVkXG4gICAgQGRlc3Ryb3llZCA9IHRydWVcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICAgIGlmIEBlZGl0b3IuaXNBbGl2ZSgpXG4gICAgICBAcmVzZXROb3JtYWxNb2RlKClcbiAgICAgIEByZXNldCgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQ/LnNldElucHV0RW5hYmxlZCh0cnVlKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShwYWNrYWdlU2NvcGUsICdub3JtYWwtbW9kZScpXG5cbiAgICBAaG92ZXI/LmRlc3Ryb3k/KClcbiAgICBAaG92ZXJTZWFyY2hDb3VudGVyPy5kZXN0cm95PygpXG4gICAgQHNlYXJjaEhpc3Rvcnk/LmRlc3Ryb3k/KClcbiAgICBAY3Vyc29yU3R5bGVNYW5hZ2VyPy5kZXN0cm95PygpXG4gICAgQGlucHV0Py5kZXN0cm95PygpXG4gICAgQHNlYXJjaD8uZGVzdHJveT8oKVxuICAgIEByZWdpc3Rlcj8uZGVzdHJveT9cbiAgICB7XG4gICAgICBAaG92ZXIsIEBob3ZlclNlYXJjaENvdW50ZXIsIEBvcGVyYXRpb25TdGFjayxcbiAgICAgIEBzZWFyY2hIaXN0b3J5LCBAY3Vyc29yU3R5bGVNYW5hZ2VyXG4gICAgICBAaW5wdXQsIEBzZWFyY2gsIEBtb2RlTWFuYWdlciwgQHJlZ2lzdGVyXG4gICAgICBAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQHN1YnNjcmlwdGlvbnMsXG4gICAgICBAaW5wdXRDaGFyU3Vic2NyaXB0aW9uc1xuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyXG4gICAgICBAcHJldmlvdXNTZWxlY3Rpb25cbiAgICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uXG4gICAgfSA9IHt9XG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWRlc3Ryb3knXG5cbiAgb2JzZXJ2ZVNlbGVjdGlvbjogLT5cbiAgICBpc0ludGVyZXN0aW5nRXZlbnQgPSAoe3RhcmdldCwgdHlwZX0pID0+XG4gICAgICBpZiBAbW9kZSBpcyAnaW5zZXJ0J1xuICAgICAgICBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBAZWRpdG9yPyBhbmRcbiAgICAgICAgICB0YXJnZXQgaXMgQGVkaXRvckVsZW1lbnQgYW5kXG4gICAgICAgICAgbm90IEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKSBhbmRcbiAgICAgICAgICBub3QgdHlwZS5zdGFydHNXaXRoKCd2aW0tbW9kZS1wbHVzOicpXG5cbiAgICBvbkludGVyZXN0aW5nRXZlbnQgPSAoZm4pIC0+XG4gICAgICAoZXZlbnQpIC0+IGZuKCkgaWYgaXNJbnRlcmVzdGluZ0V2ZW50KGV2ZW50KVxuXG4gICAgX2NoZWNrU2VsZWN0aW9uID0gPT5cbiAgICAgIHJldHVybiBpZiBAb3BlcmF0aW9uU3RhY2suaXNQcm9jZXNzaW5nKClcbiAgICAgIGlmIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24oQGVkaXRvcilcbiAgICAgICAgc3VibW9kZSA9IHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpXG4gICAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsIHN1Ym1vZGUpXG4gICAgICAgICAgQHVwZGF0ZUN1cnNvcnNWaXNpYmlsaXR5KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBhY3RpdmF0ZSgndmlzdWFsJywgc3VibW9kZSlcbiAgICAgIGVsc2VcbiAgICAgICAgQGFjdGl2YXRlKCdub3JtYWwnKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuXG4gICAgX3NhdmVQcm9wZXJ0aWVzID0gPT5cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zYXZlUHJvcGVydGllcygpXG5cbiAgICBjaGVja1NlbGVjdGlvbiA9IG9uSW50ZXJlc3RpbmdFdmVudChfY2hlY2tTZWxlY3Rpb24pXG4gICAgc2F2ZVByb3BlcnRpZXMgPSBvbkludGVyZXN0aW5nRXZlbnQoX3NhdmVQcm9wZXJ0aWVzKVxuXG4gICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuXG4gICAgIyBbRklYTUVdXG4gICAgIyBIb3ZlciBwb3NpdGlvbiBnZXQgd2lyZWQgd2hlbiBmb2N1cy1jaGFuZ2UgYmV0d2VlbiBtb3JlIHRoYW4gdHdvIHBhbmUuXG4gICAgIyBjb21tZW50aW5nIG91dCBpcyBmYXIgYmV0dGVyIHRoYW4gaW50cm9kdWNpbmcgQnVnZ3kgYmVoYXZpb3IuXG4gICAgIyBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChzYXZlUHJvcGVydGllcylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoKGNoZWNrU2VsZWN0aW9uKVxuXG4gIHJlc2V0Tm9ybWFsTW9kZTogKHt1c2VySW52b2NhdGlvbn09e30pIC0+XG4gICAgaWYgdXNlckludm9jYXRpb24gPyBmYWxzZVxuICAgICAgaWYgQGVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKVxuICAgICAgICBAZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpXG4gICAgICBlbHNlIGlmIEBoYXNQZXJzaXN0ZW50U2VsZWN0aW9ucygpIGFuZCBzZXR0aW5ncy5nZXQoJ2NsZWFyUGVyc2lzdGVudFNlbGVjdGlvbk9uUmVzZXROb3JtYWxNb2RlJylcbiAgICAgICAgQGNsZWFyUGVyc2lzdGVudFNlbGVjdGlvbnMoKVxuICAgICAgZWxzZSBpZiBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzUGF0dGVybnMoKVxuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpXG5cbiAgICAgIGlmIHNldHRpbmdzLmdldCgnY2xlYXJIaWdobGlnaHRTZWFyY2hPblJlc2V0Tm9ybWFsTW9kZScpXG4gICAgICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nLCBudWxsKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcbiAgICBAYWN0aXZhdGUoJ25vcm1hbCcpXG5cbiAgcmVzZXQ6IC0+XG4gICAgQHJlZ2lzdGVyLnJlc2V0KClcbiAgICBAc2VhcmNoSGlzdG9yeS5yZXNldCgpXG4gICAgQGhvdmVyLnJlc2V0KClcbiAgICBAb3BlcmF0aW9uU3RhY2sucmVzZXQoKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIucmVzZXQoKVxuXG4gIGlzVmlzaWJsZTogLT5cbiAgICBAZWRpdG9yIGluIGdldFZpc2libGVFZGl0b3JzKClcblxuICB1cGRhdGVDdXJzb3JzVmlzaWJpbGl0eTogLT5cbiAgICBAY3Vyc29yU3R5bGVNYW5hZ2VyLnJlZnJlc2goKVxuXG4gIHVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgcHJvcGVydGllcyA9IEBnZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCk/LmdldENoYXJhY3Rlcndpc2VQcm9wZXJ0aWVzKClcbiAgICBlbHNlXG4gICAgICBwcm9wZXJ0aWVzID0gc3dyYXAoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLmNhcHR1cmVQcm9wZXJ0aWVzKClcblxuICAgIHJldHVybiB1bmxlc3MgcHJvcGVydGllcz9cblxuICAgIHtoZWFkLCB0YWlsfSA9IHByb3BlcnRpZXNcbiAgICBpZiBoZWFkLmlzR3JlYXRlclRoYW4odGFpbClcbiAgICAgIEBtYXJrLnNldFJhbmdlKCc8JywgJz4nLCBbdGFpbCwgaGVhZF0pXG4gICAgZWxzZVxuICAgICAgQG1hcmsuc2V0UmFuZ2UoJzwnLCAnPicsIFtoZWFkLCB0YWlsXSlcbiAgICBAcHJldmlvdXNTZWxlY3Rpb24gPSB7cHJvcGVydGllcywgQHN1Ym1vZGV9XG5cbiAgIyBQZXJzaXN0ZW50IHNlbGVjdGlvblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzUGVyc2lzdGVudFNlbGVjdGlvbnM6IC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24uaGFzTWFya2VycygpXG5cbiAgZ2V0UGVyc2lzdGVudFNlbGVjdGlvbkJ1ZmZmZXJSYW5nZXM6IC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQnVmZmVyUmFuZ2VzKClcblxuICBjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25zOiAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLmNsZWFyTWFya2VycygpXG5cbiAgIyBBbmltYXRpb24gbWFuYWdlbWVudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2Nyb2xsQW5pbWF0aW9uRWZmZWN0OiBudWxsXG4gIHJlcXVlc3RTY3JvbGxBbmltYXRpb246IChmcm9tLCB0bywgb3B0aW9ucykgLT5cbiAgICBAc2Nyb2xsQW5pbWF0aW9uRWZmZWN0ID0galF1ZXJ5KGZyb20pLmFuaW1hdGUodG8sIG9wdGlvbnMpXG5cbiAgZmluaXNoU2Nyb2xsQW5pbWF0aW9uOiAtPlxuICAgIEBzY3JvbGxBbmltYXRpb25FZmZlY3Q/LmZpbmlzaCgpXG4gICAgQHNjcm9sbEFuaW1hdGlvbkVmZmVjdCA9IG51bGxcbiJdfQ==
