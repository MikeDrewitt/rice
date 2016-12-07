Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _eventKit = require('event-kit');

'use babel';

var AutoUpdateManager = (function () {
  function AutoUpdateManager(_ref) {
    var _this = this;

    var applicationDelegate = _ref.applicationDelegate;

    _classCallCheck(this, AutoUpdateManager);

    this.applicationDelegate = applicationDelegate;
    this.subscriptions = new _eventKit.CompositeDisposable();
    this.emitter = new _eventKit.Emitter();

    this.subscriptions.add(applicationDelegate.onDidBeginCheckingForUpdate(function () {
      _this.emitter.emit('did-begin-checking-for-update');
    }), applicationDelegate.onDidBeginDownloadingUpdate(function () {
      _this.emitter.emit('did-begin-downloading-update');
    }), applicationDelegate.onDidCompleteDownloadingUpdate(function (details) {
      _this.emitter.emit('did-complete-downloading-update', details);
    }), applicationDelegate.onUpdateNotAvailable(function () {
      _this.emitter.emit('update-not-available');
    }), applicationDelegate.onUpdateError(function () {
      _this.emitter.emit('update-error');
    }));
  }

  _createClass(AutoUpdateManager, [{
    key: 'destroy',
    value: function destroy() {
      this.subscriptions.dispose();
      this.emitter.dispose();
    }
  }, {
    key: 'checkForUpdate',
    value: function checkForUpdate() {
      this.applicationDelegate.checkForUpdate();
    }
  }, {
    key: 'restartAndInstallUpdate',
    value: function restartAndInstallUpdate() {
      this.applicationDelegate.restartAndInstallUpdate();
    }
  }, {
    key: 'getState',
    value: function getState() {
      return this.applicationDelegate.getAutoUpdateManagerState();
    }
  }, {
    key: 'getErrorMessage',
    value: function getErrorMessage() {
      return this.applicationDelegate.getAutoUpdateManagerErrorMessage();
    }
  }, {
    key: 'platformSupportsUpdates',
    value: function platformSupportsUpdates() {
      return atom.getReleaseChannel() !== 'dev' && this.getState() !== 'unsupported';
    }
  }, {
    key: 'onDidBeginCheckingForUpdate',
    value: function onDidBeginCheckingForUpdate(callback) {
      return this.emitter.on('did-begin-checking-for-update', callback);
    }
  }, {
    key: 'onDidBeginDownloadingUpdate',
    value: function onDidBeginDownloadingUpdate(callback) {
      return this.emitter.on('did-begin-downloading-update', callback);
    }
  }, {
    key: 'onDidCompleteDownloadingUpdate',
    value: function onDidCompleteDownloadingUpdate(callback) {
      return this.emitter.on('did-complete-downloading-update', callback);
    }

    // TODO: When https://github.com/atom/electron/issues/4587 is closed, we can
    // add an update-available event.
    // onUpdateAvailable (callback) {
    //   return this.emitter.on('update-available', callback)
    // }

  }, {
    key: 'onUpdateNotAvailable',
    value: function onUpdateNotAvailable(callback) {
      return this.emitter.on('update-not-available', callback);
    }
  }, {
    key: 'onUpdateError',
    value: function onUpdateError(callback) {
      return this.emitter.on('update-error', callback);
    }
  }, {
    key: 'getPlatform',
    value: function getPlatform() {
      return process.platform;
    }
  }]);

  return AutoUpdateManager;
})();

exports['default'] = AutoUpdateManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvYXV0by11cGRhdGUtbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozt3QkFFMkMsV0FBVzs7QUFGdEQsV0FBVyxDQUFBOztJQUlVLGlCQUFpQjtBQUN4QixXQURPLGlCQUFpQixDQUN2QixJQUFxQixFQUFFOzs7UUFBdEIsbUJBQW1CLEdBQXBCLElBQXFCLENBQXBCLG1CQUFtQjs7MEJBRGQsaUJBQWlCOztBQUVsQyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUE7QUFDOUMsUUFBSSxDQUFDLGFBQWEsR0FBRyxtQ0FBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsT0FBTyxHQUFHLHVCQUFhLENBQUE7O0FBRTVCLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQyxZQUFNO0FBQ3BELFlBQUssT0FBTyxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO0tBQ25ELENBQUMsRUFDRixtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQyxZQUFNO0FBQ3BELFlBQUssT0FBTyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFBO0tBQ2xELENBQUMsRUFDRixtQkFBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUM5RCxZQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDOUQsQ0FBQyxFQUNGLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLFlBQU07QUFDN0MsWUFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUE7S0FDMUMsQ0FBQyxFQUNGLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxZQUFNO0FBQ3RDLFlBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtLQUNsQyxDQUFDLENBQ0gsQ0FBQTtHQUNGOztlQXZCa0IsaUJBQWlCOztXQXlCNUIsbUJBQUc7QUFDVCxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzVCLFVBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDdkI7OztXQUVjLDBCQUFHO0FBQ2hCLFVBQUksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtLQUMxQzs7O1dBRXVCLG1DQUFHO0FBQ3pCLFVBQUksQ0FBQyxtQkFBbUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO0tBQ25EOzs7V0FFUSxvQkFBRztBQUNWLGFBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLHlCQUF5QixFQUFFLENBQUE7S0FDNUQ7OztXQUVlLDJCQUFHO0FBQ2pCLGFBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGdDQUFnQyxFQUFFLENBQUE7S0FDbkU7OztXQUV1QixtQ0FBRztBQUN6QixhQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssYUFBYSxDQUFBO0tBQy9FOzs7V0FFMkIscUNBQUMsUUFBUSxFQUFFO0FBQ3JDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsK0JBQStCLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDbEU7OztXQUUyQixxQ0FBQyxRQUFRLEVBQUU7QUFDckMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNqRTs7O1dBRThCLHdDQUFDLFFBQVEsRUFBRTtBQUN4QyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGlDQUFpQyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ3BFOzs7Ozs7Ozs7O1dBUW9CLDhCQUFDLFFBQVEsRUFBRTtBQUM5QixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHNCQUFzQixFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ3pEOzs7V0FFYSx1QkFBQyxRQUFRLEVBQUU7QUFDdkIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDakQ7OztXQUVXLHVCQUFHO0FBQ2IsYUFBTyxPQUFPLENBQUMsUUFBUSxDQUFBO0tBQ3hCOzs7U0E5RWtCLGlCQUFpQjs7O3FCQUFqQixpQkFBaUIiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9hdXRvLXVwZGF0ZS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHtFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tICdldmVudC1raXQnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9VcGRhdGVNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IgKHthcHBsaWNhdGlvbkRlbGVnYXRlfSkge1xuICAgIHRoaXMuYXBwbGljYXRpb25EZWxlZ2F0ZSA9IGFwcGxpY2F0aW9uRGVsZWdhdGVcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIGFwcGxpY2F0aW9uRGVsZWdhdGUub25EaWRCZWdpbkNoZWNraW5nRm9yVXBkYXRlKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1iZWdpbi1jaGVja2luZy1mb3ItdXBkYXRlJylcbiAgICAgIH0pLFxuICAgICAgYXBwbGljYXRpb25EZWxlZ2F0ZS5vbkRpZEJlZ2luRG93bmxvYWRpbmdVcGRhdGUoKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWJlZ2luLWRvd25sb2FkaW5nLXVwZGF0ZScpXG4gICAgICB9KSxcbiAgICAgIGFwcGxpY2F0aW9uRGVsZWdhdGUub25EaWRDb21wbGV0ZURvd25sb2FkaW5nVXBkYXRlKChkZXRhaWxzKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29tcGxldGUtZG93bmxvYWRpbmctdXBkYXRlJywgZGV0YWlscylcbiAgICAgIH0pLFxuICAgICAgYXBwbGljYXRpb25EZWxlZ2F0ZS5vblVwZGF0ZU5vdEF2YWlsYWJsZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCd1cGRhdGUtbm90LWF2YWlsYWJsZScpXG4gICAgICB9KSxcbiAgICAgIGFwcGxpY2F0aW9uRGVsZWdhdGUub25VcGRhdGVFcnJvcigoKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCd1cGRhdGUtZXJyb3InKVxuICAgICAgfSlcbiAgICApXG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgdGhpcy5lbWl0dGVyLmRpc3Bvc2UoKVxuICB9XG5cbiAgY2hlY2tGb3JVcGRhdGUgKCkge1xuICAgIHRoaXMuYXBwbGljYXRpb25EZWxlZ2F0ZS5jaGVja0ZvclVwZGF0ZSgpXG4gIH1cblxuICByZXN0YXJ0QW5kSW5zdGFsbFVwZGF0ZSAoKSB7XG4gICAgdGhpcy5hcHBsaWNhdGlvbkRlbGVnYXRlLnJlc3RhcnRBbmRJbnN0YWxsVXBkYXRlKClcbiAgfVxuXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcHBsaWNhdGlvbkRlbGVnYXRlLmdldEF1dG9VcGRhdGVNYW5hZ2VyU3RhdGUoKVxuICB9XG5cbiAgZ2V0RXJyb3JNZXNzYWdlICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcHBsaWNhdGlvbkRlbGVnYXRlLmdldEF1dG9VcGRhdGVNYW5hZ2VyRXJyb3JNZXNzYWdlKClcbiAgfVxuXG4gIHBsYXRmb3JtU3VwcG9ydHNVcGRhdGVzICgpIHtcbiAgICByZXR1cm4gYXRvbS5nZXRSZWxlYXNlQ2hhbm5lbCgpICE9PSAnZGV2JyAmJiB0aGlzLmdldFN0YXRlKCkgIT09ICd1bnN1cHBvcnRlZCdcbiAgfVxuXG4gIG9uRGlkQmVnaW5DaGVja2luZ0ZvclVwZGF0ZSAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtYmVnaW4tY2hlY2tpbmctZm9yLXVwZGF0ZScsIGNhbGxiYWNrKVxuICB9XG5cbiAgb25EaWRCZWdpbkRvd25sb2FkaW5nVXBkYXRlIChjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1iZWdpbi1kb3dubG9hZGluZy11cGRhdGUnLCBjYWxsYmFjaylcbiAgfVxuXG4gIG9uRGlkQ29tcGxldGVEb3dubG9hZGluZ1VwZGF0ZSAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY29tcGxldGUtZG93bmxvYWRpbmctdXBkYXRlJywgY2FsbGJhY2spXG4gIH1cblxuICAvLyBUT0RPOiBXaGVuIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2VsZWN0cm9uL2lzc3Vlcy80NTg3IGlzIGNsb3NlZCwgd2UgY2FuXG4gIC8vIGFkZCBhbiB1cGRhdGUtYXZhaWxhYmxlIGV2ZW50LlxuICAvLyBvblVwZGF0ZUF2YWlsYWJsZSAoY2FsbGJhY2spIHtcbiAgLy8gICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCd1cGRhdGUtYXZhaWxhYmxlJywgY2FsbGJhY2spXG4gIC8vIH1cblxuICBvblVwZGF0ZU5vdEF2YWlsYWJsZSAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCd1cGRhdGUtbm90LWF2YWlsYWJsZScsIGNhbGxiYWNrKVxuICB9XG5cbiAgb25VcGRhdGVFcnJvciAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCd1cGRhdGUtZXJyb3InLCBjYWxsYmFjaylcbiAgfVxuXG4gIGdldFBsYXRmb3JtICgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybVxuICB9XG59XG4iXX0=