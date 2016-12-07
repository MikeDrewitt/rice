(function() {
  var CachePanelView, Disposable, PackagePanelView, ScrollView, TimecopView, WindowPanelView, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  Disposable = require('atom').Disposable;

  ScrollView = require('atom-space-pen-views').ScrollView;

  CachePanelView = require('./cache-panel-view');

  PackagePanelView = require('./package-panel-view');

  WindowPanelView = require('./window-panel-view');

  module.exports = TimecopView = (function(superClass) {
    extend(TimecopView, superClass);

    function TimecopView() {
      return TimecopView.__super__.constructor.apply(this, arguments);
    }

    TimecopView.content = function() {
      return this.div({
        "class": 'timecop pane-item native-key-bindings',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'timecop-panel'
          }, function() {
            _this.div({
              "class": 'panels'
            }, function() {
              _this.subview('windowLoadingPanel', new WindowPanelView());
              return _this.subview('cacheLoadingPanel', new CachePanelView());
            });
            return _this.div({
              "class": 'panels'
            }, function() {
              _this.subview('packageLoadingPanel', new PackagePanelView('Package Loading'));
              _this.subview('packageActivationPanel', new PackagePanelView('Package Activation'));
              _this.subview('themeLoadingPanel', new PackagePanelView('Theme Loading'));
              return _this.subview('themeActivationPanel', new PackagePanelView('Theme Activation'));
            });
          });
        };
      })(this));
    };

    TimecopView.prototype.onDidChangeTitle = function() {
      return new Disposable(function() {});
    };

    TimecopView.prototype.onDidChangeModified = function() {
      return new Disposable(function() {});
    };

    TimecopView.prototype.initialize = function(arg) {
      this.uri = arg.uri;
      if (atom.packages.getActivePackages().length > 0) {
        return this.populateViews();
      } else {
        return setImmediate((function(_this) {
          return function() {
            return _this.populateViews();
          };
        })(this));
      }
    };

    TimecopView.prototype.populateViews = function() {
      this.windowLoadingPanel.populate();
      this.cacheLoadingPanel.populate();
      this.showLoadedPackages();
      this.showActivePackages();
      this.showLoadedThemes();
      return this.showActiveThemes();
    };

    TimecopView.prototype.getSlowPackages = function(packages, timeKey) {
      var count, time;
      time = 0;
      count = 0;
      packages = packages.filter(function(pack) {
        time += pack[timeKey];
        count++;
        return pack[timeKey] > 5;
      });
      packages.sort(function(pack1, pack2) {
        return pack2[timeKey] - pack1[timeKey];
      });
      return {
        time: time,
        count: count,
        packages: packages
      };
    };

    TimecopView.prototype.showLoadedPackages = function() {
      var count, packages, ref, time;
      packages = atom.packages.getLoadedPackages().filter(function(pack) {
        return pack.getType() !== 'theme';
      });
      ref = this.getSlowPackages(packages, 'loadTime'), time = ref.time, count = ref.count, packages = ref.packages;
      this.packageLoadingPanel.addPackages(packages, 'loadTime');
      return this.packageLoadingPanel.summary.text("Loaded " + count + " packages in " + time + "ms.\n" + (_.pluralize(packages.length, 'package')) + " took longer than 5ms to load.");
    };

    TimecopView.prototype.showActivePackages = function() {
      var count, packages, ref, time;
      packages = atom.packages.getActivePackages().filter(function(pack) {
        return pack.getType() !== 'theme';
      });
      ref = this.getSlowPackages(packages, 'activateTime'), time = ref.time, count = ref.count, packages = ref.packages;
      this.packageActivationPanel.addPackages(packages, 'activateTime');
      return this.packageActivationPanel.summary.text("Activated " + count + " packages in " + time + "ms.\n" + (_.pluralize(packages.length, 'package')) + " took longer than 5ms to activate.");
    };

    TimecopView.prototype.showLoadedThemes = function() {
      var count, packages, ref, time;
      ref = this.getSlowPackages(atom.themes.getLoadedThemes(), 'loadTime'), time = ref.time, count = ref.count, packages = ref.packages;
      this.themeLoadingPanel.addPackages(packages, 'loadTime');
      return this.themeLoadingPanel.summary.text("Loaded " + count + " themes in " + time + "ms.\n" + (_.pluralize(packages.length, 'theme')) + " took longer than 5ms to load.");
    };

    TimecopView.prototype.showActiveThemes = function() {
      var count, packages, ref, time;
      ref = this.getSlowPackages(atom.themes.getActiveThemes(), 'activateTime'), time = ref.time, count = ref.count, packages = ref.packages;
      this.themeActivationPanel.addPackages(packages, 'activateTime');
      return this.themeActivationPanel.summary.text("Activated " + count + " themes in " + time + "ms.\n" + (_.pluralize(packages.length, 'theme')) + " took longer than 5ms to activate.");
    };

    TimecopView.prototype.serialize = function() {
      return {
        deserializer: this.constructor.name,
        uri: this.getURI()
      };
    };

    TimecopView.prototype.getURI = function() {
      return this.uri;
    };

    TimecopView.prototype.getTitle = function() {
      return 'Timecop';
    };

    TimecopView.prototype.getIconName = function() {
      return 'dashboard';
    };

    return TimecopView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90aW1lY29wL2xpYi90aW1lY29wLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5RkFBQTtJQUFBOzs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILGFBQWMsT0FBQSxDQUFRLE1BQVI7O0VBQ2QsYUFBYyxPQUFBLENBQVEsc0JBQVI7O0VBQ2YsY0FBQSxHQUFpQixPQUFBLENBQVEsb0JBQVI7O0VBQ2pCLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxzQkFBUjs7RUFDbkIsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixXQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1Q0FBUDtRQUFnRCxRQUFBLEVBQVUsQ0FBQyxDQUEzRDtPQUFMLEVBQW1FLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDakUsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtXQUFMLEVBQTZCLFNBQUE7WUFDM0IsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDthQUFMLEVBQXNCLFNBQUE7Y0FDcEIsS0FBQyxDQUFBLE9BQUQsQ0FBUyxvQkFBVCxFQUFtQyxJQUFBLGVBQUEsQ0FBQSxDQUFuQztxQkFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULEVBQWtDLElBQUEsY0FBQSxDQUFBLENBQWxDO1lBRm9CLENBQXRCO21CQUdBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxF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QUhnQjs7MEJBUWxCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLE1BQTBCLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBWixDQUFBLENBQWpCLEVBQWdELGNBQWhELENBQTFCLEVBQUMsZUFBRCxFQUFPLGlCQUFQLEVBQWM7TUFDZCxJQUFDLENBQUEsb0JBQW9CLENBQUMsV0FBdEIsQ0FBa0MsUUFBbEMsRUFBNEMsY0FBNUM7YUFDQSxJQUFDLENBQUEsb0JBQW9CLENBQUMsT0FBTyxDQUFDLElBQTlCLENBQW1DLFlBQUEsR0FDckIsS0FEcUIsR0FDZixhQURlLEdBQ0YsSUFERSxHQUNHLE9BREgsR0FFaEMsQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLFFBQVEsQ0FBQyxNQUFyQixFQUE2QixPQUE3QixDQUFELENBRmdDLEdBRU8sb0NBRjFDO0lBSGdCOzswQkFRbEIsU0FBQSxHQUFXLFNBQUE7YUFDVDtRQUFBLFlBQUEsRUFBYyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQTNCO1FBQ0EsR0FBQSxFQUFLLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FETDs7SUFEUzs7MEJBSVgsTUFBQSxHQUFRLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7MEJBRVIsUUFBQSxHQUFVLFNBQUE7YUFBRztJQUFIOzswQkFFVixXQUFBLEdBQWEsU0FBQTthQUFHO0lBQUg7Ozs7S0FyRlc7QUFSMUIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuQ2FjaGVQYW5lbFZpZXcgPSByZXF1aXJlICcuL2NhY2hlLXBhbmVsLXZpZXcnXG5QYWNrYWdlUGFuZWxWaWV3ID0gcmVxdWlyZSAnLi9wYWNrYWdlLXBhbmVsLXZpZXcnXG5XaW5kb3dQYW5lbFZpZXcgPSByZXF1aXJlICcuL3dpbmRvdy1wYW5lbC12aWV3J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUaW1lY29wVmlldyBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3RpbWVjb3AgcGFuZS1pdGVtIG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICBAZGl2IGNsYXNzOiAndGltZWNvcC1wYW5lbCcsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbHMnLCA9PlxuICAgICAgICAgIEBzdWJ2aWV3ICd3aW5kb3dMb2FkaW5nUGFuZWwnLCBuZXcgV2luZG93UGFuZWxWaWV3KClcbiAgICAgICAgICBAc3VidmlldyAnY2FjaGVMb2FkaW5nUGFuZWwnLCBuZXcgQ2FjaGVQYW5lbFZpZXcoKVxuICAgICAgICBAZGl2IGNsYXNzOiAncGFuZWxzJywgPT5cbiAgICAgICAgICBAc3VidmlldyAncGFja2FnZUxvYWRpbmdQYW5lbCcsIG5ldyBQYWNrYWdlUGFuZWxWaWV3KCdQYWNrYWdlIExvYWRpbmcnKVxuICAgICAgICAgIEBzdWJ2aWV3ICdwYWNrYWdlQWN0aXZhdGlvblBhbmVsJywgbmV3IFBhY2thZ2VQYW5lbFZpZXcoJ1BhY2thZ2UgQWN0aXZhdGlvbicpXG4gICAgICAgICAgQHN1YnZpZXcgJ3RoZW1lTG9hZGluZ1BhbmVsJywgbmV3IFBhY2thZ2VQYW5lbFZpZXcoJ1RoZW1lIExvYWRpbmcnKVxuICAgICAgICAgIEBzdWJ2aWV3ICd0aGVtZUFjdGl2YXRpb25QYW5lbCcsIG5ldyBQYWNrYWdlUGFuZWxWaWV3KCdUaGVtZSBBY3RpdmF0aW9uJylcblxuICBvbkRpZENoYW5nZVRpdGxlOiAtPiBuZXcgRGlzcG9zYWJsZSAtPlxuICBvbkRpZENoYW5nZU1vZGlmaWVkOiAtPiBuZXcgRGlzcG9zYWJsZSAtPlxuXG4gIGluaXRpYWxpemU6ICh7QHVyaX0pIC0+XG4gICAgaWYgYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlcygpLmxlbmd0aCA+IDBcbiAgICAgIEBwb3B1bGF0ZVZpZXdzKClcbiAgICBlbHNlXG4gICAgICAjIFJlbmRlciBvbiBuZXh0IHRpY2sgc28gcGFja2FnZXMgaGF2ZSBiZWVuIGFjdGl2YXRlZFxuICAgICAgc2V0SW1tZWRpYXRlID0+IEBwb3B1bGF0ZVZpZXdzKClcblxuICBwb3B1bGF0ZVZpZXdzOiAtPlxuICAgIEB3aW5kb3dMb2FkaW5nUGFuZWwucG9wdWxhdGUoKVxuICAgIEBjYWNoZUxvYWRpbmdQYW5lbC5wb3B1bGF0ZSgpXG4gICAgQHNob3dMb2FkZWRQYWNrYWdlcygpXG4gICAgQHNob3dBY3RpdmVQYWNrYWdlcygpXG4gICAgQHNob3dMb2FkZWRUaGVtZXMoKVxuICAgIEBzaG93QWN0aXZlVGhlbWVzKClcblxuICBnZXRTbG93UGFja2FnZXM6IChwYWNrYWdlcywgdGltZUtleSkgLT5cbiAgICB0aW1lID0gMFxuICAgIGNvdW50ID0gMFxuICAgIHBhY2thZ2VzID0gcGFja2FnZXMuZmlsdGVyIChwYWNrKSAtPlxuICAgICAgdGltZSArPSBwYWNrW3RpbWVLZXldXG4gICAgICBjb3VudCsrXG4gICAgICBwYWNrW3RpbWVLZXldID4gNVxuICAgIHBhY2thZ2VzLnNvcnQgKHBhY2sxLCBwYWNrMikgLT4gcGFjazJbdGltZUtleV0gLSBwYWNrMVt0aW1lS2V5XVxuICAgIHt0aW1lLCBjb3VudCwgcGFja2FnZXN9XG5cbiAgc2hvd0xvYWRlZFBhY2thZ2VzOiAtPlxuICAgIHBhY2thZ2VzID0gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlcygpLmZpbHRlciAocGFjaykgLT5cbiAgICAgIHBhY2suZ2V0VHlwZSgpIGlzbnQgJ3RoZW1lJ1xuICAgIHt0aW1lLCBjb3VudCwgcGFja2FnZXN9ID0gQGdldFNsb3dQYWNrYWdlcyhwYWNrYWdlcywgJ2xvYWRUaW1lJylcbiAgICBAcGFja2FnZUxvYWRpbmdQYW5lbC5hZGRQYWNrYWdlcyhwYWNrYWdlcywgJ2xvYWRUaW1lJylcbiAgICBAcGFja2FnZUxvYWRpbmdQYW5lbC5zdW1tYXJ5LnRleHQgXCJcIlwiXG4gICAgICBMb2FkZWQgI3tjb3VudH0gcGFja2FnZXMgaW4gI3t0aW1lfW1zLlxuICAgICAgI3tfLnBsdXJhbGl6ZShwYWNrYWdlcy5sZW5ndGgsICdwYWNrYWdlJyl9IHRvb2sgbG9uZ2VyIHRoYW4gNW1zIHRvIGxvYWQuXG4gICAgXCJcIlwiXG5cbiAgc2hvd0FjdGl2ZVBhY2thZ2VzOiAtPlxuICAgIHBhY2thZ2VzID0gYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlcygpLmZpbHRlciAocGFjaykgLT5cbiAgICAgIHBhY2suZ2V0VHlwZSgpIGlzbnQgJ3RoZW1lJ1xuICAgIHt0aW1lLCBjb3VudCwgcGFja2FnZXN9ID0gQGdldFNsb3dQYWNrYWdlcyhwYWNrYWdlcywgJ2FjdGl2YXRlVGltZScpXG4gICAgQHBhY2thZ2VBY3RpdmF0aW9uUGFuZWwuYWRkUGFja2FnZXMocGFja2FnZXMsICdhY3RpdmF0ZVRpbWUnKVxuICAgIEBwYWNrYWdlQWN0aXZhdGlvblBhbmVsLnN1bW1hcnkudGV4dCBcIlwiXCJcbiAgICAgIEFjdGl2YXRlZCAje2NvdW50fSBwYWNrYWdlcyBpbiAje3RpbWV9bXMuXG4gICAgICAje18ucGx1cmFsaXplKHBhY2thZ2VzLmxlbmd0aCwgJ3BhY2thZ2UnKX0gdG9vayBsb25nZXIgdGhhbiA1bXMgdG8gYWN0aXZhdGUuXG4gICAgXCJcIlwiXG5cbiAgc2hvd0xvYWRlZFRoZW1lczogLT5cbiAgICB7dGltZSwgY291bnQsIHBhY2thZ2VzfSA9IEBnZXRTbG93UGFja2FnZXMoYXRvbS50aGVtZXMuZ2V0TG9hZGVkVGhlbWVzKCksICdsb2FkVGltZScpXG4gICAgQHRoZW1lTG9hZGluZ1BhbmVsLmFkZFBhY2thZ2VzKHBhY2thZ2VzLCAnbG9hZFRpbWUnKVxuICAgIEB0aGVtZUxvYWRpbmdQYW5lbC5zdW1tYXJ5LnRleHQgXCJcIlwiXG4gICAgICBMb2FkZWQgI3tjb3VudH0gdGhlbWVzIGluICN7dGltZX1tcy5cbiAgICAgICN7Xy5wbHVyYWxpemUocGFja2FnZXMubGVuZ3RoLCAndGhlbWUnKX0gdG9vayBsb25nZXIgdGhhbiA1bXMgdG8gbG9hZC5cbiAgICBcIlwiXCJcblxuICBzaG93QWN0aXZlVGhlbWVzOiAtPlxuICAgIHt0aW1lLCBjb3VudCwgcGFja2FnZXN9ID0gQGdldFNsb3dQYWNrYWdlcyhhdG9tLnRoZW1lcy5nZXRBY3RpdmVUaGVtZXMoKSwgJ2FjdGl2YXRlVGltZScpXG4gICAgQHRoZW1lQWN0aXZhdGlvblBhbmVsLmFkZFBhY2thZ2VzKHBhY2thZ2VzLCAnYWN0aXZhdGVUaW1lJylcbiAgICBAdGhlbWVBY3RpdmF0aW9uUGFuZWwuc3VtbWFyeS50ZXh0IFwiXCJcIlxuICAgICAgQWN0aXZhdGVkICN7Y291bnR9IHRoZW1lcyBpbiAje3RpbWV9bXMuXG4gICAgICAje18ucGx1cmFsaXplKHBhY2thZ2VzLmxlbmd0aCwgJ3RoZW1lJyl9IHRvb2sgbG9uZ2VyIHRoYW4gNW1zIHRvIGFjdGl2YXRlLlxuICAgIFwiXCJcIlxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkZXNlcmlhbGl6ZXI6IEBjb25zdHJ1Y3Rvci5uYW1lXG4gICAgdXJpOiBAZ2V0VVJJKClcblxuICBnZXRVUkk6IC0+IEB1cmlcblxuICBnZXRUaXRsZTogLT4gJ1RpbWVjb3AnXG5cbiAgZ2V0SWNvbk5hbWU6IC0+ICdkYXNoYm9hcmQnXG4iXX0=
