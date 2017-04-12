(function() {
  var AutoUpdateManager, CheckingState, DownloadingState, ErrorState, EventEmitter, IdleState, NoUpdateAvailableState, UnsupportedState, UpdateAvailableState, autoUpdater, path,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  autoUpdater = null;

  EventEmitter = require('events').EventEmitter;

  path = require('path');

  IdleState = 'idle';

  CheckingState = 'checking';

  DownloadingState = 'downloading';

  UpdateAvailableState = 'update-available';

  NoUpdateAvailableState = 'no-update-available';

  UnsupportedState = 'unsupported';

  ErrorState = 'error';

  module.exports = AutoUpdateManager = (function() {
    Object.assign(AutoUpdateManager.prototype, EventEmitter.prototype);

    function AutoUpdateManager(version, testMode, resourcePath, config) {
      this.version = version;
      this.testMode = testMode;
      this.config = config;
      this.onUpdateError = bind(this.onUpdateError, this);
      this.onUpdateNotAvailable = bind(this.onUpdateNotAvailable, this);
      this.state = IdleState;
      this.iconPath = path.resolve(__dirname, '..', '..', 'resources', 'atom.png');
      this.feedUrl = "https://atom.io/api/updates?version=" + this.version;
      process.nextTick((function(_this) {
        return function() {
          return _this.setupAutoUpdater();
        };
      })(this));
    }

    AutoUpdateManager.prototype.setupAutoUpdater = function() {
      if (process.platform === 'win32') {
        autoUpdater = require('./auto-updater-win32');
      } else {
        autoUpdater = require('electron').autoUpdater;
      }
      autoUpdater.on('error', (function(_this) {
        return function(event, message) {
          _this.setState(ErrorState, message);
          _this.emitWindowEvent('update-error');
          return console.error("Error Downloading Update: " + message);
        };
      })(this));
      autoUpdater.setFeedURL(this.feedUrl);
      autoUpdater.on('checking-for-update', (function(_this) {
        return function() {
          _this.setState(CheckingState);
          return _this.emitWindowEvent('checking-for-update');
        };
      })(this));
      autoUpdater.on('update-not-available', (function(_this) {
        return function() {
          _this.setState(NoUpdateAvailableState);
          return _this.emitWindowEvent('update-not-available');
        };
      })(this));
      autoUpdater.on('update-available', (function(_this) {
        return function() {
          _this.setState(DownloadingState);
          _this.emitWindowEvent('did-begin-downloading-update');
          return _this.emit('did-begin-download');
        };
      })(this));
      autoUpdater.on('update-downloaded', (function(_this) {
        return function(event, releaseNotes, releaseVersion) {
          _this.releaseVersion = releaseVersion;
          _this.setState(UpdateAvailableState);
          return _this.emitUpdateAvailableEvent();
        };
      })(this));
      this.config.onDidChange('core.automaticallyUpdate', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          if (newValue) {
            return _this.scheduleUpdateCheck();
          } else {
            return _this.cancelScheduledUpdateCheck();
          }
        };
      })(this));
      if (this.config.get('core.automaticallyUpdate')) {
        this.scheduleUpdateCheck();
      }
      switch (process.platform) {
        case 'win32':
          if (!autoUpdater.supportsUpdates()) {
            return this.setState(UnsupportedState);
          }
          break;
        case 'linux':
          return this.setState(UnsupportedState);
      }
    };

    AutoUpdateManager.prototype.emitUpdateAvailableEvent = function() {
      if (this.releaseVersion == null) {
        return;
      }
      this.emitWindowEvent('update-available', {
        releaseVersion: this.releaseVersion
      });
    };

    AutoUpdateManager.prototype.emitWindowEvent = function(eventName, payload) {
      var atomWindow, i, len, ref;
      ref = this.getWindows();
      for (i = 0, len = ref.length; i < len; i++) {
        atomWindow = ref[i];
        atomWindow.sendMessage(eventName, payload);
      }
    };

    AutoUpdateManager.prototype.setState = function(state, errorMessage) {
      if (this.state === state) {
        return;
      }
      this.state = state;
      this.errorMessage = errorMessage;
      return this.emit('state-changed', this.state);
    };

    AutoUpdateManager.prototype.getState = function() {
      return this.state;
    };

    AutoUpdateManager.prototype.getErrorMessage = function() {
      return this.errorMessage;
    };

    AutoUpdateManager.prototype.scheduleUpdateCheck = function() {
      var checkForUpdates, fourHours;
      if (!(/\w{7}/.test(this.version) || this.checkForUpdatesIntervalID)) {
        checkForUpdates = (function(_this) {
          return function() {
            return _this.check({
              hidePopups: true
            });
          };
        })(this);
        fourHours = 1000 * 60 * 60 * 4;
        this.checkForUpdatesIntervalID = setInterval(checkForUpdates, fourHours);
        return checkForUpdates();
      }
    };

    AutoUpdateManager.prototype.cancelScheduledUpdateCheck = function() {
      if (this.checkForUpdatesIntervalID) {
        clearInterval(this.checkForUpdatesIntervalID);
        return this.checkForUpdatesIntervalID = null;
      }
    };

    AutoUpdateManager.prototype.check = function(arg) {
      var hidePopups;
      hidePopups = (arg != null ? arg : {}).hidePopups;
      if (!hidePopups) {
        autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
        autoUpdater.once('error', this.onUpdateError);
      }
      if (!this.testMode) {
        return autoUpdater.checkForUpdates();
      }
    };

    AutoUpdateManager.prototype.install = function() {
      if (!this.testMode) {
        return autoUpdater.quitAndInstall();
      }
    };

    AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
      var dialog;
      autoUpdater.removeListener('error', this.onUpdateError);
      dialog = require('electron').dialog;
      return dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        icon: this.iconPath,
        message: 'No update available.',
        title: 'No Update Available',
        detail: "Version " + this.version + " is the latest version."
      });
    };

    AutoUpdateManager.prototype.onUpdateError = function(event, message) {
      var dialog;
      autoUpdater.removeListener('update-not-available', this.onUpdateNotAvailable);
      dialog = require('electron').dialog;
      return dialog.showMessageBox({
        type: 'warning',
        buttons: ['OK'],
        icon: this.iconPath,
        message: 'There was an error checking for updates.',
        title: 'Update Error',
        detail: message
      });
    };

    AutoUpdateManager.prototype.getWindows = function() {
      return global.atomApplication.windows;
    };

    return AutoUpdateManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL21haW4tcHJvY2Vzcy9hdXRvLXVwZGF0ZS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMEtBQUE7SUFBQTs7RUFBQSxXQUFBLEdBQWM7O0VBQ2IsZUFBZ0IsT0FBQSxDQUFRLFFBQVI7O0VBQ2pCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxTQUFBLEdBQVk7O0VBQ1osYUFBQSxHQUFnQjs7RUFDaEIsZ0JBQUEsR0FBbUI7O0VBQ25CLG9CQUFBLEdBQXVCOztFQUN2QixzQkFBQSxHQUF5Qjs7RUFDekIsZ0JBQUEsR0FBbUI7O0VBQ25CLFVBQUEsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osTUFBTSxDQUFDLE1BQVAsQ0FBYyxpQkFBQyxDQUFBLFNBQWYsRUFBMEIsWUFBWSxDQUFDLFNBQXZDOztJQUVhLDJCQUFDLE9BQUQsRUFBVyxRQUFYLEVBQXNCLFlBQXRCLEVBQW9DLE1BQXBDO01BQUMsSUFBQyxDQUFBLFVBQUQ7TUFBVSxJQUFDLENBQUEsV0FBRDtNQUF5QixJQUFDLENBQUEsU0FBRDs7O01BQy9DLElBQUMsQ0FBQSxLQUFELEdBQVM7TUFDVCxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUFvQyxXQUFwQyxFQUFpRCxVQUFqRDtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVcsc0NBQUEsR0FBdUMsSUFBQyxDQUFBO01BQ25ELE9BQU8sQ0FBQyxRQUFSLENBQWlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEs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QUZQO1FBR0EsT0FBQSxFQUFTLDBDQUhUO1FBSUEsS0FBQSxFQUFPLGNBSlA7UUFLQSxNQUFBLEVBQVEsT0FMUjtPQURGO0lBSGE7O2dDQVdmLFVBQUEsR0FBWSxTQUFBO2FBQ1YsTUFBTSxDQUFDLGVBQWUsQ0FBQztJQURiOzs7OztBQTFJZCIsInNvdXJjZXNDb250ZW50IjpbImF1dG9VcGRhdGVyID0gbnVsbFxue0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuSWRsZVN0YXRlID0gJ2lkbGUnXG5DaGVja2luZ1N0YXRlID0gJ2NoZWNraW5nJ1xuRG93bmxvYWRpbmdTdGF0ZSA9ICdkb3dubG9hZGluZydcblVwZGF0ZUF2YWlsYWJsZVN0YXRlID0gJ3VwZGF0ZS1hdmFpbGFibGUnXG5Ob1VwZGF0ZUF2YWlsYWJsZVN0YXRlID0gJ25vLXVwZGF0ZS1hdmFpbGFibGUnXG5VbnN1cHBvcnRlZFN0YXRlID0gJ3Vuc3VwcG9ydGVkJ1xuRXJyb3JTdGF0ZSA9ICdlcnJvcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQXV0b1VwZGF0ZU1hbmFnZXJcbiAgT2JqZWN0LmFzc2lnbiBAcHJvdG90eXBlLCBFdmVudEVtaXR0ZXIucHJvdG90eXBlXG5cbiAgY29uc3RydWN0b3I6IChAdmVyc2lvbiwgQHRlc3RNb2RlLCByZXNvdXJjZVBhdGgsIEBjb25maWcpIC0+XG4gICAgQHN0YXRlID0gSWRsZVN0YXRlXG4gICAgQGljb25QYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3Jlc291cmNlcycsICdhdG9tLnBuZycpXG4gICAgQGZlZWRVcmwgPSBcImh0dHBzOi8vYXRvbS5pby9hcGkvdXBkYXRlcz92ZXJzaW9uPSN7QHZlcnNpb259XCJcbiAgICBwcm9jZXNzLm5leHRUaWNrID0+IEBzZXR1cEF1dG9VcGRhdGVyKClcblxuICBzZXR1cEF1dG9VcGRhdGVyOiAtPlxuICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgICAgYXV0b1VwZGF0ZXIgPSByZXF1aXJlICcuL2F1dG8tdXBkYXRlci13aW4zMidcbiAgICBlbHNlXG4gICAgICB7YXV0b1VwZGF0ZXJ9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbiAgICBhdXRvVXBkYXRlci5vbiAnZXJyb3InLCAoZXZlbnQsIG1lc3NhZ2UpID0+XG4gICAgICBAc2V0U3RhdGUoRXJyb3JTdGF0ZSwgbWVzc2FnZSlcbiAgICAgIEBlbWl0V2luZG93RXZlbnQoJ3VwZGF0ZS1lcnJvcicpXG4gICAgICBjb25zb2xlLmVycm9yIFwiRXJyb3IgRG93bmxvYWRpbmcgVXBkYXRlOiAje21lc3NhZ2V9XCJcblxuICAgIGF1dG9VcGRhdGVyLnNldEZlZWRVUkwgQGZlZWRVcmxcblxuICAgIGF1dG9VcGRhdGVyLm9uICdjaGVja2luZy1mb3ItdXBkYXRlJywgPT5cbiAgICAgIEBzZXRTdGF0ZShDaGVja2luZ1N0YXRlKVxuICAgICAgQGVtaXRXaW5kb3dFdmVudCgnY2hlY2tpbmctZm9yLXVwZGF0ZScpXG5cbiAgICBhdXRvVXBkYXRlci5vbiAndXBkYXRlLW5vdC1hdmFpbGFibGUnLCA9PlxuICAgICAgQHNldFN0YXRlKE5vVXBkYXRlQXZhaWxhYmxlU3RhdGUpXG4gICAgICBAZW1pdFdpbmRvd0V2ZW50KCd1cGRhdGUtbm90LWF2YWlsYWJsZScpXG5cbiAgICBhdXRvVXBkYXRlci5vbiAndXBkYXRlLWF2YWlsYWJsZScsID0+XG4gICAgICBAc2V0U3RhdGUoRG93bmxvYWRpbmdTdGF0ZSlcbiAgICAgICMgV2UgdXNlIHNlbmRNZXNzYWdlIHRvIHNlbmQgYW4gZXZlbnQgY2FsbGVkICd1cGRhdGUtYXZhaWxhYmxlJyBpbiAndXBkYXRlLWRvd25sb2FkZWQnXG4gICAgICAjIG9uY2UgdGhlIHVwZGF0ZSBkb3dubG9hZCBpcyBjb21wbGV0ZS4gVGhpcyBtaXNtYXRjaCBiZXR3ZWVuIHRoZSBlbGVjdHJvblxuICAgICAgIyBhdXRvVXBkYXRlciBldmVudHMgaXMgdW5mb3J0dW5hdGUgYnV0IGluIHRoZSBpbnRlcmVzdCBvZiBub3QgY2hhbmdpbmcgdGhlXG4gICAgICAjIG9uZSBleGlzdGluZyBldmVudCBoYW5kbGVkIGJ5IGFwcGxpY2F0aW9uRGVsZWdhdGVcbiAgICAgIEBlbWl0V2luZG93RXZlbnQoJ2RpZC1iZWdpbi1kb3dubG9hZGluZy11cGRhdGUnKVxuICAgICAgQGVtaXQoJ2RpZC1iZWdpbi1kb3dubG9hZCcpXG5cbiAgICBhdXRvVXBkYXRlci5vbiAndXBkYXRlLWRvd25sb2FkZWQnLCAoZXZlbnQsIHJlbGVhc2VOb3RlcywgQHJlbGVhc2VWZXJzaW9uKSA9PlxuICAgICAgQHNldFN0YXRlKFVwZGF0ZUF2YWlsYWJsZVN0YXRlKVxuICAgICAgQGVtaXRVcGRhdGVBdmFpbGFibGVFdmVudCgpXG5cbiAgICBAY29uZmlnLm9uRGlkQ2hhbmdlICdjb3JlLmF1dG9tYXRpY2FsbHlVcGRhdGUnLCAoe25ld1ZhbHVlfSkgPT5cbiAgICAgIGlmIG5ld1ZhbHVlXG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZUNoZWNrKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGNhbmNlbFNjaGVkdWxlZFVwZGF0ZUNoZWNrKClcblxuICAgIEBzY2hlZHVsZVVwZGF0ZUNoZWNrKCkgaWYgQGNvbmZpZy5nZXQgJ2NvcmUuYXV0b21hdGljYWxseVVwZGF0ZSdcblxuICAgIHN3aXRjaCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICB3aGVuICd3aW4zMidcbiAgICAgICAgQHNldFN0YXRlKFVuc3VwcG9ydGVkU3RhdGUpIHVubGVzcyBhdXRvVXBkYXRlci5zdXBwb3J0c1VwZGF0ZXMoKVxuICAgICAgd2hlbiAnbGludXgnXG4gICAgICAgIEBzZXRTdGF0ZShVbnN1cHBvcnRlZFN0YXRlKVxuXG4gIGVtaXRVcGRhdGVBdmFpbGFibGVFdmVudDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEByZWxlYXNlVmVyc2lvbj9cbiAgICBAZW1pdFdpbmRvd0V2ZW50KCd1cGRhdGUtYXZhaWxhYmxlJywge0ByZWxlYXNlVmVyc2lvbn0pXG4gICAgcmV0dXJuXG5cbiAgZW1pdFdpbmRvd0V2ZW50OiAoZXZlbnROYW1lLCBwYXlsb2FkKSAtPlxuICAgIGZvciBhdG9tV2luZG93IGluIEBnZXRXaW5kb3dzKClcbiAgICAgIGF0b21XaW5kb3cuc2VuZE1lc3NhZ2UoZXZlbnROYW1lLCBwYXlsb2FkKVxuICAgIHJldHVyblxuXG4gIHNldFN0YXRlOiAoc3RhdGUsIGVycm9yTWVzc2FnZSkgLT5cbiAgICByZXR1cm4gaWYgQHN0YXRlIGlzIHN0YXRlXG4gICAgQHN0YXRlID0gc3RhdGVcbiAgICBAZXJyb3JNZXNzYWdlID0gZXJyb3JNZXNzYWdlXG4gICAgQGVtaXQgJ3N0YXRlLWNoYW5nZWQnLCBAc3RhdGVcblxuICBnZXRTdGF0ZTogLT5cbiAgICBAc3RhdGVcblxuICBnZXRFcnJvck1lc3NhZ2U6IC0+XG4gICAgQGVycm9yTWVzc2FnZVxuXG4gIHNjaGVkdWxlVXBkYXRlQ2hlY2s6IC0+XG4gICAgIyBPbmx5IHNjaGVkdWxlIHVwZGF0ZSBjaGVjayBwZXJpb2RpY2FsbHkgaWYgcnVubmluZyBpbiByZWxlYXNlIHZlcnNpb24gYW5kXG4gICAgIyBhbmQgdGhlcmUgaXMgbm8gZXhpc3Rpbmcgc2NoZWR1bGVkIHVwZGF0ZSBjaGVjay5cbiAgICB1bmxlc3MgL1xcd3s3fS8udGVzdChAdmVyc2lvbikgb3IgQGNoZWNrRm9yVXBkYXRlc0ludGVydmFsSURcbiAgICAgIGNoZWNrRm9yVXBkYXRlcyA9ID0+IEBjaGVjayhoaWRlUG9wdXBzOiB0cnVlKVxuICAgICAgZm91ckhvdXJzID0gMTAwMCAqIDYwICogNjAgKiA0XG4gICAgICBAY2hlY2tGb3JVcGRhdGVzSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGNoZWNrRm9yVXBkYXRlcywgZm91ckhvdXJzKVxuICAgICAgY2hlY2tGb3JVcGRhdGVzKClcblxuICBjYW5jZWxTY2hlZHVsZWRVcGRhdGVDaGVjazogLT5cbiAgICBpZiBAY2hlY2tGb3JVcGRhdGVzSW50ZXJ2YWxJRFxuICAgICAgY2xlYXJJbnRlcnZhbChAY2hlY2tGb3JVcGRhdGVzSW50ZXJ2YWxJRClcbiAgICAgIEBjaGVja0ZvclVwZGF0ZXNJbnRlcnZhbElEID0gbnVsbFxuXG4gIGNoZWNrOiAoe2hpZGVQb3B1cHN9PXt9KSAtPlxuICAgIHVubGVzcyBoaWRlUG9wdXBzXG4gICAgICBhdXRvVXBkYXRlci5vbmNlICd1cGRhdGUtbm90LWF2YWlsYWJsZScsIEBvblVwZGF0ZU5vdEF2YWlsYWJsZVxuICAgICAgYXV0b1VwZGF0ZXIub25jZSAnZXJyb3InLCBAb25VcGRhdGVFcnJvclxuXG4gICAgYXV0b1VwZGF0ZXIuY2hlY2tGb3JVcGRhdGVzKCkgdW5sZXNzIEB0ZXN0TW9kZVxuXG4gIGluc3RhbGw6IC0+XG4gICAgYXV0b1VwZGF0ZXIucXVpdEFuZEluc3RhbGwoKSB1bmxlc3MgQHRlc3RNb2RlXG5cbiAgb25VcGRhdGVOb3RBdmFpbGFibGU6ID0+XG4gICAgYXV0b1VwZGF0ZXIucmVtb3ZlTGlzdGVuZXIgJ2Vycm9yJywgQG9uVXBkYXRlRXJyb3JcbiAgICB7ZGlhbG9nfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuICAgIGRpYWxvZy5zaG93TWVzc2FnZUJveFxuICAgICAgdHlwZTogJ2luZm8nXG4gICAgICBidXR0b25zOiBbJ09LJ11cbiAgICAgIGljb246IEBpY29uUGF0aFxuICAgICAgbWVzc2FnZTogJ05vIHVwZGF0ZSBhdmFpbGFibGUuJ1xuICAgICAgdGl0bGU6ICdObyBVcGRhdGUgQXZhaWxhYmxlJ1xuICAgICAgZGV0YWlsOiBcIlZlcnNpb24gI3tAdmVyc2lvbn0gaXMgdGhlIGxhdGVzdCB2ZXJzaW9uLlwiXG5cbiAgb25VcGRhdGVFcnJvcjogKGV2ZW50LCBtZXNzYWdlKSA9PlxuICAgIGF1dG9VcGRhdGVyLnJlbW92ZUxpc3RlbmVyICd1cGRhdGUtbm90LWF2YWlsYWJsZScsIEBvblVwZGF0ZU5vdEF2YWlsYWJsZVxuICAgIHtkaWFsb2d9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG4gICAgZGlhbG9nLnNob3dNZXNzYWdlQm94XG4gICAgICB0eXBlOiAnd2FybmluZydcbiAgICAgIGJ1dHRvbnM6IFsnT0snXVxuICAgICAgaWNvbjogQGljb25QYXRoXG4gICAgICBtZXNzYWdlOiAnVGhlcmUgd2FzIGFuIGVycm9yIGNoZWNraW5nIGZvciB1cGRhdGVzLidcbiAgICAgIHRpdGxlOiAnVXBkYXRlIEVycm9yJ1xuICAgICAgZGV0YWlsOiBtZXNzYWdlXG5cbiAgZ2V0V2luZG93czogLT5cbiAgICBnbG9iYWwuYXRvbUFwcGxpY2F0aW9uLndpbmRvd3NcbiJdfQ==
