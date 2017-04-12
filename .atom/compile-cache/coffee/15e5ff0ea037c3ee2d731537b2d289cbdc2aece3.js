(function() {
  var Base, CurrentSelection, Find, FindBackwards, Motion, MoveDown, MoveDownScreen, MoveDownToEdge, MoveLeft, MoveRight, MoveRightBufferColumn, MoveToBeginningOfLine, MoveToBottomOfScreen, MoveToColumn, MoveToEndOfAlphanumericWord, MoveToEndOfSmartWord, MoveToEndOfWholeWord, MoveToEndOfWord, MoveToFirstCharacterOfLine, MoveToFirstCharacterOfLineAndDown, MoveToFirstCharacterOfLineDown, MoveToFirstCharacterOfLineUp, MoveToFirstLine, MoveToLastCharacterOfLine, MoveToLastLine, MoveToLastNonblankCharacterOfLineAndDown, MoveToLineByPercent, MoveToMark, MoveToMarkLine, MoveToMiddleOfScreen, MoveToNextAlphanumericWord, MoveToNextFoldEnd, MoveToNextFoldStart, MoveToNextFoldStartWithSameIndent, MoveToNextFunction, MoveToNextNumber, MoveToNextParagraph, MoveToNextSentence, MoveToNextSentenceSkipBlankRow, MoveToNextSmartWord, MoveToNextString, MoveToNextWholeWord, MoveToNextWord, MoveToPair, MoveToPositionByScope, MoveToPreviousAlphanumericWord, MoveToPreviousEndOfWholeWord, MoveToPreviousEndOfWord, MoveToPreviousFoldEnd, MoveToPreviousFoldStart, MoveToPreviousFoldStartWithSameIndent, MoveToPreviousFunction, MoveToPreviousNumber, MoveToPreviousParagraph, MoveToPreviousSentence, MoveToPreviousSentenceSkipBlankRow, MoveToPreviousSmartWord, MoveToPreviousString, MoveToPreviousWholeWord, MoveToPreviousWord, MoveToRelativeLine, MoveToRelativeLineWithMinimum, MoveToTopOfScreen, MoveUp, MoveUpScreen, MoveUpToEdge, Point, Range, ScrollFullScreenDown, ScrollFullScreenUp, ScrollHalfScreenDown, ScrollHalfScreenUp, Select, Till, TillBackwards, _, cursorIsAtEmptyRow, cursorIsAtEndOfLineAtNonEmptyRow, cursorIsAtVimEndOfFile, cursorIsOnWhiteSpace, debug, detectScopeStartPositionForScope, getBufferRows, getCodeFoldRowRanges, getFirstCharacterBufferPositionForScreenRow, getFirstCharacterColumForBufferRow, getFirstCharacterPositionForBufferRow, getFirstVisibleScreenRow, getIndentLevelForBufferRow, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getStartPositionForPattern, getValidVimBufferRow, getValidVimScreenRow, getVisibleBufferRange, highlightRanges, isIncludeFunctionScopeForRow, moveCursorDownBuffer, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpBuffer, moveCursorUpScreen, ref, ref1, saveEditorState, screenPositionIsAtWhiteSpace, settings, sortRanges, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Select = null;

  ref1 = require('./utils'), saveEditorState = ref1.saveEditorState, getVisibleBufferRange = ref1.getVisibleBufferRange, moveCursorLeft = ref1.moveCursorLeft, moveCursorRight = ref1.moveCursorRight, moveCursorUpScreen = ref1.moveCursorUpScreen, moveCursorDownScreen = ref1.moveCursorDownScreen, moveCursorDownBuffer = ref1.moveCursorDownBuffer, moveCursorUpBuffer = ref1.moveCursorUpBuffer, cursorIsAtVimEndOfFile = ref1.cursorIsAtVimEndOfFile, getFirstVisibleScreenRow = ref1.getFirstVisibleScreenRow, getLastVisibleScreenRow = ref1.getLastVisibleScreenRow, getValidVimScreenRow = ref1.getValidVimScreenRow, getValidVimBufferRow = ref1.getValidVimBufferRow, highlightRanges = ref1.highlightRanges, moveCursorToFirstCharacterAtRow = ref1.moveCursorToFirstCharacterAtRow, sortRanges = ref1.sortRanges, getIndentLevelForBufferRow = ref1.getIndentLevelForBufferRow, cursorIsOnWhiteSpace = ref1.cursorIsOnWhiteSpace, moveCursorToNextNonWhitespace = ref1.moveCursorToNextNonWhitespace, cursorIsAtEmptyRow = ref1.cursorIsAtEmptyRow, getCodeFoldRowRanges = ref1.getCodeFoldRowRanges, getLargestFoldRangeContainsBufferRow = ref1.getLargestFoldRangeContainsBufferRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, detectScopeStartPositionForScope = ref1.detectScopeStartPositionForScope, getBufferRows = ref1.getBufferRows, getStartPositionForPattern = ref1.getStartPositionForPattern, getFirstCharacterPositionForBufferRow = ref1.getFirstCharacterPositionForBufferRow, getFirstCharacterBufferPositionForScreenRow = ref1.getFirstCharacterBufferPositionForScreenRow, screenPositionIsAtWhiteSpace = ref1.screenPositionIsAtWhiteSpace, cursorIsAtEndOfLineAtNonEmptyRow = ref1.cursorIsAtEndOfLineAtNonEmptyRow, getFirstCharacterColumForBufferRow = ref1.getFirstCharacterColumForBufferRow, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Motion = (function(superClass) {
    extend(Motion, superClass);

    Motion.extend(false);

    Motion.prototype.inclusive = false;

    Motion.prototype.wise = 'characterwise';

    Motion.prototype.jump = false;

    function Motion() {
      Motion.__super__.constructor.apply(this, arguments);
      if (this.isMode('visual')) {
        this.inclusive = true;
        this.wise = this.vimState.submode;
      }
      this.initialize();
    }

    Motion.prototype.isInclusive = function() {
      return this.inclusive;
    };

    Motion.prototype.isJump = function() {
      return this.jump;
    };

    Motion.prototype.isCharacterwise = function() {
      return this.wise === 'characterwise';
    };

    Motion.prototype.isLinewise = function() {
      return this.wise === 'linewise';
    };

    Motion.prototype.isBlockwise = function() {
      return this.wise === 'blockwise';
    };

    Motion.prototype.forceWise = function(wise) {
      if (wise === 'characterwise') {
        if (this.wise === 'linewise') {
          this.inclusive = false;
        } else {
          this.inclusive = !this.inclusive;
        }
      }
      return this.wise = wise;
    };

    Motion.prototype.setBufferPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setBufferPosition(point);
      }
    };

    Motion.prototype.setScreenPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setScreenPosition(point);
      }
    };

    Motion.prototype.moveWithSaveJump = function(cursor) {
      var cursorPosition;
      if (cursor.isLastCursor() && this.isJump()) {
        cursorPosition = cursor.getBufferPosition();
      }
      this.moveCursor(cursor);
      if ((cursorPosition != null) && !cursorPosition.isEqual(cursor.getBufferPosition())) {
        this.vimState.mark.set('`', cursorPosition);
        return this.vimState.mark.set("'", cursorPosition);
      }
    };

    Motion.prototype.execute = function() {
      return this.editor.moveCursors((function(_this) {
        return function(cursor) {
          return _this.moveWithSaveJump(cursor);
        };
      })(this));
    };

    Motion.prototype.select = function() {
      var i, len, ref2, selection;
      if (this.isMode('visual')) {
        this.vimState.modeManager.normalizeSelections();
      }
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        this.selectByMotion(selection);
      }
      this.editor.mergeCursors();
      this.editor.mergeIntersectingSelections();
      if (this.isMode('visual')) {
        this.updateSelectionProperties();
      }
      switch (this.wise) {
        case 'linewise':
          return this.vimState.selectLinewise();
        case 'blockwise':
          return this.vimState.selectBlockwise();
      }
    };

    Motion.prototype.selectByMotion = function(selection) {
      var cursor;
      cursor = selection.cursor;
      selection.modifySelection((function(_this) {
        return function() {
          return _this.moveWithSaveJump(cursor);
        };
      })(this));
      if (!this.isMode('visual') && selection.isEmpty()) {
        return;
      }
      if (!(this.isInclusive() || this.isLinewise())) {
        return;
      }
      if (this.isMode('visual') && cursorIsAtEndOfLineAtNonEmptyRow(cursor)) {
        swrap(selection).translateSelectionHeadAndClip('backward');
      }
      return swrap(selection).translateSelectionEndAndClip('forward');
    };

    return Motion;

  })(Base);

  CurrentSelection = (function(superClass) {
    extend(CurrentSelection, superClass);

    function CurrentSelection() {
      return CurrentSelection.__super__.constructor.apply(this, arguments);
    }

    CurrentSelection.extend(false);

    CurrentSelection.prototype.selectionExtent = null;

    CurrentSelection.prototype.inclusive = true;

    CurrentSelection.prototype.initialize = function() {
      CurrentSelection.__super__.initialize.apply(this, arguments);
      return this.pointInfoByCursor = new Map;
    };

    CurrentSelection.prototype.execute = function() {
      throw new Error((this.getName()) + " should not be executed");
    };

    CurrentSelection.prototype.moveCursor = function(cursor) {
      var end, head, point, ref2, ref3, start, tail;
      if (this.isMode('visual')) {
        if (this.isBlockwise()) {
          ref2 = cursor.selection.getBufferRange(), start = ref2.start, end = ref2.end;
          ref3 = cursor.selection.isReversed() ? [start, end] : [end, start], head = ref3[0], tail = ref3[1];
          return this.selectionExtent = new Point(head.row - tail.row, head.column - tail.column);
        } else {
          return this.selectionExtent = this.editor.getSelectedBufferRange().getExtent();
        }
      } else {
        point = cursor.getBufferPosition();
        if (this.isBlockwise()) {
          return cursor.setBufferPosition(point.translate(this.selectionExtent));
        } else {
          return cursor.setBufferPosition(point.traverse(this.selectionExtent));
        }
      }
    };

    CurrentSelection.prototype.select = function() {
      var atEOL, cursor, cursorPosition, i, j, len, len1, pointInfo, ref2, ref3, results, startOfSelection;
      if (this.isMode('visual')) {
        CurrentSelection.__super__.select.apply(this, arguments);
      } else {
        ref2 = this.editor.getCursors();
        for (i = 0, len = ref2.length; i < len; i++) {
          cursor = ref2[i];
          if (!(pointInfo = this.pointInfoByCursor.get(cursor))) {
            continue;
          }
          cursorPosition = pointInfo.cursorPosition, startOfSelection = pointInfo.startOfSelection, atEOL = pointInfo.atEOL;
          if (atEOL || cursorPosition.isEqual(cursor.getBufferPosition())) {
            cursor.setBufferPosition(startOfSelection);
          }
        }
        CurrentSelection.__super__.select.apply(this, arguments);
      }
      ref3 = this.editor.getCursors();
      results = [];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        cursor = ref3[j];
        startOfSelection = cursor.selection.getBufferRange().start;
        results.push(this.onDidFinishOperation((function(_this) {
          return function() {
            cursorPosition = cursor.getBufferPosition();
            atEOL = cursor.isAtEndOfLine();
            return _this.pointInfoByCursor.set(cursor, {
              startOfSelection: startOfSelection,
              cursorPosition: cursorPosition,
              atEOL: atEOL
            });
          };
        })(this)));
      }
      return results;
    };

    return CurrentSelection;

  })(Motion);

  MoveLeft = (function(superClass) {
    extend(MoveLeft, superClass);

    function MoveLeft() {
      return MoveLeft.__super__.constructor.apply(this, arguments);
    }

    MoveLeft.extend();

    MoveLeft.prototype.moveCursor = function(cursor) {
      var allowWrap;
      allowWrap = settings.get('wrapLeftRightMotion');
      return this.countTimes(function() {
        return moveCursorLeft(cursor, {
          allowWrap: allowWrap
        });
      });
    };

    return MoveLeft;

  })(Motion);

  MoveRight = (function(superClass) {
    extend(MoveRight, superClass);

    function MoveRight() {
      return MoveRight.__super__.constructor.apply(this, arguments);
    }

    MoveRight.extend();

    MoveRight.prototype.canWrapToNextLine = function(cursor) {
      if (this.isAsOperatorTarget() && !cursor.isAtEndOfLine()) {
        return false;
      } else {
        return settings.get('wrapLeftRightMotion');
      }
    };

    MoveRight.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var allowWrap;
          _this.editor.unfoldBufferRow(cursor.getBufferRow());
          allowWrap = _this.canWrapToNextLine(cursor);
          moveCursorRight(cursor);
          if (cursor.isAtEndOfLine() && allowWrap && !cursorIsAtVimEndOfFile(cursor)) {
            return moveCursorRight(cursor, {
              allowWrap: allowWrap
            });
          }
        };
      })(this));
    };

    return MoveRight;

  })(Motion);

  MoveRightBufferColumn = (function(superClass) {
    extend(MoveRightBufferColumn, superClass);

    function MoveRightBufferColumn() {
      return MoveRightBufferColumn.__super__.constructor.apply(this, arguments);
    }

    MoveRightBufferColumn.extend(true);

    MoveRightBufferColumn.prototype.moveCursor = function(cursor) {
      var newPoint;
      newPoint = cursor.getBufferPosition().translate([0, this.getCount()]);
      return cursor.setBufferPosition(newPoint);
    };

    return MoveRightBufferColumn;

  })(Motion);

  MoveUp = (function(superClass) {
    extend(MoveUp, superClass);

    function MoveUp() {
      return MoveUp.__super__.constructor.apply(this, arguments);
    }

    MoveUp.extend();

    MoveUp.prototype.wise = 'linewise';

    MoveUp.prototype.getPoint = function(cursor) {
      var row;
      row = this.getRow(cursor.getBufferRow());
      return new Point(row, cursor.goalColumn);
    };

    MoveUp.prototype.getRow = function(row) {
      row = Math.max(row - 1, 0);
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).start.row;
      }
      return row;
    };

    MoveUp.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var goalColumn;
          if (cursor.goalColumn == null) {
            cursor.goalColumn = cursor.getBufferColumn();
          }
          goalColumn = cursor.goalColumn;
          cursor.setBufferPosition(_this.getPoint(cursor));
          return cursor.goalColumn = goalColumn;
        };
      })(this));
    };

    return MoveUp;

  })(Motion);

  MoveDown = (function(superClass) {
    extend(MoveDown, superClass);

    function MoveDown() {
      return MoveDown.__super__.constructor.apply(this, arguments);
    }

    MoveDown.extend();

    MoveDown.prototype.wise = 'linewise';

    MoveDown.prototype.getRow = function(row) {
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).end.row;
      }
      return Math.min(row + 1, this.getVimLastBufferRow());
    };

    return MoveDown;

  })(MoveUp);

  MoveUpScreen = (function(superClass) {
    extend(MoveUpScreen, superClass);

    function MoveUpScreen() {
      return MoveUpScreen.__super__.constructor.apply(this, arguments);
    }

    MoveUpScreen.extend();

    MoveUpScreen.prototype.wise = 'linewise';

    MoveUpScreen.prototype.direction = 'up';

    MoveUpScreen.prototype.moveCursor = function(cursor) {
      return this.countTimes(function() {
        return moveCursorUpScreen(cursor);
      });
    };

    return MoveUpScreen;

  })(Motion);

  MoveDownScreen = (function(superClass) {
    extend(MoveDownScreen, superClass);

    function MoveDownScreen() {
      return MoveDownScreen.__super__.constructor.apply(this, arguments);
    }

    MoveDownScreen.extend();

    MoveDownScreen.prototype.wise = 'linewise';

    MoveDownScreen.prototype.direction = 'down';

    MoveDownScreen.prototype.moveCursor = function(cursor) {
      return this.countTimes(function() {
        return moveCursorDownScreen(cursor);
      });
    };

    return MoveDownScreen;

  })(MoveUpScreen);

  MoveUpToEdge = (function(superClass) {
    extend(MoveUpToEdge, superClass);

    function MoveUpToEdge() {
      return MoveUpToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveUpToEdge.extend();

    MoveUpToEdge.prototype.wise = 'linewise';

    MoveUpToEdge.prototype.jump = true;

    MoveUpToEdge.prototype.direction = 'up';

    MoveUpToEdge.description = "Move cursor up to **edge** char at same-column";

    MoveUpToEdge.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getScreenPosition();
      this.countTimes((function(_this) {
        return function(arg) {
          var newPoint, stop;
          stop = arg.stop;
          if ((newPoint = _this.getPoint(point))) {
            return point = newPoint;
          } else {
            return stop();
          }
        };
      })(this));
      return this.setScreenPositionSafely(cursor, point);
    };

    MoveUpToEdge.prototype.getPoint = function(fromPoint) {
      var column, i, len, point, ref2, row;
      column = fromPoint.column;
      ref2 = this.getScanRows(fromPoint);
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (point = new Point(row, column)) {
          if (this.isEdge(point)) {
            return point;
          }
        }
      }
    };

    MoveUpToEdge.prototype.getScanRows = function(arg) {
      var i, j, ref2, ref3, ref4, results, results1, row, validRow;
      row = arg.row;
      validRow = getValidVimScreenRow.bind(null, this.editor);
      switch (this.direction) {
        case 'up':
          return (function() {
            results = [];
            for (var i = ref2 = validRow(row - 1); ref2 <= 0 ? i <= 0 : i >= 0; ref2 <= 0 ? i++ : i--){ results.push(i); }
            return results;
          }).apply(this);
        case 'down':
          return (function() {
            results1 = [];
            for (var j = ref3 = validRow(row + 1), ref4 = this.getVimLastScreenRow(); ref3 <= ref4 ? j <= ref4 : j >= ref4; ref3 <= ref4 ? j++ : j--){ results1.push(j); }
            return results1;
          }).apply(this);
      }
    };

    MoveUpToEdge.prototype.isEdge = function(point) {
      var above, below;
      if (this.isStoppablePoint(point)) {
        above = point.translate([-1, 0]);
        below = point.translate([+1, 0]);
        return (!this.isStoppablePoint(above)) || (!this.isStoppablePoint(below));
      } else {
        return false;
      }
    };

    MoveUpToEdge.prototype.isStoppablePoint = function(point) {
      var leftPoint, rightPoint;
      if (this.isNonWhiteSpacePoint(point)) {
        return true;
      } else {
        leftPoint = point.translate([0, -1]);
        rightPoint = point.translate([0, +1]);
        return this.isNonWhiteSpacePoint(leftPoint) && this.isNonWhiteSpacePoint(rightPoint);
      }
    };

    MoveUpToEdge.prototype.isNonWhiteSpacePoint = function(point) {
      return screenPositionIsAtWhiteSpace(this.editor, point);
    };

    return MoveUpToEdge;

  })(Motion);

  MoveDownToEdge = (function(superClass) {
    extend(MoveDownToEdge, superClass);

    function MoveDownToEdge() {
      return MoveDownToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveDownToEdge.extend();

    MoveDownToEdge.description = "Move cursor down to **edge** char at same-column";

    MoveDownToEdge.prototype.direction = 'down';

    return MoveDownToEdge;

  })(MoveUpToEdge);

  MoveToNextWord = (function(superClass) {
    extend(MoveToNextWord, superClass);

    function MoveToNextWord() {
      return MoveToNextWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWord.extend();

    MoveToNextWord.prototype.wordRegex = null;

    MoveToNextWord.prototype.getPoint = function(cursor) {
      var cursorPoint, found, pattern, ref2, ref3, scanRange, wordRange;
      cursorPoint = cursor.getBufferPosition();
      pattern = (ref2 = this.wordRegex) != null ? ref2 : cursor.wordRegExp();
      scanRange = [cursorPoint, this.getVimEofBufferPosition()];
      wordRange = null;
      found = false;
      this.editor.scanInBufferRange(pattern, scanRange, function(arg) {
        var matchText, range, stop;
        range = arg.range, matchText = arg.matchText, stop = arg.stop;
        wordRange = range;
        if (matchText === '' && range.start.column !== 0) {
          return;
        }
        if (range.start.isGreaterThan(cursorPoint)) {
          found = true;
          return stop();
        }
      });
      if (found) {
        return wordRange.start;
      } else {
        return (ref3 = wordRange != null ? wordRange.end : void 0) != null ? ref3 : cursorPoint;
      }
    };

    MoveToNextWord.prototype.moveCursor = function(cursor) {
      var wasOnWhiteSpace;
      if (cursorIsAtVimEndOfFile(cursor)) {
        return;
      }
      wasOnWhiteSpace = cursorIsOnWhiteSpace(cursor);
      return this.countTimes((function(_this) {
        return function(arg) {
          var cursorRow, isFinal, point;
          isFinal = arg.isFinal;
          cursorRow = cursor.getBufferRow();
          if (cursorIsAtEmptyRow(cursor) && _this.isAsOperatorTarget()) {
            point = [cursorRow + 1, 0];
          } else {
            point = _this.getPoint(cursor);
            if (isFinal && _this.isAsOperatorTarget()) {
              if (_this.getOperator().getName() === 'Change' && (!wasOnWhiteSpace)) {
                point = cursor.getEndOfCurrentWordBufferPosition({
                  wordRegex: _this.wordRegex
                });
              } else if (point.row > cursorRow) {
                point = [cursorRow, 2e308];
              }
            }
          }
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToNextWord;

  })(Motion);

  MoveToPreviousWord = (function(superClass) {
    extend(MoveToPreviousWord, superClass);

    function MoveToPreviousWord() {
      return MoveToPreviousWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWord.extend();

    MoveToPreviousWord.prototype.wordRegex = null;

    MoveToPreviousWord.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var point;
          point = cursor.getBeginningOfCurrentWordBufferPosition({
            wordRegex: _this.wordRegex
          });
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToPreviousWord;

  })(Motion);

  MoveToEndOfWord = (function(superClass) {
    extend(MoveToEndOfWord, superClass);

    function MoveToEndOfWord() {
      return MoveToEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWord.extend();

    MoveToEndOfWord.prototype.wordRegex = null;

    MoveToEndOfWord.prototype.inclusive = true;

    MoveToEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      moveCursorToNextNonWhitespace(cursor);
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToEndOfWord.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var originalPoint;
          originalPoint = cursor.getBufferPosition();
          _this.moveToNextEndOfWord(cursor);
          if (originalPoint.isEqual(cursor.getBufferPosition())) {
            cursor.moveRight();
            return _this.moveToNextEndOfWord(cursor);
          }
        };
      })(this));
    };

    return MoveToEndOfWord;

  })(Motion);

  MoveToPreviousEndOfWord = (function(superClass) {
    extend(MoveToPreviousEndOfWord, superClass);

    function MoveToPreviousEndOfWord() {
      return MoveToPreviousEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWord.extend();

    MoveToPreviousEndOfWord.prototype.inclusive = true;

    MoveToPreviousEndOfWord.prototype.moveCursor = function(cursor) {
      var cursorPosition, i, point, ref2, times, wordRange;
      times = this.getCount();
      wordRange = cursor.getCurrentWordBufferRange();
      cursorPosition = cursor.getBufferPosition();
      if (cursorPosition.isGreaterThan(wordRange.start) && cursorPosition.isLessThan(wordRange.end)) {
        times += 1;
      }
      for (i = 1, ref2 = times; 1 <= ref2 ? i <= ref2 : i >= ref2; 1 <= ref2 ? i++ : i--) {
        point = cursor.getBeginningOfCurrentWordBufferPosition({
          wordRegex: this.wordRegex
        });
        cursor.setBufferPosition(point);
      }
      this.moveToNextEndOfWord(cursor);
      if (cursor.getBufferPosition().isGreaterThanOrEqual(cursorPosition)) {
        return cursor.setBufferPosition([0, 0]);
      }
    };

    MoveToPreviousEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    return MoveToPreviousEndOfWord;

  })(MoveToPreviousWord);

  MoveToNextWholeWord = (function(superClass) {
    extend(MoveToNextWholeWord, superClass);

    function MoveToNextWholeWord() {
      return MoveToNextWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWholeWord.extend();

    MoveToNextWholeWord.prototype.wordRegex = /^\s*$|\S+/g;

    return MoveToNextWholeWord;

  })(MoveToNextWord);

  MoveToPreviousWholeWord = (function(superClass) {
    extend(MoveToPreviousWholeWord, superClass);

    function MoveToPreviousWholeWord() {
      return MoveToPreviousWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWholeWord.extend();

    MoveToPreviousWholeWord.prototype.wordRegex = /^\s*$|\S+/;

    return MoveToPreviousWholeWord;

  })(MoveToPreviousWord);

  MoveToEndOfWholeWord = (function(superClass) {
    extend(MoveToEndOfWholeWord, superClass);

    function MoveToEndOfWholeWord() {
      return MoveToEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWholeWord.extend();

    MoveToEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToEndOfWholeWord;

  })(MoveToEndOfWord);

  MoveToPreviousEndOfWholeWord = (function(superClass) {
    extend(MoveToPreviousEndOfWholeWord, superClass);

    function MoveToPreviousEndOfWholeWord() {
      return MoveToPreviousEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWholeWord.extend();

    MoveToPreviousEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToPreviousEndOfWholeWord;

  })(MoveToPreviousEndOfWord);

  MoveToNextAlphanumericWord = (function(superClass) {
    extend(MoveToNextAlphanumericWord, superClass);

    function MoveToNextAlphanumericWord() {
      return MoveToNextAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextAlphanumericWord.extend();

    MoveToNextAlphanumericWord.description = "Move to next alphanumeric(`/\w+/`) word";

    MoveToNextAlphanumericWord.prototype.wordRegex = /\w+/g;

    return MoveToNextAlphanumericWord;

  })(MoveToNextWord);

  MoveToPreviousAlphanumericWord = (function(superClass) {
    extend(MoveToPreviousAlphanumericWord, superClass);

    function MoveToPreviousAlphanumericWord() {
      return MoveToPreviousAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousAlphanumericWord.extend();

    MoveToPreviousAlphanumericWord.description = "Move to previous alphanumeric(`/\w+/`) word";

    MoveToPreviousAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToPreviousAlphanumericWord;

  })(MoveToPreviousWord);

  MoveToEndOfAlphanumericWord = (function(superClass) {
    extend(MoveToEndOfAlphanumericWord, superClass);

    function MoveToEndOfAlphanumericWord() {
      return MoveToEndOfAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfAlphanumericWord.extend();

    MoveToEndOfAlphanumericWord.description = "Move to end of alphanumeric(`/\w+/`) word";

    MoveToEndOfAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToEndOfAlphanumericWord;

  })(MoveToEndOfWord);

  MoveToNextSmartWord = (function(superClass) {
    extend(MoveToNextSmartWord, superClass);

    function MoveToNextSmartWord() {
      return MoveToNextSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSmartWord.extend();

    MoveToNextSmartWord.description = "Move to next smart word (`/[\w-]+/`) word";

    MoveToNextSmartWord.prototype.wordRegex = /[\w-]+/g;

    return MoveToNextSmartWord;

  })(MoveToNextWord);

  MoveToPreviousSmartWord = (function(superClass) {
    extend(MoveToPreviousSmartWord, superClass);

    function MoveToPreviousSmartWord() {
      return MoveToPreviousSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSmartWord.extend();

    MoveToPreviousSmartWord.description = "Move to previous smart word (`/[\w-]+/`) word";

    MoveToPreviousSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToPreviousSmartWord;

  })(MoveToPreviousWord);

  MoveToEndOfSmartWord = (function(superClass) {
    extend(MoveToEndOfSmartWord, superClass);

    function MoveToEndOfSmartWord() {
      return MoveToEndOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfSmartWord.extend();

    MoveToEndOfSmartWord.description = "Move to end of smart word (`/[\w-]+/`) word";

    MoveToEndOfSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToEndOfSmartWord;

  })(MoveToEndOfWord);

  MoveToNextSentence = (function(superClass) {
    extend(MoveToNextSentence, superClass);

    function MoveToNextSentence() {
      return MoveToNextSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentence.extend();

    MoveToNextSentence.prototype.jump = true;

    MoveToNextSentence.prototype.sentenceRegex = /(?:[\.!\?][\)\]"']*\s+)|(\n|\r\n)/g;

    MoveToNextSentence.prototype.direction = 'next';

    MoveToNextSentence.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function() {
          return point = _this.getPoint(point);
        };
      })(this));
      return cursor.setBufferPosition(point);
    };

    MoveToNextSentence.prototype.getPoint = function(fromPoint) {
      if (this.direction === 'next') {
        return this.getNextStartOfSentence(fromPoint);
      } else if (this.direction === 'previous') {
        return this.getPreviousStartOfSentence(fromPoint);
      }
    };

    MoveToNextSentence.prototype.getFirstCharacterPositionForRow = function(row) {
      return new Point(row, getFirstCharacterColumForBufferRow(this.editor, row));
    };

    MoveToNextSentence.prototype.isBlankRow = function(row) {
      return this.editor.isBufferRowBlank(row);
    };

    MoveToNextSentence.prototype.getNextStartOfSentence = function(fromPoint) {
      var foundPoint, scanRange;
      scanRange = new Range(fromPoint, this.getVimEofBufferPosition());
      foundPoint = null;
      this.editor.scanInBufferRange(this.sentenceRegex, scanRange, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, range, ref2, ref3, startRow, stop;
          range = arg.range, matchText = arg.matchText, match = arg.match, stop = arg.stop;
          if (match[1] != null) {
            (ref2 = range.start, startRow = ref2.row), (ref3 = range.end, endRow = ref3.row);
            if (_this.skipBlankRow && _this.isBlankRow(endRow)) {
              return;
            }
            if (_this.isBlankRow(startRow) !== _this.isBlankRow(endRow)) {
              foundPoint = _this.getFirstCharacterPositionForRow(endRow);
            }
          } else {
            foundPoint = range.end;
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : scanRange.end;
    };

    MoveToNextSentence.prototype.getPreviousStartOfSentence = function(fromPoint) {
      var foundPoint, scanRange;
      scanRange = new Range(fromPoint, [0, 0]);
      foundPoint = null;
      this.editor.backwardsScanInBufferRange(this.sentenceRegex, scanRange, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, point, range, ref2, ref3, startRow, stop;
          range = arg.range, match = arg.match, stop = arg.stop, matchText = arg.matchText;
          if (match[1] != null) {
            (ref2 = range.start, startRow = ref2.row), (ref3 = range.end, endRow = ref3.row);
            if (!_this.isBlankRow(endRow) && _this.isBlankRow(startRow)) {
              point = _this.getFirstCharacterPositionForRow(endRow);
              if (point.isLessThan(fromPoint)) {
                foundPoint = point;
              } else {
                if (_this.skipBlankRow) {
                  return;
                }
                foundPoint = _this.getFirstCharacterPositionForRow(startRow);
              }
            }
          } else {
            if (range.end.isLessThan(fromPoint)) {
              foundPoint = range.end;
            }
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : scanRange.start;
    };

    return MoveToNextSentence;

  })(Motion);

  MoveToPreviousSentence = (function(superClass) {
    extend(MoveToPreviousSentence, superClass);

    function MoveToPreviousSentence() {
      return MoveToPreviousSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentence.extend();

    MoveToPreviousSentence.prototype.direction = 'previous';

    return MoveToPreviousSentence;

  })(MoveToNextSentence);

  MoveToNextSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToNextSentenceSkipBlankRow, superClass);

    function MoveToNextSentenceSkipBlankRow() {
      return MoveToNextSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentenceSkipBlankRow.extend();

    MoveToNextSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToNextSentenceSkipBlankRow;

  })(MoveToNextSentence);

  MoveToPreviousSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToPreviousSentenceSkipBlankRow, superClass);

    function MoveToPreviousSentenceSkipBlankRow() {
      return MoveToPreviousSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentenceSkipBlankRow.extend();

    MoveToPreviousSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToPreviousSentenceSkipBlankRow;

  })(MoveToPreviousSentence);

  MoveToNextParagraph = (function(superClass) {
    extend(MoveToNextParagraph, superClass);

    function MoveToNextParagraph() {
      return MoveToNextParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToNextParagraph.extend();

    MoveToNextParagraph.prototype.jump = true;

    MoveToNextParagraph.prototype.direction = 'next';

    MoveToNextParagraph.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function() {
          return point = _this.getPoint(point);
        };
      })(this));
      return cursor.setBufferPosition(point);
    };

    MoveToNextParagraph.prototype.getPoint = function(fromPoint) {
      var i, len, ref2, row, startRow, wasAtNonBlankRow;
      startRow = fromPoint.row;
      wasAtNonBlankRow = !this.editor.isBufferRowBlank(startRow);
      ref2 = getBufferRows(this.editor, {
        startRow: startRow,
        direction: this.direction
      });
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (this.editor.isBufferRowBlank(row)) {
          if (wasAtNonBlankRow) {
            return new Point(row, 0);
          }
        } else {
          wasAtNonBlankRow = true;
        }
      }
      switch (this.direction) {
        case 'previous':
          return new Point(0, 0);
        case 'next':
          return this.getVimEofBufferPosition();
      }
    };

    return MoveToNextParagraph;

  })(Motion);

  MoveToPreviousParagraph = (function(superClass) {
    extend(MoveToPreviousParagraph, superClass);

    function MoveToPreviousParagraph() {
      return MoveToPreviousParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousParagraph.extend();

    MoveToPreviousParagraph.prototype.direction = 'previous';

    return MoveToPreviousParagraph;

  })(MoveToNextParagraph);

  MoveToBeginningOfLine = (function(superClass) {
    extend(MoveToBeginningOfLine, superClass);

    function MoveToBeginningOfLine() {
      return MoveToBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToBeginningOfLine.extend();

    MoveToBeginningOfLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return new Point(row, 0);
    };

    MoveToBeginningOfLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    return MoveToBeginningOfLine;

  })(Motion);

  MoveToColumn = (function(superClass) {
    extend(MoveToColumn, superClass);

    function MoveToColumn() {
      return MoveToColumn.__super__.constructor.apply(this, arguments);
    }

    MoveToColumn.extend();

    MoveToColumn.prototype.getCount = function() {
      return MoveToColumn.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToColumn.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return new Point(row, this.getCount());
    };

    MoveToColumn.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getScreenPosition());
      return cursor.setScreenPosition(point);
    };

    return MoveToColumn;

  })(Motion);

  MoveToLastCharacterOfLine = (function(superClass) {
    extend(MoveToLastCharacterOfLine, superClass);

    function MoveToLastCharacterOfLine() {
      return MoveToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastCharacterOfLine.extend();

    MoveToLastCharacterOfLine.prototype.getCount = function() {
      return MoveToLastCharacterOfLine.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToLastCharacterOfLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      row = getValidVimBufferRow(this.editor, row + this.getCount());
      return new Point(row, 2e308);
    };

    MoveToLastCharacterOfLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      cursor.setBufferPosition(point);
      return cursor.goalColumn = 2e308;
    };

    return MoveToLastCharacterOfLine;

  })(Motion);

  MoveToLastNonblankCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToLastNonblankCharacterOfLineAndDown, superClass);

    function MoveToLastNonblankCharacterOfLineAndDown() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToLastNonblankCharacterOfLineAndDown.extend();

    MoveToLastNonblankCharacterOfLineAndDown.prototype.inclusive = true;

    MoveToLastNonblankCharacterOfLineAndDown.prototype.getCount = function() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.getPoint = function(arg) {
      var from, point, row;
      row = arg.row;
      row = Math.min(row + this.getCount(), this.getVimLastBufferRow());
      from = new Point(row, 2e308);
      point = getStartPositionForPattern(this.editor, from, /\s*$/);
      return (point != null ? point : from).translate([0, -1]);
    };

    return MoveToLastNonblankCharacterOfLineAndDown;

  })(Motion);

  MoveToFirstCharacterOfLine = (function(superClass) {
    extend(MoveToFirstCharacterOfLine, superClass);

    function MoveToFirstCharacterOfLine() {
      return MoveToFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLine.extend();

    MoveToFirstCharacterOfLine.prototype.moveCursor = function(cursor) {
      return this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    };

    MoveToFirstCharacterOfLine.prototype.getPoint = function(cursor) {
      return getFirstCharacterPositionForBufferRow(this.editor, cursor.getBufferRow());
    };

    return MoveToFirstCharacterOfLine;

  })(Motion);

  MoveToFirstCharacterOfLineUp = (function(superClass) {
    extend(MoveToFirstCharacterOfLineUp, superClass);

    function MoveToFirstCharacterOfLineUp() {
      return MoveToFirstCharacterOfLineUp.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineUp.extend();

    MoveToFirstCharacterOfLineUp.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineUp.prototype.moveCursor = function(cursor) {
      this.countTimes(function() {
        return moveCursorUpBuffer(cursor);
      });
      return MoveToFirstCharacterOfLineUp.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineUp;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineDown, superClass);

    function MoveToFirstCharacterOfLineDown() {
      return MoveToFirstCharacterOfLineDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineDown.extend();

    MoveToFirstCharacterOfLineDown.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineDown.prototype.moveCursor = function(cursor) {
      this.countTimes(function() {
        return moveCursorDownBuffer(cursor);
      });
      return MoveToFirstCharacterOfLineDown.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineDown;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineAndDown, superClass);

    function MoveToFirstCharacterOfLineAndDown() {
      return MoveToFirstCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineAndDown.extend();

    MoveToFirstCharacterOfLineAndDown.prototype.defaultCount = 0;

    MoveToFirstCharacterOfLineAndDown.prototype.getCount = function() {
      return MoveToFirstCharacterOfLineAndDown.__super__.getCount.apply(this, arguments) - 1;
    };

    return MoveToFirstCharacterOfLineAndDown;

  })(MoveToFirstCharacterOfLineDown);

  MoveToFirstLine = (function(superClass) {
    extend(MoveToFirstLine, superClass);

    function MoveToFirstLine() {
      return MoveToFirstLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstLine.extend();

    MoveToFirstLine.prototype.wise = 'linewise';

    MoveToFirstLine.prototype.jump = true;

    MoveToFirstLine.prototype.moveCursor = function(cursor) {
      cursor.setBufferPosition(this.getPoint());
      return cursor.autoscroll({
        center: true
      });
    };

    MoveToFirstLine.prototype.getPoint = function() {
      var row;
      row = getValidVimBufferRow(this.editor, this.getRow());
      return getFirstCharacterPositionForBufferRow(this.editor, row);
    };

    MoveToFirstLine.prototype.getRow = function() {
      return this.getCount() - 1;
    };

    return MoveToFirstLine;

  })(Motion);

  MoveToLastLine = (function(superClass) {
    extend(MoveToLastLine, superClass);

    function MoveToLastLine() {
      return MoveToLastLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastLine.extend();

    MoveToLastLine.prototype.defaultCount = 2e308;

    return MoveToLastLine;

  })(MoveToFirstLine);

  MoveToLineByPercent = (function(superClass) {
    extend(MoveToLineByPercent, superClass);

    function MoveToLineByPercent() {
      return MoveToLineByPercent.__super__.constructor.apply(this, arguments);
    }

    MoveToLineByPercent.extend();

    MoveToLineByPercent.prototype.getRow = function() {
      var percent;
      percent = Math.min(100, this.getCount());
      return Math.floor(this.getVimLastScreenRow() * (percent / 100));
    };

    return MoveToLineByPercent;

  })(MoveToFirstLine);

  MoveToRelativeLine = (function(superClass) {
    extend(MoveToRelativeLine, superClass);

    function MoveToRelativeLine() {
      return MoveToRelativeLine.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLine.extend(false);

    MoveToRelativeLine.prototype.wise = 'linewise';

    MoveToRelativeLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToRelativeLine.prototype.getCount = function() {
      return MoveToRelativeLine.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToRelativeLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return [row + this.getCount(), 0];
    };

    return MoveToRelativeLine;

  })(Motion);

  MoveToRelativeLineWithMinimum = (function(superClass) {
    extend(MoveToRelativeLineWithMinimum, superClass);

    function MoveToRelativeLineWithMinimum() {
      return MoveToRelativeLineWithMinimum.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLineWithMinimum.extend(false);

    MoveToRelativeLineWithMinimum.prototype.min = 0;

    MoveToRelativeLineWithMinimum.prototype.getCount = function() {
      return Math.max(this.min, MoveToRelativeLineWithMinimum.__super__.getCount.apply(this, arguments));
    };

    return MoveToRelativeLineWithMinimum;

  })(MoveToRelativeLine);

  MoveToTopOfScreen = (function(superClass) {
    extend(MoveToTopOfScreen, superClass);

    function MoveToTopOfScreen() {
      return MoveToTopOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToTopOfScreen.extend();

    MoveToTopOfScreen.prototype.wise = 'linewise';

    MoveToTopOfScreen.prototype.jump = true;

    MoveToTopOfScreen.prototype.scrolloff = 2;

    MoveToTopOfScreen.prototype.defaultCount = 0;

    MoveToTopOfScreen.prototype.getCount = function() {
      return MoveToTopOfScreen.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToTopOfScreen.prototype.moveCursor = function(cursor) {
      return cursor.setBufferPosition(this.getPoint());
    };

    MoveToTopOfScreen.prototype.getPoint = function() {
      return getFirstCharacterBufferPositionForScreenRow(this.editor, this.getRow());
    };

    MoveToTopOfScreen.prototype.getScrolloff = function() {
      if (this.isAsOperatorTarget()) {
        return 0;
      } else {
        return this.scrolloff;
      }
    };

    MoveToTopOfScreen.prototype.getRow = function() {
      var offset, row;
      row = getFirstVisibleScreenRow(this.editor);
      offset = this.getScrolloff();
      if (row === 0) {
        offset = 0;
      }
      offset = Math.max(this.getCount(), offset);
      return row + offset;
    };

    return MoveToTopOfScreen;

  })(Motion);

  MoveToMiddleOfScreen = (function(superClass) {
    extend(MoveToMiddleOfScreen, superClass);

    function MoveToMiddleOfScreen() {
      return MoveToMiddleOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToMiddleOfScreen.extend();

    MoveToMiddleOfScreen.prototype.getRow = function() {
      var endRow, startRow, vimLastScreenRow;
      startRow = getFirstVisibleScreenRow(this.editor);
      vimLastScreenRow = this.getVimLastScreenRow();
      endRow = Math.min(this.editor.getLastVisibleScreenRow(), vimLastScreenRow);
      return startRow + Math.floor((endRow - startRow) / 2);
    };

    return MoveToMiddleOfScreen;

  })(MoveToTopOfScreen);

  MoveToBottomOfScreen = (function(superClass) {
    extend(MoveToBottomOfScreen, superClass);

    function MoveToBottomOfScreen() {
      return MoveToBottomOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToBottomOfScreen.extend();

    MoveToBottomOfScreen.prototype.getRow = function() {
      var offset, row, vimLastScreenRow;
      vimLastScreenRow = this.getVimLastScreenRow();
      row = Math.min(this.editor.getLastVisibleScreenRow(), vimLastScreenRow);
      offset = this.getScrolloff() + 1;
      if (row === vimLastScreenRow) {
        offset = 0;
      }
      offset = Math.max(this.getCount(), offset);
      return row - offset;
    };

    return MoveToBottomOfScreen;

  })(MoveToTopOfScreen);

  ScrollFullScreenDown = (function(superClass) {
    extend(ScrollFullScreenDown, superClass);

    function ScrollFullScreenDown() {
      return ScrollFullScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenDown.extend();

    ScrollFullScreenDown.prototype.amountOfPage = +1;

    ScrollFullScreenDown.prototype.isSmoothScrollEnabled = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return settings.get('smoothScrollOnFullScrollMotion');
      } else {
        return settings.get('smoothScrollOnHalfScrollMotion');
      }
    };

    ScrollFullScreenDown.prototype.getSmoothScrollDuation = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return settings.get('smoothScrollOnFullScrollMotionDuration');
      } else {
        return settings.get('smoothScrollOnHalfScrollMotionDuration');
      }
    };

    ScrollFullScreenDown.prototype.getPixelRectTopForSceenRow = function(row) {
      var point;
      point = new Point(row, 0);
      return this.editor.element.pixelRectForScreenRange(new Range(point, point)).top;
    };

    ScrollFullScreenDown.prototype.smoothScroll = function(fromRow, toRow, options) {
      var topPixelFrom, topPixelTo;
      topPixelFrom = {
        top: this.getPixelRectTopForSceenRow(fromRow)
      };
      topPixelTo = {
        top: this.getPixelRectTopForSceenRow(toRow)
      };
      options.step = (function(_this) {
        return function(newTop) {
          return _this.editor.element.setScrollTop(newTop);
        };
      })(this);
      options.duration = this.getSmoothScrollDuation();
      return this.vimState.requestScrollAnimation(topPixelFrom, topPixelTo, options);
    };

    ScrollFullScreenDown.prototype.highlightScreenRow = function(screenRow) {
      var marker, screenRange;
      screenRange = new Range([screenRow, 0], [screenRow, 2e308]);
      marker = this.editor.markScreenRange(screenRange);
      this.editor.decorateMarker(marker, {
        type: 'highlight',
        "class": 'vim-mode-plus-flash'
      });
      return marker;
    };

    ScrollFullScreenDown.prototype.getAmountOfRows = function() {
      return Math.ceil(this.amountOfPage * this.editor.getRowsPerPage() * this.getCount());
    };

    ScrollFullScreenDown.prototype.getPoint = function(cursor) {
      var row;
      row = getValidVimScreenRow(this.editor, cursor.getScreenRow() + this.getAmountOfRows());
      return new Point(row, 0);
    };

    ScrollFullScreenDown.prototype.moveCursor = function(cursor) {
      var complete, currentTopRow, done, finalTopRow, marker;
      cursor.setScreenPosition(this.getPoint(cursor), {
        autoscroll: false
      });
      if (cursor.isLastCursor()) {
        if (this.isSmoothScrollEnabled()) {
          this.vimState.finishScrollAnimation();
        }
        currentTopRow = this.editor.getFirstVisibleScreenRow();
        finalTopRow = currentTopRow + this.getAmountOfRows();
        done = (function(_this) {
          return function() {
            return _this.editor.setFirstVisibleScreenRow(finalTopRow);
          };
        })(this);
        if (this.isSmoothScrollEnabled()) {
          marker = this.highlightScreenRow(cursor.getScreenRow());
          complete = function() {
            return marker.destroy();
          };
          return this.smoothScroll(currentTopRow, finalTopRow, {
            done: done,
            complete: complete
          });
        } else {
          return done();
        }
      }
    };

    return ScrollFullScreenDown;

  })(Motion);

  ScrollFullScreenUp = (function(superClass) {
    extend(ScrollFullScreenUp, superClass);

    function ScrollFullScreenUp() {
      return ScrollFullScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenUp.extend();

    ScrollFullScreenUp.prototype.amountOfPage = -1;

    return ScrollFullScreenUp;

  })(ScrollFullScreenDown);

  ScrollHalfScreenDown = (function(superClass) {
    extend(ScrollHalfScreenDown, superClass);

    function ScrollHalfScreenDown() {
      return ScrollHalfScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenDown.extend();

    ScrollHalfScreenDown.prototype.amountOfPage = +1 / 2;

    return ScrollHalfScreenDown;

  })(ScrollFullScreenDown);

  ScrollHalfScreenUp = (function(superClass) {
    extend(ScrollHalfScreenUp, superClass);

    function ScrollHalfScreenUp() {
      return ScrollHalfScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenUp.extend();

    ScrollHalfScreenUp.prototype.amountOfPage = -1 / 2;

    return ScrollHalfScreenUp;

  })(ScrollHalfScreenDown);

  Find = (function(superClass) {
    extend(Find, superClass);

    function Find() {
      return Find.__super__.constructor.apply(this, arguments);
    }

    Find.extend();

    Find.prototype.backwards = false;

    Find.prototype.inclusive = true;

    Find.prototype.hover = {
      icon: ':find:',
      emoji: ':mag_right:'
    };

    Find.prototype.offset = 0;

    Find.prototype.requireInput = true;

    Find.prototype.initialize = function() {
      Find.__super__.initialize.apply(this, arguments);
      if (!this.isComplete()) {
        return this.focusInput();
      }
    };

    Find.prototype.isBackwards = function() {
      return this.backwards;
    };

    Find.prototype.getPoint = function(fromPoint) {
      var end, method, offset, points, ref2, ref3, scanRange, start, unOffset;
      ref2 = this.editor.bufferRangeForBufferRow(fromPoint.row), start = ref2.start, end = ref2.end;
      offset = this.isBackwards() ? this.offset : -this.offset;
      unOffset = -offset * this.isRepeated();
      if (this.isBackwards()) {
        scanRange = [start, fromPoint.translate([0, unOffset])];
        method = 'backwardsScanInBufferRange';
      } else {
        scanRange = [fromPoint.translate([0, 1 + unOffset]), end];
        method = 'scanInBufferRange';
      }
      points = [];
      this.editor[method](RegExp("" + (_.escapeRegExp(this.input)), "g"), scanRange, function(arg) {
        var range;
        range = arg.range;
        return points.push(range.start);
      });
      return (ref3 = points[this.getCount()]) != null ? ref3.translate([0, offset]) : void 0;
    };

    Find.prototype.getCount = function() {
      return Find.__super__.getCount.apply(this, arguments) - 1;
    };

    Find.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      this.setBufferPositionSafely(cursor, point);
      if (!this.isRepeated()) {
        return this.globalState.set('currentFind', this);
      }
    };

    return Find;

  })(Motion);

  FindBackwards = (function(superClass) {
    extend(FindBackwards, superClass);

    function FindBackwards() {
      return FindBackwards.__super__.constructor.apply(this, arguments);
    }

    FindBackwards.extend();

    FindBackwards.prototype.inclusive = false;

    FindBackwards.prototype.backwards = true;

    FindBackwards.prototype.hover = {
      icon: ':find:',
      emoji: ':mag:'
    };

    return FindBackwards;

  })(Find);

  Till = (function(superClass) {
    extend(Till, superClass);

    function Till() {
      return Till.__super__.constructor.apply(this, arguments);
    }

    Till.extend();

    Till.prototype.offset = 1;

    Till.prototype.getPoint = function() {
      return this.point = Till.__super__.getPoint.apply(this, arguments);
    };

    Till.prototype.selectByMotion = function(selection) {
      Till.__super__.selectByMotion.apply(this, arguments);
      if (selection.isEmpty() && ((this.point != null) && !this.backwards)) {
        return swrap(selection).translateSelectionEndAndClip('forward');
      }
    };

    return Till;

  })(Find);

  TillBackwards = (function(superClass) {
    extend(TillBackwards, superClass);

    function TillBackwards() {
      return TillBackwards.__super__.constructor.apply(this, arguments);
    }

    TillBackwards.extend();

    TillBackwards.prototype.inclusive = false;

    TillBackwards.prototype.backwards = true;

    return TillBackwards;

  })(Till);

  MoveToMark = (function(superClass) {
    extend(MoveToMark, superClass);

    function MoveToMark() {
      return MoveToMark.__super__.constructor.apply(this, arguments);
    }

    MoveToMark.extend();

    MoveToMark.prototype.jump = true;

    MoveToMark.prototype.requireInput = true;

    MoveToMark.prototype.hover = {
      icon: ":move-to-mark:`",
      emoji: ":round_pushpin:`"
    };

    MoveToMark.prototype.input = null;

    MoveToMark.prototype.initialize = function() {
      MoveToMark.__super__.initialize.apply(this, arguments);
      if (!this.isComplete()) {
        return this.focusInput();
      }
    };

    MoveToMark.prototype.getPoint = function() {
      return this.vimState.mark.get(this.getInput());
    };

    MoveToMark.prototype.moveCursor = function(cursor) {
      var point;
      if (point = this.getPoint()) {
        cursor.setBufferPosition(point);
        return cursor.autoscroll({
          center: true
        });
      }
    };

    return MoveToMark;

  })(Motion);

  MoveToMarkLine = (function(superClass) {
    extend(MoveToMarkLine, superClass);

    function MoveToMarkLine() {
      return MoveToMarkLine.__super__.constructor.apply(this, arguments);
    }

    MoveToMarkLine.extend();

    MoveToMarkLine.prototype.hover = {
      icon: ":move-to-mark:'",
      emoji: ":round_pushpin:'"
    };

    MoveToMarkLine.prototype.wise = 'linewise';

    MoveToMarkLine.prototype.getPoint = function() {
      var point;
      if (point = MoveToMarkLine.__super__.getPoint.apply(this, arguments)) {
        return getFirstCharacterPositionForBufferRow(this.editor, point.row);
      }
    };

    return MoveToMarkLine;

  })(MoveToMark);

  MoveToPreviousFoldStart = (function(superClass) {
    extend(MoveToPreviousFoldStart, superClass);

    function MoveToPreviousFoldStart() {
      return MoveToPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStart.extend();

    MoveToPreviousFoldStart.description = "Move to previous fold start";

    MoveToPreviousFoldStart.prototype.wise = 'characterwise';

    MoveToPreviousFoldStart.prototype.which = 'start';

    MoveToPreviousFoldStart.prototype.direction = 'prev';

    MoveToPreviousFoldStart.prototype.initialize = function() {
      MoveToPreviousFoldStart.__super__.initialize.apply(this, arguments);
      this.rows = this.getFoldRows(this.which);
      if (this.direction === 'prev') {
        return this.rows.reverse();
      }
    };

    MoveToPreviousFoldStart.prototype.getFoldRows = function(which) {
      var index, rows;
      index = which === 'start' ? 0 : 1;
      rows = getCodeFoldRowRanges(this.editor).map(function(rowRange) {
        return rowRange[index];
      });
      return _.sortBy(_.uniq(rows), function(row) {
        return row;
      });
    };

    MoveToPreviousFoldStart.prototype.getScanRows = function(cursor) {
      var cursorRow, isValidRow;
      cursorRow = cursor.getBufferRow();
      isValidRow = (function() {
        switch (this.direction) {
          case 'prev':
            return function(row) {
              return row < cursorRow;
            };
          case 'next':
            return function(row) {
              return row > cursorRow;
            };
        }
      }).call(this);
      return this.rows.filter(isValidRow);
    };

    MoveToPreviousFoldStart.prototype.detectRow = function(cursor) {
      return this.getScanRows(cursor)[0];
    };

    MoveToPreviousFoldStart.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var row;
          if ((row = _this.detectRow(cursor)) != null) {
            return moveCursorToFirstCharacterAtRow(cursor, row);
          }
        };
      })(this));
    };

    return MoveToPreviousFoldStart;

  })(Motion);

  MoveToNextFoldStart = (function(superClass) {
    extend(MoveToNextFoldStart, superClass);

    function MoveToNextFoldStart() {
      return MoveToNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStart.extend();

    MoveToNextFoldStart.description = "Move to next fold start";

    MoveToNextFoldStart.prototype.direction = 'next';

    return MoveToNextFoldStart;

  })(MoveToPreviousFoldStart);

  MoveToPreviousFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToPreviousFoldStartWithSameIndent, superClass);

    function MoveToPreviousFoldStartWithSameIndent() {
      return MoveToPreviousFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStartWithSameIndent.extend();

    MoveToPreviousFoldStartWithSameIndent.description = "Move to previous same-indented fold start";

    MoveToPreviousFoldStartWithSameIndent.prototype.detectRow = function(cursor) {
      var baseIndentLevel, i, len, ref2, row;
      baseIndentLevel = getIndentLevelForBufferRow(this.editor, cursor.getBufferRow());
      ref2 = this.getScanRows(cursor);
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (getIndentLevelForBufferRow(this.editor, row) === baseIndentLevel) {
          return row;
        }
      }
      return null;
    };

    return MoveToPreviousFoldStartWithSameIndent;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToNextFoldStartWithSameIndent, superClass);

    function MoveToNextFoldStartWithSameIndent() {
      return MoveToNextFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStartWithSameIndent.extend();

    MoveToNextFoldStartWithSameIndent.description = "Move to next same-indented fold start";

    MoveToNextFoldStartWithSameIndent.prototype.direction = 'next';

    return MoveToNextFoldStartWithSameIndent;

  })(MoveToPreviousFoldStartWithSameIndent);

  MoveToPreviousFoldEnd = (function(superClass) {
    extend(MoveToPreviousFoldEnd, superClass);

    function MoveToPreviousFoldEnd() {
      return MoveToPreviousFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldEnd.extend();

    MoveToPreviousFoldEnd.description = "Move to previous fold end";

    MoveToPreviousFoldEnd.prototype.which = 'end';

    return MoveToPreviousFoldEnd;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldEnd = (function(superClass) {
    extend(MoveToNextFoldEnd, superClass);

    function MoveToNextFoldEnd() {
      return MoveToNextFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldEnd.extend();

    MoveToNextFoldEnd.description = "Move to next fold end";

    MoveToNextFoldEnd.prototype.direction = 'next';

    return MoveToNextFoldEnd;

  })(MoveToPreviousFoldEnd);

  MoveToPreviousFunction = (function(superClass) {
    extend(MoveToPreviousFunction, superClass);

    function MoveToPreviousFunction() {
      return MoveToPreviousFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFunction.extend();

    MoveToPreviousFunction.description = "Move to previous function";

    MoveToPreviousFunction.prototype.direction = 'prev';

    MoveToPreviousFunction.prototype.detectRow = function(cursor) {
      return _.detect(this.getScanRows(cursor), (function(_this) {
        return function(row) {
          return isIncludeFunctionScopeForRow(_this.editor, row);
        };
      })(this));
    };

    return MoveToPreviousFunction;

  })(MoveToPreviousFoldStart);

  MoveToNextFunction = (function(superClass) {
    extend(MoveToNextFunction, superClass);

    function MoveToNextFunction() {
      return MoveToNextFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFunction.extend();

    MoveToNextFunction.description = "Move to next function";

    MoveToNextFunction.prototype.direction = 'next';

    return MoveToNextFunction;

  })(MoveToPreviousFunction);

  MoveToPositionByScope = (function(superClass) {
    extend(MoveToPositionByScope, superClass);

    function MoveToPositionByScope() {
      return MoveToPositionByScope.__super__.constructor.apply(this, arguments);
    }

    MoveToPositionByScope.extend(false);

    MoveToPositionByScope.prototype.direction = 'backward';

    MoveToPositionByScope.prototype.scope = '.';

    MoveToPositionByScope.prototype.getPoint = function(fromPoint) {
      return detectScopeStartPositionForScope(this.editor, fromPoint, this.direction, this.scope);
    };

    MoveToPositionByScope.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function(arg) {
          var newPoint, stop;
          stop = arg.stop;
          if ((newPoint = _this.getPoint(point))) {
            return point = newPoint;
          } else {
            return stop();
          }
        };
      })(this));
      return this.setBufferPositionSafely(cursor, point);
    };

    return MoveToPositionByScope;

  })(Motion);

  MoveToPreviousString = (function(superClass) {
    extend(MoveToPreviousString, superClass);

    function MoveToPreviousString() {
      return MoveToPreviousString.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousString.extend();

    MoveToPreviousString.description = "Move to previous string(searched by `string.begin` scope)";

    MoveToPreviousString.prototype.direction = 'backward';

    MoveToPreviousString.prototype.scope = 'string.begin';

    return MoveToPreviousString;

  })(MoveToPositionByScope);

  MoveToNextString = (function(superClass) {
    extend(MoveToNextString, superClass);

    function MoveToNextString() {
      return MoveToNextString.__super__.constructor.apply(this, arguments);
    }

    MoveToNextString.extend();

    MoveToNextString.description = "Move to next string(searched by `string.begin` scope)";

    MoveToNextString.prototype.direction = 'forward';

    return MoveToNextString;

  })(MoveToPreviousString);

  MoveToPreviousNumber = (function(superClass) {
    extend(MoveToPreviousNumber, superClass);

    function MoveToPreviousNumber() {
      return MoveToPreviousNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousNumber.extend();

    MoveToPreviousNumber.prototype.direction = 'backward';

    MoveToPreviousNumber.description = "Move to previous number(searched by `constant.numeric` scope)";

    MoveToPreviousNumber.prototype.scope = 'constant.numeric';

    return MoveToPreviousNumber;

  })(MoveToPositionByScope);

  MoveToNextNumber = (function(superClass) {
    extend(MoveToNextNumber, superClass);

    function MoveToNextNumber() {
      return MoveToNextNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToNextNumber.extend();

    MoveToNextNumber.description = "Move to next number(searched by `constant.numeric` scope)";

    MoveToNextNumber.prototype.direction = 'forward';

    return MoveToNextNumber;

  })(MoveToPreviousNumber);

  MoveToPair = (function(superClass) {
    extend(MoveToPair, superClass);

    function MoveToPair() {
      return MoveToPair.__super__.constructor.apply(this, arguments);
    }

    MoveToPair.extend();

    MoveToPair.prototype.inclusive = true;

    MoveToPair.prototype.jump = true;

    MoveToPair.prototype.member = ['Parenthesis', 'CurlyBracket', 'SquareBracket', 'AngleBracket'];

    MoveToPair.prototype.moveCursor = function(cursor) {
      return this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    };

    MoveToPair.prototype.getPoint = function(cursor) {
      var cursorPosition, cursorRow, enclosingRange, enclosingRanges, forwardingRanges, getPointForTag, point, ranges, ref2, ref3;
      cursorPosition = cursor.getBufferPosition();
      cursorRow = cursorPosition.row;
      getPointForTag = (function(_this) {
        return function() {
          var closeRange, openRange, p, pairInfo;
          p = cursorPosition;
          pairInfo = _this["new"]("ATag").getPairInfo(p);
          if (pairInfo == null) {
            return null;
          }
          openRange = pairInfo.openRange, closeRange = pairInfo.closeRange;
          openRange = openRange.translate([0, +1], [0, -1]);
          closeRange = closeRange.translate([0, +1], [0, -1]);
          if (openRange.containsPoint(p) && (!p.isEqual(openRange.end))) {
            return closeRange.start;
          }
          if (closeRange.containsPoint(p) && (!p.isEqual(closeRange.end))) {
            return openRange.start;
          }
        };
      })(this);
      point = getPointForTag();
      if (point != null) {
        return point;
      }
      ranges = this["new"]("AAnyPair", {
        allowForwarding: true,
        member: this.member
      }).getRanges(cursor.selection);
      ranges = ranges.filter(function(arg) {
        var end, p, start;
        start = arg.start, end = arg.end;
        p = cursorPosition;
        return (p.row === start.row) && start.isGreaterThanOrEqual(p) || (p.row === end.row) && end.isGreaterThanOrEqual(p);
      });
      if (!ranges.length) {
        return null;
      }
      ref2 = _.partition(ranges, function(range) {
        return range.containsPoint(cursorPosition, true);
      }), enclosingRanges = ref2[0], forwardingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return ((ref3 = forwardingRanges[0]) != null ? ref3.end.translate([0, -1]) : void 0) || (enclosingRange != null ? enclosingRange.start : void 0);
    };

    return MoveToPair;

  })(Motion);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrekVBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsTUFBQSxHQUFTOztFQUVULE9BNkJJLE9BQUEsQ0FBUSxTQUFSLENBN0JKLEVBQ0Usc0NBREYsRUFDbUIsa0RBRG5CLEVBRUUsb0NBRkYsRUFFa0Isc0NBRmxCLEVBR0UsNENBSEYsRUFHc0IsZ0RBSHRCLEVBSUUsZ0RBSkYsRUFLRSw0Q0FMRixFQU1FLG9EQU5GLEVBT0Usd0RBUEYsRUFPNEIsc0RBUDVCLEVBUUUsZ0RBUkYsRUFRd0IsZ0RBUnhCLEVBU0Usc0NBVEYsRUFVRSxzRUFWRixFQVdFLDRCQVhGLEVBWUUsNERBWkYsRUFhRSxnREFiRixFQWNFLGtFQWRGLEVBZUUsNENBZkYsRUFnQkUsZ0RBaEJGLEVBaUJFLGdGQWpCRixFQWtCRSxnRUFsQkYsRUFtQkUsd0VBbkJGLEVBb0JFLGtDQXBCRixFQXFCRSw0REFyQkYsRUFzQkUsa0ZBdEJGLEVBdUJFLDhGQXZCRixFQXdCRSxnRUF4QkYsRUF5QkUsd0VBekJGLEVBMEJFLDRFQTFCRixFQTRCRTs7RUFHRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBRUQ7OztJQUNKLE1BQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7cUJBQ0EsU0FBQSxHQUFXOztxQkFDWCxJQUFBLEdBQU07O3FCQUNOLElBQUEsR0FBTTs7SUFFTyxnQkFBQTtNQUNYLHlDQUFBLFNBQUE7TUFHQSxJQUFHLElBQUMs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Q0FBQSxJQUF5QixLQUFLLENBQUMsb0JBQU4sQ0FBMkIsQ0FBM0IsQ0FBekIsSUFDRSxDQUFDLENBQUMsQ0FBQyxHQUFGLEtBQVMsR0FBRyxDQUFDLEdBQWQsQ0FERixJQUN5QixHQUFHLENBQUMsb0JBQUosQ0FBeUIsQ0FBekI7TUFISixDQUFkO01BS1QsSUFBQSxDQUFtQixNQUFNLENBQUMsTUFBMUI7QUFBQSxlQUFPLEtBQVA7O01BR0EsT0FBc0MsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxNQUFaLEVBQW9CLFNBQUMsS0FBRDtlQUN4RCxLQUFLLENBQUMsYUFBTixDQUFvQixjQUFwQixFQUFvQyxJQUFwQztNQUR3RCxDQUFwQixDQUF0QyxFQUFDLHlCQUFELEVBQWtCO01BRWxCLGNBQUEsR0FBaUIsQ0FBQyxDQUFDLElBQUYsQ0FBTyxVQUFBLENBQVcsZUFBWCxDQUFQO01BQ2pCLGdCQUFBLEdBQW1CLFVBQUEsQ0FBVyxnQkFBWDtNQUVuQixJQUFHLGNBQUg7UUFDRSxnQkFBQSxHQUFtQixnQkFBZ0IsQ0FBQyxNQUFqQixDQUF3QixTQUFDLEtBQUQ7aUJBQ3pDLGNBQWMsQ0FBQyxhQUFmLENBQTZCLEtBQTdCO1FBRHlDLENBQXhCLEVBRHJCOzt5REFJbUIsQ0FBRSxHQUFHLENBQUMsU0FBekIsQ0FBbUMsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQW5DLFdBQUEsOEJBQStDLGNBQWMsQ0FBRTtJQW5DdkQ7Ozs7S0FUYTtBQTNpQ3pCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcblNlbGVjdCA9IG51bGxcblxue1xuICBzYXZlRWRpdG9yU3RhdGUsIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICBtb3ZlQ3Vyc29yTGVmdCwgbW92ZUN1cnNvclJpZ2h0XG4gIG1vdmVDdXJzb3JVcFNjcmVlbiwgbW92ZUN1cnNvckRvd25TY3JlZW5cbiAgbW92ZUN1cnNvckRvd25CdWZmZXJcbiAgbW92ZUN1cnNvclVwQnVmZmVyXG4gIGN1cnNvcklzQXRWaW1FbmRPZkZpbGVcbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93LCBnZXRMYXN0VmlzaWJsZVNjcmVlblJvd1xuICBnZXRWYWxpZFZpbVNjcmVlblJvdywgZ2V0VmFsaWRWaW1CdWZmZXJSb3dcbiAgaGlnaGxpZ2h0UmFuZ2VzXG4gIG1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3dcbiAgc29ydFJhbmdlc1xuICBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvd1xuICBjdXJzb3JJc09uV2hpdGVTcGFjZVxuICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZVxuICBjdXJzb3JJc0F0RW1wdHlSb3dcbiAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNcbiAgZ2V0TGFyZ2VzdEZvbGRSYW5nZUNvbnRhaW5zQnVmZmVyUm93XG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3dcbiAgZGV0ZWN0U2NvcGVTdGFydFBvc2l0aW9uRm9yU2NvcGVcbiAgZ2V0QnVmZmVyUm93c1xuICBnZXRTdGFydFBvc2l0aW9uRm9yUGF0dGVyblxuICBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93XG4gIGdldEZpcnN0Q2hhcmFjdGVyQnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Sb3dcbiAgc2NyZWVuUG9zaXRpb25Jc0F0V2hpdGVTcGFjZVxuICBjdXJzb3JJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvd1xuICBnZXRGaXJzdENoYXJhY3RlckNvbHVtRm9yQnVmZmVyUm93XG5cbiAgZGVidWdcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuXG5jbGFzcyBNb3Rpb24gZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIGluY2x1c2l2ZTogZmFsc2VcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIGp1bXA6IGZhbHNlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcblxuICAgICMgdmlzdWFsIG1vZGUgY2FuIG92ZXJ3cml0ZSBkZWZhdWx0IHdpc2UgYW5kIGluY2x1c2l2ZW5lc3NcbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGluY2x1c2l2ZSA9IHRydWVcbiAgICAgIEB3aXNlID0gQHZpbVN0YXRlLnN1Ym1vZGUgIyBbJ2NoYXJhY3Rlcndpc2UnLCAnbGluZXdpc2UnLCAnYmxvY2t3aXNlJ11cbiAgICBAaW5pdGlhbGl6ZSgpXG5cbiAgaXNJbmNsdXNpdmU6IC0+XG4gICAgQGluY2x1c2l2ZVxuXG4gIGlzSnVtcDogLT5cbiAgICBAanVtcFxuXG4gIGlzQ2hhcmFjdGVyd2lzZTogLT5cbiAgICBAd2lzZSBpcyAnY2hhcmFjdGVyd2lzZSdcblxuICBpc0xpbmV3aXNlOiAtPlxuICAgIEB3aXNlIGlzICdsaW5ld2lzZSdcblxuICBpc0Jsb2Nrd2lzZTogLT5cbiAgICBAd2lzZSBpcyAnYmxvY2t3aXNlJ1xuXG4gIGZvcmNlV2lzZTogKHdpc2UpIC0+XG4gICAgaWYgd2lzZSBpcyAnY2hhcmFjdGVyd2lzZSdcbiAgICAgIGlmIEB3aXNlIGlzICdsaW5ld2lzZSdcbiAgICAgICAgQGluY2x1c2l2ZSA9IGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIEBpbmNsdXNpdmUgPSBub3QgQGluY2x1c2l2ZVxuICAgIEB3aXNlID0gd2lzZVxuXG4gIHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5OiAoY3Vyc29yLCBwb2ludCkgLT5cbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpIGlmIHBvaW50P1xuXG4gIHNldFNjcmVlblBvc2l0aW9uU2FmZWx5OiAoY3Vyc29yLCBwb2ludCkgLT5cbiAgICBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24ocG9pbnQpIGlmIHBvaW50P1xuXG4gIG1vdmVXaXRoU2F2ZUp1bXA6IChjdXJzb3IpIC0+XG4gICAgaWYgY3Vyc29yLmlzTGFzdEN1cnNvcigpIGFuZCBAaXNKdW1wKClcbiAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIEBtb3ZlQ3Vyc29yKGN1cnNvcilcblxuICAgIGlmIGN1cnNvclBvc2l0aW9uPyBhbmQgbm90IGN1cnNvclBvc2l0aW9uLmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBAdmltU3RhdGUubWFyay5zZXQoJ2AnLCBjdXJzb3JQb3NpdGlvbilcbiAgICAgIEB2aW1TdGF0ZS5tYXJrLnNldChcIidcIiwgY3Vyc29yUG9zaXRpb24pXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yLm1vdmVDdXJzb3JzIChjdXJzb3IpID0+XG4gICAgICBAbW92ZVdpdGhTYXZlSnVtcChjdXJzb3IpXG5cbiAgc2VsZWN0OiAtPlxuICAgIEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5ub3JtYWxpemVTZWxlY3Rpb25zKCkgaWYgQGlzTW9kZSgndmlzdWFsJylcblxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIEBzZWxlY3RCeU1vdGlvbihzZWxlY3Rpb24pXG5cbiAgICBAZWRpdG9yLm1lcmdlQ3Vyc29ycygpXG4gICAgQGVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuXG4gICAgQHVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXMoKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuXG4gICAgIyBNb2RpZnkgc2VsZWN0aW9uIHRvIHN1Ym1vZGUtd2lzZWx5XG4gICAgc3dpdGNoIEB3aXNlXG4gICAgICB3aGVuICdsaW5ld2lzZScgdGhlbiBAdmltU3RhdGUuc2VsZWN0TGluZXdpc2UoKVxuICAgICAgd2hlbiAnYmxvY2t3aXNlJyB0aGVuIEB2aW1TdGF0ZS5zZWxlY3RCbG9ja3dpc2UoKVxuXG4gIHNlbGVjdEJ5TW90aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHtjdXJzb3J9ID0gc2VsZWN0aW9uXG5cbiAgICBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uID0+XG4gICAgICBAbW92ZVdpdGhTYXZlSnVtcChjdXJzb3IpXG5cbiAgICByZXR1cm4gaWYgbm90IEBpc01vZGUoJ3Zpc3VhbCcpIGFuZCBzZWxlY3Rpb24uaXNFbXB0eSgpICMgRmFpbGVkIHRvIG1vdmUuXG4gICAgcmV0dXJuIHVubGVzcyBAaXNJbmNsdXNpdmUoKSBvciBAaXNMaW5ld2lzZSgpXG5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgY3Vyc29ySXNBdEVuZE9mTGluZUF0Tm9uRW1wdHlSb3coY3Vyc29yKVxuICAgICAgIyBBdm9pZCBwdXRpbmcgY3Vyc29yIG9uIEVPTCBpbiB2aXN1YWwtbW9kZSBhcyBsb25nIGFzIGN1cnNvcidzIHJvdyB3YXMgbm9uLWVtcHR5LlxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS50cmFuc2xhdGVTZWxlY3Rpb25IZWFkQW5kQ2xpcCgnYmFja3dhcmQnKVxuICAgICMgdG8gc2VsZWN0IEBpbmNsdXNpdmUtbHlcbiAgICBzd3JhcChzZWxlY3Rpb24pLnRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2ZvcndhcmQnKVxuXG4jIFVzZWQgYXMgb3BlcmF0b3IncyB0YXJnZXQgaW4gdmlzdWFsLW1vZGUuXG5jbGFzcyBDdXJyZW50U2VsZWN0aW9uIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoZmFsc2UpXG4gIHNlbGVjdGlvbkV4dGVudDogbnVsbFxuICBpbmNsdXNpdmU6IHRydWVcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHBvaW50SW5mb0J5Q3Vyc29yID0gbmV3IE1hcFxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiI3tAZ2V0TmFtZSgpfSBzaG91bGQgbm90IGJlIGV4ZWN1dGVkXCIpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgaWYgQGlzQmxvY2t3aXNlKClcbiAgICAgICAge3N0YXJ0LCBlbmR9ID0gY3Vyc29yLnNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIFtoZWFkLCB0YWlsXSA9IGlmIGN1cnNvci5zZWxlY3Rpb24uaXNSZXZlcnNlZCgpIHRoZW4gW3N0YXJ0LCBlbmRdIGVsc2UgW2VuZCwgc3RhcnRdXG4gICAgICAgIEBzZWxlY3Rpb25FeHRlbnQgPSBuZXcgUG9pbnQoaGVhZC5yb3cgLSB0YWlsLnJvdywgaGVhZC5jb2x1bW4gLSB0YWlsLmNvbHVtbilcbiAgICAgIGVsc2VcbiAgICAgICAgQHNlbGVjdGlvbkV4dGVudCA9IEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpLmdldEV4dGVudCgpXG4gICAgZWxzZVxuICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgaWYgQGlzQmxvY2t3aXNlKClcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShAc2VsZWN0aW9uRXh0ZW50KSlcbiAgICAgIGVsc2VcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYXZlcnNlKEBzZWxlY3Rpb25FeHRlbnQpKVxuXG4gIHNlbGVjdDogLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgc3VwZXJcbiAgICBlbHNlXG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpIHdoZW4gcG9pbnRJbmZvID0gQHBvaW50SW5mb0J5Q3Vyc29yLmdldChjdXJzb3IpXG4gICAgICAgIHtjdXJzb3JQb3NpdGlvbiwgc3RhcnRPZlNlbGVjdGlvbiwgYXRFT0x9ID0gcG9pbnRJbmZvXG4gICAgICAgIGlmIGF0RU9MIG9yIGN1cnNvclBvc2l0aW9uLmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHN0YXJ0T2ZTZWxlY3Rpb24pXG4gICAgICBzdXBlclxuXG4gICAgIyAqIFB1cnBvc2Ugb2YgcG9pbnRJbmZvQnlDdXJzb3I/IHNlZSAjMjM1IGZvciBkZXRhaWwuXG4gICAgIyBXaGVuIHN0YXlPblRyYW5zZm9ybVN0cmluZyBpcyBlbmFibGVkLCBjdXJzb3IgcG9zIGlzIG5vdCBzZXQgb24gc3RhcnQgb2ZcbiAgICAjIG9mIHNlbGVjdGVkIHJhbmdlLlxuICAgICMgQnV0IEkgd2FudCBmb2xsb3dpbmcgYmVoYXZpb3IsIHNvIG5lZWQgdG8gcHJlc2VydmUgcG9zaXRpb24gaW5mby5cbiAgICAjICAxLiBgdmo+LmAgLT4gaW5kZW50IHNhbWUgdHdvIHJvd3MgcmVnYXJkbGVzcyBvZiBjdXJyZW50IGN1cnNvcidzIHJvdy5cbiAgICAjICAyLiBgdmo+ai5gIC0+IGluZGVudCB0d28gcm93cyBmcm9tIGN1cnNvcidzIHJvdy5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICBzdGFydE9mU2VsZWN0aW9uID0gY3Vyc29yLnNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICBhdEVPTCA9IGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgICAgQHBvaW50SW5mb0J5Q3Vyc29yLnNldChjdXJzb3IsIHtzdGFydE9mU2VsZWN0aW9uLCBjdXJzb3JQb3NpdGlvbiwgYXRFT0x9KVxuXG5jbGFzcyBNb3ZlTGVmdCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBhbGxvd1dyYXAgPSBzZXR0aW5ncy5nZXQoJ3dyYXBMZWZ0UmlnaHRNb3Rpb24nKVxuICAgIEBjb3VudFRpbWVzIC0+XG4gICAgICBtb3ZlQ3Vyc29yTGVmdChjdXJzb3IsIHthbGxvd1dyYXB9KVxuXG5jbGFzcyBNb3ZlUmlnaHQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGNhbldyYXBUb05leHRMaW5lOiAoY3Vyc29yKSAtPlxuICAgIGlmIEBpc0FzT3BlcmF0b3JUYXJnZXQoKSBhbmQgbm90IGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgIGZhbHNlXG4gICAgZWxzZVxuICAgICAgc2V0dGluZ3MuZ2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJylcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBjb3VudFRpbWVzID0+XG4gICAgICBAZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgICBhbGxvd1dyYXAgPSBAY2FuV3JhcFRvTmV4dExpbmUoY3Vyc29yKVxuICAgICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvcilcbiAgICAgIGlmIGN1cnNvci5pc0F0RW5kT2ZMaW5lKCkgYW5kIGFsbG93V3JhcCBhbmQgbm90IGN1cnNvcklzQXRWaW1FbmRPZkZpbGUoY3Vyc29yKVxuICAgICAgICBtb3ZlQ3Vyc29yUmlnaHQoY3Vyc29yLCB7YWxsb3dXcmFwfSlcblxuY2xhc3MgTW92ZVJpZ2h0QnVmZmVyQ29sdW1uIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQodHJ1ZSlcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBuZXdQb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZShbMCwgQGdldENvdW50KCldKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdQb2ludClcblxuY2xhc3MgTW92ZVVwIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgZ2V0UG9pbnQ6IChjdXJzb3IpIC0+XG4gICAgcm93ID0gQGdldFJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgbmV3IFBvaW50KHJvdywgY3Vyc29yLmdvYWxDb2x1bW4pXG5cbiAgZ2V0Um93OiAocm93KSAtPlxuICAgIHJvdyA9IE1hdGgubWF4KHJvdyAtIDEsIDApXG4gICAgaWYgQGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgIHJvdyA9IGdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvdyhAZWRpdG9yLCByb3cpLnN0YXJ0LnJvd1xuICAgIHJvd1xuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIGN1cnNvci5nb2FsQ29sdW1uID89IGN1cnNvci5nZXRCdWZmZXJDb2x1bW4oKVxuICAgICAge2dvYWxDb2x1bW59ID0gY3Vyc29yXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oQGdldFBvaW50KGN1cnNvcikpXG4gICAgICBjdXJzb3IuZ29hbENvbHVtbiA9IGdvYWxDb2x1bW5cblxuY2xhc3MgTW92ZURvd24gZXh0ZW5kcyBNb3ZlVXBcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBnZXRSb3c6IChyb3cpIC0+XG4gICAgaWYgQGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgIHJvdyA9IGdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvdyhAZWRpdG9yLCByb3cpLmVuZC5yb3dcbiAgICBNYXRoLm1pbihyb3cgKyAxLCBAZ2V0VmltTGFzdEJ1ZmZlclJvdygpKVxuXG5jbGFzcyBNb3ZlVXBTY3JlZW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgZGlyZWN0aW9uOiAndXAnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyAtPlxuICAgICAgbW92ZUN1cnNvclVwU2NyZWVuKGN1cnNvcilcblxuY2xhc3MgTW92ZURvd25TY3JlZW4gZXh0ZW5kcyBNb3ZlVXBTY3JlZW5cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgZGlyZWN0aW9uOiAnZG93bidcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBjb3VudFRpbWVzIC0+XG4gICAgICBtb3ZlQ3Vyc29yRG93blNjcmVlbihjdXJzb3IpXG5cbiMgTW92ZSBkb3duL3VwIHRvIEVkZ2VcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTZWUgdDltZC9hdG9tLXZpbS1tb2RlLXBsdXMjMjM2XG4jIEF0IGxlYXN0IHYxLjcuMC4gYnVmZmVyUG9zaXRpb24gYW5kIHNjcmVlblBvc2l0aW9uIGNhbm5vdCBjb252ZXJ0IGFjY3VyYXRlbHlcbiMgd2hlbiByb3cgaXMgZm9sZGVkLlxuY2xhc3MgTW92ZVVwVG9FZGdlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGp1bXA6IHRydWVcbiAgZGlyZWN0aW9uOiAndXAnXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIGN1cnNvciB1cCB0byAqKmVkZ2UqKiBjaGFyIGF0IHNhbWUtY29sdW1uXCJcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKClcbiAgICBAY291bnRUaW1lcyAoe3N0b3B9KSA9PlxuICAgICAgaWYgKG5ld1BvaW50ID0gQGdldFBvaW50KHBvaW50KSlcbiAgICAgICAgcG9pbnQgPSBuZXdQb2ludFxuICAgICAgZWxzZVxuICAgICAgICBzdG9wKClcbiAgICBAc2V0U2NyZWVuUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBwb2ludClcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBjb2x1bW4gPSBmcm9tUG9pbnQuY29sdW1uXG4gICAgZm9yIHJvdyBpbiBAZ2V0U2NhblJvd3MoZnJvbVBvaW50KSB3aGVuIHBvaW50ID0gbmV3IFBvaW50KHJvdywgY29sdW1uKVxuICAgICAgcmV0dXJuIHBvaW50IGlmIEBpc0VkZ2UocG9pbnQpXG5cbiAgZ2V0U2NhblJvd3M6ICh7cm93fSkgLT5cbiAgICB2YWxpZFJvdyA9IGdldFZhbGlkVmltU2NyZWVuUm93LmJpbmQobnVsbCwgQGVkaXRvcilcbiAgICBzd2l0Y2ggQGRpcmVjdGlvblxuICAgICAgd2hlbiAndXAnIHRoZW4gW3ZhbGlkUm93KHJvdyAtIDEpLi4wXVxuICAgICAgd2hlbiAnZG93bicgdGhlbiBbdmFsaWRSb3cocm93ICsgMSkuLkBnZXRWaW1MYXN0U2NyZWVuUm93KCldXG5cbiAgaXNFZGdlOiAocG9pbnQpIC0+XG4gICAgaWYgQGlzU3RvcHBhYmxlUG9pbnQocG9pbnQpXG4gICAgICAjIElmIG9uZSBvZiBhYm92ZS9iZWxvdyBwb2ludCB3YXMgbm90IHN0b3BwYWJsZSwgaXQncyBFZGdlIVxuICAgICAgYWJvdmUgPSBwb2ludC50cmFuc2xhdGUoWy0xLCAwXSlcbiAgICAgIGJlbG93ID0gcG9pbnQudHJhbnNsYXRlKFsrMSwgMF0pXG4gICAgICAobm90IEBpc1N0b3BwYWJsZVBvaW50KGFib3ZlKSkgb3IgKG5vdCBAaXNTdG9wcGFibGVQb2ludChiZWxvdykpXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBpc1N0b3BwYWJsZVBvaW50OiAocG9pbnQpIC0+XG4gICAgaWYgQGlzTm9uV2hpdGVTcGFjZVBvaW50KHBvaW50KVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGxlZnRQb2ludCA9IHBvaW50LnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgICAgcmlnaHRQb2ludCA9IHBvaW50LnRyYW5zbGF0ZShbMCwgKzFdKVxuICAgICAgQGlzTm9uV2hpdGVTcGFjZVBvaW50KGxlZnRQb2ludCkgYW5kIEBpc05vbldoaXRlU3BhY2VQb2ludChyaWdodFBvaW50KVxuXG4gIGlzTm9uV2hpdGVTcGFjZVBvaW50OiAocG9pbnQpIC0+XG4gICAgc2NyZWVuUG9zaXRpb25Jc0F0V2hpdGVTcGFjZShAZWRpdG9yLCBwb2ludClcblxuY2xhc3MgTW92ZURvd25Ub0VkZ2UgZXh0ZW5kcyBNb3ZlVXBUb0VkZ2VcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIGN1cnNvciBkb3duIHRvICoqZWRnZSoqIGNoYXIgYXQgc2FtZS1jb2x1bW5cIlxuICBkaXJlY3Rpb246ICdkb3duJ1xuXG4jIHdvcmRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dFdvcmQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogbnVsbFxuXG4gIGdldFBvaW50OiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvclBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBwYXR0ZXJuID0gQHdvcmRSZWdleCA/IGN1cnNvci53b3JkUmVnRXhwKClcbiAgICBzY2FuUmFuZ2UgPSBbY3Vyc29yUG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpXVxuXG4gICAgd29yZFJhbmdlID0gbnVsbFxuICAgIGZvdW5kID0gZmFsc2VcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBzdG9wfSkgLT5cbiAgICAgIHdvcmRSYW5nZSA9IHJhbmdlXG4gICAgICAjIElnbm9yZSAnZW1wdHkgbGluZScgbWF0Y2hlcyBiZXR3ZWVuICdcXHInIGFuZCAnXFxuJ1xuICAgICAgcmV0dXJuIGlmIG1hdGNoVGV4dCBpcyAnJyBhbmQgcmFuZ2Uuc3RhcnQuY29sdW1uIGlzbnQgMFxuICAgICAgaWYgcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihjdXJzb3JQb2ludClcbiAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgIHN0b3AoKVxuXG4gICAgaWYgZm91bmRcbiAgICAgIHdvcmRSYW5nZS5zdGFydFxuICAgIGVsc2VcbiAgICAgIHdvcmRSYW5nZT8uZW5kID8gY3Vyc29yUG9pbnRcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHJldHVybiBpZiBjdXJzb3JJc0F0VmltRW5kT2ZGaWxlKGN1cnNvcilcbiAgICB3YXNPbldoaXRlU3BhY2UgPSBjdXJzb3JJc09uV2hpdGVTcGFjZShjdXJzb3IpXG4gICAgQGNvdW50VGltZXMgKHtpc0ZpbmFsfSkgPT5cbiAgICAgIGN1cnNvclJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgICAgaWYgY3Vyc29ySXNBdEVtcHR5Um93KGN1cnNvcikgYW5kIEBpc0FzT3BlcmF0b3JUYXJnZXQoKVxuICAgICAgICBwb2ludCA9IFtjdXJzb3JSb3crMSwgMF1cbiAgICAgIGVsc2VcbiAgICAgICAgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yKVxuICAgICAgICBpZiBpc0ZpbmFsIGFuZCBAaXNBc09wZXJhdG9yVGFyZ2V0KClcbiAgICAgICAgICBpZiBAZ2V0T3BlcmF0b3IoKS5nZXROYW1lKCkgaXMgJ0NoYW5nZScgYW5kIChub3Qgd2FzT25XaGl0ZVNwYWNlKVxuICAgICAgICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSlcbiAgICAgICAgICBlbHNlIGlmIChwb2ludC5yb3cgPiBjdXJzb3JSb3cpXG4gICAgICAgICAgICBwb2ludCA9IFtjdXJzb3JSb3csIEluZmluaXR5XVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4jIGJcbmNsYXNzIE1vdmVUb1ByZXZpb3VzV29yZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiBudWxsXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuY2xhc3MgTW92ZVRvRW5kT2ZXb3JkIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IG51bGxcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgbW92ZVRvTmV4dEVuZE9mV29yZDogKGN1cnNvcikgLT5cbiAgICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZShjdXJzb3IpXG4gICAgcG9pbnQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSkudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgcG9pbnQgPSBQb2ludC5taW4ocG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBjb3VudFRpbWVzID0+XG4gICAgICBvcmlnaW5hbFBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIEBtb3ZlVG9OZXh0RW5kT2ZXb3JkKGN1cnNvcilcbiAgICAgIGlmIG9yaWdpbmFsUG9pbnQuaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgIyBSZXRyeSBmcm9tIHJpZ2h0IGNvbHVtbiBpZiBjdXJzb3Igd2FzIGFscmVhZHkgb24gRW5kT2ZXb3JkXG4gICAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgICAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG5cbiMgW1RPRE86IEltcHJvdmUsIGFjY3VyYWN5XVxuY2xhc3MgTW92ZVRvUHJldmlvdXNFbmRPZldvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIGluY2x1c2l2ZTogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgdGltZXMgPSBAZ2V0Q291bnQoKVxuICAgIHdvcmRSYW5nZSA9IGN1cnNvci5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKClcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAjIGlmIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgYSB3b3JkIHRoZW4gd2UgbmVlZCB0byBtb3ZlIHRvIGl0cyBzdGFydFxuICAgIGlmIGN1cnNvclBvc2l0aW9uLmlzR3JlYXRlclRoYW4od29yZFJhbmdlLnN0YXJ0KSBhbmQgY3Vyc29yUG9zaXRpb24uaXNMZXNzVGhhbih3b3JkUmFuZ2UuZW5kKVxuICAgICAgdGltZXMgKz0gMVxuXG4gICAgZm9yIFsxLi50aW1lc11cbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG4gICAgaWYgY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkuaXNHcmVhdGVyVGhhbk9yRXF1YWwoY3Vyc29yUG9zaXRpb24pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oWzAsIDBdKVxuXG4gIG1vdmVUb05leHRFbmRPZldvcmQ6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSkudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgcG9pbnQgPSBQb2ludC5taW4ocG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuIyBXaG9sZSB3b3JkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXlxccyokfFxcUysvZ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXlxccyokfFxcUysvXG5cbmNsYXNzIE1vdmVUb0VuZE9mV2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IC9cXFMrL1xuXG4jIFtUT0RPOiBJbXByb3ZlLCBhY2N1cmFjeV1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXFxTKy9cblxuIyBBbHBoYW51bWVyaWMgd29yZCBbRXhwZXJpbWVudGFsXVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0QWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvZ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0FscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvXG5cbmNsYXNzIE1vdmVUb0VuZE9mQWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gZW5kIG9mIGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvXG5cbiMgQWxwaGFudW1lcmljIHdvcmQgW0V4cGVyaW1lbnRhbF1cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dFNtYXJ0V29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IHNtYXJ0IHdvcmQgKGAvW1xcdy1dKy9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9nXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBzbWFydCB3b3JkIChgL1tcXHctXSsvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1tcXHctXSsvXG5cbmNsYXNzIE1vdmVUb0VuZE9mU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBlbmQgb2Ygc21hcnQgd29yZCAoYC9bXFx3LV0rL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9bXFx3LV0rL1xuXG4jIFNlbnRlbmNlXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2VudGVuY2UgaXMgZGVmaW5lZCBhcyBiZWxvd1xuIyAgLSBlbmQgd2l0aCBbJy4nLCAnIScsICc/J11cbiMgIC0gb3B0aW9uYWxseSBmb2xsb3dlZCBieSBbJyknLCAnXScsICdcIicsIFwiJ1wiXVxuIyAgLSBmb2xsb3dlZCBieSBbJyQnLCAnICcsICdcXHQnXVxuIyAgLSBwYXJhZ3JhcGggYm91bmRhcnkgaXMgYWxzbyBzZW50ZW5jZSBib3VuZGFyeVxuIyAgLSBzZWN0aW9uIGJvdW5kYXJ5IGlzIGFsc28gc2VudGVuY2UgYm91bmRhcnkoaWdub3JlKVxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBqdW1wOiB0cnVlXG4gIHNlbnRlbmNlUmVnZXg6IC8vLyg/OltcXC4hXFw/XVtcXClcXF1cIiddKlxccyspfChcXG58XFxyXFxuKS8vL2dcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgcG9pbnQgPSBAZ2V0UG9pbnQocG9pbnQpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIGlmIEBkaXJlY3Rpb24gaXMgJ25leHQnXG4gICAgICBAZ2V0TmV4dFN0YXJ0T2ZTZW50ZW5jZShmcm9tUG9pbnQpXG4gICAgZWxzZSBpZiBAZGlyZWN0aW9uIGlzICdwcmV2aW91cydcbiAgICAgIEBnZXRQcmV2aW91c1N0YXJ0T2ZTZW50ZW5jZShmcm9tUG9pbnQpXG5cbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvclJvdzogKHJvdykgLT5cbiAgICBuZXcgUG9pbnQocm93LCBnZXRGaXJzdENoYXJhY3RlckNvbHVtRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdykpXG5cbiAgaXNCbGFua1JvdzogKHJvdykgLT5cbiAgICBAZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KVxuXG4gIGdldE5leHRTdGFydE9mU2VudGVuY2U6IChmcm9tUG9pbnQpIC0+XG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKGZyb21Qb2ludCwgQGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgZm91bmRQb2ludCA9IG51bGxcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIEBzZW50ZW5jZVJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIG1hdGNoVGV4dCwgbWF0Y2gsIHN0b3B9KSA9PlxuICAgICAgaWYgbWF0Y2hbMV0/XG4gICAgICAgIHtzdGFydDoge3Jvdzogc3RhcnRSb3d9LCBlbmQ6IHtyb3c6IGVuZFJvd319ID0gcmFuZ2VcbiAgICAgICAgcmV0dXJuIGlmIEBza2lwQmxhbmtSb3cgYW5kIEBpc0JsYW5rUm93KGVuZFJvdylcbiAgICAgICAgaWYgQGlzQmxhbmtSb3coc3RhcnRSb3cpIGlzbnQgQGlzQmxhbmtSb3coZW5kUm93KVxuICAgICAgICAgIGZvdW5kUG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvclJvdyhlbmRSb3cpXG4gICAgICBlbHNlXG4gICAgICAgIGZvdW5kUG9pbnQgPSByYW5nZS5lbmRcbiAgICAgIHN0b3AoKSBpZiBmb3VuZFBvaW50P1xuICAgIGZvdW5kUG9pbnQgPyBzY2FuUmFuZ2UuZW5kXG5cbiAgZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2U6IChmcm9tUG9pbnQpIC0+XG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKGZyb21Qb2ludCwgWzAsIDBdKVxuICAgIGZvdW5kUG9pbnQgPSBudWxsXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBAc2VudGVuY2VSZWdleCwgc2NhblJhbmdlLCAoe3JhbmdlLCBtYXRjaCwgc3RvcCwgbWF0Y2hUZXh0fSkgPT5cbiAgICAgIGlmIG1hdGNoWzFdP1xuICAgICAgICB7c3RhcnQ6IHtyb3c6IHN0YXJ0Um93fSwgZW5kOiB7cm93OiBlbmRSb3d9fSA9IHJhbmdlXG4gICAgICAgIGlmIG5vdCBAaXNCbGFua1JvdyhlbmRSb3cpIGFuZCBAaXNCbGFua1JvdyhzdGFydFJvdylcbiAgICAgICAgICBwb2ludCA9IEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yUm93KGVuZFJvdylcbiAgICAgICAgICBpZiBwb2ludC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgICAgIGZvdW5kUG9pbnQgPSBwb2ludFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBpZiBAc2tpcEJsYW5rUm93XG4gICAgICAgICAgICBmb3VuZFBvaW50ID0gQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JSb3coc3RhcnRSb3cpXG4gICAgICBlbHNlXG4gICAgICAgIGlmIHJhbmdlLmVuZC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgICBmb3VuZFBvaW50ID0gcmFuZ2UuZW5kXG4gICAgICBzdG9wKCkgaWYgZm91bmRQb2ludD9cbiAgICBmb3VuZFBvaW50ID8gc2NhblJhbmdlLnN0YXJ0XG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU2VudGVuY2UgZXh0ZW5kcyBNb3ZlVG9OZXh0U2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ3ByZXZpb3VzJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0U2VudGVuY2VTa2lwQmxhbmtSb3cgZXh0ZW5kcyBNb3ZlVG9OZXh0U2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIHNraXBCbGFua1JvdzogdHJ1ZVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNTZW50ZW5jZVxuICBAZXh0ZW5kKClcbiAgc2tpcEJsYW5rUm93OiB0cnVlXG5cbiMgUGFyYWdyYXBoXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRQYXJhZ3JhcGggZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGp1bXA6IHRydWVcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgcG9pbnQgPSBAZ2V0UG9pbnQocG9pbnQpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIHN0YXJ0Um93ID0gZnJvbVBvaW50LnJvd1xuICAgIHdhc0F0Tm9uQmxhbmtSb3cgPSBub3QgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHN0YXJ0Um93KVxuICAgIGZvciByb3cgaW4gZ2V0QnVmZmVyUm93cyhAZWRpdG9yLCB7c3RhcnRSb3csIEBkaXJlY3Rpb259KVxuICAgICAgaWYgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChyb3csIDApIGlmIHdhc0F0Tm9uQmxhbmtSb3dcbiAgICAgIGVsc2VcbiAgICAgICAgd2FzQXROb25CbGFua1JvdyA9IHRydWVcblxuICAgICMgZmFsbGJhY2tcbiAgICBzd2l0Y2ggQGRpcmVjdGlvblxuICAgICAgd2hlbiAncHJldmlvdXMnIHRoZW4gbmV3IFBvaW50KDAsIDApXG4gICAgICB3aGVuICduZXh0JyB0aGVuIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzUGFyYWdyYXBoIGV4dGVuZHMgTW92ZVRvTmV4dFBhcmFncmFwaFxuICBAZXh0ZW5kKClcbiAgZGlyZWN0aW9uOiAncHJldmlvdXMnXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuXG4gIGdldFBvaW50OiAoe3Jvd30pIC0+XG4gICAgbmV3IFBvaW50KHJvdywgMClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuY2xhc3MgTW92ZVRvQ29sdW1uIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBnZXRDb3VudDogLT5cbiAgICBzdXBlciAtIDFcblxuICBnZXRQb2ludDogKHtyb3d9KSAtPlxuICAgIG5ldyBQb2ludChyb3csIEBnZXRDb3VudCgpKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkpXG4gICAgY3Vyc29yLnNldFNjcmVlblBvc2l0aW9uKHBvaW50KVxuXG5jbGFzcyBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuXG4gIGdldENvdW50OiAtPlxuICAgIHN1cGVyIC0gMVxuXG4gIGdldFBvaW50OiAoe3Jvd30pIC0+XG4gICAgcm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgcm93ICsgQGdldENvdW50KCkpXG4gICAgbmV3IFBvaW50KHJvdywgSW5maW5pdHkpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBJbmZpbml0eVxuXG5jbGFzcyBNb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IHRydWVcblxuICBnZXRDb3VudDogLT5cbiAgICBzdXBlciAtIDFcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRQb2ludDogKHtyb3d9KSAtPlxuICAgIHJvdyA9IE1hdGgubWluKHJvdyArIEBnZXRDb3VudCgpLCBAZ2V0VmltTGFzdEJ1ZmZlclJvdygpKVxuICAgIGZyb20gPSBuZXcgUG9pbnQocm93LCBJbmZpbml0eSlcbiAgICBwb2ludCA9IGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuKEBlZGl0b3IsIGZyb20sIC9cXHMqJC8pXG4gICAgKHBvaW50ID8gZnJvbSkudHJhbnNsYXRlKFswLCAtMV0pXG5cbiMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZmFpbWlseVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IpKVxuXG4gIGdldFBvaW50OiAoY3Vyc29yKSAtPlxuICAgIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVVwIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyAtPlxuICAgICAgbW92ZUN1cnNvclVwQnVmZmVyKGN1cnNvcilcbiAgICBzdXBlclxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd24gZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBjb3VudFRpbWVzIC0+XG4gICAgICBtb3ZlQ3Vyc29yRG93bkJ1ZmZlcihjdXJzb3IpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duXG4gIEBleHRlbmQoKVxuICBkZWZhdWx0Q291bnQ6IDBcbiAgZ2V0Q291bnQ6IC0+IHN1cGVyIC0gMVxuXG5jbGFzcyBNb3ZlVG9GaXJzdExpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAganVtcDogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEBnZXRQb2ludCgpKVxuICAgIGN1cnNvci5hdXRvc2Nyb2xsKGNlbnRlcjogdHJ1ZSlcblxuICBnZXRQb2ludDogLT5cbiAgICByb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyhAZWRpdG9yLCBAZ2V0Um93KCkpXG4gICAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpXG5cbiAgZ2V0Um93OiAtPlxuICAgIEBnZXRDb3VudCgpIC0gMVxuXG4jIGtleW1hcDogR1xuY2xhc3MgTW92ZVRvTGFzdExpbmUgZXh0ZW5kcyBNb3ZlVG9GaXJzdExpbmVcbiAgQGV4dGVuZCgpXG4gIGRlZmF1bHRDb3VudDogSW5maW5pdHlcblxuIyBrZXltYXA6IE4lIGUuZy4gMTAlXG5jbGFzcyBNb3ZlVG9MaW5lQnlQZXJjZW50IGV4dGVuZHMgTW92ZVRvRmlyc3RMaW5lXG4gIEBleHRlbmQoKVxuXG4gIGdldFJvdzogLT5cbiAgICBwZXJjZW50ID0gTWF0aC5taW4oMTAwLCBAZ2V0Q291bnQoKSlcbiAgICBNYXRoLmZsb29yKEBnZXRWaW1MYXN0U2NyZWVuUm93KCkgKiAocGVyY2VudCAvIDEwMCkpXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgZ2V0Q291bnQ6IC0+XG4gICAgc3VwZXIgLSAxXG5cbiAgZ2V0UG9pbnQ6ICh7cm93fSkgLT5cbiAgICBbcm93ICsgQGdldENvdW50KCksIDBdXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZVdpdGhNaW5pbXVtIGV4dGVuZHMgTW92ZVRvUmVsYXRpdmVMaW5lXG4gIEBleHRlbmQoZmFsc2UpXG4gIG1pbjogMFxuXG4gIGdldENvdW50OiAtPlxuICAgIE1hdGgubWF4KEBtaW4sIHN1cGVyKVxuXG4jIFBvc2l0aW9uIGN1cnNvciB3aXRob3V0IHNjcm9sbGluZy4sIEgsIE0sIExcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBrZXltYXA6IEhcbmNsYXNzIE1vdmVUb1RvcE9mU2NyZWVuIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGp1bXA6IHRydWVcbiAgc2Nyb2xsb2ZmOiAyXG4gIGRlZmF1bHRDb3VudDogMFxuXG4gIGdldENvdW50OiAtPlxuICAgIHN1cGVyIC0gMVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEBnZXRQb2ludCgpKVxuXG4gIGdldFBvaW50OiAtPlxuICAgIGdldEZpcnN0Q2hhcmFjdGVyQnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Sb3coQGVkaXRvciwgQGdldFJvdygpKVxuXG4gIGdldFNjcm9sbG9mZjogLT5cbiAgICBpZiBAaXNBc09wZXJhdG9yVGFyZ2V0KClcbiAgICAgIDBcbiAgICBlbHNlXG4gICAgICBAc2Nyb2xsb2ZmXG5cbiAgZ2V0Um93OiAtPlxuICAgIHJvdyA9IGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhAZWRpdG9yKVxuICAgIG9mZnNldCA9IEBnZXRTY3JvbGxvZmYoKVxuICAgIG9mZnNldCA9IDAgaWYgKHJvdyBpcyAwKVxuICAgIG9mZnNldCA9IE1hdGgubWF4KEBnZXRDb3VudCgpLCBvZmZzZXQpXG4gICAgcm93ICsgb2Zmc2V0XG5cbiMga2V5bWFwOiBNXG5jbGFzcyBNb3ZlVG9NaWRkbGVPZlNjcmVlbiBleHRlbmRzIE1vdmVUb1RvcE9mU2NyZWVuXG4gIEBleHRlbmQoKVxuICBnZXRSb3c6IC0+XG4gICAgc3RhcnRSb3cgPSBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coQGVkaXRvcilcbiAgICB2aW1MYXN0U2NyZWVuUm93ID0gQGdldFZpbUxhc3RTY3JlZW5Sb3coKVxuICAgIGVuZFJvdyA9IE1hdGgubWluKEBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwgdmltTGFzdFNjcmVlblJvdylcbiAgICBzdGFydFJvdyArIE1hdGguZmxvb3IoKGVuZFJvdyAtIHN0YXJ0Um93KSAvIDIpXG5cbiMga2V5bWFwOiBMXG5jbGFzcyBNb3ZlVG9Cb3R0b21PZlNjcmVlbiBleHRlbmRzIE1vdmVUb1RvcE9mU2NyZWVuXG4gIEBleHRlbmQoKVxuICBnZXRSb3c6IC0+XG4gICAgIyBbRklYTUVdXG4gICAgIyBBdCBsZWFzdCBBdG9tIHYxLjYuMCwgdGhlcmUgYXJlIHR3byBpbXBsZW1lbnRhdGlvbiBvZiBnZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgIyBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSBhbmQgZWRpdG9yRWxlbWVudC5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgIyBUaG9zZSB0d28gbWV0aG9kcyByZXR1cm4gZGlmZmVyZW50IHZhbHVlLCBlZGl0b3IncyBvbmUgaXMgY29ycmVudC5cbiAgICAjIFNvIEkgaW50ZW50aW9uYWxseSB1c2UgZWRpdG9yLmdldExhc3RTY3JlZW5Sb3cgaGVyZS5cbiAgICB2aW1MYXN0U2NyZWVuUm93ID0gQGdldFZpbUxhc3RTY3JlZW5Sb3coKVxuICAgIHJvdyA9IE1hdGgubWluKEBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwgdmltTGFzdFNjcmVlblJvdylcbiAgICBvZmZzZXQgPSBAZ2V0U2Nyb2xsb2ZmKCkgKyAxXG4gICAgb2Zmc2V0ID0gMCBpZiByb3cgaXMgdmltTGFzdFNjcmVlblJvd1xuICAgIG9mZnNldCA9IE1hdGgubWF4KEBnZXRDb3VudCgpLCBvZmZzZXQpXG4gICAgcm93IC0gb2Zmc2V0XG5cbiMgU2Nyb2xsaW5nXG4jIEhhbGY6IGN0cmwtZCwgY3RybC11XG4jIEZ1bGw6IGN0cmwtZiwgY3RybC1iXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgW0ZJWE1FXSBjb3VudCBiZWhhdmUgZGlmZmVyZW50bHkgZnJvbSBvcmlnaW5hbCBWaW0uXG5jbGFzcyBTY3JvbGxGdWxsU2NyZWVuRG93biBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgYW1vdW50T2ZQYWdlOiArMVxuXG4gIGlzU21vb3RoU2Nyb2xsRW5hYmxlZDogLT5cbiAgICBpZiBNYXRoLmFicyhAYW1vdW50T2ZQYWdlKSBpcyAxXG4gICAgICBzZXR0aW5ncy5nZXQoJ3Ntb290aFNjcm9sbE9uRnVsbFNjcm9sbE1vdGlvbicpXG4gICAgZWxzZVxuICAgICAgc2V0dGluZ3MuZ2V0KCdzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb24nKVxuXG4gIGdldFNtb290aFNjcm9sbER1YXRpb246IC0+XG4gICAgaWYgTWF0aC5hYnMoQGFtb3VudE9mUGFnZSkgaXMgMVxuICAgICAgc2V0dGluZ3MuZ2V0KCdzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb25EdXJhdGlvbicpXG4gICAgZWxzZVxuICAgICAgc2V0dGluZ3MuZ2V0KCdzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb25EdXJhdGlvbicpXG5cbiAgZ2V0UGl4ZWxSZWN0VG9wRm9yU2NlZW5Sb3c6IChyb3cpIC0+XG4gICAgcG9pbnQgPSBuZXcgUG9pbnQocm93LCAwKVxuICAgIEBlZGl0b3IuZWxlbWVudC5waXhlbFJlY3RGb3JTY3JlZW5SYW5nZShuZXcgUmFuZ2UocG9pbnQsIHBvaW50KSkudG9wXG5cbiAgc21vb3RoU2Nyb2xsOiAoZnJvbVJvdywgdG9Sb3csIG9wdGlvbnMpIC0+XG4gICAgdG9wUGl4ZWxGcm9tID0ge3RvcDogQGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KGZyb21Sb3cpfVxuICAgIHRvcFBpeGVsVG8gPSB7dG9wOiBAZ2V0UGl4ZWxSZWN0VG9wRm9yU2NlZW5Sb3codG9Sb3cpfVxuICAgIG9wdGlvbnMuc3RlcCA9IChuZXdUb3ApID0+IEBlZGl0b3IuZWxlbWVudC5zZXRTY3JvbGxUb3AobmV3VG9wKVxuICAgIG9wdGlvbnMuZHVyYXRpb24gPSBAZ2V0U21vb3RoU2Nyb2xsRHVhdGlvbigpXG4gICAgQHZpbVN0YXRlLnJlcXVlc3RTY3JvbGxBbmltYXRpb24odG9wUGl4ZWxGcm9tLCB0b3BQaXhlbFRvLCBvcHRpb25zKVxuXG4gIGhpZ2hsaWdodFNjcmVlblJvdzogKHNjcmVlblJvdykgLT5cbiAgICBzY3JlZW5SYW5nZSA9IG5ldyBSYW5nZShbc2NyZWVuUm93LCAwXSwgW3NjcmVlblJvdywgSW5maW5pdHldKVxuICAgIG1hcmtlciA9IEBlZGl0b3IubWFya1NjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoJylcbiAgICBtYXJrZXJcblxuICBnZXRBbW91bnRPZlJvd3M6IC0+XG4gICAgTWF0aC5jZWlsKEBhbW91bnRPZlBhZ2UgKiBAZWRpdG9yLmdldFJvd3NQZXJQYWdlKCkgKiBAZ2V0Q291bnQoKSlcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICByb3cgPSBnZXRWYWxpZFZpbVNjcmVlblJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCkgKyBAZ2V0QW1vdW50T2ZSb3dzKCkpXG4gICAgbmV3IFBvaW50KHJvdywgMClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvci5zZXRTY3JlZW5Qb3NpdGlvbihAZ2V0UG9pbnQoY3Vyc29yKSwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiAgICBpZiBjdXJzb3IuaXNMYXN0Q3Vyc29yKClcbiAgICAgIGlmIEBpc1Ntb290aFNjcm9sbEVuYWJsZWQoKVxuICAgICAgICBAdmltU3RhdGUuZmluaXNoU2Nyb2xsQW5pbWF0aW9uKClcblxuICAgICAgY3VycmVudFRvcFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAgIGZpbmFsVG9wUm93ID0gY3VycmVudFRvcFJvdyArIEBnZXRBbW91bnRPZlJvd3MoKVxuICAgICAgZG9uZSA9ID0+IEBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KGZpbmFsVG9wUm93KVxuXG4gICAgICBpZiBAaXNTbW9vdGhTY3JvbGxFbmFibGVkKClcbiAgICAgICAgbWFya2VyID0gQGhpZ2hsaWdodFNjcmVlblJvdyhjdXJzb3IuZ2V0U2NyZWVuUm93KCkpXG4gICAgICAgIGNvbXBsZXRlID0gLT4gbWFya2VyLmRlc3Ryb3koKVxuICAgICAgICBAc21vb3RoU2Nyb2xsKGN1cnJlbnRUb3BSb3csIGZpbmFsVG9wUm93LCB7ZG9uZSwgY29tcGxldGV9KVxuICAgICAgZWxzZVxuICAgICAgICBkb25lKClcblxuIyBrZXltYXA6IGN0cmwtYlxuY2xhc3MgU2Nyb2xsRnVsbFNjcmVlblVwIGV4dGVuZHMgU2Nyb2xsRnVsbFNjcmVlbkRvd25cbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogLTFcblxuIyBrZXltYXA6IGN0cmwtZFxuY2xhc3MgU2Nyb2xsSGFsZlNjcmVlbkRvd24gZXh0ZW5kcyBTY3JvbGxGdWxsU2NyZWVuRG93blxuICBAZXh0ZW5kKClcbiAgYW1vdW50T2ZQYWdlOiArMSAvIDJcblxuIyBrZXltYXA6IGN0cmwtdVxuY2xhc3MgU2Nyb2xsSGFsZlNjcmVlblVwIGV4dGVuZHMgU2Nyb2xsSGFsZlNjcmVlbkRvd25cbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogLTEgLyAyXG5cbiMgRmluZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogZlxuY2xhc3MgRmluZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmRzOiBmYWxzZVxuICBpbmNsdXNpdmU6IHRydWVcbiAgaG92ZXI6IGljb246ICc6ZmluZDonLCBlbW9qaTogJzptYWdfcmlnaHQ6J1xuICBvZmZzZXQ6IDBcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBmb2N1c0lucHV0KCkgdW5sZXNzIEBpc0NvbXBsZXRlKClcblxuICBpc0JhY2t3YXJkczogLT5cbiAgICBAYmFja3dhcmRzXG5cbiAgZ2V0UG9pbnQ6IChmcm9tUG9pbnQpIC0+XG4gICAge3N0YXJ0LCBlbmR9ID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhmcm9tUG9pbnQucm93KVxuXG4gICAgb2Zmc2V0ID0gaWYgQGlzQmFja3dhcmRzKCkgdGhlbiBAb2Zmc2V0IGVsc2UgLUBvZmZzZXRcbiAgICB1bk9mZnNldCA9IC1vZmZzZXQgKiBAaXNSZXBlYXRlZCgpXG4gICAgaWYgQGlzQmFja3dhcmRzKClcbiAgICAgIHNjYW5SYW5nZSA9IFtzdGFydCwgZnJvbVBvaW50LnRyYW5zbGF0ZShbMCwgdW5PZmZzZXRdKV1cbiAgICAgIG1ldGhvZCA9ICdiYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSdcbiAgICBlbHNlXG4gICAgICBzY2FuUmFuZ2UgPSBbZnJvbVBvaW50LnRyYW5zbGF0ZShbMCwgMSArIHVuT2Zmc2V0XSksIGVuZF1cbiAgICAgIG1ldGhvZCA9ICdzY2FuSW5CdWZmZXJSYW5nZSdcblxuICAgIHBvaW50cyA9IFtdXG4gICAgQGVkaXRvclttZXRob2RdIC8vLyN7Xy5lc2NhcGVSZWdFeHAoQGlucHV0KX0vLy9nLCBzY2FuUmFuZ2UsICh7cmFuZ2V9KSAtPlxuICAgICAgcG9pbnRzLnB1c2gocmFuZ2Uuc3RhcnQpXG4gICAgcG9pbnRzW0BnZXRDb3VudCgpXT8udHJhbnNsYXRlKFswLCBvZmZzZXRdKVxuXG4gIGdldENvdW50OiAtPlxuICAgIHN1cGVyIC0gMVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgQHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5KGN1cnNvciwgcG9pbnQpXG4gICAgQGdsb2JhbFN0YXRlLnNldCgnY3VycmVudEZpbmQnLCB0aGlzKSB1bmxlc3MgQGlzUmVwZWF0ZWQoKVxuXG4jIGtleW1hcDogRlxuY2xhc3MgRmluZEJhY2t3YXJkcyBleHRlbmRzIEZpbmRcbiAgQGV4dGVuZCgpXG4gIGluY2x1c2l2ZTogZmFsc2VcbiAgYmFja3dhcmRzOiB0cnVlXG4gIGhvdmVyOiBpY29uOiAnOmZpbmQ6JywgZW1vamk6ICc6bWFnOidcblxuIyBrZXltYXA6IHRcbmNsYXNzIFRpbGwgZXh0ZW5kcyBGaW5kXG4gIEBleHRlbmQoKVxuICBvZmZzZXQ6IDFcblxuICBnZXRQb2ludDogLT5cbiAgICBAcG9pbnQgPSBzdXBlclxuXG4gIHNlbGVjdEJ5TW90aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHN1cGVyXG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKSBhbmQgKEBwb2ludD8gYW5kIG5vdCBAYmFja3dhcmRzKVxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS50cmFuc2xhdGVTZWxlY3Rpb25FbmRBbmRDbGlwKCdmb3J3YXJkJylcblxuIyBrZXltYXA6IFRcbmNsYXNzIFRpbGxCYWNrd2FyZHMgZXh0ZW5kcyBUaWxsXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IGZhbHNlXG4gIGJhY2t3YXJkczogdHJ1ZVxuXG4jIE1hcmtcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBrZXltYXA6IGBcbmNsYXNzIE1vdmVUb01hcmsgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGp1bXA6IHRydWVcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGhvdmVyOiBpY29uOiBcIjptb3ZlLXRvLW1hcms6YFwiLCBlbW9qaTogXCI6cm91bmRfcHVzaHBpbjpgXCJcbiAgaW5wdXQ6IG51bGwgIyBzZXQgd2hlbiBpbnN0YXRudGlhdGVkIHZpYSB2aW1TdGF0ZTo6bW92ZVRvTWFyaygpXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBmb2N1c0lucHV0KCkgdW5sZXNzIEBpc0NvbXBsZXRlKClcblxuICBnZXRQb2ludDogLT5cbiAgICBAdmltU3RhdGUubWFyay5nZXQoQGdldElucHV0KCkpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBpZiBwb2ludCA9IEBnZXRQb2ludCgpXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICBjdXJzb3IuYXV0b3Njcm9sbChjZW50ZXI6IHRydWUpXG5cbiMga2V5bWFwOiAnXG5jbGFzcyBNb3ZlVG9NYXJrTGluZSBleHRlbmRzIE1vdmVUb01hcmtcbiAgQGV4dGVuZCgpXG4gIGhvdmVyOiBpY29uOiBcIjptb3ZlLXRvLW1hcms6J1wiLCBlbW9qaTogXCI6cm91bmRfcHVzaHBpbjonXCJcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFBvaW50OiAtPlxuICAgIGlmIHBvaW50ID0gc3VwZXJcbiAgICAgIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coQGVkaXRvciwgcG9pbnQucm93KVxuXG4jIEZvbGRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZvbGQgc3RhcnRcIlxuICB3aXNlOiAnY2hhcmFjdGVyd2lzZSdcbiAgd2hpY2g6ICdzdGFydCdcbiAgZGlyZWN0aW9uOiAncHJldidcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHJvd3MgPSBAZ2V0Rm9sZFJvd3MoQHdoaWNoKVxuICAgIEByb3dzLnJldmVyc2UoKSBpZiBAZGlyZWN0aW9uIGlzICdwcmV2J1xuXG4gIGdldEZvbGRSb3dzOiAod2hpY2gpIC0+XG4gICAgaW5kZXggPSBpZiB3aGljaCBpcyAnc3RhcnQnIHRoZW4gMCBlbHNlIDFcbiAgICByb3dzID0gZ2V0Q29kZUZvbGRSb3dSYW5nZXMoQGVkaXRvcikubWFwIChyb3dSYW5nZSkgLT5cbiAgICAgIHJvd1JhbmdlW2luZGV4XVxuICAgIF8uc29ydEJ5KF8udW5pcShyb3dzKSwgKHJvdykgLT4gcm93KVxuXG4gIGdldFNjYW5Sb3dzOiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvclJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgIGlzVmFsaWRSb3cgPSBzd2l0Y2ggQGRpcmVjdGlvblxuICAgICAgd2hlbiAncHJldicgdGhlbiAocm93KSAtPiByb3cgPCBjdXJzb3JSb3dcbiAgICAgIHdoZW4gJ25leHQnIHRoZW4gKHJvdykgLT4gcm93ID4gY3Vyc29yUm93XG4gICAgQHJvd3MuZmlsdGVyKGlzVmFsaWRSb3cpXG5cbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIEBnZXRTY2FuUm93cyhjdXJzb3IpWzBdXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgaWYgKHJvdyA9IEBkZXRlY3RSb3coY3Vyc29yKSk/XG4gICAgICAgIG1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3coY3Vyc29yLCByb3cpXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBmb2xkIHN0YXJ0XCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBzYW1lLWluZGVudGVkIGZvbGQgc3RhcnRcIlxuICBkZXRlY3RSb3c6IChjdXJzb3IpIC0+XG4gICAgYmFzZUluZGVudExldmVsID0gZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgIGZvciByb3cgaW4gQGdldFNjYW5Sb3dzKGN1cnNvcilcbiAgICAgIGlmIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdykgaXMgYmFzZUluZGVudExldmVsXG4gICAgICAgIHJldHVybiByb3dcbiAgICBudWxsXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZvbGQgZW5kXCJcbiAgd2hpY2g6ICdlbmQnXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkRW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGZvbGQgZW5kXCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZ1bmN0aW9uXCJcbiAgZGlyZWN0aW9uOiAncHJldidcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIF8uZGV0ZWN0IEBnZXRTY2FuUm93cyhjdXJzb3IpLCAocm93KSA9PlxuICAgICAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhAZWRpdG9yLCByb3cpXG5cbmNsYXNzIE1vdmVUb05leHRGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRnVuY3Rpb25cbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZnVuY3Rpb25cIlxuICBkaXJlY3Rpb246ICduZXh0J1xuXG4jIFNjb3BlIGJhc2VkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgc2NvcGU6ICcuJ1xuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlKEBlZGl0b3IsIGZyb21Qb2ludCwgQGRpcmVjdGlvbiwgQHNjb3BlKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIEBjb3VudFRpbWVzICh7c3RvcH0pID0+XG4gICAgICBpZiAobmV3UG9pbnQgPSBAZ2V0UG9pbnQocG9pbnQpKVxuICAgICAgICBwb2ludCA9IG5ld1BvaW50XG4gICAgICBlbHNlXG4gICAgICAgIHN0b3AoKVxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1N0cmluZyBleHRlbmRzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZVxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgc3RyaW5nKHNlYXJjaGVkIGJ5IGBzdHJpbmcuYmVnaW5gIHNjb3BlKVwiXG4gIGRpcmVjdGlvbjogJ2JhY2t3YXJkJ1xuICBzY29wZTogJ3N0cmluZy5iZWdpbidcblxuY2xhc3MgTW92ZVRvTmV4dFN0cmluZyBleHRlbmRzIE1vdmVUb1ByZXZpb3VzU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IHN0cmluZyhzZWFyY2hlZCBieSBgc3RyaW5nLmJlZ2luYCBzY29wZSlcIlxuICBkaXJlY3Rpb246ICdmb3J3YXJkJ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c051bWJlciBleHRlbmRzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZVxuICBAZXh0ZW5kKClcbiAgZGlyZWN0aW9uOiAnYmFja3dhcmQnXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIG51bWJlcihzZWFyY2hlZCBieSBgY29uc3RhbnQubnVtZXJpY2Agc2NvcGUpXCJcbiAgc2NvcGU6ICdjb25zdGFudC5udW1lcmljJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0TnVtYmVyIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNOdW1iZXJcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgbnVtYmVyKHNlYXJjaGVkIGJ5IGBjb25zdGFudC5udW1lcmljYCBzY29wZSlcIlxuICBkaXJlY3Rpb246ICdmb3J3YXJkJ1xuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMga2V5bWFwOiAlXG5jbGFzcyBNb3ZlVG9QYWlyIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IHRydWVcbiAganVtcDogdHJ1ZVxuICBtZW1iZXI6IFsnUGFyZW50aGVzaXMnLCAnQ3VybHlCcmFja2V0JywgJ1NxdWFyZUJyYWNrZXQnLCAnQW5nbGVCcmFja2V0J11cblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IpKVxuXG4gIGdldFBvaW50OiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjdXJzb3JSb3cgPSBjdXJzb3JQb3NpdGlvbi5yb3dcblxuICAgIGdldFBvaW50Rm9yVGFnID0gPT5cbiAgICAgIHAgPSBjdXJzb3JQb3NpdGlvblxuICAgICAgcGFpckluZm8gPSBAbmV3KFwiQVRhZ1wiKS5nZXRQYWlySW5mbyhwKVxuICAgICAgcmV0dXJuIG51bGwgdW5sZXNzIHBhaXJJbmZvP1xuICAgICAge29wZW5SYW5nZSwgY2xvc2VSYW5nZX0gPSBwYWlySW5mb1xuICAgICAgb3BlblJhbmdlID0gb3BlblJhbmdlLnRyYW5zbGF0ZShbMCwgKzFdLCBbMCwgLTFdKVxuICAgICAgY2xvc2VSYW5nZSA9IGNsb3NlUmFuZ2UudHJhbnNsYXRlKFswLCArMV0sIFswLCAtMV0pXG4gICAgICByZXR1cm4gY2xvc2VSYW5nZS5zdGFydCBpZiBvcGVuUmFuZ2UuY29udGFpbnNQb2ludChwKSBhbmQgKG5vdCBwLmlzRXF1YWwob3BlblJhbmdlLmVuZCkpXG4gICAgICByZXR1cm4gb3BlblJhbmdlLnN0YXJ0IGlmIGNsb3NlUmFuZ2UuY29udGFpbnNQb2ludChwKSBhbmQgKG5vdCBwLmlzRXF1YWwoY2xvc2VSYW5nZS5lbmQpKVxuXG4gICAgcG9pbnQgPSBnZXRQb2ludEZvclRhZygpXG4gICAgcmV0dXJuIHBvaW50IGlmIHBvaW50P1xuXG4gICAgcmFuZ2VzID0gQG5ldyhcIkFBbnlQYWlyXCIsIHthbGxvd0ZvcndhcmRpbmc6IHRydWUsIEBtZW1iZXJ9KS5nZXRSYW5nZXMoY3Vyc29yLnNlbGVjdGlvbilcbiAgICByYW5nZXMgPSByYW5nZXMuZmlsdGVyICh7c3RhcnQsIGVuZH0pIC0+XG4gICAgICBwID0gY3Vyc29yUG9zaXRpb25cbiAgICAgIChwLnJvdyBpcyBzdGFydC5yb3cpIGFuZCBzdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChwKSBvclxuICAgICAgICAocC5yb3cgaXMgZW5kLnJvdykgYW5kIGVuZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChwKVxuXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHJhbmdlcy5sZW5ndGhcbiAgICAjIENhbGxpbmcgY29udGFpbnNQb2ludCBleGNsdXNpdmUocGFzcyB0cnVlIGFzIDJuZCBhcmcpIG1ha2Ugb3BlbmluZyBwYWlyIHVuZGVyXG4gICAgIyBjdXJzb3IgaXMgZ3JvdXBlZCB0byBmb3J3YXJkaW5nUmFuZ2VzXG4gICAgW2VuY2xvc2luZ1JhbmdlcywgZm9yd2FyZGluZ1Jhbmdlc10gPSBfLnBhcnRpdGlvbiByYW5nZXMsIChyYW5nZSkgLT5cbiAgICAgIHJhbmdlLmNvbnRhaW5zUG9pbnQoY3Vyc29yUG9zaXRpb24sIHRydWUpXG4gICAgZW5jbG9zaW5nUmFuZ2UgPSBfLmxhc3Qoc29ydFJhbmdlcyhlbmNsb3NpbmdSYW5nZXMpKVxuICAgIGZvcndhcmRpbmdSYW5nZXMgPSBzb3J0UmFuZ2VzKGZvcndhcmRpbmdSYW5nZXMpXG5cbiAgICBpZiBlbmNsb3NpbmdSYW5nZVxuICAgICAgZm9yd2FyZGluZ1JhbmdlcyA9IGZvcndhcmRpbmdSYW5nZXMuZmlsdGVyIChyYW5nZSkgLT5cbiAgICAgICAgZW5jbG9zaW5nUmFuZ2UuY29udGFpbnNSYW5nZShyYW5nZSlcblxuICAgIGZvcndhcmRpbmdSYW5nZXNbMF0/LmVuZC50cmFuc2xhdGUoWzAsIC0xXSkgb3IgZW5jbG9zaW5nUmFuZ2U/LnN0YXJ0XG4iXX0=
