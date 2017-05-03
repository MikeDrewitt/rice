(function() {
  var ApplicationDelegate, Disposable, _, getWindowLoadSettings, ipcHelpers, ipcRenderer, ref, ref1, remote, screen, setWindowLoadSettings, shell, webFrame,
    slice = [].slice;

  _ = require('underscore-plus');

  ref = require('electron'), screen = ref.screen, ipcRenderer = ref.ipcRenderer, remote = ref.remote, shell = ref.shell, webFrame = ref.webFrame;

  ipcHelpers = require('./ipc-helpers');

  Disposable = require('event-kit').Disposable;

  ref1 = require('./window-load-settings-helpers'), getWindowLoadSettings = ref1.getWindowLoadSettings, setWindowLoadSettings = ref1.setWindowLoadSettings;

  module.exports = ApplicationDelegate = (function() {
    function ApplicationDelegate() {}

    ApplicationDelegate.prototype.open = function(params) {
      return ipcRenderer.send('open', params);
    };

    ApplicationDelegate.prototype.pickFolder = function(callback) {
      var responseChannel;
      responseChannel = "atom-pick-folder-response";
      ipcRenderer.on(responseChannel, function(event, path) {
        ipcRenderer.removeAllListeners(responseChannel);
        return callback(path);
      });
      return ipcRenderer.send("pick-folder", responseChannel);
    };

    ApplicationDelegate.prototype.getCurrentWindow = function() {
      return remote.getCurrentWindow();
    };

    ApplicationDelegate.prototype.closeWindow = function() {
      return ipcHelpers.call('window-method', 'close');
    };

    ApplicationDelegate.prototype.getTemporaryWindowState = function() {
      return ipcHelpers.call('get-temporary-window-state').then(function(stateJSON) {
        return JSON.parse(stateJSON);
      });
    };

    ApplicationDelegate.prototype.setTemporaryWindowState = function(state) {
      return ipcHelpers.call('set-temporary-window-state', JSON.stringify(state));
    };

    ApplicationDelegate.prototype.getWindowSize = function() {
      var height, ref2, width;
      ref2 = remote.getCurrentWindow().getSize(), width = ref2[0], height = ref2[1];
      return {
        width: width,
        height: height
      };
    };

    ApplicationDelegate.prototype.setWindowSize = function(width, height) {
      return ipcHelpers.call('set-window-size', width, height);
    };

    ApplicationDelegate.prototype.getWindowPosition = function() {
      var ref2, x, y;
      ref2 = remote.getCurrentWindow().getPosition(), x = ref2[0], y = ref2[1];
      return {
        x: x,
        y: y
      };
    };

    ApplicationDelegate.prototype.setWindowPosition = function(x, y) {
      return ipcHelpers.call('set-window-position', x, y);
    };

    ApplicationDelegate.prototype.centerWindow = function() {
      return ipcHelpers.call('center-window');
    };

    ApplicationDelegate.prototype.focusWindow = function() {
      return ipcHelpers.call('focus-window');
    };

    ApplicationDelegate.prototype.showWindow = function() {
      return ipcHelpers.call('show-window');
    };

    ApplicationDelegate.prototype.hideWindow = function() {
      return ipcHelpers.call('hide-window');
    };

    ApplicationDelegate.prototype.reloadWindow = function() {
      return ipcHelpers.call('window-method', 'reload');
    };

    ApplicationDelegate.prototype.restartApplication = function() {
      return ipcRenderer.send("restart-application");
    };

    ApplicationDelegate.prototype.minimizeWindow = function() {
      return ipcHelpers.call('window-method', 'minimize');
    };

    ApplicationDelegate.prototype.isWindowMaximized = function() {
      return remote.getCurrentWindow().isMaximized();
    };

    ApplicationDelegate.prototype.maximizeWindow = function() {
      return ipcHelpers.call('window-method', 'maximize');
    };

    ApplicationDelegate.prototype.unmaximizeWindow = function() {
      return ipcHelpers.call('window-method', 'unmaximize');
    };

    ApplicationDelegate.prototype.isWindowFullScreen = function() {
      return remote.getCurrentWindow().isFullScreen();
    };

    ApplicationDelegate.prototype.setWindowFullScreen = function(fullScreen) {
      if (fullScreen == null) {
        fullScreen = false;
      }
      return ipcHelpers.call('window-method', 'setFullScreen', fullScreen);
    };

    ApplicationDelegate.prototype.openWindowDevTools = function() {
      return new Promise(process.nextTick).then(function() {
        return ipcHelpers.call('window-method', 'openDevTools');
      });
    };

    ApplicationDelegate.prototype.closeWindowDevTools = function() {
      return new Promise(process.nextTick).then(function() {
        return ipcHelpers.call('window-method', 'closeDevTools');
      });
    };

    ApplicationDelegate.prototype.toggleWindowDevTools = function() {
      return new Promise(process.nextTick).then(function() {
        return ipcHelpers.call('window-method', 'toggleDevTools');
      });
    };

    ApplicationDelegate.prototype.executeJavaScriptInWindowDevTools = function(code) {
      return ipcRenderer.send("execute-javascript-in-dev-tools", code);
    };

    ApplicationDelegate.prototype.setWindowDocumentEdited = function(edited) {
      return ipcHelpers.call('window-method', 'setDocumentEdited', edited);
    };

    ApplicationDelegate.prototype.setRepresentedFilename = function(filename) {
      return ipcHelpers.call('window-method', 'setRepresentedFilename', filename);
    };

    ApplicationDelegate.prototype.addRecentDocument = function(filename) {
      return ipcRenderer.send("add-recent-document", filename);
    };

    ApplicationDelegate.prototype.setRepresentedDirectoryPaths = function(paths) {
      var loadSettings;
      loadSettings = getWindowLoadSettings();
      loadSettings['initialPaths'] = paths;
      return setWindowLoadSettings(loadSettings);
    };

    ApplicationDelegate.prototype.setAutoHideWindowMenuBar = function(autoHide) {
      return ipcHelpers.call('window-method', 'setAutoHideMenuBar', autoHide);
    };

    ApplicationDelegate.prototype.setWindowMenuBarVisibility = function(visible) {
      return remote.getCurrentWindow().setMenuBarVisibility(visible);
    };

    ApplicationDelegate.prototype.getPrimaryDisplayWorkAreaSize = function() {
      return remote.screen.getPrimaryDisplay().workAreaSize;
    };

    ApplicationDelegate.prototype.getUserDefault = function(key, type) {
      return remote.systemPreferences.getUserDefault(key, type);
    };

    ApplicationDelegate.prototype.confirm = function(arg) {
      var buttonLabels, buttons, callback, chosen, detailedMessage, message;
      message = arg.message, detailedMessage = arg.detailedMessage, buttons = arg.buttons;
      if (buttons == null) {
        buttons = {};
      }
      if (_.isArray(buttons)) {
        buttonLabels = buttons;
      } else {
        buttonLabels = Object.keys(buttons);
      }
      chosen = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        type: 'info',
        message: message,
        detail: detailedMessage,
        buttons: buttonLabels
      });
      if (_.isArray(buttons)) {
        return chosen;
      } else {
        callback = buttons[buttonLabels[chosen]];
        return typeof callback === "function" ? callback() : void 0;
      }
    };

    ApplicationDelegate.prototype.showMessageDialog = function(params) {};

    ApplicationDelegate.prototype.showSaveDialog = function(params) {
      if (_.isString(params)) {
        params = {
          defaultPath: params
        };
      } else {
        params = _.clone(params);
      }
      if (params.title == null) {
        params.title = 'Save File';
      }
      if (params.defaultPath == null) {
        params.defaultPath = getWindowLoadSettings().initialPaths[0];
      }
      return remote.dialog.showSaveDialog(remote.getCurrentWindow(), params);
    };

    ApplicationDelegate.prototype.playBeepSound = function() {
      return shell.beep();
    };

    ApplicationDelegate.prototype.onDidOpenLocations = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'open-locations') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onUpdateAvailable = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'did-begin-downloading-update') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onDidBeginDownloadingUpdate = function(callback) {
      return this.onUpdateAvailable(callback);
    };

    ApplicationDelegate.prototype.onDidBeginCheckingForUpdate = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'checking-for-update') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onDidCompleteDownloadingUpdate = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'update-available') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onUpdateNotAvailable = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'update-not-available') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onUpdateError = function(callback) {
      var outerCallback;
      outerCallback = function(event, message, detail) {
        if (message === 'update-error') {
          return callback(detail);
        }
      };
      ipcRenderer.on('message', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('message', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onApplicationMenuCommand = function(callback) {
      var outerCallback;
      outerCallback = function() {
        var args, event;
        event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return callback.apply(null, args);
      };
      ipcRenderer.on('command', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('command', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onContextMenuCommand = function(callback) {
      var outerCallback;
      outerCallback = function() {
        var args, event;
        event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return callback.apply(null, args);
      };
      ipcRenderer.on('context-command', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('context-command', outerCallback);
      });
    };

    ApplicationDelegate.prototype.onSaveWindowStateRequest = function(callback) {
      var outerCallback;
      outerCallback = function(event, message) {
        return callback(event);
      };
      ipcRenderer.on('save-window-state', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('save-window-state', outerCallback);
      });
    };

    ApplicationDelegate.prototype.didSaveWindowState = function() {
      return ipcRenderer.send('did-save-window-state');
    };

    ApplicationDelegate.prototype.didCancelWindowUnload = function() {
      return ipcRenderer.send('did-cancel-window-unload');
    };

    ApplicationDelegate.prototype.onDidChangeHistoryManager = function(callback) {
      var outerCallback;
      outerCallback = function(event, message) {
        return callback(event);
      };
      ipcRenderer.on('did-change-history-manager', outerCallback);
      return new Disposable(function() {
        return ipcRenderer.removeListener('did-change-history-manager', outerCallback);
      });
    };

    ApplicationDelegate.prototype.didChangeHistoryManager = function() {
      return ipcRenderer.send('did-change-history-manager');
    };

    ApplicationDelegate.prototype.openExternal = function(url) {
      return shell.openExternal(url);
    };

    ApplicationDelegate.prototype.disableZoom = function() {
      var outerCallback;
      outerCallback = function() {
        return webFrame.setZoomLevelLimits(1, 1);
      };
      outerCallback();
      screen.on('display-added', outerCallback);
      screen.on('display-removed', outerCallback);
      return new Disposable(function() {
        screen.removeListener('display-added', outerCallback);
        return screen.removeListener('display-removed', outerCallback);
      });
    };

    ApplicationDelegate.prototype.checkForUpdate = function() {
      return ipcRenderer.send('command', 'application:check-for-update');
    };

    ApplicationDelegate.prototype.restartAndInstallUpdate = function() {
      return ipcRenderer.send('command', 'application:install-update');
    };

    ApplicationDelegate.prototype.getAutoUpdateManagerState = function() {
      return ipcRenderer.sendSync('get-auto-update-manager-state');
    };

    ApplicationDelegate.prototype.getAutoUpdateManagerErrorMessage = function() {
      return ipcRenderer.sendSync('get-auto-update-manager-error');
    };

    ApplicationDelegate.prototype.emitWillSavePath = function(path) {
      return ipcRenderer.sendSync('will-save-path', path);
    };

    ApplicationDelegate.prototype.emitDidSavePath = function(path) {
      return ipcRenderer.sendSync('did-save-path', path);
    };

    return ApplicationDelegate;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9hcHBsaWNhdGlvbi1kZWxlZ2F0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFKQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpRCxPQUFBLENBQVEsVUFBUixDQUFqRCxFQUFDLG1CQUFELEVBQVMsNkJBQVQsRUFBc0IsbUJBQXRCLEVBQThCLGlCQUE5QixFQUFxQzs7RUFDckMsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUNaLGFBQWMsT0FBQSxDQUFRLFdBQVI7O0VBQ2YsT0FBaUQsT0FBQSxDQUFRLGdDQUFSLENBQWpELEVBQUMsa0RBQUQsRUFBd0I7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztrQ0FDSixJQUFBLEdBQU0sU0FBQyxNQUFEO2FBQ0osV0FBVyxDQUFDLElBQVosQ0FBaUIsTUFBakIsRUFBeUIsTUFBekI7SUFESTs7a0NBR04sVUFBQSxHQUFZLFNBQUMsUUFBRDtBQUNWLFVBQUE7TUFBQSxlQUFBLEdBQWtCO01BQ2xCLFdBQVcsQ0FBQyxFQUFaLENBQWUsZUFBZixFQUFnQyxTQUFDLEtBQUQsRUFBUSxJQUFSO1FBQzlCLFdBQVcsQ0FBQyxrQkFBWixDQUErQixlQUEvQjtlQUNBLFFBQUEsQ0FBUyxJQUFUO01BRjhCLENBQWhDO2FBR0EsV0FBVyxDQUFDLElBQVosQ0FBaUIsYUFBakIsRUFBZ0MsZUFBaEM7SUFMVTs7a0NBT1osZ0JBQUEsR0FBa0IsU0FBQTthQUNoQixNQUFNLENBQUMsZ0JBQVAsQ0FBQTtJQURnQjs7a0NBR2xCLFdBQUEsR0FBYSxTQUFBO2FBQ1gsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsZUFBaEIsRUFBaUMsT0FBakM7SUFEVzs7a0NBR2IsdUJBQUEsR0FBeUIs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QUEsR0FBMkIsU0FBQTthQUN6QixXQUFXLENBQUMsUUFBWixDQUFxQiwrQkFBckI7SUFEeUI7O2tDQUczQixnQ0FBQSxHQUFrQyxTQUFBO2FBQ2hDLFdBQVcsQ0FBQyxRQUFaLENBQXFCLCtCQUFyQjtJQURnQzs7a0NBR2xDLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDthQUNoQixXQUFXLENBQUMsUUFBWixDQUFxQixnQkFBckIsRUFBdUMsSUFBdkM7SUFEZ0I7O2tDQUdsQixlQUFBLEdBQWlCLFNBQUMsSUFBRDthQUNmLFdBQVcsQ0FBQyxRQUFaLENBQXFCLGVBQXJCLEVBQXNDLElBQXRDO0lBRGU7Ozs7O0FBalNuQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57c2NyZWVuLCBpcGNSZW5kZXJlciwgcmVtb3RlLCBzaGVsbCwgd2ViRnJhbWV9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5pcGNIZWxwZXJzID0gcmVxdWlyZSAnLi9pcGMtaGVscGVycydcbntEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbntnZXRXaW5kb3dMb2FkU2V0dGluZ3MsIHNldFdpbmRvd0xvYWRTZXR0aW5nc30gPSByZXF1aXJlICcuL3dpbmRvdy1sb2FkLXNldHRpbmdzLWhlbHBlcnMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEFwcGxpY2F0aW9uRGVsZWdhdGVcbiAgb3BlbjogKHBhcmFtcykgLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kKCdvcGVuJywgcGFyYW1zKVxuXG4gIHBpY2tGb2xkZXI6IChjYWxsYmFjaykgLT5cbiAgICByZXNwb25zZUNoYW5uZWwgPSBcImF0b20tcGljay1mb2xkZXItcmVzcG9uc2VcIlxuICAgIGlwY1JlbmRlcmVyLm9uIHJlc3BvbnNlQ2hhbm5lbCwgKGV2ZW50LCBwYXRoKSAtPlxuICAgICAgaXBjUmVuZGVyZXIucmVtb3ZlQWxsTGlzdGVuZXJzKHJlc3BvbnNlQ2hhbm5lbClcbiAgICAgIGNhbGxiYWNrKHBhdGgpXG4gICAgaXBjUmVuZGVyZXIuc2VuZChcInBpY2stZm9sZGVyXCIsIHJlc3BvbnNlQ2hhbm5lbClcblxuICBnZXRDdXJyZW50V2luZG93OiAtPlxuICAgIHJlbW90ZS5nZXRDdXJyZW50V2luZG93KClcblxuICBjbG9zZVdpbmRvdzogLT5cbiAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAnY2xvc2UnKVxuXG4gIGdldFRlbXBvcmFyeVdpbmRvd1N0YXRlOiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnZ2V0LXRlbXBvcmFyeS13aW5kb3ctc3RhdGUnKS50aGVuIChzdGF0ZUpTT04pIC0+IEpTT04ucGFyc2Uoc3RhdGVKU09OKVxuXG4gIHNldFRlbXBvcmFyeVdpbmRvd1N0YXRlOiAoc3RhdGUpIC0+XG4gICAgaXBjSGVscGVycy5jYWxsKCdzZXQtdGVtcG9yYXJ5LXdpbmRvdy1zdGF0ZScsIEpTT04uc3RyaW5naWZ5KHN0YXRlKSlcblxuICBnZXRXaW5kb3dTaXplOiAtPlxuICAgIFt3aWR0aCwgaGVpZ2h0XSA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCkuZ2V0U2l6ZSgpXG4gICAge3dpZHRoLCBoZWlnaHR9XG5cbiAgc2V0V2luZG93U2l6ZTogKHdpZHRoLCBoZWlnaHQpIC0+XG4gICAgaXBjSGVscGVycy5jYWxsKCdzZXQtd2luZG93LXNpemUnLCB3aWR0aCwgaGVpZ2h0KVxuXG4gIGdldFdpbmRvd1Bvc2l0aW9uOiAtPlxuICAgIFt4LCB5XSA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCkuZ2V0UG9zaXRpb24oKVxuICAgIHt4LCB5fVxuXG4gIHNldFdpbmRvd1Bvc2l0aW9uOiAoeCwgeSkgLT5cbiAgICBpcGNIZWxwZXJzLmNhbGwoJ3NldC13aW5kb3ctcG9zaXRpb24nLCB4LCB5KVxuXG4gIGNlbnRlcldpbmRvdzogLT5cbiAgICBpcGNIZWxwZXJzLmNhbGwoJ2NlbnRlci13aW5kb3cnKVxuXG4gIGZvY3VzV2luZG93OiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnZm9jdXMtd2luZG93JylcblxuICBzaG93V2luZG93OiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnc2hvdy13aW5kb3cnKVxuXG4gIGhpZGVXaW5kb3c6IC0+XG4gICAgaXBjSGVscGVycy5jYWxsKCdoaWRlLXdpbmRvdycpXG5cbiAgcmVsb2FkV2luZG93OiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdyZWxvYWQnKVxuXG4gIHJlc3RhcnRBcHBsaWNhdGlvbjogLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kKFwicmVzdGFydC1hcHBsaWNhdGlvblwiKVxuXG4gIG1pbmltaXplV2luZG93OiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdtaW5pbWl6ZScpXG5cbiAgaXNXaW5kb3dNYXhpbWl6ZWQ6IC0+XG4gICAgcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKS5pc01heGltaXplZCgpXG5cbiAgbWF4aW1pemVXaW5kb3c6IC0+XG4gICAgaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ21heGltaXplJylcblxuICB1bm1heGltaXplV2luZG93OiAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICd1bm1heGltaXplJylcblxuICBpc1dpbmRvd0Z1bGxTY3JlZW46IC0+XG4gICAgcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKS5pc0Z1bGxTY3JlZW4oKVxuXG4gIHNldFdpbmRvd0Z1bGxTY3JlZW46IChmdWxsU2NyZWVuPWZhbHNlKSAtPlxuICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdzZXRGdWxsU2NyZWVuJywgZnVsbFNjcmVlbilcblxuICBvcGVuV2luZG93RGV2VG9vbHM6IC0+XG4gICAgIyBEZWZlciBEZXZUb29scyBpbnRlcmFjdGlvbiB0byB0aGUgbmV4dCB0aWNrLCBiZWNhdXNlIHVzaW5nIHRoZW0gZHVyaW5nXG4gICAgIyBldmVudCBoYW5kbGluZyBjYXVzZXMgc29tZSB3cm9uZyBpbnB1dCBldmVudHMgdG8gYmUgdHJpZ2dlcmVkIG9uXG4gICAgIyBgVGV4dEVkaXRvckNvbXBvbmVudGAgKFJlZi46IGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzk2OTcpLlxuICAgIG5ldyBQcm9taXNlKHByb2Nlc3MubmV4dFRpY2spLnRoZW4oLT4gaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ29wZW5EZXZUb29scycpKVxuXG4gIGNsb3NlV2luZG93RGV2VG9vbHM6IC0+XG4gICAgIyBEZWZlciBEZXZUb29scyBpbnRlcmFjdGlvbiB0byB0aGUgbmV4dCB0aWNrLCBiZWNhdXNlIHVzaW5nIHRoZW0gZHVyaW5nXG4gICAgIyBldmVudCBoYW5kbGluZyBjYXVzZXMgc29tZSB3cm9uZyBpbnB1dCBldmVudHMgdG8gYmUgdHJpZ2dlcmVkIG9uXG4gICAgIyBgVGV4dEVkaXRvckNvbXBvbmVudGAgKFJlZi46IGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzk2OTcpLlxuICAgIG5ldyBQcm9taXNlKHByb2Nlc3MubmV4dFRpY2spLnRoZW4oLT4gaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ2Nsb3NlRGV2VG9vbHMnKSlcblxuICB0b2dnbGVXaW5kb3dEZXZUb29sczogLT5cbiAgICAjIERlZmVyIERldlRvb2xzIGludGVyYWN0aW9uIHRvIHRoZSBuZXh0IHRpY2ssIGJlY2F1c2UgdXNpbmcgdGhlbSBkdXJpbmdcbiAgICAjIGV2ZW50IGhhbmRsaW5nIGNhdXNlcyBzb21lIHdyb25nIGlucHV0IGV2ZW50cyB0byBiZSB0cmlnZ2VyZWQgb25cbiAgICAjIGBUZXh0RWRpdG9yQ29tcG9uZW50YCAoUmVmLjogaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvOTY5NykuXG4gICAgbmV3IFByb21pc2UocHJvY2Vzcy5uZXh0VGljaykudGhlbigtPiBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAndG9nZ2xlRGV2VG9vbHMnKSlcblxuICBleGVjdXRlSmF2YVNjcmlwdEluV2luZG93RGV2VG9vbHM6IChjb2RlKSAtPlxuICAgIGlwY1JlbmRlcmVyLnNlbmQoXCJleGVjdXRlLWphdmFzY3JpcHQtaW4tZGV2LXRvb2xzXCIsIGNvZGUpXG5cbiAgc2V0V2luZG93RG9jdW1lbnRFZGl0ZWQ6IChlZGl0ZWQpIC0+XG4gICAgaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ3NldERvY3VtZW50RWRpdGVkJywgZWRpdGVkKVxuXG4gIHNldFJlcHJlc2VudGVkRmlsZW5hbWU6IChmaWxlbmFtZSkgLT5cbiAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAnc2V0UmVwcmVzZW50ZWRGaWxlbmFtZScsIGZpbGVuYW1lKVxuXG4gIGFkZFJlY2VudERvY3VtZW50OiAoZmlsZW5hbWUpIC0+XG4gICAgaXBjUmVuZGVyZXIuc2VuZChcImFkZC1yZWNlbnQtZG9jdW1lbnRcIiwgZmlsZW5hbWUpXG5cbiAgc2V0UmVwcmVzZW50ZWREaXJlY3RvcnlQYXRoczogKHBhdGhzKSAtPlxuICAgIGxvYWRTZXR0aW5ncyA9IGdldFdpbmRvd0xvYWRTZXR0aW5ncygpXG4gICAgbG9hZFNldHRpbmdzWydpbml0aWFsUGF0aHMnXSA9IHBhdGhzXG4gICAgc2V0V2luZG93TG9hZFNldHRpbmdzKGxvYWRTZXR0aW5ncylcblxuICBzZXRBdXRvSGlkZVdpbmRvd01lbnVCYXI6IChhdXRvSGlkZSkgLT5cbiAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAnc2V0QXV0b0hpZGVNZW51QmFyJywgYXV0b0hpZGUpXG5cbiAgc2V0V2luZG93TWVudUJhclZpc2liaWxpdHk6ICh2aXNpYmxlKSAtPlxuICAgIHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCkuc2V0TWVudUJhclZpc2liaWxpdHkodmlzaWJsZSlcblxuICBnZXRQcmltYXJ5RGlzcGxheVdvcmtBcmVhU2l6ZTogLT5cbiAgICByZW1vdGUuc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgZ2V0VXNlckRlZmF1bHQ6IChrZXksIHR5cGUpIC0+XG4gICAgcmVtb3RlLnN5c3RlbVByZWZlcmVuY2VzLmdldFVzZXJEZWZhdWx0KGtleSwgdHlwZSlcblxuICBjb25maXJtOiAoe21lc3NhZ2UsIGRldGFpbGVkTWVzc2FnZSwgYnV0dG9uc30pIC0+XG4gICAgYnV0dG9ucyA/PSB7fVxuICAgIGlmIF8uaXNBcnJheShidXR0b25zKVxuICAgICAgYnV0dG9uTGFiZWxzID0gYnV0dG9uc1xuICAgIGVsc2VcbiAgICAgIGJ1dHRvbkxhYmVscyA9IE9iamVjdC5rZXlzKGJ1dHRvbnMpXG5cbiAgICBjaG9zZW4gPSByZW1vdGUuZGlhbG9nLnNob3dNZXNzYWdlQm94KHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCksIHtcbiAgICAgIHR5cGU6ICdpbmZvJ1xuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgICAgZGV0YWlsOiBkZXRhaWxlZE1lc3NhZ2VcbiAgICAgIGJ1dHRvbnM6IGJ1dHRvbkxhYmVsc1xuICAgIH0pXG5cbiAgICBpZiBfLmlzQXJyYXkoYnV0dG9ucylcbiAgICAgIGNob3NlblxuICAgIGVsc2VcbiAgICAgIGNhbGxiYWNrID0gYnV0dG9uc1tidXR0b25MYWJlbHNbY2hvc2VuXV1cbiAgICAgIGNhbGxiYWNrPygpXG5cbiAgc2hvd01lc3NhZ2VEaWFsb2c6IChwYXJhbXMpIC0+XG5cbiAgc2hvd1NhdmVEaWFsb2c6IChwYXJhbXMpIC0+XG4gICAgaWYgXy5pc1N0cmluZyhwYXJhbXMpXG4gICAgICBwYXJhbXMgPSBkZWZhdWx0UGF0aDogcGFyYW1zXG4gICAgZWxzZVxuICAgICAgcGFyYW1zID0gXy5jbG9uZShwYXJhbXMpXG4gICAgcGFyYW1zLnRpdGxlID89ICdTYXZlIEZpbGUnXG4gICAgcGFyYW1zLmRlZmF1bHRQYXRoID89IGdldFdpbmRvd0xvYWRTZXR0aW5ncygpLmluaXRpYWxQYXRoc1swXVxuICAgIHJlbW90ZS5kaWFsb2cuc2hvd1NhdmVEaWFsb2cgcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKSwgcGFyYW1zXG5cbiAgcGxheUJlZXBTb3VuZDogLT5cbiAgICBzaGVsbC5iZWVwKClcblxuICBvbkRpZE9wZW5Mb2NhdGlvbnM6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBtZXNzYWdlLCBkZXRhaWwpIC0+XG4gICAgICBjYWxsYmFjayhkZXRhaWwpIGlmIG1lc3NhZ2UgaXMgJ29wZW4tbG9jYXRpb25zJ1xuXG4gICAgaXBjUmVuZGVyZXIub24oJ21lc3NhZ2UnLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIG91dGVyQ2FsbGJhY2spXG5cbiAgb25VcGRhdGVBdmFpbGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBtZXNzYWdlLCBkZXRhaWwpIC0+XG4gICAgICAjIFRPRE86IFllcywgdGhpcyBpcyBzdHJhbmdlIHRoYXQgYG9uVXBkYXRlQXZhaWxhYmxlYCBpcyBsaXN0ZW5pbmcgZm9yXG4gICAgICAjIGBkaWQtYmVnaW4tZG93bmxvYWRpbmctdXBkYXRlYC4gV2UgY3VycmVudGx5IGhhdmUgbm8gbWVjaGFuaXNtIHRvIGtub3dcbiAgICAgICMgaWYgdGhlcmUgaXMgYW4gdXBkYXRlLCBzbyBiZWdpbiBvZiBkb3dubG9hZGluZyBpcyBhIGdvb2QgcHJveHkuXG4gICAgICBjYWxsYmFjayhkZXRhaWwpIGlmIG1lc3NhZ2UgaXMgJ2RpZC1iZWdpbi1kb3dubG9hZGluZy11cGRhdGUnXG5cbiAgICBpcGNSZW5kZXJlci5vbignbWVzc2FnZScsIG91dGVyQ2FsbGJhY2spXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKCdtZXNzYWdlJywgb3V0ZXJDYWxsYmFjaylcblxuICBvbkRpZEJlZ2luRG93bmxvYWRpbmdVcGRhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAb25VcGRhdGVBdmFpbGFibGUoY2FsbGJhY2spXG5cbiAgb25EaWRCZWdpbkNoZWNraW5nRm9yVXBkYXRlOiAoY2FsbGJhY2spIC0+XG4gICAgb3V0ZXJDYWxsYmFjayA9IChldmVudCwgbWVzc2FnZSwgZGV0YWlsKSAtPlxuICAgICAgY2FsbGJhY2soZGV0YWlsKSBpZiBtZXNzYWdlIGlzICdjaGVja2luZy1mb3ItdXBkYXRlJ1xuXG4gICAgaXBjUmVuZGVyZXIub24oJ21lc3NhZ2UnLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIG91dGVyQ2FsbGJhY2spXG5cbiAgb25EaWRDb21wbGV0ZURvd25sb2FkaW5nVXBkYXRlOiAoY2FsbGJhY2spIC0+XG4gICAgb3V0ZXJDYWxsYmFjayA9IChldmVudCwgbWVzc2FnZSwgZGV0YWlsKSAtPlxuICAgICAgIyBUT0RPOiBXZSBjb3VsZCByZW5hbWUgdGhpcyBldmVudCB0byBgZGlkLWNvbXBsZXRlLWRvd25sb2FkaW5nLXVwZGF0ZWBcbiAgICAgIGNhbGxiYWNrKGRldGFpbCkgaWYgbWVzc2FnZSBpcyAndXBkYXRlLWF2YWlsYWJsZSdcblxuICAgIGlwY1JlbmRlcmVyLm9uKCdtZXNzYWdlJywgb3V0ZXJDYWxsYmFjaylcbiAgICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ21lc3NhZ2UnLCBvdXRlckNhbGxiYWNrKVxuXG4gIG9uVXBkYXRlTm90QXZhaWxhYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgb3V0ZXJDYWxsYmFjayA9IChldmVudCwgbWVzc2FnZSwgZGV0YWlsKSAtPlxuICAgICAgY2FsbGJhY2soZGV0YWlsKSBpZiBtZXNzYWdlIGlzICd1cGRhdGUtbm90LWF2YWlsYWJsZSdcblxuICAgIGlwY1JlbmRlcmVyLm9uKCdtZXNzYWdlJywgb3V0ZXJDYWxsYmFjaylcbiAgICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ21lc3NhZ2UnLCBvdXRlckNhbGxiYWNrKVxuXG4gIG9uVXBkYXRlRXJyb3I6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBtZXNzYWdlLCBkZXRhaWwpIC0+XG4gICAgICBjYWxsYmFjayhkZXRhaWwpIGlmIG1lc3NhZ2UgaXMgJ3VwZGF0ZS1lcnJvcidcblxuICAgIGlwY1JlbmRlcmVyLm9uKCdtZXNzYWdlJywgb3V0ZXJDYWxsYmFjaylcbiAgICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ21lc3NhZ2UnLCBvdXRlckNhbGxiYWNrKVxuXG4gIG9uQXBwbGljYXRpb25NZW51Q29tbWFuZDogKGNhbGxiYWNrKSAtPlxuICAgIG91dGVyQ2FsbGJhY2sgPSAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgICBjYWxsYmFjayhhcmdzLi4uKVxuXG4gICAgaXBjUmVuZGVyZXIub24oJ2NvbW1hbmQnLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignY29tbWFuZCcsIG91dGVyQ2FsbGJhY2spXG5cbiAgb25Db250ZXh0TWVudUNvbW1hbmQ6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBhcmdzLi4uKSAtPlxuICAgICAgY2FsbGJhY2soYXJncy4uLilcblxuICAgIGlwY1JlbmRlcmVyLm9uKCdjb250ZXh0LWNvbW1hbmQnLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignY29udGV4dC1jb21tYW5kJywgb3V0ZXJDYWxsYmFjaylcblxuICBvblNhdmVXaW5kb3dTdGF0ZVJlcXVlc3Q6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBtZXNzYWdlKSAtPlxuICAgICAgY2FsbGJhY2soZXZlbnQpXG5cbiAgICBpcGNSZW5kZXJlci5vbignc2F2ZS13aW5kb3ctc3RhdGUnLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignc2F2ZS13aW5kb3ctc3RhdGUnLCBvdXRlckNhbGxiYWNrKVxuXG4gIGRpZFNhdmVXaW5kb3dTdGF0ZTogLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kKCdkaWQtc2F2ZS13aW5kb3ctc3RhdGUnKVxuXG4gIGRpZENhbmNlbFdpbmRvd1VubG9hZDogLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kKCdkaWQtY2FuY2VsLXdpbmRvdy11bmxvYWQnKVxuXG4gIG9uRGlkQ2hhbmdlSGlzdG9yeU1hbmFnZXI6IChjYWxsYmFjaykgLT5cbiAgICBvdXRlckNhbGxiYWNrID0gKGV2ZW50LCBtZXNzYWdlKSAtPlxuICAgICAgY2FsbGJhY2soZXZlbnQpXG5cbiAgICBpcGNSZW5kZXJlci5vbignZGlkLWNoYW5nZS1oaXN0b3J5LW1hbmFnZXInLCBvdXRlckNhbGxiYWNrKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignZGlkLWNoYW5nZS1oaXN0b3J5LW1hbmFnZXInLCBvdXRlckNhbGxiYWNrKVxuXG4gIGRpZENoYW5nZUhpc3RvcnlNYW5hZ2VyOiAtPlxuICAgIGlwY1JlbmRlcmVyLnNlbmQoJ2RpZC1jaGFuZ2UtaGlzdG9yeS1tYW5hZ2VyJylcblxuICBvcGVuRXh0ZXJuYWw6ICh1cmwpIC0+XG4gICAgc2hlbGwub3BlbkV4dGVybmFsKHVybClcblxuICBkaXNhYmxlWm9vbTogLT5cbiAgICBvdXRlckNhbGxiYWNrID0gLT5cbiAgICAgIHdlYkZyYW1lLnNldFpvb21MZXZlbExpbWl0cygxLCAxKVxuXG4gICAgb3V0ZXJDYWxsYmFjaygpXG4gICAgIyBTZXQgdGhlIGxpbWl0cyBldmVyeSB0aW1lIGEgZGlzcGxheSBpcyBhZGRlZCBvciByZW1vdmVkLCBvdGhlcndpc2UgdGhlXG4gICAgIyBjb25maWd1cmF0aW9uIGdldHMgcmVzZXQgdG8gdGhlIGRlZmF1bHQsIHdoaWNoIGFsbG93cyB6b29taW5nIHRoZVxuICAgICMgd2ViZnJhbWUuXG4gICAgc2NyZWVuLm9uKCdkaXNwbGF5LWFkZGVkJywgb3V0ZXJDYWxsYmFjaylcbiAgICBzY3JlZW4ub24oJ2Rpc3BsYXktcmVtb3ZlZCcsIG91dGVyQ2FsbGJhY2spXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIHNjcmVlbi5yZW1vdmVMaXN0ZW5lcignZGlzcGxheS1hZGRlZCcsIG91dGVyQ2FsbGJhY2spXG4gICAgICBzY3JlZW4ucmVtb3ZlTGlzdGVuZXIoJ2Rpc3BsYXktcmVtb3ZlZCcsIG91dGVyQ2FsbGJhY2spXG5cbiAgY2hlY2tGb3JVcGRhdGU6IC0+XG4gICAgaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpjaGVjay1mb3ItdXBkYXRlJylcblxuICByZXN0YXJ0QW5kSW5zdGFsbFVwZGF0ZTogLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOmluc3RhbGwtdXBkYXRlJylcblxuICBnZXRBdXRvVXBkYXRlTWFuYWdlclN0YXRlOiAtPlxuICAgIGlwY1JlbmRlcmVyLnNlbmRTeW5jKCdnZXQtYXV0by11cGRhdGUtbWFuYWdlci1zdGF0ZScpXG5cbiAgZ2V0QXV0b1VwZGF0ZU1hbmFnZXJFcnJvck1lc3NhZ2U6IC0+XG4gICAgaXBjUmVuZGVyZXIuc2VuZFN5bmMoJ2dldC1hdXRvLXVwZGF0ZS1tYW5hZ2VyLWVycm9yJylcblxuICBlbWl0V2lsbFNhdmVQYXRoOiAocGF0aCkgLT5cbiAgICBpcGNSZW5kZXJlci5zZW5kU3luYygnd2lsbC1zYXZlLXBhdGgnLCBwYXRoKVxuXG4gIGVtaXREaWRTYXZlUGF0aDogKHBhdGgpIC0+XG4gICAgaXBjUmVuZGVyZXIuc2VuZFN5bmMoJ2RpZC1zYXZlLXBhdGgnLCBwYXRoKVxuIl19
