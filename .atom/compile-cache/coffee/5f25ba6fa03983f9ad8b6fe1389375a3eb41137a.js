(function() {
  var AllWhitespace, CurrentSelection, Motion, MotionError, MotionWithInput, MoveDown, MoveLeft, MoveRight, MoveToAbsoluteLine, MoveToBeginningOfLine, MoveToBottomOfScreen, MoveToEndOfWholeWord, MoveToEndOfWord, MoveToFirstCharacterOfLine, MoveToFirstCharacterOfLineAndDown, MoveToFirstCharacterOfLineDown, MoveToFirstCharacterOfLineUp, MoveToLastCharacterOfLine, MoveToLastNonblankCharacterOfLineAndDown, MoveToLine, MoveToMiddleOfScreen, MoveToNextParagraph, MoveToNextSentence, MoveToNextWholeWord, MoveToNextWord, MoveToPreviousParagraph, MoveToPreviousSentence, MoveToPreviousWholeWord, MoveToPreviousWord, MoveToRelativeLine, MoveToScreenLine, MoveToStartOfFile, MoveToTopOfScreen, MoveUp, Point, Range, ScrollFullDownKeepCursor, ScrollFullUpKeepCursor, ScrollHalfDownKeepCursor, ScrollHalfUpKeepCursor, ScrollKeepingCursor, WholeWordOrEmptyLineRegex, WholeWordRegex, _, ref, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  settings = require('../settings');

  WholeWordRegex = /\S+/;

  WholeWordOrEmptyLineRegex = /^\s*$|\S+/;

  AllWhitespace = /^\s$/;

  MotionError = (function() {
    function MotionError(message) {
      this.message = message;
      this.name = 'Motion Error';
    }

    return MotionError;

  })();

  Motion = (function() {
    Motion.prototype.operatesInclusively = false;

    Motion.prototype.operatesLinewise = false;

    function Motion(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
    }

    Motion.prototype.select = function(count, options) {
      var selection, value;
      value = (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getSelections();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          selection = ref1[i];
          if (this.isLinewise()) {
            this.moveSelectionLinewise(selection, count, options);
          } else if (this.vimState.mode === 'visual') {
            this.moveSelectionVisual(selection, count, options);
          } else if (this.operatesInclusively) {
            this.moveSelectionInclusively(selection, count, options);
          } else {
            this.moveSelection(selection, count, options);
          }
          results.push(!selection.isEmpty());
        }
        return results;
      }).call(this);
      this.editor.mergeCursors();
      this.editor.mergeIntersectingSelections();
      return value;
    };

    Motion.prototype.execute = function(count) {
      var cursor, i, len, ref1;
      ref1 = this.editor.getCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        this.moveCursor(cursor, count);
      }
      return this.editor.mergeCursors();
    };

    Motion.prototype.moveSelectionLinewise = function(selection, count, options) {
      return selection.modifySelection((function(_this) {
        return function() {
          var isEmpty, isReversed, newEndRow, newStartRow, oldEndRow, oldStartRow, ref1, ref2, wasEmpty, wasReversed;
          ref1 = selection.getBufferRowRange(), oldStartRow = ref1[0], oldEndRow = ref1[1];
          wasEmpty = selection.isEmpty();
          wasReversed = selection.isReversed();
          if (!(wasEmpty || wasReversed)) {
            selection.cursor.moveLeft();
          }
          _this.moveCursor(selection.cursor, count, options);
          isEmpty = selection.isEmpty();
          isReversed = selection.isReversed();
          if (!(isEmpty || isReversed)) {
            selection.cursor.moveRight();
          }
          ref2 = selection.getBufferRowRange(), newStartRow = ref2[0], newEndRow = ref2[1];
          if (isReversed && !wasReversed) {
            newEndRow = Math.max(newEndRow, oldStartRow);
          }
          if (wasReversed && !isReversed) {
            newStartRow = Math.min(newStartRow, oldEndRow);
          }
          return selection.setBufferRange([[newStartRow, 0], [newEndRow + 1, 0]], {
            autoscroll: false
          });
        };
      })(this));
    };

    Motion.prototype.moveSelectionInclusively = function(selection, count, options) {
      if (!selection.isEmpty()) {
        return this.moveSelectionVisual(selection, count, options);
      }
      return selection.modifySelection((function(_this) {
        return function() {
          var end, ref1, start;
          _this.moveCursor(selection.cursor, count, options);
          if (selection.isEmpty()) {
            return;
          }
          if (selection.isReversed()) {
            ref1 = selection.getBufferRange(), start = ref1.start, end = ref1.end;
            return selection.setBufferRange([start, [end.row, end.column + 1]]);
          } else {
            return selection.cursor.moveRight();
          }
        };
      })(this));
    };

    Motion.prototype.moveSelectionVisual = function(selection, count, options) {
      return selection.modifySelection((function(_this) {
        return function() {
          var isEmpty, isReversed, newEnd, newStart, oldEnd, oldStart, range, ref1, ref2, ref3, wasEmpty, wasReversed;
          range = selection.getBufferRange();
          ref1 = [range.start, range.end], oldStart = ref1[0], oldEnd = ref1[1];
          wasEmpty = selection.isEmpty();
          wasReversed = selection.isReversed();
          if (!(wasEmpty || wasReversed)) {
            selection.cursor.moveLeft();
          }
          _this.moveCursor(selection.cursor, count, options);
          isEmpty = selection.isEmpty();
          isReversed = selection.isReversed();
          if (!(isEmpty || isReversed)) {
            selection.cursor.moveRight();
          }
          range = selection.getBufferRange();
          ref2 = [range.start, range.end], newStart = ref2[0], newEnd = ref2[1];
          if ((isReversed || isEmpty) && !(wasReversed || wasEmpty)) {
            selection.setBufferRange([newStart, [newEnd.row, oldStart.column + 1]]);
          }
          if (wasReversed && !wasEmpty && !isReversed) {
            selection.setBufferRange([[oldEnd.row, oldEnd.column - 1], newEnd]);
          }
          range = selection.getBufferRange();
          ref3 = [range.start, range.end], newStart = ref3[0], newEnd = ref3[1];
          if (selection.isReversed() && newStart.row === newEnd.row && newStart.column + 1 === newEnd.column) {
            return selection.setBufferRange(range, {
              reversed: false
            });
          }
        };
      })(this));
    };

    Motion.prototype.moveSelection = function(selection, count, options) {
      return selection.modifySelection((function(_this) {
        return function() {
          return _this.moveCursor(selection.cursor, count, options);
        };
      })(this));
    };

    Motion.prototype.isComplete = function() {
      return true;
    };

    Motion.prototype.isRecordable = function() {
      return false;
    };

    Motion.prototype.isLinewise = function() {
      var ref1, ref2;
      if (((ref1 = this.vimState) != null ? ref1.mode : void 0) === 'visual') {
        return ((ref2 = this.vimState) != null ? ref2.submode : void 0) === 'linewise';
      } else {
        return this.operatesLinewise;
      }
    };

    return Motion;

  })();

  CurrentSelection = (function(superClass) {
    extend(CurrentSelection, superClass);

    function CurrentSelection(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
      CurrentSelection.__super__.constructor.call(this, this.editor, this.vimState);
      this.lastSelectionRange = this.editor.getSelectedBufferRange();
      this.wasLinewise = this.isLinewise();
    }

    CurrentSelection.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        return true;
      });
    };

    CurrentSelection.prototype.select = function(count) {
      if (count == null) {
        count = 1;
      }
      if (this.vimState.mode !== 'visual') {
        if (this.wasLinewise) {
          this.selectLines();
        } else {
          this.selectCharacters();
        }
      }
      return _.times(count, function() {
        return true;
      });
    };

    CurrentSelection.prototype.selectLines = function() {
      var cursor, i, lastSelectionExtent, len, ref1, selection;
      lastSelectionExtent = this.lastSelectionRange.getExtent();
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        cursor = selection.cursor.getBufferPosition();
        selection.setBufferRange([[cursor.row, 0], [cursor.row + lastSelectionExtent.row, 0]]);
      }
    };

    CurrentSelection.prototype.selectCharacters = function() {
      var i, lastSelectionExtent, len, newEnd, ref1, selection, start;
      lastSelectionExtent = this.lastSelectionRange.getExtent();
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        start = selection.getBufferRange().start;
        newEnd = start.traverse(lastSelectionExtent);
        selection.setBufferRange([start, newEnd]);
      }
    };

    return CurrentSelection;

  })(Motion);

  MotionWithInput = (function(superClass) {
    extend(MotionWithInput, superClass);

    function MotionWithInput(editor, vimState) {
      this.editor = editor;
      this.vimState = vimState;
      MotionWithInput.__super__.constructor.call(this, this.editor, this.vimState);
      this.complete = false;
    }

    MotionWithInput.prototype.isComplete = function() {
      return this.complete;
    };

    MotionWithInput.prototype.canComposeWith = function(operation) {
      return operation.characters != null;
    };

    MotionWithInput.prototype.compose = function(input) {
      if (!input.characters) {
        throw new MotionError('Must compose with an Input');
      }
      this.input = input;
      return this.complete = true;
    };

    return MotionWithInput;

  })(Motion);

  MoveLeft = (function(superClass) {
    extend(MoveLeft, superClass);

    function MoveLeft() {
      return MoveLeft.__super__.constructor.apply(this, arguments);
    }

    MoveLeft.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        if (!cursor.isAtBeginningOfLine() || settings.wrapLeftRightMotion()) {
          return cursor.moveLeft();
        }
      });
    };

    return MoveLeft;

  })(Motion);

  MoveRight = (function(superClass) {
    extend(MoveRight, superClass);

    function MoveRight() {
      return MoveRight.__super__.constructor.apply(this, arguments);
    }

    MoveRight.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, (function(_this) {
        return function() {
          var wrapToNextLine;
          wrapToNextLine = settings.wrapLeftRightMotion();
          if (_this.vimState.mode === 'operator-pending' && !cursor.isAtEndOfLine()) {
            wrapToNextLine = false;
          }
          if (!cursor.isAtEndOfLine()) {
            cursor.moveRight();
          }
          if (wrapToNextLine && cursor.isAtEndOfLine()) {
            return cursor.moveRight();
          }
        };
      })(this));
    };

    return MoveRight;

  })(Motion);

  MoveUp = (function(superClass) {
    extend(MoveUp, superClass);

    function MoveUp() {
      return MoveUp.__super__.constructor.apply(this, arguments);
    }

    MoveUp.prototype.operatesLinewise = true;

    MoveUp.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        if (cursor.getScreenRow() !== 0) {
          return cursor.moveUp();
        }
      });
    };

    return MoveUp;

  })(Motion);

  MoveDown = (function(superClass) {
    extend(MoveDown, superClass);

    function MoveDown() {
      return MoveDown.__super__.constructor.apply(this, arguments);
    }

    MoveDown.prototype.operatesLinewise = true;

    MoveDown.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, (function(_this) {
        return function() {
          if (cursor.getScreenRow() !== _this.editor.getLastScreenRow()) {
            return cursor.moveDown();
          }
        };
      })(this));
    };

    return MoveDown;

  })(Motion);

  MoveToPreviousWord = (function(superClass) {
    extend(MoveToPreviousWord, superClass);

    function MoveToPreviousWord() {
      return MoveToPreviousWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWord.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        return cursor.moveToBeginningOfWord();
      });
    };

    return MoveToPreviousWord;

  })(Motion);

  MoveToPreviousWholeWord = (function(superClass) {
    extend(MoveToPreviousWholeWord, superClass);

    function MoveToPreviousWholeWord() {
      return MoveToPreviousWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWholeWord.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, (function(_this) {
        return function() {
          var results;
          cursor.moveToBeginningOfWord();
          results = [];
          while (!_this.isWholeWord(cursor) && !_this.isBeginningOfFile(cursor)) {
            results.push(cursor.moveToBeginningOfWord());
          }
          return results;
        };
      })(this));
    };

    MoveToPreviousWholeWord.prototype.isWholeWord = function(cursor) {
      var char;
      char = cursor.getCurrentWordPrefix().slice(-1);
      return AllWhitespace.test(char);
    };

    MoveToPreviousWholeWord.prototype.isBeginningOfFile = function(cursor) {
      var cur;
      cur = cursor.getBufferPosition();
      return !cur.row && !cur.column;
    };

    return MoveToPreviousWholeWord;

  })(Motion);

  MoveToNextWord = (function(superClass) {
    extend(MoveToNextWord, superClass);

    function MoveToNextWord() {
      return MoveToNextWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWord.prototype.wordRegex = null;

    MoveToNextWord.prototype.moveCursor = function(cursor, count, options) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, (function(_this) {
        return function() {
          var current, next;
          current = cursor.getBufferPosition();
          next = (options != null ? options.excludeWhitespace : void 0) ? cursor.getEndOfCurrentWordBufferPosition({
            wordRegex: _this.wordRegex
          }) : cursor.getBeginningOfNextWordBufferPosition({
            wordRegex: _this.wordRegex
          });
          if (_this.isEndOfFile(cursor)) {
            return;
          }
          if (cursor.isAtEndOfLine()) {
            cursor.moveDown();
            cursor.moveToBeginningOfLine();
            return cursor.skipLeadingWhitespace();
          } else if (current.row === next.row && current.column === next.column) {
            return cursor.moveToEndOfWord();
          } else {
            return cursor.setBufferPosition(next);
          }
        };
      })(this));
    };

    MoveToNextWord.prototype.isEndOfFile = function(cursor) {
      var cur, eof;
      cur = cursor.getBufferPosition();
      eof = this.editor.getEofBufferPosition();
      return cur.row === eof.row && cur.column === eof.column;
    };

    return MoveToNextWord;

  })(Motion);

  MoveToNextWholeWord = (function(superClass) {
    extend(MoveToNextWholeWord, superClass);

    function MoveToNextWholeWord() {
      return MoveToNextWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWholeWord.prototype.wordRegex = WholeWordOrEmptyLineRegex;

    return MoveToNextWholeWord;

  })(MoveToNextWord);

  MoveToEndOfWord = (function(superClass) {
    extend(MoveToEndOfWord, superClass);

    function MoveToEndOfWord() {
      return MoveToEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWord.prototype.operatesInclusively = true;

    MoveToEndOfWord.prototype.wordRegex = null;

    MoveToEndOfWord.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, (function(_this) {
        return function() {
          var current, next;
          current = cursor.getBufferPosition();
          next = cursor.getEndOfCurrentWordBufferPosition({
            wordRegex: _this.wordRegex
          });
          if (next.column > 0) {
            next.column--;
          }
          if (next.isEqual(current)) {
            cursor.moveRight();
            if (cursor.isAtEndOfLine()) {
              cursor.moveDown();
              cursor.moveToBeginningOfLine();
            }
            next = cursor.getEndOfCurrentWordBufferPosition({
              wordRegex: _this.wordRegex
            });
            if (next.column > 0) {
              next.column--;
            }
          }
          return cursor.setBufferPosition(next);
        };
      })(this));
    };

    return MoveToEndOfWord;

  })(Motion);

  MoveToEndOfWholeWord = (function(superClass) {
    extend(MoveToEndOfWholeWord, superClass);

    function MoveToEndOfWholeWord() {
      return MoveToEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWholeWord.prototype.wordRegex = WholeWordRegex;

    return MoveToEndOfWholeWord;

  })(MoveToEndOfWord);

  MoveToNextSentence = (function(superClass) {
    extend(MoveToNextSentence, superClass);

    function MoveToNextSentence() {
      return MoveToNextSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentence.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        var eof, scanRange, start;
        start = cursor.getBufferPosition().translate(new Point(0, 1));
        eof = cursor.editor.getBuffer().getEndPosition();
        scanRange = [start, eof];
        return cursor.editor.scanInBufferRange(/(^$)|(([\.!?] )|^[A-Za-z0-9])/, scanRange, function(arg) {
          var adjustment, matchText, range, stop;
          matchText = arg.matchText, range = arg.range, stop = arg.stop;
          adjustment = new Point(0, 0);
          if (matchText.match(/[\.!?]/)) {
            adjustment = new Point(0, 2);
          }
          cursor.setBufferPosition(range.start.translate(adjustment));
          return stop();
        });
      });
    };

    return MoveToNextSentence;

  })(Motion);

  MoveToPreviousSentence = (function(superClass) {
    extend(MoveToPreviousSentence, superClass);

    function MoveToPreviousSentence() {
      return MoveToPreviousSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentence.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        var bof, end, scanRange;
        end = cursor.getBufferPosition().translate(new Point(0, -1));
        bof = cursor.editor.getBuffer().getFirstPosition();
        scanRange = [bof, end];
        return cursor.editor.backwardsScanInBufferRange(/(^$)|(([\.!?] )|^[A-Za-z0-9])/, scanRange, function(arg) {
          var adjustment, matchText, range, stop;
          matchText = arg.matchText, range = arg.range, stop = arg.stop;
          adjustment = new Point(0, 0);
          if (matchText.match(/[\.!?]/)) {
            adjustment = new Point(0, 2);
          }
          cursor.setBufferPosition(range.start.translate(adjustment));
          return stop();
        });
      });
    };

    return MoveToPreviousSentence;

  })(Motion);

  MoveToNextParagraph = (function(superClass) {
    extend(MoveToNextParagraph, superClass);

    function MoveToNextParagraph() {
      return MoveToNextParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToNextParagraph.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        return cursor.moveToBeginningOfNextParagraph();
      });
    };

    return MoveToNextParagraph;

  })(Motion);

  MoveToPreviousParagraph = (function(superClass) {
    extend(MoveToPreviousParagraph, superClass);

    function MoveToPreviousParagraph() {
      return MoveToPreviousParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousParagraph.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        return cursor.moveToBeginningOfPreviousParagraph();
      });
    };

    return MoveToPreviousParagraph;

  })(Motion);

  MoveToLine = (function(superClass) {
    extend(MoveToLine, superClass);

    function MoveToLine() {
      return MoveToLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLine.prototype.operatesLinewise = true;

    MoveToLine.prototype.getDestinationRow = function(count) {
      if (count != null) {
        return count - 1;
      } else {
        return this.editor.getLineCount() - 1;
      }
    };

    return MoveToLine;

  })(Motion);

  MoveToAbsoluteLine = (function(superClass) {
    extend(MoveToAbsoluteLine, superClass);

    function MoveToAbsoluteLine() {
      return MoveToAbsoluteLine.__super__.constructor.apply(this, arguments);
    }

    MoveToAbsoluteLine.prototype.moveCursor = function(cursor, count) {
      cursor.setBufferPosition([this.getDestinationRow(count), 2e308]);
      cursor.moveToFirstCharacterOfLine();
      if (cursor.getBufferColumn() === 0) {
        return cursor.moveToEndOfLine();
      }
    };

    return MoveToAbsoluteLine;

  })(MoveToLine);

  MoveToRelativeLine = (function(superClass) {
    extend(MoveToRelativeLine, superClass);

    function MoveToRelativeLine() {
      return MoveToRelativeLine.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLine.prototype.moveCursor = function(cursor, count) {
      var column, ref1, row;
      if (count == null) {
        count = 1;
      }
      ref1 = cursor.getBufferPosition(), row = ref1.row, column = ref1.column;
      return cursor.setBufferPosition([row + (count - 1), 0]);
    };

    return MoveToRelativeLine;

  })(MoveToLine);

  MoveToScreenLine = (function(superClass) {
    extend(MoveToScreenLine, superClass);

    function MoveToScreenLine(editorElement, vimState, scrolloff) {
      this.editorElement = editorElement;
      this.vimState = vimState;
      this.scrolloff = scrolloff;
      this.scrolloff = 2;
      MoveToScreenLine.__super__.constructor.call(this, this.editorElement.getModel(), this.vimState);
    }

    MoveToScreenLine.prototype.moveCursor = function(cursor, count) {
      var column, ref1, row;
      if (count == null) {
        count = 1;
      }
      ref1 = cursor.getBufferPosition(), row = ref1.row, column = ref1.column;
      return cursor.setScreenPosition([this.getDestinationRow(count), 0]);
    };

    return MoveToScreenLine;

  })(MoveToLine);

  MoveToBeginningOfLine = (function(superClass) {
    extend(MoveToBeginningOfLine, superClass);

    function MoveToBeginningOfLine() {
      return MoveToBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToBeginningOfLine.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        return cursor.moveToBeginningOfLine();
      });
    };

    return MoveToBeginningOfLine;

  })(Motion);

  MoveToFirstCharacterOfLine = (function(superClass) {
    extend(MoveToFirstCharacterOfLine, superClass);

    function MoveToFirstCharacterOfLine() {
      return MoveToFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLine.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        cursor.moveToBeginningOfLine();
        return cursor.moveToFirstCharacterOfLine();
      });
    };

    return MoveToFirstCharacterOfLine;

  })(Motion);

  MoveToFirstCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineAndDown, superClass);

    function MoveToFirstCharacterOfLineAndDown() {
      return MoveToFirstCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineAndDown.prototype.operatesLinewise = true;

    MoveToFirstCharacterOfLineAndDown.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      _.times(count - 1, function() {
        return cursor.moveDown();
      });
      cursor.moveToBeginningOfLine();
      return cursor.moveToFirstCharacterOfLine();
    };

    return MoveToFirstCharacterOfLineAndDown;

  })(Motion);

  MoveToLastCharacterOfLine = (function(superClass) {
    extend(MoveToLastCharacterOfLine, superClass);

    function MoveToLastCharacterOfLine() {
      return MoveToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastCharacterOfLine.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      return _.times(count, function() {
        cursor.moveToEndOfLine();
        return cursor.goalColumn = 2e308;
      });
    };

    return MoveToLastCharacterOfLine;

  })(Motion);

  MoveToLastNonblankCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToLastNonblankCharacterOfLineAndDown, superClass);

    function MoveToLastNonblankCharacterOfLineAndDown() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToLastNonblankCharacterOfLineAndDown.prototype.operatesInclusively = true;

    MoveToLastNonblankCharacterOfLineAndDown.prototype.skipTrailingWhitespace = function(cursor) {
      var position, scanRange, startOfTrailingWhitespace;
      position = cursor.getBufferPosition();
      scanRange = cursor.getCurrentLineBufferRange();
      startOfTrailingWhitespace = [scanRange.end.row, scanRange.end.column - 1];
      this.editor.scanInBufferRange(/[ \t]+$/, scanRange, function(arg) {
        var range;
        range = arg.range;
        startOfTrailingWhitespace = range.start;
        return startOfTrailingWhitespace.column -= 1;
      });
      return cursor.setBufferPosition(startOfTrailingWhitespace);
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      _.times(count - 1, function() {
        return cursor.moveDown();
      });
      return this.skipTrailingWhitespace(cursor);
    };

    return MoveToLastNonblankCharacterOfLineAndDown;

  })(Motion);

  MoveToFirstCharacterOfLineUp = (function(superClass) {
    extend(MoveToFirstCharacterOfLineUp, superClass);

    function MoveToFirstCharacterOfLineUp() {
      return MoveToFirstCharacterOfLineUp.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineUp.prototype.operatesLinewise = true;

    MoveToFirstCharacterOfLineUp.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      _.times(count, function() {
        return cursor.moveUp();
      });
      cursor.moveToBeginningOfLine();
      return cursor.moveToFirstCharacterOfLine();
    };

    return MoveToFirstCharacterOfLineUp;

  })(Motion);

  MoveToFirstCharacterOfLineDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineDown, superClass);

    function MoveToFirstCharacterOfLineDown() {
      return MoveToFirstCharacterOfLineDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineDown.prototype.operatesLinewise = true;

    MoveToFirstCharacterOfLineDown.prototype.moveCursor = function(cursor, count) {
      if (count == null) {
        count = 1;
      }
      _.times(count, function() {
        return cursor.moveDown();
      });
      cursor.moveToBeginningOfLine();
      return cursor.moveToFirstCharacterOfLine();
    };

    return MoveToFirstCharacterOfLineDown;

  })(Motion);

  MoveToStartOfFile = (function(superClass) {
    extend(MoveToStartOfFile, superClass);

    function MoveToStartOfFile() {
      return MoveToStartOfFile.__super__.constructor.apply(this, arguments);
    }

    MoveToStartOfFile.prototype.moveCursor = function(cursor, count) {
      var column, ref1, row;
      if (count == null) {
        count = 1;
      }
      ref1 = this.editor.getCursorBufferPosition(), row = ref1.row, column = ref1.column;
      cursor.setBufferPosition([this.getDestinationRow(count), 0]);
      if (!this.isLinewise()) {
        return cursor.moveToFirstCharacterOfLine();
      }
    };

    return MoveToStartOfFile;

  })(MoveToLine);

  MoveToTopOfScreen = (function(superClass) {
    extend(MoveToTopOfScreen, superClass);

    function MoveToTopOfScreen() {
      return MoveToTopOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToTopOfScreen.prototype.getDestinationRow = function(count) {
      var firstScreenRow, offset;
      if (count == null) {
        count = 0;
      }
      firstScreenRow = this.editorElement.getFirstVisibleScreenRow();
      if (firstScreenRow > 0) {
        offset = Math.max(count - 1, this.scrolloff);
      } else {
        offset = count > 0 ? count - 1 : count;
      }
      return firstScreenRow + offset;
    };

    return MoveToTopOfScreen;

  })(MoveToScreenLine);

  MoveToBottomOfScreen = (function(superClass) {
    extend(MoveToBottomOfScreen, superClass);

    function MoveToBottomOfScreen() {
      return MoveToBottomOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToBottomOfScreen.prototype.getDestinationRow = function(count) {
      var lastRow, lastScreenRow, offset;
      if (count == null) {
        count = 0;
      }
      lastScreenRow = this.editorElement.getLastVisibleScreenRow();
      lastRow = this.editor.getBuffer().getLastRow();
      if (lastScreenRow !== lastRow) {
        offset = Math.max(count - 1, this.scrolloff);
      } else {
        offset = count > 0 ? count - 1 : count;
      }
      return lastScreenRow - offset;
    };

    return MoveToBottomOfScreen;

  })(MoveToScreenLine);

  MoveToMiddleOfScreen = (function(superClass) {
    extend(MoveToMiddleOfScreen, superClass);

    function MoveToMiddleOfScreen() {
      return MoveToMiddleOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToMiddleOfScreen.prototype.getDestinationRow = function() {
      var firstScreenRow, height, lastScreenRow;
      firstScreenRow = this.editorElement.getFirstVisibleScreenRow();
      lastScreenRow = this.editorElement.getLastVisibleScreenRow();
      height = lastScreenRow - firstScreenRow;
      return Math.floor(firstScreenRow + (height / 2));
    };

    return MoveToMiddleOfScreen;

  })(MoveToScreenLine);

  ScrollKeepingCursor = (function(superClass) {
    extend(ScrollKeepingCursor, superClass);

    ScrollKeepingCursor.prototype.operatesLinewise = true;

    ScrollKeepingCursor.prototype.cursorRow = null;

    function ScrollKeepingCursor(editorElement, vimState) {
      this.editorElement = editorElement;
      this.vimState = vimState;
      ScrollKeepingCursor.__super__.constructor.call(this, this.editorElement.getModel(), this.vimState);
    }

    ScrollKeepingCursor.prototype.select = function(count, options) {
      var newTopRow, scrollTop;
      if (this.editor.setFirstVisibleScreenRow != null) {
        newTopRow = this.getNewFirstVisibleScreenRow(count);
        ScrollKeepingCursor.__super__.select.call(this, count, options);
        return this.editor.setFirstVisibleScreenRow(newTopRow);
      } else {
        scrollTop = this.getNewScrollTop(count);
        ScrollKeepingCursor.__super__.select.call(this, count, options);
        return this.editorElement.setScrollTop(scrollTop);
      }
    };

    ScrollKeepingCursor.prototype.execute = function(count) {
      var newTopRow, scrollTop;
      if (this.editor.setFirstVisibleScreenRow != null) {
        newTopRow = this.getNewFirstVisibleScreenRow(count);
        ScrollKeepingCursor.__super__.execute.call(this, count);
        return this.editor.setFirstVisibleScreenRow(newTopRow);
      } else {
        scrollTop = this.getNewScrollTop(count);
        ScrollKeepingCursor.__super__.execute.call(this, count);
        return this.editorElement.setScrollTop(scrollTop);
      }
    };

    ScrollKeepingCursor.prototype.moveCursor = function(cursor) {
      return cursor.setScreenPosition(Point(this.cursorRow, 0), {
        autoscroll: false
      });
    };

    ScrollKeepingCursor.prototype.getNewScrollTop = function(count) {
      var currentCursorRow, currentScrollTop, lineHeight, ref1, rowsPerPage, scrollRows;
      if (count == null) {
        count = 1;
      }
      currentScrollTop = (ref1 = this.editorElement.component.presenter.pendingScrollTop) != null ? ref1 : this.editorElement.getScrollTop();
      currentCursorRow = this.editor.getCursorScreenPosition().row;
      rowsPerPage = this.editor.getRowsPerPage();
      lineHeight = this.editor.getLineHeightInPixels();
      scrollRows = Math.floor(this.pageScrollFraction * rowsPerPage * count);
      this.cursorRow = currentCursorRow + scrollRows;
      return currentScrollTop + scrollRows * lineHeight;
    };

    ScrollKeepingCursor.prototype.getNewFirstVisibleScreenRow = function(count) {
      var currentCursorRow, currentTopRow, rowsPerPage, scrollRows;
      if (count == null) {
        count = 1;
      }
      currentTopRow = this.editor.getFirstVisibleScreenRow();
      currentCursorRow = this.editor.getCursorScreenPosition().row;
      rowsPerPage = this.editor.getRowsPerPage();
      scrollRows = Math.ceil(this.pageScrollFraction * rowsPerPage * count);
      this.cursorRow = currentCursorRow + scrollRows;
      return currentTopRow + scrollRows;
    };

    return ScrollKeepingCursor;

  })(Motion);

  ScrollHalfUpKeepCursor = (function(superClass) {
    extend(ScrollHalfUpKeepCursor, superClass);

    function ScrollHalfUpKeepCursor() {
      return ScrollHalfUpKeepCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfUpKeepCursor.prototype.pageScrollFraction = -1 / 2;

    return ScrollHalfUpKeepCursor;

  })(ScrollKeepingCursor);

  ScrollFullUpKeepCursor = (function(superClass) {
    extend(ScrollFullUpKeepCursor, superClass);

    function ScrollFullUpKeepCursor() {
      return ScrollFullUpKeepCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollFullUpKeepCursor.prototype.pageScrollFraction = -1;

    return ScrollFullUpKeepCursor;

  })(ScrollKeepingCursor);

  ScrollHalfDownKeepCursor = (function(superClass) {
    extend(ScrollHalfDownKeepCursor, superClass);

    function ScrollHalfDownKeepCursor() {
      return ScrollHalfDownKeepCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfDownKeepCursor.prototype.pageScrollFraction = 1 / 2;

    return ScrollHalfDownKeepCursor;

  })(ScrollKeepingCursor);

  ScrollFullDownKeepCursor = (function(superClass) {
    extend(ScrollFullDownKeepCursor, superClass);

    function ScrollFullDownKeepCursor() {
      return ScrollFullDownKeepCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollFullDownKeepCursor.prototype.pageScrollFraction = 1;

    return ScrollFullDownKeepCursor;

  })(ScrollKeepingCursor);

  module.exports = {
    Motion: Motion,
    MotionWithInput: MotionWithInput,
    CurrentSelection: CurrentSelection,
    MoveLeft: MoveLeft,
    MoveRight: MoveRight,
    MoveUp: MoveUp,
    MoveDown: MoveDown,
    MoveToPreviousWord: MoveToPreviousWord,
    MoveToPreviousWholeWord: MoveToPreviousWholeWord,
    MoveToNextWord: MoveToNextWord,
    MoveToNextWholeWord: MoveToNextWholeWord,
    MoveToEndOfWord: MoveToEndOfWord,
    MoveToNextSentence: MoveToNextSentence,
    MoveToPreviousSentence: MoveToPreviousSentence,
    MoveToNextParagraph: MoveToNextParagraph,
    MoveToPreviousParagraph: MoveToPreviousParagraph,
    MoveToAbsoluteLine: MoveToAbsoluteLine,
    MoveToRelativeLine: MoveToRelativeLine,
    MoveToBeginningOfLine: MoveToBeginningOfLine,
    MoveToFirstCharacterOfLineUp: MoveToFirstCharacterOfLineUp,
    MoveToFirstCharacterOfLineDown: MoveToFirstCharacterOfLineDown,
    MoveToFirstCharacterOfLine: MoveToFirstCharacterOfLine,
    MoveToFirstCharacterOfLineAndDown: MoveToFirstCharacterOfLineAndDown,
    MoveToLastCharacterOfLine: MoveToLastCharacterOfLine,
    MoveToLastNonblankCharacterOfLineAndDown: MoveToLastNonblankCharacterOfLineAndDown,
    MoveToStartOfFile: MoveToStartOfFile,
    MoveToTopOfScreen: MoveToTopOfScreen,
    MoveToBottomOfScreen: MoveToBottomOfScreen,
    MoveToMiddleOfScreen: MoveToMiddleOfScreen,
    MoveToEndOfWholeWord: MoveToEndOfWholeWord,
    MotionError: MotionError,
    ScrollHalfUpKeepCursor: ScrollHalfUpKeepCursor,
    ScrollFullUpKeepCursor: ScrollFullUpKeepCursor,
    ScrollHalfDownKeepCursor: ScrollHalfDownKeepCursor,
    ScrollFullDownKeepCursor: ScrollFullDownKeepCursor
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvbW90aW9ucy9nZW5lcmFsLW1vdGlvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxvM0JBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUVYLGNBQUEsR0FBaUI7O0VBQ2pCLHlCQUFBLEdBQTRCOztFQUM1QixhQUFBLEdBQWdCOztFQUVWO0lBQ1MscUJBQUMsT0FBRDtNQUFDLElBQUMsQ0FBQSxVQUFEO01BQ1osSUFBQyxDQUFBLElBQUQsR0FBUTtJQURHOzs7Ozs7RUFHVDtxQkFDSixtQkFBQSxHQUFxQjs7cUJBQ3JCLGdCQUFBLEdBQWtCOztJQUVMLGdCQUFDLE1BQUQsRUFBVSxRQUFWO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDtJQUFWOztxQkFFYixNQUFBLEdBQVEsU0FBQyxLQUFELEVBQVEsT0FBUjtBQUNOLFVBQUE7TUFBQSxLQUFBOztBQUFRO0FBQUE7YUFBQSxzQ0FBQTs7VUFDTixJQUFHLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBSDtZQUNFLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixTQUF2QixFQUFrQyxLQUFsQyxFQUF5QyxPQUF6QyxFQURGO1dBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixLQUFrQixRQUFyQjtZQUNILElBQUMsQ0FBQSxtQkFBRCxDQUFxQixTQUFyQixFQUFnQyxLQUFoQyxFQUF1QyxPQUF2QyxFQURHO1dBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxtQkFBSjtZQUNILElBQUMsQ0FBQSx3QkFBRCxDQUEwQixTQUExQixFQUFxQyxLQUFyQyxFQUE0QyxPQUE1QyxFQURHO1dBQUEsTUFBQTtZQUdILElBQUMsQ0FBQSxhQUFELENBQWUsU0FBZixFQUEwQixLQUExQixFQUFpQyxPQUFqQyxFQUhHOzt1QkFJTCxDQUFJLFNBQVMsQ0FBQyxPQUFWLENBQUE7QUFURTs7O01BV1IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUE7TUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLDJCQUFSLENBQUE7YUFDQTtJQWRNOztxQkFnQlIsT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUNQLFVBQUE7QUFBQTtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLEVBQW9CLEtBQXBCO0FBREY7YUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQTtJQUhPOztxQkFLVCxxQkFBQSxHQUF1QixTQUFDLFNBQUQsRUFBWSxLQUFaLEVBQW1CLE9BQW5CO2FBQ3JCLFNBQVMsQ0FBQyxlQUFWLENBQTBCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUN4QixjQUFBO1VBQUEsT0FBMkIsU0FBUyxDQUFDLGlCQUFWLENBQUEsQ0FBM0IsRUFBQyxxQkFBRCxFQUFjO1VBRWQsUUFBQSxHQUFXLFNBQVMsQ0FBQyxPQUFWLENBQUE7VUFDWCxXQUFBLEdBQWMsU0FBUyxDQUFDLFVBQVYsQ0FBQTtVQUNkLElBQUEsQ0FBQSxDQUFPLFFBQUEsSUFBWSxXQUFuQixDQUFBO1lBQ0UsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFqQixDQUFBLEVBREY7O1VBR0EsS0FBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsTUFBdEIsRUFBOEIsS0FBOUIsRUFBcUMsT0FBckM7VUFFQSxPQUFBLEdBQVUsU0FBUyxDQUFDLE9BQVYsQ0FBQTtVQUNWLFVBQUEsR0FBYSxTQUFTLENBQUMsVUFBVixDQUFBO1VBQ2IsSUFBQSxDQUFBLENBQU8sT0FBQSxJQUFXLFVBQWxCLENBQUE7WUFDRSxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQWpCLENBQUEsRUFERjs7VUFHQSxPQUEyQixTQUFTLENBQUMsaUJBQVYsQ0FBQSxDQUEzQixFQUFDLHFCQUFELEVBQWM7VUFFZCxJQUFHLFVBQUEsSUFBZSxDQUFJLFdBQXRCO1lBQ0UsU0FBQSxHQUFZLElBQUksQ0FBQyxHQUFMLENBQVMsU0FBVCxFQUFvQixXQUFwQixFQURkOztVQUVBLElBQUcsV0FBQSxJQUFnQixDQUFJLFVBQXZCO1lBQ0UsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUFMLENBQVMsV0FBVCxFQUFzQixTQUF0QixFQURoQjs7aUJBR0EsU0FBUyxDQUFDLGNBQVYsQ0FBeUIsQ0FBQyxDQUFDLFdBQUQsRUFBYyxDQUFkLENBQUQsRUFBbUIsQ0FBQyxTQUFBLEdBQVksQ0FBYixFQUFnQixDQUFoQixDQUFuQixDQUF6QixFQUFpRTtZQUFBLFVBQUEsRUFBWSxLQUFaO1dBQWpFO1FBdEJ3QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7SUFEcUI7O3FCQXlCdkIsd0JBQUEsR0FBMEIsU0FBQyxTQUFELEVBQVksS0FBWixFQUFtQixPQUFuQjtNQUN4QixJQUFBLENBQThELFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FBOUQ7QUFBQSxlQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixTQUFyQixFQUFnQyxLQUFoQyxFQUF1QyxPQUF2QyxFQUFQOzthQUVBLFNBQVMsQ0FBQyxlQUFWLENBQTBCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUN4QixjQUFBO1VBQUEsS0FBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsTUFBdEIsRUFBOEIsS0FBOUIsRUFBcUMsT0FBckM7VUFDQSxJQUFVLFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FBVjtBQUFBLG1CQUFBOztVQUVBLElBQUcsU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFIO1lBRUUsT0FBZSxTQUFTLENBQUMsY0FBVixDQUFBLENBQWYsRUFBQyxrQkFBRCxFQUFRO21CQUNSLFNBQVMsQ0FBQyxjQUFWLENBQXlCLENBQUMsS0FBRCxFQUFRLENBQUMsR0FBRyxDQUFDLEdBQUwsRUFBVSxHQUFHLENBQUMsTUFBSixHQUFhLENBQXZCLENBQVIsQ0FBekIsRUFIRjtXQUFBLE1BQUE7bUJBTUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFqQixDQUFBLEVBTkY7O1FBSndCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtJQUh3Qjs7cUJBZTFCLG1CQUFBLEdBQXFCLFNBQUMsU0FBRCxFQUFZLEtBQVosRUFBbUIsT0FBbkI7YUFDbkIsU0FBUyxDQUFDLGVBQVYsQ0FBMEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ3hCLGNBQUE7VUFBQSxLQUFBLEdBQVEsU0FBUyxDQUFDLGNBQVYsQ0FBQTtVQUNSLE9BQXFCLENBQUMsS0FBSyxDQUFDLEtBQVAsRUFBYyxLQUFLLENBQUMsR0FBcEIsQ0FBckIsRUFBQyxrQkFBRCxFQUFXO1VBSVgsUUFBQSxHQUFXLFNBQVMsQ0FBQyxPQUFWLENBQUE7VUFDWCxXQUFBLEdBQWMsU0FBUyxDQUFDLFVBQVYsQ0FBQTtVQUNkLElBQUEsQ0FBQSxDQUFPLFFBQUEsSUFBWSxXQUFuQixDQUFBO1lBQ0UsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFqQixDQUFBLEVBREY7O1VBR0EsS0FBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsTUFBdEIsRUFBOEIsS0FBOUIsRUFBcUMsT0FBckM7VUFHQSxPQUFBLEdBQVUsU0FBUyxDQUFDLE9BQVYsQ0FBQTtVQUNWLFVBQUEsR0FBYSxTQUFTLENBQUMsVUFBVixDQUFBO1VBQ2IsSUFBQSxDQUFBLENBQU8sT0FBQSxJQUFXLFVBQWxCLENBQUE7WUFDRSxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQWpCLENBQUEsRUFERjs7VUFHQSxLQUFBLEdBQVEsU0FBUyxDQUFDLGNBQVYsQ0FBQTtVQUNSLE9BQXFCLENBQUMsS0FBSyxDQUFDLEtBQVAsRUFBYyxLQUFLLENBQUMsR0FBcEIsQ0FBckIsRUFBQyxrQkFBRCxFQUFXO1VBSVgsSUFBRyxDQUFDLFVBQUEsSUFBYyxPQUFmLENBQUEsSUFBNEIsQ0FBSSxDQUFDLFdBQUEsSUFBZSxRQUFoQixDQUFuQztZQUNFLFNBQVMsQ0FBQyxjQUFWLENBQXlCLENBQUMsUUFBRCxFQUFXLENBQUMsTUFBTSxDQUFDLEdBQVIsRUFBYSxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUEvQixDQUFYLENBQXpCLEVBREY7O1VBS0EsSUFBRyxXQUFBLElBQWdCLENBQUksUUFBcEIsSUFBaUMsQ0FBSSxVQUF4QztZQUNFLFNBQVMsQ0FBQyxjQUFWLENBQXlCLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBUixFQUFhLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLENBQTdCLENBQUQsRUFBa0MsTUFBbEMsQ0FBekIsRUFERjs7VUFJQSxLQUFBLEdBQVEsU0FBUyxDQUFDLGNBQVYsQ0FBQTtVQUNSLE9BQXFCLENBQUMsS0FBSyxDQUFDLEtBQVAsRUFBYyxLQUFLLENBQUMsR0FBcEIsQ0FBckIsRUFBQyxrQkFBRCxFQUFXO1VBQ1gsSUFBRyxTQUFTLENBQUMsVUFBVixDQUFBLENBQUEsSUFBMkIsUUFBUSxDQUFDLEdBQVQsS0FBZ0IsTUFBTSxDQUFDLEdBQWxELElBQTBELFFBQVEsQ0FBQyxNQUFULEdBQWtCLENBQWxCLEtBQXVCLE1BQU0sQ0FBQyxNQUEzRjttQkFDRSxTQUFTLENBQUMsY0FBVixDQUF5QixLQUF6QixFQUFnQztjQUFBLFFBQUEsRUFBVSxLQUFWO2FBQWhDLEVBREY7O1FBbkN3QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7SUFEbUI7O3FCQXVDckIsYUFBQSxHQUFlLFNBQUMsU0FBRCxFQUFZLEtBQVosRUFBbUIsT0FBbkI7YUFDYixTQUFTLENBQUMsZUFBVixDQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsTUFBdEIsRUFBOEIsS0FBOUIsRUFBcUMsT0FBckM7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7SUFEYTs7cUJBR2YsVUFBQSxHQUFZLFNBQUE7YUFBRztJQUFIOztxQkFFWixZQUFBLEdBQWMsU0FBQTthQUFHO0lBQUg7O3FCQUVkLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLDBDQUFZLENBQUUsY0FBWCxLQUFtQixRQUF0QjtxREFDVyxDQUFFLGlCQUFYLEtBQXNCLFdBRHhCO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxpQkFISDs7SUFEVTs7Ozs7O0VBTVI7OztJQUNTLDBCQUFDLE1BQUQsRUFBVSxRQUFWO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDtNQUNyQixrREFBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxRQUFoQjtNQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixJQUFDLENBQUEsTUFBTSxDQUFDLHNCQUFSLENBQUE7TUFDdEIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsVUFBRCxDQUFBO0lBSEo7OytCQUtiLE9BQUEsR0FBUyxTQUFDLEtBQUQ7O1FBQUMsUUFBTTs7YUFDZCxDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO2VBQUc7TUFBSCxDQUFmO0lBRE87OytCQUdULE1BQUEsR0FBUSxTQUFDLEtBQUQ7O1FBQUMsUUFBTTs7TUFHYixJQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixLQUFrQixRQUF6QjtRQUNFLElBQUcsSUFBQyxDQUFBLFdBQUo7VUFDRSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBREY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLGdCQUFELENBQUEsRUFIRjtTQURGOzthQU1BLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLFNBQUE7ZUFBRztNQUFILENBQWY7SUFUTTs7K0JBV1IsV0FBQSxHQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsbUJBQUEsR0FBc0IsSUFBQyxDQUFBLGtCQUFrQixDQUFDLFNBQXBCLENBQUE7QUFDdEI7QUFBQSxXQUFBLHNDQUFBOztRQUNFLE1BQUEsR0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFqQixDQUFBO1FBQ1QsU0FBUyxDQUFDLGNBQVYsQ0FBeUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFSLEVBQWEsQ0FBYixDQUFELEVBQWtCLENBQUMsTUFBTSxDQUFDLEdBQVAsR0FBYSxtQkFBbUIsQ0FBQyxHQUFsQyxFQUF1QyxDQUF2QyxDQUFsQixDQUF6QjtBQUZGO0lBRlc7OytCQU9iLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLG1CQUFBLEdBQXNCLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxTQUFwQixDQUFBO0FBQ3RCO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRyxRQUFTLFNBQVMsQ0FBQyxjQUFWLENBQUE7UUFDVixNQUFBLEdBQVMsS0FBSyxDQUFDLFFBQU4sQ0FBZSxtQkFBZjtRQUNULFNBQVMsQ0FBQyxjQUFWLENBQXlCLENBQUMsS0FBRCxFQUFRLE1BQVIsQ0FBekI7QUFIRjtJQUZnQjs7OztLQTNCVzs7RUFvQ3pCOzs7SUFDUyx5QkFBQyxNQUFELEVBQVUsUUFBVjtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQVMsSUFBQyxDQUFBLFdBQUQ7TUFDckIsaURBQU0sSUFBQyxDQUFBLE1BQVAsRUFBZSxJQUFDLENBQUEsUUFBaEI7TUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO0lBRkQ7OzhCQUliLFVBQUEsR0FBWSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzhCQUVaLGNBQUEsR0FBZ0IsU0FBQyxTQUFEO0FBQWUsYUFBTztJQUF0Qjs7OEJBRWhCLE9BQUEsR0FBUyxTQUFDLEtBQUQ7TUFDUCxJQUFHLENBQUksS0FBSyxDQUFDLFVBQWI7QUFDRSxjQUFVLElBQUEsV0FBQSxDQUFZLDRCQUFaLEVBRFo7O01BRUEsSUFBQyxDQUFBLEtBQUQsR0FBUzthQUNULElBQUMsQ0FBQSxRQUFELEdBQVk7SUFKTDs7OztLQVRtQjs7RUFleEI7Ozs7Ozs7dUJBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtRQUNiLElBQXFCLENBQUksTUFBTSxDQUFDLG1CQUFQLENBQUEsQ0FBSixJQUFvQyxRQUFRLENBQUMsbUJBQVQsQ0FBQSxDQUF6RDtpQkFBQSxNQUFNLENBQUMsUUFBUCxDQUFBLEVBQUE7O01BRGEsQ0FBZjtJQURVOzs7O0tBRFM7O0VBS2pCOzs7Ozs7O3dCQUNKLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUOztRQUFTLFFBQU07O2FBQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNiLGNBQUE7VUFBQSxjQUFBLEdBQWlCLFFBQVEsQ0FBQyxtQkFBVCxDQUFBO1VBSWpCLElBQTBCLEtBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixLQUFrQixrQkFBbEIsSUFBeUMsQ0FBSSxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXZFO1lBQUEsY0FBQSxHQUFpQixNQUFqQjs7VUFFQSxJQUFBLENBQTBCLE1BQU0sQ0FBQyxhQUFQLENBQUEsQ0FBMUI7WUFBQSxNQUFNLENBQUMsU0FBUCxDQUFBLEVBQUE7O1VBQ0EsSUFBc0IsY0FBQSxJQUFtQixNQUFNLENBQUMsYUFBUCxDQUFBLENBQXpDO21CQUFBLE1BQU0sQ0FBQyxTQUFQLENBQUEsRUFBQTs7UUFSYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtJQURVOzs7O0tBRFU7O0VBWWxCOzs7Ozs7O3FCQUNKLGdCQUFBLEdBQWtCOztxQkFFbEIsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtRQUNiLElBQU8sTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFBLEtBQXlCLENBQWhDO2lCQUNFLE1BQU0sQ0FBQyxNQUFQLENBQUEsRUFERjs7TUFEYSxDQUFmO0lBRFU7Ozs7S0FITzs7RUFRZjs7Ozs7Ozt1QkFDSixnQkFBQSxHQUFrQjs7dUJBRWxCLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUOztRQUFTLFFBQU07O2FBQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNiLElBQU8sTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFBLEtBQXlCLEtBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUFoQzttQkFDRSxNQUFNLENBQUMsUUFBUCxDQUFBLEVBREY7O1FBRGE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7SUFEVTs7OztLQUhTOztFQVFqQjs7Ozs7OztpQ0FDSixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOzthQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO2VBQ2IsTUFBTSxDQUFDLHFCQUFQLENBQUE7TUFEYSxDQUFmO0lBRFU7Ozs7S0FEbUI7O0VBSzNCOzs7Ozs7O3NDQUNKLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUOztRQUFTLFFBQU07O2FBQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNiLGNBQUE7VUFBQSxNQUFNLENBQUMscUJBQVAsQ0FBQTtBQUNBO2lCQUFNLENBQUksS0FBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBQUosSUFBNkIsQ0FBSSxLQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkIsQ0FBdkM7eUJBQ0UsTUFBTSxDQUFDLHFCQUFQLENBQUE7VUFERixDQUFBOztRQUZhO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO0lBRFU7O3NDQU1aLFdBQUEsR0FBYSxTQUFDLE1BQUQ7QUFDWCxVQUFBO01BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUFBLENBQTZCLENBQUMsS0FBOUIsQ0FBb0MsQ0FBQyxDQUFyQzthQUNQLGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQW5CO0lBRlc7O3NDQUliLGlCQUFBLEdBQW1CLFNBQUMsTUFBRDtBQUNqQixVQUFBO01BQUEsR0FBQSxHQUFNLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO2FBQ04sQ0FBSSxHQUFHLENBQUMsR0FBUixJQUFnQixDQUFJLEdBQUcsQ0FBQztJQUZQOzs7O0tBWGlCOztFQWVoQzs7Ozs7Ozs2QkFDSixTQUFBLEdBQVc7OzZCQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFULEVBQWtCLE9BQWxCOztRQUFTLFFBQU07O2FBQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNiLGNBQUE7VUFBQSxPQUFBLEdBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUE7VUFFVixJQUFBLHNCQUFVLE9BQU8sQ0FBRSwyQkFBWixHQUNMLE1BQU0sQ0FBQyxpQ0FBUCxDQUF5QztZQUFBLFNBQUEsRUFBVyxLQUFDLENBQUEsU0FBWjtXQUF6QyxDQURLLEdBR0wsTUFBTSxDQUFDLG9DQUFQLENBQTRDO1lBQUEsU0FBQSxFQUFXLEtBQUMsQ0FBQSxTQUFaO1dBQTVDO1VBRUYsSUFBVSxLQUFDLENBQUEsV0FBRCxDQUFhLE1BQWIsQ0FBVjtBQUFBLG1CQUFBOztVQUVBLElBQUcsTUFBTSxDQUFDLGFBQVAsQ0FBQSxDQUFIO1lBQ0UsTUFBTSxDQUFDLFFBQVAsQ0FBQTtZQUNBLE1BQU0sQ0FBQyxxQkFBUCxDQUFBO21CQUNBLE1BQU0sQ0FBQyxxQkFBUCxDQUFBLEVBSEY7V0FBQSxNQUlLLElBQUcsT0FBTyxDQUFDLEdBQVIsS0FBZSxJQUFJLENBQUMsR0FBcEIsSUFBNEIsT0FBTyxDQUFDLE1BQVIsS0FBa0IsSUFBSSxDQUFDLE1BQXREO21CQUNILE1BQU0sQ0FBQyxlQUFQLENBQUEsRUFERztXQUFBLE1BQUE7bUJBR0gsTUFBTSxDQUFDLGlCQUFQLENBQXlCLElBQXpCLEVBSEc7O1FBZFE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7SUFEVTs7NkJBb0JaLFdBQUEsR0FBYSxTQUFDLE1BQUQ7QUFDWCxVQUFBO01BQUEsR0FBQSxHQUFNLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO01BQ04sR0FBQSxHQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBQTthQUNOLEdBQUcsQ0FBQyxHQUFKLEtBQVcsR0FBRyxDQUFDLEdBQWYsSUFBdUIsR0FBRyxDQUFDLE1BQUosS0FBYyxHQUFHLENBQUM7SUFIOUI7Ozs7S0F2QmM7O0VBNEJ2Qjs7Ozs7OztrQ0FDSixTQUFBLEdBQVc7Ozs7S0FEcUI7O0VBRzVCOzs7Ozs7OzhCQUNKLG1CQUFBLEdBQXFCOzs4QkFDckIsU0FBQSxHQUFXOzs4QkFFWCxVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOzthQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDYixjQUFBO1VBQUEsT0FBQSxHQUFVLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO1VBRVYsSUFBQSxHQUFPLE1BQU0sQ0FBQyxpQ0FBUCxDQUF5QztZQUFBLFNBQUEsRUFBVyxLQUFDLENBQUEsU0FBWjtXQUF6QztVQUNQLElBQWlCLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBL0I7WUFBQSxJQUFJLENBQUMsTUFBTCxHQUFBOztVQUVBLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFiLENBQUg7WUFDRSxNQUFNLENBQUMsU0FBUCxDQUFBO1lBQ0EsSUFBRyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQUg7Y0FDRSxNQUFNLENBQUMsUUFBUCxDQUFBO2NBQ0EsTUFBTSxDQUFDLHFCQUFQLENBQUEsRUFGRjs7WUFJQSxJQUFBLEdBQU8sTUFBTSxDQUFDLGlDQUFQLENBQXlDO2NBQUEsU0FBQSxFQUFXLEtBQUMsQ0FBQSxTQUFaO2FBQXpDO1lBQ1AsSUFBaUIsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUEvQjtjQUFBLElBQUksQ0FBQyxNQUFMLEdBQUE7YUFQRjs7aUJBU0EsTUFBTSxDQUFDLGlCQUFQLENBQXlCLElBQXpCO1FBZmE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7SUFEVTs7OztLQUpnQjs7RUFzQnhCOzs7Ozs7O21DQUNKLFNBQUEsR0FBVzs7OztLQURzQjs7RUFHN0I7Ozs7Ozs7aUNBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtBQUNiLFlBQUE7UUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBMEIsQ0FBQyxTQUEzQixDQUF5QyxJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxDQUF6QztRQUNSLEdBQUEsR0FBTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWQsQ0FBQSxDQUF5QixDQUFDLGNBQTFCLENBQUE7UUFDTixTQUFBLEdBQVksQ0FBQyxLQUFELEVBQVEsR0FBUjtlQUVaLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWQsQ0FBZ0MsK0JBQWhDLEVBQWlFLFNBQWpFLEVBQTRFLFNBQUMsR0FBRDtBQUMxRSxjQUFBO1VBRDRFLDJCQUFXLG1CQUFPO1VBQzlGLFVBQUEsR0FBaUIsSUFBQSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQVQ7VUFDakIsSUFBRyxTQUFTLENBQUMsS0FBVixDQUFnQixRQUFoQixDQUFIO1lBQ0UsVUFBQSxHQUFpQixJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxFQURuQjs7VUFHQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFaLENBQXNCLFVBQXRCLENBQXpCO2lCQUNBLElBQUEsQ0FBQTtRQU4wRSxDQUE1RTtNQUxhLENBQWY7SUFEVTs7OztLQURtQjs7RUFlM0I7Ozs7Ozs7cUNBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtBQUNiLFlBQUE7UUFBQSxHQUFBLEdBQU0sTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBMEIsQ0FBQyxTQUEzQixDQUF5QyxJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBQyxDQUFWLENBQXpDO1FBQ04sR0FBQSxHQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBZCxDQUFBLENBQXlCLENBQUMsZ0JBQTFCLENBQUE7UUFDTixTQUFBLEdBQVksQ0FBQyxHQUFELEVBQU0sR0FBTjtlQUVaLE1BQU0sQ0FBQyxNQUFNLENBQUMsMEJBQWQsQ0FBeUMsK0JBQXpDLEVBQTBFLFNBQTFFLEVBQXFGLFNBQUMsR0FBRDtBQUNuRixjQUFBO1VBRHFGLDJCQUFXLG1CQUFPO1VBQ3ZHLFVBQUEsR0FBaUIsSUFBQSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQVQ7VUFDakIsSUFBRyxTQUFTLENBQUMsS0FBVixDQUFnQixRQUFoQixDQUFIO1lBQ0UsVUFBQSxHQUFpQixJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxFQURuQjs7VUFHQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFaLENBQXNCLFVBQXRCLENBQXpCO2lCQUNBLElBQUEsQ0FBQTtRQU5tRixDQUFyRjtNQUxhLENBQWY7SUFEVTs7OztLQUR1Qjs7RUFlL0I7Ozs7Ozs7a0NBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtlQUNiLE1BQU0sQ0FBQyw4QkFBUCxDQUFBO01BRGEsQ0FBZjtJQURVOzs7O0tBRG9COztFQUs1Qjs7Ozs7OztzQ0FDSixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOzthQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO2VBQ2IsTUFBTSxDQUFDLGtDQUFQLENBQUE7TUFEYSxDQUFmO0lBRFU7Ozs7S0FEd0I7O0VBS2hDOzs7Ozs7O3lCQUNKLGdCQUFBLEdBQWtCOzt5QkFFbEIsaUJBQUEsR0FBbUIsU0FBQyxLQUFEO01BQ2pCLElBQUcsYUFBSDtlQUFlLEtBQUEsR0FBUSxFQUF2QjtPQUFBLE1BQUE7ZUFBK0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUEsQ0FBQSxHQUF5QixFQUF4RDs7SUFEaUI7Ozs7S0FISTs7RUFNbkI7Ozs7Ozs7aUNBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7TUFDVixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsQ0FBQyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsS0FBbkIsQ0FBRCxFQUE0QixLQUE1QixDQUF6QjtNQUNBLE1BQU0sQ0FBQywwQkFBUCxDQUFBO01BQ0EsSUFBNEIsTUFBTSxDQUFDLGVBQVAsQ0FBQSxDQUFBLEtBQTRCLENBQXhEO2VBQUEsTUFBTSxDQUFDLGVBQVAsQ0FBQSxFQUFBOztJQUhVOzs7O0tBRG1COztFQU0zQjs7Ozs7OztpQ0FDSixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNWLFVBQUE7O1FBRG1CLFFBQU07O01BQ3pCLE9BQWdCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQWhCLEVBQUMsY0FBRCxFQUFNO2FBQ04sTUFBTSxDQUFDLGlCQUFQLENBQXlCLENBQUMsR0FBQSxHQUFNLENBQUMsS0FBQSxHQUFRLENBQVQsQ0FBUCxFQUFvQixDQUFwQixDQUF6QjtJQUZVOzs7O0tBRG1COztFQUszQjs7O0lBQ1MsMEJBQUMsYUFBRCxFQUFpQixRQUFqQixFQUE0QixTQUE1QjtNQUFDLElBQUMsQ0FBQSxnQkFBRDtNQUFnQixJQUFDLENBQUEsV0FBRDtNQUFXLElBQUMsQ0FBQSxZQUFEO01BQ3ZDLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixrREFBTSxJQUFDLENBQUEsYUFBYSxDQUFDLFFBQWYsQ0FBQSxDQUFOLEVBQWlDLElBQUMsQ0FBQSxRQUFsQztJQUZXOzsrQkFJYixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNWLFVBQUE7O1FBRG1CLFFBQU07O01BQ3pCLE9BQWdCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQWhCLEVBQUMsY0FBRCxFQUFNO2FBQ04sTUFBTSxDQUFDLGlCQUFQLENBQXlCLENBQUMsSUFBQyxDQUFBLGlCQUFELENBQW1CLEtBQW5CLENBQUQsRUFBNEIsQ0FBNUIsQ0FBekI7SUFGVTs7OztLQUxpQjs7RUFTekI7Ozs7Ozs7b0NBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7YUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtlQUNiLE1BQU0sQ0FBQyxxQkFBUCxDQUFBO01BRGEsQ0FBZjtJQURVOzs7O0tBRHNCOztFQUs5Qjs7Ozs7Ozt5Q0FDSixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOzthQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO1FBQ2IsTUFBTSxDQUFDLHFCQUFQLENBQUE7ZUFDQSxNQUFNLENBQUMsMEJBQVAsQ0FBQTtNQUZhLENBQWY7SUFEVTs7OztLQUQyQjs7RUFNbkM7Ozs7Ozs7Z0RBQ0osZ0JBQUEsR0FBa0I7O2dEQUVsQixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOztNQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQUEsR0FBTSxDQUFkLEVBQWlCLFNBQUE7ZUFDZixNQUFNLENBQUMsUUFBUCxDQUFBO01BRGUsQ0FBakI7TUFFQSxNQUFNLENBQUMscUJBQVAsQ0FBQTthQUNBLE1BQU0sQ0FBQywwQkFBUCxDQUFBO0lBSlU7Ozs7S0FIa0M7O0VBUzFDOzs7Ozs7O3dDQUNKLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUOztRQUFTLFFBQU07O2FBQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBUixFQUFlLFNBQUE7UUFDYixNQUFNLENBQUMsZUFBUCxDQUFBO2VBQ0EsTUFBTSxDQUFDLFVBQVAsR0FBb0I7TUFGUCxDQUFmO0lBRFU7Ozs7S0FEMEI7O0VBTWxDOzs7Ozs7O3VEQUNKLG1CQUFBLEdBQXFCOzt1REFJckIsc0JBQUEsR0FBd0IsU0FBQyxNQUFEO0FBQ3RCLFVBQUE7TUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDLGlCQUFQLENBQUE7TUFDWCxTQUFBLEdBQVksTUFBTSxDQUFDLHlCQUFQLENBQUE7TUFDWix5QkFBQSxHQUE0QixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBZixFQUFvQixTQUFTLENBQUMsR0FBRyxDQUFDLE1BQWQsR0FBdUIsQ0FBM0M7TUFDNUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixTQUExQixFQUFxQyxTQUFyQyxFQUFnRCxTQUFDLEdBQUQ7QUFDOUMsWUFBQTtRQURnRCxRQUFEO1FBQy9DLHlCQUFBLEdBQTRCLEtBQUssQ0FBQztlQUNsQyx5QkFBeUIsQ0FBQyxNQUExQixJQUFvQztNQUZVLENBQWhEO2FBR0EsTUFBTSxDQUFDLGlCQUFQLENBQXlCLHlCQUF6QjtJQVBzQjs7dURBU3hCLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBUyxLQUFUOztRQUFTLFFBQU07O01BQ3pCLENBQUMsQ0FBQyxLQUFGLENBQVEsS0FBQSxHQUFNLENBQWQsRUFBaUIsU0FBQTtlQUNmLE1BQU0sQ0FBQyxRQUFQLENBQUE7TUFEZSxDQUFqQjthQUVBLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixNQUF4QjtJQUhVOzs7O0tBZHlDOztFQW1CakQ7Ozs7Ozs7MkNBQ0osZ0JBQUEsR0FBa0I7OzJDQUVsQixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDs7UUFBUyxRQUFNOztNQUN6QixDQUFDLENBQUMsS0FBRixDQUFRLEtBQVIsRUFBZSxTQUFBO2VBQ2IsTUFBTSxDQUFDLE1BQVAsQ0FBQTtNQURhLENBQWY7TUFFQSxNQUFNLENBQUMscUJBQVAsQ0FBQTthQUNBLE1BQU0sQ0FBQywwQkFBUCxDQUFBO0lBSlU7Ozs7S0FINkI7O0VBU3JDOzs7Ozs7OzZDQUNKLGdCQUFBLEdBQWtCOzs2Q0FFbEIsVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7O1FBQVMsUUFBTTs7TUFDekIsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxLQUFSLEVBQWUsU0FBQTtlQUNiLE1BQU0sQ0FBQyxRQUFQLENBQUE7TUFEYSxDQUFmO01BRUEsTUFBTSxDQUFDLHFCQUFQLENBQUE7YUFDQSxNQUFNLENBQUMsMEJBQVAsQ0FBQTtJQUpVOzs7O0tBSCtCOztFQVN2Qzs7Ozs7OztnQ0FDSixVQUFBLEdBQVksU0FBQyxNQUFELEVBQVMsS0FBVDtBQUNWLFVBQUE7O1FBRG1CLFFBQU07O01BQ3pCLE9BQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUFoQixFQUFDLGNBQUQsRUFBTTtNQUNOLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixLQUFuQixDQUFELEVBQTRCLENBQTVCLENBQXpCO01BQ0EsSUFBQSxDQUFPLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBUDtlQUNFLE1BQU0sQ0FBQywwQkFBUCxDQUFBLEVBREY7O0lBSFU7Ozs7S0FEa0I7O0VBTzFCOzs7Ozs7O2dDQUNKLGlCQUFBLEdBQW1CLFNBQUMsS0FBRDtBQUNqQixVQUFBOztRQURrQixRQUFNOztNQUN4QixjQUFBLEdBQWlCLElBQUMsQ0FBQSxhQUFhLENBQUMsd0JBQWYsQ0FBQTtNQUNqQixJQUFHLGNBQUEsR0FBaUIsQ0FBcEI7UUFDRSxNQUFBLEdBQVMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFBLEdBQVEsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLFNBQXJCLEVBRFg7T0FBQSxNQUFBO1FBR0UsTUFBQSxHQUFZLEtBQUEsR0FBUSxDQUFYLEdBQWtCLEtBQUEsR0FBUSxDQUExQixHQUFpQyxNQUg1Qzs7YUFJQSxjQUFBLEdBQWlCO0lBTkE7Ozs7S0FEVzs7RUFTMUI7Ozs7Ozs7bUNBQ0osaUJBQUEsR0FBbUIsU0FBQyxLQUFEO0FBQ2pCLFVBQUE7O1FBRGtCLFFBQU07O01BQ3hCLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGFBQWEsQ0FBQyx1QkFBZixDQUFBO01BQ2hCLE9BQUEsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxDQUFtQixDQUFDLFVBQXBCLENBQUE7TUFDVixJQUFHLGFBQUEsS0FBbUIsT0FBdEI7UUFDRSxNQUFBLEdBQVMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFBLEdBQVEsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLFNBQXJCLEVBRFg7T0FBQSxNQUFBO1FBR0UsTUFBQSxHQUFZLEtBQUEsR0FBUSxDQUFYLEdBQWtCLEtBQUEsR0FBUSxDQUExQixHQUFpQyxNQUg1Qzs7YUFJQSxhQUFBLEdBQWdCO0lBUEM7Ozs7S0FEYzs7RUFVN0I7Ozs7Ozs7bUNBQ0osaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFDLENBQUEsYUFBYSxDQUFDLHdCQUFmLENBQUE7TUFDakIsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBYSxDQUFDLHVCQUFmLENBQUE7TUFDaEIsTUFBQSxHQUFTLGFBQUEsR0FBZ0I7YUFDekIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxjQUFBLEdBQWlCLENBQUMsTUFBQSxHQUFTLENBQVYsQ0FBNUI7SUFKaUI7Ozs7S0FEYzs7RUFPN0I7OztrQ0FDSixnQkFBQSxHQUFrQjs7a0NBQ2xCLFNBQUEsR0FBVzs7SUFFRSw2QkFBQyxhQUFELEVBQWlCLFFBQWpCO01BQUMsSUFBQyxDQUFBLGdCQUFEO01BQWdCLElBQUMsQ0FBQSxXQUFEO01BQzVCLHFEQUFNLElBQUMsQ0FBQSxhQUFhLENBQUMsUUFBZixDQUFBLENBQU4sRUFBaUMsSUFBQyxDQUFBLFFBQWxDO0lBRFc7O2tDQUdiLE1BQUEsR0FBUSxTQUFDLEtBQUQsRUFBUSxPQUFSO0FBRU4sVUFBQTtNQUFBLElBQUcsNENBQUg7UUFDRSxTQUFBLEdBQVksSUFBQyxDQUFBLDJCQUFELENBQTZCLEtBQTdCO1FBQ1osZ0RBQU0sS0FBTixFQUFhLE9BQWI7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLFNBQWpDLEVBSEY7T0FBQSxNQUFBO1FBS0UsU0FBQSxHQUFZLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCO1FBQ1osZ0RBQU0sS0FBTixFQUFhLE9BQWI7ZUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFlBQWYsQ0FBNEIsU0FBNUIsRUFQRjs7SUFGTTs7a0NBV1IsT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUVQLFVBQUE7TUFBQSxJQUFHLDRDQUFIO1FBQ0UsU0FBQSxHQUFZLElBQUMsQ0FBQSwyQkFBRCxDQUE2QixLQUE3QjtRQUNaLGlEQUFNLEtBQU47ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLFNBQWpDLEVBSEY7T0FBQSxNQUFBO1FBS0UsU0FBQSxHQUFZLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCO1FBQ1osaURBQU0sS0FBTjtlQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsWUFBZixDQUE0QixTQUE1QixFQVBGOztJQUZPOztrQ0FXVCxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQUEsQ0FBTSxJQUFDLENBQUEsU0FBUCxFQUFrQixDQUFsQixDQUF6QixFQUErQztRQUFBLFVBQUEsRUFBWSxLQUFaO09BQS9DO0lBRFU7O2tDQUlaLGVBQUEsR0FBaUIsU0FBQyxLQUFEO0FBQ2YsVUFBQTs7UUFEZ0IsUUFBTTs7TUFDdEIsZ0JBQUEscUZBQXlFLElBQUMsQ0FBQSxhQUFhLENBQUMsWUFBZixDQUFBO01BQ3pFLGdCQUFBLEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUFpQyxDQUFDO01BQ3JELFdBQUEsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUNkLFVBQUEsR0FBYSxJQUFDLENBQUEsTUFBTSxDQUFDLHFCQUFSLENBQUE7TUFDYixVQUFBLEdBQWEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsa0JBQUQsR0FBc0IsV0FBdEIsR0FBb0MsS0FBL0M7TUFDYixJQUFDLENBQUEsU0FBRCxHQUFhLGdCQUFBLEdBQW1CO2FBQ2hDLGdCQUFBLEdBQW1CLFVBQUEsR0FBYTtJQVBqQjs7a0NBU2pCLDJCQUFBLEdBQTZCLFNBQUMsS0FBRDtBQUMzQixVQUFBOztRQUQ0QixRQUFNOztNQUNsQyxhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsd0JBQVIsQ0FBQTtNQUNoQixnQkFBQSxHQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUEsQ0FBaUMsQ0FBQztNQUNyRCxXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQUE7TUFDZCxVQUFBLEdBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsV0FBdEIsR0FBb0MsS0FBOUM7TUFDYixJQUFDLENBQUEsU0FBRCxHQUFhLGdCQUFBLEdBQW1CO2FBQ2hDLGFBQUEsR0FBZ0I7SUFOVzs7OztLQTFDRzs7RUFrRDVCOzs7Ozs7O3FDQUNKLGtCQUFBLEdBQW9CLENBQUMsQ0FBRCxHQUFLOzs7O0tBRFU7O0VBRy9COzs7Ozs7O3FDQUNKLGtCQUFBLEdBQW9CLENBQUM7Ozs7S0FEYzs7RUFHL0I7Ozs7Ozs7dUNBQ0osa0JBQUEsR0FBb0IsQ0FBQSxHQUFJOzs7O0tBRGE7O0VBR2pDOzs7Ozs7O3VDQUNKLGtCQUFBLEdBQW9COzs7O0tBRGlCOztFQUd2QyxNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLFFBQUEsTUFEZTtJQUNQLGlCQUFBLGVBRE87SUFDVSxrQkFBQSxnQkFEVjtJQUM0QixVQUFBLFFBRDVCO0lBQ3NDLFdBQUEsU0FEdEM7SUFDaUQsUUFBQSxNQURqRDtJQUN5RCxVQUFBLFFBRHpEO0lBRWYsb0JBQUEsa0JBRmU7SUFFSyx5QkFBQSx1QkFGTDtJQUU4QixnQkFBQSxjQUY5QjtJQUU4QyxxQkFBQSxtQkFGOUM7SUFHZixpQkFBQSxlQUhlO0lBR0Usb0JBQUEsa0JBSEY7SUFHc0Isd0JBQUEsc0JBSHRCO0lBRzhDLHFCQUFBLG1CQUg5QztJQUdtRSx5QkFBQSx1QkFIbkU7SUFHNEYsb0JBQUEsa0JBSDVGO0lBR2dILG9CQUFBLGtCQUhoSDtJQUdvSSx1QkFBQSxxQkFIcEk7SUFJZiw4QkFBQSw0QkFKZTtJQUllLGdDQUFBLDhCQUpmO0lBS2YsNEJBQUEsMEJBTGU7SUFLYSxtQ0FBQSxpQ0FMYjtJQUtnRCwyQkFBQSx5QkFMaEQ7SUFNZiwwQ0FBQSx3Q0FOZTtJQU0yQixtQkFBQSxpQkFOM0I7SUFPZixtQkFBQSxpQkFQZTtJQU9JLHNCQUFBLG9CQVBKO0lBTzBCLHNCQUFBLG9CQVAxQjtJQU9nRCxzQkFBQSxvQkFQaEQ7SUFPc0UsYUFBQSxXQVB0RTtJQVFmLHdCQUFBLHNCQVJlO0lBUVMsd0JBQUEsc0JBUlQ7SUFTZiwwQkFBQSx3QkFUZTtJQVNXLDBCQUFBLHdCQVRYOztBQW5nQmpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vc2V0dGluZ3MnXG5cbldob2xlV29yZFJlZ2V4ID0gL1xcUysvXG5XaG9sZVdvcmRPckVtcHR5TGluZVJlZ2V4ID0gL15cXHMqJHxcXFMrL1xuQWxsV2hpdGVzcGFjZSA9IC9eXFxzJC9cblxuY2xhc3MgTW90aW9uRXJyb3JcbiAgY29uc3RydWN0b3I6IChAbWVzc2FnZSkgLT5cbiAgICBAbmFtZSA9ICdNb3Rpb24gRXJyb3InXG5cbmNsYXNzIE1vdGlvblxuICBvcGVyYXRlc0luY2x1c2l2ZWx5OiBmYWxzZVxuICBvcGVyYXRlc0xpbmV3aXNlOiBmYWxzZVxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHZpbVN0YXRlKSAtPlxuXG4gIHNlbGVjdDogKGNvdW50LCBvcHRpb25zKSAtPlxuICAgIHZhbHVlID0gZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgaWYgQGlzTGluZXdpc2UoKVxuICAgICAgICBAbW92ZVNlbGVjdGlvbkxpbmV3aXNlKHNlbGVjdGlvbiwgY291bnQsIG9wdGlvbnMpXG4gICAgICBlbHNlIGlmIEB2aW1TdGF0ZS5tb2RlIGlzICd2aXN1YWwnXG4gICAgICAgIEBtb3ZlU2VsZWN0aW9uVmlzdWFsKHNlbGVjdGlvbiwgY291bnQsIG9wdGlvbnMpXG4gICAgICBlbHNlIGlmIEBvcGVyYXRlc0luY2x1c2l2ZWx5XG4gICAgICAgIEBtb3ZlU2VsZWN0aW9uSW5jbHVzaXZlbHkoc2VsZWN0aW9uLCBjb3VudCwgb3B0aW9ucylcbiAgICAgIGVsc2VcbiAgICAgICAgQG1vdmVTZWxlY3Rpb24oc2VsZWN0aW9uLCBjb3VudCwgb3B0aW9ucylcbiAgICAgIG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICBAZWRpdG9yLm1lcmdlQ3Vyc29ycygpXG4gICAgQGVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuICAgIHZhbHVlXG5cbiAgZXhlY3V0ZTogKGNvdW50KSAtPlxuICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIEBtb3ZlQ3Vyc29yKGN1cnNvciwgY291bnQpXG4gICAgQGVkaXRvci5tZXJnZUN1cnNvcnMoKVxuXG4gIG1vdmVTZWxlY3Rpb25MaW5ld2lzZTogKHNlbGVjdGlvbiwgY291bnQsIG9wdGlvbnMpIC0+XG4gICAgc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgW29sZFN0YXJ0Um93LCBvbGRFbmRSb3ddID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcblxuICAgICAgd2FzRW1wdHkgPSBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICB3YXNSZXZlcnNlZCA9IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIHVubGVzcyB3YXNFbXB0eSBvciB3YXNSZXZlcnNlZFxuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcblxuICAgICAgQG1vdmVDdXJzb3Ioc2VsZWN0aW9uLmN1cnNvciwgY291bnQsIG9wdGlvbnMpXG5cbiAgICAgIGlzRW1wdHkgPSBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBpc1JldmVyc2VkID0gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgdW5sZXNzIGlzRW1wdHkgb3IgaXNSZXZlcnNlZFxuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVSaWdodCgpXG5cbiAgICAgIFtuZXdTdGFydFJvdywgbmV3RW5kUm93XSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG5cbiAgICAgIGlmIGlzUmV2ZXJzZWQgYW5kIG5vdCB3YXNSZXZlcnNlZFxuICAgICAgICBuZXdFbmRSb3cgPSBNYXRoLm1heChuZXdFbmRSb3csIG9sZFN0YXJ0Um93KVxuICAgICAgaWYgd2FzUmV2ZXJzZWQgYW5kIG5vdCBpc1JldmVyc2VkXG4gICAgICAgIG5ld1N0YXJ0Um93ID0gTWF0aC5taW4obmV3U3RhcnRSb3csIG9sZEVuZFJvdylcblxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtbbmV3U3RhcnRSb3csIDBdLCBbbmV3RW5kUm93ICsgMSwgMF1dLCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICBtb3ZlU2VsZWN0aW9uSW5jbHVzaXZlbHk6IChzZWxlY3Rpb24sIGNvdW50LCBvcHRpb25zKSAtPlxuICAgIHJldHVybiBAbW92ZVNlbGVjdGlvblZpc3VhbChzZWxlY3Rpb24sIGNvdW50LCBvcHRpb25zKSB1bmxlc3Mgc2VsZWN0aW9uLmlzRW1wdHkoKVxuXG4gICAgc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgQG1vdmVDdXJzb3Ioc2VsZWN0aW9uLmN1cnNvciwgY291bnQsIG9wdGlvbnMpXG4gICAgICByZXR1cm4gaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuXG4gICAgICBpZiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICAgICMgZm9yIGJhY2t3YXJkIG1vdGlvbiwgYWRkIHRoZSBvcmlnaW5hbCBzdGFydGluZyBjaGFyYWN0ZXIgb2YgdGhlIG1vdGlvblxuICAgICAgICB7c3RhcnQsIGVuZH0gPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoW3N0YXJ0LCBbZW5kLnJvdywgZW5kLmNvbHVtbiArIDFdXSlcbiAgICAgIGVsc2VcbiAgICAgICAgIyBmb3IgZm9yd2FyZCBtb3Rpb24sIGFkZCB0aGUgZW5kaW5nIGNoYXJhY3RlciBvZiB0aGUgbW90aW9uXG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IubW92ZVJpZ2h0KClcblxuICBtb3ZlU2VsZWN0aW9uVmlzdWFsOiAoc2VsZWN0aW9uLCBjb3VudCwgb3B0aW9ucykgLT5cbiAgICBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uID0+XG4gICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBbb2xkU3RhcnQsIG9sZEVuZF0gPSBbcmFuZ2Uuc3RhcnQsIHJhbmdlLmVuZF1cblxuICAgICAgIyBpbiB2aXN1YWwgbW9kZSwgYXRvbSBjdXJzb3IgaXMgYWZ0ZXIgdGhlIGxhc3Qgc2VsZWN0ZWQgY2hhcmFjdGVyLFxuICAgICAgIyBzbyBoZXJlIHB1dCBjdXJzb3IgaW4gdGhlIGV4cGVjdGVkIHBsYWNlIGZvciB0aGUgZm9sbG93aW5nIG1vdGlvblxuICAgICAgd2FzRW1wdHkgPSBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICB3YXNSZXZlcnNlZCA9IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIHVubGVzcyB3YXNFbXB0eSBvciB3YXNSZXZlcnNlZFxuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcblxuICAgICAgQG1vdmVDdXJzb3Ioc2VsZWN0aW9uLmN1cnNvciwgY291bnQsIG9wdGlvbnMpXG5cbiAgICAgICMgcHV0IGN1cnNvciBiYWNrIGFmdGVyIHRoZSBsYXN0IGNoYXJhY3RlciBzbyBpdCBpcyBhbHNvIHNlbGVjdGVkXG4gICAgICBpc0VtcHR5ID0gc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgaXNSZXZlcnNlZCA9IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIHVubGVzcyBpc0VtcHR5IG9yIGlzUmV2ZXJzZWRcbiAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlUmlnaHQoKVxuXG4gICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBbbmV3U3RhcnQsIG5ld0VuZF0gPSBbcmFuZ2Uuc3RhcnQsIHJhbmdlLmVuZF1cblxuICAgICAgIyBpZiB3ZSByZXZlcnNlZCBvciBlbXB0aWVkIGEgbm9ybWFsIHNlbGVjdGlvblxuICAgICAgIyB3ZSBuZWVkIHRvIHNlbGVjdCBhZ2FpbiB0aGUgbGFzdCBjaGFyYWN0ZXIgZGVzZWxlY3RlZCBhYm92ZSB0aGUgbW90aW9uXG4gICAgICBpZiAoaXNSZXZlcnNlZCBvciBpc0VtcHR5KSBhbmQgbm90ICh3YXNSZXZlcnNlZCBvciB3YXNFbXB0eSlcbiAgICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtuZXdTdGFydCwgW25ld0VuZC5yb3csIG9sZFN0YXJ0LmNvbHVtbiArIDFdXSlcblxuICAgICAgIyBpZiB3ZSByZS1yZXZlcnNlZCBhIHJldmVyc2VkIG5vbi1lbXB0eSBzZWxlY3Rpb24sXG4gICAgICAjIHdlIG5lZWQgdG8ga2VlcCB0aGUgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlIG9sZCBzZWxlY3Rpb24gc2VsZWN0ZWRcbiAgICAgIGlmIHdhc1JldmVyc2VkIGFuZCBub3Qgd2FzRW1wdHkgYW5kIG5vdCBpc1JldmVyc2VkXG4gICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbW29sZEVuZC5yb3csIG9sZEVuZC5jb2x1bW4gLSAxXSwgbmV3RW5kXSlcblxuICAgICAgIyBrZWVwIGEgc2luZ2xlLWNoYXJhY3RlciBzZWxlY3Rpb24gbm9uLXJldmVyc2VkXG4gICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBbbmV3U3RhcnQsIG5ld0VuZF0gPSBbcmFuZ2Uuc3RhcnQsIHJhbmdlLmVuZF1cbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKCkgYW5kIG5ld1N0YXJ0LnJvdyBpcyBuZXdFbmQucm93IGFuZCBuZXdTdGFydC5jb2x1bW4gKyAxIGlzIG5ld0VuZC5jb2x1bW5cbiAgICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlLCByZXZlcnNlZDogZmFsc2UpXG5cbiAgbW92ZVNlbGVjdGlvbjogKHNlbGVjdGlvbiwgY291bnQsIG9wdGlvbnMpIC0+XG4gICAgc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PiBAbW92ZUN1cnNvcihzZWxlY3Rpb24uY3Vyc29yLCBjb3VudCwgb3B0aW9ucylcblxuICBpc0NvbXBsZXRlOiAtPiB0cnVlXG5cbiAgaXNSZWNvcmRhYmxlOiAtPiBmYWxzZVxuXG4gIGlzTGluZXdpc2U6IC0+XG4gICAgaWYgQHZpbVN0YXRlPy5tb2RlIGlzICd2aXN1YWwnXG4gICAgICBAdmltU3RhdGU/LnN1Ym1vZGUgaXMgJ2xpbmV3aXNlJ1xuICAgIGVsc2VcbiAgICAgIEBvcGVyYXRlc0xpbmV3aXNlXG5cbmNsYXNzIEN1cnJlbnRTZWxlY3Rpb24gZXh0ZW5kcyBNb3Rpb25cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAdmltU3RhdGUpIC0+XG4gICAgc3VwZXIoQGVkaXRvciwgQHZpbVN0YXRlKVxuICAgIEBsYXN0U2VsZWN0aW9uUmFuZ2UgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKVxuICAgIEB3YXNMaW5ld2lzZSA9IEBpc0xpbmV3aXNlKClcblxuICBleGVjdXRlOiAoY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzKGNvdW50LCAtPiB0cnVlKVxuXG4gIHNlbGVjdDogKGNvdW50PTEpIC0+XG4gICAgIyBpbiB2aXN1YWwgbW9kZSwgdGhlIGN1cnJlbnQgc2VsZWN0aW9ucyBhcmUgYWxyZWFkeSB0aGVyZVxuICAgICMgaWYgd2UncmUgbm90IGluIHZpc3VhbCBtb2RlLCB3ZSBhcmUgcmVwZWF0aW5nIHNvbWUgb3BlcmF0aW9uIGFuZCBuZWVkIHRvIHJlLWRvIHRoZSBzZWxlY3Rpb25zXG4gICAgdW5sZXNzIEB2aW1TdGF0ZS5tb2RlIGlzICd2aXN1YWwnXG4gICAgICBpZiBAd2FzTGluZXdpc2VcbiAgICAgICAgQHNlbGVjdExpbmVzKClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNlbGVjdENoYXJhY3RlcnMoKVxuXG4gICAgXy50aW1lcyhjb3VudCwgLT4gdHJ1ZSlcblxuICBzZWxlY3RMaW5lczogLT5cbiAgICBsYXN0U2VsZWN0aW9uRXh0ZW50ID0gQGxhc3RTZWxlY3Rpb25SYW5nZS5nZXRFeHRlbnQoKVxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIGN1cnNvciA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlIFtbY3Vyc29yLnJvdywgMF0sIFtjdXJzb3Iucm93ICsgbGFzdFNlbGVjdGlvbkV4dGVudC5yb3csIDBdXVxuICAgIHJldHVyblxuXG4gIHNlbGVjdENoYXJhY3RlcnM6IC0+XG4gICAgbGFzdFNlbGVjdGlvbkV4dGVudCA9IEBsYXN0U2VsZWN0aW9uUmFuZ2UuZ2V0RXh0ZW50KClcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICB7c3RhcnR9ID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIG5ld0VuZCA9IHN0YXJ0LnRyYXZlcnNlKGxhc3RTZWxlY3Rpb25FeHRlbnQpXG4gICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoW3N0YXJ0LCBuZXdFbmRdKVxuICAgIHJldHVyblxuXG4jIFB1YmxpYzogR2VuZXJpYyBjbGFzcyBmb3IgbW90aW9ucyB0aGF0IHJlcXVpcmUgZXh0cmEgaW5wdXRcbmNsYXNzIE1vdGlvbldpdGhJbnB1dCBleHRlbmRzIE1vdGlvblxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEB2aW1TdGF0ZSkgLT5cbiAgICBzdXBlcihAZWRpdG9yLCBAdmltU3RhdGUpXG4gICAgQGNvbXBsZXRlID0gZmFsc2VcblxuICBpc0NvbXBsZXRlOiAtPiBAY29tcGxldGVcblxuICBjYW5Db21wb3NlV2l0aDogKG9wZXJhdGlvbikgLT4gcmV0dXJuIG9wZXJhdGlvbi5jaGFyYWN0ZXJzP1xuXG4gIGNvbXBvc2U6IChpbnB1dCkgLT5cbiAgICBpZiBub3QgaW5wdXQuY2hhcmFjdGVyc1xuICAgICAgdGhyb3cgbmV3IE1vdGlvbkVycm9yKCdNdXN0IGNvbXBvc2Ugd2l0aCBhbiBJbnB1dCcpXG4gICAgQGlucHV0ID0gaW5wdXRcbiAgICBAY29tcGxldGUgPSB0cnVlXG5cbmNsYXNzIE1vdmVMZWZ0IGV4dGVuZHMgTW90aW9uXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAgXy50aW1lcyBjb3VudCwgLT5cbiAgICAgIGN1cnNvci5tb3ZlTGVmdCgpIGlmIG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpIG9yIHNldHRpbmdzLndyYXBMZWZ0UmlnaHRNb3Rpb24oKVxuXG5jbGFzcyBNb3ZlUmlnaHQgZXh0ZW5kcyBNb3Rpb25cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgd3JhcFRvTmV4dExpbmUgPSBzZXR0aW5ncy53cmFwTGVmdFJpZ2h0TW90aW9uKClcblxuICAgICAgIyB3aGVuIHRoZSBtb3Rpb24gaXMgY29tYmluZWQgd2l0aCBhbiBvcGVyYXRvciwgd2Ugd2lsbCBvbmx5IHdyYXAgdG8gdGhlIG5leHQgbGluZVxuICAgICAgIyBpZiB3ZSBhcmUgYWxyZWFkeSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lIChhZnRlciB0aGUgbGFzdCBjaGFyYWN0ZXIpXG4gICAgICB3cmFwVG9OZXh0TGluZSA9IGZhbHNlIGlmIEB2aW1TdGF0ZS5tb2RlIGlzICdvcGVyYXRvci1wZW5kaW5nJyBhbmQgbm90IGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcblxuICAgICAgY3Vyc29yLm1vdmVSaWdodCgpIHVubGVzcyBjdXJzb3IuaXNBdEVuZE9mTGluZSgpXG4gICAgICBjdXJzb3IubW92ZVJpZ2h0KCkgaWYgd3JhcFRvTmV4dExpbmUgYW5kIGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcblxuY2xhc3MgTW92ZVVwIGV4dGVuZHMgTW90aW9uXG4gIG9wZXJhdGVzTGluZXdpc2U6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsIC0+XG4gICAgICB1bmxlc3MgY3Vyc29yLmdldFNjcmVlblJvdygpIGlzIDBcbiAgICAgICAgY3Vyc29yLm1vdmVVcCgpXG5cbmNsYXNzIE1vdmVEb3duIGV4dGVuZHMgTW90aW9uXG4gIG9wZXJhdGVzTGluZXdpc2U6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsID0+XG4gICAgICB1bmxlc3MgY3Vyc29yLmdldFNjcmVlblJvdygpIGlzIEBlZGl0b3IuZ2V0TGFzdFNjcmVlblJvdygpXG4gICAgICAgIGN1cnNvci5tb3ZlRG93bigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzV29yZCBleHRlbmRzIE1vdGlvblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsIC0+XG4gICAgICBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNXaG9sZVdvcmQgZXh0ZW5kcyBNb3Rpb25cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgY3Vyc29yLm1vdmVUb0JlZ2lubmluZ09mV29yZCgpXG4gICAgICB3aGlsZSBub3QgQGlzV2hvbGVXb3JkKGN1cnNvcikgYW5kIG5vdCBAaXNCZWdpbm5pbmdPZkZpbGUoY3Vyc29yKVxuICAgICAgICBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKClcblxuICBpc1dob2xlV29yZDogKGN1cnNvcikgLT5cbiAgICBjaGFyID0gY3Vyc29yLmdldEN1cnJlbnRXb3JkUHJlZml4KCkuc2xpY2UoLTEpXG4gICAgQWxsV2hpdGVzcGFjZS50ZXN0KGNoYXIpXG5cbiAgaXNCZWdpbm5pbmdPZkZpbGU6IChjdXJzb3IpIC0+XG4gICAgY3VyID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBub3QgY3VyLnJvdyBhbmQgbm90IGN1ci5jb2x1bW5cblxuY2xhc3MgTW92ZVRvTmV4dFdvcmQgZXh0ZW5kcyBNb3Rpb25cbiAgd29yZFJlZ2V4OiBudWxsXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSwgb3B0aW9ucykgLT5cbiAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgY3VycmVudCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIG5leHQgPSBpZiBvcHRpb25zPy5leGNsdWRlV2hpdGVzcGFjZVxuICAgICAgICBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHdvcmRSZWdleDogQHdvcmRSZWdleClcbiAgICAgIGVsc2VcbiAgICAgICAgY3Vyc29yLmdldEJlZ2lubmluZ09mTmV4dFdvcmRCdWZmZXJQb3NpdGlvbih3b3JkUmVnZXg6IEB3b3JkUmVnZXgpXG5cbiAgICAgIHJldHVybiBpZiBAaXNFbmRPZkZpbGUoY3Vyc29yKVxuXG4gICAgICBpZiBjdXJzb3IuaXNBdEVuZE9mTGluZSgpXG4gICAgICAgIGN1cnNvci5tb3ZlRG93bigpXG4gICAgICAgIGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgICAgICBjdXJzb3Iuc2tpcExlYWRpbmdXaGl0ZXNwYWNlKClcbiAgICAgIGVsc2UgaWYgY3VycmVudC5yb3cgaXMgbmV4dC5yb3cgYW5kIGN1cnJlbnQuY29sdW1uIGlzIG5leHQuY29sdW1uXG4gICAgICAgIGN1cnNvci5tb3ZlVG9FbmRPZldvcmQoKVxuICAgICAgZWxzZVxuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obmV4dClcblxuICBpc0VuZE9mRmlsZTogKGN1cnNvcikgLT5cbiAgICBjdXIgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGVvZiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIGN1ci5yb3cgaXMgZW9mLnJvdyBhbmQgY3VyLmNvbHVtbiBpcyBlb2YuY29sdW1uXG5cbmNsYXNzIE1vdmVUb05leHRXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICB3b3JkUmVnZXg6IFdob2xlV29yZE9yRW1wdHlMaW5lUmVnZXhcblxuY2xhc3MgTW92ZVRvRW5kT2ZXb3JkIGV4dGVuZHMgTW90aW9uXG4gIG9wZXJhdGVzSW5jbHVzaXZlbHk6IHRydWVcbiAgd29yZFJlZ2V4OiBudWxsXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LCA9PlxuICAgICAgY3VycmVudCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIG5leHQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHdvcmRSZWdleDogQHdvcmRSZWdleClcbiAgICAgIG5leHQuY29sdW1uLS0gaWYgbmV4dC5jb2x1bW4gPiAwXG5cbiAgICAgIGlmIG5leHQuaXNFcXVhbChjdXJyZW50KVxuICAgICAgICBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICAgICAgaWYgY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgICAgIGN1cnNvci5tb3ZlRG93bigpXG4gICAgICAgICAgY3Vyc29yLm1vdmVUb0JlZ2lubmluZ09mTGluZSgpXG5cbiAgICAgICAgbmV4dCA9IGN1cnNvci5nZXRFbmRPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24od29yZFJlZ2V4OiBAd29yZFJlZ2V4KVxuICAgICAgICBuZXh0LmNvbHVtbi0tIGlmIG5leHQuY29sdW1uID4gMFxuXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obmV4dClcblxuY2xhc3MgTW92ZVRvRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmRcbiAgd29yZFJlZ2V4OiBXaG9sZVdvcmRSZWdleFxuXG5jbGFzcyBNb3ZlVG9OZXh0U2VudGVuY2UgZXh0ZW5kcyBNb3Rpb25cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LCAtPlxuICAgICAgc3RhcnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50cmFuc2xhdGUgbmV3IFBvaW50KDAsIDEpXG4gICAgICBlb2YgPSBjdXJzb3IuZWRpdG9yLmdldEJ1ZmZlcigpLmdldEVuZFBvc2l0aW9uKClcbiAgICAgIHNjYW5SYW5nZSA9IFtzdGFydCwgZW9mXVxuXG4gICAgICBjdXJzb3IuZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC8oXiQpfCgoW1xcLiE/XSApfF5bQS1aYS16MC05XSkvLCBzY2FuUmFuZ2UsICh7bWF0Y2hUZXh0LCByYW5nZSwgc3RvcH0pIC0+XG4gICAgICAgIGFkanVzdG1lbnQgPSBuZXcgUG9pbnQoMCwgMClcbiAgICAgICAgaWYgbWF0Y2hUZXh0Lm1hdGNoIC9bXFwuIT9dL1xuICAgICAgICAgIGFkanVzdG1lbnQgPSBuZXcgUG9pbnQoMCwgMilcblxuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24gcmFuZ2Uuc3RhcnQudHJhbnNsYXRlKGFkanVzdG1lbnQpXG4gICAgICAgIHN0b3AoKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlIGV4dGVuZHMgTW90aW9uXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAgXy50aW1lcyBjb3VudCwgLT5cbiAgICAgIGVuZCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYW5zbGF0ZSBuZXcgUG9pbnQoMCwgLTEpXG4gICAgICBib2YgPSBjdXJzb3IuZWRpdG9yLmdldEJ1ZmZlcigpLmdldEZpcnN0UG9zaXRpb24oKVxuICAgICAgc2NhblJhbmdlID0gW2JvZiwgZW5kXVxuXG4gICAgICBjdXJzb3IuZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIC8oXiQpfCgoW1xcLiE/XSApfF5bQS1aYS16MC05XSkvLCBzY2FuUmFuZ2UsICh7bWF0Y2hUZXh0LCByYW5nZSwgc3RvcH0pIC0+XG4gICAgICAgIGFkanVzdG1lbnQgPSBuZXcgUG9pbnQoMCwgMClcbiAgICAgICAgaWYgbWF0Y2hUZXh0Lm1hdGNoIC9bXFwuIT9dL1xuICAgICAgICAgIGFkanVzdG1lbnQgPSBuZXcgUG9pbnQoMCwgMilcblxuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24gcmFuZ2Uuc3RhcnQudHJhbnNsYXRlKGFkanVzdG1lbnQpXG4gICAgICAgIHN0b3AoKVxuXG5jbGFzcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIGV4dGVuZHMgTW90aW9uXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAgXy50aW1lcyBjb3VudCwgLT5cbiAgICAgIGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZk5leHRQYXJhZ3JhcGgoKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1BhcmFncmFwaCBleHRlbmRzIE1vdGlvblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsIC0+XG4gICAgICBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZQcmV2aW91c1BhcmFncmFwaCgpXG5cbmNsYXNzIE1vdmVUb0xpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgb3BlcmF0ZXNMaW5ld2lzZTogdHJ1ZVxuXG4gIGdldERlc3RpbmF0aW9uUm93OiAoY291bnQpIC0+XG4gICAgaWYgY291bnQ/IHRoZW4gY291bnQgLSAxIGVsc2UgKEBlZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxKVxuXG5jbGFzcyBNb3ZlVG9BYnNvbHV0ZUxpbmUgZXh0ZW5kcyBNb3ZlVG9MaW5lXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50KSAtPlxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbQGdldERlc3RpbmF0aW9uUm93KGNvdW50KSwgSW5maW5pdHldKVxuICAgIGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4gICAgY3Vyc29yLm1vdmVUb0VuZE9mTGluZSgpIGlmIGN1cnNvci5nZXRCdWZmZXJDb2x1bW4oKSBpcyAwXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZSBleHRlbmRzIE1vdmVUb0xpbmVcbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICB7cm93LCBjb2x1bW59ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3JvdyArIChjb3VudCAtIDEpLCAwXSlcblxuY2xhc3MgTW92ZVRvU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb0xpbmVcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yRWxlbWVudCwgQHZpbVN0YXRlLCBAc2Nyb2xsb2ZmKSAtPlxuICAgIEBzY3JvbGxvZmYgPSAyICMgYXRvbSBkZWZhdWx0XG4gICAgc3VwZXIoQGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKSwgQHZpbVN0YXRlKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAge3JvdywgY29sdW1ufSA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgY3Vyc29yLnNldFNjcmVlblBvc2l0aW9uKFtAZ2V0RGVzdGluYXRpb25Sb3coY291bnQpLCAwXSlcblxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAgXy50aW1lcyBjb3VudCwgLT5cbiAgICAgIGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIE1vdGlvblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsIC0+XG4gICAgICBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICAgIGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lQW5kRG93biBleHRlbmRzIE1vdGlvblxuICBvcGVyYXRlc0xpbmV3aXNlOiB0cnVlXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LTEsIC0+XG4gICAgICBjdXJzb3IubW92ZURvd24oKVxuICAgIGN1cnNvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgIGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbmNsYXNzIE1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgbW92ZUN1cnNvcjogKGN1cnNvciwgY291bnQ9MSkgLT5cbiAgICBfLnRpbWVzIGNvdW50LCAtPlxuICAgICAgY3Vyc29yLm1vdmVUb0VuZE9mTGluZSgpXG4gICAgICBjdXJzb3IuZ29hbENvbHVtbiA9IEluZmluaXR5XG5cbmNsYXNzIE1vdmVUb0xhc3ROb25ibGFua0NoYXJhY3Rlck9mTGluZUFuZERvd24gZXh0ZW5kcyBNb3Rpb25cbiAgb3BlcmF0ZXNJbmNsdXNpdmVseTogdHJ1ZVxuXG4gICMgbW92ZXMgY3Vyc29yIHRvIHRoZSBsYXN0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBvbiB0aGUgbGluZVxuICAjIHNpbWlsYXIgdG8gc2tpcExlYWRpbmdXaGl0ZXNwYWNlKCkgaW4gYXRvbSdzIGN1cnNvci5jb2ZmZWVcbiAgc2tpcFRyYWlsaW5nV2hpdGVzcGFjZTogKGN1cnNvcikgLT5cbiAgICBwb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgc2NhblJhbmdlID0gY3Vyc29yLmdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2UoKVxuICAgIHN0YXJ0T2ZUcmFpbGluZ1doaXRlc3BhY2UgPSBbc2NhblJhbmdlLmVuZC5yb3csIHNjYW5SYW5nZS5lbmQuY29sdW1uIC0gMV1cbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC9bIFxcdF0rJC8sIHNjYW5SYW5nZSwgKHtyYW5nZX0pIC0+XG4gICAgICBzdGFydE9mVHJhaWxpbmdXaGl0ZXNwYWNlID0gcmFuZ2Uuc3RhcnRcbiAgICAgIHN0YXJ0T2ZUcmFpbGluZ1doaXRlc3BhY2UuY29sdW1uIC09IDFcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oc3RhcnRPZlRyYWlsaW5nV2hpdGVzcGFjZSlcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQtMSwgLT5cbiAgICAgIGN1cnNvci5tb3ZlRG93bigpXG4gICAgQHNraXBUcmFpbGluZ1doaXRlc3BhY2UoY3Vyc29yKVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVVwIGV4dGVuZHMgTW90aW9uXG4gIG9wZXJhdGVzTGluZXdpc2U6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yLCBjb3VudD0xKSAtPlxuICAgIF8udGltZXMgY291bnQsIC0+XG4gICAgICBjdXJzb3IubW92ZVVwKClcbiAgICBjdXJzb3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICBjdXJzb3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd24gZXh0ZW5kcyBNb3Rpb25cbiAgb3BlcmF0ZXNMaW5ld2lzZTogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAgXy50aW1lcyBjb3VudCwgLT5cbiAgICAgIGN1cnNvci5tb3ZlRG93bigpXG4gICAgY3Vyc29yLm1vdmVUb0JlZ2lubmluZ09mTGluZSgpXG4gICAgY3Vyc29yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcblxuY2xhc3MgTW92ZVRvU3RhcnRPZkZpbGUgZXh0ZW5kcyBNb3ZlVG9MaW5lXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IsIGNvdW50PTEpIC0+XG4gICAge3JvdywgY29sdW1ufSA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbQGdldERlc3RpbmF0aW9uUm93KGNvdW50KSwgMF0pXG4gICAgdW5sZXNzIEBpc0xpbmV3aXNlKClcbiAgICAgIGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbmNsYXNzIE1vdmVUb1RvcE9mU2NyZWVuIGV4dGVuZHMgTW92ZVRvU2NyZWVuTGluZVxuICBnZXREZXN0aW5hdGlvblJvdzogKGNvdW50PTApIC0+XG4gICAgZmlyc3RTY3JlZW5Sb3cgPSBAZWRpdG9yRWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIGlmIGZpcnN0U2NyZWVuUm93ID4gMFxuICAgICAgb2Zmc2V0ID0gTWF0aC5tYXgoY291bnQgLSAxLCBAc2Nyb2xsb2ZmKVxuICAgIGVsc2VcbiAgICAgIG9mZnNldCA9IGlmIGNvdW50ID4gMCB0aGVuIGNvdW50IC0gMSBlbHNlIGNvdW50XG4gICAgZmlyc3RTY3JlZW5Sb3cgKyBvZmZzZXRcblxuY2xhc3MgTW92ZVRvQm90dG9tT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9TY3JlZW5MaW5lXG4gIGdldERlc3RpbmF0aW9uUm93OiAoY291bnQ9MCkgLT5cbiAgICBsYXN0U2NyZWVuUm93ID0gQGVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIGxhc3RSb3cgPSBAZWRpdG9yLmdldEJ1ZmZlcigpLmdldExhc3RSb3coKVxuICAgIGlmIGxhc3RTY3JlZW5Sb3cgaXNudCBsYXN0Um93XG4gICAgICBvZmZzZXQgPSBNYXRoLm1heChjb3VudCAtIDEsIEBzY3JvbGxvZmYpXG4gICAgZWxzZVxuICAgICAgb2Zmc2V0ID0gaWYgY291bnQgPiAwIHRoZW4gY291bnQgLSAxIGVsc2UgY291bnRcbiAgICBsYXN0U2NyZWVuUm93IC0gb2Zmc2V0XG5cbmNsYXNzIE1vdmVUb01pZGRsZU9mU2NyZWVuIGV4dGVuZHMgTW92ZVRvU2NyZWVuTGluZVxuICBnZXREZXN0aW5hdGlvblJvdzogLT5cbiAgICBmaXJzdFNjcmVlblJvdyA9IEBlZGl0b3JFbGVtZW50LmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgbGFzdFNjcmVlblJvdyA9IEBlZGl0b3JFbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBoZWlnaHQgPSBsYXN0U2NyZWVuUm93IC0gZmlyc3RTY3JlZW5Sb3dcbiAgICBNYXRoLmZsb29yKGZpcnN0U2NyZWVuUm93ICsgKGhlaWdodCAvIDIpKVxuXG5jbGFzcyBTY3JvbGxLZWVwaW5nQ3Vyc29yIGV4dGVuZHMgTW90aW9uXG4gIG9wZXJhdGVzTGluZXdpc2U6IHRydWVcbiAgY3Vyc29yUm93OiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yRWxlbWVudCwgQHZpbVN0YXRlKSAtPlxuICAgIHN1cGVyKEBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCksIEB2aW1TdGF0ZSlcblxuICBzZWxlY3Q6IChjb3VudCwgb3B0aW9ucykgLT5cbiAgICAjIFRPRE86IHJlbW92ZSB0aGlzIGNvbmRpdGlvbmFsIG9uY2UgYWZ0ZXIgQXRvbSB2MS4xLjAgaXMgcmVsZWFzZWQuXG4gICAgaWYgQGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Sb3c/XG4gICAgICBuZXdUb3BSb3cgPSBAZ2V0TmV3Rmlyc3RWaXNpYmxlU2NyZWVuUm93KGNvdW50KVxuICAgICAgc3VwZXIoY291bnQsIG9wdGlvbnMpXG4gICAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhuZXdUb3BSb3cpXG4gICAgZWxzZVxuICAgICAgc2Nyb2xsVG9wID0gQGdldE5ld1Njcm9sbFRvcChjb3VudClcbiAgICAgIHN1cGVyKGNvdW50LCBvcHRpb25zKVxuICAgICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKHNjcm9sbFRvcClcblxuICBleGVjdXRlOiAoY291bnQpIC0+XG4gICAgIyBUT0RPOiByZW1vdmUgdGhpcyBjb25kaXRpb25hbCBvbmNlIGFmdGVyIEF0b20gdjEuMS4wIGlzIHJlbGVhc2VkLlxuICAgIGlmIEBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93P1xuICAgICAgbmV3VG9wUm93ID0gQGdldE5ld0ZpcnN0VmlzaWJsZVNjcmVlblJvdyhjb3VudClcbiAgICAgIHN1cGVyKGNvdW50KVxuICAgICAgQGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cobmV3VG9wUm93KVxuICAgIGVsc2VcbiAgICAgIHNjcm9sbFRvcCA9IEBnZXROZXdTY3JvbGxUb3AoY291bnQpXG4gICAgICBzdXBlcihjb3VudClcbiAgICAgIEBlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcChzY3JvbGxUb3ApXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24oUG9pbnQoQGN1cnNvclJvdywgMCksIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gICMgVE9ETzogcmVtb3ZlIHRoaXMgbWV0aG9kIG9uY2UgYWZ0ZXIgQXRvbSB2MS4xLjAgaXMgcmVsZWFzZWQuXG4gIGdldE5ld1Njcm9sbFRvcDogKGNvdW50PTEpIC0+XG4gICAgY3VycmVudFNjcm9sbFRvcCA9IEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC5wcmVzZW50ZXIucGVuZGluZ1Njcm9sbFRvcCA/IEBlZGl0b3JFbGVtZW50LmdldFNjcm9sbFRvcCgpXG4gICAgY3VycmVudEN1cnNvclJvdyA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKS5yb3dcbiAgICByb3dzUGVyUGFnZSA9IEBlZGl0b3IuZ2V0Um93c1BlclBhZ2UoKVxuICAgIGxpbmVIZWlnaHQgPSBAZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpXG4gICAgc2Nyb2xsUm93cyA9IE1hdGguZmxvb3IoQHBhZ2VTY3JvbGxGcmFjdGlvbiAqIHJvd3NQZXJQYWdlICogY291bnQpXG4gICAgQGN1cnNvclJvdyA9IGN1cnJlbnRDdXJzb3JSb3cgKyBzY3JvbGxSb3dzXG4gICAgY3VycmVudFNjcm9sbFRvcCArIHNjcm9sbFJvd3MgKiBsaW5lSGVpZ2h0XG5cbiAgZ2V0TmV3Rmlyc3RWaXNpYmxlU2NyZWVuUm93OiAoY291bnQ9MSkgLT5cbiAgICBjdXJyZW50VG9wUm93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIGN1cnJlbnRDdXJzb3JSb3cgPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKCkucm93XG4gICAgcm93c1BlclBhZ2UgPSBAZWRpdG9yLmdldFJvd3NQZXJQYWdlKClcbiAgICBzY3JvbGxSb3dzID0gTWF0aC5jZWlsKEBwYWdlU2Nyb2xsRnJhY3Rpb24gKiByb3dzUGVyUGFnZSAqIGNvdW50KVxuICAgIEBjdXJzb3JSb3cgPSBjdXJyZW50Q3Vyc29yUm93ICsgc2Nyb2xsUm93c1xuICAgIGN1cnJlbnRUb3BSb3cgKyBzY3JvbGxSb3dzXG5cbmNsYXNzIFNjcm9sbEhhbGZVcEtlZXBDdXJzb3IgZXh0ZW5kcyBTY3JvbGxLZWVwaW5nQ3Vyc29yXG4gIHBhZ2VTY3JvbGxGcmFjdGlvbjogLTEgLyAyXG5cbmNsYXNzIFNjcm9sbEZ1bGxVcEtlZXBDdXJzb3IgZXh0ZW5kcyBTY3JvbGxLZWVwaW5nQ3Vyc29yXG4gIHBhZ2VTY3JvbGxGcmFjdGlvbjogLTFcblxuY2xhc3MgU2Nyb2xsSGFsZkRvd25LZWVwQ3Vyc29yIGV4dGVuZHMgU2Nyb2xsS2VlcGluZ0N1cnNvclxuICBwYWdlU2Nyb2xsRnJhY3Rpb246IDEgLyAyXG5cbmNsYXNzIFNjcm9sbEZ1bGxEb3duS2VlcEN1cnNvciBleHRlbmRzIFNjcm9sbEtlZXBpbmdDdXJzb3JcbiAgcGFnZVNjcm9sbEZyYWN0aW9uOiAxXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBNb3Rpb24sIE1vdGlvbldpdGhJbnB1dCwgQ3VycmVudFNlbGVjdGlvbiwgTW92ZUxlZnQsIE1vdmVSaWdodCwgTW92ZVVwLCBNb3ZlRG93bixcbiAgTW92ZVRvUHJldmlvdXNXb3JkLCBNb3ZlVG9QcmV2aW91c1dob2xlV29yZCwgTW92ZVRvTmV4dFdvcmQsIE1vdmVUb05leHRXaG9sZVdvcmQsXG4gIE1vdmVUb0VuZE9mV29yZCwgTW92ZVRvTmV4dFNlbnRlbmNlLCBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlLCBNb3ZlVG9OZXh0UGFyYWdyYXBoLCBNb3ZlVG9QcmV2aW91c1BhcmFncmFwaCwgTW92ZVRvQWJzb2x1dGVMaW5lLCBNb3ZlVG9SZWxhdGl2ZUxpbmUsIE1vdmVUb0JlZ2lubmluZ09mTGluZSxcbiAgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVVcCwgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duLFxuICBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSwgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVBbmREb3duLCBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lLFxuICBNb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duLCBNb3ZlVG9TdGFydE9mRmlsZSxcbiAgTW92ZVRvVG9wT2ZTY3JlZW4sIE1vdmVUb0JvdHRvbU9mU2NyZWVuLCBNb3ZlVG9NaWRkbGVPZlNjcmVlbiwgTW92ZVRvRW5kT2ZXaG9sZVdvcmQsIE1vdGlvbkVycm9yLFxuICBTY3JvbGxIYWxmVXBLZWVwQ3Vyc29yLCBTY3JvbGxGdWxsVXBLZWVwQ3Vyc29yLFxuICBTY3JvbGxIYWxmRG93bktlZXBDdXJzb3IsIFNjcm9sbEZ1bGxEb3duS2VlcEN1cnNvclxufVxuIl19
