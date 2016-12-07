(function() {
  var CompileToolsErrorView, View,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  module.exports = CompileToolsErrorView = (function(superClass) {
    extend(CompileToolsErrorView, superClass);

    function CompileToolsErrorView() {
      return CompileToolsErrorView.__super__.constructor.apply(this, arguments);
    }

    CompileToolsErrorView.content = function() {
      return this.div((function(_this) {
        return function() {
          _this.div({
            "class": 'icon icon-alert compile-tools-heading compile-tools-message'
          }, 'Compiler tools not found');
          _this.div({
            "class": 'compile-tools-message'
          }, 'Packages that depend on modules that contain C/C++ code will fail to install.');
          _this.div({
            "class": 'compile-tools-message'
          }, function() {
            _this.span('Read ');
            _this.a({
              "class": 'link',
              href: 'https://atom.io/docs/latest/build-instructions/windows'
            }, 'here');
            return _this.span(' for instructions on installing Python and Visual Studio.');
          });
          return _this.div({
            "class": 'compile-tools-message'
          }, function() {
            _this.span('Run ');
            _this.code({
              "class": 'alert-danger'
            }, 'apm install --check');
            return _this.span(' after installing to test compiling a native module.');
          });
        };
      })(this));
    };

    CompileToolsErrorView.prototype.initialize = function(error) {};

    return CompileToolsErrorView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9jb21waWxlLXRvb2xzLWVycm9yLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyQkFBQTtJQUFBOzs7RUFBQyxPQUFRLE9BQUEsQ0FBUSxzQkFBUjs7RUFFVCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0oscUJBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUssQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0gsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkRBQVA7V0FBTCxFQUEyRSwwQkFBM0U7VUFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtXQUFMLEVBQXFDLCtFQUFyQztVQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVCQUFQO1dBQUwsRUFBcUMsU0FBQTtZQUNuQyxLQUFDLENBQUEsSUFBRCxDQUFNLE9BQU47WUFDQSxLQUFDLENBQUEsQ0FBRCxDQUFHO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxNQUFQO2NBQWUsSUFBQSxFQUFNLHdEQUFyQjthQUFILEVBQWtGLE1BQWxGO21CQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sMkRBQU47VUFIbUMsQ0FBckM7aUJBSUEsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQVA7V0FBTCxFQUFxQyxTQUFBO1lBQ25DLEtBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtZQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7YUFBTixFQUE2QixxQkFBN0I7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxzREFBTjtVQUhtQyxDQUFyQztRQVBHO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFMO0lBRFE7O29DQWFWLFVBQUEsR0FBWSxTQUFDLEtBQUQsR0FBQTs7OztLQWRzQjtBQUhwQyIsInNvdXJjZXNDb250ZW50IjpbIntWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb21waWxlVG9vbHNFcnJvclZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdpY29uIGljb24tYWxlcnQgY29tcGlsZS10b29scy1oZWFkaW5nIGNvbXBpbGUtdG9vbHMtbWVzc2FnZScsICdDb21waWxlciB0b29scyBub3QgZm91bmQnXG4gICAgICBAZGl2IGNsYXNzOiAnY29tcGlsZS10b29scy1tZXNzYWdlJywgJ1BhY2thZ2VzIHRoYXQgZGVwZW5kIG9uIG1vZHVsZXMgdGhhdCBjb250YWluIEMvQysrIGNvZGUgd2lsbCBmYWlsIHRvIGluc3RhbGwuJ1xuICAgICAgQGRpdiBjbGFzczogJ2NvbXBpbGUtdG9vbHMtbWVzc2FnZScsID0+XG4gICAgICAgIEBzcGFuICdSZWFkICdcbiAgICAgICAgQGEgY2xhc3M6ICdsaW5rJywgaHJlZjogJ2h0dHBzOi8vYXRvbS5pby9kb2NzL2xhdGVzdC9idWlsZC1pbnN0cnVjdGlvbnMvd2luZG93cycsICdoZXJlJ1xuICAgICAgICBAc3BhbiAnIGZvciBpbnN0cnVjdGlvbnMgb24gaW5zdGFsbGluZyBQeXRob24gYW5kIFZpc3VhbCBTdHVkaW8uJ1xuICAgICAgQGRpdiBjbGFzczogJ2NvbXBpbGUtdG9vbHMtbWVzc2FnZScsID0+XG4gICAgICAgIEBzcGFuICdSdW4gJ1xuICAgICAgICBAY29kZSBjbGFzczogJ2FsZXJ0LWRhbmdlcicsICdhcG0gaW5zdGFsbCAtLWNoZWNrJ1xuICAgICAgICBAc3BhbiAnIGFmdGVyIGluc3RhbGxpbmcgdG8gdGVzdCBjb21waWxpbmcgYSBuYXRpdmUgbW9kdWxlLidcblxuICBpbml0aWFsaXplOiAoZXJyb3IpIC0+XG4iXX0=
