Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _selectorKit = require('selector-kit');

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _scopeHelpers = require('./scope-helpers');

var _privateSymbols = require('./private-symbols');

'use babel';

var ProviderMetadata = (function () {
  function ProviderMetadata(provider, apiVersion) {
    _classCallCheck(this, ProviderMetadata);

    // TODO API: remove this when 2.0 support is removed

    this.provider = provider;
    this.apiVersion = apiVersion;
    if (this.provider.selector != null) {
      this.scopeSelectors = _selectorKit.Selector.create(this.provider.selector);
    } else {
      this.scopeSelectors = _selectorKit.Selector.create(this.provider.scopeSelector);
    }

    // TODO API: remove this when 2.0 support is removed
    if (this.provider.disableForSelector != null) {
      this.disableForScopeSelectors = _selectorKit.Selector.create(this.provider.disableForSelector);
    } else if (this.provider.disableForScopeSelector != null) {
      this.disableForScopeSelectors = _selectorKit.Selector.create(this.provider.disableForScopeSelector);
    }

    // TODO API: remove this when 1.0 support is removed
    var providerBlacklist = undefined;
    if (this.provider.providerblacklist && this.provider.providerblacklist['autocomplete-plus-fuzzyprovider']) {
      providerBlacklist = this.provider.providerblacklist['autocomplete-plus-fuzzyprovider'];
    }
    if (providerBlacklist) {
      this.disableDefaultProviderSelectors = _selectorKit.Selector.create(providerBlacklist);
    }

    this.enableCustomTextEditorSelector = _semver2['default'].satisfies(this.provider[_privateSymbols.API_VERSION], '>=3.0.0');
  }

  _createClass(ProviderMetadata, [{
    key: 'matchesEditor',
    value: function matchesEditor(editor) {
      if (this.enableCustomTextEditorSelector && this.provider.getTextEditorSelector != null) {
        return atom.views.getView(editor).matches(this.provider.getTextEditorSelector());
      } else {
        // Backwards compatibility.
        return atom.views.getView(editor).matches('atom-pane > .item-views > atom-text-editor');
      }
    }
  }, {
    key: 'matchesScopeChain',
    value: function matchesScopeChain(scopeChain) {
      if (this.disableForScopeSelectors != null) {
        if ((0, _scopeHelpers.selectorsMatchScopeChain)(this.disableForScopeSelectors, scopeChain)) {
          return false;
        }
      }

      if ((0, _scopeHelpers.selectorsMatchScopeChain)(this.scopeSelectors, scopeChain)) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: 'shouldDisableDefaultProvider',
    value: function shouldDisableDefaultProvider(scopeChain) {
      if (this.disableDefaultProviderSelectors != null) {
        return (0, _scopeHelpers.selectorsMatchScopeChain)(this.disableDefaultProviderSelectors, scopeChain);
      } else {
        return false;
      }
    }
  }, {
    key: 'getSpecificity',
    value: function getSpecificity(scopeChain) {
      var selector = (0, _scopeHelpers.selectorForScopeChain)(this.scopeSelectors, scopeChain);
      if (selector) {
        return selector.getSpecificity();
      } else {
        return 0;
      }
    }
  }]);

  return ProviderMetadata;
})();

exports['default'] = ProviderMetadata;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3Byb3ZpZGVyLW1ldGFkYXRhLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7MkJBRXlCLGNBQWM7O3NCQUNwQixRQUFROzs7OzRCQUNxQyxpQkFBaUI7OzhCQUVyRCxtQkFBbUI7O0FBTi9DLFdBQVcsQ0FBQTs7SUFRVSxnQkFBZ0I7QUFDdkIsV0FETyxnQkFBZ0IsQ0FDdEIsUUFBUSxFQUFFLFVBQVUsRUFBRTswQkFEaEIsZ0JBQWdCOzs7O0FBSWpDLFFBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO0FBQ3hCLFFBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0FBQzVCLFFBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxFQUFFO0FBQ2xDLFVBQUksQ0FBQyxjQUFjLEdBQUcsc0JBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDOUQsTUFBTTtBQUNMLFVBQUksQ0FBQyxjQUFjLEdBQUcsc0JBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUE7S0FDbkU7OztBQUdELFFBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLEVBQUU7QUFDNUMsVUFBSSxDQUFDLHdCQUF3QixHQUFHLHNCQUFTLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUE7S0FDbEYsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQXVCLElBQUksSUFBSSxFQUFFO0FBQ3hELFVBQUksQ0FBQyx3QkFBd0IsR0FBRyxzQkFBUyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0tBQ3ZGOzs7QUFHRCxRQUFJLGlCQUFpQixZQUFBLENBQUE7QUFDckIsUUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsaUNBQWlDLENBQUMsRUFBRTtBQUN6Ryx1QkFBaUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGlDQUFpQyxDQUFDLENBQUE7S0FDdkY7QUFDRCxRQUFJLGlCQUFpQixFQUFFO0FBQ3JCLFVBQUksQ0FBQywrQkFBK0IsR0FBRyxzQkFBUyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtLQUMxRTs7QUFFRCxRQUFJLENBQUMsOEJBQThCLEdBQUcsb0JBQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLDZCQUFhLEVBQUUsU0FBUyxDQUFDLENBQUE7R0FDOUY7O2VBN0JrQixnQkFBZ0I7O1dBK0JyQix1QkFBQyxNQUFNLEVBQUU7QUFDckIsVUFBSSxJQUFJLENBQUMsOEJBQThCLElBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLEFBQUMsRUFBRTtBQUN4RixlQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQTtPQUNqRixNQUFNOztBQUVMLGVBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLDRDQUE0QyxDQUFDLENBQUE7T0FDeEY7S0FDRjs7O1dBRWlCLDJCQUFDLFVBQVUsRUFBRTtBQUM3QixVQUFJLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLEVBQUU7QUFDekMsWUFBSSw0Q0FBeUIsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQUUsaUJBQU8sS0FBSyxDQUFBO1NBQUU7T0FDMUY7O0FBRUQsVUFBSSw0Q0FBeUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsRUFBRTtBQUM3RCxlQUFPLElBQUksQ0FBQTtPQUNaLE1BQU07QUFDTCxlQUFPLEtBQUssQ0FBQTtPQUNiO0tBQ0Y7OztXQUU0QixzQ0FBQyxVQUFVLEVBQUU7QUFDeEMsVUFBSSxJQUFJLENBQUMsK0JBQStCLElBQUksSUFBSSxFQUFFO0FBQ2hELGVBQU8sNENBQXlCLElBQUksQ0FBQywrQkFBK0IsRUFBRSxVQUFVLENBQUMsQ0FBQTtPQUNsRixNQUFNO0FBQ0wsZUFBTyxLQUFLLENBQUE7T0FDYjtLQUNGOzs7V0FFYyx3QkFBQyxVQUFVLEVBQUU7QUFDMUIsVUFBTSxRQUFRLEdBQUcseUNBQXNCLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFDdkUsVUFBSSxRQUFRLEVBQUU7QUFDWixlQUFPLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtPQUNqQyxNQUFNO0FBQ0wsZUFBTyxDQUFDLENBQUE7T0FDVDtLQUNGOzs7U0FuRWtCLGdCQUFnQjs7O3FCQUFoQixnQkFBZ0IiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvcHJvdmlkZXItbWV0YWRhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBTZWxlY3RvciB9IGZyb20gJ3NlbGVjdG9yLWtpdCdcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJ1xuaW1wb3J0IHsgc2VsZWN0b3JGb3JTY29wZUNoYWluLCBzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4gfSBmcm9tICcuL3Njb3BlLWhlbHBlcnMnXG5cbmltcG9ydCB7IEFQSV9WRVJTSU9OIH0gZnJvbSAnLi9wcml2YXRlLXN5bWJvbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb3ZpZGVyTWV0YWRhdGEge1xuICBjb25zdHJ1Y3RvciAocHJvdmlkZXIsIGFwaVZlcnNpb24pIHtcbiAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHRoaXMgd2hlbiAyLjAgc3VwcG9ydCBpcyByZW1vdmVkXG5cbiAgICB0aGlzLnByb3ZpZGVyID0gcHJvdmlkZXJcbiAgICB0aGlzLmFwaVZlcnNpb24gPSBhcGlWZXJzaW9uXG4gICAgaWYgKHRoaXMucHJvdmlkZXIuc2VsZWN0b3IgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zY29wZVNlbGVjdG9ycyA9IFNlbGVjdG9yLmNyZWF0ZSh0aGlzLnByb3ZpZGVyLnNlbGVjdG9yKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjb3BlU2VsZWN0b3JzID0gU2VsZWN0b3IuY3JlYXRlKHRoaXMucHJvdmlkZXIuc2NvcGVTZWxlY3RvcilcbiAgICB9XG5cbiAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHRoaXMgd2hlbiAyLjAgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgaWYgKHRoaXMucHJvdmlkZXIuZGlzYWJsZUZvclNlbGVjdG9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZGlzYWJsZUZvclNjb3BlU2VsZWN0b3JzID0gU2VsZWN0b3IuY3JlYXRlKHRoaXMucHJvdmlkZXIuZGlzYWJsZUZvclNlbGVjdG9yKVxuICAgIH0gZWxzZSBpZiAodGhpcy5wcm92aWRlci5kaXNhYmxlRm9yU2NvcGVTZWxlY3RvciAhPSBudWxsKSB7XG4gICAgICB0aGlzLmRpc2FibGVGb3JTY29wZVNlbGVjdG9ycyA9IFNlbGVjdG9yLmNyZWF0ZSh0aGlzLnByb3ZpZGVyLmRpc2FibGVGb3JTY29wZVNlbGVjdG9yKVxuICAgIH1cblxuICAgIC8vIFRPRE8gQVBJOiByZW1vdmUgdGhpcyB3aGVuIDEuMCBzdXBwb3J0IGlzIHJlbW92ZWRcbiAgICBsZXQgcHJvdmlkZXJCbGFja2xpc3RcbiAgICBpZiAodGhpcy5wcm92aWRlci5wcm92aWRlcmJsYWNrbGlzdCAmJiB0aGlzLnByb3ZpZGVyLnByb3ZpZGVyYmxhY2tsaXN0WydhdXRvY29tcGxldGUtcGx1cy1mdXp6eXByb3ZpZGVyJ10pIHtcbiAgICAgIHByb3ZpZGVyQmxhY2tsaXN0ID0gdGhpcy5wcm92aWRlci5wcm92aWRlcmJsYWNrbGlzdFsnYXV0b2NvbXBsZXRlLXBsdXMtZnV6enlwcm92aWRlciddXG4gICAgfVxuICAgIGlmIChwcm92aWRlckJsYWNrbGlzdCkge1xuICAgICAgdGhpcy5kaXNhYmxlRGVmYXVsdFByb3ZpZGVyU2VsZWN0b3JzID0gU2VsZWN0b3IuY3JlYXRlKHByb3ZpZGVyQmxhY2tsaXN0KVxuICAgIH1cblxuICAgIHRoaXMuZW5hYmxlQ3VzdG9tVGV4dEVkaXRvclNlbGVjdG9yID0gc2VtdmVyLnNhdGlzZmllcyh0aGlzLnByb3ZpZGVyW0FQSV9WRVJTSU9OXSwgJz49My4wLjAnKVxuICB9XG5cbiAgbWF0Y2hlc0VkaXRvciAoZWRpdG9yKSB7XG4gICAgaWYgKHRoaXMuZW5hYmxlQ3VzdG9tVGV4dEVkaXRvclNlbGVjdG9yICYmICh0aGlzLnByb3ZpZGVyLmdldFRleHRFZGl0b3JTZWxlY3RvciAhPSBudWxsKSkge1xuICAgICAgcmV0dXJuIGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLm1hdGNoZXModGhpcy5wcm92aWRlci5nZXRUZXh0RWRpdG9yU2VsZWN0b3IoKSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gICAgICByZXR1cm4gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikubWF0Y2hlcygnYXRvbS1wYW5lID4gLml0ZW0tdmlld3MgPiBhdG9tLXRleHQtZWRpdG9yJylcbiAgICB9XG4gIH1cblxuICBtYXRjaGVzU2NvcGVDaGFpbiAoc2NvcGVDaGFpbikge1xuICAgIGlmICh0aGlzLmRpc2FibGVGb3JTY29wZVNlbGVjdG9ycyAhPSBudWxsKSB7XG4gICAgICBpZiAoc2VsZWN0b3JzTWF0Y2hTY29wZUNoYWluKHRoaXMuZGlzYWJsZUZvclNjb3BlU2VsZWN0b3JzLCBzY29wZUNoYWluKSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIH1cblxuICAgIGlmIChzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4odGhpcy5zY29wZVNlbGVjdG9ycywgc2NvcGVDaGFpbikpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIHNob3VsZERpc2FibGVEZWZhdWx0UHJvdmlkZXIgKHNjb3BlQ2hhaW4pIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlRGVmYXVsdFByb3ZpZGVyU2VsZWN0b3JzICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4odGhpcy5kaXNhYmxlRGVmYXVsdFByb3ZpZGVyU2VsZWN0b3JzLCBzY29wZUNoYWluKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBnZXRTcGVjaWZpY2l0eSAoc2NvcGVDaGFpbikge1xuICAgIGNvbnN0IHNlbGVjdG9yID0gc2VsZWN0b3JGb3JTY29wZUNoYWluKHRoaXMuc2NvcGVTZWxlY3RvcnMsIHNjb3BlQ2hhaW4pXG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gc2VsZWN0b3IuZ2V0U3BlY2lmaWNpdHkoKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgfVxufVxuIl19