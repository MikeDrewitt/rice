(function() {
  var Emitter, Model, NonWhitespaceRegExp, Point, Range, Selection, pick, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('text-buffer'), Point = ref.Point, Range = ref.Range;

  pick = require('underscore-plus').pick;

  Emitter = require('event-kit').Emitter;

  Model = require('./model');

  NonWhitespaceRegExp = /\S/;

  module.exports = Selection = (function(superClass) {
    extend(Selection, superClass);

    Selection.prototype.cursor = null;

    Selection.prototype.marker = null;

    Selection.prototype.editor = null;

    Selection.prototype.initialScreenRange = null;

    Selection.prototype.wordwise = false;

    function Selection(arg) {
      var id;
      this.cursor = arg.cursor, this.marker = arg.marker, this.editor = arg.editor, id = arg.id;
      this.emitter = new Emitter;
      this.assignId(id);
      this.cursor.selection = this;
      this.decoration = this.editor.decorateMarker(this.marker, {
        type: 'highlight',
        "class": 'selection'
      });
      this.marker.onDidChange((function(_this) {
        return function(e) {
          return _this.markerDidChange(e);
        };
      })(this));
      this.marker.onDidDestroy((function(_this) {
        return function() {
          return _this.markerDidDestroy();
        };
      })(this));
    }

    Selection.prototype.destroy = function() {
      return this.marker.destroy();
    };

    Selection.prototype.isLastSelection = function() {
      return this === this.editor.getLastSelection();
    };


    /*
    Section: Event Subscription
     */

    Selection.prototype.onDidChangeRange = function(callback) {
      return this.emitter.on('did-change-range', callback);
    };

    Selection.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Managing the selection range
     */

    Selection.prototype.getScreenRange = function() {
      return this.marker.getScreenRange();
    };

    Selection.prototype.setScreenRange = function(screenRange, options) {
      return this.setBufferRange(this.editor.bufferRangeForScreenRange(screenRange), options);
    };

    Selection.prototype.getBufferRange = function() {
      return this.marker.getBufferRange();
    };

    Selection.prototype.setBufferRange = function(bufferRange, options) {
      if (options == null) {
        options = {};
      }
      bufferRange = Range.fromObject(bufferRange);
      if (options.reversed == null) {
        options.reversed = this.isReversed();
      }
      if (!options.preserveFolds) {
        this.editor.destroyFoldsIntersectingBufferRange(bufferRange);
      }
      return this.modifySelection((function(_this) {
        return function() {
          var needsFlash, ref1;
          needsFlash = options.flash;
          if (options.flash != null) {
            delete options.flash;
          }
          _this.marker.setBufferRange(bufferRange, options);
          if ((ref1 = options != null ? options.autoscroll : void 0) != null ? ref1 : _this.isLastSelection()) {
            _this.autoscroll();
          }
          if (needsFlash) {
            return _this.decoration.flash('flash', _this.editor.selectionFlashDuration);
          }
        };
      })(this));
    };

    Selection.prototype.getBufferRowRange = function() {
      var end, range, start;
      range = this.getBufferRange();
      start = range.start.row;
      end = range.end.row;
      if (range.end.column === 0) {
        end = Math.max(start, end - 1);
      }
      return [start, end];
    };

    Selection.prototype.getTailScreenPosition = function() {
      return this.marker.getTailScreenPosition();
    };

    Selection.prototype.getTailBufferPosition = function() {
      return this.marker.getTailBufferPosition();
    };

    Selection.prototype.getHeadScreenPosition = function() {
      return this.marker.getHeadScreenPosition();
    };

    Selection.prototype.getHeadBufferPosition = function() {
      return this.marker.getHeadBufferPosition();
    };


    /*
    Section: Info about the selection
     */

    Selection.prototype.isEmpty = function() {
      return this.getBufferRange().isEmpty();
    };

    Selection.prototype.isReversed = function() {
      return this.marker.isReversed();
    };

    Selection.prototype.isSingleScreenLine = function() {
      return this.getScreenRange().isSingleLine();
    };

    Selection.prototype.getText = function() {
      return this.editor.buffer.getTextInRange(this.getBufferRange());
    };

    Selection.prototype.intersectsBufferRange = function(bufferRange) {
      return this.getBufferRange().intersectsWith(bufferRange);
    };

    Selection.prototype.intersectsScreenRowRange = function(startRow, endRow) {
      return this.getScreenRange().intersectsRowRange(startRow, endRow);
    };

    Selection.prototype.intersectsScreenRow = function(screenRow) {
      return this.getScreenRange().intersectsRow(screenRow);
    };

    Selection.prototype.intersectsWith = function(otherSelection, exclusive) {
      return this.getBufferRange().intersectsWith(otherSelection.getBufferRange(), exclusive);
    };


    /*
    Section: Modifying the selected range
     */

    Selection.prototype.clear = function(options) {
      var ref1;
      this.goalScreenRange = null;
      if (!this.retainSelection) {
        this.marker.clearTail();
      }
      if ((ref1 = options != null ? options.autoscroll : void 0) != null ? ref1 : this.isLastSelection()) {
        this.autoscroll();
      }
      return this.finalize();
    };

    Selection.prototype.selectToScreenPosition = function(position, options) {
      position = Point.fromObject(position);
      return this.modifySelection((function(_this) {
        return function() {
          if (_this.initialScreenRange) {
            if (position.isLessThan(_this.initialScreenRange.start)) {
              _this.marker.setScreenRange([position, _this.initialScreenRange.end], {
                reversed: true
              });
            } else {
              _this.marker.setScreenRange([_this.initialScreenRange.start, position], {
                reversed: false
              });
            }
          } else {
            _this.cursor.setScreenPosition(position, options);
          }
          if (_this.linewise) {
            return _this.expandOverLine(options);
          } else if (_this.wordwise) {
            return _this.expandOverWord(options);
          }
        };
      })(this));
    };

    Selection.prototype.selectToBufferPosition = function(position) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.setBufferPosition(position);
        };
      })(this));
    };

    Selection.prototype.selectRight = function(columnCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveRight(columnCount);
        };
      })(this));
    };

    Selection.prototype.selectLeft = function(columnCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveLeft(columnCount);
        };
      })(this));
    };

    Selection.prototype.selectUp = function(rowCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveUp(rowCount);
        };
      })(this));
    };

    Selection.prototype.selectDown = function(rowCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveDown(rowCount);
        };
      })(this));
    };

    Selection.prototype.selectToTop = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToTop();
        };
      })(this));
    };

    Selection.prototype.selectToBottom = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBottom();
        };
      })(this));
    };

    Selection.prototype.selectAll = function() {
      return this.setBufferRange(this.editor.buffer.getRange(), {
        autoscroll: false
      });
    };

    Selection.prototype.selectToBeginningOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfLine();
        };
      })(this));
    };

    Selection.prototype.selectToFirstCharacterOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToFirstCharacterOfLine();
        };
      })(this));
    };

    Selection.prototype.selectToEndOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToEndOfScreenLine();
        };
      })(this));
    };

    Selection.prototype.selectToEndOfBufferLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToEndOfLine();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfWord();
        };
      })(this));
    };

    Selection.prototype.selectToEndOfWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToEndOfWord();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfNextWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfNextWord();
        };
      })(this));
    };

    Selection.prototype.selectToPreviousWordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToPreviousWordBoundary();
        };
      })(this));
    };

    Selection.prototype.selectToNextWordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToNextWordBoundary();
        };
      })(this));
    };

    Selection.prototype.selectToPreviousSubwordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToPreviousSubwordBoundary();
        };
      })(this));
    };

    Selection.prototype.selectToNextSubwordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToNextSubwordBoundary();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfNextParagraph = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfNextParagraph();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfPreviousParagraph = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfPreviousParagraph();
        };
      })(this));
    };

    Selection.prototype.selectWord = function(options) {
      if (options == null) {
        options = {};
      }
      if (this.cursor.isSurroundedByWhitespace()) {
        options.wordRegex = /[\t ]*/;
      }
      if (this.cursor.isBetweenWordAndNonWord()) {
        options.includeNonWordCharacters = false;
      }
      this.setBufferRange(this.cursor.getCurrentWordBufferRange(options), options);
      this.wordwise = true;
      return this.initialScreenRange = this.getScreenRange();
    };

    Selection.prototype.expandOverWord = function(options) {
      var ref1;
      this.setBufferRange(this.getBufferRange().union(this.cursor.getCurrentWordBufferRange()), {
        autoscroll: false
      });
      if ((ref1 = options != null ? options.autoscroll : void 0) != null ? ref1 : true) {
        return this.cursor.autoscroll();
      }
    };

    Selection.prototype.selectLine = function(row, options) {
      var endRange, startRange;
      if (row != null) {
        this.setBufferRange(this.editor.bufferRangeForBufferRow(row, {
          includeNewline: true
        }), options);
      } else {
        startRange = this.editor.bufferRangeForBufferRow(this.marker.getStartBufferPosition().row);
        endRange = this.editor.bufferRangeForBufferRow(this.marker.getEndBufferPosition().row, {
          includeNewline: true
        });
        this.setBufferRange(startRange.union(endRange), options);
      }
      this.linewise = true;
      this.wordwise = false;
      return this.initialScreenRange = this.getScreenRange();
    };

    Selection.prototype.expandOverLine = function(options) {
      var range, ref1;
      range = this.getBufferRange().union(this.cursor.getCurrentLineBufferRange({
        includeNewline: true
      }));
      this.setBufferRange(range, {
        autoscroll: false
      });
      if ((ref1 = options != null ? options.autoscroll : void 0) != null ? ref1 : true) {
        return this.cursor.autoscroll();
      }
    };


    /*
    Section: Modifying the selected text
     */

    Selection.prototype.insertText = function(text, options) {
      var autoIndentFirstLine, desiredIndentLevel, firstInsertedLine, firstLine, indentAdjustment, newBufferRange, oldBufferRange, precedingText, remainingLines, textIsAutoIndentable, wasReversed;
      if (options == null) {
        options = {};
      }
      oldBufferRange = this.getBufferRange();
      wasReversed = this.isReversed();
      this.clear();
      autoIndentFirstLine = false;
      precedingText = this.editor.getTextInRange([[oldBufferRange.start.row, 0], oldBufferRange.start]);
      remainingLines = text.split('\n');
      firstInsertedLine = remainingLines.shift();
      if (options.indentBasis != null) {
        indentAdjustment = this.editor.indentLevelForLine(precedingText) - options.indentBasis;
        this.adjustIndent(remainingLines, indentAdjustment);
      }
      textIsAutoIndentable = text === '\n' || text === '\r\n' || NonWhitespaceRegExp.test(text);
      if (options.autoIndent && textIsAutoIndentable && !NonWhitespaceRegExp.test(precedingText) && remainingLines.length > 0) {
        autoIndentFirstLine = true;
        firstLine = precedingText + firstInsertedLine;
        desiredIndentLevel = this.editor.languageMode.suggestedIndentForLineAtBufferRow(oldBufferRange.start.row, firstLine);
        indentAdjustment = desiredIndentLevel - this.editor.indentLevelForLine(firstLine);
        this.adjustIndent(remainingLines, indentAdjustment);
      }
      text = firstInsertedLine;
      if (remainingLines.length > 0) {
        text += '\n' + remainingLines.join('\n');
      }
      newBufferRange = this.editor.buffer.setTextInRange(oldBufferRange, text, pick(options, 'undo', 'normalizeLineEndings'));
      if (options.select) {
        this.setBufferRange(newBufferRange, {
          reversed: wasReversed
        });
      } else {
        if (wasReversed) {
          this.cursor.setBufferPosition(newBufferRange.end);
        }
      }
      if (autoIndentFirstLine) {
        this.editor.setIndentationForBufferRow(oldBufferRange.start.row, desiredIndentLevel);
      }
      if (options.autoIndentNewline && text === '\n') {
        this.editor.autoIndentBufferRow(newBufferRange.end.row, {
          preserveLeadingWhitespace: true,
          skipBlankLines: false
        });
      } else if (options.autoDecreaseIndent && NonWhitespaceRegExp.test(text)) {
        this.editor.autoDecreaseIndentForBufferRow(newBufferRange.start.row);
      }
      if (this.isLastSelection()) {
        this.autoscroll();
      }
      return newBufferRange;
    };

    Selection.prototype.backspace = function() {
      if (this.isEmpty()) {
        this.selectLeft();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToPreviousWordBoundary = function() {
      if (this.isEmpty()) {
        this.selectToPreviousWordBoundary();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToNextWordBoundary = function() {
      if (this.isEmpty()) {
        this.selectToNextWordBoundary();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToBeginningOfWord = function() {
      if (this.isEmpty()) {
        this.selectToBeginningOfWord();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToBeginningOfLine = function() {
      if (this.isEmpty() && this.cursor.isAtBeginningOfLine()) {
        this.selectLeft();
      } else {
        this.selectToBeginningOfLine();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype["delete"] = function() {
      if (this.isEmpty()) {
        this.selectRight();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToEndOfLine = function() {
      if (this.isEmpty() && this.cursor.isAtEndOfLine()) {
        return this["delete"]();
      }
      if (this.isEmpty()) {
        this.selectToEndOfLine();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToEndOfWord = function() {
      if (this.isEmpty()) {
        this.selectToEndOfWord();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToBeginningOfSubword = function() {
      if (this.isEmpty()) {
        this.selectToPreviousSubwordBoundary();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToEndOfSubword = function() {
      if (this.isEmpty()) {
        this.selectToNextSubwordBoundary();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteSelectedText = function() {
      var bufferRange, ref1;
      bufferRange = this.getBufferRange();
      if (!bufferRange.isEmpty()) {
        this.editor.buffer["delete"](bufferRange);
      }
      return (ref1 = this.cursor) != null ? ref1.setBufferPosition(bufferRange.start) : void 0;
    };

    Selection.prototype.deleteLine = function() {
      var end, range, start;
      if (this.isEmpty()) {
        start = this.cursor.getScreenRow();
        range = this.editor.bufferRowsForScreenRows(start, start + 1);
        if (range[1] > range[0]) {
          return this.editor.buffer.deleteRows(range[0], range[1] - 1);
        } else {
          return this.editor.buffer.deleteRow(range[0]);
        }
      } else {
        range = this.getBufferRange();
        start = range.start.row;
        end = range.end.row;
        if (end !== this.editor.buffer.getLastRow() && range.end.column === 0) {
          end--;
        }
        return this.editor.buffer.deleteRows(start, end);
      }
    };

    Selection.prototype.joinLines = function() {
      var currentRow, insertSpace, j, joinMarker, newSelectedRange, nextRow, ref1, rowCount, scanRange, selectedRange, trailingWhitespaceRange;
      selectedRange = this.getBufferRange();
      if (selectedRange.isEmpty()) {
        if (selectedRange.start.row === this.editor.buffer.getLastRow()) {
          return;
        }
      } else {
        joinMarker = this.editor.markBufferRange(selectedRange, {
          invalidate: 'never'
        });
      }
      rowCount = Math.max(1, selectedRange.getRowCount() - 1);
      for (j = 0, ref1 = rowCount; 0 <= ref1 ? j < ref1 : j > ref1; 0 <= ref1 ? j++ : j--) {
        this.cursor.setBufferPosition([selectedRange.start.row]);
        this.cursor.moveToEndOfLine();
        scanRange = this.cursor.getCurrentLineBufferRange();
        trailingWhitespaceRange = null;
        this.editor.scanInBufferRange(/[ \t]+$/, scanRange, function(arg) {
          var range;
          range = arg.range;
          return trailingWhitespaceRange = range;
        });
        if (trailingWhitespaceRange != null) {
          this.setBufferRange(trailingWhitespaceRange);
          this.deleteSelectedText();
        }
        currentRow = selectedRange.start.row;
        nextRow = currentRow + 1;
        insertSpace = nextRow <= this.editor.buffer.getLastRow() && this.editor.buffer.lineLengthForRow(nextRow) > 0 && this.editor.buffer.lineLengthForRow(currentRow) > 0;
        if (insertSpace) {
          this.insertText(' ');
        }
        this.cursor.moveToEndOfLine();
        this.modifySelection((function(_this) {
          return function() {
            _this.cursor.moveRight();
            return _this.cursor.moveToFirstCharacterOfLine();
          };
        })(this));
        this.deleteSelectedText();
        if (insertSpace) {
          this.cursor.moveLeft();
        }
      }
      if (joinMarker != null) {
        newSelectedRange = joinMarker.getBufferRange();
        this.setBufferRange(newSelectedRange);
        return joinMarker.destroy();
      }
    };

    Selection.prototype.outdentSelectedRows = function() {
      var buffer, end, j, leadingTabRegex, matchLength, ref1, ref2, ref3, ref4, row, start;
      ref1 = this.getBufferRowRange(), start = ref1[0], end = ref1[1];
      buffer = this.editor.buffer;
      leadingTabRegex = new RegExp("^( {1," + (this.editor.getTabLength()) + "}|\t)");
      for (row = j = ref2 = start, ref3 = end; ref2 <= ref3 ? j <= ref3 : j >= ref3; row = ref2 <= ref3 ? ++j : --j) {
        if (matchLength = (ref4 = buffer.lineForRow(row).match(leadingTabRegex)) != null ? ref4[0].length : void 0) {
          buffer["delete"]([[row, 0], [row, matchLength]]);
        }
      }
    };

    Selection.prototype.autoIndentSelectedRows = function() {
      var end, ref1, start;
      ref1 = this.getBufferRowRange(), start = ref1[0], end = ref1[1];
      return this.editor.autoIndentBufferRows(start, end);
    };

    Selection.prototype.toggleLineComments = function() {
      var ref1;
      return (ref1 = this.editor).toggleLineCommentsForBufferRows.apply(ref1, this.getBufferRowRange());
    };

    Selection.prototype.cutToEndOfLine = function(maintainClipboard) {
      if (this.isEmpty()) {
        this.selectToEndOfLine();
      }
      return this.cut(maintainClipboard);
    };

    Selection.prototype.cutToEndOfBufferLine = function(maintainClipboard) {
      if (this.isEmpty()) {
        this.selectToEndOfBufferLine();
      }
      return this.cut(maintainClipboard);
    };

    Selection.prototype.cut = function(maintainClipboard, fullLine) {
      if (maintainClipboard == null) {
        maintainClipboard = false;
      }
      if (fullLine == null) {
        fullLine = false;
      }
      this.copy(maintainClipboard, fullLine);
      return this["delete"]();
    };

    Selection.prototype.copy = function(maintainClipboard, fullLine) {
      var clipboardText, end, metadata, precedingText, ref1, ref2, selectionText, start, startLevel;
      if (maintainClipboard == null) {
        maintainClipboard = false;
      }
      if (fullLine == null) {
        fullLine = false;
      }
      if (this.isEmpty()) {
        return;
      }
      ref1 = this.getBufferRange(), start = ref1.start, end = ref1.end;
      selectionText = this.editor.getTextInRange([start, end]);
      precedingText = this.editor.getTextInRange([[start.row, 0], start]);
      startLevel = this.editor.indentLevelForLine(precedingText);
      if (maintainClipboard) {
        ref2 = this.editor.constructor.clipboard.readWithMetadata(), clipboardText = ref2.text, metadata = ref2.metadata;
        if (metadata == null) {
          metadata = {};
        }
        if (metadata.selections == null) {
          metadata.selections = [
            {
              text: clipboardText,
              indentBasis: metadata.indentBasis,
              fullLine: metadata.fullLine
            }
          ];
        }
        metadata.selections.push({
          text: selectionText,
          indentBasis: startLevel,
          fullLine: fullLine
        });
        return this.editor.constructor.clipboard.write([clipboardText, selectionText].join("\n"), metadata);
      } else {
        return this.editor.constructor.clipboard.write(selectionText, {
          indentBasis: startLevel,
          fullLine: fullLine
        });
      }
    };

    Selection.prototype.fold = function() {
      var range;
      range = this.getBufferRange();
      if (!range.isEmpty()) {
        this.editor.foldBufferRange(range);
        return this.cursor.setBufferPosition(range.end);
      }
    };

    Selection.prototype.adjustIndent = function(lines, indentAdjustment) {
      var currentIndentLevel, i, indentLevel, j, len, line;
      for (i = j = 0, len = lines.length; j < len; i = ++j) {
        line = lines[i];
        if (indentAdjustment === 0 || line === '') {
          continue;
        } else if (indentAdjustment > 0) {
          lines[i] = this.editor.buildIndentString(indentAdjustment) + line;
        } else {
          currentIndentLevel = this.editor.indentLevelForLine(lines[i]);
          indentLevel = Math.max(0, currentIndentLevel + indentAdjustment);
          lines[i] = line.replace(/^[\t ]+/, this.editor.buildIndentString(indentLevel));
        }
      }
    };

    Selection.prototype.indent = function(arg) {
      var autoIndent, delta, desiredIndent, row;
      autoIndent = (arg != null ? arg : {}).autoIndent;
      row = this.cursor.getBufferPosition().row;
      if (this.isEmpty()) {
        this.cursor.skipLeadingWhitespace();
        desiredIndent = this.editor.suggestedIndentForBufferRow(row);
        delta = desiredIndent - this.cursor.getIndentLevel();
        if (autoIndent && delta > 0) {
          if (!this.editor.getSoftTabs()) {
            delta = Math.max(delta, 1);
          }
          return this.insertText(this.editor.buildIndentString(delta));
        } else {
          return this.insertText(this.editor.buildIndentString(1, this.cursor.getBufferColumn()));
        }
      } else {
        return this.indentSelectedRows();
      }
    };

    Selection.prototype.indentSelectedRows = function() {
      var end, j, ref1, ref2, ref3, row, start;
      ref1 = this.getBufferRowRange(), start = ref1[0], end = ref1[1];
      for (row = j = ref2 = start, ref3 = end; ref2 <= ref3 ? j <= ref3 : j >= ref3; row = ref2 <= ref3 ? ++j : --j) {
        if (this.editor.buffer.lineLengthForRow(row) !== 0) {
          this.editor.buffer.insert([row, 0], this.editor.getTabText());
        }
      }
    };


    /*
    Section: Managing multiple selections
     */

    Selection.prototype.addSelectionBelow = function() {
      var clippedRange, j, nextRow, range, ref1, ref2, row, selection;
      range = this.getGoalScreenRange().copy();
      nextRow = range.end.row + 1;
      for (row = j = ref1 = nextRow, ref2 = this.editor.getLastScreenRow(); ref1 <= ref2 ? j <= ref2 : j >= ref2; row = ref1 <= ref2 ? ++j : --j) {
        range.start.row = row;
        range.end.row = row;
        clippedRange = this.editor.clipScreenRange(range, {
          skipSoftWrapIndentation: true
        });
        if (range.isEmpty()) {
          if (range.end.column > 0 && clippedRange.end.column === 0) {
            continue;
          }
        } else {
          if (clippedRange.isEmpty()) {
            continue;
          }
        }
        selection = this.editor.addSelectionForScreenRange(clippedRange);
        selection.setGoalScreenRange(range);
        break;
      }
    };

    Selection.prototype.addSelectionAbove = function() {
      var clippedRange, j, previousRow, range, ref1, row, selection;
      range = this.getGoalScreenRange().copy();
      previousRow = range.end.row - 1;
      for (row = j = ref1 = previousRow; ref1 <= 0 ? j <= 0 : j >= 0; row = ref1 <= 0 ? ++j : --j) {
        range.start.row = row;
        range.end.row = row;
        clippedRange = this.editor.clipScreenRange(range, {
          skipSoftWrapIndentation: true
        });
        if (range.isEmpty()) {
          if (range.end.column > 0 && clippedRange.end.column === 0) {
            continue;
          }
        } else {
          if (clippedRange.isEmpty()) {
            continue;
          }
        }
        selection = this.editor.addSelectionForScreenRange(clippedRange);
        selection.setGoalScreenRange(range);
        break;
      }
    };

    Selection.prototype.merge = function(otherSelection, options) {
      var myGoalScreenRange, otherGoalScreenRange;
      myGoalScreenRange = this.getGoalScreenRange();
      otherGoalScreenRange = otherSelection.getGoalScreenRange();
      if ((myGoalScreenRange != null) && (otherGoalScreenRange != null)) {
        options.goalScreenRange = myGoalScreenRange.union(otherGoalScreenRange);
      } else {
        options.goalScreenRange = myGoalScreenRange != null ? myGoalScreenRange : otherGoalScreenRange;
      }
      this.setBufferRange(this.getBufferRange().union(otherSelection.getBufferRange()), Object.assign({
        autoscroll: false
      }, options));
      return otherSelection.destroy();
    };


    /*
    Section: Comparing to other selections
     */

    Selection.prototype.compare = function(otherSelection) {
      return this.marker.compare(otherSelection.marker);
    };


    /*
    Section: Private Utilities
     */

    Selection.prototype.setGoalScreenRange = function(range) {
      return this.goalScreenRange = Range.fromObject(range);
    };

    Selection.prototype.getGoalScreenRange = function() {
      var ref1;
      return (ref1 = this.goalScreenRange) != null ? ref1 : this.getScreenRange();
    };

    Selection.prototype.markerDidChange = function(e) {
      var cursorMovedEvent, newHeadBufferPosition, newHeadScreenPosition, oldHeadBufferPosition, oldHeadScreenPosition, oldTailBufferPosition, oldTailScreenPosition, textChanged;
      oldHeadBufferPosition = e.oldHeadBufferPosition, oldTailBufferPosition = e.oldTailBufferPosition, newHeadBufferPosition = e.newHeadBufferPosition;
      oldHeadScreenPosition = e.oldHeadScreenPosition, oldTailScreenPosition = e.oldTailScreenPosition, newHeadScreenPosition = e.newHeadScreenPosition;
      textChanged = e.textChanged;
      this.cursor.updateVisibility();
      if (!oldHeadScreenPosition.isEqual(newHeadScreenPosition)) {
        this.cursor.goalColumn = null;
        cursorMovedEvent = {
          oldBufferPosition: oldHeadBufferPosition,
          oldScreenPosition: oldHeadScreenPosition,
          newBufferPosition: newHeadBufferPosition,
          newScreenPosition: newHeadScreenPosition,
          textChanged: textChanged,
          cursor: this.cursor
        };
        this.cursor.emitter.emit('did-change-position', cursorMovedEvent);
        this.editor.cursorMoved(cursorMovedEvent);
      }
      this.emitter.emit('did-change-range');
      return this.editor.selectionRangeChanged({
        oldBufferRange: new Range(oldHeadBufferPosition, oldTailBufferPosition),
        oldScreenRange: new Range(oldHeadScreenPosition, oldTailScreenPosition),
        newBufferRange: this.getBufferRange(),
        newScreenRange: this.getScreenRange(),
        selection: this
      });
    };

    Selection.prototype.markerDidDestroy = function() {
      if (this.editor.isDestroyed()) {
        return;
      }
      this.destroyed = true;
      this.cursor.destroyed = true;
      this.editor.removeSelection(this);
      this.cursor.emitter.emit('did-destroy');
      this.emitter.emit('did-destroy');
      this.cursor.emitter.dispose();
      return this.emitter.dispose();
    };

    Selection.prototype.finalize = function() {
      var ref1;
      if (!((ref1 = this.initialScreenRange) != null ? ref1.isEqual(this.getScreenRange()) : void 0)) {
        this.initialScreenRange = null;
      }
      if (this.isEmpty()) {
        this.wordwise = false;
        return this.linewise = false;
      }
    };

    Selection.prototype.autoscroll = function(options) {
      if (this.marker.hasTail()) {
        return this.editor.scrollToScreenRange(this.getScreenRange(), Object.assign({
          reversed: this.isReversed()
        }, options));
      } else {
        return this.cursor.autoscroll(options);
      }
    };

    Selection.prototype.clearAutoscroll = function() {};

    Selection.prototype.modifySelection = function(fn) {
      this.retainSelection = true;
      this.plantTail();
      fn();
      return this.retainSelection = false;
    };

    Selection.prototype.plantTail = function() {
      return this.marker.plantTail();
    };

    return Selection;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zZWxlY3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1RUFBQTtJQUFBOzs7RUFBQSxNQUFpQixPQUFBLENBQVEsYUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1AsT0FBUSxPQUFBLENBQVEsaUJBQVI7O0VBQ1IsVUFBVyxPQUFBLENBQVEsV0FBUjs7RUFDWixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBRVIsbUJBQUEsR0FBc0I7O0VBR3RCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozt3QkFDSixNQUFBLEdBQVE7O3dCQUNSLE1BQUEsR0FBUTs7d0JBQ1IsTUFBQSxHQUFROzt3QkFDUixrQkFBQSxHQUFvQjs7d0JBQ3BCLFFBQUEsR0FBVTs7SUFFRyxtQkFBQyxHQUFEO0FBQ1gsVUFBQTtNQURhLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLGFBQUEsUUFBUSxJQUFDLENBQUEsYUFBQSxRQUFRO01BQ3hDLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUVmLElBQUMsQ0FBQSxRQUFELENBQVUsRUFBVjtNQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixHQUFvQjtNQUNwQixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixJQUFDLENBQUEsTUFBeEIsRUFBZ0M7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUFtQixDQUFBLEtBQUEsQ0FBQSxFQUFPLFdBQTFCO09BQWhDO01BRWQsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO2lCQUFPLEtBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCO1FBQVA7TUFBQSxDQUFBLENBQUEsQ0FB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QUFBLE1BQU0sQ0FBQyxtQkFBUixDQUE0QixJQUFDLENBQUEsY0FBRCxDQUFBLENBQTVCLEVBQStDLE1BQU0sQ0FBQyxNQUFQLENBQWM7VUFBQyxRQUFBLEVBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFYO1NBQWQsRUFBeUMsT0FBekMsQ0FBL0MsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBbUIsT0FBbkIsRUFIRjs7SUFEVTs7d0JBTVosZUFBQSxHQUFpQixTQUFBLEdBQUE7O3dCQUVqQixlQUFBLEdBQWlCLFNBQUMsRUFBRDtNQUNmLElBQUMsQ0FBQSxlQUFELEdBQW1CO01BQ25CLElBQUMsQ0FBQSxTQUFELENBQUE7TUFDQSxFQUFBLENBQUE7YUFDQSxJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUpKOzt3QkFXakIsU0FBQSxHQUFXLFNBQUE7YUFDVCxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQTtJQURTOzs7O0tBenpCVztBQVR4QiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG57cGlja30gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5cbk5vbldoaXRlc3BhY2VSZWdFeHAgPSAvXFxTL1xuXG4jIEV4dGVuZGVkOiBSZXByZXNlbnRzIGEgc2VsZWN0aW9uIGluIHRoZSB7VGV4dEVkaXRvcn0uXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWxlY3Rpb24gZXh0ZW5kcyBNb2RlbFxuICBjdXJzb3I6IG51bGxcbiAgbWFya2VyOiBudWxsXG4gIGVkaXRvcjogbnVsbFxuICBpbml0aWFsU2NyZWVuUmFuZ2U6IG51bGxcbiAgd29yZHdpc2U6IGZhbHNlXG5cbiAgY29uc3RydWN0b3I6ICh7QGN1cnNvciwgQG1hcmtlciwgQGVkaXRvciwgaWR9KSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBhc3NpZ25JZChpZClcbiAgICBAY3Vyc29yLnNlbGVjdGlvbiA9IHRoaXNcbiAgICBAZGVjb3JhdGlvbiA9IEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIoQG1hcmtlciwgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnc2VsZWN0aW9uJylcblxuICAgIEBtYXJrZXIub25EaWRDaGFuZ2UgKGUpID0+IEBtYXJrZXJEaWRDaGFuZ2UoZSlcbiAgICBAbWFya2VyLm9uRGlkRGVzdHJveSA9PiBAbWFya2VyRGlkRGVzdHJveSgpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAbWFya2VyLmRlc3Ryb3koKVxuXG4gIGlzTGFzdFNlbGVjdGlvbjogLT5cbiAgICB0aGlzIGlzIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIEV4dGVuZGVkOiBDYWxscyB5b3VyIGBjYWxsYmFja2Agd2hlbiB0aGUgc2VsZWN0aW9uIHdhcyBtb3ZlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBldmVudGAge09iamVjdH1cbiAgIyAgICAgKiBgb2xkQnVmZmVyUmFuZ2VgIHtSYW5nZX1cbiAgIyAgICAgKiBgb2xkU2NyZWVuUmFuZ2VgIHtSYW5nZX1cbiAgIyAgICAgKiBgbmV3QnVmZmVyUmFuZ2VgIHtSYW5nZX1cbiAgIyAgICAgKiBgbmV3U2NyZWVuUmFuZ2VgIHtSYW5nZX1cbiAgIyAgICAgKiBgc2VsZWN0aW9uYCB7U2VsZWN0aW9ufSB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlUmFuZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1yYW5nZScsIGNhbGxiYWNrXG5cbiAgIyBFeHRlbmRlZDogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gdGhlIHNlbGVjdGlvbiB3YXMgZGVzdHJveWVkXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICAjIyNcbiAgU2VjdGlvbjogTWFuYWdpbmcgdGhlIHNlbGVjdGlvbiByYW5nZVxuICAjIyNcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgc2NyZWVuIHtSYW5nZX0gZm9yIHRoZSBzZWxlY3Rpb24uXG4gIGdldFNjcmVlblJhbmdlOiAtPlxuICAgIEBtYXJrZXIuZ2V0U2NyZWVuUmFuZ2UoKVxuXG4gICMgUHVibGljOiBNb2RpZmllcyB0aGUgc2NyZWVuIHJhbmdlIGZvciB0aGUgc2VsZWN0aW9uLlxuICAjXG4gICMgKiBgc2NyZWVuUmFuZ2VgIFRoZSBuZXcge1JhbmdlfSB0byB1c2UuXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSBvcHRpb25zIG1hdGNoaW5nIHRob3NlIGZvdW5kIGluIHs6OnNldEJ1ZmZlclJhbmdlfS5cbiAgc2V0U2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSwgb3B0aW9ucykgLT5cbiAgICBAc2V0QnVmZmVyUmFuZ2UoQGVkaXRvci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKSwgb3B0aW9ucylcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgYnVmZmVyIHtSYW5nZX0gZm9yIHRoZSBzZWxlY3Rpb24uXG4gIGdldEJ1ZmZlclJhbmdlOiAtPlxuICAgIEBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuXG4gICMgUHVibGljOiBNb2RpZmllcyB0aGUgYnVmZmVyIHtSYW5nZX0gZm9yIHRoZSBzZWxlY3Rpb24uXG4gICNcbiAgIyAqIGBidWZmZXJSYW5nZWAgVGhlIG5ldyB7UmFuZ2V9IHRvIHNlbGVjdC5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGtleXM6XG4gICMgICAqIGBwcmVzZXJ2ZUZvbGRzYCBpZiBgdHJ1ZWAsIHRoZSBmb2xkIHNldHRpbmdzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgdGhlXG4gICMgICAgIHNlbGVjdGlvbiBtb3Zlcy5cbiAgIyAgICogYGF1dG9zY3JvbGxgIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gYXV0b3Njcm9sbCB0byB0aGUgbmV3XG4gICMgICAgIHJhbmdlLiBEZWZhdWx0cyB0byBgdHJ1ZWAgaWYgdGhpcyBpcyB0aGUgbW9zdCByZWNlbnRseSBhZGRlZCBzZWxlY3Rpb24sXG4gICMgICAgIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICBzZXRCdWZmZXJSYW5nZTogKGJ1ZmZlclJhbmdlLCBvcHRpb25zPXt9KSAtPlxuICAgIGJ1ZmZlclJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChidWZmZXJSYW5nZSlcbiAgICBvcHRpb25zLnJldmVyc2VkID89IEBpc1JldmVyc2VkKClcbiAgICBAZWRpdG9yLmRlc3Ryb3lGb2xkc0ludGVyc2VjdGluZ0J1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlKSB1bmxlc3Mgb3B0aW9ucy5wcmVzZXJ2ZUZvbGRzXG4gICAgQG1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgbmVlZHNGbGFzaCA9IG9wdGlvbnMuZmxhc2hcbiAgICAgIGRlbGV0ZSBvcHRpb25zLmZsYXNoIGlmIG9wdGlvbnMuZmxhc2g/XG4gICAgICBAbWFya2VyLnNldEJ1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlLCBvcHRpb25zKVxuICAgICAgQGF1dG9zY3JvbGwoKSBpZiBvcHRpb25zPy5hdXRvc2Nyb2xsID8gQGlzTGFzdFNlbGVjdGlvbigpXG4gICAgICBAZGVjb3JhdGlvbi5mbGFzaCgnZmxhc2gnLCBAZWRpdG9yLnNlbGVjdGlvbkZsYXNoRHVyYXRpb24pIGlmIG5lZWRzRmxhc2hcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgc3RhcnRpbmcgYW5kIGVuZGluZyBidWZmZXIgcm93cyB0aGUgc2VsZWN0aW9uIGlzXG4gICMgaGlnaGxpZ2h0aW5nLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHR3byB7TnVtYmVyfXM6IHRoZSBzdGFydGluZyByb3csIGFuZCB0aGUgZW5kaW5nIHJvdy5cbiAgZ2V0QnVmZmVyUm93UmFuZ2U6IC0+XG4gICAgcmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIHN0YXJ0ID0gcmFuZ2Uuc3RhcnQucm93XG4gICAgZW5kID0gcmFuZ2UuZW5kLnJvd1xuICAgIGVuZCA9IE1hdGgubWF4KHN0YXJ0LCBlbmQgLSAxKSBpZiByYW5nZS5lbmQuY29sdW1uIGlzIDBcbiAgICBbc3RhcnQsIGVuZF1cblxuICBnZXRUYWlsU2NyZWVuUG9zaXRpb246IC0+XG4gICAgQG1hcmtlci5nZXRUYWlsU2NyZWVuUG9zaXRpb24oKVxuXG4gIGdldFRhaWxCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAbWFya2VyLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0SGVhZFNjcmVlblBvc2l0aW9uOiAtPlxuICAgIEBtYXJrZXIuZ2V0SGVhZFNjcmVlblBvc2l0aW9uKClcblxuICBnZXRIZWFkQnVmZmVyUG9zaXRpb246IC0+XG4gICAgQG1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuXG4gICMjI1xuICBTZWN0aW9uOiBJbmZvIGFib3V0IHRoZSBzZWxlY3Rpb25cbiAgIyMjXG5cbiAgIyBQdWJsaWM6IERldGVybWluZXMgaWYgdGhlIHNlbGVjdGlvbiBjb250YWlucyBhbnl0aGluZy5cbiAgaXNFbXB0eTogLT5cbiAgICBAZ2V0QnVmZmVyUmFuZ2UoKS5pc0VtcHR5KClcblxuICAjIFB1YmxpYzogRGV0ZXJtaW5lcyBpZiB0aGUgZW5kaW5nIHBvc2l0aW9uIG9mIGEgbWFya2VyIGlzIGdyZWF0ZXIgdGhhbiB0aGVcbiAgIyBzdGFydGluZyBwb3NpdGlvbi5cbiAgI1xuICAjIFRoaXMgY2FuIGhhcHBlbiB3aGVuLCBmb3IgZXhhbXBsZSwgeW91IGhpZ2hsaWdodCB0ZXh0IFwidXBcIiBpbiBhIHtUZXh0QnVmZmVyfS5cbiAgaXNSZXZlcnNlZDogLT5cbiAgICBAbWFya2VyLmlzUmV2ZXJzZWQoKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHdoZXRoZXIgdGhlIHNlbGVjdGlvbiBpcyBhIHNpbmdsZSBsaW5lIG9yIG5vdC5cbiAgaXNTaW5nbGVTY3JlZW5MaW5lOiAtPlxuICAgIEBnZXRTY3JlZW5SYW5nZSgpLmlzU2luZ2xlTGluZSgpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHRleHQgaW4gdGhlIHNlbGVjdGlvbi5cbiAgZ2V0VGV4dDogLT5cbiAgICBAZWRpdG9yLmJ1ZmZlci5nZXRUZXh0SW5SYW5nZShAZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICAjIFB1YmxpYzogSWRlbnRpZmllcyBpZiBhIHNlbGVjdGlvbiBpbnRlcnNlY3RzIHdpdGggYSBnaXZlbiBidWZmZXIgcmFuZ2UuXG4gICNcbiAgIyAqIGBidWZmZXJSYW5nZWAgQSB7UmFuZ2V9IHRvIGNoZWNrIGFnYWluc3QuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59XG4gIGludGVyc2VjdHNCdWZmZXJSYW5nZTogKGJ1ZmZlclJhbmdlKSAtPlxuICAgIEBnZXRCdWZmZXJSYW5nZSgpLmludGVyc2VjdHNXaXRoKGJ1ZmZlclJhbmdlKVxuXG4gIGludGVyc2VjdHNTY3JlZW5Sb3dSYW5nZTogKHN0YXJ0Um93LCBlbmRSb3cpIC0+XG4gICAgQGdldFNjcmVlblJhbmdlKCkuaW50ZXJzZWN0c1Jvd1JhbmdlKHN0YXJ0Um93LCBlbmRSb3cpXG5cbiAgaW50ZXJzZWN0c1NjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBAZ2V0U2NyZWVuUmFuZ2UoKS5pbnRlcnNlY3RzUm93KHNjcmVlblJvdylcblxuICAjIFB1YmxpYzogSWRlbnRpZmllcyBpZiBhIHNlbGVjdGlvbiBpbnRlcnNlY3RzIHdpdGggYW5vdGhlciBzZWxlY3Rpb24uXG4gICNcbiAgIyAqIGBvdGhlclNlbGVjdGlvbmAgQSB7U2VsZWN0aW9ufSB0byBjaGVjayBhZ2FpbnN0LlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufVxuICBpbnRlcnNlY3RzV2l0aDogKG90aGVyU2VsZWN0aW9uLCBleGNsdXNpdmUpIC0+XG4gICAgQGdldEJ1ZmZlclJhbmdlKCkuaW50ZXJzZWN0c1dpdGgob3RoZXJTZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSwgZXhjbHVzaXZlKVxuXG4gICMjI1xuICBTZWN0aW9uOiBNb2RpZnlpbmcgdGhlIHNlbGVjdGVkIHJhbmdlXG4gICMjI1xuXG4gICMgUHVibGljOiBDbGVhcnMgdGhlIHNlbGVjdGlvbiwgbW92aW5nIHRoZSBtYXJrZXIgdG8gdGhlIGhlYWQuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgYXV0b3Njcm9sbGAge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBhdXRvc2Nyb2xsIHRvIHRoZSBuZXdcbiAgIyAgICAgcmFuZ2UuIERlZmF1bHRzIHRvIGB0cnVlYCBpZiB0aGlzIGlzIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIHNlbGVjdGlvbixcbiAgIyAgICAgYGZhbHNlYCBvdGhlcndpc2UuXG4gIGNsZWFyOiAob3B0aW9ucykgLT5cbiAgICBAZ29hbFNjcmVlblJhbmdlID0gbnVsbFxuICAgIEBtYXJrZXIuY2xlYXJUYWlsKCkgdW5sZXNzIEByZXRhaW5TZWxlY3Rpb25cbiAgICBAYXV0b3Njcm9sbCgpIGlmIG9wdGlvbnM/LmF1dG9zY3JvbGwgPyBAaXNMYXN0U2VsZWN0aW9uKClcbiAgICBAZmluYWxpemUoKVxuXG4gICMgUHVibGljOiBTZWxlY3RzIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHRvIGEgZ2l2ZW4gc2NyZWVuXG4gICMgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBwb3NpdGlvbmAgQW4gaW5zdGFuY2Ugb2Yge1BvaW50fSwgd2l0aCBhIGdpdmVuIGByb3dgIGFuZCBgY29sdW1uYC5cbiAgc2VsZWN0VG9TY3JlZW5Qb3NpdGlvbjogKHBvc2l0aW9uLCBvcHRpb25zKSAtPlxuICAgIHBvc2l0aW9uID0gUG9pbnQuZnJvbU9iamVjdChwb3NpdGlvbilcblxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT5cbiAgICAgIGlmIEBpbml0aWFsU2NyZWVuUmFuZ2VcbiAgICAgICAgaWYgcG9zaXRpb24uaXNMZXNzVGhhbihAaW5pdGlhbFNjcmVlblJhbmdlLnN0YXJ0KVxuICAgICAgICAgIEBtYXJrZXIuc2V0U2NyZWVuUmFuZ2UoW3Bvc2l0aW9uLCBAaW5pdGlhbFNjcmVlblJhbmdlLmVuZF0sIHJldmVyc2VkOiB0cnVlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQG1hcmtlci5zZXRTY3JlZW5SYW5nZShbQGluaXRpYWxTY3JlZW5SYW5nZS5zdGFydCwgcG9zaXRpb25dLCByZXZlcnNlZDogZmFsc2UpXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24ocG9zaXRpb24sIG9wdGlvbnMpXG5cbiAgICAgIGlmIEBsaW5ld2lzZVxuICAgICAgICBAZXhwYW5kT3ZlckxpbmUob3B0aW9ucylcbiAgICAgIGVsc2UgaWYgQHdvcmR3aXNlXG4gICAgICAgIEBleHBhbmRPdmVyV29yZChvcHRpb25zKVxuXG4gICMgUHVibGljOiBTZWxlY3RzIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHRvIGEgZ2l2ZW4gYnVmZmVyXG4gICMgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBwb3NpdGlvbmAgQW4gaW5zdGFuY2Ugb2Yge1BvaW50fSwgd2l0aCBhIGdpdmVuIGByb3dgIGFuZCBgY29sdW1uYC5cbiAgc2VsZWN0VG9CdWZmZXJQb3NpdGlvbjogKHBvc2l0aW9uKSAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb3NpdGlvbilcblxuICAjIFB1YmxpYzogU2VsZWN0cyB0aGUgdGV4dCBvbmUgcG9zaXRpb24gcmlnaHQgb2YgdGhlIGN1cnNvci5cbiAgI1xuICAjICogYGNvbHVtbkNvdW50YCAob3B0aW9uYWwpIHtOdW1iZXJ9IG51bWJlciBvZiBjb2x1bW5zIHRvIHNlbGVjdCAoZGVmYXVsdDogMSlcbiAgc2VsZWN0UmlnaHQ6IChjb2x1bW5Db3VudCkgLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVJpZ2h0KGNvbHVtbkNvdW50KVxuXG4gICMgUHVibGljOiBTZWxlY3RzIHRoZSB0ZXh0IG9uZSBwb3NpdGlvbiBsZWZ0IG9mIHRoZSBjdXJzb3IuXG4gICNcbiAgIyAqIGBjb2x1bW5Db3VudGAgKG9wdGlvbmFsKSB7TnVtYmVyfSBudW1iZXIgb2YgY29sdW1ucyB0byBzZWxlY3QgKGRlZmF1bHQ6IDEpXG4gIHNlbGVjdExlZnQ6IChjb2x1bW5Db3VudCkgLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZUxlZnQoY29sdW1uQ291bnQpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgYWxsIHRoZSB0ZXh0IG9uZSBwb3NpdGlvbiBhYm92ZSB0aGUgY3Vyc29yLlxuICAjXG4gICMgKiBgcm93Q291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIHJvd3MgdG8gc2VsZWN0IChkZWZhdWx0OiAxKVxuICBzZWxlY3RVcDogKHJvd0NvdW50KSAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5tb3ZlVXAocm93Q291bnQpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgYWxsIHRoZSB0ZXh0IG9uZSBwb3NpdGlvbiBiZWxvdyB0aGUgY3Vyc29yLlxuICAjXG4gICMgKiBgcm93Q291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIHJvd3MgdG8gc2VsZWN0IChkZWZhdWx0OiAxKVxuICBzZWxlY3REb3duOiAocm93Q291bnQpIC0+XG4gICAgQG1vZGlmeVNlbGVjdGlvbiA9PiBAY3Vyc29yLm1vdmVEb3duKHJvd0NvdW50KVxuXG4gICMgUHVibGljOiBTZWxlY3RzIGFsbCB0aGUgdGV4dCBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byB0aGUgdG9wIG9mXG4gICMgdGhlIGJ1ZmZlci5cbiAgc2VsZWN0VG9Ub3A6IC0+XG4gICAgQG1vZGlmeVNlbGVjdGlvbiA9PiBAY3Vyc29yLm1vdmVUb1RvcCgpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgYWxsIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHRvIHRoZSBib3R0b21cbiAgIyBvZiB0aGUgYnVmZmVyLlxuICBzZWxlY3RUb0JvdHRvbTogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQm90dG9tKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgaW4gdGhlIGJ1ZmZlci5cbiAgc2VsZWN0QWxsOiAtPlxuICAgIEBzZXRCdWZmZXJSYW5nZShAZWRpdG9yLmJ1ZmZlci5nZXRSYW5nZSgpLCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlXG4gICMgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLlxuICBzZWxlY3RUb0JlZ2lubmluZ09mTGluZTogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlIGZpcnN0XG4gICMgY2hhcmFjdGVyIG9mIHRoZSBsaW5lLlxuICBzZWxlY3RUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgYWxsIHRoZSB0ZXh0IGZyb20gdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIHRvIHRoZSBlbmQgb2ZcbiAgIyB0aGUgc2NyZWVuIGxpbmUuXG4gIHNlbGVjdFRvRW5kT2ZMaW5lOiAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5tb3ZlVG9FbmRPZlNjcmVlbkxpbmUoKVxuXG4gICMgUHVibGljOiBTZWxlY3RzIGFsbCB0aGUgdGV4dCBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byB0aGUgZW5kIG9mXG4gICMgdGhlIGJ1ZmZlciBsaW5lLlxuICBzZWxlY3RUb0VuZE9mQnVmZmVyTGluZTogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvRW5kT2ZMaW5lKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlXG4gICMgYmVnaW5uaW5nIG9mIHRoZSB3b3JkLlxuICBzZWxlY3RUb0JlZ2lubmluZ09mV29yZDogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlIGVuZCBvZlxuICAjIHRoZSB3b3JkLlxuICBzZWxlY3RUb0VuZE9mV29yZDogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvRW5kT2ZXb3JkKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlXG4gICMgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHdvcmQuXG4gIHNlbGVjdFRvQmVnaW5uaW5nT2ZOZXh0V29yZDogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZOZXh0V29yZCgpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgdGV4dCB0byB0aGUgcHJldmlvdXMgd29yZCBib3VuZGFyeS5cbiAgc2VsZWN0VG9QcmV2aW91c1dvcmRCb3VuZGFyeTogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvUHJldmlvdXNXb3JkQm91bmRhcnkoKVxuXG4gICMgUHVibGljOiBTZWxlY3RzIHRleHQgdG8gdGhlIG5leHQgd29yZCBib3VuZGFyeS5cbiAgc2VsZWN0VG9OZXh0V29yZEJvdW5kYXJ5OiAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5tb3ZlVG9OZXh0V29yZEJvdW5kYXJ5KClcblxuICAjIFB1YmxpYzogU2VsZWN0cyB0ZXh0IHRvIHRoZSBwcmV2aW91cyBzdWJ3b3JkIGJvdW5kYXJ5LlxuICBzZWxlY3RUb1ByZXZpb3VzU3Vid29yZEJvdW5kYXJ5OiAtPlxuICAgIEBtb2RpZnlTZWxlY3Rpb24gPT4gQGN1cnNvci5tb3ZlVG9QcmV2aW91c1N1YndvcmRCb3VuZGFyeSgpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgdGV4dCB0byB0aGUgbmV4dCBzdWJ3b3JkIGJvdW5kYXJ5LlxuICBzZWxlY3RUb05leHRTdWJ3b3JkQm91bmRhcnk6IC0+XG4gICAgQG1vZGlmeVNlbGVjdGlvbiA9PiBAY3Vyc29yLm1vdmVUb05leHRTdWJ3b3JkQm91bmRhcnkoKVxuXG4gICMgUHVibGljOiBTZWxlY3RzIGFsbCB0aGUgdGV4dCBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byB0aGVcbiAgIyBiZWdpbm5pbmcgb2YgdGhlIG5leHQgcGFyYWdyYXBoLlxuICBzZWxlY3RUb0JlZ2lubmluZ09mTmV4dFBhcmFncmFwaDogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoKClcblxuICAjIFB1YmxpYzogU2VsZWN0cyBhbGwgdGhlIHRleHQgZnJvbSB0aGUgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gdG8gdGhlXG4gICMgYmVnaW5uaW5nIG9mIHRoZSBwcmV2aW91cyBwYXJhZ3JhcGguXG4gIHNlbGVjdFRvQmVnaW5uaW5nT2ZQcmV2aW91c1BhcmFncmFwaDogLT5cbiAgICBAbW9kaWZ5U2VsZWN0aW9uID0+IEBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZQcmV2aW91c1BhcmFncmFwaCgpXG5cbiAgIyBQdWJsaWM6IE1vZGlmaWVzIHRoZSBzZWxlY3Rpb24gdG8gZW5jb21wYXNzIHRoZSBjdXJyZW50IHdvcmQuXG4gICNcbiAgIyBSZXR1cm5zIGEge1JhbmdlfS5cbiAgc2VsZWN0V29yZDogKG9wdGlvbnM9e30pIC0+XG4gICAgb3B0aW9ucy53b3JkUmVnZXggPSAvW1xcdCBdKi8gaWYgQGN1cnNvci5pc1N1cnJvdW5kZWRCeVdoaXRlc3BhY2UoKVxuICAgIGlmIEBjdXJzb3IuaXNCZXR3ZWVuV29yZEFuZE5vbldvcmQoKVxuICAgICAgb3B0aW9ucy5pbmNsdWRlTm9uV29yZENoYXJhY3RlcnMgPSBmYWxzZVxuXG4gICAgQHNldEJ1ZmZlclJhbmdlKEBjdXJzb3IuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZShvcHRpb25zKSwgb3B0aW9ucylcbiAgICBAd29yZHdpc2UgPSB0cnVlXG4gICAgQGluaXRpYWxTY3JlZW5SYW5nZSA9IEBnZXRTY3JlZW5SYW5nZSgpXG5cbiAgIyBQdWJsaWM6IEV4cGFuZHMgdGhlIG5ld2VzdCBzZWxlY3Rpb24gdG8gaW5jbHVkZSB0aGUgZW50aXJlIHdvcmQgb24gd2hpY2hcbiAgIyB0aGUgY3Vyc29ycyByZXN0cy5cbiAgZXhwYW5kT3ZlcldvcmQ6IChvcHRpb25zKSAtPlxuICAgIEBzZXRCdWZmZXJSYW5nZShAZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbihAY3Vyc29yLmdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2UoKSksIGF1dG9zY3JvbGw6IGZhbHNlKVxuICAgIEBjdXJzb3IuYXV0b3Njcm9sbCgpIGlmIG9wdGlvbnM/LmF1dG9zY3JvbGwgPyB0cnVlXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgYW4gZW50aXJlIGxpbmUgaW4gdGhlIGJ1ZmZlci5cbiAgI1xuICAjICogYHJvd2AgVGhlIGxpbmUge051bWJlcn0gdG8gc2VsZWN0IChkZWZhdWx0OiB0aGUgcm93IG9mIHRoZSBjdXJzb3IpLlxuICBzZWxlY3RMaW5lOiAocm93LCBvcHRpb25zKSAtPlxuICAgIGlmIHJvdz9cbiAgICAgIEBzZXRCdWZmZXJSYW5nZShAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdywgaW5jbHVkZU5ld2xpbmU6IHRydWUpLCBvcHRpb25zKVxuICAgIGVsc2VcbiAgICAgIHN0YXJ0UmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KEBtYXJrZXIuZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpLnJvdylcbiAgICAgIGVuZFJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhAbWFya2VyLmdldEVuZEJ1ZmZlclBvc2l0aW9uKCkucm93LCBpbmNsdWRlTmV3bGluZTogdHJ1ZSlcbiAgICAgIEBzZXRCdWZmZXJSYW5nZShzdGFydFJhbmdlLnVuaW9uKGVuZFJhbmdlKSwgb3B0aW9ucylcblxuICAgIEBsaW5ld2lzZSA9IHRydWVcbiAgICBAd29yZHdpc2UgPSBmYWxzZVxuICAgIEBpbml0aWFsU2NyZWVuUmFuZ2UgPSBAZ2V0U2NyZWVuUmFuZ2UoKVxuXG4gICMgUHVibGljOiBFeHBhbmRzIHRoZSBuZXdlc3Qgc2VsZWN0aW9uIHRvIGluY2x1ZGUgdGhlIGVudGlyZSBsaW5lIG9uIHdoaWNoXG4gICMgdGhlIGN1cnNvciBjdXJyZW50bHkgcmVzdHMuXG4gICNcbiAgIyBJdCBhbHNvIGluY2x1ZGVzIHRoZSBuZXdsaW5lIGNoYXJhY3Rlci5cbiAgZXhwYW5kT3ZlckxpbmU6IChvcHRpb25zKSAtPlxuICAgIHJhbmdlID0gQGdldEJ1ZmZlclJhbmdlKCkudW5pb24oQGN1cnNvci5nZXRDdXJyZW50TGluZUJ1ZmZlclJhbmdlKGluY2x1ZGVOZXdsaW5lOiB0cnVlKSlcbiAgICBAc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIGF1dG9zY3JvbGw6IGZhbHNlKVxuICAgIEBjdXJzb3IuYXV0b3Njcm9sbCgpIGlmIG9wdGlvbnM/LmF1dG9zY3JvbGwgPyB0cnVlXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1vZGlmeWluZyB0aGUgc2VsZWN0ZWQgdGV4dFxuICAjIyNcblxuICAjIFB1YmxpYzogUmVwbGFjZXMgdGV4dCBhdCB0aGUgY3VycmVudCBzZWxlY3Rpb24uXG4gICNcbiAgIyAqIGB0ZXh0YCBBIHtTdHJpbmd9IHJlcHJlc2VudGluZyB0aGUgdGV4dCB0byBhZGRcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGgga2V5czpcbiAgIyAgICogYHNlbGVjdGAgaWYgYHRydWVgLCBzZWxlY3RzIHRoZSBuZXdseSBhZGRlZCB0ZXh0LlxuICAjICAgKiBgYXV0b0luZGVudGAgaWYgYHRydWVgLCBpbmRlbnRzIGFsbCBpbnNlcnRlZCB0ZXh0IGFwcHJvcHJpYXRlbHkuXG4gICMgICAqIGBhdXRvSW5kZW50TmV3bGluZWAgaWYgYHRydWVgLCBpbmRlbnQgbmV3bGluZSBhcHByb3ByaWF0ZWx5LlxuICAjICAgKiBgYXV0b0RlY3JlYXNlSW5kZW50YCBpZiBgdHJ1ZWAsIGRlY3JlYXNlcyBpbmRlbnQgbGV2ZWwgYXBwcm9wcmlhdGVseVxuICAjICAgICAoZm9yIGV4YW1wbGUsIHdoZW4gYSBjbG9zaW5nIGJyYWNrZXQgaXMgaW5zZXJ0ZWQpLlxuICAjICAgKiBgbm9ybWFsaXplTGluZUVuZGluZ3NgIChvcHRpb25hbCkge0Jvb2xlYW59IChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgdW5kb2AgaWYgYHNraXBgLCBza2lwcyB0aGUgdW5kbyBzdGFjayBmb3IgdGhpcyBvcGVyYXRpb24uXG4gIGluc2VydFRleHQ6ICh0ZXh0LCBvcHRpb25zPXt9KSAtPlxuICAgIG9sZEJ1ZmZlclJhbmdlID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICB3YXNSZXZlcnNlZCA9IEBpc1JldmVyc2VkKClcbiAgICBAY2xlYXIoKVxuXG4gICAgYXV0b0luZGVudEZpcnN0TGluZSA9IGZhbHNlXG4gICAgcHJlY2VkaW5nVGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tvbGRCdWZmZXJSYW5nZS5zdGFydC5yb3csIDBdLCBvbGRCdWZmZXJSYW5nZS5zdGFydF0pXG4gICAgcmVtYWluaW5nTGluZXMgPSB0ZXh0LnNwbGl0KCdcXG4nKVxuICAgIGZpcnN0SW5zZXJ0ZWRMaW5lID0gcmVtYWluaW5nTGluZXMuc2hpZnQoKVxuXG4gICAgaWYgb3B0aW9ucy5pbmRlbnRCYXNpcz9cbiAgICAgIGluZGVudEFkanVzdG1lbnQgPSBAZWRpdG9yLmluZGVudExldmVsRm9yTGluZShwcmVjZWRpbmdUZXh0KSAtIG9wdGlvbnMuaW5kZW50QmFzaXNcbiAgICAgIEBhZGp1c3RJbmRlbnQocmVtYWluaW5nTGluZXMsIGluZGVudEFkanVzdG1lbnQpXG5cbiAgICB0ZXh0SXNBdXRvSW5kZW50YWJsZSA9IHRleHQgaXMgJ1xcbicgb3IgdGV4dCBpcyAnXFxyXFxuJyBvciBOb25XaGl0ZXNwYWNlUmVnRXhwLnRlc3QodGV4dClcbiAgICBpZiBvcHRpb25zLmF1dG9JbmRlbnQgYW5kIHRleHRJc0F1dG9JbmRlbnRhYmxlIGFuZCBub3QgTm9uV2hpdGVzcGFjZVJlZ0V4cC50ZXN0KHByZWNlZGluZ1RleHQpIGFuZCByZW1haW5pbmdMaW5lcy5sZW5ndGggPiAwXG4gICAgICBhdXRvSW5kZW50Rmlyc3RMaW5lID0gdHJ1ZVxuICAgICAgZmlyc3RMaW5lID0gcHJlY2VkaW5nVGV4dCArIGZpcnN0SW5zZXJ0ZWRMaW5lXG4gICAgICBkZXNpcmVkSW5kZW50TGV2ZWwgPSBAZWRpdG9yLmxhbmd1YWdlTW9kZS5zdWdnZXN0ZWRJbmRlbnRGb3JMaW5lQXRCdWZmZXJSb3cob2xkQnVmZmVyUmFuZ2Uuc3RhcnQucm93LCBmaXJzdExpbmUpXG4gICAgICBpbmRlbnRBZGp1c3RtZW50ID0gZGVzaXJlZEluZGVudExldmVsIC0gQGVkaXRvci5pbmRlbnRMZXZlbEZvckxpbmUoZmlyc3RMaW5lKVxuICAgICAgQGFkanVzdEluZGVudChyZW1haW5pbmdMaW5lcywgaW5kZW50QWRqdXN0bWVudClcblxuICAgIHRleHQgPSBmaXJzdEluc2VydGVkTGluZVxuICAgIHRleHQgKz0gJ1xcbicgKyByZW1haW5pbmdMaW5lcy5qb2luKCdcXG4nKSBpZiByZW1haW5pbmdMaW5lcy5sZW5ndGggPiAwXG5cbiAgICBuZXdCdWZmZXJSYW5nZSA9IEBlZGl0b3IuYnVmZmVyLnNldFRleHRJblJhbmdlKG9sZEJ1ZmZlclJhbmdlLCB0ZXh0LCBwaWNrKG9wdGlvbnMsICd1bmRvJywgJ25vcm1hbGl6ZUxpbmVFbmRpbmdzJykpXG5cbiAgICBpZiBvcHRpb25zLnNlbGVjdFxuICAgICAgQHNldEJ1ZmZlclJhbmdlKG5ld0J1ZmZlclJhbmdlLCByZXZlcnNlZDogd2FzUmV2ZXJzZWQpXG4gICAgZWxzZVxuICAgICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdCdWZmZXJSYW5nZS5lbmQpIGlmIHdhc1JldmVyc2VkXG5cbiAgICBpZiBhdXRvSW5kZW50Rmlyc3RMaW5lXG4gICAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93KG9sZEJ1ZmZlclJhbmdlLnN0YXJ0LnJvdywgZGVzaXJlZEluZGVudExldmVsKVxuXG4gICAgaWYgb3B0aW9ucy5hdXRvSW5kZW50TmV3bGluZSBhbmQgdGV4dCBpcyAnXFxuJ1xuICAgICAgQGVkaXRvci5hdXRvSW5kZW50QnVmZmVyUm93KG5ld0J1ZmZlclJhbmdlLmVuZC5yb3csIHByZXNlcnZlTGVhZGluZ1doaXRlc3BhY2U6IHRydWUsIHNraXBCbGFua0xpbmVzOiBmYWxzZSlcbiAgICBlbHNlIGlmIG9wdGlvbnMuYXV0b0RlY3JlYXNlSW5kZW50IGFuZCBOb25XaGl0ZXNwYWNlUmVnRXhwLnRlc3QodGV4dClcbiAgICAgIEBlZGl0b3IuYXV0b0RlY3JlYXNlSW5kZW50Rm9yQnVmZmVyUm93KG5ld0J1ZmZlclJhbmdlLnN0YXJ0LnJvdylcblxuICAgIEBhdXRvc2Nyb2xsKCkgaWYgQGlzTGFzdFNlbGVjdGlvbigpXG5cbiAgICBuZXdCdWZmZXJSYW5nZVxuXG4gICMgUHVibGljOiBSZW1vdmVzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYmVmb3JlIHRoZSBzZWxlY3Rpb24gaWYgdGhlIHNlbGVjdGlvblxuICAjIGlzIGVtcHR5IG90aGVyd2lzZSBpdCBkZWxldGVzIHRoZSBzZWxlY3Rpb24uXG4gIGJhY2tzcGFjZTogLT5cbiAgICBAc2VsZWN0TGVmdCgpIGlmIEBpc0VtcHR5KClcbiAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAjIFB1YmxpYzogUmVtb3ZlcyB0aGUgc2VsZWN0aW9uIG9yLCBpZiBub3RoaW5nIGlzIHNlbGVjdGVkLCB0aGVuIGFsbFxuICAjIGNoYXJhY3RlcnMgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHNlbGVjdGlvbiBiYWNrIHRvIHRoZSBwcmV2aW91cyB3b3JkXG4gICMgYm91bmRhcnkuXG4gIGRlbGV0ZVRvUHJldmlvdXNXb3JkQm91bmRhcnk6IC0+XG4gICAgQHNlbGVjdFRvUHJldmlvdXNXb3JkQm91bmRhcnkoKSBpZiBAaXNFbXB0eSgpXG4gICAgQGRlbGV0ZVNlbGVjdGVkVGV4dCgpXG5cbiAgIyBQdWJsaWM6IFJlbW92ZXMgdGhlIHNlbGVjdGlvbiBvciwgaWYgbm90aGluZyBpcyBzZWxlY3RlZCwgdGhlbiBhbGxcbiAgIyBjaGFyYWN0ZXJzIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBzZWxlY3Rpb24gdXAgdG8gdGhlIG5leHQgd29yZFxuICAjIGJvdW5kYXJ5LlxuICBkZWxldGVUb05leHRXb3JkQm91bmRhcnk6IC0+XG4gICAgQHNlbGVjdFRvTmV4dFdvcmRCb3VuZGFyeSgpIGlmIEBpc0VtcHR5KClcbiAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAjIFB1YmxpYzogUmVtb3ZlcyBmcm9tIHRoZSBzdGFydCBvZiB0aGUgc2VsZWN0aW9uIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICMgY3VycmVudCB3b3JkIGlmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHkgb3RoZXJ3aXNlIGl0IGRlbGV0ZXMgdGhlIHNlbGVjdGlvbi5cbiAgZGVsZXRlVG9CZWdpbm5pbmdPZldvcmQ6IC0+XG4gICAgQHNlbGVjdFRvQmVnaW5uaW5nT2ZXb3JkKCkgaWYgQGlzRW1wdHkoKVxuICAgIEBkZWxldGVTZWxlY3RlZFRleHQoKVxuXG4gICMgUHVibGljOiBSZW1vdmVzIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSB3aGljaCB0aGUgc2VsZWN0aW9uIGJlZ2lucyBvblxuICAjIGFsbCB0aGUgd2F5IHRocm91Z2ggdG8gdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uLlxuICBkZWxldGVUb0JlZ2lubmluZ09mTGluZTogLT5cbiAgICBpZiBAaXNFbXB0eSgpIGFuZCBAY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgICAgQHNlbGVjdExlZnQoKVxuICAgIGVsc2VcbiAgICAgIEBzZWxlY3RUb0JlZ2lubmluZ09mTGluZSgpXG4gICAgQGRlbGV0ZVNlbGVjdGVkVGV4dCgpXG5cbiAgIyBQdWJsaWM6IFJlbW92ZXMgdGhlIHNlbGVjdGlvbiBvciB0aGUgbmV4dCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIHN0YXJ0IG9mIHRoZVxuICAjIHNlbGVjdGlvbiBpZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LlxuICBkZWxldGU6IC0+XG4gICAgQHNlbGVjdFJpZ2h0KCkgaWYgQGlzRW1wdHkoKVxuICAgIEBkZWxldGVTZWxlY3RlZFRleHQoKVxuXG4gICMgUHVibGljOiBJZiB0aGUgc2VsZWN0aW9uIGlzIGVtcHR5LCByZW1vdmVzIGFsbCB0ZXh0IGZyb20gdGhlIGN1cnNvciB0byB0aGVcbiAgIyBlbmQgb2YgdGhlIGxpbmUuIElmIHRoZSBjdXJzb3IgaXMgYWxyZWFkeSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lLCBpdFxuICAjIHJlbW92ZXMgdGhlIGZvbGxvd2luZyBuZXdsaW5lLiBJZiB0aGUgc2VsZWN0aW9uIGlzbid0IGVtcHR5LCBvbmx5IGRlbGV0ZXNcbiAgIyB0aGUgY29udGVudHMgb2YgdGhlIHNlbGVjdGlvbi5cbiAgZGVsZXRlVG9FbmRPZkxpbmU6IC0+XG4gICAgcmV0dXJuIEBkZWxldGUoKSBpZiBAaXNFbXB0eSgpIGFuZCBAY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgIEBzZWxlY3RUb0VuZE9mTGluZSgpIGlmIEBpc0VtcHR5KClcbiAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAjIFB1YmxpYzogUmVtb3ZlcyB0aGUgc2VsZWN0aW9uIG9yIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhlIHN0YXJ0IG9mIHRoZVxuICAjIHNlbGVjdGlvbiB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHdvcmQgaWYgbm90aGluZyBpcyBzZWxlY3RlZC5cbiAgZGVsZXRlVG9FbmRPZldvcmQ6IC0+XG4gICAgQHNlbGVjdFRvRW5kT2ZXb3JkKCkgaWYgQGlzRW1wdHkoKVxuICAgIEBkZWxldGVTZWxlY3RlZFRleHQoKVxuXG4gICMgUHVibGljOiBSZW1vdmVzIHRoZSBzZWxlY3Rpb24gb3IgYWxsIGNoYXJhY3RlcnMgZnJvbSB0aGUgc3RhcnQgb2YgdGhlXG4gICMgc2VsZWN0aW9uIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgd29yZCBpZiBub3RoaW5nIGlzIHNlbGVjdGVkLlxuICBkZWxldGVUb0JlZ2lubmluZ09mU3Vid29yZDogLT5cbiAgICBAc2VsZWN0VG9QcmV2aW91c1N1YndvcmRCb3VuZGFyeSgpIGlmIEBpc0VtcHR5KClcbiAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAjIFB1YmxpYzogUmVtb3ZlcyB0aGUgc2VsZWN0aW9uIG9yIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhlIHN0YXJ0IG9mIHRoZVxuICAjIHNlbGVjdGlvbiB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHdvcmQgaWYgbm90aGluZyBpcyBzZWxlY3RlZC5cbiAgZGVsZXRlVG9FbmRPZlN1YndvcmQ6IC0+XG4gICAgQHNlbGVjdFRvTmV4dFN1YndvcmRCb3VuZGFyeSgpIGlmIEBpc0VtcHR5KClcbiAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAjIFB1YmxpYzogUmVtb3ZlcyBvbmx5IHRoZSBzZWxlY3RlZCB0ZXh0LlxuICBkZWxldGVTZWxlY3RlZFRleHQ6IC0+XG4gICAgYnVmZmVyUmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIEBlZGl0b3IuYnVmZmVyLmRlbGV0ZShidWZmZXJSYW5nZSkgdW5sZXNzIGJ1ZmZlclJhbmdlLmlzRW1wdHkoKVxuICAgIEBjdXJzb3I/LnNldEJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclJhbmdlLnN0YXJ0KVxuXG4gICMgUHVibGljOiBSZW1vdmVzIHRoZSBsaW5lIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlbGVjdGlvbiBpZiB0aGUgc2VsZWN0aW9uXG4gICMgaXMgZW1wdHkgdW5sZXNzIHRoZSBzZWxlY3Rpb24gc3BhbnMgbXVsdGlwbGUgbGluZXMgaW4gd2hpY2ggY2FzZSBhbGwgbGluZXNcbiAgIyBhcmUgcmVtb3ZlZC5cbiAgZGVsZXRlTGluZTogLT5cbiAgICBpZiBAaXNFbXB0eSgpXG4gICAgICBzdGFydCA9IEBjdXJzb3IuZ2V0U2NyZWVuUm93KClcbiAgICAgIHJhbmdlID0gQGVkaXRvci5idWZmZXJSb3dzRm9yU2NyZWVuUm93cyhzdGFydCwgc3RhcnQgKyAxKVxuICAgICAgaWYgcmFuZ2VbMV0gPiByYW5nZVswXVxuICAgICAgICBAZWRpdG9yLmJ1ZmZlci5kZWxldGVSb3dzKHJhbmdlWzBdLCByYW5nZVsxXSAtIDEpXG4gICAgICBlbHNlXG4gICAgICAgIEBlZGl0b3IuYnVmZmVyLmRlbGV0ZVJvdyhyYW5nZVswXSlcbiAgICBlbHNlXG4gICAgICByYW5nZSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgICBzdGFydCA9IHJhbmdlLnN0YXJ0LnJvd1xuICAgICAgZW5kID0gcmFuZ2UuZW5kLnJvd1xuICAgICAgaWYgZW5kIGlzbnQgQGVkaXRvci5idWZmZXIuZ2V0TGFzdFJvdygpIGFuZCByYW5nZS5lbmQuY29sdW1uIGlzIDBcbiAgICAgICAgZW5kLS1cbiAgICAgIEBlZGl0b3IuYnVmZmVyLmRlbGV0ZVJvd3Moc3RhcnQsIGVuZClcblxuICAjIFB1YmxpYzogSm9pbnMgdGhlIGN1cnJlbnQgbGluZSB3aXRoIHRoZSBvbmUgYmVsb3cgaXQuIExpbmVzIHdpbGxcbiAgIyBiZSBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc3BhY2UuXG4gICNcbiAgIyBJZiB0aGVyZSBzZWxlY3Rpb24gc3BhbnMgbW9yZSB0aGFuIG9uZSBsaW5lLCBhbGwgdGhlIGxpbmVzIGFyZSBqb2luZWQgdG9nZXRoZXIuXG4gIGpvaW5MaW5lczogLT5cbiAgICBzZWxlY3RlZFJhbmdlID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICBpZiBzZWxlY3RlZFJhbmdlLmlzRW1wdHkoKVxuICAgICAgcmV0dXJuIGlmIHNlbGVjdGVkUmFuZ2Uuc3RhcnQucm93IGlzIEBlZGl0b3IuYnVmZmVyLmdldExhc3RSb3coKVxuICAgIGVsc2VcbiAgICAgIGpvaW5NYXJrZXIgPSBAZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShzZWxlY3RlZFJhbmdlLCBpbnZhbGlkYXRlOiAnbmV2ZXInKVxuXG4gICAgcm93Q291bnQgPSBNYXRoLm1heCgxLCBzZWxlY3RlZFJhbmdlLmdldFJvd0NvdW50KCkgLSAxKVxuICAgIGZvciBbMC4uLnJvd0NvdW50XVxuICAgICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3ddKVxuICAgICAgQGN1cnNvci5tb3ZlVG9FbmRPZkxpbmUoKVxuXG4gICAgICAjIFJlbW92ZSB0cmFpbGluZyB3aGl0ZXNwYWNlIGZyb20gdGhlIGN1cnJlbnQgbGluZVxuICAgICAgc2NhblJhbmdlID0gQGN1cnNvci5nZXRDdXJyZW50TGluZUJ1ZmZlclJhbmdlKClcbiAgICAgIHRyYWlsaW5nV2hpdGVzcGFjZVJhbmdlID0gbnVsbFxuICAgICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSAvWyBcXHRdKyQvLCBzY2FuUmFuZ2UsICh7cmFuZ2V9KSAtPlxuICAgICAgICB0cmFpbGluZ1doaXRlc3BhY2VSYW5nZSA9IHJhbmdlXG4gICAgICBpZiB0cmFpbGluZ1doaXRlc3BhY2VSYW5nZT9cbiAgICAgICAgQHNldEJ1ZmZlclJhbmdlKHRyYWlsaW5nV2hpdGVzcGFjZVJhbmdlKVxuICAgICAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAgICAgY3VycmVudFJvdyA9IHNlbGVjdGVkUmFuZ2Uuc3RhcnQucm93XG4gICAgICBuZXh0Um93ID0gY3VycmVudFJvdyArIDFcbiAgICAgIGluc2VydFNwYWNlID0gbmV4dFJvdyA8PSBAZWRpdG9yLmJ1ZmZlci5nZXRMYXN0Um93KCkgYW5kXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3cobmV4dFJvdykgPiAwIGFuZFxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGN1cnJlbnRSb3cpID4gMFxuICAgICAgQGluc2VydFRleHQoJyAnKSBpZiBpbnNlcnRTcGFjZVxuXG4gICAgICBAY3Vyc29yLm1vdmVUb0VuZE9mTGluZSgpXG5cbiAgICAgICMgUmVtb3ZlIGxlYWRpbmcgd2hpdGVzcGFjZSBmcm9tIHRoZSBsaW5lIGJlbG93XG4gICAgICBAbW9kaWZ5U2VsZWN0aW9uID0+XG4gICAgICAgIEBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICAgICAgQGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4gICAgICBAZGVsZXRlU2VsZWN0ZWRUZXh0KClcblxuICAgICAgQGN1cnNvci5tb3ZlTGVmdCgpIGlmIGluc2VydFNwYWNlXG5cbiAgICBpZiBqb2luTWFya2VyP1xuICAgICAgbmV3U2VsZWN0ZWRSYW5nZSA9IGpvaW5NYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgQHNldEJ1ZmZlclJhbmdlKG5ld1NlbGVjdGVkUmFuZ2UpXG4gICAgICBqb2luTWFya2VyLmRlc3Ryb3koKVxuXG4gICMgUHVibGljOiBSZW1vdmVzIG9uZSBsZXZlbCBvZiBpbmRlbnQgZnJvbSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHJvd3MuXG4gIG91dGRlbnRTZWxlY3RlZFJvd3M6IC0+XG4gICAgW3N0YXJ0LCBlbmRdID0gQGdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBidWZmZXIgPSBAZWRpdG9yLmJ1ZmZlclxuICAgIGxlYWRpbmdUYWJSZWdleCA9IG5ldyBSZWdFeHAoXCJeKCB7MSwje0BlZGl0b3IuZ2V0VGFiTGVuZ3RoKCl9fXxcXHQpXCIpXG4gICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF1cbiAgICAgIGlmIG1hdGNoTGVuZ3RoID0gYnVmZmVyLmxpbmVGb3JSb3cocm93KS5tYXRjaChsZWFkaW5nVGFiUmVnZXgpP1swXS5sZW5ndGhcbiAgICAgICAgYnVmZmVyLmRlbGV0ZSBbW3JvdywgMF0sIFtyb3csIG1hdGNoTGVuZ3RoXV1cbiAgICByZXR1cm5cblxuICAjIFB1YmxpYzogU2V0cyB0aGUgaW5kZW50YXRpb24gbGV2ZWwgb2YgYWxsIHNlbGVjdGVkIHJvd3MgdG8gdmFsdWVzIHN1Z2dlc3RlZFxuICAjIGJ5IHRoZSByZWxldmFudCBncmFtbWFycy5cbiAgYXV0b0luZGVudFNlbGVjdGVkUm93czogLT5cbiAgICBbc3RhcnQsIGVuZF0gPSBAZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIEBlZGl0b3IuYXV0b0luZGVudEJ1ZmZlclJvd3Moc3RhcnQsIGVuZClcblxuICAjIFB1YmxpYzogV3JhcHMgdGhlIHNlbGVjdGVkIGxpbmVzIGluIGNvbW1lbnRzIGlmIHRoZXkgYXJlbid0IGN1cnJlbnRseSBwYXJ0XG4gICMgb2YgYSBjb21tZW50LlxuICAjXG4gICMgUmVtb3ZlcyB0aGUgY29tbWVudCBpZiB0aGV5IGFyZSBjdXJyZW50bHkgd3JhcHBlZCBpbiBhIGNvbW1lbnQuXG4gIHRvZ2dsZUxpbmVDb21tZW50czogLT5cbiAgICBAZWRpdG9yLnRvZ2dsZUxpbmVDb21tZW50c0ZvckJ1ZmZlclJvd3MoQGdldEJ1ZmZlclJvd1JhbmdlKCkuLi4pXG5cbiAgIyBQdWJsaWM6IEN1dHMgdGhlIHNlbGVjdGlvbiB1bnRpbCB0aGUgZW5kIG9mIHRoZSBzY3JlZW4gbGluZS5cbiAgY3V0VG9FbmRPZkxpbmU6IChtYWludGFpbkNsaXBib2FyZCkgLT5cbiAgICBAc2VsZWN0VG9FbmRPZkxpbmUoKSBpZiBAaXNFbXB0eSgpXG4gICAgQGN1dChtYWludGFpbkNsaXBib2FyZClcblxuICAjIFB1YmxpYzogQ3V0cyB0aGUgc2VsZWN0aW9uIHVudGlsIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBsaW5lLlxuICBjdXRUb0VuZE9mQnVmZmVyTGluZTogKG1haW50YWluQ2xpcGJvYXJkKSAtPlxuICAgIEBzZWxlY3RUb0VuZE9mQnVmZmVyTGluZSgpIGlmIEBpc0VtcHR5KClcbiAgICBAY3V0KG1haW50YWluQ2xpcGJvYXJkKVxuXG4gICMgUHVibGljOiBDb3BpZXMgdGhlIHNlbGVjdGlvbiB0byB0aGUgY2xpcGJvYXJkIGFuZCB0aGVuIGRlbGV0ZXMgaXQuXG4gICNcbiAgIyAqIGBtYWludGFpbkNsaXBib2FyZGAge0Jvb2xlYW59IChkZWZhdWx0OiBmYWxzZSkgU2VlIHs6OmNvcHl9XG4gICMgKiBgZnVsbExpbmVgIHtCb29sZWFufSAoZGVmYXVsdDogZmFsc2UpIFNlZSB7Ojpjb3B5fVxuICBjdXQ6IChtYWludGFpbkNsaXBib2FyZD1mYWxzZSwgZnVsbExpbmU9ZmFsc2UpIC0+XG4gICAgQGNvcHkobWFpbnRhaW5DbGlwYm9hcmQsIGZ1bGxMaW5lKVxuICAgIEBkZWxldGUoKVxuXG4gICMgUHVibGljOiBDb3BpZXMgdGhlIGN1cnJlbnQgc2VsZWN0aW9uIHRvIHRoZSBjbGlwYm9hcmQuXG4gICNcbiAgIyAqIGBtYWludGFpbkNsaXBib2FyZGAge0Jvb2xlYW59IGlmIGB0cnVlYCwgYSBzcGVjaWZpYyBtZXRhZGF0YSBwcm9wZXJ0eVxuICAjICAgaXMgY3JlYXRlZCB0byBzdG9yZSBlYWNoIGNvbnRlbnQgY29waWVkIHRvIHRoZSBjbGlwYm9hcmQuIFRoZSBjbGlwYm9hcmRcbiAgIyAgIGB0ZXh0YCBzdGlsbCBjb250YWlucyB0aGUgY29uY2F0ZW5hdGlvbiBvZiB0aGUgY2xpcGJvYXJkIHdpdGggdGhlXG4gICMgICBjdXJyZW50IHNlbGVjdGlvbi4gKGRlZmF1bHQ6IGZhbHNlKVxuICAjICogYGZ1bGxMaW5lYCB7Qm9vbGVhbn0gaWYgYHRydWVgLCB0aGUgY29waWVkIHRleHQgd2lsbCBhbHdheXMgYmUgcGFzdGVkXG4gICMgICBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lIGNvbnRhaW5pbmcgdGhlIGN1cnNvciwgcmVnYXJkbGVzcyBvZiB0aGVcbiAgIyAgIGN1cnNvcidzIGhvcml6b250YWwgcG9zaXRpb24uIChkZWZhdWx0OiBmYWxzZSlcbiAgY29weTogKG1haW50YWluQ2xpcGJvYXJkPWZhbHNlLCBmdWxsTGluZT1mYWxzZSkgLT5cbiAgICByZXR1cm4gaWYgQGlzRW1wdHkoKVxuICAgIHtzdGFydCwgZW5kfSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgc2VsZWN0aW9uVGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW3N0YXJ0LCBlbmRdKVxuICAgIHByZWNlZGluZ1RleHQgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFtbc3RhcnQucm93LCAwXSwgc3RhcnRdKVxuICAgIHN0YXJ0TGV2ZWwgPSBAZWRpdG9yLmluZGVudExldmVsRm9yTGluZShwcmVjZWRpbmdUZXh0KVxuXG4gICAgaWYgbWFpbnRhaW5DbGlwYm9hcmRcbiAgICAgIHt0ZXh0OiBjbGlwYm9hcmRUZXh0LCBtZXRhZGF0YX0gPSBAZWRpdG9yLmNvbnN0cnVjdG9yLmNsaXBib2FyZC5yZWFkV2l0aE1ldGFkYXRhKClcbiAgICAgIG1ldGFkYXRhID89IHt9XG4gICAgICB1bmxlc3MgbWV0YWRhdGEuc2VsZWN0aW9ucz9cbiAgICAgICAgbWV0YWRhdGEuc2VsZWN0aW9ucyA9IFt7XG4gICAgICAgICAgdGV4dDogY2xpcGJvYXJkVGV4dCxcbiAgICAgICAgICBpbmRlbnRCYXNpczogbWV0YWRhdGEuaW5kZW50QmFzaXMsXG4gICAgICAgICAgZnVsbExpbmU6IG1ldGFkYXRhLmZ1bGxMaW5lLFxuICAgICAgICB9XVxuICAgICAgbWV0YWRhdGEuc2VsZWN0aW9ucy5wdXNoKHtcbiAgICAgICAgdGV4dDogc2VsZWN0aW9uVGV4dCxcbiAgICAgICAgaW5kZW50QmFzaXM6IHN0YXJ0TGV2ZWwsXG4gICAgICAgIGZ1bGxMaW5lOiBmdWxsTGluZVxuICAgICAgfSlcbiAgICAgIEBlZGl0b3IuY29uc3RydWN0b3IuY2xpcGJvYXJkLndyaXRlKFtjbGlwYm9hcmRUZXh0LCBzZWxlY3Rpb25UZXh0XS5qb2luKFwiXFxuXCIpLCBtZXRhZGF0YSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmNvbnN0cnVjdG9yLmNsaXBib2FyZC53cml0ZShzZWxlY3Rpb25UZXh0LCB7XG4gICAgICAgIGluZGVudEJhc2lzOiBzdGFydExldmVsLFxuICAgICAgICBmdWxsTGluZTogZnVsbExpbmVcbiAgICAgIH0pXG5cbiAgIyBQdWJsaWM6IENyZWF0ZXMgYSBmb2xkIGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgc2VsZWN0aW9uLlxuICBmb2xkOiAtPlxuICAgIHJhbmdlID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICB1bmxlc3MgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICBAZWRpdG9yLmZvbGRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocmFuZ2UuZW5kKVxuXG4gICMgUHJpdmF0ZTogSW5jcmVhc2UgdGhlIGluZGVudGF0aW9uIGxldmVsIG9mIHRoZSBnaXZlbiB0ZXh0IGJ5IGdpdmVuIG51bWJlclxuICAjIG9mIGxldmVscy4gTGVhdmVzIHRoZSBmaXJzdCBsaW5lIHVuY2hhbmdlZC5cbiAgYWRqdXN0SW5kZW50OiAobGluZXMsIGluZGVudEFkanVzdG1lbnQpIC0+XG4gICAgZm9yIGxpbmUsIGkgaW4gbGluZXNcbiAgICAgIGlmIGluZGVudEFkanVzdG1lbnQgaXMgMCBvciBsaW5lIGlzICcnXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICBlbHNlIGlmIGluZGVudEFkanVzdG1lbnQgPiAwXG4gICAgICAgIGxpbmVzW2ldID0gQGVkaXRvci5idWlsZEluZGVudFN0cmluZyhpbmRlbnRBZGp1c3RtZW50KSArIGxpbmVcbiAgICAgIGVsc2VcbiAgICAgICAgY3VycmVudEluZGVudExldmVsID0gQGVkaXRvci5pbmRlbnRMZXZlbEZvckxpbmUobGluZXNbaV0pXG4gICAgICAgIGluZGVudExldmVsID0gTWF0aC5tYXgoMCwgY3VycmVudEluZGVudExldmVsICsgaW5kZW50QWRqdXN0bWVudClcbiAgICAgICAgbGluZXNbaV0gPSBsaW5lLnJlcGxhY2UoL15bXFx0IF0rLywgQGVkaXRvci5idWlsZEluZGVudFN0cmluZyhpbmRlbnRMZXZlbCkpXG4gICAgcmV0dXJuXG5cbiAgIyBJbmRlbnQgdGhlIGN1cnJlbnQgbGluZShzKS5cbiAgI1xuICAjIElmIHRoZSBzZWxlY3Rpb24gaXMgZW1wdHksIGluZGVudHMgdGhlIGN1cnJlbnQgbGluZSBpZiB0aGUgY3Vyc29yIHByZWNlZGVzXG4gICMgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycywgYW5kIG90aGVyd2lzZSBpbnNlcnRzIGEgdGFiLiBJZiB0aGUgc2VsZWN0aW9uIGlzXG4gICMgbm9uIGVtcHR5LCBjYWxscyB7OjppbmRlbnRTZWxlY3RlZFJvd3N9LlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBrZXlzOlxuICAjICAgKiBgYXV0b0luZGVudGAgSWYgYHRydWVgLCB0aGUgbGluZSBpcyBpbmRlbnRlZCB0byBhbiBhdXRvbWF0aWNhbGx5LWluZmVycmVkXG4gICMgICAgIGxldmVsLiBPdGhlcndpc2UsIHtUZXh0RWRpdG9yOjpnZXRUYWJUZXh0fSBpcyBpbnNlcnRlZC5cbiAgaW5kZW50OiAoe2F1dG9JbmRlbnR9PXt9KSAtPlxuICAgIHtyb3d9ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBpZiBAaXNFbXB0eSgpXG4gICAgICBAY3Vyc29yLnNraXBMZWFkaW5nV2hpdGVzcGFjZSgpXG4gICAgICBkZXNpcmVkSW5kZW50ID0gQGVkaXRvci5zdWdnZXN0ZWRJbmRlbnRGb3JCdWZmZXJSb3cocm93KVxuICAgICAgZGVsdGEgPSBkZXNpcmVkSW5kZW50IC0gQGN1cnNvci5nZXRJbmRlbnRMZXZlbCgpXG5cbiAgICAgIGlmIGF1dG9JbmRlbnQgYW5kIGRlbHRhID4gMFxuICAgICAgICBkZWx0YSA9IE1hdGgubWF4KGRlbHRhLCAxKSB1bmxlc3MgQGVkaXRvci5nZXRTb2Z0VGFicygpXG4gICAgICAgIEBpbnNlcnRUZXh0KEBlZGl0b3IuYnVpbGRJbmRlbnRTdHJpbmcoZGVsdGEpKVxuICAgICAgZWxzZVxuICAgICAgICBAaW5zZXJ0VGV4dChAZWRpdG9yLmJ1aWxkSW5kZW50U3RyaW5nKDEsIEBjdXJzb3IuZ2V0QnVmZmVyQ29sdW1uKCkpKVxuICAgIGVsc2VcbiAgICAgIEBpbmRlbnRTZWxlY3RlZFJvd3MoKVxuXG4gICMgUHVibGljOiBJZiB0aGUgc2VsZWN0aW9uIHNwYW5zIG11bHRpcGxlIHJvd3MsIGluZGVudCBhbGwgb2YgdGhlbS5cbiAgaW5kZW50U2VsZWN0ZWRSb3dzOiAtPlxuICAgIFtzdGFydCwgZW5kXSA9IEBnZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF1cbiAgICAgIEBlZGl0b3IuYnVmZmVyLmluc2VydChbcm93LCAwXSwgQGVkaXRvci5nZXRUYWJUZXh0KCkpIHVubGVzcyBAZWRpdG9yLmJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KHJvdykgaXMgMFxuICAgIHJldHVyblxuXG4gICMjI1xuICBTZWN0aW9uOiBNYW5hZ2luZyBtdWx0aXBsZSBzZWxlY3Rpb25zXG4gICMjI1xuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgc2VsZWN0aW9uIGRvd24gb25lIHJvdy5cbiAgYWRkU2VsZWN0aW9uQmVsb3c6IC0+XG4gICAgcmFuZ2UgPSBAZ2V0R29hbFNjcmVlblJhbmdlKCkuY29weSgpXG4gICAgbmV4dFJvdyA9IHJhbmdlLmVuZC5yb3cgKyAxXG5cbiAgICBmb3Igcm93IGluIFtuZXh0Um93Li5AZWRpdG9yLmdldExhc3RTY3JlZW5Sb3coKV1cbiAgICAgIHJhbmdlLnN0YXJ0LnJvdyA9IHJvd1xuICAgICAgcmFuZ2UuZW5kLnJvdyA9IHJvd1xuICAgICAgY2xpcHBlZFJhbmdlID0gQGVkaXRvci5jbGlwU2NyZWVuUmFuZ2UocmFuZ2UsIHNraXBTb2Z0V3JhcEluZGVudGF0aW9uOiB0cnVlKVxuXG4gICAgICBpZiByYW5nZS5pc0VtcHR5KClcbiAgICAgICAgY29udGludWUgaWYgcmFuZ2UuZW5kLmNvbHVtbiA+IDAgYW5kIGNsaXBwZWRSYW5nZS5lbmQuY29sdW1uIGlzIDBcbiAgICAgIGVsc2VcbiAgICAgICAgY29udGludWUgaWYgY2xpcHBlZFJhbmdlLmlzRW1wdHkoKVxuXG4gICAgICBzZWxlY3Rpb24gPSBAZWRpdG9yLmFkZFNlbGVjdGlvbkZvclNjcmVlblJhbmdlKGNsaXBwZWRSYW5nZSlcbiAgICAgIHNlbGVjdGlvbi5zZXRHb2FsU2NyZWVuUmFuZ2UocmFuZ2UpXG4gICAgICBicmVha1xuXG4gICAgcmV0dXJuXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBzZWxlY3Rpb24gdXAgb25lIHJvdy5cbiAgYWRkU2VsZWN0aW9uQWJvdmU6IC0+XG4gICAgcmFuZ2UgPSBAZ2V0R29hbFNjcmVlblJhbmdlKCkuY29weSgpXG4gICAgcHJldmlvdXNSb3cgPSByYW5nZS5lbmQucm93IC0gMVxuXG4gICAgZm9yIHJvdyBpbiBbcHJldmlvdXNSb3cuLjBdXG4gICAgICByYW5nZS5zdGFydC5yb3cgPSByb3dcbiAgICAgIHJhbmdlLmVuZC5yb3cgPSByb3dcbiAgICAgIGNsaXBwZWRSYW5nZSA9IEBlZGl0b3IuY2xpcFNjcmVlblJhbmdlKHJhbmdlLCBza2lwU29mdFdyYXBJbmRlbnRhdGlvbjogdHJ1ZSlcblxuICAgICAgaWYgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgIGNvbnRpbnVlIGlmIHJhbmdlLmVuZC5jb2x1bW4gPiAwIGFuZCBjbGlwcGVkUmFuZ2UuZW5kLmNvbHVtbiBpcyAwXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnRpbnVlIGlmIGNsaXBwZWRSYW5nZS5pc0VtcHR5KClcblxuICAgICAgc2VsZWN0aW9uID0gQGVkaXRvci5hZGRTZWxlY3Rpb25Gb3JTY3JlZW5SYW5nZShjbGlwcGVkUmFuZ2UpXG4gICAgICBzZWxlY3Rpb24uc2V0R29hbFNjcmVlblJhbmdlKHJhbmdlKVxuICAgICAgYnJlYWtcblxuICAgIHJldHVyblxuXG4gICMgUHVibGljOiBDb21iaW5lcyB0aGUgZ2l2ZW4gc2VsZWN0aW9uIGludG8gdGhpcyBzZWxlY3Rpb24gYW5kIHRoZW4gZGVzdHJveXNcbiAgIyB0aGUgZ2l2ZW4gc2VsZWN0aW9uLlxuICAjXG4gICMgKiBgb3RoZXJTZWxlY3Rpb25gIEEge1NlbGVjdGlvbn0gdG8gbWVyZ2Ugd2l0aC5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IG9wdGlvbnMgbWF0Y2hpbmcgdGhvc2UgZm91bmQgaW4gezo6c2V0QnVmZmVyUmFuZ2V9LlxuICBtZXJnZTogKG90aGVyU2VsZWN0aW9uLCBvcHRpb25zKSAtPlxuICAgIG15R29hbFNjcmVlblJhbmdlID0gQGdldEdvYWxTY3JlZW5SYW5nZSgpXG4gICAgb3RoZXJHb2FsU2NyZWVuUmFuZ2UgPSBvdGhlclNlbGVjdGlvbi5nZXRHb2FsU2NyZWVuUmFuZ2UoKVxuXG4gICAgaWYgbXlHb2FsU2NyZWVuUmFuZ2U/IGFuZCBvdGhlckdvYWxTY3JlZW5SYW5nZT9cbiAgICAgIG9wdGlvbnMuZ29hbFNjcmVlblJhbmdlID0gbXlHb2FsU2NyZWVuUmFuZ2UudW5pb24ob3RoZXJHb2FsU2NyZWVuUmFuZ2UpXG4gICAgZWxzZVxuICAgICAgb3B0aW9ucy5nb2FsU2NyZWVuUmFuZ2UgPSBteUdvYWxTY3JlZW5SYW5nZSA/IG90aGVyR29hbFNjcmVlblJhbmdlXG5cbiAgICBAc2V0QnVmZmVyUmFuZ2UoQGdldEJ1ZmZlclJhbmdlKCkudW5pb24ob3RoZXJTZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSksIE9iamVjdC5hc3NpZ24oYXV0b3Njcm9sbDogZmFsc2UsIG9wdGlvbnMpKVxuICAgIG90aGVyU2VsZWN0aW9uLmRlc3Ryb3koKVxuXG4gICMjI1xuICBTZWN0aW9uOiBDb21wYXJpbmcgdG8gb3RoZXIgc2VsZWN0aW9uc1xuICAjIyNcblxuICAjIFB1YmxpYzogQ29tcGFyZSB0aGlzIHNlbGVjdGlvbidzIGJ1ZmZlciByYW5nZSB0byBhbm90aGVyIHNlbGVjdGlvbidzIGJ1ZmZlclxuICAjIHJhbmdlLlxuICAjXG4gICMgU2VlIHtSYW5nZTo6Y29tcGFyZX0gZm9yIG1vcmUgZGV0YWlscy5cbiAgI1xuICAjICogYG90aGVyU2VsZWN0aW9uYCBBIHtTZWxlY3Rpb259IHRvIGNvbXBhcmUgYWdhaW5zdFxuICBjb21wYXJlOiAob3RoZXJTZWxlY3Rpb24pIC0+XG4gICAgQG1hcmtlci5jb21wYXJlKG90aGVyU2VsZWN0aW9uLm1hcmtlcilcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZSBVdGlsaXRpZXNcbiAgIyMjXG5cbiAgc2V0R29hbFNjcmVlblJhbmdlOiAocmFuZ2UpIC0+XG4gICAgQGdvYWxTY3JlZW5SYW5nZSA9IFJhbmdlLmZyb21PYmplY3QocmFuZ2UpXG5cbiAgZ2V0R29hbFNjcmVlblJhbmdlOiAtPlxuICAgIEBnb2FsU2NyZWVuUmFuZ2UgPyBAZ2V0U2NyZWVuUmFuZ2UoKVxuXG4gIG1hcmtlckRpZENoYW5nZTogKGUpIC0+XG4gICAge29sZEhlYWRCdWZmZXJQb3NpdGlvbiwgb2xkVGFpbEJ1ZmZlclBvc2l0aW9uLCBuZXdIZWFkQnVmZmVyUG9zaXRpb259ID0gZVxuICAgIHtvbGRIZWFkU2NyZWVuUG9zaXRpb24sIG9sZFRhaWxTY3JlZW5Qb3NpdGlvbiwgbmV3SGVhZFNjcmVlblBvc2l0aW9ufSA9IGVcbiAgICB7dGV4dENoYW5nZWR9ID0gZVxuXG4gICAgQGN1cnNvci51cGRhdGVWaXNpYmlsaXR5KClcblxuICAgIHVubGVzcyBvbGRIZWFkU2NyZWVuUG9zaXRpb24uaXNFcXVhbChuZXdIZWFkU2NyZWVuUG9zaXRpb24pXG4gICAgICBAY3Vyc29yLmdvYWxDb2x1bW4gPSBudWxsXG4gICAgICBjdXJzb3JNb3ZlZEV2ZW50ID0ge1xuICAgICAgICBvbGRCdWZmZXJQb3NpdGlvbjogb2xkSGVhZEJ1ZmZlclBvc2l0aW9uXG4gICAgICAgIG9sZFNjcmVlblBvc2l0aW9uOiBvbGRIZWFkU2NyZWVuUG9zaXRpb25cbiAgICAgICAgbmV3QnVmZmVyUG9zaXRpb246IG5ld0hlYWRCdWZmZXJQb3NpdGlvblxuICAgICAgICBuZXdTY3JlZW5Qb3NpdGlvbjogbmV3SGVhZFNjcmVlblBvc2l0aW9uXG4gICAgICAgIHRleHRDaGFuZ2VkOiB0ZXh0Q2hhbmdlZFxuICAgICAgICBjdXJzb3I6IEBjdXJzb3JcbiAgICAgIH1cbiAgICAgIEBjdXJzb3IuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXBvc2l0aW9uJywgY3Vyc29yTW92ZWRFdmVudClcbiAgICAgIEBlZGl0b3IuY3Vyc29yTW92ZWQoY3Vyc29yTW92ZWRFdmVudClcblxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtcmFuZ2UnXG4gICAgQGVkaXRvci5zZWxlY3Rpb25SYW5nZUNoYW5nZWQoXG4gICAgICBvbGRCdWZmZXJSYW5nZTogbmV3IFJhbmdlKG9sZEhlYWRCdWZmZXJQb3NpdGlvbiwgb2xkVGFpbEJ1ZmZlclBvc2l0aW9uKVxuICAgICAgb2xkU2NyZWVuUmFuZ2U6IG5ldyBSYW5nZShvbGRIZWFkU2NyZWVuUG9zaXRpb24sIG9sZFRhaWxTY3JlZW5Qb3NpdGlvbilcbiAgICAgIG5ld0J1ZmZlclJhbmdlOiBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgbmV3U2NyZWVuUmFuZ2U6IEBnZXRTY3JlZW5SYW5nZSgpXG4gICAgICBzZWxlY3Rpb246IHRoaXNcbiAgICApXG5cbiAgbWFya2VyRGlkRGVzdHJveTogLT5cbiAgICByZXR1cm4gaWYgQGVkaXRvci5pc0Rlc3Ryb3llZCgpXG5cbiAgICBAZGVzdHJveWVkID0gdHJ1ZVxuICAgIEBjdXJzb3IuZGVzdHJveWVkID0gdHJ1ZVxuXG4gICAgQGVkaXRvci5yZW1vdmVTZWxlY3Rpb24odGhpcylcblxuICAgIEBjdXJzb3IuZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcblxuICAgIEBjdXJzb3IuZW1pdHRlci5kaXNwb3NlKClcbiAgICBAZW1pdHRlci5kaXNwb3NlKClcblxuICBmaW5hbGl6ZTogLT5cbiAgICBAaW5pdGlhbFNjcmVlblJhbmdlID0gbnVsbCB1bmxlc3MgQGluaXRpYWxTY3JlZW5SYW5nZT8uaXNFcXVhbChAZ2V0U2NyZWVuUmFuZ2UoKSlcbiAgICBpZiBAaXNFbXB0eSgpXG4gICAgICBAd29yZHdpc2UgPSBmYWxzZVxuICAgICAgQGxpbmV3aXNlID0gZmFsc2VcblxuICBhdXRvc2Nyb2xsOiAob3B0aW9ucykgLT5cbiAgICBpZiBAbWFya2VyLmhhc1RhaWwoKVxuICAgICAgQGVkaXRvci5zY3JvbGxUb1NjcmVlblJhbmdlKEBnZXRTY3JlZW5SYW5nZSgpLCBPYmplY3QuYXNzaWduKHtyZXZlcnNlZDogQGlzUmV2ZXJzZWQoKX0sIG9wdGlvbnMpKVxuICAgIGVsc2VcbiAgICAgIEBjdXJzb3IuYXV0b3Njcm9sbChvcHRpb25zKVxuXG4gIGNsZWFyQXV0b3Njcm9sbDogLT5cblxuICBtb2RpZnlTZWxlY3Rpb246IChmbikgLT5cbiAgICBAcmV0YWluU2VsZWN0aW9uID0gdHJ1ZVxuICAgIEBwbGFudFRhaWwoKVxuICAgIGZuKClcbiAgICBAcmV0YWluU2VsZWN0aW9uID0gZmFsc2VcblxuICAjIFNldHMgdGhlIG1hcmtlcidzIHRhaWwgdG8gdGhlIHNhbWUgcG9zaXRpb24gYXMgdGhlIG1hcmtlcidzIGhlYWQuXG4gICNcbiAgIyBUaGlzIG9ubHkgd29ya3MgaWYgdGhlcmUgaXNuJ3QgYWxyZWFkeSBhIHRhaWwgcG9zaXRpb24uXG4gICNcbiAgIyBSZXR1cm5zIGEge1BvaW50fSByZXByZXNlbnRpbmcgdGhlIG5ldyB0YWlsIHBvc2l0aW9uLlxuICBwbGFudFRhaWw6IC0+XG4gICAgQG1hcmtlci5wbGFudFRhaWwoKVxuIl19
