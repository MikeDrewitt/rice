(function() {
  var CursorsComponent, DummyLineNode, LinesComponent, LinesTileComponent, TiledComponent,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CursorsComponent = require('./cursors-component');

  LinesTileComponent = require('./lines-tile-component');

  TiledComponent = require('./tiled-component');

  DummyLineNode = document.createElement('div');

  DummyLineNode.className = 'line';

  DummyLineNode.style.position = 'absolute';

  DummyLineNode.style.visibility = 'hidden';

  DummyLineNode.appendChild(document.createElement('span'));

  DummyLineNode.appendChild(document.createElement('span'));

  DummyLineNode.appendChild(document.createElement('span'));

  DummyLineNode.appendChild(document.createElement('span'));

  DummyLineNode.children[0].textContent = 'x';

  DummyLineNode.children[1].textContent = '我';

  DummyLineNode.children[2].textContent = 'ﾊ';

  DummyLineNode.children[3].textContent = '세';

  module.exports = LinesComponent = (function(superClass) {
    extend(LinesComponent, superClass);

    LinesComponent.prototype.placeholderTextDiv = null;

    function LinesComponent(arg) {
      this.views = arg.views, this.presenter = arg.presenter, this.domElementPool = arg.domElementPool, this.assert = arg.assert;
      this.domNode = document.createElement('div');
      this.domNode.classList.add('lines');
      this.tilesNode = document.createElement("div");
      this.tilesNode.style.isolation = "isolate";
      this.tilesNode.style.zIndex = 0;
      this.domNode.appendChild(this.tilesNode);
      this.cursorsComponent = new CursorsComponent;
      this.domNode.appendChild(this.cursorsComponent.getDomNode());
    }

    LinesComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    LinesComponent.prototype.shouldRecreateAllTilesOnUpdate = function() {
      return this.newState.continuousReflow;
    };

    LinesComponent.prototype.beforeUpdateSync = function(state) {
      if (this.newState.maxHeight !== this.oldState.maxHeight) {
        this.domNode.style.height = this.newState.maxHeight + 'px';
        this.oldState.maxHeight = this.newState.maxHeight;
      }
      if (this.newState.backgroundColor !== this.oldState.backgroundColor) {
        this.domNode.style.backgroundColor = this.newState.backgroundColor;
        return this.oldState.backgroundColor = this.newState.backgroundColor;
      }
    };

    LinesComponent.prototype.afterUpdateSync = function(state) {
      var component, i, j, len, len1, ref, ref1, ref2;
      if (this.newState.placeholderText !== this.oldState.placeholderText) {
        if ((ref = this.placeholderTextDiv) != null) {
          ref.remove();
        }
        if (this.newState.placeholderText != null) {
          this.placeholderTextDiv = document.createElement('div');
          this.placeholderTextDiv.classList.add('placeholder-text');
          this.placeholderTextDiv.textContent = this.newState.placeholderText;
          this.domNode.appendChild(this.placeholderTextDiv);
        }
        this.oldState.placeholderText = this.newState.placeholderText;
      }
      ref1 = this.getComponents();
      for (i = 0, len = ref1.length; i < len; i++) {
        component = ref1[i];
        component.removeDeletedBlockDecorations();
      }
      ref2 = this.getComponents();
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        component = ref2[j];
        component.updateBlockDecorations();
      }
      return this.cursorsComponent.updateSync(state);
    };

    LinesComponent.prototype.buildComponentForTile = function(id) {
      return new LinesTileComponent({
        id: id,
        presenter: this.presenter,
        domElementPool: this.domElementPool,
        assert: this.assert,
        views: this.views
      });
    };

    LinesComponent.prototype.buildEmptyState = function() {
      return {
        tiles: {}
      };
    };

    LinesComponent.prototype.getNewState = function(state) {
      return state.content;
    };

    LinesComponent.prototype.getTilesNode = function() {
      return this.tilesNode;
    };

    LinesComponent.prototype.measureLineHeightAndDefaultCharWidth = function() {
      var defaultCharWidth, doubleWidthCharWidth, halfWidthCharWidth, koreanCharWidth, lineHeightInPixels;
      this.domNode.appendChild(DummyLineNode);
      lineHeightInPixels = DummyLineNode.getBoundingClientRect().height;
      defaultCharWidth = DummyLineNode.children[0].getBoundingClientRect().width;
      doubleWidthCharWidth = DummyLineNode.children[1].getBoundingClientRect().width;
      halfWidthCharWidth = DummyLineNode.children[2].getBoundingClientRect().width;
      koreanCharWidth = DummyLineNode.children[3].getBoundingClientRect().width;
      this.domNode.removeChild(DummyLineNode);
      this.presenter.setLineHeight(lineHeightInPixels);
      return this.presenter.setBaseCharacterWidth(defaultCharWidth, doubleWidthCharWidth, halfWidthCharWidth, koreanCharWidth);
    };

    LinesComponent.prototype.measureBlockDecorations = function() {
      var component, i, len, ref;
      ref = this.getComponents();
      for (i = 0, len = ref.length; i < len; i++) {
        component = ref[i];
        component.measureBlockDecorations();
      }
    };

    LinesComponent.prototype.lineIdForScreenRow = function(screenRow) {
      var ref, tile;
      tile = this.presenter.tileForRow(screenRow);
      return (ref = this.getComponentForTile(tile)) != null ? ref.lineIdForScreenRow(screenRow) : void 0;
    };

    LinesComponent.prototype.lineNodeForScreenRow = function(screenRow) {
      var ref, tile;
      tile = this.presenter.tileForRow(screenRow);
      return (ref = this.getComponentForTile(tile)) != null ? ref.lineNodeForScreenRow(screenRow) : void 0;
    };

    LinesComponent.prototype.textNodesForScreenRow = function(screenRow) {
      var ref, tile;
      tile = this.presenter.tileForRow(screenRow);
      return (ref = this.getComponentForTile(tile)) != null ? ref.textNodesForScreenRow(screenRow) : void 0;
    };

    return LinesComponent;

  })(TiledComponent);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9saW5lcy1jb21wb25lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxtRkFBQTtJQUFBOzs7RUFBQSxnQkFBQSxHQUFtQixPQUFBLENBQVEscUJBQVI7O0VBQ25CLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx3QkFBUjs7RUFDckIsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBRWpCLGFBQUEsR0FBZ0IsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7O0VBQ2hCLGFBQWEsQ0FBQyxTQUFkLEdBQTBCOztFQUMxQixhQUFhLENBQUMsS0FBSyxDQUFDLFFBQXBCLEdBQStCOztFQUMvQixhQUFhLENBQUMsS0FBSyxDQUFDLFVBQXBCLEdBQWlDOztFQUNqQyxhQUFhLENBQUMsV0FBZCxDQUEwQixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUExQjs7RUFDQSxhQUFhLENBQUMsV0FBZCxDQUEwQixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUExQjs7RUFDQSxhQUFhLENBQUMsV0FBZCxDQUEwQixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUExQjs7RUFDQSxhQUFhLENBQUMsV0FBZCxDQUEwQixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QixDQUExQjs7RUFDQSxhQUFhLENBQUMsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQTFCLEdBQXdDOztFQUN4QyxhQUFhLENBQUMsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQTFCLEdBQXdDOztFQUN4QyxhQUFhLENBQUMsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQTFCLEdBQXdDOztFQUN4QyxhQUFhLENBQUMsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQTFCLEdBQXdD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Q0UsU0FBUyxDQUFDLHVCQUFWLENBQUE7QUFERjtJQUR1Qjs7NkJBS3pCLGtCQUFBLEdBQW9CLFNBQUMsU0FBRDtBQUNsQixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFTLENBQUMsVUFBWCxDQUFzQixTQUF0QjtpRUFDbUIsQ0FBRSxrQkFBNUIsQ0FBK0MsU0FBL0M7SUFGa0I7OzZCQUlwQixvQkFBQSxHQUFzQixTQUFDLFNBQUQ7QUFDcEIsVUFBQTtNQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBUyxDQUFDLFVBQVgsQ0FBc0IsU0FBdEI7aUVBQ21CLENBQUUsb0JBQTVCLENBQWlELFNBQWpEO0lBRm9COzs2QkFJdEIscUJBQUEsR0FBdUIsU0FBQyxTQUFEO0FBQ3JCLFVBQUE7TUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFYLENBQXNCLFNBQXRCO2lFQUNtQixDQUFFLHFCQUE1QixDQUFrRCxTQUFsRDtJQUZxQjs7OztLQXhGSTtBQWxCN0IiLCJzb3VyY2VzQ29udGVudCI6WyJDdXJzb3JzQ29tcG9uZW50ID0gcmVxdWlyZSAnLi9jdXJzb3JzLWNvbXBvbmVudCdcbkxpbmVzVGlsZUNvbXBvbmVudCA9IHJlcXVpcmUgJy4vbGluZXMtdGlsZS1jb21wb25lbnQnXG5UaWxlZENvbXBvbmVudCA9IHJlcXVpcmUgJy4vdGlsZWQtY29tcG9uZW50J1xuXG5EdW1teUxpbmVOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbkR1bW15TGluZU5vZGUuY2xhc3NOYW1lID0gJ2xpbmUnXG5EdW1teUxpbmVOb2RlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuRHVtbXlMaW5lTm9kZS5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbidcbkR1bW15TGluZU5vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKVxuRHVtbXlMaW5lTm9kZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykpXG5EdW1teUxpbmVOb2RlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSlcbkR1bW15TGluZU5vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKVxuRHVtbXlMaW5lTm9kZS5jaGlsZHJlblswXS50ZXh0Q29udGVudCA9ICd4J1xuRHVtbXlMaW5lTm9kZS5jaGlsZHJlblsxXS50ZXh0Q29udGVudCA9ICfmiJEnXG5EdW1teUxpbmVOb2RlLmNoaWxkcmVuWzJdLnRleHRDb250ZW50ID0gJ+++iidcbkR1bW15TGluZU5vZGUuY2hpbGRyZW5bM10udGV4dENvbnRlbnQgPSAn7IS4J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBMaW5lc0NvbXBvbmVudCBleHRlbmRzIFRpbGVkQ29tcG9uZW50XG4gIHBsYWNlaG9sZGVyVGV4dERpdjogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoe0B2aWV3cywgQHByZXNlbnRlciwgQGRvbUVsZW1lbnRQb29sLCBAYXNzZXJ0fSkgLT5cbiAgICBAZG9tTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGRvbU5vZGUuY2xhc3NMaXN0LmFkZCgnbGluZXMnKVxuICAgIEB0aWxlc05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgIyBDcmVhdGUgYSBuZXcgc3RhY2tpbmcgY29udGV4dCwgc28gdGhhdCB0aWxlcyB6LWluZGV4IGRvZXMgbm90IGludGVyZmVyZVxuICAgICMgd2l0aCBvdGhlciB2aXN1YWwgZWxlbWVudHMuXG4gICAgQHRpbGVzTm9kZS5zdHlsZS5pc29sYXRpb24gPSBcImlzb2xhdGVcIlxuICAgIEB0aWxlc05vZGUuc3R5bGUuekluZGV4ID0gMFxuICAgIEBkb21Ob2RlLmFwcGVuZENoaWxkKEB0aWxlc05vZGUpXG5cbiAgICBAY3Vyc29yc0NvbXBvbmVudCA9IG5ldyBDdXJzb3JzQ29tcG9uZW50XG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQGN1cnNvcnNDb21wb25lbnQuZ2V0RG9tTm9kZSgpKVxuXG4gIGdldERvbU5vZGU6IC0+XG4gICAgQGRvbU5vZGVcblxuICBzaG91bGRSZWNyZWF0ZUFsbFRpbGVzT25VcGRhdGU6IC0+XG4gICAgQG5ld1N0YXRlLmNvbnRpbnVvdXNSZWZsb3dcblxuICBiZWZvcmVVcGRhdGVTeW5jOiAoc3RhdGUpIC0+XG4gICAgaWYgQG5ld1N0YXRlLm1heEhlaWdodCBpc250IEBvbGRTdGF0ZS5tYXhIZWlnaHRcbiAgICAgIEBkb21Ob2RlLnN0eWxlLmhlaWdodCA9IEBuZXdTdGF0ZS5tYXhIZWlnaHQgKyAncHgnXG4gICAgICBAb2xkU3RhdGUubWF4SGVpZ2h0ID0gQG5ld1N0YXRlLm1heEhlaWdodFxuXG4gICAgaWYgQG5ld1N0YXRlLmJhY2tncm91bmRDb2xvciBpc250IEBvbGRTdGF0ZS5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgIEBkb21Ob2RlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IEBuZXdTdGF0ZS5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgIEBvbGRTdGF0ZS5iYWNrZ3JvdW5kQ29sb3IgPSBAbmV3U3RhdGUuYmFja2dyb3VuZENvbG9yXG5cbiAgYWZ0ZXJVcGRhdGVTeW5jOiAoc3RhdGUpIC0+XG4gICAgaWYgQG5ld1N0YXRlLnBsYWNlaG9sZGVyVGV4dCBpc250IEBvbGRTdGF0ZS5wbGFjZWhvbGRlclRleHRcbiAgICAgIEBwbGFjZWhvbGRlclRleHREaXY/LnJlbW92ZSgpXG4gICAgICBpZiBAbmV3U3RhdGUucGxhY2Vob2xkZXJUZXh0P1xuICAgICAgICBAcGxhY2Vob2xkZXJUZXh0RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgICAgQHBsYWNlaG9sZGVyVGV4dERpdi5jbGFzc0xpc3QuYWRkKCdwbGFjZWhvbGRlci10ZXh0JylcbiAgICAgICAgQHBsYWNlaG9sZGVyVGV4dERpdi50ZXh0Q29udGVudCA9IEBuZXdTdGF0ZS5wbGFjZWhvbGRlclRleHRcbiAgICAgICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoQHBsYWNlaG9sZGVyVGV4dERpdilcbiAgICAgIEBvbGRTdGF0ZS5wbGFjZWhvbGRlclRleHQgPSBAbmV3U3RhdGUucGxhY2Vob2xkZXJUZXh0XG5cbiAgICAjIFJlbW92aW5nIGFuZCB1cGRhdGluZyBibG9jayBkZWNvcmF0aW9ucyBuZWVkcyB0byBiZSBkb25lIGluIHR3byBkaWZmZXJlbnRcbiAgICAjIHN0ZXBzLCBzbyB0aGF0IHRoZSBzYW1lIGRlY29yYXRpb24gbm9kZSBjYW4gYmUgbW92ZWQgZnJvbSBvbmUgdGlsZSB0b1xuICAgICMgYW5vdGhlciBpbiB0aGUgc2FtZSBhbmltYXRpb24gZnJhbWUuXG4gICAgZm9yIGNvbXBvbmVudCBpbiBAZ2V0Q29tcG9uZW50cygpXG4gICAgICBjb21wb25lbnQucmVtb3ZlRGVsZXRlZEJsb2NrRGVjb3JhdGlvbnMoKVxuICAgIGZvciBjb21wb25lbnQgaW4gQGdldENvbXBvbmVudHMoKVxuICAgICAgY29tcG9uZW50LnVwZGF0ZUJsb2NrRGVjb3JhdGlvbnMoKVxuXG4gICAgQGN1cnNvcnNDb21wb25lbnQudXBkYXRlU3luYyhzdGF0ZSlcblxuICBidWlsZENvbXBvbmVudEZvclRpbGU6IChpZCkgLT4gbmV3IExpbmVzVGlsZUNvbXBvbmVudCh7aWQsIEBwcmVzZW50ZXIsIEBkb21FbGVtZW50UG9vbCwgQGFzc2VydCwgQHZpZXdzfSlcblxuICBidWlsZEVtcHR5U3RhdGU6IC0+XG4gICAge3RpbGVzOiB7fX1cblxuICBnZXROZXdTdGF0ZTogKHN0YXRlKSAtPlxuICAgIHN0YXRlLmNvbnRlbnRcblxuICBnZXRUaWxlc05vZGU6IC0+IEB0aWxlc05vZGVcblxuICBtZWFzdXJlTGluZUhlaWdodEFuZERlZmF1bHRDaGFyV2lkdGg6IC0+XG4gICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoRHVtbXlMaW5lTm9kZSlcblxuICAgIGxpbmVIZWlnaHRJblBpeGVscyA9IER1bW15TGluZU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgZGVmYXVsdENoYXJXaWR0aCA9IER1bW15TGluZU5vZGUuY2hpbGRyZW5bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICBkb3VibGVXaWR0aENoYXJXaWR0aCA9IER1bW15TGluZU5vZGUuY2hpbGRyZW5bMV0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGhcbiAgICBoYWxmV2lkdGhDaGFyV2lkdGggPSBEdW1teUxpbmVOb2RlLmNoaWxkcmVuWzJdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoXG4gICAga29yZWFuQ2hhcldpZHRoID0gRHVtbXlMaW5lTm9kZS5jaGlsZHJlblszXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aFxuXG4gICAgQGRvbU5vZGUucmVtb3ZlQ2hpbGQoRHVtbXlMaW5lTm9kZSlcblxuICAgIEBwcmVzZW50ZXIuc2V0TGluZUhlaWdodChsaW5lSGVpZ2h0SW5QaXhlbHMpXG4gICAgQHByZXNlbnRlci5zZXRCYXNlQ2hhcmFjdGVyV2lkdGgoZGVmYXVsdENoYXJXaWR0aCwgZG91YmxlV2lkdGhDaGFyV2lkdGgsIGhhbGZXaWR0aENoYXJXaWR0aCwga29yZWFuQ2hhcldpZHRoKVxuXG4gIG1lYXN1cmVCbG9ja0RlY29yYXRpb25zOiAtPlxuICAgIGZvciBjb21wb25lbnQgaW4gQGdldENvbXBvbmVudHMoKVxuICAgICAgY29tcG9uZW50Lm1lYXN1cmVCbG9ja0RlY29yYXRpb25zKClcbiAgICByZXR1cm5cblxuICBsaW5lSWRGb3JTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgdGlsZSA9IEBwcmVzZW50ZXIudGlsZUZvclJvdyhzY3JlZW5Sb3cpXG4gICAgQGdldENvbXBvbmVudEZvclRpbGUodGlsZSk/LmxpbmVJZEZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG5cbiAgbGluZU5vZGVGb3JTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgdGlsZSA9IEBwcmVzZW50ZXIudGlsZUZvclJvdyhzY3JlZW5Sb3cpXG4gICAgQGdldENvbXBvbmVudEZvclRpbGUodGlsZSk/LmxpbmVOb2RlRm9yU2NyZWVuUm93KHNjcmVlblJvdylcblxuICB0ZXh0Tm9kZXNGb3JTY3JlZW5Sb3c6IChzY3JlZW5Sb3cpIC0+XG4gICAgdGlsZSA9IEBwcmVzZW50ZXIudGlsZUZvclJvdyhzY3JlZW5Sb3cpXG4gICAgQGdldENvbXBvbmVudEZvclRpbGUodGlsZSk/LnRleHROb2Rlc0ZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG4iXX0=
