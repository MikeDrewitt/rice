(function() {
  var OverlayManager;

  module.exports = OverlayManager = (function() {
    function OverlayManager(presenter, container, views) {
      this.presenter = presenter;
      this.container = container;
      this.views = views;
      this.overlaysById = {};
    }

    OverlayManager.prototype.render = function(state) {
      var decorationId, id, overlay, overlayNode, ref, ref1, results;
      ref = state.content.overlays;
      for (decorationId in ref) {
        overlay = ref[decorationId];
        if (this.shouldUpdateOverlay(decorationId, overlay)) {
          this.renderOverlay(state, decorationId, overlay);
        }
      }
      ref1 = this.overlaysById;
      results = [];
      for (id in ref1) {
        overlayNode = ref1[id].overlayNode;
        if (!state.content.overlays.hasOwnProperty(id)) {
          delete this.overlaysById[id];
          results.push(overlayNode.remove());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    OverlayManager.prototype.shouldUpdateOverlay = function(decorationId, overlay) {
      var cachedOverlay, ref, ref1, ref2, ref3;
      cachedOverlay = this.overlaysById[decorationId];
      if (cachedOverlay == null) {
        return true;
      }
      return ((ref = cachedOverlay.pixelPosition) != null ? ref.top : void 0) !== ((ref1 = overlay.pixelPosition) != null ? ref1.top : void 0) || ((ref2 = cachedOverlay.pixelPosition) != null ? ref2.left : void 0) !== ((ref3 = overlay.pixelPosition) != null ? ref3.left : void 0);
    };

    OverlayManager.prototype.measureOverlays = function() {
      var decorationId, itemView, ref, results;
      ref = this.overlaysById;
      results = [];
      for (decorationId in ref) {
        itemView = ref[decorationId].itemView;
        results.push(this.measureOverlay(decorationId, itemView));
      }
      return results;
    };

    OverlayManager.prototype.measureOverlay = function(decorationId, itemView) {
      var contentMargin, ref;
      contentMargin = (ref = parseInt(getComputedStyle(itemView)['margin-left'])) != null ? ref : 0;
      return this.presenter.setOverlayDimensions(decorationId, itemView.offsetWidth, itemView.offsetHeight, contentMargin);
    };

    OverlayManager.prototype.renderOverlay = function(state, decorationId, arg) {
      var cachedOverlay, item, itemView, klass, overlayNode, pixelPosition;
      item = arg.item, pixelPosition = arg.pixelPosition, klass = arg["class"];
      itemView = this.views.getView(item);
      cachedOverlay = this.overlaysById[decorationId];
      if (!(overlayNode = cachedOverlay != null ? cachedOverlay.overlayNode : void 0)) {
        overlayNode = document.createElement('atom-overlay');
        if (klass != null) {
          overlayNode.classList.add(klass);
        }
        this.container.appendChild(overlayNode);
        this.overlaysById[decorationId] = cachedOverlay = {
          overlayNode: overlayNode,
          itemView: itemView
        };
      }
      if (overlayNode.childNodes.length === 0) {
        overlayNode.appendChild(itemView);
      }
      cachedOverlay.pixelPosition = pixelPosition;
      overlayNode.style.top = pixelPosition.top + 'px';
      return overlayNode.style.left = pixelPosition.left + 'px';
    };

    return OverlayManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9vdmVybGF5LW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1Msd0JBQUMsU0FBRCxFQUFhLFNBQWIsRUFBeUIsS0FBekI7TUFBQyxJQUFDLENBQUEsWUFBRDtNQUFZLElBQUMsQ0FBQSxZQUFEO01BQVksSUFBQyxDQUFBLFFBQUQ7TUFDcEMsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFETDs7NkJBR2IsTUFBQSxHQUFRLFNBQUMsS0FBRDtBQUNOLFVBQUE7QUFBQTtBQUFBLFdBQUEsbUJBQUE7O1FBQ0UsSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsWUFBckIsRUFBbUMsT0FBbkMsQ0FBSDtVQUNFLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixFQUFzQixZQUF0QixFQUFvQyxPQUFwQyxFQURGOztBQURGO0FBSUE7QUFBQTtXQUFBLFVBQUE7UUFBUztRQUNQLElBQUEsQ0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUF2QixDQUFzQyxFQUF0QyxDQUFQO1VBQ0UsT0FBTyxJQUFDLENBQUEsWUFBYSxDQUFBLEVBQUE7dUJBQ3JCLFdBQVcsQ0FBQyxNQUFaLENBQUEsR0FGRjtTQUFBLE1BQUE7K0JBQUE7O0FBREY7O0lBTE07OzZCQVVSLG1CQUFBLEdBQXFCLFNBQUMsWUFBRCxFQUFlLE9BQWY7QUFDbkIsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLFlBQWEsQ0FBQSxZQUFBO01BQzlCLElBQW1CLHFCQUFuQjtBQUFBLGVBQU8sS0FBUDs7K0RBQzJCLENBQUUsYUFBN0IsbURBQTJELENBQUUsYUFBN0Qsd0RBQzZCLENBQUUsY0FBN0IsbURBQTRELENBQUU7SUFKN0M7OzZCQU1yQixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO0FBQUE7QUFBQTtXQUFBLG1CQUFBO1FBQW1CO3FCQUNqQixJQUFDLENBQUEsY0FBRCxDQUFnQixZQUFoQixFQUE4QixRQUE5QjtBQURGOztJQURlOzs2QkFJakIsY0FBQSxHQUFnQixTQUFDLFlBQUQsRUFBZSxRQUFmO0FBQ2QsVUFBQTtNQUFBLGFBQUEsK0VBQXNFO2FBQ3RFLElBQUMsQ0FBQSxTQUFTLENBQUMsb0JBQVgsQ0FBZ0MsWUFBaEMsRUFBOEMsUUFBUSxDQUFDLFdBQXZELEVBQW9FLFFBQVEsQ0FBQyxZQUE3RSxFQUEyRixhQUEzRjtJQUZjOzs2QkFJaEIsYUFBQSxHQUFlLFNBQUMsS0FBRCxFQUFRLFlBQVIsRUFBc0IsR0FBdEI7QUFDYixVQUFBO01BRG9DLGlCQUFNLG1DQUFzQixhQUFQO01BQ3pELFFBQUEsR0FBVyxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxJQUFmO01BQ1gsYUFBQSxHQUFnQixJQUFDLENBQUEsWUFBYSxDQUFBLFlBQUE7TUFDOUIsSUFBQSxDQUFPLENBQUEsV0FBQSwyQkFBYyxhQUFhLENBQUUsb0JBQTdCLENBQVA7UUFDRSxXQUFBLEdBQWMsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsY0FBdkI7UUFDZCxJQUFvQyxhQUFwQztVQUFBLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBdEIsQ0FBMEIsS0FBMUIsRUFBQTs7UUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVgsQ0FBdUIsV0FBdkI7UUFDQSxJQUFDLENBQUEsWUFBYSxDQUFBLFlBQUEsQ0FBZCxHQUE4QixhQUFBLEdBQWdCO1VBQUMsYUFBQSxXQUFEO1VBQWMsVUFBQSxRQUFkO1VBSmhEOztNQVFBLElBQXFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBdkIsS0FBaUMsQ0FBdEU7UUFBQSxXQUFXLENBQUMsV0FBWixDQUF3QixRQUF4QixFQUFBOztNQUVBLGFBQWEsQ0FBQyxhQUFkLEdBQThCO01BQzlCLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBbEIsR0FBd0IsYUFBYSxDQUFDLEdBQWQsR0FBb0I7YUFDNUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFsQixHQUF5QixhQUFhLENBQUMsSUFBZCxHQUFxQjtJQWZqQzs7Ozs7QUE3QmpCIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgT3ZlcmxheU1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChAcHJlc2VudGVyLCBAY29udGFpbmVyLCBAdmlld3MpIC0+XG4gICAgQG92ZXJsYXlzQnlJZCA9IHt9XG5cbiAgcmVuZGVyOiAoc3RhdGUpIC0+XG4gICAgZm9yIGRlY29yYXRpb25JZCwgb3ZlcmxheSBvZiBzdGF0ZS5jb250ZW50Lm92ZXJsYXlzXG4gICAgICBpZiBAc2hvdWxkVXBkYXRlT3ZlcmxheShkZWNvcmF0aW9uSWQsIG92ZXJsYXkpXG4gICAgICAgIEByZW5kZXJPdmVybGF5KHN0YXRlLCBkZWNvcmF0aW9uSWQsIG92ZXJsYXkpXG5cbiAgICBmb3IgaWQsIHtvdmVybGF5Tm9kZX0gb2YgQG92ZXJsYXlzQnlJZFxuICAgICAgdW5sZXNzIHN0YXRlLmNvbnRlbnQub3ZlcmxheXMuaGFzT3duUHJvcGVydHkoaWQpXG4gICAgICAgIGRlbGV0ZSBAb3ZlcmxheXNCeUlkW2lkXVxuICAgICAgICBvdmVybGF5Tm9kZS5yZW1vdmUoKVxuXG4gIHNob3VsZFVwZGF0ZU92ZXJsYXk6IChkZWNvcmF0aW9uSWQsIG92ZXJsYXkpIC0+XG4gICAgY2FjaGVkT3ZlcmxheSA9IEBvdmVybGF5c0J5SWRbZGVjb3JhdGlvbklkXVxuICAgIHJldHVybiB0cnVlIHVubGVzcyBjYWNoZWRPdmVybGF5P1xuICAgIGNhY2hlZE92ZXJsYXkucGl4ZWxQb3NpdGlvbj8udG9wIGlzbnQgb3ZlcmxheS5waXhlbFBvc2l0aW9uPy50b3Agb3JcbiAgICAgIGNhY2hlZE92ZXJsYXkucGl4ZWxQb3NpdGlvbj8ubGVmdCBpc250IG92ZXJsYXkucGl4ZWxQb3NpdGlvbj8ubGVmdFxuXG4gIG1lYXN1cmVPdmVybGF5czogLT5cbiAgICBmb3IgZGVjb3JhdGlvbklkLCB7aXRlbVZpZXd9IG9mIEBvdmVybGF5c0J5SWRcbiAgICAgIEBtZWFzdXJlT3ZlcmxheShkZWNvcmF0aW9uSWQsIGl0ZW1WaWV3KVxuXG4gIG1lYXN1cmVPdmVybGF5OiAoZGVjb3JhdGlvbklkLCBpdGVtVmlldykgLT5cbiAgICBjb250ZW50TWFyZ2luID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZShpdGVtVmlldylbJ21hcmdpbi1sZWZ0J10pID8gMFxuICAgIEBwcmVzZW50ZXIuc2V0T3ZlcmxheURpbWVuc2lvbnMoZGVjb3JhdGlvbklkLCBpdGVtVmlldy5vZmZzZXRXaWR0aCwgaXRlbVZpZXcub2Zmc2V0SGVpZ2h0LCBjb250ZW50TWFyZ2luKVxuXG4gIHJlbmRlck92ZXJsYXk6IChzdGF0ZSwgZGVjb3JhdGlvbklkLCB7aXRlbSwgcGl4ZWxQb3NpdGlvbiwgY2xhc3M6IGtsYXNzfSkgLT5cbiAgICBpdGVtVmlldyA9IEB2aWV3cy5nZXRWaWV3KGl0ZW0pXG4gICAgY2FjaGVkT3ZlcmxheSA9IEBvdmVybGF5c0J5SWRbZGVjb3JhdGlvbklkXVxuICAgIHVubGVzcyBvdmVybGF5Tm9kZSA9IGNhY2hlZE92ZXJsYXk/Lm92ZXJsYXlOb2RlXG4gICAgICBvdmVybGF5Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20tb3ZlcmxheScpXG4gICAgICBvdmVybGF5Tm9kZS5jbGFzc0xpc3QuYWRkKGtsYXNzKSBpZiBrbGFzcz9cbiAgICAgIEBjb250YWluZXIuYXBwZW5kQ2hpbGQob3ZlcmxheU5vZGUpXG4gICAgICBAb3ZlcmxheXNCeUlkW2RlY29yYXRpb25JZF0gPSBjYWNoZWRPdmVybGF5ID0ge292ZXJsYXlOb2RlLCBpdGVtVmlld31cblxuICAgICMgVGhlIHNhbWUgbm9kZSBtYXkgYmUgdXNlZCBpbiBtb3JlIHRoYW4gb25lIG92ZXJsYXkuIFRoaXMgc3RlYWxzIHRoZSBub2RlXG4gICAgIyBiYWNrIGlmIGl0IGhhcyBiZWVuIGRpc3BsYXllZCBpbiBhbm90aGVyIG92ZXJsYXkuXG4gICAgb3ZlcmxheU5vZGUuYXBwZW5kQ2hpbGQoaXRlbVZpZXcpIGlmIG92ZXJsYXlOb2RlLmNoaWxkTm9kZXMubGVuZ3RoIGlzIDBcblxuICAgIGNhY2hlZE92ZXJsYXkucGl4ZWxQb3NpdGlvbiA9IHBpeGVsUG9zaXRpb25cbiAgICBvdmVybGF5Tm9kZS5zdHlsZS50b3AgPSBwaXhlbFBvc2l0aW9uLnRvcCArICdweCdcbiAgICBvdmVybGF5Tm9kZS5zdHlsZS5sZWZ0ID0gcGl4ZWxQb3NpdGlvbi5sZWZ0ICsgJ3B4J1xuIl19
