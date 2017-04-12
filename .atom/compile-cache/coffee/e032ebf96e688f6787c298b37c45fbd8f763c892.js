(function() {
  var CompositeDisposable, Disposable, Emitter, Grim, InsertMode, Motions, Operators, Point, Prefixes, Range, Scroll, TextObjects, Utils, VimState, _, ref, ref1, settings,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Grim = require('grim');

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  ref1 = require('event-kit'), Emitter = ref1.Emitter, Disposable = ref1.Disposable, CompositeDisposable = ref1.CompositeDisposable;

  settings = require('./settings');

  Operators = require('./operators/index');

  Prefixes = require('./prefixes');

  Motions = require('./motions/index');

  InsertMode = require('./insert-mode');

  TextObjects = require('./text-objects');

  Utils = require('./utils');

  Scroll = require('./scroll');

  module.exports = VimState = (function() {
    VimState.prototype.editor = null;

    VimState.prototype.opStack = null;

    VimState.prototype.mode = null;

    VimState.prototype.submode = null;

    VimState.prototype.destroyed = false;

    VimState.prototype.replaceModeListener = null;

    function VimState(editorElement, statusBarManager, globalVimState) {
      this.editorElement = editorElement;
      this.statusBarManager = statusBarManager;
      this.globalVimState = globalVimState;
      this.ensureCursorsWithinLine = bind(this.ensureCursorsWithinLine, this);
      this.checkSelections = bind(this.checkSelections, this);
      this.replaceModeUndoHandler = bind(this.replaceModeUndoHandler, this);
      this.replaceModeInsertHandler = bind(this.replaceModeInsertHandler, this);
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.editor = this.editorElement.getModel();
      this.opStack = [];
      this.history = [];
      this.marks = {};
      this.subscriptions.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
      this.editorElement.addEventListener('mouseup', this.checkSelections);
      if (atom.commands.onDidDispatch != null) {
        this.subscriptions.add(atom.commands.onDidDispatch((function(_this) {
          return function(e) {
            if (e.target === _this.editorElement) {
              return _this.checkSelections();
            }
          };
        })(this)));
      }
      this.editorElement.classList.add("vim-mode");
      this.setupNormalMode();
      if (settings.startInInsertMode()) {
        this.activateInsertMode();
      } else {
        this.activateNormalMode();
      }
    }

    VimState.prototype.destroy = function() {
      var ref2;
      if (!this.destroyed) {
        this.destroyed = true;
        this.subscriptions.dispose();
        if (this.editor.isAlive()) {
          this.deactivateInsertMode();
          if ((ref2 = this.editorElement.component) != null) {
            ref2.setInputEnabled(true);
          }
          this.editorElement.classList.remove("vim-mode");
          this.editorElement.classList.remove("normal-mode");
        }
        this.editorElement.removeEventListener('mouseup', this.checkSelections);
        this.editor = null;
        this.editorElement = null;
        return this.emitter.emit('did-destroy');
      }
    };

    VimState.prototype.setupNormalMode = function() {
      this.registerCommands({
        'activate-normal-mode': (function(_this) {
          return function() {
            return _this.activateNormalMode();
          };
        })(this),
        'activate-linewise-visual-mode': (function(_this) {
          return function() {
            return _this.activateVisualMode('linewise');
          };
        })(this),
        'activate-characterwise-visual-mode': (function(_this) {
          return function() {
            return _this.activateVisualMode('characterwise');
          };
        })(this),
        'activate-blockwise-visual-mode': (function(_this) {
          return function() {
            return _this.activateVisualMode('blockwise');
          };
        })(this),
        'reset-normal-mode': (function(_this) {
          return function() {
            return _this.resetNormalMode();
          };
        })(this),
        'repeat-prefix': (function(_this) {
          return function(e) {
            return _this.repeatPrefix(e);
          };
        })(this),
        'reverse-selections': (function(_this) {
          return function(e) {
            return _this.reverseSelections(e);
          };
        })(this),
        'undo': (function(_this) {
          return function(e) {
            return _this.undo(e);
          };
        })(this),
        'replace-mode-backspace': (function(_this) {
          return function() {
            return _this.replaceModeUndo();
          };
        })(this),
        'insert-mode-put': (function(_this) {
          return function(e) {
            return _this.insertRegister(_this.registerName(e));
          };
        })(this),
        'copy-from-line-above': (function(_this) {
          return function() {
            return InsertMode.copyCharacterFromAbove(_this.editor, _this);
          };
        })(this),
        'copy-from-line-below': (function(_this) {
          return function() {
            return InsertMode.copyCharacterFromBelow(_this.editor, _this);
          };
        })(this)
      });
      return this.registerOperationCommands({
        'activate-insert-mode': (function(_this) {
          return function() {
            return new Operators.Insert(_this.editor, _this);
          };
        })(this),
        'activate-replace-mode': (function(_this) {
          return function() {
            return new Operators.ReplaceMode(_this.editor, _this);
          };
        })(this),
        'substitute': (function(_this) {
          return function() {
            return [new Operators.Change(_this.editor, _this), new Motions.MoveRight(_this.editor, _this)];
          };
        })(this),
        'substitute-line': (function(_this) {
          return function() {
            return [new Operators.Change(_this.editor, _this), new Motions.MoveToRelativeLine(_this.editor, _this)];
          };
        })(this),
        'insert-after': (function(_this) {
          return function() {
            return new Operators.InsertAfter(_this.editor, _this);
          };
        })(this),
        'insert-after-end-of-line': (function(_this) {
          return function() {
            return new Operators.InsertAfterEndOfLine(_this.editor, _this);
          };
        })(this),
        'insert-at-beginning-of-line': (function(_this) {
          return function() {
            return new Operators.InsertAtBeginningOfLine(_this.editor, _this);
          };
        })(this),
        'insert-above-with-newline': (function(_this) {
          return function() {
            return new Operators.InsertAboveWithNewline(_this.editor, _this);
          };
        })(this),
        'insert-below-with-newline': (function(_this) {
          return function() {
            return new Operators.InsertBelowWithNewline(_this.editor, _this);
          };
        })(this),
        'delete': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Delete);
          };
        })(this),
        'change': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Change);
          };
        })(this),
        'change-to-last-character-of-line': (function(_this) {
          return function() {
            return [new Operators.Change(_this.editor, _this), new Motions.MoveToLastCharacterOfLine(_this.editor, _this)];
          };
        })(this),
        'delete-right': (function(_this) {
          return function() {
            return [new Operators.Delete(_this.editor, _this), new Motions.MoveRight(_this.editor, _this)];
          };
        })(this),
        'delete-left': (function(_this) {
          return function() {
            return [new Operators.Delete(_this.editor, _this), new Motions.MoveLeft(_this.editor, _this)];
          };
        })(this),
        'delete-to-last-character-of-line': (function(_this) {
          return function() {
            return [new Operators.Delete(_this.editor, _this), new Motions.MoveToLastCharacterOfLine(_this.editor, _this)];
          };
        })(this),
        'toggle-case': (function(_this) {
          return function() {
            return new Operators.ToggleCase(_this.editor, _this);
          };
        })(this),
        'upper-case': (function(_this) {
          return function() {
            return new Operators.UpperCase(_this.editor, _this);
          };
        })(this),
        'lower-case': (function(_this) {
          return function() {
            return new Operators.LowerCase(_this.editor, _this);
          };
        })(this),
        'toggle-case-now': (function(_this) {
          return function() {
            return new Operators.ToggleCase(_this.editor, _this, {
              complete: true
            });
          };
        })(this),
        'yank': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Yank);
          };
        })(this),
        'yank-line': (function(_this) {
          return function() {
            return [new Operators.Yank(_this.editor, _this), new Motions.MoveToRelativeLine(_this.editor, _this)];
          };
        })(this),
        'put-before': (function(_this) {
          return function() {
            return new Operators.Put(_this.editor, _this, {
              location: 'before'
            });
          };
        })(this),
        'put-after': (function(_this) {
          return function() {
            return new Operators.Put(_this.editor, _this, {
              location: 'after'
            });
          };
        })(this),
        'join': (function(_this) {
          return function() {
            return new Operators.Join(_this.editor, _this);
          };
        })(this),
        'indent': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Indent);
          };
        })(this),
        'outdent': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Outdent);
          };
        })(this),
        'auto-indent': (function(_this) {
          return function() {
            return _this.linewiseAliasedOperator(Operators.Autoindent);
          };
        })(this),
        'increase': (function(_this) {
          return function() {
            return new Operators.Increase(_this.editor, _this);
          };
        })(this),
        'decrease': (function(_this) {
          return function() {
            return new Operators.Decrease(_this.editor, _this);
          };
        })(this),
        'move-left': (function(_this) {
          return function() {
            return new Motions.MoveLeft(_this.editor, _this);
          };
        })(this),
        'move-up': (function(_this) {
          return function() {
            return new Motions.MoveUp(_this.editor, _this);
          };
        })(this),
        'move-down': (function(_this) {
          return function() {
            return new Motions.MoveDown(_this.editor, _this);
          };
        })(this),
        'move-right': (function(_this) {
          return function() {
            return new Motions.MoveRight(_this.editor, _this);
          };
        })(this),
        'move-to-next-word': (function(_this) {
          return function() {
            return new Motions.MoveToNextWord(_this.editor, _this);
          };
        })(this),
        'move-to-next-whole-word': (function(_this) {
          return function() {
            return new Motions.MoveToNextWholeWord(_this.editor, _this);
          };
        })(this),
        'move-to-end-of-word': (function(_this) {
          return function() {
            return new Motions.MoveToEndOfWord(_this.editor, _this);
          };
        })(this),
        'move-to-end-of-whole-word': (function(_this) {
          return function() {
            return new Motions.MoveToEndOfWholeWord(_this.editor, _this);
          };
        })(this),
        'move-to-previous-word': (function(_this) {
          return function() {
            return new Motions.MoveToPreviousWord(_this.editor, _this);
          };
        })(this),
        'move-to-previous-whole-word': (function(_this) {
          return function() {
            return new Motions.MoveToPreviousWholeWord(_this.editor, _this);
          };
        })(this),
        'move-to-next-paragraph': (function(_this) {
          return function() {
            return new Motions.MoveToNextParagraph(_this.editor, _this);
          };
        })(this),
        'move-to-next-sentence': (function(_this) {
          return function() {
            return new Motions.MoveToNextSentence(_this.editor, _this);
          };
        })(this),
        'move-to-previous-sentence': (function(_this) {
          return function() {
            return new Motions.MoveToPreviousSentence(_this.editor, _this);
          };
        })(this),
        'move-to-previous-paragraph': (function(_this) {
          return function() {
            return new Motions.MoveToPreviousParagraph(_this.editor, _this);
          };
        })(this),
        'move-to-first-character-of-line': (function(_this) {
          return function() {
            return new Motions.MoveToFirstCharacterOfLine(_this.editor, _this);
          };
        })(this),
        'move-to-first-character-of-line-and-down': (function(_this) {
          return function() {
            return new Motions.MoveToFirstCharacterOfLineAndDown(_this.editor, _this);
          };
        })(this),
        'move-to-last-character-of-line': (function(_this) {
          return function() {
            return new Motions.MoveToLastCharacterOfLine(_this.editor, _this);
          };
        })(this),
        'move-to-last-nonblank-character-of-line-and-down': (function(_this) {
          return function() {
            return new Motions.MoveToLastNonblankCharacterOfLineAndDown(_this.editor, _this);
          };
        })(this),
        'move-to-beginning-of-line': (function(_this) {
          return function(e) {
            return _this.moveOrRepeat(e);
          };
        })(this),
        'move-to-first-character-of-line-up': (function(_this) {
          return function() {
            return new Motions.MoveToFirstCharacterOfLineUp(_this.editor, _this);
          };
        })(this),
        'move-to-first-character-of-line-down': (function(_this) {
          return function() {
            return new Motions.MoveToFirstCharacterOfLineDown(_this.editor, _this);
          };
        })(this),
        'move-to-start-of-file': (function(_this) {
          return function() {
            return new Motions.MoveToStartOfFile(_this.editor, _this);
          };
        })(this),
        'move-to-line': (function(_this) {
          return function() {
            return new Motions.MoveToAbsoluteLine(_this.editor, _this);
          };
        })(this),
        'move-to-top-of-screen': (function(_this) {
          return function() {
            return new Motions.MoveToTopOfScreen(_this.editorElement, _this);
          };
        })(this),
        'move-to-bottom-of-screen': (function(_this) {
          return function() {
            return new Motions.MoveToBottomOfScreen(_this.editorElement, _this);
          };
        })(this),
        'move-to-middle-of-screen': (function(_this) {
          return function() {
            return new Motions.MoveToMiddleOfScreen(_this.editorElement, _this);
          };
        })(this),
        'scroll-down': (function(_this) {
          return function() {
            return new Scroll.ScrollDown(_this.editorElement);
          };
        })(this),
        'scroll-up': (function(_this) {
          return function() {
            return new Scroll.ScrollUp(_this.editorElement);
          };
        })(this),
        'scroll-cursor-to-top': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToTop(_this.editorElement);
          };
        })(this),
        'scroll-cursor-to-top-leave': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToTop(_this.editorElement, {
              leaveCursor: true
            });
          };
        })(this),
        'scroll-cursor-to-middle': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToMiddle(_this.editorElement);
          };
        })(this),
        'scroll-cursor-to-middle-leave': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToMiddle(_this.editorElement, {
              leaveCursor: true
            });
          };
        })(this),
        'scroll-cursor-to-bottom': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToBottom(_this.editorElement);
          };
        })(this),
        'scroll-cursor-to-bottom-leave': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToBottom(_this.editorElement, {
              leaveCursor: true
            });
          };
        })(this),
        'scroll-half-screen-up': (function(_this) {
          return function() {
            return new Motions.ScrollHalfUpKeepCursor(_this.editorElement, _this);
          };
        })(this),
        'scroll-full-screen-up': (function(_this) {
          return function() {
            return new Motions.ScrollFullUpKeepCursor(_this.editorElement, _this);
          };
        })(this),
        'scroll-half-screen-down': (function(_this) {
          return function() {
            return new Motions.ScrollHalfDownKeepCursor(_this.editorElement, _this);
          };
        })(this),
        'scroll-full-screen-down': (function(_this) {
          return function() {
            return new Motions.ScrollFullDownKeepCursor(_this.editorElement, _this);
          };
        })(this),
        'scroll-cursor-to-left': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToLeft(_this.editorElement);
          };
        })(this),
        'scroll-cursor-to-right': (function(_this) {
          return function() {
            return new Scroll.ScrollCursorToRight(_this.editorElement);
          };
        })(this),
        'select-inside-word': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideWord(_this.editor);
          };
        })(this),
        'select-inside-whole-word': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideWholeWord(_this.editor);
          };
        })(this),
        'select-inside-double-quotes': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '"', false);
          };
        })(this),
        'select-inside-single-quotes': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '\'', false);
          };
        })(this),
        'select-inside-back-ticks': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '`', false);
          };
        })(this),
        'select-inside-curly-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '{', '}', false);
          };
        })(this),
        'select-inside-angle-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '<', '>', false);
          };
        })(this),
        'select-inside-tags': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '>', '<', false);
          };
        })(this),
        'select-inside-square-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '[', ']', false);
          };
        })(this),
        'select-inside-parentheses': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '(', ')', false);
          };
        })(this),
        'select-inside-paragraph': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideParagraph(_this.editor, false);
          };
        })(this),
        'select-a-word': (function(_this) {
          return function() {
            return new TextObjects.SelectAWord(_this.editor);
          };
        })(this),
        'select-a-whole-word': (function(_this) {
          return function() {
            return new TextObjects.SelectAWholeWord(_this.editor);
          };
        })(this),
        'select-around-double-quotes': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '"', true);
          };
        })(this),
        'select-around-single-quotes': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '\'', true);
          };
        })(this),
        'select-around-back-ticks': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideQuotes(_this.editor, '`', true);
          };
        })(this),
        'select-around-curly-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '{', '}', true);
          };
        })(this),
        'select-around-angle-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '<', '>', true);
          };
        })(this),
        'select-around-square-brackets': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '[', ']', true);
          };
        })(this),
        'select-around-parentheses': (function(_this) {
          return function() {
            return new TextObjects.SelectInsideBrackets(_this.editor, '(', ')', true);
          };
        })(this),
        'select-around-paragraph': (function(_this) {
          return function() {
            return new TextObjects.SelectAParagraph(_this.editor, true);
          };
        })(this),
        'register-prefix': (function(_this) {
          return function(e) {
            return _this.registerPrefix(e);
          };
        })(this),
        'repeat': (function(_this) {
          return function(e) {
            return new Operators.Repeat(_this.editor, _this);
          };
        })(this),
        'repeat-search': (function(_this) {
          return function(e) {
            return new Motions.RepeatSearch(_this.editor, _this);
          };
        })(this),
        'repeat-search-backwards': (function(_this) {
          return function(e) {
            return new Motions.RepeatSearch(_this.editor, _this).reversed();
          };
        })(this),
        'move-to-mark': (function(_this) {
          return function(e) {
            return new Motions.MoveToMark(_this.editor, _this);
          };
        })(this),
        'move-to-mark-literal': (function(_this) {
          return function(e) {
            return new Motions.MoveToMark(_this.editor, _this, false);
          };
        })(this),
        'mark': (function(_this) {
          return function(e) {
            return new Operators.Mark(_this.editor, _this);
          };
        })(this),
        'find': (function(_this) {
          return function(e) {
            return new Motions.Find(_this.editor, _this);
          };
        })(this),
        'find-backwards': (function(_this) {
          return function(e) {
            return new Motions.Find(_this.editor, _this).reverse();
          };
        })(this),
        'till': (function(_this) {
          return function(e) {
            return new Motions.Till(_this.editor, _this);
          };
        })(this),
        'till-backwards': (function(_this) {
          return function(e) {
            return new Motions.Till(_this.editor, _this).reverse();
          };
        })(this),
        'repeat-find': (function(_this) {
          return function(e) {
            if (_this.globalVimState.currentFind) {
              return new _this.globalVimState.currentFind.constructor(_this.editor, _this, {
                repeated: true
              });
            }
          };
        })(this),
        'repeat-find-reverse': (function(_this) {
          return function(e) {
            if (_this.globalVimState.currentFind) {
              return new _this.globalVimState.currentFind.constructor(_this.editor, _this, {
                repeated: true,
                reverse: true
              });
            }
          };
        })(this),
        'replace': (function(_this) {
          return function(e) {
            return new Operators.Replace(_this.editor, _this);
          };
        })(this),
        'search': (function(_this) {
          return function(e) {
            return new Motions.Search(_this.editor, _this);
          };
        })(this),
        'reverse-search': (function(_this) {
          return function(e) {
            return (new Motions.Search(_this.editor, _this)).reversed();
          };
        })(this),
        'search-current-word': (function(_this) {
          return function(e) {
            return new Motions.SearchCurrentWord(_this.editor, _this);
          };
        })(this),
        'bracket-matching-motion': (function(_this) {
          return function(e) {
            return new Motions.BracketMatchingMotion(_this.editor, _this);
          };
        })(this),
        'reverse-search-current-word': (function(_this) {
          return function(e) {
            return (new Motions.SearchCurrentWord(_this.editor, _this)).reversed();
          };
        })(this)
      });
    };

    VimState.prototype.registerCommands = function(commands) {
      var commandName, fn, results;
      results = [];
      for (commandName in commands) {
        fn = commands[commandName];
        results.push((function(_this) {
          return function(fn) {
            return _this.subscriptions.add(atom.commands.add(_this.editorElement, "vim-mode:" + commandName, fn));
          };
        })(this)(fn));
      }
      return results;
    };

    VimState.prototype.registerOperationCommands = function(operationCommands) {
      var commandName, commands, fn1, operationFn;
      commands = {};
      fn1 = (function(_this) {
        return function(operationFn) {
          return commands[commandName] = function(event) {
            return _this.pushOperations(operationFn(event));
          };
        };
      })(this);
      for (commandName in operationCommands) {
        operationFn = operationCommands[commandName];
        fn1(operationFn);
      }
      return this.registerCommands(commands);
    };

    VimState.prototype.pushOperations = function(operations) {
      var i, len, operation, results, topOp;
      if (operations == null) {
        return;
      }
      if (!_.isArray(operations)) {
        operations = [operations];
      }
      results = [];
      for (i = 0, len = operations.length; i < len; i++) {
        operation = operations[i];
        if (this.mode === 'visual' && (operation instanceof Motions.Motion || operation instanceof TextObjects.TextObject)) {
          operation.execute = operation.select;
        }
        if (((topOp = this.topOperation()) != null) && (topOp.canComposeWith != null) && !topOp.canComposeWith(operation)) {
          this.resetNormalMode();
          this.emitter.emit('failed-to-compose');
          break;
        }
        this.opStack.push(operation);
        if (this.mode === 'visual' && operation instanceof Operators.Operator) {
          this.opStack.push(new Motions.CurrentSelection(this.editor, this));
        }
        results.push(this.processOpStack());
      }
      return results;
    };

    VimState.prototype.onDidFailToCompose = function(fn) {
      return this.emitter.on('failed-to-compose', fn);
    };

    VimState.prototype.onDidDestroy = function(fn) {
      return this.emitter.on('did-destroy', fn);
    };

    VimState.prototype.clearOpStack = function() {
      return this.opStack = [];
    };

    VimState.prototype.undo = function() {
      this.editor.undo();
      return this.activateNormalMode();
    };

    VimState.prototype.processOpStack = function() {
      var e, poppedOperation;
      if (!(this.opStack.length > 0)) {
        return;
      }
      if (!this.topOperation().isComplete()) {
        if (this.mode === 'normal' && this.topOperation() instanceof Operators.Operator) {
          this.activateOperatorPendingMode();
        }
        return;
      }
      poppedOperation = this.opStack.pop();
      if (this.opStack.length) {
        try {
          this.topOperation().compose(poppedOperation);
          return this.processOpStack();
        } catch (error) {
          e = error;
          if ((e instanceof Operators.OperatorError) || (e instanceof Motions.MotionError)) {
            return this.resetNormalMode();
          } else {
            throw e;
          }
        }
      } else {
        if (poppedOperation.isRecordable()) {
          this.history.unshift(poppedOperation);
        }
        return poppedOperation.execute();
      }
    };

    VimState.prototype.topOperation = function() {
      return _.last(this.opStack);
    };

    VimState.prototype.getRegister = function(name) {
      var text, type;
      if (name === '"') {
        name = settings.defaultRegister();
      }
      if (name === '*' || name === '+') {
        text = atom.clipboard.read();
        type = Utils.copyType(text);
        return {
          text: text,
          type: type
        };
      } else if (name === '%') {
        text = this.editor.getURI();
        type = Utils.copyType(text);
        return {
          text: text,
          type: type
        };
      } else if (name === "_") {
        text = '';
        type = Utils.copyType(text);
        return {
          text: text,
          type: type
        };
      } else {
        return this.globalVimState.registers[name.toLowerCase()];
      }
    };

    VimState.prototype.getMark = function(name) {
      if (this.marks[name]) {
        return this.marks[name].getBufferRange().start;
      } else {
        return void 0;
      }
    };

    VimState.prototype.setRegister = function(name, value) {
      if (name === '"') {
        name = settings.defaultRegister();
      }
      if (name === '*' || name === '+') {
        return atom.clipboard.write(value.text);
      } else if (name === '_') {

      } else if (/^[A-Z]$/.test(name)) {
        return this.appendRegister(name.toLowerCase(), value);
      } else {
        return this.globalVimState.registers[name] = value;
      }
    };

    VimState.prototype.appendRegister = function(name, value) {
      var base, register;
      register = (base = this.globalVimState.registers)[name] != null ? base[name] : base[name] = {
        type: 'character',
        text: ""
      };
      if (register.type === 'linewise' && value.type !== 'linewise') {
        return register.text += value.text + '\n';
      } else if (register.type !== 'linewise' && value.type === 'linewise') {
        register.text += '\n' + value.text;
        return register.type = 'linewise';
      } else {
        return register.text += value.text;
      }
    };

    VimState.prototype.setMark = function(name, pos) {
      var charCode, marker;
      if ((charCode = name.charCodeAt(0)) >= 96 && charCode <= 122) {
        marker = this.editor.markBufferRange(new Range(pos, pos), {
          invalidate: 'never',
          persistent: false
        });
        return this.marks[name] = marker;
      }
    };

    VimState.prototype.pushSearchHistory = function(search) {
      return this.globalVimState.searchHistory.unshift(search);
    };

    VimState.prototype.getSearchHistoryItem = function(index) {
      if (index == null) {
        index = 0;
      }
      return this.globalVimState.searchHistory[index];
    };

    VimState.prototype.activateNormalMode = function() {
      var i, len, ref2, selection;
      this.deactivateInsertMode();
      this.deactivateVisualMode();
      this.mode = 'normal';
      this.submode = null;
      this.changeModeClass('normal-mode');
      this.clearOpStack();
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        selection.clear({
          autoscroll: false
        });
      }
      this.ensureCursorsWithinLine();
      return this.updateStatusBar();
    };

    VimState.prototype.activateCommandMode = function() {
      Grim.deprecate("Use ::activateNormalMode instead");
      return this.activateNormalMode();
    };

    VimState.prototype.activateInsertMode = function(subtype) {
      if (subtype == null) {
        subtype = null;
      }
      this.mode = 'insert';
      this.editorElement.component.setInputEnabled(true);
      this.setInsertionCheckpoint();
      this.submode = subtype;
      this.changeModeClass('insert-mode');
      return this.updateStatusBar();
    };

    VimState.prototype.activateReplaceMode = function() {
      this.activateInsertMode('replace');
      this.replaceModeCounter = 0;
      this.editorElement.classList.add('replace-mode');
      this.subscriptions.add(this.replaceModeListener = this.editor.onWillInsertText(this.replaceModeInsertHandler));
      return this.subscriptions.add(this.replaceModeUndoListener = this.editor.onDidInsertText(this.replaceModeUndoHandler));
    };

    VimState.prototype.replaceModeInsertHandler = function(event) {
      var char, chars, i, j, len, len1, ref2, selection, selections;
      chars = ((ref2 = event.text) != null ? ref2.split('') : void 0) || [];
      selections = this.editor.getSelections();
      for (i = 0, len = chars.length; i < len; i++) {
        char = chars[i];
        if (char === '\n') {
          continue;
        }
        for (j = 0, len1 = selections.length; j < len1; j++) {
          selection = selections[j];
          if (!selection.cursor.isAtEndOfLine()) {
            selection["delete"]();
          }
        }
      }
    };

    VimState.prototype.replaceModeUndoHandler = function(event) {
      return this.replaceModeCounter++;
    };

    VimState.prototype.replaceModeUndo = function() {
      if (this.replaceModeCounter > 0) {
        this.editor.undo();
        this.editor.undo();
        this.editor.moveLeft();
        return this.replaceModeCounter--;
      }
    };

    VimState.prototype.setInsertionCheckpoint = function() {
      if (this.insertionCheckpoint == null) {
        return this.insertionCheckpoint = this.editor.createCheckpoint();
      }
    };

    VimState.prototype.deactivateInsertMode = function() {
      var changes, cursor, i, item, len, ref2, ref3;
      if ((ref2 = this.mode) !== null && ref2 !== 'insert') {
        return;
      }
      this.editorElement.component.setInputEnabled(false);
      this.editorElement.classList.remove('replace-mode');
      this.editor.groupChangesSinceCheckpoint(this.insertionCheckpoint);
      changes = this.editor.buffer.getChangesSinceCheckpoint(this.insertionCheckpoint);
      item = this.inputOperator(this.history[0]);
      this.insertionCheckpoint = null;
      if (item != null) {
        item.confirmChanges(changes);
      }
      ref3 = this.editor.getCursors();
      for (i = 0, len = ref3.length; i < len; i++) {
        cursor = ref3[i];
        if (!cursor.isAtBeginningOfLine()) {
          cursor.moveLeft();
        }
      }
      if (this.replaceModeListener != null) {
        this.replaceModeListener.dispose();
        this.subscriptions.remove(this.replaceModeListener);
        this.replaceModeListener = null;
        this.replaceModeUndoListener.dispose();
        this.subscriptions.remove(this.replaceModeUndoListener);
        return this.replaceModeUndoListener = null;
      }
    };

    VimState.prototype.deactivateVisualMode = function() {
      var i, len, ref2, results, selection;
      if (this.mode !== 'visual') {
        return;
      }
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        if (!(selection.isEmpty() || selection.isReversed())) {
          results.push(selection.cursor.moveLeft());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    VimState.prototype.inputOperator = function(item) {
      var ref2;
      if (item == null) {
        return item;
      }
      if (typeof item.inputOperator === "function" ? item.inputOperator() : void 0) {
        return item;
      }
      if ((ref2 = item.composedObject) != null ? typeof ref2.inputOperator === "function" ? ref2.inputOperator() : void 0 : void 0) {
        return item.composedObject;
      }
    };

    VimState.prototype.activateVisualMode = function(type) {
      var end, endRow, i, j, k, len, len1, originalRange, ref2, ref3, ref4, ref5, ref6, ref7, ref8, row, selection, start, startRow;
      if (this.mode === 'visual') {
        if (this.submode === type) {
          this.activateNormalMode();
          return;
        }
        this.submode = type;
        if (this.submode === 'linewise') {
          ref2 = this.editor.getSelections();
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            originalRange = selection.getBufferRange();
            selection.marker.setProperties({
              originalRange: originalRange
            });
            ref3 = selection.getBufferRowRange(), start = ref3[0], end = ref3[1];
            for (row = j = ref4 = start, ref5 = end; ref4 <= ref5 ? j <= ref5 : j >= ref5; row = ref4 <= ref5 ? ++j : --j) {
              selection.selectLine(row);
            }
          }
        } else if ((ref6 = this.submode) === 'characterwise' || ref6 === 'blockwise') {
          ref7 = this.editor.getSelections();
          for (k = 0, len1 = ref7.length; k < len1; k++) {
            selection = ref7[k];
            originalRange = selection.marker.getProperties().originalRange;
            if (originalRange) {
              ref8 = selection.getBufferRowRange(), startRow = ref8[0], endRow = ref8[1];
              originalRange.start.row = startRow;
              originalRange.end.row = endRow;
              selection.setBufferRange(originalRange);
            }
          }
        }
      } else {
        this.deactivateInsertMode();
        this.mode = 'visual';
        this.submode = type;
        this.changeModeClass('visual-mode');
        if (this.submode === 'linewise') {
          this.editor.selectLinesContainingCursors();
        } else if (this.editor.getSelectedText() === '') {
          this.editor.selectRight();
        }
      }
      return this.updateStatusBar();
    };

    VimState.prototype.resetVisualMode = function() {
      return this.activateVisualMode(this.submode);
    };

    VimState.prototype.activateOperatorPendingMode = function() {
      this.deactivateInsertMode();
      this.mode = 'operator-pending';
      this.submode = null;
      this.changeModeClass('operator-pending-mode');
      return this.updateStatusBar();
    };

    VimState.prototype.changeModeClass = function(targetMode) {
      var i, len, mode, ref2, results;
      ref2 = ['normal-mode', 'insert-mode', 'visual-mode', 'operator-pending-mode'];
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        mode = ref2[i];
        if (mode === targetMode) {
          results.push(this.editorElement.classList.add(mode));
        } else {
          results.push(this.editorElement.classList.remove(mode));
        }
      }
      return results;
    };

    VimState.prototype.resetNormalMode = function() {
      this.clearOpStack();
      this.editor.clearSelections();
      return this.activateNormalMode();
    };

    VimState.prototype.registerPrefix = function(e) {
      return new Prefixes.Register(this.registerName(e));
    };

    VimState.prototype.registerName = function(e) {
      var keyboardEvent, name, ref2, ref3;
      keyboardEvent = (ref2 = (ref3 = e.originalEvent) != null ? ref3.originalEvent : void 0) != null ? ref2 : e.originalEvent;
      name = atom.keymaps.keystrokeForKeyboardEvent(keyboardEvent);
      if (name.lastIndexOf('shift-', 0) === 0) {
        name = name.slice(6);
      }
      return name;
    };

    VimState.prototype.repeatPrefix = function(e) {
      var keyboardEvent, num, ref2, ref3;
      keyboardEvent = (ref2 = (ref3 = e.originalEvent) != null ? ref3.originalEvent : void 0) != null ? ref2 : e.originalEvent;
      num = parseInt(atom.keymaps.keystrokeForKeyboardEvent(keyboardEvent));
      if (this.topOperation() instanceof Prefixes.Repeat) {
        return this.topOperation().addDigit(num);
      } else {
        if (num === 0) {
          return e.abortKeyBinding();
        } else {
          return this.pushOperations(new Prefixes.Repeat(num));
        }
      }
    };

    VimState.prototype.reverseSelections = function() {
      var i, len, ref2, results, reversed, selection;
      reversed = !this.editor.getLastSelection().isReversed();
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        results.push(selection.setBufferRange(selection.getBufferRange(), {
          reversed: reversed
        }));
      }
      return results;
    };

    VimState.prototype.moveOrRepeat = function(e) {
      if (this.topOperation() instanceof Prefixes.Repeat) {
        this.repeatPrefix(e);
        return null;
      } else {
        return new Motions.MoveToBeginningOfLine(this.editor, this);
      }
    };

    VimState.prototype.linewiseAliasedOperator = function(constructor) {
      if (this.isOperatorPending(constructor)) {
        return new Motions.MoveToRelativeLine(this.editor, this);
      } else {
        return new constructor(this.editor, this);
      }
    };

    VimState.prototype.isOperatorPending = function(constructor) {
      var i, len, op, ref2;
      if (constructor != null) {
        ref2 = this.opStack;
        for (i = 0, len = ref2.length; i < len; i++) {
          op = ref2[i];
          if (op instanceof constructor) {
            return op;
          }
        }
        return false;
      } else {
        return this.opStack.length > 0;
      }
    };

    VimState.prototype.updateStatusBar = function() {
      return this.statusBarManager.update(this.mode, this.submode);
    };

    VimState.prototype.insertRegister = function(name) {
      var ref2, text;
      text = (ref2 = this.getRegister(name)) != null ? ref2.text : void 0;
      if (text != null) {
        return this.editor.insertText(text);
      }
    };

    VimState.prototype.checkSelections = function() {
      if (this.editor == null) {
        return;
      }
      if (this.editor.getSelections().every(function(selection) {
        return selection.isEmpty();
      })) {
        if (this.mode === 'normal') {
          this.ensureCursorsWithinLine();
        }
        if (this.mode === 'visual') {
          return this.activateNormalMode();
        }
      } else {
        if (this.mode === 'normal') {
          return this.activateVisualMode('characterwise');
        }
      }
    };

    VimState.prototype.ensureCursorsWithinLine = function() {
      var cursor, goalColumn, i, len, ref2;
      ref2 = this.editor.getCursors();
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        goalColumn = cursor.goalColumn;
        if (cursor.isAtEndOfLine() && !cursor.isAtBeginningOfLine()) {
          cursor.moveLeft();
        }
        cursor.goalColumn = goalColumn;
      }
      return this.editor.mergeCursors();
    };

    return VimState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdmltLXN0YXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0tBQUE7SUFBQTs7RUFBQSxJQUFBLEdBQVEsT0FBQSxDQUFRLE1BQVI7O0VBQ1IsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsT0FBNkMsT0FBQSxDQUFRLFdBQVIsQ0FBN0MsRUFBQyxzQkFBRCxFQUFVLDRCQUFWLEVBQXNCOztFQUN0QixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsU0FBQSxHQUFZLE9BQUEsQ0FBUSxtQkFBUjs7RUFDWixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsT0FBQSxHQUFVLE9BQUEsQ0FBUSxpQkFBUjs7RUFDVixVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0VBRWIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ007dUJBQ0osTUFBQSxHQUFROzt1QkFDUixPQUFBLEdBQVM7O3VCQUNULElBQUEsR0FBTTs7dUJBQ04sT0FBQSxHQUFTOzt1QkFDVCxTQUFBLEdBQVc7O3VCQUNYLG1CQUFBLEdBQXFCOztJQUVSLGtCQUFDLGFBQUQsRUFBaUIsZ0JBQWpCLEVBQW9DLGNBQXBDO01BQUMsSUFBQyxDQUFBLGdCQUFEO01BQWdCLElBQUMsQ0FBQSxtQkFBRDtNQUFtQixJQUFDLENBQUEsaUJBQUQ7Ozs7O01BQy9DLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsYUFBYSxDQUFDLFFBQWYsQ0FBQTtNQUNWLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxPQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckIsQ0FBbkI7TUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLGdCQUFmLENBQWdDLFNBQWhDLEVBQTJDLElBQUMsQ0FBQSxlQUE1QztNQUNBLElBQUcsbUNBQUg7UUFDRSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFkLENBQTRCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDtZQUM3QyxJQUFHLENBQUMsQ0FBQyxNQUFGLEtBQVksS0FBQyxDQUFBLGFBQWhCO3FCQUNFLEtBQUMsQ0FBQSxlQUFELENBQUEsRUFERjs7VUFENkM7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVCLENBQW5CLEVBREY7O01BS0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBekIsQ0FBNkIsVUFBN0I7TUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO01BQ0EsSUFBRyxRQUFRLENBQUMsaUJBQVQsQ0FBQSxDQUFIO1FBQ0UsSUFBQyxDQUFBLGtCQUFELENBQUEsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUhGOztJQWpCVzs7dUJBc0JiLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUEsQ0FBTyxJQUFDLENBQUEsU0FBUjtRQUNFLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtRQUNBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsQ0FBSDtVQUNFLElBQUMsQ0FBQSxvQkFBRCxDQUFBOztnQkFDd0IsQ0FBRSxlQUExQixDQUEwQyxJQUExQzs7VUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF6QixDQUFnQyxVQUFoQztVQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQWdDLGFBQWhDLEVBSkY7O1FBS0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxtQkFBZixDQUFtQyxTQUFuQyxFQUE4QyxJQUFDLENBQUEsZUFBL0M7UUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLGFBQUQsR0FBaUI7ZUFDakIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZCxFQVhGOztJQURPOzt1QkFpQlQsZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQyxDQUFBLGdCQUFELENBQ0U7UUFBQSxzQkFBQSxFQUF3QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxrQkFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhCO1FBQ0EsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsa0JBQUQsQ0FBb0IsVUFBcEI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEakM7UUFFQSxvQ0FBQSxFQUFzQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxrQkFBRCxDQUFvQixlQUFwQjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZ0QztRQUdBLGdDQUFBLEVBQWtDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGtCQUFELENBQW9CLFdBQXBCO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSGxDO1FBSUEsbUJBQUEsRUFBcUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsZUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSnJCO1FBS0EsZUFBQSxFQUFpQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQU8sS0FBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTGpCO1FBTUEsb0JBQUEsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFPLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU50QjtRQU9BLE1BQUEsRUFBUSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQU8sS0FBQyxDQUFBLElBQUQsQ0FBTSxDQUFOO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBUFI7UUFRQSx3QkFBQSxFQUEwQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxlQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FSMUI7UUFTQSxpQkFBQSxFQUFtQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQU8sS0FBQyxDQUFBLGNBQUQsQ0FBZ0IsS0FBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLENBQWhCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBVG5CO1FBVUEsc0JBQUEsRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxVQUFVLENBQUMsc0JBQVgsQ0FBa0MsS0FBQyxDQUFBLE1BQW5DLEVBQTJDLEtBQTNDO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBVnhCO1FBV0Esc0JBQUEsRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxVQUFVLENBQUMsc0JBQVgsQ0FBa0MsS0FBQyxDQUFBLE1BQW5DLEVBQTJDLEtBQTNDO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBWHhCO09BREY7YUFjQSxJQUFDLENBQUEseUJBQUQsQ0FDRTtRQUFBLHNCQUFBLEVBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxTQUFTLENBQUMsTUFBVixDQUFpQixLQUFDLENBQUEsTUFBbEIsRUFBMEIsS0FBMUI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEI7UUFDQSx1QkFBQSxFQUF5QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsS0FBQyxDQUFBLE1BQXZCLEVBQStCLEtBQS9CO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRHpCO1FBRUEsWUFBQSxFQUFjLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsQ0FBSyxJQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCLEtBQUMsQ0FBQSxNQUFsQixFQUEwQixLQUExQixDQUFMLEVBQTBDLElBQUEsT0FBTyxDQUFDLFNBQVIsQ0FBa0IsS0FBQyxDQUFBLE1BQW5CLEVBQTJCLEtBQTNCLENBQTFDO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRmQ7UUFHQSxpQkFBQSxFQUFtQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLENBQUssSUFBQSxTQUFTLENBQUMsTUFBVixDQUFpQixLQUFDLENBQUEsTUFBbEIsRUFBMEIsS0FBMUIsQ0FBTCxFQUEwQyxJQUFBLE9BQU8sQ0FBQyxrQkFBUixDQUEyQixLQUFDLENBQUEsTUFBNUIsRUFBb0MsS0FBcEMsQ0FBMUM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FIbkI7UUFJQSxjQUFBLEVBQWdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxTQUFTLENBQUMsV0FBVixDQUFzQixLQUFDLENBQUEsTUFBdkIsRUFBK0IsS0FBL0I7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKaEI7UUFLQSwwQkFBQSxFQUE0QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLG9CQUFWLENBQStCLEtBQUMsQ0FBQSxNQUFoQyxFQUF3QyxLQUF4QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUw1QjtRQU1BLDZCQUFBLEVBQStCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxTQUFTLENBQUMsdUJBQVYsQ0FBa0MsS0FBQyxDQUFBLE1BQW5DLEVBQTJDLEtBQTNDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTi9CO1FBT0EsMkJBQUEsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFNBQVMsQ0FBQyxzQkFBVixDQUFpQyxLQUFDLENBQUEsTUFBbEMsRUFBMEMsS0FBMUM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FQN0I7UUFRQSwyQkFBQSxFQUE2QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLHNCQUFWLENBQWlDLEtBQUMsQ0FBQSxNQUFsQyxFQUEwQyxLQUExQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVI3QjtRQVNBLFFBQUEsRUFBVSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixTQUFTLENBQUMsTUFBbkM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FUVjtRQVVBLFFBQUEsRUFBVSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixTQUFTLENBQUMsTUFBbkM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FWVjtRQVdBLGtDQUFBLEVBQW9DLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsQ0FBSyxJQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCLEtBQUMsQ0FBQSxNQUFsQixFQUEwQixLQUExQixDQUFMLEVBQTBDLElBQUEsT0FBTyxDQUFDLHlCQUFSLENBQWtDLEtBQUMsQ0FBQSxNQUFuQyxFQUEyQyxLQUEzQyxDQUExQztVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVhwQztRQVlBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxDQUFLLElBQUEsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsS0FBQyxDQUFBLE1BQWxCLEVBQTBCLEtBQTFCLENBQUwsRUFBMEMsSUFBQSxPQUFPLENBQUMsU0FBUixDQUFrQixLQUFDLENBQUEsTUFBbkIsRUFBMkIsS0FBM0IsQ0FBMUM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FaaEI7UUFhQSxhQUFBLEVBQWUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxDQUFLLElBQUEsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsS0FBQyxDQUFBLE1BQWxCLEVBQTBCLEtBQTFCLENBQUwsRUFBMEMsSUFBQSxPQUFPLENBQUMsUUFBUixDQUFpQixLQUFDLENBQUEsTUFBbEIsRUFBMEIsS0FBMUIsQ0FBMUM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FiZjtRQWNBLGtDQUFBLEVBQW9DLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsQ0FBSyxJQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCLEtBQUMsQ0FBQSxNQUFsQixFQUEwQixLQUExQixDQUFMLEVBQTBDLElBQUEsT0FBTyxDQUFDLHlCQUFSLENBQWtDLEtBQUMsQ0FBQSxNQUFuQyxFQUEyQyxLQUEzQyxDQUExQztVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWRwQztRQWVBLGFBQUEsRUFBZSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLFVBQVYsQ0FBcUIsS0FBQyxDQUFBLE1BQXRCLEVBQThCLEtBQTlCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBZmY7UUFnQkEsWUFBQSxFQUFjLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxTQUFTLENBQUMsU0FBVixDQUFvQixLQUFDLENBQUEsTUFBckIsRUFBNkIsS0FBN0I7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoQmQ7UUFpQkEsWUFBQSxFQUFjLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxTQUFTLENBQUMsU0FBVixDQUFvQixLQUFDLENBQUEsTUFBckIsRUFBNkIsS0FBN0I7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FqQmQ7UUFrQkEsaUJBQUEsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFNBQVMsQ0FBQyxVQUFWLENBQXFCLEtBQUMsQ0FBQSxNQUF0QixFQUE4QixLQUE5QixFQUFvQztjQUFBLFFBQUEsRUFBVSxJQUFWO2FBQXBDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBbEJuQjtRQW1CQSxNQUFBLEVBQVEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsdUJBQUQsQ0FBeUIsU0FBUyxDQUFDLElBQW5DO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBbkJSO1FBb0JBLFdBQUEsRUFBYSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLENBQUssSUFBQSxTQUFTLENBQUMsSUFBVixDQUFlLEtBQUMsQ0FBQSxNQUFoQixFQUF3QixLQUF4QixDQUFMLEVBQXdDLElBQUEsT0FBTyxDQUFDLGtCQUFSLENBQTJCLEtBQUMsQ0FBQSxNQUE1QixFQUFvQyxLQUFwQyxDQUF4QztVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXBCYjtRQXFCQSxZQUFBLEVBQWMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFNBQVMsQ0FBQyxHQUFWLENBQWMsS0FBQyxDQUFBLE1BQWYsRUFBdUIsS0FBdkIsRUFBNkI7Y0FBQSxRQUFBLEVBQVUsUUFBVjthQUE3QjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXJCZDtRQXNCQSxXQUFBLEVBQWEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFNBQVMsQ0FBQyxHQUFWLENBQWMsS0FBQyxDQUFBLE1BQWYsRUFBdUIsS0FBdkIsRUFBNkI7Y0FBQSxRQUFBLEVBQVUsT0FBVjthQUE3QjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXRCYjtRQXVCQSxNQUFBLEVBQVEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsS0FBQyxDQUFBLE1BQWhCLEVBQXdCLEtBQXhCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdkJSO1FBd0JBLFFBQUEsRUFBVSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixTQUFTLENBQUMsTUFBbkM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F4QlY7UUF5QkEsU0FBQSxFQUFXLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLHVCQUFELENBQXlCLFNBQVMsQ0FBQyxPQUFuQztVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXpCWDtRQTBCQSxhQUFBLEVBQWUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsdUJBQUQsQ0FBeUIsU0FBUyxDQUFDLFVBQW5DO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBMUJmO1FBMkJBLFVBQUEsRUFBWSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsS0FBQyxDQUFBLE1BQXBCLEVBQTRCLEtBQTVCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBM0JaO1FBNEJBLFVBQUEsRUFBWSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsS0FBQyxDQUFBLE1BQXBCLEVBQTRCLEtBQTVCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBNUJaO1FBNkJBLFdBQUEsRUFBYSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBQyxDQUFBLE1BQWxCLEVBQTBCLEtBQTFCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBN0JiO1FBOEJBLFNBQUEsRUFBVyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxLQUFDLENBQUEsTUFBaEIsRUFBd0IsS0FBeEI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E5Qlg7UUErQkEsV0FBQSxFQUFhLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsUUFBUixDQUFpQixLQUFDLENBQUEsTUFBbEIsRUFBMEIsS0FBMUI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0EvQmI7UUFnQ0EsWUFBQSxFQUFjLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsU0FBUixDQUFrQixLQUFDLENBQUEsTUFBbkIsRUFBMkIsS0FBM0I7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoQ2Q7UUFpQ0EsbUJBQUEsRUFBcUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxjQUFSLENBQXVCLEtBQUMsQ0FBQSxNQUF4QixFQUFnQyxLQUFoQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWpDckI7UUFrQ0EseUJBQUEsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxtQkFBUixDQUE0QixLQUFDLENBQUEsTUFBN0IsRUFBcUMsS0FBckM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FsQzNCO1FBbUNBLHFCQUFBLEVBQXVCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsZUFBUixDQUF3QixLQUFDLENBQUEsTUFBekIsRUFBaUMsS0FBakM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FuQ3ZCO1FBb0NBLDJCQUFBLEVBQTZCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsb0JBQVIsQ0FBNkIsS0FBQyxDQUFBLE1BQTlCLEVBQXNDLEtBQXRDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBcEM3QjtRQXFDQSx1QkFBQSxFQUF5QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLGtCQUFSLENBQTJCLEtBQUMsQ0FBQSxNQUE1QixFQUFvQyxLQUFwQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXJDekI7UUFzQ0EsNkJBQUEsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyx1QkFBUixDQUFnQyxLQUFDLENBQUEsTUFBakMsRUFBeUMsS0FBekM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F0Qy9CO1FBdUNBLHdCQUFBLEVBQTBCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsS0FBQyxDQUFBLE1BQTdCLEVBQXFDLEtBQXJDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdkMxQjtRQXdDQSx1QkFBQSxFQUF5QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLGtCQUFSLENBQTJCLEtBQUMsQ0FBQSxNQUE1QixFQUFvQyxLQUFwQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXhDekI7UUF5Q0EsMkJBQUEsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxzQkFBUixDQUErQixLQUFDLENBQUEsTUFBaEMsRUFBd0MsS0FBeEM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F6QzdCO1FBMENBLDRCQUFBLEVBQThCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsdUJBQVIsQ0FBZ0MsS0FBQyxDQUFBLE1BQWpDLEVBQXlDLEtBQXpDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBMUM5QjtRQTJDQSxpQ0FBQSxFQUFtQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLDBCQUFSLENBQW1DLEtBQUMsQ0FBQSxNQUFwQyxFQUE0QyxLQUE1QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTNDbkM7UUE0Q0EsMENBQUEsRUFBNEMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxpQ0FBUixDQUEwQyxLQUFDLENBQUEsTUFBM0MsRUFBbUQsS0FBbkQ7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E1QzVDO1FBNkNBLGdDQUFBLEVBQWtDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMseUJBQVIsQ0FBa0MsS0FBQyxDQUFBLE1BQW5DLEVBQTJDLEtBQTNDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBN0NsQztRQThDQSxrREFBQSxFQUFvRCxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLHdDQUFSLENBQWlELEtBQUMsQ0FBQSxNQUFsRCxFQUEwRCxLQUExRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTlDcEQ7UUErQ0EsMkJBQUEsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFPLEtBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQS9DN0I7UUFnREEsb0NBQUEsRUFBc0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyw0QkFBUixDQUFxQyxLQUFDLENBQUEsTUFBdEMsRUFBOEMsS0FBOUM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoRHRDO1FBaURBLHNDQUFBLEVBQXdDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsOEJBQVIsQ0FBdUMsS0FBQyxDQUFBLE1BQXhDLEVBQWdELEtBQWhEO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBakR4QztRQWtEQSx1QkFBQSxFQUF5QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLGlCQUFSLENBQTBCLEtBQUMsQ0FBQSxNQUEzQixFQUFtQyxLQUFuQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWxEekI7UUFtREEsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLGtCQUFSLENBQTJCLEtBQUMsQ0FBQSxNQUE1QixFQUFvQyxLQUFwQztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQW5EaEI7UUFvREEsdUJBQUEsRUFBeUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxpQkFBUixDQUEwQixLQUFDLENBQUEsYUFBM0IsRUFBMEMsS0FBMUM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FwRHpCO1FBcURBLDBCQUFBLEVBQTRCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsb0JBQVIsQ0FBNkIsS0FBQyxDQUFBLGFBQTlCLEVBQTZDLEtBQTdDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBckQ1QjtRQXNEQSwwQkFBQSxFQUE0QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLG9CQUFSLENBQTZCLEtBQUMsQ0FBQSxhQUE5QixFQUE2QyxLQUE3QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXRENUI7UUF1REEsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxNQUFNLENBQUMsVUFBUCxDQUFrQixLQUFDLENBQUEsYUFBbkI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F2RGY7UUF3REEsV0FBQSxFQUFhLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxNQUFNLENBQUMsUUFBUCxDQUFnQixLQUFDLENBQUEsYUFBakI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F4RGI7UUF5REEsc0JBQUEsRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFDLENBQUEsYUFBMUI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F6RHhCO1FBMERBLDRCQUFBLEVBQThCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBQyxDQUFBLGFBQTFCLEVBQXlDO2NBQUMsV0FBQSxFQUFhLElBQWQ7YUFBekM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0ExRDlCO1FBMkRBLHlCQUFBLEVBQTJCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsS0FBQyxDQUFBLGFBQTdCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBM0QzQjtRQTREQSwrQkFBQSxFQUFpQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQUMsQ0FBQSxhQUE3QixFQUE0QztjQUFDLFdBQUEsRUFBYSxJQUFkO2FBQTVDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBNURqQztRQTZEQSx5QkFBQSxFQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQUMsQ0FBQSxhQUE3QjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTdEM0I7UUE4REEsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixLQUFDLENBQUEsYUFBN0IsRUFBNEM7Y0FBQyxXQUFBLEVBQWEsSUFBZDthQUE1QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTlEakM7UUErREEsdUJBQUEsRUFBeUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyxzQkFBUixDQUErQixLQUFDLENBQUEsYUFBaEMsRUFBK0MsS0FBL0M7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0EvRHpCO1FBZ0VBLHVCQUFBLEVBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxPQUFPLENBQUMsc0JBQVIsQ0FBK0IsS0FBQyxDQUFBLGFBQWhDLEVBQStDLEtBQS9DO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBaEV6QjtRQWlFQSx5QkFBQSxFQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsT0FBTyxDQUFDLHdCQUFSLENBQWlDLEtBQUMsQ0FBQSxhQUFsQyxFQUFpRCxLQUFqRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWpFM0I7UUFrRUEseUJBQUEsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLE9BQU8sQ0FBQyx3QkFBUixDQUFpQyxLQUFDLENBQUEsYUFBbEMsRUFBaUQsS0FBakQ7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FsRTNCO1FBbUVBLHVCQUFBLEVBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxNQUFNLENBQUMsa0JBQVAsQ0FBMEIsS0FBQyxDQUFBLGFBQTNCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBbkV6QjtRQW9FQSx3QkFBQSxFQUEwQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsTUFBTSxDQUFDLG1CQUFQLENBQTJCLEtBQUMsQ0FBQSxhQUE1QjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXBFMUI7UUFxRUEsb0JBQUEsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxnQkFBWixDQUE2QixLQUFDLENBQUEsTUFBOUI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FyRXRCO1FBc0VBLDBCQUFBLEVBQTRCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMscUJBQVosQ0FBa0MsS0FBQyxDQUFBLE1BQW5DO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdEU1QjtRQXVFQSw2QkFBQSxFQUErQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLGtCQUFaLENBQStCLEtBQUMsQ0FBQSxNQUFoQyxFQUF3QyxHQUF4QyxFQUE2QyxLQUE3QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXZFL0I7UUF3RUEsNkJBQUEsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxrQkFBWixDQUErQixLQUFDLENBQUEsTUFBaEMsRUFBd0MsSUFBeEMsRUFBOEMsS0FBOUM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F4RS9CO1FBeUVBLDBCQUFBLEVBQTRCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsa0JBQVosQ0FBK0IsS0FBQyxDQUFBLE1BQWhDLEVBQXdDLEdBQXhDLEVBQTZDLEtBQTdDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBekU1QjtRQTBFQSw4QkFBQSxFQUFnQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLG9CQUFaLENBQWlDLEtBQUMsQ0FBQSxNQUFsQyxFQUEwQyxHQUExQyxFQUErQyxHQUEvQyxFQUFvRCxLQUFwRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTFFaEM7UUEyRUEsOEJBQUEsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxvQkFBWixDQUFpQyxLQUFDLENBQUEsTUFBbEMsRUFBMEMsR0FBMUMsRUFBK0MsR0FBL0MsRUFBb0QsS0FBcEQ7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0EzRWhDO1FBNEVBLG9CQUFBLEVBQXNCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsb0JBQVosQ0FBaUMsS0FBQyxDQUFBLE1BQWxDLEVBQTBDLEdBQTFDLEVBQStDLEdBQS9DLEVBQW9ELEtBQXBEO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBNUV0QjtRQTZFQSwrQkFBQSxFQUFpQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLG9CQUFaLENBQWlDLEtBQUMsQ0FBQSxNQUFsQyxFQUEwQyxHQUExQyxFQUErQyxHQUEvQyxFQUFvRCxLQUFwRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTdFakM7UUE4RUEsMkJBQUEsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxvQkFBWixDQUFpQyxLQUFDLENBQUEsTUFBbEMsRUFBMEMsR0FBMUMsRUFBK0MsR0FBL0MsRUFBb0QsS0FBcEQ7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E5RTdCO1FBK0VBLHlCQUFBLEVBQTJCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMscUJBQVosQ0FBa0MsS0FBQyxDQUFBLE1BQW5DLEVBQTJDLEtBQTNDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBL0UzQjtRQWdGQSxlQUFBLEVBQWlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsV0FBWixDQUF3QixLQUFDLENBQUEsTUFBekI7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoRmpCO1FBaUZBLHFCQUFBLEVBQXVCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsZ0JBQVosQ0FBNkIsS0FBQyxDQUFBLE1BQTlCO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBakZ2QjtRQWtGQSw2QkFBQSxFQUErQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLGtCQUFaLENBQStCLEtBQUMsQ0FBQSxNQUFoQyxFQUF3QyxHQUF4QyxFQUE2QyxJQUE3QztVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWxGL0I7UUFtRkEsNkJBQUEsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxrQkFBWixDQUErQixLQUFDLENBQUEsTUFBaEMsRUFBd0MsSUFBeEMsRUFBOEMsSUFBOUM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FuRi9CO1FBb0ZBLDBCQUFBLEVBQTRCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsa0JBQVosQ0FBK0IsS0FBQyxDQUFBLE1BQWhDLEVBQXdDLEdBQXhDLEVBQTZDLElBQTdDO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBcEY1QjtRQXFGQSw4QkFBQSxFQUFnQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLG9CQUFaLENBQWlDLEtBQUMsQ0FBQSxNQUFsQyxFQUEwQyxHQUExQyxFQUErQyxHQUEvQyxFQUFvRCxJQUFwRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXJGaEM7UUFzRkEsOEJBQUEsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxvQkFBWixDQUFpQyxLQUFDLENBQUEsTUFBbEMsRUFBMEMsR0FBMUMsRUFBK0MsR0FBL0MsRUFBb0QsSUFBcEQ7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F0RmhDO1FBdUZBLCtCQUFBLEVBQWlDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQU8sSUFBQSxXQUFXLENBQUMsb0JBQVosQ0FBaUMsS0FBQyxDQUFBLE1BQWxDLEVBQTBDLEdBQTFDLEVBQStDLEdBQS9DLEVBQW9ELElBQXBEO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdkZqQztRQXdGQSwyQkFBQSxFQUE2QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFPLElBQUEsV0FBVyxDQUFDLG9CQUFaLENBQWlDLEtBQUMsQ0FBQSxNQUFsQyxFQUEwQyxHQUExQyxFQUErQyxHQUEvQyxFQUFvRCxJQUFwRDtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXhGN0I7UUF5RkEseUJBQUEsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBTyxJQUFBLFdBQVcsQ0FBQyxnQkFBWixDQUE2QixLQUFDLENBQUEsTUFBOUIsRUFBc0MsSUFBdEM7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F6RjNCO1FBMEZBLGlCQUFBLEVBQW1CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBTyxLQUFDLENBQUEsY0FBRCxDQUFnQixDQUFoQjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTFGbkI7UUEyRkEsUUFBQSxFQUFVLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBVyxJQUFBLFNBQVMsQ0FBQyxNQUFWLENBQWlCLEtBQUMsQ0FBQSxNQUFsQixFQUEwQixLQUExQjtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTNGVjtRQTRGQSxlQUFBLEVBQWlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBVyxJQUFBLE9BQU8sQ0FBQyxZQUFSLENBQXFCLEtBQUMsQ0FBQSxNQUF0QixFQUE4QixLQUE5QjtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTVGakI7UUE2RkEseUJBQUEsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFXLElBQUEsT0FBTyxDQUFDLFlBQVIsQ0FBcUIsS0FBQyxDQUFBLE1BQXRCLEVBQThCLEtBQTlCLENBQW1DLENBQUMsUUFBcEMsQ0FBQTtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTdGM0I7UUE4RkEsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMsVUFBUixDQUFtQixLQUFDLENBQUEsTUFBcEIsRUFBNEIsS0FBNUI7VUFBWDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E5RmhCO1FBK0ZBLHNCQUFBLEVBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBVyxJQUFBLE9BQU8sQ0FBQyxVQUFSLENBQW1CLEtBQUMsQ0FBQSxNQUFwQixFQUE0QixLQUE1QixFQUFrQyxLQUFsQztVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQS9GeEI7UUFnR0EsTUFBQSxFQUFRLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBVyxJQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsS0FBQyxDQUFBLE1BQWhCLEVBQXdCLEtBQXhCO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBaEdSO1FBaUdBLE1BQUEsRUFBUSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMsSUFBUixDQUFhLEtBQUMsQ0FBQSxNQUFkLEVBQXNCLEtBQXRCO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBakdSO1FBa0dBLGdCQUFBLEVBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBVyxJQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsS0FBQyxDQUFBLE1BQWQsRUFBc0IsS0FBdEIsQ0FBMkIsQ0FBQyxPQUE1QixDQUFBO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBbEdsQjtRQW1HQSxNQUFBLEVBQVEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFXLElBQUEsT0FBTyxDQUFDLElBQVIsQ0FBYSxLQUFDLENBQUEsTUFBZCxFQUFzQixLQUF0QjtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQW5HUjtRQW9HQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMsSUFBUixDQUFhLEtBQUMsQ0FBQSxNQUFkLEVBQXNCLEtBQXRCLENBQTJCLENBQUMsT0FBNUIsQ0FBQTtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXBHbEI7UUFxR0EsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDtZQUFPLElBQThFLEtBQUMsQ0FBQSxjQUFjLENBQUMsV0FBOUY7cUJBQUksSUFBQSxLQUFDLENBQUEsY0FBYyxDQUFDLFdBQVcsQ0FBQyxXQUE1QixDQUF3QyxLQUFDLENBQUEsTUFBekMsRUFBaUQsS0FBakQsRUFBdUQ7Z0JBQUEsUUFBQSxFQUFVLElBQVY7ZUFBdkQsRUFBSjs7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FyR2Y7UUFzR0EscUJBQUEsRUFBdUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO1lBQU8sSUFBNkYsS0FBQyxDQUFBLGNBQWMsQ0FBQyxXQUE3RztxQkFBSSxJQUFBLEtBQUMsQ0FBQSxjQUFjLENBQUMsV0FBVyxDQUFDLFdBQTVCLENBQXdDLEtBQUMsQ0FBQSxNQUF6QyxFQUFpRCxLQUFqRCxFQUF1RDtnQkFBQSxRQUFBLEVBQVUsSUFBVjtnQkFBZ0IsT0FBQSxFQUFTLElBQXpCO2VBQXZELEVBQUo7O1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdEd2QjtRQXVHQSxTQUFBLEVBQVcsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFXLElBQUEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsS0FBQyxDQUFBLE1BQW5CLEVBQTJCLEtBQTNCO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdkdYO1FBd0dBLFFBQUEsRUFBVSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMsTUFBUixDQUFlLEtBQUMsQ0FBQSxNQUFoQixFQUF3QixLQUF4QjtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXhHVjtRQXlHQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQU8sQ0FBSyxJQUFBLE9BQU8sQ0FBQyxNQUFSLENBQWUsS0FBQyxDQUFBLE1BQWhCLEVBQXdCLEtBQXhCLENBQUwsQ0FBbUMsQ0FBQyxRQUFwQyxDQUFBO1VBQVA7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBekdsQjtRQTBHQSxxQkFBQSxFQUF1QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMsaUJBQVIsQ0FBMEIsS0FBQyxDQUFBLE1BQTNCLEVBQW1DLEtBQW5DO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBMUd2QjtRQTJHQSx5QkFBQSxFQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQVcsSUFBQSxPQUFPLENBQUMscUJBQVIsQ0FBOEIsS0FBQyxDQUFBLE1BQS9CLEVBQXVDLEtBQXZDO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBM0czQjtRQTRHQSw2QkFBQSxFQUErQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLENBQUQ7bUJBQU8sQ0FBSyxJQUFBLE9BQU8sQ0FBQyxpQkFBUixDQUEwQixLQUFDLENBQUEsTUFBM0IsRUFBbUMsS0FBbkMsQ0FBTCxDQUE4QyxDQUFDLFFBQS9DLENBQUE7VUFBUDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0E1Ry9CO09BREY7SUFmZTs7dUJBbUlqQixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7QUFDaEIsVUFBQTtBQUFBO1dBQUEsdUJBQUE7O3FCQUNLLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsRUFBRDttQkFDRCxLQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLEtBQUMsQ0FBQSxhQUFuQixFQUFrQyxXQUFBLEdBQVksV0FBOUMsRUFBNkQsRUFBN0QsQ0FBbkI7VUFEQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBSCxDQUFJLEVBQUo7QUFERjs7SUFEZ0I7O3VCQVVsQix5QkFBQSxHQUEyQixTQUFDLGlCQUFEO0FBQ3pCLFVBQUE7TUFBQSxRQUFBLEdBQVc7WUFFTixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsV0FBRDtpQkFDRCxRQUFTLENBQUEsV0FBQSxDQUFULEdBQXdCLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsY0FBRCxDQUFnQixXQUFBLENBQVksS0FBWixDQUFoQjtVQUFYO1FBRHZCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtBQURMLFdBQUEsZ0NBQUE7O1lBQ007QUFETjthQUdBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixRQUFsQjtJQUx5Qjs7dUJBUzNCLGNBQUEsR0FBZ0IsU0FBQyxVQUFEO0FBQ2QsVUFBQTtNQUFBLElBQWMsa0JBQWQ7QUFBQSxlQUFBOztNQUNBLElBQUEsQ0FBaUMsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxVQUFWLENBQWpDO1FBQUEsVUFBQSxHQUFhLENBQUMsVUFBRCxFQUFiOztBQUVBO1dBQUEsNENBQUE7O1FBRUUsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVQsSUFBc0IsQ0FBQyxTQUFBLFlBQXFCLE9BQU8sQ0FBQyxNQUE3QixJQUF1QyxTQUFBLFlBQXFCLFdBQVcsQ0FBQyxVQUF6RSxDQUF6QjtVQUNFLFNBQVMsQ0FBQyxPQUFWLEdBQW9CLFNBQVMsQ0FBQyxPQURoQzs7UUFLQSxJQUFHLHVDQUFBLElBQStCLDhCQUEvQixJQUF5RCxDQUFJLEtBQUssQ0FBQyxjQUFOLENBQXFCLFNBQXJCLENBQWhFO1VBQ0UsSUFBQyxDQUFBLGVBQUQsQ0FBQTtVQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkO0FBQ0EsZ0JBSEY7O1FBS0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsU0FBZDtRQUlBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFULElBQXNCLFNBQUEsWUFBcUIsU0FBUyxDQUFDLFFBQXhEO1VBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWtCLElBQUEsT0FBTyxDQUFDLGdCQUFSLENBQXlCLElBQUMsQ0FBQSxNQUExQixFQUFrQyxJQUFsQyxDQUFsQixFQURGOztxQkFHQSxJQUFDLENBQUEsY0FBRCxDQUFBO0FBbkJGOztJQUpjOzt1QkF5QmhCLGtCQUFBLEdBQW9CLFNBQUMsRUFBRDthQUNsQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxtQkFBWixFQUFpQyxFQUFqQztJQURrQjs7dUJBR3BCLFlBQUEsR0FBYyxTQUFDLEVBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLEVBQTNCO0lBRFk7O3VCQU1kLFlBQUEsR0FBYyxTQUFBO2FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztJQURDOzt1QkFHZCxJQUFBLEdBQU0sU0FBQTtNQUNKLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFBO2FBQ0EsSUFBQyxDQUFBLGtCQUFELENBQUE7SUFGSTs7dUJBT04sY0FBQSxHQUFnQixTQUFBO0FBQ2QsVUFBQTtNQUFBLElBQUEsQ0FBQSxDQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQixDQUF6QixDQUFBO0FBQ0UsZUFERjs7TUFHQSxJQUFBLENBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsVUFBaEIsQ0FBQSxDQUFQO1FBQ0UsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVQsSUFBc0IsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFBLFlBQTJCLFNBQVMsQ0FBQyxRQUE5RDtVQUNFLElBQUMsQ0FBQSwyQkFBRCxDQUFBLEVBREY7O0FBRUEsZUFIRjs7TUFLQSxlQUFBLEdBQWtCLElBQUMsQ0FBQSxPQUFPLENBQUMsR0FBVCxDQUFBO01BQ2xCLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFaO0FBQ0U7VUFDRSxJQUFDLENBQUEsWUFBRCxDQUFBLENBQWUsQ0FBQyxPQUFoQixDQUF3QixlQUF4QjtpQkFDQSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBRkY7U0FBQSxhQUFBO1VBR007VUFDSixJQUFHLENBQUMsQ0FBQSxZQUFhLFNBQVMsQ0FBQyxhQUF4QixDQUFBLElBQTBDLENBQUMsQ0FBQSxZQUFhLE9BQU8sQ0FBQyxXQUF0QixDQUE3QzttQkFDRSxJQUFDLENBQUEsZUFBRCxDQUFBLEVBREY7V0FBQSxNQUFBO0FBR0Usa0JBQU0sRUFIUjtXQUpGO1NBREY7T0FBQSxNQUFBO1FBVUUsSUFBcUMsZUFBZSxDQUFDLFlBQWhCLENBQUEsQ0FBckM7VUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBaUIsZUFBakIsRUFBQTs7ZUFDQSxlQUFlLENBQUMsT0FBaEIsQ0FBQSxFQVhGOztJQVZjOzt1QkEwQmhCLFlBQUEsR0FBYyxTQUFBO2FBQ1osQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsT0FBUjtJQURZOzt1QkFTZCxXQUFBLEdBQWEsU0FBQyxJQUFEO0FBQ1gsVUFBQTtNQUFBLElBQUcsSUFBQSxLQUFRLEdBQVg7UUFDRSxJQUFBLEdBQU8sUUFBUSxDQUFDLGVBQVQsQ0FBQSxFQURUOztNQUVBLElBQUcsSUFBQSxLQUFTLEdBQVQsSUFBQSxJQUFBLEtBQWMsR0FBakI7UUFDRSxJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQUE7UUFDUCxJQUFBLEdBQU8sS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFmO2VBQ1A7VUFBQyxNQUFBLElBQUQ7VUFBTyxNQUFBLElBQVA7VUFIRjtPQUFBLE1BSUssSUFBRyxJQUFBLEtBQVEsR0FBWDtRQUNILElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBQTtRQUNQLElBQUEsR0FBTyxLQUFLLENBQUMsUUFBTixDQUFlLElBQWY7ZUFDUDtVQUFDLE1BQUEsSUFBRDtVQUFPLE1BQUEsSUFBUDtVQUhHO09BQUEsTUFJQSxJQUFHLElBQUEsS0FBUSxHQUFYO1FBQ0gsSUFBQSxHQUFPO1FBQ1AsSUFBQSxHQUFPLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZjtlQUNQO1VBQUMsTUFBQSxJQUFEO1VBQU8sTUFBQSxJQUFQO1VBSEc7T0FBQSxNQUFBO2VBS0gsSUFBQyxDQUFBLGNBQWMsQ0FBQyxTQUFVLENBQUEsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEVBTHZCOztJQVhNOzt1QkF3QmIsT0FBQSxHQUFTLFNBQUMsSUFBRDtNQUNQLElBQUcsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQVY7ZUFDRSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBSyxDQUFDLGNBQWIsQ0FBQSxDQUE2QixDQUFDLE1BRGhDO09BQUEsTUFBQTtlQUdFLE9BSEY7O0lBRE87O3VCQVlULFdBQUEsR0FBYSxTQUFDLElBQUQsRUFBTyxLQUFQO01BQ1gsSUFBRyxJQUFBLEtBQVEsR0FBWDtRQUNFLElBQUEsR0FBTyxRQUFRLENBQUMsZUFBVCxDQUFBLEVBRFQ7O01BRUEsSUFBRyxJQUFBLEtBQVMsR0FBVCxJQUFBLElBQUEsS0FBYyxHQUFqQjtlQUNFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixLQUFLLENBQUMsSUFBM0IsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFBLEtBQVEsR0FBWDtBQUFBO09BQUEsTUFFQSxJQUFHLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixDQUFIO2VBQ0gsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFoQixFQUFvQyxLQUFwQyxFQURHO09BQUEsTUFBQTtlQUdILElBQUMsQ0FBQSxjQUFjLENBQUMsU0FBVSxDQUFBLElBQUEsQ0FBMUIsR0FBa0MsTUFIL0I7O0lBUE07O3VCQWViLGNBQUEsR0FBZ0IsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUNkLFVBQUE7TUFBQSxRQUFBLDhEQUFxQyxDQUFBLElBQUEsUUFBQSxDQUFBLElBQUEsSUFDbkM7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLElBQUEsRUFBTSxFQUROOztNQUVGLElBQUcsUUFBUSxDQUFDLElBQVQsS0FBaUIsVUFBakIsSUFBZ0MsS0FBSyxDQUFDLElBQU4sS0FBZ0IsVUFBbkQ7ZUFDRSxRQUFRLENBQUMsSUFBVCxJQUFpQixLQUFLLENBQUMsSUFBTixHQUFhLEtBRGhDO09BQUEsTUFFSyxJQUFHLFFBQVEsQ0FBQyxJQUFULEtBQW1CLFVBQW5CLElBQWtDLEtBQUssQ0FBQyxJQUFOLEtBQWMsVUFBbkQ7UUFDSCxRQUFRLENBQUMsSUFBVCxJQUFpQixJQUFBLEdBQU8sS0FBSyxDQUFDO2VBQzlCLFFBQVEsQ0FBQyxJQUFULEdBQWdCLFdBRmI7T0FBQSxNQUFBO2VBSUgsUUFBUSxDQUFDLElBQVQsSUFBaUIsS0FBSyxDQUFDLEtBSnBCOztJQU5TOzt1QkFrQmhCLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVAsVUFBQTtNQUFBLElBQUcsQ0FBQyxRQUFBLEdBQVcsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBWixDQUFBLElBQW1DLEVBQW5DLElBQTBDLFFBQUEsSUFBWSxHQUF6RDtRQUNFLE1BQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBNEIsSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLEdBQVgsQ0FBNUIsRUFBNkM7VUFBQyxVQUFBLEVBQVksT0FBYjtVQUFzQixVQUFBLEVBQVksS0FBbEM7U0FBN0M7ZUFDVCxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLE9BRmpCOztJQUZPOzt1QkFXVCxpQkFBQSxHQUFtQixTQUFDLE1BQUQ7YUFDakIsSUFBQyxDQUFBLGNBQWMsQ0FBQyxhQUFhLENBQUMsT0FBOUIsQ0FBc0MsTUFBdEM7SUFEaUI7O3VCQVFuQixvQkFBQSxHQUFzQixTQUFDLEtBQUQ7O1FBQUMsUUFBUTs7YUFDN0IsSUFBQyxDQUFBLGNBQWMsQ0FBQyxhQUFjLENBQUEsS0FBQTtJQURWOzt1QkFVdEIsa0JBQUEsR0FBb0IsU0FBQTtBQUNsQixVQUFBO01BQUEsSUFBQyxDQUFBLG9CQUFELENBQUE7TUFDQSxJQUFDLENBQUEsb0JBQUQsQ0FBQTtNQUVBLElBQUMsQ0FBQSxJQUFELEdBQVE7TUFDUixJQUFDLENBQUEsT0FBRCxHQUFXO01BRVgsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsYUFBakI7TUFFQSxJQUFDLENBQUEsWUFBRCxDQUFBO0FBQ0E7QUFBQSxXQUFBLHNDQUFBOztRQUFBLFNBQVMsQ0FBQyxLQUFWLENBQWdCO1VBQUEsVUFBQSxFQUFZLEtBQVo7U0FBaEI7QUFBQTtNQUNBLElBQUMsQ0FBQSx1QkFBRCxDQUFBO2FBRUEsSUFBQyxDQUFBLGVBQUQsQ0FBQTtJQWJrQjs7dUJBZ0JwQixtQkFBQSxHQUFxQixTQUFBO01BQ25CLElBQUksQ0FBQyxTQUFMLENBQWUsa0NBQWY7YUFDQSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQUZtQjs7dUJBT3JCLGtCQUFBLEdBQW9CLFNBQUMsT0FBRDs7UUFBQyxVQUFVOztNQUM3QixJQUFDLENBQUEsSUFBRCxHQUFRO01BQ1IsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsZUFBekIsQ0FBeUMsSUFBekM7TUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsZUFBRCxDQUFpQixhQUFqQjthQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7SUFOa0I7O3VCQVFwQixtQkFBQSxHQUFxQixTQUFBO01BQ25CLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFwQjtNQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQjtNQUN0QixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUF6QixDQUE2QixjQUE3QjtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsbUJBQUQsR0FBdUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixJQUFDLENBQUEsd0JBQTFCLENBQTFDO2FBQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSx1QkFBRCxHQUEyQixJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsSUFBQyxDQUFBLHNCQUF6QixDQUE5QztJQUxtQjs7dUJBT3JCLHdCQUFBLEdBQTBCLFNBQUMsS0FBRDtBQUN4QixVQUFBO01BQUEsS0FBQSxzQ0FBa0IsQ0FBRSxLQUFaLENBQWtCLEVBQWxCLFdBQUEsSUFBeUI7TUFDakMsVUFBQSxHQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBO0FBQ2IsV0FBQSx1Q0FBQTs7UUFDRSxJQUFZLElBQUEsS0FBUSxJQUFwQjtBQUFBLG1CQUFBOztBQUNBLGFBQUEsOENBQUE7O1VBQ0UsSUFBQSxDQUEwQixTQUFTLENBQUMsTUFBTSxDQUFDLGFBQWpCLENBQUEsQ0FBMUI7WUFBQSxTQUFTLEVBQUMsTUFBRCxFQUFULENBQUEsRUFBQTs7QUFERjtBQUZGO0lBSHdCOzt1QkFTMUIsc0JBQUEsR0FBd0IsU0FBQyxLQUFEO2FBQ3RCLElBQUMsQ0FBQSxrQkFBRDtJQURzQjs7dUJBR3hCLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQUcsSUFBQyxDQUFBLGtCQUFELEdBQXNCLENBQXpCO1FBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQUE7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBQTtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFBO2VBQ0EsSUFBQyxDQUFBLGtCQUFELEdBSkY7O0lBRGU7O3VCQU9qQixzQkFBQSxHQUF3QixTQUFBO01BQ3RCLElBQXlELGdDQUF6RDtlQUFBLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsRUFBdkI7O0lBRHNCOzt1QkFHeEIsb0JBQUEsR0FBc0IsU0FBQTtBQUNwQixVQUFBO01BQUEsWUFBYyxJQUFDLENBQUEsS0FBRCxLQUFVLElBQVYsSUFBQSxJQUFBLEtBQWdCLFFBQTlCO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxlQUF6QixDQUF5QyxLQUF6QztNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQWdDLGNBQWhDO01BQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQywyQkFBUixDQUFvQyxJQUFDLENBQUEsbUJBQXJDO01BQ0EsT0FBQSxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLHlCQUFmLENBQXlDLElBQUMsQ0FBQSxtQkFBMUM7TUFDVixJQUFBLEdBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBeEI7TUFDUCxJQUFDLENBQUEsbUJBQUQsR0FBdUI7TUFDdkIsSUFBRyxZQUFIO1FBQ0UsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsT0FBcEIsRUFERjs7QUFFQTtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBQSxDQUF5QixNQUFNLENBQUMsbUJBQVAsQ0FBQSxDQUF6QjtVQUFBLE1BQU0sQ0FBQyxRQUFQLENBQUEsRUFBQTs7QUFERjtNQUVBLElBQUcsZ0NBQUg7UUFDRSxJQUFDLENBQUEsbUJBQW1CLENBQUMsT0FBckIsQ0FBQTtRQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixDQUFzQixJQUFDLENBQUEsbUJBQXZCO1FBQ0EsSUFBQyxDQUFBLG1CQUFELEdBQXVCO1FBQ3ZCLElBQUMsQ0FBQSx1QkFBdUIsQ0FBQyxPQUF6QixDQUFBO1FBQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLENBQXNCLElBQUMsQ0FBQSx1QkFBdkI7ZUFDQSxJQUFDLENBQUEsdUJBQUQsR0FBMkIsS0FON0I7O0lBWm9COzt1QkFvQnRCLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLElBQWMsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUF2QjtBQUFBLGVBQUE7O0FBQ0E7QUFBQTtXQUFBLHNDQUFBOztRQUNFLElBQUEsQ0FBbUMsQ0FBQyxTQUFTLENBQUMsT0FBVixDQUFBLENBQUEsSUFBdUIsU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUF4QixDQUFuQzt1QkFBQSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQWpCLENBQUEsR0FBQTtTQUFBLE1BQUE7K0JBQUE7O0FBREY7O0lBRm9COzt1QkFRdEIsYUFBQSxHQUFlLFNBQUMsSUFBRDtBQUNiLFVBQUE7TUFBQSxJQUFtQixZQUFuQjtBQUFBLGVBQU8sS0FBUDs7TUFDQSwrQ0FBZSxJQUFJLENBQUMsd0JBQXBCO0FBQUEsZUFBTyxLQUFQOztNQUNBLDBGQUFpRCxDQUFFLGlDQUFuRDtBQUFBLGVBQU8sSUFBSSxDQUFDLGVBQVo7O0lBSGE7O3VCQVVmLGtCQUFBLEdBQW9CLFNBQUMsSUFBRDtBQU1sQixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7UUFDRSxJQUFHLElBQUMsQ0FBQSxPQUFELEtBQVksSUFBZjtVQUNFLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0FBQ0EsaUJBRkY7O1FBSUEsSUFBQyxDQUFBLE9BQUQsR0FBVztRQUNYLElBQUcsSUFBQyxDQUFBLE9BQUQsS0FBWSxVQUFmO0FBQ0U7QUFBQSxlQUFBLHNDQUFBOztZQUlFLGFBQUEsR0FBZ0IsU0FBUyxDQUFDLGNBQVYsQ0FBQTtZQUNoQixTQUFTLENBQUMsTUFBTSxDQUFDLGFBQWpCLENBQStCO2NBQUMsZUFBQSxhQUFEO2FBQS9CO1lBQ0EsT0FBZSxTQUFTLENBQUMsaUJBQVYsQ0FBQSxDQUFmLEVBQUMsZUFBRCxFQUFRO0FBQ1IsaUJBQXFDLHdHQUFyQztjQUFBLFNBQVMsQ0FBQyxVQUFWLENBQXFCLEdBQXJCO0FBQUE7QUFQRixXQURGO1NBQUEsTUFVSyxZQUFHLElBQUMsQ0FBQSxRQUFELEtBQWEsZUFBYixJQUFBLElBQUEsS0FBOEIsV0FBakM7QUFJSDtBQUFBLGVBQUEsd0NBQUE7O1lBQ0csZ0JBQWlCLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBakIsQ0FBQTtZQUNsQixJQUFHLGFBQUg7Y0FDRSxPQUFxQixTQUFTLENBQUMsaUJBQVYsQ0FBQSxDQUFyQixFQUFDLGtCQUFELEVBQVc7Y0FDWCxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQXBCLEdBQTBCO2NBQzFCLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBbEIsR0FBMEI7Y0FDMUIsU0FBUyxDQUFDLGNBQVYsQ0FBeUIsYUFBekIsRUFKRjs7QUFGRixXQUpHO1NBaEJQO09BQUEsTUFBQTtRQTRCRSxJQUFDLENBQUEsb0JBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsT0FBRCxHQUFXO1FBQ1gsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsYUFBakI7UUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELEtBQVksVUFBZjtVQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsNEJBQVIsQ0FBQSxFQURGO1NBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUFBLENBQUEsS0FBNkIsRUFBaEM7VUFDSCxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBQSxFQURHO1NBbkNQOzthQXNDQSxJQUFDLENBQUEsZUFBRCxDQUFBO0lBNUNrQjs7dUJBK0NwQixlQUFBLEdBQWlCLFNBQUE7YUFDZixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBQyxDQUFBLE9BQXJCO0lBRGU7O3VCQUlqQiwyQkFBQSxHQUE2QixTQUFBO01BQzNCLElBQUMsQ0FBQSxvQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsZUFBRCxDQUFpQix1QkFBakI7YUFFQSxJQUFDLENBQUEsZUFBRCxDQUFBO0lBTjJCOzt1QkFRN0IsZUFBQSxHQUFpQixTQUFDLFVBQUQ7QUFDZixVQUFBO0FBQUE7QUFBQTtXQUFBLHNDQUFBOztRQUNFLElBQUcsSUFBQSxLQUFRLFVBQVg7dUJBQ0UsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBekIsQ0FBNkIsSUFBN0IsR0FERjtTQUFBLE1BQUE7dUJBR0UsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBekIsQ0FBZ0MsSUFBaEMsR0FIRjs7QUFERjs7SUFEZTs7dUJBVWpCLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQUMsQ0FBQSxZQUFELENBQUE7TUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBQTthQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBSGU7O3VCQVVqQixjQUFBLEdBQWdCLFNBQUMsQ0FBRDthQUNWLElBQUEsUUFBUSxDQUFDLFFBQVQsQ0FBa0IsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLENBQWxCO0lBRFU7O3VCQVFoQixZQUFBLEdBQWMsU0FBQyxDQUFEO0FBQ1osVUFBQTtNQUFBLGFBQUEsNEZBQWlELENBQUMsQ0FBQztNQUNuRCxJQUFBLEdBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBYixDQUF1QyxhQUF2QztNQUNQLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsUUFBakIsRUFBMkIsQ0FBM0IsQ0FBQSxLQUFpQyxDQUFwQztRQUNFLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFEVDs7YUFFQTtJQUxZOzt1QkFZZCxZQUFBLEdBQWMsU0FBQyxDQUFEO0FBQ1osVUFBQTtNQUFBLGFBQUEsNEZBQWlELENBQUMsQ0FBQztNQUNuRCxHQUFBLEdBQU0sUUFBQSxDQUFTLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQWIsQ0FBdUMsYUFBdkMsQ0FBVDtNQUNOLElBQUcsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFBLFlBQTJCLFFBQVEsQ0FBQyxNQUF2QztlQUNFLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBZSxDQUFDLFFBQWhCLENBQXlCLEdBQXpCLEVBREY7T0FBQSxNQUFBO1FBR0UsSUFBRyxHQUFBLEtBQU8sQ0FBVjtpQkFDRSxDQUFDLENBQUMsZUFBRixDQUFBLEVBREY7U0FBQSxNQUFBO2lCQUdFLElBQUMsQ0FBQSxjQUFELENBQW9CLElBQUEsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsR0FBaEIsQ0FBcEIsRUFIRjtTQUhGOztJQUhZOzt1QkFXZCxpQkFBQSxHQUFtQixTQUFBO0FBQ2pCLFVBQUE7TUFBQSxRQUFBLEdBQVcsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBMEIsQ0FBQyxVQUEzQixDQUFBO0FBQ2Y7QUFBQTtXQUFBLHNDQUFBOztxQkFDRSxTQUFTLENBQUMsY0FBVixDQUF5QixTQUFTLENBQUMsY0FBVixDQUFBLENBQXpCLEVBQXFEO1VBQUMsVUFBQSxRQUFEO1NBQXJEO0FBREY7O0lBRmlCOzt1QkFZbkIsWUFBQSxHQUFjLFNBQUMsQ0FBRDtNQUNaLElBQUcsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFBLFlBQTJCLFFBQVEsQ0FBQyxNQUF2QztRQUNFLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZDtlQUNBLEtBRkY7T0FBQSxNQUFBO2VBSU0sSUFBQSxPQUFPLENBQUMscUJBQVIsQ0FBOEIsSUFBQyxDQUFBLE1BQS9CLEVBQXVDLElBQXZDLEVBSk47O0lBRFk7O3VCQWFkLHVCQUFBLEdBQXlCLFNBQUMsV0FBRDtNQUN2QixJQUFHLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixXQUFuQixDQUFIO2VBQ00sSUFBQSxPQUFPLENBQUMsa0JBQVIsQ0FBMkIsSUFBQyxDQUFBLE1BQTVCLEVBQW9DLElBQXBDLEVBRE47T0FBQSxNQUFBO2VBR00sSUFBQSxXQUFBLENBQVksSUFBQyxDQUFBLE1BQWIsRUFBcUIsSUFBckIsRUFITjs7SUFEdUI7O3VCQVd6QixpQkFBQSxHQUFtQixTQUFDLFdBQUQ7QUFDakIsVUFBQTtNQUFBLElBQUcsbUJBQUg7QUFDRTtBQUFBLGFBQUEsc0NBQUE7O1VBQ0UsSUFBYSxFQUFBLFlBQWMsV0FBM0I7QUFBQSxtQkFBTyxHQUFQOztBQURGO2VBRUEsTUFIRjtPQUFBLE1BQUE7ZUFLRSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0IsRUFMcEI7O0lBRGlCOzt1QkFRbkIsZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLGdCQUFnQixDQUFDLE1BQWxCLENBQXlCLElBQUMsQ0FBQSxJQUExQixFQUFnQyxJQUFDLENBQUEsT0FBakM7SUFEZTs7dUJBUWpCLGNBQUEsR0FBZ0IsU0FBQyxJQUFEO0FBQ2QsVUFBQTtNQUFBLElBQUEsaURBQXlCLENBQUU7TUFDM0IsSUFBNEIsWUFBNUI7ZUFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBbUIsSUFBbkIsRUFBQTs7SUFGYzs7dUJBS2hCLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQWMsbUJBQWQ7QUFBQSxlQUFBOztNQUNBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBdUIsQ0FBQyxLQUF4QixDQUE4QixTQUFDLFNBQUQ7ZUFBZSxTQUFTLENBQUMsT0FBVixDQUFBO01BQWYsQ0FBOUIsQ0FBSDtRQUNFLElBQThCLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBdkM7VUFBQSxJQUFDLENBQUEsdUJBQUQsQ0FBQSxFQUFBOztRQUNBLElBQXlCLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBbEM7aUJBQUEsSUFBQyxDQUFBLGtCQUFELENBQUEsRUFBQTtTQUZGO09BQUEsTUFBQTtRQUlFLElBQXdDLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBakQ7aUJBQUEsSUFBQyxDQUFBLGtCQUFELENBQW9CLGVBQXBCLEVBQUE7U0FKRjs7SUFGZTs7dUJBU2pCLHVCQUFBLEdBQXlCLFNBQUE7QUFDdkIsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRyxhQUFjO1FBQ2YsSUFBRyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQUEsSUFBMkIsQ0FBSSxNQUFNLENBQUMsbUJBQVAsQ0FBQSxDQUFsQztVQUNFLE1BQU0sQ0FBQyxRQUFQLENBQUEsRUFERjs7UUFFQSxNQUFNLENBQUMsVUFBUCxHQUFvQjtBQUp0QjthQU1BLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBO0lBUHVCOzs7OztBQXhwQjNCIiwic291cmNlc0NvbnRlbnQiOlsiR3JpbSAgPSByZXF1aXJlICdncmltJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcbntFbWl0dGVyLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxuT3BlcmF0b3JzID0gcmVxdWlyZSAnLi9vcGVyYXRvcnMvaW5kZXgnXG5QcmVmaXhlcyA9IHJlcXVpcmUgJy4vcHJlZml4ZXMnXG5Nb3Rpb25zID0gcmVxdWlyZSAnLi9tb3Rpb25zL2luZGV4J1xuSW5zZXJ0TW9kZSA9IHJlcXVpcmUgJy4vaW5zZXJ0LW1vZGUnXG5cblRleHRPYmplY3RzID0gcmVxdWlyZSAnLi90ZXh0LW9iamVjdHMnXG5VdGlscyA9IHJlcXVpcmUgJy4vdXRpbHMnXG5TY3JvbGwgPSByZXF1aXJlICcuL3Njcm9sbCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVmltU3RhdGVcbiAgZWRpdG9yOiBudWxsXG4gIG9wU3RhY2s6IG51bGxcbiAgbW9kZTogbnVsbFxuICBzdWJtb2RlOiBudWxsXG4gIGRlc3Ryb3llZDogZmFsc2VcbiAgcmVwbGFjZU1vZGVMaXN0ZW5lcjogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvckVsZW1lbnQsIEBzdGF0dXNCYXJNYW5hZ2VyLCBAZ2xvYmFsVmltU3RhdGUpIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZWRpdG9yID0gQGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgIEBvcFN0YWNrID0gW11cbiAgICBAaGlzdG9yeSA9IFtdXG4gICAgQG1hcmtzID0ge31cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZERlc3Ryb3kgPT4gQGRlc3Ryb3koKVxuXG4gICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcsIEBjaGVja1NlbGVjdGlvbnNcbiAgICBpZiBhdG9tLmNvbW1hbmRzLm9uRGlkRGlzcGF0Y2g/XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoIChlKSA9PlxuICAgICAgICBpZiBlLnRhcmdldCBpcyBAZWRpdG9yRWxlbWVudFxuICAgICAgICAgIEBjaGVja1NlbGVjdGlvbnMoKVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInZpbS1tb2RlXCIpXG4gICAgQHNldHVwTm9ybWFsTW9kZSgpXG4gICAgaWYgc2V0dGluZ3Muc3RhcnRJbkluc2VydE1vZGUoKVxuICAgICAgQGFjdGl2YXRlSW5zZXJ0TW9kZSgpXG4gICAgZWxzZVxuICAgICAgQGFjdGl2YXRlTm9ybWFsTW9kZSgpXG5cbiAgZGVzdHJveTogLT5cbiAgICB1bmxlc3MgQGRlc3Ryb3llZFxuICAgICAgQGRlc3Ryb3llZCA9IHRydWVcbiAgICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgaWYgQGVkaXRvci5pc0FsaXZlKClcbiAgICAgICAgQGRlYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50Py5zZXRJbnB1dEVuYWJsZWQodHJ1ZSlcbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInZpbS1tb2RlXCIpXG4gICAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJub3JtYWwtbW9kZVwiKVxuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcsIEBjaGVja1NlbGVjdGlvbnNcbiAgICAgIEBlZGl0b3IgPSBudWxsXG4gICAgICBAZWRpdG9yRWxlbWVudCA9IG51bGxcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuXG4gICMgUHJpdmF0ZTogQ3JlYXRlcyB0aGUgcGx1Z2luJ3MgYmluZGluZ3NcbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgc2V0dXBOb3JtYWxNb2RlOiAtPlxuICAgIEByZWdpc3RlckNvbW1hbmRzXG4gICAgICAnYWN0aXZhdGUtbm9ybWFsLW1vZGUnOiA9PiBAYWN0aXZhdGVOb3JtYWxNb2RlKClcbiAgICAgICdhY3RpdmF0ZS1saW5ld2lzZS12aXN1YWwtbW9kZSc6ID0+IEBhY3RpdmF0ZVZpc3VhbE1vZGUoJ2xpbmV3aXNlJylcbiAgICAgICdhY3RpdmF0ZS1jaGFyYWN0ZXJ3aXNlLXZpc3VhbC1tb2RlJzogPT4gQGFjdGl2YXRlVmlzdWFsTW9kZSgnY2hhcmFjdGVyd2lzZScpXG4gICAgICAnYWN0aXZhdGUtYmxvY2t3aXNlLXZpc3VhbC1tb2RlJzogPT4gQGFjdGl2YXRlVmlzdWFsTW9kZSgnYmxvY2t3aXNlJylcbiAgICAgICdyZXNldC1ub3JtYWwtbW9kZSc6ID0+IEByZXNldE5vcm1hbE1vZGUoKVxuICAgICAgJ3JlcGVhdC1wcmVmaXgnOiAoZSkgPT4gQHJlcGVhdFByZWZpeChlKVxuICAgICAgJ3JldmVyc2Utc2VsZWN0aW9ucyc6IChlKSA9PiBAcmV2ZXJzZVNlbGVjdGlvbnMoZSlcbiAgICAgICd1bmRvJzogKGUpID0+IEB1bmRvKGUpXG4gICAgICAncmVwbGFjZS1tb2RlLWJhY2tzcGFjZSc6ID0+IEByZXBsYWNlTW9kZVVuZG8oKVxuICAgICAgJ2luc2VydC1tb2RlLXB1dCc6IChlKSA9PiBAaW5zZXJ0UmVnaXN0ZXIoQHJlZ2lzdGVyTmFtZShlKSlcbiAgICAgICdjb3B5LWZyb20tbGluZS1hYm92ZSc6ID0+IEluc2VydE1vZGUuY29weUNoYXJhY3RlckZyb21BYm92ZShAZWRpdG9yLCB0aGlzKVxuICAgICAgJ2NvcHktZnJvbS1saW5lLWJlbG93JzogPT4gSW5zZXJ0TW9kZS5jb3B5Q2hhcmFjdGVyRnJvbUJlbG93KEBlZGl0b3IsIHRoaXMpXG5cbiAgICBAcmVnaXN0ZXJPcGVyYXRpb25Db21tYW5kc1xuICAgICAgJ2FjdGl2YXRlLWluc2VydC1tb2RlJzogPT4gbmV3IE9wZXJhdG9ycy5JbnNlcnQoQGVkaXRvciwgdGhpcylcbiAgICAgICdhY3RpdmF0ZS1yZXBsYWNlLW1vZGUnOiA9PiBuZXcgT3BlcmF0b3JzLlJlcGxhY2VNb2RlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnc3Vic3RpdHV0ZSc6ID0+IFtuZXcgT3BlcmF0b3JzLkNoYW5nZShAZWRpdG9yLCB0aGlzKSwgbmV3IE1vdGlvbnMuTW92ZVJpZ2h0KEBlZGl0b3IsIHRoaXMpXVxuICAgICAgJ3N1YnN0aXR1dGUtbGluZSc6ID0+IFtuZXcgT3BlcmF0b3JzLkNoYW5nZShAZWRpdG9yLCB0aGlzKSwgbmV3IE1vdGlvbnMuTW92ZVRvUmVsYXRpdmVMaW5lKEBlZGl0b3IsIHRoaXMpXVxuICAgICAgJ2luc2VydC1hZnRlcic6ID0+IG5ldyBPcGVyYXRvcnMuSW5zZXJ0QWZ0ZXIoQGVkaXRvciwgdGhpcylcbiAgICAgICdpbnNlcnQtYWZ0ZXItZW5kLW9mLWxpbmUnOiA9PiBuZXcgT3BlcmF0b3JzLkluc2VydEFmdGVyRW5kT2ZMaW5lKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnaW5zZXJ0LWF0LWJlZ2lubmluZy1vZi1saW5lJzogPT4gbmV3IE9wZXJhdG9ycy5JbnNlcnRBdEJlZ2lubmluZ09mTGluZShAZWRpdG9yLCB0aGlzKVxuICAgICAgJ2luc2VydC1hYm92ZS13aXRoLW5ld2xpbmUnOiA9PiBuZXcgT3BlcmF0b3JzLkluc2VydEFib3ZlV2l0aE5ld2xpbmUoQGVkaXRvciwgdGhpcylcbiAgICAgICdpbnNlcnQtYmVsb3ctd2l0aC1uZXdsaW5lJzogPT4gbmV3IE9wZXJhdG9ycy5JbnNlcnRCZWxvd1dpdGhOZXdsaW5lKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnZGVsZXRlJzogPT4gQGxpbmV3aXNlQWxpYXNlZE9wZXJhdG9yKE9wZXJhdG9ycy5EZWxldGUpXG4gICAgICAnY2hhbmdlJzogPT4gQGxpbmV3aXNlQWxpYXNlZE9wZXJhdG9yKE9wZXJhdG9ycy5DaGFuZ2UpXG4gICAgICAnY2hhbmdlLXRvLWxhc3QtY2hhcmFjdGVyLW9mLWxpbmUnOiA9PiBbbmV3IE9wZXJhdG9ycy5DaGFuZ2UoQGVkaXRvciwgdGhpcyksIG5ldyBNb3Rpb25zLk1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUoQGVkaXRvciwgdGhpcyldXG4gICAgICAnZGVsZXRlLXJpZ2h0JzogPT4gW25ldyBPcGVyYXRvcnMuRGVsZXRlKEBlZGl0b3IsIHRoaXMpLCBuZXcgTW90aW9ucy5Nb3ZlUmlnaHQoQGVkaXRvciwgdGhpcyldXG4gICAgICAnZGVsZXRlLWxlZnQnOiA9PiBbbmV3IE9wZXJhdG9ycy5EZWxldGUoQGVkaXRvciwgdGhpcyksIG5ldyBNb3Rpb25zLk1vdmVMZWZ0KEBlZGl0b3IsIHRoaXMpXVxuICAgICAgJ2RlbGV0ZS10by1sYXN0LWNoYXJhY3Rlci1vZi1saW5lJzogPT4gW25ldyBPcGVyYXRvcnMuRGVsZXRlKEBlZGl0b3IsIHRoaXMpLCBuZXcgTW90aW9ucy5Nb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lKEBlZGl0b3IsIHRoaXMpXVxuICAgICAgJ3RvZ2dsZS1jYXNlJzogPT4gbmV3IE9wZXJhdG9ycy5Ub2dnbGVDYXNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAndXBwZXItY2FzZSc6ID0+IG5ldyBPcGVyYXRvcnMuVXBwZXJDYXNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbG93ZXItY2FzZSc6ID0+IG5ldyBPcGVyYXRvcnMuTG93ZXJDYXNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAndG9nZ2xlLWNhc2Utbm93JzogPT4gbmV3IE9wZXJhdG9ycy5Ub2dnbGVDYXNlKEBlZGl0b3IsIHRoaXMsIGNvbXBsZXRlOiB0cnVlKVxuICAgICAgJ3lhbmsnOiA9PiBAbGluZXdpc2VBbGlhc2VkT3BlcmF0b3IoT3BlcmF0b3JzLllhbmspXG4gICAgICAneWFuay1saW5lJzogPT4gW25ldyBPcGVyYXRvcnMuWWFuayhAZWRpdG9yLCB0aGlzKSwgbmV3IE1vdGlvbnMuTW92ZVRvUmVsYXRpdmVMaW5lKEBlZGl0b3IsIHRoaXMpXVxuICAgICAgJ3B1dC1iZWZvcmUnOiA9PiBuZXcgT3BlcmF0b3JzLlB1dChAZWRpdG9yLCB0aGlzLCBsb2NhdGlvbjogJ2JlZm9yZScpXG4gICAgICAncHV0LWFmdGVyJzogPT4gbmV3IE9wZXJhdG9ycy5QdXQoQGVkaXRvciwgdGhpcywgbG9jYXRpb246ICdhZnRlcicpXG4gICAgICAnam9pbic6ID0+IG5ldyBPcGVyYXRvcnMuSm9pbihAZWRpdG9yLCB0aGlzKVxuICAgICAgJ2luZGVudCc6ID0+IEBsaW5ld2lzZUFsaWFzZWRPcGVyYXRvcihPcGVyYXRvcnMuSW5kZW50KVxuICAgICAgJ291dGRlbnQnOiA9PiBAbGluZXdpc2VBbGlhc2VkT3BlcmF0b3IoT3BlcmF0b3JzLk91dGRlbnQpXG4gICAgICAnYXV0by1pbmRlbnQnOiA9PiBAbGluZXdpc2VBbGlhc2VkT3BlcmF0b3IoT3BlcmF0b3JzLkF1dG9pbmRlbnQpXG4gICAgICAnaW5jcmVhc2UnOiA9PiBuZXcgT3BlcmF0b3JzLkluY3JlYXNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnZGVjcmVhc2UnOiA9PiBuZXcgT3BlcmF0b3JzLkRlY3JlYXNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS1sZWZ0JzogPT4gbmV3IE1vdGlvbnMuTW92ZUxlZnQoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXVwJzogPT4gbmV3IE1vdGlvbnMuTW92ZVVwKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS1kb3duJzogPT4gbmV3IE1vdGlvbnMuTW92ZURvd24oQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXJpZ2h0JzogPT4gbmV3IE1vdGlvbnMuTW92ZVJpZ2h0KEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1uZXh0LXdvcmQnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9OZXh0V29yZChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbmV4dC13aG9sZS13b3JkJzogPT4gbmV3IE1vdGlvbnMuTW92ZVRvTmV4dFdob2xlV29yZChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tZW5kLW9mLXdvcmQnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9FbmRPZldvcmQoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLWVuZC1vZi13aG9sZS13b3JkJzogPT4gbmV3IE1vdGlvbnMuTW92ZVRvRW5kT2ZXaG9sZVdvcmQoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLXByZXZpb3VzLXdvcmQnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9QcmV2aW91c1dvcmQoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLXByZXZpb3VzLXdob2xlLXdvcmQnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9QcmV2aW91c1dob2xlV29yZChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbmV4dC1wYXJhZ3JhcGgnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9OZXh0UGFyYWdyYXBoKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1uZXh0LXNlbnRlbmNlJzogPT4gbmV3IE1vdGlvbnMuTW92ZVRvTmV4dFNlbnRlbmNlKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1wcmV2aW91cy1zZW50ZW5jZSc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb1ByZXZpb3VzU2VudGVuY2UoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLXByZXZpb3VzLXBhcmFncmFwaCc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb1ByZXZpb3VzUGFyYWdyYXBoKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1maXJzdC1jaGFyYWN0ZXItb2YtbGluZSc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1maXJzdC1jaGFyYWN0ZXItb2YtbGluZS1hbmQtZG93bic6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lQW5kRG93bihAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbGFzdC1jaGFyYWN0ZXItb2YtbGluZSc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLWxhc3Qtbm9uYmxhbmstY2hhcmFjdGVyLW9mLWxpbmUtYW5kLWRvd24nOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duKEBlZGl0b3IsIHRoaXMpXG4gICAgICAnbW92ZS10by1iZWdpbm5pbmctb2YtbGluZSc6IChlKSA9PiBAbW92ZU9yUmVwZWF0KGUpXG4gICAgICAnbW92ZS10by1maXJzdC1jaGFyYWN0ZXItb2YtbGluZS11cCc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lVXAoQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLWZpcnN0LWNoYXJhY3Rlci1vZi1saW5lLWRvd24nOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd24oQGVkaXRvciwgdGhpcylcbiAgICAgICdtb3ZlLXRvLXN0YXJ0LW9mLWZpbGUnOiA9PiBuZXcgTW90aW9ucy5Nb3ZlVG9TdGFydE9mRmlsZShAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbGluZSc6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0Fic29sdXRlTGluZShAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tdG9wLW9mLXNjcmVlbic6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb1RvcE9mU2NyZWVuKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ21vdmUtdG8tYm90dG9tLW9mLXNjcmVlbic6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb0JvdHRvbU9mU2NyZWVuKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbWlkZGxlLW9mLXNjcmVlbic6ID0+IG5ldyBNb3Rpb25zLk1vdmVUb01pZGRsZU9mU2NyZWVuKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ3Njcm9sbC1kb3duJzogPT4gbmV3IFNjcm9sbC5TY3JvbGxEb3duKEBlZGl0b3JFbGVtZW50KVxuICAgICAgJ3Njcm9sbC11cCc6ID0+IG5ldyBTY3JvbGwuU2Nyb2xsVXAoQGVkaXRvckVsZW1lbnQpXG4gICAgICAnc2Nyb2xsLWN1cnNvci10by10b3AnOiA9PiBuZXcgU2Nyb2xsLlNjcm9sbEN1cnNvclRvVG9wKEBlZGl0b3JFbGVtZW50KVxuICAgICAgJ3Njcm9sbC1jdXJzb3ItdG8tdG9wLWxlYXZlJzogPT4gbmV3IFNjcm9sbC5TY3JvbGxDdXJzb3JUb1RvcChAZWRpdG9yRWxlbWVudCwge2xlYXZlQ3Vyc29yOiB0cnVlfSlcbiAgICAgICdzY3JvbGwtY3Vyc29yLXRvLW1pZGRsZSc6ID0+IG5ldyBTY3JvbGwuU2Nyb2xsQ3Vyc29yVG9NaWRkbGUoQGVkaXRvckVsZW1lbnQpXG4gICAgICAnc2Nyb2xsLWN1cnNvci10by1taWRkbGUtbGVhdmUnOiA9PiBuZXcgU2Nyb2xsLlNjcm9sbEN1cnNvclRvTWlkZGxlKEBlZGl0b3JFbGVtZW50LCB7bGVhdmVDdXJzb3I6IHRydWV9KVxuICAgICAgJ3Njcm9sbC1jdXJzb3ItdG8tYm90dG9tJzogPT4gbmV3IFNjcm9sbC5TY3JvbGxDdXJzb3JUb0JvdHRvbShAZWRpdG9yRWxlbWVudClcbiAgICAgICdzY3JvbGwtY3Vyc29yLXRvLWJvdHRvbS1sZWF2ZSc6ID0+IG5ldyBTY3JvbGwuU2Nyb2xsQ3Vyc29yVG9Cb3R0b20oQGVkaXRvckVsZW1lbnQsIHtsZWF2ZUN1cnNvcjogdHJ1ZX0pXG4gICAgICAnc2Nyb2xsLWhhbGYtc2NyZWVuLXVwJzogPT4gbmV3IE1vdGlvbnMuU2Nyb2xsSGFsZlVwS2VlcEN1cnNvcihAZWRpdG9yRWxlbWVudCwgdGhpcylcbiAgICAgICdzY3JvbGwtZnVsbC1zY3JlZW4tdXAnOiA9PiBuZXcgTW90aW9ucy5TY3JvbGxGdWxsVXBLZWVwQ3Vyc29yKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ3Njcm9sbC1oYWxmLXNjcmVlbi1kb3duJzogPT4gbmV3IE1vdGlvbnMuU2Nyb2xsSGFsZkRvd25LZWVwQ3Vyc29yKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ3Njcm9sbC1mdWxsLXNjcmVlbi1kb3duJzogPT4gbmV3IE1vdGlvbnMuU2Nyb2xsRnVsbERvd25LZWVwQ3Vyc29yKEBlZGl0b3JFbGVtZW50LCB0aGlzKVxuICAgICAgJ3Njcm9sbC1jdXJzb3ItdG8tbGVmdCc6ID0+IG5ldyBTY3JvbGwuU2Nyb2xsQ3Vyc29yVG9MZWZ0KEBlZGl0b3JFbGVtZW50KVxuICAgICAgJ3Njcm9sbC1jdXJzb3ItdG8tcmlnaHQnOiA9PiBuZXcgU2Nyb2xsLlNjcm9sbEN1cnNvclRvUmlnaHQoQGVkaXRvckVsZW1lbnQpXG4gICAgICAnc2VsZWN0LWluc2lkZS13b3JkJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEluc2lkZVdvcmQoQGVkaXRvcilcbiAgICAgICdzZWxlY3QtaW5zaWRlLXdob2xlLXdvcmQnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlV2hvbGVXb3JkKEBlZGl0b3IpXG4gICAgICAnc2VsZWN0LWluc2lkZS1kb3VibGUtcXVvdGVzJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEluc2lkZVF1b3RlcyhAZWRpdG9yLCAnXCInLCBmYWxzZSlcbiAgICAgICdzZWxlY3QtaW5zaWRlLXNpbmdsZS1xdW90ZXMnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlUXVvdGVzKEBlZGl0b3IsICdcXCcnLCBmYWxzZSlcbiAgICAgICdzZWxlY3QtaW5zaWRlLWJhY2stdGlja3MnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlUXVvdGVzKEBlZGl0b3IsICdgJywgZmFsc2UpXG4gICAgICAnc2VsZWN0LWluc2lkZS1jdXJseS1icmFja2V0cyc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RJbnNpZGVCcmFja2V0cyhAZWRpdG9yLCAneycsICd9JywgZmFsc2UpXG4gICAgICAnc2VsZWN0LWluc2lkZS1hbmdsZS1icmFja2V0cyc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RJbnNpZGVCcmFja2V0cyhAZWRpdG9yLCAnPCcsICc+JywgZmFsc2UpXG4gICAgICAnc2VsZWN0LWluc2lkZS10YWdzJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEluc2lkZUJyYWNrZXRzKEBlZGl0b3IsICc+JywgJzwnLCBmYWxzZSlcbiAgICAgICdzZWxlY3QtaW5zaWRlLXNxdWFyZS1icmFja2V0cyc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RJbnNpZGVCcmFja2V0cyhAZWRpdG9yLCAnWycsICddJywgZmFsc2UpXG4gICAgICAnc2VsZWN0LWluc2lkZS1wYXJlbnRoZXNlcyc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RJbnNpZGVCcmFja2V0cyhAZWRpdG9yLCAnKCcsICcpJywgZmFsc2UpXG4gICAgICAnc2VsZWN0LWluc2lkZS1wYXJhZ3JhcGgnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlUGFyYWdyYXBoKEBlZGl0b3IsIGZhbHNlKVxuICAgICAgJ3NlbGVjdC1hLXdvcmQnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0QVdvcmQoQGVkaXRvcilcbiAgICAgICdzZWxlY3QtYS13aG9sZS13b3JkJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEFXaG9sZVdvcmQoQGVkaXRvcilcbiAgICAgICdzZWxlY3QtYXJvdW5kLWRvdWJsZS1xdW90ZXMnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlUXVvdGVzKEBlZGl0b3IsICdcIicsIHRydWUpXG4gICAgICAnc2VsZWN0LWFyb3VuZC1zaW5nbGUtcXVvdGVzJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEluc2lkZVF1b3RlcyhAZWRpdG9yLCAnXFwnJywgdHJ1ZSlcbiAgICAgICdzZWxlY3QtYXJvdW5kLWJhY2stdGlja3MnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlUXVvdGVzKEBlZGl0b3IsICdgJywgdHJ1ZSlcbiAgICAgICdzZWxlY3QtYXJvdW5kLWN1cmx5LWJyYWNrZXRzJzogPT4gbmV3IFRleHRPYmplY3RzLlNlbGVjdEluc2lkZUJyYWNrZXRzKEBlZGl0b3IsICd7JywgJ30nLCB0cnVlKVxuICAgICAgJ3NlbGVjdC1hcm91bmQtYW5nbGUtYnJhY2tldHMnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlQnJhY2tldHMoQGVkaXRvciwgJzwnLCAnPicsIHRydWUpXG4gICAgICAnc2VsZWN0LWFyb3VuZC1zcXVhcmUtYnJhY2tldHMnOiA9PiBuZXcgVGV4dE9iamVjdHMuU2VsZWN0SW5zaWRlQnJhY2tldHMoQGVkaXRvciwgJ1snLCAnXScsIHRydWUpXG4gICAgICAnc2VsZWN0LWFyb3VuZC1wYXJlbnRoZXNlcyc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RJbnNpZGVCcmFja2V0cyhAZWRpdG9yLCAnKCcsICcpJywgdHJ1ZSlcbiAgICAgICdzZWxlY3QtYXJvdW5kLXBhcmFncmFwaCc6ID0+IG5ldyBUZXh0T2JqZWN0cy5TZWxlY3RBUGFyYWdyYXBoKEBlZGl0b3IsIHRydWUpXG4gICAgICAncmVnaXN0ZXItcHJlZml4JzogKGUpID0+IEByZWdpc3RlclByZWZpeChlKVxuICAgICAgJ3JlcGVhdCc6IChlKSA9PiBuZXcgT3BlcmF0b3JzLlJlcGVhdChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ3JlcGVhdC1zZWFyY2gnOiAoZSkgPT4gbmV3IE1vdGlvbnMuUmVwZWF0U2VhcmNoKEBlZGl0b3IsIHRoaXMpXG4gICAgICAncmVwZWF0LXNlYXJjaC1iYWNrd2FyZHMnOiAoZSkgPT4gbmV3IE1vdGlvbnMuUmVwZWF0U2VhcmNoKEBlZGl0b3IsIHRoaXMpLnJldmVyc2VkKClcbiAgICAgICdtb3ZlLXRvLW1hcmsnOiAoZSkgPT4gbmV3IE1vdGlvbnMuTW92ZVRvTWFyayhAZWRpdG9yLCB0aGlzKVxuICAgICAgJ21vdmUtdG8tbWFyay1saXRlcmFsJzogKGUpID0+IG5ldyBNb3Rpb25zLk1vdmVUb01hcmsoQGVkaXRvciwgdGhpcywgZmFsc2UpXG4gICAgICAnbWFyayc6IChlKSA9PiBuZXcgT3BlcmF0b3JzLk1hcmsoQGVkaXRvciwgdGhpcylcbiAgICAgICdmaW5kJzogKGUpID0+IG5ldyBNb3Rpb25zLkZpbmQoQGVkaXRvciwgdGhpcylcbiAgICAgICdmaW5kLWJhY2t3YXJkcyc6IChlKSA9PiBuZXcgTW90aW9ucy5GaW5kKEBlZGl0b3IsIHRoaXMpLnJldmVyc2UoKVxuICAgICAgJ3RpbGwnOiAoZSkgPT4gbmV3IE1vdGlvbnMuVGlsbChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ3RpbGwtYmFja3dhcmRzJzogKGUpID0+IG5ldyBNb3Rpb25zLlRpbGwoQGVkaXRvciwgdGhpcykucmV2ZXJzZSgpXG4gICAgICAncmVwZWF0LWZpbmQnOiAoZSkgPT4gbmV3IEBnbG9iYWxWaW1TdGF0ZS5jdXJyZW50RmluZC5jb25zdHJ1Y3RvcihAZWRpdG9yLCB0aGlzLCByZXBlYXRlZDogdHJ1ZSkgaWYgQGdsb2JhbFZpbVN0YXRlLmN1cnJlbnRGaW5kXG4gICAgICAncmVwZWF0LWZpbmQtcmV2ZXJzZSc6IChlKSA9PiBuZXcgQGdsb2JhbFZpbVN0YXRlLmN1cnJlbnRGaW5kLmNvbnN0cnVjdG9yKEBlZGl0b3IsIHRoaXMsIHJlcGVhdGVkOiB0cnVlLCByZXZlcnNlOiB0cnVlKSBpZiBAZ2xvYmFsVmltU3RhdGUuY3VycmVudEZpbmRcbiAgICAgICdyZXBsYWNlJzogKGUpID0+IG5ldyBPcGVyYXRvcnMuUmVwbGFjZShAZWRpdG9yLCB0aGlzKVxuICAgICAgJ3NlYXJjaCc6IChlKSA9PiBuZXcgTW90aW9ucy5TZWFyY2goQGVkaXRvciwgdGhpcylcbiAgICAgICdyZXZlcnNlLXNlYXJjaCc6IChlKSA9PiAobmV3IE1vdGlvbnMuU2VhcmNoKEBlZGl0b3IsIHRoaXMpKS5yZXZlcnNlZCgpXG4gICAgICAnc2VhcmNoLWN1cnJlbnQtd29yZCc6IChlKSA9PiBuZXcgTW90aW9ucy5TZWFyY2hDdXJyZW50V29yZChAZWRpdG9yLCB0aGlzKVxuICAgICAgJ2JyYWNrZXQtbWF0Y2hpbmctbW90aW9uJzogKGUpID0+IG5ldyBNb3Rpb25zLkJyYWNrZXRNYXRjaGluZ01vdGlvbihAZWRpdG9yLCB0aGlzKVxuICAgICAgJ3JldmVyc2Utc2VhcmNoLWN1cnJlbnQtd29yZCc6IChlKSA9PiAobmV3IE1vdGlvbnMuU2VhcmNoQ3VycmVudFdvcmQoQGVkaXRvciwgdGhpcykpLnJldmVyc2VkKClcblxuICAjIFByaXZhdGU6IFJlZ2lzdGVyIG11bHRpcGxlIGNvbW1hbmQgaGFuZGxlcnMgdmlhIGFuIHtPYmplY3R9IHRoYXQgbWFwc1xuICAjIGNvbW1hbmQgbmFtZXMgdG8gY29tbWFuZCBoYW5kbGVyIGZ1bmN0aW9ucy5cbiAgI1xuICAjIFByZWZpeGVzIHRoZSBnaXZlbiBjb21tYW5kIG5hbWVzIHdpdGggJ3ZpbS1tb2RlOicgdG8gcmVkdWNlIHJlZHVuZGFuY3kgaW5cbiAgIyB0aGUgcHJvdmlkZWQgb2JqZWN0LlxuICByZWdpc3RlckNvbW1hbmRzOiAoY29tbWFuZHMpIC0+XG4gICAgZm9yIGNvbW1hbmROYW1lLCBmbiBvZiBjb21tYW5kc1xuICAgICAgZG8gKGZuKSA9PlxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoQGVkaXRvckVsZW1lbnQsIFwidmltLW1vZGU6I3tjb21tYW5kTmFtZX1cIiwgZm4pKVxuXG4gICMgUHJpdmF0ZTogUmVnaXN0ZXIgbXVsdGlwbGUgT3BlcmF0b3JzIHZpYSBhbiB7T2JqZWN0fSB0aGF0XG4gICMgbWFwcyBjb21tYW5kIG5hbWVzIHRvIGZ1bmN0aW9ucyB0aGF0IHJldHVybiBvcGVyYXRpb25zIHRvIHB1c2guXG4gICNcbiAgIyBQcmVmaXhlcyB0aGUgZ2l2ZW4gY29tbWFuZCBuYW1lcyB3aXRoICd2aW0tbW9kZTonIHRvIHJlZHVjZSByZWR1bmRhbmN5IGluXG4gICMgdGhlIGdpdmVuIG9iamVjdC5cbiAgcmVnaXN0ZXJPcGVyYXRpb25Db21tYW5kczogKG9wZXJhdGlvbkNvbW1hbmRzKSAtPlxuICAgIGNvbW1hbmRzID0ge31cbiAgICBmb3IgY29tbWFuZE5hbWUsIG9wZXJhdGlvbkZuIG9mIG9wZXJhdGlvbkNvbW1hbmRzXG4gICAgICBkbyAob3BlcmF0aW9uRm4pID0+XG4gICAgICAgIGNvbW1hbmRzW2NvbW1hbmROYW1lXSA9IChldmVudCkgPT4gQHB1c2hPcGVyYXRpb25zKG9wZXJhdGlvbkZuKGV2ZW50KSlcbiAgICBAcmVnaXN0ZXJDb21tYW5kcyhjb21tYW5kcylcblxuICAjIFByaXZhdGU6IFB1c2ggdGhlIGdpdmVuIG9wZXJhdGlvbnMgb250byB0aGUgb3BlcmF0aW9uIHN0YWNrLCB0aGVuIHByb2Nlc3NcbiAgIyBpdC5cbiAgcHVzaE9wZXJhdGlvbnM6IChvcGVyYXRpb25zKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgb3BlcmF0aW9ucz9cbiAgICBvcGVyYXRpb25zID0gW29wZXJhdGlvbnNdIHVubGVzcyBfLmlzQXJyYXkob3BlcmF0aW9ucylcblxuICAgIGZvciBvcGVyYXRpb24gaW4gb3BlcmF0aW9uc1xuICAgICAgIyBNb3Rpb25zIGluIHZpc3VhbCBtb2RlIHBlcmZvcm0gdGhlaXIgc2VsZWN0aW9ucy5cbiAgICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnIGFuZCAob3BlcmF0aW9uIGluc3RhbmNlb2YgTW90aW9ucy5Nb3Rpb24gb3Igb3BlcmF0aW9uIGluc3RhbmNlb2YgVGV4dE9iamVjdHMuVGV4dE9iamVjdClcbiAgICAgICAgb3BlcmF0aW9uLmV4ZWN1dGUgPSBvcGVyYXRpb24uc2VsZWN0XG5cbiAgICAgICMgaWYgd2UgaGF2ZSBzdGFydGVkIGFuIG9wZXJhdGlvbiB0aGF0IHJlc3BvbmRzIHRvIGNhbkNvbXBvc2VXaXRoIGNoZWNrIGlmIGl0IGNhbiBjb21wb3NlXG4gICAgICAjIHdpdGggdGhlIG9wZXJhdGlvbiB3ZSdyZSBnb2luZyB0byBwdXNoIG9udG8gdGhlIHN0YWNrXG4gICAgICBpZiAodG9wT3AgPSBAdG9wT3BlcmF0aW9uKCkpPyBhbmQgdG9wT3AuY2FuQ29tcG9zZVdpdGg/IGFuZCBub3QgdG9wT3AuY2FuQ29tcG9zZVdpdGgob3BlcmF0aW9uKVxuICAgICAgICBAcmVzZXROb3JtYWxNb2RlKClcbiAgICAgICAgQGVtaXR0ZXIuZW1pdCgnZmFpbGVkLXRvLWNvbXBvc2UnKVxuICAgICAgICBicmVha1xuXG4gICAgICBAb3BTdGFjay5wdXNoKG9wZXJhdGlvbilcblxuICAgICAgIyBJZiB3ZSd2ZSByZWNlaXZlZCBhbiBvcGVyYXRvciBpbiB2aXN1YWwgbW9kZSwgbWFyayB0aGUgY3VycmVudFxuICAgICAgIyBzZWxlY3Rpb24gYXMgdGhlIG1vdGlvbiB0byBvcGVyYXRlIG9uLlxuICAgICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCcgYW5kIG9wZXJhdGlvbiBpbnN0YW5jZW9mIE9wZXJhdG9ycy5PcGVyYXRvclxuICAgICAgICBAb3BTdGFjay5wdXNoKG5ldyBNb3Rpb25zLkN1cnJlbnRTZWxlY3Rpb24oQGVkaXRvciwgdGhpcykpXG5cbiAgICAgIEBwcm9jZXNzT3BTdGFjaygpXG5cbiAgb25EaWRGYWlsVG9Db21wb3NlOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24oJ2ZhaWxlZC10by1jb21wb3NlJywgZm4pXG5cbiAgb25EaWREZXN0cm95OiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1kZXN0cm95JywgZm4pXG5cbiAgIyBQcml2YXRlOiBSZW1vdmVzIGFsbCBvcGVyYXRpb25zIGZyb20gdGhlIHN0YWNrLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBjbGVhck9wU3RhY2s6IC0+XG4gICAgQG9wU3RhY2sgPSBbXVxuXG4gIHVuZG86IC0+XG4gICAgQGVkaXRvci51bmRvKClcbiAgICBAYWN0aXZhdGVOb3JtYWxNb2RlKClcblxuICAjIFByaXZhdGU6IFByb2Nlc3NlcyB0aGUgY29tbWFuZCBpZiB0aGUgbGFzdCBvcGVyYXRpb24gaXMgY29tcGxldGUuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHByb2Nlc3NPcFN0YWNrOiAtPlxuICAgIHVubGVzcyBAb3BTdGFjay5sZW5ndGggPiAwXG4gICAgICByZXR1cm5cblxuICAgIHVubGVzcyBAdG9wT3BlcmF0aW9uKCkuaXNDb21wbGV0ZSgpXG4gICAgICBpZiBAbW9kZSBpcyAnbm9ybWFsJyBhbmQgQHRvcE9wZXJhdGlvbigpIGluc3RhbmNlb2YgT3BlcmF0b3JzLk9wZXJhdG9yXG4gICAgICAgIEBhY3RpdmF0ZU9wZXJhdG9yUGVuZGluZ01vZGUoKVxuICAgICAgcmV0dXJuXG5cbiAgICBwb3BwZWRPcGVyYXRpb24gPSBAb3BTdGFjay5wb3AoKVxuICAgIGlmIEBvcFN0YWNrLmxlbmd0aFxuICAgICAgdHJ5XG4gICAgICAgIEB0b3BPcGVyYXRpb24oKS5jb21wb3NlKHBvcHBlZE9wZXJhdGlvbilcbiAgICAgICAgQHByb2Nlc3NPcFN0YWNrKClcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBPcGVyYXRvcnMuT3BlcmF0b3JFcnJvcikgb3IgKGUgaW5zdGFuY2VvZiBNb3Rpb25zLk1vdGlvbkVycm9yKVxuICAgICAgICAgIEByZXNldE5vcm1hbE1vZGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgZVxuICAgIGVsc2VcbiAgICAgIEBoaXN0b3J5LnVuc2hpZnQocG9wcGVkT3BlcmF0aW9uKSBpZiBwb3BwZWRPcGVyYXRpb24uaXNSZWNvcmRhYmxlKClcbiAgICAgIHBvcHBlZE9wZXJhdGlvbi5leGVjdXRlKClcblxuICAjIFByaXZhdGU6IEZldGNoZXMgdGhlIGxhc3Qgb3BlcmF0aW9uLlxuICAjXG4gICMgUmV0dXJucyB0aGUgbGFzdCBvcGVyYXRpb24uXG4gIHRvcE9wZXJhdGlvbjogLT5cbiAgICBfLmxhc3QgQG9wU3RhY2tcblxuICAjIFByaXZhdGU6IEZldGNoZXMgdGhlIHZhbHVlIG9mIGEgZ2l2ZW4gcmVnaXN0ZXIuXG4gICNcbiAgIyBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHJlZ2lzdGVyIHRvIGZldGNoLlxuICAjXG4gICMgUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGdpdmVuIHJlZ2lzdGVyIG9yIHVuZGVmaW5lZCBpZiBpdCBoYXNuJ3RcbiAgIyBiZWVuIHNldC5cbiAgZ2V0UmVnaXN0ZXI6IChuYW1lKSAtPlxuICAgIGlmIG5hbWUgaXMgJ1wiJ1xuICAgICAgbmFtZSA9IHNldHRpbmdzLmRlZmF1bHRSZWdpc3RlcigpXG4gICAgaWYgbmFtZSBpbiBbJyonLCAnKyddXG4gICAgICB0ZXh0ID0gYXRvbS5jbGlwYm9hcmQucmVhZCgpXG4gICAgICB0eXBlID0gVXRpbHMuY29weVR5cGUodGV4dClcbiAgICAgIHt0ZXh0LCB0eXBlfVxuICAgIGVsc2UgaWYgbmFtZSBpcyAnJSdcbiAgICAgIHRleHQgPSBAZWRpdG9yLmdldFVSSSgpXG4gICAgICB0eXBlID0gVXRpbHMuY29weVR5cGUodGV4dClcbiAgICAgIHt0ZXh0LCB0eXBlfVxuICAgIGVsc2UgaWYgbmFtZSBpcyBcIl9cIiAjIEJsYWNraG9sZSBhbHdheXMgcmV0dXJucyBub3RoaW5nXG4gICAgICB0ZXh0ID0gJydcbiAgICAgIHR5cGUgPSBVdGlscy5jb3B5VHlwZSh0ZXh0KVxuICAgICAge3RleHQsIHR5cGV9XG4gICAgZWxzZVxuICAgICAgQGdsb2JhbFZpbVN0YXRlLnJlZ2lzdGVyc1tuYW1lLnRvTG93ZXJDYXNlKCldXG5cbiAgIyBQcml2YXRlOiBGZXRjaGVzIHRoZSB2YWx1ZSBvZiBhIGdpdmVuIG1hcmsuXG4gICNcbiAgIyBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1hcmsgdG8gZmV0Y2guXG4gICNcbiAgIyBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gbWFyayBvciB1bmRlZmluZWQgaWYgaXQgaGFzbid0XG4gICMgYmVlbiBzZXQuXG4gIGdldE1hcms6IChuYW1lKSAtPlxuICAgIGlmIEBtYXJrc1tuYW1lXVxuICAgICAgQG1hcmtzW25hbWVdLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRcbiAgICBlbHNlXG4gICAgICB1bmRlZmluZWRcblxuICAjIFByaXZhdGU6IFNldHMgdGhlIHZhbHVlIG9mIGEgZ2l2ZW4gcmVnaXN0ZXIuXG4gICNcbiAgIyBuYW1lICAtIFRoZSBuYW1lIG9mIHRoZSByZWdpc3RlciB0byBmZXRjaC5cbiAgIyB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXQgdGhlIHJlZ2lzdGVyIHRvLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXRSZWdpc3RlcjogKG5hbWUsIHZhbHVlKSAtPlxuICAgIGlmIG5hbWUgaXMgJ1wiJ1xuICAgICAgbmFtZSA9IHNldHRpbmdzLmRlZmF1bHRSZWdpc3RlcigpXG4gICAgaWYgbmFtZSBpbiBbJyonLCAnKyddXG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh2YWx1ZS50ZXh0KVxuICAgIGVsc2UgaWYgbmFtZSBpcyAnXydcbiAgICAgICMgQmxhY2tob2xlIHJlZ2lzdGVyLCBub3RoaW5nIHRvIGRvXG4gICAgZWxzZSBpZiAvXltBLVpdJC8udGVzdChuYW1lKVxuICAgICAgQGFwcGVuZFJlZ2lzdGVyKG5hbWUudG9Mb3dlckNhc2UoKSwgdmFsdWUpXG4gICAgZWxzZVxuICAgICAgQGdsb2JhbFZpbVN0YXRlLnJlZ2lzdGVyc1tuYW1lXSA9IHZhbHVlXG5cblxuICAjIFByaXZhdGU6IGFwcGVuZCBhIHZhbHVlIGludG8gYSBnaXZlbiByZWdpc3RlclxuICAjIGxpa2Ugc2V0UmVnaXN0ZXIsIGJ1dCBhcHBlbmRzIHRoZSB2YWx1ZVxuICBhcHBlbmRSZWdpc3RlcjogKG5hbWUsIHZhbHVlKSAtPlxuICAgIHJlZ2lzdGVyID0gQGdsb2JhbFZpbVN0YXRlLnJlZ2lzdGVyc1tuYW1lXSA/PVxuICAgICAgdHlwZTogJ2NoYXJhY3RlcidcbiAgICAgIHRleHQ6IFwiXCJcbiAgICBpZiByZWdpc3Rlci50eXBlIGlzICdsaW5ld2lzZScgYW5kIHZhbHVlLnR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICByZWdpc3Rlci50ZXh0ICs9IHZhbHVlLnRleHQgKyAnXFxuJ1xuICAgIGVsc2UgaWYgcmVnaXN0ZXIudHlwZSBpc250ICdsaW5ld2lzZScgYW5kIHZhbHVlLnR5cGUgaXMgJ2xpbmV3aXNlJ1xuICAgICAgcmVnaXN0ZXIudGV4dCArPSAnXFxuJyArIHZhbHVlLnRleHRcbiAgICAgIHJlZ2lzdGVyLnR5cGUgPSAnbGluZXdpc2UnXG4gICAgZWxzZVxuICAgICAgcmVnaXN0ZXIudGV4dCArPSB2YWx1ZS50ZXh0XG5cbiAgIyBQcml2YXRlOiBTZXRzIHRoZSB2YWx1ZSBvZiBhIGdpdmVuIG1hcmsuXG4gICNcbiAgIyBuYW1lICAtIFRoZSBuYW1lIG9mIHRoZSBtYXJrIHRvIGZldGNoLlxuICAjIHBvcyB7UG9pbnR9IC0gVGhlIHZhbHVlIHRvIHNldCB0aGUgbWFyayB0by5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgc2V0TWFyazogKG5hbWUsIHBvcykgLT5cbiAgICAjIGNoZWNrIHRvIG1ha2Ugc3VyZSBuYW1lIGlzIGluIFthLXpdIG9yIGlzIGBcbiAgICBpZiAoY2hhckNvZGUgPSBuYW1lLmNoYXJDb2RlQXQoMCkpID49IDk2IGFuZCBjaGFyQ29kZSA8PSAxMjJcbiAgICAgIG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlKG5ldyBSYW5nZShwb3MsIHBvcyksIHtpbnZhbGlkYXRlOiAnbmV2ZXInLCBwZXJzaXN0ZW50OiBmYWxzZX0pXG4gICAgICBAbWFya3NbbmFtZV0gPSBtYXJrZXJcblxuICAjIFB1YmxpYzogQXBwZW5kIGEgc2VhcmNoIHRvIHRoZSBzZWFyY2ggaGlzdG9yeS5cbiAgI1xuICAjIE1vdGlvbnMuU2VhcmNoIC0gVGhlIGNvbmZpcm1lZCBzZWFyY2ggbW90aW9uIHRvIGFwcGVuZFxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nXG4gIHB1c2hTZWFyY2hIaXN0b3J5OiAoc2VhcmNoKSAtPlxuICAgIEBnbG9iYWxWaW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnVuc2hpZnQgc2VhcmNoXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgc2VhcmNoIGhpc3RvcnkgaXRlbSBhdCB0aGUgZ2l2ZW4gaW5kZXguXG4gICNcbiAgIyBpbmRleCAtIHRoZSBpbmRleCBvZiB0aGUgc2VhcmNoIGhpc3RvcnkgaXRlbVxuICAjXG4gICMgUmV0dXJucyBhIHNlYXJjaCBtb3Rpb25cbiAgZ2V0U2VhcmNoSGlzdG9yeUl0ZW06IChpbmRleCA9IDApIC0+XG4gICAgQGdsb2JhbFZpbVN0YXRlLnNlYXJjaEhpc3RvcnlbaW5kZXhdXG5cbiAgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gICMgTW9kZSBTd2l0Y2hpbmdcbiAgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG5cbiAgIyBQcml2YXRlOiBVc2VkIHRvIGVuYWJsZSBub3JtYWwgbW9kZS5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgYWN0aXZhdGVOb3JtYWxNb2RlOiAtPlxuICAgIEBkZWFjdGl2YXRlSW5zZXJ0TW9kZSgpXG4gICAgQGRlYWN0aXZhdGVWaXN1YWxNb2RlKClcblxuICAgIEBtb2RlID0gJ25vcm1hbCdcbiAgICBAc3VibW9kZSA9IG51bGxcblxuICAgIEBjaGFuZ2VNb2RlQ2xhc3MoJ25vcm1hbC1tb2RlJylcblxuICAgIEBjbGVhck9wU3RhY2soKVxuICAgIHNlbGVjdGlvbi5jbGVhcihhdXRvc2Nyb2xsOiBmYWxzZSkgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIEBlbnN1cmVDdXJzb3JzV2l0aGluTGluZSgpXG5cbiAgICBAdXBkYXRlU3RhdHVzQmFyKClcblxuICAjIFRPRE86IHJlbW92ZSB0aGlzIG1ldGhvZCBhbmQgYnVtcCB0aGUgYHZpbS1tb2RlYCBzZXJ2aWNlIHZlcnNpb24gbnVtYmVyLlxuICBhY3RpdmF0ZUNvbW1hbmRNb2RlOiAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVXNlIDo6YWN0aXZhdGVOb3JtYWxNb2RlIGluc3RlYWRcIilcbiAgICBAYWN0aXZhdGVOb3JtYWxNb2RlKClcblxuICAjIFByaXZhdGU6IFVzZWQgdG8gZW5hYmxlIGluc2VydCBtb2RlLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBhY3RpdmF0ZUluc2VydE1vZGU6IChzdWJ0eXBlID0gbnVsbCkgLT5cbiAgICBAbW9kZSA9ICdpbnNlcnQnXG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50LnNldElucHV0RW5hYmxlZCh0cnVlKVxuICAgIEBzZXRJbnNlcnRpb25DaGVja3BvaW50KClcbiAgICBAc3VibW9kZSA9IHN1YnR5cGVcbiAgICBAY2hhbmdlTW9kZUNsYXNzKCdpbnNlcnQtbW9kZScpXG4gICAgQHVwZGF0ZVN0YXR1c0JhcigpXG5cbiAgYWN0aXZhdGVSZXBsYWNlTW9kZTogLT5cbiAgICBAYWN0aXZhdGVJbnNlcnRNb2RlKCdyZXBsYWNlJylcbiAgICBAcmVwbGFjZU1vZGVDb3VudGVyID0gMFxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3JlcGxhY2UtbW9kZScpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEByZXBsYWNlTW9kZUxpc3RlbmVyID0gQGVkaXRvci5vbldpbGxJbnNlcnRUZXh0IEByZXBsYWNlTW9kZUluc2VydEhhbmRsZXJcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHJlcGxhY2VNb2RlVW5kb0xpc3RlbmVyID0gQGVkaXRvci5vbkRpZEluc2VydFRleHQgQHJlcGxhY2VNb2RlVW5kb0hhbmRsZXJcblxuICByZXBsYWNlTW9kZUluc2VydEhhbmRsZXI6IChldmVudCkgPT5cbiAgICBjaGFycyA9IGV2ZW50LnRleHQ/LnNwbGl0KCcnKSBvciBbXVxuICAgIHNlbGVjdGlvbnMgPSBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIGZvciBjaGFyIGluIGNoYXJzXG4gICAgICBjb250aW51ZSBpZiBjaGFyIGlzICdcXG4nXG4gICAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNcbiAgICAgICAgc2VsZWN0aW9uLmRlbGV0ZSgpIHVubGVzcyBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgIHJldHVyblxuXG4gIHJlcGxhY2VNb2RlVW5kb0hhbmRsZXI6IChldmVudCkgPT5cbiAgICBAcmVwbGFjZU1vZGVDb3VudGVyKytcblxuICByZXBsYWNlTW9kZVVuZG86IC0+XG4gICAgaWYgQHJlcGxhY2VNb2RlQ291bnRlciA+IDBcbiAgICAgIEBlZGl0b3IudW5kbygpXG4gICAgICBAZWRpdG9yLnVuZG8oKVxuICAgICAgQGVkaXRvci5tb3ZlTGVmdCgpXG4gICAgICBAcmVwbGFjZU1vZGVDb3VudGVyLS1cblxuICBzZXRJbnNlcnRpb25DaGVja3BvaW50OiAtPlxuICAgIEBpbnNlcnRpb25DaGVja3BvaW50ID0gQGVkaXRvci5jcmVhdGVDaGVja3BvaW50KCkgdW5sZXNzIEBpbnNlcnRpb25DaGVja3BvaW50P1xuXG4gIGRlYWN0aXZhdGVJbnNlcnRNb2RlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQG1vZGUgaW4gW251bGwsICdpbnNlcnQnXVxuICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC5zZXRJbnB1dEVuYWJsZWQoZmFsc2UpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgncmVwbGFjZS1tb2RlJylcbiAgICBAZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChAaW5zZXJ0aW9uQ2hlY2twb2ludClcbiAgICBjaGFuZ2VzID0gQGVkaXRvci5idWZmZXIuZ2V0Q2hhbmdlc1NpbmNlQ2hlY2twb2ludChAaW5zZXJ0aW9uQ2hlY2twb2ludClcbiAgICBpdGVtID0gQGlucHV0T3BlcmF0b3IoQGhpc3RvcnlbMF0pXG4gICAgQGluc2VydGlvbkNoZWNrcG9pbnQgPSBudWxsXG4gICAgaWYgaXRlbT9cbiAgICAgIGl0ZW0uY29uZmlybUNoYW5nZXMoY2hhbmdlcylcbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICBjdXJzb3IubW92ZUxlZnQoKSB1bmxlc3MgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgIGlmIEByZXBsYWNlTW9kZUxpc3RlbmVyP1xuICAgICAgQHJlcGxhY2VNb2RlTGlzdGVuZXIuZGlzcG9zZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUgQHJlcGxhY2VNb2RlTGlzdGVuZXJcbiAgICAgIEByZXBsYWNlTW9kZUxpc3RlbmVyID0gbnVsbFxuICAgICAgQHJlcGxhY2VNb2RlVW5kb0xpc3RlbmVyLmRpc3Bvc2UoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMucmVtb3ZlIEByZXBsYWNlTW9kZVVuZG9MaXN0ZW5lclxuICAgICAgQHJlcGxhY2VNb2RlVW5kb0xpc3RlbmVyID0gbnVsbFxuXG4gIGRlYWN0aXZhdGVWaXN1YWxNb2RlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KCkgdW5sZXNzIChzZWxlY3Rpb24uaXNFbXB0eSgpIG9yIHNlbGVjdGlvbi5pc1JldmVyc2VkKCkpXG5cbiAgIyBQcml2YXRlOiBHZXQgdGhlIGlucHV0IG9wZXJhdG9yIHRoYXQgbmVlZHMgdG8gYmUgdG9sZCBhYm91dCBhYm91dCB0aGVcbiAgIyB0eXBlZCB1bmRvIHRyYW5zYWN0aW9uIGluIGEgcmVjZW50bHkgY29tcGxldGVkIG9wZXJhdGlvbiwgaWYgdGhlcmVcbiAgIyBpcyBvbmUuXG4gIGlucHV0T3BlcmF0b3I6IChpdGVtKSAtPlxuICAgIHJldHVybiBpdGVtIHVubGVzcyBpdGVtP1xuICAgIHJldHVybiBpdGVtIGlmIGl0ZW0uaW5wdXRPcGVyYXRvcj8oKVxuICAgIHJldHVybiBpdGVtLmNvbXBvc2VkT2JqZWN0IGlmIGl0ZW0uY29tcG9zZWRPYmplY3Q/LmlucHV0T3BlcmF0b3I/KClcblxuICAjIFByaXZhdGU6IFVzZWQgdG8gZW5hYmxlIHZpc3VhbCBtb2RlLlxuICAjXG4gICMgdHlwZSAtIE9uZSBvZiAnY2hhcmFjdGVyd2lzZScsICdsaW5ld2lzZScgb3IgJ2Jsb2Nrd2lzZSdcbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgYWN0aXZhdGVWaXN1YWxNb2RlOiAodHlwZSkgLT5cbiAgICAjIEFscmVhZHkgaW4gJ3Zpc3VhbCcsIHRoaXMgbWVhbnMgb25lIG9mIGZvbGxvd2luZyBjb21tYW5kIGlzXG4gICAgIyBleGVjdXRlZCB3aXRoaW4gYHZpbS1tb2RlLnZpc3VhbC1tb2RlYFxuICAgICMgICogYWN0aXZhdGUtYmxvY2t3aXNlLXZpc3VhbC1tb2RlXG4gICAgIyAgKiBhY3RpdmF0ZS1jaGFyYWN0ZXJ3aXNlLXZpc3VhbC1tb2RlXG4gICAgIyAgKiBhY3RpdmF0ZS1saW5ld2lzZS12aXN1YWwtbW9kZVxuICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBpZiBAc3VibW9kZSBpcyB0eXBlXG4gICAgICAgIEBhY3RpdmF0ZU5vcm1hbE1vZGUoKVxuICAgICAgICByZXR1cm5cblxuICAgICAgQHN1Ym1vZGUgPSB0eXBlXG4gICAgICBpZiBAc3VibW9kZSBpcyAnbGluZXdpc2UnXG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICAjIEtlZXAgb3JpZ2luYWwgcmFuZ2UgYXMgbWFya2VyJ3MgcHJvcGVydHkgdG8gZ2V0IGJhY2tcbiAgICAgICAgICAjIHRvIGNoYXJhY3Rlcndpc2UuXG4gICAgICAgICAgIyBTaW5jZSBzZWxlY3RMaW5lIGxvc3Qgb3JpZ2luYWwgY3Vyc29yIGNvbHVtbi5cbiAgICAgICAgICBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgICAgICBzZWxlY3Rpb24ubWFya2VyLnNldFByb3BlcnRpZXMoe29yaWdpbmFsUmFuZ2V9KVxuICAgICAgICAgIFtzdGFydCwgZW5kXSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgICAgICAgc2VsZWN0aW9uLnNlbGVjdExpbmUocm93KSBmb3Igcm93IGluIFtzdGFydC4uZW5kXVxuXG4gICAgICBlbHNlIGlmIEBzdWJtb2RlIGluIFsnY2hhcmFjdGVyd2lzZScsICdibG9ja3dpc2UnXVxuICAgICAgICAjIEN1cnJlbnRseSwgJ2Jsb2Nrd2lzZScgaXMgbm90IHlldCBpbXBsZW1lbnRlZC5cbiAgICAgICAgIyBTbyB0cmVhdCBpdCBhcyBjaGFyYWN0ZXJ3aXNlLlxuICAgICAgICAjIFJlY292ZXIgb3JpZ2luYWwgcmFuZ2UuXG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICB7b3JpZ2luYWxSYW5nZX0gPSBzZWxlY3Rpb24ubWFya2VyLmdldFByb3BlcnRpZXMoKVxuICAgICAgICAgIGlmIG9yaWdpbmFsUmFuZ2VcbiAgICAgICAgICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgICAgICAgICBvcmlnaW5hbFJhbmdlLnN0YXJ0LnJvdyA9IHN0YXJ0Um93XG4gICAgICAgICAgICBvcmlnaW5hbFJhbmdlLmVuZC5yb3cgICA9IGVuZFJvd1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKG9yaWdpbmFsUmFuZ2UpXG4gICAgZWxzZVxuICAgICAgQGRlYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICAgIEBtb2RlID0gJ3Zpc3VhbCdcbiAgICAgIEBzdWJtb2RlID0gdHlwZVxuICAgICAgQGNoYW5nZU1vZGVDbGFzcygndmlzdWFsLW1vZGUnKVxuXG4gICAgICBpZiBAc3VibW9kZSBpcyAnbGluZXdpc2UnXG4gICAgICAgIEBlZGl0b3Iuc2VsZWN0TGluZXNDb250YWluaW5nQ3Vyc29ycygpXG4gICAgICBlbHNlIGlmIEBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkgaXMgJydcbiAgICAgICAgQGVkaXRvci5zZWxlY3RSaWdodCgpXG5cbiAgICBAdXBkYXRlU3RhdHVzQmFyKClcblxuICAjIFByaXZhdGU6IFVzZWQgdG8gcmUtZW5hYmxlIHZpc3VhbCBtb2RlXG4gIHJlc2V0VmlzdWFsTW9kZTogLT5cbiAgICBAYWN0aXZhdGVWaXN1YWxNb2RlKEBzdWJtb2RlKVxuXG4gICMgUHJpdmF0ZTogVXNlZCB0byBlbmFibGUgb3BlcmF0b3ItcGVuZGluZyBtb2RlLlxuICBhY3RpdmF0ZU9wZXJhdG9yUGVuZGluZ01vZGU6IC0+XG4gICAgQGRlYWN0aXZhdGVJbnNlcnRNb2RlKClcbiAgICBAbW9kZSA9ICdvcGVyYXRvci1wZW5kaW5nJ1xuICAgIEBzdWJtb2RlID0gbnVsbFxuICAgIEBjaGFuZ2VNb2RlQ2xhc3MoJ29wZXJhdG9yLXBlbmRpbmctbW9kZScpXG5cbiAgICBAdXBkYXRlU3RhdHVzQmFyKClcblxuICBjaGFuZ2VNb2RlQ2xhc3M6ICh0YXJnZXRNb2RlKSAtPlxuICAgIGZvciBtb2RlIGluIFsnbm9ybWFsLW1vZGUnLCAnaW5zZXJ0LW1vZGUnLCAndmlzdWFsLW1vZGUnLCAnb3BlcmF0b3ItcGVuZGluZy1tb2RlJ11cbiAgICAgIGlmIG1vZGUgaXMgdGFyZ2V0TW9kZVxuICAgICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKG1vZGUpXG4gICAgICBlbHNlXG4gICAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUobW9kZSlcblxuICAjIFByaXZhdGU6IFJlc2V0cyB0aGUgbm9ybWFsIG1vZGUgYmFjayB0byBpdCdzIGluaXRpYWwgc3RhdGUuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHJlc2V0Tm9ybWFsTW9kZTogLT5cbiAgICBAY2xlYXJPcFN0YWNrKClcbiAgICBAZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpXG4gICAgQGFjdGl2YXRlTm9ybWFsTW9kZSgpXG5cbiAgIyBQcml2YXRlOiBBIGdlbmVyaWMgd2F5IHRvIGNyZWF0ZSBhIFJlZ2lzdGVyIHByZWZpeCBiYXNlZCBvbiB0aGUgZXZlbnQuXG4gICNcbiAgIyBlIC0gVGhlIGV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBSZWdpc3RlciBwcmVmaXguXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHJlZ2lzdGVyUHJlZml4OiAoZSkgLT5cbiAgICBuZXcgUHJlZml4ZXMuUmVnaXN0ZXIoQHJlZ2lzdGVyTmFtZShlKSlcblxuICAjIFByaXZhdGU6IEdldHMgYSByZWdpc3RlciBuYW1lIGZyb20gYSBrZXlib2FyZCBldmVudFxuICAjXG4gICMgZSAtIFRoZSBldmVudFxuICAjXG4gICMgUmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgcmVnaXN0ZXJcbiAgcmVnaXN0ZXJOYW1lOiAoZSkgLT5cbiAgICBrZXlib2FyZEV2ZW50ID0gZS5vcmlnaW5hbEV2ZW50Py5vcmlnaW5hbEV2ZW50ID8gZS5vcmlnaW5hbEV2ZW50XG4gICAgbmFtZSA9IGF0b20ua2V5bWFwcy5rZXlzdHJva2VGb3JLZXlib2FyZEV2ZW50KGtleWJvYXJkRXZlbnQpXG4gICAgaWYgbmFtZS5sYXN0SW5kZXhPZignc2hpZnQtJywgMCkgaXMgMFxuICAgICAgbmFtZSA9IG5hbWUuc2xpY2UoNilcbiAgICBuYW1lXG5cbiAgIyBQcml2YXRlOiBBIGdlbmVyaWMgd2F5IHRvIGNyZWF0ZSBhIE51bWJlciBwcmVmaXggYmFzZWQgb24gdGhlIGV2ZW50LlxuICAjXG4gICMgZSAtIFRoZSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGUgTnVtYmVyIHByZWZpeC5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgcmVwZWF0UHJlZml4OiAoZSkgLT5cbiAgICBrZXlib2FyZEV2ZW50ID0gZS5vcmlnaW5hbEV2ZW50Py5vcmlnaW5hbEV2ZW50ID8gZS5vcmlnaW5hbEV2ZW50XG4gICAgbnVtID0gcGFyc2VJbnQoYXRvbS5rZXltYXBzLmtleXN0cm9rZUZvcktleWJvYXJkRXZlbnQoa2V5Ym9hcmRFdmVudCkpXG4gICAgaWYgQHRvcE9wZXJhdGlvbigpIGluc3RhbmNlb2YgUHJlZml4ZXMuUmVwZWF0XG4gICAgICBAdG9wT3BlcmF0aW9uKCkuYWRkRGlnaXQobnVtKVxuICAgIGVsc2VcbiAgICAgIGlmIG51bSBpcyAwXG4gICAgICAgIGUuYWJvcnRLZXlCaW5kaW5nKClcbiAgICAgIGVsc2VcbiAgICAgICAgQHB1c2hPcGVyYXRpb25zKG5ldyBQcmVmaXhlcy5SZXBlYXQobnVtKSlcblxuICByZXZlcnNlU2VsZWN0aW9uczogLT5cbiAgICByZXZlcnNlZCA9IG5vdCBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc1JldmVyc2VkKClcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2Uoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCksIHtyZXZlcnNlZH0pXG5cbiAgIyBQcml2YXRlOiBGaWd1cmUgb3V0IHdoZXRoZXIgb3Igbm90IHdlIGFyZSBpbiBhIHJlcGVhdCBzZXF1ZW5jZSBvciB3ZSBqdXN0XG4gICMgd2FudCB0byBtb3ZlIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUuIElmIHdlIGFyZSB3aXRoaW4gYSByZXBlYXRcbiAgIyBzZXF1ZW5jZSwgd2UgcGFzcyBjb250cm9sIG92ZXIgdG8gQHJlcGVhdFByZWZpeC5cbiAgI1xuICAjIGUgLSBUaGUgdHJpZ2dlcmVkIGV2ZW50LlxuICAjXG4gICMgUmV0dXJucyBuZXcgbW90aW9uIG9yIG5vdGhpbmcuXG4gIG1vdmVPclJlcGVhdDogKGUpIC0+XG4gICAgaWYgQHRvcE9wZXJhdGlvbigpIGluc3RhbmNlb2YgUHJlZml4ZXMuUmVwZWF0XG4gICAgICBAcmVwZWF0UHJlZml4KGUpXG4gICAgICBudWxsXG4gICAgZWxzZVxuICAgICAgbmV3IE1vdGlvbnMuTW92ZVRvQmVnaW5uaW5nT2ZMaW5lKEBlZGl0b3IsIHRoaXMpXG5cbiAgIyBQcml2YXRlOiBBIGdlbmVyaWMgd2F5IHRvIGhhbmRsZSBPcGVyYXRvcnMgdGhhdCBjYW4gYmUgcmVwZWF0ZWQgZm9yXG4gICMgdGhlaXIgbGluZXdpc2UgZm9ybS5cbiAgI1xuICAjIGNvbnN0cnVjdG9yIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBvcGVyYXRvci5cbiAgI1xuICAjIFJldHVybnMgbm90aGluZy5cbiAgbGluZXdpc2VBbGlhc2VkT3BlcmF0b3I6IChjb25zdHJ1Y3RvcikgLT5cbiAgICBpZiBAaXNPcGVyYXRvclBlbmRpbmcoY29uc3RydWN0b3IpXG4gICAgICBuZXcgTW90aW9ucy5Nb3ZlVG9SZWxhdGl2ZUxpbmUoQGVkaXRvciwgdGhpcylcbiAgICBlbHNlXG4gICAgICBuZXcgY29uc3RydWN0b3IoQGVkaXRvciwgdGhpcylcblxuICAjIFByaXZhdGU6IENoZWNrIGlmIHRoZXJlIGlzIGEgcGVuZGluZyBvcGVyYXRpb24gb2YgYSBjZXJ0YWluIHR5cGUsIG9yXG4gICMgaWYgdGhlcmUgaXMgYW55IHBlbmRpbmcgb3BlcmF0aW9uLCBpZiBubyB0eXBlIGdpdmVuLlxuICAjXG4gICMgY29uc3RydWN0b3IgLSBUaGUgY29uc3RydWN0b3Igb2YgdGhlIG9iamVjdCB0eXBlIHlvdSdyZSBsb29raW5nIGZvci5cbiAgI1xuICBpc09wZXJhdG9yUGVuZGluZzogKGNvbnN0cnVjdG9yKSAtPlxuICAgIGlmIGNvbnN0cnVjdG9yP1xuICAgICAgZm9yIG9wIGluIEBvcFN0YWNrXG4gICAgICAgIHJldHVybiBvcCBpZiBvcCBpbnN0YW5jZW9mIGNvbnN0cnVjdG9yXG4gICAgICBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBvcFN0YWNrLmxlbmd0aCA+IDBcblxuICB1cGRhdGVTdGF0dXNCYXI6IC0+XG4gICAgQHN0YXR1c0Jhck1hbmFnZXIudXBkYXRlKEBtb2RlLCBAc3VibW9kZSlcblxuICAjIFByaXZhdGU6IGluc2VydCB0aGUgY29udGVudHMgb2YgdGhlIHJlZ2lzdGVyIGluIHRoZSBlZGl0b3JcbiAgI1xuICAjIG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgcmVnaXN0ZXIgdG8gaW5zZXJ0XG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIGluc2VydFJlZ2lzdGVyOiAobmFtZSkgLT5cbiAgICB0ZXh0ID0gQGdldFJlZ2lzdGVyKG5hbWUpPy50ZXh0XG4gICAgQGVkaXRvci5pbnNlcnRUZXh0KHRleHQpIGlmIHRleHQ/XG5cbiAgIyBQcml2YXRlOiBlbnN1cmUgdGhlIG1vZGUgZm9sbG93cyB0aGUgc3RhdGUgb2Ygc2VsZWN0aW9uc1xuICBjaGVja1NlbGVjdGlvbnM6ID0+XG4gICAgcmV0dXJuIHVubGVzcyBAZWRpdG9yP1xuICAgIGlmIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmV2ZXJ5KChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5pc0VtcHR5KCkpXG4gICAgICBAZW5zdXJlQ3Vyc29yc1dpdGhpbkxpbmUoKSBpZiBAbW9kZSBpcyAnbm9ybWFsJ1xuICAgICAgQGFjdGl2YXRlTm9ybWFsTW9kZSgpIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgZWxzZVxuICAgICAgQGFjdGl2YXRlVmlzdWFsTW9kZSgnY2hhcmFjdGVyd2lzZScpIGlmIEBtb2RlIGlzICdub3JtYWwnXG5cbiAgIyBQcml2YXRlOiBlbnN1cmUgdGhlIGN1cnNvciBzdGF5cyB3aXRoaW4gdGhlIGxpbmUgYXMgYXBwcm9wcmlhdGVcbiAgZW5zdXJlQ3Vyc29yc1dpdGhpbkxpbmU6ID0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAge2dvYWxDb2x1bW59ID0gY3Vyc29yXG4gICAgICBpZiBjdXJzb3IuaXNBdEVuZE9mTGluZSgpIGFuZCBub3QgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgICAgICBjdXJzb3IubW92ZUxlZnQoKVxuICAgICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBnb2FsQ29sdW1uXG5cbiAgICBAZWRpdG9yLm1lcmdlQ3Vyc29ycygpXG4iXX0=
