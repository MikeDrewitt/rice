(function() {
  var LineNumberGutterComponent, LineNumbersTileComponent, TiledComponent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TiledComponent = require('./tiled-component');

  LineNumbersTileComponent = require('./line-numbers-tile-component');

  module.exports = LineNumberGutterComponent = (function(superClass) {
    extend(LineNumberGutterComponent, superClass);

    LineNumberGutterComponent.prototype.dummyLineNumberNode = null;

    function LineNumberGutterComponent(arg) {
      this.onMouseDown = arg.onMouseDown, this.editor = arg.editor, this.gutter = arg.gutter, this.domElementPool = arg.domElementPool, this.views = arg.views;
      this.onClick = bind(this.onClick, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.visible = true;
      this.dummyLineNumberComponent = LineNumbersTileComponent.createDummy(this.domElementPool);
      this.domNode = this.views.getView(this.gutter);
      this.lineNumbersNode = this.domNode.firstChild;
      this.lineNumbersNode.innerHTML = '';
      this.domNode.addEventListener('click', this.onClick);
      this.domNode.addEventListener('mousedown', this.onMouseDown);
    }

    LineNumberGutterComponent.prototype.destroy = function() {
      this.domNode.removeEventListener('click', this.onClick);
      return this.domNode.removeEventListener('mousedown', this.onMouseDown);
    };

    LineNumberGutterComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    LineNumberGutterComponent.prototype.hideNode = function() {
      if (this.visible) {
        this.domNode.style.display = 'none';
        return this.visible = false;
      }
    };

    LineNumberGutterComponent.prototype.showNode = function() {
      if (!this.visible) {
        this.domNode.style.removeProperty('display');
        return this.visible = true;
      }
    };

    LineNumberGutterComponent.prototype.buildEmptyState = function() {
      return {
        tiles: {},
        styles: {}
      };
    };

    LineNumberGutterComponent.prototype.getNewState = function(state) {
      return state;
    };

    LineNumberGutterComponent.prototype.getTilesNode = function() {
      return this.lineNumbersNode;
    };

    LineNumberGutterComponent.prototype.beforeUpdateSync = function(state) {
      if (this.dummyLineNumberNode == null) {
        this.appendDummyLineNumber();
      }
      if (this.newState.styles.maxHeight !== this.oldState.styles.maxHeight) {
        this.lineNumbersNode.style.height = this.newState.styles.maxHeight + 'px';
        this.oldState.maxHeight = this.newState.maxHeight;
      }
      if (this.newState.styles.backgroundColor !== this.oldState.styles.backgroundColor) {
        this.lineNumbersNode.style.backgroundColor = this.newState.styles.backgroundColor;
        this.oldState.styles.backgroundColor = this.newState.styles.backgroundColor;
      }
      if (this.newState.maxLineNumberDigits !== this.oldState.maxLineNumberDigits) {
        this.updateDummyLineNumber();
        this.oldState.styles = {};
        return this.oldState.maxLineNumberDigits = this.newState.maxLineNumberDigits;
      }
    };

    LineNumberGutterComponent.prototype.buildComponentForTile = function(id) {
      return new LineNumbersTileComponent({
        id: id,
        domElementPool: this.domElementPool
      });
    };

    LineNumberGutterComponent.prototype.shouldRecreateAllTilesOnUpdate = function() {
      return this.newState.continuousReflow;
    };


    /*
    Section: Private Methods
     */

    LineNumberGutterComponent.prototype.appendDummyLineNumber = function() {
      this.dummyLineNumberComponent.newState = this.newState;
      this.dummyLineNumberNode = this.dummyLineNumberComponent.buildLineNumberNode({
        bufferRow: -1
      });
      return this.lineNumbersNode.appendChild(this.dummyLineNumberNode);
    };

    LineNumberGutterComponent.prototype.updateDummyLineNumber = function() {
      this.dummyLineNumberComponent.newState = this.newState;
      return this.dummyLineNumberComponent.setLineNumberInnerNodes(0, false, this.dummyLineNumberNode);
    };

    LineNumberGutterComponent.prototype.onMouseDown = function(event) {
      var lineNumber, target;
      target = event.target;
      lineNumber = target.parentNode;
      if (!(target.classList.contains('icon-right') && lineNumber.classList.contains('foldable'))) {
        return this.onMouseDown(event);
      }
    };

    LineNumberGutterComponent.prototype.onClick = function(event) {
      var bufferRow, lineNumber, target;
      target = event.target;
      lineNumber = target.parentNode;
      if (target.classList.contains('icon-right')) {
        bufferRow = parseInt(lineNumber.getAttribute('data-buffer-row'));
        if (lineNumber.classList.contains('folded')) {
          return this.editor.unfoldBufferRow(bufferRow);
        } else if (lineNumber.classList.contains('foldable')) {
          return this.editor.foldBufferRow(bufferRow);
        }
      }
    };

    return LineNumberGutterComponent;

  })(TiledComponent);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9saW5lLW51bWJlci1ndXR0ZXItY29tcG9uZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsbUVBQUE7SUFBQTs7OztFQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUNqQix3QkFBQSxHQUEyQixPQUFBLENBQVEsK0JBQVI7O0VBRTNCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozt3Q0FDSixtQkFBQSxHQUFxQjs7SUFFUixtQ0FBQyxHQUFEO01BQUUsSUFBQyxDQUFBLGtCQUFBLGFBQWEsSUFBQyxDQUFBLGFBQUEsUUFBUSxJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSxxQkFBQSxnQkFBZ0IsSUFBQyxDQUFBLFlBQUE7OztNQUMvRCxJQUFDLENBQUEsT0FBRCxHQUFXO01BRVgsSUFBQyxDQUFBLHdCQUFELEdBQTRCLHdCQUF3QixDQUFDLFdBQXpCLENBQXFDLElBQUMsQ0FBQSxjQUF0QztNQUU1QixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQUMsQ0FBQSxNQUFoQjtNQUNYLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxPQUFPLENBQUM7TUFDNUIsSUFBQyxDQUFBLGVBQWUsQ0FBQyxTQUFqQixHQUE2QjtNQUU3QixJQUFDLENBQUEsT0FBTyxDQUFDLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DLElBQUMsQ0FBQSxPQUFwQztNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsZ0JBQVQsQ0FBMEIsV0FBMUIsRUFBdUMsSUFBQyxDQUFBLFdBQXhDO0lBVlc7O3dDQVliLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxtQkFBVCxDQUE2QixPQUE3QixFQUFzQyxJ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QTthQUN0QyxJQUFDLENBQUEsd0JBQXdCLENBQUMsdUJBQTFCLENBQWtELENBQWxELEVBQXFELEtBQXJELEVBQTRELElBQUMsQ0FBQSxtQkFBN0Q7SUFGcUI7O3dDQUl2QixXQUFBLEdBQWEsU0FBQyxLQUFEO0FBQ1gsVUFBQTtNQUFDLFNBQVU7TUFDWCxVQUFBLEdBQWEsTUFBTSxDQUFDO01BRXBCLElBQUEsQ0FBQSxDQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBakIsQ0FBMEIsWUFBMUIsQ0FBQSxJQUE0QyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQXJCLENBQThCLFVBQTlCLENBQW5ELENBQUE7ZUFDRSxJQUFDLENBQUEsV0FBRCxDQUFhLEtBQWIsRUFERjs7SUFKVzs7d0NBT2IsT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUNQLFVBQUE7TUFBQyxTQUFVO01BQ1gsVUFBQSxHQUFhLE1BQU0sQ0FBQztNQUVwQixJQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBakIsQ0FBMEIsWUFBMUIsQ0FBSDtRQUNFLFNBQUEsR0FBWSxRQUFBLENBQVMsVUFBVSxDQUFDLFlBQVgsQ0FBd0IsaUJBQXhCLENBQVQ7UUFDWixJQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBckIsQ0FBOEIsUUFBOUIsQ0FBSDtpQkFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsU0FBeEIsRUFERjtTQUFBLE1BRUssSUFBRyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQXJCLENBQThCLFVBQTlCLENBQUg7aUJBQ0gsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLFNBQXRCLEVBREc7U0FKUDs7SUFKTzs7OztLQXJGNkI7QUFKeEMiLCJzb3VyY2VzQ29udGVudCI6WyJUaWxlZENvbXBvbmVudCA9IHJlcXVpcmUgJy4vdGlsZWQtY29tcG9uZW50J1xuTGluZU51bWJlcnNUaWxlQ29tcG9uZW50ID0gcmVxdWlyZSAnLi9saW5lLW51bWJlcnMtdGlsZS1jb21wb25lbnQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIExpbmVOdW1iZXJHdXR0ZXJDb21wb25lbnQgZXh0ZW5kcyBUaWxlZENvbXBvbmVudFxuICBkdW1teUxpbmVOdW1iZXJOb2RlOiBudWxsXG5cbiAgY29uc3RydWN0b3I6ICh7QG9uTW91c2VEb3duLCBAZWRpdG9yLCBAZ3V0dGVyLCBAZG9tRWxlbWVudFBvb2wsIEB2aWV3c30pIC0+XG4gICAgQHZpc2libGUgPSB0cnVlXG5cbiAgICBAZHVtbXlMaW5lTnVtYmVyQ29tcG9uZW50ID0gTGluZU51bWJlcnNUaWxlQ29tcG9uZW50LmNyZWF0ZUR1bW15KEBkb21FbGVtZW50UG9vbClcblxuICAgIEBkb21Ob2RlID0gQHZpZXdzLmdldFZpZXcoQGd1dHRlcilcbiAgICBAbGluZU51bWJlcnNOb2RlID0gQGRvbU5vZGUuZmlyc3RDaGlsZFxuICAgIEBsaW5lTnVtYmVyc05vZGUuaW5uZXJIVE1MID0gJydcblxuICAgIEBkb21Ob2RlLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgQG9uQ2xpY2tcbiAgICBAZG9tTm9kZS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBAb25Nb3VzZURvd25cblxuICBkZXN0cm95OiAtPlxuICAgIEBkb21Ob2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgQG9uQ2xpY2tcbiAgICBAZG9tTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCBAb25Nb3VzZURvd25cblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgaGlkZU5vZGU6IC0+XG4gICAgaWYgQHZpc2libGVcbiAgICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICBzaG93Tm9kZTogLT5cbiAgICBpZiBub3QgQHZpc2libGVcbiAgICAgIEBkb21Ob2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdkaXNwbGF5JylcbiAgICAgIEB2aXNpYmxlID0gdHJ1ZVxuXG4gIGJ1aWxkRW1wdHlTdGF0ZTogLT5cbiAgICB7XG4gICAgICB0aWxlczoge31cbiAgICAgIHN0eWxlczoge31cbiAgICB9XG5cbiAgZ2V0TmV3U3RhdGU6IChzdGF0ZSkgLT4gc3RhdGVcblxuICBnZXRUaWxlc05vZGU6IC0+IEBsaW5lTnVtYmVyc05vZGVcblxuICBiZWZvcmVVcGRhdGVTeW5jOiAoc3RhdGUpIC0+XG4gICAgQGFwcGVuZER1bW15TGluZU51bWJlcigpIHVubGVzcyBAZHVtbXlMaW5lTnVtYmVyTm9kZT9cblxuICAgIGlmIEBuZXdTdGF0ZS5zdHlsZXMubWF4SGVpZ2h0IGlzbnQgQG9sZFN0YXRlLnN0eWxlcy5tYXhIZWlnaHRcbiAgICAgIEBsaW5lTnVtYmVyc05vZGUuc3R5bGUuaGVpZ2h0ID0gQG5ld1N0YXRlLnN0eWxlcy5tYXhIZWlnaHQgKyAncHgnXG4gICAgICBAb2xkU3RhdGUubWF4SGVpZ2h0ID0gQG5ld1N0YXRlLm1heEhlaWdodFxuXG4gICAgaWYgQG5ld1N0YXRlLnN0eWxlcy5iYWNrZ3JvdW5kQ29sb3IgaXNudCBAb2xkU3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvclxuICAgICAgQGxpbmVOdW1iZXJzTm9kZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBAbmV3U3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvclxuICAgICAgQG9sZFN0YXRlLnN0eWxlcy5iYWNrZ3JvdW5kQ29sb3IgPSBAbmV3U3RhdGUuc3R5bGVzLmJhY2tncm91bmRDb2xvclxuXG4gICAgaWYgQG5ld1N0YXRlLm1heExpbmVOdW1iZXJEaWdpdHMgaXNudCBAb2xkU3RhdGUubWF4TGluZU51bWJlckRpZ2l0c1xuICAgICAgQHVwZGF0ZUR1bW15TGluZU51bWJlcigpXG4gICAgICBAb2xkU3RhdGUuc3R5bGVzID0ge31cbiAgICAgIEBvbGRTdGF0ZS5tYXhMaW5lTnVtYmVyRGlnaXRzID0gQG5ld1N0YXRlLm1heExpbmVOdW1iZXJEaWdpdHNcblxuICBidWlsZENvbXBvbmVudEZvclRpbGU6IChpZCkgLT4gbmV3IExpbmVOdW1iZXJzVGlsZUNvbXBvbmVudCh7aWQsIEBkb21FbGVtZW50UG9vbH0pXG5cbiAgc2hvdWxkUmVjcmVhdGVBbGxUaWxlc09uVXBkYXRlOiAtPlxuICAgIEBuZXdTdGF0ZS5jb250aW51b3VzUmVmbG93XG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGUgTWV0aG9kc1xuICAjIyNcblxuICAjIFRoaXMgZHVtbXkgbGluZSBudW1iZXIgZWxlbWVudCBob2xkcyB0aGUgZ3V0dGVyIHRvIHRoZSBhcHByb3ByaWF0ZSB3aWR0aCxcbiAgIyBzaW5jZSB0aGUgcmVhbCBsaW5lIG51bWJlcnMgYXJlIGFic29sdXRlbHkgcG9zaXRpb25lZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucy5cbiAgYXBwZW5kRHVtbXlMaW5lTnVtYmVyOiAtPlxuICAgIEBkdW1teUxpbmVOdW1iZXJDb21wb25lbnQubmV3U3RhdGUgPSBAbmV3U3RhdGVcbiAgICBAZHVtbXlMaW5lTnVtYmVyTm9kZSA9IEBkdW1teUxpbmVOdW1iZXJDb21wb25lbnQuYnVpbGRMaW5lTnVtYmVyTm9kZSh7YnVmZmVyUm93OiAtMX0pXG4gICAgQGxpbmVOdW1iZXJzTm9kZS5hcHBlbmRDaGlsZChAZHVtbXlMaW5lTnVtYmVyTm9kZSlcblxuICB1cGRhdGVEdW1teUxpbmVOdW1iZXI6IC0+XG4gICAgQGR1bW15TGluZU51bWJlckNvbXBvbmVudC5uZXdTdGF0ZSA9IEBuZXdTdGF0ZVxuICAgIEBkdW1teUxpbmVOdW1iZXJDb21wb25lbnQuc2V0TGluZU51bWJlcklubmVyTm9kZXMoMCwgZmFsc2UsIEBkdW1teUxpbmVOdW1iZXJOb2RlKVxuXG4gIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAge3RhcmdldH0gPSBldmVudFxuICAgIGxpbmVOdW1iZXIgPSB0YXJnZXQucGFyZW50Tm9kZVxuXG4gICAgdW5sZXNzIHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2ljb24tcmlnaHQnKSBhbmQgbGluZU51bWJlci5jbGFzc0xpc3QuY29udGFpbnMoJ2ZvbGRhYmxlJylcbiAgICAgIEBvbk1vdXNlRG93bihldmVudClcblxuICBvbkNsaWNrOiAoZXZlbnQpID0+XG4gICAge3RhcmdldH0gPSBldmVudFxuICAgIGxpbmVOdW1iZXIgPSB0YXJnZXQucGFyZW50Tm9kZVxuXG4gICAgaWYgdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnaWNvbi1yaWdodCcpXG4gICAgICBidWZmZXJSb3cgPSBwYXJzZUludChsaW5lTnVtYmVyLmdldEF0dHJpYnV0ZSgnZGF0YS1idWZmZXItcm93JykpXG4gICAgICBpZiBsaW5lTnVtYmVyLmNsYXNzTGlzdC5jb250YWlucygnZm9sZGVkJylcbiAgICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3coYnVmZmVyUm93KVxuICAgICAgZWxzZSBpZiBsaW5lTnVtYmVyLmNsYXNzTGlzdC5jb250YWlucygnZm9sZGFibGUnKVxuICAgICAgICBAZWRpdG9yLmZvbGRCdWZmZXJSb3coYnVmZmVyUm93KVxuIl19
