(function() {
  var CompositeDisposable, DOMElementPool, Grim, GutterContainerComponent, InputComponent, LineTopIndex, LinesComponent, LinesYardstick, OffScreenBlockDecorationsComponent, OverlayManager, Point, Range, ScrollbarComponent, ScrollbarCornerComponent, TextEditorComponent, TextEditorPresenter, ipcRenderer, ref, scrollbarStyle,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  scrollbarStyle = require('scrollbar-style');

  ref = require('text-buffer'), Range = ref.Range, Point = ref.Point;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  ipcRenderer = require('electron').ipcRenderer;

  Grim = require('grim');

  TextEditorPresenter = require('./text-editor-presenter');

  GutterContainerComponent = require('./gutter-container-component');

  InputComponent = require('./input-component');

  LinesComponent = require('./lines-component');

  OffScreenBlockDecorationsComponent = require('./off-screen-block-decorations-component');

  ScrollbarComponent = require('./scrollbar-component');

  ScrollbarCornerComponent = require('./scrollbar-corner-component');

  OverlayManager = require('./overlay-manager');

  DOMElementPool = require('./dom-element-pool');

  LinesYardstick = require('./lines-yardstick');

  LineTopIndex = require('line-top-index');

  module.exports = TextEditorComponent = (function() {
    TextEditorComponent.prototype.cursorBlinkPeriod = 800;

    TextEditorComponent.prototype.cursorBlinkResumeDelay = 100;

    TextEditorComponent.prototype.tileSize = 12;

    TextEditorComponent.prototype.pendingScrollTop = null;

    TextEditorComponent.prototype.pendingScrollLeft = null;

    TextEditorComponent.prototype.updateRequested = false;

    TextEditorComponent.prototype.updatesPaused = false;

    TextEditorComponent.prototype.updateRequestedWhilePaused = false;

    TextEditorComponent.prototype.heightAndWidthMeasurementRequested = false;

    TextEditorComponent.prototype.inputEnabled = true;

    TextEditorComponent.prototype.measureScrollbarsWhenShown = true;

    TextEditorComponent.prototype.measureLineHeightAndDefaultCharWidthWhenShown = true;

    TextEditorComponent.prototype.stylingChangeAnimationFrameRequested = false;

    TextEditorComponent.prototype.gutterComponent = null;

    TextEditorComponent.prototype.mounted = true;

    TextEditorComponent.prototype.initialized = false;

    Object.defineProperty(TextEditorComponent.prototype, "domNode", {
      get: function() {
        return this.domNodeValue;
      },
      set: function(domNode) {
        this.assert(domNode != null, "TextEditorComponent::domNode was set to null.");
        return this.domNodeValue = domNode;
      }
    });

    function TextEditorComponent(arg) {
      var lineTopIndex, tileSize;
      this.editor = arg.editor, this.hostElement = arg.hostElement, tileSize = arg.tileSize, this.views = arg.views, this.themes = arg.themes, this.styles = arg.styles, this.assert = arg.assert;
      this.refreshScrollbars = bind(this.refreshScrollbars, this);
      this.sampleFontStyling = bind(this.sampleFontStyling, this);
      this.pollDOM = bind(this.pollDOM, this);
      this.handleStylingChange = bind(this.handleStylingChange, this);
      this.onAllThemesLoaded = bind(this.onAllThemesLoaded, this);
      this.onStylesheetsChanged = bind(this.onStylesheetsChanged, this);
      this.onGutterShiftClick = bind(this.onGutterShiftClick, this);
      this.onGutterMetaClick = bind(this.onGutterMetaClick, this);
      this.onGutterClick = bind(this.onGutterClick, this);
      this.onLineNumberGutterMouseDown = bind(this.onLineNumberGutterMouseDown, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.onScrollViewScroll = bind(this.onScrollViewScroll, this);
      this.onMouseWheel = bind(this.onMouseWheel, this);
      this.onHorizontalScroll = bind(this.onHorizontalScroll, this);
      this.onVerticalScroll = bind(this.onVerticalScroll, this);
      this.onTextInput = bind(this.onTextInput, this);
      this.onGrammarChanged = bind(this.onGrammarChanged, this);
      this.requestUpdate = bind(this.requestUpdate, this);
      this.readAfterUpdateSync = bind(this.readAfterUpdateSync, this);
      if (tileSize != null) {
        this.tileSize = tileSize;
      }
      this.disposables = new CompositeDisposable;
      lineTopIndex = new LineTopIndex({
        defaultLineHeight: this.editor.getLineHeightInPixels()
      });
      this.presenter = new TextEditorPresenter({
        model: this.editor,
        tileSize: tileSize,
        cursorBlinkPeriod: this.cursorBlinkPeriod,
        cursorBlinkResumeDelay: this.cursorBlinkResumeDelay,
        stoppedScrollingDelay: 200,
        lineTopIndex: lineTopIndex,
        autoHeight: this.editor.getAutoHeight()
      });
      this.presenter.onDidUpdateState(this.requestUpdate);
      this.domElementPool = new DOMElementPool;
      this.domNode = document.createElement('div');
      this.domNode.classList.add('editor-contents--private');
      this.overlayManager = new OverlayManager(this.presenter, this.domNode, this.views);
      this.scrollViewNode = document.createElement('div');
      this.scrollViewNode.classList.add('scroll-view');
      this.domNode.appendChild(this.scrollViewNode);
      this.hiddenInputComponent = new InputComponent;
      this.scrollViewNode.appendChild(this.hiddenInputComponent.getDomNode());
      this.hiddenInputComponent.getDomNode().getModel = (function(_this) {
        return function() {
          return _this.editor;
        };
      })(this);
      this.linesComponent = new LinesComponent({
        presenter: this.presenter,
        domElementPool: this.domElementPool,
        assert: this.assert,
        grammars: this.grammars,
        views: this.views
      });
      this.scrollViewNode.appendChild(this.linesComponent.getDomNode());
      this.offScreenBlockDecorationsComponent = new OffScreenBlockDecorationsComponent({
        presenter: this.presenter,
        views: this.views
      });
      this.scrollViewNode.appendChild(this.offScreenBlockDecorationsComponent.getDomNode());
      this.linesYardstick = new LinesYardstick(this.editor, this.linesComponent, lineTopIndex);
      this.presenter.setLinesYardstick(this.linesYardstick);
      this.horizontalScrollbarComponent = new ScrollbarComponent({
        orientation: 'horizontal',
        onScroll: this.onHorizontalScroll
      });
      this.scrollViewNode.appendChild(this.horizontalScrollbarComponent.getDomNode());
      this.verticalScrollbarComponent = new ScrollbarComponent({
        orientation: 'vertical',
        onScroll: this.onVerticalScroll
      });
      this.domNode.appendChild(this.verticalScrollbarComponent.getDomNode());
      this.scrollbarCornerComponent = new ScrollbarCornerComponent;
      this.domNode.appendChild(this.scrollbarCornerComponent.getDomNode());
      this.observeEditor();
      this.listenForDOMEvents();
      this.disposables.add(this.styles.onDidAddStyleElement(this.onStylesheetsChanged));
      this.disposables.add(this.styles.onDidUpdateStyleElement(this.onStylesheetsChanged));
      this.disposables.add(this.styles.onDidRemoveStyleElement(this.onStylesheetsChanged));
      if (!this.themes.isInitialLoadComplete()) {
        this.disposables.add(this.themes.onDidChangeActiveThemes(this.onAllThemesLoaded));
      }
      this.disposables.add(scrollbarStyle.onDidChangePreferredScrollbarStyle(this.refreshScrollbars));
      this.disposables.add(this.views.pollDocument(this.pollDOM));
      this.updateSync();
      this.checkForVisibilityChange();
      this.initialized = true;
    }

    TextEditorComponent.prototype.destroy = function() {
      var ref1;
      this.mounted = false;
      this.disposables.dispose();
      this.presenter.destroy();
      if ((ref1 = this.gutterContainerComponent) != null) {
        ref1.destroy();
      }
      this.domElementPool.clear();
      this.verticalScrollbarComponent.destroy();
      this.horizontalScrollbarComponent.destroy();
      this.onVerticalScroll = null;
      return this.onHorizontalScroll = null;
    };

    TextEditorComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    TextEditorComponent.prototype.updateSync = function() {
      var ref1, ref2, ref3;
      this.updateSyncPreMeasurement();
      if (this.oldState == null) {
        this.oldState = {
          width: null
        };
      }
      this.newState = this.presenter.getPostMeasurementState();
      if ((this.editor.getLastSelection() != null) && !this.editor.getLastSelection().isEmpty()) {
        this.domNode.classList.add('has-selection');
      } else {
        this.domNode.classList.remove('has-selection');
      }
      if (this.newState.focused !== this.oldState.focused) {
        this.domNode.classList.toggle('is-focused', this.newState.focused);
      }
      if (this.editor.isDestroyed()) {
        this.performedInitialMeasurement = false;
      }
      if (this.performedInitialMeasurement) {
        if (this.newState.height !== this.oldState.height) {
          if (this.newState.height != null) {
            this.domNode.style.height = this.newState.height + 'px';
          } else {
            this.domNode.style.height = '';
          }
        }
        if (this.newState.width !== this.oldState.width) {
          if (this.newState.width != null) {
            this.hostElement.style.width = this.newState.width + 'px';
          } else {
            this.hostElement.style.width = '';
          }
          this.oldState.width = this.newState.width;
        }
      }
      if (this.newState.gutters.length) {
        if (this.gutterContainerComponent == null) {
          this.mountGutterContainerComponent();
        }
        this.gutterContainerComponent.updateSync(this.newState);
      } else {
        if ((ref1 = this.gutterContainerComponent) != null) {
          if ((ref2 = ref1.getDomNode()) != null) {
            ref2.remove();
          }
        }
        this.gutterContainerComponent = null;
      }
      this.hiddenInputComponent.updateSync(this.newState);
      this.offScreenBlockDecorationsComponent.updateSync(this.newState);
      this.linesComponent.updateSync(this.newState);
      this.horizontalScrollbarComponent.updateSync(this.newState);
      this.verticalScrollbarComponent.updateSync(this.newState);
      this.scrollbarCornerComponent.updateSync(this.newState);
      if ((ref3 = this.overlayManager) != null) {
        ref3.render(this.newState);
      }
      if (this.clearPoolAfterUpdate) {
        this.domElementPool.clear();
        this.clearPoolAfterUpdate = false;
      }
      if (this.editor.isAlive()) {
        this.updateParentViewFocusedClassIfNeeded();
        return this.updateParentViewMiniClass();
      }
    };

    TextEditorComponent.prototype.updateSyncPreMeasurement = function() {
      return this.linesComponent.updateSync(this.presenter.getPreMeasurementState());
    };

    TextEditorComponent.prototype.readAfterUpdateSync = function() {
      var ref1;
      if ((ref1 = this.overlayManager) != null) {
        ref1.measureOverlays();
      }
      this.linesComponent.measureBlockDecorations();
      return this.offScreenBlockDecorationsComponent.measureBlockDecorations();
    };

    TextEditorComponent.prototype.mountGutterContainerComponent = function() {
      this.gutterContainerComponent = new GutterContainerComponent({
        editor: this.editor,
        onLineNumberGutterMouseDown: this.onLineNumberGutterMouseDown,
        domElementPool: this.domElementPool,
        views: this.views
      });
      return this.domNode.insertBefore(this.gutterContainerComponent.getDomNode(), this.domNode.firstChild);
    };

    TextEditorComponent.prototype.becameVisible = function() {
      this.updatesPaused = true;
      this.invalidateMeasurements();
      if (this.measureScrollbarsWhenShown) {
        this.measureScrollbars();
      }
      this.sampleFontStyling();
      this.sampleBackgroundColors();
      this.measureWindowSize();
      this.measureDimensions();
      if (this.measureLineHeightAndDefaultCharWidthWhenShown) {
        this.measureLineHeightAndDefaultCharWidth();
      }
      this.editor.setVisible(true);
      this.performedInitialMeasurement = true;
      this.updatesPaused = false;
      if (this.canUpdate()) {
        return this.updateSync();
      }
    };

    TextEditorComponent.prototype.requestUpdate = function() {
      if (!this.canUpdate()) {
        return;
      }
      if (this.updatesPaused) {
        this.updateRequestedWhilePaused = true;
        return;
      }
      if (this.hostElement.isUpdatedSynchronously()) {
        return this.updateSync();
      } else if (!this.updateRequested) {
        this.updateRequested = true;
        this.views.updateDocument((function(_this) {
          return function() {
            _this.updateRequested = false;
            if (_this.canUpdate()) {
              return _this.updateSync();
            }
          };
        })(this));
        return this.views.readDocument(this.readAfterUpdateSync);
      }
    };

    TextEditorComponent.prototype.canUpdate = function() {
      return this.mounted && this.editor.isAlive();
    };

    TextEditorComponent.prototype.requestAnimationFrame = function(fn) {
      this.updatesPaused = true;
      return requestAnimationFrame((function(_this) {
        return function() {
          fn();
          _this.updatesPaused = false;
          if (_this.updateRequestedWhilePaused && _this.canUpdate()) {
            _this.updateRequestedWhilePaused = false;
            return _this.requestUpdate();
          }
        };
      })(this));
    };

    TextEditorComponent.prototype.getTopmostDOMNode = function() {
      return this.hostElement;
    };

    TextEditorComponent.prototype.observeEditor = function() {
      return this.disposables.add(this.editor.observeGrammar(this.onGrammarChanged));
    };

    TextEditorComponent.prototype.listenForDOMEvents = function() {
      this.domNode.addEventListener('mousewheel', this.onMouseWheel);
      this.domNode.addEventListener('textInput', this.onTextInput);
      this.scrollViewNode.addEventListener('mousedown', this.onMouseDown);
      this.scrollViewNode.addEventListener('scroll', this.onScrollViewScroll);
      this.detectAccentedCharacterMenu();
      this.listenForIMEEvents();
      if (process.platform === 'linux') {
        return this.trackSelectionClipboard();
      }
    };

    TextEditorComponent.prototype.detectAccentedCharacterMenu = function() {
      var lastKeydown, lastKeydownBeforeKeypress;
      lastKeydown = null;
      lastKeydownBeforeKeypress = null;
      this.domNode.addEventListener('keydown', (function(_this) {
        return function(event) {
          if (lastKeydownBeforeKeypress) {
            if (lastKeydownBeforeKeypress.keyCode === event.keyCode) {
              _this.openedAccentedCharacterMenu = true;
            }
            return lastKeydownBeforeKeypress = null;
          } else {
            return lastKeydown = event;
          }
        };
      })(this));
      this.domNode.addEventListener('keypress', (function(_this) {
        return function() {
          lastKeydownBeforeKeypress = lastKeydown;
          lastKeydown = null;
          return _this.openedAccentedCharacterMenu = false;
        };
      })(this));
      return this.domNode.addEventListener('keyup', function() {
        lastKeydownBeforeKeypress = null;
        return lastKeydown = null;
      });
    };

    TextEditorComponent.prototype.listenForIMEEvents = function() {
      var checkpoint;
      checkpoint = null;
      this.domNode.addEventListener('compositionstart', (function(_this) {
        return function() {
          if (_this.openedAccentedCharacterMenu) {
            _this.editor.selectLeft();
            _this.openedAccentedCharacterMenu = false;
          }
          return checkpoint = _this.editor.createCheckpoint();
        };
      })(this));
      this.domNode.addEventListener('compositionupdate', (function(_this) {
        return function(event) {
          return _this.editor.insertText(event.data, {
            select: true
          });
        };
      })(this));
      return this.domNode.addEventListener('compositionend', (function(_this) {
        return function(event) {
          _this.editor.revertToCheckpoint(checkpoint);
          return event.target.value = '';
        };
      })(this));
    };

    TextEditorComponent.prototype.trackSelectionClipboard = function() {
      var timeoutId, writeSelectedTextToSelectionClipboard;
      timeoutId = null;
      writeSelectedTextToSelectionClipboard = (function(_this) {
        return function() {
          var selectedText;
          if (_this.editor.isDestroyed()) {
            return;
          }
          if (selectedText = _this.editor.getSelectedText()) {
            return ipcRenderer.send('write-text-to-selection-clipboard', selectedText);
          }
        };
      })(this);
      return this.disposables.add(this.editor.onDidChangeSelectionRange(function() {
        clearTimeout(timeoutId);
        return timeoutId = setTimeout(writeSelectedTextToSelectionClipboard);
      }));
    };

    TextEditorComponent.prototype.onGrammarChanged = function() {
      if (this.scopedConfigDisposables != null) {
        this.scopedConfigDisposables.dispose();
        this.disposables.remove(this.scopedConfigDisposables);
      }
      this.scopedConfigDisposables = new CompositeDisposable;
      return this.disposables.add(this.scopedConfigDisposables);
    };

    TextEditorComponent.prototype.focused = function() {
      if (this.mounted) {
        this.presenter.setFocused(true);
        return this.hiddenInputComponent.getDomNode().focus();
      }
    };

    TextEditorComponent.prototype.blurred = function() {
      if (this.mounted) {
        return this.presenter.setFocused(false);
      }
    };

    TextEditorComponent.prototype.onTextInput = function(event) {
      event.stopPropagation();
      if (event.data !== ' ') {
        event.preventDefault();
      }
      if (!this.isInputEnabled()) {
        return;
      }
      if (this.openedAccentedCharacterMenu) {
        this.editor.selectLeft();
        this.openedAccentedCharacterMenu = false;
      }
      return this.editor.insertText(event.data, {
        groupUndo: true
      });
    };

    TextEditorComponent.prototype.onVerticalScroll = function(scrollTop) {
      var animationFramePending;
      if (this.updateRequested || scrollTop === this.presenter.getScrollTop()) {
        return;
      }
      animationFramePending = this.pendingScrollTop != null;
      this.pendingScrollTop = scrollTop;
      if (!animationFramePending) {
        return this.requestAnimationFrame((function(_this) {
          return function() {
            var pendingScrollTop;
            pendingScrollTop = _this.pendingScrollTop;
            _this.pendingScrollTop = null;
            _this.presenter.setScrollTop(pendingScrollTop);
            return _this.presenter.commitPendingScrollTopPosition();
          };
        })(this));
      }
    };

    TextEditorComponent.prototype.onHorizontalScroll = function(scrollLeft) {
      var animationFramePending;
      if (this.updateRequested || scrollLeft === this.presenter.getScrollLeft()) {
        return;
      }
      animationFramePending = this.pendingScrollLeft != null;
      this.pendingScrollLeft = scrollLeft;
      if (!animationFramePending) {
        return this.requestAnimationFrame((function(_this) {
          return function() {
            _this.presenter.setScrollLeft(_this.pendingScrollLeft);
            _this.presenter.commitPendingScrollLeftPosition();
            return _this.pendingScrollLeft = null;
          };
        })(this));
      }
    };

    TextEditorComponent.prototype.onMouseWheel = function(event) {
      var previousScrollLeft, previousScrollTop, updatedScrollLeft, updatedScrollTop, wheelDeltaX, wheelDeltaY;
      wheelDeltaX = event.wheelDeltaX, wheelDeltaY = event.wheelDeltaY;
      if (Math.abs(wheelDeltaX) > Math.abs(wheelDeltaY)) {
        previousScrollLeft = this.presenter.getScrollLeft();
        updatedScrollLeft = previousScrollLeft - Math.round(wheelDeltaX * this.editor.getScrollSensitivity() / 100);
        if (this.presenter.canScrollLeftTo(updatedScrollLeft)) {
          event.preventDefault();
        }
        return this.presenter.setScrollLeft(updatedScrollLeft);
      } else {
        this.presenter.setMouseWheelScreenRow(this.screenRowForNode(event.target));
        previousScrollTop = this.presenter.getScrollTop();
        updatedScrollTop = previousScrollTop - Math.round(wheelDeltaY * this.editor.getScrollSensitivity() / 100);
        if (this.presenter.canScrollTopTo(updatedScrollTop)) {
          event.preventDefault();
        }
        return this.presenter.setScrollTop(updatedScrollTop);
      }
    };

    TextEditorComponent.prototype.onScrollViewScroll = function() {
      if (this.mounted) {
        console.warn("TextEditorScrollView scrolled when it shouldn't have.");
        this.scrollViewNode.scrollTop = 0;
        return this.scrollViewNode.scrollLeft = 0;
      }
    };

    TextEditorComponent.prototype.onDidChangeScrollTop = function(callback) {
      return this.presenter.onDidChangeScrollTop(callback);
    };

    TextEditorComponent.prototype.onDidChangeScrollLeft = function(callback) {
      return this.presenter.onDidChangeScrollLeft(callback);
    };

    TextEditorComponent.prototype.setScrollLeft = function(scrollLeft) {
      return this.presenter.setScrollLeft(scrollLeft);
    };

    TextEditorComponent.prototype.setScrollRight = function(scrollRight) {
      return this.presenter.setScrollRight(scrollRight);
    };

    TextEditorComponent.prototype.setScrollTop = function(scrollTop) {
      return this.presenter.setScrollTop(scrollTop);
    };

    TextEditorComponent.prototype.setScrollBottom = function(scrollBottom) {
      return this.presenter.setScrollBottom(scrollBottom);
    };

    TextEditorComponent.prototype.getScrollTop = function() {
      return this.presenter.getScrollTop();
    };

    TextEditorComponent.prototype.getScrollLeft = function() {
      return this.presenter.getScrollLeft();
    };

    TextEditorComponent.prototype.getScrollRight = function() {
      return this.presenter.getScrollRight();
    };

    TextEditorComponent.prototype.getScrollBottom = function() {
      return this.presenter.getScrollBottom();
    };

    TextEditorComponent.prototype.getScrollHeight = function() {
      return this.presenter.getScrollHeight();
    };

    TextEditorComponent.prototype.getScrollWidth = function() {
      return this.presenter.getScrollWidth();
    };

    TextEditorComponent.prototype.getMaxScrollTop = function() {
      return this.presenter.getMaxScrollTop();
    };

    TextEditorComponent.prototype.getVerticalScrollbarWidth = function() {
      return this.presenter.getVerticalScrollbarWidth();
    };

    TextEditorComponent.prototype.getHorizontalScrollbarHeight = function() {
      return this.presenter.getHorizontalScrollbarHeight();
    };

    TextEditorComponent.prototype.getVisibleRowRange = function() {
      return this.presenter.getVisibleRowRange();
    };

    TextEditorComponent.prototype.pixelPositionForScreenPosition = function(screenPosition, clip) {
      var pixelPosition;
      if (clip == null) {
        clip = true;
      }
      screenPosition = Point.fromObject(screenPosition);
      if (clip) {
        screenPosition = this.editor.clipScreenPosition(screenPosition);
      }
      if (!this.presenter.isRowRendered(screenPosition.row)) {
        this.presenter.setScreenRowsToMeasure([screenPosition.row]);
      }
      if (this.linesComponent.lineNodeForScreenRow(screenPosition.row) == null) {
        this.updateSyncPreMeasurement();
      }
      pixelPosition = this.linesYardstick.pixelPositionForScreenPosition(screenPosition);
      this.presenter.clearScreenRowsToMeasure();
      return pixelPosition;
    };

    TextEditorComponent.prototype.screenPositionForPixelPosition = function(pixelPosition) {
      var position, row;
      row = this.linesYardstick.measuredRowForPixelPosition(pixelPosition);
      if ((row != null) && !this.presenter.isRowRendered(row)) {
        this.presenter.setScreenRowsToMeasure([row]);
        this.updateSyncPreMeasurement();
      }
      position = this.linesYardstick.screenPositionForPixelPosition(pixelPosition);
      this.presenter.clearScreenRowsToMeasure();
      return position;
    };

    TextEditorComponent.prototype.pixelRectForScreenRange = function(screenRange) {
      var rect, rowsToMeasure;
      rowsToMeasure = [];
      if (!this.presenter.isRowRendered(screenRange.start.row)) {
        rowsToMeasure.push(screenRange.start.row);
      }
      if (!this.presenter.isRowRendered(screenRange.end.row)) {
        rowsToMeasure.push(screenRange.end.row);
      }
      if (rowsToMeasure.length > 0) {
        this.presenter.setScreenRowsToMeasure(rowsToMeasure);
        this.updateSyncPreMeasurement();
      }
      rect = this.presenter.absolutePixelRectForScreenRange(screenRange);
      if (rowsToMeasure.length > 0) {
        this.presenter.clearScreenRowsToMeasure();
      }
      return rect;
    };

    TextEditorComponent.prototype.pixelRangeForScreenRange = function(screenRange, clip) {
      var end, ref1, start;
      if (clip == null) {
        clip = true;
      }
      ref1 = Range.fromObject(screenRange), start = ref1.start, end = ref1.end;
      return {
        start: this.pixelPositionForScreenPosition(start, clip),
        end: this.pixelPositionForScreenPosition(end, clip)
      };
    };

    TextEditorComponent.prototype.pixelPositionForBufferPosition = function(bufferPosition) {
      return this.pixelPositionForScreenPosition(this.editor.screenPositionForBufferPosition(bufferPosition));
    };

    TextEditorComponent.prototype.invalidateBlockDecorationDimensions = function() {
      var ref1;
      return (ref1 = this.presenter).invalidateBlockDecorationDimensions.apply(ref1, arguments);
    };

    TextEditorComponent.prototype.onMouseDown = function(event) {
      var bufferPosition, ctrlKey, cursorAtScreenPosition, detail, metaKey, ref1, ref2, screenPosition, shiftKey;
      if (!(event.button === 0 || (event.button === 1 && process.platform === 'linux'))) {
        return;
      }
      if ((ref1 = event.target) != null ? ref1.classList.contains('horizontal-scrollbar') : void 0) {
        return;
      }
      detail = event.detail, shiftKey = event.shiftKey, metaKey = event.metaKey, ctrlKey = event.ctrlKey;
      if (ctrlKey && process.platform === 'darwin') {
        return;
      }
      if (this.oldState.focused) {
        event.preventDefault();
      }
      screenPosition = this.screenPositionForMouseEvent(event);
      if ((ref2 = event.target) != null ? ref2.classList.contains('fold-marker') : void 0) {
        bufferPosition = this.editor.bufferPositionForScreenPosition(screenPosition);
        this.editor.destroyFoldsIntersectingBufferRange([bufferPosition, bufferPosition]);
        return;
      }
      switch (detail) {
        case 1:
          if (shiftKey) {
            this.editor.selectToScreenPosition(screenPosition);
          } else if (metaKey || (ctrlKey && process.platform !== 'darwin')) {
            cursorAtScreenPosition = this.editor.getCursorAtScreenPosition(screenPosition);
            if (cursorAtScreenPosition && this.editor.hasMultipleCursors()) {
              cursorAtScreenPosition.destroy();
            } else {
              this.editor.addCursorAtScreenPosition(screenPosition, {
                autoscroll: false
              });
            }
          } else {
            this.editor.setCursorScreenPosition(screenPosition, {
              autoscroll: false
            });
          }
          break;
        case 2:
          this.editor.getLastSelection().selectWord({
            autoscroll: false
          });
          break;
        case 3:
          this.editor.getLastSelection().selectLine(null, {
            autoscroll: false
          });
      }
      return this.handleDragUntilMouseUp((function(_this) {
        return function(screenPosition) {
          return _this.editor.selectToScreenPosition(screenPosition, {
            suppressSelectionMerge: true,
            autoscroll: false
          });
        };
      })(this));
    };

    TextEditorComponent.prototype.onLineNumberGutterMouseDown = function(event) {
      var ctrlKey, metaKey, shiftKey;
      if (event.button !== 0) {
        return;
      }
      shiftKey = event.shiftKey, metaKey = event.metaKey, ctrlKey = event.ctrlKey;
      if (shiftKey) {
        return this.onGutterShiftClick(event);
      } else if (metaKey || (ctrlKey && process.platform !== 'darwin')) {
        return this.onGutterMetaClick(event);
      } else {
        return this.onGutterClick(event);
      }
    };

    TextEditorComponent.prototype.onGutterClick = function(event) {
      var clickedBufferRow, clickedScreenRow, initialScreenRange;
      clickedScreenRow = this.screenPositionForMouseEvent(event).row;
      clickedBufferRow = this.editor.bufferRowForScreenRow(clickedScreenRow);
      initialScreenRange = this.editor.screenRangeForBufferRange([[clickedBufferRow, 0], [clickedBufferRow + 1, 0]]);
      this.editor.setSelectedScreenRange(initialScreenRange, {
        preserveFolds: true,
        autoscroll: false
      });
      return this.handleGutterDrag(initialScreenRange);
    };

    TextEditorComponent.prototype.onGutterMetaClick = function(event) {
      var clickedBufferRow, clickedScreenRow, initialScreenRange;
      clickedScreenRow = this.screenPositionForMouseEvent(event).row;
      clickedBufferRow = this.editor.bufferRowForScreenRow(clickedScreenRow);
      initialScreenRange = this.editor.screenRangeForBufferRange([[clickedBufferRow, 0], [clickedBufferRow + 1, 0]]);
      this.editor.addSelectionForScreenRange(initialScreenRange, {
        autoscroll: false
      });
      return this.handleGutterDrag(initialScreenRange);
    };

    TextEditorComponent.prototype.onGutterShiftClick = function(event) {
      var clickedBufferRow, clickedLineScreenRange, clickedScreenRow, tailScreenPosition;
      tailScreenPosition = this.editor.getLastSelection().getTailScreenPosition();
      clickedScreenRow = this.screenPositionForMouseEvent(event).row;
      clickedBufferRow = this.editor.bufferRowForScreenRow(clickedScreenRow);
      clickedLineScreenRange = this.editor.screenRangeForBufferRange([[clickedBufferRow, 0], [clickedBufferRow + 1, 0]]);
      if (clickedScreenRow < tailScreenPosition.row) {
        this.editor.selectToScreenPosition(clickedLineScreenRange.start, {
          suppressSelectionMerge: true,
          autoscroll: false
        });
      } else {
        this.editor.selectToScreenPosition(clickedLineScreenRange.end, {
          suppressSelectionMerge: true,
          autoscroll: false
        });
      }
      return this.handleGutterDrag(new Range(tailScreenPosition, tailScreenPosition));
    };

    TextEditorComponent.prototype.handleGutterDrag = function(initialRange) {
      return this.handleDragUntilMouseUp((function(_this) {
        return function(screenPosition) {
          var dragRow, endPosition, screenRange, startPosition;
          dragRow = screenPosition.row;
          if (dragRow < initialRange.start.row) {
            startPosition = _this.editor.clipScreenPosition([dragRow, 0], {
              skipSoftWrapIndentation: true
            });
            screenRange = new Range(startPosition, startPosition).union(initialRange);
            return _this.editor.getLastSelection().setScreenRange(screenRange, {
              reversed: true,
              autoscroll: false,
              preserveFolds: true
            });
          } else {
            endPosition = [dragRow + 1, 0];
            screenRange = new Range(endPosition, endPosition).union(initialRange);
            return _this.editor.getLastSelection().setScreenRange(screenRange, {
              reversed: false,
              autoscroll: false,
              preserveFolds: true
            });
          }
        };
      })(this));
    };

    TextEditorComponent.prototype.onStylesheetsChanged = function(styleElement) {
      if (!this.performedInitialMeasurement) {
        return;
      }
      if (!this.themes.isInitialLoadComplete()) {
        return;
      }
      if (!this.stylingChangeAnimationFrameRequested) {
        this.stylingChangeAnimationFrameRequested = true;
        return requestAnimationFrame((function(_this) {
          return function() {
            _this.stylingChangeAnimationFrameRequested = false;
            if (_this.mounted) {
              if ((styleElement.sheet == null) || _this.containsScrollbarSelector(styleElement.sheet)) {
                _this.refreshScrollbars();
              }
              return _this.handleStylingChange();
            }
          };
        })(this));
      }
    };

    TextEditorComponent.prototype.onAllThemesLoaded = function() {
      this.refreshScrollbars();
      return this.handleStylingChange();
    };

    TextEditorComponent.prototype.handleStylingChange = function() {
      this.sampleFontStyling();
      this.sampleBackgroundColors();
      return this.invalidateMeasurements();
    };

    TextEditorComponent.prototype.handleDragUntilMouseUp = function(dragHandler) {
      var animationLoop, autoscroll, disposables, dragging, lastMousePosition, onMouseMove, onMouseUp, pasteSelectionClipboard, scaleScrollDelta, stopDragging;
      dragging = false;
      lastMousePosition = {};
      animationLoop = (function(_this) {
        return function() {
          return _this.requestAnimationFrame(function() {
            var linesClientRect, screenPosition;
            if (dragging && _this.mounted) {
              linesClientRect = _this.linesComponent.getDomNode().getBoundingClientRect();
              autoscroll(lastMousePosition, linesClientRect);
              screenPosition = _this.screenPositionForMouseEvent(lastMousePosition, linesClientRect);
              dragHandler(screenPosition);
              return animationLoop();
            } else if (!_this.mounted) {
              return stopDragging();
            }
          });
        };
      })(this);
      onMouseMove = function(event) {
        lastMousePosition.clientX = event.clientX;
        lastMousePosition.clientY = event.clientY;
        if (!dragging) {
          dragging = true;
          animationLoop();
        }
        if (event.which === 0) {
          return onMouseUp();
        }
      };
      onMouseUp = (function(_this) {
        return function(event) {
          if (dragging) {
            stopDragging();
            _this.editor.finalizeSelections();
            _this.editor.mergeIntersectingSelections();
          }
          return pasteSelectionClipboard(event);
        };
      })(this);
      stopDragging = function() {
        dragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        return disposables.dispose();
      };
      autoscroll = (function(_this) {
        return function(mouseClientPosition) {
          var bottom, left, mouseXDelta, mouseYDelta, ref1, right, top, xDirection, yDirection;
          ref1 = _this.scrollViewNode.getBoundingClientRect(), top = ref1.top, bottom = ref1.bottom, left = ref1.left, right = ref1.right;
          top += 30;
          bottom -= 30;
          left += 30;
          right -= 30;
          if (mouseClientPosition.clientY < top) {
            mouseYDelta = top - mouseClientPosition.clientY;
            yDirection = -1;
          } else if (mouseClientPosition.clientY > bottom) {
            mouseYDelta = mouseClientPosition.clientY - bottom;
            yDirection = 1;
          }
          if (mouseClientPosition.clientX < left) {
            mouseXDelta = left - mouseClientPosition.clientX;
            xDirection = -1;
          } else if (mouseClientPosition.clientX > right) {
            mouseXDelta = mouseClientPosition.clientX - right;
            xDirection = 1;
          }
          if (mouseYDelta != null) {
            _this.presenter.setScrollTop(_this.presenter.getScrollTop() + yDirection * scaleScrollDelta(mouseYDelta));
            _this.presenter.commitPendingScrollTopPosition();
          }
          if (mouseXDelta != null) {
            _this.presenter.setScrollLeft(_this.presenter.getScrollLeft() + xDirection * scaleScrollDelta(mouseXDelta));
            return _this.presenter.commitPendingScrollLeftPosition();
          }
        };
      })(this);
      scaleScrollDelta = function(scrollDelta) {
        return Math.pow(scrollDelta / 2, 3) / 280;
      };
      pasteSelectionClipboard = (function(_this) {
        return function(event) {
          var selection;
          if ((event != null ? event.which : void 0) === 2 && process.platform === 'linux') {
            if (selection = require('./safe-clipboard').readText('selection')) {
              return _this.editor.insertText(selection);
            }
          }
        };
      })(this);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      disposables = new CompositeDisposable;
      disposables.add(this.editor.getBuffer().onWillChange(onMouseUp));
      return disposables.add(this.editor.onDidDestroy(stopDragging));
    };

    TextEditorComponent.prototype.isVisible = function() {
      this.assert(this.domNode != null, "TextEditorComponent::domNode was null.", (function(_this) {
        return function(error) {
          return error.metadata = {
            initialized: _this.initialized
          };
        };
      })(this));
      return (this.domNode != null) && (this.domNode.offsetHeight > 0 || this.domNode.offsetWidth > 0);
    };

    TextEditorComponent.prototype.pollDOM = function() {
      var ref1;
      if (!this.checkForVisibilityChange()) {
        this.sampleBackgroundColors();
        this.measureWindowSize();
        this.measureDimensions();
        this.sampleFontStyling();
        return (ref1 = this.overlayManager) != null ? ref1.measureOverlays() : void 0;
      }
    };

    TextEditorComponent.prototype.checkForVisibilityChange = function() {
      if (this.isVisible()) {
        if (this.wasVisible) {
          return false;
        } else {
          this.becameVisible();
          return this.wasVisible = true;
        }
      } else {
        return this.wasVisible = false;
      }
    };

    TextEditorComponent.prototype.measureDimensions = function() {
      var bottom, clientWidth, hasExplicitTopAndBottom, hasInlineHeight, paddingLeft, position, ref1, ref2, ref3, top;
      if (this.editor.autoHeight == null) {
        ref1 = getComputedStyle(this.hostElement), position = ref1.position, top = ref1.top, bottom = ref1.bottom;
        hasExplicitTopAndBottom = position === 'absolute' && top !== 'auto' && bottom !== 'auto';
        hasInlineHeight = this.hostElement.style.height.length > 0;
        if (hasInlineHeight || hasExplicitTopAndBottom) {
          if (this.presenter.autoHeight) {
            this.presenter.setAutoHeight(false);
            if (hasExplicitTopAndBottom) {
              Grim.deprecate("Assigning editor " + this.editor.id + "'s height explicitly via `position: 'absolute'` and an assigned `top` and `bottom` implicitly assigns the `autoHeight` property to false on the editor.\nThis behavior is deprecated and will not be supported in the future. Please explicitly assign `autoHeight` on this editor.");
            } else if (hasInlineHeight) {
              Grim.deprecate("Assigning editor " + this.editor.id + "'s height explicitly via an inline style implicitly assigns the `autoHeight` property to false on the editor.\nThis behavior is deprecated and will not be supported in the future. Please explicitly assign `autoHeight` on this editor.");
            }
          }
        } else {
          this.presenter.setAutoHeight(true);
        }
      }
      if (this.presenter.autoHeight) {
        this.presenter.setExplicitHeight(null);
      } else if (this.hostElement.offsetHeight > 0) {
        this.presenter.setExplicitHeight(this.hostElement.offsetHeight);
      }
      clientWidth = this.scrollViewNode.clientWidth;
      paddingLeft = parseInt(getComputedStyle(this.scrollViewNode).paddingLeft);
      clientWidth -= paddingLeft;
      if (clientWidth > 0) {
        this.presenter.setContentFrameWidth(clientWidth);
      }
      this.presenter.setGutterWidth((ref2 = (ref3 = this.gutterContainerComponent) != null ? ref3.getDomNode().offsetWidth : void 0) != null ? ref2 : 0);
      return this.presenter.setBoundingClientRect(this.hostElement.getBoundingClientRect());
    };

    TextEditorComponent.prototype.measureWindowSize = function() {
      if (!this.mounted) {
        return;
      }
      return this.presenter.setWindowSize(window.innerWidth, window.innerHeight);
    };

    TextEditorComponent.prototype.sampleFontStyling = function() {
      var oldFontFamily, oldFontSize, oldLineHeight, ref1;
      oldFontSize = this.fontSize;
      oldFontFamily = this.fontFamily;
      oldLineHeight = this.lineHeight;
      ref1 = getComputedStyle(this.getTopmostDOMNode()), this.fontSize = ref1.fontSize, this.fontFamily = ref1.fontFamily, this.lineHeight = ref1.lineHeight;
      if (this.fontSize !== oldFontSize || this.fontFamily !== oldFontFamily || this.lineHeight !== oldLineHeight) {
        this.clearPoolAfterUpdate = true;
        this.measureLineHeightAndDefaultCharWidth();
        return this.invalidateMeasurements();
      }
    };

    TextEditorComponent.prototype.sampleBackgroundColors = function(suppressUpdate) {
      var backgroundColor, gutterBackgroundColor, lineNumberGutter, ref1;
      backgroundColor = getComputedStyle(this.hostElement).backgroundColor;
      this.presenter.setBackgroundColor(backgroundColor);
      lineNumberGutter = (ref1 = this.gutterContainerComponent) != null ? ref1.getLineNumberGutterComponent() : void 0;
      if (lineNumberGutter) {
        gutterBackgroundColor = getComputedStyle(lineNumberGutter.getDomNode()).backgroundColor;
        return this.presenter.setGutterBackgroundColor(gutterBackgroundColor);
      }
    };

    TextEditorComponent.prototype.measureLineHeightAndDefaultCharWidth = function() {
      if (this.isVisible()) {
        this.measureLineHeightAndDefaultCharWidthWhenShown = false;
        return this.linesComponent.measureLineHeightAndDefaultCharWidth();
      } else {
        return this.measureLineHeightAndDefaultCharWidthWhenShown = true;
      }
    };

    TextEditorComponent.prototype.measureScrollbars = function() {
      var cornerNode, height, originalDisplayValue, width;
      this.measureScrollbarsWhenShown = false;
      cornerNode = this.scrollbarCornerComponent.getDomNode();
      originalDisplayValue = cornerNode.style.display;
      cornerNode.style.display = 'block';
      width = (cornerNode.offsetWidth - cornerNode.clientWidth) || 15;
      height = (cornerNode.offsetHeight - cornerNode.clientHeight) || 15;
      this.presenter.setVerticalScrollbarWidth(width);
      this.presenter.setHorizontalScrollbarHeight(height);
      return cornerNode.style.display = originalDisplayValue;
    };

    TextEditorComponent.prototype.containsScrollbarSelector = function(stylesheet) {
      var i, len, ref1, ref2, rule;
      ref1 = stylesheet.cssRules;
      for (i = 0, len = ref1.length; i < len; i++) {
        rule = ref1[i];
        if (((ref2 = rule.selectorText) != null ? ref2.indexOf('scrollbar') : void 0) > -1) {
          return true;
        }
      }
      return false;
    };

    TextEditorComponent.prototype.refreshScrollbars = function() {
      var cornerNode, horizontalNode, originalCornerDisplayValue, originalHorizontalDisplayValue, originalVerticalDisplayValue, verticalNode;
      if (this.isVisible()) {
        this.measureScrollbarsWhenShown = false;
      } else {
        this.measureScrollbarsWhenShown = true;
        return;
      }
      verticalNode = this.verticalScrollbarComponent.getDomNode();
      horizontalNode = this.horizontalScrollbarComponent.getDomNode();
      cornerNode = this.scrollbarCornerComponent.getDomNode();
      originalVerticalDisplayValue = verticalNode.style.display;
      originalHorizontalDisplayValue = horizontalNode.style.display;
      originalCornerDisplayValue = cornerNode.style.display;
      verticalNode.style.display = 'none';
      horizontalNode.style.display = 'none';
      cornerNode.style.display = 'none';
      cornerNode.offsetWidth;
      this.measureScrollbars();
      verticalNode.style.display = originalVerticalDisplayValue;
      horizontalNode.style.display = originalHorizontalDisplayValue;
      return cornerNode.style.display = originalCornerDisplayValue;
    };

    TextEditorComponent.prototype.consolidateSelections = function(e) {
      if (!this.editor.consolidateSelections()) {
        return e.abortKeyBinding();
      }
    };

    TextEditorComponent.prototype.lineNodeForScreenRow = function(screenRow) {
      return this.linesComponent.lineNodeForScreenRow(screenRow);
    };

    TextEditorComponent.prototype.lineNumberNodeForScreenRow = function(screenRow) {
      var gutterComponent, tileComponent, tileRow;
      tileRow = this.presenter.tileForRow(screenRow);
      gutterComponent = this.gutterContainerComponent.getLineNumberGutterComponent();
      tileComponent = gutterComponent.getComponentForTile(tileRow);
      return tileComponent != null ? tileComponent.lineNumberNodeForScreenRow(screenRow) : void 0;
    };

    TextEditorComponent.prototype.tileNodesForLines = function() {
      return this.linesComponent.getTiles();
    };

    TextEditorComponent.prototype.tileNodesForLineNumbers = function() {
      var gutterComponent;
      gutterComponent = this.gutterContainerComponent.getLineNumberGutterComponent();
      return gutterComponent.getTiles();
    };

    TextEditorComponent.prototype.screenRowForNode = function(node) {
      var ref1, screenRow;
      while (node != null) {
        if (screenRow = (ref1 = node.dataset) != null ? ref1.screenRow : void 0) {
          return parseInt(screenRow);
        }
        node = node.parentElement;
      }
      return null;
    };

    TextEditorComponent.prototype.getFontSize = function() {
      return parseInt(getComputedStyle(this.getTopmostDOMNode()).fontSize);
    };

    TextEditorComponent.prototype.setFontSize = function(fontSize) {
      this.getTopmostDOMNode().style.fontSize = fontSize + 'px';
      this.sampleFontStyling();
      return this.invalidateMeasurements();
    };

    TextEditorComponent.prototype.getFontFamily = function() {
      return getComputedStyle(this.getTopmostDOMNode()).fontFamily;
    };

    TextEditorComponent.prototype.setFontFamily = function(fontFamily) {
      this.getTopmostDOMNode().style.fontFamily = fontFamily;
      this.sampleFontStyling();
      return this.invalidateMeasurements();
    };

    TextEditorComponent.prototype.setLineHeight = function(lineHeight) {
      this.getTopmostDOMNode().style.lineHeight = lineHeight;
      this.sampleFontStyling();
      return this.invalidateMeasurements();
    };

    TextEditorComponent.prototype.invalidateMeasurements = function() {
      this.linesYardstick.invalidateCache();
      return this.presenter.measurementsChanged();
    };

    TextEditorComponent.prototype.screenPositionForMouseEvent = function(event, linesClientRect) {
      var pixelPosition;
      pixelPosition = this.pixelPositionForMouseEvent(event, linesClientRect);
      return this.screenPositionForPixelPosition(pixelPosition);
    };

    TextEditorComponent.prototype.pixelPositionForMouseEvent = function(event, linesClientRect) {
      var bottom, clientX, clientY, left, right, top;
      clientX = event.clientX, clientY = event.clientY;
      if (linesClientRect == null) {
        linesClientRect = this.linesComponent.getDomNode().getBoundingClientRect();
      }
      top = clientY - linesClientRect.top + this.presenter.getRealScrollTop();
      left = clientX - linesClientRect.left + this.presenter.getRealScrollLeft();
      bottom = linesClientRect.top + this.presenter.getRealScrollTop() + linesClientRect.height - clientY;
      right = linesClientRect.left + this.presenter.getRealScrollLeft() + linesClientRect.width - clientX;
      return {
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    };

    TextEditorComponent.prototype.getGutterWidth = function() {
      return this.presenter.getGutterWidth();
    };

    TextEditorComponent.prototype.getModel = function() {
      return this.editor;
    };

    TextEditorComponent.prototype.isInputEnabled = function() {
      return this.inputEnabled;
    };

    TextEditorComponent.prototype.setInputEnabled = function(inputEnabled) {
      this.inputEnabled = inputEnabled;
      return this.inputEnabled;
    };

    TextEditorComponent.prototype.setContinuousReflow = function(continuousReflow) {
      return this.presenter.setContinuousReflow(continuousReflow);
    };

    TextEditorComponent.prototype.updateParentViewFocusedClassIfNeeded = function() {
      if (this.oldState.focused !== this.newState.focused) {
        this.hostElement.classList.toggle('is-focused', this.newState.focused);
        return this.oldState.focused = this.newState.focused;
      }
    };

    TextEditorComponent.prototype.updateParentViewMiniClass = function() {
      return this.hostElement.classList.toggle('mini', this.editor.isMini());
    };

    return TextEditorComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90ZXh0LWVkaXRvci1jb21wb25lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2VEFBQTtJQUFBOztFQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLGlCQUFSOztFQUNqQixNQUFpQixPQUFBLENBQVEsYUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1Asc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUN2QixjQUFlLE9BQUEsQ0FBUSxVQUFSOztFQUNoQixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLHlCQUFSOztFQUN0Qix3QkFBQSxHQUEyQixPQUFBLENBQVEsOEJBQVI7O0VBQzNCLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUNqQixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDakIsa0NBQUEsR0FBcUMsT0FBQSxDQUFRLDBDQUFSOztFQUNyQyxrQkFBQSxHQUFxQixPQUFBLENBQVEsdUJBQVI7O0VBQ3JCLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSw4QkFBUjs7RUFDM0IsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG9CQUFSOztFQUNqQixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDakIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7RUFFZixNQUFNLENBQUMsT0FBUCxHQUNNO2tDQUNKLGlCQUFBLEdBQW1COztrQ0FDbkIsc0JBQUEsR0FBd0I7O2tDQUN4QixRQUFBLEdBQVU7O2tDQUVWLGdCQUFBLEdBQWtCOztrQ0FDbEIsaUJBQUEsR0FBbUI7O2tDQUNuQixlQUFBLEdBQWlCOztrQ0FDakIsYUFBQSxHQUFl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QUR5Qjs7Ozs7QUE5OEI3QiIsInNvdXJjZXNDb250ZW50IjpbInNjcm9sbGJhclN0eWxlID0gcmVxdWlyZSAnc2Nyb2xsYmFyLXN0eWxlJ1xue1JhbmdlLCBQb2ludH0gPSByZXF1aXJlICd0ZXh0LWJ1ZmZlcidcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbntpcGNSZW5kZXJlcn0gPSByZXF1aXJlICdlbGVjdHJvbidcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuXG5UZXh0RWRpdG9yUHJlc2VudGVyID0gcmVxdWlyZSAnLi90ZXh0LWVkaXRvci1wcmVzZW50ZXInXG5HdXR0ZXJDb250YWluZXJDb21wb25lbnQgPSByZXF1aXJlICcuL2d1dHRlci1jb250YWluZXItY29tcG9uZW50J1xuSW5wdXRDb21wb25lbnQgPSByZXF1aXJlICcuL2lucHV0LWNvbXBvbmVudCdcbkxpbmVzQ29tcG9uZW50ID0gcmVxdWlyZSAnLi9saW5lcy1jb21wb25lbnQnXG5PZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zQ29tcG9uZW50ID0gcmVxdWlyZSAnLi9vZmYtc2NyZWVuLWJsb2NrLWRlY29yYXRpb25zLWNvbXBvbmVudCdcblNjcm9sbGJhckNvbXBvbmVudCA9IHJlcXVpcmUgJy4vc2Nyb2xsYmFyLWNvbXBvbmVudCdcblNjcm9sbGJhckNvcm5lckNvbXBvbmVudCA9IHJlcXVpcmUgJy4vc2Nyb2xsYmFyLWNvcm5lci1jb21wb25lbnQnXG5PdmVybGF5TWFuYWdlciA9IHJlcXVpcmUgJy4vb3ZlcmxheS1tYW5hZ2VyJ1xuRE9NRWxlbWVudFBvb2wgPSByZXF1aXJlICcuL2RvbS1lbGVtZW50LXBvb2wnXG5MaW5lc1lhcmRzdGljayA9IHJlcXVpcmUgJy4vbGluZXMteWFyZHN0aWNrJ1xuTGluZVRvcEluZGV4ID0gcmVxdWlyZSAnbGluZS10b3AtaW5kZXgnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRleHRFZGl0b3JDb21wb25lbnRcbiAgY3Vyc29yQmxpbmtQZXJpb2Q6IDgwMFxuICBjdXJzb3JCbGlua1Jlc3VtZURlbGF5OiAxMDBcbiAgdGlsZVNpemU6IDEyXG5cbiAgcGVuZGluZ1Njcm9sbFRvcDogbnVsbFxuICBwZW5kaW5nU2Nyb2xsTGVmdDogbnVsbFxuICB1cGRhdGVSZXF1ZXN0ZWQ6IGZhbHNlXG4gIHVwZGF0ZXNQYXVzZWQ6IGZhbHNlXG4gIHVwZGF0ZVJlcXVlc3RlZFdoaWxlUGF1c2VkOiBmYWxzZVxuICBoZWlnaHRBbmRXaWR0aE1lYXN1cmVtZW50UmVxdWVzdGVkOiBmYWxzZVxuICBpbnB1dEVuYWJsZWQ6IHRydWVcbiAgbWVhc3VyZVNjcm9sbGJhcnNXaGVuU2hvd246IHRydWVcbiAgbWVhc3VyZUxpbmVIZWlnaHRBbmREZWZhdWx0Q2hhcldpZHRoV2hlblNob3duOiB0cnVlXG4gIHN0eWxpbmdDaGFuZ2VBbmltYXRpb25GcmFtZVJlcXVlc3RlZDogZmFsc2VcbiAgZ3V0dGVyQ29tcG9uZW50OiBudWxsXG4gIG1vdW50ZWQ6IHRydWVcbiAgaW5pdGlhbGl6ZWQ6IGZhbHNlXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsIFwiZG9tTm9kZVwiLFxuICAgIGdldDogLT4gQGRvbU5vZGVWYWx1ZVxuICAgIHNldDogKGRvbU5vZGUpIC0+XG4gICAgICBAYXNzZXJ0IGRvbU5vZGU/LCBcIlRleHRFZGl0b3JDb21wb25lbnQ6OmRvbU5vZGUgd2FzIHNldCB0byBudWxsLlwiXG4gICAgICBAZG9tTm9kZVZhbHVlID0gZG9tTm9kZVxuXG4gIGNvbnN0cnVjdG9yOiAoe0BlZGl0b3IsIEBob3N0RWxlbWVudCwgdGlsZVNpemUsIEB2aWV3cywgQHRoZW1lcywgQHN0eWxlcywgQGFzc2VydH0pIC0+XG4gICAgQHRpbGVTaXplID0gdGlsZVNpemUgaWYgdGlsZVNpemU/XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIGxpbmVUb3BJbmRleCA9IG5ldyBMaW5lVG9wSW5kZXgoe1xuICAgICAgZGVmYXVsdExpbmVIZWlnaHQ6IEBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKClcbiAgICB9KVxuICAgIEBwcmVzZW50ZXIgPSBuZXcgVGV4dEVkaXRvclByZXNlbnRlclxuICAgICAgbW9kZWw6IEBlZGl0b3JcbiAgICAgIHRpbGVTaXplOiB0aWxlU2l6ZVxuICAgICAgY3Vyc29yQmxpbmtQZXJpb2Q6IEBjdXJzb3JCbGlua1BlcmlvZFxuICAgICAgY3Vyc29yQmxpbmtSZXN1bWVEZWxheTogQGN1cnNvckJsaW5rUmVzdW1lRGVsYXlcbiAgICAgIHN0b3BwZWRTY3JvbGxpbmdEZWxheTogMjAwXG4gICAgICBsaW5lVG9wSW5kZXg6IGxpbmVUb3BJbmRleFxuICAgICAgYXV0b0hlaWdodDogQGVkaXRvci5nZXRBdXRvSGVpZ2h0KClcblxuICAgIEBwcmVzZW50ZXIub25EaWRVcGRhdGVTdGF0ZShAcmVxdWVzdFVwZGF0ZSlcblxuICAgIEBkb21FbGVtZW50UG9vbCA9IG5ldyBET01FbGVtZW50UG9vbFxuICAgIEBkb21Ob2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZG9tTm9kZS5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItY29udGVudHMtLXByaXZhdGUnKVxuXG4gICAgQG92ZXJsYXlNYW5hZ2VyID0gbmV3IE92ZXJsYXlNYW5hZ2VyKEBwcmVzZW50ZXIsIEBkb21Ob2RlLCBAdmlld3MpXG5cbiAgICBAc2Nyb2xsVmlld05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBzY3JvbGxWaWV3Tm9kZS5jbGFzc0xpc3QuYWRkKCdzY3JvbGwtdmlldycpXG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQHNjcm9sbFZpZXdOb2RlKVxuXG4gICAgQGhpZGRlbklucHV0Q29tcG9uZW50ID0gbmV3IElucHV0Q29tcG9uZW50XG4gICAgQHNjcm9sbFZpZXdOb2RlLmFwcGVuZENoaWxkKEBoaWRkZW5JbnB1dENvbXBvbmVudC5nZXREb21Ob2RlKCkpXG4gICAgIyBBZGQgYSBnZXRNb2RlbCBtZXRob2QgdG8gdGhlIGhpZGRlbiBpbnB1dCBjb21wb25lbnQgdG8gbWFrZSBpdCBlYXN5IHRvXG4gICAgIyBhY2Nlc3MgdGhlIGVkaXRvciBpbiByZXNwb25zZSB0byBET00gZXZlbnRzIG9yIHdoZW4gdXNpbmdcbiAgICAjIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuXG4gICAgQGhpZGRlbklucHV0Q29tcG9uZW50LmdldERvbU5vZGUoKS5nZXRNb2RlbCA9ID0+IEBlZGl0b3JcblxuICAgIEBsaW5lc0NvbXBvbmVudCA9IG5ldyBMaW5lc0NvbXBvbmVudCh7QHByZXNlbnRlciwgQGRvbUVsZW1lbnRQb29sLCBAYXNzZXJ0LCBAZ3JhbW1hcnMsIEB2aWV3c30pXG4gICAgQHNjcm9sbFZpZXdOb2RlLmFwcGVuZENoaWxkKEBsaW5lc0NvbXBvbmVudC5nZXREb21Ob2RlKCkpXG5cbiAgICBAb2ZmU2NyZWVuQmxvY2tEZWNvcmF0aW9uc0NvbXBvbmVudCA9IG5ldyBPZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zQ29tcG9uZW50KHtAcHJlc2VudGVyLCBAdmlld3N9KVxuICAgIEBzY3JvbGxWaWV3Tm9kZS5hcHBlbmRDaGlsZChAb2ZmU2NyZWVuQmxvY2tEZWNvcmF0aW9uc0NvbXBvbmVudC5nZXREb21Ob2RlKCkpXG5cbiAgICBAbGluZXNZYXJkc3RpY2sgPSBuZXcgTGluZXNZYXJkc3RpY2soQGVkaXRvciwgQGxpbmVzQ29tcG9uZW50LCBsaW5lVG9wSW5kZXgpXG4gICAgQHByZXNlbnRlci5zZXRMaW5lc1lhcmRzdGljayhAbGluZXNZYXJkc3RpY2spXG5cbiAgICBAaG9yaXpvbnRhbFNjcm9sbGJhckNvbXBvbmVudCA9IG5ldyBTY3JvbGxiYXJDb21wb25lbnQoe29yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsIG9uU2Nyb2xsOiBAb25Ib3Jpem9udGFsU2Nyb2xsfSlcbiAgICBAc2Nyb2xsVmlld05vZGUuYXBwZW5kQ2hpbGQoQGhvcml6b250YWxTY3JvbGxiYXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpKVxuXG4gICAgQHZlcnRpY2FsU2Nyb2xsYmFyQ29tcG9uZW50ID0gbmV3IFNjcm9sbGJhckNvbXBvbmVudCh7b3JpZW50YXRpb246ICd2ZXJ0aWNhbCcsIG9uU2Nyb2xsOiBAb25WZXJ0aWNhbFNjcm9sbH0pXG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQHZlcnRpY2FsU2Nyb2xsYmFyQ29tcG9uZW50LmdldERvbU5vZGUoKSlcblxuICAgIEBzY3JvbGxiYXJDb3JuZXJDb21wb25lbnQgPSBuZXcgU2Nyb2xsYmFyQ29ybmVyQ29tcG9uZW50XG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQHNjcm9sbGJhckNvcm5lckNvbXBvbmVudC5nZXREb21Ob2RlKCkpXG5cbiAgICBAb2JzZXJ2ZUVkaXRvcigpXG4gICAgQGxpc3RlbkZvckRPTUV2ZW50cygpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBzdHlsZXMub25EaWRBZGRTdHlsZUVsZW1lbnQgQG9uU3R5bGVzaGVldHNDaGFuZ2VkXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAc3R5bGVzLm9uRGlkVXBkYXRlU3R5bGVFbGVtZW50IEBvblN0eWxlc2hlZXRzQ2hhbmdlZFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHN0eWxlcy5vbkRpZFJlbW92ZVN0eWxlRWxlbWVudCBAb25TdHlsZXNoZWV0c0NoYW5nZWRcbiAgICB1bmxlc3MgQHRoZW1lcy5pc0luaXRpYWxMb2FkQ29tcGxldGUoKVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAdGhlbWVzLm9uRGlkQ2hhbmdlQWN0aXZlVGhlbWVzIEBvbkFsbFRoZW1lc0xvYWRlZFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgc2Nyb2xsYmFyU3R5bGUub25EaWRDaGFuZ2VQcmVmZXJyZWRTY3JvbGxiYXJTdHlsZSBAcmVmcmVzaFNjcm9sbGJhcnNcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpZXdzLnBvbGxEb2N1bWVudChAcG9sbERPTSlcblxuICAgIEB1cGRhdGVTeW5jKClcbiAgICBAY2hlY2tGb3JWaXNpYmlsaXR5Q2hhbmdlKClcbiAgICBAaW5pdGlhbGl6ZWQgPSB0cnVlXG5cbiAgZGVzdHJveTogLT5cbiAgICBAbW91bnRlZCA9IGZhbHNlXG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEBwcmVzZW50ZXIuZGVzdHJveSgpXG4gICAgQGd1dHRlckNvbnRhaW5lckNvbXBvbmVudD8uZGVzdHJveSgpXG4gICAgQGRvbUVsZW1lbnRQb29sLmNsZWFyKClcblxuICAgIEB2ZXJ0aWNhbFNjcm9sbGJhckNvbXBvbmVudC5kZXN0cm95KClcbiAgICBAaG9yaXpvbnRhbFNjcm9sbGJhckNvbXBvbmVudC5kZXN0cm95KClcblxuICAgIEBvblZlcnRpY2FsU2Nyb2xsID0gbnVsbFxuICAgIEBvbkhvcml6b250YWxTY3JvbGwgPSBudWxsXG5cbiAgZ2V0RG9tTm9kZTogLT5cbiAgICBAZG9tTm9kZVxuXG4gIHVwZGF0ZVN5bmM6IC0+XG4gICAgQHVwZGF0ZVN5bmNQcmVNZWFzdXJlbWVudCgpXG5cbiAgICBAb2xkU3RhdGUgPz0ge3dpZHRoOiBudWxsfVxuICAgIEBuZXdTdGF0ZSA9IEBwcmVzZW50ZXIuZ2V0UG9zdE1lYXN1cmVtZW50U3RhdGUoKVxuXG4gICAgaWYgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCk/IGFuZCBub3QgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNFbXB0eSgpXG4gICAgICBAZG9tTm9kZS5jbGFzc0xpc3QuYWRkKCdoYXMtc2VsZWN0aW9uJylcbiAgICBlbHNlXG4gICAgICBAZG9tTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtc2VsZWN0aW9uJylcblxuICAgIGlmIEBuZXdTdGF0ZS5mb2N1c2VkIGlzbnQgQG9sZFN0YXRlLmZvY3VzZWRcbiAgICAgIEBkb21Ob2RlLmNsYXNzTGlzdC50b2dnbGUoJ2lzLWZvY3VzZWQnLCBAbmV3U3RhdGUuZm9jdXNlZClcblxuICAgIEBwZXJmb3JtZWRJbml0aWFsTWVhc3VyZW1lbnQgPSBmYWxzZSBpZiBAZWRpdG9yLmlzRGVzdHJveWVkKClcblxuICAgIGlmIEBwZXJmb3JtZWRJbml0aWFsTWVhc3VyZW1lbnRcbiAgICAgIGlmIEBuZXdTdGF0ZS5oZWlnaHQgaXNudCBAb2xkU3RhdGUuaGVpZ2h0XG4gICAgICAgIGlmIEBuZXdTdGF0ZS5oZWlnaHQ/XG4gICAgICAgICAgQGRvbU5vZGUuc3R5bGUuaGVpZ2h0ID0gQG5ld1N0YXRlLmhlaWdodCArICdweCdcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkb21Ob2RlLnN0eWxlLmhlaWdodCA9ICcnXG5cbiAgICAgIGlmIEBuZXdTdGF0ZS53aWR0aCBpc250IEBvbGRTdGF0ZS53aWR0aFxuICAgICAgICBpZiBAbmV3U3RhdGUud2lkdGg/XG4gICAgICAgICAgQGhvc3RFbGVtZW50LnN0eWxlLndpZHRoID0gQG5ld1N0YXRlLndpZHRoICsgJ3B4J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgQGhvc3RFbGVtZW50LnN0eWxlLndpZHRoID0gJydcbiAgICAgICAgQG9sZFN0YXRlLndpZHRoID0gQG5ld1N0YXRlLndpZHRoXG5cbiAgICBpZiBAbmV3U3RhdGUuZ3V0dGVycy5sZW5ndGhcbiAgICAgIEBtb3VudEd1dHRlckNvbnRhaW5lckNvbXBvbmVudCgpIHVubGVzcyBAZ3V0dGVyQ29udGFpbmVyQ29tcG9uZW50P1xuICAgICAgQGd1dHRlckNvbnRhaW5lckNvbXBvbmVudC51cGRhdGVTeW5jKEBuZXdTdGF0ZSlcbiAgICBlbHNlXG4gICAgICBAZ3V0dGVyQ29udGFpbmVyQ29tcG9uZW50Py5nZXREb21Ob2RlKCk/LnJlbW92ZSgpXG4gICAgICBAZ3V0dGVyQ29udGFpbmVyQ29tcG9uZW50ID0gbnVsbFxuXG4gICAgQGhpZGRlbklucHV0Q29tcG9uZW50LnVwZGF0ZVN5bmMoQG5ld1N0YXRlKVxuICAgIEBvZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zQ29tcG9uZW50LnVwZGF0ZVN5bmMoQG5ld1N0YXRlKVxuICAgIEBsaW5lc0NvbXBvbmVudC51cGRhdGVTeW5jKEBuZXdTdGF0ZSlcbiAgICBAaG9yaXpvbnRhbFNjcm9sbGJhckNvbXBvbmVudC51cGRhdGVTeW5jKEBuZXdTdGF0ZSlcbiAgICBAdmVydGljYWxTY3JvbGxiYXJDb21wb25lbnQudXBkYXRlU3luYyhAbmV3U3RhdGUpXG4gICAgQHNjcm9sbGJhckNvcm5lckNvbXBvbmVudC51cGRhdGVTeW5jKEBuZXdTdGF0ZSlcblxuICAgIEBvdmVybGF5TWFuYWdlcj8ucmVuZGVyKEBuZXdTdGF0ZSlcblxuICAgIGlmIEBjbGVhclBvb2xBZnRlclVwZGF0ZVxuICAgICAgQGRvbUVsZW1lbnRQb29sLmNsZWFyKClcbiAgICAgIEBjbGVhclBvb2xBZnRlclVwZGF0ZSA9IGZhbHNlXG5cbiAgICBpZiBAZWRpdG9yLmlzQWxpdmUoKVxuICAgICAgQHVwZGF0ZVBhcmVudFZpZXdGb2N1c2VkQ2xhc3NJZk5lZWRlZCgpXG4gICAgICBAdXBkYXRlUGFyZW50Vmlld01pbmlDbGFzcygpXG5cbiAgdXBkYXRlU3luY1ByZU1lYXN1cmVtZW50OiAtPlxuICAgIEBsaW5lc0NvbXBvbmVudC51cGRhdGVTeW5jKEBwcmVzZW50ZXIuZ2V0UHJlTWVhc3VyZW1lbnRTdGF0ZSgpKVxuXG4gIHJlYWRBZnRlclVwZGF0ZVN5bmM6ID0+XG4gICAgQG92ZXJsYXlNYW5hZ2VyPy5tZWFzdXJlT3ZlcmxheXMoKVxuICAgIEBsaW5lc0NvbXBvbmVudC5tZWFzdXJlQmxvY2tEZWNvcmF0aW9ucygpXG4gICAgQG9mZlNjcmVlbkJsb2NrRGVjb3JhdGlvbnNDb21wb25lbnQubWVhc3VyZUJsb2NrRGVjb3JhdGlvbnMoKVxuXG4gIG1vdW50R3V0dGVyQ29udGFpbmVyQ29tcG9uZW50OiAtPlxuICAgIEBndXR0ZXJDb250YWluZXJDb21wb25lbnQgPSBuZXcgR3V0dGVyQ29udGFpbmVyQ29tcG9uZW50KHtAZWRpdG9yLCBAb25MaW5lTnVtYmVyR3V0dGVyTW91c2VEb3duLCBAZG9tRWxlbWVudFBvb2wsIEB2aWV3c30pXG4gICAgQGRvbU5vZGUuaW5zZXJ0QmVmb3JlKEBndXR0ZXJDb250YWluZXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpLCBAZG9tTm9kZS5maXJzdENoaWxkKVxuXG4gIGJlY2FtZVZpc2libGU6IC0+XG4gICAgQHVwZGF0ZXNQYXVzZWQgPSB0cnVlXG4gICAgIyBBbHdheXMgaW52YWxpZGF0ZSBMaW5lc1lhcmRzdGljayBtZWFzdXJlbWVudHMgd2hlbiB0aGUgZWRpdG9yIGJlY29tZXNcbiAgICAjIHZpc2libGUgYWdhaW4sIGJlY2F1c2UgY29udGVudCBtaWdodCBoYXZlIGJlZW4gcmVmbG93ZWQgYW5kIG1lYXN1cmVtZW50c1xuICAgICMgY291bGQgYmUgb3V0ZGF0ZWQuXG4gICAgQGludmFsaWRhdGVNZWFzdXJlbWVudHMoKVxuICAgIEBtZWFzdXJlU2Nyb2xsYmFycygpIGlmIEBtZWFzdXJlU2Nyb2xsYmFyc1doZW5TaG93blxuICAgIEBzYW1wbGVGb250U3R5bGluZygpXG4gICAgQHNhbXBsZUJhY2tncm91bmRDb2xvcnMoKVxuICAgIEBtZWFzdXJlV2luZG93U2l6ZSgpXG4gICAgQG1lYXN1cmVEaW1lbnNpb25zKClcbiAgICBAbWVhc3VyZUxpbmVIZWlnaHRBbmREZWZhdWx0Q2hhcldpZHRoKCkgaWYgQG1lYXN1cmVMaW5lSGVpZ2h0QW5kRGVmYXVsdENoYXJXaWR0aFdoZW5TaG93blxuICAgIEBlZGl0b3Iuc2V0VmlzaWJsZSh0cnVlKVxuICAgIEBwZXJmb3JtZWRJbml0aWFsTWVhc3VyZW1lbnQgPSB0cnVlXG4gICAgQHVwZGF0ZXNQYXVzZWQgPSBmYWxzZVxuICAgIEB1cGRhdGVTeW5jKCkgaWYgQGNhblVwZGF0ZSgpXG5cbiAgcmVxdWVzdFVwZGF0ZTogPT5cbiAgICByZXR1cm4gdW5sZXNzIEBjYW5VcGRhdGUoKVxuXG4gICAgaWYgQHVwZGF0ZXNQYXVzZWRcbiAgICAgIEB1cGRhdGVSZXF1ZXN0ZWRXaGlsZVBhdXNlZCA9IHRydWVcbiAgICAgIHJldHVyblxuXG4gICAgaWYgQGhvc3RFbGVtZW50LmlzVXBkYXRlZFN5bmNocm9ub3VzbHkoKVxuICAgICAgQHVwZGF0ZVN5bmMoKVxuICAgIGVsc2UgdW5sZXNzIEB1cGRhdGVSZXF1ZXN0ZWRcbiAgICAgIEB1cGRhdGVSZXF1ZXN0ZWQgPSB0cnVlXG4gICAgICBAdmlld3MudXBkYXRlRG9jdW1lbnQgPT5cbiAgICAgICAgQHVwZGF0ZVJlcXVlc3RlZCA9IGZhbHNlXG4gICAgICAgIEB1cGRhdGVTeW5jKCkgaWYgQGNhblVwZGF0ZSgpXG4gICAgICBAdmlld3MucmVhZERvY3VtZW50KEByZWFkQWZ0ZXJVcGRhdGVTeW5jKVxuXG4gIGNhblVwZGF0ZTogLT5cbiAgICBAbW91bnRlZCBhbmQgQGVkaXRvci5pc0FsaXZlKClcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IChmbikgLT5cbiAgICBAdXBkYXRlc1BhdXNlZCA9IHRydWVcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgIGZuKClcbiAgICAgIEB1cGRhdGVzUGF1c2VkID0gZmFsc2VcbiAgICAgIGlmIEB1cGRhdGVSZXF1ZXN0ZWRXaGlsZVBhdXNlZCBhbmQgQGNhblVwZGF0ZSgpXG4gICAgICAgIEB1cGRhdGVSZXF1ZXN0ZWRXaGlsZVBhdXNlZCA9IGZhbHNlXG4gICAgICAgIEByZXF1ZXN0VXBkYXRlKClcblxuICBnZXRUb3Btb3N0RE9NTm9kZTogLT5cbiAgICBAaG9zdEVsZW1lbnRcblxuICBvYnNlcnZlRWRpdG9yOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVkaXRvci5vYnNlcnZlR3JhbW1hcihAb25HcmFtbWFyQ2hhbmdlZClcblxuICBsaXN0ZW5Gb3JET01FdmVudHM6IC0+XG4gICAgQGRvbU5vZGUuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V3aGVlbCcsIEBvbk1vdXNlV2hlZWxcbiAgICBAZG9tTm9kZS5hZGRFdmVudExpc3RlbmVyICd0ZXh0SW5wdXQnLCBAb25UZXh0SW5wdXRcbiAgICBAc2Nyb2xsVmlld05vZGUuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgQG9uTW91c2VEb3duXG4gICAgQHNjcm9sbFZpZXdOb2RlLmFkZEV2ZW50TGlzdGVuZXIgJ3Njcm9sbCcsIEBvblNjcm9sbFZpZXdTY3JvbGxcblxuICAgIEBkZXRlY3RBY2NlbnRlZENoYXJhY3Rlck1lbnUoKVxuICAgIEBsaXN0ZW5Gb3JJTUVFdmVudHMoKVxuICAgIEB0cmFja1NlbGVjdGlvbkNsaXBib2FyZCgpIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2xpbnV4J1xuXG4gIGRldGVjdEFjY2VudGVkQ2hhcmFjdGVyTWVudTogLT5cbiAgICAjIFdlIG5lZWQgdG8gZ2V0IGNsZXZlciB0byBkZXRlY3Qgd2hlbiB0aGUgYWNjZW50ZWQgY2hhcmFjdGVyIG1lbnUgaXNcbiAgICAjIG9wZW5lZCBvbiBtYWNPUy4gVXN1YWxseSwgZXZlcnkga2V5ZG93biBldmVudCB0aGF0IGNvdWxkIGNhdXNlIGlucHV0IGlzXG4gICAgIyBmb2xsb3dlZCBieSBhIGNvcnJlc3BvbmRpbmcga2V5cHJlc3MuIEhvd2V2ZXIsIHByZXNzaW5nIGFuZCBob2xkaW5nXG4gICAgIyBsb25nIGVub3VnaCB0byBvcGVuIHRoZSBhY2NlbnRlZCBjaGFyYWN0ZXIgbWVudSBjYXVzZXMgYWRkaXRpb25hbCBrZXlkb3duXG4gICAgIyBldmVudHMgdG8gZmlyZSB0aGF0IGFyZW4ndCBmb2xsb3dlZCBieSB0aGVpciBvd24ga2V5cHJlc3MgYW5kIHRleHRJbnB1dFxuICAgICMgZXZlbnRzLlxuICAgICNcbiAgICAjIFRoZXJlZm9yZSwgd2UgYXNzdW1lIHRoZSBhY2NlbnRlZCBjaGFyYWN0ZXIgbWVudSBoYXMgYmVlbiBkZXBsb3llZCBpZixcbiAgICAjIGJlZm9yZSBvYnNlcnZpbmcgYW55IGtleXVwIGV2ZW50LCB3ZSBvYnNlcnZlIGV2ZW50cyBpbiB0aGUgZm9sbG93aW5nXG4gICAgIyBzZXF1ZW5jZTpcbiAgICAjXG4gICAgIyBrZXlkb3duKGtleUNvZGU6IFgpLCBrZXlwcmVzcywga2V5ZG93bihrZXlDb2RlOiBYKVxuICAgICNcbiAgICAjIFRoZSBrZXlDb2RlIFggbXVzdCBiZSB0aGUgc2FtZSBpbiB0aGUga2V5ZG93biBldmVudHMgdGhhdCBicmFja2V0IHRoZVxuICAgICMga2V5cHJlc3MsIG1lYW5pbmcgd2UncmUgKmhvbGRpbmcqIHRoZSBfc2FtZV8ga2V5IHdlIGludGlhbGx5IHByZXNzZWQuXG4gICAgIyBHb3QgdGhhdD9cbiAgICBsYXN0S2V5ZG93biA9IG51bGxcbiAgICBsYXN0S2V5ZG93bkJlZm9yZUtleXByZXNzID0gbnVsbFxuXG4gICAgQGRvbU5vZGUuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsIChldmVudCkgPT5cbiAgICAgIGlmIGxhc3RLZXlkb3duQmVmb3JlS2V5cHJlc3NcbiAgICAgICAgaWYgbGFzdEtleWRvd25CZWZvcmVLZXlwcmVzcy5rZXlDb2RlIGlzIGV2ZW50LmtleUNvZGVcbiAgICAgICAgICBAb3BlbmVkQWNjZW50ZWRDaGFyYWN0ZXJNZW51ID0gdHJ1ZVxuICAgICAgICBsYXN0S2V5ZG93bkJlZm9yZUtleXByZXNzID0gbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBsYXN0S2V5ZG93biA9IGV2ZW50XG5cbiAgICBAZG9tTm9kZS5hZGRFdmVudExpc3RlbmVyICdrZXlwcmVzcycsID0+XG4gICAgICBsYXN0S2V5ZG93bkJlZm9yZUtleXByZXNzID0gbGFzdEtleWRvd25cbiAgICAgIGxhc3RLZXlkb3duID0gbnVsbFxuXG4gICAgICAjIFRoaXMgY2FuY2VscyB0aGUgYWNjZW50ZWQgY2hhcmFjdGVyIGJlaGF2aW9yIGlmIHdlIHR5cGUgYSBrZXkgbm9ybWFsbHlcbiAgICAgICMgd2l0aCB0aGUgbWVudSBvcGVuLlxuICAgICAgQG9wZW5lZEFjY2VudGVkQ2hhcmFjdGVyTWVudSA9IGZhbHNlXG5cbiAgICBAZG9tTm9kZS5hZGRFdmVudExpc3RlbmVyICdrZXl1cCcsIC0+XG4gICAgICBsYXN0S2V5ZG93bkJlZm9yZUtleXByZXNzID0gbnVsbFxuICAgICAgbGFzdEtleWRvd24gPSBudWxsXG5cbiAgbGlzdGVuRm9ySU1FRXZlbnRzOiAtPlxuICAgICMgVGhlIElNRSBjb21wb3NpdGlvbiBldmVudHMgd29yayBsaWtlIHRoaXM6XG4gICAgI1xuICAgICMgVXNlciB0eXBlcyAncycsIGNocm9taXVtIHBvcHMgdXAgdGhlIGNvbXBsZXRpb24gaGVscGVyXG4gICAgIyAgIDEuIGNvbXBvc2l0aW9uc3RhcnQgZmlyZWRcbiAgICAjICAgMi4gY29tcG9zaXRpb251cGRhdGUgZmlyZWQ7IGV2ZW50LmRhdGEgPT0gJ3MnXG4gICAgIyBVc2VyIGhpdHMgYXJyb3cga2V5cyB0byBtb3ZlIGFyb3VuZCBpbiBjb21wbGV0aW9uIGhlbHBlclxuICAgICMgICAzLiBjb21wb3NpdGlvbnVwZGF0ZSBmaXJlZDsgZXZlbnQuZGF0YSA9PSAncycgZm9yIGVhY2ggYXJyeSBrZXkgcHJlc3NcbiAgICAjIFVzZXIgZXNjYXBlIHRvIGNhbmNlbFxuICAgICMgICA0LiBjb21wb3NpdGlvbmVuZCBmaXJlZFxuICAgICMgT1IgVXNlciBjaG9vc2VzIGEgY29tcGxldGlvblxuICAgICMgICA0LiBjb21wb3NpdGlvbmVuZCBmaXJlZFxuICAgICMgICA1LiB0ZXh0SW5wdXQgZmlyZWQ7IGV2ZW50LmRhdGEgPT0gdGhlIGNvbXBsZXRpb24gc3RyaW5nXG5cbiAgICBjaGVja3BvaW50ID0gbnVsbFxuICAgIEBkb21Ob2RlLmFkZEV2ZW50TGlzdGVuZXIgJ2NvbXBvc2l0aW9uc3RhcnQnLCA9PlxuICAgICAgaWYgQG9wZW5lZEFjY2VudGVkQ2hhcmFjdGVyTWVudVxuICAgICAgICBAZWRpdG9yLnNlbGVjdExlZnQoKVxuICAgICAgICBAb3BlbmVkQWNjZW50ZWRDaGFyYWN0ZXJNZW51ID0gZmFsc2VcbiAgICAgIGNoZWNrcG9pbnQgPSBAZWRpdG9yLmNyZWF0ZUNoZWNrcG9pbnQoKVxuICAgIEBkb21Ob2RlLmFkZEV2ZW50TGlzdGVuZXIgJ2NvbXBvc2l0aW9udXBkYXRlJywgKGV2ZW50KSA9PlxuICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KGV2ZW50LmRhdGEsIHNlbGVjdDogdHJ1ZSlcbiAgICBAZG9tTm9kZS5hZGRFdmVudExpc3RlbmVyICdjb21wb3NpdGlvbmVuZCcsIChldmVudCkgPT5cbiAgICAgIEBlZGl0b3IucmV2ZXJ0VG9DaGVja3BvaW50KGNoZWNrcG9pbnQpXG4gICAgICBldmVudC50YXJnZXQudmFsdWUgPSAnJ1xuXG4gICMgTGlzdGVuIGZvciBzZWxlY3Rpb24gY2hhbmdlcyBhbmQgc3RvcmUgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCB0ZXh0XG4gICMgaW4gdGhlIHNlbGVjdGlvbiBjbGlwYm9hcmQuIFRoaXMgaXMgb25seSBhcHBsaWNhYmxlIG9uIExpbnV4LlxuICB0cmFja1NlbGVjdGlvbkNsaXBib2FyZDogLT5cbiAgICB0aW1lb3V0SWQgPSBudWxsXG4gICAgd3JpdGVTZWxlY3RlZFRleHRUb1NlbGVjdGlvbkNsaXBib2FyZCA9ID0+XG4gICAgICByZXR1cm4gaWYgQGVkaXRvci5pc0Rlc3Ryb3llZCgpXG4gICAgICBpZiBzZWxlY3RlZFRleHQgPSBAZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG4gICAgICAgICMgVGhpcyB1c2VzIGlwY1JlbmRlcmVyLnNlbmQgaW5zdGVhZCBvZiBjbGlwYm9hcmQud3JpdGVUZXh0IGJlY2F1c2VcbiAgICAgICAgIyBjbGlwYm9hcmQud3JpdGVUZXh0IGlzIGEgc3luYyBpcGNSZW5kZXJlciBjYWxsIG9uIExpbnV4IGFuZCB0aGF0XG4gICAgICAgICMgd2lsbCBzbG93IGRvd24gc2VsZWN0aW9ucy5cbiAgICAgICAgaXBjUmVuZGVyZXIuc2VuZCgnd3JpdGUtdGV4dC10by1zZWxlY3Rpb24tY2xpcGJvYXJkJywgc2VsZWN0ZWRUZXh0KVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVkaXRvci5vbkRpZENoYW5nZVNlbGVjdGlvblJhbmdlIC0+XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKVxuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCh3cml0ZVNlbGVjdGVkVGV4dFRvU2VsZWN0aW9uQ2xpcGJvYXJkKVxuXG4gIG9uR3JhbW1hckNoYW5nZWQ6ID0+XG4gICAgaWYgQHNjb3BlZENvbmZpZ0Rpc3Bvc2FibGVzP1xuICAgICAgQHNjb3BlZENvbmZpZ0Rpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgICAgQGRpc3Bvc2FibGVzLnJlbW92ZShAc2NvcGVkQ29uZmlnRGlzcG9zYWJsZXMpXG5cbiAgICBAc2NvcGVkQ29uZmlnRGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQoQHNjb3BlZENvbmZpZ0Rpc3Bvc2FibGVzKVxuXG4gIGZvY3VzZWQ6IC0+XG4gICAgaWYgQG1vdW50ZWRcbiAgICAgIEBwcmVzZW50ZXIuc2V0Rm9jdXNlZCh0cnVlKVxuICAgICAgQGhpZGRlbklucHV0Q29tcG9uZW50LmdldERvbU5vZGUoKS5mb2N1cygpXG5cbiAgYmx1cnJlZDogLT5cbiAgICBpZiBAbW91bnRlZFxuICAgICAgQHByZXNlbnRlci5zZXRGb2N1c2VkKGZhbHNlKVxuXG4gIG9uVGV4dElucHV0OiAoZXZlbnQpID0+XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgICMgV0FSTklORzogSWYgd2UgY2FsbCBwcmV2ZW50RGVmYXVsdCBvbiB0aGUgaW5wdXQgb2YgYSBzcGFjZSBjaGFyYWN0ZXIsXG4gICAgIyB0aGVuIHRoZSBicm93c2VyIGludGVycHJldHMgdGhlIHNwYWNlYmFyIGtleXByZXNzIGFzIGEgcGFnZS1kb3duIGNvbW1hbmQsXG4gICAgIyBjYXVzaW5nIHNwYWNlcyB0byBzY3JvbGwgZWxlbWVudHMgY29udGFpbmluZyBlZGl0b3JzLiBUaGlzIGlzIGltcG9zc2libGVcbiAgICAjIHRvIHRlc3QuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBldmVudC5kYXRhIGlzbnQgJyAnXG5cbiAgICByZXR1cm4gdW5sZXNzIEBpc0lucHV0RW5hYmxlZCgpXG5cbiAgICAjIFdvcmthcm91bmQgb2YgdGhlIGFjY2VudGVkIGNoYXJhY3RlciBzdWdnZXN0aW9uIGZlYXR1cmUgaW4gbWFjT1MuXG4gICAgIyBUaGlzIHdpbGwgb25seSBvY2N1ciB3aGVuIHRoZSB1c2VyIGlzIG5vdCBjb21wb3NpbmcgaW4gSU1FIG1vZGUuXG4gICAgIyBXaGVuIHRoZSB1c2VyIHNlbGVjdHMgYSBtb2RpZmllZCBjaGFyYWN0ZXIgZnJvbSB0aGUgbWFjT1MgbWVudSwgYHRleHRJbnB1dGBcbiAgICAjIHdpbGwgb2NjdXIgdHdpY2UsIG9uY2UgZm9yIHRoZSBpbml0aWFsIGNoYXJhY3RlciwgYW5kIG9uY2UgZm9yIHRoZVxuICAgICMgbW9kaWZpZWQgY2hhcmFjdGVyLiBIb3dldmVyLCBvbmx5IGEgc2luZ2xlIGtleXByZXNzIHdpbGwgaGF2ZSBmaXJlZC4gSWZcbiAgICAjIHRoaXMgaXMgdGhlIGNhc2UsIHNlbGVjdCBiYWNrd2FyZCB0byByZXBsYWNlIHRoZSBvcmlnaW5hbCBjaGFyYWN0ZXIuXG4gICAgaWYgQG9wZW5lZEFjY2VudGVkQ2hhcmFjdGVyTWVudVxuICAgICAgQGVkaXRvci5zZWxlY3RMZWZ0KClcbiAgICAgIEBvcGVuZWRBY2NlbnRlZENoYXJhY3Rlck1lbnUgPSBmYWxzZVxuXG4gICAgQGVkaXRvci5pbnNlcnRUZXh0KGV2ZW50LmRhdGEsIGdyb3VwVW5kbzogdHJ1ZSlcblxuICBvblZlcnRpY2FsU2Nyb2xsOiAoc2Nyb2xsVG9wKSA9PlxuICAgIHJldHVybiBpZiBAdXBkYXRlUmVxdWVzdGVkIG9yIHNjcm9sbFRvcCBpcyBAcHJlc2VudGVyLmdldFNjcm9sbFRvcCgpXG5cbiAgICBhbmltYXRpb25GcmFtZVBlbmRpbmcgPSBAcGVuZGluZ1Njcm9sbFRvcD9cbiAgICBAcGVuZGluZ1Njcm9sbFRvcCA9IHNjcm9sbFRvcFxuICAgIHVubGVzcyBhbmltYXRpb25GcmFtZVBlbmRpbmdcbiAgICAgIEByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgICAgcGVuZGluZ1Njcm9sbFRvcCA9IEBwZW5kaW5nU2Nyb2xsVG9wXG4gICAgICAgIEBwZW5kaW5nU2Nyb2xsVG9wID0gbnVsbFxuICAgICAgICBAcHJlc2VudGVyLnNldFNjcm9sbFRvcChwZW5kaW5nU2Nyb2xsVG9wKVxuICAgICAgICBAcHJlc2VudGVyLmNvbW1pdFBlbmRpbmdTY3JvbGxUb3BQb3NpdGlvbigpXG5cbiAgb25Ib3Jpem9udGFsU2Nyb2xsOiAoc2Nyb2xsTGVmdCkgPT5cbiAgICByZXR1cm4gaWYgQHVwZGF0ZVJlcXVlc3RlZCBvciBzY3JvbGxMZWZ0IGlzIEBwcmVzZW50ZXIuZ2V0U2Nyb2xsTGVmdCgpXG5cbiAgICBhbmltYXRpb25GcmFtZVBlbmRpbmcgPSBAcGVuZGluZ1Njcm9sbExlZnQ/XG4gICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdFxuICAgIHVubGVzcyBhbmltYXRpb25GcmFtZVBlbmRpbmdcbiAgICAgIEByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgICAgQHByZXNlbnRlci5zZXRTY3JvbGxMZWZ0KEBwZW5kaW5nU2Nyb2xsTGVmdClcbiAgICAgICAgQHByZXNlbnRlci5jb21taXRQZW5kaW5nU2Nyb2xsTGVmdFBvc2l0aW9uKClcbiAgICAgICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gbnVsbFxuXG4gIG9uTW91c2VXaGVlbDogKGV2ZW50KSA9PlxuICAgICMgT25seSBzY3JvbGwgaW4gb25lIGRpcmVjdGlvbiBhdCBhIHRpbWVcbiAgICB7d2hlZWxEZWx0YVgsIHdoZWVsRGVsdGFZfSA9IGV2ZW50XG5cbiAgICBpZiBNYXRoLmFicyh3aGVlbERlbHRhWCkgPiBNYXRoLmFicyh3aGVlbERlbHRhWSlcbiAgICAgICMgU2Nyb2xsaW5nIGhvcml6b250YWxseVxuICAgICAgcHJldmlvdXNTY3JvbGxMZWZ0ID0gQHByZXNlbnRlci5nZXRTY3JvbGxMZWZ0KClcbiAgICAgIHVwZGF0ZWRTY3JvbGxMZWZ0ID0gcHJldmlvdXNTY3JvbGxMZWZ0IC0gTWF0aC5yb3VuZCh3aGVlbERlbHRhWCAqIEBlZGl0b3IuZ2V0U2Nyb2xsU2Vuc2l0aXZpdHkoKSAvIDEwMClcblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAcHJlc2VudGVyLmNhblNjcm9sbExlZnRUbyh1cGRhdGVkU2Nyb2xsTGVmdClcbiAgICAgIEBwcmVzZW50ZXIuc2V0U2Nyb2xsTGVmdCh1cGRhdGVkU2Nyb2xsTGVmdClcbiAgICBlbHNlXG4gICAgICAjIFNjcm9sbGluZyB2ZXJ0aWNhbGx5XG4gICAgICBAcHJlc2VudGVyLnNldE1vdXNlV2hlZWxTY3JlZW5Sb3coQHNjcmVlblJvd0Zvck5vZGUoZXZlbnQudGFyZ2V0KSlcbiAgICAgIHByZXZpb3VzU2Nyb2xsVG9wID0gQHByZXNlbnRlci5nZXRTY3JvbGxUb3AoKVxuICAgICAgdXBkYXRlZFNjcm9sbFRvcCA9IHByZXZpb3VzU2Nyb2xsVG9wIC0gTWF0aC5yb3VuZCh3aGVlbERlbHRhWSAqIEBlZGl0b3IuZ2V0U2Nyb2xsU2Vuc2l0aXZpdHkoKSAvIDEwMClcblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKSBpZiBAcHJlc2VudGVyLmNhblNjcm9sbFRvcFRvKHVwZGF0ZWRTY3JvbGxUb3ApXG4gICAgICBAcHJlc2VudGVyLnNldFNjcm9sbFRvcCh1cGRhdGVkU2Nyb2xsVG9wKVxuXG4gIG9uU2Nyb2xsVmlld1Njcm9sbDogPT5cbiAgICBpZiBAbW91bnRlZFxuICAgICAgY29uc29sZS53YXJuIFwiVGV4dEVkaXRvclNjcm9sbFZpZXcgc2Nyb2xsZWQgd2hlbiBpdCBzaG91bGRuJ3QgaGF2ZS5cIlxuICAgICAgQHNjcm9sbFZpZXdOb2RlLnNjcm9sbFRvcCA9IDBcbiAgICAgIEBzY3JvbGxWaWV3Tm9kZS5zY3JvbGxMZWZ0ID0gMFxuXG4gIG9uRGlkQ2hhbmdlU2Nyb2xsVG9wOiAoY2FsbGJhY2spIC0+XG4gICAgQHByZXNlbnRlci5vbkRpZENoYW5nZVNjcm9sbFRvcChjYWxsYmFjaylcblxuICBvbkRpZENoYW5nZVNjcm9sbExlZnQ6IChjYWxsYmFjaykgLT5cbiAgICBAcHJlc2VudGVyLm9uRGlkQ2hhbmdlU2Nyb2xsTGVmdChjYWxsYmFjaylcblxuICBzZXRTY3JvbGxMZWZ0OiAoc2Nyb2xsTGVmdCkgLT5cbiAgICBAcHJlc2VudGVyLnNldFNjcm9sbExlZnQoc2Nyb2xsTGVmdClcblxuICBzZXRTY3JvbGxSaWdodDogKHNjcm9sbFJpZ2h0KSAtPlxuICAgIEBwcmVzZW50ZXIuc2V0U2Nyb2xsUmlnaHQoc2Nyb2xsUmlnaHQpXG5cbiAgc2V0U2Nyb2xsVG9wOiAoc2Nyb2xsVG9wKSAtPlxuICAgIEBwcmVzZW50ZXIuc2V0U2Nyb2xsVG9wKHNjcm9sbFRvcClcblxuICBzZXRTY3JvbGxCb3R0b206IChzY3JvbGxCb3R0b20pIC0+XG4gICAgQHByZXNlbnRlci5zZXRTY3JvbGxCb3R0b20oc2Nyb2xsQm90dG9tKVxuXG4gIGdldFNjcm9sbFRvcDogLT5cbiAgICBAcHJlc2VudGVyLmdldFNjcm9sbFRvcCgpXG5cbiAgZ2V0U2Nyb2xsTGVmdDogLT5cbiAgICBAcHJlc2VudGVyLmdldFNjcm9sbExlZnQoKVxuXG4gIGdldFNjcm9sbFJpZ2h0OiAtPlxuICAgIEBwcmVzZW50ZXIuZ2V0U2Nyb2xsUmlnaHQoKVxuXG4gIGdldFNjcm9sbEJvdHRvbTogLT5cbiAgICBAcHJlc2VudGVyLmdldFNjcm9sbEJvdHRvbSgpXG5cbiAgZ2V0U2Nyb2xsSGVpZ2h0OiAtPlxuICAgIEBwcmVzZW50ZXIuZ2V0U2Nyb2xsSGVpZ2h0KClcblxuICBnZXRTY3JvbGxXaWR0aDogLT5cbiAgICBAcHJlc2VudGVyLmdldFNjcm9sbFdpZHRoKClcblxuICBnZXRNYXhTY3JvbGxUb3A6IC0+XG4gICAgQHByZXNlbnRlci5nZXRNYXhTY3JvbGxUb3AoKVxuXG4gIGdldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6IC0+XG4gICAgQHByZXNlbnRlci5nZXRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoKClcblxuICBnZXRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0OiAtPlxuICAgIEBwcmVzZW50ZXIuZ2V0SG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCgpXG5cbiAgZ2V0VmlzaWJsZVJvd1JhbmdlOiAtPlxuICAgIEBwcmVzZW50ZXIuZ2V0VmlzaWJsZVJvd1JhbmdlKClcblxuICBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbiwgY2xpcD10cnVlKSAtPlxuICAgIHNjcmVlblBvc2l0aW9uID0gUG9pbnQuZnJvbU9iamVjdChzY3JlZW5Qb3NpdGlvbilcbiAgICBzY3JlZW5Qb3NpdGlvbiA9IEBlZGl0b3IuY2xpcFNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKSBpZiBjbGlwXG5cbiAgICB1bmxlc3MgQHByZXNlbnRlci5pc1Jvd1JlbmRlcmVkKHNjcmVlblBvc2l0aW9uLnJvdylcbiAgICAgIEBwcmVzZW50ZXIuc2V0U2NyZWVuUm93c1RvTWVhc3VyZShbc2NyZWVuUG9zaXRpb24ucm93XSlcblxuICAgIHVubGVzcyBAbGluZXNDb21wb25lbnQubGluZU5vZGVGb3JTY3JlZW5Sb3coc2NyZWVuUG9zaXRpb24ucm93KT9cbiAgICAgIEB1cGRhdGVTeW5jUHJlTWVhc3VyZW1lbnQoKVxuXG4gICAgcGl4ZWxQb3NpdGlvbiA9IEBsaW5lc1lhcmRzdGljay5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24pXG4gICAgQHByZXNlbnRlci5jbGVhclNjcmVlblJvd3NUb01lYXN1cmUoKVxuICAgIHBpeGVsUG9zaXRpb25cblxuICBzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb246IChwaXhlbFBvc2l0aW9uKSAtPlxuICAgIHJvdyA9IEBsaW5lc1lhcmRzdGljay5tZWFzdXJlZFJvd0ZvclBpeGVsUG9zaXRpb24ocGl4ZWxQb3NpdGlvbilcbiAgICBpZiByb3c/IGFuZCBub3QgQHByZXNlbnRlci5pc1Jvd1JlbmRlcmVkKHJvdylcbiAgICAgIEBwcmVzZW50ZXIuc2V0U2NyZWVuUm93c1RvTWVhc3VyZShbcm93XSlcbiAgICAgIEB1cGRhdGVTeW5jUHJlTWVhc3VyZW1lbnQoKVxuXG4gICAgcG9zaXRpb24gPSBAbGluZXNZYXJkc3RpY2suc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUG9zaXRpb24pXG4gICAgQHByZXNlbnRlci5jbGVhclNjcmVlblJvd3NUb01lYXN1cmUoKVxuICAgIHBvc2l0aW9uXG5cbiAgcGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSkgLT5cbiAgICByb3dzVG9NZWFzdXJlID0gW11cbiAgICB1bmxlc3MgQHByZXNlbnRlci5pc1Jvd1JlbmRlcmVkKHNjcmVlblJhbmdlLnN0YXJ0LnJvdylcbiAgICAgIHJvd3NUb01lYXN1cmUucHVzaChzY3JlZW5SYW5nZS5zdGFydC5yb3cpXG4gICAgdW5sZXNzIEBwcmVzZW50ZXIuaXNSb3dSZW5kZXJlZChzY3JlZW5SYW5nZS5lbmQucm93KVxuICAgICAgcm93c1RvTWVhc3VyZS5wdXNoKHNjcmVlblJhbmdlLmVuZC5yb3cpXG5cbiAgICBpZiByb3dzVG9NZWFzdXJlLmxlbmd0aCA+IDBcbiAgICAgIEBwcmVzZW50ZXIuc2V0U2NyZWVuUm93c1RvTWVhc3VyZShyb3dzVG9NZWFzdXJlKVxuICAgICAgQHVwZGF0ZVN5bmNQcmVNZWFzdXJlbWVudCgpXG5cbiAgICByZWN0ID0gQHByZXNlbnRlci5hYnNvbHV0ZVBpeGVsUmVjdEZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuXG4gICAgaWYgcm93c1RvTWVhc3VyZS5sZW5ndGggPiAwXG4gICAgICBAcHJlc2VudGVyLmNsZWFyU2NyZWVuUm93c1RvTWVhc3VyZSgpXG5cbiAgICByZWN0XG5cbiAgcGl4ZWxSYW5nZUZvclNjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UsIGNsaXA9dHJ1ZSkgLT5cbiAgICB7c3RhcnQsIGVuZH0gPSBSYW5nZS5mcm9tT2JqZWN0KHNjcmVlblJhbmdlKVxuICAgIHtzdGFydDogQHBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzdGFydCwgY2xpcCksIGVuZDogQHBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihlbmQsIGNsaXApfVxuXG4gIHBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbjogKGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIEBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oXG4gICAgICBAZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG4gICAgKVxuXG4gIGludmFsaWRhdGVCbG9ja0RlY29yYXRpb25EaW1lbnNpb25zOiAtPlxuICAgIEBwcmVzZW50ZXIuaW52YWxpZGF0ZUJsb2NrRGVjb3JhdGlvbkRpbWVuc2lvbnMoYXJndW1lbnRzLi4uKVxuXG4gIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgdW5sZXNzIGV2ZW50LmJ1dHRvbiBpcyAwIG9yIChldmVudC5idXR0b24gaXMgMSBhbmQgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnbGludXgnKVxuICAgICAgIyBPbmx5IGhhbmRsZSBtb3VzZSBkb3duIGV2ZW50cyBmb3IgbGVmdCBtb3VzZSBidXR0b24gb24gYWxsIHBsYXRmb3Jtc1xuICAgICAgIyBhbmQgbWlkZGxlIG1vdXNlIGJ1dHRvbiBvbiBMaW51eCBzaW5jZSBpdCBwYXN0ZXMgdGhlIHNlbGVjdGlvbiBjbGlwYm9hcmRcbiAgICAgIHJldHVyblxuXG4gICAgcmV0dXJuIGlmIGV2ZW50LnRhcmdldD8uY2xhc3NMaXN0LmNvbnRhaW5zKCdob3Jpem9udGFsLXNjcm9sbGJhcicpXG5cbiAgICB7ZGV0YWlsLCBzaGlmdEtleSwgbWV0YUtleSwgY3RybEtleX0gPSBldmVudFxuXG4gICAgIyBDVFJMK2NsaWNrIGJyaW5ncyB1cCB0aGUgY29udGV4dCBtZW51IG9uIG1hY09TLCBzbyBkb24ndCBoYW5kbGUgdGhvc2UgZWl0aGVyXG4gICAgcmV0dXJuIGlmIGN0cmxLZXkgYW5kIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcblxuICAgICMgUHJldmVudCBmb2N1c291dCBldmVudCBvbiBoaWRkZW4gaW5wdXQgaWYgZWRpdG9yIGlzIGFscmVhZHkgZm9jdXNlZFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgaWYgQG9sZFN0YXRlLmZvY3VzZWRcblxuICAgIHNjcmVlblBvc2l0aW9uID0gQHNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudChldmVudClcblxuICAgIGlmIGV2ZW50LnRhcmdldD8uY2xhc3NMaXN0LmNvbnRhaW5zKCdmb2xkLW1hcmtlcicpXG4gICAgICBidWZmZXJQb3NpdGlvbiA9IEBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcbiAgICAgIEBlZGl0b3IuZGVzdHJveUZvbGRzSW50ZXJzZWN0aW5nQnVmZmVyUmFuZ2UoW2J1ZmZlclBvc2l0aW9uLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgICByZXR1cm5cblxuICAgIHN3aXRjaCBkZXRhaWxcbiAgICAgIHdoZW4gMVxuICAgICAgICBpZiBzaGlmdEtleVxuICAgICAgICAgIEBlZGl0b3Iuc2VsZWN0VG9TY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcbiAgICAgICAgZWxzZSBpZiBtZXRhS2V5IG9yIChjdHJsS2V5IGFuZCBwcm9jZXNzLnBsYXRmb3JtIGlzbnQgJ2RhcndpbicpXG4gICAgICAgICAgY3Vyc29yQXRTY3JlZW5Qb3NpdGlvbiA9IEBlZGl0b3IuZ2V0Q3Vyc29yQXRTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcbiAgICAgICAgICBpZiBjdXJzb3JBdFNjcmVlblBvc2l0aW9uIGFuZCBAZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpXG4gICAgICAgICAgICBjdXJzb3JBdFNjcmVlblBvc2l0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlZGl0b3IuYWRkQ3Vyc29yQXRTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbiwgYXV0b3Njcm9sbDogZmFsc2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uLCBhdXRvc2Nyb2xsOiBmYWxzZSlcbiAgICAgIHdoZW4gMlxuICAgICAgICBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5zZWxlY3RXb3JkKGF1dG9zY3JvbGw6IGZhbHNlKVxuICAgICAgd2hlbiAzXG4gICAgICAgIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLnNlbGVjdExpbmUobnVsbCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiAgICBAaGFuZGxlRHJhZ1VudGlsTW91c2VVcCAoc2NyZWVuUG9zaXRpb24pID0+XG4gICAgICBAZWRpdG9yLnNlbGVjdFRvU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24sIHN1cHByZXNzU2VsZWN0aW9uTWVyZ2U6IHRydWUsIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gIG9uTGluZU51bWJlckd1dHRlck1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgIHJldHVybiB1bmxlc3MgZXZlbnQuYnV0dG9uIGlzIDAgIyBvbmx5IGhhbmRsZSB0aGUgbGVmdCBtb3VzZSBidXR0b25cblxuICAgIHtzaGlmdEtleSwgbWV0YUtleSwgY3RybEtleX0gPSBldmVudFxuXG4gICAgaWYgc2hpZnRLZXlcbiAgICAgIEBvbkd1dHRlclNoaWZ0Q2xpY2soZXZlbnQpXG4gICAgZWxzZSBpZiBtZXRhS2V5IG9yIChjdHJsS2V5IGFuZCBwcm9jZXNzLnBsYXRmb3JtIGlzbnQgJ2RhcndpbicpXG4gICAgICBAb25HdXR0ZXJNZXRhQ2xpY2soZXZlbnQpXG4gICAgZWxzZVxuICAgICAgQG9uR3V0dGVyQ2xpY2soZXZlbnQpXG5cbiAgb25HdXR0ZXJDbGljazogKGV2ZW50KSA9PlxuICAgIGNsaWNrZWRTY3JlZW5Sb3cgPSBAc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50KGV2ZW50KS5yb3dcbiAgICBjbGlja2VkQnVmZmVyUm93ID0gQGVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coY2xpY2tlZFNjcmVlblJvdylcbiAgICBpbml0aWFsU2NyZWVuUmFuZ2UgPSBAZWRpdG9yLnNjcmVlblJhbmdlRm9yQnVmZmVyUmFuZ2UoW1tjbGlja2VkQnVmZmVyUm93LCAwXSwgW2NsaWNrZWRCdWZmZXJSb3cgKyAxLCAwXV0pXG4gICAgQGVkaXRvci5zZXRTZWxlY3RlZFNjcmVlblJhbmdlKGluaXRpYWxTY3JlZW5SYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSwgYXV0b3Njcm9sbDogZmFsc2UpXG4gICAgQGhhbmRsZUd1dHRlckRyYWcoaW5pdGlhbFNjcmVlblJhbmdlKVxuXG4gIG9uR3V0dGVyTWV0YUNsaWNrOiAoZXZlbnQpID0+XG4gICAgY2xpY2tlZFNjcmVlblJvdyA9IEBzY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQoZXZlbnQpLnJvd1xuICAgIGNsaWNrZWRCdWZmZXJSb3cgPSBAZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhjbGlja2VkU2NyZWVuUm93KVxuICAgIGluaXRpYWxTY3JlZW5SYW5nZSA9IEBlZGl0b3Iuc2NyZWVuUmFuZ2VGb3JCdWZmZXJSYW5nZShbW2NsaWNrZWRCdWZmZXJSb3csIDBdLCBbY2xpY2tlZEJ1ZmZlclJvdyArIDEsIDBdXSlcbiAgICBAZWRpdG9yLmFkZFNlbGVjdGlvbkZvclNjcmVlblJhbmdlKGluaXRpYWxTY3JlZW5SYW5nZSwgYXV0b3Njcm9sbDogZmFsc2UpXG4gICAgQGhhbmRsZUd1dHRlckRyYWcoaW5pdGlhbFNjcmVlblJhbmdlKVxuXG4gIG9uR3V0dGVyU2hpZnRDbGljazogKGV2ZW50KSA9PlxuICAgIHRhaWxTY3JlZW5Qb3NpdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmdldFRhaWxTY3JlZW5Qb3NpdGlvbigpXG4gICAgY2xpY2tlZFNjcmVlblJvdyA9IEBzY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQoZXZlbnQpLnJvd1xuICAgIGNsaWNrZWRCdWZmZXJSb3cgPSBAZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhjbGlja2VkU2NyZWVuUm93KVxuICAgIGNsaWNrZWRMaW5lU2NyZWVuUmFuZ2UgPSBAZWRpdG9yLnNjcmVlblJhbmdlRm9yQnVmZmVyUmFuZ2UoW1tjbGlja2VkQnVmZmVyUm93LCAwXSwgW2NsaWNrZWRCdWZmZXJSb3cgKyAxLCAwXV0pXG5cbiAgICBpZiBjbGlja2VkU2NyZWVuUm93IDwgdGFpbFNjcmVlblBvc2l0aW9uLnJvd1xuICAgICAgQGVkaXRvci5zZWxlY3RUb1NjcmVlblBvc2l0aW9uKGNsaWNrZWRMaW5lU2NyZWVuUmFuZ2Uuc3RhcnQsIHN1cHByZXNzU2VsZWN0aW9uTWVyZ2U6IHRydWUsIGF1dG9zY3JvbGw6IGZhbHNlKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3Iuc2VsZWN0VG9TY3JlZW5Qb3NpdGlvbihjbGlja2VkTGluZVNjcmVlblJhbmdlLmVuZCwgc3VwcHJlc3NTZWxlY3Rpb25NZXJnZTogdHJ1ZSwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiAgICBAaGFuZGxlR3V0dGVyRHJhZyhuZXcgUmFuZ2UodGFpbFNjcmVlblBvc2l0aW9uLCB0YWlsU2NyZWVuUG9zaXRpb24pKVxuXG4gIGhhbmRsZUd1dHRlckRyYWc6IChpbml0aWFsUmFuZ2UpIC0+XG4gICAgQGhhbmRsZURyYWdVbnRpbE1vdXNlVXAgKHNjcmVlblBvc2l0aW9uKSA9PlxuICAgICAgZHJhZ1JvdyA9IHNjcmVlblBvc2l0aW9uLnJvd1xuICAgICAgaWYgZHJhZ1JvdyA8IGluaXRpYWxSYW5nZS5zdGFydC5yb3dcbiAgICAgICAgc3RhcnRQb3NpdGlvbiA9IEBlZGl0b3IuY2xpcFNjcmVlblBvc2l0aW9uKFtkcmFnUm93LCAwXSwgc2tpcFNvZnRXcmFwSW5kZW50YXRpb246IHRydWUpXG4gICAgICAgIHNjcmVlblJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0UG9zaXRpb24sIHN0YXJ0UG9zaXRpb24pLnVuaW9uKGluaXRpYWxSYW5nZSlcbiAgICAgICAgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuc2V0U2NyZWVuUmFuZ2Uoc2NyZWVuUmFuZ2UsIHJldmVyc2VkOiB0cnVlLCBhdXRvc2Nyb2xsOiBmYWxzZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgZW5kUG9zaXRpb24gPSBbZHJhZ1JvdyArIDEsIDBdXG4gICAgICAgIHNjcmVlblJhbmdlID0gbmV3IFJhbmdlKGVuZFBvc2l0aW9uLCBlbmRQb3NpdGlvbikudW5pb24oaW5pdGlhbFJhbmdlKVxuICAgICAgICBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5zZXRTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSwgcmV2ZXJzZWQ6IGZhbHNlLCBhdXRvc2Nyb2xsOiBmYWxzZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICBvblN0eWxlc2hlZXRzQ2hhbmdlZDogKHN0eWxlRWxlbWVudCkgPT5cbiAgICByZXR1cm4gdW5sZXNzIEBwZXJmb3JtZWRJbml0aWFsTWVhc3VyZW1lbnRcbiAgICByZXR1cm4gdW5sZXNzIEB0aGVtZXMuaXNJbml0aWFsTG9hZENvbXBsZXRlKClcblxuICAgICMgVGhpcyBkZWxheSBwcmV2ZW50cyB0aGUgc3R5bGluZyBmcm9tIGdvaW5nIGhheXdpcmUgd2hlbiBzdHlsZXNoZWV0cyBhcmVcbiAgICAjIHJlbG9hZGVkIGluIGRldiBtb2RlLiBJdCBzZWVtcyBsaWtlIGEgd29ya2Fyb3VuZCBmb3IgYSBicm93c2VyIGJ1ZywgYnV0XG4gICAgIyBub3QgdG90YWxseSBzdXJlLlxuXG4gICAgdW5sZXNzIEBzdHlsaW5nQ2hhbmdlQW5pbWF0aW9uRnJhbWVSZXF1ZXN0ZWRcbiAgICAgIEBzdHlsaW5nQ2hhbmdlQW5pbWF0aW9uRnJhbWVSZXF1ZXN0ZWQgPSB0cnVlXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgICAgQHN0eWxpbmdDaGFuZ2VBbmltYXRpb25GcmFtZVJlcXVlc3RlZCA9IGZhbHNlXG4gICAgICAgIGlmIEBtb3VudGVkXG4gICAgICAgICAgQHJlZnJlc2hTY3JvbGxiYXJzKCkgaWYgbm90IHN0eWxlRWxlbWVudC5zaGVldD8gb3IgQGNvbnRhaW5zU2Nyb2xsYmFyU2VsZWN0b3Ioc3R5bGVFbGVtZW50LnNoZWV0KVxuICAgICAgICAgIEBoYW5kbGVTdHlsaW5nQ2hhbmdlKClcblxuICBvbkFsbFRoZW1lc0xvYWRlZDogPT5cbiAgICBAcmVmcmVzaFNjcm9sbGJhcnMoKVxuICAgIEBoYW5kbGVTdHlsaW5nQ2hhbmdlKClcblxuICBoYW5kbGVTdHlsaW5nQ2hhbmdlOiA9PlxuICAgIEBzYW1wbGVGb250U3R5bGluZygpXG4gICAgQHNhbXBsZUJhY2tncm91bmRDb2xvcnMoKVxuICAgIEBpbnZhbGlkYXRlTWVhc3VyZW1lbnRzKClcblxuICBoYW5kbGVEcmFnVW50aWxNb3VzZVVwOiAoZHJhZ0hhbmRsZXIpIC0+XG4gICAgZHJhZ2dpbmcgPSBmYWxzZVxuICAgIGxhc3RNb3VzZVBvc2l0aW9uID0ge31cbiAgICBhbmltYXRpb25Mb29wID0gPT5cbiAgICAgIEByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgICAgaWYgZHJhZ2dpbmcgYW5kIEBtb3VudGVkXG4gICAgICAgICAgbGluZXNDbGllbnRSZWN0ID0gQGxpbmVzQ29tcG9uZW50LmdldERvbU5vZGUoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgIGF1dG9zY3JvbGwobGFzdE1vdXNlUG9zaXRpb24sIGxpbmVzQ2xpZW50UmVjdClcbiAgICAgICAgICBzY3JlZW5Qb3NpdGlvbiA9IEBzY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQobGFzdE1vdXNlUG9zaXRpb24sIGxpbmVzQ2xpZW50UmVjdClcbiAgICAgICAgICBkcmFnSGFuZGxlcihzY3JlZW5Qb3NpdGlvbilcbiAgICAgICAgICBhbmltYXRpb25Mb29wKClcbiAgICAgICAgZWxzZSBpZiBub3QgQG1vdW50ZWRcbiAgICAgICAgICBzdG9wRHJhZ2dpbmcoKVxuXG4gICAgb25Nb3VzZU1vdmUgPSAoZXZlbnQpIC0+XG4gICAgICBsYXN0TW91c2VQb3NpdGlvbi5jbGllbnRYID0gZXZlbnQuY2xpZW50WFxuICAgICAgbGFzdE1vdXNlUG9zaXRpb24uY2xpZW50WSA9IGV2ZW50LmNsaWVudFlcblxuICAgICAgIyBTdGFydCB0aGUgYW5pbWF0aW9uIGxvb3Agd2hlbiB0aGUgbW91c2UgbW92ZXMgcHJpb3IgdG8gYSBtb3VzZXVwIGV2ZW50XG4gICAgICB1bmxlc3MgZHJhZ2dpbmdcbiAgICAgICAgZHJhZ2dpbmcgPSB0cnVlXG4gICAgICAgIGFuaW1hdGlvbkxvb3AoKVxuXG4gICAgICAjIFN0b3AgZHJhZ2dpbmcgd2hlbiBjdXJzb3IgZW50ZXJzIGRldiB0b29scyBiZWNhdXNlIHdlIGNhbid0IGRldGVjdCBtb3VzZXVwXG4gICAgICBvbk1vdXNlVXAoKSBpZiBldmVudC53aGljaCBpcyAwXG5cbiAgICBvbk1vdXNlVXAgPSAoZXZlbnQpID0+XG4gICAgICBpZiBkcmFnZ2luZ1xuICAgICAgICBzdG9wRHJhZ2dpbmcoKVxuICAgICAgICBAZWRpdG9yLmZpbmFsaXplU2VsZWN0aW9ucygpXG4gICAgICAgIEBlZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICAgIHBhc3RlU2VsZWN0aW9uQ2xpcGJvYXJkKGV2ZW50KVxuXG4gICAgc3RvcERyYWdnaW5nID0gLT5cbiAgICAgIGRyYWdnaW5nID0gZmFsc2VcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSlcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKVxuICAgICAgZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgICBhdXRvc2Nyb2xsID0gKG1vdXNlQ2xpZW50UG9zaXRpb24pID0+XG4gICAgICB7dG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0fSA9IEBzY3JvbGxWaWV3Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgdG9wICs9IDMwXG4gICAgICBib3R0b20gLT0gMzBcbiAgICAgIGxlZnQgKz0gMzBcbiAgICAgIHJpZ2h0IC09IDMwXG5cbiAgICAgIGlmIG1vdXNlQ2xpZW50UG9zaXRpb24uY2xpZW50WSA8IHRvcFxuICAgICAgICBtb3VzZVlEZWx0YSA9IHRvcCAtIG1vdXNlQ2xpZW50UG9zaXRpb24uY2xpZW50WVxuICAgICAgICB5RGlyZWN0aW9uID0gLTFcbiAgICAgIGVsc2UgaWYgbW91c2VDbGllbnRQb3NpdGlvbi5jbGllbnRZID4gYm90dG9tXG4gICAgICAgIG1vdXNlWURlbHRhID0gbW91c2VDbGllbnRQb3NpdGlvbi5jbGllbnRZIC0gYm90dG9tXG4gICAgICAgIHlEaXJlY3Rpb24gPSAxXG5cbiAgICAgIGlmIG1vdXNlQ2xpZW50UG9zaXRpb24uY2xpZW50WCA8IGxlZnRcbiAgICAgICAgbW91c2VYRGVsdGEgPSBsZWZ0IC0gbW91c2VDbGllbnRQb3NpdGlvbi5jbGllbnRYXG4gICAgICAgIHhEaXJlY3Rpb24gPSAtMVxuICAgICAgZWxzZSBpZiBtb3VzZUNsaWVudFBvc2l0aW9uLmNsaWVudFggPiByaWdodFxuICAgICAgICBtb3VzZVhEZWx0YSA9IG1vdXNlQ2xpZW50UG9zaXRpb24uY2xpZW50WCAtIHJpZ2h0XG4gICAgICAgIHhEaXJlY3Rpb24gPSAxXG5cbiAgICAgIGlmIG1vdXNlWURlbHRhP1xuICAgICAgICBAcHJlc2VudGVyLnNldFNjcm9sbFRvcChAcHJlc2VudGVyLmdldFNjcm9sbFRvcCgpICsgeURpcmVjdGlvbiAqIHNjYWxlU2Nyb2xsRGVsdGEobW91c2VZRGVsdGEpKVxuICAgICAgICBAcHJlc2VudGVyLmNvbW1pdFBlbmRpbmdTY3JvbGxUb3BQb3NpdGlvbigpXG5cbiAgICAgIGlmIG1vdXNlWERlbHRhP1xuICAgICAgICBAcHJlc2VudGVyLnNldFNjcm9sbExlZnQoQHByZXNlbnRlci5nZXRTY3JvbGxMZWZ0KCkgKyB4RGlyZWN0aW9uICogc2NhbGVTY3JvbGxEZWx0YShtb3VzZVhEZWx0YSkpXG4gICAgICAgIEBwcmVzZW50ZXIuY29tbWl0UGVuZGluZ1Njcm9sbExlZnRQb3NpdGlvbigpXG5cbiAgICBzY2FsZVNjcm9sbERlbHRhID0gKHNjcm9sbERlbHRhKSAtPlxuICAgICAgTWF0aC5wb3coc2Nyb2xsRGVsdGEgLyAyLCAzKSAvIDI4MFxuXG4gICAgcGFzdGVTZWxlY3Rpb25DbGlwYm9hcmQgPSAoZXZlbnQpID0+XG4gICAgICBpZiBldmVudD8ud2hpY2ggaXMgMiBhbmQgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnbGludXgnXG4gICAgICAgIGlmIHNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vc2FmZS1jbGlwYm9hcmQnKS5yZWFkVGV4dCgnc2VsZWN0aW9uJylcbiAgICAgICAgICBAZWRpdG9yLmluc2VydFRleHQoc2VsZWN0aW9uKVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKVxuICAgIGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBkaXNwb3NhYmxlcy5hZGQoQGVkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxDaGFuZ2Uob25Nb3VzZVVwKSlcbiAgICBkaXNwb3NhYmxlcy5hZGQoQGVkaXRvci5vbkRpZERlc3Ryb3koc3RvcERyYWdnaW5nKSlcblxuICBpc1Zpc2libGU6IC0+XG4gICAgIyBJbnZlc3RpZ2F0aW5nIGFuIGV4Y2VwdGlvbiB0aGF0IG9jY3VycyBoZXJlIGR1ZSB0byA6OmRvbU5vZGUgYmVpbmcgbnVsbC5cbiAgICBAYXNzZXJ0IEBkb21Ob2RlPywgXCJUZXh0RWRpdG9yQ29tcG9uZW50Ojpkb21Ob2RlIHdhcyBudWxsLlwiLCAoZXJyb3IpID0+XG4gICAgICBlcnJvci5tZXRhZGF0YSA9IHtAaW5pdGlhbGl6ZWR9XG5cbiAgICBAZG9tTm9kZT8gYW5kIChAZG9tTm9kZS5vZmZzZXRIZWlnaHQgPiAwIG9yIEBkb21Ob2RlLm9mZnNldFdpZHRoID4gMClcblxuICBwb2xsRE9NOiA9PlxuICAgIHVubGVzcyBAY2hlY2tGb3JWaXNpYmlsaXR5Q2hhbmdlKClcbiAgICAgIEBzYW1wbGVCYWNrZ3JvdW5kQ29sb3JzKClcbiAgICAgIEBtZWFzdXJlV2luZG93U2l6ZSgpXG4gICAgICBAbWVhc3VyZURpbWVuc2lvbnMoKVxuICAgICAgQHNhbXBsZUZvbnRTdHlsaW5nKClcbiAgICAgIEBvdmVybGF5TWFuYWdlcj8ubWVhc3VyZU92ZXJsYXlzKClcblxuICBjaGVja0ZvclZpc2liaWxpdHlDaGFuZ2U6IC0+XG4gICAgaWYgQGlzVmlzaWJsZSgpXG4gICAgICBpZiBAd2FzVmlzaWJsZVxuICAgICAgICBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBAYmVjYW1lVmlzaWJsZSgpXG4gICAgICAgIEB3YXNWaXNpYmxlID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIEB3YXNWaXNpYmxlID0gZmFsc2VcblxuICAjIE1lYXN1cmUgZXhwbGljaXRseS1zdHlsZWQgaGVpZ2h0IGFuZCB3aWR0aCBhbmQgcmVsYXkgdGhlbSB0byB0aGUgbW9kZWwuIElmXG4gICMgdGhlc2UgdmFsdWVzIGFyZW4ndCBleHBsaWNpdGx5IHN0eWxlZCwgd2UgYXNzdW1lIHRoZSBlZGl0b3IgaXMgdW5jb25zdHJhaW5lZFxuICAjIGFuZCB1c2UgdGhlIHNjcm9sbEhlaWdodCAvIHNjcm9sbFdpZHRoIGFzIGl0cyBoZWlnaHQgYW5kIHdpZHRoIGluXG4gICMgY2FsY3VsYXRpb25zLlxuICBtZWFzdXJlRGltZW5zaW9uczogLT5cbiAgICAjIElmIHdlIGRvbid0IGFzc2lnbiBhdXRvSGVpZ2h0IGV4cGxpY2l0bHksIHdlIHRyeSB0byBhdXRvbWF0aWNhbGx5IGRpc2FibGVcbiAgICAjIGF1dG8taGVpZ2h0IGluIGNlcnRhaW4gY2lyY3Vtc3RhbmNlcy4gVGhpcyBpcyBsZWdhY3kgYmVoYXZpb3IgdGhhdCB3ZVxuICAgICMgd291bGQgcmF0aGVyIG5vdCBpbXBsZW1lbnQsIGJ1dCB3ZSBjYW4ndCByZW1vdmUgaXQgd2l0aG91dCByaXNraW5nXG4gICAgIyBicmVha2FnZSBjdXJyZW50bHkuXG4gICAgdW5sZXNzIEBlZGl0b3IuYXV0b0hlaWdodD9cbiAgICAgIHtwb3NpdGlvbiwgdG9wLCBib3R0b219ID0gZ2V0Q29tcHV0ZWRTdHlsZShAaG9zdEVsZW1lbnQpXG4gICAgICBoYXNFeHBsaWNpdFRvcEFuZEJvdHRvbSA9IChwb3NpdGlvbiBpcyAnYWJzb2x1dGUnIGFuZCB0b3AgaXNudCAnYXV0bycgYW5kIGJvdHRvbSBpc250ICdhdXRvJylcbiAgICAgIGhhc0lubGluZUhlaWdodCA9IEBob3N0RWxlbWVudC5zdHlsZS5oZWlnaHQubGVuZ3RoID4gMFxuXG4gICAgICBpZiBoYXNJbmxpbmVIZWlnaHQgb3IgaGFzRXhwbGljaXRUb3BBbmRCb3R0b21cbiAgICAgICAgaWYgQHByZXNlbnRlci5hdXRvSGVpZ2h0XG4gICAgICAgICAgQHByZXNlbnRlci5zZXRBdXRvSGVpZ2h0KGZhbHNlKVxuICAgICAgICAgIGlmIGhhc0V4cGxpY2l0VG9wQW5kQm90dG9tXG4gICAgICAgICAgICBHcmltLmRlcHJlY2F0ZShcIlwiXCJcbiAgICAgICAgICAgICAgQXNzaWduaW5nIGVkaXRvciAje0BlZGl0b3IuaWR9J3MgaGVpZ2h0IGV4cGxpY2l0bHkgdmlhIGBwb3NpdGlvbjogJ2Fic29sdXRlJ2AgYW5kIGFuIGFzc2lnbmVkIGB0b3BgIGFuZCBgYm90dG9tYCBpbXBsaWNpdGx5IGFzc2lnbnMgdGhlIGBhdXRvSGVpZ2h0YCBwcm9wZXJ0eSB0byBmYWxzZSBvbiB0aGUgZWRpdG9yLlxuICAgICAgICAgICAgICBUaGlzIGJlaGF2aW9yIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgbm90IGJlIHN1cHBvcnRlZCBpbiB0aGUgZnV0dXJlLiBQbGVhc2UgZXhwbGljaXRseSBhc3NpZ24gYGF1dG9IZWlnaHRgIG9uIHRoaXMgZWRpdG9yLlxuICAgICAgICAgICAgXCJcIlwiKVxuICAgICAgICAgIGVsc2UgaWYgaGFzSW5saW5lSGVpZ2h0XG4gICAgICAgICAgICBHcmltLmRlcHJlY2F0ZShcIlwiXCJcbiAgICAgICAgICAgICAgQXNzaWduaW5nIGVkaXRvciAje0BlZGl0b3IuaWR9J3MgaGVpZ2h0IGV4cGxpY2l0bHkgdmlhIGFuIGlubGluZSBzdHlsZSBpbXBsaWNpdGx5IGFzc2lnbnMgdGhlIGBhdXRvSGVpZ2h0YCBwcm9wZXJ0eSB0byBmYWxzZSBvbiB0aGUgZWRpdG9yLlxuICAgICAgICAgICAgICBUaGlzIGJlaGF2aW9yIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgbm90IGJlIHN1cHBvcnRlZCBpbiB0aGUgZnV0dXJlLiBQbGVhc2UgZXhwbGljaXRseSBhc3NpZ24gYGF1dG9IZWlnaHRgIG9uIHRoaXMgZWRpdG9yLlxuICAgICAgICAgICAgXCJcIlwiKVxuICAgICAgZWxzZVxuICAgICAgICBAcHJlc2VudGVyLnNldEF1dG9IZWlnaHQodHJ1ZSlcblxuICAgIGlmIEBwcmVzZW50ZXIuYXV0b0hlaWdodFxuICAgICAgQHByZXNlbnRlci5zZXRFeHBsaWNpdEhlaWdodChudWxsKVxuICAgIGVsc2UgaWYgQGhvc3RFbGVtZW50Lm9mZnNldEhlaWdodCA+IDBcbiAgICAgIEBwcmVzZW50ZXIuc2V0RXhwbGljaXRIZWlnaHQoQGhvc3RFbGVtZW50Lm9mZnNldEhlaWdodClcblxuICAgIGNsaWVudFdpZHRoID0gQHNjcm9sbFZpZXdOb2RlLmNsaWVudFdpZHRoXG4gICAgcGFkZGluZ0xlZnQgPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKEBzY3JvbGxWaWV3Tm9kZSkucGFkZGluZ0xlZnQpXG4gICAgY2xpZW50V2lkdGggLT0gcGFkZGluZ0xlZnRcbiAgICBpZiBjbGllbnRXaWR0aCA+IDBcbiAgICAgIEBwcmVzZW50ZXIuc2V0Q29udGVudEZyYW1lV2lkdGgoY2xpZW50V2lkdGgpXG5cbiAgICBAcHJlc2VudGVyLnNldEd1dHRlcldpZHRoKEBndXR0ZXJDb250YWluZXJDb21wb25lbnQ/LmdldERvbU5vZGUoKS5vZmZzZXRXaWR0aCA/IDApXG4gICAgQHByZXNlbnRlci5zZXRCb3VuZGluZ0NsaWVudFJlY3QoQGhvc3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKVxuXG4gIG1lYXN1cmVXaW5kb3dTaXplOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQG1vdW50ZWRcblxuICAgICMgRklYTUU6IG9uIFVidW50dSAodmlhIHh2ZmIpIGB3aW5kb3cuaW5uZXJXaWR0aGAgcmVwb3J0cyBhbiBpbmNvcnJlY3QgdmFsdWVcbiAgICAjIHdoZW4gd2luZG93IGdldHMgcmVzaXplZCB0aHJvdWdoIGBhdG9tLnNldFdpbmRvd0RpbWVuc2lvbnMoe3dpZHRoOlxuICAgICMgd2luZG93V2lkdGgsIGhlaWdodDogd2luZG93SGVpZ2h0fSlgLlxuICAgIEBwcmVzZW50ZXIuc2V0V2luZG93U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KVxuXG4gIHNhbXBsZUZvbnRTdHlsaW5nOiA9PlxuICAgIG9sZEZvbnRTaXplID0gQGZvbnRTaXplXG4gICAgb2xkRm9udEZhbWlseSA9IEBmb250RmFtaWx5XG4gICAgb2xkTGluZUhlaWdodCA9IEBsaW5lSGVpZ2h0XG5cbiAgICB7QGZvbnRTaXplLCBAZm9udEZhbWlseSwgQGxpbmVIZWlnaHR9ID0gZ2V0Q29tcHV0ZWRTdHlsZShAZ2V0VG9wbW9zdERPTU5vZGUoKSlcblxuICAgIGlmIEBmb250U2l6ZSBpc250IG9sZEZvbnRTaXplIG9yIEBmb250RmFtaWx5IGlzbnQgb2xkRm9udEZhbWlseSBvciBAbGluZUhlaWdodCBpc250IG9sZExpbmVIZWlnaHRcbiAgICAgIEBjbGVhclBvb2xBZnRlclVwZGF0ZSA9IHRydWVcbiAgICAgIEBtZWFzdXJlTGluZUhlaWdodEFuZERlZmF1bHRDaGFyV2lkdGgoKVxuICAgICAgQGludmFsaWRhdGVNZWFzdXJlbWVudHMoKVxuXG4gIHNhbXBsZUJhY2tncm91bmRDb2xvcnM6IChzdXBwcmVzc1VwZGF0ZSkgLT5cbiAgICB7YmFja2dyb3VuZENvbG9yfSA9IGdldENvbXB1dGVkU3R5bGUoQGhvc3RFbGVtZW50KVxuICAgIEBwcmVzZW50ZXIuc2V0QmFja2dyb3VuZENvbG9yKGJhY2tncm91bmRDb2xvcilcblxuICAgIGxpbmVOdW1iZXJHdXR0ZXIgPSBAZ3V0dGVyQ29udGFpbmVyQ29tcG9uZW50Py5nZXRMaW5lTnVtYmVyR3V0dGVyQ29tcG9uZW50KClcbiAgICBpZiBsaW5lTnVtYmVyR3V0dGVyXG4gICAgICBndXR0ZXJCYWNrZ3JvdW5kQ29sb3IgPSBnZXRDb21wdXRlZFN0eWxlKGxpbmVOdW1iZXJHdXR0ZXIuZ2V0RG9tTm9kZSgpKS5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgIEBwcmVzZW50ZXIuc2V0R3V0dGVyQmFja2dyb3VuZENvbG9yKGd1dHRlckJhY2tncm91bmRDb2xvcilcblxuICBtZWFzdXJlTGluZUhlaWdodEFuZERlZmF1bHRDaGFyV2lkdGg6IC0+XG4gICAgaWYgQGlzVmlzaWJsZSgpXG4gICAgICBAbWVhc3VyZUxpbmVIZWlnaHRBbmREZWZhdWx0Q2hhcldpZHRoV2hlblNob3duID0gZmFsc2VcbiAgICAgIEBsaW5lc0NvbXBvbmVudC5tZWFzdXJlTGluZUhlaWdodEFuZERlZmF1bHRDaGFyV2lkdGgoKVxuICAgIGVsc2VcbiAgICAgIEBtZWFzdXJlTGluZUhlaWdodEFuZERlZmF1bHRDaGFyV2lkdGhXaGVuU2hvd24gPSB0cnVlXG5cbiAgbWVhc3VyZVNjcm9sbGJhcnM6IC0+XG4gICAgQG1lYXN1cmVTY3JvbGxiYXJzV2hlblNob3duID0gZmFsc2VcblxuICAgIGNvcm5lck5vZGUgPSBAc2Nyb2xsYmFyQ29ybmVyQ29tcG9uZW50LmdldERvbU5vZGUoKVxuICAgIG9yaWdpbmFsRGlzcGxheVZhbHVlID0gY29ybmVyTm9kZS5zdHlsZS5kaXNwbGF5XG5cbiAgICBjb3JuZXJOb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG5cbiAgICB3aWR0aCA9IChjb3JuZXJOb2RlLm9mZnNldFdpZHRoIC0gY29ybmVyTm9kZS5jbGllbnRXaWR0aCkgb3IgMTVcbiAgICBoZWlnaHQgPSAoY29ybmVyTm9kZS5vZmZzZXRIZWlnaHQgLSBjb3JuZXJOb2RlLmNsaWVudEhlaWdodCkgb3IgMTVcblxuICAgIEBwcmVzZW50ZXIuc2V0VmVydGljYWxTY3JvbGxiYXJXaWR0aCh3aWR0aClcbiAgICBAcHJlc2VudGVyLnNldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQoaGVpZ2h0KVxuXG4gICAgY29ybmVyTm9kZS5zdHlsZS5kaXNwbGF5ID0gb3JpZ2luYWxEaXNwbGF5VmFsdWVcblxuICBjb250YWluc1Njcm9sbGJhclNlbGVjdG9yOiAoc3R5bGVzaGVldCkgLT5cbiAgICBmb3IgcnVsZSBpbiBzdHlsZXNoZWV0LmNzc1J1bGVzXG4gICAgICBpZiBydWxlLnNlbGVjdG9yVGV4dD8uaW5kZXhPZignc2Nyb2xsYmFyJykgPiAtMVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIGZhbHNlXG5cbiAgcmVmcmVzaFNjcm9sbGJhcnM6ID0+XG4gICAgaWYgQGlzVmlzaWJsZSgpXG4gICAgICBAbWVhc3VyZVNjcm9sbGJhcnNXaGVuU2hvd24gPSBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBtZWFzdXJlU2Nyb2xsYmFyc1doZW5TaG93biA9IHRydWVcbiAgICAgIHJldHVyblxuXG4gICAgdmVydGljYWxOb2RlID0gQHZlcnRpY2FsU2Nyb2xsYmFyQ29tcG9uZW50LmdldERvbU5vZGUoKVxuICAgIGhvcml6b250YWxOb2RlID0gQGhvcml6b250YWxTY3JvbGxiYXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpXG4gICAgY29ybmVyTm9kZSA9IEBzY3JvbGxiYXJDb3JuZXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpXG5cbiAgICBvcmlnaW5hbFZlcnRpY2FsRGlzcGxheVZhbHVlID0gdmVydGljYWxOb2RlLnN0eWxlLmRpc3BsYXlcbiAgICBvcmlnaW5hbEhvcml6b250YWxEaXNwbGF5VmFsdWUgPSBob3Jpem9udGFsTm9kZS5zdHlsZS5kaXNwbGF5XG4gICAgb3JpZ2luYWxDb3JuZXJEaXNwbGF5VmFsdWUgPSBjb3JuZXJOb2RlLnN0eWxlLmRpc3BsYXlcblxuICAgICMgRmlyc3QsIGhpZGUgYWxsIHNjcm9sbGJhcnMgaW4gY2FzZSB0aGV5IGFyZSB2aXNpYmxlIHNvIHRoZXkgdGFrZSBvbiBuZXdcbiAgICAjIHN0eWxlcyB3aGVuIHRoZXkgYXJlIHNob3duIGFnYWluLlxuICAgIHZlcnRpY2FsTm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgaG9yaXpvbnRhbE5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIGNvcm5lck5vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gICAgIyBGb3JjZSBhIHJlZmxvd1xuICAgIGNvcm5lck5vZGUub2Zmc2V0V2lkdGhcblxuICAgICMgTm93IG1lYXN1cmUgdGhlIG5ldyBzY3JvbGxiYXIgZGltZW5zaW9uc1xuICAgIEBtZWFzdXJlU2Nyb2xsYmFycygpXG5cbiAgICAjIE5vdyByZXN0b3JlIHRoZSBkaXNwbGF5IHZhbHVlIGZvciBhbGwgc2Nyb2xsYmFycywgc2luY2UgdGhleSB3ZXJlXG4gICAgIyBwcmV2aW91c2x5IGhpZGRlblxuICAgIHZlcnRpY2FsTm9kZS5zdHlsZS5kaXNwbGF5ID0gb3JpZ2luYWxWZXJ0aWNhbERpc3BsYXlWYWx1ZVxuICAgIGhvcml6b250YWxOb2RlLnN0eWxlLmRpc3BsYXkgPSBvcmlnaW5hbEhvcml6b250YWxEaXNwbGF5VmFsdWVcbiAgICBjb3JuZXJOb2RlLnN0eWxlLmRpc3BsYXkgPSBvcmlnaW5hbENvcm5lckRpc3BsYXlWYWx1ZVxuXG4gIGNvbnNvbGlkYXRlU2VsZWN0aW9uczogKGUpIC0+XG4gICAgZS5hYm9ydEtleUJpbmRpbmcoKSB1bmxlc3MgQGVkaXRvci5jb25zb2xpZGF0ZVNlbGVjdGlvbnMoKVxuXG4gIGxpbmVOb2RlRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPlxuICAgIEBsaW5lc0NvbXBvbmVudC5saW5lTm9kZUZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG5cbiAgbGluZU51bWJlck5vZGVGb3JTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgdGlsZVJvdyA9IEBwcmVzZW50ZXIudGlsZUZvclJvdyhzY3JlZW5Sb3cpXG4gICAgZ3V0dGVyQ29tcG9uZW50ID0gQGd1dHRlckNvbnRhaW5lckNvbXBvbmVudC5nZXRMaW5lTnVtYmVyR3V0dGVyQ29tcG9uZW50KClcbiAgICB0aWxlQ29tcG9uZW50ID0gZ3V0dGVyQ29tcG9uZW50LmdldENvbXBvbmVudEZvclRpbGUodGlsZVJvdylcblxuICAgIHRpbGVDb21wb25lbnQ/LmxpbmVOdW1iZXJOb2RlRm9yU2NyZWVuUm93KHNjcmVlblJvdylcblxuICB0aWxlTm9kZXNGb3JMaW5lczogLT5cbiAgICBAbGluZXNDb21wb25lbnQuZ2V0VGlsZXMoKVxuXG4gIHRpbGVOb2Rlc0ZvckxpbmVOdW1iZXJzOiAtPlxuICAgIGd1dHRlckNvbXBvbmVudCA9IEBndXR0ZXJDb250YWluZXJDb21wb25lbnQuZ2V0TGluZU51bWJlckd1dHRlckNvbXBvbmVudCgpXG4gICAgZ3V0dGVyQ29tcG9uZW50LmdldFRpbGVzKClcblxuICBzY3JlZW5Sb3dGb3JOb2RlOiAobm9kZSkgLT5cbiAgICB3aGlsZSBub2RlP1xuICAgICAgaWYgc2NyZWVuUm93ID0gbm9kZS5kYXRhc2V0Py5zY3JlZW5Sb3dcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHNjcmVlblJvdylcbiAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnRcbiAgICBudWxsXG5cbiAgZ2V0Rm9udFNpemU6IC0+XG4gICAgcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZShAZ2V0VG9wbW9zdERPTU5vZGUoKSkuZm9udFNpemUpXG5cbiAgc2V0Rm9udFNpemU6IChmb250U2l6ZSkgLT5cbiAgICBAZ2V0VG9wbW9zdERPTU5vZGUoKS5zdHlsZS5mb250U2l6ZSA9IGZvbnRTaXplICsgJ3B4J1xuICAgIEBzYW1wbGVGb250U3R5bGluZygpXG4gICAgQGludmFsaWRhdGVNZWFzdXJlbWVudHMoKVxuXG4gIGdldEZvbnRGYW1pbHk6IC0+XG4gICAgZ2V0Q29tcHV0ZWRTdHlsZShAZ2V0VG9wbW9zdERPTU5vZGUoKSkuZm9udEZhbWlseVxuXG4gIHNldEZvbnRGYW1pbHk6IChmb250RmFtaWx5KSAtPlxuICAgIEBnZXRUb3Btb3N0RE9NTm9kZSgpLnN0eWxlLmZvbnRGYW1pbHkgPSBmb250RmFtaWx5XG4gICAgQHNhbXBsZUZvbnRTdHlsaW5nKClcbiAgICBAaW52YWxpZGF0ZU1lYXN1cmVtZW50cygpXG5cbiAgc2V0TGluZUhlaWdodDogKGxpbmVIZWlnaHQpIC0+XG4gICAgQGdldFRvcG1vc3RET01Ob2RlKCkuc3R5bGUubGluZUhlaWdodCA9IGxpbmVIZWlnaHRcbiAgICBAc2FtcGxlRm9udFN0eWxpbmcoKVxuICAgIEBpbnZhbGlkYXRlTWVhc3VyZW1lbnRzKClcblxuICBpbnZhbGlkYXRlTWVhc3VyZW1lbnRzOiAtPlxuICAgIEBsaW5lc1lhcmRzdGljay5pbnZhbGlkYXRlQ2FjaGUoKVxuICAgIEBwcmVzZW50ZXIubWVhc3VyZW1lbnRzQ2hhbmdlZCgpXG5cbiAgc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50OiAoZXZlbnQsIGxpbmVzQ2xpZW50UmVjdCkgLT5cbiAgICBwaXhlbFBvc2l0aW9uID0gQHBpeGVsUG9zaXRpb25Gb3JNb3VzZUV2ZW50KGV2ZW50LCBsaW5lc0NsaWVudFJlY3QpXG4gICAgQHNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFBvc2l0aW9uKVxuXG4gIHBpeGVsUG9zaXRpb25Gb3JNb3VzZUV2ZW50OiAoZXZlbnQsIGxpbmVzQ2xpZW50UmVjdCkgLT5cbiAgICB7Y2xpZW50WCwgY2xpZW50WX0gPSBldmVudFxuXG4gICAgbGluZXNDbGllbnRSZWN0ID89IEBsaW5lc0NvbXBvbmVudC5nZXREb21Ob2RlKCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcCArIEBwcmVzZW50ZXIuZ2V0UmVhbFNjcm9sbFRvcCgpXG4gICAgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdCArIEBwcmVzZW50ZXIuZ2V0UmVhbFNjcm9sbExlZnQoKVxuICAgIGJvdHRvbSA9IGxpbmVzQ2xpZW50UmVjdC50b3AgKyBAcHJlc2VudGVyLmdldFJlYWxTY3JvbGxUb3AoKSArIGxpbmVzQ2xpZW50UmVjdC5oZWlnaHQgLSBjbGllbnRZXG4gICAgcmlnaHQgPSBsaW5lc0NsaWVudFJlY3QubGVmdCArIEBwcmVzZW50ZXIuZ2V0UmVhbFNjcm9sbExlZnQoKSArIGxpbmVzQ2xpZW50UmVjdC53aWR0aCAtIGNsaWVudFhcblxuICAgIHt0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHR9XG5cbiAgZ2V0R3V0dGVyV2lkdGg6IC0+XG4gICAgQHByZXNlbnRlci5nZXRHdXR0ZXJXaWR0aCgpXG5cbiAgZ2V0TW9kZWw6IC0+XG4gICAgQGVkaXRvclxuXG4gIGlzSW5wdXRFbmFibGVkOiAtPiBAaW5wdXRFbmFibGVkXG5cbiAgc2V0SW5wdXRFbmFibGVkOiAoQGlucHV0RW5hYmxlZCkgLT4gQGlucHV0RW5hYmxlZFxuXG4gIHNldENvbnRpbnVvdXNSZWZsb3c6IChjb250aW51b3VzUmVmbG93KSAtPlxuICAgIEBwcmVzZW50ZXIuc2V0Q29udGludW91c1JlZmxvdyhjb250aW51b3VzUmVmbG93KVxuXG4gIHVwZGF0ZVBhcmVudFZpZXdGb2N1c2VkQ2xhc3NJZk5lZWRlZDogLT5cbiAgICBpZiBAb2xkU3RhdGUuZm9jdXNlZCBpc250IEBuZXdTdGF0ZS5mb2N1c2VkXG4gICAgICBAaG9zdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtZm9jdXNlZCcsIEBuZXdTdGF0ZS5mb2N1c2VkKVxuICAgICAgQG9sZFN0YXRlLmZvY3VzZWQgPSBAbmV3U3RhdGUuZm9jdXNlZFxuXG4gIHVwZGF0ZVBhcmVudFZpZXdNaW5pQ2xhc3M6IC0+XG4gICAgQGhvc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ21pbmknLCBAZWRpdG9yLmlzTWluaSgpKVxuIl19
