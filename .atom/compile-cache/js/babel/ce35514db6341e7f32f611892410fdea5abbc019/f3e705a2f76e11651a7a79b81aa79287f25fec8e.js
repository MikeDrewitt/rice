Object.defineProperty(exports, '__esModule', {
  value: true
});
/** @babel */

var _atom = require('atom');

var About = undefined;
var StatusBarView = undefined;

// The local storage key for the available update version.
var AvailableUpdateVersion = 'about:version-available';
var AboutURI = 'atom://about';

exports['default'] = {
  activate: function activate() {
    var _this = this;

    this.subscriptions = new _atom.CompositeDisposable();

    About = About || require('./about');
    this.model = new About({
      uri: AboutURI,
      currentVersion: atom.getVersion()
    });

    var availableVersion = window.localStorage.getItem(AvailableUpdateVersion);
    if (availableVersion === atom.getVersion()) {
      window.localStorage.removeItem(AvailableUpdateVersion);
    }

    if (atom.isReleasedVersion()) {
      this.subscriptions.add(atom.onUpdateAvailable(function (_ref) {
        var releaseVersion = _ref.releaseVersion;

        window.localStorage.setItem(AvailableUpdateVersion, releaseVersion);
        _this.showStatusBarIfNeeded();
      }));
    }
  },

  deactivate: function deactivate() {
    this.model.destroy();
    if (this.statusBarTile) this.statusBarTile.destroy();
  },

  consumeStatusBar: function consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    this.showStatusBarIfNeeded();
  },

  deserializeAboutView: function deserializeAboutView(state) {
    if (!this.model) {
      About = About || require('./about');
      this.model = new About({
        uri: AboutURI,
        currentVersion: atom.getVersion()
      });
    }

    return this.model.deserialize(state);
  },

  isUpdateAvailable: function isUpdateAvailable() {
    var availableVersion = window.localStorage.getItem(AvailableUpdateVersion);
    return availableVersion && availableVersion !== atom.getVersion();
  },

  showStatusBarIfNeeded: function showStatusBarIfNeeded() {
    if (this.isUpdateAvailable() && this.statusBar) {
      StatusBarView = StatusBarView || require('./components/about-status-bar');

      var statusBarView = new StatusBarView();

      if (this.statusBarTile) {
        this.statusBarTile.destroy();
      }

      this.statusBarTile = this.statusBar.addRightTile({
        item: statusBarView,
        priority: -100
      });

      return this.statusBarTile;
    }
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7b0JBRWtDLE1BQU07O0FBRXhDLElBQUksS0FBSyxZQUFBLENBQUE7QUFDVCxJQUFJLGFBQWEsWUFBQSxDQUFBOzs7QUFHakIsSUFBTSxzQkFBc0IsR0FBRyx5QkFBeUIsQ0FBQTtBQUN4RCxJQUFNLFFBQVEsR0FBRyxjQUFjLENBQUE7O3FCQUVoQjtBQUNiLFVBQVEsRUFBQyxvQkFBRzs7O0FBQ1YsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsU0FBSyxHQUFHLEtBQUssSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDbkMsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQztBQUNyQixTQUFHLEVBQUUsUUFBUTtBQUNiLG9CQUFjLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRTtLQUNsQyxDQUFDLENBQUE7O0FBRUYsUUFBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0FBQzFFLFFBQUksZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFO0FBQzFDLFlBQU0sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUE7S0FDdkQ7O0FBRUQsUUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtBQUM1QixVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBQyxJQUFnQixFQUFLO1lBQXBCLGNBQWMsR0FBZixJQUFnQixDQUFmLGNBQWM7O0FBQzVELGNBQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUFFLGNBQWMsQ0FBQyxDQUFBO0FBQ25FLGNBQUsscUJBQXFCLEVBQUUsQ0FBQTtPQUM3QixDQUFDLENBQUMsQ0FBQTtLQUNKO0dBQ0Y7O0FBRUQsWUFBVSxFQUFDLHNCQUFHO0FBQ1osUUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUNwQixRQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtHQUNyRDs7QUFFRCxrQkFBZ0IsRUFBQywwQkFBQyxTQUFTLEVBQUU7QUFDM0IsUUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7QUFDMUIsUUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUE7R0FDN0I7O0FBRUQsc0JBQW9CLEVBQUMsOEJBQUMsS0FBSyxFQUFFO0FBQzNCLFFBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ2YsV0FBSyxHQUFHLEtBQUssSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDbkMsVUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQztBQUNyQixXQUFHLEVBQUUsUUFBUTtBQUNiLHNCQUFjLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRTtPQUNsQyxDQUFDLENBQUE7S0FDSDs7QUFFRCxXQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQ3JDOztBQUVELG1CQUFpQixFQUFDLDZCQUFHO0FBQ25CLFFBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUMxRSxXQUFPLGdCQUFnQixJQUFJLGdCQUFnQixLQUFLLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtHQUNsRTs7QUFFRCx1QkFBcUIsRUFBQyxpQ0FBRztBQUN2QixRQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDOUMsbUJBQWEsR0FBRyxhQUFhLElBQUksT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUE7O0FBRXpFLFVBQUksYUFBYSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUE7O0FBRXZDLFVBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QixZQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQzdCOztBQUVELFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7QUFDL0MsWUFBSSxFQUFFLGFBQWE7QUFDbkIsZ0JBQVEsRUFBRSxDQUFDLEdBQUc7T0FDZixDQUFDLENBQUE7O0FBRUYsYUFBTyxJQUFJLENBQUMsYUFBYSxDQUFBO0tBQzFCO0dBQ0Y7Q0FDRiIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2Fib3V0L2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5cbmxldCBBYm91dFxubGV0IFN0YXR1c0JhclZpZXdcblxuLy8gVGhlIGxvY2FsIHN0b3JhZ2Uga2V5IGZvciB0aGUgYXZhaWxhYmxlIHVwZGF0ZSB2ZXJzaW9uLlxuY29uc3QgQXZhaWxhYmxlVXBkYXRlVmVyc2lvbiA9ICdhYm91dDp2ZXJzaW9uLWF2YWlsYWJsZSdcbmNvbnN0IEFib3V0VVJJID0gJ2F0b206Ly9hYm91dCdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBhY3RpdmF0ZSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgQWJvdXQgPSBBYm91dCB8fCByZXF1aXJlKCcuL2Fib3V0JylcbiAgICB0aGlzLm1vZGVsID0gbmV3IEFib3V0KHtcbiAgICAgIHVyaTogQWJvdXRVUkksXG4gICAgICBjdXJyZW50VmVyc2lvbjogYXRvbS5nZXRWZXJzaW9uKClcbiAgICB9KVxuXG4gICAgbGV0IGF2YWlsYWJsZVZlcnNpb24gPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oQXZhaWxhYmxlVXBkYXRlVmVyc2lvbilcbiAgICBpZiAoYXZhaWxhYmxlVmVyc2lvbiA9PT0gYXRvbS5nZXRWZXJzaW9uKCkpIHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShBdmFpbGFibGVVcGRhdGVWZXJzaW9uKVxuICAgIH1cblxuICAgIGlmIChhdG9tLmlzUmVsZWFzZWRWZXJzaW9uKCkpIHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5vblVwZGF0ZUF2YWlsYWJsZSgoe3JlbGVhc2VWZXJzaW9ufSkgPT4ge1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oQXZhaWxhYmxlVXBkYXRlVmVyc2lvbiwgcmVsZWFzZVZlcnNpb24pXG4gICAgICAgIHRoaXMuc2hvd1N0YXR1c0JhcklmTmVlZGVkKClcbiAgICAgIH0pKVxuICAgIH1cbiAgfSxcblxuICBkZWFjdGl2YXRlICgpIHtcbiAgICB0aGlzLm1vZGVsLmRlc3Ryb3koKVxuICAgIGlmICh0aGlzLnN0YXR1c0JhclRpbGUpIHRoaXMuc3RhdHVzQmFyVGlsZS5kZXN0cm95KClcbiAgfSxcblxuICBjb25zdW1lU3RhdHVzQmFyIChzdGF0dXNCYXIpIHtcbiAgICB0aGlzLnN0YXR1c0JhciA9IHN0YXR1c0JhclxuICAgIHRoaXMuc2hvd1N0YXR1c0JhcklmTmVlZGVkKClcbiAgfSxcblxuICBkZXNlcmlhbGl6ZUFib3V0VmlldyAoc3RhdGUpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwpIHtcbiAgICAgIEFib3V0ID0gQWJvdXQgfHwgcmVxdWlyZSgnLi9hYm91dCcpXG4gICAgICB0aGlzLm1vZGVsID0gbmV3IEFib3V0KHtcbiAgICAgICAgdXJpOiBBYm91dFVSSSxcbiAgICAgICAgY3VycmVudFZlcnNpb246IGF0b20uZ2V0VmVyc2lvbigpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1vZGVsLmRlc2VyaWFsaXplKHN0YXRlKVxuICB9LFxuXG4gIGlzVXBkYXRlQXZhaWxhYmxlICgpIHtcbiAgICBsZXQgYXZhaWxhYmxlVmVyc2lvbiA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShBdmFpbGFibGVVcGRhdGVWZXJzaW9uKVxuICAgIHJldHVybiBhdmFpbGFibGVWZXJzaW9uICYmIGF2YWlsYWJsZVZlcnNpb24gIT09IGF0b20uZ2V0VmVyc2lvbigpXG4gIH0sXG5cbiAgc2hvd1N0YXR1c0JhcklmTmVlZGVkICgpIHtcbiAgICBpZiAodGhpcy5pc1VwZGF0ZUF2YWlsYWJsZSgpICYmIHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICBTdGF0dXNCYXJWaWV3ID0gU3RhdHVzQmFyVmlldyB8fCByZXF1aXJlKCcuL2NvbXBvbmVudHMvYWJvdXQtc3RhdHVzLWJhcicpXG5cbiAgICAgIGxldCBzdGF0dXNCYXJWaWV3ID0gbmV3IFN0YXR1c0JhclZpZXcoKVxuXG4gICAgICBpZiAodGhpcy5zdGF0dXNCYXJUaWxlKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyVGlsZS5kZXN0cm95KClcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGF0dXNCYXJUaWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcbiAgICAgICAgaXRlbTogc3RhdHVzQmFyVmlldyxcbiAgICAgICAgcHJpb3JpdHk6IC0xMDBcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0JhclRpbGVcbiAgICB9XG4gIH1cbn1cbiJdfQ==