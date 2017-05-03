(function() {
  var CompositeDisposable, Decoration, Emitter, Point, Range, TextEditorPresenter, _, ref, ref1;

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  ref1 = require('text-buffer'), Point = ref1.Point, Range = ref1.Range;

  _ = require('underscore-plus');

  Decoration = require('./decoration');

  module.exports = TextEditorPresenter = (function() {
    TextEditorPresenter.prototype.toggleCursorBlinkHandle = null;

    TextEditorPresenter.prototype.startBlinkingCursorsAfterDelay = null;

    TextEditorPresenter.prototype.stoppedScrollingTimeoutId = null;

    TextEditorPresenter.prototype.mouseWheelScreenRow = null;

    TextEditorPresenter.prototype.overlayDimensions = null;

    TextEditorPresenter.prototype.minimumReflowInterval = 200;

    function TextEditorPresenter(params) {
      this.model = params.model, this.lineTopIndex = params.lineTopIndex;
      this.model.presenter = this;
      this.cursorBlinkPeriod = params.cursorBlinkPeriod, this.cursorBlinkResumeDelay = params.cursorBlinkResumeDelay, this.stoppedScrollingDelay = params.stoppedScrollingDelay, this.tileSize = params.tileSize, this.autoHeight = params.autoHeight;
      this.contentFrameWidth = params.contentFrameWidth;
      this.displayLayer = this.model.displayLayer;
      this.gutterWidth = 0;
      if (this.tileSize == null) {
        this.tileSize = 6;
      }
      this.realScrollTop = this.scrollTop;
      this.realScrollLeft = this.scrollLeft;
      this.disposables = new CompositeDisposable;
      this.emitter = new Emitter;
      this.linesByScreenRow = new Map;
      this.visibleHighlights = {};
      this.characterWidthsByScope = {};
      this.lineDecorationsByScreenRow = {};
      this.lineNumberDecorationsByScreenRow = {};
      this.customGutterDecorationsByGutterName = {};
      this.overlayDimensions = {};
      this.observedBlockDecorations = new Set();
      this.invalidatedDimensionsByBlockDecoration = new Set();
      this.invalidateAllBlockDecorationsDimensions = false;
      this.precedingBlockDecorationsByScreenRowAndId = {};
      this.followingBlockDecorationsByScreenRowAndId = {};
      this.screenRowsToMeasure = [];
      this.flashCountsByDecorationId = {};
      this.transferMeasurementsToModel();
      this.transferMeasurementsFromModel();
      this.observeModel();
      this.buildState();
      this.invalidateState();
      if (this.focused) {
        this.startBlinkingCursors();
      }
      if (this.continuousReflow) {
        this.startReflowing();
      }
      this.updating = false;
    }

    TextEditorPresenter.prototype.setLinesYardstick = function(linesYardstick) {
      this.linesYardstick = linesYardstick;
    };

    TextEditorPresenter.prototype.getLinesYardstick = function() {
      return this.linesYardstick;
    };

    TextEditorPresenter.prototype.destroy = function() {
      this.disposables.dispose();
      if (this.stoppedScrollingTimeoutId != null) {
        clearTimeout(this.stoppedScrollingTimeoutId);
      }
      if (this.reflowingInterval != null) {
        clearInterval(this.reflowingInterval);
      }
      return this.stopBlinkingCursors();
    };

    TextEditorPresenter.prototype.onDidUpdateState = function(callback) {
      return this.emitter.on('did-update-state', callback);
    };

    TextEditorPresenter.prototype.emitDidUpdateState = function() {
      if (this.isBatching()) {
        return this.emitter.emit("did-update-state");
      }
    };

    TextEditorPresenter.prototype.transferMeasurementsToModel = function() {
      if (this.lineHeight != null) {
        this.model.setLineHeightInPixels(this.lineHeight);
      }
      if (this.baseCharacterWidth != null) {
        return this.model.setDefaultCharWidth(this.baseCharacterWidth);
      }
    };

    TextEditorPresenter.prototype.transferMeasurementsFromModel = function() {
      return this.editorWidthInChars = this.model.getEditorWidthInChars();
    };

    TextEditorPresenter.prototype.isBatching = function() {
      return this.updating === false;
    };

    TextEditorPresenter.prototype.getPreMeasurementState = function() {
      this.updating = true;
      this.updateVerticalDimensions();
      this.updateScrollbarDimensions();
      this.commitPendingLogicalScrollTopPosition();
      this.commitPendingScrollTopPosition();
      this.updateStartRow();
      this.updateEndRow();
      this.updateCommonGutterState();
      this.updateReflowState();
      this.updateLines();
      if (this.shouldUpdateDecorations) {
        this.fetchDecorations();
        this.updateLineDecorations();
        this.updateBlockDecorations();
      }
      this.updateTilesState();
      this.updating = false;
      return this.state;
    };

    TextEditorPresenter.prototype.getPostMeasurementState = function() {
      this.updating = true;
      this.updateHorizontalDimensions();
      this.commitPendingLogicalScrollLeftPosition();
      this.commitPendingScrollLeftPosition();
      this.clearPendingScrollPosition();
      this.updateRowsPerPage();
      this.updateLines();
      this.updateVerticalScrollState();
      this.updateHorizontalScrollState();
      this.updateScrollbarsState();
      this.updateHiddenInputState();
      this.updateContentState();
      this.updateFocusedState();
      this.updateHeightState();
      this.updateWidthState();
      if (this.shouldUpdateDecorations) {
        this.updateHighlightDecorations();
      }
      this.updateTilesState();
      this.updateCursorsState();
      this.updateOverlaysState();
      this.updateLineNumberGutterState();
      this.updateGutterOrderState();
      this.updateCustomGutterDecorationState();
      this.updating = false;
      this.resetTrackedUpdates();
      return this.state;
    };

    TextEditorPresenter.prototype.resetTrackedUpdates = function() {
      return this.shouldUpdateDecorations = false;
    };

    TextEditorPresenter.prototype.invalidateState = function() {
      return this.shouldUpdateDecorations = true;
    };

    TextEditorPresenter.prototype.observeModel = function() {
      var cursor, decoration, i, j, len, len1, ref2, ref3;
      this.disposables.add(this.model.displayLayer.onDidReset((function(_this) {
        return function() {
          _this.spliceBlockDecorationsInRange(0, 2e308, 2e308);
          _this.shouldUpdateDecorations = true;
          return _this.emitDidUpdateState();
        };
      })(this)));
      this.disposables.add(this.model.displayLayer.onDidChangeSync((function(_this) {
        return function(changes) {
          var change, endRow, i, len, startRow;
          for (i = 0, len = changes.length; i < len; i++) {
            change = changes[i];
            startRow = change.start.row;
            endRow = startRow + change.oldExtent.row;
            _this.spliceBlockDecorationsInRange(startRow, endRow, change.newExtent.row - change.oldExtent.row);
          }
          _this.shouldUpdateDecorations = true;
          return _this.emitDidUpdateState();
        };
      })(this)));
      this.disposables.add(this.model.onDidUpdateDecorations((function(_this) {
        return function() {
          _this.shouldUpdateDecorations = true;
          return _this.emitDidUpdateState();
        };
      })(this)));
      this.disposables.add(this.model.onDidAddDecoration(this.didAddBlockDecoration.bind(this)));
      ref2 = this.model.getDecorations({
        type: 'block'
      });
      for (i = 0, len = ref2.length; i < len; i++) {
        decoration = ref2[i];
        this.didAddBlockDecoration(decoration);
      }
      this.disposables.add(this.model.onDidChangeGrammar(this.didChangeGrammar.bind(this)));
      this.disposables.add(this.model.onDidChangePlaceholderText(this.emitDidUpdateState.bind(this)));
      this.disposables.add(this.model.onDidChangeMini((function(_this) {
        return function() {
          _this.shouldUpdateDecorations = true;
          return _this.emitDidUpdateState();
        };
      })(this)));
      this.disposables.add(this.model.onDidChangeLineNumberGutterVisible(this.emitDidUpdateState.bind(this)));
      this.disposables.add(this.model.onDidAddCursor(this.didAddCursor.bind(this)));
      this.disposables.add(this.model.onDidRequestAutoscroll(this.requestAutoscroll.bind(this)));
      this.disposables.add(this.model.onDidChangeFirstVisibleScreenRow(this.didChangeFirstVisibleScreenRow.bind(this)));
      ref3 = this.model.getCursors();
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        cursor = ref3[j];
        this.observeCursor(cursor);
      }
      this.disposables.add(this.model.onDidAddGutter(this.didAddGutter.bind(this)));
    };

    TextEditorPresenter.prototype.didChangeScrollPastEnd = function() {
      this.updateScrollHeight();
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.didChangeShowLineNumbers = function() {
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.didChangeGrammar = function() {
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.buildState = function() {
      this.state = {
        horizontalScrollbar: {},
        verticalScrollbar: {},
        hiddenInput: {},
        content: {
          scrollingVertically: false,
          cursorsVisible: false,
          tiles: {},
          highlights: {},
          overlays: {},
          cursors: {},
          offScreenBlockDecorations: {}
        },
        gutters: []
      };
      this.sharedGutterStyles = {};
      this.customGutterDecorations = {};
      return this.lineNumberGutter = {
        tiles: {}
      };
    };

    TextEditorPresenter.prototype.setContinuousReflow = function(continuousReflow) {
      this.continuousReflow = continuousReflow;
      if (this.continuousReflow) {
        return this.startReflowing();
      } else {
        return this.stopReflowing();
      }
    };

    TextEditorPresenter.prototype.updateReflowState = function() {
      this.state.content.continuousReflow = this.continuousReflow;
      return this.lineNumberGutter.continuousReflow = this.continuousReflow;
    };

    TextEditorPresenter.prototype.startReflowing = function() {
      return this.reflowingInterval = setInterval(this.emitDidUpdateState.bind(this), this.minimumReflowInterval);
    };

    TextEditorPresenter.prototype.stopReflowing = function() {
      clearInterval(this.reflowingInterval);
      return this.reflowingInterval = null;
    };

    TextEditorPresenter.prototype.updateFocusedState = function() {
      return this.state.focused = this.focused;
    };

    TextEditorPresenter.prototype.updateHeightState = function() {
      if (this.autoHeight) {
        return this.state.height = this.contentHeight;
      } else {
        return this.state.height = null;
      }
    };

    TextEditorPresenter.prototype.updateWidthState = function() {
      if (this.model.getAutoWidth()) {
        return this.state.width = this.state.content.width + this.gutterWidth;
      } else {
        return this.state.width = null;
      }
    };

    TextEditorPresenter.prototype.updateVerticalScrollState = function() {
      this.state.content.scrollHeight = this.scrollHeight;
      this.sharedGutterStyles.scrollHeight = this.scrollHeight;
      this.state.verticalScrollbar.scrollHeight = this.scrollHeight;
      this.state.content.scrollTop = this.scrollTop;
      this.sharedGutterStyles.scrollTop = this.scrollTop;
      return this.state.verticalScrollbar.scrollTop = this.scrollTop;
    };

    TextEditorPresenter.prototype.updateHorizontalScrollState = function() {
      this.state.content.scrollWidth = this.scrollWidth;
      this.state.horizontalScrollbar.scrollWidth = this.scrollWidth;
      this.state.content.scrollLeft = this.scrollLeft;
      return this.state.horizontalScrollbar.scrollLeft = this.scrollLeft;
    };

    TextEditorPresenter.prototype.updateScrollbarsState = function() {
      this.state.horizontalScrollbar.visible = this.horizontalScrollbarHeight > 0;
      this.state.horizontalScrollbar.height = this.measuredHorizontalScrollbarHeight;
      this.state.horizontalScrollbar.right = this.verticalScrollbarWidth;
      this.state.verticalScrollbar.visible = this.verticalScrollbarWidth > 0;
      this.state.verticalScrollbar.width = this.measuredVerticalScrollbarWidth;
      return this.state.verticalScrollbar.bottom = this.horizontalScrollbarHeight;
    };

    TextEditorPresenter.prototype.updateHiddenInputState = function() {
      var height, lastCursor, left, ref2, top, width;
      if (!(lastCursor = this.model.getLastCursor())) {
        return;
      }
      ref2 = this.pixelRectForScreenRange(lastCursor.getScreenRange()), top = ref2.top, left = ref2.left, height = ref2.height, width = ref2.width;
      if (this.focused) {
        this.state.hiddenInput.top = Math.max(Math.min(top, this.clientHeight - height), 0);
        this.state.hiddenInput.left = Math.max(Math.min(left, this.clientWidth - width), 0);
      } else {
        this.state.hiddenInput.top = 0;
        this.state.hiddenInput.left = 0;
      }
      this.state.hiddenInput.height = height;
      return this.state.hiddenInput.width = Math.max(width, 2);
    };

    TextEditorPresenter.prototype.updateContentState = function() {
      var contentFrameWidth, contentWidth, ref2, ref3, ref4, verticalScrollbarWidth;
      if (this.boundingClientRect != null) {
        this.sharedGutterStyles.maxHeight = this.boundingClientRect.height;
        this.state.content.maxHeight = this.boundingClientRect.height;
      }
      verticalScrollbarWidth = (ref2 = this.verticalScrollbarWidth) != null ? ref2 : 0;
      contentFrameWidth = (ref3 = this.contentFrameWidth) != null ? ref3 : 0;
      contentWidth = (ref4 = this.contentWidth) != null ? ref4 : 0;
      if (this.model.getAutoWidth()) {
        this.state.content.width = contentWidth + verticalScrollbarWidth;
      } else {
        this.state.content.width = Math.max(contentWidth + verticalScrollbarWidth, contentFrameWidth);
      }
      this.state.content.scrollWidth = this.scrollWidth;
      this.state.content.scrollLeft = this.scrollLeft;
      this.state.content.backgroundColor = this.model.isMini() ? null : this.backgroundColor;
      return this.state.content.placeholderText = this.model.isEmpty() ? this.model.getPlaceholderText() : null;
    };

    TextEditorPresenter.prototype.tileForRow = function(row) {
      return row - (row % this.tileSize);
    };

    TextEditorPresenter.prototype.getStartTileRow = function() {
      var ref2;
      return this.tileForRow((ref2 = this.startRow) != null ? ref2 : 0);
    };

    TextEditorPresenter.prototype.getEndTileRow = function() {
      var ref2;
      return this.tileForRow((ref2 = this.endRow) != null ? ref2 : 0);
    };

    TextEditorPresenter.prototype.getScreenRowsToRender = function() {
      var endRow, i, longestScreenRow, results, screenRows, startRow;
      startRow = this.getStartTileRow();
      endRow = this.getEndTileRow() + this.tileSize;
      screenRows = (function() {
        results = [];
        for (var i = startRow; startRow <= endRow ? i < endRow : i > endRow; startRow <= endRow ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this);
      longestScreenRow = this.model.getApproximateLongestScreenRow();
      if (longestScreenRow != null) {
        screenRows.push(longestScreenRow);
      }
      if (this.screenRowsToMeasure != null) {
        screenRows.push.apply(screenRows, this.screenRowsToMeasure);
      }
      screenRows = screenRows.filter(function(row) {
        return row >= 0;
      });
      screenRows.sort(function(a, b) {
        return a - b;
      });
      return _.uniq(screenRows, true);
    };

    TextEditorPresenter.prototype.getScreenRangesToRender = function() {
      var endRow, i, len, row, screenRanges, screenRows, startRow;
      screenRows = this.getScreenRowsToRender();
      screenRows.push(2e308);
      startRow = screenRows[0];
      endRow = startRow - 1;
      screenRanges = [];
      for (i = 0, len = screenRows.length; i < len; i++) {
        row = screenRows[i];
        if (row === endRow + 1) {
          endRow++;
        } else {
          screenRanges.push([startRow, endRow]);
          startRow = endRow = row;
        }
      }
      return screenRanges;
    };

    TextEditorPresenter.prototype.setScreenRowsToMeasure = function(screenRows) {
      if ((screenRows == null) || screenRows.length === 0) {
        return;
      }
      this.screenRowsToMeasure = screenRows;
      return this.shouldUpdateDecorations = true;
    };

    TextEditorPresenter.prototype.clearScreenRowsToMeasure = function() {
      return this.screenRowsToMeasure = [];
    };

    TextEditorPresenter.prototype.updateTilesState = function() {
      var base, base1, bottom, currentScreenRow, endRow, gutterTile, height, i, id, mouseWheelTileId, ref2, ref3, ref4, ref5, results, rowsWithinTile, screenRowIndex, screenRows, startRow, tile, tileEndRow, tileStartRow, top, visibleTiles, zIndex;
      if (!((this.startRow != null) && (this.endRow != null) && (this.lineHeight != null))) {
        return;
      }
      screenRows = this.getScreenRowsToRender();
      visibleTiles = {};
      startRow = screenRows[0];
      endRow = screenRows[screenRows.length - 1];
      screenRowIndex = screenRows.length - 1;
      zIndex = 0;
      for (tileStartRow = i = ref2 = this.tileForRow(endRow), ref3 = this.tileForRow(startRow), ref4 = -this.tileSize; ref4 > 0 ? i <= ref3 : i >= ref3; tileStartRow = i += ref4) {
        tileEndRow = tileStartRow + this.tileSize;
        rowsWithinTile = [];
        while (screenRowIndex >= 0) {
          currentScreenRow = screenRows[screenRowIndex];
          if (currentScreenRow < tileStartRow) {
            break;
          }
          rowsWithinTile.push(currentScreenRow);
          screenRowIndex--;
        }
        if (rowsWithinTile.length === 0) {
          continue;
        }
        top = Math.round(this.lineTopIndex.pixelPositionBeforeBlocksForRow(tileStartRow));
        bottom = Math.round(this.lineTopIndex.pixelPositionBeforeBlocksForRow(tileEndRow));
        height = bottom - top;
        tile = (base = this.state.content.tiles)[tileStartRow] != null ? base[tileStartRow] : base[tileStartRow] = {};
        tile.top = top - this.scrollTop;
        tile.left = -this.scrollLeft;
        tile.height = height;
        tile.display = "block";
        tile.zIndex = zIndex;
        if (tile.highlights == null) {
          tile.highlights = {};
        }
        gutterTile = (base1 = this.lineNumberGutter.tiles)[tileStartRow] != null ? base1[tileStartRow] : base1[tileStartRow] = {};
        gutterTile.top = top - this.scrollTop;
        gutterTile.height = height;
        gutterTile.display = "block";
        gutterTile.zIndex = zIndex;
        this.updateLinesState(tile, rowsWithinTile);
        this.updateLineNumbersState(gutterTile, rowsWithinTile);
        visibleTiles[tileStartRow] = true;
        zIndex++;
      }
      if (this.mouseWheelScreenRow != null) {
        mouseWheelTileId = this.tileForRow(this.mouseWheelScreenRow);
      }
      ref5 = this.state.content.tiles;
      results = [];
      for (id in ref5) {
        tile = ref5[id];
        if (visibleTiles.hasOwnProperty(id)) {
          continue;
        }
        if (Number(id) === mouseWheelTileId) {
          this.state.content.tiles[id].display = "none";
          results.push(this.lineNumberGutter.tiles[id].display = "none");
        } else {
          delete this.state.content.tiles[id];
          results.push(delete this.lineNumberGutter.tiles[id]);
        }
      }
      return results;
    };

    TextEditorPresenter.prototype.updateLinesState = function(tileState, screenRows) {
      var followingBlockDecorations, i, id, len, line, lineState, precedingBlockDecorations, ref2, ref3, ref4, screenRow, visibleLineIds;
      if (tileState.lines == null) {
        tileState.lines = {};
      }
      visibleLineIds = {};
      for (i = 0, len = screenRows.length; i < len; i++) {
        screenRow = screenRows[i];
        line = this.linesByScreenRow.get(screenRow);
        if (line == null) {
          continue;
        }
        visibleLineIds[line.id] = true;
        precedingBlockDecorations = (ref2 = this.precedingBlockDecorationsByScreenRowAndId[screenRow]) != null ? ref2 : {};
        followingBlockDecorations = (ref3 = this.followingBlockDecorationsByScreenRowAndId[screenRow]) != null ? ref3 : {};
        if (tileState.lines.hasOwnProperty(line.id)) {
          lineState = tileState.lines[line.id];
          lineState.screenRow = screenRow;
          lineState.decorationClasses = this.lineDecorationClassesForRow(screenRow);
          lineState.precedingBlockDecorations = precedingBlockDecorations;
          lineState.followingBlockDecorations = followingBlockDecorations;
        } else {
          tileState.lines[line.id] = {
            screenRow: screenRow,
            lineText: line.lineText,
            tagCodes: line.tagCodes,
            decorationClasses: this.lineDecorationClassesForRow(screenRow),
            precedingBlockDecorations: precedingBlockDecorations,
            followingBlockDecorations: followingBlockDecorations
          };
        }
      }
      ref4 = tileState.lines;
      for (id in ref4) {
        line = ref4[id];
        if (!visibleLineIds.hasOwnProperty(id)) {
          delete tileState.lines[id];
        }
      }
    };

    TextEditorPresenter.prototype.updateCursorsState = function() {
      var cursor, i, len, pixelRect, ref2;
      if (!((this.startRow != null) && (this.endRow != null) && this.hasPixelRectRequirements() && (this.baseCharacterWidth != null))) {
        return;
      }
      this.state.content.cursors = {};
      ref2 = this.model.cursorsForScreenRowRange(this.startRow, this.endRow - 1);
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        if (!(cursor.isVisible())) {
          continue;
        }
        pixelRect = this.pixelRectForScreenRange(cursor.getScreenRange());
        if (pixelRect.width === 0) {
          pixelRect.width = Math.round(this.baseCharacterWidth);
        }
        this.state.content.cursors[cursor.id] = pixelRect;
      }
    };

    TextEditorPresenter.prototype.updateOverlaysState = function() {
      var base, contentMargin, decoration, i, id, item, itemHeight, itemWidth, klass, left, leftDiff, len, name, overlayDimensions, overlayState, pixelPosition, position, ref2, ref3, rightDiff, screenPosition, top, visibleDecorationIds;
      if (!this.hasOverlayPositionRequirements()) {
        return;
      }
      visibleDecorationIds = {};
      ref2 = this.model.getOverlayDecorations();
      for (i = 0, len = ref2.length; i < len; i++) {
        decoration = ref2[i];
        if (!decoration.getMarker().isValid()) {
          continue;
        }
        ref3 = decoration.getProperties(), item = ref3.item, position = ref3.position, klass = ref3["class"];
        if (position === 'tail') {
          screenPosition = decoration.getMarker().getTailScreenPosition();
        } else {
          screenPosition = decoration.getMarker().getHeadScreenPosition();
        }
        pixelPosition = this.pixelPositionForScreenPosition(screenPosition);
        top = this.boundingClientRect.top + pixelPosition.top + this.lineHeight;
        left = this.boundingClientRect.left + pixelPosition.left + this.gutterWidth;
        if (overlayDimensions = this.overlayDimensions[decoration.id]) {
          itemWidth = overlayDimensions.itemWidth, itemHeight = overlayDimensions.itemHeight, contentMargin = overlayDimensions.contentMargin;
          rightDiff = left + itemWidth + contentMargin - this.windowWidth;
          if (rightDiff > 0) {
            left -= rightDiff;
          }
          leftDiff = left + contentMargin;
          if (leftDiff < 0) {
            left -= leftDiff;
          }
          if (top + itemHeight > this.windowHeight && top - (itemHeight + this.lineHeight) >= 0) {
            top -= itemHeight + this.lineHeight;
          }
        }
        pixelPosition.top = top;
        pixelPosition.left = left;
        overlayState = (base = this.state.content.overlays)[name = decoration.id] != null ? base[name] : base[name] = {
          item: item
        };
        overlayState.pixelPosition = pixelPosition;
        if (klass != null) {
          overlayState["class"] = klass;
        }
        visibleDecorationIds[decoration.id] = true;
      }
      for (id in this.state.content.overlays) {
        if (!visibleDecorationIds[id]) {
          delete this.state.content.overlays[id];
        }
      }
      for (id in this.overlayDimensions) {
        if (!visibleDecorationIds[id]) {
          delete this.overlayDimensions[id];
        }
      }
    };

    TextEditorPresenter.prototype.updateLineNumberGutterState = function() {
      return this.lineNumberGutter.maxLineNumberDigits = this.model.getLineCount().toString().length;
    };

    TextEditorPresenter.prototype.updateCommonGutterState = function() {
      return this.sharedGutterStyles.backgroundColor = this.gutterBackgroundColor !== "rgba(0, 0, 0, 0)" ? this.gutterBackgroundColor : this.backgroundColor;
    };

    TextEditorPresenter.prototype.didAddGutter = function(gutter) {
      var gutterDisposables;
      gutterDisposables = new CompositeDisposable;
      gutterDisposables.add(gutter.onDidChangeVisible((function(_this) {
        return function() {
          return _this.emitDidUpdateState();
        };
      })(this)));
      gutterDisposables.add(gutter.onDidDestroy((function(_this) {
        return function() {
          _this.disposables.remove(gutterDisposables);
          gutterDisposables.dispose();
          return _this.emitDidUpdateState();
        };
      })(this)));
      this.disposables.add(gutterDisposables);
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.updateGutterOrderState = function() {
      var base, content, gutter, i, isVisible, len, name, ref2, results;
      this.state.gutters = [];
      if (this.model.isMini()) {
        return;
      }
      ref2 = this.model.getGutters();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        gutter = ref2[i];
        isVisible = this.gutterIsVisible(gutter);
        if (gutter.name === 'line-number') {
          content = this.lineNumberGutter;
        } else {
          if ((base = this.customGutterDecorations)[name = gutter.name] == null) {
            base[name] = {};
          }
          content = this.customGutterDecorations[gutter.name];
        }
        results.push(this.state.gutters.push({
          gutter: gutter,
          visible: isVisible,
          styles: this.sharedGutterStyles,
          content: content
        }));
      }
      return results;
    };

    TextEditorPresenter.prototype.updateCustomGutterDecorationState = function() {
      var bottom, decorationId, gutter, gutterDecorations, gutterName, i, len, properties, ref2, results, screenRange, top;
      if (!((this.startRow != null) && (this.endRow != null) && (this.lineHeight != null))) {
        return;
      }
      if (this.model.isMini()) {
        this.clearAllCustomGutterDecorations();
      }
      ref2 = this.model.getGutters();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        gutter = ref2[i];
        gutterName = gutter.name;
        gutterDecorations = this.customGutterDecorations[gutterName];
        if (gutterDecorations) {
          this.clearDecorationsForCustomGutterName(gutterName);
        } else {
          this.customGutterDecorations[gutterName] = {};
        }
        if (!this.gutterIsVisible(gutter)) {
          continue;
        }
        results.push((function() {
          var ref3, ref4, results1;
          ref3 = this.customGutterDecorationsByGutterName[gutterName];
          results1 = [];
          for (decorationId in ref3) {
            ref4 = ref3[decorationId], properties = ref4.properties, screenRange = ref4.screenRange;
            top = this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRange.start.row);
            bottom = this.lineTopIndex.pixelPositionBeforeBlocksForRow(screenRange.end.row + 1);
            results1.push(this.customGutterDecorations[gutterName][decorationId] = {
              top: top,
              height: bottom - top,
              item: properties.item,
              "class": properties["class"]
            });
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    TextEditorPresenter.prototype.clearAllCustomGutterDecorations = function() {
      var allGutterNames, gutterName, i, len, results;
      allGutterNames = Object.keys(this.customGutterDecorations);
      results = [];
      for (i = 0, len = allGutterNames.length; i < len; i++) {
        gutterName = allGutterNames[i];
        results.push(this.clearDecorationsForCustomGutterName(gutterName));
      }
      return results;
    };

    TextEditorPresenter.prototype.clearDecorationsForCustomGutterName = function(gutterName) {
      var allDecorationIds, decorationId, gutterDecorations, i, len, results;
      gutterDecorations = this.customGutterDecorations[gutterName];
      if (gutterDecorations) {
        allDecorationIds = Object.keys(gutterDecorations);
        results = [];
        for (i = 0, len = allDecorationIds.length; i < len; i++) {
          decorationId = allDecorationIds[i];
          results.push(delete gutterDecorations[decorationId]);
        }
        return results;
      }
    };

    TextEditorPresenter.prototype.gutterIsVisible = function(gutterModel) {
      var isVisible;
      isVisible = gutterModel.isVisible();
      if (gutterModel.name === 'line-number') {
        isVisible = isVisible && this.model.doesShowLineNumbers();
      }
      return isVisible;
    };

    TextEditorPresenter.prototype.updateLineNumbersState = function(tileState, screenRows) {
      var blockDecorationsAfterPreviousScreenRowHeight, blockDecorationsBeforeCurrentScreenRowHeight, blockDecorationsHeight, bufferRow, decorationClasses, foldable, i, id, len, line, lineId, ref2, screenRow, softWrapped, visibleLineNumberIds;
      if (tileState.lineNumbers == null) {
        tileState.lineNumbers = {};
      }
      visibleLineNumberIds = {};
      for (i = 0, len = screenRows.length; i < len; i++) {
        screenRow = screenRows[i];
        if (!(this.isRowRendered(screenRow))) {
          continue;
        }
        line = this.linesByScreenRow.get(screenRow);
        if (line == null) {
          continue;
        }
        lineId = line.id;
        ref2 = this.displayLayer.softWrapDescriptorForScreenRow(screenRow), bufferRow = ref2.bufferRow, softWrapped = ref2.softWrappedAtStart;
        foldable = !softWrapped && this.model.isFoldableAtBufferRow(bufferRow);
        decorationClasses = this.lineNumberDecorationClassesForRow(screenRow);
        blockDecorationsBeforeCurrentScreenRowHeight = this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRow) - this.lineTopIndex.pixelPositionBeforeBlocksForRow(screenRow);
        blockDecorationsHeight = blockDecorationsBeforeCurrentScreenRowHeight;
        if (screenRow % this.tileSize !== 0) {
          blockDecorationsAfterPreviousScreenRowHeight = this.lineTopIndex.pixelPositionBeforeBlocksForRow(screenRow) - this.lineHeight - this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRow - 1);
          blockDecorationsHeight += blockDecorationsAfterPreviousScreenRowHeight;
        }
        tileState.lineNumbers[lineId] = {
          screenRow: screenRow,
          bufferRow: bufferRow,
          softWrapped: softWrapped,
          decorationClasses: decorationClasses,
          foldable: foldable,
          blockDecorationsHeight: blockDecorationsHeight
        };
        visibleLineNumberIds[lineId] = true;
      }
      for (id in tileState.lineNumbers) {
        if (!visibleLineNumberIds[id]) {
          delete tileState.lineNumbers[id];
        }
      }
    };

    TextEditorPresenter.prototype.updateStartRow = function() {
      if (!((this.scrollTop != null) && (this.lineHeight != null))) {
        return;
      }
      return this.startRow = Math.max(0, this.lineTopIndex.rowForPixelPosition(this.scrollTop));
    };

    TextEditorPresenter.prototype.updateEndRow = function() {
      if (!((this.scrollTop != null) && (this.lineHeight != null) && (this.height != null))) {
        return;
      }
      return this.endRow = Math.min(this.model.getApproximateScreenLineCount(), this.lineTopIndex.rowForPixelPosition(this.scrollTop + this.height + this.lineHeight - 1) + 1);
    };

    TextEditorPresenter.prototype.updateRowsPerPage = function() {
      var rowsPerPage;
      rowsPerPage = Math.floor(this.getClientHeight() / this.lineHeight);
      if (rowsPerPage !== this.rowsPerPage) {
        this.rowsPerPage = rowsPerPage;
        return this.model.setRowsPerPage(this.rowsPerPage);
      }
    };

    TextEditorPresenter.prototype.updateScrollWidth = function() {
      var scrollWidth;
      if (!((this.contentWidth != null) && (this.clientWidth != null))) {
        return;
      }
      scrollWidth = Math.max(this.contentWidth, this.clientWidth);
      if (this.scrollWidth !== scrollWidth) {
        this.scrollWidth = scrollWidth;
        return this.updateScrollLeft(this.scrollLeft);
      }
    };

    TextEditorPresenter.prototype.updateScrollHeight = function() {
      var contentHeight, extraScrollHeight, scrollHeight;
      if (!((this.contentHeight != null) && (this.clientHeight != null))) {
        return;
      }
      contentHeight = this.contentHeight;
      if (this.model.getScrollPastEnd()) {
        extraScrollHeight = this.clientHeight - (this.lineHeight * 3);
        if (extraScrollHeight > 0) {
          contentHeight += extraScrollHeight;
        }
      }
      scrollHeight = Math.max(contentHeight, this.height);
      if (this.scrollHeight !== scrollHeight) {
        this.scrollHeight = scrollHeight;
        return this.updateScrollTop(this.scrollTop);
      }
    };

    TextEditorPresenter.prototype.updateVerticalDimensions = function() {
      var oldContentHeight;
      if (this.lineHeight != null) {
        oldContentHeight = this.contentHeight;
        this.contentHeight = Math.round(this.lineTopIndex.pixelPositionAfterBlocksForRow(this.model.getApproximateScreenLineCount()));
      }
      if (this.contentHeight !== oldContentHeight) {
        this.updateHeight();
        this.updateScrollbarDimensions();
        return this.updateScrollHeight();
      }
    };

    TextEditorPresenter.prototype.updateHorizontalDimensions = function() {
      var oldContentWidth, rightmostPosition;
      if (this.baseCharacterWidth != null) {
        oldContentWidth = this.contentWidth;
        rightmostPosition = this.model.getApproximateRightmostScreenPosition();
        this.contentWidth = this.pixelPositionForScreenPosition(rightmostPosition).left;
        this.contentWidth += this.scrollLeft;
        if (!this.model.isSoftWrapped()) {
          this.contentWidth += 1;
        }
      }
      if (this.contentWidth !== oldContentWidth) {
        this.updateScrollbarDimensions();
        this.updateClientWidth();
        return this.updateScrollWidth();
      }
    };

    TextEditorPresenter.prototype.updateClientHeight = function() {
      var clientHeight;
      if (!((this.height != null) && (this.horizontalScrollbarHeight != null))) {
        return;
      }
      clientHeight = this.height - this.horizontalScrollbarHeight;
      this.model.setHeight(clientHeight, true);
      if (this.clientHeight !== clientHeight) {
        this.clientHeight = clientHeight;
        this.updateScrollHeight();
        return this.updateScrollTop(this.scrollTop);
      }
    };

    TextEditorPresenter.prototype.updateClientWidth = function() {
      var clientWidth;
      if (!((this.contentFrameWidth != null) && (this.verticalScrollbarWidth != null))) {
        return;
      }
      if (this.model.getAutoWidth()) {
        clientWidth = this.contentWidth;
      } else {
        clientWidth = this.contentFrameWidth - this.verticalScrollbarWidth;
      }
      if (!this.editorWidthInChars) {
        this.model.setWidth(clientWidth, true);
      }
      if (this.clientWidth !== clientWidth) {
        this.clientWidth = clientWidth;
        this.updateScrollWidth();
        return this.updateScrollLeft(this.scrollLeft);
      }
    };

    TextEditorPresenter.prototype.updateScrollTop = function(scrollTop) {
      scrollTop = this.constrainScrollTop(scrollTop);
      if (scrollTop !== this.realScrollTop && !Number.isNaN(scrollTop)) {
        this.realScrollTop = scrollTop;
        this.scrollTop = Math.round(scrollTop);
        this.model.setFirstVisibleScreenRow(Math.round(this.scrollTop / this.lineHeight), true);
        this.updateStartRow();
        this.updateEndRow();
        this.didStartScrolling();
        return this.emitter.emit('did-change-scroll-top', this.scrollTop);
      }
    };

    TextEditorPresenter.prototype.constrainScrollTop = function(scrollTop) {
      if (!((scrollTop != null) && (this.scrollHeight != null) && (this.clientHeight != null))) {
        return scrollTop;
      }
      return Math.max(0, Math.min(scrollTop, this.scrollHeight - this.clientHeight));
    };

    TextEditorPresenter.prototype.updateScrollLeft = function(scrollLeft) {
      scrollLeft = this.constrainScrollLeft(scrollLeft);
      if (scrollLeft !== this.realScrollLeft && !Number.isNaN(scrollLeft)) {
        this.realScrollLeft = scrollLeft;
        this.scrollLeft = Math.round(scrollLeft);
        this.model.setFirstVisibleScreenColumn(Math.round(this.scrollLeft / this.baseCharacterWidth));
        return this.emitter.emit('did-change-scroll-left', this.scrollLeft);
      }
    };

    TextEditorPresenter.prototype.constrainScrollLeft = function(scrollLeft) {
      if (!((scrollLeft != null) && (this.scrollWidth != null) && (this.clientWidth != null))) {
        return scrollLeft;
      }
      return Math.max(0, Math.min(scrollLeft, this.scrollWidth - this.clientWidth));
    };

    TextEditorPresenter.prototype.updateScrollbarDimensions = function() {
      var clientHeightWithHorizontalScrollbar, clientHeightWithoutHorizontalScrollbar, clientWidthWithVerticalScrollbar, clientWidthWithoutVerticalScrollbar, horizontalScrollbarHeight, horizontalScrollbarVisible, verticalScrollbarVisible, verticalScrollbarWidth;
      if (!((this.contentFrameWidth != null) && (this.height != null))) {
        return;
      }
      if (!((this.measuredVerticalScrollbarWidth != null) && (this.measuredHorizontalScrollbarHeight != null))) {
        return;
      }
      if (!((this.contentWidth != null) && (this.contentHeight != null))) {
        return;
      }
      if (this.model.getAutoWidth()) {
        clientWidthWithVerticalScrollbar = this.contentWidth + this.measuredVerticalScrollbarWidth;
      } else {
        clientWidthWithVerticalScrollbar = this.contentFrameWidth;
      }
      clientWidthWithoutVerticalScrollbar = clientWidthWithVerticalScrollbar - this.measuredVerticalScrollbarWidth;
      clientHeightWithHorizontalScrollbar = this.height;
      clientHeightWithoutHorizontalScrollbar = clientHeightWithHorizontalScrollbar - this.measuredHorizontalScrollbarHeight;
      horizontalScrollbarVisible = !this.model.isMini() && (this.contentWidth > clientWidthWithVerticalScrollbar || this.contentWidth > clientWidthWithoutVerticalScrollbar && this.contentHeight > clientHeightWithHorizontalScrollbar);
      verticalScrollbarVisible = !this.model.isMini() && (this.contentHeight > clientHeightWithHorizontalScrollbar || this.contentHeight > clientHeightWithoutHorizontalScrollbar && this.contentWidth > clientWidthWithVerticalScrollbar);
      horizontalScrollbarHeight = horizontalScrollbarVisible ? this.measuredHorizontalScrollbarHeight : 0;
      verticalScrollbarWidth = verticalScrollbarVisible ? this.measuredVerticalScrollbarWidth : 0;
      if (this.horizontalScrollbarHeight !== horizontalScrollbarHeight) {
        this.horizontalScrollbarHeight = horizontalScrollbarHeight;
        this.updateClientHeight();
      }
      if (this.verticalScrollbarWidth !== verticalScrollbarWidth) {
        this.verticalScrollbarWidth = verticalScrollbarWidth;
        return this.updateClientWidth();
      }
    };

    TextEditorPresenter.prototype.lineDecorationClassesForRow = function(row) {
      var decorationClasses, id, properties, ref2;
      if (this.model.isMini()) {
        return null;
      }
      decorationClasses = null;
      ref2 = this.lineDecorationsByScreenRow[row];
      for (id in ref2) {
        properties = ref2[id];
        if (decorationClasses == null) {
          decorationClasses = [];
        }
        decorationClasses.push(properties["class"]);
      }
      return decorationClasses;
    };

    TextEditorPresenter.prototype.lineNumberDecorationClassesForRow = function(row) {
      var decorationClasses, id, properties, ref2;
      if (this.model.isMini()) {
        return null;
      }
      decorationClasses = null;
      ref2 = this.lineNumberDecorationsByScreenRow[row];
      for (id in ref2) {
        properties = ref2[id];
        if (decorationClasses == null) {
          decorationClasses = [];
        }
        decorationClasses.push(properties["class"]);
      }
      return decorationClasses;
    };

    TextEditorPresenter.prototype.getCursorBlinkPeriod = function() {
      return this.cursorBlinkPeriod;
    };

    TextEditorPresenter.prototype.getCursorBlinkResumeDelay = function() {
      return this.cursorBlinkResumeDelay;
    };

    TextEditorPresenter.prototype.setFocused = function(focused) {
      if (this.focused !== focused) {
        this.focused = focused;
        if (this.focused) {
          this.startBlinkingCursors();
        } else {
          this.stopBlinkingCursors(false);
        }
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setScrollTop = function(scrollTop) {
      if (scrollTop == null) {
        return;
      }
      this.pendingScrollLogicalPosition = null;
      this.pendingScrollTop = scrollTop;
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.getScrollTop = function() {
      return this.scrollTop;
    };

    TextEditorPresenter.prototype.getRealScrollTop = function() {
      var ref2;
      return (ref2 = this.realScrollTop) != null ? ref2 : this.scrollTop;
    };

    TextEditorPresenter.prototype.didStartScrolling = function() {
      if (this.stoppedScrollingTimeoutId != null) {
        clearTimeout(this.stoppedScrollingTimeoutId);
        this.stoppedScrollingTimeoutId = null;
      }
      return this.stoppedScrollingTimeoutId = setTimeout(this.didStopScrolling.bind(this), this.stoppedScrollingDelay);
    };

    TextEditorPresenter.prototype.didStopScrolling = function() {
      if (this.mouseWheelScreenRow != null) {
        this.mouseWheelScreenRow = null;
        this.shouldUpdateDecorations = true;
      }
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.setScrollLeft = function(scrollLeft) {
      if (scrollLeft == null) {
        return;
      }
      this.pendingScrollLogicalPosition = null;
      this.pendingScrollLeft = scrollLeft;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.getScrollLeft = function() {
      return this.scrollLeft;
    };

    TextEditorPresenter.prototype.getRealScrollLeft = function() {
      var ref2;
      return (ref2 = this.realScrollLeft) != null ? ref2 : this.scrollLeft;
    };

    TextEditorPresenter.prototype.getClientHeight = function() {
      if (this.clientHeight) {
        return this.clientHeight;
      } else {
        return this.explicitHeight - this.horizontalScrollbarHeight;
      }
    };

    TextEditorPresenter.prototype.getClientWidth = function() {
      if (this.clientWidth) {
        return this.clientWidth;
      } else {
        return this.contentFrameWidth - this.verticalScrollbarWidth;
      }
    };

    TextEditorPresenter.prototype.getScrollBottom = function() {
      return this.getScrollTop() + this.getClientHeight();
    };

    TextEditorPresenter.prototype.setScrollBottom = function(scrollBottom) {
      this.setScrollTop(scrollBottom - this.getClientHeight());
      return this.getScrollBottom();
    };

    TextEditorPresenter.prototype.getScrollRight = function() {
      return this.getScrollLeft() + this.getClientWidth();
    };

    TextEditorPresenter.prototype.setScrollRight = function(scrollRight) {
      this.setScrollLeft(scrollRight - this.getClientWidth());
      return this.getScrollRight();
    };

    TextEditorPresenter.prototype.getScrollHeight = function() {
      return this.scrollHeight;
    };

    TextEditorPresenter.prototype.getScrollWidth = function() {
      return this.scrollWidth;
    };

    TextEditorPresenter.prototype.getMaxScrollTop = function() {
      var clientHeight, scrollHeight;
      scrollHeight = this.getScrollHeight();
      clientHeight = this.getClientHeight();
      if (!((scrollHeight != null) && (clientHeight != null))) {
        return 0;
      }
      return scrollHeight - clientHeight;
    };

    TextEditorPresenter.prototype.setHorizontalScrollbarHeight = function(horizontalScrollbarHeight) {
      if (this.measuredHorizontalScrollbarHeight !== horizontalScrollbarHeight) {
        this.measuredHorizontalScrollbarHeight = horizontalScrollbarHeight;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setVerticalScrollbarWidth = function(verticalScrollbarWidth) {
      if (this.measuredVerticalScrollbarWidth !== verticalScrollbarWidth) {
        this.measuredVerticalScrollbarWidth = verticalScrollbarWidth;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setAutoHeight = function(autoHeight) {
      if (this.autoHeight !== autoHeight) {
        this.autoHeight = autoHeight;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setExplicitHeight = function(explicitHeight) {
      if (this.explicitHeight !== explicitHeight) {
        this.explicitHeight = explicitHeight;
        this.updateHeight();
        this.shouldUpdateDecorations = true;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.updateHeight = function() {
      var height, ref2;
      height = (ref2 = this.explicitHeight) != null ? ref2 : this.contentHeight;
      if (this.height !== height) {
        this.height = height;
        this.updateScrollbarDimensions();
        this.updateClientHeight();
        this.updateScrollHeight();
        return this.updateEndRow();
      }
    };

    TextEditorPresenter.prototype.didChangeAutoWidth = function() {
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.setContentFrameWidth = function(contentFrameWidth) {
      if (this.contentFrameWidth !== contentFrameWidth || (this.editorWidthInChars != null)) {
        this.contentFrameWidth = contentFrameWidth;
        this.editorWidthInChars = null;
        this.updateScrollbarDimensions();
        this.updateClientWidth();
        this.invalidateAllBlockDecorationsDimensions = true;
        this.shouldUpdateDecorations = true;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setBoundingClientRect = function(boundingClientRect) {
      if (!this.clientRectsEqual(this.boundingClientRect, boundingClientRect)) {
        this.boundingClientRect = boundingClientRect;
        this.invalidateAllBlockDecorationsDimensions = true;
        this.shouldUpdateDecorations = true;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.clientRectsEqual = function(clientRectA, clientRectB) {
      return (clientRectA != null) && (clientRectB != null) && clientRectA.top === clientRectB.top && clientRectA.left === clientRectB.left && clientRectA.width === clientRectB.width && clientRectA.height === clientRectB.height;
    };

    TextEditorPresenter.prototype.setWindowSize = function(width, height) {
      if (this.windowWidth !== width || this.windowHeight !== height) {
        this.windowWidth = width;
        this.windowHeight = height;
        this.invalidateAllBlockDecorationsDimensions = true;
        this.shouldUpdateDecorations = true;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setBackgroundColor = function(backgroundColor) {
      if (this.backgroundColor !== backgroundColor) {
        this.backgroundColor = backgroundColor;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setGutterBackgroundColor = function(gutterBackgroundColor) {
      if (this.gutterBackgroundColor !== gutterBackgroundColor) {
        this.gutterBackgroundColor = gutterBackgroundColor;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setGutterWidth = function(gutterWidth) {
      if (this.gutterWidth !== gutterWidth) {
        this.gutterWidth = gutterWidth;
        return this.updateOverlaysState();
      }
    };

    TextEditorPresenter.prototype.getGutterWidth = function() {
      return this.gutterWidth;
    };

    TextEditorPresenter.prototype.setLineHeight = function(lineHeight) {
      if (this.lineHeight !== lineHeight) {
        this.lineHeight = lineHeight;
        this.model.setLineHeightInPixels(this.lineHeight);
        this.lineTopIndex.setDefaultLineHeight(this.lineHeight);
        this.restoreScrollTopIfNeeded();
        this.model.setLineHeightInPixels(lineHeight);
        this.shouldUpdateDecorations = true;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setMouseWheelScreenRow = function(screenRow) {
      if (this.mouseWheelScreenRow !== screenRow) {
        this.mouseWheelScreenRow = screenRow;
        return this.didStartScrolling();
      }
    };

    TextEditorPresenter.prototype.setBaseCharacterWidth = function(baseCharacterWidth, doubleWidthCharWidth, halfWidthCharWidth, koreanCharWidth) {
      if (!(this.baseCharacterWidth === baseCharacterWidth && this.doubleWidthCharWidth === doubleWidthCharWidth && this.halfWidthCharWidth === halfWidthCharWidth && koreanCharWidth === this.koreanCharWidth)) {
        this.baseCharacterWidth = baseCharacterWidth;
        this.doubleWidthCharWidth = doubleWidthCharWidth;
        this.halfWidthCharWidth = halfWidthCharWidth;
        this.koreanCharWidth = koreanCharWidth;
        this.model.setDefaultCharWidth(baseCharacterWidth, doubleWidthCharWidth, halfWidthCharWidth, koreanCharWidth);
        this.restoreScrollLeftIfNeeded();
        return this.measurementsChanged();
      }
    };

    TextEditorPresenter.prototype.measurementsChanged = function() {
      this.invalidateAllBlockDecorationsDimensions = true;
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.hasPixelPositionRequirements = function() {
      return (this.lineHeight != null) && (this.baseCharacterWidth != null);
    };

    TextEditorPresenter.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      var position;
      position = this.linesYardstick.pixelPositionForScreenPosition(screenPosition);
      position.top -= this.getScrollTop();
      position.left -= this.getScrollLeft();
      position.top = Math.round(position.top);
      position.left = Math.round(position.left);
      return position;
    };

    TextEditorPresenter.prototype.hasPixelRectRequirements = function() {
      return this.hasPixelPositionRequirements() && (this.scrollWidth != null);
    };

    TextEditorPresenter.prototype.hasOverlayPositionRequirements = function() {
      return this.hasPixelRectRequirements() && (this.boundingClientRect != null) && this.windowWidth && this.windowHeight;
    };

    TextEditorPresenter.prototype.absolutePixelRectForScreenRange = function(screenRange) {
      var height, left, lineHeight, ref2, top, width;
      lineHeight = this.model.getLineHeightInPixels();
      if (screenRange.end.row > screenRange.start.row) {
        top = this.linesYardstick.pixelPositionForScreenPosition(screenRange.start).top;
        left = 0;
        height = (screenRange.end.row - screenRange.start.row + 1) * lineHeight;
        width = this.getScrollWidth();
      } else {
        ref2 = this.linesYardstick.pixelPositionForScreenPosition(screenRange.start), top = ref2.top, left = ref2.left;
        height = lineHeight;
        width = this.linesYardstick.pixelPositionForScreenPosition(screenRange.end).left - left;
      }
      return {
        top: top,
        left: left,
        width: width,
        height: height
      };
    };

    TextEditorPresenter.prototype.pixelRectForScreenRange = function(screenRange) {
      var rect;
      rect = this.absolutePixelRectForScreenRange(screenRange);
      rect.top -= this.getScrollTop();
      rect.left -= this.getScrollLeft();
      rect.top = Math.round(rect.top);
      rect.left = Math.round(rect.left);
      rect.width = Math.round(rect.width);
      rect.height = Math.round(rect.height);
      return rect;
    };

    TextEditorPresenter.prototype.updateLines = function() {
      var endRow, i, index, len, line, ref2, ref3, results, startRow;
      this.linesByScreenRow.clear();
      ref2 = this.getScreenRangesToRender();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        ref3 = ref2[i], startRow = ref3[0], endRow = ref3[1];
        results.push((function() {
          var j, len1, ref4, results1;
          ref4 = this.displayLayer.getScreenLines(startRow, endRow + 1);
          results1 = [];
          for (index = j = 0, len1 = ref4.length; j < len1; index = ++j) {
            line = ref4[index];
            results1.push(this.linesByScreenRow.set(startRow + index, line));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    TextEditorPresenter.prototype.lineIdForScreenRow = function(screenRow) {
      var ref2;
      return (ref2 = this.linesByScreenRow.get(screenRow)) != null ? ref2.id : void 0;
    };

    TextEditorPresenter.prototype.fetchDecorations = function() {
      var ref2, ref3;
      if (!(((0 <= (ref3 = this.startRow) && ref3 <= (ref2 = this.endRow)) && ref2 <= 2e308))) {
        return;
      }
      return this.decorations = this.model.decorationsStateForScreenRowRange(this.startRow, this.endRow - 1);
    };

    TextEditorPresenter.prototype.updateBlockDecorations = function() {
      var base, base1, blockDecoration, blockDecorations, decoration, decorations, i, id, j, len, len1, markerId, ref2, ref3, ref4, ref5, ref6, ref7, screenRow, visibleDecorationsById, visibleDecorationsByScreenRowAndId;
      if (this.invalidateAllBlockDecorationsDimensions) {
        ref2 = this.model.getDecorations({
          type: 'block'
        });
        for (i = 0, len = ref2.length; i < len; i++) {
          decoration = ref2[i];
          this.invalidatedDimensionsByBlockDecoration.add(decoration);
        }
        this.invalidateAllBlockDecorationsDimensions = false;
      }
      visibleDecorationsById = {};
      visibleDecorationsByScreenRowAndId = {};
      ref3 = this.model.decorationsForScreenRowRange(this.getStartTileRow(), this.getEndTileRow() + this.tileSize - 1);
      for (markerId in ref3) {
        decorations = ref3[markerId];
        for (j = 0, len1 = decorations.length; j < len1; j++) {
          decoration = decorations[j];
          if (!(decoration.isType('block'))) {
            continue;
          }
          screenRow = decoration.getMarker().getHeadScreenPosition().row;
          if (decoration.getProperties().position === "after") {
            if ((base = this.followingBlockDecorationsByScreenRowAndId)[screenRow] == null) {
              base[screenRow] = {};
            }
            this.followingBlockDecorationsByScreenRowAndId[screenRow][decoration.id] = {
              screenRow: screenRow,
              decoration: decoration
            };
          } else {
            if ((base1 = this.precedingBlockDecorationsByScreenRowAndId)[screenRow] == null) {
              base1[screenRow] = {};
            }
            this.precedingBlockDecorationsByScreenRowAndId[screenRow][decoration.id] = {
              screenRow: screenRow,
              decoration: decoration
            };
          }
          visibleDecorationsById[decoration.id] = true;
          if (visibleDecorationsByScreenRowAndId[screenRow] == null) {
            visibleDecorationsByScreenRowAndId[screenRow] = {};
          }
          visibleDecorationsByScreenRowAndId[screenRow][decoration.id] = true;
        }
      }
      ref4 = this.precedingBlockDecorationsByScreenRowAndId;
      for (screenRow in ref4) {
        blockDecorations = ref4[screenRow];
        if (Number(screenRow) !== this.mouseWheelScreenRow) {
          for (id in blockDecorations) {
            blockDecoration = blockDecorations[id];
            if (!((ref5 = visibleDecorationsByScreenRowAndId[screenRow]) != null ? ref5[id] : void 0)) {
              delete this.precedingBlockDecorationsByScreenRowAndId[screenRow][id];
            }
          }
        }
      }
      ref6 = this.followingBlockDecorationsByScreenRowAndId;
      for (screenRow in ref6) {
        blockDecorations = ref6[screenRow];
        if (Number(screenRow) !== this.mouseWheelScreenRow) {
          for (id in blockDecorations) {
            blockDecoration = blockDecorations[id];
            if (!((ref7 = visibleDecorationsByScreenRowAndId[screenRow]) != null ? ref7[id] : void 0)) {
              delete this.followingBlockDecorationsByScreenRowAndId[screenRow][id];
            }
          }
        }
      }
      this.state.content.offScreenBlockDecorations = {};
      return this.invalidatedDimensionsByBlockDecoration.forEach((function(_this) {
        return function(decoration) {
          if (!visibleDecorationsById[decoration.id]) {
            return _this.state.content.offScreenBlockDecorations[decoration.id] = decoration;
          }
        };
      })(this));
    };

    TextEditorPresenter.prototype.updateLineDecorations = function() {
      var base, bufferRange, decorationId, decorationState, name, properties, rangeIsReversed, ref2, screenRange;
      this.lineDecorationsByScreenRow = {};
      this.lineNumberDecorationsByScreenRow = {};
      this.customGutterDecorationsByGutterName = {};
      ref2 = this.decorations;
      for (decorationId in ref2) {
        decorationState = ref2[decorationId];
        properties = decorationState.properties, bufferRange = decorationState.bufferRange, screenRange = decorationState.screenRange, rangeIsReversed = decorationState.rangeIsReversed;
        if (Decoration.isType(properties, 'line') || Decoration.isType(properties, 'line-number')) {
          this.addToLineDecorationCaches(decorationId, properties, bufferRange, screenRange, rangeIsReversed);
        } else if (Decoration.isType(properties, 'gutter') && (properties.gutterName != null)) {
          if ((base = this.customGutterDecorationsByGutterName)[name = properties.gutterName] == null) {
            base[name] = {};
          }
          this.customGutterDecorationsByGutterName[properties.gutterName][decorationId] = decorationState;
        }
      }
    };

    TextEditorPresenter.prototype.updateHighlightDecorations = function() {
      var decorationId, id, properties, ref2, ref3, ref4, ref5, screenRange, tileId, tileState;
      this.visibleHighlights = {};
      ref2 = this.decorations;
      for (decorationId in ref2) {
        ref3 = ref2[decorationId], properties = ref3.properties, screenRange = ref3.screenRange;
        if (Decoration.isType(properties, 'highlight')) {
          this.updateHighlightState(decorationId, properties, screenRange);
        }
      }
      ref4 = this.state.content.tiles;
      for (tileId in ref4) {
        tileState = ref4[tileId];
        for (id in tileState.highlights) {
          if (((ref5 = this.visibleHighlights[tileId]) != null ? ref5[id] : void 0) == null) {
            delete tileState.highlights[id];
          }
        }
      }
    };

    TextEditorPresenter.prototype.addToLineDecorationCaches = function(decorationId, properties, bufferRange, screenRange, rangeIsReversed) {
      var base, base1, base2, headScreenPosition, i, omitLastRow, ref2, ref3, row, screenRow;
      if (screenRange.isEmpty()) {
        if (properties.onlyNonEmpty) {
          return;
        }
      } else {
        if (properties.onlyEmpty) {
          return;
        }
        omitLastRow = screenRange.end.column === 0;
      }
      if (rangeIsReversed) {
        headScreenPosition = screenRange.start;
      } else {
        headScreenPosition = screenRange.end;
      }
      if (properties["class"] === 'folded' && Decoration.isType(properties, 'line-number')) {
        screenRow = this.model.screenRowForBufferRow(bufferRange.start.row);
        if ((base = this.lineNumberDecorationsByScreenRow)[screenRow] == null) {
          base[screenRow] = {};
        }
        this.lineNumberDecorationsByScreenRow[screenRow][decorationId] = properties;
      } else {
        for (row = i = ref2 = screenRange.start.row, ref3 = screenRange.end.row; i <= ref3; row = i += 1) {
          if (properties.onlyHead && row !== headScreenPosition.row) {
            continue;
          }
          if (omitLastRow && row === screenRange.end.row) {
            continue;
          }
          if (Decoration.isType(properties, 'line')) {
            if ((base1 = this.lineDecorationsByScreenRow)[row] == null) {
              base1[row] = {};
            }
            this.lineDecorationsByScreenRow[row][decorationId] = properties;
          }
          if (Decoration.isType(properties, 'line-number')) {
            if ((base2 = this.lineNumberDecorationsByScreenRow)[row] == null) {
              base2[row] = {};
            }
            this.lineNumberDecorationsByScreenRow[row][decorationId] = properties;
          }
        }
      }
    };

    TextEditorPresenter.prototype.intersectRangeWithTile = function(range, tileStartRow) {
      var intersectingEndRow, intersectingRange, intersectingStartRow;
      intersectingStartRow = Math.max(tileStartRow, range.start.row);
      intersectingEndRow = Math.min(tileStartRow + this.tileSize - 1, range.end.row);
      intersectingRange = new Range(new Point(intersectingStartRow, 0), new Point(intersectingEndRow, 2e308));
      if (intersectingStartRow === range.start.row) {
        intersectingRange.start.column = range.start.column;
      }
      if (intersectingEndRow === range.end.row) {
        intersectingRange.end.column = range.end.column;
      }
      return intersectingRange;
    };

    TextEditorPresenter.prototype.updateHighlightState = function(decorationId, properties, screenRange) {
      var base, base1, base2, endTile, highlightState, i, j, len, needsFlash, rangeWithinTile, ref2, ref3, ref4, ref5, region, startTile, tileStartRow, tileState;
      if (!((this.startRow != null) && (this.endRow != null) && (this.lineHeight != null) && this.hasPixelPositionRequirements())) {
        return;
      }
      this.constrainRangeToVisibleRowRange(screenRange);
      if (screenRange.isEmpty()) {
        return;
      }
      startTile = this.tileForRow(screenRange.start.row);
      endTile = this.tileForRow(screenRange.end.row);
      needsFlash = (properties.flashCount != null) && this.flashCountsByDecorationId[decorationId] !== properties.flashCount;
      if (needsFlash) {
        this.flashCountsByDecorationId[decorationId] = properties.flashCount;
      }
      for (tileStartRow = i = ref2 = startTile, ref3 = endTile, ref4 = this.tileSize; ref4 > 0 ? i <= ref3 : i >= ref3; tileStartRow = i += ref4) {
        rangeWithinTile = this.intersectRangeWithTile(screenRange, tileStartRow);
        if (rangeWithinTile.isEmpty()) {
          continue;
        }
        tileState = (base = this.state.content.tiles)[tileStartRow] != null ? base[tileStartRow] : base[tileStartRow] = {
          highlights: {}
        };
        highlightState = (base1 = tileState.highlights)[decorationId] != null ? base1[decorationId] : base1[decorationId] = {};
        highlightState.needsFlash = needsFlash;
        highlightState.flashCount = properties.flashCount;
        highlightState.flashClass = properties.flashClass;
        highlightState.flashDuration = properties.flashDuration;
        highlightState["class"] = properties["class"];
        highlightState.deprecatedRegionClass = properties.deprecatedRegionClass;
        highlightState.regions = this.buildHighlightRegions(rangeWithinTile);
        ref5 = highlightState.regions;
        for (j = 0, len = ref5.length; j < len; j++) {
          region = ref5[j];
          this.repositionRegionWithinTile(region, tileStartRow);
        }
        if ((base2 = this.visibleHighlights)[tileStartRow] == null) {
          base2[tileStartRow] = {};
        }
        this.visibleHighlights[tileStartRow][decorationId] = true;
      }
      return true;
    };

    TextEditorPresenter.prototype.constrainRangeToVisibleRowRange = function(screenRange) {
      if (screenRange.start.row < this.startRow) {
        screenRange.start.row = this.startRow;
        screenRange.start.column = 0;
      }
      if (screenRange.end.row < this.startRow) {
        screenRange.end.row = this.startRow;
        screenRange.end.column = 0;
      }
      if (screenRange.start.row >= this.endRow) {
        screenRange.start.row = this.endRow;
        screenRange.start.column = 0;
      }
      if (screenRange.end.row >= this.endRow) {
        screenRange.end.row = this.endRow;
        return screenRange.end.column = 0;
      }
    };

    TextEditorPresenter.prototype.repositionRegionWithinTile = function(region, tileStartRow) {
      region.top += this.scrollTop - this.lineTopIndex.pixelPositionBeforeBlocksForRow(tileStartRow);
      return region.left += this.scrollLeft;
    };

    TextEditorPresenter.prototype.buildHighlightRegions = function(screenRange) {
      var endPixelPosition, lineHeightInPixels, region, regions, spannedRows, startPixelPosition;
      lineHeightInPixels = this.lineHeight;
      startPixelPosition = this.pixelPositionForScreenPosition(screenRange.start);
      endPixelPosition = this.pixelPositionForScreenPosition(screenRange.end);
      spannedRows = screenRange.end.row - screenRange.start.row + 1;
      regions = [];
      if (spannedRows === 1) {
        region = {
          top: startPixelPosition.top,
          height: lineHeightInPixels,
          left: startPixelPosition.left
        };
        if (screenRange.end.column === 2e308) {
          region.right = 0;
        } else {
          region.width = endPixelPosition.left - startPixelPosition.left;
        }
        regions.push(region);
      } else {
        regions.push({
          top: startPixelPosition.top,
          left: startPixelPosition.left,
          height: lineHeightInPixels,
          right: 0
        });
        if (spannedRows > 2) {
          regions.push({
            top: startPixelPosition.top + lineHeightInPixels,
            height: endPixelPosition.top - startPixelPosition.top - lineHeightInPixels,
            left: 0,
            right: 0
          });
        }
        if (screenRange.end.column > 0) {
          region = {
            top: endPixelPosition.top,
            height: lineHeightInPixels,
            left: 0
          };
          if (screenRange.end.column === 2e308) {
            region.right = 0;
          } else {
            region.width = endPixelPosition.left;
          }
          regions.push(region);
        }
      }
      return regions;
    };

    TextEditorPresenter.prototype.setOverlayDimensions = function(decorationId, itemWidth, itemHeight, contentMargin) {
      var base, dimensionsAreEqual, overlayState;
      if ((base = this.overlayDimensions)[decorationId] == null) {
        base[decorationId] = {};
      }
      overlayState = this.overlayDimensions[decorationId];
      dimensionsAreEqual = overlayState.itemWidth === itemWidth && overlayState.itemHeight === itemHeight && overlayState.contentMargin === contentMargin;
      if (!dimensionsAreEqual) {
        overlayState.itemWidth = itemWidth;
        overlayState.itemHeight = itemHeight;
        overlayState.contentMargin = contentMargin;
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.setBlockDecorationDimensions = function(decoration, width, height) {
      if (!this.observedBlockDecorations.has(decoration)) {
        return;
      }
      this.lineTopIndex.resizeBlock(decoration.id, height);
      this.invalidatedDimensionsByBlockDecoration["delete"](decoration);
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.invalidateBlockDecorationDimensions = function(decoration) {
      this.invalidatedDimensionsByBlockDecoration.add(decoration);
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.spliceBlockDecorationsInRange = function(start, end, screenDelta) {
      var invalidatedBlockDecorationIds, newExtent, oldExtent;
      if (screenDelta === 0) {
        return;
      }
      oldExtent = end - start;
      newExtent = end - start + screenDelta;
      invalidatedBlockDecorationIds = this.lineTopIndex.splice(start, oldExtent, newExtent);
      return invalidatedBlockDecorationIds.forEach((function(_this) {
        return function(id) {
          var decoration, newScreenPosition;
          decoration = _this.model.decorationForId(id);
          newScreenPosition = decoration.getMarker().getHeadScreenPosition();
          _this.lineTopIndex.moveBlock(id, newScreenPosition.row);
          return _this.invalidatedDimensionsByBlockDecoration.add(decoration);
        };
      })(this));
    };

    TextEditorPresenter.prototype.didAddBlockDecoration = function(decoration) {
      var didDestroyDisposable, didMoveDisposable, isAfter;
      if (!decoration.isType('block') || this.observedBlockDecorations.has(decoration)) {
        return;
      }
      didMoveDisposable = decoration.getMarker().bufferMarker.onDidChange((function(_this) {
        return function(markerEvent) {
          return _this.didMoveBlockDecoration(decoration, markerEvent);
        };
      })(this));
      didDestroyDisposable = decoration.onDidDestroy((function(_this) {
        return function() {
          _this.disposables.remove(didMoveDisposable);
          _this.disposables.remove(didDestroyDisposable);
          didMoveDisposable.dispose();
          didDestroyDisposable.dispose();
          return _this.didDestroyBlockDecoration(decoration);
        };
      })(this));
      isAfter = decoration.getProperties().position === "after";
      this.lineTopIndex.insertBlock(decoration.id, decoration.getMarker().getHeadScreenPosition().row, 0, isAfter);
      this.observedBlockDecorations.add(decoration);
      this.invalidateBlockDecorationDimensions(decoration);
      this.disposables.add(didMoveDisposable);
      this.disposables.add(didDestroyDisposable);
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.didMoveBlockDecoration = function(decoration, markerEvent) {
      if (markerEvent.textChanged) {
        return;
      }
      this.lineTopIndex.moveBlock(decoration.id, decoration.getMarker().getHeadScreenPosition().row);
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.didDestroyBlockDecoration = function(decoration) {
      if (!this.observedBlockDecorations.has(decoration)) {
        return;
      }
      this.lineTopIndex.removeBlock(decoration.id);
      this.observedBlockDecorations["delete"](decoration);
      this.invalidatedDimensionsByBlockDecoration["delete"](decoration);
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.observeCursor = function(cursor) {
      var didChangePositionDisposable, didChangeVisibilityDisposable, didDestroyDisposable;
      didChangePositionDisposable = cursor.onDidChangePosition((function(_this) {
        return function() {
          _this.pauseCursorBlinking();
          return _this.emitDidUpdateState();
        };
      })(this));
      didChangeVisibilityDisposable = cursor.onDidChangeVisibility((function(_this) {
        return function() {
          return _this.emitDidUpdateState();
        };
      })(this));
      didDestroyDisposable = cursor.onDidDestroy((function(_this) {
        return function() {
          _this.disposables.remove(didChangePositionDisposable);
          _this.disposables.remove(didChangeVisibilityDisposable);
          _this.disposables.remove(didDestroyDisposable);
          return _this.emitDidUpdateState();
        };
      })(this));
      this.disposables.add(didChangePositionDisposable);
      this.disposables.add(didChangeVisibilityDisposable);
      return this.disposables.add(didDestroyDisposable);
    };

    TextEditorPresenter.prototype.didAddCursor = function(cursor) {
      this.observeCursor(cursor);
      this.pauseCursorBlinking();
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.startBlinkingCursors = function() {
      if (!this.isCursorBlinking()) {
        this.state.content.cursorsVisible = true;
        return this.toggleCursorBlinkHandle = setInterval(this.toggleCursorBlink.bind(this), this.getCursorBlinkPeriod() / 2);
      }
    };

    TextEditorPresenter.prototype.isCursorBlinking = function() {
      return this.toggleCursorBlinkHandle != null;
    };

    TextEditorPresenter.prototype.stopBlinkingCursors = function(visible) {
      if (this.isCursorBlinking()) {
        this.state.content.cursorsVisible = visible;
        clearInterval(this.toggleCursorBlinkHandle);
        return this.toggleCursorBlinkHandle = null;
      }
    };

    TextEditorPresenter.prototype.toggleCursorBlink = function() {
      this.state.content.cursorsVisible = !this.state.content.cursorsVisible;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.pauseCursorBlinking = function() {
      if (this.isCursorBlinking()) {
        this.stopBlinkingCursors(true);
        if (this.startBlinkingCursorsAfterDelay == null) {
          this.startBlinkingCursorsAfterDelay = _.debounce(this.startBlinkingCursors, this.getCursorBlinkResumeDelay());
        }
        this.startBlinkingCursorsAfterDelay();
        return this.emitDidUpdateState();
      }
    };

    TextEditorPresenter.prototype.requestAutoscroll = function(position) {
      this.pendingScrollLogicalPosition = position;
      this.pendingScrollTop = null;
      this.pendingScrollLeft = null;
      this.shouldUpdateDecorations = true;
      return this.emitDidUpdateState();
    };

    TextEditorPresenter.prototype.didChangeFirstVisibleScreenRow = function(screenRow) {
      return this.setScrollTop(this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRow));
    };

    TextEditorPresenter.prototype.getVerticalScrollMarginInPixels = function() {
      return Math.round(this.model.getVerticalScrollMargin() * this.lineHeight);
    };

    TextEditorPresenter.prototype.getHorizontalScrollMarginInPixels = function() {
      return Math.round(this.model.getHorizontalScrollMargin() * this.baseCharacterWidth);
    };

    TextEditorPresenter.prototype.getVerticalScrollbarWidth = function() {
      return this.verticalScrollbarWidth;
    };

    TextEditorPresenter.prototype.getHorizontalScrollbarHeight = function() {
      return this.horizontalScrollbarHeight;
    };

    TextEditorPresenter.prototype.commitPendingLogicalScrollTopPosition = function() {
      var bottom, desiredScrollBottom, desiredScrollCenter, desiredScrollTop, options, ref2, ref3, screenRange, top, verticalScrollMarginInPixels;
      if (this.pendingScrollLogicalPosition == null) {
        return;
      }
      ref2 = this.pendingScrollLogicalPosition, screenRange = ref2.screenRange, options = ref2.options;
      verticalScrollMarginInPixels = this.getVerticalScrollMarginInPixels();
      top = this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRange.start.row);
      bottom = this.lineTopIndex.pixelPositionAfterBlocksForRow(screenRange.end.row) + this.lineHeight;
      if (options != null ? options.center : void 0) {
        desiredScrollCenter = (top + bottom) / 2;
        if (!((this.getScrollTop() < desiredScrollCenter && desiredScrollCenter < this.getScrollBottom()))) {
          desiredScrollTop = desiredScrollCenter - this.getClientHeight() / 2;
          desiredScrollBottom = desiredScrollCenter + this.getClientHeight() / 2;
        }
      } else {
        desiredScrollTop = top - verticalScrollMarginInPixels;
        desiredScrollBottom = bottom + verticalScrollMarginInPixels;
      }
      if ((ref3 = options != null ? options.reversed : void 0) != null ? ref3 : true) {
        if (desiredScrollBottom > this.getScrollBottom()) {
          this.updateScrollTop(desiredScrollBottom - this.getClientHeight());
        }
        if (desiredScrollTop < this.getScrollTop()) {
          return this.updateScrollTop(desiredScrollTop);
        }
      } else {
        if (desiredScrollTop < this.getScrollTop()) {
          this.updateScrollTop(desiredScrollTop);
        }
        if (desiredScrollBottom > this.getScrollBottom()) {
          return this.updateScrollTop(desiredScrollBottom - this.getClientHeight());
        }
      }
    };

    TextEditorPresenter.prototype.commitPendingLogicalScrollLeftPosition = function() {
      var desiredScrollLeft, desiredScrollRight, horizontalScrollMarginInPixels, left, options, ref2, ref3, right, screenRange;
      if (this.pendingScrollLogicalPosition == null) {
        return;
      }
      ref2 = this.pendingScrollLogicalPosition, screenRange = ref2.screenRange, options = ref2.options;
      horizontalScrollMarginInPixels = this.getHorizontalScrollMarginInPixels();
      left = this.pixelRectForScreenRange(new Range(screenRange.start, screenRange.start)).left;
      right = this.pixelRectForScreenRange(new Range(screenRange.end, screenRange.end)).left;
      left += this.scrollLeft;
      right += this.scrollLeft;
      desiredScrollLeft = left - horizontalScrollMarginInPixels;
      desiredScrollRight = right + horizontalScrollMarginInPixels;
      if ((ref3 = options != null ? options.reversed : void 0) != null ? ref3 : true) {
        if (desiredScrollRight > this.getScrollRight()) {
          this.updateScrollLeft(desiredScrollRight - this.getClientWidth());
        }
        if (desiredScrollLeft < this.getScrollLeft()) {
          return this.updateScrollLeft(desiredScrollLeft);
        }
      } else {
        if (desiredScrollLeft < this.getScrollLeft()) {
          this.updateScrollLeft(desiredScrollLeft);
        }
        if (desiredScrollRight > this.getScrollRight()) {
          return this.updateScrollLeft(desiredScrollRight - this.getClientWidth());
        }
      }
    };

    TextEditorPresenter.prototype.commitPendingScrollLeftPosition = function() {
      if (this.pendingScrollLeft != null) {
        this.updateScrollLeft(this.pendingScrollLeft);
        return this.pendingScrollLeft = null;
      }
    };

    TextEditorPresenter.prototype.commitPendingScrollTopPosition = function() {
      if (this.pendingScrollTop != null) {
        this.updateScrollTop(this.pendingScrollTop);
        return this.pendingScrollTop = null;
      }
    };

    TextEditorPresenter.prototype.clearPendingScrollPosition = function() {
      this.pendingScrollLogicalPosition = null;
      this.pendingScrollTop = null;
      return this.pendingScrollLeft = null;
    };

    TextEditorPresenter.prototype.canScrollLeftTo = function(scrollLeft) {
      return this.scrollLeft !== this.constrainScrollLeft(scrollLeft);
    };

    TextEditorPresenter.prototype.canScrollTopTo = function(scrollTop) {
      return this.scrollTop !== this.constrainScrollTop(scrollTop);
    };

    TextEditorPresenter.prototype.restoreScrollTopIfNeeded = function() {
      if (this.scrollTop == null) {
        return this.updateScrollTop(this.lineTopIndex.pixelPositionAfterBlocksForRow(this.model.getFirstVisibleScreenRow()));
      }
    };

    TextEditorPresenter.prototype.restoreScrollLeftIfNeeded = function() {
      if (this.scrollLeft == null) {
        return this.updateScrollLeft(this.model.getFirstVisibleScreenColumn() * this.baseCharacterWidth);
      }
    };

    TextEditorPresenter.prototype.onDidChangeScrollTop = function(callback) {
      return this.emitter.on('did-change-scroll-top', callback);
    };

    TextEditorPresenter.prototype.onDidChangeScrollLeft = function(callback) {
      return this.emitter.on('did-change-scroll-left', callback);
    };

    TextEditorPresenter.prototype.getVisibleRowRange = function() {
      return [this.startRow, this.endRow];
    };

    TextEditorPresenter.prototype.isRowRendered = function(row) {
      return (this.getStartTileRow() <= row && row < this.getEndTileRow() + this.tileSize);
    };

    TextEditorPresenter.prototype.isOpenTagCode = function(tagCode) {
      return this.displayLayer.isOpenTagCode(tagCode);
    };

    TextEditorPresenter.prototype.isCloseTagCode = function(tagCode) {
      return this.displayLayer.isCloseTagCode(tagCode);
    };

    TextEditorPresenter.prototype.tagForCode = function(tagCode) {
      return this.displayLayer.tagForCode(tagCode);
    };

    return TextEditorPresenter;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3RleHQtZWRpdG9yLXByZXNlbnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQWlDLE9BQUEsQ0FBUSxXQUFSLENBQWpDLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLE9BQWlCLE9BQUEsQ0FBUSxhQUFSLENBQWpCLEVBQUMsa0JBQUQsRUFBUTs7RUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLFVBQUEsR0FBYSxPQUFBLENBQVEsY0FBUjs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNNO2tDQUNKLHVCQUFBLEdBQXlCOztrQ0FDekIsOEJBQUEsR0FBZ0M7O2tDQUNoQyx5QkFBQSxHQUEyQjs7a0NBQzNCLG1CQUFBLEdBQXFCOztrQ0FDckIsaUJBQUEsR0FBbUI7O2tDQUNuQixxQkFBQSxHQUF1Qjs7SUFFViw2QkFBQyxNQUFEO01BQ1YsSUFBQyxDQUFBLGVBQUEsS0FBRixFQUFTLElBQUMsQ0FBQSxzQkFBQTtNQUNWLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxHQUFtQjtNQUNsQixJQUFDLENBQUEsMkJBQUEsaUJBQUYsRUFBcUIsSUFBQyxDQUFBLGdDQUFBLHNCQUF0QixFQUE4QyxJQUFDLENBQUEsK0JBQUEscUJBQS9DLEVBQXNFLElBQUMsQ0FBQSxrQkFBQSxRQUF2RSxFQUFpRixJQUFDLENBQUEsb0JBQUE7TUFDakYsSUFBQyxDQUFBLG9CQUFxQixPQUFyQjtNQUNELElBQUMsQ0FBQSxlQUFnQixJQUFDLENBQUEsTUFBakI7TUFFRixJQUFDLENBQUEsV0FBRCxHQUFlOztRQUNmLElBQUMsQ0FBQSxXQUFZOztNQUNiLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUMsQ0FBQTtNQUNsQixJQUFD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QXNCLEdBQXRCLEdBQTRCLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxHQUFtQixJQUFDLENBQUEsUUFBaEQ7SUFEYTs7a0NBR2YsYUFBQSxHQUFlLFNBQUMsT0FBRDthQUNiLElBQUMsQ0FBQSxZQUFZLENBQUMsYUFBZCxDQUE0QixPQUE1QjtJQURhOztrQ0FHZixjQUFBLEdBQWdCLFNBQUMsT0FBRDthQUNkLElBQUMsQ0FBQSxZQUFZLENBQUMsY0FBZCxDQUE2QixPQUE3QjtJQURjOztrQ0FHaEIsVUFBQSxHQUFZLFNBQUMsT0FBRDthQUNWLElBQUMsQ0FBQSxZQUFZLENBQUMsVUFBZCxDQUF5QixPQUF6QjtJQURVOzs7OztBQXRnRGQiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG57UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ3RleHQtYnVmZmVyJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbkRlY29yYXRpb24gPSByZXF1aXJlICcuL2RlY29yYXRpb24nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRleHRFZGl0b3JQcmVzZW50ZXJcbiAgdG9nZ2xlQ3Vyc29yQmxpbmtIYW5kbGU6IG51bGxcbiAgc3RhcnRCbGlua2luZ0N1cnNvcnNBZnRlckRlbGF5OiBudWxsXG4gIHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQ6IG51bGxcbiAgbW91c2VXaGVlbFNjcmVlblJvdzogbnVsbFxuICBvdmVybGF5RGltZW5zaW9uczogbnVsbFxuICBtaW5pbXVtUmVmbG93SW50ZXJ2YWw6IDIwMFxuXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHtAbW9kZWwsIEBsaW5lVG9wSW5kZXh9ID0gcGFyYW1zXG4gICAgQG1vZGVsLnByZXNlbnRlciA9IHRoaXNcbiAgICB7QGN1cnNvckJsaW5rUGVyaW9kLCBAY3Vyc29yQmxpbmtSZXN1bWVEZWxheSwgQHN0b3BwZWRTY3JvbGxpbmdEZWxheSwgQHRpbGVTaXplLCBAYXV0b0hlaWdodH0gPSBwYXJhbXNcbiAgICB7QGNvbnRlbnRGcmFtZVdpZHRofSA9IHBhcmFtc1xuICAgIHtAZGlzcGxheUxheWVyfSA9IEBtb2RlbFxuXG4gICAgQGd1dHRlcldpZHRoID0gMFxuICAgIEB0aWxlU2l6ZSA/PSA2XG4gICAgQHJlYWxTY3JvbGxUb3AgPSBAc2Nyb2xsVG9wXG4gICAgQHJlYWxTY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAbGluZXNCeVNjcmVlblJvdyA9IG5ldyBNYXBcbiAgICBAdmlzaWJsZUhpZ2hsaWdodHMgPSB7fVxuICAgIEBjaGFyYWN0ZXJXaWR0aHNCeVNjb3BlID0ge31cbiAgICBAbGluZURlY29yYXRpb25zQnlTY3JlZW5Sb3cgPSB7fVxuICAgIEBsaW5lTnVtYmVyRGVjb3JhdGlvbnNCeVNjcmVlblJvdyA9IHt9XG4gICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zQnlHdXR0ZXJOYW1lID0ge31cbiAgICBAb3ZlcmxheURpbWVuc2lvbnMgPSB7fVxuICAgIEBvYnNlcnZlZEJsb2NrRGVjb3JhdGlvbnMgPSBuZXcgU2V0KClcbiAgICBAaW52YWxpZGF0ZWREaW1lbnNpb25zQnlCbG9ja0RlY29yYXRpb24gPSBuZXcgU2V0KClcbiAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gZmFsc2VcbiAgICBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWQgPSB7fVxuICAgIEBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZCA9IHt9XG4gICAgQHNjcmVlblJvd3NUb01lYXN1cmUgPSBbXVxuICAgIEBmbGFzaENvdW50c0J5RGVjb3JhdGlvbklkID0ge31cbiAgICBAdHJhbnNmZXJNZWFzdXJlbWVudHNUb01vZGVsKClcbiAgICBAdHJhbnNmZXJNZWFzdXJlbWVudHNGcm9tTW9kZWwoKVxuICAgIEBvYnNlcnZlTW9kZWwoKVxuICAgIEBidWlsZFN0YXRlKClcbiAgICBAaW52YWxpZGF0ZVN0YXRlKClcbiAgICBAc3RhcnRCbGlua2luZ0N1cnNvcnMoKSBpZiBAZm9jdXNlZFxuICAgIEBzdGFydFJlZmxvd2luZygpIGlmIEBjb250aW51b3VzUmVmbG93XG4gICAgQHVwZGF0aW5nID0gZmFsc2VcblxuICBzZXRMaW5lc1lhcmRzdGljazogKEBsaW5lc1lhcmRzdGljaykgLT5cblxuICBnZXRMaW5lc1lhcmRzdGljazogLT4gQGxpbmVzWWFyZHN0aWNrXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgY2xlYXJUaW1lb3V0KEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkKSBpZiBAc3RvcHBlZFNjcm9sbGluZ1RpbWVvdXRJZD9cbiAgICBjbGVhckludGVydmFsKEByZWZsb3dpbmdJbnRlcnZhbCkgaWYgQHJlZmxvd2luZ0ludGVydmFsP1xuICAgIEBzdG9wQmxpbmtpbmdDdXJzb3JzKClcblxuICAjIENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHNvbWUgY2hhbmdlcyBpbiB0aGUgbW9kZWwgb2NjdXJyZWQgYW5kIHRoZSBjdXJyZW50IHN0YXRlIGhhcyBiZWVuIHVwZGF0ZWQuXG4gIG9uRGlkVXBkYXRlU3RhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXVwZGF0ZS1zdGF0ZScsIGNhbGxiYWNrXG5cbiAgZW1pdERpZFVwZGF0ZVN0YXRlOiAtPlxuICAgIEBlbWl0dGVyLmVtaXQgXCJkaWQtdXBkYXRlLXN0YXRlXCIgaWYgQGlzQmF0Y2hpbmcoKVxuXG4gIHRyYW5zZmVyTWVhc3VyZW1lbnRzVG9Nb2RlbDogLT5cbiAgICBAbW9kZWwuc2V0TGluZUhlaWdodEluUGl4ZWxzKEBsaW5lSGVpZ2h0KSBpZiBAbGluZUhlaWdodD9cbiAgICBAbW9kZWwuc2V0RGVmYXVsdENoYXJXaWR0aChAYmFzZUNoYXJhY3RlcldpZHRoKSBpZiBAYmFzZUNoYXJhY3RlcldpZHRoP1xuXG4gIHRyYW5zZmVyTWVhc3VyZW1lbnRzRnJvbU1vZGVsOiAtPlxuICAgIEBlZGl0b3JXaWR0aEluQ2hhcnMgPSBAbW9kZWwuZ2V0RWRpdG9yV2lkdGhJbkNoYXJzKClcblxuICAjIFByaXZhdGU6IERldGVybWluZXMgd2hldGhlciB7VGV4dEVkaXRvclByZXNlbnRlcn0gaXMgY3VycmVudGx5IGJhdGNoaW5nIGNoYW5nZXMuXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSwgYHRydWVgIGlmIGlzIGNvbGxlY3RpbmcgY2hhbmdlcywgYGZhbHNlYCBpZiBpcyBhcHBseWluZyB0aGVtLlxuICBpc0JhdGNoaW5nOiAtPlxuICAgIEB1cGRhdGluZyBpcyBmYWxzZVxuXG4gIGdldFByZU1lYXN1cmVtZW50U3RhdGU6IC0+XG4gICAgQHVwZGF0aW5nID0gdHJ1ZVxuXG4gICAgQHVwZGF0ZVZlcnRpY2FsRGltZW5zaW9ucygpXG4gICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuXG4gICAgQGNvbW1pdFBlbmRpbmdMb2dpY2FsU2Nyb2xsVG9wUG9zaXRpb24oKVxuICAgIEBjb21taXRQZW5kaW5nU2Nyb2xsVG9wUG9zaXRpb24oKVxuXG4gICAgQHVwZGF0ZVN0YXJ0Um93KClcbiAgICBAdXBkYXRlRW5kUm93KClcbiAgICBAdXBkYXRlQ29tbW9uR3V0dGVyU3RhdGUoKVxuICAgIEB1cGRhdGVSZWZsb3dTdGF0ZSgpXG5cbiAgICBAdXBkYXRlTGluZXMoKVxuXG4gICAgaWYgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zXG4gICAgICBAZmV0Y2hEZWNvcmF0aW9ucygpXG4gICAgICBAdXBkYXRlTGluZURlY29yYXRpb25zKClcbiAgICAgIEB1cGRhdGVCbG9ja0RlY29yYXRpb25zKClcblxuICAgIEB1cGRhdGVUaWxlc1N0YXRlKClcblxuICAgIEB1cGRhdGluZyA9IGZhbHNlXG4gICAgQHN0YXRlXG5cbiAgZ2V0UG9zdE1lYXN1cmVtZW50U3RhdGU6IC0+XG4gICAgQHVwZGF0aW5nID0gdHJ1ZVxuXG4gICAgQHVwZGF0ZUhvcml6b250YWxEaW1lbnNpb25zKClcbiAgICBAY29tbWl0UGVuZGluZ0xvZ2ljYWxTY3JvbGxMZWZ0UG9zaXRpb24oKVxuICAgIEBjb21taXRQZW5kaW5nU2Nyb2xsTGVmdFBvc2l0aW9uKClcbiAgICBAY2xlYXJQZW5kaW5nU2Nyb2xsUG9zaXRpb24oKVxuICAgIEB1cGRhdGVSb3dzUGVyUGFnZSgpXG5cbiAgICBAdXBkYXRlTGluZXMoKVxuXG4gICAgQHVwZGF0ZVZlcnRpY2FsU2Nyb2xsU3RhdGUoKVxuICAgIEB1cGRhdGVIb3Jpem9udGFsU2Nyb2xsU3RhdGUoKVxuICAgIEB1cGRhdGVTY3JvbGxiYXJzU3RhdGUoKVxuICAgIEB1cGRhdGVIaWRkZW5JbnB1dFN0YXRlKClcbiAgICBAdXBkYXRlQ29udGVudFN0YXRlKClcbiAgICBAdXBkYXRlRm9jdXNlZFN0YXRlKClcbiAgICBAdXBkYXRlSGVpZ2h0U3RhdGUoKVxuICAgIEB1cGRhdGVXaWR0aFN0YXRlKClcbiAgICBAdXBkYXRlSGlnaGxpZ2h0RGVjb3JhdGlvbnMoKSBpZiBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnNcbiAgICBAdXBkYXRlVGlsZXNTdGF0ZSgpXG4gICAgQHVwZGF0ZUN1cnNvcnNTdGF0ZSgpXG4gICAgQHVwZGF0ZU92ZXJsYXlzU3RhdGUoKVxuICAgIEB1cGRhdGVMaW5lTnVtYmVyR3V0dGVyU3RhdGUoKVxuICAgIEB1cGRhdGVHdXR0ZXJPcmRlclN0YXRlKClcbiAgICBAdXBkYXRlQ3VzdG9tR3V0dGVyRGVjb3JhdGlvblN0YXRlKClcbiAgICBAdXBkYXRpbmcgPSBmYWxzZVxuXG4gICAgQHJlc2V0VHJhY2tlZFVwZGF0ZXMoKVxuICAgIEBzdGF0ZVxuXG4gIHJlc2V0VHJhY2tlZFVwZGF0ZXM6IC0+XG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gZmFsc2VcblxuICBpbnZhbGlkYXRlU3RhdGU6IC0+XG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuXG4gIG9ic2VydmVNb2RlbDogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5kaXNwbGF5TGF5ZXIub25EaWRSZXNldCA9PlxuICAgICAgQHNwbGljZUJsb2NrRGVjb3JhdGlvbnNJblJhbmdlKDAsIEluZmluaXR5LCBJbmZpbml0eSlcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwuZGlzcGxheUxheWVyLm9uRGlkQ2hhbmdlU3luYyAoY2hhbmdlcykgPT5cbiAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlc1xuICAgICAgICBzdGFydFJvdyA9IGNoYW5nZS5zdGFydC5yb3dcbiAgICAgICAgZW5kUm93ID0gc3RhcnRSb3cgKyBjaGFuZ2Uub2xkRXh0ZW50LnJvd1xuICAgICAgICBAc3BsaWNlQmxvY2tEZWNvcmF0aW9uc0luUmFuZ2Uoc3RhcnRSb3csIGVuZFJvdywgY2hhbmdlLm5ld0V4dGVudC5yb3cgLSBjaGFuZ2Uub2xkRXh0ZW50LnJvdylcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRVcGRhdGVEZWNvcmF0aW9ucyA9PlxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZEFkZERlY29yYXRpb24oQGRpZEFkZEJsb2NrRGVjb3JhdGlvbi5iaW5kKHRoaXMpKVxuXG4gICAgZm9yIGRlY29yYXRpb24gaW4gQG1vZGVsLmdldERlY29yYXRpb25zKHt0eXBlOiAnYmxvY2snfSlcbiAgICAgIHRoaXMuZGlkQWRkQmxvY2tEZWNvcmF0aW9uKGRlY29yYXRpb24pXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZENoYW5nZUdyYW1tYXIoQGRpZENoYW5nZUdyYW1tYXIuYmluZCh0aGlzKSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZENoYW5nZVBsYWNlaG9sZGVyVGV4dChAZW1pdERpZFVwZGF0ZVN0YXRlLmJpbmQodGhpcykpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRDaGFuZ2VNaW5pID0+XG4gICAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQG1vZGVsLm9uRGlkQ2hhbmdlTGluZU51bWJlckd1dHRlclZpc2libGUoQGVtaXREaWRVcGRhdGVTdGF0ZS5iaW5kKHRoaXMpKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRBZGRDdXJzb3IoQGRpZEFkZEN1cnNvci5iaW5kKHRoaXMpKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQG1vZGVsLm9uRGlkUmVxdWVzdEF1dG9zY3JvbGwoQHJlcXVlc3RBdXRvc2Nyb2xsLmJpbmQodGhpcykpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRDaGFuZ2VGaXJzdFZpc2libGVTY3JlZW5Sb3coQGRpZENoYW5nZUZpcnN0VmlzaWJsZVNjcmVlblJvdy5iaW5kKHRoaXMpKVxuICAgIEBvYnNlcnZlQ3Vyc29yKGN1cnNvcikgZm9yIGN1cnNvciBpbiBAbW9kZWwuZ2V0Q3Vyc29ycygpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRBZGRHdXR0ZXIoQGRpZEFkZEd1dHRlci5iaW5kKHRoaXMpKVxuICAgIHJldHVyblxuXG4gIGRpZENoYW5nZVNjcm9sbFBhc3RFbmQ6IC0+XG4gICAgQHVwZGF0ZVNjcm9sbEhlaWdodCgpXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZGlkQ2hhbmdlU2hvd0xpbmVOdW1iZXJzOiAtPlxuICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIGRpZENoYW5nZUdyYW1tYXI6IC0+XG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgYnVpbGRTdGF0ZTogLT5cbiAgICBAc3RhdGUgPVxuICAgICAgaG9yaXpvbnRhbFNjcm9sbGJhcjoge31cbiAgICAgIHZlcnRpY2FsU2Nyb2xsYmFyOiB7fVxuICAgICAgaGlkZGVuSW5wdXQ6IHt9XG4gICAgICBjb250ZW50OlxuICAgICAgICBzY3JvbGxpbmdWZXJ0aWNhbGx5OiBmYWxzZVxuICAgICAgICBjdXJzb3JzVmlzaWJsZTogZmFsc2VcbiAgICAgICAgdGlsZXM6IHt9XG4gICAgICAgIGhpZ2hsaWdodHM6IHt9XG4gICAgICAgIG92ZXJsYXlzOiB7fVxuICAgICAgICBjdXJzb3JzOiB7fVxuICAgICAgICBvZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zOiB7fVxuICAgICAgZ3V0dGVyczogW11cbiAgICAjIFNoYXJlZCBzdGF0ZSB0aGF0IGlzIGNvcGllZCBpbnRvIGBgQHN0YXRlLmd1dHRlcnNgLlxuICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMgPSB7fVxuICAgIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9ucyA9IHt9XG4gICAgQGxpbmVOdW1iZXJHdXR0ZXIgPVxuICAgICAgdGlsZXM6IHt9XG5cbiAgc2V0Q29udGludW91c1JlZmxvdzogKEBjb250aW51b3VzUmVmbG93KSAtPlxuICAgIGlmIEBjb250aW51b3VzUmVmbG93XG4gICAgICBAc3RhcnRSZWZsb3dpbmcoKVxuICAgIGVsc2VcbiAgICAgIEBzdG9wUmVmbG93aW5nKClcblxuICB1cGRhdGVSZWZsb3dTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5jb250aW51b3VzUmVmbG93ID0gQGNvbnRpbnVvdXNSZWZsb3dcbiAgICBAbGluZU51bWJlckd1dHRlci5jb250aW51b3VzUmVmbG93ID0gQGNvbnRpbnVvdXNSZWZsb3dcblxuICBzdGFydFJlZmxvd2luZzogLT5cbiAgICBAcmVmbG93aW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChAZW1pdERpZFVwZGF0ZVN0YXRlLmJpbmQodGhpcyksIEBtaW5pbXVtUmVmbG93SW50ZXJ2YWwpXG5cbiAgc3RvcFJlZmxvd2luZzogLT5cbiAgICBjbGVhckludGVydmFsKEByZWZsb3dpbmdJbnRlcnZhbClcbiAgICBAcmVmbG93aW5nSW50ZXJ2YWwgPSBudWxsXG5cbiAgdXBkYXRlRm9jdXNlZFN0YXRlOiAtPlxuICAgIEBzdGF0ZS5mb2N1c2VkID0gQGZvY3VzZWRcblxuICB1cGRhdGVIZWlnaHRTdGF0ZTogLT5cbiAgICBpZiBAYXV0b0hlaWdodFxuICAgICAgQHN0YXRlLmhlaWdodCA9IEBjb250ZW50SGVpZ2h0XG4gICAgZWxzZVxuICAgICAgQHN0YXRlLmhlaWdodCA9IG51bGxcblxuICB1cGRhdGVXaWR0aFN0YXRlOiAtPlxuICAgIGlmIEBtb2RlbC5nZXRBdXRvV2lkdGgoKVxuICAgICAgQHN0YXRlLndpZHRoID0gQHN0YXRlLmNvbnRlbnQud2lkdGggKyBAZ3V0dGVyV2lkdGhcbiAgICBlbHNlXG4gICAgICBAc3RhdGUud2lkdGggPSBudWxsXG5cbiAgdXBkYXRlVmVydGljYWxTY3JvbGxTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxIZWlnaHQgPSBAc2Nyb2xsSGVpZ2h0XG4gICAgQHNoYXJlZEd1dHRlclN0eWxlcy5zY3JvbGxIZWlnaHQgPSBAc2Nyb2xsSGVpZ2h0XG4gICAgQHN0YXRlLnZlcnRpY2FsU2Nyb2xsYmFyLnNjcm9sbEhlaWdodCA9IEBzY3JvbGxIZWlnaHRcblxuICAgIEBzdGF0ZS5jb250ZW50LnNjcm9sbFRvcCA9IEBzY3JvbGxUb3BcbiAgICBAc2hhcmVkR3V0dGVyU3R5bGVzLnNjcm9sbFRvcCA9IEBzY3JvbGxUb3BcbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIuc2Nyb2xsVG9wID0gQHNjcm9sbFRvcFxuXG4gIHVwZGF0ZUhvcml6b250YWxTY3JvbGxTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxXaWR0aCA9IEBzY3JvbGxXaWR0aFxuICAgIEBzdGF0ZS5ob3Jpem9udGFsU2Nyb2xsYmFyLnNjcm9sbFdpZHRoID0gQHNjcm9sbFdpZHRoXG5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAc3RhdGUuaG9yaXpvbnRhbFNjcm9sbGJhci5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcblxuICB1cGRhdGVTY3JvbGxiYXJzU3RhdGU6IC0+XG4gICAgQHN0YXRlLmhvcml6b250YWxTY3JvbGxiYXIudmlzaWJsZSA9IEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0ID4gMFxuICAgIEBzdGF0ZS5ob3Jpem9udGFsU2Nyb2xsYmFyLmhlaWdodCA9IEBtZWFzdXJlZEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICBAc3RhdGUuaG9yaXpvbnRhbFNjcm9sbGJhci5yaWdodCA9IEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG5cbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIudmlzaWJsZSA9IEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID4gMFxuICAgIEBzdGF0ZS52ZXJ0aWNhbFNjcm9sbGJhci53aWR0aCA9IEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIuYm90dG9tID0gQGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcblxuICB1cGRhdGVIaWRkZW5JbnB1dFN0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgbGFzdEN1cnNvciA9IEBtb2RlbC5nZXRMYXN0Q3Vyc29yKClcblxuICAgIHt0b3AsIGxlZnQsIGhlaWdodCwgd2lkdGh9ID0gQHBpeGVsUmVjdEZvclNjcmVlblJhbmdlKGxhc3RDdXJzb3IuZ2V0U2NyZWVuUmFuZ2UoKSlcblxuICAgIGlmIEBmb2N1c2VkXG4gICAgICBAc3RhdGUuaGlkZGVuSW5wdXQudG9wID0gTWF0aC5tYXgoTWF0aC5taW4odG9wLCBAY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSwgMClcbiAgICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC5sZWZ0ID0gTWF0aC5tYXgoTWF0aC5taW4obGVmdCwgQGNsaWVudFdpZHRoIC0gd2lkdGgpLCAwKVxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC50b3AgPSAwXG4gICAgICBAc3RhdGUuaGlkZGVuSW5wdXQubGVmdCA9IDBcblxuICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC5oZWlnaHQgPSBoZWlnaHRcbiAgICBAc3RhdGUuaGlkZGVuSW5wdXQud2lkdGggPSBNYXRoLm1heCh3aWR0aCwgMilcblxuICB1cGRhdGVDb250ZW50U3RhdGU6IC0+XG4gICAgaWYgQGJvdW5kaW5nQ2xpZW50UmVjdD9cbiAgICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMubWF4SGVpZ2h0ID0gQGJvdW5kaW5nQ2xpZW50UmVjdC5oZWlnaHRcbiAgICAgIEBzdGF0ZS5jb250ZW50Lm1heEhlaWdodCA9IEBib3VuZGluZ0NsaWVudFJlY3QuaGVpZ2h0XG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGggPyAwXG4gICAgY29udGVudEZyYW1lV2lkdGggPSBAY29udGVudEZyYW1lV2lkdGggPyAwXG4gICAgY29udGVudFdpZHRoID0gQGNvbnRlbnRXaWR0aCA/IDBcbiAgICBpZiBAbW9kZWwuZ2V0QXV0b1dpZHRoKClcbiAgICAgIEBzdGF0ZS5jb250ZW50LndpZHRoID0gY29udGVudFdpZHRoICsgdmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZS5jb250ZW50LndpZHRoID0gTWF0aC5tYXgoY29udGVudFdpZHRoICsgdmVydGljYWxTY3JvbGxiYXJXaWR0aCwgY29udGVudEZyYW1lV2lkdGgpXG4gICAgQHN0YXRlLmNvbnRlbnQuc2Nyb2xsV2lkdGggPSBAc2Nyb2xsV2lkdGhcbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAc3RhdGUuY29udGVudC5iYWNrZ3JvdW5kQ29sb3IgPSBpZiBAbW9kZWwuaXNNaW5pKCkgdGhlbiBudWxsIGVsc2UgQGJhY2tncm91bmRDb2xvclxuICAgIEBzdGF0ZS5jb250ZW50LnBsYWNlaG9sZGVyVGV4dCA9IGlmIEBtb2RlbC5pc0VtcHR5KCkgdGhlbiBAbW9kZWwuZ2V0UGxhY2Vob2xkZXJUZXh0KCkgZWxzZSBudWxsXG5cbiAgdGlsZUZvclJvdzogKHJvdykgLT5cbiAgICByb3cgLSAocm93ICUgQHRpbGVTaXplKVxuXG4gIGdldFN0YXJ0VGlsZVJvdzogLT5cbiAgICBAdGlsZUZvclJvdyhAc3RhcnRSb3cgPyAwKVxuXG4gIGdldEVuZFRpbGVSb3c6IC0+XG4gICAgQHRpbGVGb3JSb3coQGVuZFJvdyA/IDApXG5cbiAgZ2V0U2NyZWVuUm93c1RvUmVuZGVyOiAtPlxuICAgIHN0YXJ0Um93ID0gQGdldFN0YXJ0VGlsZVJvdygpXG4gICAgZW5kUm93ID0gQGdldEVuZFRpbGVSb3coKSArIEB0aWxlU2l6ZVxuXG4gICAgc2NyZWVuUm93cyA9IFtzdGFydFJvdy4uLmVuZFJvd11cbiAgICBsb25nZXN0U2NyZWVuUm93ID0gQG1vZGVsLmdldEFwcHJveGltYXRlTG9uZ2VzdFNjcmVlblJvdygpXG4gICAgaWYgbG9uZ2VzdFNjcmVlblJvdz9cbiAgICAgIHNjcmVlblJvd3MucHVzaChsb25nZXN0U2NyZWVuUm93KVxuICAgIGlmIEBzY3JlZW5Sb3dzVG9NZWFzdXJlP1xuICAgICAgc2NyZWVuUm93cy5wdXNoKEBzY3JlZW5Sb3dzVG9NZWFzdXJlLi4uKVxuXG4gICAgc2NyZWVuUm93cyA9IHNjcmVlblJvd3MuZmlsdGVyIChyb3cpIC0+IHJvdyA+PSAwXG4gICAgc2NyZWVuUm93cy5zb3J0IChhLCBiKSAtPiBhIC0gYlxuICAgIF8udW5pcShzY3JlZW5Sb3dzLCB0cnVlKVxuXG4gIGdldFNjcmVlblJhbmdlc1RvUmVuZGVyOiAtPlxuICAgIHNjcmVlblJvd3MgPSBAZ2V0U2NyZWVuUm93c1RvUmVuZGVyKClcbiAgICBzY3JlZW5Sb3dzLnB1c2goSW5maW5pdHkpICMgbWFrZXMgdGhlIGxvb3AgYmVsb3cgaW5jbHVzaXZlXG5cbiAgICBzdGFydFJvdyA9IHNjcmVlblJvd3NbMF1cbiAgICBlbmRSb3cgPSBzdGFydFJvdyAtIDFcbiAgICBzY3JlZW5SYW5nZXMgPSBbXVxuICAgIGZvciByb3cgaW4gc2NyZWVuUm93c1xuICAgICAgaWYgcm93IGlzIGVuZFJvdyArIDFcbiAgICAgICAgZW5kUm93KytcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyZWVuUmFuZ2VzLnB1c2goW3N0YXJ0Um93LCBlbmRSb3ddKVxuICAgICAgICBzdGFydFJvdyA9IGVuZFJvdyA9IHJvd1xuXG4gICAgc2NyZWVuUmFuZ2VzXG5cbiAgc2V0U2NyZWVuUm93c1RvTWVhc3VyZTogKHNjcmVlblJvd3MpIC0+XG4gICAgcmV0dXJuIGlmIG5vdCBzY3JlZW5Sb3dzPyBvciBzY3JlZW5Sb3dzLmxlbmd0aCBpcyAwXG5cbiAgICBAc2NyZWVuUm93c1RvTWVhc3VyZSA9IHNjcmVlblJvd3NcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG5cbiAgY2xlYXJTY3JlZW5Sb3dzVG9NZWFzdXJlOiAtPlxuICAgIEBzY3JlZW5Sb3dzVG9NZWFzdXJlID0gW11cblxuICB1cGRhdGVUaWxlc1N0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0YXJ0Um93PyBhbmQgQGVuZFJvdz8gYW5kIEBsaW5lSGVpZ2h0P1xuXG4gICAgc2NyZWVuUm93cyA9IEBnZXRTY3JlZW5Sb3dzVG9SZW5kZXIoKVxuICAgIHZpc2libGVUaWxlcyA9IHt9XG4gICAgc3RhcnRSb3cgPSBzY3JlZW5Sb3dzWzBdXG4gICAgZW5kUm93ID0gc2NyZWVuUm93c1tzY3JlZW5Sb3dzLmxlbmd0aCAtIDFdXG4gICAgc2NyZWVuUm93SW5kZXggPSBzY3JlZW5Sb3dzLmxlbmd0aCAtIDFcbiAgICB6SW5kZXggPSAwXG5cbiAgICBmb3IgdGlsZVN0YXJ0Um93IGluIFtAdGlsZUZvclJvdyhlbmRSb3cpLi5AdGlsZUZvclJvdyhzdGFydFJvdyldIGJ5IC1AdGlsZVNpemVcbiAgICAgIHRpbGVFbmRSb3cgPSB0aWxlU3RhcnRSb3cgKyBAdGlsZVNpemVcbiAgICAgIHJvd3NXaXRoaW5UaWxlID0gW11cblxuICAgICAgd2hpbGUgc2NyZWVuUm93SW5kZXggPj0gMFxuICAgICAgICBjdXJyZW50U2NyZWVuUm93ID0gc2NyZWVuUm93c1tzY3JlZW5Sb3dJbmRleF1cbiAgICAgICAgYnJlYWsgaWYgY3VycmVudFNjcmVlblJvdyA8IHRpbGVTdGFydFJvd1xuICAgICAgICByb3dzV2l0aGluVGlsZS5wdXNoKGN1cnJlbnRTY3JlZW5Sb3cpXG4gICAgICAgIHNjcmVlblJvd0luZGV4LS1cblxuICAgICAgY29udGludWUgaWYgcm93c1dpdGhpblRpbGUubGVuZ3RoIGlzIDBcblxuICAgICAgdG9wID0gTWF0aC5yb3VuZChAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25CZWZvcmVCbG9ja3NGb3JSb3codGlsZVN0YXJ0Um93KSlcbiAgICAgIGJvdHRvbSA9IE1hdGgucm91bmQoQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQmVmb3JlQmxvY2tzRm9yUm93KHRpbGVFbmRSb3cpKVxuICAgICAgaGVpZ2h0ID0gYm90dG9tIC0gdG9wXG5cbiAgICAgIHRpbGUgPSBAc3RhdGUuY29udGVudC50aWxlc1t0aWxlU3RhcnRSb3ddID89IHt9XG4gICAgICB0aWxlLnRvcCA9IHRvcCAtIEBzY3JvbGxUb3BcbiAgICAgIHRpbGUubGVmdCA9IC1Ac2Nyb2xsTGVmdFxuICAgICAgdGlsZS5oZWlnaHQgPSBoZWlnaHRcbiAgICAgIHRpbGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICAgdGlsZS56SW5kZXggPSB6SW5kZXhcbiAgICAgIHRpbGUuaGlnaGxpZ2h0cyA/PSB7fVxuXG4gICAgICBndXR0ZXJUaWxlID0gQGxpbmVOdW1iZXJHdXR0ZXIudGlsZXNbdGlsZVN0YXJ0Um93XSA/PSB7fVxuICAgICAgZ3V0dGVyVGlsZS50b3AgPSB0b3AgLSBAc2Nyb2xsVG9wXG4gICAgICBndXR0ZXJUaWxlLmhlaWdodCA9IGhlaWdodFxuICAgICAgZ3V0dGVyVGlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgICBndXR0ZXJUaWxlLnpJbmRleCA9IHpJbmRleFxuXG4gICAgICBAdXBkYXRlTGluZXNTdGF0ZSh0aWxlLCByb3dzV2l0aGluVGlsZSlcbiAgICAgIEB1cGRhdGVMaW5lTnVtYmVyc1N0YXRlKGd1dHRlclRpbGUsIHJvd3NXaXRoaW5UaWxlKVxuXG4gICAgICB2aXNpYmxlVGlsZXNbdGlsZVN0YXJ0Um93XSA9IHRydWVcbiAgICAgIHpJbmRleCsrXG5cbiAgICBtb3VzZVdoZWVsVGlsZUlkID0gQHRpbGVGb3JSb3coQG1vdXNlV2hlZWxTY3JlZW5Sb3cpIGlmIEBtb3VzZVdoZWVsU2NyZWVuUm93P1xuXG4gICAgZm9yIGlkLCB0aWxlIG9mIEBzdGF0ZS5jb250ZW50LnRpbGVzXG4gICAgICBjb250aW51ZSBpZiB2aXNpYmxlVGlsZXMuaGFzT3duUHJvcGVydHkoaWQpXG5cbiAgICAgIGlmIE51bWJlcihpZCkgaXMgbW91c2VXaGVlbFRpbGVJZFxuICAgICAgICBAc3RhdGUuY29udGVudC50aWxlc1tpZF0uZGlzcGxheSA9IFwibm9uZVwiXG4gICAgICAgIEBsaW5lTnVtYmVyR3V0dGVyLnRpbGVzW2lkXS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGVsZXRlIEBzdGF0ZS5jb250ZW50LnRpbGVzW2lkXVxuICAgICAgICBkZWxldGUgQGxpbmVOdW1iZXJHdXR0ZXIudGlsZXNbaWRdXG5cbiAgdXBkYXRlTGluZXNTdGF0ZTogKHRpbGVTdGF0ZSwgc2NyZWVuUm93cykgLT5cbiAgICB0aWxlU3RhdGUubGluZXMgPz0ge31cbiAgICB2aXNpYmxlTGluZUlkcyA9IHt9XG4gICAgZm9yIHNjcmVlblJvdyBpbiBzY3JlZW5Sb3dzXG4gICAgICBsaW5lID0gQGxpbmVzQnlTY3JlZW5Sb3cuZ2V0KHNjcmVlblJvdylcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBsaW5lP1xuXG4gICAgICB2aXNpYmxlTGluZUlkc1tsaW5lLmlkXSA9IHRydWVcbiAgICAgIHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnMgPSBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XSA/IHt9XG4gICAgICBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zID0gQGZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10gPyB7fVxuICAgICAgaWYgdGlsZVN0YXRlLmxpbmVzLmhhc093blByb3BlcnR5KGxpbmUuaWQpXG4gICAgICAgIGxpbmVTdGF0ZSA9IHRpbGVTdGF0ZS5saW5lc1tsaW5lLmlkXVxuICAgICAgICBsaW5lU3RhdGUuc2NyZWVuUm93ID0gc2NyZWVuUm93XG4gICAgICAgIGxpbmVTdGF0ZS5kZWNvcmF0aW9uQ2xhc3NlcyA9IEBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgICBsaW5lU3RhdGUucHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9ucyA9IHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgbGluZVN0YXRlLmZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnMgPSBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIHRpbGVTdGF0ZS5saW5lc1tsaW5lLmlkXSA9XG4gICAgICAgICAgc2NyZWVuUm93OiBzY3JlZW5Sb3dcbiAgICAgICAgICBsaW5lVGV4dDogbGluZS5saW5lVGV4dFxuICAgICAgICAgIHRhZ0NvZGVzOiBsaW5lLnRhZ0NvZGVzXG4gICAgICAgICAgZGVjb3JhdGlvbkNsYXNzZXM6IEBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgICAgIHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnM6IHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgICBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zOiBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zXG5cbiAgICBmb3IgaWQsIGxpbmUgb2YgdGlsZVN0YXRlLmxpbmVzXG4gICAgICBkZWxldGUgdGlsZVN0YXRlLmxpbmVzW2lkXSB1bmxlc3MgdmlzaWJsZUxpbmVJZHMuaGFzT3duUHJvcGVydHkoaWQpXG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlQ3Vyc29yc1N0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0YXJ0Um93PyBhbmQgQGVuZFJvdz8gYW5kIEBoYXNQaXhlbFJlY3RSZXF1aXJlbWVudHMoKSBhbmQgQGJhc2VDaGFyYWN0ZXJXaWR0aD9cblxuICAgIEBzdGF0ZS5jb250ZW50LmN1cnNvcnMgPSB7fVxuICAgIGZvciBjdXJzb3IgaW4gQG1vZGVsLmN1cnNvcnNGb3JTY3JlZW5Sb3dSYW5nZShAc3RhcnRSb3csIEBlbmRSb3cgLSAxKSB3aGVuIGN1cnNvci5pc1Zpc2libGUoKVxuICAgICAgcGl4ZWxSZWN0ID0gQHBpeGVsUmVjdEZvclNjcmVlblJhbmdlKGN1cnNvci5nZXRTY3JlZW5SYW5nZSgpKVxuICAgICAgcGl4ZWxSZWN0LndpZHRoID0gTWF0aC5yb3VuZChAYmFzZUNoYXJhY3RlcldpZHRoKSBpZiBwaXhlbFJlY3Qud2lkdGggaXMgMFxuICAgICAgQHN0YXRlLmNvbnRlbnQuY3Vyc29yc1tjdXJzb3IuaWRdID0gcGl4ZWxSZWN0XG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlT3ZlcmxheXNTdGF0ZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBoYXNPdmVybGF5UG9zaXRpb25SZXF1aXJlbWVudHMoKVxuXG4gICAgdmlzaWJsZURlY29yYXRpb25JZHMgPSB7fVxuXG4gICAgZm9yIGRlY29yYXRpb24gaW4gQG1vZGVsLmdldE92ZXJsYXlEZWNvcmF0aW9ucygpXG4gICAgICBjb250aW51ZSB1bmxlc3MgZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5pc1ZhbGlkKClcblxuICAgICAge2l0ZW0sIHBvc2l0aW9uLCBjbGFzczoga2xhc3N9ID0gZGVjb3JhdGlvbi5nZXRQcm9wZXJ0aWVzKClcbiAgICAgIGlmIHBvc2l0aW9uIGlzICd0YWlsJ1xuICAgICAgICBzY3JlZW5Qb3NpdGlvbiA9IGRlY29yYXRpb24uZ2V0TWFya2VyKCkuZ2V0VGFpbFNjcmVlblBvc2l0aW9uKClcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyZWVuUG9zaXRpb24gPSBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgICAgIHBpeGVsUG9zaXRpb24gPSBAcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKVxuXG4gICAgICAjIEZpeGVkIHBvc2l0aW9uaW5nLlxuICAgICAgdG9wID0gQGJvdW5kaW5nQ2xpZW50UmVjdC50b3AgKyBwaXhlbFBvc2l0aW9uLnRvcCArIEBsaW5lSGVpZ2h0XG4gICAgICBsZWZ0ID0gQGJvdW5kaW5nQ2xpZW50UmVjdC5sZWZ0ICsgcGl4ZWxQb3NpdGlvbi5sZWZ0ICsgQGd1dHRlcldpZHRoXG5cbiAgICAgIGlmIG92ZXJsYXlEaW1lbnNpb25zID0gQG92ZXJsYXlEaW1lbnNpb25zW2RlY29yYXRpb24uaWRdXG4gICAgICAgIHtpdGVtV2lkdGgsIGl0ZW1IZWlnaHQsIGNvbnRlbnRNYXJnaW59ID0gb3ZlcmxheURpbWVuc2lvbnNcblxuICAgICAgICByaWdodERpZmYgPSBsZWZ0ICsgaXRlbVdpZHRoICsgY29udGVudE1hcmdpbiAtIEB3aW5kb3dXaWR0aFxuICAgICAgICBsZWZ0IC09IHJpZ2h0RGlmZiBpZiByaWdodERpZmYgPiAwXG5cbiAgICAgICAgbGVmdERpZmYgPSBsZWZ0ICsgY29udGVudE1hcmdpblxuICAgICAgICBsZWZ0IC09IGxlZnREaWZmIGlmIGxlZnREaWZmIDwgMFxuXG4gICAgICAgIGlmIHRvcCArIGl0ZW1IZWlnaHQgPiBAd2luZG93SGVpZ2h0IGFuZFxuICAgICAgICAgICB0b3AgLSAoaXRlbUhlaWdodCArIEBsaW5lSGVpZ2h0KSA+PSAwXG4gICAgICAgICAgdG9wIC09IGl0ZW1IZWlnaHQgKyBAbGluZUhlaWdodFxuXG4gICAgICBwaXhlbFBvc2l0aW9uLnRvcCA9IHRvcFxuICAgICAgcGl4ZWxQb3NpdGlvbi5sZWZ0ID0gbGVmdFxuXG4gICAgICBvdmVybGF5U3RhdGUgPSBAc3RhdGUuY29udGVudC5vdmVybGF5c1tkZWNvcmF0aW9uLmlkXSA/PSB7aXRlbX1cbiAgICAgIG92ZXJsYXlTdGF0ZS5waXhlbFBvc2l0aW9uID0gcGl4ZWxQb3NpdGlvblxuICAgICAgb3ZlcmxheVN0YXRlLmNsYXNzID0ga2xhc3MgaWYga2xhc3M/XG4gICAgICB2aXNpYmxlRGVjb3JhdGlvbklkc1tkZWNvcmF0aW9uLmlkXSA9IHRydWVcblxuICAgIGZvciBpZCBvZiBAc3RhdGUuY29udGVudC5vdmVybGF5c1xuICAgICAgZGVsZXRlIEBzdGF0ZS5jb250ZW50Lm92ZXJsYXlzW2lkXSB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25JZHNbaWRdXG5cbiAgICBmb3IgaWQgb2YgQG92ZXJsYXlEaW1lbnNpb25zXG4gICAgICBkZWxldGUgQG92ZXJsYXlEaW1lbnNpb25zW2lkXSB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25JZHNbaWRdXG5cbiAgICByZXR1cm5cblxuICB1cGRhdGVMaW5lTnVtYmVyR3V0dGVyU3RhdGU6IC0+XG4gICAgQGxpbmVOdW1iZXJHdXR0ZXIubWF4TGluZU51bWJlckRpZ2l0cyA9IEBtb2RlbC5nZXRMaW5lQ291bnQoKS50b1N0cmluZygpLmxlbmd0aFxuXG4gIHVwZGF0ZUNvbW1vbkd1dHRlclN0YXRlOiAtPlxuICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMuYmFja2dyb3VuZENvbG9yID0gaWYgQGd1dHRlckJhY2tncm91bmRDb2xvciBpc250IFwicmdiYSgwLCAwLCAwLCAwKVwiXG4gICAgICBAZ3V0dGVyQmFja2dyb3VuZENvbG9yXG4gICAgZWxzZVxuICAgICAgQGJhY2tncm91bmRDb2xvclxuXG4gIGRpZEFkZEd1dHRlcjogKGd1dHRlcikgLT5cbiAgICBndXR0ZXJEaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgZ3V0dGVyRGlzcG9zYWJsZXMuYWRkIGd1dHRlci5vbkRpZENoYW5nZVZpc2libGUgPT4gQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG4gICAgZ3V0dGVyRGlzcG9zYWJsZXMuYWRkIGd1dHRlci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBkaXNwb3NhYmxlcy5yZW1vdmUoZ3V0dGVyRGlzcG9zYWJsZXMpXG4gICAgICBndXR0ZXJEaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuICAgICAgIyBJdCBpcyBub3QgbmVjZXNzYXJ5IHRvIEB1cGRhdGVDdXN0b21HdXR0ZXJEZWNvcmF0aW9uU3RhdGUgaGVyZS5cbiAgICAgICMgVGhlIGRlc3Ryb3llZCBndXR0ZXIgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGxpc3Qgb2YgZ3V0dGVycyBpbiBAc3RhdGUsXG4gICAgICAjIGFuZCB0aHVzIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gICAgQGRpc3Bvc2FibGVzLmFkZChndXR0ZXJEaXNwb3NhYmxlcylcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICB1cGRhdGVHdXR0ZXJPcmRlclN0YXRlOiAtPlxuICAgIEBzdGF0ZS5ndXR0ZXJzID0gW11cbiAgICBpZiBAbW9kZWwuaXNNaW5pKClcbiAgICAgIHJldHVyblxuICAgIGZvciBndXR0ZXIgaW4gQG1vZGVsLmdldEd1dHRlcnMoKVxuICAgICAgaXNWaXNpYmxlID0gQGd1dHRlcklzVmlzaWJsZShndXR0ZXIpXG4gICAgICBpZiBndXR0ZXIubmFtZSBpcyAnbGluZS1udW1iZXInXG4gICAgICAgIGNvbnRlbnQgPSBAbGluZU51bWJlckd1dHRlclxuICAgICAgZWxzZVxuICAgICAgICBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyLm5hbWVdID89IHt9XG4gICAgICAgIGNvbnRlbnQgPSBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyLm5hbWVdXG4gICAgICBAc3RhdGUuZ3V0dGVycy5wdXNoKHtcbiAgICAgICAgZ3V0dGVyLFxuICAgICAgICB2aXNpYmxlOiBpc1Zpc2libGUsXG4gICAgICAgIHN0eWxlczogQHNoYXJlZEd1dHRlclN0eWxlcyxcbiAgICAgICAgY29udGVudCxcbiAgICAgIH0pXG5cbiAgIyBVcGRhdGVzIHRoZSBkZWNvcmF0aW9uIHN0YXRlIGZvciB0aGUgZ3V0dGVyIHdpdGggdGhlIGdpdmVuIGd1dHRlck5hbWUuXG4gICMgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zIGlzIGFuIHtPYmplY3R9LCB3aXRoIHRoZSBmb3JtOlxuICAjICAgKiBndXR0ZXJOYW1lIDoge1xuICAjICAgICBkZWNvcmF0aW9uLmlkIDoge1xuICAjICAgICAgIHRvcDogIyBvZiBwaXhlbHMgZnJvbSB0b3BcbiAgIyAgICAgICBoZWlnaHQ6ICMgb2YgcGl4ZWxzIGhlaWdodCBvZiB0aGlzIGRlY29yYXRpb25cbiAgIyAgICAgICBpdGVtIChvcHRpb25hbCk6IEhUTUxFbGVtZW50XG4gICMgICAgICAgY2xhc3MgKG9wdGlvbmFsKToge1N0cmluZ30gY2xhc3NcbiAgIyAgICAgfVxuICAjICAgfVxuICB1cGRhdGVDdXN0b21HdXR0ZXJEZWNvcmF0aW9uU3RhdGU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAc3RhcnRSb3c/IGFuZCBAZW5kUm93PyBhbmQgQGxpbmVIZWlnaHQ/XG5cbiAgICBpZiBAbW9kZWwuaXNNaW5pKClcbiAgICAgICMgTWluaSBlZGl0b3JzIGhhdmUgbm8gZ3V0dGVyIGRlY29yYXRpb25zLlxuICAgICAgIyBXZSBjbGVhciBpbnN0ZWFkIG9mIHJlYXNzaWduaW5nIHRvIHByZXNlcnZlIHRoZSByZWZlcmVuY2UuXG4gICAgICBAY2xlYXJBbGxDdXN0b21HdXR0ZXJEZWNvcmF0aW9ucygpXG5cbiAgICBmb3IgZ3V0dGVyIGluIEBtb2RlbC5nZXRHdXR0ZXJzKClcbiAgICAgIGd1dHRlck5hbWUgPSBndXR0ZXIubmFtZVxuICAgICAgZ3V0dGVyRGVjb3JhdGlvbnMgPSBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyTmFtZV1cbiAgICAgIGlmIGd1dHRlckRlY29yYXRpb25zXG4gICAgICAgICMgQ2xlYXIgdGhlIGd1dHRlciBkZWNvcmF0aW9uczsgdGhleSBhcmUgcmVidWlsdC5cbiAgICAgICAgIyBXZSBjbGVhciBpbnN0ZWFkIG9mIHJlYXNzaWduaW5nIHRvIHByZXNlcnZlIHRoZSByZWZlcmVuY2UuXG4gICAgICAgIEBjbGVhckRlY29yYXRpb25zRm9yQ3VzdG9tR3V0dGVyTmFtZShndXR0ZXJOYW1lKVxuICAgICAgZWxzZVxuICAgICAgICBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyTmFtZV0gPSB7fVxuXG4gICAgICBjb250aW51ZSB1bmxlc3MgQGd1dHRlcklzVmlzaWJsZShndXR0ZXIpXG4gICAgICBmb3IgZGVjb3JhdGlvbklkLCB7cHJvcGVydGllcywgc2NyZWVuUmFuZ2V9IG9mIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc0J5R3V0dGVyTmFtZVtndXR0ZXJOYW1lXVxuICAgICAgICB0b3AgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5SYW5nZS5zdGFydC5yb3cpXG4gICAgICAgIGJvdHRvbSA9IEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkJlZm9yZUJsb2Nrc0ZvclJvdyhzY3JlZW5SYW5nZS5lbmQucm93ICsgMSlcbiAgICAgICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zW2d1dHRlck5hbWVdW2RlY29yYXRpb25JZF0gPVxuICAgICAgICAgIHRvcDogdG9wXG4gICAgICAgICAgaGVpZ2h0OiBib3R0b20gLSB0b3BcbiAgICAgICAgICBpdGVtOiBwcm9wZXJ0aWVzLml0ZW1cbiAgICAgICAgICBjbGFzczogcHJvcGVydGllcy5jbGFzc1xuXG4gIGNsZWFyQWxsQ3VzdG9tR3V0dGVyRGVjb3JhdGlvbnM6IC0+XG4gICAgYWxsR3V0dGVyTmFtZXMgPSBPYmplY3Qua2V5cyhAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnMpXG4gICAgZm9yIGd1dHRlck5hbWUgaW4gYWxsR3V0dGVyTmFtZXNcbiAgICAgIEBjbGVhckRlY29yYXRpb25zRm9yQ3VzdG9tR3V0dGVyTmFtZShndXR0ZXJOYW1lKVxuXG4gIGNsZWFyRGVjb3JhdGlvbnNGb3JDdXN0b21HdXR0ZXJOYW1lOiAoZ3V0dGVyTmFtZSkgLT5cbiAgICBndXR0ZXJEZWNvcmF0aW9ucyA9IEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc1tndXR0ZXJOYW1lXVxuICAgIGlmIGd1dHRlckRlY29yYXRpb25zXG4gICAgICBhbGxEZWNvcmF0aW9uSWRzID0gT2JqZWN0LmtleXMoZ3V0dGVyRGVjb3JhdGlvbnMpXG4gICAgICBmb3IgZGVjb3JhdGlvbklkIGluIGFsbERlY29yYXRpb25JZHNcbiAgICAgICAgZGVsZXRlIGd1dHRlckRlY29yYXRpb25zW2RlY29yYXRpb25JZF1cblxuICBndXR0ZXJJc1Zpc2libGU6IChndXR0ZXJNb2RlbCkgLT5cbiAgICBpc1Zpc2libGUgPSBndXR0ZXJNb2RlbC5pc1Zpc2libGUoKVxuICAgIGlmIGd1dHRlck1vZGVsLm5hbWUgaXMgJ2xpbmUtbnVtYmVyJ1xuICAgICAgaXNWaXNpYmxlID0gaXNWaXNpYmxlIGFuZCBAbW9kZWwuZG9lc1Nob3dMaW5lTnVtYmVycygpXG4gICAgaXNWaXNpYmxlXG5cbiAgdXBkYXRlTGluZU51bWJlcnNTdGF0ZTogKHRpbGVTdGF0ZSwgc2NyZWVuUm93cykgLT5cbiAgICB0aWxlU3RhdGUubGluZU51bWJlcnMgPz0ge31cbiAgICB2aXNpYmxlTGluZU51bWJlcklkcyA9IHt9XG5cbiAgICBmb3Igc2NyZWVuUm93IGluIHNjcmVlblJvd3Mgd2hlbiBAaXNSb3dSZW5kZXJlZChzY3JlZW5Sb3cpXG4gICAgICBsaW5lID0gQGxpbmVzQnlTY3JlZW5Sb3cuZ2V0KHNjcmVlblJvdylcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBsaW5lP1xuICAgICAgbGluZUlkID0gbGluZS5pZFxuICAgICAge2J1ZmZlclJvdywgc29mdFdyYXBwZWRBdFN0YXJ0OiBzb2Z0V3JhcHBlZH0gPSBAZGlzcGxheUxheWVyLnNvZnRXcmFwRGVzY3JpcHRvckZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG4gICAgICBmb2xkYWJsZSA9IG5vdCBzb2Z0V3JhcHBlZCBhbmQgQG1vZGVsLmlzRm9sZGFibGVBdEJ1ZmZlclJvdyhidWZmZXJSb3cpXG4gICAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IEBsaW5lTnVtYmVyRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgYmxvY2tEZWNvcmF0aW9uc0JlZm9yZUN1cnJlbnRTY3JlZW5Sb3dIZWlnaHQgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cpIC0gQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQmVmb3JlQmxvY2tzRm9yUm93KHNjcmVlblJvdylcbiAgICAgIGJsb2NrRGVjb3JhdGlvbnNIZWlnaHQgPSBibG9ja0RlY29yYXRpb25zQmVmb3JlQ3VycmVudFNjcmVlblJvd0hlaWdodFxuICAgICAgaWYgc2NyZWVuUm93ICUgQHRpbGVTaXplIGlzbnQgMFxuICAgICAgICBibG9ja0RlY29yYXRpb25zQWZ0ZXJQcmV2aW91c1NjcmVlblJvd0hlaWdodCA9IEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkJlZm9yZUJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cpIC0gQGxpbmVIZWlnaHQgLSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cgLSAxKVxuICAgICAgICBibG9ja0RlY29yYXRpb25zSGVpZ2h0ICs9IGJsb2NrRGVjb3JhdGlvbnNBZnRlclByZXZpb3VzU2NyZWVuUm93SGVpZ2h0XG5cbiAgICAgIHRpbGVTdGF0ZS5saW5lTnVtYmVyc1tsaW5lSWRdID0ge3NjcmVlblJvdywgYnVmZmVyUm93LCBzb2Z0V3JhcHBlZCwgZGVjb3JhdGlvbkNsYXNzZXMsIGZvbGRhYmxlLCBibG9ja0RlY29yYXRpb25zSGVpZ2h0fVxuICAgICAgdmlzaWJsZUxpbmVOdW1iZXJJZHNbbGluZUlkXSA9IHRydWVcblxuICAgIGZvciBpZCBvZiB0aWxlU3RhdGUubGluZU51bWJlcnNcbiAgICAgIGRlbGV0ZSB0aWxlU3RhdGUubGluZU51bWJlcnNbaWRdIHVubGVzcyB2aXNpYmxlTGluZU51bWJlcklkc1tpZF1cblxuICAgIHJldHVyblxuXG4gIHVwZGF0ZVN0YXJ0Um93OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHNjcm9sbFRvcD8gYW5kIEBsaW5lSGVpZ2h0P1xuXG4gICAgQHN0YXJ0Um93ID0gTWF0aC5tYXgoMCwgQGxpbmVUb3BJbmRleC5yb3dGb3JQaXhlbFBvc2l0aW9uKEBzY3JvbGxUb3ApKVxuXG4gIHVwZGF0ZUVuZFJvdzogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBzY3JvbGxUb3A/IGFuZCBAbGluZUhlaWdodD8gYW5kIEBoZWlnaHQ/XG5cbiAgICBAZW5kUm93ID0gTWF0aC5taW4oXG4gICAgICBAbW9kZWwuZ2V0QXBwcm94aW1hdGVTY3JlZW5MaW5lQ291bnQoKSxcbiAgICAgIEBsaW5lVG9wSW5kZXgucm93Rm9yUGl4ZWxQb3NpdGlvbihAc2Nyb2xsVG9wICsgQGhlaWdodCArIEBsaW5lSGVpZ2h0IC0gMSkgKyAxXG4gICAgKVxuXG4gIHVwZGF0ZVJvd3NQZXJQYWdlOiAtPlxuICAgIHJvd3NQZXJQYWdlID0gTWF0aC5mbG9vcihAZ2V0Q2xpZW50SGVpZ2h0KCkgLyBAbGluZUhlaWdodClcbiAgICBpZiByb3dzUGVyUGFnZSBpc250IEByb3dzUGVyUGFnZVxuICAgICAgQHJvd3NQZXJQYWdlID0gcm93c1BlclBhZ2VcbiAgICAgIEBtb2RlbC5zZXRSb3dzUGVyUGFnZShAcm93c1BlclBhZ2UpXG5cbiAgdXBkYXRlU2Nyb2xsV2lkdGg6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAY29udGVudFdpZHRoPyBhbmQgQGNsaWVudFdpZHRoP1xuXG4gICAgc2Nyb2xsV2lkdGggPSBNYXRoLm1heChAY29udGVudFdpZHRoLCBAY2xpZW50V2lkdGgpXG4gICAgdW5sZXNzIEBzY3JvbGxXaWR0aCBpcyBzY3JvbGxXaWR0aFxuICAgICAgQHNjcm9sbFdpZHRoID0gc2Nyb2xsV2lkdGhcbiAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KEBzY3JvbGxMZWZ0KVxuXG4gIHVwZGF0ZVNjcm9sbEhlaWdodDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBjb250ZW50SGVpZ2h0PyBhbmQgQGNsaWVudEhlaWdodD9cblxuICAgIGNvbnRlbnRIZWlnaHQgPSBAY29udGVudEhlaWdodFxuICAgIGlmIEBtb2RlbC5nZXRTY3JvbGxQYXN0RW5kKClcbiAgICAgIGV4dHJhU2Nyb2xsSGVpZ2h0ID0gQGNsaWVudEhlaWdodCAtIChAbGluZUhlaWdodCAqIDMpXG4gICAgICBjb250ZW50SGVpZ2h0ICs9IGV4dHJhU2Nyb2xsSGVpZ2h0IGlmIGV4dHJhU2Nyb2xsSGVpZ2h0ID4gMFxuICAgIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4KGNvbnRlbnRIZWlnaHQsIEBoZWlnaHQpXG5cbiAgICB1bmxlc3MgQHNjcm9sbEhlaWdodCBpcyBzY3JvbGxIZWlnaHRcbiAgICAgIEBzY3JvbGxIZWlnaHQgPSBzY3JvbGxIZWlnaHRcbiAgICAgIEB1cGRhdGVTY3JvbGxUb3AoQHNjcm9sbFRvcClcblxuICB1cGRhdGVWZXJ0aWNhbERpbWVuc2lvbnM6IC0+XG4gICAgaWYgQGxpbmVIZWlnaHQ/XG4gICAgICBvbGRDb250ZW50SGVpZ2h0ID0gQGNvbnRlbnRIZWlnaHRcbiAgICAgIEBjb250ZW50SGVpZ2h0ID0gTWF0aC5yb3VuZChAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhAbW9kZWwuZ2V0QXBwcm94aW1hdGVTY3JlZW5MaW5lQ291bnQoKSkpXG5cbiAgICBpZiBAY29udGVudEhlaWdodCBpc250IG9sZENvbnRlbnRIZWlnaHRcbiAgICAgIEB1cGRhdGVIZWlnaHQoKVxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZVNjcm9sbEhlaWdodCgpXG5cbiAgdXBkYXRlSG9yaXpvbnRhbERpbWVuc2lvbnM6IC0+XG4gICAgaWYgQGJhc2VDaGFyYWN0ZXJXaWR0aD9cbiAgICAgIG9sZENvbnRlbnRXaWR0aCA9IEBjb250ZW50V2lkdGhcbiAgICAgIHJpZ2h0bW9zdFBvc2l0aW9uID0gQG1vZGVsLmdldEFwcHJveGltYXRlUmlnaHRtb3N0U2NyZWVuUG9zaXRpb24oKVxuICAgICAgQGNvbnRlbnRXaWR0aCA9IEBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24ocmlnaHRtb3N0UG9zaXRpb24pLmxlZnRcbiAgICAgIEBjb250ZW50V2lkdGggKz0gQHNjcm9sbExlZnRcbiAgICAgIEBjb250ZW50V2lkdGggKz0gMSB1bmxlc3MgQG1vZGVsLmlzU29mdFdyYXBwZWQoKSAjIGFjY291bnQgZm9yIGN1cnNvciB3aWR0aFxuXG4gICAgaWYgQGNvbnRlbnRXaWR0aCBpc250IG9sZENvbnRlbnRXaWR0aFxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZUNsaWVudFdpZHRoKClcbiAgICAgIEB1cGRhdGVTY3JvbGxXaWR0aCgpXG5cbiAgdXBkYXRlQ2xpZW50SGVpZ2h0OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGhlaWdodD8gYW5kIEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0P1xuXG4gICAgY2xpZW50SGVpZ2h0ID0gQGhlaWdodCAtIEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG4gICAgQG1vZGVsLnNldEhlaWdodChjbGllbnRIZWlnaHQsIHRydWUpXG5cbiAgICB1bmxlc3MgQGNsaWVudEhlaWdodCBpcyBjbGllbnRIZWlnaHRcbiAgICAgIEBjbGllbnRIZWlnaHQgPSBjbGllbnRIZWlnaHRcbiAgICAgIEB1cGRhdGVTY3JvbGxIZWlnaHQoKVxuICAgICAgQHVwZGF0ZVNjcm9sbFRvcChAc2Nyb2xsVG9wKVxuXG4gIHVwZGF0ZUNsaWVudFdpZHRoOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRGcmFtZVdpZHRoPyBhbmQgQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg/XG5cbiAgICBpZiBAbW9kZWwuZ2V0QXV0b1dpZHRoKClcbiAgICAgIGNsaWVudFdpZHRoID0gQGNvbnRlbnRXaWR0aFxuICAgIGVsc2VcbiAgICAgIGNsaWVudFdpZHRoID0gQGNvbnRlbnRGcmFtZVdpZHRoIC0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcblxuICAgIEBtb2RlbC5zZXRXaWR0aChjbGllbnRXaWR0aCwgdHJ1ZSkgdW5sZXNzIEBlZGl0b3JXaWR0aEluQ2hhcnNcblxuICAgIHVubGVzcyBAY2xpZW50V2lkdGggaXMgY2xpZW50V2lkdGhcbiAgICAgIEBjbGllbnRXaWR0aCA9IGNsaWVudFdpZHRoXG4gICAgICBAdXBkYXRlU2Nyb2xsV2lkdGgoKVxuICAgICAgQHVwZGF0ZVNjcm9sbExlZnQoQHNjcm9sbExlZnQpXG5cbiAgdXBkYXRlU2Nyb2xsVG9wOiAoc2Nyb2xsVG9wKSAtPlxuICAgIHNjcm9sbFRvcCA9IEBjb25zdHJhaW5TY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuICAgIGlmIHNjcm9sbFRvcCBpc250IEByZWFsU2Nyb2xsVG9wIGFuZCBub3QgTnVtYmVyLmlzTmFOKHNjcm9sbFRvcClcbiAgICAgIEByZWFsU2Nyb2xsVG9wID0gc2Nyb2xsVG9wXG4gICAgICBAc2Nyb2xsVG9wID0gTWF0aC5yb3VuZChzY3JvbGxUb3ApXG4gICAgICBAbW9kZWwuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KE1hdGgucm91bmQoQHNjcm9sbFRvcCAvIEBsaW5lSGVpZ2h0KSwgdHJ1ZSlcblxuICAgICAgQHVwZGF0ZVN0YXJ0Um93KClcbiAgICAgIEB1cGRhdGVFbmRSb3coKVxuICAgICAgQGRpZFN0YXJ0U2Nyb2xsaW5nKClcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2Utc2Nyb2xsLXRvcCcsIEBzY3JvbGxUb3BcblxuICBjb25zdHJhaW5TY3JvbGxUb3A6IChzY3JvbGxUb3ApIC0+XG4gICAgcmV0dXJuIHNjcm9sbFRvcCB1bmxlc3Mgc2Nyb2xsVG9wPyBhbmQgQHNjcm9sbEhlaWdodD8gYW5kIEBjbGllbnRIZWlnaHQ/XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oc2Nyb2xsVG9wLCBAc2Nyb2xsSGVpZ2h0IC0gQGNsaWVudEhlaWdodCkpXG5cbiAgdXBkYXRlU2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgc2Nyb2xsTGVmdCA9IEBjb25zdHJhaW5TY3JvbGxMZWZ0KHNjcm9sbExlZnQpXG4gICAgaWYgc2Nyb2xsTGVmdCBpc250IEByZWFsU2Nyb2xsTGVmdCBhbmQgbm90IE51bWJlci5pc05hTihzY3JvbGxMZWZ0KVxuICAgICAgQHJlYWxTY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdFxuICAgICAgQHNjcm9sbExlZnQgPSBNYXRoLnJvdW5kKHNjcm9sbExlZnQpXG4gICAgICBAbW9kZWwuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKE1hdGgucm91bmQoQHNjcm9sbExlZnQgLyBAYmFzZUNoYXJhY3RlcldpZHRoKSlcblxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1zY3JvbGwtbGVmdCcsIEBzY3JvbGxMZWZ0XG5cbiAgY29uc3RyYWluU2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgcmV0dXJuIHNjcm9sbExlZnQgdW5sZXNzIHNjcm9sbExlZnQ/IGFuZCBAc2Nyb2xsV2lkdGg/IGFuZCBAY2xpZW50V2lkdGg/XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oc2Nyb2xsTGVmdCwgQHNjcm9sbFdpZHRoIC0gQGNsaWVudFdpZHRoKSlcblxuICB1cGRhdGVTY3JvbGxiYXJEaW1lbnNpb25zOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRGcmFtZVdpZHRoPyBhbmQgQGhlaWdodD9cbiAgICByZXR1cm4gdW5sZXNzIEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg/IGFuZCBAbWVhc3VyZWRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0P1xuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRXaWR0aD8gYW5kIEBjb250ZW50SGVpZ2h0P1xuXG4gICAgaWYgQG1vZGVsLmdldEF1dG9XaWR0aCgpXG4gICAgICBjbGllbnRXaWR0aFdpdGhWZXJ0aWNhbFNjcm9sbGJhciA9IEBjb250ZW50V2lkdGggKyBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgZWxzZVxuICAgICAgY2xpZW50V2lkdGhXaXRoVmVydGljYWxTY3JvbGxiYXIgPSBAY29udGVudEZyYW1lV2lkdGhcbiAgICBjbGllbnRXaWR0aFdpdGhvdXRWZXJ0aWNhbFNjcm9sbGJhciA9IGNsaWVudFdpZHRoV2l0aFZlcnRpY2FsU2Nyb2xsYmFyIC0gQG1lYXN1cmVkVmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgIGNsaWVudEhlaWdodFdpdGhIb3Jpem9udGFsU2Nyb2xsYmFyID0gQGhlaWdodFxuICAgIGNsaWVudEhlaWdodFdpdGhvdXRIb3Jpem9udGFsU2Nyb2xsYmFyID0gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIgLSBAbWVhc3VyZWRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG5cbiAgICBob3Jpem9udGFsU2Nyb2xsYmFyVmlzaWJsZSA9XG4gICAgICBub3QgQG1vZGVsLmlzTWluaSgpIGFuZFxuICAgICAgICAoQGNvbnRlbnRXaWR0aCA+IGNsaWVudFdpZHRoV2l0aFZlcnRpY2FsU2Nyb2xsYmFyIG9yXG4gICAgICAgICBAY29udGVudFdpZHRoID4gY2xpZW50V2lkdGhXaXRob3V0VmVydGljYWxTY3JvbGxiYXIgYW5kIEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIpXG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhclZpc2libGUgPVxuICAgICAgbm90IEBtb2RlbC5pc01pbmkoKSBhbmRcbiAgICAgICAgKEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIgb3JcbiAgICAgICAgIEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aG91dEhvcml6b250YWxTY3JvbGxiYXIgYW5kIEBjb250ZW50V2lkdGggPiBjbGllbnRXaWR0aFdpdGhWZXJ0aWNhbFNjcm9sbGJhcilcblxuICAgIGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQgPVxuICAgICAgaWYgaG9yaXpvbnRhbFNjcm9sbGJhclZpc2libGVcbiAgICAgICAgQG1lYXN1cmVkSG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuICAgICAgZWxzZVxuICAgICAgICAwXG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID1cbiAgICAgIGlmIHZlcnRpY2FsU2Nyb2xsYmFyVmlzaWJsZVxuICAgICAgICBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgICBlbHNlXG4gICAgICAgIDBcblxuICAgIHVubGVzcyBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCBpcyBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG4gICAgICBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCA9IGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICAgIEB1cGRhdGVDbGllbnRIZWlnaHQoKVxuXG4gICAgdW5sZXNzIEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoIGlzIHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICAgIEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID0gdmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgICAgQHVwZGF0ZUNsaWVudFdpZHRoKClcblxuICBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3c6IChyb3cpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQG1vZGVsLmlzTWluaSgpXG5cbiAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IG51bGxcbiAgICBmb3IgaWQsIHByb3BlcnRpZXMgb2YgQGxpbmVEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11cbiAgICAgIGRlY29yYXRpb25DbGFzc2VzID89IFtdXG4gICAgICBkZWNvcmF0aW9uQ2xhc3Nlcy5wdXNoKHByb3BlcnRpZXMuY2xhc3MpXG4gICAgZGVjb3JhdGlvbkNsYXNzZXNcblxuICBsaW5lTnVtYmVyRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3c6IChyb3cpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQG1vZGVsLmlzTWluaSgpXG5cbiAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IG51bGxcbiAgICBmb3IgaWQsIHByb3BlcnRpZXMgb2YgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11cbiAgICAgIGRlY29yYXRpb25DbGFzc2VzID89IFtdXG4gICAgICBkZWNvcmF0aW9uQ2xhc3Nlcy5wdXNoKHByb3BlcnRpZXMuY2xhc3MpXG4gICAgZGVjb3JhdGlvbkNsYXNzZXNcblxuICBnZXRDdXJzb3JCbGlua1BlcmlvZDogLT4gQGN1cnNvckJsaW5rUGVyaW9kXG5cbiAgZ2V0Q3Vyc29yQmxpbmtSZXN1bWVEZWxheTogLT4gQGN1cnNvckJsaW5rUmVzdW1lRGVsYXlcblxuICBzZXRGb2N1c2VkOiAoZm9jdXNlZCkgLT5cbiAgICB1bmxlc3MgQGZvY3VzZWQgaXMgZm9jdXNlZFxuICAgICAgQGZvY3VzZWQgPSBmb2N1c2VkXG4gICAgICBpZiBAZm9jdXNlZFxuICAgICAgICBAc3RhcnRCbGlua2luZ0N1cnNvcnMoKVxuICAgICAgZWxzZVxuICAgICAgICBAc3RvcEJsaW5raW5nQ3Vyc29ycyhmYWxzZSlcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHNldFNjcm9sbFRvcDogKHNjcm9sbFRvcCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHNjcm9sbFRvcD9cblxuICAgIEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uID0gbnVsbFxuICAgIEBwZW5kaW5nU2Nyb2xsVG9wID0gc2Nyb2xsVG9wXG5cbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBzY3JvbGxUb3BcblxuICBnZXRSZWFsU2Nyb2xsVG9wOiAtPlxuICAgIEByZWFsU2Nyb2xsVG9wID8gQHNjcm9sbFRvcFxuXG4gIGRpZFN0YXJ0U2Nyb2xsaW5nOiAtPlxuICAgIGlmIEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkP1xuICAgICAgY2xlYXJUaW1lb3V0KEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkKVxuICAgICAgQHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQgPSBudWxsXG4gICAgQHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KEBkaWRTdG9wU2Nyb2xsaW5nLmJpbmQodGhpcyksIEBzdG9wcGVkU2Nyb2xsaW5nRGVsYXkpXG5cbiAgZGlkU3RvcFNjcm9sbGluZzogLT5cbiAgICBpZiBAbW91c2VXaGVlbFNjcmVlblJvdz9cbiAgICAgIEBtb3VzZVdoZWVsU2NyZWVuUm93ID0gbnVsbFxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0U2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzY3JvbGxMZWZ0P1xuXG4gICAgQHBlbmRpbmdTY3JvbGxMb2dpY2FsUG9zaXRpb24gPSBudWxsXG4gICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdFxuXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZ2V0U2Nyb2xsTGVmdDogLT5cbiAgICBAc2Nyb2xsTGVmdFxuXG4gIGdldFJlYWxTY3JvbGxMZWZ0OiAtPlxuICAgIEByZWFsU2Nyb2xsTGVmdCA/IEBzY3JvbGxMZWZ0XG5cbiAgZ2V0Q2xpZW50SGVpZ2h0OiAtPlxuICAgIGlmIEBjbGllbnRIZWlnaHRcbiAgICAgIEBjbGllbnRIZWlnaHRcbiAgICBlbHNlXG4gICAgICBAZXhwbGljaXRIZWlnaHQgLSBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuXG4gIGdldENsaWVudFdpZHRoOiAtPlxuICAgIGlmIEBjbGllbnRXaWR0aFxuICAgICAgQGNsaWVudFdpZHRoXG4gICAgZWxzZVxuICAgICAgQGNvbnRlbnRGcmFtZVdpZHRoIC0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcblxuICBnZXRTY3JvbGxCb3R0b206IC0+IEBnZXRTY3JvbGxUb3AoKSArIEBnZXRDbGllbnRIZWlnaHQoKVxuICBzZXRTY3JvbGxCb3R0b206IChzY3JvbGxCb3R0b20pIC0+XG4gICAgQHNldFNjcm9sbFRvcChzY3JvbGxCb3R0b20gLSBAZ2V0Q2xpZW50SGVpZ2h0KCkpXG4gICAgQGdldFNjcm9sbEJvdHRvbSgpXG5cbiAgZ2V0U2Nyb2xsUmlnaHQ6IC0+IEBnZXRTY3JvbGxMZWZ0KCkgKyBAZ2V0Q2xpZW50V2lkdGgoKVxuICBzZXRTY3JvbGxSaWdodDogKHNjcm9sbFJpZ2h0KSAtPlxuICAgIEBzZXRTY3JvbGxMZWZ0KHNjcm9sbFJpZ2h0IC0gQGdldENsaWVudFdpZHRoKCkpXG4gICAgQGdldFNjcm9sbFJpZ2h0KClcblxuICBnZXRTY3JvbGxIZWlnaHQ6IC0+XG4gICAgQHNjcm9sbEhlaWdodFxuXG4gIGdldFNjcm9sbFdpZHRoOiAtPlxuICAgIEBzY3JvbGxXaWR0aFxuXG4gIGdldE1heFNjcm9sbFRvcDogLT5cbiAgICBzY3JvbGxIZWlnaHQgPSBAZ2V0U2Nyb2xsSGVpZ2h0KClcbiAgICBjbGllbnRIZWlnaHQgPSBAZ2V0Q2xpZW50SGVpZ2h0KClcbiAgICByZXR1cm4gMCB1bmxlc3Mgc2Nyb2xsSGVpZ2h0PyBhbmQgY2xpZW50SGVpZ2h0P1xuXG4gICAgc2Nyb2xsSGVpZ2h0IC0gY2xpZW50SGVpZ2h0XG5cbiAgc2V0SG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodDogKGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQpIC0+XG4gICAgdW5sZXNzIEBtZWFzdXJlZEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQgaXMgaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuICAgICAgQG1lYXN1cmVkSG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCA9IGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHNldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6ICh2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoKSAtPlxuICAgIHVubGVzcyBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoIGlzIHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICAgIEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGggPSB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRBdXRvSGVpZ2h0OiAoYXV0b0hlaWdodCkgLT5cbiAgICB1bmxlc3MgQGF1dG9IZWlnaHQgaXMgYXV0b0hlaWdodFxuICAgICAgQGF1dG9IZWlnaHQgPSBhdXRvSGVpZ2h0XG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRFeHBsaWNpdEhlaWdodDogKGV4cGxpY2l0SGVpZ2h0KSAtPlxuICAgIHVubGVzcyBAZXhwbGljaXRIZWlnaHQgaXMgZXhwbGljaXRIZWlnaHRcbiAgICAgIEBleHBsaWNpdEhlaWdodCA9IGV4cGxpY2l0SGVpZ2h0XG4gICAgICBAdXBkYXRlSGVpZ2h0KClcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHVwZGF0ZUhlaWdodDogLT5cbiAgICBoZWlnaHQgPSBAZXhwbGljaXRIZWlnaHQgPyBAY29udGVudEhlaWdodFxuICAgIHVubGVzcyBAaGVpZ2h0IGlzIGhlaWdodFxuICAgICAgQGhlaWdodCA9IGhlaWdodFxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZUNsaWVudEhlaWdodCgpXG4gICAgICBAdXBkYXRlU2Nyb2xsSGVpZ2h0KClcbiAgICAgIEB1cGRhdGVFbmRSb3coKVxuXG4gIGRpZENoYW5nZUF1dG9XaWR0aDogLT5cbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRDb250ZW50RnJhbWVXaWR0aDogKGNvbnRlbnRGcmFtZVdpZHRoKSAtPlxuICAgIGlmIEBjb250ZW50RnJhbWVXaWR0aCBpc250IGNvbnRlbnRGcmFtZVdpZHRoIG9yIEBlZGl0b3JXaWR0aEluQ2hhcnM/XG4gICAgICBAY29udGVudEZyYW1lV2lkdGggPSBjb250ZW50RnJhbWVXaWR0aFxuICAgICAgQGVkaXRvcldpZHRoSW5DaGFycyA9IG51bGxcbiAgICAgIEB1cGRhdGVTY3JvbGxiYXJEaW1lbnNpb25zKClcbiAgICAgIEB1cGRhdGVDbGllbnRXaWR0aCgpXG4gICAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gdHJ1ZVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0Qm91bmRpbmdDbGllbnRSZWN0OiAoYm91bmRpbmdDbGllbnRSZWN0KSAtPlxuICAgIHVubGVzcyBAY2xpZW50UmVjdHNFcXVhbChAYm91bmRpbmdDbGllbnRSZWN0LCBib3VuZGluZ0NsaWVudFJlY3QpXG4gICAgICBAYm91bmRpbmdDbGllbnRSZWN0ID0gYm91bmRpbmdDbGllbnRSZWN0XG4gICAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gdHJ1ZVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgY2xpZW50UmVjdHNFcXVhbDogKGNsaWVudFJlY3RBLCBjbGllbnRSZWN0QikgLT5cbiAgICBjbGllbnRSZWN0QT8gYW5kIGNsaWVudFJlY3RCPyBhbmRcbiAgICAgIGNsaWVudFJlY3RBLnRvcCBpcyBjbGllbnRSZWN0Qi50b3AgYW5kXG4gICAgICBjbGllbnRSZWN0QS5sZWZ0IGlzIGNsaWVudFJlY3RCLmxlZnQgYW5kXG4gICAgICBjbGllbnRSZWN0QS53aWR0aCBpcyBjbGllbnRSZWN0Qi53aWR0aCBhbmRcbiAgICAgIGNsaWVudFJlY3RBLmhlaWdodCBpcyBjbGllbnRSZWN0Qi5oZWlnaHRcblxuICBzZXRXaW5kb3dTaXplOiAod2lkdGgsIGhlaWdodCkgLT5cbiAgICBpZiBAd2luZG93V2lkdGggaXNudCB3aWR0aCBvciBAd2luZG93SGVpZ2h0IGlzbnQgaGVpZ2h0XG4gICAgICBAd2luZG93V2lkdGggPSB3aWR0aFxuICAgICAgQHdpbmRvd0hlaWdodCA9IGhlaWdodFxuICAgICAgQGludmFsaWRhdGVBbGxCbG9ja0RlY29yYXRpb25zRGltZW5zaW9ucyA9IHRydWVcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcblxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0QmFja2dyb3VuZENvbG9yOiAoYmFja2dyb3VuZENvbG9yKSAtPlxuICAgIHVubGVzcyBAYmFja2dyb3VuZENvbG9yIGlzIGJhY2tncm91bmRDb2xvclxuICAgICAgQGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvclxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0R3V0dGVyQmFja2dyb3VuZENvbG9yOiAoZ3V0dGVyQmFja2dyb3VuZENvbG9yKSAtPlxuICAgIHVubGVzcyBAZ3V0dGVyQmFja2dyb3VuZENvbG9yIGlzIGd1dHRlckJhY2tncm91bmRDb2xvclxuICAgICAgQGd1dHRlckJhY2tncm91bmRDb2xvciA9IGd1dHRlckJhY2tncm91bmRDb2xvclxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0R3V0dGVyV2lkdGg6IChndXR0ZXJXaWR0aCkgLT5cbiAgICBpZiBAZ3V0dGVyV2lkdGggaXNudCBndXR0ZXJXaWR0aFxuICAgICAgQGd1dHRlcldpZHRoID0gZ3V0dGVyV2lkdGhcbiAgICAgIEB1cGRhdGVPdmVybGF5c1N0YXRlKClcblxuICBnZXRHdXR0ZXJXaWR0aDogLT5cbiAgICBAZ3V0dGVyV2lkdGhcblxuICBzZXRMaW5lSGVpZ2h0OiAobGluZUhlaWdodCkgLT5cbiAgICB1bmxlc3MgQGxpbmVIZWlnaHQgaXMgbGluZUhlaWdodFxuICAgICAgQGxpbmVIZWlnaHQgPSBsaW5lSGVpZ2h0XG4gICAgICBAbW9kZWwuc2V0TGluZUhlaWdodEluUGl4ZWxzKEBsaW5lSGVpZ2h0KVxuICAgICAgQGxpbmVUb3BJbmRleC5zZXREZWZhdWx0TGluZUhlaWdodChAbGluZUhlaWdodClcbiAgICAgIEByZXN0b3JlU2Nyb2xsVG9wSWZOZWVkZWQoKVxuICAgICAgQG1vZGVsLnNldExpbmVIZWlnaHRJblBpeGVscyhsaW5lSGVpZ2h0KVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0TW91c2VXaGVlbFNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBpZiBAbW91c2VXaGVlbFNjcmVlblJvdyBpc250IHNjcmVlblJvd1xuICAgICAgQG1vdXNlV2hlZWxTY3JlZW5Sb3cgPSBzY3JlZW5Sb3dcbiAgICAgIEBkaWRTdGFydFNjcm9sbGluZygpXG5cbiAgc2V0QmFzZUNoYXJhY3RlcldpZHRoOiAoYmFzZUNoYXJhY3RlcldpZHRoLCBkb3VibGVXaWR0aENoYXJXaWR0aCwgaGFsZldpZHRoQ2hhcldpZHRoLCBrb3JlYW5DaGFyV2lkdGgpIC0+XG4gICAgdW5sZXNzIEBiYXNlQ2hhcmFjdGVyV2lkdGggaXMgYmFzZUNoYXJhY3RlcldpZHRoIGFuZCBAZG91YmxlV2lkdGhDaGFyV2lkdGggaXMgZG91YmxlV2lkdGhDaGFyV2lkdGggYW5kIEBoYWxmV2lkdGhDaGFyV2lkdGggaXMgaGFsZldpZHRoQ2hhcldpZHRoIGFuZCBrb3JlYW5DaGFyV2lkdGggaXMgQGtvcmVhbkNoYXJXaWR0aFxuICAgICAgQGJhc2VDaGFyYWN0ZXJXaWR0aCA9IGJhc2VDaGFyYWN0ZXJXaWR0aFxuICAgICAgQGRvdWJsZVdpZHRoQ2hhcldpZHRoID0gZG91YmxlV2lkdGhDaGFyV2lkdGhcbiAgICAgIEBoYWxmV2lkdGhDaGFyV2lkdGggPSBoYWxmV2lkdGhDaGFyV2lkdGhcbiAgICAgIEBrb3JlYW5DaGFyV2lkdGggPSBrb3JlYW5DaGFyV2lkdGhcbiAgICAgIEBtb2RlbC5zZXREZWZhdWx0Q2hhcldpZHRoKGJhc2VDaGFyYWN0ZXJXaWR0aCwgZG91YmxlV2lkdGhDaGFyV2lkdGgsIGhhbGZXaWR0aENoYXJXaWR0aCwga29yZWFuQ2hhcldpZHRoKVxuICAgICAgQHJlc3RvcmVTY3JvbGxMZWZ0SWZOZWVkZWQoKVxuICAgICAgQG1lYXN1cmVtZW50c0NoYW5nZWQoKVxuXG4gIG1lYXN1cmVtZW50c0NoYW5nZWQ6IC0+XG4gICAgQGludmFsaWRhdGVBbGxCbG9ja0RlY29yYXRpb25zRGltZW5zaW9ucyA9IHRydWVcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgaGFzUGl4ZWxQb3NpdGlvblJlcXVpcmVtZW50czogLT5cbiAgICBAbGluZUhlaWdodD8gYW5kIEBiYXNlQ2hhcmFjdGVyV2lkdGg/XG5cbiAgcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24pIC0+XG4gICAgcG9zaXRpb24gPVxuICAgICAgQGxpbmVzWWFyZHN0aWNrLnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcbiAgICBwb3NpdGlvbi50b3AgLT0gQGdldFNjcm9sbFRvcCgpXG4gICAgcG9zaXRpb24ubGVmdCAtPSBAZ2V0U2Nyb2xsTGVmdCgpXG5cbiAgICBwb3NpdGlvbi50b3AgPSBNYXRoLnJvdW5kKHBvc2l0aW9uLnRvcClcbiAgICBwb3NpdGlvbi5sZWZ0ID0gTWF0aC5yb3VuZChwb3NpdGlvbi5sZWZ0KVxuXG4gICAgcG9zaXRpb25cblxuICBoYXNQaXhlbFJlY3RSZXF1aXJlbWVudHM6IC0+XG4gICAgQGhhc1BpeGVsUG9zaXRpb25SZXF1aXJlbWVudHMoKSBhbmQgQHNjcm9sbFdpZHRoP1xuXG4gIGhhc092ZXJsYXlQb3NpdGlvblJlcXVpcmVtZW50czogLT5cbiAgICBAaGFzUGl4ZWxSZWN0UmVxdWlyZW1lbnRzKCkgYW5kIEBib3VuZGluZ0NsaWVudFJlY3Q/IGFuZCBAd2luZG93V2lkdGggYW5kIEB3aW5kb3dIZWlnaHRcblxuICBhYnNvbHV0ZVBpeGVsUmVjdEZvclNjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UpIC0+XG4gICAgbGluZUhlaWdodCA9IEBtb2RlbC5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKVxuXG4gICAgaWYgc2NyZWVuUmFuZ2UuZW5kLnJvdyA+IHNjcmVlblJhbmdlLnN0YXJ0LnJvd1xuICAgICAgdG9wID0gQGxpbmVzWWFyZHN0aWNrLnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5zdGFydCkudG9wXG4gICAgICBsZWZ0ID0gMFxuICAgICAgaGVpZ2h0ID0gKHNjcmVlblJhbmdlLmVuZC5yb3cgLSBzY3JlZW5SYW5nZS5zdGFydC5yb3cgKyAxKSAqIGxpbmVIZWlnaHRcbiAgICAgIHdpZHRoID0gQGdldFNjcm9sbFdpZHRoKClcbiAgICBlbHNlXG4gICAgICB7dG9wLCBsZWZ0fSA9IEBsaW5lc1lhcmRzdGljay5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUmFuZ2Uuc3RhcnQpXG4gICAgICBoZWlnaHQgPSBsaW5lSGVpZ2h0XG4gICAgICB3aWR0aCA9IEBsaW5lc1lhcmRzdGljay5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUmFuZ2UuZW5kKS5sZWZ0IC0gbGVmdFxuXG4gICAge3RvcCwgbGVmdCwgd2lkdGgsIGhlaWdodH1cblxuICBwaXhlbFJlY3RGb3JTY3JlZW5SYW5nZTogKHNjcmVlblJhbmdlKSAtPlxuICAgIHJlY3QgPSBAYWJzb2x1dGVQaXhlbFJlY3RGb3JTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSlcbiAgICByZWN0LnRvcCAtPSBAZ2V0U2Nyb2xsVG9wKClcbiAgICByZWN0LmxlZnQgLT0gQGdldFNjcm9sbExlZnQoKVxuICAgIHJlY3QudG9wID0gTWF0aC5yb3VuZChyZWN0LnRvcClcbiAgICByZWN0LmxlZnQgPSBNYXRoLnJvdW5kKHJlY3QubGVmdClcbiAgICByZWN0LndpZHRoID0gTWF0aC5yb3VuZChyZWN0LndpZHRoKVxuICAgIHJlY3QuaGVpZ2h0ID0gTWF0aC5yb3VuZChyZWN0LmhlaWdodClcbiAgICByZWN0XG5cbiAgdXBkYXRlTGluZXM6IC0+XG4gICAgQGxpbmVzQnlTY3JlZW5Sb3cuY2xlYXIoKVxuXG4gICAgZm9yIFtzdGFydFJvdywgZW5kUm93XSBpbiBAZ2V0U2NyZWVuUmFuZ2VzVG9SZW5kZXIoKVxuICAgICAgZm9yIGxpbmUsIGluZGV4IGluIEBkaXNwbGF5TGF5ZXIuZ2V0U2NyZWVuTGluZXMoc3RhcnRSb3csIGVuZFJvdyArIDEpXG4gICAgICAgIEBsaW5lc0J5U2NyZWVuUm93LnNldChzdGFydFJvdyArIGluZGV4LCBsaW5lKVxuXG4gIGxpbmVJZEZvclNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAbGluZXNCeVNjcmVlblJvdy5nZXQoc2NyZWVuUm93KT8uaWRcblxuICBmZXRjaERlY29yYXRpb25zOiAtPlxuICAgIHJldHVybiB1bmxlc3MgMCA8PSBAc3RhcnRSb3cgPD0gQGVuZFJvdyA8PSBJbmZpbml0eVxuICAgIEBkZWNvcmF0aW9ucyA9IEBtb2RlbC5kZWNvcmF0aW9uc1N0YXRlRm9yU2NyZWVuUm93UmFuZ2UoQHN0YXJ0Um93LCBAZW5kUm93IC0gMSlcblxuICB1cGRhdGVCbG9ja0RlY29yYXRpb25zOiAtPlxuICAgIGlmIEBpbnZhbGlkYXRlQWxsQmxvY2tEZWNvcmF0aW9uc0RpbWVuc2lvbnNcbiAgICAgIGZvciBkZWNvcmF0aW9uIGluIEBtb2RlbC5nZXREZWNvcmF0aW9ucyh0eXBlOiAnYmxvY2snKVxuICAgICAgICBAaW52YWxpZGF0ZWREaW1lbnNpb25zQnlCbG9ja0RlY29yYXRpb24uYWRkKGRlY29yYXRpb24pXG4gICAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gZmFsc2VcblxuICAgIHZpc2libGVEZWNvcmF0aW9uc0J5SWQgPSB7fVxuICAgIHZpc2libGVEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWQgPSB7fVxuICAgIGZvciBtYXJrZXJJZCwgZGVjb3JhdGlvbnMgb2YgQG1vZGVsLmRlY29yYXRpb25zRm9yU2NyZWVuUm93UmFuZ2UoQGdldFN0YXJ0VGlsZVJvdygpLCBAZ2V0RW5kVGlsZVJvdygpICsgQHRpbGVTaXplIC0gMSlcbiAgICAgIGZvciBkZWNvcmF0aW9uIGluIGRlY29yYXRpb25zIHdoZW4gZGVjb3JhdGlvbi5pc1R5cGUoJ2Jsb2NrJylcbiAgICAgICAgc2NyZWVuUm93ID0gZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5nZXRIZWFkU2NyZWVuUG9zaXRpb24oKS5yb3dcbiAgICAgICAgaWYgZGVjb3JhdGlvbi5nZXRQcm9wZXJ0aWVzKCkucG9zaXRpb24gaXMgXCJhZnRlclwiXG4gICAgICAgICAgQGZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10gPz0ge31cbiAgICAgICAgICBAZm9sbG93aW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XVtkZWNvcmF0aW9uLmlkXSA9IHtzY3JlZW5Sb3csIGRlY29yYXRpb259XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XSA/PSB7fVxuICAgICAgICAgIEBwcmVjZWRpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddW2RlY29yYXRpb24uaWRdID0ge3NjcmVlblJvdywgZGVjb3JhdGlvbn1cbiAgICAgICAgdmlzaWJsZURlY29yYXRpb25zQnlJZFtkZWNvcmF0aW9uLmlkXSA9IHRydWVcbiAgICAgICAgdmlzaWJsZURlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddID89IHt9XG4gICAgICAgIHZpc2libGVEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XVtkZWNvcmF0aW9uLmlkXSA9IHRydWVcblxuICAgIGZvciBzY3JlZW5Sb3csIGJsb2NrRGVjb3JhdGlvbnMgb2YgQHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkXG4gICAgICBpZiBOdW1iZXIoc2NyZWVuUm93KSBpc250IEBtb3VzZVdoZWVsU2NyZWVuUm93XG4gICAgICAgIGZvciBpZCwgYmxvY2tEZWNvcmF0aW9uIG9mIGJsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgICB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddP1tpZF1cbiAgICAgICAgICAgIGRlbGV0ZSBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XVtpZF1cblxuICAgIGZvciBzY3JlZW5Sb3csIGJsb2NrRGVjb3JhdGlvbnMgb2YgQGZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkXG4gICAgICBpZiBOdW1iZXIoc2NyZWVuUm93KSBpc250IEBtb3VzZVdoZWVsU2NyZWVuUm93XG4gICAgICAgIGZvciBpZCwgYmxvY2tEZWNvcmF0aW9uIG9mIGJsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgICB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddP1tpZF1cbiAgICAgICAgICAgIGRlbGV0ZSBAZm9sbG93aW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XVtpZF1cblxuICAgIEBzdGF0ZS5jb250ZW50Lm9mZlNjcmVlbkJsb2NrRGVjb3JhdGlvbnMgPSB7fVxuICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5mb3JFYWNoIChkZWNvcmF0aW9uKSA9PlxuICAgICAgdW5sZXNzIHZpc2libGVEZWNvcmF0aW9uc0J5SWRbZGVjb3JhdGlvbi5pZF1cbiAgICAgICAgQHN0YXRlLmNvbnRlbnQub2ZmU2NyZWVuQmxvY2tEZWNvcmF0aW9uc1tkZWNvcmF0aW9uLmlkXSA9IGRlY29yYXRpb25cblxuICB1cGRhdGVMaW5lRGVjb3JhdGlvbnM6IC0+XG4gICAgQGxpbmVEZWNvcmF0aW9uc0J5U2NyZWVuUm93ID0ge31cbiAgICBAbGluZU51bWJlckRlY29yYXRpb25zQnlTY3JlZW5Sb3cgPSB7fVxuICAgIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc0J5R3V0dGVyTmFtZSA9IHt9XG5cbiAgICBmb3IgZGVjb3JhdGlvbklkLCBkZWNvcmF0aW9uU3RhdGUgb2YgQGRlY29yYXRpb25zXG4gICAgICB7cHJvcGVydGllcywgYnVmZmVyUmFuZ2UsIHNjcmVlblJhbmdlLCByYW5nZUlzUmV2ZXJzZWR9ID0gZGVjb3JhdGlvblN0YXRlXG4gICAgICBpZiBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnbGluZScpIG9yIERlY29yYXRpb24uaXNUeXBlKHByb3BlcnRpZXMsICdsaW5lLW51bWJlcicpXG4gICAgICAgIEBhZGRUb0xpbmVEZWNvcmF0aW9uQ2FjaGVzKGRlY29yYXRpb25JZCwgcHJvcGVydGllcywgYnVmZmVyUmFuZ2UsIHNjcmVlblJhbmdlLCByYW5nZUlzUmV2ZXJzZWQpXG5cbiAgICAgIGVsc2UgaWYgRGVjb3JhdGlvbi5pc1R5cGUocHJvcGVydGllcywgJ2d1dHRlcicpIGFuZCBwcm9wZXJ0aWVzLmd1dHRlck5hbWU/XG4gICAgICAgIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc0J5R3V0dGVyTmFtZVtwcm9wZXJ0aWVzLmd1dHRlck5hbWVdID89IHt9XG4gICAgICAgIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc0J5R3V0dGVyTmFtZVtwcm9wZXJ0aWVzLmd1dHRlck5hbWVdW2RlY29yYXRpb25JZF0gPSBkZWNvcmF0aW9uU3RhdGVcblxuICAgIHJldHVyblxuXG4gIHVwZGF0ZUhpZ2hsaWdodERlY29yYXRpb25zOiAtPlxuICAgIEB2aXNpYmxlSGlnaGxpZ2h0cyA9IHt9XG5cbiAgICBmb3IgZGVjb3JhdGlvbklkLCB7cHJvcGVydGllcywgc2NyZWVuUmFuZ2V9IG9mIEBkZWNvcmF0aW9uc1xuICAgICAgaWYgRGVjb3JhdGlvbi5pc1R5cGUocHJvcGVydGllcywgJ2hpZ2hsaWdodCcpXG4gICAgICAgIEB1cGRhdGVIaWdobGlnaHRTdGF0ZShkZWNvcmF0aW9uSWQsIHByb3BlcnRpZXMsIHNjcmVlblJhbmdlKVxuXG4gICAgZm9yIHRpbGVJZCwgdGlsZVN0YXRlIG9mIEBzdGF0ZS5jb250ZW50LnRpbGVzXG4gICAgICBmb3IgaWQgb2YgdGlsZVN0YXRlLmhpZ2hsaWdodHNcbiAgICAgICAgZGVsZXRlIHRpbGVTdGF0ZS5oaWdobGlnaHRzW2lkXSB1bmxlc3MgQHZpc2libGVIaWdobGlnaHRzW3RpbGVJZF0/W2lkXT9cblxuICAgIHJldHVyblxuXG4gIGFkZFRvTGluZURlY29yYXRpb25DYWNoZXM6IChkZWNvcmF0aW9uSWQsIHByb3BlcnRpZXMsIGJ1ZmZlclJhbmdlLCBzY3JlZW5SYW5nZSwgcmFuZ2VJc1JldmVyc2VkKSAtPlxuICAgIGlmIHNjcmVlblJhbmdlLmlzRW1wdHkoKVxuICAgICAgcmV0dXJuIGlmIHByb3BlcnRpZXMub25seU5vbkVtcHR5XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGlmIHByb3BlcnRpZXMub25seUVtcHR5XG4gICAgICBvbWl0TGFzdFJvdyA9IHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gaXMgMFxuXG4gICAgaWYgcmFuZ2VJc1JldmVyc2VkXG4gICAgICBoZWFkU2NyZWVuUG9zaXRpb24gPSBzY3JlZW5SYW5nZS5zdGFydFxuICAgIGVsc2VcbiAgICAgIGhlYWRTY3JlZW5Qb3NpdGlvbiA9IHNjcmVlblJhbmdlLmVuZFxuXG4gICAgaWYgcHJvcGVydGllcy5jbGFzcyBpcyAnZm9sZGVkJyBhbmQgRGVjb3JhdGlvbi5pc1R5cGUocHJvcGVydGllcywgJ2xpbmUtbnVtYmVyJylcbiAgICAgIHNjcmVlblJvdyA9IEBtb2RlbC5zY3JlZW5Sb3dGb3JCdWZmZXJSb3coYnVmZmVyUmFuZ2Uuc3RhcnQucm93KVxuICAgICAgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3NjcmVlblJvd10gPz0ge31cbiAgICAgIEBsaW5lTnVtYmVyRGVjb3JhdGlvbnNCeVNjcmVlblJvd1tzY3JlZW5Sb3ddW2RlY29yYXRpb25JZF0gPSBwcm9wZXJ0aWVzXG4gICAgZWxzZVxuICAgICAgZm9yIHJvdyBpbiBbc2NyZWVuUmFuZ2Uuc3RhcnQucm93Li5zY3JlZW5SYW5nZS5lbmQucm93XSBieSAxXG4gICAgICAgIGNvbnRpbnVlIGlmIHByb3BlcnRpZXMub25seUhlYWQgYW5kIHJvdyBpc250IGhlYWRTY3JlZW5Qb3NpdGlvbi5yb3dcbiAgICAgICAgY29udGludWUgaWYgb21pdExhc3RSb3cgYW5kIHJvdyBpcyBzY3JlZW5SYW5nZS5lbmQucm93XG5cbiAgICAgICAgaWYgRGVjb3JhdGlvbi5pc1R5cGUocHJvcGVydGllcywgJ2xpbmUnKVxuICAgICAgICAgIEBsaW5lRGVjb3JhdGlvbnNCeVNjcmVlblJvd1tyb3ddID89IHt9XG4gICAgICAgICAgQGxpbmVEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11bZGVjb3JhdGlvbklkXSA9IHByb3BlcnRpZXNcblxuICAgICAgICBpZiBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnbGluZS1udW1iZXInKVxuICAgICAgICAgIEBsaW5lTnVtYmVyRGVjb3JhdGlvbnNCeVNjcmVlblJvd1tyb3ddID89IHt9XG4gICAgICAgICAgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11bZGVjb3JhdGlvbklkXSA9IHByb3BlcnRpZXNcblxuICAgIHJldHVyblxuXG4gIGludGVyc2VjdFJhbmdlV2l0aFRpbGU6IChyYW5nZSwgdGlsZVN0YXJ0Um93KSAtPlxuICAgIGludGVyc2VjdGluZ1N0YXJ0Um93ID0gTWF0aC5tYXgodGlsZVN0YXJ0Um93LCByYW5nZS5zdGFydC5yb3cpXG4gICAgaW50ZXJzZWN0aW5nRW5kUm93ID0gTWF0aC5taW4odGlsZVN0YXJ0Um93ICsgQHRpbGVTaXplIC0gMSwgcmFuZ2UuZW5kLnJvdylcbiAgICBpbnRlcnNlY3RpbmdSYW5nZSA9IG5ldyBSYW5nZShcbiAgICAgIG5ldyBQb2ludChpbnRlcnNlY3RpbmdTdGFydFJvdywgMCksXG4gICAgICBuZXcgUG9pbnQoaW50ZXJzZWN0aW5nRW5kUm93LCBJbmZpbml0eSlcbiAgICApXG5cbiAgICBpZiBpbnRlcnNlY3RpbmdTdGFydFJvdyBpcyByYW5nZS5zdGFydC5yb3dcbiAgICAgIGludGVyc2VjdGluZ1JhbmdlLnN0YXJ0LmNvbHVtbiA9IHJhbmdlLnN0YXJ0LmNvbHVtblxuXG4gICAgaWYgaW50ZXJzZWN0aW5nRW5kUm93IGlzIHJhbmdlLmVuZC5yb3dcbiAgICAgIGludGVyc2VjdGluZ1JhbmdlLmVuZC5jb2x1bW4gPSByYW5nZS5lbmQuY29sdW1uXG5cbiAgICBpbnRlcnNlY3RpbmdSYW5nZVxuXG4gIHVwZGF0ZUhpZ2hsaWdodFN0YXRlOiAoZGVjb3JhdGlvbklkLCBwcm9wZXJ0aWVzLCBzY3JlZW5SYW5nZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBzdGFydFJvdz8gYW5kIEBlbmRSb3c/IGFuZCBAbGluZUhlaWdodD8gYW5kIEBoYXNQaXhlbFBvc2l0aW9uUmVxdWlyZW1lbnRzKClcblxuICAgIEBjb25zdHJhaW5SYW5nZVRvVmlzaWJsZVJvd1JhbmdlKHNjcmVlblJhbmdlKVxuXG4gICAgcmV0dXJuIGlmIHNjcmVlblJhbmdlLmlzRW1wdHkoKVxuXG4gICAgc3RhcnRUaWxlID0gQHRpbGVGb3JSb3coc2NyZWVuUmFuZ2Uuc3RhcnQucm93KVxuICAgIGVuZFRpbGUgPSBAdGlsZUZvclJvdyhzY3JlZW5SYW5nZS5lbmQucm93KVxuICAgIG5lZWRzRmxhc2ggPSBwcm9wZXJ0aWVzLmZsYXNoQ291bnQ/IGFuZCBAZmxhc2hDb3VudHNCeURlY29yYXRpb25JZFtkZWNvcmF0aW9uSWRdIGlzbnQgcHJvcGVydGllcy5mbGFzaENvdW50XG4gICAgaWYgbmVlZHNGbGFzaFxuICAgICAgQGZsYXNoQ291bnRzQnlEZWNvcmF0aW9uSWRbZGVjb3JhdGlvbklkXSA9IHByb3BlcnRpZXMuZmxhc2hDb3VudFxuXG4gICAgZm9yIHRpbGVTdGFydFJvdyBpbiBbc3RhcnRUaWxlLi5lbmRUaWxlXSBieSBAdGlsZVNpemVcbiAgICAgIHJhbmdlV2l0aGluVGlsZSA9IEBpbnRlcnNlY3RSYW5nZVdpdGhUaWxlKHNjcmVlblJhbmdlLCB0aWxlU3RhcnRSb3cpXG5cbiAgICAgIGNvbnRpbnVlIGlmIHJhbmdlV2l0aGluVGlsZS5pc0VtcHR5KClcblxuICAgICAgdGlsZVN0YXRlID0gQHN0YXRlLmNvbnRlbnQudGlsZXNbdGlsZVN0YXJ0Um93XSA/PSB7aGlnaGxpZ2h0czoge319XG4gICAgICBoaWdobGlnaHRTdGF0ZSA9IHRpbGVTdGF0ZS5oaWdobGlnaHRzW2RlY29yYXRpb25JZF0gPz0ge31cblxuICAgICAgaGlnaGxpZ2h0U3RhdGUubmVlZHNGbGFzaCA9IG5lZWRzRmxhc2hcbiAgICAgIGhpZ2hsaWdodFN0YXRlLmZsYXNoQ291bnQgPSBwcm9wZXJ0aWVzLmZsYXNoQ291bnRcbiAgICAgIGhpZ2hsaWdodFN0YXRlLmZsYXNoQ2xhc3MgPSBwcm9wZXJ0aWVzLmZsYXNoQ2xhc3NcbiAgICAgIGhpZ2hsaWdodFN0YXRlLmZsYXNoRHVyYXRpb24gPSBwcm9wZXJ0aWVzLmZsYXNoRHVyYXRpb25cbiAgICAgIGhpZ2hsaWdodFN0YXRlLmNsYXNzID0gcHJvcGVydGllcy5jbGFzc1xuICAgICAgaGlnaGxpZ2h0U3RhdGUuZGVwcmVjYXRlZFJlZ2lvbkNsYXNzID0gcHJvcGVydGllcy5kZXByZWNhdGVkUmVnaW9uQ2xhc3NcbiAgICAgIGhpZ2hsaWdodFN0YXRlLnJlZ2lvbnMgPSBAYnVpbGRIaWdobGlnaHRSZWdpb25zKHJhbmdlV2l0aGluVGlsZSlcblxuICAgICAgZm9yIHJlZ2lvbiBpbiBoaWdobGlnaHRTdGF0ZS5yZWdpb25zXG4gICAgICAgIEByZXBvc2l0aW9uUmVnaW9uV2l0aGluVGlsZShyZWdpb24sIHRpbGVTdGFydFJvdylcblxuICAgICAgQHZpc2libGVIaWdobGlnaHRzW3RpbGVTdGFydFJvd10gPz0ge31cbiAgICAgIEB2aXNpYmxlSGlnaGxpZ2h0c1t0aWxlU3RhcnRSb3ddW2RlY29yYXRpb25JZF0gPSB0cnVlXG5cbiAgICB0cnVlXG5cbiAgY29uc3RyYWluUmFuZ2VUb1Zpc2libGVSb3dSYW5nZTogKHNjcmVlblJhbmdlKSAtPlxuICAgIGlmIHNjcmVlblJhbmdlLnN0YXJ0LnJvdyA8IEBzdGFydFJvd1xuICAgICAgc2NyZWVuUmFuZ2Uuc3RhcnQucm93ID0gQHN0YXJ0Um93XG4gICAgICBzY3JlZW5SYW5nZS5zdGFydC5jb2x1bW4gPSAwXG5cbiAgICBpZiBzY3JlZW5SYW5nZS5lbmQucm93IDwgQHN0YXJ0Um93XG4gICAgICBzY3JlZW5SYW5nZS5lbmQucm93ID0gQHN0YXJ0Um93XG4gICAgICBzY3JlZW5SYW5nZS5lbmQuY29sdW1uID0gMFxuXG4gICAgaWYgc2NyZWVuUmFuZ2Uuc3RhcnQucm93ID49IEBlbmRSb3dcbiAgICAgIHNjcmVlblJhbmdlLnN0YXJ0LnJvdyA9IEBlbmRSb3dcbiAgICAgIHNjcmVlblJhbmdlLnN0YXJ0LmNvbHVtbiA9IDBcblxuICAgIGlmIHNjcmVlblJhbmdlLmVuZC5yb3cgPj0gQGVuZFJvd1xuICAgICAgc2NyZWVuUmFuZ2UuZW5kLnJvdyA9IEBlbmRSb3dcbiAgICAgIHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gPSAwXG5cbiAgcmVwb3NpdGlvblJlZ2lvbldpdGhpblRpbGU6IChyZWdpb24sIHRpbGVTdGFydFJvdykgLT5cbiAgICByZWdpb24udG9wICArPSBAc2Nyb2xsVG9wIC0gQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQmVmb3JlQmxvY2tzRm9yUm93KHRpbGVTdGFydFJvdylcbiAgICByZWdpb24ubGVmdCArPSBAc2Nyb2xsTGVmdFxuXG4gIGJ1aWxkSGlnaGxpZ2h0UmVnaW9uczogKHNjcmVlblJhbmdlKSAtPlxuICAgIGxpbmVIZWlnaHRJblBpeGVscyA9IEBsaW5lSGVpZ2h0XG4gICAgc3RhcnRQaXhlbFBvc2l0aW9uID0gQHBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5zdGFydClcbiAgICBlbmRQaXhlbFBvc2l0aW9uID0gQHBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5lbmQpXG4gICAgc3Bhbm5lZFJvd3MgPSBzY3JlZW5SYW5nZS5lbmQucm93IC0gc2NyZWVuUmFuZ2Uuc3RhcnQucm93ICsgMVxuXG4gICAgcmVnaW9ucyA9IFtdXG5cbiAgICBpZiBzcGFubmVkUm93cyBpcyAxXG4gICAgICByZWdpb24gPVxuICAgICAgICB0b3A6IHN0YXJ0UGl4ZWxQb3NpdGlvbi50b3BcbiAgICAgICAgaGVpZ2h0OiBsaW5lSGVpZ2h0SW5QaXhlbHNcbiAgICAgICAgbGVmdDogc3RhcnRQaXhlbFBvc2l0aW9uLmxlZnRcblxuICAgICAgaWYgc2NyZWVuUmFuZ2UuZW5kLmNvbHVtbiBpcyBJbmZpbml0eVxuICAgICAgICByZWdpb24ucmlnaHQgPSAwXG4gICAgICBlbHNlXG4gICAgICAgIHJlZ2lvbi53aWR0aCA9IGVuZFBpeGVsUG9zaXRpb24ubGVmdCAtIHN0YXJ0UGl4ZWxQb3NpdGlvbi5sZWZ0XG5cbiAgICAgIHJlZ2lvbnMucHVzaChyZWdpb24pXG4gICAgZWxzZVxuICAgICAgIyBGaXJzdCByb3csIGV4dGVuZGluZyBmcm9tIHNlbGVjdGlvbiBzdGFydCB0byB0aGUgcmlnaHQgc2lkZSBvZiBzY3JlZW5cbiAgICAgIHJlZ2lvbnMucHVzaChcbiAgICAgICAgdG9wOiBzdGFydFBpeGVsUG9zaXRpb24udG9wXG4gICAgICAgIGxlZnQ6IHN0YXJ0UGl4ZWxQb3NpdGlvbi5sZWZ0XG4gICAgICAgIGhlaWdodDogbGluZUhlaWdodEluUGl4ZWxzXG4gICAgICAgIHJpZ2h0OiAwXG4gICAgICApXG5cbiAgICAgICMgTWlkZGxlIHJvd3MsIGV4dGVuZGluZyBmcm9tIGxlZnQgc2lkZSB0byByaWdodCBzaWRlIG9mIHNjcmVlblxuICAgICAgaWYgc3Bhbm5lZFJvd3MgPiAyXG4gICAgICAgIHJlZ2lvbnMucHVzaChcbiAgICAgICAgICB0b3A6IHN0YXJ0UGl4ZWxQb3NpdGlvbi50b3AgKyBsaW5lSGVpZ2h0SW5QaXhlbHNcbiAgICAgICAgICBoZWlnaHQ6IGVuZFBpeGVsUG9zaXRpb24udG9wIC0gc3RhcnRQaXhlbFBvc2l0aW9uLnRvcCAtIGxpbmVIZWlnaHRJblBpeGVsc1xuICAgICAgICAgIGxlZnQ6IDBcbiAgICAgICAgICByaWdodDogMFxuICAgICAgICApXG5cbiAgICAgICMgTGFzdCByb3csIGV4dGVuZGluZyBmcm9tIGxlZnQgc2lkZSBvZiBzY3JlZW4gdG8gc2VsZWN0aW9uIGVuZFxuICAgICAgaWYgc2NyZWVuUmFuZ2UuZW5kLmNvbHVtbiA+IDBcbiAgICAgICAgcmVnaW9uID1cbiAgICAgICAgICB0b3A6IGVuZFBpeGVsUG9zaXRpb24udG9wXG4gICAgICAgICAgaGVpZ2h0OiBsaW5lSGVpZ2h0SW5QaXhlbHNcbiAgICAgICAgICBsZWZ0OiAwXG5cbiAgICAgICAgaWYgc2NyZWVuUmFuZ2UuZW5kLmNvbHVtbiBpcyBJbmZpbml0eVxuICAgICAgICAgIHJlZ2lvbi5yaWdodCA9IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlZ2lvbi53aWR0aCA9IGVuZFBpeGVsUG9zaXRpb24ubGVmdFxuXG4gICAgICAgIHJlZ2lvbnMucHVzaChyZWdpb24pXG5cbiAgICByZWdpb25zXG5cbiAgc2V0T3ZlcmxheURpbWVuc2lvbnM6IChkZWNvcmF0aW9uSWQsIGl0ZW1XaWR0aCwgaXRlbUhlaWdodCwgY29udGVudE1hcmdpbikgLT5cbiAgICBAb3ZlcmxheURpbWVuc2lvbnNbZGVjb3JhdGlvbklkXSA/PSB7fVxuICAgIG92ZXJsYXlTdGF0ZSA9IEBvdmVybGF5RGltZW5zaW9uc1tkZWNvcmF0aW9uSWRdXG4gICAgZGltZW5zaW9uc0FyZUVxdWFsID0gb3ZlcmxheVN0YXRlLml0ZW1XaWR0aCBpcyBpdGVtV2lkdGggYW5kXG4gICAgICBvdmVybGF5U3RhdGUuaXRlbUhlaWdodCBpcyBpdGVtSGVpZ2h0IGFuZFxuICAgICAgb3ZlcmxheVN0YXRlLmNvbnRlbnRNYXJnaW4gaXMgY29udGVudE1hcmdpblxuICAgIHVubGVzcyBkaW1lbnNpb25zQXJlRXF1YWxcbiAgICAgIG92ZXJsYXlTdGF0ZS5pdGVtV2lkdGggPSBpdGVtV2lkdGhcbiAgICAgIG92ZXJsYXlTdGF0ZS5pdGVtSGVpZ2h0ID0gaXRlbUhlaWdodFxuICAgICAgb3ZlcmxheVN0YXRlLmNvbnRlbnRNYXJnaW4gPSBjb250ZW50TWFyZ2luXG5cbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHNldEJsb2NrRGVjb3JhdGlvbkRpbWVuc2lvbnM6IChkZWNvcmF0aW9uLCB3aWR0aCwgaGVpZ2h0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9ic2VydmVkQmxvY2tEZWNvcmF0aW9ucy5oYXMoZGVjb3JhdGlvbilcblxuICAgIEBsaW5lVG9wSW5kZXgucmVzaXplQmxvY2soZGVjb3JhdGlvbi5pZCwgaGVpZ2h0KVxuXG4gICAgQGludmFsaWRhdGVkRGltZW5zaW9uc0J5QmxvY2tEZWNvcmF0aW9uLmRlbGV0ZShkZWNvcmF0aW9uKVxuICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBpbnZhbGlkYXRlQmxvY2tEZWNvcmF0aW9uRGltZW5zaW9uczogKGRlY29yYXRpb24pIC0+XG4gICAgQGludmFsaWRhdGVkRGltZW5zaW9uc0J5QmxvY2tEZWNvcmF0aW9uLmFkZChkZWNvcmF0aW9uKVxuICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzcGxpY2VCbG9ja0RlY29yYXRpb25zSW5SYW5nZTogKHN0YXJ0LCBlbmQsIHNjcmVlbkRlbHRhKSAtPlxuICAgIHJldHVybiBpZiBzY3JlZW5EZWx0YSBpcyAwXG5cbiAgICBvbGRFeHRlbnQgPSBlbmQgLSBzdGFydFxuICAgIG5ld0V4dGVudCA9IGVuZCAtIHN0YXJ0ICsgc2NyZWVuRGVsdGFcbiAgICBpbnZhbGlkYXRlZEJsb2NrRGVjb3JhdGlvbklkcyA9IEBsaW5lVG9wSW5kZXguc3BsaWNlKHN0YXJ0LCBvbGRFeHRlbnQsIG5ld0V4dGVudClcbiAgICBpbnZhbGlkYXRlZEJsb2NrRGVjb3JhdGlvbklkcy5mb3JFYWNoIChpZCkgPT5cbiAgICAgIGRlY29yYXRpb24gPSBAbW9kZWwuZGVjb3JhdGlvbkZvcklkKGlkKVxuICAgICAgbmV3U2NyZWVuUG9zaXRpb24gPSBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpXG4gICAgICBAbGluZVRvcEluZGV4Lm1vdmVCbG9jayhpZCwgbmV3U2NyZWVuUG9zaXRpb24ucm93KVxuICAgICAgQGludmFsaWRhdGVkRGltZW5zaW9uc0J5QmxvY2tEZWNvcmF0aW9uLmFkZChkZWNvcmF0aW9uKVxuXG4gIGRpZEFkZEJsb2NrRGVjb3JhdGlvbjogKGRlY29yYXRpb24pIC0+XG4gICAgcmV0dXJuIGlmIG5vdCBkZWNvcmF0aW9uLmlzVHlwZSgnYmxvY2snKSBvciBAb2JzZXJ2ZWRCbG9ja0RlY29yYXRpb25zLmhhcyhkZWNvcmF0aW9uKVxuXG4gICAgZGlkTW92ZURpc3Bvc2FibGUgPSBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmJ1ZmZlck1hcmtlci5vbkRpZENoYW5nZSAobWFya2VyRXZlbnQpID0+XG4gICAgICBAZGlkTW92ZUJsb2NrRGVjb3JhdGlvbihkZWNvcmF0aW9uLCBtYXJrZXJFdmVudClcblxuICAgIGRpZERlc3Ryb3lEaXNwb3NhYmxlID0gZGVjb3JhdGlvbi5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBkaXNwb3NhYmxlcy5yZW1vdmUoZGlkTW92ZURpc3Bvc2FibGUpXG4gICAgICBAZGlzcG9zYWJsZXMucmVtb3ZlKGRpZERlc3Ryb3lEaXNwb3NhYmxlKVxuICAgICAgZGlkTW92ZURpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICBkaWREZXN0cm95RGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICAgIEBkaWREZXN0cm95QmxvY2tEZWNvcmF0aW9uKGRlY29yYXRpb24pXG5cbiAgICBpc0FmdGVyID0gZGVjb3JhdGlvbi5nZXRQcm9wZXJ0aWVzKCkucG9zaXRpb24gaXMgXCJhZnRlclwiXG4gICAgQGxpbmVUb3BJbmRleC5pbnNlcnRCbG9jayhkZWNvcmF0aW9uLmlkLCBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpLnJvdywgMCwgaXNBZnRlcilcblxuICAgIEBvYnNlcnZlZEJsb2NrRGVjb3JhdGlvbnMuYWRkKGRlY29yYXRpb24pXG4gICAgQGludmFsaWRhdGVCbG9ja0RlY29yYXRpb25EaW1lbnNpb25zKGRlY29yYXRpb24pXG4gICAgQGRpc3Bvc2FibGVzLmFkZChkaWRNb3ZlRGlzcG9zYWJsZSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkKGRpZERlc3Ryb3lEaXNwb3NhYmxlKVxuICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBkaWRNb3ZlQmxvY2tEZWNvcmF0aW9uOiAoZGVjb3JhdGlvbiwgbWFya2VyRXZlbnQpIC0+XG4gICAgIyBEb24ndCBtb3ZlIGJsb2NrcyBhZnRlciBhIHRleHQgY2hhbmdlLCBiZWNhdXNlIHdlIGFscmVhZHkgc3BsaWNlIG9uIGJ1ZmZlclxuICAgICMgY2hhbmdlLlxuICAgIHJldHVybiBpZiBtYXJrZXJFdmVudC50ZXh0Q2hhbmdlZFxuXG4gICAgQGxpbmVUb3BJbmRleC5tb3ZlQmxvY2soZGVjb3JhdGlvbi5pZCwgZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5nZXRIZWFkU2NyZWVuUG9zaXRpb24oKS5yb3cpXG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIGRpZERlc3Ryb3lCbG9ja0RlY29yYXRpb246IChkZWNvcmF0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQG9ic2VydmVkQmxvY2tEZWNvcmF0aW9ucy5oYXMoZGVjb3JhdGlvbilcblxuICAgIEBsaW5lVG9wSW5kZXgucmVtb3ZlQmxvY2soZGVjb3JhdGlvbi5pZClcbiAgICBAb2JzZXJ2ZWRCbG9ja0RlY29yYXRpb25zLmRlbGV0ZShkZWNvcmF0aW9uKVxuICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5kZWxldGUoZGVjb3JhdGlvbilcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgb2JzZXJ2ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBkaWRDaGFuZ2VQb3NpdGlvbkRpc3Bvc2FibGUgPSBjdXJzb3Iub25EaWRDaGFuZ2VQb3NpdGlvbiA9PlxuICAgICAgQHBhdXNlQ3Vyc29yQmxpbmtpbmcoKVxuXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICAgIGRpZENoYW5nZVZpc2liaWxpdHlEaXNwb3NhYmxlID0gY3Vyc29yLm9uRGlkQ2hhbmdlVmlzaWJpbGl0eSA9PlxuXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICAgIGRpZERlc3Ryb3lEaXNwb3NhYmxlID0gY3Vyc29yLm9uRGlkRGVzdHJveSA9PlxuICAgICAgQGRpc3Bvc2FibGVzLnJlbW92ZShkaWRDaGFuZ2VQb3NpdGlvbkRpc3Bvc2FibGUpXG4gICAgICBAZGlzcG9zYWJsZXMucmVtb3ZlKGRpZENoYW5nZVZpc2liaWxpdHlEaXNwb3NhYmxlKVxuICAgICAgQGRpc3Bvc2FibGVzLnJlbW92ZShkaWREZXN0cm95RGlzcG9zYWJsZSlcblxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkKGRpZENoYW5nZVBvc2l0aW9uRGlzcG9zYWJsZSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkKGRpZENoYW5nZVZpc2liaWxpdHlEaXNwb3NhYmxlKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQoZGlkRGVzdHJveURpc3Bvc2FibGUpXG5cbiAgZGlkQWRkQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBvYnNlcnZlQ3Vyc29yKGN1cnNvcilcbiAgICBAcGF1c2VDdXJzb3JCbGlua2luZygpXG5cbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzdGFydEJsaW5raW5nQ3Vyc29yczogLT5cbiAgICB1bmxlc3MgQGlzQ3Vyc29yQmxpbmtpbmcoKVxuICAgICAgQHN0YXRlLmNvbnRlbnQuY3Vyc29yc1Zpc2libGUgPSB0cnVlXG4gICAgICBAdG9nZ2xlQ3Vyc29yQmxpbmtIYW5kbGUgPSBzZXRJbnRlcnZhbChAdG9nZ2xlQ3Vyc29yQmxpbmsuYmluZCh0aGlzKSwgQGdldEN1cnNvckJsaW5rUGVyaW9kKCkgLyAyKVxuXG4gIGlzQ3Vyc29yQmxpbmtpbmc6IC0+XG4gICAgQHRvZ2dsZUN1cnNvckJsaW5rSGFuZGxlP1xuXG4gIHN0b3BCbGlua2luZ0N1cnNvcnM6ICh2aXNpYmxlKSAtPlxuICAgIGlmIEBpc0N1cnNvckJsaW5raW5nKClcbiAgICAgIEBzdGF0ZS5jb250ZW50LmN1cnNvcnNWaXNpYmxlID0gdmlzaWJsZVxuICAgICAgY2xlYXJJbnRlcnZhbChAdG9nZ2xlQ3Vyc29yQmxpbmtIYW5kbGUpXG4gICAgICBAdG9nZ2xlQ3Vyc29yQmxpbmtIYW5kbGUgPSBudWxsXG5cbiAgdG9nZ2xlQ3Vyc29yQmxpbms6IC0+XG4gICAgQHN0YXRlLmNvbnRlbnQuY3Vyc29yc1Zpc2libGUgPSBub3QgQHN0YXRlLmNvbnRlbnQuY3Vyc29yc1Zpc2libGVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBwYXVzZUN1cnNvckJsaW5raW5nOiAtPlxuICAgIGlmIEBpc0N1cnNvckJsaW5raW5nKClcbiAgICAgIEBzdG9wQmxpbmtpbmdDdXJzb3JzKHRydWUpXG4gICAgICBAc3RhcnRCbGlua2luZ0N1cnNvcnNBZnRlckRlbGF5ID89IF8uZGVib3VuY2UoQHN0YXJ0QmxpbmtpbmdDdXJzb3JzLCBAZ2V0Q3Vyc29yQmxpbmtSZXN1bWVEZWxheSgpKVxuICAgICAgQHN0YXJ0QmxpbmtpbmdDdXJzb3JzQWZ0ZXJEZWxheSgpXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICByZXF1ZXN0QXV0b3Njcm9sbDogKHBvc2l0aW9uKSAtPlxuICAgIEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uID0gcG9zaXRpb25cbiAgICBAcGVuZGluZ1Njcm9sbFRvcCA9IG51bGxcbiAgICBAcGVuZGluZ1Njcm9sbExlZnQgPSBudWxsXG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIGRpZENoYW5nZUZpcnN0VmlzaWJsZVNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAc2V0U2Nyb2xsVG9wKEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkFmdGVyQmxvY2tzRm9yUm93KHNjcmVlblJvdykpXG5cbiAgZ2V0VmVydGljYWxTY3JvbGxNYXJnaW5JblBpeGVsczogLT5cbiAgICBNYXRoLnJvdW5kKEBtb2RlbC5nZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbigpICogQGxpbmVIZWlnaHQpXG5cbiAgZ2V0SG9yaXpvbnRhbFNjcm9sbE1hcmdpbkluUGl4ZWxzOiAtPlxuICAgIE1hdGgucm91bmQoQG1vZGVsLmdldEhvcml6b250YWxTY3JvbGxNYXJnaW4oKSAqIEBiYXNlQ2hhcmFjdGVyV2lkdGgpXG5cbiAgZ2V0VmVydGljYWxTY3JvbGxiYXJXaWR0aDogLT5cbiAgICBAdmVydGljYWxTY3JvbGxiYXJXaWR0aFxuXG4gIGdldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQ6IC0+XG4gICAgQGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcblxuICBjb21taXRQZW5kaW5nTG9naWNhbFNjcm9sbFRvcFBvc2l0aW9uOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHBlbmRpbmdTY3JvbGxMb2dpY2FsUG9zaXRpb24/XG5cbiAgICB7c2NyZWVuUmFuZ2UsIG9wdGlvbnN9ID0gQHBlbmRpbmdTY3JvbGxMb2dpY2FsUG9zaXRpb25cblxuICAgIHZlcnRpY2FsU2Nyb2xsTWFyZ2luSW5QaXhlbHMgPSBAZ2V0VmVydGljYWxTY3JvbGxNYXJnaW5JblBpeGVscygpXG5cbiAgICB0b3AgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5SYW5nZS5zdGFydC5yb3cpXG4gICAgYm90dG9tID0gQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQWZ0ZXJCbG9ja3NGb3JSb3coc2NyZWVuUmFuZ2UuZW5kLnJvdykgKyBAbGluZUhlaWdodFxuXG4gICAgaWYgb3B0aW9ucz8uY2VudGVyXG4gICAgICBkZXNpcmVkU2Nyb2xsQ2VudGVyID0gKHRvcCArIGJvdHRvbSkgLyAyXG4gICAgICB1bmxlc3MgQGdldFNjcm9sbFRvcCgpIDwgZGVzaXJlZFNjcm9sbENlbnRlciA8IEBnZXRTY3JvbGxCb3R0b20oKVxuICAgICAgICBkZXNpcmVkU2Nyb2xsVG9wID0gZGVzaXJlZFNjcm9sbENlbnRlciAtIEBnZXRDbGllbnRIZWlnaHQoKSAvIDJcbiAgICAgICAgZGVzaXJlZFNjcm9sbEJvdHRvbSA9IGRlc2lyZWRTY3JvbGxDZW50ZXIgKyBAZ2V0Q2xpZW50SGVpZ2h0KCkgLyAyXG4gICAgZWxzZVxuICAgICAgZGVzaXJlZFNjcm9sbFRvcCA9IHRvcCAtIHZlcnRpY2FsU2Nyb2xsTWFyZ2luSW5QaXhlbHNcbiAgICAgIGRlc2lyZWRTY3JvbGxCb3R0b20gPSBib3R0b20gKyB2ZXJ0aWNhbFNjcm9sbE1hcmdpbkluUGl4ZWxzXG5cbiAgICBpZiBvcHRpb25zPy5yZXZlcnNlZCA/IHRydWVcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxCb3R0b20gPiBAZ2V0U2Nyb2xsQm90dG9tKClcbiAgICAgICAgQHVwZGF0ZVNjcm9sbFRvcChkZXNpcmVkU2Nyb2xsQm90dG9tIC0gQGdldENsaWVudEhlaWdodCgpKVxuICAgICAgaWYgZGVzaXJlZFNjcm9sbFRvcCA8IEBnZXRTY3JvbGxUb3AoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsVG9wKGRlc2lyZWRTY3JvbGxUb3ApXG4gICAgZWxzZVxuICAgICAgaWYgZGVzaXJlZFNjcm9sbFRvcCA8IEBnZXRTY3JvbGxUb3AoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsVG9wKGRlc2lyZWRTY3JvbGxUb3ApXG4gICAgICBpZiBkZXNpcmVkU2Nyb2xsQm90dG9tID4gQGdldFNjcm9sbEJvdHRvbSgpXG4gICAgICAgIEB1cGRhdGVTY3JvbGxUb3AoZGVzaXJlZFNjcm9sbEJvdHRvbSAtIEBnZXRDbGllbnRIZWlnaHQoKSlcblxuICBjb21taXRQZW5kaW5nTG9naWNhbFNjcm9sbExlZnRQb3NpdGlvbjogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uP1xuXG4gICAge3NjcmVlblJhbmdlLCBvcHRpb25zfSA9IEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uXG5cbiAgICBob3Jpem9udGFsU2Nyb2xsTWFyZ2luSW5QaXhlbHMgPSBAZ2V0SG9yaXpvbnRhbFNjcm9sbE1hcmdpbkluUGl4ZWxzKClcblxuICAgIHtsZWZ0fSA9IEBwaXhlbFJlY3RGb3JTY3JlZW5SYW5nZShuZXcgUmFuZ2Uoc2NyZWVuUmFuZ2Uuc3RhcnQsIHNjcmVlblJhbmdlLnN0YXJ0KSlcbiAgICB7bGVmdDogcmlnaHR9ID0gQHBpeGVsUmVjdEZvclNjcmVlblJhbmdlKG5ldyBSYW5nZShzY3JlZW5SYW5nZS5lbmQsIHNjcmVlblJhbmdlLmVuZCkpXG5cbiAgICBsZWZ0ICs9IEBzY3JvbGxMZWZ0XG4gICAgcmlnaHQgKz0gQHNjcm9sbExlZnRcblxuICAgIGRlc2lyZWRTY3JvbGxMZWZ0ID0gbGVmdCAtIGhvcml6b250YWxTY3JvbGxNYXJnaW5JblBpeGVsc1xuICAgIGRlc2lyZWRTY3JvbGxSaWdodCA9IHJpZ2h0ICsgaG9yaXpvbnRhbFNjcm9sbE1hcmdpbkluUGl4ZWxzXG5cbiAgICBpZiBvcHRpb25zPy5yZXZlcnNlZCA/IHRydWVcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxSaWdodCA+IEBnZXRTY3JvbGxSaWdodCgpXG4gICAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KGRlc2lyZWRTY3JvbGxSaWdodCAtIEBnZXRDbGllbnRXaWR0aCgpKVxuICAgICAgaWYgZGVzaXJlZFNjcm9sbExlZnQgPCBAZ2V0U2Nyb2xsTGVmdCgpXG4gICAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KGRlc2lyZWRTY3JvbGxMZWZ0KVxuICAgIGVsc2VcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxMZWZ0IDwgQGdldFNjcm9sbExlZnQoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsTGVmdChkZXNpcmVkU2Nyb2xsTGVmdClcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxSaWdodCA+IEBnZXRTY3JvbGxSaWdodCgpXG4gICAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KGRlc2lyZWRTY3JvbGxSaWdodCAtIEBnZXRDbGllbnRXaWR0aCgpKVxuXG4gIGNvbW1pdFBlbmRpbmdTY3JvbGxMZWZ0UG9zaXRpb246IC0+XG4gICAgaWYgQHBlbmRpbmdTY3JvbGxMZWZ0P1xuICAgICAgQHVwZGF0ZVNjcm9sbExlZnQoQHBlbmRpbmdTY3JvbGxMZWZ0KVxuICAgICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gbnVsbFxuXG4gIGNvbW1pdFBlbmRpbmdTY3JvbGxUb3BQb3NpdGlvbjogLT5cbiAgICBpZiBAcGVuZGluZ1Njcm9sbFRvcD9cbiAgICAgIEB1cGRhdGVTY3JvbGxUb3AoQHBlbmRpbmdTY3JvbGxUb3ApXG4gICAgICBAcGVuZGluZ1Njcm9sbFRvcCA9IG51bGxcblxuICBjbGVhclBlbmRpbmdTY3JvbGxQb3NpdGlvbjogLT5cbiAgICBAcGVuZGluZ1Njcm9sbExvZ2ljYWxQb3NpdGlvbiA9IG51bGxcbiAgICBAcGVuZGluZ1Njcm9sbFRvcCA9IG51bGxcbiAgICBAcGVuZGluZ1Njcm9sbExlZnQgPSBudWxsXG5cbiAgY2FuU2Nyb2xsTGVmdFRvOiAoc2Nyb2xsTGVmdCkgLT5cbiAgICBAc2Nyb2xsTGVmdCBpc250IEBjb25zdHJhaW5TY3JvbGxMZWZ0KHNjcm9sbExlZnQpXG5cbiAgY2FuU2Nyb2xsVG9wVG86IChzY3JvbGxUb3ApIC0+XG4gICAgQHNjcm9sbFRvcCBpc250IEBjb25zdHJhaW5TY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuXG4gIHJlc3RvcmVTY3JvbGxUb3BJZk5lZWRlZDogLT5cbiAgICB1bmxlc3MgQHNjcm9sbFRvcD9cbiAgICAgIEB1cGRhdGVTY3JvbGxUb3AoQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQWZ0ZXJCbG9ja3NGb3JSb3coQG1vZGVsLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpKSlcblxuICByZXN0b3JlU2Nyb2xsTGVmdElmTmVlZGVkOiAtPlxuICAgIHVubGVzcyBAc2Nyb2xsTGVmdD9cbiAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KEBtb2RlbC5nZXRGaXJzdFZpc2libGVTY3JlZW5Db2x1bW4oKSAqIEBiYXNlQ2hhcmFjdGVyV2lkdGgpXG5cbiAgb25EaWRDaGFuZ2VTY3JvbGxUb3A6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1zY3JvbGwtdG9wJywgY2FsbGJhY2tcblxuICBvbkRpZENoYW5nZVNjcm9sbExlZnQ6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1zY3JvbGwtbGVmdCcsIGNhbGxiYWNrXG5cbiAgZ2V0VmlzaWJsZVJvd1JhbmdlOiAtPlxuICAgIFtAc3RhcnRSb3csIEBlbmRSb3ddXG5cbiAgaXNSb3dSZW5kZXJlZDogKHJvdykgLT5cbiAgICBAZ2V0U3RhcnRUaWxlUm93KCkgPD0gcm93IDwgQGdldEVuZFRpbGVSb3coKSArIEB0aWxlU2l6ZVxuXG4gIGlzT3BlblRhZ0NvZGU6ICh0YWdDb2RlKSAtPlxuICAgIEBkaXNwbGF5TGF5ZXIuaXNPcGVuVGFnQ29kZSh0YWdDb2RlKVxuXG4gIGlzQ2xvc2VUYWdDb2RlOiAodGFnQ29kZSkgLT5cbiAgICBAZGlzcGxheUxheWVyLmlzQ2xvc2VUYWdDb2RlKHRhZ0NvZGUpXG5cbiAgdGFnRm9yQ29kZTogKHRhZ0NvZGUpIC0+XG4gICAgQGRpc3BsYXlMYXllci50YWdGb3JDb2RlKHRhZ0NvZGUpXG4iXX0=
