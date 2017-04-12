(function() {
  var Cursor, Emitter, EmptyLineRegExp, Model, Point, Range, _, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('text-buffer'), Point = ref.Point, Range = ref.Range;

  Emitter = require('event-kit').Emitter;

  _ = require('underscore-plus');

  Model = require('./model');

  EmptyLineRegExp = /(\r\n[\t ]*\r\n)|(\n[\t ]*\n)/g;

  module.exports = Cursor = (function(superClass) {
    extend(Cursor, superClass);

    Cursor.prototype.screenPosition = null;

    Cursor.prototype.bufferPosition = null;

    Cursor.prototype.goalColumn = null;

    Cursor.prototype.visible = true;

    function Cursor(arg) {
      var id;
      this.editor = arg.editor, this.marker = arg.marker, id = arg.id;
      this.emitter = new Emitter;
      this.assignId(id);
      this.updateVisibility();
    }

    Cursor.prototype.destroy = function() {
      return this.marker.destroy();
    };


    /*
    Section: Event Subscription
     */

    Cursor.prototype.onDidChangePosition = function(callback) {
      return this.emitter.on('did-change-position', callback);
    };

    Cursor.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    Cursor.prototype.onDidChangeVisibility = function(callback) {
      return this.emitter.on('did-change-visibility', callback);
    };


    /*
    Section: Managing Cursor Position
     */

    Cursor.prototype.setScreenPosition = function(screenPosition, options) {
      if (options == null) {
        options = {};
      }
      return this.changePosition(options, (function(_this) {
        return function() {
          return _this.marker.setHeadScreenPosition(screenPosition, options);
        };
      })(this));
    };

    Cursor.prototype.getScreenPosition = function() {
      return this.marker.getHeadScreenPosition();
    };

    Cursor.prototype.setBufferPosition = function(bufferPosition, options) {
      if (options == null) {
        options = {};
      }
      return this.changePosition(options, (function(_this) {
        return function() {
          return _this.marker.setHeadBufferPosition(bufferPosition, options);
        };
      })(this));
    };

    Cursor.prototype.getBufferPosition = function() {
      return this.marker.getHeadBufferPosition();
    };

    Cursor.prototype.getScreenRow = function() {
      return this.getScreenPosition().row;
    };

    Cursor.prototype.getScreenColumn = function() {
      return this.getScreenPosition().column;
    };

    Cursor.prototype.getBufferRow = function() {
      return this.getBufferPosition().row;
    };

    Cursor.prototype.getBufferColumn = function() {
      return this.getBufferPosition().column;
    };

    Cursor.prototype.getCurrentBufferLine = function() {
      return this.editor.lineTextForBufferRow(this.getBufferRow());
    };

    Cursor.prototype.isAtBeginningOfLine = function() {
      return this.getBufferPosition().column === 0;
    };

    Cursor.prototype.isAtEndOfLine = function() {
      return this.getBufferPosition().isEqual(this.getCurrentLineBufferRange().end);
    };


    /*
    Section: Cursor Position Details
     */

    Cursor.prototype.getMarker = function() {
      return this.marker;
    };

    Cursor.prototype.isSurroundedByWhitespace = function() {
      var column, range, ref1, row;
      ref1 = this.getBufferPosition(), row = ref1.row, column = ref1.column;
      range = [[row, column - 1], [row, column + 1]];
      return /^\s+$/.test(this.editor.getTextInBufferRange(range));
    };

    Cursor.prototype.isBetweenWordAndNonWord = function() {
      var after, before, column, nonWordCharacters, range, ref1, ref2, row;
      if (this.isAtBeginningOfLine() || this.isAtEndOfLine()) {
        return false;
      }
      ref1 = this.getBufferPosition(), row = ref1.row, column = ref1.column;
      range = [[row, column - 1], [row, column + 1]];
      ref2 = this.editor.getTextInBufferRange(range), before = ref2[0], after = ref2[1];
      if (/\s/.test(before) || /\s/.test(after)) {
        return false;
      }
      nonWordCharacters = this.getNonWordCharacters();
      return nonWordCharacters.includes(before) !== nonWordCharacters.includes(after);
    };

    Cursor.prototype.isInsideWord = function(options) {
      var column, range, ref1, ref2, row;
      ref1 = this.getBufferPosition(), row = ref1.row, column = ref1.column;
      range = [[row, column], [row, 2e308]];
      return this.editor.getTextInBufferRange(range).search((ref2 = options != null ? options.wordRegex : void 0) != null ? ref2 : this.wordRegExp()) === 0;
    };

    Cursor.prototype.getIndentLevel = function() {
      if (this.editor.getSoftTabs()) {
        return this.getBufferColumn() / this.editor.getTabLength();
      } else {
        return this.getBufferColumn();
      }
    };

    Cursor.prototype.getScopeDescriptor = function() {
      return this.editor.scopeDescriptorForBufferPosition(this.getBufferPosition());
    };

    Cursor.prototype.hasPrecedingCharactersOnLine = function() {
      var bufferPosition, firstCharacterColumn, line;
      bufferPosition = this.getBufferPosition();
      line = this.editor.lineTextForBufferRow(bufferPosition.row);
      firstCharacterColumn = line.search(/\S/);
      if (firstCharacterColumn === -1) {
        return false;
      } else {
        return bufferPosition.column > firstCharacterColumn;
      }
    };

    Cursor.prototype.isLastCursor = function() {
      return this === this.editor.getLastCursor();
    };


    /*
    Section: Moving the Cursor
     */

    Cursor.prototype.moveUp = function(rowCount, arg) {
      var column, moveToEndOfSelection, range, ref1, ref2, row;
      if (rowCount == null) {
        rowCount = 1;
      }
      moveToEndOfSelection = (arg != null ? arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        ref1 = range.start, row = ref1.row, column = ref1.column;
      } else {
        ref2 = this.getScreenPosition(), row = ref2.row, column = ref2.column;
      }
      if (this.goalColumn != null) {
        column = this.goalColumn;
      }
      this.setScreenPosition({
        row: row - rowCount,
        column: column
      }, {
        skipSoftWrapIndentation: true
      });
      return this.goalColumn = column;
    };

    Cursor.prototype.moveDown = function(rowCount, arg) {
      var column, moveToEndOfSelection, range, ref1, ref2, row;
      if (rowCount == null) {
        rowCount = 1;
      }
      moveToEndOfSelection = (arg != null ? arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        ref1 = range.end, row = ref1.row, column = ref1.column;
      } else {
        ref2 = this.getScreenPosition(), row = ref2.row, column = ref2.column;
      }
      if (this.goalColumn != null) {
        column = this.goalColumn;
      }
      this.setScreenPosition({
        row: row + rowCount,
        column: column
      }, {
        skipSoftWrapIndentation: true
      });
      return this.goalColumn = column;
    };

    Cursor.prototype.moveLeft = function(columnCount, arg) {
      var column, moveToEndOfSelection, range, ref1, row;
      if (columnCount == null) {
        columnCount = 1;
      }
      moveToEndOfSelection = (arg != null ? arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        return this.setScreenPosition(range.start);
      } else {
        ref1 = this.getScreenPosition(), row = ref1.row, column = ref1.column;
        while (columnCount > column && row > 0) {
          columnCount -= column;
          column = this.editor.lineLengthForScreenRow(--row);
          columnCount--;
        }
        column = column - columnCount;
        return this.setScreenPosition({
          row: row,
          column: column
        }, {
          clipDirection: 'backward'
        });
      }
    };

    Cursor.prototype.moveRight = function(columnCount, arg) {
      var column, columnsRemainingInLine, maxLines, moveToEndOfSelection, range, ref1, row, rowLength;
      if (columnCount == null) {
        columnCount = 1;
      }
      moveToEndOfSelection = (arg != null ? arg : {}).moveToEndOfSelection;
      range = this.marker.getScreenRange();
      if (moveToEndOfSelection && !range.isEmpty()) {
        return this.setScreenPosition(range.end);
      } else {
        ref1 = this.getScreenPosition(), row = ref1.row, column = ref1.column;
        maxLines = this.editor.getScreenLineCount();
        rowLength = this.editor.lineLengthForScreenRow(row);
        columnsRemainingInLine = rowLength - column;
        while (columnCount > columnsRemainingInLine && row < maxLines - 1) {
          columnCount -= columnsRemainingInLine;
          columnCount--;
          column = 0;
          rowLength = this.editor.lineLengthForScreenRow(++row);
          columnsRemainingInLine = rowLength;
        }
        column = column + columnCount;
        return this.setScreenPosition({
          row: row,
          column: column
        }, {
          clipDirection: 'forward'
        });
      }
    };

    Cursor.prototype.moveToTop = function() {
      return this.setBufferPosition([0, 0]);
    };

    Cursor.prototype.moveToBottom = function() {
      return this.setBufferPosition(this.editor.getEofBufferPosition());
    };

    Cursor.prototype.moveToBeginningOfScreenLine = function() {
      return this.setScreenPosition([this.getScreenRow(), 0]);
    };

    Cursor.prototype.moveToBeginningOfLine = function() {
      return this.setBufferPosition([this.getBufferRow(), 0]);
    };

    Cursor.prototype.moveToFirstCharacterOfLine = function() {
      var firstCharacterColumn, screenLineBufferRange, screenLineEnd, screenLineStart, screenRow, targetBufferColumn;
      screenRow = this.getScreenRow();
      screenLineStart = this.editor.clipScreenPosition([screenRow, 0], {
        skipSoftWrapIndentation: true
      });
      screenLineEnd = [screenRow, 2e308];
      screenLineBufferRange = this.editor.bufferRangeForScreenRange([screenLineStart, screenLineEnd]);
      firstCharacterColumn = null;
      this.editor.scanInBufferRange(/\S/, screenLineBufferRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        firstCharacterColumn = range.start.column;
        return stop();
      });
      if ((firstCharacterColumn != null) && firstCharacterColumn !== this.getBufferColumn()) {
        targetBufferColumn = firstCharacterColumn;
      } else {
        targetBufferColumn = screenLineBufferRange.start.column;
      }
      return this.setBufferPosition([screenLineBufferRange.start.row, targetBufferColumn]);
    };

    Cursor.prototype.moveToEndOfScreenLine = function() {
      return this.setScreenPosition([this.getScreenRow(), 2e308]);
    };

    Cursor.prototype.moveToEndOfLine = function() {
      return this.setBufferPosition([this.getBufferRow(), 2e308]);
    };

    Cursor.prototype.moveToBeginningOfWord = function() {
      return this.setBufferPosition(this.getBeginningOfCurrentWordBufferPosition());
    };

    Cursor.prototype.moveToEndOfWord = function() {
      var position;
      if (position = this.getEndOfCurrentWordBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToBeginningOfNextWord = function() {
      var position;
      if (position = this.getBeginningOfNextWordBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToPreviousWordBoundary = function() {
      var position;
      if (position = this.getPreviousWordBoundaryBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToNextWordBoundary = function() {
      var position;
      if (position = this.getNextWordBoundaryBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToPreviousSubwordBoundary = function() {
      var options, position;
      options = {
        wordRegex: this.subwordRegExp({
          backwards: true
        })
      };
      if (position = this.getPreviousWordBoundaryBufferPosition(options)) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToNextSubwordBoundary = function() {
      var options, position;
      options = {
        wordRegex: this.subwordRegExp()
      };
      if (position = this.getNextWordBoundaryBufferPosition(options)) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.skipLeadingWhitespace = function() {
      var endOfLeadingWhitespace, position, scanRange;
      position = this.getBufferPosition();
      scanRange = this.getCurrentLineBufferRange();
      endOfLeadingWhitespace = null;
      this.editor.scanInBufferRange(/^[ \t]*/, scanRange, function(arg) {
        var range;
        range = arg.range;
        return endOfLeadingWhitespace = range.end;
      });
      if (endOfLeadingWhitespace.isGreaterThan(position)) {
        return this.setBufferPosition(endOfLeadingWhitespace);
      }
    };

    Cursor.prototype.moveToBeginningOfNextParagraph = function() {
      var position;
      if (position = this.getBeginningOfNextParagraphBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };

    Cursor.prototype.moveToBeginningOfPreviousParagraph = function() {
      var position;
      if (position = this.getBeginningOfPreviousParagraphBufferPosition()) {
        return this.setBufferPosition(position);
      }
    };


    /*
    Section: Local Positions and Ranges
     */

    Cursor.prototype.getPreviousWordBoundaryBufferPosition = function(options) {
      var beginningOfWordPosition, currentBufferPosition, previousNonBlankRow, ref1, scanRange;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      previousNonBlankRow = this.editor.buffer.previousNonBlankRow(currentBufferPosition.row);
      scanRange = [[previousNonBlankRow != null ? previousNonBlankRow : 0, 0], currentBufferPosition];
      beginningOfWordPosition = null;
      this.editor.backwardsScanInBufferRange((ref1 = options.wordRegex) != null ? ref1 : this.wordRegExp(), scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.start.row < currentBufferPosition.row && currentBufferPosition.column > 0) {
          beginningOfWordPosition = new Point(currentBufferPosition.row, 0);
        } else if (range.end.isLessThan(currentBufferPosition)) {
          beginningOfWordPosition = range.end;
        } else {
          beginningOfWordPosition = range.start;
        }
        if (!(beginningOfWordPosition != null ? beginningOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
          return stop();
        }
      });
      return beginningOfWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getNextWordBoundaryBufferPosition = function(options) {
      var currentBufferPosition, endOfWordPosition, ref1, scanRange;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      scanRange = [currentBufferPosition, this.editor.getEofBufferPosition()];
      endOfWordPosition = null;
      this.editor.scanInBufferRange((ref1 = options.wordRegex) != null ? ref1 : this.wordRegExp(), scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.start.row > currentBufferPosition.row) {
          endOfWordPosition = new Point(range.start.row, 0);
        } else if (range.start.isGreaterThan(currentBufferPosition)) {
          endOfWordPosition = range.start;
        } else {
          endOfWordPosition = range.end;
        }
        if (!(endOfWordPosition != null ? endOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
          return stop();
        }
      });
      return endOfWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getBeginningOfCurrentWordBufferPosition = function(options) {
      var allowPrevious, beginningOfWordPosition, currentBufferPosition, previousNonBlankRow, ref1, ref2, ref3, scanRange;
      if (options == null) {
        options = {};
      }
      allowPrevious = (ref1 = options.allowPrevious) != null ? ref1 : true;
      currentBufferPosition = this.getBufferPosition();
      previousNonBlankRow = (ref2 = this.editor.buffer.previousNonBlankRow(currentBufferPosition.row)) != null ? ref2 : 0;
      scanRange = [[previousNonBlankRow, 0], currentBufferPosition];
      beginningOfWordPosition = null;
      this.editor.backwardsScanInBufferRange((ref3 = options.wordRegex) != null ? ref3 : this.wordRegExp(options), scanRange, function(arg) {
        var matchText, range, stop;
        range = arg.range, matchText = arg.matchText, stop = arg.stop;
        if (matchText === '' && range.start.column !== 0) {
          return;
        }
        if (range.start.isLessThan(currentBufferPosition)) {
          if (range.end.isGreaterThanOrEqual(currentBufferPosition) || allowPrevious) {
            beginningOfWordPosition = range.start;
          }
          return stop();
        }
      });
      if (beginningOfWordPosition != null) {
        return beginningOfWordPosition;
      } else if (allowPrevious) {
        return new Point(0, 0);
      } else {
        return currentBufferPosition;
      }
    };

    Cursor.prototype.getEndOfCurrentWordBufferPosition = function(options) {
      var allowNext, currentBufferPosition, endOfWordPosition, ref1, ref2, scanRange;
      if (options == null) {
        options = {};
      }
      allowNext = (ref1 = options.allowNext) != null ? ref1 : true;
      currentBufferPosition = this.getBufferPosition();
      scanRange = [currentBufferPosition, this.editor.getEofBufferPosition()];
      endOfWordPosition = null;
      this.editor.scanInBufferRange((ref2 = options.wordRegex) != null ? ref2 : this.wordRegExp(options), scanRange, function(arg) {
        var matchText, range, stop;
        range = arg.range, matchText = arg.matchText, stop = arg.stop;
        if (matchText === '' && range.start.column !== 0) {
          return;
        }
        if (range.end.isGreaterThan(currentBufferPosition)) {
          if (allowNext || range.start.isLessThanOrEqual(currentBufferPosition)) {
            endOfWordPosition = range.end;
          }
          return stop();
        }
      });
      return endOfWordPosition != null ? endOfWordPosition : currentBufferPosition;
    };

    Cursor.prototype.getBeginningOfNextWordBufferPosition = function(options) {
      var beginningOfNextWordPosition, currentBufferPosition, ref1, scanRange, start;
      if (options == null) {
        options = {};
      }
      currentBufferPosition = this.getBufferPosition();
      start = this.isInsideWord(options) ? this.getEndOfCurrentWordBufferPosition(options) : currentBufferPosition;
      scanRange = [start, this.editor.getEofBufferPosition()];
      beginningOfNextWordPosition = null;
      this.editor.scanInBufferRange((ref1 = options.wordRegex) != null ? ref1 : this.wordRegExp(), scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        beginningOfNextWordPosition = range.start;
        return stop();
      });
      return beginningOfNextWordPosition || currentBufferPosition;
    };

    Cursor.prototype.getCurrentWordBufferRange = function(options) {
      var endOptions, startOptions;
      if (options == null) {
        options = {};
      }
      startOptions = Object.assign(_.clone(options), {
        allowPrevious: false
      });
      endOptions = Object.assign(_.clone(options), {
        allowNext: false
      });
      return new Range(this.getBeginningOfCurrentWordBufferPosition(startOptions), this.getEndOfCurrentWordBufferPosition(endOptions));
    };

    Cursor.prototype.getCurrentLineBufferRange = function(options) {
      return this.editor.bufferRangeForBufferRow(this.getBufferRow(), options);
    };

    Cursor.prototype.getCurrentParagraphBufferRange = function() {
      return this.editor.languageMode.rowRangeForParagraphAtBufferRow(this.getBufferRow());
    };

    Cursor.prototype.getCurrentWordPrefix = function() {
      return this.editor.getTextInBufferRange([this.getBeginningOfCurrentWordBufferPosition(), this.getBufferPosition()]);
    };


    /*
    Section: Visibility
     */

    Cursor.prototype.setVisible = function(visible) {
      if (this.visible !== visible) {
        this.visible = visible;
        return this.emitter.emit('did-change-visibility', this.visible);
      }
    };

    Cursor.prototype.isVisible = function() {
      return this.visible;
    };

    Cursor.prototype.updateVisibility = function() {
      return this.setVisible(this.marker.getBufferRange().isEmpty());
    };


    /*
    Section: Comparing to another cursor
     */

    Cursor.prototype.compare = function(otherCursor) {
      return this.getBufferPosition().compare(otherCursor.getBufferPosition());
    };


    /*
    Section: Utilities
     */

    Cursor.prototype.clearAutoscroll = function() {};

    Cursor.prototype.clearSelection = function(options) {
      var ref1;
      return (ref1 = this.selection) != null ? ref1.clear(options) : void 0;
    };

    Cursor.prototype.wordRegExp = function(options) {
      var nonWordCharacters, ref1, source;
      nonWordCharacters = _.escapeRegExp(this.getNonWordCharacters());
      source = "^[\t ]*$|[^\\s" + nonWordCharacters + "]+";
      if ((ref1 = options != null ? options.includeNonWordCharacters : void 0) != null ? ref1 : true) {
        source += "|" + ("[" + nonWordCharacters + "]+");
      }
      return new RegExp(source, "g");
    };

    Cursor.prototype.subwordRegExp = function(options) {
      var lowercaseLetters, nonWordCharacters, segments, snakeCamelSegment, uppercaseLetters;
      if (options == null) {
        options = {};
      }
      nonWordCharacters = this.getNonWordCharacters();
      lowercaseLetters = 'a-z\\u00DF-\\u00F6\\u00F8-\\u00FF';
      uppercaseLetters = 'A-Z\\u00C0-\\u00D6\\u00D8-\\u00DE';
      snakeCamelSegment = "[" + uppercaseLetters + "]?[" + lowercaseLetters + "]+";
      segments = ["^[\t ]+", "[\t ]+$", "[" + uppercaseLetters + "]+(?![" + lowercaseLetters + "])", "\\d+"];
      if (options.backwards) {
        segments.push(snakeCamelSegment + "_*");
        segments.push("[" + (_.escapeRegExp(nonWordCharacters)) + "]+\\s*");
      } else {
        segments.push("_*" + snakeCamelSegment);
        segments.push("\\s*[" + (_.escapeRegExp(nonWordCharacters)) + "]+");
      }
      segments.push("_+");
      return new RegExp(segments.join("|"), "g");
    };


    /*
    Section: Private
     */

    Cursor.prototype.getNonWordCharacters = function() {
      return this.editor.getNonWordCharacters(this.getScopeDescriptor().getScopesArray());
    };

    Cursor.prototype.changePosition = function(options, fn) {
      var ref1;
      this.clearSelection({
        autoscroll: false
      });
      fn();
      if ((ref1 = options.autoscroll) != null ? ref1 : this.isLastCursor()) {
        return this.autoscroll();
      }
    };

    Cursor.prototype.getPixelRect = function() {
      return this.editor.pixelRectForScreenRange(this.getScreenRange());
    };

    Cursor.prototype.getScreenRange = function() {
      var column, ref1, row;
      ref1 = this.getScreenPosition(), row = ref1.row, column = ref1.column;
      return new Range(new Point(row, column), new Point(row, column + 1));
    };

    Cursor.prototype.autoscroll = function(options) {
      return this.editor.scrollToScreenRange(this.getScreenRange(), options);
    };

    Cursor.prototype.getBeginningOfNextParagraphBufferPosition = function() {
      var column, eof, position, row, scanRange, start;
      start = this.getBufferPosition();
      eof = this.editor.getEofBufferPosition();
      scanRange = [start, eof];
      row = eof.row, column = eof.column;
      position = new Point(row, column - 1);
      this.editor.scanInBufferRange(EmptyLineRegExp, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        position = range.start.traverse(Point(1, 0));
        if (!position.isEqual(start)) {
          return stop();
        }
      });
      return position;
    };

    Cursor.prototype.getBeginningOfPreviousParagraphBufferPosition = function() {
      var column, position, row, scanRange, start;
      start = this.getBufferPosition();
      row = start.row, column = start.column;
      scanRange = [[row - 1, column], [0, 0]];
      position = new Point(0, 0);
      this.editor.backwardsScanInBufferRange(EmptyLineRegExp, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        position = range.start.traverse(Point(1, 0));
        if (!position.isEqual(start)) {
          return stop();
        }
      });
      return position;
    };

    return Cursor;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jdXJzb3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2REFBQTtJQUFBOzs7RUFBQSxNQUFpQixPQUFBLENBQVEsYUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1AsVUFBVyxPQUFBLENBQVEsV0FBUjs7RUFDWixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFFUixlQUFBLEdBQWtCOztFQU9sQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7cUJBQ0osY0FBQSxHQUFnQjs7cUJBQ2hCLGNBQUEsR0FBZ0I7O3FCQUNoQixVQUFBLEdBQVk7O3FCQUNaLE9BQUEsR0FBUzs7SUFHSSxnQkFBQyxHQUFEO0FBQ1gsVUFBQTtNQURhLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLGFBQUEsUUFBUTtNQUMvQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFFZixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7TUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtJQUpXOztxQkFNYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBO0lBRE87OztBQUdUOzs7O3FCQWdCQSxtQkFBQSxHQUFxQixTQUFDLFFBQUQ7YUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVkscUJBQVosRUFBbUMsUUFBbkM7SUFEbUI7O3FCQVFyQixZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURZOztxQkFTZCxxQkFBQSxHQUF1QixTQUFDLFFBQUQ7YUFDckIsSUFBQyxDQUFBLE9BQU8sQ0FB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cEI1QjtBQWJyQiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG57RW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuTW9kZWwgPSByZXF1aXJlICcuL21vZGVsJ1xuXG5FbXB0eUxpbmVSZWdFeHAgPSAvKFxcclxcbltcXHQgXSpcXHJcXG4pfChcXG5bXFx0IF0qXFxuKS9nXG5cbiMgRXh0ZW5kZWQ6IFRoZSBgQ3Vyc29yYCBjbGFzcyByZXByZXNlbnRzIHRoZSBsaXR0bGUgYmxpbmtpbmcgbGluZSBpZGVudGlmeWluZ1xuIyB3aGVyZSB0ZXh0IGNhbiBiZSBpbnNlcnRlZC5cbiNcbiMgQ3Vyc29ycyBiZWxvbmcgdG8ge1RleHRFZGl0b3J9cyBhbmQgaGF2ZSBzb21lIG1ldGFkYXRhIGF0dGFjaGVkIGluIHRoZSBmb3JtXG4jIG9mIGEge0Rpc3BsYXlNYXJrZXJ9LlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ3Vyc29yIGV4dGVuZHMgTW9kZWxcbiAgc2NyZWVuUG9zaXRpb246IG51bGxcbiAgYnVmZmVyUG9zaXRpb246IG51bGxcbiAgZ29hbENvbHVtbjogbnVsbFxuICB2aXNpYmxlOiB0cnVlXG5cbiAgIyBJbnN0YW50aWF0ZWQgYnkgYSB7VGV4dEVkaXRvcn1cbiAgY29uc3RydWN0b3I6ICh7QGVkaXRvciwgQG1hcmtlciwgaWR9KSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBhc3NpZ25JZChpZClcbiAgICBAdXBkYXRlVmlzaWJpbGl0eSgpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAbWFya2VyLmRlc3Ryb3koKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBQdWJsaWM6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBjdXJzb3IgaGFzIGJlZW4gbW92ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9XG4gICMgICAgICogYG9sZEJ1ZmZlclBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG9sZFNjcmVlblBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG5ld0J1ZmZlclBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYG5ld1NjcmVlblBvc2l0aW9uYCB7UG9pbnR9XG4gICMgICAgICogYHRleHRDaGFuZ2VkYCB7Qm9vbGVhbn1cbiAgIyAgICAgKiBgQ3Vyc29yYCB7Q3Vyc29yfSB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnRcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlUG9zaXRpb246IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1wb3NpdGlvbicsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBjdXJzb3IgaXMgZGVzdHJveWVkXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogQ2FsbHMgeW91ciBgY2FsbGJhY2tgIHdoZW4gdGhlIGN1cnNvcidzIHZpc2liaWxpdHkgaGFzIGNoYW5nZWRcbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGB2aXNpYmlsaXR5YCB7Qm9vbGVhbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlVmlzaWJpbGl0eTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXZpc2liaWxpdHknLCBjYWxsYmFja1xuXG4gICMjI1xuICBTZWN0aW9uOiBNYW5hZ2luZyBDdXJzb3IgUG9zaXRpb25cbiAgIyMjXG5cbiAgIyBQdWJsaWM6IE1vdmVzIGEgY3Vyc29yIHRvIGEgZ2l2ZW4gc2NyZWVuIHBvc2l0aW9uLlxuICAjXG4gICMgKiBgc2NyZWVuUG9zaXRpb25gIHtBcnJheX0gb2YgdHdvIG51bWJlcnM6IHRoZSBzY3JlZW4gcm93LCBhbmQgdGhlIHNjcmVlbiBjb2x1bW4uXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGF1dG9zY3JvbGxgIEEgQm9vbGVhbiB3aGljaCwgaWYgYHRydWVgLCBzY3JvbGxzIHRoZSB7VGV4dEVkaXRvcn0gdG8gd2hlcmV2ZXJcbiAgIyAgICAgdGhlIGN1cnNvciBtb3ZlcyB0by5cbiAgc2V0U2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbiwgb3B0aW9ucz17fSkgLT5cbiAgICBAY2hhbmdlUG9zaXRpb24gb3B0aW9ucywgPT5cbiAgICAgIEBtYXJrZXIuc2V0SGVhZFNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uLCBvcHRpb25zKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBzY3JlZW4gcG9zaXRpb24gb2YgdGhlIGN1cnNvciBhcyBhIHtQb2ludH0uXG4gIGdldFNjcmVlblBvc2l0aW9uOiAtPlxuICAgIEBtYXJrZXIuZ2V0SGVhZFNjcmVlblBvc2l0aW9uKClcblxuICAjIFB1YmxpYzogTW92ZXMgYSBjdXJzb3IgdG8gYSBnaXZlbiBidWZmZXIgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBidWZmZXJQb3NpdGlvbmAge0FycmF5fSBvZiB0d28gbnVtYmVyczogdGhlIGJ1ZmZlciByb3csIGFuZCB0aGUgYnVmZmVyIGNvbHVtbi5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgYXV0b3Njcm9sbGAge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBhdXRvc2Nyb2xsIHRvIHRoZSBuZXdcbiAgIyAgICAgcG9zaXRpb24uIERlZmF1bHRzIHRvIGB0cnVlYCBpZiB0aGlzIGlzIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIGN1cnNvcixcbiAgIyAgICAgYGZhbHNlYCBvdGhlcndpc2UuXG4gIHNldEJ1ZmZlclBvc2l0aW9uOiAoYnVmZmVyUG9zaXRpb24sIG9wdGlvbnM9e30pIC0+XG4gICAgQGNoYW5nZVBvc2l0aW9uIG9wdGlvbnMsID0+XG4gICAgICBAbWFya2VyLnNldEhlYWRCdWZmZXJQb3NpdGlvbihidWZmZXJQb3NpdGlvbiwgb3B0aW9ucylcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY3VycmVudCBidWZmZXIgcG9zaXRpb24gYXMgYW4gQXJyYXkuXG4gIGdldEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBtYXJrZXIuZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY3Vyc29yJ3MgY3VycmVudCBzY3JlZW4gcm93LlxuICBnZXRTY3JlZW5Sb3c6IC0+XG4gICAgQGdldFNjcmVlblBvc2l0aW9uKCkucm93XG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIGN1cnNvcidzIGN1cnJlbnQgc2NyZWVuIGNvbHVtbi5cbiAgZ2V0U2NyZWVuQ29sdW1uOiAtPlxuICAgIEBnZXRTY3JlZW5Qb3NpdGlvbigpLmNvbHVtblxuXG4gICMgUHVibGljOiBSZXRyaWV2ZXMgdGhlIGN1cnNvcidzIGN1cnJlbnQgYnVmZmVyIHJvdy5cbiAgZ2V0QnVmZmVyUm93OiAtPlxuICAgIEBnZXRCdWZmZXJQb3NpdGlvbigpLnJvd1xuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBjdXJzb3IncyBjdXJyZW50IGJ1ZmZlciBjb2x1bW4uXG4gIGdldEJ1ZmZlckNvbHVtbjogLT5cbiAgICBAZ2V0QnVmZmVyUG9zaXRpb24oKS5jb2x1bW5cblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY3Vyc29yJ3MgY3VycmVudCBidWZmZXIgcm93IG9mIHRleHQgZXhjbHVkaW5nIGl0cyBsaW5lXG4gICMgZW5kaW5nLlxuICBnZXRDdXJyZW50QnVmZmVyTGluZTogLT5cbiAgICBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KEBnZXRCdWZmZXJSb3coKSlcblxuICAjIFB1YmxpYzogUmV0dXJucyB3aGV0aGVyIHRoZSBjdXJzb3IgaXMgYXQgdGhlIHN0YXJ0IG9mIGEgbGluZS5cbiAgaXNBdEJlZ2lubmluZ09mTGluZTogLT5cbiAgICBAZ2V0QnVmZmVyUG9zaXRpb24oKS5jb2x1bW4gaXMgMFxuXG4gICMgUHVibGljOiBSZXR1cm5zIHdoZXRoZXIgdGhlIGN1cnNvciBpcyBvbiB0aGUgbGluZSByZXR1cm4gY2hhcmFjdGVyLlxuICBpc0F0RW5kT2ZMaW5lOiAtPlxuICAgIEBnZXRCdWZmZXJQb3NpdGlvbigpLmlzRXF1YWwoQGdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2UoKS5lbmQpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEN1cnNvciBQb3NpdGlvbiBEZXRhaWxzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSB1bmRlcmx5aW5nIHtEaXNwbGF5TWFya2VyfSBmb3IgdGhlIGN1cnNvci5cbiAgIyBVc2VmdWwgd2l0aCBvdmVybGF5IHtEZWNvcmF0aW9ufXMuXG4gIGdldE1hcmtlcjogLT4gQG1hcmtlclxuXG4gICMgUHVibGljOiBJZGVudGlmaWVzIGlmIHRoZSBjdXJzb3IgaXMgc3Vycm91bmRlZCBieSB3aGl0ZXNwYWNlLlxuICAjXG4gICMgXCJTdXJyb3VuZGVkXCIgaGVyZSBtZWFucyB0aGF0IHRoZSBjaGFyYWN0ZXIgZGlyZWN0bHkgYmVmb3JlIGFuZCBhZnRlciB0aGVcbiAgIyBjdXJzb3IgYXJlIGJvdGggd2hpdGVzcGFjZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzU3Vycm91bmRlZEJ5V2hpdGVzcGFjZTogLT5cbiAgICB7cm93LCBjb2x1bW59ID0gQGdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICByYW5nZSA9IFtbcm93LCBjb2x1bW4gLSAxXSwgW3JvdywgY29sdW1uICsgMV1dXG4gICAgL15cXHMrJC8udGVzdCBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHdoZXRoZXIgdGhlIGN1cnNvciBpcyBjdXJyZW50bHkgYmV0d2VlbiBhIHdvcmQgYW5kIG5vbi13b3JkXG4gICMgY2hhcmFjdGVyLiBUaGUgbm9uLXdvcmQgY2hhcmFjdGVycyBhcmUgZGVmaW5lZCBieSB0aGVcbiAgIyBgZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzYCBjb25maWcgdmFsdWUuXG4gICNcbiAgIyBUaGlzIG1ldGhvZCByZXR1cm5zIGZhbHNlIGlmIHRoZSBjaGFyYWN0ZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSBjdXJzb3IgaXNcbiAgIyB3aGl0ZXNwYWNlLlxuICAjXG4gICMgUmV0dXJucyBhIEJvb2xlYW4uXG4gIGlzQmV0d2VlbldvcmRBbmROb25Xb3JkOiAtPlxuICAgIHJldHVybiBmYWxzZSBpZiBAaXNBdEJlZ2lubmluZ09mTGluZSgpIG9yIEBpc0F0RW5kT2ZMaW5lKClcblxuICAgIHtyb3csIGNvbHVtbn0gPSBAZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJhbmdlID0gW1tyb3csIGNvbHVtbiAtIDFdLCBbcm93LCBjb2x1bW4gKyAxXV1cbiAgICBbYmVmb3JlLCBhZnRlcl0gPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIHJldHVybiBmYWxzZSBpZiAvXFxzLy50ZXN0KGJlZm9yZSkgb3IgL1xccy8udGVzdChhZnRlcilcblxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gQGdldE5vbldvcmRDaGFyYWN0ZXJzKClcbiAgICBub25Xb3JkQ2hhcmFjdGVycy5pbmNsdWRlcyhiZWZvcmUpIGlzbnQgbm9uV29yZENoYXJhY3RlcnMuaW5jbHVkZXMoYWZ0ZXIpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgd2hldGhlciB0aGlzIGN1cnNvciBpcyBiZXR3ZWVuIGEgd29yZCdzIHN0YXJ0IGFuZCBlbmQuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGB3b3JkUmVnZXhgIEEge1JlZ0V4cH0gaW5kaWNhdGluZyB3aGF0IGNvbnN0aXR1dGVzIGEgXCJ3b3JkXCJcbiAgIyAgICAgKGRlZmF1bHQ6IHs6OndvcmRSZWdFeHB9KS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn1cbiAgaXNJbnNpZGVXb3JkOiAob3B0aW9ucykgLT5cbiAgICB7cm93LCBjb2x1bW59ID0gQGdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICByYW5nZSA9IFtbcm93LCBjb2x1bW5dLCBbcm93LCBJbmZpbml0eV1dXG4gICAgQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSkuc2VhcmNoKG9wdGlvbnM/LndvcmRSZWdleCA/IEB3b3JkUmVnRXhwKCkpIGlzIDBcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgaW5kZW50YXRpb24gbGV2ZWwgb2YgdGhlIGN1cnJlbnQgbGluZS5cbiAgZ2V0SW5kZW50TGV2ZWw6IC0+XG4gICAgaWYgQGVkaXRvci5nZXRTb2Z0VGFicygpXG4gICAgICBAZ2V0QnVmZmVyQ29sdW1uKCkgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgZWxzZVxuICAgICAgQGdldEJ1ZmZlckNvbHVtbigpXG5cbiAgIyBQdWJsaWM6IFJldHJpZXZlcyB0aGUgc2NvcGUgZGVzY3JpcHRvciBmb3IgdGhlIGN1cnNvcidzIGN1cnJlbnQgcG9zaXRpb24uXG4gICNcbiAgIyBSZXR1cm5zIGEge1Njb3BlRGVzY3JpcHRvcn1cbiAgZ2V0U2NvcGVEZXNjcmlwdG9yOiAtPlxuICAgIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oQGdldEJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdHJ1ZSBpZiB0aGlzIGN1cnNvciBoYXMgbm8gbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBiZWZvcmVcbiAgIyBpdHMgY3VycmVudCBwb3NpdGlvbi5cbiAgaGFzUHJlY2VkaW5nQ2hhcmFjdGVyc09uTGluZTogLT5cbiAgICBidWZmZXJQb3NpdGlvbiA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coYnVmZmVyUG9zaXRpb24ucm93KVxuICAgIGZpcnN0Q2hhcmFjdGVyQ29sdW1uID0gbGluZS5zZWFyY2goL1xcUy8pXG5cbiAgICBpZiBmaXJzdENoYXJhY3RlckNvbHVtbiBpcyAtMVxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICBidWZmZXJQb3NpdGlvbi5jb2x1bW4gPiBmaXJzdENoYXJhY3RlckNvbHVtblxuXG4gICMgUHVibGljOiBJZGVudGlmaWVzIGlmIHRoaXMgY3Vyc29yIGlzIHRoZSBsYXN0IGluIHRoZSB7VGV4dEVkaXRvcn0uXG4gICNcbiAgIyBcIkxhc3RcIiBpcyBkZWZpbmVkIGFzIHRoZSBtb3N0IHJlY2VudGx5IGFkZGVkIGN1cnNvci5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzTGFzdEN1cnNvcjogLT5cbiAgICB0aGlzIGlzIEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1vdmluZyB0aGUgQ3Vyc29yXG4gICMjI1xuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHVwIG9uZSBzY3JlZW4gcm93LlxuICAjXG4gICMgKiBgcm93Q291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIHJvd3MgdG8gbW92ZSAoZGVmYXVsdDogMSlcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbW92ZVRvRW5kT2ZTZWxlY3Rpb25gIGlmIHRydWUsIG1vdmUgdG8gdGhlIGxlZnQgb2YgdGhlIHNlbGVjdGlvbiBpZiBhXG4gICMgICAgIHNlbGVjdGlvbiBleGlzdHMuXG4gIG1vdmVVcDogKHJvd0NvdW50PTEsIHttb3ZlVG9FbmRPZlNlbGVjdGlvbn09e30pIC0+XG4gICAgcmFuZ2UgPSBAbWFya2VyLmdldFNjcmVlblJhbmdlKClcbiAgICBpZiBtb3ZlVG9FbmRPZlNlbGVjdGlvbiBhbmQgbm90IHJhbmdlLmlzRW1wdHkoKVxuICAgICAge3JvdywgY29sdW1ufSA9IHJhbmdlLnN0YXJ0XG4gICAgZWxzZVxuICAgICAge3JvdywgY29sdW1ufSA9IEBnZXRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgICBjb2x1bW4gPSBAZ29hbENvbHVtbiBpZiBAZ29hbENvbHVtbj9cbiAgICBAc2V0U2NyZWVuUG9zaXRpb24oe3Jvdzogcm93IC0gcm93Q291bnQsIGNvbHVtbjogY29sdW1ufSwgc2tpcFNvZnRXcmFwSW5kZW50YXRpb246IHRydWUpXG4gICAgQGdvYWxDb2x1bW4gPSBjb2x1bW5cblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciBkb3duIG9uZSBzY3JlZW4gcm93LlxuICAjXG4gICMgKiBgcm93Q291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIHJvd3MgdG8gbW92ZSAoZGVmYXVsdDogMSlcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbW92ZVRvRW5kT2ZTZWxlY3Rpb25gIGlmIHRydWUsIG1vdmUgdG8gdGhlIGxlZnQgb2YgdGhlIHNlbGVjdGlvbiBpZiBhXG4gICMgICAgIHNlbGVjdGlvbiBleGlzdHMuXG4gIG1vdmVEb3duOiAocm93Q291bnQ9MSwge21vdmVUb0VuZE9mU2VsZWN0aW9ufT17fSkgLT5cbiAgICByYW5nZSA9IEBtYXJrZXIuZ2V0U2NyZWVuUmFuZ2UoKVxuICAgIGlmIG1vdmVUb0VuZE9mU2VsZWN0aW9uIGFuZCBub3QgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICB7cm93LCBjb2x1bW59ID0gcmFuZ2UuZW5kXG4gICAgZWxzZVxuICAgICAge3JvdywgY29sdW1ufSA9IEBnZXRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgICBjb2x1bW4gPSBAZ29hbENvbHVtbiBpZiBAZ29hbENvbHVtbj9cbiAgICBAc2V0U2NyZWVuUG9zaXRpb24oe3Jvdzogcm93ICsgcm93Q291bnQsIGNvbHVtbjogY29sdW1ufSwgc2tpcFNvZnRXcmFwSW5kZW50YXRpb246IHRydWUpXG4gICAgQGdvYWxDb2x1bW4gPSBjb2x1bW5cblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciBsZWZ0IG9uZSBzY3JlZW4gY29sdW1uLlxuICAjXG4gICMgKiBgY29sdW1uQ291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIGNvbHVtbnMgdG8gbW92ZSAoZGVmYXVsdDogMSlcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbW92ZVRvRW5kT2ZTZWxlY3Rpb25gIGlmIHRydWUsIG1vdmUgdG8gdGhlIGxlZnQgb2YgdGhlIHNlbGVjdGlvbiBpZiBhXG4gICMgICAgIHNlbGVjdGlvbiBleGlzdHMuXG4gIG1vdmVMZWZ0OiAoY29sdW1uQ291bnQ9MSwge21vdmVUb0VuZE9mU2VsZWN0aW9ufT17fSkgLT5cbiAgICByYW5nZSA9IEBtYXJrZXIuZ2V0U2NyZWVuUmFuZ2UoKVxuICAgIGlmIG1vdmVUb0VuZE9mU2VsZWN0aW9uIGFuZCBub3QgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICBAc2V0U2NyZWVuUG9zaXRpb24ocmFuZ2Uuc3RhcnQpXG4gICAgZWxzZVxuICAgICAge3JvdywgY29sdW1ufSA9IEBnZXRTY3JlZW5Qb3NpdGlvbigpXG5cbiAgICAgIHdoaWxlIGNvbHVtbkNvdW50ID4gY29sdW1uIGFuZCByb3cgPiAwXG4gICAgICAgIGNvbHVtbkNvdW50IC09IGNvbHVtblxuICAgICAgICBjb2x1bW4gPSBAZWRpdG9yLmxpbmVMZW5ndGhGb3JTY3JlZW5Sb3coLS1yb3cpXG4gICAgICAgIGNvbHVtbkNvdW50LS0gIyBzdWJ0cmFjdCAxIGZvciB0aGUgcm93IG1vdmVcblxuICAgICAgY29sdW1uID0gY29sdW1uIC0gY29sdW1uQ291bnRcbiAgICAgIEBzZXRTY3JlZW5Qb3NpdGlvbih7cm93LCBjb2x1bW59LCBjbGlwRGlyZWN0aW9uOiAnYmFja3dhcmQnKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHJpZ2h0IG9uZSBzY3JlZW4gY29sdW1uLlxuICAjXG4gICMgKiBgY29sdW1uQ291bnRgIChvcHRpb25hbCkge051bWJlcn0gbnVtYmVyIG9mIGNvbHVtbnMgdG8gbW92ZSAoZGVmYXVsdDogMSlcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbW92ZVRvRW5kT2ZTZWxlY3Rpb25gIGlmIHRydWUsIG1vdmUgdG8gdGhlIHJpZ2h0IG9mIHRoZSBzZWxlY3Rpb24gaWYgYVxuICAjICAgICBzZWxlY3Rpb24gZXhpc3RzLlxuICBtb3ZlUmlnaHQ6IChjb2x1bW5Db3VudD0xLCB7bW92ZVRvRW5kT2ZTZWxlY3Rpb259PXt9KSAtPlxuICAgIHJhbmdlID0gQG1hcmtlci5nZXRTY3JlZW5SYW5nZSgpXG4gICAgaWYgbW92ZVRvRW5kT2ZTZWxlY3Rpb24gYW5kIG5vdCByYW5nZS5pc0VtcHR5KClcbiAgICAgIEBzZXRTY3JlZW5Qb3NpdGlvbihyYW5nZS5lbmQpXG4gICAgZWxzZVxuICAgICAge3JvdywgY29sdW1ufSA9IEBnZXRTY3JlZW5Qb3NpdGlvbigpXG4gICAgICBtYXhMaW5lcyA9IEBlZGl0b3IuZ2V0U2NyZWVuTGluZUNvdW50KClcbiAgICAgIHJvd0xlbmd0aCA9IEBlZGl0b3IubGluZUxlbmd0aEZvclNjcmVlblJvdyhyb3cpXG4gICAgICBjb2x1bW5zUmVtYWluaW5nSW5MaW5lID0gcm93TGVuZ3RoIC0gY29sdW1uXG5cbiAgICAgIHdoaWxlIGNvbHVtbkNvdW50ID4gY29sdW1uc1JlbWFpbmluZ0luTGluZSBhbmQgcm93IDwgbWF4TGluZXMgLSAxXG4gICAgICAgIGNvbHVtbkNvdW50IC09IGNvbHVtbnNSZW1haW5pbmdJbkxpbmVcbiAgICAgICAgY29sdW1uQ291bnQtLSAjIHN1YnRyYWN0IDEgZm9yIHRoZSByb3cgbW92ZVxuXG4gICAgICAgIGNvbHVtbiA9IDBcbiAgICAgICAgcm93TGVuZ3RoID0gQGVkaXRvci5saW5lTGVuZ3RoRm9yU2NyZWVuUm93KCsrcm93KVxuICAgICAgICBjb2x1bW5zUmVtYWluaW5nSW5MaW5lID0gcm93TGVuZ3RoXG5cbiAgICAgIGNvbHVtbiA9IGNvbHVtbiArIGNvbHVtbkNvdW50XG4gICAgICBAc2V0U2NyZWVuUG9zaXRpb24oe3JvdywgY29sdW1ufSwgY2xpcERpcmVjdGlvbjogJ2ZvcndhcmQnKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSB0b3Agb2YgdGhlIGJ1ZmZlci5cbiAgbW92ZVRvVG9wOiAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvbihbMCwgMF0pXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJvdHRvbSBvZiB0aGUgYnVmZmVyLlxuICBtb3ZlVG9Cb3R0b206IC0+XG4gICAgQHNldEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKSlcblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lLlxuICBtb3ZlVG9CZWdpbm5pbmdPZlNjcmVlbkxpbmU6IC0+XG4gICAgQHNldFNjcmVlblBvc2l0aW9uKFtAZ2V0U2NyZWVuUm93KCksIDBdKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciBsaW5lLlxuICBtb3ZlVG9CZWdpbm5pbmdPZkxpbmU6IC0+XG4gICAgQHNldEJ1ZmZlclBvc2l0aW9uKFtAZ2V0QnVmZmVyUm93KCksIDBdKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpcnN0IGNoYXJhY3RlciBpbiB0aGVcbiAgIyBsaW5lLlxuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZTogLT5cbiAgICBzY3JlZW5Sb3cgPSBAZ2V0U2NyZWVuUm93KClcbiAgICBzY3JlZW5MaW5lU3RhcnQgPSBAZWRpdG9yLmNsaXBTY3JlZW5Qb3NpdGlvbihbc2NyZWVuUm93LCAwXSwgc2tpcFNvZnRXcmFwSW5kZW50YXRpb246IHRydWUpXG4gICAgc2NyZWVuTGluZUVuZCA9IFtzY3JlZW5Sb3csIEluZmluaXR5XVxuICAgIHNjcmVlbkxpbmVCdWZmZXJSYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY3JlZW5SYW5nZShbc2NyZWVuTGluZVN0YXJ0LCBzY3JlZW5MaW5lRW5kXSlcblxuICAgIGZpcnN0Q2hhcmFjdGVyQ29sdW1uID0gbnVsbFxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgL1xcUy8sIHNjcmVlbkxpbmVCdWZmZXJSYW5nZSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBmaXJzdENoYXJhY3RlckNvbHVtbiA9IHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgc3RvcCgpXG5cbiAgICBpZiBmaXJzdENoYXJhY3RlckNvbHVtbj8gYW5kIGZpcnN0Q2hhcmFjdGVyQ29sdW1uIGlzbnQgQGdldEJ1ZmZlckNvbHVtbigpXG4gICAgICB0YXJnZXRCdWZmZXJDb2x1bW4gPSBmaXJzdENoYXJhY3RlckNvbHVtblxuICAgIGVsc2VcbiAgICAgIHRhcmdldEJ1ZmZlckNvbHVtbiA9IHNjcmVlbkxpbmVCdWZmZXJSYW5nZS5zdGFydC5jb2x1bW5cblxuICAgIEBzZXRCdWZmZXJQb3NpdGlvbihbc2NyZWVuTGluZUJ1ZmZlclJhbmdlLnN0YXJ0LnJvdywgdGFyZ2V0QnVmZmVyQ29sdW1uXSlcblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBsaW5lLlxuICBtb3ZlVG9FbmRPZlNjcmVlbkxpbmU6IC0+XG4gICAgQHNldFNjcmVlblBvc2l0aW9uKFtAZ2V0U2NyZWVuUm93KCksIEluZmluaXR5XSlcblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBidWZmZXIgbGluZS5cbiAgbW92ZVRvRW5kT2ZMaW5lOiAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvbihbQGdldEJ1ZmZlclJvdygpLCBJbmZpbml0eV0pXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgd29yZC5cbiAgbW92ZVRvQmVnaW5uaW5nT2ZXb3JkOiAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvbihAZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGUgd29yZC5cbiAgbW92ZVRvRW5kT2ZXb3JkOiAtPlxuICAgIGlmIHBvc2l0aW9uID0gQGdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAc2V0QnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB3b3JkLlxuICBtb3ZlVG9CZWdpbm5pbmdPZk5leHRXb3JkOiAtPlxuICAgIGlmIHBvc2l0aW9uID0gQGdldEJlZ2lubmluZ09mTmV4dFdvcmRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAc2V0QnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIHByZXZpb3VzIHdvcmQgYm91bmRhcnkuXG4gIG1vdmVUb1ByZXZpb3VzV29yZEJvdW5kYXJ5OiAtPlxuICAgIGlmIHBvc2l0aW9uID0gQGdldFByZXZpb3VzV29yZEJvdW5kYXJ5QnVmZmVyUG9zaXRpb24oKVxuICAgICAgQHNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBuZXh0IHdvcmQgYm91bmRhcnkuXG4gIG1vdmVUb05leHRXb3JkQm91bmRhcnk6IC0+XG4gICAgaWYgcG9zaXRpb24gPSBAZ2V0TmV4dFdvcmRCb3VuZGFyeUJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIEBzZXRCdWZmZXJQb3NpdGlvbihwb3NpdGlvbilcblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgcHJldmlvdXMgc3Vid29yZCBib3VuZGFyeS5cbiAgbW92ZVRvUHJldmlvdXNTdWJ3b3JkQm91bmRhcnk6IC0+XG4gICAgb3B0aW9ucyA9IHt3b3JkUmVnZXg6IEBzdWJ3b3JkUmVnRXhwKGJhY2t3YXJkczogdHJ1ZSl9XG4gICAgaWYgcG9zaXRpb24gPSBAZ2V0UHJldmlvdXNXb3JkQm91bmRhcnlCdWZmZXJQb3NpdGlvbihvcHRpb25zKVxuICAgICAgQHNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBuZXh0IHN1YndvcmQgYm91bmRhcnkuXG4gIG1vdmVUb05leHRTdWJ3b3JkQm91bmRhcnk6IC0+XG4gICAgb3B0aW9ucyA9IHt3b3JkUmVnZXg6IEBzdWJ3b3JkUmVnRXhwKCl9XG4gICAgaWYgcG9zaXRpb24gPSBAZ2V0TmV4dFdvcmRCb3VuZGFyeUJ1ZmZlclBvc2l0aW9uKG9wdGlvbnMpXG4gICAgICBAc2V0QnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG5cbiAgIyBQdWJsaWM6IE1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGxpbmUsIHNraXBwaW5nIGFsbFxuICAjIHdoaXRlc3BhY2UuXG4gIHNraXBMZWFkaW5nV2hpdGVzcGFjZTogLT5cbiAgICBwb3NpdGlvbiA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgc2NhblJhbmdlID0gQGdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2UoKVxuICAgIGVuZE9mTGVhZGluZ1doaXRlc3BhY2UgPSBudWxsXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSAvXlsgXFx0XSovLCBzY2FuUmFuZ2UsICh7cmFuZ2V9KSAtPlxuICAgICAgZW5kT2ZMZWFkaW5nV2hpdGVzcGFjZSA9IHJhbmdlLmVuZFxuXG4gICAgQHNldEJ1ZmZlclBvc2l0aW9uKGVuZE9mTGVhZGluZ1doaXRlc3BhY2UpIGlmIGVuZE9mTGVhZGluZ1doaXRlc3BhY2UuaXNHcmVhdGVyVGhhbihwb3NpdGlvbilcblxuICAjIFB1YmxpYzogTW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHBhcmFncmFwaFxuICBtb3ZlVG9CZWdpbm5pbmdPZk5leHRQYXJhZ3JhcGg6IC0+XG4gICAgaWYgcG9zaXRpb24gPSBAZ2V0QmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoQnVmZmVyUG9zaXRpb24oKVxuICAgICAgQHNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gICMgUHVibGljOiBNb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHByZXZpb3VzIHBhcmFncmFwaFxuICBtb3ZlVG9CZWdpbm5pbmdPZlByZXZpb3VzUGFyYWdyYXBoOiAtPlxuICAgIGlmIHBvc2l0aW9uID0gQGdldEJlZ2lubmluZ09mUHJldmlvdXNQYXJhZ3JhcGhCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAc2V0QnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG5cbiAgIyMjXG4gIFNlY3Rpb246IExvY2FsIFBvc2l0aW9ucyBhbmQgUmFuZ2VzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGJ1ZmZlciBwb3NpdGlvbiBvZiBwcmV2aW91cyB3b3JkIGJvdW5kYXJ5LiBJdCBtaWdodCBiZSBvblxuICAjIHRoZSBjdXJyZW50IHdvcmQsIG9yIHRoZSBwcmV2aW91cyB3b3JkLlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYHdvcmRSZWdleGAgQSB7UmVnRXhwfSBpbmRpY2F0aW5nIHdoYXQgY29uc3RpdHV0ZXMgYSBcIndvcmRcIlxuICAjICAgICAgKGRlZmF1bHQ6IHs6OndvcmRSZWdFeHB9KVxuICBnZXRQcmV2aW91c1dvcmRCb3VuZGFyeUJ1ZmZlclBvc2l0aW9uOiAob3B0aW9ucyA9IHt9KSAtPlxuICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvbiA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgcHJldmlvdXNOb25CbGFua1JvdyA9IEBlZGl0b3IuYnVmZmVyLnByZXZpb3VzTm9uQmxhbmtSb3coY3VycmVudEJ1ZmZlclBvc2l0aW9uLnJvdylcbiAgICBzY2FuUmFuZ2UgPSBbW3ByZXZpb3VzTm9uQmxhbmtSb3cgPyAwLCAwXSwgY3VycmVudEJ1ZmZlclBvc2l0aW9uXVxuXG4gICAgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb24gPSBudWxsXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSAob3B0aW9ucy53b3JkUmVnZXggPyBAd29yZFJlZ0V4cCgpKSwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLnN0YXJ0LnJvdyA8IGN1cnJlbnRCdWZmZXJQb3NpdGlvbi5yb3cgYW5kIGN1cnJlbnRCdWZmZXJQb3NpdGlvbi5jb2x1bW4gPiAwXG4gICAgICAgICMgZm9yY2UgaXQgdG8gc3RvcCBhdCB0aGUgYmVnaW5uaW5nIG9mIGVhY2ggbGluZVxuICAgICAgICBiZWdpbm5pbmdPZldvcmRQb3NpdGlvbiA9IG5ldyBQb2ludChjdXJyZW50QnVmZmVyUG9zaXRpb24ucm93LCAwKVxuICAgICAgZWxzZSBpZiByYW5nZS5lbmQuaXNMZXNzVGhhbihjdXJyZW50QnVmZmVyUG9zaXRpb24pXG4gICAgICAgIGJlZ2lubmluZ09mV29yZFBvc2l0aW9uID0gcmFuZ2UuZW5kXG4gICAgICBlbHNlXG4gICAgICAgIGJlZ2lubmluZ09mV29yZFBvc2l0aW9uID0gcmFuZ2Uuc3RhcnRcblxuICAgICAgaWYgbm90IGJlZ2lubmluZ09mV29yZFBvc2l0aW9uPy5pc0VxdWFsKGN1cnJlbnRCdWZmZXJQb3NpdGlvbilcbiAgICAgICAgc3RvcCgpXG5cbiAgICBiZWdpbm5pbmdPZldvcmRQb3NpdGlvbiBvciBjdXJyZW50QnVmZmVyUG9zaXRpb25cblxuICAjIFB1YmxpYzogUmV0dXJucyBidWZmZXIgcG9zaXRpb24gb2YgdGhlIG5leHQgd29yZCBib3VuZGFyeS4gSXQgbWlnaHQgYmUgb25cbiAgIyB0aGUgY3VycmVudCB3b3JkLCBvciB0aGUgcHJldmlvdXMgd29yZC5cbiAgI1xuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAqIGB3b3JkUmVnZXhgIEEge1JlZ0V4cH0gaW5kaWNhdGluZyB3aGF0IGNvbnN0aXR1dGVzIGEgXCJ3b3JkXCJcbiAgIyAgICAgIChkZWZhdWx0OiB7Ojp3b3JkUmVnRXhwfSlcbiAgZ2V0TmV4dFdvcmRCb3VuZGFyeUJ1ZmZlclBvc2l0aW9uOiAob3B0aW9ucyA9IHt9KSAtPlxuICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvbiA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgc2NhblJhbmdlID0gW2N1cnJlbnRCdWZmZXJQb3NpdGlvbiwgQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXVxuXG4gICAgZW5kT2ZXb3JkUG9zaXRpb24gPSBudWxsXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSAob3B0aW9ucy53b3JkUmVnZXggPyBAd29yZFJlZ0V4cCgpKSwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLnN0YXJ0LnJvdyA+IGN1cnJlbnRCdWZmZXJQb3NpdGlvbi5yb3dcbiAgICAgICAgIyBmb3JjZSBpdCB0byBzdG9wIGF0IHRoZSBiZWdpbm5pbmcgb2YgZWFjaCBsaW5lXG4gICAgICAgIGVuZE9mV29yZFBvc2l0aW9uID0gbmV3IFBvaW50KHJhbmdlLnN0YXJ0LnJvdywgMClcbiAgICAgIGVsc2UgaWYgcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihjdXJyZW50QnVmZmVyUG9zaXRpb24pXG4gICAgICAgIGVuZE9mV29yZFBvc2l0aW9uID0gcmFuZ2Uuc3RhcnRcbiAgICAgIGVsc2VcbiAgICAgICAgZW5kT2ZXb3JkUG9zaXRpb24gPSByYW5nZS5lbmRcblxuICAgICAgaWYgbm90IGVuZE9mV29yZFBvc2l0aW9uPy5pc0VxdWFsKGN1cnJlbnRCdWZmZXJQb3NpdGlvbilcbiAgICAgICAgc3RvcCgpXG5cbiAgICBlbmRPZldvcmRQb3NpdGlvbiBvciBjdXJyZW50QnVmZmVyUG9zaXRpb25cblxuICAjIFB1YmxpYzogUmV0cmlldmVzIHRoZSBidWZmZXIgcG9zaXRpb24gb2Ygd2hlcmUgdGhlIGN1cnJlbnQgd29yZCBzdGFydHMuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgd29yZFJlZ2V4YCBBIHtSZWdFeHB9IGluZGljYXRpbmcgd2hhdCBjb25zdGl0dXRlcyBhIFwid29yZFwiXG4gICMgICAgIChkZWZhdWx0OiB7Ojp3b3JkUmVnRXhwfSkuXG4gICMgICAqIGBpbmNsdWRlTm9uV29yZENoYXJhY3RlcnNgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBpbmNsdWRlXG4gICMgICAgIG5vbi13b3JkIGNoYXJhY3RlcnMgaW4gdGhlIGRlZmF1bHQgd29yZCByZWdleC5cbiAgIyAgICAgSGFzIG5vIGVmZmVjdCBpZiB3b3JkUmVnZXggaXMgc2V0LlxuICAjICAgKiBgYWxsb3dQcmV2aW91c2AgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICMgICAgIHByZXZpb3VzIHdvcmQgY2FuIGJlIHJldHVybmVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbjogKG9wdGlvbnMgPSB7fSkgLT5cbiAgICBhbGxvd1ByZXZpb3VzID0gb3B0aW9ucy5hbGxvd1ByZXZpb3VzID8gdHJ1ZVxuICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvbiA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgcHJldmlvdXNOb25CbGFua1JvdyA9IEBlZGl0b3IuYnVmZmVyLnByZXZpb3VzTm9uQmxhbmtSb3coY3VycmVudEJ1ZmZlclBvc2l0aW9uLnJvdykgPyAwXG4gICAgc2NhblJhbmdlID0gW1twcmV2aW91c05vbkJsYW5rUm93LCAwXSwgY3VycmVudEJ1ZmZlclBvc2l0aW9uXVxuXG4gICAgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb24gPSBudWxsXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSAob3B0aW9ucy53b3JkUmVnZXggPyBAd29yZFJlZ0V4cChvcHRpb25zKSksIHNjYW5SYW5nZSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBzdG9wfSkgLT5cbiAgICAgICMgSWdub3JlICdlbXB0eSBsaW5lJyBtYXRjaGVzIGJldHdlZW4gJ1xccicgYW5kICdcXG4nXG4gICAgICByZXR1cm4gaWYgbWF0Y2hUZXh0IGlzICcnIGFuZCByYW5nZS5zdGFydC5jb2x1bW4gaXNudCAwXG5cbiAgICAgIGlmIHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oY3VycmVudEJ1ZmZlclBvc2l0aW9uKVxuICAgICAgICBpZiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbk9yRXF1YWwoY3VycmVudEJ1ZmZlclBvc2l0aW9uKSBvciBhbGxvd1ByZXZpb3VzXG4gICAgICAgICAgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb24gPSByYW5nZS5zdGFydFxuICAgICAgICBzdG9wKClcblxuICAgIGlmIGJlZ2lubmluZ09mV29yZFBvc2l0aW9uP1xuICAgICAgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb25cbiAgICBlbHNlIGlmIGFsbG93UHJldmlvdXNcbiAgICAgIG5ldyBQb2ludCgwLCAwKVxuICAgIGVsc2VcbiAgICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvblxuXG4gICMgUHVibGljOiBSZXRyaWV2ZXMgdGhlIGJ1ZmZlciBwb3NpdGlvbiBvZiB3aGVyZSB0aGUgY3VycmVudCB3b3JkIGVuZHMuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgd29yZFJlZ2V4YCBBIHtSZWdFeHB9IGluZGljYXRpbmcgd2hhdCBjb25zdGl0dXRlcyBhIFwid29yZFwiXG4gICMgICAgICAoZGVmYXVsdDogezo6d29yZFJlZ0V4cH0pXG4gICMgICAqIGBpbmNsdWRlTm9uV29yZENoYXJhY3RlcnNgIEEgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gaW5jbHVkZVxuICAjICAgICBub24td29yZCBjaGFyYWN0ZXJzIGluIHRoZSBkZWZhdWx0IHdvcmQgcmVnZXguIEhhcyBubyBlZmZlY3QgaWZcbiAgIyAgICAgd29yZFJlZ2V4IGlzIHNldC5cbiAgI1xuICAjIFJldHVybnMgYSB7UmFuZ2V9LlxuICBnZXRFbmRPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb246IChvcHRpb25zID0ge30pIC0+XG4gICAgYWxsb3dOZXh0ID0gb3B0aW9ucy5hbGxvd05leHQgPyB0cnVlXG4gICAgY3VycmVudEJ1ZmZlclBvc2l0aW9uID0gQGdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBzY2FuUmFuZ2UgPSBbY3VycmVudEJ1ZmZlclBvc2l0aW9uLCBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKCldXG5cbiAgICBlbmRPZldvcmRQb3NpdGlvbiA9IG51bGxcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIChvcHRpb25zLndvcmRSZWdleCA/IEB3b3JkUmVnRXhwKG9wdGlvbnMpKSwgc2NhblJhbmdlLCAoe3JhbmdlLCBtYXRjaFRleHQsIHN0b3B9KSAtPlxuICAgICAgIyBJZ25vcmUgJ2VtcHR5IGxpbmUnIG1hdGNoZXMgYmV0d2VlbiAnXFxyJyBhbmQgJ1xcbidcbiAgICAgIHJldHVybiBpZiBtYXRjaFRleHQgaXMgJycgYW5kIHJhbmdlLnN0YXJ0LmNvbHVtbiBpc250IDBcblxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4oY3VycmVudEJ1ZmZlclBvc2l0aW9uKVxuICAgICAgICBpZiBhbGxvd05leHQgb3IgcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbk9yRXF1YWwoY3VycmVudEJ1ZmZlclBvc2l0aW9uKVxuICAgICAgICAgIGVuZE9mV29yZFBvc2l0aW9uID0gcmFuZ2UuZW5kXG4gICAgICAgIHN0b3AoKVxuXG4gICAgZW5kT2ZXb3JkUG9zaXRpb24gPyBjdXJyZW50QnVmZmVyUG9zaXRpb25cblxuICAjIFB1YmxpYzogUmV0cmlldmVzIHRoZSBidWZmZXIgcG9zaXRpb24gb2Ygd2hlcmUgdGhlIG5leHQgd29yZCBzdGFydHMuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGB3b3JkUmVnZXhgIEEge1JlZ0V4cH0gaW5kaWNhdGluZyB3aGF0IGNvbnN0aXR1dGVzIGEgXCJ3b3JkXCJcbiAgIyAgICAgKGRlZmF1bHQ6IHs6OndvcmRSZWdFeHB9KS5cbiAgI1xuICAjIFJldHVybnMgYSB7UmFuZ2V9XG4gIGdldEJlZ2lubmluZ09mTmV4dFdvcmRCdWZmZXJQb3NpdGlvbjogKG9wdGlvbnMgPSB7fSkgLT5cbiAgICBjdXJyZW50QnVmZmVyUG9zaXRpb24gPSBAZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHN0YXJ0ID0gaWYgQGlzSW5zaWRlV29yZChvcHRpb25zKSB0aGVuIEBnZXRFbmRPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24ob3B0aW9ucykgZWxzZSBjdXJyZW50QnVmZmVyUG9zaXRpb25cbiAgICBzY2FuUmFuZ2UgPSBbc3RhcnQsIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKV1cblxuICAgIGJlZ2lubmluZ09mTmV4dFdvcmRQb3NpdGlvbiA9IG51bGxcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIChvcHRpb25zLndvcmRSZWdleCA/IEB3b3JkUmVnRXhwKCkpLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgYmVnaW5uaW5nT2ZOZXh0V29yZFBvc2l0aW9uID0gcmFuZ2Uuc3RhcnRcbiAgICAgIHN0b3AoKVxuXG4gICAgYmVnaW5uaW5nT2ZOZXh0V29yZFBvc2l0aW9uIG9yIGN1cnJlbnRCdWZmZXJQb3NpdGlvblxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBidWZmZXIgUmFuZ2Ugb2NjdXBpZWQgYnkgdGhlIHdvcmQgbG9jYXRlZCB1bmRlciB0aGUgY3Vyc29yLlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fVxuICAjICAgKiBgd29yZFJlZ2V4YCBBIHtSZWdFeHB9IGluZGljYXRpbmcgd2hhdCBjb25zdGl0dXRlcyBhIFwid29yZFwiXG4gICMgICAgIChkZWZhdWx0OiB7Ojp3b3JkUmVnRXhwfSkuXG4gIGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2U6IChvcHRpb25zPXt9KSAtPlxuICAgIHN0YXJ0T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXy5jbG9uZShvcHRpb25zKSwgYWxsb3dQcmV2aW91czogZmFsc2UpXG4gICAgZW5kT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXy5jbG9uZShvcHRpb25zKSwgYWxsb3dOZXh0OiBmYWxzZSlcbiAgICBuZXcgUmFuZ2UoQGdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbihzdGFydE9wdGlvbnMpLCBAZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKGVuZE9wdGlvbnMpKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBidWZmZXIgUmFuZ2UgZm9yIHRoZSBjdXJyZW50IGxpbmUuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBpbmNsdWRlTmV3bGluZWAgQSB7Qm9vbGVhbn0gd2hpY2ggY29udHJvbHMgd2hldGhlciB0aGUgUmFuZ2Ugc2hvdWxkXG4gICMgICAgIGluY2x1ZGUgdGhlIG5ld2xpbmUuXG4gIGdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2U6IChvcHRpb25zKSAtPlxuICAgIEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coQGdldEJ1ZmZlclJvdygpLCBvcHRpb25zKVxuXG4gICMgUHVibGljOiBSZXRyaWV2ZXMgdGhlIHJhbmdlIGZvciB0aGUgY3VycmVudCBwYXJhZ3JhcGguXG4gICNcbiAgIyBBIHBhcmFncmFwaCBpcyBkZWZpbmVkIGFzIGEgYmxvY2sgb2YgdGV4dCBzdXJyb3VuZGVkIGJ5IGVtcHR5IGxpbmVzIG9yIGNvbW1lbnRzLlxuICAjXG4gICMgUmV0dXJucyBhIHtSYW5nZX0uXG4gIGdldEN1cnJlbnRQYXJhZ3JhcGhCdWZmZXJSYW5nZTogLT5cbiAgICBAZWRpdG9yLmxhbmd1YWdlTW9kZS5yb3dSYW5nZUZvclBhcmFncmFwaEF0QnVmZmVyUm93KEBnZXRCdWZmZXJSb3coKSlcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY2hhcmFjdGVycyBwcmVjZWRpbmcgdGhlIGN1cnNvciBpbiB0aGUgY3VycmVudCB3b3JkLlxuICBnZXRDdXJyZW50V29yZFByZWZpeDogLT5cbiAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtAZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKCksIEBnZXRCdWZmZXJQb3NpdGlvbigpXSlcblxuICAjIyNcbiAgU2VjdGlvbjogVmlzaWJpbGl0eVxuICAjIyNcblxuICAjIFB1YmxpYzogU2V0cyB3aGV0aGVyIHRoZSBjdXJzb3IgaXMgdmlzaWJsZS5cbiAgc2V0VmlzaWJsZTogKHZpc2libGUpIC0+XG4gICAgaWYgQHZpc2libGUgaXNudCB2aXNpYmxlXG4gICAgICBAdmlzaWJsZSA9IHZpc2libGVcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdmlzaWJpbGl0eScsIEB2aXNpYmxlXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGN1cnNvci5cbiAgaXNWaXNpYmxlOiAtPiBAdmlzaWJsZVxuXG4gIHVwZGF0ZVZpc2liaWxpdHk6IC0+XG4gICAgQHNldFZpc2libGUoQG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLmlzRW1wdHkoKSlcblxuICAjIyNcbiAgU2VjdGlvbjogQ29tcGFyaW5nIHRvIGFub3RoZXIgY3Vyc29yXG4gICMjI1xuXG4gICMgUHVibGljOiBDb21wYXJlIHRoaXMgY3Vyc29yJ3MgYnVmZmVyIHBvc2l0aW9uIHRvIGFub3RoZXIgY3Vyc29yJ3MgYnVmZmVyIHBvc2l0aW9uLlxuICAjXG4gICMgU2VlIHtQb2ludDo6Y29tcGFyZX0gZm9yIG1vcmUgZGV0YWlscy5cbiAgI1xuICAjICogYG90aGVyQ3Vyc29yYHtDdXJzb3J9IHRvIGNvbXBhcmUgYWdhaW5zdFxuICBjb21wYXJlOiAob3RoZXJDdXJzb3IpIC0+XG4gICAgQGdldEJ1ZmZlclBvc2l0aW9uKCkuY29tcGFyZShvdGhlckN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG4gICMjI1xuICBTZWN0aW9uOiBVdGlsaXRpZXNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFByZXZlbnRzIHRoaXMgY3Vyc29yIGZyb20gY2F1c2luZyBzY3JvbGxpbmcuXG4gIGNsZWFyQXV0b3Njcm9sbDogLT5cblxuICAjIFB1YmxpYzogRGVzZWxlY3RzIHRoZSBjdXJyZW50IHNlbGVjdGlvbi5cbiAgY2xlYXJTZWxlY3Rpb246IChvcHRpb25zKSAtPlxuICAgIEBzZWxlY3Rpb24/LmNsZWFyKG9wdGlvbnMpXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgUmVnRXhwIHVzZWQgYnkgdGhlIGN1cnNvciB0byBkZXRlcm1pbmUgd2hhdCBhIFwid29yZFwiIGlzLlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGluY2x1ZGVOb25Xb3JkQ2hhcmFjdGVyc2AgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGluY2x1ZGVcbiAgIyAgICAgbm9uLXdvcmQgY2hhcmFjdGVycyBpbiB0aGUgcmVnZXguIChkZWZhdWx0OiB0cnVlKVxuICAjXG4gICMgUmV0dXJucyBhIHtSZWdFeHB9LlxuICB3b3JkUmVnRXhwOiAob3B0aW9ucykgLT5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IF8uZXNjYXBlUmVnRXhwKEBnZXROb25Xb3JkQ2hhcmFjdGVycygpKVxuICAgIHNvdXJjZSA9IFwiXltcXHQgXSokfFteXFxcXHMje25vbldvcmRDaGFyYWN0ZXJzfV0rXCJcbiAgICBpZiBvcHRpb25zPy5pbmNsdWRlTm9uV29yZENoYXJhY3RlcnMgPyB0cnVlXG4gICAgICBzb3VyY2UgKz0gXCJ8XCIgKyBcIlsje25vbldvcmRDaGFyYWN0ZXJzfV0rXCJcbiAgICBuZXcgUmVnRXhwKHNvdXJjZSwgXCJnXCIpXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgUmVnRXhwIHVzZWQgYnkgdGhlIGN1cnNvciB0byBkZXRlcm1pbmUgd2hhdCBhIFwic3Vid29yZFwiIGlzLlxuICAjXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGJhY2t3YXJkc2AgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGxvb2sgZm9yd2FyZHMgb3IgYmFja3dhcmRzXG4gICMgICAgIGZvciB0aGUgbmV4dCBzdWJ3b3JkLiAoZGVmYXVsdDogZmFsc2UpXG4gICNcbiAgIyBSZXR1cm5zIGEge1JlZ0V4cH0uXG4gIHN1YndvcmRSZWdFeHA6IChvcHRpb25zPXt9KSAtPlxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gQGdldE5vbldvcmRDaGFyYWN0ZXJzKClcbiAgICBsb3dlcmNhc2VMZXR0ZXJzID0gJ2EtelxcXFx1MDBERi1cXFxcdTAwRjZcXFxcdTAwRjgtXFxcXHUwMEZGJ1xuICAgIHVwcGVyY2FzZUxldHRlcnMgPSAnQS1aXFxcXHUwMEMwLVxcXFx1MDBENlxcXFx1MDBEOC1cXFxcdTAwREUnXG4gICAgc25ha2VDYW1lbFNlZ21lbnQgPSBcIlsje3VwcGVyY2FzZUxldHRlcnN9XT9bI3tsb3dlcmNhc2VMZXR0ZXJzfV0rXCJcbiAgICBzZWdtZW50cyA9IFtcbiAgICAgIFwiXltcXHQgXStcIixcbiAgICAgIFwiW1xcdCBdKyRcIixcbiAgICAgIFwiWyN7dXBwZXJjYXNlTGV0dGVyc31dKyg/IVsje2xvd2VyY2FzZUxldHRlcnN9XSlcIixcbiAgICAgIFwiXFxcXGQrXCJcbiAgICBdXG4gICAgaWYgb3B0aW9ucy5iYWNrd2FyZHNcbiAgICAgIHNlZ21lbnRzLnB1c2goXCIje3NuYWtlQ2FtZWxTZWdtZW50fV8qXCIpXG4gICAgICBzZWdtZW50cy5wdXNoKFwiWyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXFxcXHMqXCIpXG4gICAgZWxzZVxuICAgICAgc2VnbWVudHMucHVzaChcIl8qI3tzbmFrZUNhbWVsU2VnbWVudH1cIilcbiAgICAgIHNlZ21lbnRzLnB1c2goXCJcXFxccypbI3tfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XStcIilcbiAgICBzZWdtZW50cy5wdXNoKFwiXytcIilcbiAgICBuZXcgUmVnRXhwKHNlZ21lbnRzLmpvaW4oXCJ8XCIpLCBcImdcIilcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZVxuICAjIyNcblxuICBnZXROb25Xb3JkQ2hhcmFjdGVyczogLT5cbiAgICBAZWRpdG9yLmdldE5vbldvcmRDaGFyYWN0ZXJzKEBnZXRTY29wZURlc2NyaXB0b3IoKS5nZXRTY29wZXNBcnJheSgpKVxuXG4gIGNoYW5nZVBvc2l0aW9uOiAob3B0aW9ucywgZm4pIC0+XG4gICAgQGNsZWFyU2VsZWN0aW9uKGF1dG9zY3JvbGw6IGZhbHNlKVxuICAgIGZuKClcbiAgICBAYXV0b3Njcm9sbCgpIGlmIG9wdGlvbnMuYXV0b3Njcm9sbCA/IEBpc0xhc3RDdXJzb3IoKVxuXG4gIGdldFBpeGVsUmVjdDogLT5cbiAgICBAZWRpdG9yLnBpeGVsUmVjdEZvclNjcmVlblJhbmdlKEBnZXRTY3JlZW5SYW5nZSgpKVxuXG4gIGdldFNjcmVlblJhbmdlOiAtPlxuICAgIHtyb3csIGNvbHVtbn0gPSBAZ2V0U2NyZWVuUG9zaXRpb24oKVxuICAgIG5ldyBSYW5nZShuZXcgUG9pbnQocm93LCBjb2x1bW4pLCBuZXcgUG9pbnQocm93LCBjb2x1bW4gKyAxKSlcblxuICBhdXRvc2Nyb2xsOiAob3B0aW9ucykgLT5cbiAgICBAZWRpdG9yLnNjcm9sbFRvU2NyZWVuUmFuZ2UoQGdldFNjcmVlblJhbmdlKCksIG9wdGlvbnMpXG5cbiAgZ2V0QmVnaW5uaW5nT2ZOZXh0UGFyYWdyYXBoQnVmZmVyUG9zaXRpb246IC0+XG4gICAgc3RhcnQgPSBAZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGVvZiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIHNjYW5SYW5nZSA9IFtzdGFydCwgZW9mXVxuXG4gICAge3JvdywgY29sdW1ufSA9IGVvZlxuICAgIHBvc2l0aW9uID0gbmV3IFBvaW50KHJvdywgY29sdW1uIC0gMSlcblxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgRW1wdHlMaW5lUmVnRXhwLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgcG9zaXRpb24gPSByYW5nZS5zdGFydC50cmF2ZXJzZShQb2ludCgxLCAwKSlcbiAgICAgIHN0b3AoKSB1bmxlc3MgcG9zaXRpb24uaXNFcXVhbChzdGFydClcbiAgICBwb3NpdGlvblxuXG4gIGdldEJlZ2lubmluZ09mUHJldmlvdXNQYXJhZ3JhcGhCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBzdGFydCA9IEBnZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICB7cm93LCBjb2x1bW59ID0gc3RhcnRcbiAgICBzY2FuUmFuZ2UgPSBbW3Jvdy0xLCBjb2x1bW5dLCBbMCwgMF1dXG4gICAgcG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMClcbiAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIEVtcHR5TGluZVJlZ0V4cCwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIHBvc2l0aW9uID0gcmFuZ2Uuc3RhcnQudHJhdmVyc2UoUG9pbnQoMSwgMCkpXG4gICAgICBzdG9wKCkgdW5sZXNzIHBvc2l0aW9uLmlzRXF1YWwoc3RhcnQpXG4gICAgcG9zaXRpb25cbiJdfQ==
