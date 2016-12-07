(function() {
  var BufferedProcess, Client, CompositeDisposable, Emitter, PackageManager, _, createJsonParseError, createProcessError, handleProcessErrors, ref, semver;

  _ = require('underscore-plus');

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  semver = require('semver');

  Client = require('./atom-io-client');

  module.exports = PackageManager = (function() {
    PackageManager.prototype.CACHE_EXPIRY = 1000 * 60 * 10;

    function PackageManager() {
      this.packagePromises = [];
      this.availablePackageCache = null;
      this.apmCache = {
        loadOutdated: {
          value: null,
          expiry: 0
        }
      };
      this.emitter = new Emitter;
    }

    PackageManager.prototype.getClient = function() {
      return this.client != null ? this.client : this.client = new Client(this);
    };

    PackageManager.prototype.isPackageInstalled = function(packageName) {
      var packageNames;
      if (atom.packages.isPackageLoaded(packageName)) {
        return true;
      } else if (packageNames = this.getAvailablePackageNames()) {
        return packageNames.indexOf(packageName) > -1;
      } else {
        return false;
      }
    };

    PackageManager.prototype.packageHasSettings = function(packageName) {
      var grammar, grammars, i, len, pack, ref1, schema;
      grammars = (ref1 = atom.grammars.getGrammars()) != null ? ref1 : [];
      for (i = 0, len = grammars.length; i < len; i++) {
        grammar = grammars[i];
        if (grammar.path) {
          if (grammar.packageName === packageName) {
            return true;
          }
        }
      }
      pack = atom.packages.getLoadedPackage(packageName);
      if ((pack != null) && !atom.packages.isPackageActive(packageName)) {
        pack.activateConfig();
      }
      schema = atom.config.getSchema(packageName);
      return (schema != null) && (schema.type !== 'any');
    };

    PackageManager.prototype.runCommand = function(args, callback) {
      var command, errorLines, exit, outputLines, stderr, stdout;
      command = atom.packages.getApmPath();
      outputLines = [];
      stdout = function(lines) {
        return outputLines.push(lines);
      };
      errorLines = [];
      stderr = function(lines) {
        return errorLines.push(lines);
      };
      exit = function(code) {
        return callback(code, outputLines.join('\n'), errorLines.join('\n'));
      };
      args.push('--no-color');
      return new BufferedProcess({
        command: command,
        args: args,
        stdout: stdout,
        stderr: stderr,
        exit: exit
      });
    };

    PackageManager.prototype.loadInstalled = function(callback) {
      var apmProcess, args, errorMessage;
      args = ['ls', '--json'];
      errorMessage = 'Fetching local packages failed.';
      apmProcess = this.runCommand(args, (function(_this) {
        return function(code, stdout, stderr) {
          var error, packages, parseError, ref1;
          if (code === 0) {
            try {
              packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
            } catch (error1) {
              parseError = error1;
              error = createJsonParseError(errorMessage, parseError, stdout);
              return callback(error);
            }
            _this.cacheAvailablePackageNames(packages);
            return callback(null, packages);
          } else {
            error = new Error(errorMessage);
            error.stdout = stdout;
            error.stderr = stderr;
            return callback(error);
          }
        };
      })(this));
      return handleProcessErrors(apmProcess, errorMessage, callback);
    };

    PackageManager.prototype.loadFeatured = function(loadThemes, callback) {
      var apmProcess, args, errorMessage, version;
      if (!callback) {
        callback = loadThemes;
        loadThemes = false;
      }
      args = ['featured', '--json'];
      version = atom.getVersion();
      if (loadThemes) {
        args.push('--themes');
      }
      if (semver.valid(version)) {
        args.push('--compatible', version);
      }
      errorMessage = 'Fetching featured packages failed.';
      apmProcess = this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, parseError, ref1;
        if (code === 0) {
          try {
            packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
          } catch (error1) {
            parseError = error1;
            error = createJsonParseError(errorMessage, parseError, stdout);
            return callback(error);
          }
          return callback(null, packages);
        } else {
          error = new Error(errorMessage);
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
      return handleProcessErrors(apmProcess, errorMessage, callback);
    };

    PackageManager.prototype.loadOutdated = function(callback) {
      var apmProcess, args, errorMessage, version;
      if (this.apmCache.loadOutdated.value && this.apmCache.loadOutdated.expiry > Date.now()) {
        return callback(null, this.apmCache.loadOutdated.value);
      }
      args = ['outdated', '--json'];
      version = atom.getVersion();
      if (semver.valid(version)) {
        args.push('--compatible', version);
      }
      errorMessage = 'Fetching outdated packages and themes failed.';
      apmProcess = this.runCommand(args, (function(_this) {
        return function(code, stdout, stderr) {
          var error, packages, parseError, ref1;
          if (code === 0) {
            try {
              packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
            } catch (error1) {
              parseError = error1;
              error = createJsonParseError(errorMessage, parseError, stdout);
              return callback(error);
            }
            _this.apmCache.loadOutdated = {
              value: packages,
              expiry: Date.now() + _this.CACHE_EXPIRY
            };
            return callback(null, packages);
          } else {
            error = new Error(errorMessage);
            error.stdout = stdout;
            error.stderr = stderr;
            return callback(error);
          }
        };
      })(this));
      return handleProcessErrors(apmProcess, errorMessage, callback);
    };

    PackageManager.prototype.clearOutdatedCache = function() {
      return this.apmCache.loadOutdated = {
        value: null,
        expiry: 0
      };
    };

    PackageManager.prototype.loadPackage = function(packageName, callback) {
      var apmProcess, args, errorMessage;
      args = ['view', packageName, '--json'];
      errorMessage = "Fetching package '" + packageName + "' failed.";
      apmProcess = this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, parseError, ref1;
        if (code === 0) {
          try {
            packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
          } catch (error1) {
            parseError = error1;
            error = createJsonParseError(errorMessage, parseError, stdout);
            return callback(error);
          }
          return callback(null, packages);
        } else {
          error = new Error(errorMessage);
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
      return handleProcessErrors(apmProcess, errorMessage, callback);
    };

    PackageManager.prototype.loadCompatiblePackageVersion = function(packageName, callback) {
      var apmProcess, args, errorMessage;
      args = ['view', packageName, '--json', '--compatible', this.normalizeVersion(atom.getVersion())];
      errorMessage = "Fetching package '" + packageName + "' failed.";
      apmProcess = this.runCommand(args, function(code, stdout, stderr) {
        var error, packages, parseError, ref1;
        if (code === 0) {
          try {
            packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
          } catch (error1) {
            parseError = error1;
            error = createJsonParseError(errorMessage, parseError, stdout);
            return callback(error);
          }
          return callback(null, packages);
        } else {
          error = new Error(errorMessage);
          error.stdout = stdout;
          error.stderr = stderr;
          return callback(error);
        }
      });
      return handleProcessErrors(apmProcess, errorMessage, callback);
    };

    PackageManager.prototype.getInstalled = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.loadInstalled(function(error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
        };
      })(this));
    };

    PackageManager.prototype.getFeatured = function(loadThemes) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.loadFeatured(!!loadThemes, function(error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
        };
      })(this));
    };

    PackageManager.prototype.getOutdated = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.loadOutdated(function(error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
        };
      })(this));
    };

    PackageManager.prototype.getPackage = function(packageName) {
      var base;
      return (base = this.packagePromises)[packageName] != null ? base[packageName] : base[packageName] = new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.loadPackage(packageName, function(error, result) {
            if (error) {
              return reject(error);
            } else {
              return resolve(result);
            }
          });
        };
      })(this));
    };

    PackageManager.prototype.satisfiesVersion = function(version, metadata) {
      var engine, ref1, ref2;
      engine = (ref1 = (ref2 = metadata.engines) != null ? ref2.atom : void 0) != null ? ref1 : '*';
      if (!semver.validRange(engine)) {
        return false;
      }
      return semver.satisfies(version, engine);
    };

    PackageManager.prototype.normalizeVersion = function(version) {
      if (typeof version === 'string') {
        version = version.split('-')[0];
      }
      return version;
    };

    PackageManager.prototype.search = function(query, options) {
      if (options == null) {
        options = {};
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var apmProcess, args, errorMessage;
          args = ['search', query, '--json'];
          if (options.themes) {
            args.push('--themes');
          } else if (options.packages) {
            args.push('--packages');
          }
          errorMessage = "Searching for \u201C" + query + "\u201D failed.";
          apmProcess = _this.runCommand(args, function(code, stdout, stderr) {
            var error, packages, parseError, ref1;
            if (code === 0) {
              try {
                packages = (ref1 = JSON.parse(stdout)) != null ? ref1 : [];
                if (options.sortBy) {
                  packages = _.sortBy(packages, function(pkg) {
                    return pkg[options.sortBy] * -1;
                  });
                }
                return resolve(packages);
              } catch (error1) {
                parseError = error1;
                error = createJsonParseError(errorMessage, parseError, stdout);
                return reject(error);
              }
            } else {
              error = new Error(errorMessage);
              error.stdout = stdout;
              error.stderr = stderr;
              return reject(error);
            }
          });
          return handleProcessErrors(apmProcess, errorMessage, function(error) {
            return reject(error);
          });
        };
      })(this));
    };

    PackageManager.prototype.update = function(pack, newVersion, callback) {
      var apmInstallSource, apmProcess, args, errorMessage, exit, name, onError, theme;
      name = pack.name, theme = pack.theme, apmInstallSource = pack.apmInstallSource;
      errorMessage = newVersion ? "Updating to \u201C" + name + "@" + newVersion + "\u201D failed." : "Updating to latest sha failed.";
      onError = (function(_this) {
        return function(error) {
          error.packageInstallError = !theme;
          _this.emitPackageEvent('update-failed', pack, error);
          return typeof callback === "function" ? callback(error) : void 0;
        };
      })(this);
      if ((apmInstallSource != null ? apmInstallSource.type : void 0) === 'git') {
        args = ['install', apmInstallSource.source];
      } else {
        args = ['install', name + "@" + newVersion];
      }
      exit = (function(_this) {
        return function(code, stdout, stderr) {
          var error;
          if (code === 0) {
            _this.clearOutdatedCache();
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('updated', pack);
          } else {
            error = new Error(errorMessage);
            error.stdout = stdout;
            error.stderr = stderr;
            return onError(error);
          }
        };
      })(this);
      this.emitter.emit('package-updating', {
        pack: pack
      });
      apmProcess = this.runCommand(args, exit);
      return handleProcessErrors(apmProcess, errorMessage, onError);
    };

    PackageManager.prototype.unload = function(name) {
      if (atom.packages.isPackageLoaded(name)) {
        if (atom.packages.isPackageActive(name)) {
          atom.packages.deactivatePackage(name);
        }
        return atom.packages.unloadPackage(name);
      }
    };

    PackageManager.prototype.install = function(pack, callback) {
      var activateOnFailure, activateOnSuccess, apmProcess, args, errorMessage, exit, name, nameWithVersion, onError, theme, version;
      name = pack.name, version = pack.version, theme = pack.theme;
      activateOnSuccess = !theme && !atom.packages.isPackageDisabled(name);
      activateOnFailure = atom.packages.isPackageActive(name);
      nameWithVersion = version != null ? name + "@" + version : name;
      this.unload(name);
      args = ['install', nameWithVersion, '--json'];
      errorMessage = "Installing \u201C" + nameWithVersion + "\u201D failed.";
      onError = (function(_this) {
        return function(error) {
          error.packageInstallError = !theme;
          _this.emitPackageEvent('install-failed', pack, error);
          return typeof callback === "function" ? callback(error) : void 0;
        };
      })(this);
      exit = (function(_this) {
        return function(code, stdout, stderr) {
          var err, error, packageInfo;
          if (code === 0) {
            try {
              packageInfo = JSON.parse(stdout)[0];
              pack = _.extend({}, pack, packageInfo.metadata);
              name = pack.name;
            } catch (error1) {
              err = error1;
            }
            _this.clearOutdatedCache();
            if (activateOnSuccess) {
              atom.packages.activatePackage(name);
            } else {
              atom.packages.loadPackage(name);
            }
            _this.addPackageToAvailablePackageNames(name);
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('installed', pack);
          } else {
            if (activateOnFailure) {
              atom.packages.activatePackage(name);
            }
            error = new Error(errorMessage);
            error.stdout = stdout;
            error.stderr = stderr;
            return onError(error);
          }
        };
      })(this);
      this.emitPackageEvent('installing', pack);
      apmProcess = this.runCommand(args, exit);
      return handleProcessErrors(apmProcess, errorMessage, onError);
    };

    PackageManager.prototype.uninstall = function(pack, callback) {
      var apmProcess, errorMessage, name, onError;
      name = pack.name;
      if (atom.packages.isPackageActive(name)) {
        atom.packages.deactivatePackage(name);
      }
      errorMessage = "Uninstalling \u201C" + name + "\u201D failed.";
      onError = (function(_this) {
        return function(error) {
          _this.emitPackageEvent('uninstall-failed', pack, error);
          return typeof callback === "function" ? callback(error) : void 0;
        };
      })(this);
      this.emitPackageEvent('uninstalling', pack);
      apmProcess = this.runCommand(['uninstall', '--hard', name], (function(_this) {
        return function(code, stdout, stderr) {
          var error;
          if (code === 0) {
            _this.clearOutdatedCache();
            _this.unload(name);
            _this.removePackageFromAvailablePackageNames(name);
            _this.removePackageNameFromDisabledPackages(name);
            if (typeof callback === "function") {
              callback();
            }
            return _this.emitPackageEvent('uninstalled', pack);
          } else {
            error = new Error(errorMessage);
            error.stdout = stdout;
            error.stderr = stderr;
            return onError(error);
          }
        };
      })(this));
      return handleProcessErrors(apmProcess, errorMessage, onError);
    };

    PackageManager.prototype.installAlternative = function(pack, alternativePackageName, callback) {
      var eventArg, installPromise, uninstallPromise;
      eventArg = {
        pack: pack,
        alternative: alternativePackageName
      };
      this.emitter.emit('package-installing-alternative', eventArg);
      uninstallPromise = new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.uninstall(pack, function(error) {
            if (error) {
              return reject(error);
            } else {
              return resolve();
            }
          });
        };
      })(this));
      installPromise = new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.install({
            name: alternativePackageName
          }, function(error) {
            if (error) {
              return reject(error);
            } else {
              return resolve();
            }
          });
        };
      })(this));
      return Promise.all([uninstallPromise, installPromise]).then((function(_this) {
        return function() {
          callback(null, eventArg);
          return _this.emitter.emit('package-installed-alternative', eventArg);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          console.error(error.message, error.stack);
          callback(error, eventArg);
          eventArg.error = error;
          return _this.emitter.emit('package-install-alternative-failed', eventArg);
        };
      })(this));
    };

    PackageManager.prototype.canUpgrade = function(installedPackage, availableVersion) {
      var installedVersion;
      if (installedPackage == null) {
        return false;
      }
      installedVersion = installedPackage.metadata.version;
      if (!semver.valid(installedVersion)) {
        return false;
      }
      if (!semver.valid(availableVersion)) {
        return false;
      }
      return semver.gt(availableVersion, installedVersion);
    };

    PackageManager.prototype.getPackageTitle = function(arg) {
      var name;
      name = arg.name;
      return _.undasherize(_.uncamelcase(name));
    };

    PackageManager.prototype.getRepositoryUrl = function(arg) {
      var metadata, ref1, ref2, repoName, repoUrl, repository;
      metadata = arg.metadata;
      repository = metadata.repository;
      repoUrl = (ref1 = (ref2 = repository != null ? repository.url : void 0) != null ? ref2 : repository) != null ? ref1 : '';
      if (repoUrl.match('git@github')) {
        repoName = repoUrl.split(':')[1];
        repoUrl = "https://github.com/" + repoName;
      }
      return repoUrl.replace(/\.git$/, '').replace(/\/+$/, '').replace(/^git\+/, '');
    };

    PackageManager.prototype.checkNativeBuildTools = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var apmProcess;
          apmProcess = _this.runCommand(['install', '--check'], function(code, stdout, stderr) {
            if (code === 0) {
              return resolve();
            } else {
              return reject(new Error());
            }
          });
          return apmProcess.onWillThrowError(function(arg) {
            var error, handle;
            error = arg.error, handle = arg.handle;
            handle();
            return reject(error);
          });
        };
      })(this));
    };

    PackageManager.prototype.removePackageNameFromDisabledPackages = function(packageName) {
      return atom.config.removeAtKeyPath('core.disabledPackages', packageName);
    };

    PackageManager.prototype.cacheAvailablePackageNames = function(packages) {
      var i, len, pack, packageNames, packageType, ref1, ref2;
      this.availablePackageCache = [];
      ref1 = ['core', 'user', 'dev', 'git'];
      for (i = 0, len = ref1.length; i < len; i++) {
        packageType = ref1[i];
        if (packages[packageType] == null) {
          continue;
        }
        packageNames = (function() {
          var j, len1, ref2, results;
          ref2 = packages[packageType];
          results = [];
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            pack = ref2[j];
            results.push(pack.name);
          }
          return results;
        })();
        (ref2 = this.availablePackageCache).push.apply(ref2, packageNames);
      }
      return this.availablePackageCache;
    };

    PackageManager.prototype.addPackageToAvailablePackageNames = function(packageName) {
      if (this.availablePackageCache == null) {
        this.availablePackageCache = [];
      }
      if (this.availablePackageCache.indexOf(packageName) < 0) {
        this.availablePackageCache.push(packageName);
      }
      return this.availablePackageCache;
    };

    PackageManager.prototype.removePackageFromAvailablePackageNames = function(packageName) {
      var index;
      if (this.availablePackageCache == null) {
        this.availablePackageCache = [];
      }
      index = this.availablePackageCache.indexOf(packageName);
      if (index > -1) {
        this.availablePackageCache.splice(index, 1);
      }
      return this.availablePackageCache;
    };

    PackageManager.prototype.getAvailablePackageNames = function() {
      return this.availablePackageCache;
    };

    PackageManager.prototype.emitPackageEvent = function(eventName, pack, error) {
      var ref1, ref2, theme;
      theme = (ref1 = pack.theme) != null ? ref1 : (ref2 = pack.metadata) != null ? ref2.theme : void 0;
      eventName = theme ? "theme-" + eventName : "package-" + eventName;
      return this.emitter.emit(eventName, {
        pack: pack,
        error: error
      });
    };

    PackageManager.prototype.on = function(selectors, callback) {
      var i, len, ref1, selector, subscriptions;
      subscriptions = new CompositeDisposable;
      ref1 = selectors.split(" ");
      for (i = 0, len = ref1.length; i < len; i++) {
        selector = ref1[i];
        subscriptions.add(this.emitter.on(selector, callback));
      }
      return subscriptions;
    };

    return PackageManager;

  })();

  createJsonParseError = function(message, parseError, stdout) {
    var error;
    error = new Error(message);
    error.stdout = '';
    error.stderr = parseError.message + ": " + stdout;
    return error;
  };

  createProcessError = function(message, processError) {
    var error;
    error = new Error(message);
    error.stdout = '';
    error.stderr = processError.message;
    return error;
  };

  handleProcessErrors = function(apmProcess, message, callback) {
    return apmProcess.onWillThrowError(function(arg) {
      var error, handle;
      error = arg.error, handle = arg.handle;
      handle();
      return callback(createProcessError(message, error));
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQWtELE9BQUEsQ0FBUSxNQUFSLENBQWxELEVBQUMscUNBQUQsRUFBa0IsNkNBQWxCLEVBQXVDOztFQUN2QyxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBRVQsTUFBQSxHQUFTLE9BQUEsQ0FBUSxrQkFBUjs7RUFFVCxNQUFNLENBQUMsT0FBUCxHQUNNOzZCQUVKLFlBQUEsR0FBYyxJQUFBLEdBQUssRUFBTCxHQUFROztJQUVULHdCQUFBO01BQ1gsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLHFCQUFELEdBQXlCO01BQ3pCLElBQUMsQ0FBQSxRQUFELEdBQ0U7UUFBQSxZQUFBLEVBQ0U7VUFBQSxLQUFBLEVBQU8sSUFBUDtVQUNBLE1BQUEsRUFBUSxDQURSO1NBREY7O01BSUYsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO0lBUko7OzZCQVViLFNBQUEsR0FBVyxTQUFBO21DQUNULElBQUMsQ0FBQSxTQUFELElBQUMsQ0FBQSxTQUFjLElBQUEsTUFBQSxDQUFPLElBQVA7SUFETjs7NkJBR1gsa0JBQUEsR0FBb0IsU0FBQyxXQUFEO0FBQ2xCLFVBQUE7TUFBQSxJQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixXQUE5QixDQUFIO2VBQ0UsS0FERjtPQUFBLE1BRUssSUFBRyxZQUFBLEdBQWUsSUFBQyxDQUFBLHdCQUFELENBQUEsQ0FBbEI7ZUFDSCxZQUFZLENBQUMsT0FBYixDQUFxQixXQUFyQixDQUFBLEdBQW9DLENBQUMs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LFFBQVo7QUFDRixVQUFBO01BQUEsYUFBQSxHQUFnQixJQUFJO0FBQ3BCO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxhQUFhLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxRQUFaLEVBQXNCLFFBQXRCLENBQWxCO0FBREY7YUFFQTtJQUpFOzs7Ozs7RUFNTixvQkFBQSxHQUF1QixTQUFDLE9BQUQsRUFBVSxVQUFWLEVBQXNCLE1BQXRCO0FBQ3JCLFFBQUE7SUFBQSxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sT0FBTjtJQUNaLEtBQUssQ0FBQyxNQUFOLEdBQWU7SUFDZixLQUFLLENBQUMsTUFBTixHQUFrQixVQUFVLENBQUMsT0FBWixHQUFvQixJQUFwQixHQUF3QjtXQUN6QztFQUpxQjs7RUFNdkIsa0JBQUEsR0FBcUIsU0FBQyxPQUFELEVBQVUsWUFBVjtBQUNuQixRQUFBO0lBQUEsS0FBQSxHQUFZLElBQUEsS0FBQSxDQUFNLE9BQU47SUFDWixLQUFLLENBQUMsTUFBTixHQUFlO0lBQ2YsS0FBSyxDQUFDLE1BQU4sR0FBZSxZQUFZLENBQUM7V0FDNUI7RUFKbUI7O0VBTXJCLG1CQUFBLEdBQXNCLFNBQUMsVUFBRCxFQUFhLE9BQWIsRUFBc0IsUUFBdEI7V0FDcEIsVUFBVSxDQUFDLGdCQUFYLENBQTRCLFNBQUMsR0FBRDtBQUMxQixVQUFBO01BRDRCLG1CQUFPO01BQ25DLE1BQUEsQ0FBQTthQUNBLFFBQUEsQ0FBUyxrQkFBQSxDQUFtQixPQUFuQixFQUE0QixLQUE1QixDQUFUO0lBRjBCLENBQTVCO0VBRG9CO0FBdGR0QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57QnVmZmVyZWRQcm9jZXNzLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5zZW12ZXIgPSByZXF1aXJlICdzZW12ZXInXG5cbkNsaWVudCA9IHJlcXVpcmUgJy4vYXRvbS1pby1jbGllbnQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VNYW5hZ2VyXG4gICMgTWlsbGlzZWNvbmQgZXhwaXJ5IGZvciBjYWNoZWQgbG9hZE91dGRhdGVkLCBldGMuIHZhbHVlc1xuICBDQUNIRV9FWFBJUlk6IDEwMDAqNjAqMTBcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcGFja2FnZVByb21pc2VzID0gW11cbiAgICBAYXZhaWxhYmxlUGFja2FnZUNhY2hlID0gbnVsbFxuICAgIEBhcG1DYWNoZSA9XG4gICAgICBsb2FkT3V0ZGF0ZWQ6XG4gICAgICAgIHZhbHVlOiBudWxsXG4gICAgICAgIGV4cGlyeTogMFxuXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gIGdldENsaWVudDogLT5cbiAgICBAY2xpZW50ID89IG5ldyBDbGllbnQodGhpcylcblxuICBpc1BhY2thZ2VJbnN0YWxsZWQ6IChwYWNrYWdlTmFtZSkgLT5cbiAgICBpZiBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUxvYWRlZChwYWNrYWdlTmFtZSlcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIHBhY2thZ2VOYW1lcyA9IEBnZXRBdmFpbGFibGVQYWNrYWdlTmFtZXMoKVxuICAgICAgcGFja2FnZU5hbWVzLmluZGV4T2YocGFja2FnZU5hbWUpID4gLTFcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIHBhY2thZ2VIYXNTZXR0aW5nczogKHBhY2thZ2VOYW1lKSAtPlxuICAgIGdyYW1tYXJzID0gYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpID8gW11cbiAgICBmb3IgZ3JhbW1hciBpbiBncmFtbWFycyB3aGVuIGdyYW1tYXIucGF0aFxuICAgICAgcmV0dXJuIHRydWUgaWYgZ3JhbW1hci5wYWNrYWdlTmFtZSBpcyBwYWNrYWdlTmFtZVxuXG4gICAgcGFjayA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShwYWNrYWdlTmFtZSlcbiAgICBwYWNrLmFjdGl2YXRlQ29uZmlnKCkgaWYgcGFjaz8gYW5kIG5vdCBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShwYWNrYWdlTmFtZSlcbiAgICBzY2hlbWEgPSBhdG9tLmNvbmZpZy5nZXRTY2hlbWEocGFja2FnZU5hbWUpXG4gICAgc2NoZW1hPyBhbmQgKHNjaGVtYS50eXBlIGlzbnQgJ2FueScpXG5cbiAgcnVuQ29tbWFuZDogKGFyZ3MsIGNhbGxiYWNrKSAtPlxuICAgIGNvbW1hbmQgPSBhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKVxuICAgIG91dHB1dExpbmVzID0gW11cbiAgICBzdGRvdXQgPSAobGluZXMpIC0+IG91dHB1dExpbmVzLnB1c2gobGluZXMpXG4gICAgZXJyb3JMaW5lcyA9IFtdXG4gICAgc3RkZXJyID0gKGxpbmVzKSAtPiBlcnJvckxpbmVzLnB1c2gobGluZXMpXG4gICAgZXhpdCA9IChjb2RlKSAtPlxuICAgICAgY2FsbGJhY2soY29kZSwgb3V0cHV0TGluZXMuam9pbignXFxuJyksIGVycm9yTGluZXMuam9pbignXFxuJykpXG5cbiAgICBhcmdzLnB1c2goJy0tbm8tY29sb3InKVxuICAgIG5ldyBCdWZmZXJlZFByb2Nlc3Moe2NvbW1hbmQsIGFyZ3MsIHN0ZG91dCwgc3RkZXJyLCBleGl0fSlcblxuICBsb2FkSW5zdGFsbGVkOiAoY2FsbGJhY2spIC0+XG4gICAgYXJncyA9IFsnbHMnLCAnLS1qc29uJ11cbiAgICBlcnJvck1lc3NhZ2UgPSAnRmV0Y2hpbmcgbG9jYWwgcGFja2FnZXMgZmFpbGVkLidcbiAgICBhcG1Qcm9jZXNzID0gQHJ1bkNvbW1hbmQgYXJncywgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VzID0gSlNPTi5wYXJzZShzdGRvdXQpID8gW11cbiAgICAgICAgY2F0Y2ggcGFyc2VFcnJvclxuICAgICAgICAgIGVycm9yID0gY3JlYXRlSnNvblBhcnNlRXJyb3IoZXJyb3JNZXNzYWdlLCBwYXJzZUVycm9yLCBzdGRvdXQpXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKVxuICAgICAgICBAY2FjaGVBdmFpbGFibGVQYWNrYWdlTmFtZXMocGFja2FnZXMpXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHBhY2thZ2VzKVxuICAgICAgZWxzZVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpXG5cbiAgICBoYW5kbGVQcm9jZXNzRXJyb3JzKGFwbVByb2Nlc3MsIGVycm9yTWVzc2FnZSwgY2FsbGJhY2spXG5cbiAgbG9hZEZlYXR1cmVkOiAobG9hZFRoZW1lcywgY2FsbGJhY2spIC0+XG4gICAgdW5sZXNzIGNhbGxiYWNrXG4gICAgICBjYWxsYmFjayA9IGxvYWRUaGVtZXNcbiAgICAgIGxvYWRUaGVtZXMgPSBmYWxzZVxuXG4gICAgYXJncyA9IFsnZmVhdHVyZWQnLCAnLS1qc29uJ11cbiAgICB2ZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKClcbiAgICBhcmdzLnB1c2goJy0tdGhlbWVzJykgaWYgbG9hZFRoZW1lc1xuICAgIGFyZ3MucHVzaCgnLS1jb21wYXRpYmxlJywgdmVyc2lvbikgaWYgc2VtdmVyLnZhbGlkKHZlcnNpb24pXG4gICAgZXJyb3JNZXNzYWdlID0gJ0ZldGNoaW5nIGZlYXR1cmVkIHBhY2thZ2VzIGZhaWxlZC4nXG5cbiAgICBhcG1Qcm9jZXNzID0gQHJ1bkNvbW1hbmQgYXJncywgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VzID0gSlNPTi5wYXJzZShzdGRvdXQpID8gW11cbiAgICAgICAgY2F0Y2ggcGFyc2VFcnJvclxuICAgICAgICAgIGVycm9yID0gY3JlYXRlSnNvblBhcnNlRXJyb3IoZXJyb3JNZXNzYWdlLCBwYXJzZUVycm9yLCBzdGRvdXQpXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKVxuXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHBhY2thZ2VzKVxuICAgICAgZWxzZVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpXG5cbiAgICBoYW5kbGVQcm9jZXNzRXJyb3JzKGFwbVByb2Nlc3MsIGVycm9yTWVzc2FnZSwgY2FsbGJhY2spXG5cbiAgbG9hZE91dGRhdGVkOiAoY2FsbGJhY2spIC0+XG4gICAgIyBTaG9ydCBjaXJjdWl0IGlmIHdlIGhhdmUgY2FjaGVkIGRhdGEuXG4gICAgaWYgQGFwbUNhY2hlLmxvYWRPdXRkYXRlZC52YWx1ZSBhbmQgQGFwbUNhY2hlLmxvYWRPdXRkYXRlZC5leHBpcnkgPiBEYXRlLm5vdygpXG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgQGFwbUNhY2hlLmxvYWRPdXRkYXRlZC52YWx1ZSlcblxuICAgIGFyZ3MgPSBbJ291dGRhdGVkJywgJy0tanNvbiddXG4gICAgdmVyc2lvbiA9IGF0b20uZ2V0VmVyc2lvbigpXG4gICAgYXJncy5wdXNoKCctLWNvbXBhdGlibGUnLCB2ZXJzaW9uKSBpZiBzZW12ZXIudmFsaWQodmVyc2lvbilcbiAgICBlcnJvck1lc3NhZ2UgPSAnRmV0Y2hpbmcgb3V0ZGF0ZWQgcGFja2FnZXMgYW5kIHRoZW1lcyBmYWlsZWQuJ1xuXG4gICAgYXBtUHJvY2VzcyA9IEBydW5Db21tYW5kIGFyZ3MsIChjb2RlLCBzdGRvdXQsIHN0ZGVycikgPT5cbiAgICAgIGlmIGNvZGUgaXMgMFxuICAgICAgICB0cnlcbiAgICAgICAgICBwYWNrYWdlcyA9IEpTT04ucGFyc2Uoc3Rkb3V0KSA/IFtdXG4gICAgICAgIGNhdGNoIHBhcnNlRXJyb3JcbiAgICAgICAgICBlcnJvciA9IGNyZWF0ZUpzb25QYXJzZUVycm9yKGVycm9yTWVzc2FnZSwgcGFyc2VFcnJvciwgc3Rkb3V0KVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcilcblxuICAgICAgICBAYXBtQ2FjaGUubG9hZE91dGRhdGVkID1cbiAgICAgICAgICB2YWx1ZTogcGFja2FnZXNcbiAgICAgICAgICBleHBpcnk6IERhdGUubm93KCkgKyBAQ0FDSEVfRVhQSVJZXG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcGFja2FnZXMpXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yTWVzc2FnZSlcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBjYWxsYmFjayhlcnJvcilcblxuICAgIGhhbmRsZVByb2Nlc3NFcnJvcnMoYXBtUHJvY2VzcywgZXJyb3JNZXNzYWdlLCBjYWxsYmFjaylcblxuICBjbGVhck91dGRhdGVkQ2FjaGU6IC0+XG4gICAgQGFwbUNhY2hlLmxvYWRPdXRkYXRlZCA9XG4gICAgICB2YWx1ZTogbnVsbFxuICAgICAgZXhwaXJ5OiAwXG5cbiAgbG9hZFBhY2thZ2U6IChwYWNrYWdlTmFtZSwgY2FsbGJhY2spIC0+XG4gICAgYXJncyA9IFsndmlldycsIHBhY2thZ2VOYW1lLCAnLS1qc29uJ11cbiAgICBlcnJvck1lc3NhZ2UgPSBcIkZldGNoaW5nIHBhY2thZ2UgJyN7cGFja2FnZU5hbWV9JyBmYWlsZWQuXCJcblxuICAgIGFwbVByb2Nlc3MgPSBAcnVuQ29tbWFuZCBhcmdzLCAoY29kZSwgc3Rkb3V0LCBzdGRlcnIpIC0+XG4gICAgICBpZiBjb2RlIGlzIDBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgcGFja2FnZXMgPSBKU09OLnBhcnNlKHN0ZG91dCkgPyBbXVxuICAgICAgICBjYXRjaCBwYXJzZUVycm9yXG4gICAgICAgICAgZXJyb3IgPSBjcmVhdGVKc29uUGFyc2VFcnJvcihlcnJvck1lc3NhZ2UsIHBhcnNlRXJyb3IsIHN0ZG91dClcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpXG5cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcGFja2FnZXMpXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yTWVzc2FnZSlcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBjYWxsYmFjayhlcnJvcilcblxuICAgIGhhbmRsZVByb2Nlc3NFcnJvcnMoYXBtUHJvY2VzcywgZXJyb3JNZXNzYWdlLCBjYWxsYmFjaylcblxuICBsb2FkQ29tcGF0aWJsZVBhY2thZ2VWZXJzaW9uOiAocGFja2FnZU5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIGFyZ3MgPSBbJ3ZpZXcnLCBwYWNrYWdlTmFtZSwgJy0tanNvbicsICctLWNvbXBhdGlibGUnLCBAbm9ybWFsaXplVmVyc2lvbihhdG9tLmdldFZlcnNpb24oKSldXG4gICAgZXJyb3JNZXNzYWdlID0gXCJGZXRjaGluZyBwYWNrYWdlICcje3BhY2thZ2VOYW1lfScgZmFpbGVkLlwiXG5cbiAgICBhcG1Qcm9jZXNzID0gQHJ1bkNvbW1hbmQgYXJncywgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VzID0gSlNPTi5wYXJzZShzdGRvdXQpID8gW11cbiAgICAgICAgY2F0Y2ggcGFyc2VFcnJvclxuICAgICAgICAgIGVycm9yID0gY3JlYXRlSnNvblBhcnNlRXJyb3IoZXJyb3JNZXNzYWdlLCBwYXJzZUVycm9yLCBzdGRvdXQpXG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKVxuXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHBhY2thZ2VzKVxuICAgICAgZWxzZVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpXG5cbiAgICBoYW5kbGVQcm9jZXNzRXJyb3JzKGFwbVByb2Nlc3MsIGVycm9yTWVzc2FnZSwgY2FsbGJhY2spXG5cbiAgZ2V0SW5zdGFsbGVkOiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICBAbG9hZEluc3RhbGxlZCAoZXJyb3IsIHJlc3VsdCkgLT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdClcblxuICBnZXRGZWF0dXJlZDogKGxvYWRUaGVtZXMpIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIEBsb2FkRmVhdHVyZWQgISFsb2FkVGhlbWVzLCAoZXJyb3IsIHJlc3VsdCkgLT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdClcblxuICBnZXRPdXRkYXRlZDogLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgQGxvYWRPdXRkYXRlZCAoZXJyb3IsIHJlc3VsdCkgLT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdClcblxuICBnZXRQYWNrYWdlOiAocGFja2FnZU5hbWUpIC0+XG4gICAgQHBhY2thZ2VQcm9taXNlc1twYWNrYWdlTmFtZV0gPz0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIEBsb2FkUGFja2FnZSBwYWNrYWdlTmFtZSwgKGVycm9yLCByZXN1bHQpIC0+XG4gICAgICAgIGlmIGVycm9yXG4gICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVzb2x2ZShyZXN1bHQpXG5cbiAgc2F0aXNmaWVzVmVyc2lvbjogKHZlcnNpb24sIG1ldGFkYXRhKSAtPlxuICAgIGVuZ2luZSA9IG1ldGFkYXRhLmVuZ2luZXM/LmF0b20gPyAnKidcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHNlbXZlci52YWxpZFJhbmdlKGVuZ2luZSlcbiAgICByZXR1cm4gc2VtdmVyLnNhdGlzZmllcyh2ZXJzaW9uLCBlbmdpbmUpXG5cbiAgbm9ybWFsaXplVmVyc2lvbjogKHZlcnNpb24pIC0+XG4gICAgW3ZlcnNpb25dID0gdmVyc2lvbi5zcGxpdCgnLScpIGlmIHR5cGVvZiB2ZXJzaW9uIGlzICdzdHJpbmcnXG4gICAgdmVyc2lvblxuXG4gIHNlYXJjaDogKHF1ZXJ5LCBvcHRpb25zID0ge30pIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIGFyZ3MgPSBbJ3NlYXJjaCcsIHF1ZXJ5LCAnLS1qc29uJ11cbiAgICAgIGlmIG9wdGlvbnMudGhlbWVzXG4gICAgICAgIGFyZ3MucHVzaCAnLS10aGVtZXMnXG4gICAgICBlbHNlIGlmIG9wdGlvbnMucGFja2FnZXNcbiAgICAgICAgYXJncy5wdXNoICctLXBhY2thZ2VzJ1xuICAgICAgZXJyb3JNZXNzYWdlID0gXCJTZWFyY2hpbmcgZm9yIFxcdTIwMUMje3F1ZXJ5fVxcdTIwMUQgZmFpbGVkLlwiXG5cbiAgICAgIGFwbVByb2Nlc3MgPSBAcnVuQ29tbWFuZCBhcmdzLCAoY29kZSwgc3Rkb3V0LCBzdGRlcnIpIC0+XG4gICAgICAgIGlmIGNvZGUgaXMgMFxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgcGFja2FnZXMgPSBKU09OLnBhcnNlKHN0ZG91dCkgPyBbXVxuICAgICAgICAgICAgaWYgb3B0aW9ucy5zb3J0QnlcbiAgICAgICAgICAgICAgcGFja2FnZXMgPSBfLnNvcnRCeSBwYWNrYWdlcywgKHBrZykgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gcGtnW29wdGlvbnMuc29ydEJ5XSotMVxuXG4gICAgICAgICAgICByZXNvbHZlKHBhY2thZ2VzKVxuICAgICAgICAgIGNhdGNoIHBhcnNlRXJyb3JcbiAgICAgICAgICAgIGVycm9yID0gY3JlYXRlSnNvblBhcnNlRXJyb3IoZXJyb3JNZXNzYWdlLCBwYXJzZUVycm9yLCBzdGRvdXQpXG4gICAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgICAgZXJyb3Iuc3RkZXJyID0gc3RkZXJyXG4gICAgICAgICAgcmVqZWN0KGVycm9yKVxuXG4gICAgICBoYW5kbGVQcm9jZXNzRXJyb3JzIGFwbVByb2Nlc3MsIGVycm9yTWVzc2FnZSwgKGVycm9yKSAtPlxuICAgICAgICByZWplY3QoZXJyb3IpXG5cbiAgdXBkYXRlOiAocGFjaywgbmV3VmVyc2lvbiwgY2FsbGJhY2spIC0+XG4gICAge25hbWUsIHRoZW1lLCBhcG1JbnN0YWxsU291cmNlfSA9IHBhY2tcblxuICAgIGVycm9yTWVzc2FnZSA9IGlmIG5ld1ZlcnNpb25cbiAgICAgIFwiVXBkYXRpbmcgdG8gXFx1MjAxQyN7bmFtZX1AI3tuZXdWZXJzaW9ufVxcdTIwMUQgZmFpbGVkLlwiXG4gICAgZWxzZVxuICAgICAgXCJVcGRhdGluZyB0byBsYXRlc3Qgc2hhIGZhaWxlZC5cIlxuICAgIG9uRXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBlcnJvci5wYWNrYWdlSW5zdGFsbEVycm9yID0gbm90IHRoZW1lXG4gICAgICBAZW1pdFBhY2thZ2VFdmVudCAndXBkYXRlLWZhaWxlZCcsIHBhY2ssIGVycm9yXG4gICAgICBjYWxsYmFjaz8oZXJyb3IpXG5cbiAgICBpZiBhcG1JbnN0YWxsU291cmNlPy50eXBlIGlzICdnaXQnXG4gICAgICBhcmdzID0gWydpbnN0YWxsJywgYXBtSW5zdGFsbFNvdXJjZS5zb3VyY2VdXG4gICAgZWxzZVxuICAgICAgYXJncyA9IFsnaW5zdGFsbCcsIFwiI3tuYW1lfUAje25ld1ZlcnNpb259XCJdXG5cbiAgICBleGl0ID0gKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIEBjbGVhck91dGRhdGVkQ2FjaGUoKVxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAndXBkYXRlZCcsIHBhY2tcbiAgICAgIGVsc2VcbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKVxuICAgICAgICBlcnJvci5zdGRvdXQgPSBzdGRvdXRcbiAgICAgICAgZXJyb3Iuc3RkZXJyID0gc3RkZXJyXG4gICAgICAgIG9uRXJyb3IoZXJyb3IpXG5cbiAgICBAZW1pdHRlci5lbWl0KCdwYWNrYWdlLXVwZGF0aW5nJywge3BhY2t9KVxuICAgIGFwbVByb2Nlc3MgPSBAcnVuQ29tbWFuZChhcmdzLCBleGl0KVxuICAgIGhhbmRsZVByb2Nlc3NFcnJvcnMoYXBtUHJvY2VzcywgZXJyb3JNZXNzYWdlLCBvbkVycm9yKVxuXG4gIHVubG9hZDogKG5hbWUpIC0+XG4gICAgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VMb2FkZWQobmFtZSlcbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UobmFtZSkgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUobmFtZSlcbiAgICAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZShuYW1lKVxuXG4gIGluc3RhbGw6IChwYWNrLCBjYWxsYmFjaykgLT5cbiAgICB7bmFtZSwgdmVyc2lvbiwgdGhlbWV9ID0gcGFja1xuICAgIGFjdGl2YXRlT25TdWNjZXNzID0gbm90IHRoZW1lIGFuZCBub3QgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VEaXNhYmxlZChuYW1lKVxuICAgIGFjdGl2YXRlT25GYWlsdXJlID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUobmFtZSlcbiAgICBuYW1lV2l0aFZlcnNpb24gPSBpZiB2ZXJzaW9uPyB0aGVuIFwiI3tuYW1lfUAje3ZlcnNpb259XCIgZWxzZSBuYW1lXG5cbiAgICBAdW5sb2FkKG5hbWUpXG4gICAgYXJncyA9IFsnaW5zdGFsbCcsIG5hbWVXaXRoVmVyc2lvbiwgJy0tanNvbiddXG5cbiAgICBlcnJvck1lc3NhZ2UgPSBcIkluc3RhbGxpbmcgXFx1MjAxQyN7bmFtZVdpdGhWZXJzaW9ufVxcdTIwMUQgZmFpbGVkLlwiXG4gICAgb25FcnJvciA9IChlcnJvcikgPT5cbiAgICAgIGVycm9yLnBhY2thZ2VJbnN0YWxsRXJyb3IgPSBub3QgdGhlbWVcbiAgICAgIEBlbWl0UGFja2FnZUV2ZW50ICdpbnN0YWxsLWZhaWxlZCcsIHBhY2ssIGVycm9yXG4gICAgICBjYWxsYmFjaz8oZXJyb3IpXG5cbiAgICBleGl0ID0gKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgICMgZ2V0IHJlYWwgcGFja2FnZSBuYW1lIGZyb20gcGFja2FnZS5qc29uXG4gICAgICAgIHRyeVxuICAgICAgICAgIHBhY2thZ2VJbmZvID0gSlNPTi5wYXJzZShzdGRvdXQpWzBdXG4gICAgICAgICAgcGFjayA9IF8uZXh0ZW5kKHt9LCBwYWNrLCBwYWNrYWdlSW5mby5tZXRhZGF0YSlcbiAgICAgICAgICBuYW1lID0gcGFjay5uYW1lXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICMgdXNpbmcgb2xkIGFwbSB3aXRob3V0IC0tanNvbiBzdXBwb3J0XG4gICAgICAgIEBjbGVhck91dGRhdGVkQ2FjaGUoKVxuICAgICAgICBpZiBhY3RpdmF0ZU9uU3VjY2Vzc1xuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKG5hbWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmxvYWRQYWNrYWdlKG5hbWUpXG5cbiAgICAgICAgQGFkZFBhY2thZ2VUb0F2YWlsYWJsZVBhY2thZ2VOYW1lcyhuYW1lKVxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAnaW5zdGFsbGVkJywgcGFja1xuICAgICAgZWxzZVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZShuYW1lKSBpZiBhY3RpdmF0ZU9uRmFpbHVyZVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICBlcnJvci5zdGRlcnIgPSBzdGRlcnJcbiAgICAgICAgb25FcnJvcihlcnJvcilcblxuICAgIEBlbWl0UGFja2FnZUV2ZW50KCdpbnN0YWxsaW5nJywgcGFjaylcbiAgICBhcG1Qcm9jZXNzID0gQHJ1bkNvbW1hbmQoYXJncywgZXhpdClcbiAgICBoYW5kbGVQcm9jZXNzRXJyb3JzKGFwbVByb2Nlc3MsIGVycm9yTWVzc2FnZSwgb25FcnJvcilcblxuICB1bmluc3RhbGw6IChwYWNrLCBjYWxsYmFjaykgLT5cbiAgICB7bmFtZX0gPSBwYWNrXG5cbiAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKG5hbWUpIGlmIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlQWN0aXZlKG5hbWUpXG5cbiAgICBlcnJvck1lc3NhZ2UgPSBcIlVuaW5zdGFsbGluZyBcXHUyMDFDI3tuYW1lfVxcdTIwMUQgZmFpbGVkLlwiXG4gICAgb25FcnJvciA9IChlcnJvcikgPT5cbiAgICAgIEBlbWl0UGFja2FnZUV2ZW50ICd1bmluc3RhbGwtZmFpbGVkJywgcGFjaywgZXJyb3JcbiAgICAgIGNhbGxiYWNrPyhlcnJvcilcblxuICAgIEBlbWl0UGFja2FnZUV2ZW50KCd1bmluc3RhbGxpbmcnLCBwYWNrKVxuICAgIGFwbVByb2Nlc3MgPSBAcnVuQ29tbWFuZCBbJ3VuaW5zdGFsbCcsICctLWhhcmQnLCBuYW1lXSwgKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSA9PlxuICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgIEBjbGVhck91dGRhdGVkQ2FjaGUoKVxuICAgICAgICBAdW5sb2FkKG5hbWUpXG4gICAgICAgIEByZW1vdmVQYWNrYWdlRnJvbUF2YWlsYWJsZVBhY2thZ2VOYW1lcyhuYW1lKVxuICAgICAgICBAcmVtb3ZlUGFja2FnZU5hbWVGcm9tRGlzYWJsZWRQYWNrYWdlcyhuYW1lKVxuICAgICAgICBjYWxsYmFjaz8oKVxuICAgICAgICBAZW1pdFBhY2thZ2VFdmVudCAndW5pbnN0YWxsZWQnLCBwYWNrXG4gICAgICBlbHNlXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yTWVzc2FnZSlcbiAgICAgICAgZXJyb3Iuc3Rkb3V0ID0gc3Rkb3V0XG4gICAgICAgIGVycm9yLnN0ZGVyciA9IHN0ZGVyclxuICAgICAgICBvbkVycm9yKGVycm9yKVxuXG4gICAgaGFuZGxlUHJvY2Vzc0Vycm9ycyhhcG1Qcm9jZXNzLCBlcnJvck1lc3NhZ2UsIG9uRXJyb3IpXG5cbiAgaW5zdGFsbEFsdGVybmF0aXZlOiAocGFjaywgYWx0ZXJuYXRpdmVQYWNrYWdlTmFtZSwgY2FsbGJhY2spIC0+XG4gICAgZXZlbnRBcmcgPSB7cGFjaywgYWx0ZXJuYXRpdmU6IGFsdGVybmF0aXZlUGFja2FnZU5hbWV9XG4gICAgQGVtaXR0ZXIuZW1pdCgncGFja2FnZS1pbnN0YWxsaW5nLWFsdGVybmF0aXZlJywgZXZlbnRBcmcpXG5cbiAgICB1bmluc3RhbGxQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIEB1bmluc3RhbGwgcGFjaywgKGVycm9yKSAtPlxuICAgICAgICBpZiBlcnJvciB0aGVuIHJlamVjdChlcnJvcikgZWxzZSByZXNvbHZlKClcblxuICAgIGluc3RhbGxQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIEBpbnN0YWxsIHtuYW1lOiBhbHRlcm5hdGl2ZVBhY2thZ2VOYW1lfSwgKGVycm9yKSAtPlxuICAgICAgICBpZiBlcnJvciB0aGVuIHJlamVjdChlcnJvcikgZWxzZSByZXNvbHZlKClcblxuICAgIFByb21pc2UuYWxsKFt1bmluc3RhbGxQcm9taXNlLCBpbnN0YWxsUHJvbWlzZV0pLnRoZW4gPT5cbiAgICAgIGNhbGxiYWNrKG51bGwsIGV2ZW50QXJnKVxuICAgICAgQGVtaXR0ZXIuZW1pdCgncGFja2FnZS1pbnN0YWxsZWQtYWx0ZXJuYXRpdmUnLCBldmVudEFyZylcbiAgICAuY2F0Y2ggKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5lcnJvciBlcnJvci5tZXNzYWdlLCBlcnJvci5zdGFja1xuICAgICAgY2FsbGJhY2soZXJyb3IsIGV2ZW50QXJnKVxuICAgICAgZXZlbnRBcmcuZXJyb3IgPSBlcnJvclxuICAgICAgQGVtaXR0ZXIuZW1pdCgncGFja2FnZS1pbnN0YWxsLWFsdGVybmF0aXZlLWZhaWxlZCcsIGV2ZW50QXJnKVxuXG4gIGNhblVwZ3JhZGU6IChpbnN0YWxsZWRQYWNrYWdlLCBhdmFpbGFibGVWZXJzaW9uKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgaW5zdGFsbGVkUGFja2FnZT9cblxuICAgIGluc3RhbGxlZFZlcnNpb24gPSBpbnN0YWxsZWRQYWNrYWdlLm1ldGFkYXRhLnZlcnNpb25cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHNlbXZlci52YWxpZChpbnN0YWxsZWRWZXJzaW9uKVxuICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgc2VtdmVyLnZhbGlkKGF2YWlsYWJsZVZlcnNpb24pXG5cbiAgICBzZW12ZXIuZ3QoYXZhaWxhYmxlVmVyc2lvbiwgaW5zdGFsbGVkVmVyc2lvbilcblxuICBnZXRQYWNrYWdlVGl0bGU6ICh7bmFtZX0pIC0+XG4gICAgXy51bmRhc2hlcml6ZShfLnVuY2FtZWxjYXNlKG5hbWUpKVxuXG4gIGdldFJlcG9zaXRvcnlVcmw6ICh7bWV0YWRhdGF9KSAtPlxuICAgIHtyZXBvc2l0b3J5fSA9IG1ldGFkYXRhXG4gICAgcmVwb1VybCA9IHJlcG9zaXRvcnk/LnVybCA/IHJlcG9zaXRvcnkgPyAnJ1xuICAgIGlmIHJlcG9VcmwubWF0Y2ggJ2dpdEBnaXRodWInXG4gICAgICByZXBvTmFtZSA9IHJlcG9Vcmwuc3BsaXQoJzonKVsxXVxuICAgICAgcmVwb1VybCA9IFwiaHR0cHM6Ly9naXRodWIuY29tLyN7cmVwb05hbWV9XCJcbiAgICByZXBvVXJsLnJlcGxhY2UoL1xcLmdpdCQvLCAnJykucmVwbGFjZSgvXFwvKyQvLCAnJykucmVwbGFjZSgvXmdpdFxcKy8sICcnKVxuXG4gIGNoZWNrTmF0aXZlQnVpbGRUb29sczogLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgYXBtUHJvY2VzcyA9IEBydW5Db21tYW5kIFsnaW5zdGFsbCcsICctLWNoZWNrJ10sIChjb2RlLCBzdGRvdXQsIHN0ZGVycikgLT5cbiAgICAgICAgaWYgY29kZSBpcyAwXG4gICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKCkpXG5cbiAgICAgIGFwbVByb2Nlc3Mub25XaWxsVGhyb3dFcnJvciAoe2Vycm9yLCBoYW5kbGV9KSAtPlxuICAgICAgICBoYW5kbGUoKVxuICAgICAgICByZWplY3QoZXJyb3IpXG5cbiAgcmVtb3ZlUGFja2FnZU5hbWVGcm9tRGlzYWJsZWRQYWNrYWdlczogKHBhY2thZ2VOYW1lKSAtPlxuICAgIGF0b20uY29uZmlnLnJlbW92ZUF0S2V5UGF0aCgnY29yZS5kaXNhYmxlZFBhY2thZ2VzJywgcGFja2FnZU5hbWUpXG5cbiAgY2FjaGVBdmFpbGFibGVQYWNrYWdlTmFtZXM6IChwYWNrYWdlcykgLT5cbiAgICBAYXZhaWxhYmxlUGFja2FnZUNhY2hlID0gW11cbiAgICBmb3IgcGFja2FnZVR5cGUgaW4gWydjb3JlJywgJ3VzZXInLCAnZGV2JywgJ2dpdCddXG4gICAgICBjb250aW51ZSB1bmxlc3MgcGFja2FnZXNbcGFja2FnZVR5cGVdP1xuICAgICAgcGFja2FnZU5hbWVzID0gKHBhY2submFtZSBmb3IgcGFjayBpbiBwYWNrYWdlc1twYWNrYWdlVHlwZV0pXG4gICAgICBAYXZhaWxhYmxlUGFja2FnZUNhY2hlLnB1c2gocGFja2FnZU5hbWVzLi4uKVxuICAgIEBhdmFpbGFibGVQYWNrYWdlQ2FjaGVcblxuICBhZGRQYWNrYWdlVG9BdmFpbGFibGVQYWNrYWdlTmFtZXM6IChwYWNrYWdlTmFtZSkgLT5cbiAgICBAYXZhaWxhYmxlUGFja2FnZUNhY2hlID89IFtdXG4gICAgQGF2YWlsYWJsZVBhY2thZ2VDYWNoZS5wdXNoKHBhY2thZ2VOYW1lKSBpZiBAYXZhaWxhYmxlUGFja2FnZUNhY2hlLmluZGV4T2YocGFja2FnZU5hbWUpIDwgMFxuICAgIEBhdmFpbGFibGVQYWNrYWdlQ2FjaGVcblxuICByZW1vdmVQYWNrYWdlRnJvbUF2YWlsYWJsZVBhY2thZ2VOYW1lczogKHBhY2thZ2VOYW1lKSAtPlxuICAgIEBhdmFpbGFibGVQYWNrYWdlQ2FjaGUgPz0gW11cbiAgICBpbmRleCA9IEBhdmFpbGFibGVQYWNrYWdlQ2FjaGUuaW5kZXhPZihwYWNrYWdlTmFtZSlcbiAgICBAYXZhaWxhYmxlUGFja2FnZUNhY2hlLnNwbGljZShpbmRleCwgMSkgaWYgaW5kZXggPiAtMVxuICAgIEBhdmFpbGFibGVQYWNrYWdlQ2FjaGVcblxuICBnZXRBdmFpbGFibGVQYWNrYWdlTmFtZXM6IC0+XG4gICAgQGF2YWlsYWJsZVBhY2thZ2VDYWNoZVxuXG4gICMgRW1pdHMgdGhlIGFwcHJvcHJpYXRlIGV2ZW50IGZvciB0aGUgZ2l2ZW4gcGFja2FnZS5cbiAgI1xuICAjIEFsbCBldmVudHMgYXJlIGVpdGhlciBvZiB0aGUgZm9ybSBgdGhlbWUtZm9vYCBvciBgcGFja2FnZS1mb29gIGRlcGVuZGluZyBvblxuICAjIHdoZXRoZXIgdGhlIGV2ZW50IGlzIGZvciBhIHRoZW1lIG9yIGEgbm9ybWFsIHBhY2thZ2UuIFRoaXMgbWV0aG9kIHN0YW5kYXJkaXplc1xuICAjIHRoZSBsb2dpYyB0byBkZXRlcm1pbmUgaWYgYSBwYWNrYWdlIGlzIGEgdGhlbWUgb3Igbm90IGFuZCBmb3JtYXRzIHRoZSBldmVudFxuICAjIG5hbWUgYXBwcm9wcmlhdGVseS5cbiAgI1xuICAjIGV2ZW50TmFtZSAtIFRoZSBldmVudCBuYW1lIHN1ZmZpeCB7U3RyaW5nfSBvZiB0aGUgZXZlbnQgdG8gZW1pdC5cbiAgIyBwYWNrIC0gVGhlIHBhY2thZ2UgZm9yIHdoaWNoIHRoZSBldmVudCBpcyBiZWluZyBlbWl0dGVkLlxuICAjIGVycm9yIC0gQW55IGVycm9yIGluZm9ybWF0aW9uIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBjYXNlIG9mIGFuIGVycm9yLlxuICBlbWl0UGFja2FnZUV2ZW50OiAoZXZlbnROYW1lLCBwYWNrLCBlcnJvcikgLT5cbiAgICB0aGVtZSA9IHBhY2sudGhlbWUgPyBwYWNrLm1ldGFkYXRhPy50aGVtZVxuICAgIGV2ZW50TmFtZSA9IGlmIHRoZW1lIHRoZW4gXCJ0aGVtZS0je2V2ZW50TmFtZX1cIiBlbHNlIFwicGFja2FnZS0je2V2ZW50TmFtZX1cIlxuICAgIEBlbWl0dGVyLmVtaXQoZXZlbnROYW1lLCB7cGFjaywgZXJyb3J9KVxuXG4gIG9uOiAoc2VsZWN0b3JzLCBjYWxsYmFjaykgLT5cbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBmb3Igc2VsZWN0b3IgaW4gc2VsZWN0b3JzLnNwbGl0KFwiIFwiKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQgQGVtaXR0ZXIub24oc2VsZWN0b3IsIGNhbGxiYWNrKVxuICAgIHN1YnNjcmlwdGlvbnNcblxuY3JlYXRlSnNvblBhcnNlRXJyb3IgPSAobWVzc2FnZSwgcGFyc2VFcnJvciwgc3Rkb3V0KSAtPlxuICBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKVxuICBlcnJvci5zdGRvdXQgPSAnJ1xuICBlcnJvci5zdGRlcnIgPSBcIiN7cGFyc2VFcnJvci5tZXNzYWdlfTogI3tzdGRvdXR9XCJcbiAgZXJyb3JcblxuY3JlYXRlUHJvY2Vzc0Vycm9yID0gKG1lc3NhZ2UsIHByb2Nlc3NFcnJvcikgLT5cbiAgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSlcbiAgZXJyb3Iuc3Rkb3V0ID0gJydcbiAgZXJyb3Iuc3RkZXJyID0gcHJvY2Vzc0Vycm9yLm1lc3NhZ2VcbiAgZXJyb3JcblxuaGFuZGxlUHJvY2Vzc0Vycm9ycyA9IChhcG1Qcm9jZXNzLCBtZXNzYWdlLCBjYWxsYmFjaykgLT5cbiAgYXBtUHJvY2Vzcy5vbldpbGxUaHJvd0Vycm9yICh7ZXJyb3IsIGhhbmRsZX0pIC0+XG4gICAgaGFuZGxlKClcbiAgICBjYWxsYmFjayhjcmVhdGVQcm9jZXNzRXJyb3IobWVzc2FnZSwgZXJyb3IpKVxuIl19
