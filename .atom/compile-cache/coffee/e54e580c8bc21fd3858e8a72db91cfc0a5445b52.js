(function() {
  var CompileToolsErrorView, ErrorView, View,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  CompileToolsErrorView = require('./compile-tools-error-view');

  module.exports = ErrorView = (function(superClass) {
    extend(ErrorView, superClass);

    function ErrorView() {
      return ErrorView.__super__.constructor.apply(this, arguments);
    }

    ErrorView.content = function() {
      return this.div({
        "class": 'error-message'
      }, (function(_this) {
        return function() {
          return _this.div({
            outlet: 'alert',
            "class": 'alert alert-danger alert-dismissable native-key-bindings',
            tabindex: -1
          }, function() {
            _this.button({
              outlet: 'close',
              "class": 'close icon icon-x'
            });
            _this.span({
              outlet: 'message',
              "class": 'native-key-bindings'
            });
            _this.a({
              outlet: 'detailsLink',
              "class": 'alert-link error-link'
            }, 'Show output\u2026');
            return _this.div({
              outlet: 'detailsArea',
              "class": 'padded'
            }, function() {
              return _this.pre({
                outlet: 'details',
                "class": 'error-details text'
              });
            });
          });
        };
      })(this));
    };

    ErrorView.prototype.initialize = function(packageManager, arg) {
      var message, packageInstallError, stderr;
      this.packageManager = packageManager;
      message = arg.message, stderr = arg.stderr, packageInstallError = arg.packageInstallError;
      this.message.text(message);
      this.detailsArea.hide();
      this.details.text(stderr);
      this.detailsLink.on('click', (function(_this) {
        return function() {
          if (_this.detailsArea.isHidden()) {
            _this.detailsArea.show();
            _this.detailsLink.text('Hide output\u2026');
          } else {
            _this.detailsArea.hide();
            _this.detailsLink.text('Show output\u2026');
          }
          return false;
        };
      })(this));
      this.close.on('click', (function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
      if (packageInstallError) {
        return this.checkForNativeBuildTools();
      }
    };

    ErrorView.prototype.checkForNativeBuildTools = function() {
      if (process.platform !== 'win32') {
        return;
      }
      return this.packageManager.checkNativeBuildTools()["catch"]((function(_this) {
        return function(error) {
          return _this.alert.append(new CompileToolsErrorView(error));
        };
      })(this));
    };

    return ErrorView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9lcnJvci12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsc0NBQUE7SUFBQTs7O0VBQUMsT0FBUSxPQUFBLENBQVEsc0JBQVI7O0VBQ1QscUJBQUEsR0FBd0IsT0FBQSxDQUFRLDRCQUFSOztFQUV4QixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osU0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtPQUFMLEVBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDM0IsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLE1BQUEsRUFBUSxPQUFSO1lBQWlCLENBQUEsS0FBQSxDQUFBLEVBQU8sMERBQXhCO1lBQW9GLFFBQUEsRUFBVSxDQUFDLENBQS9GO1dBQUwsRUFBdUcsU0FBQTtZQUNyRyxLQUFDLENBQUEsTUFBRCxDQUFRO2NBQUEsTUFBQSxFQUFRLE9BQVI7Y0FBaUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBeEI7YUFBUjtZQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07Y0FBQSxNQUFBLEVBQVEsU0FBUjtjQUFtQixDQUFBLEtBQUEsQ0FBQSxFQUFPLHFCQUExQjthQUFOO1lBQ0EsS0FBQyxDQUFBLENBQUQsQ0FBRztjQUFBLE1BQUEsRUFBUSxhQUFSO2NBQXVCLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQTlCO2FBQUgsRUFBMEQsbUJBQTFEO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxNQUFBLEVBQVEsYUFBUjtjQUF1QixDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQTlCO2FBQUwsRUFBNkMsU0FBQTtxQkFDM0MsS0FBQyxDQUFBLEdBQUQsQ0FBSztnQkFBQSxNQUFBLEVBQVEsU0FBUjtnQkFBbUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQkFBMUI7ZUFBTDtZQUQyQyxDQUE3QztVQUpxRyxDQUF2RztRQUQyQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7SUFEUTs7d0JBU1YsVUFBQSxHQUFZLFNBQUMsY0FBRCxFQUFrQixHQUFsQjtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsaUJBQUQ7TUFBa0IsdUJBQVMscUJBQVE7TUFDOUMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsT0FBZDtNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFBO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsTUFBZDtNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsRUFBYixDQUFnQixPQUFoQixFQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDdkIsSUFBRyxLQUFDLENBQUEsV0FBVyxDQUFDLFFBQWIsQ0FBQSxDQUFIO1lBQ0UsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQUE7WUFDQSxLQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsbUJBQWxCLEVBRkY7V0FBQSxNQUFBO1lBSUUsS0FBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQUE7WUFDQSxLQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsbUJBQWxCLEVBTEY7O2lCQU9BO1FBUnVCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QjtNQVVBLElBQUMsQ0FBQSxLQUFLLENBQUMsRUFBUCxDQUFVLE9BQVYsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxNQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkI7TUFDQSxJQUErQixtQkFBL0I7ZUFBQSxJQUFDLENBQUEsd0JBQUQsQ0FBQSxFQUFBOztJQWpCVTs7d0JBb0JaLHdCQUFBLEdBQTBCLFNBQUE7TUFDeEIsSUFBYyxPQUFPLENBQUMsUUFBUixLQUFvQixPQUFsQztBQUFBLGVBQUE7O2FBRUEsSUFBQyxDQUFBLGNBQWMsQ0FBQyxxQkFBaEIsQ0FBQSxDQUF1QyxFQUFDLEtBQUQsRUFBdkMsQ0FBOEMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7aUJBQzVDLEtBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFrQixJQUFBLHFCQUFBLENBQXNCLEtBQXRCLENBQWxCO1FBRDRDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE5QztJQUh3Qjs7OztLQTlCSjtBQUp4QiIsInNvdXJjZXNDb250ZW50IjpbIntWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuQ29tcGlsZVRvb2xzRXJyb3JWaWV3ID0gcmVxdWlyZSAnLi9jb21waWxlLXRvb2xzLWVycm9yLXZpZXcnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEVycm9yVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ2Vycm9yLW1lc3NhZ2UnLCA9PlxuICAgICAgQGRpdiBvdXRsZXQ6ICdhbGVydCcsIGNsYXNzOiAnYWxlcnQgYWxlcnQtZGFuZ2VyIGFsZXJ0LWRpc21pc3NhYmxlIG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICAgIEBidXR0b24gb3V0bGV0OiAnY2xvc2UnLCBjbGFzczogJ2Nsb3NlIGljb24gaWNvbi14J1xuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdtZXNzYWdlJywgY2xhc3M6ICduYXRpdmUta2V5LWJpbmRpbmdzJ1xuICAgICAgICBAYSBvdXRsZXQ6ICdkZXRhaWxzTGluaycsIGNsYXNzOiAnYWxlcnQtbGluayBlcnJvci1saW5rJywgJ1Nob3cgb3V0cHV0XFx1MjAyNidcbiAgICAgICAgQGRpdiBvdXRsZXQ6ICdkZXRhaWxzQXJlYScsIGNsYXNzOiAncGFkZGVkJywgPT5cbiAgICAgICAgICBAcHJlIG91dGxldDogJ2RldGFpbHMnLCBjbGFzczogJ2Vycm9yLWRldGFpbHMgdGV4dCdcblxuICBpbml0aWFsaXplOiAoQHBhY2thZ2VNYW5hZ2VyLCB7bWVzc2FnZSwgc3RkZXJyLCBwYWNrYWdlSW5zdGFsbEVycm9yfSkgLT5cbiAgICBAbWVzc2FnZS50ZXh0KG1lc3NhZ2UpXG5cbiAgICBAZGV0YWlsc0FyZWEuaGlkZSgpXG4gICAgQGRldGFpbHMudGV4dChzdGRlcnIpXG5cbiAgICBAZGV0YWlsc0xpbmsub24gJ2NsaWNrJywgPT5cbiAgICAgIGlmIEBkZXRhaWxzQXJlYS5pc0hpZGRlbigpXG4gICAgICAgIEBkZXRhaWxzQXJlYS5zaG93KClcbiAgICAgICAgQGRldGFpbHNMaW5rLnRleHQoJ0hpZGUgb3V0cHV0XFx1MjAyNicpXG4gICAgICBlbHNlXG4gICAgICAgIEBkZXRhaWxzQXJlYS5oaWRlKClcbiAgICAgICAgQGRldGFpbHNMaW5rLnRleHQoJ1Nob3cgb3V0cHV0XFx1MjAyNicpXG5cbiAgICAgIGZhbHNlXG5cbiAgICBAY2xvc2Uub24gJ2NsaWNrJywgPT4gQHJlbW92ZSgpXG4gICAgQGNoZWNrRm9yTmF0aXZlQnVpbGRUb29scygpIGlmIHBhY2thZ2VJbnN0YWxsRXJyb3JcblxuICAjIENoZWNrIGZvciBuYXRpdmUgYnVpbGQgdG9vbHMgYW5kIHNob3cgd2FybmluZyBpZiBtaXNzaW5nLlxuICBjaGVja0Zvck5hdGl2ZUJ1aWxkVG9vbHM6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcblxuICAgIEBwYWNrYWdlTWFuYWdlci5jaGVja05hdGl2ZUJ1aWxkVG9vbHMoKS5jYXRjaCAoZXJyb3IpID0+XG4gICAgICBAYWxlcnQuYXBwZW5kKG5ldyBDb21waWxlVG9vbHNFcnJvclZpZXcoZXJyb3IpKVxuIl19
