(function() {
  var ScrollbarComponent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = ScrollbarComponent = (function() {
    function ScrollbarComponent(arg) {
      this.orientation = arg.orientation, this.onScroll = arg.onScroll;
      this.onScrollCallback = bind(this.onScrollCallback, this);
      this.domNode = document.createElement('div');
      this.domNode.classList.add(this.orientation + "-scrollbar");
      this.domNode.style['-webkit-transform'] = 'translateZ(0)';
      if (this.orientation === 'horizontal') {
        this.domNode.style.left = 0;
      }
      this.contentNode = document.createElement('div');
      this.contentNode.classList.add("scrollbar-content");
      this.domNode.appendChild(this.contentNode);
      this.domNode.addEventListener('scroll', this.onScrollCallback);
    }

    ScrollbarComponent.prototype.destroy = function() {
      this.domNode.removeEventListener('scroll', this.onScrollCallback);
      return this.onScroll = null;
    };

    ScrollbarComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    ScrollbarComponent.prototype.updateSync = function(state) {
      if (this.oldState == null) {
        this.oldState = {};
      }
      switch (this.orientation) {
        case 'vertical':
          this.newState = state.verticalScrollbar;
          this.updateVertical();
          break;
        case 'horizontal':
          this.newState = state.horizontalScrollbar;
          this.updateHorizontal();
      }
      if (this.newState.visible !== this.oldState.visible) {
        if (this.newState.visible) {
          this.domNode.style.display = '';
        } else {
          this.domNode.style.display = 'none';
        }
        return this.oldState.visible = this.newState.visible;
      }
    };

    ScrollbarComponent.prototype.updateVertical = function() {
      if (this.newState.width !== this.oldState.width) {
        this.domNode.style.width = this.newState.width + 'px';
        this.oldState.width = this.newState.width;
      }
      if (this.newState.bottom !== this.oldState.bottom) {
        this.domNode.style.bottom = this.newState.bottom + 'px';
        this.oldState.bottom = this.newState.bottom;
      }
      if (this.newState.scrollHeight !== this.oldState.scrollHeight) {
        this.contentNode.style.height = this.newState.scrollHeight + 'px';
        this.oldState.scrollHeight = this.newState.scrollHeight;
      }
      if (this.newState.scrollTop !== this.oldState.scrollTop) {
        this.domNode.scrollTop = this.newState.scrollTop;
        return this.oldState.scrollTop = this.newState.scrollTop;
      }
    };

    ScrollbarComponent.prototype.updateHorizontal = function() {
      if (this.newState.height !== this.oldState.height) {
        this.domNode.style.height = this.newState.height + 'px';
        this.oldState.height = this.newState.height;
      }
      if (this.newState.right !== this.oldState.right) {
        this.domNode.style.right = this.newState.right + 'px';
        this.oldState.right = this.newState.right;
      }
      if (this.newState.scrollWidth !== this.oldState.scrollWidth) {
        this.contentNode.style.width = this.newState.scrollWidth + 'px';
        this.oldState.scrollWidth = this.newState.scrollWidth;
      }
      if (this.newState.scrollLeft !== this.oldState.scrollLeft) {
        this.domNode.scrollLeft = this.newState.scrollLeft;
        return this.oldState.scrollLeft = this.newState.scrollLeft;
      }
    };

    ScrollbarComponent.prototype.onScrollCallback = function() {
      switch (this.orientation) {
        case 'vertical':
          return this.onScroll(this.domNode.scrollTop);
        case 'horizontal':
          return this.onScroll(this.domNode.scrollLeft);
      }
    };

    return ScrollbarComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zY3JvbGxiYXItY29tcG9uZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0JBQUE7SUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNEJBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxrQkFBQSxhQUFhLElBQUMsQ0FBQSxlQUFBOztNQUM1QixJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBMEIsSUFBQyxDQUFBLFdBQUYsR0FBYyxZQUF2QztNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBTSxDQUFBLG1CQUFBLENBQWYsR0FBc0M7TUFDdEMsSUFBMkIsSUFBQyxDQUFBLFdBQUQsS0FBZ0IsWUFBM0M7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFmLEdBQXNCLEVBQXRCOztNQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDZixJQUFDLENBQUEsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUF2QixDQUEyQixtQkFBM0I7TUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLFdBQXRCO01BRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxnQkFBVCxDQUEwQixRQUExQixFQUFvQyxJQUFDLENBQUEsZ0JBQXJDO0lBVlc7O2lDQVliLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxtQkFBVCxDQUE2QixRQUE3QixFQUF1QyxJQUFDLENBQUEsZ0JBQXhDO2FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUZMOztpQ0FJVCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQTtJQURTOztpQ0FHWixVQUFBLEdBQVksU0FBQyxLQUFEOztRQUNWLElBQUMsQ0FBQSxXQUFZOztBQUNiLGNBQU8sSUFBQyxDQUFBLFdBQVI7QUFBQSxhQUNPLFVBRFA7VUFFSSxJQUFDLENBQUEsUUFBRCxHQUFZLEtBQUssQ0FBQztVQUNsQixJQUFDLENBQUEsY0FBRCxDQUFBO0FBRkc7QUFEUCxhQUlPLFlBSlA7VUFLSSxJQUFDLENBQUEsUUFBRCxHQUFZLEtBQUssQ0FBQztVQUNsQixJQUFDLENBQUEsZ0JBQUQsQ0FBQTtBQU5KO01BUUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsS0FBdUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFwQztRQUNFLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFiO1VBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZixHQUF5QixHQUQzQjtTQUFBLE1BQUE7VUFHRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFmLEdBQXlCLE9BSDNCOztlQUlBLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixHQUFvQixJQUFDLENBQUEsUUFBUSxDQUFDLFFBTGhDOztJQVZVOztpQ0FpQlosY0FBQSxHQUFnQixTQUFBO01BQ2QsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsS0FBcUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFsQztRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQWYsR0FBdUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLEdBQWtCO1FBQ3pDLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFrQixJQUFDLENBQUEsUUFBUSxDQUFDLE1BRjlCOztNQUlBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEtBQXNCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBbkM7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFmLEdBQXdCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixHQUFtQjtRQUMzQyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsR0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUYvQjs7TUFJQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixLQUE0QixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQXpDO1FBQ0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBbkIsR0FBNEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLEdBQXlCO1FBQ3JELElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixHQUF5QixJQUFDLENBQUEsUUFBUSxDQUFDLGFBRnJDOztNQUlBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxTQUFWLEtBQXlCLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBdEM7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVQsR0FBcUIsSUFBQyxDQUFBLFFBQVEsQ0FBQztlQUMvQixJQUFDLENBQUEsUUFBUSxDQUFDLFNBQVYsR0FBc0IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUZsQzs7SUFiYzs7aUNBaUJoQixnQkFBQSxHQUFrQixTQUFBO01BQ2hCLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEtBQXNCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBbkM7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFmLEdBQXdCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixHQUFtQjtRQUMzQyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsR0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUYvQjs7TUFJQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixLQUFxQixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQWxDO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBZixHQUF1QixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsR0FBa0I7UUFDekMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLEdBQWtCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFGOUI7O01BSUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVYsS0FBMkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUF4QztRQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQW5CLEdBQTJCLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixHQUF3QjtRQUNuRCxJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVYsR0FBd0IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUZwQzs7TUFJQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixLQUEwQixJQUFDLENBQUEsUUFBUSxDQUFDLFVBQXZDO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULEdBQXNCLElBQUMsQ0FBQSxRQUFRLENBQUM7ZUFDaEMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLEdBQXVCLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FGbkM7O0lBYmdCOztpQ0FrQmxCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsY0FBTyxJQUFDLENBQUEsV0FBUjtBQUFBLGFBQ08sVUFEUDtpQkFFSSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBbkI7QUFGSixhQUdPLFlBSFA7aUJBSUksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQW5CO0FBSko7SUFEZ0I7Ozs7O0FBekVwQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFNjcm9sbGJhckNvbXBvbmVudFxuICBjb25zdHJ1Y3RvcjogKHtAb3JpZW50YXRpb24sIEBvblNjcm9sbH0pIC0+XG4gICAgQGRvbU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBkb21Ob2RlLmNsYXNzTGlzdC5hZGQgXCIje0BvcmllbnRhdGlvbn0tc2Nyb2xsYmFyXCJcbiAgICBAZG9tTm9kZS5zdHlsZVsnLXdlYmtpdC10cmFuc2Zvcm0nXSA9ICd0cmFuc2xhdGVaKDApJyAjIFNlZSBhdG9tL2F0b20jMzU1OVxuICAgIEBkb21Ob2RlLnN0eWxlLmxlZnQgPSAwIGlmIEBvcmllbnRhdGlvbiBpcyAnaG9yaXpvbnRhbCdcblxuICAgIEBjb250ZW50Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGNvbnRlbnROb2RlLmNsYXNzTGlzdC5hZGQgXCJzY3JvbGxiYXItY29udGVudFwiXG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQGNvbnRlbnROb2RlKVxuXG4gICAgQGRvbU5vZGUuYWRkRXZlbnRMaXN0ZW5lciAnc2Nyb2xsJywgQG9uU2Nyb2xsQ2FsbGJhY2tcblxuICBkZXN0cm95OiAtPlxuICAgIEBkb21Ob2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgJ3Njcm9sbCcsIEBvblNjcm9sbENhbGxiYWNrXG4gICAgQG9uU2Nyb2xsID0gbnVsbFxuXG4gIGdldERvbU5vZGU6IC0+XG4gICAgQGRvbU5vZGVcblxuICB1cGRhdGVTeW5jOiAoc3RhdGUpIC0+XG4gICAgQG9sZFN0YXRlID89IHt9XG4gICAgc3dpdGNoIEBvcmllbnRhdGlvblxuICAgICAgd2hlbiAndmVydGljYWwnXG4gICAgICAgIEBuZXdTdGF0ZSA9IHN0YXRlLnZlcnRpY2FsU2Nyb2xsYmFyXG4gICAgICAgIEB1cGRhdGVWZXJ0aWNhbCgpXG4gICAgICB3aGVuICdob3Jpem9udGFsJ1xuICAgICAgICBAbmV3U3RhdGUgPSBzdGF0ZS5ob3Jpem9udGFsU2Nyb2xsYmFyXG4gICAgICAgIEB1cGRhdGVIb3Jpem9udGFsKClcblxuICAgIGlmIEBuZXdTdGF0ZS52aXNpYmxlIGlzbnQgQG9sZFN0YXRlLnZpc2libGVcbiAgICAgIGlmIEBuZXdTdGF0ZS52aXNpYmxlXG4gICAgICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSAnJ1xuICAgICAgZWxzZVxuICAgICAgICBAZG9tTm9kZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICBAb2xkU3RhdGUudmlzaWJsZSA9IEBuZXdTdGF0ZS52aXNpYmxlXG5cbiAgdXBkYXRlVmVydGljYWw6IC0+XG4gICAgaWYgQG5ld1N0YXRlLndpZHRoIGlzbnQgQG9sZFN0YXRlLndpZHRoXG4gICAgICBAZG9tTm9kZS5zdHlsZS53aWR0aCA9IEBuZXdTdGF0ZS53aWR0aCArICdweCdcbiAgICAgIEBvbGRTdGF0ZS53aWR0aCA9IEBuZXdTdGF0ZS53aWR0aFxuXG4gICAgaWYgQG5ld1N0YXRlLmJvdHRvbSBpc250IEBvbGRTdGF0ZS5ib3R0b21cbiAgICAgIEBkb21Ob2RlLnN0eWxlLmJvdHRvbSA9IEBuZXdTdGF0ZS5ib3R0b20gKyAncHgnXG4gICAgICBAb2xkU3RhdGUuYm90dG9tID0gQG5ld1N0YXRlLmJvdHRvbVxuXG4gICAgaWYgQG5ld1N0YXRlLnNjcm9sbEhlaWdodCBpc250IEBvbGRTdGF0ZS5zY3JvbGxIZWlnaHRcbiAgICAgIEBjb250ZW50Tm9kZS5zdHlsZS5oZWlnaHQgPSBAbmV3U3RhdGUuc2Nyb2xsSGVpZ2h0ICsgJ3B4J1xuICAgICAgQG9sZFN0YXRlLnNjcm9sbEhlaWdodCA9IEBuZXdTdGF0ZS5zY3JvbGxIZWlnaHRcblxuICAgIGlmIEBuZXdTdGF0ZS5zY3JvbGxUb3AgaXNudCBAb2xkU3RhdGUuc2Nyb2xsVG9wXG4gICAgICBAZG9tTm9kZS5zY3JvbGxUb3AgPSBAbmV3U3RhdGUuc2Nyb2xsVG9wXG4gICAgICBAb2xkU3RhdGUuc2Nyb2xsVG9wID0gQG5ld1N0YXRlLnNjcm9sbFRvcFxuXG4gIHVwZGF0ZUhvcml6b250YWw6IC0+XG4gICAgaWYgQG5ld1N0YXRlLmhlaWdodCBpc250IEBvbGRTdGF0ZS5oZWlnaHRcbiAgICAgIEBkb21Ob2RlLnN0eWxlLmhlaWdodCA9IEBuZXdTdGF0ZS5oZWlnaHQgKyAncHgnXG4gICAgICBAb2xkU3RhdGUuaGVpZ2h0ID0gQG5ld1N0YXRlLmhlaWdodFxuXG4gICAgaWYgQG5ld1N0YXRlLnJpZ2h0IGlzbnQgQG9sZFN0YXRlLnJpZ2h0XG4gICAgICBAZG9tTm9kZS5zdHlsZS5yaWdodCA9IEBuZXdTdGF0ZS5yaWdodCArICdweCdcbiAgICAgIEBvbGRTdGF0ZS5yaWdodCA9IEBuZXdTdGF0ZS5yaWdodFxuXG4gICAgaWYgQG5ld1N0YXRlLnNjcm9sbFdpZHRoIGlzbnQgQG9sZFN0YXRlLnNjcm9sbFdpZHRoXG4gICAgICBAY29udGVudE5vZGUuc3R5bGUud2lkdGggPSBAbmV3U3RhdGUuc2Nyb2xsV2lkdGggKyAncHgnXG4gICAgICBAb2xkU3RhdGUuc2Nyb2xsV2lkdGggPSBAbmV3U3RhdGUuc2Nyb2xsV2lkdGhcblxuICAgIGlmIEBuZXdTdGF0ZS5zY3JvbGxMZWZ0IGlzbnQgQG9sZFN0YXRlLnNjcm9sbExlZnRcbiAgICAgIEBkb21Ob2RlLnNjcm9sbExlZnQgPSBAbmV3U3RhdGUuc2Nyb2xsTGVmdFxuICAgICAgQG9sZFN0YXRlLnNjcm9sbExlZnQgPSBAbmV3U3RhdGUuc2Nyb2xsTGVmdFxuXG5cbiAgb25TY3JvbGxDYWxsYmFjazogPT5cbiAgICBzd2l0Y2ggQG9yaWVudGF0aW9uXG4gICAgICB3aGVuICd2ZXJ0aWNhbCdcbiAgICAgICAgQG9uU2Nyb2xsKEBkb21Ob2RlLnNjcm9sbFRvcClcbiAgICAgIHdoZW4gJ2hvcml6b250YWwnXG4gICAgICAgIEBvblNjcm9sbChAZG9tTm9kZS5zY3JvbGxMZWZ0KVxuIl19
