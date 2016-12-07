(function() {
  var CSON, Emitter, Package, PackageManager, ServiceHub, ThemePackage, _, fs, getDeprecatedPackageMetadata, isDeprecatedPackage, normalizePackageData, path, ref,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  normalizePackageData = null;

  _ = require('underscore-plus');

  Emitter = require('event-kit').Emitter;

  fs = require('fs-plus');

  CSON = require('season');

  ServiceHub = require('service-hub');

  Package = require('./package');

  ThemePackage = require('./theme-package');

  ref = require('./deprecated-packages'), isDeprecatedPackage = ref.isDeprecatedPackage, getDeprecatedPackageMetadata = ref.getDeprecatedPackageMetadata;

  module.exports = PackageManager = (function() {
    function PackageManager(params) {
      var configDirPath, ref1, ref2, safeMode;
      configDirPath = params.configDirPath, this.devMode = params.devMode, safeMode = params.safeMode, this.resourcePath = params.resourcePath, this.config = params.config, this.styleManager = params.styleManager, this.notificationManager = params.notificationManager, this.keymapManager = params.keymapManager, this.commandRegistry = params.commandRegistry, this.grammarRegistry = params.grammarRegistry, this.deserializerManager = params.deserializerManager, this.viewRegistry = params.viewRegistry;
      this.emitter = new Emitter;
      this.activationHookEmitter = new Emitter;
      this.packageDirPaths = [];
      this.deferredActivationHooks = [];
      if ((configDirPath != null) && !safeMode) {
        if (this.devMode) {
          this.packageDirPaths.push(path.join(configDirPath, "dev", "packages"));
        }
        this.packageDirPaths.push(path.join(configDirPath, "packages"));
      }
      this.packagesCache = (ref1 = (ref2 = require('../package.json')) != null ? ref2._atomPackages : void 0) != null ? ref1 : {};
      this.initialPackagesLoaded = false;
      this.initialPackagesActivated = false;
      this.loadedPackages = {};
      this.activePackages = {};
      this.activatingPackages = {};
      this.packageStates = {};
      this.serviceHub = new ServiceHub;
      this.packageActivators = [];
      this.registerPackageActivator(this, ['atom', 'textmate']);
    }

    PackageManager.prototype.setContextMenuManager = function(contextMenuManager) {
      this.contextMenuManager = contextMenuManager;
    };

    PackageManager.prototype.setMenuManager = function(menuManager) {
      this.menuManager = menuManager;
    };

    PackageManager.prototype.setThemeManager = function(themeManager) {
      this.themeManager = themeManager;
    };

    PackageManager.prototype.reset = function() {
      this.serviceHub.clear();
      this.deactivatePackages();
      this.loadedPackages = {};
      return this.packageStates = {};
    };


    /*
    Section: Event Subscription
     */

    PackageManager.prototype.onDidLoadInitialPackages = function(callback) {
      return this.emitter.on('did-load-initial-packages', callback);
    };

    PackageManager.prototype.onDidActivateInitialPackages = function(callback) {
      return this.emitter.on('did-activate-initial-packages', callback);
    };

    PackageManager.prototype.onDidActivatePackage = function(callback) {
      return this.emitter.on('did-activate-package', callback);
    };

    PackageManager.prototype.onDidDeactivatePackage = function(callback) {
      return this.emitter.on('did-deactivate-package', callback);
    };

    PackageManager.prototype.onDidLoadPackage = function(callback) {
      return this.emitter.on('did-load-package', callback);
    };

    PackageManager.prototype.onDidUnloadPackage = function(callback) {
      return this.emitter.on('did-unload-package', callback);
    };


    /*
    Section: Package system data
     */

    PackageManager.prototype.getApmPath = function() {
      var apmRoot, commandName, configPath;
      configPath = atom.config.get('core.apmPath');
      if (configPath) {
        return configPath;
      }
      if (this.apmPath != null) {
        return this.apmPath;
      }
      commandName = 'apm';
      if (process.platform === 'win32') {
        commandName += '.cmd';
      }
      apmRoot = path.join(process.resourcesPath, 'app', 'apm');
      this.apmPath = path.join(apmRoot, 'bin', commandName);
      if (!fs.isFileSync(this.apmPath)) {
        this.apmPath = path.join(apmRoot, 'node_modules', 'atom-package-manager', 'bin', commandName);
      }
      return this.apmPath;
    };

    PackageManager.prototype.getPackageDirPaths = function() {
      return _.clone(this.packageDirPaths);
    };


    /*
    Section: General package data
     */

    PackageManager.prototype.resolvePackagePath = function(name) {
      var packagePath;
      if (fs.isDirectorySync(name)) {
        return name;
      }
      packagePath = fs.resolve.apply(fs, slice.call(this.packageDirPaths).concat([name]));
      if (fs.isDirectorySync(packagePath)) {
        return packagePath;
      }
      packagePath = path.join(this.resourcePath, 'node_modules', name);
      if (this.hasAtomEngine(packagePath)) {
        return packagePath;
      }
    };

    PackageManager.prototype.isBundledPackage = function(name) {
      return this.getPackageDependencies().hasOwnProperty(name);
    };

    PackageManager.prototype.isDeprecatedPackage = function(name, version) {
      return isDeprecatedPackage(name, version);
    };

    PackageManager.prototype.getDeprecatedPackageMetadata = function(name) {
      return getDeprecatedPackageMetadata(name);
    };


    /*
    Section: Enabling and disabling packages
     */

    PackageManager.prototype.enablePackage = function(name) {
      var pack;
      pack = this.loadPackage(name);
      if (pack != null) {
        pack.enable();
      }
      return pack;
    };

    PackageManager.prototype.disablePackage = function(name) {
      var pack;
      pack = this.loadPackage(name);
      if (!this.isPackageDisabled(name)) {
        if (pack != null) {
          pack.disable();
        }
      }
      return pack;
    };

    PackageManager.prototype.isPackageDisabled = function(name) {
      var ref1;
      return _.include((ref1 = this.config.get('core.disabledPackages')) != null ? ref1 : [], name);
    };


    /*
    Section: Accessing active packages
     */

    PackageManager.prototype.getActivePackages = function() {
      return _.values(this.activePackages);
    };

    PackageManager.prototype.getActivePackage = function(name) {
      return this.activePackages[name];
    };

    PackageManager.prototype.isPackageActive = function(name) {
      return this.getActivePackage(name) != null;
    };

    PackageManager.prototype.hasActivatedInitialPackages = function() {
      return this.initialPackagesActivated;
    };


    /*
    Section: Accessing loaded packages
     */

    PackageManager.prototype.getLoadedPackages = function() {
      return _.values(this.loadedPackages);
    };

    PackageManager.prototype.getLoadedPackagesForTypes = function(types) {
      var i, len, pack, ref1, ref2, results;
      ref1 = this.getLoadedPackages();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        if (ref2 = pack.getType(), indexOf.call(types, ref2) >= 0) {
          results.push(pack);
        }
      }
      return results;
    };

    PackageManager.prototype.getLoadedPackage = function(name) {
      return this.loadedPackages[name];
    };

    PackageManager.prototype.isPackageLoaded = function(name) {
      return this.getLoadedPackage(name) != null;
    };

    PackageManager.prototype.hasLoadedInitialPackages = function() {
      return this.initialPackagesLoaded;
    };


    /*
    Section: Accessing available packages
     */

    PackageManager.prototype.getAvailablePackagePaths = function() {
      var i, j, len, len1, packageDirPath, packageName, packagePath, packagePaths, packagesPath, ref1, ref2;
      packagePaths = [];
      ref1 = this.packageDirPaths;
      for (i = 0, len = ref1.length; i < len; i++) {
        packageDirPath = ref1[i];
        ref2 = fs.listSync(packageDirPath);
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          packagePath = ref2[j];
          if (fs.isDirectorySync(packagePath)) {
            packagePaths.push(packagePath);
          }
        }
      }
      packagesPath = path.join(this.resourcePath, 'node_modules');
      for (packageName in this.getPackageDependencies()) {
        packagePath = path.join(packagesPath, packageName);
        if (fs.isDirectorySync(packagePath)) {
          packagePaths.push(packagePath);
        }
      }
      return _.uniq(packagePaths);
    };

    PackageManager.prototype.getAvailablePackageNames = function() {
      return _.uniq(_.map(this.getAvailablePackagePaths(), function(packagePath) {
        return path.basename(packagePath);
      }));
    };

    PackageManager.prototype.getAvailablePackageMetadata = function() {
      var i, len, metadata, name, packagePath, packages, ref1, ref2, ref3;
      packages = [];
      ref1 = this.getAvailablePackagePaths();
      for (i = 0, len = ref1.length; i < len; i++) {
        packagePath = ref1[i];
        name = path.basename(packagePath);
        metadata = (ref2 = (ref3 = this.getLoadedPackage(name)) != null ? ref3.metadata : void 0) != null ? ref2 : this.loadPackageMetadata(packagePath, true);
        packages.push(metadata);
      }
      return packages;
    };


    /*
    Section: Private
     */

    PackageManager.prototype.getPackageState = function(name) {
      return this.packageStates[name];
    };

    PackageManager.prototype.setPackageState = function(name, state) {
      return this.packageStates[name] = state;
    };

    PackageManager.prototype.getPackageDependencies = function() {
      var ref1;
      if (this.packageDependencies == null) {
        try {
          this.packageDependencies = (ref1 = require('../package.json')) != null ? ref1.packageDependencies : void 0;
        } catch (error1) {}
        if (this.packageDependencies == null) {
          this.packageDependencies = {};
        }
      }
      return this.packageDependencies;
    };

    PackageManager.prototype.hasAtomEngine = function(packagePath) {
      var metadata, ref1;
      metadata = this.loadPackageMetadata(packagePath, true);
      return (metadata != null ? (ref1 = metadata.engines) != null ? ref1.atom : void 0 : void 0) != null;
    };

    PackageManager.prototype.unobserveDisabledPackages = function() {
      var ref1;
      if ((ref1 = this.disabledPackagesSubscription) != null) {
        ref1.dispose();
      }
      return this.disabledPackagesSubscription = null;
    };

    PackageManager.prototype.observeDisabledPackages = function() {
      return this.disabledPackagesSubscription != null ? this.disabledPackagesSubscription : this.disabledPackagesSubscription = this.config.onDidChange('core.disabledPackages', (function(_this) {
        return function(arg) {
          var i, j, len, len1, newValue, oldValue, packageName, packagesToDisable, packagesToEnable;
          newValue = arg.newValue, oldValue = arg.oldValue;
          packagesToEnable = _.difference(oldValue, newValue);
          packagesToDisable = _.difference(newValue, oldValue);
          for (i = 0, len = packagesToDisable.length; i < len; i++) {
            packageName = packagesToDisable[i];
            if (_this.getActivePackage(packageName)) {
              _this.deactivatePackage(packageName);
            }
          }
          for (j = 0, len1 = packagesToEnable.length; j < len1; j++) {
            packageName = packagesToEnable[j];
            _this.activatePackage(packageName);
          }
          return null;
        };
      })(this));
    };

    PackageManager.prototype.unobservePackagesWithKeymapsDisabled = function() {
      var ref1;
      if ((ref1 = this.packagesWithKeymapsDisabledSubscription) != null) {
        ref1.dispose();
      }
      return this.packagesWithKeymapsDisabledSubscription = null;
    };

    PackageManager.prototype.observePackagesWithKeymapsDisabled = function() {
      return this.packagesWithKeymapsDisabledSubscription != null ? this.packagesWithKeymapsDisabledSubscription : this.packagesWithKeymapsDisabledSubscription = this.config.onDidChange('core.packagesWithKeymapsDisabled', (function(_this) {
        return function(arg) {
          var i, j, keymapsToDisable, keymapsToEnable, len, len1, newValue, oldValue, packageName, ref1, ref2;
          newValue = arg.newValue, oldValue = arg.oldValue;
          keymapsToEnable = _.difference(oldValue, newValue);
          keymapsToDisable = _.difference(newValue, oldValue);
          for (i = 0, len = keymapsToDisable.length; i < len; i++) {
            packageName = keymapsToDisable[i];
            if (!_this.isPackageDisabled(packageName)) {
              if ((ref1 = _this.getLoadedPackage(packageName)) != null) {
                ref1.deactivateKeymaps();
              }
            }
          }
          for (j = 0, len1 = keymapsToEnable.length; j < len1; j++) {
            packageName = keymapsToEnable[j];
            if (!_this.isPackageDisabled(packageName)) {
              if ((ref2 = _this.getLoadedPackage(packageName)) != null) {
                ref2.activateKeymaps();
              }
            }
          }
          return null;
        };
      })(this));
    };

    PackageManager.prototype.loadPackages = function() {
      var packagePaths;
      require('../exports/atom');
      packagePaths = this.getAvailablePackagePaths();
      packagePaths = packagePaths.filter((function(_this) {
        return function(packagePath) {
          return !_this.isPackageDisabled(path.basename(packagePath));
        };
      })(this));
      packagePaths = _.uniq(packagePaths, function(packagePath) {
        return path.basename(packagePath);
      });
      this.config.transact((function(_this) {
        return function() {
          var i, len, packagePath;
          for (i = 0, len = packagePaths.length; i < len; i++) {
            packagePath = packagePaths[i];
            _this.loadPackage(packagePath);
          }
        };
      })(this));
      this.initialPackagesLoaded = true;
      return this.emitter.emit('did-load-initial-packages');
    };

    PackageManager.prototype.loadPackage = function(nameOrPath) {
      var error, metadata, name, options, pack, packagePath, ref1;
      if (path.basename(nameOrPath)[0].match(/^\./)) {
        return null;
      }
      if (pack = this.getLoadedPackage(nameOrPath)) {
        return pack;
      }
      if (packagePath = this.resolvePackagePath(nameOrPath)) {
        name = path.basename(nameOrPath);
        if (pack = this.getLoadedPackage(name)) {
          return pack;
        }
        try {
          metadata = (ref1 = this.loadPackageMetadata(packagePath)) != null ? ref1 : {};
        } catch (error1) {
          error = error1;
          this.handleMetadataError(error, packagePath);
          return null;
        }
        if (!this.isBundledPackage(metadata.name)) {
          if (this.isDeprecatedPackage(metadata.name, metadata.version)) {
            console.warn("Could not load " + metadata.name + "@" + metadata.version + " because it uses deprecated APIs that have been removed.");
            return null;
          }
        }
        options = {
          path: packagePath,
          metadata: metadata,
          packageManager: this,
          config: this.config,
          styleManager: this.styleManager,
          commandRegistry: this.commandRegistry,
          keymapManager: this.keymapManager,
          devMode: this.devMode,
          notificationManager: this.notificationManager,
          grammarRegistry: this.grammarRegistry,
          themeManager: this.themeManager,
          menuManager: this.menuManager,
          contextMenuManager: this.contextMenuManager,
          deserializerManager: this.deserializerManager,
          viewRegistry: this.viewRegistry
        };
        if (metadata.theme) {
          pack = new ThemePackage(options);
        } else {
          pack = new Package(options);
        }
        pack.load();
        this.loadedPackages[pack.name] = pack;
        this.emitter.emit('did-load-package', pack);
        return pack;
      } else {
        console.warn("Could not resolve '" + nameOrPath + "' to a package path");
      }
      return null;
    };

    PackageManager.prototype.unloadPackages = function() {
      var i, len, name, ref1;
      ref1 = _.keys(this.loadedPackages);
      for (i = 0, len = ref1.length; i < len; i++) {
        name = ref1[i];
        this.unloadPackage(name);
      }
      return null;
    };

    PackageManager.prototype.unloadPackage = function(name) {
      var pack;
      if (this.isPackageActive(name)) {
        throw new Error("Tried to unload active package '" + name + "'");
      }
      if (pack = this.getLoadedPackage(name)) {
        delete this.loadedPackages[pack.name];
        return this.emitter.emit('did-unload-package', pack);
      } else {
        throw new Error("No loaded package for name '" + name + "'");
      }
    };

    PackageManager.prototype.activate = function() {
      var activator, i, len, packages, promises, ref1, ref2, types;
      promises = [];
      ref1 = this.packageActivators;
      for (i = 0, len = ref1.length; i < len; i++) {
        ref2 = ref1[i], activator = ref2[0], types = ref2[1];
        packages = this.getLoadedPackagesForTypes(types);
        promises = promises.concat(activator.activatePackages(packages));
      }
      return Promise.all(promises).then((function(_this) {
        return function() {
          _this.triggerDeferredActivationHooks();
          _this.initialPackagesActivated = true;
          return _this.emitter.emit('did-activate-initial-packages');
        };
      })(this));
    };

    PackageManager.prototype.registerPackageActivator = function(activator, types) {
      return this.packageActivators.push([activator, types]);
    };

    PackageManager.prototype.activatePackages = function(packages) {
      var promises;
      promises = [];
      this.config.transactAsync((function(_this) {
        return function() {
          var i, len, pack, promise;
          for (i = 0, len = packages.length; i < len; i++) {
            pack = packages[i];
            promise = _this.activatePackage(pack.name);
            if (!pack.activationShouldBeDeferred()) {
              promises.push(promise);
            }
          }
          return Promise.all(promises);
        };
      })(this));
      this.observeDisabledPackages();
      this.observePackagesWithKeymapsDisabled();
      return promises;
    };

    PackageManager.prototype.activatePackage = function(name) {
      var pack;
      if (pack = this.getActivePackage(name)) {
        return Promise.resolve(pack);
      } else if (pack = this.loadPackage(name)) {
        this.activatingPackages[pack.name] = pack;
        return pack.activate().then((function(_this) {
          return function() {
            if (_this.activatingPackages[pack.name] != null) {
              delete _this.activatingPackages[pack.name];
              _this.activePackages[pack.name] = pack;
              _this.emitter.emit('did-activate-package', pack);
            }
            return pack;
          };
        })(this));
      } else {
        return Promise.reject(new Error("Failed to load package '" + name + "'"));
      }
    };

    PackageManager.prototype.triggerDeferredActivationHooks = function() {
      var hook, i, len, ref1;
      if (this.deferredActivationHooks == null) {
        return;
      }
      ref1 = this.deferredActivationHooks;
      for (i = 0, len = ref1.length; i < len; i++) {
        hook = ref1[i];
        this.activationHookEmitter.emit(hook);
      }
      return this.deferredActivationHooks = null;
    };

    PackageManager.prototype.triggerActivationHook = function(hook) {
      if (!((hook != null) && _.isString(hook) && hook.length > 0)) {
        return new Error("Cannot trigger an empty activation hook");
      }
      if (this.deferredActivationHooks != null) {
        return this.deferredActivationHooks.push(hook);
      } else {
        return this.activationHookEmitter.emit(hook);
      }
    };

    PackageManager.prototype.onDidTriggerActivationHook = function(hook, callback) {
      if (!((hook != null) && _.isString(hook) && hook.length > 0)) {
        return;
      }
      return this.activationHookEmitter.on(hook, callback);
    };

    PackageManager.prototype.serialize = function() {
      var i, len, pack, ref1;
      ref1 = this.getActivePackages();
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        this.serializePackage(pack);
      }
      return this.packageStates;
    };

    PackageManager.prototype.serializePackage = function(pack) {
      var state;
      if (state = typeof pack.serialize === "function" ? pack.serialize() : void 0) {
        return this.setPackageState(pack.name, state);
      }
    };

    PackageManager.prototype.deactivatePackages = function() {
      this.config.transact((function(_this) {
        return function() {
          var i, len, pack, ref1;
          ref1 = _this.getLoadedPackages();
          for (i = 0, len = ref1.length; i < len; i++) {
            pack = ref1[i];
            _this.deactivatePackage(pack.name, true);
          }
        };
      })(this));
      this.unobserveDisabledPackages();
      return this.unobservePackagesWithKeymapsDisabled();
    };

    PackageManager.prototype.deactivatePackage = function(name, suppressSerialization) {
      var pack;
      pack = this.getLoadedPackage(name);
      if (!suppressSerialization && this.isPackageActive(pack.name)) {
        this.serializePackage(pack);
      }
      pack.deactivate();
      delete this.activePackages[pack.name];
      delete this.activatingPackages[pack.name];
      return this.emitter.emit('did-deactivate-package', pack);
    };

    PackageManager.prototype.handleMetadataError = function(error, packagePath) {
      var detail, message, metadataPath, stack;
      metadataPath = path.join(packagePath, 'package.json');
      detail = error.message + " in " + metadataPath;
      stack = error.stack + "\n  at " + metadataPath + ":1:1";
      message = "Failed to load the " + (path.basename(packagePath)) + " package";
      return this.notificationManager.addError(message, {
        stack: stack,
        detail: detail,
        packageName: path.basename(packagePath),
        dismissable: true
      });
    };

    PackageManager.prototype.uninstallDirectory = function(directory) {
      var dirPromise, symlinkPromise;
      symlinkPromise = new Promise(function(resolve) {
        return fs.isSymbolicLink(directory, function(isSymLink) {
          return resolve(isSymLink);
        });
      });
      dirPromise = new Promise(function(resolve) {
        return fs.isDirectory(directory, function(isDir) {
          return resolve(isDir);
        });
      });
      return Promise.all([symlinkPromise, dirPromise]).then(function(values) {
        var isDir, isSymLink;
        isSymLink = values[0], isDir = values[1];
        if (!isSymLink && isDir) {
          return fs.remove(directory, function() {});
        }
      });
    };

    PackageManager.prototype.reloadActivePackageStyleSheets = function() {
      var i, len, pack, ref1;
      ref1 = this.getActivePackages();
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        if (pack.getType() !== 'theme') {
          if (typeof pack.reloadStylesheets === "function") {
            pack.reloadStylesheets();
          }
        }
      }
    };

    PackageManager.prototype.isBundledPackagePath = function(packagePath) {
      if (this.devMode) {
        if (!this.resourcePath.startsWith("" + process.resourcesPath + path.sep)) {
          return false;
        }
      }
      if (this.resourcePathWithTrailingSlash == null) {
        this.resourcePathWithTrailingSlash = "" + this.resourcePath + path.sep;
      }
      return packagePath != null ? packagePath.startsWith(this.resourcePathWithTrailingSlash) : void 0;
    };

    PackageManager.prototype.loadPackageMetadata = function(packagePath, ignoreErrors) {
      var error, metadata, metadataPath, packageName, ref1, ref2;
      if (ignoreErrors == null) {
        ignoreErrors = false;
      }
      packageName = path.basename(packagePath);
      if (this.isBundledPackagePath(packagePath)) {
        metadata = (ref1 = this.packagesCache[packageName]) != null ? ref1.metadata : void 0;
      }
      if (metadata == null) {
        if (metadataPath = CSON.resolve(path.join(packagePath, 'package'))) {
          try {
            metadata = CSON.readFileSync(metadataPath);
            this.normalizePackageMetadata(metadata);
          } catch (error1) {
            error = error1;
            if (!ignoreErrors) {
              throw error;
            }
          }
        }
      }
      if (metadata == null) {
        metadata = {};
      }
      if (!(typeof metadata.name === 'string' && metadata.name.length > 0)) {
        metadata.name = packageName;
      }
      if (((ref2 = metadata.repository) != null ? ref2.type : void 0) === 'git' && typeof metadata.repository.url === 'string') {
        metadata.repository.url = metadata.repository.url.replace(/(^git\+)|(\.git$)/g, '');
      }
      return metadata;
    };

    PackageManager.prototype.normalizePackageMetadata = function(metadata) {
      if (!(metadata != null ? metadata._id : void 0)) {
        if (normalizePackageData == null) {
          normalizePackageData = require('normalize-package-data');
        }
        return normalizePackageData(metadata);
      }
    };

    return PackageManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3BhY2thZ2UtbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJKQUFBO0lBQUE7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxvQkFBQSxHQUF1Qjs7RUFFdkIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxVQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUNaLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBRVAsVUFBQSxHQUFhLE9BQUEsQ0FBUSxhQUFSOztFQUNiLE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUjs7RUFDVixZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNmLE1BQXNELE9BQUEsQ0FBUSx1QkFBUixDQUF0RCxFQUFDLDZDQUFELEVBQXNCOztFQWlCdEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHdCQUFDLE1BQUQ7QUFDWCxVQUFBO01BQ0Usb0NBREYsRUFDaUIsSUFBQyxDQUFBLGlCQUFBLE9BRGxCLEVBQzJCLDBCQUQzQixFQUNxQyxJQUFDLENBQUEsc0JBQUEsWUFEdEMsRUFDb0QsSUFBQyxDQUFBLGdCQUFBLE1BRHJELEVBQzZELElBQUMsQ0FBQSxzQkFBQSxZQUQ5RCxFQUVFLElBQUMsQ0FBQSw2QkFBQSxtQkFGSCxFQUV3QixJQUFDLENBQUEsdUJBQUEsYUFGekIsRUFFd0MsSUFBQyxDQUFBLHlCQUFBLGVBRnpDLEVBRTBELElBQUMsQ0FBQSx5QkFBQSxlQUYzRCxFQUdFLElBQUMsQ0FBQSw2QkFBQSxtQkFISCxFQUd3QixJQUFDLENBQUEsc0JBQUE7TUFHekIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLHFCQUFELEdBQXlCLElBQUk7TUFDN0IsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLHVCQUFELEdBQTJCO01BQzNCLElBQUcsdUJBQUEsSUFBbUIsQ0FBSSxRQUExQjtRQUNFLElBQUcsSUFBQyxDQUFBLE9BQUo7VUFDRSxJQUFDLENBQUEsZUFBZSxDQUFDLElBQWpCLENBQXNCLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixLQUF6QixFQUFnQyxVQUFoQyxDQUF0QixFQURGOztRQUVBLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLFVBQXpCLENBQXRCLEVBSEY7O01BS0EsSUFBQyxDQUFBLGFBQUQsdUdBQTZEO01BQzdELElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtNQUN6QixJQUFDLENBQUEsd0JBQUQsR0FBNEI7TUFDNUIsSUFBQyxDQUFBLGNBQUQsR0FBa0I7TUFDbEIsSUFBQyxDQUFBLGNBQUQsR0FBa0I7TUFDbEIsSUFBQyxDQUFBLGtCQUFELEdBQXNCO01BQ3RCLElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSTtNQUVsQixJQUFDLENBQUEsaUJBQUQsR0FBcUI7TUFDckIsSUFBQyxDQUFBLHdCQUFELENBQTBCLElBQTFCLEVBQWdDLENBQUMsTUFBRCxFQUFTLFVBQVQsQ0FBaEM7SUExQlc7OzZCQTRCYixxQkFBQSxHQUF1QixTQUFDLGtCQUFEO01BQUMsSUFBQyxDQUFBLHFCQUFEO0lBQUQ7OzZCQUV2QixjQUFBLEdBQWdCLFNBQUMsV0FBRDtNQUFDLElBQUMsQ0FBQSxjQUFEO0lBQUQ7OzZCQUVoQixlQUFBLEdBQWlCLFNBQUMsWUFBRDtNQUFDLElBQUMsQ0FBQSxlQUFEO0lBQUQ7OzZCQUVqQixLQUFBLEdBQU8sU0FBQTtNQUNMLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFBO01BQ0EsSUFBQyxDQUFBLGtCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsY0FBRCxHQUFrQjthQUNsQixJQUFDLENBQUEsYUFBRCxHQUFpQjtJQUpaOzs7QUFNUDs7Ozs2QkFTQSx3QkFBQSxHQUEwQixTQUFDLFFBQUQ7YUFDeEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksMkJBQVosRUFBeUMsUUFBekM7SUFEd0I7OzZCQVExQiw0QkFBQSxHQUE4QixTQUFDLFFBQUQ7YUFDNUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksK0JBQVosRUFBNkMsUUFBN0M7SUFENEI7OzZCQVM5QixvQkFBQSxHQUFzQixTQUFDLFFBQUQ7YUFDcEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksc0JBQVosRUFBb0MsUUFBcEM7SUFEb0I7OzZCQVN0QixzQkFBQSxHQUF3QixTQUFDLFFBQUQ7YUFDdEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksd0JBQVosRUFBc0MsUUFBdEM7SUFEc0I7OzZCQVN4QixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7YUFDaEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksa0JBQVosRUFBZ0MsUUFBaEM7SUFEZ0I7OzZCQVNsQixrQkFBQSxHQUFvQixTQUFDLFFBQUQ7YUFDbEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksb0JBQVosRUFBa0MsUUFBbEM7SUFEa0I7OztBQUdwQjs7Ozs2QkFTQSxVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxVQUFBLEdBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGNBQWhCO01BQ2IsSUFBcUIsVUFBckI7QUFBQSxlQUFPLFdBQVA7O01BQ0EsSUFBbUIsb0JBQW5CO0FBQUEsZUFBTyxJQUFDLENBQUEsUUFBUjs7TUFFQSxXQUFBLEdBQWM7TUFDZCxJQUF5QixPQUFPLENBQUMsUUFBUixLQUFvQixPQUE3QztRQUFBLFdBQUEsSUFBZSxPQUFmOztNQUNBLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQU8sQ0FBQyxhQUFsQixFQUFpQyxLQUFqQyxFQUF3QyxLQUF4QztNQUNWLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWLEVBQW1CLEtBQW5CLEVBQTBCLFdBQTFCO01BQ1gsSUFBQSxDQUFPLEVBQUUsQ0FBQyxVQUFILENBQWMsSUFBQyxDQUFBLE9BQWYsQ0FBUDtRQUNFLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWLEVBQW1CLGNBQW5CLEVBQW1DLHNCQUFuQyxFQUEyRCxLQUEzRCxFQUFrRSxXQUFsRSxFQURiOzthQUVBLElBQUMsQ0FBQTtJQVhTOzs2QkFnQlosa0JBQUEsR0FBb0IsU0FBQTthQUNsQixDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQSxlQUFUO0lBRGtCOzs7QUFHcEI7Ozs7NkJBU0Esa0JBQUEsR0FBb0IsU0FBQyxJQUFEO0FBQ2xCLFVBQUE7TUFBQSxJQUFlLEVBQUUsQ0FBQyxlQUFILENBQW1CLElBQW5CLENBQWY7QUFBQSxlQUFPLEtBQVA7O01BRUEsV0FBQSxHQUFjLEVBQUUsQ0FBQyxPQUFILFdBQVcsV0FBQSxJQUFDLENBQUEsZUFBRCxDQUFBLFFBQXFCLENBQUEsSUFBQSxDQUFyQixDQUFYO01BQ2QsSUFBc0IsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsV0FBbkIsQ0FBdEI7QUFBQSxlQUFPLFlBQVA7O01BRUEsV0FBQSxHQUFjLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFlBQVgsRUFBeUIsY0FBekIsRUFBeUMsSUFBekM7TUFDZCxJQUFzQixJQUFDLENBQUEsYUFBRCxDQUFlLFdBQWYsQ0FBdEI7QUFBQSxlQUFPLFlBQVA7O0lBUGtCOzs2QkFjcEIsZ0JBQUEsR0FBa0IsU0FBQyxJQUFEO2FBQ2hCLElBQUMsQ0FBQSxzQkFBRCxDQUFBLENBQXlCLENBQUMsY0FBMUIsQ0FBeUMsSUFBekM7SUFEZ0I7OzZCQUdsQixtQkFBQSxHQUFxQixTQUFDLElBQUQsRUFBTyxPQUFQO2FBQ25CLG1CQUFBLENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0lBRG1COzs2QkFHckIsNEJBQUEsR0FBOEIsU0FBQyxJQUFEO2FBQzVCLDRCQUFBLENBQTZCLElBQTdCO0lBRDRCOzs7QUFHOUI7Ozs7NkJBU0EsYUFBQSxHQUFlLFNBQUMsSUFBRDtBQUNiLFVBQUE7TUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiOztRQUNQLElBQUksQ0FBRSxNQUFOLENBQUE7O2FBQ0E7SUFIYTs7NkJBVWYsY0FBQSxHQUFnQixTQUFDLElBQUQ7QUFDZCxVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBYjtNQUVQLElBQUEsQ0FBTyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBbkIsQ0FBUDs7VUFDRSxJQUFJLENBQUUsT0FBTixDQUFBO1NBREY7O2FBR0E7SUFOYzs7NkJBYWhCLGlCQUFBLEdBQW1CLFNBQUMsSUFBRDtBQUNqQixVQUFBO2FBQUEsQ0FBQyxDQUFDLE9BQUYsb0VBQWlELEVBQWpELEVBQXFELElBQXJEO0lBRGlCOzs7QUFHbkI7Ozs7NkJBS0EsaUJBQUEsR0FBbUIsU0FBQTthQUNqQixDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxjQUFWO0lBRGlCOzs2QkFRbkIsZ0JBQUEsR0FBa0IsU0FBQyxJQUFEO2FBQ2hCLElBQUMsQ0FBQSxjQUFlLENBQUEsSUFBQTtJQURBOzs2QkFRbEIsZUFBQSxHQUFpQixTQUFDLElBQUQ7YUFDZjtJQURlOzs2QkFJakIsMkJBQUEsR0FBNkIsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs7QUFFN0I7Ozs7NkJBS0EsaUJBQUEsR0FBbUIsU0FBQTthQUNqQixDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxjQUFWO0lBRGlCOzs2QkFNbkIseUJBQUEsR0FBMkIsU0FBQyxLQUFEO0FBQ3pCLFVBQUE7QUFBQTtBQUFBO1dBQUEsc0NBQUE7O21CQUEyQyxJQUFJLENBQUMsT0FBTCxDQUFBLENBQUEsRUFBQSxhQUFrQixLQUFsQixFQUFBLElBQUE7dUJBQTNDOztBQUFBOztJQUR5Qjs7NkJBUTNCLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDthQUNoQixJQUFDLENBQUEsY0FBZSxDQUFBLElBQUE7SUFEQTs7NkJBUWxCLGVBQUEsR0FBaUIsU0FBQyxJQUFEO2FBQ2Y7SUFEZTs7NkJBSWpCLHdCQUFBLEdBQTBCLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7O0FBRTFCOzs7OzZCQUtBLHdCQUFBLEdBQTBCLFNBQUE7QUFDeEIsVUFBQTtNQUFBLFlBQUEsR0FBZTtBQUVmO0FBQUEsV0FBQSxzQ0FBQTs7QUFDRTtBQUFBLGFBQUEsd0NBQUE7O1VBQ0UsSUFBa0MsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsV0FBbkIsQ0FBbEM7WUFBQSxZQUFZLENBQUMsSUFBYixDQUFrQixXQUFsQixFQUFBOztBQURGO0FBREY7TUFJQSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsWUFBWCxFQUF5QixjQUF6QjtBQUNmLFdBQUEsNENBQUE7UUFDRSxXQUFBLEdBQWMsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLFdBQXhCO1FBQ2QsSUFBa0MsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsV0FBbkIsQ0FBbEM7VUFBQSxZQUFZLENBQUMsSUFBYixDQUFrQixXQUFsQixFQUFBOztBQUZGO2FBSUEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxZQUFQO0lBWndCOzs2QkFlMUIsd0JBQUEsR0FBMEIsU0FBQTthQUN4QixDQUFDLENBQUMsSUFBRixDQUFPLENBQUMsQ0FBQyxHQUFGLENBQU0sSUFBQyxDQUFBLHdCQUFELENBQUEsQ0FBTixFQUFtQyxTQUFDLFdBQUQ7ZUFBaUIsSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkO01BQWpCLENBQW5DLENBQVA7SUFEd0I7OzZCQUkxQiwyQkFBQSxHQUE2QixTQUFBO0FBQzNCLFVBQUE7TUFBQSxRQUFBLEdBQVc7QUFDWDtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBQSxHQUFPLElBQUksQ0FBQyxRQUFMLENBQWMsV0FBZDtRQUNQLFFBQUEsbUdBQStDLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixXQUFyQixFQUFrQyxJQUFsQztRQUMvQyxRQUFRLENBQUMsSUFBVCxDQUFjLFFBQWQ7QUFIRjthQUlBO0lBTjJCOzs7QUFRN0I7Ozs7NkJBSUEsZUFBQSxHQUFpQixTQUFDLElBQUQ7YUFDZixJQUFDLENBQUEsYUFBYyxDQUFBLElBQUE7SUFEQTs7NkJBR2pCLGVBQUEsR0FBaUIsU0FBQyxJQUFELEVBQU8sS0FBUDthQUNmLElBQUMsQ0FBQSxhQUFjLENBQUEsSUFBQSxDQUFmLEdBQXVCO0lBRFI7OzZCQUdqQixzQkFBQSxHQUF3QixTQUFBO0FBQ3RCLFVBQUE7TUFBQSxJQUFPLGdDQUFQO0FBQ0U7VUFDRSxJQUFDLENBQUEsbUJBQUQscURBQWlELENBQUUsNkJBRHJEO1NBQUE7O1VBRUEsSUFBQyxDQUFBLHNCQUF1QjtTQUgxQjs7YUFLQSxJQUFDLENBQUE7SUFOcUI7OzZCQVF4QixhQUFBLEdBQWUsU0FBQyxXQUFEO0FBQ2IsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsV0FBckIsRUFBa0MsSUFBbEM7YUFDWDtJQUZhOzs2QkFJZix5QkFBQSxHQUEyQixTQUFBO0FBQ3pCLFVBQUE7O1lBQTZCLENBQUUsT0FBL0IsQ0FBQTs7YUFDQSxJQUFDLENBQUEsNEJBQUQsR0FBZ0M7SUFGUDs7NkJBSTNCLHVCQUFBLEdBQXlCLFNBQUE7eURBQ3ZCLElBQUMsQ0FBQSwrQkFBRCxJQUFDLENBQUEsK0JBQWdDLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQix1QkFBcEIsRUFBNkMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDNUUsY0FBQTtVQUQ4RSx5QkFBVTtVQUN4RixnQkFBQSxHQUFtQixDQUFDLENBQUMsVUFBRixDQUFhLFFBQWIsRUFBdUIsUUFBdkI7VUFDbkIsaUJBQUEsR0FBb0IsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFiLEVBQXVCLFFBQXZCO0FBRXBCLGVBQUEsbURBQUE7O2dCQUEwRSxLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsV0FBbEI7Y0FBMUUsS0FBQyxDQUFBLGlCQUFELENBQW1CLFdBQW5COztBQUFBO0FBQ0EsZUFBQSxvREFBQTs7WUFBQSxLQUFDLENBQUEsZUFBRCxDQUFpQixXQUFqQjtBQUFBO2lCQUNBO1FBTjRFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QztJQURWOzs2QkFTekIsb0NBQUEsR0FBc0MsU0FBQTtBQUNwQyxVQUFBOztZQUF3QyxDQUFFLE9BQTFDLENBQUE7O2FBQ0EsSUFBQyxDQUFBLHVDQUFELEdBQTJDO0lBRlA7OzZCQUl0QyxrQ0FBQSxHQUFvQyxTQUFBO29FQUNsQyxJQUFDLENBQUEsMENBQUQsSUFBQyxDQUFBLDBDQUEyQyxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0Isa0NBQXBCLEVBQXdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ2xHLGNBQUE7VUFEb0cseUJBQVU7VUFDOUcsZUFBQSxHQUFrQixDQUFDLENBQUMsVUFBRixDQUFhLFFBQWIsRUFBdUIsUUFBdkI7VUFDbEIsZ0JBQUEsR0FBbUIsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxRQUFiLEVBQXVCLFFBQXZCO0FBRW5CLGVBQUEsa0RBQUE7O2dCQUF5QyxDQUFJLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixXQUFuQjs7b0JBQ2IsQ0FBRSxpQkFBaEMsQ0FBQTs7O0FBREY7QUFFQSxlQUFBLG1EQUFBOztnQkFBd0MsQ0FBSSxLQUFDLENBQUEsaUJBQUQsQ0FBbUIsV0FBbkI7O29CQUNaLENBQUUsZUFBaEMsQ0FBQTs7O0FBREY7aUJBRUE7UUFSa0c7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhEO0lBRFY7OzZCQVdwQyxZQUFBLEdBQWMsU0FBQTtBQUdaLFVBQUE7TUFBQSxPQUFBLENBQVEsaUJBQVI7TUFFQSxZQUFBLEdBQWUsSUFBQyxDQUFBLHdCQUFELENBQUE7TUFDZixZQUFBLEdBQWUsWUFBWSxDQUFDLE1BQWIsQ0FBb0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFdBQUQ7aUJBQWlCLENBQUksS0FBQyxDQUFBLGlCQUFELENBQW1CLElBQUksQ0FBQyxRQUFMLENBQWMsV0FBZCxDQUFuQjtRQUFyQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7TUFDZixZQUFBLEdBQWUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxZQUFQLEVBQXFCLFNBQUMsV0FBRDtlQUFpQixJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQ7TUFBakIsQ0FBckI7TUFDZixJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2YsY0FBQTtBQUFBLGVBQUEsOENBQUE7O1lBQUEsS0FBQyxDQUFBLFdBQUQsQ0FBYSxXQUFiO0FBQUE7UUFEZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7TUFHQSxJQUFDLENBQUEscUJBQUQsR0FBeUI7YUFDekIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsMkJBQWQ7SUFaWTs7NkJBY2QsV0FBQSxHQUFhLFNBQUMsVUFBRDtBQUNYLFVBQUE7TUFBQSxJQUFlLElBQUksQ0FBQyxRQUFMLENBQWMsVUFBZCxDQUEwQixDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQTdCLENBQW1DLEtBQW5DLENBQWY7QUFBQSxlQUFPLEtBQVA7O01BRUEsSUFBZSxJQUFBLEdBQU8sSUFBQyxDQUFBLGdCQUFELENBQWtCLFVBQWxCLENBQXRCO0FBQUEsZUFBTyxLQUFQOztNQUVBLElBQUcsV0FBQSxHQUFjLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixVQUFwQixDQUFqQjtRQUNFLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQ7UUFDUCxJQUFlLElBQUEsR0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsQ0FBdEI7QUFBQSxpQkFBTyxLQUFQOztBQUVBO1VBQ0UsUUFBQSxtRUFBK0MsR0FEakQ7U0FBQSxjQUFBO1VBRU07VUFDSixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckIsRUFBNEIsV0FBNUI7QUFDQSxpQkFBTyxLQUpUOztRQU1BLElBQUEsQ0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsUUFBUSxDQUFDLElBQTNCLENBQVA7VUFDRSxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixRQUFRLENBQUMsSUFBOUIsRUFBb0MsUUFBUSxDQUFDLE9BQTdDLENBQUg7WUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLGlCQUFBLEdBQWtCLFFBQVEsQ0FBQyxJQUEzQixHQUFnQyxHQUFoQyxHQUFtQyxRQUFRLENBQUMsT0FBNUMsR0FBb0QsMERBQWpFO0FBQ0EsbUJBQU8sS0FGVDtXQURGOztRQUtBLE9BQUEsR0FBVTtVQUNSLElBQUEsRUFBTSxXQURFO1VBQ1csVUFBQSxRQURYO1VBQ3FCLGNBQUEsRUFBZ0IsSUFEckM7VUFDNEMsUUFBRCxJQUFDLENBQUEsTUFENUM7VUFDcUQsY0FBRCxJQUFDLENBQUEsWUFEckQ7VUFFUCxpQkFBRCxJQUFDLENBQUEsZUFGTztVQUVXLGVBQUQsSUFBQyxDQUFBLGFBRlg7VUFFMkIsU0FBRCxJQUFDLENBQUEsT0FGM0I7VUFFcUMscUJBQUQsSUFBQyxDQUFBLG1CQUZyQztVQUdQLGlCQUFELElBQUMsQ0FBQSxlQUhPO1VBR1csY0FBRCxJQUFDLENBQUEsWUFIWDtVQUcwQixhQUFELElBQUMsQ0FBQSxXQUgxQjtVQUd3QyxvQkFBRCxJQUFDLENBQUEsa0JBSHhDO1VBSVAscUJBQUQsSUFBQyxDQUFBLG1CQUpPO1VBSWUsY0FBRCxJQUFDLENBQUEsWUFKZjs7UUFNVixJQUFHLFFBQVEsQ0FBQyxLQUFaO1VBQ0UsSUFBQSxHQUFXLElBQUEsWUFBQSxDQUFhLE9BQWIsRUFEYjtTQUFBLE1BQUE7VUFHRSxJQUFBLEdBQVcsSUFBQSxPQUFBLENBQVEsT0FBUixFQUhiOztRQUlBLElBQUksQ0FBQyxJQUFMLENBQUE7UUFDQSxJQUFDLENBQUEsY0FBZSxDQUFBLElBQUksQ0FBQyxJQUFMLENBQWhCLEdBQTZCO1FBQzdCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGtCQUFkLEVBQWtDLElBQWxDO0FBQ0EsZUFBTyxLQTVCVDtPQUFBLE1BQUE7UUE4QkUsT0FBTyxDQUFDLElBQVIsQ0FBYSxxQkFBQSxHQUFzQixVQUF0QixHQUFpQyxxQkFBOUMsRUE5QkY7O2FBK0JBO0lBcENXOzs2QkFzQ2IsY0FBQSxHQUFnQixTQUFBO0FBQ2QsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQWY7QUFBQTthQUNBO0lBRmM7OzZCQUloQixhQUFBLEdBQWUsU0FBQyxJQUFEO0FBQ2IsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsQ0FBSDtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sa0NBQUEsR0FBbUMsSUFBbkMsR0FBd0MsR0FBOUMsRUFEWjs7TUFHQSxJQUFHLElBQUEsR0FBTyxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEIsQ0FBVjtRQUNFLE9BQU8sSUFBQyxDQUFBLGNBQWUsQ0FBQSxJQUFJLENBQUMsSUFBTDtlQUN2QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxvQkFBZCxFQUFvQyxJQUFwQyxFQUZGO09BQUEsTUFBQTtBQUlFLGNBQVUsSUFBQSxLQUFBLENBQU0sOEJBQUEsR0FBK0IsSUFBL0IsR0FBb0MsR0FBMUMsRUFKWjs7SUFKYTs7NkJBV2YsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsUUFBQSxHQUFXO0FBQ1g7QUFBQSxXQUFBLHNDQUFBO3dCQUFLLHFCQUFXO1FBQ2QsUUFBQSxHQUFXLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUEzQjtRQUNYLFFBQUEsR0FBVyxRQUFRLENBQUMsTUFBVCxDQUFnQixTQUFTLENBQUMsZ0JBQVYsQ0FBMkIsUUFBM0IsQ0FBaEI7QUFGYjthQUdBLE9BQU8sQ0FBQyxHQUFSLENBQVksUUFBWixDQUFxQixDQUFDLElBQXRCLENBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN6QixLQUFDLENBQUEsOEJBQUQsQ0FBQTtVQUNBLEtBQUMsQ0FBQSx3QkFBRCxHQUE0QjtpQkFDNUIsS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsK0JBQWQ7UUFIeUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCO0lBTFE7OzZCQVlWLHdCQUFBLEdBQTBCLFNBQUMsU0FBRCxFQUFZLEtBQVo7YUFDeEIsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQW5CLENBQXdCLENBQUMsU0FBRCxFQUFZLEtBQVosQ0FBeEI7SUFEd0I7OzZCQUcxQixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7QUFDaEIsVUFBQTtNQUFBLFFBQUEsR0FBVztNQUNYLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDcEIsY0FBQTtBQUFBLGVBQUEsMENBQUE7O1lBQ0UsT0FBQSxHQUFVLEtBQUMsQ0FBQSxlQUFELENBQWlCLElBQUksQ0FBQyxJQUF0QjtZQUNWLElBQUEsQ0FBOEIsSUFBSSxDQUFDLDBCQUFMLENBQUEsQ0FBOUI7Y0FBQSxRQUFRLENBQUMsSUFBVCxDQUFjLE9BQWQsRUFBQTs7QUFGRjtpQkFHQSxPQUFPLENBQUMsR0FBUixDQUFZLFFBQVo7UUFKb0I7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCO01BS0EsSUFBQyxDQUFBLHVCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsa0NBQUQsQ0FBQTthQUNBO0lBVGdCOzs2QkFZbEIsZUFBQSxHQUFpQixTQUFDLElBQUQ7QUFDZixVQUFBO01BQUEsSUFBRyxJQUFBLEdBQU8sSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQWxCLENBQVY7ZUFDRSxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQURGO09BQUEsTUFFSyxJQUFHLElBQUEsR0FBTyxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsQ0FBVjtRQUNILElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxJQUFJLENBQUMsSUFBTCxDQUFwQixHQUFpQztlQUNqQyxJQUFJLENBQUMsUUFBTCxDQUFBLENBQWUsQ0FBQyxJQUFoQixDQUFxQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO1lBQ25CLElBQUcsMkNBQUg7Y0FDRSxPQUFPLEtBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxJQUFJLENBQUMsSUFBTDtjQUMzQixLQUFDLENBQUEsY0FBZSxDQUFBLElBQUksQ0FBQyxJQUFMLENBQWhCLEdBQTZCO2NBQzdCLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHNCQUFkLEVBQXNDLElBQXRDLEVBSEY7O21CQUlBO1VBTG1CO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQixFQUZHO09BQUEsTUFBQTtlQVNILE9BQU8sQ0FBQyxNQUFSLENBQW1CLElBQUEsS0FBQSxDQUFNLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLEdBQXRDLENBQW5CLEVBVEc7O0lBSFU7OzZCQWNqQiw4QkFBQSxHQUFnQyxTQUFBO0FBQzlCLFVBQUE7TUFBQSxJQUFjLG9DQUFkO0FBQUEsZUFBQTs7QUFDQTtBQUFBLFdBQUEsc0NBQUE7O1FBQUEsSUFBQyxDQUFBLHFCQUFxQixDQUFDLElBQXZCLENBQTRCLElBQTVCO0FBQUE7YUFDQSxJQUFDLENBQUEsdUJBQUQsR0FBMkI7SUFIRzs7NkJBS2hDLHFCQUFBLEdBQXVCLFNBQUMsSUFBRDtNQUNyQixJQUFBLENBQUEsQ0FBbUUsY0FBQSxJQUFVLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBWCxDQUFWLElBQStCLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBaEgsQ0FBQTtBQUFBLGVBQVcsSUFBQSxLQUFBLENBQU0seUNBQU4sRUFBWDs7TUFDQSxJQUFHLG9DQUFIO2VBQ0UsSUFBQyxDQUFBLHVCQUF1QixDQUFDLElBQXpCLENBQThCLElBQTlCLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLHFCQUFxQixDQUFDLElBQXZCLENBQTRCLElBQTVCLEVBSEY7O0lBRnFCOzs2QkFPdkIsMEJBQUEsR0FBNEIsU0FBQyxJQUFELEVBQU8sUUFBUDtNQUMxQixJQUFBLENBQUEsQ0FBYyxjQUFBLElBQVUsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxJQUFYLENBQVYsSUFBK0IsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUEzRCxDQUFBO0FBQUEsZUFBQTs7YUFDQSxJQUFDLENBQUEscUJBQXFCLENBQUMsRUFBdkIsQ0FBMEIsSUFBMUIsRUFBZ0MsUUFBaEM7SUFGMEI7OzZCQUk1QixTQUFBLEdBQVcsU0FBQTtBQUNULFVBQUE7QUFBQTtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQWxCO0FBREY7YUFFQSxJQUFDLENBQUE7SUFIUTs7NkJBS1gsZ0JBQUEsR0FBa0IsU0FBQyxJQUFEO0FBQ2hCLFVBQUE7TUFBQSxJQUFzQyxLQUFBLDBDQUFRLElBQUksQ0FBQyxvQkFBbkQ7ZUFBQSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFJLENBQUMsSUFBdEIsRUFBNEIsS0FBNUIsRUFBQTs7SUFEZ0I7OzZCQUlsQixrQkFBQSxHQUFvQixTQUFBO01BQ2xCLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDZixjQUFBO0FBQUE7QUFBQSxlQUFBLHNDQUFBOztZQUFBLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFJLENBQUMsSUFBeEIsRUFBOEIsSUFBOUI7QUFBQTtRQURlO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQjtNQUdBLElBQUMsQ0FBQSx5QkFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLG9DQUFELENBQUE7SUFMa0I7OzZCQVFwQixpQkFBQSxHQUFtQixTQUFDLElBQUQsRUFBTyxxQkFBUDtBQUNqQixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFsQjtNQUNQLElBQTJCLENBQUkscUJBQUosSUFBOEIsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBSSxDQUFDLElBQXRCLENBQXpEO1FBQUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQWxCLEVBQUE7O01BQ0EsSUFBSSxDQUFDLFVBQUwsQ0FBQTtNQUNBLE9BQU8sSUFBQyxDQUFBLGNBQWUsQ0FBQSxJQUFJLENBQUMsSUFBTDtNQUN2QixPQUFPLElBQUMsQ0FBQSxrQkFBbUIsQ0FBQSxJQUFJLENBQUMsSUFBTDthQUMzQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyx3QkFBZCxFQUF3QyxJQUF4QztJQU5pQjs7NkJBUW5CLG1CQUFBLEdBQXFCLFNBQUMsS0FBRCxFQUFRLFdBQVI7QUFDbkIsVUFBQTtNQUFBLFlBQUEsR0FBZSxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBdUIsY0FBdkI7TUFDZixNQUFBLEdBQVksS0FBSyxDQUFDLE9BQVAsR0FBZSxNQUFmLEdBQXFCO01BQ2hDLEtBQUEsR0FBVyxLQUFLLENBQUMsS0FBUCxHQUFhLFNBQWIsR0FBc0IsWUFBdEIsR0FBbUM7TUFDN0MsT0FBQSxHQUFVLHFCQUFBLEdBQXFCLENBQUMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkLENBQUQsQ0FBckIsR0FBaUQ7YUFDM0QsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFFBQXJCLENBQThCLE9BQTlCLEVBQXVDO1FBQUMsT0FBQSxLQUFEO1FBQVEsUUFBQSxNQUFSO1FBQWdCLFdBQUEsRUFBYSxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQsQ0FBN0I7UUFBeUQsV0FBQSxFQUFhLElBQXRFO09BQXZDO0lBTG1COzs2QkFPckIsa0JBQUEsR0FBb0IsU0FBQyxTQUFEO0FBQ2xCLFVBQUE7TUFBQSxjQUFBLEdBQXFCLElBQUEsT0FBQSxDQUFRLFNBQUMsT0FBRDtlQUMzQixFQUFFLENBQUMsY0FBSCxDQUFrQixTQUFsQixFQUE2QixTQUFDLFNBQUQ7aUJBQWUsT0FBQSxDQUFRLFNBQVI7UUFBZixDQUE3QjtNQUQyQixDQUFSO01BR3JCLFVBQUEsR0FBaUIsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFEO2VBQ3ZCLEVBQUUsQ0FBQyxXQUFILENBQWUsU0FBZixFQUEwQixTQUFDLEtBQUQ7aUJBQVcsT0FBQSxDQUFRLEtBQVI7UUFBWCxDQUExQjtNQUR1QixDQUFSO2FBR2pCLE9BQU8sQ0FBQyxHQUFSLENBQVksQ0FBQyxjQUFELEVBQWlCLFVBQWpCLENBQVosQ0FBeUMsQ0FBQyxJQUExQyxDQUErQyxTQUFDLE1BQUQ7QUFDN0MsWUFBQTtRQUFDLHFCQUFELEVBQVk7UUFDWixJQUFHLENBQUksU0FBSixJQUFrQixLQUFyQjtpQkFDRSxFQUFFLENBQUMsTUFBSCxDQUFVLFNBQVYsRUFBcUIsU0FBQSxHQUFBLENBQXJCLEVBREY7O01BRjZDLENBQS9DO0lBUGtCOzs2QkFZcEIsOEJBQUEsR0FBZ0MsU0FBQTtBQUM5QixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztZQUFzQyxJQUFJLENBQUMsT0FBTCxDQUFBLENBQUEsS0FBb0I7O1lBQ3hELElBQUksQ0FBQzs7O0FBRFA7SUFEOEI7OzZCQUtoQyxvQkFBQSxHQUFzQixTQUFDLFdBQUQ7TUFDcEIsSUFBRyxJQUFDLENBQUEsT0FBSjtRQUNFLElBQUEsQ0FBb0IsSUFBQyxDQUFBLFlBQVksQ0FBQyxVQUFkLENBQXlCLEVBQUEsR0FBRyxPQUFPLENBQUMsYUFBWCxHQUEyQixJQUFJLENBQUMsR0FBekQsQ0FBcEI7QUFBQSxpQkFBTyxNQUFQO1NBREY7OztRQUdBLElBQUMsQ0FBQSxnQ0FBaUMsRUFBQSxHQUFHLElBQUMsQ0FBQSxZQUFKLEdBQW1CLElBQUksQ0FBQzs7bUNBQzFELFdBQVcsQ0FBRSxVQUFiLENBQXdCLElBQUMsQ0FBQSw2QkFBekI7SUFMb0I7OzZCQU90QixtQkFBQSxHQUFxQixTQUFDLFdBQUQsRUFBYyxZQUFkO0FBQ25CLFVBQUE7O1FBRGlDLGVBQWE7O01BQzlDLFdBQUEsR0FBYyxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQ7TUFDZCxJQUFHLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixXQUF0QixDQUFIO1FBQ0UsUUFBQSwwREFBc0MsQ0FBRSxrQkFEMUM7O01BRUEsSUFBTyxnQkFBUDtRQUNFLElBQUcsWUFBQSxHQUFlLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxXQUFWLEVBQXVCLFNBQXZCLENBQWIsQ0FBbEI7QUFDRTtZQUNFLFFBQUEsR0FBVyxJQUFJLENBQUMsWUFBTCxDQUFrQixZQUFsQjtZQUNYLElBQUMsQ0FBQSx3QkFBRCxDQUEwQixRQUExQixFQUZGO1dBQUEsY0FBQTtZQUdNO1lBQ0osSUFBQSxDQUFtQixZQUFuQjtBQUFBLG9CQUFNLE1BQU47YUFKRjtXQURGO1NBREY7OztRQVFBLFdBQVk7O01BQ1osSUFBQSxDQUFBLENBQU8sT0FBTyxRQUFRLENBQUMsSUFBaEIsS0FBd0IsUUFBeEIsSUFBcUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFkLEdBQXVCLENBQW5FLENBQUE7UUFDRSxRQUFRLENBQUMsSUFBVCxHQUFnQixZQURsQjs7TUFHQSxnREFBc0IsQ0FBRSxjQUFyQixLQUE2QixLQUE3QixJQUF1QyxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBM0IsS0FBa0MsUUFBNUU7UUFDRSxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQXBCLEdBQTBCLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQXhCLENBQWdDLG9CQUFoQyxFQUFzRCxFQUF0RCxFQUQ1Qjs7YUFHQTtJQW5CbUI7OzZCQXFCckIsd0JBQUEsR0FBMEIsU0FBQyxRQUFEO01BQ3hCLElBQUEscUJBQU8sUUFBUSxDQUFFLGFBQWpCOztVQUNFLHVCQUF3QixPQUFBLENBQVEsd0JBQVI7O2VBQ3hCLG9CQUFBLENBQXFCLFFBQXJCLEVBRkY7O0lBRHdCOzs7OztBQXBqQjVCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5ub3JtYWxpemVQYWNrYWdlRGF0YSA9IG51bGxcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbkNTT04gPSByZXF1aXJlICdzZWFzb24nXG5cblNlcnZpY2VIdWIgPSByZXF1aXJlICdzZXJ2aWNlLWh1YidcblBhY2thZ2UgPSByZXF1aXJlICcuL3BhY2thZ2UnXG5UaGVtZVBhY2thZ2UgPSByZXF1aXJlICcuL3RoZW1lLXBhY2thZ2UnXG57aXNEZXByZWNhdGVkUGFja2FnZSwgZ2V0RGVwcmVjYXRlZFBhY2thZ2VNZXRhZGF0YX0gPSByZXF1aXJlICcuL2RlcHJlY2F0ZWQtcGFja2FnZXMnXG5cbiMgRXh0ZW5kZWQ6IFBhY2thZ2UgbWFuYWdlciBmb3IgY29vcmRpbmF0aW5nIHRoZSBsaWZlY3ljbGUgb2YgQXRvbSBwYWNrYWdlcy5cbiNcbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS5wYWNrYWdlc2AgZ2xvYmFsLlxuI1xuIyBQYWNrYWdlcyBjYW4gYmUgbG9hZGVkLCBhY3RpdmF0ZWQsIGFuZCBkZWFjdGl2YXRlZCwgYW5kIHVubG9hZGVkOlxuIyAgKiBMb2FkaW5nIGEgcGFja2FnZSByZWFkcyBhbmQgcGFyc2VzIHRoZSBwYWNrYWdlJ3MgbWV0YWRhdGEgYW5kIHJlc291cmNlc1xuIyAgICBzdWNoIGFzIGtleW1hcHMsIG1lbnVzLCBzdHlsZXNoZWV0cywgZXRjLlxuIyAgKiBBY3RpdmF0aW5nIGEgcGFja2FnZSByZWdpc3RlcnMgdGhlIGxvYWRlZCByZXNvdXJjZXMgYW5kIGNhbGxzIGBhY3RpdmF0ZSgpYFxuIyAgICBvbiB0aGUgcGFja2FnZSdzIG1haW4gbW9kdWxlLlxuIyAgKiBEZWFjdGl2YXRpbmcgYSBwYWNrYWdlIHVucmVnaXN0ZXJzIHRoZSBwYWNrYWdlJ3MgcmVzb3VyY2VzICBhbmQgY2FsbHNcbiMgICAgYGRlYWN0aXZhdGUoKWAgb24gdGhlIHBhY2thZ2UncyBtYWluIG1vZHVsZS5cbiMgICogVW5sb2FkaW5nIGEgcGFja2FnZSByZW1vdmVzIGl0IGNvbXBsZXRlbHkgZnJvbSB0aGUgcGFja2FnZSBtYW5hZ2VyLlxuI1xuIyBQYWNrYWdlcyBjYW4gYmUgZW5hYmxlZC9kaXNhYmxlZCB2aWEgdGhlIGBjb3JlLmRpc2FibGVkUGFja2FnZXNgIGNvbmZpZ1xuIyBzZXR0aW5ncyBhbmQgYWxzbyBieSBjYWxsaW5nIGBlbmFibGVQYWNrYWdlKCkvZGlzYWJsZVBhY2thZ2UoKWAuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYWNrYWdlTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKHBhcmFtcykgLT5cbiAgICB7XG4gICAgICBjb25maWdEaXJQYXRoLCBAZGV2TW9kZSwgc2FmZU1vZGUsIEByZXNvdXJjZVBhdGgsIEBjb25maWcsIEBzdHlsZU1hbmFnZXIsXG4gICAgICBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGtleW1hcE1hbmFnZXIsIEBjb21tYW5kUmVnaXN0cnksIEBncmFtbWFyUmVnaXN0cnksXG4gICAgICBAZGVzZXJpYWxpemVyTWFuYWdlciwgQHZpZXdSZWdpc3RyeVxuICAgIH0gPSBwYXJhbXNcblxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAYWN0aXZhdGlvbkhvb2tFbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAcGFja2FnZURpclBhdGhzID0gW11cbiAgICBAZGVmZXJyZWRBY3RpdmF0aW9uSG9va3MgPSBbXVxuICAgIGlmIGNvbmZpZ0RpclBhdGg/IGFuZCBub3Qgc2FmZU1vZGVcbiAgICAgIGlmIEBkZXZNb2RlXG4gICAgICAgIEBwYWNrYWdlRGlyUGF0aHMucHVzaChwYXRoLmpvaW4oY29uZmlnRGlyUGF0aCwgXCJkZXZcIiwgXCJwYWNrYWdlc1wiKSlcbiAgICAgIEBwYWNrYWdlRGlyUGF0aHMucHVzaChwYXRoLmpvaW4oY29uZmlnRGlyUGF0aCwgXCJwYWNrYWdlc1wiKSlcblxuICAgIEBwYWNrYWdlc0NhY2hlID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk/Ll9hdG9tUGFja2FnZXMgPyB7fVxuICAgIEBpbml0aWFsUGFja2FnZXNMb2FkZWQgPSBmYWxzZVxuICAgIEBpbml0aWFsUGFja2FnZXNBY3RpdmF0ZWQgPSBmYWxzZVxuICAgIEBsb2FkZWRQYWNrYWdlcyA9IHt9XG4gICAgQGFjdGl2ZVBhY2thZ2VzID0ge31cbiAgICBAYWN0aXZhdGluZ1BhY2thZ2VzID0ge31cbiAgICBAcGFja2FnZVN0YXRlcyA9IHt9XG4gICAgQHNlcnZpY2VIdWIgPSBuZXcgU2VydmljZUh1YlxuXG4gICAgQHBhY2thZ2VBY3RpdmF0b3JzID0gW11cbiAgICBAcmVnaXN0ZXJQYWNrYWdlQWN0aXZhdG9yKHRoaXMsIFsnYXRvbScsICd0ZXh0bWF0ZSddKVxuXG4gIHNldENvbnRleHRNZW51TWFuYWdlcjogKEBjb250ZXh0TWVudU1hbmFnZXIpIC0+XG5cbiAgc2V0TWVudU1hbmFnZXI6IChAbWVudU1hbmFnZXIpIC0+XG5cbiAgc2V0VGhlbWVNYW5hZ2VyOiAoQHRoZW1lTWFuYWdlcikgLT5cblxuICByZXNldDogLT5cbiAgICBAc2VydmljZUh1Yi5jbGVhcigpXG4gICAgQGRlYWN0aXZhdGVQYWNrYWdlcygpXG4gICAgQGxvYWRlZFBhY2thZ2VzID0ge31cbiAgICBAcGFja2FnZVN0YXRlcyA9IHt9XG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGFsbCBwYWNrYWdlcyBoYXZlIGJlZW4gbG9hZGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkTG9hZEluaXRpYWxQYWNrYWdlczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtbG9hZC1pbml0aWFsLXBhY2thZ2VzJywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGFsbCBwYWNrYWdlcyBoYXZlIGJlZW4gYWN0aXZhdGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXM6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFjdGl2YXRlLWluaXRpYWwtcGFja2FnZXMnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYWNrYWdlIGlzIGFjdGl2YXRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCBBIHtGdW5jdGlvbn0gdG8gYmUgaW52b2tlZCB3aGVuIGEgcGFja2FnZSBpcyBhY3RpdmF0ZWQuXG4gICMgICAqIGBwYWNrYWdlYCBUaGUge1BhY2thZ2V9IHRoYXQgd2FzIGFjdGl2YXRlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWN0aXZhdGVQYWNrYWdlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hY3RpdmF0ZS1wYWNrYWdlJywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgcGFja2FnZSBpcyBkZWFjdGl2YXRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCBBIHtGdW5jdGlvbn0gdG8gYmUgaW52b2tlZCB3aGVuIGEgcGFja2FnZSBpcyBkZWFjdGl2YXRlZC5cbiAgIyAgICogYHBhY2thZ2VgIFRoZSB7UGFja2FnZX0gdGhhdCB3YXMgZGVhY3RpdmF0ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZERlYWN0aXZhdGVQYWNrYWdlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZWFjdGl2YXRlLXBhY2thZ2UnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYWNrYWdlIGlzIGxvYWRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCBBIHtGdW5jdGlvbn0gdG8gYmUgaW52b2tlZCB3aGVuIGEgcGFja2FnZSBpcyBsb2FkZWQuXG4gICMgICAqIGBwYWNrYWdlYCBUaGUge1BhY2thZ2V9IHRoYXQgd2FzIGxvYWRlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkTG9hZFBhY2thZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWxvYWQtcGFja2FnZScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhY2thZ2UgaXMgdW5sb2FkZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2AgQSB7RnVuY3Rpb259IHRvIGJlIGludm9rZWQgd2hlbiBhIHBhY2thZ2UgaXMgdW5sb2FkZWQuXG4gICMgICAqIGBwYWNrYWdlYCBUaGUge1BhY2thZ2V9IHRoYXQgd2FzIHVubG9hZGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRVbmxvYWRQYWNrYWdlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC11bmxvYWQtcGFja2FnZScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IFBhY2thZ2Ugc3lzdGVtIGRhdGFcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgcGF0aCB0byB0aGUgYXBtIGNvbW1hbmQuXG4gICNcbiAgIyBVc2VzIHRoZSB2YWx1ZSBvZiB0aGUgYGNvcmUuYXBtUGF0aGAgY29uZmlnIHNldHRpbmcgaWYgaXQgZXhpc3RzLlxuICAjXG4gICMgUmV0dXJuIGEge1N0cmluZ30gZmlsZSBwYXRoIHRvIGFwbS5cbiAgZ2V0QXBtUGF0aDogLT5cbiAgICBjb25maWdQYXRoID0gYXRvbS5jb25maWcuZ2V0KCdjb3JlLmFwbVBhdGgnKVxuICAgIHJldHVybiBjb25maWdQYXRoIGlmIGNvbmZpZ1BhdGhcbiAgICByZXR1cm4gQGFwbVBhdGggaWYgQGFwbVBhdGg/XG5cbiAgICBjb21tYW5kTmFtZSA9ICdhcG0nXG4gICAgY29tbWFuZE5hbWUgKz0gJy5jbWQnIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgIGFwbVJvb3QgPSBwYXRoLmpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCAnYXBwJywgJ2FwbScpXG4gICAgQGFwbVBhdGggPSBwYXRoLmpvaW4oYXBtUm9vdCwgJ2JpbicsIGNvbW1hbmROYW1lKVxuICAgIHVubGVzcyBmcy5pc0ZpbGVTeW5jKEBhcG1QYXRoKVxuICAgICAgQGFwbVBhdGggPSBwYXRoLmpvaW4oYXBtUm9vdCwgJ25vZGVfbW9kdWxlcycsICdhdG9tLXBhY2thZ2UtbWFuYWdlcicsICdiaW4nLCBjb21tYW5kTmFtZSlcbiAgICBAYXBtUGF0aFxuXG4gICMgUHVibGljOiBHZXQgdGhlIHBhdGhzIGJlaW5nIHVzZWQgdG8gbG9vayBmb3IgcGFja2FnZXMuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ30gZGlyZWN0b3J5IHBhdGhzLlxuICBnZXRQYWNrYWdlRGlyUGF0aHM6IC0+XG4gICAgXy5jbG9uZShAcGFja2FnZURpclBhdGhzKVxuXG4gICMjI1xuICBTZWN0aW9uOiBHZW5lcmFsIHBhY2thZ2UgZGF0YVxuICAjIyNcblxuICAjIFB1YmxpYzogUmVzb2x2ZSB0aGUgZ2l2ZW4gcGFja2FnZSBuYW1lIHRvIGEgcGF0aCBvbiBkaXNrLlxuICAjXG4gICMgKiBgbmFtZWAgLSBUaGUge1N0cmluZ30gcGFja2FnZSBuYW1lLlxuICAjXG4gICMgUmV0dXJuIGEge1N0cmluZ30gZm9sZGVyIHBhdGggb3IgdW5kZWZpbmVkIGlmIGl0IGNvdWxkIG5vdCBiZSByZXNvbHZlZC5cbiAgcmVzb2x2ZVBhY2thZ2VQYXRoOiAobmFtZSkgLT5cbiAgICByZXR1cm4gbmFtZSBpZiBmcy5pc0RpcmVjdG9yeVN5bmMobmFtZSlcblxuICAgIHBhY2thZ2VQYXRoID0gZnMucmVzb2x2ZShAcGFja2FnZURpclBhdGhzLi4uLCBuYW1lKVxuICAgIHJldHVybiBwYWNrYWdlUGF0aCBpZiBmcy5pc0RpcmVjdG9yeVN5bmMocGFja2FnZVBhdGgpXG5cbiAgICBwYWNrYWdlUGF0aCA9IHBhdGguam9pbihAcmVzb3VyY2VQYXRoLCAnbm9kZV9tb2R1bGVzJywgbmFtZSlcbiAgICByZXR1cm4gcGFja2FnZVBhdGggaWYgQGhhc0F0b21FbmdpbmUocGFja2FnZVBhdGgpXG5cbiAgIyBQdWJsaWM6IElzIHRoZSBwYWNrYWdlIHdpdGggdGhlIGdpdmVuIG5hbWUgYnVuZGxlZCB3aXRoIEF0b20/XG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc0J1bmRsZWRQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBAZ2V0UGFja2FnZURlcGVuZGVuY2llcygpLmhhc093blByb3BlcnR5KG5hbWUpXG5cbiAgaXNEZXByZWNhdGVkUGFja2FnZTogKG5hbWUsIHZlcnNpb24pIC0+XG4gICAgaXNEZXByZWNhdGVkUGFja2FnZShuYW1lLCB2ZXJzaW9uKVxuXG4gIGdldERlcHJlY2F0ZWRQYWNrYWdlTWV0YWRhdGE6IChuYW1lKSAtPlxuICAgIGdldERlcHJlY2F0ZWRQYWNrYWdlTWV0YWRhdGEobmFtZSlcblxuICAjIyNcbiAgU2VjdGlvbjogRW5hYmxpbmcgYW5kIGRpc2FibGluZyBwYWNrYWdlc1xuICAjIyNcblxuICAjIFB1YmxpYzogRW5hYmxlIHRoZSBwYWNrYWdlIHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSB7UGFja2FnZX0gdGhhdCB3YXMgZW5hYmxlZCBvciBudWxsIGlmIGl0IGlzbid0IGxvYWRlZC5cbiAgZW5hYmxlUGFja2FnZTogKG5hbWUpIC0+XG4gICAgcGFjayA9IEBsb2FkUGFja2FnZShuYW1lKVxuICAgIHBhY2s/LmVuYWJsZSgpXG4gICAgcGFja1xuXG4gICMgUHVibGljOiBEaXNhYmxlIHRoZSBwYWNrYWdlIHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSB7UGFja2FnZX0gdGhhdCB3YXMgZGlzYWJsZWQgb3IgbnVsbCBpZiBpdCBpc24ndCBsb2FkZWQuXG4gIGRpc2FibGVQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBwYWNrID0gQGxvYWRQYWNrYWdlKG5hbWUpXG5cbiAgICB1bmxlc3MgQGlzUGFja2FnZURpc2FibGVkKG5hbWUpXG4gICAgICBwYWNrPy5kaXNhYmxlKClcblxuICAgIHBhY2tcblxuICAjIFB1YmxpYzogSXMgdGhlIHBhY2thZ2Ugd2l0aCB0aGUgZ2l2ZW4gbmFtZSBkaXNhYmxlZD9cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzUGFja2FnZURpc2FibGVkOiAobmFtZSkgLT5cbiAgICBfLmluY2x1ZGUoQGNvbmZpZy5nZXQoJ2NvcmUuZGlzYWJsZWRQYWNrYWdlcycpID8gW10sIG5hbWUpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFjY2Vzc2luZyBhY3RpdmUgcGFja2FnZXNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEdldCBhbiB7QXJyYXl9IG9mIGFsbCB0aGUgYWN0aXZlIHtQYWNrYWdlfXMuXG4gIGdldEFjdGl2ZVBhY2thZ2VzOiAtPlxuICAgIF8udmFsdWVzKEBhY3RpdmVQYWNrYWdlcylcblxuICAjIFB1YmxpYzogR2V0IHRoZSBhY3RpdmUge1BhY2thZ2V9IHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhY2thZ2V9IG9yIHVuZGVmaW5lZC5cbiAgZ2V0QWN0aXZlUGFja2FnZTogKG5hbWUpIC0+XG4gICAgQGFjdGl2ZVBhY2thZ2VzW25hbWVdXG5cbiAgIyBQdWJsaWM6IElzIHRoZSB7UGFja2FnZX0gd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhY3RpdmU/XG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc1BhY2thZ2VBY3RpdmU6IChuYW1lKSAtPlxuICAgIEBnZXRBY3RpdmVQYWNrYWdlKG5hbWUpP1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciBwYWNrYWdlIGFjdGl2YXRpb24gaGFzIG9jY3VycmVkLlxuICBoYXNBY3RpdmF0ZWRJbml0aWFsUGFja2FnZXM6IC0+IEBpbml0aWFsUGFja2FnZXNBY3RpdmF0ZWRcblxuICAjIyNcbiAgU2VjdGlvbjogQWNjZXNzaW5nIGxvYWRlZCBwYWNrYWdlc1xuICAjIyNcblxuICAjIFB1YmxpYzogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBsb2FkZWQge1BhY2thZ2V9c1xuICBnZXRMb2FkZWRQYWNrYWdlczogLT5cbiAgICBfLnZhbHVlcyhAbG9hZGVkUGFja2FnZXMpXG5cbiAgIyBHZXQgcGFja2FnZXMgZm9yIGEgY2VydGFpbiBwYWNrYWdlIHR5cGVcbiAgI1xuICAjICogYHR5cGVzYCBhbiB7QXJyYXl9IG9mIHtTdHJpbmd9cyBsaWtlIFsnYXRvbScsICd0ZXh0bWF0ZSddLlxuICBnZXRMb2FkZWRQYWNrYWdlc0ZvclR5cGVzOiAodHlwZXMpIC0+XG4gICAgcGFjayBmb3IgcGFjayBpbiBAZ2V0TG9hZGVkUGFja2FnZXMoKSB3aGVuIHBhY2suZ2V0VHlwZSgpIGluIHR5cGVzXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgbG9hZGVkIHtQYWNrYWdlfSB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICAjXG4gICMgKiBgbmFtZWAgLSBUaGUge1N0cmluZ30gcGFja2FnZSBuYW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtQYWNrYWdlfSBvciB1bmRlZmluZWQuXG4gIGdldExvYWRlZFBhY2thZ2U6IChuYW1lKSAtPlxuICAgIEBsb2FkZWRQYWNrYWdlc1tuYW1lXVxuXG4gICMgUHVibGljOiBJcyB0aGUgcGFja2FnZSB3aXRoIHRoZSBnaXZlbiBuYW1lIGxvYWRlZD9cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzUGFja2FnZUxvYWRlZDogKG5hbWUpIC0+XG4gICAgQGdldExvYWRlZFBhY2thZ2UobmFtZSk/XG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHBhY2thZ2UgbG9hZGluZyBoYXMgb2NjdXJyZWQuXG4gIGhhc0xvYWRlZEluaXRpYWxQYWNrYWdlczogLT4gQGluaXRpYWxQYWNrYWdlc0xvYWRlZFxuXG4gICMjI1xuICBTZWN0aW9uOiBBY2Nlc3NpbmcgYXZhaWxhYmxlIHBhY2thZ2VzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zIG9mIGFsbCB0aGUgYXZhaWxhYmxlIHBhY2thZ2UgcGF0aHMuXG4gIGdldEF2YWlsYWJsZVBhY2thZ2VQYXRoczogLT5cbiAgICBwYWNrYWdlUGF0aHMgPSBbXVxuXG4gICAgZm9yIHBhY2thZ2VEaXJQYXRoIGluIEBwYWNrYWdlRGlyUGF0aHNcbiAgICAgIGZvciBwYWNrYWdlUGF0aCBpbiBmcy5saXN0U3luYyhwYWNrYWdlRGlyUGF0aClcbiAgICAgICAgcGFja2FnZVBhdGhzLnB1c2gocGFja2FnZVBhdGgpIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhwYWNrYWdlUGF0aClcblxuICAgIHBhY2thZ2VzUGF0aCA9IHBhdGguam9pbihAcmVzb3VyY2VQYXRoLCAnbm9kZV9tb2R1bGVzJylcbiAgICBmb3IgcGFja2FnZU5hbWUgb2YgQGdldFBhY2thZ2VEZXBlbmRlbmNpZXMoKVxuICAgICAgcGFja2FnZVBhdGggPSBwYXRoLmpvaW4ocGFja2FnZXNQYXRoLCBwYWNrYWdlTmFtZSlcbiAgICAgIHBhY2thZ2VQYXRocy5wdXNoKHBhY2thZ2VQYXRoKSBpZiBmcy5pc0RpcmVjdG9yeVN5bmMocGFja2FnZVBhdGgpXG5cbiAgICBfLnVuaXEocGFja2FnZVBhdGhzKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zIG9mIGFsbCB0aGUgYXZhaWxhYmxlIHBhY2thZ2UgbmFtZXMuXG4gIGdldEF2YWlsYWJsZVBhY2thZ2VOYW1lczogLT5cbiAgICBfLnVuaXEgXy5tYXAgQGdldEF2YWlsYWJsZVBhY2thZ2VQYXRocygpLCAocGFja2FnZVBhdGgpIC0+IHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMgb2YgYWxsIHRoZSBhdmFpbGFibGUgcGFja2FnZSBtZXRhZGF0YS5cbiAgZ2V0QXZhaWxhYmxlUGFja2FnZU1ldGFkYXRhOiAtPlxuICAgIHBhY2thZ2VzID0gW11cbiAgICBmb3IgcGFja2FnZVBhdGggaW4gQGdldEF2YWlsYWJsZVBhY2thZ2VQYXRocygpXG4gICAgICBuYW1lID0gcGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aClcbiAgICAgIG1ldGFkYXRhID0gQGdldExvYWRlZFBhY2thZ2UobmFtZSk/Lm1ldGFkYXRhID8gQGxvYWRQYWNrYWdlTWV0YWRhdGEocGFja2FnZVBhdGgsIHRydWUpXG4gICAgICBwYWNrYWdlcy5wdXNoKG1ldGFkYXRhKVxuICAgIHBhY2thZ2VzXG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGVcbiAgIyMjXG5cbiAgZ2V0UGFja2FnZVN0YXRlOiAobmFtZSkgLT5cbiAgICBAcGFja2FnZVN0YXRlc1tuYW1lXVxuXG4gIHNldFBhY2thZ2VTdGF0ZTogKG5hbWUsIHN0YXRlKSAtPlxuICAgIEBwYWNrYWdlU3RhdGVzW25hbWVdID0gc3RhdGVcblxuICBnZXRQYWNrYWdlRGVwZW5kZW5jaWVzOiAtPlxuICAgIHVubGVzcyBAcGFja2FnZURlcGVuZGVuY2llcz9cbiAgICAgIHRyeVxuICAgICAgICBAcGFja2FnZURlcGVuZGVuY2llcyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpPy5wYWNrYWdlRGVwZW5kZW5jaWVzXG4gICAgICBAcGFja2FnZURlcGVuZGVuY2llcyA/PSB7fVxuXG4gICAgQHBhY2thZ2VEZXBlbmRlbmNpZXNcblxuICBoYXNBdG9tRW5naW5lOiAocGFja2FnZVBhdGgpIC0+XG4gICAgbWV0YWRhdGEgPSBAbG9hZFBhY2thZ2VNZXRhZGF0YShwYWNrYWdlUGF0aCwgdHJ1ZSlcbiAgICBtZXRhZGF0YT8uZW5naW5lcz8uYXRvbT9cblxuICB1bm9ic2VydmVEaXNhYmxlZFBhY2thZ2VzOiAtPlxuICAgIEBkaXNhYmxlZFBhY2thZ2VzU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAZGlzYWJsZWRQYWNrYWdlc1N1YnNjcmlwdGlvbiA9IG51bGxcblxuICBvYnNlcnZlRGlzYWJsZWRQYWNrYWdlczogLT5cbiAgICBAZGlzYWJsZWRQYWNrYWdlc1N1YnNjcmlwdGlvbiA/PSBAY29uZmlnLm9uRGlkQ2hhbmdlICdjb3JlLmRpc2FibGVkUGFja2FnZXMnLCAoe25ld1ZhbHVlLCBvbGRWYWx1ZX0pID0+XG4gICAgICBwYWNrYWdlc1RvRW5hYmxlID0gXy5kaWZmZXJlbmNlKG9sZFZhbHVlLCBuZXdWYWx1ZSlcbiAgICAgIHBhY2thZ2VzVG9EaXNhYmxlID0gXy5kaWZmZXJlbmNlKG5ld1ZhbHVlLCBvbGRWYWx1ZSlcblxuICAgICAgQGRlYWN0aXZhdGVQYWNrYWdlKHBhY2thZ2VOYW1lKSBmb3IgcGFja2FnZU5hbWUgaW4gcGFja2FnZXNUb0Rpc2FibGUgd2hlbiBAZ2V0QWN0aXZlUGFja2FnZShwYWNrYWdlTmFtZSlcbiAgICAgIEBhY3RpdmF0ZVBhY2thZ2UocGFja2FnZU5hbWUpIGZvciBwYWNrYWdlTmFtZSBpbiBwYWNrYWdlc1RvRW5hYmxlXG4gICAgICBudWxsXG5cbiAgdW5vYnNlcnZlUGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkOiAtPlxuICAgIEBwYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWRTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBwYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWRTdWJzY3JpcHRpb24gPSBudWxsXG5cbiAgb2JzZXJ2ZVBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZDogLT5cbiAgICBAcGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkU3Vic2NyaXB0aW9uID89IEBjb25maWcub25EaWRDaGFuZ2UgJ2NvcmUucGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSA9PlxuICAgICAga2V5bWFwc1RvRW5hYmxlID0gXy5kaWZmZXJlbmNlKG9sZFZhbHVlLCBuZXdWYWx1ZSlcbiAgICAgIGtleW1hcHNUb0Rpc2FibGUgPSBfLmRpZmZlcmVuY2UobmV3VmFsdWUsIG9sZFZhbHVlKVxuXG4gICAgICBmb3IgcGFja2FnZU5hbWUgaW4ga2V5bWFwc1RvRGlzYWJsZSB3aGVuIG5vdCBAaXNQYWNrYWdlRGlzYWJsZWQocGFja2FnZU5hbWUpXG4gICAgICAgIEBnZXRMb2FkZWRQYWNrYWdlKHBhY2thZ2VOYW1lKT8uZGVhY3RpdmF0ZUtleW1hcHMoKVxuICAgICAgZm9yIHBhY2thZ2VOYW1lIGluIGtleW1hcHNUb0VuYWJsZSB3aGVuIG5vdCBAaXNQYWNrYWdlRGlzYWJsZWQocGFja2FnZU5hbWUpXG4gICAgICAgIEBnZXRMb2FkZWRQYWNrYWdlKHBhY2thZ2VOYW1lKT8uYWN0aXZhdGVLZXltYXBzKClcbiAgICAgIG51bGxcblxuICBsb2FkUGFja2FnZXM6IC0+XG4gICAgIyBFbnN1cmUgYXRvbSBleHBvcnRzIGlzIGFscmVhZHkgaW4gdGhlIHJlcXVpcmUgY2FjaGUgc28gdGhlIGxvYWQgdGltZVxuICAgICMgb2YgdGhlIGZpcnN0IHBhY2thZ2UgaXNuJ3Qgc2tld2VkIGJ5IGJlaW5nIHRoZSBmaXJzdCB0byByZXF1aXJlIGF0b21cbiAgICByZXF1aXJlICcuLi9leHBvcnRzL2F0b20nXG5cbiAgICBwYWNrYWdlUGF0aHMgPSBAZ2V0QXZhaWxhYmxlUGFja2FnZVBhdGhzKClcbiAgICBwYWNrYWdlUGF0aHMgPSBwYWNrYWdlUGF0aHMuZmlsdGVyIChwYWNrYWdlUGF0aCkgPT4gbm90IEBpc1BhY2thZ2VEaXNhYmxlZChwYXRoLmJhc2VuYW1lKHBhY2thZ2VQYXRoKSlcbiAgICBwYWNrYWdlUGF0aHMgPSBfLnVuaXEgcGFja2FnZVBhdGhzLCAocGFja2FnZVBhdGgpIC0+IHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpXG4gICAgQGNvbmZpZy50cmFuc2FjdCA9PlxuICAgICAgQGxvYWRQYWNrYWdlKHBhY2thZ2VQYXRoKSBmb3IgcGFja2FnZVBhdGggaW4gcGFja2FnZVBhdGhzXG4gICAgICByZXR1cm5cbiAgICBAaW5pdGlhbFBhY2thZ2VzTG9hZGVkID0gdHJ1ZVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1sb2FkLWluaXRpYWwtcGFja2FnZXMnXG5cbiAgbG9hZFBhY2thZ2U6IChuYW1lT3JQYXRoKSAtPlxuICAgIHJldHVybiBudWxsIGlmIHBhdGguYmFzZW5hbWUobmFtZU9yUGF0aClbMF0ubWF0Y2ggL15cXC4vICMgcHJpbWFyaWx5IHRvIHNraXAgLmdpdCBmb2xkZXJcblxuICAgIHJldHVybiBwYWNrIGlmIHBhY2sgPSBAZ2V0TG9hZGVkUGFja2FnZShuYW1lT3JQYXRoKVxuXG4gICAgaWYgcGFja2FnZVBhdGggPSBAcmVzb2x2ZVBhY2thZ2VQYXRoKG5hbWVPclBhdGgpXG4gICAgICBuYW1lID0gcGF0aC5iYXNlbmFtZShuYW1lT3JQYXRoKVxuICAgICAgcmV0dXJuIHBhY2sgaWYgcGFjayA9IEBnZXRMb2FkZWRQYWNrYWdlKG5hbWUpXG5cbiAgICAgIHRyeVxuICAgICAgICBtZXRhZGF0YSA9IEBsb2FkUGFja2FnZU1ldGFkYXRhKHBhY2thZ2VQYXRoKSA/IHt9XG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBAaGFuZGxlTWV0YWRhdGFFcnJvcihlcnJvciwgcGFja2FnZVBhdGgpXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgIHVubGVzcyBAaXNCdW5kbGVkUGFja2FnZShtZXRhZGF0YS5uYW1lKVxuICAgICAgICBpZiBAaXNEZXByZWNhdGVkUGFja2FnZShtZXRhZGF0YS5uYW1lLCBtZXRhZGF0YS52ZXJzaW9uKVxuICAgICAgICAgIGNvbnNvbGUud2FybiBcIkNvdWxkIG5vdCBsb2FkICN7bWV0YWRhdGEubmFtZX1AI3ttZXRhZGF0YS52ZXJzaW9ufSBiZWNhdXNlIGl0IHVzZXMgZGVwcmVjYXRlZCBBUElzIHRoYXQgaGF2ZSBiZWVuIHJlbW92ZWQuXCJcbiAgICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICBvcHRpb25zID0ge1xuICAgICAgICBwYXRoOiBwYWNrYWdlUGF0aCwgbWV0YWRhdGEsIHBhY2thZ2VNYW5hZ2VyOiB0aGlzLCBAY29uZmlnLCBAc3R5bGVNYW5hZ2VyLFxuICAgICAgICBAY29tbWFuZFJlZ2lzdHJ5LCBAa2V5bWFwTWFuYWdlciwgQGRldk1vZGUsIEBub3RpZmljYXRpb25NYW5hZ2VyLFxuICAgICAgICBAZ3JhbW1hclJlZ2lzdHJ5LCBAdGhlbWVNYW5hZ2VyLCBAbWVudU1hbmFnZXIsIEBjb250ZXh0TWVudU1hbmFnZXIsXG4gICAgICAgIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyLCBAdmlld1JlZ2lzdHJ5XG4gICAgICB9XG4gICAgICBpZiBtZXRhZGF0YS50aGVtZVxuICAgICAgICBwYWNrID0gbmV3IFRoZW1lUGFja2FnZShvcHRpb25zKVxuICAgICAgZWxzZVxuICAgICAgICBwYWNrID0gbmV3IFBhY2thZ2Uob3B0aW9ucylcbiAgICAgIHBhY2subG9hZCgpXG4gICAgICBAbG9hZGVkUGFja2FnZXNbcGFjay5uYW1lXSA9IHBhY2tcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1sb2FkLXBhY2thZ2UnLCBwYWNrXG4gICAgICByZXR1cm4gcGFja1xuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUud2FybiBcIkNvdWxkIG5vdCByZXNvbHZlICcje25hbWVPclBhdGh9JyB0byBhIHBhY2thZ2UgcGF0aFwiXG4gICAgbnVsbFxuXG4gIHVubG9hZFBhY2thZ2VzOiAtPlxuICAgIEB1bmxvYWRQYWNrYWdlKG5hbWUpIGZvciBuYW1lIGluIF8ua2V5cyhAbG9hZGVkUGFja2FnZXMpXG4gICAgbnVsbFxuXG4gIHVubG9hZFBhY2thZ2U6IChuYW1lKSAtPlxuICAgIGlmIEBpc1BhY2thZ2VBY3RpdmUobmFtZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRyaWVkIHRvIHVubG9hZCBhY3RpdmUgcGFja2FnZSAnI3tuYW1lfSdcIilcblxuICAgIGlmIHBhY2sgPSBAZ2V0TG9hZGVkUGFja2FnZShuYW1lKVxuICAgICAgZGVsZXRlIEBsb2FkZWRQYWNrYWdlc1twYWNrLm5hbWVdXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtdW5sb2FkLXBhY2thZ2UnLCBwYWNrXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gbG9hZGVkIHBhY2thZ2UgZm9yIG5hbWUgJyN7bmFtZX0nXCIpXG5cbiAgIyBBY3RpdmF0ZSBhbGwgdGhlIHBhY2thZ2VzIHRoYXQgc2hvdWxkIGJlIGFjdGl2YXRlZC5cbiAgYWN0aXZhdGU6IC0+XG4gICAgcHJvbWlzZXMgPSBbXVxuICAgIGZvciBbYWN0aXZhdG9yLCB0eXBlc10gaW4gQHBhY2thZ2VBY3RpdmF0b3JzXG4gICAgICBwYWNrYWdlcyA9IEBnZXRMb2FkZWRQYWNrYWdlc0ZvclR5cGVzKHR5cGVzKVxuICAgICAgcHJvbWlzZXMgPSBwcm9taXNlcy5jb25jYXQoYWN0aXZhdG9yLmFjdGl2YXRlUGFja2FnZXMocGFja2FnZXMpKVxuICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuID0+XG4gICAgICBAdHJpZ2dlckRlZmVycmVkQWN0aXZhdGlvbkhvb2tzKClcbiAgICAgIEBpbml0aWFsUGFja2FnZXNBY3RpdmF0ZWQgPSB0cnVlXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWN0aXZhdGUtaW5pdGlhbC1wYWNrYWdlcydcblxuICAjIGFub3RoZXIgdHlwZSBvZiBwYWNrYWdlIG1hbmFnZXIgY2FuIGhhbmRsZSBvdGhlciBwYWNrYWdlIHR5cGVzLlxuICAjIFNlZSBUaGVtZU1hbmFnZXJcbiAgcmVnaXN0ZXJQYWNrYWdlQWN0aXZhdG9yOiAoYWN0aXZhdG9yLCB0eXBlcykgLT5cbiAgICBAcGFja2FnZUFjdGl2YXRvcnMucHVzaChbYWN0aXZhdG9yLCB0eXBlc10pXG5cbiAgYWN0aXZhdGVQYWNrYWdlczogKHBhY2thZ2VzKSAtPlxuICAgIHByb21pc2VzID0gW11cbiAgICBAY29uZmlnLnRyYW5zYWN0QXN5bmMgPT5cbiAgICAgIGZvciBwYWNrIGluIHBhY2thZ2VzXG4gICAgICAgIHByb21pc2UgPSBAYWN0aXZhdGVQYWNrYWdlKHBhY2submFtZSlcbiAgICAgICAgcHJvbWlzZXMucHVzaChwcm9taXNlKSB1bmxlc3MgcGFjay5hY3RpdmF0aW9uU2hvdWxkQmVEZWZlcnJlZCgpXG4gICAgICBQcm9taXNlLmFsbChwcm9taXNlcylcbiAgICBAb2JzZXJ2ZURpc2FibGVkUGFja2FnZXMoKVxuICAgIEBvYnNlcnZlUGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkKClcbiAgICBwcm9taXNlc1xuXG4gICMgQWN0aXZhdGUgYSBzaW5nbGUgcGFja2FnZSBieSBuYW1lXG4gIGFjdGl2YXRlUGFja2FnZTogKG5hbWUpIC0+XG4gICAgaWYgcGFjayA9IEBnZXRBY3RpdmVQYWNrYWdlKG5hbWUpXG4gICAgICBQcm9taXNlLnJlc29sdmUocGFjaylcbiAgICBlbHNlIGlmIHBhY2sgPSBAbG9hZFBhY2thZ2UobmFtZSlcbiAgICAgIEBhY3RpdmF0aW5nUGFja2FnZXNbcGFjay5uYW1lXSA9IHBhY2tcbiAgICAgIHBhY2suYWN0aXZhdGUoKS50aGVuID0+XG4gICAgICAgIGlmIEBhY3RpdmF0aW5nUGFja2FnZXNbcGFjay5uYW1lXT9cbiAgICAgICAgICBkZWxldGUgQGFjdGl2YXRpbmdQYWNrYWdlc1twYWNrLm5hbWVdXG4gICAgICAgICAgQGFjdGl2ZVBhY2thZ2VzW3BhY2submFtZV0gPSBwYWNrXG4gICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFjdGl2YXRlLXBhY2thZ2UnLCBwYWNrXG4gICAgICAgIHBhY2tcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCBwYWNrYWdlICcje25hbWV9J1wiKSlcblxuICB0cmlnZ2VyRGVmZXJyZWRBY3RpdmF0aW9uSG9va3M6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZGVmZXJyZWRBY3RpdmF0aW9uSG9va3M/XG4gICAgQGFjdGl2YXRpb25Ib29rRW1pdHRlci5lbWl0KGhvb2spIGZvciBob29rIGluIEBkZWZlcnJlZEFjdGl2YXRpb25Ib29rc1xuICAgIEBkZWZlcnJlZEFjdGl2YXRpb25Ib29rcyA9IG51bGxcblxuICB0cmlnZ2VyQWN0aXZhdGlvbkhvb2s6IChob29rKSAtPlxuICAgIHJldHVybiBuZXcgRXJyb3IoXCJDYW5ub3QgdHJpZ2dlciBhbiBlbXB0eSBhY3RpdmF0aW9uIGhvb2tcIikgdW5sZXNzIGhvb2s/IGFuZCBfLmlzU3RyaW5nKGhvb2spIGFuZCBob29rLmxlbmd0aCA+IDBcbiAgICBpZiBAZGVmZXJyZWRBY3RpdmF0aW9uSG9va3M/XG4gICAgICBAZGVmZXJyZWRBY3RpdmF0aW9uSG9va3MucHVzaCBob29rXG4gICAgZWxzZVxuICAgICAgQGFjdGl2YXRpb25Ib29rRW1pdHRlci5lbWl0KGhvb2spXG5cbiAgb25EaWRUcmlnZ2VyQWN0aXZhdGlvbkhvb2s6IChob29rLCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gdW5sZXNzIGhvb2s/IGFuZCBfLmlzU3RyaW5nKGhvb2spIGFuZCBob29rLmxlbmd0aCA+IDBcbiAgICBAYWN0aXZhdGlvbkhvb2tFbWl0dGVyLm9uKGhvb2ssIGNhbGxiYWNrKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBmb3IgcGFjayBpbiBAZ2V0QWN0aXZlUGFja2FnZXMoKVxuICAgICAgQHNlcmlhbGl6ZVBhY2thZ2UocGFjaylcbiAgICBAcGFja2FnZVN0YXRlc1xuXG4gIHNlcmlhbGl6ZVBhY2thZ2U6IChwYWNrKSAtPlxuICAgIEBzZXRQYWNrYWdlU3RhdGUocGFjay5uYW1lLCBzdGF0ZSkgaWYgc3RhdGUgPSBwYWNrLnNlcmlhbGl6ZT8oKVxuXG4gICMgRGVhY3RpdmF0ZSBhbGwgcGFja2FnZXNcbiAgZGVhY3RpdmF0ZVBhY2thZ2VzOiAtPlxuICAgIEBjb25maWcudHJhbnNhY3QgPT5cbiAgICAgIEBkZWFjdGl2YXRlUGFja2FnZShwYWNrLm5hbWUsIHRydWUpIGZvciBwYWNrIGluIEBnZXRMb2FkZWRQYWNrYWdlcygpXG4gICAgICByZXR1cm5cbiAgICBAdW5vYnNlcnZlRGlzYWJsZWRQYWNrYWdlcygpXG4gICAgQHVub2JzZXJ2ZVBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZCgpXG5cbiAgIyBEZWFjdGl2YXRlIHRoZSBwYWNrYWdlIHdpdGggdGhlIGdpdmVuIG5hbWVcbiAgZGVhY3RpdmF0ZVBhY2thZ2U6IChuYW1lLCBzdXBwcmVzc1NlcmlhbGl6YXRpb24pIC0+XG4gICAgcGFjayA9IEBnZXRMb2FkZWRQYWNrYWdlKG5hbWUpXG4gICAgQHNlcmlhbGl6ZVBhY2thZ2UocGFjaykgaWYgbm90IHN1cHByZXNzU2VyaWFsaXphdGlvbiBhbmQgQGlzUGFja2FnZUFjdGl2ZShwYWNrLm5hbWUpXG4gICAgcGFjay5kZWFjdGl2YXRlKClcbiAgICBkZWxldGUgQGFjdGl2ZVBhY2thZ2VzW3BhY2submFtZV1cbiAgICBkZWxldGUgQGFjdGl2YXRpbmdQYWNrYWdlc1twYWNrLm5hbWVdXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWRlYWN0aXZhdGUtcGFja2FnZScsIHBhY2tcblxuICBoYW5kbGVNZXRhZGF0YUVycm9yOiAoZXJyb3IsIHBhY2thZ2VQYXRoKSAtPlxuICAgIG1ldGFkYXRhUGF0aCA9IHBhdGguam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpXG4gICAgZGV0YWlsID0gXCIje2Vycm9yLm1lc3NhZ2V9IGluICN7bWV0YWRhdGFQYXRofVwiXG4gICAgc3RhY2sgPSBcIiN7ZXJyb3Iuc3RhY2t9XFxuICBhdCAje21ldGFkYXRhUGF0aH06MToxXCJcbiAgICBtZXNzYWdlID0gXCJGYWlsZWQgdG8gbG9hZCB0aGUgI3twYXRoLmJhc2VuYW1lKHBhY2thZ2VQYXRoKX0gcGFja2FnZVwiXG4gICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRXJyb3IobWVzc2FnZSwge3N0YWNrLCBkZXRhaWwsIHBhY2thZ2VOYW1lOiBwYXRoLmJhc2VuYW1lKHBhY2thZ2VQYXRoKSwgZGlzbWlzc2FibGU6IHRydWV9KVxuXG4gIHVuaW5zdGFsbERpcmVjdG9yeTogKGRpcmVjdG9yeSkgLT5cbiAgICBzeW1saW5rUHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlKSAtPlxuICAgICAgZnMuaXNTeW1ib2xpY0xpbmsgZGlyZWN0b3J5LCAoaXNTeW1MaW5rKSAtPiByZXNvbHZlKGlzU3ltTGluaylcblxuICAgIGRpclByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgLT5cbiAgICAgIGZzLmlzRGlyZWN0b3J5IGRpcmVjdG9yeSwgKGlzRGlyKSAtPiByZXNvbHZlKGlzRGlyKVxuXG4gICAgUHJvbWlzZS5hbGwoW3N5bWxpbmtQcm9taXNlLCBkaXJQcm9taXNlXSkudGhlbiAodmFsdWVzKSAtPlxuICAgICAgW2lzU3ltTGluaywgaXNEaXJdID0gdmFsdWVzXG4gICAgICBpZiBub3QgaXNTeW1MaW5rIGFuZCBpc0RpclxuICAgICAgICBmcy5yZW1vdmUgZGlyZWN0b3J5LCAtPlxuXG4gIHJlbG9hZEFjdGl2ZVBhY2thZ2VTdHlsZVNoZWV0czogLT5cbiAgICBmb3IgcGFjayBpbiBAZ2V0QWN0aXZlUGFja2FnZXMoKSB3aGVuIHBhY2suZ2V0VHlwZSgpIGlzbnQgJ3RoZW1lJ1xuICAgICAgcGFjay5yZWxvYWRTdHlsZXNoZWV0cz8oKVxuICAgIHJldHVyblxuXG4gIGlzQnVuZGxlZFBhY2thZ2VQYXRoOiAocGFja2FnZVBhdGgpIC0+XG4gICAgaWYgQGRldk1vZGVcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHJlc291cmNlUGF0aC5zdGFydHNXaXRoKFwiI3twcm9jZXNzLnJlc291cmNlc1BhdGh9I3twYXRoLnNlcH1cIilcblxuICAgIEByZXNvdXJjZVBhdGhXaXRoVHJhaWxpbmdTbGFzaCA/PSBcIiN7QHJlc291cmNlUGF0aH0je3BhdGguc2VwfVwiXG4gICAgcGFja2FnZVBhdGg/LnN0YXJ0c1dpdGgoQHJlc291cmNlUGF0aFdpdGhUcmFpbGluZ1NsYXNoKVxuXG4gIGxvYWRQYWNrYWdlTWV0YWRhdGE6IChwYWNrYWdlUGF0aCwgaWdub3JlRXJyb3JzPWZhbHNlKSAtPlxuICAgIHBhY2thZ2VOYW1lID0gcGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aClcbiAgICBpZiBAaXNCdW5kbGVkUGFja2FnZVBhdGgocGFja2FnZVBhdGgpXG4gICAgICBtZXRhZGF0YSA9IEBwYWNrYWdlc0NhY2hlW3BhY2thZ2VOYW1lXT8ubWV0YWRhdGFcbiAgICB1bmxlc3MgbWV0YWRhdGE/XG4gICAgICBpZiBtZXRhZGF0YVBhdGggPSBDU09OLnJlc29sdmUocGF0aC5qb2luKHBhY2thZ2VQYXRoLCAncGFja2FnZScpKVxuICAgICAgICB0cnlcbiAgICAgICAgICBtZXRhZGF0YSA9IENTT04ucmVhZEZpbGVTeW5jKG1ldGFkYXRhUGF0aClcbiAgICAgICAgICBAbm9ybWFsaXplUGFja2FnZU1ldGFkYXRhKG1ldGFkYXRhKVxuICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgIHRocm93IGVycm9yIHVubGVzcyBpZ25vcmVFcnJvcnNcblxuICAgIG1ldGFkYXRhID89IHt9XG4gICAgdW5sZXNzIHR5cGVvZiBtZXRhZGF0YS5uYW1lIGlzICdzdHJpbmcnIGFuZCBtZXRhZGF0YS5uYW1lLmxlbmd0aCA+IDBcbiAgICAgIG1ldGFkYXRhLm5hbWUgPSBwYWNrYWdlTmFtZVxuXG4gICAgaWYgbWV0YWRhdGEucmVwb3NpdG9yeT8udHlwZSBpcyAnZ2l0JyBhbmQgdHlwZW9mIG1ldGFkYXRhLnJlcG9zaXRvcnkudXJsIGlzICdzdHJpbmcnXG4gICAgICBtZXRhZGF0YS5yZXBvc2l0b3J5LnVybCA9IG1ldGFkYXRhLnJlcG9zaXRvcnkudXJsLnJlcGxhY2UoLyheZ2l0XFwrKXwoXFwuZ2l0JCkvZywgJycpXG5cbiAgICBtZXRhZGF0YVxuXG4gIG5vcm1hbGl6ZVBhY2thZ2VNZXRhZGF0YTogKG1ldGFkYXRhKSAtPlxuICAgIHVubGVzcyBtZXRhZGF0YT8uX2lkXG4gICAgICBub3JtYWxpemVQYWNrYWdlRGF0YSA/PSByZXF1aXJlICdub3JtYWxpemUtcGFja2FnZS1kYXRhJ1xuICAgICAgbm9ybWFsaXplUGFja2FnZURhdGEobWV0YWRhdGEpXG4iXX0=
