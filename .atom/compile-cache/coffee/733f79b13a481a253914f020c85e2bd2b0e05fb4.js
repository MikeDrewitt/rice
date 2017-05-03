(function() {
  var LaunchModeView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  LaunchModeView = (function(superClass) {
    extend(LaunchModeView, superClass);

    function LaunchModeView() {
      return LaunchModeView.__super__.constructor.apply(this, arguments);
    }

    LaunchModeView.prototype.initialize = function(arg) {
      var devMode, ref, safeMode;
      ref = arg != null ? arg : {}, safeMode = ref.safeMode, devMode = ref.devMode;
      this.classList.add('inline-block', 'icon', 'icon-color-mode');
      if (devMode) {
        this.classList.add('text-error');
        return this.tooltipDisposable = atom.tooltips.add(this, {
          title: 'This window is in dev mode'
        });
      } else if (safeMode) {
        this.classList.add('text-success');
        return this.tooltipDisposable = atom.tooltips.add(this, {
          title: 'This window is in safe mode'
        });
      }
    };

    LaunchModeView.prototype.detachedCallback = function() {
      var ref;
      return (ref = this.tooltipDisposable) != null ? ref.dispose() : void 0;
    };

    return LaunchModeView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar-launch-mode', {
    prototype: LaunchModeView.prototype,
    "extends": 'span'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9sYXVuY2gtbW9kZS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsY0FBQTtJQUFBOzs7RUFBTTs7Ozs7Ozs2QkFDSixVQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1YsVUFBQTswQkFEVyxNQUFvQixJQUFuQix5QkFBVTtNQUN0QixJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxjQUFmLEVBQStCLE1BQS9CLEVBQXVDLGlCQUF2QztNQUNBLElBQUcsT0FBSDtRQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLFlBQWY7ZUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQWxCLEVBQXdCO1VBQUEsS0FBQSxFQUFPLDRCQUFQO1NBQXhCLEVBRnZCO09BQUEsTUFHSyxJQUFHLFFBQUg7UUFDSCxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxjQUFmO2VBQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFsQixFQUF3QjtVQUFBLEtBQUEsRUFBTyw2QkFBUDtTQUF4QixFQUZsQjs7SUFMSzs7NkJBU1osZ0JBQUEsR0FBa0IsU0FBQTtBQUNoQixVQUFBO3lEQUFrQixDQUFFLE9BQXBCLENBQUE7SUFEZ0I7Ozs7S0FWUzs7RUFhN0IsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsd0JBQXpCLEVBQW1EO0lBQUEsU0FBQSxFQUFXLGNBQWMsQ0FBQyxTQUExQjtJQUFxQyxDQUFBLE9BQUEsQ0FBQSxFQUFTLE1BQTlDO0dBQW5EO0FBYmpCIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgTGF1bmNoTW9kZVZpZXcgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBpbml0aWFsaXplOiAoe3NhZmVNb2RlLCBkZXZNb2RlfT17fSkgLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJywgJ2ljb24nLCAnaWNvbi1jb2xvci1tb2RlJylcbiAgICBpZiBkZXZNb2RlXG4gICAgICBAY2xhc3NMaXN0LmFkZCgndGV4dC1lcnJvcicpXG4gICAgICBAdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCh0aGlzLCB0aXRsZTogJ1RoaXMgd2luZG93IGlzIGluIGRldiBtb2RlJylcbiAgICBlbHNlIGlmIHNhZmVNb2RlXG4gICAgICBAY2xhc3NMaXN0LmFkZCgndGV4dC1zdWNjZXNzJylcbiAgICAgIEB0b29sdGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkKHRoaXMsIHRpdGxlOiAnVGhpcyB3aW5kb3cgaXMgaW4gc2FmZSBtb2RlJylcblxuICBkZXRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEB0b29sdGlwRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdzdGF0dXMtYmFyLWxhdW5jaC1tb2RlJywgcHJvdG90eXBlOiBMYXVuY2hNb2RlVmlldy5wcm90b3R5cGUsIGV4dGVuZHM6ICdzcGFuJylcbiJdfQ==
