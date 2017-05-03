(function() {
  var $$, CollapsibleSectionPanel, CompositeDisposable, ErrorView, InstalledPackagesPanel, List, ListView, PackageCard, TextEditorView, _, fuzzaldrin, ownerFromRepository, packageComparatorAscending, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $$ = ref.$$, TextEditorView = ref.TextEditorView;

  CompositeDisposable = require('atom').CompositeDisposable;

  fuzzaldrin = require('fuzzaldrin');

  CollapsibleSectionPanel = require('./collapsible-section-panel');

  PackageCard = require('./package-card');

  ErrorView = require('./error-view');

  List = require('./list');

  ListView = require('./list-view');

  ref1 = require('./utils'), ownerFromRepository = ref1.ownerFromRepository, packageComparatorAscending = ref1.packageComparatorAscending;

  module.exports = InstalledPackagesPanel = (function(superClass) {
    extend(InstalledPackagesPanel, superClass);

    function InstalledPackagesPanel() {
      this.createPackageCard = bind(this.createPackageCard, this);
      return InstalledPackagesPanel.__super__.constructor.apply(this, arguments);
    }

    InstalledPackagesPanel.loadPackagesDelay = 300;

    InstalledPackagesPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.section({
            "class": 'section'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.div({
                "class": 'section-heading icon icon-package'
              }, function() {
                _this.text('Installed Packages');
                return _this.span({
                  outlet: 'totalPackages',
                  "class": 'section-heading-count badge badge-flexible'
                }, '…');
              });
              _this.div({
                "class": 'editor-container'
              }, function() {
                return _this.subview('filterEditor', new TextEditorView({
                  mini: true,
                  placeholderText: 'Filter packages by name'
                }));
              });
              _this.div({
                outlet: 'updateErrors'
              });
              _this.section({
                outlet: 'deprecatedSection',
                "class": 'sub-section deprecated-packages'
              }, function() {
                _this.h3({
                  outlet: 'deprecatedPackagesHeader',
                  "class": 'sub-section-heading icon icon-package'
                }, function() {
                  _this.text('Deprecated Packages');
                  return _this.span({
                    outlet: 'deprecatedCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                _this.p('Atom does not load deprecated packages. These packages may have updates available.');
                return _this.div({
                  outlet: 'deprecatedPackages',
                  "class": 'container package-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading packages…");
                });
              });
              _this.section({
                "class": 'sub-section installed-packages'
              }, function() {
                _this.h3({
                  outlet: 'communityPackagesHeader',
                  "class": 'sub-section-heading icon icon-package'
                }, function() {
                  _this.text('Community Packages');
                  return _this.span({
                    outlet: 'communityCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'communityPackages',
                  "class": 'container package-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading packages…");
                });
              });
              _this.section({
                "class": 'sub-section core-packages'
              }, function() {
                _this.h3({
                  outlet: 'corePackagesHeader',
                  "class": 'sub-section-heading icon icon-package'
                }, function() {
                  _this.text('Core Packages');
                  return _this.span({
                    outlet: 'coreCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'corePackages',
                  "class": 'container package-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading packages…");
                });
              });
              _this.section({
                "class": 'sub-section dev-packages'
              }, function() {
                _this.h3({
                  outlet: 'devPackagesHeader',
                  "class": 'sub-section-heading icon icon-package'
                }, function() {
                  _this.text('Development Packages');
                  return _this.span({
                    outlet: 'devCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'devPackages',
                  "class": 'container package-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading packages…");
                });
              });
              return _this.section({
                "class": 'sub-section git-packages'
              }, function() {
                _this.h3({
                  outlet: 'gitPackagesHeader',
                  "class": 'sub-section-heading icon icon-package'
                }, function() {
                  _this.text('Git Packages');
                  return _this.span({
                    outlet: 'gitCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'gitPackages',
                  "class": 'container package-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading packages…");
                });
              });
            });
          });
        };
      })(this));
    };

    InstalledPackagesPanel.prototype.initialize = function(packageManager) {
      var loadPackagesTimeout;
      this.packageManager = packageManager;
      InstalledPackagesPanel.__super__.initialize.apply(this, arguments);
      this.items = {
        dev: new List('name'),
        core: new List('name'),
        user: new List('name'),
        git: new List('name'),
        deprecated: new List('name')
      };
      this.itemViews = {
        dev: new ListView(this.items.dev, this.devPackages, this.createPackageCard),
        core: new ListView(this.items.core, this.corePackages, this.createPackageCard),
        user: new ListView(this.items.user, this.communityPackages, this.createPackageCard),
        git: new ListView(this.items.git, this.gitPackages, this.createPackageCard),
        deprecated: new ListView(this.items.deprecated, this.deprecatedPackages, this.createPackageCard)
      };
      this.filterEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.matchPackages();
        };
      })(this));
      this.packageManagerSubscriptions = new CompositeDisposable;
      this.packageManagerSubscriptions.add(this.packageManager.on('package-install-failed theme-install-failed package-uninstall-failed theme-uninstall-failed package-update-failed theme-update-failed', (function(_this) {
        return function(arg) {
          var error, pack;
          pack = arg.pack, error = arg.error;
          return _this.updateErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this)));
      loadPackagesTimeout = null;
      this.packageManagerSubscriptions.add(this.packageManager.on('package-updated package-installed package-uninstalled package-installed-alternative', (function(_this) {
        return function() {
          clearTimeout(loadPackagesTimeout);
          return loadPackagesTimeout = setTimeout(function() {
            return _this.loadPackages();
          }, InstalledPackagesPanel.loadPackagesDelay);
        };
      })(this)));
      this.handleEvents();
      return this.loadPackages();
    };

    InstalledPackagesPanel.prototype.focus = function() {
      return this.filterEditor.focus();
    };

    InstalledPackagesPanel.prototype.dispose = function() {
      return this.packageManagerSubscriptions.dispose();
    };

    InstalledPackagesPanel.prototype.filterPackages = function(packages) {
      var i, j, k, len, len1, len2, pack, packageType, ref2, ref3, ref4;
      packages.dev = packages.dev.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return !theme;
      });
      packages.user = packages.user.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return !theme;
      });
      packages.deprecated = packages.user.filter(function(arg) {
        var name, version;
        name = arg.name, version = arg.version;
        return atom.packages.isDeprecatedPackage(name, version);
      });
      packages.core = packages.core.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return !theme;
      });
      packages.git = (packages.git || []).filter(function(arg) {
        var theme;
        theme = arg.theme;
        return !theme;
      });
      ref2 = packages.core;
      for (i = 0, len = ref2.length; i < len; i++) {
        pack = ref2[i];
        if (pack.repository == null) {
          pack.repository = "https://github.com/atom/" + pack.name;
        }
      }
      ref3 = ['dev', 'core', 'user', 'git', 'deprecated'];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        packageType = ref3[j];
        ref4 = packages[packageType];
        for (k = 0, len2 = ref4.length; k < len2; k++) {
          pack = ref4[k];
          pack.owner = ownerFromRepository(pack.repository);
        }
      }
      return packages;
    };

    InstalledPackagesPanel.prototype.sortPackages = function(packages) {
      packages.dev.sort(packageComparatorAscending);
      packages.core.sort(packageComparatorAscending);
      packages.user.sort(packageComparatorAscending);
      packages.git.sort(packageComparatorAscending);
      packages.deprecated.sort(packageComparatorAscending);
      return packages;
    };

    InstalledPackagesPanel.prototype.loadPackages = function() {
      var packagesWithUpdates;
      packagesWithUpdates = {};
      this.packageManager.getOutdated().then((function(_this) {
        return function(packages) {
          var i, latestVersion, len, name, ref2;
          for (i = 0, len = packages.length; i < len; i++) {
            ref2 = packages[i], name = ref2.name, latestVersion = ref2.latestVersion;
            packagesWithUpdates[name] = latestVersion;
          }
          return _this.displayPackageUpdates(packagesWithUpdates);
        };
      })(this));
      return this.packageManager.getInstalled().then((function(_this) {
        return function(packages) {
          _this.packages = _this.sortPackages(_this.filterPackages(packages));
          _this.devPackages.find('.alert.loading-area').remove();
          _this.items.dev.setItems(_this.packages.dev);
          _this.corePackages.find('.alert.loading-area').remove();
          _this.items.core.setItems(_this.packages.core);
          _this.communityPackages.find('.alert.loading-area').remove();
          _this.items.user.setItems(_this.packages.user);
          _this.gitPackages.find('.alert.loading-area').remove();
          _this.items.git.setItems(_this.packages.git);
          if (_this.packages.deprecated.length) {
            _this.deprecatedSection.show();
          } else {
            _this.deprecatedSection.hide();
          }
          _this.deprecatedPackages.find('.alert.loading-area').remove();
          _this.items.deprecated.setItems(_this.packages.deprecated);
          _this.updateSectionCounts();
          _this.displayPackageUpdates(packagesWithUpdates);
          return _this.matchPackages();
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          console.error(error.message, error.stack);
          _this.loadingMessage.hide();
          return _this.featuredErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this));
    };

    InstalledPackagesPanel.prototype.displayPackageUpdates = function(packagesWithUpdates) {
      var i, len, newVersion, packageCard, packageType, packageView, ref2, results;
      ref2 = ['dev', 'core', 'user', 'git', 'deprecated'];
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        packageType = ref2[i];
        results.push((function() {
          var j, len1, ref3, results1;
          ref3 = this.itemViews[packageType].getViews();
          results1 = [];
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            packageView = ref3[j];
            packageCard = packageView.find('.package-card').view();
            if (newVersion = packagesWithUpdates[packageCard.pack.name]) {
              results1.push(packageCard.displayAvailableUpdate(newVersion));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    InstalledPackagesPanel.prototype.createPackageCard = function(pack) {
      var packView, packageRow;
      packageRow = $$(function() {
        return this.div({
          "class": 'row'
        });
      });
      packView = new PackageCard(pack, this.packageManager, {
        back: 'Packages'
      });
      packageRow.append(packView);
      return packageRow;
    };

    InstalledPackagesPanel.prototype.filterPackageListByText = function(text) {
      var activeViews, allViews, i, j, k, len, len1, len2, packageType, ref2, view;
      if (!this.packages) {
        return;
      }
      ref2 = ['dev', 'core', 'user', 'git', 'deprecated'];
      for (i = 0, len = ref2.length; i < len; i++) {
        packageType = ref2[i];
        allViews = this.itemViews[packageType].getViews();
        activeViews = this.itemViews[packageType].filterViews(function(pack) {
          var filterText, owner, ref3;
          if (text === '') {
            return true;
          }
          owner = (ref3 = pack.owner) != null ? ref3 : ownerFromRepository(pack.repository);
          filterText = pack.name + " " + owner;
          return fuzzaldrin.score(filterText, text) > 0;
        });
        for (j = 0, len1 = allViews.length; j < len1; j++) {
          view = allViews[j];
          if (view) {
            view.find('.package-card').hide().addClass('hidden');
          }
        }
        for (k = 0, len2 = activeViews.length; k < len2; k++) {
          view = activeViews[k];
          if (view) {
            view.find('.package-card').show().removeClass('hidden');
          }
        }
      }
      return this.updateSectionCounts();
    };

    InstalledPackagesPanel.prototype.updateUnfilteredSectionCounts = function() {
      this.updateSectionCount(this.deprecatedPackagesHeader, this.deprecatedCount, this.packages.deprecated.length);
      this.updateSectionCount(this.communityPackagesHeader, this.communityCount, this.packages.user.length);
      this.updateSectionCount(this.corePackagesHeader, this.coreCount, this.packages.core.length);
      this.updateSectionCount(this.devPackagesHeader, this.devCount, this.packages.dev.length);
      this.updateSectionCount(this.gitPackagesHeader, this.gitCount, this.packages.git.length);
      return this.totalPackages.text(this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length);
    };

    InstalledPackagesPanel.prototype.updateFilteredSectionCounts = function() {
      var community, core, deprecated, dev, git, shownPackages, totalPackages;
      deprecated = this.notHiddenCardsLength(this.deprecatedPackages);
      this.updateSectionCount(this.deprecatedPackagesHeader, this.deprecatedCount, deprecated, this.packages.deprecated.length);
      community = this.notHiddenCardsLength(this.communityPackages);
      this.updateSectionCount(this.communityPackagesHeader, this.communityCount, community, this.packages.user.length);
      core = this.notHiddenCardsLength(this.corePackages);
      this.updateSectionCount(this.corePackagesHeader, this.coreCount, core, this.packages.core.length);
      dev = this.notHiddenCardsLength(this.devPackages);
      this.updateSectionCount(this.devPackagesHeader, this.devCount, dev, this.packages.dev.length);
      git = this.notHiddenCardsLength(this.gitPackages);
      this.updateSectionCount(this.gitPackagesHeader, this.gitCount, git, this.packages.git.length);
      shownPackages = dev + core + community + git;
      totalPackages = this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length;
      return this.totalPackages.text(shownPackages + "/" + totalPackages);
    };

    InstalledPackagesPanel.prototype.resetSectionHasItems = function() {
      return this.resetCollapsibleSections([this.deprecatedPackagesHeader, this.communityPackagesHeader, this.corePackagesHeader, this.devPackagesHeader, this.gitPackagesHeader]);
    };

    InstalledPackagesPanel.prototype.matchPackages = function() {
      var filterText;
      filterText = this.filterEditor.getModel().getText();
      return this.filterPackageListByText(filterText);
    };

    return InstalledPackagesPanel;

  })(CollapsibleSectionPanel);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9pbnN0YWxsZWQtcGFja2FnZXMtcGFuZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyTUFBQTtJQUFBOzs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUF1QixPQUFBLENBQVEsc0JBQVIsQ0FBdkIsRUFBQyxXQUFELEVBQUs7O0VBQ0osc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixVQUFBLEdBQWEsT0FBQSxDQUFRLFlBQVI7O0VBRWIsdUJBQUEsR0FBMEIsT0FBQSxDQUFRLDZCQUFSOztFQUMxQixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLE9BQW9ELE9BQUEsQ0FBUSxTQUFSLENBQXBELEVBQUMsOENBQUQsRUFBc0I7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7O0lBQ0osc0JBQUMsQ0FBQSxpQkFBRCxHQUFvQjs7SUFFcEIsc0JBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7T0FBTCxFQUEyQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3pCLEtBQUMsQ0FBQSxPQUFELENBQVM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7V0FBVCxFQUEyQixTQUFBO21CQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDthQUFM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QyxJQUFJLENBQUMsTUFBZixHQUF3QixJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUF2QyxHQUFnRCxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUE5RCxHQUF1RSxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQUcsQ0FBQzthQUNyRyxJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBdUIsYUFBRCxHQUFlLEdBQWYsR0FBa0IsYUFBeEM7SUFsQjJCOztxQ0FvQjdCLG9CQUFBLEdBQXNCLFNBQUE7YUFDcEIsSUFBQyxDQUFBLHdCQUFELENBQTBCLENBQUMsSUFBQyxDQUFBLHdCQUFGLEVBQTRCLElBQUMsQ0FBQSx1QkFBN0IsRUFBc0QsSUFBQyxDQUFBLGtCQUF2RCxFQUEyRSxJQUFDLENBQUEsaUJBQTVFLEVBQStGLElBQUMsQ0FBQSxpQkFBaEcsQ0FBMUI7SUFEb0I7O3FDQUd0QixhQUFBLEdBQWUsU0FBQTtBQUNiLFVBQUE7TUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLFlBQVksQ0FBQyxRQUFkLENBQUEsQ0FBd0IsQ0FBQyxPQUF6QixDQUFBO2FBQ2IsSUFBQyxDQUFBLHVCQUFELENBQXlCLFVBQXpCO0lBRmE7Ozs7S0F4Tm9CO0FBZHJDIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbnskJCwgVGV4dEVkaXRvclZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuZnV6emFsZHJpbiA9IHJlcXVpcmUgJ2Z1enphbGRyaW4nXG5cbkNvbGxhcHNpYmxlU2VjdGlvblBhbmVsID0gcmVxdWlyZSAnLi9jb2xsYXBzaWJsZS1zZWN0aW9uLXBhbmVsJ1xuUGFja2FnZUNhcmQgPSByZXF1aXJlICcuL3BhY2thZ2UtY2FyZCdcbkVycm9yVmlldyA9IHJlcXVpcmUgJy4vZXJyb3ItdmlldydcblxuTGlzdCA9IHJlcXVpcmUgJy4vbGlzdCdcbkxpc3RWaWV3ID0gcmVxdWlyZSAnLi9saXN0LXZpZXcnXG57b3duZXJGcm9tUmVwb3NpdG9yeSwgcGFja2FnZUNvbXBhcmF0b3JBc2NlbmRpbmd9ID0gcmVxdWlyZSAnLi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSW5zdGFsbGVkUGFja2FnZXNQYW5lbCBleHRlbmRzIENvbGxhcHNpYmxlU2VjdGlvblBhbmVsXG4gIEBsb2FkUGFja2FnZXNEZWxheTogMzAwXG5cbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3BhbmVscy1pdGVtJywgPT5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnc2VjdGlvbicsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdzZWN0aW9uLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24taGVhZGluZyBpY29uIGljb24tcGFja2FnZScsID0+XG4gICAgICAgICAgICBAdGV4dCAnSW5zdGFsbGVkIFBhY2thZ2VzJ1xuICAgICAgICAgICAgQHNwYW4gb3V0bGV0OiAndG90YWxQYWNrYWdlcycsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICBAZGl2IGNsYXNzOiAnZWRpdG9yLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICBAc3VidmlldyAnZmlsdGVyRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUsIHBsYWNlaG9sZGVyVGV4dDogJ0ZpbHRlciBwYWNrYWdlcyBieSBuYW1lJylcblxuICAgICAgICAgIEBkaXYgb3V0bGV0OiAndXBkYXRlRXJyb3JzJ1xuXG4gICAgICAgICAgQHNlY3Rpb24gb3V0bGV0OiAnZGVwcmVjYXRlZFNlY3Rpb24nLCBjbGFzczogJ3N1Yi1zZWN0aW9uIGRlcHJlY2F0ZWQtcGFja2FnZXMnLCA9PlxuICAgICAgICAgICAgQGgzIG91dGxldDogJ2RlcHJlY2F0ZWRQYWNrYWdlc0hlYWRlcicsIGNsYXNzOiAnc3ViLXNlY3Rpb24taGVhZGluZyBpY29uIGljb24tcGFja2FnZScsID0+XG4gICAgICAgICAgICAgIEB0ZXh0ICdEZXByZWNhdGVkIFBhY2thZ2VzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkZXByZWNhdGVkQ291bnQnLCBjbGFzczogJ3NlY3Rpb24taGVhZGluZy1jb3VudCBiYWRnZSBiYWRnZS1mbGV4aWJsZScsICfigKYnXG4gICAgICAgICAgICBAcCAnQXRvbSBkb2VzIG5vdCBsb2FkIGRlcHJlY2F0ZWQgcGFja2FnZXMuIFRoZXNlIHBhY2thZ2VzIG1heSBoYXZlIHVwZGF0ZXMgYXZhaWxhYmxlLidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnZGVwcmVjYXRlZFBhY2thZ2VzJywgY2xhc3M6ICdjb250YWluZXIgcGFja2FnZS1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnYWxlcnQgYWxlcnQtaW5mbyBsb2FkaW5nLWFyZWEgaWNvbiBpY29uLWhvdXJnbGFzcycsIFwiTG9hZGluZyBwYWNrYWdlc+KAplwiXG5cbiAgICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3N1Yi1zZWN0aW9uIGluc3RhbGxlZC1wYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAaDMgb3V0bGV0OiAnY29tbXVuaXR5UGFja2FnZXNIZWFkZXInLCBjbGFzczogJ3N1Yi1zZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLXBhY2thZ2UnLCA9PlxuICAgICAgICAgICAgICBAdGV4dCAnQ29tbXVuaXR5IFBhY2thZ2VzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdjb21tdW5pdHlDb3VudCcsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnY29tbXVuaXR5UGFja2FnZXMnLCBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGxvYWRpbmctYXJlYSBpY29uIGljb24taG91cmdsYXNzJywgXCJMb2FkaW5nIHBhY2thZ2Vz4oCmXCJcblxuICAgICAgICAgIEBzZWN0aW9uIGNsYXNzOiAnc3ViLXNlY3Rpb24gY29yZS1wYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAaDMgb3V0bGV0OiAnY29yZVBhY2thZ2VzSGVhZGVyJywgY2xhc3M6ICdzdWItc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wYWNrYWdlJywgPT5cbiAgICAgICAgICAgICAgQHRleHQgJ0NvcmUgUGFja2FnZXMnXG4gICAgICAgICAgICAgIEBzcGFuIG91dGxldDogJ2NvcmVDb3VudCcsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnY29yZVBhY2thZ2VzJywgY2xhc3M6ICdjb250YWluZXIgcGFja2FnZS1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnYWxlcnQgYWxlcnQtaW5mbyBsb2FkaW5nLWFyZWEgaWNvbiBpY29uLWhvdXJnbGFzcycsIFwiTG9hZGluZyBwYWNrYWdlc+KAplwiXG5cbiAgICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3N1Yi1zZWN0aW9uIGRldi1wYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAaDMgb3V0bGV0OiAnZGV2UGFja2FnZXNIZWFkZXInLCBjbGFzczogJ3N1Yi1zZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLXBhY2thZ2UnLCA9PlxuICAgICAgICAgICAgICBAdGV4dCAnRGV2ZWxvcG1lbnQgUGFja2FnZXMnXG4gICAgICAgICAgICAgIEBzcGFuIG91dGxldDogJ2RldkNvdW50JywgY2xhc3M6ICdzZWN0aW9uLWhlYWRpbmctY291bnQgYmFkZ2UgYmFkZ2UtZmxleGlibGUnLCAn4oCmJ1xuICAgICAgICAgICAgQGRpdiBvdXRsZXQ6ICdkZXZQYWNrYWdlcycsIGNsYXNzOiAnY29udGFpbmVyIHBhY2thZ2UtY29udGFpbmVyJywgPT5cbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2FsZXJ0IGFsZXJ0LWluZm8gbG9hZGluZy1hcmVhIGljb24gaWNvbi1ob3VyZ2xhc3MnLCBcIkxvYWRpbmcgcGFja2FnZXPigKZcIlxuXG4gICAgICAgICAgQHNlY3Rpb24gY2xhc3M6ICdzdWItc2VjdGlvbiBnaXQtcGFja2FnZXMnLCA9PlxuICAgICAgICAgICAgQGgzIG91dGxldDogJ2dpdFBhY2thZ2VzSGVhZGVyJywgY2xhc3M6ICdzdWItc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wYWNrYWdlJywgPT5cbiAgICAgICAgICAgICAgQHRleHQgJ0dpdCBQYWNrYWdlcydcbiAgICAgICAgICAgICAgQHNwYW4gb3V0bGV0OiAnZ2l0Q291bnQnLCBjbGFzczogJ3NlY3Rpb24taGVhZGluZy1jb3VudCBiYWRnZSBiYWRnZS1mbGV4aWJsZScsICfigKYnXG4gICAgICAgICAgICBAZGl2IG91dGxldDogJ2dpdFBhY2thZ2VzJywgY2xhc3M6ICdjb250YWluZXIgcGFja2FnZS1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnYWxlcnQgYWxlcnQtaW5mbyBsb2FkaW5nLWFyZWEgaWNvbiBpY29uLWhvdXJnbGFzcycsIFwiTG9hZGluZyBwYWNrYWdlc+KAplwiXG5cbiAgaW5pdGlhbGl6ZTogKEBwYWNrYWdlTWFuYWdlcikgLT5cbiAgICBzdXBlclxuICAgIEBpdGVtcyA9XG4gICAgICBkZXY6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIGNvcmU6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIHVzZXI6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIGdpdDogbmV3IExpc3QoJ25hbWUnKVxuICAgICAgZGVwcmVjYXRlZDogbmV3IExpc3QoJ25hbWUnKVxuICAgIEBpdGVtVmlld3MgPVxuICAgICAgZGV2OiBuZXcgTGlzdFZpZXcoQGl0ZW1zLmRldiwgQGRldlBhY2thZ2VzLCBAY3JlYXRlUGFja2FnZUNhcmQpXG4gICAgICBjb3JlOiBuZXcgTGlzdFZpZXcoQGl0ZW1zLmNvcmUsIEBjb3JlUGFja2FnZXMsIEBjcmVhdGVQYWNrYWdlQ2FyZClcbiAgICAgIHVzZXI6IG5ldyBMaXN0VmlldyhAaXRlbXMudXNlciwgQGNvbW11bml0eVBhY2thZ2VzLCBAY3JlYXRlUGFja2FnZUNhcmQpXG4gICAgICBnaXQ6IG5ldyBMaXN0VmlldyhAaXRlbXMuZ2l0LCBAZ2l0UGFja2FnZXMsIEBjcmVhdGVQYWNrYWdlQ2FyZClcbiAgICAgIGRlcHJlY2F0ZWQ6IG5ldyBMaXN0VmlldyhAaXRlbXMuZGVwcmVjYXRlZCwgQGRlcHJlY2F0ZWRQYWNrYWdlcywgQGNyZWF0ZVBhY2thZ2VDYXJkKVxuXG4gICAgQGZpbHRlckVkaXRvci5nZXRNb2RlbCgpLm9uRGlkU3RvcENoYW5naW5nID0+IEBtYXRjaFBhY2thZ2VzKClcblxuICAgIEBwYWNrYWdlTWFuYWdlclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBwYWNrYWdlTWFuYWdlclN1YnNjcmlwdGlvbnMuYWRkIEBwYWNrYWdlTWFuYWdlci5vbiAncGFja2FnZS1pbnN0YWxsLWZhaWxlZCB0aGVtZS1pbnN0YWxsLWZhaWxlZCBwYWNrYWdlLXVuaW5zdGFsbC1mYWlsZWQgdGhlbWUtdW5pbnN0YWxsLWZhaWxlZCBwYWNrYWdlLXVwZGF0ZS1mYWlsZWQgdGhlbWUtdXBkYXRlLWZhaWxlZCcsICh7cGFjaywgZXJyb3J9KSA9PlxuICAgICAgQHVwZGF0ZUVycm9ycy5hcHBlbmQobmV3IEVycm9yVmlldyhAcGFja2FnZU1hbmFnZXIsIGVycm9yKSlcblxuICAgIGxvYWRQYWNrYWdlc1RpbWVvdXQgPSBudWxsXG4gICAgQHBhY2thZ2VNYW5hZ2VyU3Vic2NyaXB0aW9ucy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICdwYWNrYWdlLXVwZGF0ZWQgcGFja2FnZS1pbnN0YWxsZWQgcGFja2FnZS11bmluc3RhbGxlZCBwYWNrYWdlLWluc3RhbGxlZC1hbHRlcm5hdGl2ZScsID0+XG4gICAgICBjbGVhclRpbWVvdXQobG9hZFBhY2thZ2VzVGltZW91dClcbiAgICAgIGxvYWRQYWNrYWdlc1RpbWVvdXQgPSBzZXRUaW1lb3V0ID0+XG4gICAgICAgIEBsb2FkUGFja2FnZXMoKVxuICAgICAgLCBJbnN0YWxsZWRQYWNrYWdlc1BhbmVsLmxvYWRQYWNrYWdlc0RlbGF5XG5cbiAgICBAaGFuZGxlRXZlbnRzKClcbiAgICBAbG9hZFBhY2thZ2VzKClcblxuICBmb2N1czogLT5cbiAgICBAZmlsdGVyRWRpdG9yLmZvY3VzKClcblxuICBkaXNwb3NlOiAtPlxuICAgIEBwYWNrYWdlTWFuYWdlclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgZmlsdGVyUGFja2FnZXM6IChwYWNrYWdlcykgLT5cbiAgICBwYWNrYWdlcy5kZXYgPSBwYWNrYWdlcy5kZXYuZmlsdGVyICh7dGhlbWV9KSAtPiBub3QgdGhlbWVcbiAgICBwYWNrYWdlcy51c2VyID0gcGFja2FnZXMudXNlci5maWx0ZXIgKHt0aGVtZX0pIC0+IG5vdCB0aGVtZVxuICAgIHBhY2thZ2VzLmRlcHJlY2F0ZWQgPSBwYWNrYWdlcy51c2VyLmZpbHRlciAoe25hbWUsIHZlcnNpb259KSAtPiBhdG9tLnBhY2thZ2VzLmlzRGVwcmVjYXRlZFBhY2thZ2UobmFtZSwgdmVyc2lvbilcbiAgICBwYWNrYWdlcy5jb3JlID0gcGFja2FnZXMuY29yZS5maWx0ZXIgKHt0aGVtZX0pIC0+IG5vdCB0aGVtZVxuICAgIHBhY2thZ2VzLmdpdCA9IChwYWNrYWdlcy5naXQgb3IgW10pLmZpbHRlciAoe3RoZW1lfSkgLT4gbm90IHRoZW1lXG5cbiAgICBmb3IgcGFjayBpbiBwYWNrYWdlcy5jb3JlXG4gICAgICBwYWNrLnJlcG9zaXRvcnkgPz0gXCJodHRwczovL2dpdGh1Yi5jb20vYXRvbS8je3BhY2submFtZX1cIlxuXG4gICAgZm9yIHBhY2thZ2VUeXBlIGluIFsnZGV2JywgJ2NvcmUnLCAndXNlcicsICdnaXQnLCAnZGVwcmVjYXRlZCddXG4gICAgICBmb3IgcGFjayBpbiBwYWNrYWdlc1twYWNrYWdlVHlwZV1cbiAgICAgICAgcGFjay5vd25lciA9IG93bmVyRnJvbVJlcG9zaXRvcnkocGFjay5yZXBvc2l0b3J5KVxuXG4gICAgcGFja2FnZXNcblxuICBzb3J0UGFja2FnZXM6IChwYWNrYWdlcykgLT5cbiAgICBwYWNrYWdlcy5kZXYuc29ydChwYWNrYWdlQ29tcGFyYXRvckFzY2VuZGluZylcbiAgICBwYWNrYWdlcy5jb3JlLnNvcnQocGFja2FnZUNvbXBhcmF0b3JBc2NlbmRpbmcpXG4gICAgcGFja2FnZXMudXNlci5zb3J0KHBhY2thZ2VDb21wYXJhdG9yQXNjZW5kaW5nKVxuICAgIHBhY2thZ2VzLmdpdC5zb3J0KHBhY2thZ2VDb21wYXJhdG9yQXNjZW5kaW5nKVxuICAgIHBhY2thZ2VzLmRlcHJlY2F0ZWQuc29ydChwYWNrYWdlQ29tcGFyYXRvckFzY2VuZGluZylcbiAgICBwYWNrYWdlc1xuXG4gIGxvYWRQYWNrYWdlczogLT5cbiAgICBwYWNrYWdlc1dpdGhVcGRhdGVzID0ge31cbiAgICBAcGFja2FnZU1hbmFnZXIuZ2V0T3V0ZGF0ZWQoKS50aGVuIChwYWNrYWdlcykgPT5cbiAgICAgIGZvciB7bmFtZSwgbGF0ZXN0VmVyc2lvbn0gaW4gcGFja2FnZXNcbiAgICAgICAgcGFja2FnZXNXaXRoVXBkYXRlc1tuYW1lXSA9IGxhdGVzdFZlcnNpb25cbiAgICAgIEBkaXNwbGF5UGFja2FnZVVwZGF0ZXMocGFja2FnZXNXaXRoVXBkYXRlcylcblxuICAgIEBwYWNrYWdlTWFuYWdlci5nZXRJbnN0YWxsZWQoKVxuICAgICAgLnRoZW4gKHBhY2thZ2VzKSA9PlxuICAgICAgICBAcGFja2FnZXMgPSBAc29ydFBhY2thZ2VzKEBmaWx0ZXJQYWNrYWdlcyhwYWNrYWdlcykpXG4gICAgICAgIEBkZXZQYWNrYWdlcy5maW5kKCcuYWxlcnQubG9hZGluZy1hcmVhJykucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLmRldi5zZXRJdGVtcyhAcGFja2FnZXMuZGV2KVxuXG4gICAgICAgIEBjb3JlUGFja2FnZXMuZmluZCgnLmFsZXJ0LmxvYWRpbmctYXJlYScpLnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5jb3JlLnNldEl0ZW1zKEBwYWNrYWdlcy5jb3JlKVxuXG4gICAgICAgIEBjb21tdW5pdHlQYWNrYWdlcy5maW5kKCcuYWxlcnQubG9hZGluZy1hcmVhJykucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLnVzZXIuc2V0SXRlbXMoQHBhY2thZ2VzLnVzZXIpXG5cbiAgICAgICAgQGdpdFBhY2thZ2VzLmZpbmQoJy5hbGVydC5sb2FkaW5nLWFyZWEnKS5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuZ2l0LnNldEl0ZW1zKEBwYWNrYWdlcy5naXQpXG5cbiAgICAgICAgaWYgQHBhY2thZ2VzLmRlcHJlY2F0ZWQubGVuZ3RoXG4gICAgICAgICAgQGRlcHJlY2F0ZWRTZWN0aW9uLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGRlcHJlY2F0ZWRTZWN0aW9uLmhpZGUoKVxuICAgICAgICBAZGVwcmVjYXRlZFBhY2thZ2VzLmZpbmQoJy5hbGVydC5sb2FkaW5nLWFyZWEnKS5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuZGVwcmVjYXRlZC5zZXRJdGVtcyhAcGFja2FnZXMuZGVwcmVjYXRlZClcblxuICAgICAgICAjIFRPRE8gc2hvdyBlbXB0eSBtZXNhZ2UgcGVyIHNlY3Rpb25cblxuICAgICAgICBAdXBkYXRlU2VjdGlvbkNvdW50cygpXG4gICAgICAgIEBkaXNwbGF5UGFja2FnZVVwZGF0ZXMocGFja2FnZXNXaXRoVXBkYXRlcylcblxuICAgICAgICBAbWF0Y2hQYWNrYWdlcygpXG5cbiAgICAgIC5jYXRjaCAoZXJyb3IpID0+XG4gICAgICAgIGNvbnNvbGUuZXJyb3IgZXJyb3IubWVzc2FnZSwgZXJyb3Iuc3RhY2tcbiAgICAgICAgQGxvYWRpbmdNZXNzYWdlLmhpZGUoKVxuICAgICAgICBAZmVhdHVyZWRFcnJvcnMuYXBwZW5kKG5ldyBFcnJvclZpZXcoQHBhY2thZ2VNYW5hZ2VyLCBlcnJvcikpXG5cbiAgZGlzcGxheVBhY2thZ2VVcGRhdGVzOiAocGFja2FnZXNXaXRoVXBkYXRlcykgLT5cbiAgICBmb3IgcGFja2FnZVR5cGUgaW4gWydkZXYnLCAnY29yZScsICd1c2VyJywgJ2dpdCcsICdkZXByZWNhdGVkJ11cbiAgICAgIGZvciBwYWNrYWdlVmlldyBpbiBAaXRlbVZpZXdzW3BhY2thZ2VUeXBlXS5nZXRWaWV3cygpXG4gICAgICAgIHBhY2thZ2VDYXJkID0gcGFja2FnZVZpZXcuZmluZCgnLnBhY2thZ2UtY2FyZCcpLnZpZXcoKVxuICAgICAgICBpZiBuZXdWZXJzaW9uID0gcGFja2FnZXNXaXRoVXBkYXRlc1twYWNrYWdlQ2FyZC5wYWNrLm5hbWVdXG4gICAgICAgICAgcGFja2FnZUNhcmQuZGlzcGxheUF2YWlsYWJsZVVwZGF0ZShuZXdWZXJzaW9uKVxuXG4gIGNyZWF0ZVBhY2thZ2VDYXJkOiAocGFjaykgPT5cbiAgICBwYWNrYWdlUm93ID0gJCQgLT4gQGRpdiBjbGFzczogJ3JvdydcbiAgICBwYWNrVmlldyA9IG5ldyBQYWNrYWdlQ2FyZChwYWNrLCBAcGFja2FnZU1hbmFnZXIsIHtiYWNrOiAnUGFja2FnZXMnfSlcbiAgICBwYWNrYWdlUm93LmFwcGVuZChwYWNrVmlldylcbiAgICBwYWNrYWdlUm93XG5cbiAgZmlsdGVyUGFja2FnZUxpc3RCeVRleHQ6ICh0ZXh0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHBhY2thZ2VzXG5cbiAgICBmb3IgcGFja2FnZVR5cGUgaW4gWydkZXYnLCAnY29yZScsICd1c2VyJywgJ2dpdCcsICdkZXByZWNhdGVkJ11cbiAgICAgIGFsbFZpZXdzID0gQGl0ZW1WaWV3c1twYWNrYWdlVHlwZV0uZ2V0Vmlld3MoKVxuICAgICAgYWN0aXZlVmlld3MgPSBAaXRlbVZpZXdzW3BhY2thZ2VUeXBlXS5maWx0ZXJWaWV3cyAocGFjaykgLT5cbiAgICAgICAgcmV0dXJuIHRydWUgaWYgdGV4dCBpcyAnJ1xuICAgICAgICBvd25lciA9IHBhY2sub3duZXIgPyBvd25lckZyb21SZXBvc2l0b3J5KHBhY2sucmVwb3NpdG9yeSlcbiAgICAgICAgZmlsdGVyVGV4dCA9IFwiI3twYWNrLm5hbWV9ICN7b3duZXJ9XCJcbiAgICAgICAgZnV6emFsZHJpbi5zY29yZShmaWx0ZXJUZXh0LCB0ZXh0KSA+IDBcblxuICAgICAgZm9yIHZpZXcgaW4gYWxsVmlld3Mgd2hlbiB2aWV3XG4gICAgICAgIHZpZXcuZmluZCgnLnBhY2thZ2UtY2FyZCcpLmhpZGUoKS5hZGRDbGFzcygnaGlkZGVuJylcbiAgICAgIGZvciB2aWV3IGluIGFjdGl2ZVZpZXdzIHdoZW4gdmlld1xuICAgICAgICB2aWV3LmZpbmQoJy5wYWNrYWdlLWNhcmQnKS5zaG93KCkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cbiAgICBAdXBkYXRlU2VjdGlvbkNvdW50cygpXG5cbiAgdXBkYXRlVW5maWx0ZXJlZFNlY3Rpb25Db3VudHM6IC0+XG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZGVwcmVjYXRlZFBhY2thZ2VzSGVhZGVyLCBAZGVwcmVjYXRlZENvdW50LCBAcGFja2FnZXMuZGVwcmVjYXRlZC5sZW5ndGgpXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAY29tbXVuaXR5UGFja2FnZXNIZWFkZXIsIEBjb21tdW5pdHlDb3VudCwgQHBhY2thZ2VzLnVzZXIubGVuZ3RoKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGNvcmVQYWNrYWdlc0hlYWRlciwgQGNvcmVDb3VudCwgQHBhY2thZ2VzLmNvcmUubGVuZ3RoKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGRldlBhY2thZ2VzSGVhZGVyLCBAZGV2Q291bnQsIEBwYWNrYWdlcy5kZXYubGVuZ3RoKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGdpdFBhY2thZ2VzSGVhZGVyLCBAZ2l0Q291bnQsIEBwYWNrYWdlcy5naXQubGVuZ3RoKVxuXG4gICAgQHRvdGFsUGFja2FnZXMudGV4dChAcGFja2FnZXMudXNlci5sZW5ndGggKyBAcGFja2FnZXMuY29yZS5sZW5ndGggKyBAcGFja2FnZXMuZGV2Lmxlbmd0aCArIEBwYWNrYWdlcy5naXQubGVuZ3RoKVxuXG4gIHVwZGF0ZUZpbHRlcmVkU2VjdGlvbkNvdW50czogLT5cbiAgICBkZXByZWNhdGVkID0gQG5vdEhpZGRlbkNhcmRzTGVuZ3RoKEBkZXByZWNhdGVkUGFja2FnZXMpXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZGVwcmVjYXRlZFBhY2thZ2VzSGVhZGVyLCBAZGVwcmVjYXRlZENvdW50LCBkZXByZWNhdGVkLCBAcGFja2FnZXMuZGVwcmVjYXRlZC5sZW5ndGgpXG5cbiAgICBjb21tdW5pdHkgPSBAbm90SGlkZGVuQ2FyZHNMZW5ndGgoQGNvbW11bml0eVBhY2thZ2VzKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGNvbW11bml0eVBhY2thZ2VzSGVhZGVyLCBAY29tbXVuaXR5Q291bnQsIGNvbW11bml0eSwgQHBhY2thZ2VzLnVzZXIubGVuZ3RoKVxuXG4gICAgY29yZSA9IEBub3RIaWRkZW5DYXJkc0xlbmd0aChAY29yZVBhY2thZ2VzKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGNvcmVQYWNrYWdlc0hlYWRlciwgQGNvcmVDb3VudCwgY29yZSwgQHBhY2thZ2VzLmNvcmUubGVuZ3RoKVxuXG4gICAgZGV2ID0gQG5vdEhpZGRlbkNhcmRzTGVuZ3RoIEBkZXZQYWNrYWdlc1xuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGRldlBhY2thZ2VzSGVhZGVyLCBAZGV2Q291bnQsIGRldiwgQHBhY2thZ2VzLmRldi5sZW5ndGgpXG5cbiAgICBnaXQgPSBAbm90SGlkZGVuQ2FyZHNMZW5ndGggQGdpdFBhY2thZ2VzXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZ2l0UGFja2FnZXNIZWFkZXIsIEBnaXRDb3VudCwgZ2l0LCBAcGFja2FnZXMuZ2l0Lmxlbmd0aClcblxuICAgIHNob3duUGFja2FnZXMgPSBkZXYgKyBjb3JlICsgY29tbXVuaXR5ICsgZ2l0XG4gICAgdG90YWxQYWNrYWdlcyA9IEBwYWNrYWdlcy51c2VyLmxlbmd0aCArIEBwYWNrYWdlcy5jb3JlLmxlbmd0aCArIEBwYWNrYWdlcy5kZXYubGVuZ3RoICsgQHBhY2thZ2VzLmdpdC5sZW5ndGhcbiAgICBAdG90YWxQYWNrYWdlcy50ZXh0IFwiI3tzaG93blBhY2thZ2VzfS8je3RvdGFsUGFja2FnZXN9XCJcblxuICByZXNldFNlY3Rpb25IYXNJdGVtczogLT5cbiAgICBAcmVzZXRDb2xsYXBzaWJsZVNlY3Rpb25zKFtAZGVwcmVjYXRlZFBhY2thZ2VzSGVhZGVyLCBAY29tbXVuaXR5UGFja2FnZXNIZWFkZXIsIEBjb3JlUGFja2FnZXNIZWFkZXIsIEBkZXZQYWNrYWdlc0hlYWRlciwgQGdpdFBhY2thZ2VzSGVhZGVyXSlcblxuICBtYXRjaFBhY2thZ2VzOiAtPlxuICAgIGZpbHRlclRleHQgPSBAZmlsdGVyRWRpdG9yLmdldE1vZGVsKCkuZ2V0VGV4dCgpXG4gICAgQGZpbHRlclBhY2thZ2VMaXN0QnlUZXh0KGZpbHRlclRleHQpXG4iXX0=
