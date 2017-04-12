(function() {
  var Scroll, ScrollCursor, ScrollCursorToBottom, ScrollCursorToLeft, ScrollCursorToMiddle, ScrollCursorToRight, ScrollCursorToTop, ScrollDown, ScrollHorizontal, ScrollUp,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Scroll = (function() {
    Scroll.prototype.isComplete = function() {
      return true;
    };

    Scroll.prototype.isRecordable = function() {
      return false;
    };

    function Scroll(editorElement) {
      this.editorElement = editorElement;
      this.scrolloff = 2;
      this.editor = this.editorElement.getModel();
      this.rows = {
        first: this.editorElement.getFirstVisibleScreenRow(),
        last: this.editorElement.getLastVisibleScreenRow(),
        final: this.editor.getLastScreenRow()
      };
    }

    return Scroll;

  })();

  ScrollDown = (function(superClass) {
    extend(ScrollDown, superClass);

    function ScrollDown() {
      return ScrollDown.__super__.constructor.apply(this, arguments);
    }

    ScrollDown.prototype.execute = function(count) {
      var cursor, i, len, newFirstRow, oldFirstRow, position, ref;
      if (count == null) {
        count = 1;
      }
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow + count);
      newFirstRow = this.editor.getFirstVisibleScreenRow();
      ref = this.editor.getCursors();
      for (i = 0, len = ref.length; i < len; i++) {
        cursor = ref[i];
        position = cursor.getScreenPosition();
        if (position.row <= newFirstRow + this.scrolloff) {
          cursor.setScreenPosition([position.row + newFirstRow - oldFirstRow, position.column], {
            autoscroll: false
          });
        }
      }
      this.editorElement.component.updateSync();
    };

    return ScrollDown;

  })(Scroll);

  ScrollUp = (function(superClass) {
    extend(ScrollUp, superClass);

    function ScrollUp() {
      return ScrollUp.__super__.constructor.apply(this, arguments);
    }

    ScrollUp.prototype.execute = function(count) {
      var cursor, i, len, newLastRow, oldFirstRow, oldLastRow, position, ref;
      if (count == null) {
        count = 1;
      }
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      oldLastRow = this.editor.getLastVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow - count);
      newLastRow = this.editor.getLastVisibleScreenRow();
      ref = this.editor.getCursors();
      for (i = 0, len = ref.length; i < len; i++) {
        cursor = ref[i];
        position = cursor.getScreenPosition();
        if (position.row >= newLastRow - this.scrolloff) {
          cursor.setScreenPosition([position.row - (oldLastRow - newLastRow), position.column], {
            autoscroll: false
          });
        }
      }
      this.editorElement.component.updateSync();
    };

    return ScrollUp;

  })(Scroll);

  ScrollCursor = (function(superClass) {
    extend(ScrollCursor, superClass);

    function ScrollCursor(editorElement, opts) {
      var cursor;
      this.editorElement = editorElement;
      this.opts = opts != null ? opts : {};
      ScrollCursor.__super__.constructor.apply(this, arguments);
      cursor = this.editor.getCursorScreenPosition();
      this.pixel = this.editorElement.pixelPositionForScreenPosition(cursor).top;
    }

    return ScrollCursor;

  })(Scroll);

  ScrollCursorToTop = (function(superClass) {
    extend(ScrollCursorToTop, superClass);

    function ScrollCursorToTop() {
      return ScrollCursorToTop.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTop.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollUp();
    };

    ScrollCursorToTop.prototype.scrollUp = function() {
      if (this.rows.last === this.rows.final) {
        return;
      }
      this.pixel -= this.editor.getLineHeightInPixels() * this.scrolloff;
      return this.editorElement.setScrollTop(this.pixel);
    };

    ScrollCursorToTop.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToTop;

  })(ScrollCursor);

  ScrollCursorToMiddle = (function(superClass) {
    extend(ScrollCursorToMiddle, superClass);

    function ScrollCursorToMiddle() {
      return ScrollCursorToMiddle.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddle.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollMiddle();
    };

    ScrollCursorToMiddle.prototype.scrollMiddle = function() {
      this.pixel -= this.editorElement.getHeight() / 2;
      return this.editorElement.setScrollTop(this.pixel);
    };

    ScrollCursorToMiddle.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToMiddle;

  })(ScrollCursor);

  ScrollCursorToBottom = (function(superClass) {
    extend(ScrollCursorToBottom, superClass);

    function ScrollCursorToBottom() {
      return ScrollCursorToBottom.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottom.prototype.execute = function() {
      if (!this.opts.leaveCursor) {
        this.moveToFirstNonBlank();
      }
      return this.scrollDown();
    };

    ScrollCursorToBottom.prototype.scrollDown = function() {
      var offset;
      if (this.rows.first === 0) {
        return;
      }
      offset = this.editor.getLineHeightInPixels() * (this.scrolloff + 1);
      this.pixel -= this.editorElement.getHeight() - offset;
      return this.editorElement.setScrollTop(this.pixel);
    };

    ScrollCursorToBottom.prototype.moveToFirstNonBlank = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    return ScrollCursorToBottom;

  })(ScrollCursor);

  ScrollHorizontal = (function() {
    ScrollHorizontal.prototype.isComplete = function() {
      return true;
    };

    ScrollHorizontal.prototype.isRecordable = function() {
      return false;
    };

    function ScrollHorizontal(editorElement) {
      var cursorPos;
      this.editorElement = editorElement;
      this.editor = this.editorElement.getModel();
      cursorPos = this.editor.getCursorScreenPosition();
      this.pixel = this.editorElement.pixelPositionForScreenPosition(cursorPos).left;
      this.cursor = this.editor.getLastCursor();
    }

    ScrollHorizontal.prototype.putCursorOnScreen = function() {
      return this.editor.scrollToCursorPosition({
        center: false
      });
    };

    return ScrollHorizontal;

  })();

  ScrollCursorToLeft = (function(superClass) {
    extend(ScrollCursorToLeft, superClass);

    function ScrollCursorToLeft() {
      return ScrollCursorToLeft.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToLeft.prototype.execute = function() {
      this.editorElement.setScrollLeft(this.pixel);
      return this.putCursorOnScreen();
    };

    return ScrollCursorToLeft;

  })(ScrollHorizontal);

  ScrollCursorToRight = (function(superClass) {
    extend(ScrollCursorToRight, superClass);

    function ScrollCursorToRight() {
      return ScrollCursorToRight.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToRight.prototype.execute = function() {
      this.editorElement.setScrollRight(this.pixel);
      return this.putCursorOnScreen();
    };

    return ScrollCursorToRight;

  })(ScrollHorizontal);

  module.exports = {
    ScrollDown: ScrollDown,
    ScrollUp: ScrollUp,
    ScrollCursorToTop: ScrollCursorToTop,
    ScrollCursorToMiddle: ScrollCursorToMiddle,
    ScrollCursorToBottom: ScrollCursorToBottom,
    ScrollCursorToLeft: ScrollCursorToLeft,
    ScrollCursorToRight: ScrollCursorToRight
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvc2Nyb2xsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0tBQUE7SUFBQTs7O0VBQU07cUJBQ0osVUFBQSxHQUFZLFNBQUE7YUFBRztJQUFIOztxQkFDWixZQUFBLEdBQWMsU0FBQTthQUFHO0lBQUg7O0lBQ0QsZ0JBQUMsYUFBRDtNQUFDLElBQUMsQ0FBQSxnQkFBRDtNQUNaLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxhQUFhLENBQUMsUUFBZixDQUFBO01BQ1YsSUFBQyxDQUFBLElBQUQsR0FDRTtRQUFBLEtBQUEsRUFBTyxJQUFDLENBQUEsYUFBYSxDQUFDLHdCQUFmLENBQUEsQ0FBUDtRQUNBLElBQUEsRUFBTSxJQUFDLENBQUEsYUFBYSxDQUFDLHVCQUFmLENBQUEsQ0FETjtRQUVBLEtBQUEsRUFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FGUDs7SUFKUzs7Ozs7O0VBUVQ7Ozs7Ozs7eUJBQ0osT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUNQLFVBQUE7O1FBRFEsUUFBTTs7TUFDZCxXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyx3QkFBUixDQUFBO01BQ2QsSUFBQyxDQUFBLE1BQU0sQ0FBQyx3QkFBUixDQUFpQyxXQUFBLEdBQWMsS0FBL0M7TUFDQSxXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyx3QkFBUixDQUFBO0FBRWQ7QUFBQSxXQUFBLHFDQUFBOztRQUNFLFFBQUEsR0FBVyxNQUFNLENBQUMsaUJBQVAsQ0FBQTtRQUNYLElBQUcsUUFBUSxDQUFDLEdBQVQsSUFBZ0IsV0FBQSxHQUFjLElBQUMsQ0FBQSxTQUFsQztVQUNFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLFFBQVEsQ0FBQyxHQUFU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c0JBQVIsQ0FBK0I7UUFBQyxNQUFBLEVBQVEsS0FBVDtPQUEvQjtJQURpQjs7Ozs7O0VBR2Y7Ozs7Ozs7aUNBQ0osT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLGFBQWYsQ0FBNkIsSUFBQyxDQUFBLEtBQTlCO2FBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFGTzs7OztLQURzQjs7RUFLM0I7Ozs7Ozs7a0NBQ0osT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLGNBQWYsQ0FBOEIsSUFBQyxDQUFBLEtBQS9CO2FBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFGTzs7OztLQUR1Qjs7RUFLbEMsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBQyxZQUFBLFVBQUQ7SUFBYSxVQUFBLFFBQWI7SUFBdUIsbUJBQUEsaUJBQXZCO0lBQTBDLHNCQUFBLG9CQUExQztJQUNmLHNCQUFBLG9CQURlO0lBQ08sb0JBQUEsa0JBRFA7SUFDMkIscUJBQUEsbUJBRDNCOztBQWpIakIiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBTY3JvbGxcbiAgaXNDb21wbGV0ZTogLT4gdHJ1ZVxuICBpc1JlY29yZGFibGU6IC0+IGZhbHNlXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvckVsZW1lbnQpIC0+XG4gICAgQHNjcm9sbG9mZiA9IDIgIyBhdG9tIGRlZmF1bHRcbiAgICBAZWRpdG9yID0gQGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgIEByb3dzID1cbiAgICAgIGZpcnN0OiBAZWRpdG9yRWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICAgbGFzdDogQGVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICAgZmluYWw6IEBlZGl0b3IuZ2V0TGFzdFNjcmVlblJvdygpXG5cbmNsYXNzIFNjcm9sbERvd24gZXh0ZW5kcyBTY3JvbGxcbiAgZXhlY3V0ZTogKGNvdW50PTEpIC0+XG4gICAgb2xkRmlyc3RSb3cgPSBAZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgQGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cob2xkRmlyc3RSb3cgKyBjb3VudClcbiAgICBuZXdGaXJzdFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIHBvc2l0aW9uID0gY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKClcbiAgICAgIGlmIHBvc2l0aW9uLnJvdyA8PSBuZXdGaXJzdFJvdyArIEBzY3JvbGxvZmZcbiAgICAgICAgY3Vyc29yLnNldFNjcmVlblBvc2l0aW9uKFtwb3NpdGlvbi5yb3cgKyBuZXdGaXJzdFJvdyAtIG9sZEZpcnN0Um93LCBwb3NpdGlvbi5jb2x1bW5dLCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAgICMgVE9ETzogcmVtb3ZlXG4gICAgIyBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgYSBidWcgZml4ZWQgaW4gYXRvbS9hdG9tIzEwMDYyXG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50LnVwZGF0ZVN5bmMoKVxuXG4gICAgcmV0dXJuXG5cbmNsYXNzIFNjcm9sbFVwIGV4dGVuZHMgU2Nyb2xsXG4gIGV4ZWN1dGU6IChjb3VudD0xKSAtPlxuICAgIG9sZEZpcnN0Um93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIG9sZExhc3RSb3cgPSBAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhvbGRGaXJzdFJvdyAtIGNvdW50KVxuICAgIG5ld0xhc3RSb3cgPSBAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIHBvc2l0aW9uID0gY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKClcbiAgICAgIGlmIHBvc2l0aW9uLnJvdyA+PSBuZXdMYXN0Um93IC0gQHNjcm9sbG9mZlxuICAgICAgICBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24oW3Bvc2l0aW9uLnJvdyAtIChvbGRMYXN0Um93IC0gbmV3TGFzdFJvdyksIHBvc2l0aW9uLmNvbHVtbl0sIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gICAgIyBUT0RPOiByZW1vdmVcbiAgICAjIFRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciBhIGJ1ZyBmaXhlZCBpbiBhdG9tL2F0b20jMTAwNjJcbiAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQudXBkYXRlU3luYygpXG5cbiAgICByZXR1cm5cblxuY2xhc3MgU2Nyb2xsQ3Vyc29yIGV4dGVuZHMgU2Nyb2xsXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvckVsZW1lbnQsIEBvcHRzPXt9KSAtPlxuICAgIHN1cGVyXG4gICAgY3Vyc29yID0gQGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXG4gICAgQHBpeGVsID0gQGVkaXRvckVsZW1lbnQucGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKGN1cnNvcikudG9wXG5cbmNsYXNzIFNjcm9sbEN1cnNvclRvVG9wIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG1vdmVUb0ZpcnN0Tm9uQmxhbmsoKSB1bmxlc3MgQG9wdHMubGVhdmVDdXJzb3JcbiAgICBAc2Nyb2xsVXAoKVxuXG4gIHNjcm9sbFVwOiAtPlxuICAgIHJldHVybiBpZiBAcm93cy5sYXN0IGlzIEByb3dzLmZpbmFsXG4gICAgQHBpeGVsIC09IChAZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpICogQHNjcm9sbG9mZilcbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3AoQHBpeGVsKVxuXG4gIG1vdmVUb0ZpcnN0Tm9uQmxhbms6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbmNsYXNzIFNjcm9sbEN1cnNvclRvTWlkZGxlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG1vdmVUb0ZpcnN0Tm9uQmxhbmsoKSB1bmxlc3MgQG9wdHMubGVhdmVDdXJzb3JcbiAgICBAc2Nyb2xsTWlkZGxlKClcblxuICBzY3JvbGxNaWRkbGU6IC0+XG4gICAgQHBpeGVsIC09IChAZWRpdG9yRWxlbWVudC5nZXRIZWlnaHQoKSAvIDIpXG4gICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKEBwaXhlbClcblxuICBtb3ZlVG9GaXJzdE5vbkJsYW5rOiAtPlxuICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG5jbGFzcyBTY3JvbGxDdXJzb3JUb0JvdHRvbSBleHRlbmRzIFNjcm9sbEN1cnNvclxuICBleGVjdXRlOiAtPlxuICAgIEBtb3ZlVG9GaXJzdE5vbkJsYW5rKCkgdW5sZXNzIEBvcHRzLmxlYXZlQ3Vyc29yXG4gICAgQHNjcm9sbERvd24oKVxuXG4gIHNjcm9sbERvd246IC0+XG4gICAgcmV0dXJuIGlmIEByb3dzLmZpcnN0IGlzIDBcbiAgICBvZmZzZXQgPSAoQGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIChAc2Nyb2xsb2ZmICsgMSkpXG4gICAgQHBpeGVsIC09IChAZWRpdG9yRWxlbWVudC5nZXRIZWlnaHQoKSAtIG9mZnNldClcbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3AoQHBpeGVsKVxuXG4gIG1vdmVUb0ZpcnN0Tm9uQmxhbms6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbmNsYXNzIFNjcm9sbEhvcml6b250YWxcbiAgaXNDb21wbGV0ZTogLT4gdHJ1ZVxuICBpc1JlY29yZGFibGU6IC0+IGZhbHNlXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvckVsZW1lbnQpIC0+XG4gICAgQGVkaXRvciA9IEBlZGl0b3JFbGVtZW50LmdldE1vZGVsKClcbiAgICBjdXJzb3JQb3MgPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBAcGl4ZWwgPSBAZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oY3Vyc29yUG9zKS5sZWZ0XG4gICAgQGN1cnNvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG5cbiAgcHV0Q3Vyc29yT25TY3JlZW46IC0+XG4gICAgQGVkaXRvci5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKHtjZW50ZXI6IGZhbHNlfSlcblxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9MZWZ0IGV4dGVuZHMgU2Nyb2xsSG9yaXpvbnRhbFxuICBleGVjdXRlOiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LnNldFNjcm9sbExlZnQoQHBpeGVsKVxuICAgIEBwdXRDdXJzb3JPblNjcmVlbigpXG5cbmNsYXNzIFNjcm9sbEN1cnNvclRvUmlnaHQgZXh0ZW5kcyBTY3JvbGxIb3Jpem9udGFsXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsUmlnaHQoQHBpeGVsKVxuICAgIEBwdXRDdXJzb3JPblNjcmVlbigpXG5cbm1vZHVsZS5leHBvcnRzID0ge1Njcm9sbERvd24sIFNjcm9sbFVwLCBTY3JvbGxDdXJzb3JUb1RvcCwgU2Nyb2xsQ3Vyc29yVG9NaWRkbGUsXG4gIFNjcm9sbEN1cnNvclRvQm90dG9tLCBTY3JvbGxDdXJzb3JUb0xlZnQsIFNjcm9sbEN1cnNvclRvUmlnaHR9XG4iXX0=
