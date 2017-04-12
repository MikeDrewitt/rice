(function() {
  var CursorsComponent;

  module.exports = CursorsComponent = (function() {
    CursorsComponent.prototype.oldState = null;

    function CursorsComponent() {
      this.cursorNodesById = {};
      this.domNode = document.createElement('div');
      this.domNode.classList.add('cursors');
    }

    CursorsComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    CursorsComponent.prototype.updateSync = function(state) {
      var cursorNode, cursorState, id, newState, ref;
      newState = state.content;
      if (this.oldState == null) {
        this.oldState = {
          cursors: {}
        };
      }
      if (newState.cursorsVisible !== this.oldState.cursorsVisible) {
        if (newState.cursorsVisible) {
          this.domNode.classList.remove('blink-off');
        } else {
          this.domNode.classList.add('blink-off');
        }
        this.oldState.cursorsVisible = newState.cursorsVisible;
      }
      for (id in this.oldState.cursors) {
        if (newState.cursors[id] == null) {
          this.cursorNodesById[id].remove();
          delete this.cursorNodesById[id];
          delete this.oldState.cursors[id];
        }
      }
      ref = newState.cursors;
      for (id in ref) {
        cursorState = ref[id];
        if (this.oldState.cursors[id] == null) {
          cursorNode = document.createElement('div');
          cursorNode.classList.add('cursor');
          this.cursorNodesById[id] = cursorNode;
          this.domNode.appendChild(cursorNode);
        }
        this.updateCursorNode(id, cursorState);
      }
    };

    CursorsComponent.prototype.updateCursorNode = function(id, newCursorState) {
      var base, cursorNode, oldCursorState;
      cursorNode = this.cursorNodesById[id];
      oldCursorState = ((base = this.oldState.cursors)[id] != null ? base[id] : base[id] = {});
      if (newCursorState.top !== oldCursorState.top || newCursorState.left !== oldCursorState.left) {
        cursorNode.style['-webkit-transform'] = "translate(" + newCursorState.left + "px, " + newCursorState.top + "px)";
        oldCursorState.top = newCursorState.top;
        oldCursorState.left = newCursorState.left;
      }
      if (newCursorState.height !== oldCursorState.height) {
        cursorNode.style.height = newCursorState.height + 'px';
        oldCursorState.height = newCursorState.height;
      }
      if (newCursorState.width !== oldCursorState.width) {
        cursorNode.style.width = newCursorState.width + 'px';
        return oldCursorState.width = newCursorState.width;
      }
    };

    return CursorsComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jdXJzb3JzLWNvbXBvbmVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007K0JBQ0osUUFBQSxHQUFVOztJQUVHLDBCQUFBO01BQ1gsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLFNBQXZCO0lBSFc7OytCQUtiLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBO0lBRFM7OytCQUdaLFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFDVixVQUFBO01BQUEsUUFBQSxHQUFXLEtBQUssQ0FBQzs7UUFDakIsSUFBQyxDQUFBLFdBQVk7VUFBQyxPQUFBLEVBQVMsRUFBVjs7O01BR2IsSUFBRyxRQUFRLENBQUMsY0FBVCxLQUE2QixJQUFDLENBQUEsUUFBUSxDQUFDLGNBQTFDO1FBQ0UsSUFBRyxRQUFRLENBQUMsY0FBWjtVQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLFdBQTFCLEVBREY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsV0FBdkIsRUFIRjs7UUFJQSxJQUFDLENBQUEsUUFBUSxDQUFDLGNBQVYsR0FBMkIsUUFBUSxDQUFDLGVBTHRDOztBQVFBLFdBQUEsMkJBQUE7UUFDRSxJQUFPLDRCQUFQO1VBQ0UsSUFBQyxDQUFBLGVBQWdCLENBQUEsRUFBQSxDQUFHLENBQUMsTUFBckIsQ0FBQTtVQUNBLE9BQU8sSUFBQyxDQUFBLGVBQWdCLENBQUEsRUFBQTtVQUN4QixPQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBUSxDQUFBLEVBQUEsRUFIM0I7O0FBREY7QUFPQTtBQUFBLFdBQUEsU0FBQTs7UUFDRSxJQUFPLGlDQUFQO1VBQ0UsVUFBQSxHQUFhLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO1VBQ2IsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFyQixDQUF5QixRQUF6QjtVQUNBLElBQUMsQ0FBQSxlQUFnQixDQUFBLEVBQUEsQ0FBakIsR0FBdUI7VUFDdkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLFVBQXJCLEVBSkY7O1FBS0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLEVBQWxCLEVBQXNCLFdBQXRCO0FBTkY7SUFwQlU7OytCQThCWixnQkFBQSxHQUFrQixTQUFDLEVBQUQsRUFBSyxjQUFMO0FBQ2hCLFVBQUE7TUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLGVBQWdCLENBQUEsRUFBQTtNQUM5QixjQUFBLEdBQWlCLGtEQUFtQixDQUFBLEVBQUEsUUFBQSxDQUFBLEVBQUEsSUFBTyxFQUExQjtNQUVqQixJQUFHLGNBQWMsQ0FBQyxHQUFmLEtBQXdCLGNBQWMsQ0FBQyxHQUF2QyxJQUE4QyxjQUFjLENBQUMsSUFBZixLQUF5QixjQUFjLENBQUMsSUFBekY7UUFDRSxVQUFVLENBQUMsS0FBTSxDQUFBLG1CQUFBLENBQWpCLEdBQXdDLFlBQUEsR0FBYSxjQUFjLENBQUMsSUFBNUIsR0FBaUMsTUFBakMsR0FBdUMsY0FBYyxDQUFDLEdBQXRELEdBQTBEO1FBQ2xHLGNBQWMsQ0FBQyxHQUFmLEdBQXFCLGNBQWMsQ0FBQztRQUNwQyxjQUFjLENBQUMsSUFBZixHQUFzQixjQUFjLENBQUMsS0FIdkM7O01BS0EsSUFBRyxjQUFjLENBQUMsTUFBZixLQUEyQixjQUFjLENBQUMsTUFBN0M7UUFDRSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQWpCLEdBQTBCLGNBQWMsQ0FBQyxNQUFmLEdBQXdCO1FBQ2xELGNBQWMsQ0FBQyxNQUFmLEdBQXdCLGNBQWMsQ0FBQyxPQUZ6Qzs7TUFJQSxJQUFHLGNBQWMsQ0FBQyxLQUFmLEtBQTBCLGNBQWMsQ0FBQyxLQUE1QztRQUNFLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBakIsR0FBeUIsY0FBYyxDQUFDLEtBQWYsR0FBdUI7ZUFDaEQsY0FBYyxDQUFDLEtBQWYsR0FBdUIsY0FBYyxDQUFDLE1BRnhDOztJQWJnQjs7Ozs7QUExQ3BCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ3Vyc29yc0NvbXBvbmVudFxuICBvbGRTdGF0ZTogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjdXJzb3JOb2Rlc0J5SWQgPSB7fVxuICAgIEBkb21Ob2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZG9tTm9kZS5jbGFzc0xpc3QuYWRkKCdjdXJzb3JzJylcblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgdXBkYXRlU3luYzogKHN0YXRlKSAtPlxuICAgIG5ld1N0YXRlID0gc3RhdGUuY29udGVudFxuICAgIEBvbGRTdGF0ZSA/PSB7Y3Vyc29yczoge319XG5cbiAgICAjIHVwZGF0ZSBibGluayBjbGFzc1xuICAgIGlmIG5ld1N0YXRlLmN1cnNvcnNWaXNpYmxlIGlzbnQgQG9sZFN0YXRlLmN1cnNvcnNWaXNpYmxlXG4gICAgICBpZiBuZXdTdGF0ZS5jdXJzb3JzVmlzaWJsZVxuICAgICAgICBAZG9tTm9kZS5jbGFzc0xpc3QucmVtb3ZlICdibGluay1vZmYnXG4gICAgICBlbHNlXG4gICAgICAgIEBkb21Ob2RlLmNsYXNzTGlzdC5hZGQgJ2JsaW5rLW9mZidcbiAgICAgIEBvbGRTdGF0ZS5jdXJzb3JzVmlzaWJsZSA9IG5ld1N0YXRlLmN1cnNvcnNWaXNpYmxlXG5cbiAgICAjIHJlbW92ZSBjdXJzb3JzXG4gICAgZm9yIGlkIG9mIEBvbGRTdGF0ZS5jdXJzb3JzXG4gICAgICB1bmxlc3MgbmV3U3RhdGUuY3Vyc29yc1tpZF0/XG4gICAgICAgIEBjdXJzb3JOb2Rlc0J5SWRbaWRdLnJlbW92ZSgpXG4gICAgICAgIGRlbGV0ZSBAY3Vyc29yTm9kZXNCeUlkW2lkXVxuICAgICAgICBkZWxldGUgQG9sZFN0YXRlLmN1cnNvcnNbaWRdXG5cbiAgICAjIGFkZCBvciB1cGRhdGUgY3Vyc29yc1xuICAgIGZvciBpZCwgY3Vyc29yU3RhdGUgb2YgbmV3U3RhdGUuY3Vyc29yc1xuICAgICAgdW5sZXNzIEBvbGRTdGF0ZS5jdXJzb3JzW2lkXT9cbiAgICAgICAgY3Vyc29yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgIGN1cnNvck5vZGUuY2xhc3NMaXN0LmFkZCgnY3Vyc29yJylcbiAgICAgICAgQGN1cnNvck5vZGVzQnlJZFtpZF0gPSBjdXJzb3JOb2RlXG4gICAgICAgIEBkb21Ob2RlLmFwcGVuZENoaWxkKGN1cnNvck5vZGUpXG4gICAgICBAdXBkYXRlQ3Vyc29yTm9kZShpZCwgY3Vyc29yU3RhdGUpXG5cbiAgICByZXR1cm5cblxuICB1cGRhdGVDdXJzb3JOb2RlOiAoaWQsIG5ld0N1cnNvclN0YXRlKSAtPlxuICAgIGN1cnNvck5vZGUgPSBAY3Vyc29yTm9kZXNCeUlkW2lkXVxuICAgIG9sZEN1cnNvclN0YXRlID0gKEBvbGRTdGF0ZS5jdXJzb3JzW2lkXSA/PSB7fSlcblxuICAgIGlmIG5ld0N1cnNvclN0YXRlLnRvcCBpc250IG9sZEN1cnNvclN0YXRlLnRvcCBvciBuZXdDdXJzb3JTdGF0ZS5sZWZ0IGlzbnQgb2xkQ3Vyc29yU3RhdGUubGVmdFxuICAgICAgY3Vyc29yTm9kZS5zdHlsZVsnLXdlYmtpdC10cmFuc2Zvcm0nXSA9IFwidHJhbnNsYXRlKCN7bmV3Q3Vyc29yU3RhdGUubGVmdH1weCwgI3tuZXdDdXJzb3JTdGF0ZS50b3B9cHgpXCJcbiAgICAgIG9sZEN1cnNvclN0YXRlLnRvcCA9IG5ld0N1cnNvclN0YXRlLnRvcFxuICAgICAgb2xkQ3Vyc29yU3RhdGUubGVmdCA9IG5ld0N1cnNvclN0YXRlLmxlZnRcblxuICAgIGlmIG5ld0N1cnNvclN0YXRlLmhlaWdodCBpc250IG9sZEN1cnNvclN0YXRlLmhlaWdodFxuICAgICAgY3Vyc29yTm9kZS5zdHlsZS5oZWlnaHQgPSBuZXdDdXJzb3JTdGF0ZS5oZWlnaHQgKyAncHgnXG4gICAgICBvbGRDdXJzb3JTdGF0ZS5oZWlnaHQgPSBuZXdDdXJzb3JTdGF0ZS5oZWlnaHRcblxuICAgIGlmIG5ld0N1cnNvclN0YXRlLndpZHRoIGlzbnQgb2xkQ3Vyc29yU3RhdGUud2lkdGhcbiAgICAgIGN1cnNvck5vZGUuc3R5bGUud2lkdGggPSBuZXdDdXJzb3JTdGF0ZS53aWR0aCArICdweCdcbiAgICAgIG9sZEN1cnNvclN0YXRlLndpZHRoID0gbmV3Q3Vyc29yU3RhdGUud2lkdGhcbiJdfQ==
