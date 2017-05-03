(function() {
  var CompositeDisposable, Cursor, DecorationManager, Disposable, Emitter, Grim, GutterContainer, LanguageMode, Model, Point, Range, Selection, TextBuffer, TextEditor, TextEditorElement, TextMateScopeSelector, TokenizedBuffer, ZERO_WIDTH_NBSP, _, fs, isDoubleWidthCharacter, isHalfWidthCharacter, isKoreanCharacter, isWrapBoundary, path, ref, ref1, ref2,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require('underscore-plus');

  path = require('path');

  fs = require('fs-plus');

  Grim = require('grim');

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable, Emitter = ref.Emitter;

  ref1 = TextBuffer = require('text-buffer'), Point = ref1.Point, Range = ref1.Range;

  LanguageMode = require('./language-mode');

  DecorationManager = require('./decoration-manager');

  TokenizedBuffer = require('./tokenized-buffer');

  Cursor = require('./cursor');

  Model = require('./model');

  Selection = require('./selection');

  TextMateScopeSelector = require('first-mate').ScopeSelector;

  GutterContainer = require('./gutter-container');

  TextEditorElement = require('./text-editor-element');

  ref2 = require('./text-utils'), isDoubleWidthCharacter = ref2.isDoubleWidthCharacter, isHalfWidthCharacter = ref2.isHalfWidthCharacter, isKoreanCharacter = ref2.isKoreanCharacter, isWrapBoundary = ref2.isWrapBoundary;

  ZERO_WIDTH_NBSP = '\ufeff';

  module.exports = TextEditor = (function(superClass) {
    extend(TextEditor, superClass);

    TextEditor.setClipboard = function(clipboard) {
      return this.clipboard = clipboard;
    };

    TextEditor.prototype.serializationVersion = 1;

    TextEditor.prototype.buffer = null;

    TextEditor.prototype.languageMode = null;

    TextEditor.prototype.cursors = null;

    TextEditor.prototype.selections = null;

    TextEditor.prototype.suppressSelectionMerging = false;

    TextEditor.prototype.selectionFlashDuration = 500;

    TextEditor.prototype.gutterContainer = null;

    TextEditor.prototype.editorElement = null;

    TextEditor.prototype.verticalScrollMargin = 2;

    TextEditor.prototype.horizontalScrollMargin = 6;

    TextEditor.prototype.softWrapped = null;

    TextEditor.prototype.editorWidthInChars = null;

    TextEditor.prototype.lineHeightInPixels = null;

    TextEditor.prototype.defaultCharWidth = null;

    TextEditor.prototype.height = null;

    TextEditor.prototype.width = null;

    TextEditor.prototype.registered = false;

    TextEditor.prototype.atomicSoftTabs = true;

    TextEditor.prototype.invisibles = null;

    TextEditor.prototype.showLineNumbers = true;

    TextEditor.prototype.scrollSensitivity = 40;

    Object.defineProperty(TextEditor.prototype, "element", {
      get: function() {
        return this.getElement();
      }
    });

    Object.defineProperty(TextEditor.prototype, 'displayBuffer', {
      get: function() {
        Grim.deprecate("`TextEditor.prototype.displayBuffer` has always been private, but now\nit is gone. Reading the `displayBuffer` property now returns a reference\nto the containing `TextEditor`, which now provides *some* of the API of\nthe defunct `DisplayBuffer` class.");
        return this;
      }
    });

    TextEditor.deserialize = function(state, atomEnvironment) {
      var disposable, editor, error;
      if (state.version !== this.prototype.serializationVersion && (state.displayBuffer != null)) {
        state.tokenizedBuffer = state.displayBuffer.tokenizedBuffer;
      }
      try {
        state.tokenizedBuffer = TokenizedBuffer.deserialize(state.tokenizedBuffer, atomEnvironment);
        state.tabLength = state.tokenizedBuffer.getTabLength();
      } catch (error1) {
        error = error1;
        if (error.syscall === 'read') {
          return;
        } else {
          throw error;
        }
      }
      state.buffer = state.tokenizedBuffer.buffer;
      if (state.displayLayer = state.buffer.getDisplayLayer(state.displayLayerId)) {
        state.selectionsMarkerLayer = state.displayLayer.getMarkerLayer(state.selectionsMarkerLayerId);
      }
      state.assert = atomEnvironment.assert.bind(atomEnvironment);
      editor = new this(state);
      if (state.registered) {
        disposable = atomEnvironment.textEditors.add(editor);
        editor.onDidDestroy(function() {
          return disposable.dispose();
        });
      }
      return editor;
    };

    function TextEditor(params) {
      var displayLayerParams, grammar, initialColumn, initialLine, j, len, lineNumberGutterVisible, marker, ref3, ref4, ref5, suppressCursorCreation, tabLength;
      if (params == null) {
        params = {};
      }
      this.doBackgroundWork = bind(this.doBackgroundWork, this);
      if (this.constructor.clipboard == null) {
        throw new Error("Must call TextEditor.setClipboard at least once before creating TextEditor instances");
      }
      TextEditor.__super__.constructor.apply(this, arguments);
      this.softTabs = params.softTabs, this.firstVisibleScreenRow = params.firstVisibleScreenRow, this.firstVisibleScreenColumn = params.firstVisibleScreenColumn, initialLine = params.initialLine, initialColumn = params.initialColumn, tabLength = params.tabLength, this.softWrapped = params.softWrapped, this.decorationManager = params.decorationManager, this.selectionsMarkerLayer = params.selectionsMarkerLayer, this.buffer = params.buffer, suppressCursorCreation = params.suppressCursorCreation, this.mini = params.mini, this.placeholderText = params.placeholderText, lineNumberGutterVisible = params.lineNumberGutterVisible, this.largeFileMode = params.largeFileMode, this.assert = params.assert, grammar = params.grammar, this.showInvisibles = params.showInvisibles, this.autoHeight = params.autoHeight, this.autoWidth = params.autoWidth, this.scrollPastEnd = params.scrollPastEnd, this.editorWidthInChars = params.editorWidthInChars, this.tokenizedBuffer = params.tokenizedBuffer, this.displayLayer = params.displayLayer, this.invisibles = params.invisibles, this.showIndentGuide = params.showIndentGuide, this.softWrapped = params.softWrapped, this.softWrapAtPreferredLineLength = params.softWrapAtPreferredLineLength, this.preferredLineLength = params.preferredLineLength;
      if (this.assert == null) {
        this.assert = function(condition) {
          return condition;
        };
      }
      if (this.firstVisibleScreenRow == null) {
        this.firstVisibleScreenRow = 0;
      }
      if (this.firstVisibleScreenColumn == null) {
        this.firstVisibleScreenColumn = 0;
      }
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.cursors = [];
      this.cursorsByMarkerId = new Map;
      this.selections = [];
      this.hasTerminatedPendingState = false;
      if (this.mini == null) {
        this.mini = false;
      }
      if (this.scrollPastEnd == null) {
        this.scrollPastEnd = false;
      }
      if (this.showInvisibles == null) {
        this.showInvisibles = true;
      }
      if (this.softTabs == null) {
        this.softTabs = true;
      }
      if (tabLength == null) {
        tabLength = 2;
      }
      if (this.autoIndent == null) {
        this.autoIndent = true;
      }
      if (this.autoIndentOnPaste == null) {
        this.autoIndentOnPaste = true;
      }
      if (this.undoGroupingInterval == null) {
        this.undoGroupingInterval = 300;
      }
      if (this.nonWordCharacters == null) {
        this.nonWordCharacters = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-…";
      }
      if (this.softWrapped == null) {
        this.softWrapped = false;
      }
      if (this.softWrapAtPreferredLineLength == null) {
        this.softWrapAtPreferredLineLength = false;
      }
      if (this.preferredLineLength == null) {
        this.preferredLineLength = 80;
      }
      if (this.buffer == null) {
        this.buffer = new TextBuffer;
      }
      if (this.tokenizedBuffer == null) {
        this.tokenizedBuffer = new TokenizedBuffer({
          grammar: grammar,
          tabLength: tabLength,
          buffer: this.buffer,
          largeFileMode: this.largeFileMode,
          assert: this.assert
        });
      }
      displayLayerParams = {
        invisibles: this.getInvisibles(),
        softWrapColumn: this.getSoftWrapColumn(),
        showIndentGuides: !this.isMini() && this.doesShowIndentGuide(),
        atomicSoftTabs: (ref3 = params.atomicSoftTabs) != null ? ref3 : true,
        tabLength: tabLength,
        ratioForCharacter: this.ratioForCharacter.bind(this),
        isWrapBoundary: isWrapBoundary,
        foldCharacter: ZERO_WIDTH_NBSP,
        softWrapHangingIndent: (ref4 = params.softWrapHangingIndentLength) != null ? ref4 : 0
      };
      if (this.displayLayer != null) {
        this.displayLayer.reset(displayLayerParams);
      } else {
        this.displayLayer = this.buffer.addDisplayLayer(displayLayerParams);
      }
      this.backgroundWorkHandle = requestIdleCallback(this.doBackgroundWork);
      this.disposables.add(new Disposable((function(_this) {
        return function() {
          if (_this.backgroundWorkHandle != null) {
            return cancelIdleCallback(_this.backgroundWorkHandle);
          }
        };
      })(this)));
      this.displayLayer.setTextDecorationLayer(this.tokenizedBuffer);
      this.defaultMarkerLayer = this.displayLayer.addMarkerLayer();
      if (this.selectionsMarkerLayer == null) {
        this.selectionsMarkerLayer = this.addMarkerLayer({
          maintainHistory: true,
          persistent: true
        });
      }
      this.decorationManager = new DecorationManager(this.displayLayer, this.defaultMarkerLayer);
      this.decorateMarkerLayer(this.displayLayer.foldsMarkerLayer, {
        type: 'line-number',
        "class": 'folded'
      });
      ref5 = this.selectionsMarkerLayer.getMarkers();
      for (j = 0, len = ref5.length; j < len; j++) {
        marker = ref5[j];
        this.addSelection(marker);
      }
      this.subscribeToBuffer();
      this.subscribeToDisplayLayer();
      if (this.cursors.length === 0 && !suppressCursorCreation) {
        initialLine = Math.max(parseInt(initialLine) || 0, 0);
        initialColumn = Math.max(parseInt(initialColumn) || 0, 0);
        this.addCursorAtBufferPosition([initialLine, initialColumn]);
      }
      this.languageMode = new LanguageMode(this);
      this.gutterContainer = new GutterContainer(this);
      this.lineNumberGutter = this.gutterContainer.addGutter({
        name: 'line-number',
        priority: 0,
        visible: lineNumberGutterVisible
      });
    }

    TextEditor.prototype.doBackgroundWork = function(deadline) {
      var ref3;
      if (this.displayLayer.doBackgroundWork(deadline)) {
        if ((ref3 = this.presenter) != null) {
          ref3.updateVerticalDimensions();
        }
        return this.backgroundWorkHandle = requestIdleCallback(this.doBackgroundWork);
      } else {
        return this.backgroundWorkHandle = null;
      }
    };

    TextEditor.prototype.update = function(params) {
      var currentSoftWrapColumn, displayLayerParams, j, len, param, ref3, ref4, ref5, ref6, ref7, softWrapColumn, value;
      currentSoftWrapColumn = this.getSoftWrapColumn();
      displayLayerParams = {};
      ref3 = Object.keys(params);
      for (j = 0, len = ref3.length; j < len; j++) {
        param = ref3[j];
        value = params[param];
        switch (param) {
          case 'autoIndent':
            this.autoIndent = value;
            break;
          case 'autoIndentOnPaste':
            this.autoIndentOnPaste = value;
            break;
          case 'undoGroupingInterval':
            this.undoGroupingInterval = value;
            break;
          case 'nonWordCharacters':
            this.nonWordCharacters = value;
            break;
          case 'scrollSensitivity':
            this.scrollSensitivity = value;
            break;
          case 'encoding':
            this.buffer.setEncoding(value);
            break;
          case 'softTabs':
            if (value !== this.softTabs) {
              this.softTabs = value;
            }
            break;
          case 'atomicSoftTabs':
            if (value !== this.displayLayer.atomicSoftTabs) {
              displayLayerParams.atomicSoftTabs = value;
            }
            break;
          case 'tabLength':
            if ((value != null) && value !== this.tokenizedBuffer.getTabLength()) {
              this.tokenizedBuffer.setTabLength(value);
              displayLayerParams.tabLength = value;
            }
            break;
          case 'softWrapped':
            if (value !== this.softWrapped) {
              this.softWrapped = value;
              displayLayerParams.softWrapColumn = this.getSoftWrapColumn();
              this.emitter.emit('did-change-soft-wrapped', this.isSoftWrapped());
            }
            break;
          case 'softWrapHangingIndentLength':
            if (value !== this.displayLayer.softWrapHangingIndent) {
              displayLayerParams.softWrapHangingIndent = value;
            }
            break;
          case 'softWrapAtPreferredLineLength':
            if (value !== this.softWrapAtPreferredLineLength) {
              this.softWrapAtPreferredLineLength = value;
              softWrapColumn = this.getSoftWrapColumn();
              if (softWrapColumn !== currentSoftWrapColumn) {
                displayLayerParams.softWrapColumn = softWrapColumn;
              }
            }
            break;
          case 'preferredLineLength':
            if (value !== this.preferredLineLength) {
              this.preferredLineLength = value;
              softWrapColumn = this.getSoftWrapColumn();
              if (softWrapColumn !== currentSoftWrapColumn) {
                displayLayerParams.softWrapColumn = softWrapColumn;
              }
            }
            break;
          case 'mini':
            if (value !== this.mini) {
              this.mini = value;
              this.emitter.emit('did-change-mini', value);
              displayLayerParams.invisibles = this.getInvisibles();
              displayLayerParams.showIndentGuides = this.doesShowIndentGuide();
            }
            break;
          case 'placeholderText':
            if (value !== this.placeholderText) {
              this.placeholderText = value;
              this.emitter.emit('did-change-placeholder-text', value);
            }
            break;
          case 'lineNumberGutterVisible':
            if (value !== this.lineNumberGutterVisible) {
              if (value) {
                this.lineNumberGutter.show();
              } else {
                this.lineNumberGutter.hide();
              }
              this.emitter.emit('did-change-line-number-gutter-visible', this.lineNumberGutter.isVisible());
            }
            break;
          case 'showIndentGuide':
            if (value !== this.showIndentGuide) {
              this.showIndentGuide = value;
              displayLayerParams.showIndentGuides = this.doesShowIndentGuide();
            }
            break;
          case 'showLineNumbers':
            if (value !== this.showLineNumbers) {
              this.showLineNumbers = value;
              if ((ref4 = this.presenter) != null) {
                ref4.didChangeShowLineNumbers();
              }
            }
            break;
          case 'showInvisibles':
            if (value !== this.showInvisibles) {
              this.showInvisibles = value;
              displayLayerParams.invisibles = this.getInvisibles();
            }
            break;
          case 'invisibles':
            if (!_.isEqual(value, this.invisibles)) {
              this.invisibles = value;
              displayLayerParams.invisibles = this.getInvisibles();
            }
            break;
          case 'editorWidthInChars':
            if (value > 0 && value !== this.editorWidthInChars) {
              this.editorWidthInChars = value;
              softWrapColumn = this.getSoftWrapColumn();
              if (softWrapColumn !== currentSoftWrapColumn) {
                displayLayerParams.softWrapColumn = softWrapColumn;
              }
            }
            break;
          case 'width':
            if (value !== this.width) {
              this.width = value;
              softWrapColumn = this.getSoftWrapColumn();
              if (softWrapColumn !== currentSoftWrapColumn) {
                displayLayerParams.softWrapColumn = softWrapColumn;
              }
            }
            break;
          case 'scrollPastEnd':
            if (value !== this.scrollPastEnd) {
              this.scrollPastEnd = value;
              if ((ref5 = this.presenter) != null) {
                ref5.didChangeScrollPastEnd();
              }
            }
            break;
          case 'autoHeight':
            if (value !== this.autoHeight) {
              this.autoHeight = value;
              if ((ref6 = this.presenter) != null) {
                ref6.setAutoHeight(this.autoHeight);
              }
            }
            break;
          case 'autoWidth':
            if (value !== this.autoWidth) {
              this.autoWidth = value;
              if ((ref7 = this.presenter) != null) {
                ref7.didChangeAutoWidth();
              }
            }
            break;
          default:
            throw new TypeError("Invalid TextEditor parameter: '" + param + "'");
        }
      }
      if (Object.keys(displayLayerParams).length > 0) {
        this.displayLayer.reset(displayLayerParams);
      }
      if (this.editorElement != null) {
        return this.editorElement.views.getNextUpdatePromise();
      } else {
        return Promise.resolve();
      }
    };

    TextEditor.prototype.serialize = function() {
      var tokenizedBufferState;
      tokenizedBufferState = this.tokenizedBuffer.serialize();
      return {
        deserializer: 'TextEditor',
        version: this.serializationVersion,
        displayBuffer: {
          tokenizedBuffer: tokenizedBufferState
        },
        tokenizedBuffer: tokenizedBufferState,
        displayLayerId: this.displayLayer.id,
        selectionsMarkerLayerId: this.selectionsMarkerLayer.id,
        firstVisibleScreenRow: this.getFirstVisibleScreenRow(),
        firstVisibleScreenColumn: this.getFirstVisibleScreenColumn(),
        atomicSoftTabs: this.displayLayer.atomicSoftTabs,
        softWrapHangingIndentLength: this.displayLayer.softWrapHangingIndent,
        id: this.id,
        softTabs: this.softTabs,
        softWrapped: this.softWrapped,
        softWrapAtPreferredLineLength: this.softWrapAtPreferredLineLength,
        preferredLineLength: this.preferredLineLength,
        mini: this.mini,
        editorWidthInChars: this.editorWidthInChars,
        width: this.width,
        largeFileMode: this.largeFileMode,
        registered: this.registered,
        invisibles: this.invisibles,
        showInvisibles: this.showInvisibles,
        showIndentGuide: this.showIndentGuide,
        autoHeight: this.autoHeight,
        autoWidth: this.autoWidth
      };
    };

    TextEditor.prototype.subscribeToBuffer = function() {
      this.buffer.retain();
      this.disposables.add(this.buffer.onDidChangePath((function(_this) {
        return function() {
          _this.emitter.emit('did-change-title', _this.getTitle());
          return _this.emitter.emit('did-change-path', _this.getPath());
        };
      })(this)));
      this.disposables.add(this.buffer.onDidChangeEncoding((function(_this) {
        return function() {
          return _this.emitter.emit('did-change-encoding', _this.getEncoding());
        };
      })(this)));
      this.disposables.add(this.buffer.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
      this.disposables.add(this.buffer.onDidChangeModified((function(_this) {
        return function() {
          if (!_this.hasTerminatedPendingState && _this.buffer.isModified()) {
            return _this.terminatePendingState();
          }
        };
      })(this)));
      return this.preserveCursorPositionOnBufferReload();
    };

    TextEditor.prototype.terminatePendingState = function() {
      if (!this.hasTerminatedPendingState) {
        this.emitter.emit('did-terminate-pending-state');
      }
      return this.hasTerminatedPendingState = true;
    };

    TextEditor.prototype.onDidTerminatePendingState = function(callback) {
      return this.emitter.on('did-terminate-pending-state', callback);
    };

    TextEditor.prototype.subscribeToDisplayLayer = function() {
      this.disposables.add(this.selectionsMarkerLayer.onDidCreateMarker(this.addSelection.bind(this)));
      this.disposables.add(this.tokenizedBuffer.onDidChangeGrammar(this.handleGrammarChange.bind(this)));
      this.disposables.add(this.displayLayer.onDidChangeSync((function(_this) {
        return function(e) {
          _this.mergeIntersectingSelections();
          return _this.emitter.emit('did-change', e);
        };
      })(this)));
      return this.disposables.add(this.displayLayer.onDidReset((function(_this) {
        return function() {
          _this.mergeIntersectingSelections();
          return _this.emitter.emit('did-change', {});
        };
      })(this)));
    };

    TextEditor.prototype.destroyed = function() {
      var j, len, ref3, selection;
      this.disposables.dispose();
      this.displayLayer.destroy();
      this.disposables.dispose();
      this.tokenizedBuffer.destroy();
      ref3 = this.selections.slice();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        selection.destroy();
      }
      this.selectionsMarkerLayer.destroy();
      this.buffer.release();
      this.languageMode.destroy();
      this.gutterContainer.destroy();
      return this.emitter.emit('did-destroy');
    };


    /*
    Section: Event Subscription
     */

    TextEditor.prototype.onDidChangeTitle = function(callback) {
      return this.emitter.on('did-change-title', callback);
    };

    TextEditor.prototype.onDidChangePath = function(callback) {
      return this.emitter.on('did-change-path', callback);
    };

    TextEditor.prototype.onDidChange = function(callback) {
      return this.emitter.on('did-change', callback);
    };

    TextEditor.prototype.onDidStopChanging = function(callback) {
      return this.getBuffer().onDidStopChanging(callback);
    };

    TextEditor.prototype.onDidChangeCursorPosition = function(callback) {
      return this.emitter.on('did-change-cursor-position', callback);
    };

    TextEditor.prototype.onDidChangeSelectionRange = function(callback) {
      return this.emitter.on('did-change-selection-range', callback);
    };

    TextEditor.prototype.onDidChangeSoftWrapped = function(callback) {
      return this.emitter.on('did-change-soft-wrapped', callback);
    };

    TextEditor.prototype.onDidChangeEncoding = function(callback) {
      return this.emitter.on('did-change-encoding', callback);
    };

    TextEditor.prototype.observeGrammar = function(callback) {
      callback(this.getGrammar());
      return this.onDidChangeGrammar(callback);
    };

    TextEditor.prototype.onDidChangeGrammar = function(callback) {
      return this.emitter.on('did-change-grammar', callback);
    };

    TextEditor.prototype.onDidChangeModified = function(callback) {
      return this.getBuffer().onDidChangeModified(callback);
    };

    TextEditor.prototype.onDidConflict = function(callback) {
      return this.getBuffer().onDidConflict(callback);
    };

    TextEditor.prototype.onWillInsertText = function(callback) {
      return this.emitter.on('will-insert-text', callback);
    };

    TextEditor.prototype.onDidInsertText = function(callback) {
      return this.emitter.on('did-insert-text', callback);
    };

    TextEditor.prototype.onDidSave = function(callback) {
      return this.getBuffer().onDidSave(callback);
    };

    TextEditor.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    TextEditor.prototype.observeCursors = function(callback) {
      var cursor, j, len, ref3;
      ref3 = this.getCursors();
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        callback(cursor);
      }
      return this.onDidAddCursor(callback);
    };

    TextEditor.prototype.onDidAddCursor = function(callback) {
      return this.emitter.on('did-add-cursor', callback);
    };

    TextEditor.prototype.onDidRemoveCursor = function(callback) {
      return this.emitter.on('did-remove-cursor', callback);
    };

    TextEditor.prototype.observeSelections = function(callback) {
      var j, len, ref3, selection;
      ref3 = this.getSelections();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        callback(selection);
      }
      return this.onDidAddSelection(callback);
    };

    TextEditor.prototype.onDidAddSelection = function(callback) {
      return this.emitter.on('did-add-selection', callback);
    };

    TextEditor.prototype.onDidRemoveSelection = function(callback) {
      return this.emitter.on('did-remove-selection', callback);
    };

    TextEditor.prototype.observeDecorations = function(callback) {
      return this.decorationManager.observeDecorations(callback);
    };

    TextEditor.prototype.onDidAddDecoration = function(callback) {
      return this.decorationManager.onDidAddDecoration(callback);
    };

    TextEditor.prototype.onDidRemoveDecoration = function(callback) {
      return this.decorationManager.onDidRemoveDecoration(callback);
    };

    TextEditor.prototype.onDidChangePlaceholderText = function(callback) {
      return this.emitter.on('did-change-placeholder-text', callback);
    };

    TextEditor.prototype.onDidChangeFirstVisibleScreenRow = function(callback, fromView) {
      return this.emitter.on('did-change-first-visible-screen-row', callback);
    };

    TextEditor.prototype.onDidChangeScrollTop = function(callback) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::onDidChangeScrollTop instead.");
      return this.getElement().onDidChangeScrollTop(callback);
    };

    TextEditor.prototype.onDidChangeScrollLeft = function(callback) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::onDidChangeScrollLeft instead.");
      return this.getElement().onDidChangeScrollLeft(callback);
    };

    TextEditor.prototype.onDidRequestAutoscroll = function(callback) {
      return this.emitter.on('did-request-autoscroll', callback);
    };

    TextEditor.prototype.onDidChangeIcon = function(callback) {
      return this.emitter.on('did-change-icon', callback);
    };

    TextEditor.prototype.onDidUpdateDecorations = function(callback) {
      return this.decorationManager.onDidUpdateDecorations(callback);
    };

    TextEditor.prototype.getBuffer = function() {
      return this.buffer;
    };

    TextEditor.prototype.getURI = function() {
      return this.buffer.getUri();
    };

    TextEditor.prototype.copy = function() {
      var displayLayer, selectionsMarkerLayer, softTabs;
      displayLayer = this.displayLayer.copy();
      selectionsMarkerLayer = displayLayer.getMarkerLayer(this.buffer.getMarkerLayer(this.selectionsMarkerLayer.id).copy().id);
      softTabs = this.getSoftTabs();
      return new TextEditor({
        buffer: this.buffer,
        selectionsMarkerLayer: selectionsMarkerLayer,
        softTabs: softTabs,
        suppressCursorCreation: true,
        tabLength: this.tokenizedBuffer.getTabLength(),
        firstVisibleScreenRow: this.firstVisibleScreenRow,
        firstVisibleScreenColumn: this.firstVisibleScreenColumn,
        assert: this.assert,
        displayLayer: displayLayer,
        grammar: this.getGrammar(),
        autoWidth: this.autoWidth,
        autoHeight: this.autoHeight
      });
    };

    TextEditor.prototype.setVisible = function(visible) {
      return this.tokenizedBuffer.setVisible(visible);
    };

    TextEditor.prototype.setMini = function(mini) {
      this.update({
        mini: mini
      });
      return this.mini;
    };

    TextEditor.prototype.isMini = function() {
      return this.mini;
    };

    TextEditor.prototype.setUpdatedSynchronously = function(updatedSynchronously) {
      return this.decorationManager.setUpdatedSynchronously(updatedSynchronously);
    };

    TextEditor.prototype.onDidChangeMini = function(callback) {
      return this.emitter.on('did-change-mini', callback);
    };

    TextEditor.prototype.setLineNumberGutterVisible = function(lineNumberGutterVisible) {
      return this.update({
        lineNumberGutterVisible: lineNumberGutterVisible
      });
    };

    TextEditor.prototype.isLineNumberGutterVisible = function() {
      return this.lineNumberGutter.isVisible();
    };

    TextEditor.prototype.onDidChangeLineNumberGutterVisible = function(callback) {
      return this.emitter.on('did-change-line-number-gutter-visible', callback);
    };

    TextEditor.prototype.observeGutters = function(callback) {
      return this.gutterContainer.observeGutters(callback);
    };

    TextEditor.prototype.onDidAddGutter = function(callback) {
      return this.gutterContainer.onDidAddGutter(callback);
    };

    TextEditor.prototype.onDidRemoveGutter = function(callback) {
      return this.gutterContainer.onDidRemoveGutter(callback);
    };

    TextEditor.prototype.setEditorWidthInChars = function(editorWidthInChars) {
      return this.update({
        editorWidthInChars: editorWidthInChars
      });
    };

    TextEditor.prototype.getEditorWidthInChars = function() {
      if ((this.width != null) && this.defaultCharWidth > 0) {
        return Math.max(0, Math.floor(this.width / this.defaultCharWidth));
      } else {
        return this.editorWidthInChars;
      }
    };


    /*
    Section: File Details
     */

    TextEditor.prototype.getTitle = function() {
      var ref3;
      return (ref3 = this.getFileName()) != null ? ref3 : 'untitled';
    };

    TextEditor.prototype.getLongTitle = function() {
      var allPathSegments, commonBase, directoryPath, fileName, firstSegment, j, k, len, len1, ourPathSegments, pathSegments, ref3, textEditor;
      if (this.getPath()) {
        fileName = this.getFileName();
        allPathSegments = [];
        ref3 = atom.workspace.getTextEditors();
        for (j = 0, len = ref3.length; j < len; j++) {
          textEditor = ref3[j];
          if (textEditor !== this) {
            if (textEditor.getFileName() === fileName) {
              directoryPath = fs.tildify(textEditor.getDirectoryPath());
              allPathSegments.push(directoryPath.split(path.sep));
            }
          }
        }
        if (allPathSegments.length === 0) {
          return fileName;
        }
        ourPathSegments = fs.tildify(this.getDirectoryPath()).split(path.sep);
        allPathSegments.push(ourPathSegments);
        while (true) {
          firstSegment = ourPathSegments[0];
          commonBase = _.all(allPathSegments, function(pathSegments) {
            return pathSegments.length > 1 && pathSegments[0] === firstSegment;
          });
          if (commonBase) {
            for (k = 0, len1 = allPathSegments.length; k < len1; k++) {
              pathSegments = allPathSegments[k];
              pathSegments.shift();
            }
          } else {
            break;
          }
        }
        return fileName + " \u2014 " + (path.join.apply(path, pathSegments));
      } else {
        return 'untitled';
      }
    };

    TextEditor.prototype.getPath = function() {
      return this.buffer.getPath();
    };

    TextEditor.prototype.getFileName = function() {
      var fullPath;
      if (fullPath = this.getPath()) {
        return path.basename(fullPath);
      } else {
        return null;
      }
    };

    TextEditor.prototype.getDirectoryPath = function() {
      var fullPath;
      if (fullPath = this.getPath()) {
        return path.dirname(fullPath);
      } else {
        return null;
      }
    };

    TextEditor.prototype.getEncoding = function() {
      return this.buffer.getEncoding();
    };

    TextEditor.prototype.setEncoding = function(encoding) {
      return this.buffer.setEncoding(encoding);
    };

    TextEditor.prototype.isModified = function() {
      return this.buffer.isModified();
    };

    TextEditor.prototype.isEmpty = function() {
      return this.buffer.isEmpty();
    };


    /*
    Section: File Operations
     */

    TextEditor.prototype.save = function() {
      return this.buffer.save();
    };

    TextEditor.prototype.saveAs = function(filePath) {
      return this.buffer.saveAs(filePath);
    };

    TextEditor.prototype.shouldPromptToSave = function(arg) {
      var projectHasPaths, ref3, windowCloseRequested;
      ref3 = arg != null ? arg : {}, windowCloseRequested = ref3.windowCloseRequested, projectHasPaths = ref3.projectHasPaths;
      if (windowCloseRequested && projectHasPaths) {
        return false;
      } else {
        return this.isModified() && !this.buffer.hasMultipleEditors();
      }
    };

    TextEditor.prototype.getSaveDialogOptions = function() {
      return {};
    };


    /*
    Section: Reading Text
     */

    TextEditor.prototype.getText = function() {
      return this.buffer.getText();
    };

    TextEditor.prototype.getTextInBufferRange = function(range) {
      return this.buffer.getTextInRange(range);
    };

    TextEditor.prototype.getLineCount = function() {
      return this.buffer.getLineCount();
    };

    TextEditor.prototype.getScreenLineCount = function() {
      return this.displayLayer.getScreenLineCount();
    };

    TextEditor.prototype.getApproximateScreenLineCount = function() {
      return this.displayLayer.getApproximateScreenLineCount();
    };

    TextEditor.prototype.getLastBufferRow = function() {
      return this.buffer.getLastRow();
    };

    TextEditor.prototype.getLastScreenRow = function() {
      return this.getScreenLineCount() - 1;
    };

    TextEditor.prototype.lineTextForBufferRow = function(bufferRow) {
      return this.buffer.lineForRow(bufferRow);
    };

    TextEditor.prototype.lineTextForScreenRow = function(screenRow) {
      var ref3;
      return (ref3 = this.screenLineForScreenRow(screenRow)) != null ? ref3.lineText : void 0;
    };

    TextEditor.prototype.logScreenLines = function(start, end) {
      var j, line, ref3, ref4, row;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = this.getLastScreenRow();
      }
      for (row = j = ref3 = start, ref4 = end; ref3 <= ref4 ? j <= ref4 : j >= ref4; row = ref3 <= ref4 ? ++j : --j) {
        line = this.lineTextForScreenRow(row);
        console.log(row, this.bufferRowForScreenRow(row), line, line.length);
      }
    };

    TextEditor.prototype.tokensForScreenRow = function(screenRow) {
      var currentTokenScopes, j, len, lineText, lineTextIndex, ref3, tagCode, tagCodes, tokens;
      tokens = [];
      lineTextIndex = 0;
      currentTokenScopes = [];
      ref3 = this.screenLineForScreenRow(screenRow), lineText = ref3.lineText, tagCodes = ref3.tagCodes;
      for (j = 0, len = tagCodes.length; j < len; j++) {
        tagCode = tagCodes[j];
        if (this.displayLayer.isOpenTagCode(tagCode)) {
          currentTokenScopes.push(this.displayLayer.tagForCode(tagCode));
        } else if (this.displayLayer.isCloseTagCode(tagCode)) {
          currentTokenScopes.pop();
        } else {
          tokens.push({
            text: lineText.substr(lineTextIndex, tagCode),
            scopes: currentTokenScopes.slice()
          });
          lineTextIndex += tagCode;
        }
      }
      return tokens;
    };

    TextEditor.prototype.screenLineForScreenRow = function(screenRow) {
      return this.displayLayer.getScreenLines(screenRow, screenRow + 1)[0];
    };

    TextEditor.prototype.bufferRowForScreenRow = function(screenRow) {
      return this.displayLayer.translateScreenPosition(Point(screenRow, 0)).row;
    };

    TextEditor.prototype.bufferRowsForScreenRows = function(startScreenRow, endScreenRow) {
      var j, ref3, ref4, results, screenRow;
      results = [];
      for (screenRow = j = ref3 = startScreenRow, ref4 = endScreenRow; ref3 <= ref4 ? j <= ref4 : j >= ref4; screenRow = ref3 <= ref4 ? ++j : --j) {
        results.push(this.bufferRowForScreenRow(screenRow));
      }
      return results;
    };

    TextEditor.prototype.screenRowForBufferRow = function(row) {
      if (this.largeFileMode) {
        return row;
      } else {
        return this.displayLayer.translateBufferPosition(Point(row, 0)).row;
      }
    };

    TextEditor.prototype.getRightmostScreenPosition = function() {
      return this.displayLayer.getRightmostScreenPosition();
    };

    TextEditor.prototype.getApproximateRightmostScreenPosition = function() {
      return this.displayLayer.getApproximateRightmostScreenPosition();
    };

    TextEditor.prototype.getMaxScreenLineLength = function() {
      return this.getRightmostScreenPosition().column;
    };

    TextEditor.prototype.getLongestScreenRow = function() {
      return this.getRightmostScreenPosition().row;
    };

    TextEditor.prototype.getApproximateLongestScreenRow = function() {
      return this.getApproximateRightmostScreenPosition().row;
    };

    TextEditor.prototype.lineLengthForScreenRow = function(screenRow) {
      return this.displayLayer.lineLengthForScreenRow(screenRow);
    };

    TextEditor.prototype.bufferRangeForBufferRow = function(row, arg) {
      var includeNewline;
      includeNewline = (arg != null ? arg : {}).includeNewline;
      return this.buffer.rangeForRow(row, includeNewline);
    };

    TextEditor.prototype.getTextInRange = function(range) {
      return this.buffer.getTextInRange(range);
    };

    TextEditor.prototype.isBufferRowBlank = function(bufferRow) {
      return this.buffer.isRowBlank(bufferRow);
    };

    TextEditor.prototype.nextNonBlankBufferRow = function(bufferRow) {
      return this.buffer.nextNonBlankRow(bufferRow);
    };

    TextEditor.prototype.getEofBufferPosition = function() {
      return this.buffer.getEndPosition();
    };

    TextEditor.prototype.getCurrentParagraphBufferRange = function() {
      return this.getLastCursor().getCurrentParagraphBufferRange();
    };


    /*
    Section: Mutating Text
     */

    TextEditor.prototype.setText = function(text) {
      return this.buffer.setText(text);
    };

    TextEditor.prototype.setTextInBufferRange = function(range, text, options) {
      return this.getBuffer().setTextInRange(range, text, options);
    };

    TextEditor.prototype.insertText = function(text, options) {
      var groupingInterval;
      if (options == null) {
        options = {};
      }
      if (!this.emitWillInsertTextEvent(text)) {
        return false;
      }
      groupingInterval = options.groupUndo ? this.undoGroupingInterval : 0;
      if (options.autoIndentNewline == null) {
        options.autoIndentNewline = this.shouldAutoIndent();
      }
      if (options.autoDecreaseIndent == null) {
        options.autoDecreaseIndent = this.shouldAutoIndent();
      }
      return this.mutateSelectedText((function(_this) {
        return function(selection) {
          var didInsertEvent, range;
          range = selection.insertText(text, options);
          didInsertEvent = {
            text: text,
            range: range
          };
          _this.emitter.emit('did-insert-text', didInsertEvent);
          return range;
        };
      })(this), groupingInterval);
    };

    TextEditor.prototype.insertNewline = function() {
      return this.insertText('\n');
    };

    TextEditor.prototype["delete"] = function() {
      return this.mutateSelectedText(function(selection) {
        return selection["delete"]();
      });
    };

    TextEditor.prototype.backspace = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.backspace();
      });
    };

    TextEditor.prototype.mutateSelectedText = function(fn, groupingInterval) {
      if (groupingInterval == null) {
        groupingInterval = 0;
      }
      return this.mergeIntersectingSelections((function(_this) {
        return function() {
          return _this.transact(groupingInterval, function() {
            var index, j, len, ref3, results, selection;
            ref3 = _this.getSelectionsOrderedByBufferPosition();
            results = [];
            for (index = j = 0, len = ref3.length; j < len; index = ++j) {
              selection = ref3[index];
              results.push(fn(selection, index));
            }
            return results;
          });
        };
      })(this));
    };

    TextEditor.prototype.moveLineUp = function() {
      var selections;
      selections = this.getSelectedBufferRanges().sort(function(a, b) {
        return a.compare(b);
      });
      if (selections[0].start.row === 0) {
        return;
      }
      if (selections[selections.length - 1].start.row === this.getLastBufferRow() && this.buffer.getLastLine() === '') {
        return;
      }
      return this.transact((function(_this) {
        return function() {
          var endRow, insertDelta, j, k, len, len1, lines, linesRange, newSelectionRanges, precedingRow, rangeToRefold, rangesToRefold, ref3, selection, selectionsToMove, startRow;
          newSelectionRanges = [];
          while (selections.length > 0) {
            selection = selections.shift();
            selectionsToMove = [selection];
            while (selection.end.row === ((ref3 = selections[0]) != null ? ref3.start.row : void 0)) {
              selectionsToMove.push(selections[0]);
              selection.end.row = selections[0].end.row;
              selections.shift();
            }
            startRow = selection.start.row;
            endRow = selection.end.row;
            if (selection.end.row > selection.start.row && selection.end.column === 0) {
              endRow--;
            }
            startRow = _this.displayLayer.lineStartBoundaryForBufferRow(startRow).bufferRow;
            endRow = _this.displayLayer.lineEndBoundaryForBufferRow(endRow).bufferRow;
            linesRange = new Range(Point(startRow, 0), Point(endRow, 0));
            precedingRow = _this.displayLayer.lineStartBoundaryForBufferRow(startRow - 1).bufferRow;
            insertDelta = linesRange.start.row - precedingRow;
            rangesToRefold = _this.displayLayer.destroyFoldsIntersectingBufferRange(linesRange).map(function(range) {
              return range.translate([-insertDelta, 0]);
            });
            lines = _this.buffer.getTextInRange(linesRange);
            if (lines[lines.length - 1] !== '\n') {
              lines += _this.buffer.lineEndingForRow(linesRange.end.row - 1);
            }
            _this.buffer["delete"](linesRange);
            _this.buffer.insert([precedingRow, 0], lines);
            for (j = 0, len = rangesToRefold.length; j < len; j++) {
              rangeToRefold = rangesToRefold[j];
              _this.displayLayer.foldBufferRange(rangeToRefold);
            }
            for (k = 0, len1 = selectionsToMove.length; k < len1; k++) {
              selection = selectionsToMove[k];
              newSelectionRanges.push(selection.translate([-insertDelta, 0]));
            }
          }
          _this.setSelectedBufferRanges(newSelectionRanges, {
            autoscroll: false,
            preserveFolds: true
          });
          if (_this.shouldAutoIndent()) {
            _this.autoIndentSelectedRows();
          }
          return _this.scrollToBufferPosition([newSelectionRanges[0].start.row, 0]);
        };
      })(this));
    };

    TextEditor.prototype.moveLineDown = function() {
      var selections;
      selections = this.getSelectedBufferRanges();
      selections.sort(function(a, b) {
        return a.compare(b);
      });
      selections = selections.reverse();
      return this.transact((function(_this) {
        return function() {
          var endRow, followingRow, insertDelta, j, k, len, len1, lines, linesRange, newSelectionRanges, rangeToRefold, rangesToRefold, ref3, selection, selectionsToMove, startRow;
          _this.consolidateSelections();
          newSelectionRanges = [];
          while (selections.length > 0) {
            selection = selections.shift();
            selectionsToMove = [selection];
            while (selection.start.row === ((ref3 = selections[0]) != null ? ref3.end.row : void 0)) {
              selectionsToMove.push(selections[0]);
              selection.start.row = selections[0].start.row;
              selections.shift();
            }
            startRow = selection.start.row;
            endRow = selection.end.row;
            if (selection.end.row > selection.start.row && selection.end.column === 0) {
              endRow--;
            }
            startRow = _this.displayLayer.lineStartBoundaryForBufferRow(startRow).bufferRow;
            endRow = _this.displayLayer.lineEndBoundaryForBufferRow(endRow).bufferRow;
            linesRange = new Range(Point(startRow, 0), Point(endRow, 0));
            followingRow = _this.displayLayer.lineEndBoundaryForBufferRow(endRow).bufferRow;
            insertDelta = followingRow - linesRange.end.row;
            rangesToRefold = _this.displayLayer.destroyFoldsIntersectingBufferRange(linesRange).map(function(range) {
              return range.translate([insertDelta, 0]);
            });
            lines = _this.buffer.getTextInRange(linesRange);
            if (followingRow - 1 === _this.buffer.getLastRow()) {
              lines = "\n" + lines;
            }
            _this.buffer.insert([followingRow, 0], lines);
            _this.buffer["delete"](linesRange);
            for (j = 0, len = rangesToRefold.length; j < len; j++) {
              rangeToRefold = rangesToRefold[j];
              _this.displayLayer.foldBufferRange(rangeToRefold);
            }
            for (k = 0, len1 = selectionsToMove.length; k < len1; k++) {
              selection = selectionsToMove[k];
              newSelectionRanges.push(selection.translate([insertDelta, 0]));
            }
          }
          _this.setSelectedBufferRanges(newSelectionRanges, {
            autoscroll: false,
            preserveFolds: true
          });
          if (_this.shouldAutoIndent()) {
            _this.autoIndentSelectedRows();
          }
          return _this.scrollToBufferPosition([newSelectionRanges[0].start.row - 1, 0]);
        };
      })(this));
    };

    TextEditor.prototype.moveSelectionLeft = function() {
      var noSelectionAtStartOfLine, selections, translatedRanges, translationDelta;
      selections = this.getSelectedBufferRanges();
      noSelectionAtStartOfLine = selections.every(function(selection) {
        return selection.start.column !== 0;
      });
      translationDelta = [0, -1];
      translatedRanges = [];
      if (noSelectionAtStartOfLine) {
        return this.transact((function(_this) {
          return function() {
            var charTextToLeftOfSelection, charToLeftOfSelection, j, len, selection;
            for (j = 0, len = selections.length; j < len; j++) {
              selection = selections[j];
              charToLeftOfSelection = new Range(selection.start.translate(translationDelta), selection.start);
              charTextToLeftOfSelection = _this.buffer.getTextInRange(charToLeftOfSelection);
              _this.buffer.insert(selection.end, charTextToLeftOfSelection);
              _this.buffer["delete"](charToLeftOfSelection);
              translatedRanges.push(selection.translate(translationDelta));
            }
            return _this.setSelectedBufferRanges(translatedRanges);
          };
        })(this));
      }
    };

    TextEditor.prototype.moveSelectionRight = function() {
      var noSelectionAtEndOfLine, selections, translatedRanges, translationDelta;
      selections = this.getSelectedBufferRanges();
      noSelectionAtEndOfLine = selections.every((function(_this) {
        return function(selection) {
          return selection.end.column !== _this.buffer.lineLengthForRow(selection.end.row);
        };
      })(this));
      translationDelta = [0, 1];
      translatedRanges = [];
      if (noSelectionAtEndOfLine) {
        return this.transact((function(_this) {
          return function() {
            var charTextToRightOfSelection, charToRightOfSelection, j, len, selection;
            for (j = 0, len = selections.length; j < len; j++) {
              selection = selections[j];
              charToRightOfSelection = new Range(selection.end, selection.end.translate(translationDelta));
              charTextToRightOfSelection = _this.buffer.getTextInRange(charToRightOfSelection);
              _this.buffer["delete"](charToRightOfSelection);
              _this.buffer.insert(selection.start, charTextToRightOfSelection);
              translatedRanges.push(selection.translate(translationDelta));
            }
            return _this.setSelectedBufferRanges(translatedRanges);
          };
        })(this));
      }
    };

    TextEditor.prototype.duplicateLines = function() {
      return this.transact((function(_this) {
        return function() {
          var delta, endRow, fold, foldRange, intersectingFolds, j, k, len, len1, rangeToDuplicate, ref3, ref4, selectedBufferRange, selection, start, startRow, textToDuplicate;
          ref3 = _this.getSelectionsOrderedByBufferPosition().reverse();
          for (j = 0, len = ref3.length; j < len; j++) {
            selection = ref3[j];
            selectedBufferRange = selection.getBufferRange();
            if (selection.isEmpty()) {
              start = selection.getScreenRange().start;
              selection.setScreenRange([[start.row, 0], [start.row + 1, 0]], {
                preserveFolds: true
              });
            }
            ref4 = selection.getBufferRowRange(), startRow = ref4[0], endRow = ref4[1];
            endRow++;
            intersectingFolds = _this.displayLayer.foldsIntersectingBufferRange([[startRow, 0], [endRow, 0]]);
            rangeToDuplicate = [[startRow, 0], [endRow, 0]];
            textToDuplicate = _this.getTextInBufferRange(rangeToDuplicate);
            if (endRow > _this.getLastBufferRow()) {
              textToDuplicate = '\n' + textToDuplicate;
            }
            _this.buffer.insert([endRow, 0], textToDuplicate);
            delta = endRow - startRow;
            selection.setBufferRange(selectedBufferRange.translate([delta, 0]));
            for (k = 0, len1 = intersectingFolds.length; k < len1; k++) {
              fold = intersectingFolds[k];
              foldRange = _this.displayLayer.bufferRangeForFold(fold);
              _this.displayLayer.foldBufferRange(foldRange.translate([delta, 0]));
            }
          }
        };
      })(this));
    };

    TextEditor.prototype.replaceSelectedText = function(options, fn) {
      var selectWordIfEmpty;
      if (options == null) {
        options = {};
      }
      selectWordIfEmpty = options.selectWordIfEmpty;
      return this.mutateSelectedText(function(selection) {
        var range, text;
        range = selection.getBufferRange();
        if (selectWordIfEmpty && selection.isEmpty()) {
          selection.selectWord();
        }
        text = selection.getText();
        selection.deleteSelectedText();
        selection.insertText(fn(text));
        return selection.setBufferRange(range);
      });
    };

    TextEditor.prototype.splitSelectionsIntoLines = function() {
      return this.mergeIntersectingSelections((function(_this) {
        return function() {
          var end, j, len, range, ref3, row, selection, start;
          ref3 = _this.getSelections();
          for (j = 0, len = ref3.length; j < len; j++) {
            selection = ref3[j];
            range = selection.getBufferRange();
            if (range.isSingleLine()) {
              continue;
            }
            start = range.start, end = range.end;
            _this.addSelectionForBufferRange([start, [start.row, 2e308]]);
            row = start.row;
            while (++row < end.row) {
              _this.addSelectionForBufferRange([[row, 0], [row, 2e308]]);
            }
            if (end.column !== 0) {
              _this.addSelectionForBufferRange([[end.row, 0], [end.row, end.column]]);
            }
            selection.destroy();
          }
        };
      })(this));
    };

    TextEditor.prototype.transpose = function() {
      return this.mutateSelectedText(function(selection) {
        var text;
        if (selection.isEmpty()) {
          selection.selectRight();
          text = selection.getText();
          selection["delete"]();
          selection.cursor.moveLeft();
          return selection.insertText(text);
        } else {
          return selection.insertText(selection.getText().split('').reverse().join(''));
        }
      });
    };

    TextEditor.prototype.upperCase = function() {
      return this.replaceSelectedText({
        selectWordIfEmpty: true
      }, function(text) {
        return text.toUpperCase();
      });
    };

    TextEditor.prototype.lowerCase = function() {
      return this.replaceSelectedText({
        selectWordIfEmpty: true
      }, function(text) {
        return text.toLowerCase();
      });
    };

    TextEditor.prototype.toggleLineCommentsInSelection = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.toggleLineComments();
      });
    };

    TextEditor.prototype.joinLines = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.joinLines();
      });
    };

    TextEditor.prototype.insertNewlineBelow = function() {
      return this.transact((function(_this) {
        return function() {
          _this.moveToEndOfLine();
          return _this.insertNewline();
        };
      })(this));
    };

    TextEditor.prototype.insertNewlineAbove = function() {
      return this.transact((function(_this) {
        return function() {
          var bufferRow, indentLevel, onFirstLine;
          bufferRow = _this.getCursorBufferPosition().row;
          indentLevel = _this.indentationForBufferRow(bufferRow);
          onFirstLine = bufferRow === 0;
          _this.moveToBeginningOfLine();
          _this.moveLeft();
          _this.insertNewline();
          if (_this.shouldAutoIndent() && _this.indentationForBufferRow(bufferRow) < indentLevel) {
            _this.setIndentationForBufferRow(bufferRow, indentLevel);
          }
          if (onFirstLine) {
            _this.moveUp();
            return _this.moveToEndOfLine();
          }
        };
      })(this));
    };

    TextEditor.prototype.deleteToBeginningOfWord = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToBeginningOfWord();
      });
    };

    TextEditor.prototype.deleteToPreviousWordBoundary = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToPreviousWordBoundary();
      });
    };

    TextEditor.prototype.deleteToNextWordBoundary = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToNextWordBoundary();
      });
    };

    TextEditor.prototype.deleteToBeginningOfSubword = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToBeginningOfSubword();
      });
    };

    TextEditor.prototype.deleteToEndOfSubword = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToEndOfSubword();
      });
    };

    TextEditor.prototype.deleteToBeginningOfLine = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToBeginningOfLine();
      });
    };

    TextEditor.prototype.deleteToEndOfLine = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToEndOfLine();
      });
    };

    TextEditor.prototype.deleteToEndOfWord = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.deleteToEndOfWord();
      });
    };

    TextEditor.prototype.deleteLine = function() {
      this.mergeSelectionsOnSameRows();
      return this.mutateSelectedText(function(selection) {
        return selection.deleteLine();
      });
    };


    /*
    Section: History
     */

    TextEditor.prototype.undo = function() {
      this.avoidMergingSelections((function(_this) {
        return function() {
          return _this.buffer.undo();
        };
      })(this));
      return this.getLastSelection().autoscroll();
    };

    TextEditor.prototype.redo = function() {
      this.avoidMergingSelections((function(_this) {
        return function() {
          return _this.buffer.redo();
        };
      })(this));
      return this.getLastSelection().autoscroll();
    };

    TextEditor.prototype.transact = function(groupingInterval, fn) {
      return this.buffer.transact(groupingInterval, fn);
    };

    TextEditor.prototype.beginTransaction = function(groupingInterval) {
      Grim.deprecate('Transactions should be performed via TextEditor::transact only');
      return this.buffer.beginTransaction(groupingInterval);
    };

    TextEditor.prototype.commitTransaction = function() {
      Grim.deprecate('Transactions should be performed via TextEditor::transact only');
      return this.buffer.commitTransaction();
    };

    TextEditor.prototype.abortTransaction = function() {
      return this.buffer.abortTransaction();
    };

    TextEditor.prototype.createCheckpoint = function() {
      return this.buffer.createCheckpoint();
    };

    TextEditor.prototype.revertToCheckpoint = function(checkpoint) {
      return this.buffer.revertToCheckpoint(checkpoint);
    };

    TextEditor.prototype.groupChangesSinceCheckpoint = function(checkpoint) {
      return this.buffer.groupChangesSinceCheckpoint(checkpoint);
    };


    /*
    Section: TextEditor Coordinates
     */

    TextEditor.prototype.screenPositionForBufferPosition = function(bufferPosition, options) {
      if ((options != null ? options.clip : void 0) != null) {
        Grim.deprecate("The `clip` parameter has been deprecated and will be removed soon. Please, use `clipDirection` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.clip;
        }
      }
      if ((options != null ? options.wrapAtSoftNewlines : void 0) != null) {
        Grim.deprecate("The `wrapAtSoftNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapAtSoftNewlines ? 'forward' : 'backward';
        }
      }
      if ((options != null ? options.wrapBeyondNewlines : void 0) != null) {
        Grim.deprecate("The `wrapBeyondNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapBeyondNewlines ? 'forward' : 'backward';
        }
      }
      return this.displayLayer.translateBufferPosition(bufferPosition, options);
    };

    TextEditor.prototype.bufferPositionForScreenPosition = function(screenPosition, options) {
      if ((options != null ? options.clip : void 0) != null) {
        Grim.deprecate("The `clip` parameter has been deprecated and will be removed soon. Please, use `clipDirection` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.clip;
        }
      }
      if ((options != null ? options.wrapAtSoftNewlines : void 0) != null) {
        Grim.deprecate("The `wrapAtSoftNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapAtSoftNewlines ? 'forward' : 'backward';
        }
      }
      if ((options != null ? options.wrapBeyondNewlines : void 0) != null) {
        Grim.deprecate("The `wrapBeyondNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapBeyondNewlines ? 'forward' : 'backward';
        }
      }
      return this.displayLayer.translateScreenPosition(screenPosition, options);
    };

    TextEditor.prototype.screenRangeForBufferRange = function(bufferRange, options) {
      var end, start;
      bufferRange = Range.fromObject(bufferRange);
      start = this.screenPositionForBufferPosition(bufferRange.start, options);
      end = this.screenPositionForBufferPosition(bufferRange.end, options);
      return new Range(start, end);
    };

    TextEditor.prototype.bufferRangeForScreenRange = function(screenRange) {
      var end, start;
      screenRange = Range.fromObject(screenRange);
      start = this.bufferPositionForScreenPosition(screenRange.start);
      end = this.bufferPositionForScreenPosition(screenRange.end);
      return new Range(start, end);
    };

    TextEditor.prototype.clipBufferPosition = function(bufferPosition) {
      return this.buffer.clipPosition(bufferPosition);
    };

    TextEditor.prototype.clipBufferRange = function(range) {
      return this.buffer.clipRange(range);
    };

    TextEditor.prototype.clipScreenPosition = function(screenPosition, options) {
      if ((options != null ? options.clip : void 0) != null) {
        Grim.deprecate("The `clip` parameter has been deprecated and will be removed soon. Please, use `clipDirection` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.clip;
        }
      }
      if ((options != null ? options.wrapAtSoftNewlines : void 0) != null) {
        Grim.deprecate("The `wrapAtSoftNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapAtSoftNewlines ? 'forward' : 'backward';
        }
      }
      if ((options != null ? options.wrapBeyondNewlines : void 0) != null) {
        Grim.deprecate("The `wrapBeyondNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapBeyondNewlines ? 'forward' : 'backward';
        }
      }
      return this.displayLayer.clipScreenPosition(screenPosition, options);
    };

    TextEditor.prototype.clipScreenRange = function(screenRange, options) {
      var end, start;
      screenRange = Range.fromObject(screenRange);
      start = this.displayLayer.clipScreenPosition(screenRange.start, options);
      end = this.displayLayer.clipScreenPosition(screenRange.end, options);
      return Range(start, end);
    };


    /*
    Section: Decorations
     */

    TextEditor.prototype.decorateMarker = function(marker, decorationParams) {
      return this.decorationManager.decorateMarker(marker, decorationParams);
    };

    TextEditor.prototype.decorateMarkerLayer = function(markerLayer, decorationParams) {
      return this.decorationManager.decorateMarkerLayer(markerLayer, decorationParams);
    };

    TextEditor.prototype.decorationsForScreenRowRange = function(startScreenRow, endScreenRow) {
      return this.decorationManager.decorationsForScreenRowRange(startScreenRow, endScreenRow);
    };

    TextEditor.prototype.decorationsStateForScreenRowRange = function(startScreenRow, endScreenRow) {
      return this.decorationManager.decorationsStateForScreenRowRange(startScreenRow, endScreenRow);
    };

    TextEditor.prototype.getDecorations = function(propertyFilter) {
      return this.decorationManager.getDecorations(propertyFilter);
    };

    TextEditor.prototype.getLineDecorations = function(propertyFilter) {
      return this.decorationManager.getLineDecorations(propertyFilter);
    };

    TextEditor.prototype.getLineNumberDecorations = function(propertyFilter) {
      return this.decorationManager.getLineNumberDecorations(propertyFilter);
    };

    TextEditor.prototype.getHighlightDecorations = function(propertyFilter) {
      return this.decorationManager.getHighlightDecorations(propertyFilter);
    };

    TextEditor.prototype.getOverlayDecorations = function(propertyFilter) {
      return this.decorationManager.getOverlayDecorations(propertyFilter);
    };

    TextEditor.prototype.decorationForId = function(id) {
      return this.decorationManager.decorationForId(id);
    };

    TextEditor.prototype.decorationsForMarkerId = function(id) {
      return this.decorationManager.decorationsForMarkerId(id);
    };


    /*
    Section: Markers
     */

    TextEditor.prototype.markBufferRange = function(bufferRange, options) {
      return this.defaultMarkerLayer.markBufferRange(bufferRange, options);
    };

    TextEditor.prototype.markScreenRange = function(screenRange, options) {
      return this.defaultMarkerLayer.markScreenRange(screenRange, options);
    };

    TextEditor.prototype.markBufferPosition = function(bufferPosition, options) {
      return this.defaultMarkerLayer.markBufferPosition(bufferPosition, options);
    };

    TextEditor.prototype.markScreenPosition = function(screenPosition, options) {
      return this.defaultMarkerLayer.markScreenPosition(screenPosition, options);
    };

    TextEditor.prototype.findMarkers = function(params) {
      return this.defaultMarkerLayer.findMarkers(params);
    };

    TextEditor.prototype.getMarker = function(id) {
      return this.defaultMarkerLayer.getMarker(id);
    };

    TextEditor.prototype.getMarkers = function() {
      return this.defaultMarkerLayer.getMarkers();
    };

    TextEditor.prototype.getMarkerCount = function() {
      return this.defaultMarkerLayer.getMarkerCount();
    };

    TextEditor.prototype.destroyMarker = function(id) {
      var ref3;
      return (ref3 = this.getMarker(id)) != null ? ref3.destroy() : void 0;
    };

    TextEditor.prototype.addMarkerLayer = function(options) {
      return this.displayLayer.addMarkerLayer(options);
    };

    TextEditor.prototype.getMarkerLayer = function(id) {
      return this.displayLayer.getMarkerLayer(id);
    };

    TextEditor.prototype.getDefaultMarkerLayer = function() {
      return this.defaultMarkerLayer;
    };


    /*
    Section: Cursors
     */

    TextEditor.prototype.getCursorBufferPosition = function() {
      return this.getLastCursor().getBufferPosition();
    };

    TextEditor.prototype.getCursorBufferPositions = function() {
      var cursor, j, len, ref3, results;
      ref3 = this.getCursors();
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        results.push(cursor.getBufferPosition());
      }
      return results;
    };

    TextEditor.prototype.setCursorBufferPosition = function(position, options) {
      return this.moveCursors(function(cursor) {
        return cursor.setBufferPosition(position, options);
      });
    };

    TextEditor.prototype.getCursorAtScreenPosition = function(position) {
      var cursor, j, len, ref3;
      ref3 = this.cursors;
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        if (cursor.getScreenPosition().isEqual(position)) {
          return cursor;
        }
      }
      return void 0;
    };

    TextEditor.prototype.getCursorScreenPosition = function() {
      return this.getLastCursor().getScreenPosition();
    };

    TextEditor.prototype.getCursorScreenPositions = function() {
      var cursor, j, len, ref3, results;
      ref3 = this.getCursors();
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        results.push(cursor.getScreenPosition());
      }
      return results;
    };

    TextEditor.prototype.setCursorScreenPosition = function(position, options) {
      if ((options != null ? options.clip : void 0) != null) {
        Grim.deprecate("The `clip` parameter has been deprecated and will be removed soon. Please, use `clipDirection` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.clip;
        }
      }
      if ((options != null ? options.wrapAtSoftNewlines : void 0) != null) {
        Grim.deprecate("The `wrapAtSoftNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapAtSoftNewlines ? 'forward' : 'backward';
        }
      }
      if ((options != null ? options.wrapBeyondNewlines : void 0) != null) {
        Grim.deprecate("The `wrapBeyondNewlines` parameter has been deprecated and will be removed soon. Please, use `clipDirection: 'forward'` instead.");
        if (options.clipDirection == null) {
          options.clipDirection = options.wrapBeyondNewlines ? 'forward' : 'backward';
        }
      }
      return this.moveCursors(function(cursor) {
        return cursor.setScreenPosition(position, options);
      });
    };

    TextEditor.prototype.addCursorAtBufferPosition = function(bufferPosition, options) {
      this.selectionsMarkerLayer.markBufferPosition(bufferPosition, {
        invalidate: 'never'
      });
      if ((options != null ? options.autoscroll : void 0) !== false) {
        this.getLastSelection().cursor.autoscroll();
      }
      return this.getLastSelection().cursor;
    };

    TextEditor.prototype.addCursorAtScreenPosition = function(screenPosition, options) {
      this.selectionsMarkerLayer.markScreenPosition(screenPosition, {
        invalidate: 'never'
      });
      if ((options != null ? options.autoscroll : void 0) !== false) {
        this.getLastSelection().cursor.autoscroll();
      }
      return this.getLastSelection().cursor;
    };

    TextEditor.prototype.hasMultipleCursors = function() {
      return this.getCursors().length > 1;
    };

    TextEditor.prototype.moveUp = function(lineCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveUp(lineCount, {
          moveToEndOfSelection: true
        });
      });
    };

    TextEditor.prototype.moveDown = function(lineCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveDown(lineCount, {
          moveToEndOfSelection: true
        });
      });
    };

    TextEditor.prototype.moveLeft = function(columnCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveLeft(columnCount, {
          moveToEndOfSelection: true
        });
      });
    };

    TextEditor.prototype.moveRight = function(columnCount) {
      return this.moveCursors(function(cursor) {
        return cursor.moveRight(columnCount, {
          moveToEndOfSelection: true
        });
      });
    };

    TextEditor.prototype.moveToBeginningOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfLine();
      });
    };

    TextEditor.prototype.moveToBeginningOfScreenLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfScreenLine();
      });
    };

    TextEditor.prototype.moveToFirstCharacterOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToFirstCharacterOfLine();
      });
    };

    TextEditor.prototype.moveToEndOfLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfLine();
      });
    };

    TextEditor.prototype.moveToEndOfScreenLine = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfScreenLine();
      });
    };

    TextEditor.prototype.moveToBeginningOfWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfWord();
      });
    };

    TextEditor.prototype.moveToEndOfWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToEndOfWord();
      });
    };

    TextEditor.prototype.moveToTop = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToTop();
      });
    };

    TextEditor.prototype.moveToBottom = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBottom();
      });
    };

    TextEditor.prototype.moveToBeginningOfNextWord = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfNextWord();
      });
    };

    TextEditor.prototype.moveToPreviousWordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToPreviousWordBoundary();
      });
    };

    TextEditor.prototype.moveToNextWordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToNextWordBoundary();
      });
    };

    TextEditor.prototype.moveToPreviousSubwordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToPreviousSubwordBoundary();
      });
    };

    TextEditor.prototype.moveToNextSubwordBoundary = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToNextSubwordBoundary();
      });
    };

    TextEditor.prototype.moveToBeginningOfNextParagraph = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfNextParagraph();
      });
    };

    TextEditor.prototype.moveToBeginningOfPreviousParagraph = function() {
      return this.moveCursors(function(cursor) {
        return cursor.moveToBeginningOfPreviousParagraph();
      });
    };

    TextEditor.prototype.getLastCursor = function() {
      this.createLastSelectionIfNeeded();
      return _.last(this.cursors);
    };

    TextEditor.prototype.getWordUnderCursor = function(options) {
      return this.getTextInBufferRange(this.getLastCursor().getCurrentWordBufferRange(options));
    };

    TextEditor.prototype.getCursors = function() {
      this.createLastSelectionIfNeeded();
      return this.cursors.slice();
    };

    TextEditor.prototype.getCursorsOrderedByBufferPosition = function() {
      return this.getCursors().sort(function(a, b) {
        return a.compare(b);
      });
    };

    TextEditor.prototype.cursorsForScreenRowRange = function(startScreenRow, endScreenRow) {
      var cursor, cursors, j, len, marker, ref3;
      cursors = [];
      ref3 = this.selectionsMarkerLayer.findMarkers({
        intersectsScreenRowRange: [startScreenRow, endScreenRow]
      });
      for (j = 0, len = ref3.length; j < len; j++) {
        marker = ref3[j];
        if (cursor = this.cursorsByMarkerId.get(marker.id)) {
          cursors.push(cursor);
        }
      }
      return cursors;
    };

    TextEditor.prototype.addCursor = function(marker) {
      var cursor;
      cursor = new Cursor({
        editor: this,
        marker: marker
      });
      this.cursors.push(cursor);
      this.cursorsByMarkerId.set(marker.id, cursor);
      this.decorateMarker(marker, {
        type: 'line-number',
        "class": 'cursor-line'
      });
      this.decorateMarker(marker, {
        type: 'line-number',
        "class": 'cursor-line-no-selection',
        onlyHead: true,
        onlyEmpty: true
      });
      this.decorateMarker(marker, {
        type: 'line',
        "class": 'cursor-line',
        onlyEmpty: true
      });
      this.emitter.emit('did-add-cursor', cursor);
      return cursor;
    };

    TextEditor.prototype.moveCursors = function(fn) {
      var cursor, j, len, ref3;
      ref3 = this.getCursors();
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        fn(cursor);
      }
      return this.mergeCursors();
    };

    TextEditor.prototype.cursorMoved = function(event) {
      return this.emitter.emit('did-change-cursor-position', event);
    };

    TextEditor.prototype.mergeCursors = function() {
      var cursor, j, len, position, positions, ref3;
      positions = {};
      ref3 = this.getCursors();
      for (j = 0, len = ref3.length; j < len; j++) {
        cursor = ref3[j];
        position = cursor.getBufferPosition().toString();
        if (positions.hasOwnProperty(position)) {
          cursor.destroy();
        } else {
          positions[position] = true;
        }
      }
    };

    TextEditor.prototype.preserveCursorPositionOnBufferReload = function() {
      var cursorPosition;
      cursorPosition = null;
      this.disposables.add(this.buffer.onWillReload((function(_this) {
        return function() {
          return cursorPosition = _this.getCursorBufferPosition();
        };
      })(this)));
      return this.disposables.add(this.buffer.onDidReload((function(_this) {
        return function() {
          if (cursorPosition) {
            _this.setCursorBufferPosition(cursorPosition);
          }
          return cursorPosition = null;
        };
      })(this)));
    };


    /*
    Section: Selections
     */

    TextEditor.prototype.getSelectedText = function() {
      return this.getLastSelection().getText();
    };

    TextEditor.prototype.getSelectedBufferRange = function() {
      return this.getLastSelection().getBufferRange();
    };

    TextEditor.prototype.getSelectedBufferRanges = function() {
      var j, len, ref3, results, selection;
      ref3 = this.getSelections();
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        results.push(selection.getBufferRange());
      }
      return results;
    };

    TextEditor.prototype.setSelectedBufferRange = function(bufferRange, options) {
      return this.setSelectedBufferRanges([bufferRange], options);
    };

    TextEditor.prototype.setSelectedBufferRanges = function(bufferRanges, options) {
      var j, len, ref3, selection, selections;
      if (options == null) {
        options = {};
      }
      if (!bufferRanges.length) {
        throw new Error("Passed an empty array to setSelectedBufferRanges");
      }
      selections = this.getSelections();
      ref3 = selections.slice(bufferRanges.length);
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        selection.destroy();
      }
      return this.mergeIntersectingSelections(options, (function(_this) {
        return function() {
          var bufferRange, i, k, len1;
          for (i = k = 0, len1 = bufferRanges.length; k < len1; i = ++k) {
            bufferRange = bufferRanges[i];
            bufferRange = Range.fromObject(bufferRange);
            if (selections[i]) {
              selections[i].setBufferRange(bufferRange, options);
            } else {
              _this.addSelectionForBufferRange(bufferRange, options);
            }
          }
        };
      })(this));
    };

    TextEditor.prototype.getSelectedScreenRange = function() {
      return this.getLastSelection().getScreenRange();
    };

    TextEditor.prototype.getSelectedScreenRanges = function() {
      var j, len, ref3, results, selection;
      ref3 = this.getSelections();
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        results.push(selection.getScreenRange());
      }
      return results;
    };

    TextEditor.prototype.setSelectedScreenRange = function(screenRange, options) {
      return this.setSelectedBufferRange(this.bufferRangeForScreenRange(screenRange, options), options);
    };

    TextEditor.prototype.setSelectedScreenRanges = function(screenRanges, options) {
      var j, len, ref3, selection, selections;
      if (options == null) {
        options = {};
      }
      if (!screenRanges.length) {
        throw new Error("Passed an empty array to setSelectedScreenRanges");
      }
      selections = this.getSelections();
      ref3 = selections.slice(screenRanges.length);
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        selection.destroy();
      }
      return this.mergeIntersectingSelections(options, (function(_this) {
        return function() {
          var i, k, len1, screenRange;
          for (i = k = 0, len1 = screenRanges.length; k < len1; i = ++k) {
            screenRange = screenRanges[i];
            screenRange = Range.fromObject(screenRange);
            if (selections[i]) {
              selections[i].setScreenRange(screenRange, options);
            } else {
              _this.addSelectionForScreenRange(screenRange, options);
            }
          }
        };
      })(this));
    };

    TextEditor.prototype.addSelectionForBufferRange = function(bufferRange, options) {
      var ref3;
      if (options == null) {
        options = {};
      }
      if (!options.preserveFolds) {
        this.destroyFoldsIntersectingBufferRange(bufferRange);
      }
      this.selectionsMarkerLayer.markBufferRange(bufferRange, {
        invalidate: 'never',
        reversed: (ref3 = options.reversed) != null ? ref3 : false
      });
      if (options.autoscroll !== false) {
        this.getLastSelection().autoscroll();
      }
      return this.getLastSelection();
    };

    TextEditor.prototype.addSelectionForScreenRange = function(screenRange, options) {
      if (options == null) {
        options = {};
      }
      return this.addSelectionForBufferRange(this.bufferRangeForScreenRange(screenRange), options);
    };

    TextEditor.prototype.selectToBufferPosition = function(position) {
      var lastSelection;
      lastSelection = this.getLastSelection();
      lastSelection.selectToBufferPosition(position);
      return this.mergeIntersectingSelections({
        reversed: lastSelection.isReversed()
      });
    };

    TextEditor.prototype.selectToScreenPosition = function(position, options) {
      var lastSelection;
      lastSelection = this.getLastSelection();
      lastSelection.selectToScreenPosition(position, options);
      if (!(options != null ? options.suppressSelectionMerge : void 0)) {
        return this.mergeIntersectingSelections({
          reversed: lastSelection.isReversed()
        });
      }
    };

    TextEditor.prototype.selectUp = function(rowCount) {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectUp(rowCount);
      });
    };

    TextEditor.prototype.selectDown = function(rowCount) {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectDown(rowCount);
      });
    };

    TextEditor.prototype.selectLeft = function(columnCount) {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectLeft(columnCount);
      });
    };

    TextEditor.prototype.selectRight = function(columnCount) {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectRight(columnCount);
      });
    };

    TextEditor.prototype.selectToTop = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToTop();
      });
    };

    TextEditor.prototype.selectToBottom = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToBottom();
      });
    };

    TextEditor.prototype.selectAll = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectAll();
      });
    };

    TextEditor.prototype.selectToBeginningOfLine = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToBeginningOfLine();
      });
    };

    TextEditor.prototype.selectToFirstCharacterOfLine = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToFirstCharacterOfLine();
      });
    };

    TextEditor.prototype.selectToEndOfLine = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToEndOfLine();
      });
    };

    TextEditor.prototype.selectToBeginningOfWord = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToBeginningOfWord();
      });
    };

    TextEditor.prototype.selectToEndOfWord = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToEndOfWord();
      });
    };

    TextEditor.prototype.selectToPreviousSubwordBoundary = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToPreviousSubwordBoundary();
      });
    };

    TextEditor.prototype.selectToNextSubwordBoundary = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToNextSubwordBoundary();
      });
    };

    TextEditor.prototype.selectLinesContainingCursors = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectLine();
      });
    };

    TextEditor.prototype.selectWordsContainingCursors = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectWord();
      });
    };

    TextEditor.prototype.selectToPreviousWordBoundary = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToPreviousWordBoundary();
      });
    };

    TextEditor.prototype.selectToNextWordBoundary = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToNextWordBoundary();
      });
    };

    TextEditor.prototype.selectToBeginningOfNextWord = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToBeginningOfNextWord();
      });
    };

    TextEditor.prototype.selectToBeginningOfNextParagraph = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.selectToBeginningOfNextParagraph();
      });
    };

    TextEditor.prototype.selectToBeginningOfPreviousParagraph = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.selectToBeginningOfPreviousParagraph();
      });
    };

    TextEditor.prototype.selectMarker = function(marker) {
      var range;
      if (marker.isValid()) {
        range = marker.getBufferRange();
        this.setSelectedBufferRange(range);
        return range;
      }
    };

    TextEditor.prototype.getLastSelection = function() {
      this.createLastSelectionIfNeeded();
      return _.last(this.selections);
    };

    TextEditor.prototype.getSelections = function() {
      this.createLastSelectionIfNeeded();
      return this.selections.slice();
    };

    TextEditor.prototype.getSelectionsOrderedByBufferPosition = function() {
      return this.getSelections().sort(function(a, b) {
        return a.compare(b);
      });
    };

    TextEditor.prototype.selectionIntersectsBufferRange = function(bufferRange) {
      return _.any(this.getSelections(), function(selection) {
        return selection.intersectsBufferRange(bufferRange);
      });
    };

    TextEditor.prototype.addSelectionBelow = function() {
      return this.expandSelectionsForward(function(selection) {
        return selection.addSelectionBelow();
      });
    };

    TextEditor.prototype.addSelectionAbove = function() {
      return this.expandSelectionsBackward(function(selection) {
        return selection.addSelectionAbove();
      });
    };

    TextEditor.prototype.expandSelectionsForward = function(fn) {
      return this.mergeIntersectingSelections((function(_this) {
        return function() {
          var j, len, ref3, selection;
          ref3 = _this.getSelections();
          for (j = 0, len = ref3.length; j < len; j++) {
            selection = ref3[j];
            fn(selection);
          }
        };
      })(this));
    };

    TextEditor.prototype.expandSelectionsBackward = function(fn) {
      return this.mergeIntersectingSelections({
        reversed: true
      }, (function(_this) {
        return function() {
          var j, len, ref3, selection;
          ref3 = _this.getSelections();
          for (j = 0, len = ref3.length; j < len; j++) {
            selection = ref3[j];
            fn(selection);
          }
        };
      })(this));
    };

    TextEditor.prototype.finalizeSelections = function() {
      var j, len, ref3, selection;
      ref3 = this.getSelections();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        selection.finalize();
      }
    };

    TextEditor.prototype.selectionsForScreenRows = function(startRow, endRow) {
      return this.getSelections().filter(function(selection) {
        return selection.intersectsScreenRowRange(startRow, endRow);
      });
    };

    TextEditor.prototype.mergeIntersectingSelections = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.mergeSelections.apply(this, slice.call(args).concat([function(previousSelection, currentSelection) {
        var exclusive;
        exclusive = !currentSelection.isEmpty() && !previousSelection.isEmpty();
        return previousSelection.intersectsWith(currentSelection, exclusive);
      }]));
    };

    TextEditor.prototype.mergeSelectionsOnSameRows = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.mergeSelections.apply(this, slice.call(args).concat([function(previousSelection, currentSelection) {
        var screenRange;
        screenRange = currentSelection.getScreenRange();
        return previousSelection.intersectsScreenRowRange(screenRange.start.row, screenRange.end.row);
      }]));
    };

    TextEditor.prototype.avoidMergingSelections = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.mergeSelections.apply(this, slice.call(args).concat([function() {
        return false;
      }]));
    };

    TextEditor.prototype.mergeSelections = function() {
      var args, fn, head, mergePredicate, options, reducer, ref3, ref4, result, tail;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      mergePredicate = args.pop();
      if (_.isFunction(_.last(args))) {
        fn = args.pop();
      }
      options = (ref3 = args.pop()) != null ? ref3 : {};
      if (this.suppressSelectionMerging) {
        return typeof fn === "function" ? fn() : void 0;
      }
      if (fn != null) {
        this.suppressSelectionMerging = true;
        result = fn();
        this.suppressSelectionMerging = false;
      }
      reducer = function(disjointSelections, selection) {
        var adjacentSelection;
        adjacentSelection = _.last(disjointSelections);
        if (mergePredicate(adjacentSelection, selection)) {
          adjacentSelection.merge(selection, options);
          return disjointSelections;
        } else {
          return disjointSelections.concat([selection]);
        }
      };
      ref4 = this.getSelectionsOrderedByBufferPosition(), head = ref4[0], tail = 2 <= ref4.length ? slice.call(ref4, 1) : [];
      _.reduce(tail, reducer, [head]);
      if (fn != null) {
        return result;
      }
    };

    TextEditor.prototype.addSelection = function(marker, options) {
      var cursor, j, len, ref3, selection, selectionBufferRange;
      if (options == null) {
        options = {};
      }
      cursor = this.addCursor(marker);
      selection = new Selection(Object.assign({
        editor: this,
        marker: marker,
        cursor: cursor
      }, options));
      this.selections.push(selection);
      selectionBufferRange = selection.getBufferRange();
      this.mergeIntersectingSelections({
        preserveFolds: options.preserveFolds
      });
      if (selection.destroyed) {
        ref3 = this.getSelections();
        for (j = 0, len = ref3.length; j < len; j++) {
          selection = ref3[j];
          if (selection.intersectsBufferRange(selectionBufferRange)) {
            return selection;
          }
        }
      } else {
        this.emitter.emit('did-add-selection', selection);
        return selection;
      }
    };

    TextEditor.prototype.removeSelection = function(selection) {
      _.remove(this.cursors, selection.cursor);
      _.remove(this.selections, selection);
      this.cursorsByMarkerId["delete"](selection.cursor.marker.id);
      this.emitter.emit('did-remove-cursor', selection.cursor);
      return this.emitter.emit('did-remove-selection', selection);
    };

    TextEditor.prototype.clearSelections = function(options) {
      this.consolidateSelections();
      return this.getLastSelection().clear(options);
    };

    TextEditor.prototype.consolidateSelections = function() {
      var j, len, ref3, selection, selections;
      selections = this.getSelections();
      if (selections.length > 1) {
        ref3 = selections.slice(1, selections.length);
        for (j = 0, len = ref3.length; j < len; j++) {
          selection = ref3[j];
          selection.destroy();
        }
        selections[0].autoscroll({
          center: true
        });
        return true;
      } else {
        return false;
      }
    };

    TextEditor.prototype.selectionRangeChanged = function(event) {
      return this.emitter.emit('did-change-selection-range', event);
    };

    TextEditor.prototype.createLastSelectionIfNeeded = function() {
      if (this.selections.length === 0) {
        return this.addSelectionForBufferRange([[0, 0], [0, 0]], {
          autoscroll: false,
          preserveFolds: true
        });
      }
    };


    /*
    Section: Searching and Replacing
     */

    TextEditor.prototype.scan = function(regex, iterator) {
      return this.buffer.scan(regex, iterator);
    };

    TextEditor.prototype.scanInBufferRange = function(regex, range, iterator) {
      return this.buffer.scanInRange(regex, range, iterator);
    };

    TextEditor.prototype.backwardsScanInBufferRange = function(regex, range, iterator) {
      return this.buffer.backwardsScanInRange(regex, range, iterator);
    };


    /*
    Section: Tab Behavior
     */

    TextEditor.prototype.getSoftTabs = function() {
      return this.softTabs;
    };

    TextEditor.prototype.setSoftTabs = function(softTabs1) {
      this.softTabs = softTabs1;
      return this.update({
        softTabs: this.softTabs
      });
    };

    TextEditor.prototype.hasAtomicSoftTabs = function() {
      return this.displayLayer.atomicSoftTabs;
    };

    TextEditor.prototype.toggleSoftTabs = function() {
      return this.setSoftTabs(!this.getSoftTabs());
    };

    TextEditor.prototype.getTabLength = function() {
      return this.tokenizedBuffer.getTabLength();
    };

    TextEditor.prototype.setTabLength = function(tabLength) {
      return this.update({
        tabLength: tabLength
      });
    };

    TextEditor.prototype.getInvisibles = function() {
      if (!this.mini && this.showInvisibles && (this.invisibles != null)) {
        return this.invisibles;
      } else {
        return {};
      }
    };

    TextEditor.prototype.doesShowIndentGuide = function() {
      return this.showIndentGuide && !this.mini;
    };

    TextEditor.prototype.getSoftWrapHangingIndentLength = function() {
      return this.displayLayer.softWrapHangingIndent;
    };

    TextEditor.prototype.usesSoftTabs = function() {
      var bufferRow, j, line, ref3, ref4;
      for (bufferRow = j = 0, ref3 = this.buffer.getLastRow(); 0 <= ref3 ? j <= ref3 : j >= ref3; bufferRow = 0 <= ref3 ? ++j : --j) {
        if ((ref4 = this.tokenizedBuffer.tokenizedLines[bufferRow]) != null ? ref4.isComment() : void 0) {
          continue;
        }
        line = this.buffer.lineForRow(bufferRow);
        if (line[0] === ' ') {
          return true;
        }
        if (line[0] === '\t') {
          return false;
        }
      }
      return void 0;
    };

    TextEditor.prototype.getTabText = function() {
      return this.buildIndentString(1);
    };

    TextEditor.prototype.normalizeTabsInBufferRange = function(bufferRange) {
      if (!this.getSoftTabs()) {
        return;
      }
      return this.scanInBufferRange(/\t/g, bufferRange, (function(_this) {
        return function(arg) {
          var replace;
          replace = arg.replace;
          return replace(_this.getTabText());
        };
      })(this));
    };


    /*
    Section: Soft Wrap Behavior
     */

    TextEditor.prototype.isSoftWrapped = function() {
      if (this.largeFileMode) {
        return false;
      } else {
        return this.softWrapped;
      }
    };

    TextEditor.prototype.setSoftWrapped = function(softWrapped) {
      this.update({
        softWrapped: softWrapped
      });
      return this.isSoftWrapped();
    };

    TextEditor.prototype.getPreferredLineLength = function() {
      return this.preferredLineLength;
    };

    TextEditor.prototype.toggleSoftWrapped = function() {
      return this.setSoftWrapped(!this.isSoftWrapped());
    };

    TextEditor.prototype.getSoftWrapColumn = function() {
      if (this.isSoftWrapped()) {
        if (this.softWrapAtPreferredLineLength) {
          return Math.min(this.getEditorWidthInChars(), this.preferredLineLength);
        } else {
          return this.getEditorWidthInChars();
        }
      } else {
        return 2e308;
      }
    };


    /*
    Section: Indentation
     */

    TextEditor.prototype.indentationForBufferRow = function(bufferRow) {
      return this.indentLevelForLine(this.lineTextForBufferRow(bufferRow));
    };

    TextEditor.prototype.setIndentationForBufferRow = function(bufferRow, newLevel, arg) {
      var endColumn, newIndentString, preserveLeadingWhitespace;
      preserveLeadingWhitespace = (arg != null ? arg : {}).preserveLeadingWhitespace;
      if (preserveLeadingWhitespace) {
        endColumn = 0;
      } else {
        endColumn = this.lineTextForBufferRow(bufferRow).match(/^\s*/)[0].length;
      }
      newIndentString = this.buildIndentString(newLevel);
      return this.buffer.setTextInRange([[bufferRow, 0], [bufferRow, endColumn]], newIndentString);
    };

    TextEditor.prototype.indentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.indentSelectedRows();
      });
    };

    TextEditor.prototype.outdentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.outdentSelectedRows();
      });
    };

    TextEditor.prototype.indentLevelForLine = function(line) {
      return this.tokenizedBuffer.indentLevelForLine(line);
    };

    TextEditor.prototype.autoIndentSelectedRows = function() {
      return this.mutateSelectedText(function(selection) {
        return selection.autoIndentSelectedRows();
      });
    };

    TextEditor.prototype.indent = function(options) {
      if (options == null) {
        options = {};
      }
      if (options.autoIndent == null) {
        options.autoIndent = this.shouldAutoIndent();
      }
      return this.mutateSelectedText(function(selection) {
        return selection.indent(options);
      });
    };

    TextEditor.prototype.buildIndentString = function(level, column) {
      var excessWhitespace, tabStopViolation;
      if (column == null) {
        column = 0;
      }
      if (this.getSoftTabs()) {
        tabStopViolation = column % this.getTabLength();
        return _.multiplyString(" ", Math.floor(level * this.getTabLength()) - tabStopViolation);
      } else {
        excessWhitespace = _.multiplyString(' ', Math.round((level - Math.floor(level)) * this.getTabLength()));
        return _.multiplyString("\t", Math.floor(level)) + excessWhitespace;
      }
    };


    /*
    Section: Grammars
     */

    TextEditor.prototype.getGrammar = function() {
      return this.tokenizedBuffer.grammar;
    };

    TextEditor.prototype.setGrammar = function(grammar) {
      return this.tokenizedBuffer.setGrammar(grammar);
    };

    TextEditor.prototype.reloadGrammar = function() {
      return this.tokenizedBuffer.reloadGrammar();
    };

    TextEditor.prototype.onDidTokenize = function(callback) {
      return this.tokenizedBuffer.onDidTokenize(callback);
    };


    /*
    Section: Managing Syntax Scopes
     */

    TextEditor.prototype.getRootScopeDescriptor = function() {
      return this.tokenizedBuffer.rootScopeDescriptor;
    };

    TextEditor.prototype.scopeDescriptorForBufferPosition = function(bufferPosition) {
      return this.tokenizedBuffer.scopeDescriptorForPosition(bufferPosition);
    };

    TextEditor.prototype.bufferRangeForScopeAtCursor = function(scopeSelector) {
      return this.bufferRangeForScopeAtPosition(scopeSelector, this.getCursorBufferPosition());
    };

    TextEditor.prototype.bufferRangeForScopeAtPosition = function(scopeSelector, position) {
      return this.tokenizedBuffer.bufferRangeForScopeAtPosition(scopeSelector, position);
    };

    TextEditor.prototype.isBufferRowCommented = function(bufferRow) {
      var match;
      if (match = this.lineTextForBufferRow(bufferRow).match(/\S/)) {
        if (this.commentScopeSelector == null) {
          this.commentScopeSelector = new TextMateScopeSelector('comment.*');
        }
        return this.commentScopeSelector.matches(this.scopeDescriptorForBufferPosition([bufferRow, match.index]).scopes);
      }
    };

    TextEditor.prototype.getCursorScope = function() {
      return this.getLastCursor().getScopeDescriptor();
    };

    TextEditor.prototype.tokenForBufferPosition = function(bufferPosition) {
      return this.tokenizedBuffer.tokenForPosition(bufferPosition);
    };


    /*
    Section: Clipboard Operations
     */

    TextEditor.prototype.copySelectedText = function() {
      var j, len, maintainClipboard, previousRange, ref3, selection;
      maintainClipboard = false;
      ref3 = this.getSelectionsOrderedByBufferPosition();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        if (selection.isEmpty()) {
          previousRange = selection.getBufferRange();
          selection.selectLine();
          selection.copy(maintainClipboard, true);
          selection.setBufferRange(previousRange);
        } else {
          selection.copy(maintainClipboard, false);
        }
        maintainClipboard = true;
      }
    };

    TextEditor.prototype.copyOnlySelectedText = function() {
      var j, len, maintainClipboard, ref3, selection;
      maintainClipboard = false;
      ref3 = this.getSelectionsOrderedByBufferPosition();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        if (!selection.isEmpty()) {
          selection.copy(maintainClipboard, false);
          maintainClipboard = true;
        }
      }
    };

    TextEditor.prototype.cutSelectedText = function() {
      var maintainClipboard;
      maintainClipboard = false;
      return this.mutateSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectLine();
          selection.cut(maintainClipboard, true);
        } else {
          selection.cut(maintainClipboard, false);
        }
        return maintainClipboard = true;
      });
    };

    TextEditor.prototype.pasteText = function(options) {
      var clipboardText, metadata, ref3;
      if (options == null) {
        options = {};
      }
      ref3 = this.constructor.clipboard.readWithMetadata(), clipboardText = ref3.text, metadata = ref3.metadata;
      if (!this.emitWillInsertTextEvent(clipboardText)) {
        return false;
      }
      if (metadata == null) {
        metadata = {};
      }
      options.autoIndent = this.shouldAutoIndentOnPaste();
      return this.mutateSelectedText((function(_this) {
        return function(selection, index) {
          var containsNewlines, cursor, didInsertEvent, fullLine, indentBasis, newPosition, oldPosition, range, ref4, ref5, text;
          if (((ref4 = metadata.selections) != null ? ref4.length : void 0) === _this.getSelections().length) {
            ref5 = metadata.selections[index], text = ref5.text, indentBasis = ref5.indentBasis, fullLine = ref5.fullLine;
          } else {
            indentBasis = metadata.indentBasis, fullLine = metadata.fullLine;
            text = clipboardText;
          }
          delete options.indentBasis;
          cursor = selection.cursor;
          if (indentBasis != null) {
            containsNewlines = text.indexOf('\n') !== -1;
            if (containsNewlines || !cursor.hasPrecedingCharactersOnLine()) {
              if (options.indentBasis == null) {
                options.indentBasis = indentBasis;
              }
            }
          }
          range = null;
          if (fullLine && selection.isEmpty()) {
            oldPosition = selection.getBufferRange().start;
            selection.setBufferRange([[oldPosition.row, 0], [oldPosition.row, 0]]);
            range = selection.insertText(text, options);
            newPosition = oldPosition.translate([1, 0]);
            selection.setBufferRange([newPosition, newPosition]);
          } else {
            range = selection.insertText(text, options);
          }
          didInsertEvent = {
            text: text,
            range: range
          };
          return _this.emitter.emit('did-insert-text', didInsertEvent);
        };
      })(this));
    };

    TextEditor.prototype.cutToEndOfLine = function() {
      var maintainClipboard;
      maintainClipboard = false;
      return this.mutateSelectedText(function(selection) {
        selection.cutToEndOfLine(maintainClipboard);
        return maintainClipboard = true;
      });
    };

    TextEditor.prototype.cutToEndOfBufferLine = function() {
      var maintainClipboard;
      maintainClipboard = false;
      return this.mutateSelectedText(function(selection) {
        selection.cutToEndOfBufferLine(maintainClipboard);
        return maintainClipboard = true;
      });
    };


    /*
    Section: Folds
     */

    TextEditor.prototype.foldCurrentRow = function() {
      var bufferRow;
      bufferRow = this.bufferPositionForScreenPosition(this.getCursorScreenPosition()).row;
      return this.foldBufferRow(bufferRow);
    };

    TextEditor.prototype.unfoldCurrentRow = function() {
      var bufferRow;
      bufferRow = this.bufferPositionForScreenPosition(this.getCursorScreenPosition()).row;
      return this.unfoldBufferRow(bufferRow);
    };

    TextEditor.prototype.foldBufferRow = function(bufferRow) {
      return this.languageMode.foldBufferRow(bufferRow);
    };

    TextEditor.prototype.unfoldBufferRow = function(bufferRow) {
      return this.displayLayer.destroyFoldsIntersectingBufferRange(Range(Point(bufferRow, 0), Point(bufferRow, 2e308)));
    };

    TextEditor.prototype.foldSelectedLines = function() {
      var j, len, ref3, selection;
      ref3 = this.getSelections();
      for (j = 0, len = ref3.length; j < len; j++) {
        selection = ref3[j];
        selection.fold();
      }
    };

    TextEditor.prototype.foldAll = function() {
      return this.languageMode.foldAll();
    };

    TextEditor.prototype.unfoldAll = function() {
      this.languageMode.unfoldAll();
      return this.scrollToCursorPosition();
    };

    TextEditor.prototype.foldAllAtIndentLevel = function(level) {
      return this.languageMode.foldAllAtIndentLevel(level);
    };

    TextEditor.prototype.isFoldableAtBufferRow = function(bufferRow) {
      return this.tokenizedBuffer.isFoldableAtRow(bufferRow);
    };

    TextEditor.prototype.isFoldableAtScreenRow = function(screenRow) {
      return this.isFoldableAtBufferRow(this.bufferRowForScreenRow(screenRow));
    };

    TextEditor.prototype.toggleFoldAtBufferRow = function(bufferRow) {
      if (this.isFoldedAtBufferRow(bufferRow)) {
        return this.unfoldBufferRow(bufferRow);
      } else {
        return this.foldBufferRow(bufferRow);
      }
    };

    TextEditor.prototype.isFoldedAtCursorRow = function() {
      return this.isFoldedAtScreenRow(this.getCursorScreenPosition().row);
    };

    TextEditor.prototype.isFoldedAtBufferRow = function(bufferRow) {
      return this.displayLayer.foldsIntersectingBufferRange(Range(Point(bufferRow, 0), Point(bufferRow, 2e308))).length > 0;
    };

    TextEditor.prototype.isFoldedAtScreenRow = function(screenRow) {
      return this.isFoldedAtBufferRow(this.bufferRowForScreenRow(screenRow));
    };

    TextEditor.prototype.foldBufferRowRange = function(startRow, endRow) {
      return this.foldBufferRange(Range(Point(startRow, 2e308), Point(endRow, 2e308)));
    };

    TextEditor.prototype.foldBufferRange = function(range) {
      return this.displayLayer.foldBufferRange(range);
    };

    TextEditor.prototype.destroyFoldsIntersectingBufferRange = function(bufferRange) {
      return this.displayLayer.destroyFoldsIntersectingBufferRange(bufferRange);
    };


    /*
    Section: Gutters
     */

    TextEditor.prototype.addGutter = function(options) {
      return this.gutterContainer.addGutter(options);
    };

    TextEditor.prototype.getGutters = function() {
      return this.gutterContainer.getGutters();
    };

    TextEditor.prototype.gutterWithName = function(name) {
      return this.gutterContainer.gutterWithName(name);
    };


    /*
    Section: Scrolling the TextEditor
     */

    TextEditor.prototype.scrollToCursorPosition = function(options) {
      var ref3;
      return this.getLastCursor().autoscroll({
        center: (ref3 = options != null ? options.center : void 0) != null ? ref3 : true
      });
    };

    TextEditor.prototype.scrollToBufferPosition = function(bufferPosition, options) {
      return this.scrollToScreenPosition(this.screenPositionForBufferPosition(bufferPosition), options);
    };

    TextEditor.prototype.scrollToScreenPosition = function(screenPosition, options) {
      return this.scrollToScreenRange(new Range(screenPosition, screenPosition), options);
    };

    TextEditor.prototype.scrollToTop = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::scrollToTop instead.");
      return this.getElement().scrollToTop();
    };

    TextEditor.prototype.scrollToBottom = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::scrollToTop instead.");
      return this.getElement().scrollToBottom();
    };

    TextEditor.prototype.scrollToScreenRange = function(screenRange, options) {
      var scrollEvent;
      if (options == null) {
        options = {};
      }
      scrollEvent = {
        screenRange: screenRange,
        options: options
      };
      return this.emitter.emit("did-request-autoscroll", scrollEvent);
    };

    TextEditor.prototype.getHorizontalScrollbarHeight = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getHorizontalScrollbarHeight instead.");
      return this.getElement().getHorizontalScrollbarHeight();
    };

    TextEditor.prototype.getVerticalScrollbarWidth = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getVerticalScrollbarWidth instead.");
      return this.getElement().getVerticalScrollbarWidth();
    };

    TextEditor.prototype.pageUp = function() {
      return this.moveUp(this.getRowsPerPage());
    };

    TextEditor.prototype.pageDown = function() {
      return this.moveDown(this.getRowsPerPage());
    };

    TextEditor.prototype.selectPageUp = function() {
      return this.selectUp(this.getRowsPerPage());
    };

    TextEditor.prototype.selectPageDown = function() {
      return this.selectDown(this.getRowsPerPage());
    };

    TextEditor.prototype.getRowsPerPage = function() {
      var ref3;
      return Math.max((ref3 = this.rowsPerPage) != null ? ref3 : 1, 1);
    };

    TextEditor.prototype.setRowsPerPage = function(rowsPerPage) {
      this.rowsPerPage = rowsPerPage;
    };


    /*
    Section: Config
     */

    TextEditor.prototype.setScopedSettingsDelegate = function(scopedSettingsDelegate) {
      this.scopedSettingsDelegate = scopedSettingsDelegate;
    };

    TextEditor.prototype.getScopedSettingsDelegate = function() {
      return this.scopedSettingsDelegate;
    };

    TextEditor.prototype.shouldAutoIndent = function() {
      return this.autoIndent;
    };

    TextEditor.prototype.shouldAutoIndentOnPaste = function() {
      return this.autoIndentOnPaste;
    };

    TextEditor.prototype.getScrollPastEnd = function() {
      return this.scrollPastEnd;
    };

    TextEditor.prototype.getScrollSensitivity = function() {
      return this.scrollSensitivity;
    };

    TextEditor.prototype.doesShowLineNumbers = function() {
      return this.showLineNumbers;
    };

    TextEditor.prototype.getUndoGroupingInterval = function() {
      return this.undoGroupingInterval;
    };

    TextEditor.prototype.getNonWordCharacters = function(scopes) {
      var ref3, ref4;
      return (ref3 = (ref4 = this.scopedSettingsDelegate) != null ? typeof ref4.getNonWordCharacters === "function" ? ref4.getNonWordCharacters(scopes) : void 0 : void 0) != null ? ref3 : this.nonWordCharacters;
    };

    TextEditor.prototype.getCommentStrings = function(scopes) {
      var ref3;
      return (ref3 = this.scopedSettingsDelegate) != null ? typeof ref3.getCommentStrings === "function" ? ref3.getCommentStrings(scopes) : void 0 : void 0;
    };

    TextEditor.prototype.getIncreaseIndentPattern = function(scopes) {
      var ref3;
      return (ref3 = this.scopedSettingsDelegate) != null ? typeof ref3.getIncreaseIndentPattern === "function" ? ref3.getIncreaseIndentPattern(scopes) : void 0 : void 0;
    };

    TextEditor.prototype.getDecreaseIndentPattern = function(scopes) {
      var ref3;
      return (ref3 = this.scopedSettingsDelegate) != null ? typeof ref3.getDecreaseIndentPattern === "function" ? ref3.getDecreaseIndentPattern(scopes) : void 0 : void 0;
    };

    TextEditor.prototype.getDecreaseNextIndentPattern = function(scopes) {
      var ref3;
      return (ref3 = this.scopedSettingsDelegate) != null ? typeof ref3.getDecreaseNextIndentPattern === "function" ? ref3.getDecreaseNextIndentPattern(scopes) : void 0 : void 0;
    };

    TextEditor.prototype.getFoldEndPattern = function(scopes) {
      var ref3;
      return (ref3 = this.scopedSettingsDelegate) != null ? typeof ref3.getFoldEndPattern === "function" ? ref3.getFoldEndPattern(scopes) : void 0 : void 0;
    };


    /*
    Section: Event Handlers
     */

    TextEditor.prototype.handleGrammarChange = function() {
      this.unfoldAll();
      return this.emitter.emit('did-change-grammar', this.getGrammar());
    };


    /*
    Section: TextEditor Rendering
     */

    TextEditor.prototype.getElement = function() {
      return this.editorElement != null ? this.editorElement : this.editorElement = new TextEditorElement().initialize(this, atom);
    };

    TextEditor.prototype.getPlaceholderText = function() {
      return this.placeholderText;
    };

    TextEditor.prototype.setPlaceholderText = function(placeholderText) {
      return this.update({
        placeholderText: placeholderText
      });
    };

    TextEditor.prototype.pixelPositionForBufferPosition = function(bufferPosition) {
      Grim.deprecate("This method is deprecated on the model layer. Use `TextEditorElement::pixelPositionForBufferPosition` instead");
      return this.getElement().pixelPositionForBufferPosition(bufferPosition);
    };

    TextEditor.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      Grim.deprecate("This method is deprecated on the model layer. Use `TextEditorElement::pixelPositionForScreenPosition` instead");
      return this.getElement().pixelPositionForScreenPosition(screenPosition);
    };

    TextEditor.prototype.getVerticalScrollMargin = function() {
      var maxScrollMargin;
      maxScrollMargin = Math.floor(((this.height / this.getLineHeightInPixels()) - 1) / 2);
      return Math.min(this.verticalScrollMargin, maxScrollMargin);
    };

    TextEditor.prototype.setVerticalScrollMargin = function(verticalScrollMargin) {
      this.verticalScrollMargin = verticalScrollMargin;
      return this.verticalScrollMargin;
    };

    TextEditor.prototype.getHorizontalScrollMargin = function() {
      return Math.min(this.horizontalScrollMargin, Math.floor(((this.width / this.getDefaultCharWidth()) - 1) / 2));
    };

    TextEditor.prototype.setHorizontalScrollMargin = function(horizontalScrollMargin) {
      this.horizontalScrollMargin = horizontalScrollMargin;
      return this.horizontalScrollMargin;
    };

    TextEditor.prototype.getLineHeightInPixels = function() {
      return this.lineHeightInPixels;
    };

    TextEditor.prototype.setLineHeightInPixels = function(lineHeightInPixels) {
      this.lineHeightInPixels = lineHeightInPixels;
      return this.lineHeightInPixels;
    };

    TextEditor.prototype.getKoreanCharWidth = function() {
      return this.koreanCharWidth;
    };

    TextEditor.prototype.getHalfWidthCharWidth = function() {
      return this.halfWidthCharWidth;
    };

    TextEditor.prototype.getDoubleWidthCharWidth = function() {
      return this.doubleWidthCharWidth;
    };

    TextEditor.prototype.getDefaultCharWidth = function() {
      return this.defaultCharWidth;
    };

    TextEditor.prototype.ratioForCharacter = function(character) {
      if (isKoreanCharacter(character)) {
        return this.getKoreanCharWidth() / this.getDefaultCharWidth();
      } else if (isHalfWidthCharacter(character)) {
        return this.getHalfWidthCharWidth() / this.getDefaultCharWidth();
      } else if (isDoubleWidthCharacter(character)) {
        return this.getDoubleWidthCharWidth() / this.getDefaultCharWidth();
      } else {
        return 1;
      }
    };

    TextEditor.prototype.setDefaultCharWidth = function(defaultCharWidth, doubleWidthCharWidth, halfWidthCharWidth, koreanCharWidth) {
      if (doubleWidthCharWidth == null) {
        doubleWidthCharWidth = defaultCharWidth;
      }
      if (halfWidthCharWidth == null) {
        halfWidthCharWidth = defaultCharWidth;
      }
      if (koreanCharWidth == null) {
        koreanCharWidth = defaultCharWidth;
      }
      if (defaultCharWidth !== this.defaultCharWidth || doubleWidthCharWidth !== this.doubleWidthCharWidth && halfWidthCharWidth !== this.halfWidthCharWidth && koreanCharWidth !== this.koreanCharWidth) {
        this.defaultCharWidth = defaultCharWidth;
        this.doubleWidthCharWidth = doubleWidthCharWidth;
        this.halfWidthCharWidth = halfWidthCharWidth;
        this.koreanCharWidth = koreanCharWidth;
        if (this.isSoftWrapped() && (this.getEditorWidthInChars() != null)) {
          this.displayLayer.reset({});
        }
      }
      return defaultCharWidth;
    };

    TextEditor.prototype.setHeight = function(height, reentrant) {
      if (reentrant == null) {
        reentrant = false;
      }
      if (reentrant) {
        return this.height = height;
      } else {
        Grim.deprecate("This is now a view method. Call TextEditorElement::setHeight instead.");
        return this.getElement().setHeight(height);
      }
    };

    TextEditor.prototype.getHeight = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getHeight instead.");
      return this.height;
    };

    TextEditor.prototype.getAutoHeight = function() {
      var ref3;
      return (ref3 = this.autoHeight) != null ? ref3 : true;
    };

    TextEditor.prototype.getAutoWidth = function() {
      var ref3;
      return (ref3 = this.autoWidth) != null ? ref3 : false;
    };

    TextEditor.prototype.setWidth = function(width, reentrant) {
      if (reentrant == null) {
        reentrant = false;
      }
      if (reentrant) {
        this.update({
          width: width
        });
        return this.width;
      } else {
        Grim.deprecate("This is now a view method. Call TextEditorElement::setWidth instead.");
        return this.getElement().setWidth(width);
      }
    };

    TextEditor.prototype.getWidth = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getWidth instead.");
      return this.width;
    };

    TextEditor.prototype.setFirstVisibleScreenRow = function(screenRow, fromView) {
      var maxScreenRow;
      if (!fromView) {
        maxScreenRow = this.getScreenLineCount() - 1;
        if (!this.scrollPastEnd) {
          if ((this.height != null) && (this.lineHeightInPixels != null)) {
            maxScreenRow -= Math.floor(this.height / this.lineHeightInPixels);
          }
        }
        screenRow = Math.max(Math.min(screenRow, maxScreenRow), 0);
      }
      if (screenRow !== this.firstVisibleScreenRow) {
        this.firstVisibleScreenRow = screenRow;
        if (!fromView) {
          return this.emitter.emit('did-change-first-visible-screen-row', screenRow);
        }
      }
    };

    TextEditor.prototype.getFirstVisibleScreenRow = function() {
      return this.firstVisibleScreenRow;
    };

    TextEditor.prototype.getLastVisibleScreenRow = function() {
      if ((this.height != null) && (this.lineHeightInPixels != null)) {
        return Math.min(this.firstVisibleScreenRow + Math.floor(this.height / this.lineHeightInPixels), this.getScreenLineCount() - 1);
      } else {
        return null;
      }
    };

    TextEditor.prototype.getVisibleRowRange = function() {
      var lastVisibleScreenRow;
      if (lastVisibleScreenRow = this.getLastVisibleScreenRow()) {
        return [this.firstVisibleScreenRow, lastVisibleScreenRow];
      } else {
        return null;
      }
    };

    TextEditor.prototype.setFirstVisibleScreenColumn = function(firstVisibleScreenColumn) {
      this.firstVisibleScreenColumn = firstVisibleScreenColumn;
    };

    TextEditor.prototype.getFirstVisibleScreenColumn = function() {
      return this.firstVisibleScreenColumn;
    };

    TextEditor.prototype.getScrollTop = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollTop instead.");
      return this.getElement().getScrollTop();
    };

    TextEditor.prototype.setScrollTop = function(scrollTop) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::setScrollTop instead.");
      return this.getElement().setScrollTop(scrollTop);
    };

    TextEditor.prototype.getScrollBottom = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollBottom instead.");
      return this.getElement().getScrollBottom();
    };

    TextEditor.prototype.setScrollBottom = function(scrollBottom) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::setScrollBottom instead.");
      return this.getElement().setScrollBottom(scrollBottom);
    };

    TextEditor.prototype.getScrollLeft = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollLeft instead.");
      return this.getElement().getScrollLeft();
    };

    TextEditor.prototype.setScrollLeft = function(scrollLeft) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::setScrollLeft instead.");
      return this.getElement().setScrollLeft(scrollLeft);
    };

    TextEditor.prototype.getScrollRight = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollRight instead.");
      return this.getElement().getScrollRight();
    };

    TextEditor.prototype.setScrollRight = function(scrollRight) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::setScrollRight instead.");
      return this.getElement().setScrollRight(scrollRight);
    };

    TextEditor.prototype.getScrollHeight = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollHeight instead.");
      return this.getElement().getScrollHeight();
    };

    TextEditor.prototype.getScrollWidth = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getScrollWidth instead.");
      return this.getElement().getScrollWidth();
    };

    TextEditor.prototype.getMaxScrollTop = function() {
      Grim.deprecate("This is now a view method. Call TextEditorElement::getMaxScrollTop instead.");
      return this.getElement().getMaxScrollTop();
    };

    TextEditor.prototype.intersectsVisibleRowRange = function(startRow, endRow) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::intersectsVisibleRowRange instead.");
      return this.getElement().intersectsVisibleRowRange(startRow, endRow);
    };

    TextEditor.prototype.selectionIntersectsVisibleRowRange = function(selection) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::selectionIntersectsVisibleRowRange instead.");
      return this.getElement().selectionIntersectsVisibleRowRange(selection);
    };

    TextEditor.prototype.screenPositionForPixelPosition = function(pixelPosition) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::screenPositionForPixelPosition instead.");
      return this.getElement().screenPositionForPixelPosition(pixelPosition);
    };

    TextEditor.prototype.pixelRectForScreenRange = function(screenRange) {
      Grim.deprecate("This is now a view method. Call TextEditorElement::pixelRectForScreenRange instead.");
      return this.getElement().pixelRectForScreenRange(screenRange);
    };


    /*
    Section: Utility
     */

    TextEditor.prototype.inspect = function() {
      return "<TextEditor " + this.id + ">";
    };

    TextEditor.prototype.emitWillInsertTextEvent = function(text) {
      var cancel, result, willInsertEvent;
      result = true;
      cancel = function() {
        return result = false;
      };
      willInsertEvent = {
        cancel: cancel,
        text: text
      };
      this.emitter.emit('will-insert-text', willInsertEvent);
      return result;
    };


    /*
    Section: Language Mode Delegated Methods
     */

    TextEditor.prototype.suggestedIndentForBufferRow = function(bufferRow, options) {
      return this.languageMode.suggestedIndentForBufferRow(bufferRow, options);
    };

    TextEditor.prototype.autoIndentBufferRow = function(bufferRow, options) {
      return this.languageMode.autoIndentBufferRow(bufferRow, options);
    };

    TextEditor.prototype.autoIndentBufferRows = function(startRow, endRow) {
      return this.languageMode.autoIndentBufferRows(startRow, endRow);
    };

    TextEditor.prototype.autoDecreaseIndentForBufferRow = function(bufferRow) {
      return this.languageMode.autoDecreaseIndentForBufferRow(bufferRow);
    };

    TextEditor.prototype.toggleLineCommentForBufferRow = function(row) {
      return this.languageMode.toggleLineCommentsForBufferRow(row);
    };

    TextEditor.prototype.toggleLineCommentsForBufferRows = function(start, end) {
      return this.languageMode.toggleLineCommentsForBufferRows(start, end);
    };

    return TextEditor;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90ZXh0LWVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJWQUFBO0lBQUE7Ozs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUE2QyxPQUFBLENBQVEsV0FBUixDQUE3QyxFQUFDLDZDQUFELEVBQXNCLDJCQUF0QixFQUFrQzs7RUFDbEMsT0FBaUIsVUFBQSxHQUFhLE9BQUEsQ0FBUSxhQUFSLENBQTlCLEVBQUMsa0JBQUQsRUFBUTs7RUFDUixZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNmLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUjs7RUFDcEIsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBQ2xCLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7RUFDVCxLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztFQUNaLHFCQUFBLEdBQXdCLE9BQUEsQ0FBUSxZQUFSLENBQXFCLENBQUM7O0VBQzlDLGVBQUEsR0FBa0IsT0FBQSxDQUFRLG9CQUFSOztFQUNsQixpQkFBQSxHQUFvQixPQUFBLENBQVEsdUJBQVI7O0VBQ3BCLE9BQW9GLE9BQUEsQ0FBUSxjQUFSLENBQXBGLEVBQUMsb0RBQUQsRUFBeUIsZ0RBQXpCLEVBQStDLDBDQUEvQyxFQUFrRTs7RUFFbEUsZUFBQSxHQUFrQjs7RUEwQ2xCLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztJQUNKLFVBQUMsQ0FBQSxZQUFELEdBQWUsU0FBQyxT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QkFBZCxDQUE2QyxTQUE3QztJQUFmOzt5QkFFaEMsNkJBQUEsR0FBK0IsU0FBQyxHQUFEO2FBQVMsSUFBQyxDQUFBLFlBQVksQ0FBQyw4QkFBZCxDQUE2QyxHQUE3QztJQUFUOzt5QkFFL0IsK0JBQUEsR0FBaUMsU0FBQyxLQUFELEVBQVEsR0FBUjthQUFnQixJQUFDLENBQUEsWUFBWSxDQUFDLCtCQUFkLENBQThDLEtBQTlDLEVBQXFELEdBQXJEO0lBQWhCOzs7O0tBM2xIVjtBQTVEekIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5HcmltID0gcmVxdWlyZSAnZ3JpbSdcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbntQb2ludCwgUmFuZ2V9ID0gVGV4dEJ1ZmZlciA9IHJlcXVpcmUgJ3RleHQtYnVmZmVyJ1xuTGFuZ3VhZ2VNb2RlID0gcmVxdWlyZSAnLi9sYW5ndWFnZS1tb2RlJ1xuRGVjb3JhdGlvbk1hbmFnZXIgPSByZXF1aXJlICcuL2RlY29yYXRpb24tbWFuYWdlcidcblRva2VuaXplZEJ1ZmZlciA9IHJlcXVpcmUgJy4vdG9rZW5pemVkLWJ1ZmZlcidcbkN1cnNvciA9IHJlcXVpcmUgJy4vY3Vyc29yJ1xuTW9kZWwgPSByZXF1aXJlICcuL21vZGVsJ1xuU2VsZWN0aW9uID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24nXG5UZXh0TWF0ZVNjb3BlU2VsZWN0b3IgPSByZXF1aXJlKCdmaXJzdC1tYXRlJykuU2NvcGVTZWxlY3RvclxuR3V0dGVyQ29udGFpbmVyID0gcmVxdWlyZSAnLi9ndXR0ZXItY29udGFpbmVyJ1xuVGV4dEVkaXRvckVsZW1lbnQgPSByZXF1aXJlICcuL3RleHQtZWRpdG9yLWVsZW1lbnQnXG57aXNEb3VibGVXaWR0aENoYXJhY3RlciwgaXNIYWxmV2lkdGhDaGFyYWN0ZXIsIGlzS29yZWFuQ2hhcmFjdGVyLCBpc1dyYXBCb3VuZGFyeX0gPSByZXF1aXJlICcuL3RleHQtdXRpbHMnXG5cblpFUk9fV0lEVEhfTkJTUCA9ICdcXHVmZWZmJ1xuXG4jIEVzc2VudGlhbDogVGhpcyBjbGFzcyByZXByZXNlbnRzIGFsbCBlc3NlbnRpYWwgZWRpdGluZyBzdGF0ZSBmb3IgYSBzaW5nbGVcbiMge1RleHRCdWZmZXJ9LCBpbmNsdWRpbmcgY3Vyc29yIGFuZCBzZWxlY3Rpb24gcG9zaXRpb25zLCBmb2xkcywgYW5kIHNvZnQgd3JhcHMuXG4jIElmIHlvdSdyZSBtYW5pcHVsYXRpbmcgdGhlIHN0YXRlIG9mIGFuIGVkaXRvciwgdXNlIHRoaXMgY2xhc3MuIElmIHlvdSdyZVxuIyBpbnRlcmVzdGVkIGluIHRoZSB2aXN1YWwgYXBwZWFyYW5jZSBvZiBlZGl0b3JzLCB1c2Uge1RleHRFZGl0b3JFbGVtZW50fVxuIyBpbnN0ZWFkLlxuI1xuIyBBIHNpbmdsZSB7VGV4dEJ1ZmZlcn0gY2FuIGJlbG9uZyB0byBtdWx0aXBsZSBlZGl0b3JzLiBGb3IgZXhhbXBsZSwgaWYgdGhlXG4jIHNhbWUgZmlsZSBpcyBvcGVuIGluIHR3byBkaWZmZXJlbnQgcGFuZXMsIEF0b20gY3JlYXRlcyBhIHNlcGFyYXRlIGVkaXRvciBmb3JcbiMgZWFjaCBwYW5lLiBJZiB0aGUgYnVmZmVyIGlzIG1hbmlwdWxhdGVkIHRoZSBjaGFuZ2VzIGFyZSByZWZsZWN0ZWQgaW4gYm90aFxuIyBlZGl0b3JzLCBidXQgZWFjaCBtYWludGFpbnMgaXRzIG93biBjdXJzb3IgcG9zaXRpb24sIGZvbGRlZCBsaW5lcywgZXRjLlxuI1xuIyAjIyBBY2Nlc3NpbmcgVGV4dEVkaXRvciBJbnN0YW5jZXNcbiNcbiMgVGhlIGVhc2llc3Qgd2F5IHRvIGdldCBob2xkIG9mIGBUZXh0RWRpdG9yYCBvYmplY3RzIGlzIGJ5IHJlZ2lzdGVyaW5nIGEgY2FsbGJhY2tcbiMgd2l0aCBgOjpvYnNlcnZlVGV4dEVkaXRvcnNgIG9uIHRoZSBgYXRvbS53b3Jrc3BhY2VgIGdsb2JhbC4gWW91ciBjYWxsYmFjayB3aWxsXG4jIHRoZW4gYmUgY2FsbGVkIHdpdGggYWxsIGN1cnJlbnQgZWRpdG9yIGluc3RhbmNlcyBhbmQgYWxzbyB3aGVuIGFueSBlZGl0b3IgaXNcbiMgY3JlYXRlZCBpbiB0aGUgZnV0dXJlLlxuI1xuIyBgYGBjb2ZmZWVcbiMgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpIC0+XG4jICAgZWRpdG9yLmluc2VydFRleHQoJ0hlbGxvIFdvcmxkJylcbiMgYGBgXG4jXG4jICMjIEJ1ZmZlciB2cy4gU2NyZWVuIENvb3JkaW5hdGVzXG4jXG4jIEJlY2F1c2UgZWRpdG9ycyBzdXBwb3J0IGZvbGRzIGFuZCBzb2Z0LXdyYXBwaW5nLCB0aGUgbGluZXMgb24gc2NyZWVuIGRvbid0XG4jIGFsd2F5cyBtYXRjaCB0aGUgbGluZXMgaW4gdGhlIGJ1ZmZlci4gRm9yIGV4YW1wbGUsIGEgbG9uZyBsaW5lIHRoYXQgc29mdCB3cmFwc1xuIyB0d2ljZSByZW5kZXJzIGFzIHRocmVlIGxpbmVzIG9uIHNjcmVlbiwgYnV0IG9ubHkgcmVwcmVzZW50cyBvbmUgbGluZSBpbiB0aGVcbiMgYnVmZmVyLiBTaW1pbGFybHksIGlmIHJvd3MgNS0xMCBhcmUgZm9sZGVkLCB0aGVuIHJvdyA2IG9uIHNjcmVlbiBjb3JyZXNwb25kc1xuIyB0byByb3cgMTEgaW4gdGhlIGJ1ZmZlci5cbiNcbiMgWW91ciBjaG9pY2Ugb2YgY29vcmRpbmF0ZXMgc3lzdGVtcyB3aWxsIGRlcGVuZCBvbiB3aGF0IHlvdSdyZSB0cnlpbmcgdG9cbiMgYWNoaWV2ZS4gRm9yIGV4YW1wbGUsIGlmIHlvdSdyZSB3cml0aW5nIGEgY29tbWFuZCB0aGF0IGp1bXBzIHRoZSBjdXJzb3IgdXAgb3JcbiMgZG93biBieSAxMCBsaW5lcywgeW91J2xsIHdhbnQgdG8gdXNlIHNjcmVlbiBjb29yZGluYXRlcyBiZWNhdXNlIHRoZSB1c2VyXG4jIHByb2JhYmx5IHdhbnRzIHRvIHNraXAgbGluZXMgKm9uIHNjcmVlbiouIEhvd2V2ZXIsIGlmIHlvdSdyZSB3cml0aW5nIGEgcGFja2FnZVxuIyB0aGF0IGp1bXBzIGJldHdlZW4gbWV0aG9kIGRlZmluaXRpb25zLCB5b3UnbGwgd2FudCB0byB3b3JrIGluIGJ1ZmZlclxuIyBjb29yZGluYXRlcy5cbiNcbiMgKipXaGVuIGluIGRvdWJ0LCBqdXN0IGRlZmF1bHQgdG8gYnVmZmVyIGNvb3JkaW5hdGVzKiosIHRoZW4gZXhwZXJpbWVudCB3aXRoXG4jIHNvZnQgd3JhcHMgYW5kIGZvbGRzIHRvIGVuc3VyZSB5b3VyIGNvZGUgaW50ZXJhY3RzIHdpdGggdGhlbSBjb3JyZWN0bHkuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUZXh0RWRpdG9yIGV4dGVuZHMgTW9kZWxcbiAgQHNldENsaXBib2FyZDogKGNsaXBib2FyZCkgLT5cbiAgICBAY2xpcGJvYXJkID0gY2xpcGJvYXJkXG5cbiAgc2VyaWFsaXphdGlvblZlcnNpb246IDFcblxuICBidWZmZXI6IG51bGxcbiAgbGFuZ3VhZ2VNb2RlOiBudWxsXG4gIGN1cnNvcnM6IG51bGxcbiAgc2VsZWN0aW9uczogbnVsbFxuICBzdXBwcmVzc1NlbGVjdGlvbk1lcmdpbmc6IGZhbHNlXG4gIHNlbGVjdGlvbkZsYXNoRHVyYXRpb246IDUwMFxuICBndXR0ZXJDb250YWluZXI6IG51bGxcbiAgZWRpdG9yRWxlbWVudDogbnVsbFxuICB2ZXJ0aWNhbFNjcm9sbE1hcmdpbjogMlxuICBob3Jpem9udGFsU2Nyb2xsTWFyZ2luOiA2XG4gIHNvZnRXcmFwcGVkOiBudWxsXG4gIGVkaXRvcldpZHRoSW5DaGFyczogbnVsbFxuICBsaW5lSGVpZ2h0SW5QaXhlbHM6IG51bGxcbiAgZGVmYXVsdENoYXJXaWR0aDogbnVsbFxuICBoZWlnaHQ6IG51bGxcbiAgd2lkdGg6IG51bGxcbiAgcmVnaXN0ZXJlZDogZmFsc2VcbiAgYXRvbWljU29mdFRhYnM6IHRydWVcbiAgaW52aXNpYmxlczogbnVsbFxuICBzaG93TGluZU51bWJlcnM6IHRydWVcbiAgc2Nyb2xsU2Vuc2l0aXZpdHk6IDQwXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsIFwiZWxlbWVudFwiLFxuICAgIGdldDogLT4gQGdldEVsZW1lbnQoKVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShAcHJvdG90eXBlLCAnZGlzcGxheUJ1ZmZlcicsIGdldDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlwiXCJcbiAgICAgIGBUZXh0RWRpdG9yLnByb3RvdHlwZS5kaXNwbGF5QnVmZmVyYCBoYXMgYWx3YXlzIGJlZW4gcHJpdmF0ZSwgYnV0IG5vd1xuICAgICAgaXQgaXMgZ29uZS4gUmVhZGluZyB0aGUgYGRpc3BsYXlCdWZmZXJgIHByb3BlcnR5IG5vdyByZXR1cm5zIGEgcmVmZXJlbmNlXG4gICAgICB0byB0aGUgY29udGFpbmluZyBgVGV4dEVkaXRvcmAsIHdoaWNoIG5vdyBwcm92aWRlcyAqc29tZSogb2YgdGhlIEFQSSBvZlxuICAgICAgdGhlIGRlZnVuY3QgYERpc3BsYXlCdWZmZXJgIGNsYXNzLlxuICAgIFwiXCJcIilcbiAgICB0aGlzXG4gIClcblxuICBAZGVzZXJpYWxpemU6IChzdGF0ZSwgYXRvbUVudmlyb25tZW50KSAtPlxuICAgICMgVE9ETzogUmV0dXJuIG51bGwgb24gdmVyc2lvbiBtaXNtYXRjaCB3aGVuIDEuOC4wIGhhcyBiZWVuIG91dCBmb3IgYSB3aGlsZVxuICAgIGlmIHN0YXRlLnZlcnNpb24gaXNudCBAcHJvdG90eXBlLnNlcmlhbGl6YXRpb25WZXJzaW9uIGFuZCBzdGF0ZS5kaXNwbGF5QnVmZmVyP1xuICAgICAgc3RhdGUudG9rZW5pemVkQnVmZmVyID0gc3RhdGUuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJcblxuICAgIHRyeVxuICAgICAgc3RhdGUudG9rZW5pemVkQnVmZmVyID0gVG9rZW5pemVkQnVmZmVyLmRlc2VyaWFsaXplKHN0YXRlLnRva2VuaXplZEJ1ZmZlciwgYXRvbUVudmlyb25tZW50KVxuICAgICAgc3RhdGUudGFiTGVuZ3RoID0gc3RhdGUudG9rZW5pemVkQnVmZmVyLmdldFRhYkxlbmd0aCgpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGlmIGVycm9yLnN5c2NhbGwgaXMgJ3JlYWQnXG4gICAgICAgIHJldHVybiAjIEVycm9yIHJlYWRpbmcgdGhlIGZpbGUsIGRvbid0IGRlc2VyaWFsaXplIGFuIGVkaXRvciBmb3IgaXRcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgZXJyb3JcblxuICAgIHN0YXRlLmJ1ZmZlciA9IHN0YXRlLnRva2VuaXplZEJ1ZmZlci5idWZmZXJcbiAgICBpZiBzdGF0ZS5kaXNwbGF5TGF5ZXIgPSBzdGF0ZS5idWZmZXIuZ2V0RGlzcGxheUxheWVyKHN0YXRlLmRpc3BsYXlMYXllcklkKVxuICAgICAgc3RhdGUuc2VsZWN0aW9uc01hcmtlckxheWVyID0gc3RhdGUuZGlzcGxheUxheWVyLmdldE1hcmtlckxheWVyKHN0YXRlLnNlbGVjdGlvbnNNYXJrZXJMYXllcklkKVxuXG4gICAgc3RhdGUuYXNzZXJ0ID0gYXRvbUVudmlyb25tZW50LmFzc2VydC5iaW5kKGF0b21FbnZpcm9ubWVudClcbiAgICBlZGl0b3IgPSBuZXcgdGhpcyhzdGF0ZSlcbiAgICBpZiBzdGF0ZS5yZWdpc3RlcmVkXG4gICAgICBkaXNwb3NhYmxlID0gYXRvbUVudmlyb25tZW50LnRleHRFZGl0b3JzLmFkZChlZGl0b3IpXG4gICAgICBlZGl0b3Iub25EaWREZXN0cm95IC0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgZWRpdG9yXG5cbiAgY29uc3RydWN0b3I6IChwYXJhbXM9e30pIC0+XG4gICAgdW5sZXNzIEBjb25zdHJ1Y3Rvci5jbGlwYm9hcmQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGNhbGwgVGV4dEVkaXRvci5zZXRDbGlwYm9hcmQgYXQgbGVhc3Qgb25jZSBiZWZvcmUgY3JlYXRpbmcgVGV4dEVkaXRvciBpbnN0YW5jZXNcIilcblxuICAgIHN1cGVyXG5cbiAgICB7XG4gICAgICBAc29mdFRhYnMsIEBmaXJzdFZpc2libGVTY3JlZW5Sb3csIEBmaXJzdFZpc2libGVTY3JlZW5Db2x1bW4sIGluaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1uLCB0YWJMZW5ndGgsXG4gICAgICBAc29mdFdyYXBwZWQsIEBkZWNvcmF0aW9uTWFuYWdlciwgQHNlbGVjdGlvbnNNYXJrZXJMYXllciwgQGJ1ZmZlciwgc3VwcHJlc3NDdXJzb3JDcmVhdGlvbixcbiAgICAgIEBtaW5pLCBAcGxhY2Vob2xkZXJUZXh0LCBsaW5lTnVtYmVyR3V0dGVyVmlzaWJsZSwgQGxhcmdlRmlsZU1vZGUsXG4gICAgICBAYXNzZXJ0LCBncmFtbWFyLCBAc2hvd0ludmlzaWJsZXMsIEBhdXRvSGVpZ2h0LCBAYXV0b1dpZHRoLCBAc2Nyb2xsUGFzdEVuZCwgQGVkaXRvcldpZHRoSW5DaGFycyxcbiAgICAgIEB0b2tlbml6ZWRCdWZmZXIsIEBkaXNwbGF5TGF5ZXIsIEBpbnZpc2libGVzLCBAc2hvd0luZGVudEd1aWRlLFxuICAgICAgQHNvZnRXcmFwcGVkLCBAc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGgsIEBwcmVmZXJyZWRMaW5lTGVuZ3RoXG4gICAgfSA9IHBhcmFtc1xuXG4gICAgQGFzc2VydCA/PSAoY29uZGl0aW9uKSAtPiBjb25kaXRpb25cbiAgICBAZmlyc3RWaXNpYmxlU2NyZWVuUm93ID89IDBcbiAgICBAZmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uID89IDBcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAY3Vyc29ycyA9IFtdXG4gICAgQGN1cnNvcnNCeU1hcmtlcklkID0gbmV3IE1hcFxuICAgIEBzZWxlY3Rpb25zID0gW11cbiAgICBAaGFzVGVybWluYXRlZFBlbmRpbmdTdGF0ZSA9IGZhbHNlXG5cbiAgICBAbWluaSA/PSBmYWxzZVxuICAgIEBzY3JvbGxQYXN0RW5kID89IGZhbHNlXG4gICAgQHNob3dJbnZpc2libGVzID89IHRydWVcbiAgICBAc29mdFRhYnMgPz0gdHJ1ZVxuICAgIHRhYkxlbmd0aCA/PSAyXG4gICAgQGF1dG9JbmRlbnQgPz0gdHJ1ZVxuICAgIEBhdXRvSW5kZW50T25QYXN0ZSA/PSB0cnVlXG4gICAgQHVuZG9Hcm91cGluZ0ludGVydmFsID89IDMwMFxuICAgIEBub25Xb3JkQ2hhcmFjdGVycyA/PSBcIi9cXFxcKClcXFwiJzosLjs8Pn4hQCMkJV4mKnwrPVtde31gPy3igKZcIlxuICAgIEBzb2Z0V3JhcHBlZCA/PSBmYWxzZVxuICAgIEBzb2Z0V3JhcEF0UHJlZmVycmVkTGluZUxlbmd0aCA/PSBmYWxzZVxuICAgIEBwcmVmZXJyZWRMaW5lTGVuZ3RoID89IDgwXG5cbiAgICBAYnVmZmVyID89IG5ldyBUZXh0QnVmZmVyXG4gICAgQHRva2VuaXplZEJ1ZmZlciA/PSBuZXcgVG9rZW5pemVkQnVmZmVyKHtcbiAgICAgIGdyYW1tYXIsIHRhYkxlbmd0aCwgQGJ1ZmZlciwgQGxhcmdlRmlsZU1vZGUsIEBhc3NlcnRcbiAgICB9KVxuXG4gICAgZGlzcGxheUxheWVyUGFyYW1zID0ge1xuICAgICAgaW52aXNpYmxlczogQGdldEludmlzaWJsZXMoKSxcbiAgICAgIHNvZnRXcmFwQ29sdW1uOiBAZ2V0U29mdFdyYXBDb2x1bW4oKSxcbiAgICAgIHNob3dJbmRlbnRHdWlkZXM6IG5vdCBAaXNNaW5pKCkgYW5kIEBkb2VzU2hvd0luZGVudEd1aWRlKCksXG4gICAgICBhdG9taWNTb2Z0VGFiczogcGFyYW1zLmF0b21pY1NvZnRUYWJzID8gdHJ1ZSxcbiAgICAgIHRhYkxlbmd0aDogdGFiTGVuZ3RoLFxuICAgICAgcmF0aW9Gb3JDaGFyYWN0ZXI6IEByYXRpb0ZvckNoYXJhY3Rlci5iaW5kKHRoaXMpLFxuICAgICAgaXNXcmFwQm91bmRhcnk6IGlzV3JhcEJvdW5kYXJ5LFxuICAgICAgZm9sZENoYXJhY3RlcjogWkVST19XSURUSF9OQlNQLFxuICAgICAgc29mdFdyYXBIYW5naW5nSW5kZW50OiBwYXJhbXMuc29mdFdyYXBIYW5naW5nSW5kZW50TGVuZ3RoID8gMFxuICAgIH1cblxuICAgIGlmIEBkaXNwbGF5TGF5ZXI/XG4gICAgICBAZGlzcGxheUxheWVyLnJlc2V0KGRpc3BsYXlMYXllclBhcmFtcylcbiAgICBlbHNlXG4gICAgICBAZGlzcGxheUxheWVyID0gQGJ1ZmZlci5hZGREaXNwbGF5TGF5ZXIoZGlzcGxheUxheWVyUGFyYW1zKVxuXG4gICAgQGJhY2tncm91bmRXb3JrSGFuZGxlID0gcmVxdWVzdElkbGVDYWxsYmFjayhAZG9CYWNrZ3JvdW5kV29yaylcbiAgICBAZGlzcG9zYWJsZXMuYWRkIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBjYW5jZWxJZGxlQ2FsbGJhY2soQGJhY2tncm91bmRXb3JrSGFuZGxlKSBpZiBAYmFja2dyb3VuZFdvcmtIYW5kbGU/XG5cbiAgICBAZGlzcGxheUxheWVyLnNldFRleHREZWNvcmF0aW9uTGF5ZXIoQHRva2VuaXplZEJ1ZmZlcilcbiAgICBAZGVmYXVsdE1hcmtlckxheWVyID0gQGRpc3BsYXlMYXllci5hZGRNYXJrZXJMYXllcigpXG4gICAgQHNlbGVjdGlvbnNNYXJrZXJMYXllciA/PSBAYWRkTWFya2VyTGF5ZXIobWFpbnRhaW5IaXN0b3J5OiB0cnVlLCBwZXJzaXN0ZW50OiB0cnVlKVxuXG4gICAgQGRlY29yYXRpb25NYW5hZ2VyID0gbmV3IERlY29yYXRpb25NYW5hZ2VyKEBkaXNwbGF5TGF5ZXIsIEBkZWZhdWx0TWFya2VyTGF5ZXIpXG4gICAgQGRlY29yYXRlTWFya2VyTGF5ZXIoQGRpc3BsYXlMYXllci5mb2xkc01hcmtlckxheWVyLCB7dHlwZTogJ2xpbmUtbnVtYmVyJywgY2xhc3M6ICdmb2xkZWQnfSlcblxuICAgIGZvciBtYXJrZXIgaW4gQHNlbGVjdGlvbnNNYXJrZXJMYXllci5nZXRNYXJrZXJzKClcbiAgICAgIEBhZGRTZWxlY3Rpb24obWFya2VyKVxuXG4gICAgQHN1YnNjcmliZVRvQnVmZmVyKClcbiAgICBAc3Vic2NyaWJlVG9EaXNwbGF5TGF5ZXIoKVxuXG4gICAgaWYgQGN1cnNvcnMubGVuZ3RoIGlzIDAgYW5kIG5vdCBzdXBwcmVzc0N1cnNvckNyZWF0aW9uXG4gICAgICBpbml0aWFsTGluZSA9IE1hdGgubWF4KHBhcnNlSW50KGluaXRpYWxMaW5lKSBvciAwLCAwKVxuICAgICAgaW5pdGlhbENvbHVtbiA9IE1hdGgubWF4KHBhcnNlSW50KGluaXRpYWxDb2x1bW4pIG9yIDAsIDApXG4gICAgICBAYWRkQ3Vyc29yQXRCdWZmZXJQb3NpdGlvbihbaW5pdGlhbExpbmUsIGluaXRpYWxDb2x1bW5dKVxuXG4gICAgQGxhbmd1YWdlTW9kZSA9IG5ldyBMYW5ndWFnZU1vZGUodGhpcylcblxuICAgIEBndXR0ZXJDb250YWluZXIgPSBuZXcgR3V0dGVyQ29udGFpbmVyKHRoaXMpXG4gICAgQGxpbmVOdW1iZXJHdXR0ZXIgPSBAZ3V0dGVyQ29udGFpbmVyLmFkZEd1dHRlclxuICAgICAgbmFtZTogJ2xpbmUtbnVtYmVyJ1xuICAgICAgcHJpb3JpdHk6IDBcbiAgICAgIHZpc2libGU6IGxpbmVOdW1iZXJHdXR0ZXJWaXNpYmxlXG5cbiAgZG9CYWNrZ3JvdW5kV29yazogKGRlYWRsaW5lKSA9PlxuICAgIGlmIEBkaXNwbGF5TGF5ZXIuZG9CYWNrZ3JvdW5kV29yayhkZWFkbGluZSlcbiAgICAgIEBwcmVzZW50ZXI/LnVwZGF0ZVZlcnRpY2FsRGltZW5zaW9ucygpXG4gICAgICBAYmFja2dyb3VuZFdvcmtIYW5kbGUgPSByZXF1ZXN0SWRsZUNhbGxiYWNrKEBkb0JhY2tncm91bmRXb3JrKVxuICAgIGVsc2VcbiAgICAgIEBiYWNrZ3JvdW5kV29ya0hhbmRsZSA9IG51bGxcblxuICB1cGRhdGU6IChwYXJhbXMpIC0+XG4gICAgY3VycmVudFNvZnRXcmFwQ29sdW1uID0gQGdldFNvZnRXcmFwQ29sdW1uKClcbiAgICBkaXNwbGF5TGF5ZXJQYXJhbXMgPSB7fVxuXG4gICAgZm9yIHBhcmFtIGluIE9iamVjdC5rZXlzKHBhcmFtcylcbiAgICAgIHZhbHVlID0gcGFyYW1zW3BhcmFtXVxuXG4gICAgICBzd2l0Y2ggcGFyYW1cbiAgICAgICAgd2hlbiAnYXV0b0luZGVudCdcbiAgICAgICAgICBAYXV0b0luZGVudCA9IHZhbHVlXG5cbiAgICAgICAgd2hlbiAnYXV0b0luZGVudE9uUGFzdGUnXG4gICAgICAgICAgQGF1dG9JbmRlbnRPblBhc3RlID0gdmFsdWVcblxuICAgICAgICB3aGVuICd1bmRvR3JvdXBpbmdJbnRlcnZhbCdcbiAgICAgICAgICBAdW5kb0dyb3VwaW5nSW50ZXJ2YWwgPSB2YWx1ZVxuXG4gICAgICAgIHdoZW4gJ25vbldvcmRDaGFyYWN0ZXJzJ1xuICAgICAgICAgIEBub25Xb3JkQ2hhcmFjdGVycyA9IHZhbHVlXG5cbiAgICAgICAgd2hlbiAnc2Nyb2xsU2Vuc2l0aXZpdHknXG4gICAgICAgICAgQHNjcm9sbFNlbnNpdGl2aXR5ID0gdmFsdWVcblxuICAgICAgICB3aGVuICdlbmNvZGluZydcbiAgICAgICAgICBAYnVmZmVyLnNldEVuY29kaW5nKHZhbHVlKVxuXG4gICAgICAgIHdoZW4gJ3NvZnRUYWJzJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHNvZnRUYWJzXG4gICAgICAgICAgICBAc29mdFRhYnMgPSB2YWx1ZVxuXG4gICAgICAgIHdoZW4gJ2F0b21pY1NvZnRUYWJzJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQGRpc3BsYXlMYXllci5hdG9taWNTb2Z0VGFic1xuICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLmF0b21pY1NvZnRUYWJzID0gdmFsdWVcblxuICAgICAgICB3aGVuICd0YWJMZW5ndGgnXG4gICAgICAgICAgaWYgdmFsdWU/IGFuZCB2YWx1ZSBpc250IEB0b2tlbml6ZWRCdWZmZXIuZ2V0VGFiTGVuZ3RoKClcbiAgICAgICAgICAgIEB0b2tlbml6ZWRCdWZmZXIuc2V0VGFiTGVuZ3RoKHZhbHVlKVxuICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLnRhYkxlbmd0aCA9IHZhbHVlXG5cbiAgICAgICAgd2hlbiAnc29mdFdyYXBwZWQnXG4gICAgICAgICAgaWYgdmFsdWUgaXNudCBAc29mdFdyYXBwZWRcbiAgICAgICAgICAgIEBzb2Z0V3JhcHBlZCA9IHZhbHVlXG4gICAgICAgICAgICBkaXNwbGF5TGF5ZXJQYXJhbXMuc29mdFdyYXBDb2x1bW4gPSBAZ2V0U29mdFdyYXBDb2x1bW4oKVxuICAgICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1zb2Z0LXdyYXBwZWQnLCBAaXNTb2Z0V3JhcHBlZCgpXG5cbiAgICAgICAgd2hlbiAnc29mdFdyYXBIYW5naW5nSW5kZW50TGVuZ3RoJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQGRpc3BsYXlMYXllci5zb2Z0V3JhcEhhbmdpbmdJbmRlbnRcbiAgICAgICAgICAgIGRpc3BsYXlMYXllclBhcmFtcy5zb2Z0V3JhcEhhbmdpbmdJbmRlbnQgPSB2YWx1ZVxuXG4gICAgICAgIHdoZW4gJ3NvZnRXcmFwQXRQcmVmZXJyZWRMaW5lTGVuZ3RoJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHNvZnRXcmFwQXRQcmVmZXJyZWRMaW5lTGVuZ3RoXG4gICAgICAgICAgICBAc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGggPSB2YWx1ZVxuICAgICAgICAgICAgc29mdFdyYXBDb2x1bW4gPSBAZ2V0U29mdFdyYXBDb2x1bW4oKVxuICAgICAgICAgICAgaWYgc29mdFdyYXBDb2x1bW4gaXNudCBjdXJyZW50U29mdFdyYXBDb2x1bW5cbiAgICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLnNvZnRXcmFwQ29sdW1uID0gc29mdFdyYXBDb2x1bW5cblxuICAgICAgICB3aGVuICdwcmVmZXJyZWRMaW5lTGVuZ3RoJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHByZWZlcnJlZExpbmVMZW5ndGhcbiAgICAgICAgICAgIEBwcmVmZXJyZWRMaW5lTGVuZ3RoID0gdmFsdWVcbiAgICAgICAgICAgIHNvZnRXcmFwQ29sdW1uID0gQGdldFNvZnRXcmFwQ29sdW1uKClcbiAgICAgICAgICAgIGlmIHNvZnRXcmFwQ29sdW1uIGlzbnQgY3VycmVudFNvZnRXcmFwQ29sdW1uXG4gICAgICAgICAgICAgIGRpc3BsYXlMYXllclBhcmFtcy5zb2Z0V3JhcENvbHVtbiA9IHNvZnRXcmFwQ29sdW1uXG5cbiAgICAgICAgd2hlbiAnbWluaSdcbiAgICAgICAgICBpZiB2YWx1ZSBpc250IEBtaW5pXG4gICAgICAgICAgICBAbWluaSA9IHZhbHVlXG4gICAgICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLW1pbmknLCB2YWx1ZVxuICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLmludmlzaWJsZXMgPSBAZ2V0SW52aXNpYmxlcygpXG4gICAgICAgICAgICBkaXNwbGF5TGF5ZXJQYXJhbXMuc2hvd0luZGVudEd1aWRlcyA9IEBkb2VzU2hvd0luZGVudEd1aWRlKClcblxuICAgICAgICB3aGVuICdwbGFjZWhvbGRlclRleHQnXG4gICAgICAgICAgaWYgdmFsdWUgaXNudCBAcGxhY2Vob2xkZXJUZXh0XG4gICAgICAgICAgICBAcGxhY2Vob2xkZXJUZXh0ID0gdmFsdWVcbiAgICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtcGxhY2Vob2xkZXItdGV4dCcsIHZhbHVlXG5cbiAgICAgICAgd2hlbiAnbGluZU51bWJlckd1dHRlclZpc2libGUnXG4gICAgICAgICAgaWYgdmFsdWUgaXNudCBAbGluZU51bWJlckd1dHRlclZpc2libGVcbiAgICAgICAgICAgIGlmIHZhbHVlXG4gICAgICAgICAgICAgIEBsaW5lTnVtYmVyR3V0dGVyLnNob3coKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBAbGluZU51bWJlckd1dHRlci5oaWRlKClcbiAgICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtbGluZS1udW1iZXItZ3V0dGVyLXZpc2libGUnLCBAbGluZU51bWJlckd1dHRlci5pc1Zpc2libGUoKVxuXG4gICAgICAgIHdoZW4gJ3Nob3dJbmRlbnRHdWlkZSdcbiAgICAgICAgICBpZiB2YWx1ZSBpc250IEBzaG93SW5kZW50R3VpZGVcbiAgICAgICAgICAgIEBzaG93SW5kZW50R3VpZGUgPSB2YWx1ZVxuICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLnNob3dJbmRlbnRHdWlkZXMgPSBAZG9lc1Nob3dJbmRlbnRHdWlkZSgpXG5cbiAgICAgICAgd2hlbiAnc2hvd0xpbmVOdW1iZXJzJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHNob3dMaW5lTnVtYmVyc1xuICAgICAgICAgICAgQHNob3dMaW5lTnVtYmVycyA9IHZhbHVlXG4gICAgICAgICAgICBAcHJlc2VudGVyPy5kaWRDaGFuZ2VTaG93TGluZU51bWJlcnMoKVxuXG4gICAgICAgIHdoZW4gJ3Nob3dJbnZpc2libGVzJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHNob3dJbnZpc2libGVzXG4gICAgICAgICAgICBAc2hvd0ludmlzaWJsZXMgPSB2YWx1ZVxuICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLmludmlzaWJsZXMgPSBAZ2V0SW52aXNpYmxlcygpXG5cbiAgICAgICAgd2hlbiAnaW52aXNpYmxlcydcbiAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBAaW52aXNpYmxlcylcbiAgICAgICAgICAgIEBpbnZpc2libGVzID0gdmFsdWVcbiAgICAgICAgICAgIGRpc3BsYXlMYXllclBhcmFtcy5pbnZpc2libGVzID0gQGdldEludmlzaWJsZXMoKVxuXG4gICAgICAgIHdoZW4gJ2VkaXRvcldpZHRoSW5DaGFycydcbiAgICAgICAgICBpZiB2YWx1ZSA+IDAgYW5kIHZhbHVlIGlzbnQgQGVkaXRvcldpZHRoSW5DaGFyc1xuICAgICAgICAgICAgQGVkaXRvcldpZHRoSW5DaGFycyA9IHZhbHVlXG4gICAgICAgICAgICBzb2Z0V3JhcENvbHVtbiA9IEBnZXRTb2Z0V3JhcENvbHVtbigpXG4gICAgICAgICAgICBpZiBzb2Z0V3JhcENvbHVtbiBpc250IGN1cnJlbnRTb2Z0V3JhcENvbHVtblxuICAgICAgICAgICAgICBkaXNwbGF5TGF5ZXJQYXJhbXMuc29mdFdyYXBDb2x1bW4gPSBzb2Z0V3JhcENvbHVtblxuXG4gICAgICAgIHdoZW4gJ3dpZHRoJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHdpZHRoXG4gICAgICAgICAgICBAd2lkdGggPSB2YWx1ZVxuICAgICAgICAgICAgc29mdFdyYXBDb2x1bW4gPSBAZ2V0U29mdFdyYXBDb2x1bW4oKVxuICAgICAgICAgICAgaWYgc29mdFdyYXBDb2x1bW4gaXNudCBjdXJyZW50U29mdFdyYXBDb2x1bW5cbiAgICAgICAgICAgICAgZGlzcGxheUxheWVyUGFyYW1zLnNvZnRXcmFwQ29sdW1uID0gc29mdFdyYXBDb2x1bW5cblxuICAgICAgICB3aGVuICdzY3JvbGxQYXN0RW5kJ1xuICAgICAgICAgIGlmIHZhbHVlIGlzbnQgQHNjcm9sbFBhc3RFbmRcbiAgICAgICAgICAgIEBzY3JvbGxQYXN0RW5kID0gdmFsdWVcbiAgICAgICAgICAgIEBwcmVzZW50ZXI/LmRpZENoYW5nZVNjcm9sbFBhc3RFbmQoKVxuXG4gICAgICAgIHdoZW4gJ2F1dG9IZWlnaHQnXG4gICAgICAgICAgaWYgdmFsdWUgaXNudCBAYXV0b0hlaWdodFxuICAgICAgICAgICAgQGF1dG9IZWlnaHQgPSB2YWx1ZVxuICAgICAgICAgICAgQHByZXNlbnRlcj8uc2V0QXV0b0hlaWdodChAYXV0b0hlaWdodClcblxuICAgICAgICB3aGVuICdhdXRvV2lkdGgnXG4gICAgICAgICAgaWYgdmFsdWUgaXNudCBAYXV0b1dpZHRoXG4gICAgICAgICAgICBAYXV0b1dpZHRoID0gdmFsdWVcbiAgICAgICAgICAgIEBwcmVzZW50ZXI/LmRpZENoYW5nZUF1dG9XaWR0aCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBUZXh0RWRpdG9yIHBhcmFtZXRlcjogJyN7cGFyYW19J1wiKVxuXG4gICAgaWYgT2JqZWN0LmtleXMoZGlzcGxheUxheWVyUGFyYW1zKS5sZW5ndGggPiAwXG4gICAgICBAZGlzcGxheUxheWVyLnJlc2V0KGRpc3BsYXlMYXllclBhcmFtcylcblxuICAgIGlmIEBlZGl0b3JFbGVtZW50P1xuICAgICAgQGVkaXRvckVsZW1lbnQudmlld3MuZ2V0TmV4dFVwZGF0ZVByb21pc2UoKVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIHRva2VuaXplZEJ1ZmZlclN0YXRlID0gQHRva2VuaXplZEJ1ZmZlci5zZXJpYWxpemUoKVxuXG4gICAge1xuICAgICAgZGVzZXJpYWxpemVyOiAnVGV4dEVkaXRvcidcbiAgICAgIHZlcnNpb246IEBzZXJpYWxpemF0aW9uVmVyc2lvblxuXG4gICAgICAjIFRPRE86IFJlbW92ZSB0aGlzIGZvcndhcmQtY29tcGF0aWJsZSBmYWxsYmFjayBvbmNlIDEuOCByZWFjaGVzIHN0YWJsZS5cbiAgICAgIGRpc3BsYXlCdWZmZXI6IHt0b2tlbml6ZWRCdWZmZXI6IHRva2VuaXplZEJ1ZmZlclN0YXRlfVxuXG4gICAgICB0b2tlbml6ZWRCdWZmZXI6IHRva2VuaXplZEJ1ZmZlclN0YXRlXG4gICAgICBkaXNwbGF5TGF5ZXJJZDogQGRpc3BsYXlMYXllci5pZFxuICAgICAgc2VsZWN0aW9uc01hcmtlckxheWVySWQ6IEBzZWxlY3Rpb25zTWFya2VyTGF5ZXIuaWRcblxuICAgICAgZmlyc3RWaXNpYmxlU2NyZWVuUm93OiBAZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAgIGZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbjogQGdldEZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbigpXG5cbiAgICAgIGF0b21pY1NvZnRUYWJzOiBAZGlzcGxheUxheWVyLmF0b21pY1NvZnRUYWJzXG4gICAgICBzb2Z0V3JhcEhhbmdpbmdJbmRlbnRMZW5ndGg6IEBkaXNwbGF5TGF5ZXIuc29mdFdyYXBIYW5naW5nSW5kZW50XG5cbiAgICAgIEBpZCwgQHNvZnRUYWJzLCBAc29mdFdyYXBwZWQsIEBzb2Z0V3JhcEF0UHJlZmVycmVkTGluZUxlbmd0aCxcbiAgICAgIEBwcmVmZXJyZWRMaW5lTGVuZ3RoLCBAbWluaSwgQGVkaXRvcldpZHRoSW5DaGFycywgIEB3aWR0aCwgQGxhcmdlRmlsZU1vZGUsXG4gICAgICBAcmVnaXN0ZXJlZCwgQGludmlzaWJsZXMsIEBzaG93SW52aXNpYmxlcywgQHNob3dJbmRlbnRHdWlkZSwgQGF1dG9IZWlnaHQsIEBhdXRvV2lkdGhcbiAgICB9XG5cbiAgc3Vic2NyaWJlVG9CdWZmZXI6IC0+XG4gICAgQGJ1ZmZlci5yZXRhaW4oKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGJ1ZmZlci5vbkRpZENoYW5nZVBhdGggPT5cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdGl0bGUnLCBAZ2V0VGl0bGUoKVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1wYXRoJywgQGdldFBhdGgoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGJ1ZmZlci5vbkRpZENoYW5nZUVuY29kaW5nID0+XG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLWVuY29kaW5nJywgQGdldEVuY29kaW5nKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBidWZmZXIub25EaWREZXN0cm95ID0+IEBkZXN0cm95KClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBidWZmZXIub25EaWRDaGFuZ2VNb2RpZmllZCA9PlxuICAgICAgQHRlcm1pbmF0ZVBlbmRpbmdTdGF0ZSgpIGlmIG5vdCBAaGFzVGVybWluYXRlZFBlbmRpbmdTdGF0ZSBhbmQgQGJ1ZmZlci5pc01vZGlmaWVkKClcblxuICAgIEBwcmVzZXJ2ZUN1cnNvclBvc2l0aW9uT25CdWZmZXJSZWxvYWQoKVxuXG4gIHRlcm1pbmF0ZVBlbmRpbmdTdGF0ZTogLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtdGVybWluYXRlLXBlbmRpbmctc3RhdGUnIGlmIG5vdCBAaGFzVGVybWluYXRlZFBlbmRpbmdTdGF0ZVxuICAgIEBoYXNUZXJtaW5hdGVkUGVuZGluZ1N0YXRlID0gdHJ1ZVxuXG4gIG9uRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC10ZXJtaW5hdGUtcGVuZGluZy1zdGF0ZScsIGNhbGxiYWNrXG5cbiAgc3Vic2NyaWJlVG9EaXNwbGF5TGF5ZXI6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAc2VsZWN0aW9uc01hcmtlckxheWVyLm9uRGlkQ3JlYXRlTWFya2VyIEBhZGRTZWxlY3Rpb24uYmluZCh0aGlzKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHRva2VuaXplZEJ1ZmZlci5vbkRpZENoYW5nZUdyYW1tYXIgQGhhbmRsZUdyYW1tYXJDaGFuZ2UuYmluZCh0aGlzKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGRpc3BsYXlMYXllci5vbkRpZENoYW5nZVN5bmMgKGUpID0+XG4gICAgICBAbWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UnLCBlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAZGlzcGxheUxheWVyLm9uRGlkUmVzZXQgPT5cbiAgICAgIEBtZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZScsIHt9XG5cbiAgZGVzdHJveWVkOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZGlzcGxheUxheWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAdG9rZW5pemVkQnVmZmVyLmRlc3Ryb3koKVxuICAgIHNlbGVjdGlvbi5kZXN0cm95KCkgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9ucy5zbGljZSgpXG4gICAgQHNlbGVjdGlvbnNNYXJrZXJMYXllci5kZXN0cm95KClcbiAgICBAYnVmZmVyLnJlbGVhc2UoKVxuICAgIEBsYW5ndWFnZU1vZGUuZGVzdHJveSgpXG4gICAgQGd1dHRlckNvbnRhaW5lci5kZXN0cm95KClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiB0aGUgYnVmZmVyJ3MgdGl0bGUgaGFzIGNoYW5nZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VUaXRsZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXRpdGxlJywgY2FsbGJhY2tcblxuICAjIEVzc2VudGlhbDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gdGhlIGJ1ZmZlcidzIHBhdGgsIGFuZCB0aGVyZWZvcmUgdGl0bGUsIGhhcyBjaGFuZ2VkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlUGF0aDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXBhdGgnLCBjYWxsYmFja1xuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHN5bmNocm9ub3VzbHkgd2hlbiB0aGUgY29udGVudCBvZiB0aGVcbiAgIyBidWZmZXIgY2hhbmdlcy5cbiAgI1xuICAjIEJlY2F1c2Ugb2JzZXJ2ZXJzIGFyZSBpbnZva2VkIHN5bmNocm9ub3VzbHksIGl0J3MgaW1wb3J0YW50IG5vdCB0byBwZXJmb3JtXG4gICMgYW55IGV4cGVuc2l2ZSBvcGVyYXRpb25zIHZpYSB0aGlzIG1ldGhvZC4gQ29uc2lkZXIgezo6b25EaWRTdG9wQ2hhbmdpbmd9IHRvXG4gICMgZGVsYXkgZXhwZW5zaXZlIG9wZXJhdGlvbnMgdW50aWwgYWZ0ZXIgY2hhbmdlcyBzdG9wIG9jY3VycmluZy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlJywgY2FsbGJhY2tcblxuICAjIEVzc2VudGlhbDogSW52b2tlIGBjYWxsYmFja2Agd2hlbiB0aGUgYnVmZmVyJ3MgY29udGVudHMgY2hhbmdlLiBJdCBpc1xuICAjIGVtaXQgYXN5bmNocm9ub3VzbHkgMzAwbXMgYWZ0ZXIgdGhlIGxhc3QgYnVmZmVyIGNoYW5nZS4gVGhpcyBpcyBhIGdvb2QgcGxhY2VcbiAgIyB0byBoYW5kbGUgY2hhbmdlcyB0byB0aGUgYnVmZmVyIHdpdGhvdXQgY29tcHJvbWlzaW5nIHR5cGluZyBwZXJmb3JtYW5jZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZFN0b3BDaGFuZ2luZzogKGNhbGxiYWNrKSAtPlxuICAgIEBnZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyhjYWxsYmFjaylcblxuICAjIEVzc2VudGlhbDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gYSB7Q3Vyc29yfSBpcyBtb3ZlZC4gSWYgdGhlcmUgYXJlXG4gICMgbXVsdGlwbGUgY3Vyc29ycywgeW91ciBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBjdXJzb3IuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9XG4gICMgICAgICogYG9sZEJ1ZmZlclBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG9sZFNjcmVlblBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG5ld0J1ZmZlclBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG5ld1NjcmVlblBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYHRleHRDaGFuZ2VkYCB7Qm9vbGVhbn1cbiAgIyAgICAgKiBgY3Vyc29yYCB7Q3Vyc29yfSB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb246IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1jdXJzb3ItcG9zaXRpb24nLCBjYWxsYmFja1xuXG4gICMgRXNzZW50aWFsOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiBhIHNlbGVjdGlvbidzIHNjcmVlbiByYW5nZSBjaGFuZ2VzLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fVxuICAjICAgICAqIGBvbGRCdWZmZXJSYW5nZWAge1JhbmdlfVxuICAjICAgICAqIGBvbGRTY3JlZW5SYW5nZWAge1JhbmdlfVxuICAjICAgICAqIGBuZXdCdWZmZXJSYW5nZWAge1JhbmdlfVxuICAjICAgICAqIGBuZXdTY3JlZW5SYW5nZWAge1JhbmdlfVxuICAjICAgICAqIGBzZWxlY3Rpb25gIHtTZWxlY3Rpb259IHRoYXQgdHJpZ2dlcmVkIHRoZSBldmVudFxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VTZWxlY3Rpb25SYW5nZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXNlbGVjdGlvbi1yYW5nZScsIGNhbGxiYWNrXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gc29mdCB3cmFwIHdhcyBlbmFibGVkIG9yIGRpc2FibGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlU29mdFdyYXBwZWQ6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1zb2Z0LXdyYXBwZWQnLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBidWZmZXIncyBlbmNvZGluZyBoYXMgY2hhbmdlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZUVuY29kaW5nOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtZW5jb2RpbmcnLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBncmFtbWFyIHRoYXQgaW50ZXJwcmV0cyBhbmRcbiAgIyBjb2xvcml6ZXMgdGhlIHRleHQgaGFzIGJlZW4gY2hhbmdlZC4gSW1tZWRpYXRlbHkgY2FsbHMgeW91ciBjYWxsYmFjayB3aXRoXG4gICMgdGhlIGN1cnJlbnQgZ3JhbW1hci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBncmFtbWFyYCB7R3JhbW1hcn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVHcmFtbWFyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2soQGdldEdyYW1tYXIoKSlcbiAgICBAb25EaWRDaGFuZ2VHcmFtbWFyKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBncmFtbWFyIHRoYXQgaW50ZXJwcmV0cyBhbmRcbiAgIyBjb2xvcml6ZXMgdGhlIHRleHQgaGFzIGJlZW4gY2hhbmdlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBncmFtbWFyYCB7R3JhbW1hcn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlR3JhbW1hcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWdyYW1tYXInLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSByZXN1bHQgb2Ygezo6aXNNb2RpZmllZH0gY2hhbmdlcy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZU1vZGlmaWVkOiAoY2FsbGJhY2spIC0+XG4gICAgQGdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlTW9kaWZpZWQoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gdGhlIGJ1ZmZlcidzIHVuZGVybHlpbmcgZmlsZSBjaGFuZ2VzIG9uXG4gICMgZGlzayBhdCBhIG1vbWVudCB3aGVuIHRoZSByZXN1bHQgb2Ygezo6aXNNb2RpZmllZH0gaXMgdHJ1ZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENvbmZsaWN0OiAoY2FsbGJhY2spIC0+XG4gICAgQGdldEJ1ZmZlcigpLm9uRGlkQ29uZmxpY3QoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIGJlZm9yZSB0ZXh0IGhhcyBiZWVuIGluc2VydGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgIyAgICogYGV2ZW50YCBldmVudCB7T2JqZWN0fVxuICAjICAgICAqIGB0ZXh0YCB7U3RyaW5nfSB0ZXh0IHRvIGJlIGluc2VydGVkXG4gICMgICAgICogYGNhbmNlbGAge0Z1bmN0aW9ufSBDYWxsIHRvIHByZXZlbnQgdGhlIHRleHQgZnJvbSBiZWluZyBpbnNlcnRlZFxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25XaWxsSW5zZXJ0VGV4dDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICd3aWxsLWluc2VydC10ZXh0JywgY2FsbGJhY2tcblxuICAjIEV4dGVuZGVkOiBDYWxscyB5b3VyIGBjYWxsYmFja2AgYWZ0ZXIgdGV4dCBoYXMgYmVlbiBpbnNlcnRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBldmVudGAgZXZlbnQge09iamVjdH1cbiAgIyAgICAgKiBgdGV4dGAge1N0cmluZ30gdGV4dCB0byBiZSBpbnNlcnRlZFxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRJbnNlcnRUZXh0OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1pbnNlcnQtdGV4dCcsIGNhbGxiYWNrXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgYWZ0ZXIgdGhlIGJ1ZmZlciBpcyBzYXZlZCB0byBkaXNrLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBidWZmZXIgaXMgc2F2ZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYHBhdGhgIFRoZSBwYXRoIHRvIHdoaWNoIHRoZSBidWZmZXIgd2FzIHNhdmVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRTYXZlOiAoY2FsbGJhY2spIC0+XG4gICAgQGdldEJ1ZmZlcigpLm9uRGlkU2F2ZShjYWxsYmFjaylcblxuICAjIEVzc2VudGlhbDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBlZGl0b3IgaXMgZGVzdHJveWVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGVkaXRvciBpcyBkZXN0cm95ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWRlc3Ryb3knLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIGEge0N1cnNvcn0gaXMgYWRkZWQgdG8gdGhlIGVkaXRvci5cbiAgIyBJbW1lZGlhdGVseSBjYWxscyB5b3VyIGNhbGxiYWNrIGZvciBlYWNoIGV4aXN0aW5nIGN1cnNvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBjdXJzb3JgIHtDdXJzb3J9IHRoYXQgd2FzIGFkZGVkXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlQ3Vyc29yczogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKGN1cnNvcikgZm9yIGN1cnNvciBpbiBAZ2V0Q3Vyc29ycygpXG4gICAgQG9uRGlkQWRkQ3Vyc29yKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIGEge0N1cnNvcn0gaXMgYWRkZWQgdG8gdGhlIGVkaXRvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBjdXJzb3JgIHtDdXJzb3J9IHRoYXQgd2FzIGFkZGVkXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZEFkZEN1cnNvcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLWN1cnNvcicsIGNhbGxiYWNrXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gYSB7Q3Vyc29yfSBpcyByZW1vdmVkIGZyb20gdGhlIGVkaXRvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBjdXJzb3JgIHtDdXJzb3J9IHRoYXQgd2FzIHJlbW92ZWRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkUmVtb3ZlQ3Vyc29yOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZW1vdmUtY3Vyc29yJywgY2FsbGJhY2tcblxuICAjIEV4dGVuZGVkOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiBhIHtTZWxlY3Rpb259IGlzIGFkZGVkIHRvIHRoZSBlZGl0b3IuXG4gICMgSW1tZWRpYXRlbHkgY2FsbHMgeW91ciBjYWxsYmFjayBmb3IgZWFjaCBleGlzdGluZyBzZWxlY3Rpb24uXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgc2VsZWN0aW9uYCB7U2VsZWN0aW9ufSB0aGF0IHdhcyBhZGRlZFxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZVNlbGVjdGlvbnM6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhzZWxlY3Rpb24pIGZvciBzZWxlY3Rpb24gaW4gQGdldFNlbGVjdGlvbnMoKVxuICAgIEBvbkRpZEFkZFNlbGVjdGlvbihjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiBhIHtTZWxlY3Rpb259IGlzIGFkZGVkIHRvIHRoZSBlZGl0b3IuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgc2VsZWN0aW9uYCB7U2VsZWN0aW9ufSB0aGF0IHdhcyBhZGRlZFxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBZGRTZWxlY3Rpb246IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1zZWxlY3Rpb24nLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIGEge1NlbGVjdGlvbn0gaXMgcmVtb3ZlZCBmcm9tIHRoZSBlZGl0b3IuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgc2VsZWN0aW9uYCB7U2VsZWN0aW9ufSB0aGF0IHdhcyByZW1vdmVkXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZFJlbW92ZVNlbGVjdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtcmVtb3ZlLXNlbGVjdGlvbicsIGNhbGxiYWNrXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdpdGggZWFjaCB7RGVjb3JhdGlvbn0gYWRkZWQgdG8gdGhlIGVkaXRvci5cbiAgIyBDYWxscyB5b3VyIGBjYWxsYmFja2AgaW1tZWRpYXRlbHkgZm9yIGFueSBleGlzdGluZyBkZWNvcmF0aW9ucy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBkZWNvcmF0aW9uYCB7RGVjb3JhdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVEZWNvcmF0aW9uczogKGNhbGxiYWNrKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5vYnNlcnZlRGVjb3JhdGlvbnMoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gYSB7RGVjb3JhdGlvbn0gaXMgYWRkZWQgdG8gdGhlIGVkaXRvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBkZWNvcmF0aW9uYCB7RGVjb3JhdGlvbn0gdGhhdCB3YXMgYWRkZWRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWRkRGVjb3JhdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5vbkRpZEFkZERlY29yYXRpb24oY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gYSB7RGVjb3JhdGlvbn0gaXMgcmVtb3ZlZCBmcm9tIHRoZSBlZGl0b3IuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgZGVjb3JhdGlvbmAge0RlY29yYXRpb259IHRoYXQgd2FzIHJlbW92ZWRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkUmVtb3ZlRGVjb3JhdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5vbkRpZFJlbW92ZURlY29yYXRpb24oY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gdGhlIHBsYWNlaG9sZGVyIHRleHQgaXMgY2hhbmdlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBwbGFjZWhvbGRlclRleHRgIHtTdHJpbmd9IG5ldyB0ZXh0XG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZVBsYWNlaG9sZGVyVGV4dDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXBsYWNlaG9sZGVyLXRleHQnLCBjYWxsYmFja1xuXG4gIG9uRGlkQ2hhbmdlRmlyc3RWaXNpYmxlU2NyZWVuUm93OiAoY2FsbGJhY2ssIGZyb21WaWV3KSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWZpcnN0LXZpc2libGUtc2NyZWVuLXJvdycsIGNhbGxiYWNrXG5cbiAgb25EaWRDaGFuZ2VTY3JvbGxUb3A6IChjYWxsYmFjaykgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6Om9uRGlkQ2hhbmdlU2Nyb2xsVG9wIGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKGNhbGxiYWNrKVxuXG4gIG9uRGlkQ2hhbmdlU2Nyb2xsTGVmdDogKGNhbGxiYWNrKSAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6b25EaWRDaGFuZ2VTY3JvbGxMZWZ0IGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLm9uRGlkQ2hhbmdlU2Nyb2xsTGVmdChjYWxsYmFjaylcblxuICBvbkRpZFJlcXVlc3RBdXRvc2Nyb2xsOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZXF1ZXN0LWF1dG9zY3JvbGwnLCBjYWxsYmFja1xuXG4gICMgVE9ETyBSZW1vdmUgb25jZSB0aGUgdGFicyBwYWNrYWdlIG5vIGxvbmdlciB1c2VzIC5vbiBzdWJzY3JpcHRpb25zXG4gIG9uRGlkQ2hhbmdlSWNvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWljb24nLCBjYWxsYmFja1xuXG4gIG9uRGlkVXBkYXRlRGVjb3JhdGlvbnM6IChjYWxsYmFjaykgLT5cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIub25EaWRVcGRhdGVEZWNvcmF0aW9ucyhjYWxsYmFjaylcblxuICAjIEVzc2VudGlhbDogUmV0cmlldmVzIHRoZSBjdXJyZW50IHtUZXh0QnVmZmVyfS5cbiAgZ2V0QnVmZmVyOiAtPiBAYnVmZmVyXG5cbiAgIyBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgYnVmZmVyJ3MgVVJJLlxuICBnZXRVUkk6IC0+IEBidWZmZXIuZ2V0VXJpKClcblxuICAjIENyZWF0ZSBhbiB7VGV4dEVkaXRvcn0gd2l0aCBpdHMgaW5pdGlhbCBzdGF0ZSBiYXNlZCBvbiB0aGlzIG9iamVjdFxuICBjb3B5OiAtPlxuICAgIGRpc3BsYXlMYXllciA9IEBkaXNwbGF5TGF5ZXIuY29weSgpXG4gICAgc2VsZWN0aW9uc01hcmtlckxheWVyID0gZGlzcGxheUxheWVyLmdldE1hcmtlckxheWVyKEBidWZmZXIuZ2V0TWFya2VyTGF5ZXIoQHNlbGVjdGlvbnNNYXJrZXJMYXllci5pZCkuY29weSgpLmlkKVxuICAgIHNvZnRUYWJzID0gQGdldFNvZnRUYWJzKClcbiAgICBuZXcgVGV4dEVkaXRvcih7XG4gICAgICBAYnVmZmVyLCBzZWxlY3Rpb25zTWFya2VyTGF5ZXIsIHNvZnRUYWJzLFxuICAgICAgc3VwcHJlc3NDdXJzb3JDcmVhdGlvbjogdHJ1ZSxcbiAgICAgIHRhYkxlbmd0aDogQHRva2VuaXplZEJ1ZmZlci5nZXRUYWJMZW5ndGgoKSxcbiAgICAgIEBmaXJzdFZpc2libGVTY3JlZW5Sb3csIEBmaXJzdFZpc2libGVTY3JlZW5Db2x1bW4sXG4gICAgICBAYXNzZXJ0LCBkaXNwbGF5TGF5ZXIsIGdyYW1tYXI6IEBnZXRHcmFtbWFyKCksXG4gICAgICBAYXV0b1dpZHRoLCBAYXV0b0hlaWdodFxuICAgIH0pXG5cbiAgIyBDb250cm9scyB2aXNpYmlsaXR5IGJhc2VkIG9uIHRoZSBnaXZlbiB7Qm9vbGVhbn0uXG4gIHNldFZpc2libGU6ICh2aXNpYmxlKSAtPiBAdG9rZW5pemVkQnVmZmVyLnNldFZpc2libGUodmlzaWJsZSlcblxuICBzZXRNaW5pOiAobWluaSkgLT5cbiAgICBAdXBkYXRlKHttaW5pfSlcbiAgICBAbWluaVxuXG4gIGlzTWluaTogLT4gQG1pbmlcblxuICBzZXRVcGRhdGVkU3luY2hyb25vdXNseTogKHVwZGF0ZWRTeW5jaHJvbm91c2x5KSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5zZXRVcGRhdGVkU3luY2hyb25vdXNseSh1cGRhdGVkU3luY2hyb25vdXNseSlcblxuICBvbkRpZENoYW5nZU1pbmk6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1taW5pJywgY2FsbGJhY2tcblxuICBzZXRMaW5lTnVtYmVyR3V0dGVyVmlzaWJsZTogKGxpbmVOdW1iZXJHdXR0ZXJWaXNpYmxlKSAtPiBAdXBkYXRlKHtsaW5lTnVtYmVyR3V0dGVyVmlzaWJsZX0pXG5cbiAgaXNMaW5lTnVtYmVyR3V0dGVyVmlzaWJsZTogLT4gQGxpbmVOdW1iZXJHdXR0ZXIuaXNWaXNpYmxlKClcblxuICBvbkRpZENoYW5nZUxpbmVOdW1iZXJHdXR0ZXJWaXNpYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtbGluZS1udW1iZXItZ3V0dGVyLXZpc2libGUnLCBjYWxsYmFja1xuXG4gICMgRXNzZW50aWFsOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiBhIHtHdXR0ZXJ9IGlzIGFkZGVkIHRvIHRoZSBlZGl0b3IuXG4gICMgSW1tZWRpYXRlbHkgY2FsbHMgeW91ciBjYWxsYmFjayBmb3IgZWFjaCBleGlzdGluZyBndXR0ZXIuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgZ3V0dGVyYCB7R3V0dGVyfSB0aGF0IGN1cnJlbnRseSBleGlzdHMvd2FzIGFkZGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZUd1dHRlcnM6IChjYWxsYmFjaykgLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyLm9ic2VydmVHdXR0ZXJzIGNhbGxiYWNrXG5cbiAgIyBFc3NlbnRpYWw6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIGEge0d1dHRlcn0gaXMgYWRkZWQgdG8gdGhlIGVkaXRvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBndXR0ZXJgIHtHdXR0ZXJ9IHRoYXQgd2FzIGFkZGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBZGRHdXR0ZXI6IChjYWxsYmFjaykgLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyLm9uRGlkQWRkR3V0dGVyIGNhbGxiYWNrXG5cbiAgIyBFc3NlbnRpYWw6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIGEge0d1dHRlcn0gaXMgcmVtb3ZlZCBmcm9tIHRoZSBlZGl0b3IuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgbmFtZWAgVGhlIG5hbWUgb2YgdGhlIHtHdXR0ZXJ9IHRoYXQgd2FzIHJlbW92ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZFJlbW92ZUd1dHRlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBndXR0ZXJDb250YWluZXIub25EaWRSZW1vdmVHdXR0ZXIgY2FsbGJhY2tcblxuICAjIFNldCB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCBjYW4gYmUgZGlzcGxheWVkIGhvcml6b250YWxseSBpbiB0aGVcbiAgIyBlZGl0b3IuXG4gICNcbiAgIyAqIGBlZGl0b3JXaWR0aEluQ2hhcnNgIEEge051bWJlcn0gcmVwcmVzZW50aW5nIHRoZSB3aWR0aCBvZiB0aGVcbiAgIyB7VGV4dEVkaXRvckVsZW1lbnR9IGluIGNoYXJhY3RlcnMuXG4gIHNldEVkaXRvcldpZHRoSW5DaGFyczogKGVkaXRvcldpZHRoSW5DaGFycykgLT4gQHVwZGF0ZSh7ZWRpdG9yV2lkdGhJbkNoYXJzfSlcblxuICAjIFJldHVybnMgdGhlIGVkaXRvciB3aWR0aCBpbiBjaGFyYWN0ZXJzLlxuICBnZXRFZGl0b3JXaWR0aEluQ2hhcnM6IC0+XG4gICAgaWYgQHdpZHRoPyBhbmQgQGRlZmF1bHRDaGFyV2lkdGggPiAwXG4gICAgICBNYXRoLm1heCgwLCBNYXRoLmZsb29yKEB3aWR0aCAvIEBkZWZhdWx0Q2hhcldpZHRoKSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yV2lkdGhJbkNoYXJzXG5cbiAgIyMjXG4gIFNlY3Rpb246IEZpbGUgRGV0YWlsc1xuICAjIyNcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBlZGl0b3IncyB0aXRsZSBmb3IgZGlzcGxheSBpbiBvdGhlciBwYXJ0cyBvZiB0aGVcbiAgIyBVSSBzdWNoIGFzIHRoZSB0YWJzLlxuICAjXG4gICMgSWYgdGhlIGVkaXRvcidzIGJ1ZmZlciBpcyBzYXZlZCwgaXRzIHRpdGxlIGlzIHRoZSBmaWxlIG5hbWUuIElmIGl0IGlzXG4gICMgdW5zYXZlZCwgaXRzIHRpdGxlIGlzIFwidW50aXRsZWRcIi5cbiAgI1xuICAjIFJldHVybnMgYSB7U3RyaW5nfS5cbiAgZ2V0VGl0bGU6IC0+XG4gICAgQGdldEZpbGVOYW1lKCkgPyAndW50aXRsZWQnXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB1bmlxdWUgdGl0bGUgZm9yIGRpc3BsYXkgaW4gb3RoZXIgcGFydHMgb2YgdGhlIFVJLCBzdWNoIGFzXG4gICMgdGhlIHdpbmRvdyB0aXRsZS5cbiAgI1xuICAjIElmIHRoZSBlZGl0b3IncyBidWZmZXIgaXMgdW5zYXZlZCwgaXRzIHRpdGxlIGlzIFwidW50aXRsZWRcIlxuICAjIElmIHRoZSBlZGl0b3IncyBidWZmZXIgaXMgc2F2ZWQsIGl0cyB1bmlxdWUgdGl0bGUgaXMgZm9ybWF0dGVkIGFzIG9uZVxuICAjIG9mIHRoZSBmb2xsb3dpbmcsXG4gICMgKiBcIjxmaWxlbmFtZT5cIiB3aGVuIGl0IGlzIHRoZSBvbmx5IGVkaXRpbmcgYnVmZmVyIHdpdGggdGhpcyBmaWxlIG5hbWUuXG4gICMgKiBcIjxmaWxlbmFtZT4g4oCUIDx1bmlxdWUtZGlyLXByZWZpeD5cIiB3aGVuIG90aGVyIGJ1ZmZlcnMgaGF2ZSB0aGlzIGZpbGUgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7U3RyaW5nfVxuICBnZXRMb25nVGl0bGU6IC0+XG4gICAgaWYgQGdldFBhdGgoKVxuICAgICAgZmlsZU5hbWUgPSBAZ2V0RmlsZU5hbWUoKVxuXG4gICAgICBhbGxQYXRoU2VnbWVudHMgPSBbXVxuICAgICAgZm9yIHRleHRFZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKSB3aGVuIHRleHRFZGl0b3IgaXNudCB0aGlzXG4gICAgICAgIGlmIHRleHRFZGl0b3IuZ2V0RmlsZU5hbWUoKSBpcyBmaWxlTmFtZVxuICAgICAgICAgIGRpcmVjdG9yeVBhdGggPSBmcy50aWxkaWZ5KHRleHRFZGl0b3IuZ2V0RGlyZWN0b3J5UGF0aCgpKVxuICAgICAgICAgIGFsbFBhdGhTZWdtZW50cy5wdXNoKGRpcmVjdG9yeVBhdGguc3BsaXQocGF0aC5zZXApKVxuXG4gICAgICBpZiBhbGxQYXRoU2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lXG5cbiAgICAgIG91clBhdGhTZWdtZW50cyA9IGZzLnRpbGRpZnkoQGdldERpcmVjdG9yeVBhdGgoKSkuc3BsaXQocGF0aC5zZXApXG4gICAgICBhbGxQYXRoU2VnbWVudHMucHVzaCBvdXJQYXRoU2VnbWVudHNcblxuICAgICAgbG9vcFxuICAgICAgICBmaXJzdFNlZ21lbnQgPSBvdXJQYXRoU2VnbWVudHNbMF1cblxuICAgICAgICBjb21tb25CYXNlID0gXy5hbGwoYWxsUGF0aFNlZ21lbnRzLCAocGF0aFNlZ21lbnRzKSAtPiBwYXRoU2VnbWVudHMubGVuZ3RoID4gMSBhbmQgcGF0aFNlZ21lbnRzWzBdIGlzIGZpcnN0U2VnbWVudClcbiAgICAgICAgaWYgY29tbW9uQmFzZVxuICAgICAgICAgIHBhdGhTZWdtZW50cy5zaGlmdCgpIGZvciBwYXRoU2VnbWVudHMgaW4gYWxsUGF0aFNlZ21lbnRzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBicmVha1xuXG4gICAgICBcIiN7ZmlsZU5hbWV9IFxcdTIwMTQgI3twYXRoLmpvaW4ocGF0aFNlZ21lbnRzLi4uKX1cIlxuICAgIGVsc2VcbiAgICAgICd1bnRpdGxlZCdcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyB0aGUge1N0cmluZ30gcGF0aCBvZiB0aGlzIGVkaXRvcidzIHRleHQgYnVmZmVyLlxuICBnZXRQYXRoOiAtPiBAYnVmZmVyLmdldFBhdGgoKVxuXG4gIGdldEZpbGVOYW1lOiAtPlxuICAgIGlmIGZ1bGxQYXRoID0gQGdldFBhdGgoKVxuICAgICAgcGF0aC5iYXNlbmFtZShmdWxsUGF0aClcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgZ2V0RGlyZWN0b3J5UGF0aDogLT5cbiAgICBpZiBmdWxsUGF0aCA9IEBnZXRQYXRoKClcbiAgICAgIHBhdGguZGlybmFtZShmdWxsUGF0aClcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgIyBFeHRlbmRlZDogUmV0dXJucyB0aGUge1N0cmluZ30gY2hhcmFjdGVyIHNldCBlbmNvZGluZyBvZiB0aGlzIGVkaXRvcidzIHRleHRcbiAgIyBidWZmZXIuXG4gIGdldEVuY29kaW5nOiAtPiBAYnVmZmVyLmdldEVuY29kaW5nKClcblxuICAjIEV4dGVuZGVkOiBTZXQgdGhlIGNoYXJhY3RlciBzZXQgZW5jb2RpbmcgdG8gdXNlIGluIHRoaXMgZWRpdG9yJ3MgdGV4dFxuICAjIGJ1ZmZlci5cbiAgI1xuICAjICogYGVuY29kaW5nYCBUaGUge1N0cmluZ30gY2hhcmFjdGVyIHNldCBlbmNvZGluZyBuYW1lIHN1Y2ggYXMgJ3V0ZjgnXG4gIHNldEVuY29kaW5nOiAoZW5jb2RpbmcpIC0+IEBidWZmZXIuc2V0RW5jb2RpbmcoZW5jb2RpbmcpXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGlzIGVkaXRvciBoYXMgYmVlbiBtb2RpZmllZC5cbiAgaXNNb2RpZmllZDogLT4gQGJ1ZmZlci5pc01vZGlmaWVkKClcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoaXMgZWRpdG9yIGhhcyBubyBjb250ZW50LlxuICBpc0VtcHR5OiAtPiBAYnVmZmVyLmlzRW1wdHkoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBGaWxlIE9wZXJhdGlvbnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IFNhdmVzIHRoZSBlZGl0b3IncyB0ZXh0IGJ1ZmZlci5cbiAgI1xuICAjIFNlZSB7VGV4dEJ1ZmZlcjo6c2F2ZX0gZm9yIG1vcmUgZGV0YWlscy5cbiAgc2F2ZTogLT4gQGJ1ZmZlci5zYXZlKClcblxuICAjIEVzc2VudGlhbDogU2F2ZXMgdGhlIGVkaXRvcidzIHRleHQgYnVmZmVyIGFzIHRoZSBnaXZlbiBwYXRoLlxuICAjXG4gICMgU2VlIHtUZXh0QnVmZmVyOjpzYXZlQXN9IGZvciBtb3JlIGRldGFpbHMuXG4gICNcbiAgIyAqIGBmaWxlUGF0aGAgQSB7U3RyaW5nfSBwYXRoLlxuICBzYXZlQXM6IChmaWxlUGF0aCkgLT4gQGJ1ZmZlci5zYXZlQXMoZmlsZVBhdGgpXG5cbiAgIyBEZXRlcm1pbmUgd2hldGhlciB0aGUgdXNlciBzaG91bGQgYmUgcHJvbXB0ZWQgdG8gc2F2ZSBiZWZvcmUgY2xvc2luZ1xuICAjIHRoaXMgZWRpdG9yLlxuICBzaG91bGRQcm9tcHRUb1NhdmU6ICh7d2luZG93Q2xvc2VSZXF1ZXN0ZWQsIHByb2plY3RIYXNQYXRoc309e30pIC0+XG4gICAgaWYgd2luZG93Q2xvc2VSZXF1ZXN0ZWQgYW5kIHByb2plY3RIYXNQYXRoc1xuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICBAaXNNb2RpZmllZCgpIGFuZCBub3QgQGJ1ZmZlci5oYXNNdWx0aXBsZUVkaXRvcnMoKVxuXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB0byBjb25maWd1cmUgZGlhbG9nIHNob3duIHdoZW4gdGhpcyBlZGl0b3IgaXMgc2F2ZWRcbiAgIyB2aWEge1BhbmU6OnNhdmVJdGVtQXN9LlxuICBnZXRTYXZlRGlhbG9nT3B0aW9uczogLT4ge31cblxuICAjIyNcbiAgU2VjdGlvbjogUmVhZGluZyBUZXh0XG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBSZXR1cm5zIGEge1N0cmluZ30gcmVwcmVzZW50aW5nIHRoZSBlbnRpcmUgY29udGVudHMgb2YgdGhlIGVkaXRvci5cbiAgZ2V0VGV4dDogLT4gQGJ1ZmZlci5nZXRUZXh0KClcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSB0ZXh0IGluIHRoZSBnaXZlbiB7UmFuZ2V9IGluIGJ1ZmZlciBjb29yZGluYXRlcy5cbiAgI1xuICAjICogYHJhbmdlYCBBIHtSYW5nZX0gb3IgcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9LlxuICAjXG4gICMgUmV0dXJucyBhIHtTdHJpbmd9LlxuICBnZXRUZXh0SW5CdWZmZXJSYW5nZTogKHJhbmdlKSAtPlxuICAgIEBidWZmZXIuZ2V0VGV4dEluUmFuZ2UocmFuZ2UpXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMgYSB7TnVtYmVyfSByZXByZXNlbnRpbmcgdGhlIG51bWJlciBvZiBsaW5lcyBpbiB0aGUgYnVmZmVyLlxuICBnZXRMaW5lQ291bnQ6IC0+IEBidWZmZXIuZ2V0TGluZUNvdW50KClcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyBhIHtOdW1iZXJ9IHJlcHJlc2VudGluZyB0aGUgbnVtYmVyIG9mIHNjcmVlbiBsaW5lcyBpbiB0aGVcbiAgIyBlZGl0b3IuIFRoaXMgYWNjb3VudHMgZm9yIGZvbGRzLlxuICBnZXRTY3JlZW5MaW5lQ291bnQ6IC0+IEBkaXNwbGF5TGF5ZXIuZ2V0U2NyZWVuTGluZUNvdW50KClcblxuICBnZXRBcHByb3hpbWF0ZVNjcmVlbkxpbmVDb3VudDogLT4gQGRpc3BsYXlMYXllci5nZXRBcHByb3hpbWF0ZVNjcmVlbkxpbmVDb3VudCgpXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMgYSB7TnVtYmVyfSByZXByZXNlbnRpbmcgdGhlIGxhc3QgemVyby1pbmRleGVkIGJ1ZmZlciByb3dcbiAgIyBudW1iZXIgb2YgdGhlIGVkaXRvci5cbiAgZ2V0TGFzdEJ1ZmZlclJvdzogLT4gQGJ1ZmZlci5nZXRMYXN0Um93KClcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyBhIHtOdW1iZXJ9IHJlcHJlc2VudGluZyB0aGUgbGFzdCB6ZXJvLWluZGV4ZWQgc2NyZWVuIHJvd1xuICAjIG51bWJlciBvZiB0aGUgZWRpdG9yLlxuICBnZXRMYXN0U2NyZWVuUm93OiAtPiBAZ2V0U2NyZWVuTGluZUNvdW50KCkgLSAxXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMgYSB7U3RyaW5nfSByZXByZXNlbnRpbmcgdGhlIGNvbnRlbnRzIG9mIHRoZSBsaW5lIGF0IHRoZVxuICAjIGdpdmVuIGJ1ZmZlciByb3cuXG4gICNcbiAgIyAqIGBidWZmZXJSb3dgIEEge051bWJlcn0gcmVwcmVzZW50aW5nIGEgemVyby1pbmRleGVkIGJ1ZmZlciByb3cuXG4gIGxpbmVUZXh0Rm9yQnVmZmVyUm93OiAoYnVmZmVyUm93KSAtPiBAYnVmZmVyLmxpbmVGb3JSb3coYnVmZmVyUm93KVxuXG4gICMgRXNzZW50aWFsOiBSZXR1cm5zIGEge1N0cmluZ30gcmVwcmVzZW50aW5nIHRoZSBjb250ZW50cyBvZiB0aGUgbGluZSBhdCB0aGVcbiAgIyBnaXZlbiBzY3JlZW4gcm93LlxuICAjXG4gICMgKiBgc2NyZWVuUm93YCBBIHtOdW1iZXJ9IHJlcHJlc2VudGluZyBhIHplcm8taW5kZXhlZCBzY3JlZW4gcm93LlxuICBsaW5lVGV4dEZvclNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAc2NyZWVuTGluZUZvclNjcmVlblJvdyhzY3JlZW5Sb3cpPy5saW5lVGV4dFxuXG4gIGxvZ1NjcmVlbkxpbmVzOiAoc3RhcnQ9MCwgZW5kPUBnZXRMYXN0U2NyZWVuUm93KCkpIC0+XG4gICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF1cbiAgICAgIGxpbmUgPSBAbGluZVRleHRGb3JTY3JlZW5Sb3cocm93KVxuICAgICAgY29uc29sZS5sb2cgcm93LCBAYnVmZmVyUm93Rm9yU2NyZWVuUm93KHJvdyksIGxpbmUsIGxpbmUubGVuZ3RoXG4gICAgcmV0dXJuXG5cbiAgdG9rZW5zRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPlxuICAgIHRva2VucyA9IFtdXG4gICAgbGluZVRleHRJbmRleCA9IDBcbiAgICBjdXJyZW50VG9rZW5TY29wZXMgPSBbXVxuICAgIHtsaW5lVGV4dCwgdGFnQ29kZXN9ID0gQHNjcmVlbkxpbmVGb3JTY3JlZW5Sb3coc2NyZWVuUm93KVxuICAgIGZvciB0YWdDb2RlIGluIHRhZ0NvZGVzXG4gICAgICBpZiBAZGlzcGxheUxheWVyLmlzT3BlblRhZ0NvZGUodGFnQ29kZSlcbiAgICAgICAgY3VycmVudFRva2VuU2NvcGVzLnB1c2goQGRpc3BsYXlMYXllci50YWdGb3JDb2RlKHRhZ0NvZGUpKVxuICAgICAgZWxzZSBpZiBAZGlzcGxheUxheWVyLmlzQ2xvc2VUYWdDb2RlKHRhZ0NvZGUpXG4gICAgICAgIGN1cnJlbnRUb2tlblNjb3Blcy5wb3AoKVxuICAgICAgZWxzZVxuICAgICAgICB0b2tlbnMucHVzaCh7XG4gICAgICAgICAgdGV4dDogbGluZVRleHQuc3Vic3RyKGxpbmVUZXh0SW5kZXgsIHRhZ0NvZGUpXG4gICAgICAgICAgc2NvcGVzOiBjdXJyZW50VG9rZW5TY29wZXMuc2xpY2UoKVxuICAgICAgICB9KVxuICAgICAgICBsaW5lVGV4dEluZGV4ICs9IHRhZ0NvZGVcbiAgICB0b2tlbnNcblxuICBzY3JlZW5MaW5lRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPlxuICAgIEBkaXNwbGF5TGF5ZXIuZ2V0U2NyZWVuTGluZXMoc2NyZWVuUm93LCBzY3JlZW5Sb3cgKyAxKVswXVxuXG4gIGJ1ZmZlclJvd0ZvclNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAZGlzcGxheUxheWVyLnRyYW5zbGF0ZVNjcmVlblBvc2l0aW9uKFBvaW50KHNjcmVlblJvdywgMCkpLnJvd1xuXG4gIGJ1ZmZlclJvd3NGb3JTY3JlZW5Sb3dzOiAoc3RhcnRTY3JlZW5Sb3csIGVuZFNjcmVlblJvdykgLT5cbiAgICBmb3Igc2NyZWVuUm93IGluIFtzdGFydFNjcmVlblJvdy4uZW5kU2NyZWVuUm93XVxuICAgICAgQGJ1ZmZlclJvd0ZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG5cbiAgc2NyZWVuUm93Rm9yQnVmZmVyUm93OiAocm93KSAtPlxuICAgIGlmIEBsYXJnZUZpbGVNb2RlXG4gICAgICByb3dcbiAgICBlbHNlXG4gICAgICBAZGlzcGxheUxheWVyLnRyYW5zbGF0ZUJ1ZmZlclBvc2l0aW9uKFBvaW50KHJvdywgMCkpLnJvd1xuXG4gIGdldFJpZ2h0bW9zdFNjcmVlblBvc2l0aW9uOiAtPiBAZGlzcGxheUxheWVyLmdldFJpZ2h0bW9zdFNjcmVlblBvc2l0aW9uKClcblxuICBnZXRBcHByb3hpbWF0ZVJpZ2h0bW9zdFNjcmVlblBvc2l0aW9uOiAtPiBAZGlzcGxheUxheWVyLmdldEFwcHJveGltYXRlUmlnaHRtb3N0U2NyZWVuUG9zaXRpb24oKVxuXG4gIGdldE1heFNjcmVlbkxpbmVMZW5ndGg6IC0+IEBnZXRSaWdodG1vc3RTY3JlZW5Qb3NpdGlvbigpLmNvbHVtblxuXG4gIGdldExvbmdlc3RTY3JlZW5Sb3c6IC0+IEBnZXRSaWdodG1vc3RTY3JlZW5Qb3NpdGlvbigpLnJvd1xuXG4gIGdldEFwcHJveGltYXRlTG9uZ2VzdFNjcmVlblJvdzogLT4gQGdldEFwcHJveGltYXRlUmlnaHRtb3N0U2NyZWVuUG9zaXRpb24oKS5yb3dcblxuICBsaW5lTGVuZ3RoRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPiBAZGlzcGxheUxheWVyLmxpbmVMZW5ndGhGb3JTY3JlZW5Sb3coc2NyZWVuUm93KVxuXG4gICMgUmV0dXJucyB0aGUgcmFuZ2UgZm9yIHRoZSBnaXZlbiBidWZmZXIgcm93LlxuICAjXG4gICMgKiBgcm93YCBBIHJvdyB7TnVtYmVyfS5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIG9wdGlvbnMgaGFzaCB3aXRoIGFuIGBpbmNsdWRlTmV3bGluZWAga2V5LlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93OiAocm93LCB7aW5jbHVkZU5ld2xpbmV9PXt9KSAtPiBAYnVmZmVyLnJhbmdlRm9yUm93KHJvdywgaW5jbHVkZU5ld2xpbmUpXG5cbiAgIyBHZXQgdGhlIHRleHQgaW4gdGhlIGdpdmVuIHtSYW5nZX0uXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldFRleHRJblJhbmdlOiAocmFuZ2UpIC0+IEBidWZmZXIuZ2V0VGV4dEluUmFuZ2UocmFuZ2UpXG5cbiAgIyB7RGVsZWdhdGVzIHRvOiBUZXh0QnVmZmVyLmlzUm93Qmxhbmt9XG4gIGlzQnVmZmVyUm93Qmxhbms6IChidWZmZXJSb3cpIC0+IEBidWZmZXIuaXNSb3dCbGFuayhidWZmZXJSb3cpXG5cbiAgIyB7RGVsZWdhdGVzIHRvOiBUZXh0QnVmZmVyLm5leHROb25CbGFua1Jvd31cbiAgbmV4dE5vbkJsYW5rQnVmZmVyUm93OiAoYnVmZmVyUm93KSAtPiBAYnVmZmVyLm5leHROb25CbGFua1JvdyhidWZmZXJSb3cpXG5cbiAgIyB7RGVsZWdhdGVzIHRvOiBUZXh0QnVmZmVyLmdldEVuZFBvc2l0aW9ufVxuICBnZXRFb2ZCdWZmZXJQb3NpdGlvbjogLT4gQGJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUge1JhbmdlfSBvZiB0aGUgcGFyYWdyYXBoIHN1cnJvdW5kaW5nIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkXG4gICMgY3Vyc29yLlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGdldEN1cnJlbnRQYXJhZ3JhcGhCdWZmZXJSYW5nZTogLT5cbiAgICBAZ2V0TGFzdEN1cnNvcigpLmdldEN1cnJlbnRQYXJhZ3JhcGhCdWZmZXJSYW5nZSgpXG5cblxuICAjIyNcbiAgU2VjdGlvbjogTXV0YXRpbmcgVGV4dFxuICAjIyNcblxuICAjIEVzc2VudGlhbDogUmVwbGFjZXMgdGhlIGVudGlyZSBjb250ZW50cyBvZiB0aGUgYnVmZmVyIHdpdGggdGhlIGdpdmVuIHtTdHJpbmd9LlxuICAjXG4gICMgKiBgdGV4dGAgQSB7U3RyaW5nfSB0byByZXBsYWNlIHdpdGhcbiAgc2V0VGV4dDogKHRleHQpIC0+IEBidWZmZXIuc2V0VGV4dCh0ZXh0KVxuXG4gICMgRXNzZW50aWFsOiBTZXQgdGhlIHRleHQgaW4gdGhlIGdpdmVuIHtSYW5nZX0gaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgKiBgcmFuZ2VgIEEge1JhbmdlfSBvciByYW5nZS1jb21wYXRpYmxlIHtBcnJheX0uXG4gICMgKiBgdGV4dGAgQSB7U3RyaW5nfVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYG5vcm1hbGl6ZUxpbmVFbmRpbmdzYCAob3B0aW9uYWwpIHtCb29sZWFufSAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHVuZG9gIChvcHRpb25hbCkge1N0cmluZ30gJ3NraXAnIHdpbGwgc2tpcCB0aGUgdW5kbyBzeXN0ZW1cbiAgI1xuICAjIFJldHVybnMgdGhlIHtSYW5nZX0gb2YgdGhlIG5ld2x5LWluc2VydGVkIHRleHQuXG4gIHNldFRleHRJbkJ1ZmZlclJhbmdlOiAocmFuZ2UsIHRleHQsIG9wdGlvbnMpIC0+IEBnZXRCdWZmZXIoKS5zZXRUZXh0SW5SYW5nZShyYW5nZSwgdGV4dCwgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogRm9yIGVhY2ggc2VsZWN0aW9uLCByZXBsYWNlIHRoZSBzZWxlY3RlZCB0ZXh0IHdpdGggdGhlIGdpdmVuIHRleHQuXG4gICNcbiAgIyAqIGB0ZXh0YCBBIHtTdHJpbmd9IHJlcHJlc2VudGluZyB0aGUgdGV4dCB0byBpbnNlcnQuXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBTZWUge1NlbGVjdGlvbjo6aW5zZXJ0VGV4dH0uXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfSB3aGVuIHRoZSB0ZXh0IGhhcyBiZWVuIGluc2VydGVkXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSBmYWxzZSB3aGVuIHRoZSB0ZXh0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICBpbnNlcnRUZXh0OiAodGV4dCwgb3B0aW9ucz17fSkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBlbWl0V2lsbEluc2VydFRleHRFdmVudCh0ZXh0KVxuXG4gICAgZ3JvdXBpbmdJbnRlcnZhbCA9IGlmIG9wdGlvbnMuZ3JvdXBVbmRvXG4gICAgICBAdW5kb0dyb3VwaW5nSW50ZXJ2YWxcbiAgICBlbHNlXG4gICAgICAwXG5cbiAgICBvcHRpb25zLmF1dG9JbmRlbnROZXdsaW5lID89IEBzaG91bGRBdXRvSW5kZW50KClcbiAgICBvcHRpb25zLmF1dG9EZWNyZWFzZUluZGVudCA/PSBAc2hvdWxkQXV0b0luZGVudCgpXG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dChcbiAgICAgIChzZWxlY3Rpb24pID0+XG4gICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwgb3B0aW9ucylcbiAgICAgICAgZGlkSW5zZXJ0RXZlbnQgPSB7dGV4dCwgcmFuZ2V9XG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1pbnNlcnQtdGV4dCcsIGRpZEluc2VydEV2ZW50XG4gICAgICAgIHJhbmdlXG4gICAgICAsIGdyb3VwaW5nSW50ZXJ2YWxcbiAgICApXG5cbiAgIyBFc3NlbnRpYWw6IEZvciBlYWNoIHNlbGVjdGlvbiwgcmVwbGFjZSB0aGUgc2VsZWN0ZWQgdGV4dCB3aXRoIGEgbmV3bGluZS5cbiAgaW5zZXJ0TmV3bGluZTogLT5cbiAgICBAaW5zZXJ0VGV4dCgnXFxuJylcblxuICAjIEVzc2VudGlhbDogRm9yIGVhY2ggc2VsZWN0aW9uLCBpZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBkZWxldGUgdGhlIGNoYXJhY3RlclxuICAjIGZvbGxvd2luZyB0aGUgY3Vyc29yLiBPdGhlcndpc2UgZGVsZXRlIHRoZSBzZWxlY3RlZCB0ZXh0LlxuICBkZWxldGU6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZGVsZXRlKClcblxuICAjIEVzc2VudGlhbDogRm9yIGVhY2ggc2VsZWN0aW9uLCBpZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBkZWxldGUgdGhlIGNoYXJhY3RlclxuICAjIHByZWNlZGluZyB0aGUgY3Vyc29yLiBPdGhlcndpc2UgZGVsZXRlIHRoZSBzZWxlY3RlZCB0ZXh0LlxuICBiYWNrc3BhY2U6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uYmFja3NwYWNlKClcblxuICAjIEV4dGVuZGVkOiBNdXRhdGUgdGhlIHRleHQgb2YgYWxsIHRoZSBzZWxlY3Rpb25zIGluIGEgc2luZ2xlIHRyYW5zYWN0aW9uLlxuICAjXG4gICMgQWxsIHRoZSBjaGFuZ2VzIG1hZGUgaW5zaWRlIHRoZSBnaXZlbiB7RnVuY3Rpb259IGNhbiBiZSByZXZlcnRlZCB3aXRoIGFcbiAgIyBzaW5nbGUgY2FsbCB0byB7Ojp1bmRvfS5cbiAgI1xuICAjICogYGZuYCBBIHtGdW5jdGlvbn0gdGhhdCB3aWxsIGJlIGNhbGxlZCBvbmNlIGZvciBlYWNoIHtTZWxlY3Rpb259LiBUaGUgZmlyc3RcbiAgIyAgICAgIGFyZ3VtZW50IHdpbGwgYmUgYSB7U2VsZWN0aW9ufSBhbmQgdGhlIHNlY29uZCBhcmd1bWVudCB3aWxsIGJlIHRoZVxuICAjICAgICAge051bWJlcn0gaW5kZXggb2YgdGhhdCBzZWxlY3Rpb24uXG4gIG11dGF0ZVNlbGVjdGVkVGV4dDogKGZuLCBncm91cGluZ0ludGVydmFsPTApIC0+XG4gICAgQG1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucyA9PlxuICAgICAgQHRyYW5zYWN0IGdyb3VwaW5nSW50ZXJ2YWwsID0+XG4gICAgICAgIGZuKHNlbGVjdGlvbiwgaW5kZXgpIGZvciBzZWxlY3Rpb24sIGluZGV4IGluIEBnZXRTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVxuXG4gICMgTW92ZSBsaW5lcyBpbnRlcnNlY3RpbmcgdGhlIG1vc3QgcmVjZW50IHNlbGVjdGlvbiBvciBtdWx0aXBsZSBzZWxlY3Rpb25zXG4gICMgdXAgYnkgb25lIHJvdyBpbiBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gIG1vdmVMaW5lVXA6IC0+XG4gICAgc2VsZWN0aW9ucyA9IEBnZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpLnNvcnQoKGEsIGIpIC0+IGEuY29tcGFyZShiKSlcblxuICAgIGlmIHNlbGVjdGlvbnNbMF0uc3RhcnQucm93IGlzIDBcbiAgICAgIHJldHVyblxuXG4gICAgaWYgc2VsZWN0aW9uc1tzZWxlY3Rpb25zLmxlbmd0aCAtIDFdLnN0YXJ0LnJvdyBpcyBAZ2V0TGFzdEJ1ZmZlclJvdygpIGFuZCBAYnVmZmVyLmdldExhc3RMaW5lKCkgaXMgJydcbiAgICAgIHJldHVyblxuXG4gICAgQHRyYW5zYWN0ID0+XG4gICAgICBuZXdTZWxlY3Rpb25SYW5nZXMgPSBbXVxuXG4gICAgICB3aGlsZSBzZWxlY3Rpb25zLmxlbmd0aCA+IDBcbiAgICAgICAgIyBGaW5kIHNlbGVjdGlvbnMgc3Bhbm5pbmcgYSBjb250aWd1b3VzIHNldCBvZiBsaW5lc1xuICAgICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb25zLnNoaWZ0KClcbiAgICAgICAgc2VsZWN0aW9uc1RvTW92ZSA9IFtzZWxlY3Rpb25dXG5cbiAgICAgICAgd2hpbGUgc2VsZWN0aW9uLmVuZC5yb3cgaXMgc2VsZWN0aW9uc1swXT8uc3RhcnQucm93XG4gICAgICAgICAgc2VsZWN0aW9uc1RvTW92ZS5wdXNoKHNlbGVjdGlvbnNbMF0pXG4gICAgICAgICAgc2VsZWN0aW9uLmVuZC5yb3cgPSBzZWxlY3Rpb25zWzBdLmVuZC5yb3dcbiAgICAgICAgICBzZWxlY3Rpb25zLnNoaWZ0KClcblxuICAgICAgICAjIENvbXB1dGUgdGhlIGJ1ZmZlciByYW5nZSBzcGFubmVkIGJ5IGFsbCB0aGVzZSBzZWxlY3Rpb25zLCBleHBhbmRpbmcgaXRcbiAgICAgICAgIyBzbyB0aGF0IGl0IGluY2x1ZGVzIGFueSBmb2xkZWQgcmVnaW9uIHRoYXQgaW50ZXJzZWN0cyB0aGVtLlxuICAgICAgICBzdGFydFJvdyA9IHNlbGVjdGlvbi5zdGFydC5yb3dcbiAgICAgICAgZW5kUm93ID0gc2VsZWN0aW9uLmVuZC5yb3dcbiAgICAgICAgaWYgc2VsZWN0aW9uLmVuZC5yb3cgPiBzZWxlY3Rpb24uc3RhcnQucm93IGFuZCBzZWxlY3Rpb24uZW5kLmNvbHVtbiBpcyAwXG4gICAgICAgICAgIyBEb24ndCBtb3ZlIHRoZSBsYXN0IGxpbmUgb2YgYSBtdWx0aS1saW5lIHNlbGVjdGlvbiBpZiB0aGUgc2VsZWN0aW9uIGVuZHMgYXQgY29sdW1uIDBcbiAgICAgICAgICBlbmRSb3ctLVxuXG4gICAgICAgIHtidWZmZXJSb3c6IHN0YXJ0Um93fSA9IEBkaXNwbGF5TGF5ZXIubGluZVN0YXJ0Qm91bmRhcnlGb3JCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICAgIHtidWZmZXJSb3c6IGVuZFJvd30gPSBAZGlzcGxheUxheWVyLmxpbmVFbmRCb3VuZGFyeUZvckJ1ZmZlclJvdyhlbmRSb3cpXG4gICAgICAgIGxpbmVzUmFuZ2UgPSBuZXcgUmFuZ2UoUG9pbnQoc3RhcnRSb3csIDApLCBQb2ludChlbmRSb3csIDApKVxuXG4gICAgICAgICMgSWYgc2VsZWN0ZWQgbGluZSByYW5nZSBpcyBwcmVjZWRlZCBieSBhIGZvbGQsIG9uZSBsaW5lIGFib3ZlIG9uIHNjcmVlblxuICAgICAgICAjIGNvdWxkIGJlIG11bHRpcGxlIGxpbmVzIGluIHRoZSBidWZmZXIuXG4gICAgICAgIHtidWZmZXJSb3c6IHByZWNlZGluZ1Jvd30gPSBAZGlzcGxheUxheWVyLmxpbmVTdGFydEJvdW5kYXJ5Rm9yQnVmZmVyUm93KHN0YXJ0Um93IC0gMSlcbiAgICAgICAgaW5zZXJ0RGVsdGEgPSBsaW5lc1JhbmdlLnN0YXJ0LnJvdyAtIHByZWNlZGluZ1Jvd1xuXG4gICAgICAgICMgQW55IGZvbGRzIGluIHRoZSB0ZXh0IHRoYXQgaXMgbW92ZWQgd2lsbCBuZWVkIHRvIGJlIHJlLWNyZWF0ZWQuXG4gICAgICAgICMgSXQgaW5jbHVkZXMgdGhlIGZvbGRzIHRoYXQgd2VyZSBpbnRlcnNlY3Rpbmcgd2l0aCB0aGUgc2VsZWN0aW9uLlxuICAgICAgICByYW5nZXNUb1JlZm9sZCA9IEBkaXNwbGF5TGF5ZXJcbiAgICAgICAgICAuZGVzdHJveUZvbGRzSW50ZXJzZWN0aW5nQnVmZmVyUmFuZ2UobGluZXNSYW5nZSlcbiAgICAgICAgICAubWFwKChyYW5nZSkgLT4gcmFuZ2UudHJhbnNsYXRlKFstaW5zZXJ0RGVsdGEsIDBdKSlcblxuICAgICAgICAjIERlbGV0ZSBsaW5lcyBzcGFubmVkIGJ5IHNlbGVjdGlvbiBhbmQgaW5zZXJ0IHRoZW0gb24gdGhlIHByZWNlZGluZyBidWZmZXIgcm93XG4gICAgICAgIGxpbmVzID0gQGJ1ZmZlci5nZXRUZXh0SW5SYW5nZShsaW5lc1JhbmdlKVxuICAgICAgICBsaW5lcyArPSBAYnVmZmVyLmxpbmVFbmRpbmdGb3JSb3cobGluZXNSYW5nZS5lbmQucm93IC0gMSkgdW5sZXNzIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdIGlzICdcXG4nXG4gICAgICAgIEBidWZmZXIuZGVsZXRlKGxpbmVzUmFuZ2UpXG4gICAgICAgIEBidWZmZXIuaW5zZXJ0KFtwcmVjZWRpbmdSb3csIDBdLCBsaW5lcylcblxuICAgICAgICAjIFJlc3RvcmUgZm9sZHMgdGhhdCBleGlzdGVkIGJlZm9yZSB0aGUgbGluZXMgd2VyZSBtb3ZlZFxuICAgICAgICBmb3IgcmFuZ2VUb1JlZm9sZCBpbiByYW5nZXNUb1JlZm9sZFxuICAgICAgICAgIEBkaXNwbGF5TGF5ZXIuZm9sZEJ1ZmZlclJhbmdlKHJhbmdlVG9SZWZvbGQpXG5cbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBzZWxlY3Rpb25zVG9Nb3ZlXG4gICAgICAgICAgbmV3U2VsZWN0aW9uUmFuZ2VzLnB1c2goc2VsZWN0aW9uLnRyYW5zbGF0ZShbLWluc2VydERlbHRhLCAwXSkpXG5cbiAgICAgIEBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhuZXdTZWxlY3Rpb25SYW5nZXMsIHthdXRvc2Nyb2xsOiBmYWxzZSwgcHJlc2VydmVGb2xkczogdHJ1ZX0pXG4gICAgICBAYXV0b0luZGVudFNlbGVjdGVkUm93cygpIGlmIEBzaG91bGRBdXRvSW5kZW50KClcbiAgICAgIEBzY3JvbGxUb0J1ZmZlclBvc2l0aW9uKFtuZXdTZWxlY3Rpb25SYW5nZXNbMF0uc3RhcnQucm93LCAwXSlcblxuICAjIE1vdmUgbGluZXMgaW50ZXJzZWN0aW5nIHRoZSBtb3N0IHJlY2VudCBzZWxlY3Rpb24gb3IgbXVpbHRpcGxlIHNlbGVjdGlvbnNcbiAgIyBkb3duIGJ5IG9uZSByb3cgaW4gc2NyZWVuIGNvb3JkaW5hdGVzLlxuICBtb3ZlTGluZURvd246IC0+XG4gICAgc2VsZWN0aW9ucyA9IEBnZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgc2VsZWN0aW9ucy5zb3J0IChhLCBiKSAtPiBhLmNvbXBhcmUoYilcbiAgICBzZWxlY3Rpb25zID0gc2VsZWN0aW9ucy5yZXZlcnNlKClcblxuICAgIEB0cmFuc2FjdCA9PlxuICAgICAgQGNvbnNvbGlkYXRlU2VsZWN0aW9ucygpXG4gICAgICBuZXdTZWxlY3Rpb25SYW5nZXMgPSBbXVxuXG4gICAgICB3aGlsZSBzZWxlY3Rpb25zLmxlbmd0aCA+IDBcbiAgICAgICAgIyBGaW5kIHNlbGVjdGlvbnMgc3Bhbm5pbmcgYSBjb250aWd1b3VzIHNldCBvZiBsaW5lc1xuICAgICAgICBzZWxlY3Rpb24gPSBzZWxlY3Rpb25zLnNoaWZ0KClcbiAgICAgICAgc2VsZWN0aW9uc1RvTW92ZSA9IFtzZWxlY3Rpb25dXG5cbiAgICAgICAgIyBpZiB0aGUgY3VycmVudCBzZWxlY3Rpb24gc3RhcnQgcm93IG1hdGNoZXMgdGhlIG5leHQgc2VsZWN0aW9ucycgZW5kIHJvdyAtIG1ha2UgdGhlbSBvbmUgc2VsZWN0aW9uXG4gICAgICAgIHdoaWxlIHNlbGVjdGlvbi5zdGFydC5yb3cgaXMgc2VsZWN0aW9uc1swXT8uZW5kLnJvd1xuICAgICAgICAgIHNlbGVjdGlvbnNUb01vdmUucHVzaChzZWxlY3Rpb25zWzBdKVxuICAgICAgICAgIHNlbGVjdGlvbi5zdGFydC5yb3cgPSBzZWxlY3Rpb25zWzBdLnN0YXJ0LnJvd1xuICAgICAgICAgIHNlbGVjdGlvbnMuc2hpZnQoKVxuXG4gICAgICAgICMgQ29tcHV0ZSB0aGUgYnVmZmVyIHJhbmdlIHNwYW5uZWQgYnkgYWxsIHRoZXNlIHNlbGVjdGlvbnMsIGV4cGFuZGluZyBpdFxuICAgICAgICAjIHNvIHRoYXQgaXQgaW5jbHVkZXMgYW55IGZvbGRlZCByZWdpb24gdGhhdCBpbnRlcnNlY3RzIHRoZW0uXG4gICAgICAgIHN0YXJ0Um93ID0gc2VsZWN0aW9uLnN0YXJ0LnJvd1xuICAgICAgICBlbmRSb3cgPSBzZWxlY3Rpb24uZW5kLnJvd1xuICAgICAgICBpZiBzZWxlY3Rpb24uZW5kLnJvdyA+IHNlbGVjdGlvbi5zdGFydC5yb3cgYW5kIHNlbGVjdGlvbi5lbmQuY29sdW1uIGlzIDBcbiAgICAgICAgICAjIERvbid0IG1vdmUgdGhlIGxhc3QgbGluZSBvZiBhIG11bHRpLWxpbmUgc2VsZWN0aW9uIGlmIHRoZSBzZWxlY3Rpb24gZW5kcyBhdCBjb2x1bW4gMFxuICAgICAgICAgIGVuZFJvdy0tXG5cbiAgICAgICAge2J1ZmZlclJvdzogc3RhcnRSb3d9ID0gQGRpc3BsYXlMYXllci5saW5lU3RhcnRCb3VuZGFyeUZvckJ1ZmZlclJvdyhzdGFydFJvdylcbiAgICAgICAge2J1ZmZlclJvdzogZW5kUm93fSA9IEBkaXNwbGF5TGF5ZXIubGluZUVuZEJvdW5kYXJ5Rm9yQnVmZmVyUm93KGVuZFJvdylcbiAgICAgICAgbGluZXNSYW5nZSA9IG5ldyBSYW5nZShQb2ludChzdGFydFJvdywgMCksIFBvaW50KGVuZFJvdywgMCkpXG5cbiAgICAgICAgIyBJZiBzZWxlY3RlZCBsaW5lIHJhbmdlIGlzIGZvbGxvd2VkIGJ5IGEgZm9sZCwgb25lIGxpbmUgYmVsb3cgb24gc2NyZWVuXG4gICAgICAgICMgY291bGQgYmUgbXVsdGlwbGUgbGluZXMgaW4gdGhlIGJ1ZmZlci4gQnV0IGF0IHRoZSBzYW1lIHRpbWUsIGlmIHRoZVxuICAgICAgICAjIG5leHQgYnVmZmVyIHJvdyBpcyB3cmFwcGVkLCBvbmUgbGluZSBpbiB0aGUgYnVmZmVyIGNhbiByZXByZXNlbnQgbWFueVxuICAgICAgICAjIHNjcmVlbiByb3dzLlxuICAgICAgICB7YnVmZmVyUm93OiBmb2xsb3dpbmdSb3d9ID0gQGRpc3BsYXlMYXllci5saW5lRW5kQm91bmRhcnlGb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgICBpbnNlcnREZWx0YSA9IGZvbGxvd2luZ1JvdyAtIGxpbmVzUmFuZ2UuZW5kLnJvd1xuXG4gICAgICAgICMgQW55IGZvbGRzIGluIHRoZSB0ZXh0IHRoYXQgaXMgbW92ZWQgd2lsbCBuZWVkIHRvIGJlIHJlLWNyZWF0ZWQuXG4gICAgICAgICMgSXQgaW5jbHVkZXMgdGhlIGZvbGRzIHRoYXQgd2VyZSBpbnRlcnNlY3Rpbmcgd2l0aCB0aGUgc2VsZWN0aW9uLlxuICAgICAgICByYW5nZXNUb1JlZm9sZCA9IEBkaXNwbGF5TGF5ZXJcbiAgICAgICAgICAuZGVzdHJveUZvbGRzSW50ZXJzZWN0aW5nQnVmZmVyUmFuZ2UobGluZXNSYW5nZSlcbiAgICAgICAgICAubWFwKChyYW5nZSkgLT4gcmFuZ2UudHJhbnNsYXRlKFtpbnNlcnREZWx0YSwgMF0pKVxuXG4gICAgICAgICMgRGVsZXRlIGxpbmVzIHNwYW5uZWQgYnkgc2VsZWN0aW9uIGFuZCBpbnNlcnQgdGhlbSBvbiB0aGUgZm9sbG93aW5nIGNvcnJlY3QgYnVmZmVyIHJvd1xuICAgICAgICBsaW5lcyA9IEBidWZmZXIuZ2V0VGV4dEluUmFuZ2UobGluZXNSYW5nZSlcbiAgICAgICAgaWYgZm9sbG93aW5nUm93IC0gMSBpcyBAYnVmZmVyLmdldExhc3RSb3coKVxuICAgICAgICAgIGxpbmVzID0gXCJcXG4je2xpbmVzfVwiXG5cbiAgICAgICAgQGJ1ZmZlci5pbnNlcnQoW2ZvbGxvd2luZ1JvdywgMF0sIGxpbmVzKVxuICAgICAgICBAYnVmZmVyLmRlbGV0ZShsaW5lc1JhbmdlKVxuXG4gICAgICAgICMgUmVzdG9yZSBmb2xkcyB0aGF0IGV4aXN0ZWQgYmVmb3JlIHRoZSBsaW5lcyB3ZXJlIG1vdmVkXG4gICAgICAgIGZvciByYW5nZVRvUmVmb2xkIGluIHJhbmdlc1RvUmVmb2xkXG4gICAgICAgICAgQGRpc3BsYXlMYXllci5mb2xkQnVmZmVyUmFuZ2UocmFuZ2VUb1JlZm9sZClcblxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNUb01vdmVcbiAgICAgICAgICBuZXdTZWxlY3Rpb25SYW5nZXMucHVzaChzZWxlY3Rpb24udHJhbnNsYXRlKFtpbnNlcnREZWx0YSwgMF0pKVxuXG4gICAgICBAc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMobmV3U2VsZWN0aW9uUmFuZ2VzLCB7YXV0b3Njcm9sbDogZmFsc2UsIHByZXNlcnZlRm9sZHM6IHRydWV9KVxuICAgICAgQGF1dG9JbmRlbnRTZWxlY3RlZFJvd3MoKSBpZiBAc2hvdWxkQXV0b0luZGVudCgpXG4gICAgICBAc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihbbmV3U2VsZWN0aW9uUmFuZ2VzWzBdLnN0YXJ0LnJvdyAtIDEsIDBdKVxuXG4gICMgTW92ZSBhbnkgYWN0aXZlIHNlbGVjdGlvbnMgb25lIGNvbHVtbiB0byB0aGUgbGVmdC5cbiAgbW92ZVNlbGVjdGlvbkxlZnQ6IC0+XG4gICAgc2VsZWN0aW9ucyA9IEBnZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgbm9TZWxlY3Rpb25BdFN0YXJ0T2ZMaW5lID0gc2VsZWN0aW9ucy5ldmVyeSgoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLnN0YXJ0LmNvbHVtbiBpc250IDBcbiAgICApXG5cbiAgICB0cmFuc2xhdGlvbkRlbHRhID0gWzAsIC0xXVxuICAgIHRyYW5zbGF0ZWRSYW5nZXMgPSBbXVxuXG4gICAgaWYgbm9TZWxlY3Rpb25BdFN0YXJ0T2ZMaW5lXG4gICAgICBAdHJhbnNhY3QgPT5cbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBzZWxlY3Rpb25zXG4gICAgICAgICAgY2hhclRvTGVmdE9mU2VsZWN0aW9uID0gbmV3IFJhbmdlKHNlbGVjdGlvbi5zdGFydC50cmFuc2xhdGUodHJhbnNsYXRpb25EZWx0YSksIHNlbGVjdGlvbi5zdGFydClcbiAgICAgICAgICBjaGFyVGV4dFRvTGVmdE9mU2VsZWN0aW9uID0gQGJ1ZmZlci5nZXRUZXh0SW5SYW5nZShjaGFyVG9MZWZ0T2ZTZWxlY3Rpb24pXG5cbiAgICAgICAgICBAYnVmZmVyLmluc2VydChzZWxlY3Rpb24uZW5kLCBjaGFyVGV4dFRvTGVmdE9mU2VsZWN0aW9uKVxuICAgICAgICAgIEBidWZmZXIuZGVsZXRlKGNoYXJUb0xlZnRPZlNlbGVjdGlvbilcbiAgICAgICAgICB0cmFuc2xhdGVkUmFuZ2VzLnB1c2goc2VsZWN0aW9uLnRyYW5zbGF0ZSh0cmFuc2xhdGlvbkRlbHRhKSlcblxuICAgICAgICBAc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXModHJhbnNsYXRlZFJhbmdlcylcblxuICAjIE1vdmUgYW55IGFjdGl2ZSBzZWxlY3Rpb25zIG9uZSBjb2x1bW4gdG8gdGhlIHJpZ2h0LlxuICBtb3ZlU2VsZWN0aW9uUmlnaHQ6IC0+XG4gICAgc2VsZWN0aW9ucyA9IEBnZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgbm9TZWxlY3Rpb25BdEVuZE9mTGluZSA9IHNlbGVjdGlvbnMuZXZlcnkoKHNlbGVjdGlvbikgPT5cbiAgICAgIHNlbGVjdGlvbi5lbmQuY29sdW1uIGlzbnQgQGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KHNlbGVjdGlvbi5lbmQucm93KVxuICAgIClcblxuICAgIHRyYW5zbGF0aW9uRGVsdGEgPSBbMCwgMV1cbiAgICB0cmFuc2xhdGVkUmFuZ2VzID0gW11cblxuICAgIGlmIG5vU2VsZWN0aW9uQXRFbmRPZkxpbmVcbiAgICAgIEB0cmFuc2FjdCA9PlxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNcbiAgICAgICAgICBjaGFyVG9SaWdodE9mU2VsZWN0aW9uID0gbmV3IFJhbmdlKHNlbGVjdGlvbi5lbmQsIHNlbGVjdGlvbi5lbmQudHJhbnNsYXRlKHRyYW5zbGF0aW9uRGVsdGEpKVxuICAgICAgICAgIGNoYXJUZXh0VG9SaWdodE9mU2VsZWN0aW9uID0gQGJ1ZmZlci5nZXRUZXh0SW5SYW5nZShjaGFyVG9SaWdodE9mU2VsZWN0aW9uKVxuXG4gICAgICAgICAgQGJ1ZmZlci5kZWxldGUoY2hhclRvUmlnaHRPZlNlbGVjdGlvbilcbiAgICAgICAgICBAYnVmZmVyLmluc2VydChzZWxlY3Rpb24uc3RhcnQsIGNoYXJUZXh0VG9SaWdodE9mU2VsZWN0aW9uKVxuICAgICAgICAgIHRyYW5zbGF0ZWRSYW5nZXMucHVzaChzZWxlY3Rpb24udHJhbnNsYXRlKHRyYW5zbGF0aW9uRGVsdGEpKVxuXG4gICAgICAgIEBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyh0cmFuc2xhdGVkUmFuZ2VzKVxuXG4gICMgRHVwbGljYXRlIHRoZSBtb3N0IHJlY2VudCBjdXJzb3IncyBjdXJyZW50IGxpbmUuXG4gIGR1cGxpY2F0ZUxpbmVzOiAtPlxuICAgIEB0cmFuc2FjdCA9PlxuICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKCkucmV2ZXJzZSgpXG4gICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICAgICAge3N0YXJ0fSA9IHNlbGVjdGlvbi5nZXRTY3JlZW5SYW5nZSgpXG4gICAgICAgICAgc2VsZWN0aW9uLnNldFNjcmVlblJhbmdlKFtbc3RhcnQucm93LCAwXSwgW3N0YXJ0LnJvdyArIDEsIDBdXSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICAgICAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgICAgICBlbmRSb3crK1xuXG4gICAgICAgIGludGVyc2VjdGluZ0ZvbGRzID0gQGRpc3BsYXlMYXllci5mb2xkc0ludGVyc2VjdGluZ0J1ZmZlclJhbmdlKFtbc3RhcnRSb3csIDBdLCBbZW5kUm93LCAwXV0pXG4gICAgICAgIHJhbmdlVG9EdXBsaWNhdGUgPSBbW3N0YXJ0Um93LCAwXSwgW2VuZFJvdywgMF1dXG4gICAgICAgIHRleHRUb0R1cGxpY2F0ZSA9IEBnZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZVRvRHVwbGljYXRlKVxuICAgICAgICB0ZXh0VG9EdXBsaWNhdGUgPSAnXFxuJyArIHRleHRUb0R1cGxpY2F0ZSBpZiBlbmRSb3cgPiBAZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgICAgIEBidWZmZXIuaW5zZXJ0KFtlbmRSb3csIDBdLCB0ZXh0VG9EdXBsaWNhdGUpXG5cbiAgICAgICAgZGVsdGEgPSBlbmRSb3cgLSBzdGFydFJvd1xuICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2Uoc2VsZWN0ZWRCdWZmZXJSYW5nZS50cmFuc2xhdGUoW2RlbHRhLCAwXSkpXG4gICAgICAgIGZvciBmb2xkIGluIGludGVyc2VjdGluZ0ZvbGRzXG4gICAgICAgICAgZm9sZFJhbmdlID0gQGRpc3BsYXlMYXllci5idWZmZXJSYW5nZUZvckZvbGQoZm9sZClcbiAgICAgICAgICBAZGlzcGxheUxheWVyLmZvbGRCdWZmZXJSYW5nZShmb2xkUmFuZ2UudHJhbnNsYXRlKFtkZWx0YSwgMF0pKVxuICAgICAgcmV0dXJuXG5cbiAgcmVwbGFjZVNlbGVjdGVkVGV4dDogKG9wdGlvbnM9e30sIGZuKSAtPlxuICAgIHtzZWxlY3RXb3JkSWZFbXB0eX0gPSBvcHRpb25zXG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPlxuICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgaWYgc2VsZWN0V29yZElmRW1wdHkgYW5kIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFdvcmQoKVxuICAgICAgdGV4dCA9IHNlbGVjdGlvbi5nZXRUZXh0KClcbiAgICAgIHNlbGVjdGlvbi5kZWxldGVTZWxlY3RlZFRleHQoKVxuICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoZm4odGV4dCkpXG4gICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UocmFuZ2UpXG5cbiAgIyBTcGxpdCBtdWx0aS1saW5lIHNlbGVjdGlvbnMgaW50byBvbmUgc2VsZWN0aW9uIHBlciBsaW5lLlxuICAjXG4gICMgT3BlcmF0ZXMgb24gYWxsIHNlbGVjdGlvbnMuIFRoaXMgbWV0aG9kIGJyZWFrcyBhcGFydCBhbGwgbXVsdGktbGluZVxuICAjIHNlbGVjdGlvbnMgdG8gY3JlYXRlIG11bHRpcGxlIHNpbmdsZS1saW5lIHNlbGVjdGlvbnMgdGhhdCBjdW11bGF0aXZlbHkgY292ZXJcbiAgIyB0aGUgc2FtZSBvcmlnaW5hbCBhcmVhLlxuICBzcGxpdFNlbGVjdGlvbnNJbnRvTGluZXM6IC0+XG4gICAgQG1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucyA9PlxuICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgICAgY29udGludWUgaWYgcmFuZ2UuaXNTaW5nbGVMaW5lKClcblxuICAgICAgICB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICAgICAgICBAYWRkU2VsZWN0aW9uRm9yQnVmZmVyUmFuZ2UoW3N0YXJ0LCBbc3RhcnQucm93LCBJbmZpbml0eV1dKVxuICAgICAgICB7cm93fSA9IHN0YXJ0XG4gICAgICAgIHdoaWxlICsrcm93IDwgZW5kLnJvd1xuICAgICAgICAgIEBhZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShbW3JvdywgMF0sIFtyb3csIEluZmluaXR5XV0pXG4gICAgICAgIEBhZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShbW2VuZC5yb3csIDBdLCBbZW5kLnJvdywgZW5kLmNvbHVtbl1dKSB1bmxlc3MgZW5kLmNvbHVtbiBpcyAwXG4gICAgICAgIHNlbGVjdGlvbi5kZXN0cm95KClcbiAgICAgIHJldHVyblxuXG4gICMgRXh0ZW5kZWQ6IEZvciBlYWNoIHNlbGVjdGlvbiwgdHJhbnNwb3NlIHRoZSBzZWxlY3RlZCB0ZXh0LlxuICAjXG4gICMgSWYgdGhlIHNlbGVjdGlvbiBpcyBlbXB0eSwgdGhlIGNoYXJhY3RlcnMgcHJlY2VkaW5nIGFuZCBmb2xsb3dpbmcgdGhlIGN1cnNvclxuICAjIGFyZSBzd2FwcGVkLiBPdGhlcndpc2UsIHRoZSBzZWxlY3RlZCBjaGFyYWN0ZXJzIGFyZSByZXZlcnNlZC5cbiAgdHJhbnNwb3NlOiAtPlxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgICAgdGV4dCA9IHNlbGVjdGlvbi5nZXRUZXh0KClcbiAgICAgICAgc2VsZWN0aW9uLmRlbGV0ZSgpXG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IubW92ZUxlZnQoKVxuICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCB0ZXh0XG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0IHNlbGVjdGlvbi5nZXRUZXh0KCkuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKVxuXG4gICMgRXh0ZW5kZWQ6IENvbnZlcnQgdGhlIHNlbGVjdGVkIHRleHQgdG8gdXBwZXIgY2FzZS5cbiAgI1xuICAjIEZvciBlYWNoIHNlbGVjdGlvbiwgaWYgdGhlIHNlbGVjdGlvbiBpcyBlbXB0eSwgY29udmVydHMgdGhlIGNvbnRhaW5pbmcgd29yZFxuICAjIHRvIHVwcGVyIGNhc2UuIE90aGVyd2lzZSBjb252ZXJ0IHRoZSBzZWxlY3RlZCB0ZXh0IHRvIHVwcGVyIGNhc2UuXG4gIHVwcGVyQ2FzZTogLT5cbiAgICBAcmVwbGFjZVNlbGVjdGVkVGV4dCBzZWxlY3RXb3JkSWZFbXB0eTogdHJ1ZSwgKHRleHQpIC0+IHRleHQudG9VcHBlckNhc2UoKVxuXG4gICMgRXh0ZW5kZWQ6IENvbnZlcnQgdGhlIHNlbGVjdGVkIHRleHQgdG8gbG93ZXIgY2FzZS5cbiAgI1xuICAjIEZvciBlYWNoIHNlbGVjdGlvbiwgaWYgdGhlIHNlbGVjdGlvbiBpcyBlbXB0eSwgY29udmVydHMgdGhlIGNvbnRhaW5pbmcgd29yZFxuICAjIHRvIHVwcGVyIGNhc2UuIE90aGVyd2lzZSBjb252ZXJ0IHRoZSBzZWxlY3RlZCB0ZXh0IHRvIHVwcGVyIGNhc2UuXG4gIGxvd2VyQ2FzZTogLT5cbiAgICBAcmVwbGFjZVNlbGVjdGVkVGV4dCBzZWxlY3RXb3JkSWZFbXB0eTogdHJ1ZSwgKHRleHQpIC0+IHRleHQudG9Mb3dlckNhc2UoKVxuXG4gICMgRXh0ZW5kZWQ6IFRvZ2dsZSBsaW5lIGNvbW1lbnRzIGZvciByb3dzIGludGVyc2VjdGluZyBzZWxlY3Rpb25zLlxuICAjXG4gICMgSWYgdGhlIGN1cnJlbnQgZ3JhbW1hciBkb2Vzbid0IHN1cHBvcnQgY29tbWVudHMsIGRvZXMgbm90aGluZy5cbiAgdG9nZ2xlTGluZUNvbW1lbnRzSW5TZWxlY3Rpb246IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24udG9nZ2xlTGluZUNvbW1lbnRzKClcblxuICAjIENvbnZlcnQgbXVsdGlwbGUgbGluZXMgdG8gYSBzaW5nbGUgbGluZS5cbiAgI1xuICAjIE9wZXJhdGVzIG9uIGFsbCBzZWxlY3Rpb25zLiBJZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBqb2lucyB0aGUgY3VycmVudFxuICAjIGxpbmUgd2l0aCB0aGUgbmV4dCBsaW5lLiBPdGhlcndpc2UgaXQgam9pbnMgYWxsIGxpbmVzIHRoYXQgaW50ZXJzZWN0IHRoZVxuICAjIHNlbGVjdGlvbi5cbiAgI1xuICAjIEpvaW5pbmcgYSBsaW5lIG1lYW5zIHRoYXQgbXVsdGlwbGUgbGluZXMgYXJlIGNvbnZlcnRlZCB0byBhIHNpbmdsZSBsaW5lIHdpdGhcbiAgIyB0aGUgY29udGVudHMgb2YgZWFjaCBvZiB0aGUgb3JpZ2luYWwgbm9uLWVtcHR5IGxpbmVzIHNlcGFyYXRlZCBieSBhIHNwYWNlLlxuICBqb2luTGluZXM6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uam9pbkxpbmVzKClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBjdXJzb3IsIGluc2VydCBhIG5ld2xpbmUgYXQgYmVnaW5uaW5nIHRoZSBmb2xsb3dpbmcgbGluZS5cbiAgaW5zZXJ0TmV3bGluZUJlbG93OiAtPlxuICAgIEB0cmFuc2FjdCA9PlxuICAgICAgQG1vdmVUb0VuZE9mTGluZSgpXG4gICAgICBAaW5zZXJ0TmV3bGluZSgpXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggY3Vyc29yLCBpbnNlcnQgYSBuZXdsaW5lIGF0IHRoZSBlbmQgb2YgdGhlIHByZWNlZGluZyBsaW5lLlxuICBpbnNlcnROZXdsaW5lQWJvdmU6IC0+XG4gICAgQHRyYW5zYWN0ID0+XG4gICAgICBidWZmZXJSb3cgPSBAZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICAgIGluZGVudExldmVsID0gQGluZGVudGF0aW9uRm9yQnVmZmVyUm93KGJ1ZmZlclJvdylcbiAgICAgIG9uRmlyc3RMaW5lID0gYnVmZmVyUm93IGlzIDBcblxuICAgICAgQG1vdmVUb0JlZ2lubmluZ09mTGluZSgpXG4gICAgICBAbW92ZUxlZnQoKVxuICAgICAgQGluc2VydE5ld2xpbmUoKVxuXG4gICAgICBpZiBAc2hvdWxkQXV0b0luZGVudCgpIGFuZCBAaW5kZW50YXRpb25Gb3JCdWZmZXJSb3coYnVmZmVyUm93KSA8IGluZGVudExldmVsXG4gICAgICAgIEBzZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhidWZmZXJSb3csIGluZGVudExldmVsKVxuXG4gICAgICBpZiBvbkZpcnN0TGluZVxuICAgICAgICBAbW92ZVVwKClcbiAgICAgICAgQG1vdmVUb0VuZE9mTGluZSgpXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggc2VsZWN0aW9uLCBpZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBkZWxldGUgYWxsIGNoYXJhY3RlcnNcbiAgIyBvZiB0aGUgY29udGFpbmluZyB3b3JkIHRoYXQgcHJlY2VkZSB0aGUgY3Vyc29yLiBPdGhlcndpc2UgZGVsZXRlIHRoZVxuICAjIHNlbGVjdGVkIHRleHQuXG4gIGRlbGV0ZVRvQmVnaW5uaW5nT2ZXb3JkOiAtPlxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmRlbGV0ZVRvQmVnaW5uaW5nT2ZXb3JkKClcblxuICAjIEV4dGVuZGVkOiBTaW1pbGFyIHRvIHs6OmRlbGV0ZVRvQmVnaW5uaW5nT2ZXb3JkfSwgYnV0IGRlbGV0ZXMgb25seSBiYWNrIHRvIHRoZVxuICAjIHByZXZpb3VzIHdvcmQgYm91bmRhcnkuXG4gIGRlbGV0ZVRvUHJldmlvdXNXb3JkQm91bmRhcnk6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZGVsZXRlVG9QcmV2aW91c1dvcmRCb3VuZGFyeSgpXG5cbiAgIyBFeHRlbmRlZDogU2ltaWxhciB0byB7OjpkZWxldGVUb0VuZE9mV29yZH0sIGJ1dCBkZWxldGVzIG9ubHkgdXAgdG8gdGhlXG4gICMgbmV4dCB3b3JkIGJvdW5kYXJ5LlxuICBkZWxldGVUb05leHRXb3JkQm91bmRhcnk6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZGVsZXRlVG9OZXh0V29yZEJvdW5kYXJ5KClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBzZWxlY3Rpb24sIGlmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHksIGRlbGV0ZSBhbGwgY2hhcmFjdGVyc1xuICAjIG9mIHRoZSBjb250YWluaW5nIHN1YndvcmQgZm9sbG93aW5nIHRoZSBjdXJzb3IuIE90aGVyd2lzZSBkZWxldGUgdGhlIHNlbGVjdGVkXG4gICMgdGV4dC5cbiAgZGVsZXRlVG9CZWdpbm5pbmdPZlN1YndvcmQ6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZGVsZXRlVG9CZWdpbm5pbmdPZlN1YndvcmQoKVxuXG4gICMgRXh0ZW5kZWQ6IEZvciBlYWNoIHNlbGVjdGlvbiwgaWYgdGhlIHNlbGVjdGlvbiBpcyBlbXB0eSwgZGVsZXRlIGFsbCBjaGFyYWN0ZXJzXG4gICMgb2YgdGhlIGNvbnRhaW5pbmcgc3Vid29yZCBmb2xsb3dpbmcgdGhlIGN1cnNvci4gT3RoZXJ3aXNlIGRlbGV0ZSB0aGUgc2VsZWN0ZWRcbiAgIyB0ZXh0LlxuICBkZWxldGVUb0VuZE9mU3Vid29yZDogLT5cbiAgICBAbXV0YXRlU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5kZWxldGVUb0VuZE9mU3Vid29yZCgpXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggc2VsZWN0aW9uLCBpZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBkZWxldGUgYWxsIGNoYXJhY3RlcnNcbiAgIyBvZiB0aGUgY29udGFpbmluZyBsaW5lIHRoYXQgcHJlY2VkZSB0aGUgY3Vyc29yLiBPdGhlcndpc2UgZGVsZXRlIHRoZVxuICAjIHNlbGVjdGVkIHRleHQuXG4gIGRlbGV0ZVRvQmVnaW5uaW5nT2ZMaW5lOiAtPlxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmRlbGV0ZVRvQmVnaW5uaW5nT2ZMaW5lKClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBzZWxlY3Rpb24sIGlmIHRoZSBzZWxlY3Rpb24gaXMgbm90IGVtcHR5LCBkZWxldGVzIHRoZVxuICAjIHNlbGVjdGlvbjsgb3RoZXJ3aXNlLCBkZWxldGVzIGFsbCBjaGFyYWN0ZXJzIG9mIHRoZSBjb250YWluaW5nIGxpbmVcbiAgIyBmb2xsb3dpbmcgdGhlIGN1cnNvci4gSWYgdGhlIGN1cnNvciBpcyBhbHJlYWR5IGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUsXG4gICMgZGVsZXRlcyB0aGUgZm9sbG93aW5nIG5ld2xpbmUuXG4gIGRlbGV0ZVRvRW5kT2ZMaW5lOiAtPlxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmRlbGV0ZVRvRW5kT2ZMaW5lKClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBzZWxlY3Rpb24sIGlmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHksIGRlbGV0ZSBhbGwgY2hhcmFjdGVyc1xuICAjIG9mIHRoZSBjb250YWluaW5nIHdvcmQgZm9sbG93aW5nIHRoZSBjdXJzb3IuIE90aGVyd2lzZSBkZWxldGUgdGhlIHNlbGVjdGVkXG4gICMgdGV4dC5cbiAgZGVsZXRlVG9FbmRPZldvcmQ6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZGVsZXRlVG9FbmRPZldvcmQoKVxuXG4gICMgRXh0ZW5kZWQ6IERlbGV0ZSBhbGwgbGluZXMgaW50ZXJzZWN0aW5nIHNlbGVjdGlvbnMuXG4gIGRlbGV0ZUxpbmU6IC0+XG4gICAgQG1lcmdlU2VsZWN0aW9uc09uU2FtZVJvd3MoKVxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmRlbGV0ZUxpbmUoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBIaXN0b3J5XG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBVbmRvIHRoZSBsYXN0IGNoYW5nZS5cbiAgdW5kbzogLT5cbiAgICBAYXZvaWRNZXJnaW5nU2VsZWN0aW9ucyA9PiBAYnVmZmVyLnVuZG8oKVxuICAgIEBnZXRMYXN0U2VsZWN0aW9uKCkuYXV0b3Njcm9sbCgpXG5cbiAgIyBFc3NlbnRpYWw6IFJlZG8gdGhlIGxhc3QgY2hhbmdlLlxuICByZWRvOiAtPlxuICAgIEBhdm9pZE1lcmdpbmdTZWxlY3Rpb25zID0+IEBidWZmZXIucmVkbygpXG4gICAgQGdldExhc3RTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKClcblxuICAjIEV4dGVuZGVkOiBCYXRjaCBtdWx0aXBsZSBvcGVyYXRpb25zIGFzIGEgc2luZ2xlIHVuZG8vcmVkbyBzdGVwLlxuICAjXG4gICMgQW55IGdyb3VwIG9mIG9wZXJhdGlvbnMgdGhhdCBhcmUgbG9naWNhbGx5IGdyb3VwZWQgZnJvbSB0aGUgcGVyc3BlY3RpdmUgb2ZcbiAgIyB1bmRvaW5nIGFuZCByZWRvaW5nIHNob3VsZCBiZSBwZXJmb3JtZWQgaW4gYSB0cmFuc2FjdGlvbi4gSWYgeW91IHdhbnQgdG9cbiAgIyBhYm9ydCB0aGUgdHJhbnNhY3Rpb24sIGNhbGwgezo6YWJvcnRUcmFuc2FjdGlvbn0gdG8gdGVybWluYXRlIHRoZSBmdW5jdGlvbidzXG4gICMgZXhlY3V0aW9uIGFuZCByZXZlcnQgYW55IGNoYW5nZXMgcGVyZm9ybWVkIHVwIHRvIHRoZSBhYm9ydGlvbi5cbiAgI1xuICAjICogYGdyb3VwaW5nSW50ZXJ2YWxgIChvcHRpb25hbCkgVGhlIHtOdW1iZXJ9IG9mIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdGhpc1xuICAjICAgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIGNvbnNpZGVyZWQgJ2dyb3VwYWJsZScgYWZ0ZXIgaXQgYmVnaW5zLiBJZiBhIHRyYW5zYWN0aW9uXG4gICMgICB3aXRoIGEgcG9zaXRpdmUgYGdyb3VwaW5nSW50ZXJ2YWxgIGlzIGNvbW1pdHRlZCB3aGlsZSB0aGUgcHJldmlvdXMgdHJhbnNhY3Rpb24gaXNcbiAgIyAgIHN0aWxsICdncm91cGFibGUnLCB0aGUgdHdvIHRyYW5zYWN0aW9ucyBhcmUgbWVyZ2VkIHdpdGggcmVzcGVjdCB0byB1bmRvIGFuZCByZWRvLlxuICAjICogYGZuYCBBIHtGdW5jdGlvbn0gdG8gY2FsbCBpbnNpZGUgdGhlIHRyYW5zYWN0aW9uLlxuICB0cmFuc2FjdDogKGdyb3VwaW5nSW50ZXJ2YWwsIGZuKSAtPlxuICAgIEBidWZmZXIudHJhbnNhY3QoZ3JvdXBpbmdJbnRlcnZhbCwgZm4pXG5cbiAgIyBEZXByZWNhdGVkOiBTdGFydCBhbiBvcGVuLWVuZGVkIHRyYW5zYWN0aW9uLlxuICBiZWdpblRyYW5zYWN0aW9uOiAoZ3JvdXBpbmdJbnRlcnZhbCkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZSgnVHJhbnNhY3Rpb25zIHNob3VsZCBiZSBwZXJmb3JtZWQgdmlhIFRleHRFZGl0b3I6OnRyYW5zYWN0IG9ubHknKVxuICAgIEBidWZmZXIuYmVnaW5UcmFuc2FjdGlvbihncm91cGluZ0ludGVydmFsKVxuXG4gICMgRGVwcmVjYXRlZDogQ29tbWl0IGFuIG9wZW4tZW5kZWQgdHJhbnNhY3Rpb24gc3RhcnRlZCB3aXRoIHs6OmJlZ2luVHJhbnNhY3Rpb259LlxuICBjb21taXRUcmFuc2FjdGlvbjogLT5cbiAgICBHcmltLmRlcHJlY2F0ZSgnVHJhbnNhY3Rpb25zIHNob3VsZCBiZSBwZXJmb3JtZWQgdmlhIFRleHRFZGl0b3I6OnRyYW5zYWN0IG9ubHknKVxuICAgIEBidWZmZXIuY29tbWl0VHJhbnNhY3Rpb24oKVxuXG4gICMgRXh0ZW5kZWQ6IEFib3J0IGFuIG9wZW4gdHJhbnNhY3Rpb24sIHVuZG9pbmcgYW55IG9wZXJhdGlvbnMgcGVyZm9ybWVkIHNvIGZhclxuICAjIHdpdGhpbiB0aGUgdHJhbnNhY3Rpb24uXG4gIGFib3J0VHJhbnNhY3Rpb246IC0+IEBidWZmZXIuYWJvcnRUcmFuc2FjdGlvbigpXG5cbiAgIyBFeHRlbmRlZDogQ3JlYXRlIGEgcG9pbnRlciB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgYnVmZmVyIGZvciB1c2VcbiAgIyB3aXRoIHs6OnJldmVydFRvQ2hlY2twb2ludH0gYW5kIHs6Omdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludH0uXG4gICNcbiAgIyBSZXR1cm5zIGEgY2hlY2twb2ludCB2YWx1ZS5cbiAgY3JlYXRlQ2hlY2twb2ludDogLT4gQGJ1ZmZlci5jcmVhdGVDaGVja3BvaW50KClcblxuICAjIEV4dGVuZGVkOiBSZXZlcnQgdGhlIGJ1ZmZlciB0byB0aGUgc3RhdGUgaXQgd2FzIGluIHdoZW4gdGhlIGdpdmVuXG4gICMgY2hlY2twb2ludCB3YXMgY3JlYXRlZC5cbiAgI1xuICAjIFRoZSByZWRvIHN0YWNrIHdpbGwgYmUgZW1wdHkgZm9sbG93aW5nIHRoaXMgb3BlcmF0aW9uLCBzbyBjaGFuZ2VzIHNpbmNlIHRoZVxuICAjIGNoZWNrcG9pbnQgd2lsbCBiZSBsb3N0LiBJZiB0aGUgZ2l2ZW4gY2hlY2twb2ludCBpcyBubyBsb25nZXIgcHJlc2VudCBpbiB0aGVcbiAgIyB1bmRvIGhpc3RvcnksIG5vIGNoYW5nZXMgd2lsbCBiZSBtYWRlIHRvIHRoZSBidWZmZXIgYW5kIHRoaXMgbWV0aG9kIHdpbGxcbiAgIyByZXR1cm4gYGZhbHNlYC5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBvcGVyYXRpb24gc3VjY2VlZGVkLlxuICByZXZlcnRUb0NoZWNrcG9pbnQ6IChjaGVja3BvaW50KSAtPiBAYnVmZmVyLnJldmVydFRvQ2hlY2twb2ludChjaGVja3BvaW50KVxuXG4gICMgRXh0ZW5kZWQ6IEdyb3VwIGFsbCBjaGFuZ2VzIHNpbmNlIHRoZSBnaXZlbiBjaGVja3BvaW50IGludG8gYSBzaW5nbGVcbiAgIyB0cmFuc2FjdGlvbiBmb3IgcHVycG9zZXMgb2YgdW5kby9yZWRvLlxuICAjXG4gICMgSWYgdGhlIGdpdmVuIGNoZWNrcG9pbnQgaXMgbm8gbG9uZ2VyIHByZXNlbnQgaW4gdGhlIHVuZG8gaGlzdG9yeSwgbm9cbiAgIyBncm91cGluZyB3aWxsIGJlIHBlcmZvcm1lZCBhbmQgdGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYGZhbHNlYC5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBvcGVyYXRpb24gc3VjY2VlZGVkLlxuICBncm91cENoYW5nZXNTaW5jZUNoZWNrcG9pbnQ6IChjaGVja3BvaW50KSAtPiBAYnVmZmVyLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChjaGVja3BvaW50KVxuXG4gICMjI1xuICBTZWN0aW9uOiBUZXh0RWRpdG9yIENvb3JkaW5hdGVzXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBDb252ZXJ0IGEgcG9zaXRpb24gaW4gYnVmZmVyLWNvb3JkaW5hdGVzIHRvIHNjcmVlbi1jb29yZGluYXRlcy5cbiAgI1xuICAjIFRoZSBwb3NpdGlvbiBpcyBjbGlwcGVkIHZpYSB7OjpjbGlwQnVmZmVyUG9zaXRpb259IHByaW9yIHRvIHRoZSBjb252ZXJzaW9uLlxuICAjIFRoZSBwb3NpdGlvbiBpcyBhbHNvIGNsaXBwZWQgdmlhIHs6OmNsaXBTY3JlZW5Qb3NpdGlvbn0gZm9sbG93aW5nIHRoZVxuICAjIGNvbnZlcnNpb24sIHdoaWNoIG9ubHkgbWFrZXMgYSBkaWZmZXJlbmNlIHdoZW4gYG9wdGlvbnNgIGFyZSBzdXBwbGllZC5cbiAgI1xuICAjICogYGJ1ZmZlclBvc2l0aW9uYCBBIHtQb2ludH0gb3Ige0FycmF5fSBvZiBbcm93LCBjb2x1bW5dLlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyBoYXNoIGZvciB7OjpjbGlwU2NyZWVuUG9zaXRpb259LlxuICAjXG4gICMgUmV0dXJucyBhIHtQb2ludH0uXG4gIHNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb246IChidWZmZXJQb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBpZiBvcHRpb25zPy5jbGlwP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYGNsaXBgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb25gIGluc3RlYWQuXCIpXG4gICAgICBvcHRpb25zLmNsaXBEaXJlY3Rpb24gPz0gb3B0aW9ucy5jbGlwXG4gICAgaWYgb3B0aW9ucz8ud3JhcEF0U29mdE5ld2xpbmVzP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYHdyYXBBdFNvZnROZXdsaW5lc2AgcGFyYW1ldGVyIGhhcyBiZWVuIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBzb29uLiBQbGVhc2UsIHVzZSBgY2xpcERpcmVjdGlvbjogJ2ZvcndhcmQnYCBpbnN0ZWFkLlwiKVxuICAgICAgb3B0aW9ucy5jbGlwRGlyZWN0aW9uID89IGlmIG9wdGlvbnMud3JhcEF0U29mdE5ld2xpbmVzIHRoZW4gJ2ZvcndhcmQnIGVsc2UgJ2JhY2t3YXJkJ1xuICAgIGlmIG9wdGlvbnM/LndyYXBCZXlvbmROZXdsaW5lcz9cbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhlIGB3cmFwQmV5b25kTmV3bGluZXNgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb246ICdmb3J3YXJkJ2AgaW5zdGVhZC5cIilcbiAgICAgIG9wdGlvbnMuY2xpcERpcmVjdGlvbiA/PSBpZiBvcHRpb25zLndyYXBCZXlvbmROZXdsaW5lcyB0aGVuICdmb3J3YXJkJyBlbHNlICdiYWNrd2FyZCdcblxuICAgIEBkaXNwbGF5TGF5ZXIudHJhbnNsYXRlQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24sIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IENvbnZlcnQgYSBwb3NpdGlvbiBpbiBzY3JlZW4tY29vcmRpbmF0ZXMgdG8gYnVmZmVyLWNvb3JkaW5hdGVzLlxuICAjXG4gICMgVGhlIHBvc2l0aW9uIGlzIGNsaXBwZWQgdmlhIHs6OmNsaXBTY3JlZW5Qb3NpdGlvbn0gcHJpb3IgdG8gdGhlIGNvbnZlcnNpb24uXG4gICNcbiAgIyAqIGBidWZmZXJQb3NpdGlvbmAgQSB7UG9pbnR9IG9yIHtBcnJheX0gb2YgW3JvdywgY29sdW1uXS5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIG9wdGlvbnMgaGFzaCBmb3Igezo6Y2xpcFNjcmVlblBvc2l0aW9ufS5cbiAgI1xuICAjIFJldHVybnMgYSB7UG9pbnR9LlxuICBidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgaWYgb3B0aW9ucz8uY2xpcD9cbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhlIGBjbGlwYCBwYXJhbWV0ZXIgaGFzIGJlZW4gZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIHNvb24uIFBsZWFzZSwgdXNlIGBjbGlwRGlyZWN0aW9uYCBpbnN0ZWFkLlwiKVxuICAgICAgb3B0aW9ucy5jbGlwRGlyZWN0aW9uID89IG9wdGlvbnMuY2xpcFxuICAgIGlmIG9wdGlvbnM/LndyYXBBdFNvZnROZXdsaW5lcz9cbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhlIGB3cmFwQXRTb2Z0TmV3bGluZXNgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb246ICdmb3J3YXJkJ2AgaW5zdGVhZC5cIilcbiAgICAgIG9wdGlvbnMuY2xpcERpcmVjdGlvbiA/PSBpZiBvcHRpb25zLndyYXBBdFNvZnROZXdsaW5lcyB0aGVuICdmb3J3YXJkJyBlbHNlICdiYWNrd2FyZCdcbiAgICBpZiBvcHRpb25zPy53cmFwQmV5b25kTmV3bGluZXM/XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlRoZSBgd3JhcEJleW9uZE5ld2xpbmVzYCBwYXJhbWV0ZXIgaGFzIGJlZW4gZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIHNvb24uIFBsZWFzZSwgdXNlIGBjbGlwRGlyZWN0aW9uOiAnZm9yd2FyZCdgIGluc3RlYWQuXCIpXG4gICAgICBvcHRpb25zLmNsaXBEaXJlY3Rpb24gPz0gaWYgb3B0aW9ucy53cmFwQmV5b25kTmV3bGluZXMgdGhlbiAnZm9yd2FyZCcgZWxzZSAnYmFja3dhcmQnXG5cbiAgICBAZGlzcGxheUxheWVyLnRyYW5zbGF0ZVNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBDb252ZXJ0IGEgcmFuZ2UgaW4gYnVmZmVyLWNvb3JkaW5hdGVzIHRvIHNjcmVlbi1jb29yZGluYXRlcy5cbiAgI1xuICAjICogYGJ1ZmZlclJhbmdlYCB7UmFuZ2V9IGluIGJ1ZmZlciBjb29yZGluYXRlcyB0byB0cmFuc2xhdGUgaW50byBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfS5cbiAgc2NyZWVuUmFuZ2VGb3JCdWZmZXJSYW5nZTogKGJ1ZmZlclJhbmdlLCBvcHRpb25zKSAtPlxuICAgIGJ1ZmZlclJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChidWZmZXJSYW5nZSlcbiAgICBzdGFydCA9IEBzY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclJhbmdlLnN0YXJ0LCBvcHRpb25zKVxuICAgIGVuZCA9IEBzY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclJhbmdlLmVuZCwgb3B0aW9ucylcbiAgICBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcblxuICAjIEVzc2VudGlhbDogQ29udmVydCBhIHJhbmdlIGluIHNjcmVlbi1jb29yZGluYXRlcyB0byBidWZmZXItY29vcmRpbmF0ZXMuXG4gICNcbiAgIyAqIGBzY3JlZW5SYW5nZWAge1JhbmdlfSBpbiBzY3JlZW4gY29vcmRpbmF0ZXMgdG8gdHJhbnNsYXRlIGludG8gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSkgLT5cbiAgICBzY3JlZW5SYW5nZSA9IFJhbmdlLmZyb21PYmplY3Qoc2NyZWVuUmFuZ2UpXG4gICAgc3RhcnQgPSBAYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5zdGFydClcbiAgICBlbmQgPSBAYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5lbmQpXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG5cbiAgIyBFeHRlbmRlZDogQ2xpcCB0aGUgZ2l2ZW4ge1BvaW50fSB0byBhIHZhbGlkIHBvc2l0aW9uIGluIHRoZSBidWZmZXIuXG4gICNcbiAgIyBJZiB0aGUgZ2l2ZW4ge1BvaW50fSBkZXNjcmliZXMgYSBwb3NpdGlvbiB0aGF0IGlzIGFjdHVhbGx5IHJlYWNoYWJsZSBieSB0aGVcbiAgIyBjdXJzb3IgYmFzZWQgb24gdGhlIGN1cnJlbnQgY29udGVudHMgb2YgdGhlIGJ1ZmZlciwgaXQgaXMgcmV0dXJuZWRcbiAgIyB1bmNoYW5nZWQuIElmIHRoZSB7UG9pbnR9IGRvZXMgbm90IGRlc2NyaWJlIGEgdmFsaWQgcG9zaXRpb24sIHRoZSBjbG9zZXN0XG4gICMgdmFsaWQgcG9zaXRpb24gaXMgcmV0dXJuZWQgaW5zdGVhZC5cbiAgI1xuICAjICMjIEV4YW1wbGVzXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBlZGl0b3IuY2xpcEJ1ZmZlclBvc2l0aW9uKFstMSwgLTFdKSAjIC0+IGBbMCwgMF1gXG4gICNcbiAgIyAjIFdoZW4gdGhlIGxpbmUgYXQgYnVmZmVyIHJvdyAyIGlzIDEwIGNoYXJhY3RlcnMgbG9uZ1xuICAjIGVkaXRvci5jbGlwQnVmZmVyUG9zaXRpb24oWzIsIEluZmluaXR5XSkgIyAtPiBgWzIsIDEwXWBcbiAgIyBgYGBcbiAgI1xuICAjICogYGJ1ZmZlclBvc2l0aW9uYCBUaGUge1BvaW50fSByZXByZXNlbnRpbmcgdGhlIHBvc2l0aW9uIHRvIGNsaXAuXG4gICNcbiAgIyBSZXR1cm5zIGEge1BvaW50fS5cbiAgY2xpcEJ1ZmZlclBvc2l0aW9uOiAoYnVmZmVyUG9zaXRpb24pIC0+IEBidWZmZXIuY2xpcFBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKVxuXG4gICMgRXh0ZW5kZWQ6IENsaXAgdGhlIHN0YXJ0IGFuZCBlbmQgb2YgdGhlIGdpdmVuIHJhbmdlIHRvIHZhbGlkIHBvc2l0aW9ucyBpbiB0aGVcbiAgIyBidWZmZXIuIFNlZSB7OjpjbGlwQnVmZmVyUG9zaXRpb259IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAjXG4gICMgKiBgcmFuZ2VgIFRoZSB7UmFuZ2V9IHRvIGNsaXAuXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfS5cbiAgY2xpcEJ1ZmZlclJhbmdlOiAocmFuZ2UpIC0+IEBidWZmZXIuY2xpcFJhbmdlKHJhbmdlKVxuXG4gICMgRXh0ZW5kZWQ6IENsaXAgdGhlIGdpdmVuIHtQb2ludH0gdG8gYSB2YWxpZCBwb3NpdGlvbiBvbiBzY3JlZW4uXG4gICNcbiAgIyBJZiB0aGUgZ2l2ZW4ge1BvaW50fSBkZXNjcmliZXMgYSBwb3NpdGlvbiB0aGF0IGlzIGFjdHVhbGx5IHJlYWNoYWJsZSBieSB0aGVcbiAgIyBjdXJzb3IgYmFzZWQgb24gdGhlIGN1cnJlbnQgY29udGVudHMgb2YgdGhlIHNjcmVlbiwgaXQgaXMgcmV0dXJuZWRcbiAgIyB1bmNoYW5nZWQuIElmIHRoZSB7UG9pbnR9IGRvZXMgbm90IGRlc2NyaWJlIGEgdmFsaWQgcG9zaXRpb24sIHRoZSBjbG9zZXN0XG4gICMgdmFsaWQgcG9zaXRpb24gaXMgcmV0dXJuZWQgaW5zdGVhZC5cbiAgI1xuICAjICMjIEV4YW1wbGVzXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBlZGl0b3IuY2xpcFNjcmVlblBvc2l0aW9uKFstMSwgLTFdKSAjIC0+IGBbMCwgMF1gXG4gICNcbiAgIyAjIFdoZW4gdGhlIGxpbmUgYXQgc2NyZWVuIHJvdyAyIGlzIDEwIGNoYXJhY3RlcnMgbG9uZ1xuICAjIGVkaXRvci5jbGlwU2NyZWVuUG9zaXRpb24oWzIsIEluZmluaXR5XSkgIyAtPiBgWzIsIDEwXWBcbiAgIyBgYGBcbiAgI1xuICAjICogYHNjcmVlblBvc2l0aW9uYCBUaGUge1BvaW50fSByZXByZXNlbnRpbmcgdGhlIHBvc2l0aW9uIHRvIGNsaXAuXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fVxuICAjICAgKiBgY2xpcERpcmVjdGlvbmAge1N0cmluZ30gSWYgYCdiYWNrd2FyZCdgLCByZXR1cm5zIHRoZSBmaXJzdCB2YWxpZFxuICAjICAgICBwb3NpdGlvbiBwcmVjZWRpbmcgYW4gaW52YWxpZCBwb3NpdGlvbi4gSWYgYCdmb3J3YXJkJ2AsIHJldHVybnMgdGhlXG4gICMgICAgIGZpcnN0IHZhbGlkIHBvc2l0aW9uIGZvbGxvd2luZyBhbiBpbnZhbGlkIHBvc2l0aW9uLiBJZiBgJ2Nsb3Nlc3QnYCxcbiAgIyAgICAgcmV0dXJucyB0aGUgZmlyc3QgdmFsaWQgcG9zaXRpb24gY2xvc2VzdCB0byBhbiBpbnZhbGlkIHBvc2l0aW9uLlxuICAjICAgICBEZWZhdWx0cyB0byBgJ2Nsb3Nlc3QnYC5cbiAgI1xuICAjIFJldHVybnMgYSB7UG9pbnR9LlxuICBjbGlwU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBpZiBvcHRpb25zPy5jbGlwP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYGNsaXBgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb25gIGluc3RlYWQuXCIpXG4gICAgICBvcHRpb25zLmNsaXBEaXJlY3Rpb24gPz0gb3B0aW9ucy5jbGlwXG4gICAgaWYgb3B0aW9ucz8ud3JhcEF0U29mdE5ld2xpbmVzP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYHdyYXBBdFNvZnROZXdsaW5lc2AgcGFyYW1ldGVyIGhhcyBiZWVuIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBzb29uLiBQbGVhc2UsIHVzZSBgY2xpcERpcmVjdGlvbjogJ2ZvcndhcmQnYCBpbnN0ZWFkLlwiKVxuICAgICAgb3B0aW9ucy5jbGlwRGlyZWN0aW9uID89IGlmIG9wdGlvbnMud3JhcEF0U29mdE5ld2xpbmVzIHRoZW4gJ2ZvcndhcmQnIGVsc2UgJ2JhY2t3YXJkJ1xuICAgIGlmIG9wdGlvbnM/LndyYXBCZXlvbmROZXdsaW5lcz9cbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhlIGB3cmFwQmV5b25kTmV3bGluZXNgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb246ICdmb3J3YXJkJ2AgaW5zdGVhZC5cIilcbiAgICAgIG9wdGlvbnMuY2xpcERpcmVjdGlvbiA/PSBpZiBvcHRpb25zLndyYXBCZXlvbmROZXdsaW5lcyB0aGVuICdmb3J3YXJkJyBlbHNlICdiYWNrd2FyZCdcblxuICAgIEBkaXNwbGF5TGF5ZXIuY2xpcFNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uLCBvcHRpb25zKVxuXG4gICMgRXh0ZW5kZWQ6IENsaXAgdGhlIHN0YXJ0IGFuZCBlbmQgb2YgdGhlIGdpdmVuIHJhbmdlIHRvIHZhbGlkIHBvc2l0aW9ucyBvbiBzY3JlZW4uXG4gICMgU2VlIHs6OmNsaXBTY3JlZW5Qb3NpdGlvbn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICNcbiAgIyAqIGByYW5nZWAgVGhlIHtSYW5nZX0gdG8gY2xpcC5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIFNlZSB7OjpjbGlwU2NyZWVuUG9zaXRpb259IGBvcHRpb25zYC5cbiAgI1xuICAjIFJldHVybnMgYSB7UmFuZ2V9LlxuICBjbGlwU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSwgb3B0aW9ucykgLT5cbiAgICBzY3JlZW5SYW5nZSA9IFJhbmdlLmZyb21PYmplY3Qoc2NyZWVuUmFuZ2UpXG4gICAgc3RhcnQgPSBAZGlzcGxheUxheWVyLmNsaXBTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5zdGFydCwgb3B0aW9ucylcbiAgICBlbmQgPSBAZGlzcGxheUxheWVyLmNsaXBTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5lbmQsIG9wdGlvbnMpXG4gICAgUmFuZ2Uoc3RhcnQsIGVuZClcblxuICAjIyNcbiAgU2VjdGlvbjogRGVjb3JhdGlvbnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEFkZCBhIGRlY29yYXRpb24gdGhhdCB0cmFja3MgYSB7RGlzcGxheU1hcmtlcn0uIFdoZW4gdGhlXG4gICMgbWFya2VyIG1vdmVzLCBpcyBpbnZhbGlkYXRlZCwgb3IgaXMgZGVzdHJveWVkLCB0aGUgZGVjb3JhdGlvbiB3aWxsIGJlXG4gICMgdXBkYXRlZCB0byByZWZsZWN0IHRoZSBtYXJrZXIncyBzdGF0ZS5cbiAgI1xuICAjIFRoZSBmb2xsb3dpbmcgYXJlIHRoZSBzdXBwb3J0ZWQgZGVjb3JhdGlvbnMgdHlwZXM6XG4gICNcbiAgIyAqIF9fbGluZV9fOiBBZGRzIHlvdXIgQ1NTIGBjbGFzc2AgdG8gdGhlIGxpbmUgbm9kZXMgd2l0aGluIHRoZSByYW5nZVxuICAjICAgICBtYXJrZWQgYnkgdGhlIG1hcmtlclxuICAjICogX19saW5lLW51bWJlcl9fOiBBZGRzIHlvdXIgQ1NTIGBjbGFzc2AgdG8gdGhlIGxpbmUgbnVtYmVyIG5vZGVzIHdpdGhpbiB0aGVcbiAgIyAgICAgcmFuZ2UgbWFya2VkIGJ5IHRoZSBtYXJrZXJcbiAgIyAqIF9faGlnaGxpZ2h0X186IEFkZHMgYSBuZXcgaGlnaGxpZ2h0IGRpdiB0byB0aGUgZWRpdG9yIHN1cnJvdW5kaW5nIHRoZVxuICAjICAgICByYW5nZSBtYXJrZWQgYnkgdGhlIG1hcmtlci4gV2hlbiB0aGUgdXNlciBzZWxlY3RzIHRleHQsIHRoZSBzZWxlY3Rpb24gaXNcbiAgIyAgICAgdmlzdWFsaXplZCB3aXRoIGEgaGlnaGxpZ2h0IGRlY29yYXRpb24gaW50ZXJuYWxseS4gVGhlIHN0cnVjdHVyZSBvZiB0aGlzXG4gICMgICAgIGhpZ2hsaWdodCB3aWxsIGJlXG4gICMgICAgIGBgYGh0bWxcbiAgIyAgICAgPGRpdiBjbGFzcz1cImhpZ2hsaWdodCA8eW91ci1jbGFzcz5cIj5cbiAgIyAgICAgICA8IS0tIFdpbGwgYmUgb25lIHJlZ2lvbiBmb3IgZWFjaCByb3cgaW4gdGhlIHJhbmdlLiBTcGFucyAyIGxpbmVzPyBUaGVyZSB3aWxsIGJlIDIgcmVnaW9ucy4gLS0+XG4gICMgICAgICAgPGRpdiBjbGFzcz1cInJlZ2lvblwiPjwvZGl2PlxuICAjICAgICA8L2Rpdj5cbiAgIyAgICAgYGBgXG4gICMgKiBfX292ZXJsYXlfXzogUG9zaXRpb25zIHRoZSB2aWV3IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gaXRlbSBhdCB0aGUgaGVhZFxuICAjICAgICBvciB0YWlsIG9mIHRoZSBnaXZlbiBgRGlzcGxheU1hcmtlcmAuXG4gICMgKiBfX2d1dHRlcl9fOiBBIGRlY29yYXRpb24gdGhhdCB0cmFja3MgYSB7RGlzcGxheU1hcmtlcn0gaW4gYSB7R3V0dGVyfS4gR3V0dGVyXG4gICMgICAgIGRlY29yYXRpb25zIGFyZSBjcmVhdGVkIGJ5IGNhbGxpbmcge0d1dHRlcjo6ZGVjb3JhdGVNYXJrZXJ9IG9uIHRoZVxuICAjICAgICBkZXNpcmVkIGBHdXR0ZXJgIGluc3RhbmNlLlxuICAjICogX19ibG9ja19fOiBQb3NpdGlvbnMgdGhlIHZpZXcgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBpdGVtIGJlZm9yZSBvclxuICAjICAgICBhZnRlciB0aGUgcm93IG9mIHRoZSBnaXZlbiBgVGV4dEVkaXRvck1hcmtlcmAuXG4gICNcbiAgIyAjIyBBcmd1bWVudHNcbiAgI1xuICAjICogYG1hcmtlcmAgQSB7RGlzcGxheU1hcmtlcn0geW91IHdhbnQgdGhpcyBkZWNvcmF0aW9uIHRvIGZvbGxvdy5cbiAgIyAqIGBkZWNvcmF0aW9uUGFyYW1zYCBBbiB7T2JqZWN0fSByZXByZXNlbnRpbmcgdGhlIGRlY29yYXRpb24gZS5nLlxuICAjICAgYHt0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ2xpbnRlci1lcnJvcid9YFxuICAjICAgKiBgdHlwZWAgVGhlcmUgYXJlIHNldmVyYWwgc3VwcG9ydGVkIGRlY29yYXRpb24gdHlwZXMuIFRoZSBiZWhhdmlvciBvZiB0aGVcbiAgIyAgICAgdHlwZXMgYXJlIGFzIGZvbGxvd3M6XG4gICMgICAgICogYGxpbmVgIEFkZHMgdGhlIGdpdmVuIGBjbGFzc2AgdG8gdGhlIGxpbmVzIG92ZXJsYXBwaW5nIHRoZSByb3dzXG4gICMgICAgICAgIHNwYW5uZWQgYnkgdGhlIGBEaXNwbGF5TWFya2VyYC5cbiAgIyAgICAgKiBgbGluZS1udW1iZXJgIEFkZHMgdGhlIGdpdmVuIGBjbGFzc2AgdG8gdGhlIGxpbmUgbnVtYmVycyBvdmVybGFwcGluZ1xuICAjICAgICAgIHRoZSByb3dzIHNwYW5uZWQgYnkgdGhlIGBEaXNwbGF5TWFya2VyYC5cbiAgIyAgICAgKiBgaGlnaGxpZ2h0YCBDcmVhdGVzIGEgYC5oaWdobGlnaHRgIGRpdiB3aXRoIHRoZSBuZXN0ZWQgY2xhc3Mgd2l0aCB1cFxuICAjICAgICAgIHRvIDMgbmVzdGVkIHJlZ2lvbnMgdGhhdCBmaWxsIHRoZSBhcmVhIHNwYW5uZWQgYnkgdGhlIGBEaXNwbGF5TWFya2VyYC5cbiAgIyAgICAgKiBgb3ZlcmxheWAgUG9zaXRpb25zIHRoZSB2aWV3IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gaXRlbSBhdCB0aGVcbiAgIyAgICAgICBoZWFkIG9yIHRhaWwgb2YgdGhlIGdpdmVuIGBEaXNwbGF5TWFya2VyYCwgZGVwZW5kaW5nIG9uIHRoZSBgcG9zaXRpb25gXG4gICMgICAgICAgcHJvcGVydHkuXG4gICMgICAgICogYGd1dHRlcmAgVHJhY2tzIGEge0Rpc3BsYXlNYXJrZXJ9IGluIGEge0d1dHRlcn0uIENyZWF0ZWQgYnkgY2FsbGluZ1xuICAjICAgICAgIHtHdXR0ZXI6OmRlY29yYXRlTWFya2VyfSBvbiB0aGUgZGVzaXJlZCBgR3V0dGVyYCBpbnN0YW5jZS5cbiAgIyAgICAgKiBgYmxvY2tgIFBvc2l0aW9ucyB0aGUgdmlldyBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuIGl0ZW0gYmVmb3JlIG9yXG4gICMgICAgICAgYWZ0ZXIgdGhlIHJvdyBvZiB0aGUgZ2l2ZW4gYFRleHRFZGl0b3JNYXJrZXJgLCBkZXBlbmRpbmcgb24gdGhlIGBwb3NpdGlvbmBcbiAgIyAgICAgICBwcm9wZXJ0eS5cbiAgIyAgICogYGNsYXNzYCBUaGlzIENTUyBjbGFzcyB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGRlY29yYXRlZCBsaW5lIG51bWJlcixcbiAgIyAgICAgbGluZSwgaGlnaGxpZ2h0LCBvciBvdmVybGF5LlxuICAjICAgKiBgaXRlbWAgKG9wdGlvbmFsKSBBbiB7SFRNTEVsZW1lbnR9IG9yIGEgbW9kZWwge09iamVjdH0gd2l0aCBhXG4gICMgICAgIGNvcnJlc3BvbmRpbmcgdmlldyByZWdpc3RlcmVkLiBPbmx5IGFwcGxpY2FibGUgdG8gdGhlIGBndXR0ZXJgLFxuICAjICAgICBgb3ZlcmxheWAgYW5kIGBibG9ja2AgdHlwZXMuXG4gICMgICAqIGBvbmx5SGVhZGAgKG9wdGlvbmFsKSBJZiBgdHJ1ZWAsIHRoZSBkZWNvcmF0aW9uIHdpbGwgb25seSBiZSBhcHBsaWVkIHRvXG4gICMgICAgIHRoZSBoZWFkIG9mIHRoZSBgRGlzcGxheU1hcmtlcmAuIE9ubHkgYXBwbGljYWJsZSB0byB0aGUgYGxpbmVgIGFuZFxuICAjICAgICBgbGluZS1udW1iZXJgIHR5cGVzLlxuICAjICAgKiBgb25seUVtcHR5YCAob3B0aW9uYWwpIElmIGB0cnVlYCwgdGhlIGRlY29yYXRpb24gd2lsbCBvbmx5IGJlIGFwcGxpZWQgaWZcbiAgIyAgICAgdGhlIGFzc29jaWF0ZWQgYERpc3BsYXlNYXJrZXJgIGlzIGVtcHR5LiBPbmx5IGFwcGxpY2FibGUgdG8gdGhlIGBndXR0ZXJgLFxuICAjICAgICBgbGluZWAsIGFuZCBgbGluZS1udW1iZXJgIHR5cGVzLlxuICAjICAgKiBgb25seU5vbkVtcHR5YCAob3B0aW9uYWwpIElmIGB0cnVlYCwgdGhlIGRlY29yYXRpb24gd2lsbCBvbmx5IGJlIGFwcGxpZWRcbiAgIyAgICAgaWYgdGhlIGFzc29jaWF0ZWQgYERpc3BsYXlNYXJrZXJgIGlzIG5vbi1lbXB0eS4gT25seSBhcHBsaWNhYmxlIHRvIHRoZVxuICAjICAgICBgZ3V0dGVyYCwgYGxpbmVgLCBhbmQgYGxpbmUtbnVtYmVyYCB0eXBlcy5cbiAgIyAgICogYHBvc2l0aW9uYCAob3B0aW9uYWwpIE9ubHkgYXBwbGljYWJsZSB0byBkZWNvcmF0aW9ucyBvZiB0eXBlIGBvdmVybGF5YCBhbmQgYGJsb2NrYCxcbiAgIyAgICAgY29udHJvbHMgd2hlcmUgdGhlIHZpZXcgaXMgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB0aGUgYFRleHRFZGl0b3JNYXJrZXJgLlxuICAjICAgICBWYWx1ZXMgY2FuIGJlIGAnaGVhZCdgICh0aGUgZGVmYXVsdCkgb3IgYCd0YWlsJ2AgZm9yIG92ZXJsYXkgZGVjb3JhdGlvbnMsIGFuZFxuICAjICAgICBgJ2JlZm9yZSdgICh0aGUgZGVmYXVsdCkgb3IgYCdhZnRlcidgIGZvciBibG9jayBkZWNvcmF0aW9ucy5cbiAgI1xuICAjIFJldHVybnMgYSB7RGVjb3JhdGlvbn0gb2JqZWN0XG4gIGRlY29yYXRlTWFya2VyOiAobWFya2VyLCBkZWNvcmF0aW9uUGFyYW1zKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIGRlY29yYXRpb25QYXJhbXMpXG5cbiAgIyBFc3NlbnRpYWw6IEFkZCBhIGRlY29yYXRpb24gdG8gZXZlcnkgbWFya2VyIGluIHRoZSBnaXZlbiBtYXJrZXIgbGF5ZXIuIENhblxuICAjIGJlIHVzZWQgdG8gZGVjb3JhdGUgYSBsYXJnZSBudW1iZXIgb2YgbWFya2VycyB3aXRob3V0IGhhdmluZyB0byBjcmVhdGUgYW5kXG4gICMgbWFuYWdlIG1hbnkgaW5kaXZpZHVhbCBkZWNvcmF0aW9ucy5cbiAgI1xuICAjICogYG1hcmtlckxheWVyYCBBIHtEaXNwbGF5TWFya2VyTGF5ZXJ9IG9yIHtNYXJrZXJMYXllcn0gdG8gZGVjb3JhdGUuXG4gICMgKiBgZGVjb3JhdGlvblBhcmFtc2AgVGhlIHNhbWUgcGFyYW1ldGVycyB0aGF0IGFyZSBwYXNzZWQgdG9cbiAgIyAgIHtUZXh0RWRpdG9yOjpkZWNvcmF0ZU1hcmtlcn0sIGV4Y2VwdCB0aGUgYHR5cGVgIGNhbm5vdCBiZSBgb3ZlcmxheWAgb3IgYGd1dHRlcmAuXG4gICNcbiAgIyBSZXR1cm5zIGEge0xheWVyRGVjb3JhdGlvbn0uXG4gIGRlY29yYXRlTWFya2VyTGF5ZXI6IChtYXJrZXJMYXllciwgZGVjb3JhdGlvblBhcmFtcykgLT5cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuZGVjb3JhdGVNYXJrZXJMYXllcihtYXJrZXJMYXllciwgZGVjb3JhdGlvblBhcmFtcylcblxuICAjIERlcHJlY2F0ZWQ6IEdldCBhbGwgdGhlIGRlY29yYXRpb25zIHdpdGhpbiBhIHNjcmVlbiByb3cgcmFuZ2Ugb24gdGhlIGRlZmF1bHRcbiAgIyBsYXllci5cbiAgI1xuICAjICogYHN0YXJ0U2NyZWVuUm93YCB0aGUge051bWJlcn0gYmVnaW5uaW5nIHNjcmVlbiByb3dcbiAgIyAqIGBlbmRTY3JlZW5Sb3dgIHRoZSB7TnVtYmVyfSBlbmQgc2NyZWVuIHJvdyAoaW5jbHVzaXZlKVxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSBvZiBkZWNvcmF0aW9ucyBpbiB0aGUgZm9ybVxuICAjICBgezE6IFt7aWQ6IDEwLCB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ3NvbWVjbGFzcyd9XSwgMjogLi4ufWBcbiAgIyAgIHdoZXJlIHRoZSBrZXlzIGFyZSB7RGlzcGxheU1hcmtlcn0gSURzLCBhbmQgdGhlIHZhbHVlcyBhcmUgYW4gYXJyYXkgb2YgZGVjb3JhdGlvblxuICAjICAgcGFyYW1zIG9iamVjdHMgYXR0YWNoZWQgdG8gdGhlIG1hcmtlci5cbiAgIyBSZXR1cm5zIGFuIGVtcHR5IG9iamVjdCB3aGVuIG5vIGRlY29yYXRpb25zIGFyZSBmb3VuZFxuICBkZWNvcmF0aW9uc0ZvclNjcmVlblJvd1JhbmdlOiAoc3RhcnRTY3JlZW5Sb3csIGVuZFNjcmVlblJvdykgLT5cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuZGVjb3JhdGlvbnNGb3JTY3JlZW5Sb3dSYW5nZShzdGFydFNjcmVlblJvdywgZW5kU2NyZWVuUm93KVxuXG4gIGRlY29yYXRpb25zU3RhdGVGb3JTY3JlZW5Sb3dSYW5nZTogKHN0YXJ0U2NyZWVuUm93LCBlbmRTY3JlZW5Sb3cpIC0+XG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLmRlY29yYXRpb25zU3RhdGVGb3JTY3JlZW5Sb3dSYW5nZShzdGFydFNjcmVlblJvdywgZW5kU2NyZWVuUm93KVxuXG4gICMgRXh0ZW5kZWQ6IEdldCBhbGwgZGVjb3JhdGlvbnMuXG4gICNcbiAgIyAqIGBwcm9wZXJ0eUZpbHRlcmAgKG9wdGlvbmFsKSBBbiB7T2JqZWN0fSBjb250YWluaW5nIGtleSB2YWx1ZSBwYWlycyB0aGF0XG4gICMgICB0aGUgcmV0dXJuZWQgZGVjb3JhdGlvbnMnIHByb3BlcnRpZXMgbXVzdCBtYXRjaC5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB7RGVjb3JhdGlvbn1zLlxuICBnZXREZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5nZXREZWNvcmF0aW9ucyhwcm9wZXJ0eUZpbHRlcilcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIGRlY29yYXRpb25zIG9mIHR5cGUgJ2xpbmUnLlxuICAjXG4gICMgKiBgcHJvcGVydHlGaWx0ZXJgIChvcHRpb25hbCkgQW4ge09iamVjdH0gY29udGFpbmluZyBrZXkgdmFsdWUgcGFpcnMgdGhhdFxuICAjICAgdGhlIHJldHVybmVkIGRlY29yYXRpb25zJyBwcm9wZXJ0aWVzIG11c3QgbWF0Y2guXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge0RlY29yYXRpb259cy5cbiAgZ2V0TGluZURlY29yYXRpb25zOiAocHJvcGVydHlGaWx0ZXIpIC0+XG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLmdldExpbmVEZWNvcmF0aW9ucyhwcm9wZXJ0eUZpbHRlcilcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIGRlY29yYXRpb25zIG9mIHR5cGUgJ2xpbmUtbnVtYmVyJy5cbiAgI1xuICAjICogYHByb3BlcnR5RmlsdGVyYCAob3B0aW9uYWwpIEFuIHtPYmplY3R9IGNvbnRhaW5pbmcga2V5IHZhbHVlIHBhaXJzIHRoYXRcbiAgIyAgIHRoZSByZXR1cm5lZCBkZWNvcmF0aW9ucycgcHJvcGVydGllcyBtdXN0IG1hdGNoLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtEZWNvcmF0aW9ufXMuXG4gIGdldExpbmVOdW1iZXJEZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5nZXRMaW5lTnVtYmVyRGVjb3JhdGlvbnMocHJvcGVydHlGaWx0ZXIpXG5cbiAgIyBFeHRlbmRlZDogR2V0IGFsbCBkZWNvcmF0aW9ucyBvZiB0eXBlICdoaWdobGlnaHQnLlxuICAjXG4gICMgKiBgcHJvcGVydHlGaWx0ZXJgIChvcHRpb25hbCkgQW4ge09iamVjdH0gY29udGFpbmluZyBrZXkgdmFsdWUgcGFpcnMgdGhhdFxuICAjICAgdGhlIHJldHVybmVkIGRlY29yYXRpb25zJyBwcm9wZXJ0aWVzIG11c3QgbWF0Y2guXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge0RlY29yYXRpb259cy5cbiAgZ2V0SGlnaGxpZ2h0RGVjb3JhdGlvbnM6IChwcm9wZXJ0eUZpbHRlcikgLT5cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuZ2V0SGlnaGxpZ2h0RGVjb3JhdGlvbnMocHJvcGVydHlGaWx0ZXIpXG5cbiAgIyBFeHRlbmRlZDogR2V0IGFsbCBkZWNvcmF0aW9ucyBvZiB0eXBlICdvdmVybGF5Jy5cbiAgI1xuICAjICogYHByb3BlcnR5RmlsdGVyYCAob3B0aW9uYWwpIEFuIHtPYmplY3R9IGNvbnRhaW5pbmcga2V5IHZhbHVlIHBhaXJzIHRoYXRcbiAgIyAgIHRoZSByZXR1cm5lZCBkZWNvcmF0aW9ucycgcHJvcGVydGllcyBtdXN0IG1hdGNoLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtEZWNvcmF0aW9ufXMuXG4gIGdldE92ZXJsYXlEZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5nZXRPdmVybGF5RGVjb3JhdGlvbnMocHJvcGVydHlGaWx0ZXIpXG5cbiAgZGVjb3JhdGlvbkZvcklkOiAoaWQpIC0+XG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLmRlY29yYXRpb25Gb3JJZChpZClcblxuICBkZWNvcmF0aW9uc0Zvck1hcmtlcklkOiAoaWQpIC0+XG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLmRlY29yYXRpb25zRm9yTWFya2VySWQoaWQpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1hcmtlcnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IENyZWF0ZSBhIG1hcmtlciBvbiB0aGUgZGVmYXVsdCBtYXJrZXIgbGF5ZXIgd2l0aCB0aGUgZ2l2ZW4gcmFuZ2VcbiAgIyBpbiBidWZmZXIgY29vcmRpbmF0ZXMuIFRoaXMgbWFya2VyIHdpbGwgbWFpbnRhaW4gaXRzIGxvZ2ljYWwgbG9jYXRpb24gYXMgdGhlXG4gICMgYnVmZmVyIGlzIGNoYW5nZWQsIHNvIGlmIHlvdSBtYXJrIGEgcGFydGljdWxhciB3b3JkLCB0aGUgbWFya2VyIHdpbGwgcmVtYWluXG4gICMgb3ZlciB0aGF0IHdvcmQgZXZlbiBpZiB0aGUgd29yZCdzIGxvY2F0aW9uIGluIHRoZSBidWZmZXIgY2hhbmdlcy5cbiAgI1xuICAjICogYHJhbmdlYCBBIHtSYW5nZX0gb3IgcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9XG4gICMgKiBgcHJvcGVydGllc2AgQSBoYXNoIG9mIGtleS12YWx1ZSBwYWlycyB0byBhc3NvY2lhdGUgd2l0aCB0aGUgbWFya2VyLiBUaGVyZVxuICAjICAgYXJlIGFsc28gcmVzZXJ2ZWQgcHJvcGVydHkgbmFtZXMgdGhhdCBoYXZlIG1hcmtlci1zcGVjaWZpYyBtZWFuaW5nLlxuICAjICAgKiBgbWFpbnRhaW5IaXN0b3J5YCAob3B0aW9uYWwpIHtCb29sZWFufSBXaGV0aGVyIHRvIHN0b3JlIHRoaXMgbWFya2VyJ3NcbiAgIyAgICAgcmFuZ2UgYmVmb3JlIGFuZCBhZnRlciBlYWNoIGNoYW5nZSBpbiB0aGUgdW5kbyBoaXN0b3J5LiBUaGlzIGFsbG93cyB0aGVcbiAgIyAgICAgbWFya2VyJ3MgcG9zaXRpb24gdG8gYmUgcmVzdG9yZWQgbW9yZSBhY2N1cmF0ZWx5IGZvciBjZXJ0YWluIHVuZG8vcmVkb1xuICAjICAgICBvcGVyYXRpb25zLCBidXQgdXNlcyBtb3JlIHRpbWUgYW5kIG1lbW9yeS4gKGRlZmF1bHQ6IGZhbHNlKVxuICAjICAgKiBgcmV2ZXJzZWRgIChvcHRpb25hbCkge0Jvb2xlYW59IENyZWF0ZXMgdGhlIG1hcmtlciBpbiBhIHJldmVyc2VkXG4gICMgICAgIG9yaWVudGF0aW9uLiAoZGVmYXVsdDogZmFsc2UpXG4gICMgICAqIGBpbnZhbGlkYXRlYCAob3B0aW9uYWwpIHtTdHJpbmd9IERldGVybWluZXMgdGhlIHJ1bGVzIGJ5IHdoaWNoIGNoYW5nZXNcbiAgIyAgICAgdG8gdGhlIGJ1ZmZlciAqaW52YWxpZGF0ZSogdGhlIG1hcmtlci4gKGRlZmF1bHQ6ICdvdmVybGFwJykgSXQgY2FuIGJlXG4gICMgICAgIGFueSBvZiB0aGUgZm9sbG93aW5nIHN0cmF0ZWdpZXMsIGluIG9yZGVyIG9mIGZyYWdpbGl0eTpcbiAgIyAgICAgKiBfX25ldmVyX186IFRoZSBtYXJrZXIgaXMgbmV2ZXIgbWFya2VkIGFzIGludmFsaWQuIFRoaXMgaXMgYSBnb29kIGNob2ljZSBmb3JcbiAgIyAgICAgICBtYXJrZXJzIHJlcHJlc2VudGluZyBzZWxlY3Rpb25zIGluIGFuIGVkaXRvci5cbiAgIyAgICAgKiBfX3N1cnJvdW5kX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IGNvbXBsZXRlbHkgc3Vycm91bmQgaXQuXG4gICMgICAgICogX19vdmVybGFwX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IHN1cnJvdW5kIHRoZVxuICAjICAgICAgIHN0YXJ0IG9yIGVuZCBvZiB0aGUgbWFya2VyLiBUaGlzIGlzIHRoZSBkZWZhdWx0LlxuICAjICAgICAqIF9faW5zaWRlX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IGV4dGVuZCBpbnRvIHRoZVxuICAjICAgICAgIGluc2lkZSBvZiB0aGUgbWFya2VyLiBDaGFuZ2VzIHRoYXQgZW5kIGF0IHRoZSBtYXJrZXIncyBzdGFydCBvclxuICAjICAgICAgIHN0YXJ0IGF0IHRoZSBtYXJrZXIncyBlbmQgZG8gbm90IGludmFsaWRhdGUgdGhlIG1hcmtlci5cbiAgIyAgICAgKiBfX3RvdWNoX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgYSBjaGFuZ2UgdGhhdCB0b3VjaGVzIHRoZSBtYXJrZWRcbiAgIyAgICAgICByZWdpb24gaW4gYW55IHdheSwgaW5jbHVkaW5nIGNoYW5nZXMgdGhhdCBlbmQgYXQgdGhlIG1hcmtlcidzXG4gICMgICAgICAgc3RhcnQgb3Igc3RhcnQgYXQgdGhlIG1hcmtlcidzIGVuZC4gVGhpcyBpcyB0aGUgbW9zdCBmcmFnaWxlIHN0cmF0ZWd5LlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwbGF5TWFya2VyfS5cbiAgbWFya0J1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UsIG9wdGlvbnMpIC0+XG4gICAgQGRlZmF1bHRNYXJrZXJMYXllci5tYXJrQnVmZmVyUmFuZ2UoYnVmZmVyUmFuZ2UsIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IENyZWF0ZSBhIG1hcmtlciBvbiB0aGUgZGVmYXVsdCBtYXJrZXIgbGF5ZXIgd2l0aCB0aGUgZ2l2ZW4gcmFuZ2VcbiAgIyBpbiBzY3JlZW4gY29vcmRpbmF0ZXMuIFRoaXMgbWFya2VyIHdpbGwgbWFpbnRhaW4gaXRzIGxvZ2ljYWwgbG9jYXRpb24gYXMgdGhlXG4gICMgYnVmZmVyIGlzIGNoYW5nZWQsIHNvIGlmIHlvdSBtYXJrIGEgcGFydGljdWxhciB3b3JkLCB0aGUgbWFya2VyIHdpbGwgcmVtYWluXG4gICMgb3ZlciB0aGF0IHdvcmQgZXZlbiBpZiB0aGUgd29yZCdzIGxvY2F0aW9uIGluIHRoZSBidWZmZXIgY2hhbmdlcy5cbiAgI1xuICAjICogYHJhbmdlYCBBIHtSYW5nZX0gb3IgcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9XG4gICMgKiBgcHJvcGVydGllc2AgQSBoYXNoIG9mIGtleS12YWx1ZSBwYWlycyB0byBhc3NvY2lhdGUgd2l0aCB0aGUgbWFya2VyLiBUaGVyZVxuICAjICAgYXJlIGFsc28gcmVzZXJ2ZWQgcHJvcGVydHkgbmFtZXMgdGhhdCBoYXZlIG1hcmtlci1zcGVjaWZpYyBtZWFuaW5nLlxuICAjICAgKiBgbWFpbnRhaW5IaXN0b3J5YCAob3B0aW9uYWwpIHtCb29sZWFufSBXaGV0aGVyIHRvIHN0b3JlIHRoaXMgbWFya2VyJ3NcbiAgIyAgICAgcmFuZ2UgYmVmb3JlIGFuZCBhZnRlciBlYWNoIGNoYW5nZSBpbiB0aGUgdW5kbyBoaXN0b3J5LiBUaGlzIGFsbG93cyB0aGVcbiAgIyAgICAgbWFya2VyJ3MgcG9zaXRpb24gdG8gYmUgcmVzdG9yZWQgbW9yZSBhY2N1cmF0ZWx5IGZvciBjZXJ0YWluIHVuZG8vcmVkb1xuICAjICAgICBvcGVyYXRpb25zLCBidXQgdXNlcyBtb3JlIHRpbWUgYW5kIG1lbW9yeS4gKGRlZmF1bHQ6IGZhbHNlKVxuICAjICAgKiBgcmV2ZXJzZWRgIChvcHRpb25hbCkge0Jvb2xlYW59IENyZWF0ZXMgdGhlIG1hcmtlciBpbiBhIHJldmVyc2VkXG4gICMgICAgIG9yaWVudGF0aW9uLiAoZGVmYXVsdDogZmFsc2UpXG4gICMgICAqIGBpbnZhbGlkYXRlYCAob3B0aW9uYWwpIHtTdHJpbmd9IERldGVybWluZXMgdGhlIHJ1bGVzIGJ5IHdoaWNoIGNoYW5nZXNcbiAgIyAgICAgdG8gdGhlIGJ1ZmZlciAqaW52YWxpZGF0ZSogdGhlIG1hcmtlci4gKGRlZmF1bHQ6ICdvdmVybGFwJykgSXQgY2FuIGJlXG4gICMgICAgIGFueSBvZiB0aGUgZm9sbG93aW5nIHN0cmF0ZWdpZXMsIGluIG9yZGVyIG9mIGZyYWdpbGl0eTpcbiAgIyAgICAgKiBfX25ldmVyX186IFRoZSBtYXJrZXIgaXMgbmV2ZXIgbWFya2VkIGFzIGludmFsaWQuIFRoaXMgaXMgYSBnb29kIGNob2ljZSBmb3JcbiAgIyAgICAgICBtYXJrZXJzIHJlcHJlc2VudGluZyBzZWxlY3Rpb25zIGluIGFuIGVkaXRvci5cbiAgIyAgICAgKiBfX3N1cnJvdW5kX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IGNvbXBsZXRlbHkgc3Vycm91bmQgaXQuXG4gICMgICAgICogX19vdmVybGFwX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IHN1cnJvdW5kIHRoZVxuICAjICAgICAgIHN0YXJ0IG9yIGVuZCBvZiB0aGUgbWFya2VyLiBUaGlzIGlzIHRoZSBkZWZhdWx0LlxuICAjICAgICAqIF9faW5zaWRlX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgY2hhbmdlcyB0aGF0IGV4dGVuZCBpbnRvIHRoZVxuICAjICAgICAgIGluc2lkZSBvZiB0aGUgbWFya2VyLiBDaGFuZ2VzIHRoYXQgZW5kIGF0IHRoZSBtYXJrZXIncyBzdGFydCBvclxuICAjICAgICAgIHN0YXJ0IGF0IHRoZSBtYXJrZXIncyBlbmQgZG8gbm90IGludmFsaWRhdGUgdGhlIG1hcmtlci5cbiAgIyAgICAgKiBfX3RvdWNoX186IFRoZSBtYXJrZXIgaXMgaW52YWxpZGF0ZWQgYnkgYSBjaGFuZ2UgdGhhdCB0b3VjaGVzIHRoZSBtYXJrZWRcbiAgIyAgICAgICByZWdpb24gaW4gYW55IHdheSwgaW5jbHVkaW5nIGNoYW5nZXMgdGhhdCBlbmQgYXQgdGhlIG1hcmtlcidzXG4gICMgICAgICAgc3RhcnQgb3Igc3RhcnQgYXQgdGhlIG1hcmtlcidzIGVuZC4gVGhpcyBpcyB0aGUgbW9zdCBmcmFnaWxlIHN0cmF0ZWd5LlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwbGF5TWFya2VyfS5cbiAgbWFya1NjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpIC0+XG4gICAgQGRlZmF1bHRNYXJrZXJMYXllci5tYXJrU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IENyZWF0ZSBhIG1hcmtlciBvbiB0aGUgZGVmYXVsdCBtYXJrZXIgbGF5ZXIgd2l0aCB0aGUgZ2l2ZW4gYnVmZmVyXG4gICMgcG9zaXRpb24gYW5kIG5vIHRhaWwuIFRvIGdyb3VwIG11bHRpcGxlIG1hcmtlcnMgdG9nZXRoZXIgaW4gdGhlaXIgb3duXG4gICMgcHJpdmF0ZSBsYXllciwgc2VlIHs6OmFkZE1hcmtlckxheWVyfS5cbiAgI1xuICAjICogYGJ1ZmZlclBvc2l0aW9uYCBBIHtQb2ludH0gb3IgcG9pbnQtY29tcGF0aWJsZSB7QXJyYXl9XG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGludmFsaWRhdGVgIChvcHRpb25hbCkge1N0cmluZ30gRGV0ZXJtaW5lcyB0aGUgcnVsZXMgYnkgd2hpY2ggY2hhbmdlc1xuICAjICAgICB0byB0aGUgYnVmZmVyICppbnZhbGlkYXRlKiB0aGUgbWFya2VyLiAoZGVmYXVsdDogJ292ZXJsYXAnKSBJdCBjYW4gYmVcbiAgIyAgICAgYW55IG9mIHRoZSBmb2xsb3dpbmcgc3RyYXRlZ2llcywgaW4gb3JkZXIgb2YgZnJhZ2lsaXR5OlxuICAjICAgICAqIF9fbmV2ZXJfXzogVGhlIG1hcmtlciBpcyBuZXZlciBtYXJrZWQgYXMgaW52YWxpZC4gVGhpcyBpcyBhIGdvb2QgY2hvaWNlIGZvclxuICAjICAgICAgIG1hcmtlcnMgcmVwcmVzZW50aW5nIHNlbGVjdGlvbnMgaW4gYW4gZWRpdG9yLlxuICAjICAgICAqIF9fc3Vycm91bmRfXzogVGhlIG1hcmtlciBpcyBpbnZhbGlkYXRlZCBieSBjaGFuZ2VzIHRoYXQgY29tcGxldGVseSBzdXJyb3VuZCBpdC5cbiAgIyAgICAgKiBfX292ZXJsYXBfXzogVGhlIG1hcmtlciBpcyBpbnZhbGlkYXRlZCBieSBjaGFuZ2VzIHRoYXQgc3Vycm91bmQgdGhlXG4gICMgICAgICAgc3RhcnQgb3IgZW5kIG9mIHRoZSBtYXJrZXIuIFRoaXMgaXMgdGhlIGRlZmF1bHQuXG4gICMgICAgICogX19pbnNpZGVfXzogVGhlIG1hcmtlciBpcyBpbnZhbGlkYXRlZCBieSBjaGFuZ2VzIHRoYXQgZXh0ZW5kIGludG8gdGhlXG4gICMgICAgICAgaW5zaWRlIG9mIHRoZSBtYXJrZXIuIENoYW5nZXMgdGhhdCBlbmQgYXQgdGhlIG1hcmtlcidzIHN0YXJ0IG9yXG4gICMgICAgICAgc3RhcnQgYXQgdGhlIG1hcmtlcidzIGVuZCBkbyBub3QgaW52YWxpZGF0ZSB0aGUgbWFya2VyLlxuICAjICAgICAqIF9fdG91Y2hfXzogVGhlIG1hcmtlciBpcyBpbnZhbGlkYXRlZCBieSBhIGNoYW5nZSB0aGF0IHRvdWNoZXMgdGhlIG1hcmtlZFxuICAjICAgICAgIHJlZ2lvbiBpbiBhbnkgd2F5LCBpbmNsdWRpbmcgY2hhbmdlcyB0aGF0IGVuZCBhdCB0aGUgbWFya2VyJ3NcbiAgIyAgICAgICBzdGFydCBvciBzdGFydCBhdCB0aGUgbWFya2VyJ3MgZW5kLiBUaGlzIGlzIHRoZSBtb3N0IGZyYWdpbGUgc3RyYXRlZ3kuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3BsYXlNYXJrZXJ9LlxuICBtYXJrQnVmZmVyUG9zaXRpb246IChidWZmZXJQb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBAZGVmYXVsdE1hcmtlckxheWVyLm1hcmtCdWZmZXJQb3NpdGlvbihidWZmZXJQb3NpdGlvbiwgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogQ3JlYXRlIGEgbWFya2VyIG9uIHRoZSBkZWZhdWx0IG1hcmtlciBsYXllciB3aXRoIHRoZSBnaXZlbiBzY3JlZW5cbiAgIyBwb3NpdGlvbiBhbmQgbm8gdGFpbC4gVG8gZ3JvdXAgbXVsdGlwbGUgbWFya2VycyB0b2dldGhlciBpbiB0aGVpciBvd25cbiAgIyBwcml2YXRlIGxheWVyLCBzZWUgezo6YWRkTWFya2VyTGF5ZXJ9LlxuICAjXG4gICMgKiBgc2NyZWVuUG9zaXRpb25gIEEge1BvaW50fSBvciBwb2ludC1jb21wYXRpYmxlIHtBcnJheX1cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgaW52YWxpZGF0ZWAgKG9wdGlvbmFsKSB7U3RyaW5nfSBEZXRlcm1pbmVzIHRoZSBydWxlcyBieSB3aGljaCBjaGFuZ2VzXG4gICMgICAgIHRvIHRoZSBidWZmZXIgKmludmFsaWRhdGUqIHRoZSBtYXJrZXIuIChkZWZhdWx0OiAnb3ZlcmxhcCcpIEl0IGNhbiBiZVxuICAjICAgICBhbnkgb2YgdGhlIGZvbGxvd2luZyBzdHJhdGVnaWVzLCBpbiBvcmRlciBvZiBmcmFnaWxpdHk6XG4gICMgICAgICogX19uZXZlcl9fOiBUaGUgbWFya2VyIGlzIG5ldmVyIG1hcmtlZCBhcyBpbnZhbGlkLiBUaGlzIGlzIGEgZ29vZCBjaG9pY2UgZm9yXG4gICMgICAgICAgbWFya2VycyByZXByZXNlbnRpbmcgc2VsZWN0aW9ucyBpbiBhbiBlZGl0b3IuXG4gICMgICAgICogX19zdXJyb3VuZF9fOiBUaGUgbWFya2VyIGlzIGludmFsaWRhdGVkIGJ5IGNoYW5nZXMgdGhhdCBjb21wbGV0ZWx5IHN1cnJvdW5kIGl0LlxuICAjICAgICAqIF9fb3ZlcmxhcF9fOiBUaGUgbWFya2VyIGlzIGludmFsaWRhdGVkIGJ5IGNoYW5nZXMgdGhhdCBzdXJyb3VuZCB0aGVcbiAgIyAgICAgICBzdGFydCBvciBlbmQgb2YgdGhlIG1hcmtlci4gVGhpcyBpcyB0aGUgZGVmYXVsdC5cbiAgIyAgICAgKiBfX2luc2lkZV9fOiBUaGUgbWFya2VyIGlzIGludmFsaWRhdGVkIGJ5IGNoYW5nZXMgdGhhdCBleHRlbmQgaW50byB0aGVcbiAgIyAgICAgICBpbnNpZGUgb2YgdGhlIG1hcmtlci4gQ2hhbmdlcyB0aGF0IGVuZCBhdCB0aGUgbWFya2VyJ3Mgc3RhcnQgb3JcbiAgIyAgICAgICBzdGFydCBhdCB0aGUgbWFya2VyJ3MgZW5kIGRvIG5vdCBpbnZhbGlkYXRlIHRoZSBtYXJrZXIuXG4gICMgICAgICogX190b3VjaF9fOiBUaGUgbWFya2VyIGlzIGludmFsaWRhdGVkIGJ5IGEgY2hhbmdlIHRoYXQgdG91Y2hlcyB0aGUgbWFya2VkXG4gICMgICAgICAgcmVnaW9uIGluIGFueSB3YXksIGluY2x1ZGluZyBjaGFuZ2VzIHRoYXQgZW5kIGF0IHRoZSBtYXJrZXInc1xuICAjICAgICAgIHN0YXJ0IG9yIHN0YXJ0IGF0IHRoZSBtYXJrZXIncyBlbmQuIFRoaXMgaXMgdGhlIG1vc3QgZnJhZ2lsZSBzdHJhdGVneS5cbiAgIyAgICogYGNsaXBEaXJlY3Rpb25gIHtTdHJpbmd9IElmIGAnYmFja3dhcmQnYCwgcmV0dXJucyB0aGUgZmlyc3QgdmFsaWRcbiAgIyAgICAgcG9zaXRpb24gcHJlY2VkaW5nIGFuIGludmFsaWQgcG9zaXRpb24uIElmIGAnZm9yd2FyZCdgLCByZXR1cm5zIHRoZVxuICAjICAgICBmaXJzdCB2YWxpZCBwb3NpdGlvbiBmb2xsb3dpbmcgYW4gaW52YWxpZCBwb3NpdGlvbi4gSWYgYCdjbG9zZXN0J2AsXG4gICMgICAgIHJldHVybnMgdGhlIGZpcnN0IHZhbGlkIHBvc2l0aW9uIGNsb3Nlc3QgdG8gYW4gaW52YWxpZCBwb3NpdGlvbi5cbiAgIyAgICAgRGVmYXVsdHMgdG8gYCdjbG9zZXN0J2AuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3BsYXlNYXJrZXJ9LlxuICBtYXJrU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBAZGVmYXVsdE1hcmtlckxheWVyLm1hcmtTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbiwgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogRmluZCBhbGwge0Rpc3BsYXlNYXJrZXJ9cyBvbiB0aGUgZGVmYXVsdCBtYXJrZXIgbGF5ZXIgdGhhdFxuICAjIG1hdGNoIHRoZSBnaXZlbiBwcm9wZXJ0aWVzLlxuICAjXG4gICMgVGhpcyBtZXRob2QgZmluZHMgbWFya2VycyBiYXNlZCBvbiB0aGUgZ2l2ZW4gcHJvcGVydGllcy4gTWFya2VycyBjYW4gYmVcbiAgIyBhc3NvY2lhdGVkIHdpdGggY3VzdG9tIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIGNvbXBhcmVkIHdpdGggYmFzaWMgZXF1YWxpdHkuXG4gICMgSW4gYWRkaXRpb24sIHRoZXJlIGFyZSBzZXZlcmFsIHNwZWNpYWwgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgY29tcGFyZWRcbiAgIyB3aXRoIHRoZSByYW5nZSBvZiB0aGUgbWFya2VycyByYXRoZXIgdGhhbiB0aGVpciBwcm9wZXJ0aWVzLlxuICAjXG4gICMgKiBgcHJvcGVydGllc2AgQW4ge09iamVjdH0gY29udGFpbmluZyBwcm9wZXJ0aWVzIHRoYXQgZWFjaCByZXR1cm5lZCBtYXJrZXJcbiAgIyAgIG11c3Qgc2F0aXNmeS4gTWFya2VycyBjYW4gYmUgYXNzb2NpYXRlZCB3aXRoIGN1c3RvbSBwcm9wZXJ0aWVzLCB3aGljaCBhcmVcbiAgIyAgIGNvbXBhcmVkIHdpdGggYmFzaWMgZXF1YWxpdHkuIEluIGFkZGl0aW9uLCBzZXZlcmFsIHJlc2VydmVkIHByb3BlcnRpZXNcbiAgIyAgIGNhbiBiZSB1c2VkIHRvIGZpbHRlciBtYXJrZXJzIGJhc2VkIG9uIHRoZWlyIGN1cnJlbnQgcmFuZ2U6XG4gICMgICAqIGBzdGFydEJ1ZmZlclJvd2AgT25seSBpbmNsdWRlIG1hcmtlcnMgc3RhcnRpbmcgYXQgdGhpcyByb3cgaW4gYnVmZmVyXG4gICMgICAgICAgY29vcmRpbmF0ZXMuXG4gICMgICAqIGBlbmRCdWZmZXJSb3dgIE9ubHkgaW5jbHVkZSBtYXJrZXJzIGVuZGluZyBhdCB0aGlzIHJvdyBpbiBidWZmZXJcbiAgIyAgICAgICBjb29yZGluYXRlcy5cbiAgIyAgICogYGNvbnRhaW5zQnVmZmVyUmFuZ2VgIE9ubHkgaW5jbHVkZSBtYXJrZXJzIGNvbnRhaW5pbmcgdGhpcyB7UmFuZ2V9IG9yXG4gICMgICAgICAgaW4gcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9IGluIGJ1ZmZlciBjb29yZGluYXRlcy5cbiAgIyAgICogYGNvbnRhaW5zQnVmZmVyUG9zaXRpb25gIE9ubHkgaW5jbHVkZSBtYXJrZXJzIGNvbnRhaW5pbmcgdGhpcyB7UG9pbnR9XG4gICMgICAgICAgb3Ige0FycmF5fSBvZiBgW3JvdywgY29sdW1uXWAgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtEaXNwbGF5TWFya2VyfXNcbiAgZmluZE1hcmtlcnM6IChwYXJhbXMpIC0+XG4gICAgQGRlZmF1bHRNYXJrZXJMYXllci5maW5kTWFya2VycyhwYXJhbXMpXG5cbiAgIyBFeHRlbmRlZDogR2V0IHRoZSB7RGlzcGxheU1hcmtlcn0gb24gdGhlIGRlZmF1bHQgbGF5ZXIgZm9yIHRoZSBnaXZlblxuICAjIG1hcmtlciBpZC5cbiAgI1xuICAjICogYGlkYCB7TnVtYmVyfSBpZCBvZiB0aGUgbWFya2VyXG4gIGdldE1hcmtlcjogKGlkKSAtPlxuICAgIEBkZWZhdWx0TWFya2VyTGF5ZXIuZ2V0TWFya2VyKGlkKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCBhbGwge0Rpc3BsYXlNYXJrZXJ9cyBvbiB0aGUgZGVmYXVsdCBtYXJrZXIgbGF5ZXIuIENvbnNpZGVyXG4gICMgdXNpbmcgezo6ZmluZE1hcmtlcnN9XG4gIGdldE1hcmtlcnM6IC0+XG4gICAgQGRlZmF1bHRNYXJrZXJMYXllci5nZXRNYXJrZXJzKClcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIG51bWJlciBvZiBtYXJrZXJzIGluIHRoZSBkZWZhdWx0IG1hcmtlciBsYXllci5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgZ2V0TWFya2VyQ291bnQ6IC0+XG4gICAgQGRlZmF1bHRNYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpXG5cbiAgZGVzdHJveU1hcmtlcjogKGlkKSAtPlxuICAgIEBnZXRNYXJrZXIoaWQpPy5kZXN0cm95KClcblxuICAjIEVzc2VudGlhbDogQ3JlYXRlIGEgbWFya2VyIGxheWVyIHRvIGdyb3VwIHJlbGF0ZWQgbWFya2Vycy5cbiAgI1xuICAjICogYG9wdGlvbnNgIEFuIHtPYmplY3R9IGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbWFpbnRhaW5IaXN0b3J5YCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgbWFya2VyIHN0YXRlIHNob3VsZCBiZVxuICAjICAgICByZXN0b3JlZCBvbiB1bmRvL3JlZG8uIERlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICMgICAqIGBwZXJzaXN0ZW50YCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgb3Igbm90IHRoaXMgbWFya2VyIGxheWVyXG4gICMgICAgIHNob3VsZCBiZSBzZXJpYWxpemVkIGFuZCBkZXNlcmlhbGl6ZWQgYWxvbmcgd2l0aCB0aGUgcmVzdCBvZiB0aGVcbiAgIyAgICAgYnVmZmVyLiBEZWZhdWx0cyB0byBgZmFsc2VgLiBJZiBgdHJ1ZWAsIHRoZSBtYXJrZXIgbGF5ZXIncyBpZCB3aWxsIGJlXG4gICMgICAgIG1haW50YWluZWQgYWNyb3NzIHRoZSBzZXJpYWxpemF0aW9uIGJvdW5kYXJ5LCBhbGxvd2luZyB5b3UgdG8gcmV0cmlldmVcbiAgIyAgICAgaXQgdmlhIHs6OmdldE1hcmtlckxheWVyfS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcGxheU1hcmtlckxheWVyfS5cbiAgYWRkTWFya2VyTGF5ZXI6IChvcHRpb25zKSAtPlxuICAgIEBkaXNwbGF5TGF5ZXIuYWRkTWFya2VyTGF5ZXIob3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGEge0Rpc3BsYXlNYXJrZXJMYXllcn0gYnkgaWQuXG4gICNcbiAgIyAqIGBpZGAgVGhlIGlkIG9mIHRoZSBtYXJrZXIgbGF5ZXIgdG8gcmV0cmlldmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3BsYXlNYXJrZXJMYXllcn0gb3IgYHVuZGVmaW5lZGAgaWYgbm8gbGF5ZXIgZXhpc3RzIHdpdGggdGhlXG4gICMgZ2l2ZW4gaWQuXG4gIGdldE1hcmtlckxheWVyOiAoaWQpIC0+XG4gICAgQGRpc3BsYXlMYXllci5nZXRNYXJrZXJMYXllcihpZClcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBkZWZhdWx0IHtEaXNwbGF5TWFya2VyTGF5ZXJ9LlxuICAjXG4gICMgQWxsIG1hcmtlciBBUElzIG5vdCB0aWVkIHRvIGFuIGV4cGxpY2l0IGxheWVyIGludGVyYWN0IHdpdGggdGhpcyBkZWZhdWx0XG4gICMgbGF5ZXIuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3BsYXlNYXJrZXJMYXllcn0uXG4gIGdldERlZmF1bHRNYXJrZXJMYXllcjogLT5cbiAgICBAZGVmYXVsdE1hcmtlckxheWVyXG5cbiAgIyMjXG4gIFNlY3Rpb246IEN1cnNvcnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIG1vc3QgcmVjZW50bHkgYWRkZWQgY3Vyc29yIGluIGJ1ZmZlclxuICAjIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgUmV0dXJucyBhIHtQb2ludH1cbiAgZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgcG9zaXRpb24gb2YgYWxsIHRoZSBjdXJzb3IgcG9zaXRpb25zIGluIGJ1ZmZlciBjb29yZGluYXRlcy5cbiAgI1xuICAjIFJldHVybnMge0FycmF5fSBvZiB7UG9pbnR9cyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlIGFkZGVkXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uczogLT5cbiAgICBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSBmb3IgY3Vyc29yIGluIEBnZXRDdXJzb3JzKClcblxuICAjIEVzc2VudGlhbDogTW92ZSB0aGUgY3Vyc29yIHRvIHRoZSBnaXZlbiBwb3NpdGlvbiBpbiBidWZmZXIgY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgY3Vyc29ycywgdGhleSB3aWxsIGJlIGNvbnNvbGlkYXRlZCB0byBhIHNpbmdsZSBjdXJzb3IuXG4gICNcbiAgIyAqIGBwb3NpdGlvbmAgQSB7UG9pbnR9IG9yIHtBcnJheX0gb2YgYFtyb3csIGNvbHVtbl1gXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiB7T2JqZWN0fSBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGF1dG9zY3JvbGxgIERldGVybWluZXMgd2hldGhlciB0aGUgZWRpdG9yIHNjcm9sbHMgdG8gdGhlIG5ldyBjdXJzb3Inc1xuICAjICAgICBwb3NpdGlvbi4gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb246IChwb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBAbW92ZUN1cnNvcnMgKGN1cnNvcikgLT4gY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYSB7Q3Vyc29yfSBhdCBnaXZlbiBzY3JlZW4gY29vcmRpbmF0ZXMge1BvaW50fVxuICAjXG4gICMgKiBgcG9zaXRpb25gIEEge1BvaW50fSBvciB7QXJyYXl9IG9mIGBbcm93LCBjb2x1bW5dYFxuICAjXG4gICMgUmV0dXJucyB0aGUgZmlyc3QgbWF0Y2hlZCB7Q3Vyc29yfSBvciB1bmRlZmluZWRcbiAgZ2V0Q3Vyc29yQXRTY3JlZW5Qb3NpdGlvbjogKHBvc2l0aW9uKSAtPlxuICAgIGZvciBjdXJzb3IgaW4gQGN1cnNvcnNcbiAgICAgIHJldHVybiBjdXJzb3IgaWYgY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkuaXNFcXVhbChwb3NpdGlvbilcbiAgICB1bmRlZmluZWRcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgbW9zdCByZWNlbnRseSBhZGRlZCBjdXJzb3IgaW4gc2NyZWVuXG4gICMgY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBSZXR1cm5zIGEge1BvaW50fS5cbiAgZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb246IC0+XG4gICAgQGdldExhc3RDdXJzb3IoKS5nZXRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgcG9zaXRpb24gb2YgYWxsIHRoZSBjdXJzb3IgcG9zaXRpb25zIGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgI1xuICAjIFJldHVybnMge0FycmF5fSBvZiB7UG9pbnR9cyBpbiB0aGUgb3JkZXIgdGhlIGN1cnNvcnMgd2VyZSBhZGRlZFxuICBnZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbnM6IC0+XG4gICAgY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkgZm9yIGN1cnNvciBpbiBAZ2V0Q3Vyc29ycygpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgdGhlIGN1cnNvciB0byB0aGUgZ2l2ZW4gcG9zaXRpb24gaW4gc2NyZWVuIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgSWYgdGhlcmUgYXJlIG11bHRpcGxlIGN1cnNvcnMsIHRoZXkgd2lsbCBiZSBjb25zb2xpZGF0ZWQgdG8gYSBzaW5nbGUgY3Vyc29yLlxuICAjXG4gICMgKiBgcG9zaXRpb25gIEEge1BvaW50fSBvciB7QXJyYXl9IG9mIGBbcm93LCBjb2x1bW5dYFxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4ge09iamVjdH0gY29tYmluaW5nIG9wdGlvbnMgZm9yIHs6OmNsaXBTY3JlZW5Qb3NpdGlvbn0gd2l0aDpcbiAgIyAgICogYGF1dG9zY3JvbGxgIERldGVybWluZXMgd2hldGhlciB0aGUgZWRpdG9yIHNjcm9sbHMgdG8gdGhlIG5ldyBjdXJzb3Inc1xuICAjICAgICBwb3NpdGlvbi4gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgc2V0Q3Vyc29yU2NyZWVuUG9zaXRpb246IChwb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBpZiBvcHRpb25zPy5jbGlwP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYGNsaXBgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb25gIGluc3RlYWQuXCIpXG4gICAgICBvcHRpb25zLmNsaXBEaXJlY3Rpb24gPz0gb3B0aW9ucy5jbGlwXG4gICAgaWYgb3B0aW9ucz8ud3JhcEF0U29mdE5ld2xpbmVzP1xuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGUgYHdyYXBBdFNvZnROZXdsaW5lc2AgcGFyYW1ldGVyIGhhcyBiZWVuIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBzb29uLiBQbGVhc2UsIHVzZSBgY2xpcERpcmVjdGlvbjogJ2ZvcndhcmQnYCBpbnN0ZWFkLlwiKVxuICAgICAgb3B0aW9ucy5jbGlwRGlyZWN0aW9uID89IGlmIG9wdGlvbnMud3JhcEF0U29mdE5ld2xpbmVzIHRoZW4gJ2ZvcndhcmQnIGVsc2UgJ2JhY2t3YXJkJ1xuICAgIGlmIG9wdGlvbnM/LndyYXBCZXlvbmROZXdsaW5lcz9cbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhlIGB3cmFwQmV5b25kTmV3bGluZXNgIHBhcmFtZXRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgc29vbi4gUGxlYXNlLCB1c2UgYGNsaXBEaXJlY3Rpb246ICdmb3J3YXJkJ2AgaW5zdGVhZC5cIilcbiAgICAgIG9wdGlvbnMuY2xpcERpcmVjdGlvbiA/PSBpZiBvcHRpb25zLndyYXBCZXlvbmROZXdsaW5lcyB0aGVuICdmb3J3YXJkJyBlbHNlICdiYWNrd2FyZCdcblxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24ocG9zaXRpb24sIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IEFkZCBhIGN1cnNvciBhdCB0aGUgZ2l2ZW4gcG9zaXRpb24gaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgKiBgYnVmZmVyUG9zaXRpb25gIEEge1BvaW50fSBvciB7QXJyYXl9IG9mIGBbcm93LCBjb2x1bW5dYFxuICAjXG4gICMgUmV0dXJucyBhIHtDdXJzb3J9LlxuICBhZGRDdXJzb3JBdEJ1ZmZlclBvc2l0aW9uOiAoYnVmZmVyUG9zaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgQHNlbGVjdGlvbnNNYXJrZXJMYXllci5tYXJrQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24sIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSlcbiAgICBAZ2V0TGFzdFNlbGVjdGlvbigpLmN1cnNvci5hdXRvc2Nyb2xsKCkgdW5sZXNzIG9wdGlvbnM/LmF1dG9zY3JvbGwgaXMgZmFsc2VcbiAgICBAZ2V0TGFzdFNlbGVjdGlvbigpLmN1cnNvclxuXG4gICMgRXNzZW50aWFsOiBBZGQgYSBjdXJzb3IgYXQgdGhlIHBvc2l0aW9uIGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgI1xuICAjICogYHNjcmVlblBvc2l0aW9uYCBBIHtQb2ludH0gb3Ige0FycmF5fSBvZiBgW3JvdywgY29sdW1uXWBcbiAgI1xuICAjIFJldHVybnMgYSB7Q3Vyc29yfS5cbiAgYWRkQ3Vyc29yQXRTY3JlZW5Qb3NpdGlvbjogKHNjcmVlblBvc2l0aW9uLCBvcHRpb25zKSAtPlxuICAgIEBzZWxlY3Rpb25zTWFya2VyTGF5ZXIubWFya1NjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pXG4gICAgQGdldExhc3RTZWxlY3Rpb24oKS5jdXJzb3IuYXV0b3Njcm9sbCgpIHVubGVzcyBvcHRpb25zPy5hdXRvc2Nyb2xsIGlzIGZhbHNlXG4gICAgQGdldExhc3RTZWxlY3Rpb24oKS5jdXJzb3JcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbXVsdGlwbGUgY3Vyc29ycy5cbiAgaGFzTXVsdGlwbGVDdXJzb3JzOiAtPlxuICAgIEBnZXRDdXJzb3JzKCkubGVuZ3RoID4gMVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIGV2ZXJ5IGN1cnNvciB1cCBvbmUgcm93IGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgI1xuICAjICogYGxpbmVDb3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgbGluZXMgdG8gbW92ZVxuICBtb3ZlVXA6IChsaW5lQ291bnQpIC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVXAobGluZUNvdW50LCBtb3ZlVG9FbmRPZlNlbGVjdGlvbjogdHJ1ZSlcblxuICAjIEVzc2VudGlhbDogTW92ZSBldmVyeSBjdXJzb3IgZG93biBvbmUgcm93IGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgI1xuICAjICogYGxpbmVDb3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgbGluZXMgdG8gbW92ZVxuICBtb3ZlRG93bjogKGxpbmVDb3VudCkgLT5cbiAgICBAbW92ZUN1cnNvcnMgKGN1cnNvcikgLT4gY3Vyc29yLm1vdmVEb3duKGxpbmVDb3VudCwgbW92ZVRvRW5kT2ZTZWxlY3Rpb246IHRydWUpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgZXZlcnkgY3Vyc29yIGxlZnQgb25lIGNvbHVtbi5cbiAgI1xuICAjICogYGNvbHVtbkNvdW50YCAob3B0aW9uYWwpIHtOdW1iZXJ9IG51bWJlciBvZiBjb2x1bW5zIHRvIG1vdmUgKGRlZmF1bHQ6IDEpXG4gIG1vdmVMZWZ0OiAoY29sdW1uQ291bnQpIC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlTGVmdChjb2x1bW5Db3VudCwgbW92ZVRvRW5kT2ZTZWxlY3Rpb246IHRydWUpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgZXZlcnkgY3Vyc29yIHJpZ2h0IG9uZSBjb2x1bW4uXG4gICNcbiAgIyAqIGBjb2x1bW5Db3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgY29sdW1ucyB0byBtb3ZlIChkZWZhdWx0OiAxKVxuICBtb3ZlUmlnaHQ6IChjb2x1bW5Db3VudCkgLT5cbiAgICBAbW92ZUN1cnNvcnMgKGN1cnNvcikgLT4gY3Vyc29yLm1vdmVSaWdodChjb2x1bW5Db3VudCwgbW92ZVRvRW5kT2ZTZWxlY3Rpb246IHRydWUpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgaXRzIGxpbmUgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICBtb3ZlVG9CZWdpbm5pbmdPZkxpbmU6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIGV2ZXJ5IGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIGl0cyBsaW5lIGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgbW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lOiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lKClcblxuICAjIEVzc2VudGlhbDogTW92ZSBldmVyeSBjdXJzb3IgdG8gdGhlIGZpcnN0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBvZiBpdHMgbGluZS5cbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBlbmQgb2YgaXRzIGxpbmUgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICBtb3ZlVG9FbmRPZkxpbmU6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9FbmRPZkxpbmUoKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIGV2ZXJ5IGN1cnNvciB0byB0aGUgZW5kIG9mIGl0cyBsaW5lIGluIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgbW92ZVRvRW5kT2ZTY3JlZW5MaW5lOiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvRW5kT2ZTY3JlZW5MaW5lKClcblxuICAjIEVzc2VudGlhbDogTW92ZSBldmVyeSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiBpdHMgc3Vycm91bmRpbmcgd29yZC5cbiAgbW92ZVRvQmVnaW5uaW5nT2ZXb3JkOiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKClcblxuICAjIEVzc2VudGlhbDogTW92ZSBldmVyeSBjdXJzb3IgdG8gdGhlIGVuZCBvZiBpdHMgc3Vycm91bmRpbmcgd29yZC5cbiAgbW92ZVRvRW5kT2ZXb3JkOiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvRW5kT2ZXb3JkKClcblxuICAjIEN1cnNvciBFeHRlbmRlZFxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSB0b3Agb2YgdGhlIGJ1ZmZlci5cbiAgI1xuICAjIElmIHRoZXJlIGFyZSBtdWx0aXBsZSBjdXJzb3JzLCB0aGV5IHdpbGwgYmUgbWVyZ2VkIGludG8gYSBzaW5nbGUgY3Vyc29yLlxuICBtb3ZlVG9Ub3A6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9Ub3AoKVxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBib3R0b20gb2YgdGhlIGJ1ZmZlci5cbiAgI1xuICAjIElmIHRoZXJlIGFyZSBtdWx0aXBsZSBjdXJzb3JzLCB0aGV5IHdpbGwgYmUgbWVyZ2VkIGludG8gYSBzaW5nbGUgY3Vyc29yLlxuICBtb3ZlVG9Cb3R0b206IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9Cb3R0b20oKVxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgd29yZC5cbiAgbW92ZVRvQmVnaW5uaW5nT2ZOZXh0V29yZDogLT5cbiAgICBAbW92ZUN1cnNvcnMgKGN1cnNvcikgLT4gY3Vyc29yLm1vdmVUb0JlZ2lubmluZ09mTmV4dFdvcmQoKVxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBwcmV2aW91cyB3b3JkIGJvdW5kYXJ5LlxuICBtb3ZlVG9QcmV2aW91c1dvcmRCb3VuZGFyeTogLT5cbiAgICBAbW92ZUN1cnNvcnMgKGN1cnNvcikgLT4gY3Vyc29yLm1vdmVUb1ByZXZpb3VzV29yZEJvdW5kYXJ5KClcblxuICAjIEV4dGVuZGVkOiBNb3ZlIGV2ZXJ5IGN1cnNvciB0byB0aGUgbmV4dCB3b3JkIGJvdW5kYXJ5LlxuICBtb3ZlVG9OZXh0V29yZEJvdW5kYXJ5OiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvTmV4dFdvcmRCb3VuZGFyeSgpXG5cbiAgIyBFeHRlbmRlZDogTW92ZSBldmVyeSBjdXJzb3IgdG8gdGhlIHByZXZpb3VzIHN1YndvcmQgYm91bmRhcnkuXG4gIG1vdmVUb1ByZXZpb3VzU3Vid29yZEJvdW5kYXJ5OiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvUHJldmlvdXNTdWJ3b3JkQm91bmRhcnkoKVxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgZXZlcnkgY3Vyc29yIHRvIHRoZSBuZXh0IHN1YndvcmQgYm91bmRhcnkuXG4gIG1vdmVUb05leHRTdWJ3b3JkQm91bmRhcnk6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9OZXh0U3Vid29yZEJvdW5kYXJ5KClcblxuICAjIEV4dGVuZGVkOiBNb3ZlIGV2ZXJ5IGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHBhcmFncmFwaC5cbiAgbW92ZVRvQmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoOiAtPlxuICAgIEBtb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoKClcblxuICAjIEV4dGVuZGVkOiBNb3ZlIGV2ZXJ5IGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBwcmV2aW91cyBwYXJhZ3JhcGguXG4gIG1vdmVUb0JlZ2lubmluZ09mUHJldmlvdXNQYXJhZ3JhcGg6IC0+XG4gICAgQG1vdmVDdXJzb3JzIChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZlByZXZpb3VzUGFyYWdyYXBoKClcblxuICAjIEV4dGVuZGVkOiBSZXR1cm5zIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIHtDdXJzb3J9XG4gIGdldExhc3RDdXJzb3I6IC0+XG4gICAgQGNyZWF0ZUxhc3RTZWxlY3Rpb25JZk5lZWRlZCgpXG4gICAgXy5sYXN0KEBjdXJzb3JzKVxuXG4gICMgRXh0ZW5kZWQ6IFJldHVybnMgdGhlIHdvcmQgc3Vycm91bmRpbmcgdGhlIG1vc3QgcmVjZW50bHkgYWRkZWQgY3Vyc29yLlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBTZWUge0N1cnNvcjo6Z2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9ufS5cbiAgZ2V0V29yZFVuZGVyQ3Vyc29yOiAob3B0aW9ucykgLT5cbiAgICBAZ2V0VGV4dEluQnVmZmVyUmFuZ2UoQGdldExhc3RDdXJzb3IoKS5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKG9wdGlvbnMpKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCBhbiBBcnJheSBvZiBhbGwge0N1cnNvcn1zLlxuICBnZXRDdXJzb3JzOiAtPlxuICAgIEBjcmVhdGVMYXN0U2VsZWN0aW9uSWZOZWVkZWQoKVxuICAgIEBjdXJzb3JzLnNsaWNlKClcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIHtDdXJzb3JzfXMsIG9yZGVyZWQgYnkgdGhlaXIgcG9zaXRpb24gaW4gdGhlIGJ1ZmZlclxuICAjIGluc3RlYWQgb2YgdGhlIG9yZGVyIGluIHdoaWNoIHRoZXkgd2VyZSBhZGRlZC5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB7U2VsZWN0aW9ufXMuXG4gIGdldEN1cnNvcnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0Q3Vyc29ycygpLnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuXG4gIGN1cnNvcnNGb3JTY3JlZW5Sb3dSYW5nZTogKHN0YXJ0U2NyZWVuUm93LCBlbmRTY3JlZW5Sb3cpIC0+XG4gICAgY3Vyc29ycyA9IFtdXG4gICAgZm9yIG1hcmtlciBpbiBAc2VsZWN0aW9uc01hcmtlckxheWVyLmZpbmRNYXJrZXJzKGludGVyc2VjdHNTY3JlZW5Sb3dSYW5nZTogW3N0YXJ0U2NyZWVuUm93LCBlbmRTY3JlZW5Sb3ddKVxuICAgICAgaWYgY3Vyc29yID0gQGN1cnNvcnNCeU1hcmtlcklkLmdldChtYXJrZXIuaWQpXG4gICAgICAgIGN1cnNvcnMucHVzaChjdXJzb3IpXG4gICAgY3Vyc29yc1xuXG4gICMgQWRkIGEgY3Vyc29yIGJhc2VkIG9uIHRoZSBnaXZlbiB7RGlzcGxheU1hcmtlcn0uXG4gIGFkZEN1cnNvcjogKG1hcmtlcikgLT5cbiAgICBjdXJzb3IgPSBuZXcgQ3Vyc29yKGVkaXRvcjogdGhpcywgbWFya2VyOiBtYXJrZXIpXG4gICAgQGN1cnNvcnMucHVzaChjdXJzb3IpXG4gICAgQGN1cnNvcnNCeU1hcmtlcklkLnNldChtYXJrZXIuaWQsIGN1cnNvcilcbiAgICBAZGVjb3JhdGVNYXJrZXIobWFya2VyLCB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ2N1cnNvci1saW5lJylcbiAgICBAZGVjb3JhdGVNYXJrZXIobWFya2VyLCB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ2N1cnNvci1saW5lLW5vLXNlbGVjdGlvbicsIG9ubHlIZWFkOiB0cnVlLCBvbmx5RW1wdHk6IHRydWUpXG4gICAgQGRlY29yYXRlTWFya2VyKG1hcmtlciwgdHlwZTogJ2xpbmUnLCBjbGFzczogJ2N1cnNvci1saW5lJywgb25seUVtcHR5OiB0cnVlKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtY3Vyc29yJywgY3Vyc29yXG4gICAgY3Vyc29yXG5cbiAgbW92ZUN1cnNvcnM6IChmbikgLT5cbiAgICBmbihjdXJzb3IpIGZvciBjdXJzb3IgaW4gQGdldEN1cnNvcnMoKVxuICAgIEBtZXJnZUN1cnNvcnMoKVxuXG4gIGN1cnNvck1vdmVkOiAoZXZlbnQpIC0+XG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1jdXJzb3ItcG9zaXRpb24nLCBldmVudFxuXG4gICMgTWVyZ2UgY3Vyc29ycyB0aGF0IGhhdmUgdGhlIHNhbWUgc2NyZWVuIHBvc2l0aW9uXG4gIG1lcmdlQ3Vyc29yczogLT5cbiAgICBwb3NpdGlvbnMgPSB7fVxuICAgIGZvciBjdXJzb3IgaW4gQGdldEN1cnNvcnMoKVxuICAgICAgcG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50b1N0cmluZygpXG4gICAgICBpZiBwb3NpdGlvbnMuaGFzT3duUHJvcGVydHkocG9zaXRpb24pXG4gICAgICAgIGN1cnNvci5kZXN0cm95KClcbiAgICAgIGVsc2VcbiAgICAgICAgcG9zaXRpb25zW3Bvc2l0aW9uXSA9IHRydWVcbiAgICByZXR1cm5cblxuICBwcmVzZXJ2ZUN1cnNvclBvc2l0aW9uT25CdWZmZXJSZWxvYWQ6IC0+XG4gICAgY3Vyc29yUG9zaXRpb24gPSBudWxsXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAYnVmZmVyLm9uV2lsbFJlbG9hZCA9PlxuICAgICAgY3Vyc29yUG9zaXRpb24gPSBAZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGJ1ZmZlci5vbkRpZFJlbG9hZCA9PlxuICAgICAgQHNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKSBpZiBjdXJzb3JQb3NpdGlvblxuICAgICAgY3Vyc29yUG9zaXRpb24gPSBudWxsXG5cbiAgIyMjXG4gIFNlY3Rpb246IFNlbGVjdGlvbnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgc2VsZWN0ZWQgdGV4dCBvZiB0aGUgbW9zdCByZWNlbnRseSBhZGRlZCBzZWxlY3Rpb24uXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldFNlbGVjdGVkVGV4dDogLT5cbiAgICBAZ2V0TGFzdFNlbGVjdGlvbigpLmdldFRleHQoKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhlIHtSYW5nZX0gb2YgdGhlIG1vc3QgcmVjZW50bHkgYWRkZWQgc2VsZWN0aW9uIGluIGJ1ZmZlclxuICAjIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGdldFNlbGVjdGVkQnVmZmVyUmFuZ2U6IC0+XG4gICAgQGdldExhc3RTZWxlY3Rpb24oKS5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUge1JhbmdlfXMgb2YgYWxsIHNlbGVjdGlvbnMgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgVGhlIHJhbmdlcyBhcmUgc29ydGVkIGJ5IHdoZW4gdGhlIHNlbGVjdGlvbnMgd2VyZSBhZGRlZC4gTW9zdCByZWNlbnQgYXQgdGhlIGVuZC5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB7UmFuZ2V9cy5cbiAgZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXM6IC0+XG4gICAgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkgZm9yIHNlbGVjdGlvbiBpbiBAZ2V0U2VsZWN0aW9ucygpXG5cbiAgIyBFc3NlbnRpYWw6IFNldCB0aGUgc2VsZWN0ZWQgcmFuZ2UgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLiBJZiB0aGVyZSBhcmUgbXVsdGlwbGVcbiAgIyBzZWxlY3Rpb25zLCB0aGV5IGFyZSByZWR1Y2VkIHRvIGEgc2luZ2xlIHNlbGVjdGlvbiB3aXRoIHRoZSBnaXZlbiByYW5nZS5cbiAgI1xuICAjICogYGJ1ZmZlclJhbmdlYCBBIHtSYW5nZX0gb3IgcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9LlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fTpcbiAgIyAgICogYHJldmVyc2VkYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gaW4gYVxuICAjICAgICByZXZlcnNlZCBvcmllbnRhdGlvbi5cbiAgIyAgICogYHByZXNlcnZlRm9sZHNgIEEge0Jvb2xlYW59LCB3aGljaCBpZiBgdHJ1ZWAgcHJlc2VydmVzIHRoZSBmb2xkIHNldHRpbmdzIGFmdGVyIHRoZVxuICAjICAgICBzZWxlY3Rpb24gaXMgc2V0LlxuICBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UsIG9wdGlvbnMpIC0+XG4gICAgQHNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKFtidWZmZXJSYW5nZV0sIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IFNldCB0aGUgc2VsZWN0ZWQgcmFuZ2VzIGluIGJ1ZmZlciBjb29yZGluYXRlcy4gSWYgdGhlcmUgYXJlIG11bHRpcGxlXG4gICMgc2VsZWN0aW9ucywgdGhleSBhcmUgcmVwbGFjZWQgYnkgbmV3IHNlbGVjdGlvbnMgd2l0aCB0aGUgZ2l2ZW4gcmFuZ2VzLlxuICAjXG4gICMgKiBgYnVmZmVyUmFuZ2VzYCBBbiB7QXJyYXl9IG9mIHtSYW5nZX1zIG9yIHJhbmdlLWNvbXBhdGlibGUge0FycmF5fXMuXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiBvcHRpb25zIHtPYmplY3R9OlxuICAjICAgKiBgcmV2ZXJzZWRgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBpbiBhXG4gICMgICAgIHJldmVyc2VkIG9yaWVudGF0aW9uLlxuICAjICAgKiBgcHJlc2VydmVGb2xkc2AgQSB7Qm9vbGVhbn0sIHdoaWNoIGlmIGB0cnVlYCBwcmVzZXJ2ZXMgdGhlIGZvbGQgc2V0dGluZ3MgYWZ0ZXIgdGhlXG4gICMgICAgIHNlbGVjdGlvbiBpcyBzZXQuXG4gIHNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzOiAoYnVmZmVyUmFuZ2VzLCBvcHRpb25zPXt9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIlBhc3NlZCBhbiBlbXB0eSBhcnJheSB0byBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlc1wiKSB1bmxlc3MgYnVmZmVyUmFuZ2VzLmxlbmd0aFxuXG4gICAgc2VsZWN0aW9ucyA9IEBnZXRTZWxlY3Rpb25zKClcbiAgICBzZWxlY3Rpb24uZGVzdHJveSgpIGZvciBzZWxlY3Rpb24gaW4gc2VsZWN0aW9uc1tidWZmZXJSYW5nZXMubGVuZ3RoLi4uXVxuXG4gICAgQG1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucyBvcHRpb25zLCA9PlxuICAgICAgZm9yIGJ1ZmZlclJhbmdlLCBpIGluIGJ1ZmZlclJhbmdlc1xuICAgICAgICBidWZmZXJSYW5nZSA9IFJhbmdlLmZyb21PYmplY3QoYnVmZmVyUmFuZ2UpXG4gICAgICAgIGlmIHNlbGVjdGlvbnNbaV1cbiAgICAgICAgICBzZWxlY3Rpb25zW2ldLnNldEJ1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlLCBvcHRpb25zKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlLCBvcHRpb25zKVxuICAgICAgcmV0dXJuXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUge1JhbmdlfSBvZiB0aGUgbW9zdCByZWNlbnRseSBhZGRlZCBzZWxlY3Rpb24gaW4gc2NyZWVuXG4gICMgY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfS5cbiAgZ2V0U2VsZWN0ZWRTY3JlZW5SYW5nZTogLT5cbiAgICBAZ2V0TGFzdFNlbGVjdGlvbigpLmdldFNjcmVlblJhbmdlKClcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSB7UmFuZ2V9cyBvZiBhbGwgc2VsZWN0aW9ucyBpbiBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBUaGUgcmFuZ2VzIGFyZSBzb3J0ZWQgYnkgd2hlbiB0aGUgc2VsZWN0aW9ucyB3ZXJlIGFkZGVkLiBNb3N0IHJlY2VudCBhdCB0aGUgZW5kLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtSYW5nZX1zLlxuICBnZXRTZWxlY3RlZFNjcmVlblJhbmdlczogLT5cbiAgICBzZWxlY3Rpb24uZ2V0U2NyZWVuUmFuZ2UoKSBmb3Igc2VsZWN0aW9uIGluIEBnZXRTZWxlY3Rpb25zKClcblxuICAjIEVzc2VudGlhbDogU2V0IHRoZSBzZWxlY3RlZCByYW5nZSBpbiBzY3JlZW4gY29vcmRpbmF0ZXMuIElmIHRoZXJlIGFyZSBtdWx0aXBsZVxuICAjIHNlbGVjdGlvbnMsIHRoZXkgYXJlIHJlZHVjZWQgdG8gYSBzaW5nbGUgc2VsZWN0aW9uIHdpdGggdGhlIGdpdmVuIHJhbmdlLlxuICAjXG4gICMgKiBgc2NyZWVuUmFuZ2VgIEEge1JhbmdlfSBvciByYW5nZS1jb21wYXRpYmxlIHtBcnJheX0uXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiBvcHRpb25zIHtPYmplY3R9OlxuICAjICAgKiBgcmV2ZXJzZWRgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBpbiBhXG4gICMgICAgIHJldmVyc2VkIG9yaWVudGF0aW9uLlxuICBzZXRTZWxlY3RlZFNjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpIC0+XG4gICAgQHNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoQGJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBTZXQgdGhlIHNlbGVjdGVkIHJhbmdlcyBpbiBzY3JlZW4gY29vcmRpbmF0ZXMuIElmIHRoZXJlIGFyZSBtdWx0aXBsZVxuICAjIHNlbGVjdGlvbnMsIHRoZXkgYXJlIHJlcGxhY2VkIGJ5IG5ldyBzZWxlY3Rpb25zIHdpdGggdGhlIGdpdmVuIHJhbmdlcy5cbiAgI1xuICAjICogYHNjcmVlblJhbmdlc2AgQW4ge0FycmF5fSBvZiB7UmFuZ2V9cyBvciByYW5nZS1jb21wYXRpYmxlIHtBcnJheX1zLlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fTpcbiAgIyAgICogYHJldmVyc2VkYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gaW4gYVxuICAjICAgICByZXZlcnNlZCBvcmllbnRhdGlvbi5cbiAgc2V0U2VsZWN0ZWRTY3JlZW5SYW5nZXM6IChzY3JlZW5SYW5nZXMsIG9wdGlvbnM9e30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUGFzc2VkIGFuIGVtcHR5IGFycmF5IHRvIHNldFNlbGVjdGVkU2NyZWVuUmFuZ2VzXCIpIHVubGVzcyBzY3JlZW5SYW5nZXMubGVuZ3RoXG5cbiAgICBzZWxlY3Rpb25zID0gQGdldFNlbGVjdGlvbnMoKVxuICAgIHNlbGVjdGlvbi5kZXN0cm95KCkgZm9yIHNlbGVjdGlvbiBpbiBzZWxlY3Rpb25zW3NjcmVlblJhbmdlcy5sZW5ndGguLi5dXG5cbiAgICBAbWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zIG9wdGlvbnMsID0+XG4gICAgICBmb3Igc2NyZWVuUmFuZ2UsIGkgaW4gc2NyZWVuUmFuZ2VzXG4gICAgICAgIHNjcmVlblJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChzY3JlZW5SYW5nZSlcbiAgICAgICAgaWYgc2VsZWN0aW9uc1tpXVxuICAgICAgICAgIHNlbGVjdGlvbnNbaV0uc2V0U2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAYWRkU2VsZWN0aW9uRm9yU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UsIG9wdGlvbnMpXG4gICAgICByZXR1cm5cblxuICAjIEVzc2VudGlhbDogQWRkIGEgc2VsZWN0aW9uIGZvciB0aGUgZ2l2ZW4gcmFuZ2UgaW4gYnVmZmVyIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgKiBgYnVmZmVyUmFuZ2VgIEEge1JhbmdlfVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fTpcbiAgIyAgICogYHJldmVyc2VkYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gaW4gYVxuICAjICAgICByZXZlcnNlZCBvcmllbnRhdGlvbi5cbiAgIyAgICogYHByZXNlcnZlRm9sZHNgIEEge0Jvb2xlYW59LCB3aGljaCBpZiBgdHJ1ZWAgcHJlc2VydmVzIHRoZSBmb2xkIHNldHRpbmdzIGFmdGVyIHRoZVxuICAjICAgICBzZWxlY3Rpb24gaXMgc2V0LlxuICAjXG4gICMgUmV0dXJucyB0aGUgYWRkZWQge1NlbGVjdGlvbn0uXG4gIGFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UsIG9wdGlvbnM9e30pIC0+XG4gICAgdW5sZXNzIG9wdGlvbnMucHJlc2VydmVGb2xkc1xuICAgICAgQGRlc3Ryb3lGb2xkc0ludGVyc2VjdGluZ0J1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlKVxuICAgIEBzZWxlY3Rpb25zTWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJywgcmV2ZXJzZWQ6IG9wdGlvbnMucmV2ZXJzZWQgPyBmYWxzZX0pXG4gICAgQGdldExhc3RTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKCkgdW5sZXNzIG9wdGlvbnMuYXV0b3Njcm9sbCBpcyBmYWxzZVxuICAgIEBnZXRMYXN0U2VsZWN0aW9uKClcblxuICAjIEVzc2VudGlhbDogQWRkIGEgc2VsZWN0aW9uIGZvciB0aGUgZ2l2ZW4gcmFuZ2UgaW4gc2NyZWVuIGNvb3JkaW5hdGVzLlxuICAjXG4gICMgKiBgc2NyZWVuUmFuZ2VgIEEge1JhbmdlfVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fTpcbiAgIyAgICogYHJldmVyc2VkYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gaW4gYVxuICAjICAgICByZXZlcnNlZCBvcmllbnRhdGlvbi5cbiAgIyAgICogYHByZXNlcnZlRm9sZHNgIEEge0Jvb2xlYW59LCB3aGljaCBpZiBgdHJ1ZWAgcHJlc2VydmVzIHRoZSBmb2xkIHNldHRpbmdzIGFmdGVyIHRoZVxuICAjICAgICBzZWxlY3Rpb24gaXMgc2V0LlxuICAjIFJldHVybnMgdGhlIGFkZGVkIHtTZWxlY3Rpb259LlxuICBhZGRTZWxlY3Rpb25Gb3JTY3JlZW5SYW5nZTogKHNjcmVlblJhbmdlLCBvcHRpb25zPXt9KSAtPlxuICAgIEBhZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShAYnVmZmVyUmFuZ2VGb3JTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSksIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IFNlbGVjdCBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byB0aGUgZ2l2ZW4gcG9zaXRpb24gaW5cbiAgIyBidWZmZXIgY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlc2VjdGluZy5cbiAgI1xuICAjICogYHBvc2l0aW9uYCBBbiBpbnN0YW5jZSBvZiB7UG9pbnR9LCB3aXRoIGEgZ2l2ZW4gYHJvd2AgYW5kIGBjb2x1bW5gLlxuICBzZWxlY3RUb0J1ZmZlclBvc2l0aW9uOiAocG9zaXRpb24pIC0+XG4gICAgbGFzdFNlbGVjdGlvbiA9IEBnZXRMYXN0U2VsZWN0aW9uKClcbiAgICBsYXN0U2VsZWN0aW9uLnNlbGVjdFRvQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG4gICAgQG1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucyhyZXZlcnNlZDogbGFzdFNlbGVjdGlvbi5pc1JldmVyc2VkKCkpXG5cbiAgIyBFc3NlbnRpYWw6IFNlbGVjdCBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byB0aGUgZ2l2ZW4gcG9zaXRpb24gaW5cbiAgIyBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlc2VjdGluZy5cbiAgI1xuICAjICogYHBvc2l0aW9uYCBBbiBpbnN0YW5jZSBvZiB7UG9pbnR9LCB3aXRoIGEgZ2l2ZW4gYHJvd2AgYW5kIGBjb2x1bW5gLlxuICBzZWxlY3RUb1NjcmVlblBvc2l0aW9uOiAocG9zaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgbGFzdFNlbGVjdGlvbiA9IEBnZXRMYXN0U2VsZWN0aW9uKClcbiAgICBsYXN0U2VsZWN0aW9uLnNlbGVjdFRvU2NyZWVuUG9zaXRpb24ocG9zaXRpb24sIG9wdGlvbnMpXG4gICAgdW5sZXNzIG9wdGlvbnM/LnN1cHByZXNzU2VsZWN0aW9uTWVyZ2VcbiAgICAgIEBtZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMocmV2ZXJzZWQ6IGxhc3RTZWxlY3Rpb24uaXNSZXZlcnNlZCgpKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIHRoZSBjdXJzb3Igb2YgZWFjaCBzZWxlY3Rpb24gb25lIGNoYXJhY3RlciB1cHdhcmQgd2hpbGVcbiAgIyBwcmVzZXJ2aW5nIHRoZSBzZWxlY3Rpb24ncyB0YWlsIHBvc2l0aW9uLlxuICAjXG4gICMgKiBgcm93Q291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIHJvd3MgdG8gc2VsZWN0IChkZWZhdWx0OiAxKVxuICAjXG4gICMgVGhpcyBtZXRob2QgbWF5IG1lcmdlIHNlbGVjdGlvbnMgdGhhdCBlbmQgdXAgaW50ZXNlY3RpbmcuXG4gIHNlbGVjdFVwOiAocm93Q291bnQpIC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNCYWNrd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VXAocm93Q291bnQpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgdGhlIGN1cnNvciBvZiBlYWNoIHNlbGVjdGlvbiBvbmUgY2hhcmFjdGVyIGRvd253YXJkIHdoaWxlXG4gICMgcHJlc2VydmluZyB0aGUgc2VsZWN0aW9uJ3MgdGFpbCBwb3NpdGlvbi5cbiAgI1xuICAjICogYHJvd0NvdW50YCAob3B0aW9uYWwpIHtOdW1iZXJ9IG51bWJlciBvZiByb3dzIHRvIHNlbGVjdCAoZGVmYXVsdDogMSlcbiAgI1xuICAjIFRoaXMgbWV0aG9kIG1heSBtZXJnZSBzZWxlY3Rpb25zIHRoYXQgZW5kIHVwIGludGVzZWN0aW5nLlxuICBzZWxlY3REb3duOiAocm93Q291bnQpIC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNGb3J3YXJkIChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5zZWxlY3REb3duKHJvd0NvdW50KVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIHRoZSBjdXJzb3Igb2YgZWFjaCBzZWxlY3Rpb24gb25lIGNoYXJhY3RlciBsZWZ0d2FyZCB3aGlsZVxuICAjIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBjb2x1bW5Db3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgY29sdW1ucyB0byBzZWxlY3QgKGRlZmF1bHQ6IDEpXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlc2VjdGluZy5cbiAgc2VsZWN0TGVmdDogKGNvbHVtbkNvdW50KSAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zQmFja3dhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdExlZnQoY29sdW1uQ291bnQpXG5cbiAgIyBFc3NlbnRpYWw6IE1vdmUgdGhlIGN1cnNvciBvZiBlYWNoIHNlbGVjdGlvbiBvbmUgY2hhcmFjdGVyIHJpZ2h0d2FyZCB3aGlsZVxuICAjIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBjb2x1bW5Db3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgY29sdW1ucyB0byBzZWxlY3QgKGRlZmF1bHQ6IDEpXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlc2VjdGluZy5cbiAgc2VsZWN0UmlnaHQ6IChjb2x1bW5Db3VudCkgLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KGNvbHVtbkNvdW50KVxuXG4gICMgRXNzZW50aWFsOiBTZWxlY3QgZnJvbSB0aGUgdG9wIG9mIHRoZSBidWZmZXIgdG8gdGhlIGVuZCBvZiB0aGUgbGFzdCBzZWxlY3Rpb25cbiAgIyBpbiB0aGUgYnVmZmVyLlxuICAjXG4gICMgVGhpcyBtZXRob2QgbWVyZ2VzIG11bHRpcGxlIHNlbGVjdGlvbnMgaW50byBhIHNpbmdsZSBzZWxlY3Rpb24uXG4gIHNlbGVjdFRvVG9wOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zQmFja3dhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvVG9wKClcblxuICAjIEVzc2VudGlhbDogU2VsZWN0cyBmcm9tIHRoZSB0b3Agb2YgdGhlIGZpcnN0IHNlbGVjdGlvbiBpbiB0aGUgYnVmZmVyIHRvIHRoZSBlbmRcbiAgIyBvZiB0aGUgYnVmZmVyLlxuICAjXG4gICMgVGhpcyBtZXRob2QgbWVyZ2VzIG11bHRpcGxlIHNlbGVjdGlvbnMgaW50byBhIHNpbmdsZSBzZWxlY3Rpb24uXG4gIHNlbGVjdFRvQm90dG9tOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zRm9yd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9Cb3R0b20oKVxuXG4gICMgRXNzZW50aWFsOiBTZWxlY3QgYWxsIHRleHQgaW4gdGhlIGJ1ZmZlci5cbiAgI1xuICAjIFRoaXMgbWV0aG9kIG1lcmdlcyBtdWx0aXBsZSBzZWxlY3Rpb25zIGludG8gYSBzaW5nbGUgc2VsZWN0aW9uLlxuICBzZWxlY3RBbGw6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNGb3J3YXJkIChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5zZWxlY3RBbGwoKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIHRoZSBjdXJzb3Igb2YgZWFjaCBzZWxlY3Rpb24gdG8gdGhlIGJlZ2lubmluZyBvZiBpdHMgbGluZVxuICAjIHdoaWxlIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlc2VjdGluZy5cbiAgc2VsZWN0VG9CZWdpbm5pbmdPZkxpbmU6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNCYWNrd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9CZWdpbm5pbmdPZkxpbmUoKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIHRoZSBjdXJzb3Igb2YgZWFjaCBzZWxlY3Rpb24gdG8gdGhlIGZpcnN0IG5vbi13aGl0ZXNwYWNlXG4gICMgY2hhcmFjdGVyIG9mIGl0cyBsaW5lIHdoaWxlIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uIElmIHRoZVxuICAjIGN1cnNvciBpcyBhbHJlYWR5IG9uIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIGxpbmUsIG1vdmUgaXQgdG8gdGhlXG4gICMgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLlxuICAjXG4gICMgVGhpcyBtZXRob2QgbWF5IG1lcmdlIHNlbGVjdGlvbnMgdGhhdCBlbmQgdXAgaW50ZXJzZWN0aW5nLlxuICBzZWxlY3RUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zQmFja3dhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG4gICMgRXNzZW50aWFsOiBNb3ZlIHRoZSBjdXJzb3Igb2YgZWFjaCBzZWxlY3Rpb24gdG8gdGhlIGVuZCBvZiBpdHMgbGluZSB3aGlsZVxuICAjIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlcnNlY3RpbmcuXG4gIHNlbGVjdFRvRW5kT2ZMaW5lOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zRm9yd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9FbmRPZkxpbmUoKVxuXG4gICMgRXNzZW50aWFsOiBFeHBhbmQgc2VsZWN0aW9ucyB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZWlyIGNvbnRhaW5pbmcgd29yZC5cbiAgI1xuICAjIE9wZXJhdGVzIG9uIGFsbCBzZWxlY3Rpb25zLiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICMgY29udGFpbmluZyB3b3JkIHdoaWxlIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gIHNlbGVjdFRvQmVnaW5uaW5nT2ZXb3JkOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zQmFja3dhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvQmVnaW5uaW5nT2ZXb3JkKClcblxuICAjIEVzc2VudGlhbDogRXhwYW5kIHNlbGVjdGlvbnMgdG8gdGhlIGVuZCBvZiB0aGVpciBjb250YWluaW5nIHdvcmQuXG4gICNcbiAgIyBPcGVyYXRlcyBvbiBhbGwgc2VsZWN0aW9ucy4gTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBjb250YWluaW5nXG4gICMgd29yZCB3aGlsZSBwcmVzZXJ2aW5nIHRoZSBzZWxlY3Rpb24ncyB0YWlsIHBvc2l0aW9uLlxuICBzZWxlY3RUb0VuZE9mV29yZDogLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvRW5kT2ZXb3JkKClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBzZWxlY3Rpb24sIG1vdmUgaXRzIGN1cnNvciB0byB0aGUgcHJlY2VkaW5nIHN1YndvcmRcbiAgIyBib3VuZGFyeSB3aGlsZSBtYWludGFpbmluZyB0aGUgc2VsZWN0aW9uJ3MgdGFpbCBwb3NpdGlvbi5cbiAgI1xuICAjIFRoaXMgbWV0aG9kIG1heSBtZXJnZSBzZWxlY3Rpb25zIHRoYXQgZW5kIHVwIGludGVyc2VjdGluZy5cbiAgc2VsZWN0VG9QcmV2aW91c1N1YndvcmRCb3VuZGFyeTogLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0JhY2t3YXJkIChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5zZWxlY3RUb1ByZXZpb3VzU3Vid29yZEJvdW5kYXJ5KClcblxuICAjIEV4dGVuZGVkOiBGb3IgZWFjaCBzZWxlY3Rpb24sIG1vdmUgaXRzIGN1cnNvciB0byB0aGUgbmV4dCBzdWJ3b3JkIGJvdW5kYXJ5XG4gICMgd2hpbGUgbWFpbnRhaW5pbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlcnNlY3RpbmcuXG4gIHNlbGVjdFRvTmV4dFN1YndvcmRCb3VuZGFyeTogLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvTmV4dFN1YndvcmRCb3VuZGFyeSgpXG5cbiAgIyBFc3NlbnRpYWw6IEZvciBlYWNoIGN1cnNvciwgc2VsZWN0IHRoZSBjb250YWluaW5nIGxpbmUuXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtZXJnZXMgc2VsZWN0aW9ucyBvbiBzdWNjZXNzaXZlIGxpbmVzLlxuICBzZWxlY3RMaW5lc0NvbnRhaW5pbmdDdXJzb3JzOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zRm9yd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0TGluZSgpXG5cbiAgIyBFc3NlbnRpYWw6IFNlbGVjdCB0aGUgd29yZCBzdXJyb3VuZGluZyBlYWNoIGN1cnNvci5cbiAgc2VsZWN0V29yZHNDb250YWluaW5nQ3Vyc29yczogLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFdvcmQoKVxuXG4gICMgU2VsZWN0aW9uIEV4dGVuZGVkXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggc2VsZWN0aW9uLCBtb3ZlIGl0cyBjdXJzb3IgdG8gdGhlIHByZWNlZGluZyB3b3JkIGJvdW5kYXJ5XG4gICMgd2hpbGUgbWFpbnRhaW5pbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBtYXkgbWVyZ2Ugc2VsZWN0aW9ucyB0aGF0IGVuZCB1cCBpbnRlcnNlY3RpbmcuXG4gIHNlbGVjdFRvUHJldmlvdXNXb3JkQm91bmRhcnk6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNCYWNrd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9QcmV2aW91c1dvcmRCb3VuZGFyeSgpXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggc2VsZWN0aW9uLCBtb3ZlIGl0cyBjdXJzb3IgdG8gdGhlIG5leHQgd29yZCBib3VuZGFyeSB3aGlsZVxuICAjIG1haW50YWluaW5nIHRoZSBzZWxlY3Rpb24ncyB0YWlsIHBvc2l0aW9uLlxuICAjXG4gICMgVGhpcyBtZXRob2QgbWF5IG1lcmdlIHNlbGVjdGlvbnMgdGhhdCBlbmQgdXAgaW50ZXJzZWN0aW5nLlxuICBzZWxlY3RUb05leHRXb3JkQm91bmRhcnk6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNGb3J3YXJkIChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5zZWxlY3RUb05leHRXb3JkQm91bmRhcnkoKVxuXG4gICMgRXh0ZW5kZWQ6IEV4cGFuZCBzZWxlY3Rpb25zIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgd29yZC5cbiAgI1xuICAjIE9wZXJhdGVzIG9uIGFsbCBzZWxlY3Rpb25zLiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHRcbiAgIyB3b3JkIHdoaWxlIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gIHNlbGVjdFRvQmVnaW5uaW5nT2ZOZXh0V29yZDogLT5cbiAgICBAZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLnNlbGVjdFRvQmVnaW5uaW5nT2ZOZXh0V29yZCgpXG5cbiAgIyBFeHRlbmRlZDogRXhwYW5kIHNlbGVjdGlvbnMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCBwYXJhZ3JhcGguXG4gICNcbiAgIyBPcGVyYXRlcyBvbiBhbGwgc2VsZWN0aW9ucy4gTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0XG4gICMgcGFyYWdyYXBoIHdoaWxlIHByZXNlcnZpbmcgdGhlIHNlbGVjdGlvbidzIHRhaWwgcG9zaXRpb24uXG4gIHNlbGVjdFRvQmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoOiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zRm9yd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9CZWdpbm5pbmdPZk5leHRQYXJhZ3JhcGgoKVxuXG4gICMgRXh0ZW5kZWQ6IEV4cGFuZCBzZWxlY3Rpb25zIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgcGFyYWdyYXBoLlxuICAjXG4gICMgT3BlcmF0ZXMgb24gYWxsIHNlbGVjdGlvbnMuIE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dFxuICAjIHBhcmFncmFwaCB3aGlsZSBwcmVzZXJ2aW5nIHRoZSBzZWxlY3Rpb24ncyB0YWlsIHBvc2l0aW9uLlxuICBzZWxlY3RUb0JlZ2lubmluZ09mUHJldmlvdXNQYXJhZ3JhcGg6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNCYWNrd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uc2VsZWN0VG9CZWdpbm5pbmdPZlByZXZpb3VzUGFyYWdyYXBoKClcblxuICAjIEV4dGVuZGVkOiBTZWxlY3QgdGhlIHJhbmdlIG9mIHRoZSBnaXZlbiBtYXJrZXIgaWYgaXQgaXMgdmFsaWQuXG4gICNcbiAgIyAqIGBtYXJrZXJgIEEge0Rpc3BsYXlNYXJrZXJ9XG4gICNcbiAgIyBSZXR1cm5zIHRoZSBzZWxlY3RlZCB7UmFuZ2V9IG9yIGB1bmRlZmluZWRgIGlmIHRoZSBtYXJrZXIgaXMgaW52YWxpZC5cbiAgc2VsZWN0TWFya2VyOiAobWFya2VyKSAtPlxuICAgIGlmIG1hcmtlci5pc1ZhbGlkKClcbiAgICAgIHJhbmdlID0gbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgcmFuZ2VcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIG1vc3QgcmVjZW50bHkgYWRkZWQge1NlbGVjdGlvbn0uXG4gICNcbiAgIyBSZXR1cm5zIGEge1NlbGVjdGlvbn0uXG4gIGdldExhc3RTZWxlY3Rpb246IC0+XG4gICAgQGNyZWF0ZUxhc3RTZWxlY3Rpb25JZk5lZWRlZCgpXG4gICAgXy5sYXN0KEBzZWxlY3Rpb25zKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCBjdXJyZW50IHtTZWxlY3Rpb259cy5cbiAgI1xuICAjIFJldHVybnM6IEFuIHtBcnJheX0gb2Yge1NlbGVjdGlvbn1zLlxuICBnZXRTZWxlY3Rpb25zOiAtPlxuICAgIEBjcmVhdGVMYXN0U2VsZWN0aW9uSWZOZWVkZWQoKVxuICAgIEBzZWxlY3Rpb25zLnNsaWNlKClcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIHtTZWxlY3Rpb259cywgb3JkZXJlZCBieSB0aGVpciBwb3NpdGlvbiBpbiB0aGUgYnVmZmVyXG4gICMgaW5zdGVhZCBvZiB0aGUgb3JkZXIgaW4gd2hpY2ggdGhleSB3ZXJlIGFkZGVkLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtTZWxlY3Rpb259cy5cbiAgZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRTZWxlY3Rpb25zKCkuc29ydCAoYSwgYikgLT4gYS5jb21wYXJlKGIpXG5cbiAgIyBFeHRlbmRlZDogRGV0ZXJtaW5lIGlmIGEgZ2l2ZW4gcmFuZ2UgaW4gYnVmZmVyIGNvb3JkaW5hdGVzIGludGVyc2VjdHMgYVxuICAjIHNlbGVjdGlvbi5cbiAgI1xuICAjICogYGJ1ZmZlclJhbmdlYCBBIHtSYW5nZX0gb3IgcmFuZ2UtY29tcGF0aWJsZSB7QXJyYXl9LlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgc2VsZWN0aW9uSW50ZXJzZWN0c0J1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UpIC0+XG4gICAgXy5hbnkgQGdldFNlbGVjdGlvbnMoKSwgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5pbnRlcnNlY3RzQnVmZmVyUmFuZ2UoYnVmZmVyUmFuZ2UpXG5cbiAgIyBTZWxlY3Rpb25zIFByaXZhdGVcblxuICAjIEFkZCBhIHNpbWlsYXJseS1zaGFwZWQgc2VsZWN0aW9uIHRvIHRoZSBuZXh0IGVsaWdpYmxlIGxpbmUgYmVsb3dcbiAgIyBlYWNoIHNlbGVjdGlvbi5cbiAgI1xuICAjIE9wZXJhdGVzIG9uIGFsbCBzZWxlY3Rpb25zLiBJZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCBhZGRzIGFuIGVtcHR5XG4gICMgc2VsZWN0aW9uIHRvIHRoZSBuZXh0IGZvbGxvd2luZyBub24tZW1wdHkgbGluZSBhcyBjbG9zZSB0byB0aGUgY3VycmVudFxuICAjIHNlbGVjdGlvbidzIGNvbHVtbiBhcyBwb3NzaWJsZS4gSWYgdGhlIHNlbGVjdGlvbiBpcyBub24tZW1wdHksIGFkZHMgYVxuICAjIHNlbGVjdGlvbiB0byB0aGUgbmV4dCBsaW5lIHRoYXQgaXMgbG9uZyBlbm91Z2ggZm9yIGEgbm9uLWVtcHR5IHNlbGVjdGlvblxuICAjIHN0YXJ0aW5nIGF0IHRoZSBzYW1lIGNvbHVtbiBhcyB0aGUgY3VycmVudCBzZWxlY3Rpb24gdG8gYmUgYWRkZWQgdG8gaXQuXG4gIGFkZFNlbGVjdGlvbkJlbG93OiAtPlxuICAgIEBleHBhbmRTZWxlY3Rpb25zRm9yd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uYWRkU2VsZWN0aW9uQmVsb3coKVxuXG4gICMgQWRkIGEgc2ltaWxhcmx5LXNoYXBlZCBzZWxlY3Rpb24gdG8gdGhlIG5leHQgZWxpZ2libGUgbGluZSBhYm92ZVxuICAjIGVhY2ggc2VsZWN0aW9uLlxuICAjXG4gICMgT3BlcmF0ZXMgb24gYWxsIHNlbGVjdGlvbnMuIElmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHksIGFkZHMgYW4gZW1wdHlcbiAgIyBzZWxlY3Rpb24gdG8gdGhlIG5leHQgcHJlY2VkaW5nIG5vbi1lbXB0eSBsaW5lIGFzIGNsb3NlIHRvIHRoZSBjdXJyZW50XG4gICMgc2VsZWN0aW9uJ3MgY29sdW1uIGFzIHBvc3NpYmxlLiBJZiB0aGUgc2VsZWN0aW9uIGlzIG5vbi1lbXB0eSwgYWRkcyBhXG4gICMgc2VsZWN0aW9uIHRvIHRoZSBuZXh0IGxpbmUgdGhhdCBpcyBsb25nIGVub3VnaCBmb3IgYSBub24tZW1wdHkgc2VsZWN0aW9uXG4gICMgc3RhcnRpbmcgYXQgdGhlIHNhbWUgY29sdW1uIGFzIHRoZSBjdXJyZW50IHNlbGVjdGlvbiB0byBiZSBhZGRlZCB0byBpdC5cbiAgYWRkU2VsZWN0aW9uQWJvdmU6IC0+XG4gICAgQGV4cGFuZFNlbGVjdGlvbnNCYWNrd2FyZCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uYWRkU2VsZWN0aW9uQWJvdmUoKVxuXG4gICMgQ2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggZWFjaCBzZWxlY3Rpb24sIHRoZW4gbWVyZ2VzIHNlbGVjdGlvbnNcbiAgZXhwYW5kU2VsZWN0aW9uc0ZvcndhcmQ6IChmbikgLT5cbiAgICBAbWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zID0+XG4gICAgICBmbihzZWxlY3Rpb24pIGZvciBzZWxlY3Rpb24gaW4gQGdldFNlbGVjdGlvbnMoKVxuICAgICAgcmV0dXJuXG5cbiAgIyBDYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gd2l0aCBlYWNoIHNlbGVjdGlvbiwgdGhlbiBtZXJnZXMgc2VsZWN0aW9ucyBpbiB0aGVcbiAgIyByZXZlcnNlZCBvcmllbnRhdGlvblxuICBleHBhbmRTZWxlY3Rpb25zQmFja3dhcmQ6IChmbikgLT5cbiAgICBAbWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zIHJldmVyc2VkOiB0cnVlLCA9PlxuICAgICAgZm4oc2VsZWN0aW9uKSBmb3Igc2VsZWN0aW9uIGluIEBnZXRTZWxlY3Rpb25zKClcbiAgICAgIHJldHVyblxuXG4gIGZpbmFsaXplU2VsZWN0aW9uczogLT5cbiAgICBzZWxlY3Rpb24uZmluYWxpemUoKSBmb3Igc2VsZWN0aW9uIGluIEBnZXRTZWxlY3Rpb25zKClcbiAgICByZXR1cm5cblxuICBzZWxlY3Rpb25zRm9yU2NyZWVuUm93czogKHN0YXJ0Um93LCBlbmRSb3cpIC0+XG4gICAgQGdldFNlbGVjdGlvbnMoKS5maWx0ZXIgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmludGVyc2VjdHNTY3JlZW5Sb3dSYW5nZShzdGFydFJvdywgZW5kUm93KVxuXG4gICMgTWVyZ2VzIGludGVyc2VjdGluZyBzZWxlY3Rpb25zLiBJZiBwYXNzZWQgYSBmdW5jdGlvbiwgaXQgZXhlY3V0ZXNcbiAgIyB0aGUgZnVuY3Rpb24gd2l0aCBtZXJnaW5nIHN1cHByZXNzZWQsIHRoZW4gbWVyZ2VzIGludGVyc2VjdGluZyBzZWxlY3Rpb25zXG4gICMgYWZ0ZXJ3YXJkLlxuICBtZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnM6IChhcmdzLi4uKSAtPlxuICAgIEBtZXJnZVNlbGVjdGlvbnMgYXJncy4uLiwgKHByZXZpb3VzU2VsZWN0aW9uLCBjdXJyZW50U2VsZWN0aW9uKSAtPlxuICAgICAgZXhjbHVzaXZlID0gbm90IGN1cnJlbnRTZWxlY3Rpb24uaXNFbXB0eSgpIGFuZCBub3QgcHJldmlvdXNTZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICAgIHByZXZpb3VzU2VsZWN0aW9uLmludGVyc2VjdHNXaXRoKGN1cnJlbnRTZWxlY3Rpb24sIGV4Y2x1c2l2ZSlcblxuICBtZXJnZVNlbGVjdGlvbnNPblNhbWVSb3dzOiAoYXJncy4uLikgLT5cbiAgICBAbWVyZ2VTZWxlY3Rpb25zIGFyZ3MuLi4sIChwcmV2aW91c1NlbGVjdGlvbiwgY3VycmVudFNlbGVjdGlvbikgLT5cbiAgICAgIHNjcmVlblJhbmdlID0gY3VycmVudFNlbGVjdGlvbi5nZXRTY3JlZW5SYW5nZSgpXG5cbiAgICAgIHByZXZpb3VzU2VsZWN0aW9uLmludGVyc2VjdHNTY3JlZW5Sb3dSYW5nZShzY3JlZW5SYW5nZS5zdGFydC5yb3csIHNjcmVlblJhbmdlLmVuZC5yb3cpXG5cbiAgYXZvaWRNZXJnaW5nU2VsZWN0aW9uczogKGFyZ3MuLi4pIC0+XG4gICAgQG1lcmdlU2VsZWN0aW9ucyBhcmdzLi4uLCAtPiBmYWxzZVxuXG4gIG1lcmdlU2VsZWN0aW9uczogKGFyZ3MuLi4pIC0+XG4gICAgbWVyZ2VQcmVkaWNhdGUgPSBhcmdzLnBvcCgpXG4gICAgZm4gPSBhcmdzLnBvcCgpIGlmIF8uaXNGdW5jdGlvbihfLmxhc3QoYXJncykpXG4gICAgb3B0aW9ucyA9IGFyZ3MucG9wKCkgPyB7fVxuXG4gICAgcmV0dXJuIGZuPygpIGlmIEBzdXBwcmVzc1NlbGVjdGlvbk1lcmdpbmdcblxuICAgIGlmIGZuP1xuICAgICAgQHN1cHByZXNzU2VsZWN0aW9uTWVyZ2luZyA9IHRydWVcbiAgICAgIHJlc3VsdCA9IGZuKClcbiAgICAgIEBzdXBwcmVzc1NlbGVjdGlvbk1lcmdpbmcgPSBmYWxzZVxuXG4gICAgcmVkdWNlciA9IChkaXNqb2ludFNlbGVjdGlvbnMsIHNlbGVjdGlvbikgLT5cbiAgICAgIGFkamFjZW50U2VsZWN0aW9uID0gXy5sYXN0KGRpc2pvaW50U2VsZWN0aW9ucylcbiAgICAgIGlmIG1lcmdlUHJlZGljYXRlKGFkamFjZW50U2VsZWN0aW9uLCBzZWxlY3Rpb24pXG4gICAgICAgIGFkamFjZW50U2VsZWN0aW9uLm1lcmdlKHNlbGVjdGlvbiwgb3B0aW9ucylcbiAgICAgICAgZGlzam9pbnRTZWxlY3Rpb25zXG4gICAgICBlbHNlXG4gICAgICAgIGRpc2pvaW50U2VsZWN0aW9ucy5jb25jYXQoW3NlbGVjdGlvbl0pXG5cbiAgICBbaGVhZCwgdGFpbC4uLl0gPSBAZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICBfLnJlZHVjZSh0YWlsLCByZWR1Y2VyLCBbaGVhZF0pXG4gICAgcmV0dXJuIHJlc3VsdCBpZiBmbj9cblxuICAjIEFkZCBhIHtTZWxlY3Rpb259IGJhc2VkIG9uIHRoZSBnaXZlbiB7RGlzcGxheU1hcmtlcn0uXG4gICNcbiAgIyAqIGBtYXJrZXJgIFRoZSB7RGlzcGxheU1hcmtlcn0gdG8gaGlnaGxpZ2h0XG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiB7T2JqZWN0fSB0aGF0IHBlcnRhaW5zIHRvIHRoZSB7U2VsZWN0aW9ufSBjb25zdHJ1Y3Rvci5cbiAgI1xuICAjIFJldHVybnMgdGhlIG5ldyB7U2VsZWN0aW9ufS5cbiAgYWRkU2VsZWN0aW9uOiAobWFya2VyLCBvcHRpb25zPXt9KSAtPlxuICAgIGN1cnNvciA9IEBhZGRDdXJzb3IobWFya2VyKVxuICAgIHNlbGVjdGlvbiA9IG5ldyBTZWxlY3Rpb24oT2JqZWN0LmFzc2lnbih7ZWRpdG9yOiB0aGlzLCBtYXJrZXIsIGN1cnNvcn0sIG9wdGlvbnMpKVxuICAgIEBzZWxlY3Rpb25zLnB1c2goc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbkJ1ZmZlclJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBAbWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKHByZXNlcnZlRm9sZHM6IG9wdGlvbnMucHJlc2VydmVGb2xkcylcblxuICAgIGlmIHNlbGVjdGlvbi5kZXN0cm95ZWRcbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGdldFNlbGVjdGlvbnMoKVxuICAgICAgICBpZiBzZWxlY3Rpb24uaW50ZXJzZWN0c0J1ZmZlclJhbmdlKHNlbGVjdGlvbkJ1ZmZlclJhbmdlKVxuICAgICAgICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICBlbHNlXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLXNlbGVjdGlvbicsIHNlbGVjdGlvblxuICAgICAgc2VsZWN0aW9uXG5cbiAgIyBSZW1vdmUgdGhlIGdpdmVuIHNlbGVjdGlvbi5cbiAgcmVtb3ZlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIF8ucmVtb3ZlKEBjdXJzb3JzLCBzZWxlY3Rpb24uY3Vyc29yKVxuICAgIF8ucmVtb3ZlKEBzZWxlY3Rpb25zLCBzZWxlY3Rpb24pXG4gICAgQGN1cnNvcnNCeU1hcmtlcklkLmRlbGV0ZShzZWxlY3Rpb24uY3Vyc29yLm1hcmtlci5pZClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtcmVtb3ZlLWN1cnNvcicsIHNlbGVjdGlvbi5jdXJzb3JcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtcmVtb3ZlLXNlbGVjdGlvbicsIHNlbGVjdGlvblxuXG4gICMgUmVkdWNlIG9uZSBvciBtb3JlIHNlbGVjdGlvbnMgdG8gYSBzaW5nbGUgZW1wdHkgc2VsZWN0aW9uIGJhc2VkIG9uIHRoZSBtb3N0XG4gICMgcmVjZW50bHkgYWRkZWQgY3Vyc29yLlxuICBjbGVhclNlbGVjdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBjb25zb2xpZGF0ZVNlbGVjdGlvbnMoKVxuICAgIEBnZXRMYXN0U2VsZWN0aW9uKCkuY2xlYXIob3B0aW9ucylcblxuICAjIFJlZHVjZSBtdWx0aXBsZSBzZWxlY3Rpb25zIHRvIHRoZSBsZWFzdCByZWNlbnRseSBhZGRlZCBzZWxlY3Rpb24uXG4gIGNvbnNvbGlkYXRlU2VsZWN0aW9uczogLT5cbiAgICBzZWxlY3Rpb25zID0gQGdldFNlbGVjdGlvbnMoKVxuICAgIGlmIHNlbGVjdGlvbnMubGVuZ3RoID4gMVxuICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKSBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNbMS4uLihzZWxlY3Rpb25zLmxlbmd0aCldXG4gICAgICBzZWxlY3Rpb25zWzBdLmF1dG9zY3JvbGwoY2VudGVyOiB0cnVlKVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cbiAgIyBDYWxsZWQgYnkgdGhlIHNlbGVjdGlvblxuICBzZWxlY3Rpb25SYW5nZUNoYW5nZWQ6IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLXNlbGVjdGlvbi1yYW5nZScsIGV2ZW50XG5cbiAgY3JlYXRlTGFzdFNlbGVjdGlvbklmTmVlZGVkOiAtPlxuICAgIGlmIEBzZWxlY3Rpb25zLmxlbmd0aCBpcyAwXG4gICAgICBAYWRkU2VsZWN0aW9uRm9yQnVmZmVyUmFuZ2UoW1swLCAwXSwgWzAsIDBdXSwgYXV0b3Njcm9sbDogZmFsc2UsIHByZXNlcnZlRm9sZHM6IHRydWUpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFNlYXJjaGluZyBhbmQgUmVwbGFjaW5nXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBTY2FuIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzIGluIHRoZSBlbnRpcmUgYnVmZmVyLCBjYWxsaW5nIHRoZVxuICAjIGdpdmVuIGl0ZXJhdG9yIGZ1bmN0aW9uIG9uIGVhY2ggbWF0Y2guXG4gICNcbiAgIyBgOjpzY2FuYCBmdW5jdGlvbnMgYXMgdGhlIHJlcGxhY2UgbWV0aG9kIGFzIHdlbGwgdmlhIHRoZSBgcmVwbGFjZWBcbiAgI1xuICAjIElmIHlvdSdyZSBwcm9ncmFtbWF0aWNhbGx5IG1vZGlmeWluZyB0aGUgcmVzdWx0cywgeW91IG1heSB3YW50IHRvIHRyeVxuICAjIHs6OmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlfSB0byBhdm9pZCB0cmlwcGluZyBvdmVyIHlvdXIgb3duIGNoYW5nZXMuXG4gICNcbiAgIyAqIGByZWdleGAgQSB7UmVnRXhwfSB0byBzZWFyY2ggZm9yLlxuICAjICogYGl0ZXJhdG9yYCBBIHtGdW5jdGlvbn0gdGhhdCdzIGNhbGxlZCBvbiBlYWNoIG1hdGNoXG4gICMgICAqIGBvYmplY3RgIHtPYmplY3R9XG4gICMgICAgICogYG1hdGNoYCBUaGUgY3VycmVudCByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2guXG4gICMgICAgICogYG1hdGNoVGV4dGAgQSB7U3RyaW5nfSB3aXRoIHRoZSB0ZXh0IG9mIHRoZSBtYXRjaC5cbiAgIyAgICAgKiBgcmFuZ2VgIFRoZSB7UmFuZ2V9IG9mIHRoZSBtYXRjaC5cbiAgIyAgICAgKiBgc3RvcGAgQ2FsbCB0aGlzIHtGdW5jdGlvbn0gdG8gdGVybWluYXRlIHRoZSBzY2FuLlxuICAjICAgICAqIGByZXBsYWNlYCBDYWxsIHRoaXMge0Z1bmN0aW9ufSB3aXRoIGEge1N0cmluZ30gdG8gcmVwbGFjZSB0aGUgbWF0Y2guXG4gIHNjYW46IChyZWdleCwgaXRlcmF0b3IpIC0+IEBidWZmZXIuc2NhbihyZWdleCwgaXRlcmF0b3IpXG5cbiAgIyBFc3NlbnRpYWw6IFNjYW4gcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXMgaW4gYSBnaXZlbiByYW5nZSwgY2FsbGluZyB0aGUgZ2l2ZW5cbiAgIyBpdGVyYXRvciBmdW5jdGlvbiBvbiBlYWNoIG1hdGNoLlxuICAjXG4gICMgKiBgcmVnZXhgIEEge1JlZ0V4cH0gdG8gc2VhcmNoIGZvci5cbiAgIyAqIGByYW5nZWAgQSB7UmFuZ2V9IGluIHdoaWNoIHRvIHNlYXJjaC5cbiAgIyAqIGBpdGVyYXRvcmAgQSB7RnVuY3Rpb259IHRoYXQncyBjYWxsZWQgb24gZWFjaCBtYXRjaCB3aXRoIGFuIHtPYmplY3R9XG4gICMgICBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYG1hdGNoYCBUaGUgY3VycmVudCByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2guXG4gICMgICAqIGBtYXRjaFRleHRgIEEge1N0cmluZ30gd2l0aCB0aGUgdGV4dCBvZiB0aGUgbWF0Y2guXG4gICMgICAqIGByYW5nZWAgVGhlIHtSYW5nZX0gb2YgdGhlIG1hdGNoLlxuICAjICAgKiBgc3RvcGAgQ2FsbCB0aGlzIHtGdW5jdGlvbn0gdG8gdGVybWluYXRlIHRoZSBzY2FuLlxuICAjICAgKiBgcmVwbGFjZWAgQ2FsbCB0aGlzIHtGdW5jdGlvbn0gd2l0aCBhIHtTdHJpbmd9IHRvIHJlcGxhY2UgdGhlIG1hdGNoLlxuICBzY2FuSW5CdWZmZXJSYW5nZTogKHJlZ2V4LCByYW5nZSwgaXRlcmF0b3IpIC0+IEBidWZmZXIuc2NhbkluUmFuZ2UocmVnZXgsIHJhbmdlLCBpdGVyYXRvcilcblxuICAjIEVzc2VudGlhbDogU2NhbiByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBpbiBhIGdpdmVuIHJhbmdlIGluIHJldmVyc2Ugb3JkZXIsXG4gICMgY2FsbGluZyB0aGUgZ2l2ZW4gaXRlcmF0b3IgZnVuY3Rpb24gb24gZWFjaCBtYXRjaC5cbiAgI1xuICAjICogYHJlZ2V4YCBBIHtSZWdFeHB9IHRvIHNlYXJjaCBmb3IuXG4gICMgKiBgcmFuZ2VgIEEge1JhbmdlfSBpbiB3aGljaCB0byBzZWFyY2guXG4gICMgKiBgaXRlcmF0b3JgIEEge0Z1bmN0aW9ufSB0aGF0J3MgY2FsbGVkIG9uIGVhY2ggbWF0Y2ggd2l0aCBhbiB7T2JqZWN0fVxuICAjICAgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAqIGBtYXRjaGAgVGhlIGN1cnJlbnQgcmVndWxhciBleHByZXNzaW9uIG1hdGNoLlxuICAjICAgKiBgbWF0Y2hUZXh0YCBBIHtTdHJpbmd9IHdpdGggdGhlIHRleHQgb2YgdGhlIG1hdGNoLlxuICAjICAgKiBgcmFuZ2VgIFRoZSB7UmFuZ2V9IG9mIHRoZSBtYXRjaC5cbiAgIyAgICogYHN0b3BgIENhbGwgdGhpcyB7RnVuY3Rpb259IHRvIHRlcm1pbmF0ZSB0aGUgc2Nhbi5cbiAgIyAgICogYHJlcGxhY2VgIENhbGwgdGhpcyB7RnVuY3Rpb259IHdpdGggYSB7U3RyaW5nfSB0byByZXBsYWNlIHRoZSBtYXRjaC5cbiAgYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2U6IChyZWdleCwgcmFuZ2UsIGl0ZXJhdG9yKSAtPiBAYnVmZmVyLmJhY2t3YXJkc1NjYW5JblJhbmdlKHJlZ2V4LCByYW5nZSwgaXRlcmF0b3IpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFRhYiBCZWhhdmlvclxuICAjIyNcblxuICAjIEVzc2VudGlhbDogUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgc29mdFRhYnMgYXJlIGVuYWJsZWQgZm9yIHRoaXNcbiAgIyBlZGl0b3IuXG4gIGdldFNvZnRUYWJzOiAtPiBAc29mdFRhYnNcblxuICAjIEVzc2VudGlhbDogRW5hYmxlIG9yIGRpc2FibGUgc29mdCB0YWJzIGZvciB0aGlzIGVkaXRvci5cbiAgI1xuICAjICogYHNvZnRUYWJzYCBBIHtCb29sZWFufVxuICBzZXRTb2Z0VGFiczogKEBzb2Z0VGFicykgLT4gQHVwZGF0ZSh7QHNvZnRUYWJzfSlcblxuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIGF0b21pYyBzb2Z0IHRhYnMgYXJlIGVuYWJsZWQgZm9yIHRoaXMgZWRpdG9yLlxuICBoYXNBdG9taWNTb2Z0VGFiczogLT4gQGRpc3BsYXlMYXllci5hdG9taWNTb2Z0VGFic1xuXG4gICMgRXNzZW50aWFsOiBUb2dnbGUgc29mdCB0YWJzIGZvciB0aGlzIGVkaXRvclxuICB0b2dnbGVTb2Z0VGFiczogLT4gQHNldFNvZnRUYWJzKG5vdCBAZ2V0U29mdFRhYnMoKSlcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBvbi1zY3JlZW4gbGVuZ3RoIG9mIHRhYiBjaGFyYWN0ZXJzLlxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9LlxuICBnZXRUYWJMZW5ndGg6IC0+IEB0b2tlbml6ZWRCdWZmZXIuZ2V0VGFiTGVuZ3RoKClcblxuICAjIEVzc2VudGlhbDogU2V0IHRoZSBvbi1zY3JlZW4gbGVuZ3RoIG9mIHRhYiBjaGFyYWN0ZXJzLiBTZXR0aW5nIHRoaXMgdG8gYVxuICAjIHtOdW1iZXJ9IFRoaXMgd2lsbCBvdmVycmlkZSB0aGUgYGVkaXRvci50YWJMZW5ndGhgIHNldHRpbmcuXG4gICNcbiAgIyAqIGB0YWJMZW5ndGhgIHtOdW1iZXJ9IGxlbmd0aCBvZiBhIHNpbmdsZSB0YWIuIFNldHRpbmcgdG8gYG51bGxgIHdpbGxcbiAgIyAgIGZhbGxiYWNrIHRvIHVzaW5nIHRoZSBgZWRpdG9yLnRhYkxlbmd0aGAgY29uZmlnIHNldHRpbmdcbiAgc2V0VGFiTGVuZ3RoOiAodGFiTGVuZ3RoKSAtPiBAdXBkYXRlKHt0YWJMZW5ndGh9KVxuXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgaW52aXNpYmxlIGNoYXJhY3RlclxuICAjIHN1YnN0aXR1dGlvbnMgZm9yIHRoaXMgZWRpdG9yLiBTZWUgezo6c2V0SW52aXNpYmxlc30uXG4gIGdldEludmlzaWJsZXM6IC0+XG4gICAgaWYgbm90IEBtaW5pIGFuZCBAc2hvd0ludmlzaWJsZXMgYW5kIEBpbnZpc2libGVzP1xuICAgICAgQGludmlzaWJsZXNcbiAgICBlbHNlXG4gICAgICB7fVxuXG4gIGRvZXNTaG93SW5kZW50R3VpZGU6IC0+IEBzaG93SW5kZW50R3VpZGUgYW5kIG5vdCBAbWluaVxuXG4gIGdldFNvZnRXcmFwSGFuZ2luZ0luZGVudExlbmd0aDogLT4gQGRpc3BsYXlMYXllci5zb2Z0V3JhcEhhbmdpbmdJbmRlbnRcblxuICAjIEV4dGVuZGVkOiBEZXRlcm1pbmUgaWYgdGhlIGJ1ZmZlciB1c2VzIGhhcmQgb3Igc29mdCB0YWJzLlxuICAjXG4gICMgUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGZpcnN0IG5vbi1jb21tZW50IGxpbmUgd2l0aCBsZWFkaW5nIHdoaXRlc3BhY2Ugc3RhcnRzXG4gICMgd2l0aCBhIHNwYWNlIGNoYXJhY3Rlci4gUmV0dXJucyBgZmFsc2VgIGlmIGl0IHN0YXJ0cyB3aXRoIGEgaGFyZCB0YWIgKGBcXHRgKS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gb3IgdW5kZWZpbmVkIGlmIG5vIG5vbi1jb21tZW50IGxpbmVzIGhhZCBsZWFkaW5nXG4gICMgd2hpdGVzcGFjZS5cbiAgdXNlc1NvZnRUYWJzOiAtPlxuICAgIGZvciBidWZmZXJSb3cgaW4gWzAuLkBidWZmZXIuZ2V0TGFzdFJvdygpXVxuICAgICAgY29udGludWUgaWYgQHRva2VuaXplZEJ1ZmZlci50b2tlbml6ZWRMaW5lc1tidWZmZXJSb3ddPy5pc0NvbW1lbnQoKVxuXG4gICAgICBsaW5lID0gQGJ1ZmZlci5saW5lRm9yUm93KGJ1ZmZlclJvdylcbiAgICAgIHJldHVybiB0cnVlICBpZiBsaW5lWzBdIGlzICcgJ1xuICAgICAgcmV0dXJuIGZhbHNlIGlmIGxpbmVbMF0gaXMgJ1xcdCdcblxuICAgIHVuZGVmaW5lZFxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUgdGV4dCByZXByZXNlbnRpbmcgYSBzaW5nbGUgbGV2ZWwgb2YgaW5kZW50LlxuICAjXG4gICMgSWYgc29mdCB0YWJzIGFyZSBlbmFibGVkLCB0aGUgdGV4dCBpcyBjb21wb3NlZCBvZiBOIHNwYWNlcywgd2hlcmUgTiBpcyB0aGVcbiAgIyB0YWIgbGVuZ3RoLiBPdGhlcndpc2UgdGhlIHRleHQgaXMgYSB0YWIgY2hhcmFjdGVyIChgXFx0YCkuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldFRhYlRleHQ6IC0+IEBidWlsZEluZGVudFN0cmluZygxKVxuXG4gICMgSWYgc29mdCB0YWJzIGFyZSBlbmFibGVkLCBjb252ZXJ0IGFsbCBoYXJkIHRhYnMgdG8gc29mdCB0YWJzIGluIHRoZSBnaXZlblxuICAjIHtSYW5nZX0uXG4gIG5vcm1hbGl6ZVRhYnNJbkJ1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZ2V0U29mdFRhYnMoKVxuICAgIEBzY2FuSW5CdWZmZXJSYW5nZSAvXFx0L2csIGJ1ZmZlclJhbmdlLCAoe3JlcGxhY2V9KSA9PiByZXBsYWNlKEBnZXRUYWJUZXh0KCkpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFNvZnQgV3JhcCBCZWhhdmlvclxuICAjIyNcblxuICAjIEVzc2VudGlhbDogRGV0ZXJtaW5lIHdoZXRoZXIgbGluZXMgaW4gdGhpcyBlZGl0b3IgYXJlIHNvZnQtd3JhcHBlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzU29mdFdyYXBwZWQ6IC0+XG4gICAgaWYgQGxhcmdlRmlsZU1vZGVcbiAgICAgIGZhbHNlXG4gICAgZWxzZVxuICAgICAgQHNvZnRXcmFwcGVkXG5cbiAgIyBFc3NlbnRpYWw6IEVuYWJsZSBvciBkaXNhYmxlIHNvZnQgd3JhcHBpbmcgZm9yIHRoaXMgZWRpdG9yLlxuICAjXG4gICMgKiBgc29mdFdyYXBwZWRgIEEge0Jvb2xlYW59XG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBzZXRTb2Z0V3JhcHBlZDogKHNvZnRXcmFwcGVkKSAtPlxuICAgIEB1cGRhdGUoe3NvZnRXcmFwcGVkfSlcbiAgICBAaXNTb2Z0V3JhcHBlZCgpXG5cbiAgZ2V0UHJlZmVycmVkTGluZUxlbmd0aDogLT4gQHByZWZlcnJlZExpbmVMZW5ndGhcblxuICAjIEVzc2VudGlhbDogVG9nZ2xlIHNvZnQgd3JhcHBpbmcgZm9yIHRoaXMgZWRpdG9yXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICB0b2dnbGVTb2Z0V3JhcHBlZDogLT4gQHNldFNvZnRXcmFwcGVkKG5vdCBAaXNTb2Z0V3JhcHBlZCgpKVxuXG4gICMgRXNzZW50aWFsOiBHZXRzIHRoZSBjb2x1bW4gYXQgd2hpY2ggY29sdW1uIHdpbGwgc29mdCB3cmFwXG4gIGdldFNvZnRXcmFwQ29sdW1uOiAtPlxuICAgIGlmIEBpc1NvZnRXcmFwcGVkKClcbiAgICAgIGlmIEBzb2Z0V3JhcEF0UHJlZmVycmVkTGluZUxlbmd0aFxuICAgICAgICBNYXRoLm1pbihAZ2V0RWRpdG9yV2lkdGhJbkNoYXJzKCksIEBwcmVmZXJyZWRMaW5lTGVuZ3RoKVxuICAgICAgZWxzZVxuICAgICAgICBAZ2V0RWRpdG9yV2lkdGhJbkNoYXJzKClcbiAgICBlbHNlXG4gICAgICBJbmZpbml0eVxuXG4gICMjI1xuICBTZWN0aW9uOiBJbmRlbnRhdGlvblxuICAjIyNcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBpbmRlbnRhdGlvbiBsZXZlbCBvZiB0aGUgZ2l2ZW4gYnVmZmVyIHJvdy5cbiAgI1xuICAjIERldGVybWluZXMgaG93IGRlZXBseSB0aGUgZ2l2ZW4gcm93IGlzIGluZGVudGVkIGJhc2VkIG9uIHRoZSBzb2Z0IHRhYnMgYW5kXG4gICMgdGFiIGxlbmd0aCBzZXR0aW5ncyBvZiB0aGlzIGVkaXRvci4gTm90ZSB0aGF0IGlmIHNvZnQgdGFicyBhcmUgZW5hYmxlZCBhbmRcbiAgIyB0aGUgdGFiIGxlbmd0aCBpcyAyLCBhIHJvdyB3aXRoIDQgbGVhZGluZyBzcGFjZXMgd291bGQgaGF2ZSBhbiBpbmRlbnRhdGlvblxuICAjIGxldmVsIG9mIDIuXG4gICNcbiAgIyAqIGBidWZmZXJSb3dgIEEge051bWJlcn0gaW5kaWNhdGluZyB0aGUgYnVmZmVyIHJvdy5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgaW5kZW50YXRpb25Gb3JCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgQGluZGVudExldmVsRm9yTGluZShAbGluZVRleHRGb3JCdWZmZXJSb3coYnVmZmVyUm93KSlcblxuICAjIEVzc2VudGlhbDogU2V0IHRoZSBpbmRlbnRhdGlvbiBsZXZlbCBmb3IgdGhlIGdpdmVuIGJ1ZmZlciByb3cuXG4gICNcbiAgIyBJbnNlcnRzIG9yIHJlbW92ZXMgaGFyZCB0YWJzIG9yIHNwYWNlcyBiYXNlZCBvbiB0aGUgc29mdCB0YWJzIGFuZCB0YWIgbGVuZ3RoXG4gICMgc2V0dGluZ3Mgb2YgdGhpcyBlZGl0b3IgaW4gb3JkZXIgdG8gYnJpbmcgaXQgdG8gdGhlIGdpdmVuIGluZGVudGF0aW9uIGxldmVsLlxuICAjIE5vdGUgdGhhdCBpZiBzb2Z0IHRhYnMgYXJlIGVuYWJsZWQgYW5kIHRoZSB0YWIgbGVuZ3RoIGlzIDIsIGEgcm93IHdpdGggNFxuICAjIGxlYWRpbmcgc3BhY2VzIHdvdWxkIGhhdmUgYW4gaW5kZW50YXRpb24gbGV2ZWwgb2YgMi5cbiAgI1xuICAjICogYGJ1ZmZlclJvd2AgQSB7TnVtYmVyfSBpbmRpY2F0aW5nIHRoZSBidWZmZXIgcm93LlxuICAjICogYG5ld0xldmVsYCBBIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhlIG5ldyBpbmRlbnRhdGlvbiBsZXZlbC5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZWAgYHRydWVgIHRvIHByZXNlcnZlIGFueSB3aGl0ZXNwYWNlIGFscmVhZHkgYXRcbiAgIyAgICAgIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgKGRlZmF1bHQ6IGZhbHNlKS5cbiAgc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3c6IChidWZmZXJSb3csIG5ld0xldmVsLCB7cHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZX09e30pIC0+XG4gICAgaWYgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZVxuICAgICAgZW5kQ29sdW1uID0gMFxuICAgIGVsc2VcbiAgICAgIGVuZENvbHVtbiA9IEBsaW5lVGV4dEZvckJ1ZmZlclJvdyhidWZmZXJSb3cpLm1hdGNoKC9eXFxzKi8pWzBdLmxlbmd0aFxuICAgIG5ld0luZGVudFN0cmluZyA9IEBidWlsZEluZGVudFN0cmluZyhuZXdMZXZlbClcbiAgICBAYnVmZmVyLnNldFRleHRJblJhbmdlKFtbYnVmZmVyUm93LCAwXSwgW2J1ZmZlclJvdywgZW5kQ29sdW1uXV0sIG5ld0luZGVudFN0cmluZylcblxuICAjIEV4dGVuZGVkOiBJbmRlbnQgcm93cyBpbnRlcnNlY3Rpbmcgc2VsZWN0aW9ucyBieSBvbmUgbGV2ZWwuXG4gIGluZGVudFNlbGVjdGVkUm93czogLT5cbiAgICBAbXV0YXRlU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi5pbmRlbnRTZWxlY3RlZFJvd3MoKVxuXG4gICMgRXh0ZW5kZWQ6IE91dGRlbnQgcm93cyBpbnRlcnNlY3Rpbmcgc2VsZWN0aW9ucyBieSBvbmUgbGV2ZWwuXG4gIG91dGRlbnRTZWxlY3RlZFJvd3M6IC0+XG4gICAgQG11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24ub3V0ZGVudFNlbGVjdGVkUm93cygpXG5cbiAgIyBFeHRlbmRlZDogR2V0IHRoZSBpbmRlbnRhdGlvbiBsZXZlbCBvZiB0aGUgZ2l2ZW4gbGluZSBvZiB0ZXh0LlxuICAjXG4gICMgRGV0ZXJtaW5lcyBob3cgZGVlcGx5IHRoZSBnaXZlbiBsaW5lIGlzIGluZGVudGVkIGJhc2VkIG9uIHRoZSBzb2Z0IHRhYnMgYW5kXG4gICMgdGFiIGxlbmd0aCBzZXR0aW5ncyBvZiB0aGlzIGVkaXRvci4gTm90ZSB0aGF0IGlmIHNvZnQgdGFicyBhcmUgZW5hYmxlZCBhbmRcbiAgIyB0aGUgdGFiIGxlbmd0aCBpcyAyLCBhIHJvdyB3aXRoIDQgbGVhZGluZyBzcGFjZXMgd291bGQgaGF2ZSBhbiBpbmRlbnRhdGlvblxuICAjIGxldmVsIG9mIDIuXG4gICNcbiAgIyAqIGBsaW5lYCBBIHtTdHJpbmd9IHJlcHJlc2VudGluZyBhIGxpbmUgb2YgdGV4dC5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgaW5kZW50TGV2ZWxGb3JMaW5lOiAobGluZSkgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLmluZGVudExldmVsRm9yTGluZShsaW5lKVxuXG4gICMgRXh0ZW5kZWQ6IEluZGVudCByb3dzIGludGVyc2VjdGluZyBzZWxlY3Rpb25zIGJhc2VkIG9uIHRoZSBncmFtbWFyJ3Mgc3VnZ2VzdGVkXG4gICMgaW5kZW50IGxldmVsLlxuICBhdXRvSW5kZW50U2VsZWN0ZWRSb3dzOiAtPlxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmF1dG9JbmRlbnRTZWxlY3RlZFJvd3MoKVxuXG4gICMgSW5kZW50IGFsbCBsaW5lcyBpbnRlcnNlY3Rpbmcgc2VsZWN0aW9ucy4gU2VlIHtTZWxlY3Rpb246OmluZGVudH0gZm9yIG1vcmVcbiAgIyBpbmZvcm1hdGlvbi5cbiAgaW5kZW50OiAob3B0aW9ucz17fSkgLT5cbiAgICBvcHRpb25zLmF1dG9JbmRlbnQgPz0gQHNob3VsZEF1dG9JbmRlbnQoKVxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmluZGVudChvcHRpb25zKVxuXG4gICMgQ29uc3RydWN0cyB0aGUgc3RyaW5nIHVzZWQgZm9yIGluZGVudHMuXG4gIGJ1aWxkSW5kZW50U3RyaW5nOiAobGV2ZWwsIGNvbHVtbj0wKSAtPlxuICAgIGlmIEBnZXRTb2Z0VGFicygpXG4gICAgICB0YWJTdG9wVmlvbGF0aW9uID0gY29sdW1uICUgQGdldFRhYkxlbmd0aCgpXG4gICAgICBfLm11bHRpcGx5U3RyaW5nKFwiIFwiLCBNYXRoLmZsb29yKGxldmVsICogQGdldFRhYkxlbmd0aCgpKSAtIHRhYlN0b3BWaW9sYXRpb24pXG4gICAgZWxzZVxuICAgICAgZXhjZXNzV2hpdGVzcGFjZSA9IF8ubXVsdGlwbHlTdHJpbmcoJyAnLCBNYXRoLnJvdW5kKChsZXZlbCAtIE1hdGguZmxvb3IobGV2ZWwpKSAqIEBnZXRUYWJMZW5ndGgoKSkpXG4gICAgICBfLm11bHRpcGx5U3RyaW5nKFwiXFx0XCIsIE1hdGguZmxvb3IobGV2ZWwpKSArIGV4Y2Vzc1doaXRlc3BhY2VcblxuICAjIyNcbiAgU2VjdGlvbjogR3JhbW1hcnNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgY3VycmVudCB7R3JhbW1hcn0gb2YgdGhpcyBlZGl0b3IuXG4gIGdldEdyYW1tYXI6IC0+XG4gICAgQHRva2VuaXplZEJ1ZmZlci5ncmFtbWFyXG5cbiAgIyBFc3NlbnRpYWw6IFNldCB0aGUgY3VycmVudCB7R3JhbW1hcn0gb2YgdGhpcyBlZGl0b3IuXG4gICNcbiAgIyBBc3NpZ25pbmcgYSBncmFtbWFyIHdpbGwgY2F1c2UgdGhlIGVkaXRvciB0byByZS10b2tlbml6ZSBiYXNlZCBvbiB0aGUgbmV3XG4gICMgZ3JhbW1hci5cbiAgI1xuICAjICogYGdyYW1tYXJgIHtHcmFtbWFyfVxuICBzZXRHcmFtbWFyOiAoZ3JhbW1hcikgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLnNldEdyYW1tYXIoZ3JhbW1hcilcblxuICAjIFJlbG9hZCB0aGUgZ3JhbW1hciBiYXNlZCBvbiB0aGUgZmlsZSBuYW1lLlxuICByZWxvYWRHcmFtbWFyOiAtPlxuICAgIEB0b2tlbml6ZWRCdWZmZXIucmVsb2FkR3JhbW1hcigpXG5cbiAgIyBFeHBlcmltZW50YWw6IEdldCBhIG5vdGlmaWNhdGlvbiB3aGVuIGFzeW5jIHRva2VuaXphdGlvbiBpcyBjb21wbGV0ZWQuXG4gIG9uRGlkVG9rZW5pemU6IChjYWxsYmFjaykgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLm9uRGlkVG9rZW5pemUoY2FsbGJhY2spXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1hbmFnaW5nIFN5bnRheCBTY29wZXNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMgYSB7U2NvcGVEZXNjcmlwdG9yfSB0aGF0IGluY2x1ZGVzIHRoaXMgZWRpdG9yJ3MgbGFuZ3VhZ2UuXG4gICMgZS5nLiBgWycuc291cmNlLnJ1YnknXWAsIG9yIGBbJy5zb3VyY2UuY29mZmVlJ11gLiBZb3UgY2FuIHVzZSB0aGlzIHdpdGhcbiAgIyB7Q29uZmlnOjpnZXR9IHRvIGdldCBsYW5ndWFnZSBzcGVjaWZpYyBjb25maWcgdmFsdWVzLlxuICBnZXRSb290U2NvcGVEZXNjcmlwdG9yOiAtPlxuICAgIEB0b2tlbml6ZWRCdWZmZXIucm9vdFNjb3BlRGVzY3JpcHRvclxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhlIHN5bnRhY3RpYyBzY29wZURlc2NyaXB0b3IgZm9yIHRoZSBnaXZlbiBwb3NpdGlvbiBpbiBidWZmZXJcbiAgIyBjb29yZGluYXRlcy4gVXNlZnVsIHdpdGgge0NvbmZpZzo6Z2V0fS5cbiAgI1xuICAjIEZvciBleGFtcGxlLCBpZiBjYWxsZWQgd2l0aCBhIHBvc2l0aW9uIGluc2lkZSB0aGUgcGFyYW1ldGVyIGxpc3Qgb2YgYW5cbiAgIyBhbm9ueW1vdXMgQ29mZmVlU2NyaXB0IGZ1bmN0aW9uLCB0aGUgbWV0aG9kIHJldHVybnMgdGhlIGZvbGxvd2luZyBhcnJheTpcbiAgIyBgW1wic291cmNlLmNvZmZlZVwiLCBcIm1ldGEuaW5saW5lLmZ1bmN0aW9uLmNvZmZlZVwiLCBcInZhcmlhYmxlLnBhcmFtZXRlci5mdW5jdGlvbi5jb2ZmZWVcIl1gXG4gICNcbiAgIyAqIGBidWZmZXJQb3NpdGlvbmAgQSB7UG9pbnR9IG9yIHtBcnJheX0gb2YgW3JvdywgY29sdW1uXS5cbiAgI1xuICAjIFJldHVybnMgYSB7U2NvcGVEZXNjcmlwdG9yfS5cbiAgc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb246IChidWZmZXJQb3NpdGlvbikgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLnNjb3BlRGVzY3JpcHRvckZvclBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUgcmFuZ2UgaW4gYnVmZmVyIGNvb3JkaW5hdGVzIG9mIGFsbCB0b2tlbnMgc3Vycm91bmRpbmcgdGhlXG4gICMgY3Vyc29yIHRoYXQgbWF0Y2ggdGhlIGdpdmVuIHNjb3BlIHNlbGVjdG9yLlxuICAjXG4gICMgRm9yIGV4YW1wbGUsIGlmIHlvdSB3YW50ZWQgdG8gZmluZCB0aGUgc3RyaW5nIHN1cnJvdW5kaW5nIHRoZSBjdXJzb3IsIHlvdVxuICAjIGNvdWxkIGNhbGwgYGVkaXRvci5idWZmZXJSYW5nZUZvclNjb3BlQXRDdXJzb3IoXCIuc3RyaW5nLnF1b3RlZFwiKWAuXG4gICNcbiAgIyAqIGBzY29wZVNlbGVjdG9yYCB7U3RyaW5nfSBzZWxlY3Rvci4gZS5nLiBgJy5zb3VyY2UucnVieSdgXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfS5cbiAgYnVmZmVyUmFuZ2VGb3JTY29wZUF0Q3Vyc29yOiAoc2NvcGVTZWxlY3RvcikgLT5cbiAgICBAYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb24oc2NvcGVTZWxlY3RvciwgQGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb246IChzY29wZVNlbGVjdG9yLCBwb3NpdGlvbikgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLmJ1ZmZlclJhbmdlRm9yU2NvcGVBdFBvc2l0aW9uKHNjb3BlU2VsZWN0b3IsIHBvc2l0aW9uKVxuXG4gICMgRXh0ZW5kZWQ6IERldGVybWluZSBpZiB0aGUgZ2l2ZW4gcm93IGlzIGVudGlyZWx5IGEgY29tbWVudFxuICBpc0J1ZmZlclJvd0NvbW1lbnRlZDogKGJ1ZmZlclJvdykgLT5cbiAgICBpZiBtYXRjaCA9IEBsaW5lVGV4dEZvckJ1ZmZlclJvdyhidWZmZXJSb3cpLm1hdGNoKC9cXFMvKVxuICAgICAgQGNvbW1lbnRTY29wZVNlbGVjdG9yID89IG5ldyBUZXh0TWF0ZVNjb3BlU2VsZWN0b3IoJ2NvbW1lbnQuKicpXG4gICAgICBAY29tbWVudFNjb3BlU2VsZWN0b3IubWF0Y2hlcyhAc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgbWF0Y2guaW5kZXhdKS5zY29wZXMpXG5cbiAgIyBHZXQgdGhlIHNjb3BlIGRlc2NyaXB0b3IgYXQgdGhlIGN1cnNvci5cbiAgZ2V0Q3Vyc29yU2NvcGU6IC0+XG4gICAgQGdldExhc3RDdXJzb3IoKS5nZXRTY29wZURlc2NyaXB0b3IoKVxuXG4gIHRva2VuRm9yQnVmZmVyUG9zaXRpb246IChidWZmZXJQb3NpdGlvbikgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLnRva2VuRm9yUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG5cbiAgIyMjXG4gIFNlY3Rpb246IENsaXBib2FyZCBPcGVyYXRpb25zXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBGb3IgZWFjaCBzZWxlY3Rpb24sIGNvcHkgdGhlIHNlbGVjdGVkIHRleHQuXG4gIGNvcHlTZWxlY3RlZFRleHQ6IC0+XG4gICAgbWFpbnRhaW5DbGlwYm9hcmQgPSBmYWxzZVxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICAgIHByZXZpb3VzUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBzZWxlY3Rpb24uc2VsZWN0TGluZSgpXG4gICAgICAgIHNlbGVjdGlvbi5jb3B5KG1haW50YWluQ2xpcGJvYXJkLCB0cnVlKVxuICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UocHJldmlvdXNSYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0aW9uLmNvcHkobWFpbnRhaW5DbGlwYm9hcmQsIGZhbHNlKVxuICAgICAgbWFpbnRhaW5DbGlwYm9hcmQgPSB0cnVlXG4gICAgcmV0dXJuXG5cbiAgIyBQcml2YXRlOiBGb3IgZWFjaCBzZWxlY3Rpb24sIG9ubHkgY29weSBoaWdobGlnaHRlZCB0ZXh0LlxuICBjb3B5T25seVNlbGVjdGVkVGV4dDogLT5cbiAgICBtYWludGFpbkNsaXBib2FyZCA9IGZhbHNlXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICAgIHNlbGVjdGlvbi5jb3B5KG1haW50YWluQ2xpcGJvYXJkLCBmYWxzZSlcbiAgICAgICAgbWFpbnRhaW5DbGlwYm9hcmQgPSB0cnVlXG4gICAgcmV0dXJuXG5cbiAgIyBFc3NlbnRpYWw6IEZvciBlYWNoIHNlbGVjdGlvbiwgY3V0IHRoZSBzZWxlY3RlZCB0ZXh0LlxuICBjdXRTZWxlY3RlZFRleHQ6IC0+XG4gICAgbWFpbnRhaW5DbGlwYm9hcmQgPSBmYWxzZVxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdExpbmUoKVxuICAgICAgICBzZWxlY3Rpb24uY3V0KG1haW50YWluQ2xpcGJvYXJkLCB0cnVlKVxuICAgICAgZWxzZVxuICAgICAgICBzZWxlY3Rpb24uY3V0KG1haW50YWluQ2xpcGJvYXJkLCBmYWxzZSlcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gICMgRXNzZW50aWFsOiBGb3IgZWFjaCBzZWxlY3Rpb24sIHJlcGxhY2UgdGhlIHNlbGVjdGVkIHRleHQgd2l0aCB0aGUgY29udGVudHMgb2ZcbiAgIyB0aGUgY2xpcGJvYXJkLlxuICAjXG4gICMgSWYgdGhlIGNsaXBib2FyZCBjb250YWlucyB0aGUgc2FtZSBudW1iZXIgb2Ygc2VsZWN0aW9ucyBhcyB0aGUgY3VycmVudFxuICAjIGVkaXRvciwgZWFjaCBzZWxlY3Rpb24gd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZVxuICAjIGNvcnJlc3BvbmRpbmcgY2xpcGJvYXJkIHNlbGVjdGlvbiB0ZXh0LlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBTZWUge1NlbGVjdGlvbjo6aW5zZXJ0VGV4dH0uXG4gIHBhc3RlVGV4dDogKG9wdGlvbnM9e30pIC0+XG4gICAge3RleHQ6IGNsaXBib2FyZFRleHQsIG1ldGFkYXRhfSA9IEBjb25zdHJ1Y3Rvci5jbGlwYm9hcmQucmVhZFdpdGhNZXRhZGF0YSgpXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAZW1pdFdpbGxJbnNlcnRUZXh0RXZlbnQoY2xpcGJvYXJkVGV4dClcblxuICAgIG1ldGFkYXRhID89IHt9XG4gICAgb3B0aW9ucy5hdXRvSW5kZW50ID0gQHNob3VsZEF1dG9JbmRlbnRPblBhc3RlKClcblxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbiwgaW5kZXgpID0+XG4gICAgICBpZiBtZXRhZGF0YS5zZWxlY3Rpb25zPy5sZW5ndGggaXMgQGdldFNlbGVjdGlvbnMoKS5sZW5ndGhcbiAgICAgICAge3RleHQsIGluZGVudEJhc2lzLCBmdWxsTGluZX0gPSBtZXRhZGF0YS5zZWxlY3Rpb25zW2luZGV4XVxuICAgICAgZWxzZVxuICAgICAgICB7aW5kZW50QmFzaXMsIGZ1bGxMaW5lfSA9IG1ldGFkYXRhXG4gICAgICAgIHRleHQgPSBjbGlwYm9hcmRUZXh0XG5cbiAgICAgIGRlbGV0ZSBvcHRpb25zLmluZGVudEJhc2lzXG4gICAgICB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgICAgaWYgaW5kZW50QmFzaXM/XG4gICAgICAgIGNvbnRhaW5zTmV3bGluZXMgPSB0ZXh0LmluZGV4T2YoJ1xcbicpIGlzbnQgLTFcbiAgICAgICAgaWYgY29udGFpbnNOZXdsaW5lcyBvciBub3QgY3Vyc29yLmhhc1ByZWNlZGluZ0NoYXJhY3RlcnNPbkxpbmUoKVxuICAgICAgICAgIG9wdGlvbnMuaW5kZW50QmFzaXMgPz0gaW5kZW50QmFzaXNcblxuICAgICAgcmFuZ2UgPSBudWxsXG4gICAgICBpZiBmdWxsTGluZSBhbmQgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgICBvbGRQb3NpdGlvbiA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbW29sZFBvc2l0aW9uLnJvdywgMF0sIFtvbGRQb3NpdGlvbi5yb3csIDBdXSlcbiAgICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBvcHRpb25zKVxuICAgICAgICBuZXdQb3NpdGlvbiA9IG9sZFBvc2l0aW9uLnRyYW5zbGF0ZShbMSwgMF0pXG4gICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbbmV3UG9zaXRpb24sIG5ld1Bvc2l0aW9uXSlcbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBvcHRpb25zKVxuXG4gICAgICBkaWRJbnNlcnRFdmVudCA9IHt0ZXh0LCByYW5nZX1cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1pbnNlcnQtdGV4dCcsIGRpZEluc2VydEV2ZW50XG5cbiAgIyBFc3NlbnRpYWw6IEZvciBlYWNoIHNlbGVjdGlvbiwgaWYgdGhlIHNlbGVjdGlvbiBpcyBlbXB0eSwgY3V0IGFsbCBjaGFyYWN0ZXJzXG4gICMgb2YgdGhlIGNvbnRhaW5pbmcgc2NyZWVuIGxpbmUgZm9sbG93aW5nIHRoZSBjdXJzb3IuIE90aGVyd2lzZSBjdXQgdGhlIHNlbGVjdGVkXG4gICMgdGV4dC5cbiAgY3V0VG9FbmRPZkxpbmU6IC0+XG4gICAgbWFpbnRhaW5DbGlwYm9hcmQgPSBmYWxzZVxuICAgIEBtdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5jdXRUb0VuZE9mTGluZShtYWludGFpbkNsaXBib2FyZClcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gICMgRXNzZW50aWFsOiBGb3IgZWFjaCBzZWxlY3Rpb24sIGlmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHksIGN1dCBhbGwgY2hhcmFjdGVyc1xuICAjIG9mIHRoZSBjb250YWluaW5nIGJ1ZmZlciBsaW5lIGZvbGxvd2luZyB0aGUgY3Vyc29yLiBPdGhlcndpc2UgY3V0IHRoZVxuICAjIHNlbGVjdGVkIHRleHQuXG4gIGN1dFRvRW5kT2ZCdWZmZXJMaW5lOiAtPlxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gZmFsc2VcbiAgICBAbXV0YXRlU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pIC0+XG4gICAgICBzZWxlY3Rpb24uY3V0VG9FbmRPZkJ1ZmZlckxpbmUobWFpbnRhaW5DbGlwYm9hcmQpXG4gICAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcblxuICAjIyNcbiAgU2VjdGlvbjogRm9sZHNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEZvbGQgdGhlIG1vc3QgcmVjZW50IGN1cnNvcidzIHJvdyBiYXNlZCBvbiBpdHMgaW5kZW50YXRpb24gbGV2ZWwuXG4gICNcbiAgIyBUaGUgZm9sZCB3aWxsIGV4dGVuZCBmcm9tIHRoZSBuZWFyZXN0IHByZWNlZGluZyBsaW5lIHdpdGggYSBsb3dlclxuICAjIGluZGVudGF0aW9uIGxldmVsIHVwIHRvIHRoZSBuZWFyZXN0IGZvbGxvd2luZyByb3cgd2l0aCBhIGxvd2VyIGluZGVudGF0aW9uXG4gICMgbGV2ZWwuXG4gIGZvbGRDdXJyZW50Um93OiAtPlxuICAgIGJ1ZmZlclJvdyA9IEBidWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKEBnZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpKS5yb3dcbiAgICBAZm9sZEJ1ZmZlclJvdyhidWZmZXJSb3cpXG5cbiAgIyBFc3NlbnRpYWw6IFVuZm9sZCB0aGUgbW9zdCByZWNlbnQgY3Vyc29yJ3Mgcm93IGJ5IG9uZSBsZXZlbC5cbiAgdW5mb2xkQ3VycmVudFJvdzogLT5cbiAgICBidWZmZXJSb3cgPSBAYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihAZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKSkucm93XG4gICAgQHVuZm9sZEJ1ZmZlclJvdyhidWZmZXJSb3cpXG5cbiAgIyBFc3NlbnRpYWw6IEZvbGQgdGhlIGdpdmVuIHJvdyBpbiBidWZmZXIgY29vcmRpbmF0ZXMgYmFzZWQgb24gaXRzIGluZGVudGF0aW9uXG4gICMgbGV2ZWwuXG4gICNcbiAgIyBJZiB0aGUgZ2l2ZW4gcm93IGlzIGZvbGRhYmxlLCB0aGUgZm9sZCB3aWxsIGJlZ2luIHRoZXJlLiBPdGhlcndpc2UsIGl0IHdpbGxcbiAgIyBiZWdpbiBhdCB0aGUgZmlyc3QgZm9sZGFibGUgcm93IHByZWNlZGluZyB0aGUgZ2l2ZW4gcm93LlxuICAjXG4gICMgKiBgYnVmZmVyUm93YCBBIHtOdW1iZXJ9LlxuICBmb2xkQnVmZmVyUm93OiAoYnVmZmVyUm93KSAtPlxuICAgIEBsYW5ndWFnZU1vZGUuZm9sZEJ1ZmZlclJvdyhidWZmZXJSb3cpXG5cbiAgIyBFc3NlbnRpYWw6IFVuZm9sZCBhbGwgZm9sZHMgY29udGFpbmluZyB0aGUgZ2l2ZW4gcm93IGluIGJ1ZmZlciBjb29yZGluYXRlcy5cbiAgI1xuICAjICogYGJ1ZmZlclJvd2AgQSB7TnVtYmVyfVxuICB1bmZvbGRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgQGRpc3BsYXlMYXllci5kZXN0cm95Rm9sZHNJbnRlcnNlY3RpbmdCdWZmZXJSYW5nZShSYW5nZShQb2ludChidWZmZXJSb3csIDApLCBQb2ludChidWZmZXJSb3csIEluZmluaXR5KSkpXG5cbiAgIyBFeHRlbmRlZDogRm9yIGVhY2ggc2VsZWN0aW9uLCBmb2xkIHRoZSByb3dzIGl0IGludGVyc2VjdHMuXG4gIGZvbGRTZWxlY3RlZExpbmVzOiAtPlxuICAgIHNlbGVjdGlvbi5mb2xkKCkgZm9yIHNlbGVjdGlvbiBpbiBAZ2V0U2VsZWN0aW9ucygpXG4gICAgcmV0dXJuXG5cbiAgIyBFeHRlbmRlZDogRm9sZCBhbGwgZm9sZGFibGUgbGluZXMuXG4gIGZvbGRBbGw6IC0+XG4gICAgQGxhbmd1YWdlTW9kZS5mb2xkQWxsKClcblxuICAjIEV4dGVuZGVkOiBVbmZvbGQgYWxsIGV4aXN0aW5nIGZvbGRzLlxuICB1bmZvbGRBbGw6IC0+XG4gICAgQGxhbmd1YWdlTW9kZS51bmZvbGRBbGwoKVxuICAgIEBzY3JvbGxUb0N1cnNvclBvc2l0aW9uKClcblxuICAjIEV4dGVuZGVkOiBGb2xkIGFsbCBmb2xkYWJsZSBsaW5lcyBhdCB0aGUgZ2l2ZW4gaW5kZW50IGxldmVsLlxuICAjXG4gICMgKiBgbGV2ZWxgIEEge051bWJlcn0uXG4gIGZvbGRBbGxBdEluZGVudExldmVsOiAobGV2ZWwpIC0+XG4gICAgQGxhbmd1YWdlTW9kZS5mb2xkQWxsQXRJbmRlbnRMZXZlbChsZXZlbClcblxuICAjIEV4dGVuZGVkOiBEZXRlcm1pbmUgd2hldGhlciB0aGUgZ2l2ZW4gcm93IGluIGJ1ZmZlciBjb29yZGluYXRlcyBpcyBmb2xkYWJsZS5cbiAgI1xuICAjIEEgKmZvbGRhYmxlKiByb3cgaXMgYSByb3cgdGhhdCAqc3RhcnRzKiBhIHJvdyByYW5nZSB0aGF0IGNhbiBiZSBmb2xkZWQuXG4gICNcbiAgIyAqIGBidWZmZXJSb3dgIEEge051bWJlcn1cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzRm9sZGFibGVBdEJ1ZmZlclJvdzogKGJ1ZmZlclJvdykgLT5cbiAgICBAdG9rZW5pemVkQnVmZmVyLmlzRm9sZGFibGVBdFJvdyhidWZmZXJSb3cpXG5cbiAgIyBFeHRlbmRlZDogRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGdpdmVuIHJvdyBpbiBzY3JlZW4gY29vcmRpbmF0ZXMgaXMgZm9sZGFibGUuXG4gICNcbiAgIyBBICpmb2xkYWJsZSogcm93IGlzIGEgcm93IHRoYXQgKnN0YXJ0cyogYSByb3cgcmFuZ2UgdGhhdCBjYW4gYmUgZm9sZGVkLlxuICAjXG4gICMgKiBgYnVmZmVyUm93YCBBIHtOdW1iZXJ9XG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc0ZvbGRhYmxlQXRTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgQGlzRm9sZGFibGVBdEJ1ZmZlclJvdyhAYnVmZmVyUm93Rm9yU2NyZWVuUm93KHNjcmVlblJvdykpXG5cbiAgIyBFeHRlbmRlZDogRm9sZCB0aGUgZ2l2ZW4gYnVmZmVyIHJvdyBpZiBpdCBpc24ndCBjdXJyZW50bHkgZm9sZGVkLCBhbmQgdW5mb2xkXG4gICMgaXQgb3RoZXJ3aXNlLlxuICB0b2dnbGVGb2xkQXRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgaWYgQGlzRm9sZGVkQXRCdWZmZXJSb3coYnVmZmVyUm93KVxuICAgICAgQHVuZm9sZEJ1ZmZlclJvdyhidWZmZXJSb3cpXG4gICAgZWxzZVxuICAgICAgQGZvbGRCdWZmZXJSb3coYnVmZmVyUm93KVxuXG4gICMgRXh0ZW5kZWQ6IERldGVybWluZSB3aGV0aGVyIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIGN1cnNvcidzIHJvdyBpcyBmb2xkZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc0ZvbGRlZEF0Q3Vyc29yUm93OiAtPlxuICAgIEBpc0ZvbGRlZEF0U2NyZWVuUm93KEBnZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpLnJvdylcblxuICAjIEV4dGVuZGVkOiBEZXRlcm1pbmUgd2hldGhlciB0aGUgZ2l2ZW4gcm93IGluIGJ1ZmZlciBjb29yZGluYXRlcyBpcyBmb2xkZWQuXG4gICNcbiAgIyAqIGBidWZmZXJSb3dgIEEge051bWJlcn1cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzRm9sZGVkQXRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgQGRpc3BsYXlMYXllci5mb2xkc0ludGVyc2VjdGluZ0J1ZmZlclJhbmdlKFJhbmdlKFBvaW50KGJ1ZmZlclJvdywgMCksIFBvaW50KGJ1ZmZlclJvdywgSW5maW5pdHkpKSkubGVuZ3RoID4gMFxuXG4gICMgRXh0ZW5kZWQ6IERldGVybWluZSB3aGV0aGVyIHRoZSBnaXZlbiByb3cgaW4gc2NyZWVuIGNvb3JkaW5hdGVzIGlzIGZvbGRlZC5cbiAgI1xuICAjICogYHNjcmVlblJvd2AgQSB7TnVtYmVyfVxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgaXNGb2xkZWRBdFNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAaXNGb2xkZWRBdEJ1ZmZlclJvdyhAYnVmZmVyUm93Rm9yU2NyZWVuUm93KHNjcmVlblJvdykpXG5cbiAgIyBDcmVhdGVzIGEgbmV3IGZvbGQgYmV0d2VlbiB0d28gcm93IG51bWJlcnMuXG4gICNcbiAgIyBzdGFydFJvdyAtIFRoZSByb3cge051bWJlcn0gdG8gc3RhcnQgZm9sZGluZyBhdFxuICAjIGVuZFJvdyAtIFRoZSByb3cge051bWJlcn0gdG8gZW5kIHRoZSBmb2xkXG4gICNcbiAgIyBSZXR1cm5zIHRoZSBuZXcge0ZvbGR9LlxuICBmb2xkQnVmZmVyUm93UmFuZ2U6IChzdGFydFJvdywgZW5kUm93KSAtPlxuICAgIEBmb2xkQnVmZmVyUmFuZ2UoUmFuZ2UoUG9pbnQoc3RhcnRSb3csIEluZmluaXR5KSwgUG9pbnQoZW5kUm93LCBJbmZpbml0eSkpKVxuXG4gIGZvbGRCdWZmZXJSYW5nZTogKHJhbmdlKSAtPlxuICAgIEBkaXNwbGF5TGF5ZXIuZm9sZEJ1ZmZlclJhbmdlKHJhbmdlKVxuXG4gICMgUmVtb3ZlIGFueSB7Rm9sZH1zIGZvdW5kIHRoYXQgaW50ZXJzZWN0IHRoZSBnaXZlbiBidWZmZXIgcmFuZ2UuXG4gIGRlc3Ryb3lGb2xkc0ludGVyc2VjdGluZ0J1ZmZlclJhbmdlOiAoYnVmZmVyUmFuZ2UpIC0+XG4gICAgQGRpc3BsYXlMYXllci5kZXN0cm95Rm9sZHNJbnRlcnNlY3RpbmdCdWZmZXJSYW5nZShidWZmZXJSYW5nZSlcblxuICAjIyNcbiAgU2VjdGlvbjogR3V0dGVyc1xuICAjIyNcblxuICAjIEVzc2VudGlhbDogQWRkIGEgY3VzdG9tIHtHdXR0ZXJ9LlxuICAjXG4gICMgKiBgb3B0aW9uc2AgQW4ge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpcbiAgIyAgICogYG5hbWVgIChyZXF1aXJlZCkgQSB1bmlxdWUge1N0cmluZ30gdG8gaWRlbnRpZnkgdGhpcyBndXR0ZXIuXG4gICMgICAqIGBwcmlvcml0eWAgKG9wdGlvbmFsKSBBIHtOdW1iZXJ9IHRoYXQgZGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlciBiZXR3ZWVuXG4gICMgICAgICAgZ3V0dGVycy4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZVxuICAjICAgICAgIHdpbmRvdy4gKGRlZmF1bHQ6IC0xMDApXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBzcGVjaWZ5aW5nIHdoZXRoZXIgdGhlIGd1dHRlciBpcyB2aXNpYmxlXG4gICMgICAgICAgaW5pdGlhbGx5IGFmdGVyIGJlaW5nIGNyZWF0ZWQuIChkZWZhdWx0OiB0cnVlKVxuICAjXG4gICMgUmV0dXJucyB0aGUgbmV3bHktY3JlYXRlZCB7R3V0dGVyfS5cbiAgYWRkR3V0dGVyOiAob3B0aW9ucykgLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyLmFkZEd1dHRlcihvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhpcyBlZGl0b3IncyBndXR0ZXJzLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtHdXR0ZXJ9cy5cbiAgZ2V0R3V0dGVyczogLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyLmdldEd1dHRlcnMoKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhlIGd1dHRlciB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtHdXR0ZXJ9LCBvciBgbnVsbGAgaWYgbm8gZ3V0dGVyIGV4aXN0cyBmb3IgdGhlIGdpdmVuIG5hbWUuXG4gIGd1dHRlcldpdGhOYW1lOiAobmFtZSkgLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyLmd1dHRlcldpdGhOYW1lKG5hbWUpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFNjcm9sbGluZyB0aGUgVGV4dEVkaXRvclxuICAjIyNcblxuICAjIEVzc2VudGlhbDogU2Nyb2xsIHRoZSBlZGl0b3IgdG8gcmV2ZWFsIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIGN1cnNvciBpZiBpdCBpc1xuICAjIG9mZi1zY3JlZW4uXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBjZW50ZXJgIENlbnRlciB0aGUgZWRpdG9yIGFyb3VuZCB0aGUgY3Vyc29yIGlmIHBvc3NpYmxlLiAoZGVmYXVsdDogdHJ1ZSlcbiAgc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbjogKG9wdGlvbnMpIC0+XG4gICAgQGdldExhc3RDdXJzb3IoKS5hdXRvc2Nyb2xsKGNlbnRlcjogb3B0aW9ucz8uY2VudGVyID8gdHJ1ZSlcblxuICAjIEVzc2VudGlhbDogU2Nyb2xscyB0aGUgZWRpdG9yIHRvIHRoZSBnaXZlbiBidWZmZXIgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBidWZmZXJQb3NpdGlvbmAgQW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGJ1ZmZlciBwb3NpdGlvbi4gSXQgY2FuIGJlIGVpdGhlclxuICAjICAgYW4ge09iamVjdH0gKGB7cm93LCBjb2x1bW59YCksIHtBcnJheX0gKGBbcm93LCBjb2x1bW5dYCksIG9yIHtQb2ludH1cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBjZW50ZXJgIENlbnRlciB0aGUgZWRpdG9yIGFyb3VuZCB0aGUgcG9zaXRpb24gaWYgcG9zc2libGUuIChkZWZhdWx0OiBmYWxzZSlcbiAgc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbjogKGJ1ZmZlclBvc2l0aW9uLCBvcHRpb25zKSAtPlxuICAgIEBzY3JvbGxUb1NjcmVlblBvc2l0aW9uKEBzY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKSwgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogU2Nyb2xscyB0aGUgZWRpdG9yIHRvIHRoZSBnaXZlbiBzY3JlZW4gcG9zaXRpb24uXG4gICNcbiAgIyAqIGBzY3JlZW5Qb3NpdGlvbmAgQW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIHNjcmVlbiBwb3NpdGlvbi4gSXQgY2FuIGJlIGVpdGhlclxuICAjICAgIGFuIHtPYmplY3R9IChge3JvdywgY29sdW1ufWApLCB7QXJyYXl9IChgW3JvdywgY29sdW1uXWApLCBvciB7UG9pbnR9XG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fVxuICAjICAgKiBgY2VudGVyYCBDZW50ZXIgdGhlIGVkaXRvciBhcm91bmQgdGhlIHBvc2l0aW9uIGlmIHBvc3NpYmxlLiAoZGVmYXVsdDogZmFsc2UpXG4gIHNjcm9sbFRvU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbiwgb3B0aW9ucykgLT5cbiAgICBAc2Nyb2xsVG9TY3JlZW5SYW5nZShuZXcgUmFuZ2Uoc2NyZWVuUG9zaXRpb24sIHNjcmVlblBvc2l0aW9uKSwgb3B0aW9ucylcblxuICBzY3JvbGxUb1RvcDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNjcm9sbFRvVG9wIGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLnNjcm9sbFRvVG9wKClcblxuICBzY3JvbGxUb0JvdHRvbTogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNjcm9sbFRvVG9wIGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLnNjcm9sbFRvQm90dG9tKClcblxuICBzY3JvbGxUb1NjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICBzY3JvbGxFdmVudCA9IHtzY3JlZW5SYW5nZSwgb3B0aW9uc31cbiAgICBAZW1pdHRlci5lbWl0IFwiZGlkLXJlcXVlc3QtYXV0b3Njcm9sbFwiLCBzY3JvbGxFdmVudFxuXG4gIGdldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQ6IC0+XG4gICAgR3JpbS5kZXByZWNhdGUoXCJUaGlzIGlzIG5vdyBhIHZpZXcgbWV0aG9kLiBDYWxsIFRleHRFZGl0b3JFbGVtZW50OjpnZXRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0IGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLmdldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQoKVxuXG4gIGdldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6IC0+XG4gICAgR3JpbS5kZXByZWNhdGUoXCJUaGlzIGlzIG5vdyBhIHZpZXcgbWV0aG9kLiBDYWxsIFRleHRFZGl0b3JFbGVtZW50OjpnZXRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoIGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLmdldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGgoKVxuXG4gIHBhZ2VVcDogLT5cbiAgICBAbW92ZVVwKEBnZXRSb3dzUGVyUGFnZSgpKVxuXG4gIHBhZ2VEb3duOiAtPlxuICAgIEBtb3ZlRG93bihAZ2V0Um93c1BlclBhZ2UoKSlcblxuICBzZWxlY3RQYWdlVXA6IC0+XG4gICAgQHNlbGVjdFVwKEBnZXRSb3dzUGVyUGFnZSgpKVxuXG4gIHNlbGVjdFBhZ2VEb3duOiAtPlxuICAgIEBzZWxlY3REb3duKEBnZXRSb3dzUGVyUGFnZSgpKVxuXG4gICMgUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJvd3MgcGVyIHBhZ2VcbiAgZ2V0Um93c1BlclBhZ2U6IC0+XG4gICAgTWF0aC5tYXgoQHJvd3NQZXJQYWdlID8gMSwgMSlcblxuICBzZXRSb3dzUGVyUGFnZTogKEByb3dzUGVyUGFnZSkgLT5cblxuICAjIyNcbiAgU2VjdGlvbjogQ29uZmlnXG4gICMjI1xuXG4gICMgRXhwZXJpbWVudGFsOiBTdXBwbHkgYW4gb2JqZWN0IHRoYXQgd2lsbCBwcm92aWRlIHRoZSBlZGl0b3Igd2l0aCBzZXR0aW5nc1xuICAjIGZvciBzcGVjaWZpYyBzeW50YWN0aWMgc2NvcGVzLiBTZWUgdGhlIGBTY29wZWRTZXR0aW5nc0RlbGVnYXRlYCBpblxuICAjIGB0ZXh0LWVkaXRvci1yZWdpc3RyeS5qc2AgZm9yIGFuIGV4YW1wbGUgaW1wbGVtZW50YXRpb24uXG4gIHNldFNjb3BlZFNldHRpbmdzRGVsZWdhdGU6IChAc2NvcGVkU2V0dGluZ3NEZWxlZ2F0ZSkgLT5cblxuICAjIEV4cGVyaW1lbnRhbDogUmV0cmlldmUgdGhlIHtPYmplY3R9IHRoYXQgcHJvdmlkZXMgdGhlIGVkaXRvciB3aXRoIHNldHRpbmdzXG4gICMgZm9yIHNwZWNpZmljIHN5bnRhY3RpYyBzY29wZXMuXG4gIGdldFNjb3BlZFNldHRpbmdzRGVsZWdhdGU6IC0+IEBzY29wZWRTZXR0aW5nc0RlbGVnYXRlXG5cbiAgIyBFeHBlcmltZW50YWw6IElzIGF1dG8taW5kZW50YXRpb24gZW5hYmxlZCBmb3IgdGhpcyBlZGl0b3I/XG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBzaG91bGRBdXRvSW5kZW50OiAtPiBAYXV0b0luZGVudFxuXG4gICMgRXhwZXJpbWVudGFsOiBJcyBhdXRvLWluZGVudGF0aW9uIG9uIHBhc3RlIGVuYWJsZWQgZm9yIHRoaXMgZWRpdG9yP1xuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgc2hvdWxkQXV0b0luZGVudE9uUGFzdGU6IC0+IEBhdXRvSW5kZW50T25QYXN0ZVxuXG4gICMgRXhwZXJpbWVudGFsOiBEb2VzIHRoaXMgZWRpdG9yIGFsbG93IHNjcm9sbGluZyBwYXN0IHRoZSBsYXN0IGxpbmU/XG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBnZXRTY3JvbGxQYXN0RW5kOiAtPiBAc2Nyb2xsUGFzdEVuZFxuXG4gICMgRXhwZXJpbWVudGFsOiBIb3cgZmFzdCBkb2VzIHRoZSBlZGl0b3Igc2Nyb2xsIGluIHJlc3BvbnNlIHRvIG1vdXNlIHdoZWVsXG4gICMgbW92ZW1lbnRzP1xuICAjXG4gICMgUmV0dXJucyBhIHBvc2l0aXZlIHtOdW1iZXJ9LlxuICBnZXRTY3JvbGxTZW5zaXRpdml0eTogLT4gQHNjcm9sbFNlbnNpdGl2aXR5XG5cbiAgIyBFeHBlcmltZW50YWw6IEFyZSBsaW5lIG51bWJlcnMgZW5hYmxlZCBmb3IgdGhpcyBlZGl0b3I/XG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59XG4gIGRvZXNTaG93TGluZU51bWJlcnM6IC0+IEBzaG93TGluZU51bWJlcnNcblxuICAjIEV4cGVyaW1lbnRhbDogR2V0IHRoZSB0aW1lIGludGVydmFsIHdpdGhpbiB3aGljaCB0ZXh0IGVkaXRpbmcgb3BlcmF0aW9uc1xuICAjIGFyZSBncm91cGVkIHRvZ2V0aGVyIGluIHRoZSBlZGl0b3IncyB1bmRvIGhpc3RvcnkuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSB0aW1lIGludGVydmFsIHtOdW1iZXJ9IGluIG1pbGxpc2Vjb25kcy5cbiAgZ2V0VW5kb0dyb3VwaW5nSW50ZXJ2YWw6IC0+IEB1bmRvR3JvdXBpbmdJbnRlcnZhbFxuXG4gICMgRXhwZXJpbWVudGFsOiBHZXQgdGhlIGNoYXJhY3RlcnMgdGhhdCBhcmUgKm5vdCogY29uc2lkZXJlZCBwYXJ0IG9mIHdvcmRzLFxuICAjIGZvciB0aGUgcHVycG9zZSBvZiB3b3JkLWJhc2VkIGN1cnNvciBtb3ZlbWVudHMuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30gY29udGFpbmluZyB0aGUgbm9uLXdvcmQgY2hhcmFjdGVycy5cbiAgZ2V0Tm9uV29yZENoYXJhY3RlcnM6IChzY29wZXMpIC0+XG4gICAgQHNjb3BlZFNldHRpbmdzRGVsZWdhdGU/LmdldE5vbldvcmRDaGFyYWN0ZXJzPyhzY29wZXMpID8gQG5vbldvcmRDaGFyYWN0ZXJzXG5cbiAgZ2V0Q29tbWVudFN0cmluZ3M6IChzY29wZXMpIC0+XG4gICAgQHNjb3BlZFNldHRpbmdzRGVsZWdhdGU/LmdldENvbW1lbnRTdHJpbmdzPyhzY29wZXMpXG5cbiAgZ2V0SW5jcmVhc2VJbmRlbnRQYXR0ZXJuOiAoc2NvcGVzKSAtPlxuICAgIEBzY29wZWRTZXR0aW5nc0RlbGVnYXRlPy5nZXRJbmNyZWFzZUluZGVudFBhdHRlcm4/KHNjb3BlcylcblxuICBnZXREZWNyZWFzZUluZGVudFBhdHRlcm46IChzY29wZXMpIC0+XG4gICAgQHNjb3BlZFNldHRpbmdzRGVsZWdhdGU/LmdldERlY3JlYXNlSW5kZW50UGF0dGVybj8oc2NvcGVzKVxuXG4gIGdldERlY3JlYXNlTmV4dEluZGVudFBhdHRlcm46IChzY29wZXMpIC0+XG4gICAgQHNjb3BlZFNldHRpbmdzRGVsZWdhdGU/LmdldERlY3JlYXNlTmV4dEluZGVudFBhdHRlcm4/KHNjb3BlcylcblxuICBnZXRGb2xkRW5kUGF0dGVybjogKHNjb3BlcykgLT5cbiAgICBAc2NvcGVkU2V0dGluZ3NEZWxlZ2F0ZT8uZ2V0Rm9sZEVuZFBhdHRlcm4/KHNjb3BlcylcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgSGFuZGxlcnNcbiAgIyMjXG5cbiAgaGFuZGxlR3JhbW1hckNoYW5nZTogLT5cbiAgICBAdW5mb2xkQWxsKClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLWdyYW1tYXInLCBAZ2V0R3JhbW1hcigpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFRleHRFZGl0b3IgUmVuZGVyaW5nXG4gICMjI1xuXG4gICMgR2V0IHRoZSBFbGVtZW50IGZvciB0aGUgZWRpdG9yLlxuICBnZXRFbGVtZW50OiAtPlxuICAgIEBlZGl0b3JFbGVtZW50ID89IG5ldyBUZXh0RWRpdG9yRWxlbWVudCgpLmluaXRpYWxpemUodGhpcywgYXRvbSlcblxuICAjIEVzc2VudGlhbDogUmV0cmlldmVzIHRoZSBncmV5ZWQgb3V0IHBsYWNlaG9sZGVyIG9mIGEgbWluaSBlZGl0b3IuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldFBsYWNlaG9sZGVyVGV4dDogLT4gQHBsYWNlaG9sZGVyVGV4dFxuXG4gICMgRXNzZW50aWFsOiBTZXQgdGhlIGdyZXllZCBvdXQgcGxhY2Vob2xkZXIgb2YgYSBtaW5pIGVkaXRvci4gUGxhY2Vob2xkZXIgdGV4dFxuICAjIHdpbGwgYmUgZGlzcGxheWVkIHdoZW4gdGhlIGVkaXRvciBoYXMgbm8gY29udGVudC5cbiAgI1xuICAjICogYHBsYWNlaG9sZGVyVGV4dGAge1N0cmluZ30gdGV4dCB0aGF0IGlzIGRpc3BsYXllZCB3aGVuIHRoZSBlZGl0b3IgaGFzIG5vIGNvbnRlbnQuXG4gIHNldFBsYWNlaG9sZGVyVGV4dDogKHBsYWNlaG9sZGVyVGV4dCkgLT4gQHVwZGF0ZSh7cGxhY2Vob2xkZXJUZXh0fSlcblxuICBwaXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb246IChidWZmZXJQb3NpdGlvbikgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgbWV0aG9kIGlzIGRlcHJlY2F0ZWQgb24gdGhlIG1vZGVsIGxheWVyLiBVc2UgYFRleHRFZGl0b3JFbGVtZW50OjpwaXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb25gIGluc3RlYWRcIilcbiAgICBAZ2V0RWxlbWVudCgpLnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihidWZmZXJQb3NpdGlvbilcblxuICBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbikgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgbWV0aG9kIGlzIGRlcHJlY2F0ZWQgb24gdGhlIG1vZGVsIGxheWVyLiBVc2UgYFRleHRFZGl0b3JFbGVtZW50OjpwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb25gIGluc3RlYWRcIilcbiAgICBAZ2V0RWxlbWVudCgpLnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcblxuICBnZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbjogLT5cbiAgICBtYXhTY3JvbGxNYXJnaW4gPSBNYXRoLmZsb29yKCgoQGhlaWdodCAvIEBnZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSkgLSAxKSAvIDIpXG4gICAgTWF0aC5taW4oQHZlcnRpY2FsU2Nyb2xsTWFyZ2luLCBtYXhTY3JvbGxNYXJnaW4pXG5cbiAgc2V0VmVydGljYWxTY3JvbGxNYXJnaW46IChAdmVydGljYWxTY3JvbGxNYXJnaW4pIC0+IEB2ZXJ0aWNhbFNjcm9sbE1hcmdpblxuXG4gIGdldEhvcml6b250YWxTY3JvbGxNYXJnaW46IC0+IE1hdGgubWluKEBob3Jpem9udGFsU2Nyb2xsTWFyZ2luLCBNYXRoLmZsb29yKCgoQHdpZHRoIC8gQGdldERlZmF1bHRDaGFyV2lkdGgoKSkgLSAxKSAvIDIpKVxuICBzZXRIb3Jpem9udGFsU2Nyb2xsTWFyZ2luOiAoQGhvcml6b250YWxTY3JvbGxNYXJnaW4pIC0+IEBob3Jpem9udGFsU2Nyb2xsTWFyZ2luXG5cbiAgZ2V0TGluZUhlaWdodEluUGl4ZWxzOiAtPiBAbGluZUhlaWdodEluUGl4ZWxzXG4gIHNldExpbmVIZWlnaHRJblBpeGVsczogKEBsaW5lSGVpZ2h0SW5QaXhlbHMpIC0+IEBsaW5lSGVpZ2h0SW5QaXhlbHNcblxuICBnZXRLb3JlYW5DaGFyV2lkdGg6IC0+IEBrb3JlYW5DaGFyV2lkdGhcbiAgZ2V0SGFsZldpZHRoQ2hhcldpZHRoOiAtPiBAaGFsZldpZHRoQ2hhcldpZHRoXG4gIGdldERvdWJsZVdpZHRoQ2hhcldpZHRoOiAtPiBAZG91YmxlV2lkdGhDaGFyV2lkdGhcbiAgZ2V0RGVmYXVsdENoYXJXaWR0aDogLT4gQGRlZmF1bHRDaGFyV2lkdGhcblxuICByYXRpb0ZvckNoYXJhY3RlcjogKGNoYXJhY3RlcikgLT5cbiAgICBpZiBpc0tvcmVhbkNoYXJhY3RlcihjaGFyYWN0ZXIpXG4gICAgICBAZ2V0S29yZWFuQ2hhcldpZHRoKCkgLyBAZ2V0RGVmYXVsdENoYXJXaWR0aCgpXG4gICAgZWxzZSBpZiBpc0hhbGZXaWR0aENoYXJhY3RlcihjaGFyYWN0ZXIpXG4gICAgICBAZ2V0SGFsZldpZHRoQ2hhcldpZHRoKCkgLyBAZ2V0RGVmYXVsdENoYXJXaWR0aCgpXG4gICAgZWxzZSBpZiBpc0RvdWJsZVdpZHRoQ2hhcmFjdGVyKGNoYXJhY3RlcilcbiAgICAgIEBnZXREb3VibGVXaWR0aENoYXJXaWR0aCgpIC8gQGdldERlZmF1bHRDaGFyV2lkdGgoKVxuICAgIGVsc2VcbiAgICAgIDFcblxuICBzZXREZWZhdWx0Q2hhcldpZHRoOiAoZGVmYXVsdENoYXJXaWR0aCwgZG91YmxlV2lkdGhDaGFyV2lkdGgsIGhhbGZXaWR0aENoYXJXaWR0aCwga29yZWFuQ2hhcldpZHRoKSAtPlxuICAgIGRvdWJsZVdpZHRoQ2hhcldpZHRoID89IGRlZmF1bHRDaGFyV2lkdGhcbiAgICBoYWxmV2lkdGhDaGFyV2lkdGggPz0gZGVmYXVsdENoYXJXaWR0aFxuICAgIGtvcmVhbkNoYXJXaWR0aCA/PSBkZWZhdWx0Q2hhcldpZHRoXG4gICAgaWYgZGVmYXVsdENoYXJXaWR0aCBpc250IEBkZWZhdWx0Q2hhcldpZHRoIG9yIGRvdWJsZVdpZHRoQ2hhcldpZHRoIGlzbnQgQGRvdWJsZVdpZHRoQ2hhcldpZHRoIGFuZCBoYWxmV2lkdGhDaGFyV2lkdGggaXNudCBAaGFsZldpZHRoQ2hhcldpZHRoIGFuZCBrb3JlYW5DaGFyV2lkdGggaXNudCBAa29yZWFuQ2hhcldpZHRoXG4gICAgICBAZGVmYXVsdENoYXJXaWR0aCA9IGRlZmF1bHRDaGFyV2lkdGhcbiAgICAgIEBkb3VibGVXaWR0aENoYXJXaWR0aCA9IGRvdWJsZVdpZHRoQ2hhcldpZHRoXG4gICAgICBAaGFsZldpZHRoQ2hhcldpZHRoID0gaGFsZldpZHRoQ2hhcldpZHRoXG4gICAgICBAa29yZWFuQ2hhcldpZHRoID0ga29yZWFuQ2hhcldpZHRoXG4gICAgICBAZGlzcGxheUxheWVyLnJlc2V0KHt9KSBpZiBAaXNTb2Z0V3JhcHBlZCgpIGFuZCBAZ2V0RWRpdG9yV2lkdGhJbkNoYXJzKCk/XG4gICAgZGVmYXVsdENoYXJXaWR0aFxuXG4gIHNldEhlaWdodDogKGhlaWdodCwgcmVlbnRyYW50PWZhbHNlKSAtPlxuICAgIGlmIHJlZW50cmFudFxuICAgICAgQGhlaWdodCA9IGhlaWdodFxuICAgIGVsc2VcbiAgICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6c2V0SGVpZ2h0IGluc3RlYWQuXCIpXG4gICAgICBAZ2V0RWxlbWVudCgpLnNldEhlaWdodChoZWlnaHQpXG5cbiAgZ2V0SGVpZ2h0OiAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6Z2V0SGVpZ2h0IGluc3RlYWQuXCIpXG4gICAgQGhlaWdodFxuXG4gIGdldEF1dG9IZWlnaHQ6IC0+IEBhdXRvSGVpZ2h0ID8gdHJ1ZVxuXG4gIGdldEF1dG9XaWR0aDogLT4gQGF1dG9XaWR0aCA/IGZhbHNlXG5cbiAgc2V0V2lkdGg6ICh3aWR0aCwgcmVlbnRyYW50PWZhbHNlKSAtPlxuICAgIGlmIHJlZW50cmFudFxuICAgICAgQHVwZGF0ZSh7d2lkdGh9KVxuICAgICAgQHdpZHRoXG4gICAgZWxzZVxuICAgICAgR3JpbS5kZXByZWNhdGUoXCJUaGlzIGlzIG5vdyBhIHZpZXcgbWV0aG9kLiBDYWxsIFRleHRFZGl0b3JFbGVtZW50OjpzZXRXaWR0aCBpbnN0ZWFkLlwiKVxuICAgICAgQGdldEVsZW1lbnQoKS5zZXRXaWR0aCh3aWR0aClcblxuICBnZXRXaWR0aDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OmdldFdpZHRoIGluc3RlYWQuXCIpXG4gICAgQHdpZHRoXG5cbiAgIyBFeHBlcmltZW50YWw6IFNjcm9sbCB0aGUgZWRpdG9yIHN1Y2ggdGhhdCB0aGUgZ2l2ZW4gc2NyZWVuIHJvdyBpcyBhdCB0aGVcbiAgIyB0b3Agb2YgdGhlIHZpc2libGUgYXJlYS5cbiAgc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93OiAoc2NyZWVuUm93LCBmcm9tVmlldykgLT5cbiAgICB1bmxlc3MgZnJvbVZpZXdcbiAgICAgIG1heFNjcmVlblJvdyA9IEBnZXRTY3JlZW5MaW5lQ291bnQoKSAtIDFcbiAgICAgIHVubGVzcyBAc2Nyb2xsUGFzdEVuZFxuICAgICAgICBpZiBAaGVpZ2h0PyBhbmQgQGxpbmVIZWlnaHRJblBpeGVscz9cbiAgICAgICAgICBtYXhTY3JlZW5Sb3cgLT0gTWF0aC5mbG9vcihAaGVpZ2h0IC8gQGxpbmVIZWlnaHRJblBpeGVscylcbiAgICAgIHNjcmVlblJvdyA9IE1hdGgubWF4KE1hdGgubWluKHNjcmVlblJvdywgbWF4U2NyZWVuUm93KSwgMClcblxuICAgIHVubGVzcyBzY3JlZW5Sb3cgaXMgQGZpcnN0VmlzaWJsZVNjcmVlblJvd1xuICAgICAgQGZpcnN0VmlzaWJsZVNjcmVlblJvdyA9IHNjcmVlblJvd1xuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1maXJzdC12aXNpYmxlLXNjcmVlbi1yb3cnLCBzY3JlZW5Sb3cgdW5sZXNzIGZyb21WaWV3XG5cbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93OiAtPiBAZmlyc3RWaXNpYmxlU2NyZWVuUm93XG5cbiAgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3c6IC0+XG4gICAgaWYgQGhlaWdodD8gYW5kIEBsaW5lSGVpZ2h0SW5QaXhlbHM/XG4gICAgICBNYXRoLm1pbihAZmlyc3RWaXNpYmxlU2NyZWVuUm93ICsgTWF0aC5mbG9vcihAaGVpZ2h0IC8gQGxpbmVIZWlnaHRJblBpeGVscyksIEBnZXRTY3JlZW5MaW5lQ291bnQoKSAtIDEpXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gIGdldFZpc2libGVSb3dSYW5nZTogLT5cbiAgICBpZiBsYXN0VmlzaWJsZVNjcmVlblJvdyA9IEBnZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgICBbQGZpcnN0VmlzaWJsZVNjcmVlblJvdywgbGFzdFZpc2libGVTY3JlZW5Sb3ddXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gIHNldEZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbjogKEBmaXJzdFZpc2libGVTY3JlZW5Db2x1bW4pIC0+XG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbjogLT4gQGZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtblxuXG4gIGdldFNjcm9sbFRvcDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OmdldFNjcm9sbFRvcCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5nZXRTY3JvbGxUb3AoKVxuXG4gIHNldFNjcm9sbFRvcDogKHNjcm9sbFRvcCkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNldFNjcm9sbFRvcCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5zZXRTY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuXG4gIGdldFNjcm9sbEJvdHRvbTogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OmdldFNjcm9sbEJvdHRvbSBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5nZXRTY3JvbGxCb3R0b20oKVxuXG4gIHNldFNjcm9sbEJvdHRvbTogKHNjcm9sbEJvdHRvbSkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNldFNjcm9sbEJvdHRvbSBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5zZXRTY3JvbGxCb3R0b20oc2Nyb2xsQm90dG9tKVxuXG4gIGdldFNjcm9sbExlZnQ6IC0+XG4gICAgR3JpbS5kZXByZWNhdGUoXCJUaGlzIGlzIG5vdyBhIHZpZXcgbWV0aG9kLiBDYWxsIFRleHRFZGl0b3JFbGVtZW50OjpnZXRTY3JvbGxMZWZ0IGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLmdldFNjcm9sbExlZnQoKVxuXG4gIHNldFNjcm9sbExlZnQ6IChzY3JvbGxMZWZ0KSAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6c2V0U2Nyb2xsTGVmdCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5zZXRTY3JvbGxMZWZ0KHNjcm9sbExlZnQpXG5cbiAgZ2V0U2Nyb2xsUmlnaHQ6IC0+XG4gICAgR3JpbS5kZXByZWNhdGUoXCJUaGlzIGlzIG5vdyBhIHZpZXcgbWV0aG9kLiBDYWxsIFRleHRFZGl0b3JFbGVtZW50OjpnZXRTY3JvbGxSaWdodCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5nZXRTY3JvbGxSaWdodCgpXG5cbiAgc2V0U2Nyb2xsUmlnaHQ6IChzY3JvbGxSaWdodCkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNldFNjcm9sbFJpZ2h0IGluc3RlYWQuXCIpXG5cbiAgICBAZ2V0RWxlbWVudCgpLnNldFNjcm9sbFJpZ2h0KHNjcm9sbFJpZ2h0KVxuXG4gIGdldFNjcm9sbEhlaWdodDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OmdldFNjcm9sbEhlaWdodCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5nZXRTY3JvbGxIZWlnaHQoKVxuXG4gIGdldFNjcm9sbFdpZHRoOiAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6Z2V0U2Nyb2xsV2lkdGggaW5zdGVhZC5cIilcblxuICAgIEBnZXRFbGVtZW50KCkuZ2V0U2Nyb2xsV2lkdGgoKVxuXG4gIGdldE1heFNjcm9sbFRvcDogLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OmdldE1heFNjcm9sbFRvcCBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5nZXRNYXhTY3JvbGxUb3AoKVxuXG4gIGludGVyc2VjdHNWaXNpYmxlUm93UmFuZ2U6IChzdGFydFJvdywgZW5kUm93KSAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6aW50ZXJzZWN0c1Zpc2libGVSb3dSYW5nZSBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5pbnRlcnNlY3RzVmlzaWJsZVJvd1JhbmdlKHN0YXJ0Um93LCBlbmRSb3cpXG5cbiAgc2VsZWN0aW9uSW50ZXJzZWN0c1Zpc2libGVSb3dSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNlbGVjdGlvbkludGVyc2VjdHNWaXNpYmxlUm93UmFuZ2UgaW5zdGVhZC5cIilcblxuICAgIEBnZXRFbGVtZW50KCkuc2VsZWN0aW9uSW50ZXJzZWN0c1Zpc2libGVSb3dSYW5nZShzZWxlY3Rpb24pXG5cbiAgc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uOiAocGl4ZWxQb3NpdGlvbikgLT5cbiAgICBHcmltLmRlcHJlY2F0ZShcIlRoaXMgaXMgbm93IGEgdmlldyBtZXRob2QuIENhbGwgVGV4dEVkaXRvckVsZW1lbnQ6OnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbiBpbnN0ZWFkLlwiKVxuXG4gICAgQGdldEVsZW1lbnQoKS5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQb3NpdGlvbilcblxuICBwaXhlbFJlY3RGb3JTY3JlZW5SYW5nZTogKHNjcmVlblJhbmdlKSAtPlxuICAgIEdyaW0uZGVwcmVjYXRlKFwiVGhpcyBpcyBub3cgYSB2aWV3IG1ldGhvZC4gQ2FsbCBUZXh0RWRpdG9yRWxlbWVudDo6cGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2UgaW5zdGVhZC5cIilcblxuICAgIEBnZXRFbGVtZW50KCkucGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFV0aWxpdHlcbiAgIyMjXG5cbiAgaW5zcGVjdDogLT5cbiAgICBcIjxUZXh0RWRpdG9yICN7QGlkfT5cIlxuXG4gIGVtaXRXaWxsSW5zZXJ0VGV4dEV2ZW50OiAodGV4dCkgLT5cbiAgICByZXN1bHQgPSB0cnVlXG4gICAgY2FuY2VsID0gLT4gcmVzdWx0ID0gZmFsc2VcbiAgICB3aWxsSW5zZXJ0RXZlbnQgPSB7Y2FuY2VsLCB0ZXh0fVxuICAgIEBlbWl0dGVyLmVtaXQgJ3dpbGwtaW5zZXJ0LXRleHQnLCB3aWxsSW5zZXJ0RXZlbnRcbiAgICByZXN1bHRcblxuICAjIyNcbiAgU2VjdGlvbjogTGFuZ3VhZ2UgTW9kZSBEZWxlZ2F0ZWQgTWV0aG9kc1xuICAjIyNcblxuICBzdWdnZXN0ZWRJbmRlbnRGb3JCdWZmZXJSb3c6IChidWZmZXJSb3csIG9wdGlvbnMpIC0+IEBsYW5ndWFnZU1vZGUuc3VnZ2VzdGVkSW5kZW50Rm9yQnVmZmVyUm93KGJ1ZmZlclJvdywgb3B0aW9ucylcblxuICBhdXRvSW5kZW50QnVmZmVyUm93OiAoYnVmZmVyUm93LCBvcHRpb25zKSAtPiBAbGFuZ3VhZ2VNb2RlLmF1dG9JbmRlbnRCdWZmZXJSb3coYnVmZmVyUm93LCBvcHRpb25zKVxuXG4gIGF1dG9JbmRlbnRCdWZmZXJSb3dzOiAoc3RhcnRSb3csIGVuZFJvdykgLT4gQGxhbmd1YWdlTW9kZS5hdXRvSW5kZW50QnVmZmVyUm93cyhzdGFydFJvdywgZW5kUm93KVxuXG4gIGF1dG9EZWNyZWFzZUluZGVudEZvckJ1ZmZlclJvdzogKGJ1ZmZlclJvdykgLT4gQGxhbmd1YWdlTW9kZS5hdXRvRGVjcmVhc2VJbmRlbnRGb3JCdWZmZXJSb3coYnVmZmVyUm93KVxuXG4gIHRvZ2dsZUxpbmVDb21tZW50Rm9yQnVmZmVyUm93OiAocm93KSAtPiBAbGFuZ3VhZ2VNb2RlLnRvZ2dsZUxpbmVDb21tZW50c0ZvckJ1ZmZlclJvdyhyb3cpXG5cbiAgdG9nZ2xlTGluZUNvbW1lbnRzRm9yQnVmZmVyUm93czogKHN0YXJ0LCBlbmQpIC0+IEBsYW5ndWFnZU1vZGUudG9nZ2xlTGluZUNvbW1lbnRzRm9yQnVmZmVyUm93cyhzdGFydCwgZW5kKVxuIl19
