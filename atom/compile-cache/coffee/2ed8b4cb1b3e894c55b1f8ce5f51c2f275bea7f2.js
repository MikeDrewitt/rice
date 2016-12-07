(function() {
  var BufferedProcess, CSON, CompileCache, CompositeDisposable, Emitter, ModuleCache, Package, ScopedProperties, _, async, fs, path, ref,
    slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  async = require('async');

  CSON = require('season');

  fs = require('fs-plus');

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  CompileCache = require('./compile-cache');

  ModuleCache = require('./module-cache');

  ScopedProperties = require('./scoped-properties');

  BufferedProcess = require('./buffered-process');

  module.exports = Package = (function() {
    Package.prototype.keymaps = null;

    Package.prototype.menus = null;

    Package.prototype.stylesheets = null;

    Package.prototype.stylesheetDisposables = null;

    Package.prototype.grammars = null;

    Package.prototype.settings = null;

    Package.prototype.mainModulePath = null;

    Package.prototype.resolvedMainModulePath = false;

    Package.prototype.mainModule = null;

    Package.prototype.mainInitialized = false;

    Package.prototype.mainActivated = false;


    /*
    Section: Construction
     */

    function Package(params) {
      var ref1, ref2;
      this.path = params.path, this.metadata = params.metadata, this.packageManager = params.packageManager, this.config = params.config, this.styleManager = params.styleManager, this.commandRegistry = params.commandRegistry, this.keymapManager = params.keymapManager, this.devMode = params.devMode, this.notificationManager = params.notificationManager, this.grammarRegistry = params.grammarRegistry, this.themeManager = params.themeManager, this.menuManager = params.menuManager, this.contextMenuManager = params.contextMenuManager, this.deserializerManager = params.deserializerManager, this.viewRegistry = params.viewRegistry;
      this.emitter = new Emitter;
      if (this.metadata == null) {
        this.metadata = this.packageManager.loadPackageMetadata(this.path);
      }
      this.bundledPackage = this.packageManager.isBundledPackagePath(this.path);
      this.name = (ref1 = (ref2 = this.metadata) != null ? ref2.name : void 0) != null ? ref1 : path.basename(this.path);
      ModuleCache.add(this.path, this.metadata);
      this.reset();
    }


    /*
    Section: Event Subscription
     */

    Package.prototype.onDidDeactivate = function(callback) {
      return this.emitter.on('did-deactivate', callback);
    };


    /*
    Section: Instance Methods
     */

    Package.prototype.enable = function() {
      return this.config.removeAtKeyPath('core.disabledPackages', this.name);
    };

    Package.prototype.disable = function() {
      return this.config.pushAtKeyPath('core.disabledPackages', this.name);
    };

    Package.prototype.isTheme = function() {
      var ref1;
      return ((ref1 = this.metadata) != null ? ref1.theme : void 0) != null;
    };

    Package.prototype.measure = function(key, fn) {
      var startTime, value;
      startTime = Date.now();
      value = fn();
      this[key] = Date.now() - startTime;
      return value;
    };

    Package.prototype.getType = function() {
      return 'atom';
    };

    Package.prototype.getStyleSheetPriority = function() {
      return 0;
    };

    Package.prototype.load = function() {
      this.measure('loadTime', (function(_this) {
        return function() {
          var error;
          try {
            _this.loadKeymaps();
            _this.loadMenus();
            _this.loadStylesheets();
            _this.registerDeserializerMethods();
            _this.activateCoreStartupServices();
            _this.registerTranspilerConfig();
            _this.configSchemaRegisteredOnLoad = _this.registerConfigSchemaFromMetadata();
            _this.settingsPromise = _this.loadSettings();
            if (_this.shouldRequireMainModuleOnLoad() && (_this.mainModule == null)) {
              return _this.requireMainModule();
            }
          } catch (error1) {
            error = error1;
            return _this.handleError("Failed to load the " + _this.name + " package", error);
          }
        };
      })(this));
      return this;
    };

    Package.prototype.unload = function() {
      return this.unregisterTranspilerConfig();
    };

    Package.prototype.shouldRequireMainModuleOnLoad = function() {
      return !((this.metadata.deserializers != null) || (this.metadata.viewProviders != null) || (this.metadata.configSchema != null) || this.activationShouldBeDeferred() || localStorage.getItem(this.getCanDeferMainModuleRequireStorageKey()) === 'true');
    };

    Package.prototype.reset = function() {
      this.stylesheets = [];
      this.keymaps = [];
      this.menus = [];
      this.grammars = [];
      this.settings = [];
      this.mainInitialized = false;
      return this.mainActivated = false;
    };

    Package.prototype.initializeIfNeeded = function() {
      if (this.mainInitialized) {
        return;
      }
      this.measure('initializeTime', (function(_this) {
        return function() {
          var base, error, ref1;
          try {
            if (_this.mainModule == null) {
              _this.requireMainModule();
            }
            if (typeof (base = _this.mainModule).initialize === "function") {
              base.initialize((ref1 = _this.packageManager.getPackageState(_this.name)) != null ? ref1 : {});
            }
            return _this.mainInitialized = true;
          } catch (error1) {
            error = error1;
            return _this.handleError("Failed to initialize the " + _this.name + " package", error);
          }
        };
      })(this));
    };

    Package.prototype.activate = function() {
      if (this.grammarsPromise == null) {
        this.grammarsPromise = this.loadGrammars();
      }
      if (this.activationPromise == null) {
        this.activationPromise = new Promise((function(_this) {
          return function(resolve, reject) {
            _this.resolveActivationPromise = resolve;
            return _this.measure('activateTime', function() {
              var error;
              try {
                _this.activateResources();
                if (_this.activationShouldBeDeferred()) {
                  return _this.subscribeToDeferredActivation();
                } else {
                  return _this.activateNow();
                }
              } catch (error1) {
                error = error1;
                return _this.handleError("Failed to activate the " + _this.name + " package", error);
              }
            });
          };
        })(this));
      }
      return Promise.all([this.grammarsPromise, this.settingsPromise, this.activationPromise]);
    };

    Package.prototype.activateNow = function() {
      var base, base1, error, ref1, ref2, ref3;
      try {
        if (this.mainModule == null) {
          this.requireMainModule();
        }
        this.configSchemaRegisteredOnActivate = this.registerConfigSchemaFromMainModule();
        this.registerViewProviders();
        this.activateStylesheets();
        if ((this.mainModule != null) && !this.mainActivated) {
          this.initializeIfNeeded();
          if (typeof (base = this.mainModule).activateConfig === "function") {
            base.activateConfig();
          }
          if (typeof (base1 = this.mainModule).activate === "function") {
            base1.activate((ref1 = this.packageManager.getPackageState(this.name)) != null ? ref1 : {});
          }
          this.mainActivated = true;
          this.activateServices();
        }
        if ((ref2 = this.activationCommandSubscriptions) != null) {
          ref2.dispose();
        }
        if ((ref3 = this.activationHookSubscriptions) != null) {
          ref3.dispose();
        }
      } catch (error1) {
        error = error1;
        this.handleError("Failed to activate the " + this.name + " package", error);
      }
      return typeof this.resolveActivationPromise === "function" ? this.resolveActivationPromise() : void 0;
    };

    Package.prototype.registerConfigSchemaFromMetadata = function() {
      var configSchema;
      if (configSchema = this.metadata.configSchema) {
        this.config.setSchema(this.name, {
          type: 'object',
          properties: configSchema
        });
        return true;
      } else {
        return false;
      }
    };

    Package.prototype.registerConfigSchemaFromMainModule = function() {
      if ((this.mainModule != null) && !this.configSchemaRegisteredOnLoad) {
        if ((this.mainModule.config != null) && typeof this.mainModule.config === 'object') {
          this.config.setSchema(this.name, {
            type: 'object',
            properties: this.mainModule.config
          });
          return true;
        }
      }
      return false;
    };

    Package.prototype.activateConfig = function() {
      if (this.configSchemaRegisteredOnLoad) {
        return;
      }
      this.requireMainModule();
      return this.registerConfigSchemaFromMainModule();
    };

    Package.prototype.activateStylesheets = function() {
      var context, i, len, match, priority, ref1, ref2, source, sourcePath;
      if (this.stylesheetsActivated) {
        return;
      }
      this.stylesheetDisposables = new CompositeDisposable;
      priority = this.getStyleSheetPriority();
      ref1 = this.stylesheets;
      for (i = 0, len = ref1.length; i < len; i++) {
        ref2 = ref1[i], sourcePath = ref2[0], source = ref2[1];
        if (match = path.basename(sourcePath).match(/[^.]*\.([^.]*)\./)) {
          context = match[1];
        } else if (this.metadata.theme === 'syntax') {
          context = 'atom-text-editor';
        } else {
          context = void 0;
        }
        this.stylesheetDisposables.add(this.styleManager.addStyleSheet(source, {
          sourcePath: sourcePath,
          priority: priority,
          context: context
        }));
      }
      return this.stylesheetsActivated = true;
    };

    Package.prototype.activateResources = function() {
      var error, grammar, i, itemsBySelector, j, k, keymapIsDisabled, l, len, len1, len2, len3, map, menuPath, ref1, ref2, ref3, ref4, ref5, ref6, ref7, settings;
      this.activationDisposables = new CompositeDisposable;
      keymapIsDisabled = _.include((ref1 = this.config.get("core.packagesWithKeymapsDisabled")) != null ? ref1 : [], this.name);
      if (keymapIsDisabled) {
        this.deactivateKeymaps();
      } else {
        this.activateKeymaps();
      }
      ref2 = this.menus;
      for (i = 0, len = ref2.length; i < len; i++) {
        ref3 = ref2[i], menuPath = ref3[0], map = ref3[1];
        if (map['context-menu'] != null) {
          try {
            itemsBySelector = map['context-menu'];
            this.activationDisposables.add(this.contextMenuManager.add(itemsBySelector));
          } catch (error1) {
            error = error1;
            if (error.code === 'EBADSELECTOR') {
              error.message += " in " + menuPath;
              error.stack += "\n  at " + menuPath + ":1:1";
            }
            throw error;
          }
        }
      }
      ref4 = this.menus;
      for (j = 0, len1 = ref4.length; j < len1; j++) {
        ref5 = ref4[j], menuPath = ref5[0], map = ref5[1];
        if (map['menu'] != null) {
          this.activationDisposables.add(this.menuManager.add(map['menu']));
        }
      }
      if (!this.grammarsActivated) {
        ref6 = this.grammars;
        for (k = 0, len2 = ref6.length; k < len2; k++) {
          grammar = ref6[k];
          grammar.activate();
        }
        this.grammarsActivated = true;
      }
      ref7 = this.settings;
      for (l = 0, len3 = ref7.length; l < len3; l++) {
        settings = ref7[l];
        settings.activate();
      }
      return this.settingsActivated = true;
    };

    Package.prototype.activateKeymaps = function() {
      var i, keymapPath, len, map, ref1, ref2;
      if (this.keymapActivated) {
        return;
      }
      this.keymapDisposables = new CompositeDisposable();
      ref1 = this.keymaps;
      for (i = 0, len = ref1.length; i < len; i++) {
        ref2 = ref1[i], keymapPath = ref2[0], map = ref2[1];
        this.keymapDisposables.add(this.keymapManager.add(keymapPath, map));
      }
      this.menuManager.update();
      return this.keymapActivated = true;
    };

    Package.prototype.deactivateKeymaps = function() {
      var ref1;
      if (!this.keymapActivated) {
        return;
      }
      if ((ref1 = this.keymapDisposables) != null) {
        ref1.dispose();
      }
      this.menuManager.update();
      return this.keymapActivated = false;
    };

    Package.prototype.hasKeymaps = function() {
      var i, len, map, ref1, ref2;
      ref1 = this.keymaps;
      for (i = 0, len = ref1.length; i < len; i++) {
        ref2 = ref1[i], path = ref2[0], map = ref2[1];
        if (map.length > 0) {
          return true;
        }
      }
      return false;
    };

    Package.prototype.activateServices = function() {
      var methodName, name, ref1, ref2, servicesByVersion, version, versions;
      ref1 = this.metadata.providedServices;
      for (name in ref1) {
        versions = ref1[name].versions;
        servicesByVersion = {};
        for (version in versions) {
          methodName = versions[version];
          if (typeof this.mainModule[methodName] === 'function') {
            servicesByVersion[version] = this.mainModule[methodName]();
          }
        }
        this.activationDisposables.add(this.packageManager.serviceHub.provide(name, servicesByVersion));
      }
      ref2 = this.metadata.consumedServices;
      for (name in ref2) {
        versions = ref2[name].versions;
        for (version in versions) {
          methodName = versions[version];
          if (typeof this.mainModule[methodName] === 'function') {
            this.activationDisposables.add(this.packageManager.serviceHub.consume(name, version, this.mainModule[methodName].bind(this.mainModule)));
          }
        }
      }
    };

    Package.prototype.registerTranspilerConfig = function() {
      if (this.metadata.atomTranspilers) {
        return CompileCache.addTranspilerConfigForPath(this.path, this.name, this.metadata, this.metadata.atomTranspilers);
      }
    };

    Package.prototype.unregisterTranspilerConfig = function() {
      if (this.metadata.atomTranspilers) {
        return CompileCache.removeTranspilerConfigForPath(this.path);
      }
    };

    Package.prototype.loadKeymaps = function() {
      var keymapObject, keymapPath;
      if (this.bundledPackage && (this.packageManager.packagesCache[this.name] != null)) {
        this.keymaps = (function() {
          var ref1, results;
          ref1 = this.packageManager.packagesCache[this.name].keymaps;
          results = [];
          for (keymapPath in ref1) {
            keymapObject = ref1[keymapPath];
            results.push(["" + this.packageManager.resourcePath + path.sep + keymapPath, keymapObject]);
          }
          return results;
        }).call(this);
      } else {
        this.keymaps = this.getKeymapPaths().map(function(keymapPath) {
          var ref1;
          return [
            keymapPath, (ref1 = CSON.readFileSync(keymapPath, {
              allowDuplicateKeys: false
            })) != null ? ref1 : {}
          ];
        });
      }
    };

    Package.prototype.loadMenus = function() {
      var menuObject, menuPath;
      if (this.bundledPackage && (this.packageManager.packagesCache[this.name] != null)) {
        this.menus = (function() {
          var ref1, results;
          ref1 = this.packageManager.packagesCache[this.name].menus;
          results = [];
          for (menuPath in ref1) {
            menuObject = ref1[menuPath];
            results.push(["" + this.packageManager.resourcePath + path.sep + menuPath, menuObject]);
          }
          return results;
        }).call(this);
      } else {
        this.menus = this.getMenuPaths().map(function(menuPath) {
          var ref1;
          return [menuPath, (ref1 = CSON.readFileSync(menuPath)) != null ? ref1 : {}];
        });
      }
    };

    Package.prototype.getKeymapPaths = function() {
      var keymapsDirPath;
      keymapsDirPath = path.join(this.path, 'keymaps');
      if (this.metadata.keymaps) {
        return this.metadata.keymaps.map(function(name) {
          return fs.resolve(keymapsDirPath, name, ['json', 'cson', '']);
        });
      } else {
        return fs.listSync(keymapsDirPath, ['cson', 'json']);
      }
    };

    Package.prototype.getMenuPaths = function() {
      var menusDirPath;
      menusDirPath = path.join(this.path, 'menus');
      if (this.metadata.menus) {
        return this.metadata.menus.map(function(name) {
          return fs.resolve(menusDirPath, name, ['json', 'cson', '']);
        });
      } else {
        return fs.listSync(menusDirPath, ['cson', 'json']);
      }
    };

    Package.prototype.loadStylesheets = function() {
      return this.stylesheets = this.getStylesheetPaths().map((function(_this) {
        return function(stylesheetPath) {
          return [stylesheetPath, _this.themeManager.loadStylesheet(stylesheetPath, true)];
        };
      })(this));
    };

    Package.prototype.registerDeserializerMethods = function() {
      if (this.metadata.deserializers != null) {
        Object.keys(this.metadata.deserializers).forEach((function(_this) {
          return function(deserializerName) {
            var methodName;
            methodName = _this.metadata.deserializers[deserializerName];
            return atom.deserializers.add({
              name: deserializerName,
              deserialize: function(state, atomEnvironment) {
                _this.registerViewProviders();
                _this.requireMainModule();
                _this.initializeIfNeeded();
                return _this.mainModule[methodName](state, atomEnvironment);
              }
            });
          };
        })(this));
      }
    };

    Package.prototype.activateCoreStartupServices = function() {
      var directoryProviderService, methodName, ref1, ref2, servicesByVersion, version;
      if (directoryProviderService = (ref1 = this.metadata.providedServices) != null ? ref1['atom.directory-provider'] : void 0) {
        this.requireMainModule();
        servicesByVersion = {};
        ref2 = directoryProviderService.versions;
        for (version in ref2) {
          methodName = ref2[version];
          if (typeof this.mainModule[methodName] === 'function') {
            servicesByVersion[version] = this.mainModule[methodName]();
          }
        }
        return this.packageManager.serviceHub.provide('atom.directory-provider', servicesByVersion);
      }
    };

    Package.prototype.registerViewProviders = function() {
      if ((this.metadata.viewProviders != null) && !this.registeredViewProviders) {
        this.requireMainModule();
        this.metadata.viewProviders.forEach((function(_this) {
          return function(methodName) {
            return _this.viewRegistry.addViewProvider(function(model) {
              _this.initializeIfNeeded();
              return _this.mainModule[methodName](model);
            });
          };
        })(this));
        return this.registeredViewProviders = true;
      }
    };

    Package.prototype.getStylesheetsPath = function() {
      return path.join(this.path, 'styles');
    };

    Package.prototype.getStylesheetPaths = function() {
      var indexStylesheet, stylesheetDirPath;
      stylesheetDirPath = this.getStylesheetsPath();
      if (this.metadata.mainStyleSheet) {
        return [fs.resolve(this.path, this.metadata.mainStyleSheet)];
      } else if (this.metadata.styleSheets) {
        return this.metadata.styleSheets.map(function(name) {
          return fs.resolve(stylesheetDirPath, name, ['css', 'less', '']);
        });
      } else if (indexStylesheet = fs.resolve(this.path, 'index', ['css', 'less'])) {
        return [indexStylesheet];
      } else {
        return fs.listSync(stylesheetDirPath, ['css', 'less']);
      }
    };

    Package.prototype.loadGrammarsSync = function() {
      var error, grammar, grammarPath, grammarPaths, grammarsDirPath, i, len, ref1;
      if (this.grammarsLoaded) {
        return;
      }
      grammarsDirPath = path.join(this.path, 'grammars');
      grammarPaths = fs.listSync(grammarsDirPath, ['json', 'cson']);
      for (i = 0, len = grammarPaths.length; i < len; i++) {
        grammarPath = grammarPaths[i];
        try {
          grammar = this.grammarRegistry.readGrammarSync(grammarPath);
          grammar.packageName = this.name;
          grammar.bundledPackage = this.bundledPackage;
          this.grammars.push(grammar);
          grammar.activate();
        } catch (error1) {
          error = error1;
          console.warn("Failed to load grammar: " + grammarPath, (ref1 = error.stack) != null ? ref1 : error);
        }
      }
      this.grammarsLoaded = true;
      return this.grammarsActivated = true;
    };

    Package.prototype.loadGrammars = function() {
      var loadGrammar;
      if (this.grammarsLoaded) {
        return Promise.resolve();
      }
      loadGrammar = (function(_this) {
        return function(grammarPath, callback) {
          return _this.grammarRegistry.readGrammar(grammarPath, function(error, grammar) {
            var detail, stack;
            if (error != null) {
              detail = error.message + " in " + grammarPath;
              stack = error.stack + "\n  at " + grammarPath + ":1:1";
              _this.notificationManager.addFatalError("Failed to load a " + _this.name + " package grammar", {
                stack: stack,
                detail: detail,
                packageName: _this.name,
                dismissable: true
              });
            } else {
              grammar.packageName = _this.name;
              grammar.bundledPackage = _this.bundledPackage;
              _this.grammars.push(grammar);
              if (_this.grammarsActivated) {
                grammar.activate();
              }
            }
            return callback();
          });
        };
      })(this);
      return new Promise((function(_this) {
        return function(resolve) {
          var grammarsDirPath;
          grammarsDirPath = path.join(_this.path, 'grammars');
          return fs.exists(grammarsDirPath, function(grammarsDirExists) {
            if (!grammarsDirExists) {
              return resolve();
            }
            return fs.list(grammarsDirPath, ['json', 'cson'], function(error, grammarPaths) {
              if (grammarPaths == null) {
                grammarPaths = [];
              }
              return async.each(grammarPaths, loadGrammar, function() {
                return resolve();
              });
            });
          });
        };
      })(this));
    };

    Package.prototype.loadSettings = function() {
      var loadSettingsFile;
      this.settings = [];
      loadSettingsFile = (function(_this) {
        return function(settingsPath, callback) {
          return ScopedProperties.load(settingsPath, _this.config, function(error, settings) {
            var detail, stack;
            if (error != null) {
              detail = error.message + " in " + settingsPath;
              stack = error.stack + "\n  at " + settingsPath + ":1:1";
              _this.notificationManager.addFatalError("Failed to load the " + _this.name + " package settings", {
                stack: stack,
                detail: detail,
                packageName: _this.name,
                dismissable: true
              });
            } else {
              _this.settings.push(settings);
              if (_this.settingsActivated) {
                settings.activate();
              }
            }
            return callback();
          });
        };
      })(this);
      return new Promise((function(_this) {
        return function(resolve) {
          var settingsDirPath;
          settingsDirPath = path.join(_this.path, 'settings');
          return fs.exists(settingsDirPath, function(settingsDirExists) {
            if (!settingsDirExists) {
              return resolve();
            }
            return fs.list(settingsDirPath, ['json', 'cson'], function(error, settingsPaths) {
              if (settingsPaths == null) {
                settingsPaths = [];
              }
              return async.each(settingsPaths, loadSettingsFile, function() {
                return resolve();
              });
            });
          });
        };
      })(this));
    };

    Package.prototype.serialize = function() {
      var e, ref1;
      if (this.mainActivated) {
        try {
          return (ref1 = this.mainModule) != null ? typeof ref1.serialize === "function" ? ref1.serialize() : void 0 : void 0;
        } catch (error1) {
          e = error1;
          return console.error("Error serializing package '" + this.name + "'", e.stack);
        }
      }
    };

    Package.prototype.deactivate = function() {
      var e, ref1, ref2, ref3, ref4;
      this.activationPromise = null;
      this.resolveActivationPromise = null;
      if ((ref1 = this.activationCommandSubscriptions) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.activationHookSubscriptions) != null) {
        ref2.dispose();
      }
      this.configSchemaRegisteredOnActivate = false;
      this.deactivateResources();
      this.deactivateKeymaps();
      if (this.mainActivated) {
        try {
          if ((ref3 = this.mainModule) != null) {
            if (typeof ref3.deactivate === "function") {
              ref3.deactivate();
            }
          }
          if ((ref4 = this.mainModule) != null) {
            if (typeof ref4.deactivateConfig === "function") {
              ref4.deactivateConfig();
            }
          }
          this.mainActivated = false;
          this.mainInitialized = false;
        } catch (error1) {
          e = error1;
          console.error("Error deactivating package '" + this.name + "'", e.stack);
        }
      }
      return this.emitter.emit('did-deactivate');
    };

    Package.prototype.deactivateResources = function() {
      var grammar, i, j, len, len1, ref1, ref2, ref3, ref4, ref5, settings;
      ref1 = this.grammars;
      for (i = 0, len = ref1.length; i < len; i++) {
        grammar = ref1[i];
        grammar.deactivate();
      }
      ref2 = this.settings;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        settings = ref2[j];
        settings.deactivate();
      }
      if ((ref3 = this.stylesheetDisposables) != null) {
        ref3.dispose();
      }
      if ((ref4 = this.activationDisposables) != null) {
        ref4.dispose();
      }
      if ((ref5 = this.keymapDisposables) != null) {
        ref5.dispose();
      }
      this.stylesheetsActivated = false;
      this.grammarsActivated = false;
      return this.settingsActivated = false;
    };

    Package.prototype.reloadStylesheets = function() {
      var error, ref1;
      try {
        this.loadStylesheets();
      } catch (error1) {
        error = error1;
        this.handleError("Failed to reload the " + this.name + " package stylesheets", error);
      }
      if ((ref1 = this.stylesheetDisposables) != null) {
        ref1.dispose();
      }
      this.stylesheetDisposables = new CompositeDisposable;
      this.stylesheetsActivated = false;
      return this.activateStylesheets();
    };

    Package.prototype.requireMainModule = function() {
      var mainModulePath, previousDeserializerCount, previousViewProviderCount;
      if (this.mainModuleRequired) {
        return this.mainModule;
      }
      if (!this.isCompatible()) {
        console.warn("Failed to require the main module of '" + this.name + "' because it requires one or more incompatible native modules (" + (_.pluck(this.incompatibleModules, 'name').join(', ')) + ").\nRun `apm rebuild` in the package directory and restart Atom to resolve.");
        return;
      }
      mainModulePath = this.getMainModulePath();
      if (fs.isFileSync(mainModulePath)) {
        this.mainModuleRequired = true;
        previousViewProviderCount = this.viewRegistry.getViewProviderCount();
        previousDeserializerCount = this.deserializerManager.getDeserializerCount();
        this.mainModule = require(mainModulePath);
        if (this.viewRegistry.getViewProviderCount() === previousViewProviderCount && this.deserializerManager.getDeserializerCount() === previousDeserializerCount) {
          return localStorage.setItem(this.getCanDeferMainModuleRequireStorageKey(), 'true');
        }
      }
    };

    Package.prototype.getMainModulePath = function() {
      var mainModulePath;
      if (this.resolvedMainModulePath) {
        return this.mainModulePath;
      }
      this.resolvedMainModulePath = true;
      if (this.bundledPackage && (this.packageManager.packagesCache[this.name] != null)) {
        if (this.packageManager.packagesCache[this.name].main) {
          return this.mainModulePath = "" + this.packageManager.resourcePath + path.sep + this.packageManager.packagesCache[this.name].main;
        } else {
          return this.mainModulePath = null;
        }
      } else {
        mainModulePath = this.metadata.main ? path.join(this.path, this.metadata.main) : path.join(this.path, 'index');
        return this.mainModulePath = fs.resolveExtension(mainModulePath, [""].concat(slice.call(_.keys(require.extensions))));
      }
    };

    Package.prototype.activationShouldBeDeferred = function() {
      return this.hasActivationCommands() || this.hasActivationHooks();
    };

    Package.prototype.hasActivationHooks = function() {
      var ref1;
      return ((ref1 = this.getActivationHooks()) != null ? ref1.length : void 0) > 0;
    };

    Package.prototype.hasActivationCommands = function() {
      var commands, ref1, selector;
      ref1 = this.getActivationCommands();
      for (selector in ref1) {
        commands = ref1[selector];
        if (commands.length > 0) {
          return true;
        }
      }
      return false;
    };

    Package.prototype.subscribeToDeferredActivation = function() {
      this.subscribeToActivationCommands();
      return this.subscribeToActivationHooks();
    };

    Package.prototype.subscribeToActivationCommands = function() {
      var command, commands, fn1, i, len, ref1, selector;
      this.activationCommandSubscriptions = new CompositeDisposable;
      ref1 = this.getActivationCommands();
      for (selector in ref1) {
        commands = ref1[selector];
        fn1 = (function(_this) {
          return function(selector, command) {
            var error, metadataPath;
            try {
              _this.activationCommandSubscriptions.add(_this.commandRegistry.add(selector, command, function() {}));
            } catch (error1) {
              error = error1;
              if (error.code === 'EBADSELECTOR') {
                metadataPath = path.join(_this.path, 'package.json');
                error.message += " in " + metadataPath;
                error.stack += "\n  at " + metadataPath + ":1:1";
              }
              throw error;
            }
            return _this.activationCommandSubscriptions.add(_this.commandRegistry.onWillDispatch(function(event) {
              var currentTarget;
              if (event.type !== command) {
                return;
              }
              currentTarget = event.target;
              while (currentTarget) {
                if (currentTarget.webkitMatchesSelector(selector)) {
                  _this.activationCommandSubscriptions.dispose();
                  _this.activateNow();
                  break;
                }
                currentTarget = currentTarget.parentElement;
              }
            }));
          };
        })(this);
        for (i = 0, len = commands.length; i < len; i++) {
          command = commands[i];
          fn1(selector, command);
        }
      }
    };

    Package.prototype.getActivationCommands = function() {
      var base, commands, ref1, ref2, selector;
      if (this.activationCommands != null) {
        return this.activationCommands;
      }
      this.activationCommands = {};
      if (this.metadata.activationCommands != null) {
        ref1 = this.metadata.activationCommands;
        for (selector in ref1) {
          commands = ref1[selector];
          if ((base = this.activationCommands)[selector] == null) {
            base[selector] = [];
          }
          if (_.isString(commands)) {
            this.activationCommands[selector].push(commands);
          } else if (_.isArray(commands)) {
            (ref2 = this.activationCommands[selector]).push.apply(ref2, commands);
          }
        }
      }
      return this.activationCommands;
    };

    Package.prototype.subscribeToActivationHooks = function() {
      var fn1, hook, i, len, ref1;
      this.activationHookSubscriptions = new CompositeDisposable;
      ref1 = this.getActivationHooks();
      fn1 = (function(_this) {
        return function(hook) {
          if ((hook != null) && _.isString(hook) && hook.trim().length > 0) {
            return _this.activationHookSubscriptions.add(_this.packageManager.onDidTriggerActivationHook(hook, function() {
              return _this.activateNow();
            }));
          }
        };
      })(this);
      for (i = 0, len = ref1.length; i < len; i++) {
        hook = ref1[i];
        fn1(hook);
      }
    };

    Package.prototype.getActivationHooks = function() {
      var ref1;
      if ((this.metadata != null) && (this.activationHooks != null)) {
        return this.activationHooks;
      }
      this.activationHooks = [];
      if (this.metadata.activationHooks != null) {
        if (_.isArray(this.metadata.activationHooks)) {
          (ref1 = this.activationHooks).push.apply(ref1, this.metadata.activationHooks);
        } else if (_.isString(this.metadata.activationHooks)) {
          this.activationHooks.push(this.metadata.activationHooks);
        }
      }
      return this.activationHooks = _.uniq(this.activationHooks);
    };

    Package.prototype.isNativeModule = function(modulePath) {
      var error;
      try {
        return fs.listSync(path.join(modulePath, 'build', 'Release'), ['.node']).length > 0;
      } catch (error1) {
        error = error1;
        return false;
      }
    };

    Package.prototype.getNativeModuleDependencyPaths = function() {
      var i, len, nativeModulePath, nativeModulePaths, ref1, ref2, relativeNativeModuleBindingPath, relativeNativeModuleBindingPaths, traversePath;
      nativeModulePaths = [];
      if (this.metadata._atomModuleCache != null) {
        relativeNativeModuleBindingPaths = (ref1 = (ref2 = this.metadata._atomModuleCache.extensions) != null ? ref2['.node'] : void 0) != null ? ref1 : [];
        for (i = 0, len = relativeNativeModuleBindingPaths.length; i < len; i++) {
          relativeNativeModuleBindingPath = relativeNativeModuleBindingPaths[i];
          nativeModulePath = path.join(this.path, relativeNativeModuleBindingPath, '..', '..', '..');
          nativeModulePaths.push(nativeModulePath);
        }
        return nativeModulePaths;
      }
      traversePath = (function(_this) {
        return function(nodeModulesPath) {
          var j, len1, modulePath, ref3;
          try {
            ref3 = fs.listSync(nodeModulesPath);
            for (j = 0, len1 = ref3.length; j < len1; j++) {
              modulePath = ref3[j];
              if (_this.isNativeModule(modulePath)) {
                nativeModulePaths.push(modulePath);
              }
              traversePath(path.join(modulePath, 'node_modules'));
            }
          } catch (error1) {}
        };
      })(this);
      traversePath(path.join(this.path, 'node_modules'));
      return nativeModulePaths;
    };


    /*
    Section: Native Module Compatibility
     */

    Package.prototype.isCompatible = function() {
      if (this.compatible != null) {
        return this.compatible;
      }
      if (this.path.indexOf(path.join(this.packageManager.resourcePath, 'node_modules') + path.sep) === 0) {
        return this.compatible = true;
      } else if (this.getMainModulePath()) {
        this.incompatibleModules = this.getIncompatibleNativeModules();
        return this.compatible = this.incompatibleModules.length === 0 && (this.getBuildFailureOutput() == null);
      } else {
        return this.compatible = true;
      }
    };

    Package.prototype.rebuild = function() {
      return new Promise((function(_this) {
        return function(resolve) {
          return _this.runRebuildProcess(function(result) {
            if (result.code === 0) {
              global.localStorage.removeItem(_this.getBuildFailureOutputStorageKey());
            } else {
              _this.compatible = false;
              global.localStorage.setItem(_this.getBuildFailureOutputStorageKey(), result.stderr);
            }
            global.localStorage.setItem(_this.getIncompatibleNativeModulesStorageKey(), '[]');
            return resolve(result);
          });
        };
      })(this));
    };

    Package.prototype.getBuildFailureOutput = function() {
      return global.localStorage.getItem(this.getBuildFailureOutputStorageKey());
    };

    Package.prototype.runRebuildProcess = function(callback) {
      var stderr, stdout;
      stderr = '';
      stdout = '';
      return new BufferedProcess({
        command: this.packageManager.getApmPath(),
        args: ['rebuild', '--no-color'],
        options: {
          cwd: this.path
        },
        stderr: function(output) {
          return stderr += output;
        },
        stdout: function(output) {
          return stdout += output;
        },
        exit: function(code) {
          return callback({
            code: code,
            stdout: stdout,
            stderr: stderr
          });
        }
      });
    };

    Package.prototype.getBuildFailureOutputStorageKey = function() {
      return "installed-packages:" + this.name + ":" + this.metadata.version + ":build-error";
    };

    Package.prototype.getIncompatibleNativeModulesStorageKey = function() {
      var electronVersion, ref1;
      electronVersion = (ref1 = process.versions['electron']) != null ? ref1 : process.versions['atom-shell'];
      return "installed-packages:" + this.name + ":" + this.metadata.version + ":electron-" + electronVersion + ":incompatible-native-modules";
    };

    Package.prototype.getCanDeferMainModuleRequireStorageKey = function() {
      return "installed-packages:" + this.name + ":" + this.metadata.version + ":can-defer-main-module-require";
    };

    Package.prototype.getIncompatibleNativeModules = function() {
      var arrayAsString, error, i, incompatibleNativeModules, len, nativeModulePath, ref1, version;
      if (!this.devMode) {
        try {
          if (arrayAsString = global.localStorage.getItem(this.getIncompatibleNativeModulesStorageKey())) {
            return JSON.parse(arrayAsString);
          }
        } catch (error1) {}
      }
      incompatibleNativeModules = [];
      ref1 = this.getNativeModuleDependencyPaths();
      for (i = 0, len = ref1.length; i < len; i++) {
        nativeModulePath = ref1[i];
        try {
          require(nativeModulePath);
        } catch (error1) {
          error = error1;
          try {
            version = require(nativeModulePath + "/package.json").version;
          } catch (error1) {}
          incompatibleNativeModules.push({
            path: nativeModulePath,
            name: path.basename(nativeModulePath),
            version: version,
            error: error.message
          });
        }
      }
      global.localStorage.setItem(this.getIncompatibleNativeModulesStorageKey(), JSON.stringify(incompatibleNativeModules));
      return incompatibleNativeModules;
    };

    Package.prototype.handleError = function(message, error) {
      var detail, location, ref1, stack;
      if (error.filename && error.location && (error instanceof SyntaxError)) {
        location = error.filename + ":" + (error.location.first_line + 1) + ":" + (error.location.first_column + 1);
        detail = error.message + " in " + location;
        stack = "SyntaxError: " + error.message + "\n  at " + location;
      } else if (error.less && error.filename && (error.column != null) && (error.line != null)) {
        location = error.filename + ":" + error.line + ":" + error.column;
        detail = error.message + " in " + location;
        stack = "LessError: " + error.message + "\n  at " + location;
      } else {
        detail = error.message;
        stack = (ref1 = error.stack) != null ? ref1 : error;
      }
      return this.notificationManager.addFatalError(message, {
        stack: stack,
        detail: detail,
        packageName: this.name,
        dismissable: true
      });
    };

    return Package;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYWNrYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0lBQUE7SUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0VBQ1IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBRVYsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxxQkFBUjs7RUFDbkIsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBSWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007c0JBQ0osT0FBQSxHQUFTOztzQkFDVCxLQUFBLEdBQU87O3NCQUNQLFdBQUEsR0FBYTs7c0JBQ2IscUJBQUEsR0FBdUI7O3NCQUN2QixRQUFBLEdBQVU7O3NCQUNWLFFBQUEsR0FBVTs7c0JBQ1YsY0FBQSxHQUFnQjs7c0JBQ2hCLHNCQUFBLEdBQXdCOztzQkFDeEIsVUFBQSxHQUFZOztzQkFDWixlQUFBLEdBQWlCOztzQkFDakIsYUFBQSxHQUFlOzs7QUFFZjs7OztJQUlhLGlCQUFDLE1BQUQ7QUFDWCxVQUFBO01BQ0UsSUFBQyxDQUFBLGNBQUEsSUFESCxFQUNTLElBQUMsQ0FBQSxrQkFBQSxRQURWLEVBQ29CLElBQUMsQ0FBQSx3QkFBQSxjQURyQixFQUNxQyxJQUFDLENBQUEsZ0JBQUEsTUFEdEMsRUFDOEMsSUFBQyxDQUFB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QSxHQUFjLEtBQUssQ0FBQyxRQUFQLEdBQWdCLEdBQWhCLEdBQW1CLEtBQUssQ0FBQyxJQUF6QixHQUE4QixHQUE5QixHQUFpQyxLQUFLLENBQUM7UUFDcEQsTUFBQSxHQUFZLEtBQUssQ0FBQyxPQUFQLEdBQWUsTUFBZixHQUFxQjtRQUNoQyxLQUFBLEdBQVEsYUFBQSxHQUNPLEtBQUssQ0FBQyxPQURiLEdBQ3FCLFNBRHJCLEdBRUMsU0FOTjtPQUFBLE1BQUE7UUFTSCxNQUFBLEdBQVMsS0FBSyxDQUFDO1FBQ2YsS0FBQSx5Q0FBc0IsTUFWbkI7O2FBWUwsSUFBQyxDQUFBLG1CQUFtQixDQUFDLGFBQXJCLENBQW1DLE9BQW5DLEVBQTRDO1FBQUMsT0FBQSxLQUFEO1FBQVEsUUFBQSxNQUFSO1FBQWdCLFdBQUEsRUFBYSxJQUFDLENBQUEsSUFBOUI7UUFBb0MsV0FBQSxFQUFhLElBQWpEO09BQTVDO0lBcEJXOzs7OztBQXhzQmYiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbmFzeW5jID0gcmVxdWlyZSAnYXN5bmMnXG5DU09OID0gcmVxdWlyZSAnc2Vhc29uJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xue0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5Db21waWxlQ2FjaGUgPSByZXF1aXJlICcuL2NvbXBpbGUtY2FjaGUnXG5Nb2R1bGVDYWNoZSA9IHJlcXVpcmUgJy4vbW9kdWxlLWNhY2hlJ1xuU2NvcGVkUHJvcGVydGllcyA9IHJlcXVpcmUgJy4vc2NvcGVkLXByb3BlcnRpZXMnXG5CdWZmZXJlZFByb2Nlc3MgPSByZXF1aXJlICcuL2J1ZmZlcmVkLXByb2Nlc3MnXG5cbiMgRXh0ZW5kZWQ6IExvYWRzIGFuZCBhY3RpdmF0ZXMgYSBwYWNrYWdlJ3MgbWFpbiBtb2R1bGUgYW5kIHJlc291cmNlcyBzdWNoIGFzXG4jIHN0eWxlc2hlZXRzLCBrZXltYXBzLCBncmFtbWFyLCBlZGl0b3IgcHJvcGVydGllcywgYW5kIG1lbnVzLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZVxuICBrZXltYXBzOiBudWxsXG4gIG1lbnVzOiBudWxsXG4gIHN0eWxlc2hlZXRzOiBudWxsXG4gIHN0eWxlc2hlZXREaXNwb3NhYmxlczogbnVsbFxuICBncmFtbWFyczogbnVsbFxuICBzZXR0aW5nczogbnVsbFxuICBtYWluTW9kdWxlUGF0aDogbnVsbFxuICByZXNvbHZlZE1haW5Nb2R1bGVQYXRoOiBmYWxzZVxuICBtYWluTW9kdWxlOiBudWxsXG4gIG1haW5Jbml0aWFsaXplZDogZmFsc2VcbiAgbWFpbkFjdGl2YXRlZDogZmFsc2VcblxuICAjIyNcbiAgU2VjdGlvbjogQ29uc3RydWN0aW9uXG4gICMjI1xuXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHtcbiAgICAgIEBwYXRoLCBAbWV0YWRhdGEsIEBwYWNrYWdlTWFuYWdlciwgQGNvbmZpZywgQHN0eWxlTWFuYWdlciwgQGNvbW1hbmRSZWdpc3RyeSxcbiAgICAgIEBrZXltYXBNYW5hZ2VyLCBAZGV2TW9kZSwgQG5vdGlmaWNhdGlvbk1hbmFnZXIsIEBncmFtbWFyUmVnaXN0cnksIEB0aGVtZU1hbmFnZXIsXG4gICAgICBAbWVudU1hbmFnZXIsIEBjb250ZXh0TWVudU1hbmFnZXIsIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyLCBAdmlld1JlZ2lzdHJ5XG4gICAgfSA9IHBhcmFtc1xuXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBtZXRhZGF0YSA/PSBAcGFja2FnZU1hbmFnZXIubG9hZFBhY2thZ2VNZXRhZGF0YShAcGF0aClcbiAgICBAYnVuZGxlZFBhY2thZ2UgPSBAcGFja2FnZU1hbmFnZXIuaXNCdW5kbGVkUGFja2FnZVBhdGgoQHBhdGgpXG4gICAgQG5hbWUgPSBAbWV0YWRhdGE/Lm5hbWUgPyBwYXRoLmJhc2VuYW1lKEBwYXRoKVxuICAgIE1vZHVsZUNhY2hlLmFkZChAcGF0aCwgQG1ldGFkYXRhKVxuICAgIEByZXNldCgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIEVzc2VudGlhbDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGFsbCBwYWNrYWdlcyBoYXZlIGJlZW4gYWN0aXZhdGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVhY3RpdmF0ZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVhY3RpdmF0ZScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IEluc3RhbmNlIE1ldGhvZHNcbiAgIyMjXG5cbiAgZW5hYmxlOiAtPlxuICAgIEBjb25maWcucmVtb3ZlQXRLZXlQYXRoKCdjb3JlLmRpc2FibGVkUGFja2FnZXMnLCBAbmFtZSlcblxuICBkaXNhYmxlOiAtPlxuICAgIEBjb25maWcucHVzaEF0S2V5UGF0aCgnY29yZS5kaXNhYmxlZFBhY2thZ2VzJywgQG5hbWUpXG5cbiAgaXNUaGVtZTogLT5cbiAgICBAbWV0YWRhdGE/LnRoZW1lP1xuXG4gIG1lYXN1cmU6IChrZXksIGZuKSAtPlxuICAgIHN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICB2YWx1ZSA9IGZuKClcbiAgICBAW2tleV0gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgdmFsdWVcblxuICBnZXRUeXBlOiAtPiAnYXRvbSdcblxuICBnZXRTdHlsZVNoZWV0UHJpb3JpdHk6IC0+IDBcblxuICBsb2FkOiAtPlxuICAgIEBtZWFzdXJlICdsb2FkVGltZScsID0+XG4gICAgICB0cnlcbiAgICAgICAgQGxvYWRLZXltYXBzKClcbiAgICAgICAgQGxvYWRNZW51cygpXG4gICAgICAgIEBsb2FkU3R5bGVzaGVldHMoKVxuICAgICAgICBAcmVnaXN0ZXJEZXNlcmlhbGl6ZXJNZXRob2RzKClcbiAgICAgICAgQGFjdGl2YXRlQ29yZVN0YXJ0dXBTZXJ2aWNlcygpXG4gICAgICAgIEByZWdpc3RlclRyYW5zcGlsZXJDb25maWcoKVxuICAgICAgICBAY29uZmlnU2NoZW1hUmVnaXN0ZXJlZE9uTG9hZCA9IEByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NZXRhZGF0YSgpXG4gICAgICAgIEBzZXR0aW5nc1Byb21pc2UgPSBAbG9hZFNldHRpbmdzKClcbiAgICAgICAgaWYgQHNob3VsZFJlcXVpcmVNYWluTW9kdWxlT25Mb2FkKCkgYW5kIG5vdCBAbWFpbk1vZHVsZT9cbiAgICAgICAgICBAcmVxdWlyZU1haW5Nb2R1bGUoKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgQGhhbmRsZUVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdGhlICN7QG5hbWV9IHBhY2thZ2VcIiwgZXJyb3IpXG4gICAgdGhpc1xuXG4gIHVubG9hZDogLT5cbiAgICBAdW5yZWdpc3RlclRyYW5zcGlsZXJDb25maWcoKVxuXG4gIHNob3VsZFJlcXVpcmVNYWluTW9kdWxlT25Mb2FkOiAtPlxuICAgIG5vdCAoXG4gICAgICBAbWV0YWRhdGEuZGVzZXJpYWxpemVycz8gb3JcbiAgICAgIEBtZXRhZGF0YS52aWV3UHJvdmlkZXJzPyBvclxuICAgICAgQG1ldGFkYXRhLmNvbmZpZ1NjaGVtYT8gb3JcbiAgICAgIEBhY3RpdmF0aW9uU2hvdWxkQmVEZWZlcnJlZCgpIG9yXG4gICAgICBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShAZ2V0Q2FuRGVmZXJNYWluTW9kdWxlUmVxdWlyZVN0b3JhZ2VLZXkoKSkgaXMgJ3RydWUnXG4gICAgKVxuXG4gIHJlc2V0OiAtPlxuICAgIEBzdHlsZXNoZWV0cyA9IFtdXG4gICAgQGtleW1hcHMgPSBbXVxuICAgIEBtZW51cyA9IFtdXG4gICAgQGdyYW1tYXJzID0gW11cbiAgICBAc2V0dGluZ3MgPSBbXVxuICAgIEBtYWluSW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIEBtYWluQWN0aXZhdGVkID0gZmFsc2VcblxuICBpbml0aWFsaXplSWZOZWVkZWQ6IC0+XG4gICAgcmV0dXJuIGlmIEBtYWluSW5pdGlhbGl6ZWRcbiAgICBAbWVhc3VyZSAnaW5pdGlhbGl6ZVRpbWUnLCA9PlxuICAgICAgdHJ5XG4gICAgICAgICMgVGhlIG1haW4gbW9kdWxlJ3MgYGluaXRpYWxpemUoKWAgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8gYmUgY2FsbGVkXG4gICAgICAgICMgYmVmb3JlIGl0cyBgYWN0aXZhdGUoKWAuIFRoaXMgZ2l2ZXMgeW91IGEgY2hhbmNlIHRvIGhhbmRsZSB0aGVcbiAgICAgICAgIyBzZXJpYWxpemVkIHBhY2thZ2Ugc3RhdGUgYmVmb3JlIHRoZSBwYWNrYWdlJ3MgZGVyc2VyaWFsaXplcnMgYW5kIHZpZXdcbiAgICAgICAgIyBwcm92aWRlcnMgYXJlIHVzZWQuXG4gICAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpIHVubGVzcyBAbWFpbk1vZHVsZT9cbiAgICAgICAgQG1haW5Nb2R1bGUuaW5pdGlhbGl6ZT8oQHBhY2thZ2VNYW5hZ2VyLmdldFBhY2thZ2VTdGF0ZShAbmFtZSkgPyB7fSlcbiAgICAgICAgQG1haW5Jbml0aWFsaXplZCA9IHRydWVcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIEBoYW5kbGVFcnJvcihcIkZhaWxlZCB0byBpbml0aWFsaXplIHRoZSAje0BuYW1lfSBwYWNrYWdlXCIsIGVycm9yKVxuICAgIHJldHVyblxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBncmFtbWFyc1Byb21pc2UgPz0gQGxvYWRHcmFtbWFycygpXG4gICAgQGFjdGl2YXRpb25Qcm9taXNlID89XG4gICAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICBAcmVzb2x2ZUFjdGl2YXRpb25Qcm9taXNlID0gcmVzb2x2ZVxuICAgICAgICBAbWVhc3VyZSAnYWN0aXZhdGVUaW1lJywgPT5cbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIEBhY3RpdmF0ZVJlc291cmNlcygpXG4gICAgICAgICAgICBpZiBAYWN0aXZhdGlvblNob3VsZEJlRGVmZXJyZWQoKVxuICAgICAgICAgICAgICBAc3Vic2NyaWJlVG9EZWZlcnJlZEFjdGl2YXRpb24oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBAYWN0aXZhdGVOb3coKVxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICBAaGFuZGxlRXJyb3IoXCJGYWlsZWQgdG8gYWN0aXZhdGUgdGhlICN7QG5hbWV9IHBhY2thZ2VcIiwgZXJyb3IpXG5cbiAgICBQcm9taXNlLmFsbChbQGdyYW1tYXJzUHJvbWlzZSwgQHNldHRpbmdzUHJvbWlzZSwgQGFjdGl2YXRpb25Qcm9taXNlXSlcblxuICBhY3RpdmF0ZU5vdzogLT5cbiAgICB0cnlcbiAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpIHVubGVzcyBAbWFpbk1vZHVsZT9cbiAgICAgIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25BY3RpdmF0ZSA9IEByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NYWluTW9kdWxlKClcbiAgICAgIEByZWdpc3RlclZpZXdQcm92aWRlcnMoKVxuICAgICAgQGFjdGl2YXRlU3R5bGVzaGVldHMoKVxuICAgICAgaWYgQG1haW5Nb2R1bGU/IGFuZCBub3QgQG1haW5BY3RpdmF0ZWRcbiAgICAgICAgQGluaXRpYWxpemVJZk5lZWRlZCgpXG4gICAgICAgIEBtYWluTW9kdWxlLmFjdGl2YXRlQ29uZmlnPygpXG4gICAgICAgIEBtYWluTW9kdWxlLmFjdGl2YXRlPyhAcGFja2FnZU1hbmFnZXIuZ2V0UGFja2FnZVN0YXRlKEBuYW1lKSA/IHt9KVxuICAgICAgICBAbWFpbkFjdGl2YXRlZCA9IHRydWVcbiAgICAgICAgQGFjdGl2YXRlU2VydmljZXMoKVxuICAgICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgICBAYWN0aXZhdGlvbkhvb2tTdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGhhbmRsZUVycm9yKFwiRmFpbGVkIHRvIGFjdGl2YXRlIHRoZSAje0BuYW1lfSBwYWNrYWdlXCIsIGVycm9yKVxuXG4gICAgQHJlc29sdmVBY3RpdmF0aW9uUHJvbWlzZT8oKVxuXG4gIHJlZ2lzdGVyQ29uZmlnU2NoZW1hRnJvbU1ldGFkYXRhOiAtPlxuICAgIGlmIGNvbmZpZ1NjaGVtYSA9IEBtZXRhZGF0YS5jb25maWdTY2hlbWFcbiAgICAgIEBjb25maWcuc2V0U2NoZW1hIEBuYW1lLCB7dHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IGNvbmZpZ1NjaGVtYX1cbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIHJlZ2lzdGVyQ29uZmlnU2NoZW1hRnJvbU1haW5Nb2R1bGU6IC0+XG4gICAgaWYgQG1haW5Nb2R1bGU/IGFuZCBub3QgQGNvbmZpZ1NjaGVtYVJlZ2lzdGVyZWRPbkxvYWRcbiAgICAgIGlmIEBtYWluTW9kdWxlLmNvbmZpZz8gYW5kIHR5cGVvZiBAbWFpbk1vZHVsZS5jb25maWcgaXMgJ29iamVjdCdcbiAgICAgICAgQGNvbmZpZy5zZXRTY2hlbWEgQG5hbWUsIHt0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogQG1haW5Nb2R1bGUuY29uZmlnfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIGZhbHNlXG5cbiAgIyBUT0RPOiBSZW1vdmUuIFNldHRpbmdzIHZpZXcgY2FsbHMgdGhpcyBtZXRob2QgY3VycmVudGx5LlxuICBhY3RpdmF0ZUNvbmZpZzogLT5cbiAgICByZXR1cm4gaWYgQGNvbmZpZ1NjaGVtYVJlZ2lzdGVyZWRPbkxvYWRcbiAgICBAcmVxdWlyZU1haW5Nb2R1bGUoKVxuICAgIEByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NYWluTW9kdWxlKClcblxuICBhY3RpdmF0ZVN0eWxlc2hlZXRzOiAtPlxuICAgIHJldHVybiBpZiBAc3R5bGVzaGVldHNBY3RpdmF0ZWRcblxuICAgIEBzdHlsZXNoZWV0RGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgcHJpb3JpdHkgPSBAZ2V0U3R5bGVTaGVldFByaW9yaXR5KClcbiAgICBmb3IgW3NvdXJjZVBhdGgsIHNvdXJjZV0gaW4gQHN0eWxlc2hlZXRzXG4gICAgICBpZiBtYXRjaCA9IHBhdGguYmFzZW5hbWUoc291cmNlUGF0aCkubWF0Y2goL1teLl0qXFwuKFteLl0qKVxcLi8pXG4gICAgICAgIGNvbnRleHQgPSBtYXRjaFsxXVxuICAgICAgZWxzZSBpZiBAbWV0YWRhdGEudGhlbWUgaXMgJ3N5bnRheCdcbiAgICAgICAgY29udGV4dCA9ICdhdG9tLXRleHQtZWRpdG9yJ1xuICAgICAgZWxzZVxuICAgICAgICBjb250ZXh0ID0gdW5kZWZpbmVkXG5cbiAgICAgIEBzdHlsZXNoZWV0RGlzcG9zYWJsZXMuYWRkKEBzdHlsZU1hbmFnZXIuYWRkU3R5bGVTaGVldChzb3VyY2UsIHtzb3VyY2VQYXRoLCBwcmlvcml0eSwgY29udGV4dH0pKVxuICAgIEBzdHlsZXNoZWV0c0FjdGl2YXRlZCA9IHRydWVcblxuICBhY3RpdmF0ZVJlc291cmNlczogLT5cbiAgICBAYWN0aXZhdGlvbkRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIGtleW1hcElzRGlzYWJsZWQgPSBfLmluY2x1ZGUoQGNvbmZpZy5nZXQoXCJjb3JlLnBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZFwiKSA/IFtdLCBAbmFtZSlcbiAgICBpZiBrZXltYXBJc0Rpc2FibGVkXG4gICAgICBAZGVhY3RpdmF0ZUtleW1hcHMoKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0ZUtleW1hcHMoKVxuXG4gICAgZm9yIFttZW51UGF0aCwgbWFwXSBpbiBAbWVudXMgd2hlbiBtYXBbJ2NvbnRleHQtbWVudSddP1xuICAgICAgdHJ5XG4gICAgICAgIGl0ZW1zQnlTZWxlY3RvciA9IG1hcFsnY29udGV4dC1tZW51J11cbiAgICAgICAgQGFjdGl2YXRpb25EaXNwb3NhYmxlcy5hZGQoQGNvbnRleHRNZW51TWFuYWdlci5hZGQoaXRlbXNCeVNlbGVjdG9yKSlcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIGlmIGVycm9yLmNvZGUgaXMgJ0VCQURTRUxFQ1RPUidcbiAgICAgICAgICBlcnJvci5tZXNzYWdlICs9IFwiIGluICN7bWVudVBhdGh9XCJcbiAgICAgICAgICBlcnJvci5zdGFjayArPSBcIlxcbiAgYXQgI3ttZW51UGF0aH06MToxXCJcbiAgICAgICAgdGhyb3cgZXJyb3JcblxuICAgIEBhY3RpdmF0aW9uRGlzcG9zYWJsZXMuYWRkKEBtZW51TWFuYWdlci5hZGQobWFwWydtZW51J10pKSBmb3IgW21lbnVQYXRoLCBtYXBdIGluIEBtZW51cyB3aGVuIG1hcFsnbWVudSddP1xuXG4gICAgdW5sZXNzIEBncmFtbWFyc0FjdGl2YXRlZFxuICAgICAgZ3JhbW1hci5hY3RpdmF0ZSgpIGZvciBncmFtbWFyIGluIEBncmFtbWFyc1xuICAgICAgQGdyYW1tYXJzQWN0aXZhdGVkID0gdHJ1ZVxuXG4gICAgc2V0dGluZ3MuYWN0aXZhdGUoKSBmb3Igc2V0dGluZ3MgaW4gQHNldHRpbmdzXG4gICAgQHNldHRpbmdzQWN0aXZhdGVkID0gdHJ1ZVxuXG4gIGFjdGl2YXRlS2V5bWFwczogLT5cbiAgICByZXR1cm4gaWYgQGtleW1hcEFjdGl2YXRlZFxuXG4gICAgQGtleW1hcERpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgQGtleW1hcERpc3Bvc2FibGVzLmFkZChAa2V5bWFwTWFuYWdlci5hZGQoa2V5bWFwUGF0aCwgbWFwKSkgZm9yIFtrZXltYXBQYXRoLCBtYXBdIGluIEBrZXltYXBzXG4gICAgQG1lbnVNYW5hZ2VyLnVwZGF0ZSgpXG5cbiAgICBAa2V5bWFwQWN0aXZhdGVkID0gdHJ1ZVxuXG4gIGRlYWN0aXZhdGVLZXltYXBzOiAtPlxuICAgIHJldHVybiBpZiBub3QgQGtleW1hcEFjdGl2YXRlZFxuXG4gICAgQGtleW1hcERpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAbWVudU1hbmFnZXIudXBkYXRlKClcblxuICAgIEBrZXltYXBBY3RpdmF0ZWQgPSBmYWxzZVxuXG4gIGhhc0tleW1hcHM6IC0+XG4gICAgZm9yIFtwYXRoLCBtYXBdIGluIEBrZXltYXBzXG4gICAgICBpZiBtYXAubGVuZ3RoID4gMFxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIGZhbHNlXG5cbiAgYWN0aXZhdGVTZXJ2aWNlczogLT5cbiAgICBmb3IgbmFtZSwge3ZlcnNpb25zfSBvZiBAbWV0YWRhdGEucHJvdmlkZWRTZXJ2aWNlc1xuICAgICAgc2VydmljZXNCeVZlcnNpb24gPSB7fVxuICAgICAgZm9yIHZlcnNpb24sIG1ldGhvZE5hbWUgb2YgdmVyc2lvbnNcbiAgICAgICAgaWYgdHlwZW9mIEBtYWluTW9kdWxlW21ldGhvZE5hbWVdIGlzICdmdW5jdGlvbidcbiAgICAgICAgICBzZXJ2aWNlc0J5VmVyc2lvblt2ZXJzaW9uXSA9IEBtYWluTW9kdWxlW21ldGhvZE5hbWVdKClcbiAgICAgIEBhY3RpdmF0aW9uRGlzcG9zYWJsZXMuYWRkIEBwYWNrYWdlTWFuYWdlci5zZXJ2aWNlSHViLnByb3ZpZGUobmFtZSwgc2VydmljZXNCeVZlcnNpb24pXG5cbiAgICBmb3IgbmFtZSwge3ZlcnNpb25zfSBvZiBAbWV0YWRhdGEuY29uc3VtZWRTZXJ2aWNlc1xuICAgICAgZm9yIHZlcnNpb24sIG1ldGhvZE5hbWUgb2YgdmVyc2lvbnNcbiAgICAgICAgaWYgdHlwZW9mIEBtYWluTW9kdWxlW21ldGhvZE5hbWVdIGlzICdmdW5jdGlvbidcbiAgICAgICAgICBAYWN0aXZhdGlvbkRpc3Bvc2FibGVzLmFkZCBAcGFja2FnZU1hbmFnZXIuc2VydmljZUh1Yi5jb25zdW1lKG5hbWUsIHZlcnNpb24sIEBtYWluTW9kdWxlW21ldGhvZE5hbWVdLmJpbmQoQG1haW5Nb2R1bGUpKVxuICAgIHJldHVyblxuXG4gIHJlZ2lzdGVyVHJhbnNwaWxlckNvbmZpZzogLT5cbiAgICBpZiBAbWV0YWRhdGEuYXRvbVRyYW5zcGlsZXJzXG4gICAgICBDb21waWxlQ2FjaGUuYWRkVHJhbnNwaWxlckNvbmZpZ0ZvclBhdGgoQHBhdGgsIEBuYW1lLCBAbWV0YWRhdGEsIEBtZXRhZGF0YS5hdG9tVHJhbnNwaWxlcnMpXG5cbiAgdW5yZWdpc3RlclRyYW5zcGlsZXJDb25maWc6IC0+XG4gICAgaWYgQG1ldGFkYXRhLmF0b21UcmFuc3BpbGVyc1xuICAgICAgQ29tcGlsZUNhY2hlLnJlbW92ZVRyYW5zcGlsZXJDb25maWdGb3JQYXRoKEBwYXRoKVxuXG4gIGxvYWRLZXltYXBzOiAtPlxuICAgIGlmIEBidW5kbGVkUGFja2FnZSBhbmQgQHBhY2thZ2VNYW5hZ2VyLnBhY2thZ2VzQ2FjaGVbQG5hbWVdP1xuICAgICAgQGtleW1hcHMgPSAoW1wiI3tAcGFja2FnZU1hbmFnZXIucmVzb3VyY2VQYXRofSN7cGF0aC5zZXB9I3trZXltYXBQYXRofVwiLCBrZXltYXBPYmplY3RdIGZvciBrZXltYXBQYXRoLCBrZXltYXBPYmplY3Qgb2YgQHBhY2thZ2VNYW5hZ2VyLnBhY2thZ2VzQ2FjaGVbQG5hbWVdLmtleW1hcHMpXG4gICAgZWxzZVxuICAgICAgQGtleW1hcHMgPSBAZ2V0S2V5bWFwUGF0aHMoKS5tYXAgKGtleW1hcFBhdGgpIC0+IFtrZXltYXBQYXRoLCBDU09OLnJlYWRGaWxlU3luYyhrZXltYXBQYXRoLCBhbGxvd0R1cGxpY2F0ZUtleXM6IGZhbHNlKSA/IHt9XVxuICAgIHJldHVyblxuXG4gIGxvYWRNZW51czogLT5cbiAgICBpZiBAYnVuZGxlZFBhY2thZ2UgYW5kIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXT9cbiAgICAgIEBtZW51cyA9IChbXCIje0BwYWNrYWdlTWFuYWdlci5yZXNvdXJjZVBhdGh9I3twYXRoLnNlcH0je21lbnVQYXRofVwiLCBtZW51T2JqZWN0XSBmb3IgbWVudVBhdGgsIG1lbnVPYmplY3Qgb2YgQHBhY2thZ2VNYW5hZ2VyLnBhY2thZ2VzQ2FjaGVbQG5hbWVdLm1lbnVzKVxuICAgIGVsc2VcbiAgICAgIEBtZW51cyA9IEBnZXRNZW51UGF0aHMoKS5tYXAgKG1lbnVQYXRoKSAtPiBbbWVudVBhdGgsIENTT04ucmVhZEZpbGVTeW5jKG1lbnVQYXRoKSA/IHt9XVxuICAgIHJldHVyblxuXG4gIGdldEtleW1hcFBhdGhzOiAtPlxuICAgIGtleW1hcHNEaXJQYXRoID0gcGF0aC5qb2luKEBwYXRoLCAna2V5bWFwcycpXG4gICAgaWYgQG1ldGFkYXRhLmtleW1hcHNcbiAgICAgIEBtZXRhZGF0YS5rZXltYXBzLm1hcCAobmFtZSkgLT4gZnMucmVzb2x2ZShrZXltYXBzRGlyUGF0aCwgbmFtZSwgWydqc29uJywgJ2Nzb24nLCAnJ10pXG4gICAgZWxzZVxuICAgICAgZnMubGlzdFN5bmMoa2V5bWFwc0RpclBhdGgsIFsnY3NvbicsICdqc29uJ10pXG5cbiAgZ2V0TWVudVBhdGhzOiAtPlxuICAgIG1lbnVzRGlyUGF0aCA9IHBhdGguam9pbihAcGF0aCwgJ21lbnVzJylcbiAgICBpZiBAbWV0YWRhdGEubWVudXNcbiAgICAgIEBtZXRhZGF0YS5tZW51cy5tYXAgKG5hbWUpIC0+IGZzLnJlc29sdmUobWVudXNEaXJQYXRoLCBuYW1lLCBbJ2pzb24nLCAnY3NvbicsICcnXSlcbiAgICBlbHNlXG4gICAgICBmcy5saXN0U3luYyhtZW51c0RpclBhdGgsIFsnY3NvbicsICdqc29uJ10pXG5cbiAgbG9hZFN0eWxlc2hlZXRzOiAtPlxuICAgIEBzdHlsZXNoZWV0cyA9IEBnZXRTdHlsZXNoZWV0UGF0aHMoKS5tYXAgKHN0eWxlc2hlZXRQYXRoKSA9PlxuICAgICAgW3N0eWxlc2hlZXRQYXRoLCBAdGhlbWVNYW5hZ2VyLmxvYWRTdHlsZXNoZWV0KHN0eWxlc2hlZXRQYXRoLCB0cnVlKV1cblxuICByZWdpc3RlckRlc2VyaWFsaXplck1ldGhvZHM6IC0+XG4gICAgaWYgQG1ldGFkYXRhLmRlc2VyaWFsaXplcnM/XG4gICAgICBPYmplY3Qua2V5cyhAbWV0YWRhdGEuZGVzZXJpYWxpemVycykuZm9yRWFjaCAoZGVzZXJpYWxpemVyTmFtZSkgPT5cbiAgICAgICAgbWV0aG9kTmFtZSA9IEBtZXRhZGF0YS5kZXNlcmlhbGl6ZXJzW2Rlc2VyaWFsaXplck5hbWVdXG4gICAgICAgIGF0b20uZGVzZXJpYWxpemVycy5hZGRcbiAgICAgICAgICBuYW1lOiBkZXNlcmlhbGl6ZXJOYW1lLFxuICAgICAgICAgIGRlc2VyaWFsaXplOiAoc3RhdGUsIGF0b21FbnZpcm9ubWVudCkgPT5cbiAgICAgICAgICAgIEByZWdpc3RlclZpZXdQcm92aWRlcnMoKVxuICAgICAgICAgICAgQHJlcXVpcmVNYWluTW9kdWxlKClcbiAgICAgICAgICAgIEBpbml0aWFsaXplSWZOZWVkZWQoKVxuICAgICAgICAgICAgQG1haW5Nb2R1bGVbbWV0aG9kTmFtZV0oc3RhdGUsIGF0b21FbnZpcm9ubWVudClcbiAgICAgIHJldHVyblxuXG4gIGFjdGl2YXRlQ29yZVN0YXJ0dXBTZXJ2aWNlczogLT5cbiAgICBpZiBkaXJlY3RvcnlQcm92aWRlclNlcnZpY2UgPSBAbWV0YWRhdGEucHJvdmlkZWRTZXJ2aWNlcz9bJ2F0b20uZGlyZWN0b3J5LXByb3ZpZGVyJ11cbiAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpXG4gICAgICBzZXJ2aWNlc0J5VmVyc2lvbiA9IHt9XG4gICAgICBmb3IgdmVyc2lvbiwgbWV0aG9kTmFtZSBvZiBkaXJlY3RvcnlQcm92aWRlclNlcnZpY2UudmVyc2lvbnNcbiAgICAgICAgaWYgdHlwZW9mIEBtYWluTW9kdWxlW21ldGhvZE5hbWVdIGlzICdmdW5jdGlvbidcbiAgICAgICAgICBzZXJ2aWNlc0J5VmVyc2lvblt2ZXJzaW9uXSA9IEBtYWluTW9kdWxlW21ldGhvZE5hbWVdKClcbiAgICAgIEBwYWNrYWdlTWFuYWdlci5zZXJ2aWNlSHViLnByb3ZpZGUoJ2F0b20uZGlyZWN0b3J5LXByb3ZpZGVyJywgc2VydmljZXNCeVZlcnNpb24pXG5cbiAgcmVnaXN0ZXJWaWV3UHJvdmlkZXJzOiAtPlxuICAgIGlmIEBtZXRhZGF0YS52aWV3UHJvdmlkZXJzPyBhbmQgbm90IEByZWdpc3RlcmVkVmlld1Byb3ZpZGVyc1xuICAgICAgQHJlcXVpcmVNYWluTW9kdWxlKClcbiAgICAgIEBtZXRhZGF0YS52aWV3UHJvdmlkZXJzLmZvckVhY2ggKG1ldGhvZE5hbWUpID0+XG4gICAgICAgIEB2aWV3UmVnaXN0cnkuYWRkVmlld1Byb3ZpZGVyIChtb2RlbCkgPT5cbiAgICAgICAgICBAaW5pdGlhbGl6ZUlmTmVlZGVkKClcbiAgICAgICAgICBAbWFpbk1vZHVsZVttZXRob2ROYW1lXShtb2RlbClcbiAgICAgIEByZWdpc3RlcmVkVmlld1Byb3ZpZGVycyA9IHRydWVcblxuICBnZXRTdHlsZXNoZWV0c1BhdGg6IC0+XG4gICAgcGF0aC5qb2luKEBwYXRoLCAnc3R5bGVzJylcblxuICBnZXRTdHlsZXNoZWV0UGF0aHM6IC0+XG4gICAgc3R5bGVzaGVldERpclBhdGggPSBAZ2V0U3R5bGVzaGVldHNQYXRoKClcbiAgICBpZiBAbWV0YWRhdGEubWFpblN0eWxlU2hlZXRcbiAgICAgIFtmcy5yZXNvbHZlKEBwYXRoLCBAbWV0YWRhdGEubWFpblN0eWxlU2hlZXQpXVxuICAgIGVsc2UgaWYgQG1ldGFkYXRhLnN0eWxlU2hlZXRzXG4gICAgICBAbWV0YWRhdGEuc3R5bGVTaGVldHMubWFwIChuYW1lKSAtPiBmcy5yZXNvbHZlKHN0eWxlc2hlZXREaXJQYXRoLCBuYW1lLCBbJ2NzcycsICdsZXNzJywgJyddKVxuICAgIGVsc2UgaWYgaW5kZXhTdHlsZXNoZWV0ID0gZnMucmVzb2x2ZShAcGF0aCwgJ2luZGV4JywgWydjc3MnLCAnbGVzcyddKVxuICAgICAgW2luZGV4U3R5bGVzaGVldF1cbiAgICBlbHNlXG4gICAgICBmcy5saXN0U3luYyhzdHlsZXNoZWV0RGlyUGF0aCwgWydjc3MnLCAnbGVzcyddKVxuXG4gIGxvYWRHcmFtbWFyc1N5bmM6IC0+XG4gICAgcmV0dXJuIGlmIEBncmFtbWFyc0xvYWRlZFxuXG4gICAgZ3JhbW1hcnNEaXJQYXRoID0gcGF0aC5qb2luKEBwYXRoLCAnZ3JhbW1hcnMnKVxuICAgIGdyYW1tYXJQYXRocyA9IGZzLmxpc3RTeW5jKGdyYW1tYXJzRGlyUGF0aCwgWydqc29uJywgJ2Nzb24nXSlcbiAgICBmb3IgZ3JhbW1hclBhdGggaW4gZ3JhbW1hclBhdGhzXG4gICAgICB0cnlcbiAgICAgICAgZ3JhbW1hciA9IEBncmFtbWFyUmVnaXN0cnkucmVhZEdyYW1tYXJTeW5jKGdyYW1tYXJQYXRoKVxuICAgICAgICBncmFtbWFyLnBhY2thZ2VOYW1lID0gQG5hbWVcbiAgICAgICAgZ3JhbW1hci5idW5kbGVkUGFja2FnZSA9IEBidW5kbGVkUGFja2FnZVxuICAgICAgICBAZ3JhbW1hcnMucHVzaChncmFtbWFyKVxuICAgICAgICBncmFtbWFyLmFjdGl2YXRlKClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIGNvbnNvbGUud2FybihcIkZhaWxlZCB0byBsb2FkIGdyYW1tYXI6ICN7Z3JhbW1hclBhdGh9XCIsIGVycm9yLnN0YWNrID8gZXJyb3IpXG5cbiAgICBAZ3JhbW1hcnNMb2FkZWQgPSB0cnVlXG4gICAgQGdyYW1tYXJzQWN0aXZhdGVkID0gdHJ1ZVxuXG4gIGxvYWRHcmFtbWFyczogLT5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgaWYgQGdyYW1tYXJzTG9hZGVkXG5cbiAgICBsb2FkR3JhbW1hciA9IChncmFtbWFyUGF0aCwgY2FsbGJhY2spID0+XG4gICAgICBAZ3JhbW1hclJlZ2lzdHJ5LnJlYWRHcmFtbWFyIGdyYW1tYXJQYXRoLCAoZXJyb3IsIGdyYW1tYXIpID0+XG4gICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgIGRldGFpbCA9IFwiI3tlcnJvci5tZXNzYWdlfSBpbiAje2dyYW1tYXJQYXRofVwiXG4gICAgICAgICAgc3RhY2sgPSBcIiN7ZXJyb3Iuc3RhY2t9XFxuICBhdCAje2dyYW1tYXJQYXRofToxOjFcIlxuICAgICAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZEZhdGFsRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCBhICN7QG5hbWV9IHBhY2thZ2UgZ3JhbW1hclwiLCB7c3RhY2ssIGRldGFpbCwgcGFja2FnZU5hbWU6IEBuYW1lLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBncmFtbWFyLnBhY2thZ2VOYW1lID0gQG5hbWVcbiAgICAgICAgICBncmFtbWFyLmJ1bmRsZWRQYWNrYWdlID0gQGJ1bmRsZWRQYWNrYWdlXG4gICAgICAgICAgQGdyYW1tYXJzLnB1c2goZ3JhbW1hcilcbiAgICAgICAgICBncmFtbWFyLmFjdGl2YXRlKCkgaWYgQGdyYW1tYXJzQWN0aXZhdGVkXG4gICAgICAgIGNhbGxiYWNrKClcblxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgZ3JhbW1hcnNEaXJQYXRoID0gcGF0aC5qb2luKEBwYXRoLCAnZ3JhbW1hcnMnKVxuICAgICAgZnMuZXhpc3RzIGdyYW1tYXJzRGlyUGF0aCwgKGdyYW1tYXJzRGlyRXhpc3RzKSAtPlxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpIHVubGVzcyBncmFtbWFyc0RpckV4aXN0c1xuXG4gICAgICAgIGZzLmxpc3QgZ3JhbW1hcnNEaXJQYXRoLCBbJ2pzb24nLCAnY3NvbiddLCAoZXJyb3IsIGdyYW1tYXJQYXRocz1bXSkgLT5cbiAgICAgICAgICBhc3luYy5lYWNoIGdyYW1tYXJQYXRocywgbG9hZEdyYW1tYXIsIC0+IHJlc29sdmUoKVxuXG4gIGxvYWRTZXR0aW5nczogLT5cbiAgICBAc2V0dGluZ3MgPSBbXVxuXG4gICAgbG9hZFNldHRpbmdzRmlsZSA9IChzZXR0aW5nc1BhdGgsIGNhbGxiYWNrKSA9PlxuICAgICAgU2NvcGVkUHJvcGVydGllcy5sb2FkIHNldHRpbmdzUGF0aCwgQGNvbmZpZywgKGVycm9yLCBzZXR0aW5ncykgPT5cbiAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgZGV0YWlsID0gXCIje2Vycm9yLm1lc3NhZ2V9IGluICN7c2V0dGluZ3NQYXRofVwiXG4gICAgICAgICAgc3RhY2sgPSBcIiN7ZXJyb3Iuc3RhY2t9XFxuICBhdCAje3NldHRpbmdzUGF0aH06MToxXCJcbiAgICAgICAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRGYXRhbEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdGhlICN7QG5hbWV9IHBhY2thZ2Ugc2V0dGluZ3NcIiwge3N0YWNrLCBkZXRhaWwsIHBhY2thZ2VOYW1lOiBAbmFtZSwgZGlzbWlzc2FibGU6IHRydWV9KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHNldHRpbmdzLnB1c2goc2V0dGluZ3MpXG4gICAgICAgICAgc2V0dGluZ3MuYWN0aXZhdGUoKSBpZiBAc2V0dGluZ3NBY3RpdmF0ZWRcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICBzZXR0aW5nc0RpclBhdGggPSBwYXRoLmpvaW4oQHBhdGgsICdzZXR0aW5ncycpXG5cbiAgICAgIGZzLmV4aXN0cyBzZXR0aW5nc0RpclBhdGgsIChzZXR0aW5nc0RpckV4aXN0cykgLT5cbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKSB1bmxlc3Mgc2V0dGluZ3NEaXJFeGlzdHNcblxuICAgICAgICBmcy5saXN0IHNldHRpbmdzRGlyUGF0aCwgWydqc29uJywgJ2Nzb24nXSwgKGVycm9yLCBzZXR0aW5nc1BhdGhzPVtdKSAtPlxuICAgICAgICAgIGFzeW5jLmVhY2ggc2V0dGluZ3NQYXRocywgbG9hZFNldHRpbmdzRmlsZSwgLT4gcmVzb2x2ZSgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGlmIEBtYWluQWN0aXZhdGVkXG4gICAgICB0cnlcbiAgICAgICAgQG1haW5Nb2R1bGU/LnNlcmlhbGl6ZT8oKVxuICAgICAgY2F0Y2ggZVxuICAgICAgICBjb25zb2xlLmVycm9yIFwiRXJyb3Igc2VyaWFsaXppbmcgcGFja2FnZSAnI3tAbmFtZX0nXCIsIGUuc3RhY2tcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBhY3RpdmF0aW9uUHJvbWlzZSA9IG51bGxcbiAgICBAcmVzb2x2ZUFjdGl2YXRpb25Qcm9taXNlID0gbnVsbFxuICAgIEBhY3RpdmF0aW9uQ29tbWFuZFN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBhY3RpdmF0aW9uSG9va1N1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25BY3RpdmF0ZSA9IGZhbHNlXG4gICAgQGRlYWN0aXZhdGVSZXNvdXJjZXMoKVxuICAgIEBkZWFjdGl2YXRlS2V5bWFwcygpXG4gICAgaWYgQG1haW5BY3RpdmF0ZWRcbiAgICAgIHRyeVxuICAgICAgICBAbWFpbk1vZHVsZT8uZGVhY3RpdmF0ZT8oKVxuICAgICAgICBAbWFpbk1vZHVsZT8uZGVhY3RpdmF0ZUNvbmZpZz8oKVxuICAgICAgICBAbWFpbkFjdGl2YXRlZCA9IGZhbHNlXG4gICAgICAgIEBtYWluSW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgICAgY2F0Y2ggZVxuICAgICAgICBjb25zb2xlLmVycm9yIFwiRXJyb3IgZGVhY3RpdmF0aW5nIHBhY2thZ2UgJyN7QG5hbWV9J1wiLCBlLnN0YWNrXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWRlYWN0aXZhdGUnXG5cbiAgZGVhY3RpdmF0ZVJlc291cmNlczogLT5cbiAgICBncmFtbWFyLmRlYWN0aXZhdGUoKSBmb3IgZ3JhbW1hciBpbiBAZ3JhbW1hcnNcbiAgICBzZXR0aW5ncy5kZWFjdGl2YXRlKCkgZm9yIHNldHRpbmdzIGluIEBzZXR0aW5nc1xuICAgIEBzdHlsZXNoZWV0RGlzcG9zYWJsZXM/LmRpc3Bvc2UoKVxuICAgIEBhY3RpdmF0aW9uRGlzcG9zYWJsZXM/LmRpc3Bvc2UoKVxuICAgIEBrZXltYXBEaXNwb3NhYmxlcz8uZGlzcG9zZSgpXG4gICAgQHN0eWxlc2hlZXRzQWN0aXZhdGVkID0gZmFsc2VcbiAgICBAZ3JhbW1hcnNBY3RpdmF0ZWQgPSBmYWxzZVxuICAgIEBzZXR0aW5nc0FjdGl2YXRlZCA9IGZhbHNlXG5cbiAgcmVsb2FkU3R5bGVzaGVldHM6IC0+XG4gICAgdHJ5XG4gICAgICBAbG9hZFN0eWxlc2hlZXRzKClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGhhbmRsZUVycm9yKFwiRmFpbGVkIHRvIHJlbG9hZCB0aGUgI3tAbmFtZX0gcGFja2FnZSBzdHlsZXNoZWV0c1wiLCBlcnJvcilcblxuICAgIEBzdHlsZXNoZWV0RGlzcG9zYWJsZXM/LmRpc3Bvc2UoKVxuICAgIEBzdHlsZXNoZWV0RGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdHlsZXNoZWV0c0FjdGl2YXRlZCA9IGZhbHNlXG4gICAgQGFjdGl2YXRlU3R5bGVzaGVldHMoKVxuXG4gIHJlcXVpcmVNYWluTW9kdWxlOiAtPlxuICAgIHJldHVybiBAbWFpbk1vZHVsZSBpZiBAbWFpbk1vZHVsZVJlcXVpcmVkXG4gICAgdW5sZXNzIEBpc0NvbXBhdGlibGUoKVxuICAgICAgY29uc29sZS53YXJuIFwiXCJcIlxuICAgICAgICBGYWlsZWQgdG8gcmVxdWlyZSB0aGUgbWFpbiBtb2R1bGUgb2YgJyN7QG5hbWV9JyBiZWNhdXNlIGl0IHJlcXVpcmVzIG9uZSBvciBtb3JlIGluY29tcGF0aWJsZSBuYXRpdmUgbW9kdWxlcyAoI3tfLnBsdWNrKEBpbmNvbXBhdGlibGVNb2R1bGVzLCAnbmFtZScpLmpvaW4oJywgJyl9KS5cbiAgICAgICAgUnVuIGBhcG0gcmVidWlsZGAgaW4gdGhlIHBhY2thZ2UgZGlyZWN0b3J5IGFuZCByZXN0YXJ0IEF0b20gdG8gcmVzb2x2ZS5cbiAgICAgIFwiXCJcIlxuICAgICAgcmV0dXJuXG4gICAgbWFpbk1vZHVsZVBhdGggPSBAZ2V0TWFpbk1vZHVsZVBhdGgoKVxuICAgIGlmIGZzLmlzRmlsZVN5bmMobWFpbk1vZHVsZVBhdGgpXG4gICAgICBAbWFpbk1vZHVsZVJlcXVpcmVkID0gdHJ1ZVxuXG4gICAgICBwcmV2aW91c1ZpZXdQcm92aWRlckNvdW50ID0gQHZpZXdSZWdpc3RyeS5nZXRWaWV3UHJvdmlkZXJDb3VudCgpXG4gICAgICBwcmV2aW91c0Rlc2VyaWFsaXplckNvdW50ID0gQGRlc2VyaWFsaXplck1hbmFnZXIuZ2V0RGVzZXJpYWxpemVyQ291bnQoKVxuICAgICAgQG1haW5Nb2R1bGUgPSByZXF1aXJlKG1haW5Nb2R1bGVQYXRoKVxuICAgICAgaWYgKEB2aWV3UmVnaXN0cnkuZ2V0Vmlld1Byb3ZpZGVyQ291bnQoKSBpcyBwcmV2aW91c1ZpZXdQcm92aWRlckNvdW50IGFuZFxuICAgICAgICAgIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyLmdldERlc2VyaWFsaXplckNvdW50KCkgaXMgcHJldmlvdXNEZXNlcmlhbGl6ZXJDb3VudClcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQGdldENhbkRlZmVyTWFpbk1vZHVsZVJlcXVpcmVTdG9yYWdlS2V5KCksICd0cnVlJylcblxuICBnZXRNYWluTW9kdWxlUGF0aDogLT5cbiAgICByZXR1cm4gQG1haW5Nb2R1bGVQYXRoIGlmIEByZXNvbHZlZE1haW5Nb2R1bGVQYXRoXG4gICAgQHJlc29sdmVkTWFpbk1vZHVsZVBhdGggPSB0cnVlXG5cbiAgICBpZiBAYnVuZGxlZFBhY2thZ2UgYW5kIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXT9cbiAgICAgIGlmIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXS5tYWluXG4gICAgICAgIEBtYWluTW9kdWxlUGF0aCA9IFwiI3tAcGFja2FnZU1hbmFnZXIucmVzb3VyY2VQYXRofSN7cGF0aC5zZXB9I3tAcGFja2FnZU1hbmFnZXIucGFja2FnZXNDYWNoZVtAbmFtZV0ubWFpbn1cIlxuICAgICAgZWxzZVxuICAgICAgICBAbWFpbk1vZHVsZVBhdGggPSBudWxsXG4gICAgZWxzZVxuICAgICAgbWFpbk1vZHVsZVBhdGggPVxuICAgICAgICBpZiBAbWV0YWRhdGEubWFpblxuICAgICAgICAgIHBhdGguam9pbihAcGF0aCwgQG1ldGFkYXRhLm1haW4pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwYXRoLmpvaW4oQHBhdGgsICdpbmRleCcpXG4gICAgICBAbWFpbk1vZHVsZVBhdGggPSBmcy5yZXNvbHZlRXh0ZW5zaW9uKG1haW5Nb2R1bGVQYXRoLCBbXCJcIiwgXy5rZXlzKHJlcXVpcmUuZXh0ZW5zaW9ucykuLi5dKVxuXG4gIGFjdGl2YXRpb25TaG91bGRCZURlZmVycmVkOiAtPlxuICAgIEBoYXNBY3RpdmF0aW9uQ29tbWFuZHMoKSBvciBAaGFzQWN0aXZhdGlvbkhvb2tzKClcblxuICBoYXNBY3RpdmF0aW9uSG9va3M6IC0+XG4gICAgQGdldEFjdGl2YXRpb25Ib29rcygpPy5sZW5ndGggPiAwXG5cbiAgaGFzQWN0aXZhdGlvbkNvbW1hbmRzOiAtPlxuICAgIGZvciBzZWxlY3RvciwgY29tbWFuZHMgb2YgQGdldEFjdGl2YXRpb25Db21tYW5kcygpXG4gICAgICByZXR1cm4gdHJ1ZSBpZiBjb21tYW5kcy5sZW5ndGggPiAwXG4gICAgZmFsc2VcblxuICBzdWJzY3JpYmVUb0RlZmVycmVkQWN0aXZhdGlvbjogLT5cbiAgICBAc3Vic2NyaWJlVG9BY3RpdmF0aW9uQ29tbWFuZHMoKVxuICAgIEBzdWJzY3JpYmVUb0FjdGl2YXRpb25Ib29rcygpXG5cbiAgc3Vic2NyaWJlVG9BY3RpdmF0aW9uQ29tbWFuZHM6IC0+XG4gICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgZm9yIHNlbGVjdG9yLCBjb21tYW5kcyBvZiBAZ2V0QWN0aXZhdGlvbkNvbW1hbmRzKClcbiAgICAgIGZvciBjb21tYW5kIGluIGNvbW1hbmRzXG4gICAgICAgIGRvIChzZWxlY3RvciwgY29tbWFuZCkgPT5cbiAgICAgICAgICAjIEFkZCBkdW1teSBjb21tYW5kIHNvIGl0IGFwcGVhcnMgaW4gbWVudS5cbiAgICAgICAgICAjIFRoZSByZWFsIGNvbW1hbmQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHBhY2thZ2UgYWN0aXZhdGlvblxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucy5hZGQgQGNvbW1hbmRSZWdpc3RyeS5hZGQgc2VsZWN0b3IsIGNvbW1hbmQsIC0+XG4gICAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICAgIGlmIGVycm9yLmNvZGUgaXMgJ0VCQURTRUxFQ1RPUidcbiAgICAgICAgICAgICAgbWV0YWRhdGFQYXRoID0gcGF0aC5qb2luKEBwYXRoLCAncGFja2FnZS5qc29uJylcbiAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSArPSBcIiBpbiAje21ldGFkYXRhUGF0aH1cIlxuICAgICAgICAgICAgICBlcnJvci5zdGFjayArPSBcIlxcbiAgYXQgI3ttZXRhZGF0YVBhdGh9OjE6MVwiXG4gICAgICAgICAgICB0aHJvdyBlcnJvclxuXG4gICAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucy5hZGQgQGNvbW1hbmRSZWdpc3RyeS5vbldpbGxEaXNwYXRjaCAoZXZlbnQpID0+XG4gICAgICAgICAgICByZXR1cm4gdW5sZXNzIGV2ZW50LnR5cGUgaXMgY29tbWFuZFxuICAgICAgICAgICAgY3VycmVudFRhcmdldCA9IGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgd2hpbGUgY3VycmVudFRhcmdldFxuICAgICAgICAgICAgICBpZiBjdXJyZW50VGFyZ2V0LndlYmtpdE1hdGNoZXNTZWxlY3RvcihzZWxlY3RvcilcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGlvbkNvbW1hbmRTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZU5vdygpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQucGFyZW50RWxlbWVudFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgcmV0dXJuXG5cbiAgZ2V0QWN0aXZhdGlvbkNvbW1hbmRzOiAtPlxuICAgIHJldHVybiBAYWN0aXZhdGlvbkNvbW1hbmRzIGlmIEBhY3RpdmF0aW9uQ29tbWFuZHM/XG5cbiAgICBAYWN0aXZhdGlvbkNvbW1hbmRzID0ge31cblxuICAgIGlmIEBtZXRhZGF0YS5hY3RpdmF0aW9uQ29tbWFuZHM/XG4gICAgICBmb3Igc2VsZWN0b3IsIGNvbW1hbmRzIG9mIEBtZXRhZGF0YS5hY3RpdmF0aW9uQ29tbWFuZHNcbiAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kc1tzZWxlY3Rvcl0gPz0gW11cbiAgICAgICAgaWYgXy5pc1N0cmluZyhjb21tYW5kcylcbiAgICAgICAgICBAYWN0aXZhdGlvbkNvbW1hbmRzW3NlbGVjdG9yXS5wdXNoKGNvbW1hbmRzKVxuICAgICAgICBlbHNlIGlmIF8uaXNBcnJheShjb21tYW5kcylcbiAgICAgICAgICBAYWN0aXZhdGlvbkNvbW1hbmRzW3NlbGVjdG9yXS5wdXNoKGNvbW1hbmRzLi4uKVxuXG4gICAgQGFjdGl2YXRpb25Db21tYW5kc1xuXG4gIHN1YnNjcmliZVRvQWN0aXZhdGlvbkhvb2tzOiAtPlxuICAgIEBhY3RpdmF0aW9uSG9va1N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIGZvciBob29rIGluIEBnZXRBY3RpdmF0aW9uSG9va3MoKVxuICAgICAgZG8gKGhvb2spID0+XG4gICAgICAgIEBhY3RpdmF0aW9uSG9va1N1YnNjcmlwdGlvbnMuYWRkKEBwYWNrYWdlTWFuYWdlci5vbkRpZFRyaWdnZXJBY3RpdmF0aW9uSG9vayhob29rLCA9PiBAYWN0aXZhdGVOb3coKSkpIGlmIGhvb2s/IGFuZCBfLmlzU3RyaW5nKGhvb2spIGFuZCBob29rLnRyaW0oKS5sZW5ndGggPiAwXG5cbiAgICByZXR1cm5cblxuICBnZXRBY3RpdmF0aW9uSG9va3M6IC0+XG4gICAgcmV0dXJuIEBhY3RpdmF0aW9uSG9va3MgaWYgQG1ldGFkYXRhPyBhbmQgQGFjdGl2YXRpb25Ib29rcz9cblxuICAgIEBhY3RpdmF0aW9uSG9va3MgPSBbXVxuXG4gICAgaWYgQG1ldGFkYXRhLmFjdGl2YXRpb25Ib29rcz9cbiAgICAgIGlmIF8uaXNBcnJheShAbWV0YWRhdGEuYWN0aXZhdGlvbkhvb2tzKVxuICAgICAgICBAYWN0aXZhdGlvbkhvb2tzLnB1c2goQG1ldGFkYXRhLmFjdGl2YXRpb25Ib29rcy4uLilcbiAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyhAbWV0YWRhdGEuYWN0aXZhdGlvbkhvb2tzKVxuICAgICAgICBAYWN0aXZhdGlvbkhvb2tzLnB1c2goQG1ldGFkYXRhLmFjdGl2YXRpb25Ib29rcylcblxuICAgIEBhY3RpdmF0aW9uSG9va3MgPSBfLnVuaXEoQGFjdGl2YXRpb25Ib29rcylcblxuICAjIERvZXMgdGhlIGdpdmVuIG1vZHVsZSBwYXRoIGNvbnRhaW4gbmF0aXZlIGNvZGU/XG4gIGlzTmF0aXZlTW9kdWxlOiAobW9kdWxlUGF0aCkgLT5cbiAgICB0cnlcbiAgICAgIGZzLmxpc3RTeW5jKHBhdGguam9pbihtb2R1bGVQYXRoLCAnYnVpbGQnLCAnUmVsZWFzZScpLCBbJy5ub2RlJ10pLmxlbmd0aCA+IDBcbiAgICBjYXRjaCBlcnJvclxuICAgICAgZmFsc2VcblxuICAjIEdldCBhbiBhcnJheSBvZiBhbGwgdGhlIG5hdGl2ZSBtb2R1bGVzIHRoYXQgdGhpcyBwYWNrYWdlIGRlcGVuZHMgb24uXG4gICNcbiAgIyBGaXJzdCB0cnkgdG8gZ2V0IHRoaXMgaW5mb3JtYXRpb24gZnJvbVxuICAjIEBtZXRhZGF0YS5fYXRvbU1vZHVsZUNhY2hlLmV4dGVuc2lvbnMuIElmIEBtZXRhZGF0YS5fYXRvbU1vZHVsZUNhY2hlIGRvZXNuJ3RcbiAgIyBleGlzdCwgcmVjdXJzZSB0aHJvdWdoIGFsbCBkZXBlbmRlbmNpZXMuXG4gIGdldE5hdGl2ZU1vZHVsZURlcGVuZGVuY3lQYXRoczogLT5cbiAgICBuYXRpdmVNb2R1bGVQYXRocyA9IFtdXG5cbiAgICBpZiBAbWV0YWRhdGEuX2F0b21Nb2R1bGVDYWNoZT9cbiAgICAgIHJlbGF0aXZlTmF0aXZlTW9kdWxlQmluZGluZ1BhdGhzID0gQG1ldGFkYXRhLl9hdG9tTW9kdWxlQ2FjaGUuZXh0ZW5zaW9ucz9bJy5ub2RlJ10gPyBbXVxuICAgICAgZm9yIHJlbGF0aXZlTmF0aXZlTW9kdWxlQmluZGluZ1BhdGggaW4gcmVsYXRpdmVOYXRpdmVNb2R1bGVCaW5kaW5nUGF0aHNcbiAgICAgICAgbmF0aXZlTW9kdWxlUGF0aCA9IHBhdGguam9pbihAcGF0aCwgcmVsYXRpdmVOYXRpdmVNb2R1bGVCaW5kaW5nUGF0aCwgJy4uJywgJy4uJywgJy4uJylcbiAgICAgICAgbmF0aXZlTW9kdWxlUGF0aHMucHVzaChuYXRpdmVNb2R1bGVQYXRoKVxuICAgICAgcmV0dXJuIG5hdGl2ZU1vZHVsZVBhdGhzXG5cbiAgICB0cmF2ZXJzZVBhdGggPSAobm9kZU1vZHVsZXNQYXRoKSA9PlxuICAgICAgdHJ5XG4gICAgICAgIGZvciBtb2R1bGVQYXRoIGluIGZzLmxpc3RTeW5jKG5vZGVNb2R1bGVzUGF0aClcbiAgICAgICAgICBuYXRpdmVNb2R1bGVQYXRocy5wdXNoKG1vZHVsZVBhdGgpIGlmIEBpc05hdGl2ZU1vZHVsZShtb2R1bGVQYXRoKVxuICAgICAgICAgIHRyYXZlcnNlUGF0aChwYXRoLmpvaW4obW9kdWxlUGF0aCwgJ25vZGVfbW9kdWxlcycpKVxuICAgICAgcmV0dXJuXG5cbiAgICB0cmF2ZXJzZVBhdGgocGF0aC5qb2luKEBwYXRoLCAnbm9kZV9tb2R1bGVzJykpXG4gICAgbmF0aXZlTW9kdWxlUGF0aHNcblxuICAjIyNcbiAgU2VjdGlvbjogTmF0aXZlIE1vZHVsZSBDb21wYXRpYmlsaXR5XG4gICMjI1xuXG4gICMgRXh0ZW5kZWQ6IEFyZSBhbGwgbmF0aXZlIG1vZHVsZXMgZGVwZW5kZWQgb24gYnkgdGhpcyBwYWNrYWdlIGNvcnJlY3RseVxuICAjIGNvbXBpbGVkIGFnYWluc3QgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiBBdG9tP1xuICAjXG4gICMgSW5jb21wYXRpYmxlIHBhY2thZ2VzIGNhbm5vdCBiZSBhY3RpdmF0ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LCB0cnVlIGlmIGNvbXBhdGlibGUsIGZhbHNlIGlmIGluY29tcGF0aWJsZS5cbiAgaXNDb21wYXRpYmxlOiAtPlxuICAgIHJldHVybiBAY29tcGF0aWJsZSBpZiBAY29tcGF0aWJsZT9cblxuICAgIGlmIEBwYXRoLmluZGV4T2YocGF0aC5qb2luKEBwYWNrYWdlTWFuYWdlci5yZXNvdXJjZVBhdGgsICdub2RlX21vZHVsZXMnKSArIHBhdGguc2VwKSBpcyAwXG4gICAgICAjIEJ1bmRsZWQgcGFja2FnZXMgYXJlIGFsd2F5cyBjb25zaWRlcmVkIGNvbXBhdGlibGVcbiAgICAgIEBjb21wYXRpYmxlID0gdHJ1ZVxuICAgIGVsc2UgaWYgQGdldE1haW5Nb2R1bGVQYXRoKClcbiAgICAgIEBpbmNvbXBhdGlibGVNb2R1bGVzID0gQGdldEluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXMoKVxuICAgICAgQGNvbXBhdGlibGUgPSBAaW5jb21wYXRpYmxlTW9kdWxlcy5sZW5ndGggaXMgMCBhbmQgbm90IEBnZXRCdWlsZEZhaWx1cmVPdXRwdXQoKT9cbiAgICBlbHNlXG4gICAgICBAY29tcGF0aWJsZSA9IHRydWVcblxuICAjIEV4dGVuZGVkOiBSZWJ1aWxkIG5hdGl2ZSBtb2R1bGVzIGluIHRoaXMgcGFja2FnZSdzIGRlcGVuZGVuY2llcyBmb3IgdGhlXG4gICMgY3VycmVudCB2ZXJzaW9uIG9mIEF0b20uXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgcmVzb2x2ZXMgd2l0aCBhbiBvYmplY3QgY29udGFpbmluZyBgY29kZWAsXG4gICMgYHN0ZG91dGAsIGFuZCBgc3RkZXJyYCBwcm9wZXJ0aWVzIGJhc2VkIG9uIHRoZSByZXN1bHRzIG9mIHJ1bm5pbmdcbiAgIyBgYXBtIHJlYnVpbGRgIG9uIHRoZSBwYWNrYWdlLlxuICByZWJ1aWxkOiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgQHJ1blJlYnVpbGRQcm9jZXNzIChyZXN1bHQpID0+XG4gICAgICAgIGlmIHJlc3VsdC5jb2RlIGlzIDBcbiAgICAgICAgICBnbG9iYWwubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQGdldEJ1aWxkRmFpbHVyZU91dHB1dFN0b3JhZ2VLZXkoKSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBjb21wYXRpYmxlID0gZmFsc2VcbiAgICAgICAgICBnbG9iYWwubG9jYWxTdG9yYWdlLnNldEl0ZW0oQGdldEJ1aWxkRmFpbHVyZU91dHB1dFN0b3JhZ2VLZXkoKSwgcmVzdWx0LnN0ZGVycilcbiAgICAgICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5zZXRJdGVtKEBnZXRJbmNvbXBhdGlibGVOYXRpdmVNb2R1bGVzU3RvcmFnZUtleSgpLCAnW10nKVxuICAgICAgICByZXNvbHZlKHJlc3VsdClcblxuICAjIEV4dGVuZGVkOiBJZiBhIHByZXZpb3VzIHJlYnVpbGQgZmFpbGVkLCBnZXQgdGhlIGNvbnRlbnRzIG9mIHN0ZGVyci5cbiAgI1xuICAjIFJldHVybnMgYSB7U3RyaW5nfSBvciBudWxsIGlmIG5vIHByZXZpb3VzIGJ1aWxkIGZhaWx1cmUgb2NjdXJyZWQuXG4gIGdldEJ1aWxkRmFpbHVyZU91dHB1dDogLT5cbiAgICBnbG9iYWwubG9jYWxTdG9yYWdlLmdldEl0ZW0oQGdldEJ1aWxkRmFpbHVyZU91dHB1dFN0b3JhZ2VLZXkoKSlcblxuICBydW5SZWJ1aWxkUHJvY2VzczogKGNhbGxiYWNrKSAtPlxuICAgIHN0ZGVyciA9ICcnXG4gICAgc3Rkb3V0ID0gJydcbiAgICBuZXcgQnVmZmVyZWRQcm9jZXNzKHtcbiAgICAgIGNvbW1hbmQ6IEBwYWNrYWdlTWFuYWdlci5nZXRBcG1QYXRoKClcbiAgICAgIGFyZ3M6IFsncmVidWlsZCcsICctLW5vLWNvbG9yJ11cbiAgICAgIG9wdGlvbnM6IHtjd2Q6IEBwYXRofVxuICAgICAgc3RkZXJyOiAob3V0cHV0KSAtPiBzdGRlcnIgKz0gb3V0cHV0XG4gICAgICBzdGRvdXQ6IChvdXRwdXQpIC0+IHN0ZG91dCArPSBvdXRwdXRcbiAgICAgIGV4aXQ6IChjb2RlKSAtPiBjYWxsYmFjayh7Y29kZSwgc3Rkb3V0LCBzdGRlcnJ9KVxuICAgIH0pXG5cbiAgZ2V0QnVpbGRGYWlsdXJlT3V0cHV0U3RvcmFnZUtleTogLT5cbiAgICBcImluc3RhbGxlZC1wYWNrYWdlczoje0BuYW1lfToje0BtZXRhZGF0YS52ZXJzaW9ufTpidWlsZC1lcnJvclwiXG5cbiAgZ2V0SW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlc1N0b3JhZ2VLZXk6IC0+XG4gICAgZWxlY3Ryb25WZXJzaW9uID0gcHJvY2Vzcy52ZXJzaW9uc1snZWxlY3Ryb24nXSA/IHByb2Nlc3MudmVyc2lvbnNbJ2F0b20tc2hlbGwnXVxuICAgIFwiaW5zdGFsbGVkLXBhY2thZ2VzOiN7QG5hbWV9OiN7QG1ldGFkYXRhLnZlcnNpb259OmVsZWN0cm9uLSN7ZWxlY3Ryb25WZXJzaW9ufTppbmNvbXBhdGlibGUtbmF0aXZlLW1vZHVsZXNcIlxuXG4gIGdldENhbkRlZmVyTWFpbk1vZHVsZVJlcXVpcmVTdG9yYWdlS2V5OiAtPlxuICAgIFwiaW5zdGFsbGVkLXBhY2thZ2VzOiN7QG5hbWV9OiN7QG1ldGFkYXRhLnZlcnNpb259OmNhbi1kZWZlci1tYWluLW1vZHVsZS1yZXF1aXJlXCJcblxuICAjIEdldCB0aGUgaW5jb21wYXRpYmxlIG5hdGl2ZSBtb2R1bGVzIHRoYXQgdGhpcyBwYWNrYWdlIGRlcGVuZHMgb24uXG4gICMgVGhpcyByZWN1cnNlcyB0aHJvdWdoIGFsbCBkZXBlbmRlbmNpZXMgYW5kIHJlcXVpcmVzIGFsbCBtb2R1bGVzIHRoYXRcbiAgIyBjb250YWluIGEgYC5ub2RlYCBmaWxlLlxuICAjXG4gICMgVGhpcyBpbmZvcm1hdGlvbiBpcyBjYWNoZWQgaW4gbG9jYWwgc3RvcmFnZSBvbiBhIHBlciBwYWNrYWdlL3ZlcnNpb24gYmFzaXNcbiAgIyB0byBtaW5pbWl6ZSB0aGUgaW1wYWN0IG9uIHN0YXJ0dXAgdGltZS5cbiAgZ2V0SW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlczogLT5cbiAgICB1bmxlc3MgQGRldk1vZGVcbiAgICAgIHRyeVxuICAgICAgICBpZiBhcnJheUFzU3RyaW5nID0gZ2xvYmFsLmxvY2FsU3RvcmFnZS5nZXRJdGVtKEBnZXRJbmNvbXBhdGlibGVOYXRpdmVNb2R1bGVzU3RvcmFnZUtleSgpKVxuICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGFycmF5QXNTdHJpbmcpXG5cbiAgICBpbmNvbXBhdGlibGVOYXRpdmVNb2R1bGVzID0gW11cbiAgICBmb3IgbmF0aXZlTW9kdWxlUGF0aCBpbiBAZ2V0TmF0aXZlTW9kdWxlRGVwZW5kZW5jeVBhdGhzKClcbiAgICAgIHRyeVxuICAgICAgICByZXF1aXJlKG5hdGl2ZU1vZHVsZVBhdGgpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICB0cnlcbiAgICAgICAgICB2ZXJzaW9uID0gcmVxdWlyZShcIiN7bmF0aXZlTW9kdWxlUGF0aH0vcGFja2FnZS5qc29uXCIpLnZlcnNpb25cbiAgICAgICAgaW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlcy5wdXNoXG4gICAgICAgICAgcGF0aDogbmF0aXZlTW9kdWxlUGF0aFxuICAgICAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUobmF0aXZlTW9kdWxlUGF0aClcbiAgICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uXG4gICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcblxuICAgIGdsb2JhbC5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShAZ2V0SW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlc1N0b3JhZ2VLZXkoKSwgSlNPTi5zdHJpbmdpZnkoaW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlcykpXG4gICAgaW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlc1xuXG4gIGhhbmRsZUVycm9yOiAobWVzc2FnZSwgZXJyb3IpIC0+XG4gICAgaWYgZXJyb3IuZmlsZW5hbWUgYW5kIGVycm9yLmxvY2F0aW9uIGFuZCAoZXJyb3IgaW5zdGFuY2VvZiBTeW50YXhFcnJvcilcbiAgICAgIGxvY2F0aW9uID0gXCIje2Vycm9yLmZpbGVuYW1lfToje2Vycm9yLmxvY2F0aW9uLmZpcnN0X2xpbmUgKyAxfToje2Vycm9yLmxvY2F0aW9uLmZpcnN0X2NvbHVtbiArIDF9XCJcbiAgICAgIGRldGFpbCA9IFwiI3tlcnJvci5tZXNzYWdlfSBpbiAje2xvY2F0aW9ufVwiXG4gICAgICBzdGFjayA9IFwiXCJcIlxuICAgICAgICBTeW50YXhFcnJvcjogI3tlcnJvci5tZXNzYWdlfVxuICAgICAgICAgIGF0ICN7bG9jYXRpb259XG4gICAgICBcIlwiXCJcbiAgICBlbHNlIGlmIGVycm9yLmxlc3MgYW5kIGVycm9yLmZpbGVuYW1lIGFuZCBlcnJvci5jb2x1bW4/IGFuZCBlcnJvci5saW5lP1xuICAgICAgIyBMZXNzIGVycm9yc1xuICAgICAgbG9jYXRpb24gPSBcIiN7ZXJyb3IuZmlsZW5hbWV9OiN7ZXJyb3IubGluZX06I3tlcnJvci5jb2x1bW59XCJcbiAgICAgIGRldGFpbCA9IFwiI3tlcnJvci5tZXNzYWdlfSBpbiAje2xvY2F0aW9ufVwiXG4gICAgICBzdGFjayA9IFwiXCJcIlxuICAgICAgICBMZXNzRXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cbiAgICAgICAgICBhdCAje2xvY2F0aW9ufVxuICAgICAgXCJcIlwiXG4gICAgZWxzZVxuICAgICAgZGV0YWlsID0gZXJyb3IubWVzc2FnZVxuICAgICAgc3RhY2sgPSBlcnJvci5zdGFjayA/IGVycm9yXG5cbiAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRGYXRhbEVycm9yKG1lc3NhZ2UsIHtzdGFjaywgZGV0YWlsLCBwYWNrYWdlTmFtZTogQG5hbWUsIGRpc21pc3NhYmxlOiB0cnVlfSlcbiJdfQ==
