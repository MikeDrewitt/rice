(function() {
  var HighlightsComponent, RegionStyleProperties, SpaceRegex;

  RegionStyleProperties = ['top', 'left', 'right', 'width', 'height'];

  SpaceRegex = /\s+/;

  module.exports = HighlightsComponent = (function() {
    HighlightsComponent.prototype.oldState = null;

    function HighlightsComponent(domElementPool) {
      this.domElementPool = domElementPool;
      this.highlightNodesById = {};
      this.regionNodesByHighlightId = {};
      this.domNode = this.domElementPool.buildElement("div", "highlights");
    }

    HighlightsComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    HighlightsComponent.prototype.updateSync = function(state) {
      var highlightNode, highlightState, id, newState;
      newState = state.highlights;
      if (this.oldState == null) {
        this.oldState = {};
      }
      for (id in this.oldState) {
        if (newState[id] == null) {
          this.domElementPool.freeElementAndDescendants(this.highlightNodesById[id]);
          delete this.highlightNodesById[id];
          delete this.regionNodesByHighlightId[id];
          delete this.oldState[id];
        }
      }
      for (id in newState) {
        highlightState = newState[id];
        if (this.oldState[id] == null) {
          highlightNode = this.domElementPool.buildElement("div", "highlight");
          this.highlightNodesById[id] = highlightNode;
          this.regionNodesByHighlightId[id] = {};
          this.domNode.appendChild(highlightNode);
        }
        this.updateHighlightNode(id, highlightState);
      }
    };

    HighlightsComponent.prototype.updateHighlightNode = function(id, newHighlightState) {
      var base, highlightNode, oldHighlightState, ref, ref1;
      highlightNode = this.highlightNodesById[id];
      oldHighlightState = ((base = this.oldState)[id] != null ? base[id] : base[id] = {
        regions: [],
        flashCount: 0
      });
      if (newHighlightState["class"] !== oldHighlightState["class"]) {
        if (oldHighlightState["class"] != null) {
          if (SpaceRegex.test(oldHighlightState["class"])) {
            (ref = highlightNode.classList).remove.apply(ref, oldHighlightState["class"].split(SpaceRegex));
          } else {
            highlightNode.classList.remove(oldHighlightState["class"]);
          }
        }
        if (SpaceRegex.test(newHighlightState["class"])) {
          (ref1 = highlightNode.classList).add.apply(ref1, newHighlightState["class"].split(SpaceRegex));
        } else {
          highlightNode.classList.add(newHighlightState["class"]);
        }
        oldHighlightState["class"] = newHighlightState["class"];
      }
      this.updateHighlightRegions(id, newHighlightState);
      return this.flashHighlightNodeIfRequested(id, newHighlightState);
    };

    HighlightsComponent.prototype.updateHighlightRegions = function(id, newHighlightState) {
      var highlightNode, i, j, k, len, len1, newRegionState, oldHighlightState, oldRegionState, property, ref, regionNode;
      oldHighlightState = this.oldState[id];
      highlightNode = this.highlightNodesById[id];
      while (oldHighlightState.regions.length > newHighlightState.regions.length) {
        oldHighlightState.regions.pop();
        this.domElementPool.freeElementAndDescendants(this.regionNodesByHighlightId[id][oldHighlightState.regions.length]);
        delete this.regionNodesByHighlightId[id][oldHighlightState.regions.length];
      }
      ref = newHighlightState.regions;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        newRegionState = ref[i];
        if (oldHighlightState.regions[i] == null) {
          oldHighlightState.regions[i] = {};
          regionNode = this.domElementPool.buildElement("div", "region");
          regionNode.style.boxSizing = "border-box";
          if (newHighlightState.deprecatedRegionClass != null) {
            regionNode.classList.add(newHighlightState.deprecatedRegionClass);
          }
          this.regionNodesByHighlightId[id][i] = regionNode;
          highlightNode.appendChild(regionNode);
        }
        oldRegionState = oldHighlightState.regions[i];
        regionNode = this.regionNodesByHighlightId[id][i];
        for (k = 0, len1 = RegionStyleProperties.length; k < len1; k++) {
          property = RegionStyleProperties[k];
          if (newRegionState[property] !== oldRegionState[property]) {
            oldRegionState[property] = newRegionState[property];
            if (newRegionState[property] != null) {
              regionNode.style[property] = newRegionState[property] + 'px';
            } else {
              regionNode.style[property] = '';
            }
          }
        }
      }
    };

    HighlightsComponent.prototype.flashHighlightNodeIfRequested = function(id, newHighlightState) {
      var addFlashClass, highlightNode, oldHighlightState, removeFlashClass;
      oldHighlightState = this.oldState[id];
      if (newHighlightState.needsFlash && oldHighlightState.flashCount !== newHighlightState.flashCount) {
        highlightNode = this.highlightNodesById[id];
        addFlashClass = (function(_this) {
          return function() {
            highlightNode.classList.add(newHighlightState.flashClass);
            oldHighlightState.flashClass = newHighlightState.flashClass;
            return _this.flashTimeoutId = setTimeout(removeFlashClass, newHighlightState.flashDuration);
          };
        })(this);
        removeFlashClass = (function(_this) {
          return function() {
            highlightNode.classList.remove(oldHighlightState.flashClass);
            oldHighlightState.flashClass = null;
            return clearTimeout(_this.flashTimeoutId);
          };
        })(this);
        if (oldHighlightState.flashClass != null) {
          removeFlashClass();
          requestAnimationFrame(addFlashClass);
        } else {
          addFlashClass();
        }
        return oldHighlightState.flashCount = newHighlightState.flashCount;
      }
    };

    return HighlightsComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9oaWdobGlnaHRzLWNvbXBvbmVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLHFCQUFBLEdBQXdCLENBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0MsUUFBbEM7O0VBQ3hCLFVBQUEsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNNO2tDQUNKLFFBQUEsR0FBVTs7SUFFRyw2QkFBQyxjQUFEO01BQUMsSUFBQyxDQUFBLGlCQUFEO01BQ1osSUFBQyxDQUFBLGtCQUFELEdBQXNCO01BQ3RCLElBQUMsQ0FBQSx3QkFBRCxHQUE0QjtNQUU1QixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxjQUFjLENBQUMsWUFBaEIsQ0FBNkIsS0FBN0IsRUFBb0MsWUFBcEM7SUFKQTs7a0NBTWIsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUE7SUFEUzs7a0NBR1osVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUNWLFVBQUE7TUFBQSxRQUFBLEdBQVcsS0FBSyxDQUFDOztRQUNqQixJQUFDLENBQUEsV0FBWTs7QUFHYixXQUFBLG1CQUFBO1FBQ0UsSUFBTyxvQkFBUDtVQUNFLElBQUMsQ0FBQSxjQUFjLENBQUMseUJBQWhCLENBQTBDLElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxFQUFBLENBQTlEO1VBQ0EsT0FBTyxJQUFDLENBQUEsa0JBQW1CLENBQUEsRUFBQTtVQUMzQixPQUFPLElBQUMsQ0FBQSx3QkFBeUIsQ0FBQSxFQUFBO1VBQ2pDLE9BQU8sSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLEVBSm5COztBQURGO0FBUUEsV0FBQSxjQUFBOztRQUNFLElBQU8seUJBQVA7VUFDRSxhQUFBLEdBQWdCLElBQUMsQ0FB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QzttQkFDakQsS0FBQyxDQUFBLGNBQUQsR0FBa0IsVUFBQSxDQUFXLGdCQUFYLEVBQTZCLGlCQUFpQixDQUFDLGFBQS9DO1VBSEo7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBS2hCLGdCQUFBLEdBQW1CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7WUFDakIsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF4QixDQUErQixpQkFBaUIsQ0FBQyxVQUFqRDtZQUNBLGlCQUFpQixDQUFDLFVBQWxCLEdBQStCO21CQUMvQixZQUFBLENBQWEsS0FBQyxDQUFBLGNBQWQ7VUFIaUI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBS25CLElBQUcsb0NBQUg7VUFDRSxnQkFBQSxDQUFBO1VBQ0EscUJBQUEsQ0FBc0IsYUFBdEIsRUFGRjtTQUFBLE1BQUE7VUFJRSxhQUFBLENBQUEsRUFKRjs7ZUFNQSxpQkFBaUIsQ0FBQyxVQUFsQixHQUErQixpQkFBaUIsQ0FBQyxXQW5CbkQ7O0lBRjZCOzs7OztBQWpHakMiLCJzb3VyY2VzQ29udGVudCI6WyJSZWdpb25TdHlsZVByb3BlcnRpZXMgPSBbJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ3dpZHRoJywgJ2hlaWdodCddXG5TcGFjZVJlZ2V4ID0gL1xccysvXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEhpZ2hsaWdodHNDb21wb25lbnRcbiAgb2xkU3RhdGU6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBkb21FbGVtZW50UG9vbCkgLT5cbiAgICBAaGlnaGxpZ2h0Tm9kZXNCeUlkID0ge31cbiAgICBAcmVnaW9uTm9kZXNCeUhpZ2hsaWdodElkID0ge31cblxuICAgIEBkb21Ob2RlID0gQGRvbUVsZW1lbnRQb29sLmJ1aWxkRWxlbWVudChcImRpdlwiLCBcImhpZ2hsaWdodHNcIilcblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgdXBkYXRlU3luYzogKHN0YXRlKSAtPlxuICAgIG5ld1N0YXRlID0gc3RhdGUuaGlnaGxpZ2h0c1xuICAgIEBvbGRTdGF0ZSA/PSB7fVxuXG4gICAgIyByZW1vdmUgaGlnaGxpZ2h0c1xuICAgIGZvciBpZCBvZiBAb2xkU3RhdGVcbiAgICAgIHVubGVzcyBuZXdTdGF0ZVtpZF0/XG4gICAgICAgIEBkb21FbGVtZW50UG9vbC5mcmVlRWxlbWVudEFuZERlc2NlbmRhbnRzKEBoaWdobGlnaHROb2Rlc0J5SWRbaWRdKVxuICAgICAgICBkZWxldGUgQGhpZ2hsaWdodE5vZGVzQnlJZFtpZF1cbiAgICAgICAgZGVsZXRlIEByZWdpb25Ob2Rlc0J5SGlnaGxpZ2h0SWRbaWRdXG4gICAgICAgIGRlbGV0ZSBAb2xkU3RhdGVbaWRdXG5cbiAgICAjIGFkZCBvciB1cGRhdGUgaGlnaGxpZ2h0c1xuICAgIGZvciBpZCwgaGlnaGxpZ2h0U3RhdGUgb2YgbmV3U3RhdGVcbiAgICAgIHVubGVzcyBAb2xkU3RhdGVbaWRdP1xuICAgICAgICBoaWdobGlnaHROb2RlID0gQGRvbUVsZW1lbnRQb29sLmJ1aWxkRWxlbWVudChcImRpdlwiLCBcImhpZ2hsaWdodFwiKVxuICAgICAgICBAaGlnaGxpZ2h0Tm9kZXNCeUlkW2lkXSA9IGhpZ2hsaWdodE5vZGVcbiAgICAgICAgQHJlZ2lvbk5vZGVzQnlIaWdobGlnaHRJZFtpZF0gPSB7fVxuICAgICAgICBAZG9tTm9kZS5hcHBlbmRDaGlsZChoaWdobGlnaHROb2RlKVxuICAgICAgQHVwZGF0ZUhpZ2hsaWdodE5vZGUoaWQsIGhpZ2hsaWdodFN0YXRlKVxuXG4gICAgcmV0dXJuXG5cbiAgdXBkYXRlSGlnaGxpZ2h0Tm9kZTogKGlkLCBuZXdIaWdobGlnaHRTdGF0ZSkgLT5cbiAgICBoaWdobGlnaHROb2RlID0gQGhpZ2hsaWdodE5vZGVzQnlJZFtpZF1cbiAgICBvbGRIaWdobGlnaHRTdGF0ZSA9IChAb2xkU3RhdGVbaWRdID89IHtyZWdpb25zOiBbXSwgZmxhc2hDb3VudDogMH0pXG5cbiAgICAjIHVwZGF0ZSBjbGFzc1xuICAgIGlmIG5ld0hpZ2hsaWdodFN0YXRlLmNsYXNzIGlzbnQgb2xkSGlnaGxpZ2h0U3RhdGUuY2xhc3NcbiAgICAgIGlmIG9sZEhpZ2hsaWdodFN0YXRlLmNsYXNzP1xuICAgICAgICBpZiBTcGFjZVJlZ2V4LnRlc3Qob2xkSGlnaGxpZ2h0U3RhdGUuY2xhc3MpXG4gICAgICAgICAgaGlnaGxpZ2h0Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKG9sZEhpZ2hsaWdodFN0YXRlLmNsYXNzLnNwbGl0KFNwYWNlUmVnZXgpLi4uKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaGlnaGxpZ2h0Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKG9sZEhpZ2hsaWdodFN0YXRlLmNsYXNzKVxuXG4gICAgICBpZiBTcGFjZVJlZ2V4LnRlc3QobmV3SGlnaGxpZ2h0U3RhdGUuY2xhc3MpXG4gICAgICAgIGhpZ2hsaWdodE5vZGUuY2xhc3NMaXN0LmFkZChuZXdIaWdobGlnaHRTdGF0ZS5jbGFzcy5zcGxpdChTcGFjZVJlZ2V4KS4uLilcbiAgICAgIGVsc2VcbiAgICAgICAgaGlnaGxpZ2h0Tm9kZS5jbGFzc0xpc3QuYWRkKG5ld0hpZ2hsaWdodFN0YXRlLmNsYXNzKVxuXG4gICAgICBvbGRIaWdobGlnaHRTdGF0ZS5jbGFzcyA9IG5ld0hpZ2hsaWdodFN0YXRlLmNsYXNzXG5cbiAgICBAdXBkYXRlSGlnaGxpZ2h0UmVnaW9ucyhpZCwgbmV3SGlnaGxpZ2h0U3RhdGUpXG4gICAgQGZsYXNoSGlnaGxpZ2h0Tm9kZUlmUmVxdWVzdGVkKGlkLCBuZXdIaWdobGlnaHRTdGF0ZSlcblxuICB1cGRhdGVIaWdobGlnaHRSZWdpb25zOiAoaWQsIG5ld0hpZ2hsaWdodFN0YXRlKSAtPlxuICAgIG9sZEhpZ2hsaWdodFN0YXRlID0gQG9sZFN0YXRlW2lkXVxuICAgIGhpZ2hsaWdodE5vZGUgPSBAaGlnaGxpZ2h0Tm9kZXNCeUlkW2lkXVxuXG4gICAgIyByZW1vdmUgcmVnaW9uc1xuICAgIHdoaWxlIG9sZEhpZ2hsaWdodFN0YXRlLnJlZ2lvbnMubGVuZ3RoID4gbmV3SGlnaGxpZ2h0U3RhdGUucmVnaW9ucy5sZW5ndGhcbiAgICAgIG9sZEhpZ2hsaWdodFN0YXRlLnJlZ2lvbnMucG9wKClcbiAgICAgIEBkb21FbGVtZW50UG9vbC5mcmVlRWxlbWVudEFuZERlc2NlbmRhbnRzKEByZWdpb25Ob2Rlc0J5SGlnaGxpZ2h0SWRbaWRdW29sZEhpZ2hsaWdodFN0YXRlLnJlZ2lvbnMubGVuZ3RoXSlcbiAgICAgIGRlbGV0ZSBAcmVnaW9uTm9kZXNCeUhpZ2hsaWdodElkW2lkXVtvbGRIaWdobGlnaHRTdGF0ZS5yZWdpb25zLmxlbmd0aF1cblxuICAgICMgYWRkIG9yIHVwZGF0ZSByZWdpb25zXG4gICAgZm9yIG5ld1JlZ2lvblN0YXRlLCBpIGluIG5ld0hpZ2hsaWdodFN0YXRlLnJlZ2lvbnNcbiAgICAgIHVubGVzcyBvbGRIaWdobGlnaHRTdGF0ZS5yZWdpb25zW2ldP1xuICAgICAgICBvbGRIaWdobGlnaHRTdGF0ZS5yZWdpb25zW2ldID0ge31cbiAgICAgICAgcmVnaW9uTm9kZSA9IEBkb21FbGVtZW50UG9vbC5idWlsZEVsZW1lbnQoXCJkaXZcIiwgXCJyZWdpb25cIilcbiAgICAgICAgIyBUaGlzIHByZXZlbnRzIGhpZ2hsaWdodHMgYXQgdGhlIHRpbGVzIGJvdW5kYXJpZXMgdG8gYmUgaGlkZGVuIGJ5IHRoZVxuICAgICAgICAjIHN1YnNlcXVlbnQgdGlsZS4gV2hlbiB0aGlzIGhhcHBlbnMsIHN1YnBpeGVsIGFudGktYWxpYXNpbmcgZ2V0c1xuICAgICAgICAjIGRpc2FibGVkLlxuICAgICAgICByZWdpb25Ob2RlLnN0eWxlLmJveFNpemluZyA9IFwiYm9yZGVyLWJveFwiXG4gICAgICAgIHJlZ2lvbk5vZGUuY2xhc3NMaXN0LmFkZChuZXdIaWdobGlnaHRTdGF0ZS5kZXByZWNhdGVkUmVnaW9uQ2xhc3MpIGlmIG5ld0hpZ2hsaWdodFN0YXRlLmRlcHJlY2F0ZWRSZWdpb25DbGFzcz9cbiAgICAgICAgQHJlZ2lvbk5vZGVzQnlIaWdobGlnaHRJZFtpZF1baV0gPSByZWdpb25Ob2RlXG4gICAgICAgIGhpZ2hsaWdodE5vZGUuYXBwZW5kQ2hpbGQocmVnaW9uTm9kZSlcblxuICAgICAgb2xkUmVnaW9uU3RhdGUgPSBvbGRIaWdobGlnaHRTdGF0ZS5yZWdpb25zW2ldXG4gICAgICByZWdpb25Ob2RlID0gQHJlZ2lvbk5vZGVzQnlIaWdobGlnaHRJZFtpZF1baV1cblxuICAgICAgZm9yIHByb3BlcnR5IGluIFJlZ2lvblN0eWxlUHJvcGVydGllc1xuICAgICAgICBpZiBuZXdSZWdpb25TdGF0ZVtwcm9wZXJ0eV0gaXNudCBvbGRSZWdpb25TdGF0ZVtwcm9wZXJ0eV1cbiAgICAgICAgICBvbGRSZWdpb25TdGF0ZVtwcm9wZXJ0eV0gPSBuZXdSZWdpb25TdGF0ZVtwcm9wZXJ0eV1cbiAgICAgICAgICBpZiBuZXdSZWdpb25TdGF0ZVtwcm9wZXJ0eV0/XG4gICAgICAgICAgICByZWdpb25Ob2RlLnN0eWxlW3Byb3BlcnR5XSA9IG5ld1JlZ2lvblN0YXRlW3Byb3BlcnR5XSArICdweCdcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZWdpb25Ob2RlLnN0eWxlW3Byb3BlcnR5XSA9ICcnXG5cbiAgICByZXR1cm5cblxuICBmbGFzaEhpZ2hsaWdodE5vZGVJZlJlcXVlc3RlZDogKGlkLCBuZXdIaWdobGlnaHRTdGF0ZSkgLT5cbiAgICBvbGRIaWdobGlnaHRTdGF0ZSA9IEBvbGRTdGF0ZVtpZF1cbiAgICBpZiBuZXdIaWdobGlnaHRTdGF0ZS5uZWVkc0ZsYXNoIGFuZCBvbGRIaWdobGlnaHRTdGF0ZS5mbGFzaENvdW50IGlzbnQgbmV3SGlnaGxpZ2h0U3RhdGUuZmxhc2hDb3VudFxuICAgICAgaGlnaGxpZ2h0Tm9kZSA9IEBoaWdobGlnaHROb2Rlc0J5SWRbaWRdXG5cbiAgICAgIGFkZEZsYXNoQ2xhc3MgPSA9PlxuICAgICAgICBoaWdobGlnaHROb2RlLmNsYXNzTGlzdC5hZGQobmV3SGlnaGxpZ2h0U3RhdGUuZmxhc2hDbGFzcylcbiAgICAgICAgb2xkSGlnaGxpZ2h0U3RhdGUuZmxhc2hDbGFzcyA9IG5ld0hpZ2hsaWdodFN0YXRlLmZsYXNoQ2xhc3NcbiAgICAgICAgQGZsYXNoVGltZW91dElkID0gc2V0VGltZW91dChyZW1vdmVGbGFzaENsYXNzLCBuZXdIaWdobGlnaHRTdGF0ZS5mbGFzaER1cmF0aW9uKVxuXG4gICAgICByZW1vdmVGbGFzaENsYXNzID0gPT5cbiAgICAgICAgaGlnaGxpZ2h0Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKG9sZEhpZ2hsaWdodFN0YXRlLmZsYXNoQ2xhc3MpXG4gICAgICAgIG9sZEhpZ2hsaWdodFN0YXRlLmZsYXNoQ2xhc3MgPSBudWxsXG4gICAgICAgIGNsZWFyVGltZW91dChAZmxhc2hUaW1lb3V0SWQpXG5cbiAgICAgIGlmIG9sZEhpZ2hsaWdodFN0YXRlLmZsYXNoQ2xhc3M/XG4gICAgICAgIHJlbW92ZUZsYXNoQ2xhc3MoKVxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYWRkRmxhc2hDbGFzcylcbiAgICAgIGVsc2VcbiAgICAgICAgYWRkRmxhc2hDbGFzcygpXG5cbiAgICAgIG9sZEhpZ2hsaWdodFN0YXRlLmZsYXNoQ291bnQgPSBuZXdIaWdobGlnaHRTdGF0ZS5mbGFzaENvdW50XG4iXX0=
