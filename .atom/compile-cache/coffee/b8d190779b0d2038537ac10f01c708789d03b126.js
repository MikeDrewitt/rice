(function() {
  var TiledComponent;

  module.exports = TiledComponent = (function() {
    function TiledComponent() {}

    TiledComponent.prototype.updateSync = function(state) {
      this.newState = this.getNewState(state);
      if (this.oldState == null) {
        this.oldState = this.buildEmptyState();
      }
      if (typeof this.beforeUpdateSync === "function") {
        this.beforeUpdateSync(state);
      }
      if (typeof this.shouldRecreateAllTilesOnUpdate === "function" ? this.shouldRecreateAllTilesOnUpdate() : void 0) {
        this.removeTileNodes();
      }
      this.updateTileNodes();
      return typeof this.afterUpdateSync === "function" ? this.afterUpdateSync(state) : void 0;
    };

    TiledComponent.prototype.removeTileNodes = function() {
      var tileRow;
      for (tileRow in this.oldState.tiles) {
        this.removeTileNode(tileRow);
      }
    };

    TiledComponent.prototype.removeTileNode = function(tileRow) {
      this.componentsByTileId[tileRow].destroy();
      delete this.componentsByTileId[tileRow];
      return delete this.oldState.tiles[tileRow];
    };

    TiledComponent.prototype.updateTileNodes = function() {
      var component, ref, tileRow, tileState;
      if (this.componentsByTileId == null) {
        this.componentsByTileId = {};
      }
      for (tileRow in this.oldState.tiles) {
        if (!this.newState.tiles.hasOwnProperty(tileRow)) {
          this.removeTileNode(tileRow);
        }
      }
      ref = this.newState.tiles;
      for (tileRow in ref) {
        tileState = ref[tileRow];
        if (this.oldState.tiles.hasOwnProperty(tileRow)) {
          component = this.componentsByTileId[tileRow];
        } else {
          component = this.componentsByTileId[tileRow] = this.buildComponentForTile(tileRow);
          this.getTilesNode().appendChild(component.getDomNode());
          this.oldState.tiles[tileRow] = Object.assign({}, tileState);
        }
        component.updateSync(this.newState);
      }
    };

    TiledComponent.prototype.getComponentForTile = function(tileRow) {
      return this.componentsByTileId[tileRow];
    };

    TiledComponent.prototype.getComponents = function() {
      var _, component, ref, results;
      ref = this.componentsByTileId;
      results = [];
      for (_ in ref) {
        component = ref[_];
        results.push(component);
      }
      return results;
    };

    TiledComponent.prototype.getTiles = function() {
      return this.getComponents().map(function(component) {
        return component.getDomNode();
      });
    };

    return TiledComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90aWxlZC1jb21wb25lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNOzs7NkJBQ0osVUFBQSxHQUFZLFNBQUMsS0FBRDtNQUNWLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiOztRQUNaLElBQUMsQ0FBQSxXQUFZLElBQUMsQ0FBQSxlQUFELENBQUE7OztRQUViLElBQUMsQ0FBQSxpQkFBa0I7O01BRW5CLGdFQUFzQixJQUFDLENBQUEseUNBQXZCO1FBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBQSxFQUFBOztNQUNBLElBQUMsQ0FBQSxlQUFELENBQUE7MERBRUEsSUFBQyxDQUFBLGdCQUFpQjtJQVRSOzs2QkFXWixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO0FBQUEsV0FBQSw4QkFBQTtRQUFBLElBQUMsQ0FBQSxjQUFELENBQWdCLE9BQWhCO0FBQUE7SUFEZTs7NkJBSWpCLGNBQUEsR0FBZ0IsU0FBQyxPQUFEO01BQ2QsSUFBQyxDQUFBLGtCQUFtQixDQUFBLE9BQUEsQ0FBUSxDQUFDLE9BQTdCLENBQUE7TUFDQSxPQUFPLElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxPQUFBO2FBQzNCLE9BQU8sSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFNLENBQUEsT0FBQTtJQUhUOzs2QkFLaEIsZUFBQSxHQUFpQixTQUFBO0FBQ2YsVUFBQTs7UUFBQSxJQUFDLENBQUEscUJBQXNCOztBQUV2QixXQUFBLDhCQUFBO1FBQ0UsSUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWhCLENBQStCLE9BQS9CLENBQVA7VUFDRSxJQUFDLENBQUEsY0FBRCxDQUFnQixPQUFoQixFQURGOztBQURGO0FBSUE7QUFBQSxXQUFBLGNBQUE7O1FBQ0UsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFoQixDQUErQixPQUEvQixDQUFIO1VBQ0UsU0FBQSxHQUFZLElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxPQUFBLEVBRGxDO1NBQUEsTUFBQTtVQUdFLFNBQUEsR0FBWSxJQUFDLENBQUEsa0JBQW1CLENBQUEsT0FBQSxDQUFwQixHQUErQixJQUFDLENBQUEscUJBQUQsQ0FBdUIsT0FBdkI7VUFFM0MsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsV0FBaEIsQ0FBNEIsU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUE1QjtVQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBTSxDQUFBLE9BQUEsQ0FBaEIsR0FBMkIsTUFBTSxDQUFDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCLFNBQWxCLEVBTjdCOztRQVFBLFNBQVMsQ0FBQyxVQUFWLENBQXFCLElBQUMsQ0FBQSxRQUF0QjtBQVRGO0lBUGU7OzZCQW9CakIsbUJBQUEsR0FBcUIsU0FBQyxPQUFEO2FBQ25CLElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxPQUFBO0lBREQ7OzZCQUdyQixhQUFBLEdBQWUsU0FBQTtBQUNiLFVBQUE7QUFBQTtBQUFBO1dBQUEsUUFBQTs7cUJBQ0U7QUFERjs7SUFEYTs7NkJBSWYsUUFBQSxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsYUFBRCxDQUFBLENBQWdCLENBQUMsR0FBakIsQ0FBcUIsU0FBQyxTQUFEO2VBQWUsU0FBUyxDQUFDLFVBQVYsQ0FBQTtNQUFmLENBQXJCO0lBRFE7Ozs7O0FBakRaIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGlsZWRDb21wb25lbnRcbiAgdXBkYXRlU3luYzogKHN0YXRlKSAtPlxuICAgIEBuZXdTdGF0ZSA9IEBnZXROZXdTdGF0ZShzdGF0ZSlcbiAgICBAb2xkU3RhdGUgPz0gQGJ1aWxkRW1wdHlTdGF0ZSgpXG5cbiAgICBAYmVmb3JlVXBkYXRlU3luYz8oc3RhdGUpXG5cbiAgICBAcmVtb3ZlVGlsZU5vZGVzKCkgaWYgQHNob3VsZFJlY3JlYXRlQWxsVGlsZXNPblVwZGF0ZT8oKVxuICAgIEB1cGRhdGVUaWxlTm9kZXMoKVxuXG4gICAgQGFmdGVyVXBkYXRlU3luYz8oc3RhdGUpXG5cbiAgcmVtb3ZlVGlsZU5vZGVzOiAtPlxuICAgIEByZW1vdmVUaWxlTm9kZSh0aWxlUm93KSBmb3IgdGlsZVJvdyBvZiBAb2xkU3RhdGUudGlsZXNcbiAgICByZXR1cm5cblxuICByZW1vdmVUaWxlTm9kZTogKHRpbGVSb3cpIC0+XG4gICAgQGNvbXBvbmVudHNCeVRpbGVJZFt0aWxlUm93XS5kZXN0cm95KClcbiAgICBkZWxldGUgQGNvbXBvbmVudHNCeVRpbGVJZFt0aWxlUm93XVxuICAgIGRlbGV0ZSBAb2xkU3RhdGUudGlsZXNbdGlsZVJvd11cblxuICB1cGRhdGVUaWxlTm9kZXM6IC0+XG4gICAgQGNvbXBvbmVudHNCeVRpbGVJZCA/PSB7fVxuXG4gICAgZm9yIHRpbGVSb3cgb2YgQG9sZFN0YXRlLnRpbGVzXG4gICAgICB1bmxlc3MgQG5ld1N0YXRlLnRpbGVzLmhhc093blByb3BlcnR5KHRpbGVSb3cpXG4gICAgICAgIEByZW1vdmVUaWxlTm9kZSh0aWxlUm93KVxuXG4gICAgZm9yIHRpbGVSb3csIHRpbGVTdGF0ZSBvZiBAbmV3U3RhdGUudGlsZXNcbiAgICAgIGlmIEBvbGRTdGF0ZS50aWxlcy5oYXNPd25Qcm9wZXJ0eSh0aWxlUm93KVxuICAgICAgICBjb21wb25lbnQgPSBAY29tcG9uZW50c0J5VGlsZUlkW3RpbGVSb3ddXG4gICAgICBlbHNlXG4gICAgICAgIGNvbXBvbmVudCA9IEBjb21wb25lbnRzQnlUaWxlSWRbdGlsZVJvd10gPSBAYnVpbGRDb21wb25lbnRGb3JUaWxlKHRpbGVSb3cpXG5cbiAgICAgICAgQGdldFRpbGVzTm9kZSgpLmFwcGVuZENoaWxkKGNvbXBvbmVudC5nZXREb21Ob2RlKCkpXG4gICAgICAgIEBvbGRTdGF0ZS50aWxlc1t0aWxlUm93XSA9IE9iamVjdC5hc3NpZ24oe30sIHRpbGVTdGF0ZSlcblxuICAgICAgY29tcG9uZW50LnVwZGF0ZVN5bmMoQG5ld1N0YXRlKVxuXG4gICAgcmV0dXJuXG5cbiAgZ2V0Q29tcG9uZW50Rm9yVGlsZTogKHRpbGVSb3cpIC0+XG4gICAgQGNvbXBvbmVudHNCeVRpbGVJZFt0aWxlUm93XVxuXG4gIGdldENvbXBvbmVudHM6IC0+XG4gICAgZm9yIF8sIGNvbXBvbmVudCBvZiBAY29tcG9uZW50c0J5VGlsZUlkXG4gICAgICBjb21wb25lbnRcblxuICBnZXRUaWxlczogLT5cbiAgICBAZ2V0Q29tcG9uZW50cygpLm1hcCgoY29tcG9uZW50KSAtPiBjb21wb25lbnQuZ2V0RG9tTm9kZSgpKVxuIl19
