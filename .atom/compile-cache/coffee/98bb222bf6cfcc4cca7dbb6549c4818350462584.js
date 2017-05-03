(function() {
  var BlockwiseSelection, Range, _, getBufferRows, ref, sortRanges, swrap;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  ref = require('./utils'), sortRanges = ref.sortRanges, getBufferRows = ref.getBufferRows;

  swrap = require('./selection-wrapper');

  BlockwiseSelection = (function() {
    BlockwiseSelection.prototype.editor = null;

    BlockwiseSelection.prototype.selections = null;

    BlockwiseSelection.prototype.goalColumn = null;

    BlockwiseSelection.prototype.reversed = false;

    function BlockwiseSelection(selection) {
      this.editor = selection.editor;
      this.initialize(selection);
    }

    BlockwiseSelection.prototype.getSelections = function() {
      return this.selections;
    };

    BlockwiseSelection.prototype.isBlockwise = function() {
      return true;
    };

    BlockwiseSelection.prototype.isEmpty = function() {
      return this.getSelections().every(function(selection) {
        return selection.isEmpty();
      });
    };

    BlockwiseSelection.prototype.initialize = function(selection) {
      var end, i, j, len, range, ranges, ref1, ref2, results, reversed, start, wasReversed;
      this.goalColumn = selection.cursor.goalColumn;
      this.selections = [selection];
      wasReversed = reversed = selection.isReversed();
      range = selection.getBufferRange();
      if (range.end.column === 0) {
        range.end.row = range.end.row - 1;
      }
      if (this.goalColumn != null) {
        if (wasReversed) {
          range.start.column = this.goalColumn;
        } else {
          range.end.column = this.goalColumn + 1;
        }
      }
      if (range.start.column >= range.end.column) {
        reversed = !reversed;
        range = range.translate([0, 1], [0, -1]);
      }
      start = range.start, end = range.end;
      ranges = (function() {
        results = [];
        for (var i = ref1 = start.row, ref2 = end.row; ref1 <= ref2 ? i <= ref2 : i >= ref2; ref1 <= ref2 ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this).map(function(row) {
        return [[row, start.column], [row, end.column]];
      });
      selection.setBufferRange(ranges.shift(), {
        reversed: reversed
      });
      for (j = 0, len = ranges.length; j < len; j++) {
        range = ranges[j];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      if (wasReversed) {
        this.reverse();
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.isReversed = function() {
      return this.reversed;
    };

    BlockwiseSelection.prototype.reverse = function() {
      return this.reversed = !this.reversed;
    };

    BlockwiseSelection.prototype.updateGoalColumn = function() {
      var i, len, ref1, results, selection;
      if (this.goalColumn != null) {
        ref1 = this.selections;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          selection = ref1[i];
          results.push(selection.cursor.goalColumn = this.goalColumn);
        }
        return results;
      }
    };

    BlockwiseSelection.prototype.isSingleRow = function() {
      return this.selections.length === 1;
    };

    BlockwiseSelection.prototype.getHeight = function() {
      var endRow, ref1, startRow;
      ref1 = this.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
      return (endRow - startRow) + 1;
    };

    BlockwiseSelection.prototype.getStartSelection = function() {
      return this.selections[0];
    };

    BlockwiseSelection.prototype.getEndSelection = function() {
      return _.last(this.selections);
    };

    BlockwiseSelection.prototype.getHeadSelection = function() {
      if (this.isReversed()) {
        return this.getStartSelection();
      } else {
        return this.getEndSelection();
      }
    };

    BlockwiseSelection.prototype.getTailSelection = function() {
      if (this.isReversed()) {
        return this.getEndSelection();
      } else {
        return this.getStartSelection();
      }
    };

    BlockwiseSelection.prototype.getHeadBufferPosition = function() {
      return this.getHeadSelection().getHeadBufferPosition();
    };

    BlockwiseSelection.prototype.getTailBufferPosition = function() {
      return this.getTailSelection().getTailBufferPosition();
    };

    BlockwiseSelection.prototype.getStartBufferPosition = function() {
      return this.getStartSelection().getBufferRange().start;
    };

    BlockwiseSelection.prototype.getEndBufferPosition = function() {
      return this.getStartSelection().getBufferRange().end;
    };

    BlockwiseSelection.prototype.getBufferRowRange = function() {
      var endRow, startRow;
      startRow = this.getStartSelection().getBufferRowRange()[0];
      endRow = this.getEndSelection().getBufferRowRange()[0];
      return [startRow, endRow];
    };

    BlockwiseSelection.prototype.headReversedStateIsInSync = function() {
      return this.isReversed() === this.getHeadSelection().isReversed();
    };

    BlockwiseSelection.prototype.setSelectedBufferRanges = function(ranges, arg) {
      var i, len, range, reversed;
      reversed = arg.reversed;
      sortRanges(ranges);
      range = ranges.shift();
      this.setHeadBufferRange(range, {
        reversed: reversed
      });
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.sortSelections = function() {
      var ref1;
      return (ref1 = this.selections) != null ? ref1.sort(function(a, b) {
        return a.compare(b);
      }) : void 0;
    };

    BlockwiseSelection.prototype.setPositionForSelections = function(which) {
      var i, len, ref1, results, selection;
      ref1 = this.selections;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        results.push(swrap(selection).setBufferPositionTo(which));
      }
      return results;
    };

    BlockwiseSelection.prototype.clearSelections = function(arg) {
      var except, i, len, ref1, results, selection;
      except = (arg != null ? arg : {}).except;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection !== except) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.setHeadBufferPosition = function(point) {
      var head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      return head.cursor.setBufferPosition(point);
    };

    BlockwiseSelection.prototype.removeEmptySelections = function() {
      var i, len, ref1, results, selection;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection.isEmpty()) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.removeSelection = function(selection) {
      _.remove(this.selections, selection);
      return selection.destroy();
    };

    BlockwiseSelection.prototype.setHeadBufferRange = function(range, options) {
      var base, goalColumn, head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      head.setBufferRange(range, options);
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.getCharacterwiseProperties = function() {
      var end, head, ref1, ref2, start, tail;
      head = this.getHeadBufferPosition();
      tail = this.getTailBufferPosition();
      if (this.isReversed()) {
        ref1 = [head, tail], start = ref1[0], end = ref1[1];
      } else {
        ref2 = [tail, head], start = ref2[0], end = ref2[1];
      }
      if (!(this.isSingleRow() || this.headReversedStateIsInSync())) {
        start.column -= 1;
        end.column += 1;
      }
      return {
        head: head,
        tail: tail
      };
    };

    BlockwiseSelection.prototype.getBufferRange = function() {
      var end, start;
      if (this.headReversedStateIsInSync()) {
        start = this.getStartSelection.getBufferrange().start;
        end = this.getEndSelection.getBufferrange().end;
      } else {
        start = this.getStartSelection.getBufferrange().end.translate([0, -1]);
        end = this.getEndSelection.getBufferrange().start.translate([0, +1]);
      }
      return {
        start: start,
        end: end
      };
    };

    BlockwiseSelection.prototype.restoreCharacterwise = function() {
      var base, goalColumn, head, properties;
      if (this.isEmpty()) {
        return;
      }
      properties = this.getCharacterwiseProperties();
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      swrap(head).selectByProperties(properties);
      if (head.getBufferRange().end.column === 0) {
        swrap(head).translateSelectionEndAndClip('forward');
      }
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    return BlockwiseSelection;

  })();

  module.exports = BlockwiseSelection;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9ibG9ja3dpc2Utc2VsZWN0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQThCLE9BQUEsQ0FBUSxTQUFSLENBQTlCLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUVGO2lDQUNKLE1BQUEsR0FBUTs7aUNBQ1IsVUFBQSxHQUFZOztpQ0FDWixVQUFBLEdBQVk7O2lDQUNaLFFBQUEsR0FBVTs7SUFFRyw0QkFBQyxTQUFEO01BQ1YsSUFBQyxDQUFBLFNBQVUsVUFBVjtNQUNGLElBQUMsQ0FBQSxVQUFELENBQVksU0FBWjtJQUZXOztpQ0FJYixhQUFBLEdBQWUsU0FBQTthQUNiLElBQUMsQ0FBQTtJQURZOztpQ0FHZixXQUFBLEdBQWEsU0FBQTthQUNYO0lBRFc7O2lDQUdiLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFnQixDQUFDLEtBQWpCLENBQXVCLFNBQUMsU0FBRDtlQUNyQixTQUFTLENBQUMsT0FBVixDQUFBO01BRHFCLENBQXZCO0lBRE87O2lDQUlULFVBQUEsR0FBWSxTQUFDLFNBQUQ7QUFDVixVQUFBO01BQUMsSUFBQyxDQUFBLGFBQWMsU0FBUyxDQUFDLE9BQXhCO01BQ0YsSUFBQyxDQUFBLFVBQUQsR0FBYyxDQUFDLFNBQUQ7TUFDZCxXQUFBLEdBQWMsUUFBQSxHQUFXLFNBQVMsQ0FBQyxVQUFWLENBQUE7TUFFekIsS0FBQSxHQUFRLFNBQVMsQ0FBQyxjQUFWLENBQUE7TUFDUixJQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBVixLQUFvQixDQUF2QjtRQUNFLEtBQUssQ0FB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bUMsQ0FBQyxHQUFHLENBQUMsU0FBeEMsQ0FBa0QsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWxEO1FBQ1IsR0FBQSxHQUFNLElBQUMsQ0FBQSxlQUFlLENBQUMsY0FBakIsQ0FBQSxDQUFpQyxDQUFDLEtBQUssQ0FBQyxTQUF4QyxDQUFrRCxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBbEQsRUFMUjs7YUFNQTtRQUFDLE9BQUEsS0FBRDtRQUFRLEtBQUEsR0FBUjs7SUFQYzs7aUNBVWhCLG9CQUFBLEdBQXNCLFNBQUE7QUFHcEIsVUFBQTtNQUFBLElBQVUsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFWO0FBQUEsZUFBQTs7TUFFQSxVQUFBLEdBQWEsSUFBQyxDQUFBLDBCQUFELENBQUE7TUFDYixJQUFBLEdBQU8sSUFBQyxDQUFBLGdCQUFELENBQUE7TUFDUCxJQUFDLENBQUEsZUFBRCxDQUFpQjtRQUFBLE1BQUEsRUFBUSxJQUFSO09BQWpCO01BQ0MsYUFBYyxJQUFJLENBQUM7TUFDcEIsS0FBQSxDQUFNLElBQU4sQ0FBVyxDQUFDLGtCQUFaLENBQStCLFVBQS9CO01BRUEsSUFBRyxJQUFJLENBQUMsY0FBTCxDQUFBLENBQXFCLENBQUMsR0FBRyxDQUFDLE1BQTFCLEtBQW9DLENBQXZDO1FBQ0UsS0FBQSxDQUFNLElBQU4sQ0FBVyxDQUFDLDRCQUFaLENBQXlDLFNBQXpDLEVBREY7O01BR0EsSUFBd0Msa0JBQXhDOzZEQUFXLENBQUMsaUJBQUQsQ0FBQyxhQUFjLFdBQTFCOztJQWRvQjs7Ozs7O0VBZ0J4QixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXJNakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbntzb3J0UmFuZ2VzLCBnZXRCdWZmZXJSb3dzfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbmNsYXNzIEJsb2Nrd2lzZVNlbGVjdGlvblxuICBlZGl0b3I6IG51bGxcbiAgc2VsZWN0aW9uczogbnVsbFxuICBnb2FsQ29sdW1uOiBudWxsXG4gIHJldmVyc2VkOiBmYWxzZVxuXG4gIGNvbnN0cnVjdG9yOiAoc2VsZWN0aW9uKSAtPlxuICAgIHtAZWRpdG9yfSA9IHNlbGVjdGlvblxuICAgIEBpbml0aWFsaXplKHNlbGVjdGlvbilcblxuICBnZXRTZWxlY3Rpb25zOiAtPlxuICAgIEBzZWxlY3Rpb25zXG5cbiAgaXNCbG9ja3dpc2U6IC0+XG4gICAgdHJ1ZVxuXG4gIGlzRW1wdHk6IC0+XG4gICAgQGdldFNlbGVjdGlvbnMoKS5ldmVyeSAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmlzRW1wdHkoKVxuXG4gIGluaXRpYWxpemU6IChzZWxlY3Rpb24pIC0+XG4gICAge0Bnb2FsQ29sdW1ufSA9IHNlbGVjdGlvbi5jdXJzb3JcbiAgICBAc2VsZWN0aW9ucyA9IFtzZWxlY3Rpb25dXG4gICAgd2FzUmV2ZXJzZWQgPSByZXZlcnNlZCA9IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcblxuICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBpZiByYW5nZS5lbmQuY29sdW1uIGlzIDBcbiAgICAgIHJhbmdlLmVuZC5yb3cgPSByYW5nZS5lbmQucm93IC0gMVxuXG4gICAgaWYgQGdvYWxDb2x1bW4/XG4gICAgICBpZiB3YXNSZXZlcnNlZFxuICAgICAgICByYW5nZS5zdGFydC5jb2x1bW4gPSBAZ29hbENvbHVtblxuICAgICAgZWxzZVxuICAgICAgICByYW5nZS5lbmQuY29sdW1uID0gQGdvYWxDb2x1bW4gKyAxXG5cbiAgICBpZiByYW5nZS5zdGFydC5jb2x1bW4gPj0gcmFuZ2UuZW5kLmNvbHVtblxuICAgICAgcmV2ZXJzZWQgPSBub3QgcmV2ZXJzZWRcbiAgICAgIHJhbmdlID0gcmFuZ2UudHJhbnNsYXRlKFswLCAxXSwgWzAsIC0xXSlcblxuICAgIHtzdGFydCwgZW5kfSA9IHJhbmdlXG4gICAgcmFuZ2VzID0gW3N0YXJ0LnJvdy4uZW5kLnJvd10ubWFwIChyb3cpIC0+XG4gICAgICBbW3Jvdywgc3RhcnQuY29sdW1uXSwgW3JvdywgZW5kLmNvbHVtbl1dXG5cbiAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UocmFuZ2VzLnNoaWZ0KCksIHtyZXZlcnNlZH0pXG4gICAgZm9yIHJhbmdlIGluIHJhbmdlc1xuICAgICAgQHNlbGVjdGlvbnMucHVzaChAZWRpdG9yLmFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlKHJhbmdlLCB7cmV2ZXJzZWR9KSlcbiAgICBAcmV2ZXJzZSgpIGlmIHdhc1JldmVyc2VkXG4gICAgQHVwZGF0ZUdvYWxDb2x1bW4oKVxuXG4gIGlzUmV2ZXJzZWQ6IC0+XG4gICAgQHJldmVyc2VkXG5cbiAgcmV2ZXJzZTogLT5cbiAgICBAcmV2ZXJzZWQgPSBub3QgQHJldmVyc2VkXG5cbiAgdXBkYXRlR29hbENvbHVtbjogLT5cbiAgICBpZiBAZ29hbENvbHVtbj9cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQHNlbGVjdGlvbnNcbiAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uID0gQGdvYWxDb2x1bW5cblxuICBpc1NpbmdsZVJvdzogLT5cbiAgICBAc2VsZWN0aW9ucy5sZW5ndGggaXMgMVxuXG4gIGdldEhlaWdodDogLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBAZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIChlbmRSb3cgLSBzdGFydFJvdykgKyAxXG5cbiAgZ2V0U3RhcnRTZWxlY3Rpb246IC0+XG4gICAgQHNlbGVjdGlvbnNbMF1cblxuICBnZXRFbmRTZWxlY3Rpb246IC0+XG4gICAgXy5sYXN0KEBzZWxlY3Rpb25zKVxuXG4gIGdldEhlYWRTZWxlY3Rpb246IC0+XG4gICAgaWYgQGlzUmV2ZXJzZWQoKVxuICAgICAgQGdldFN0YXJ0U2VsZWN0aW9uKClcbiAgICBlbHNlXG4gICAgICBAZ2V0RW5kU2VsZWN0aW9uKClcblxuICBnZXRUYWlsU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc1JldmVyc2VkKClcbiAgICAgIEBnZXRFbmRTZWxlY3Rpb24oKVxuICAgIGVsc2VcbiAgICAgIEBnZXRTdGFydFNlbGVjdGlvbigpXG5cbiAgZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRIZWFkU2VsZWN0aW9uKCkuZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRUYWlsQnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldFRhaWxTZWxlY3Rpb24oKS5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuXG4gIGdldFN0YXJ0QnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldFN0YXJ0U2VsZWN0aW9uKCkuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuXG4gIGdldEVuZEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRTdGFydFNlbGVjdGlvbigpLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG5cbiAgZ2V0QnVmZmVyUm93UmFuZ2U6IC0+XG4gICAgc3RhcnRSb3cgPSBAZ2V0U3RhcnRTZWxlY3Rpb24oKS5nZXRCdWZmZXJSb3dSYW5nZSgpWzBdXG4gICAgZW5kUm93ID0gQGdldEVuZFNlbGVjdGlvbigpLmdldEJ1ZmZlclJvd1JhbmdlKClbMF1cbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBoZWFkUmV2ZXJzZWRTdGF0ZUlzSW5TeW5jOiAtPlxuICAgIEBpc1JldmVyc2VkKCkgaXMgQGdldEhlYWRTZWxlY3Rpb24oKS5pc1JldmVyc2VkKClcblxuICAjIFtOT1RFXSBVc2VkIGJ5IHBsdWdpbiBwYWNrYWdlIHZtcDptb3ZlLXNlbGVjdGVkLXRleHRcbiAgc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXM6IChyYW5nZXMsIHtyZXZlcnNlZH0pIC0+XG4gICAgc29ydFJhbmdlcyhyYW5nZXMpXG4gICAgcmFuZ2UgPSByYW5nZXMuc2hpZnQoKVxuICAgIEBzZXRIZWFkQnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pXG4gICAgZm9yIHJhbmdlIGluIHJhbmdlc1xuICAgICAgQHNlbGVjdGlvbnMucHVzaCBAZWRpdG9yLmFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlKHJhbmdlLCB7cmV2ZXJzZWR9KVxuICAgIEB1cGRhdGVHb2FsQ29sdW1uKClcblxuICBzb3J0U2VsZWN0aW9uczogLT5cbiAgICBAc2VsZWN0aW9ucz8uc29ydCAoYSwgYikgLT4gYS5jb21wYXJlKGIpXG5cbiAgIyB3aGljaCBtdXN0IG9uZSBvZiBbJ3N0YXJ0JywgJ2VuZCcsICdoZWFkJywgJ3RhaWwnXVxuICBzZXRQb3NpdGlvbkZvclNlbGVjdGlvbnM6ICh3aGljaCkgLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zXG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnNldEJ1ZmZlclBvc2l0aW9uVG8od2hpY2gpXG5cbiAgY2xlYXJTZWxlY3Rpb25zOiAoe2V4Y2VwdH09e30pIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9ucy5zbGljZSgpIHdoZW4gKHNlbGVjdGlvbiBpc250IGV4Y2VwdClcbiAgICAgIEByZW1vdmVTZWxlY3Rpb24oc2VsZWN0aW9uKVxuXG4gIHNldEhlYWRCdWZmZXJQb3NpdGlvbjogKHBvaW50KSAtPlxuICAgIGhlYWQgPSBAZ2V0SGVhZFNlbGVjdGlvbigpXG4gICAgQGNsZWFyU2VsZWN0aW9ucyhleGNlcHQ6IGhlYWQpXG4gICAgaGVhZC5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgcmVtb3ZlRW1wdHlTZWxlY3Rpb25zOiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQHNlbGVjdGlvbnMuc2xpY2UoKSB3aGVuIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIEByZW1vdmVTZWxlY3Rpb24oc2VsZWN0aW9uKVxuXG4gIHJlbW92ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBfLnJlbW92ZShAc2VsZWN0aW9ucywgc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbi5kZXN0cm95KClcblxuICBzZXRIZWFkQnVmZmVyUmFuZ2U6IChyYW5nZSwgb3B0aW9ucykgLT5cbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIHtnb2FsQ29sdW1ufSA9IGhlYWQuY3Vyc29yXG4gICAgIyBXaGVuIHJldmVyc2VkIHN0YXRlIG9mIHNlbGVjdGlvbiBjaGFuZ2UsIGdvYWxDb2x1bW4gaXMgY2xlYXJlZC5cbiAgICAjIEJ1dCBoZXJlIGZvciBibG9ja3dpc2UsIEkgd2FudCB0byBrZWVwIGdvYWxDb2x1bW4gdW5jaGFuZ2VkLlxuICAgICMgVGhpcyBiZWhhdmlvciBpcyBub3QgaWRlbnRpY2FsIHRvIHB1cmUgVmltIEkga25vdy5cbiAgICAjIEJ1dCBJIGJlbGlldmUgdGhpcyBpcyBtb3JlIHVubm9pc3kgYW5kIGxlc3MgY29uZnVzaW9uIHdoaWxlIG1vdmluZ1xuICAgICMgY3Vyc29yIGluIHZpc3VhbC1ibG9jayBtb2RlLlxuICAgIGhlYWQuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIG9wdGlvbnMpXG4gICAgaGVhZC5jdXJzb3IuZ29hbENvbHVtbiA/PSBnb2FsQ29sdW1uIGlmIGdvYWxDb2x1bW4/XG5cbiAgZ2V0Q2hhcmFjdGVyd2lzZVByb3BlcnRpZXM6IC0+XG4gICAgaGVhZCA9IEBnZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHRhaWwgPSBAZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmIEBpc1JldmVyc2VkKClcbiAgICAgIFtzdGFydCwgZW5kXSA9IFtoZWFkLCB0YWlsXVxuICAgIGVsc2VcbiAgICAgIFtzdGFydCwgZW5kXSA9IFt0YWlsLCBoZWFkXVxuXG4gICAgdW5sZXNzIChAaXNTaW5nbGVSb3coKSBvciBAaGVhZFJldmVyc2VkU3RhdGVJc0luU3luYygpKVxuICAgICAgc3RhcnQuY29sdW1uIC09IDFcbiAgICAgIGVuZC5jb2x1bW4gKz0gMVxuICAgIHtoZWFkLCB0YWlsfVxuXG4gIGdldEJ1ZmZlclJhbmdlOiAtPlxuICAgIGlmIEBoZWFkUmV2ZXJzZWRTdGF0ZUlzSW5TeW5jKClcbiAgICAgIHN0YXJ0ID0gQGdldFN0YXJ0U2VsZWN0aW9uLmdldEJ1ZmZlcnJhbmdlKCkuc3RhcnRcbiAgICAgIGVuZCA9IEBnZXRFbmRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5lbmRcbiAgICBlbHNlXG4gICAgICBzdGFydCA9IEBnZXRTdGFydFNlbGVjdGlvbi5nZXRCdWZmZXJyYW5nZSgpLmVuZC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIGVuZCA9IEBnZXRFbmRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5zdGFydC50cmFuc2xhdGUoWzAsICsxXSlcbiAgICB7c3RhcnQsIGVuZH1cblxuICAjIFtGSVhNRV0gZHVwbGljYXRlIGNvZGVzIHdpdGggc2V0SGVhZEJ1ZmZlclJhbmdlXG4gIHJlc3RvcmVDaGFyYWN0ZXJ3aXNlOiAtPlxuICAgICMgV2hlbiBhbGwgc2VsZWN0aW9uIGlzIGVtcHR5LCB3ZSBkb24ndCB3YW50IHRvIGxvb3NlIG11bHRpLWN1cnNvclxuICAgICMgYnkgcmVzdG9yZWluZyBjaGFyYWN0ZXJ3aXNlIHJhbmdlLlxuICAgIHJldHVybiBpZiBAaXNFbXB0eSgpXG5cbiAgICBwcm9wZXJ0aWVzID0gQGdldENoYXJhY3Rlcndpc2VQcm9wZXJ0aWVzKClcbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIHtnb2FsQ29sdW1ufSA9IGhlYWQuY3Vyc29yXG4gICAgc3dyYXAoaGVhZCkuc2VsZWN0QnlQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG5cbiAgICBpZiBoZWFkLmdldEJ1ZmZlclJhbmdlKCkuZW5kLmNvbHVtbiBpcyAwXG4gICAgICBzd3JhcChoZWFkKS50cmFuc2xhdGVTZWxlY3Rpb25FbmRBbmRDbGlwKCdmb3J3YXJkJylcblxuICAgIGhlYWQuY3Vyc29yLmdvYWxDb2x1bW4gPz0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uP1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2Nrd2lzZVNlbGVjdGlvblxuIl19
