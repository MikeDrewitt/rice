(function() {
  var Decrease, Increase, Operator, Range, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Operator = require('./general-operators').Operator;

  Range = require('atom').Range;

  settings = require('../settings');

  Increase = (function(superClass) {
    extend(Increase, superClass);

    Increase.prototype.step = 1;

    function Increase() {
      Increase.__super__.constructor.apply(this, arguments);
      this.complete = true;
      this.numberRegex = new RegExp(settings.numberRegex());
    }

    Increase.prototype.execute = function(count) {
      if (count == null) {
        count = 1;
      }
      return this.editor.transact((function(_this) {
        return function() {
          var cursor, i, increased, len, ref;
          increased = false;
          ref = _this.editor.getCursors();
          for (i = 0, len = ref.length; i < len; i++) {
            cursor = ref[i];
            if (_this.increaseNumber(count, cursor)) {
              increased = true;
            }
          }
          if (!increased) {
            return atom.beep();
          }
        };
      })(this));
    };

    Increase.prototype.increaseNumber = function(count, cursor) {
      var cursorPosition, newValue, numEnd, numStart, number, range;
      cursorPosition = cursor.getBufferPosition();
      numEnd = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.numberRegex,
        allowNext: false
      });
      if (numEnd.column === cursorPosition.column) {
        numEnd = cursor.getEndOfCurrentWordBufferPosition({
          wordRegex: this.numberRegex,
          allowNext: true
        });
        if (numEnd.row !== cursorPosition.row) {
          return;
        }
        if (numEnd.column === cursorPosition.column) {
          return;
        }
      }
      cursor.setBufferPosition(numEnd);
      numStart = cursor.getBeginningOfCurrentWordBufferPosition({
        wordRegex: this.numberRegex,
        allowPrevious: false
      });
      range = new Range(numStart, numEnd);
      number = parseInt(this.editor.getTextInBufferRange(range), 10);
      if (isNaN(number)) {
        cursor.setBufferPosition(cursorPosition);
        return;
      }
      number += this.step * count;
      newValue = String(number);
      this.editor.setTextInBufferRange(range, newValue, {
        normalizeLineEndings: false
      });
      cursor.setBufferPosition({
        row: numStart.row,
        column: numStart.column - 1 + newValue.length
      });
      return true;
    };

    return Increase;

  })(Operator);

  Decrease = (function(superClass) {
    extend(Decrease, superClass);

    function Decrease() {
      return Decrease.__super__.constructor.apply(this, arguments);
    }

    Decrease.prototype.step = -1;

    return Decrease;

  })(Increase);

  module.exports = {
    Increase: Increase,
    Decrease: Decrease
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvb3BlcmF0b3JzL2luY3JlYXNlLW9wZXJhdG9ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZDQUFBO0lBQUE7OztFQUFDLFdBQVksT0FBQSxDQUFRLHFCQUFSOztFQUNaLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUtMOzs7dUJBQ0osSUFBQSxHQUFNOztJQUVPLGtCQUFBO01BQ1gsMkNBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFDLENBQUEsV0FBRCxHQUFtQixJQUFBLE1BQUEsQ0FBTyxRQUFRLENBQUMsV0FBVCxDQUFBLENBQVA7SUFIUjs7dUJBS2IsT0FBQSxHQUFTLFNBQUMsS0FBRDs7UUFBQyxRQUFNOzthQUNkLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDZixjQUFBO1VBQUEsU0FBQSxHQUFZO0FBQ1o7QUFBQSxlQUFBLHFDQUFBOztZQUNFLElBQUcsS0FBQyxDQUFBLGNBQUQsQ0FBZ0IsS0FBaEIsRUFBdUIsTUFBdkIsQ0FBSDtjQUF1QyxTQUFBLEdBQVksS0FBbkQ7O0FBREY7VUFFQSxJQUFBLENBQW1CLFNBQW5CO21CQUFBLElBQUksQ0FBQyxJQUFMLENBQUEsRUFBQTs7UUFKZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFETzs7dUJBT1QsY0FBQSxHQUFnQixTQUFDLEtBQUQsRUFBUSxNQUFSO0FBRWQsVUFBQTtNQUFBLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUE7TUFDakIsTUFBQSxHQUFTLE1BQU0sQ0FBQyxpQ0FBUCxDQUF5QztRQUFBLFNBQUEsRUFBVyxJQUFDLENBQUEsV0FBWjtRQUF5QixTQUFBLEVBQVcsS0FBcEM7T0FBekM7TUFFVCxJQUFHLE1BQU0sQ0FBQyxNQUFQLEtBQWlCLGNBQWMsQ0FBQyxNQUFuQztRQUVFLE1BQUEsR0FBUyxNQUFNLENBQUMsaUNBQVAsQ0FBeUM7VUFBQSxTQUFBLEVBQVcsSUFBQyxDQUFBLFdBQVo7VUFBeUIsU0FBQSxFQUFXLElBQXBDO1NBQXpDO1FBQ1QsSUFBVSxNQUFNLENBQUMsR0FBUCxLQUFnQixjQUFjLENBQUMsR0FBekM7QUFBQSxpQkFBQTs7UUFDQSxJQUFVLE1BQU0sQ0FBQyxNQUFQLEtBQWlCLGNBQWMsQ0FBQyxNQUExQztBQUFBLGlCQUFBO1NBSkY7O01BTUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLE1BQXpCO01BQ0EsUUFBQSxHQUFXLE1BQU0sQ0FBQyx1Q0FBUCxDQUErQztRQUFBLFNBQUEsRUFBVyxJQUFDLENBQUEsV0FBWjtRQUF5QixhQUFBLEVBQWUsS0FBeEM7T0FBL0M7TUFFWCxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sUUFBTixFQUFnQixNQUFoQjtNQUdaLE1BQUEsR0FBUyxRQUFBLENBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixLQUE3QixDQUFULEVBQThDLEVBQTlDO01BQ1QsSUFBRyxLQUFBLENBQU0sTUFBTixDQUFIO1FBQ0UsTUFBTSxDQUFDLGlCQUFQLENBQXlCLGNBQXpCO0FBQ0EsZUFGRjs7TUFJQSxNQUFBLElBQVUsSUFBQyxDQUFBLElBQUQsR0FBTTtNQUdoQixRQUFBLEdBQVcsTUFBQSxDQUFPLE1BQVA7TUFDWCxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLEtBQTdCLEVBQW9DLFFBQXBDLEVBQThDO1FBQUEsb0JBQUEsRUFBc0IsS0FBdEI7T0FBOUM7TUFFQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUI7UUFBQSxHQUFBLEVBQUssUUFBUSxDQUFDLEdBQWQ7UUFBbUIsTUFBQSxFQUFRLFFBQVEsQ0FBQyxNQUFULEdBQWdCLENBQWhCLEdBQWtCLFFBQVEsQ0FBQyxNQUF0RDtPQUF6QjtBQUNBLGFBQU87SUE3Qk87Ozs7S0FmSzs7RUE4Q2pCOzs7Ozs7O3VCQUNKLElBQUEsR0FBTSxDQUFDOzs7O0tBRGM7O0VBR3ZCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUMsVUFBQSxRQUFEO0lBQVcsVUFBQSxRQUFYOztBQXhEakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7T3BlcmF0b3J9ID0gcmVxdWlyZSAnLi9nZW5lcmFsLW9wZXJhdG9ycydcbntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9zZXR0aW5ncydcblxuI1xuIyBJdCBpbmNyZWFzZXMgb3IgZGVjcmVhc2VzIHRoZSBuZXh0IG51bWJlciBvbiB0aGUgbGluZVxuI1xuY2xhc3MgSW5jcmVhc2UgZXh0ZW5kcyBPcGVyYXRvclxuICBzdGVwOiAxXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICBAY29tcGxldGUgPSB0cnVlXG4gICAgQG51bWJlclJlZ2V4ID0gbmV3IFJlZ0V4cChzZXR0aW5ncy5udW1iZXJSZWdleCgpKVxuXG4gIGV4ZWN1dGU6IChjb3VudD0xKSAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGluY3JlYXNlZCA9IGZhbHNlXG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgIGlmIEBpbmNyZWFzZU51bWJlcihjb3VudCwgY3Vyc29yKSB0aGVuIGluY3JlYXNlZCA9IHRydWVcbiAgICAgIGF0b20uYmVlcCgpIHVubGVzcyBpbmNyZWFzZWRcblxuICBpbmNyZWFzZU51bWJlcjogKGNvdW50LCBjdXJzb3IpIC0+XG4gICAgIyBmaW5kIHBvc2l0aW9uIG9mIGN1cnJlbnQgbnVtYmVyLCBhZGFwdGVkIGZyb20gZnJvbSBTZWFyY2hDdXJyZW50V29yZFxuICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBudW1FbmQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHdvcmRSZWdleDogQG51bWJlclJlZ2V4LCBhbGxvd05leHQ6IGZhbHNlKVxuXG4gICAgaWYgbnVtRW5kLmNvbHVtbiBpcyBjdXJzb3JQb3NpdGlvbi5jb2x1bW5cbiAgICAgICMgZWl0aGVyIHdlIGRvbid0IGhhdmUgYSBjdXJyZW50IG51bWJlciwgb3IgaXQgZW5kcyBvbiBjdXJzb3IsIGkuZS4gcHJlY2VkZXMgaXQsIHNvIGxvb2sgZm9yIHRoZSBuZXh0IG9uZVxuICAgICAgbnVtRW5kID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih3b3JkUmVnZXg6IEBudW1iZXJSZWdleCwgYWxsb3dOZXh0OiB0cnVlKVxuICAgICAgcmV0dXJuIGlmIG51bUVuZC5yb3cgaXNudCBjdXJzb3JQb3NpdGlvbi5yb3cgIyBkb24ndCBsb29rIGJleW9uZCB0aGUgY3VycmVudCBsaW5lXG4gICAgICByZXR1cm4gaWYgbnVtRW5kLmNvbHVtbiBpcyBjdXJzb3JQb3NpdGlvbi5jb2x1bW4gIyBubyBudW1iZXIgYWZ0ZXIgY3Vyc29yXG5cbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24gbnVtRW5kXG4gICAgbnVtU3RhcnQgPSBjdXJzb3IuZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHdvcmRSZWdleDogQG51bWJlclJlZ2V4LCBhbGxvd1ByZXZpb3VzOiBmYWxzZSlcblxuICAgIHJhbmdlID0gbmV3IFJhbmdlKG51bVN0YXJ0LCBudW1FbmQpXG5cbiAgICAjIHBhcnNlIG51bWJlciwgaW5jcmVhc2UvZGVjcmVhc2VcbiAgICBudW1iZXIgPSBwYXJzZUludChAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKSwgMTApXG4gICAgaWYgaXNOYU4obnVtYmVyKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGN1cnNvclBvc2l0aW9uKVxuICAgICAgcmV0dXJuXG5cbiAgICBudW1iZXIgKz0gQHN0ZXAqY291bnRcblxuICAgICMgcmVwbGFjZSBjdXJyZW50IG51bWJlciB3aXRoIG5ld1xuICAgIG5ld1ZhbHVlID0gU3RyaW5nKG51bWJlcilcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCBuZXdWYWx1ZSwgbm9ybWFsaXplTGluZUVuZGluZ3M6IGZhbHNlKVxuXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHJvdzogbnVtU3RhcnQucm93LCBjb2x1bW46IG51bVN0YXJ0LmNvbHVtbi0xK25ld1ZhbHVlLmxlbmd0aClcbiAgICByZXR1cm4gdHJ1ZVxuXG5jbGFzcyBEZWNyZWFzZSBleHRlbmRzIEluY3JlYXNlXG4gIHN0ZXA6IC0xXG5cbm1vZHVsZS5leHBvcnRzID0ge0luY3JlYXNlLCBEZWNyZWFzZX1cbiJdfQ==
