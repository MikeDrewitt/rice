(function() {
  var CustomGutterComponent, setDimensionsAndBackground;

  setDimensionsAndBackground = require('./gutter-component-helpers').setDimensionsAndBackground;

  module.exports = CustomGutterComponent = (function() {
    function CustomGutterComponent(arg) {
      this.gutter = arg.gutter, this.views = arg.views;
      this.decorationNodesById = {};
      this.decorationItemsById = {};
      this.visible = true;
      this.domNode = this.views.getView(this.gutter);
      this.decorationsNode = this.domNode.firstChild;
      this.decorationsNode.innerHTML = '';
    }

    CustomGutterComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    CustomGutterComponent.prototype.hideNode = function() {
      if (this.visible) {
        this.domNode.style.display = 'none';
        return this.visible = false;
      }
    };

    CustomGutterComponent.prototype.showNode = function() {
      if (!this.visible) {
        this.domNode.style.removeProperty('display');
        return this.visible = true;
      }
    };

    CustomGutterComponent.prototype.updateSync = function(state) {
      var decorationId, decorationInfo, decorationNode, decorationState, existingDecoration, newNode, ref, results, updatedDecorationIds;
      if (this.oldDimensionsAndBackgroundState == null) {
        this.oldDimensionsAndBackgroundState = {};
      }
      setDimensionsAndBackground(this.oldDimensionsAndBackgroundState, state.styles, this.decorationsNode);
      if (this.oldDecorationPositionState == null) {
        this.oldDecorationPositionState = {};
      }
      decorationState = state.content;
      updatedDecorationIds = new Set;
      for (decorationId in decorationState) {
        decorationInfo = decorationState[decorationId];
        updatedDecorationIds.add(decorationId);
        existingDecoration = this.decorationNodesById[decorationId];
        if (existingDecoration) {
          this.updateDecorationNode(existingDecoration, decorationId, decorationInfo);
        } else {
          newNode = this.buildDecorationNode(decorationId, decorationInfo);
          this.decorationNodesById[decorationId] = newNode;
          this.decorationsNode.appendChild(newNode);
        }
      }
      ref = this.decorationNodesById;
      results = [];
      for (decorationId in ref) {
        decorationNode = ref[decorationId];
        if (!updatedDecorationIds.has(decorationId)) {
          decorationNode.remove();
          delete this.decorationNodesById[decorationId];
          delete this.decorationItemsById[decorationId];
          results.push(delete this.oldDecorationPositionState[decorationId]);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };


    /*
    Section: Private Methods
     */

    CustomGutterComponent.prototype.buildDecorationNode = function(decorationId, decorationInfo) {
      var newNode;
      this.oldDecorationPositionState[decorationId] = {};
      newNode = document.createElement('div');
      newNode.style.position = 'absolute';
      this.updateDecorationNode(newNode, decorationId, decorationInfo);
      return newNode;
    };

    CustomGutterComponent.prototype.updateDecorationNode = function(node, decorationId, newDecorationInfo) {
      var oldPositionState;
      oldPositionState = this.oldDecorationPositionState[decorationId];
      if (oldPositionState.top !== newDecorationInfo.top + 'px') {
        node.style.top = newDecorationInfo.top + 'px';
        oldPositionState.top = newDecorationInfo.top + 'px';
      }
      if (oldPositionState.height !== newDecorationInfo.height + 'px') {
        node.style.height = newDecorationInfo.height + 'px';
        oldPositionState.height = newDecorationInfo.height + 'px';
      }
      if (newDecorationInfo["class"] && !node.classList.contains(newDecorationInfo["class"])) {
        node.className = 'decoration';
        node.classList.add(newDecorationInfo["class"]);
      } else if (!newDecorationInfo["class"]) {
        node.className = 'decoration';
      }
      return this.setDecorationItem(newDecorationInfo.item, newDecorationInfo.height, decorationId, node);
    };

    CustomGutterComponent.prototype.setDecorationItem = function(newItem, decorationHeight, decorationId, decorationNode) {
      var newItemNode;
      if (newItem !== this.decorationItemsById[decorationId]) {
        while (decorationNode.firstChild) {
          decorationNode.removeChild(decorationNode.firstChild);
        }
        delete this.decorationItemsById[decorationId];
        if (newItem) {
          newItemNode = null;
          if (newItem instanceof HTMLElement) {
            newItemNode = newItem;
          } else {
            newItemNode = newItem.element;
          }
          newItemNode.style.height = decorationHeight + 'px';
          decorationNode.appendChild(newItemNode);
          return this.decorationItemsById[decorationId] = newItem;
        }
      }
    };

    return CustomGutterComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jdXN0b20tZ3V0dGVyLWNvbXBvbmVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLDZCQUE4QixPQUFBLENBQVEsNEJBQVI7O0VBSy9CLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFFUywrQkFBQyxHQUFEO01BQUUsSUFBQyxDQUFBLGFBQUEsUUFBUSxJQUFDLENBQUEsWUFBQTtNQUN2QixJQUFDLENBQUEsbUJBQUQsR0FBdUI7TUFDdkIsSUFBQyxDQUFBLG1CQUFELEdBQXVCO01BQ3ZCLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFFWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQUMsQ0FBQSxNQUFoQjtNQUNYLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUM7TUFFNUIsSUFBQyxDQUFBLGVBQWUsQ0FBQyxTQUFqQixHQUE2QjtJQVJsQjs7b0NBVWIsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUE7SUFEUzs7b0NBR1osUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFHLElBQUMsQ0FBQSxPQUFKO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZixHQUF5QjtlQUN6QixJQUFDLENBQUEsT0FBRCxHQUFXLE1BRmI7O0lBRFE7O29DQUtWLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFSO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBZixDQUE4QixTQUE5QjtlQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsS0FGYjs7SUFEUTs7b0NBT1YsVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUNWLFVBQUE7O1FBQUEsSUFB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LEVBQTJDLGlCQUFpQixDQUFDLE1BQTdELEVBQXFFLFlBQXJFLEVBQW1GLElBQW5GO0lBakJvQjs7b0NBcUJ0QixpQkFBQSxHQUFtQixTQUFDLE9BQUQsRUFBVSxnQkFBVixFQUE0QixZQUE1QixFQUEwQyxjQUExQztBQUNqQixVQUFBO01BQUEsSUFBRyxPQUFBLEtBQWEsSUFBQyxDQUFBLG1CQUFvQixDQUFBLFlBQUEsQ0FBckM7QUFDRSxlQUFNLGNBQWMsQ0FBQyxVQUFyQjtVQUNFLGNBQWMsQ0FBQyxXQUFmLENBQTJCLGNBQWMsQ0FBQyxVQUExQztRQURGO1FBRUEsT0FBTyxJQUFDLENBQUEsbUJBQW9CLENBQUEsWUFBQTtRQUU1QixJQUFHLE9BQUg7VUFDRSxXQUFBLEdBQWM7VUFDZCxJQUFHLE9BQUEsWUFBbUIsV0FBdEI7WUFDRSxXQUFBLEdBQWMsUUFEaEI7V0FBQSxNQUFBO1lBR0UsV0FBQSxHQUFjLE9BQU8sQ0FBQyxRQUh4Qjs7VUFLQSxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQWxCLEdBQTJCLGdCQUFBLEdBQW1CO1VBQzlDLGNBQWMsQ0FBQyxXQUFmLENBQTJCLFdBQTNCO2lCQUNBLElBQUMsQ0FBQSxtQkFBb0IsQ0FBQSxZQUFBLENBQXJCLEdBQXFDLFFBVHZDO1NBTEY7O0lBRGlCOzs7OztBQTdGckIiLCJzb3VyY2VzQ29udGVudCI6WyJ7c2V0RGltZW5zaW9uc0FuZEJhY2tncm91bmR9ID0gcmVxdWlyZSAnLi9ndXR0ZXItY29tcG9uZW50LWhlbHBlcnMnXG5cbiMgVGhpcyBjbGFzcyByZXByZXNlbnRzIGEgZ3V0dGVyIG90aGVyIHRoYW4gdGhlICdsaW5lLW51bWJlcnMnIGd1dHRlci5cbiMgVGhlIGNvbnRlbnRzIG9mIHRoaXMgZ3V0dGVyIG1heSBiZSBzcGVjaWZpZWQgYnkgRGVjb3JhdGlvbnMuXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEN1c3RvbUd1dHRlckNvbXBvbmVudFxuXG4gIGNvbnN0cnVjdG9yOiAoe0BndXR0ZXIsIEB2aWV3c30pIC0+XG4gICAgQGRlY29yYXRpb25Ob2Rlc0J5SWQgPSB7fVxuICAgIEBkZWNvcmF0aW9uSXRlbXNCeUlkID0ge31cbiAgICBAdmlzaWJsZSA9IHRydWVcblxuICAgIEBkb21Ob2RlID0gQHZpZXdzLmdldFZpZXcoQGd1dHRlcilcbiAgICBAZGVjb3JhdGlvbnNOb2RlID0gQGRvbU5vZGUuZmlyc3RDaGlsZFxuICAgICMgQ2xlYXIgdGhlIGNvbnRlbnRzIGluIGNhc2UgdGhlIGRvbU5vZGUgaXMgYmVpbmcgcmV1c2VkLlxuICAgIEBkZWNvcmF0aW9uc05vZGUuaW5uZXJIVE1MID0gJydcblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgaGlkZU5vZGU6IC0+XG4gICAgaWYgQHZpc2libGVcbiAgICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICBzaG93Tm9kZTogLT5cbiAgICBpZiBub3QgQHZpc2libGVcbiAgICAgIEBkb21Ob2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdkaXNwbGF5JylcbiAgICAgIEB2aXNpYmxlID0gdHJ1ZVxuXG4gICMgYHN0YXRlYCBpcyBhIHN1YnNldCBvZiB0aGUgVGV4dEVkaXRvclByZXNlbnRlciBzdGF0ZSB0aGF0IGlzIHNwZWNpZmljXG4gICMgdG8gdGhpcyBsaW5lIG51bWJlciBndXR0ZXIuXG4gIHVwZGF0ZVN5bmM6IChzdGF0ZSkgLT5cbiAgICBAb2xkRGltZW5zaW9uc0FuZEJhY2tncm91bmRTdGF0ZSA/PSB7fVxuICAgIHNldERpbWVuc2lvbnNBbmRCYWNrZ3JvdW5kKEBvbGREaW1lbnNpb25zQW5kQmFja2dyb3VuZFN0YXRlLCBzdGF0ZS5zdHlsZXMsIEBkZWNvcmF0aW9uc05vZGUpXG5cbiAgICBAb2xkRGVjb3JhdGlvblBvc2l0aW9uU3RhdGUgPz0ge31cbiAgICBkZWNvcmF0aW9uU3RhdGUgPSBzdGF0ZS5jb250ZW50XG5cbiAgICB1cGRhdGVkRGVjb3JhdGlvbklkcyA9IG5ldyBTZXRcbiAgICBmb3IgZGVjb3JhdGlvbklkLCBkZWNvcmF0aW9uSW5mbyBvZiBkZWNvcmF0aW9uU3RhdGVcbiAgICAgIHVwZGF0ZWREZWNvcmF0aW9uSWRzLmFkZChkZWNvcmF0aW9uSWQpXG4gICAgICBleGlzdGluZ0RlY29yYXRpb24gPSBAZGVjb3JhdGlvbk5vZGVzQnlJZFtkZWNvcmF0aW9uSWRdXG4gICAgICBpZiBleGlzdGluZ0RlY29yYXRpb25cbiAgICAgICAgQHVwZGF0ZURlY29yYXRpb25Ob2RlKGV4aXN0aW5nRGVjb3JhdGlvbiwgZGVjb3JhdGlvbklkLCBkZWNvcmF0aW9uSW5mbylcbiAgICAgIGVsc2VcbiAgICAgICAgbmV3Tm9kZSA9IEBidWlsZERlY29yYXRpb25Ob2RlKGRlY29yYXRpb25JZCwgZGVjb3JhdGlvbkluZm8pXG4gICAgICAgIEBkZWNvcmF0aW9uTm9kZXNCeUlkW2RlY29yYXRpb25JZF0gPSBuZXdOb2RlXG4gICAgICAgIEBkZWNvcmF0aW9uc05vZGUuYXBwZW5kQ2hpbGQobmV3Tm9kZSlcblxuICAgIGZvciBkZWNvcmF0aW9uSWQsIGRlY29yYXRpb25Ob2RlIG9mIEBkZWNvcmF0aW9uTm9kZXNCeUlkXG4gICAgICBpZiBub3QgdXBkYXRlZERlY29yYXRpb25JZHMuaGFzKGRlY29yYXRpb25JZClcbiAgICAgICAgZGVjb3JhdGlvbk5vZGUucmVtb3ZlKClcbiAgICAgICAgZGVsZXRlIEBkZWNvcmF0aW9uTm9kZXNCeUlkW2RlY29yYXRpb25JZF1cbiAgICAgICAgZGVsZXRlIEBkZWNvcmF0aW9uSXRlbXNCeUlkW2RlY29yYXRpb25JZF1cbiAgICAgICAgZGVsZXRlIEBvbGREZWNvcmF0aW9uUG9zaXRpb25TdGF0ZVtkZWNvcmF0aW9uSWRdXG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGUgTWV0aG9kc1xuICAjIyNcblxuICAjIEJ1aWxkcyBhbmQgcmV0dXJucyBhbiBIVE1MRWxlbWVudCB0byByZXByZXNlbnQgdGhlIHNwZWNpZmllZCBkZWNvcmF0aW9uLlxuICBidWlsZERlY29yYXRpb25Ob2RlOiAoZGVjb3JhdGlvbklkLCBkZWNvcmF0aW9uSW5mbykgLT5cbiAgICBAb2xkRGVjb3JhdGlvblBvc2l0aW9uU3RhdGVbZGVjb3JhdGlvbklkXSA9IHt9XG4gICAgbmV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgbmV3Tm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICBAdXBkYXRlRGVjb3JhdGlvbk5vZGUobmV3Tm9kZSwgZGVjb3JhdGlvbklkLCBkZWNvcmF0aW9uSW5mbylcbiAgICBuZXdOb2RlXG5cbiAgIyBVcGRhdGVzIHRoZSBleGlzdGluZyBIVE1MTm9kZSB3aXRoIHRoZSBuZXcgZGVjb3JhdGlvbiBpbmZvLiBBdHRlbXB0cyB0b1xuICAjIG1pbmltaXplIGNoYW5nZXMgdG8gdGhlIERPTS5cbiAgdXBkYXRlRGVjb3JhdGlvbk5vZGU6IChub2RlLCBkZWNvcmF0aW9uSWQsIG5ld0RlY29yYXRpb25JbmZvKSAtPlxuICAgIG9sZFBvc2l0aW9uU3RhdGUgPSBAb2xkRGVjb3JhdGlvblBvc2l0aW9uU3RhdGVbZGVjb3JhdGlvbklkXVxuXG4gICAgaWYgb2xkUG9zaXRpb25TdGF0ZS50b3AgaXNudCBuZXdEZWNvcmF0aW9uSW5mby50b3AgKyAncHgnXG4gICAgICBub2RlLnN0eWxlLnRvcCA9IG5ld0RlY29yYXRpb25JbmZvLnRvcCArICdweCdcbiAgICAgIG9sZFBvc2l0aW9uU3RhdGUudG9wID0gbmV3RGVjb3JhdGlvbkluZm8udG9wICsgJ3B4J1xuXG4gICAgaWYgb2xkUG9zaXRpb25TdGF0ZS5oZWlnaHQgaXNudCBuZXdEZWNvcmF0aW9uSW5mby5oZWlnaHQgKyAncHgnXG4gICAgICBub2RlLnN0eWxlLmhlaWdodCA9IG5ld0RlY29yYXRpb25JbmZvLmhlaWdodCArICdweCdcbiAgICAgIG9sZFBvc2l0aW9uU3RhdGUuaGVpZ2h0ID0gbmV3RGVjb3JhdGlvbkluZm8uaGVpZ2h0ICsgJ3B4J1xuXG4gICAgaWYgbmV3RGVjb3JhdGlvbkluZm8uY2xhc3MgYW5kIG5vdCBub2RlLmNsYXNzTGlzdC5jb250YWlucyhuZXdEZWNvcmF0aW9uSW5mby5jbGFzcylcbiAgICAgIG5vZGUuY2xhc3NOYW1lID0gJ2RlY29yYXRpb24nXG4gICAgICBub2RlLmNsYXNzTGlzdC5hZGQobmV3RGVjb3JhdGlvbkluZm8uY2xhc3MpXG4gICAgZWxzZSBpZiBub3QgbmV3RGVjb3JhdGlvbkluZm8uY2xhc3NcbiAgICAgIG5vZGUuY2xhc3NOYW1lID0gJ2RlY29yYXRpb24nXG5cbiAgICBAc2V0RGVjb3JhdGlvbkl0ZW0obmV3RGVjb3JhdGlvbkluZm8uaXRlbSwgbmV3RGVjb3JhdGlvbkluZm8uaGVpZ2h0LCBkZWNvcmF0aW9uSWQsIG5vZGUpXG5cbiAgIyBTZXRzIHRoZSBkZWNvcmF0aW9uSXRlbSBvbiB0aGUgZGVjb3JhdGlvbk5vZGUuXG4gICMgSWYgYGRlY29yYXRpb25JdGVtYCBpcyB1bmRlZmluZWQsIHRoZSBkZWNvcmF0aW9uTm9kZSdzIGNoaWxkIGl0ZW0gd2lsbCBiZSBjbGVhcmVkLlxuICBzZXREZWNvcmF0aW9uSXRlbTogKG5ld0l0ZW0sIGRlY29yYXRpb25IZWlnaHQsIGRlY29yYXRpb25JZCwgZGVjb3JhdGlvbk5vZGUpIC0+XG4gICAgaWYgbmV3SXRlbSBpc250IEBkZWNvcmF0aW9uSXRlbXNCeUlkW2RlY29yYXRpb25JZF1cbiAgICAgIHdoaWxlIGRlY29yYXRpb25Ob2RlLmZpcnN0Q2hpbGRcbiAgICAgICAgZGVjb3JhdGlvbk5vZGUucmVtb3ZlQ2hpbGQoZGVjb3JhdGlvbk5vZGUuZmlyc3RDaGlsZClcbiAgICAgIGRlbGV0ZSBAZGVjb3JhdGlvbkl0ZW1zQnlJZFtkZWNvcmF0aW9uSWRdXG5cbiAgICAgIGlmIG5ld0l0ZW1cbiAgICAgICAgbmV3SXRlbU5vZGUgPSBudWxsXG4gICAgICAgIGlmIG5ld0l0ZW0gaW5zdGFuY2VvZiBIVE1MRWxlbWVudFxuICAgICAgICAgIG5ld0l0ZW1Ob2RlID0gbmV3SXRlbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbmV3SXRlbU5vZGUgPSBuZXdJdGVtLmVsZW1lbnRcblxuICAgICAgICBuZXdJdGVtTm9kZS5zdHlsZS5oZWlnaHQgPSBkZWNvcmF0aW9uSGVpZ2h0ICsgJ3B4J1xuICAgICAgICBkZWNvcmF0aW9uTm9kZS5hcHBlbmRDaGlsZChuZXdJdGVtTm9kZSlcbiAgICAgICAgQGRlY29yYXRpb25JdGVtc0J5SWRbZGVjb3JhdGlvbklkXSA9IG5ld0l0ZW1cbiJdfQ==
