Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _typeHelpers = require('./type-helpers');

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _selectorKit = require('selector-kit');

var _stable = require('stable');

var _stable2 = _interopRequireDefault(_stable);

var _scopeHelpers = require('./scope-helpers');

var _privateSymbols = require('./private-symbols');

// Deferred requires
'use babel';

var SymbolProvider = null;
var FuzzyProvider = null;
var grim = null;
var ProviderMetadata = null;

var ProviderManager = (function () {
  function ProviderManager() {
    var _this = this;

    _classCallCheck(this, ProviderManager);

    this.defaultProvider = null;
    this.defaultProviderRegistration = null;
    this.providers = null;
    this.store = null;
    this.subscriptions = null;
    this.globalBlacklist = null;
    this.applicableProviders = this.applicableProviders.bind(this);
    this.toggleDefaultProvider = this.toggleDefaultProvider.bind(this);
    this.setGlobalBlacklist = this.setGlobalBlacklist.bind(this);
    this.metadataForProvider = this.metadataForProvider.bind(this);
    this.apiVersionForProvider = this.apiVersionForProvider.bind(this);
    this.addProvider = this.addProvider.bind(this);
    this.removeProvider = this.removeProvider.bind(this);
    this.registerProvider = this.registerProvider.bind(this);
    this.subscriptions = new _atom.CompositeDisposable();
    this.globalBlacklist = new _atom.CompositeDisposable();
    this.subscriptions.add(this.globalBlacklist);
    this.providers = [];
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableBuiltinProvider', function (value) {
      return _this.toggleDefaultProvider(value);
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.scopeBlacklist', function (value) {
      return _this.setGlobalBlacklist(value);
    }));
  }

  _createClass(ProviderManager, [{
    key: 'dispose',
    value: function dispose() {
      this.toggleDefaultProvider(false);
      if (this.subscriptions && this.subscriptions.dispose) {
        this.subscriptions.dispose();
      }
      this.subscriptions = null;
      this.globalBlacklist = null;
      this.providers = null;
    }
  }, {
    key: 'applicableProviders',
    value: function applicableProviders(editor, scopeDescriptor) {
      var providers = this.filterProvidersByEditor(this.providers, editor);
      providers = this.filterProvidersByScopeDescriptor(providers, scopeDescriptor);
      providers = this.sortProviders(providers, scopeDescriptor);
      providers = this.filterProvidersByExcludeLowerPriority(providers);
      return this.removeMetadata(providers);
    }
  }, {
    key: 'filterProvidersByScopeDescriptor',
    value: function filterProvidersByScopeDescriptor(providers, scopeDescriptor) {
      var scopeChain = scopeChainForScopeDescriptor(scopeDescriptor);
      if (!scopeChain) {
        return [];
      }
      if (this.globalBlacklistSelectors != null && (0, _scopeHelpers.selectorsMatchScopeChain)(this.globalBlacklistSelectors, scopeChain)) {
        return [];
      }

      var matchingProviders = [];
      var disableDefaultProvider = false;
      var defaultProviderMetadata = null;
      for (var i = 0; i < providers.length; i++) {
        var providerMetadata = providers[i];
        var provider = providerMetadata.provider;

        if (provider === this.defaultProvider) {
          defaultProviderMetadata = providerMetadata;
        }
        if (providerMetadata.matchesScopeChain(scopeChain)) {
          matchingProviders.push(providerMetadata);
          if (providerMetadata.shouldDisableDefaultProvider(scopeChain)) {
            disableDefaultProvider = true;
          }
        }
      }

      if (disableDefaultProvider) {
        var index = matchingProviders.indexOf(defaultProviderMetadata);
        if (index > -1) {
          matchingProviders.splice(index, 1);
        }
      }
      return matchingProviders;
    }
  }, {
    key: 'sortProviders',
    value: function sortProviders(providers, scopeDescriptor) {
      var scopeChain = scopeChainForScopeDescriptor(scopeDescriptor);
      return (0, _stable2['default'])(providers, function (providerA, providerB) {
        var priorityA = providerA.provider.suggestionPriority != null ? providerA.provider.suggestionPriority : 1;
        var priorityB = providerB.provider.suggestionPriority != null ? providerB.provider.suggestionPriority : 1;
        var difference = priorityB - priorityA;
        if (difference === 0) {
          var specificityA = providerA.getSpecificity(scopeChain);
          var specificityB = providerB.getSpecificity(scopeChain);
          difference = specificityB - specificityA;
        }
        return difference;
      });
    }
  }, {
    key: 'filterProvidersByEditor',
    value: function filterProvidersByEditor(providers, editor) {
      return providers.filter(function (providerMetadata) {
        return providerMetadata.matchesEditor(editor);
      });
    }
  }, {
    key: 'filterProvidersByExcludeLowerPriority',
    value: function filterProvidersByExcludeLowerPriority(providers) {
      var lowestAllowedPriority = 0;
      for (var i = 0; i < providers.length; i++) {
        var providerMetadata = providers[i];
        var provider = providerMetadata.provider;

        if (provider.excludeLowerPriority) {
          lowestAllowedPriority = Math.max(lowestAllowedPriority, provider.inclusionPriority != null ? provider.inclusionPriority : 0);
        }
      }
      return providers.filter(function (providerMetadata) {
        return (providerMetadata.provider.inclusionPriority != null ? providerMetadata.provider.inclusionPriority : 0) >= lowestAllowedPriority;
      }).map(function (providerMetadata) {
        return providerMetadata;
      });
    }
  }, {
    key: 'removeMetadata',
    value: function removeMetadata(providers) {
      return providers.map(function (providerMetadata) {
        return providerMetadata.provider;
      });
    }
  }, {
    key: 'toggleDefaultProvider',
    value: function toggleDefaultProvider(enabled) {
      if (enabled == null) {
        return;
      }

      if (enabled) {
        if (this.defaultProvider != null || this.defaultProviderRegistration != null) {
          return;
        }
        if (atom.config.get('autocomplete-plus.defaultProvider') === 'Symbol') {
          if (typeof SymbolProvider === 'undefined' || SymbolProvider === null) {
            SymbolProvider = require('./symbol-provider');
          }
          this.defaultProvider = new SymbolProvider();
        } else {
          if (typeof FuzzyProvider === 'undefined' || FuzzyProvider === null) {
            FuzzyProvider = require('./fuzzy-provider');
          }
          this.defaultProvider = new FuzzyProvider();
        }
        this.defaultProviderRegistration = this.registerProvider(this.defaultProvider);
      } else {
        if (this.defaultProviderRegistration) {
          this.defaultProviderRegistration.dispose();
        }
        if (this.defaultProvider) {
          this.defaultProvider.dispose();
        }
        this.defaultProviderRegistration = null;
        this.defaultProvider = null;
      }
    }
  }, {
    key: 'setGlobalBlacklist',
    value: function setGlobalBlacklist(globalBlacklist) {
      this.globalBlacklistSelectors = null;
      if (globalBlacklist && globalBlacklist.length) {
        this.globalBlacklistSelectors = _selectorKit.Selector.create(globalBlacklist);
      }
    }
  }, {
    key: 'isValidProvider',
    value: function isValidProvider(provider, apiVersion) {
      // TODO API: Check based on the apiVersion
      if (_semver2['default'].satisfies(apiVersion, '>=2.0.0')) {
        return provider != null && (0, _typeHelpers.isFunction)(provider.getSuggestions) && ((0, _typeHelpers.isString)(provider.selector) && !!provider.selector.length || (0, _typeHelpers.isString)(provider.scopeSelector) && !!provider.scopeSelector.length);
      } else {
        return provider != null && (0, _typeHelpers.isFunction)(provider.requestHandler) && (0, _typeHelpers.isString)(provider.selector) && !!provider.selector.length;
      }
    }
  }, {
    key: 'metadataForProvider',
    value: function metadataForProvider(provider) {
      for (var i = 0; i < this.providers.length; i++) {
        var providerMetadata = this.providers[i];
        if (providerMetadata.provider === provider) {
          return providerMetadata;
        }
      }
      return null;
    }
  }, {
    key: 'apiVersionForProvider',
    value: function apiVersionForProvider(provider) {
      if (this.metadataForProvider(provider) && this.metadataForProvider(provider).apiVersion) {
        return this.metadataForProvider(provider).apiVersion;
      }
    }
  }, {
    key: 'isProviderRegistered',
    value: function isProviderRegistered(provider) {
      return this.metadataForProvider(provider) != null;
    }
  }, {
    key: 'addProvider',
    value: function addProvider(provider) {
      var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

      if (this.isProviderRegistered(provider)) {
        return;
      }
      if (typeof ProviderMetadata === 'undefined' || ProviderMetadata === null) {
        ProviderMetadata = require('./provider-metadata');
      }
      this.providers.push(new ProviderMetadata(provider, apiVersion));
      if (provider.dispose != null) {
        return this.subscriptions.add(provider);
      }
    }
  }, {
    key: 'removeProvider',
    value: function removeProvider(provider) {
      if (!this.providers) {
        return;
      }
      for (var i = 0; i < this.providers.length; i++) {
        var providerMetadata = this.providers[i];
        if (providerMetadata.provider === provider) {
          this.providers.splice(i, 1);
          break;
        }
      }
      if (provider.dispose != null) {
        if (this.subscriptions) {
          this.subscriptions.remove(provider);
        }
      }
    }
  }, {
    key: 'registerProvider',
    value: function registerProvider(provider) {
      var _this2 = this;

      var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

      if (provider == null) {
        return;
      }

      provider[_privateSymbols.API_VERSION] = apiVersion;

      var apiIs200 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');
      var apiIs300 = _semver2['default'].satisfies(apiVersion, '>=3.0.0');

      if (apiIs200) {
        if (provider.id != null && provider !== this.defaultProvider) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains an `id` property.\nAn `id` attribute on your provider is no longer necessary.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
        if (provider.requestHandler != null) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains a `requestHandler` property.\n`requestHandler` has been renamed to `getSuggestions`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
        if (provider.blacklist != null) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains a `blacklist` property.\n`blacklist` has been renamed to `disableForScopeSelector`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
      }

      if (apiIs300) {
        if (provider.selector != null) {
          throw new Error('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nspecifies `selector` instead of the `scopeSelector` attribute.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API.');
        }

        if (provider.disableForSelector != null) {
          throw new Error('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nspecifies `disableForSelector` instead of the `disableForScopeSelector`\nattribute.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API.');
        }
      }

      if (!this.isValidProvider(provider, apiVersion)) {
        console.warn('Provider ' + provider.constructor.name + ' is not valid', provider);
        return new _atom.Disposable();
      }

      if (this.isProviderRegistered(provider)) {
        return;
      }

      this.addProvider(provider, apiVersion);

      var disposable = new _atom.Disposable(function () {
        _this2.removeProvider(provider);
      });

      // When the provider is disposed, remove its registration
      var originalDispose = provider.dispose;
      if (originalDispose) {
        provider.dispose = function () {
          originalDispose.call(provider);
          disposable.dispose();
        };
      }

      return disposable;
    }
  }]);

  return ProviderManager;
})();

exports['default'] = ProviderManager;

var scopeChainForScopeDescriptor = function scopeChainForScopeDescriptor(scopeDescriptor) {
  // TODO: most of this is temp code to understand #308
  var type = typeof scopeDescriptor;
  var hasScopeChain = false;
  if (type === 'object' && scopeDescriptor && scopeDescriptor.getScopeChain) {
    hasScopeChain = true;
  }
  if (type === 'string') {
    return scopeDescriptor;
  } else if (type === 'object' && hasScopeChain) {
    var scopeChain = scopeDescriptor.getScopeChain();
    if (scopeChain != null && scopeChain.replace == null) {
      var json = JSON.stringify(scopeDescriptor);
      console.log(scopeDescriptor, json);
      throw new Error('01: ScopeChain is not correct type: ' + type + '; ' + json);
    }
    return scopeChain;
  } else {
    var json = JSON.stringify(scopeDescriptor);
    console.log(scopeDescriptor, json);
    throw new Error('02: ScopeChain is not correct type: ' + type + '; ' + json);
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3Byb3ZpZGVyLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFZ0QsTUFBTTs7MkJBQ2pCLGdCQUFnQjs7c0JBQ2xDLFFBQVE7Ozs7MkJBQ0YsY0FBYzs7c0JBQ2hCLFFBQVE7Ozs7NEJBRVUsaUJBQWlCOzs4QkFDOUIsbUJBQW1COzs7QUFUL0MsV0FBVyxDQUFBOztBQVlYLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQTtBQUN6QixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUE7QUFDeEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2YsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7O0lBRU4sZUFBZTtBQUN0QixXQURPLGVBQWUsR0FDbkI7OzswQkFESSxlQUFlOztBQUVoQyxRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtBQUMzQixRQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFBO0FBQ3ZDLFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO0FBQ2pCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFBO0FBQ3pCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO0FBQzNCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzlELFFBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2xFLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FB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aUJBQWEsR0FBRyxJQUFJLENBQUE7R0FDckI7QUFDRCxNQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDckIsV0FBTyxlQUFlLENBQUE7R0FDdkIsTUFBTSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksYUFBYSxFQUFFO0FBQzdDLFFBQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtBQUNsRCxRQUFJLEFBQUMsVUFBVSxJQUFJLElBQUksSUFBTSxVQUFVLENBQUMsT0FBTyxJQUFJLElBQUksQUFBQyxFQUFFO0FBQ3hELFVBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDNUMsYUFBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDbEMsWUFBTSxJQUFJLEtBQUssMENBQXdDLElBQUksVUFBSyxJQUFJLENBQUcsQ0FBQTtLQUN4RTtBQUNELFdBQU8sVUFBVSxDQUFBO0dBQ2xCLE1BQU07QUFDTCxRQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQzVDLFdBQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ2xDLFVBQU0sSUFBSSxLQUFLLDBDQUF3QyxJQUFJLFVBQUssSUFBSSxDQUFHLENBQUE7R0FDeEU7Q0FDRixDQUFBIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3Byb3ZpZGVyLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IGlzRnVuY3Rpb24sIGlzU3RyaW5nIH0gZnJvbSAnLi90eXBlLWhlbHBlcnMnXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCB7IFNlbGVjdG9yIH0gZnJvbSAnc2VsZWN0b3Ita2l0J1xuaW1wb3J0IHN0YWJsZVNvcnQgZnJvbSAnc3RhYmxlJ1xuXG5pbXBvcnQgeyBzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4gfSBmcm9tICcuL3Njb3BlLWhlbHBlcnMnXG5pbXBvcnQgeyBBUElfVkVSU0lPTiB9IGZyb20gJy4vcHJpdmF0ZS1zeW1ib2xzJ1xuXG4vLyBEZWZlcnJlZCByZXF1aXJlc1xubGV0IFN5bWJvbFByb3ZpZGVyID0gbnVsbFxubGV0IEZ1enp5UHJvdmlkZXIgPSBudWxsXG5sZXQgZ3JpbSA9IG51bGxcbmxldCBQcm92aWRlck1ldGFkYXRhID0gbnVsbFxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm92aWRlck1hbmFnZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5kZWZhdWx0UHJvdmlkZXIgPSBudWxsXG4gICAgdGhpcy5kZWZhdWx0UHJvdmlkZXJSZWdpc3RyYXRpb24gPSBudWxsXG4gICAgdGhpcy5wcm92aWRlcnMgPSBudWxsXG4gICAgdGhpcy5zdG9yZSA9IG51bGxcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5nbG9iYWxCbGFja2xpc3QgPSBudWxsXG4gICAgdGhpcy5hcHBsaWNhYmxlUHJvdmlkZXJzID0gdGhpcy5hcHBsaWNhYmxlUHJvdmlkZXJzLmJpbmQodGhpcylcbiAgICB0aGlzLnRvZ2dsZURlZmF1bHRQcm92aWRlciA9IHRoaXMudG9nZ2xlRGVmYXVsdFByb3ZpZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLnNldEdsb2JhbEJsYWNrbGlzdCA9IHRoaXMuc2V0R2xvYmFsQmxhY2tsaXN0LmJpbmQodGhpcylcbiAgICB0aGlzLm1ldGFkYXRhRm9yUHJvdmlkZXIgPSB0aGlzLm1ldGFkYXRhRm9yUHJvdmlkZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuYXBpVmVyc2lvbkZvclByb3ZpZGVyID0gdGhpcy5hcGlWZXJzaW9uRm9yUHJvdmlkZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuYWRkUHJvdmlkZXIgPSB0aGlzLmFkZFByb3ZpZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLnJlbW92ZVByb3ZpZGVyID0gdGhpcy5yZW1vdmVQcm92aWRlci5iaW5kKHRoaXMpXG4gICAgdGhpcy5yZWdpc3RlclByb3ZpZGVyID0gdGhpcy5yZWdpc3RlclByb3ZpZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5nbG9iYWxCbGFja2xpc3QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmdsb2JhbEJsYWNrbGlzdClcbiAgICB0aGlzLnByb3ZpZGVycyA9IFtdXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVCdWlsdGluUHJvdmlkZXInLCB2YWx1ZSA9PiB0aGlzLnRvZ2dsZURlZmF1bHRQcm92aWRlcih2YWx1ZSkpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuc2NvcGVCbGFja2xpc3QnLCB2YWx1ZSA9PiB0aGlzLnNldEdsb2JhbEJsYWNrbGlzdCh2YWx1ZSkpKVxuICB9XG5cbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy50b2dnbGVEZWZhdWx0UHJvdmlkZXIoZmFsc2UpXG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucyAmJiB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSkge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5nbG9iYWxCbGFja2xpc3QgPSBudWxsXG4gICAgdGhpcy5wcm92aWRlcnMgPSBudWxsXG4gIH1cblxuICBhcHBsaWNhYmxlUHJvdmlkZXJzIChlZGl0b3IsIHNjb3BlRGVzY3JpcHRvcikge1xuICAgIGxldCBwcm92aWRlcnMgPSB0aGlzLmZpbHRlclByb3ZpZGVyc0J5RWRpdG9yKHRoaXMucHJvdmlkZXJzLCBlZGl0b3IpXG4gICAgcHJvdmlkZXJzID0gdGhpcy5maWx0ZXJQcm92aWRlcnNCeVNjb3BlRGVzY3JpcHRvcihwcm92aWRlcnMsIHNjb3BlRGVzY3JpcHRvcilcbiAgICBwcm92aWRlcnMgPSB0aGlzLnNvcnRQcm92aWRlcnMocHJvdmlkZXJzLCBzY29wZURlc2NyaXB0b3IpXG4gICAgcHJvdmlkZXJzID0gdGhpcy5maWx0ZXJQcm92aWRlcnNCeUV4Y2x1ZGVMb3dlclByaW9yaXR5KHByb3ZpZGVycylcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVNZXRhZGF0YShwcm92aWRlcnMpXG4gIH1cblxuICBmaWx0ZXJQcm92aWRlcnNCeVNjb3BlRGVzY3JpcHRvciAocHJvdmlkZXJzLCBzY29wZURlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBzY29wZUNoYWluID0gc2NvcGVDaGFpbkZvclNjb3BlRGVzY3JpcHRvcihzY29wZURlc2NyaXB0b3IpXG4gICAgaWYgKCFzY29wZUNoYWluKSB7IHJldHVybiBbXSB9XG4gICAgaWYgKCh0aGlzLmdsb2JhbEJsYWNrbGlzdFNlbGVjdG9ycyAhPSBudWxsKSAmJiBzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4odGhpcy5nbG9iYWxCbGFja2xpc3RTZWxlY3RvcnMsIHNjb3BlQ2hhaW4pKSB7IHJldHVybiBbXSB9XG5cbiAgICBjb25zdCBtYXRjaGluZ1Byb3ZpZGVycyA9IFtdXG4gICAgbGV0IGRpc2FibGVEZWZhdWx0UHJvdmlkZXIgPSBmYWxzZVxuICAgIGxldCBkZWZhdWx0UHJvdmlkZXJNZXRhZGF0YSA9IG51bGxcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXJNZXRhZGF0YSA9IHByb3ZpZGVyc1tpXVxuICAgICAgY29uc3Qge3Byb3ZpZGVyfSA9IHByb3ZpZGVyTWV0YWRhdGFcbiAgICAgIGlmIChwcm92aWRlciA9PT0gdGhpcy5kZWZhdWx0UHJvdmlkZXIpIHtcbiAgICAgICAgZGVmYXVsdFByb3ZpZGVyTWV0YWRhdGEgPSBwcm92aWRlck1ldGFkYXRhXG4gICAgICB9XG4gICAgICBpZiAocHJvdmlkZXJNZXRhZGF0YS5tYXRjaGVzU2NvcGVDaGFpbihzY29wZUNoYWluKSkge1xuICAgICAgICBtYXRjaGluZ1Byb3ZpZGVycy5wdXNoKHByb3ZpZGVyTWV0YWRhdGEpXG4gICAgICAgIGlmIChwcm92aWRlck1ldGFkYXRhLnNob3VsZERpc2FibGVEZWZhdWx0UHJvdmlkZXIoc2NvcGVDaGFpbikpIHtcbiAgICAgICAgICBkaXNhYmxlRGVmYXVsdFByb3ZpZGVyID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRpc2FibGVEZWZhdWx0UHJvdmlkZXIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbWF0Y2hpbmdQcm92aWRlcnMuaW5kZXhPZihkZWZhdWx0UHJvdmlkZXJNZXRhZGF0YSlcbiAgICAgIGlmIChpbmRleCA+IC0xKSB7IG1hdGNoaW5nUHJvdmlkZXJzLnNwbGljZShpbmRleCwgMSkgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hpbmdQcm92aWRlcnNcbiAgfVxuXG4gIHNvcnRQcm92aWRlcnMgKHByb3ZpZGVycywgc2NvcGVEZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgc2NvcGVDaGFpbiA9IHNjb3BlQ2hhaW5Gb3JTY29wZURlc2NyaXB0b3Ioc2NvcGVEZXNjcmlwdG9yKVxuICAgIHJldHVybiBzdGFibGVTb3J0KHByb3ZpZGVycywgKHByb3ZpZGVyQSwgcHJvdmlkZXJCKSA9PiB7XG4gICAgICBjb25zdCBwcmlvcml0eUEgPSBwcm92aWRlckEucHJvdmlkZXIuc3VnZ2VzdGlvblByaW9yaXR5ICE9IG51bGwgPyBwcm92aWRlckEucHJvdmlkZXIuc3VnZ2VzdGlvblByaW9yaXR5IDogMVxuICAgICAgY29uc3QgcHJpb3JpdHlCID0gcHJvdmlkZXJCLnByb3ZpZGVyLnN1Z2dlc3Rpb25Qcmlvcml0eSAhPSBudWxsID8gcHJvdmlkZXJCLnByb3ZpZGVyLnN1Z2dlc3Rpb25Qcmlvcml0eSA6IDFcbiAgICAgIGxldCBkaWZmZXJlbmNlID0gcHJpb3JpdHlCIC0gcHJpb3JpdHlBXG4gICAgICBpZiAoZGlmZmVyZW5jZSA9PT0gMCkge1xuICAgICAgICBjb25zdCBzcGVjaWZpY2l0eUEgPSBwcm92aWRlckEuZ2V0U3BlY2lmaWNpdHkoc2NvcGVDaGFpbilcbiAgICAgICAgY29uc3Qgc3BlY2lmaWNpdHlCID0gcHJvdmlkZXJCLmdldFNwZWNpZmljaXR5KHNjb3BlQ2hhaW4pXG4gICAgICAgIGRpZmZlcmVuY2UgPSBzcGVjaWZpY2l0eUIgLSBzcGVjaWZpY2l0eUFcbiAgICAgIH1cbiAgICAgIHJldHVybiBkaWZmZXJlbmNlXG4gICAgfVxuICAgIClcbiAgfVxuXG4gIGZpbHRlclByb3ZpZGVyc0J5RWRpdG9yIChwcm92aWRlcnMsIGVkaXRvcikge1xuICAgIHJldHVybiBwcm92aWRlcnMuZmlsdGVyKHByb3ZpZGVyTWV0YWRhdGEgPT4gcHJvdmlkZXJNZXRhZGF0YS5tYXRjaGVzRWRpdG9yKGVkaXRvcikpXG4gIH1cblxuICBmaWx0ZXJQcm92aWRlcnNCeUV4Y2x1ZGVMb3dlclByaW9yaXR5IChwcm92aWRlcnMpIHtcbiAgICBsZXQgbG93ZXN0QWxsb3dlZFByaW9yaXR5ID0gMFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlck1ldGFkYXRhID0gcHJvdmlkZXJzW2ldXG4gICAgICBjb25zdCB7cHJvdmlkZXJ9ID0gcHJvdmlkZXJNZXRhZGF0YVxuICAgICAgaWYgKHByb3ZpZGVyLmV4Y2x1ZGVMb3dlclByaW9yaXR5KSB7XG4gICAgICAgIGxvd2VzdEFsbG93ZWRQcmlvcml0eSA9IE1hdGgubWF4KGxvd2VzdEFsbG93ZWRQcmlvcml0eSwgcHJvdmlkZXIuaW5jbHVzaW9uUHJpb3JpdHkgIT0gbnVsbCA/IHByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5IDogMClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByb3ZpZGVycy5maWx0ZXIoKHByb3ZpZGVyTWV0YWRhdGEpID0+IChwcm92aWRlck1ldGFkYXRhLnByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5ICE9IG51bGwgPyBwcm92aWRlck1ldGFkYXRhLnByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5IDogMCkgPj0gbG93ZXN0QWxsb3dlZFByaW9yaXR5KS5tYXAoKHByb3ZpZGVyTWV0YWRhdGEpID0+IHByb3ZpZGVyTWV0YWRhdGEpXG4gIH1cblxuICByZW1vdmVNZXRhZGF0YSAocHJvdmlkZXJzKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVycy5tYXAocHJvdmlkZXJNZXRhZGF0YSA9PiBwcm92aWRlck1ldGFkYXRhLnByb3ZpZGVyKVxuICB9XG5cbiAgdG9nZ2xlRGVmYXVsdFByb3ZpZGVyIChlbmFibGVkKSB7XG4gICAgaWYgKGVuYWJsZWQgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgIGlmICgodGhpcy5kZWZhdWx0UHJvdmlkZXIgIT0gbnVsbCkgfHwgKHRoaXMuZGVmYXVsdFByb3ZpZGVyUmVnaXN0cmF0aW9uICE9IG51bGwpKSB7IHJldHVybiB9XG4gICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5kZWZhdWx0UHJvdmlkZXInKSA9PT0gJ1N5bWJvbCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBTeW1ib2xQcm92aWRlciA9PT0gJ3VuZGVmaW5lZCcgfHwgU3ltYm9sUHJvdmlkZXIgPT09IG51bGwpIHsgU3ltYm9sUHJvdmlkZXIgPSByZXF1aXJlKCcuL3N5bWJvbC1wcm92aWRlcicpIH1cbiAgICAgICAgdGhpcy5kZWZhdWx0UHJvdmlkZXIgPSBuZXcgU3ltYm9sUHJvdmlkZXIoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBGdXp6eVByb3ZpZGVyID09PSAndW5kZWZpbmVkJyB8fCBGdXp6eVByb3ZpZGVyID09PSBudWxsKSB7IEZ1enp5UHJvdmlkZXIgPSByZXF1aXJlKCcuL2Z1enp5LXByb3ZpZGVyJykgfVxuICAgICAgICB0aGlzLmRlZmF1bHRQcm92aWRlciA9IG5ldyBGdXp6eVByb3ZpZGVyKClcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyUmVnaXN0cmF0aW9uID0gdGhpcy5yZWdpc3RlclByb3ZpZGVyKHRoaXMuZGVmYXVsdFByb3ZpZGVyKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5kZWZhdWx0UHJvdmlkZXJSZWdpc3RyYXRpb24pIHtcbiAgICAgICAgdGhpcy5kZWZhdWx0UHJvdmlkZXJSZWdpc3RyYXRpb24uZGlzcG9zZSgpXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5kZWZhdWx0UHJvdmlkZXIpIHtcbiAgICAgICAgdGhpcy5kZWZhdWx0UHJvdmlkZXIuZGlzcG9zZSgpXG4gICAgICB9XG4gICAgICB0aGlzLmRlZmF1bHRQcm92aWRlclJlZ2lzdHJhdGlvbiA9IG51bGxcbiAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIHNldEdsb2JhbEJsYWNrbGlzdCAoZ2xvYmFsQmxhY2tsaXN0KSB7XG4gICAgdGhpcy5nbG9iYWxCbGFja2xpc3RTZWxlY3RvcnMgPSBudWxsXG4gICAgaWYgKGdsb2JhbEJsYWNrbGlzdCAmJiBnbG9iYWxCbGFja2xpc3QubGVuZ3RoKSB7XG4gICAgICB0aGlzLmdsb2JhbEJsYWNrbGlzdFNlbGVjdG9ycyA9IFNlbGVjdG9yLmNyZWF0ZShnbG9iYWxCbGFja2xpc3QpXG4gICAgfVxuICB9XG5cbiAgaXNWYWxpZFByb3ZpZGVyIChwcm92aWRlciwgYXBpVmVyc2lvbikge1xuICAgIC8vIFRPRE8gQVBJOiBDaGVjayBiYXNlZCBvbiB0aGUgYXBpVmVyc2lvblxuICAgIGlmIChzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJykpIHtcbiAgICAgIHJldHVybiAocHJvdmlkZXIgIT0gbnVsbCkgJiZcbiAgICAgIGlzRnVuY3Rpb24ocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMpICYmXG4gICAgICAoKGlzU3RyaW5nKHByb3ZpZGVyLnNlbGVjdG9yKSAmJiAhIXByb3ZpZGVyLnNlbGVjdG9yLmxlbmd0aCkgfHxcbiAgICAgICAoaXNTdHJpbmcocHJvdmlkZXIuc2NvcGVTZWxlY3RvcikgJiYgISFwcm92aWRlci5zY29wZVNlbGVjdG9yLmxlbmd0aCkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAocHJvdmlkZXIgIT0gbnVsbCkgJiYgaXNGdW5jdGlvbihwcm92aWRlci5yZXF1ZXN0SGFuZGxlcikgJiYgaXNTdHJpbmcocHJvdmlkZXIuc2VsZWN0b3IpICYmICEhcHJvdmlkZXIuc2VsZWN0b3IubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgbWV0YWRhdGFGb3JQcm92aWRlciAocHJvdmlkZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlck1ldGFkYXRhID0gdGhpcy5wcm92aWRlcnNbaV1cbiAgICAgIGlmIChwcm92aWRlck1ldGFkYXRhLnByb3ZpZGVyID09PSBwcm92aWRlcikgeyByZXR1cm4gcHJvdmlkZXJNZXRhZGF0YSB9XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBhcGlWZXJzaW9uRm9yUHJvdmlkZXIgKHByb3ZpZGVyKSB7XG4gICAgaWYgKHRoaXMubWV0YWRhdGFGb3JQcm92aWRlcihwcm92aWRlcikgJiYgdGhpcy5tZXRhZGF0YUZvclByb3ZpZGVyKHByb3ZpZGVyKS5hcGlWZXJzaW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5tZXRhZGF0YUZvclByb3ZpZGVyKHByb3ZpZGVyKS5hcGlWZXJzaW9uXG4gICAgfVxuICB9XG5cbiAgaXNQcm92aWRlclJlZ2lzdGVyZWQgKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuICh0aGlzLm1ldGFkYXRhRm9yUHJvdmlkZXIocHJvdmlkZXIpICE9IG51bGwpXG4gIH1cblxuICBhZGRQcm92aWRlciAocHJvdmlkZXIsIGFwaVZlcnNpb24gPSAnMy4wLjAnKSB7XG4gICAgaWYgKHRoaXMuaXNQcm92aWRlclJlZ2lzdGVyZWQocHJvdmlkZXIpKSB7IHJldHVybiB9XG4gICAgaWYgKHR5cGVvZiBQcm92aWRlck1ldGFkYXRhID09PSAndW5kZWZpbmVkJyB8fCBQcm92aWRlck1ldGFkYXRhID09PSBudWxsKSB7IFByb3ZpZGVyTWV0YWRhdGEgPSByZXF1aXJlKCcuL3Byb3ZpZGVyLW1ldGFkYXRhJykgfVxuICAgIHRoaXMucHJvdmlkZXJzLnB1c2gobmV3IFByb3ZpZGVyTWV0YWRhdGEocHJvdmlkZXIsIGFwaVZlcnNpb24pKVxuICAgIGlmIChwcm92aWRlci5kaXNwb3NlICE9IG51bGwpIHsgcmV0dXJuIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQocHJvdmlkZXIpIH1cbiAgfVxuXG4gIHJlbW92ZVByb3ZpZGVyIChwcm92aWRlcikge1xuICAgIGlmICghdGhpcy5wcm92aWRlcnMpIHsgcmV0dXJuIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm92aWRlck1ldGFkYXRhID0gdGhpcy5wcm92aWRlcnNbaV1cbiAgICAgIGlmIChwcm92aWRlck1ldGFkYXRhLnByb3ZpZGVyID09PSBwcm92aWRlcikge1xuICAgICAgICB0aGlzLnByb3ZpZGVycy5zcGxpY2UoaSwgMSlcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByb3ZpZGVyLmRpc3Bvc2UgIT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHByb3ZpZGVyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyUHJvdmlkZXIgKHByb3ZpZGVyLCBhcGlWZXJzaW9uID0gJzMuMC4wJykge1xuICAgIGlmIChwcm92aWRlciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBwcm92aWRlcltBUElfVkVSU0lPTl0gPSBhcGlWZXJzaW9uXG5cbiAgICBjb25zdCBhcGlJczIwMCA9IHNlbXZlci5zYXRpc2ZpZXMoYXBpVmVyc2lvbiwgJz49Mi4wLjAnKVxuICAgIGNvbnN0IGFwaUlzMzAwID0gc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0zLjAuMCcpXG5cbiAgICBpZiAoYXBpSXMyMDApIHtcbiAgICAgIGlmICgocHJvdmlkZXIuaWQgIT0gbnVsbCkgJiYgcHJvdmlkZXIgIT09IHRoaXMuZGVmYXVsdFByb3ZpZGVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5jb250YWlucyBhbiBcXGBpZFxcYCBwcm9wZXJ0eS5cbkFuIFxcYGlkXFxgIGF0dHJpYnV0ZSBvbiB5b3VyIHByb3ZpZGVyIGlzIG5vIGxvbmdlciBuZWNlc3NhcnkuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIGlmIChwcm92aWRlci5yZXF1ZXN0SGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5jb250YWlucyBhIFxcYHJlcXVlc3RIYW5kbGVyXFxgIHByb3BlcnR5LlxuXFxgcmVxdWVzdEhhbmRsZXJcXGAgaGFzIGJlZW4gcmVuYW1lZCB0byBcXGBnZXRTdWdnZXN0aW9uc1xcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgaWYgKHByb3ZpZGVyLmJsYWNrbGlzdCAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5jb250YWlucyBhIFxcYGJsYWNrbGlzdFxcYCBwcm9wZXJ0eS5cblxcYGJsYWNrbGlzdFxcYCBoYXMgYmVlbiByZW5hbWVkIHRvIFxcYGRpc2FibGVGb3JTY29wZVNlbGVjdG9yXFxgLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFwaUlzMzAwKSB7XG4gICAgICBpZiAocHJvdmlkZXIuc2VsZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5zcGVjaWZpZXMgXFxgc2VsZWN0b3JcXGAgaW5zdGVhZCBvZiB0aGUgXFxgc2NvcGVTZWxlY3RvclxcYCBhdHRyaWJ1dGUuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUEkuYClcbiAgICAgIH1cblxuICAgICAgaWYgKHByb3ZpZGVyLmRpc2FibGVGb3JTZWxlY3RvciAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnNwZWNpZmllcyBcXGBkaXNhYmxlRm9yU2VsZWN0b3JcXGAgaW5zdGVhZCBvZiB0aGUgXFxgZGlzYWJsZUZvclNjb3BlU2VsZWN0b3JcXGBcbmF0dHJpYnV0ZS5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSS5gKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5pc1ZhbGlkUHJvdmlkZXIocHJvdmlkZXIsIGFwaVZlcnNpb24pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFByb3ZpZGVyICR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0gaXMgbm90IHZhbGlkYCwgcHJvdmlkZXIpXG4gICAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmlzUHJvdmlkZXJSZWdpc3RlcmVkKHByb3ZpZGVyKSkgeyByZXR1cm4gfVxuXG4gICAgdGhpcy5hZGRQcm92aWRlcihwcm92aWRlciwgYXBpVmVyc2lvbilcblxuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0aGlzLnJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyKVxuICAgIH0pXG5cbiAgICAvLyBXaGVuIHRoZSBwcm92aWRlciBpcyBkaXNwb3NlZCwgcmVtb3ZlIGl0cyByZWdpc3RyYXRpb25cbiAgICBjb25zdCBvcmlnaW5hbERpc3Bvc2UgPSBwcm92aWRlci5kaXNwb3NlXG4gICAgaWYgKG9yaWdpbmFsRGlzcG9zZSkge1xuICAgICAgcHJvdmlkZXIuZGlzcG9zZSA9ICgpID0+IHtcbiAgICAgICAgb3JpZ2luYWxEaXNwb3NlLmNhbGwocHJvdmlkZXIpXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc3Bvc2FibGVcbiAgfVxufVxuXG5jb25zdCBzY29wZUNoYWluRm9yU2NvcGVEZXNjcmlwdG9yID0gKHNjb3BlRGVzY3JpcHRvcikgPT4ge1xuICAvLyBUT0RPOiBtb3N0IG9mIHRoaXMgaXMgdGVtcCBjb2RlIHRvIHVuZGVyc3RhbmQgIzMwOFxuICBjb25zdCB0eXBlID0gdHlwZW9mIHNjb3BlRGVzY3JpcHRvclxuICBsZXQgaGFzU2NvcGVDaGFpbiA9IGZhbHNlXG4gIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiBzY29wZURlc2NyaXB0b3IgJiYgc2NvcGVEZXNjcmlwdG9yLmdldFNjb3BlQ2hhaW4pIHtcbiAgICBoYXNTY29wZUNoYWluID0gdHJ1ZVxuICB9XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzY29wZURlc2NyaXB0b3JcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiBoYXNTY29wZUNoYWluKSB7XG4gICAgY29uc3Qgc2NvcGVDaGFpbiA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKClcbiAgICBpZiAoKHNjb3BlQ2hhaW4gIT0gbnVsbCkgJiYgKHNjb3BlQ2hhaW4ucmVwbGFjZSA9PSBudWxsKSkge1xuICAgICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHNjb3BlRGVzY3JpcHRvcilcbiAgICAgIGNvbnNvbGUubG9nKHNjb3BlRGVzY3JpcHRvciwganNvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcihgMDE6IFNjb3BlQ2hhaW4gaXMgbm90IGNvcnJlY3QgdHlwZTogJHt0eXBlfTsgJHtqc29ufWApXG4gICAgfVxuICAgIHJldHVybiBzY29wZUNoYWluXG4gIH0gZWxzZSB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHNjb3BlRGVzY3JpcHRvcilcbiAgICBjb25zb2xlLmxvZyhzY29wZURlc2NyaXB0b3IsIGpzb24pXG4gICAgdGhyb3cgbmV3IEVycm9yKGAwMjogU2NvcGVDaGFpbiBpcyBub3QgY29ycmVjdCB0eXBlOiAke3R5cGV9OyAke2pzb259YClcbiAgfVxufVxuIl19