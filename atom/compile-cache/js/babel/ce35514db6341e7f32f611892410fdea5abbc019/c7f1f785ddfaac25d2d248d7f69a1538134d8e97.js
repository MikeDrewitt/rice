Object.defineProperty(exports, '__esModule', {
  value: true
});

var _atom = require('atom');

'use babel';

exports['default'] = {
  autocompleteManager: null,
  subscriptions: null,

  // Public: Creates AutocompleteManager instances for all active and future editors (soon, just a single AutocompleteManager)
  activate: function activate() {
    this.subscriptions = new _atom.CompositeDisposable();
    return this.requireAutocompleteManagerAsync();
  },

  // Public: Cleans everything up, removes all AutocompleteManager instances
  deactivate: function deactivate() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    this.subscriptions = null;
    this.autocompleteManager = null;
  },

  requireAutocompleteManagerAsync: function requireAutocompleteManagerAsync(callback) {
    var _this = this;

    if (this.autocompleteManager) {
      if (callback) {
        callback(this.autocompleteManager);
      }
    } else {
      setImmediate(function () {
        var a = _this.getAutocompleteManager();
        if (a && callback) {
          callback(a);
        }
      });
    }
  },

  getAutocompleteManager: function getAutocompleteManager() {
    if (!this.autocompleteManager) {
      var AutocompleteManager = require('./autocomplete-manager');
      this.autocompleteManager = new AutocompleteManager();
      this.subscriptions.add(this.autocompleteManager);
    }

    return this.autocompleteManager;
  },

  consumeSnippets: function consumeSnippets(snippetsManager) {
    return this.requireAutocompleteManagerAsync(function (autocompleteManager) {
      autocompleteManager.setSnippetsManager(snippetsManager);
    });
  },

  /*
  Section: Provider API
  */

  // 1.0.0 API
  // service - {provider: provider1}
  consumeProvider_1_0: function consumeProvider_1_0(service) {
    if (!service || !service.provider) {
      return;
    }
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider([service.provider], '1.0.0');
  },

  // 1.1.0 API
  // service - {providers: [provider1, provider2, ...]}
  consumeProvider_1_1: function consumeProvider_1_1(service) {
    if (!service || !service.providers) {
      return;
    }
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider(service.providers, '1.1.0');
  },

  // 2.0.0 API
  // providers - either a provider or a list of providers
  consumeProvider_2_0: function consumeProvider_2_0(providers) {
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider(providers, '2.0.0');
  },

  // 3.0.0 API
  // providers - either a provider or a list of providers
  consumeProvider_3_0: function consumeProvider_3_0(providers) {
    return this.consumeProvider(providers, '3.0.0');
  },

  consumeProvider: function consumeProvider(providers) {
    var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

    if (!providers) {
      return;
    }
    if (providers && !Array.isArray(providers)) {
      providers = [providers];
    }
    if (!providers.length > 0) {
      return;
    }

    var registrations = new _atom.CompositeDisposable();
    this.requireAutocompleteManagerAsync(function (autocompleteManager) {
      for (var i = 0; i < providers.length; i++) {
        var provider = providers[i];
        registrations.add(autocompleteManager.providerManager.registerProvider(provider, apiVersion));
      }
    });
    return registrations;
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztvQkFFb0MsTUFBTTs7QUFGMUMsV0FBVyxDQUFBOztxQkFJSTtBQUNiLHFCQUFtQixFQUFFLElBQUk7QUFDekIsZUFBYSxFQUFFLElBQUk7OztBQUduQixVQUFRLEVBQUMsb0JBQUc7QUFDVixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQzlDLFdBQU8sSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUE7R0FDOUM7OztBQUdELFlBQVUsRUFBQyxzQkFBRztBQUNaLFFBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCO0FBQ0QsUUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7QUFDekIsUUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQTtHQUNoQzs7QUFFRCxpQ0FBK0IsRUFBQyx5Q0FBQyxRQUFRLEVBQUU7OztBQUN6QyxRQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUM1QixVQUFJLFFBQVEsRUFBRTtBQUNaLGdCQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUE7T0FDbkM7S0FDRixNQUFNO0FBQ0wsa0JBQVksQ0FBQyxZQUFNO0FBQ2pCLFlBQU0sQ0FBQyxHQUFHLE1BQUssc0JBQXNCLEVBQUUsQ0FBQTtBQUN2QyxZQUFJLENBQUMsSUFBSSxRQUFRLEVBQUU7QUFDakIsa0JBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUNaO09BQ0YsQ0FBQyxDQUFBO0tBQ0g7R0FDRjs7QUFFRCx3QkFBc0IsRUFBQyxrQ0FBRztBQUN4QixRQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQzdCLFVBQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUE7QUFDN0QsVUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQTtBQUNwRCxVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtLQUNqRDs7QUFFRCxXQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQTtHQUNoQzs7QUFFRCxpQkFBZSxFQUFDLHlCQUFDLGVBQWUsRUFBRTtBQUNoQyxXQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxVQUFDLG1CQUFtQixFQUFLO0FBQ25FLHlCQUFtQixDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFBO0tBQ3hELENBQUMsQ0FBQTtHQUNIOzs7Ozs7OztBQVFELHFCQUFtQixFQUFDLDZCQUFDLE9BQU8sRUFBRTtBQUM1QixRQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUNqQyxhQUFNO0tBQ1A7O0FBRUQsV0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0dBQ3pEOzs7O0FBSUQscUJBQW1CLEVBQUMsNkJBQUMsT0FBTyxFQUFFO0FBQzVCLFFBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO0FBQ2xDLGFBQU07S0FDUDs7QUFFRCxXQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtHQUN4RDs7OztBQUlELHFCQUFtQixFQUFDLDZCQUFDLFNBQVMsRUFBRTs7QUFFOUIsV0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtHQUNoRDs7OztBQUlELHFCQUFtQixFQUFDLDZCQUFDLFNBQVMsRUFBRTtBQUM5QixXQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0dBQ2hEOztBQUVELGlCQUFlLEVBQUMseUJBQUMsU0FBUyxFQUF3QjtRQUF0QixVQUFVLHlEQUFHLE9BQU87O0FBQzlDLFFBQUksQ0FBQyxTQUFTLEVBQUU7QUFDZCxhQUFNO0tBQ1A7QUFDRCxRQUFJLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDMUMsZUFBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7S0FDeEI7QUFDRCxRQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDekIsYUFBTTtLQUNQOztBQUVELFFBQU0sYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQy9DLFFBQUksQ0FBQywrQkFBK0IsQ0FBQyxVQUFDLG1CQUFtQixFQUFLO0FBQzVELFdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3pDLFlBQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUM3QixxQkFBYSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUE7T0FDOUY7S0FDRixDQUFDLENBQUE7QUFDRixXQUFPLGFBQWEsQ0FBQTtHQUNyQjtDQUNGIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBhdXRvY29tcGxldGVNYW5hZ2VyOiBudWxsLFxuICBzdWJzY3JpcHRpb25zOiBudWxsLFxuXG4gIC8vIFB1YmxpYzogQ3JlYXRlcyBBdXRvY29tcGxldGVNYW5hZ2VyIGluc3RhbmNlcyBmb3IgYWxsIGFjdGl2ZSBhbmQgZnV0dXJlIGVkaXRvcnMgKHNvb24sIGp1c3QgYSBzaW5nbGUgQXV0b2NvbXBsZXRlTWFuYWdlcilcbiAgYWN0aXZhdGUgKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICByZXR1cm4gdGhpcy5yZXF1aXJlQXV0b2NvbXBsZXRlTWFuYWdlckFzeW5jKClcbiAgfSxcblxuICAvLyBQdWJsaWM6IENsZWFucyBldmVyeXRoaW5nIHVwLCByZW1vdmVzIGFsbCBBdXRvY29tcGxldGVNYW5hZ2VyIGluc3RhbmNlc1xuICBkZWFjdGl2YXRlICgpIHtcbiAgICBpZiAodGhpcy5zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLmF1dG9jb21wbGV0ZU1hbmFnZXIgPSBudWxsXG4gIH0sXG5cbiAgcmVxdWlyZUF1dG9jb21wbGV0ZU1hbmFnZXJBc3luYyAoY2FsbGJhY2spIHtcbiAgICBpZiAodGhpcy5hdXRvY29tcGxldGVNYW5hZ2VyKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sodGhpcy5hdXRvY29tcGxldGVNYW5hZ2VyKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICBjb25zdCBhID0gdGhpcy5nZXRBdXRvY29tcGxldGVNYW5hZ2VyKClcbiAgICAgICAgaWYgKGEgJiYgY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhhKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfSxcblxuICBnZXRBdXRvY29tcGxldGVNYW5hZ2VyICgpIHtcbiAgICBpZiAoIXRoaXMuYXV0b2NvbXBsZXRlTWFuYWdlcikge1xuICAgICAgY29uc3QgQXV0b2NvbXBsZXRlTWFuYWdlciA9IHJlcXVpcmUoJy4vYXV0b2NvbXBsZXRlLW1hbmFnZXInKVxuICAgICAgdGhpcy5hdXRvY29tcGxldGVNYW5hZ2VyID0gbmV3IEF1dG9jb21wbGV0ZU1hbmFnZXIoKVxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmF1dG9jb21wbGV0ZU1hbmFnZXIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYXV0b2NvbXBsZXRlTWFuYWdlclxuICB9LFxuXG4gIGNvbnN1bWVTbmlwcGV0cyAoc25pcHBldHNNYW5hZ2VyKSB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWlyZUF1dG9jb21wbGV0ZU1hbmFnZXJBc3luYygoYXV0b2NvbXBsZXRlTWFuYWdlcikgPT4ge1xuICAgICAgYXV0b2NvbXBsZXRlTWFuYWdlci5zZXRTbmlwcGV0c01hbmFnZXIoc25pcHBldHNNYW5hZ2VyKVxuICAgIH0pXG4gIH0sXG5cbiAgLypcbiAgU2VjdGlvbjogUHJvdmlkZXIgQVBJXG4gICovXG5cbiAgLy8gMS4wLjAgQVBJXG4gIC8vIHNlcnZpY2UgLSB7cHJvdmlkZXI6IHByb3ZpZGVyMX1cbiAgY29uc3VtZVByb3ZpZGVyXzFfMCAoc2VydmljZSkge1xuICAgIGlmICghc2VydmljZSB8fCAhc2VydmljZS5wcm92aWRlcikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIFRPRE8gQVBJOiBEZXByZWNhdGUsIHRlbGwgdGhlbSB0byB1cGdyYWRlIHRvIDMuMFxuICAgIHJldHVybiB0aGlzLmNvbnN1bWVQcm92aWRlcihbc2VydmljZS5wcm92aWRlcl0sICcxLjAuMCcpXG4gIH0sXG5cbiAgLy8gMS4xLjAgQVBJXG4gIC8vIHNlcnZpY2UgLSB7cHJvdmlkZXJzOiBbcHJvdmlkZXIxLCBwcm92aWRlcjIsIC4uLl19XG4gIGNvbnN1bWVQcm92aWRlcl8xXzEgKHNlcnZpY2UpIHtcbiAgICBpZiAoIXNlcnZpY2UgfHwgIXNlcnZpY2UucHJvdmlkZXJzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gVE9ETyBBUEk6IERlcHJlY2F0ZSwgdGVsbCB0aGVtIHRvIHVwZ3JhZGUgdG8gMy4wXG4gICAgcmV0dXJuIHRoaXMuY29uc3VtZVByb3ZpZGVyKHNlcnZpY2UucHJvdmlkZXJzLCAnMS4xLjAnKVxuICB9LFxuXG4gIC8vIDIuMC4wIEFQSVxuICAvLyBwcm92aWRlcnMgLSBlaXRoZXIgYSBwcm92aWRlciBvciBhIGxpc3Qgb2YgcHJvdmlkZXJzXG4gIGNvbnN1bWVQcm92aWRlcl8yXzAgKHByb3ZpZGVycykge1xuICAgIC8vIFRPRE8gQVBJOiBEZXByZWNhdGUsIHRlbGwgdGhlbSB0byB1cGdyYWRlIHRvIDMuMFxuICAgIHJldHVybiB0aGlzLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcnMsICcyLjAuMCcpXG4gIH0sXG5cbiAgLy8gMy4wLjAgQVBJXG4gIC8vIHByb3ZpZGVycyAtIGVpdGhlciBhIHByb3ZpZGVyIG9yIGEgbGlzdCBvZiBwcm92aWRlcnNcbiAgY29uc3VtZVByb3ZpZGVyXzNfMCAocHJvdmlkZXJzKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVycywgJzMuMC4wJylcbiAgfSxcblxuICBjb25zdW1lUHJvdmlkZXIgKHByb3ZpZGVycywgYXBpVmVyc2lvbiA9ICczLjAuMCcpIHtcbiAgICBpZiAoIXByb3ZpZGVycykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChwcm92aWRlcnMgJiYgIUFycmF5LmlzQXJyYXkocHJvdmlkZXJzKSkge1xuICAgICAgcHJvdmlkZXJzID0gW3Byb3ZpZGVyc11cbiAgICB9XG4gICAgaWYgKCFwcm92aWRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgcmVnaXN0cmF0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnJlcXVpcmVBdXRvY29tcGxldGVNYW5hZ2VyQXN5bmMoKGF1dG9jb21wbGV0ZU1hbmFnZXIpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJzW2ldXG4gICAgICAgIHJlZ2lzdHJhdGlvbnMuYWRkKGF1dG9jb21wbGV0ZU1hbmFnZXIucHJvdmlkZXJNYW5hZ2VyLnJlZ2lzdGVyUHJvdmlkZXIocHJvdmlkZXIsIGFwaVZlcnNpb24pKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHJlZ2lzdHJhdGlvbnNcbiAgfVxufVxuIl19