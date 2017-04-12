(function() {
  var ActivateNormalModeOnce, Base, BlockwiseOtherEnd, MiscCommand, Range, Redo, ReplaceModeBackspace, ReverseSelections, Scroll, ScrollCursor, ScrollCursorToBottom, ScrollCursorToBottomLeave, ScrollCursorToLeft, ScrollCursorToMiddle, ScrollCursorToMiddleLeave, ScrollCursorToRight, ScrollCursorToTop, ScrollCursorToTopLeave, ScrollDown, ScrollUp, ToggleFold, Undo, _, highlightRanges, mergeIntersectingRanges, moveCursorRight, pointIsAtEndOfLine, ref, settings, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Range = require('atom').Range;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  _ = require('underscore-plus');

  moveCursorRight = require('./utils').moveCursorRight;

  ref = require('./utils'), pointIsAtEndOfLine = ref.pointIsAtEndOfLine, mergeIntersectingRanges = ref.mergeIntersectingRanges, highlightRanges = ref.highlightRanges;

  MiscCommand = (function(superClass) {
    extend(MiscCommand, superClass);

    MiscCommand.extend(false);

    function MiscCommand() {
      MiscCommand.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    return MiscCommand;

  })(Base);

  ReverseSelections = (function(superClass) {
    extend(ReverseSelections, superClass);

    function ReverseSelections() {
      return ReverseSelections.__super__.constructor.apply(this, arguments);
    }

    ReverseSelections.extend();

    ReverseSelections.prototype.execute = function() {
      var i, len, ref1, results, reversed, selection;
      reversed = this.editor.getLastSelection().isReversed();
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection.isReversed() === reversed) {
          results.push(swrap(selection).reverse());
        }
      }
      return results;
    };

    return ReverseSelections;

  })(MiscCommand);

  BlockwiseOtherEnd = (function(superClass) {
    extend(BlockwiseOtherEnd, superClass);

    function BlockwiseOtherEnd() {
      return BlockwiseOtherEnd.__super__.constructor.apply(this, arguments);
    }

    BlockwiseOtherEnd.extend();

    BlockwiseOtherEnd.prototype.execute = function() {
      var bs, i, len, ref1;
      ref1 = this.getBlockwiseSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        bs = ref1[i];
        bs.reverse();
      }
      return BlockwiseOtherEnd.__super__.execute.apply(this, arguments);
    };

    return BlockwiseOtherEnd;

  })(ReverseSelections);

  Undo = (function(superClass) {
    extend(Undo, superClass);

    function Undo() {
      return Undo.__super__.constructor.apply(this, arguments);
    }

    Undo.extend();

    Undo.prototype.saveRangeAsMarker = function(markers, range) {
      if (_.all(markers, function(m) {
        return !m.getBufferRange().intersectsWith(range);
      })) {
        return markers.push(this.editor.markBufferRange(range));
      }
    };

    Undo.prototype.trimEndOfLineRange = function(range) {
      var start;
      start = range.start;
      if ((start.column !== 0) && pointIsAtEndOfLine(this.editor, start)) {
        return range.traverse([+1, 0], [0, 0]);
      } else {
        return range;
      }
    };

    Undo.prototype.mapToChangedRanges = function(list, fn) {
      var ranges;
      ranges = list.map(function(e) {
        return fn(e);
      });
      return mergeIntersectingRanges(ranges).map((function(_this) {
        return function(r) {
          return _this.trimEndOfLineRange(r);
        };
      })(this));
    };

    Undo.prototype.mutateWithTrackingChanges = function(fn) {
      var disposable, firstAdded, lastRemoved, markersAdded, range, rangesAdded, rangesRemoved;
      markersAdded = [];
      rangesRemoved = [];
      disposable = this.editor.getBuffer().onDidChange((function(_this) {
        return function(arg) {
          var newRange, oldRange;
          oldRange = arg.oldRange, newRange = arg.newRange;
          if (!oldRange.isEmpty()) {
            rangesRemoved.push(oldRange);
          }
          if (!newRange.isEmpty()) {
            return _this.saveRangeAsMarker(markersAdded, newRange);
          }
        };
      })(this));
      this.mutate();
      disposable.dispose();
      rangesAdded = this.mapToChangedRanges(markersAdded, function(m) {
        return m.getBufferRange();
      });
      markersAdded.forEach(function(m) {
        return m.destroy();
      });
      rangesRemoved = this.mapToChangedRanges(rangesRemoved, function(r) {
        return r;
      });
      firstAdded = rangesAdded[0];
      lastRemoved = _.last(rangesRemoved);
      range = (firstAdded != null) && (lastRemoved != null) ? firstAdded.start.isLessThan(lastRemoved.start) ? firstAdded : lastRemoved : firstAdded || lastRemoved;
      if (range != null) {
        fn(range);
      }
      if (settings.get('flashOnUndoRedo')) {
        return this.onDidFinishOperation((function(_this) {
          return function() {
            var timeout;
            timeout = settings.get('flashOnUndoRedoDuration');
            highlightRanges(_this.editor, rangesRemoved, {
              "class": "vim-mode-plus-flash removed",
              timeout: timeout
            });
            return highlightRanges(_this.editor, rangesAdded, {
              "class": "vim-mode-plus-flash added",
              timeout: timeout
            });
          };
        })(this));
      }
    };

    Undo.prototype.execute = function() {
      var i, len, ref1, selection;
      this.mutateWithTrackingChanges((function(_this) {
        return function(range) {
          _this.vimState.mark.setRange('[', ']', range);
          if (settings.get('setCursorToStartOfChangeOnUndoRedo')) {
            return _this.editor.setCursorBufferPosition(range.start);
          }
        };
      })(this));
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        selection.clear();
      }
      return this.activateMode('normal');
    };

    Undo.prototype.mutate = function() {
      return this.editor.undo();
    };

    return Undo;

  })(MiscCommand);

  Redo = (function(superClass) {
    extend(Redo, superClass);

    function Redo() {
      return Redo.__super__.constructor.apply(this, arguments);
    }

    Redo.extend();

    Redo.prototype.mutate = function() {
      return this.editor.redo();
    };

    return Redo;

  })(Undo);

  ToggleFold = (function(superClass) {
    extend(ToggleFold, superClass);

    function ToggleFold() {
      return ToggleFold.__super__.constructor.apply(this, arguments);
    }

    ToggleFold.extend();

    ToggleFold.prototype.execute = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      return this.editor.toggleFoldAtBufferRow(point.row);
    };

    return ToggleFold;

  })(MiscCommand);

  ReplaceModeBackspace = (function(superClass) {
    extend(ReplaceModeBackspace, superClass);

    function ReplaceModeBackspace() {
      return ReplaceModeBackspace.__super__.constructor.apply(this, arguments);
    }

    ReplaceModeBackspace.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode.replace';

    ReplaceModeBackspace.extend();

    ReplaceModeBackspace.prototype.execute = function() {
      return this.editor.getSelections().forEach((function(_this) {
        return function(selection) {
          var char;
          char = _this.vimState.modeManager.getReplacedCharForSelection(selection);
          if (char != null) {
            selection.selectLeft();
            if (!selection.insertText(char).isEmpty()) {
              return selection.cursor.moveLeft();
            }
          }
        };
      })(this));
    };

    return ReplaceModeBackspace;

  })(MiscCommand);

  Scroll = (function(superClass) {
    extend(Scroll, superClass);

    function Scroll() {
      return Scroll.__super__.constructor.apply(this, arguments);
    }

    Scroll.extend(false);

    Scroll.prototype.scrolloff = 2;

    Scroll.prototype.cursorPixel = null;

    Scroll.prototype.getFirstVisibleScreenRow = function() {
      return this.editorElement.getFirstVisibleScreenRow();
    };

    Scroll.prototype.getLastVisibleScreenRow = function() {
      return this.editorElement.getLastVisibleScreenRow();
    };

    Scroll.prototype.getLastScreenRow = function() {
      return this.editor.getLastScreenRow();
    };

    Scroll.prototype.getCursorPixel = function() {
      var point;
      point = this.editor.getCursorScreenPosition();
      return this.editorElement.pixelPositionForScreenPosition(point);
    };

    return Scroll;

  })(MiscCommand);

  ScrollDown = (function(superClass) {
    extend(ScrollDown, superClass);

    function ScrollDown() {
      return ScrollDown.__super__.constructor.apply(this, arguments);
    }

    ScrollDown.extend();

    ScrollDown.prototype.execute = function() {
      var column, count, margin, newFirstRow, newPoint, oldFirstRow, ref1, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow + count);
      newFirstRow = this.editor.getFirstVisibleScreenRow();
      margin = this.editor.getVerticalScrollMargin();
      ref1 = this.editor.getCursorScreenPosition(), row = ref1.row, column = ref1.column;
      if (row < (newFirstRow + margin)) {
        newPoint = [row + count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollDown;

  })(Scroll);

  ScrollUp = (function(superClass) {
    extend(ScrollUp, superClass);

    function ScrollUp() {
      return ScrollUp.__super__.constructor.apply(this, arguments);
    }

    ScrollUp.extend();

    ScrollUp.prototype.execute = function() {
      var column, count, margin, newLastRow, newPoint, oldFirstRow, ref1, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow - count);
      newLastRow = this.editor.getLastVisibleScreenRow();
      margin = this.editor.getVerticalScrollMargin();
      ref1 = this.editor.getCursorScreenPosition(), row = ref1.row, column = ref1.column;
      if (row >= (newLastRow - margin)) {
        newPoint = [row - count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollUp;

  })(Scroll);

  ScrollCursor = (function(superClass) {
    extend(ScrollCursor, superClass);

    function ScrollCursor() {
      return ScrollCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollCursor.extend(false);

    ScrollCursor.prototype.execute = function() {
      if (typeof this.moveToFirstCharacterOfLine === "function") {
        this.moveToFirstCharacterOfLine();
      }
      if (this.isScrollable()) {
        return this.editorElement.setScrollTop(this.getScrollTop());
      }
    };

    ScrollCursor.prototype.moveToFirstCharacterOfLine = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    ScrollCursor.prototype.getOffSetPixelHeight = function(lineDelta) {
      if (lineDelta == null) {
        lineDelta = 0;
      }
      return this.editor.getLineHeightInPixels() * (this.scrolloff + lineDelta);
    };

    return ScrollCursor;

  })(Scroll);

  ScrollCursorToTop = (function(superClass) {
    extend(ScrollCursorToTop, superClass);

    function ScrollCursorToTop() {
      return ScrollCursorToTop.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTop.extend();

    ScrollCursorToTop.prototype.isScrollable = function() {
      return this.getLastVisibleScreenRow() !== this.getLastScreenRow();
    };

    ScrollCursorToTop.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - this.getOffSetPixelHeight();
    };

    return ScrollCursorToTop;

  })(ScrollCursor);

  ScrollCursorToTopLeave = (function(superClass) {
    extend(ScrollCursorToTopLeave, superClass);

    function ScrollCursorToTopLeave() {
      return ScrollCursorToTopLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTopLeave.extend();

    ScrollCursorToTopLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToTopLeave;

  })(ScrollCursorToTop);

  ScrollCursorToBottom = (function(superClass) {
    extend(ScrollCursorToBottom, superClass);

    function ScrollCursorToBottom() {
      return ScrollCursorToBottom.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottom.extend();

    ScrollCursorToBottom.prototype.isScrollable = function() {
      return this.getFirstVisibleScreenRow() !== 0;
    };

    ScrollCursorToBottom.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() - this.getOffSetPixelHeight(1));
    };

    return ScrollCursorToBottom;

  })(ScrollCursor);

  ScrollCursorToBottomLeave = (function(superClass) {
    extend(ScrollCursorToBottomLeave, superClass);

    function ScrollCursorToBottomLeave() {
      return ScrollCursorToBottomLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottomLeave.extend();

    ScrollCursorToBottomLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToBottomLeave;

  })(ScrollCursorToBottom);

  ScrollCursorToMiddle = (function(superClass) {
    extend(ScrollCursorToMiddle, superClass);

    function ScrollCursorToMiddle() {
      return ScrollCursorToMiddle.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddle.extend();

    ScrollCursorToMiddle.prototype.isScrollable = function() {
      return true;
    };

    ScrollCursorToMiddle.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() / 2);
    };

    return ScrollCursorToMiddle;

  })(ScrollCursor);

  ScrollCursorToMiddleLeave = (function(superClass) {
    extend(ScrollCursorToMiddleLeave, superClass);

    function ScrollCursorToMiddleLeave() {
      return ScrollCursorToMiddleLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddleLeave.extend();

    ScrollCursorToMiddleLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToMiddleLeave;

  })(ScrollCursorToMiddle);

  ScrollCursorToLeft = (function(superClass) {
    extend(ScrollCursorToLeft, superClass);

    function ScrollCursorToLeft() {
      return ScrollCursorToLeft.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToLeft.extend();

    ScrollCursorToLeft.prototype.execute = function() {
      return this.editorElement.setScrollLeft(this.getCursorPixel().left);
    };

    return ScrollCursorToLeft;

  })(Scroll);

  ScrollCursorToRight = (function(superClass) {
    extend(ScrollCursorToRight, superClass);

    function ScrollCursorToRight() {
      return ScrollCursorToRight.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToRight.extend();

    ScrollCursorToRight.prototype.execute = function() {
      return this.editorElement.setScrollRight(this.getCursorPixel().left);
    };

    return ScrollCursorToRight;

  })(ScrollCursorToLeft);

  ActivateNormalModeOnce = (function(superClass) {
    extend(ActivateNormalModeOnce, superClass);

    function ActivateNormalModeOnce() {
      return ActivateNormalModeOnce.__super__.constructor.apply(this, arguments);
    }

    ActivateNormalModeOnce.extend();

    ActivateNormalModeOnce.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode';

    ActivateNormalModeOnce.prototype.thisCommandName = ActivateNormalModeOnce.getCommandName();

    ActivateNormalModeOnce.prototype.execute = function() {
      var cursor, cursorsToMoveRight, disposable, i, len;
      cursorsToMoveRight = this.editor.getCursors().filter(function(cursor) {
        return !cursor.isAtBeginningOfLine();
      });
      this.vimState.activate('normal');
      for (i = 0, len = cursorsToMoveRight.length; i < len; i++) {
        cursor = cursorsToMoveRight[i];
        moveCursorRight(cursor);
      }
      return disposable = atom.commands.onDidDispatch((function(_this) {
        return function(arg) {
          var type;
          type = arg.type;
          if (type === _this.thisCommandName) {
            return;
          }
          disposable.dispose();
          disposable = null;
          return _this.vimState.activate('insert');
        };
      })(this));
    };

    return ActivateNormalModeOnce;

  })(MiscCommand);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9taXNjLWNvbW1hbmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4Y0FBQTtJQUFBOzs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUNWLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILGtCQUFtQixPQUFBLENBQVEsU0FBUjs7RUFFcEIsTUFJSSxPQUFBLENBQVEsU0FBUixDQUpKLEVBQ0UsMkNBREYsRUFFRSxxREFGRixFQUdFOztFQUdJOzs7SUFDSixXQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O0lBQ2EscUJBQUE7TUFDWCw4Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQUZXOzs7O0tBRlc7O0VBTXBCOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O2dDQUNBLE9BQUEsR0FBUyxTQUFBO0FBRVAsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBMEIsQ0FBQyxVQUEzQixDQUFBO0FBQ1g7QUFBQTtXQUFBLHNDQUFBOztZQUE4QyxTQUFTLENBQUMsVUFBVixDQUFBLENBQUEsS0FBMEI7dUJBQ3RFLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsT0FBakIsQ0FBQTs7QUFERjs7SUFITzs7OztLQUZxQjs7RUFRMUI7Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE1BQUQsQ0FBQTs7Z0NBQ0EsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztRQUFBLEVBQUUsQ0FBQyxPQUFILENBQUE7QUFBQTth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IHJlcXVpcmUgJy4vYmFzZSdcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57bW92ZUN1cnNvclJpZ2h0fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbntcbiAgcG9pbnRJc0F0RW5kT2ZMaW5lXG4gIG1lcmdlSW50ZXJzZWN0aW5nUmFuZ2VzXG4gIGhpZ2hsaWdodFJhbmdlc1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbmNsYXNzIE1pc2NDb21tYW5kIGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuICAgIEBpbml0aWFsaXplKClcblxuY2xhc3MgUmV2ZXJzZVNlbGVjdGlvbnMgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICAjIFJldmVyc2Ugb25seSBzZWxlY3Rpb24gd2hpY2ggcmV2ZXJzZWQgc3RhdGUgaXMgaW4tc3luYyB0byBsYXN0IHNlbGVjdGlvbi5cbiAgICByZXZlcnNlZCA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmlzUmV2ZXJzZWQoKVxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkgd2hlbiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpIGlzIHJldmVyc2VkXG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnJldmVyc2UoKVxuXG5jbGFzcyBCbG9ja3dpc2VPdGhlckVuZCBleHRlbmRzIFJldmVyc2VTZWxlY3Rpb25zXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIGJzLnJldmVyc2UoKSBmb3IgYnMgaW4gQGdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuICAgIHN1cGVyXG5cbmNsYXNzIFVuZG8gZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKClcblxuICBzYXZlUmFuZ2VBc01hcmtlcjogKG1hcmtlcnMsIHJhbmdlKSAtPlxuICAgIGlmIF8uYWxsKG1hcmtlcnMsIChtKSAtPiBub3QgbS5nZXRCdWZmZXJSYW5nZSgpLmludGVyc2VjdHNXaXRoKHJhbmdlKSlcbiAgICAgIG1hcmtlcnMucHVzaCBAZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSlcblxuICB0cmltRW5kT2ZMaW5lUmFuZ2U6IChyYW5nZSkgLT5cbiAgICB7c3RhcnR9ID0gcmFuZ2VcbiAgICBpZiAoc3RhcnQuY29sdW1uIGlzbnQgMCkgYW5kIHBvaW50SXNBdEVuZE9mTGluZShAZWRpdG9yLCBzdGFydClcbiAgICAgIHJhbmdlLnRyYXZlcnNlKFsrMSwgMF0sIFswLCAwXSlcbiAgICBlbHNlXG4gICAgICByYW5nZVxuXG4gIG1hcFRvQ2hhbmdlZFJhbmdlczogKGxpc3QsIGZuKSAtPlxuICAgIHJhbmdlcyA9IGxpc3QubWFwIChlKSAtPiBmbihlKVxuICAgIG1lcmdlSW50ZXJzZWN0aW5nUmFuZ2VzKHJhbmdlcykubWFwIChyKSA9PlxuICAgICAgQHRyaW1FbmRPZkxpbmVSYW5nZShyKVxuXG4gIG11dGF0ZVdpdGhUcmFja2luZ0NoYW5nZXM6IChmbikgLT5cbiAgICBtYXJrZXJzQWRkZWQgPSBbXVxuICAgIHJhbmdlc1JlbW92ZWQgPSBbXVxuXG4gICAgZGlzcG9zYWJsZSA9IEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UgKHtvbGRSYW5nZSwgbmV3UmFuZ2V9KSA9PlxuICAgICAgIyBUbyBoaWdobGlnaHQoZGVjb3JhdGUpIHJlbW92ZWQgcmFuZ2UsIEkgZG9uJ3Qgd2FudCBtYXJrZXIncyBhdXRvLXRyYWNraW5nLXJhbmdlLWNoYW5nZSBmZWF0dXJlLlxuICAgICAgIyBTbyBoZXJlIEkgc2ltcGx5IHVzZSByYW5nZSBmb3IgcmVtb3ZhbFxuICAgICAgcmFuZ2VzUmVtb3ZlZC5wdXNoKG9sZFJhbmdlKSB1bmxlc3Mgb2xkUmFuZ2UuaXNFbXB0eSgpXG4gICAgICAjIEZvciBhZGRlZCByYW5nZSBJIHdhbnQgbWFya2VyJ3MgYXV0by10cmFja2luZy1yYW5nZS1jaGFuZ2UgZmVhdHVyZS5cbiAgICAgIEBzYXZlUmFuZ2VBc01hcmtlcihtYXJrZXJzQWRkZWQsIG5ld1JhbmdlKSB1bmxlc3MgbmV3UmFuZ2UuaXNFbXB0eSgpXG4gICAgQG11dGF0ZSgpXG4gICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcblxuICAgICMgRklYTUU6IHRoaXMgaXMgc3RpbGwgbm90IGNvbXBsZXRlbHkgYWNjdXJhdGUgYW5kIGhlYXZ5IGFwcHJvYWNoLlxuICAgICMgVG8gYWNjdXJhdGVseSB0cmFjayByYW5nZSB1cGRhdGVkLCBuZWVkIHRvIGFkZC9yZW1vdmUgbWFudWFsbHkuXG4gICAgcmFuZ2VzQWRkZWQgPSBAbWFwVG9DaGFuZ2VkUmFuZ2VzIG1hcmtlcnNBZGRlZCwgKG0pIC0+IG0uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIG1hcmtlcnNBZGRlZC5mb3JFYWNoIChtKSAtPiBtLmRlc3Ryb3koKVxuICAgIHJhbmdlc1JlbW92ZWQgPSBAbWFwVG9DaGFuZ2VkUmFuZ2VzIHJhbmdlc1JlbW92ZWQsIChyKSAtPiByXG5cbiAgICBmaXJzdEFkZGVkID0gcmFuZ2VzQWRkZWRbMF1cbiAgICBsYXN0UmVtb3ZlZCA9IF8ubGFzdChyYW5nZXNSZW1vdmVkKVxuICAgIHJhbmdlID1cbiAgICAgIGlmIGZpcnN0QWRkZWQ/IGFuZCBsYXN0UmVtb3ZlZD9cbiAgICAgICAgaWYgZmlyc3RBZGRlZC5zdGFydC5pc0xlc3NUaGFuKGxhc3RSZW1vdmVkLnN0YXJ0KVxuICAgICAgICAgIGZpcnN0QWRkZWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxhc3RSZW1vdmVkXG4gICAgICBlbHNlXG4gICAgICAgIGZpcnN0QWRkZWQgb3IgbGFzdFJlbW92ZWRcblxuICAgIGZuKHJhbmdlKSBpZiByYW5nZT9cbiAgICBpZiBzZXR0aW5ncy5nZXQoJ2ZsYXNoT25VbmRvUmVkbycpXG4gICAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgICAgdGltZW91dCA9IHNldHRpbmdzLmdldCgnZmxhc2hPblVuZG9SZWRvRHVyYXRpb24nKVxuICAgICAgICBoaWdobGlnaHRSYW5nZXMgQGVkaXRvciwgcmFuZ2VzUmVtb3ZlZCxcbiAgICAgICAgICBjbGFzczogXCJ2aW0tbW9kZS1wbHVzLWZsYXNoIHJlbW92ZWRcIlxuICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRcblxuICAgICAgICBoaWdobGlnaHRSYW5nZXMgQGVkaXRvciwgcmFuZ2VzQWRkZWQsXG4gICAgICAgICAgY2xhc3M6IFwidmltLW1vZGUtcGx1cy1mbGFzaCBhZGRlZFwiXG4gICAgICAgICAgdGltZW91dDogdGltZW91dFxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG11dGF0ZVdpdGhUcmFja2luZ0NoYW5nZXMgKHJhbmdlKSA9PlxuICAgICAgQHZpbVN0YXRlLm1hcmsuc2V0UmFuZ2UoJ1snLCAnXScsIHJhbmdlKVxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvJylcbiAgICAgICAgQGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihyYW5nZS5zdGFydClcblxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHNlbGVjdGlvbi5jbGVhcigpXG4gICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJylcblxuICBtdXRhdGU6IC0+XG4gICAgQGVkaXRvci51bmRvKClcblxuY2xhc3MgUmVkbyBleHRlbmRzIFVuZG9cbiAgQGV4dGVuZCgpXG4gIG11dGF0ZTogLT5cbiAgICBAZWRpdG9yLnJlZG8oKVxuXG5jbGFzcyBUb2dnbGVGb2xkIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgcG9pbnQgPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICBAZWRpdG9yLnRvZ2dsZUZvbGRBdEJ1ZmZlclJvdyhwb2ludC5yb3cpXG5cbmNsYXNzIFJlcGxhY2VNb2RlQmFja3NwYWNlIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGNvbW1hbmRTY29wZTogJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5pbnNlcnQtbW9kZS5yZXBsYWNlJ1xuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pID0+XG4gICAgICAjIGNoYXIgbWlnaHQgYmUgZW1wdHkuXG4gICAgICBjaGFyID0gQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLmdldFJlcGxhY2VkQ2hhckZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICBpZiBjaGFyP1xuICAgICAgICBzZWxlY3Rpb24uc2VsZWN0TGVmdCgpXG4gICAgICAgIHVubGVzcyBzZWxlY3Rpb24uaW5zZXJ0VGV4dChjaGFyKS5pc0VtcHR5KClcbiAgICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVMZWZ0KClcblxuIyBbRklYTUVdIE5hbWUgU2Nyb2xsIGlzIG1pc2xlYWRpbmcsIEFkanVzdFZpc2libGVBcmVhIGlzIG1vcmUgZXhwbGljaXQuXG5jbGFzcyBTY3JvbGwgZXh0ZW5kcyBNaXNjQ29tbWFuZFxuICBAZXh0ZW5kKGZhbHNlKVxuICBzY3JvbGxvZmY6IDIgIyBhdG9tIGRlZmF1bHQuIEJldHRlciB0byB1c2UgZWRpdG9yLmdldFZlcnRpY2FsU2Nyb2xsTWFyZ2luKCk/XG4gIGN1cnNvclBpeGVsOiBudWxsXG5cbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93OiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG5cbiAgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3c6IC0+XG4gICAgQGVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gIGdldExhc3RTY3JlZW5Sb3c6IC0+XG4gICAgQGVkaXRvci5nZXRMYXN0U2NyZWVuUm93KClcblxuICBnZXRDdXJzb3JQaXhlbDogLT5cbiAgICBwb2ludCA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICAgIEBlZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihwb2ludClcblxuIyBjdHJsLWUgc2Nyb2xsIGxpbmVzIGRvd253YXJkc1xuY2xhc3MgU2Nyb2xsRG93biBleHRlbmRzIFNjcm9sbFxuICBAZXh0ZW5kKClcblxuICBleGVjdXRlOiAtPlxuICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICBvbGRGaXJzdFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhvbGRGaXJzdFJvdyArIGNvdW50KVxuICAgIG5ld0ZpcnN0Um93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gICAgbWFyZ2luID0gQGVkaXRvci5nZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbigpXG4gICAge3JvdywgY29sdW1ufSA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICAgIGlmIHJvdyA8IChuZXdGaXJzdFJvdyArIG1hcmdpbilcbiAgICAgIG5ld1BvaW50ID0gW3JvdyArIGNvdW50LCBjb2x1bW5dXG4gICAgICBAZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKG5ld1BvaW50LCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuIyBjdHJsLXkgc2Nyb2xsIGxpbmVzIHVwd2FyZHNcbmNsYXNzIFNjcm9sbFVwIGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQoKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgY291bnQgPSBAZ2V0Q291bnQoKVxuICAgIG9sZEZpcnN0Um93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIEBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KG9sZEZpcnN0Um93IC0gY291bnQpXG4gICAgbmV3TGFzdFJvdyA9IEBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gICAgbWFyZ2luID0gQGVkaXRvci5nZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbigpXG4gICAge3JvdywgY29sdW1ufSA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICAgIGlmIHJvdyA+PSAobmV3TGFzdFJvdyAtIG1hcmdpbilcbiAgICAgIG5ld1BvaW50ID0gW3JvdyAtIGNvdW50LCBjb2x1bW5dXG4gICAgICBAZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKG5ld1BvaW50LCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuIyBTY3JvbGwgd2l0aG91dCBDdXJzb3IgUG9zaXRpb24gY2hhbmdlLlxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTY3JvbGxDdXJzb3IgZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZChmYWxzZSlcbiAgZXhlY3V0ZTogLT5cbiAgICBAbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU/KClcbiAgICBpZiBAaXNTY3JvbGxhYmxlKClcbiAgICAgIEBlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcCBAZ2V0U2Nyb2xsVG9wKClcblxuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZTogLT5cbiAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcblxuICBnZXRPZmZTZXRQaXhlbEhlaWdodDogKGxpbmVEZWx0YT0wKSAtPlxuICAgIEBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAoQHNjcm9sbG9mZiArIGxpbmVEZWx0YSlcblxuIyB6IGVudGVyXG5jbGFzcyBTY3JvbGxDdXJzb3JUb1RvcCBleHRlbmRzIFNjcm9sbEN1cnNvclxuICBAZXh0ZW5kKClcbiAgaXNTY3JvbGxhYmxlOiAtPlxuICAgIEBnZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpIGlzbnQgQGdldExhc3RTY3JlZW5Sb3coKVxuXG4gIGdldFNjcm9sbFRvcDogLT5cbiAgICBAZ2V0Q3Vyc29yUGl4ZWwoKS50b3AgLSBAZ2V0T2ZmU2V0UGl4ZWxIZWlnaHQoKVxuXG4jIHp0XG5jbGFzcyBTY3JvbGxDdXJzb3JUb1RvcExlYXZlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yVG9Ub3BcbiAgQGV4dGVuZCgpXG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiBudWxsXG5cbiMgei1cbmNsYXNzIFNjcm9sbEN1cnNvclRvQm90dG9tIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yXG4gIEBleHRlbmQoKVxuICBpc1Njcm9sbGFibGU6IC0+XG4gICAgQGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpIGlzbnQgMFxuXG4gIGdldFNjcm9sbFRvcDogLT5cbiAgICBAZ2V0Q3Vyc29yUGl4ZWwoKS50b3AgLSAoQGVkaXRvckVsZW1lbnQuZ2V0SGVpZ2h0KCkgLSBAZ2V0T2ZmU2V0UGl4ZWxIZWlnaHQoMSkpXG5cbiMgemJcbmNsYXNzIFNjcm9sbEN1cnNvclRvQm90dG9tTGVhdmUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb0JvdHRvbVxuICBAZXh0ZW5kKClcbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU6IG51bGxcblxuIyB6LlxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9NaWRkbGUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JcbiAgQGV4dGVuZCgpXG4gIGlzU2Nyb2xsYWJsZTogLT5cbiAgICB0cnVlXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBnZXRDdXJzb3JQaXhlbCgpLnRvcCAtIChAZWRpdG9yRWxlbWVudC5nZXRIZWlnaHQoKSAvIDIpXG5cbiMgenpcbmNsYXNzIFNjcm9sbEN1cnNvclRvTWlkZGxlTGVhdmUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb01pZGRsZVxuICBAZXh0ZW5kKClcbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU6IG51bGxcblxuIyBIb3Jpem9udGFsIFNjcm9sbFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIHpzXG5jbGFzcyBTY3JvbGxDdXJzb3JUb0xlZnQgZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxMZWZ0KEBnZXRDdXJzb3JQaXhlbCgpLmxlZnQpXG5cbiMgemVcbmNsYXNzIFNjcm9sbEN1cnNvclRvUmlnaHQgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb0xlZnRcbiAgQGV4dGVuZCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxSaWdodChAZ2V0Q3Vyc29yUGl4ZWwoKS5sZWZ0KVxuXG5jbGFzcyBBY3RpdmF0ZU5vcm1hbE1vZGVPbmNlIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXMuaW5zZXJ0LW1vZGUnXG4gIHRoaXNDb21tYW5kTmFtZTogQGdldENvbW1hbmROYW1lKClcblxuICBleGVjdXRlOiAtPlxuICAgIGN1cnNvcnNUb01vdmVSaWdodCA9IEBlZGl0b3IuZ2V0Q3Vyc29ycygpLmZpbHRlciAoY3Vyc29yKSAtPiBub3QgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKVxuICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZSgnbm9ybWFsJylcbiAgICBtb3ZlQ3Vyc29yUmlnaHQoY3Vyc29yKSBmb3IgY3Vyc29yIGluIGN1cnNvcnNUb01vdmVSaWdodFxuICAgIGRpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLm9uRGlkRGlzcGF0Y2ggKHt0eXBlfSkgPT5cbiAgICAgIHJldHVybiBpZiB0eXBlIGlzIEB0aGlzQ29tbWFuZE5hbWVcbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICBkaXNwb3NhYmxlID0gbnVsbFxuICAgICAgQHZpbVN0YXRlLmFjdGl2YXRlKCdpbnNlcnQnKVxuIl19
