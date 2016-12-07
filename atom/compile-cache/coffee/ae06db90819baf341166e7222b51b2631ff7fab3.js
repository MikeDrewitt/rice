(function() {
  var AtomWindow, BrowserWindow, EventEmitter, app, dialog, fs, ipcMain, path, ref, url,
    slice = [].slice;

  ref = require('electron'), BrowserWindow = ref.BrowserWindow, app = ref.app, dialog = ref.dialog, ipcMain = ref.ipcMain;

  path = require('path');

  fs = require('fs');

  url = require('url');

  EventEmitter = require('events').EventEmitter;

  module.exports = AtomWindow = (function() {
    Object.assign(AtomWindow.prototype, EventEmitter.prototype);

    AtomWindow.iconPath = path.resolve(__dirname, '..', '..', 'resources', 'atom.png');

    AtomWindow.includeShellLoadTime = true;

    AtomWindow.prototype.browserWindow = null;

    AtomWindow.prototype.loaded = null;

    AtomWindow.prototype.isSpec = null;

    function AtomWindow(atomApplication, fileRecoveryService, settings) {
      var hasPathToOpen, loadSettings, locationsToOpen, options, pathToOpen;
      this.atomApplication = atomApplication;
      this.fileRecoveryService = fileRecoveryService;
      if (settings == null) {
        settings = {};
      }
      this.resourcePath = settings.resourcePath, pathToOpen = settings.pathToOpen, locationsToOpen = settings.locationsToOpen, this.isSpec = settings.isSpec, this.headless = settings.headless, this.safeMode = settings.safeMode, this.devMode = settings.devMode;
      if (pathToOpen) {
        if (locationsToOpen == null) {
          locationsToOpen = [
            {
              pathToOpen: pathToOpen
            }
          ];
        }
      }
      if (locationsToOpen == null) {
        locationsToOpen = [];
      }
      this.loadedPromise = new Promise((function(_this) {
        return function(resolveLoadedPromise) {
          _this.resolveLoadedPromise = resolveLoadedPromise;
        };
      })(this));
      this.closedPromise = new Promise((function(_this) {
        return function(resolveClosedPromise) {
          _this.resolveClosedPromise = resolveClosedPromise;
        };
      })(this));
      options = {
        show: false,
        title: 'Atom',
        backgroundColor: "#fff",
        webPreferences: {
          backgroundThrottling: !this.isSpec
        }
      };
      if (process.platform === 'linux') {
        options.icon = this.constructor.iconPath;
      }
      if (this.shouldHideTitleBar()) {
        options.titleBarStyle = 'hidden';
      }
      this.browserWindow = new BrowserWindow(options);
      this.atomApplication.addWindow(this);
      this.handleEvents();
      loadSettings = Object.assign({}, settings);
      loadSettings.appVersion = app.getVersion();
      loadSettings.resourcePath = this.resourcePath;
      if (loadSettings.devMode == null) {
        loadSettings.devMode = false;
      }
      if (loadSettings.safeMode == null) {
        loadSettings.safeMode = false;
      }
      loadSettings.atomHome = process.env.ATOM_HOME;
      if (loadSettings.clearWindowState == null) {
        loadSettings.clearWindowState = false;
      }
      if (loadSettings.initialPaths == null) {
        loadSettings.initialPaths = (function() {
          var base, i, len, results;
          results = [];
          for (i = 0, len = locationsToOpen.length; i < len; i++) {
            pathToOpen = locationsToOpen[i].pathToOpen;
            if (pathToOpen) {
              if (typeof (base = fs.statSyncNoException(pathToOpen)).isFile === "function" ? base.isFile() : void 0) {
                results.push(path.dirname(pathToOpen));
              } else {
                results.push(pathToOpen);
              }
            }
          }
          return results;
        })();
      }
      loadSettings.initialPaths.sort();
      if (this.constructor.includeShellLoadTime && !this.isSpec) {
        this.constructor.includeShellLoadTime = false;
        if (loadSettings.shellLoadTime == null) {
          loadSettings.shellLoadTime = Date.now() - global.shellStartTime;
        }
      }
      this.browserWindow.loadSettings = loadSettings;
      this.browserWindow.on('window:loaded', (function(_this) {
        return function() {
          _this.emit('window:loaded');
          return _this.resolveLoadedPromise();
        };
      })(this));
      this.setLoadSettings(loadSettings);
      if (loadSettings.env != null) {
        this.env = loadSettings.env;
      }
      if (this.isSpec) {
        this.browserWindow.focusOnWebView();
      }
      if (typeof windowDimensions !== "undefined" && windowDimensions !== null) {
        this.browserWindow.temporaryState = {
          windowDimensions: windowDimensions
        };
      }
      hasPathToOpen = !(locationsToOpen.length === 1 && (locationsToOpen[0].pathToOpen == null));
      if (hasPathToOpen && !this.isSpecWindow()) {
        this.openLocations(locationsToOpen);
      }
    }

    AtomWindow.prototype.setLoadSettings = function(loadSettings) {
      return this.browserWindow.loadURL(url.format({
        protocol: 'file',
        pathname: this.resourcePath + "/static/index.html",
        slashes: true,
        hash: encodeURIComponent(JSON.stringify(loadSettings))
      }));
    };

    AtomWindow.prototype.getLoadSettings = function() {
      var hash;
      if ((this.browserWindow.webContents != null) && !this.browserWindow.webContents.isLoading()) {
        hash = url.parse(this.browserWindow.webContents.getURL()).hash.substr(1);
        return JSON.parse(decodeURIComponent(hash));
      }
    };

    AtomWindow.prototype.hasProjectPath = function() {
      var ref1;
      return ((ref1 = this.getLoadSettings().initialPaths) != null ? ref1.length : void 0) > 0;
    };

    AtomWindow.prototype.setupContextMenu = function() {
      var ContextMenu;
      ContextMenu = require('./context-menu');
      return this.browserWindow.on('context-menu', (function(_this) {
        return function(menuTemplate) {
          return new ContextMenu(menuTemplate, _this);
        };
      })(this));
    };

    AtomWindow.prototype.containsPaths = function(paths) {
      var i, len, pathToCheck;
      for (i = 0, len = paths.length; i < len; i++) {
        pathToCheck = paths[i];
        if (!this.containsPath(pathToCheck)) {
          return false;
        }
      }
      return true;
    };

    AtomWindow.prototype.containsPath = function(pathToCheck) {
      var ref1, ref2;
      return (ref1 = this.getLoadSettings()) != null ? (ref2 = ref1.initialPaths) != null ? ref2.some(function(projectPath) {
        var base;
        if (!projectPath) {
          return false;
        } else if (!pathToCheck) {
          return false;
        } else if (pathToCheck === projectPath) {
          return true;
        } else if (typeof (base = fs.statSyncNoException(pathToCheck)).isDirectory === "function" ? base.isDirectory() : void 0) {
          return false;
        } else if (pathToCheck.indexOf(path.join(projectPath, path.sep)) === 0) {
          return true;
        } else {
          return false;
        }
      }) : void 0 : void 0;
    };

    AtomWindow.prototype.handleEvents = function() {
      this.browserWindow.on('close', (function(_this) {
        return function(event) {
          if (!(_this.atomApplication.quitting || _this.unloading)) {
            event.preventDefault();
            _this.unloading = true;
            _this.atomApplication.saveState(false);
            return _this.saveState().then(function() {
              return _this.close();
            });
          }
        };
      })(this));
      this.browserWindow.on('closed', (function(_this) {
        return function() {
          _this.fileRecoveryService.didCloseWindow(_this);
          _this.atomApplication.removeWindow(_this);
          return _this.resolveClosedPromise();
        };
      })(this));
      this.browserWindow.on('unresponsive', (function(_this) {
        return function() {
          var chosen;
          if (_this.isSpec) {
            return;
          }
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close', 'Keep Waiting'],
            message: 'Editor is not responding',
            detail: 'The editor is not responding. Would you like to force close it or just keep waiting?'
          });
          if (chosen === 0) {
            return _this.browserWindow.destroy();
          }
        };
      })(this));
      this.browserWindow.webContents.on('crashed', (function(_this) {
        return function() {
          var chosen;
          if (_this.headless) {
            _this.atomApplication.exit(100);
          }
          _this.fileRecoveryService.didCrashWindow(_this);
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close Window', 'Reload', 'Keep It Open'],
            message: 'The editor has crashed',
            detail: 'Please report this issue to https://github.com/atom/atom'
          });
          switch (chosen) {
            case 0:
              return _this.browserWindow.destroy();
            case 1:
              return _this.browserWindow.reload();
          }
        };
      })(this));
      this.browserWindow.webContents.on('will-navigate', (function(_this) {
        return function(event, url) {
          if (url !== _this.browserWindow.webContents.getURL()) {
            return event.preventDefault();
          }
        };
      })(this));
      this.setupContextMenu();
      if (this.isSpec) {
        return this.browserWindow.on('blur', (function(_this) {
          return function() {
            return _this.browserWindow.focusOnWebView();
          };
        })(this));
      }
    };

    AtomWindow.prototype.didCancelWindowUnload = function() {
      return this.unloading = false;
    };

    AtomWindow.prototype.saveState = function() {
      if (this.isSpecWindow()) {
        return Promise.resolve();
      }
      this.lastSaveStatePromise = new Promise((function(_this) {
        return function(resolve) {
          var callback;
          callback = function(event) {
            if (BrowserWindow.fromWebContents(event.sender) === _this.browserWindow) {
              ipcMain.removeListener('did-save-window-state', callback);
              return resolve();
            }
          };
          ipcMain.on('did-save-window-state', callback);
          return _this.browserWindow.webContents.send('save-window-state');
        };
      })(this));
      return this.lastSaveStatePromise;
    };

    AtomWindow.prototype.openPath = function(pathToOpen, initialLine, initialColumn) {
      return this.openLocations([
        {
          pathToOpen: pathToOpen,
          initialLine: initialLine,
          initialColumn: initialColumn
        }
      ]);
    };

    AtomWindow.prototype.openLocations = function(locationsToOpen) {
      return this.loadedPromise.then((function(_this) {
        return function() {
          return _this.sendMessage('open-locations', locationsToOpen);
        };
      })(this));
    };

    AtomWindow.prototype.replaceEnvironment = function(env) {
      return this.browserWindow.webContents.send('environment', env);
    };

    AtomWindow.prototype.sendMessage = function(message, detail) {
      return this.browserWindow.webContents.send('message', message, detail);
    };

    AtomWindow.prototype.sendCommand = function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (this.isSpecWindow()) {
        if (!this.atomApplication.sendCommandToFirstResponder(command)) {
          switch (command) {
            case 'window:reload':
              return this.reload();
            case 'window:toggle-dev-tools':
              return this.toggleDevTools();
            case 'window:close':
              return this.close();
          }
        }
      } else if (this.isWebViewFocused()) {
        return this.sendCommandToBrowserWindow.apply(this, [command].concat(slice.call(args)));
      } else {
        if (!this.atomApplication.sendCommandToFirstResponder(command)) {
          return this.sendCommandToBrowserWindow.apply(this, [command].concat(slice.call(args)));
        }
      }
    };

    AtomWindow.prototype.sendCommandToBrowserWindow = function() {
      var action, args, command, ref1, ref2;
      command = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      action = ((ref1 = args[0]) != null ? ref1.contextCommand : void 0) ? 'context-command' : 'command';
      return (ref2 = this.browserWindow.webContents).send.apply(ref2, [action, command].concat(slice.call(args)));
    };

    AtomWindow.prototype.getDimensions = function() {
      var height, ref1, ref2, width, x, y;
      ref1 = this.browserWindow.getPosition(), x = ref1[0], y = ref1[1];
      ref2 = this.browserWindow.getSize(), width = ref2[0], height = ref2[1];
      return {
        x: x,
        y: y,
        width: width,
        height: height
      };
    };

    AtomWindow.prototype.shouldHideTitleBar = function() {
      return !this.isSpec && process.platform === 'darwin' && this.atomApplication.config.get('core.useCustomTitleBar');
    };

    AtomWindow.prototype.close = function() {
      return this.browserWindow.close();
    };

    AtomWindow.prototype.focus = function() {
      return this.browserWindow.focus();
    };

    AtomWindow.prototype.minimize = function() {
      return this.browserWindow.minimize();
    };

    AtomWindow.prototype.maximize = function() {
      return this.browserWindow.maximize();
    };

    AtomWindow.prototype.unmaximize = function() {
      return this.browserWindow.unmaximize();
    };

    AtomWindow.prototype.restore = function() {
      return this.browserWindow.restore();
    };

    AtomWindow.prototype.setFullScreen = function(fullScreen) {
      return this.browserWindow.setFullScreen(fullScreen);
    };

    AtomWindow.prototype.setAutoHideMenuBar = function(autoHideMenuBar) {
      return this.browserWindow.setAutoHideMenuBar(autoHideMenuBar);
    };

    AtomWindow.prototype.handlesAtomCommands = function() {
      return !this.isSpecWindow() && this.isWebViewFocused();
    };

    AtomWindow.prototype.isFocused = function() {
      return this.browserWindow.isFocused();
    };

    AtomWindow.prototype.isMaximized = function() {
      return this.browserWindow.isMaximized();
    };

    AtomWindow.prototype.isMinimized = function() {
      return this.browserWindow.isMinimized();
    };

    AtomWindow.prototype.isWebViewFocused = function() {
      return this.browserWindow.isWebViewFocused();
    };

    AtomWindow.prototype.isSpecWindow = function() {
      return this.isSpec;
    };

    AtomWindow.prototype.reload = function() {
      this.loadedPromise = new Promise((function(_this) {
        return function(resolveLoadedPromise) {
          _this.resolveLoadedPromise = resolveLoadedPromise;
        };
      })(this));
      this.saveState().then((function(_this) {
        return function() {
          return _this.browserWindow.reload();
        };
      })(this));
      return this.loadedPromise;
    };

    AtomWindow.prototype.toggleDevTools = function() {
      return this.browserWindow.toggleDevTools();
    };

    AtomWindow.prototype.openDevTools = function() {
      return this.browserWindow.openDevTools();
    };

    AtomWindow.prototype.closeDevTools = function() {
      return this.browserWindow.closeDevTools();
    };

    AtomWindow.prototype.setDocumentEdited = function(documentEdited) {
      return this.browserWindow.setDocumentEdited(documentEdited);
    };

    AtomWindow.prototype.setRepresentedFilename = function(representedFilename) {
      return this.browserWindow.setRepresentedFilename(representedFilename);
    };

    AtomWindow.prototype.copy = function() {
      return this.browserWindow.copy();
    };

    return AtomWindow;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvYXRvbS13aW5kb3cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpRkFBQTtJQUFBOztFQUFBLE1BQXdDLE9BQUEsQ0FBUSxVQUFSLENBQXhDLEVBQUMsaUNBQUQsRUFBZ0IsYUFBaEIsRUFBcUIsbUJBQXJCLEVBQTZCOztFQUM3QixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7RUFDTCxlQUFnQixPQUFBLENBQVEsUUFBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNKLE1BQU0sQ0FBQyxNQUFQLENBQWMsVUFBQyxDQUFBLFNBQWYsRUFBMEIsWUFBWSxDQUFDLFNBQXZDOztJQUVBLFVBQUMsQ0FBQSxRQUFELEdBQVcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiLEVBQXdCLElBQXhCLEVBQThCLElBQTlCLEVBQW9DLFdBQXBDLEVBQWlELFVBQWpEOztJQUNYLFVBQUMsQ0FBQSxvQkFBRCxHQUF1Qjs7eUJBRXZCLGFBQUEsR0FBZTs7eUJBQ2YsTUFBQSxHQUFROzt5QkFDUixNQUFBLEdBQVE7O0lBRUssb0JBQUMsZUFBRCxFQUFtQixtQkFBbkIsRUFBeUMsUUFBekM7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLGtCQUFEO01BQWtCLElBQUMsQ0FBQSxzQkFBRDs7UUFBc0IsV0FBUzs7TUFDNUQsSUFBQyxDQUFBLHdCQUFBLFlBQUYsRUFBZ0IsZ0NBQWhCLEVBQTRCLDBDQUE1QixFQUE2QyxJQUFDLENBQUEsa0JBQUEsTUFBOUMsRUFBc0QsSUFBQyxDQUFBLG9CQUFBLFFBQXZELEVBQWlFLElBQUMsQ0FBQSxvQkFB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aUJBQUEsR0FBbUIsU0FBQyxjQUFEO2FBQW9CLElBQUMsQ0FBQSxhQUFhLENBQUMsaUJBQWYsQ0FBaUMsY0FBakM7SUFBcEI7O3lCQUVuQixzQkFBQSxHQUF3QixTQUFDLG1CQUFEO2FBQXlCLElBQUMsQ0FBQSxhQUFhLENBQUMsc0JBQWYsQ0FBc0MsbUJBQXRDO0lBQXpCOzt5QkFFeEIsSUFBQSxHQUFNLFNBQUE7YUFBRyxJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBQTtJQUFIOzs7OztBQWxSUiIsInNvdXJjZXNDb250ZW50IjpbIntCcm93c2VyV2luZG93LCBhcHAsIGRpYWxvZywgaXBjTWFpbn0gPSByZXF1aXJlICdlbGVjdHJvbidcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcydcbnVybCA9IHJlcXVpcmUgJ3VybCdcbntFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBdG9tV2luZG93XG4gIE9iamVjdC5hc3NpZ24gQHByb3RvdHlwZSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZVxuXG4gIEBpY29uUGF0aDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3Jlc291cmNlcycsICdhdG9tLnBuZycpXG4gIEBpbmNsdWRlU2hlbGxMb2FkVGltZTogdHJ1ZVxuXG4gIGJyb3dzZXJXaW5kb3c6IG51bGxcbiAgbG9hZGVkOiBudWxsXG4gIGlzU3BlYzogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQGF0b21BcHBsaWNhdGlvbiwgQGZpbGVSZWNvdmVyeVNlcnZpY2UsIHNldHRpbmdzPXt9KSAtPlxuICAgIHtAcmVzb3VyY2VQYXRoLCBwYXRoVG9PcGVuLCBsb2NhdGlvbnNUb09wZW4sIEBpc1NwZWMsIEBoZWFkbGVzcywgQHNhZmVNb2RlLCBAZGV2TW9kZX0gPSBzZXR0aW5nc1xuICAgIGxvY2F0aW9uc1RvT3BlbiA/PSBbe3BhdGhUb09wZW59XSBpZiBwYXRoVG9PcGVuXG4gICAgbG9jYXRpb25zVG9PcGVuID89IFtdXG5cbiAgICBAbG9hZGVkUHJvbWlzZSA9IG5ldyBQcm9taXNlKChAcmVzb2x2ZUxvYWRlZFByb21pc2UpID0+KVxuICAgIEBjbG9zZWRQcm9taXNlID0gbmV3IFByb21pc2UoKEByZXNvbHZlQ2xvc2VkUHJvbWlzZSkgPT4pXG5cbiAgICBvcHRpb25zID1cbiAgICAgIHNob3c6IGZhbHNlXG4gICAgICB0aXRsZTogJ0F0b20nXG4gICAgICAjIEFkZCBhbiBvcGFxdWUgYmFja2dyb3VuZENvbG9yIChpbnN0ZWFkIG9mIGtlZXBpbmcgdGhlIGRlZmF1bHRcbiAgICAgICMgdHJhbnNwYXJlbnQgb25lKSB0byBwcmV2ZW50IHN1YnBpeGVsIGFudGktYWxpYXNpbmcgZnJvbSBiZWluZyBkaXNhYmxlZC5cbiAgICAgICMgV2UgYmVsaWV2ZSB0aGlzIGlzIGEgcmVncmVzc2lvbiBpbnRyb2R1Y2VkIHdpdGggRWxlY3Ryb24gMC4zNy4zLCBhbmRcbiAgICAgICMgdGh1cyB3ZSBzaG91bGQgcmVtb3ZlIHRoaXMgYXMgc29vbiBhcyBhIGZpeCBnZXRzIHJlbGVhc2VkLlxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmZcIlxuICAgICAgd2ViUHJlZmVyZW5jZXM6XG4gICAgICAgICMgUHJldmVudCBzcGVjcyBmcm9tIHRocm90dGxpbmcgd2hlbiB0aGUgd2luZG93IGlzIGluIHRoZSBiYWNrZ3JvdW5kOlxuICAgICAgICAjIHRoaXMgc2hvdWxkIHJlc3VsdCBpbiBmYXN0ZXIgQ0kgYnVpbGRzLCBhbmQgYW4gaW1wcm92ZW1lbnQgaW4gdGhlXG4gICAgICAgICMgbG9jYWwgZGV2ZWxvcG1lbnQgZXhwZXJpZW5jZSB3aGVuIHJ1bm5pbmcgc3BlY3MgdGhyb3VnaCB0aGUgVUkgKHdoaWNoXG4gICAgICAgICMgbm93IHdvbid0IHBhdXNlIHdoZW4gZS5nLiBtaW5pbWl6aW5nIHRoZSB3aW5kb3cpLlxuICAgICAgICBiYWNrZ3JvdW5kVGhyb3R0bGluZzogbm90IEBpc1NwZWNcblxuICAgICMgRG9uJ3Qgc2V0IGljb24gb24gV2luZG93cyBzbyB0aGUgZXhlJ3MgaWNvIHdpbGwgYmUgdXNlZCBhcyB3aW5kb3cgYW5kXG4gICAgIyB0YXNrYmFyJ3MgaWNvbi4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzQ4MTEgZm9yIG1vcmUuXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnbGludXgnXG4gICAgICBvcHRpb25zLmljb24gPSBAY29uc3RydWN0b3IuaWNvblBhdGhcblxuICAgIGlmIEBzaG91bGRIaWRlVGl0bGVCYXIoKVxuICAgICAgb3B0aW9ucy50aXRsZUJhclN0eWxlID0gJ2hpZGRlbidcblxuICAgIEBicm93c2VyV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3cgb3B0aW9uc1xuICAgIEBhdG9tQXBwbGljYXRpb24uYWRkV2luZG93KHRoaXMpXG5cbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICAgIGxvYWRTZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIHNldHRpbmdzKVxuICAgIGxvYWRTZXR0aW5ncy5hcHBWZXJzaW9uID0gYXBwLmdldFZlcnNpb24oKVxuICAgIGxvYWRTZXR0aW5ncy5yZXNvdXJjZVBhdGggPSBAcmVzb3VyY2VQYXRoXG4gICAgbG9hZFNldHRpbmdzLmRldk1vZGUgPz0gZmFsc2VcbiAgICBsb2FkU2V0dGluZ3Muc2FmZU1vZGUgPz0gZmFsc2VcbiAgICBsb2FkU2V0dGluZ3MuYXRvbUhvbWUgPSBwcm9jZXNzLmVudi5BVE9NX0hPTUVcbiAgICBsb2FkU2V0dGluZ3MuY2xlYXJXaW5kb3dTdGF0ZSA/PSBmYWxzZVxuICAgIGxvYWRTZXR0aW5ncy5pbml0aWFsUGF0aHMgPz1cbiAgICAgIGZvciB7cGF0aFRvT3Blbn0gaW4gbG9jYXRpb25zVG9PcGVuIHdoZW4gcGF0aFRvT3BlblxuICAgICAgICBpZiBmcy5zdGF0U3luY05vRXhjZXB0aW9uKHBhdGhUb09wZW4pLmlzRmlsZT8oKVxuICAgICAgICAgIHBhdGguZGlybmFtZShwYXRoVG9PcGVuKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGF0aFRvT3BlblxuXG4gICAgbG9hZFNldHRpbmdzLmluaXRpYWxQYXRocy5zb3J0KClcblxuICAgICMgT25seSBzZW5kIHRvIHRoZSBmaXJzdCBub24tc3BlYyB3aW5kb3cgY3JlYXRlZFxuICAgIGlmIEBjb25zdHJ1Y3Rvci5pbmNsdWRlU2hlbGxMb2FkVGltZSBhbmQgbm90IEBpc1NwZWNcbiAgICAgIEBjb25zdHJ1Y3Rvci5pbmNsdWRlU2hlbGxMb2FkVGltZSA9IGZhbHNlXG4gICAgICBsb2FkU2V0dGluZ3Muc2hlbGxMb2FkVGltZSA/PSBEYXRlLm5vdygpIC0gZ2xvYmFsLnNoZWxsU3RhcnRUaW1lXG5cbiAgICBAYnJvd3NlcldpbmRvdy5sb2FkU2V0dGluZ3MgPSBsb2FkU2V0dGluZ3NcblxuICAgIEBicm93c2VyV2luZG93Lm9uICd3aW5kb3c6bG9hZGVkJywgPT5cbiAgICAgIEBlbWl0ICd3aW5kb3c6bG9hZGVkJ1xuICAgICAgQHJlc29sdmVMb2FkZWRQcm9taXNlKClcblxuICAgIEBzZXRMb2FkU2V0dGluZ3MobG9hZFNldHRpbmdzKVxuICAgIEBlbnYgPSBsb2FkU2V0dGluZ3MuZW52IGlmIGxvYWRTZXR0aW5ncy5lbnY/XG4gICAgQGJyb3dzZXJXaW5kb3cuZm9jdXNPbldlYlZpZXcoKSBpZiBAaXNTcGVjXG4gICAgQGJyb3dzZXJXaW5kb3cudGVtcG9yYXJ5U3RhdGUgPSB7d2luZG93RGltZW5zaW9uc30gaWYgd2luZG93RGltZW5zaW9ucz9cblxuICAgIGhhc1BhdGhUb09wZW4gPSBub3QgKGxvY2F0aW9uc1RvT3Blbi5sZW5ndGggaXMgMSBhbmQgbm90IGxvY2F0aW9uc1RvT3BlblswXS5wYXRoVG9PcGVuPylcbiAgICBAb3BlbkxvY2F0aW9ucyhsb2NhdGlvbnNUb09wZW4pIGlmIGhhc1BhdGhUb09wZW4gYW5kIG5vdCBAaXNTcGVjV2luZG93KClcblxuICBzZXRMb2FkU2V0dGluZ3M6IChsb2FkU2V0dGluZ3MpIC0+XG4gICAgQGJyb3dzZXJXaW5kb3cubG9hZFVSTCB1cmwuZm9ybWF0XG4gICAgICBwcm90b2NvbDogJ2ZpbGUnXG4gICAgICBwYXRobmFtZTogXCIje0ByZXNvdXJjZVBhdGh9L3N0YXRpYy9pbmRleC5odG1sXCJcbiAgICAgIHNsYXNoZXM6IHRydWVcbiAgICAgIGhhc2g6IGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShsb2FkU2V0dGluZ3MpKVxuXG4gIGdldExvYWRTZXR0aW5nczogLT5cbiAgICBpZiBAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cz8gYW5kIG5vdCBAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cy5pc0xvYWRpbmcoKVxuICAgICAgaGFzaCA9IHVybC5wYXJzZShAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cy5nZXRVUkwoKSkuaGFzaC5zdWJzdHIoMSlcbiAgICAgIEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KGhhc2gpKVxuXG4gIGhhc1Byb2plY3RQYXRoOiAtPiBAZ2V0TG9hZFNldHRpbmdzKCkuaW5pdGlhbFBhdGhzPy5sZW5ndGggPiAwXG5cbiAgc2V0dXBDb250ZXh0TWVudTogLT5cbiAgICBDb250ZXh0TWVudSA9IHJlcXVpcmUgJy4vY29udGV4dC1tZW51J1xuXG4gICAgQGJyb3dzZXJXaW5kb3cub24gJ2NvbnRleHQtbWVudScsIChtZW51VGVtcGxhdGUpID0+XG4gICAgICBuZXcgQ29udGV4dE1lbnUobWVudVRlbXBsYXRlLCB0aGlzKVxuXG4gIGNvbnRhaW5zUGF0aHM6IChwYXRocykgLT5cbiAgICBmb3IgcGF0aFRvQ2hlY2sgaW4gcGF0aHNcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGNvbnRhaW5zUGF0aChwYXRoVG9DaGVjaylcbiAgICB0cnVlXG5cbiAgY29udGFpbnNQYXRoOiAocGF0aFRvQ2hlY2spIC0+XG4gICAgQGdldExvYWRTZXR0aW5ncygpPy5pbml0aWFsUGF0aHM/LnNvbWUgKHByb2plY3RQYXRoKSAtPlxuICAgICAgaWYgbm90IHByb2plY3RQYXRoXG4gICAgICAgIGZhbHNlXG4gICAgICBlbHNlIGlmIG5vdCBwYXRoVG9DaGVja1xuICAgICAgICBmYWxzZVxuICAgICAgZWxzZSBpZiBwYXRoVG9DaGVjayBpcyBwcm9qZWN0UGF0aFxuICAgICAgICB0cnVlXG4gICAgICBlbHNlIGlmIGZzLnN0YXRTeW5jTm9FeGNlcHRpb24ocGF0aFRvQ2hlY2spLmlzRGlyZWN0b3J5PygpXG4gICAgICAgIGZhbHNlXG4gICAgICBlbHNlIGlmIHBhdGhUb0NoZWNrLmluZGV4T2YocGF0aC5qb2luKHByb2plY3RQYXRoLCBwYXRoLnNlcCkpIGlzIDBcbiAgICAgICAgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBmYWxzZVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBAYnJvd3NlcldpbmRvdy5vbiAnY2xvc2UnLCAoZXZlbnQpID0+XG4gICAgICB1bmxlc3MgQGF0b21BcHBsaWNhdGlvbi5xdWl0dGluZyBvciBAdW5sb2FkaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgQHVubG9hZGluZyA9IHRydWVcbiAgICAgICAgQGF0b21BcHBsaWNhdGlvbi5zYXZlU3RhdGUoZmFsc2UpXG4gICAgICAgIEBzYXZlU3RhdGUoKS50aGVuKD0+IEBjbG9zZSgpKVxuXG4gICAgQGJyb3dzZXJXaW5kb3cub24gJ2Nsb3NlZCcsID0+XG4gICAgICBAZmlsZVJlY292ZXJ5U2VydmljZS5kaWRDbG9zZVdpbmRvdyh0aGlzKVxuICAgICAgQGF0b21BcHBsaWNhdGlvbi5yZW1vdmVXaW5kb3codGhpcylcbiAgICAgIEByZXNvbHZlQ2xvc2VkUHJvbWlzZSgpXG5cbiAgICBAYnJvd3NlcldpbmRvdy5vbiAndW5yZXNwb25zaXZlJywgPT5cbiAgICAgIHJldHVybiBpZiBAaXNTcGVjXG5cbiAgICAgIGNob3NlbiA9IGRpYWxvZy5zaG93TWVzc2FnZUJveCBAYnJvd3NlcldpbmRvdyxcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnXG4gICAgICAgIGJ1dHRvbnM6IFsnQ2xvc2UnLCAnS2VlcCBXYWl0aW5nJ11cbiAgICAgICAgbWVzc2FnZTogJ0VkaXRvciBpcyBub3QgcmVzcG9uZGluZydcbiAgICAgICAgZGV0YWlsOiAnVGhlIGVkaXRvciBpcyBub3QgcmVzcG9uZGluZy4gV291bGQgeW91IGxpa2UgdG8gZm9yY2UgY2xvc2UgaXQgb3IganVzdCBrZWVwIHdhaXRpbmc/J1xuICAgICAgQGJyb3dzZXJXaW5kb3cuZGVzdHJveSgpIGlmIGNob3NlbiBpcyAwXG5cbiAgICBAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cy5vbiAnY3Jhc2hlZCcsID0+XG4gICAgICBAYXRvbUFwcGxpY2F0aW9uLmV4aXQoMTAwKSBpZiBAaGVhZGxlc3NcblxuICAgICAgQGZpbGVSZWNvdmVyeVNlcnZpY2UuZGlkQ3Jhc2hXaW5kb3codGhpcylcbiAgICAgIGNob3NlbiA9IGRpYWxvZy5zaG93TWVzc2FnZUJveCBAYnJvd3NlcldpbmRvdyxcbiAgICAgICAgdHlwZTogJ3dhcm5pbmcnXG4gICAgICAgIGJ1dHRvbnM6IFsnQ2xvc2UgV2luZG93JywgJ1JlbG9hZCcsICdLZWVwIEl0IE9wZW4nXVxuICAgICAgICBtZXNzYWdlOiAnVGhlIGVkaXRvciBoYXMgY3Jhc2hlZCdcbiAgICAgICAgZGV0YWlsOiAnUGxlYXNlIHJlcG9ydCB0aGlzIGlzc3VlIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20nXG4gICAgICBzd2l0Y2ggY2hvc2VuXG4gICAgICAgIHdoZW4gMCB0aGVuIEBicm93c2VyV2luZG93LmRlc3Ryb3koKVxuICAgICAgICB3aGVuIDEgdGhlbiBAYnJvd3NlcldpbmRvdy5yZWxvYWQoKVxuXG4gICAgQGJyb3dzZXJXaW5kb3cud2ViQ29udGVudHMub24gJ3dpbGwtbmF2aWdhdGUnLCAoZXZlbnQsIHVybCkgPT5cbiAgICAgIHVubGVzcyB1cmwgaXMgQGJyb3dzZXJXaW5kb3cud2ViQ29udGVudHMuZ2V0VVJMKClcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgQHNldHVwQ29udGV4dE1lbnUoKVxuXG4gICAgaWYgQGlzU3BlY1xuICAgICAgIyBTcGVjIHdpbmRvdydzIHdlYiB2aWV3IHNob3VsZCBhbHdheXMgaGF2ZSBmb2N1c1xuICAgICAgQGJyb3dzZXJXaW5kb3cub24gJ2JsdXInLCA9PlxuICAgICAgICBAYnJvd3NlcldpbmRvdy5mb2N1c09uV2ViVmlldygpXG5cbiAgZGlkQ2FuY2VsV2luZG93VW5sb2FkOiAtPlxuICAgIEB1bmxvYWRpbmcgPSBmYWxzZVxuXG4gIHNhdmVTdGF0ZTogLT5cbiAgICBpZiBAaXNTcGVjV2luZG93KClcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgQGxhc3RTYXZlU3RhdGVQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICBjYWxsYmFjayA9IChldmVudCkgPT5cbiAgICAgICAgaWYgQnJvd3NlcldpbmRvdy5mcm9tV2ViQ29udGVudHMoZXZlbnQuc2VuZGVyKSBpcyBAYnJvd3NlcldpbmRvd1xuICAgICAgICAgIGlwY01haW4ucmVtb3ZlTGlzdGVuZXIoJ2RpZC1zYXZlLXdpbmRvdy1zdGF0ZScsIGNhbGxiYWNrKVxuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgaXBjTWFpbi5vbignZGlkLXNhdmUtd2luZG93LXN0YXRlJywgY2FsbGJhY2spXG4gICAgICBAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cy5zZW5kKCdzYXZlLXdpbmRvdy1zdGF0ZScpXG4gICAgQGxhc3RTYXZlU3RhdGVQcm9taXNlXG5cbiAgb3BlblBhdGg6IChwYXRoVG9PcGVuLCBpbml0aWFsTGluZSwgaW5pdGlhbENvbHVtbikgLT5cbiAgICBAb3BlbkxvY2F0aW9ucyhbe3BhdGhUb09wZW4sIGluaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1ufV0pXG5cbiAgb3BlbkxvY2F0aW9uczogKGxvY2F0aW9uc1RvT3BlbikgLT5cbiAgICBAbG9hZGVkUHJvbWlzZS50aGVuID0+IEBzZW5kTWVzc2FnZSAnb3Blbi1sb2NhdGlvbnMnLCBsb2NhdGlvbnNUb09wZW5cblxuICByZXBsYWNlRW52aXJvbm1lbnQ6IChlbnYpIC0+XG4gICAgQGJyb3dzZXJXaW5kb3cud2ViQ29udGVudHMuc2VuZCAnZW52aXJvbm1lbnQnLCBlbnZcblxuICBzZW5kTWVzc2FnZTogKG1lc3NhZ2UsIGRldGFpbCkgLT5cbiAgICBAYnJvd3NlcldpbmRvdy53ZWJDb250ZW50cy5zZW5kICdtZXNzYWdlJywgbWVzc2FnZSwgZGV0YWlsXG5cbiAgc2VuZENvbW1hbmQ6IChjb21tYW5kLCBhcmdzLi4uKSAtPlxuICAgIGlmIEBpc1NwZWNXaW5kb3coKVxuICAgICAgdW5sZXNzIEBhdG9tQXBwbGljYXRpb24uc2VuZENvbW1hbmRUb0ZpcnN0UmVzcG9uZGVyKGNvbW1hbmQpXG4gICAgICAgIHN3aXRjaCBjb21tYW5kXG4gICAgICAgICAgd2hlbiAnd2luZG93OnJlbG9hZCcgdGhlbiBAcmVsb2FkKClcbiAgICAgICAgICB3aGVuICd3aW5kb3c6dG9nZ2xlLWRldi10b29scycgdGhlbiBAdG9nZ2xlRGV2VG9vbHMoKVxuICAgICAgICAgIHdoZW4gJ3dpbmRvdzpjbG9zZScgdGhlbiBAY2xvc2UoKVxuICAgIGVsc2UgaWYgQGlzV2ViVmlld0ZvY3VzZWQoKVxuICAgICAgQHNlbmRDb21tYW5kVG9Ccm93c2VyV2luZG93KGNvbW1hbmQsIGFyZ3MuLi4pXG4gICAgZWxzZVxuICAgICAgdW5sZXNzIEBhdG9tQXBwbGljYXRpb24uc2VuZENvbW1hbmRUb0ZpcnN0UmVzcG9uZGVyKGNvbW1hbmQpXG4gICAgICAgIEBzZW5kQ29tbWFuZFRvQnJvd3NlcldpbmRvdyhjb21tYW5kLCBhcmdzLi4uKVxuXG4gIHNlbmRDb21tYW5kVG9Ccm93c2VyV2luZG93OiAoY29tbWFuZCwgYXJncy4uLikgLT5cbiAgICBhY3Rpb24gPSBpZiBhcmdzWzBdPy5jb250ZXh0Q29tbWFuZCB0aGVuICdjb250ZXh0LWNvbW1hbmQnIGVsc2UgJ2NvbW1hbmQnXG4gICAgQGJyb3dzZXJXaW5kb3cud2ViQ29udGVudHMuc2VuZCBhY3Rpb24sIGNvbW1hbmQsIGFyZ3MuLi5cblxuICBnZXREaW1lbnNpb25zOiAtPlxuICAgIFt4LCB5XSA9IEBicm93c2VyV2luZG93LmdldFBvc2l0aW9uKClcbiAgICBbd2lkdGgsIGhlaWdodF0gPSBAYnJvd3NlcldpbmRvdy5nZXRTaXplKClcbiAgICB7eCwgeSwgd2lkdGgsIGhlaWdodH1cblxuICBzaG91bGRIaWRlVGl0bGVCYXI6IC0+XG4gICAgbm90IEBpc1NwZWMgYW5kXG4gICAgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJyBhbmRcbiAgICBAYXRvbUFwcGxpY2F0aW9uLmNvbmZpZy5nZXQoJ2NvcmUudXNlQ3VzdG9tVGl0bGVCYXInKVxuXG4gIGNsb3NlOiAtPiBAYnJvd3NlcldpbmRvdy5jbG9zZSgpXG5cbiAgZm9jdXM6IC0+IEBicm93c2VyV2luZG93LmZvY3VzKClcblxuICBtaW5pbWl6ZTogLT4gQGJyb3dzZXJXaW5kb3cubWluaW1pemUoKVxuXG4gIG1heGltaXplOiAtPiBAYnJvd3NlcldpbmRvdy5tYXhpbWl6ZSgpXG5cbiAgdW5tYXhpbWl6ZTogLT4gQGJyb3dzZXJXaW5kb3cudW5tYXhpbWl6ZSgpXG5cbiAgcmVzdG9yZTogLT4gQGJyb3dzZXJXaW5kb3cucmVzdG9yZSgpXG5cbiAgc2V0RnVsbFNjcmVlbjogKGZ1bGxTY3JlZW4pIC0+IEBicm93c2VyV2luZG93LnNldEZ1bGxTY3JlZW4oZnVsbFNjcmVlbilcblxuICBzZXRBdXRvSGlkZU1lbnVCYXI6IChhdXRvSGlkZU1lbnVCYXIpIC0+IEBicm93c2VyV2luZG93LnNldEF1dG9IaWRlTWVudUJhcihhdXRvSGlkZU1lbnVCYXIpXG5cbiAgaGFuZGxlc0F0b21Db21tYW5kczogLT5cbiAgICBub3QgQGlzU3BlY1dpbmRvdygpIGFuZCBAaXNXZWJWaWV3Rm9jdXNlZCgpXG5cbiAgaXNGb2N1c2VkOiAtPiBAYnJvd3NlcldpbmRvdy5pc0ZvY3VzZWQoKVxuXG4gIGlzTWF4aW1pemVkOiAtPiBAYnJvd3NlcldpbmRvdy5pc01heGltaXplZCgpXG5cbiAgaXNNaW5pbWl6ZWQ6IC0+IEBicm93c2VyV2luZG93LmlzTWluaW1pemVkKClcblxuICBpc1dlYlZpZXdGb2N1c2VkOiAtPiBAYnJvd3NlcldpbmRvdy5pc1dlYlZpZXdGb2N1c2VkKClcblxuICBpc1NwZWNXaW5kb3c6IC0+IEBpc1NwZWNcblxuICByZWxvYWQ6IC0+XG4gICAgQGxvYWRlZFByb21pc2UgPSBuZXcgUHJvbWlzZSgoQHJlc29sdmVMb2FkZWRQcm9taXNlKSA9PilcbiAgICBAc2F2ZVN0YXRlKCkudGhlbiA9PiBAYnJvd3NlcldpbmRvdy5yZWxvYWQoKVxuICAgIEBsb2FkZWRQcm9taXNlXG5cbiAgdG9nZ2xlRGV2VG9vbHM6IC0+IEBicm93c2VyV2luZG93LnRvZ2dsZURldlRvb2xzKClcblxuICBvcGVuRGV2VG9vbHM6IC0+IEBicm93c2VyV2luZG93Lm9wZW5EZXZUb29scygpXG5cbiAgY2xvc2VEZXZUb29sczogLT4gQGJyb3dzZXJXaW5kb3cuY2xvc2VEZXZUb29scygpXG5cbiAgc2V0RG9jdW1lbnRFZGl0ZWQ6IChkb2N1bWVudEVkaXRlZCkgLT4gQGJyb3dzZXJXaW5kb3cuc2V0RG9jdW1lbnRFZGl0ZWQoZG9jdW1lbnRFZGl0ZWQpXG5cbiAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZTogKHJlcHJlc2VudGVkRmlsZW5hbWUpIC0+IEBicm93c2VyV2luZG93LnNldFJlcHJlc2VudGVkRmlsZW5hbWUocmVwcmVzZW50ZWRGaWxlbmFtZSlcblxuICBjb3B5OiAtPiBAYnJvd3NlcldpbmRvdy5jb3B5KClcbiJdfQ==
