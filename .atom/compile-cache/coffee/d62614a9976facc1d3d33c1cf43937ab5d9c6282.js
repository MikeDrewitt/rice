(function() {
  var Disposable, Point, Range, SelectionWrapper, _, getRangeByTranslatePointAndClip, propertyStore, ref, ref1, swrap, translatePointAndClip;

  _ = require('underscore-plus');

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Disposable = ref.Disposable;

  ref1 = require('./utils'), translatePointAndClip = ref1.translatePointAndClip, getRangeByTranslatePointAndClip = ref1.getRangeByTranslatePointAndClip;

  propertyStore = new Map;

  SelectionWrapper = (function() {
    function SelectionWrapper(selection1) {
      this.selection = selection1;
    }

    SelectionWrapper.prototype.hasProperties = function() {
      return propertyStore.has(this.selection);
    };

    SelectionWrapper.prototype.getProperties = function() {
      var ref2;
      return (ref2 = propertyStore.get(this.selection)) != null ? ref2 : {};
    };

    SelectionWrapper.prototype.setProperties = function(prop) {
      return propertyStore.set(this.selection, prop);
    };

    SelectionWrapper.prototype.clearProperties = function() {
      return propertyStore["delete"](this.selection);
    };

    SelectionWrapper.prototype.setBufferRangeSafely = function(range) {
      if (range) {
        this.setBufferRange(range);
        if (this.selection.isLastSelection()) {
          return this.selection.cursor.autoscroll();
        }
      }
    };

    SelectionWrapper.prototype.getBufferRange = function() {
      return this.selection.getBufferRange();
    };

    SelectionWrapper.prototype.getNormalizedBufferPosition = function() {
      var editor, point, screenPoint;
      point = this.selection.getHeadBufferPosition();
      if (this.isForwarding()) {
        editor = this.selection.editor;
        screenPoint = editor.screenPositionForBufferPosition(point).translate([0, -1]);
        return editor.bufferPositionForScreenPosition(screenPoint, {
          clipDirection: 'backward'
        });
      } else {
        return point;
      }
    };

    SelectionWrapper.prototype.normalizeBufferPosition = function() {
      var head, point;
      head = this.selection.getHeadBufferPosition();
      point = this.getNormalizedBufferPosition();
      this.selection.modifySelection((function(_this) {
        return function() {
          return _this.selection.cursor.setBufferPosition(point);
        };
      })(this));
      return new Disposable((function(_this) {
        return function() {
          if (!head.isEqual(point)) {
            return _this.selection.modifySelection(function() {
              return _this.selection.cursor.setBufferPosition(head);
            });
          }
        };
      })(this));
    };

    SelectionWrapper.prototype.getBufferPositionFor = function(which, arg) {
      var allowFallback, end, fromProperty, head, ref2, ref3, ref4, ref5, ref6, start, tail;
      ref2 = arg != null ? arg : {}, fromProperty = ref2.fromProperty, allowFallback = ref2.allowFallback;
      if (fromProperty == null) {
        fromProperty = false;
      }
      if (allowFallback == null) {
        allowFallback = false;
      }
      if (fromProperty && (!this.hasProperties()) && allowFallback) {
        fromProperty = false;
      }
      if (fromProperty) {
        ref3 = this.getProperties(), head = ref3.head, tail = ref3.tail;
        if (head.isGreaterThanOrEqual(tail)) {
          ref4 = [tail, head], start = ref4[0], end = ref4[1];
        } else {
          ref5 = [head, tail], start = ref5[0], end = ref5[1];
        }
      } else {
        ref6 = this.selection.getBufferRange(), start = ref6.start, end = ref6.end;
        head = this.selection.getHeadBufferPosition();
        tail = this.selection.getTailBufferPosition();
      }
      switch (which) {
        case 'start':
          return start;
        case 'end':
          return end;
        case 'head':
          return head;
        case 'tail':
          return tail;
      }
    };

    SelectionWrapper.prototype.setBufferPositionTo = function(which, options) {
      var point;
      point = this.getBufferPositionFor(which, options);
      return this.selection.cursor.setBufferPosition(point);
    };

    SelectionWrapper.prototype.mergeBufferRange = function(range, option) {
      return this.setBufferRange(this.getBufferRange().union(range), option);
    };

    SelectionWrapper.prototype.reverse = function() {
      var head, ref2, tail;
      this.setReversedState(!this.selection.isReversed());
      ref2 = this.getProperties(), head = ref2.head, tail = ref2.tail;
      if ((head != null) && (tail != null)) {
        return this.setProperties({
          head: tail,
          tail: head
        });
      }
    };

    SelectionWrapper.prototype.setReversedState = function(reversed) {
      var options;
      options = {
        autoscroll: true,
        reversed: reversed,
        preserveFolds: true
      };
      return this.setBufferRange(this.getBufferRange(), options);
    };

    SelectionWrapper.prototype.getRows = function() {
      var endRow, i, ref2, results1, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return (function() {
        results1 = [];
        for (var i = startRow; startRow <= endRow ? i <= endRow : i >= endRow; startRow <= endRow ? i++ : i--){ results1.push(i); }
        return results1;
      }).apply(this);
    };

    SelectionWrapper.prototype.getRowCount = function() {
      return this.getRows().length;
    };

    SelectionWrapper.prototype.selectRowRange = function(rowRange) {
      var editor, endRange, range, ref2, startRange;
      editor = this.selection.editor;
      ref2 = rowRange.map(function(row) {
        return editor.bufferRangeForBufferRow(row, {
          includeNewline: true
        });
      }), startRange = ref2[0], endRange = ref2[1];
      range = startRange.union(endRange);
      return this.setBufferRange(range, {
        preserveFolds: true
      });
    };

    SelectionWrapper.prototype.expandOverLine = function(arg) {
      var goalColumn, preserveGoalColumn;
      preserveGoalColumn = (arg != null ? arg : {}).preserveGoalColumn;
      if (preserveGoalColumn) {
        goalColumn = this.selection.cursor.goalColumn;
      }
      this.selectRowRange(this.selection.getBufferRowRange());
      if (goalColumn) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.getRowFor = function(where) {
      var endRow, headRow, ref2, ref3, ref4, startRow, tailRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      if (!this.selection.isReversed()) {
        ref3 = [startRow, endRow], headRow = ref3[0], tailRow = ref3[1];
      } else {
        ref4 = [endRow, startRow], headRow = ref4[0], tailRow = ref4[1];
      }
      switch (where) {
        case 'start':
          return startRow;
        case 'end':
          return endRow;
        case 'head':
          return headRow;
        case 'tail':
          return tailRow;
      }
    };

    SelectionWrapper.prototype.getHeadRow = function() {
      return this.getRowFor('head');
    };

    SelectionWrapper.prototype.getTailRow = function() {
      return this.getRowFor('tail');
    };

    SelectionWrapper.prototype.getStartRow = function() {
      return this.getRowFor('start');
    };

    SelectionWrapper.prototype.getEndRow = function() {
      return this.getRowFor('end');
    };

    SelectionWrapper.prototype.getTailBufferRange = function() {
      var editor, point, tailPoint;
      editor = this.selection.editor;
      tailPoint = this.selection.getTailBufferPosition();
      if (this.selection.isReversed()) {
        point = translatePointAndClip(editor, tailPoint, 'backward');
        return new Range(point, tailPoint);
      } else {
        point = translatePointAndClip(editor, tailPoint, 'forward', {
          hello: 'when getting tailRange'
        });
        return new Range(tailPoint, point);
      }
    };

    SelectionWrapper.prototype.saveProperties = function() {
      var endPoint, properties;
      properties = this.captureProperties();
      if (!this.selection.isEmpty()) {
        endPoint = this.selection.getBufferRange().end.translate([0, -1]);
        endPoint = this.selection.editor.clipBufferPosition(endPoint);
        if (this.selection.isReversed()) {
          properties.tail = endPoint;
        } else {
          properties.head = endPoint;
        }
      }
      return this.setProperties(properties);
    };

    SelectionWrapper.prototype.captureProperties = function() {
      return {
        head: this.selection.getHeadBufferPosition(),
        tail: this.selection.getTailBufferPosition()
      };
    };

    SelectionWrapper.prototype.selectByProperties = function(arg) {
      var head, tail;
      head = arg.head, tail = arg.tail;
      this.setBufferRange([tail, head]);
      return this.setReversedState(head.isLessThan(tail));
    };

    SelectionWrapper.prototype.isForwarding = function() {
      var head, tail;
      head = this.selection.getHeadBufferPosition();
      tail = this.selection.getTailBufferPosition();
      return head.isGreaterThan(tail);
    };

    SelectionWrapper.prototype.restoreColumnFromProperties = function() {
      var end, head, ref2, ref3, ref4, ref5, start, tail;
      ref2 = this.getProperties(), head = ref2.head, tail = ref2.tail;
      if (!((head != null) && (tail != null))) {
        return;
      }
      if (this.selection.isEmpty()) {
        return;
      }
      if (this.selection.isReversed()) {
        ref3 = [head, tail], start = ref3[0], end = ref3[1];
      } else {
        ref4 = [tail, head], start = ref4[0], end = ref4[1];
      }
      ref5 = this.selection.getBufferRowRange(), start.row = ref5[0], end.row = ref5[1];
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          _this.setBufferRange([start, end], {
            preserveFolds: true
          });
          return _this.translateSelectionEndAndClip('backward', {
            translate: false
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.setBufferRange = function(range, options) {
      if (options == null) {
        options = {};
      }
      if (options.autoscroll == null) {
        options.autoscroll = false;
      }
      return this.selection.setBufferRange(range, options);
    };

    SelectionWrapper.prototype.replace = function(text) {
      var originalText;
      originalText = this.selection.getText();
      this.selection.insertText(text);
      return originalText;
    };

    SelectionWrapper.prototype.lineTextForBufferRows = function() {
      var editor;
      editor = this.selection.editor;
      return this.getRows().map(function(row) {
        return editor.lineTextForBufferRow(row);
      });
    };

    SelectionWrapper.prototype.translate = function(startDelta, endDelta, options) {
      var newRange;
      if (endDelta == null) {
        endDelta = startDelta;
      }
      newRange = this.getBufferRange().translate(startDelta, endDelta);
      return this.setBufferRange(newRange, options);
    };

    SelectionWrapper.prototype.isSingleRow = function() {
      var endRow, ref2, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return startRow === endRow;
    };

    SelectionWrapper.prototype.isLinewise = function() {
      var end, ref2, ref3, start;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      return (start.row !== end.row) && ((start.column === (ref3 = end.column) && ref3 === 0));
    };

    SelectionWrapper.prototype.detectVisualModeSubmode = function() {
      if (this.selection.isEmpty()) {
        return null;
      } else if (this.isLinewise()) {
        return 'linewise';
      } else {
        return 'characterwise';
      }
    };

    SelectionWrapper.prototype.withKeepingGoalColumn = function(fn) {
      var end, goalColumn, ref2, start;
      goalColumn = this.selection.cursor.goalColumn;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      fn();
      if (goalColumn) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.translateSelectionEndAndClip = function(direction, options) {
      var editor, newRange, range;
      editor = this.selection.editor;
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, "end", direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.translateSelectionHeadAndClip = function(direction, options) {
      var editor, newRange, range, which;
      editor = this.selection.editor;
      which = this.selection.isReversed() ? 'start' : 'end';
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, which, direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    return SelectionWrapper;

  })();

  swrap = function(selection) {
    return new SelectionWrapper(selection);
  };

  swrap.setReversedState = function(editor, reversed) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).setReversedState(reversed);
    });
  };

  swrap.expandOverLine = function(editor, options) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).expandOverLine(options);
    });
  };

  swrap.reverse = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).reverse();
    });
  };

  swrap.clearProperties = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).clearProperties();
    });
  };

  swrap.detectVisualModeSubmode = function(editor) {
    var results, selection, selections;
    selections = editor.getSelections();
    results = (function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = selections.length; i < len; i++) {
        selection = selections[i];
        results1.push(swrap(selection).detectVisualModeSubmode());
      }
      return results1;
    })();
    if (results.every(function(r) {
      return r === 'linewise';
    })) {
      return 'linewise';
    } else if (results.some(function(r) {
      return r === 'characterwise';
    })) {
      return 'characterwise';
    } else {
      return null;
    }
  };

  swrap.updateSelectionProperties = function(editor, arg) {
    var i, len, ref2, results1, selection, unknownOnly;
    unknownOnly = (arg != null ? arg : {}).unknownOnly;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      if (unknownOnly && swrap(selection).hasProperties()) {
        continue;
      }
      results1.push(swrap(selection).saveProperties());
    }
    return results1;
  };

  module.exports = swrap;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWxlY3Rpb24td3JhcHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBNkIsT0FBQSxDQUFRLE1BQVIsQ0FBN0IsRUFBQyxpQkFBRCxFQUFRLGlCQUFSLEVBQWU7O0VBQ2YsT0FHSSxPQUFBLENBQVEsU0FBUixDQUhKLEVBQ0Usa0RBREYsRUFFRTs7RUFHRixhQUFBLEdBQWdCLElBQUk7O0VBRWQ7SUFDUywwQkFBQyxVQUFEO01BQUMsSUFBQyxDQUFBLFlBQUQ7SUFBRDs7K0JBRWIsYUFBQSxHQUFlLFNBQUE7YUFBRyxhQUFhLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsU0FBbkI7SUFBSDs7K0JBQ2YsYUFBQSxHQUFlLFNBQUE7QUFBRyxVQUFBO3lFQUFnQztJQUFuQzs7K0JBQ2YsYUFBQSxHQUFlLFNBQUMsSUFBRDthQUFVLGFBQWEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxTQUFuQixFQUE4QixJQUE5QjtJQUFWOzsrQkFDZixlQUFBLEdBQWlCLFNBQUE7YUFBRyxhQUFhLEVBQUMsTUFBRCxFQUFiLENBQXFCLElBQUMsQ0FBQSxTQUF0QjtJQUFIOzsrQkFFakIsb0JBQUEsR0FBc0IsU0FBQyxLQUFEO01BQ3BCLElBQUcsS0FBSDtRQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCO1FBQ0EsSUFBRyxJQUFDLENBQUEsU0FBUyxDQUFDLGVBQVgsQ0FBQSxDQUFIO2lCQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQWxCLENBQUEsRUFERjtTQUZGOztJQURvQjs7K0JBTXRCLGNBQUEsR0FBZ0IsU0FBQTthQUNkLElBQUMsQ0FBQSxTQUFTLENBQUMsY0FBWCxDQUFBO0lBRGM7OytC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Q0FBQTs7TUFDRSxJQUFZLFdBQUEsSUFBZ0IsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyxhQUFqQixDQUFBLENBQTVCO0FBQUEsaUJBQUE7O29CQUNBLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsY0FBakIsQ0FBQTtBQUZGOztFQURnQzs7RUFLbEMsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF2UmpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntSYW5nZSwgUG9pbnQsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntcbiAgdHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXBcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5wcm9wZXJ0eVN0b3JlID0gbmV3IE1hcFxuXG5jbGFzcyBTZWxlY3Rpb25XcmFwcGVyXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdGlvbikgLT5cblxuICBoYXNQcm9wZXJ0aWVzOiAtPiBwcm9wZXJ0eVN0b3JlLmhhcyhAc2VsZWN0aW9uKVxuICBnZXRQcm9wZXJ0aWVzOiAtPiBwcm9wZXJ0eVN0b3JlLmdldChAc2VsZWN0aW9uKSA/IHt9XG4gIHNldFByb3BlcnRpZXM6IChwcm9wKSAtPiBwcm9wZXJ0eVN0b3JlLnNldChAc2VsZWN0aW9uLCBwcm9wKVxuICBjbGVhclByb3BlcnRpZXM6IC0+IHByb3BlcnR5U3RvcmUuZGVsZXRlKEBzZWxlY3Rpb24pXG5cbiAgc2V0QnVmZmVyUmFuZ2VTYWZlbHk6IChyYW5nZSkgLT5cbiAgICBpZiByYW5nZVxuICAgICAgQHNldEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgaWYgQHNlbGVjdGlvbi5pc0xhc3RTZWxlY3Rpb24oKVxuICAgICAgICBAc2VsZWN0aW9uLmN1cnNvci5hdXRvc2Nyb2xsKClcblxuICBnZXRCdWZmZXJSYW5nZTogLT5cbiAgICBAc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcblxuICBnZXROb3JtYWxpemVkQnVmZmVyUG9zaXRpb246IC0+XG4gICAgcG9pbnQgPSBAc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgQGlzRm9yd2FyZGluZygpXG4gICAgICB7ZWRpdG9yfSA9IEBzZWxlY3Rpb25cbiAgICAgIHNjcmVlblBvaW50ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24ocG9pbnQpLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgICAgZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9pbnQsIGNsaXBEaXJlY3Rpb246ICdiYWNrd2FyZCcpXG4gICAgZWxzZVxuICAgICAgcG9pbnRcblxuICAjIFJldHVybiBmdW5jdGlvbiB0byBkaXNwb3NlKD1yZXZlcnQpIG5vcm1hbGl6YXRpb24uXG4gIG5vcm1hbGl6ZUJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIGhlYWQgPSBAc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgcG9pbnQgPSBAZ2V0Tm9ybWFsaXplZEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgQHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgdW5sZXNzIGhlYWQuaXNFcXVhbChwb2ludClcbiAgICAgICAgQHNlbGVjdGlvbi5tb2RpZnlTZWxlY3Rpb24gPT5cbiAgICAgICAgICBAc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihoZWFkKVxuXG4gIGdldEJ1ZmZlclBvc2l0aW9uRm9yOiAod2hpY2gsIHtmcm9tUHJvcGVydHksIGFsbG93RmFsbGJhY2t9PXt9KSAtPlxuICAgIGZyb21Qcm9wZXJ0eSA/PSBmYWxzZVxuICAgIGFsbG93RmFsbGJhY2sgPz0gZmFsc2VcblxuICAgIGlmIGZyb21Qcm9wZXJ0eSBhbmQgKG5vdCBAaGFzUHJvcGVydGllcygpKSBhbmQgYWxsb3dGYWxsYmFja1xuICAgICAgZnJvbVByb3BlcnR5ID0gZmFsc2VcblxuICAgIGlmIGZyb21Qcm9wZXJ0eVxuICAgICAge2hlYWQsIHRhaWx9ID0gQGdldFByb3BlcnRpZXMoKVxuICAgICAgaWYgaGVhZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbCh0YWlsKVxuICAgICAgICBbc3RhcnQsIGVuZF0gPSBbdGFpbCwgaGVhZF1cbiAgICAgIGVsc2VcbiAgICAgICAgW3N0YXJ0LCBlbmRdID0gW2hlYWQsIHRhaWxdXG4gICAgZWxzZVxuICAgICAge3N0YXJ0LCBlbmR9ID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBoZWFkID0gQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgICAgdGFpbCA9IEBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIHN3aXRjaCB3aGljaFxuICAgICAgd2hlbiAnc3RhcnQnIHRoZW4gc3RhcnRcbiAgICAgIHdoZW4gJ2VuZCcgdGhlbiBlbmRcbiAgICAgIHdoZW4gJ2hlYWQnIHRoZW4gaGVhZFxuICAgICAgd2hlbiAndGFpbCcgdGhlbiB0YWlsXG5cbiAgIyBvcHRpb25zOiB7ZnJvbVByb3BlcnR5fVxuICBzZXRCdWZmZXJQb3NpdGlvblRvOiAod2hpY2gsIG9wdGlvbnMpIC0+XG4gICAgcG9pbnQgPSBAZ2V0QnVmZmVyUG9zaXRpb25Gb3Iod2hpY2gsIG9wdGlvbnMpXG4gICAgQHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgbWVyZ2VCdWZmZXJSYW5nZTogKHJhbmdlLCBvcHRpb24pIC0+XG4gICAgQHNldEJ1ZmZlclJhbmdlKEBnZXRCdWZmZXJSYW5nZSgpLnVuaW9uKHJhbmdlKSwgb3B0aW9uKVxuXG4gIHJldmVyc2U6IC0+XG4gICAgQHNldFJldmVyc2VkU3RhdGUobm90IEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpKVxuXG4gICAge2hlYWQsIHRhaWx9ID0gQGdldFByb3BlcnRpZXMoKVxuICAgIGlmIGhlYWQ/IGFuZCB0YWlsP1xuICAgICAgQHNldFByb3BlcnRpZXMoaGVhZDogdGFpbCwgdGFpbDogaGVhZClcblxuICBzZXRSZXZlcnNlZFN0YXRlOiAocmV2ZXJzZWQpIC0+XG4gICAgb3B0aW9ucyA9IHthdXRvc2Nyb2xsOiB0cnVlLCByZXZlcnNlZCwgcHJlc2VydmVGb2xkczogdHJ1ZX1cbiAgICBAc2V0QnVmZmVyUmFuZ2UoQGdldEJ1ZmZlclJhbmdlKCksIG9wdGlvbnMpXG5cbiAgZ2V0Um93czogLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBbc3RhcnRSb3cuLmVuZFJvd11cblxuICBnZXRSb3dDb3VudDogLT5cbiAgICBAZ2V0Um93cygpLmxlbmd0aFxuXG4gIHNlbGVjdFJvd1JhbmdlOiAocm93UmFuZ2UpIC0+XG4gICAge2VkaXRvcn0gPSBAc2VsZWN0aW9uXG4gICAgW3N0YXJ0UmFuZ2UsIGVuZFJhbmdlXSA9IHJvd1JhbmdlLm1hcCAocm93KSAtPlxuICAgICAgZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdywgaW5jbHVkZU5ld2xpbmU6IHRydWUpXG4gICAgcmFuZ2UgPSBzdGFydFJhbmdlLnVuaW9uKGVuZFJhbmdlKVxuICAgIEBzZXRCdWZmZXJSYW5nZShyYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICAjIE5hdGl2ZSBzZWxlY3Rpb24uZXhwYW5kT3ZlckxpbmUgaXMgbm90IGF3YXJlIG9mIGFjdHVhbCByb3dSYW5nZSBvZiBzZWxlY3Rpb24uXG4gIGV4cGFuZE92ZXJMaW5lOiAoe3ByZXNlcnZlR29hbENvbHVtbn09e30pIC0+XG4gICAgaWYgcHJlc2VydmVHb2FsQ29sdW1uXG4gICAgICB7Z29hbENvbHVtbn0gPSBAc2VsZWN0aW9uLmN1cnNvclxuXG4gICAgQHNlbGVjdFJvd1JhbmdlKEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKSlcbiAgICBAc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uID0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uXG5cbiAgZ2V0Um93Rm9yOiAod2hlcmUpIC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgdW5sZXNzIEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBbaGVhZFJvdywgdGFpbFJvd10gPSBbc3RhcnRSb3csIGVuZFJvd11cbiAgICBlbHNlXG4gICAgICBbaGVhZFJvdywgdGFpbFJvd10gPSBbZW5kUm93LCBzdGFydFJvd11cblxuICAgIHN3aXRjaCB3aGVyZVxuICAgICAgd2hlbiAnc3RhcnQnIHRoZW4gc3RhcnRSb3dcbiAgICAgIHdoZW4gJ2VuZCcgdGhlbiBlbmRSb3dcbiAgICAgIHdoZW4gJ2hlYWQnIHRoZW4gaGVhZFJvd1xuICAgICAgd2hlbiAndGFpbCcgdGhlbiB0YWlsUm93XG5cbiAgZ2V0SGVhZFJvdzogLT4gQGdldFJvd0ZvcignaGVhZCcpXG4gIGdldFRhaWxSb3c6IC0+IEBnZXRSb3dGb3IoJ3RhaWwnKVxuICBnZXRTdGFydFJvdzogLT4gQGdldFJvd0Zvcignc3RhcnQnKVxuICBnZXRFbmRSb3c6IC0+IEBnZXRSb3dGb3IoJ2VuZCcpXG5cbiAgZ2V0VGFpbEJ1ZmZlclJhbmdlOiAtPlxuICAgIHtlZGl0b3J9ID0gQHNlbGVjdGlvblxuICAgIHRhaWxQb2ludCA9IEBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgcG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoZWRpdG9yLCB0YWlsUG9pbnQsICdiYWNrd2FyZCcpXG4gICAgICBuZXcgUmFuZ2UocG9pbnQsIHRhaWxQb2ludClcbiAgICBlbHNlXG4gICAgICBwb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChlZGl0b3IsIHRhaWxQb2ludCwgJ2ZvcndhcmQnLCBoZWxsbzogJ3doZW4gZ2V0dGluZyB0YWlsUmFuZ2UnKVxuICAgICAgbmV3IFJhbmdlKHRhaWxQb2ludCwgcG9pbnQpXG5cbiAgc2F2ZVByb3BlcnRpZXM6IC0+XG4gICAgcHJvcGVydGllcyA9IEBjYXB0dXJlUHJvcGVydGllcygpXG4gICAgdW5sZXNzIEBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICAjIFdlIHNlbGVjdCByaWdodGVkIGluIHZpc3VhbC1tb2RlLCB0aGlzIHRyYW5zbGF0aW9uIGRlLWVmZmVjdCBzZWxlY3QtcmlnaHQtZWZmZWN0XG4gICAgICAjIHNvIHRoYXQgYWZ0ZXIgcmVzdG9yaW5nIHByZXNlcnZlZCBwb3BlcnR5IHdlIGNhbiBkbyBhY3RpdmF0ZS12aXN1YWwgbW9kZSB3aXRob3V0XG4gICAgICAjIHNwZWNpYWwgY2FyZVxuICAgICAgZW5kUG9pbnQgPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgICAgZW5kUG9pbnQgPSBAc2VsZWN0aW9uLmVkaXRvci5jbGlwQnVmZmVyUG9zaXRpb24oZW5kUG9pbnQpXG4gICAgICBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgICBwcm9wZXJ0aWVzLnRhaWwgPSBlbmRQb2ludFxuICAgICAgZWxzZVxuICAgICAgICBwcm9wZXJ0aWVzLmhlYWQgPSBlbmRQb2ludFxuICAgIEBzZXRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpXG5cbiAgY2FwdHVyZVByb3BlcnRpZXM6IC0+XG4gICAgaGVhZDogQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHRhaWw6IEBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICBzZWxlY3RCeVByb3BlcnRpZXM6ICh7aGVhZCwgdGFpbH0pIC0+XG4gICAgIyBObyBwcm9ibGVtIGlmIGhlYWQgaXMgZ3JlYXRlciB0aGFuIHRhaWwsIFJhbmdlIGNvbnN0cnVjdG9yIHN3YXAgc3RhcnQvZW5kLlxuICAgIEBzZXRCdWZmZXJSYW5nZShbdGFpbCwgaGVhZF0pXG4gICAgQHNldFJldmVyc2VkU3RhdGUoaGVhZC5pc0xlc3NUaGFuKHRhaWwpKVxuXG4gICMgUmV0dXJuIHRydWUgaWYgc2VsZWN0aW9uIHdhcyBub24tZW1wdHkgYW5kIG5vbi1yZXZlcnNlZCBzZWxlY3Rpb24uXG4gICMgRXF1aXZhbGVudCB0byBub3Qgc2VsZWN0aW9uLmlzRW1wdHkoKSBhbmQgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcIlxuICBpc0ZvcndhcmRpbmc6IC0+XG4gICAgaGVhZCA9IEBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0YWlsID0gQHNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuICAgIGhlYWQuaXNHcmVhdGVyVGhhbih0YWlsKVxuXG4gIHJlc3RvcmVDb2x1bW5Gcm9tUHJvcGVydGllczogLT5cbiAgICB7aGVhZCwgdGFpbH0gPSBAZ2V0UHJvcGVydGllcygpXG4gICAgcmV0dXJuIHVubGVzcyBoZWFkPyBhbmQgdGFpbD9cbiAgICByZXR1cm4gaWYgQHNlbGVjdGlvbi5pc0VtcHR5KClcblxuICAgIGlmIEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBbc3RhcnQsIGVuZF0gPSBbaGVhZCwgdGFpbF1cbiAgICBlbHNlXG4gICAgICBbc3RhcnQsIGVuZF0gPSBbdGFpbCwgaGVhZF1cbiAgICBbc3RhcnQucm93LCBlbmQucm93XSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIEB3aXRoS2VlcGluZ0dvYWxDb2x1bW4gPT5cbiAgICAgIEBzZXRCdWZmZXJSYW5nZShbc3RhcnQsIGVuZF0sIHByZXNlcnZlRm9sZHM6IHRydWUpXG4gICAgICBAdHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnYmFja3dhcmQnLCB0cmFuc2xhdGU6IGZhbHNlKVxuXG4gICMgT25seSBmb3Igc2V0dGluZyBhdXRvc2Nyb2xsIG9wdGlvbiB0byBmYWxzZSBieSBkZWZhdWx0XG4gIHNldEJ1ZmZlclJhbmdlOiAocmFuZ2UsIG9wdGlvbnM9e30pIC0+XG4gICAgb3B0aW9ucy5hdXRvc2Nyb2xsID89IGZhbHNlXG4gICAgQHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZSwgb3B0aW9ucylcblxuICAjIFJldHVybiBvcmlnaW5hbCB0ZXh0XG4gIHJlcGxhY2U6ICh0ZXh0KSAtPlxuICAgIG9yaWdpbmFsVGV4dCA9IEBzZWxlY3Rpb24uZ2V0VGV4dCgpXG4gICAgQHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQpXG4gICAgb3JpZ2luYWxUZXh0XG5cbiAgbGluZVRleHRGb3JCdWZmZXJSb3dzOiAtPlxuICAgIHtlZGl0b3J9ID0gQHNlbGVjdGlvblxuICAgIEBnZXRSb3dzKCkubWFwIChyb3cpIC0+XG4gICAgICBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVxuXG4gIHRyYW5zbGF0ZTogKHN0YXJ0RGVsdGEsIGVuZERlbHRhPXN0YXJ0RGVsdGEsIG9wdGlvbnMpIC0+XG4gICAgbmV3UmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKS50cmFuc2xhdGUoc3RhcnREZWx0YSwgZW5kRGVsdGEpXG4gICAgQHNldEJ1ZmZlclJhbmdlKG5ld1JhbmdlLCBvcHRpb25zKVxuXG4gIGlzU2luZ2xlUm93OiAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIHN0YXJ0Um93IGlzIGVuZFJvd1xuXG4gIGlzTGluZXdpc2U6IC0+XG4gICAge3N0YXJ0LCBlbmR9ID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICAoc3RhcnQucm93IGlzbnQgZW5kLnJvdykgYW5kIChzdGFydC5jb2x1bW4gaXMgZW5kLmNvbHVtbiBpcyAwKVxuXG4gIGRldGVjdFZpc3VhbE1vZGVTdWJtb2RlOiAtPlxuICAgIGlmIEBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBudWxsXG4gICAgZWxzZSBpZiBAaXNMaW5ld2lzZSgpXG4gICAgICAnbGluZXdpc2UnXG4gICAgZWxzZVxuICAgICAgJ2NoYXJhY3Rlcndpc2UnXG5cbiAgd2l0aEtlZXBpbmdHb2FsQ29sdW1uOiAoZm4pIC0+XG4gICAge2dvYWxDb2x1bW59ID0gQHNlbGVjdGlvbi5jdXJzb3JcbiAgICB7c3RhcnQsIGVuZH0gPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGZuKClcbiAgICBAc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uID0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uXG5cbiAgIyBkaXJlY3Rpb24gbXVzdCBiZSBvbmUgb2YgWydmb3J3YXJkJywgJ2JhY2t3YXJkJ11cbiAgIyBvcHRpb25zOiB7dHJhbnNsYXRlOiB0cnVlIG9yIGZhbHNlfSBkZWZhdWx0IHRydWVcbiAgdHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcDogKGRpcmVjdGlvbiwgb3B0aW9ucykgLT5cbiAgICBlZGl0b3IgPSBAc2VsZWN0aW9uLmVkaXRvclxuICAgIHJhbmdlID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICBuZXdSYW5nZSA9IGdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXAoZWRpdG9yLCByYW5nZSwgXCJlbmRcIiwgZGlyZWN0aW9uLCBvcHRpb25zKVxuICAgIEB3aXRoS2VlcGluZ0dvYWxDb2x1bW4gPT5cbiAgICAgIEBzZXRCdWZmZXJSYW5nZShuZXdSYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICB0cmFuc2xhdGVTZWxlY3Rpb25IZWFkQW5kQ2xpcDogKGRpcmVjdGlvbiwgb3B0aW9ucykgLT5cbiAgICBlZGl0b3IgPSBAc2VsZWN0aW9uLmVkaXRvclxuICAgIHdoaWNoICA9IGlmIEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpIHRoZW4gJ3N0YXJ0JyBlbHNlICdlbmQnXG5cbiAgICByYW5nZSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgbmV3UmFuZ2UgPSBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgcmFuZ2UsIHdoaWNoLCBkaXJlY3Rpb24sIG9wdGlvbnMpXG4gICAgQHdpdGhLZWVwaW5nR29hbENvbHVtbiA9PlxuICAgICAgQHNldEJ1ZmZlclJhbmdlKG5ld1JhbmdlLCBwcmVzZXJ2ZUZvbGRzOiB0cnVlKVxuXG5zd3JhcCA9IChzZWxlY3Rpb24pIC0+XG4gIG5ldyBTZWxlY3Rpb25XcmFwcGVyKHNlbGVjdGlvbilcblxuc3dyYXAuc2V0UmV2ZXJzZWRTdGF0ZSA9IChlZGl0b3IsIHJldmVyc2VkKSAtPlxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZvckVhY2ggKHNlbGVjdGlvbikgLT5cbiAgICBzd3JhcChzZWxlY3Rpb24pLnNldFJldmVyc2VkU3RhdGUocmV2ZXJzZWQpXG5cbnN3cmFwLmV4cGFuZE92ZXJMaW5lID0gKGVkaXRvciwgb3B0aW9ucykgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pIC0+XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5leHBhbmRPdmVyTGluZShvcHRpb25zKVxuXG5zd3JhcC5yZXZlcnNlID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pIC0+XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5yZXZlcnNlKClcblxuc3dyYXAuY2xlYXJQcm9wZXJ0aWVzID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pIC0+XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5jbGVhclByb3BlcnRpZXMoKVxuXG5zd3JhcC5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZSA9IChlZGl0b3IpIC0+XG4gIHNlbGVjdGlvbnMgPSBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gIHJlc3VsdHMgPSAoc3dyYXAoc2VsZWN0aW9uKS5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZSgpIGZvciBzZWxlY3Rpb24gaW4gc2VsZWN0aW9ucylcblxuICBpZiByZXN1bHRzLmV2ZXJ5KChyKSAtPiByIGlzICdsaW5ld2lzZScpXG4gICAgJ2xpbmV3aXNlJ1xuICBlbHNlIGlmIHJlc3VsdHMuc29tZSgocikgLT4gciBpcyAnY2hhcmFjdGVyd2lzZScpXG4gICAgJ2NoYXJhY3Rlcndpc2UnXG4gIGVsc2VcbiAgICBudWxsXG5cbnN3cmFwLnVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXMgPSAoZWRpdG9yLCB7dW5rbm93bk9ubHl9PXt9KSAtPlxuICBmb3Igc2VsZWN0aW9uIGluIGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBjb250aW51ZSBpZiB1bmtub3duT25seSBhbmQgc3dyYXAoc2VsZWN0aW9uKS5oYXNQcm9wZXJ0aWVzKClcbiAgICBzd3JhcChzZWxlY3Rpb24pLnNhdmVQcm9wZXJ0aWVzKClcblxubW9kdWxlLmV4cG9ydHMgPSBzd3JhcFxuIl19
