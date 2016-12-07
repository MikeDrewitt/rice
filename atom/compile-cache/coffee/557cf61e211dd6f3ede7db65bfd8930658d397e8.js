(function() {
  var ApplicationMenu, AtomApplication, AtomProtocolHandler, AtomWindow, AutoUpdateManager, BrowserWindow, CompositeDisposable, Config, EventEmitter, FileRecoveryService, FindParentDir, LocationSuffixRegExp, Menu, Resolve, StorageFolder, _, app, dialog, fs, ipcHelpers, ipcMain, net, os, path, ref, shell, url,
    slice = [].slice;

  AtomWindow = require('./atom-window');

  ApplicationMenu = require('./application-menu');

  AtomProtocolHandler = require('./atom-protocol-handler');

  AutoUpdateManager = require('./auto-update-manager');

  StorageFolder = require('../storage-folder');

  Config = require('../config');

  FileRecoveryService = require('./file-recovery-service');

  ipcHelpers = require('../ipc-helpers');

  ref = require('electron'), BrowserWindow = ref.BrowserWindow, Menu = ref.Menu, app = ref.app, dialog = ref.dialog, ipcMain = ref.ipcMain, shell = ref.shell;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  fs = require('fs-plus');

  path = require('path');

  os = require('os');

  net = require('net');

  url = require('url');

  EventEmitter = require('events').EventEmitter;

  _ = require('underscore-plus');

  FindParentDir = null;

  Resolve = null;

  LocationSuffixRegExp = /(:\d+)(:\d+)?$/;

  module.exports = AtomApplication = (function() {
    Object.assign(AtomApplication.prototype, EventEmitter.prototype);

    AtomApplication.open = function(options) {
      var client, userNameSafe;
      if (options.socketPath == null) {
        if (process.platform === 'win32') {
          userNameSafe = new Buffer(process.env.USERNAME).toString('base64');
          options.socketPath = "\\\\.\\pipe\\atom-" + options.version + "-" + userNameSafe + "-" + process.arch + "-sock";
        } else {
          options.socketPath = path.join(os.tmpdir(), "atom-" + options.version + "-" + process.env.USER + ".sock");
        }
      }
      if ((process.platform !== 'win32' && !fs.existsSync(options.socketPath)) || options.test || options.benchmark || options.benchmarkTest) {
        new AtomApplication(options).initialize(options);
        return;
      }
      client = net.connect({
        path: options.socketPath
      }, function() {
        return client.write(JSON.stringify(options), function() {
          client.end();
          return app.quit();
        });
      });
      return client.on('error', function() {
        return new AtomApplication(options).initialize(options);
      });
    };

    AtomApplication.prototype.windows = null;

    AtomApplication.prototype.applicationMenu = null;

    AtomApplication.prototype.atomProtocolHandler = null;

    AtomApplication.prototype.resourcePath = null;

    AtomApplication.prototype.version = null;

    AtomApplication.prototype.quitting = false;

    AtomApplication.prototype.exit = function(status) {
      return app.exit(status);
    };

    function AtomApplication(options) {
      this.resourcePath = options.resourcePath, this.devResourcePath = options.devResourcePath, this.version = options.version, this.devMode = options.devMode, this.safeMode = options.safeMode, this.socketPath = options.socketPath, this.logFile = options.logFile, this.setPortable = options.setPortable, this.userDataDir = options.userDataDir;
      if (options.test || options.benchmark || options.benchmarkTest) {
        this.socketPath = null;
      }
      this.pidsToOpenWindows = {};
      this.windows = [];
      this.config = new Config({
        configDirPath: process.env.ATOM_HOME,
        resourcePath: this.resourcePath,
        enablePersistence: true
      });
      this.config.setSchema(null, {
        type: 'object',
        properties: _.clone(require('../config-schema'))
      });
      this.config.load();
      this.fileRecoveryService = new FileRecoveryService(path.join(process.env.ATOM_HOME, "recovery"));
      this.storageFolder = new StorageFolder(process.env.ATOM_HOME);
      this.disposable = new CompositeDisposable;
      this.handleEvents();
    }

    AtomApplication.prototype.initialize = function(options) {
      global.atomApplication = this;
      this.config.onDidChange('core.useCustomTitleBar', this.promptForRestart.bind(this));
      this.autoUpdateManager = new AutoUpdateManager(this.version, options.test || options.benchmark || options.benchmarkTest, this.resourcePath, this.config);
      this.applicationMenu = new ApplicationMenu(this.version, this.autoUpdateManager);
      this.atomProtocolHandler = new AtomProtocolHandler(this.resourcePath, this.safeMode);
      this.listenForArgumentsFromNewProcess();
      this.setupDockMenu();
      return this.launch(options);
    };

    AtomApplication.prototype.destroy = function() {
      var windowsClosePromises;
      windowsClosePromises = this.windows.map(function(window) {
        window.close();
        return window.closedPromise;
      });
      return Promise.all(windowsClosePromises).then((function(_this) {
        return function() {
          return _this.disposable.dispose();
        };
      })(this));
    };

    AtomApplication.prototype.launch = function(options) {
      var ref1, ref2;
      if (((ref1 = options.pathsToOpen) != null ? ref1.length : void 0) > 0 || ((ref2 = options.urlsToOpen) != null ? ref2.length : void 0) > 0 || options.test || options.benchmark || options.benchmarkTest) {
        return this.openWithOptions(options);
      } else {
        return this.loadState(options) || this.openPath(options);
      }
    };

    AtomApplication.prototype.openWithOptions = function(options) {
      var addToLastWindow, benchmark, benchmarkTest, clearWindowState, devMode, env, executedFrom, i, initialPaths, len, logFile, newWindow, pathsToOpen, pidToKillWhenClosed, profileStartup, results, safeMode, test, timeout, urlToOpen, urlsToOpen;
      initialPaths = options.initialPaths, pathsToOpen = options.pathsToOpen, executedFrom = options.executedFrom, urlsToOpen = options.urlsToOpen, benchmark = options.benchmark, benchmarkTest = options.benchmarkTest, test = options.test, pidToKillWhenClosed = options.pidToKillWhenClosed, devMode = options.devMode, safeMode = options.safeMode, newWindow = options.newWindow, logFile = options.logFile, profileStartup = options.profileStartup, timeout = options.timeout, clearWindowState = options.clearWindowState, addToLastWindow = options.addToLastWindow, env = options.env;
      app.focus();
      if (test) {
        return this.runTests({
          headless: true,
          devMode: devMode,
          resourcePath: this.resourcePath,
          executedFrom: executedFrom,
          pathsToOpen: pathsToOpen,
          logFile: logFile,
          timeout: timeout,
          env: env
        });
      } else if (benchmark || benchmarkTest) {
        return this.runBenchmarks({
          headless: true,
          test: benchmarkTest,
          resourcePath: this.resourcePath,
          executedFrom: executedFrom,
          pathsToOpen: pathsToOpen,
          timeout: timeout,
          env: env
        });
      } else if (pathsToOpen.length > 0) {
        return this.openPaths({
          initialPaths: initialPaths,
          pathsToOpen: pathsToOpen,
          executedFrom: executedFrom,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode,
          safeMode: safeMode,
          profileStartup: profileStartup,
          clearWindowState: clearWindowState,
          addToLastWindow: addToLastWindow,
          env: env
        });
      } else if (urlsToOpen.length > 0) {
        results = [];
        for (i = 0, len = urlsToOpen.length; i < len; i++) {
          urlToOpen = urlsToOpen[i];
          results.push(this.openUrl({
            urlToOpen: urlToOpen,
            devMode: devMode,
            safeMode: safeMode,
            env: env
          }));
        }
        return results;
      } else {
        return this.openPath({
          initialPaths: initialPaths,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode,
          safeMode: safeMode,
          profileStartup: profileStartup,
          clearWindowState: clearWindowState,
          addToLastWindow: addToLastWindow,
          env: env
        });
      }
    };

    AtomApplication.prototype.removeWindow = function(window) {
      var ref1, ref2;
      this.windows.splice(this.windows.indexOf(window), 1);
      if (this.windows.length === 0) {
        if ((ref1 = this.applicationMenu) != null) {
          ref1.enableWindowSpecificItems(false);
        }
        if ((ref2 = process.platform) === 'win32' || ref2 === 'linux') {
          app.quit();
          return;
        }
      }
      if (!window.isSpec) {
        return this.saveState(true);
      }
    };

    AtomApplication.prototype.addWindow = function(window) {
      var blurHandler, focusHandler, ref1;
      this.windows.push(window);
      if ((ref1 = this.applicationMenu) != null) {
        ref1.addWindow(window.browserWindow);
      }
      window.once('window:loaded', (function(_this) {
        return function() {
          var ref2;
          return (ref2 = _this.autoUpdateManager) != null ? ref2.emitUpdateAvailableEvent(window) : void 0;
        };
      })(this));
      if (!window.isSpec) {
        focusHandler = (function(_this) {
          return function() {
            return _this.lastFocusedWindow = window;
          };
        })(this);
        blurHandler = (function(_this) {
          return function() {
            return _this.saveState(false);
          };
        })(this);
        window.browserWindow.on('focus', focusHandler);
        window.browserWindow.on('blur', blurHandler);
        window.browserWindow.once('closed', (function(_this) {
          return function() {
            if (window === _this.lastFocusedWindow) {
              _this.lastFocusedWindow = null;
            }
            window.browserWindow.removeListener('focus', focusHandler);
            return window.browserWindow.removeListener('blur', blurHandler);
          };
        })(this));
        return window.browserWindow.webContents.once('did-finish-load', (function(_this) {
          return function() {
            return _this.saveState(false);
          };
        })(this));
      }
    };

    AtomApplication.prototype.listenForArgumentsFromNewProcess = function() {
      var server;
      if (this.socketPath == null) {
        return;
      }
      this.deleteSocketFile();
      server = net.createServer((function(_this) {
        return function(connection) {
          var data;
          data = '';
          connection.on('data', function(chunk) {
            return data = data + chunk;
          });
          return connection.on('end', function() {
            var options;
            options = JSON.parse(data);
            return _this.openWithOptions(options);
          });
        };
      })(this));
      server.listen(this.socketPath);
      return server.on('error', function(error) {
        return console.error('Application server failed', error);
      });
    };

    AtomApplication.prototype.deleteSocketFile = function() {
      var error;
      if (process.platform === 'win32' || (this.socketPath == null)) {
        return;
      }
      if (fs.existsSync(this.socketPath)) {
        try {
          return fs.unlinkSync(this.socketPath);
        } catch (error1) {
          error = error1;
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    };

    AtomApplication.prototype.handleEvents = function() {
      var clipboard, getLoadSettings;
      getLoadSettings = (function(_this) {
        return function() {
          var ref1, ref2;
          return {
            devMode: (ref1 = _this.focusedWindow()) != null ? ref1.devMode : void 0,
            safeMode: (ref2 = _this.focusedWindow()) != null ? ref2.safeMode : void 0
          };
        };
      })(this);
      this.on('application:quit', function() {
        return app.quit();
      });
      this.on('application:new-window', function() {
        return this.openPath(getLoadSettings());
      });
      this.on('application:new-file', function() {
        var ref1;
        return ((ref1 = this.focusedWindow()) != null ? ref1 : this).openPath();
      });
      this.on('application:open-dev', function() {
        return this.promptForPathToOpen('all', {
          devMode: true
        });
      });
      this.on('application:open-safe', function() {
        return this.promptForPathToOpen('all', {
          safeMode: true
        });
      });
      this.on('application:inspect', function(arg) {
        var atomWindow, x, y;
        x = arg.x, y = arg.y, atomWindow = arg.atomWindow;
        if (atomWindow == null) {
          atomWindow = this.focusedWindow();
        }
        return atomWindow != null ? atomWindow.browserWindow.inspectElement(x, y) : void 0;
      });
      this.on('application:open-documentation', function() {
        return shell.openExternal('http://flight-manual.atom.io/');
      });
      this.on('application:open-discussions', function() {
        return shell.openExternal('https://discuss.atom.io');
      });
      this.on('application:open-faq', function() {
        return shell.openExternal('https://atom.io/faq');
      });
      this.on('application:open-terms-of-use', function() {
        return shell.openExternal('https://atom.io/terms');
      });
      this.on('application:report-issue', function() {
        return shell.openExternal('https://github.com/atom/atom/blob/master/CONTRIBUTING.md#submitting-issues');
      });
      this.on('application:search-issues', function() {
        return shell.openExternal('https://github.com/issues?q=+is%3Aissue+user%3Aatom');
      });
      this.on('application:install-update', (function(_this) {
        return function() {
          _this.quitting = true;
          return _this.autoUpdateManager.install();
        };
      })(this));
      this.on('application:check-for-update', (function(_this) {
        return function() {
          return _this.autoUpdateManager.check();
        };
      })(this));
      if (process.platform === 'darwin') {
        this.on('application:bring-all-windows-to-front', function() {
          return Menu.sendActionToFirstResponder('arrangeInFront:');
        });
        this.on('application:hide', function() {
          return Menu.sendActionToFirstResponder('hide:');
        });
        this.on('application:hide-other-applications', function() {
          return Menu.sendActionToFirstResponder('hideOtherApplications:');
        });
        this.on('application:minimize', function() {
          return Menu.sendActionToFirstResponder('performMiniaturize:');
        });
        this.on('application:unhide-all-applications', function() {
          return Menu.sendActionToFirstResponder('unhideAllApplications:');
        });
        this.on('application:zoom', function() {
          return Menu.sendActionToFirstResponder('zoom:');
        });
      } else {
        this.on('application:minimize', function() {
          var ref1;
          return (ref1 = this.focusedWindow()) != null ? ref1.minimize() : void 0;
        });
        this.on('application:zoom', function() {
          var ref1;
          return (ref1 = this.focusedWindow()) != null ? ref1.maximize() : void 0;
        });
      }
      this.openPathOnEvent('application:about', 'atom://about');
      this.openPathOnEvent('application:show-settings', 'atom://config');
      this.openPathOnEvent('application:open-your-config', 'atom://.atom/config');
      this.openPathOnEvent('application:open-your-init-script', 'atom://.atom/init-script');
      this.openPathOnEvent('application:open-your-keymap', 'atom://.atom/keymap');
      this.openPathOnEvent('application:open-your-snippets', 'atom://.atom/snippets');
      this.openPathOnEvent('application:open-your-stylesheet', 'atom://.atom/stylesheet');
      this.openPathOnEvent('application:open-license', path.join(process.resourcesPath, 'LICENSE.md'));
      this.disposable.add(ipcHelpers.on(app, 'before-quit', (function(_this) {
        return function(event) {
          if (!_this.quitting) {
            event.preventDefault();
            _this.quitting = true;
            return Promise.all(_this.windows.map(function(window) {
              return window.saveState();
            })).then(function() {
              return app.quit();
            });
          }
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(app, 'will-quit', (function(_this) {
        return function() {
          _this.killAllProcesses();
          return _this.deleteSocketFile();
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(app, 'open-file', (function(_this) {
        return function(event, pathToOpen) {
          event.preventDefault();
          return _this.openPath({
            pathToOpen: pathToOpen
          });
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(app, 'open-url', (function(_this) {
        return function(event, urlToOpen) {
          event.preventDefault();
          return _this.openUrl({
            urlToOpen: urlToOpen,
            devMode: _this.devMode,
            safeMode: _this.safeMode
          });
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(app, 'activate', (function(_this) {
        return function(event, hasVisibleWindows) {
          if (!hasVisibleWindows) {
            if (event != null) {
              event.preventDefault();
            }
            return _this.emit('application:new-window');
          }
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'restart-application', (function(_this) {
        return function() {
          return _this.restart();
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'did-change-history-manager', (function(_this) {
        return function(event) {
          var atomWindow, i, len, ref1, results, webContents;
          ref1 = _this.windows;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            atomWindow = ref1[i];
            webContents = atomWindow.browserWindow.webContents;
            if (webContents !== event.sender) {
              results.push(webContents.send('did-change-history-manager'));
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'open', (function(_this) {
        return function(event, options) {
          var ref1, window;
          window = _this.atomWindowForEvent(event);
          if (options != null) {
            if (typeof options.pathsToOpen === 'string') {
              options.pathsToOpen = [options.pathsToOpen];
            }
            if (((ref1 = options.pathsToOpen) != null ? ref1.length : void 0) > 0) {
              options.window = window;
              return _this.openPaths(options);
            } else {
              return new AtomWindow(_this, _this.fileRecoveryService, options);
            }
          } else {
            return _this.promptForPathToOpen('all', {
              window: window
            });
          }
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'update-application-menu', (function(_this) {
        return function(event, template, keystrokesByCommand) {
          var ref1, win;
          win = BrowserWindow.fromWebContents(event.sender);
          return (ref1 = _this.applicationMenu) != null ? ref1.update(win, template, keystrokesByCommand) : void 0;
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'run-package-specs', (function(_this) {
        return function(event, packageSpecPath) {
          return _this.runTests({
            resourcePath: _this.devResourcePath,
            pathsToOpen: [packageSpecPath],
            headless: false
          });
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'run-benchmarks', (function(_this) {
        return function(event, benchmarksPath) {
          return _this.runBenchmarks({
            resourcePath: _this.devResourcePath,
            pathsToOpen: [benchmarksPath],
            headless: false,
            test: false
          });
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'command', (function(_this) {
        return function(event, command) {
          return _this.emit(command);
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'open-command', (function(_this) {
        return function() {
          var args, command, defaultPath, event;
          event = arguments[0], command = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
          if (args.length > 0) {
            defaultPath = args[0];
          }
          switch (command) {
            case 'application:open':
              return _this.promptForPathToOpen('all', getLoadSettings(), defaultPath);
            case 'application:open-file':
              return _this.promptForPathToOpen('file', getLoadSettings(), defaultPath);
            case 'application:open-folder':
              return _this.promptForPathToOpen('folder', getLoadSettings(), defaultPath);
            default:
              return console.log("Invalid open-command received: " + command);
          }
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'window-command', function() {
        var args, command, event, win;
        event = arguments[0], command = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
        win = BrowserWindow.fromWebContents(event.sender);
        return win.emit.apply(win, [command].concat(slice.call(args)));
      }));
      this.disposable.add(ipcHelpers.respondTo('window-method', (function(_this) {
        return function() {
          var args, browserWindow, method, ref1;
          browserWindow = arguments[0], method = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
          return (ref1 = _this.atomWindowForBrowserWindow(browserWindow)) != null ? ref1[method].apply(ref1, args) : void 0;
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'pick-folder', (function(_this) {
        return function(event, responseChannel) {
          return _this.promptForPath("folder", function(selectedPaths) {
            return event.sender.send(responseChannel, selectedPaths);
          });
        };
      })(this)));
      this.disposable.add(ipcHelpers.respondTo('set-window-size', function(win, width, height) {
        return win.setSize(width, height);
      }));
      this.disposable.add(ipcHelpers.respondTo('set-window-position', function(win, x, y) {
        return win.setPosition(x, y);
      }));
      this.disposable.add(ipcHelpers.respondTo('center-window', function(win) {
        return win.center();
      }));
      this.disposable.add(ipcHelpers.respondTo('focus-window', function(win) {
        return win.focus();
      }));
      this.disposable.add(ipcHelpers.respondTo('show-window', function(win) {
        return win.show();
      }));
      this.disposable.add(ipcHelpers.respondTo('hide-window', function(win) {
        return win.hide();
      }));
      this.disposable.add(ipcHelpers.respondTo('get-temporary-window-state', function(win) {
        return win.temporaryState;
      }));
      this.disposable.add(ipcHelpers.respondTo('set-temporary-window-state', function(win, state) {
        return win.temporaryState = state;
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'did-cancel-window-unload', (function(_this) {
        return function() {
          var i, len, ref1, results, window;
          _this.quitting = false;
          ref1 = _this.windows;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            window = ref1[i];
            results.push(window.didCancelWindowUnload());
          }
          return results;
        };
      })(this)));
      clipboard = require('../safe-clipboard');
      this.disposable.add(ipcHelpers.on(ipcMain, 'write-text-to-selection-clipboard', function(event, selectedText) {
        return clipboard.writeText(selectedText, 'selection');
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'write-to-stdout', function(event, output) {
        return process.stdout.write(output);
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'write-to-stderr', function(event, output) {
        return process.stderr.write(output);
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'add-recent-document', function(event, filename) {
        return app.addRecentDocument(filename);
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'execute-javascript-in-dev-tools', function(event, code) {
        var ref1;
        return (ref1 = event.sender.devToolsWebContents) != null ? ref1.executeJavaScript(code) : void 0;
      }));
      this.disposable.add(ipcHelpers.on(ipcMain, 'get-auto-update-manager-state', (function(_this) {
        return function(event) {
          return event.returnValue = _this.autoUpdateManager.getState();
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'get-auto-update-manager-error', (function(_this) {
        return function(event) {
          return event.returnValue = _this.autoUpdateManager.getErrorMessage();
        };
      })(this)));
      this.disposable.add(ipcHelpers.on(ipcMain, 'will-save-path', (function(_this) {
        return function(event, path) {
          _this.fileRecoveryService.willSavePath(_this.atomWindowForEvent(event), path);
          return event.returnValue = true;
        };
      })(this)));
      return this.disposable.add(ipcHelpers.on(ipcMain, 'did-save-path', (function(_this) {
        return function(event, path) {
          _this.fileRecoveryService.didSavePath(_this.atomWindowForEvent(event), path);
          return event.returnValue = true;
        };
      })(this)));
    };

    AtomApplication.prototype.setupDockMenu = function() {
      var dockMenu;
      if (process.platform === 'darwin') {
        dockMenu = Menu.buildFromTemplate([
          {
            label: 'New Window',
            click: (function(_this) {
              return function() {
                return _this.emit('application:new-window');
              };
            })(this)
          }
        ]);
        return app.dock.setMenu(dockMenu);
      }
    };

    AtomApplication.prototype.sendCommand = function() {
      var args, command, focusedWindow;
      command = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.emit.apply(this, [command].concat(slice.call(args)))) {
        focusedWindow = this.focusedWindow();
        if (focusedWindow != null) {
          return focusedWindow.sendCommand.apply(focusedWindow, [command].concat(slice.call(args)));
        } else {
          return this.sendCommandToFirstResponder(command);
        }
      }
    };

    AtomApplication.prototype.sendCommandToWindow = function() {
      var args, atomWindow, command;
      command = arguments[0], atomWindow = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (!this.emit.apply(this, [command].concat(slice.call(args)))) {
        if (atomWindow != null) {
          return atomWindow.sendCommand.apply(atomWindow, [command].concat(slice.call(args)));
        } else {
          return this.sendCommandToFirstResponder(command);
        }
      }
    };

    AtomApplication.prototype.sendCommandToFirstResponder = function(command) {
      if (process.platform !== 'darwin') {
        return false;
      }
      switch (command) {
        case 'core:undo':
          Menu.sendActionToFirstResponder('undo:');
          break;
        case 'core:redo':
          Menu.sendActionToFirstResponder('redo:');
          break;
        case 'core:copy':
          Menu.sendActionToFirstResponder('copy:');
          break;
        case 'core:cut':
          Menu.sendActionToFirstResponder('cut:');
          break;
        case 'core:paste':
          Menu.sendActionToFirstResponder('paste:');
          break;
        case 'core:select-all':
          Menu.sendActionToFirstResponder('selectAll:');
          break;
        default:
          return false;
      }
      return true;
    };

    AtomApplication.prototype.openPathOnEvent = function(eventName, pathToOpen) {
      return this.on(eventName, function() {
        var window;
        if (window = this.focusedWindow()) {
          return window.openPath(pathToOpen);
        } else {
          return this.openPath({
            pathToOpen: pathToOpen
          });
        }
      });
    };

    AtomApplication.prototype.windowForPaths = function(pathsToOpen, devMode) {
      return _.find(this.windows, function(atomWindow) {
        return atomWindow.devMode === devMode && atomWindow.containsPaths(pathsToOpen);
      });
    };

    AtomApplication.prototype.atomWindowForEvent = function(arg) {
      var sender;
      sender = arg.sender;
      return this.atomWindowForBrowserWindow(BrowserWindow.fromWebContents(sender));
    };

    AtomApplication.prototype.atomWindowForBrowserWindow = function(browserWindow) {
      return this.windows.find(function(atomWindow) {
        return atomWindow.browserWindow === browserWindow;
      });
    };

    AtomApplication.prototype.focusedWindow = function() {
      return _.find(this.windows, function(atomWindow) {
        return atomWindow.isFocused();
      });
    };

    AtomApplication.prototype.getWindowOffsetForCurrentPlatform = function() {
      var offsetByPlatform, ref1;
      offsetByPlatform = {
        darwin: 22,
        win32: 26
      };
      return (ref1 = offsetByPlatform[process.platform]) != null ? ref1 : 0;
    };

    AtomApplication.prototype.getDimensionsForNewWindow = function() {
      var dimensions, offset, ref1, ref2, ref3, ref4;
      if ((ref1 = (ref2 = this.focusedWindow()) != null ? ref2 : this.lastFocusedWindow) != null ? ref1.isMaximized() : void 0) {
        return;
      }
      dimensions = (ref3 = (ref4 = this.focusedWindow()) != null ? ref4 : this.lastFocusedWindow) != null ? ref3.getDimensions() : void 0;
      offset = this.getWindowOffsetForCurrentPlatform();
      if ((dimensions != null) && (offset != null)) {
        dimensions.x += offset;
        dimensions.y += offset;
      }
      return dimensions;
    };

    AtomApplication.prototype.openPath = function(arg) {
      var addToLastWindow, clearWindowState, devMode, env, initialPaths, newWindow, pathToOpen, pidToKillWhenClosed, profileStartup, ref1, safeMode, window;
      ref1 = arg != null ? arg : {}, initialPaths = ref1.initialPaths, pathToOpen = ref1.pathToOpen, pidToKillWhenClosed = ref1.pidToKillWhenClosed, newWindow = ref1.newWindow, devMode = ref1.devMode, safeMode = ref1.safeMode, profileStartup = ref1.profileStartup, window = ref1.window, clearWindowState = ref1.clearWindowState, addToLastWindow = ref1.addToLastWindow, env = ref1.env;
      return this.openPaths({
        initialPaths: initialPaths,
        pathsToOpen: [pathToOpen],
        pidToKillWhenClosed: pidToKillWhenClosed,
        newWindow: newWindow,
        devMode: devMode,
        safeMode: safeMode,
        profileStartup: profileStartup,
        window: window,
        clearWindowState: clearWindowState,
        addToLastWindow: addToLastWindow,
        env: env
      });
    };

    AtomApplication.prototype.openPaths = function(arg) {
      var addToLastWindow, clearWindowState, currentWindow, devMode, env, executedFrom, existingWindow, initialPaths, locationToOpen, locationsToOpen, newWindow, openedWindow, pathToOpen, pathsToOpen, pidToKillWhenClosed, profileStartup, ref1, resourcePath, safeMode, stats, window, windowDimensions, windowInitializationScript;
      ref1 = arg != null ? arg : {}, initialPaths = ref1.initialPaths, pathsToOpen = ref1.pathsToOpen, executedFrom = ref1.executedFrom, pidToKillWhenClosed = ref1.pidToKillWhenClosed, newWindow = ref1.newWindow, devMode = ref1.devMode, safeMode = ref1.safeMode, windowDimensions = ref1.windowDimensions, profileStartup = ref1.profileStartup, window = ref1.window, clearWindowState = ref1.clearWindowState, addToLastWindow = ref1.addToLastWindow, env = ref1.env;
      if ((pathsToOpen == null) || pathsToOpen.length === 0) {
        return;
      }
      if (env == null) {
        env = process.env;
      }
      devMode = Boolean(devMode);
      safeMode = Boolean(safeMode);
      clearWindowState = Boolean(clearWindowState);
      locationsToOpen = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = pathsToOpen.length; i < len; i++) {
          pathToOpen = pathsToOpen[i];
          results.push(this.locationForPathToOpen(pathToOpen, executedFrom, addToLastWindow));
        }
        return results;
      }).call(this);
      pathsToOpen = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = locationsToOpen.length; i < len; i++) {
          locationToOpen = locationsToOpen[i];
          results.push(locationToOpen.pathToOpen);
        }
        return results;
      })();
      if (!(pidToKillWhenClosed || newWindow)) {
        existingWindow = this.windowForPaths(pathsToOpen, devMode);
        stats = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = pathsToOpen.length; i < len; i++) {
            pathToOpen = pathsToOpen[i];
            results.push(fs.statSyncNoException(pathToOpen));
          }
          return results;
        })();
        if (existingWindow == null) {
          if (currentWindow = window != null ? window : this.lastFocusedWindow) {
            if (addToLastWindow || currentWindow.devMode === devMode && (stats.every(function(stat) {
              return typeof stat.isFile === "function" ? stat.isFile() : void 0;
            }) || stats.some(function(stat) {
              return (typeof stat.isDirectory === "function" ? stat.isDirectory() : void 0) && !currentWindow.hasProjectPath();
            }))) {
              existingWindow = currentWindow;
            }
          }
        }
      }
      if (existingWindow != null) {
        openedWindow = existingWindow;
        openedWindow.openLocations(locationsToOpen);
        if (openedWindow.isMinimized()) {
          openedWindow.restore();
        } else {
          openedWindow.focus();
        }
        openedWindow.replaceEnvironment(env);
      } else {
        if (devMode) {
          try {
            windowInitializationScript = require.resolve(path.join(this.devResourcePath, 'src', 'initialize-application-window'));
            resourcePath = this.devResourcePath;
          } catch (error1) {}
        }
        if (windowInitializationScript == null) {
          windowInitializationScript = require.resolve('../initialize-application-window');
        }
        if (resourcePath == null) {
          resourcePath = this.resourcePath;
        }
        if (windowDimensions == null) {
          windowDimensions = this.getDimensionsForNewWindow();
        }
        openedWindow = new AtomWindow(this, this.fileRecoveryService, {
          initialPaths: initialPaths,
          locationsToOpen: locationsToOpen,
          windowInitializationScript: windowInitializationScript,
          resourcePath: resourcePath,
          devMode: devMode,
          safeMode: safeMode,
          windowDimensions: windowDimensions,
          profileStartup: profileStartup,
          clearWindowState: clearWindowState,
          env: env
        });
        openedWindow.focus();
      }
      if (pidToKillWhenClosed != null) {
        this.pidsToOpenWindows[pidToKillWhenClosed] = openedWindow;
      }
      openedWindow.browserWindow.once('closed', (function(_this) {
        return function() {
          return _this.killProcessForWindow(openedWindow);
        };
      })(this));
      return openedWindow;
    };

    AtomApplication.prototype.killAllProcesses = function() {
      var pid;
      for (pid in this.pidsToOpenWindows) {
        this.killProcess(pid);
      }
    };

    AtomApplication.prototype.killProcessForWindow = function(openedWindow) {
      var pid, ref1, trackedWindow;
      ref1 = this.pidsToOpenWindows;
      for (pid in ref1) {
        trackedWindow = ref1[pid];
        if (trackedWindow === openedWindow) {
          this.killProcess(pid);
        }
      }
    };

    AtomApplication.prototype.killProcess = function(pid) {
      var error, parsedPid, ref1;
      try {
        parsedPid = parseInt(pid);
        if (isFinite(parsedPid)) {
          process.kill(parsedPid);
        }
      } catch (error1) {
        error = error1;
        if (error.code !== 'ESRCH') {
          console.log("Killing process " + pid + " failed: " + ((ref1 = error.code) != null ? ref1 : error.message));
        }
      }
      return delete this.pidsToOpenWindows[pid];
    };

    AtomApplication.prototype.saveState = function(allowEmpty) {
      var i, len, loadSettings, ref1, states, window;
      if (allowEmpty == null) {
        allowEmpty = false;
      }
      if (this.quitting) {
        return;
      }
      states = [];
      ref1 = this.windows;
      for (i = 0, len = ref1.length; i < len; i++) {
        window = ref1[i];
        if (!window.isSpec) {
          if (loadSettings = window.getLoadSettings()) {
            states.push({
              initialPaths: loadSettings.initialPaths
            });
          }
        }
      }
      if (states.length > 0 || allowEmpty) {
        return this.storageFolder.storeSync('application.json', states);
      }
    };

    AtomApplication.prototype.loadState = function(options) {
      var i, len, ref1, ref2, restorePreviousState, results, state, states;
      restorePreviousState = (ref1 = this.config.get('core.restorePreviousWindowsOnStart')) != null ? ref1 : true;
      if (restorePreviousState && ((ref2 = (states = this.storageFolder.load('application.json'))) != null ? ref2.length : void 0) > 0) {
        results = [];
        for (i = 0, len = states.length; i < len; i++) {
          state = states[i];
          results.push(this.openWithOptions(Object.assign(options, {
            initialPaths: state.initialPaths,
            pathsToOpen: state.initialPaths.filter(function(directoryPath) {
              return fs.isDirectorySync(directoryPath);
            }),
            urlsToOpen: [],
            devMode: this.devMode,
            safeMode: this.safeMode
          })));
        }
        return results;
      } else {
        return null;
      }
    };

    AtomApplication.prototype.openUrl = function(arg) {
      var PackageManager, devMode, env, pack, packageName, packagePath, safeMode, urlToOpen, windowDimensions, windowInitializationScript;
      urlToOpen = arg.urlToOpen, devMode = arg.devMode, safeMode = arg.safeMode, env = arg.env;
      if (this.packages == null) {
        PackageManager = require('../package-manager');
        this.packages = new PackageManager({
          configDirPath: process.env.ATOM_HOME,
          devMode: devMode,
          resourcePath: this.resourcePath
        });
      }
      packageName = url.parse(urlToOpen).host;
      pack = _.find(this.packages.getAvailablePackageMetadata(), function(arg1) {
        var name;
        name = arg1.name;
        return name === packageName;
      });
      if (pack != null) {
        if (pack.urlMain) {
          packagePath = this.packages.resolvePackagePath(packageName);
          windowInitializationScript = path.resolve(packagePath, pack.urlMain);
          windowDimensions = this.getDimensionsForNewWindow();
          return new AtomWindow(this, this.fileRecoveryService, {
            windowInitializationScript: windowInitializationScript,
            resourcePath: this.resourcePath,
            devMode: devMode,
            safeMode: safeMode,
            urlToOpen: urlToOpen,
            windowDimensions: windowDimensions,
            env: env
          });
        } else {
          return console.log("Package '" + pack.name + "' does not have a url main: " + urlToOpen);
        }
      } else {
        return console.log("Opening unknown url: " + urlToOpen);
      }
    };

    AtomApplication.prototype.runTests = function(arg) {
      var devMode, env, error, executedFrom, headless, i, isSpec, legacyTestRunnerPath, len, logFile, pathToOpen, pathsToOpen, resourcePath, safeMode, testPaths, testRunnerPath, timeout, timeoutHandler, timeoutInSeconds, windowInitializationScript;
      headless = arg.headless, resourcePath = arg.resourcePath, executedFrom = arg.executedFrom, pathsToOpen = arg.pathsToOpen, logFile = arg.logFile, safeMode = arg.safeMode, timeout = arg.timeout, env = arg.env;
      if (resourcePath !== this.resourcePath && !fs.existsSync(resourcePath)) {
        resourcePath = this.resourcePath;
      }
      timeoutInSeconds = Number.parseFloat(timeout);
      if (!Number.isNaN(timeoutInSeconds)) {
        timeoutHandler = function() {
          console.log("The test suite has timed out because it has been running for more than " + timeoutInSeconds + " seconds.");
          return process.exit(124);
        };
        setTimeout(timeoutHandler, timeoutInSeconds * 1000);
      }
      try {
        windowInitializationScript = require.resolve(path.resolve(this.devResourcePath, 'src', 'initialize-test-window'));
      } catch (error1) {
        error = error1;
        windowInitializationScript = require.resolve(path.resolve(__dirname, '..', '..', 'src', 'initialize-test-window'));
      }
      testPaths = [];
      if (pathsToOpen != null) {
        for (i = 0, len = pathsToOpen.length; i < len; i++) {
          pathToOpen = pathsToOpen[i];
          testPaths.push(path.resolve(executedFrom, fs.normalize(pathToOpen)));
        }
      }
      if (testPaths.length === 0) {
        process.stderr.write('Error: Specify at least one test path\n\n');
        process.exit(1);
      }
      legacyTestRunnerPath = this.resolveLegacyTestRunnerPath();
      testRunnerPath = this.resolveTestRunnerPath(testPaths[0]);
      devMode = true;
      isSpec = true;
      if (safeMode == null) {
        safeMode = false;
      }
      return new AtomWindow(this, this.fileRecoveryService, {
        windowInitializationScript: windowInitializationScript,
        resourcePath: resourcePath,
        headless: headless,
        isSpec: isSpec,
        devMode: devMode,
        testRunnerPath: testRunnerPath,
        legacyTestRunnerPath: legacyTestRunnerPath,
        testPaths: testPaths,
        logFile: logFile,
        safeMode: safeMode,
        env: env
      });
    };

    AtomApplication.prototype.runBenchmarks = function(arg) {
      var benchmarkPaths, devMode, env, error, executedFrom, headless, i, isSpec, len, pathToOpen, pathsToOpen, resourcePath, safeMode, test, windowInitializationScript;
      headless = arg.headless, test = arg.test, resourcePath = arg.resourcePath, executedFrom = arg.executedFrom, pathsToOpen = arg.pathsToOpen, env = arg.env;
      if (resourcePath !== this.resourcePath && !fs.existsSync(resourcePath)) {
        resourcePath = this.resourcePath;
      }
      try {
        windowInitializationScript = require.resolve(path.resolve(this.devResourcePath, 'src', 'initialize-benchmark-window'));
      } catch (error1) {
        error = error1;
        windowInitializationScript = require.resolve(path.resolve(__dirname, '..', '..', 'src', 'initialize-benchmark-window'));
      }
      benchmarkPaths = [];
      if (pathsToOpen != null) {
        for (i = 0, len = pathsToOpen.length; i < len; i++) {
          pathToOpen = pathsToOpen[i];
          benchmarkPaths.push(path.resolve(executedFrom, fs.normalize(pathToOpen)));
        }
      }
      if (benchmarkPaths.length === 0) {
        process.stderr.write('Error: Specify at least one benchmark path.\n\n');
        process.exit(1);
      }
      devMode = true;
      isSpec = true;
      safeMode = false;
      return new AtomWindow(this, this.fileRecoveryService, {
        windowInitializationScript: windowInitializationScript,
        resourcePath: resourcePath,
        headless: headless,
        test: test,
        isSpec: isSpec,
        devMode: devMode,
        benchmarkPaths: benchmarkPaths,
        safeMode: safeMode,
        env: env
      });
    };

    AtomApplication.prototype.resolveTestRunnerPath = function(testPath) {
      var packageMetadata, packageRoot, testRunnerPath;
      if (FindParentDir == null) {
        FindParentDir = require('find-parent-dir');
      }
      if (packageRoot = FindParentDir.sync(testPath, 'package.json')) {
        packageMetadata = require(path.join(packageRoot, 'package.json'));
        if (packageMetadata.atomTestRunner) {
          if (Resolve == null) {
            Resolve = require('resolve');
          }
          if (testRunnerPath = Resolve.sync(packageMetadata.atomTestRunner, {
            basedir: packageRoot,
            extensions: Object.keys(require.extensions)
          })) {
            return testRunnerPath;
          } else {
            process.stderr.write("Error: Could not resolve test runner path '" + packageMetadata.atomTestRunner + "'");
            process.exit(1);
          }
        }
      }
      return this.resolveLegacyTestRunnerPath();
    };

    AtomApplication.prototype.resolveLegacyTestRunnerPath = function() {
      var error;
      try {
        return require.resolve(path.resolve(this.devResourcePath, 'spec', 'jasmine-test-runner'));
      } catch (error1) {
        error = error1;
        return require.resolve(path.resolve(__dirname, '..', '..', 'spec', 'jasmine-test-runner'));
      }
    };

    AtomApplication.prototype.locationForPathToOpen = function(pathToOpen, executedFrom, forceAddToWindow) {
      var initialColumn, initialLine, match;
      if (executedFrom == null) {
        executedFrom = '';
      }
      if (!pathToOpen) {
        return {
          pathToOpen: pathToOpen
        };
      }
      pathToOpen = pathToOpen.replace(/[:\s]+$/, '');
      match = pathToOpen.match(LocationSuffixRegExp);
      if (match != null) {
        pathToOpen = pathToOpen.slice(0, -match[0].length);
        if (match[1]) {
          initialLine = Math.max(0, parseInt(match[1].slice(1)) - 1);
        }
        if (match[2]) {
          initialColumn = Math.max(0, parseInt(match[2].slice(1)) - 1);
        }
      } else {
        initialLine = initialColumn = null;
      }
      if (url.parse(pathToOpen).protocol == null) {
        pathToOpen = path.resolve(executedFrom, fs.normalize(pathToOpen));
      }
      return {
        pathToOpen: pathToOpen,
        initialLine: initialLine,
        initialColumn: initialColumn,
        forceAddToWindow: forceAddToWindow
      };
    };

    AtomApplication.prototype.promptForPathToOpen = function(type, arg, path) {
      var devMode, safeMode, window;
      devMode = arg.devMode, safeMode = arg.safeMode, window = arg.window;
      if (path == null) {
        path = null;
      }
      return this.promptForPath(type, ((function(_this) {
        return function(pathsToOpen) {
          return _this.openPaths({
            pathsToOpen: pathsToOpen,
            devMode: devMode,
            safeMode: safeMode,
            window: window
          });
        };
      })(this)), path);
    };

    AtomApplication.prototype.promptForPath = function(type, callback, path) {
      var openOptions, parentWindow, properties;
      properties = (function() {
        switch (type) {
          case 'file':
            return ['openFile'];
          case 'folder':
            return ['openDirectory'];
          case 'all':
            return ['openFile', 'openDirectory'];
          default:
            throw new Error(type + " is an invalid type for promptForPath");
        }
      })();
      parentWindow = process.platform === 'darwin' ? null : BrowserWindow.getFocusedWindow();
      openOptions = {
        properties: properties.concat(['multiSelections', 'createDirectory']),
        title: (function() {
          switch (type) {
            case 'file':
              return 'Open File';
            case 'folder':
              return 'Open Folder';
            default:
              return 'Open';
          }
        })()
      };
      if (path != null) {
        openOptions.defaultPath = path;
      }
      return dialog.showOpenDialog(parentWindow, openOptions, callback);
    };

    AtomApplication.prototype.promptForRestart = function() {
      var chosen;
      chosen = dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'warning',
        title: 'Restart required',
        message: "You will need to restart Atom for this change to take effect.",
        buttons: ['Restart Atom', 'Cancel']
      });
      if (chosen === 0) {
        return this.restart();
      }
    };

    AtomApplication.prototype.restart = function() {
      var args;
      args = [];
      if (this.safeMode) {
        args.push("--safe");
      }
      if (this.setPortable) {
        args.push("--portable");
      }
      if (this.logFile != null) {
        args.push("--log-file=" + this.logFile);
      }
      if (this.socketPath != null) {
        args.push("--socket-path=" + this.socketPath);
      }
      if (this.userDataDir != null) {
        args.push("--user-data-dir=" + this.userDataDir);
      }
      if (this.devMode) {
        args.push('--dev');
        args.push("--resource-path=" + this.resourcePath);
      }
      app.relaunch({
        args: args
      });
      return app.quit();
    };

    return AtomApplication;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvYXRvbS1hcHBsaWNhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtTQUFBO0lBQUE7O0VBQUEsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUNiLGVBQUEsR0FBa0IsT0FBQSxDQUFRLG9CQUFSOztFQUNsQixtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVI7O0VBQ3RCLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSx1QkFBUjs7RUFDcEIsYUFBQSxHQUFnQixPQUFBLENBQVEsbUJBQVI7O0VBQ2hCLE1BQUEsR0FBUyxPQUFBLENBQVEsV0FBUjs7RUFDVCxtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVI7O0VBQ3RCLFVBQUEsR0FBYSxPQUFBLENBQVEsZ0JBQVI7O0VBQ2IsTUFBcUQsT0FBQSxDQUFRLFVBQVIsQ0FBckQsRUFBQyxpQ0FBRCxFQUFnQixlQUFoQixFQUFzQixhQUF0QixFQUEyQixtQkFBM0IsRUFBbUMscUJBQW5DLEVBQTRDOztFQUMzQyxzQkFBdUIsT0FBQSxDQUFRLFdBQVI7O0VBQ3hCLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7RUFDTixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0VBQ0wsZUFBZ0IsT0FBQSxDQUFRLFFBQVI7O0VBQ2pCLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osYUFBQSxHQUFnQjs7RUFDaEIsT0FBQSxHQUFVOztFQUVWLG9CQUFBLEdBQXVCOztFQU92QixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0os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LHVCQUE3QztRQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsZ0JBQUEsR0FBaUIsSUFBQyxDQUFBLFVBQTVCLEVBQUE7O01BQ0EsSUFBZ0Qsd0JBQWhEO1FBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxrQkFBQSxHQUFtQixJQUFDLENBQUEsV0FBOUIsRUFBQTs7TUFDQSxJQUFHLElBQUMsQ0FBQSxPQUFKO1FBQ0UsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWO1FBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxrQkFBQSxHQUFtQixJQUFDLENBQUEsWUFBOUIsRUFGRjs7TUFHQSxHQUFHLENBQUMsUUFBSixDQUFhO1FBQUMsTUFBQSxJQUFEO09BQWI7YUFDQSxHQUFHLENBQUMsSUFBSixDQUFBO0lBWE87Ozs7O0FBM3hCWCIsInNvdXJjZXNDb250ZW50IjpbIkF0b21XaW5kb3cgPSByZXF1aXJlICcuL2F0b20td2luZG93J1xuQXBwbGljYXRpb25NZW51ID0gcmVxdWlyZSAnLi9hcHBsaWNhdGlvbi1tZW51J1xuQXRvbVByb3RvY29sSGFuZGxlciA9IHJlcXVpcmUgJy4vYXRvbS1wcm90b2NvbC1oYW5kbGVyJ1xuQXV0b1VwZGF0ZU1hbmFnZXIgPSByZXF1aXJlICcuL2F1dG8tdXBkYXRlLW1hbmFnZXInXG5TdG9yYWdlRm9sZGVyID0gcmVxdWlyZSAnLi4vc3RvcmFnZS1mb2xkZXInXG5Db25maWcgPSByZXF1aXJlICcuLi9jb25maWcnXG5GaWxlUmVjb3ZlcnlTZXJ2aWNlID0gcmVxdWlyZSAnLi9maWxlLXJlY292ZXJ5LXNlcnZpY2UnXG5pcGNIZWxwZXJzID0gcmVxdWlyZSAnLi4vaXBjLWhlbHBlcnMnXG57QnJvd3NlcldpbmRvdywgTWVudSwgYXBwLCBkaWFsb2csIGlwY01haW4sIHNoZWxsfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5vcyA9IHJlcXVpcmUgJ29zJ1xubmV0ID0gcmVxdWlyZSAnbmV0J1xudXJsID0gcmVxdWlyZSAndXJsJ1xue0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuRmluZFBhcmVudERpciA9IG51bGxcblJlc29sdmUgPSBudWxsXG5cbkxvY2F0aW9uU3VmZml4UmVnRXhwID0gLyg6XFxkKykoOlxcZCspPyQvXG5cbiMgVGhlIGFwcGxpY2F0aW9uJ3Mgc2luZ2xldG9uIGNsYXNzLlxuI1xuIyBJdCdzIHRoZSBlbnRyeSBwb2ludCBpbnRvIHRoZSBBdG9tIGFwcGxpY2F0aW9uIGFuZCBtYWludGFpbnMgdGhlIGdsb2JhbCBzdGF0ZVxuIyBvZiB0aGUgYXBwbGljYXRpb24uXG4jXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBdG9tQXBwbGljYXRpb25cbiAgT2JqZWN0LmFzc2lnbiBAcHJvdG90eXBlLCBFdmVudEVtaXR0ZXIucHJvdG90eXBlXG5cbiAgIyBQdWJsaWM6IFRoZSBlbnRyeSBwb2ludCBpbnRvIHRoZSBBdG9tIGFwcGxpY2F0aW9uLlxuICBAb3BlbjogKG9wdGlvbnMpIC0+XG4gICAgdW5sZXNzIG9wdGlvbnMuc29ja2V0UGF0aD9cbiAgICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgICAgICB1c2VyTmFtZVNhZmUgPSBuZXcgQnVmZmVyKHByb2Nlc3MuZW52LlVTRVJOQU1FKS50b1N0cmluZygnYmFzZTY0JylcbiAgICAgICAgb3B0aW9ucy5zb2NrZXRQYXRoID0gXCJcXFxcXFxcXC5cXFxccGlwZVxcXFxhdG9tLSN7b3B0aW9ucy52ZXJzaW9ufS0je3VzZXJOYW1lU2FmZX0tI3twcm9jZXNzLmFyY2h9LXNvY2tcIlxuICAgICAgZWxzZVxuICAgICAgICBvcHRpb25zLnNvY2tldFBhdGggPSBwYXRoLmpvaW4ob3MudG1wZGlyKCksIFwiYXRvbS0je29wdGlvbnMudmVyc2lvbn0tI3twcm9jZXNzLmVudi5VU0VSfS5zb2NrXCIpXG5cbiAgICAjIEZJWE1FOiBTb21ldGltZXMgd2hlbiBzb2NrZXRQYXRoIGRvZXNuJ3QgZXhpc3QsIG5ldC5jb25uZWN0IHdvdWxkIHN0cmFuZ2VseVxuICAgICMgdGFrZSBhIGZldyBzZWNvbmRzIHRvIHRyaWdnZXIgJ2Vycm9yJyBldmVudCwgaXQgY291bGQgYmUgYSBidWcgb2Ygbm9kZVxuICAgICMgb3IgYXRvbS1zaGVsbCwgYmVmb3JlIGl0J3MgZml4ZWQgd2UgY2hlY2sgdGhlIGV4aXN0ZW5jZSBvZiBzb2NrZXRQYXRoIHRvXG4gICAgIyBzcGVlZHVwIHN0YXJ0dXAuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gaXNudCAnd2luMzInIGFuZCBub3QgZnMuZXhpc3RzU3luYyBvcHRpb25zLnNvY2tldFBhdGgpIG9yIG9wdGlvbnMudGVzdCBvciBvcHRpb25zLmJlbmNobWFyayBvciBvcHRpb25zLmJlbmNobWFya1Rlc3RcbiAgICAgIG5ldyBBdG9tQXBwbGljYXRpb24ob3B0aW9ucykuaW5pdGlhbGl6ZShvcHRpb25zKVxuICAgICAgcmV0dXJuXG5cbiAgICBjbGllbnQgPSBuZXQuY29ubmVjdCB7cGF0aDogb3B0aW9ucy5zb2NrZXRQYXRofSwgLT5cbiAgICAgIGNsaWVudC53cml0ZSBKU09OLnN0cmluZ2lmeShvcHRpb25zKSwgLT5cbiAgICAgICAgY2xpZW50LmVuZCgpXG4gICAgICAgIGFwcC5xdWl0KClcblxuICAgIGNsaWVudC5vbiAnZXJyb3InLCAtPiBuZXcgQXRvbUFwcGxpY2F0aW9uKG9wdGlvbnMpLmluaXRpYWxpemUob3B0aW9ucylcblxuICB3aW5kb3dzOiBudWxsXG4gIGFwcGxpY2F0aW9uTWVudTogbnVsbFxuICBhdG9tUHJvdG9jb2xIYW5kbGVyOiBudWxsXG4gIHJlc291cmNlUGF0aDogbnVsbFxuICB2ZXJzaW9uOiBudWxsXG4gIHF1aXR0aW5nOiBmYWxzZVxuXG4gIGV4aXQ6IChzdGF0dXMpIC0+IGFwcC5leGl0KHN0YXR1cylcblxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAge0ByZXNvdXJjZVBhdGgsIEBkZXZSZXNvdXJjZVBhdGgsIEB2ZXJzaW9uLCBAZGV2TW9kZSwgQHNhZmVNb2RlLCBAc29ja2V0UGF0aCwgQGxvZ0ZpbGUsIEBzZXRQb3J0YWJsZSwgQHVzZXJEYXRhRGlyfSA9IG9wdGlvbnNcbiAgICBAc29ja2V0UGF0aCA9IG51bGwgaWYgb3B0aW9ucy50ZXN0IG9yIG9wdGlvbnMuYmVuY2htYXJrIG9yIG9wdGlvbnMuYmVuY2htYXJrVGVzdFxuICAgIEBwaWRzVG9PcGVuV2luZG93cyA9IHt9XG4gICAgQHdpbmRvd3MgPSBbXVxuXG4gICAgQGNvbmZpZyA9IG5ldyBDb25maWcoe2NvbmZpZ0RpclBhdGg6IHByb2Nlc3MuZW52LkFUT01fSE9NRSwgQHJlc291cmNlUGF0aCwgZW5hYmxlUGVyc2lzdGVuY2U6IHRydWV9KVxuICAgIEBjb25maWcuc2V0U2NoZW1hIG51bGwsIHt0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogXy5jbG9uZShyZXF1aXJlKCcuLi9jb25maWctc2NoZW1hJykpfVxuICAgIEBjb25maWcubG9hZCgpXG4gICAgQGZpbGVSZWNvdmVyeVNlcnZpY2UgPSBuZXcgRmlsZVJlY292ZXJ5U2VydmljZShwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuQVRPTV9IT01FLCBcInJlY292ZXJ5XCIpKVxuICAgIEBzdG9yYWdlRm9sZGVyID0gbmV3IFN0b3JhZ2VGb2xkZXIocHJvY2Vzcy5lbnYuQVRPTV9IT01FKVxuXG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBoYW5kbGVFdmVudHMoKVxuXG4gICMgVGhpcyBzdHVmZiB3YXMgcHJldmlvdXNseSBkb25lIGluIHRoZSBjb25zdHJ1Y3RvciwgYnV0IHdlIHdhbnQgdG8gYmUgYWJsZSB0byBjb25zdHJ1Y3QgdGhpcyBvYmplY3RcbiAgIyBmb3IgdGVzdGluZyBwdXJwb3NlcyB3aXRob3V0IGJvb3RpbmcgdXAgdGhlIHdvcmxkLiBBcyB5b3UgYWRkIHRlc3RzLCBmZWVsIGZyZWUgdG8gbW92ZSBpbnN0YW50aWF0aW9uXG4gICMgb2YgdGhlc2UgdmFyaW91cyBzdWItb2JqZWN0cyBpbnRvIHRoZSBjb25zdHJ1Y3RvciwgYnV0IHlvdSdsbCBuZWVkIHRvIHJlbW92ZSB0aGUgc2lkZS1lZmZlY3RzIHRoZXlcbiAgIyBwZXJmb3JtIGR1cmluZyB0aGVpciBjb25zdHJ1Y3Rpb24sIGFkZGluZyBhbiBpbml0aWFsaXplIG1ldGhvZCB0aGF0IHlvdSBjYWxsIGhlcmUuXG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIGdsb2JhbC5hdG9tQXBwbGljYXRpb24gPSB0aGlzXG5cbiAgICBAY29uZmlnLm9uRGlkQ2hhbmdlICdjb3JlLnVzZUN1c3RvbVRpdGxlQmFyJywgQHByb21wdEZvclJlc3RhcnQuYmluZCh0aGlzKVxuXG4gICAgQGF1dG9VcGRhdGVNYW5hZ2VyID0gbmV3IEF1dG9VcGRhdGVNYW5hZ2VyKFxuICAgICAgQHZlcnNpb24sIG9wdGlvbnMudGVzdCBvciBvcHRpb25zLmJlbmNobWFyayBvciBvcHRpb25zLmJlbmNobWFya1Rlc3QsIEByZXNvdXJjZVBhdGgsIEBjb25maWdcbiAgICApXG4gICAgQGFwcGxpY2F0aW9uTWVudSA9IG5ldyBBcHBsaWNhdGlvbk1lbnUoQHZlcnNpb24sIEBhdXRvVXBkYXRlTWFuYWdlcilcbiAgICBAYXRvbVByb3RvY29sSGFuZGxlciA9IG5ldyBBdG9tUHJvdG9jb2xIYW5kbGVyKEByZXNvdXJjZVBhdGgsIEBzYWZlTW9kZSlcblxuICAgIEBsaXN0ZW5Gb3JBcmd1bWVudHNGcm9tTmV3UHJvY2VzcygpXG4gICAgQHNldHVwRG9ja01lbnUoKVxuXG4gICAgQGxhdW5jaChvcHRpb25zKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgd2luZG93c0Nsb3NlUHJvbWlzZXMgPSBAd2luZG93cy5tYXAgKHdpbmRvdykgLT5cbiAgICAgIHdpbmRvdy5jbG9zZSgpXG4gICAgICB3aW5kb3cuY2xvc2VkUHJvbWlzZVxuICAgIFByb21pc2UuYWxsKHdpbmRvd3NDbG9zZVByb21pc2VzKS50aGVuKD0+IEBkaXNwb3NhYmxlLmRpc3Bvc2UoKSlcblxuICBsYXVuY2g6IChvcHRpb25zKSAtPlxuICAgIGlmIG9wdGlvbnMucGF0aHNUb09wZW4/Lmxlbmd0aCA+IDAgb3Igb3B0aW9ucy51cmxzVG9PcGVuPy5sZW5ndGggPiAwIG9yIG9wdGlvbnMudGVzdCBvciBvcHRpb25zLmJlbmNobWFyayBvciBvcHRpb25zLmJlbmNobWFya1Rlc3RcbiAgICAgIEBvcGVuV2l0aE9wdGlvbnMob3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBAbG9hZFN0YXRlKG9wdGlvbnMpIG9yIEBvcGVuUGF0aChvcHRpb25zKVxuXG4gIG9wZW5XaXRoT3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAge1xuICAgICAgaW5pdGlhbFBhdGhzLCBwYXRoc1RvT3BlbiwgZXhlY3V0ZWRGcm9tLCB1cmxzVG9PcGVuLCBiZW5jaG1hcmssXG4gICAgICBiZW5jaG1hcmtUZXN0LCB0ZXN0LCBwaWRUb0tpbGxXaGVuQ2xvc2VkLCBkZXZNb2RlLCBzYWZlTW9kZSwgbmV3V2luZG93LFxuICAgICAgbG9nRmlsZSwgcHJvZmlsZVN0YXJ0dXAsIHRpbWVvdXQsIGNsZWFyV2luZG93U3RhdGUsIGFkZFRvTGFzdFdpbmRvdywgZW52XG4gICAgfSA9IG9wdGlvbnNcblxuICAgIGFwcC5mb2N1cygpXG5cbiAgICBpZiB0ZXN0XG4gICAgICBAcnVuVGVzdHMoe1xuICAgICAgICBoZWFkbGVzczogdHJ1ZSwgZGV2TW9kZSwgQHJlc291cmNlUGF0aCwgZXhlY3V0ZWRGcm9tLCBwYXRoc1RvT3BlbixcbiAgICAgICAgbG9nRmlsZSwgdGltZW91dCwgZW52XG4gICAgICB9KVxuICAgIGVsc2UgaWYgYmVuY2htYXJrIG9yIGJlbmNobWFya1Rlc3RcbiAgICAgIEBydW5CZW5jaG1hcmtzKHtoZWFkbGVzczogdHJ1ZSwgdGVzdDogYmVuY2htYXJrVGVzdCwgQHJlc291cmNlUGF0aCwgZXhlY3V0ZWRGcm9tLCBwYXRoc1RvT3BlbiwgdGltZW91dCwgZW52fSlcbiAgICBlbHNlIGlmIHBhdGhzVG9PcGVuLmxlbmd0aCA+IDBcbiAgICAgIEBvcGVuUGF0aHMoe1xuICAgICAgICBpbml0aWFsUGF0aHMsIHBhdGhzVG9PcGVuLCBleGVjdXRlZEZyb20sIHBpZFRvS2lsbFdoZW5DbG9zZWQsIG5ld1dpbmRvdyxcbiAgICAgICAgZGV2TW9kZSwgc2FmZU1vZGUsIHByb2ZpbGVTdGFydHVwLCBjbGVhcldpbmRvd1N0YXRlLCBhZGRUb0xhc3RXaW5kb3csIGVudlxuICAgICAgfSlcbiAgICBlbHNlIGlmIHVybHNUb09wZW4ubGVuZ3RoID4gMFxuICAgICAgZm9yIHVybFRvT3BlbiBpbiB1cmxzVG9PcGVuXG4gICAgICAgIEBvcGVuVXJsKHt1cmxUb09wZW4sIGRldk1vZGUsIHNhZmVNb2RlLCBlbnZ9KVxuICAgIGVsc2VcbiAgICAgICMgQWx3YXlzIG9wZW4gYSBlZGl0b3Igd2luZG93IGlmIHRoaXMgaXMgdGhlIGZpcnN0IGluc3RhbmNlIG9mIEF0b20uXG4gICAgICBAb3BlblBhdGgoe1xuICAgICAgICBpbml0aWFsUGF0aHMsIHBpZFRvS2lsbFdoZW5DbG9zZWQsIG5ld1dpbmRvdywgZGV2TW9kZSwgc2FmZU1vZGUsIHByb2ZpbGVTdGFydHVwLFxuICAgICAgICBjbGVhcldpbmRvd1N0YXRlLCBhZGRUb0xhc3RXaW5kb3csIGVudlxuICAgICAgfSlcblxuICAjIFB1YmxpYzogUmVtb3ZlcyB0aGUge0F0b21XaW5kb3d9IGZyb20gdGhlIGdsb2JhbCB3aW5kb3cgbGlzdC5cbiAgcmVtb3ZlV2luZG93OiAod2luZG93KSAtPlxuICAgIEB3aW5kb3dzLnNwbGljZShAd2luZG93cy5pbmRleE9mKHdpbmRvdyksIDEpXG4gICAgaWYgQHdpbmRvd3MubGVuZ3RoIGlzIDBcbiAgICAgIEBhcHBsaWNhdGlvbk1lbnU/LmVuYWJsZVdpbmRvd1NwZWNpZmljSXRlbXMoZmFsc2UpXG4gICAgICBpZiBwcm9jZXNzLnBsYXRmb3JtIGluIFsnd2luMzInLCAnbGludXgnXVxuICAgICAgICBhcHAucXVpdCgpXG4gICAgICAgIHJldHVyblxuICAgIEBzYXZlU3RhdGUodHJ1ZSkgdW5sZXNzIHdpbmRvdy5pc1NwZWNcblxuICAjIFB1YmxpYzogQWRkcyB0aGUge0F0b21XaW5kb3d9IHRvIHRoZSBnbG9iYWwgd2luZG93IGxpc3QuXG4gIGFkZFdpbmRvdzogKHdpbmRvdykgLT5cbiAgICBAd2luZG93cy5wdXNoIHdpbmRvd1xuICAgIEBhcHBsaWNhdGlvbk1lbnU/LmFkZFdpbmRvdyh3aW5kb3cuYnJvd3NlcldpbmRvdylcbiAgICB3aW5kb3cub25jZSAnd2luZG93OmxvYWRlZCcsID0+XG4gICAgICBAYXV0b1VwZGF0ZU1hbmFnZXI/LmVtaXRVcGRhdGVBdmFpbGFibGVFdmVudCh3aW5kb3cpXG5cbiAgICB1bmxlc3Mgd2luZG93LmlzU3BlY1xuICAgICAgZm9jdXNIYW5kbGVyID0gPT4gQGxhc3RGb2N1c2VkV2luZG93ID0gd2luZG93XG4gICAgICBibHVySGFuZGxlciA9ID0+IEBzYXZlU3RhdGUoZmFsc2UpXG4gICAgICB3aW5kb3cuYnJvd3NlcldpbmRvdy5vbiAnZm9jdXMnLCBmb2N1c0hhbmRsZXJcbiAgICAgIHdpbmRvdy5icm93c2VyV2luZG93Lm9uICdibHVyJywgYmx1ckhhbmRsZXJcbiAgICAgIHdpbmRvdy5icm93c2VyV2luZG93Lm9uY2UgJ2Nsb3NlZCcsID0+XG4gICAgICAgIEBsYXN0Rm9jdXNlZFdpbmRvdyA9IG51bGwgaWYgd2luZG93IGlzIEBsYXN0Rm9jdXNlZFdpbmRvd1xuICAgICAgICB3aW5kb3cuYnJvd3NlcldpbmRvdy5yZW1vdmVMaXN0ZW5lciAnZm9jdXMnLCBmb2N1c0hhbmRsZXJcbiAgICAgICAgd2luZG93LmJyb3dzZXJXaW5kb3cucmVtb3ZlTGlzdGVuZXIgJ2JsdXInLCBibHVySGFuZGxlclxuICAgICAgd2luZG93LmJyb3dzZXJXaW5kb3cud2ViQ29udGVudHMub25jZSAnZGlkLWZpbmlzaC1sb2FkJywgPT4gQHNhdmVTdGF0ZShmYWxzZSlcblxuICAjIENyZWF0ZXMgc2VydmVyIHRvIGxpc3RlbiBmb3IgYWRkaXRpb25hbCBhdG9tIGFwcGxpY2F0aW9uIGxhdW5jaGVzLlxuICAjXG4gICMgWW91IGNhbiBydW4gdGhlIGF0b20gY29tbWFuZCBtdWx0aXBsZSB0aW1lcywgYnV0IGFmdGVyIHRoZSBmaXJzdCBsYXVuY2hcbiAgIyB0aGUgb3RoZXIgbGF1bmNoZXMgd2lsbCBqdXN0IHBhc3MgdGhlaXIgaW5mb3JtYXRpb24gdG8gdGhpcyBzZXJ2ZXIgYW5kIHRoZW5cbiAgIyBjbG9zZSBpbW1lZGlhdGVseS5cbiAgbGlzdGVuRm9yQXJndW1lbnRzRnJvbU5ld1Byb2Nlc3M6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAc29ja2V0UGF0aD9cbiAgICBAZGVsZXRlU29ja2V0RmlsZSgpXG4gICAgc2VydmVyID0gbmV0LmNyZWF0ZVNlcnZlciAoY29ubmVjdGlvbikgPT5cbiAgICAgIGRhdGEgPSAnJ1xuICAgICAgY29ubmVjdGlvbi5vbiAnZGF0YScsIChjaHVuaykgLT5cbiAgICAgICAgZGF0YSA9IGRhdGEgKyBjaHVua1xuXG4gICAgICBjb25uZWN0aW9uLm9uICdlbmQnLCA9PlxuICAgICAgICBvcHRpb25zID0gSlNPTi5wYXJzZShkYXRhKVxuICAgICAgICBAb3BlbldpdGhPcHRpb25zKG9wdGlvbnMpXG5cbiAgICBzZXJ2ZXIubGlzdGVuIEBzb2NrZXRQYXRoXG4gICAgc2VydmVyLm9uICdlcnJvcicsIChlcnJvcikgLT4gY29uc29sZS5lcnJvciAnQXBwbGljYXRpb24gc2VydmVyIGZhaWxlZCcsIGVycm9yXG5cbiAgZGVsZXRlU29ja2V0RmlsZTogLT5cbiAgICByZXR1cm4gaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInIG9yIG5vdCBAc29ja2V0UGF0aD9cblxuICAgIGlmIGZzLmV4aXN0c1N5bmMoQHNvY2tldFBhdGgpXG4gICAgICB0cnlcbiAgICAgICAgZnMudW5saW5rU3luYyhAc29ja2V0UGF0aClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICMgSWdub3JlIEVOT0VOVCBlcnJvcnMgaW4gY2FzZSB0aGUgZmlsZSB3YXMgZGVsZXRlZCBiZXR3ZWVuIHRoZSBleGlzdHNcbiAgICAgICAgIyBjaGVjayBhbmQgdGhlIGNhbGwgdG8gdW5saW5rIHN5bmMuIFRoaXMgb2NjdXJyZWQgb2NjYXNpb25hbGx5IG9uIENJXG4gICAgICAgICMgd2hpY2ggaXMgd2h5IHRoaXMgY2hlY2sgaXMgaGVyZS5cbiAgICAgICAgdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yLmNvZGUgaXMgJ0VOT0VOVCdcblxuICAjIFJlZ2lzdGVycyBiYXNpYyBhcHBsaWNhdGlvbiBjb21tYW5kcywgbm9uLWlkZW1wb3RlbnQuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBnZXRMb2FkU2V0dGluZ3MgPSA9PlxuICAgICAgZGV2TW9kZTogQGZvY3VzZWRXaW5kb3coKT8uZGV2TW9kZVxuICAgICAgc2FmZU1vZGU6IEBmb2N1c2VkV2luZG93KCk/LnNhZmVNb2RlXG5cbiAgICBAb24gJ2FwcGxpY2F0aW9uOnF1aXQnLCAtPiBhcHAucXVpdCgpXG4gICAgQG9uICdhcHBsaWNhdGlvbjpuZXctd2luZG93JywgLT4gQG9wZW5QYXRoKGdldExvYWRTZXR0aW5ncygpKVxuICAgIEBvbiAnYXBwbGljYXRpb246bmV3LWZpbGUnLCAtPiAoQGZvY3VzZWRXaW5kb3coKSA/IHRoaXMpLm9wZW5QYXRoKClcbiAgICBAb24gJ2FwcGxpY2F0aW9uOm9wZW4tZGV2JywgLT4gQHByb21wdEZvclBhdGhUb09wZW4oJ2FsbCcsIGRldk1vZGU6IHRydWUpXG4gICAgQG9uICdhcHBsaWNhdGlvbjpvcGVuLXNhZmUnLCAtPiBAcHJvbXB0Rm9yUGF0aFRvT3BlbignYWxsJywgc2FmZU1vZGU6IHRydWUpXG4gICAgQG9uICdhcHBsaWNhdGlvbjppbnNwZWN0JywgKHt4LCB5LCBhdG9tV2luZG93fSkgLT5cbiAgICAgIGF0b21XaW5kb3cgPz0gQGZvY3VzZWRXaW5kb3coKVxuICAgICAgYXRvbVdpbmRvdz8uYnJvd3NlcldpbmRvdy5pbnNwZWN0RWxlbWVudCh4LCB5KVxuXG4gICAgQG9uICdhcHBsaWNhdGlvbjpvcGVuLWRvY3VtZW50YXRpb24nLCAtPiBzaGVsbC5vcGVuRXh0ZXJuYWwoJ2h0dHA6Ly9mbGlnaHQtbWFudWFsLmF0b20uaW8vJylcbiAgICBAb24gJ2FwcGxpY2F0aW9uOm9wZW4tZGlzY3Vzc2lvbnMnLCAtPiBzaGVsbC5vcGVuRXh0ZXJuYWwoJ2h0dHBzOi8vZGlzY3Vzcy5hdG9tLmlvJylcbiAgICBAb24gJ2FwcGxpY2F0aW9uOm9wZW4tZmFxJywgLT4gc2hlbGwub3BlbkV4dGVybmFsKCdodHRwczovL2F0b20uaW8vZmFxJylcbiAgICBAb24gJ2FwcGxpY2F0aW9uOm9wZW4tdGVybXMtb2YtdXNlJywgLT4gc2hlbGwub3BlbkV4dGVybmFsKCdodHRwczovL2F0b20uaW8vdGVybXMnKVxuICAgIEBvbiAnYXBwbGljYXRpb246cmVwb3J0LWlzc3VlJywgLT4gc2hlbGwub3BlbkV4dGVybmFsKCdodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2Jsb2IvbWFzdGVyL0NPTlRSSUJVVElORy5tZCNzdWJtaXR0aW5nLWlzc3VlcycpXG4gICAgQG9uICdhcHBsaWNhdGlvbjpzZWFyY2gtaXNzdWVzJywgLT4gc2hlbGwub3BlbkV4dGVybmFsKCdodHRwczovL2dpdGh1Yi5jb20vaXNzdWVzP3E9K2lzJTNBaXNzdWUrdXNlciUzQWF0b20nKVxuXG4gICAgQG9uICdhcHBsaWNhdGlvbjppbnN0YWxsLXVwZGF0ZScsID0+XG4gICAgICBAcXVpdHRpbmcgPSB0cnVlXG4gICAgICBAYXV0b1VwZGF0ZU1hbmFnZXIuaW5zdGFsbCgpXG5cbiAgICBAb24gJ2FwcGxpY2F0aW9uOmNoZWNrLWZvci11cGRhdGUnLCA9PiBAYXV0b1VwZGF0ZU1hbmFnZXIuY2hlY2soKVxuXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuICAgICAgQG9uICdhcHBsaWNhdGlvbjpicmluZy1hbGwtd2luZG93cy10by1mcm9udCcsIC0+IE1lbnUuc2VuZEFjdGlvblRvRmlyc3RSZXNwb25kZXIoJ2FycmFuZ2VJbkZyb250OicpXG4gICAgICBAb24gJ2FwcGxpY2F0aW9uOmhpZGUnLCAtPiBNZW51LnNlbmRBY3Rpb25Ub0ZpcnN0UmVzcG9uZGVyKCdoaWRlOicpXG4gICAgICBAb24gJ2FwcGxpY2F0aW9uOmhpZGUtb3RoZXItYXBwbGljYXRpb25zJywgLT4gTWVudS5zZW5kQWN0aW9uVG9GaXJzdFJlc3BvbmRlcignaGlkZU90aGVyQXBwbGljYXRpb25zOicpXG4gICAgICBAb24gJ2FwcGxpY2F0aW9uOm1pbmltaXplJywgLT4gTWVudS5zZW5kQWN0aW9uVG9GaXJzdFJlc3BvbmRlcigncGVyZm9ybU1pbmlhdHVyaXplOicpXG4gICAgICBAb24gJ2FwcGxpY2F0aW9uOnVuaGlkZS1hbGwtYXBwbGljYXRpb25zJywgLT4gTWVudS5zZW5kQWN0aW9uVG9GaXJzdFJlc3BvbmRlcigndW5oaWRlQWxsQXBwbGljYXRpb25zOicpXG4gICAgICBAb24gJ2FwcGxpY2F0aW9uOnpvb20nLCAtPiBNZW51LnNlbmRBY3Rpb25Ub0ZpcnN0UmVzcG9uZGVyKCd6b29tOicpXG4gICAgZWxzZVxuICAgICAgQG9uICdhcHBsaWNhdGlvbjptaW5pbWl6ZScsIC0+IEBmb2N1c2VkV2luZG93KCk/Lm1pbmltaXplKClcbiAgICAgIEBvbiAnYXBwbGljYXRpb246em9vbScsIC0+IEBmb2N1c2VkV2luZG93KCk/Lm1heGltaXplKClcblxuICAgIEBvcGVuUGF0aE9uRXZlbnQoJ2FwcGxpY2F0aW9uOmFib3V0JywgJ2F0b206Ly9hYm91dCcpXG4gICAgQG9wZW5QYXRoT25FdmVudCgnYXBwbGljYXRpb246c2hvdy1zZXR0aW5ncycsICdhdG9tOi8vY29uZmlnJylcbiAgICBAb3BlblBhdGhPbkV2ZW50KCdhcHBsaWNhdGlvbjpvcGVuLXlvdXItY29uZmlnJywgJ2F0b206Ly8uYXRvbS9jb25maWcnKVxuICAgIEBvcGVuUGF0aE9uRXZlbnQoJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1pbml0LXNjcmlwdCcsICdhdG9tOi8vLmF0b20vaW5pdC1zY3JpcHQnKVxuICAgIEBvcGVuUGF0aE9uRXZlbnQoJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1rZXltYXAnLCAnYXRvbTovLy5hdG9tL2tleW1hcCcpXG4gICAgQG9wZW5QYXRoT25FdmVudCgnYXBwbGljYXRpb246b3Blbi15b3VyLXNuaXBwZXRzJywgJ2F0b206Ly8uYXRvbS9zbmlwcGV0cycpXG4gICAgQG9wZW5QYXRoT25FdmVudCgnYXBwbGljYXRpb246b3Blbi15b3VyLXN0eWxlc2hlZXQnLCAnYXRvbTovLy5hdG9tL3N0eWxlc2hlZXQnKVxuICAgIEBvcGVuUGF0aE9uRXZlbnQoJ2FwcGxpY2F0aW9uOm9wZW4tbGljZW5zZScsIHBhdGguam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsICdMSUNFTlNFLm1kJykpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBhcHAsICdiZWZvcmUtcXVpdCcsIChldmVudCkgPT5cbiAgICAgIHVubGVzcyBAcXVpdHRpbmdcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBAcXVpdHRpbmcgPSB0cnVlXG4gICAgICAgIFByb21pc2UuYWxsKEB3aW5kb3dzLm1hcCgod2luZG93KSAtPiB3aW5kb3cuc2F2ZVN0YXRlKCkpKS50aGVuKC0+IGFwcC5xdWl0KCkpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBhcHAsICd3aWxsLXF1aXQnLCA9PlxuICAgICAgQGtpbGxBbGxQcm9jZXNzZXMoKVxuICAgICAgQGRlbGV0ZVNvY2tldEZpbGUoKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gYXBwLCAnb3Blbi1maWxlJywgKGV2ZW50LCBwYXRoVG9PcGVuKSA9PlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgQG9wZW5QYXRoKHtwYXRoVG9PcGVufSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGFwcCwgJ29wZW4tdXJsJywgKGV2ZW50LCB1cmxUb09wZW4pID0+XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAb3BlblVybCh7dXJsVG9PcGVuLCBAZGV2TW9kZSwgQHNhZmVNb2RlfSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGFwcCwgJ2FjdGl2YXRlJywgKGV2ZW50LCBoYXNWaXNpYmxlV2luZG93cykgPT5cbiAgICAgIHVubGVzcyBoYXNWaXNpYmxlV2luZG93c1xuICAgICAgICBldmVudD8ucHJldmVudERlZmF1bHQoKVxuICAgICAgICBAZW1pdCgnYXBwbGljYXRpb246bmV3LXdpbmRvdycpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAncmVzdGFydC1hcHBsaWNhdGlvbicsID0+XG4gICAgICBAcmVzdGFydCgpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnZGlkLWNoYW5nZS1oaXN0b3J5LW1hbmFnZXInLCAoZXZlbnQpID0+XG4gICAgICBmb3IgYXRvbVdpbmRvdyBpbiBAd2luZG93c1xuICAgICAgICB3ZWJDb250ZW50cyA9IGF0b21XaW5kb3cuYnJvd3NlcldpbmRvdy53ZWJDb250ZW50c1xuICAgICAgICBpZiB3ZWJDb250ZW50cyBpc250IGV2ZW50LnNlbmRlclxuICAgICAgICAgIHdlYkNvbnRlbnRzLnNlbmQoJ2RpZC1jaGFuZ2UtaGlzdG9yeS1tYW5hZ2VyJylcblxuICAgICMgQSByZXF1ZXN0IGZyb20gdGhlIGFzc29jaWF0ZWQgcmVuZGVyIHByb2Nlc3MgdG8gb3BlbiBhIG5ldyByZW5kZXIgcHJvY2Vzcy5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnb3BlbicsIChldmVudCwgb3B0aW9ucykgPT5cbiAgICAgIHdpbmRvdyA9IEBhdG9tV2luZG93Rm9yRXZlbnQoZXZlbnQpXG4gICAgICBpZiBvcHRpb25zP1xuICAgICAgICBpZiB0eXBlb2Ygb3B0aW9ucy5wYXRoc1RvT3BlbiBpcyAnc3RyaW5nJ1xuICAgICAgICAgIG9wdGlvbnMucGF0aHNUb09wZW4gPSBbb3B0aW9ucy5wYXRoc1RvT3Blbl1cbiAgICAgICAgaWYgb3B0aW9ucy5wYXRoc1RvT3Blbj8ubGVuZ3RoID4gMFxuICAgICAgICAgIG9wdGlvbnMud2luZG93ID0gd2luZG93XG4gICAgICAgICAgQG9wZW5QYXRocyhvcHRpb25zKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbmV3IEF0b21XaW5kb3codGhpcywgQGZpbGVSZWNvdmVyeVNlcnZpY2UsIG9wdGlvbnMpXG4gICAgICBlbHNlXG4gICAgICAgIEBwcm9tcHRGb3JQYXRoVG9PcGVuKCdhbGwnLCB7d2luZG93fSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICd1cGRhdGUtYXBwbGljYXRpb24tbWVudScsIChldmVudCwgdGVtcGxhdGUsIGtleXN0cm9rZXNCeUNvbW1hbmQpID0+XG4gICAgICB3aW4gPSBCcm93c2VyV2luZG93LmZyb21XZWJDb250ZW50cyhldmVudC5zZW5kZXIpXG4gICAgICBAYXBwbGljYXRpb25NZW51Py51cGRhdGUod2luLCB0ZW1wbGF0ZSwga2V5c3Ryb2tlc0J5Q29tbWFuZClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICdydW4tcGFja2FnZS1zcGVjcycsIChldmVudCwgcGFja2FnZVNwZWNQYXRoKSA9PlxuICAgICAgQHJ1blRlc3RzKHtyZXNvdXJjZVBhdGg6IEBkZXZSZXNvdXJjZVBhdGgsIHBhdGhzVG9PcGVuOiBbcGFja2FnZVNwZWNQYXRoXSwgaGVhZGxlc3M6IGZhbHNlfSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICdydW4tYmVuY2htYXJrcycsIChldmVudCwgYmVuY2htYXJrc1BhdGgpID0+XG4gICAgICBAcnVuQmVuY2htYXJrcyh7cmVzb3VyY2VQYXRoOiBAZGV2UmVzb3VyY2VQYXRoLCBwYXRoc1RvT3BlbjogW2JlbmNobWFya3NQYXRoXSwgaGVhZGxlc3M6IGZhbHNlLCB0ZXN0OiBmYWxzZX0pXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnY29tbWFuZCcsIChldmVudCwgY29tbWFuZCkgPT5cbiAgICAgIEBlbWl0KGNvbW1hbmQpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnb3Blbi1jb21tYW5kJywgKGV2ZW50LCBjb21tYW5kLCBhcmdzLi4uKSA9PlxuICAgICAgZGVmYXVsdFBhdGggPSBhcmdzWzBdIGlmIGFyZ3MubGVuZ3RoID4gMFxuICAgICAgc3dpdGNoIGNvbW1hbmRcbiAgICAgICAgd2hlbiAnYXBwbGljYXRpb246b3BlbicgdGhlbiBAcHJvbXB0Rm9yUGF0aFRvT3BlbignYWxsJywgZ2V0TG9hZFNldHRpbmdzKCksIGRlZmF1bHRQYXRoKVxuICAgICAgICB3aGVuICdhcHBsaWNhdGlvbjpvcGVuLWZpbGUnIHRoZW4gQHByb21wdEZvclBhdGhUb09wZW4oJ2ZpbGUnLCBnZXRMb2FkU2V0dGluZ3MoKSwgZGVmYXVsdFBhdGgpXG4gICAgICAgIHdoZW4gJ2FwcGxpY2F0aW9uOm9wZW4tZm9sZGVyJyB0aGVuIEBwcm9tcHRGb3JQYXRoVG9PcGVuKCdmb2xkZXInLCBnZXRMb2FkU2V0dGluZ3MoKSwgZGVmYXVsdFBhdGgpXG4gICAgICAgIGVsc2UgY29uc29sZS5sb2cgXCJJbnZhbGlkIG9wZW4tY29tbWFuZCByZWNlaXZlZDogXCIgKyBjb21tYW5kXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnd2luZG93LWNvbW1hbmQnLCAoZXZlbnQsIGNvbW1hbmQsIGFyZ3MuLi4pIC0+XG4gICAgICB3aW4gPSBCcm93c2VyV2luZG93LmZyb21XZWJDb250ZW50cyhldmVudC5zZW5kZXIpXG4gICAgICB3aW4uZW1pdChjb21tYW5kLCBhcmdzLi4uKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMucmVzcG9uZFRvICd3aW5kb3ctbWV0aG9kJywgKGJyb3dzZXJXaW5kb3csIG1ldGhvZCwgYXJncy4uLikgPT5cbiAgICAgIEBhdG9tV2luZG93Rm9yQnJvd3NlcldpbmRvdyhicm93c2VyV2luZG93KT9bbWV0aG9kXShhcmdzLi4uKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ3BpY2stZm9sZGVyJywgKGV2ZW50LCByZXNwb25zZUNoYW5uZWwpID0+XG4gICAgICBAcHJvbXB0Rm9yUGF0aCBcImZvbGRlclwiLCAoc2VsZWN0ZWRQYXRocykgLT5cbiAgICAgICAgZXZlbnQuc2VuZGVyLnNlbmQocmVzcG9uc2VDaGFubmVsLCBzZWxlY3RlZFBhdGhzKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMucmVzcG9uZFRvICdzZXQtd2luZG93LXNpemUnLCAod2luLCB3aWR0aCwgaGVpZ2h0KSAtPlxuICAgICAgd2luLnNldFNpemUod2lkdGgsIGhlaWdodClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLnJlc3BvbmRUbyAnc2V0LXdpbmRvdy1wb3NpdGlvbicsICh3aW4sIHgsIHkpIC0+XG4gICAgICB3aW4uc2V0UG9zaXRpb24oeCwgeSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLnJlc3BvbmRUbyAnY2VudGVyLXdpbmRvdycsICh3aW4pIC0+XG4gICAgICB3aW4uY2VudGVyKClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLnJlc3BvbmRUbyAnZm9jdXMtd2luZG93JywgKHdpbikgLT5cbiAgICAgIHdpbi5mb2N1cygpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5yZXNwb25kVG8gJ3Nob3ctd2luZG93JywgKHdpbikgLT5cbiAgICAgIHdpbi5zaG93KClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLnJlc3BvbmRUbyAnaGlkZS13aW5kb3cnLCAod2luKSAtPlxuICAgICAgd2luLmhpZGUoKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMucmVzcG9uZFRvICdnZXQtdGVtcG9yYXJ5LXdpbmRvdy1zdGF0ZScsICh3aW4pIC0+XG4gICAgICB3aW4udGVtcG9yYXJ5U3RhdGVcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLnJlc3BvbmRUbyAnc2V0LXRlbXBvcmFyeS13aW5kb3ctc3RhdGUnLCAod2luLCBzdGF0ZSkgLT5cbiAgICAgIHdpbi50ZW1wb3JhcnlTdGF0ZSA9IHN0YXRlXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnZGlkLWNhbmNlbC13aW5kb3ctdW5sb2FkJywgPT5cbiAgICAgIEBxdWl0dGluZyA9IGZhbHNlXG4gICAgICBmb3Igd2luZG93IGluIEB3aW5kb3dzXG4gICAgICAgIHdpbmRvdy5kaWRDYW5jZWxXaW5kb3dVbmxvYWQoKVxuXG4gICAgY2xpcGJvYXJkID0gcmVxdWlyZSAnLi4vc2FmZS1jbGlwYm9hcmQnXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ3dyaXRlLXRleHQtdG8tc2VsZWN0aW9uLWNsaXBib2FyZCcsIChldmVudCwgc2VsZWN0ZWRUZXh0KSAtPlxuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChzZWxlY3RlZFRleHQsICdzZWxlY3Rpb24nKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ3dyaXRlLXRvLXN0ZG91dCcsIChldmVudCwgb3V0cHV0KSAtPlxuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUob3V0cHV0KVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ3dyaXRlLXRvLXN0ZGVycicsIChldmVudCwgb3V0cHV0KSAtPlxuICAgICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUob3V0cHV0KVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ2FkZC1yZWNlbnQtZG9jdW1lbnQnLCAoZXZlbnQsIGZpbGVuYW1lKSAtPlxuICAgICAgYXBwLmFkZFJlY2VudERvY3VtZW50KGZpbGVuYW1lKVxuXG4gICAgQGRpc3Bvc2FibGUuYWRkIGlwY0hlbHBlcnMub24gaXBjTWFpbiwgJ2V4ZWN1dGUtamF2YXNjcmlwdC1pbi1kZXYtdG9vbHMnLCAoZXZlbnQsIGNvZGUpIC0+XG4gICAgICBldmVudC5zZW5kZXIuZGV2VG9vbHNXZWJDb250ZW50cz8uZXhlY3V0ZUphdmFTY3JpcHQoY29kZSlcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICdnZXQtYXV0by11cGRhdGUtbWFuYWdlci1zdGF0ZScsIChldmVudCkgPT5cbiAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gQGF1dG9VcGRhdGVNYW5hZ2VyLmdldFN0YXRlKClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICdnZXQtYXV0by11cGRhdGUtbWFuYWdlci1lcnJvcicsIChldmVudCkgPT5cbiAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gQGF1dG9VcGRhdGVNYW5hZ2VyLmdldEVycm9yTWVzc2FnZSgpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgaXBjSGVscGVycy5vbiBpcGNNYWluLCAnd2lsbC1zYXZlLXBhdGgnLCAoZXZlbnQsIHBhdGgpID0+XG4gICAgICBAZmlsZVJlY292ZXJ5U2VydmljZS53aWxsU2F2ZVBhdGgoQGF0b21XaW5kb3dGb3JFdmVudChldmVudCksIHBhdGgpXG4gICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IHRydWVcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBpcGNIZWxwZXJzLm9uIGlwY01haW4sICdkaWQtc2F2ZS1wYXRoJywgKGV2ZW50LCBwYXRoKSA9PlxuICAgICAgQGZpbGVSZWNvdmVyeVNlcnZpY2UuZGlkU2F2ZVBhdGgoQGF0b21XaW5kb3dGb3JFdmVudChldmVudCksIHBhdGgpXG4gICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IHRydWVcblxuICBzZXR1cERvY2tNZW51OiAtPlxuICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcbiAgICAgIGRvY2tNZW51ID0gTWVudS5idWlsZEZyb21UZW1wbGF0ZSBbXG4gICAgICAgIHtsYWJlbDogJ05ldyBXaW5kb3cnLCAgY2xpY2s6ID0+IEBlbWl0KCdhcHBsaWNhdGlvbjpuZXctd2luZG93Jyl9XG4gICAgICBdXG4gICAgICBhcHAuZG9jay5zZXRNZW51IGRvY2tNZW51XG5cbiAgIyBQdWJsaWM6IEV4ZWN1dGVzIHRoZSBnaXZlbiBjb21tYW5kLlxuICAjXG4gICMgSWYgaXQgaXNuJ3QgaGFuZGxlZCBnbG9iYWxseSwgZGVsZWdhdGUgdG8gdGhlIGN1cnJlbnRseSBmb2N1c2VkIHdpbmRvdy5cbiAgI1xuICAjIGNvbW1hbmQgLSBUaGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY29tbWFuZC5cbiAgIyBhcmdzIC0gVGhlIG9wdGlvbmFsIGFyZ3VtZW50cyB0byBwYXNzIGFsb25nLlxuICBzZW5kQ29tbWFuZDogKGNvbW1hbmQsIGFyZ3MuLi4pIC0+XG4gICAgdW5sZXNzIEBlbWl0KGNvbW1hbmQsIGFyZ3MuLi4pXG4gICAgICBmb2N1c2VkV2luZG93ID0gQGZvY3VzZWRXaW5kb3coKVxuICAgICAgaWYgZm9jdXNlZFdpbmRvdz9cbiAgICAgICAgZm9jdXNlZFdpbmRvdy5zZW5kQ29tbWFuZChjb21tYW5kLCBhcmdzLi4uKVxuICAgICAgZWxzZVxuICAgICAgICBAc2VuZENvbW1hbmRUb0ZpcnN0UmVzcG9uZGVyKGNvbW1hbmQpXG5cbiAgIyBQdWJsaWM6IEV4ZWN1dGVzIHRoZSBnaXZlbiBjb21tYW5kIG9uIHRoZSBnaXZlbiB3aW5kb3cuXG4gICNcbiAgIyBjb21tYW5kIC0gVGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGNvbW1hbmQuXG4gICMgYXRvbVdpbmRvdyAtIFRoZSB7QXRvbVdpbmRvd30gdG8gc2VuZCB0aGUgY29tbWFuZCB0by5cbiAgIyBhcmdzIC0gVGhlIG9wdGlvbmFsIGFyZ3VtZW50cyB0byBwYXNzIGFsb25nLlxuICBzZW5kQ29tbWFuZFRvV2luZG93OiAoY29tbWFuZCwgYXRvbVdpbmRvdywgYXJncy4uLikgLT5cbiAgICB1bmxlc3MgQGVtaXQoY29tbWFuZCwgYXJncy4uLilcbiAgICAgIGlmIGF0b21XaW5kb3c/XG4gICAgICAgIGF0b21XaW5kb3cuc2VuZENvbW1hbmQoY29tbWFuZCwgYXJncy4uLilcbiAgICAgIGVsc2VcbiAgICAgICAgQHNlbmRDb21tYW5kVG9GaXJzdFJlc3BvbmRlcihjb21tYW5kKVxuXG4gICMgVHJhbnNsYXRlcyB0aGUgY29tbWFuZCBpbnRvIG1hY09TIGFjdGlvbiBhbmQgc2VuZHMgaXQgdG8gYXBwbGljYXRpb24ncyBmaXJzdFxuICAjIHJlc3BvbmRlci5cbiAgc2VuZENvbW1hbmRUb0ZpcnN0UmVzcG9uZGVyOiAoY29tbWFuZCkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcblxuICAgIHN3aXRjaCBjb21tYW5kXG4gICAgICB3aGVuICdjb3JlOnVuZG8nIHRoZW4gTWVudS5zZW5kQWN0aW9uVG9GaXJzdFJlc3BvbmRlcigndW5kbzonKVxuICAgICAgd2hlbiAnY29yZTpyZWRvJyB0aGVuIE1lbnUuc2VuZEFjdGlvblRvRmlyc3RSZXNwb25kZXIoJ3JlZG86JylcbiAgICAgIHdoZW4gJ2NvcmU6Y29weScgdGhlbiBNZW51LnNlbmRBY3Rpb25Ub0ZpcnN0UmVzcG9uZGVyKCdjb3B5OicpXG4gICAgICB3aGVuICdjb3JlOmN1dCcgdGhlbiBNZW51LnNlbmRBY3Rpb25Ub0ZpcnN0UmVzcG9uZGVyKCdjdXQ6JylcbiAgICAgIHdoZW4gJ2NvcmU6cGFzdGUnIHRoZW4gTWVudS5zZW5kQWN0aW9uVG9GaXJzdFJlc3BvbmRlcigncGFzdGU6JylcbiAgICAgIHdoZW4gJ2NvcmU6c2VsZWN0LWFsbCcgdGhlbiBNZW51LnNlbmRBY3Rpb25Ub0ZpcnN0UmVzcG9uZGVyKCdzZWxlY3RBbGw6JylcbiAgICAgIGVsc2UgcmV0dXJuIGZhbHNlXG4gICAgdHJ1ZVxuXG4gICMgUHVibGljOiBPcGVuIHRoZSBnaXZlbiBwYXRoIGluIHRoZSBmb2N1c2VkIHdpbmRvdyB3aGVuIHRoZSBldmVudCBpc1xuICAjIHRyaWdnZXJlZC5cbiAgI1xuICAjIEEgbmV3IHdpbmRvdyB3aWxsIGJlIGNyZWF0ZWQgaWYgdGhlcmUgaXMgbm8gY3VycmVudGx5IGZvY3VzZWQgd2luZG93LlxuICAjXG4gICMgZXZlbnROYW1lIC0gVGhlIGV2ZW50IHRvIGxpc3RlbiBmb3IuXG4gICMgcGF0aFRvT3BlbiAtIFRoZSBwYXRoIHRvIG9wZW4gd2hlbiB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkLlxuICBvcGVuUGF0aE9uRXZlbnQ6IChldmVudE5hbWUsIHBhdGhUb09wZW4pIC0+XG4gICAgQG9uIGV2ZW50TmFtZSwgLT5cbiAgICAgIGlmIHdpbmRvdyA9IEBmb2N1c2VkV2luZG93KClcbiAgICAgICAgd2luZG93Lm9wZW5QYXRoKHBhdGhUb09wZW4pXG4gICAgICBlbHNlXG4gICAgICAgIEBvcGVuUGF0aCh7cGF0aFRvT3Blbn0pXG5cbiAgIyBSZXR1cm5zIHRoZSB7QXRvbVdpbmRvd30gZm9yIHRoZSBnaXZlbiBwYXRocy5cbiAgd2luZG93Rm9yUGF0aHM6IChwYXRoc1RvT3BlbiwgZGV2TW9kZSkgLT5cbiAgICBfLmZpbmQgQHdpbmRvd3MsIChhdG9tV2luZG93KSAtPlxuICAgICAgYXRvbVdpbmRvdy5kZXZNb2RlIGlzIGRldk1vZGUgYW5kIGF0b21XaW5kb3cuY29udGFpbnNQYXRocyhwYXRoc1RvT3BlbilcblxuICAjIFJldHVybnMgdGhlIHtBdG9tV2luZG93fSBmb3IgdGhlIGdpdmVuIGlwY01haW4gZXZlbnQuXG4gIGF0b21XaW5kb3dGb3JFdmVudDogKHtzZW5kZXJ9KSAtPlxuICAgIEBhdG9tV2luZG93Rm9yQnJvd3NlcldpbmRvdyhCcm93c2VyV2luZG93LmZyb21XZWJDb250ZW50cyhzZW5kZXIpKVxuXG4gIGF0b21XaW5kb3dGb3JCcm93c2VyV2luZG93OiAoYnJvd3NlcldpbmRvdykgLT5cbiAgICBAd2luZG93cy5maW5kKChhdG9tV2luZG93KSAtPiBhdG9tV2luZG93LmJyb3dzZXJXaW5kb3cgaXMgYnJvd3NlcldpbmRvdylcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY3VycmVudGx5IGZvY3VzZWQge0F0b21XaW5kb3d9IG9yIHVuZGVmaW5lZCBpZiBub25lLlxuICBmb2N1c2VkV2luZG93OiAtPlxuICAgIF8uZmluZCBAd2luZG93cywgKGF0b21XaW5kb3cpIC0+IGF0b21XaW5kb3cuaXNGb2N1c2VkKClcblxuICAjIEdldCB0aGUgcGxhdGZvcm0tc3BlY2lmaWMgd2luZG93IG9mZnNldCBmb3IgbmV3IHdpbmRvd3MuXG4gIGdldFdpbmRvd09mZnNldEZvckN1cnJlbnRQbGF0Zm9ybTogLT5cbiAgICBvZmZzZXRCeVBsYXRmb3JtID1cbiAgICAgIGRhcndpbjogMjJcbiAgICAgIHdpbjMyOiAyNlxuICAgIG9mZnNldEJ5UGxhdGZvcm1bcHJvY2Vzcy5wbGF0Zm9ybV0gPyAwXG5cbiAgIyBHZXQgdGhlIGRpbWVuc2lvbnMgZm9yIG9wZW5pbmcgYSBuZXcgd2luZG93IGJ5IGNhc2NhZGluZyBhcyBhcHByb3ByaWF0ZSB0b1xuICAjIHRoZSBwbGF0Zm9ybS5cbiAgZ2V0RGltZW5zaW9uc0Zvck5ld1dpbmRvdzogLT5cbiAgICByZXR1cm4gaWYgKEBmb2N1c2VkV2luZG93KCkgPyBAbGFzdEZvY3VzZWRXaW5kb3cpPy5pc01heGltaXplZCgpXG4gICAgZGltZW5zaW9ucyA9IChAZm9jdXNlZFdpbmRvdygpID8gQGxhc3RGb2N1c2VkV2luZG93KT8uZ2V0RGltZW5zaW9ucygpXG4gICAgb2Zmc2V0ID0gQGdldFdpbmRvd09mZnNldEZvckN1cnJlbnRQbGF0Zm9ybSgpXG4gICAgaWYgZGltZW5zaW9ucz8gYW5kIG9mZnNldD9cbiAgICAgIGRpbWVuc2lvbnMueCArPSBvZmZzZXRcbiAgICAgIGRpbWVuc2lvbnMueSArPSBvZmZzZXRcbiAgICBkaW1lbnNpb25zXG5cbiAgIyBQdWJsaWM6IE9wZW5zIGEgc2luZ2xlIHBhdGgsIGluIGFuIGV4aXN0aW5nIHdpbmRvdyBpZiBwb3NzaWJsZS5cbiAgI1xuICAjIG9wdGlvbnMgLVxuICAjICAgOnBhdGhUb09wZW4gLSBUaGUgZmlsZSBwYXRoIHRvIG9wZW5cbiAgIyAgIDpwaWRUb0tpbGxXaGVuQ2xvc2VkIC0gVGhlIGludGVnZXIgb2YgdGhlIHBpZCB0byBraWxsXG4gICMgICA6bmV3V2luZG93IC0gQm9vbGVhbiBvZiB3aGV0aGVyIHRoaXMgc2hvdWxkIGJlIG9wZW5lZCBpbiBhIG5ldyB3aW5kb3cuXG4gICMgICA6ZGV2TW9kZSAtIEJvb2xlYW4gdG8gY29udHJvbCB0aGUgb3BlbmVkIHdpbmRvdydzIGRldiBtb2RlLlxuICAjICAgOnNhZmVNb2RlIC0gQm9vbGVhbiB0byBjb250cm9sIHRoZSBvcGVuZWQgd2luZG93J3Mgc2FmZSBtb2RlLlxuICAjICAgOnByb2ZpbGVTdGFydHVwIC0gQm9vbGVhbiB0byBjb250cm9sIGNyZWF0aW5nIGEgcHJvZmlsZSBvZiB0aGUgc3RhcnR1cCB0aW1lLlxuICAjICAgOndpbmRvdyAtIHtBdG9tV2luZG93fSB0byBvcGVuIGZpbGUgcGF0aHMgaW4uXG4gICMgICA6YWRkVG9MYXN0V2luZG93IC0gQm9vbGVhbiBvZiB3aGV0aGVyIHRoaXMgc2hvdWxkIGJlIG9wZW5lZCBpbiBsYXN0IGZvY3VzZWQgd2luZG93LlxuICBvcGVuUGF0aDogKHtpbml0aWFsUGF0aHMsIHBhdGhUb09wZW4sIHBpZFRvS2lsbFdoZW5DbG9zZWQsIG5ld1dpbmRvdywgZGV2TW9kZSwgc2FmZU1vZGUsIHByb2ZpbGVTdGFydHVwLCB3aW5kb3csIGNsZWFyV2luZG93U3RhdGUsIGFkZFRvTGFzdFdpbmRvdywgZW52fSA9IHt9KSAtPlxuICAgIEBvcGVuUGF0aHMoe2luaXRpYWxQYXRocywgcGF0aHNUb09wZW46IFtwYXRoVG9PcGVuXSwgcGlkVG9LaWxsV2hlbkNsb3NlZCwgbmV3V2luZG93LCBkZXZNb2RlLCBzYWZlTW9kZSwgcHJvZmlsZVN0YXJ0dXAsIHdpbmRvdywgY2xlYXJXaW5kb3dTdGF0ZSwgYWRkVG9MYXN0V2luZG93LCBlbnZ9KVxuXG4gICMgUHVibGljOiBPcGVucyBtdWx0aXBsZSBwYXRocywgaW4gZXhpc3Rpbmcgd2luZG93cyBpZiBwb3NzaWJsZS5cbiAgI1xuICAjIG9wdGlvbnMgLVxuICAjICAgOnBhdGhzVG9PcGVuIC0gVGhlIGFycmF5IG9mIGZpbGUgcGF0aHMgdG8gb3BlblxuICAjICAgOnBpZFRvS2lsbFdoZW5DbG9zZWQgLSBUaGUgaW50ZWdlciBvZiB0aGUgcGlkIHRvIGtpbGxcbiAgIyAgIDpuZXdXaW5kb3cgLSBCb29sZWFuIG9mIHdoZXRoZXIgdGhpcyBzaG91bGQgYmUgb3BlbmVkIGluIGEgbmV3IHdpbmRvdy5cbiAgIyAgIDpkZXZNb2RlIC0gQm9vbGVhbiB0byBjb250cm9sIHRoZSBvcGVuZWQgd2luZG93J3MgZGV2IG1vZGUuXG4gICMgICA6c2FmZU1vZGUgLSBCb29sZWFuIHRvIGNvbnRyb2wgdGhlIG9wZW5lZCB3aW5kb3cncyBzYWZlIG1vZGUuXG4gICMgICA6d2luZG93RGltZW5zaW9ucyAtIE9iamVjdCB3aXRoIGhlaWdodCBhbmQgd2lkdGgga2V5cy5cbiAgIyAgIDp3aW5kb3cgLSB7QXRvbVdpbmRvd30gdG8gb3BlbiBmaWxlIHBhdGhzIGluLlxuICAjICAgOmFkZFRvTGFzdFdpbmRvdyAtIEJvb2xlYW4gb2Ygd2hldGhlciB0aGlzIHNob3VsZCBiZSBvcGVuZWQgaW4gbGFzdCBmb2N1c2VkIHdpbmRvdy5cbiAgb3BlblBhdGhzOiAoe2luaXRpYWxQYXRocywgcGF0aHNUb09wZW4sIGV4ZWN1dGVkRnJvbSwgcGlkVG9LaWxsV2hlbkNsb3NlZCwgbmV3V2luZG93LCBkZXZNb2RlLCBzYWZlTW9kZSwgd2luZG93RGltZW5zaW9ucywgcHJvZmlsZVN0YXJ0dXAsIHdpbmRvdywgY2xlYXJXaW5kb3dTdGF0ZSwgYWRkVG9MYXN0V2luZG93LCBlbnZ9PXt9KSAtPlxuICAgIGlmIG5vdCBwYXRoc1RvT3Blbj8gb3IgcGF0aHNUb09wZW4ubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVyblxuICAgIGVudiA9IHByb2Nlc3MuZW52IHVubGVzcyBlbnY/XG4gICAgZGV2TW9kZSA9IEJvb2xlYW4oZGV2TW9kZSlcbiAgICBzYWZlTW9kZSA9IEJvb2xlYW4oc2FmZU1vZGUpXG4gICAgY2xlYXJXaW5kb3dTdGF0ZSA9IEJvb2xlYW4oY2xlYXJXaW5kb3dTdGF0ZSlcbiAgICBsb2NhdGlvbnNUb09wZW4gPSAoQGxvY2F0aW9uRm9yUGF0aFRvT3BlbihwYXRoVG9PcGVuLCBleGVjdXRlZEZyb20sIGFkZFRvTGFzdFdpbmRvdykgZm9yIHBhdGhUb09wZW4gaW4gcGF0aHNUb09wZW4pXG4gICAgcGF0aHNUb09wZW4gPSAobG9jYXRpb25Ub09wZW4ucGF0aFRvT3BlbiBmb3IgbG9jYXRpb25Ub09wZW4gaW4gbG9jYXRpb25zVG9PcGVuKVxuXG4gICAgdW5sZXNzIHBpZFRvS2lsbFdoZW5DbG9zZWQgb3IgbmV3V2luZG93XG4gICAgICBleGlzdGluZ1dpbmRvdyA9IEB3aW5kb3dGb3JQYXRocyhwYXRoc1RvT3BlbiwgZGV2TW9kZSlcbiAgICAgIHN0YXRzID0gKGZzLnN0YXRTeW5jTm9FeGNlcHRpb24ocGF0aFRvT3BlbikgZm9yIHBhdGhUb09wZW4gaW4gcGF0aHNUb09wZW4pXG4gICAgICB1bmxlc3MgZXhpc3RpbmdXaW5kb3c/XG4gICAgICAgIGlmIGN1cnJlbnRXaW5kb3cgPSB3aW5kb3cgPyBAbGFzdEZvY3VzZWRXaW5kb3dcbiAgICAgICAgICBleGlzdGluZ1dpbmRvdyA9IGN1cnJlbnRXaW5kb3cgaWYgKFxuICAgICAgICAgICAgYWRkVG9MYXN0V2luZG93IG9yXG4gICAgICAgICAgICBjdXJyZW50V2luZG93LmRldk1vZGUgaXMgZGV2TW9kZSBhbmRcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgc3RhdHMuZXZlcnkoKHN0YXQpIC0+IHN0YXQuaXNGaWxlPygpKSBvclxuICAgICAgICAgICAgICBzdGF0cy5zb21lKChzdGF0KSAtPiBzdGF0LmlzRGlyZWN0b3J5PygpIGFuZCBub3QgY3VycmVudFdpbmRvdy5oYXNQcm9qZWN0UGF0aCgpKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcblxuICAgIGlmIGV4aXN0aW5nV2luZG93P1xuICAgICAgb3BlbmVkV2luZG93ID0gZXhpc3RpbmdXaW5kb3dcbiAgICAgIG9wZW5lZFdpbmRvdy5vcGVuTG9jYXRpb25zKGxvY2F0aW9uc1RvT3BlbilcbiAgICAgIGlmIG9wZW5lZFdpbmRvdy5pc01pbmltaXplZCgpXG4gICAgICAgIG9wZW5lZFdpbmRvdy5yZXN0b3JlKClcbiAgICAgIGVsc2VcbiAgICAgICAgb3BlbmVkV2luZG93LmZvY3VzKClcbiAgICAgIG9wZW5lZFdpbmRvdy5yZXBsYWNlRW52aXJvbm1lbnQoZW52KVxuICAgIGVsc2VcbiAgICAgIGlmIGRldk1vZGVcbiAgICAgICAgdHJ5XG4gICAgICAgICAgd2luZG93SW5pdGlhbGl6YXRpb25TY3JpcHQgPSByZXF1aXJlLnJlc29sdmUocGF0aC5qb2luKEBkZXZSZXNvdXJjZVBhdGgsICdzcmMnLCAnaW5pdGlhbGl6ZS1hcHBsaWNhdGlvbi13aW5kb3cnKSlcbiAgICAgICAgICByZXNvdXJjZVBhdGggPSBAZGV2UmVzb3VyY2VQYXRoXG5cbiAgICAgIHdpbmRvd0luaXRpYWxpemF0aW9uU2NyaXB0ID89IHJlcXVpcmUucmVzb2x2ZSgnLi4vaW5pdGlhbGl6ZS1hcHBsaWNhdGlvbi13aW5kb3cnKVxuICAgICAgcmVzb3VyY2VQYXRoID89IEByZXNvdXJjZVBhdGhcbiAgICAgIHdpbmRvd0RpbWVuc2lvbnMgPz0gQGdldERpbWVuc2lvbnNGb3JOZXdXaW5kb3coKVxuICAgICAgb3BlbmVkV2luZG93ID0gbmV3IEF0b21XaW5kb3codGhpcywgQGZpbGVSZWNvdmVyeVNlcnZpY2UsIHtpbml0aWFsUGF0aHMsIGxvY2F0aW9uc1RvT3Blbiwgd2luZG93SW5pdGlhbGl6YXRpb25TY3JpcHQsIHJlc291cmNlUGF0aCwgZGV2TW9kZSwgc2FmZU1vZGUsIHdpbmRvd0RpbWVuc2lvbnMsIHByb2ZpbGVTdGFydHVwLCBjbGVhcldpbmRvd1N0YXRlLCBlbnZ9KVxuICAgICAgb3BlbmVkV2luZG93LmZvY3VzKClcblxuICAgIGlmIHBpZFRvS2lsbFdoZW5DbG9zZWQ/XG4gICAgICBAcGlkc1RvT3BlbldpbmRvd3NbcGlkVG9LaWxsV2hlbkNsb3NlZF0gPSBvcGVuZWRXaW5kb3dcblxuICAgIG9wZW5lZFdpbmRvdy5icm93c2VyV2luZG93Lm9uY2UgJ2Nsb3NlZCcsID0+XG4gICAgICBAa2lsbFByb2Nlc3NGb3JXaW5kb3cob3BlbmVkV2luZG93KVxuXG4gICAgb3BlbmVkV2luZG93XG5cbiAgIyBLaWxsIGFsbCBwcm9jZXNzZXMgYXNzb2NpYXRlZCB3aXRoIG9wZW5lZCB3aW5kb3dzLlxuICBraWxsQWxsUHJvY2Vzc2VzOiAtPlxuICAgIEBraWxsUHJvY2VzcyhwaWQpIGZvciBwaWQgb2YgQHBpZHNUb09wZW5XaW5kb3dzXG4gICAgcmV0dXJuXG5cbiAgIyBLaWxsIHByb2Nlc3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBvcGVuZWQgd2luZG93LlxuICBraWxsUHJvY2Vzc0ZvcldpbmRvdzogKG9wZW5lZFdpbmRvdykgLT5cbiAgICBmb3IgcGlkLCB0cmFja2VkV2luZG93IG9mIEBwaWRzVG9PcGVuV2luZG93c1xuICAgICAgQGtpbGxQcm9jZXNzKHBpZCkgaWYgdHJhY2tlZFdpbmRvdyBpcyBvcGVuZWRXaW5kb3dcbiAgICByZXR1cm5cblxuICAjIEtpbGwgdGhlIHByb2Nlc3Mgd2l0aCB0aGUgZ2l2ZW4gcGlkLlxuICBraWxsUHJvY2VzczogKHBpZCkgLT5cbiAgICB0cnlcbiAgICAgIHBhcnNlZFBpZCA9IHBhcnNlSW50KHBpZClcbiAgICAgIHByb2Nlc3Mua2lsbChwYXJzZWRQaWQpIGlmIGlzRmluaXRlKHBhcnNlZFBpZClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgaWYgZXJyb3IuY29kZSBpc250ICdFU1JDSCdcbiAgICAgICAgY29uc29sZS5sb2coXCJLaWxsaW5nIHByb2Nlc3MgI3twaWR9IGZhaWxlZDogI3tlcnJvci5jb2RlID8gZXJyb3IubWVzc2FnZX1cIilcbiAgICBkZWxldGUgQHBpZHNUb09wZW5XaW5kb3dzW3BpZF1cblxuICBzYXZlU3RhdGU6IChhbGxvd0VtcHR5PWZhbHNlKSAtPlxuICAgIHJldHVybiBpZiBAcXVpdHRpbmdcbiAgICBzdGF0ZXMgPSBbXVxuICAgIGZvciB3aW5kb3cgaW4gQHdpbmRvd3NcbiAgICAgIHVubGVzcyB3aW5kb3cuaXNTcGVjXG4gICAgICAgIGlmIGxvYWRTZXR0aW5ncyA9IHdpbmRvdy5nZXRMb2FkU2V0dGluZ3MoKVxuICAgICAgICAgIHN0YXRlcy5wdXNoKGluaXRpYWxQYXRoczogbG9hZFNldHRpbmdzLmluaXRpYWxQYXRocylcbiAgICBpZiBzdGF0ZXMubGVuZ3RoID4gMCBvciBhbGxvd0VtcHR5XG4gICAgICBAc3RvcmFnZUZvbGRlci5zdG9yZVN5bmMoJ2FwcGxpY2F0aW9uLmpzb24nLCBzdGF0ZXMpXG5cbiAgbG9hZFN0YXRlOiAob3B0aW9ucykgLT5cbiAgICByZXN0b3JlUHJldmlvdXNTdGF0ZSA9IEBjb25maWcuZ2V0KCdjb3JlLnJlc3RvcmVQcmV2aW91c1dpbmRvd3NPblN0YXJ0JykgPyB0cnVlXG4gICAgaWYgcmVzdG9yZVByZXZpb3VzU3RhdGUgYW5kIChzdGF0ZXMgPSBAc3RvcmFnZUZvbGRlci5sb2FkKCdhcHBsaWNhdGlvbi5qc29uJykpPy5sZW5ndGggPiAwXG4gICAgICBmb3Igc3RhdGUgaW4gc3RhdGVzXG4gICAgICAgIEBvcGVuV2l0aE9wdGlvbnMoT2JqZWN0LmFzc2lnbihvcHRpb25zLCB7XG4gICAgICAgICAgaW5pdGlhbFBhdGhzOiBzdGF0ZS5pbml0aWFsUGF0aHNcbiAgICAgICAgICBwYXRoc1RvT3Blbjogc3RhdGUuaW5pdGlhbFBhdGhzLmZpbHRlciAoZGlyZWN0b3J5UGF0aCkgLT4gZnMuaXNEaXJlY3RvcnlTeW5jKGRpcmVjdG9yeVBhdGgpXG4gICAgICAgICAgdXJsc1RvT3BlbjogW11cbiAgICAgICAgICBkZXZNb2RlOiBAZGV2TW9kZVxuICAgICAgICAgIHNhZmVNb2RlOiBAc2FmZU1vZGVcbiAgICAgICAgfSkpXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gICMgT3BlbiBhbiBhdG9tOi8vIHVybC5cbiAgI1xuICAjIFRoZSBob3N0IG9mIHRoZSBVUkwgYmVpbmcgb3BlbmVkIGlzIGFzc3VtZWQgdG8gYmUgdGhlIHBhY2thZ2UgbmFtZVxuICAjIHJlc3BvbnNpYmxlIGZvciBvcGVuaW5nIHRoZSBVUkwuICBBIG5ldyB3aW5kb3cgd2lsbCBiZSBjcmVhdGVkIHdpdGhcbiAgIyB0aGF0IHBhY2thZ2UncyBgdXJsTWFpbmAgYXMgdGhlIGJvb3RzdHJhcCBzY3JpcHQuXG4gICNcbiAgIyBvcHRpb25zIC1cbiAgIyAgIDp1cmxUb09wZW4gLSBUaGUgYXRvbTovLyB1cmwgdG8gb3Blbi5cbiAgIyAgIDpkZXZNb2RlIC0gQm9vbGVhbiB0byBjb250cm9sIHRoZSBvcGVuZWQgd2luZG93J3MgZGV2IG1vZGUuXG4gICMgICA6c2FmZU1vZGUgLSBCb29sZWFuIHRvIGNvbnRyb2wgdGhlIG9wZW5lZCB3aW5kb3cncyBzYWZlIG1vZGUuXG4gIG9wZW5Vcmw6ICh7dXJsVG9PcGVuLCBkZXZNb2RlLCBzYWZlTW9kZSwgZW52fSkgLT5cbiAgICB1bmxlc3MgQHBhY2thZ2VzP1xuICAgICAgUGFja2FnZU1hbmFnZXIgPSByZXF1aXJlICcuLi9wYWNrYWdlLW1hbmFnZXInXG4gICAgICBAcGFja2FnZXMgPSBuZXcgUGFja2FnZU1hbmFnZXJcbiAgICAgICAgY29uZmlnRGlyUGF0aDogcHJvY2Vzcy5lbnYuQVRPTV9IT01FXG4gICAgICAgIGRldk1vZGU6IGRldk1vZGVcbiAgICAgICAgcmVzb3VyY2VQYXRoOiBAcmVzb3VyY2VQYXRoXG5cbiAgICBwYWNrYWdlTmFtZSA9IHVybC5wYXJzZSh1cmxUb09wZW4pLmhvc3RcbiAgICBwYWNrID0gXy5maW5kIEBwYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlTWV0YWRhdGEoKSwgKHtuYW1lfSkgLT4gbmFtZSBpcyBwYWNrYWdlTmFtZVxuICAgIGlmIHBhY2s/XG4gICAgICBpZiBwYWNrLnVybE1haW5cbiAgICAgICAgcGFja2FnZVBhdGggPSBAcGFja2FnZXMucmVzb2x2ZVBhY2thZ2VQYXRoKHBhY2thZ2VOYW1lKVxuICAgICAgICB3aW5kb3dJbml0aWFsaXphdGlvblNjcmlwdCA9IHBhdGgucmVzb2x2ZShwYWNrYWdlUGF0aCwgcGFjay51cmxNYWluKVxuICAgICAgICB3aW5kb3dEaW1lbnNpb25zID0gQGdldERpbWVuc2lvbnNGb3JOZXdXaW5kb3coKVxuICAgICAgICBuZXcgQXRvbVdpbmRvdyh0aGlzLCBAZmlsZVJlY292ZXJ5U2VydmljZSwge3dpbmRvd0luaXRpYWxpemF0aW9uU2NyaXB0LCBAcmVzb3VyY2VQYXRoLCBkZXZNb2RlLCBzYWZlTW9kZSwgdXJsVG9PcGVuLCB3aW5kb3dEaW1lbnNpb25zLCBlbnZ9KVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmxvZyBcIlBhY2thZ2UgJyN7cGFjay5uYW1lfScgZG9lcyBub3QgaGF2ZSBhIHVybCBtYWluOiAje3VybFRvT3Blbn1cIlxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUubG9nIFwiT3BlbmluZyB1bmtub3duIHVybDogI3t1cmxUb09wZW59XCJcblxuICAjIE9wZW5zIHVwIGEgbmV3IHtBdG9tV2luZG93fSB0byBydW4gc3BlY3Mgd2l0aGluLlxuICAjXG4gICMgb3B0aW9ucyAtXG4gICMgICA6aGVhZGxlc3MgLSBBIEJvb2xlYW4gdGhhdCwgaWYgdHJ1ZSwgd2lsbCBjbG9zZSB0aGUgd2luZG93IHVwb25cbiAgIyAgICAgICAgICAgICAgICAgICBjb21wbGV0aW9uLlxuICAjICAgOnJlc291cmNlUGF0aCAtIFRoZSBwYXRoIHRvIGluY2x1ZGUgc3BlY3MgZnJvbS5cbiAgIyAgIDpzcGVjUGF0aCAtIFRoZSBkaXJlY3RvcnkgdG8gbG9hZCBzcGVjcyBmcm9tLlxuICAjICAgOnNhZmVNb2RlIC0gQSBCb29sZWFuIHRoYXQsIGlmIHRydWUsIHdvbid0IHJ1biBzcGVjcyBmcm9tIH4vLmF0b20vcGFja2FnZXNcbiAgIyAgICAgICAgICAgICAgIGFuZCB+Ly5hdG9tL2Rldi9wYWNrYWdlcywgZGVmYXVsdHMgdG8gZmFsc2UuXG4gIHJ1blRlc3RzOiAoe2hlYWRsZXNzLCByZXNvdXJjZVBhdGgsIGV4ZWN1dGVkRnJvbSwgcGF0aHNUb09wZW4sIGxvZ0ZpbGUsIHNhZmVNb2RlLCB0aW1lb3V0LCBlbnZ9KSAtPlxuICAgIGlmIHJlc291cmNlUGF0aCBpc250IEByZXNvdXJjZVBhdGggYW5kIG5vdCBmcy5leGlzdHNTeW5jKHJlc291cmNlUGF0aClcbiAgICAgIHJlc291cmNlUGF0aCA9IEByZXNvdXJjZVBhdGhcblxuICAgIHRpbWVvdXRJblNlY29uZHMgPSBOdW1iZXIucGFyc2VGbG9hdCh0aW1lb3V0KVxuICAgIHVubGVzcyBOdW1iZXIuaXNOYU4odGltZW91dEluU2Vjb25kcylcbiAgICAgIHRpbWVvdXRIYW5kbGVyID0gLT5cbiAgICAgICAgY29uc29sZS5sb2cgXCJUaGUgdGVzdCBzdWl0ZSBoYXMgdGltZWQgb3V0IGJlY2F1c2UgaXQgaGFzIGJlZW4gcnVubmluZyBmb3IgbW9yZSB0aGFuICN7dGltZW91dEluU2Vjb25kc30gc2Vjb25kcy5cIlxuICAgICAgICBwcm9jZXNzLmV4aXQoMTI0KSAjIFVzZSB0aGUgc2FtZSBleGl0IGNvZGUgYXMgdGhlIFVOSVggdGltZW91dCB1dGlsLlxuICAgICAgc2V0VGltZW91dCh0aW1lb3V0SGFuZGxlciwgdGltZW91dEluU2Vjb25kcyAqIDEwMDApXG5cbiAgICB0cnlcbiAgICAgIHdpbmRvd0luaXRpYWxpemF0aW9uU2NyaXB0ID0gcmVxdWlyZS5yZXNvbHZlKHBhdGgucmVzb2x2ZShAZGV2UmVzb3VyY2VQYXRoLCAnc3JjJywgJ2luaXRpYWxpemUtdGVzdC13aW5kb3cnKSlcbiAgICBjYXRjaCBlcnJvclxuICAgICAgd2luZG93SW5pdGlhbGl6YXRpb25TY3JpcHQgPSByZXF1aXJlLnJlc29sdmUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3NyYycsICdpbml0aWFsaXplLXRlc3Qtd2luZG93JykpXG5cbiAgICB0ZXN0UGF0aHMgPSBbXVxuICAgIGlmIHBhdGhzVG9PcGVuP1xuICAgICAgZm9yIHBhdGhUb09wZW4gaW4gcGF0aHNUb09wZW5cbiAgICAgICAgdGVzdFBhdGhzLnB1c2gocGF0aC5yZXNvbHZlKGV4ZWN1dGVkRnJvbSwgZnMubm9ybWFsaXplKHBhdGhUb09wZW4pKSlcblxuICAgIGlmIHRlc3RQYXRocy5sZW5ndGggaXMgMFxuICAgICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUgJ0Vycm9yOiBTcGVjaWZ5IGF0IGxlYXN0IG9uZSB0ZXN0IHBhdGhcXG5cXG4nXG4gICAgICBwcm9jZXNzLmV4aXQoMSlcblxuICAgIGxlZ2FjeVRlc3RSdW5uZXJQYXRoID0gQHJlc29sdmVMZWdhY3lUZXN0UnVubmVyUGF0aCgpXG4gICAgdGVzdFJ1bm5lclBhdGggPSBAcmVzb2x2ZVRlc3RSdW5uZXJQYXRoKHRlc3RQYXRoc1swXSlcbiAgICBkZXZNb2RlID0gdHJ1ZVxuICAgIGlzU3BlYyA9IHRydWVcbiAgICBzYWZlTW9kZSA/PSBmYWxzZVxuICAgIG5ldyBBdG9tV2luZG93KHRoaXMsIEBmaWxlUmVjb3ZlcnlTZXJ2aWNlLCB7d2luZG93SW5pdGlhbGl6YXRpb25TY3JpcHQsIHJlc291cmNlUGF0aCwgaGVhZGxlc3MsIGlzU3BlYywgZGV2TW9kZSwgdGVzdFJ1bm5lclBhdGgsIGxlZ2FjeVRlc3RSdW5uZXJQYXRoLCB0ZXN0UGF0aHMsIGxvZ0ZpbGUsIHNhZmVNb2RlLCBlbnZ9KVxuXG4gIHJ1bkJlbmNobWFya3M6ICh7aGVhZGxlc3MsIHRlc3QsIHJlc291cmNlUGF0aCwgZXhlY3V0ZWRGcm9tLCBwYXRoc1RvT3BlbiwgZW52fSkgLT5cbiAgICBpZiByZXNvdXJjZVBhdGggaXNudCBAcmVzb3VyY2VQYXRoIGFuZCBub3QgZnMuZXhpc3RzU3luYyhyZXNvdXJjZVBhdGgpXG4gICAgICByZXNvdXJjZVBhdGggPSBAcmVzb3VyY2VQYXRoXG5cbiAgICB0cnlcbiAgICAgIHdpbmRvd0luaXRpYWxpemF0aW9uU2NyaXB0ID0gcmVxdWlyZS5yZXNvbHZlKHBhdGgucmVzb2x2ZShAZGV2UmVzb3VyY2VQYXRoLCAnc3JjJywgJ2luaXRpYWxpemUtYmVuY2htYXJrLXdpbmRvdycpKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICB3aW5kb3dJbml0aWFsaXphdGlvblNjcmlwdCA9IHJlcXVpcmUucmVzb2x2ZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnc3JjJywgJ2luaXRpYWxpemUtYmVuY2htYXJrLXdpbmRvdycpKVxuXG4gICAgYmVuY2htYXJrUGF0aHMgPSBbXVxuICAgIGlmIHBhdGhzVG9PcGVuP1xuICAgICAgZm9yIHBhdGhUb09wZW4gaW4gcGF0aHNUb09wZW5cbiAgICAgICAgYmVuY2htYXJrUGF0aHMucHVzaChwYXRoLnJlc29sdmUoZXhlY3V0ZWRGcm9tLCBmcy5ub3JtYWxpemUocGF0aFRvT3BlbikpKVxuXG4gICAgaWYgYmVuY2htYXJrUGF0aHMubGVuZ3RoIGlzIDBcbiAgICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlICdFcnJvcjogU3BlY2lmeSBhdCBsZWFzdCBvbmUgYmVuY2htYXJrIHBhdGguXFxuXFxuJ1xuICAgICAgcHJvY2Vzcy5leGl0KDEpXG5cbiAgICBkZXZNb2RlID0gdHJ1ZVxuICAgIGlzU3BlYyA9IHRydWVcbiAgICBzYWZlTW9kZSA9IGZhbHNlXG4gICAgbmV3IEF0b21XaW5kb3codGhpcywgQGZpbGVSZWNvdmVyeVNlcnZpY2UsIHt3aW5kb3dJbml0aWFsaXphdGlvblNjcmlwdCwgcmVzb3VyY2VQYXRoLCBoZWFkbGVzcywgdGVzdCwgaXNTcGVjLCBkZXZNb2RlLCBiZW5jaG1hcmtQYXRocywgc2FmZU1vZGUsIGVudn0pXG5cbiAgcmVzb2x2ZVRlc3RSdW5uZXJQYXRoOiAodGVzdFBhdGgpIC0+XG4gICAgRmluZFBhcmVudERpciA/PSByZXF1aXJlICdmaW5kLXBhcmVudC1kaXInXG5cbiAgICBpZiBwYWNrYWdlUm9vdCA9IEZpbmRQYXJlbnREaXIuc3luYyh0ZXN0UGF0aCwgJ3BhY2thZ2UuanNvbicpXG4gICAgICBwYWNrYWdlTWV0YWRhdGEgPSByZXF1aXJlKHBhdGguam9pbihwYWNrYWdlUm9vdCwgJ3BhY2thZ2UuanNvbicpKVxuICAgICAgaWYgcGFja2FnZU1ldGFkYXRhLmF0b21UZXN0UnVubmVyXG4gICAgICAgIFJlc29sdmUgPz0gcmVxdWlyZSgncmVzb2x2ZScpXG4gICAgICAgIGlmIHRlc3RSdW5uZXJQYXRoID0gUmVzb2x2ZS5zeW5jKHBhY2thZ2VNZXRhZGF0YS5hdG9tVGVzdFJ1bm5lciwgYmFzZWRpcjogcGFja2FnZVJvb3QsIGV4dGVuc2lvbnM6IE9iamVjdC5rZXlzKHJlcXVpcmUuZXh0ZW5zaW9ucykpXG4gICAgICAgICAgcmV0dXJuIHRlc3RSdW5uZXJQYXRoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwcm9jZXNzLnN0ZGVyci53cml0ZSBcIkVycm9yOiBDb3VsZCBub3QgcmVzb2x2ZSB0ZXN0IHJ1bm5lciBwYXRoICcje3BhY2thZ2VNZXRhZGF0YS5hdG9tVGVzdFJ1bm5lcn0nXCJcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSlcblxuICAgIEByZXNvbHZlTGVnYWN5VGVzdFJ1bm5lclBhdGgoKVxuXG4gIHJlc29sdmVMZWdhY3lUZXN0UnVubmVyUGF0aDogLT5cbiAgICB0cnlcbiAgICAgIHJlcXVpcmUucmVzb2x2ZShwYXRoLnJlc29sdmUoQGRldlJlc291cmNlUGF0aCwgJ3NwZWMnLCAnamFzbWluZS10ZXN0LXJ1bm5lcicpKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICByZXF1aXJlLnJlc29sdmUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3NwZWMnLCAnamFzbWluZS10ZXN0LXJ1bm5lcicpKVxuXG4gIGxvY2F0aW9uRm9yUGF0aFRvT3BlbjogKHBhdGhUb09wZW4sIGV4ZWN1dGVkRnJvbT0nJywgZm9yY2VBZGRUb1dpbmRvdykgLT5cbiAgICByZXR1cm4ge3BhdGhUb09wZW59IHVubGVzcyBwYXRoVG9PcGVuXG5cbiAgICBwYXRoVG9PcGVuID0gcGF0aFRvT3Blbi5yZXBsYWNlKC9bOlxcc10rJC8sICcnKVxuICAgIG1hdGNoID0gcGF0aFRvT3Blbi5tYXRjaChMb2NhdGlvblN1ZmZpeFJlZ0V4cClcblxuICAgIGlmIG1hdGNoP1xuICAgICAgcGF0aFRvT3BlbiA9IHBhdGhUb09wZW4uc2xpY2UoMCwgLW1hdGNoWzBdLmxlbmd0aClcbiAgICAgIGluaXRpYWxMaW5lID0gTWF0aC5tYXgoMCwgcGFyc2VJbnQobWF0Y2hbMV0uc2xpY2UoMSkpIC0gMSkgaWYgbWF0Y2hbMV1cbiAgICAgIGluaXRpYWxDb2x1bW4gPSBNYXRoLm1heCgwLCBwYXJzZUludChtYXRjaFsyXS5zbGljZSgxKSkgLSAxKSBpZiBtYXRjaFsyXVxuICAgIGVsc2VcbiAgICAgIGluaXRpYWxMaW5lID0gaW5pdGlhbENvbHVtbiA9IG51bGxcblxuICAgIHVubGVzcyB1cmwucGFyc2UocGF0aFRvT3BlbikucHJvdG9jb2w/XG4gICAgICBwYXRoVG9PcGVuID0gcGF0aC5yZXNvbHZlKGV4ZWN1dGVkRnJvbSwgZnMubm9ybWFsaXplKHBhdGhUb09wZW4pKVxuXG4gICAge3BhdGhUb09wZW4sIGluaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1uLCBmb3JjZUFkZFRvV2luZG93fVxuXG4gICMgT3BlbnMgYSBuYXRpdmUgZGlhbG9nIHRvIHByb21wdCB0aGUgdXNlciBmb3IgYSBwYXRoLlxuICAjXG4gICMgT25jZSBwYXRocyBhcmUgc2VsZWN0ZWQsIHRoZXkncmUgb3BlbmVkIGluIGEgbmV3IG9yIGV4aXN0aW5nIHtBdG9tV2luZG93fXMuXG4gICNcbiAgIyBvcHRpb25zIC1cbiAgIyAgIDp0eXBlIC0gQSBTdHJpbmcgd2hpY2ggc3BlY2lmaWVzIHRoZSB0eXBlIG9mIHRoZSBkaWFsb2csIGNvdWxkIGJlICdmaWxlJyxcbiAgIyAgICAgICAgICAgJ2ZvbGRlcicgb3IgJ2FsbCcuIFRoZSAnYWxsJyBpcyBvbmx5IGF2YWlsYWJsZSBvbiBtYWNPUy5cbiAgIyAgIDpkZXZNb2RlIC0gQSBCb29sZWFuIHdoaWNoIGNvbnRyb2xzIHdoZXRoZXIgYW55IG5ld2x5IG9wZW5lZCB3aW5kb3dzXG4gICMgICAgICAgICAgICAgIHNob3VsZCBiZSBpbiBkZXYgbW9kZSBvciBub3QuXG4gICMgICA6c2FmZU1vZGUgLSBBIEJvb2xlYW4gd2hpY2ggY29udHJvbHMgd2hldGhlciBhbnkgbmV3bHkgb3BlbmVkIHdpbmRvd3NcbiAgIyAgICAgICAgICAgICAgIHNob3VsZCBiZSBpbiBzYWZlIG1vZGUgb3Igbm90LlxuICAjICAgOndpbmRvdyAtIEFuIHtBdG9tV2luZG93fSB0byB1c2UgZm9yIG9wZW5pbmcgYSBzZWxlY3RlZCBmaWxlIHBhdGguXG4gICMgICA6cGF0aCAtIEFuIG9wdGlvbmFsIFN0cmluZyB3aGljaCBjb250cm9scyB0aGUgZGVmYXVsdCBwYXRoIHRvIHdoaWNoIHRoZVxuICAjICAgICAgICAgICBmaWxlIGRpYWxvZyBvcGVucy5cbiAgcHJvbXB0Rm9yUGF0aFRvT3BlbjogKHR5cGUsIHtkZXZNb2RlLCBzYWZlTW9kZSwgd2luZG93fSwgcGF0aD1udWxsKSAtPlxuICAgIEBwcm9tcHRGb3JQYXRoIHR5cGUsICgocGF0aHNUb09wZW4pID0+XG4gICAgICBAb3BlblBhdGhzKHtwYXRoc1RvT3BlbiwgZGV2TW9kZSwgc2FmZU1vZGUsIHdpbmRvd30pKSwgcGF0aFxuXG4gIHByb21wdEZvclBhdGg6ICh0eXBlLCBjYWxsYmFjaywgcGF0aCkgLT5cbiAgICBwcm9wZXJ0aWVzID1cbiAgICAgIHN3aXRjaCB0eXBlXG4gICAgICAgIHdoZW4gJ2ZpbGUnIHRoZW4gWydvcGVuRmlsZSddXG4gICAgICAgIHdoZW4gJ2ZvbGRlcicgdGhlbiBbJ29wZW5EaXJlY3RvcnknXVxuICAgICAgICB3aGVuICdhbGwnIHRoZW4gWydvcGVuRmlsZScsICdvcGVuRGlyZWN0b3J5J11cbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCIje3R5cGV9IGlzIGFuIGludmFsaWQgdHlwZSBmb3IgcHJvbXB0Rm9yUGF0aFwiKVxuXG4gICAgIyBTaG93IHRoZSBvcGVuIGRpYWxvZyBhcyBjaGlsZCB3aW5kb3cgb24gV2luZG93cyBhbmQgTGludXgsIGFuZCBhc1xuICAgICMgaW5kZXBlbmRlbnQgZGlhbG9nIG9uIG1hY09TLiBUaGlzIG1hdGNoZXMgbW9zdCBuYXRpdmUgYXBwcy5cbiAgICBwYXJlbnRXaW5kb3cgPVxuICAgICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuICAgICAgICBudWxsXG4gICAgICBlbHNlXG4gICAgICAgIEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG5cbiAgICBvcGVuT3B0aW9ucyA9XG4gICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLmNvbmNhdChbJ211bHRpU2VsZWN0aW9ucycsICdjcmVhdGVEaXJlY3RvcnknXSlcbiAgICAgIHRpdGxlOiBzd2l0Y2ggdHlwZVxuICAgICAgICB3aGVuICdmaWxlJyB0aGVuICdPcGVuIEZpbGUnXG4gICAgICAgIHdoZW4gJ2ZvbGRlcicgdGhlbiAnT3BlbiBGb2xkZXInXG4gICAgICAgIGVsc2UgJ09wZW4nXG5cbiAgICAjIEZpbGUgZGlhbG9nIGRlZmF1bHRzIHRvIHByb2plY3QgZGlyZWN0b3J5IG9mIGN1cnJlbnRseSBhY3RpdmUgZWRpdG9yXG4gICAgaWYgcGF0aD9cbiAgICAgIG9wZW5PcHRpb25zLmRlZmF1bHRQYXRoID0gcGF0aFxuXG4gICAgZGlhbG9nLnNob3dPcGVuRGlhbG9nKHBhcmVudFdpbmRvdywgb3Blbk9wdGlvbnMsIGNhbGxiYWNrKVxuXG4gIHByb21wdEZvclJlc3RhcnQ6IC0+XG4gICAgY2hvc2VuID0gZGlhbG9nLnNob3dNZXNzYWdlQm94IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnXG4gICAgICB0aXRsZTogJ1Jlc3RhcnQgcmVxdWlyZWQnXG4gICAgICBtZXNzYWdlOiBcIllvdSB3aWxsIG5lZWQgdG8gcmVzdGFydCBBdG9tIGZvciB0aGlzIGNoYW5nZSB0byB0YWtlIGVmZmVjdC5cIlxuICAgICAgYnV0dG9uczogWydSZXN0YXJ0IEF0b20nLCAnQ2FuY2VsJ11cbiAgICBpZiBjaG9zZW4gaXMgMFxuICAgICAgQHJlc3RhcnQoKVxuXG4gIHJlc3RhcnQ6IC0+XG4gICAgYXJncyA9IFtdXG4gICAgYXJncy5wdXNoKFwiLS1zYWZlXCIpIGlmIEBzYWZlTW9kZVxuICAgIGFyZ3MucHVzaChcIi0tcG9ydGFibGVcIikgaWYgQHNldFBvcnRhYmxlXG4gICAgYXJncy5wdXNoKFwiLS1sb2ctZmlsZT0je0Bsb2dGaWxlfVwiKSBpZiBAbG9nRmlsZT9cbiAgICBhcmdzLnB1c2goXCItLXNvY2tldC1wYXRoPSN7QHNvY2tldFBhdGh9XCIpIGlmIEBzb2NrZXRQYXRoP1xuICAgIGFyZ3MucHVzaChcIi0tdXNlci1kYXRhLWRpcj0je0B1c2VyRGF0YURpcn1cIikgaWYgQHVzZXJEYXRhRGlyP1xuICAgIGlmIEBkZXZNb2RlXG4gICAgICBhcmdzLnB1c2goJy0tZGV2JylcbiAgICAgIGFyZ3MucHVzaChcIi0tcmVzb3VyY2UtcGF0aD0je0ByZXNvdXJjZVBhdGh9XCIpXG4gICAgYXBwLnJlbGF1bmNoKHthcmdzfSlcbiAgICBhcHAucXVpdCgpXG4iXX0=
