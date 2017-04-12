(function() {
  var ContentsByMode, StatusBarManager;

  ContentsByMode = {
    'insert': ["status-bar-vim-mode-insert", "Insert"],
    'insert.replace': ["status-bar-vim-mode-insert", "Replace"],
    'normal': ["status-bar-vim-mode-normal", "Normal"],
    'visual': ["status-bar-vim-mode-visual", "Visual"],
    'visual.characterwise': ["status-bar-vim-mode-visual", "Visual"],
    'visual.linewise': ["status-bar-vim-mode-visual", "Visual Line"],
    'visual.blockwise': ["status-bar-vim-mode-visual", "Visual Block"]
  };

  module.exports = StatusBarManager = (function() {
    function StatusBarManager() {
      this.element = document.createElement("div");
      this.element.id = "status-bar-vim-mode";
      this.container = document.createElement("div");
      this.container.className = "inline-block";
      this.container.appendChild(this.element);
    }

    StatusBarManager.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
    };

    StatusBarManager.prototype.update = function(currentMode, currentSubmode) {
      var klass, newContents, text;
      if (currentSubmode != null) {
        currentMode = currentMode + "." + currentSubmode;
      }
      if (newContents = ContentsByMode[currentMode]) {
        klass = newContents[0], text = newContents[1];
        this.element.className = klass;
        return this.element.textContent = text;
      } else {
        return this.hide();
      }
    };

    StatusBarManager.prototype.hide = function() {
      return this.element.className = 'hidden';
    };

    StatusBarManager.prototype.attach = function() {
      return this.tile = this.statusBar.addRightTile({
        item: this.container,
        priority: 20
      });
    };

    StatusBarManager.prototype.detach = function() {
      return this.tile.destroy();
    };

    return StatusBarManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvc3RhdHVzLWJhci1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsY0FBQSxHQUNFO0lBQUEsUUFBQSxFQUFVLENBQUMsNEJBQUQsRUFBK0IsUUFBL0IsQ0FBVjtJQUNBLGdCQUFBLEVBQWtCLENBQUMsNEJBQUQsRUFBK0IsU0FBL0IsQ0FEbEI7SUFFQSxRQUFBLEVBQVUsQ0FBQyw0QkFBRCxFQUErQixRQUEvQixDQUZWO0lBR0EsUUFBQSxFQUFVLENBQUMsNEJBQUQsRUFBK0IsUUFBL0IsQ0FIVjtJQUlBLHNCQUFBLEVBQXdCLENBQUMsNEJBQUQsRUFBK0IsUUFBL0IsQ0FKeEI7SUFLQSxpQkFBQSxFQUFtQixDQUFDLDRCQUFELEVBQStCLGFBQS9CLENBTG5CO0lBTUEsa0JBQUEsRUFBb0IsQ0FBQyw0QkFBRCxFQUErQixjQUEvQixDQU5wQjs7O0VBUUYsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLDBCQUFBO01BQ1gsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxHQUFjO01BRWQsSUFBQyxDQUFBLFNBQUQsR0FBYSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNiLElBQUMsQ0FBQSxTQUFTLENBQUMsU0FBWCxHQUF1QjtNQUN2QixJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVgsQ0FBdUIsSUFBQyxDQUFBLE9BQXhCO0lBTlc7OytCQVFiLFVBQUEsR0FBWSxTQUFDLFNBQUQ7TUFBQyxJQUFDLENBQUEsWUFBRDtJQUFEOzsrQkFFWixNQUFBLEdBQVEsU0FBQyxXQUFELEVBQWMsY0FBZDtBQUNOLFVBQUE7TUFBQSxJQUFvRCxzQkFBcEQ7UUFBQSxXQUFBLEdBQWMsV0FBQSxHQUFjLEdBQWQsR0FBb0IsZUFBbEM7O01BQ0EsSUFBRyxXQUFBLEdBQWMsY0FBZSxDQUFBLFdBQUEsQ0FBaEM7UUFDRyxzQkFBRCxFQUFRO1FBQ1IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFULEdBQXFCO2VBQ3JCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QixLQUh6QjtPQUFBLE1BQUE7ZUFLRSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBTEY7O0lBRk07OytCQVNSLElBQUEsR0FBTSxTQUFBO2FBQ0osSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFULEdBQXFCO0lBRGpCOzsrQkFLTixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxZQUFYLENBQXdCO1FBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxTQUFQO1FBQWtCLFFBQUEsRUFBVSxFQUE1QjtPQUF4QjtJQURGOzsrQkFHUixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBO0lBRE07Ozs7O0FBdENWIiwic291cmNlc0NvbnRlbnQiOlsiQ29udGVudHNCeU1vZGUgPVxuICAnaW5zZXJ0JzogW1wic3RhdHVzLWJhci12aW0tbW9kZS1pbnNlcnRcIiwgXCJJbnNlcnRcIl1cbiAgJ2luc2VydC5yZXBsYWNlJzogW1wic3RhdHVzLWJhci12aW0tbW9kZS1pbnNlcnRcIiwgXCJSZXBsYWNlXCJdXG4gICdub3JtYWwnOiBbXCJzdGF0dXMtYmFyLXZpbS1tb2RlLW5vcm1hbFwiLCBcIk5vcm1hbFwiXVxuICAndmlzdWFsJzogW1wic3RhdHVzLWJhci12aW0tbW9kZS12aXN1YWxcIiwgXCJWaXN1YWxcIl1cbiAgJ3Zpc3VhbC5jaGFyYWN0ZXJ3aXNlJzogW1wic3RhdHVzLWJhci12aW0tbW9kZS12aXN1YWxcIiwgXCJWaXN1YWxcIl1cbiAgJ3Zpc3VhbC5saW5ld2lzZSc6IFtcInN0YXR1cy1iYXItdmltLW1vZGUtdmlzdWFsXCIsIFwiVmlzdWFsIExpbmVcIl1cbiAgJ3Zpc3VhbC5ibG9ja3dpc2UnOiBbXCJzdGF0dXMtYmFyLXZpbS1tb2RlLXZpc3VhbFwiLCBcIlZpc3VhbCBCbG9ja1wiXVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTdGF0dXNCYXJNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgIEBlbGVtZW50LmlkID0gXCJzdGF0dXMtYmFyLXZpbS1tb2RlXCJcblxuICAgIEBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgQGNvbnRhaW5lci5jbGFzc05hbWUgPSBcImlubGluZS1ibG9ja1wiXG4gICAgQGNvbnRhaW5lci5hcHBlbmRDaGlsZChAZWxlbWVudClcblxuICBpbml0aWFsaXplOiAoQHN0YXR1c0JhcikgLT5cblxuICB1cGRhdGU6IChjdXJyZW50TW9kZSwgY3VycmVudFN1Ym1vZGUpIC0+XG4gICAgY3VycmVudE1vZGUgPSBjdXJyZW50TW9kZSArIFwiLlwiICsgY3VycmVudFN1Ym1vZGUgaWYgY3VycmVudFN1Ym1vZGU/XG4gICAgaWYgbmV3Q29udGVudHMgPSBDb250ZW50c0J5TW9kZVtjdXJyZW50TW9kZV1cbiAgICAgIFtrbGFzcywgdGV4dF0gPSBuZXdDb250ZW50c1xuICAgICAgQGVsZW1lbnQuY2xhc3NOYW1lID0ga2xhc3NcbiAgICAgIEBlbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICAgIGVsc2VcbiAgICAgIEBoaWRlKClcblxuICBoaWRlOiAtPlxuICAgIEBlbGVtZW50LmNsYXNzTmFtZSA9ICdoaWRkZW4nXG5cbiAgIyBQcml2YXRlXG5cbiAgYXR0YWNoOiAtPlxuICAgIEB0aWxlID0gQHN0YXR1c0Jhci5hZGRSaWdodFRpbGUoaXRlbTogQGNvbnRhaW5lciwgcHJpb3JpdHk6IDIwKVxuXG4gIGRldGFjaDogLT5cbiAgICBAdGlsZS5kZXN0cm95KClcbiJdfQ==
