(function() {
  var CachePanelView, View, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  View = require('atom-space-pen-views').View;

  module.exports = CachePanelView = (function(superClass) {
    extend(CachePanelView, superClass);

    function CachePanelView() {
      return CachePanelView.__super__.constructor.apply(this, arguments);
    }

    CachePanelView.content = function() {
      return this.div({
        "class": 'tool-panel padded package-panel'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'inset-panel'
          }, function() {
            _this.div({
              "class": 'panel-heading'
            }, 'Compile Cache');
            return _this.div({
              "class": 'panel-body padded'
            }, function() {
              _this.div({
                "class": 'timing'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'CoffeeScript files compiled');
                return _this.span({
                  "class": 'inline-block highlight-info',
                  outlet: 'coffeeCompileCount'
                }, 0);
              });
              _this.div({
                "class": 'timing'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'Babel files compiled');
                return _this.span({
                  "class": 'inline-block highlight-info',
                  outlet: 'babelCompileCount'
                }, 0);
              });
              _this.div({
                "class": 'timing'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'Typescript files compiled');
                return _this.span({
                  "class": 'inline-block highlight-info',
                  outlet: 'typescriptCompileCount'
                }, 0);
              });
              _this.div({
                "class": 'timing'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'CSON files compiled');
                return _this.span({
                  "class": 'inline-block highlight-info',
                  outlet: 'csonCompileCount'
                }, 0);
              });
              return _this.div({
                "class": 'timing'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'Less files compiled');
                return _this.span({
                  "class": 'inline-block highlight-info',
                  outlet: 'lessCompileCount'
                }, 0);
              });
            });
          });
        };
      })(this));
    };

    CachePanelView.prototype.initialize = function() {
      return this.populate();
    };

    CachePanelView.prototype.populate = function() {
      var compileCacheStats;
      if (compileCacheStats = this.getCompileCacheStats()) {
        this.coffeeCompileCount.text(compileCacheStats['.coffee'].misses);
        this.babelCompileCount.text(compileCacheStats['.js'].misses);
        this.typescriptCompileCount.text(compileCacheStats['.ts'].misses);
      }
      this.csonCompileCount.text(this.getCsonCompiles());
      return this.lessCompileCount.text(this.getLessCompiles());
    };

    CachePanelView.prototype.getCompileCacheStats = function() {
      try {
        return require(path.join(atom.getLoadSettings().resourcePath, 'src', 'compile-cache')).getCacheStats();
      } catch (error) {}
    };

    CachePanelView.prototype.getCsonCompiles = function() {
      var CSON, cacheMisses, ref;
      cacheMisses = 0;
      try {
        CSON = require(path.join(atom.getLoadSettings().resourcePath, 'node_modules', 'season'));
        cacheMisses = (ref = typeof CSON.getCacheMisses === "function" ? CSON.getCacheMisses() : void 0) != null ? ref : 0;
      } catch (error) {}
      return cacheMisses;
    };

    CachePanelView.prototype.getLessCompiles = function() {
      var ref, ref1, ref2, ref3;
      return (ref = (ref1 = atom.themes.lessCache) != null ? (ref2 = ref1.cache) != null ? (ref3 = ref2.stats) != null ? ref3.misses : void 0 : void 0 : void 0) != null ? ref : 0;
    };

    return CachePanelView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90aW1lY29wL2xpYi9jYWNoZS1wYW5lbC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMEJBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNOLE9BQVEsT0FBQSxDQUFRLHNCQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixjQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQ0FBUDtPQUFMLEVBQStDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0MsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtXQUFMLEVBQTJCLFNBQUE7WUFDekIsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDthQUFMLEVBQTZCLGVBQTdCO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO2FBQUwsRUFBaUMsU0FBQTtjQUMvQixLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtlQUFMLEVBQXNCLFNBQUE7Z0JBQ3BCLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2lCQUFOLEVBQTZCLDZCQUE3Qjt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7a0JBQXNDLE1BQUEsRUFBUSxvQkFBOUM7aUJBQU4sRUFBMEUsQ0FBMUU7Y0FGb0IsQ0FBdEI7Y0FJQSxLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtlQUFMLEVBQXNCLFNBQUE7Z0JBQ3BCLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2lCQUFOLEVBQTZCLHNCQUE3Qjt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7a0JBQXNDLE1BQUEsRUFBUSxtQkFBOUM7aUJBQU4sRUFBeUUsQ0FBekU7Y0FGb0IsQ0FBdEI7Y0FJQSxLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtlQUFMLEVBQXNCLFNBQUE7Z0JBQ3BCLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2lCQUFOLEVBQTZCLDJCQUE3Qjt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7a0JBQXNDLE1BQUEsRUFBUSx3QkFBOUM7aUJBQU4sRUFBOEUsQ0FBOUU7Y0FGb0IsQ0FBdEI7Y0FJQSxLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtlQUFMLEVBQXNCLFNBQUE7Z0JBQ3BCLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2lCQUFOLEVBQTZCLHFCQUE3Qjt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7a0JBQXNDLE1BQUEsRUFBUSxrQkFBOUM7aUJBQU4sRUFBd0UsQ0FBeEU7Y0FGb0IsQ0FBdEI7cUJBSUEsS0FBQyxDQUFBLEdBQUQsQ0FBSztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQVA7ZUFBTCxFQUFzQixTQUFBO2dCQUNwQixLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtpQkFBTixFQUE2QixxQkFBN0I7dUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTTtrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDZCQUFQO2tCQUFzQyxNQUFBLEVBQVEsa0JBQTlDO2lCQUFOLEVBQXdFLENBQXhFO2NBRm9CLENBQXRCO1lBakIrQixDQUFqQztVQUZ5QixDQUEzQjtRQUQ2QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0M7SUFEUTs7NkJBeUJWLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLFFBQUQsQ0FBQTtJQURVOzs2QkFHWixRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxJQUFHLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxvQkFBRCxDQUFBLENBQXZCO1FBQ0UsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLGlCQUFrQixDQUFBLFNBQUEsQ0FBVSxDQUFDLE1BQXREO1FBQ0EsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQW5CLENBQXdCLGlCQUFrQixDQUFBLEtBQUEsQ0FBTSxDQUFDLE1BQWpEO1FBQ0EsSUFBQyxDQUFBLHNCQUFzQixDQUFDLElBQXhCLENBQTZCLGlCQUFrQixDQUFBLEtBQUEsQ0FBTSxDQUFDLE1BQXRELEVBSEY7O01BS0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLElBQWxCLENBQXVCLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBdkI7YUFDQSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUF2QjtJQVBROzs2QkFTVixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCO2VBQ0UsT0FBQSxDQUFRLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxDQUFDLGVBQUwsQ0FBQSxDQUFzQixDQUFDLFlBQWpDLEVBQStDLEtBQS9DLEVBQXNELGVBQXRELENBQVIsQ0FBK0UsQ0FBQyxhQUFoRixDQUFBLEVBREY7T0FBQTtJQURvQjs7NkJBSXRCLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxXQUFBLEdBQWM7QUFDZDtRQUNFLElBQUEsR0FBTyxPQUFBLENBQVEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsZUFBTCxDQUFBLENBQXNCLENBQUMsWUFBakMsRUFBK0MsY0FBL0MsRUFBK0QsUUFBL0QsQ0FBUjtRQUNQLFdBQUEsc0dBQXVDLEVBRnpDO09BQUE7YUFHQTtJQUxlOzs2QkFPakIsZUFBQSxHQUFpQixTQUFBO0FBQ2YsVUFBQTtpTEFBOEM7SUFEL0I7Ozs7S0FqRFU7QUFKN0IiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbntWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDYWNoZVBhbmVsVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3Rvb2wtcGFuZWwgcGFkZGVkIHBhY2thZ2UtcGFuZWwnLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ2luc2V0LXBhbmVsJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWhlYWRpbmcnLCAnQ29tcGlsZSBDYWNoZSdcbiAgICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWJvZHkgcGFkZGVkJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgPT5cbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ0NvZmZlZVNjcmlwdCBmaWxlcyBjb21waWxlZCdcbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrIGhpZ2hsaWdodC1pbmZvJywgb3V0bGV0OiAnY29mZmVlQ29tcGlsZUNvdW50JywgMFxuXG4gICAgICAgICAgQGRpdiBjbGFzczogJ3RpbWluZycsID0+XG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ2lubGluZS1ibG9jaycsICdCYWJlbCBmaWxlcyBjb21waWxlZCdcbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrIGhpZ2hsaWdodC1pbmZvJywgb3V0bGV0OiAnYmFiZWxDb21waWxlQ291bnQnLCAwXG5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgPT5cbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ1R5cGVzY3JpcHQgZmlsZXMgY29tcGlsZWQnXG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ2lubGluZS1ibG9jayBoaWdobGlnaHQtaW5mbycsIG91dGxldDogJ3R5cGVzY3JpcHRDb21waWxlQ291bnQnLCAwXG5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgPT5cbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ0NTT04gZmlsZXMgY29tcGlsZWQnXG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ2lubGluZS1ibG9jayBoaWdobGlnaHQtaW5mbycsIG91dGxldDogJ2Nzb25Db21waWxlQ291bnQnLCAwXG5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgPT5cbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ0xlc3MgZmlsZXMgY29tcGlsZWQnXG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ2lubGluZS1ibG9jayBoaWdobGlnaHQtaW5mbycsIG91dGxldDogJ2xlc3NDb21waWxlQ291bnQnLCAwXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAcG9wdWxhdGUoKVxuXG4gIHBvcHVsYXRlOiAtPlxuICAgIGlmIGNvbXBpbGVDYWNoZVN0YXRzID0gQGdldENvbXBpbGVDYWNoZVN0YXRzKClcbiAgICAgIEBjb2ZmZWVDb21waWxlQ291bnQudGV4dChjb21waWxlQ2FjaGVTdGF0c1snLmNvZmZlZSddLm1pc3NlcylcbiAgICAgIEBiYWJlbENvbXBpbGVDb3VudC50ZXh0KGNvbXBpbGVDYWNoZVN0YXRzWycuanMnXS5taXNzZXMpXG4gICAgICBAdHlwZXNjcmlwdENvbXBpbGVDb3VudC50ZXh0KGNvbXBpbGVDYWNoZVN0YXRzWycudHMnXS5taXNzZXMpXG5cbiAgICBAY3NvbkNvbXBpbGVDb3VudC50ZXh0KEBnZXRDc29uQ29tcGlsZXMoKSlcbiAgICBAbGVzc0NvbXBpbGVDb3VudC50ZXh0KEBnZXRMZXNzQ29tcGlsZXMoKSlcblxuICBnZXRDb21waWxlQ2FjaGVTdGF0czogLT5cbiAgICB0cnlcbiAgICAgIHJlcXVpcmUocGF0aC5qb2luKGF0b20uZ2V0TG9hZFNldHRpbmdzKCkucmVzb3VyY2VQYXRoLCAnc3JjJywgJ2NvbXBpbGUtY2FjaGUnKSkuZ2V0Q2FjaGVTdGF0cygpXG5cbiAgZ2V0Q3NvbkNvbXBpbGVzOiAtPlxuICAgIGNhY2hlTWlzc2VzID0gMFxuICAgIHRyeVxuICAgICAgQ1NPTiA9IHJlcXVpcmUocGF0aC5qb2luKGF0b20uZ2V0TG9hZFNldHRpbmdzKCkucmVzb3VyY2VQYXRoLCAnbm9kZV9tb2R1bGVzJywgJ3NlYXNvbicpKVxuICAgICAgY2FjaGVNaXNzZXMgPSBDU09OLmdldENhY2hlTWlzc2VzPygpID8gMFxuICAgIGNhY2hlTWlzc2VzXG5cbiAgZ2V0TGVzc0NvbXBpbGVzOiAtPlxuICAgIGF0b20udGhlbWVzLmxlc3NDYWNoZT8uY2FjaGU/LnN0YXRzPy5taXNzZXMgPyAwXG4iXX0=
