(function() {
  var $$$, PackageSnippetsView, View, _, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $$$ = ref.$$$, View = ref.View;

  module.exports = PackageSnippetsView = (function(superClass) {
    extend(PackageSnippetsView, superClass);

    function PackageSnippetsView() {
      return PackageSnippetsView.__super__.constructor.apply(this, arguments);
    }

    PackageSnippetsView.content = function() {
      return this.section({
        "class": 'section'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'section-heading icon icon-code'
          }, 'Snippets');
          return _this.table({
            "class": 'package-snippets-table table native-key-bindings text',
            tabindex: -1
          }, function() {
            _this.thead(function() {
              return _this.tr(function() {
                _this.th('Trigger');
                _this.th('Name');
                return _this.th('Body');
              });
            });
            return _this.tbody({
              outlet: 'snippets'
            });
          });
        };
      })(this));
    };

    PackageSnippetsView.prototype.initialize = function(packagePath, snippetsProvider) {
      this.snippetsProvider = snippetsProvider;
      this.packagePath = path.join(packagePath, path.sep);
      this.hide();
      return this.addSnippets();
    };

    PackageSnippetsView.prototype.getSnippetProperties = function() {
      var i, len, name, packageProperties, properties, ref1, ref2, ref3, ref4, snippet;
      packageProperties = {};
      ref1 = this.snippetsProvider.getSnippets();
      for (i = 0, len = ref1.length; i < len; i++) {
        ref2 = ref1[i], name = ref2.name, properties = ref2.properties;
        if ((name != null ? typeof name.indexOf === "function" ? name.indexOf(this.packagePath) : void 0 : void 0) !== 0) {
          continue;
        }
        ref4 = (ref3 = properties.snippets) != null ? ref3 : {};
        for (name in ref4) {
          snippet = ref4[name];
          if (snippet != null) {
            if (packageProperties[name] == null) {
              packageProperties[name] = snippet;
            }
          }
        }
      }
      return _.values(packageProperties).sort(function(snippet1, snippet2) {
        var prefix1, prefix2, ref5, ref6;
        prefix1 = (ref5 = snippet1.prefix) != null ? ref5 : '';
        prefix2 = (ref6 = snippet2.prefix) != null ? ref6 : '';
        return prefix1.localeCompare(prefix2);
      });
    };

    PackageSnippetsView.prototype.getSnippets = function(callback) {
      var snippetsModule, snippetsPackage;
      snippetsPackage = atom.packages.getLoadedPackage('snippets');
      if (snippetsModule = snippetsPackage != null ? snippetsPackage.mainModule : void 0) {
        if (snippetsModule.loaded) {
          return callback(this.getSnippetProperties());
        } else {
          return snippetsModule.onDidLoadSnippets((function(_this) {
            return function() {
              return callback(_this.getSnippetProperties());
            };
          })(this));
        }
      } else {
        return callback([]);
      }
    };

    PackageSnippetsView.prototype.addSnippets = function() {
      return this.getSnippets((function(_this) {
        return function(snippets) {
          var body, bodyText, i, len, name, prefix, ref1, ref2;
          _this.snippets.empty();
          for (i = 0, len = snippets.length; i < len; i++) {
            ref1 = snippets[i], body = ref1.body, bodyText = ref1.bodyText, name = ref1.name, prefix = ref1.prefix;
            if (name == null) {
              name = '';
            }
            if (prefix == null) {
              prefix = '';
            }
            if (body == null) {
              body = bodyText;
            }
            body = (ref2 = body != null ? body.replace(/\t/g, '\\t').replace(/\n/g, '\\n') : void 0) != null ? ref2 : '';
            _this.snippets.append($$$(function() {
              return this.tr((function(_this) {
                return function() {
                  _this.td({
                    "class": 'snippet-prefix'
                  }, prefix);
                  _this.td(name);
                  return _this.td({
                    "class": 'snippet-body'
                  }, body);
                };
              })(this));
            }));
          }
          if (_this.snippets.children().length > 0) {
            return _this.show();
          } else {
            return _this.hide();
          }
        };
      })(this));
    };

    return PackageSnippetsView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLXNuaXBwZXRzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0Q0FBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFjLE9BQUEsQ0FBUSxzQkFBUixDQUFkLEVBQUMsYUFBRCxFQUFNOztFQUdOLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLE9BQUQsQ0FBUztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtPQUFULEVBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtXQUFMLEVBQThDLFVBQTlDO2lCQUNBLEtBQUMsQ0FBQSxLQUFELENBQU87WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVEQUFQO1lBQWdFLFFBQUEsRUFBVSxDQUFDLENBQTNFO1dBQVAsRUFBcUYsU0FBQTtZQUNuRixLQUFDLENBQUEsS0FBRCxDQUFPLFNBQUE7cUJBQ0wsS0FBQyxDQUFBLEVBQUQsQ0FBSSxTQUFBO2dCQUNGLEtBQUMsQ0FBQSxFQUFELENBQUksU0FBSjtnQkFDQSxLQUFDLENBQUEsRUFBRCxDQUFJLE1BQUo7dUJBQ0EsS0FBQyxDQUFBLEVBQUQsQ0FBSSxNQUFKO2NBSEUsQ0FBSjtZQURLLENBQVA7bUJBS0EsS0FBQyxDQUFBLEtBQUQsQ0FBTztjQUFBLE1BQUEsRUFBUSxVQUFSO2FBQVA7VUFObUYsQ0FBckY7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cGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xueyQkJCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuIyBWaWV3IHRvIGRpc3BsYXkgdGhlIHNuaXBwZXRzIHRoYXQgYSBwYWNrYWdlIGhhcyByZWdpc3RlcmVkLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZVNuaXBwZXRzVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQHNlY3Rpb24gY2xhc3M6ICdzZWN0aW9uJywgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdzZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLWNvZGUnLCAnU25pcHBldHMnXG4gICAgICBAdGFibGUgY2xhc3M6ICdwYWNrYWdlLXNuaXBwZXRzLXRhYmxlIHRhYmxlIG5hdGl2ZS1rZXktYmluZGluZ3MgdGV4dCcsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgICAgQHRoZWFkID0+XG4gICAgICAgICAgQHRyID0+XG4gICAgICAgICAgICBAdGggJ1RyaWdnZXInXG4gICAgICAgICAgICBAdGggJ05hbWUnXG4gICAgICAgICAgICBAdGggJ0JvZHknXG4gICAgICAgIEB0Ym9keSBvdXRsZXQ6ICdzbmlwcGV0cydcblxuICBpbml0aWFsaXplOiAocGFja2FnZVBhdGgsIEBzbmlwcGV0c1Byb3ZpZGVyKSAtPlxuICAgIEBwYWNrYWdlUGF0aCA9IHBhdGguam9pbihwYWNrYWdlUGF0aCwgcGF0aC5zZXApXG4gICAgQGhpZGUoKVxuICAgIEBhZGRTbmlwcGV0cygpXG5cbiAgZ2V0U25pcHBldFByb3BlcnRpZXM6IC0+XG4gICAgcGFja2FnZVByb3BlcnRpZXMgPSB7fVxuICAgIGZvciB7bmFtZSwgcHJvcGVydGllc30gaW4gQHNuaXBwZXRzUHJvdmlkZXIuZ2V0U25pcHBldHMoKVxuICAgICAgY29udGludWUgdW5sZXNzIG5hbWU/LmluZGV4T2Y/KEBwYWNrYWdlUGF0aCkgaXMgMFxuICAgICAgZm9yIG5hbWUsIHNuaXBwZXQgb2YgcHJvcGVydGllcy5zbmlwcGV0cyA/IHt9IHdoZW4gc25pcHBldD9cbiAgICAgICAgcGFja2FnZVByb3BlcnRpZXNbbmFtZV0gPz0gc25pcHBldFxuXG4gICAgXy52YWx1ZXMocGFja2FnZVByb3BlcnRpZXMpLnNvcnQgKHNuaXBwZXQxLCBzbmlwcGV0MikgLT5cbiAgICAgIHByZWZpeDEgPSBzbmlwcGV0MS5wcmVmaXggPyAnJ1xuICAgICAgcHJlZml4MiA9IHNuaXBwZXQyLnByZWZpeCA/ICcnXG4gICAgICBwcmVmaXgxLmxvY2FsZUNvbXBhcmUocHJlZml4MilcblxuICBnZXRTbmlwcGV0czogKGNhbGxiYWNrKSAtPlxuICAgIHNuaXBwZXRzUGFja2FnZSA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZSgnc25pcHBldHMnKVxuICAgIGlmIHNuaXBwZXRzTW9kdWxlID0gc25pcHBldHNQYWNrYWdlPy5tYWluTW9kdWxlXG4gICAgICBpZiBzbmlwcGV0c01vZHVsZS5sb2FkZWRcbiAgICAgICAgY2FsbGJhY2soQGdldFNuaXBwZXRQcm9wZXJ0aWVzKCkpXG4gICAgICBlbHNlXG4gICAgICAgIHNuaXBwZXRzTW9kdWxlLm9uRGlkTG9hZFNuaXBwZXRzID0+IGNhbGxiYWNrKEBnZXRTbmlwcGV0UHJvcGVydGllcygpKVxuICAgIGVsc2VcbiAgICAgIGNhbGxiYWNrKFtdKVxuXG4gIGFkZFNuaXBwZXRzOiAtPlxuICAgIEBnZXRTbmlwcGV0cyAoc25pcHBldHMpID0+XG4gICAgICBAc25pcHBldHMuZW1wdHkoKVxuXG4gICAgICBmb3Ige2JvZHksIGJvZHlUZXh0LCBuYW1lLCBwcmVmaXh9IGluIHNuaXBwZXRzXG4gICAgICAgIG5hbWUgPz0gJydcbiAgICAgICAgcHJlZml4ID89ICcnXG4gICAgICAgIGJvZHkgPz0gYm9keVRleHRcbiAgICAgICAgYm9keSA9IGJvZHk/LnJlcGxhY2UoL1xcdC9nLCAnXFxcXHQnKS5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJykgPyAnJ1xuXG4gICAgICAgIEBzbmlwcGV0cy5hcHBlbmQgJCQkIC0+XG4gICAgICAgICAgQHRyID0+XG4gICAgICAgICAgICBAdGQgY2xhc3M6ICdzbmlwcGV0LXByZWZpeCcsIHByZWZpeFxuICAgICAgICAgICAgQHRkIG5hbWVcbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ3NuaXBwZXQtYm9keScsIGJvZHlcblxuICAgICAgaWYgQHNuaXBwZXRzLmNoaWxkcmVuKCkubGVuZ3RoID4gMFxuICAgICAgICBAc2hvdygpXG4gICAgICBlbHNlXG4gICAgICAgIEBoaWRlKClcbiJdfQ==
