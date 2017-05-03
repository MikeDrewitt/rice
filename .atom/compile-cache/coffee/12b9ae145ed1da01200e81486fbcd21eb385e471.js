(function() {
  var ContextMenu, Menu;

  Menu = require('electron').Menu;

  module.exports = ContextMenu = (function() {
    function ContextMenu(template, atomWindow) {
      var menu;
      this.atomWindow = atomWindow;
      template = this.createClickHandlers(template);
      menu = Menu.buildFromTemplate(template);
      menu.popup(this.atomWindow.browserWindow);
    }

    ContextMenu.prototype.createClickHandlers = function(template) {
      var i, item, len, results;
      results = [];
      for (i = 0, len = template.length; i < len; i++) {
        item = template[i];
        if (item.command) {
          if (item.commandDetail == null) {
            item.commandDetail = {};
          }
          item.commandDetail.contextCommand = true;
          item.commandDetail.atomWindow = this.atomWindow;
          (function(_this) {
            return (function(item) {
              return item.click = function() {
                return global.atomApplication.sendCommandToWindow(item.command, _this.atomWindow, item.commandDetail);
              };
            });
          })(this)(item);
        } else if (item.submenu) {
          this.createClickHandlers(item.submenu);
        }
        results.push(item);
      }
      return results;
    };

    return ContextMenu;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvY29udGV4dC1tZW51LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsT0FBUSxPQUFBLENBQVEsVUFBUjs7RUFFVCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MscUJBQUMsUUFBRCxFQUFXLFVBQVg7QUFDWCxVQUFBO01BRHNCLElBQUMsQ0FBQSxhQUFEO01BQ3RCLFFBQUEsR0FBVyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsUUFBckI7TUFDWCxJQUFBLEdBQU8sSUFBSSxDQUFDLGlCQUFMLENBQXVCLFFBQXZCO01BQ1AsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsVUFBVSxDQUFDLGFBQXZCO0lBSFc7OzBCQVFiLG1CQUFBLEdBQXFCLFNBQUMsUUFBRDtBQUNuQixVQUFBO0FBQUE7V0FBQSwwQ0FBQTs7UUFDRSxJQUFHLElBQUksQ0FBQyxPQUFSOztZQUNFLElBQUksQ0FBQyxnQkFBaUI7O1VBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBbkIsR0FBb0M7VUFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixHQUFnQyxJQUFDLENBQUE7VUFDOUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsQ0FBQSxTQUFDLElBQUQ7cUJBQ0QsSUFBSSxDQUFDLEtBQUwsR0FBYSxTQUFBO3VCQUNYLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQXZCLENBQTJDLElBQUksQ0FBQyxPQUFoRCxFQUF5RCxLQUFDLENBQUEsVUFBMUQsRUFBc0UsSUFBSSxDQUFDLGFBQTNFO2NBRFc7WUFEWixDQUFBO1VBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFILENBQUksSUFBSixFQUpGO1NBQUEsTUFPSyxJQUFHLElBQUksQ0FBQyxPQUFSO1VBQ0gsSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQUksQ0FBQyxPQUExQixFQURHOztxQkFFTDtBQVZGOztJQURtQjs7Ozs7QUFadkIiLCJzb3VyY2VzQ29udGVudCI6WyJ7TWVudX0gPSByZXF1aXJlICdlbGVjdHJvbidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ29udGV4dE1lbnVcbiAgY29uc3RydWN0b3I6ICh0ZW1wbGF0ZSwgQGF0b21XaW5kb3cpIC0+XG4gICAgdGVtcGxhdGUgPSBAY3JlYXRlQ2xpY2tIYW5kbGVycyh0ZW1wbGF0ZSlcbiAgICBtZW51ID0gTWVudS5idWlsZEZyb21UZW1wbGF0ZSh0ZW1wbGF0ZSlcbiAgICBtZW51LnBvcHVwKEBhdG9tV2luZG93LmJyb3dzZXJXaW5kb3cpXG5cbiAgIyBJdCdzIG5lY2Vzc2FyeSB0byBidWlsZCB0aGUgZXZlbnQgaGFuZGxlcnMgaW4gdGhpcyBwcm9jZXNzLCBvdGhlcndpc2VcbiAgIyBjbG9zdXJlcyBhcmUgZHJhZ2dlZCBhY3Jvc3MgcHJvY2Vzc2VzIGFuZCBmYWlsZWQgdG8gYmUgZ2FyYmFnZSBjb2xsZWN0ZWRcbiAgIyBhcHByb3ByaWF0ZWx5LlxuICBjcmVhdGVDbGlja0hhbmRsZXJzOiAodGVtcGxhdGUpIC0+XG4gICAgZm9yIGl0ZW0gaW4gdGVtcGxhdGVcbiAgICAgIGlmIGl0ZW0uY29tbWFuZFxuICAgICAgICBpdGVtLmNvbW1hbmREZXRhaWwgPz0ge31cbiAgICAgICAgaXRlbS5jb21tYW5kRGV0YWlsLmNvbnRleHRDb21tYW5kID0gdHJ1ZVxuICAgICAgICBpdGVtLmNvbW1hbmREZXRhaWwuYXRvbVdpbmRvdyA9IEBhdG9tV2luZG93XG4gICAgICAgIGRvIChpdGVtKSA9PlxuICAgICAgICAgIGl0ZW0uY2xpY2sgPSA9PlxuICAgICAgICAgICAgZ2xvYmFsLmF0b21BcHBsaWNhdGlvbi5zZW5kQ29tbWFuZFRvV2luZG93KGl0ZW0uY29tbWFuZCwgQGF0b21XaW5kb3csIGl0ZW0uY29tbWFuZERldGFpbClcbiAgICAgIGVsc2UgaWYgaXRlbS5zdWJtZW51XG4gICAgICAgIEBjcmVhdGVDbGlja0hhbmRsZXJzKGl0ZW0uc3VibWVudSlcbiAgICAgIGl0ZW1cbiJdfQ==
