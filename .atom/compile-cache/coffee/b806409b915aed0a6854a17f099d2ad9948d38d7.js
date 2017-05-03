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
      return region.top += this.scrollTop - this.lineTopIndex.pixelPositionBeforeBlocksForRow(tileStartRow);
    };

    TextEditorPresenter.prototype.buildHighlightRegions = function(screenRange) {
      var endPixelPosition, lineHeightInPixels, region, regions, spannedRows, startPixelPosition;
      lineHeightInPixels = this.lineHeight;
      startPixelPosition = this.pixelPositionForScreenPosition(screenRange.start);
      endPixelPosition = this.pixelPositionForScreenPosition(screenRange.end);
      startPixelPosition.left += this.scrollLeft;
      endPixelPosition.left += this.scrollLeft;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90ZXh0LWVkaXRvci1wcmVzZW50ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixPQUFpQixPQUFBLENBQVEsYUFBUixDQUFqQixFQUFDLGtCQUFELEVBQVE7O0VBQ1IsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixVQUFBLEdBQWEsT0FBQSxDQUFRLGNBQVI7O0VBRWIsTUFBTSxDQUFDLE9BQVAsR0FDTTtrQ0FDSix1QkFBQSxHQUF5Qjs7a0NBQ3pCLDhCQUFBLEdBQWdDOztrQ0FDaEMseUJBQUEsR0FBMkI7O2tDQUMzQixtQkFBQSxHQUFxQjs7a0NBQ3JCLGlCQUFBLEdBQW1COztrQ0FDbkIscUJBQUEsR0FBdUI7O0lBRVYsNkJBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxlQUFBLEtBQUYsRUFBUyxJQUFDLENBQUEsc0JBQUE7TUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsR0FBbUI7TUFDbEIsSUFBQyxDQUFBLDJCQUFBLGlCQUFGLEVBQXFCLElBQUMsQ0FBQSxnQ0FBQSxzQkFBdEIsRUFBOEMsSUFBQyxDQUFBLCtCQUFBLHFCQUEvQyxFQUFzRSxJQUFDLENBQUEsa0JBQUEsUUFBdkUsRUFBaUYsSUFBQyxDQUFBLG9CQUFBO01BQ2pGLElBQUMsQ0FBQSxvQkFBcUIsT0FBckI7TUFDRCxJQUFDLENBQUEsZUFBZ0IsSUFBQyxDQUFBLE1BQWpCO01BRUYsSUFBQyxDQUFBLFdBQUQsR0FBZTs7UUFDZixJQUFDLENBQUEsV0FBWTs7TUFDYixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFDLENBQUE7TUFDbEIsSUFBQyxDQUFBLGNBQUQsR0FB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LGVBQUQsQ0FBQSxDQUFBLElBQXNCLEdBQXRCLElBQXNCLEdBQXRCLEdBQTRCLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxHQUFtQixJQUFDLENBQUEsUUFBaEQ7SUFEYTs7a0NBR2YsYUFBQSxHQUFlLFNBQUMsT0FBRDthQUNiLElBQUMsQ0FBQSxZQUFZLENBQUMsYUFBZCxDQUE0QixPQUE1QjtJQURhOztrQ0FHZixjQUFBLEdBQWdCLFNBQUMsT0FBRDthQUNkLElBQUMsQ0FBQSxZQUFZLENBQUMsY0FBZCxDQUE2QixPQUE3QjtJQURjOztrQ0FHaEIsVUFBQSxHQUFZLFNBQUMsT0FBRDthQUNWLElBQUMsQ0FBQSxZQUFZLENBQUMsVUFBZCxDQUF5QixPQUF6QjtJQURVOzs7OztBQXRnRGQiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG57UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ3RleHQtYnVmZmVyJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbkRlY29yYXRpb24gPSByZXF1aXJlICcuL2RlY29yYXRpb24nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRleHRFZGl0b3JQcmVzZW50ZXJcbiAgdG9nZ2xlQ3Vyc29yQmxpbmtIYW5kbGU6IG51bGxcbiAgc3RhcnRCbGlua2luZ0N1cnNvcnNBZnRlckRlbGF5OiBudWxsXG4gIHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQ6IG51bGxcbiAgbW91c2VXaGVlbFNjcmVlblJvdzogbnVsbFxuICBvdmVybGF5RGltZW5zaW9uczogbnVsbFxuICBtaW5pbXVtUmVmbG93SW50ZXJ2YWw6IDIwMFxuXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHtAbW9kZWwsIEBsaW5lVG9wSW5kZXh9ID0gcGFyYW1zXG4gICAgQG1vZGVsLnByZXNlbnRlciA9IHRoaXNcbiAgICB7QGN1cnNvckJsaW5rUGVyaW9kLCBAY3Vyc29yQmxpbmtSZXN1bWVEZWxheSwgQHN0b3BwZWRTY3JvbGxpbmdEZWxheSwgQHRpbGVTaXplLCBAYXV0b0hlaWdodH0gPSBwYXJhbXNcbiAgICB7QGNvbnRlbnRGcmFtZVdpZHRofSA9IHBhcmFtc1xuICAgIHtAZGlzcGxheUxheWVyfSA9IEBtb2RlbFxuXG4gICAgQGd1dHRlcldpZHRoID0gMFxuICAgIEB0aWxlU2l6ZSA/PSA2XG4gICAgQHJlYWxTY3JvbGxUb3AgPSBAc2Nyb2xsVG9wXG4gICAgQHJlYWxTY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAbGluZXNCeVNjcmVlblJvdyA9IG5ldyBNYXBcbiAgICBAdmlzaWJsZUhpZ2hsaWdodHMgPSB7fVxuICAgIEBjaGFyYWN0ZXJXaWR0aHNCeVNjb3BlID0ge31cbiAgICBAbGluZURlY29yYXRpb25zQnlTY3JlZW5Sb3cgPSB7fVxuICAgIEBsaW5lTnVtYmVyRGVjb3JhdGlvbnNCeVNjcmVlblJvdyA9IHt9XG4gICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zQnlHdXR0ZXJOYW1lID0ge31cbiAgICBAb3ZlcmxheURpbWVuc2lvbnMgPSB7fVxuICAgIEBvYnNlcnZlZEJsb2NrRGVjb3JhdGlvbnMgPSBuZXcgU2V0KClcbiAgICBAaW52YWxpZGF0ZWREaW1lbnNpb25zQnlCbG9ja0RlY29yYXRpb24gPSBuZXcgU2V0KClcbiAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gZmFsc2VcbiAgICBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWQgPSB7fVxuICAgIEBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZCA9IHt9XG4gICAgQHNjcmVlblJvd3NUb01lYXN1cmUgPSBbXVxuICAgIEBmbGFzaENvdW50c0J5RGVjb3JhdGlvbklkID0ge31cbiAgICBAdHJhbnNmZXJNZWFzdXJlbWVudHNUb01vZGVsKClcbiAgICBAdHJhbnNmZXJNZWFzdXJlbWVudHNGcm9tTW9kZWwoKVxuICAgIEBvYnNlcnZlTW9kZWwoKVxuICAgIEBidWlsZFN0YXRlKClcbiAgICBAaW52YWxpZGF0ZVN0YXRlKClcbiAgICBAc3RhcnRCbGlua2luZ0N1cnNvcnMoKSBpZiBAZm9jdXNlZFxuICAgIEBzdGFydFJlZmxvd2luZygpIGlmIEBjb250aW51b3VzUmVmbG93XG4gICAgQHVwZGF0aW5nID0gZmFsc2VcblxuICBzZXRMaW5lc1lhcmRzdGljazogKEBsaW5lc1lhcmRzdGljaykgLT5cblxuICBnZXRMaW5lc1lhcmRzdGljazogLT4gQGxpbmVzWWFyZHN0aWNrXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgY2xlYXJUaW1lb3V0KEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkKSBpZiBAc3RvcHBlZFNjcm9sbGluZ1RpbWVvdXRJZD9cbiAgICBjbGVhckludGVydmFsKEByZWZsb3dpbmdJbnRlcnZhbCkgaWYgQHJlZmxvd2luZ0ludGVydmFsP1xuICAgIEBzdG9wQmxpbmtpbmdDdXJzb3JzKClcblxuICAjIENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHNvbWUgY2hhbmdlcyBpbiB0aGUgbW9kZWwgb2NjdXJyZWQgYW5kIHRoZSBjdXJyZW50IHN0YXRlIGhhcyBiZWVuIHVwZGF0ZWQuXG4gIG9uRGlkVXBkYXRlU3RhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXVwZGF0ZS1zdGF0ZScsIGNhbGxiYWNrXG5cbiAgZW1pdERpZFVwZGF0ZVN0YXRlOiAtPlxuICAgIEBlbWl0dGVyLmVtaXQgXCJkaWQtdXBkYXRlLXN0YXRlXCIgaWYgQGlzQmF0Y2hpbmcoKVxuXG4gIHRyYW5zZmVyTWVhc3VyZW1lbnRzVG9Nb2RlbDogLT5cbiAgICBAbW9kZWwuc2V0TGluZUhlaWdodEluUGl4ZWxzKEBsaW5lSGVpZ2h0KSBpZiBAbGluZUhlaWdodD9cbiAgICBAbW9kZWwuc2V0RGVmYXVsdENoYXJXaWR0aChAYmFzZUNoYXJhY3RlcldpZHRoKSBpZiBAYmFzZUNoYXJhY3RlcldpZHRoP1xuXG4gIHRyYW5zZmVyTWVhc3VyZW1lbnRzRnJvbU1vZGVsOiAtPlxuICAgIEBlZGl0b3JXaWR0aEluQ2hhcnMgPSBAbW9kZWwuZ2V0RWRpdG9yV2lkdGhJbkNoYXJzKClcblxuICAjIFByaXZhdGU6IERldGVybWluZXMgd2hldGhlciB7VGV4dEVkaXRvclByZXNlbnRlcn0gaXMgY3VycmVudGx5IGJhdGNoaW5nIGNoYW5nZXMuXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSwgYHRydWVgIGlmIGlzIGNvbGxlY3RpbmcgY2hhbmdlcywgYGZhbHNlYCBpZiBpcyBhcHBseWluZyB0aGVtLlxuICBpc0JhdGNoaW5nOiAtPlxuICAgIEB1cGRhdGluZyBpcyBmYWxzZVxuXG4gIGdldFByZU1lYXN1cmVtZW50U3RhdGU6IC0+XG4gICAgQHVwZGF0aW5nID0gdHJ1ZVxuXG4gICAgQHVwZGF0ZVZlcnRpY2FsRGltZW5zaW9ucygpXG4gICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuXG4gICAgQGNvbW1pdFBlbmRpbmdMb2dpY2FsU2Nyb2xsVG9wUG9zaXRpb24oKVxuICAgIEBjb21taXRQZW5kaW5nU2Nyb2xsVG9wUG9zaXRpb24oKVxuXG4gICAgQHVwZGF0ZVN0YXJ0Um93KClcbiAgICBAdXBkYXRlRW5kUm93KClcbiAgICBAdXBkYXRlQ29tbW9uR3V0dGVyU3RhdGUoKVxuICAgIEB1cGRhdGVSZWZsb3dTdGF0ZSgpXG5cbiAgICBAdXBkYXRlTGluZXMoKVxuXG4gICAgaWYgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zXG4gICAgICBAZmV0Y2hEZWNvcmF0aW9ucygpXG4gICAgICBAdXBkYXRlTGluZURlY29yYXRpb25zKClcbiAgICAgIEB1cGRhdGVCbG9ja0RlY29yYXRpb25zKClcblxuICAgIEB1cGRhdGVUaWxlc1N0YXRlKClcblxuICAgIEB1cGRhdGluZyA9IGZhbHNlXG4gICAgQHN0YXRlXG5cbiAgZ2V0UG9zdE1lYXN1cmVtZW50U3RhdGU6IC0+XG4gICAgQHVwZGF0aW5nID0gdHJ1ZVxuXG4gICAgQHVwZGF0ZUhvcml6b250YWxEaW1lbnNpb25zKClcbiAgICBAY29tbWl0UGVuZGluZ0xvZ2ljYWxTY3JvbGxMZWZ0UG9zaXRpb24oKVxuICAgIEBjb21taXRQZW5kaW5nU2Nyb2xsTGVmdFBvc2l0aW9uKClcbiAgICBAY2xlYXJQZW5kaW5nU2Nyb2xsUG9zaXRpb24oKVxuICAgIEB1cGRhdGVSb3dzUGVyUGFnZSgpXG5cbiAgICBAdXBkYXRlTGluZXMoKVxuXG4gICAgQHVwZGF0ZVZlcnRpY2FsU2Nyb2xsU3RhdGUoKVxuICAgIEB1cGRhdGVIb3Jpem9udGFsU2Nyb2xsU3RhdGUoKVxuICAgIEB1cGRhdGVTY3JvbGxiYXJzU3RhdGUoKVxuICAgIEB1cGRhdGVIaWRkZW5JbnB1dFN0YXRlKClcbiAgICBAdXBkYXRlQ29udGVudFN0YXRlKClcbiAgICBAdXBkYXRlRm9jdXNlZFN0YXRlKClcbiAgICBAdXBkYXRlSGVpZ2h0U3RhdGUoKVxuICAgIEB1cGRhdGVXaWR0aFN0YXRlKClcbiAgICBAdXBkYXRlSGlnaGxpZ2h0RGVjb3JhdGlvbnMoKSBpZiBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnNcbiAgICBAdXBkYXRlVGlsZXNTdGF0ZSgpXG4gICAgQHVwZGF0ZUN1cnNvcnNTdGF0ZSgpXG4gICAgQHVwZGF0ZU92ZXJsYXlzU3RhdGUoKVxuICAgIEB1cGRhdGVMaW5lTnVtYmVyR3V0dGVyU3RhdGUoKVxuICAgIEB1cGRhdGVHdXR0ZXJPcmRlclN0YXRlKClcbiAgICBAdXBkYXRlQ3VzdG9tR3V0dGVyRGVjb3JhdGlvblN0YXRlKClcbiAgICBAdXBkYXRpbmcgPSBmYWxzZVxuXG4gICAgQHJlc2V0VHJhY2tlZFVwZGF0ZXMoKVxuICAgIEBzdGF0ZVxuXG4gIHJlc2V0VHJhY2tlZFVwZGF0ZXM6IC0+XG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gZmFsc2VcblxuICBpbnZhbGlkYXRlU3RhdGU6IC0+XG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuXG4gIG9ic2VydmVNb2RlbDogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5kaXNwbGF5TGF5ZXIub25EaWRSZXNldCA9PlxuICAgICAgQHNwbGljZUJsb2NrRGVjb3JhdGlvbnNJblJhbmdlKDAsIEluZmluaXR5LCBJbmZpbml0eSlcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwuZGlzcGxheUxheWVyLm9uRGlkQ2hhbmdlU3luYyAoY2hhbmdlcykgPT5cbiAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlc1xuICAgICAgICBzdGFydFJvdyA9IGNoYW5nZS5zdGFydC5yb3dcbiAgICAgICAgZW5kUm93ID0gc3RhcnRSb3cgKyBjaGFuZ2Uub2xkRXh0ZW50LnJvd1xuICAgICAgICBAc3BsaWNlQmxvY2tEZWNvcmF0aW9uc0luUmFuZ2Uoc3RhcnRSb3csIGVuZFJvdywgY2hhbmdlLm5ld0V4dGVudC5yb3cgLSBjaGFuZ2Uub2xkRXh0ZW50LnJvdylcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRVcGRhdGVEZWNvcmF0aW9ucyA9PlxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZEFkZERlY29yYXRpb24oQGRpZEFkZEJsb2NrRGVjb3JhdGlvbi5iaW5kKHRoaXMpKVxuXG4gICAgZm9yIGRlY29yYXRpb24gaW4gQG1vZGVsLmdldERlY29yYXRpb25zKHt0eXBlOiAnYmxvY2snfSlcbiAgICAgIHRoaXMuZGlkQWRkQmxvY2tEZWNvcmF0aW9uKGRlY29yYXRpb24pXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZENoYW5nZUdyYW1tYXIoQGRpZENoYW5nZUdyYW1tYXIuYmluZCh0aGlzKSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBtb2RlbC5vbkRpZENoYW5nZVBsYWNlaG9sZGVyVGV4dChAZW1pdERpZFVwZGF0ZVN0YXRlLmJpbmQodGhpcykpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRDaGFuZ2VNaW5pID0+XG4gICAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQG1vZGVsLm9uRGlkQ2hhbmdlTGluZU51bWJlckd1dHRlclZpc2libGUoQGVtaXREaWRVcGRhdGVTdGF0ZS5iaW5kKHRoaXMpKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRBZGRDdXJzb3IoQGRpZEFkZEN1cnNvci5iaW5kKHRoaXMpKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQG1vZGVsLm9uRGlkUmVxdWVzdEF1dG9zY3JvbGwoQHJlcXVlc3RBdXRvc2Nyb2xsLmJpbmQodGhpcykpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRDaGFuZ2VGaXJzdFZpc2libGVTY3JlZW5Sb3coQGRpZENoYW5nZUZpcnN0VmlzaWJsZVNjcmVlblJvdy5iaW5kKHRoaXMpKVxuICAgIEBvYnNlcnZlQ3Vyc29yKGN1cnNvcikgZm9yIGN1cnNvciBpbiBAbW9kZWwuZ2V0Q3Vyc29ycygpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAbW9kZWwub25EaWRBZGRHdXR0ZXIoQGRpZEFkZEd1dHRlci5iaW5kKHRoaXMpKVxuICAgIHJldHVyblxuXG4gIGRpZENoYW5nZVNjcm9sbFBhc3RFbmQ6IC0+XG4gICAgQHVwZGF0ZVNjcm9sbEhlaWdodCgpXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZGlkQ2hhbmdlU2hvd0xpbmVOdW1iZXJzOiAtPlxuICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIGRpZENoYW5nZUdyYW1tYXI6IC0+XG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgYnVpbGRTdGF0ZTogLT5cbiAgICBAc3RhdGUgPVxuICAgICAgaG9yaXpvbnRhbFNjcm9sbGJhcjoge31cbiAgICAgIHZlcnRpY2FsU2Nyb2xsYmFyOiB7fVxuICAgICAgaGlkZGVuSW5wdXQ6IHt9XG4gICAgICBjb250ZW50OlxuICAgICAgICBzY3JvbGxpbmdWZXJ0aWNhbGx5OiBmYWxzZVxuICAgICAgICBjdXJzb3JzVmlzaWJsZTogZmFsc2VcbiAgICAgICAgdGlsZXM6IHt9XG4gICAgICAgIGhpZ2hsaWdodHM6IHt9XG4gICAgICAgIG92ZXJsYXlzOiB7fVxuICAgICAgICBjdXJzb3JzOiB7fVxuICAgICAgICBvZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zOiB7fVxuICAgICAgZ3V0dGVyczogW11cbiAgICAjIFNoYXJlZCBzdGF0ZSB0aGF0IGlzIGNvcGllZCBpbnRvIGBgQHN0YXRlLmd1dHRlcnNgLlxuICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMgPSB7fVxuICAgIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9ucyA9IHt9XG4gICAgQGxpbmVOdW1iZXJHdXR0ZXIgPVxuICAgICAgdGlsZXM6IHt9XG5cbiAgc2V0Q29udGludW91c1JlZmxvdzogKEBjb250aW51b3VzUmVmbG93KSAtPlxuICAgIGlmIEBjb250aW51b3VzUmVmbG93XG4gICAgICBAc3RhcnRSZWZsb3dpbmcoKVxuICAgIGVsc2VcbiAgICAgIEBzdG9wUmVmbG93aW5nKClcblxuICB1cGRhdGVSZWZsb3dTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5jb250aW51b3VzUmVmbG93ID0gQGNvbnRpbnVvdXNSZWZsb3dcbiAgICBAbGluZU51bWJlckd1dHRlci5jb250aW51b3VzUmVmbG93ID0gQGNvbnRpbnVvdXNSZWZsb3dcblxuICBzdGFydFJlZmxvd2luZzogLT5cbiAgICBAcmVmbG93aW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChAZW1pdERpZFVwZGF0ZVN0YXRlLmJpbmQodGhpcyksIEBtaW5pbXVtUmVmbG93SW50ZXJ2YWwpXG5cbiAgc3RvcFJlZmxvd2luZzogLT5cbiAgICBjbGVhckludGVydmFsKEByZWZsb3dpbmdJbnRlcnZhbClcbiAgICBAcmVmbG93aW5nSW50ZXJ2YWwgPSBudWxsXG5cbiAgdXBkYXRlRm9jdXNlZFN0YXRlOiAtPlxuICAgIEBzdGF0ZS5mb2N1c2VkID0gQGZvY3VzZWRcblxuICB1cGRhdGVIZWlnaHRTdGF0ZTogLT5cbiAgICBpZiBAYXV0b0hlaWdodFxuICAgICAgQHN0YXRlLmhlaWdodCA9IEBjb250ZW50SGVpZ2h0XG4gICAgZWxzZVxuICAgICAgQHN0YXRlLmhlaWdodCA9IG51bGxcblxuICB1cGRhdGVXaWR0aFN0YXRlOiAtPlxuICAgIGlmIEBtb2RlbC5nZXRBdXRvV2lkdGgoKVxuICAgICAgQHN0YXRlLndpZHRoID0gQHN0YXRlLmNvbnRlbnQud2lkdGggKyBAZ3V0dGVyV2lkdGhcbiAgICBlbHNlXG4gICAgICBAc3RhdGUud2lkdGggPSBudWxsXG5cbiAgdXBkYXRlVmVydGljYWxTY3JvbGxTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxIZWlnaHQgPSBAc2Nyb2xsSGVpZ2h0XG4gICAgQHNoYXJlZEd1dHRlclN0eWxlcy5zY3JvbGxIZWlnaHQgPSBAc2Nyb2xsSGVpZ2h0XG4gICAgQHN0YXRlLnZlcnRpY2FsU2Nyb2xsYmFyLnNjcm9sbEhlaWdodCA9IEBzY3JvbGxIZWlnaHRcblxuICAgIEBzdGF0ZS5jb250ZW50LnNjcm9sbFRvcCA9IEBzY3JvbGxUb3BcbiAgICBAc2hhcmVkR3V0dGVyU3R5bGVzLnNjcm9sbFRvcCA9IEBzY3JvbGxUb3BcbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIuc2Nyb2xsVG9wID0gQHNjcm9sbFRvcFxuXG4gIHVwZGF0ZUhvcml6b250YWxTY3JvbGxTdGF0ZTogLT5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxXaWR0aCA9IEBzY3JvbGxXaWR0aFxuICAgIEBzdGF0ZS5ob3Jpem9udGFsU2Nyb2xsYmFyLnNjcm9sbFdpZHRoID0gQHNjcm9sbFdpZHRoXG5cbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAc3RhdGUuaG9yaXpvbnRhbFNjcm9sbGJhci5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcblxuICB1cGRhdGVTY3JvbGxiYXJzU3RhdGU6IC0+XG4gICAgQHN0YXRlLmhvcml6b250YWxTY3JvbGxiYXIudmlzaWJsZSA9IEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0ID4gMFxuICAgIEBzdGF0ZS5ob3Jpem9udGFsU2Nyb2xsYmFyLmhlaWdodCA9IEBtZWFzdXJlZEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICBAc3RhdGUuaG9yaXpvbnRhbFNjcm9sbGJhci5yaWdodCA9IEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG5cbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIudmlzaWJsZSA9IEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID4gMFxuICAgIEBzdGF0ZS52ZXJ0aWNhbFNjcm9sbGJhci53aWR0aCA9IEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICBAc3RhdGUudmVydGljYWxTY3JvbGxiYXIuYm90dG9tID0gQGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcblxuICB1cGRhdGVIaWRkZW5JbnB1dFN0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgbGFzdEN1cnNvciA9IEBtb2RlbC5nZXRMYXN0Q3Vyc29yKClcblxuICAgIHt0b3AsIGxlZnQsIGhlaWdodCwgd2lkdGh9ID0gQHBpeGVsUmVjdEZvclNjcmVlblJhbmdlKGxhc3RDdXJzb3IuZ2V0U2NyZWVuUmFuZ2UoKSlcblxuICAgIGlmIEBmb2N1c2VkXG4gICAgICBAc3RhdGUuaGlkZGVuSW5wdXQudG9wID0gTWF0aC5tYXgoTWF0aC5taW4odG9wLCBAY2xpZW50SGVpZ2h0IC0gaGVpZ2h0KSwgMClcbiAgICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC5sZWZ0ID0gTWF0aC5tYXgoTWF0aC5taW4obGVmdCwgQGNsaWVudFdpZHRoIC0gd2lkdGgpLCAwKVxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC50b3AgPSAwXG4gICAgICBAc3RhdGUuaGlkZGVuSW5wdXQubGVmdCA9IDBcblxuICAgIEBzdGF0ZS5oaWRkZW5JbnB1dC5oZWlnaHQgPSBoZWlnaHRcbiAgICBAc3RhdGUuaGlkZGVuSW5wdXQud2lkdGggPSBNYXRoLm1heCh3aWR0aCwgMilcblxuICB1cGRhdGVDb250ZW50U3RhdGU6IC0+XG4gICAgaWYgQGJvdW5kaW5nQ2xpZW50UmVjdD9cbiAgICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMubWF4SGVpZ2h0ID0gQGJvdW5kaW5nQ2xpZW50UmVjdC5oZWlnaHRcbiAgICAgIEBzdGF0ZS5jb250ZW50Lm1heEhlaWdodCA9IEBib3VuZGluZ0NsaWVudFJlY3QuaGVpZ2h0XG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGggPyAwXG4gICAgY29udGVudEZyYW1lV2lkdGggPSBAY29udGVudEZyYW1lV2lkdGggPyAwXG4gICAgY29udGVudFdpZHRoID0gQGNvbnRlbnRXaWR0aCA/IDBcbiAgICBpZiBAbW9kZWwuZ2V0QXV0b1dpZHRoKClcbiAgICAgIEBzdGF0ZS5jb250ZW50LndpZHRoID0gY29udGVudFdpZHRoICsgdmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZS5jb250ZW50LndpZHRoID0gTWF0aC5tYXgoY29udGVudFdpZHRoICsgdmVydGljYWxTY3JvbGxiYXJXaWR0aCwgY29udGVudEZyYW1lV2lkdGgpXG4gICAgQHN0YXRlLmNvbnRlbnQuc2Nyb2xsV2lkdGggPSBAc2Nyb2xsV2lkdGhcbiAgICBAc3RhdGUuY29udGVudC5zY3JvbGxMZWZ0ID0gQHNjcm9sbExlZnRcbiAgICBAc3RhdGUuY29udGVudC5iYWNrZ3JvdW5kQ29sb3IgPSBpZiBAbW9kZWwuaXNNaW5pKCkgdGhlbiBudWxsIGVsc2UgQGJhY2tncm91bmRDb2xvclxuICAgIEBzdGF0ZS5jb250ZW50LnBsYWNlaG9sZGVyVGV4dCA9IGlmIEBtb2RlbC5pc0VtcHR5KCkgdGhlbiBAbW9kZWwuZ2V0UGxhY2Vob2xkZXJUZXh0KCkgZWxzZSBudWxsXG5cbiAgdGlsZUZvclJvdzogKHJvdykgLT5cbiAgICByb3cgLSAocm93ICUgQHRpbGVTaXplKVxuXG4gIGdldFN0YXJ0VGlsZVJvdzogLT5cbiAgICBAdGlsZUZvclJvdyhAc3RhcnRSb3cgPyAwKVxuXG4gIGdldEVuZFRpbGVSb3c6IC0+XG4gICAgQHRpbGVGb3JSb3coQGVuZFJvdyA/IDApXG5cbiAgZ2V0U2NyZWVuUm93c1RvUmVuZGVyOiAtPlxuICAgIHN0YXJ0Um93ID0gQGdldFN0YXJ0VGlsZVJvdygpXG4gICAgZW5kUm93ID0gQGdldEVuZFRpbGVSb3coKSArIEB0aWxlU2l6ZVxuXG4gICAgc2NyZWVuUm93cyA9IFtzdGFydFJvdy4uLmVuZFJvd11cbiAgICBsb25nZXN0U2NyZWVuUm93ID0gQG1vZGVsLmdldEFwcHJveGltYXRlTG9uZ2VzdFNjcmVlblJvdygpXG4gICAgaWYgbG9uZ2VzdFNjcmVlblJvdz9cbiAgICAgIHNjcmVlblJvd3MucHVzaChsb25nZXN0U2NyZWVuUm93KVxuICAgIGlmIEBzY3JlZW5Sb3dzVG9NZWFzdXJlP1xuICAgICAgc2NyZWVuUm93cy5wdXNoKEBzY3JlZW5Sb3dzVG9NZWFzdXJlLi4uKVxuXG4gICAgc2NyZWVuUm93cyA9IHNjcmVlblJvd3MuZmlsdGVyIChyb3cpIC0+IHJvdyA+PSAwXG4gICAgc2NyZWVuUm93cy5zb3J0IChhLCBiKSAtPiBhIC0gYlxuICAgIF8udW5pcShzY3JlZW5Sb3dzLCB0cnVlKVxuXG4gIGdldFNjcmVlblJhbmdlc1RvUmVuZGVyOiAtPlxuICAgIHNjcmVlblJvd3MgPSBAZ2V0U2NyZWVuUm93c1RvUmVuZGVyKClcbiAgICBzY3JlZW5Sb3dzLnB1c2goSW5maW5pdHkpICMgbWFrZXMgdGhlIGxvb3AgYmVsb3cgaW5jbHVzaXZlXG5cbiAgICBzdGFydFJvdyA9IHNjcmVlblJvd3NbMF1cbiAgICBlbmRSb3cgPSBzdGFydFJvdyAtIDFcbiAgICBzY3JlZW5SYW5nZXMgPSBbXVxuICAgIGZvciByb3cgaW4gc2NyZWVuUm93c1xuICAgICAgaWYgcm93IGlzIGVuZFJvdyArIDFcbiAgICAgICAgZW5kUm93KytcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyZWVuUmFuZ2VzLnB1c2goW3N0YXJ0Um93LCBlbmRSb3ddKVxuICAgICAgICBzdGFydFJvdyA9IGVuZFJvdyA9IHJvd1xuXG4gICAgc2NyZWVuUmFuZ2VzXG5cbiAgc2V0U2NyZWVuUm93c1RvTWVhc3VyZTogKHNjcmVlblJvd3MpIC0+XG4gICAgcmV0dXJuIGlmIG5vdCBzY3JlZW5Sb3dzPyBvciBzY3JlZW5Sb3dzLmxlbmd0aCBpcyAwXG5cbiAgICBAc2NyZWVuUm93c1RvTWVhc3VyZSA9IHNjcmVlblJvd3NcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG5cbiAgY2xlYXJTY3JlZW5Sb3dzVG9NZWFzdXJlOiAtPlxuICAgIEBzY3JlZW5Sb3dzVG9NZWFzdXJlID0gW11cblxuICB1cGRhdGVUaWxlc1N0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0YXJ0Um93PyBhbmQgQGVuZFJvdz8gYW5kIEBsaW5lSGVpZ2h0P1xuXG4gICAgc2NyZWVuUm93cyA9IEBnZXRTY3JlZW5Sb3dzVG9SZW5kZXIoKVxuICAgIHZpc2libGVUaWxlcyA9IHt9XG4gICAgc3RhcnRSb3cgPSBzY3JlZW5Sb3dzWzBdXG4gICAgZW5kUm93ID0gc2NyZWVuUm93c1tzY3JlZW5Sb3dzLmxlbmd0aCAtIDFdXG4gICAgc2NyZWVuUm93SW5kZXggPSBzY3JlZW5Sb3dzLmxlbmd0aCAtIDFcbiAgICB6SW5kZXggPSAwXG5cbiAgICBmb3IgdGlsZVN0YXJ0Um93IGluIFtAdGlsZUZvclJvdyhlbmRSb3cpLi5AdGlsZUZvclJvdyhzdGFydFJvdyldIGJ5IC1AdGlsZVNpemVcbiAgICAgIHRpbGVFbmRSb3cgPSB0aWxlU3RhcnRSb3cgKyBAdGlsZVNpemVcbiAgICAgIHJvd3NXaXRoaW5UaWxlID0gW11cblxuICAgICAgd2hpbGUgc2NyZWVuUm93SW5kZXggPj0gMFxuICAgICAgICBjdXJyZW50U2NyZWVuUm93ID0gc2NyZWVuUm93c1tzY3JlZW5Sb3dJbmRleF1cbiAgICAgICAgYnJlYWsgaWYgY3VycmVudFNjcmVlblJvdyA8IHRpbGVTdGFydFJvd1xuICAgICAgICByb3dzV2l0aGluVGlsZS5wdXNoKGN1cnJlbnRTY3JlZW5Sb3cpXG4gICAgICAgIHNjcmVlblJvd0luZGV4LS1cblxuICAgICAgY29udGludWUgaWYgcm93c1dpdGhpblRpbGUubGVuZ3RoIGlzIDBcblxuICAgICAgdG9wID0gTWF0aC5yb3VuZChAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25CZWZvcmVCbG9ja3NGb3JSb3codGlsZVN0YXJ0Um93KSlcbiAgICAgIGJvdHRvbSA9IE1hdGgucm91bmQoQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQmVmb3JlQmxvY2tzRm9yUm93KHRpbGVFbmRSb3cpKVxuICAgICAgaGVpZ2h0ID0gYm90dG9tIC0gdG9wXG5cbiAgICAgIHRpbGUgPSBAc3RhdGUuY29udGVudC50aWxlc1t0aWxlU3RhcnRSb3ddID89IHt9XG4gICAgICB0aWxlLnRvcCA9IHRvcCAtIEBzY3JvbGxUb3BcbiAgICAgIHRpbGUubGVmdCA9IC1Ac2Nyb2xsTGVmdFxuICAgICAgdGlsZS5oZWlnaHQgPSBoZWlnaHRcbiAgICAgIHRpbGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICAgdGlsZS56SW5kZXggPSB6SW5kZXhcbiAgICAgIHRpbGUuaGlnaGxpZ2h0cyA/PSB7fVxuXG4gICAgICBndXR0ZXJUaWxlID0gQGxpbmVOdW1iZXJHdXR0ZXIudGlsZXNbdGlsZVN0YXJ0Um93XSA/PSB7fVxuICAgICAgZ3V0dGVyVGlsZS50b3AgPSB0b3AgLSBAc2Nyb2xsVG9wXG4gICAgICBndXR0ZXJUaWxlLmhlaWdodCA9IGhlaWdodFxuICAgICAgZ3V0dGVyVGlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgICBndXR0ZXJUaWxlLnpJbmRleCA9IHpJbmRleFxuXG4gICAgICBAdXBkYXRlTGluZXNTdGF0ZSh0aWxlLCByb3dzV2l0aGluVGlsZSlcbiAgICAgIEB1cGRhdGVMaW5lTnVtYmVyc1N0YXRlKGd1dHRlclRpbGUsIHJvd3NXaXRoaW5UaWxlKVxuXG4gICAgICB2aXNpYmxlVGlsZXNbdGlsZVN0YXJ0Um93XSA9IHRydWVcbiAgICAgIHpJbmRleCsrXG5cbiAgICBtb3VzZVdoZWVsVGlsZUlkID0gQHRpbGVGb3JSb3coQG1vdXNlV2hlZWxTY3JlZW5Sb3cpIGlmIEBtb3VzZVdoZWVsU2NyZWVuUm93P1xuXG4gICAgZm9yIGlkLCB0aWxlIG9mIEBzdGF0ZS5jb250ZW50LnRpbGVzXG4gICAgICBjb250aW51ZSBpZiB2aXNpYmxlVGlsZXMuaGFzT3duUHJvcGVydHkoaWQpXG5cbiAgICAgIGlmIE51bWJlcihpZCkgaXMgbW91c2VXaGVlbFRpbGVJZFxuICAgICAgICBAc3RhdGUuY29udGVudC50aWxlc1tpZF0uZGlzcGxheSA9IFwibm9uZVwiXG4gICAgICAgIEBsaW5lTnVtYmVyR3V0dGVyLnRpbGVzW2lkXS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGVsZXRlIEBzdGF0ZS5jb250ZW50LnRpbGVzW2lkXVxuICAgICAgICBkZWxldGUgQGxpbmVOdW1iZXJHdXR0ZXIudGlsZXNbaWRdXG5cbiAgdXBkYXRlTGluZXNTdGF0ZTogKHRpbGVTdGF0ZSwgc2NyZWVuUm93cykgLT5cbiAgICB0aWxlU3RhdGUubGluZXMgPz0ge31cbiAgICB2aXNpYmxlTGluZUlkcyA9IHt9XG4gICAgZm9yIHNjcmVlblJvdyBpbiBzY3JlZW5Sb3dzXG4gICAgICBsaW5lID0gQGxpbmVzQnlTY3JlZW5Sb3cuZ2V0KHNjcmVlblJvdylcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBsaW5lP1xuXG4gICAgICB2aXNpYmxlTGluZUlkc1tsaW5lLmlkXSA9IHRydWVcbiAgICAgIHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnMgPSBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XSA/IHt9XG4gICAgICBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zID0gQGZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10gPyB7fVxuICAgICAgaWYgdGlsZVN0YXRlLmxpbmVzLmhhc093blByb3BlcnR5KGxpbmUuaWQpXG4gICAgICAgIGxpbmVTdGF0ZSA9IHRpbGVTdGF0ZS5saW5lc1tsaW5lLmlkXVxuICAgICAgICBsaW5lU3RhdGUuc2NyZWVuUm93ID0gc2NyZWVuUm93XG4gICAgICAgIGxpbmVTdGF0ZS5kZWNvcmF0aW9uQ2xhc3NlcyA9IEBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgICBsaW5lU3RhdGUucHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9ucyA9IHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgbGluZVN0YXRlLmZvbGxvd2luZ0Jsb2NrRGVjb3JhdGlvbnMgPSBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zXG4gICAgICBlbHNlXG4gICAgICAgIHRpbGVTdGF0ZS5saW5lc1tsaW5lLmlkXSA9XG4gICAgICAgICAgc2NyZWVuUm93OiBzY3JlZW5Sb3dcbiAgICAgICAgICBsaW5lVGV4dDogbGluZS5saW5lVGV4dFxuICAgICAgICAgIHRhZ0NvZGVzOiBsaW5lLnRhZ0NvZGVzXG4gICAgICAgICAgZGVjb3JhdGlvbkNsYXNzZXM6IEBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgICAgIHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnM6IHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNcbiAgICAgICAgICBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zOiBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zXG5cbiAgICBmb3IgaWQsIGxpbmUgb2YgdGlsZVN0YXRlLmxpbmVzXG4gICAgICBkZWxldGUgdGlsZVN0YXRlLmxpbmVzW2lkXSB1bmxlc3MgdmlzaWJsZUxpbmVJZHMuaGFzT3duUHJvcGVydHkoaWQpXG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlQ3Vyc29yc1N0YXRlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0YXJ0Um93PyBhbmQgQGVuZFJvdz8gYW5kIEBoYXNQaXhlbFJlY3RSZXF1aXJlbWVudHMoKSBhbmQgQGJhc2VDaGFyYWN0ZXJXaWR0aD9cblxuICAgIEBzdGF0ZS5jb250ZW50LmN1cnNvcnMgPSB7fVxuICAgIGZvciBjdXJzb3IgaW4gQG1vZGVsLmN1cnNvcnNGb3JTY3JlZW5Sb3dSYW5nZShAc3RhcnRSb3csIEBlbmRSb3cgLSAxKSB3aGVuIGN1cnNvci5pc1Zpc2libGUoKVxuICAgICAgcGl4ZWxSZWN0ID0gQHBpeGVsUmVjdEZvclNjcmVlblJhbmdlKGN1cnNvci5nZXRTY3JlZW5SYW5nZSgpKVxuICAgICAgcGl4ZWxSZWN0LndpZHRoID0gTWF0aC5yb3VuZChAYmFzZUNoYXJhY3RlcldpZHRoKSBpZiBwaXhlbFJlY3Qud2lkdGggaXMgMFxuICAgICAgQHN0YXRlLmNvbnRlbnQuY3Vyc29yc1tjdXJzb3IuaWRdID0gcGl4ZWxSZWN0XG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlT3ZlcmxheXNTdGF0ZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBoYXNPdmVybGF5UG9zaXRpb25SZXF1aXJlbWVudHMoKVxuXG4gICAgdmlzaWJsZURlY29yYXRpb25JZHMgPSB7fVxuXG4gICAgZm9yIGRlY29yYXRpb24gaW4gQG1vZGVsLmdldE92ZXJsYXlEZWNvcmF0aW9ucygpXG4gICAgICBjb250aW51ZSB1bmxlc3MgZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5pc1ZhbGlkKClcblxuICAgICAge2l0ZW0sIHBvc2l0aW9uLCBjbGFzczoga2xhc3N9ID0gZGVjb3JhdGlvbi5nZXRQcm9wZXJ0aWVzKClcbiAgICAgIGlmIHBvc2l0aW9uIGlzICd0YWlsJ1xuICAgICAgICBzY3JlZW5Qb3NpdGlvbiA9IGRlY29yYXRpb24uZ2V0TWFya2VyKCkuZ2V0VGFpbFNjcmVlblBvc2l0aW9uKClcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyZWVuUG9zaXRpb24gPSBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgICAgIHBpeGVsUG9zaXRpb24gPSBAcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKVxuXG4gICAgICAjIEZpeGVkIHBvc2l0aW9uaW5nLlxuICAgICAgdG9wID0gQGJvdW5kaW5nQ2xpZW50UmVjdC50b3AgKyBwaXhlbFBvc2l0aW9uLnRvcCArIEBsaW5lSGVpZ2h0XG4gICAgICBsZWZ0ID0gQGJvdW5kaW5nQ2xpZW50UmVjdC5sZWZ0ICsgcGl4ZWxQb3NpdGlvbi5sZWZ0ICsgQGd1dHRlcldpZHRoXG5cbiAgICAgIGlmIG92ZXJsYXlEaW1lbnNpb25zID0gQG92ZXJsYXlEaW1lbnNpb25zW2RlY29yYXRpb24uaWRdXG4gICAgICAgIHtpdGVtV2lkdGgsIGl0ZW1IZWlnaHQsIGNvbnRlbnRNYXJnaW59ID0gb3ZlcmxheURpbWVuc2lvbnNcblxuICAgICAgICByaWdodERpZmYgPSBsZWZ0ICsgaXRlbVdpZHRoICsgY29udGVudE1hcmdpbiAtIEB3aW5kb3dXaWR0aFxuICAgICAgICBsZWZ0IC09IHJpZ2h0RGlmZiBpZiByaWdodERpZmYgPiAwXG5cbiAgICAgICAgbGVmdERpZmYgPSBsZWZ0ICsgY29udGVudE1hcmdpblxuICAgICAgICBsZWZ0IC09IGxlZnREaWZmIGlmIGxlZnREaWZmIDwgMFxuXG4gICAgICAgIGlmIHRvcCArIGl0ZW1IZWlnaHQgPiBAd2luZG93SGVpZ2h0IGFuZFxuICAgICAgICAgICB0b3AgLSAoaXRlbUhlaWdodCArIEBsaW5lSGVpZ2h0KSA+PSAwXG4gICAgICAgICAgdG9wIC09IGl0ZW1IZWlnaHQgKyBAbGluZUhlaWdodFxuXG4gICAgICBwaXhlbFBvc2l0aW9uLnRvcCA9IHRvcFxuICAgICAgcGl4ZWxQb3NpdGlvbi5sZWZ0ID0gbGVmdFxuXG4gICAgICBvdmVybGF5U3RhdGUgPSBAc3RhdGUuY29udGVudC5vdmVybGF5c1tkZWNvcmF0aW9uLmlkXSA/PSB7aXRlbX1cbiAgICAgIG92ZXJsYXlTdGF0ZS5waXhlbFBvc2l0aW9uID0gcGl4ZWxQb3NpdGlvblxuICAgICAgb3ZlcmxheVN0YXRlLmNsYXNzID0ga2xhc3MgaWYga2xhc3M/XG4gICAgICB2aXNpYmxlRGVjb3JhdGlvbklkc1tkZWNvcmF0aW9uLmlkXSA9IHRydWVcblxuICAgIGZvciBpZCBvZiBAc3RhdGUuY29udGVudC5vdmVybGF5c1xuICAgICAgZGVsZXRlIEBzdGF0ZS5jb250ZW50Lm92ZXJsYXlzW2lkXSB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25JZHNbaWRdXG5cbiAgICBmb3IgaWQgb2YgQG92ZXJsYXlEaW1lbnNpb25zXG4gICAgICBkZWxldGUgQG92ZXJsYXlEaW1lbnNpb25zW2lkXSB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25JZHNbaWRdXG5cbiAgICByZXR1cm5cblxuICB1cGRhdGVMaW5lTnVtYmVyR3V0dGVyU3RhdGU6IC0+XG4gICAgQGxpbmVOdW1iZXJHdXR0ZXIubWF4TGluZU51bWJlckRpZ2l0cyA9IEBtb2RlbC5nZXRMaW5lQ291bnQoKS50b1N0cmluZygpLmxlbmd0aFxuXG4gIHVwZGF0ZUNvbW1vbkd1dHRlclN0YXRlOiAtPlxuICAgIEBzaGFyZWRHdXR0ZXJTdHlsZXMuYmFja2dyb3VuZENvbG9yID0gaWYgQGd1dHRlckJhY2tncm91bmRDb2xvciBpc250IFwicmdiYSgwLCAwLCAwLCAwKVwiXG4gICAgICBAZ3V0dGVyQmFja2dyb3VuZENvbG9yXG4gICAgZWxzZVxuICAgICAgQGJhY2tncm91bmRDb2xvclxuXG4gIGRpZEFkZEd1dHRlcjogKGd1dHRlcikgLT5cbiAgICBndXR0ZXJEaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgZ3V0dGVyRGlzcG9zYWJsZXMuYWRkIGd1dHRlci5vbkRpZENoYW5nZVZpc2libGUgPT4gQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG4gICAgZ3V0dGVyRGlzcG9zYWJsZXMuYWRkIGd1dHRlci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBkaXNwb3NhYmxlcy5yZW1vdmUoZ3V0dGVyRGlzcG9zYWJsZXMpXG4gICAgICBndXR0ZXJEaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuICAgICAgIyBJdCBpcyBub3QgbmVjZXNzYXJ5IHRvIEB1cGRhdGVDdXN0b21HdXR0ZXJEZWNvcmF0aW9uU3RhdGUgaGVyZS5cbiAgICAgICMgVGhlIGRlc3Ryb3llZCBndXR0ZXIgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGxpc3Qgb2YgZ3V0dGVycyBpbiBAc3RhdGUsXG4gICAgICAjIGFuZCB0aHVzIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gICAgQGRpc3Bvc2FibGVzLmFkZChndXR0ZXJEaXNwb3NhYmxlcylcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICB1cGRhdGVHdXR0ZXJPcmRlclN0YXRlOiAtPlxuICAgIEBzdGF0ZS5ndXR0ZXJzID0gW11cbiAgICBpZiBAbW9kZWwuaXNNaW5pKClcbiAgICAgIHJldHVyblxuICAgIGZvciBndXR0ZXIgaW4gQG1vZGVsLmdldEd1dHRlcnMoKVxuICAgICAgaXNWaXNpYmxlID0gQGd1dHRlcklzVmlzaWJsZShndXR0ZXIpXG4gICAgICBpZiBndXR0ZXIubmFtZSBpcyAnbGluZS1udW1iZXInXG4gICAgICAgIGNvbnRlbnQgPSBAbGluZU51bWJlckd1dHRlclxuICAgICAgZWxzZVxuICAgICAgICBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyLm5hbWVdID89IHt9XG4gICAgICAgIGNvbnRlbnQgPSBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyLm5hbWVdXG4gICAgICBAc3RhdGUuZ3V0dGVycy5wdXNoKHtcbiAgICAgICAgZ3V0dGVyLFxuICAgICAgICB2aXNpYmxlOiBpc1Zpc2libGUsXG4gICAgICAgIHN0eWxlczogQHNoYXJlZEd1dHRlclN0eWxlcyxcbiAgICAgICAgY29udGVudCxcbiAgICAgIH0pXG5cbiAgIyBVcGRhdGVzIHRoZSBkZWNvcmF0aW9uIHN0YXRlIGZvciB0aGUgZ3V0dGVyIHdpdGggdGhlIGdpdmVuIGd1dHRlck5hbWUuXG4gICMgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zIGlzIGFuIHtPYmplY3R9LCB3aXRoIHRoZSBmb3JtOlxuICAjICAgKiBndXR0ZXJOYW1lIDoge1xuICAjICAgICBkZWNvcmF0aW9uLmlkIDoge1xuICAjICAgICAgIHRvcDogIyBvZiBwaXhlbHMgZnJvbSB0b3BcbiAgIyAgICAgICBoZWlnaHQ6ICMgb2YgcGl4ZWxzIGhlaWdodCBvZiB0aGlzIGRlY29yYXRpb25cbiAgIyAgICAgICBpdGVtIChvcHRpb25hbCk6IEhUTUxFbGVtZW50XG4gICMgICAgICAgY2xhc3MgKG9wdGlvbmFsKToge1N0cmluZ30gY2xhc3NcbiAgIyAgICAgfVxuICAjICAgfVxuICB1cGRhdGVDdXN0b21HdXR0ZXJEZWNvcmF0aW9uU3RhdGU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAc3RhcnRSb3c/IGFuZCBAZW5kUm93PyBhbmQgQGxpbmVIZWlnaHQ/XG5cbiAgICBpZiBAbW9kZWwuaXNNaW5pKClcbiAgICAgICMgTWluaSBlZGl0b3JzIGhhdmUgbm8gZ3V0dGVyIGRlY29yYXRpb25zLlxuICAgICAgIyBXZSBjbGVhciBpbnN0ZWFkIG9mIHJlYXNzaWduaW5nIHRvIHByZXNlcnZlIHRoZSByZWZlcmVuY2UuXG4gICAgICBAY2xlYXJBbGxDdXN0b21HdXR0ZXJEZWNvcmF0aW9ucygpXG5cbiAgICBmb3IgZ3V0dGVyIGluIEBtb2RlbC5nZXRHdXR0ZXJzKClcbiAgICAgIGd1dHRlck5hbWUgPSBndXR0ZXIubmFtZVxuICAgICAgZ3V0dGVyRGVjb3JhdGlvbnMgPSBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyTmFtZV1cbiAgICAgIGlmIGd1dHRlckRlY29yYXRpb25zXG4gICAgICAgICMgQ2xlYXIgdGhlIGd1dHRlciBkZWNvcmF0aW9uczsgdGhleSBhcmUgcmVidWlsdC5cbiAgICAgICAgIyBXZSBjbGVhciBpbnN0ZWFkIG9mIHJlYXNzaWduaW5nIHRvIHByZXNlcnZlIHRoZSByZWZlcmVuY2UuXG4gICAgICAgIEBjbGVhckRlY29yYXRpb25zRm9yQ3VzdG9tR3V0dGVyTmFtZShndXR0ZXJOYW1lKVxuICAgICAgZWxzZVxuICAgICAgICBAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnNbZ3V0dGVyTmFtZV0gPSB7fVxuXG4gICAgICBjb250aW51ZSB1bmxlc3MgQGd1dHRlcklzVmlzaWJsZShndXR0ZXIpXG4gICAgICBmb3IgZGVjb3JhdGlvbklkLCB7cHJvcGVydGllcywgc2NyZWVuUmFuZ2V9IG9mIEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc0J5R3V0dGVyTmFtZVtndXR0ZXJOYW1lXVxuICAgICAgICB0b3AgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5SYW5nZS5zdGFydC5yb3cpXG4gICAgICAgIGJvdHRvbSA9IEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkJlZm9yZUJsb2Nrc0ZvclJvdyhzY3JlZW5SYW5nZS5lbmQucm93ICsgMSlcbiAgICAgICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zW2d1dHRlck5hbWVdW2RlY29yYXRpb25JZF0gPVxuICAgICAgICAgIHRvcDogdG9wXG4gICAgICAgICAgaGVpZ2h0OiBib3R0b20gLSB0b3BcbiAgICAgICAgICBpdGVtOiBwcm9wZXJ0aWVzLml0ZW1cbiAgICAgICAgICBjbGFzczogcHJvcGVydGllcy5jbGFzc1xuXG4gIGNsZWFyQWxsQ3VzdG9tR3V0dGVyRGVjb3JhdGlvbnM6IC0+XG4gICAgYWxsR3V0dGVyTmFtZXMgPSBPYmplY3Qua2V5cyhAY3VzdG9tR3V0dGVyRGVjb3JhdGlvbnMpXG4gICAgZm9yIGd1dHRlck5hbWUgaW4gYWxsR3V0dGVyTmFtZXNcbiAgICAgIEBjbGVhckRlY29yYXRpb25zRm9yQ3VzdG9tR3V0dGVyTmFtZShndXR0ZXJOYW1lKVxuXG4gIGNsZWFyRGVjb3JhdGlvbnNGb3JDdXN0b21HdXR0ZXJOYW1lOiAoZ3V0dGVyTmFtZSkgLT5cbiAgICBndXR0ZXJEZWNvcmF0aW9ucyA9IEBjdXN0b21HdXR0ZXJEZWNvcmF0aW9uc1tndXR0ZXJOYW1lXVxuICAgIGlmIGd1dHRlckRlY29yYXRpb25zXG4gICAgICBhbGxEZWNvcmF0aW9uSWRzID0gT2JqZWN0LmtleXMoZ3V0dGVyRGVjb3JhdGlvbnMpXG4gICAgICBmb3IgZGVjb3JhdGlvbklkIGluIGFsbERlY29yYXRpb25JZHNcbiAgICAgICAgZGVsZXRlIGd1dHRlckRlY29yYXRpb25zW2RlY29yYXRpb25JZF1cblxuICBndXR0ZXJJc1Zpc2libGU6IChndXR0ZXJNb2RlbCkgLT5cbiAgICBpc1Zpc2libGUgPSBndXR0ZXJNb2RlbC5pc1Zpc2libGUoKVxuICAgIGlmIGd1dHRlck1vZGVsLm5hbWUgaXMgJ2xpbmUtbnVtYmVyJ1xuICAgICAgaXNWaXNpYmxlID0gaXNWaXNpYmxlIGFuZCBAbW9kZWwuZG9lc1Nob3dMaW5lTnVtYmVycygpXG4gICAgaXNWaXNpYmxlXG5cbiAgdXBkYXRlTGluZU51bWJlcnNTdGF0ZTogKHRpbGVTdGF0ZSwgc2NyZWVuUm93cykgLT5cbiAgICB0aWxlU3RhdGUubGluZU51bWJlcnMgPz0ge31cbiAgICB2aXNpYmxlTGluZU51bWJlcklkcyA9IHt9XG5cbiAgICBmb3Igc2NyZWVuUm93IGluIHNjcmVlblJvd3Mgd2hlbiBAaXNSb3dSZW5kZXJlZChzY3JlZW5Sb3cpXG4gICAgICBsaW5lID0gQGxpbmVzQnlTY3JlZW5Sb3cuZ2V0KHNjcmVlblJvdylcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBsaW5lP1xuICAgICAgbGluZUlkID0gbGluZS5pZFxuICAgICAge2J1ZmZlclJvdywgc29mdFdyYXBwZWRBdFN0YXJ0OiBzb2Z0V3JhcHBlZH0gPSBAZGlzcGxheUxheWVyLnNvZnRXcmFwRGVzY3JpcHRvckZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG4gICAgICBmb2xkYWJsZSA9IG5vdCBzb2Z0V3JhcHBlZCBhbmQgQG1vZGVsLmlzRm9sZGFibGVBdEJ1ZmZlclJvdyhidWZmZXJSb3cpXG4gICAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IEBsaW5lTnVtYmVyRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3coc2NyZWVuUm93KVxuICAgICAgYmxvY2tEZWNvcmF0aW9uc0JlZm9yZUN1cnJlbnRTY3JlZW5Sb3dIZWlnaHQgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cpIC0gQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQmVmb3JlQmxvY2tzRm9yUm93KHNjcmVlblJvdylcbiAgICAgIGJsb2NrRGVjb3JhdGlvbnNIZWlnaHQgPSBibG9ja0RlY29yYXRpb25zQmVmb3JlQ3VycmVudFNjcmVlblJvd0hlaWdodFxuICAgICAgaWYgc2NyZWVuUm93ICUgQHRpbGVTaXplIGlzbnQgMFxuICAgICAgICBibG9ja0RlY29yYXRpb25zQWZ0ZXJQcmV2aW91c1NjcmVlblJvd0hlaWdodCA9IEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkJlZm9yZUJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cpIC0gQGxpbmVIZWlnaHQgLSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cgLSAxKVxuICAgICAgICBibG9ja0RlY29yYXRpb25zSGVpZ2h0ICs9IGJsb2NrRGVjb3JhdGlvbnNBZnRlclByZXZpb3VzU2NyZWVuUm93SGVpZ2h0XG5cbiAgICAgIHRpbGVTdGF0ZS5saW5lTnVtYmVyc1tsaW5lSWRdID0ge3NjcmVlblJvdywgYnVmZmVyUm93LCBzb2Z0V3JhcHBlZCwgZGVjb3JhdGlvbkNsYXNzZXMsIGZvbGRhYmxlLCBibG9ja0RlY29yYXRpb25zSGVpZ2h0fVxuICAgICAgdmlzaWJsZUxpbmVOdW1iZXJJZHNbbGluZUlkXSA9IHRydWVcblxuICAgIGZvciBpZCBvZiB0aWxlU3RhdGUubGluZU51bWJlcnNcbiAgICAgIGRlbGV0ZSB0aWxlU3RhdGUubGluZU51bWJlcnNbaWRdIHVubGVzcyB2aXNpYmxlTGluZU51bWJlcklkc1tpZF1cblxuICAgIHJldHVyblxuXG4gIHVwZGF0ZVN0YXJ0Um93OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHNjcm9sbFRvcD8gYW5kIEBsaW5lSGVpZ2h0P1xuXG4gICAgQHN0YXJ0Um93ID0gTWF0aC5tYXgoMCwgQGxpbmVUb3BJbmRleC5yb3dGb3JQaXhlbFBvc2l0aW9uKEBzY3JvbGxUb3ApKVxuXG4gIHVwZGF0ZUVuZFJvdzogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBzY3JvbGxUb3A/IGFuZCBAbGluZUhlaWdodD8gYW5kIEBoZWlnaHQ/XG5cbiAgICBAZW5kUm93ID0gTWF0aC5taW4oXG4gICAgICBAbW9kZWwuZ2V0QXBwcm94aW1hdGVTY3JlZW5MaW5lQ291bnQoKSxcbiAgICAgIEBsaW5lVG9wSW5kZXgucm93Rm9yUGl4ZWxQb3NpdGlvbihAc2Nyb2xsVG9wICsgQGhlaWdodCArIEBsaW5lSGVpZ2h0IC0gMSkgKyAxXG4gICAgKVxuXG4gIHVwZGF0ZVJvd3NQZXJQYWdlOiAtPlxuICAgIHJvd3NQZXJQYWdlID0gTWF0aC5mbG9vcihAZ2V0Q2xpZW50SGVpZ2h0KCkgLyBAbGluZUhlaWdodClcbiAgICBpZiByb3dzUGVyUGFnZSBpc250IEByb3dzUGVyUGFnZVxuICAgICAgQHJvd3NQZXJQYWdlID0gcm93c1BlclBhZ2VcbiAgICAgIEBtb2RlbC5zZXRSb3dzUGVyUGFnZShAcm93c1BlclBhZ2UpXG5cbiAgdXBkYXRlU2Nyb2xsV2lkdGg6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAY29udGVudFdpZHRoPyBhbmQgQGNsaWVudFdpZHRoP1xuXG4gICAgc2Nyb2xsV2lkdGggPSBNYXRoLm1heChAY29udGVudFdpZHRoLCBAY2xpZW50V2lkdGgpXG4gICAgdW5sZXNzIEBzY3JvbGxXaWR0aCBpcyBzY3JvbGxXaWR0aFxuICAgICAgQHNjcm9sbFdpZHRoID0gc2Nyb2xsV2lkdGhcbiAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KEBzY3JvbGxMZWZ0KVxuXG4gIHVwZGF0ZVNjcm9sbEhlaWdodDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBjb250ZW50SGVpZ2h0PyBhbmQgQGNsaWVudEhlaWdodD9cblxuICAgIGNvbnRlbnRIZWlnaHQgPSBAY29udGVudEhlaWdodFxuICAgIGlmIEBtb2RlbC5nZXRTY3JvbGxQYXN0RW5kKClcbiAgICAgIGV4dHJhU2Nyb2xsSGVpZ2h0ID0gQGNsaWVudEhlaWdodCAtIChAbGluZUhlaWdodCAqIDMpXG4gICAgICBjb250ZW50SGVpZ2h0ICs9IGV4dHJhU2Nyb2xsSGVpZ2h0IGlmIGV4dHJhU2Nyb2xsSGVpZ2h0ID4gMFxuICAgIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4KGNvbnRlbnRIZWlnaHQsIEBoZWlnaHQpXG5cbiAgICB1bmxlc3MgQHNjcm9sbEhlaWdodCBpcyBzY3JvbGxIZWlnaHRcbiAgICAgIEBzY3JvbGxIZWlnaHQgPSBzY3JvbGxIZWlnaHRcbiAgICAgIEB1cGRhdGVTY3JvbGxUb3AoQHNjcm9sbFRvcClcblxuICB1cGRhdGVWZXJ0aWNhbERpbWVuc2lvbnM6IC0+XG4gICAgaWYgQGxpbmVIZWlnaHQ/XG4gICAgICBvbGRDb250ZW50SGVpZ2h0ID0gQGNvbnRlbnRIZWlnaHRcbiAgICAgIEBjb250ZW50SGVpZ2h0ID0gTWF0aC5yb3VuZChAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhAbW9kZWwuZ2V0QXBwcm94aW1hdGVTY3JlZW5MaW5lQ291bnQoKSkpXG5cbiAgICBpZiBAY29udGVudEhlaWdodCBpc250IG9sZENvbnRlbnRIZWlnaHRcbiAgICAgIEB1cGRhdGVIZWlnaHQoKVxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZVNjcm9sbEhlaWdodCgpXG5cbiAgdXBkYXRlSG9yaXpvbnRhbERpbWVuc2lvbnM6IC0+XG4gICAgaWYgQGJhc2VDaGFyYWN0ZXJXaWR0aD9cbiAgICAgIG9sZENvbnRlbnRXaWR0aCA9IEBjb250ZW50V2lkdGhcbiAgICAgIHJpZ2h0bW9zdFBvc2l0aW9uID0gQG1vZGVsLmdldEFwcHJveGltYXRlUmlnaHRtb3N0U2NyZWVuUG9zaXRpb24oKVxuICAgICAgQGNvbnRlbnRXaWR0aCA9IEBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24ocmlnaHRtb3N0UG9zaXRpb24pLmxlZnRcbiAgICAgIEBjb250ZW50V2lkdGggKz0gQHNjcm9sbExlZnRcbiAgICAgIEBjb250ZW50V2lkdGggKz0gMSB1bmxlc3MgQG1vZGVsLmlzU29mdFdyYXBwZWQoKSAjIGFjY291bnQgZm9yIGN1cnNvciB3aWR0aFxuXG4gICAgaWYgQGNvbnRlbnRXaWR0aCBpc250IG9sZENvbnRlbnRXaWR0aFxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZUNsaWVudFdpZHRoKClcbiAgICAgIEB1cGRhdGVTY3JvbGxXaWR0aCgpXG5cbiAgdXBkYXRlQ2xpZW50SGVpZ2h0OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGhlaWdodD8gYW5kIEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0P1xuXG4gICAgY2xpZW50SGVpZ2h0ID0gQGhlaWdodCAtIEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG4gICAgQG1vZGVsLnNldEhlaWdodChjbGllbnRIZWlnaHQsIHRydWUpXG5cbiAgICB1bmxlc3MgQGNsaWVudEhlaWdodCBpcyBjbGllbnRIZWlnaHRcbiAgICAgIEBjbGllbnRIZWlnaHQgPSBjbGllbnRIZWlnaHRcbiAgICAgIEB1cGRhdGVTY3JvbGxIZWlnaHQoKVxuICAgICAgQHVwZGF0ZVNjcm9sbFRvcChAc2Nyb2xsVG9wKVxuXG4gIHVwZGF0ZUNsaWVudFdpZHRoOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRGcmFtZVdpZHRoPyBhbmQgQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg/XG5cbiAgICBpZiBAbW9kZWwuZ2V0QXV0b1dpZHRoKClcbiAgICAgIGNsaWVudFdpZHRoID0gQGNvbnRlbnRXaWR0aFxuICAgIGVsc2VcbiAgICAgIGNsaWVudFdpZHRoID0gQGNvbnRlbnRGcmFtZVdpZHRoIC0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcblxuICAgIEBtb2RlbC5zZXRXaWR0aChjbGllbnRXaWR0aCwgdHJ1ZSkgdW5sZXNzIEBlZGl0b3JXaWR0aEluQ2hhcnNcblxuICAgIHVubGVzcyBAY2xpZW50V2lkdGggaXMgY2xpZW50V2lkdGhcbiAgICAgIEBjbGllbnRXaWR0aCA9IGNsaWVudFdpZHRoXG4gICAgICBAdXBkYXRlU2Nyb2xsV2lkdGgoKVxuICAgICAgQHVwZGF0ZVNjcm9sbExlZnQoQHNjcm9sbExlZnQpXG5cbiAgdXBkYXRlU2Nyb2xsVG9wOiAoc2Nyb2xsVG9wKSAtPlxuICAgIHNjcm9sbFRvcCA9IEBjb25zdHJhaW5TY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuICAgIGlmIHNjcm9sbFRvcCBpc250IEByZWFsU2Nyb2xsVG9wIGFuZCBub3QgTnVtYmVyLmlzTmFOKHNjcm9sbFRvcClcbiAgICAgIEByZWFsU2Nyb2xsVG9wID0gc2Nyb2xsVG9wXG4gICAgICBAc2Nyb2xsVG9wID0gTWF0aC5yb3VuZChzY3JvbGxUb3ApXG4gICAgICBAbW9kZWwuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KE1hdGgucm91bmQoQHNjcm9sbFRvcCAvIEBsaW5lSGVpZ2h0KSwgdHJ1ZSlcblxuICAgICAgQHVwZGF0ZVN0YXJ0Um93KClcbiAgICAgIEB1cGRhdGVFbmRSb3coKVxuICAgICAgQGRpZFN0YXJ0U2Nyb2xsaW5nKClcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2Utc2Nyb2xsLXRvcCcsIEBzY3JvbGxUb3BcblxuICBjb25zdHJhaW5TY3JvbGxUb3A6IChzY3JvbGxUb3ApIC0+XG4gICAgcmV0dXJuIHNjcm9sbFRvcCB1bmxlc3Mgc2Nyb2xsVG9wPyBhbmQgQHNjcm9sbEhlaWdodD8gYW5kIEBjbGllbnRIZWlnaHQ/XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oc2Nyb2xsVG9wLCBAc2Nyb2xsSGVpZ2h0IC0gQGNsaWVudEhlaWdodCkpXG5cbiAgdXBkYXRlU2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgc2Nyb2xsTGVmdCA9IEBjb25zdHJhaW5TY3JvbGxMZWZ0KHNjcm9sbExlZnQpXG4gICAgaWYgc2Nyb2xsTGVmdCBpc250IEByZWFsU2Nyb2xsTGVmdCBhbmQgbm90IE51bWJlci5pc05hTihzY3JvbGxMZWZ0KVxuICAgICAgQHJlYWxTY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdFxuICAgICAgQHNjcm9sbExlZnQgPSBNYXRoLnJvdW5kKHNjcm9sbExlZnQpXG4gICAgICBAbW9kZWwuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKE1hdGgucm91bmQoQHNjcm9sbExlZnQgLyBAYmFzZUNoYXJhY3RlcldpZHRoKSlcblxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1zY3JvbGwtbGVmdCcsIEBzY3JvbGxMZWZ0XG5cbiAgY29uc3RyYWluU2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgcmV0dXJuIHNjcm9sbExlZnQgdW5sZXNzIHNjcm9sbExlZnQ/IGFuZCBAc2Nyb2xsV2lkdGg/IGFuZCBAY2xpZW50V2lkdGg/XG4gICAgTWF0aC5tYXgoMCwgTWF0aC5taW4oc2Nyb2xsTGVmdCwgQHNjcm9sbFdpZHRoIC0gQGNsaWVudFdpZHRoKSlcblxuICB1cGRhdGVTY3JvbGxiYXJEaW1lbnNpb25zOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRGcmFtZVdpZHRoPyBhbmQgQGhlaWdodD9cbiAgICByZXR1cm4gdW5sZXNzIEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg/IGFuZCBAbWVhc3VyZWRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0P1xuICAgIHJldHVybiB1bmxlc3MgQGNvbnRlbnRXaWR0aD8gYW5kIEBjb250ZW50SGVpZ2h0P1xuXG4gICAgaWYgQG1vZGVsLmdldEF1dG9XaWR0aCgpXG4gICAgICBjbGllbnRXaWR0aFdpdGhWZXJ0aWNhbFNjcm9sbGJhciA9IEBjb250ZW50V2lkdGggKyBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgZWxzZVxuICAgICAgY2xpZW50V2lkdGhXaXRoVmVydGljYWxTY3JvbGxiYXIgPSBAY29udGVudEZyYW1lV2lkdGhcbiAgICBjbGllbnRXaWR0aFdpdGhvdXRWZXJ0aWNhbFNjcm9sbGJhciA9IGNsaWVudFdpZHRoV2l0aFZlcnRpY2FsU2Nyb2xsYmFyIC0gQG1lYXN1cmVkVmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgIGNsaWVudEhlaWdodFdpdGhIb3Jpem9udGFsU2Nyb2xsYmFyID0gQGhlaWdodFxuICAgIGNsaWVudEhlaWdodFdpdGhvdXRIb3Jpem9udGFsU2Nyb2xsYmFyID0gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIgLSBAbWVhc3VyZWRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG5cbiAgICBob3Jpem9udGFsU2Nyb2xsYmFyVmlzaWJsZSA9XG4gICAgICBub3QgQG1vZGVsLmlzTWluaSgpIGFuZFxuICAgICAgICAoQGNvbnRlbnRXaWR0aCA+IGNsaWVudFdpZHRoV2l0aFZlcnRpY2FsU2Nyb2xsYmFyIG9yXG4gICAgICAgICBAY29udGVudFdpZHRoID4gY2xpZW50V2lkdGhXaXRob3V0VmVydGljYWxTY3JvbGxiYXIgYW5kIEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIpXG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhclZpc2libGUgPVxuICAgICAgbm90IEBtb2RlbC5pc01pbmkoKSBhbmRcbiAgICAgICAgKEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aEhvcml6b250YWxTY3JvbGxiYXIgb3JcbiAgICAgICAgIEBjb250ZW50SGVpZ2h0ID4gY2xpZW50SGVpZ2h0V2l0aG91dEhvcml6b250YWxTY3JvbGxiYXIgYW5kIEBjb250ZW50V2lkdGggPiBjbGllbnRXaWR0aFdpdGhWZXJ0aWNhbFNjcm9sbGJhcilcblxuICAgIGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQgPVxuICAgICAgaWYgaG9yaXpvbnRhbFNjcm9sbGJhclZpc2libGVcbiAgICAgICAgQG1lYXN1cmVkSG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuICAgICAgZWxzZVxuICAgICAgICAwXG5cbiAgICB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID1cbiAgICAgIGlmIHZlcnRpY2FsU2Nyb2xsYmFyVmlzaWJsZVxuICAgICAgICBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgICBlbHNlXG4gICAgICAgIDBcblxuICAgIHVubGVzcyBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCBpcyBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG4gICAgICBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCA9IGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICAgIEB1cGRhdGVDbGllbnRIZWlnaHQoKVxuXG4gICAgdW5sZXNzIEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoIGlzIHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICAgIEB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoID0gdmVydGljYWxTY3JvbGxiYXJXaWR0aFxuICAgICAgQHVwZGF0ZUNsaWVudFdpZHRoKClcblxuICBsaW5lRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3c6IChyb3cpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQG1vZGVsLmlzTWluaSgpXG5cbiAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IG51bGxcbiAgICBmb3IgaWQsIHByb3BlcnRpZXMgb2YgQGxpbmVEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11cbiAgICAgIGRlY29yYXRpb25DbGFzc2VzID89IFtdXG4gICAgICBkZWNvcmF0aW9uQ2xhc3Nlcy5wdXNoKHByb3BlcnRpZXMuY2xhc3MpXG4gICAgZGVjb3JhdGlvbkNsYXNzZXNcblxuICBsaW5lTnVtYmVyRGVjb3JhdGlvbkNsYXNzZXNGb3JSb3c6IChyb3cpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQG1vZGVsLmlzTWluaSgpXG5cbiAgICBkZWNvcmF0aW9uQ2xhc3NlcyA9IG51bGxcbiAgICBmb3IgaWQsIHByb3BlcnRpZXMgb2YgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd11cbiAgICAgIGRlY29yYXRpb25DbGFzc2VzID89IFtdXG4gICAgICBkZWNvcmF0aW9uQ2xhc3Nlcy5wdXNoKHByb3BlcnRpZXMuY2xhc3MpXG4gICAgZGVjb3JhdGlvbkNsYXNzZXNcblxuICBnZXRDdXJzb3JCbGlua1BlcmlvZDogLT4gQGN1cnNvckJsaW5rUGVyaW9kXG5cbiAgZ2V0Q3Vyc29yQmxpbmtSZXN1bWVEZWxheTogLT4gQGN1cnNvckJsaW5rUmVzdW1lRGVsYXlcblxuICBzZXRGb2N1c2VkOiAoZm9jdXNlZCkgLT5cbiAgICB1bmxlc3MgQGZvY3VzZWQgaXMgZm9jdXNlZFxuICAgICAgQGZvY3VzZWQgPSBmb2N1c2VkXG4gICAgICBpZiBAZm9jdXNlZFxuICAgICAgICBAc3RhcnRCbGlua2luZ0N1cnNvcnMoKVxuICAgICAgZWxzZVxuICAgICAgICBAc3RvcEJsaW5raW5nQ3Vyc29ycyhmYWxzZSlcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHNldFNjcm9sbFRvcDogKHNjcm9sbFRvcCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHNjcm9sbFRvcD9cblxuICAgIEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uID0gbnVsbFxuICAgIEBwZW5kaW5nU2Nyb2xsVG9wID0gc2Nyb2xsVG9wXG5cbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBzY3JvbGxUb3BcblxuICBnZXRSZWFsU2Nyb2xsVG9wOiAtPlxuICAgIEByZWFsU2Nyb2xsVG9wID8gQHNjcm9sbFRvcFxuXG4gIGRpZFN0YXJ0U2Nyb2xsaW5nOiAtPlxuICAgIGlmIEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkP1xuICAgICAgY2xlYXJUaW1lb3V0KEBzdG9wcGVkU2Nyb2xsaW5nVGltZW91dElkKVxuICAgICAgQHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQgPSBudWxsXG4gICAgQHN0b3BwZWRTY3JvbGxpbmdUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KEBkaWRTdG9wU2Nyb2xsaW5nLmJpbmQodGhpcyksIEBzdG9wcGVkU2Nyb2xsaW5nRGVsYXkpXG5cbiAgZGlkU3RvcFNjcm9sbGluZzogLT5cbiAgICBpZiBAbW91c2VXaGVlbFNjcmVlblJvdz9cbiAgICAgIEBtb3VzZVdoZWVsU2NyZWVuUm93ID0gbnVsbFxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0U2Nyb2xsTGVmdDogKHNjcm9sbExlZnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBzY3JvbGxMZWZ0P1xuXG4gICAgQHBlbmRpbmdTY3JvbGxMb2dpY2FsUG9zaXRpb24gPSBudWxsXG4gICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdFxuXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZ2V0U2Nyb2xsTGVmdDogLT5cbiAgICBAc2Nyb2xsTGVmdFxuXG4gIGdldFJlYWxTY3JvbGxMZWZ0OiAtPlxuICAgIEByZWFsU2Nyb2xsTGVmdCA/IEBzY3JvbGxMZWZ0XG5cbiAgZ2V0Q2xpZW50SGVpZ2h0OiAtPlxuICAgIGlmIEBjbGllbnRIZWlnaHRcbiAgICAgIEBjbGllbnRIZWlnaHRcbiAgICBlbHNlXG4gICAgICBAZXhwbGljaXRIZWlnaHQgLSBAaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuXG4gIGdldENsaWVudFdpZHRoOiAtPlxuICAgIGlmIEBjbGllbnRXaWR0aFxuICAgICAgQGNsaWVudFdpZHRoXG4gICAgZWxzZVxuICAgICAgQGNvbnRlbnRGcmFtZVdpZHRoIC0gQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcblxuICBnZXRTY3JvbGxCb3R0b206IC0+IEBnZXRTY3JvbGxUb3AoKSArIEBnZXRDbGllbnRIZWlnaHQoKVxuICBzZXRTY3JvbGxCb3R0b206IChzY3JvbGxCb3R0b20pIC0+XG4gICAgQHNldFNjcm9sbFRvcChzY3JvbGxCb3R0b20gLSBAZ2V0Q2xpZW50SGVpZ2h0KCkpXG4gICAgQGdldFNjcm9sbEJvdHRvbSgpXG5cbiAgZ2V0U2Nyb2xsUmlnaHQ6IC0+IEBnZXRTY3JvbGxMZWZ0KCkgKyBAZ2V0Q2xpZW50V2lkdGgoKVxuICBzZXRTY3JvbGxSaWdodDogKHNjcm9sbFJpZ2h0KSAtPlxuICAgIEBzZXRTY3JvbGxMZWZ0KHNjcm9sbFJpZ2h0IC0gQGdldENsaWVudFdpZHRoKCkpXG4gICAgQGdldFNjcm9sbFJpZ2h0KClcblxuICBnZXRTY3JvbGxIZWlnaHQ6IC0+XG4gICAgQHNjcm9sbEhlaWdodFxuXG4gIGdldFNjcm9sbFdpZHRoOiAtPlxuICAgIEBzY3JvbGxXaWR0aFxuXG4gIGdldE1heFNjcm9sbFRvcDogLT5cbiAgICBzY3JvbGxIZWlnaHQgPSBAZ2V0U2Nyb2xsSGVpZ2h0KClcbiAgICBjbGllbnRIZWlnaHQgPSBAZ2V0Q2xpZW50SGVpZ2h0KClcbiAgICByZXR1cm4gMCB1bmxlc3Mgc2Nyb2xsSGVpZ2h0PyBhbmQgY2xpZW50SGVpZ2h0P1xuXG4gICAgc2Nyb2xsSGVpZ2h0IC0gY2xpZW50SGVpZ2h0XG5cbiAgc2V0SG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodDogKGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQpIC0+XG4gICAgdW5sZXNzIEBtZWFzdXJlZEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQgaXMgaG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodFxuICAgICAgQG1lYXN1cmVkSG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCA9IGhvcml6b250YWxTY3JvbGxiYXJIZWlnaHRcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHNldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6ICh2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoKSAtPlxuICAgIHVubGVzcyBAbWVhc3VyZWRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoIGlzIHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcbiAgICAgIEBtZWFzdXJlZFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGggPSB2ZXJ0aWNhbFNjcm9sbGJhcldpZHRoXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRBdXRvSGVpZ2h0OiAoYXV0b0hlaWdodCkgLT5cbiAgICB1bmxlc3MgQGF1dG9IZWlnaHQgaXMgYXV0b0hlaWdodFxuICAgICAgQGF1dG9IZWlnaHQgPSBhdXRvSGVpZ2h0XG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRFeHBsaWNpdEhlaWdodDogKGV4cGxpY2l0SGVpZ2h0KSAtPlxuICAgIHVubGVzcyBAZXhwbGljaXRIZWlnaHQgaXMgZXhwbGljaXRIZWlnaHRcbiAgICAgIEBleHBsaWNpdEhlaWdodCA9IGV4cGxpY2l0SGVpZ2h0XG4gICAgICBAdXBkYXRlSGVpZ2h0KClcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIHVwZGF0ZUhlaWdodDogLT5cbiAgICBoZWlnaHQgPSBAZXhwbGljaXRIZWlnaHQgPyBAY29udGVudEhlaWdodFxuICAgIHVubGVzcyBAaGVpZ2h0IGlzIGhlaWdodFxuICAgICAgQGhlaWdodCA9IGhlaWdodFxuICAgICAgQHVwZGF0ZVNjcm9sbGJhckRpbWVuc2lvbnMoKVxuICAgICAgQHVwZGF0ZUNsaWVudEhlaWdodCgpXG4gICAgICBAdXBkYXRlU2Nyb2xsSGVpZ2h0KClcbiAgICAgIEB1cGRhdGVFbmRSb3coKVxuXG4gIGRpZENoYW5nZUF1dG9XaWR0aDogLT5cbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRDb250ZW50RnJhbWVXaWR0aDogKGNvbnRlbnRGcmFtZVdpZHRoKSAtPlxuICAgIGlmIEBjb250ZW50RnJhbWVXaWR0aCBpc250IGNvbnRlbnRGcmFtZVdpZHRoIG9yIEBlZGl0b3JXaWR0aEluQ2hhcnM/XG4gICAgICBAY29udGVudEZyYW1lV2lkdGggPSBjb250ZW50RnJhbWVXaWR0aFxuICAgICAgQGVkaXRvcldpZHRoSW5DaGFycyA9IG51bGxcbiAgICAgIEB1cGRhdGVTY3JvbGxiYXJEaW1lbnNpb25zKClcbiAgICAgIEB1cGRhdGVDbGllbnRXaWR0aCgpXG4gICAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gdHJ1ZVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0Qm91bmRpbmdDbGllbnRSZWN0OiAoYm91bmRpbmdDbGllbnRSZWN0KSAtPlxuICAgIHVubGVzcyBAY2xpZW50UmVjdHNFcXVhbChAYm91bmRpbmdDbGllbnRSZWN0LCBib3VuZGluZ0NsaWVudFJlY3QpXG4gICAgICBAYm91bmRpbmdDbGllbnRSZWN0ID0gYm91bmRpbmdDbGllbnRSZWN0XG4gICAgICBAaW52YWxpZGF0ZUFsbEJsb2NrRGVjb3JhdGlvbnNEaW1lbnNpb25zID0gdHJ1ZVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgY2xpZW50UmVjdHNFcXVhbDogKGNsaWVudFJlY3RBLCBjbGllbnRSZWN0QikgLT5cbiAgICBjbGllbnRSZWN0QT8gYW5kIGNsaWVudFJlY3RCPyBhbmRcbiAgICAgIGNsaWVudFJlY3RBLnRvcCBpcyBjbGllbnRSZWN0Qi50b3AgYW5kXG4gICAgICBjbGllbnRSZWN0QS5sZWZ0IGlzIGNsaWVudFJlY3RCLmxlZnQgYW5kXG4gICAgICBjbGllbnRSZWN0QS53aWR0aCBpcyBjbGllbnRSZWN0Qi53aWR0aCBhbmRcbiAgICAgIGNsaWVudFJlY3RBLmhlaWdodCBpcyBjbGllbnRSZWN0Qi5oZWlnaHRcblxuICBzZXRXaW5kb3dTaXplOiAod2lkdGgsIGhlaWdodCkgLT5cbiAgICBpZiBAd2luZG93V2lkdGggaXNudCB3aWR0aCBvciBAd2luZG93SGVpZ2h0IGlzbnQgaGVpZ2h0XG4gICAgICBAd2luZG93V2lkdGggPSB3aWR0aFxuICAgICAgQHdpbmRvd0hlaWdodCA9IGhlaWdodFxuICAgICAgQGludmFsaWRhdGVBbGxCbG9ja0RlY29yYXRpb25zRGltZW5zaW9ucyA9IHRydWVcbiAgICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcblxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0QmFja2dyb3VuZENvbG9yOiAoYmFja2dyb3VuZENvbG9yKSAtPlxuICAgIHVubGVzcyBAYmFja2dyb3VuZENvbG9yIGlzIGJhY2tncm91bmRDb2xvclxuICAgICAgQGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvclxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0R3V0dGVyQmFja2dyb3VuZENvbG9yOiAoZ3V0dGVyQmFja2dyb3VuZENvbG9yKSAtPlxuICAgIHVubGVzcyBAZ3V0dGVyQmFja2dyb3VuZENvbG9yIGlzIGd1dHRlckJhY2tncm91bmRDb2xvclxuICAgICAgQGd1dHRlckJhY2tncm91bmRDb2xvciA9IGd1dHRlckJhY2tncm91bmRDb2xvclxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0R3V0dGVyV2lkdGg6IChndXR0ZXJXaWR0aCkgLT5cbiAgICBpZiBAZ3V0dGVyV2lkdGggaXNudCBndXR0ZXJXaWR0aFxuICAgICAgQGd1dHRlcldpZHRoID0gZ3V0dGVyV2lkdGhcbiAgICAgIEB1cGRhdGVPdmVybGF5c1N0YXRlKClcblxuICBnZXRHdXR0ZXJXaWR0aDogLT5cbiAgICBAZ3V0dGVyV2lkdGhcblxuICBzZXRMaW5lSGVpZ2h0OiAobGluZUhlaWdodCkgLT5cbiAgICB1bmxlc3MgQGxpbmVIZWlnaHQgaXMgbGluZUhlaWdodFxuICAgICAgQGxpbmVIZWlnaHQgPSBsaW5lSGVpZ2h0XG4gICAgICBAbW9kZWwuc2V0TGluZUhlaWdodEluUGl4ZWxzKEBsaW5lSGVpZ2h0KVxuICAgICAgQGxpbmVUb3BJbmRleC5zZXREZWZhdWx0TGluZUhlaWdodChAbGluZUhlaWdodClcbiAgICAgIEByZXN0b3JlU2Nyb2xsVG9wSWZOZWVkZWQoKVxuICAgICAgQG1vZGVsLnNldExpbmVIZWlnaHRJblBpeGVscyhsaW5lSGVpZ2h0KVxuICAgICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc2V0TW91c2VXaGVlbFNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBpZiBAbW91c2VXaGVlbFNjcmVlblJvdyBpc250IHNjcmVlblJvd1xuICAgICAgQG1vdXNlV2hlZWxTY3JlZW5Sb3cgPSBzY3JlZW5Sb3dcbiAgICAgIEBkaWRTdGFydFNjcm9sbGluZygpXG5cbiAgc2V0QmFzZUNoYXJhY3RlcldpZHRoOiAoYmFzZUNoYXJhY3RlcldpZHRoLCBkb3VibGVXaWR0aENoYXJXaWR0aCwgaGFsZldpZHRoQ2hhcldpZHRoLCBrb3JlYW5DaGFyV2lkdGgpIC0+XG4gICAgdW5sZXNzIEBiYXNlQ2hhcmFjdGVyV2lkdGggaXMgYmFzZUNoYXJhY3RlcldpZHRoIGFuZCBAZG91YmxlV2lkdGhDaGFyV2lkdGggaXMgZG91YmxlV2lkdGhDaGFyV2lkdGggYW5kIEBoYWxmV2lkdGhDaGFyV2lkdGggaXMgaGFsZldpZHRoQ2hhcldpZHRoIGFuZCBrb3JlYW5DaGFyV2lkdGggaXMgQGtvcmVhbkNoYXJXaWR0aFxuICAgICAgQGJhc2VDaGFyYWN0ZXJXaWR0aCA9IGJhc2VDaGFyYWN0ZXJXaWR0aFxuICAgICAgQGRvdWJsZVdpZHRoQ2hhcldpZHRoID0gZG91YmxlV2lkdGhDaGFyV2lkdGhcbiAgICAgIEBoYWxmV2lkdGhDaGFyV2lkdGggPSBoYWxmV2lkdGhDaGFyV2lkdGhcbiAgICAgIEBrb3JlYW5DaGFyV2lkdGggPSBrb3JlYW5DaGFyV2lkdGhcbiAgICAgIEBtb2RlbC5zZXREZWZhdWx0Q2hhcldpZHRoKGJhc2VDaGFyYWN0ZXJXaWR0aCwgZG91YmxlV2lkdGhDaGFyV2lkdGgsIGhhbGZXaWR0aENoYXJXaWR0aCwga29yZWFuQ2hhcldpZHRoKVxuICAgICAgQHJlc3RvcmVTY3JvbGxMZWZ0SWZOZWVkZWQoKVxuICAgICAgQG1lYXN1cmVtZW50c0NoYW5nZWQoKVxuXG4gIG1lYXN1cmVtZW50c0NoYW5nZWQ6IC0+XG4gICAgQGludmFsaWRhdGVBbGxCbG9ja0RlY29yYXRpb25zRGltZW5zaW9ucyA9IHRydWVcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgaGFzUGl4ZWxQb3NpdGlvblJlcXVpcmVtZW50czogLT5cbiAgICBAbGluZUhlaWdodD8gYW5kIEBiYXNlQ2hhcmFjdGVyV2lkdGg/XG5cbiAgcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24pIC0+XG4gICAgcG9zaXRpb24gPSBAbGluZXNZYXJkc3RpY2sucGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKVxuICAgIHBvc2l0aW9uLnRvcCAtPSBAZ2V0U2Nyb2xsVG9wKClcbiAgICBwb3NpdGlvbi5sZWZ0IC09IEBnZXRTY3JvbGxMZWZ0KClcblxuICAgIHBvc2l0aW9uLnRvcCA9IE1hdGgucm91bmQocG9zaXRpb24udG9wKVxuICAgIHBvc2l0aW9uLmxlZnQgPSBNYXRoLnJvdW5kKHBvc2l0aW9uLmxlZnQpXG5cbiAgICBwb3NpdGlvblxuXG4gIGhhc1BpeGVsUmVjdFJlcXVpcmVtZW50czogLT5cbiAgICBAaGFzUGl4ZWxQb3NpdGlvblJlcXVpcmVtZW50cygpIGFuZCBAc2Nyb2xsV2lkdGg/XG5cbiAgaGFzT3ZlcmxheVBvc2l0aW9uUmVxdWlyZW1lbnRzOiAtPlxuICAgIEBoYXNQaXhlbFJlY3RSZXF1aXJlbWVudHMoKSBhbmQgQGJvdW5kaW5nQ2xpZW50UmVjdD8gYW5kIEB3aW5kb3dXaWR0aCBhbmQgQHdpbmRvd0hlaWdodFxuXG4gIGFic29sdXRlUGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSkgLT5cbiAgICBsaW5lSGVpZ2h0ID0gQG1vZGVsLmdldExpbmVIZWlnaHRJblBpeGVscygpXG5cbiAgICBpZiBzY3JlZW5SYW5nZS5lbmQucm93ID4gc2NyZWVuUmFuZ2Uuc3RhcnQucm93XG4gICAgICB0b3AgPSBAbGluZXNZYXJkc3RpY2sucGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblJhbmdlLnN0YXJ0KS50b3BcbiAgICAgIGxlZnQgPSAwXG4gICAgICBoZWlnaHQgPSAoc2NyZWVuUmFuZ2UuZW5kLnJvdyAtIHNjcmVlblJhbmdlLnN0YXJ0LnJvdyArIDEpICogbGluZUhlaWdodFxuICAgICAgd2lkdGggPSBAZ2V0U2Nyb2xsV2lkdGgoKVxuICAgIGVsc2VcbiAgICAgIHt0b3AsIGxlZnR9ID0gQGxpbmVzWWFyZHN0aWNrLnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5zdGFydClcbiAgICAgIGhlaWdodCA9IGxpbmVIZWlnaHRcbiAgICAgIHdpZHRoID0gQGxpbmVzWWFyZHN0aWNrLnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5SYW5nZS5lbmQpLmxlZnQgLSBsZWZ0XG5cbiAgICB7dG9wLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0fVxuXG4gIHBpeGVsUmVjdEZvclNjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UpIC0+XG4gICAgcmVjdCA9IEBhYnNvbHV0ZVBpeGVsUmVjdEZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuICAgIHJlY3QudG9wIC09IEBnZXRTY3JvbGxUb3AoKVxuICAgIHJlY3QubGVmdCAtPSBAZ2V0U2Nyb2xsTGVmdCgpXG4gICAgcmVjdC50b3AgPSBNYXRoLnJvdW5kKHJlY3QudG9wKVxuICAgIHJlY3QubGVmdCA9IE1hdGgucm91bmQocmVjdC5sZWZ0KVxuICAgIHJlY3Qud2lkdGggPSBNYXRoLnJvdW5kKHJlY3Qud2lkdGgpXG4gICAgcmVjdC5oZWlnaHQgPSBNYXRoLnJvdW5kKHJlY3QuaGVpZ2h0KVxuICAgIHJlY3RcblxuICB1cGRhdGVMaW5lczogLT5cbiAgICBAbGluZXNCeVNjcmVlblJvdy5jbGVhcigpXG5cbiAgICBmb3IgW3N0YXJ0Um93LCBlbmRSb3ddIGluIEBnZXRTY3JlZW5SYW5nZXNUb1JlbmRlcigpXG4gICAgICBmb3IgbGluZSwgaW5kZXggaW4gQGRpc3BsYXlMYXllci5nZXRTY3JlZW5MaW5lcyhzdGFydFJvdywgZW5kUm93ICsgMSlcbiAgICAgICAgQGxpbmVzQnlTY3JlZW5Sb3cuc2V0KHN0YXJ0Um93ICsgaW5kZXgsIGxpbmUpXG5cbiAgbGluZUlkRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPlxuICAgIEBsaW5lc0J5U2NyZWVuUm93LmdldChzY3JlZW5Sb3cpPy5pZFxuXG4gIGZldGNoRGVjb3JhdGlvbnM6IC0+XG4gICAgcmV0dXJuIHVubGVzcyAwIDw9IEBzdGFydFJvdyA8PSBAZW5kUm93IDw9IEluZmluaXR5XG4gICAgQGRlY29yYXRpb25zID0gQG1vZGVsLmRlY29yYXRpb25zU3RhdGVGb3JTY3JlZW5Sb3dSYW5nZShAc3RhcnRSb3csIEBlbmRSb3cgLSAxKVxuXG4gIHVwZGF0ZUJsb2NrRGVjb3JhdGlvbnM6IC0+XG4gICAgaWYgQGludmFsaWRhdGVBbGxCbG9ja0RlY29yYXRpb25zRGltZW5zaW9uc1xuICAgICAgZm9yIGRlY29yYXRpb24gaW4gQG1vZGVsLmdldERlY29yYXRpb25zKHR5cGU6ICdibG9jaycpXG4gICAgICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5hZGQoZGVjb3JhdGlvbilcbiAgICAgIEBpbnZhbGlkYXRlQWxsQmxvY2tEZWNvcmF0aW9uc0RpbWVuc2lvbnMgPSBmYWxzZVxuXG4gICAgdmlzaWJsZURlY29yYXRpb25zQnlJZCA9IHt9XG4gICAgdmlzaWJsZURlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZCA9IHt9XG4gICAgZm9yIG1hcmtlcklkLCBkZWNvcmF0aW9ucyBvZiBAbW9kZWwuZGVjb3JhdGlvbnNGb3JTY3JlZW5Sb3dSYW5nZShAZ2V0U3RhcnRUaWxlUm93KCksIEBnZXRFbmRUaWxlUm93KCkgKyBAdGlsZVNpemUgLSAxKVxuICAgICAgZm9yIGRlY29yYXRpb24gaW4gZGVjb3JhdGlvbnMgd2hlbiBkZWNvcmF0aW9uLmlzVHlwZSgnYmxvY2snKVxuICAgICAgICBzY3JlZW5Sb3cgPSBkZWNvcmF0aW9uLmdldE1hcmtlcigpLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpLnJvd1xuICAgICAgICBpZiBkZWNvcmF0aW9uLmdldFByb3BlcnRpZXMoKS5wb3NpdGlvbiBpcyBcImFmdGVyXCJcbiAgICAgICAgICBAZm9sbG93aW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRbc2NyZWVuUm93XSA/PSB7fVxuICAgICAgICAgIEBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddW2RlY29yYXRpb24uaWRdID0ge3NjcmVlblJvdywgZGVjb3JhdGlvbn1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBwcmVjZWRpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddID89IHt9XG4gICAgICAgICAgQHByZWNlZGluZ0Jsb2NrRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd11bZGVjb3JhdGlvbi5pZF0gPSB7c2NyZWVuUm93LCBkZWNvcmF0aW9ufVxuICAgICAgICB2aXNpYmxlRGVjb3JhdGlvbnNCeUlkW2RlY29yYXRpb24uaWRdID0gdHJ1ZVxuICAgICAgICB2aXNpYmxlRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10gPz0ge31cbiAgICAgICAgdmlzaWJsZURlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddW2RlY29yYXRpb24uaWRdID0gdHJ1ZVxuXG4gICAgZm9yIHNjcmVlblJvdywgYmxvY2tEZWNvcmF0aW9ucyBvZiBAcHJlY2VkaW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRcbiAgICAgIGlmIE51bWJlcihzY3JlZW5Sb3cpIGlzbnQgQG1vdXNlV2hlZWxTY3JlZW5Sb3dcbiAgICAgICAgZm9yIGlkLCBibG9ja0RlY29yYXRpb24gb2YgYmxvY2tEZWNvcmF0aW9uc1xuICAgICAgICAgIHVubGVzcyB2aXNpYmxlRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10/W2lkXVxuICAgICAgICAgICAgZGVsZXRlIEBwcmVjZWRpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddW2lkXVxuXG4gICAgZm9yIHNjcmVlblJvdywgYmxvY2tEZWNvcmF0aW9ucyBvZiBAZm9sbG93aW5nQmxvY2tEZWNvcmF0aW9uc0J5U2NyZWVuUm93QW5kSWRcbiAgICAgIGlmIE51bWJlcihzY3JlZW5Sb3cpIGlzbnQgQG1vdXNlV2hlZWxTY3JlZW5Sb3dcbiAgICAgICAgZm9yIGlkLCBibG9ja0RlY29yYXRpb24gb2YgYmxvY2tEZWNvcmF0aW9uc1xuICAgICAgICAgIHVubGVzcyB2aXNpYmxlRGVjb3JhdGlvbnNCeVNjcmVlblJvd0FuZElkW3NjcmVlblJvd10/W2lkXVxuICAgICAgICAgICAgZGVsZXRlIEBmb2xsb3dpbmdCbG9ja0RlY29yYXRpb25zQnlTY3JlZW5Sb3dBbmRJZFtzY3JlZW5Sb3ddW2lkXVxuXG4gICAgQHN0YXRlLmNvbnRlbnQub2ZmU2NyZWVuQmxvY2tEZWNvcmF0aW9ucyA9IHt9XG4gICAgQGludmFsaWRhdGVkRGltZW5zaW9uc0J5QmxvY2tEZWNvcmF0aW9uLmZvckVhY2ggKGRlY29yYXRpb24pID0+XG4gICAgICB1bmxlc3MgdmlzaWJsZURlY29yYXRpb25zQnlJZFtkZWNvcmF0aW9uLmlkXVxuICAgICAgICBAc3RhdGUuY29udGVudC5vZmZTY3JlZW5CbG9ja0RlY29yYXRpb25zW2RlY29yYXRpb24uaWRdID0gZGVjb3JhdGlvblxuXG4gIHVwZGF0ZUxpbmVEZWNvcmF0aW9uczogLT5cbiAgICBAbGluZURlY29yYXRpb25zQnlTY3JlZW5Sb3cgPSB7fVxuICAgIEBsaW5lTnVtYmVyRGVjb3JhdGlvbnNCeVNjcmVlblJvdyA9IHt9XG4gICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zQnlHdXR0ZXJOYW1lID0ge31cblxuICAgIGZvciBkZWNvcmF0aW9uSWQsIGRlY29yYXRpb25TdGF0ZSBvZiBAZGVjb3JhdGlvbnNcbiAgICAgIHtwcm9wZXJ0aWVzLCBidWZmZXJSYW5nZSwgc2NyZWVuUmFuZ2UsIHJhbmdlSXNSZXZlcnNlZH0gPSBkZWNvcmF0aW9uU3RhdGVcbiAgICAgIGlmIERlY29yYXRpb24uaXNUeXBlKHByb3BlcnRpZXMsICdsaW5lJykgb3IgRGVjb3JhdGlvbi5pc1R5cGUocHJvcGVydGllcywgJ2xpbmUtbnVtYmVyJylcbiAgICAgICAgQGFkZFRvTGluZURlY29yYXRpb25DYWNoZXMoZGVjb3JhdGlvbklkLCBwcm9wZXJ0aWVzLCBidWZmZXJSYW5nZSwgc2NyZWVuUmFuZ2UsIHJhbmdlSXNSZXZlcnNlZClcblxuICAgICAgZWxzZSBpZiBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnZ3V0dGVyJykgYW5kIHByb3BlcnRpZXMuZ3V0dGVyTmFtZT9cbiAgICAgICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zQnlHdXR0ZXJOYW1lW3Byb3BlcnRpZXMuZ3V0dGVyTmFtZV0gPz0ge31cbiAgICAgICAgQGN1c3RvbUd1dHRlckRlY29yYXRpb25zQnlHdXR0ZXJOYW1lW3Byb3BlcnRpZXMuZ3V0dGVyTmFtZV1bZGVjb3JhdGlvbklkXSA9IGRlY29yYXRpb25TdGF0ZVxuXG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlSGlnaGxpZ2h0RGVjb3JhdGlvbnM6IC0+XG4gICAgQHZpc2libGVIaWdobGlnaHRzID0ge31cblxuICAgIGZvciBkZWNvcmF0aW9uSWQsIHtwcm9wZXJ0aWVzLCBzY3JlZW5SYW5nZX0gb2YgQGRlY29yYXRpb25zXG4gICAgICBpZiBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnaGlnaGxpZ2h0JylcbiAgICAgICAgQHVwZGF0ZUhpZ2hsaWdodFN0YXRlKGRlY29yYXRpb25JZCwgcHJvcGVydGllcywgc2NyZWVuUmFuZ2UpXG5cbiAgICBmb3IgdGlsZUlkLCB0aWxlU3RhdGUgb2YgQHN0YXRlLmNvbnRlbnQudGlsZXNcbiAgICAgIGZvciBpZCBvZiB0aWxlU3RhdGUuaGlnaGxpZ2h0c1xuICAgICAgICBkZWxldGUgdGlsZVN0YXRlLmhpZ2hsaWdodHNbaWRdIHVubGVzcyBAdmlzaWJsZUhpZ2hsaWdodHNbdGlsZUlkXT9baWRdP1xuXG4gICAgcmV0dXJuXG5cbiAgYWRkVG9MaW5lRGVjb3JhdGlvbkNhY2hlczogKGRlY29yYXRpb25JZCwgcHJvcGVydGllcywgYnVmZmVyUmFuZ2UsIHNjcmVlblJhbmdlLCByYW5nZUlzUmV2ZXJzZWQpIC0+XG4gICAgaWYgc2NyZWVuUmFuZ2UuaXNFbXB0eSgpXG4gICAgICByZXR1cm4gaWYgcHJvcGVydGllcy5vbmx5Tm9uRW1wdHlcbiAgICBlbHNlXG4gICAgICByZXR1cm4gaWYgcHJvcGVydGllcy5vbmx5RW1wdHlcbiAgICAgIG9taXRMYXN0Um93ID0gc2NyZWVuUmFuZ2UuZW5kLmNvbHVtbiBpcyAwXG5cbiAgICBpZiByYW5nZUlzUmV2ZXJzZWRcbiAgICAgIGhlYWRTY3JlZW5Qb3NpdGlvbiA9IHNjcmVlblJhbmdlLnN0YXJ0XG4gICAgZWxzZVxuICAgICAgaGVhZFNjcmVlblBvc2l0aW9uID0gc2NyZWVuUmFuZ2UuZW5kXG5cbiAgICBpZiBwcm9wZXJ0aWVzLmNsYXNzIGlzICdmb2xkZWQnIGFuZCBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnbGluZS1udW1iZXInKVxuICAgICAgc2NyZWVuUm93ID0gQG1vZGVsLnNjcmVlblJvd0ZvckJ1ZmZlclJvdyhidWZmZXJSYW5nZS5zdGFydC5yb3cpXG4gICAgICBAbGluZU51bWJlckRlY29yYXRpb25zQnlTY3JlZW5Sb3dbc2NyZWVuUm93XSA/PSB7fVxuICAgICAgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3NjcmVlblJvd11bZGVjb3JhdGlvbklkXSA9IHByb3BlcnRpZXNcbiAgICBlbHNlXG4gICAgICBmb3Igcm93IGluIFtzY3JlZW5SYW5nZS5zdGFydC5yb3cuLnNjcmVlblJhbmdlLmVuZC5yb3ddIGJ5IDFcbiAgICAgICAgY29udGludWUgaWYgcHJvcGVydGllcy5vbmx5SGVhZCBhbmQgcm93IGlzbnQgaGVhZFNjcmVlblBvc2l0aW9uLnJvd1xuICAgICAgICBjb250aW51ZSBpZiBvbWl0TGFzdFJvdyBhbmQgcm93IGlzIHNjcmVlblJhbmdlLmVuZC5yb3dcblxuICAgICAgICBpZiBEZWNvcmF0aW9uLmlzVHlwZShwcm9wZXJ0aWVzLCAnbGluZScpXG4gICAgICAgICAgQGxpbmVEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd10gPz0ge31cbiAgICAgICAgICBAbGluZURlY29yYXRpb25zQnlTY3JlZW5Sb3dbcm93XVtkZWNvcmF0aW9uSWRdID0gcHJvcGVydGllc1xuXG4gICAgICAgIGlmIERlY29yYXRpb24uaXNUeXBlKHByb3BlcnRpZXMsICdsaW5lLW51bWJlcicpXG4gICAgICAgICAgQGxpbmVOdW1iZXJEZWNvcmF0aW9uc0J5U2NyZWVuUm93W3Jvd10gPz0ge31cbiAgICAgICAgICBAbGluZU51bWJlckRlY29yYXRpb25zQnlTY3JlZW5Sb3dbcm93XVtkZWNvcmF0aW9uSWRdID0gcHJvcGVydGllc1xuXG4gICAgcmV0dXJuXG5cbiAgaW50ZXJzZWN0UmFuZ2VXaXRoVGlsZTogKHJhbmdlLCB0aWxlU3RhcnRSb3cpIC0+XG4gICAgaW50ZXJzZWN0aW5nU3RhcnRSb3cgPSBNYXRoLm1heCh0aWxlU3RhcnRSb3csIHJhbmdlLnN0YXJ0LnJvdylcbiAgICBpbnRlcnNlY3RpbmdFbmRSb3cgPSBNYXRoLm1pbih0aWxlU3RhcnRSb3cgKyBAdGlsZVNpemUgLSAxLCByYW5nZS5lbmQucm93KVxuICAgIGludGVyc2VjdGluZ1JhbmdlID0gbmV3IFJhbmdlKFxuICAgICAgbmV3IFBvaW50KGludGVyc2VjdGluZ1N0YXJ0Um93LCAwKSxcbiAgICAgIG5ldyBQb2ludChpbnRlcnNlY3RpbmdFbmRSb3csIEluZmluaXR5KVxuICAgIClcblxuICAgIGlmIGludGVyc2VjdGluZ1N0YXJ0Um93IGlzIHJhbmdlLnN0YXJ0LnJvd1xuICAgICAgaW50ZXJzZWN0aW5nUmFuZ2Uuc3RhcnQuY29sdW1uID0gcmFuZ2Uuc3RhcnQuY29sdW1uXG5cbiAgICBpZiBpbnRlcnNlY3RpbmdFbmRSb3cgaXMgcmFuZ2UuZW5kLnJvd1xuICAgICAgaW50ZXJzZWN0aW5nUmFuZ2UuZW5kLmNvbHVtbiA9IHJhbmdlLmVuZC5jb2x1bW5cblxuICAgIGludGVyc2VjdGluZ1JhbmdlXG5cbiAgdXBkYXRlSGlnaGxpZ2h0U3RhdGU6IChkZWNvcmF0aW9uSWQsIHByb3BlcnRpZXMsIHNjcmVlblJhbmdlKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0YXJ0Um93PyBhbmQgQGVuZFJvdz8gYW5kIEBsaW5lSGVpZ2h0PyBhbmQgQGhhc1BpeGVsUG9zaXRpb25SZXF1aXJlbWVudHMoKVxuXG4gICAgQGNvbnN0cmFpblJhbmdlVG9WaXNpYmxlUm93UmFuZ2Uoc2NyZWVuUmFuZ2UpXG5cbiAgICByZXR1cm4gaWYgc2NyZWVuUmFuZ2UuaXNFbXB0eSgpXG5cbiAgICBzdGFydFRpbGUgPSBAdGlsZUZvclJvdyhzY3JlZW5SYW5nZS5zdGFydC5yb3cpXG4gICAgZW5kVGlsZSA9IEB0aWxlRm9yUm93KHNjcmVlblJhbmdlLmVuZC5yb3cpXG4gICAgbmVlZHNGbGFzaCA9IHByb3BlcnRpZXMuZmxhc2hDb3VudD8gYW5kIEBmbGFzaENvdW50c0J5RGVjb3JhdGlvbklkW2RlY29yYXRpb25JZF0gaXNudCBwcm9wZXJ0aWVzLmZsYXNoQ291bnRcbiAgICBpZiBuZWVkc0ZsYXNoXG4gICAgICBAZmxhc2hDb3VudHNCeURlY29yYXRpb25JZFtkZWNvcmF0aW9uSWRdID0gcHJvcGVydGllcy5mbGFzaENvdW50XG5cbiAgICBmb3IgdGlsZVN0YXJ0Um93IGluIFtzdGFydFRpbGUuLmVuZFRpbGVdIGJ5IEB0aWxlU2l6ZVxuICAgICAgcmFuZ2VXaXRoaW5UaWxlID0gQGludGVyc2VjdFJhbmdlV2l0aFRpbGUoc2NyZWVuUmFuZ2UsIHRpbGVTdGFydFJvdylcblxuICAgICAgY29udGludWUgaWYgcmFuZ2VXaXRoaW5UaWxlLmlzRW1wdHkoKVxuXG4gICAgICB0aWxlU3RhdGUgPSBAc3RhdGUuY29udGVudC50aWxlc1t0aWxlU3RhcnRSb3ddID89IHtoaWdobGlnaHRzOiB7fX1cbiAgICAgIGhpZ2hsaWdodFN0YXRlID0gdGlsZVN0YXRlLmhpZ2hsaWdodHNbZGVjb3JhdGlvbklkXSA/PSB7fVxuXG4gICAgICBoaWdobGlnaHRTdGF0ZS5uZWVkc0ZsYXNoID0gbmVlZHNGbGFzaFxuICAgICAgaGlnaGxpZ2h0U3RhdGUuZmxhc2hDb3VudCA9IHByb3BlcnRpZXMuZmxhc2hDb3VudFxuICAgICAgaGlnaGxpZ2h0U3RhdGUuZmxhc2hDbGFzcyA9IHByb3BlcnRpZXMuZmxhc2hDbGFzc1xuICAgICAgaGlnaGxpZ2h0U3RhdGUuZmxhc2hEdXJhdGlvbiA9IHByb3BlcnRpZXMuZmxhc2hEdXJhdGlvblxuICAgICAgaGlnaGxpZ2h0U3RhdGUuY2xhc3MgPSBwcm9wZXJ0aWVzLmNsYXNzXG4gICAgICBoaWdobGlnaHRTdGF0ZS5kZXByZWNhdGVkUmVnaW9uQ2xhc3MgPSBwcm9wZXJ0aWVzLmRlcHJlY2F0ZWRSZWdpb25DbGFzc1xuICAgICAgaGlnaGxpZ2h0U3RhdGUucmVnaW9ucyA9IEBidWlsZEhpZ2hsaWdodFJlZ2lvbnMocmFuZ2VXaXRoaW5UaWxlKVxuXG4gICAgICBmb3IgcmVnaW9uIGluIGhpZ2hsaWdodFN0YXRlLnJlZ2lvbnNcbiAgICAgICAgQHJlcG9zaXRpb25SZWdpb25XaXRoaW5UaWxlKHJlZ2lvbiwgdGlsZVN0YXJ0Um93KVxuXG4gICAgICBAdmlzaWJsZUhpZ2hsaWdodHNbdGlsZVN0YXJ0Um93XSA/PSB7fVxuICAgICAgQHZpc2libGVIaWdobGlnaHRzW3RpbGVTdGFydFJvd11bZGVjb3JhdGlvbklkXSA9IHRydWVcblxuICAgIHRydWVcblxuICBjb25zdHJhaW5SYW5nZVRvVmlzaWJsZVJvd1JhbmdlOiAoc2NyZWVuUmFuZ2UpIC0+XG4gICAgaWYgc2NyZWVuUmFuZ2Uuc3RhcnQucm93IDwgQHN0YXJ0Um93XG4gICAgICBzY3JlZW5SYW5nZS5zdGFydC5yb3cgPSBAc3RhcnRSb3dcbiAgICAgIHNjcmVlblJhbmdlLnN0YXJ0LmNvbHVtbiA9IDBcblxuICAgIGlmIHNjcmVlblJhbmdlLmVuZC5yb3cgPCBAc3RhcnRSb3dcbiAgICAgIHNjcmVlblJhbmdlLmVuZC5yb3cgPSBAc3RhcnRSb3dcbiAgICAgIHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gPSAwXG5cbiAgICBpZiBzY3JlZW5SYW5nZS5zdGFydC5yb3cgPj0gQGVuZFJvd1xuICAgICAgc2NyZWVuUmFuZ2Uuc3RhcnQucm93ID0gQGVuZFJvd1xuICAgICAgc2NyZWVuUmFuZ2Uuc3RhcnQuY29sdW1uID0gMFxuXG4gICAgaWYgc2NyZWVuUmFuZ2UuZW5kLnJvdyA+PSBAZW5kUm93XG4gICAgICBzY3JlZW5SYW5nZS5lbmQucm93ID0gQGVuZFJvd1xuICAgICAgc2NyZWVuUmFuZ2UuZW5kLmNvbHVtbiA9IDBcblxuICByZXBvc2l0aW9uUmVnaW9uV2l0aGluVGlsZTogKHJlZ2lvbiwgdGlsZVN0YXJ0Um93KSAtPlxuICAgIHJlZ2lvbi50b3AgKz0gQHNjcm9sbFRvcCAtIEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkJlZm9yZUJsb2Nrc0ZvclJvdyh0aWxlU3RhcnRSb3cpXG5cbiAgYnVpbGRIaWdobGlnaHRSZWdpb25zOiAoc2NyZWVuUmFuZ2UpIC0+XG4gICAgbGluZUhlaWdodEluUGl4ZWxzID0gQGxpbmVIZWlnaHRcbiAgICBzdGFydFBpeGVsUG9zaXRpb24gPSBAcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblJhbmdlLnN0YXJ0KVxuICAgIGVuZFBpeGVsUG9zaXRpb24gPSBAcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblJhbmdlLmVuZClcbiAgICBzdGFydFBpeGVsUG9zaXRpb24ubGVmdCArPSBAc2Nyb2xsTGVmdFxuICAgIGVuZFBpeGVsUG9zaXRpb24ubGVmdCArPSBAc2Nyb2xsTGVmdFxuICAgIHNwYW5uZWRSb3dzID0gc2NyZWVuUmFuZ2UuZW5kLnJvdyAtIHNjcmVlblJhbmdlLnN0YXJ0LnJvdyArIDFcblxuICAgIHJlZ2lvbnMgPSBbXVxuXG4gICAgaWYgc3Bhbm5lZFJvd3MgaXMgMVxuICAgICAgcmVnaW9uID1cbiAgICAgICAgdG9wOiBzdGFydFBpeGVsUG9zaXRpb24udG9wXG4gICAgICAgIGhlaWdodDogbGluZUhlaWdodEluUGl4ZWxzXG4gICAgICAgIGxlZnQ6IHN0YXJ0UGl4ZWxQb3NpdGlvbi5sZWZ0XG5cbiAgICAgIGlmIHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gaXMgSW5maW5pdHlcbiAgICAgICAgcmVnaW9uLnJpZ2h0ID0gMFxuICAgICAgZWxzZVxuICAgICAgICByZWdpb24ud2lkdGggPSBlbmRQaXhlbFBvc2l0aW9uLmxlZnQgLSBzdGFydFBpeGVsUG9zaXRpb24ubGVmdFxuXG4gICAgICByZWdpb25zLnB1c2gocmVnaW9uKVxuICAgIGVsc2VcbiAgICAgICMgRmlyc3Qgcm93LCBleHRlbmRpbmcgZnJvbSBzZWxlY3Rpb24gc3RhcnQgdG8gdGhlIHJpZ2h0IHNpZGUgb2Ygc2NyZWVuXG4gICAgICByZWdpb25zLnB1c2goXG4gICAgICAgIHRvcDogc3RhcnRQaXhlbFBvc2l0aW9uLnRvcFxuICAgICAgICBsZWZ0OiBzdGFydFBpeGVsUG9zaXRpb24ubGVmdFxuICAgICAgICBoZWlnaHQ6IGxpbmVIZWlnaHRJblBpeGVsc1xuICAgICAgICByaWdodDogMFxuICAgICAgKVxuXG4gICAgICAjIE1pZGRsZSByb3dzLCBleHRlbmRpbmcgZnJvbSBsZWZ0IHNpZGUgdG8gcmlnaHQgc2lkZSBvZiBzY3JlZW5cbiAgICAgIGlmIHNwYW5uZWRSb3dzID4gMlxuICAgICAgICByZWdpb25zLnB1c2goXG4gICAgICAgICAgdG9wOiBzdGFydFBpeGVsUG9zaXRpb24udG9wICsgbGluZUhlaWdodEluUGl4ZWxzXG4gICAgICAgICAgaGVpZ2h0OiBlbmRQaXhlbFBvc2l0aW9uLnRvcCAtIHN0YXJ0UGl4ZWxQb3NpdGlvbi50b3AgLSBsaW5lSGVpZ2h0SW5QaXhlbHNcbiAgICAgICAgICBsZWZ0OiAwXG4gICAgICAgICAgcmlnaHQ6IDBcbiAgICAgICAgKVxuXG4gICAgICAjIExhc3Qgcm93LCBleHRlbmRpbmcgZnJvbSBsZWZ0IHNpZGUgb2Ygc2NyZWVuIHRvIHNlbGVjdGlvbiBlbmRcbiAgICAgIGlmIHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gPiAwXG4gICAgICAgIHJlZ2lvbiA9XG4gICAgICAgICAgdG9wOiBlbmRQaXhlbFBvc2l0aW9uLnRvcFxuICAgICAgICAgIGhlaWdodDogbGluZUhlaWdodEluUGl4ZWxzXG4gICAgICAgICAgbGVmdDogMFxuXG4gICAgICAgIGlmIHNjcmVlblJhbmdlLmVuZC5jb2x1bW4gaXMgSW5maW5pdHlcbiAgICAgICAgICByZWdpb24ucmlnaHQgPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZWdpb24ud2lkdGggPSBlbmRQaXhlbFBvc2l0aW9uLmxlZnRcblxuICAgICAgICByZWdpb25zLnB1c2gocmVnaW9uKVxuXG4gICAgcmVnaW9uc1xuXG4gIHNldE92ZXJsYXlEaW1lbnNpb25zOiAoZGVjb3JhdGlvbklkLCBpdGVtV2lkdGgsIGl0ZW1IZWlnaHQsIGNvbnRlbnRNYXJnaW4pIC0+XG4gICAgQG92ZXJsYXlEaW1lbnNpb25zW2RlY29yYXRpb25JZF0gPz0ge31cbiAgICBvdmVybGF5U3RhdGUgPSBAb3ZlcmxheURpbWVuc2lvbnNbZGVjb3JhdGlvbklkXVxuICAgIGRpbWVuc2lvbnNBcmVFcXVhbCA9IG92ZXJsYXlTdGF0ZS5pdGVtV2lkdGggaXMgaXRlbVdpZHRoIGFuZFxuICAgICAgb3ZlcmxheVN0YXRlLml0ZW1IZWlnaHQgaXMgaXRlbUhlaWdodCBhbmRcbiAgICAgIG92ZXJsYXlTdGF0ZS5jb250ZW50TWFyZ2luIGlzIGNvbnRlbnRNYXJnaW5cbiAgICB1bmxlc3MgZGltZW5zaW9uc0FyZUVxdWFsXG4gICAgICBvdmVybGF5U3RhdGUuaXRlbVdpZHRoID0gaXRlbVdpZHRoXG4gICAgICBvdmVybGF5U3RhdGUuaXRlbUhlaWdodCA9IGl0ZW1IZWlnaHRcbiAgICAgIG92ZXJsYXlTdGF0ZS5jb250ZW50TWFyZ2luID0gY29udGVudE1hcmdpblxuXG4gICAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBzZXRCbG9ja0RlY29yYXRpb25EaW1lbnNpb25zOiAoZGVjb3JhdGlvbiwgd2lkdGgsIGhlaWdodCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvYnNlcnZlZEJsb2NrRGVjb3JhdGlvbnMuaGFzKGRlY29yYXRpb24pXG5cbiAgICBAbGluZVRvcEluZGV4LnJlc2l6ZUJsb2NrKGRlY29yYXRpb24uaWQsIGhlaWdodClcblxuICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5kZWxldGUoZGVjb3JhdGlvbilcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgaW52YWxpZGF0ZUJsb2NrRGVjb3JhdGlvbkRpbWVuc2lvbnM6IChkZWNvcmF0aW9uKSAtPlxuICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5hZGQoZGVjb3JhdGlvbilcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc3BsaWNlQmxvY2tEZWNvcmF0aW9uc0luUmFuZ2U6IChzdGFydCwgZW5kLCBzY3JlZW5EZWx0YSkgLT5cbiAgICByZXR1cm4gaWYgc2NyZWVuRGVsdGEgaXMgMFxuXG4gICAgb2xkRXh0ZW50ID0gZW5kIC0gc3RhcnRcbiAgICBuZXdFeHRlbnQgPSBlbmQgLSBzdGFydCArIHNjcmVlbkRlbHRhXG4gICAgaW52YWxpZGF0ZWRCbG9ja0RlY29yYXRpb25JZHMgPSBAbGluZVRvcEluZGV4LnNwbGljZShzdGFydCwgb2xkRXh0ZW50LCBuZXdFeHRlbnQpXG4gICAgaW52YWxpZGF0ZWRCbG9ja0RlY29yYXRpb25JZHMuZm9yRWFjaCAoaWQpID0+XG4gICAgICBkZWNvcmF0aW9uID0gQG1vZGVsLmRlY29yYXRpb25Gb3JJZChpZClcbiAgICAgIG5ld1NjcmVlblBvc2l0aW9uID0gZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5nZXRIZWFkU2NyZWVuUG9zaXRpb24oKVxuICAgICAgQGxpbmVUb3BJbmRleC5tb3ZlQmxvY2soaWQsIG5ld1NjcmVlblBvc2l0aW9uLnJvdylcbiAgICAgIEBpbnZhbGlkYXRlZERpbWVuc2lvbnNCeUJsb2NrRGVjb3JhdGlvbi5hZGQoZGVjb3JhdGlvbilcblxuICBkaWRBZGRCbG9ja0RlY29yYXRpb246IChkZWNvcmF0aW9uKSAtPlxuICAgIHJldHVybiBpZiBub3QgZGVjb3JhdGlvbi5pc1R5cGUoJ2Jsb2NrJykgb3IgQG9ic2VydmVkQmxvY2tEZWNvcmF0aW9ucy5oYXMoZGVjb3JhdGlvbilcblxuICAgIGRpZE1vdmVEaXNwb3NhYmxlID0gZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5idWZmZXJNYXJrZXIub25EaWRDaGFuZ2UgKG1hcmtlckV2ZW50KSA9PlxuICAgICAgQGRpZE1vdmVCbG9ja0RlY29yYXRpb24oZGVjb3JhdGlvbiwgbWFya2VyRXZlbnQpXG5cbiAgICBkaWREZXN0cm95RGlzcG9zYWJsZSA9IGRlY29yYXRpb24ub25EaWREZXN0cm95ID0+XG4gICAgICBAZGlzcG9zYWJsZXMucmVtb3ZlKGRpZE1vdmVEaXNwb3NhYmxlKVxuICAgICAgQGRpc3Bvc2FibGVzLnJlbW92ZShkaWREZXN0cm95RGlzcG9zYWJsZSlcbiAgICAgIGRpZE1vdmVEaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgZGlkRGVzdHJveURpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICBAZGlkRGVzdHJveUJsb2NrRGVjb3JhdGlvbihkZWNvcmF0aW9uKVxuXG4gICAgaXNBZnRlciA9IGRlY29yYXRpb24uZ2V0UHJvcGVydGllcygpLnBvc2l0aW9uIGlzIFwiYWZ0ZXJcIlxuICAgIEBsaW5lVG9wSW5kZXguaW5zZXJ0QmxvY2soZGVjb3JhdGlvbi5pZCwgZGVjb3JhdGlvbi5nZXRNYXJrZXIoKS5nZXRIZWFkU2NyZWVuUG9zaXRpb24oKS5yb3csIDAsIGlzQWZ0ZXIpXG5cbiAgICBAb2JzZXJ2ZWRCbG9ja0RlY29yYXRpb25zLmFkZChkZWNvcmF0aW9uKVxuICAgIEBpbnZhbGlkYXRlQmxvY2tEZWNvcmF0aW9uRGltZW5zaW9ucyhkZWNvcmF0aW9uKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQoZGlkTW92ZURpc3Bvc2FibGUpXG4gICAgQGRpc3Bvc2FibGVzLmFkZChkaWREZXN0cm95RGlzcG9zYWJsZSlcbiAgICBAc2hvdWxkVXBkYXRlRGVjb3JhdGlvbnMgPSB0cnVlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgZGlkTW92ZUJsb2NrRGVjb3JhdGlvbjogKGRlY29yYXRpb24sIG1hcmtlckV2ZW50KSAtPlxuICAgICMgRG9uJ3QgbW92ZSBibG9ja3MgYWZ0ZXIgYSB0ZXh0IGNoYW5nZSwgYmVjYXVzZSB3ZSBhbHJlYWR5IHNwbGljZSBvbiBidWZmZXJcbiAgICAjIGNoYW5nZS5cbiAgICByZXR1cm4gaWYgbWFya2VyRXZlbnQudGV4dENoYW5nZWRcblxuICAgIEBsaW5lVG9wSW5kZXgubW92ZUJsb2NrKGRlY29yYXRpb24uaWQsIGRlY29yYXRpb24uZ2V0TWFya2VyKCkuZ2V0SGVhZFNjcmVlblBvc2l0aW9uKCkucm93KVxuICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBkaWREZXN0cm95QmxvY2tEZWNvcmF0aW9uOiAoZGVjb3JhdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBvYnNlcnZlZEJsb2NrRGVjb3JhdGlvbnMuaGFzKGRlY29yYXRpb24pXG5cbiAgICBAbGluZVRvcEluZGV4LnJlbW92ZUJsb2NrKGRlY29yYXRpb24uaWQpXG4gICAgQG9ic2VydmVkQmxvY2tEZWNvcmF0aW9ucy5kZWxldGUoZGVjb3JhdGlvbilcbiAgICBAaW52YWxpZGF0ZWREaW1lbnNpb25zQnlCbG9ja0RlY29yYXRpb24uZGVsZXRlKGRlY29yYXRpb24pXG4gICAgQHNob3VsZFVwZGF0ZURlY29yYXRpb25zID0gdHJ1ZVxuICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gIG9ic2VydmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgZGlkQ2hhbmdlUG9zaXRpb25EaXNwb3NhYmxlID0gY3Vyc29yLm9uRGlkQ2hhbmdlUG9zaXRpb24gPT5cbiAgICAgIEBwYXVzZUN1cnNvckJsaW5raW5nKClcblxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgICBkaWRDaGFuZ2VWaXNpYmlsaXR5RGlzcG9zYWJsZSA9IGN1cnNvci5vbkRpZENoYW5nZVZpc2liaWxpdHkgPT5cblxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgICBkaWREZXN0cm95RGlzcG9zYWJsZSA9IGN1cnNvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIEBkaXNwb3NhYmxlcy5yZW1vdmUoZGlkQ2hhbmdlUG9zaXRpb25EaXNwb3NhYmxlKVxuICAgICAgQGRpc3Bvc2FibGVzLnJlbW92ZShkaWRDaGFuZ2VWaXNpYmlsaXR5RGlzcG9zYWJsZSlcbiAgICAgIEBkaXNwb3NhYmxlcy5yZW1vdmUoZGlkRGVzdHJveURpc3Bvc2FibGUpXG5cbiAgICAgIEBlbWl0RGlkVXBkYXRlU3RhdGUoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZChkaWRDaGFuZ2VQb3NpdGlvbkRpc3Bvc2FibGUpXG4gICAgQGRpc3Bvc2FibGVzLmFkZChkaWRDaGFuZ2VWaXNpYmlsaXR5RGlzcG9zYWJsZSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkKGRpZERlc3Ryb3lEaXNwb3NhYmxlKVxuXG4gIGRpZEFkZEN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAb2JzZXJ2ZUN1cnNvcihjdXJzb3IpXG4gICAgQHBhdXNlQ3Vyc29yQmxpbmtpbmcoKVxuXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgc3RhcnRCbGlua2luZ0N1cnNvcnM6IC0+XG4gICAgdW5sZXNzIEBpc0N1cnNvckJsaW5raW5nKClcbiAgICAgIEBzdGF0ZS5jb250ZW50LmN1cnNvcnNWaXNpYmxlID0gdHJ1ZVxuICAgICAgQHRvZ2dsZUN1cnNvckJsaW5rSGFuZGxlID0gc2V0SW50ZXJ2YWwoQHRvZ2dsZUN1cnNvckJsaW5rLmJpbmQodGhpcyksIEBnZXRDdXJzb3JCbGlua1BlcmlvZCgpIC8gMilcblxuICBpc0N1cnNvckJsaW5raW5nOiAtPlxuICAgIEB0b2dnbGVDdXJzb3JCbGlua0hhbmRsZT9cblxuICBzdG9wQmxpbmtpbmdDdXJzb3JzOiAodmlzaWJsZSkgLT5cbiAgICBpZiBAaXNDdXJzb3JCbGlua2luZygpXG4gICAgICBAc3RhdGUuY29udGVudC5jdXJzb3JzVmlzaWJsZSA9IHZpc2libGVcbiAgICAgIGNsZWFySW50ZXJ2YWwoQHRvZ2dsZUN1cnNvckJsaW5rSGFuZGxlKVxuICAgICAgQHRvZ2dsZUN1cnNvckJsaW5rSGFuZGxlID0gbnVsbFxuXG4gIHRvZ2dsZUN1cnNvckJsaW5rOiAtPlxuICAgIEBzdGF0ZS5jb250ZW50LmN1cnNvcnNWaXNpYmxlID0gbm90IEBzdGF0ZS5jb250ZW50LmN1cnNvcnNWaXNpYmxlXG4gICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgcGF1c2VDdXJzb3JCbGlua2luZzogLT5cbiAgICBpZiBAaXNDdXJzb3JCbGlua2luZygpXG4gICAgICBAc3RvcEJsaW5raW5nQ3Vyc29ycyh0cnVlKVxuICAgICAgQHN0YXJ0QmxpbmtpbmdDdXJzb3JzQWZ0ZXJEZWxheSA/PSBfLmRlYm91bmNlKEBzdGFydEJsaW5raW5nQ3Vyc29ycywgQGdldEN1cnNvckJsaW5rUmVzdW1lRGVsYXkoKSlcbiAgICAgIEBzdGFydEJsaW5raW5nQ3Vyc29yc0FmdGVyRGVsYXkoKVxuICAgICAgQGVtaXREaWRVcGRhdGVTdGF0ZSgpXG5cbiAgcmVxdWVzdEF1dG9zY3JvbGw6IChwb3NpdGlvbikgLT5cbiAgICBAcGVuZGluZ1Njcm9sbExvZ2ljYWxQb3NpdGlvbiA9IHBvc2l0aW9uXG4gICAgQHBlbmRpbmdTY3JvbGxUb3AgPSBudWxsXG4gICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gbnVsbFxuICAgIEBzaG91bGRVcGRhdGVEZWNvcmF0aW9ucyA9IHRydWVcbiAgICBAZW1pdERpZFVwZGF0ZVN0YXRlKClcblxuICBkaWRDaGFuZ2VGaXJzdFZpc2libGVTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgQHNldFNjcm9sbFRvcChAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyhzY3JlZW5Sb3cpKVxuXG4gIGdldFZlcnRpY2FsU2Nyb2xsTWFyZ2luSW5QaXhlbHM6IC0+XG4gICAgTWF0aC5yb3VuZChAbW9kZWwuZ2V0VmVydGljYWxTY3JvbGxNYXJnaW4oKSAqIEBsaW5lSGVpZ2h0KVxuXG4gIGdldEhvcml6b250YWxTY3JvbGxNYXJnaW5JblBpeGVsczogLT5cbiAgICBNYXRoLnJvdW5kKEBtb2RlbC5nZXRIb3Jpem9udGFsU2Nyb2xsTWFyZ2luKCkgKiBAYmFzZUNoYXJhY3RlcldpZHRoKVxuXG4gIGdldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6IC0+XG4gICAgQHZlcnRpY2FsU2Nyb2xsYmFyV2lkdGhcblxuICBnZXRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0OiAtPlxuICAgIEBob3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0XG5cbiAgY29tbWl0UGVuZGluZ0xvZ2ljYWxTY3JvbGxUb3BQb3NpdGlvbjogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uP1xuXG4gICAge3NjcmVlblJhbmdlLCBvcHRpb25zfSA9IEBwZW5kaW5nU2Nyb2xsTG9naWNhbFBvc2l0aW9uXG5cbiAgICB2ZXJ0aWNhbFNjcm9sbE1hcmdpbkluUGl4ZWxzID0gQGdldFZlcnRpY2FsU2Nyb2xsTWFyZ2luSW5QaXhlbHMoKVxuXG4gICAgdG9wID0gQGxpbmVUb3BJbmRleC5waXhlbFBvc2l0aW9uQWZ0ZXJCbG9ja3NGb3JSb3coc2NyZWVuUmFuZ2Uuc3RhcnQucm93KVxuICAgIGJvdHRvbSA9IEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkFmdGVyQmxvY2tzRm9yUm93KHNjcmVlblJhbmdlLmVuZC5yb3cpICsgQGxpbmVIZWlnaHRcblxuICAgIGlmIG9wdGlvbnM/LmNlbnRlclxuICAgICAgZGVzaXJlZFNjcm9sbENlbnRlciA9ICh0b3AgKyBib3R0b20pIC8gMlxuICAgICAgdW5sZXNzIEBnZXRTY3JvbGxUb3AoKSA8IGRlc2lyZWRTY3JvbGxDZW50ZXIgPCBAZ2V0U2Nyb2xsQm90dG9tKClcbiAgICAgICAgZGVzaXJlZFNjcm9sbFRvcCA9IGRlc2lyZWRTY3JvbGxDZW50ZXIgLSBAZ2V0Q2xpZW50SGVpZ2h0KCkgLyAyXG4gICAgICAgIGRlc2lyZWRTY3JvbGxCb3R0b20gPSBkZXNpcmVkU2Nyb2xsQ2VudGVyICsgQGdldENsaWVudEhlaWdodCgpIC8gMlxuICAgIGVsc2VcbiAgICAgIGRlc2lyZWRTY3JvbGxUb3AgPSB0b3AgLSB2ZXJ0aWNhbFNjcm9sbE1hcmdpbkluUGl4ZWxzXG4gICAgICBkZXNpcmVkU2Nyb2xsQm90dG9tID0gYm90dG9tICsgdmVydGljYWxTY3JvbGxNYXJnaW5JblBpeGVsc1xuXG4gICAgaWYgb3B0aW9ucz8ucmV2ZXJzZWQgPyB0cnVlXG4gICAgICBpZiBkZXNpcmVkU2Nyb2xsQm90dG9tID4gQGdldFNjcm9sbEJvdHRvbSgpXG4gICAgICAgIEB1cGRhdGVTY3JvbGxUb3AoZGVzaXJlZFNjcm9sbEJvdHRvbSAtIEBnZXRDbGllbnRIZWlnaHQoKSlcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxUb3AgPCBAZ2V0U2Nyb2xsVG9wKClcbiAgICAgICAgQHVwZGF0ZVNjcm9sbFRvcChkZXNpcmVkU2Nyb2xsVG9wKVxuICAgIGVsc2VcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxUb3AgPCBAZ2V0U2Nyb2xsVG9wKClcbiAgICAgICAgQHVwZGF0ZVNjcm9sbFRvcChkZXNpcmVkU2Nyb2xsVG9wKVxuICAgICAgaWYgZGVzaXJlZFNjcm9sbEJvdHRvbSA+IEBnZXRTY3JvbGxCb3R0b20oKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsVG9wKGRlc2lyZWRTY3JvbGxCb3R0b20gLSBAZ2V0Q2xpZW50SGVpZ2h0KCkpXG5cbiAgY29tbWl0UGVuZGluZ0xvZ2ljYWxTY3JvbGxMZWZ0UG9zaXRpb246IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGVuZGluZ1Njcm9sbExvZ2ljYWxQb3NpdGlvbj9cblxuICAgIHtzY3JlZW5SYW5nZSwgb3B0aW9uc30gPSBAcGVuZGluZ1Njcm9sbExvZ2ljYWxQb3NpdGlvblxuXG4gICAgaG9yaXpvbnRhbFNjcm9sbE1hcmdpbkluUGl4ZWxzID0gQGdldEhvcml6b250YWxTY3JvbGxNYXJnaW5JblBpeGVscygpXG5cbiAgICB7bGVmdH0gPSBAcGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2UobmV3IFJhbmdlKHNjcmVlblJhbmdlLnN0YXJ0LCBzY3JlZW5SYW5nZS5zdGFydCkpXG4gICAge2xlZnQ6IHJpZ2h0fSA9IEBwaXhlbFJlY3RGb3JTY3JlZW5SYW5nZShuZXcgUmFuZ2Uoc2NyZWVuUmFuZ2UuZW5kLCBzY3JlZW5SYW5nZS5lbmQpKVxuXG4gICAgbGVmdCArPSBAc2Nyb2xsTGVmdFxuICAgIHJpZ2h0ICs9IEBzY3JvbGxMZWZ0XG5cbiAgICBkZXNpcmVkU2Nyb2xsTGVmdCA9IGxlZnQgLSBob3Jpem9udGFsU2Nyb2xsTWFyZ2luSW5QaXhlbHNcbiAgICBkZXNpcmVkU2Nyb2xsUmlnaHQgPSByaWdodCArIGhvcml6b250YWxTY3JvbGxNYXJnaW5JblBpeGVsc1xuXG4gICAgaWYgb3B0aW9ucz8ucmV2ZXJzZWQgPyB0cnVlXG4gICAgICBpZiBkZXNpcmVkU2Nyb2xsUmlnaHQgPiBAZ2V0U2Nyb2xsUmlnaHQoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsTGVmdChkZXNpcmVkU2Nyb2xsUmlnaHQgLSBAZ2V0Q2xpZW50V2lkdGgoKSlcbiAgICAgIGlmIGRlc2lyZWRTY3JvbGxMZWZ0IDwgQGdldFNjcm9sbExlZnQoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsTGVmdChkZXNpcmVkU2Nyb2xsTGVmdClcbiAgICBlbHNlXG4gICAgICBpZiBkZXNpcmVkU2Nyb2xsTGVmdCA8IEBnZXRTY3JvbGxMZWZ0KClcbiAgICAgICAgQHVwZGF0ZVNjcm9sbExlZnQoZGVzaXJlZFNjcm9sbExlZnQpXG4gICAgICBpZiBkZXNpcmVkU2Nyb2xsUmlnaHQgPiBAZ2V0U2Nyb2xsUmlnaHQoKVxuICAgICAgICBAdXBkYXRlU2Nyb2xsTGVmdChkZXNpcmVkU2Nyb2xsUmlnaHQgLSBAZ2V0Q2xpZW50V2lkdGgoKSlcblxuICBjb21taXRQZW5kaW5nU2Nyb2xsTGVmdFBvc2l0aW9uOiAtPlxuICAgIGlmIEBwZW5kaW5nU2Nyb2xsTGVmdD9cbiAgICAgIEB1cGRhdGVTY3JvbGxMZWZ0KEBwZW5kaW5nU2Nyb2xsTGVmdClcbiAgICAgIEBwZW5kaW5nU2Nyb2xsTGVmdCA9IG51bGxcblxuICBjb21taXRQZW5kaW5nU2Nyb2xsVG9wUG9zaXRpb246IC0+XG4gICAgaWYgQHBlbmRpbmdTY3JvbGxUb3A/XG4gICAgICBAdXBkYXRlU2Nyb2xsVG9wKEBwZW5kaW5nU2Nyb2xsVG9wKVxuICAgICAgQHBlbmRpbmdTY3JvbGxUb3AgPSBudWxsXG5cbiAgY2xlYXJQZW5kaW5nU2Nyb2xsUG9zaXRpb246IC0+XG4gICAgQHBlbmRpbmdTY3JvbGxMb2dpY2FsUG9zaXRpb24gPSBudWxsXG4gICAgQHBlbmRpbmdTY3JvbGxUb3AgPSBudWxsXG4gICAgQHBlbmRpbmdTY3JvbGxMZWZ0ID0gbnVsbFxuXG4gIGNhblNjcm9sbExlZnRUbzogKHNjcm9sbExlZnQpIC0+XG4gICAgQHNjcm9sbExlZnQgaXNudCBAY29uc3RyYWluU2Nyb2xsTGVmdChzY3JvbGxMZWZ0KVxuXG4gIGNhblNjcm9sbFRvcFRvOiAoc2Nyb2xsVG9wKSAtPlxuICAgIEBzY3JvbGxUb3AgaXNudCBAY29uc3RyYWluU2Nyb2xsVG9wKHNjcm9sbFRvcClcblxuICByZXN0b3JlU2Nyb2xsVG9wSWZOZWVkZWQ6IC0+XG4gICAgdW5sZXNzIEBzY3JvbGxUb3A/XG4gICAgICBAdXBkYXRlU2Nyb2xsVG9wKEBsaW5lVG9wSW5kZXgucGl4ZWxQb3NpdGlvbkFmdGVyQmxvY2tzRm9yUm93KEBtb2RlbC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKSkpXG5cbiAgcmVzdG9yZVNjcm9sbExlZnRJZk5lZWRlZDogLT5cbiAgICB1bmxlc3MgQHNjcm9sbExlZnQ/XG4gICAgICBAdXBkYXRlU2Nyb2xsTGVmdChAbW9kZWwuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKCkgKiBAYmFzZUNoYXJhY3RlcldpZHRoKVxuXG4gIG9uRGlkQ2hhbmdlU2Nyb2xsVG9wOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2Utc2Nyb2xsLXRvcCcsIGNhbGxiYWNrXG5cbiAgb25EaWRDaGFuZ2VTY3JvbGxMZWZ0OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2Utc2Nyb2xsLWxlZnQnLCBjYWxsYmFja1xuXG4gIGdldFZpc2libGVSb3dSYW5nZTogLT5cbiAgICBbQHN0YXJ0Um93LCBAZW5kUm93XVxuXG4gIGlzUm93UmVuZGVyZWQ6IChyb3cpIC0+XG4gICAgQGdldFN0YXJ0VGlsZVJvdygpIDw9IHJvdyA8IEBnZXRFbmRUaWxlUm93KCkgKyBAdGlsZVNpemVcblxuICBpc09wZW5UYWdDb2RlOiAodGFnQ29kZSkgLT5cbiAgICBAZGlzcGxheUxheWVyLmlzT3BlblRhZ0NvZGUodGFnQ29kZSlcblxuICBpc0Nsb3NlVGFnQ29kZTogKHRhZ0NvZGUpIC0+XG4gICAgQGRpc3BsYXlMYXllci5pc0Nsb3NlVGFnQ29kZSh0YWdDb2RlKVxuXG4gIHRhZ0ZvckNvZGU6ICh0YWdDb2RlKSAtPlxuICAgIEBkaXNwbGF5TGF5ZXIudGFnRm9yQ29kZSh0YWdDb2RlKVxuIl19
