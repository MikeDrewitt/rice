(function() {
  var $$$, CompositeDisposable, PackageGrammarsView, SettingsPanel, View, _, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $$$ = ref.$$$, View = ref.View;

  SettingsPanel = require('./settings-panel');

  module.exports = PackageGrammarsView = (function(superClass) {
    extend(PackageGrammarsView, superClass);

    function PackageGrammarsView() {
      return PackageGrammarsView.__super__.constructor.apply(this, arguments);
    }

    PackageGrammarsView.content = function() {
      return this.section({
        "class": 'package-grammars'
      }, (function(_this) {
        return function() {
          return _this.div({
            outlet: 'grammarSettings'
          });
        };
      })(this));
    };

    PackageGrammarsView.prototype.initialize = function(packagePath) {
      this.disposables = new CompositeDisposable();
      this.packagePath = path.join(packagePath, path.sep);
      this.addGrammars();
      this.disposables.add(atom.grammars.onDidAddGrammar((function(_this) {
        return function() {
          return _this.addGrammars();
        };
      })(this)));
      return this.disposables.add(atom.grammars.onDidUpdateGrammar((function(_this) {
        return function() {
          return _this.addGrammars();
        };
      })(this)));
    };

    PackageGrammarsView.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    PackageGrammarsView.prototype.getPackageGrammars = function() {
      var grammar, grammars, i, len, packageGrammars, ref1;
      packageGrammars = [];
      grammars = (ref1 = atom.grammars.grammars) != null ? ref1 : [];
      for (i = 0, len = grammars.length; i < len; i++) {
        grammar = grammars[i];
        if (grammar.path) {
          if (grammar.path.indexOf(this.packagePath) === 0) {
            packageGrammars.push(grammar);
          }
        }
      }
      return packageGrammars.sort(function(grammar1, grammar2) {
        var name1, name2, ref2, ref3, ref4, ref5;
        name1 = (ref2 = (ref3 = grammar1.name) != null ? ref3 : grammar1.scopeName) != null ? ref2 : '';
        name2 = (ref4 = (ref5 = grammar2.name) != null ? ref5 : grammar2.scopeName) != null ? ref4 : '';
        return name1.localeCompare(name2);
      });
    };

    PackageGrammarsView.prototype.addGrammarHeading = function(grammar, panel) {
      return panel.find('.section-body').prepend($$$(function() {
        return this.div({
          "class": 'native-key-bindings text',
          tabindex: -1
        }, (function(_this) {
          return function() {
            _this.div({
              "class": 'grammar-scope'
            }, function() {
              var ref1;
              _this.strong('Scope: ');
              return _this.span((ref1 = grammar.scopeName) != null ? ref1 : '');
            });
            return _this.div({
              "class": 'grammar-filetypes'
            }, function() {
              var ref1, ref2;
              _this.strong('File Types: ');
              return _this.span((ref1 = (ref2 = grammar.fileTypes) != null ? ref2.join(', ') : void 0) != null ? ref1 : '');
            });
          };
        })(this));
      }));
    };

    PackageGrammarsView.prototype.addGrammars = function() {
      var grammar, i, len, panel, ref1, results, scopeName, title;
      this.grammarSettings.empty();
      ref1 = this.getPackageGrammars();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        grammar = ref1[i];
        scopeName = grammar.scopeName;
        if (!scopeName) {
          continue;
        }
        if (!scopeName.startsWith('.')) {
          scopeName = "." + scopeName;
        }
        title = grammar.name + " Grammar";
        panel = new SettingsPanel(null, {
          title: title,
          scopeName: scopeName,
          icon: 'puzzle'
        });
        this.addGrammarHeading(grammar, panel);
        results.push(this.grammarSettings.append(panel));
      }
      return results;
    };

    return PackageGrammarsView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLWdyYW1tYXJzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxnRkFBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQWMsT0FBQSxDQUFRLHNCQUFSLENBQWQsRUFBQyxhQUFELEVBQU07O0VBQ04sYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBR2hCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLE9BQUQsQ0FBUztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7T0FBVCxFQUFvQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ2xDLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxNQUFBLEVBQVEsaUJBQVI7V0FBTDtRQURrQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEM7SUFEUTs7a0NBSVYsVUFBQSxHQUFZLFNBQUMsV0FBRDtNQUNWLElBQUMsQ0FBQSxXQUFELEdBQW1CLElBQUEsbUJBQUEsQ0FBQTtNQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixJQUFJLENBQUMsR0FBNUI7TUFDZixJQUFDLENBQUEsV0FBRCxDQUFBO01BRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFB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cmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57JCQkLCBWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuU2V0dGluZ3NQYW5lbCA9IHJlcXVpcmUgJy4vc2V0dGluZ3MtcGFuZWwnXG5cbiMgVmlldyB0byBkaXNwbGF5IHRoZSBncmFtbWFycyB0aGF0IGEgcGFja2FnZSBoYXMgcmVnaXN0ZXJlZC5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VHcmFtbWFyc1ZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBzZWN0aW9uIGNsYXNzOiAncGFja2FnZS1ncmFtbWFycycsID0+XG4gICAgICBAZGl2IG91dGxldDogJ2dyYW1tYXJTZXR0aW5ncydcblxuICBpbml0aWFsaXplOiAocGFja2FnZVBhdGgpIC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIEBwYWNrYWdlUGF0aCA9IHBhdGguam9pbihwYWNrYWdlUGF0aCwgcGF0aC5zZXApXG4gICAgQGFkZEdyYW1tYXJzKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIgPT4gQGFkZEdyYW1tYXJzKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uZ3JhbW1hcnMub25EaWRVcGRhdGVHcmFtbWFyID0+IEBhZGRHcmFtbWFycygpXG5cbiAgZGlzcG9zZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgZ2V0UGFja2FnZUdyYW1tYXJzOiAtPlxuICAgIHBhY2thZ2VHcmFtbWFycyA9IFtdXG4gICAgZ3JhbW1hcnMgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJzID8gW11cbiAgICBmb3IgZ3JhbW1hciBpbiBncmFtbWFycyB3aGVuIGdyYW1tYXIucGF0aFxuICAgICAgcGFja2FnZUdyYW1tYXJzLnB1c2goZ3JhbW1hcikgaWYgZ3JhbW1hci5wYXRoLmluZGV4T2YoQHBhY2thZ2VQYXRoKSBpcyAwXG4gICAgcGFja2FnZUdyYW1tYXJzLnNvcnQgKGdyYW1tYXIxLCBncmFtbWFyMikgLT5cbiAgICAgIG5hbWUxID0gZ3JhbW1hcjEubmFtZSA/IGdyYW1tYXIxLnNjb3BlTmFtZSA/ICcnXG4gICAgICBuYW1lMiA9IGdyYW1tYXIyLm5hbWUgPyBncmFtbWFyMi5zY29wZU5hbWUgPyAnJ1xuICAgICAgbmFtZTEubG9jYWxlQ29tcGFyZShuYW1lMilcblxuICBhZGRHcmFtbWFySGVhZGluZzogKGdyYW1tYXIsIHBhbmVsKSAtPlxuICAgIHBhbmVsLmZpbmQoJy5zZWN0aW9uLWJvZHknKS5wcmVwZW5kICQkJCAtPlxuICAgICAgQGRpdiBjbGFzczogJ25hdGl2ZS1rZXktYmluZGluZ3MgdGV4dCcsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ2dyYW1tYXItc2NvcGUnLCA9PlxuICAgICAgICAgIEBzdHJvbmcgJ1Njb3BlOiAnXG4gICAgICAgICAgQHNwYW4gZ3JhbW1hci5zY29wZU5hbWUgPyAnJ1xuICAgICAgICBAZGl2IGNsYXNzOiAnZ3JhbW1hci1maWxldHlwZXMnLCA9PlxuICAgICAgICAgIEBzdHJvbmcgJ0ZpbGUgVHlwZXM6ICdcbiAgICAgICAgICBAc3BhbiBncmFtbWFyLmZpbGVUeXBlcz8uam9pbignLCAnKSA/ICcnXG5cbiAgYWRkR3JhbW1hcnM6IC0+XG4gICAgQGdyYW1tYXJTZXR0aW5ncy5lbXB0eSgpXG5cbiAgICBmb3IgZ3JhbW1hciBpbiBAZ2V0UGFja2FnZUdyYW1tYXJzKClcbiAgICAgIHtzY29wZU5hbWV9ID0gZ3JhbW1hclxuICAgICAgY29udGludWUgdW5sZXNzIHNjb3BlTmFtZVxuICAgICAgc2NvcGVOYW1lID0gXCIuI3tzY29wZU5hbWV9XCIgdW5sZXNzIHNjb3BlTmFtZS5zdGFydHNXaXRoKCcuJylcblxuICAgICAgdGl0bGUgPSBcIiN7Z3JhbW1hci5uYW1lfSBHcmFtbWFyXCJcbiAgICAgIHBhbmVsID0gbmV3IFNldHRpbmdzUGFuZWwobnVsbCwge3RpdGxlLCBzY29wZU5hbWUsIGljb246ICdwdXp6bGUnfSlcbiAgICAgIEBhZGRHcmFtbWFySGVhZGluZyhncmFtbWFyLCBwYW5lbClcbiAgICAgIEBncmFtbWFyU2V0dGluZ3MuYXBwZW5kKHBhbmVsKVxuIl19
