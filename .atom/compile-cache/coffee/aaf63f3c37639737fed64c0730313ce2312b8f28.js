(function() {
  var CSON, Color, Config, Emitter, ScopeDescriptor, ScopedPropertyStore, _, async, deleteValueAtKeyPath, fs, getValueAtKeyPath, isPlainObject, path, pathWatcher, pushKeyPath, ref, setValueAtKeyPath, sortObject, splitKeyPath, withoutEmptyObjects,
    slice = [].slice;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Emitter = require('event-kit').Emitter;

  CSON = require('season');

  path = require('path');

  async = require('async');

  pathWatcher = require('pathwatcher');

  ref = require('key-path-helpers'), getValueAtKeyPath = ref.getValueAtKeyPath, setValueAtKeyPath = ref.setValueAtKeyPath, deleteValueAtKeyPath = ref.deleteValueAtKeyPath, pushKeyPath = ref.pushKeyPath, splitKeyPath = ref.splitKeyPath;

  Color = require('./color');

  ScopedPropertyStore = require('scoped-property-store');

  ScopeDescriptor = require('./scope-descriptor');

  module.exports = Config = (function() {
    Config.schemaEnforcers = {};

    Config.addSchemaEnforcer = function(typeName, enforcerFunction) {
      var base;
      if ((base = this.schemaEnforcers)[typeName] == null) {
        base[typeName] = [];
      }
      return this.schemaEnforcers[typeName].push(enforcerFunction);
    };

    Config.addSchemaEnforcers = function(filters) {
      var enforcerFunction, functions, name, typeName;
      for (typeName in filters) {
        functions = filters[typeName];
        for (name in functions) {
          enforcerFunction = functions[name];
          this.addSchemaEnforcer(typeName, enforcerFunction);
        }
      }
    };

    Config.executeSchemaEnforcers = function(keyPath, value, schema) {
      var e, enforcer, enforcerFunctions, error, j, k, len, len1, type, types;
      error = null;
      types = schema.type;
      if (!Array.isArray(types)) {
        types = [types];
      }
      for (j = 0, len = types.length; j < len; j++) {
        type = types[j];
        try {
          enforcerFunctions = this.schemaEnforcers[type].concat(this.schemaEnforcers['*']);
          for (k = 0, len1 = enforcerFunctions.length; k < len1; k++) {
            enforcer = enforcerFunctions[k];
            value = enforcer.call(this, keyPath, value, schema);
          }
          error = null;
          break;
        } catch (error1) {
          e = error1;
          error = e;
        }
      }
      if (error != null) {
        throw error;
      }
      return value;
    };

    function Config(arg) {
      var ref1;
      ref1 = arg != null ? arg : {}, this.configDirPath = ref1.configDirPath, this.resourcePath = ref1.resourcePath, this.notificationManager = ref1.notificationManager, this.enablePersistence = ref1.enablePersistence;
      if (this.enablePersistence != null) {
        this.configFilePath = fs.resolve(this.configDirPath, 'config', ['json', 'cson']);
        if (this.configFilePath == null) {
          this.configFilePath = path.join(this.configDirPath, 'config.cson');
        }
      }
      this.clear();
    }

    Config.prototype.clear = function() {
      var debouncedSave, save;
      this.emitter = new Emitter;
      this.schema = {
        type: 'object',
        properties: {}
      };
      this.defaultSettings = {};
      this.settings = {};
      this.scopedSettingsStore = new ScopedPropertyStore;
      this.configFileHasErrors = false;
      this.transactDepth = 0;
      this.savePending = false;
      this.requestLoad = _.debounce(this.loadUserConfig, 100);
      this.requestSave = (function(_this) {
        return function() {
          _this.savePending = true;
          return debouncedSave.call(_this);
        };
      })(this);
      save = (function(_this) {
        return function() {
          _this.savePending = false;
          return _this.save();
        };
      })(this);
      return debouncedSave = _.debounce(save, 100);
    };

    Config.prototype.shouldNotAccessFileSystem = function() {
      return !this.enablePersistence;
    };


    /*
    Section: Config Subscription
     */

    Config.prototype.observe = function() {
      var callback, keyPath, options, scopeDescriptor;
      if (arguments.length === 2) {
        keyPath = arguments[0], callback = arguments[1];
      } else if (arguments.length === 3 && (_.isString(arguments[0]) && _.isObject(arguments[1]))) {
        keyPath = arguments[0], options = arguments[1], callback = arguments[2];
        scopeDescriptor = options.scope;
      } else {
        console.error('An unsupported form of Config::observe is being used. See https://atom.io/docs/api/latest/Config for details');
        return;
      }
      if (scopeDescriptor != null) {
        return this.observeScopedKeyPath(scopeDescriptor, keyPath, callback);
      } else {
        return this.observeKeyPath(keyPath, options != null ? options : {}, callback);
      }
    };

    Config.prototype.onDidChange = function() {
      var callback, keyPath, options, scopeDescriptor;
      if (arguments.length === 1) {
        callback = arguments[0];
      } else if (arguments.length === 2) {
        keyPath = arguments[0], callback = arguments[1];
      } else {
        keyPath = arguments[0], options = arguments[1], callback = arguments[2];
        scopeDescriptor = options.scope;
      }
      if (scopeDescriptor != null) {
        return this.onDidChangeScopedKeyPath(scopeDescriptor, keyPath, callback);
      } else {
        return this.onDidChangeKeyPath(keyPath, callback);
      }
    };


    /*
    Section: Managing Settings
     */

    Config.prototype.get = function() {
      var keyPath, options, scope, value;
      if (arguments.length > 1) {
        if (typeof arguments[0] === 'string' || (arguments[0] == null)) {
          keyPath = arguments[0], options = arguments[1];
          scope = options.scope;
        }
      } else {
        keyPath = arguments[0];
      }
      if (scope != null) {
        value = this.getRawScopedValue(scope, keyPath, options);
        return value != null ? value : this.getRawValue(keyPath, options);
      } else {
        return this.getRawValue(keyPath, options);
      }
    };

    Config.prototype.getAll = function(keyPath, options) {
      var globalValue, result, scope, scopeDescriptor;
      if (options != null) {
        scope = options.scope;
      }
      result = [];
      if (scope != null) {
        scopeDescriptor = ScopeDescriptor.fromObject(scope);
        result = result.concat(this.scopedSettingsStore.getAll(scopeDescriptor.getScopeChain(), keyPath, options));
      }
      if (globalValue = this.getRawValue(keyPath, options)) {
        result.push({
          scopeSelector: '*',
          value: globalValue
        });
      }
      return result;
    };

    Config.prototype.set = function() {
      var e, keyPath, options, ref1, scopeSelector, shouldSave, source, value;
      keyPath = arguments[0], value = arguments[1], options = arguments[2];
      scopeSelector = options != null ? options.scopeSelector : void 0;
      source = options != null ? options.source : void 0;
      shouldSave = (ref1 = options != null ? options.save : void 0) != null ? ref1 : true;
      if (source && !scopeSelector) {
        throw new Error("::set with a 'source' and no 'sourceSelector' is not yet implemented!");
      }
      if (source == null) {
        source = this.getUserConfigPath();
      }
      if (value !== void 0) {
        try {
          value = this.makeValueConformToSchema(keyPath, value);
        } catch (error1) {
          e = error1;
          return false;
        }
      }
      if (scopeSelector != null) {
        this.setRawScopedValue(keyPath, value, source, scopeSelector);
      } else {
        this.setRawValue(keyPath, value);
      }
      if (source === this.getUserConfigPath() && shouldSave && !this.configFileHasErrors) {
        this.requestSave();
      }
      return true;
    };

    Config.prototype.unset = function(keyPath, options) {
      var ref1, scopeSelector, settings, source;
      ref1 = options != null ? options : {}, scopeSelector = ref1.scopeSelector, source = ref1.source;
      if (source == null) {
        source = this.getUserConfigPath();
      }
      if (scopeSelector != null) {
        if (keyPath != null) {
          settings = this.scopedSettingsStore.propertiesForSourceAndSelector(source, scopeSelector);
          if (getValueAtKeyPath(settings, keyPath) != null) {
            this.scopedSettingsStore.removePropertiesForSourceAndSelector(source, scopeSelector);
            setValueAtKeyPath(settings, keyPath, void 0);
            settings = withoutEmptyObjects(settings);
            if (settings != null) {
              this.set(null, settings, {
                scopeSelector: scopeSelector,
                source: source,
                priority: this.priorityForSource(source)
              });
            }
            return this.requestSave();
          }
        } else {
          this.scopedSettingsStore.removePropertiesForSourceAndSelector(source, scopeSelector);
          return this.emitChangeEvent();
        }
      } else {
        for (scopeSelector in this.scopedSettingsStore.propertiesForSource(source)) {
          this.unset(keyPath, {
            scopeSelector: scopeSelector,
            source: source
          });
        }
        if ((keyPath != null) && source === this.getUserConfigPath()) {
          return this.set(keyPath, getValueAtKeyPath(this.defaultSettings, keyPath));
        }
      }
    };

    Config.prototype.getSources = function() {
      return _.uniq(_.pluck(this.scopedSettingsStore.propertySets, 'source')).sort();
    };

    Config.prototype.getSchema = function(keyPath) {
      var childSchema, j, key, keys, len, ref1, schema;
      keys = splitKeyPath(keyPath);
      schema = this.schema;
      for (j = 0, len = keys.length; j < len; j++) {
        key = keys[j];
        if (schema.type === 'object') {
          childSchema = (ref1 = schema.properties) != null ? ref1[key] : void 0;
          if (childSchema == null) {
            if (isPlainObject(schema.additionalProperties)) {
              childSchema = schema.additionalProperties;
            } else if (schema.additionalProperties === false) {
              return null;
            } else {
              return {
                type: 'any'
              };
            }
          }
        } else {
          return null;
        }
        schema = childSchema;
      }
      return schema;
    };

    Config.prototype.getUserConfigPath = function() {
      return this.configFilePath;
    };

    Config.prototype.transact = function(callback) {
      this.beginTransaction();
      try {
        return callback();
      } finally {
        this.endTransaction();
      }
    };


    /*
    Section: Internal methods used by core
     */

    Config.prototype.transactAsync = function(callback) {
      var endTransaction, error, result;
      this.beginTransaction();
      try {
        endTransaction = (function(_this) {
          return function(fn) {
            return function() {
              var args;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              _this.endTransaction();
              return fn.apply(null, args);
            };
          };
        })(this);
        result = callback();
        return new Promise(function(resolve, reject) {
          return result.then(endTransaction(resolve))["catch"](endTransaction(reject));
        });
      } catch (error1) {
        error = error1;
        this.endTransaction();
        return Promise.reject(error);
      }
    };

    Config.prototype.beginTransaction = function() {
      return this.transactDepth++;
    };

    Config.prototype.endTransaction = function() {
      this.transactDepth--;
      return this.emitChangeEvent();
    };

    Config.prototype.pushAtKeyPath = function(keyPath, value) {
      var arrayValue, ref1, result;
      arrayValue = (ref1 = this.get(keyPath)) != null ? ref1 : [];
      result = arrayValue.push(value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.unshiftAtKeyPath = function(keyPath, value) {
      var arrayValue, ref1, result;
      arrayValue = (ref1 = this.get(keyPath)) != null ? ref1 : [];
      result = arrayValue.unshift(value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.removeAtKeyPath = function(keyPath, value) {
      var arrayValue, ref1, result;
      arrayValue = (ref1 = this.get(keyPath)) != null ? ref1 : [];
      result = _.remove(arrayValue, value);
      this.set(keyPath, arrayValue);
      return result;
    };

    Config.prototype.setSchema = function(keyPath, schema) {
      var j, key, len, properties, ref1, rootSchema;
      if (!isPlainObject(schema)) {
        throw new Error("Error loading schema for " + keyPath + ": schemas can only be objects!");
      }
      if (!typeof (schema.type != null)) {
        throw new Error("Error loading schema for " + keyPath + ": schema objects must have a type attribute");
      }
      rootSchema = this.schema;
      if (keyPath) {
        ref1 = splitKeyPath(keyPath);
        for (j = 0, len = ref1.length; j < len; j++) {
          key = ref1[j];
          rootSchema.type = 'object';
          if (rootSchema.properties == null) {
            rootSchema.properties = {};
          }
          properties = rootSchema.properties;
          if (properties[key] == null) {
            properties[key] = {};
          }
          rootSchema = properties[key];
        }
      }
      Object.assign(rootSchema, schema);
      return this.transact((function(_this) {
        return function() {
          _this.setDefaults(keyPath, _this.extractDefaultsFromSchema(schema));
          _this.setScopedDefaultsFromSchema(keyPath, schema);
          return _this.resetSettingsForSchemaChange();
        };
      })(this));
    };

    Config.prototype.load = function() {
      this.initializeConfigDirectory();
      this.loadUserConfig();
      return this.observeUserConfig();
    };


    /*
    Section: Private methods managing the user's config file
     */

    Config.prototype.initializeConfigDirectory = function(done) {
      var onConfigDirFile, queue, templateConfigDirPath;
      if (fs.existsSync(this.configDirPath) || this.shouldNotAccessFileSystem()) {
        return;
      }
      fs.makeTreeSync(this.configDirPath);
      queue = async.queue(function(arg, callback) {
        var destinationPath, sourcePath;
        sourcePath = arg.sourcePath, destinationPath = arg.destinationPath;
        return fs.copy(sourcePath, destinationPath, callback);
      });
      queue.drain = done;
      templateConfigDirPath = fs.resolve(this.resourcePath, 'dot-atom');
      onConfigDirFile = (function(_this) {
        return function(sourcePath) {
          var destinationPath, relativePath;
          relativePath = sourcePath.substring(templateConfigDirPath.length + 1);
          destinationPath = path.join(_this.configDirPath, relativePath);
          return queue.push({
            sourcePath: sourcePath,
            destinationPath: destinationPath
          });
        };
      })(this);
      return fs.traverseTree(templateConfigDirPath, onConfigDirFile, function(path) {
        return true;
      });
    };

    Config.prototype.loadUserConfig = function() {
      var detail, error, message, userConfig;
      if (this.shouldNotAccessFileSystem()) {
        return;
      }
      try {
        if (!fs.existsSync(this.configFilePath)) {
          fs.makeTreeSync(path.dirname(this.configFilePath));
          CSON.writeFileSync(this.configFilePath, {});
        }
      } catch (error1) {
        error = error1;
        this.configFileHasErrors = true;
        this.notifyFailure("Failed to initialize `" + (path.basename(this.configFilePath)) + "`", error.stack);
        return;
      }
      try {
        if (!this.savePending) {
          userConfig = CSON.readFileSync(this.configFilePath);
          this.resetUserSettings(userConfig);
          return this.configFileHasErrors = false;
        }
      } catch (error1) {
        error = error1;
        this.configFileHasErrors = true;
        message = "Failed to load `" + (path.basename(this.configFilePath)) + "`";
        detail = error.location != null ? error.stack : error.message;
        return this.notifyFailure(message, detail);
      }
    };

    Config.prototype.observeUserConfig = function() {
      var error;
      if (this.shouldNotAccessFileSystem()) {
        return;
      }
      try {
        return this.watchSubscription != null ? this.watchSubscription : this.watchSubscription = pathWatcher.watch(this.configFilePath, (function(_this) {
          return function(eventType) {
            if (eventType === 'change' && (_this.watchSubscription != null)) {
              return _this.requestLoad();
            }
          };
        })(this));
      } catch (error1) {
        error = error1;
        return this.notifyFailure("Unable to watch path: `" + (path.basename(this.configFilePath)) + "`. Make sure you have permissions to\n`" + this.configFilePath + "`. On linux there are currently problems with watch\nsizes. See [this document][watches] for more info.\n[watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path");
      }
    };

    Config.prototype.unobserveUserConfig = function() {
      var ref1;
      if ((ref1 = this.watchSubscription) != null) {
        ref1.close();
      }
      return this.watchSubscription = null;
    };

    Config.prototype.notifyFailure = function(errorMessage, detail) {
      var ref1;
      return (ref1 = this.notificationManager) != null ? ref1.addError(errorMessage, {
        detail: detail,
        dismissable: true
      }) : void 0;
    };

    Config.prototype.save = function() {
      var allSettings, detail, error, message;
      if (this.shouldNotAccessFileSystem()) {
        return;
      }
      allSettings = {
        '*': this.settings
      };
      allSettings = Object.assign(allSettings, this.scopedSettingsStore.propertiesForSource(this.getUserConfigPath()));
      allSettings = sortObject(allSettings);
      try {
        return CSON.writeFileSync(this.configFilePath, allSettings);
      } catch (error1) {
        error = error1;
        message = "Failed to save `" + (path.basename(this.configFilePath)) + "`";
        detail = error.message;
        return this.notifyFailure(message, detail);
      }
    };


    /*
    Section: Private methods managing global settings
     */

    Config.prototype.resetUserSettings = function(newSettings) {
      var scopedSettings;
      if (!isPlainObject(newSettings)) {
        this.settings = {};
        this.emitChangeEvent();
        return;
      }
      if (newSettings.global != null) {
        newSettings['*'] = newSettings.global;
        delete newSettings.global;
      }
      if (newSettings['*'] != null) {
        scopedSettings = newSettings;
        newSettings = newSettings['*'];
        delete scopedSettings['*'];
        this.resetUserScopedSettings(scopedSettings);
      }
      return this.transact((function(_this) {
        return function() {
          var key, value;
          _this.settings = {};
          for (key in newSettings) {
            value = newSettings[key];
            _this.set(key, value, {
              save: false
            });
          }
        };
      })(this));
    };

    Config.prototype.getRawValue = function(keyPath, options) {
      var defaultValue, ref1, ref2, value;
      if (!((options != null ? (ref1 = options.excludeSources) != null ? ref1.indexOf(this.getUserConfigPath()) : void 0 : void 0) >= 0)) {
        value = getValueAtKeyPath(this.settings, keyPath);
      }
      if (!((options != null ? (ref2 = options.sources) != null ? ref2.length : void 0 : void 0) > 0)) {
        defaultValue = getValueAtKeyPath(this.defaultSettings, keyPath);
      }
      if (value != null) {
        value = this.deepClone(value);
        if (isPlainObject(value) && isPlainObject(defaultValue)) {
          this.deepDefaults(value, defaultValue);
        }
      } else {
        value = this.deepClone(defaultValue);
      }
      return value;
    };

    Config.prototype.setRawValue = function(keyPath, value) {
      var defaultValue;
      defaultValue = getValueAtKeyPath(this.defaultSettings, keyPath);
      if (_.isEqual(defaultValue, value)) {
        if (keyPath != null) {
          deleteValueAtKeyPath(this.settings, keyPath);
        } else {
          this.settings = null;
        }
      } else {
        if (keyPath != null) {
          setValueAtKeyPath(this.settings, keyPath, value);
        } else {
          this.settings = value;
        }
      }
      return this.emitChangeEvent();
    };

    Config.prototype.observeKeyPath = function(keyPath, options, callback) {
      callback(this.get(keyPath));
      return this.onDidChangeKeyPath(keyPath, function(event) {
        return callback(event.newValue);
      });
    };

    Config.prototype.onDidChangeKeyPath = function(keyPath, callback) {
      var oldValue;
      oldValue = this.get(keyPath);
      return this.emitter.on('did-change', (function(_this) {
        return function() {
          var event, newValue;
          newValue = _this.get(keyPath);
          if (!_.isEqual(oldValue, newValue)) {
            event = {
              oldValue: oldValue,
              newValue: newValue
            };
            oldValue = newValue;
            return callback(event);
          }
        };
      })(this));
    };

    Config.prototype.isSubKeyPath = function(keyPath, subKeyPath) {
      var pathSubTokens, pathTokens;
      if (!((keyPath != null) && (subKeyPath != null))) {
        return false;
      }
      pathSubTokens = splitKeyPath(subKeyPath);
      pathTokens = splitKeyPath(keyPath).slice(0, pathSubTokens.length);
      return _.isEqual(pathTokens, pathSubTokens);
    };

    Config.prototype.setRawDefault = function(keyPath, value) {
      setValueAtKeyPath(this.defaultSettings, keyPath, value);
      return this.emitChangeEvent();
    };

    Config.prototype.setDefaults = function(keyPath, defaults) {
      var e, keys;
      if ((defaults != null) && isPlainObject(defaults)) {
        keys = splitKeyPath(keyPath);
        this.transact((function(_this) {
          return function() {
            var childValue, key, results;
            results = [];
            for (key in defaults) {
              childValue = defaults[key];
              if (!defaults.hasOwnProperty(key)) {
                continue;
              }
              results.push(_this.setDefaults(keys.concat([key]).join('.'), childValue));
            }
            return results;
          };
        })(this));
      } else {
        try {
          defaults = this.makeValueConformToSchema(keyPath, defaults);
          this.setRawDefault(keyPath, defaults);
        } catch (error1) {
          e = error1;
          console.warn("'" + keyPath + "' could not set the default. Attempted default: " + (JSON.stringify(defaults)) + "; Schema: " + (JSON.stringify(this.getSchema(keyPath))));
        }
      }
    };

    Config.prototype.deepClone = function(object) {
      if (object instanceof Color) {
        return object.clone();
      } else if (_.isArray(object)) {
        return object.map((function(_this) {
          return function(value) {
            return _this.deepClone(value);
          };
        })(this));
      } else if (isPlainObject(object)) {
        return _.mapObject(object, (function(_this) {
          return function(key, value) {
            return [key, _this.deepClone(value)];
          };
        })(this));
      } else {
        return object;
      }
    };

    Config.prototype.deepDefaults = function(target) {
      var i, j, key, len, object, ref1, result;
      result = target;
      i = 0;
      while (++i < arguments.length) {
        object = arguments[i];
        if (isPlainObject(result) && isPlainObject(object)) {
          ref1 = Object.keys(object);
          for (j = 0, len = ref1.length; j < len; j++) {
            key = ref1[j];
            result[key] = this.deepDefaults(result[key], object[key]);
          }
        } else {
          if (result == null) {
            result = this.deepClone(object);
          }
        }
      }
      return result;
    };

    Config.prototype.setScopedDefaultsFromSchema = function(keyPath, schema) {
      var childValue, key, keys, ref1, ref2, scope, scopeSchema, scopedDefaults;
      if ((schema.scopes != null) && isPlainObject(schema.scopes)) {
        scopedDefaults = {};
        ref1 = schema.scopes;
        for (scope in ref1) {
          scopeSchema = ref1[scope];
          if (!scopeSchema.hasOwnProperty('default')) {
            continue;
          }
          scopedDefaults[scope] = {};
          setValueAtKeyPath(scopedDefaults[scope], keyPath, scopeSchema["default"]);
        }
        this.scopedSettingsStore.addProperties('schema-default', scopedDefaults);
      }
      if (schema.type === 'object' && (schema.properties != null) && isPlainObject(schema.properties)) {
        keys = splitKeyPath(keyPath);
        ref2 = schema.properties;
        for (key in ref2) {
          childValue = ref2[key];
          if (!schema.properties.hasOwnProperty(key)) {
            continue;
          }
          this.setScopedDefaultsFromSchema(keys.concat([key]).join('.'), childValue);
        }
      }
    };

    Config.prototype.extractDefaultsFromSchema = function(schema) {
      var defaults, key, properties, value;
      if (schema["default"] != null) {
        return schema["default"];
      } else if (schema.type === 'object' && (schema.properties != null) && isPlainObject(schema.properties)) {
        defaults = {};
        properties = schema.properties || {};
        for (key in properties) {
          value = properties[key];
          defaults[key] = this.extractDefaultsFromSchema(value);
        }
        return defaults;
      }
    };

    Config.prototype.makeValueConformToSchema = function(keyPath, value, options) {
      var e, schema;
      if (options != null ? options.suppressException : void 0) {
        try {
          return this.makeValueConformToSchema(keyPath, value);
        } catch (error1) {
          e = error1;
          return void 0;
        }
      } else {
        if ((schema = this.getSchema(keyPath)) == null) {
          if (schema === false) {
            throw new Error("Illegal key path " + keyPath);
          }
        }
        return this.constructor.executeSchemaEnforcers(keyPath, value, schema);
      }
    };

    Config.prototype.resetSettingsForSchemaChange = function(source) {
      if (source == null) {
        source = this.getUserConfigPath();
      }
      return this.transact((function(_this) {
        return function() {
          var scopeSelector, selectorsAndSettings, settings;
          _this.settings = _this.makeValueConformToSchema(null, _this.settings, {
            suppressException: true
          });
          selectorsAndSettings = _this.scopedSettingsStore.propertiesForSource(source);
          _this.scopedSettingsStore.removePropertiesForSource(source);
          for (scopeSelector in selectorsAndSettings) {
            settings = selectorsAndSettings[scopeSelector];
            settings = _this.makeValueConformToSchema(null, settings, {
              suppressException: true
            });
            _this.setRawScopedValue(null, settings, source, scopeSelector);
          }
        };
      })(this));
    };


    /*
    Section: Private Scoped Settings
     */

    Config.prototype.priorityForSource = function(source) {
      if (source === this.getUserConfigPath()) {
        return 1000;
      } else {
        return 0;
      }
    };

    Config.prototype.emitChangeEvent = function() {
      if (!(this.transactDepth > 0)) {
        return this.emitter.emit('did-change');
      }
    };

    Config.prototype.resetUserScopedSettings = function(newScopedSettings) {
      var priority, scopeSelector, settings, source, validatedSettings;
      source = this.getUserConfigPath();
      priority = this.priorityForSource(source);
      this.scopedSettingsStore.removePropertiesForSource(source);
      for (scopeSelector in newScopedSettings) {
        settings = newScopedSettings[scopeSelector];
        settings = this.makeValueConformToSchema(null, settings, {
          suppressException: true
        });
        validatedSettings = {};
        validatedSettings[scopeSelector] = withoutEmptyObjects(settings);
        if (validatedSettings[scopeSelector] != null) {
          this.scopedSettingsStore.addProperties(source, validatedSettings, {
            priority: priority
          });
        }
      }
      return this.emitChangeEvent();
    };

    Config.prototype.setRawScopedValue = function(keyPath, value, source, selector, options) {
      var newValue, settingsBySelector;
      if (keyPath != null) {
        newValue = {};
        setValueAtKeyPath(newValue, keyPath, value);
        value = newValue;
      }
      settingsBySelector = {};
      settingsBySelector[selector] = value;
      this.scopedSettingsStore.addProperties(source, settingsBySelector, {
        priority: this.priorityForSource(source)
      });
      return this.emitChangeEvent();
    };

    Config.prototype.getRawScopedValue = function(scopeDescriptor, keyPath, options) {
      scopeDescriptor = ScopeDescriptor.fromObject(scopeDescriptor);
      return this.scopedSettingsStore.getPropertyValue(scopeDescriptor.getScopeChain(), keyPath, options);
    };

    Config.prototype.observeScopedKeyPath = function(scope, keyPath, callback) {
      callback(this.get(keyPath, {
        scope: scope
      }));
      return this.onDidChangeScopedKeyPath(scope, keyPath, function(event) {
        return callback(event.newValue);
      });
    };

    Config.prototype.onDidChangeScopedKeyPath = function(scope, keyPath, callback) {
      var oldValue;
      oldValue = this.get(keyPath, {
        scope: scope
      });
      return this.emitter.on('did-change', (function(_this) {
        return function() {
          var event, newValue;
          newValue = _this.get(keyPath, {
            scope: scope
          });
          if (!_.isEqual(oldValue, newValue)) {
            event = {
              oldValue: oldValue,
              newValue: newValue
            };
            oldValue = newValue;
            return callback(event);
          }
        };
      })(this));
    };

    return Config;

  })();

  Config.addSchemaEnforcers({
    'any': {
      coerce: function(keyPath, value, schema) {
        return value;
      }
    },
    'integer': {
      coerce: function(keyPath, value, schema) {
        value = parseInt(value);
        if (isNaN(value) || !isFinite(value)) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " cannot be coerced into an int");
        }
        return value;
      }
    },
    'number': {
      coerce: function(keyPath, value, schema) {
        value = parseFloat(value);
        if (isNaN(value) || !isFinite(value)) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " cannot be coerced into a number");
        }
        return value;
      }
    },
    'boolean': {
      coerce: function(keyPath, value, schema) {
        switch (typeof value) {
          case 'string':
            if (value.toLowerCase() === 'true') {
              return true;
            } else if (value.toLowerCase() === 'false') {
              return false;
            } else {
              throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be a boolean or the string 'true' or 'false'");
            }
            break;
          case 'boolean':
            return value;
          default:
            throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be a boolean or the string 'true' or 'false'");
        }
      }
    },
    'string': {
      validate: function(keyPath, value, schema) {
        if (typeof value !== 'string') {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be a string");
        }
        return value;
      },
      validateMaximumLength: function(keyPath, value, schema) {
        if (typeof schema.maximumLength === 'number' && value.length > schema.maximumLength) {
          return value.slice(0, schema.maximumLength);
        } else {
          return value;
        }
      }
    },
    'null': {
      coerce: function(keyPath, value, schema) {
        if (value !== (void 0) && value !== null) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be null");
        }
        return value;
      }
    },
    'object': {
      coerce: function(keyPath, value, schema) {
        var allowsAdditionalProperties, childSchema, defaultChildSchema, error, newValue, prop, propValue, ref1;
        if (!isPlainObject(value)) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be an object");
        }
        if (schema.properties == null) {
          return value;
        }
        defaultChildSchema = null;
        allowsAdditionalProperties = true;
        if (isPlainObject(schema.additionalProperties)) {
          defaultChildSchema = schema.additionalProperties;
        }
        if (schema.additionalProperties === false) {
          allowsAdditionalProperties = false;
        }
        newValue = {};
        for (prop in value) {
          propValue = value[prop];
          childSchema = (ref1 = schema.properties[prop]) != null ? ref1 : defaultChildSchema;
          if (childSchema != null) {
            try {
              newValue[prop] = this.executeSchemaEnforcers(pushKeyPath(keyPath, prop), propValue, childSchema);
            } catch (error1) {
              error = error1;
              console.warn("Error setting item in object: " + error.message);
            }
          } else if (allowsAdditionalProperties) {
            newValue[prop] = propValue;
          } else {
            console.warn("Illegal object key: " + keyPath + "." + prop);
          }
        }
        return newValue;
      }
    },
    'array': {
      coerce: function(keyPath, value, schema) {
        var error, item, itemSchema, j, len, newValue;
        if (!Array.isArray(value)) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " must be an array");
        }
        itemSchema = schema.items;
        if (itemSchema != null) {
          newValue = [];
          for (j = 0, len = value.length; j < len; j++) {
            item = value[j];
            try {
              newValue.push(this.executeSchemaEnforcers(keyPath, item, itemSchema));
            } catch (error1) {
              error = error1;
              console.warn("Error setting item in array: " + error.message);
            }
          }
          return newValue;
        } else {
          return value;
        }
      }
    },
    'color': {
      coerce: function(keyPath, value, schema) {
        var color;
        color = Color.parse(value);
        if (color == null) {
          throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " cannot be coerced into a color");
        }
        return color;
      }
    },
    '*': {
      coerceMinimumAndMaximum: function(keyPath, value, schema) {
        if (typeof value !== 'number') {
          return value;
        }
        if ((schema.minimum != null) && typeof schema.minimum === 'number') {
          value = Math.max(value, schema.minimum);
        }
        if ((schema.maximum != null) && typeof schema.maximum === 'number') {
          value = Math.min(value, schema.maximum);
        }
        return value;
      },
      validateEnum: function(keyPath, value, schema) {
        var j, len, possibleValue, possibleValues;
        possibleValues = schema["enum"];
        if (Array.isArray(possibleValues)) {
          possibleValues = possibleValues.map(function(value) {
            if (value.hasOwnProperty('value')) {
              return value.value;
            } else {
              return value;
            }
          });
        }
        if (!((possibleValues != null) && Array.isArray(possibleValues) && possibleValues.length)) {
          return value;
        }
        for (j = 0, len = possibleValues.length; j < len; j++) {
          possibleValue = possibleValues[j];
          if (_.isEqual(possibleValue, value)) {
            return value;
          }
        }
        throw new Error("Validation failed at " + keyPath + ", " + (JSON.stringify(value)) + " is not one of " + (JSON.stringify(possibleValues)));
      }
    }
  });

  isPlainObject = function(value) {
    return _.isObject(value) && !_.isArray(value) && !_.isFunction(value) && !_.isString(value) && !(value instanceof Color);
  };

  sortObject = function(value) {
    var j, key, len, ref1, result;
    if (!isPlainObject(value)) {
      return value;
    }
    result = {};
    ref1 = Object.keys(value).sort();
    for (j = 0, len = ref1.length; j < len; j++) {
      key = ref1[j];
      result[key] = sortObject(value[key]);
    }
    return result;
  };

  withoutEmptyObjects = function(object) {
    var key, newValue, resultObject, value;
    resultObject = void 0;
    if (isPlainObject(object)) {
      for (key in object) {
        value = object[key];
        newValue = withoutEmptyObjects(value);
        if (newValue != null) {
          if (resultObject == null) {
            resultObject = {};
          }
          resultObject[key] = newValue;
        }
      }
    } else {
      resultObject = object;
    }
    return resultObject;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jb25maWcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrT0FBQTtJQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLFVBQVcsT0FBQSxDQUFRLFdBQVI7O0VBQ1osSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0VBQ1IsV0FBQSxHQUFjLE9BQUEsQ0FBUSxhQUFSOztFQUNkLE1BR0ksT0FBQSxDQUFRLGtCQUFSLENBSEosRUFDRSx5Q0FERixFQUNxQix5Q0FEckIsRUFDd0MsK0NBRHhDLEVBRUUsNkJBRkYsRUFFZTs7RUFHZixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLHVCQUFSOztFQUN0QixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjs7RUF3VWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixNQUFDLENBQUEsZUFBRCxHQUFtQjs7SUFFbkIsTUFBQyxDQUFBLGlCQUFELEdBQW9CLFNBQUMsUUFBRCxFQUFXLGdCQUFYO0FBQ2xCLFVBQUE7O1lBQWlCLENBQUEsUUFBQSxJQUFhOzthQUM5QixJQUFDLENBQUEsZUFBZ0IsQ0FBQSxRQUFBLENBQVMsQ0FBQyxJQUEzQixDQUFnQyxnQkFBaEM7SUFGa0I7O0lBSXBCLE1BQUMsQ0FBQSxrQkFBRCxHQUFxQixTQUFDLE9BQUQ7QUFDbkIsVUFBQTtBQUFBLFdBQUEsbUJBQUE7O0FBQ0UsYUFBQSxpQkFBQTs7VUFDRSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsUUFBbkIs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Q0FBMUIsSUFBK0MsQ0FBSSxDQUFDLENBQUMsVUFBRixDQUFhLEtBQWIsQ0FBbkQsSUFBMkUsQ0FBSSxDQUFDLENBQUMsUUFBRixDQUFXLEtBQVgsQ0FBL0UsSUFBcUcsQ0FBSSxDQUFDLEtBQUEsWUFBaUIsS0FBbEI7RUFEM0Y7O0VBR2hCLFVBQUEsR0FBYSxTQUFDLEtBQUQ7QUFDWCxRQUFBO0lBQUEsSUFBQSxDQUFvQixhQUFBLENBQWMsS0FBZCxDQUFwQjtBQUFBLGFBQU8sTUFBUDs7SUFDQSxNQUFBLEdBQVM7QUFDVDtBQUFBLFNBQUEsc0NBQUE7O01BQ0UsTUFBTyxDQUFBLEdBQUEsQ0FBUCxHQUFjLFVBQUEsQ0FBVyxLQUFNLENBQUEsR0FBQSxDQUFqQjtBQURoQjtXQUVBO0VBTFc7O0VBT2IsbUJBQUEsR0FBc0IsU0FBQyxNQUFEO0FBQ3BCLFFBQUE7SUFBQSxZQUFBLEdBQWU7SUFDZixJQUFHLGFBQUEsQ0FBYyxNQUFkLENBQUg7QUFDRSxXQUFBLGFBQUE7O1FBQ0UsUUFBQSxHQUFXLG1CQUFBLENBQW9CLEtBQXBCO1FBQ1gsSUFBRyxnQkFBSDs7WUFDRSxlQUFnQjs7VUFDaEIsWUFBYSxDQUFBLEdBQUEsQ0FBYixHQUFvQixTQUZ0Qjs7QUFGRixPQURGO0tBQUEsTUFBQTtNQU9FLFlBQUEsR0FBZSxPQVBqQjs7V0FRQTtFQVZvQjtBQWx1Q3RCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbkNTT04gPSByZXF1aXJlICdzZWFzb24nXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbmFzeW5jID0gcmVxdWlyZSAnYXN5bmMnXG5wYXRoV2F0Y2hlciA9IHJlcXVpcmUgJ3BhdGh3YXRjaGVyJ1xue1xuICBnZXRWYWx1ZUF0S2V5UGF0aCwgc2V0VmFsdWVBdEtleVBhdGgsIGRlbGV0ZVZhbHVlQXRLZXlQYXRoLFxuICBwdXNoS2V5UGF0aCwgc3BsaXRLZXlQYXRoLFxufSA9IHJlcXVpcmUgJ2tleS1wYXRoLWhlbHBlcnMnXG5cbkNvbG9yID0gcmVxdWlyZSAnLi9jb2xvcidcblNjb3BlZFByb3BlcnR5U3RvcmUgPSByZXF1aXJlICdzY29wZWQtcHJvcGVydHktc3RvcmUnXG5TY29wZURlc2NyaXB0b3IgPSByZXF1aXJlICcuL3Njb3BlLWRlc2NyaXB0b3InXG5cbiMgRXNzZW50aWFsOiBVc2VkIHRvIGFjY2VzcyBhbGwgb2YgQXRvbSdzIGNvbmZpZ3VyYXRpb24gZGV0YWlscy5cbiNcbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS5jb25maWdgIGdsb2JhbC5cbiNcbiMgIyMgR2V0dGluZyBhbmQgc2V0dGluZyBjb25maWcgc2V0dGluZ3MuXG4jXG4jIGBgYGNvZmZlZVxuIyAjIE5vdGUgdGhhdCB3aXRoIG5vIHZhbHVlIHNldCwgOjpnZXQgcmV0dXJucyB0aGUgc2V0dGluZydzIGRlZmF1bHQgdmFsdWUuXG4jIGF0b20uY29uZmlnLmdldCgnbXktcGFja2FnZS5teUtleScpICMgLT4gJ2RlZmF1bHRWYWx1ZSdcbiNcbiMgYXRvbS5jb25maWcuc2V0KCdteS1wYWNrYWdlLm15S2V5JywgJ3ZhbHVlJylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLm15S2V5JykgIyAtPiAndmFsdWUnXG4jIGBgYFxuI1xuIyBZb3UgbWF5IHdhbnQgdG8gd2F0Y2ggZm9yIGNoYW5nZXMuIFVzZSB7OjpvYnNlcnZlfSB0byBjYXRjaCBjaGFuZ2VzIHRvIHRoZSBzZXR0aW5nLlxuI1xuIyBgYGBjb2ZmZWVcbiMgYXRvbS5jb25maWcuc2V0KCdteS1wYWNrYWdlLm15S2V5JywgJ3ZhbHVlJylcbiMgYXRvbS5jb25maWcub2JzZXJ2ZSAnbXktcGFja2FnZS5teUtleScsIChuZXdWYWx1ZSkgLT5cbiMgICAjIGBvYnNlcnZlYCBjYWxscyBpbW1lZGlhdGVseSBhbmQgZXZlcnkgdGltZSB0aGUgdmFsdWUgaXMgY2hhbmdlZFxuIyAgIGNvbnNvbGUubG9nICdNeSBjb25maWd1cmF0aW9uIGNoYW5nZWQ6JywgbmV3VmFsdWVcbiMgYGBgXG4jXG4jIElmIHlvdSB3YW50IGEgbm90aWZpY2F0aW9uIG9ubHkgd2hlbiB0aGUgdmFsdWUgY2hhbmdlcywgdXNlIHs6Om9uRGlkQ2hhbmdlfS5cbiNcbiMgYGBgY29mZmVlXG4jIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdteS1wYWNrYWdlLm15S2V5JywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuIyAgIGNvbnNvbGUubG9nICdNeSBjb25maWd1cmF0aW9uIGNoYW5nZWQ6JywgbmV3VmFsdWUsIG9sZFZhbHVlXG4jIGBgYFxuI1xuIyAjIyMgVmFsdWUgQ29lcmNpb25cbiNcbiMgQ29uZmlnIHNldHRpbmdzIGVhY2ggaGF2ZSBhIHR5cGUgc3BlY2lmaWVkIGJ5IHdheSBvZiBhXG4jIFtzY2hlbWFdKGpzb24tc2NoZW1hLm9yZykuIEZvciBleGFtcGxlIHdlIG1pZ2h0IGFuIGludGVnZXIgc2V0dGluZyB0aGF0IG9ubHlcbiMgYWxsb3dzIGludGVnZXJzIGdyZWF0ZXIgdGhhbiBgMGA6XG4jXG4jIGBgYGNvZmZlZVxuIyAjIFdoZW4gbm8gdmFsdWUgaGFzIGJlZW4gc2V0LCBgOjpnZXRgIHJldHVybnMgdGhlIHNldHRpbmcncyBkZWZhdWx0IHZhbHVlXG4jIGF0b20uY29uZmlnLmdldCgnbXktcGFja2FnZS5hbkludCcpICMgLT4gMTJcbiNcbiMgIyBUaGUgc3RyaW5nIHdpbGwgYmUgY29lcmNlZCB0byB0aGUgaW50ZWdlciAxMjNcbiMgYXRvbS5jb25maWcuc2V0KCdteS1wYWNrYWdlLmFuSW50JywgJzEyMycpXG4jIGF0b20uY29uZmlnLmdldCgnbXktcGFja2FnZS5hbkludCcpICMgLT4gMTIzXG4jXG4jICMgVGhlIHN0cmluZyB3aWxsIGJlIGNvZXJjZWQgdG8gYW4gaW50ZWdlciwgYnV0IGl0IG11c3QgYmUgZ3JlYXRlciB0aGFuIDAsIHNvIGlzIHNldCB0byAxXG4jIGF0b20uY29uZmlnLnNldCgnbXktcGFja2FnZS5hbkludCcsICctMjAnKVxuIyBhdG9tLmNvbmZpZy5nZXQoJ215LXBhY2thZ2UuYW5JbnQnKSAjIC0+IDFcbiMgYGBgXG4jXG4jICMjIERlZmluaW5nIHNldHRpbmdzIGZvciB5b3VyIHBhY2thZ2VcbiNcbiMgRGVmaW5lIGEgc2NoZW1hIHVuZGVyIGEgYGNvbmZpZ2Aga2V5IGluIHlvdXIgcGFja2FnZSBtYWluLlxuI1xuIyBgYGBjb2ZmZWVcbiMgbW9kdWxlLmV4cG9ydHMgPVxuIyAgICMgWW91ciBjb25maWcgc2NoZW1hXG4jICAgY29uZmlnOlxuIyAgICAgc29tZUludDpcbiMgICAgICAgdHlwZTogJ2ludGVnZXInXG4jICAgICAgIGRlZmF1bHQ6IDIzXG4jICAgICAgIG1pbmltdW06IDFcbiNcbiMgICBhY3RpdmF0ZTogKHN0YXRlKSAtPiAjIC4uLlxuIyAgICMgLi4uXG4jIGBgYFxuI1xuIyBTZWUgW3BhY2thZ2UgZG9jc10oaHR0cDovL2ZsaWdodC1tYW51YWwuYXRvbS5pby9oYWNraW5nLWF0b20vc2VjdGlvbnMvcGFja2FnZS13b3JkLWNvdW50LykgZm9yXG4jIG1vcmUgaW5mby5cbiNcbiMgIyMgQ29uZmlnIFNjaGVtYXNcbiNcbiMgV2UgdXNlIFtqc29uIHNjaGVtYV0oaHR0cDovL2pzb24tc2NoZW1hLm9yZykgd2hpY2ggYWxsb3dzIHlvdSB0byBkZWZpbmUgeW91ciB2YWx1ZSdzXG4jIGRlZmF1bHQsIHRoZSB0eXBlIGl0IHNob3VsZCBiZSwgZXRjLiBBIHNpbXBsZSBleGFtcGxlOlxuI1xuIyBgYGBjb2ZmZWVcbiMgIyBXZSB3YW50IHRvIHByb3ZpZGUgYW4gYGVuYWJsZVRoaW5nYCwgYW5kIGEgYHRoaW5nVm9sdW1lYFxuIyBjb25maWc6XG4jICAgZW5hYmxlVGhpbmc6XG4jICAgICB0eXBlOiAnYm9vbGVhbidcbiMgICAgIGRlZmF1bHQ6IGZhbHNlXG4jICAgdGhpbmdWb2x1bWU6XG4jICAgICB0eXBlOiAnaW50ZWdlcidcbiMgICAgIGRlZmF1bHQ6IDVcbiMgICAgIG1pbmltdW06IDFcbiMgICAgIG1heGltdW06IDExXG4jIGBgYFxuI1xuIyBUaGUgdHlwZSBrZXl3b3JkIGFsbG93cyBmb3IgdHlwZSBjb2VyY2lvbiBhbmQgdmFsaWRhdGlvbi4gSWYgYSBgdGhpbmdWb2x1bWVgIGlzXG4jIHNldCB0byBhIHN0cmluZyBgJzEwJ2AsIGl0IHdpbGwgYmUgY29lcmNlZCBpbnRvIGFuIGludGVnZXIuXG4jXG4jIGBgYGNvZmZlZVxuIyBhdG9tLmNvbmZpZy5zZXQoJ215LXBhY2thZ2UudGhpbmdWb2x1bWUnLCAnMTAnKVxuIyBhdG9tLmNvbmZpZy5nZXQoJ215LXBhY2thZ2UudGhpbmdWb2x1bWUnKSAjIC0+IDEwXG4jXG4jICMgSXQgcmVzcGVjdHMgdGhlIG1pbiAvIG1heFxuIyBhdG9tLmNvbmZpZy5zZXQoJ215LXBhY2thZ2UudGhpbmdWb2x1bWUnLCAnNDAwJylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLnRoaW5nVm9sdW1lJykgIyAtPiAxMVxuI1xuIyAjIElmIGl0IGNhbm5vdCBiZSBjb2VyY2VkLCB0aGUgdmFsdWUgd2lsbCBub3QgYmUgc2V0XG4jIGF0b20uY29uZmlnLnNldCgnbXktcGFja2FnZS50aGluZ1ZvbHVtZScsICdjYXRzJylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLnRoaW5nVm9sdW1lJykgIyAtPiAxMVxuIyBgYGBcbiNcbiMgIyMjIFN1cHBvcnRlZCBUeXBlc1xuI1xuIyBUaGUgYHR5cGVgIGtleXdvcmQgY2FuIGJlIGEgc3RyaW5nIHdpdGggYW55IG9uZSBvZiB0aGUgZm9sbG93aW5nLiBZb3UgY2FuIGFsc29cbiMgY2hhaW4gdGhlbSBieSBzcGVjaWZ5aW5nIG11bHRpcGxlIGluIGFuIGFuIGFycmF5LiBGb3IgZXhhbXBsZVxuI1xuIyBgYGBjb2ZmZWVcbiMgY29uZmlnOlxuIyAgIHNvbWVTZXR0aW5nOlxuIyAgICAgdHlwZTogWydib29sZWFuJywgJ2ludGVnZXInXVxuIyAgICAgZGVmYXVsdDogNVxuI1xuIyAjIFRoZW5cbiMgYXRvbS5jb25maWcuc2V0KCdteS1wYWNrYWdlLnNvbWVTZXR0aW5nJywgJ3RydWUnKVxuIyBhdG9tLmNvbmZpZy5nZXQoJ215LXBhY2thZ2Uuc29tZVNldHRpbmcnKSAjIC0+IHRydWVcbiNcbiMgYXRvbS5jb25maWcuc2V0KCdteS1wYWNrYWdlLnNvbWVTZXR0aW5nJywgJzEyJylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLnNvbWVTZXR0aW5nJykgIyAtPiAxMlxuIyBgYGBcbiNcbiMgIyMjIyBzdHJpbmdcbiNcbiMgVmFsdWVzIG11c3QgYmUgYSBzdHJpbmcuXG4jXG4jIGBgYGNvZmZlZVxuIyBjb25maWc6XG4jICAgc29tZVNldHRpbmc6XG4jICAgICB0eXBlOiAnc3RyaW5nJ1xuIyAgICAgZGVmYXVsdDogJ2hlbGxvJ1xuIyBgYGBcbiNcbiMgIyMjIyBpbnRlZ2VyXG4jXG4jIFZhbHVlcyB3aWxsIGJlIGNvZXJjZWQgaW50byBpbnRlZ2VyLiBTdXBwb3J0cyB0aGUgKG9wdGlvbmFsKSBgbWluaW11bWAgYW5kXG4jIGBtYXhpbXVtYCBrZXlzLlxuI1xuIyAgIGBgYGNvZmZlZVxuIyAgIGNvbmZpZzpcbiMgICAgIHNvbWVTZXR0aW5nOlxuIyAgICAgICB0eXBlOiAnaW50ZWdlcidcbiMgICAgICAgZGVmYXVsdDogNVxuIyAgICAgICBtaW5pbXVtOiAxXG4jICAgICAgIG1heGltdW06IDExXG4jICAgYGBgXG4jXG4jICMjIyMgbnVtYmVyXG4jXG4jIFZhbHVlcyB3aWxsIGJlIGNvZXJjZWQgaW50byBhIG51bWJlciwgaW5jbHVkaW5nIHJlYWwgbnVtYmVycy4gU3VwcG9ydHMgdGhlXG4jIChvcHRpb25hbCkgYG1pbmltdW1gIGFuZCBgbWF4aW11bWAga2V5cy5cbiNcbiMgYGBgY29mZmVlXG4jIGNvbmZpZzpcbiMgICBzb21lU2V0dGluZzpcbiMgICAgIHR5cGU6ICdudW1iZXInXG4jICAgICBkZWZhdWx0OiA1LjNcbiMgICAgIG1pbmltdW06IDEuNVxuIyAgICAgbWF4aW11bTogMTEuNVxuIyBgYGBcbiNcbiMgIyMjIyBib29sZWFuXG4jXG4jIFZhbHVlcyB3aWxsIGJlIGNvZXJjZWQgaW50byBhIEJvb2xlYW4uIGAndHJ1ZSdgIGFuZCBgJ2ZhbHNlJ2Agd2lsbCBiZSBjb2VyY2VkIGludG9cbiMgYSBib29sZWFuLiBOdW1iZXJzLCBhcnJheXMsIG9iamVjdHMsIGFuZCBhbnl0aGluZyBlbHNlIHdpbGwgbm90IGJlIGNvZXJjZWQuXG4jXG4jIGBgYGNvZmZlZVxuIyBjb25maWc6XG4jICAgc29tZVNldHRpbmc6XG4jICAgICB0eXBlOiAnYm9vbGVhbidcbiMgICAgIGRlZmF1bHQ6IGZhbHNlXG4jIGBgYFxuI1xuIyAjIyMjIGFycmF5XG4jXG4jIFZhbHVlIG11c3QgYmUgYW4gQXJyYXkuIFRoZSB0eXBlcyBvZiB0aGUgdmFsdWVzIGNhbiBiZSBzcGVjaWZpZWQgYnkgYVxuIyBzdWJzY2hlbWEgaW4gdGhlIGBpdGVtc2Aga2V5LlxuI1xuIyBgYGBjb2ZmZWVcbiMgY29uZmlnOlxuIyAgIHNvbWVTZXR0aW5nOlxuIyAgICAgdHlwZTogJ2FycmF5J1xuIyAgICAgZGVmYXVsdDogWzEsIDIsIDNdXG4jICAgICBpdGVtczpcbiMgICAgICAgdHlwZTogJ2ludGVnZXInXG4jICAgICAgIG1pbmltdW06IDEuNVxuIyAgICAgICBtYXhpbXVtOiAxMS41XG4jIGBgYFxuI1xuIyAjIyMjIGNvbG9yXG4jXG4jIFZhbHVlcyB3aWxsIGJlIGNvZXJjZWQgaW50byBhIHtDb2xvcn0gd2l0aCBgcmVkYCwgYGdyZWVuYCwgYGJsdWVgLCBhbmQgYGFscGhhYFxuIyBwcm9wZXJ0aWVzIHRoYXQgYWxsIGhhdmUgbnVtZXJpYyB2YWx1ZXMuIGByZWRgLCBgZ3JlZW5gLCBgYmx1ZWAgd2lsbCBiZSBpblxuIyB0aGUgcmFuZ2UgMCB0byAyNTUgYW5kIGB2YWx1ZWAgd2lsbCBiZSBpbiB0aGUgcmFuZ2UgMCB0byAxLiBWYWx1ZXMgY2FuIGJlIGFueVxuIyB2YWxpZCBDU1MgY29sb3IgZm9ybWF0IHN1Y2ggYXMgYCNhYmNgLCBgI2FiY2RlZmAsIGB3aGl0ZWAsXG4jIGByZ2IoNTAsIDEwMCwgMTUwKWAsIGFuZCBgcmdiYSgyNSwgNzUsIDEyNSwgLjc1KWAuXG4jXG4jIGBgYGNvZmZlZVxuIyBjb25maWc6XG4jICAgc29tZVNldHRpbmc6XG4jICAgICB0eXBlOiAnY29sb3InXG4jICAgICBkZWZhdWx0OiAnd2hpdGUnXG4jIGBgYFxuI1xuIyAjIyMjIG9iamVjdCAvIEdyb3VwaW5nIG90aGVyIHR5cGVzXG4jXG4jIEEgY29uZmlnIHNldHRpbmcgd2l0aCB0aGUgdHlwZSBgb2JqZWN0YCBhbGxvd3MgZ3JvdXBpbmcgYSBzZXQgb2YgY29uZmlnXG4jIHNldHRpbmdzLiBUaGUgZ3JvdXAgd2lsbCBiZSB2aXN1YWx5IHNlcGFyYXRlZCBhbmQgaGFzIGl0cyBvd24gZ3JvdXAgaGVhZGxpbmUuXG4jIFRoZSBzdWIgb3B0aW9ucyBtdXN0IGJlIGxpc3RlZCB1bmRlciBhIGBwcm9wZXJ0aWVzYCBrZXkuXG4jXG4jIGBgYGNvZmZlZVxuIyBjb25maWc6XG4jICAgc29tZVNldHRpbmc6XG4jICAgICB0eXBlOiAnb2JqZWN0J1xuIyAgICAgcHJvcGVydGllczpcbiMgICAgICAgbXlDaGlsZEludE9wdGlvbjpcbiMgICAgICAgICB0eXBlOiAnaW50ZWdlcidcbiMgICAgICAgICBtaW5pbXVtOiAxLjVcbiMgICAgICAgICBtYXhpbXVtOiAxMS41XG4jIGBgYFxuI1xuIyAjIyMgT3RoZXIgU3VwcG9ydGVkIEtleXNcbiNcbiMgIyMjIyBlbnVtXG4jXG4jIEFsbCB0eXBlcyBzdXBwb3J0IGFuIGBlbnVtYCBrZXksIHdoaWNoIGxldHMgeW91IHNwZWNpZnkgYWxsIHRoZSB2YWx1ZXMgdGhlXG4jIHNldHRpbmcgY2FuIHRha2UuIGBlbnVtYCBtYXkgYmUgYW4gYXJyYXkgb2YgYWxsb3dlZCB2YWx1ZXMgKG9mIHRoZSBzcGVjaWZpZWRcbiMgdHlwZSksIG9yIGFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBgdmFsdWVgIGFuZCBgZGVzY3JpcHRpb25gIHByb3BlcnRpZXMsIHdoZXJlXG4jIHRoZSBgdmFsdWVgIGlzIGFuIGFsbG93ZWQgdmFsdWUsIGFuZCB0aGUgYGRlc2NyaXB0aW9uYCBpcyBhIGRlc2NyaXB0aXZlIHN0cmluZ1xuIyB1c2VkIGluIHRoZSBzZXR0aW5ncyB2aWV3LlxuI1xuIyBJbiB0aGlzIGV4YW1wbGUsIHRoZSBzZXR0aW5nIG11c3QgYmUgb25lIG9mIHRoZSA0IGludGVnZXJzOlxuI1xuIyBgYGBjb2ZmZWVcbiMgY29uZmlnOlxuIyAgIHNvbWVTZXR0aW5nOlxuIyAgICAgdHlwZTogJ2ludGVnZXInXG4jICAgICBkZWZhdWx0OiA0XG4jICAgICBlbnVtOiBbMiwgNCwgNiwgOF1cbiMgYGBgXG4jXG4jIEluIHRoaXMgZXhhbXBsZSwgdGhlIHNldHRpbmcgbXVzdCBiZSBlaXRoZXIgJ2Zvbycgb3IgJ2JhcicsIHdoaWNoIGFyZVxuIyBwcmVzZW50ZWQgdXNpbmcgdGhlIHByb3ZpZGVkIGRlc2NyaXB0aW9ucyBpbiB0aGUgc2V0dGluZ3MgcGFuZTpcbiNcbiMgYGBgY29mZmVlXG4jIGNvbmZpZzpcbiMgICBzb21lU2V0dGluZzpcbiMgICAgIHR5cGU6ICdzdHJpbmcnXG4jICAgICBkZWZhdWx0OiAnZm9vJ1xuIyAgICAgZW51bTogW1xuIyAgICAgICB7dmFsdWU6ICdmb28nLCBkZXNjcmlwdGlvbjogJ0ZvbyBtb2RlLiBZb3Ugd2FudCB0aGlzLid9XG4jICAgICAgIHt2YWx1ZTogJ2JhcicsIGRlc2NyaXB0aW9uOiAnQmFyIG1vZGUuIE5vYm9keSB3YW50cyB0aGF0ISd9XG4jICAgICBdXG4jIGBgYFxuI1xuIyBVc2FnZTpcbiNcbiMgYGBgY29mZmVlXG4jIGF0b20uY29uZmlnLnNldCgnbXktcGFja2FnZS5zb21lU2V0dGluZycsICcyJylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLnNvbWVTZXR0aW5nJykgIyAtPiAyXG4jXG4jICMgd2lsbCBub3Qgc2V0IHZhbHVlcyBvdXRzaWRlIG9mIHRoZSBlbnVtIHZhbHVlc1xuIyBhdG9tLmNvbmZpZy5zZXQoJ215LXBhY2thZ2Uuc29tZVNldHRpbmcnLCAnMycpXG4jIGF0b20uY29uZmlnLmdldCgnbXktcGFja2FnZS5zb21lU2V0dGluZycpICMgLT4gMlxuI1xuIyAjIElmIGl0IGNhbm5vdCBiZSBjb2VyY2VkLCB0aGUgdmFsdWUgd2lsbCBub3QgYmUgc2V0XG4jIGF0b20uY29uZmlnLnNldCgnbXktcGFja2FnZS5zb21lU2V0dGluZycsICc0JylcbiMgYXRvbS5jb25maWcuZ2V0KCdteS1wYWNrYWdlLnNvbWVTZXR0aW5nJykgIyAtPiA0XG4jIGBgYFxuI1xuIyAjIyMjIHRpdGxlIGFuZCBkZXNjcmlwdGlvblxuI1xuIyBUaGUgc2V0dGluZ3MgdmlldyB3aWxsIHVzZSB0aGUgYHRpdGxlYCBhbmQgYGRlc2NyaXB0aW9uYCBrZXlzIHRvIGRpc3BsYXkgeW91clxuIyBjb25maWcgc2V0dGluZyBpbiBhIHJlYWRhYmxlIHdheS4gQnkgZGVmYXVsdCB0aGUgc2V0dGluZ3MgdmlldyBodW1hbml6ZXMgeW91clxuIyBjb25maWcga2V5LCBzbyBgc29tZVNldHRpbmdgIGJlY29tZXMgYFNvbWUgU2V0dGluZ2AuIEluIHNvbWUgY2FzZXMsIHRoaXMgaXNcbiMgY29uZnVzaW5nIGZvciB1c2VycywgYW5kIGEgbW9yZSBkZXNjcmlwdGl2ZSB0aXRsZSBpcyB1c2VmdWwuXG4jXG4jIERlc2NyaXB0aW9ucyB3aWxsIGJlIGRpc3BsYXllZCBiZWxvdyB0aGUgdGl0bGUgaW4gdGhlIHNldHRpbmdzIHZpZXcuXG4jXG4jIEZvciBhIGdyb3VwIG9mIGNvbmZpZyBzZXR0aW5ncyB0aGUgaHVtYW5pemVkIGtleSBvciB0aGUgdGl0bGUgYW5kIHRoZVxuIyBkZXNjcmlwdGlvbiBhcmUgdXNlZCBmb3IgdGhlIGdyb3VwIGhlYWRsaW5lLlxuI1xuIyBgYGBjb2ZmZWVcbiMgY29uZmlnOlxuIyAgIHNvbWVTZXR0aW5nOlxuIyAgICAgdGl0bGU6ICdTZXR0aW5nIE1hZ25pdHVkZSdcbiMgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyB3aWxsIGFmZmVjdCB0aGUgYmxhaCBhbmQgdGhlIG90aGVyIGJsYWgnXG4jICAgICB0eXBlOiAnaW50ZWdlcidcbiMgICAgIGRlZmF1bHQ6IDRcbiMgYGBgXG4jXG4jIF9fTm90ZV9fOiBZb3Ugc2hvdWxkIHN0cml2ZSB0byBiZSBzbyBjbGVhciBpbiB5b3VyIG5hbWluZyBvZiB0aGUgc2V0dGluZyB0aGF0XG4jIHlvdSBkbyBub3QgbmVlZCB0byBzcGVjaWZ5IGEgdGl0bGUgb3IgZGVzY3JpcHRpb24hXG4jXG4jIERlc2NyaXB0aW9ucyBhbGxvdyBhIHN1YnNldCBvZlxuIyBbTWFya2Rvd24gZm9ybWF0dGluZ10oaHR0cHM6Ly9oZWxwLmdpdGh1Yi5jb20vYXJ0aWNsZXMvZ2l0aHViLWZsYXZvcmVkLW1hcmtkb3duLykuXG4jIFNwZWNpZmljYWxseSwgeW91IG1heSB1c2UgdGhlIGZvbGxvd2luZyBpbiBjb25maWd1cmF0aW9uIHNldHRpbmcgZGVzY3JpcHRpb25zOlxuI1xuIyAqICoqYm9sZCoqIC0gYCoqYm9sZCoqYFxuIyAqICppdGFsaWNzKiAtIGAqaXRhbGljcypgXG4jICogW2xpbmtzXShodHRwczovL2F0b20uaW8pIC0gYFtsaW5rc10oaHR0cHM6Ly9hdG9tLmlvKWBcbiMgKiBgY29kZSBzcGFuc2AgLSBgXFxgY29kZSBzcGFuc1xcYGBcbiMgKiBsaW5lIGJyZWFrcyAtIGBsaW5lIGJyZWFrczxici8+YFxuIyAqIH5+c3RyaWtldGhyb3VnaH5+IC0gYH5+c3RyaWtldGhyb3VnaH5+YFxuI1xuIyAjIyMjIG9yZGVyXG4jXG4jIFRoZSBzZXR0aW5ncyB2aWV3IG9yZGVycyB5b3VyIHNldHRpbmdzIGFscGhhYmV0aWNhbGx5LiBZb3UgY2FuIG92ZXJyaWRlIHRoaXNcbiMgb3JkZXJpbmcgd2l0aCB0aGUgb3JkZXIga2V5LlxuI1xuIyBgYGBjb2ZmZWVcbiMgY29uZmlnOlxuIyAgIHpTZXR0aW5nOlxuIyAgICAgdHlwZTogJ2ludGVnZXInXG4jICAgICBkZWZhdWx0OiA0XG4jICAgICBvcmRlcjogMVxuIyAgIGFTZXR0aW5nOlxuIyAgICAgdHlwZTogJ2ludGVnZXInXG4jICAgICBkZWZhdWx0OiA0XG4jICAgICBvcmRlcjogMlxuIyBgYGBcbiNcbiMgIyMgQmVzdCBwcmFjdGljZXNcbiNcbiMgKiBEb24ndCBkZXBlbmQgb24gKG9yIHdyaXRlIHRvKSBjb25maWd1cmF0aW9uIGtleXMgb3V0c2lkZSBvZiB5b3VyIGtleXBhdGguXG4jXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb25maWdcbiAgQHNjaGVtYUVuZm9yY2VycyA9IHt9XG5cbiAgQGFkZFNjaGVtYUVuZm9yY2VyOiAodHlwZU5hbWUsIGVuZm9yY2VyRnVuY3Rpb24pIC0+XG4gICAgQHNjaGVtYUVuZm9yY2Vyc1t0eXBlTmFtZV0gPz0gW11cbiAgICBAc2NoZW1hRW5mb3JjZXJzW3R5cGVOYW1lXS5wdXNoKGVuZm9yY2VyRnVuY3Rpb24pXG5cbiAgQGFkZFNjaGVtYUVuZm9yY2VyczogKGZpbHRlcnMpIC0+XG4gICAgZm9yIHR5cGVOYW1lLCBmdW5jdGlvbnMgb2YgZmlsdGVyc1xuICAgICAgZm9yIG5hbWUsIGVuZm9yY2VyRnVuY3Rpb24gb2YgZnVuY3Rpb25zXG4gICAgICAgIEBhZGRTY2hlbWFFbmZvcmNlcih0eXBlTmFtZSwgZW5mb3JjZXJGdW5jdGlvbilcbiAgICByZXR1cm5cblxuICBAZXhlY3V0ZVNjaGVtYUVuZm9yY2VyczogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgZXJyb3IgPSBudWxsXG4gICAgdHlwZXMgPSBzY2hlbWEudHlwZVxuICAgIHR5cGVzID0gW3R5cGVzXSB1bmxlc3MgQXJyYXkuaXNBcnJheSh0eXBlcylcbiAgICBmb3IgdHlwZSBpbiB0eXBlc1xuICAgICAgdHJ5XG4gICAgICAgIGVuZm9yY2VyRnVuY3Rpb25zID0gQHNjaGVtYUVuZm9yY2Vyc1t0eXBlXS5jb25jYXQoQHNjaGVtYUVuZm9yY2Vyc1snKiddKVxuICAgICAgICBmb3IgZW5mb3JjZXIgaW4gZW5mb3JjZXJGdW5jdGlvbnNcbiAgICAgICAgICAjIEF0IHNvbWUgcG9pbnQgaW4gb25lJ3MgbGlmZSwgb25lIG11c3QgY2FsbCB1cG9uIGFuIGVuZm9yY2VyLlxuICAgICAgICAgIHZhbHVlID0gZW5mb3JjZXIuY2FsbCh0aGlzLCBrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKVxuICAgICAgICBlcnJvciA9IG51bGxcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgZXJyb3IgPSBlXG5cbiAgICB0aHJvdyBlcnJvciBpZiBlcnJvcj9cbiAgICB2YWx1ZVxuXG4gICMgQ3JlYXRlZCBkdXJpbmcgaW5pdGlhbGl6YXRpb24sIGF2YWlsYWJsZSBhcyBgYXRvbS5jb25maWdgXG4gIGNvbnN0cnVjdG9yOiAoe0Bjb25maWdEaXJQYXRoLCBAcmVzb3VyY2VQYXRoLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGVuYWJsZVBlcnNpc3RlbmNlfT17fSkgLT5cbiAgICBpZiBAZW5hYmxlUGVyc2lzdGVuY2U/XG4gICAgICBAY29uZmlnRmlsZVBhdGggPSBmcy5yZXNvbHZlKEBjb25maWdEaXJQYXRoLCAnY29uZmlnJywgWydqc29uJywgJ2Nzb24nXSlcbiAgICAgIEBjb25maWdGaWxlUGF0aCA/PSBwYXRoLmpvaW4oQGNvbmZpZ0RpclBhdGgsICdjb25maWcuY3NvbicpXG4gICAgQGNsZWFyKClcblxuICBjbGVhcjogLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHNjaGVtYSA9XG4gICAgICB0eXBlOiAnb2JqZWN0J1xuICAgICAgcHJvcGVydGllczoge31cbiAgICBAZGVmYXVsdFNldHRpbmdzID0ge31cbiAgICBAc2V0dGluZ3MgPSB7fVxuICAgIEBzY29wZWRTZXR0aW5nc1N0b3JlID0gbmV3IFNjb3BlZFByb3BlcnR5U3RvcmVcbiAgICBAY29uZmlnRmlsZUhhc0Vycm9ycyA9IGZhbHNlXG4gICAgQHRyYW5zYWN0RGVwdGggPSAwXG4gICAgQHNhdmVQZW5kaW5nID0gZmFsc2VcbiAgICBAcmVxdWVzdExvYWQgPSBfLmRlYm91bmNlKEBsb2FkVXNlckNvbmZpZywgMTAwKVxuICAgIEByZXF1ZXN0U2F2ZSA9ID0+XG4gICAgICBAc2F2ZVBlbmRpbmcgPSB0cnVlXG4gICAgICBkZWJvdW5jZWRTYXZlLmNhbGwodGhpcylcbiAgICBzYXZlID0gPT5cbiAgICAgIEBzYXZlUGVuZGluZyA9IGZhbHNlXG4gICAgICBAc2F2ZSgpXG4gICAgZGVib3VuY2VkU2F2ZSA9IF8uZGVib3VuY2Uoc2F2ZSwgMTAwKVxuXG4gIHNob3VsZE5vdEFjY2Vzc0ZpbGVTeXN0ZW06IC0+IG5vdCBAZW5hYmxlUGVyc2lzdGVuY2VcblxuICAjIyNcbiAgU2VjdGlvbjogQ29uZmlnIFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIEVzc2VudGlhbDogQWRkIGEgbGlzdGVuZXIgZm9yIGNoYW5nZXMgdG8gYSBnaXZlbiBrZXkgcGF0aC4gVGhpcyBpcyBkaWZmZXJlbnRcbiAgIyB0aGFuIHs6Om9uRGlkQ2hhbmdlfSBpbiB0aGF0IGl0IHdpbGwgaW1tZWRpYXRlbHkgY2FsbCB5b3VyIGNhbGxiYWNrIHdpdGggdGhlXG4gICMgY3VycmVudCB2YWx1ZSBvZiB0aGUgY29uZmlnIGVudHJ5LlxuICAjXG4gICMgIyMjIEV4YW1wbGVzXG4gICNcbiAgIyBZb3UgbWlnaHQgd2FudCB0byBiZSBub3RpZmllZCB3aGVuIHRoZSB0aGVtZXMgY2hhbmdlLiBXZSdsbCB3YXRjaFxuICAjIGBjb3JlLnRoZW1lc2AgZm9yIGNoYW5nZXNcbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIGF0b20uY29uZmlnLm9ic2VydmUgJ2NvcmUudGhlbWVzJywgKHZhbHVlKSAtPlxuICAjICAgIyBkbyBzdHVmZiB3aXRoIHZhbHVlXG4gICMgYGBgXG4gICNcbiAgIyAqIGBrZXlQYXRoYCB7U3RyaW5nfSBuYW1lIG9mIHRoZSBrZXkgdG8gb2JzZXJ2ZVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYHNjb3BlYCAob3B0aW9uYWwpIHtTY29wZURlc2NyaXB0b3J9IGRlc2NyaWJpbmcgYSBwYXRoIGZyb21cbiAgIyAgICAgdGhlIHJvb3Qgb2YgdGhlIHN5bnRheCB0cmVlIHRvIGEgdG9rZW4uIEdldCBvbmUgYnkgY2FsbGluZ1xuICAjICAgICB7ZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRTY29wZURlc2NyaXB0b3IoKX0uIFNlZSB7OjpnZXR9IGZvciBleGFtcGxlcy5cbiAgIyAgICAgU2VlIFt0aGUgc2NvcGVzIGRvY3NdKGh0dHA6Ly9mbGlnaHQtbWFudWFsLmF0b20uaW8vYmVoaW5kLWF0b20vc2VjdGlvbnMvc2NvcGVkLXNldHRpbmdzLXNjb3Blcy1hbmQtc2NvcGUtZGVzY3JpcHRvcnMvKVxuICAjICAgICBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBjYWxsIHdoZW4gdGhlIHZhbHVlIG9mIHRoZSBrZXkgY2hhbmdlcy5cbiAgIyAgICogYHZhbHVlYCB0aGUgbmV3IHZhbHVlIG9mIHRoZSBrZXlcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXMgb24gd2hpY2ggeW91IGNhbiBjYWxsXG4gICMgYC5kaXNwb3NlKClgIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlOiAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggaXMgMlxuICAgICAgW2tleVBhdGgsIGNhbGxiYWNrXSA9IGFyZ3VtZW50c1xuICAgIGVsc2UgaWYgYXJndW1lbnRzLmxlbmd0aCBpcyAzIGFuZCAoXy5pc1N0cmluZyhhcmd1bWVudHNbMF0pIGFuZCBfLmlzT2JqZWN0KGFyZ3VtZW50c1sxXSkpXG4gICAgICBba2V5UGF0aCwgb3B0aW9ucywgY2FsbGJhY2tdID0gYXJndW1lbnRzXG4gICAgICBzY29wZURlc2NyaXB0b3IgPSBvcHRpb25zLnNjb3BlXG4gICAgZWxzZVxuICAgICAgY29uc29sZS5lcnJvciAnQW4gdW5zdXBwb3J0ZWQgZm9ybSBvZiBDb25maWc6Om9ic2VydmUgaXMgYmVpbmcgdXNlZC4gU2VlIGh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS9sYXRlc3QvQ29uZmlnIGZvciBkZXRhaWxzJ1xuICAgICAgcmV0dXJuXG5cbiAgICBpZiBzY29wZURlc2NyaXB0b3I/XG4gICAgICBAb2JzZXJ2ZVNjb3BlZEtleVBhdGgoc2NvcGVEZXNjcmlwdG9yLCBrZXlQYXRoLCBjYWxsYmFjaylcbiAgICBlbHNlXG4gICAgICBAb2JzZXJ2ZUtleVBhdGgoa2V5UGF0aCwgb3B0aW9ucyA/IHt9LCBjYWxsYmFjaylcblxuICAjIEVzc2VudGlhbDogQWRkIGEgbGlzdGVuZXIgZm9yIGNoYW5nZXMgdG8gYSBnaXZlbiBrZXkgcGF0aC4gSWYgYGtleVBhdGhgIGlzXG4gICMgbm90IHNwZWNpZmllZCwgeW91ciBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBvbiBjaGFuZ2VzIHRvIGFueSBrZXkuXG4gICNcbiAgIyAqIGBrZXlQYXRoYCAob3B0aW9uYWwpIHtTdHJpbmd9IG5hbWUgb2YgdGhlIGtleSB0byBvYnNlcnZlLiBNdXN0IGJlXG4gICMgICBzcGVjaWZpZWQgaWYgYHNjb3BlRGVzY3JpcHRvcmAgaXMgc3BlY2lmaWVkLlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYHNjb3BlYCAob3B0aW9uYWwpIHtTY29wZURlc2NyaXB0b3J9IGRlc2NyaWJpbmcgYSBwYXRoIGZyb21cbiAgIyAgICAgdGhlIHJvb3Qgb2YgdGhlIHN5bnRheCB0cmVlIHRvIGEgdG9rZW4uIEdldCBvbmUgYnkgY2FsbGluZ1xuICAjICAgICB7ZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRTY29wZURlc2NyaXB0b3IoKX0uIFNlZSB7OjpnZXR9IGZvciBleGFtcGxlcy5cbiAgIyAgICAgU2VlIFt0aGUgc2NvcGVzIGRvY3NdKGh0dHA6Ly9mbGlnaHQtbWFudWFsLmF0b20uaW8vYmVoaW5kLWF0b20vc2VjdGlvbnMvc2NvcGVkLXNldHRpbmdzLXNjb3Blcy1hbmQtc2NvcGUtZGVzY3JpcHRvcnMvKVxuICAjICAgICBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBjYWxsIHdoZW4gdGhlIHZhbHVlIG9mIHRoZSBrZXkgY2hhbmdlcy5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fVxuICAjICAgICAqIGBuZXdWYWx1ZWAgdGhlIG5ldyB2YWx1ZSBvZiB0aGUga2V5XG4gICMgICAgICogYG9sZFZhbHVlYCB0aGUgcHJpb3IgdmFsdWUgb2YgdGhlIGtleS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXMgb24gd2hpY2ggeW91IGNhbiBjYWxsXG4gICMgYC5kaXNwb3NlKClgIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZTogLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoIGlzIDFcbiAgICAgIFtjYWxsYmFja10gPSBhcmd1bWVudHNcbiAgICBlbHNlIGlmIGFyZ3VtZW50cy5sZW5ndGggaXMgMlxuICAgICAgW2tleVBhdGgsIGNhbGxiYWNrXSA9IGFyZ3VtZW50c1xuICAgIGVsc2VcbiAgICAgIFtrZXlQYXRoLCBvcHRpb25zLCBjYWxsYmFja10gPSBhcmd1bWVudHNcbiAgICAgIHNjb3BlRGVzY3JpcHRvciA9IG9wdGlvbnMuc2NvcGVcblxuICAgIGlmIHNjb3BlRGVzY3JpcHRvcj9cbiAgICAgIEBvbkRpZENoYW5nZVNjb3BlZEtleVBhdGgoc2NvcGVEZXNjcmlwdG9yLCBrZXlQYXRoLCBjYWxsYmFjaylcbiAgICBlbHNlXG4gICAgICBAb25EaWRDaGFuZ2VLZXlQYXRoKGtleVBhdGgsIGNhbGxiYWNrKVxuXG4gICMjI1xuICBTZWN0aW9uOiBNYW5hZ2luZyBTZXR0aW5nc1xuICAjIyNcblxuICAjIEVzc2VudGlhbDogUmV0cmlldmVzIHRoZSBzZXR0aW5nIGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAjXG4gICMgIyMjIEV4YW1wbGVzXG4gICNcbiAgIyBZb3UgbWlnaHQgd2FudCB0byBrbm93IHdoYXQgdGhlbWVzIGFyZSBlbmFibGVkLCBzbyBjaGVjayBgY29yZS50aGVtZXNgXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUudGhlbWVzJylcbiAgIyBgYGBcbiAgI1xuICAjIFdpdGggc2NvcGUgZGVzY3JpcHRvcnMgeW91IGNhbiBnZXQgc2V0dGluZ3Mgd2l0aGluIGEgc3BlY2lmaWMgZWRpdG9yXG4gICMgc2NvcGUuIEZvciBleGFtcGxlLCB5b3UgbWlnaHQgd2FudCB0byBrbm93IGBlZGl0b3IudGFiTGVuZ3RoYCBmb3IgcnVieVxuICAjIGZpbGVzLlxuICAjXG4gICMgYGBgY29mZmVlXG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgc2NvcGU6IFsnc291cmNlLnJ1YnknXSkgIyA9PiAyXG4gICMgYGBgXG4gICNcbiAgIyBUaGlzIHNldHRpbmcgaW4gcnVieSBmaWxlcyBtaWdodCBiZSBkaWZmZXJlbnQgdGhhbiB0aGUgZ2xvYmFsIHRhYkxlbmd0aCBzZXR0aW5nXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJMZW5ndGgnKSAjID0+IDRcbiAgIyBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJMZW5ndGgnLCBzY29wZTogWydzb3VyY2UucnVieSddKSAjID0+IDJcbiAgIyBgYGBcbiAgI1xuICAjIFlvdSBjYW4gZ2V0IHRoZSBsYW5ndWFnZSBzY29wZSBkZXNjcmlwdG9yIHZpYVxuICAjIHtUZXh0RWRpdG9yOjpnZXRSb290U2NvcGVEZXNjcmlwdG9yfS4gVGhpcyB3aWxsIGdldCB0aGUgc2V0dGluZyBzcGVjaWZpY2FsbHlcbiAgIyBmb3IgdGhlIGVkaXRvcidzIGxhbmd1YWdlLlxuICAjXG4gICMgYGBgY29mZmVlXG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgc2NvcGU6IEBlZGl0b3IuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpKSAjID0+IDJcbiAgIyBgYGBcbiAgI1xuICAjIEFkZGl0aW9uYWxseSwgeW91IGNhbiBnZXQgdGhlIHNldHRpbmcgYXQgdGhlIHNwZWNpZmljIGN1cnNvciBwb3NpdGlvbi5cbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIHNjb3BlRGVzY3JpcHRvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldFNjb3BlRGVzY3JpcHRvcigpXG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgc2NvcGU6IHNjb3BlRGVzY3JpcHRvcikgIyA9PiAyXG4gICMgYGBgXG4gICNcbiAgIyAqIGBrZXlQYXRoYCBUaGUge1N0cmluZ30gbmFtZSBvZiB0aGUga2V5IHRvIHJldHJpZXZlLlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYHNvdXJjZXNgIChvcHRpb25hbCkge0FycmF5fSBvZiB7U3RyaW5nfSBzb3VyY2UgbmFtZXMuIElmIHByb3ZpZGVkLCBvbmx5XG4gICMgICAgIHZhbHVlcyB0aGF0IHdlcmUgYXNzb2NpYXRlZCB3aXRoIHRoZXNlIHNvdXJjZXMgZHVyaW5nIHs6OnNldH0gd2lsbCBiZSB1c2VkLlxuICAjICAgKiBgZXhjbHVkZVNvdXJjZXNgIChvcHRpb25hbCkge0FycmF5fSBvZiB7U3RyaW5nfSBzb3VyY2UgbmFtZXMuIElmIHByb3ZpZGVkLFxuICAjICAgICB2YWx1ZXMgdGhhdCAgd2VyZSBhc3NvY2lhdGVkIHdpdGggdGhlc2Ugc291cmNlcyBkdXJpbmcgezo6c2V0fSB3aWxsIG5vdFxuICAjICAgICBiZSB1c2VkLlxuICAjICAgKiBgc2NvcGVgIChvcHRpb25hbCkge1Njb3BlRGVzY3JpcHRvcn0gZGVzY3JpYmluZyBhIHBhdGggZnJvbVxuICAjICAgICB0aGUgcm9vdCBvZiB0aGUgc3ludGF4IHRyZWUgdG8gYSB0b2tlbi4gR2V0IG9uZSBieSBjYWxsaW5nXG4gICMgICAgIHtlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldFNjb3BlRGVzY3JpcHRvcigpfVxuICAjICAgICBTZWUgW3RoZSBzY29wZXMgZG9jc10oaHR0cDovL2ZsaWdodC1tYW51YWwuYXRvbS5pby9iZWhpbmQtYXRvbS9zZWN0aW9ucy9zY29wZWQtc2V0dGluZ3Mtc2NvcGVzLWFuZC1zY29wZS1kZXNjcmlwdG9ycy8pXG4gICMgICAgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAjXG4gICMgUmV0dXJucyB0aGUgdmFsdWUgZnJvbSBBdG9tJ3MgZGVmYXVsdCBzZXR0aW5ncywgdGhlIHVzZXIncyBjb25maWd1cmF0aW9uXG4gICMgZmlsZSBpbiB0aGUgdHlwZSBzcGVjaWZpZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gc2NoZW1hLlxuICBnZXQ6IC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA+IDFcbiAgICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZycgb3Igbm90IGFyZ3VtZW50c1swXT9cbiAgICAgICAgW2tleVBhdGgsIG9wdGlvbnNdID0gYXJndW1lbnRzXG4gICAgICAgIHtzY29wZX0gPSBvcHRpb25zXG4gICAgZWxzZVxuICAgICAgW2tleVBhdGhdID0gYXJndW1lbnRzXG5cbiAgICBpZiBzY29wZT9cbiAgICAgIHZhbHVlID0gQGdldFJhd1Njb3BlZFZhbHVlKHNjb3BlLCBrZXlQYXRoLCBvcHRpb25zKVxuICAgICAgdmFsdWUgPyBAZ2V0UmF3VmFsdWUoa2V5UGF0aCwgb3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBAZ2V0UmF3VmFsdWUoa2V5UGF0aCwgb3B0aW9ucylcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIG9mIHRoZSB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBrZXktcGF0aCwgYWxvbmcgd2l0aCB0aGVpclxuICAjIGFzc29jaWF0ZWQgc2NvcGUgc2VsZWN0b3IuXG4gICNcbiAgIyAqIGBrZXlQYXRoYCBUaGUge1N0cmluZ30gbmFtZSBvZiB0aGUga2V5IHRvIHJldHJpZXZlXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSBzZWUgdGhlIGBvcHRpb25zYCBhcmd1bWVudCB0byB7OjpnZXR9XG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge09iamVjdH1zIHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAqIGBzY29wZURlc2NyaXB0b3JgIFRoZSB7U2NvcGVEZXNjcmlwdG9yfSB3aXRoIHdoaWNoIHRoZSB2YWx1ZSBpcyBhc3NvY2lhdGVkXG4gICMgICogYHZhbHVlYCBUaGUgdmFsdWUgZm9yIHRoZSBrZXktcGF0aFxuICBnZXRBbGw6IChrZXlQYXRoLCBvcHRpb25zKSAtPlxuICAgIHtzY29wZX0gPSBvcHRpb25zIGlmIG9wdGlvbnM/XG4gICAgcmVzdWx0ID0gW11cblxuICAgIGlmIHNjb3BlP1xuICAgICAgc2NvcGVEZXNjcmlwdG9yID0gU2NvcGVEZXNjcmlwdG9yLmZyb21PYmplY3Qoc2NvcGUpXG4gICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0IEBzY29wZWRTZXR0aW5nc1N0b3JlLmdldEFsbChzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVDaGFpbigpLCBrZXlQYXRoLCBvcHRpb25zKVxuXG4gICAgaWYgZ2xvYmFsVmFsdWUgPSBAZ2V0UmF3VmFsdWUoa2V5UGF0aCwgb3B0aW9ucylcbiAgICAgIHJlc3VsdC5wdXNoKHNjb3BlU2VsZWN0b3I6ICcqJywgdmFsdWU6IGdsb2JhbFZhbHVlKVxuXG4gICAgcmVzdWx0XG5cbiAgIyBFc3NlbnRpYWw6IFNldHMgdGhlIHZhbHVlIGZvciBhIGNvbmZpZ3VyYXRpb24gc2V0dGluZy5cbiAgI1xuICAjIFRoaXMgdmFsdWUgaXMgc3RvcmVkIGluIEF0b20ncyBpbnRlcm5hbCBjb25maWd1cmF0aW9uIGZpbGUuXG4gICNcbiAgIyAjIyMgRXhhbXBsZXNcbiAgI1xuICAjIFlvdSBtaWdodCB3YW50IHRvIGNoYW5nZSB0aGUgdGhlbWVzIHByb2dyYW1tYXRpY2FsbHk6XG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBhdG9tLmNvbmZpZy5zZXQoJ2NvcmUudGhlbWVzJywgWydhdG9tLWxpZ2h0LXVpJywgJ2F0b20tbGlnaHQtc3ludGF4J10pXG4gICMgYGBgXG4gICNcbiAgIyBZb3UgY2FuIGFsc28gc2V0IHNjb3BlZCBzZXR0aW5ncy4gRm9yIGV4YW1wbGUsIHlvdSBtaWdodCB3YW50IGNoYW5nZSB0aGVcbiAgIyBgZWRpdG9yLnRhYkxlbmd0aGAgb25seSBmb3IgcnVieSBmaWxlcy5cbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnRhYkxlbmd0aCcpICMgPT4gNFxuICAjIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnRhYkxlbmd0aCcsIHNjb3BlOiBbJ3NvdXJjZS5ydWJ5J10pICMgPT4gNFxuICAjIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnRhYkxlbmd0aCcsIHNjb3BlOiBbJ3NvdXJjZS5qcyddKSAjID0+IDRcbiAgI1xuICAjICMgU2V0IHJ1YnkgdG8gMlxuICAjIGF0b20uY29uZmlnLnNldCgnZWRpdG9yLnRhYkxlbmd0aCcsIDIsIHNjb3BlU2VsZWN0b3I6ICcuc291cmNlLnJ1YnknKSAjID0+IHRydWVcbiAgI1xuICAjICMgTm90aWNlIGl0J3Mgb25seSBzZXQgdG8gMiBpbiB0aGUgY2FzZSBvZiBydWJ5XG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJykgIyA9PiA0XG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgc2NvcGU6IFsnc291cmNlLnJ1YnknXSkgIyA9PiAyXG4gICMgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IudGFiTGVuZ3RoJywgc2NvcGU6IFsnc291cmNlLmpzJ10pICMgPT4gNFxuICAjIGBgYFxuICAjXG4gICMgKiBga2V5UGF0aGAgVGhlIHtTdHJpbmd9IG5hbWUgb2YgdGhlIGtleS5cbiAgIyAqIGB2YWx1ZWAgVGhlIHZhbHVlIG9mIHRoZSBzZXR0aW5nLiBQYXNzaW5nIGB1bmRlZmluZWRgIHdpbGwgcmV2ZXJ0IHRoZVxuICAjICAgc2V0dGluZyB0byB0aGUgZGVmYXVsdCB2YWx1ZS5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBzY29wZVNlbGVjdG9yYCAob3B0aW9uYWwpIHtTdHJpbmd9LiBlZy4gJy5zb3VyY2UucnVieSdcbiAgIyAgICAgU2VlIFt0aGUgc2NvcGVzIGRvY3NdKGh0dHA6Ly9mbGlnaHQtbWFudWFsLmF0b20uaW8vYmVoaW5kLWF0b20vc2VjdGlvbnMvc2NvcGVkLXNldHRpbmdzLXNjb3Blcy1hbmQtc2NvcGUtZGVzY3JpcHRvcnMvKVxuICAjICAgICBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHNvdXJjZWAgKG9wdGlvbmFsKSB7U3RyaW5nfSBUaGUgbmFtZSBvZiBhIGZpbGUgd2l0aCB3aGljaCB0aGUgc2V0dGluZ1xuICAjICAgICBpcyBhc3NvY2lhdGVkLiBEZWZhdWx0cyB0byB0aGUgdXNlcidzIGNvbmZpZyBmaWxlLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufVxuICAjICogYHRydWVgIGlmIHRoZSB2YWx1ZSB3YXMgc2V0LlxuICAjICogYGZhbHNlYCBpZiB0aGUgdmFsdWUgd2FzIG5vdCBhYmxlIHRvIGJlIGNvZXJjZWQgdG8gdGhlIHR5cGUgc3BlY2lmaWVkIGluIHRoZSBzZXR0aW5nJ3Mgc2NoZW1hLlxuICBzZXQ6IC0+XG4gICAgW2tleVBhdGgsIHZhbHVlLCBvcHRpb25zXSA9IGFyZ3VtZW50c1xuICAgIHNjb3BlU2VsZWN0b3IgPSBvcHRpb25zPy5zY29wZVNlbGVjdG9yXG4gICAgc291cmNlID0gb3B0aW9ucz8uc291cmNlXG4gICAgc2hvdWxkU2F2ZSA9IG9wdGlvbnM/LnNhdmUgPyB0cnVlXG5cbiAgICBpZiBzb3VyY2UgYW5kIG5vdCBzY29wZVNlbGVjdG9yXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCI6OnNldCB3aXRoIGEgJ3NvdXJjZScgYW5kIG5vICdzb3VyY2VTZWxlY3RvcicgaXMgbm90IHlldCBpbXBsZW1lbnRlZCFcIilcblxuICAgIHNvdXJjZSA/PSBAZ2V0VXNlckNvbmZpZ1BhdGgoKVxuXG4gICAgdW5sZXNzIHZhbHVlIGlzIHVuZGVmaW5lZFxuICAgICAgdHJ5XG4gICAgICAgIHZhbHVlID0gQG1ha2VWYWx1ZUNvbmZvcm1Ub1NjaGVtYShrZXlQYXRoLCB2YWx1ZSlcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBzY29wZVNlbGVjdG9yP1xuICAgICAgQHNldFJhd1Njb3BlZFZhbHVlKGtleVBhdGgsIHZhbHVlLCBzb3VyY2UsIHNjb3BlU2VsZWN0b3IpXG4gICAgZWxzZVxuICAgICAgQHNldFJhd1ZhbHVlKGtleVBhdGgsIHZhbHVlKVxuXG4gICAgQHJlcXVlc3RTYXZlKCkgaWYgc291cmNlIGlzIEBnZXRVc2VyQ29uZmlnUGF0aCgpIGFuZCBzaG91bGRTYXZlIGFuZCBub3QgQGNvbmZpZ0ZpbGVIYXNFcnJvcnNcbiAgICB0cnVlXG5cbiAgIyBFc3NlbnRpYWw6IFJlc3RvcmUgdGhlIHNldHRpbmcgYXQgYGtleVBhdGhgIHRvIGl0cyBkZWZhdWx0IHZhbHVlLlxuICAjXG4gICMgKiBga2V5UGF0aGAgVGhlIHtTdHJpbmd9IG5hbWUgb2YgdGhlIGtleS5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBzY29wZVNlbGVjdG9yYCAob3B0aW9uYWwpIHtTdHJpbmd9LiBTZWUgezo6c2V0fVxuICAjICAgKiBgc291cmNlYCAob3B0aW9uYWwpIHtTdHJpbmd9LiBTZWUgezo6c2V0fVxuICB1bnNldDogKGtleVBhdGgsIG9wdGlvbnMpIC0+XG4gICAge3Njb3BlU2VsZWN0b3IsIHNvdXJjZX0gPSBvcHRpb25zID8ge31cbiAgICBzb3VyY2UgPz0gQGdldFVzZXJDb25maWdQYXRoKClcblxuICAgIGlmIHNjb3BlU2VsZWN0b3I/XG4gICAgICBpZiBrZXlQYXRoP1xuICAgICAgICBzZXR0aW5ncyA9IEBzY29wZWRTZXR0aW5nc1N0b3JlLnByb3BlcnRpZXNGb3JTb3VyY2VBbmRTZWxlY3Rvcihzb3VyY2UsIHNjb3BlU2VsZWN0b3IpXG4gICAgICAgIGlmIGdldFZhbHVlQXRLZXlQYXRoKHNldHRpbmdzLCBrZXlQYXRoKT9cbiAgICAgICAgICBAc2NvcGVkU2V0dGluZ3NTdG9yZS5yZW1vdmVQcm9wZXJ0aWVzRm9yU291cmNlQW5kU2VsZWN0b3Ioc291cmNlLCBzY29wZVNlbGVjdG9yKVxuICAgICAgICAgIHNldFZhbHVlQXRLZXlQYXRoKHNldHRpbmdzLCBrZXlQYXRoLCB1bmRlZmluZWQpXG4gICAgICAgICAgc2V0dGluZ3MgPSB3aXRob3V0RW1wdHlPYmplY3RzKHNldHRpbmdzKVxuICAgICAgICAgIEBzZXQobnVsbCwgc2V0dGluZ3MsIHtzY29wZVNlbGVjdG9yLCBzb3VyY2UsIHByaW9yaXR5OiBAcHJpb3JpdHlGb3JTb3VyY2Uoc291cmNlKX0pIGlmIHNldHRpbmdzP1xuICAgICAgICAgIEByZXF1ZXN0U2F2ZSgpXG4gICAgICBlbHNlXG4gICAgICAgIEBzY29wZWRTZXR0aW5nc1N0b3JlLnJlbW92ZVByb3BlcnRpZXNGb3JTb3VyY2VBbmRTZWxlY3Rvcihzb3VyY2UsIHNjb3BlU2VsZWN0b3IpXG4gICAgICAgIEBlbWl0Q2hhbmdlRXZlbnQoKVxuICAgIGVsc2VcbiAgICAgIGZvciBzY29wZVNlbGVjdG9yIG9mIEBzY29wZWRTZXR0aW5nc1N0b3JlLnByb3BlcnRpZXNGb3JTb3VyY2Uoc291cmNlKVxuICAgICAgICBAdW5zZXQoa2V5UGF0aCwge3Njb3BlU2VsZWN0b3IsIHNvdXJjZX0pXG4gICAgICBpZiBrZXlQYXRoPyBhbmQgc291cmNlIGlzIEBnZXRVc2VyQ29uZmlnUGF0aCgpXG4gICAgICAgIEBzZXQoa2V5UGF0aCwgZ2V0VmFsdWVBdEtleVBhdGgoQGRlZmF1bHRTZXR0aW5ncywga2V5UGF0aCkpXG5cbiAgIyBFeHRlbmRlZDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIG9mIHRoZSBgc291cmNlYCB7U3RyaW5nfXMgd2l0aCB3aGljaFxuICAjIHNldHRpbmdzIGhhdmUgYmVlbiBhZGRlZCB2aWEgezo6c2V0fS5cbiAgZ2V0U291cmNlczogLT5cbiAgICBfLnVuaXEoXy5wbHVjayhAc2NvcGVkU2V0dGluZ3NTdG9yZS5wcm9wZXJ0eVNldHMsICdzb3VyY2UnKSkuc29ydCgpXG5cbiAgIyBFeHRlbmRlZDogUmV0cmlldmUgdGhlIHNjaGVtYSBmb3IgYSBzcGVjaWZpYyBrZXkgcGF0aC4gVGhlIHNjaGVtYSB3aWxsIHRlbGxcbiAgIyB5b3Ugd2hhdCB0eXBlIHRoZSBrZXlQYXRoIGV4cGVjdHMsIGFuZCBvdGhlciBtZXRhZGF0YSBhYm91dCB0aGUgY29uZmlnXG4gICMgb3B0aW9uLlxuICAjXG4gICMgKiBga2V5UGF0aGAgVGhlIHtTdHJpbmd9IG5hbWUgb2YgdGhlIGtleS5cbiAgI1xuICAjIFJldHVybnMgYW4ge09iamVjdH0gZWcuIGB7dHlwZTogJ2ludGVnZXInLCBkZWZhdWx0OiAyMywgbWluaW11bTogMX1gLlxuICAjIFJldHVybnMgYG51bGxgIHdoZW4gdGhlIGtleVBhdGggaGFzIG5vIHNjaGVtYSBzcGVjaWZpZWQsIGJ1dCBpcyBhY2Nlc3NpYmxlXG4gICMgZnJvbSB0aGUgcm9vdCBzY2hlbWEuXG4gIGdldFNjaGVtYTogKGtleVBhdGgpIC0+XG4gICAga2V5cyA9IHNwbGl0S2V5UGF0aChrZXlQYXRoKVxuICAgIHNjaGVtYSA9IEBzY2hlbWFcbiAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgIGlmIHNjaGVtYS50eXBlIGlzICdvYmplY3QnXG4gICAgICAgIGNoaWxkU2NoZW1hID0gc2NoZW1hLnByb3BlcnRpZXM/W2tleV1cbiAgICAgICAgdW5sZXNzIGNoaWxkU2NoZW1hP1xuICAgICAgICAgIGlmIGlzUGxhaW5PYmplY3Qoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKVxuICAgICAgICAgICAgY2hpbGRTY2hlbWEgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgICAgICAgICBlbHNlIGlmIHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyBpcyBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4ge3R5cGU6ICdhbnknfVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgc2NoZW1hID0gY2hpbGRTY2hlbWFcbiAgICBzY2hlbWFcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIHtTdHJpbmd9IHBhdGggdG8gdGhlIGNvbmZpZyBmaWxlIGJlaW5nIHVzZWQuXG4gIGdldFVzZXJDb25maWdQYXRoOiAtPlxuICAgIEBjb25maWdGaWxlUGF0aFxuXG4gICMgRXh0ZW5kZWQ6IFN1cHByZXNzIGNhbGxzIHRvIGhhbmRsZXIgZnVuY3Rpb25zIHJlZ2lzdGVyZWQgd2l0aCB7OjpvbkRpZENoYW5nZX1cbiAgIyBhbmQgezo6b2JzZXJ2ZX0gZm9yIHRoZSBkdXJhdGlvbiBvZiBgY2FsbGJhY2tgLiBBZnRlciBgY2FsbGJhY2tgIGV4ZWN1dGVzLFxuICAjIGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIG9uY2UgaWYgdGhlIHZhbHVlIGZvciB0aGVpciBrZXktcGF0aCBoYXMgY2hhbmdlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGV4ZWN1dGUgd2hpbGUgc3VwcHJlc3NpbmcgY2FsbHMgdG8gaGFuZGxlcnMuXG4gIHRyYW5zYWN0OiAoY2FsbGJhY2spIC0+XG4gICAgQGJlZ2luVHJhbnNhY3Rpb24oKVxuICAgIHRyeVxuICAgICAgY2FsbGJhY2soKVxuICAgIGZpbmFsbHlcbiAgICAgIEBlbmRUcmFuc2FjdGlvbigpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEludGVybmFsIG1ldGhvZHMgdXNlZCBieSBjb3JlXG4gICMjI1xuXG4gICMgUHJpdmF0ZTogU3VwcHJlc3MgY2FsbHMgdG8gaGFuZGxlciBmdW5jdGlvbnMgcmVnaXN0ZXJlZCB3aXRoIHs6Om9uRGlkQ2hhbmdlfVxuICAjIGFuZCB7OjpvYnNlcnZlfSBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSB7UHJvbWlzZX0gcmV0dXJuZWQgYnkgYGNhbGxiYWNrYC5cbiAgIyBBZnRlciB0aGUge1Byb21pc2V9IGlzIGVpdGhlciByZXNvbHZlZCBvciByZWplY3RlZCwgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWRcbiAgIyBvbmNlIGlmIHRoZSB2YWx1ZSBmb3IgdGhlaXIga2V5LXBhdGggaGFzIGNoYW5nZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0aGF0IHJldHVybnMgYSB7UHJvbWlzZX0sIHdoaWNoIHdpbGwgYmUgZXhlY3V0ZWRcbiAgIyAgIHdoaWxlIHN1cHByZXNzaW5nIGNhbGxzIHRvIGhhbmRsZXJzLlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IGlzIGVpdGhlciByZXNvbHZlZCBvciByZWplY3RlZCBhY2NvcmRpbmcgdG8gdGhlXG4gICMgYHtQcm9taXNlfWAgcmV0dXJuZWQgYnkgYGNhbGxiYWNrYC4gSWYgYGNhbGxiYWNrYCB0aHJvd3MgYW4gZXJyb3IsIGFcbiAgIyByZWplY3RlZCB7UHJvbWlzZX0gd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkLlxuICB0cmFuc2FjdEFzeW5jOiAoY2FsbGJhY2spIC0+XG4gICAgQGJlZ2luVHJhbnNhY3Rpb24oKVxuICAgIHRyeVxuICAgICAgZW5kVHJhbnNhY3Rpb24gPSAoZm4pID0+IChhcmdzLi4uKSA9PlxuICAgICAgICBAZW5kVHJhbnNhY3Rpb24oKVxuICAgICAgICBmbihhcmdzLi4uKVxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2soKVxuICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICAgcmVzdWx0LnRoZW4oZW5kVHJhbnNhY3Rpb24ocmVzb2x2ZSkpLmNhdGNoKGVuZFRyYW5zYWN0aW9uKHJlamVjdCkpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBlbmRUcmFuc2FjdGlvbigpXG4gICAgICBQcm9taXNlLnJlamVjdChlcnJvcilcblxuICBiZWdpblRyYW5zYWN0aW9uOiAtPlxuICAgIEB0cmFuc2FjdERlcHRoKytcblxuICBlbmRUcmFuc2FjdGlvbjogLT5cbiAgICBAdHJhbnNhY3REZXB0aC0tXG4gICAgQGVtaXRDaGFuZ2VFdmVudCgpXG5cbiAgcHVzaEF0S2V5UGF0aDogKGtleVBhdGgsIHZhbHVlKSAtPlxuICAgIGFycmF5VmFsdWUgPSBAZ2V0KGtleVBhdGgpID8gW11cbiAgICByZXN1bHQgPSBhcnJheVZhbHVlLnB1c2godmFsdWUpXG4gICAgQHNldChrZXlQYXRoLCBhcnJheVZhbHVlKVxuICAgIHJlc3VsdFxuXG4gIHVuc2hpZnRBdEtleVBhdGg6IChrZXlQYXRoLCB2YWx1ZSkgLT5cbiAgICBhcnJheVZhbHVlID0gQGdldChrZXlQYXRoKSA/IFtdXG4gICAgcmVzdWx0ID0gYXJyYXlWYWx1ZS51bnNoaWZ0KHZhbHVlKVxuICAgIEBzZXQoa2V5UGF0aCwgYXJyYXlWYWx1ZSlcbiAgICByZXN1bHRcblxuICByZW1vdmVBdEtleVBhdGg6IChrZXlQYXRoLCB2YWx1ZSkgLT5cbiAgICBhcnJheVZhbHVlID0gQGdldChrZXlQYXRoKSA/IFtdXG4gICAgcmVzdWx0ID0gXy5yZW1vdmUoYXJyYXlWYWx1ZSwgdmFsdWUpXG4gICAgQHNldChrZXlQYXRoLCBhcnJheVZhbHVlKVxuICAgIHJlc3VsdFxuXG4gIHNldFNjaGVtYTogKGtleVBhdGgsIHNjaGVtYSkgLT5cbiAgICB1bmxlc3MgaXNQbGFpbk9iamVjdChzY2hlbWEpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciBsb2FkaW5nIHNjaGVtYSBmb3IgI3trZXlQYXRofTogc2NoZW1hcyBjYW4gb25seSBiZSBvYmplY3RzIVwiKVxuXG4gICAgdW5sZXNzIHR5cGVvZiBzY2hlbWEudHlwZT9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIGxvYWRpbmcgc2NoZW1hIGZvciAje2tleVBhdGh9OiBzY2hlbWEgb2JqZWN0cyBtdXN0IGhhdmUgYSB0eXBlIGF0dHJpYnV0ZVwiKVxuXG4gICAgcm9vdFNjaGVtYSA9IEBzY2hlbWFcbiAgICBpZiBrZXlQYXRoXG4gICAgICBmb3Iga2V5IGluIHNwbGl0S2V5UGF0aChrZXlQYXRoKVxuICAgICAgICByb290U2NoZW1hLnR5cGUgPSAnb2JqZWN0J1xuICAgICAgICByb290U2NoZW1hLnByb3BlcnRpZXMgPz0ge31cbiAgICAgICAgcHJvcGVydGllcyA9IHJvb3RTY2hlbWEucHJvcGVydGllc1xuICAgICAgICBwcm9wZXJ0aWVzW2tleV0gPz0ge31cbiAgICAgICAgcm9vdFNjaGVtYSA9IHByb3BlcnRpZXNba2V5XVxuXG4gICAgT2JqZWN0LmFzc2lnbiByb290U2NoZW1hLCBzY2hlbWFcbiAgICBAdHJhbnNhY3QgPT5cbiAgICAgIEBzZXREZWZhdWx0cyhrZXlQYXRoLCBAZXh0cmFjdERlZmF1bHRzRnJvbVNjaGVtYShzY2hlbWEpKVxuICAgICAgQHNldFNjb3BlZERlZmF1bHRzRnJvbVNjaGVtYShrZXlQYXRoLCBzY2hlbWEpXG4gICAgICBAcmVzZXRTZXR0aW5nc0ZvclNjaGVtYUNoYW5nZSgpXG5cbiAgbG9hZDogLT5cbiAgICBAaW5pdGlhbGl6ZUNvbmZpZ0RpcmVjdG9yeSgpXG4gICAgQGxvYWRVc2VyQ29uZmlnKClcbiAgICBAb2JzZXJ2ZVVzZXJDb25maWcoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQcml2YXRlIG1ldGhvZHMgbWFuYWdpbmcgdGhlIHVzZXIncyBjb25maWcgZmlsZVxuICAjIyNcblxuICBpbml0aWFsaXplQ29uZmlnRGlyZWN0b3J5OiAoZG9uZSkgLT5cbiAgICByZXR1cm4gaWYgZnMuZXhpc3RzU3luYyhAY29uZmlnRGlyUGF0aCkgb3IgQHNob3VsZE5vdEFjY2Vzc0ZpbGVTeXN0ZW0oKVxuXG4gICAgZnMubWFrZVRyZWVTeW5jKEBjb25maWdEaXJQYXRoKVxuXG4gICAgcXVldWUgPSBhc3luYy5xdWV1ZSAoe3NvdXJjZVBhdGgsIGRlc3RpbmF0aW9uUGF0aH0sIGNhbGxiYWNrKSAtPlxuICAgICAgZnMuY29weShzb3VyY2VQYXRoLCBkZXN0aW5hdGlvblBhdGgsIGNhbGxiYWNrKVxuICAgIHF1ZXVlLmRyYWluID0gZG9uZVxuXG4gICAgdGVtcGxhdGVDb25maWdEaXJQYXRoID0gZnMucmVzb2x2ZShAcmVzb3VyY2VQYXRoLCAnZG90LWF0b20nKVxuICAgIG9uQ29uZmlnRGlyRmlsZSA9IChzb3VyY2VQYXRoKSA9PlxuICAgICAgcmVsYXRpdmVQYXRoID0gc291cmNlUGF0aC5zdWJzdHJpbmcodGVtcGxhdGVDb25maWdEaXJQYXRoLmxlbmd0aCArIDEpXG4gICAgICBkZXN0aW5hdGlvblBhdGggPSBwYXRoLmpvaW4oQGNvbmZpZ0RpclBhdGgsIHJlbGF0aXZlUGF0aClcbiAgICAgIHF1ZXVlLnB1c2goe3NvdXJjZVBhdGgsIGRlc3RpbmF0aW9uUGF0aH0pXG4gICAgZnMudHJhdmVyc2VUcmVlKHRlbXBsYXRlQ29uZmlnRGlyUGF0aCwgb25Db25maWdEaXJGaWxlLCAocGF0aCkgLT4gdHJ1ZSlcblxuICBsb2FkVXNlckNvbmZpZzogLT5cbiAgICByZXR1cm4gaWYgQHNob3VsZE5vdEFjY2Vzc0ZpbGVTeXN0ZW0oKVxuXG4gICAgdHJ5XG4gICAgICB1bmxlc3MgZnMuZXhpc3RzU3luYyhAY29uZmlnRmlsZVBhdGgpXG4gICAgICAgIGZzLm1ha2VUcmVlU3luYyhwYXRoLmRpcm5hbWUoQGNvbmZpZ0ZpbGVQYXRoKSlcbiAgICAgICAgQ1NPTi53cml0ZUZpbGVTeW5jKEBjb25maWdGaWxlUGF0aCwge30pXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBjb25maWdGaWxlSGFzRXJyb3JzID0gdHJ1ZVxuICAgICAgQG5vdGlmeUZhaWx1cmUoXCJGYWlsZWQgdG8gaW5pdGlhbGl6ZSBgI3twYXRoLmJhc2VuYW1lKEBjb25maWdGaWxlUGF0aCl9YFwiLCBlcnJvci5zdGFjaylcbiAgICAgIHJldHVyblxuXG4gICAgdHJ5XG4gICAgICB1bmxlc3MgQHNhdmVQZW5kaW5nXG4gICAgICAgIHVzZXJDb25maWcgPSBDU09OLnJlYWRGaWxlU3luYyhAY29uZmlnRmlsZVBhdGgpXG4gICAgICAgIEByZXNldFVzZXJTZXR0aW5ncyh1c2VyQ29uZmlnKVxuICAgICAgICBAY29uZmlnRmlsZUhhc0Vycm9ycyA9IGZhbHNlXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBjb25maWdGaWxlSGFzRXJyb3JzID0gdHJ1ZVxuICAgICAgbWVzc2FnZSA9IFwiRmFpbGVkIHRvIGxvYWQgYCN7cGF0aC5iYXNlbmFtZShAY29uZmlnRmlsZVBhdGgpfWBcIlxuXG4gICAgICBkZXRhaWwgPSBpZiBlcnJvci5sb2NhdGlvbj9cbiAgICAgICAgIyBzdGFjayBpcyB0aGUgb3V0cHV0IGZyb20gQ1NPTiBpbiB0aGlzIGNhc2VcbiAgICAgICAgZXJyb3Iuc3RhY2tcbiAgICAgIGVsc2VcbiAgICAgICAgIyBtZXNzYWdlIHdpbGwgYmUgRUFDQ0VTIHBlcm1pc3Npb24gZGVuaWVkLCBldCBhbFxuICAgICAgICBlcnJvci5tZXNzYWdlXG5cbiAgICAgIEBub3RpZnlGYWlsdXJlKG1lc3NhZ2UsIGRldGFpbClcblxuICBvYnNlcnZlVXNlckNvbmZpZzogLT5cbiAgICByZXR1cm4gaWYgQHNob3VsZE5vdEFjY2Vzc0ZpbGVTeXN0ZW0oKVxuXG4gICAgdHJ5XG4gICAgICBAd2F0Y2hTdWJzY3JpcHRpb24gPz0gcGF0aFdhdGNoZXIud2F0Y2ggQGNvbmZpZ0ZpbGVQYXRoLCAoZXZlbnRUeXBlKSA9PlxuICAgICAgICBAcmVxdWVzdExvYWQoKSBpZiBldmVudFR5cGUgaXMgJ2NoYW5nZScgYW5kIEB3YXRjaFN1YnNjcmlwdGlvbj9cbiAgICBjYXRjaCBlcnJvclxuICAgICAgQG5vdGlmeUZhaWx1cmUgXCJcIlwiXG4gICAgICAgIFVuYWJsZSB0byB3YXRjaCBwYXRoOiBgI3twYXRoLmJhc2VuYW1lKEBjb25maWdGaWxlUGF0aCl9YC4gTWFrZSBzdXJlIHlvdSBoYXZlIHBlcm1pc3Npb25zIHRvXG4gICAgICAgIGAje0Bjb25maWdGaWxlUGF0aH1gLiBPbiBsaW51eCB0aGVyZSBhcmUgY3VycmVudGx5IHByb2JsZW1zIHdpdGggd2F0Y2hcbiAgICAgICAgc2l6ZXMuIFNlZSBbdGhpcyBkb2N1bWVudF1bd2F0Y2hlc10gZm9yIG1vcmUgaW5mby5cbiAgICAgICAgW3dhdGNoZXNdOmh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi9tYXN0ZXIvZG9jcy9idWlsZC1pbnN0cnVjdGlvbnMvbGludXgubWQjdHlwZWVycm9yLXVuYWJsZS10by13YXRjaC1wYXRoXG4gICAgICBcIlwiXCJcblxuICB1bm9ic2VydmVVc2VyQ29uZmlnOiAtPlxuICAgIEB3YXRjaFN1YnNjcmlwdGlvbj8uY2xvc2UoKVxuICAgIEB3YXRjaFN1YnNjcmlwdGlvbiA9IG51bGxcblxuICBub3RpZnlGYWlsdXJlOiAoZXJyb3JNZXNzYWdlLCBkZXRhaWwpIC0+XG4gICAgQG5vdGlmaWNhdGlvbk1hbmFnZXI/LmFkZEVycm9yKGVycm9yTWVzc2FnZSwge2RldGFpbCwgZGlzbWlzc2FibGU6IHRydWV9KVxuXG4gIHNhdmU6IC0+XG4gICAgcmV0dXJuIGlmIEBzaG91bGROb3RBY2Nlc3NGaWxlU3lzdGVtKClcblxuICAgIGFsbFNldHRpbmdzID0geycqJzogQHNldHRpbmdzfVxuICAgIGFsbFNldHRpbmdzID0gT2JqZWN0LmFzc2lnbiBhbGxTZXR0aW5ncywgQHNjb3BlZFNldHRpbmdzU3RvcmUucHJvcGVydGllc0ZvclNvdXJjZShAZ2V0VXNlckNvbmZpZ1BhdGgoKSlcbiAgICBhbGxTZXR0aW5ncyA9IHNvcnRPYmplY3QoYWxsU2V0dGluZ3MpXG4gICAgdHJ5XG4gICAgICBDU09OLndyaXRlRmlsZVN5bmMoQGNvbmZpZ0ZpbGVQYXRoLCBhbGxTZXR0aW5ncylcbiAgICBjYXRjaCBlcnJvclxuICAgICAgbWVzc2FnZSA9IFwiRmFpbGVkIHRvIHNhdmUgYCN7cGF0aC5iYXNlbmFtZShAY29uZmlnRmlsZVBhdGgpfWBcIlxuICAgICAgZGV0YWlsID0gZXJyb3IubWVzc2FnZVxuICAgICAgQG5vdGlmeUZhaWx1cmUobWVzc2FnZSwgZGV0YWlsKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQcml2YXRlIG1ldGhvZHMgbWFuYWdpbmcgZ2xvYmFsIHNldHRpbmdzXG4gICMjI1xuXG4gIHJlc2V0VXNlclNldHRpbmdzOiAobmV3U2V0dGluZ3MpIC0+XG4gICAgdW5sZXNzIGlzUGxhaW5PYmplY3QobmV3U2V0dGluZ3MpXG4gICAgICBAc2V0dGluZ3MgPSB7fVxuICAgICAgQGVtaXRDaGFuZ2VFdmVudCgpXG4gICAgICByZXR1cm5cblxuICAgIGlmIG5ld1NldHRpbmdzLmdsb2JhbD9cbiAgICAgIG5ld1NldHRpbmdzWycqJ10gPSBuZXdTZXR0aW5ncy5nbG9iYWxcbiAgICAgIGRlbGV0ZSBuZXdTZXR0aW5ncy5nbG9iYWxcblxuICAgIGlmIG5ld1NldHRpbmdzWycqJ10/XG4gICAgICBzY29wZWRTZXR0aW5ncyA9IG5ld1NldHRpbmdzXG4gICAgICBuZXdTZXR0aW5ncyA9IG5ld1NldHRpbmdzWycqJ11cbiAgICAgIGRlbGV0ZSBzY29wZWRTZXR0aW5nc1snKiddXG4gICAgICBAcmVzZXRVc2VyU2NvcGVkU2V0dGluZ3Moc2NvcGVkU2V0dGluZ3MpXG5cbiAgICBAdHJhbnNhY3QgPT5cbiAgICAgIEBzZXR0aW5ncyA9IHt9XG4gICAgICBAc2V0KGtleSwgdmFsdWUsIHNhdmU6IGZhbHNlKSBmb3Iga2V5LCB2YWx1ZSBvZiBuZXdTZXR0aW5nc1xuICAgICAgcmV0dXJuXG5cbiAgZ2V0UmF3VmFsdWU6IChrZXlQYXRoLCBvcHRpb25zKSAtPlxuICAgIHVubGVzcyBvcHRpb25zPy5leGNsdWRlU291cmNlcz8uaW5kZXhPZihAZ2V0VXNlckNvbmZpZ1BhdGgoKSkgPj0gMFxuICAgICAgdmFsdWUgPSBnZXRWYWx1ZUF0S2V5UGF0aChAc2V0dGluZ3MsIGtleVBhdGgpXG4gICAgdW5sZXNzIG9wdGlvbnM/LnNvdXJjZXM/Lmxlbmd0aCA+IDBcbiAgICAgIGRlZmF1bHRWYWx1ZSA9IGdldFZhbHVlQXRLZXlQYXRoKEBkZWZhdWx0U2V0dGluZ3MsIGtleVBhdGgpXG5cbiAgICBpZiB2YWx1ZT9cbiAgICAgIHZhbHVlID0gQGRlZXBDbG9uZSh2YWx1ZSlcbiAgICAgIEBkZWVwRGVmYXVsdHModmFsdWUsIGRlZmF1bHRWYWx1ZSkgaWYgaXNQbGFpbk9iamVjdCh2YWx1ZSkgYW5kIGlzUGxhaW5PYmplY3QoZGVmYXVsdFZhbHVlKVxuICAgIGVsc2VcbiAgICAgIHZhbHVlID0gQGRlZXBDbG9uZShkZWZhdWx0VmFsdWUpXG5cbiAgICB2YWx1ZVxuXG4gIHNldFJhd1ZhbHVlOiAoa2V5UGF0aCwgdmFsdWUpIC0+XG4gICAgZGVmYXVsdFZhbHVlID0gZ2V0VmFsdWVBdEtleVBhdGgoQGRlZmF1bHRTZXR0aW5ncywga2V5UGF0aClcbiAgICBpZiBfLmlzRXF1YWwoZGVmYXVsdFZhbHVlLCB2YWx1ZSlcbiAgICAgIGlmIGtleVBhdGg/XG4gICAgICAgIGRlbGV0ZVZhbHVlQXRLZXlQYXRoKEBzZXR0aW5ncywga2V5UGF0aClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldHRpbmdzID0gbnVsbFxuICAgIGVsc2VcbiAgICAgIGlmIGtleVBhdGg/XG4gICAgICAgIHNldFZhbHVlQXRLZXlQYXRoKEBzZXR0aW5ncywga2V5UGF0aCwgdmFsdWUpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXR0aW5ncyA9IHZhbHVlXG4gICAgQGVtaXRDaGFuZ2VFdmVudCgpXG5cbiAgb2JzZXJ2ZUtleVBhdGg6IChrZXlQYXRoLCBvcHRpb25zLCBjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhAZ2V0KGtleVBhdGgpKVxuICAgIEBvbkRpZENoYW5nZUtleVBhdGgga2V5UGF0aCwgKGV2ZW50KSAtPiBjYWxsYmFjayhldmVudC5uZXdWYWx1ZSlcblxuICBvbkRpZENoYW5nZUtleVBhdGg6IChrZXlQYXRoLCBjYWxsYmFjaykgLT5cbiAgICBvbGRWYWx1ZSA9IEBnZXQoa2V5UGF0aClcbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZScsID0+XG4gICAgICBuZXdWYWx1ZSA9IEBnZXQoa2V5UGF0aClcbiAgICAgIHVubGVzcyBfLmlzRXF1YWwob2xkVmFsdWUsIG5ld1ZhbHVlKVxuICAgICAgICBldmVudCA9IHtvbGRWYWx1ZSwgbmV3VmFsdWV9XG4gICAgICAgIG9sZFZhbHVlID0gbmV3VmFsdWVcbiAgICAgICAgY2FsbGJhY2soZXZlbnQpXG5cbiAgaXNTdWJLZXlQYXRoOiAoa2V5UGF0aCwgc3ViS2V5UGF0aCkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGtleVBhdGg/IGFuZCBzdWJLZXlQYXRoP1xuICAgIHBhdGhTdWJUb2tlbnMgPSBzcGxpdEtleVBhdGgoc3ViS2V5UGF0aClcbiAgICBwYXRoVG9rZW5zID0gc3BsaXRLZXlQYXRoKGtleVBhdGgpLnNsaWNlKDAsIHBhdGhTdWJUb2tlbnMubGVuZ3RoKVxuICAgIF8uaXNFcXVhbChwYXRoVG9rZW5zLCBwYXRoU3ViVG9rZW5zKVxuXG4gIHNldFJhd0RlZmF1bHQ6IChrZXlQYXRoLCB2YWx1ZSkgLT5cbiAgICBzZXRWYWx1ZUF0S2V5UGF0aChAZGVmYXVsdFNldHRpbmdzLCBrZXlQYXRoLCB2YWx1ZSlcbiAgICBAZW1pdENoYW5nZUV2ZW50KClcblxuICBzZXREZWZhdWx0czogKGtleVBhdGgsIGRlZmF1bHRzKSAtPlxuICAgIGlmIGRlZmF1bHRzPyBhbmQgaXNQbGFpbk9iamVjdChkZWZhdWx0cylcbiAgICAgIGtleXMgPSBzcGxpdEtleVBhdGgoa2V5UGF0aClcbiAgICAgIEB0cmFuc2FjdCA9PlxuICAgICAgICBmb3Iga2V5LCBjaGlsZFZhbHVlIG9mIGRlZmF1bHRzXG4gICAgICAgICAgY29udGludWUgdW5sZXNzIGRlZmF1bHRzLmhhc093blByb3BlcnR5KGtleSlcbiAgICAgICAgICBAc2V0RGVmYXVsdHMoa2V5cy5jb25jYXQoW2tleV0pLmpvaW4oJy4nKSwgY2hpbGRWYWx1ZSlcbiAgICBlbHNlXG4gICAgICB0cnlcbiAgICAgICAgZGVmYXVsdHMgPSBAbWFrZVZhbHVlQ29uZm9ybVRvU2NoZW1hKGtleVBhdGgsIGRlZmF1bHRzKVxuICAgICAgICBAc2V0UmF3RGVmYXVsdChrZXlQYXRoLCBkZWZhdWx0cylcbiAgICAgIGNhdGNoIGVcbiAgICAgICAgY29uc29sZS53YXJuKFwiJyN7a2V5UGF0aH0nIGNvdWxkIG5vdCBzZXQgdGhlIGRlZmF1bHQuIEF0dGVtcHRlZCBkZWZhdWx0OiAje0pTT04uc3RyaW5naWZ5KGRlZmF1bHRzKX07IFNjaGVtYTogI3tKU09OLnN0cmluZ2lmeShAZ2V0U2NoZW1hKGtleVBhdGgpKX1cIilcbiAgICByZXR1cm5cblxuICBkZWVwQ2xvbmU6IChvYmplY3QpIC0+XG4gICAgaWYgb2JqZWN0IGluc3RhbmNlb2YgQ29sb3JcbiAgICAgIG9iamVjdC5jbG9uZSgpXG4gICAgZWxzZSBpZiBfLmlzQXJyYXkob2JqZWN0KVxuICAgICAgb2JqZWN0Lm1hcCAodmFsdWUpID0+IEBkZWVwQ2xvbmUodmFsdWUpXG4gICAgZWxzZSBpZiBpc1BsYWluT2JqZWN0KG9iamVjdClcbiAgICAgIF8ubWFwT2JqZWN0IG9iamVjdCwgKGtleSwgdmFsdWUpID0+IFtrZXksIEBkZWVwQ2xvbmUodmFsdWUpXVxuICAgIGVsc2VcbiAgICAgIG9iamVjdFxuXG4gIGRlZXBEZWZhdWx0czogKHRhcmdldCkgLT5cbiAgICByZXN1bHQgPSB0YXJnZXRcbiAgICBpID0gMFxuICAgIHdoaWxlICsraSA8IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG9iamVjdCA9IGFyZ3VtZW50c1tpXVxuICAgICAgaWYgaXNQbGFpbk9iamVjdChyZXN1bHQpIGFuZCBpc1BsYWluT2JqZWN0KG9iamVjdClcbiAgICAgICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyhvYmplY3QpXG4gICAgICAgICAgcmVzdWx0W2tleV0gPSBAZGVlcERlZmF1bHRzKHJlc3VsdFtrZXldLCBvYmplY3Rba2V5XSlcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgbm90IHJlc3VsdD9cbiAgICAgICAgICByZXN1bHQgPSBAZGVlcENsb25lKG9iamVjdClcbiAgICByZXN1bHRcblxuICAjIGBzY2hlbWFgIHdpbGwgbG9vayBzb21ldGhpbmcgbGlrZSB0aGlzXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyB0eXBlOiAnc3RyaW5nJ1xuICAjIGRlZmF1bHQ6ICdvaydcbiAgIyBzY29wZXM6XG4gICMgICAnLnNvdXJjZS5qcyc6XG4gICMgICAgIGRlZmF1bHQ6ICdvbWcnXG4gICMgYGBgXG4gIHNldFNjb3BlZERlZmF1bHRzRnJvbVNjaGVtYTogKGtleVBhdGgsIHNjaGVtYSkgLT5cbiAgICBpZiBzY2hlbWEuc2NvcGVzPyBhbmQgaXNQbGFpbk9iamVjdChzY2hlbWEuc2NvcGVzKVxuICAgICAgc2NvcGVkRGVmYXVsdHMgPSB7fVxuICAgICAgZm9yIHNjb3BlLCBzY29wZVNjaGVtYSBvZiBzY2hlbWEuc2NvcGVzXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBzY29wZVNjaGVtYS5oYXNPd25Qcm9wZXJ0eSgnZGVmYXVsdCcpXG4gICAgICAgIHNjb3BlZERlZmF1bHRzW3Njb3BlXSA9IHt9XG4gICAgICAgIHNldFZhbHVlQXRLZXlQYXRoKHNjb3BlZERlZmF1bHRzW3Njb3BlXSwga2V5UGF0aCwgc2NvcGVTY2hlbWEuZGVmYXVsdClcbiAgICAgIEBzY29wZWRTZXR0aW5nc1N0b3JlLmFkZFByb3BlcnRpZXMoJ3NjaGVtYS1kZWZhdWx0Jywgc2NvcGVkRGVmYXVsdHMpXG5cbiAgICBpZiBzY2hlbWEudHlwZSBpcyAnb2JqZWN0JyBhbmQgc2NoZW1hLnByb3BlcnRpZXM/IGFuZCBpc1BsYWluT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKVxuICAgICAga2V5cyA9IHNwbGl0S2V5UGF0aChrZXlQYXRoKVxuICAgICAgZm9yIGtleSwgY2hpbGRWYWx1ZSBvZiBzY2hlbWEucHJvcGVydGllc1xuICAgICAgICBjb250aW51ZSB1bmxlc3Mgc2NoZW1hLnByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoa2V5KVxuICAgICAgICBAc2V0U2NvcGVkRGVmYXVsdHNGcm9tU2NoZW1hKGtleXMuY29uY2F0KFtrZXldKS5qb2luKCcuJyksIGNoaWxkVmFsdWUpXG5cbiAgICByZXR1cm5cblxuICBleHRyYWN0RGVmYXVsdHNGcm9tU2NoZW1hOiAoc2NoZW1hKSAtPlxuICAgIGlmIHNjaGVtYS5kZWZhdWx0P1xuICAgICAgc2NoZW1hLmRlZmF1bHRcbiAgICBlbHNlIGlmIHNjaGVtYS50eXBlIGlzICdvYmplY3QnIGFuZCBzY2hlbWEucHJvcGVydGllcz8gYW5kIGlzUGxhaW5PYmplY3Qoc2NoZW1hLnByb3BlcnRpZXMpXG4gICAgICBkZWZhdWx0cyA9IHt9XG4gICAgICBwcm9wZXJ0aWVzID0gc2NoZW1hLnByb3BlcnRpZXMgb3Ige31cbiAgICAgIGRlZmF1bHRzW2tleV0gPSBAZXh0cmFjdERlZmF1bHRzRnJvbVNjaGVtYSh2YWx1ZSkgZm9yIGtleSwgdmFsdWUgb2YgcHJvcGVydGllc1xuICAgICAgZGVmYXVsdHNcblxuICBtYWtlVmFsdWVDb25mb3JtVG9TY2hlbWE6IChrZXlQYXRoLCB2YWx1ZSwgb3B0aW9ucykgLT5cbiAgICBpZiBvcHRpb25zPy5zdXBwcmVzc0V4Y2VwdGlvblxuICAgICAgdHJ5XG4gICAgICAgIEBtYWtlVmFsdWVDb25mb3JtVG9TY2hlbWEoa2V5UGF0aCwgdmFsdWUpXG4gICAgICBjYXRjaCBlXG4gICAgICAgIHVuZGVmaW5lZFxuICAgIGVsc2VcbiAgICAgIHVubGVzcyAoc2NoZW1hID0gQGdldFNjaGVtYShrZXlQYXRoKSk/XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwga2V5IHBhdGggI3trZXlQYXRofVwiKSBpZiBzY2hlbWEgaXMgZmFsc2VcbiAgICAgIEBjb25zdHJ1Y3Rvci5leGVjdXRlU2NoZW1hRW5mb3JjZXJzKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpXG5cbiAgIyBXaGVuIHRoZSBzY2hlbWEgaXMgY2hhbmdlZCAvIGFkZGVkLCB0aGVyZSBtYXkgYmUgdmFsdWVzIHNldCBpbiB0aGUgY29uZmlnXG4gICMgdGhhdCBkbyBub3QgY29uZm9ybSB0byB0aGUgc2NoZW1hLiBUaGlzIHdpbGwgcmVzZXQgbWFrZSB0aGVtIGNvbmZvcm0uXG4gIHJlc2V0U2V0dGluZ3NGb3JTY2hlbWFDaGFuZ2U6IChzb3VyY2U9QGdldFVzZXJDb25maWdQYXRoKCkpIC0+XG4gICAgQHRyYW5zYWN0ID0+XG4gICAgICBAc2V0dGluZ3MgPSBAbWFrZVZhbHVlQ29uZm9ybVRvU2NoZW1hKG51bGwsIEBzZXR0aW5ncywgc3VwcHJlc3NFeGNlcHRpb246IHRydWUpXG4gICAgICBzZWxlY3RvcnNBbmRTZXR0aW5ncyA9IEBzY29wZWRTZXR0aW5nc1N0b3JlLnByb3BlcnRpZXNGb3JTb3VyY2Uoc291cmNlKVxuICAgICAgQHNjb3BlZFNldHRpbmdzU3RvcmUucmVtb3ZlUHJvcGVydGllc0ZvclNvdXJjZShzb3VyY2UpXG4gICAgICBmb3Igc2NvcGVTZWxlY3Rvciwgc2V0dGluZ3Mgb2Ygc2VsZWN0b3JzQW5kU2V0dGluZ3NcbiAgICAgICAgc2V0dGluZ3MgPSBAbWFrZVZhbHVlQ29uZm9ybVRvU2NoZW1hKG51bGwsIHNldHRpbmdzLCBzdXBwcmVzc0V4Y2VwdGlvbjogdHJ1ZSlcbiAgICAgICAgQHNldFJhd1Njb3BlZFZhbHVlKG51bGwsIHNldHRpbmdzLCBzb3VyY2UsIHNjb3BlU2VsZWN0b3IpXG4gICAgICByZXR1cm5cblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZSBTY29wZWQgU2V0dGluZ3NcbiAgIyMjXG5cbiAgcHJpb3JpdHlGb3JTb3VyY2U6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlIGlzIEBnZXRVc2VyQ29uZmlnUGF0aCgpXG4gICAgICAxMDAwXG4gICAgZWxzZVxuICAgICAgMFxuXG4gIGVtaXRDaGFuZ2VFdmVudDogLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlJyB1bmxlc3MgQHRyYW5zYWN0RGVwdGggPiAwXG5cbiAgcmVzZXRVc2VyU2NvcGVkU2V0dGluZ3M6IChuZXdTY29wZWRTZXR0aW5ncykgLT5cbiAgICBzb3VyY2UgPSBAZ2V0VXNlckNvbmZpZ1BhdGgoKVxuICAgIHByaW9yaXR5ID0gQHByaW9yaXR5Rm9yU291cmNlKHNvdXJjZSlcbiAgICBAc2NvcGVkU2V0dGluZ3NTdG9yZS5yZW1vdmVQcm9wZXJ0aWVzRm9yU291cmNlKHNvdXJjZSlcblxuICAgIGZvciBzY29wZVNlbGVjdG9yLCBzZXR0aW5ncyBvZiBuZXdTY29wZWRTZXR0aW5nc1xuICAgICAgc2V0dGluZ3MgPSBAbWFrZVZhbHVlQ29uZm9ybVRvU2NoZW1hKG51bGwsIHNldHRpbmdzLCBzdXBwcmVzc0V4Y2VwdGlvbjogdHJ1ZSlcbiAgICAgIHZhbGlkYXRlZFNldHRpbmdzID0ge31cbiAgICAgIHZhbGlkYXRlZFNldHRpbmdzW3Njb3BlU2VsZWN0b3JdID0gd2l0aG91dEVtcHR5T2JqZWN0cyhzZXR0aW5ncylcbiAgICAgIEBzY29wZWRTZXR0aW5nc1N0b3JlLmFkZFByb3BlcnRpZXMoc291cmNlLCB2YWxpZGF0ZWRTZXR0aW5ncywge3ByaW9yaXR5fSkgaWYgdmFsaWRhdGVkU2V0dGluZ3Nbc2NvcGVTZWxlY3Rvcl0/XG5cbiAgICBAZW1pdENoYW5nZUV2ZW50KClcblxuICBzZXRSYXdTY29wZWRWYWx1ZTogKGtleVBhdGgsIHZhbHVlLCBzb3VyY2UsIHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICAgIGlmIGtleVBhdGg/XG4gICAgICBuZXdWYWx1ZSA9IHt9XG4gICAgICBzZXRWYWx1ZUF0S2V5UGF0aChuZXdWYWx1ZSwga2V5UGF0aCwgdmFsdWUpXG4gICAgICB2YWx1ZSA9IG5ld1ZhbHVlXG5cbiAgICBzZXR0aW5nc0J5U2VsZWN0b3IgPSB7fVxuICAgIHNldHRpbmdzQnlTZWxlY3RvcltzZWxlY3Rvcl0gPSB2YWx1ZVxuICAgIEBzY29wZWRTZXR0aW5nc1N0b3JlLmFkZFByb3BlcnRpZXMoc291cmNlLCBzZXR0aW5nc0J5U2VsZWN0b3IsIHByaW9yaXR5OiBAcHJpb3JpdHlGb3JTb3VyY2Uoc291cmNlKSlcbiAgICBAZW1pdENoYW5nZUV2ZW50KClcblxuICBnZXRSYXdTY29wZWRWYWx1ZTogKHNjb3BlRGVzY3JpcHRvciwga2V5UGF0aCwgb3B0aW9ucykgLT5cbiAgICBzY29wZURlc2NyaXB0b3IgPSBTY29wZURlc2NyaXB0b3IuZnJvbU9iamVjdChzY29wZURlc2NyaXB0b3IpXG4gICAgQHNjb3BlZFNldHRpbmdzU3RvcmUuZ2V0UHJvcGVydHlWYWx1ZShzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVDaGFpbigpLCBrZXlQYXRoLCBvcHRpb25zKVxuXG4gIG9ic2VydmVTY29wZWRLZXlQYXRoOiAoc2NvcGUsIGtleVBhdGgsIGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKEBnZXQoa2V5UGF0aCwge3Njb3BlfSkpXG4gICAgQG9uRGlkQ2hhbmdlU2NvcGVkS2V5UGF0aCBzY29wZSwga2V5UGF0aCwgKGV2ZW50KSAtPiBjYWxsYmFjayhldmVudC5uZXdWYWx1ZSlcblxuICBvbkRpZENoYW5nZVNjb3BlZEtleVBhdGg6IChzY29wZSwga2V5UGF0aCwgY2FsbGJhY2spIC0+XG4gICAgb2xkVmFsdWUgPSBAZ2V0KGtleVBhdGgsIHtzY29wZX0pXG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UnLCA9PlxuICAgICAgbmV3VmFsdWUgPSBAZ2V0KGtleVBhdGgsIHtzY29wZX0pXG4gICAgICB1bmxlc3MgXy5pc0VxdWFsKG9sZFZhbHVlLCBuZXdWYWx1ZSlcbiAgICAgICAgZXZlbnQgPSB7b2xkVmFsdWUsIG5ld1ZhbHVlfVxuICAgICAgICBvbGRWYWx1ZSA9IG5ld1ZhbHVlXG4gICAgICAgIGNhbGxiYWNrKGV2ZW50KVxuXG4jIEJhc2Ugc2NoZW1hIGVuZm9yY2Vycy4gVGhlc2Ugd2lsbCBjb2VyY2UgcmF3IGlucHV0IGludG8gdGhlIHNwZWNpZmllZCB0eXBlLFxuIyBhbmQgd2lsbCB0aHJvdyBhbiBlcnJvciB3aGVuIHRoZSB2YWx1ZSBjYW5ub3QgYmUgY29lcmNlZC4gVGhyb3dpbmcgdGhlIGVycm9yXG4jIHdpbGwgaW5kaWNhdGUgdGhhdCB0aGUgdmFsdWUgc2hvdWxkIG5vdCBiZSBzZXQuXG4jXG4jIEVuZm9yY2VycyBhcmUgcnVuIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdC4gRm9yIGEgc2NoZW1hIHdpdGggdHlwZVxuIyBgaW50ZWdlcmAsIGFsbCB0aGUgZW5mb3JjZXJzIGZvciB0aGUgYGludGVnZXJgIHR5cGUgd2lsbCBiZSBydW4gZmlyc3QsIGluXG4jIG9yZGVyIG9mIHNwZWNpZmljYXRpb24uIFRoZW4gdGhlIGAqYCBlbmZvcmNlcnMgd2lsbCBiZSBydW4sIGluIG9yZGVyIG9mXG4jIHNwZWNpZmljYXRpb24uXG5Db25maWcuYWRkU2NoZW1hRW5mb3JjZXJzXG4gICdhbnknOlxuICAgIGNvZXJjZTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICB2YWx1ZVxuXG4gICdpbnRlZ2VyJzpcbiAgICBjb2VyY2U6IChrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKSAtPlxuICAgICAgdmFsdWUgPSBwYXJzZUludCh2YWx1ZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRpb24gZmFpbGVkIGF0ICN7a2V5UGF0aH0sICN7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSBjYW5ub3QgYmUgY29lcmNlZCBpbnRvIGFuIGludFwiKSBpZiBpc05hTih2YWx1ZSkgb3Igbm90IGlzRmluaXRlKHZhbHVlKVxuICAgICAgdmFsdWVcblxuICAnbnVtYmVyJzpcbiAgICBjb2VyY2U6IChrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKSAtPlxuICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmFsaWRhdGlvbiBmYWlsZWQgYXQgI3trZXlQYXRofSwgI3tKU09OLnN0cmluZ2lmeSh2YWx1ZSl9IGNhbm5vdCBiZSBjb2VyY2VkIGludG8gYSBudW1iZXJcIikgaWYgaXNOYU4odmFsdWUpIG9yIG5vdCBpc0Zpbml0ZSh2YWx1ZSlcbiAgICAgIHZhbHVlXG5cbiAgJ2Jvb2xlYW4nOlxuICAgIGNvZXJjZTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICBzd2l0Y2ggdHlwZW9mIHZhbHVlXG4gICAgICAgIHdoZW4gJ3N0cmluZydcbiAgICAgICAgICBpZiB2YWx1ZS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgIGVsc2UgaWYgdmFsdWUudG9Mb3dlckNhc2UoKSBpcyAnZmFsc2UnXG4gICAgICAgICAgICBmYWxzZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRpb24gZmFpbGVkIGF0ICN7a2V5UGF0aH0sICN7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSBtdXN0IGJlIGEgYm9vbGVhbiBvciB0aGUgc3RyaW5nICd0cnVlJyBvciAnZmFsc2UnXCIpXG4gICAgICAgIHdoZW4gJ2Jvb2xlYW4nXG4gICAgICAgICAgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRpb24gZmFpbGVkIGF0ICN7a2V5UGF0aH0sICN7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSBtdXN0IGJlIGEgYm9vbGVhbiBvciB0aGUgc3RyaW5nICd0cnVlJyBvciAnZmFsc2UnXCIpXG5cbiAgJ3N0cmluZyc6XG4gICAgdmFsaWRhdGU6IChrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKSAtPlxuICAgICAgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBhdCAje2tleVBhdGh9LCAje0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgICAgdmFsdWVcblxuICAgIHZhbGlkYXRlTWF4aW11bUxlbmd0aDogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICBpZiB0eXBlb2Ygc2NoZW1hLm1heGltdW1MZW5ndGggaXMgJ251bWJlcicgYW5kIHZhbHVlLmxlbmd0aCA+IHNjaGVtYS5tYXhpbXVtTGVuZ3RoXG4gICAgICAgIHZhbHVlLnNsaWNlKDAsIHNjaGVtYS5tYXhpbXVtTGVuZ3RoKVxuICAgICAgZWxzZVxuICAgICAgICB2YWx1ZVxuXG4gICdudWxsJzpcbiAgICAjIG51bGwgc29ydCBvZiBpc250IHN1cHBvcnRlZC4gSXQgd2lsbCBqdXN0IHVuc2V0IGluIHRoaXMgY2FzZVxuICAgIGNvZXJjZTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBhdCAje2tleVBhdGh9LCAje0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gbXVzdCBiZSBudWxsXCIpIHVubGVzcyB2YWx1ZSBpbiBbdW5kZWZpbmVkLCBudWxsXVxuICAgICAgdmFsdWVcblxuICAnb2JqZWN0JzpcbiAgICBjb2VyY2U6IChrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKSAtPlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmFsaWRhdGlvbiBmYWlsZWQgYXQgI3trZXlQYXRofSwgI3tKU09OLnN0cmluZ2lmeSh2YWx1ZSl9IG11c3QgYmUgYW4gb2JqZWN0XCIpIHVubGVzcyBpc1BsYWluT2JqZWN0KHZhbHVlKVxuICAgICAgcmV0dXJuIHZhbHVlIHVubGVzcyBzY2hlbWEucHJvcGVydGllcz9cblxuICAgICAgZGVmYXVsdENoaWxkU2NoZW1hID0gbnVsbFxuICAgICAgYWxsb3dzQWRkaXRpb25hbFByb3BlcnRpZXMgPSB0cnVlXG4gICAgICBpZiBpc1BsYWluT2JqZWN0KHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcylcbiAgICAgICAgZGVmYXVsdENoaWxkU2NoZW1hID0gc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzXG4gICAgICBpZiBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMgaXMgZmFsc2VcbiAgICAgICAgYWxsb3dzQWRkaXRpb25hbFByb3BlcnRpZXMgPSBmYWxzZVxuXG4gICAgICBuZXdWYWx1ZSA9IHt9XG4gICAgICBmb3IgcHJvcCwgcHJvcFZhbHVlIG9mIHZhbHVlXG4gICAgICAgIGNoaWxkU2NoZW1hID0gc2NoZW1hLnByb3BlcnRpZXNbcHJvcF0gPyBkZWZhdWx0Q2hpbGRTY2hlbWFcbiAgICAgICAgaWYgY2hpbGRTY2hlbWE/XG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBuZXdWYWx1ZVtwcm9wXSA9IEBleGVjdXRlU2NoZW1hRW5mb3JjZXJzKHB1c2hLZXlQYXRoKGtleVBhdGgsIHByb3ApLCBwcm9wVmFsdWUsIGNoaWxkU2NoZW1hKVxuICAgICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgICBjb25zb2xlLndhcm4gXCJFcnJvciBzZXR0aW5nIGl0ZW0gaW4gb2JqZWN0OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgZWxzZSBpZiBhbGxvd3NBZGRpdGlvbmFsUHJvcGVydGllc1xuICAgICAgICAgICMgSnVzdCBwYXNzIHRocm91Z2ggdW4tc2NoZW1hJ2QgdmFsdWVzXG4gICAgICAgICAgbmV3VmFsdWVbcHJvcF0gPSBwcm9wVmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUud2FybiBcIklsbGVnYWwgb2JqZWN0IGtleTogI3trZXlQYXRofS4je3Byb3B9XCJcblxuICAgICAgbmV3VmFsdWVcblxuICAnYXJyYXknOlxuICAgIGNvZXJjZTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBhdCAje2tleVBhdGh9LCAje0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gbXVzdCBiZSBhbiBhcnJheVwiKSB1bmxlc3MgQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgICAgIGl0ZW1TY2hlbWEgPSBzY2hlbWEuaXRlbXNcbiAgICAgIGlmIGl0ZW1TY2hlbWE/XG4gICAgICAgIG5ld1ZhbHVlID0gW11cbiAgICAgICAgZm9yIGl0ZW0gaW4gdmFsdWVcbiAgICAgICAgICB0cnlcbiAgICAgICAgICAgIG5ld1ZhbHVlLnB1c2ggQGV4ZWN1dGVTY2hlbWFFbmZvcmNlcnMoa2V5UGF0aCwgaXRlbSwgaXRlbVNjaGVtYSlcbiAgICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgICAgY29uc29sZS53YXJuIFwiRXJyb3Igc2V0dGluZyBpdGVtIGluIGFycmF5OiAje2Vycm9yLm1lc3NhZ2V9XCJcbiAgICAgICAgbmV3VmFsdWVcbiAgICAgIGVsc2VcbiAgICAgICAgdmFsdWVcblxuICAnY29sb3InOlxuICAgIGNvZXJjZTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICBjb2xvciA9IENvbG9yLnBhcnNlKHZhbHVlKVxuICAgICAgdW5sZXNzIGNvbG9yP1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBhdCAje2tleVBhdGh9LCAje0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gY2Fubm90IGJlIGNvZXJjZWQgaW50byBhIGNvbG9yXCIpXG4gICAgICBjb2xvclxuXG4gICcqJzpcbiAgICBjb2VyY2VNaW5pbXVtQW5kTWF4aW11bTogKGtleVBhdGgsIHZhbHVlLCBzY2hlbWEpIC0+XG4gICAgICByZXR1cm4gdmFsdWUgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnbnVtYmVyJ1xuICAgICAgaWYgc2NoZW1hLm1pbmltdW0/IGFuZCB0eXBlb2Ygc2NoZW1hLm1pbmltdW0gaXMgJ251bWJlcidcbiAgICAgICAgdmFsdWUgPSBNYXRoLm1heCh2YWx1ZSwgc2NoZW1hLm1pbmltdW0pXG4gICAgICBpZiBzY2hlbWEubWF4aW11bT8gYW5kIHR5cGVvZiBzY2hlbWEubWF4aW11bSBpcyAnbnVtYmVyJ1xuICAgICAgICB2YWx1ZSA9IE1hdGgubWluKHZhbHVlLCBzY2hlbWEubWF4aW11bSlcbiAgICAgIHZhbHVlXG5cbiAgICB2YWxpZGF0ZUVudW06IChrZXlQYXRoLCB2YWx1ZSwgc2NoZW1hKSAtPlxuICAgICAgcG9zc2libGVWYWx1ZXMgPSBzY2hlbWEuZW51bVxuXG4gICAgICBpZiBBcnJheS5pc0FycmF5KHBvc3NpYmxlVmFsdWVzKVxuICAgICAgICBwb3NzaWJsZVZhbHVlcyA9IHBvc3NpYmxlVmFsdWVzLm1hcCAodmFsdWUpIC0+XG4gICAgICAgICAgaWYgdmFsdWUuaGFzT3duUHJvcGVydHkoJ3ZhbHVlJykgdGhlbiB2YWx1ZS52YWx1ZSBlbHNlIHZhbHVlXG5cbiAgICAgIHJldHVybiB2YWx1ZSB1bmxlc3MgcG9zc2libGVWYWx1ZXM/IGFuZCBBcnJheS5pc0FycmF5KHBvc3NpYmxlVmFsdWVzKSBhbmQgcG9zc2libGVWYWx1ZXMubGVuZ3RoXG5cbiAgICAgIGZvciBwb3NzaWJsZVZhbHVlIGluIHBvc3NpYmxlVmFsdWVzXG4gICAgICAgICMgVXNpbmcgYGlzRXF1YWxgIGZvciBwb3NzaWJpbGl0eSBvZiBwbGFjaW5nIGVudW1zIG9uIGFycmF5IGFuZCBvYmplY3Qgc2NoZW1hc1xuICAgICAgICByZXR1cm4gdmFsdWUgaWYgXy5pc0VxdWFsKHBvc3NpYmxlVmFsdWUsIHZhbHVlKVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGZhaWxlZCBhdCAje2tleVBhdGh9LCAje0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gaXMgbm90IG9uZSBvZiAje0pTT04uc3RyaW5naWZ5KHBvc3NpYmxlVmFsdWVzKX1cIilcblxuaXNQbGFpbk9iamVjdCA9ICh2YWx1ZSkgLT5cbiAgXy5pc09iamVjdCh2YWx1ZSkgYW5kIG5vdCBfLmlzQXJyYXkodmFsdWUpIGFuZCBub3QgXy5pc0Z1bmN0aW9uKHZhbHVlKSBhbmQgbm90IF8uaXNTdHJpbmcodmFsdWUpIGFuZCBub3QgKHZhbHVlIGluc3RhbmNlb2YgQ29sb3IpXG5cbnNvcnRPYmplY3QgPSAodmFsdWUpIC0+XG4gIHJldHVybiB2YWx1ZSB1bmxlc3MgaXNQbGFpbk9iamVjdCh2YWx1ZSlcbiAgcmVzdWx0ID0ge31cbiAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyh2YWx1ZSkuc29ydCgpXG4gICAgcmVzdWx0W2tleV0gPSBzb3J0T2JqZWN0KHZhbHVlW2tleV0pXG4gIHJlc3VsdFxuXG53aXRob3V0RW1wdHlPYmplY3RzID0gKG9iamVjdCkgLT5cbiAgcmVzdWx0T2JqZWN0ID0gdW5kZWZpbmVkXG4gIGlmIGlzUGxhaW5PYmplY3Qob2JqZWN0KVxuICAgIGZvciBrZXksIHZhbHVlIG9mIG9iamVjdFxuICAgICAgbmV3VmFsdWUgPSB3aXRob3V0RW1wdHlPYmplY3RzKHZhbHVlKVxuICAgICAgaWYgbmV3VmFsdWU/XG4gICAgICAgIHJlc3VsdE9iamVjdCA/PSB7fVxuICAgICAgICByZXN1bHRPYmplY3Rba2V5XSA9IG5ld1ZhbHVlXG4gIGVsc2VcbiAgICByZXN1bHRPYmplY3QgPSBvYmplY3RcbiAgcmVzdWx0T2JqZWN0XG4iXX0=
