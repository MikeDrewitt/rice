(function() {
  var TitleBar,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module.exports = TitleBar = (function() {
    function TitleBar(arg) {
      this.workspace = arg.workspace, this.themes = arg.themes, this.applicationDelegate = arg.applicationDelegate;
      this.dblclickHandler = bind(this.dblclickHandler, this);
      this.element = document.createElement('div');
      this.element.classList.add('title-bar');
      this.titleElement = document.createElement('div');
      this.titleElement.classList.add('title');
      this.element.appendChild(this.titleElement);
      this.element.addEventListener('dblclick', this.dblclickHandler);
      this.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.updateTitle();
        };
      })(this));
      this.themes.onDidChangeActiveThemes((function(_this) {
        return function() {
          return _this.updateWindowSheetOffset();
        };
      })(this));
      this.updateTitle();
      this.updateWindowSheetOffset();
    }

    TitleBar.prototype.dblclickHandler = function() {
      switch (this.applicationDelegate.getUserDefault('AppleActionOnDoubleClick', 'string')) {
        case 'Minimize':
          return this.applicationDelegate.minimizeWindow();
        case 'Maximize':
          if (this.applicationDelegate.isWindowMaximized()) {
            return this.applicationDelegate.unmaximizeWindow();
          } else {
            return this.applicationDelegate.maximizeWindow();
          }
      }
    };

    TitleBar.prototype.updateTitle = function() {
      return this.titleElement.textContent = document.title;
    };

    TitleBar.prototype.updateWindowSheetOffset = function() {
      return this.applicationDelegate.getCurrentWindow().setSheetOffset(this.element.offsetHeight);
    };

    return TitleBar;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90aXRsZS1iYXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxRQUFBO0lBQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGtCQUFDLEdBQUQ7TUFBRSxJQUFDLENBQUEsZ0JBQUEsV0FBVyxJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSwwQkFBQTs7TUFDbkMsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLFdBQXZCO01BRUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDaEIsSUFBQyxDQUFBLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBeEIsQ0FBNEIsT0FBNUI7TUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLFlBQXRCO01BRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxnQkFBVCxDQUEwQixVQUExQixFQUFzQyxJQUFDLENBQUEsZUFBdkM7TUFFQSxJQUFDLENBQUEsU0FBUyxDQUFDLHlCQUFYLENBQXFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsV0FBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDO01BQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLHVCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEM7TUFFQSxJQUFDLENBQUEsV0FBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLHVCQUFELENBQUE7SUFkVzs7dUJBZ0JiLGVBQUEsR0FBaUIsU0FBQTtBQUVmLGNBQU8sSUFBQyxDQUFBLG1CQUFtQixDQUFDLGNBQXJCLENBQW9DLDBCQUFwQyxFQUFnRSxRQUFoRSxDQUFQO0FBQUEsYUFDTyxVQURQO2lCQUVJLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxjQUFyQixDQUFBO0FBRkosYUFHTyxVQUhQO1VBSUksSUFBRyxJQUFDLENBQUEsbUJBQW1CLENBQUMsaUJBQXJCLENBQUEsQ0FBSDttQkFDRSxJQUFDLENBQUEsbUJBQW1CLENBQUMsZ0JBQXJCLENBQUEsRUFERjtXQUFBLE1BQUE7bUJBR0UsSUFBQyxDQUFBLG1CQUFtQixDQUFDLGNBQXJCLENBQUEsRUFIRjs7QUFKSjtJQUZlOzt1QkFXakIsV0FBQSxHQUFhLFNBQUE7YUFDWCxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQWQsR0FBNEIsUUFBUSxDQUFDO0lBRDFCOzt1QkFHYix1QkFBQSxHQUF5QixTQUFBO2FBQ3ZCLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxnQkFBckIsQ0FBQSxDQUF1QyxDQUFDLGNBQXhDLENBQXVELElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBaEU7SUFEdUI7Ozs7O0FBaEMzQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRpdGxlQmFyXG4gIGNvbnN0cnVjdG9yOiAoe0B3b3Jrc3BhY2UsIEB0aGVtZXMsIEBhcHBsaWNhdGlvbkRlbGVnYXRlfSkgLT5cbiAgICBAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndGl0bGUtYmFyJylcblxuICAgIEB0aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEB0aXRsZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndGl0bGUnKVxuICAgIEBlbGVtZW50LmFwcGVuZENoaWxkKEB0aXRsZUVsZW1lbnQpXG5cbiAgICBAZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdkYmxjbGljaycsIEBkYmxjbGlja0hhbmRsZXJcblxuICAgIEB3b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSA9PiBAdXBkYXRlVGl0bGUoKVxuICAgIEB0aGVtZXMub25EaWRDaGFuZ2VBY3RpdmVUaGVtZXMgPT4gQHVwZGF0ZVdpbmRvd1NoZWV0T2Zmc2V0KClcblxuICAgIEB1cGRhdGVUaXRsZSgpXG4gICAgQHVwZGF0ZVdpbmRvd1NoZWV0T2Zmc2V0KClcblxuICBkYmxjbGlja0hhbmRsZXI6ID0+XG4gICAgIyBVc2VyIHByZWZlcmVuY2UgZGVjaWRpbmcgd2hpY2ggYWN0aW9uIHRvIHRha2Ugb24gYSB0aXRsZSBiYXIgZG91YmxlLWNsaWNrXG4gICAgc3dpdGNoIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmdldFVzZXJEZWZhdWx0KCdBcHBsZUFjdGlvbk9uRG91YmxlQ2xpY2snLCAnc3RyaW5nJylcbiAgICAgIHdoZW4gJ01pbmltaXplJ1xuICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5taW5pbWl6ZVdpbmRvdygpXG4gICAgICB3aGVuICdNYXhpbWl6ZSdcbiAgICAgICAgaWYgQGFwcGxpY2F0aW9uRGVsZWdhdGUuaXNXaW5kb3dNYXhpbWl6ZWQoKVxuICAgICAgICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnVubWF4aW1pemVXaW5kb3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUubWF4aW1pemVXaW5kb3coKVxuXG4gIHVwZGF0ZVRpdGxlOiAtPlxuICAgIEB0aXRsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBkb2N1bWVudC50aXRsZVxuXG4gIHVwZGF0ZVdpbmRvd1NoZWV0T2Zmc2V0OiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmdldEN1cnJlbnRXaW5kb3coKS5zZXRTaGVldE9mZnNldChAZWxlbWVudC5vZmZzZXRIZWlnaHQpXG4iXX0=
