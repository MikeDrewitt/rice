(function() {
  var AtomEnvironment, AutoUpdateManager, CommandInstaller, CommandRegistry, CompositeDisposable, Config, ContextMenuManager, DeserializerManager, Disposable, Emitter, GrammarRegistry, Gutter, HistoryManager, HistoryProject, KeymapManager, MenuManager, Model, NotificationManager, PackageManager, Pane, PaneAxis, PaneAxisElement, PaneContainer, PaneContainerElement, PaneElement, Panel, PanelContainer, PanelContainerElement, PanelElement, Project, ReopenProjectMenuManager, StateStore, StorageFolder, StyleManager, TextBuffer, TextEditor, TextEditorRegistry, ThemeManager, TitleBar, TooltipManager, ViewRegistry, WindowEventHandler, Workspace, WorkspaceElement, _, createGutterView, crypto, deprecate, fs, getWindowLoadSettings, ipcRenderer, mapSourcePosition, path, ref, ref1, registerDefaultCommands, updateProcessEnv,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  crypto = require('crypto');

  path = require('path');

  ipcRenderer = require('electron').ipcRenderer;

  _ = require('underscore-plus');

  deprecate = require('grim').deprecate;

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable, Emitter = ref.Emitter;

  fs = require('fs-plus');

  mapSourcePosition = require('source-map-support').mapSourcePosition;

  Model = require('./model');

  WindowEventHandler = require('./window-event-handler');

  StateStore = require('./state-store');

  StorageFolder = require('./storage-folder');

  getWindowLoadSettings = require('./window-load-settings-helpers').getWindowLoadSettings;

  registerDefaultCommands = require('./register-default-commands');

  updateProcessEnv = require('./update-process-env').updateProcessEnv;

  DeserializerManager = require('./deserializer-manager');

  ViewRegistry = require('./view-registry');

  NotificationManager = require('./notification-manager');

  Config = require('./config');

  KeymapManager = require('./keymap-extensions');

  TooltipManager = require('./tooltip-manager');

  CommandRegistry = require('./command-registry');

  GrammarRegistry = require('./grammar-registry');

  ref1 = require('./history-manager'), HistoryManager = ref1.HistoryManager, HistoryProject = ref1.HistoryProject;

  ReopenProjectMenuManager = require('./reopen-project-menu-manager');

  StyleManager = require('./style-manager');

  PackageManager = require('./package-manager');

  ThemeManager = require('./theme-manager');

  MenuManager = require('./menu-manager');

  ContextMenuManager = require('./context-menu-manager');

  CommandInstaller = require('./command-installer');

  Project = require('./project');

  TitleBar = require('./title-bar');

  Workspace = require('./workspace');

  PanelContainer = require('./panel-container');

  Panel = require('./panel');

  PaneContainer = require('./pane-container');

  PaneAxis = require('./pane-axis');

  Pane = require('./pane');

  Project = require('./project');

  TextEditor = require('./text-editor');

  TextBuffer = require('text-buffer');

  Gutter = require('./gutter');

  TextEditorRegistry = require('./text-editor-registry');

  AutoUpdateManager = require('./auto-update-manager');

  WorkspaceElement = require('./workspace-element');

  PanelContainerElement = require('./panel-container-element');

  PanelElement = require('./panel-element');

  PaneContainerElement = require('./pane-container-element');

  PaneAxisElement = require('./pane-axis-element');

  PaneElement = require('./pane-element');

  createGutterView = require('./gutter-component-helpers').createGutterView;

  module.exports = AtomEnvironment = (function(superClass) {
    extend(AtomEnvironment, superClass);

    AtomEnvironment.version = 1;

    AtomEnvironment.prototype.lastUncaughtError = null;


    /*
    Section: Properties
     */

    AtomEnvironment.prototype.commands = null;

    AtomEnvironment.prototype.config = null;

    AtomEnvironment.prototype.clipboard = null;

    AtomEnvironment.prototype.contextMenu = null;

    AtomEnvironment.prototype.menu = null;

    AtomEnvironment.prototype.keymaps = null;

    AtomEnvironment.prototype.tooltips = null;

    AtomEnvironment.prototype.notifications = null;

    AtomEnvironment.prototype.project = null;

    AtomEnvironment.prototype.grammars = null;

    AtomEnvironment.prototype.history = null;

    AtomEnvironment.prototype.packages = null;

    AtomEnvironment.prototype.themes = null;

    AtomEnvironment.prototype.styles = null;

    AtomEnvironment.prototype.deserializers = null;

    AtomEnvironment.prototype.views = null;

    AtomEnvironment.prototype.workspace = null;

    AtomEnvironment.prototype.textEditors = null;

    AtomEnvironment.prototype.autoUpdater = null;

    AtomEnvironment.prototype.saveStateDebounceInterval = 1000;


    /*
    Section: Construction and Destruction
     */

    function AtomEnvironment(params) {
      var checkPortableHomeWritable, clearWindowState, devMode, onlyLoadBaseStyleSheets, ref2, resourcePath, safeMode;
      if (params == null) {
        params = {};
      }
      this.blobStore = params.blobStore, this.applicationDelegate = params.applicationDelegate, this.window = params.window, this.document = params.document, this.clipboard = params.clipboard, this.configDirPath = params.configDirPath, this.enablePersistence = params.enablePersistence, onlyLoadBaseStyleSheets = params.onlyLoadBaseStyleSheets;
      this.unloaded = false;
      this.loadTime = null;
      ref2 = this.getLoadSettings(), devMode = ref2.devMode, safeMode = ref2.safeMode, resourcePath = ref2.resourcePath, clearWindowState = ref2.clearWindowState;
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.stateStore = new StateStore('AtomEnvironments', 1);
      if (clearWindowState) {
        this.getStorageFolder().clear();
        this.stateStore.clear();
      }
      this.deserializers = new DeserializerManager(this);
      this.deserializeTimings = {};
      this.views = new ViewRegistry(this);
      this.notifications = new NotificationManager;
      this.config = new Config({
        configDirPath: this.configDirPath,
        resourcePath: resourcePath,
        notificationManager: this.notifications,
        enablePersistence: this.enablePersistence
      });
      this.setConfigSchema();
      this.keymaps = new KeymapManager({
        configDirPath: this.configDirPath,
        resourcePath: resourcePath,
        notificationManager: this.notifications
      });
      this.tooltips = new TooltipManager({
        keymapManager: this.keymaps,
        viewRegistry: this.views
      });
      this.commands = new CommandRegistry;
      this.commands.attach(this.window);
      this.grammars = new GrammarRegistry({
        config: this.config
      });
      this.styles = new StyleManager({
        configDirPath: this.configDirPath
      });
      this.packages = new PackageManager({
        devMode: devMode,
        configDirPath: this.configDirPath,
        resourcePath: resourcePath,
        safeMode: safeMode,
        config: this.config,
        styleManager: this.styles,
        commandRegistry: this.commands,
        keymapManager: this.keymaps,
        notificationManager: this.notifications,
        grammarRegistry: this.grammars,
        deserializerManager: this.deserializers,
        viewRegistry: this.views
      });
      this.themes = new ThemeManager({
        packageManager: this.packages,
        configDirPath: this.configDirPath,
        resourcePath: resourcePath,
        safeMode: safeMode,
        config: this.config,
        styleManager: this.styles,
        notificationManager: this.notifications,
        viewRegistry: this.views
      });
      this.menu = new MenuManager({
        resourcePath: resourcePath,
        keymapManager: this.keymaps,
        packageManager: this.packages
      });
      this.contextMenu = new ContextMenuManager({
        resourcePath: resourcePath,
        devMode: devMode,
        keymapManager: this.keymaps
      });
      this.packages.setMenuManager(this.menu);
      this.packages.setContextMenuManager(this.contextMenu);
      this.packages.setThemeManager(this.themes);
      this.project = new Project({
        notificationManager: this.notifications,
        packageManager: this.packages,
        config: this.config,
        applicationDelegate: this.applicationDelegate
      });
      this.commandInstaller = new CommandInstaller(this.getVersion(), this.applicationDelegate);
      this.textEditors = new TextEditorRegistry({
        config: this.config,
        grammarRegistry: this.grammars,
        assert: this.assert.bind(this),
        packageManager: this.packages
      });
      this.workspace = new Workspace({
        config: this.config,
        project: this.project,
        packageManager: this.packages,
        grammarRegistry: this.grammars,
        deserializerManager: this.deserializers,
        notificationManager: this.notifications,
        applicationDelegate: this.applicationDelegate,
        viewRegistry: this.views,
        assert: this.assert.bind(this),
        textEditorRegistry: this.textEditors
      });
      this.themes.workspace = this.workspace;
      this.autoUpdater = new AutoUpdateManager({
        applicationDelegate: this.applicationDelegate
      });
      this.config.load();
      this.themes.loadBaseStylesheets();
      this.initialStyleElements = this.styles.getSnapshot();
      if (onlyLoadBaseStyleSheets) {
        this.themes.initialLoadComplete = true;
      }
      this.setBodyPlatformClass();
      this.stylesElement = this.styles.buildStylesElement();
      this.document.head.appendChild(this.stylesElement);
      this.disposables.add(this.applicationDelegate.disableZoom());
      this.keymaps.subscribeToFileReadFailure();
      this.keymaps.loadBundledKeymaps();
      this.registerDefaultCommands();
      this.registerDefaultOpeners();
      this.registerDefaultDeserializers();
      this.registerDefaultViewProviders();
      this.installUncaughtErrorHandler();
      this.attachSaveStateListeners();
      this.installWindowEventHandler();
      this.observeAutoHideMenuBar();
      this.history = new HistoryManager({
        project: this.project,
        commands: this.commands,
        localStorage: localStorage
      });
      this.history.onDidChangeProjects((function(_this) {
        return function(e) {
          if (!e.reloaded) {
            return _this.applicationDelegate.didChangeHistoryManager();
          }
        };
      })(this));
      this.disposables.add(this.applicationDelegate.onDidChangeHistoryManager((function(_this) {
        return function() {
          return _this.history.loadState();
        };
      })(this)));
      new ReopenProjectMenuManager({
        menu: this.menu,
        commands: this.commands,
        history: this.history,
        config: this.config,
        open: (function(_this) {
          return function(paths) {
            return _this.open({
              pathsToOpen: paths
            });
          };
        })(this)
      });
      checkPortableHomeWritable = (function(_this) {
        return function() {
          var responseChannel;
          responseChannel = "check-portable-home-writable-response";
          ipcRenderer.on(responseChannel, function(event, response) {
            ipcRenderer.removeAllListeners(responseChannel);
            if (!response.writable) {
              return this.notifications.addWarning("" + (response.message.replace(/([\\\.+\\-_#!])/g, '\\$1')));
            }
          });
          _this.disposables.add(new Disposable(function() {
            return ipcRenderer.removeAllListeners(responseChannel);
          }));
          return ipcRenderer.send('check-portable-home-writable', responseChannel);
        };
      })(this);
      checkPortableHomeWritable();
    }

    AtomEnvironment.prototype.attachSaveStateListeners = function() {
      var saveState;
      saveState = _.debounce(((function(_this) {
        return function() {
          return window.requestIdleCallback(function() {
            if (!_this.unloaded) {
              return _this.saveState({
                isUnloading: false
              });
            }
          });
        };
      })(this)), this.saveStateDebounceInterval);
      this.document.addEventListener('mousedown', saveState, true);
      this.document.addEventListener('keydown', saveState, true);
      return this.disposables.add(new Disposable((function(_this) {
        return function() {
          _this.document.removeEventListener('mousedown', saveState, true);
          return _this.document.removeEventListener('keydown', saveState, true);
        };
      })(this)));
    };

    AtomEnvironment.prototype.setConfigSchema = function() {
      return this.config.setSchema(null, {
        type: 'object',
        properties: _.clone(require('./config-schema'))
      });
    };

    AtomEnvironment.prototype.registerDefaultDeserializers = function() {
      this.deserializers.add(Workspace);
      this.deserializers.add(PaneContainer);
      this.deserializers.add(PaneAxis);
      this.deserializers.add(Pane);
      this.deserializers.add(Project);
      this.deserializers.add(TextEditor);
      return this.deserializers.add(TextBuffer);
    };

    AtomEnvironment.prototype.registerDefaultCommands = function() {
      return registerDefaultCommands({
        commandRegistry: this.commands,
        config: this.config,
        commandInstaller: this.commandInstaller,
        notificationManager: this.notifications,
        project: this.project,
        clipboard: this.clipboard
      });
    };

    AtomEnvironment.prototype.registerDefaultViewProviders = function() {
      this.views.addViewProvider(Workspace, function(model, env) {
        return new WorkspaceElement().initialize(model, env);
      });
      this.views.addViewProvider(PanelContainer, function(model, env) {
        return new PanelContainerElement().initialize(model, env);
      });
      this.views.addViewProvider(Panel, function(model, env) {
        return new PanelElement().initialize(model, env);
      });
      this.views.addViewProvider(PaneContainer, function(model, env) {
        return new PaneContainerElement().initialize(model, env);
      });
      this.views.addViewProvider(PaneAxis, function(model, env) {
        return new PaneAxisElement().initialize(model, env);
      });
      this.views.addViewProvider(Pane, function(model, env) {
        return new PaneElement().initialize(model, env);
      });
      return this.views.addViewProvider(Gutter, createGutterView);
    };

    AtomEnvironment.prototype.registerDefaultOpeners = function() {
      return this.workspace.addOpener((function(_this) {
        return function(uri) {
          switch (uri) {
            case 'atom://.atom/stylesheet':
              return _this.workspace.open(_this.styles.getUserStyleSheetPath());
            case 'atom://.atom/keymap':
              return _this.workspace.open(_this.keymaps.getUserKeymapPath());
            case 'atom://.atom/config':
              return _this.workspace.open(_this.config.getUserConfigPath());
            case 'atom://.atom/init-script':
              return _this.workspace.open(_this.getUserInitScriptPath());
          }
        };
      })(this));
    };

    AtomEnvironment.prototype.registerDefaultTargetForKeymaps = function() {
      return this.keymaps.defaultTarget = this.views.getView(this.workspace);
    };

    AtomEnvironment.prototype.observeAutoHideMenuBar = function() {
      this.disposables.add(this.config.onDidChange('core.autoHideMenuBar', (function(_this) {
        return function(arg1) {
          var newValue;
          newValue = arg1.newValue;
          return _this.setAutoHideMenuBar(newValue);
        };
      })(this)));
      if (this.config.get('core.autoHideMenuBar')) {
        return this.setAutoHideMenuBar(true);
      }
    };

    AtomEnvironment.prototype.reset = function() {
      this.deserializers.clear();
      this.registerDefaultDeserializers();
      this.config.clear();
      this.setConfigSchema();
      this.keymaps.clear();
      this.keymaps.loadBundledKeymaps();
      this.commands.clear();
      this.registerDefaultCommands();
      this.styles.restoreSnapshot(this.initialStyleElements);
      this.menu.clear();
      this.clipboard.reset();
      this.notifications.clear();
      this.contextMenu.clear();
      this.packages.reset();
      this.workspace.reset(this.packages);
      this.registerDefaultOpeners();
      this.project.reset(this.packages);
      this.workspace.subscribeToEvents();
      this.grammars.clear();
      this.textEditors.clear();
      this.views.clear();
      return this.registerDefaultViewProviders();
    };

    AtomEnvironment.prototype.destroy = function() {
      var ref2, ref3;
      if (!this.project) {
        return;
      }
      this.disposables.dispose();
      if ((ref2 = this.workspace) != null) {
        ref2.destroy();
      }
      this.workspace = null;
      this.themes.workspace = null;
      if ((ref3 = this.project) != null) {
        ref3.destroy();
      }
      this.project = null;
      this.commands.clear();
      this.stylesElement.remove();
      this.config.unobserveUserConfig();
      this.autoUpdater.destroy();
      return this.uninstallWindowEventHandler();
    };


    /*
    Section: Event Subscription
     */

    AtomEnvironment.prototype.onDidBeep = function(callback) {
      return this.emitter.on('did-beep', callback);
    };

    AtomEnvironment.prototype.onWillThrowError = function(callback) {
      return this.emitter.on('will-throw-error', callback);
    };

    AtomEnvironment.prototype.onDidThrowError = function(callback) {
      return this.emitter.on('did-throw-error', callback);
    };

    AtomEnvironment.prototype.onDidFailAssertion = function(callback) {
      return this.emitter.on('did-fail-assertion', callback);
    };


    /*
    Section: Atom Details
     */

    AtomEnvironment.prototype.inDevMode = function() {
      return this.devMode != null ? this.devMode : this.devMode = this.getLoadSettings().devMode;
    };

    AtomEnvironment.prototype.inSafeMode = function() {
      return this.safeMode != null ? this.safeMode : this.safeMode = this.getLoadSettings().safeMode;
    };

    AtomEnvironment.prototype.inSpecMode = function() {
      return this.specMode != null ? this.specMode : this.specMode = this.getLoadSettings().isSpec;
    };

    AtomEnvironment.prototype.isFirstLoad = function() {
      return this.firstLoad != null ? this.firstLoad : this.firstLoad = this.getLoadSettings().firstLoad;
    };

    AtomEnvironment.prototype.getVersion = function() {
      return this.appVersion != null ? this.appVersion : this.appVersion = this.getLoadSettings().appVersion;
    };

    AtomEnvironment.prototype.getReleaseChannel = function() {
      var version;
      version = this.getVersion();
      if (version.indexOf('beta') > -1) {
        return 'beta';
      } else if (version.indexOf('dev') > -1) {
        return 'dev';
      } else {
        return 'stable';
      }
    };

    AtomEnvironment.prototype.isReleasedVersion = function() {
      return !/\w{7}/.test(this.getVersion());
    };

    AtomEnvironment.prototype.getWindowLoadTime = function() {
      return this.loadTime;
    };

    AtomEnvironment.prototype.getLoadSettings = function() {
      return getWindowLoadSettings();
    };


    /*
    Section: Managing The Atom Window
     */

    AtomEnvironment.prototype.open = function(params) {
      return this.applicationDelegate.open(params);
    };

    AtomEnvironment.prototype.pickFolder = function(callback) {
      return this.applicationDelegate.pickFolder(callback);
    };

    AtomEnvironment.prototype.close = function() {
      return this.applicationDelegate.closeWindow();
    };

    AtomEnvironment.prototype.getSize = function() {
      return this.applicationDelegate.getWindowSize();
    };

    AtomEnvironment.prototype.setSize = function(width, height) {
      return this.applicationDelegate.setWindowSize(width, height);
    };

    AtomEnvironment.prototype.getPosition = function() {
      return this.applicationDelegate.getWindowPosition();
    };

    AtomEnvironment.prototype.setPosition = function(x, y) {
      return this.applicationDelegate.setWindowPosition(x, y);
    };

    AtomEnvironment.prototype.getCurrentWindow = function() {
      return this.applicationDelegate.getCurrentWindow();
    };

    AtomEnvironment.prototype.center = function() {
      return this.applicationDelegate.centerWindow();
    };

    AtomEnvironment.prototype.focus = function() {
      this.applicationDelegate.focusWindow();
      return this.window.focus();
    };

    AtomEnvironment.prototype.show = function() {
      return this.applicationDelegate.showWindow();
    };

    AtomEnvironment.prototype.hide = function() {
      return this.applicationDelegate.hideWindow();
    };

    AtomEnvironment.prototype.reload = function() {
      return this.applicationDelegate.reloadWindow();
    };

    AtomEnvironment.prototype.restartApplication = function() {
      return this.applicationDelegate.restartApplication();
    };

    AtomEnvironment.prototype.isMaximized = function() {
      return this.applicationDelegate.isWindowMaximized();
    };

    AtomEnvironment.prototype.maximize = function() {
      return this.applicationDelegate.maximizeWindow();
    };

    AtomEnvironment.prototype.isFullScreen = function() {
      return this.applicationDelegate.isWindowFullScreen();
    };

    AtomEnvironment.prototype.setFullScreen = function(fullScreen) {
      if (fullScreen == null) {
        fullScreen = false;
      }
      return this.applicationDelegate.setWindowFullScreen(fullScreen);
    };

    AtomEnvironment.prototype.toggleFullScreen = function() {
      return this.setFullScreen(!this.isFullScreen());
    };

    AtomEnvironment.prototype.displayWindow = function() {
      return this.restoreWindowDimensions().then((function(_this) {
        return function() {
          var ref2, ref3, steps;
          steps = [_this.restoreWindowBackground(), _this.show(), _this.focus()];
          if ((ref2 = _this.windowDimensions) != null ? ref2.fullScreen : void 0) {
            steps.push(_this.setFullScreen(true));
          }
          if (((ref3 = _this.windowDimensions) != null ? ref3.maximized : void 0) && process.platform !== 'darwin') {
            steps.push(_this.maximize());
          }
          return Promise.all(steps);
        };
      })(this));
    };

    AtomEnvironment.prototype.getWindowDimensions = function() {
      var browserWindow, height, maximized, ref2, ref3, width, x, y;
      browserWindow = this.getCurrentWindow();
      ref2 = browserWindow.getPosition(), x = ref2[0], y = ref2[1];
      ref3 = browserWindow.getSize(), width = ref3[0], height = ref3[1];
      maximized = browserWindow.isMaximized();
      return {
        x: x,
        y: y,
        width: width,
        height: height,
        maximized: maximized
      };
    };

    AtomEnvironment.prototype.setWindowDimensions = function(arg1) {
      var height, steps, width, x, y;
      x = arg1.x, y = arg1.y, width = arg1.width, height = arg1.height;
      steps = [];
      if ((width != null) && (height != null)) {
        steps.push(this.setSize(width, height));
      }
      if ((x != null) && (y != null)) {
        steps.push(this.setPosition(x, y));
      } else {
        steps.push(this.center());
      }
      return Promise.all(steps);
    };

    AtomEnvironment.prototype.isValidDimensions = function(arg1) {
      var height, ref2, width, x, y;
      ref2 = arg1 != null ? arg1 : {}, x = ref2.x, y = ref2.y, width = ref2.width, height = ref2.height;
      return width > 0 && height > 0 && x + width > 0 && y + height > 0;
    };

    AtomEnvironment.prototype.storeWindowDimensions = function() {
      this.windowDimensions = this.getWindowDimensions();
      if (this.isValidDimensions(this.windowDimensions)) {
        return localStorage.setItem("defaultWindowDimensions", JSON.stringify(this.windowDimensions));
      }
    };

    AtomEnvironment.prototype.getDefaultWindowDimensions = function() {
      var dimensions, error, height, ref2, width, windowDimensions;
      windowDimensions = this.getLoadSettings().windowDimensions;
      if (windowDimensions != null) {
        return windowDimensions;
      }
      dimensions = null;
      try {
        dimensions = JSON.parse(localStorage.getItem("defaultWindowDimensions"));
      } catch (error1) {
        error = error1;
        console.warn("Error parsing default window dimensions", error);
        localStorage.removeItem("defaultWindowDimensions");
      }
      if (this.isValidDimensions(dimensions)) {
        return dimensions;
      } else {
        ref2 = this.applicationDelegate.getPrimaryDisplayWorkAreaSize(), width = ref2.width, height = ref2.height;
        return {
          x: 0,
          y: 0,
          width: Math.min(1024, width),
          height: height
        };
      }
    };

    AtomEnvironment.prototype.restoreWindowDimensions = function() {
      if (!((this.windowDimensions != null) && this.isValidDimensions(this.windowDimensions))) {
        this.windowDimensions = this.getDefaultWindowDimensions();
      }
      return this.setWindowDimensions(this.windowDimensions).then((function(_this) {
        return function() {
          return _this.windowDimensions;
        };
      })(this));
    };

    AtomEnvironment.prototype.restoreWindowBackground = function() {
      var backgroundColor;
      if (backgroundColor = window.localStorage.getItem('atom:window-background-color')) {
        this.backgroundStylesheet = document.createElement('style');
        this.backgroundStylesheet.type = 'text/css';
        this.backgroundStylesheet.innerText = 'html, body { background: ' + backgroundColor + ' !important; }';
        return document.head.appendChild(this.backgroundStylesheet);
      }
    };

    AtomEnvironment.prototype.storeWindowBackground = function() {
      var backgroundColor, workspaceElement;
      if (this.inSpecMode()) {
        return;
      }
      workspaceElement = this.views.getView(this.workspace);
      backgroundColor = this.window.getComputedStyle(workspaceElement)['background-color'];
      return this.window.localStorage.setItem('atom:window-background-color', backgroundColor);
    };

    AtomEnvironment.prototype.startEditorWindow = function() {
      var loadStatePromise, updateProcessEnvPromise;
      this.unloaded = false;
      updateProcessEnvPromise = updateProcessEnv(this.getLoadSettings().env);
      updateProcessEnvPromise.then((function(_this) {
        return function() {
          return _this.packages.triggerActivationHook('core:loaded-shell-environment');
        };
      })(this));
      loadStatePromise = this.loadState().then((function(_this) {
        return function(state) {
          _this.windowDimensions = state != null ? state.windowDimensions : void 0;
          return _this.displayWindow().then(function() {
            var ref2, startTime;
            _this.commandInstaller.installAtomCommand(false, function(error) {
              if (error != null) {
                return console.warn(error.message);
              }
            });
            _this.commandInstaller.installApmCommand(false, function(error) {
              if (error != null) {
                return console.warn(error.message);
              }
            });
            _this.disposables.add(_this.applicationDelegate.onDidOpenLocations(_this.openLocations.bind(_this)));
            _this.disposables.add(_this.applicationDelegate.onApplicationMenuCommand(_this.dispatchApplicationMenuCommand.bind(_this)));
            _this.disposables.add(_this.applicationDelegate.onContextMenuCommand(_this.dispatchContextMenuCommand.bind(_this)));
            _this.disposables.add(_this.applicationDelegate.onSaveWindowStateRequest(function() {
              var callback;
              callback = function() {
                return _this.applicationDelegate.didSaveWindowState();
              };
              return _this.saveState({
                isUnloading: true
              })["catch"](callback).then(callback);
            }));
            _this.listenForUpdates();
            _this.registerDefaultTargetForKeymaps();
            _this.packages.loadPackages();
            startTime = Date.now();
            if (state != null) {
              _this.deserialize(state);
            }
            _this.deserializeTimings.atom = Date.now() - startTime;
            if (process.platform === 'darwin' && _this.config.get('core.useCustomTitleBar')) {
              _this.workspace.addHeaderPanel({
                item: new TitleBar({
                  workspace: _this.workspace,
                  themes: _this.themes,
                  applicationDelegate: _this.applicationDelegate
                })
              });
            }
            _this.document.body.appendChild(_this.views.getView(_this.workspace));
            if ((ref2 = _this.backgroundStylesheet) != null) {
              ref2.remove();
            }
            _this.watchProjectPaths();
            _this.packages.activate();
            _this.keymaps.loadUserKeymap();
            if (!_this.getLoadSettings().safeMode) {
              _this.requireUserInitScript();
            }
            _this.menu.update();
            return _this.openInitialEmptyEditorIfNecessary();
          });
        };
      })(this));
      return Promise.all([loadStatePromise, updateProcessEnvPromise]);
    };

    AtomEnvironment.prototype.serialize = function(options) {
      return {
        version: this.constructor.version,
        project: this.project.serialize(options),
        workspace: this.workspace.serialize(),
        packageStates: this.packages.serialize(),
        grammars: {
          grammarOverridesByPath: this.grammars.grammarOverridesByPath
        },
        fullScreen: this.isFullScreen(),
        windowDimensions: this.windowDimensions,
        textEditors: this.textEditors.serialize()
      };
    };

    AtomEnvironment.prototype.unloadEditorWindow = function() {
      if (!this.project) {
        return;
      }
      this.storeWindowBackground();
      this.packages.deactivatePackages();
      this.saveBlobStoreSync();
      return this.unloaded = true;
    };

    AtomEnvironment.prototype.openInitialEmptyEditorIfNecessary = function() {
      var ref2;
      if (!this.config.get('core.openEmptyEditorOnStart')) {
        return;
      }
      if (((ref2 = this.getLoadSettings().initialPaths) != null ? ref2.length : void 0) === 0 && this.workspace.getPaneItems().length === 0) {
        return this.workspace.open(null);
      }
    };

    AtomEnvironment.prototype.installUncaughtErrorHandler = function() {
      this.previousWindowErrorHandler = this.window.onerror;
      return this.window.onerror = (function(_this) {
        return function() {
          var column, eventObject, line, message, openDevTools, originalError, ref2, ref3, url;
          _this.lastUncaughtError = Array.prototype.slice.call(arguments);
          ref2 = _this.lastUncaughtError, message = ref2[0], url = ref2[1], line = ref2[2], column = ref2[3], originalError = ref2[4];
          ref3 = mapSourcePosition({
            source: url,
            line: line,
            column: column
          }), line = ref3.line, column = ref3.column;
          eventObject = {
            message: message,
            url: url,
            line: line,
            column: column,
            originalError: originalError
          };
          openDevTools = true;
          eventObject.preventDefault = function() {
            return openDevTools = false;
          };
          _this.emitter.emit('will-throw-error', eventObject);
          if (openDevTools) {
            _this.openDevTools().then(function() {
              return _this.executeJavaScriptInDevTools('DevToolsAPI.showPanel("console")');
            });
          }
          return _this.emitter.emit('did-throw-error', {
            message: message,
            url: url,
            line: line,
            column: column,
            originalError: originalError
          });
        };
      })(this);
    };

    AtomEnvironment.prototype.uninstallUncaughtErrorHandler = function() {
      return this.window.onerror = this.previousWindowErrorHandler;
    };

    AtomEnvironment.prototype.installWindowEventHandler = function() {
      return this.windowEventHandler = new WindowEventHandler({
        atomEnvironment: this,
        applicationDelegate: this.applicationDelegate,
        window: this.window,
        document: this.document
      });
    };

    AtomEnvironment.prototype.uninstallWindowEventHandler = function() {
      var ref2;
      return (ref2 = this.windowEventHandler) != null ? ref2.unsubscribe() : void 0;
    };


    /*
    Section: Messaging the User
     */

    AtomEnvironment.prototype.beep = function() {
      if (this.config.get('core.audioBeep')) {
        this.applicationDelegate.playBeepSound();
      }
      return this.emitter.emit('did-beep');
    };

    AtomEnvironment.prototype.confirm = function(params) {
      if (params == null) {
        params = {};
      }
      return this.applicationDelegate.confirm(params);
    };


    /*
    Section: Managing the Dev Tools
     */

    AtomEnvironment.prototype.openDevTools = function() {
      return this.applicationDelegate.openWindowDevTools();
    };

    AtomEnvironment.prototype.toggleDevTools = function() {
      return this.applicationDelegate.toggleWindowDevTools();
    };

    AtomEnvironment.prototype.executeJavaScriptInDevTools = function(code) {
      return this.applicationDelegate.executeJavaScriptInWindowDevTools(code);
    };


    /*
    Section: Private
     */

    AtomEnvironment.prototype.assert = function(condition, message, callback) {
      var error;
      if (condition) {
        return true;
      }
      error = new Error("Assertion failed: " + message);
      Error.captureStackTrace(error, this.assert);
      if (typeof callback === "function") {
        callback(error);
      }
      this.emitter.emit('did-fail-assertion', error);
      return false;
    };

    AtomEnvironment.prototype.loadThemes = function() {
      return this.themes.load();
    };

    AtomEnvironment.prototype.watchProjectPaths = function() {
      return this.disposables.add(this.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.applicationDelegate.setRepresentedDirectoryPaths(_this.project.getPaths());
        };
      })(this)));
    };

    AtomEnvironment.prototype.setDocumentEdited = function(edited) {
      var base;
      return typeof (base = this.applicationDelegate).setWindowDocumentEdited === "function" ? base.setWindowDocumentEdited(edited) : void 0;
    };

    AtomEnvironment.prototype.setRepresentedFilename = function(filename) {
      var base;
      return typeof (base = this.applicationDelegate).setWindowRepresentedFilename === "function" ? base.setWindowRepresentedFilename(filename) : void 0;
    };

    AtomEnvironment.prototype.addProjectFolder = function() {
      return this.pickFolder((function(_this) {
        return function(selectedPaths) {
          var i, len, results, selectedPath;
          if (selectedPaths == null) {
            selectedPaths = [];
          }
          results = [];
          for (i = 0, len = selectedPaths.length; i < len; i++) {
            selectedPath = selectedPaths[i];
            results.push(_this.project.addPath(selectedPath));
          }
          return results;
        };
      })(this));
    };

    AtomEnvironment.prototype.showSaveDialog = function(callback) {
      return callback(this.showSaveDialogSync());
    };

    AtomEnvironment.prototype.showSaveDialogSync = function(options) {
      if (options == null) {
        options = {};
      }
      return this.applicationDelegate.showSaveDialog(options);
    };

    AtomEnvironment.prototype.saveBlobStoreSync = function() {
      if (!this.enablePersistence) {
        return;
      }
      return this.blobStore.save();
    };

    AtomEnvironment.prototype.saveState = function(options) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var ref2, savePromise, state, storageKey;
          if (_this.enablePersistence && _this.project) {
            state = _this.serialize(options);
            savePromise = (storageKey = _this.getStateKey((ref2 = _this.project) != null ? ref2.getPaths() : void 0)) ? _this.stateStore.save(storageKey, state) : _this.applicationDelegate.setTemporaryWindowState(state);
            return savePromise["catch"](reject).then(resolve);
          } else {
            return resolve();
          }
        };
      })(this));
    };

    AtomEnvironment.prototype.loadState = function() {
      var stateKey;
      if (this.enablePersistence) {
        if (stateKey = this.getStateKey(this.getLoadSettings().initialPaths)) {
          return this.stateStore.load(stateKey).then((function(_this) {
            return function(state) {
              if (state) {
                return state;
              } else {
                return _this.getStorageFolder().load(stateKey);
              }
            };
          })(this));
        } else {
          return this.applicationDelegate.getTemporaryWindowState();
        }
      } else {
        return Promise.resolve(null);
      }
    };

    AtomEnvironment.prototype.deserialize = function(state) {
      var grammarOverridesByPath, ref2, ref3, startTime;
      if (grammarOverridesByPath = (ref2 = state.grammars) != null ? ref2.grammarOverridesByPath : void 0) {
        this.grammars.grammarOverridesByPath = grammarOverridesByPath;
      }
      this.setFullScreen(state.fullScreen);
      this.packages.packageStates = (ref3 = state.packageStates) != null ? ref3 : {};
      startTime = Date.now();
      if (state.project != null) {
        this.project.deserialize(state.project, this.deserializers);
      }
      this.deserializeTimings.project = Date.now() - startTime;
      if (state.textEditors) {
        this.textEditors.deserialize(state.textEditors);
      }
      startTime = Date.now();
      if (state.workspace != null) {
        this.workspace.deserialize(state.workspace, this.deserializers);
      }
      return this.deserializeTimings.workspace = Date.now() - startTime;
    };

    AtomEnvironment.prototype.getStateKey = function(paths) {
      var sha1;
      if ((paths != null ? paths.length : void 0) > 0) {
        sha1 = crypto.createHash('sha1').update(paths.slice().sort().join("\n")).digest('hex');
        return "editor-" + sha1;
      } else {
        return null;
      }
    };

    AtomEnvironment.prototype.getStorageFolder = function() {
      return this.storageFolder != null ? this.storageFolder : this.storageFolder = new StorageFolder(this.getConfigDirPath());
    };

    AtomEnvironment.prototype.getConfigDirPath = function() {
      return this.configDirPath != null ? this.configDirPath : this.configDirPath = process.env.ATOM_HOME;
    };

    AtomEnvironment.prototype.getUserInitScriptPath = function() {
      var initScriptPath;
      initScriptPath = fs.resolve(this.getConfigDirPath(), 'init', ['js', 'coffee']);
      return initScriptPath != null ? initScriptPath : path.join(this.getConfigDirPath(), 'init.coffee');
    };

    AtomEnvironment.prototype.requireUserInitScript = function() {
      var error, userInitScriptPath;
      if (userInitScriptPath = this.getUserInitScriptPath()) {
        try {
          if (fs.isFileSync(userInitScriptPath)) {
            return require(userInitScriptPath);
          }
        } catch (error1) {
          error = error1;
          return this.notifications.addError("Failed to load `" + userInitScriptPath + "`", {
            detail: error.message,
            dismissable: true
          });
        }
      }
    };

    AtomEnvironment.prototype.onUpdateAvailable = function(callback) {
      return this.emitter.on('update-available', callback);
    };

    AtomEnvironment.prototype.updateAvailable = function(details) {
      return this.emitter.emit('update-available', details);
    };

    AtomEnvironment.prototype.listenForUpdates = function() {
      return this.disposables.add(this.autoUpdater.onDidCompleteDownloadingUpdate(this.updateAvailable.bind(this)));
    };

    AtomEnvironment.prototype.setBodyPlatformClass = function() {
      return this.document.body.classList.add("platform-" + process.platform);
    };

    AtomEnvironment.prototype.setAutoHideMenuBar = function(autoHide) {
      this.applicationDelegate.setAutoHideWindowMenuBar(autoHide);
      return this.applicationDelegate.setWindowMenuBarVisibility(!autoHide);
    };

    AtomEnvironment.prototype.dispatchApplicationMenuCommand = function(command, arg) {
      var activeElement, workspaceElement;
      activeElement = this.document.activeElement;
      if (activeElement === this.document.body && (workspaceElement = this.views.getView(this.workspace))) {
        activeElement = workspaceElement;
      }
      return this.commands.dispatch(activeElement, command, arg);
    };

    AtomEnvironment.prototype.dispatchContextMenuCommand = function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return this.commands.dispatch(this.contextMenu.activeElement, command, args);
    };

    AtomEnvironment.prototype.openLocations = function(locations) {
      var forceAddToWindow, i, initialColumn, initialLine, len, needsProjectPaths, pathToOpen, ref2, ref3, ref4;
      needsProjectPaths = ((ref2 = this.project) != null ? ref2.getPaths().length : void 0) === 0;
      for (i = 0, len = locations.length; i < len; i++) {
        ref3 = locations[i], pathToOpen = ref3.pathToOpen, initialLine = ref3.initialLine, initialColumn = ref3.initialColumn, forceAddToWindow = ref3.forceAddToWindow;
        if ((pathToOpen != null) && (needsProjectPaths || forceAddToWindow)) {
          if (fs.existsSync(pathToOpen)) {
            this.project.addPath(pathToOpen);
          } else if (fs.existsSync(path.dirname(pathToOpen))) {
            this.project.addPath(path.dirname(pathToOpen));
          } else {
            this.project.addPath(pathToOpen);
          }
        }
        if (!fs.isDirectorySync(pathToOpen)) {
          if ((ref4 = this.workspace) != null) {
            ref4.open(pathToOpen, {
              initialLine: initialLine,
              initialColumn: initialColumn
            });
          }
        }
      }
    };

    return AtomEnvironment;

  })(Model);

  Promise.prototype.done = function(callback) {
    deprecate("Atom now uses ES6 Promises instead of Q. Call promise.then instead of promise.done");
    return this.then(callback);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9hdG9tLWVudmlyb25tZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOHlCQUFBO0lBQUE7Ozs7RUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBQ1QsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNOLGNBQWUsT0FBQSxDQUFRLFVBQVI7O0VBRWhCLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsWUFBYSxPQUFBLENBQVEsTUFBUjs7RUFDZCxNQUE2QyxPQUFBLENBQVEsV0FBUixDQUE3QyxFQUFDLDZDQUFELEVBQXNCLDJCQUF0QixFQUFrQzs7RUFDbEMsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLG9CQUFxQixPQUFBLENBQVEsb0JBQVI7O0VBQ3RCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVI7O0VBQ3JCLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFDZix3QkFBeUIsT0FBQSxDQUFRLGdDQUFSOztFQUMxQix1QkFBQSxHQUEwQixPQUFBLENBQVEsNkJBQVI7O0VBQ3pCLG1CQUFvQixPQUFBLENBQVEsc0JBQVI7O0VBRXJCLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSx3QkFBUjs7RUFDdEIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixtQkFBQSxHQUFzQixPQUFBLENBQVEsd0JBQVI7O0VBQ3RCLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7RUFDVCxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxxQkFBUjs7RUFDaEIsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLGVB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QUF4RDtJQUQwQjs7OEJBRzVCLGFBQUEsR0FBZSxTQUFDLFNBQUQ7QUFDYixVQUFBO01BQUEsaUJBQUEsd0NBQTRCLENBQUUsUUFBVixDQUFBLENBQW9CLENBQUMsZ0JBQXJCLEtBQStCO0FBRW5ELFdBQUEsMkNBQUE7NkJBQUssOEJBQVksZ0NBQWEsb0NBQWU7UUFDM0MsSUFBRyxvQkFBQSxJQUFnQixDQUFDLGlCQUFBLElBQXFCLGdCQUF0QixDQUFuQjtVQUNFLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxVQUFkLENBQUg7WUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBaUIsVUFBakIsRUFERjtXQUFBLE1BRUssSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLElBQUksQ0FBQyxPQUFMLENBQWEsVUFBYixDQUFkLENBQUg7WUFDSCxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBaUIsSUFBSSxDQUFDLE9BQUwsQ0FBYSxVQUFiLENBQWpCLEVBREc7V0FBQSxNQUFBO1lBR0gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLFVBQWpCLEVBSEc7V0FIUDs7UUFRQSxJQUFBLENBQU8sRUFBRSxDQUFDLGVBQUgsQ0FBbUIsVUFBbkIsQ0FBUDs7Z0JBQ1ksQ0FBRSxJQUFaLENBQWlCLFVBQWpCLEVBQTZCO2NBQUMsYUFBQSxXQUFEO2NBQWMsZUFBQSxhQUFkO2FBQTdCO1dBREY7O0FBVEY7SUFIYTs7OztLQWo1QmE7O0VBbTZCOUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFsQixHQUF5QixTQUFDLFFBQUQ7SUFDdkIsU0FBQSxDQUFVLG9GQUFWO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOO0VBRnVCO0FBLzlCekIiLCJzb3VyY2VzQ29udGVudCI6WyJjcnlwdG8gPSByZXF1aXJlICdjcnlwdG8nXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbntpcGNSZW5kZXJlcn0gPSByZXF1aXJlICdlbGVjdHJvbidcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntkZXByZWNhdGV9ID0gcmVxdWlyZSAnZ3JpbSdcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnttYXBTb3VyY2VQb3NpdGlvbn0gPSByZXF1aXJlICdzb3VyY2UtbWFwLXN1cHBvcnQnXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5XaW5kb3dFdmVudEhhbmRsZXIgPSByZXF1aXJlICcuL3dpbmRvdy1ldmVudC1oYW5kbGVyJ1xuU3RhdGVTdG9yZSA9IHJlcXVpcmUgJy4vc3RhdGUtc3RvcmUnXG5TdG9yYWdlRm9sZGVyID0gcmVxdWlyZSAnLi9zdG9yYWdlLWZvbGRlcidcbntnZXRXaW5kb3dMb2FkU2V0dGluZ3N9ID0gcmVxdWlyZSAnLi93aW5kb3ctbG9hZC1zZXR0aW5ncy1oZWxwZXJzJ1xucmVnaXN0ZXJEZWZhdWx0Q29tbWFuZHMgPSByZXF1aXJlICcuL3JlZ2lzdGVyLWRlZmF1bHQtY29tbWFuZHMnXG57dXBkYXRlUHJvY2Vzc0Vudn0gPSByZXF1aXJlICcuL3VwZGF0ZS1wcm9jZXNzLWVudidcblxuRGVzZXJpYWxpemVyTWFuYWdlciA9IHJlcXVpcmUgJy4vZGVzZXJpYWxpemVyLW1hbmFnZXInXG5WaWV3UmVnaXN0cnkgPSByZXF1aXJlICcuL3ZpZXctcmVnaXN0cnknXG5Ob3RpZmljYXRpb25NYW5hZ2VyID0gcmVxdWlyZSAnLi9ub3RpZmljYXRpb24tbWFuYWdlcidcbkNvbmZpZyA9IHJlcXVpcmUgJy4vY29uZmlnJ1xuS2V5bWFwTWFuYWdlciA9IHJlcXVpcmUgJy4va2V5bWFwLWV4dGVuc2lvbnMnXG5Ub29sdGlwTWFuYWdlciA9IHJlcXVpcmUgJy4vdG9vbHRpcC1tYW5hZ2VyJ1xuQ29tbWFuZFJlZ2lzdHJ5ID0gcmVxdWlyZSAnLi9jb21tYW5kLXJlZ2lzdHJ5J1xuR3JhbW1hclJlZ2lzdHJ5ID0gcmVxdWlyZSAnLi9ncmFtbWFyLXJlZ2lzdHJ5J1xue0hpc3RvcnlNYW5hZ2VyLCBIaXN0b3J5UHJvamVjdH0gPSByZXF1aXJlICcuL2hpc3RvcnktbWFuYWdlcidcblJlb3BlblByb2plY3RNZW51TWFuYWdlciA9IHJlcXVpcmUgJy4vcmVvcGVuLXByb2plY3QtbWVudS1tYW5hZ2VyJ1xuU3R5bGVNYW5hZ2VyID0gcmVxdWlyZSAnLi9zdHlsZS1tYW5hZ2VyJ1xuUGFja2FnZU1hbmFnZXIgPSByZXF1aXJlICcuL3BhY2thZ2UtbWFuYWdlcidcblRoZW1lTWFuYWdlciA9IHJlcXVpcmUgJy4vdGhlbWUtbWFuYWdlcidcbk1lbnVNYW5hZ2VyID0gcmVxdWlyZSAnLi9tZW51LW1hbmFnZXInXG5Db250ZXh0TWVudU1hbmFnZXIgPSByZXF1aXJlICcuL2NvbnRleHQtbWVudS1tYW5hZ2VyJ1xuQ29tbWFuZEluc3RhbGxlciA9IHJlcXVpcmUgJy4vY29tbWFuZC1pbnN0YWxsZXInXG5Qcm9qZWN0ID0gcmVxdWlyZSAnLi9wcm9qZWN0J1xuVGl0bGVCYXIgPSByZXF1aXJlICcuL3RpdGxlLWJhcidcbldvcmtzcGFjZSA9IHJlcXVpcmUgJy4vd29ya3NwYWNlJ1xuUGFuZWxDb250YWluZXIgPSByZXF1aXJlICcuL3BhbmVsLWNvbnRhaW5lcidcblBhbmVsID0gcmVxdWlyZSAnLi9wYW5lbCdcblBhbmVDb250YWluZXIgPSByZXF1aXJlICcuL3BhbmUtY29udGFpbmVyJ1xuUGFuZUF4aXMgPSByZXF1aXJlICcuL3BhbmUtYXhpcydcblBhbmUgPSByZXF1aXJlICcuL3BhbmUnXG5Qcm9qZWN0ID0gcmVxdWlyZSAnLi9wcm9qZWN0J1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dC1lZGl0b3InXG5UZXh0QnVmZmVyID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG5HdXR0ZXIgPSByZXF1aXJlICcuL2d1dHRlcidcblRleHRFZGl0b3JSZWdpc3RyeSA9IHJlcXVpcmUgJy4vdGV4dC1lZGl0b3ItcmVnaXN0cnknXG5BdXRvVXBkYXRlTWFuYWdlciA9IHJlcXVpcmUgJy4vYXV0by11cGRhdGUtbWFuYWdlcidcblxuV29ya3NwYWNlRWxlbWVudCA9IHJlcXVpcmUgJy4vd29ya3NwYWNlLWVsZW1lbnQnXG5QYW5lbENvbnRhaW5lckVsZW1lbnQgPSByZXF1aXJlICcuL3BhbmVsLWNvbnRhaW5lci1lbGVtZW50J1xuUGFuZWxFbGVtZW50ID0gcmVxdWlyZSAnLi9wYW5lbC1lbGVtZW50J1xuUGFuZUNvbnRhaW5lckVsZW1lbnQgPSByZXF1aXJlICcuL3BhbmUtY29udGFpbmVyLWVsZW1lbnQnXG5QYW5lQXhpc0VsZW1lbnQgPSByZXF1aXJlICcuL3BhbmUtYXhpcy1lbGVtZW50J1xuUGFuZUVsZW1lbnQgPSByZXF1aXJlICcuL3BhbmUtZWxlbWVudCdcbntjcmVhdGVHdXR0ZXJWaWV3fSA9IHJlcXVpcmUgJy4vZ3V0dGVyLWNvbXBvbmVudC1oZWxwZXJzJ1xuXG4jIEVzc2VudGlhbDogQXRvbSBnbG9iYWwgZm9yIGRlYWxpbmcgd2l0aCBwYWNrYWdlcywgdGhlbWVzLCBtZW51cywgYW5kIHRoZSB3aW5kb3cuXG4jXG4jIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b21gIGdsb2JhbC5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEF0b21FbnZpcm9ubWVudCBleHRlbmRzIE1vZGVsXG4gIEB2ZXJzaW9uOiAxICAjIEluY3JlbWVudCB0aGlzIHdoZW4gdGhlIHNlcmlhbGl6YXRpb24gZm9ybWF0IGNoYW5nZXNcblxuICBsYXN0VW5jYXVnaHRFcnJvcjogbnVsbFxuXG4gICMjI1xuICBTZWN0aW9uOiBQcm9wZXJ0aWVzXG4gICMjI1xuXG4gICMgUHVibGljOiBBIHtDb21tYW5kUmVnaXN0cnl9IGluc3RhbmNlXG4gIGNvbW1hbmRzOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge0NvbmZpZ30gaW5zdGFuY2VcbiAgY29uZmlnOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge0NsaXBib2FyZH0gaW5zdGFuY2VcbiAgY2xpcGJvYXJkOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge0NvbnRleHRNZW51TWFuYWdlcn0gaW5zdGFuY2VcbiAgY29udGV4dE1lbnU6IG51bGxcblxuICAjIFB1YmxpYzogQSB7TWVudU1hbmFnZXJ9IGluc3RhbmNlXG4gIG1lbnU6IG51bGxcblxuICAjIFB1YmxpYzogQSB7S2V5bWFwTWFuYWdlcn0gaW5zdGFuY2VcbiAga2V5bWFwczogbnVsbFxuXG4gICMgUHVibGljOiBBIHtUb29sdGlwTWFuYWdlcn0gaW5zdGFuY2VcbiAgdG9vbHRpcHM6IG51bGxcblxuICAjIFB1YmxpYzogQSB7Tm90aWZpY2F0aW9uTWFuYWdlcn0gaW5zdGFuY2VcbiAgbm90aWZpY2F0aW9uczogbnVsbFxuXG4gICMgUHVibGljOiBBIHtQcm9qZWN0fSBpbnN0YW5jZVxuICBwcm9qZWN0OiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge0dyYW1tYXJSZWdpc3RyeX0gaW5zdGFuY2VcbiAgZ3JhbW1hcnM6IG51bGxcblxuICAjIFB1YmxpYzogQSB7SGlzdG9yeU1hbmFnZXJ9IGluc3RhbmNlXG4gIGhpc3Rvcnk6IG51bGxcblxuICAjIFB1YmxpYzogQSB7UGFja2FnZU1hbmFnZXJ9IGluc3RhbmNlXG4gIHBhY2thZ2VzOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge1RoZW1lTWFuYWdlcn0gaW5zdGFuY2VcbiAgdGhlbWVzOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge1N0eWxlTWFuYWdlcn0gaW5zdGFuY2VcbiAgc3R5bGVzOiBudWxsXG5cbiAgIyBQdWJsaWM6IEEge0Rlc2VyaWFsaXplck1hbmFnZXJ9IGluc3RhbmNlXG4gIGRlc2VyaWFsaXplcnM6IG51bGxcblxuICAjIFB1YmxpYzogQSB7Vmlld1JlZ2lzdHJ5fSBpbnN0YW5jZVxuICB2aWV3czogbnVsbFxuXG4gICMgUHVibGljOiBBIHtXb3Jrc3BhY2V9IGluc3RhbmNlXG4gIHdvcmtzcGFjZTogbnVsbFxuXG4gICMgUHVibGljOiBBIHtUZXh0RWRpdG9yUmVnaXN0cnl9IGluc3RhbmNlXG4gIHRleHRFZGl0b3JzOiBudWxsXG5cbiAgIyBQcml2YXRlOiBBbiB7QXV0b1VwZGF0ZU1hbmFnZXJ9IGluc3RhbmNlXG4gIGF1dG9VcGRhdGVyOiBudWxsXG5cbiAgc2F2ZVN0YXRlRGVib3VuY2VJbnRlcnZhbDogMTAwMFxuXG4gICMjI1xuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb24gYW5kIERlc3RydWN0aW9uXG4gICMjI1xuXG4gICMgQ2FsbCAubG9hZE9yQ3JlYXRlIGluc3RlYWRcbiAgY29uc3RydWN0b3I6IChwYXJhbXM9e30pIC0+XG4gICAge0BibG9iU3RvcmUsIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCBAd2luZG93LCBAZG9jdW1lbnQsIEBjbGlwYm9hcmQsIEBjb25maWdEaXJQYXRoLCBAZW5hYmxlUGVyc2lzdGVuY2UsIG9ubHlMb2FkQmFzZVN0eWxlU2hlZXRzfSA9IHBhcmFtc1xuXG4gICAgQHVubG9hZGVkID0gZmFsc2VcbiAgICBAbG9hZFRpbWUgPSBudWxsXG4gICAge2Rldk1vZGUsIHNhZmVNb2RlLCByZXNvdXJjZVBhdGgsIGNsZWFyV2luZG93U3RhdGV9ID0gQGdldExvYWRTZXR0aW5ncygpXG5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBzdGF0ZVN0b3JlID0gbmV3IFN0YXRlU3RvcmUoJ0F0b21FbnZpcm9ubWVudHMnLCAxKVxuXG4gICAgaWYgY2xlYXJXaW5kb3dTdGF0ZVxuICAgICAgQGdldFN0b3JhZ2VGb2xkZXIoKS5jbGVhcigpXG4gICAgICBAc3RhdGVTdG9yZS5jbGVhcigpXG5cbiAgICBAZGVzZXJpYWxpemVycyA9IG5ldyBEZXNlcmlhbGl6ZXJNYW5hZ2VyKHRoaXMpXG4gICAgQGRlc2VyaWFsaXplVGltaW5ncyA9IHt9XG5cbiAgICBAdmlld3MgPSBuZXcgVmlld1JlZ2lzdHJ5KHRoaXMpXG5cbiAgICBAbm90aWZpY2F0aW9ucyA9IG5ldyBOb3RpZmljYXRpb25NYW5hZ2VyXG5cbiAgICBAY29uZmlnID0gbmV3IENvbmZpZyh7QGNvbmZpZ0RpclBhdGgsIHJlc291cmNlUGF0aCwgbm90aWZpY2F0aW9uTWFuYWdlcjogQG5vdGlmaWNhdGlvbnMsIEBlbmFibGVQZXJzaXN0ZW5jZX0pXG4gICAgQHNldENvbmZpZ1NjaGVtYSgpXG5cbiAgICBAa2V5bWFwcyA9IG5ldyBLZXltYXBNYW5hZ2VyKHtAY29uZmlnRGlyUGF0aCwgcmVzb3VyY2VQYXRoLCBub3RpZmljYXRpb25NYW5hZ2VyOiBAbm90aWZpY2F0aW9uc30pXG5cbiAgICBAdG9vbHRpcHMgPSBuZXcgVG9vbHRpcE1hbmFnZXIoa2V5bWFwTWFuYWdlcjogQGtleW1hcHMsIHZpZXdSZWdpc3RyeTogQHZpZXdzKVxuXG4gICAgQGNvbW1hbmRzID0gbmV3IENvbW1hbmRSZWdpc3RyeVxuICAgIEBjb21tYW5kcy5hdHRhY2goQHdpbmRvdylcblxuICAgIEBncmFtbWFycyA9IG5ldyBHcmFtbWFyUmVnaXN0cnkoe0Bjb25maWd9KVxuXG4gICAgQHN0eWxlcyA9IG5ldyBTdHlsZU1hbmFnZXIoe0Bjb25maWdEaXJQYXRofSlcblxuICAgIEBwYWNrYWdlcyA9IG5ldyBQYWNrYWdlTWFuYWdlcih7XG4gICAgICBkZXZNb2RlLCBAY29uZmlnRGlyUGF0aCwgcmVzb3VyY2VQYXRoLCBzYWZlTW9kZSwgQGNvbmZpZywgc3R5bGVNYW5hZ2VyOiBAc3R5bGVzLFxuICAgICAgY29tbWFuZFJlZ2lzdHJ5OiBAY29tbWFuZHMsIGtleW1hcE1hbmFnZXI6IEBrZXltYXBzLCBub3RpZmljYXRpb25NYW5hZ2VyOiBAbm90aWZpY2F0aW9ucyxcbiAgICAgIGdyYW1tYXJSZWdpc3RyeTogQGdyYW1tYXJzLCBkZXNlcmlhbGl6ZXJNYW5hZ2VyOiBAZGVzZXJpYWxpemVycywgdmlld1JlZ2lzdHJ5OiBAdmlld3NcbiAgICB9KVxuXG4gICAgQHRoZW1lcyA9IG5ldyBUaGVtZU1hbmFnZXIoe1xuICAgICAgcGFja2FnZU1hbmFnZXI6IEBwYWNrYWdlcywgQGNvbmZpZ0RpclBhdGgsIHJlc291cmNlUGF0aCwgc2FmZU1vZGUsIEBjb25maWcsXG4gICAgICBzdHlsZU1hbmFnZXI6IEBzdHlsZXMsIG5vdGlmaWNhdGlvbk1hbmFnZXI6IEBub3RpZmljYXRpb25zLCB2aWV3UmVnaXN0cnk6IEB2aWV3c1xuICAgIH0pXG5cbiAgICBAbWVudSA9IG5ldyBNZW51TWFuYWdlcih7cmVzb3VyY2VQYXRoLCBrZXltYXBNYW5hZ2VyOiBAa2V5bWFwcywgcGFja2FnZU1hbmFnZXI6IEBwYWNrYWdlc30pXG5cbiAgICBAY29udGV4dE1lbnUgPSBuZXcgQ29udGV4dE1lbnVNYW5hZ2VyKHtyZXNvdXJjZVBhdGgsIGRldk1vZGUsIGtleW1hcE1hbmFnZXI6IEBrZXltYXBzfSlcblxuICAgIEBwYWNrYWdlcy5zZXRNZW51TWFuYWdlcihAbWVudSlcbiAgICBAcGFja2FnZXMuc2V0Q29udGV4dE1lbnVNYW5hZ2VyKEBjb250ZXh0TWVudSlcbiAgICBAcGFja2FnZXMuc2V0VGhlbWVNYW5hZ2VyKEB0aGVtZXMpXG5cbiAgICBAcHJvamVjdCA9IG5ldyBQcm9qZWN0KHtub3RpZmljYXRpb25NYW5hZ2VyOiBAbm90aWZpY2F0aW9ucywgcGFja2FnZU1hbmFnZXI6IEBwYWNrYWdlcywgQGNvbmZpZywgQGFwcGxpY2F0aW9uRGVsZWdhdGV9KVxuXG4gICAgQGNvbW1hbmRJbnN0YWxsZXIgPSBuZXcgQ29tbWFuZEluc3RhbGxlcihAZ2V0VmVyc2lvbigpLCBAYXBwbGljYXRpb25EZWxlZ2F0ZSlcblxuICAgIEB0ZXh0RWRpdG9ycyA9IG5ldyBUZXh0RWRpdG9yUmVnaXN0cnkoe1xuICAgICAgQGNvbmZpZywgZ3JhbW1hclJlZ2lzdHJ5OiBAZ3JhbW1hcnMsIGFzc2VydDogQGFzc2VydC5iaW5kKHRoaXMpLFxuICAgICAgcGFja2FnZU1hbmFnZXI6IEBwYWNrYWdlc1xuICAgIH0pXG5cbiAgICBAd29ya3NwYWNlID0gbmV3IFdvcmtzcGFjZSh7XG4gICAgICBAY29uZmlnLCBAcHJvamVjdCwgcGFja2FnZU1hbmFnZXI6IEBwYWNrYWdlcywgZ3JhbW1hclJlZ2lzdHJ5OiBAZ3JhbW1hcnMsIGRlc2VyaWFsaXplck1hbmFnZXI6IEBkZXNlcmlhbGl6ZXJzLFxuICAgICAgbm90aWZpY2F0aW9uTWFuYWdlcjogQG5vdGlmaWNhdGlvbnMsIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCB2aWV3UmVnaXN0cnk6IEB2aWV3cywgYXNzZXJ0OiBAYXNzZXJ0LmJpbmQodGhpcyksXG4gICAgICB0ZXh0RWRpdG9yUmVnaXN0cnk6IEB0ZXh0RWRpdG9ycyxcbiAgICB9KVxuXG4gICAgQHRoZW1lcy53b3Jrc3BhY2UgPSBAd29ya3NwYWNlXG5cbiAgICBAYXV0b1VwZGF0ZXIgPSBuZXcgQXV0b1VwZGF0ZU1hbmFnZXIoe0BhcHBsaWNhdGlvbkRlbGVnYXRlfSlcblxuICAgIEBjb25maWcubG9hZCgpXG5cbiAgICBAdGhlbWVzLmxvYWRCYXNlU3R5bGVzaGVldHMoKVxuICAgIEBpbml0aWFsU3R5bGVFbGVtZW50cyA9IEBzdHlsZXMuZ2V0U25hcHNob3QoKVxuICAgIEB0aGVtZXMuaW5pdGlhbExvYWRDb21wbGV0ZSA9IHRydWUgaWYgb25seUxvYWRCYXNlU3R5bGVTaGVldHNcbiAgICBAc2V0Qm9keVBsYXRmb3JtQ2xhc3MoKVxuXG4gICAgQHN0eWxlc0VsZW1lbnQgPSBAc3R5bGVzLmJ1aWxkU3R5bGVzRWxlbWVudCgpXG4gICAgQGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoQHN0eWxlc0VsZW1lbnQpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkKEBhcHBsaWNhdGlvbkRlbGVnYXRlLmRpc2FibGVab29tKCkpXG5cbiAgICBAa2V5bWFwcy5zdWJzY3JpYmVUb0ZpbGVSZWFkRmFpbHVyZSgpXG4gICAgQGtleW1hcHMubG9hZEJ1bmRsZWRLZXltYXBzKClcblxuICAgIEByZWdpc3RlckRlZmF1bHRDb21tYW5kcygpXG4gICAgQHJlZ2lzdGVyRGVmYXVsdE9wZW5lcnMoKVxuICAgIEByZWdpc3RlckRlZmF1bHREZXNlcmlhbGl6ZXJzKClcbiAgICBAcmVnaXN0ZXJEZWZhdWx0Vmlld1Byb3ZpZGVycygpXG5cbiAgICBAaW5zdGFsbFVuY2F1Z2h0RXJyb3JIYW5kbGVyKClcbiAgICBAYXR0YWNoU2F2ZVN0YXRlTGlzdGVuZXJzKClcbiAgICBAaW5zdGFsbFdpbmRvd0V2ZW50SGFuZGxlcigpXG5cbiAgICBAb2JzZXJ2ZUF1dG9IaWRlTWVudUJhcigpXG5cbiAgICBAaGlzdG9yeSA9IG5ldyBIaXN0b3J5TWFuYWdlcih7QHByb2plY3QsIEBjb21tYW5kcywgbG9jYWxTdG9yYWdlfSlcbiAgICAjIEtlZXAgaW5zdGFuY2VzIG9mIEhpc3RvcnlNYW5hZ2VyIGluIHN5bmNcbiAgICBAaGlzdG9yeS5vbkRpZENoYW5nZVByb2plY3RzIChlKSA9PlxuICAgICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuZGlkQ2hhbmdlSGlzdG9yeU1hbmFnZXIoKSB1bmxlc3MgZS5yZWxvYWRlZFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGFwcGxpY2F0aW9uRGVsZWdhdGUub25EaWRDaGFuZ2VIaXN0b3J5TWFuYWdlcig9PiBAaGlzdG9yeS5sb2FkU3RhdGUoKSlcblxuICAgIG5ldyBSZW9wZW5Qcm9qZWN0TWVudU1hbmFnZXIoe0BtZW51LCBAY29tbWFuZHMsIEBoaXN0b3J5LCBAY29uZmlnLCBvcGVuOiAocGF0aHMpID0+IEBvcGVuKHBhdGhzVG9PcGVuOiBwYXRocyl9KVxuXG4gICAgY2hlY2tQb3J0YWJsZUhvbWVXcml0YWJsZSA9ID0+XG4gICAgICByZXNwb25zZUNoYW5uZWwgPSBcImNoZWNrLXBvcnRhYmxlLWhvbWUtd3JpdGFibGUtcmVzcG9uc2VcIlxuICAgICAgaXBjUmVuZGVyZXIub24gcmVzcG9uc2VDaGFubmVsLCAoZXZlbnQsIHJlc3BvbnNlKSAtPlxuICAgICAgICBpcGNSZW5kZXJlci5yZW1vdmVBbGxMaXN0ZW5lcnMocmVzcG9uc2VDaGFubmVsKVxuICAgICAgICBAbm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiI3tyZXNwb25zZS5tZXNzYWdlLnJlcGxhY2UoLyhbXFxcXFxcLitcXFxcLV8jIV0pL2csICdcXFxcJDEnKX1cIikgaWYgbm90IHJlc3BvbnNlLndyaXRhYmxlXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIG5ldyBEaXNwb3NhYmxlIC0+IGlwY1JlbmRlcmVyLnJlbW92ZUFsbExpc3RlbmVycyhyZXNwb25zZUNoYW5uZWwpXG4gICAgICBpcGNSZW5kZXJlci5zZW5kKCdjaGVjay1wb3J0YWJsZS1ob21lLXdyaXRhYmxlJywgcmVzcG9uc2VDaGFubmVsKVxuXG4gICAgY2hlY2tQb3J0YWJsZUhvbWVXcml0YWJsZSgpXG5cbiAgYXR0YWNoU2F2ZVN0YXRlTGlzdGVuZXJzOiAtPlxuICAgIHNhdmVTdGF0ZSA9IF8uZGVib3VuY2UoKD0+XG4gICAgICB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayA9PiBAc2F2ZVN0YXRlKHtpc1VubG9hZGluZzogZmFsc2V9KSB1bmxlc3MgQHVubG9hZGVkXG4gICAgKSwgQHNhdmVTdGF0ZURlYm91bmNlSW50ZXJ2YWwpXG4gICAgQGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHNhdmVTdGF0ZSwgdHJ1ZSlcbiAgICBAZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHNhdmVTdGF0ZSwgdHJ1ZSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgc2F2ZVN0YXRlLCB0cnVlKVxuICAgICAgQGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBzYXZlU3RhdGUsIHRydWUpXG5cbiAgc2V0Q29uZmlnU2NoZW1hOiAtPlxuICAgIEBjb25maWcuc2V0U2NoZW1hIG51bGwsIHt0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogXy5jbG9uZShyZXF1aXJlKCcuL2NvbmZpZy1zY2hlbWEnKSl9XG5cbiAgcmVnaXN0ZXJEZWZhdWx0RGVzZXJpYWxpemVyczogLT5cbiAgICBAZGVzZXJpYWxpemVycy5hZGQoV29ya3NwYWNlKVxuICAgIEBkZXNlcmlhbGl6ZXJzLmFkZChQYW5lQ29udGFpbmVyKVxuICAgIEBkZXNlcmlhbGl6ZXJzLmFkZChQYW5lQXhpcylcbiAgICBAZGVzZXJpYWxpemVycy5hZGQoUGFuZSlcbiAgICBAZGVzZXJpYWxpemVycy5hZGQoUHJvamVjdClcbiAgICBAZGVzZXJpYWxpemVycy5hZGQoVGV4dEVkaXRvcilcbiAgICBAZGVzZXJpYWxpemVycy5hZGQoVGV4dEJ1ZmZlcilcblxuICByZWdpc3RlckRlZmF1bHRDb21tYW5kczogLT5cbiAgICByZWdpc3RlckRlZmF1bHRDb21tYW5kcyh7Y29tbWFuZFJlZ2lzdHJ5OiBAY29tbWFuZHMsIEBjb25maWcsIEBjb21tYW5kSW5zdGFsbGVyLCBub3RpZmljYXRpb25NYW5hZ2VyOiBAbm90aWZpY2F0aW9ucywgQHByb2plY3QsIEBjbGlwYm9hcmR9KVxuXG4gIHJlZ2lzdGVyRGVmYXVsdFZpZXdQcm92aWRlcnM6IC0+XG4gICAgQHZpZXdzLmFkZFZpZXdQcm92aWRlciBXb3Jrc3BhY2UsIChtb2RlbCwgZW52KSAtPlxuICAgICAgbmV3IFdvcmtzcGFjZUVsZW1lbnQoKS5pbml0aWFsaXplKG1vZGVsLCBlbnYpXG4gICAgQHZpZXdzLmFkZFZpZXdQcm92aWRlciBQYW5lbENvbnRhaW5lciwgKG1vZGVsLCBlbnYpIC0+XG4gICAgICBuZXcgUGFuZWxDb250YWluZXJFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCwgZW52KVxuICAgIEB2aWV3cy5hZGRWaWV3UHJvdmlkZXIgUGFuZWwsIChtb2RlbCwgZW52KSAtPlxuICAgICAgbmV3IFBhbmVsRWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwsIGVudilcbiAgICBAdmlld3MuYWRkVmlld1Byb3ZpZGVyIFBhbmVDb250YWluZXIsIChtb2RlbCwgZW52KSAtPlxuICAgICAgbmV3IFBhbmVDb250YWluZXJFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCwgZW52KVxuICAgIEB2aWV3cy5hZGRWaWV3UHJvdmlkZXIgUGFuZUF4aXMsIChtb2RlbCwgZW52KSAtPlxuICAgICAgbmV3IFBhbmVBeGlzRWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwsIGVudilcbiAgICBAdmlld3MuYWRkVmlld1Byb3ZpZGVyIFBhbmUsIChtb2RlbCwgZW52KSAtPlxuICAgICAgbmV3IFBhbmVFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbCwgZW52KVxuICAgIEB2aWV3cy5hZGRWaWV3UHJvdmlkZXIoR3V0dGVyLCBjcmVhdGVHdXR0ZXJWaWV3KVxuXG4gIHJlZ2lzdGVyRGVmYXVsdE9wZW5lcnM6IC0+XG4gICAgQHdvcmtzcGFjZS5hZGRPcGVuZXIgKHVyaSkgPT5cbiAgICAgIHN3aXRjaCB1cmlcbiAgICAgICAgd2hlbiAnYXRvbTovLy5hdG9tL3N0eWxlc2hlZXQnXG4gICAgICAgICAgQHdvcmtzcGFjZS5vcGVuKEBzdHlsZXMuZ2V0VXNlclN0eWxlU2hlZXRQYXRoKCkpXG4gICAgICAgIHdoZW4gJ2F0b206Ly8uYXRvbS9rZXltYXAnXG4gICAgICAgICAgQHdvcmtzcGFjZS5vcGVuKEBrZXltYXBzLmdldFVzZXJLZXltYXBQYXRoKCkpXG4gICAgICAgIHdoZW4gJ2F0b206Ly8uYXRvbS9jb25maWcnXG4gICAgICAgICAgQHdvcmtzcGFjZS5vcGVuKEBjb25maWcuZ2V0VXNlckNvbmZpZ1BhdGgoKSlcbiAgICAgICAgd2hlbiAnYXRvbTovLy5hdG9tL2luaXQtc2NyaXB0J1xuICAgICAgICAgIEB3b3Jrc3BhY2Uub3BlbihAZ2V0VXNlckluaXRTY3JpcHRQYXRoKCkpXG5cbiAgcmVnaXN0ZXJEZWZhdWx0VGFyZ2V0Rm9yS2V5bWFwczogLT5cbiAgICBAa2V5bWFwcy5kZWZhdWx0VGFyZ2V0ID0gQHZpZXdzLmdldFZpZXcoQHdvcmtzcGFjZSlcblxuICBvYnNlcnZlQXV0b0hpZGVNZW51QmFyOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGNvbmZpZy5vbkRpZENoYW5nZSAnY29yZS5hdXRvSGlkZU1lbnVCYXInLCAoe25ld1ZhbHVlfSkgPT5cbiAgICAgIEBzZXRBdXRvSGlkZU1lbnVCYXIobmV3VmFsdWUpXG4gICAgQHNldEF1dG9IaWRlTWVudUJhcih0cnVlKSBpZiBAY29uZmlnLmdldCgnY29yZS5hdXRvSGlkZU1lbnVCYXInKVxuXG4gIHJlc2V0OiAtPlxuICAgIEBkZXNlcmlhbGl6ZXJzLmNsZWFyKClcbiAgICBAcmVnaXN0ZXJEZWZhdWx0RGVzZXJpYWxpemVycygpXG5cbiAgICBAY29uZmlnLmNsZWFyKClcbiAgICBAc2V0Q29uZmlnU2NoZW1hKClcblxuICAgIEBrZXltYXBzLmNsZWFyKClcbiAgICBAa2V5bWFwcy5sb2FkQnVuZGxlZEtleW1hcHMoKVxuXG4gICAgQGNvbW1hbmRzLmNsZWFyKClcbiAgICBAcmVnaXN0ZXJEZWZhdWx0Q29tbWFuZHMoKVxuXG4gICAgQHN0eWxlcy5yZXN0b3JlU25hcHNob3QoQGluaXRpYWxTdHlsZUVsZW1lbnRzKVxuXG4gICAgQG1lbnUuY2xlYXIoKVxuXG4gICAgQGNsaXBib2FyZC5yZXNldCgpXG5cbiAgICBAbm90aWZpY2F0aW9ucy5jbGVhcigpXG5cbiAgICBAY29udGV4dE1lbnUuY2xlYXIoKVxuXG4gICAgQHBhY2thZ2VzLnJlc2V0KClcblxuICAgIEB3b3Jrc3BhY2UucmVzZXQoQHBhY2thZ2VzKVxuICAgIEByZWdpc3RlckRlZmF1bHRPcGVuZXJzKClcblxuICAgIEBwcm9qZWN0LnJlc2V0KEBwYWNrYWdlcylcblxuICAgIEB3b3Jrc3BhY2Uuc3Vic2NyaWJlVG9FdmVudHMoKVxuXG4gICAgQGdyYW1tYXJzLmNsZWFyKClcblxuICAgIEB0ZXh0RWRpdG9ycy5jbGVhcigpXG5cbiAgICBAdmlld3MuY2xlYXIoKVxuICAgIEByZWdpc3RlckRlZmF1bHRWaWV3UHJvdmlkZXJzKClcblxuICBkZXN0cm95OiAtPlxuICAgIHJldHVybiBpZiBub3QgQHByb2plY3RcblxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAd29ya3NwYWNlPy5kZXN0cm95KClcbiAgICBAd29ya3NwYWNlID0gbnVsbFxuICAgIEB0aGVtZXMud29ya3NwYWNlID0gbnVsbFxuICAgIEBwcm9qZWN0Py5kZXN0cm95KClcbiAgICBAcHJvamVjdCA9IG51bGxcbiAgICBAY29tbWFuZHMuY2xlYXIoKVxuICAgIEBzdHlsZXNFbGVtZW50LnJlbW92ZSgpXG4gICAgQGNvbmZpZy51bm9ic2VydmVVc2VyQ29uZmlnKClcbiAgICBAYXV0b1VwZGF0ZXIuZGVzdHJveSgpXG5cbiAgICBAdW5pbnN0YWxsV2luZG93RXZlbnRIYW5kbGVyKClcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbmV2ZXIgezo6YmVlcH0gaXMgY2FsbGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW5ldmVyIHs6OmJlZXB9IGlzIGNhbGxlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQmVlcDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYmVlcCcsIGNhbGxiYWNrXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZXJlIGlzIGFuIHVuaGFuZGxlZCBlcnJvciwgYnV0XG4gICMgYmVmb3JlIHRoZSBkZXZ0b29scyBwb3Agb3BlblxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW5ldmVyIHRoZXJlIGlzIGFuIHVuaGFuZGxlZCBlcnJvclxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9XG4gICMgICAgICogYG9yaWdpbmFsRXJyb3JgIHtPYmplY3R9IHRoZSBvcmlnaW5hbCBlcnJvciBvYmplY3RcbiAgIyAgICAgKiBgbWVzc2FnZWAge1N0cmluZ30gdGhlIG9yaWdpbmFsIGVycm9yIG9iamVjdFxuICAjICAgICAqIGB1cmxgIHtTdHJpbmd9IFVybCB0byB0aGUgZmlsZSB3aGVyZSB0aGUgZXJyb3Igb3JpZ2luYXRlZC5cbiAgIyAgICAgKiBgbGluZWAge051bWJlcn1cbiAgIyAgICAgKiBgY29sdW1uYCB7TnVtYmVyfVxuICAjICAgICAqIGBwcmV2ZW50RGVmYXVsdGAge0Z1bmN0aW9ufSBjYWxsIHRoaXMgdG8gYXZvaWQgcG9wcGluZyB1cCB0aGUgZGV2IHRvb2xzLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25XaWxsVGhyb3dFcnJvcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICd3aWxsLXRocm93LWVycm9yJywgY2FsbGJhY2tcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW5ldmVyIHRoZXJlIGlzIGFuIHVuaGFuZGxlZCBlcnJvci5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuZXZlciB0aGVyZSBpcyBhbiB1bmhhbmRsZWQgZXJyb3JcbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fVxuICAjICAgICAqIGBvcmlnaW5hbEVycm9yYCB7T2JqZWN0fSB0aGUgb3JpZ2luYWwgZXJyb3Igb2JqZWN0XG4gICMgICAgICogYG1lc3NhZ2VgIHtTdHJpbmd9IHRoZSBvcmlnaW5hbCBlcnJvciBvYmplY3RcbiAgIyAgICAgKiBgdXJsYCB7U3RyaW5nfSBVcmwgdG8gdGhlIGZpbGUgd2hlcmUgdGhlIGVycm9yIG9yaWdpbmF0ZWQuXG4gICMgICAgICogYGxpbmVgIHtOdW1iZXJ9XG4gICMgICAgICogYGNvbHVtbmAge051bWJlcn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkVGhyb3dFcnJvcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtdGhyb3ctZXJyb3InLCBjYWxsYmFja1xuXG4gICMgVE9ETzogTWFrZSB0aGlzIHBhcnQgb2YgdGhlIHB1YmxpYyBBUEkuIFdlIHNob3VsZCBtYWtlIG9uRGlkVGhyb3dFcnJvclxuICAjIG1hdGNoIHRoZSBpbnRlcmZhY2UgYnkgb25seSB5aWVsZGluZyBhbiBleGNlcHRpb24gb2JqZWN0IHRvIHRoZSBoYW5kbGVyXG4gICMgYW5kIGRlcHJlY2F0aW5nIHRoZSBvbGQgYmVoYXZpb3IuXG4gIG9uRGlkRmFpbEFzc2VydGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZmFpbC1hc3NlcnRpb24nLCBjYWxsYmFja1xuXG4gICMjI1xuICBTZWN0aW9uOiBBdG9tIERldGFpbHNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYSB7Qm9vbGVhbn0gdGhhdCBpcyBgdHJ1ZWAgaWYgdGhlIGN1cnJlbnQgd2luZG93IGlzIGluIGRldmVsb3BtZW50IG1vZGUuXG4gIGluRGV2TW9kZTogLT5cbiAgICBAZGV2TW9kZSA/PSBAZ2V0TG9hZFNldHRpbmdzKCkuZGV2TW9kZVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQgaXMgYHRydWVgIGlmIHRoZSBjdXJyZW50IHdpbmRvdyBpcyBpbiBzYWZlIG1vZGUuXG4gIGluU2FmZU1vZGU6IC0+XG4gICAgQHNhZmVNb2RlID89IEBnZXRMb2FkU2V0dGluZ3MoKS5zYWZlTW9kZVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQgaXMgYHRydWVgIGlmIHRoZSBjdXJyZW50IHdpbmRvdyBpcyBydW5uaW5nIHNwZWNzLlxuICBpblNwZWNNb2RlOiAtPlxuICAgIEBzcGVjTW9kZSA/PSBAZ2V0TG9hZFNldHRpbmdzKCkuaXNTcGVjXG5cbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0aGlzIHRoZSBmaXJzdCB0aW1lIHRoZSB3aW5kb3cncyBiZWVuXG4gICMgbG9hZGVkLlxuICBpc0ZpcnN0TG9hZDogLT5cbiAgICBAZmlyc3RMb2FkID89IEBnZXRMb2FkU2V0dGluZ3MoKS5maXJzdExvYWRcblxuICAjIFB1YmxpYzogR2V0IHRoZSB2ZXJzaW9uIG9mIHRoZSBBdG9tIGFwcGxpY2F0aW9uLlxuICAjXG4gICMgUmV0dXJucyB0aGUgdmVyc2lvbiB0ZXh0IHtTdHJpbmd9LlxuICBnZXRWZXJzaW9uOiAtPlxuICAgIEBhcHBWZXJzaW9uID89IEBnZXRMb2FkU2V0dGluZ3MoKS5hcHBWZXJzaW9uXG5cbiAgIyBSZXR1cm5zIHRoZSByZWxlYXNlIGNoYW5uZWwgYXMgYSB7U3RyaW5nfS4gV2lsbCByZXR1cm4gb25lIG9mIGAnZGV2JywgJ2JldGEnLCAnc3RhYmxlJ2BcbiAgZ2V0UmVsZWFzZUNoYW5uZWw6IC0+XG4gICAgdmVyc2lvbiA9IEBnZXRWZXJzaW9uKClcbiAgICBpZiB2ZXJzaW9uLmluZGV4T2YoJ2JldGEnKSA+IC0xXG4gICAgICAnYmV0YSdcbiAgICBlbHNlIGlmIHZlcnNpb24uaW5kZXhPZignZGV2JykgPiAtMVxuICAgICAgJ2RldidcbiAgICBlbHNlXG4gICAgICAnc3RhYmxlJ1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQgaXMgYHRydWVgIGlmIHRoZSBjdXJyZW50IHZlcnNpb24gaXMgYW4gb2ZmaWNpYWwgcmVsZWFzZS5cbiAgaXNSZWxlYXNlZFZlcnNpb246IC0+XG4gICAgbm90IC9cXHd7N30vLnRlc3QoQGdldFZlcnNpb24oKSkgIyBDaGVjayBpZiB0aGUgcmVsZWFzZSBpcyBhIDctY2hhcmFjdGVyIFNIQSBwcmVmaXhcblxuICAjIFB1YmxpYzogR2V0IHRoZSB0aW1lIHRha2VuIHRvIGNvbXBsZXRlbHkgbG9hZCB0aGUgY3VycmVudCB3aW5kb3cuXG4gICNcbiAgIyBUaGlzIHRpbWUgaW5jbHVkZSB0aGluZ3MgbGlrZSBsb2FkaW5nIGFuZCBhY3RpdmF0aW5nIHBhY2thZ2VzLCBjcmVhdGluZ1xuICAjIERPTSBlbGVtZW50cyBmb3IgdGhlIGVkaXRvciwgYW5kIHJlYWRpbmcgdGhlIGNvbmZpZy5cbiAgI1xuICAjIFJldHVybnMgdGhlIHtOdW1iZXJ9IG9mIG1pbGxpc2Vjb25kcyB0YWtlbiB0byBsb2FkIHRoZSB3aW5kb3cgb3IgbnVsbFxuICAjIGlmIHRoZSB3aW5kb3cgaGFzbid0IGZpbmlzaGVkIGxvYWRpbmcgeWV0LlxuICBnZXRXaW5kb3dMb2FkVGltZTogLT5cbiAgICBAbG9hZFRpbWVcblxuICAjIFB1YmxpYzogR2V0IHRoZSBsb2FkIHNldHRpbmdzIGZvciB0aGUgY3VycmVudCB3aW5kb3cuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtPYmplY3R9IGNvbnRhaW5pbmcgYWxsIHRoZSBsb2FkIHNldHRpbmcga2V5L3ZhbHVlIHBhaXJzLlxuICBnZXRMb2FkU2V0dGluZ3M6IC0+XG4gICAgZ2V0V2luZG93TG9hZFNldHRpbmdzKClcblxuICAjIyNcbiAgU2VjdGlvbjogTWFuYWdpbmcgVGhlIEF0b20gV2luZG93XG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBPcGVuIGEgbmV3IEF0b20gd2luZG93IHVzaW5nIHRoZSBnaXZlbiBvcHRpb25zLlxuICAjXG4gICMgQ2FsbGluZyB0aGlzIG1ldGhvZCB3aXRob3V0IGFuIG9wdGlvbnMgcGFyYW1ldGVyIHdpbGwgb3BlbiBhIHByb21wdCB0byBwaWNrXG4gICMgYSBmaWxlL2ZvbGRlciB0byBvcGVuIGluIHRoZSBuZXcgd2luZG93LlxuICAjXG4gICMgKiBgcGFyYW1zYCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYHBhdGhzVG9PcGVuYCAgQW4ge0FycmF5fSBvZiB7U3RyaW5nfSBwYXRocyB0byBvcGVuLlxuICAjICAgKiBgbmV3V2luZG93YCBBIHtCb29sZWFufSwgdHJ1ZSB0byBhbHdheXMgb3BlbiBhIG5ldyB3aW5kb3cgaW5zdGVhZCBvZlxuICAjICAgICByZXVzaW5nIGV4aXN0aW5nIHdpbmRvd3MgZGVwZW5kaW5nIG9uIHRoZSBwYXRocyB0byBvcGVuLlxuICAjICAgKiBgZGV2TW9kZWAgQSB7Qm9vbGVhbn0sIHRydWUgdG8gb3BlbiB0aGUgd2luZG93IGluIGRldmVsb3BtZW50IG1vZGUuXG4gICMgICAgIERldmVsb3BtZW50IG1vZGUgbG9hZHMgdGhlIEF0b20gc291cmNlIGZyb20gdGhlIGxvY2FsbHkgY2xvbmVkXG4gICMgICAgIHJlcG9zaXRvcnkgYW5kIGFsc28gbG9hZHMgYWxsIHRoZSBwYWNrYWdlcyBpbiB+Ly5hdG9tL2Rldi9wYWNrYWdlc1xuICAjICAgKiBgc2FmZU1vZGVgIEEge0Jvb2xlYW59LCB0cnVlIHRvIG9wZW4gdGhlIHdpbmRvdyBpbiBzYWZlIG1vZGUuIFNhZmVcbiAgIyAgICAgbW9kZSBwcmV2ZW50cyBhbGwgcGFja2FnZXMgaW5zdGFsbGVkIHRvIH4vLmF0b20vcGFja2FnZXMgZnJvbSBsb2FkaW5nLlxuICBvcGVuOiAocGFyYW1zKSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLm9wZW4ocGFyYW1zKVxuXG4gICMgRXh0ZW5kZWQ6IFByb21wdCB0aGUgdXNlciB0byBzZWxlY3Qgb25lIG9yIG1vcmUgZm9sZGVycy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCBBIHtGdW5jdGlvbn0gdG8gY2FsbCBvbmNlIHRoZSB1c2VyIGhhcyBjb25maXJtZWQgdGhlIHNlbGVjdGlvbi5cbiAgIyAgICogYHBhdGhzYCBBbiB7QXJyYXl9IG9mIHtTdHJpbmd9IHBhdGhzIHRoYXQgdGhlIHVzZXIgc2VsZWN0ZWQsIG9yIGBudWxsYFxuICAjICAgICBpZiB0aGUgdXNlciBkaXNtaXNzZWQgdGhlIGRpYWxvZy5cbiAgcGlja0ZvbGRlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnBpY2tGb2xkZXIoY2FsbGJhY2spXG5cbiAgIyBFc3NlbnRpYWw6IENsb3NlIHRoZSBjdXJyZW50IHdpbmRvdy5cbiAgY2xvc2U6IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuY2xvc2VXaW5kb3coKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhlIHNpemUgb2YgY3VycmVudCB3aW5kb3cuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtPYmplY3R9IGluIHRoZSBmb3JtYXQgYHt3aWR0aDogMTAwMCwgaGVpZ2h0OiA3MDB9YFxuICBnZXRTaXplOiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmdldFdpbmRvd1NpemUoKVxuXG4gICMgRXNzZW50aWFsOiBTZXQgdGhlIHNpemUgb2YgY3VycmVudCB3aW5kb3cuXG4gICNcbiAgIyAqIGB3aWR0aGAgVGhlIHtOdW1iZXJ9IG9mIHBpeGVscy5cbiAgIyAqIGBoZWlnaHRgIFRoZSB7TnVtYmVyfSBvZiBwaXhlbHMuXG4gIHNldFNpemU6ICh3aWR0aCwgaGVpZ2h0KSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd1NpemUod2lkdGgsIGhlaWdodClcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHdpbmRvdy5cbiAgI1xuICAjIFJldHVybnMgYW4ge09iamVjdH0gaW4gdGhlIGZvcm1hdCBge3g6IDEwLCB5OiAyMH1gXG4gIGdldFBvc2l0aW9uOiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmdldFdpbmRvd1Bvc2l0aW9uKClcblxuICAjIEVzc2VudGlhbDogU2V0IHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHdpbmRvdy5cbiAgI1xuICAjICogYHhgIFRoZSB7TnVtYmVyfSBvZiBwaXhlbHMuXG4gICMgKiBgeWAgVGhlIHtOdW1iZXJ9IG9mIHBpeGVscy5cbiAgc2V0UG9zaXRpb246ICh4LCB5KSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd1Bvc2l0aW9uKHgsIHkpXG5cbiAgIyBFeHRlbmRlZDogR2V0IHRoZSBjdXJyZW50IHdpbmRvd1xuICBnZXRDdXJyZW50V2luZG93OiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmdldEN1cnJlbnRXaW5kb3coKVxuXG4gICMgRXh0ZW5kZWQ6IE1vdmUgY3VycmVudCB3aW5kb3cgdG8gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuLlxuICBjZW50ZXI6IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuY2VudGVyV2luZG93KClcblxuICAjIEV4dGVuZGVkOiBGb2N1cyB0aGUgY3VycmVudCB3aW5kb3cuXG4gIGZvY3VzOiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmZvY3VzV2luZG93KClcbiAgICBAd2luZG93LmZvY3VzKClcblxuICAjIEV4dGVuZGVkOiBTaG93IHRoZSBjdXJyZW50IHdpbmRvdy5cbiAgc2hvdzogLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zaG93V2luZG93KClcblxuICAjIEV4dGVuZGVkOiBIaWRlIHRoZSBjdXJyZW50IHdpbmRvdy5cbiAgaGlkZTogLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5oaWRlV2luZG93KClcblxuICAjIEV4dGVuZGVkOiBSZWxvYWQgdGhlIGN1cnJlbnQgd2luZG93LlxuICByZWxvYWQ6IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUucmVsb2FkV2luZG93KClcblxuICAjIEV4dGVuZGVkOiBSZWxhdW5jaCB0aGUgZW50aXJlIGFwcGxpY2F0aW9uLlxuICByZXN0YXJ0QXBwbGljYXRpb246IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUucmVzdGFydEFwcGxpY2F0aW9uKClcblxuICAjIEV4dGVuZGVkOiBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQgaXMgYHRydWVgIGlmIHRoZSBjdXJyZW50IHdpbmRvdyBpcyBtYXhpbWl6ZWQuXG4gIGlzTWF4aW1pemVkOiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmlzV2luZG93TWF4aW1pemVkKClcblxuICBtYXhpbWl6ZTogLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5tYXhpbWl6ZVdpbmRvdygpXG5cbiAgIyBFeHRlbmRlZDogUmV0dXJucyBhIHtCb29sZWFufSB0aGF0IGlzIGB0cnVlYCBpZiB0aGUgY3VycmVudCB3aW5kb3cgaXMgaW4gZnVsbCBzY3JlZW4gbW9kZS5cbiAgaXNGdWxsU2NyZWVuOiAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmlzV2luZG93RnVsbFNjcmVlbigpXG5cbiAgIyBFeHRlbmRlZDogU2V0IHRoZSBmdWxsIHNjcmVlbiBzdGF0ZSBvZiB0aGUgY3VycmVudCB3aW5kb3cuXG4gIHNldEZ1bGxTY3JlZW46IChmdWxsU2NyZWVuPWZhbHNlKSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd0Z1bGxTY3JlZW4oZnVsbFNjcmVlbilcblxuICAjIEV4dGVuZGVkOiBUb2dnbGUgdGhlIGZ1bGwgc2NyZWVuIHN0YXRlIG9mIHRoZSBjdXJyZW50IHdpbmRvdy5cbiAgdG9nZ2xlRnVsbFNjcmVlbjogLT5cbiAgICBAc2V0RnVsbFNjcmVlbihub3QgQGlzRnVsbFNjcmVlbigpKVxuXG4gICMgUmVzdG9yZSB0aGUgd2luZG93IHRvIGl0cyBwcmV2aW91cyBkaW1lbnNpb25zIGFuZCBzaG93IGl0LlxuICAjXG4gICMgUmVzdG9yZXMgdGhlIGZ1bGwgc2NyZWVuIGFuZCBtYXhpbWl6ZWQgc3RhdGUgYWZ0ZXIgdGhlIHdpbmRvdyBoYXMgcmVzaXplZCB0b1xuICAjIHByZXZlbnQgcmVzaXplIGdsaXRjaGVzLlxuICBkaXNwbGF5V2luZG93OiAtPlxuICAgIEByZXN0b3JlV2luZG93RGltZW5zaW9ucygpLnRoZW4gPT5cbiAgICAgIHN0ZXBzID0gW1xuICAgICAgICBAcmVzdG9yZVdpbmRvd0JhY2tncm91bmQoKSxcbiAgICAgICAgQHNob3coKSxcbiAgICAgICAgQGZvY3VzKClcbiAgICAgIF1cbiAgICAgIHN0ZXBzLnB1c2goQHNldEZ1bGxTY3JlZW4odHJ1ZSkpIGlmIEB3aW5kb3dEaW1lbnNpb25zPy5mdWxsU2NyZWVuXG4gICAgICBzdGVwcy5wdXNoKEBtYXhpbWl6ZSgpKSBpZiBAd2luZG93RGltZW5zaW9ucz8ubWF4aW1pemVkIGFuZCBwcm9jZXNzLnBsYXRmb3JtIGlzbnQgJ2RhcndpbidcbiAgICAgIFByb21pc2UuYWxsKHN0ZXBzKVxuXG4gICMgR2V0IHRoZSBkaW1lbnNpb25zIG9mIHRoaXMgd2luZG93LlxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYHhgICAgICAgVGhlIHdpbmRvdydzIHgtcG9zaXRpb24ge051bWJlcn0uXG4gICMgICAqIGB5YCAgICAgIFRoZSB3aW5kb3cncyB5LXBvc2l0aW9uIHtOdW1iZXJ9LlxuICAjICAgKiBgd2lkdGhgICBUaGUgd2luZG93J3Mgd2lkdGgge051bWJlcn0uXG4gICMgICAqIGBoZWlnaHRgIFRoZSB3aW5kb3cncyBoZWlnaHQge051bWJlcn0uXG4gIGdldFdpbmRvd0RpbWVuc2lvbnM6IC0+XG4gICAgYnJvd3NlcldpbmRvdyA9IEBnZXRDdXJyZW50V2luZG93KClcbiAgICBbeCwgeV0gPSBicm93c2VyV2luZG93LmdldFBvc2l0aW9uKClcbiAgICBbd2lkdGgsIGhlaWdodF0gPSBicm93c2VyV2luZG93LmdldFNpemUoKVxuICAgIG1heGltaXplZCA9IGJyb3dzZXJXaW5kb3cuaXNNYXhpbWl6ZWQoKVxuICAgIHt4LCB5LCB3aWR0aCwgaGVpZ2h0LCBtYXhpbWl6ZWR9XG5cbiAgIyBTZXQgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIHdpbmRvdy5cbiAgI1xuICAjIFRoZSB3aW5kb3cgd2lsbCBiZSBjZW50ZXJlZCBpZiBlaXRoZXIgdGhlIHggb3IgeSBjb29yZGluYXRlIGlzIG5vdCBzZXRcbiAgIyBpbiB0aGUgZGltZW5zaW9ucyBwYXJhbWV0ZXIuIElmIHggb3IgeSBhcmUgb21pdHRlZCB0aGUgd2luZG93IHdpbGwgYmVcbiAgIyBjZW50ZXJlZC4gSWYgaGVpZ2h0IG9yIHdpZHRoIGFyZSBvbWl0dGVkIG9ubHkgdGhlIHBvc2l0aW9uIHdpbGwgYmUgY2hhbmdlZC5cbiAgI1xuICAjICogYGRpbWVuc2lvbnNgIEFuIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgeGAgVGhlIG5ldyB4IGNvb3JkaW5hdGUuXG4gICMgICAqIGB5YCBUaGUgbmV3IHkgY29vcmRpbmF0ZS5cbiAgIyAgICogYHdpZHRoYCBUaGUgbmV3IHdpZHRoLlxuICAjICAgKiBgaGVpZ2h0YCBUaGUgbmV3IGhlaWdodC5cbiAgc2V0V2luZG93RGltZW5zaW9uczogKHt4LCB5LCB3aWR0aCwgaGVpZ2h0fSkgLT5cbiAgICBzdGVwcyA9IFtdXG4gICAgaWYgd2lkdGg/IGFuZCBoZWlnaHQ/XG4gICAgICBzdGVwcy5wdXNoKEBzZXRTaXplKHdpZHRoLCBoZWlnaHQpKVxuICAgIGlmIHg/IGFuZCB5P1xuICAgICAgc3RlcHMucHVzaChAc2V0UG9zaXRpb24oeCwgeSkpXG4gICAgZWxzZVxuICAgICAgc3RlcHMucHVzaChAY2VudGVyKCkpXG4gICAgUHJvbWlzZS5hbGwoc3RlcHMpXG5cbiAgIyBSZXR1cm5zIHRydWUgaWYgdGhlIGRpbWVuc2lvbnMgYXJlIHVzZWFibGUsIGZhbHNlIGlmIHRoZXkgc2hvdWxkIGJlIGlnbm9yZWQuXG4gICMgV29yayBhcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20tc2hlbGwvaXNzdWVzLzQ3M1xuICBpc1ZhbGlkRGltZW5zaW9uczogKHt4LCB5LCB3aWR0aCwgaGVpZ2h0fT17fSkgLT5cbiAgICB3aWR0aCA+IDAgYW5kIGhlaWdodCA+IDAgYW5kIHggKyB3aWR0aCA+IDAgYW5kIHkgKyBoZWlnaHQgPiAwXG5cbiAgc3RvcmVXaW5kb3dEaW1lbnNpb25zOiAtPlxuICAgIEB3aW5kb3dEaW1lbnNpb25zID0gQGdldFdpbmRvd0RpbWVuc2lvbnMoKVxuICAgIGlmIEBpc1ZhbGlkRGltZW5zaW9ucyhAd2luZG93RGltZW5zaW9ucylcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZGVmYXVsdFdpbmRvd0RpbWVuc2lvbnNcIiwgSlNPTi5zdHJpbmdpZnkoQHdpbmRvd0RpbWVuc2lvbnMpKVxuXG4gIGdldERlZmF1bHRXaW5kb3dEaW1lbnNpb25zOiAtPlxuICAgIHt3aW5kb3dEaW1lbnNpb25zfSA9IEBnZXRMb2FkU2V0dGluZ3MoKVxuICAgIHJldHVybiB3aW5kb3dEaW1lbnNpb25zIGlmIHdpbmRvd0RpbWVuc2lvbnM/XG5cbiAgICBkaW1lbnNpb25zID0gbnVsbFxuICAgIHRyeVxuICAgICAgZGltZW5zaW9ucyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkZWZhdWx0V2luZG93RGltZW5zaW9uc1wiKSlcbiAgICBjYXRjaCBlcnJvclxuICAgICAgY29uc29sZS53YXJuIFwiRXJyb3IgcGFyc2luZyBkZWZhdWx0IHdpbmRvdyBkaW1lbnNpb25zXCIsIGVycm9yXG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcImRlZmF1bHRXaW5kb3dEaW1lbnNpb25zXCIpXG5cbiAgICBpZiBAaXNWYWxpZERpbWVuc2lvbnMoZGltZW5zaW9ucylcbiAgICAgIGRpbWVuc2lvbnNcbiAgICBlbHNlXG4gICAgICB7d2lkdGgsIGhlaWdodH0gPSBAYXBwbGljYXRpb25EZWxlZ2F0ZS5nZXRQcmltYXJ5RGlzcGxheVdvcmtBcmVhU2l6ZSgpXG4gICAgICB7eDogMCwgeTogMCwgd2lkdGg6IE1hdGgubWluKDEwMjQsIHdpZHRoKSwgaGVpZ2h0fVxuXG4gIHJlc3RvcmVXaW5kb3dEaW1lbnNpb25zOiAtPlxuICAgIHVubGVzcyBAd2luZG93RGltZW5zaW9ucz8gYW5kIEBpc1ZhbGlkRGltZW5zaW9ucyhAd2luZG93RGltZW5zaW9ucylcbiAgICAgIEB3aW5kb3dEaW1lbnNpb25zID0gQGdldERlZmF1bHRXaW5kb3dEaW1lbnNpb25zKClcbiAgICBAc2V0V2luZG93RGltZW5zaW9ucyhAd2luZG93RGltZW5zaW9ucykudGhlbiA9PiBAd2luZG93RGltZW5zaW9uc1xuXG4gIHJlc3RvcmVXaW5kb3dCYWNrZ3JvdW5kOiAtPlxuICAgIGlmIGJhY2tncm91bmRDb2xvciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXRvbTp3aW5kb3ctYmFja2dyb3VuZC1jb2xvcicpXG4gICAgICBAYmFja2dyb3VuZFN0eWxlc2hlZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICBAYmFja2dyb3VuZFN0eWxlc2hlZXQudHlwZSA9ICd0ZXh0L2NzcydcbiAgICAgIEBiYWNrZ3JvdW5kU3R5bGVzaGVldC5pbm5lclRleHQgPSAnaHRtbCwgYm9keSB7IGJhY2tncm91bmQ6ICcgKyBiYWNrZ3JvdW5kQ29sb3IgKyAnICFpbXBvcnRhbnQ7IH0nXG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKEBiYWNrZ3JvdW5kU3R5bGVzaGVldClcblxuICBzdG9yZVdpbmRvd0JhY2tncm91bmQ6IC0+XG4gICAgcmV0dXJuIGlmIEBpblNwZWNNb2RlKClcblxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBAdmlld3MuZ2V0VmlldyhAd29ya3NwYWNlKVxuICAgIGJhY2tncm91bmRDb2xvciA9IEB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh3b3Jrc3BhY2VFbGVtZW50KVsnYmFja2dyb3VuZC1jb2xvciddXG4gICAgQHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXRvbTp3aW5kb3ctYmFja2dyb3VuZC1jb2xvcicsIGJhY2tncm91bmRDb2xvcilcblxuICAjIENhbGwgdGhpcyBtZXRob2Qgd2hlbiBlc3RhYmxpc2hpbmcgYSByZWFsIGFwcGxpY2F0aW9uIHdpbmRvdy5cbiAgc3RhcnRFZGl0b3JXaW5kb3c6IC0+XG4gICAgQHVubG9hZGVkID0gZmFsc2VcbiAgICB1cGRhdGVQcm9jZXNzRW52UHJvbWlzZSA9IHVwZGF0ZVByb2Nlc3NFbnYoQGdldExvYWRTZXR0aW5ncygpLmVudilcbiAgICB1cGRhdGVQcm9jZXNzRW52UHJvbWlzZS50aGVuID0+XG4gICAgICBAcGFja2FnZXMudHJpZ2dlckFjdGl2YXRpb25Ib29rKCdjb3JlOmxvYWRlZC1zaGVsbC1lbnZpcm9ubWVudCcpXG5cbiAgICBsb2FkU3RhdGVQcm9taXNlID0gQGxvYWRTdGF0ZSgpLnRoZW4gKHN0YXRlKSA9PlxuICAgICAgQHdpbmRvd0RpbWVuc2lvbnMgPSBzdGF0ZT8ud2luZG93RGltZW5zaW9uc1xuICAgICAgQGRpc3BsYXlXaW5kb3coKS50aGVuID0+XG4gICAgICAgIEBjb21tYW5kSW5zdGFsbGVyLmluc3RhbGxBdG9tQ29tbWFuZCBmYWxzZSwgKGVycm9yKSAtPlxuICAgICAgICAgIGNvbnNvbGUud2FybiBlcnJvci5tZXNzYWdlIGlmIGVycm9yP1xuICAgICAgICBAY29tbWFuZEluc3RhbGxlci5pbnN0YWxsQXBtQ29tbWFuZCBmYWxzZSwgKGVycm9yKSAtPlxuICAgICAgICAgIGNvbnNvbGUud2FybiBlcnJvci5tZXNzYWdlIGlmIGVycm9yP1xuXG4gICAgICAgIEBkaXNwb3NhYmxlcy5hZGQoQGFwcGxpY2F0aW9uRGVsZWdhdGUub25EaWRPcGVuTG9jYXRpb25zKEBvcGVuTG9jYXRpb25zLmJpbmQodGhpcykpKVxuICAgICAgICBAZGlzcG9zYWJsZXMuYWRkKEBhcHBsaWNhdGlvbkRlbGVnYXRlLm9uQXBwbGljYXRpb25NZW51Q29tbWFuZChAZGlzcGF0Y2hBcHBsaWNhdGlvbk1lbnVDb21tYW5kLmJpbmQodGhpcykpKVxuICAgICAgICBAZGlzcG9zYWJsZXMuYWRkKEBhcHBsaWNhdGlvbkRlbGVnYXRlLm9uQ29udGV4dE1lbnVDb21tYW5kKEBkaXNwYXRjaENvbnRleHRNZW51Q29tbWFuZC5iaW5kKHRoaXMpKSlcbiAgICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAYXBwbGljYXRpb25EZWxlZ2F0ZS5vblNhdmVXaW5kb3dTdGF0ZVJlcXVlc3QgPT5cbiAgICAgICAgICBjYWxsYmFjayA9ID0+IEBhcHBsaWNhdGlvbkRlbGVnYXRlLmRpZFNhdmVXaW5kb3dTdGF0ZSgpXG4gICAgICAgICAgQHNhdmVTdGF0ZSh7aXNVbmxvYWRpbmc6IHRydWV9KS5jYXRjaChjYWxsYmFjaykudGhlbihjYWxsYmFjaylcblxuICAgICAgICBAbGlzdGVuRm9yVXBkYXRlcygpXG5cbiAgICAgICAgQHJlZ2lzdGVyRGVmYXVsdFRhcmdldEZvcktleW1hcHMoKVxuXG4gICAgICAgIEBwYWNrYWdlcy5sb2FkUGFja2FnZXMoKVxuXG4gICAgICAgIHN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICAgICAgQGRlc2VyaWFsaXplKHN0YXRlKSBpZiBzdGF0ZT9cbiAgICAgICAgQGRlc2VyaWFsaXplVGltaW5ncy5hdG9tID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuXG4gICAgICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbicgYW5kIEBjb25maWcuZ2V0KCdjb3JlLnVzZUN1c3RvbVRpdGxlQmFyJylcbiAgICAgICAgICBAd29ya3NwYWNlLmFkZEhlYWRlclBhbmVsKHtpdGVtOiBuZXcgVGl0bGVCYXIoe0B3b3Jrc3BhY2UsIEB0aGVtZXMsIEBhcHBsaWNhdGlvbkRlbGVnYXRlfSl9KVxuXG4gICAgICAgIEBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKEB2aWV3cy5nZXRWaWV3KEB3b3Jrc3BhY2UpKVxuICAgICAgICBAYmFja2dyb3VuZFN0eWxlc2hlZXQ/LnJlbW92ZSgpXG5cbiAgICAgICAgQHdhdGNoUHJvamVjdFBhdGhzKClcblxuICAgICAgICBAcGFja2FnZXMuYWN0aXZhdGUoKVxuICAgICAgICBAa2V5bWFwcy5sb2FkVXNlcktleW1hcCgpXG4gICAgICAgIEByZXF1aXJlVXNlckluaXRTY3JpcHQoKSB1bmxlc3MgQGdldExvYWRTZXR0aW5ncygpLnNhZmVNb2RlXG5cbiAgICAgICAgQG1lbnUudXBkYXRlKClcblxuICAgICAgICBAb3BlbkluaXRpYWxFbXB0eUVkaXRvcklmTmVjZXNzYXJ5KClcblxuICAgIFByb21pc2UuYWxsKFtsb2FkU3RhdGVQcm9taXNlLCB1cGRhdGVQcm9jZXNzRW52UHJvbWlzZV0pXG5cbiAgc2VyaWFsaXplOiAob3B0aW9ucykgLT5cbiAgICB2ZXJzaW9uOiBAY29uc3RydWN0b3IudmVyc2lvblxuICAgIHByb2plY3Q6IEBwcm9qZWN0LnNlcmlhbGl6ZShvcHRpb25zKVxuICAgIHdvcmtzcGFjZTogQHdvcmtzcGFjZS5zZXJpYWxpemUoKVxuICAgIHBhY2thZ2VTdGF0ZXM6IEBwYWNrYWdlcy5zZXJpYWxpemUoKVxuICAgIGdyYW1tYXJzOiB7Z3JhbW1hck92ZXJyaWRlc0J5UGF0aDogQGdyYW1tYXJzLmdyYW1tYXJPdmVycmlkZXNCeVBhdGh9XG4gICAgZnVsbFNjcmVlbjogQGlzRnVsbFNjcmVlbigpXG4gICAgd2luZG93RGltZW5zaW9uczogQHdpbmRvd0RpbWVuc2lvbnNcbiAgICB0ZXh0RWRpdG9yczogQHRleHRFZGl0b3JzLnNlcmlhbGl6ZSgpXG5cbiAgdW5sb2FkRWRpdG9yV2luZG93OiAtPlxuICAgIHJldHVybiBpZiBub3QgQHByb2plY3RcblxuICAgIEBzdG9yZVdpbmRvd0JhY2tncm91bmQoKVxuICAgIEBwYWNrYWdlcy5kZWFjdGl2YXRlUGFja2FnZXMoKVxuICAgIEBzYXZlQmxvYlN0b3JlU3luYygpXG4gICAgQHVubG9hZGVkID0gdHJ1ZVxuXG4gIG9wZW5Jbml0aWFsRW1wdHlFZGl0b3JJZk5lY2Vzc2FyeTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBjb25maWcuZ2V0KCdjb3JlLm9wZW5FbXB0eUVkaXRvck9uU3RhcnQnKVxuICAgIGlmIEBnZXRMb2FkU2V0dGluZ3MoKS5pbml0aWFsUGF0aHM/Lmxlbmd0aCBpcyAwIGFuZCBAd29ya3NwYWNlLmdldFBhbmVJdGVtcygpLmxlbmd0aCBpcyAwXG4gICAgICBAd29ya3NwYWNlLm9wZW4obnVsbClcblxuICBpbnN0YWxsVW5jYXVnaHRFcnJvckhhbmRsZXI6IC0+XG4gICAgQHByZXZpb3VzV2luZG93RXJyb3JIYW5kbGVyID0gQHdpbmRvdy5vbmVycm9yXG4gICAgQHdpbmRvdy5vbmVycm9yID0gPT5cbiAgICAgIEBsYXN0VW5jYXVnaHRFcnJvciA9IEFycmF5OjpzbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgIFttZXNzYWdlLCB1cmwsIGxpbmUsIGNvbHVtbiwgb3JpZ2luYWxFcnJvcl0gPSBAbGFzdFVuY2F1Z2h0RXJyb3JcblxuICAgICAge2xpbmUsIGNvbHVtbn0gPSBtYXBTb3VyY2VQb3NpdGlvbih7c291cmNlOiB1cmwsIGxpbmUsIGNvbHVtbn0pXG5cbiAgICAgIGV2ZW50T2JqZWN0ID0ge21lc3NhZ2UsIHVybCwgbGluZSwgY29sdW1uLCBvcmlnaW5hbEVycm9yfVxuXG4gICAgICBvcGVuRGV2VG9vbHMgPSB0cnVlXG4gICAgICBldmVudE9iamVjdC5wcmV2ZW50RGVmYXVsdCA9IC0+IG9wZW5EZXZUb29scyA9IGZhbHNlXG5cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ3dpbGwtdGhyb3ctZXJyb3InLCBldmVudE9iamVjdFxuXG4gICAgICBpZiBvcGVuRGV2VG9vbHNcbiAgICAgICAgQG9wZW5EZXZUb29scygpLnRoZW4gPT4gQGV4ZWN1dGVKYXZhU2NyaXB0SW5EZXZUb29scygnRGV2VG9vbHNBUEkuc2hvd1BhbmVsKFwiY29uc29sZVwiKScpXG5cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC10aHJvdy1lcnJvcicsIHttZXNzYWdlLCB1cmwsIGxpbmUsIGNvbHVtbiwgb3JpZ2luYWxFcnJvcn1cblxuICB1bmluc3RhbGxVbmNhdWdodEVycm9ySGFuZGxlcjogLT5cbiAgICBAd2luZG93Lm9uZXJyb3IgPSBAcHJldmlvdXNXaW5kb3dFcnJvckhhbmRsZXJcblxuICBpbnN0YWxsV2luZG93RXZlbnRIYW5kbGVyOiAtPlxuICAgIEB3aW5kb3dFdmVudEhhbmRsZXIgPSBuZXcgV2luZG93RXZlbnRIYW5kbGVyKHthdG9tRW52aXJvbm1lbnQ6IHRoaXMsIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCBAd2luZG93LCBAZG9jdW1lbnR9KVxuXG4gIHVuaW5zdGFsbFdpbmRvd0V2ZW50SGFuZGxlcjogLT5cbiAgICBAd2luZG93RXZlbnRIYW5kbGVyPy51bnN1YnNjcmliZSgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1lc3NhZ2luZyB0aGUgVXNlclxuICAjIyNcblxuICAjIEVzc2VudGlhbDogVmlzdWFsbHkgYW5kIGF1ZGlibHkgdHJpZ2dlciBhIGJlZXAuXG4gIGJlZXA6IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUucGxheUJlZXBTb3VuZCgpIGlmIEBjb25maWcuZ2V0KCdjb3JlLmF1ZGlvQmVlcCcpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWJlZXAnXG5cbiAgIyBFc3NlbnRpYWw6IEEgZmxleGlibGUgd2F5IHRvIG9wZW4gYSBkaWFsb2cgYWtpbiB0byBhbiBhbGVydCBkaWFsb2cuXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjXG4gICMgYGBgY29mZmVlXG4gICMgYXRvbS5jb25maXJtXG4gICMgICBtZXNzYWdlOiAnSG93IHlvdSBmZWVsaW5nPydcbiAgIyAgIGRldGFpbGVkTWVzc2FnZTogJ0JlIGhvbmVzdC4nXG4gICMgICBidXR0b25zOlxuICAjICAgICBHb29kOiAtPiB3aW5kb3cuYWxlcnQoJ2dvb2QgdG8gaGVhcicpXG4gICMgICAgIEJhZDogLT4gd2luZG93LmFsZXJ0KCdidW1tZXInKVxuICAjIGBgYFxuICAjXG4gICMgKiBgb3B0aW9uc2AgQW4ge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAqIGBtZXNzYWdlYCBUaGUge1N0cmluZ30gbWVzc2FnZSB0byBkaXNwbGF5LlxuICAjICAgKiBgZGV0YWlsZWRNZXNzYWdlYCAob3B0aW9uYWwpIFRoZSB7U3RyaW5nfSBkZXRhaWxlZCBtZXNzYWdlIHRvIGRpc3BsYXkuXG4gICMgICAqIGBidXR0b25zYCAob3B0aW9uYWwpIEVpdGhlciBhbiBhcnJheSBvZiBzdHJpbmdzIG9yIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZVxuICAjICAgICBidXR0b24gbmFtZXMgYW5kIHRoZSB2YWx1ZXMgYXJlIGNhbGxiYWNrcyB0byBpbnZva2Ugd2hlbiBjbGlja2VkLlxuICAjXG4gICMgUmV0dXJucyB0aGUgY2hvc2VuIGJ1dHRvbiBpbmRleCB7TnVtYmVyfSBpZiB0aGUgYnV0dG9ucyBvcHRpb24gd2FzIGFuIGFycmF5LlxuICBjb25maXJtOiAocGFyYW1zPXt9KSAtPlxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLmNvbmZpcm0ocGFyYW1zKVxuXG4gICMjI1xuICBTZWN0aW9uOiBNYW5hZ2luZyB0aGUgRGV2IFRvb2xzXG4gICMjI1xuXG4gICMgRXh0ZW5kZWQ6IE9wZW4gdGhlIGRldiB0b29scyBmb3IgdGhlIGN1cnJlbnQgd2luZG93LlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIERldlRvb2xzIGhhdmUgYmVlbiBvcGVuZWQuXG4gIG9wZW5EZXZUb29sczogLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5vcGVuV2luZG93RGV2VG9vbHMoKVxuXG4gICMgRXh0ZW5kZWQ6IFRvZ2dsZSB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgZGV2IHRvb2xzIGZvciB0aGUgY3VycmVudCB3aW5kb3cuXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgRGV2VG9vbHMgaGF2ZSBiZWVuIG9wZW5lZCBvclxuICAjIGNsb3NlZC5cbiAgdG9nZ2xlRGV2VG9vbHM6IC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUudG9nZ2xlV2luZG93RGV2VG9vbHMoKVxuXG4gICMgRXh0ZW5kZWQ6IEV4ZWN1dGUgY29kZSBpbiBkZXYgdG9vbHMuXG4gIGV4ZWN1dGVKYXZhU2NyaXB0SW5EZXZUb29sczogKGNvZGUpIC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuZXhlY3V0ZUphdmFTY3JpcHRJbldpbmRvd0RldlRvb2xzKGNvZGUpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGVcbiAgIyMjXG5cbiAgYXNzZXJ0OiAoY29uZGl0aW9uLCBtZXNzYWdlLCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gdHJ1ZSBpZiBjb25kaXRpb25cblxuICAgIGVycm9yID0gbmV3IEVycm9yKFwiQXNzZXJ0aW9uIGZhaWxlZDogI3ttZXNzYWdlfVwiKVxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycm9yLCBAYXNzZXJ0KVxuICAgIGNhbGxiYWNrPyhlcnJvcilcblxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1mYWlsLWFzc2VydGlvbicsIGVycm9yXG5cbiAgICBmYWxzZVxuXG4gIGxvYWRUaGVtZXM6IC0+XG4gICAgQHRoZW1lcy5sb2FkKClcblxuICAjIE5vdGlmeSB0aGUgYnJvd3NlciBwcm9qZWN0IG9mIHRoZSB3aW5kb3cncyBjdXJyZW50IHByb2plY3QgcGF0aFxuICB3YXRjaFByb2plY3RQYXRoczogLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBwcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMgPT5cbiAgICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFJlcHJlc2VudGVkRGlyZWN0b3J5UGF0aHMoQHByb2plY3QuZ2V0UGF0aHMoKSlcblxuICBzZXREb2N1bWVudEVkaXRlZDogKGVkaXRlZCkgLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zZXRXaW5kb3dEb2N1bWVudEVkaXRlZD8oZWRpdGVkKVxuXG4gIHNldFJlcHJlc2VudGVkRmlsZW5hbWU6IChmaWxlbmFtZSkgLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zZXRXaW5kb3dSZXByZXNlbnRlZEZpbGVuYW1lPyhmaWxlbmFtZSlcblxuICBhZGRQcm9qZWN0Rm9sZGVyOiAtPlxuICAgIEBwaWNrRm9sZGVyIChzZWxlY3RlZFBhdGhzID0gW10pID0+XG4gICAgICBAcHJvamVjdC5hZGRQYXRoKHNlbGVjdGVkUGF0aCkgZm9yIHNlbGVjdGVkUGF0aCBpbiBzZWxlY3RlZFBhdGhzXG5cbiAgc2hvd1NhdmVEaWFsb2c6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhAc2hvd1NhdmVEaWFsb2dTeW5jKCkpXG5cbiAgc2hvd1NhdmVEaWFsb2dTeW5jOiAob3B0aW9ucz17fSkgLT5cbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zaG93U2F2ZURpYWxvZyhvcHRpb25zKVxuXG4gIHNhdmVCbG9iU3RvcmVTeW5jOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGVuYWJsZVBlcnNpc3RlbmNlXG5cbiAgICBAYmxvYlN0b3JlLnNhdmUoKVxuXG4gIHNhdmVTdGF0ZTogKG9wdGlvbnMpIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIGlmIEBlbmFibGVQZXJzaXN0ZW5jZSBhbmQgQHByb2plY3RcbiAgICAgICAgc3RhdGUgPSBAc2VyaWFsaXplKG9wdGlvbnMpXG4gICAgICAgIHNhdmVQcm9taXNlID1cbiAgICAgICAgICBpZiBzdG9yYWdlS2V5ID0gQGdldFN0YXRlS2V5KEBwcm9qZWN0Py5nZXRQYXRocygpKVxuICAgICAgICAgICAgQHN0YXRlU3RvcmUuc2F2ZShzdG9yYWdlS2V5LCBzdGF0ZSlcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zZXRUZW1wb3JhcnlXaW5kb3dTdGF0ZShzdGF0ZSlcbiAgICAgICAgc2F2ZVByb21pc2UuY2F0Y2gocmVqZWN0KS50aGVuKHJlc29sdmUpXG4gICAgICBlbHNlXG4gICAgICAgIHJlc29sdmUoKVxuXG4gIGxvYWRTdGF0ZTogLT5cbiAgICBpZiBAZW5hYmxlUGVyc2lzdGVuY2VcbiAgICAgIGlmIHN0YXRlS2V5ID0gQGdldFN0YXRlS2V5KEBnZXRMb2FkU2V0dGluZ3MoKS5pbml0aWFsUGF0aHMpXG4gICAgICAgIEBzdGF0ZVN0b3JlLmxvYWQoc3RhdGVLZXkpLnRoZW4gKHN0YXRlKSA9PlxuICAgICAgICAgIGlmIHN0YXRlXG4gICAgICAgICAgICBzdGF0ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgVE9ETzogcmVtb3ZlIHRoaXMgd2hlbiBldmVyeSB1c2VyIGhhcyBtaWdyYXRlZCB0byB0aGUgSW5kZXhlZERiIHN0YXRlIHN0b3JlLlxuICAgICAgICAgICAgQGdldFN0b3JhZ2VGb2xkZXIoKS5sb2FkKHN0YXRlS2V5KVxuICAgICAgZWxzZVxuICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5nZXRUZW1wb3JhcnlXaW5kb3dTdGF0ZSgpXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgZGVzZXJpYWxpemU6IChzdGF0ZSkgLT5cbiAgICBpZiBncmFtbWFyT3ZlcnJpZGVzQnlQYXRoID0gc3RhdGUuZ3JhbW1hcnM/LmdyYW1tYXJPdmVycmlkZXNCeVBhdGhcbiAgICAgIEBncmFtbWFycy5ncmFtbWFyT3ZlcnJpZGVzQnlQYXRoID0gZ3JhbW1hck92ZXJyaWRlc0J5UGF0aFxuXG4gICAgQHNldEZ1bGxTY3JlZW4oc3RhdGUuZnVsbFNjcmVlbilcblxuICAgIEBwYWNrYWdlcy5wYWNrYWdlU3RhdGVzID0gc3RhdGUucGFja2FnZVN0YXRlcyA/IHt9XG5cbiAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgQHByb2plY3QuZGVzZXJpYWxpemUoc3RhdGUucHJvamVjdCwgQGRlc2VyaWFsaXplcnMpIGlmIHN0YXRlLnByb2plY3Q/XG4gICAgQGRlc2VyaWFsaXplVGltaW5ncy5wcm9qZWN0ID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuXG4gICAgQHRleHRFZGl0b3JzLmRlc2VyaWFsaXplKHN0YXRlLnRleHRFZGl0b3JzKSBpZiBzdGF0ZS50ZXh0RWRpdG9yc1xuXG4gICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuICAgIEB3b3Jrc3BhY2UuZGVzZXJpYWxpemUoc3RhdGUud29ya3NwYWNlLCBAZGVzZXJpYWxpemVycykgaWYgc3RhdGUud29ya3NwYWNlP1xuICAgIEBkZXNlcmlhbGl6ZVRpbWluZ3Mud29ya3NwYWNlID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuXG4gIGdldFN0YXRlS2V5OiAocGF0aHMpIC0+XG4gICAgaWYgcGF0aHM/Lmxlbmd0aCA+IDBcbiAgICAgIHNoYTEgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpLnVwZGF0ZShwYXRocy5zbGljZSgpLnNvcnQoKS5qb2luKFwiXFxuXCIpKS5kaWdlc3QoJ2hleCcpXG4gICAgICBcImVkaXRvci0je3NoYTF9XCJcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgZ2V0U3RvcmFnZUZvbGRlcjogLT5cbiAgICBAc3RvcmFnZUZvbGRlciA/PSBuZXcgU3RvcmFnZUZvbGRlcihAZ2V0Q29uZmlnRGlyUGF0aCgpKVxuXG4gIGdldENvbmZpZ0RpclBhdGg6IC0+XG4gICAgQGNvbmZpZ0RpclBhdGggPz0gcHJvY2Vzcy5lbnYuQVRPTV9IT01FXG5cbiAgZ2V0VXNlckluaXRTY3JpcHRQYXRoOiAtPlxuICAgIGluaXRTY3JpcHRQYXRoID0gZnMucmVzb2x2ZShAZ2V0Q29uZmlnRGlyUGF0aCgpLCAnaW5pdCcsIFsnanMnLCAnY29mZmVlJ10pXG4gICAgaW5pdFNjcmlwdFBhdGggPyBwYXRoLmpvaW4oQGdldENvbmZpZ0RpclBhdGgoKSwgJ2luaXQuY29mZmVlJylcblxuICByZXF1aXJlVXNlckluaXRTY3JpcHQ6IC0+XG4gICAgaWYgdXNlckluaXRTY3JpcHRQYXRoID0gQGdldFVzZXJJbml0U2NyaXB0UGF0aCgpXG4gICAgICB0cnlcbiAgICAgICAgcmVxdWlyZSh1c2VySW5pdFNjcmlwdFBhdGgpIGlmIGZzLmlzRmlsZVN5bmModXNlckluaXRTY3JpcHRQYXRoKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgQG5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJGYWlsZWQgdG8gbG9hZCBgI3t1c2VySW5pdFNjcmlwdFBhdGh9YFwiLFxuICAgICAgICAgIGRldGFpbDogZXJyb3IubWVzc2FnZVxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG5cbiAgIyBUT0RPOiBXZSBzaG91bGQgZGVwcmVjYXRlIHRoZSB1cGRhdGUgZXZlbnRzIGhlcmUsIGFuZCB1c2UgYGF0b20uYXV0b1VwZGF0ZXJgIGluc3RlYWRcbiAgb25VcGRhdGVBdmFpbGFibGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAndXBkYXRlLWF2YWlsYWJsZScsIGNhbGxiYWNrXG5cbiAgdXBkYXRlQXZhaWxhYmxlOiAoZGV0YWlscykgLT5cbiAgICBAZW1pdHRlci5lbWl0ICd1cGRhdGUtYXZhaWxhYmxlJywgZGV0YWlsc1xuXG4gIGxpc3RlbkZvclVwZGF0ZXM6IC0+XG4gICAgIyBsaXN0ZW4gZm9yIHVwZGF0ZXMgYXZhaWxhYmxlIGxvY2FsbHkgKHRoYXQgaGF2ZSBiZWVuIHN1Y2Nlc3NmdWxseSBkb3dubG9hZGVkKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQoQGF1dG9VcGRhdGVyLm9uRGlkQ29tcGxldGVEb3dubG9hZGluZ1VwZGF0ZShAdXBkYXRlQXZhaWxhYmxlLmJpbmQodGhpcykpKVxuXG4gIHNldEJvZHlQbGF0Zm9ybUNsYXNzOiAtPlxuICAgIEBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJwbGF0Zm9ybS0je3Byb2Nlc3MucGxhdGZvcm19XCIpXG5cbiAgc2V0QXV0b0hpZGVNZW51QmFyOiAoYXV0b0hpZGUpIC0+XG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuc2V0QXV0b0hpZGVXaW5kb3dNZW51QmFyKGF1dG9IaWRlKVxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd01lbnVCYXJWaXNpYmlsaXR5KG5vdCBhdXRvSGlkZSlcblxuICBkaXNwYXRjaEFwcGxpY2F0aW9uTWVudUNvbW1hbmQ6IChjb21tYW5kLCBhcmcpIC0+XG4gICAgYWN0aXZlRWxlbWVudCA9IEBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgIyBVc2UgdGhlIHdvcmtzcGFjZSBlbGVtZW50IGlmIGJvZHkgaGFzIGZvY3VzXG4gICAgaWYgYWN0aXZlRWxlbWVudCBpcyBAZG9jdW1lbnQuYm9keSBhbmQgd29ya3NwYWNlRWxlbWVudCA9IEB2aWV3cy5nZXRWaWV3KEB3b3Jrc3BhY2UpXG4gICAgICBhY3RpdmVFbGVtZW50ID0gd29ya3NwYWNlRWxlbWVudFxuICAgIEBjb21tYW5kcy5kaXNwYXRjaChhY3RpdmVFbGVtZW50LCBjb21tYW5kLCBhcmcpXG5cbiAgZGlzcGF0Y2hDb250ZXh0TWVudUNvbW1hbmQ6IChjb21tYW5kLCBhcmdzLi4uKSAtPlxuICAgIEBjb21tYW5kcy5kaXNwYXRjaChAY29udGV4dE1lbnUuYWN0aXZlRWxlbWVudCwgY29tbWFuZCwgYXJncylcblxuICBvcGVuTG9jYXRpb25zOiAobG9jYXRpb25zKSAtPlxuICAgIG5lZWRzUHJvamVjdFBhdGhzID0gQHByb2plY3Q/LmdldFBhdGhzKCkubGVuZ3RoIGlzIDBcblxuICAgIGZvciB7cGF0aFRvT3BlbiwgaW5pdGlhbExpbmUsIGluaXRpYWxDb2x1bW4sIGZvcmNlQWRkVG9XaW5kb3d9IGluIGxvY2F0aW9uc1xuICAgICAgaWYgcGF0aFRvT3Blbj8gYW5kIChuZWVkc1Byb2plY3RQYXRocyBvciBmb3JjZUFkZFRvV2luZG93KVxuICAgICAgICBpZiBmcy5leGlzdHNTeW5jKHBhdGhUb09wZW4pXG4gICAgICAgICAgQHByb2plY3QuYWRkUGF0aChwYXRoVG9PcGVuKVxuICAgICAgICBlbHNlIGlmIGZzLmV4aXN0c1N5bmMocGF0aC5kaXJuYW1lKHBhdGhUb09wZW4pKVxuICAgICAgICAgIEBwcm9qZWN0LmFkZFBhdGgocGF0aC5kaXJuYW1lKHBhdGhUb09wZW4pKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHByb2plY3QuYWRkUGF0aChwYXRoVG9PcGVuKVxuXG4gICAgICB1bmxlc3MgZnMuaXNEaXJlY3RvcnlTeW5jKHBhdGhUb09wZW4pXG4gICAgICAgIEB3b3Jrc3BhY2U/Lm9wZW4ocGF0aFRvT3Blbiwge2luaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1ufSlcblxuICAgIHJldHVyblxuXG4jIFByZXNlcnZlIHRoaXMgZGVwcmVjYXRpb24gdW50aWwgMi4wLiBTb3JyeS4gU2hvdWxkIGhhdmUgcmVtb3ZlZCBRIHNvb25lci5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSAoY2FsbGJhY2spIC0+XG4gIGRlcHJlY2F0ZShcIkF0b20gbm93IHVzZXMgRVM2IFByb21pc2VzIGluc3RlYWQgb2YgUS4gQ2FsbCBwcm9taXNlLnRoZW4gaW5zdGVhZCBvZiBwcm9taXNlLmRvbmVcIilcbiAgQHRoZW4oY2FsbGJhY2spXG4iXX0=
