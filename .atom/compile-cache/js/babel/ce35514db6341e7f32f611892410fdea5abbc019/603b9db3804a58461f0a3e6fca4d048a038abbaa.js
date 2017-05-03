Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _atom = require('atom');

// Deferred requires
var shell = undefined;
var AboutView = undefined;
var UpdateManager = undefined;

var About = (function () {
  function About(initialState) {
    var _this = this;

    _classCallCheck(this, About);

    this.subscriptions = new _atom.CompositeDisposable();
    this.emitter = new _atom.Emitter();

    this.state = initialState;
    this.views = {
      aboutView: null
    };

    this.subscriptions.add(atom.workspace.addOpener(function (uriToOpen) {
      if (uriToOpen === _this.state.uri) {
        return _this.deserialize();
      }
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', 'about:view-release-notes', function () {
      shell = shell || require('electron').shell;
      shell.openExternal(_this.getUpdateManager().getReleaseNotesURLForCurrentVersion());
    }));
  }

  _createClass(About, [{
    key: 'destroy',
    value: function destroy() {
      if (this.views.aboutView) this.views.aboutView.destroy();
      this.views.aboutView = null;

      if (this.state.updateManager) this.state.updateManager.dispose();
      this.setState({ updateManager: null });

      this.subscriptions.dispose();
    }
  }, {
    key: 'setState',
    value: function setState(newState) {
      if (newState && typeof newState === 'object') {
        var state = this.state;

        this.state = Object.assign({}, state, newState);

        this.didChange();
      }
    }
  }, {
    key: 'didChange',
    value: function didChange() {
      this.emitter.emit('did-change');
    }
  }, {
    key: 'onDidChange',
    value: function onDidChange(callback) {
      this.emitter.on('did-change', callback);
    }
  }, {
    key: 'getUpdateManager',
    value: function getUpdateManager() {
      UpdateManager = UpdateManager || require('./update-manager');

      if (!this.state.updateManager) {
        this.setState({
          updateManager: new UpdateManager()
        });
      }

      return this.state.updateManager;
    }
  }, {
    key: 'deserialize',
    value: function deserialize(state) {
      if (!this.views.aboutView) {
        AboutView = AboutView || require('./components/about-view');

        this.setState(state);

        this.views.aboutView = new AboutView({
          uri: this.state.uri,
          updateManager: this.getUpdateManager(),
          currentVersion: this.state.currentVersion,
          availableVersion: this.state.updateManager.getAvailableVersion()
        });
        this.handleStateChanges();
      }

      return this.views.aboutView;
    }
  }, {
    key: 'handleStateChanges',
    value: function handleStateChanges() {
      var _this2 = this;

      this.onDidChange(function () {
        if (_this2.views.aboutView) {
          _this2.views.aboutView.update({
            updateManager: _this2.state.updateManager,
            currentVersion: _this2.state.currentVersion,
            availableVersion: _this2.state.updateManager.getAvailableVersion()
          });
        }
      });

      this.state.updateManager.onDidChange(function () {
        _this2.didChange();
      });
    }
  }]);

  return About;
})();

exports['default'] = About;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2Fib3V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRTJDLE1BQU07OztBQUdqRCxJQUFJLEtBQUssWUFBQSxDQUFBO0FBQ1QsSUFBSSxTQUFTLFlBQUEsQ0FBQTtBQUNiLElBQUksYUFBYSxZQUFBLENBQUE7O0lBRUksS0FBSztBQUNaLFdBRE8sS0FBSyxDQUNYLFlBQVksRUFBRTs7OzBCQURSLEtBQUs7O0FBRXRCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBOztBQUU1QixRQUFJLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQTtBQUN6QixRQUFJLENBQUMsS0FBSyxHQUFHO0FBQ1gsZUFBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQTs7QUFFRCxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFDLFNBQVMsRUFBSztBQUM3RCxVQUFJLFNBQVMsS0FBSyxNQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7QUFDaEMsZUFBTyxNQUFLLFdBQVcsRUFBRSxDQUFBO09BQzFCO0tBQ0YsQ0FBQyxDQUFDLENBQUE7O0FBRUgsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsWUFBTTtBQUMzRixXQUFLLEdBQUcsS0FBSyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUE7QUFDMUMsV0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFLLGdCQUFnQixFQUFFLENBQUMsbUNBQW1DLEVBQUUsQ0FBQyxDQUFBO0tBQ2xGLENBQUMsQ0FBQyxDQUFBO0dB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LENBQUMsV0FBVyxDQUFDLFlBQU07QUFDekMsZUFBSyxTQUFTLEVBQUUsQ0FBQTtPQUNqQixDQUFDLENBQUE7S0FDSDs7O1NBN0ZrQixLQUFLOzs7cUJBQUwsS0FBSyIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2Fib3V0L2xpYi9hYm91dC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSBmcm9tICdhdG9tJ1xuXG4vLyBEZWZlcnJlZCByZXF1aXJlc1xubGV0IHNoZWxsXG5sZXQgQWJvdXRWaWV3XG5sZXQgVXBkYXRlTWFuYWdlclxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBYm91dCB7XG4gIGNvbnN0cnVjdG9yIChpbml0aWFsU3RhdGUpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuXG4gICAgdGhpcy5zdGF0ZSA9IGluaXRpYWxTdGF0ZVxuICAgIHRoaXMudmlld3MgPSB7XG4gICAgICBhYm91dFZpZXc6IG51bGxcbiAgICB9XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpVG9PcGVuKSA9PiB7XG4gICAgICBpZiAodXJpVG9PcGVuID09PSB0aGlzLnN0YXRlLnVyaSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNlcmlhbGl6ZSgpXG4gICAgICB9XG4gICAgfSkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdhYm91dDp2aWV3LXJlbGVhc2Utbm90ZXMnLCAoKSA9PiB7XG4gICAgICBzaGVsbCA9IHNoZWxsIHx8IHJlcXVpcmUoJ2VsZWN0cm9uJykuc2hlbGxcbiAgICAgIHNoZWxsLm9wZW5FeHRlcm5hbCh0aGlzLmdldFVwZGF0ZU1hbmFnZXIoKS5nZXRSZWxlYXNlTm90ZXNVUkxGb3JDdXJyZW50VmVyc2lvbigpKVxuICAgIH0pKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgaWYgKHRoaXMudmlld3MuYWJvdXRWaWV3KSB0aGlzLnZpZXdzLmFib3V0Vmlldy5kZXN0cm95KClcbiAgICB0aGlzLnZpZXdzLmFib3V0VmlldyA9IG51bGxcblxuICAgIGlmICh0aGlzLnN0YXRlLnVwZGF0ZU1hbmFnZXIpIHRoaXMuc3RhdGUudXBkYXRlTWFuYWdlci5kaXNwb3NlKClcbiAgICB0aGlzLnNldFN0YXRlKHt1cGRhdGVNYW5hZ2VyOiBudWxsfSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxuXG4gIHNldFN0YXRlIChuZXdTdGF0ZSkge1xuICAgIGlmIChuZXdTdGF0ZSAmJiB0eXBlb2YgbmV3U3RhdGUgPT09ICdvYmplY3QnKSB7XG4gICAgICBsZXQge3N0YXRlfSA9IHRoaXNcbiAgICAgIHRoaXMuc3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSwgbmV3U3RhdGUpXG5cbiAgICAgIHRoaXMuZGlkQ2hhbmdlKClcbiAgICB9XG4gIH1cblxuICBkaWRDaGFuZ2UgKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJylcbiAgfVxuXG4gIG9uRGlkQ2hhbmdlIChjYWxsYmFjaykge1xuICAgIHRoaXMuZW1pdHRlci5vbignZGlkLWNoYW5nZScsIGNhbGxiYWNrKVxuICB9XG5cbiAgZ2V0VXBkYXRlTWFuYWdlciAoKSB7XG4gICAgVXBkYXRlTWFuYWdlciA9IFVwZGF0ZU1hbmFnZXIgfHwgcmVxdWlyZSgnLi91cGRhdGUtbWFuYWdlcicpXG5cbiAgICBpZiAoIXRoaXMuc3RhdGUudXBkYXRlTWFuYWdlcikge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHVwZGF0ZU1hbmFnZXI6IG5ldyBVcGRhdGVNYW5hZ2VyKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudXBkYXRlTWFuYWdlclxuICB9XG5cbiAgZGVzZXJpYWxpemUgKHN0YXRlKSB7XG4gICAgaWYgKCF0aGlzLnZpZXdzLmFib3V0Vmlldykge1xuICAgICAgQWJvdXRWaWV3ID0gQWJvdXRWaWV3IHx8IHJlcXVpcmUoJy4vY29tcG9uZW50cy9hYm91dC12aWV3JylcblxuICAgICAgdGhpcy5zZXRTdGF0ZShzdGF0ZSlcblxuICAgICAgdGhpcy52aWV3cy5hYm91dFZpZXcgPSBuZXcgQWJvdXRWaWV3KHtcbiAgICAgICAgdXJpOiB0aGlzLnN0YXRlLnVyaSxcbiAgICAgICAgdXBkYXRlTWFuYWdlcjogdGhpcy5nZXRVcGRhdGVNYW5hZ2VyKCksXG4gICAgICAgIGN1cnJlbnRWZXJzaW9uOiB0aGlzLnN0YXRlLmN1cnJlbnRWZXJzaW9uLFxuICAgICAgICBhdmFpbGFibGVWZXJzaW9uOiB0aGlzLnN0YXRlLnVwZGF0ZU1hbmFnZXIuZ2V0QXZhaWxhYmxlVmVyc2lvbigpXG4gICAgICB9KVxuICAgICAgdGhpcy5oYW5kbGVTdGF0ZUNoYW5nZXMoKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZpZXdzLmFib3V0Vmlld1xuICB9XG5cbiAgaGFuZGxlU3RhdGVDaGFuZ2VzICgpIHtcbiAgICB0aGlzLm9uRGlkQ2hhbmdlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnZpZXdzLmFib3V0Vmlldykge1xuICAgICAgICB0aGlzLnZpZXdzLmFib3V0Vmlldy51cGRhdGUoe1xuICAgICAgICAgIHVwZGF0ZU1hbmFnZXI6IHRoaXMuc3RhdGUudXBkYXRlTWFuYWdlcixcbiAgICAgICAgICBjdXJyZW50VmVyc2lvbjogdGhpcy5zdGF0ZS5jdXJyZW50VmVyc2lvbixcbiAgICAgICAgICBhdmFpbGFibGVWZXJzaW9uOiB0aGlzLnN0YXRlLnVwZGF0ZU1hbmFnZXIuZ2V0QXZhaWxhYmxlVmVyc2lvbigpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuc3RhdGUudXBkYXRlTWFuYWdlci5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICB0aGlzLmRpZENoYW5nZSgpXG4gICAgfSlcbiAgfVxufVxuIl19