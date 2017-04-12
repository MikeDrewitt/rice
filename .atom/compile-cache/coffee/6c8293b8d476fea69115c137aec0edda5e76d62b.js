(function() {
  var ScrollbarCornerComponent;

  module.exports = ScrollbarCornerComponent = (function() {
    function ScrollbarCornerComponent() {
      this.domNode = document.createElement('div');
      this.domNode.classList.add('scrollbar-corner');
      this.contentNode = document.createElement('div');
      this.domNode.appendChild(this.contentNode);
    }

    ScrollbarCornerComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    ScrollbarCornerComponent.prototype.updateSync = function(state) {
      var newHorizontalState, newVerticalState;
      if (this.oldState == null) {
        this.oldState = {};
      }
      if (this.newState == null) {
        this.newState = {};
      }
      newHorizontalState = state.horizontalScrollbar;
      newVerticalState = state.verticalScrollbar;
      this.newState.visible = newHorizontalState.visible && newVerticalState.visible;
      this.newState.height = newHorizontalState.height;
      this.newState.width = newVerticalState.width;
      if (this.newState.visible !== this.oldState.visible) {
        if (this.newState.visible) {
          this.domNode.style.display = '';
        } else {
          this.domNode.style.display = 'none';
        }
        this.oldState.visible = this.newState.visible;
      }
      if (this.newState.height !== this.oldState.height) {
        this.domNode.style.height = this.newState.height + 'px';
        this.contentNode.style.height = this.newState.height + 1 + 'px';
        this.oldState.height = this.newState.height;
      }
      if (this.newState.width !== this.oldState.width) {
        this.domNode.style.width = this.newState.width + 'px';
        this.contentNode.style.width = this.newState.width + 1 + 'px';
        return this.oldState.width = this.newState.width;
      }
    };

    return ScrollbarCornerComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zY3JvbGxiYXItY29ybmVyLWNvbXBvbmVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxrQ0FBQTtNQUNYLElBQUMsQ0FBQSxPQUFELEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFuQixDQUF1QixrQkFBdkI7TUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ2YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLElBQUMsQ0FBQSxXQUF0QjtJQUxXOzt1Q0FPYixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQTtJQURTOzt1Q0FHWixVQUFBLEdBQVksU0FBQyxLQUFEO0FBQ1YsVUFBQTs7UUFBQSxJQUFDLENBQUEsV0FBWTs7O1FBQ2IsSUFBQyxDQUFBLFdBQVk7O01BRWIsa0JBQUEsR0FBcUIsS0FBSyxDQUFDO01BQzNCLGdCQUFBLEdBQW1CLEtBQUssQ0FBQztNQUN6QixJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsR0FBb0Isa0JBQWtCLENBQUMsT0FBbkIsSUFBK0IsZ0JBQWdCLENBQUM7TUFDcEUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEdBQW1CLGtCQUFrQixDQUFDO01BQ3RDLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFrQixnQkFBZ0IsQ0FBQztNQUVuQyxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixLQUF1QixJQUFDLENBQUEsUUFBUSxDQUFDLE9BQXBDO1FBQ0UsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQWI7VUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFmLEdBQXlCLEdBRDNCO1NBQUEsTUFBQTtVQUdFLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQWYsR0FBeUIsT0FIM0I7O1FBSUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLEdBQW9CLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFMaEM7O01BT0EsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsS0FBc0IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFuQztRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQWYsR0FBd0IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEdBQW1CO1FBQzNDLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQW5CLEdBQTRCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixHQUFtQixDQUFuQixHQUF1QjtRQUNuRCxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsR0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUgvQjs7TUFLQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixLQUFxQixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQWxDO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBZixHQUF1QixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsR0FBa0I7UUFDekMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBbkIsR0FBMkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLEdBQWtCLENBQWxCLEdBQXNCO2VBQ2pELElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFrQixJQUFDLENBQUEsUUFBUSxDQUFDLE1BSDlCOztJQXRCVTs7Ozs7QUFaZCIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFNjcm9sbGJhckNvcm5lckNvbXBvbmVudFxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAZG9tTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGRvbU5vZGUuY2xhc3NMaXN0LmFkZCgnc2Nyb2xsYmFyLWNvcm5lcicpXG5cbiAgICBAY29udGVudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBkb21Ob2RlLmFwcGVuZENoaWxkKEBjb250ZW50Tm9kZSlcblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgdXBkYXRlU3luYzogKHN0YXRlKSAtPlxuICAgIEBvbGRTdGF0ZSA/PSB7fVxuICAgIEBuZXdTdGF0ZSA/PSB7fVxuXG4gICAgbmV3SG9yaXpvbnRhbFN0YXRlID0gc3RhdGUuaG9yaXpvbnRhbFNjcm9sbGJhclxuICAgIG5ld1ZlcnRpY2FsU3RhdGUgPSBzdGF0ZS52ZXJ0aWNhbFNjcm9sbGJhclxuICAgIEBuZXdTdGF0ZS52aXNpYmxlID0gbmV3SG9yaXpvbnRhbFN0YXRlLnZpc2libGUgYW5kIG5ld1ZlcnRpY2FsU3RhdGUudmlzaWJsZVxuICAgIEBuZXdTdGF0ZS5oZWlnaHQgPSBuZXdIb3Jpem9udGFsU3RhdGUuaGVpZ2h0XG4gICAgQG5ld1N0YXRlLndpZHRoID0gbmV3VmVydGljYWxTdGF0ZS53aWR0aFxuXG4gICAgaWYgQG5ld1N0YXRlLnZpc2libGUgaXNudCBAb2xkU3RhdGUudmlzaWJsZVxuICAgICAgaWYgQG5ld1N0YXRlLnZpc2libGVcbiAgICAgICAgQGRvbU5vZGUuc3R5bGUuZGlzcGxheSA9ICcnXG4gICAgICBlbHNlXG4gICAgICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgIEBvbGRTdGF0ZS52aXNpYmxlID0gQG5ld1N0YXRlLnZpc2libGVcblxuICAgIGlmIEBuZXdTdGF0ZS5oZWlnaHQgaXNudCBAb2xkU3RhdGUuaGVpZ2h0XG4gICAgICBAZG9tTm9kZS5zdHlsZS5oZWlnaHQgPSBAbmV3U3RhdGUuaGVpZ2h0ICsgJ3B4J1xuICAgICAgQGNvbnRlbnROb2RlLnN0eWxlLmhlaWdodCA9IEBuZXdTdGF0ZS5oZWlnaHQgKyAxICsgJ3B4J1xuICAgICAgQG9sZFN0YXRlLmhlaWdodCA9IEBuZXdTdGF0ZS5oZWlnaHRcblxuICAgIGlmIEBuZXdTdGF0ZS53aWR0aCBpc250IEBvbGRTdGF0ZS53aWR0aFxuICAgICAgQGRvbU5vZGUuc3R5bGUud2lkdGggPSBAbmV3U3RhdGUud2lkdGggKyAncHgnXG4gICAgICBAY29udGVudE5vZGUuc3R5bGUud2lkdGggPSBAbmV3U3RhdGUud2lkdGggKyAxICsgJ3B4J1xuICAgICAgQG9sZFN0YXRlLndpZHRoID0gQG5ld1N0YXRlLndpZHRoXG4iXX0=
