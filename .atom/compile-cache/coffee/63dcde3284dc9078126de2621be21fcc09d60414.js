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
      this.triggeredActivationHooks = new Set();
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
      this.packageStates = {};
      return this.triggeredActivationHooks.clear();
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
      var activationPromise, pack;
      if (pack = this.getActivePackage(name)) {
        return Promise.resolve(pack);
      } else if (pack = this.loadPackage(name)) {
        this.activatingPackages[pack.name] = pack;
        activationPromise = pack.activate().then((function(_this) {
          return function() {
            if (_this.activatingPackages[pack.name] != null) {
              delete _this.activatingPackages[pack.name];
              _this.activePackages[pack.name] = pack;
              _this.emitter.emit('did-activate-package', pack);
            }
            return pack;
          };
        })(this));
        if (this.deferredActivationHooks == null) {
          this.triggeredActivationHooks.forEach((function(_this) {
            return function(hook) {
              return _this.activationHookEmitter.emit(hook);
            };
          })(this));
        }
        return activationPromise;
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
      this.triggeredActivationHooks.add(hook);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYWNrYWdlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwySkFBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1Asb0JBQUEsR0FBdUI7O0VBRXZCLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsVUFBVyxPQUFBLENBQVEsV0FBUjs7RUFDWixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUVQLFVBQUEsR0FBYSxPQUFBLENBQVEsYUFBUjs7RUFDYixPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0VBQ1YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZixNQUFzRCxPQUFBLENBQVEsdUJBQVIsQ0FBdEQsRUFBQyw2Q0FBRCxFQUFzQjs7RUFpQnRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx3QkFBQyxNQUFEO0FBQ1gsVUFBQTtNQUNFLG9DQURGLEVBQ2lCLElBQUMsQ0FBQSxpQkFBQSxPQURsQixFQUMyQiwwQkFEM0IsRUFDcUMsSUFBQyxDQUFBLHNCQUFBLFlBRHRDLEVBQ29ELElBQUMsQ0FBQSxnQkFBQSxNQURyRCxFQUM2RCxJQUFDLENBQUEsc0JBQUEsWUFEOUQsRUFFRSxJQUFDLENBQUEsNkJBQUEsbUJBRkgsRUFFd0IsSUFBQyxDQUFBLHVCQUFBLGFBRnpCLEVBRXdDLElBQUMsQ0FBQSx5QkFBQSxlQUZ6QyxFQUUwRCxJQUFDLENBQUEseUJBQUEsZUFGM0QsRUFHRSxJQUFDLENBQUEsNkJBQUEsbUJBSEgsRUFHd0IsSUFBQyxDQUFBLHNCQUFBO01BR3pCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FB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QVEsQ0FBRSxhQUFqQjs7VUFDRSx1QkFBd0IsT0FBQSxDQUFRLHdCQUFSOztlQUN4QixvQkFBQSxDQUFxQixRQUFyQixFQUZGOztJQUR3Qjs7Ozs7QUE1akI1QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xubm9ybWFsaXplUGFja2FnZURhdGEgPSBudWxsXG5cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5DU09OID0gcmVxdWlyZSAnc2Vhc29uJ1xuXG5TZXJ2aWNlSHViID0gcmVxdWlyZSAnc2VydmljZS1odWInXG5QYWNrYWdlID0gcmVxdWlyZSAnLi9wYWNrYWdlJ1xuVGhlbWVQYWNrYWdlID0gcmVxdWlyZSAnLi90aGVtZS1wYWNrYWdlJ1xue2lzRGVwcmVjYXRlZFBhY2thZ2UsIGdldERlcHJlY2F0ZWRQYWNrYWdlTWV0YWRhdGF9ID0gcmVxdWlyZSAnLi9kZXByZWNhdGVkLXBhY2thZ2VzJ1xuXG4jIEV4dGVuZGVkOiBQYWNrYWdlIG1hbmFnZXIgZm9yIGNvb3JkaW5hdGluZyB0aGUgbGlmZWN5Y2xlIG9mIEF0b20gcGFja2FnZXMuXG4jXG4jIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20ucGFja2FnZXNgIGdsb2JhbC5cbiNcbiMgUGFja2FnZXMgY2FuIGJlIGxvYWRlZCwgYWN0aXZhdGVkLCBhbmQgZGVhY3RpdmF0ZWQsIGFuZCB1bmxvYWRlZDpcbiMgICogTG9hZGluZyBhIHBhY2thZ2UgcmVhZHMgYW5kIHBhcnNlcyB0aGUgcGFja2FnZSdzIG1ldGFkYXRhIGFuZCByZXNvdXJjZXNcbiMgICAgc3VjaCBhcyBrZXltYXBzLCBtZW51cywgc3R5bGVzaGVldHMsIGV0Yy5cbiMgICogQWN0aXZhdGluZyBhIHBhY2thZ2UgcmVnaXN0ZXJzIHRoZSBsb2FkZWQgcmVzb3VyY2VzIGFuZCBjYWxscyBgYWN0aXZhdGUoKWBcbiMgICAgb24gdGhlIHBhY2thZ2UncyBtYWluIG1vZHVsZS5cbiMgICogRGVhY3RpdmF0aW5nIGEgcGFja2FnZSB1bnJlZ2lzdGVycyB0aGUgcGFja2FnZSdzIHJlc291cmNlcyAgYW5kIGNhbGxzXG4jICAgIGBkZWFjdGl2YXRlKClgIG9uIHRoZSBwYWNrYWdlJ3MgbWFpbiBtb2R1bGUuXG4jICAqIFVubG9hZGluZyBhIHBhY2thZ2UgcmVtb3ZlcyBpdCBjb21wbGV0ZWx5IGZyb20gdGhlIHBhY2thZ2UgbWFuYWdlci5cbiNcbiMgUGFja2FnZXMgY2FuIGJlIGVuYWJsZWQvZGlzYWJsZWQgdmlhIHRoZSBgY29yZS5kaXNhYmxlZFBhY2thZ2VzYCBjb25maWdcbiMgc2V0dGluZ3MgYW5kIGFsc28gYnkgY2FsbGluZyBgZW5hYmxlUGFja2FnZSgpL2Rpc2FibGVQYWNrYWdlKClgLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZU1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChwYXJhbXMpIC0+XG4gICAge1xuICAgICAgY29uZmlnRGlyUGF0aCwgQGRldk1vZGUsIHNhZmVNb2RlLCBAcmVzb3VyY2VQYXRoLCBAY29uZmlnLCBAc3R5bGVNYW5hZ2VyLFxuICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIsIEBrZXltYXBNYW5hZ2VyLCBAY29tbWFuZFJlZ2lzdHJ5LCBAZ3JhbW1hclJlZ2lzdHJ5LFxuICAgICAgQGRlc2VyaWFsaXplck1hbmFnZXIsIEB2aWV3UmVnaXN0cnlcbiAgICB9ID0gcGFyYW1zXG5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGFjdGl2YXRpb25Ib29rRW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHBhY2thZ2VEaXJQYXRocyA9IFtdXG4gICAgQGRlZmVycmVkQWN0aXZhdGlvbkhvb2tzID0gW11cbiAgICBAdHJpZ2dlcmVkQWN0aXZhdGlvbkhvb2tzID0gbmV3IFNldCgpXG4gICAgaWYgY29uZmlnRGlyUGF0aD8gYW5kIG5vdCBzYWZlTW9kZVxuICAgICAgaWYgQGRldk1vZGVcbiAgICAgICAgQHBhY2thZ2VEaXJQYXRocy5wdXNoKHBhdGguam9pbihjb25maWdEaXJQYXRoLCBcImRldlwiLCBcInBhY2thZ2VzXCIpKVxuICAgICAgQHBhY2thZ2VEaXJQYXRocy5wdXNoKHBhdGguam9pbihjb25maWdEaXJQYXRoLCBcInBhY2thZ2VzXCIpKVxuXG4gICAgQHBhY2thZ2VzQ2FjaGUgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKT8uX2F0b21QYWNrYWdlcyA/IHt9XG4gICAgQGluaXRpYWxQYWNrYWdlc0xvYWRlZCA9IGZhbHNlXG4gICAgQGluaXRpYWxQYWNrYWdlc0FjdGl2YXRlZCA9IGZhbHNlXG4gICAgQGxvYWRlZFBhY2thZ2VzID0ge31cbiAgICBAYWN0aXZlUGFja2FnZXMgPSB7fVxuICAgIEBhY3RpdmF0aW5nUGFja2FnZXMgPSB7fVxuICAgIEBwYWNrYWdlU3RhdGVzID0ge31cbiAgICBAc2VydmljZUh1YiA9IG5ldyBTZXJ2aWNlSHViXG5cbiAgICBAcGFja2FnZUFjdGl2YXRvcnMgPSBbXVxuICAgIEByZWdpc3RlclBhY2thZ2VBY3RpdmF0b3IodGhpcywgWydhdG9tJywgJ3RleHRtYXRlJ10pXG5cbiAgc2V0Q29udGV4dE1lbnVNYW5hZ2VyOiAoQGNvbnRleHRNZW51TWFuYWdlcikgLT5cblxuICBzZXRNZW51TWFuYWdlcjogKEBtZW51TWFuYWdlcikgLT5cblxuICBzZXRUaGVtZU1hbmFnZXI6IChAdGhlbWVNYW5hZ2VyKSAtPlxuXG4gIHJlc2V0OiAtPlxuICAgIEBzZXJ2aWNlSHViLmNsZWFyKClcbiAgICBAZGVhY3RpdmF0ZVBhY2thZ2VzKClcbiAgICBAbG9hZGVkUGFja2FnZXMgPSB7fVxuICAgIEBwYWNrYWdlU3RhdGVzID0ge31cbiAgICBAdHJpZ2dlcmVkQWN0aXZhdGlvbkhvb2tzLmNsZWFyKClcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYWxsIHBhY2thZ2VzIGhhdmUgYmVlbiBsb2FkZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRMb2FkSW5pdGlhbFBhY2thZ2VzOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1sb2FkLWluaXRpYWwtcGFja2FnZXMnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYWxsIHBhY2thZ2VzIGhhdmUgYmVlbiBhY3RpdmF0ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBY3RpdmF0ZUluaXRpYWxQYWNrYWdlczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWN0aXZhdGUtaW5pdGlhbC1wYWNrYWdlcycsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhY2thZ2UgaXMgYWN0aXZhdGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIEEge0Z1bmN0aW9ufSB0byBiZSBpbnZva2VkIHdoZW4gYSBwYWNrYWdlIGlzIGFjdGl2YXRlZC5cbiAgIyAgICogYHBhY2thZ2VgIFRoZSB7UGFja2FnZX0gdGhhdCB3YXMgYWN0aXZhdGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBY3RpdmF0ZVBhY2thZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFjdGl2YXRlLXBhY2thZ2UnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYWNrYWdlIGlzIGRlYWN0aXZhdGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIEEge0Z1bmN0aW9ufSB0byBiZSBpbnZva2VkIHdoZW4gYSBwYWNrYWdlIGlzIGRlYWN0aXZhdGVkLlxuICAjICAgKiBgcGFja2FnZWAgVGhlIHtQYWNrYWdlfSB0aGF0IHdhcyBkZWFjdGl2YXRlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVhY3RpdmF0ZVBhY2thZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWRlYWN0aXZhdGUtcGFja2FnZScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhY2thZ2UgaXMgbG9hZGVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIEEge0Z1bmN0aW9ufSB0byBiZSBpbnZva2VkIHdoZW4gYSBwYWNrYWdlIGlzIGxvYWRlZC5cbiAgIyAgICogYHBhY2thZ2VgIFRoZSB7UGFja2FnZX0gdGhhdCB3YXMgbG9hZGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRMb2FkUGFja2FnZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtbG9hZC1wYWNrYWdlJywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgcGFja2FnZSBpcyB1bmxvYWRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCBBIHtGdW5jdGlvbn0gdG8gYmUgaW52b2tlZCB3aGVuIGEgcGFja2FnZSBpcyB1bmxvYWRlZC5cbiAgIyAgICogYHBhY2thZ2VgIFRoZSB7UGFja2FnZX0gdGhhdCB3YXMgdW5sb2FkZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZFVubG9hZFBhY2thZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXVubG9hZC1wYWNrYWdlJywgY2FsbGJhY2tcblxuICAjIyNcbiAgU2VjdGlvbjogUGFja2FnZSBzeXN0ZW0gZGF0YVxuICAjIyNcblxuICAjIFB1YmxpYzogR2V0IHRoZSBwYXRoIHRvIHRoZSBhcG0gY29tbWFuZC5cbiAgI1xuICAjIFVzZXMgdGhlIHZhbHVlIG9mIHRoZSBgY29yZS5hcG1QYXRoYCBjb25maWcgc2V0dGluZyBpZiBpdCBleGlzdHMuXG4gICNcbiAgIyBSZXR1cm4gYSB7U3RyaW5nfSBmaWxlIHBhdGggdG8gYXBtLlxuICBnZXRBcG1QYXRoOiAtPlxuICAgIGNvbmZpZ1BhdGggPSBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuYXBtUGF0aCcpXG4gICAgcmV0dXJuIGNvbmZpZ1BhdGggaWYgY29uZmlnUGF0aFxuICAgIHJldHVybiBAYXBtUGF0aCBpZiBAYXBtUGF0aD9cblxuICAgIGNvbW1hbmROYW1lID0gJ2FwbSdcbiAgICBjb21tYW5kTmFtZSArPSAnLmNtZCcgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG4gICAgYXBtUm9vdCA9IHBhdGguam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsICdhcHAnLCAnYXBtJylcbiAgICBAYXBtUGF0aCA9IHBhdGguam9pbihhcG1Sb290LCAnYmluJywgY29tbWFuZE5hbWUpXG4gICAgdW5sZXNzIGZzLmlzRmlsZVN5bmMoQGFwbVBhdGgpXG4gICAgICBAYXBtUGF0aCA9IHBhdGguam9pbihhcG1Sb290LCAnbm9kZV9tb2R1bGVzJywgJ2F0b20tcGFja2FnZS1tYW5hZ2VyJywgJ2JpbicsIGNvbW1hbmROYW1lKVxuICAgIEBhcG1QYXRoXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgcGF0aHMgYmVpbmcgdXNlZCB0byBsb29rIGZvciBwYWNrYWdlcy5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfSBkaXJlY3RvcnkgcGF0aHMuXG4gIGdldFBhY2thZ2VEaXJQYXRoczogLT5cbiAgICBfLmNsb25lKEBwYWNrYWdlRGlyUGF0aHMpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEdlbmVyYWwgcGFja2FnZSBkYXRhXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXNvbHZlIHRoZSBnaXZlbiBwYWNrYWdlIG5hbWUgdG8gYSBwYXRoIG9uIGRpc2suXG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm4gYSB7U3RyaW5nfSBmb2xkZXIgcGF0aCBvciB1bmRlZmluZWQgaWYgaXQgY291bGQgbm90IGJlIHJlc29sdmVkLlxuICByZXNvbHZlUGFja2FnZVBhdGg6IChuYW1lKSAtPlxuICAgIHJldHVybiBuYW1lIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhuYW1lKVxuXG4gICAgcGFja2FnZVBhdGggPSBmcy5yZXNvbHZlKEBwYWNrYWdlRGlyUGF0aHMuLi4sIG5hbWUpXG4gICAgcmV0dXJuIHBhY2thZ2VQYXRoIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhwYWNrYWdlUGF0aClcblxuICAgIHBhY2thZ2VQYXRoID0gcGF0aC5qb2luKEByZXNvdXJjZVBhdGgsICdub2RlX21vZHVsZXMnLCBuYW1lKVxuICAgIHJldHVybiBwYWNrYWdlUGF0aCBpZiBAaGFzQXRvbUVuZ2luZShwYWNrYWdlUGF0aClcblxuICAjIFB1YmxpYzogSXMgdGhlIHBhY2thZ2Ugd2l0aCB0aGUgZ2l2ZW4gbmFtZSBidW5kbGVkIHdpdGggQXRvbT9cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzQnVuZGxlZFBhY2thZ2U6IChuYW1lKSAtPlxuICAgIEBnZXRQYWNrYWdlRGVwZW5kZW5jaWVzKCkuaGFzT3duUHJvcGVydHkobmFtZSlcblxuICBpc0RlcHJlY2F0ZWRQYWNrYWdlOiAobmFtZSwgdmVyc2lvbikgLT5cbiAgICBpc0RlcHJlY2F0ZWRQYWNrYWdlKG5hbWUsIHZlcnNpb24pXG5cbiAgZ2V0RGVwcmVjYXRlZFBhY2thZ2VNZXRhZGF0YTogKG5hbWUpIC0+XG4gICAgZ2V0RGVwcmVjYXRlZFBhY2thZ2VNZXRhZGF0YShuYW1lKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFbmFibGluZyBhbmQgZGlzYWJsaW5nIHBhY2thZ2VzXG4gICMjI1xuXG4gICMgUHVibGljOiBFbmFibGUgdGhlIHBhY2thZ2Ugd2l0aCB0aGUgZ2l2ZW4gbmFtZS5cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgdGhlIHtQYWNrYWdlfSB0aGF0IHdhcyBlbmFibGVkIG9yIG51bGwgaWYgaXQgaXNuJ3QgbG9hZGVkLlxuICBlbmFibGVQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBwYWNrID0gQGxvYWRQYWNrYWdlKG5hbWUpXG4gICAgcGFjaz8uZW5hYmxlKClcbiAgICBwYWNrXG5cbiAgIyBQdWJsaWM6IERpc2FibGUgdGhlIHBhY2thZ2Ugd2l0aCB0aGUgZ2l2ZW4gbmFtZS5cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgdGhlIHtQYWNrYWdlfSB0aGF0IHdhcyBkaXNhYmxlZCBvciBudWxsIGlmIGl0IGlzbid0IGxvYWRlZC5cbiAgZGlzYWJsZVBhY2thZ2U6IChuYW1lKSAtPlxuICAgIHBhY2sgPSBAbG9hZFBhY2thZ2UobmFtZSlcblxuICAgIHVubGVzcyBAaXNQYWNrYWdlRGlzYWJsZWQobmFtZSlcbiAgICAgIHBhY2s/LmRpc2FibGUoKVxuXG4gICAgcGFja1xuXG4gICMgUHVibGljOiBJcyB0aGUgcGFja2FnZSB3aXRoIHRoZSBnaXZlbiBuYW1lIGRpc2FibGVkP1xuICAjXG4gICMgKiBgbmFtZWAgLSBUaGUge1N0cmluZ30gcGFja2FnZSBuYW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgaXNQYWNrYWdlRGlzYWJsZWQ6IChuYW1lKSAtPlxuICAgIF8uaW5jbHVkZShAY29uZmlnLmdldCgnY29yZS5kaXNhYmxlZFBhY2thZ2VzJykgPyBbXSwgbmFtZSlcblxuICAjIyNcbiAgU2VjdGlvbjogQWNjZXNzaW5nIGFjdGl2ZSBwYWNrYWdlc1xuICAjIyNcblxuICAjIFB1YmxpYzogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBhY3RpdmUge1BhY2thZ2V9cy5cbiAgZ2V0QWN0aXZlUGFja2FnZXM6IC0+XG4gICAgXy52YWx1ZXMoQGFjdGl2ZVBhY2thZ2VzKVxuXG4gICMgUHVibGljOiBHZXQgdGhlIGFjdGl2ZSB7UGFja2FnZX0gd2l0aCB0aGUgZ2l2ZW4gbmFtZS5cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7UGFja2FnZX0gb3IgdW5kZWZpbmVkLlxuICBnZXRBY3RpdmVQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBAYWN0aXZlUGFja2FnZXNbbmFtZV1cblxuICAjIFB1YmxpYzogSXMgdGhlIHtQYWNrYWdlfSB3aXRoIHRoZSBnaXZlbiBuYW1lIGFjdGl2ZT9cbiAgI1xuICAjICogYG5hbWVgIC0gVGhlIHtTdHJpbmd9IHBhY2thZ2UgbmFtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzUGFja2FnZUFjdGl2ZTogKG5hbWUpIC0+XG4gICAgQGdldEFjdGl2ZVBhY2thZ2UobmFtZSk/XG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHBhY2thZ2UgYWN0aXZhdGlvbiBoYXMgb2NjdXJyZWQuXG4gIGhhc0FjdGl2YXRlZEluaXRpYWxQYWNrYWdlczogLT4gQGluaXRpYWxQYWNrYWdlc0FjdGl2YXRlZFxuXG4gICMjI1xuICBTZWN0aW9uOiBBY2Nlc3NpbmcgbG9hZGVkIHBhY2thZ2VzXG4gICMjI1xuXG4gICMgUHVibGljOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIGxvYWRlZCB7UGFja2FnZX1zXG4gIGdldExvYWRlZFBhY2thZ2VzOiAtPlxuICAgIF8udmFsdWVzKEBsb2FkZWRQYWNrYWdlcylcblxuICAjIEdldCBwYWNrYWdlcyBmb3IgYSBjZXJ0YWluIHBhY2thZ2UgdHlwZVxuICAjXG4gICMgKiBgdHlwZXNgIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zIGxpa2UgWydhdG9tJywgJ3RleHRtYXRlJ10uXG4gIGdldExvYWRlZFBhY2thZ2VzRm9yVHlwZXM6ICh0eXBlcykgLT5cbiAgICBwYWNrIGZvciBwYWNrIGluIEBnZXRMb2FkZWRQYWNrYWdlcygpIHdoZW4gcGFjay5nZXRUeXBlKCkgaW4gdHlwZXNcblxuICAjIFB1YmxpYzogR2V0IHRoZSBsb2FkZWQge1BhY2thZ2V9IHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICNcbiAgIyAqIGBuYW1lYCAtIFRoZSB7U3RyaW5nfSBwYWNrYWdlIG5hbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhY2thZ2V9IG9yIHVuZGVmaW5lZC5cbiAgZ2V0TG9hZGVkUGFja2FnZTogKG5hbWUpIC0+XG4gICAgQGxvYWRlZFBhY2thZ2VzW25hbWVdXG5cbiAgIyBQdWJsaWM6IElzIHRoZSBwYWNrYWdlIHdpdGggdGhlIGdpdmVuIG5hbWUgbG9hZGVkP1xuICAjXG4gICMgKiBgbmFtZWAgLSBUaGUge1N0cmluZ30gcGFja2FnZSBuYW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgaXNQYWNrYWdlTG9hZGVkOiAobmFtZSkgLT5cbiAgICBAZ2V0TG9hZGVkUGFja2FnZShuYW1lKT9cblxuICAjIFB1YmxpYzogUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgcGFja2FnZSBsb2FkaW5nIGhhcyBvY2N1cnJlZC5cbiAgaGFzTG9hZGVkSW5pdGlhbFBhY2thZ2VzOiAtPiBAaW5pdGlhbFBhY2thZ2VzTG9hZGVkXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFjY2Vzc2luZyBhdmFpbGFibGUgcGFja2FnZXNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMgb2YgYWxsIHRoZSBhdmFpbGFibGUgcGFja2FnZSBwYXRocy5cbiAgZ2V0QXZhaWxhYmxlUGFja2FnZVBhdGhzOiAtPlxuICAgIHBhY2thZ2VQYXRocyA9IFtdXG5cbiAgICBmb3IgcGFja2FnZURpclBhdGggaW4gQHBhY2thZ2VEaXJQYXRoc1xuICAgICAgZm9yIHBhY2thZ2VQYXRoIGluIGZzLmxpc3RTeW5jKHBhY2thZ2VEaXJQYXRoKVxuICAgICAgICBwYWNrYWdlUGF0aHMucHVzaChwYWNrYWdlUGF0aCkgaWYgZnMuaXNEaXJlY3RvcnlTeW5jKHBhY2thZ2VQYXRoKVxuXG4gICAgcGFja2FnZXNQYXRoID0gcGF0aC5qb2luKEByZXNvdXJjZVBhdGgsICdub2RlX21vZHVsZXMnKVxuICAgIGZvciBwYWNrYWdlTmFtZSBvZiBAZ2V0UGFja2FnZURlcGVuZGVuY2llcygpXG4gICAgICBwYWNrYWdlUGF0aCA9IHBhdGguam9pbihwYWNrYWdlc1BhdGgsIHBhY2thZ2VOYW1lKVxuICAgICAgcGFja2FnZVBhdGhzLnB1c2gocGFja2FnZVBhdGgpIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhwYWNrYWdlUGF0aClcblxuICAgIF8udW5pcShwYWNrYWdlUGF0aHMpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMgb2YgYWxsIHRoZSBhdmFpbGFibGUgcGFja2FnZSBuYW1lcy5cbiAgZ2V0QXZhaWxhYmxlUGFja2FnZU5hbWVzOiAtPlxuICAgIF8udW5pcSBfLm1hcCBAZ2V0QXZhaWxhYmxlUGFja2FnZVBhdGhzKCksIChwYWNrYWdlUGF0aCkgLT4gcGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aClcblxuICAjIFB1YmxpYzogUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtTdHJpbmd9cyBvZiBhbGwgdGhlIGF2YWlsYWJsZSBwYWNrYWdlIG1ldGFkYXRhLlxuICBnZXRBdmFpbGFibGVQYWNrYWdlTWV0YWRhdGE6IC0+XG4gICAgcGFja2FnZXMgPSBbXVxuICAgIGZvciBwYWNrYWdlUGF0aCBpbiBAZ2V0QXZhaWxhYmxlUGFja2FnZVBhdGhzKClcbiAgICAgIG5hbWUgPSBwYXRoLmJhc2VuYW1lKHBhY2thZ2VQYXRoKVxuICAgICAgbWV0YWRhdGEgPSBAZ2V0TG9hZGVkUGFja2FnZShuYW1lKT8ubWV0YWRhdGEgPyBAbG9hZFBhY2thZ2VNZXRhZGF0YShwYWNrYWdlUGF0aCwgdHJ1ZSlcbiAgICAgIHBhY2thZ2VzLnB1c2gobWV0YWRhdGEpXG4gICAgcGFja2FnZXNcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZVxuICAjIyNcblxuICBnZXRQYWNrYWdlU3RhdGU6IChuYW1lKSAtPlxuICAgIEBwYWNrYWdlU3RhdGVzW25hbWVdXG5cbiAgc2V0UGFja2FnZVN0YXRlOiAobmFtZSwgc3RhdGUpIC0+XG4gICAgQHBhY2thZ2VTdGF0ZXNbbmFtZV0gPSBzdGF0ZVxuXG4gIGdldFBhY2thZ2VEZXBlbmRlbmNpZXM6IC0+XG4gICAgdW5sZXNzIEBwYWNrYWdlRGVwZW5kZW5jaWVzP1xuICAgICAgdHJ5XG4gICAgICAgIEBwYWNrYWdlRGVwZW5kZW5jaWVzID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk/LnBhY2thZ2VEZXBlbmRlbmNpZXNcbiAgICAgIEBwYWNrYWdlRGVwZW5kZW5jaWVzID89IHt9XG5cbiAgICBAcGFja2FnZURlcGVuZGVuY2llc1xuXG4gIGhhc0F0b21FbmdpbmU6IChwYWNrYWdlUGF0aCkgLT5cbiAgICBtZXRhZGF0YSA9IEBsb2FkUGFja2FnZU1ldGFkYXRhKHBhY2thZ2VQYXRoLCB0cnVlKVxuICAgIG1ldGFkYXRhPy5lbmdpbmVzPy5hdG9tP1xuXG4gIHVub2JzZXJ2ZURpc2FibGVkUGFja2FnZXM6IC0+XG4gICAgQGRpc2FibGVkUGFja2FnZXNTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBkaXNhYmxlZFBhY2thZ2VzU3Vic2NyaXB0aW9uID0gbnVsbFxuXG4gIG9ic2VydmVEaXNhYmxlZFBhY2thZ2VzOiAtPlxuICAgIEBkaXNhYmxlZFBhY2thZ2VzU3Vic2NyaXB0aW9uID89IEBjb25maWcub25EaWRDaGFuZ2UgJ2NvcmUuZGlzYWJsZWRQYWNrYWdlcycsICh7bmV3VmFsdWUsIG9sZFZhbHVlfSkgPT5cbiAgICAgIHBhY2thZ2VzVG9FbmFibGUgPSBfLmRpZmZlcmVuY2Uob2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAgICAgcGFja2FnZXNUb0Rpc2FibGUgPSBfLmRpZmZlcmVuY2UobmV3VmFsdWUsIG9sZFZhbHVlKVxuXG4gICAgICBAZGVhY3RpdmF0ZVBhY2thZ2UocGFja2FnZU5hbWUpIGZvciBwYWNrYWdlTmFtZSBpbiBwYWNrYWdlc1RvRGlzYWJsZSB3aGVuIEBnZXRBY3RpdmVQYWNrYWdlKHBhY2thZ2VOYW1lKVxuICAgICAgQGFjdGl2YXRlUGFja2FnZShwYWNrYWdlTmFtZSkgZm9yIHBhY2thZ2VOYW1lIGluIHBhY2thZ2VzVG9FbmFibGVcbiAgICAgIG51bGxcblxuICB1bm9ic2VydmVQYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWQ6IC0+XG4gICAgQHBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZFN1YnNjcmlwdGlvbiA9IG51bGxcblxuICBvYnNlcnZlUGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkOiAtPlxuICAgIEBwYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWRTdWJzY3JpcHRpb24gPz0gQGNvbmZpZy5vbkRpZENoYW5nZSAnY29yZS5wYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWQnLCAoe25ld1ZhbHVlLCBvbGRWYWx1ZX0pID0+XG4gICAgICBrZXltYXBzVG9FbmFibGUgPSBfLmRpZmZlcmVuY2Uob2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAgICAga2V5bWFwc1RvRGlzYWJsZSA9IF8uZGlmZmVyZW5jZShuZXdWYWx1ZSwgb2xkVmFsdWUpXG5cbiAgICAgIGZvciBwYWNrYWdlTmFtZSBpbiBrZXltYXBzVG9EaXNhYmxlIHdoZW4gbm90IEBpc1BhY2thZ2VEaXNhYmxlZChwYWNrYWdlTmFtZSlcbiAgICAgICAgQGdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5kZWFjdGl2YXRlS2V5bWFwcygpXG4gICAgICBmb3IgcGFja2FnZU5hbWUgaW4ga2V5bWFwc1RvRW5hYmxlIHdoZW4gbm90IEBpc1BhY2thZ2VEaXNhYmxlZChwYWNrYWdlTmFtZSlcbiAgICAgICAgQGdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5hY3RpdmF0ZUtleW1hcHMoKVxuICAgICAgbnVsbFxuXG4gIGxvYWRQYWNrYWdlczogLT5cbiAgICAjIEVuc3VyZSBhdG9tIGV4cG9ydHMgaXMgYWxyZWFkeSBpbiB0aGUgcmVxdWlyZSBjYWNoZSBzbyB0aGUgbG9hZCB0aW1lXG4gICAgIyBvZiB0aGUgZmlyc3QgcGFja2FnZSBpc24ndCBza2V3ZWQgYnkgYmVpbmcgdGhlIGZpcnN0IHRvIHJlcXVpcmUgYXRvbVxuICAgIHJlcXVpcmUgJy4uL2V4cG9ydHMvYXRvbSdcblxuICAgIHBhY2thZ2VQYXRocyA9IEBnZXRBdmFpbGFibGVQYWNrYWdlUGF0aHMoKVxuICAgIHBhY2thZ2VQYXRocyA9IHBhY2thZ2VQYXRocy5maWx0ZXIgKHBhY2thZ2VQYXRoKSA9PiBub3QgQGlzUGFja2FnZURpc2FibGVkKHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpKVxuICAgIHBhY2thZ2VQYXRocyA9IF8udW5pcSBwYWNrYWdlUGF0aHMsIChwYWNrYWdlUGF0aCkgLT4gcGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aClcbiAgICBAY29uZmlnLnRyYW5zYWN0ID0+XG4gICAgICBAbG9hZFBhY2thZ2UocGFja2FnZVBhdGgpIGZvciBwYWNrYWdlUGF0aCBpbiBwYWNrYWdlUGF0aHNcbiAgICAgIHJldHVyblxuICAgIEBpbml0aWFsUGFja2FnZXNMb2FkZWQgPSB0cnVlXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWxvYWQtaW5pdGlhbC1wYWNrYWdlcydcblxuICBsb2FkUGFja2FnZTogKG5hbWVPclBhdGgpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgcGF0aC5iYXNlbmFtZShuYW1lT3JQYXRoKVswXS5tYXRjaCAvXlxcLi8gIyBwcmltYXJpbHkgdG8gc2tpcCAuZ2l0IGZvbGRlclxuXG4gICAgcmV0dXJuIHBhY2sgaWYgcGFjayA9IEBnZXRMb2FkZWRQYWNrYWdlKG5hbWVPclBhdGgpXG5cbiAgICBpZiBwYWNrYWdlUGF0aCA9IEByZXNvbHZlUGFja2FnZVBhdGgobmFtZU9yUGF0aClcbiAgICAgIG5hbWUgPSBwYXRoLmJhc2VuYW1lKG5hbWVPclBhdGgpXG4gICAgICByZXR1cm4gcGFjayBpZiBwYWNrID0gQGdldExvYWRlZFBhY2thZ2UobmFtZSlcblxuICAgICAgdHJ5XG4gICAgICAgIG1ldGFkYXRhID0gQGxvYWRQYWNrYWdlTWV0YWRhdGEocGFja2FnZVBhdGgpID8ge31cbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIEBoYW5kbGVNZXRhZGF0YUVycm9yKGVycm9yLCBwYWNrYWdlUGF0aClcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgdW5sZXNzIEBpc0J1bmRsZWRQYWNrYWdlKG1ldGFkYXRhLm5hbWUpXG4gICAgICAgIGlmIEBpc0RlcHJlY2F0ZWRQYWNrYWdlKG1ldGFkYXRhLm5hbWUsIG1ldGFkYXRhLnZlcnNpb24pXG4gICAgICAgICAgY29uc29sZS53YXJuIFwiQ291bGQgbm90IGxvYWQgI3ttZXRhZGF0YS5uYW1lfUAje21ldGFkYXRhLnZlcnNpb259IGJlY2F1c2UgaXQgdXNlcyBkZXByZWNhdGVkIEFQSXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZC5cIlxuICAgICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgIHBhdGg6IHBhY2thZ2VQYXRoLCBtZXRhZGF0YSwgcGFja2FnZU1hbmFnZXI6IHRoaXMsIEBjb25maWcsIEBzdHlsZU1hbmFnZXIsXG4gICAgICAgIEBjb21tYW5kUmVnaXN0cnksIEBrZXltYXBNYW5hZ2VyLCBAZGV2TW9kZSwgQG5vdGlmaWNhdGlvbk1hbmFnZXIsXG4gICAgICAgIEBncmFtbWFyUmVnaXN0cnksIEB0aGVtZU1hbmFnZXIsIEBtZW51TWFuYWdlciwgQGNvbnRleHRNZW51TWFuYWdlcixcbiAgICAgICAgQGRlc2VyaWFsaXplck1hbmFnZXIsIEB2aWV3UmVnaXN0cnlcbiAgICAgIH1cbiAgICAgIGlmIG1ldGFkYXRhLnRoZW1lXG4gICAgICAgIHBhY2sgPSBuZXcgVGhlbWVQYWNrYWdlKG9wdGlvbnMpXG4gICAgICBlbHNlXG4gICAgICAgIHBhY2sgPSBuZXcgUGFja2FnZShvcHRpb25zKVxuICAgICAgcGFjay5sb2FkKClcbiAgICAgIEBsb2FkZWRQYWNrYWdlc1twYWNrLm5hbWVdID0gcGFja1xuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWxvYWQtcGFja2FnZScsIHBhY2tcbiAgICAgIHJldHVybiBwYWNrXG4gICAgZWxzZVxuICAgICAgY29uc29sZS53YXJuIFwiQ291bGQgbm90IHJlc29sdmUgJyN7bmFtZU9yUGF0aH0nIHRvIGEgcGFja2FnZSBwYXRoXCJcbiAgICBudWxsXG5cbiAgdW5sb2FkUGFja2FnZXM6IC0+XG4gICAgQHVubG9hZFBhY2thZ2UobmFtZSkgZm9yIG5hbWUgaW4gXy5rZXlzKEBsb2FkZWRQYWNrYWdlcylcbiAgICBudWxsXG5cbiAgdW5sb2FkUGFja2FnZTogKG5hbWUpIC0+XG4gICAgaWYgQGlzUGFja2FnZUFjdGl2ZShuYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHJpZWQgdG8gdW5sb2FkIGFjdGl2ZSBwYWNrYWdlICcje25hbWV9J1wiKVxuXG4gICAgaWYgcGFjayA9IEBnZXRMb2FkZWRQYWNrYWdlKG5hbWUpXG4gICAgICBkZWxldGUgQGxvYWRlZFBhY2thZ2VzW3BhY2submFtZV1cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC11bmxvYWQtcGFja2FnZScsIHBhY2tcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBsb2FkZWQgcGFja2FnZSBmb3IgbmFtZSAnI3tuYW1lfSdcIilcblxuICAjIEFjdGl2YXRlIGFsbCB0aGUgcGFja2FnZXMgdGhhdCBzaG91bGQgYmUgYWN0aXZhdGVkLlxuICBhY3RpdmF0ZTogLT5cbiAgICBwcm9taXNlcyA9IFtdXG4gICAgZm9yIFthY3RpdmF0b3IsIHR5cGVzXSBpbiBAcGFja2FnZUFjdGl2YXRvcnNcbiAgICAgIHBhY2thZ2VzID0gQGdldExvYWRlZFBhY2thZ2VzRm9yVHlwZXModHlwZXMpXG4gICAgICBwcm9taXNlcyA9IHByb21pc2VzLmNvbmNhdChhY3RpdmF0b3IuYWN0aXZhdGVQYWNrYWdlcyhwYWNrYWdlcykpXG4gICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4gPT5cbiAgICAgIEB0cmlnZ2VyRGVmZXJyZWRBY3RpdmF0aW9uSG9va3MoKVxuICAgICAgQGluaXRpYWxQYWNrYWdlc0FjdGl2YXRlZCA9IHRydWVcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hY3RpdmF0ZS1pbml0aWFsLXBhY2thZ2VzJ1xuXG4gICMgYW5vdGhlciB0eXBlIG9mIHBhY2thZ2UgbWFuYWdlciBjYW4gaGFuZGxlIG90aGVyIHBhY2thZ2UgdHlwZXMuXG4gICMgU2VlIFRoZW1lTWFuYWdlclxuICByZWdpc3RlclBhY2thZ2VBY3RpdmF0b3I6IChhY3RpdmF0b3IsIHR5cGVzKSAtPlxuICAgIEBwYWNrYWdlQWN0aXZhdG9ycy5wdXNoKFthY3RpdmF0b3IsIHR5cGVzXSlcblxuICBhY3RpdmF0ZVBhY2thZ2VzOiAocGFja2FnZXMpIC0+XG4gICAgcHJvbWlzZXMgPSBbXVxuICAgIEBjb25maWcudHJhbnNhY3RBc3luYyA9PlxuICAgICAgZm9yIHBhY2sgaW4gcGFja2FnZXNcbiAgICAgICAgcHJvbWlzZSA9IEBhY3RpdmF0ZVBhY2thZ2UocGFjay5uYW1lKVxuICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpIHVubGVzcyBwYWNrLmFjdGl2YXRpb25TaG91bGRCZURlZmVycmVkKClcbiAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgIEBvYnNlcnZlRGlzYWJsZWRQYWNrYWdlcygpXG4gICAgQG9ic2VydmVQYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWQoKVxuICAgIHByb21pc2VzXG5cbiAgIyBBY3RpdmF0ZSBhIHNpbmdsZSBwYWNrYWdlIGJ5IG5hbWVcbiAgYWN0aXZhdGVQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBpZiBwYWNrID0gQGdldEFjdGl2ZVBhY2thZ2UobmFtZSlcbiAgICAgIFByb21pc2UucmVzb2x2ZShwYWNrKVxuICAgIGVsc2UgaWYgcGFjayA9IEBsb2FkUGFja2FnZShuYW1lKVxuICAgICAgQGFjdGl2YXRpbmdQYWNrYWdlc1twYWNrLm5hbWVdID0gcGFja1xuICAgICAgYWN0aXZhdGlvblByb21pc2UgPSBwYWNrLmFjdGl2YXRlKCkudGhlbiA9PlxuICAgICAgICBpZiBAYWN0aXZhdGluZ1BhY2thZ2VzW3BhY2submFtZV0/XG4gICAgICAgICAgZGVsZXRlIEBhY3RpdmF0aW5nUGFja2FnZXNbcGFjay5uYW1lXVxuICAgICAgICAgIEBhY3RpdmVQYWNrYWdlc1twYWNrLm5hbWVdID0gcGFja1xuICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hY3RpdmF0ZS1wYWNrYWdlJywgcGFja1xuICAgICAgICBwYWNrXG5cbiAgICAgIHVubGVzcyBAZGVmZXJyZWRBY3RpdmF0aW9uSG9va3M/XG4gICAgICAgIEB0cmlnZ2VyZWRBY3RpdmF0aW9uSG9va3MuZm9yRWFjaCgoaG9vaykgPT4gQGFjdGl2YXRpb25Ib29rRW1pdHRlci5lbWl0KGhvb2spKVxuXG4gICAgICBhY3RpdmF0aW9uUHJvbWlzZVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBsb2FkIHBhY2thZ2UgJyN7bmFtZX0nXCIpKVxuXG4gIHRyaWdnZXJEZWZlcnJlZEFjdGl2YXRpb25Ib29rczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBkZWZlcnJlZEFjdGl2YXRpb25Ib29rcz9cbiAgICBAYWN0aXZhdGlvbkhvb2tFbWl0dGVyLmVtaXQoaG9vaykgZm9yIGhvb2sgaW4gQGRlZmVycmVkQWN0aXZhdGlvbkhvb2tzXG4gICAgQGRlZmVycmVkQWN0aXZhdGlvbkhvb2tzID0gbnVsbFxuXG4gIHRyaWdnZXJBY3RpdmF0aW9uSG9vazogKGhvb2spIC0+XG4gICAgcmV0dXJuIG5ldyBFcnJvcihcIkNhbm5vdCB0cmlnZ2VyIGFuIGVtcHR5IGFjdGl2YXRpb24gaG9va1wiKSB1bmxlc3MgaG9vaz8gYW5kIF8uaXNTdHJpbmcoaG9vaykgYW5kIGhvb2subGVuZ3RoID4gMFxuICAgIEB0cmlnZ2VyZWRBY3RpdmF0aW9uSG9va3MuYWRkKGhvb2spXG4gICAgaWYgQGRlZmVycmVkQWN0aXZhdGlvbkhvb2tzP1xuICAgICAgQGRlZmVycmVkQWN0aXZhdGlvbkhvb2tzLnB1c2ggaG9va1xuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0aW9uSG9va0VtaXR0ZXIuZW1pdChob29rKVxuXG4gIG9uRGlkVHJpZ2dlckFjdGl2YXRpb25Ib29rOiAoaG9vaywgY2FsbGJhY2spIC0+XG4gICAgcmV0dXJuIHVubGVzcyBob29rPyBhbmQgXy5pc1N0cmluZyhob29rKSBhbmQgaG9vay5sZW5ndGggPiAwXG4gICAgQGFjdGl2YXRpb25Ib29rRW1pdHRlci5vbihob29rLCBjYWxsYmFjaylcblxuICBzZXJpYWxpemU6IC0+XG4gICAgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVBhY2thZ2VzKClcbiAgICAgIEBzZXJpYWxpemVQYWNrYWdlKHBhY2spXG4gICAgQHBhY2thZ2VTdGF0ZXNcblxuICBzZXJpYWxpemVQYWNrYWdlOiAocGFjaykgLT5cbiAgICBAc2V0UGFja2FnZVN0YXRlKHBhY2submFtZSwgc3RhdGUpIGlmIHN0YXRlID0gcGFjay5zZXJpYWxpemU/KClcblxuICAjIERlYWN0aXZhdGUgYWxsIHBhY2thZ2VzXG4gIGRlYWN0aXZhdGVQYWNrYWdlczogLT5cbiAgICBAY29uZmlnLnRyYW5zYWN0ID0+XG4gICAgICBAZGVhY3RpdmF0ZVBhY2thZ2UocGFjay5uYW1lLCB0cnVlKSBmb3IgcGFjayBpbiBAZ2V0TG9hZGVkUGFja2FnZXMoKVxuICAgICAgcmV0dXJuXG4gICAgQHVub2JzZXJ2ZURpc2FibGVkUGFja2FnZXMoKVxuICAgIEB1bm9ic2VydmVQYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWQoKVxuXG4gICMgRGVhY3RpdmF0ZSB0aGUgcGFja2FnZSB3aXRoIHRoZSBnaXZlbiBuYW1lXG4gIGRlYWN0aXZhdGVQYWNrYWdlOiAobmFtZSwgc3VwcHJlc3NTZXJpYWxpemF0aW9uKSAtPlxuICAgIHBhY2sgPSBAZ2V0TG9hZGVkUGFja2FnZShuYW1lKVxuICAgIEBzZXJpYWxpemVQYWNrYWdlKHBhY2spIGlmIG5vdCBzdXBwcmVzc1NlcmlhbGl6YXRpb24gYW5kIEBpc1BhY2thZ2VBY3RpdmUocGFjay5uYW1lKVxuICAgIHBhY2suZGVhY3RpdmF0ZSgpXG4gICAgZGVsZXRlIEBhY3RpdmVQYWNrYWdlc1twYWNrLm5hbWVdXG4gICAgZGVsZXRlIEBhY3RpdmF0aW5nUGFja2FnZXNbcGFjay5uYW1lXVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZWFjdGl2YXRlLXBhY2thZ2UnLCBwYWNrXG5cbiAgaGFuZGxlTWV0YWRhdGFFcnJvcjogKGVycm9yLCBwYWNrYWdlUGF0aCkgLT5cbiAgICBtZXRhZGF0YVBhdGggPSBwYXRoLmpvaW4ocGFja2FnZVBhdGgsICdwYWNrYWdlLmpzb24nKVxuICAgIGRldGFpbCA9IFwiI3tlcnJvci5tZXNzYWdlfSBpbiAje21ldGFkYXRhUGF0aH1cIlxuICAgIHN0YWNrID0gXCIje2Vycm9yLnN0YWNrfVxcbiAgYXQgI3ttZXRhZGF0YVBhdGh9OjE6MVwiXG4gICAgbWVzc2FnZSA9IFwiRmFpbGVkIHRvIGxvYWQgdGhlICN7cGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aCl9IHBhY2thZ2VcIlxuICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZEVycm9yKG1lc3NhZ2UsIHtzdGFjaywgZGV0YWlsLCBwYWNrYWdlTmFtZTogcGF0aC5iYXNlbmFtZShwYWNrYWdlUGF0aCksIGRpc21pc3NhYmxlOiB0cnVlfSlcblxuICB1bmluc3RhbGxEaXJlY3Rvcnk6IChkaXJlY3RvcnkpIC0+XG4gICAgc3ltbGlua1Byb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgLT5cbiAgICAgIGZzLmlzU3ltYm9saWNMaW5rIGRpcmVjdG9yeSwgKGlzU3ltTGluaykgLT4gcmVzb2x2ZShpc1N5bUxpbmspXG5cbiAgICBkaXJQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUpIC0+XG4gICAgICBmcy5pc0RpcmVjdG9yeSBkaXJlY3RvcnksIChpc0RpcikgLT4gcmVzb2x2ZShpc0RpcilcblxuICAgIFByb21pc2UuYWxsKFtzeW1saW5rUHJvbWlzZSwgZGlyUHJvbWlzZV0pLnRoZW4gKHZhbHVlcykgLT5cbiAgICAgIFtpc1N5bUxpbmssIGlzRGlyXSA9IHZhbHVlc1xuICAgICAgaWYgbm90IGlzU3ltTGluayBhbmQgaXNEaXJcbiAgICAgICAgZnMucmVtb3ZlIGRpcmVjdG9yeSwgLT5cblxuICByZWxvYWRBY3RpdmVQYWNrYWdlU3R5bGVTaGVldHM6IC0+XG4gICAgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVBhY2thZ2VzKCkgd2hlbiBwYWNrLmdldFR5cGUoKSBpc250ICd0aGVtZSdcbiAgICAgIHBhY2sucmVsb2FkU3R5bGVzaGVldHM/KClcbiAgICByZXR1cm5cblxuICBpc0J1bmRsZWRQYWNrYWdlUGF0aDogKHBhY2thZ2VQYXRoKSAtPlxuICAgIGlmIEBkZXZNb2RlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEByZXNvdXJjZVBhdGguc3RhcnRzV2l0aChcIiN7cHJvY2Vzcy5yZXNvdXJjZXNQYXRofSN7cGF0aC5zZXB9XCIpXG5cbiAgICBAcmVzb3VyY2VQYXRoV2l0aFRyYWlsaW5nU2xhc2ggPz0gXCIje0ByZXNvdXJjZVBhdGh9I3twYXRoLnNlcH1cIlxuICAgIHBhY2thZ2VQYXRoPy5zdGFydHNXaXRoKEByZXNvdXJjZVBhdGhXaXRoVHJhaWxpbmdTbGFzaClcblxuICBsb2FkUGFja2FnZU1ldGFkYXRhOiAocGFja2FnZVBhdGgsIGlnbm9yZUVycm9ycz1mYWxzZSkgLT5cbiAgICBwYWNrYWdlTmFtZSA9IHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpXG4gICAgaWYgQGlzQnVuZGxlZFBhY2thZ2VQYXRoKHBhY2thZ2VQYXRoKVxuICAgICAgbWV0YWRhdGEgPSBAcGFja2FnZXNDYWNoZVtwYWNrYWdlTmFtZV0/Lm1ldGFkYXRhXG4gICAgdW5sZXNzIG1ldGFkYXRhP1xuICAgICAgaWYgbWV0YWRhdGFQYXRoID0gQ1NPTi5yZXNvbHZlKHBhdGguam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UnKSlcbiAgICAgICAgdHJ5XG4gICAgICAgICAgbWV0YWRhdGEgPSBDU09OLnJlYWRGaWxlU3luYyhtZXRhZGF0YVBhdGgpXG4gICAgICAgICAgQG5vcm1hbGl6ZVBhY2thZ2VNZXRhZGF0YShtZXRhZGF0YSlcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICB0aHJvdyBlcnJvciB1bmxlc3MgaWdub3JlRXJyb3JzXG5cbiAgICBtZXRhZGF0YSA/PSB7fVxuICAgIHVubGVzcyB0eXBlb2YgbWV0YWRhdGEubmFtZSBpcyAnc3RyaW5nJyBhbmQgbWV0YWRhdGEubmFtZS5sZW5ndGggPiAwXG4gICAgICBtZXRhZGF0YS5uYW1lID0gcGFja2FnZU5hbWVcblxuICAgIGlmIG1ldGFkYXRhLnJlcG9zaXRvcnk/LnR5cGUgaXMgJ2dpdCcgYW5kIHR5cGVvZiBtZXRhZGF0YS5yZXBvc2l0b3J5LnVybCBpcyAnc3RyaW5nJ1xuICAgICAgbWV0YWRhdGEucmVwb3NpdG9yeS51cmwgPSBtZXRhZGF0YS5yZXBvc2l0b3J5LnVybC5yZXBsYWNlKC8oXmdpdFxcKyl8KFxcLmdpdCQpL2csICcnKVxuXG4gICAgbWV0YWRhdGFcblxuICBub3JtYWxpemVQYWNrYWdlTWV0YWRhdGE6IChtZXRhZGF0YSkgLT5cbiAgICB1bmxlc3MgbWV0YWRhdGE/Ll9pZFxuICAgICAgbm9ybWFsaXplUGFja2FnZURhdGEgPz0gcmVxdWlyZSAnbm9ybWFsaXplLXBhY2thZ2UtZGF0YSdcbiAgICAgIG5vcm1hbGl6ZVBhY2thZ2VEYXRhKG1ldGFkYXRhKVxuIl19
