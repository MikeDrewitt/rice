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
      return this.mainActivated = false;
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
      var base, base1, error, ref1;
      try {
        if (this.mainModule == null) {
          this.requireMainModule();
        }
        this.configSchemaRegisteredOnActivate = this.registerConfigSchemaFromMainModule();
        this.registerViewProviders();
        this.activateStylesheets();
        if ((this.mainModule != null) && !this.mainActivated) {
          if (typeof (base = this.mainModule).activateConfig === "function") {
            base.activateConfig();
          }
          if (typeof (base1 = this.mainModule).activate === "function") {
            base1.activate((ref1 = this.packageManager.getPackageState(this.name)) != null ? ref1 : {});
          }
          this.mainActivated = true;
          this.activateServices();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3BhY2thZ2UuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxrSUFBQTtJQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFDUixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQWlDLE9BQUEsQ0FBUSxXQUFSLENBQWpDLEVBQUMscUJBQUQsRUFBVTs7RUFFVixZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNmLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsZ0JBQUEsR0FBbUIsT0FBQSxDQUFRLHFCQUFSOztFQUNuQixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjs7RUFJbEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtzQkFDSixPQUFBLEdBQVM7O3NCQUNULEtBQUEsR0FBTzs7c0JBQ1AsV0FBQSxHQUFhOztzQkFDYixxQkFBQSxHQUF1Qjs7c0JBQ3ZCLFFBQUEsR0FBVTs7c0JBQ1YsUUFBQSxHQUFVOztzQkFDVixjQUFBLEdBQWdCOztzQkFDaEIsc0JBQUEsR0FBd0I7O3NCQUN4QixVQUFBLEdBQVk7O3NCQUNaLGFBQUEsR0FBZTs7O0FBRWY7Ozs7SUFJYSxpQkFBQyxNQUFEO0FBQ1gsVUFBQTtNQUNFLElBQUMsQ0FBQSxjQUFBLElBREgsRUFDUyxJQUFDLENBQUEsa0JBQUEsUUFEVixFQUNvQixJQUFDLENBQUEsd0JBQUEsY0FEckIsRUFDcUMsSUFBQyxDQUFBLGdCQUFBLE1BRHRDLEVBQzhDLElBQUMsQ0FBQSxzQkFB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QUFQLEdBQWdCLEdBQWhCLEdBQWtCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFmLEdBQTRCLENBQTdCLENBQWxCLEdBQWlELEdBQWpELEdBQW1ELENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFmLEdBQThCLENBQS9CO1FBQ2hFLE1BQUEsR0FBWSxLQUFLLENBQUMsT0FBUCxHQUFlLE1BQWYsR0FBcUI7UUFDaEMsS0FBQSxHQUFRLGVBQUEsR0FDUyxLQUFLLENBQUMsT0FEZixHQUN1QixTQUR2QixHQUVDLFNBTFg7T0FBQSxNQU9LLElBQUcsS0FBSyxDQUFDLElBQU4sSUFBZSxLQUFLLENBQUMsUUFBckIsSUFBa0Msc0JBQWxDLElBQW9ELG9CQUF2RDtRQUVILFFBQUEsR0FBYyxLQUFLLENBQUMsUUFBUCxHQUFnQixHQUFoQixHQUFtQixLQUFLLENBQUMsSUFBekIsR0FBOEIsR0FBOUIsR0FBaUMsS0FBSyxDQUFDO1FBQ3BELE1BQUEsR0FBWSxLQUFLLENBQUMsT0FBUCxHQUFlLE1BQWYsR0FBcUI7UUFDaEMsS0FBQSxHQUFRLGFBQUEsR0FDTyxLQUFLLENBQUMsT0FEYixHQUNxQixTQURyQixHQUVDLFNBTk47T0FBQSxNQUFBO1FBU0gsTUFBQSxHQUFTLEtBQUssQ0FBQztRQUNmLEtBQUEseUNBQXNCLE1BVm5COzthQVlMLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxhQUFyQixDQUFtQyxPQUFuQyxFQUE0QztRQUFDLE9BQUEsS0FBRDtRQUFRLFFBQUEsTUFBUjtRQUFnQixXQUFBLEVBQWEsSUFBQyxDQUFBLElBQTlCO1FBQW9DLFdBQUEsRUFBYSxJQUFqRDtPQUE1QztJQXBCVzs7Ozs7QUFqckJmIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5hc3luYyA9IHJlcXVpcmUgJ2FzeW5jJ1xuQ1NPTiA9IHJlcXVpcmUgJ3NlYXNvbidcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcblxuQ29tcGlsZUNhY2hlID0gcmVxdWlyZSAnLi9jb21waWxlLWNhY2hlJ1xuTW9kdWxlQ2FjaGUgPSByZXF1aXJlICcuL21vZHVsZS1jYWNoZSdcblNjb3BlZFByb3BlcnRpZXMgPSByZXF1aXJlICcuL3Njb3BlZC1wcm9wZXJ0aWVzJ1xuQnVmZmVyZWRQcm9jZXNzID0gcmVxdWlyZSAnLi9idWZmZXJlZC1wcm9jZXNzJ1xuXG4jIEV4dGVuZGVkOiBMb2FkcyBhbmQgYWN0aXZhdGVzIGEgcGFja2FnZSdzIG1haW4gbW9kdWxlIGFuZCByZXNvdXJjZXMgc3VjaCBhc1xuIyBzdHlsZXNoZWV0cywga2V5bWFwcywgZ3JhbW1hciwgZWRpdG9yIHByb3BlcnRpZXMsIGFuZCBtZW51cy5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VcbiAga2V5bWFwczogbnVsbFxuICBtZW51czogbnVsbFxuICBzdHlsZXNoZWV0czogbnVsbFxuICBzdHlsZXNoZWV0RGlzcG9zYWJsZXM6IG51bGxcbiAgZ3JhbW1hcnM6IG51bGxcbiAgc2V0dGluZ3M6IG51bGxcbiAgbWFpbk1vZHVsZVBhdGg6IG51bGxcbiAgcmVzb2x2ZWRNYWluTW9kdWxlUGF0aDogZmFsc2VcbiAgbWFpbk1vZHVsZTogbnVsbFxuICBtYWluQWN0aXZhdGVkOiBmYWxzZVxuXG4gICMjI1xuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb25cbiAgIyMjXG5cbiAgY29uc3RydWN0b3I6IChwYXJhbXMpIC0+XG4gICAge1xuICAgICAgQHBhdGgsIEBtZXRhZGF0YSwgQHBhY2thZ2VNYW5hZ2VyLCBAY29uZmlnLCBAc3R5bGVNYW5hZ2VyLCBAY29tbWFuZFJlZ2lzdHJ5LFxuICAgICAgQGtleW1hcE1hbmFnZXIsIEBkZXZNb2RlLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGdyYW1tYXJSZWdpc3RyeSwgQHRoZW1lTWFuYWdlcixcbiAgICAgIEBtZW51TWFuYWdlciwgQGNvbnRleHRNZW51TWFuYWdlciwgQGRlc2VyaWFsaXplck1hbmFnZXIsIEB2aWV3UmVnaXN0cnlcbiAgICB9ID0gcGFyYW1zXG5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQG1ldGFkYXRhID89IEBwYWNrYWdlTWFuYWdlci5sb2FkUGFja2FnZU1ldGFkYXRhKEBwYXRoKVxuICAgIEBidW5kbGVkUGFja2FnZSA9IEBwYWNrYWdlTWFuYWdlci5pc0J1bmRsZWRQYWNrYWdlUGF0aChAcGF0aClcbiAgICBAbmFtZSA9IEBtZXRhZGF0YT8ubmFtZSA/IHBhdGguYmFzZW5hbWUoQHBhdGgpXG4gICAgTW9kdWxlQ2FjaGUuYWRkKEBwYXRoLCBAbWV0YWRhdGEpXG4gICAgQHJlc2V0KClcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYWxsIHBhY2thZ2VzIGhhdmUgYmVlbiBhY3RpdmF0ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWREZWFjdGl2YXRlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZWFjdGl2YXRlJywgY2FsbGJhY2tcblxuICAjIyNcbiAgU2VjdGlvbjogSW5zdGFuY2UgTWV0aG9kc1xuICAjIyNcblxuICBlbmFibGU6IC0+XG4gICAgQGNvbmZpZy5yZW1vdmVBdEtleVBhdGgoJ2NvcmUuZGlzYWJsZWRQYWNrYWdlcycsIEBuYW1lKVxuXG4gIGRpc2FibGU6IC0+XG4gICAgQGNvbmZpZy5wdXNoQXRLZXlQYXRoKCdjb3JlLmRpc2FibGVkUGFja2FnZXMnLCBAbmFtZSlcblxuICBpc1RoZW1lOiAtPlxuICAgIEBtZXRhZGF0YT8udGhlbWU/XG5cbiAgbWVhc3VyZTogKGtleSwgZm4pIC0+XG4gICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuICAgIHZhbHVlID0gZm4oKVxuICAgIEBba2V5XSA9IERhdGUubm93KCkgLSBzdGFydFRpbWVcbiAgICB2YWx1ZVxuXG4gIGdldFR5cGU6IC0+ICdhdG9tJ1xuXG4gIGdldFN0eWxlU2hlZXRQcmlvcml0eTogLT4gMFxuXG4gIGxvYWQ6IC0+XG4gICAgQG1lYXN1cmUgJ2xvYWRUaW1lJywgPT5cbiAgICAgIHRyeVxuICAgICAgICBAbG9hZEtleW1hcHMoKVxuICAgICAgICBAbG9hZE1lbnVzKClcbiAgICAgICAgQGxvYWRTdHlsZXNoZWV0cygpXG4gICAgICAgIEByZWdpc3RlckRlc2VyaWFsaXplck1ldGhvZHMoKVxuICAgICAgICBAYWN0aXZhdGVDb3JlU3RhcnR1cFNlcnZpY2VzKClcbiAgICAgICAgQHJlZ2lzdGVyVHJhbnNwaWxlckNvbmZpZygpXG4gICAgICAgIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25Mb2FkID0gQHJlZ2lzdGVyQ29uZmlnU2NoZW1hRnJvbU1ldGFkYXRhKClcbiAgICAgICAgQHNldHRpbmdzUHJvbWlzZSA9IEBsb2FkU2V0dGluZ3MoKVxuICAgICAgICBpZiBAc2hvdWxkUmVxdWlyZU1haW5Nb2R1bGVPbkxvYWQoKSBhbmQgbm90IEBtYWluTW9kdWxlP1xuICAgICAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBAaGFuZGxlRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCB0aGUgI3tAbmFtZX0gcGFja2FnZVwiLCBlcnJvcilcbiAgICB0aGlzXG5cbiAgdW5sb2FkOiAtPlxuICAgIEB1bnJlZ2lzdGVyVHJhbnNwaWxlckNvbmZpZygpXG5cbiAgc2hvdWxkUmVxdWlyZU1haW5Nb2R1bGVPbkxvYWQ6IC0+XG4gICAgbm90IChcbiAgICAgIEBtZXRhZGF0YS5kZXNlcmlhbGl6ZXJzPyBvclxuICAgICAgQG1ldGFkYXRhLnZpZXdQcm92aWRlcnM/IG9yXG4gICAgICBAbWV0YWRhdGEuY29uZmlnU2NoZW1hPyBvclxuICAgICAgQGFjdGl2YXRpb25TaG91bGRCZURlZmVycmVkKCkgb3JcbiAgICAgIGxvY2FsU3RvcmFnZS5nZXRJdGVtKEBnZXRDYW5EZWZlck1haW5Nb2R1bGVSZXF1aXJlU3RvcmFnZUtleSgpKSBpcyAndHJ1ZSdcbiAgICApXG5cbiAgcmVzZXQ6IC0+XG4gICAgQHN0eWxlc2hlZXRzID0gW11cbiAgICBAa2V5bWFwcyA9IFtdXG4gICAgQG1lbnVzID0gW11cbiAgICBAZ3JhbW1hcnMgPSBbXVxuICAgIEBzZXR0aW5ncyA9IFtdXG4gICAgQG1haW5BY3RpdmF0ZWQgPSBmYWxzZVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBncmFtbWFyc1Byb21pc2UgPz0gQGxvYWRHcmFtbWFycygpXG4gICAgQGFjdGl2YXRpb25Qcm9taXNlID89XG4gICAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICBAcmVzb2x2ZUFjdGl2YXRpb25Qcm9taXNlID0gcmVzb2x2ZVxuICAgICAgICBAbWVhc3VyZSAnYWN0aXZhdGVUaW1lJywgPT5cbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIEBhY3RpdmF0ZVJlc291cmNlcygpXG4gICAgICAgICAgICBpZiBAYWN0aXZhdGlvblNob3VsZEJlRGVmZXJyZWQoKVxuICAgICAgICAgICAgICBAc3Vic2NyaWJlVG9EZWZlcnJlZEFjdGl2YXRpb24oKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBAYWN0aXZhdGVOb3coKVxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICBAaGFuZGxlRXJyb3IoXCJGYWlsZWQgdG8gYWN0aXZhdGUgdGhlICN7QG5hbWV9IHBhY2thZ2VcIiwgZXJyb3IpXG5cbiAgICBQcm9taXNlLmFsbChbQGdyYW1tYXJzUHJvbWlzZSwgQHNldHRpbmdzUHJvbWlzZSwgQGFjdGl2YXRpb25Qcm9taXNlXSlcblxuICBhY3RpdmF0ZU5vdzogLT5cbiAgICB0cnlcbiAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpIHVubGVzcyBAbWFpbk1vZHVsZT9cbiAgICAgIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25BY3RpdmF0ZSA9IEByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NYWluTW9kdWxlKClcbiAgICAgIEByZWdpc3RlclZpZXdQcm92aWRlcnMoKVxuICAgICAgQGFjdGl2YXRlU3R5bGVzaGVldHMoKVxuICAgICAgaWYgQG1haW5Nb2R1bGU/IGFuZCBub3QgQG1haW5BY3RpdmF0ZWRcbiAgICAgICAgQG1haW5Nb2R1bGUuYWN0aXZhdGVDb25maWc/KClcbiAgICAgICAgQG1haW5Nb2R1bGUuYWN0aXZhdGU/KEBwYWNrYWdlTWFuYWdlci5nZXRQYWNrYWdlU3RhdGUoQG5hbWUpID8ge30pXG4gICAgICAgIEBtYWluQWN0aXZhdGVkID0gdHJ1ZVxuICAgICAgICBAYWN0aXZhdGVTZXJ2aWNlcygpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBoYW5kbGVFcnJvcihcIkZhaWxlZCB0byBhY3RpdmF0ZSB0aGUgI3tAbmFtZX0gcGFja2FnZVwiLCBlcnJvcilcblxuICAgIEByZXNvbHZlQWN0aXZhdGlvblByb21pc2U/KClcblxuICByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NZXRhZGF0YTogLT5cbiAgICBpZiBjb25maWdTY2hlbWEgPSBAbWV0YWRhdGEuY29uZmlnU2NoZW1hXG4gICAgICBAY29uZmlnLnNldFNjaGVtYSBAbmFtZSwge3R5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiBjb25maWdTY2hlbWF9XG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICByZWdpc3RlckNvbmZpZ1NjaGVtYUZyb21NYWluTW9kdWxlOiAtPlxuICAgIGlmIEBtYWluTW9kdWxlPyBhbmQgbm90IEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25Mb2FkXG4gICAgICBpZiBAbWFpbk1vZHVsZS5jb25maWc/IGFuZCB0eXBlb2YgQG1haW5Nb2R1bGUuY29uZmlnIGlzICdvYmplY3QnXG4gICAgICAgIEBjb25maWcuc2V0U2NoZW1hIEBuYW1lLCB7dHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IEBtYWluTW9kdWxlLmNvbmZpZ31cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICBmYWxzZVxuXG4gICMgVE9ETzogUmVtb3ZlLiBTZXR0aW5ncyB2aWV3IGNhbGxzIHRoaXMgbWV0aG9kIGN1cnJlbnRseS5cbiAgYWN0aXZhdGVDb25maWc6IC0+XG4gICAgcmV0dXJuIGlmIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25Mb2FkXG4gICAgQHJlcXVpcmVNYWluTW9kdWxlKClcbiAgICBAcmVnaXN0ZXJDb25maWdTY2hlbWFGcm9tTWFpbk1vZHVsZSgpXG5cbiAgYWN0aXZhdGVTdHlsZXNoZWV0czogLT5cbiAgICByZXR1cm4gaWYgQHN0eWxlc2hlZXRzQWN0aXZhdGVkXG5cbiAgICBAc3R5bGVzaGVldERpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIHByaW9yaXR5ID0gQGdldFN0eWxlU2hlZXRQcmlvcml0eSgpXG4gICAgZm9yIFtzb3VyY2VQYXRoLCBzb3VyY2VdIGluIEBzdHlsZXNoZWV0c1xuICAgICAgaWYgbWF0Y2ggPSBwYXRoLmJhc2VuYW1lKHNvdXJjZVBhdGgpLm1hdGNoKC9bXi5dKlxcLihbXi5dKilcXC4vKVxuICAgICAgICBjb250ZXh0ID0gbWF0Y2hbMV1cbiAgICAgIGVsc2UgaWYgQG1ldGFkYXRhLnRoZW1lIGlzICdzeW50YXgnXG4gICAgICAgIGNvbnRleHQgPSAnYXRvbS10ZXh0LWVkaXRvcidcbiAgICAgIGVsc2VcbiAgICAgICAgY29udGV4dCA9IHVuZGVmaW5lZFxuXG4gICAgICBAc3R5bGVzaGVldERpc3Bvc2FibGVzLmFkZChAc3R5bGVNYW5hZ2VyLmFkZFN0eWxlU2hlZXQoc291cmNlLCB7c291cmNlUGF0aCwgcHJpb3JpdHksIGNvbnRleHR9KSlcbiAgICBAc3R5bGVzaGVldHNBY3RpdmF0ZWQgPSB0cnVlXG5cbiAgYWN0aXZhdGVSZXNvdXJjZXM6IC0+XG4gICAgQGFjdGl2YXRpb25EaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBrZXltYXBJc0Rpc2FibGVkID0gXy5pbmNsdWRlKEBjb25maWcuZ2V0KFwiY29yZS5wYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWRcIikgPyBbXSwgQG5hbWUpXG4gICAgaWYga2V5bWFwSXNEaXNhYmxlZFxuICAgICAgQGRlYWN0aXZhdGVLZXltYXBzKClcbiAgICBlbHNlXG4gICAgICBAYWN0aXZhdGVLZXltYXBzKClcblxuICAgIGZvciBbbWVudVBhdGgsIG1hcF0gaW4gQG1lbnVzIHdoZW4gbWFwWydjb250ZXh0LW1lbnUnXT9cbiAgICAgIHRyeVxuICAgICAgICBpdGVtc0J5U2VsZWN0b3IgPSBtYXBbJ2NvbnRleHQtbWVudSddXG4gICAgICAgIEBhY3RpdmF0aW9uRGlzcG9zYWJsZXMuYWRkKEBjb250ZXh0TWVudU1hbmFnZXIuYWRkKGl0ZW1zQnlTZWxlY3RvcikpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBpZiBlcnJvci5jb2RlIGlzICdFQkFEU0VMRUNUT1InXG4gICAgICAgICAgZXJyb3IubWVzc2FnZSArPSBcIiBpbiAje21lbnVQYXRofVwiXG4gICAgICAgICAgZXJyb3Iuc3RhY2sgKz0gXCJcXG4gIGF0ICN7bWVudVBhdGh9OjE6MVwiXG4gICAgICAgIHRocm93IGVycm9yXG5cbiAgICBAYWN0aXZhdGlvbkRpc3Bvc2FibGVzLmFkZChAbWVudU1hbmFnZXIuYWRkKG1hcFsnbWVudSddKSkgZm9yIFttZW51UGF0aCwgbWFwXSBpbiBAbWVudXMgd2hlbiBtYXBbJ21lbnUnXT9cblxuICAgIHVubGVzcyBAZ3JhbW1hcnNBY3RpdmF0ZWRcbiAgICAgIGdyYW1tYXIuYWN0aXZhdGUoKSBmb3IgZ3JhbW1hciBpbiBAZ3JhbW1hcnNcbiAgICAgIEBncmFtbWFyc0FjdGl2YXRlZCA9IHRydWVcblxuICAgIHNldHRpbmdzLmFjdGl2YXRlKCkgZm9yIHNldHRpbmdzIGluIEBzZXR0aW5nc1xuICAgIEBzZXR0aW5nc0FjdGl2YXRlZCA9IHRydWVcblxuICBhY3RpdmF0ZUtleW1hcHM6IC0+XG4gICAgcmV0dXJuIGlmIEBrZXltYXBBY3RpdmF0ZWRcblxuICAgIEBrZXltYXBEaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIEBrZXltYXBEaXNwb3NhYmxlcy5hZGQoQGtleW1hcE1hbmFnZXIuYWRkKGtleW1hcFBhdGgsIG1hcCkpIGZvciBba2V5bWFwUGF0aCwgbWFwXSBpbiBAa2V5bWFwc1xuICAgIEBtZW51TWFuYWdlci51cGRhdGUoKVxuXG4gICAgQGtleW1hcEFjdGl2YXRlZCA9IHRydWVcblxuICBkZWFjdGl2YXRlS2V5bWFwczogLT5cbiAgICByZXR1cm4gaWYgbm90IEBrZXltYXBBY3RpdmF0ZWRcblxuICAgIEBrZXltYXBEaXNwb3NhYmxlcz8uZGlzcG9zZSgpXG4gICAgQG1lbnVNYW5hZ2VyLnVwZGF0ZSgpXG5cbiAgICBAa2V5bWFwQWN0aXZhdGVkID0gZmFsc2VcblxuICBoYXNLZXltYXBzOiAtPlxuICAgIGZvciBbcGF0aCwgbWFwXSBpbiBAa2V5bWFwc1xuICAgICAgaWYgbWFwLmxlbmd0aCA+IDBcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICBmYWxzZVxuXG4gIGFjdGl2YXRlU2VydmljZXM6IC0+XG4gICAgZm9yIG5hbWUsIHt2ZXJzaW9uc30gb2YgQG1ldGFkYXRhLnByb3ZpZGVkU2VydmljZXNcbiAgICAgIHNlcnZpY2VzQnlWZXJzaW9uID0ge31cbiAgICAgIGZvciB2ZXJzaW9uLCBtZXRob2ROYW1lIG9mIHZlcnNpb25zXG4gICAgICAgIGlmIHR5cGVvZiBAbWFpbk1vZHVsZVttZXRob2ROYW1lXSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VydmljZXNCeVZlcnNpb25bdmVyc2lvbl0gPSBAbWFpbk1vZHVsZVttZXRob2ROYW1lXSgpXG4gICAgICBAYWN0aXZhdGlvbkRpc3Bvc2FibGVzLmFkZCBAcGFja2FnZU1hbmFnZXIuc2VydmljZUh1Yi5wcm92aWRlKG5hbWUsIHNlcnZpY2VzQnlWZXJzaW9uKVxuXG4gICAgZm9yIG5hbWUsIHt2ZXJzaW9uc30gb2YgQG1ldGFkYXRhLmNvbnN1bWVkU2VydmljZXNcbiAgICAgIGZvciB2ZXJzaW9uLCBtZXRob2ROYW1lIG9mIHZlcnNpb25zXG4gICAgICAgIGlmIHR5cGVvZiBAbWFpbk1vZHVsZVttZXRob2ROYW1lXSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgQGFjdGl2YXRpb25EaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLnNlcnZpY2VIdWIuY29uc3VtZShuYW1lLCB2ZXJzaW9uLCBAbWFpbk1vZHVsZVttZXRob2ROYW1lXS5iaW5kKEBtYWluTW9kdWxlKSlcbiAgICByZXR1cm5cblxuICByZWdpc3RlclRyYW5zcGlsZXJDb25maWc6IC0+XG4gICAgaWYgQG1ldGFkYXRhLmF0b21UcmFuc3BpbGVyc1xuICAgICAgQ29tcGlsZUNhY2hlLmFkZFRyYW5zcGlsZXJDb25maWdGb3JQYXRoKEBwYXRoLCBAbmFtZSwgQG1ldGFkYXRhLCBAbWV0YWRhdGEuYXRvbVRyYW5zcGlsZXJzKVxuXG4gIHVucmVnaXN0ZXJUcmFuc3BpbGVyQ29uZmlnOiAtPlxuICAgIGlmIEBtZXRhZGF0YS5hdG9tVHJhbnNwaWxlcnNcbiAgICAgIENvbXBpbGVDYWNoZS5yZW1vdmVUcmFuc3BpbGVyQ29uZmlnRm9yUGF0aChAcGF0aClcblxuICBsb2FkS2V5bWFwczogLT5cbiAgICBpZiBAYnVuZGxlZFBhY2thZ2UgYW5kIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXT9cbiAgICAgIEBrZXltYXBzID0gKFtcIiN7QHBhY2thZ2VNYW5hZ2VyLnJlc291cmNlUGF0aH0je3BhdGguc2VwfSN7a2V5bWFwUGF0aH1cIiwga2V5bWFwT2JqZWN0XSBmb3Iga2V5bWFwUGF0aCwga2V5bWFwT2JqZWN0IG9mIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXS5rZXltYXBzKVxuICAgIGVsc2VcbiAgICAgIEBrZXltYXBzID0gQGdldEtleW1hcFBhdGhzKCkubWFwIChrZXltYXBQYXRoKSAtPiBba2V5bWFwUGF0aCwgQ1NPTi5yZWFkRmlsZVN5bmMoa2V5bWFwUGF0aCwgYWxsb3dEdXBsaWNhdGVLZXlzOiBmYWxzZSkgPyB7fV1cbiAgICByZXR1cm5cblxuICBsb2FkTWVudXM6IC0+XG4gICAgaWYgQGJ1bmRsZWRQYWNrYWdlIGFuZCBAcGFja2FnZU1hbmFnZXIucGFja2FnZXNDYWNoZVtAbmFtZV0/XG4gICAgICBAbWVudXMgPSAoW1wiI3tAcGFja2FnZU1hbmFnZXIucmVzb3VyY2VQYXRofSN7cGF0aC5zZXB9I3ttZW51UGF0aH1cIiwgbWVudU9iamVjdF0gZm9yIG1lbnVQYXRoLCBtZW51T2JqZWN0IG9mIEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlc0NhY2hlW0BuYW1lXS5tZW51cylcbiAgICBlbHNlXG4gICAgICBAbWVudXMgPSBAZ2V0TWVudVBhdGhzKCkubWFwIChtZW51UGF0aCkgLT4gW21lbnVQYXRoLCBDU09OLnJlYWRGaWxlU3luYyhtZW51UGF0aCkgPyB7fV1cbiAgICByZXR1cm5cblxuICBnZXRLZXltYXBQYXRoczogLT5cbiAgICBrZXltYXBzRGlyUGF0aCA9IHBhdGguam9pbihAcGF0aCwgJ2tleW1hcHMnKVxuICAgIGlmIEBtZXRhZGF0YS5rZXltYXBzXG4gICAgICBAbWV0YWRhdGEua2V5bWFwcy5tYXAgKG5hbWUpIC0+IGZzLnJlc29sdmUoa2V5bWFwc0RpclBhdGgsIG5hbWUsIFsnanNvbicsICdjc29uJywgJyddKVxuICAgIGVsc2VcbiAgICAgIGZzLmxpc3RTeW5jKGtleW1hcHNEaXJQYXRoLCBbJ2Nzb24nLCAnanNvbiddKVxuXG4gIGdldE1lbnVQYXRoczogLT5cbiAgICBtZW51c0RpclBhdGggPSBwYXRoLmpvaW4oQHBhdGgsICdtZW51cycpXG4gICAgaWYgQG1ldGFkYXRhLm1lbnVzXG4gICAgICBAbWV0YWRhdGEubWVudXMubWFwIChuYW1lKSAtPiBmcy5yZXNvbHZlKG1lbnVzRGlyUGF0aCwgbmFtZSwgWydqc29uJywgJ2Nzb24nLCAnJ10pXG4gICAgZWxzZVxuICAgICAgZnMubGlzdFN5bmMobWVudXNEaXJQYXRoLCBbJ2Nzb24nLCAnanNvbiddKVxuXG4gIGxvYWRTdHlsZXNoZWV0czogLT5cbiAgICBAc3R5bGVzaGVldHMgPSBAZ2V0U3R5bGVzaGVldFBhdGhzKCkubWFwIChzdHlsZXNoZWV0UGF0aCkgPT5cbiAgICAgIFtzdHlsZXNoZWV0UGF0aCwgQHRoZW1lTWFuYWdlci5sb2FkU3R5bGVzaGVldChzdHlsZXNoZWV0UGF0aCwgdHJ1ZSldXG5cbiAgcmVnaXN0ZXJEZXNlcmlhbGl6ZXJNZXRob2RzOiAtPlxuICAgIGlmIEBtZXRhZGF0YS5kZXNlcmlhbGl6ZXJzP1xuICAgICAgT2JqZWN0LmtleXMoQG1ldGFkYXRhLmRlc2VyaWFsaXplcnMpLmZvckVhY2ggKGRlc2VyaWFsaXplck5hbWUpID0+XG4gICAgICAgIG1ldGhvZE5hbWUgPSBAbWV0YWRhdGEuZGVzZXJpYWxpemVyc1tkZXNlcmlhbGl6ZXJOYW1lXVxuICAgICAgICBhdG9tLmRlc2VyaWFsaXplcnMuYWRkXG4gICAgICAgICAgbmFtZTogZGVzZXJpYWxpemVyTmFtZSxcbiAgICAgICAgICBkZXNlcmlhbGl6ZTogKHN0YXRlLCBhdG9tRW52aXJvbm1lbnQpID0+XG4gICAgICAgICAgICBAcmVnaXN0ZXJWaWV3UHJvdmlkZXJzKClcbiAgICAgICAgICAgIEByZXF1aXJlTWFpbk1vZHVsZSgpXG4gICAgICAgICAgICBAbWFpbk1vZHVsZVttZXRob2ROYW1lXShzdGF0ZSwgYXRvbUVudmlyb25tZW50KVxuICAgICAgcmV0dXJuXG5cbiAgYWN0aXZhdGVDb3JlU3RhcnR1cFNlcnZpY2VzOiAtPlxuICAgIGlmIGRpcmVjdG9yeVByb3ZpZGVyU2VydmljZSA9IEBtZXRhZGF0YS5wcm92aWRlZFNlcnZpY2VzP1snYXRvbS5kaXJlY3RvcnktcHJvdmlkZXInXVxuICAgICAgQHJlcXVpcmVNYWluTW9kdWxlKClcbiAgICAgIHNlcnZpY2VzQnlWZXJzaW9uID0ge31cbiAgICAgIGZvciB2ZXJzaW9uLCBtZXRob2ROYW1lIG9mIGRpcmVjdG9yeVByb3ZpZGVyU2VydmljZS52ZXJzaW9uc1xuICAgICAgICBpZiB0eXBlb2YgQG1haW5Nb2R1bGVbbWV0aG9kTmFtZV0gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlcnZpY2VzQnlWZXJzaW9uW3ZlcnNpb25dID0gQG1haW5Nb2R1bGVbbWV0aG9kTmFtZV0oKVxuICAgICAgQHBhY2thZ2VNYW5hZ2VyLnNlcnZpY2VIdWIucHJvdmlkZSgnYXRvbS5kaXJlY3RvcnktcHJvdmlkZXInLCBzZXJ2aWNlc0J5VmVyc2lvbilcblxuICByZWdpc3RlclZpZXdQcm92aWRlcnM6IC0+XG4gICAgaWYgQG1ldGFkYXRhLnZpZXdQcm92aWRlcnM/IGFuZCBub3QgQHJlZ2lzdGVyZWRWaWV3UHJvdmlkZXJzXG4gICAgICBAcmVxdWlyZU1haW5Nb2R1bGUoKVxuICAgICAgQG1ldGFkYXRhLnZpZXdQcm92aWRlcnMuZm9yRWFjaCAobWV0aG9kTmFtZSkgPT5cbiAgICAgICAgQHZpZXdSZWdpc3RyeS5hZGRWaWV3UHJvdmlkZXIgKG1vZGVsKSA9PlxuICAgICAgICAgIEBtYWluTW9kdWxlW21ldGhvZE5hbWVdKG1vZGVsKVxuICAgICAgQHJlZ2lzdGVyZWRWaWV3UHJvdmlkZXJzID0gdHJ1ZVxuXG4gIGdldFN0eWxlc2hlZXRzUGF0aDogLT5cbiAgICBwYXRoLmpvaW4oQHBhdGgsICdzdHlsZXMnKVxuXG4gIGdldFN0eWxlc2hlZXRQYXRoczogLT5cbiAgICBzdHlsZXNoZWV0RGlyUGF0aCA9IEBnZXRTdHlsZXNoZWV0c1BhdGgoKVxuICAgIGlmIEBtZXRhZGF0YS5tYWluU3R5bGVTaGVldFxuICAgICAgW2ZzLnJlc29sdmUoQHBhdGgsIEBtZXRhZGF0YS5tYWluU3R5bGVTaGVldCldXG4gICAgZWxzZSBpZiBAbWV0YWRhdGEuc3R5bGVTaGVldHNcbiAgICAgIEBtZXRhZGF0YS5zdHlsZVNoZWV0cy5tYXAgKG5hbWUpIC0+IGZzLnJlc29sdmUoc3R5bGVzaGVldERpclBhdGgsIG5hbWUsIFsnY3NzJywgJ2xlc3MnLCAnJ10pXG4gICAgZWxzZSBpZiBpbmRleFN0eWxlc2hlZXQgPSBmcy5yZXNvbHZlKEBwYXRoLCAnaW5kZXgnLCBbJ2NzcycsICdsZXNzJ10pXG4gICAgICBbaW5kZXhTdHlsZXNoZWV0XVxuICAgIGVsc2VcbiAgICAgIGZzLmxpc3RTeW5jKHN0eWxlc2hlZXREaXJQYXRoLCBbJ2NzcycsICdsZXNzJ10pXG5cbiAgbG9hZEdyYW1tYXJzU3luYzogLT5cbiAgICByZXR1cm4gaWYgQGdyYW1tYXJzTG9hZGVkXG5cbiAgICBncmFtbWFyc0RpclBhdGggPSBwYXRoLmpvaW4oQHBhdGgsICdncmFtbWFycycpXG4gICAgZ3JhbW1hclBhdGhzID0gZnMubGlzdFN5bmMoZ3JhbW1hcnNEaXJQYXRoLCBbJ2pzb24nLCAnY3NvbiddKVxuICAgIGZvciBncmFtbWFyUGF0aCBpbiBncmFtbWFyUGF0aHNcbiAgICAgIHRyeVxuICAgICAgICBncmFtbWFyID0gQGdyYW1tYXJSZWdpc3RyeS5yZWFkR3JhbW1hclN5bmMoZ3JhbW1hclBhdGgpXG4gICAgICAgIGdyYW1tYXIucGFja2FnZU5hbWUgPSBAbmFtZVxuICAgICAgICBncmFtbWFyLmJ1bmRsZWRQYWNrYWdlID0gQGJ1bmRsZWRQYWNrYWdlXG4gICAgICAgIEBncmFtbWFycy5wdXNoKGdyYW1tYXIpXG4gICAgICAgIGdyYW1tYXIuYWN0aXZhdGUoKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGxvYWQgZ3JhbW1hcjogI3tncmFtbWFyUGF0aH1cIiwgZXJyb3Iuc3RhY2sgPyBlcnJvcilcblxuICAgIEBncmFtbWFyc0xvYWRlZCA9IHRydWVcbiAgICBAZ3JhbW1hcnNBY3RpdmF0ZWQgPSB0cnVlXG5cbiAgbG9hZEdyYW1tYXJzOiAtPlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKSBpZiBAZ3JhbW1hcnNMb2FkZWRcblxuICAgIGxvYWRHcmFtbWFyID0gKGdyYW1tYXJQYXRoLCBjYWxsYmFjaykgPT5cbiAgICAgIEBncmFtbWFyUmVnaXN0cnkucmVhZEdyYW1tYXIgZ3JhbW1hclBhdGgsIChlcnJvciwgZ3JhbW1hcikgPT5cbiAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgZGV0YWlsID0gXCIje2Vycm9yLm1lc3NhZ2V9IGluICN7Z3JhbW1hclBhdGh9XCJcbiAgICAgICAgICBzdGFjayA9IFwiI3tlcnJvci5zdGFja31cXG4gIGF0ICN7Z3JhbW1hclBhdGh9OjE6MVwiXG4gICAgICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRmF0YWxFcnJvcihcIkZhaWxlZCB0byBsb2FkIGEgI3tAbmFtZX0gcGFja2FnZSBncmFtbWFyXCIsIHtzdGFjaywgZGV0YWlsLCBwYWNrYWdlTmFtZTogQG5hbWUsIGRpc21pc3NhYmxlOiB0cnVlfSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGdyYW1tYXIucGFja2FnZU5hbWUgPSBAbmFtZVxuICAgICAgICAgIGdyYW1tYXIuYnVuZGxlZFBhY2thZ2UgPSBAYnVuZGxlZFBhY2thZ2VcbiAgICAgICAgICBAZ3JhbW1hcnMucHVzaChncmFtbWFyKVxuICAgICAgICAgIGdyYW1tYXIuYWN0aXZhdGUoKSBpZiBAZ3JhbW1hcnNBY3RpdmF0ZWRcbiAgICAgICAgY2FsbGJhY2soKVxuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICBncmFtbWFyc0RpclBhdGggPSBwYXRoLmpvaW4oQHBhdGgsICdncmFtbWFycycpXG4gICAgICBmcy5leGlzdHMgZ3JhbW1hcnNEaXJQYXRoLCAoZ3JhbW1hcnNEaXJFeGlzdHMpIC0+XG4gICAgICAgIHJldHVybiByZXNvbHZlKCkgdW5sZXNzIGdyYW1tYXJzRGlyRXhpc3RzXG5cbiAgICAgICAgZnMubGlzdCBncmFtbWFyc0RpclBhdGgsIFsnanNvbicsICdjc29uJ10sIChlcnJvciwgZ3JhbW1hclBhdGhzPVtdKSAtPlxuICAgICAgICAgIGFzeW5jLmVhY2ggZ3JhbW1hclBhdGhzLCBsb2FkR3JhbW1hciwgLT4gcmVzb2x2ZSgpXG5cbiAgbG9hZFNldHRpbmdzOiAtPlxuICAgIEBzZXR0aW5ncyA9IFtdXG5cbiAgICBsb2FkU2V0dGluZ3NGaWxlID0gKHNldHRpbmdzUGF0aCwgY2FsbGJhY2spID0+XG4gICAgICBTY29wZWRQcm9wZXJ0aWVzLmxvYWQgc2V0dGluZ3NQYXRoLCBAY29uZmlnLCAoZXJyb3IsIHNldHRpbmdzKSA9PlxuICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICBkZXRhaWwgPSBcIiN7ZXJyb3IubWVzc2FnZX0gaW4gI3tzZXR0aW5nc1BhdGh9XCJcbiAgICAgICAgICBzdGFjayA9IFwiI3tlcnJvci5zdGFja31cXG4gIGF0ICN7c2V0dGluZ3NQYXRofToxOjFcIlxuICAgICAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZEZhdGFsRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCB0aGUgI3tAbmFtZX0gcGFja2FnZSBzZXR0aW5nc1wiLCB7c3RhY2ssIGRldGFpbCwgcGFja2FnZU5hbWU6IEBuYW1lLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc2V0dGluZ3MucHVzaChzZXR0aW5ncylcbiAgICAgICAgICBzZXR0aW5ncy5hY3RpdmF0ZSgpIGlmIEBzZXR0aW5nc0FjdGl2YXRlZFxuICAgICAgICBjYWxsYmFjaygpXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cbiAgICAgIHNldHRpbmdzRGlyUGF0aCA9IHBhdGguam9pbihAcGF0aCwgJ3NldHRpbmdzJylcblxuICAgICAgZnMuZXhpc3RzIHNldHRpbmdzRGlyUGF0aCwgKHNldHRpbmdzRGlyRXhpc3RzKSAtPlxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpIHVubGVzcyBzZXR0aW5nc0RpckV4aXN0c1xuXG4gICAgICAgIGZzLmxpc3Qgc2V0dGluZ3NEaXJQYXRoLCBbJ2pzb24nLCAnY3NvbiddLCAoZXJyb3IsIHNldHRpbmdzUGF0aHM9W10pIC0+XG4gICAgICAgICAgYXN5bmMuZWFjaCBzZXR0aW5nc1BhdGhzLCBsb2FkU2V0dGluZ3NGaWxlLCAtPiByZXNvbHZlKClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgaWYgQG1haW5BY3RpdmF0ZWRcbiAgICAgIHRyeVxuICAgICAgICBAbWFpbk1vZHVsZT8uc2VyaWFsaXplPygpXG4gICAgICBjYXRjaCBlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IgXCJFcnJvciBzZXJpYWxpemluZyBwYWNrYWdlICcje0BuYW1lfSdcIiwgZS5zdGFja1xuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGFjdGl2YXRpb25Qcm9taXNlID0gbnVsbFxuICAgIEByZXNvbHZlQWN0aXZhdGlvblByb21pc2UgPSBudWxsXG4gICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGFjdGl2YXRpb25Ib29rU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGNvbmZpZ1NjaGVtYVJlZ2lzdGVyZWRPbkFjdGl2YXRlID0gZmFsc2VcbiAgICBAZGVhY3RpdmF0ZVJlc291cmNlcygpXG4gICAgQGRlYWN0aXZhdGVLZXltYXBzKClcbiAgICBpZiBAbWFpbkFjdGl2YXRlZFxuICAgICAgdHJ5XG4gICAgICAgIEBtYWluTW9kdWxlPy5kZWFjdGl2YXRlPygpXG4gICAgICAgIEBtYWluTW9kdWxlPy5kZWFjdGl2YXRlQ29uZmlnPygpXG4gICAgICAgIEBtYWluQWN0aXZhdGVkID0gZmFsc2VcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgY29uc29sZS5lcnJvciBcIkVycm9yIGRlYWN0aXZhdGluZyBwYWNrYWdlICcje0BuYW1lfSdcIiwgZS5zdGFja1xuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZWFjdGl2YXRlJ1xuXG4gIGRlYWN0aXZhdGVSZXNvdXJjZXM6IC0+XG4gICAgZ3JhbW1hci5kZWFjdGl2YXRlKCkgZm9yIGdyYW1tYXIgaW4gQGdyYW1tYXJzXG4gICAgc2V0dGluZ3MuZGVhY3RpdmF0ZSgpIGZvciBzZXR0aW5ncyBpbiBAc2V0dGluZ3NcbiAgICBAc3R5bGVzaGVldERpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAYWN0aXZhdGlvbkRpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAa2V5bWFwRGlzcG9zYWJsZXM/LmRpc3Bvc2UoKVxuICAgIEBzdHlsZXNoZWV0c0FjdGl2YXRlZCA9IGZhbHNlXG4gICAgQGdyYW1tYXJzQWN0aXZhdGVkID0gZmFsc2VcbiAgICBAc2V0dGluZ3NBY3RpdmF0ZWQgPSBmYWxzZVxuXG4gIHJlbG9hZFN0eWxlc2hlZXRzOiAtPlxuICAgIHRyeVxuICAgICAgQGxvYWRTdHlsZXNoZWV0cygpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBoYW5kbGVFcnJvcihcIkZhaWxlZCB0byByZWxvYWQgdGhlICN7QG5hbWV9IHBhY2thZ2Ugc3R5bGVzaGVldHNcIiwgZXJyb3IpXG5cbiAgICBAc3R5bGVzaGVldERpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAc3R5bGVzaGVldERpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3R5bGVzaGVldHNBY3RpdmF0ZWQgPSBmYWxzZVxuICAgIEBhY3RpdmF0ZVN0eWxlc2hlZXRzKClcblxuICByZXF1aXJlTWFpbk1vZHVsZTogLT5cbiAgICByZXR1cm4gQG1haW5Nb2R1bGUgaWYgQG1haW5Nb2R1bGVSZXF1aXJlZFxuICAgIHVubGVzcyBAaXNDb21wYXRpYmxlKClcbiAgICAgIGNvbnNvbGUud2FybiBcIlwiXCJcbiAgICAgICAgRmFpbGVkIHRvIHJlcXVpcmUgdGhlIG1haW4gbW9kdWxlIG9mICcje0BuYW1lfScgYmVjYXVzZSBpdCByZXF1aXJlcyBvbmUgb3IgbW9yZSBpbmNvbXBhdGlibGUgbmF0aXZlIG1vZHVsZXMgKCN7Xy5wbHVjayhAaW5jb21wYXRpYmxlTW9kdWxlcywgJ25hbWUnKS5qb2luKCcsICcpfSkuXG4gICAgICAgIFJ1biBgYXBtIHJlYnVpbGRgIGluIHRoZSBwYWNrYWdlIGRpcmVjdG9yeSBhbmQgcmVzdGFydCBBdG9tIHRvIHJlc29sdmUuXG4gICAgICBcIlwiXCJcbiAgICAgIHJldHVyblxuICAgIG1haW5Nb2R1bGVQYXRoID0gQGdldE1haW5Nb2R1bGVQYXRoKClcbiAgICBpZiBmcy5pc0ZpbGVTeW5jKG1haW5Nb2R1bGVQYXRoKVxuICAgICAgQG1haW5Nb2R1bGVSZXF1aXJlZCA9IHRydWVcblxuICAgICAgcHJldmlvdXNWaWV3UHJvdmlkZXJDb3VudCA9IEB2aWV3UmVnaXN0cnkuZ2V0Vmlld1Byb3ZpZGVyQ291bnQoKVxuICAgICAgcHJldmlvdXNEZXNlcmlhbGl6ZXJDb3VudCA9IEBkZXNlcmlhbGl6ZXJNYW5hZ2VyLmdldERlc2VyaWFsaXplckNvdW50KClcbiAgICAgIEBtYWluTW9kdWxlID0gcmVxdWlyZShtYWluTW9kdWxlUGF0aClcbiAgICAgIGlmIChAdmlld1JlZ2lzdHJ5LmdldFZpZXdQcm92aWRlckNvdW50KCkgaXMgcHJldmlvdXNWaWV3UHJvdmlkZXJDb3VudCBhbmRcbiAgICAgICAgICBAZGVzZXJpYWxpemVyTWFuYWdlci5nZXREZXNlcmlhbGl6ZXJDb3VudCgpIGlzIHByZXZpb3VzRGVzZXJpYWxpemVyQ291bnQpXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEBnZXRDYW5EZWZlck1haW5Nb2R1bGVSZXF1aXJlU3RvcmFnZUtleSgpLCAndHJ1ZScpXG5cbiAgZ2V0TWFpbk1vZHVsZVBhdGg6IC0+XG4gICAgcmV0dXJuIEBtYWluTW9kdWxlUGF0aCBpZiBAcmVzb2x2ZWRNYWluTW9kdWxlUGF0aFxuICAgIEByZXNvbHZlZE1haW5Nb2R1bGVQYXRoID0gdHJ1ZVxuXG4gICAgaWYgQGJ1bmRsZWRQYWNrYWdlIGFuZCBAcGFja2FnZU1hbmFnZXIucGFja2FnZXNDYWNoZVtAbmFtZV0/XG4gICAgICBpZiBAcGFja2FnZU1hbmFnZXIucGFja2FnZXNDYWNoZVtAbmFtZV0ubWFpblxuICAgICAgICBAbWFpbk1vZHVsZVBhdGggPSBcIiN7QHBhY2thZ2VNYW5hZ2VyLnJlc291cmNlUGF0aH0je3BhdGguc2VwfSN7QHBhY2thZ2VNYW5hZ2VyLnBhY2thZ2VzQ2FjaGVbQG5hbWVdLm1haW59XCJcbiAgICAgIGVsc2VcbiAgICAgICAgQG1haW5Nb2R1bGVQYXRoID0gbnVsbFxuICAgIGVsc2VcbiAgICAgIG1haW5Nb2R1bGVQYXRoID1cbiAgICAgICAgaWYgQG1ldGFkYXRhLm1haW5cbiAgICAgICAgICBwYXRoLmpvaW4oQHBhdGgsIEBtZXRhZGF0YS5tYWluKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGF0aC5qb2luKEBwYXRoLCAnaW5kZXgnKVxuICAgICAgQG1haW5Nb2R1bGVQYXRoID0gZnMucmVzb2x2ZUV4dGVuc2lvbihtYWluTW9kdWxlUGF0aCwgW1wiXCIsIF8ua2V5cyhyZXF1aXJlLmV4dGVuc2lvbnMpLi4uXSlcblxuICBhY3RpdmF0aW9uU2hvdWxkQmVEZWZlcnJlZDogLT5cbiAgICBAaGFzQWN0aXZhdGlvbkNvbW1hbmRzKCkgb3IgQGhhc0FjdGl2YXRpb25Ib29rcygpXG5cbiAgaGFzQWN0aXZhdGlvbkhvb2tzOiAtPlxuICAgIEBnZXRBY3RpdmF0aW9uSG9va3MoKT8ubGVuZ3RoID4gMFxuXG4gIGhhc0FjdGl2YXRpb25Db21tYW5kczogLT5cbiAgICBmb3Igc2VsZWN0b3IsIGNvbW1hbmRzIG9mIEBnZXRBY3RpdmF0aW9uQ29tbWFuZHMoKVxuICAgICAgcmV0dXJuIHRydWUgaWYgY29tbWFuZHMubGVuZ3RoID4gMFxuICAgIGZhbHNlXG5cbiAgc3Vic2NyaWJlVG9EZWZlcnJlZEFjdGl2YXRpb246IC0+XG4gICAgQHN1YnNjcmliZVRvQWN0aXZhdGlvbkNvbW1hbmRzKClcbiAgICBAc3Vic2NyaWJlVG9BY3RpdmF0aW9uSG9va3MoKVxuXG4gIHN1YnNjcmliZVRvQWN0aXZhdGlvbkNvbW1hbmRzOiAtPlxuICAgIEBhY3RpdmF0aW9uQ29tbWFuZFN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIGZvciBzZWxlY3RvciwgY29tbWFuZHMgb2YgQGdldEFjdGl2YXRpb25Db21tYW5kcygpXG4gICAgICBmb3IgY29tbWFuZCBpbiBjb21tYW5kc1xuICAgICAgICBkbyAoc2VsZWN0b3IsIGNvbW1hbmQpID0+XG4gICAgICAgICAgIyBBZGQgZHVtbXkgY29tbWFuZCBzbyBpdCBhcHBlYXJzIGluIG1lbnUuXG4gICAgICAgICAgIyBUaGUgcmVhbCBjb21tYW5kIHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiBwYWNrYWdlIGFjdGl2YXRpb25cbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIEBhY3RpdmF0aW9uQ29tbWFuZFN1YnNjcmlwdGlvbnMuYWRkIEBjb21tYW5kUmVnaXN0cnkuYWRkIHNlbGVjdG9yLCBjb21tYW5kLCAtPlxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICBpZiBlcnJvci5jb2RlIGlzICdFQkFEU0VMRUNUT1InXG4gICAgICAgICAgICAgIG1ldGFkYXRhUGF0aCA9IHBhdGguam9pbihAcGF0aCwgJ3BhY2thZ2UuanNvbicpXG4gICAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgKz0gXCIgaW4gI3ttZXRhZGF0YVBhdGh9XCJcbiAgICAgICAgICAgICAgZXJyb3Iuc3RhY2sgKz0gXCJcXG4gIGF0ICN7bWV0YWRhdGFQYXRofToxOjFcIlxuICAgICAgICAgICAgdGhyb3cgZXJyb3JcblxuICAgICAgICAgIEBhY3RpdmF0aW9uQ29tbWFuZFN1YnNjcmlwdGlvbnMuYWRkIEBjb21tYW5kUmVnaXN0cnkub25XaWxsRGlzcGF0Y2ggKGV2ZW50KSA9PlxuICAgICAgICAgICAgcmV0dXJuIHVubGVzcyBldmVudC50eXBlIGlzIGNvbW1hbmRcbiAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQgPSBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHdoaWxlIGN1cnJlbnRUYXJnZXRcbiAgICAgICAgICAgICAgaWYgY3VycmVudFRhcmdldC53ZWJraXRNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVOb3coKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LnBhcmVudEVsZW1lbnRcbiAgICAgICAgICAgIHJldHVyblxuICAgIHJldHVyblxuXG4gIGdldEFjdGl2YXRpb25Db21tYW5kczogLT5cbiAgICByZXR1cm4gQGFjdGl2YXRpb25Db21tYW5kcyBpZiBAYWN0aXZhdGlvbkNvbW1hbmRzP1xuXG4gICAgQGFjdGl2YXRpb25Db21tYW5kcyA9IHt9XG5cbiAgICBpZiBAbWV0YWRhdGEuYWN0aXZhdGlvbkNvbW1hbmRzP1xuICAgICAgZm9yIHNlbGVjdG9yLCBjb21tYW5kcyBvZiBAbWV0YWRhdGEuYWN0aXZhdGlvbkNvbW1hbmRzXG4gICAgICAgIEBhY3RpdmF0aW9uQ29tbWFuZHNbc2VsZWN0b3JdID89IFtdXG4gICAgICAgIGlmIF8uaXNTdHJpbmcoY29tbWFuZHMpXG4gICAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kc1tzZWxlY3Rvcl0ucHVzaChjb21tYW5kcylcbiAgICAgICAgZWxzZSBpZiBfLmlzQXJyYXkoY29tbWFuZHMpXG4gICAgICAgICAgQGFjdGl2YXRpb25Db21tYW5kc1tzZWxlY3Rvcl0ucHVzaChjb21tYW5kcy4uLilcblxuICAgIEBhY3RpdmF0aW9uQ29tbWFuZHNcblxuICBzdWJzY3JpYmVUb0FjdGl2YXRpb25Ib29rczogLT5cbiAgICBAYWN0aXZhdGlvbkhvb2tTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBmb3IgaG9vayBpbiBAZ2V0QWN0aXZhdGlvbkhvb2tzKClcbiAgICAgIGRvIChob29rKSA9PlxuICAgICAgICBAYWN0aXZhdGlvbkhvb2tTdWJzY3JpcHRpb25zLmFkZChAcGFja2FnZU1hbmFnZXIub25EaWRUcmlnZ2VyQWN0aXZhdGlvbkhvb2soaG9vaywgPT4gQGFjdGl2YXRlTm93KCkpKSBpZiBob29rPyBhbmQgXy5pc1N0cmluZyhob29rKSBhbmQgaG9vay50cmltKCkubGVuZ3RoID4gMFxuXG4gICAgcmV0dXJuXG5cbiAgZ2V0QWN0aXZhdGlvbkhvb2tzOiAtPlxuICAgIHJldHVybiBAYWN0aXZhdGlvbkhvb2tzIGlmIEBtZXRhZGF0YT8gYW5kIEBhY3RpdmF0aW9uSG9va3M/XG5cbiAgICBAYWN0aXZhdGlvbkhvb2tzID0gW11cblxuICAgIGlmIEBtZXRhZGF0YS5hY3RpdmF0aW9uSG9va3M/XG4gICAgICBpZiBfLmlzQXJyYXkoQG1ldGFkYXRhLmFjdGl2YXRpb25Ib29rcylcbiAgICAgICAgQGFjdGl2YXRpb25Ib29rcy5wdXNoKEBtZXRhZGF0YS5hY3RpdmF0aW9uSG9va3MuLi4pXG4gICAgICBlbHNlIGlmIF8uaXNTdHJpbmcoQG1ldGFkYXRhLmFjdGl2YXRpb25Ib29rcylcbiAgICAgICAgQGFjdGl2YXRpb25Ib29rcy5wdXNoKEBtZXRhZGF0YS5hY3RpdmF0aW9uSG9va3MpXG5cbiAgICBAYWN0aXZhdGlvbkhvb2tzID0gXy51bmlxKEBhY3RpdmF0aW9uSG9va3MpXG5cbiAgIyBEb2VzIHRoZSBnaXZlbiBtb2R1bGUgcGF0aCBjb250YWluIG5hdGl2ZSBjb2RlP1xuICBpc05hdGl2ZU1vZHVsZTogKG1vZHVsZVBhdGgpIC0+XG4gICAgdHJ5XG4gICAgICBmcy5saXN0U3luYyhwYXRoLmpvaW4obW9kdWxlUGF0aCwgJ2J1aWxkJywgJ1JlbGVhc2UnKSwgWycubm9kZSddKS5sZW5ndGggPiAwXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGZhbHNlXG5cbiAgIyBHZXQgYW4gYXJyYXkgb2YgYWxsIHRoZSBuYXRpdmUgbW9kdWxlcyB0aGF0IHRoaXMgcGFja2FnZSBkZXBlbmRzIG9uLlxuICAjXG4gICMgRmlyc3QgdHJ5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uIGZyb21cbiAgIyBAbWV0YWRhdGEuX2F0b21Nb2R1bGVDYWNoZS5leHRlbnNpb25zLiBJZiBAbWV0YWRhdGEuX2F0b21Nb2R1bGVDYWNoZSBkb2Vzbid0XG4gICMgZXhpc3QsIHJlY3Vyc2UgdGhyb3VnaCBhbGwgZGVwZW5kZW5jaWVzLlxuICBnZXROYXRpdmVNb2R1bGVEZXBlbmRlbmN5UGF0aHM6IC0+XG4gICAgbmF0aXZlTW9kdWxlUGF0aHMgPSBbXVxuXG4gICAgaWYgQG1ldGFkYXRhLl9hdG9tTW9kdWxlQ2FjaGU/XG4gICAgICByZWxhdGl2ZU5hdGl2ZU1vZHVsZUJpbmRpbmdQYXRocyA9IEBtZXRhZGF0YS5fYXRvbU1vZHVsZUNhY2hlLmV4dGVuc2lvbnM/Wycubm9kZSddID8gW11cbiAgICAgIGZvciByZWxhdGl2ZU5hdGl2ZU1vZHVsZUJpbmRpbmdQYXRoIGluIHJlbGF0aXZlTmF0aXZlTW9kdWxlQmluZGluZ1BhdGhzXG4gICAgICAgIG5hdGl2ZU1vZHVsZVBhdGggPSBwYXRoLmpvaW4oQHBhdGgsIHJlbGF0aXZlTmF0aXZlTW9kdWxlQmluZGluZ1BhdGgsICcuLicsICcuLicsICcuLicpXG4gICAgICAgIG5hdGl2ZU1vZHVsZVBhdGhzLnB1c2gobmF0aXZlTW9kdWxlUGF0aClcbiAgICAgIHJldHVybiBuYXRpdmVNb2R1bGVQYXRoc1xuXG4gICAgdHJhdmVyc2VQYXRoID0gKG5vZGVNb2R1bGVzUGF0aCkgPT5cbiAgICAgIHRyeVxuICAgICAgICBmb3IgbW9kdWxlUGF0aCBpbiBmcy5saXN0U3luYyhub2RlTW9kdWxlc1BhdGgpXG4gICAgICAgICAgbmF0aXZlTW9kdWxlUGF0aHMucHVzaChtb2R1bGVQYXRoKSBpZiBAaXNOYXRpdmVNb2R1bGUobW9kdWxlUGF0aClcbiAgICAgICAgICB0cmF2ZXJzZVBhdGgocGF0aC5qb2luKG1vZHVsZVBhdGgsICdub2RlX21vZHVsZXMnKSlcbiAgICAgIHJldHVyblxuXG4gICAgdHJhdmVyc2VQYXRoKHBhdGguam9pbihAcGF0aCwgJ25vZGVfbW9kdWxlcycpKVxuICAgIG5hdGl2ZU1vZHVsZVBhdGhzXG5cbiAgIyMjXG4gIFNlY3Rpb246IE5hdGl2ZSBNb2R1bGUgQ29tcGF0aWJpbGl0eVxuICAjIyNcblxuICAjIEV4dGVuZGVkOiBBcmUgYWxsIG5hdGl2ZSBtb2R1bGVzIGRlcGVuZGVkIG9uIGJ5IHRoaXMgcGFja2FnZSBjb3JyZWN0bHlcbiAgIyBjb21waWxlZCBhZ2FpbnN0IHRoZSBjdXJyZW50IHZlcnNpb24gb2YgQXRvbT9cbiAgI1xuICAjIEluY29tcGF0aWJsZSBwYWNrYWdlcyBjYW5ub3QgYmUgYWN0aXZhdGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSwgdHJ1ZSBpZiBjb21wYXRpYmxlLCBmYWxzZSBpZiBpbmNvbXBhdGlibGUuXG4gIGlzQ29tcGF0aWJsZTogLT5cbiAgICByZXR1cm4gQGNvbXBhdGlibGUgaWYgQGNvbXBhdGlibGU/XG5cbiAgICBpZiBAcGF0aC5pbmRleE9mKHBhdGguam9pbihAcGFja2FnZU1hbmFnZXIucmVzb3VyY2VQYXRoLCAnbm9kZV9tb2R1bGVzJykgKyBwYXRoLnNlcCkgaXMgMFxuICAgICAgIyBCdW5kbGVkIHBhY2thZ2VzIGFyZSBhbHdheXMgY29uc2lkZXJlZCBjb21wYXRpYmxlXG4gICAgICBAY29tcGF0aWJsZSA9IHRydWVcbiAgICBlbHNlIGlmIEBnZXRNYWluTW9kdWxlUGF0aCgpXG4gICAgICBAaW5jb21wYXRpYmxlTW9kdWxlcyA9IEBnZXRJbmNvbXBhdGlibGVOYXRpdmVNb2R1bGVzKClcbiAgICAgIEBjb21wYXRpYmxlID0gQGluY29tcGF0aWJsZU1vZHVsZXMubGVuZ3RoIGlzIDAgYW5kIG5vdCBAZ2V0QnVpbGRGYWlsdXJlT3V0cHV0KCk/XG4gICAgZWxzZVxuICAgICAgQGNvbXBhdGlibGUgPSB0cnVlXG5cbiAgIyBFeHRlbmRlZDogUmVidWlsZCBuYXRpdmUgbW9kdWxlcyBpbiB0aGlzIHBhY2thZ2UncyBkZXBlbmRlbmNpZXMgZm9yIHRoZVxuICAjIGN1cnJlbnQgdmVyc2lvbiBvZiBBdG9tLlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IHJlc29sdmVzIHdpdGggYW4gb2JqZWN0IGNvbnRhaW5pbmcgYGNvZGVgLFxuICAjIGBzdGRvdXRgLCBhbmQgYHN0ZGVycmAgcHJvcGVydGllcyBiYXNlZCBvbiB0aGUgcmVzdWx0cyBvZiBydW5uaW5nXG4gICMgYGFwbSByZWJ1aWxkYCBvbiB0aGUgcGFja2FnZS5cbiAgcmVidWlsZDogLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cbiAgICAgIEBydW5SZWJ1aWxkUHJvY2VzcyAocmVzdWx0KSA9PlxuICAgICAgICBpZiByZXN1bHQuY29kZSBpcyAwXG4gICAgICAgICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEBnZXRCdWlsZEZhaWx1cmVPdXRwdXRTdG9yYWdlS2V5KCkpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAY29tcGF0aWJsZSA9IGZhbHNlXG4gICAgICAgICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5zZXRJdGVtKEBnZXRCdWlsZEZhaWx1cmVPdXRwdXRTdG9yYWdlS2V5KCksIHJlc3VsdC5zdGRlcnIpXG4gICAgICAgIGdsb2JhbC5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShAZ2V0SW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlc1N0b3JhZ2VLZXkoKSwgJ1tdJylcbiAgICAgICAgcmVzb2x2ZShyZXN1bHQpXG5cbiAgIyBFeHRlbmRlZDogSWYgYSBwcmV2aW91cyByZWJ1aWxkIGZhaWxlZCwgZ2V0IHRoZSBjb250ZW50cyBvZiBzdGRlcnIuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30gb3IgbnVsbCBpZiBubyBwcmV2aW91cyBidWlsZCBmYWlsdXJlIG9jY3VycmVkLlxuICBnZXRCdWlsZEZhaWx1cmVPdXRwdXQ6IC0+XG4gICAgZ2xvYmFsLmxvY2FsU3RvcmFnZS5nZXRJdGVtKEBnZXRCdWlsZEZhaWx1cmVPdXRwdXRTdG9yYWdlS2V5KCkpXG5cbiAgcnVuUmVidWlsZFByb2Nlc3M6IChjYWxsYmFjaykgLT5cbiAgICBzdGRlcnIgPSAnJ1xuICAgIHN0ZG91dCA9ICcnXG4gICAgbmV3IEJ1ZmZlcmVkUHJvY2Vzcyh7XG4gICAgICBjb21tYW5kOiBAcGFja2FnZU1hbmFnZXIuZ2V0QXBtUGF0aCgpXG4gICAgICBhcmdzOiBbJ3JlYnVpbGQnLCAnLS1uby1jb2xvciddXG4gICAgICBvcHRpb25zOiB7Y3dkOiBAcGF0aH1cbiAgICAgIHN0ZGVycjogKG91dHB1dCkgLT4gc3RkZXJyICs9IG91dHB1dFxuICAgICAgc3Rkb3V0OiAob3V0cHV0KSAtPiBzdGRvdXQgKz0gb3V0cHV0XG4gICAgICBleGl0OiAoY29kZSkgLT4gY2FsbGJhY2soe2NvZGUsIHN0ZG91dCwgc3RkZXJyfSlcbiAgICB9KVxuXG4gIGdldEJ1aWxkRmFpbHVyZU91dHB1dFN0b3JhZ2VLZXk6IC0+XG4gICAgXCJpbnN0YWxsZWQtcGFja2FnZXM6I3tAbmFtZX06I3tAbWV0YWRhdGEudmVyc2lvbn06YnVpbGQtZXJyb3JcIlxuXG4gIGdldEluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXNTdG9yYWdlS2V5OiAtPlxuICAgIGVsZWN0cm9uVmVyc2lvbiA9IHByb2Nlc3MudmVyc2lvbnNbJ2VsZWN0cm9uJ10gPyBwcm9jZXNzLnZlcnNpb25zWydhdG9tLXNoZWxsJ11cbiAgICBcImluc3RhbGxlZC1wYWNrYWdlczoje0BuYW1lfToje0BtZXRhZGF0YS52ZXJzaW9ufTplbGVjdHJvbi0je2VsZWN0cm9uVmVyc2lvbn06aW5jb21wYXRpYmxlLW5hdGl2ZS1tb2R1bGVzXCJcblxuICBnZXRDYW5EZWZlck1haW5Nb2R1bGVSZXF1aXJlU3RvcmFnZUtleTogLT5cbiAgICBcImluc3RhbGxlZC1wYWNrYWdlczoje0BuYW1lfToje0BtZXRhZGF0YS52ZXJzaW9ufTpjYW4tZGVmZXItbWFpbi1tb2R1bGUtcmVxdWlyZVwiXG5cbiAgIyBHZXQgdGhlIGluY29tcGF0aWJsZSBuYXRpdmUgbW9kdWxlcyB0aGF0IHRoaXMgcGFja2FnZSBkZXBlbmRzIG9uLlxuICAjIFRoaXMgcmVjdXJzZXMgdGhyb3VnaCBhbGwgZGVwZW5kZW5jaWVzIGFuZCByZXF1aXJlcyBhbGwgbW9kdWxlcyB0aGF0XG4gICMgY29udGFpbiBhIGAubm9kZWAgZmlsZS5cbiAgI1xuICAjIFRoaXMgaW5mb3JtYXRpb24gaXMgY2FjaGVkIGluIGxvY2FsIHN0b3JhZ2Ugb24gYSBwZXIgcGFja2FnZS92ZXJzaW9uIGJhc2lzXG4gICMgdG8gbWluaW1pemUgdGhlIGltcGFjdCBvbiBzdGFydHVwIHRpbWUuXG4gIGdldEluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXM6IC0+XG4gICAgdW5sZXNzIEBkZXZNb2RlXG4gICAgICB0cnlcbiAgICAgICAgaWYgYXJyYXlBc1N0cmluZyA9IGdsb2JhbC5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShAZ2V0SW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlc1N0b3JhZ2VLZXkoKSlcbiAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShhcnJheUFzU3RyaW5nKVxuXG4gICAgaW5jb21wYXRpYmxlTmF0aXZlTW9kdWxlcyA9IFtdXG4gICAgZm9yIG5hdGl2ZU1vZHVsZVBhdGggaW4gQGdldE5hdGl2ZU1vZHVsZURlcGVuZGVuY3lQYXRocygpXG4gICAgICB0cnlcbiAgICAgICAgcmVxdWlyZShuYXRpdmVNb2R1bGVQYXRoKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgdHJ5XG4gICAgICAgICAgdmVyc2lvbiA9IHJlcXVpcmUoXCIje25hdGl2ZU1vZHVsZVBhdGh9L3BhY2thZ2UuanNvblwiKS52ZXJzaW9uXG4gICAgICAgIGluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXMucHVzaFxuICAgICAgICAgIHBhdGg6IG5hdGl2ZU1vZHVsZVBhdGhcbiAgICAgICAgICBuYW1lOiBwYXRoLmJhc2VuYW1lKG5hdGl2ZU1vZHVsZVBhdGgpXG4gICAgICAgICAgdmVyc2lvbjogdmVyc2lvblxuICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG5cbiAgICBnbG9iYWwubG9jYWxTdG9yYWdlLnNldEl0ZW0oQGdldEluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXNTdG9yYWdlS2V5KCksIEpTT04uc3RyaW5naWZ5KGluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXMpKVxuICAgIGluY29tcGF0aWJsZU5hdGl2ZU1vZHVsZXNcblxuICBoYW5kbGVFcnJvcjogKG1lc3NhZ2UsIGVycm9yKSAtPlxuICAgIGlmIGVycm9yLmZpbGVuYW1lIGFuZCBlcnJvci5sb2NhdGlvbiBhbmQgKGVycm9yIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpXG4gICAgICBsb2NhdGlvbiA9IFwiI3tlcnJvci5maWxlbmFtZX06I3tlcnJvci5sb2NhdGlvbi5maXJzdF9saW5lICsgMX06I3tlcnJvci5sb2NhdGlvbi5maXJzdF9jb2x1bW4gKyAxfVwiXG4gICAgICBkZXRhaWwgPSBcIiN7ZXJyb3IubWVzc2FnZX0gaW4gI3tsb2NhdGlvbn1cIlxuICAgICAgc3RhY2sgPSBcIlwiXCJcbiAgICAgICAgU3ludGF4RXJyb3I6ICN7ZXJyb3IubWVzc2FnZX1cbiAgICAgICAgICBhdCAje2xvY2F0aW9ufVxuICAgICAgXCJcIlwiXG4gICAgZWxzZSBpZiBlcnJvci5sZXNzIGFuZCBlcnJvci5maWxlbmFtZSBhbmQgZXJyb3IuY29sdW1uPyBhbmQgZXJyb3IubGluZT9cbiAgICAgICMgTGVzcyBlcnJvcnNcbiAgICAgIGxvY2F0aW9uID0gXCIje2Vycm9yLmZpbGVuYW1lfToje2Vycm9yLmxpbmV9OiN7ZXJyb3IuY29sdW1ufVwiXG4gICAgICBkZXRhaWwgPSBcIiN7ZXJyb3IubWVzc2FnZX0gaW4gI3tsb2NhdGlvbn1cIlxuICAgICAgc3RhY2sgPSBcIlwiXCJcbiAgICAgICAgTGVzc0Vycm9yOiAje2Vycm9yLm1lc3NhZ2V9XG4gICAgICAgICAgYXQgI3tsb2NhdGlvbn1cbiAgICAgIFwiXCJcIlxuICAgIGVsc2VcbiAgICAgIGRldGFpbCA9IGVycm9yLm1lc3NhZ2VcbiAgICAgIHN0YWNrID0gZXJyb3Iuc3RhY2sgPyBlcnJvclxuXG4gICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRmF0YWxFcnJvcihtZXNzYWdlLCB7c3RhY2ssIGRldGFpbCwgcGFja2FnZU5hbWU6IEBuYW1lLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG4iXX0=
