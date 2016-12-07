Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _atom = require('atom');

var Unsupported = 'unsupported';
var Idle = 'idle';
var CheckingForUpdate = 'checking';
var DownloadingUpdate = 'downloading';
var UpdateAvailableToInstall = 'update-available';
var UpToDate = 'no-update-available';
var ErrorState = 'error';

var UpdateManager = (function () {
  function UpdateManager() {
    _classCallCheck(this, UpdateManager);

    this.emitter = new _atom.Emitter();
    this.currentVersion = atom.getVersion();
    this.availableVersion = atom.getVersion();
    this.resetState();
    this.listenForAtomEvents();
  }

  _createClass(UpdateManager, [{
    key: 'listenForAtomEvents',
    value: function listenForAtomEvents() {
      var _this = this;

      this.subscriptions = new _atom.CompositeDisposable();

      this.subscriptions.add(atom.autoUpdater.onDidBeginCheckingForUpdate(function () {
        _this.setState(CheckingForUpdate);
      }), atom.autoUpdater.onDidBeginDownloadingUpdate(function () {
        _this.setState(DownloadingUpdate);
      }), atom.autoUpdater.onDidCompleteDownloadingUpdate(function (detail) {
        var releaseVersion = detail.releaseVersion;

        _this.setAvailableVersion(releaseVersion);
      }), atom.autoUpdater.onUpdateNotAvailable(function () {
        _this.setState(UpToDate);
      }), atom.config.observe('core.automaticallyUpdate', function (value) {
        _this.autoUpdatesEnabled = value;
        _this.emitDidChange();
      }));

      // TODO: Combine this with the subscriptions above once stable has onUpdateError
      if (atom.autoUpdater.onUpdateError) {
        this.subscriptions.add(atom.autoUpdater.onUpdateError(function () {
          _this.setState(ErrorState);
        }));
      }

      // TODO: When https://github.com/atom/electron/issues/4587 is closed we can add this support.
      // atom.autoUpdater.onUpdateAvailable =>
      //   @find('.about-updates-item').removeClass('is-shown')
      //   @updateAvailable.addClass('is-shown')
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }, {
    key: 'onDidChange',
    value: function onDidChange(callback) {
      return this.emitter.on('did-change', callback);
    }
  }, {
    key: 'emitDidChange',
    value: function emitDidChange() {
      this.emitter.emit('did-change');
    }
  }, {
    key: 'getAutoUpdatesEnabled',
    value: function getAutoUpdatesEnabled() {
      return this.autoUpdatesEnabled && this.state !== UpdateManager.State.Unsupported;
    }
  }, {
    key: 'setAutoUpdatesEnabled',
    value: function setAutoUpdatesEnabled(enabled) {
      return atom.config.set('core.automaticallyUpdate', enabled);
    }
  }, {
    key: 'getErrorMessage',
    value: function getErrorMessage() {
      return atom.autoUpdater.getErrorMessage();
    }
  }, {
    key: 'getState',
    value: function getState() {
      return this.state;
    }
  }, {
    key: 'setState',
    value: function setState(state) {
      this.state = state;
      this.emitDidChange();
    }
  }, {
    key: 'resetState',
    value: function resetState() {
      this.state = atom.autoUpdater.platformSupportsUpdates() ? atom.autoUpdater.getState() : Unsupported;
      this.emitDidChange();
    }
  }, {
    key: 'getAvailableVersion',
    value: function getAvailableVersion() {
      return this.availableVersion;
    }
  }, {
    key: 'setAvailableVersion',
    value: function setAvailableVersion(version) {
      this.availableVersion = version;

      if (this.availableVersion !== this.currentVersion) {
        this.state = UpdateAvailableToInstall;
      } else {
        this.state = UpToDate;
      }

      this.emitDidChange();
    }
  }, {
    key: 'checkForUpdate',
    value: function checkForUpdate() {
      atom.autoUpdater.checkForUpdate();
    }
  }, {
    key: 'restartAndInstallUpdate',
    value: function restartAndInstallUpdate() {
      atom.autoUpdater.restartAndInstallUpdate();
    }
  }, {
    key: 'getReleaseNotesURLForCurrentVersion',
    value: function getReleaseNotesURLForCurrentVersion() {
      return this.getReleaseNotesURLForVersion(this.currentVersion);
    }
  }, {
    key: 'getReleaseNotesURLForAvailableVersion',
    value: function getReleaseNotesURLForAvailableVersion() {
      return this.getReleaseNotesURLForVersion(this.availableVersion);
    }
  }, {
    key: 'getReleaseNotesURLForVersion',
    value: function getReleaseNotesURLForVersion(appVersion) {
      // Dev versions will not have a releases page
      if (appVersion.indexOf('dev') > -1) {
        return 'https://atom.io/releases';
      }

      if (!appVersion.startsWith('v')) {
        appVersion = 'v' + appVersion;
      }
      return 'https://github.com/atom/atom/releases/tag/' + appVersion;
    }
  }]);

  return UpdateManager;
})();

exports['default'] = UpdateManager;

UpdateManager.State = {
  Unsupported: Unsupported,
  Idle: Idle,
  CheckingForUpdate: CheckingForUpdate,
  DownloadingUpdate: DownloadingUpdate,
  UpdateAvailableToInstall: UpdateAvailableToInstall,
  UpToDate: UpToDate,
  Error: ErrorState
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL3VwZGF0ZS1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRTJDLE1BQU07O0FBRWpELElBQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQTtBQUNqQyxJQUFNLElBQUksR0FBRyxNQUFNLENBQUE7QUFDbkIsSUFBTSxpQkFBaUIsR0FBRyxVQUFVLENBQUE7QUFDcEMsSUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUE7QUFDdkMsSUFBTSx3QkFBd0IsR0FBRyxrQkFBa0IsQ0FBQTtBQUNuRCxJQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQTtBQUN0QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUE7O0lBRUwsYUFBYTtBQUNwQixXQURPLGFBQWEsR0FDakI7MEJBREksYUFBYTs7QUFFOUIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0FBQ3ZDLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7QUFDekMsUUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0FBQ2pCLFFBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0dBQzNCOztlQVBrQixhQUFhOztXQVNaLCtCQUFHOzs7QUFDckIsVUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsVUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsMkJBQTJCLENBQUMsWUFBTTtBQUNqRCxjQUFLLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO09BQ2pDLENBQUMsRUFDRixJQUFJLENBQUMsV0FBVyxDQUFDLDJCQUEyQixDQUFDLFlBQU07QUFDakQsY0FBSyxR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V0FFbUMsK0NBQUc7QUFDckMsYUFBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQzlEOzs7V0FFcUMsaURBQUc7QUFDdkMsYUFBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUE7S0FDaEU7OztXQUU0QixzQ0FBQyxVQUFVLEVBQUU7O0FBRXhDLFVBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUNsQyxlQUFPLDBCQUEwQixDQUFBO09BQ2xDOztBQUVELFVBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQy9CLGtCQUFVLFNBQU8sVUFBVSxBQUFFLENBQUE7T0FDOUI7QUFDRCw0REFBb0QsVUFBVSxDQUFFO0tBQ2pFOzs7U0EvSGtCLGFBQWE7OztxQkFBYixhQUFhOztBQWtJbEMsYUFBYSxDQUFDLEtBQUssR0FBRztBQUNwQixhQUFXLEVBQUUsV0FBVztBQUN4QixNQUFJLEVBQUUsSUFBSTtBQUNWLG1CQUFpQixFQUFFLGlCQUFpQjtBQUNwQyxtQkFBaUIsRUFBRSxpQkFBaUI7QUFDcEMsMEJBQXdCLEVBQUUsd0JBQXdCO0FBQ2xELFVBQVEsRUFBRSxRQUFRO0FBQ2xCLE9BQUssRUFBRSxVQUFVO0NBQ2xCLENBQUEiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hYm91dC9saWIvdXBkYXRlLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSdcblxuY29uc3QgVW5zdXBwb3J0ZWQgPSAndW5zdXBwb3J0ZWQnXG5jb25zdCBJZGxlID0gJ2lkbGUnXG5jb25zdCBDaGVja2luZ0ZvclVwZGF0ZSA9ICdjaGVja2luZydcbmNvbnN0IERvd25sb2FkaW5nVXBkYXRlID0gJ2Rvd25sb2FkaW5nJ1xuY29uc3QgVXBkYXRlQXZhaWxhYmxlVG9JbnN0YWxsID0gJ3VwZGF0ZS1hdmFpbGFibGUnXG5jb25zdCBVcFRvRGF0ZSA9ICduby11cGRhdGUtYXZhaWxhYmxlJ1xuY29uc3QgRXJyb3JTdGF0ZSA9ICdlcnJvcidcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBkYXRlTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5jdXJyZW50VmVyc2lvbiA9IGF0b20uZ2V0VmVyc2lvbigpXG4gICAgdGhpcy5hdmFpbGFibGVWZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKClcbiAgICB0aGlzLnJlc2V0U3RhdGUoKVxuICAgIHRoaXMubGlzdGVuRm9yQXRvbUV2ZW50cygpXG4gIH1cblxuICBsaXN0ZW5Gb3JBdG9tRXZlbnRzICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5hdXRvVXBkYXRlci5vbkRpZEJlZ2luQ2hlY2tpbmdGb3JVcGRhdGUoKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKENoZWNraW5nRm9yVXBkYXRlKVxuICAgICAgfSksXG4gICAgICBhdG9tLmF1dG9VcGRhdGVyLm9uRGlkQmVnaW5Eb3dubG9hZGluZ1VwZGF0ZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoRG93bmxvYWRpbmdVcGRhdGUpXG4gICAgICB9KSxcbiAgICAgIGF0b20uYXV0b1VwZGF0ZXIub25EaWRDb21wbGV0ZURvd25sb2FkaW5nVXBkYXRlKChkZXRhaWwpID0+IHtcbiAgICAgICAgbGV0IHtyZWxlYXNlVmVyc2lvbn0gPSBkZXRhaWxcbiAgICAgICAgdGhpcy5zZXRBdmFpbGFibGVWZXJzaW9uKHJlbGVhc2VWZXJzaW9uKVxuICAgICAgfSksXG4gICAgICBhdG9tLmF1dG9VcGRhdGVyLm9uVXBkYXRlTm90QXZhaWxhYmxlKCgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShVcFRvRGF0ZSlcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnY29yZS5hdXRvbWF0aWNhbGx5VXBkYXRlJywgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMuYXV0b1VwZGF0ZXNFbmFibGVkID0gdmFsdWVcbiAgICAgICAgdGhpcy5lbWl0RGlkQ2hhbmdlKClcbiAgICAgIH0pXG4gICAgKVxuXG4gICAgLy8gVE9ETzogQ29tYmluZSB0aGlzIHdpdGggdGhlIHN1YnNjcmlwdGlvbnMgYWJvdmUgb25jZSBzdGFibGUgaGFzIG9uVXBkYXRlRXJyb3JcbiAgICBpZiAoYXRvbS5hdXRvVXBkYXRlci5vblVwZGF0ZUVycm9yKSB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICBhdG9tLmF1dG9VcGRhdGVyLm9uVXBkYXRlRXJyb3IoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoRXJyb3JTdGF0ZSlcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBXaGVuIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2VsZWN0cm9uL2lzc3Vlcy80NTg3IGlzIGNsb3NlZCB3ZSBjYW4gYWRkIHRoaXMgc3VwcG9ydC5cbiAgICAvLyBhdG9tLmF1dG9VcGRhdGVyLm9uVXBkYXRlQXZhaWxhYmxlID0+XG4gICAgLy8gICBAZmluZCgnLmFib3V0LXVwZGF0ZXMtaXRlbScpLnJlbW92ZUNsYXNzKCdpcy1zaG93bicpXG4gICAgLy8gICBAdXBkYXRlQXZhaWxhYmxlLmFkZENsYXNzKCdpcy1zaG93bicpXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH1cblxuICBvbkRpZENoYW5nZSAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY2hhbmdlJywgY2FsbGJhY2spXG4gIH1cblxuICBlbWl0RGlkQ2hhbmdlICgpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZScpXG4gIH1cblxuICBnZXRBdXRvVXBkYXRlc0VuYWJsZWQgKCkge1xuICAgIHJldHVybiB0aGlzLmF1dG9VcGRhdGVzRW5hYmxlZCAmJiB0aGlzLnN0YXRlICE9PSBVcGRhdGVNYW5hZ2VyLlN0YXRlLlVuc3VwcG9ydGVkXG4gIH1cblxuICBzZXRBdXRvVXBkYXRlc0VuYWJsZWQgKGVuYWJsZWQpIHtcbiAgICByZXR1cm4gYXRvbS5jb25maWcuc2V0KCdjb3JlLmF1dG9tYXRpY2FsbHlVcGRhdGUnLCBlbmFibGVkKVxuICB9XG5cbiAgZ2V0RXJyb3JNZXNzYWdlICgpIHtcbiAgICByZXR1cm4gYXRvbS5hdXRvVXBkYXRlci5nZXRFcnJvck1lc3NhZ2UoKVxuICB9XG5cbiAgZ2V0U3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlXG4gIH1cblxuICBzZXRTdGF0ZSAoc3RhdGUpIHtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGVcbiAgICB0aGlzLmVtaXREaWRDaGFuZ2UoKVxuICB9XG5cbiAgcmVzZXRTdGF0ZSAoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IGF0b20uYXV0b1VwZGF0ZXIucGxhdGZvcm1TdXBwb3J0c1VwZGF0ZXMoKSA/IGF0b20uYXV0b1VwZGF0ZXIuZ2V0U3RhdGUoKSA6IFVuc3VwcG9ydGVkXG4gICAgdGhpcy5lbWl0RGlkQ2hhbmdlKClcbiAgfVxuXG4gIGdldEF2YWlsYWJsZVZlcnNpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmF2YWlsYWJsZVZlcnNpb25cbiAgfVxuXG4gIHNldEF2YWlsYWJsZVZlcnNpb24gKHZlcnNpb24pIHtcbiAgICB0aGlzLmF2YWlsYWJsZVZlcnNpb24gPSB2ZXJzaW9uXG5cbiAgICBpZiAodGhpcy5hdmFpbGFibGVWZXJzaW9uICE9PSB0aGlzLmN1cnJlbnRWZXJzaW9uKSB7XG4gICAgICB0aGlzLnN0YXRlID0gVXBkYXRlQXZhaWxhYmxlVG9JbnN0YWxsXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBVcFRvRGF0ZVxuICAgIH1cblxuICAgIHRoaXMuZW1pdERpZENoYW5nZSgpXG4gIH1cblxuICBjaGVja0ZvclVwZGF0ZSAoKSB7XG4gICAgYXRvbS5hdXRvVXBkYXRlci5jaGVja0ZvclVwZGF0ZSgpXG4gIH1cblxuICByZXN0YXJ0QW5kSW5zdGFsbFVwZGF0ZSAoKSB7XG4gICAgYXRvbS5hdXRvVXBkYXRlci5yZXN0YXJ0QW5kSW5zdGFsbFVwZGF0ZSgpXG4gIH1cblxuICBnZXRSZWxlYXNlTm90ZXNVUkxGb3JDdXJyZW50VmVyc2lvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVsZWFzZU5vdGVzVVJMRm9yVmVyc2lvbih0aGlzLmN1cnJlbnRWZXJzaW9uKVxuICB9XG5cbiAgZ2V0UmVsZWFzZU5vdGVzVVJMRm9yQXZhaWxhYmxlVmVyc2lvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVsZWFzZU5vdGVzVVJMRm9yVmVyc2lvbih0aGlzLmF2YWlsYWJsZVZlcnNpb24pXG4gIH1cblxuICBnZXRSZWxlYXNlTm90ZXNVUkxGb3JWZXJzaW9uIChhcHBWZXJzaW9uKSB7XG4gICAgLy8gRGV2IHZlcnNpb25zIHdpbGwgbm90IGhhdmUgYSByZWxlYXNlcyBwYWdlXG4gICAgaWYgKGFwcFZlcnNpb24uaW5kZXhPZignZGV2JykgPiAtMSkge1xuICAgICAgcmV0dXJuICdodHRwczovL2F0b20uaW8vcmVsZWFzZXMnXG4gICAgfVxuXG4gICAgaWYgKCFhcHBWZXJzaW9uLnN0YXJ0c1dpdGgoJ3YnKSkge1xuICAgICAgYXBwVmVyc2lvbiA9IGB2JHthcHBWZXJzaW9ufWBcbiAgICB9XG4gICAgcmV0dXJuIGBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL3JlbGVhc2VzL3RhZy8ke2FwcFZlcnNpb259YFxuICB9XG59XG5cblVwZGF0ZU1hbmFnZXIuU3RhdGUgPSB7XG4gIFVuc3VwcG9ydGVkOiBVbnN1cHBvcnRlZCxcbiAgSWRsZTogSWRsZSxcbiAgQ2hlY2tpbmdGb3JVcGRhdGU6IENoZWNraW5nRm9yVXBkYXRlLFxuICBEb3dubG9hZGluZ1VwZGF0ZTogRG93bmxvYWRpbmdVcGRhdGUsXG4gIFVwZGF0ZUF2YWlsYWJsZVRvSW5zdGFsbDogVXBkYXRlQXZhaWxhYmxlVG9JbnN0YWxsLFxuICBVcFRvRGF0ZTogVXBUb0RhdGUsXG4gIEVycm9yOiBFcnJvclN0YXRlXG59XG4iXX0=