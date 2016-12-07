(function() {
  var LineNumbersTileComponent, _;

  _ = require('underscore-plus');

  module.exports = LineNumbersTileComponent = (function() {
    LineNumbersTileComponent.createDummy = function(domElementPool) {
      return new LineNumbersTileComponent({
        id: -1,
        domElementPool: domElementPool
      });
    };

    function LineNumbersTileComponent(arg) {
      this.id = arg.id, this.domElementPool = arg.domElementPool;
      this.lineNumberNodesById = {};
      this.domNode = this.domElementPool.buildElement("div");
      this.domNode.style.position = "absolute";
      this.domNode.style.display = "block";
      this.domNode.style.top = 0;
    }

    LineNumbersTileComponent.prototype.destroy = function() {
      return this.domElementPool.freeElementAndDescendants(this.domNode);
    };

    LineNumbersTileComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    LineNumbersTileComponent.prototype.updateSync = function(state) {
      var id, node, ref;
      this.newState = state;
      if (!this.oldState) {
        this.oldState = {
          tiles: {},
          styles: {}
        };
        this.oldState.tiles[this.id] = {
          lineNumbers: {}
        };
      }
      this.newTileState = this.newState.tiles[this.id];
      this.oldTileState = this.oldState.tiles[this.id];
      if (this.newTileState.display !== this.oldTileState.display) {
        this.domNode.style.display = this.newTileState.display;
        this.oldTileState.display = this.newTileState.display;
      }
      if (this.newState.styles.backgroundColor !== this.oldState.styles.backgroundColor) {
        this.domNode.style.backgroundColor = this.newState.styles.backgroundColor;
        this.oldState.styles.backgroundColor = this.newState.styles.backgroundColor;
      }
      if (this.newTileState.height !== this.oldTileState.height) {
        this.domNode.style.height = this.newTileState.height + 'px';
        this.oldTileState.height = this.newTileState.height;
      }
      if (this.newTileState.top !== this.oldTileState.top) {
        this.domNode.style['-webkit-transform'] = "translate3d(0, " + this.newTileState.top + "px, 0px)";
        this.oldTileState.top = this.newTileState.top;
      }
      if (this.newTileState.zIndex !== this.oldTileState.zIndex) {
        this.domNode.style.zIndex = this.newTileState.zIndex;
        this.oldTileState.zIndex = this.newTileState.zIndex;
      }
      if (this.newState.maxLineNumberDigits !== this.oldState.maxLineNumberDigits) {
        ref = this.lineNumberNodesById;
        for (id in ref) {
          node = ref[id];
          this.domElementPool.freeElementAndDescendants(node);
        }
        this.oldState.tiles[this.id] = {
          lineNumbers: {}
        };
        this.oldTileState = this.oldState.tiles[this.id];
        this.lineNumberNodesById = {};
        this.oldState.maxLineNumberDigits = this.newState.maxLineNumberDigits;
      }
      return this.updateLineNumbers();
    };

    LineNumbersTileComponent.prototype.updateLineNumbers = function() {
      var i, id, j, len, lineNumberNode, lineNumberState, newLineNumberIds, newLineNumberNodes, nextNode, ref, ref1, results;
      newLineNumberIds = null;
      newLineNumberNodes = null;
      ref = this.oldTileState.lineNumbers;
      for (id in ref) {
        lineNumberState = ref[id];
        if (!this.newTileState.lineNumbers.hasOwnProperty(id)) {
          this.domElementPool.freeElementAndDescendants(this.lineNumberNodesById[id]);
          delete this.lineNumberNodesById[id];
          delete this.oldTileState.lineNumbers[id];
        }
      }
      ref1 = this.newTileState.lineNumbers;
      for (id in ref1) {
        lineNumberState = ref1[id];
        if (this.oldTileState.lineNumbers.hasOwnProperty(id)) {
          this.updateLineNumberNode(id, lineNumberState);
        } else {
          if (newLineNumberIds == null) {
            newLineNumberIds = [];
          }
          if (newLineNumberNodes == null) {
            newLineNumberNodes = [];
          }
          newLineNumberIds.push(id);
          newLineNumberNodes.push(this.buildLineNumberNode(lineNumberState));
          this.oldTileState.lineNumbers[id] = _.clone(lineNumberState);
        }
      }
      if (newLineNumberIds == null) {
        return;
      }
      results = [];
      for (i = j = 0, len = newLineNumberIds.length; j < len; i = ++j) {
        id = newLineNumberIds[i];
        lineNumberNode = newLineNumberNodes[i];
        this.lineNumberNodesById[id] = lineNumberNode;
        if (nextNode = this.findNodeNextTo(lineNumberNode)) {
          results.push(this.domNode.insertBefore(lineNumberNode, nextNode));
        } else {
          results.push(this.domNode.appendChild(lineNumberNode));
        }
      }
      return results;
    };

    LineNumbersTileComponent.prototype.findNodeNextTo = function(node) {
      var j, len, nextNode, ref;
      ref = this.domNode.children;
      for (j = 0, len = ref.length; j < len; j++) {
        nextNode = ref[j];
        if (this.screenRowForNode(node) < this.screenRowForNode(nextNode)) {
          return nextNode;
        }
      }
    };

    LineNumbersTileComponent.prototype.screenRowForNode = function(node) {
      return parseInt(node.dataset.screenRow);
    };

    LineNumbersTileComponent.prototype.buildLineNumberNode = function(lineNumberState) {
      var blockDecorationsHeight, bufferRow, className, lineNumberNode, screenRow, softWrapped;
      screenRow = lineNumberState.screenRow, bufferRow = lineNumberState.bufferRow, softWrapped = lineNumberState.softWrapped, blockDecorationsHeight = lineNumberState.blockDecorationsHeight;
      className = this.buildLineNumberClassName(lineNumberState);
      lineNumberNode = this.domElementPool.buildElement("div", className);
      lineNumberNode.dataset.screenRow = screenRow;
      lineNumberNode.dataset.bufferRow = bufferRow;
      lineNumberNode.style.marginTop = blockDecorationsHeight + "px";
      this.setLineNumberInnerNodes(bufferRow, softWrapped, lineNumberNode);
      return lineNumberNode;
    };

    LineNumbersTileComponent.prototype.setLineNumberInnerNodes = function(bufferRow, softWrapped, lineNumberNode) {
      var iconRight, lineNumber, maxLineNumberDigits, padding, textNode;
      this.domElementPool.freeDescendants(lineNumberNode);
      maxLineNumberDigits = this.newState.maxLineNumberDigits;
      if (softWrapped) {
        lineNumber = "•";
      } else {
        lineNumber = (bufferRow + 1).toString();
      }
      padding = _.multiplyString("\u00a0", maxLineNumberDigits - lineNumber.length);
      textNode = this.domElementPool.buildText(padding + lineNumber);
      iconRight = this.domElementPool.buildElement("div", "icon-right");
      lineNumberNode.appendChild(textNode);
      return lineNumberNode.appendChild(iconRight);
    };

    LineNumbersTileComponent.prototype.updateLineNumberNode = function(lineNumberId, newLineNumberState) {
      var node, oldLineNumberState;
      oldLineNumberState = this.oldTileState.lineNumbers[lineNumberId];
      node = this.lineNumberNodesById[lineNumberId];
      if (!(oldLineNumberState.foldable === newLineNumberState.foldable && _.isEqual(oldLineNumberState.decorationClasses, newLineNumberState.decorationClasses))) {
        node.className = this.buildLineNumberClassName(newLineNumberState);
        oldLineNumberState.foldable = newLineNumberState.foldable;
        oldLineNumberState.decorationClasses = _.clone(newLineNumberState.decorationClasses);
      }
      if (!(oldLineNumberState.screenRow === newLineNumberState.screenRow && oldLineNumberState.bufferRow === newLineNumberState.bufferRow)) {
        this.setLineNumberInnerNodes(newLineNumberState.bufferRow, newLineNumberState.softWrapped, node);
        node.dataset.screenRow = newLineNumberState.screenRow;
        node.dataset.bufferRow = newLineNumberState.bufferRow;
        oldLineNumberState.screenRow = newLineNumberState.screenRow;
        oldLineNumberState.bufferRow = newLineNumberState.bufferRow;
      }
      if (oldLineNumberState.blockDecorationsHeight !== newLineNumberState.blockDecorationsHeight) {
        node.style.marginTop = newLineNumberState.blockDecorationsHeight + "px";
        return oldLineNumberState.blockDecorationsHeight = newLineNumberState.blockDecorationsHeight;
      }
    };

    LineNumbersTileComponent.prototype.buildLineNumberClassName = function(arg) {
      var bufferRow, className, decorationClasses, foldable, softWrapped;
      bufferRow = arg.bufferRow, foldable = arg.foldable, decorationClasses = arg.decorationClasses, softWrapped = arg.softWrapped;
      className = "line-number";
      if (decorationClasses != null) {
        className += " " + decorationClasses.join(' ');
      }
      if (foldable && !softWrapped) {
        className += " foldable";
      }
      return className;
    };

    LineNumbersTileComponent.prototype.lineNumberNodeForScreenRow = function(screenRow) {
      var id, lineNumberState, ref;
      ref = this.oldTileState.lineNumbers;
      for (id in ref) {
        lineNumberState = ref[id];
        if (lineNumberState.screenRow === screenRow) {
          return this.lineNumberNodesById[id];
        }
      }
      return null;
    };

    return LineNumbersTileComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9saW5lLW51bWJlcnMtdGlsZS1jb21wb25lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSix3QkFBQyxDQUFBLFdBQUQsR0FBYyxTQUFDLGNBQUQ7YUFDUixJQUFBLHdCQUFBLENBQXlCO1FBQUMsRUFBQSxFQUFJLENBQUMsQ0FBTjtRQUFTLGdCQUFBLGNBQVQ7T0FBekI7SUFEUTs7SUFHRCxrQ0FBQyxHQUFEO01BQUUsSUFBQyxDQUFBLFNBQUEsSUFBSSxJQUFDLENBQUEscUJBQUE7TUFDbkIsSUFBQyxDQUFBLG1CQUFELEdBQXVCO01BQ3ZCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLGNBQWMsQ0FBQyxZQUFoQixDQUE2QixLQUE3QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQWYsR0FBMEI7TUFDMUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZixHQUF5QjtNQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFmLEdBQXFCO0lBTFY7O3VDQU9iLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLGNBQWMsQ0FBQyx5QkFBaEIsQ0FBMEMsSUFBQyxDQUFBLE9BQTNDO0lBRE87O3VDQUdULFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBO0lBRFM7O3VDQUdaLFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUNaLElBQUEsQ0FBTyxJQUFDLENBQUEsUUFBUjtRQUNFLElBQUMsQ0FBQSxRQUFELEdBQVk7VUFBQyxLQUFBLEVBQU8sRUFBUjtVQUFZLE1BQUEsRUFBUSxFQUFwQjs7UUFDWixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQU0sQ0FBQSxJQUFDLENBQUEsRUFBRCxDQUFoQixHQUF1QjtVQUFDLFdBQUEsRUFBYSxFQUFkO1VBRnpCOztNQUlBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBTSxDQUFBLElBQUMsQ0FBQSxFQUFEO01BQ2hDLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBTSxDQUFBLElBQUMsQ0FBQSxFQUFEO01BRWhDLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLEtBQTJCLElBQUMsQ0FBQSxZQUFZLENBQUMsT0FBNUM7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFmLEdBQXlCLElBQUMsQ0FBQSxZQUFZLENBQUM7UUFDdkMsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLEdBQXdCLElBQUMsQ0FBQSxZQUFZLENBQUMsUUFGeEM7O01BSUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxlQUFqQixLQUFzQyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxlQUExRDtRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWYsR0FBaUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDbEQsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFNLENBQUMsZUFBakIsR0FBbUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFNLENBQUMsZ0JBRnREOztNQUlBLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLEtBQTBCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBM0M7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFmLEdBQXdCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBZCxHQUF1QjtRQUMvQyxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWQsR0FBdUIsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUZ2Qzs7TUFJQSxJQUFHLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxLQUF1QixJQUFDLENBQUEsWUFBWSxDQUFDLEdBQXhDO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFNLENBQUEsbUJBQUEsQ0FBZixHQUFzQyxpQkFBQSxHQUFrQixJQUFDLENBQUEsWUFBWSxDQUFDLEdBQWhDLEdBQW9DO1FBQzFFLElBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxHQUFvQixJQUFDLENBQUEsWUFBWSxDQUFDLElBRnBDOztNQUlBLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLEtBQTBCLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBM0M7UUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFmLEdBQXdCLElBQUMsQ0FBQSxZQUFZLENBQUM7UUFDdEMsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLEdBQXVCLElBQUMsQ0FBQSxZQUFZLENBQUMsT0FGdkM7O01BSUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLG1CQUFWLEtBQW1DLElBQUMsQ0FBQSxRQUFRLENBQUMsbUJBQWhEO0FBQ0U7QUFBQSxhQUFBLFNBQUE7O1VBQ0UsSUFBQyxDQUFBLGNBQWMsQ0FBQyx5QkFBaEIsQ0FBMEMsSUFBMUM7QUFERjtRQUdBLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBTSxDQUFBLElBQUMsQ0FBQSxFQUFELENBQWhCLEdBQXVCO1VBQUMsV0FBQSxFQUFhLEVBQWQ7O1FBQ3ZCLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBTSxDQUFBLElBQUMsQ0FBQSxFQUFEO1FBQ2hDLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtRQUN2QixJQUFDLENBQUEsUUFBUSxDQUFDLG1CQUFWLEdBQWdDLElBQUMsQ0FBQSxRQUFRLENBQUMsb0JBUDVDOzthQVNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBdENVOzt1Q0F3Q1osaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsZ0JBQUEsR0FBbUI7TUFDbkIsa0JBQUEsR0FBcUI7QUFFckI7QUFBQSxXQUFBLFNBQUE7O1FBQ0UsSUFBQSxDQUFPLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBVyxDQUFDLGNBQTFCLENBQXlDLEVBQXpDLENBQVA7VUFDRSxJQUFDLENBQUEsY0FBYyxDQUFDLHlCQUFoQixDQUEwQyxJQUFDLENBQUEsbUJBQW9CLENBQUEsRUFBQSxDQUEvRDtVQUNBLE9BQU8sSUFBQyxDQUFBLG1CQUFvQixDQUFBLEVBQUE7VUFDNUIsT0FBTyxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQVksQ0FBQSxFQUFBLEVBSG5DOztBQURGO0FBTUE7QUFBQSxXQUFBLFVBQUE7O1FBQ0UsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQVcsQ0FBQyxjQUExQixDQUF5QyxFQUF6QyxDQUFIO1VBQ0UsSUFBQyxDQUFBLG9CQUFELENBQXNCLEVBQXRCLEVBQTBCLGVBQTFCLEVBREY7U0FBQSxNQUFBOztZQUdFLG1CQUFvQjs7O1lBQ3BCLHFCQUFzQjs7VUFDdEIsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsRUFBdEI7VUFDQSxrQkFBa0IsQ0FBQyxJQUFuQixDQUF3QixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsZUFBckIsQ0FBeEI7VUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQVksQ0FBQSxFQUFBLENBQTFCLEdBQWdDLENBQUMsQ0FBQyxLQUFGLENBQVEsZUFBUixFQVBsQzs7QUFERjtNQVVBLElBQWMsd0JBQWQ7QUFBQSxlQUFBOztBQUVBO1dBQUEsMERBQUE7O1FBQ0UsY0FBQSxHQUFpQixrQkFBbUIsQ0FBQSxDQUFBO1FBQ3BDLElBQUMsQ0FBQSxtQkFBb0IsQ0FBQSxFQUFBLENBQXJCLEdBQTJCO1FBQzNCLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxjQUFELENBQWdCLGNBQWhCLENBQWQ7dUJBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxZQUFULENBQXNCLGNBQXRCLEVBQXNDLFFBQXRDLEdBREY7U0FBQSxNQUFBO3VCQUdFLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixjQUFyQixHQUhGOztBQUhGOztJQXRCaUI7O3VDQThCbkIsY0FBQSxHQUFnQixTQUFDLElBQUQ7QUFDZCxVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUNFLElBQW1CLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQixDQUFBLEdBQTBCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixRQUFsQixDQUE3QztBQUFBLGlCQUFPLFNBQVA7O0FBREY7SUFEYzs7dUNBS2hCLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDthQUFVLFFBQUEsQ0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQXRCO0lBQVY7O3VDQUVsQixtQkFBQSxHQUFxQixTQUFDLGVBQUQ7QUFDbkIsVUFBQTtNQUFDLHFDQUFELEVBQVkscUNBQVosRUFBdUIseUNBQXZCLEVBQW9DO01BRXBDLFNBQUEsR0FBWSxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsZUFBMUI7TUFDWixjQUFBLEdBQWlCLElBQUMsQ0FBQSxjQUFjLENBQUMsWUFBaEIsQ0FBNkIsS0FBN0IsRUFBb0MsU0FBcEM7TUFDakIsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUF2QixHQUFtQztNQUNuQyxjQUFjLENBQUMsT0FBTyxDQUFDLFNBQXZCLEdBQW1DO01BQ25DLGNBQWMsQ0FBQyxLQUFLLENBQUMsU0FBckIsR0FBaUMsc0JBQUEsR0FBeUI7TUFFMUQsSUFBQyxDQUFBLHVCQUFELENBQXlCLFNBQXpCLEVBQW9DLFdBQXBDLEVBQWlELGNBQWpEO2FBQ0E7SUFWbUI7O3VDQVlyQix1QkFBQSxHQUF5QixTQUFDLFNBQUQsRUFBWSxXQUFaLEVBQXlCLGNBQXpCO0FBQ3ZCLFVBQUE7TUFBQSxJQUFDLENBQUEsY0FBYyxDQUFDLGVBQWhCLENBQWdDLGNBQWhDO01BRUMsc0JBQXVCLElBQUMsQ0FBQTtNQUV6QixJQUFHLFdBQUg7UUFDRSxVQUFBLEdBQWEsSUFEZjtPQUFBLE1BQUE7UUFHRSxVQUFBLEdBQWEsQ0FBQyxTQUFBLEdBQVksQ0FBYixDQUFlLENBQUMsUUFBaEIsQ0FBQSxFQUhmOztNQUlBLE9BQUEsR0FBVSxDQUFDLENBQUMsY0FBRixDQUFpQixRQUFqQixFQUEyQixtQkFBQSxHQUFzQixVQUFVLENBQUMsTUFBNUQ7TUFFVixRQUFBLEdBQVcsSUFBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUEwQixPQUFBLEdBQVUsVUFBcEM7TUFDWCxTQUFBLEdBQVksSUFBQyxDQUFBLGNBQWMsQ0FBQyxZQUFoQixDQUE2QixLQUE3QixFQUFvQyxZQUFwQztNQUVaLGNBQWMsQ0FBQyxXQUFmLENBQTJCLFFBQTNCO2FBQ0EsY0FBYyxDQUFDLFdBQWYsQ0FBMkIsU0FBM0I7SUFmdUI7O3VDQWlCekIsb0JBQUEsR0FBc0IsU0FBQyxZQUFELEVBQWUsa0JBQWY7QUFDcEIsVUFBQTtNQUFBLGtCQUFBLEdBQXFCLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBWSxDQUFBLFlBQUE7TUFDL0MsSUFBQSxHQUFPLElBQUMsQ0FBQSxtQkFBb0IsQ0FBQSxZQUFBO01BRTVCLElBQUEsQ0FBQSxDQUFPLGtCQUFrQixDQUFDLFFBQW5CLEtBQStCLGtCQUFrQixDQUFDLFFBQWxELElBQStELENBQUMsQ0FBQyxPQUFGLENBQVUsa0JBQWtCLENBQUMsaUJBQTdCLEVBQWdELGtCQUFrQixDQUFDLGlCQUFuRSxDQUF0RSxDQUFBO1FBQ0UsSUFBSSxDQUFDLFNBQUwsR0FBaUIsSUFBQyxDQUFBLHdCQUFELENBQTBCLGtCQUExQjtRQUNqQixrQkFBa0IsQ0FBQyxRQUFuQixHQUE4QixrQkFBa0IsQ0FBQztRQUNqRCxrQkFBa0IsQ0FBQyxpQkFBbkIsR0FBdUMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxrQkFBa0IsQ0FBQyxpQkFBM0IsRUFIekM7O01BS0EsSUFBQSxDQUFBLENBQU8sa0JBQWtCLENBQUMsU0FBbkIsS0FBZ0Msa0JBQWtCLENBQUMsU0FBbkQsSUFBaUUsa0JBQWtCLENBQUMsU0FBbkIsS0FBZ0Msa0JBQWtCLENBQUMsU0FBM0gsQ0FBQTtRQUNFLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixrQkFBa0IsQ0FBQyxTQUE1QyxFQUF1RCxrQkFBa0IsQ0FBQyxXQUExRSxFQUF1RixJQUF2RjtRQUNBLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBYixHQUF5QixrQkFBa0IsQ0FBQztRQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQWIsR0FBeUIsa0JBQWtCLENBQUM7UUFDNUMsa0JBQWtCLENBQUMsU0FBbkIsR0FBK0Isa0JBQWtCLENBQUM7UUFDbEQsa0JBQWtCLENBQUMsU0FBbkIsR0FBK0Isa0JBQWtCLENBQUMsVUFMcEQ7O01BT0EsSUFBTyxrQkFBa0IsQ0FBQyxzQkFBbkIsS0FBNkMsa0JBQWtCLENBQUMsc0JBQXZFO1FBQ0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFYLEdBQXVCLGtCQUFrQixDQUFDLHNCQUFuQixHQUE0QztlQUNuRSxrQkFBa0IsQ0FBQyxzQkFBbkIsR0FBNEMsa0JBQWtCLENBQUMsdUJBRmpFOztJQWhCb0I7O3VDQW9CdEIsd0JBQUEsR0FBMEIsU0FBQyxHQUFEO0FBQ3hCLFVBQUE7TUFEMEIsMkJBQVcseUJBQVUsMkNBQW1CO01BQ2xFLFNBQUEsR0FBWTtNQUNaLElBQWtELHlCQUFsRDtRQUFBLFNBQUEsSUFBYSxHQUFBLEdBQU0saUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsR0FBdkIsRUFBbkI7O01BQ0EsSUFBNEIsUUFBQSxJQUFhLENBQUksV0FBN0M7UUFBQSxTQUFBLElBQWEsWUFBYjs7YUFDQTtJQUp3Qjs7dUNBTTFCLDBCQUFBLEdBQTRCLFNBQUMsU0FBRDtBQUMxQixVQUFBO0FBQUE7QUFBQSxXQUFBLFNBQUE7O1FBQ0UsSUFBRyxlQUFlLENBQUMsU0FBaEIsS0FBNkIsU0FBaEM7QUFDRSxpQkFBTyxJQUFDLENBQUEsbUJBQW9CLENBQUEsRUFBQSxFQUQ5Qjs7QUFERjthQUdBO0lBSjBCOzs7OztBQXhKOUIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBMaW5lTnVtYmVyc1RpbGVDb21wb25lbnRcbiAgQGNyZWF0ZUR1bW15OiAoZG9tRWxlbWVudFBvb2wpIC0+XG4gICAgbmV3IExpbmVOdW1iZXJzVGlsZUNvbXBvbmVudCh7aWQ6IC0xLCBkb21FbGVtZW50UG9vbH0pXG5cbiAgY29uc3RydWN0b3I6ICh7QGlkLCBAZG9tRWxlbWVudFBvb2x9KSAtPlxuICAgIEBsaW5lTnVtYmVyTm9kZXNCeUlkID0ge31cbiAgICBAZG9tTm9kZSA9IEBkb21FbGVtZW50UG9vbC5idWlsZEVsZW1lbnQoXCJkaXZcIilcbiAgICBAZG9tTm9kZS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIlxuICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgICBAZG9tTm9kZS5zdHlsZS50b3AgPSAwICMgQ292ZXIgdGhlIHNwYWNlIG9jY3VwaWVkIGJ5IGEgZHVtbXkgbGluZU51bWJlclxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRvbUVsZW1lbnRQb29sLmZyZWVFbGVtZW50QW5kRGVzY2VuZGFudHMoQGRvbU5vZGUpXG5cbiAgZ2V0RG9tTm9kZTogLT5cbiAgICBAZG9tTm9kZVxuXG4gIHVwZGF0ZVN5bmM6IChzdGF0ZSkgLT5cbiAgICBAbmV3U3RhdGUgPSBzdGF0ZVxuICAgIHVubGVzcyBAb2xkU3RhdGVcbiAgICAgIEBvbGRTdGF0ZSA9IHt0aWxlczoge30sIHN0eWxlczoge319XG4gICAgICBAb2xkU3RhdGUudGlsZXNbQGlkXSA9IHtsaW5lTnVtYmVyczoge319XG5cbiAgICBAbmV3VGlsZVN0YXRlID0gQG5ld1N0YXRlLnRpbGVzW0BpZF1cbiAgICBAb2xkVGlsZVN0YXRlID0gQG9sZFN0YXRlLnRpbGVzW0BpZF1cblxuICAgIGlmIEBuZXdUaWxlU3RhdGUuZGlzcGxheSBpc250IEBvbGRUaWxlU3RhdGUuZGlzcGxheVxuICAgICAgQGRvbU5vZGUuc3R5bGUuZGlzcGxheSA9IEBuZXdUaWxlU3RhdGUuZGlzcGxheVxuICAgICAgQG9sZFRpbGVTdGF0ZS5kaXNwbGF5ID0gQG5ld1RpbGVTdGF0ZS5kaXNwbGF5XG5cbiAgICBpZiBAbmV3U3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvciBpc250IEBvbGRTdGF0ZS5zdHlsZXMuYmFja2dyb3VuZENvbG9yXG4gICAgICBAZG9tTm9kZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBAbmV3U3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvclxuICAgICAgQG9sZFN0YXRlLnN0eWxlcy5iYWNrZ3JvdW5kQ29sb3IgPSBAbmV3U3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvclxuXG4gICAgaWYgQG5ld1RpbGVTdGF0ZS5oZWlnaHQgaXNudCBAb2xkVGlsZVN0YXRlLmhlaWdodFxuICAgICAgQGRvbU5vZGUuc3R5bGUuaGVpZ2h0ID0gQG5ld1RpbGVTdGF0ZS5oZWlnaHQgKyAncHgnXG4gICAgICBAb2xkVGlsZVN0YXRlLmhlaWdodCA9IEBuZXdUaWxlU3RhdGUuaGVpZ2h0XG5cbiAgICBpZiBAbmV3VGlsZVN0YXRlLnRvcCBpc250IEBvbGRUaWxlU3RhdGUudG9wXG4gICAgICBAZG9tTm9kZS5zdHlsZVsnLXdlYmtpdC10cmFuc2Zvcm0nXSA9IFwidHJhbnNsYXRlM2QoMCwgI3tAbmV3VGlsZVN0YXRlLnRvcH1weCwgMHB4KVwiXG4gICAgICBAb2xkVGlsZVN0YXRlLnRvcCA9IEBuZXdUaWxlU3RhdGUudG9wXG5cbiAgICBpZiBAbmV3VGlsZVN0YXRlLnpJbmRleCBpc250IEBvbGRUaWxlU3RhdGUuekluZGV4XG4gICAgICBAZG9tTm9kZS5zdHlsZS56SW5kZXggPSBAbmV3VGlsZVN0YXRlLnpJbmRleFxuICAgICAgQG9sZFRpbGVTdGF0ZS56SW5kZXggPSBAbmV3VGlsZVN0YXRlLnpJbmRleFxuXG4gICAgaWYgQG5ld1N0YXRlLm1heExpbmVOdW1iZXJEaWdpdHMgaXNudCBAb2xkU3RhdGUubWF4TGluZU51bWJlckRpZ2l0c1xuICAgICAgZm9yIGlkLCBub2RlIG9mIEBsaW5lTnVtYmVyTm9kZXNCeUlkXG4gICAgICAgIEBkb21FbGVtZW50UG9vbC5mcmVlRWxlbWVudEFuZERlc2NlbmRhbnRzKG5vZGUpXG5cbiAgICAgIEBvbGRTdGF0ZS50aWxlc1tAaWRdID0ge2xpbmVOdW1iZXJzOiB7fX1cbiAgICAgIEBvbGRUaWxlU3RhdGUgPSBAb2xkU3RhdGUudGlsZXNbQGlkXVxuICAgICAgQGxpbmVOdW1iZXJOb2Rlc0J5SWQgPSB7fVxuICAgICAgQG9sZFN0YXRlLm1heExpbmVOdW1iZXJEaWdpdHMgPSBAbmV3U3RhdGUubWF4TGluZU51bWJlckRpZ2l0c1xuXG4gICAgQHVwZGF0ZUxpbmVOdW1iZXJzKClcblxuICB1cGRhdGVMaW5lTnVtYmVyczogLT5cbiAgICBuZXdMaW5lTnVtYmVySWRzID0gbnVsbFxuICAgIG5ld0xpbmVOdW1iZXJOb2RlcyA9IG51bGxcblxuICAgIGZvciBpZCwgbGluZU51bWJlclN0YXRlIG9mIEBvbGRUaWxlU3RhdGUubGluZU51bWJlcnNcbiAgICAgIHVubGVzcyBAbmV3VGlsZVN0YXRlLmxpbmVOdW1iZXJzLmhhc093blByb3BlcnR5KGlkKVxuICAgICAgICBAZG9tRWxlbWVudFBvb2wuZnJlZUVsZW1lbnRBbmREZXNjZW5kYW50cyhAbGluZU51bWJlck5vZGVzQnlJZFtpZF0pXG4gICAgICAgIGRlbGV0ZSBAbGluZU51bWJlck5vZGVzQnlJZFtpZF1cbiAgICAgICAgZGVsZXRlIEBvbGRUaWxlU3RhdGUubGluZU51bWJlcnNbaWRdXG5cbiAgICBmb3IgaWQsIGxpbmVOdW1iZXJTdGF0ZSBvZiBAbmV3VGlsZVN0YXRlLmxpbmVOdW1iZXJzXG4gICAgICBpZiBAb2xkVGlsZVN0YXRlLmxpbmVOdW1iZXJzLmhhc093blByb3BlcnR5KGlkKVxuICAgICAgICBAdXBkYXRlTGluZU51bWJlck5vZGUoaWQsIGxpbmVOdW1iZXJTdGF0ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgbmV3TGluZU51bWJlcklkcyA/PSBbXVxuICAgICAgICBuZXdMaW5lTnVtYmVyTm9kZXMgPz0gW11cbiAgICAgICAgbmV3TGluZU51bWJlcklkcy5wdXNoKGlkKVxuICAgICAgICBuZXdMaW5lTnVtYmVyTm9kZXMucHVzaChAYnVpbGRMaW5lTnVtYmVyTm9kZShsaW5lTnVtYmVyU3RhdGUpKVxuICAgICAgICBAb2xkVGlsZVN0YXRlLmxpbmVOdW1iZXJzW2lkXSA9IF8uY2xvbmUobGluZU51bWJlclN0YXRlKVxuXG4gICAgcmV0dXJuIHVubGVzcyBuZXdMaW5lTnVtYmVySWRzP1xuXG4gICAgZm9yIGlkLCBpIGluIG5ld0xpbmVOdW1iZXJJZHNcbiAgICAgIGxpbmVOdW1iZXJOb2RlID0gbmV3TGluZU51bWJlck5vZGVzW2ldXG4gICAgICBAbGluZU51bWJlck5vZGVzQnlJZFtpZF0gPSBsaW5lTnVtYmVyTm9kZVxuICAgICAgaWYgbmV4dE5vZGUgPSBAZmluZE5vZGVOZXh0VG8obGluZU51bWJlck5vZGUpXG4gICAgICAgIEBkb21Ob2RlLmluc2VydEJlZm9yZShsaW5lTnVtYmVyTm9kZSwgbmV4dE5vZGUpXG4gICAgICBlbHNlXG4gICAgICAgIEBkb21Ob2RlLmFwcGVuZENoaWxkKGxpbmVOdW1iZXJOb2RlKVxuXG4gIGZpbmROb2RlTmV4dFRvOiAobm9kZSkgLT5cbiAgICBmb3IgbmV4dE5vZGUgaW4gQGRvbU5vZGUuY2hpbGRyZW5cbiAgICAgIHJldHVybiBuZXh0Tm9kZSBpZiBAc2NyZWVuUm93Rm9yTm9kZShub2RlKSA8IEBzY3JlZW5Sb3dGb3JOb2RlKG5leHROb2RlKVxuICAgIHJldHVyblxuXG4gIHNjcmVlblJvd0Zvck5vZGU6IChub2RlKSAtPiBwYXJzZUludChub2RlLmRhdGFzZXQuc2NyZWVuUm93KVxuXG4gIGJ1aWxkTGluZU51bWJlck5vZGU6IChsaW5lTnVtYmVyU3RhdGUpIC0+XG4gICAge3NjcmVlblJvdywgYnVmZmVyUm93LCBzb2Z0V3JhcHBlZCwgYmxvY2tEZWNvcmF0aW9uc0hlaWdodH0gPSBsaW5lTnVtYmVyU3RhdGVcblxuICAgIGNsYXNzTmFtZSA9IEBidWlsZExpbmVOdW1iZXJDbGFzc05hbWUobGluZU51bWJlclN0YXRlKVxuICAgIGxpbmVOdW1iZXJOb2RlID0gQGRvbUVsZW1lbnRQb29sLmJ1aWxkRWxlbWVudChcImRpdlwiLCBjbGFzc05hbWUpXG4gICAgbGluZU51bWJlck5vZGUuZGF0YXNldC5zY3JlZW5Sb3cgPSBzY3JlZW5Sb3dcbiAgICBsaW5lTnVtYmVyTm9kZS5kYXRhc2V0LmJ1ZmZlclJvdyA9IGJ1ZmZlclJvd1xuICAgIGxpbmVOdW1iZXJOb2RlLnN0eWxlLm1hcmdpblRvcCA9IGJsb2NrRGVjb3JhdGlvbnNIZWlnaHQgKyBcInB4XCJcblxuICAgIEBzZXRMaW5lTnVtYmVySW5uZXJOb2RlcyhidWZmZXJSb3csIHNvZnRXcmFwcGVkLCBsaW5lTnVtYmVyTm9kZSlcbiAgICBsaW5lTnVtYmVyTm9kZVxuXG4gIHNldExpbmVOdW1iZXJJbm5lck5vZGVzOiAoYnVmZmVyUm93LCBzb2Z0V3JhcHBlZCwgbGluZU51bWJlck5vZGUpIC0+XG4gICAgQGRvbUVsZW1lbnRQb29sLmZyZWVEZXNjZW5kYW50cyhsaW5lTnVtYmVyTm9kZSlcblxuICAgIHttYXhMaW5lTnVtYmVyRGlnaXRzfSA9IEBuZXdTdGF0ZVxuXG4gICAgaWYgc29mdFdyYXBwZWRcbiAgICAgIGxpbmVOdW1iZXIgPSBcIuKAolwiXG4gICAgZWxzZVxuICAgICAgbGluZU51bWJlciA9IChidWZmZXJSb3cgKyAxKS50b1N0cmluZygpXG4gICAgcGFkZGluZyA9IF8ubXVsdGlwbHlTdHJpbmcoXCJcXHUwMGEwXCIsIG1heExpbmVOdW1iZXJEaWdpdHMgLSBsaW5lTnVtYmVyLmxlbmd0aClcblxuICAgIHRleHROb2RlID0gQGRvbUVsZW1lbnRQb29sLmJ1aWxkVGV4dChwYWRkaW5nICsgbGluZU51bWJlcilcbiAgICBpY29uUmlnaHQgPSBAZG9tRWxlbWVudFBvb2wuYnVpbGRFbGVtZW50KFwiZGl2XCIsIFwiaWNvbi1yaWdodFwiKVxuXG4gICAgbGluZU51bWJlck5vZGUuYXBwZW5kQ2hpbGQodGV4dE5vZGUpXG4gICAgbGluZU51bWJlck5vZGUuYXBwZW5kQ2hpbGQoaWNvblJpZ2h0KVxuXG4gIHVwZGF0ZUxpbmVOdW1iZXJOb2RlOiAobGluZU51bWJlcklkLCBuZXdMaW5lTnVtYmVyU3RhdGUpIC0+XG4gICAgb2xkTGluZU51bWJlclN0YXRlID0gQG9sZFRpbGVTdGF0ZS5saW5lTnVtYmVyc1tsaW5lTnVtYmVySWRdXG4gICAgbm9kZSA9IEBsaW5lTnVtYmVyTm9kZXNCeUlkW2xpbmVOdW1iZXJJZF1cblxuICAgIHVubGVzcyBvbGRMaW5lTnVtYmVyU3RhdGUuZm9sZGFibGUgaXMgbmV3TGluZU51bWJlclN0YXRlLmZvbGRhYmxlIGFuZCBfLmlzRXF1YWwob2xkTGluZU51bWJlclN0YXRlLmRlY29yYXRpb25DbGFzc2VzLCBuZXdMaW5lTnVtYmVyU3RhdGUuZGVjb3JhdGlvbkNsYXNzZXMpXG4gICAgICBub2RlLmNsYXNzTmFtZSA9IEBidWlsZExpbmVOdW1iZXJDbGFzc05hbWUobmV3TGluZU51bWJlclN0YXRlKVxuICAgICAgb2xkTGluZU51bWJlclN0YXRlLmZvbGRhYmxlID0gbmV3TGluZU51bWJlclN0YXRlLmZvbGRhYmxlXG4gICAgICBvbGRMaW5lTnVtYmVyU3RhdGUuZGVjb3JhdGlvbkNsYXNzZXMgPSBfLmNsb25lKG5ld0xpbmVOdW1iZXJTdGF0ZS5kZWNvcmF0aW9uQ2xhc3NlcylcblxuICAgIHVubGVzcyBvbGRMaW5lTnVtYmVyU3RhdGUuc2NyZWVuUm93IGlzIG5ld0xpbmVOdW1iZXJTdGF0ZS5zY3JlZW5Sb3cgYW5kIG9sZExpbmVOdW1iZXJTdGF0ZS5idWZmZXJSb3cgaXMgbmV3TGluZU51bWJlclN0YXRlLmJ1ZmZlclJvd1xuICAgICAgQHNldExpbmVOdW1iZXJJbm5lck5vZGVzKG5ld0xpbmVOdW1iZXJTdGF0ZS5idWZmZXJSb3csIG5ld0xpbmVOdW1iZXJTdGF0ZS5zb2Z0V3JhcHBlZCwgbm9kZSlcbiAgICAgIG5vZGUuZGF0YXNldC5zY3JlZW5Sb3cgPSBuZXdMaW5lTnVtYmVyU3RhdGUuc2NyZWVuUm93XG4gICAgICBub2RlLmRhdGFzZXQuYnVmZmVyUm93ID0gbmV3TGluZU51bWJlclN0YXRlLmJ1ZmZlclJvd1xuICAgICAgb2xkTGluZU51bWJlclN0YXRlLnNjcmVlblJvdyA9IG5ld0xpbmVOdW1iZXJTdGF0ZS5zY3JlZW5Sb3dcbiAgICAgIG9sZExpbmVOdW1iZXJTdGF0ZS5idWZmZXJSb3cgPSBuZXdMaW5lTnVtYmVyU3RhdGUuYnVmZmVyUm93XG5cbiAgICB1bmxlc3Mgb2xkTGluZU51bWJlclN0YXRlLmJsb2NrRGVjb3JhdGlvbnNIZWlnaHQgaXMgbmV3TGluZU51bWJlclN0YXRlLmJsb2NrRGVjb3JhdGlvbnNIZWlnaHRcbiAgICAgIG5vZGUuc3R5bGUubWFyZ2luVG9wID0gbmV3TGluZU51bWJlclN0YXRlLmJsb2NrRGVjb3JhdGlvbnNIZWlnaHQgKyBcInB4XCJcbiAgICAgIG9sZExpbmVOdW1iZXJTdGF0ZS5ibG9ja0RlY29yYXRpb25zSGVpZ2h0ID0gbmV3TGluZU51bWJlclN0YXRlLmJsb2NrRGVjb3JhdGlvbnNIZWlnaHRcblxuICBidWlsZExpbmVOdW1iZXJDbGFzc05hbWU6ICh7YnVmZmVyUm93LCBmb2xkYWJsZSwgZGVjb3JhdGlvbkNsYXNzZXMsIHNvZnRXcmFwcGVkfSkgLT5cbiAgICBjbGFzc05hbWUgPSBcImxpbmUtbnVtYmVyXCJcbiAgICBjbGFzc05hbWUgKz0gXCIgXCIgKyBkZWNvcmF0aW9uQ2xhc3Nlcy5qb2luKCcgJykgaWYgZGVjb3JhdGlvbkNsYXNzZXM/XG4gICAgY2xhc3NOYW1lICs9IFwiIGZvbGRhYmxlXCIgaWYgZm9sZGFibGUgYW5kIG5vdCBzb2Z0V3JhcHBlZFxuICAgIGNsYXNzTmFtZVxuXG4gIGxpbmVOdW1iZXJOb2RlRm9yU2NyZWVuUm93OiAoc2NyZWVuUm93KSAtPlxuICAgIGZvciBpZCwgbGluZU51bWJlclN0YXRlIG9mIEBvbGRUaWxlU3RhdGUubGluZU51bWJlcnNcbiAgICAgIGlmIGxpbmVOdW1iZXJTdGF0ZS5zY3JlZW5Sb3cgaXMgc2NyZWVuUm93XG4gICAgICAgIHJldHVybiBAbGluZU51bWJlck5vZGVzQnlJZFtpZF1cbiAgICBudWxsXG4iXX0=
