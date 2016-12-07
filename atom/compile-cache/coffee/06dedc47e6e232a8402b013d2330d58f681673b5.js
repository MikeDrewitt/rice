(function() {
  var $$, CollapsibleSectionPanel, CompositeDisposable, ErrorView, List, ListView, PackageCard, PackageManager, TextEditorView, ThemesPanel, _, fs, fuzzaldrin, ownerFromRepository, packageComparatorAscending, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  fuzzaldrin = require('fuzzaldrin');

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $$ = ref.$$, TextEditorView = ref.TextEditorView;

  CollapsibleSectionPanel = require('./collapsible-section-panel');

  PackageCard = require('./package-card');

  ErrorView = require('./error-view');

  PackageManager = require('./package-manager');

  List = require('./list');

  ListView = require('./list-view');

  ref1 = require('./utils'), ownerFromRepository = ref1.ownerFromRepository, packageComparatorAscending = ref1.packageComparatorAscending;

  module.exports = ThemesPanel = (function(superClass) {
    extend(ThemesPanel, superClass);

    function ThemesPanel() {
      this.createPackageCard = bind(this.createPackageCard, this);
      return ThemesPanel.__super__.constructor.apply(this, arguments);
    }

    ThemesPanel.loadPackagesDelay = 300;

    ThemesPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'section packages themes-panel'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.div({
                "class": 'section-heading icon icon-paintcan'
              }, 'Choose a Theme');
              _this.div({
                "class": 'text native-key-bindings',
                tabindex: -1
              }, function() {
                _this.span({
                  "class": 'icon icon-question'
                }, 'You can also style Atom by editing ');
                return _this.a({
                  "class": 'link',
                  outlet: 'openUserStysheet'
                }, 'your stylesheet');
              });
              return _this.div({
                "class": 'themes-picker'
              }, function() {
                _this.div({
                  "class": 'themes-picker-item control-group'
                }, function() {
                  return _this.div({
                    "class": 'controls'
                  }, function() {
                    _this.label({
                      "class": 'control-label'
                    }, function() {
                      _this.div({
                        "class": 'setting-title themes-label text'
                      }, 'UI Theme');
                      return _this.div({
                        "class": 'setting-description text theme-description'
                      }, 'This styles the tabs, status bar, tree view, and dropdowns');
                    });
                    return _this.div({
                      "class": 'select-container'
                    }, function() {
                      _this.select({
                        outlet: 'uiMenu',
                        "class": 'form-control'
                      });
                      return _this.button({
                        outlet: 'activeUiThemeSettings',
                        "class": 'btn icon icon-gear active-theme-settings'
                      });
                    });
                  });
                });
                return _this.div({
                  "class": 'themes-picker-item control-group'
                }, function() {
                  return _this.div({
                    "class": 'controls'
                  }, function() {
                    _this.label({
                      "class": 'control-label'
                    }, function() {
                      _this.div({
                        "class": 'setting-title themes-label text'
                      }, 'Syntax Theme');
                      return _this.div({
                        "class": 'setting-description text theme-description'
                      }, 'This styles the text inside the editor');
                    });
                    return _this.div({
                      "class": 'select-container'
                    }, function() {
                      _this.select({
                        outlet: 'syntaxMenu',
                        "class": 'form-control'
                      });
                      return _this.button({
                        outlet: 'activeSyntaxThemeSettings',
                        "class": 'btn icon icon-gear active-theme-settings'
                      });
                    });
                  });
                });
              });
            });
          });
          return _this.section({
            "class": 'section'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.div({
                "class": 'section-heading icon icon-paintcan'
              }, function() {
                _this.text('Installed Themes');
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
                  placeholderText: 'Filter themes by name'
                }));
              });
              _this.div({
                outlet: 'themeErrors'
              });
              _this.section({
                "class": 'sub-section installed-packages'
              }, function() {
                _this.h3({
                  outlet: 'communityThemesHeader',
                  "class": 'sub-section-heading icon icon-paintcan'
                }, function() {
                  _this.text('Community Themes');
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
                  }, "Loading themes…");
                });
              });
              _this.section({
                "class": 'sub-section core-packages'
              }, function() {
                _this.h3({
                  outlet: 'coreThemesHeader',
                  "class": 'sub-section-heading icon icon-paintcan'
                }, function() {
                  _this.text('Core Themes');
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
                  }, "Loading themes…");
                });
              });
              _this.section({
                "class": 'sub-section dev-packages'
              }, function() {
                _this.h3({
                  outlet: 'developmentThemesHeader',
                  "class": 'sub-section-heading icon icon-paintcan'
                }, function() {
                  _this.text('Development Themes');
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
                  }, "Loading themes…");
                });
              });
              return _this.section({
                "class": 'sub-section git-packages'
              }, function() {
                _this.h3({
                  outlet: 'gitThemesHeader',
                  "class": 'sub-section-heading icon icon-paintcan'
                }, function() {
                  _this.text('Git Themes');
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
                  }, "Loading themes…");
                });
              });
            });
          });
        };
      })(this));
    };

    ThemesPanel.prototype.initialize = function(packageManager) {
      this.packageManager = packageManager;
      ThemesPanel.__super__.initialize.apply(this, arguments);
      this.items = {
        dev: new List('name'),
        core: new List('name'),
        user: new List('name'),
        git: new List('name')
      };
      this.itemViews = {
        dev: new ListView(this.items.dev, this.devPackages, this.createPackageCard),
        core: new ListView(this.items.core, this.corePackages, this.createPackageCard),
        user: new ListView(this.items.user, this.communityPackages, this.createPackageCard),
        git: new ListView(this.items.git, this.gitPackages, this.createPackageCard)
      };
      this.handleEvents();
      this.loadPackages();
      this.disposables = new CompositeDisposable();
      this.disposables.add(this.packageManager.on('theme-install-failed theme-uninstall-failed', (function(_this) {
        return function(arg) {
          var error, pack;
          pack = arg.pack, error = arg.error;
          return _this.themeErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this)));
      this.openUserStysheet.on('click', function() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open-your-stylesheet');
        return false;
      });
      this.disposables.add(this.packageManager.on('theme-installed theme-uninstalled', (function(_this) {
        return function() {
          var loadPackagesTimeout;
          clearTimeout(loadPackagesTimeout);
          return loadPackagesTimeout = setTimeout(function() {
            _this.populateThemeMenus();
            return _this.loadPackages();
          }, ThemesPanel.loadPackagesDelay);
        };
      })(this)));
      this.disposables.add(atom.themes.onDidChangeActiveThemes((function(_this) {
        return function() {
          return _this.updateActiveThemes();
        };
      })(this)));
      this.disposables.add(atom.tooltips.add(this.activeUiThemeSettings, {
        title: 'Settings'
      }));
      this.disposables.add(atom.tooltips.add(this.activeSyntaxThemeSettings, {
        title: 'Settings'
      }));
      this.updateActiveThemes();
      this.filterEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.matchPackages();
        };
      })(this));
      this.syntaxMenu.change((function(_this) {
        return function() {
          _this.activeSyntaxTheme = _this.syntaxMenu.val();
          return _this.scheduleUpdateThemeConfig();
        };
      })(this));
      return this.uiMenu.change((function(_this) {
        return function() {
          _this.activeUiTheme = _this.uiMenu.val();
          return _this.scheduleUpdateThemeConfig();
        };
      })(this));
    };

    ThemesPanel.prototype.focus = function() {
      return this.filterEditor.focus();
    };

    ThemesPanel.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    ThemesPanel.prototype.filterThemes = function(packages) {
      var i, j, k, len, len1, len2, pack, packageType, ref2, ref3, ref4;
      packages.dev = packages.dev.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return theme;
      });
      packages.user = packages.user.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return theme;
      });
      packages.core = packages.core.filter(function(arg) {
        var theme;
        theme = arg.theme;
        return theme;
      });
      packages.git = (packages.git || []).filter(function(arg) {
        var theme;
        theme = arg.theme;
        return theme;
      });
      ref2 = packages.core;
      for (i = 0, len = ref2.length; i < len; i++) {
        pack = ref2[i];
        if (pack.repository == null) {
          pack.repository = "https://github.com/atom/" + pack.name;
        }
      }
      ref3 = ['dev', 'core', 'user', 'git'];
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

    ThemesPanel.prototype.sortThemes = function(packages) {
      packages.dev.sort(packageComparatorAscending);
      packages.core.sort(packageComparatorAscending);
      packages.user.sort(packageComparatorAscending);
      packages.git.sort(packageComparatorAscending);
      return packages;
    };

    ThemesPanel.prototype.loadPackages = function() {
      this.packageViews = [];
      return this.packageManager.getInstalled().then((function(_this) {
        return function(packages) {
          _this.packages = _this.sortThemes(_this.filterThemes(packages));
          _this.devPackages.find('.alert.loading-area').remove();
          _this.items.dev.setItems(_this.packages.dev);
          _this.corePackages.find('.alert.loading-area').remove();
          _this.items.core.setItems(_this.packages.core);
          _this.communityPackages.find('.alert.loading-area').remove();
          _this.items.user.setItems(_this.packages.user);
          _this.gitPackages.find('.alert.loading-area').remove();
          _this.items.git.setItems(_this.packages.git);
          return _this.updateSectionCounts();
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          _this.loadingMessage.hide();
          return _this.themeErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this));
    };

    ThemesPanel.prototype.updateActiveThemes = function() {
      this.activeUiTheme = this.getActiveUiTheme();
      this.activeSyntaxTheme = this.getActiveSyntaxTheme();
      this.populateThemeMenus();
      this.toggleActiveThemeButtons();
      return this.handleActiveThemeButtonEvents();
    };

    ThemesPanel.prototype.handleActiveThemeButtonEvents = function() {
      this.activeUiThemeSettings.on('click', (function(_this) {
        return function(event) {
          var activeUiTheme, ref2, ref3;
          event.stopPropagation();
          activeUiTheme = (ref2 = atom.themes.getActiveThemes().filter(function(theme) {
            return theme.metadata.theme === 'ui';
          })[0]) != null ? ref2.metadata : void 0;
          if (activeUiTheme != null) {
            return (ref3 = _this.parents('.settings-view').view()) != null ? ref3.showPanel(_this.activeUiTheme, {
              back: 'Themes',
              pack: activeUiTheme
            }) : void 0;
          }
        };
      })(this));
      return this.activeSyntaxThemeSettings.on('click', (function(_this) {
        return function(event) {
          var activeSyntaxTheme, ref2, ref3;
          event.stopPropagation();
          activeSyntaxTheme = (ref2 = atom.themes.getActiveThemes().filter(function(theme) {
            return theme.metadata.theme === 'syntax';
          })[0]) != null ? ref2.metadata : void 0;
          if (activeSyntaxTheme != null) {
            return (ref3 = _this.parents('.settings-view').view()) != null ? ref3.showPanel(_this.activeSyntaxTheme, {
              back: 'Themes',
              pack: activeSyntaxTheme
            }) : void 0;
          }
        };
      })(this));
    };

    ThemesPanel.prototype.toggleActiveThemeButtons = function() {
      if (this.hasSettings(this.activeUiTheme)) {
        this.activeUiThemeSettings.show();
      } else {
        this.activeUiThemeSettings.hide();
      }
      if (this.hasSettings(this.activeSyntaxTheme)) {
        return this.activeSyntaxThemeSettings.show();
      } else {
        return this.activeSyntaxThemeSettings.hide();
      }
    };

    ThemesPanel.prototype.hasSettings = function(packageName) {
      return this.packageManager.packageHasSettings(packageName);
    };

    ThemesPanel.prototype.populateThemeMenus = function() {
      var availableThemes, i, len, metadata, name, ref2, results, themeItem;
      this.uiMenu.empty();
      this.syntaxMenu.empty();
      availableThemes = _.sortBy(atom.themes.getLoadedThemes(), 'name');
      results = [];
      for (i = 0, len = availableThemes.length; i < len; i++) {
        ref2 = availableThemes[i], name = ref2.name, metadata = ref2.metadata;
        switch (metadata.theme) {
          case 'ui':
            themeItem = this.createThemeMenuItem(name);
            if (name === this.activeUiTheme) {
              themeItem.attr('selected', true);
            }
            results.push(this.uiMenu.append(themeItem));
            break;
          case 'syntax':
            themeItem = this.createThemeMenuItem(name);
            if (name === this.activeSyntaxTheme) {
              themeItem.attr('selected', true);
            }
            results.push(this.syntaxMenu.append(themeItem));
            break;
          default:
            results.push(void 0);
        }
      }
      return results;
    };

    ThemesPanel.prototype.getActiveUiTheme = function() {
      var i, len, metadata, name, ref2, ref3;
      ref2 = atom.themes.getActiveThemes();
      for (i = 0, len = ref2.length; i < len; i++) {
        ref3 = ref2[i], name = ref3.name, metadata = ref3.metadata;
        if (metadata.theme === 'ui') {
          return name;
        }
      }
      return null;
    };

    ThemesPanel.prototype.getActiveSyntaxTheme = function() {
      var i, len, metadata, name, ref2, ref3;
      ref2 = atom.themes.getActiveThemes();
      for (i = 0, len = ref2.length; i < len; i++) {
        ref3 = ref2[i], name = ref3.name, metadata = ref3.metadata;
        if (metadata.theme === 'syntax') {
          return name;
        }
      }
      return null;
    };

    ThemesPanel.prototype.updateThemeConfig = function() {
      var themes;
      themes = [];
      if (this.activeUiTheme) {
        themes.push(this.activeUiTheme);
      }
      if (this.activeSyntaxTheme) {
        themes.push(this.activeSyntaxTheme);
      }
      if (themes.length > 0) {
        return atom.config.set("core.themes", themes);
      }
    };

    ThemesPanel.prototype.scheduleUpdateThemeConfig = function() {
      return setTimeout(((function(_this) {
        return function() {
          return _this.updateThemeConfig();
        };
      })(this)), 100);
    };

    ThemesPanel.prototype.createThemeMenuItem = function(themeName) {
      var title;
      title = this.getThemeTitle(themeName);
      return $$(function() {
        return this.option({
          value: themeName
        }, title);
      });
    };

    ThemesPanel.prototype.getThemeTitle = function(themeName) {
      var title;
      if (themeName == null) {
        themeName = '';
      }
      title = themeName.replace(/-(ui|syntax)/g, '').replace(/-theme$/g, '');
      return _.undasherize(_.uncamelcase(title));
    };

    ThemesPanel.prototype.createPackageCard = function(pack) {
      var packView, packageRow;
      packageRow = $$(function() {
        return this.div({
          "class": 'row'
        });
      });
      packView = new PackageCard(pack, this.packageManager, {
        back: 'Themes'
      });
      packageRow.append(packView);
      return packageRow;
    };

    ThemesPanel.prototype.filterPackageListByText = function(text) {
      var activeViews, allViews, i, j, k, len, len1, len2, packageType, ref2, view;
      if (!this.packages) {
        return;
      }
      ref2 = ['dev', 'core', 'user', 'git'];
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

    ThemesPanel.prototype.updateUnfilteredSectionCounts = function() {
      this.updateSectionCount(this.communityThemesHeader, this.communityCount, this.packages.user.length);
      this.updateSectionCount(this.coreThemesHeader, this.coreCount, this.packages.core.length);
      this.updateSectionCount(this.developmentThemesHeader, this.devCount, this.packages.dev.length);
      this.updateSectionCount(this.gitThemesHeader, this.gitCount, this.packages.git.length);
      return this.totalPackages.text("" + (this.packages.user.length + this.packages.core.length + this.packages.dev.length + this.packages.git.length));
    };

    ThemesPanel.prototype.updateFilteredSectionCounts = function() {
      var community, core, dev, git;
      community = this.notHiddenCardsLength(this.communityPackages);
      this.updateSectionCount(this.communityThemesHeader, this.communityCount, community, this.packages.user.length);
      dev = this.notHiddenCardsLength(this.devPackages);
      this.updateSectionCount(this.developmentThemesHeader, this.devCount, dev, this.packages.dev.length);
      core = this.notHiddenCardsLength(this.corePackages);
      this.updateSectionCount(this.coreThemesHeader, this.coreCount, core, this.packages.core.length);
      git = this.notHiddenCardsLength(this.gitPackages);
      return this.updateSectionCount(this.gitThemesHeader, this.gitCount, git, this.packages.git.length);
    };

    ThemesPanel.prototype.resetSectionHasItems = function() {
      return this.resetCollapsibleSections([this.communityThemesHeader, this.coreThemesHeader, this.developmentThemesHeader, this.gitThemesHeader]);
    };

    ThemesPanel.prototype.matchPackages = function() {
      var filterText;
      filterText = this.filterEditor.getModel().getText();
      return this.filterPackageListByText(filterText);
    };

    return ThemesPanel;

  })(CollapsibleSectionPanel);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi90aGVtZXMtcGFuZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwTkFBQTtJQUFBOzs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxVQUFBLEdBQWEsT0FBQSxDQUFRLFlBQVI7O0VBQ2IsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQXVCLE9BQUEsQ0FBUSxzQkFBUixDQUF2QixFQUFDLFdBQUQsRUFBSzs7RUFFTCx1QkFBQSxHQUEwQixPQUFBLENBQVEsNkJBQVI7O0VBQzFCLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSOztFQUNaLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUVqQixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLE9BQW9ELE9BQUEsQ0FBUSxTQUFSLENBQXBELEVBQUMsOENBQUQsRUFBc0I7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7O0lBQ0osV0FBQyxDQUFBLGlCQUFELEdBQW9COztJQUVwQixXQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO09BQUwsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3pCLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLCtCQUFQO1dBQUwsRUFBNkMsU0FBQTttQkFDM0MsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7YUFBTCxFQUFpQyxTQUFBO2NBQy9CLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQ0FBUDtlQUFMLEVBQWtELGdCQUFsRDtjQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTywwQkFBUDtnQkFBbUMsUUFBQSxFQUFVLENBQUMsQ0FBOUM7ZUFBTCxFQUFzRCxTQUFBO2dCQUNwRCxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0JBQVA7aUJBQU4sRUFBbUMscUNBQW5DO3VCQUNBLEtBQUMsQ0FBQSxDQUFELENBQUc7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxNQUFQO2tCQUFlLE1BQUEsRUFBUSxrQkFBdkI7aUJBQUgsRUFBOEMsaUJBQTlDO2NBRm9ELENBQXREO3FCQUlBLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO2VBQUwsRUFBNkIsU0FBQTtnQkFDM0IsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtDQUFQO2lCQUFMLEVBQWdELFNBQUE7eUJBQzlDLEtBQUMsQ0FBQSxHQUFELENBQUs7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxVQUFQO21CQUFMLEVBQXdCLFNBQUE7b0JBQ3RCLEtBQUMsQ0FBQSxLQUFELENBQU87c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO3FCQUFQLEVBQStCLFNBQUE7c0JBQzdCLEtBQUMsQ0FBQSxHQUFELENBQUs7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQ0FBUDt1QkFBTCxFQUErQyxVQUEvQzs2QkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNENBQVA7dUJBQUwsRUFBMEQsNERBQTFEO29CQUY2QixDQUEvQjsyQkFHQSxLQUFDLENBQUEsR0FBRCxDQUFLO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7cUJBQUwsRUFBZ0MsU0FBQTtzQkFDOUIsS0FBQyxDQUFBLE1BQUQsQ0FBUTt3QkFBQSxNQUFBLEVBQVEsUUFBUjt3QkFBa0IsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUF6Qjt1QkFBUjs2QkFDQSxLQUFDLENBQUEsTUFBRCxDQUFRO3dCQUFBLE1BQUEsRUFBUSx1QkFBUjt3QkFBaUMsQ0FBQSxLQUFBLENBQUEsRUFBTywwQ0FBeEM7dUJBQVI7b0JBRjhCLENBQWhDO2tCQUpzQixDQUF4QjtnQkFEOEMsQ0FBaEQ7dUJBU0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtDQUFQO2lCQUFMLEVBQWdELFNBQUE7eUJBQzlDLEtBQUMsQ0FBQSxHQUFELENBQUs7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxVQUFQO21CQUFMLEVBQXdCLFNBQUE7b0JBQ3RCLEtBQUMsQ0FBQSxLQUFELENBQU87c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO3FCQUFQLEVBQStCLFNBQUE7c0JBQzdCLEtBQUMsQ0FBQSxHQUFELENBQUs7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQ0FBUDt1QkFBTCxFQUErQyxjQUEvQzs2QkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNENBQVA7dUJBQUwsRUFBMEQsd0NBQTFEO29CQUY2QixDQUEvQjsyQkFHQSxLQUFDLENBQUEsR0FBRCxDQUFLO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7cUJBQUwsRUFBZ0MsU0FBQTtzQkFDOUIsS0FBQyxDQUFBLE1BQUQsQ0FBUTt3QkFBQSxNQUFBLEVBQVEsWUFBUjt3QkFBc0IsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUE3Qjt1QkFBUjs2QkFDQSxLQUFDLENBQUEsTUFBRCxDQUFRO3dCQUFBLE1BQUEsRUFBUSwyQkFBUjt3QkFBcUMsQ0FBQSxLQUFBLENBQUEsRUFBTywwQ0FBNUM7dUJBQVI7b0JBRjhCLENBQWhDO2tCQUpzQixDQUF4QjtnQkFEOEMsQ0FBaEQ7Y0FWMkIsQ0FBN0I7WUFQK0IsQ0FBakM7VUFEMkMsQ0FBN0M7aUJBMkJBLEtBQUMsQ0FBQSxPQUFELENBQVM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7V0FBVCxFQUEyQixTQUFBO21CQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDthQUFMLEVBQWlDLFNBQUE7Y0FDL0IsS0FBQyxDQUFBLEdBQUQsQ0FBSztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9DQUFQO2VBQUwsRUFBa0QsU0FBQTtnQkFDaEQsS0FBQyxDQUFBLElBQUQsQ0FBTSxrQkFBTjt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2tCQUFBLE1BQUEsRUFBUSxlQUFSO2tCQUF5QixDQUFBLEtBQUEsQ0FBQSxFQUFPLDRDQUFoQztpQkFBTixFQUFvRixHQUFwRjtjQUZnRCxDQUFsRDtjQUdBLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQkFBUDtlQUFMLEVBQWdDLFNBQUE7dUJBQzlCLEtBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxFQUE2QixJQUFBLGNBQUEsQ0FBZTtrQkFBQSxJQUFBLEVBQU0sSUFBTjtrQkFBWSxlQUFBLEVBQWlCLHVCQUE3QjtpQkFBZixDQUE3QjtjQUQ4QixDQUFoQztjQUdBLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsTUFBQSxFQUFRLGFBQVI7ZUFBTDtjQUVBLEtBQUMsQ0FBQSxPQUFELENBQVM7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtlQUFULEVBQWtELFNBQUE7Z0JBQ2hELEtBQUMsQ0FBQSxFQUFELENBQUk7a0JBQUEsTUFBQSxFQUFRLHVCQUFSO2tCQUFpQyxDQUFBLEtBQUEsQ0FBQSxFQUFPLHdDQUF4QztpQkFBSixFQUFzRixTQUFBO2tCQUNwRixLQUFDLENBQUEsSUFBRCxDQUFNLGtCQUFOO3lCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07b0JBQUEsTUFBQSxFQUFRLGdCQUFSO29CQUEwQixDQUFBLEtBQUEsQ0FBQSxFQUFPLDRDQUFqQzttQkFBTixFQUFxRixHQUFyRjtnQkFGb0YsQ0FBdEY7dUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxNQUFBLEVBQVEsbUJBQVI7a0JBQTZCLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQXBDO2lCQUFMLEVBQXdFLFNBQUE7eUJBQ3RFLEtBQUMsQ0FBQSxHQUFELENBQUs7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtREFBUDttQkFBTCxFQUFpRSxpQkFBakU7Z0JBRHNFLENBQXhFO2NBSmdELENBQWxEO2NBT0EsS0FBQyxDQUFBLE9BQUQsQ0FBUztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDJCQUFQO2VBQVQsRUFBNkMsU0FBQTtnQkFDM0MsS0FBQyxDQUFBLEVBQUQsQ0FBSTtrQkFBQSxNQUFBLEVBQVEsa0JBQVI7a0JBQTRCLENBQUEsS0FBQSxDQUFBLEVBQU8sd0NBQW5DO2lCQUFKLEVBQWlGLFNBQUE7a0JBQy9FLEtBQUMsQ0FBQSxJQUFELENBQU0sYUFBTjt5QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO29CQUFBLE1BQUEsRUFBUSxXQUFSO29CQUFxQixDQUFBLEtBQUEsQ0FBQSxFQUFPLDRDQUE1QjttQkFBTixFQUFnRixHQUFoRjtnQkFGK0UsQ0FBakY7dUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxNQUFBLEVBQVEsY0FBUjtrQkFBd0IsQ0FBQSxLQUFBLENBQUEsRUFBTyw2QkFBL0I7aUJBQUwsRUFBbUUsU0FBQTt5QkFDakUsS0FBQyxDQUFBLEdBQUQsQ0FBSztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1EQUFQO21CQUFMLEVBQWlFLGlCQUFqRTtnQkFEaUUsQ0FBbkU7Y0FKMkMsQ0FBN0M7Y0FPQSxLQUFDLENBQUEsT0FBRCxDQUFTO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sMEJBQVA7ZUFBVCxFQUE0QyxTQUFBO2dCQUMxQyxLQUFDLENBQUEsRUFBRCxDQUFJO2tCQUFBLE1BQUEsRUFBUSx5QkFBUjtrQkFBbUMsQ0FBQSxLQUFBLENBQUEsRUFBTyx3Q0FBMUM7aUJBQUosRUFBd0YsU0FBQTtrQkFDdEYsS0FBQyxDQUFBLElBQUQsQ0FBTSxvQkFBTjt5QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO29CQUFBLE1BQUEsRUFBUSxVQUFSO29CQUFvQixDQUFBLEtBQUEsQ0FBQSxFQUFPLDRDQUEzQjttQkFBTixFQUErRSxHQUEvRTtnQkFGc0YsQ0FBeEY7dUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxNQUFBLEVBQVEsYUFBUjtrQkFBdUIsQ0FBQSxLQUFBLENBQUEsRUFBTyw2QkFBOUI7aUJBQUwsRUFBa0UsU0FBQTt5QkFDaEUsS0FBQyxDQUFBLEdBQUQsQ0FBSztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1EQUFQO21CQUFMLEVBQWlFLGlCQUFqRTtnQkFEZ0UsQ0FBbEU7Y0FKMEMsQ0FBNUM7cUJBT0EsS0FBQyxDQUFBLE9BQUQsQ0FBUztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDBCQUFQO2VBQVQsRUFBNEMsU0FBQTtnQkFDMUMsS0FBQyxDQUFBLEVBQUQsQ0FBSTtrQkFBQSxNQUFBLEVBQVEsaUJBQVI7a0JBQTJCLENBQUEsS0FBQSxDQUFBLEVBQU8sd0NBQWxDO2lCQUFKLEVBQWdGLFNBQUE7a0JBQzlFLEtBQUMsQ0FBQSxJQUFELENBQU0sWUFBTjt5QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO29CQUFBLE1BQUEsRUFBUSxVQUFSO29CQUFvQixDQUFBLEtBQUEsQ0FBQSxFQUFPLDRDQUEzQjttQkFBTixFQUErRSxHQUEvRTtnQkFGOEUsQ0FBaEY7dUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxNQUFBLEVBQVEsYUFBUjtrQkFBdUIsQ0FBQSxLQUFBLENBQUEsRUFBTyw2QkFBOUI7aUJBQUwsRUFBa0UsU0FBQTt5QkFDaEUsS0FBQyxDQUFBLEdBQUQsQ0FBSztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1EQUFQO21CQUFMLEVBQWlFLGlCQUFqRTtnQkFEZ0UsQ0FBbEU7Y0FKMEMsQ0FBNUM7WUE5QitCLENBQWpDO1VBRHlCLENBQTNCO1FBNUJ5QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0I7SUFEUTs7MEJBbUVWLFVBQUEsR0FBWSxTQUFDLGNBQUQ7TUFBQyxJQUFDLENBQUEsaUJBQUQ7TUFDWCw2Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLEtBQUQsR0FDRTtRQUFBLEdBQUEsRUFBUyxJQUFBLElBQUEsQ0FBSyxNQUFMLENBQVQ7UUFDQSxJQUFBLEVBQVUsSUFBQSxJQUFBLENBQUssTUFBTCxDQURWO1FBRUEsSUFBQSxFQUFVLElBQUEsSUFBQSxDQUFLLE1BQUwsQ0FGVjtRQUdBLEdBQUEsRUFBUyxJQUFBLElBQUEsQ0FBSyxNQUFMLENBSFQ7O01BSUYsSUFBQyxDQUFBLFNBQUQsR0FDRTtRQUFBLEdBQUEsRUFBUyxJQUFBLFFBQUEsQ0FBUyxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQWhCLEVBQXFCLElBQUMsQ0FBQSxXQUF0QixFQUFtQyxJQUFDLENBQUEsaUJBQXBDLENBQVQ7UUFDQSxJQUFBLEVBQVUsSUFBQSxRQUFBLENBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFoQixFQUFzQixJQUFDLENBQUEsWUFBdkIsRUFBcUMsSUFBQyxDQUFBLGlCQUF0QyxDQURWO1FBRUEsSUFBQSxFQUFVLElBQUEsUUFBQSxDQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBaEIsRUFBc0IsSUFBQyxDQUFBLGlCQUF2QixFQUEwQyxJQUFDLENBQUEsaUJBQTNDLENBRlY7UUFHQSxHQUFBLEVBQVMsSUFBQSxRQUFBLENBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFoQixFQUFxQixJQUFDLENBQUEsV0FBdEIsRUFBbUMsSUFBQyxDQUFBLGlCQUFwQyxDQUhUOztNQUtGLElBQUMsQ0FBQSxZQUFELENBQUE7TUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLFdBQUQsR0FBbUIsSUFBQSxtQkFBQSxDQUFBO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsY0FBYyxDQUFDLEVBQWhCLENBQW1CLDZDQUFuQixFQUFrRSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNqRixjQUFBO1VBRG1GLGlCQUFNO2lCQUN6RixLQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsQ0FBd0IsSUFBQSxTQUFBLENBQVUsS0FBQyxDQUFBLGNBQVgsRUFBMkIsS0FBM0IsQ0FBeEI7UUFEaUY7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxFLENBQWpCO01BR0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFNBQUE7UUFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEIsQ0FBdkIsRUFBMkQsa0NBQTNEO2VBQ0E7TUFGNEIsQ0FBOUI7TUFJQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLGNBQWMsQ0FBQyxFQUFoQixDQUFtQixtQ0FBbkIsRUFBd0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ3ZFLGNBQUE7VUFBQSxZQUFBLENBQWEsbUJBQWI7aUJBQ0EsbUJBQUEsR0FBc0IsVUFBQSxDQUFXLFNBQUE7WUFDL0IsS0FBQyxDQUFBLGtCQUFELENBQUE7bUJBQ0EsS0FBQyxDQUFBLFlBQUQsQ0FBQTtVQUYrQixDQUFYLEVBR3BCLFdBQVcsQ0FBQyxpQkFIUTtRQUZpRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEQsQ0FBakI7TUFPQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBWixDQUFvQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGtCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEMsQ0FBakI7TUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxxQkFBbkIsRUFBMEM7UUFBQyxLQUFBLEVBQU8sVUFBUjtPQUExQyxDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLHlCQUFuQixFQUE4QztRQUFDLEtBQUEsRUFBTyxVQUFSO09BQTlDLENBQWpCO01BQ0EsSUFBQyxDQUFBLGtCQUFELENBQUE7TUFFQSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBQSxDQUF3QixDQUFDLGlCQUF6QixDQUEyQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGFBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEzQztNQUVBLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixDQUFtQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDakIsS0FBQyxDQUFBLGlCQUFELEdBQXFCLEtBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFBO2lCQUNyQixLQUFDLENBQUEseUJBQUQsQ0FBQTtRQUZpQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkI7YUFJQSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBZSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDYixLQUFDLENBQUEsYUFBRCxHQUFpQixLQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsQ0FBQTtpQkFDakIsS0FBQyxDQUFBLHlCQUFELENBQUE7UUFGYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtJQTFDVTs7MEJBOENaLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLFlBQVksQ0FBQyxLQUFkLENBQUE7SUFESzs7MEJBR1AsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtJQURPOzswQkFHVCxZQUFBLEdBQWMsU0FBQyxRQUFEO0FBQ1osVUFBQTtNQUFBLFFBQVEsQ0FBQyxHQUFULEdBQWUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFiLENBQW9CLFNBQUMsR0FBRDtBQUFhLFlBQUE7UUFBWCxRQUFEO2VBQVk7TUFBYixDQUFwQjtNQUNmLFFBQVEsQ0FBQyxJQUFULEdBQWdCLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBZCxDQUFxQixTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZO01BQWIsQ0FBckI7TUFDaEIsUUFBUSxDQUFDLElBQVQsR0FBZ0IsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFkLENBQXFCLFNBQUMsR0FBRDtBQUFhLFlBQUE7UUFBWCxRQUFEO2VBQVk7TUFBYixDQUFyQjtNQUNoQixRQUFRLENBQUMsR0FBVCxHQUFlLENBQUMsUUFBUSxDQUFDLEdBQVQsSUFBZ0IsRUFBakIsQ0FBb0IsQ0FBQyxNQUFyQixDQUE0QixTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZO01BQWIsQ0FBNUI7QUFFZjtBQUFBLFdBQUEsc0NBQUE7OztVQUNFLElBQUksQ0FBQyxhQUFjLDBCQUFBLEdBQTJCLElBQUksQ0FBQzs7QUFEckQ7QUFHQTtBQUFBLFdBQUEsd0NBQUE7O0FBQ0U7QUFBQSxhQUFBLHdDQUFBOztVQUNFLElBQUksQ0FBQyxLQUFMLEdBQWEsbUJBQUEsQ0FBb0IsSUFBSSxDQUFDLFVBQXpCO0FBRGY7QUFERjthQUdBO0lBWlk7OzBCQWNkLFVBQUEsR0FBWSxTQUFDLFFBQUQ7TUFDVixRQUFRLENBQUMsR0FBRyxDQUFDLElBQWIsQ0FBa0IsMEJBQWxCO01BQ0EsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFkLENBQW1CLDBCQUFuQjtNQUNBLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBZCxDQUFtQiwwQkFBbkI7TUFDQSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQWIsQ0FBa0IsMEJBQWxCO2FBQ0E7SUFMVTs7MEJBT1osWUFBQSxHQUFjLFNBQUE7TUFDWixJQUFDLENBQUEsWUFBRCxHQUFnQjthQUNoQixJQUFDLENBQUEsY0FBYyxDQUFDLFlBQWhCLENBQUEsQ0FDRSxDQUFDLElBREgsQ0FDUSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsUUFBRDtVQUNKLEtBQUMsQ0FBQSxRQUFELEdBQVksS0FBQyxDQUFBLFVBQUQsQ0FBWSxLQUFDLENBQUEsWUFBRCxDQUFjLFFBQWQsQ0FBWjtVQUVaLEtBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixxQkFBbEIsQ0FBd0MsQ0FBQyxNQUF6QyxDQUFBO1VBQ0EsS0FBQyxDQUFBLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBWCxDQUFvQixLQUFDLENBQUEsUUFBUSxDQUFDLEdBQTlCO1VBRUEsS0FBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLHFCQUFuQixDQUF5QyxDQUFDLE1BQTFDLENBQUE7VUFDQSxLQUFDLENBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFaLENBQXFCLEtBQUMsQ0FBQSxRQUFRLENBQUMsSUFBL0I7VUFFQSxLQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBbkIsQ0FBd0IscUJBQXhCLENBQThDLENBQUMsTUFBL0MsQ0FBQTtVQUNBLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVosQ0FBcUIsS0FBQyxDQUFBLFFBQVEsQ0FBQyxJQUEvQjtVQUVBLEtBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixxQkFBbEIsQ0FBd0MsQ0FBQyxNQUF6QyxDQUFBO1VBQ0EsS0FBQyxDQUFBLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBWCxDQUFvQixLQUFDLENBQUEsUUFBUSxDQUFDLEdBQTlCO2lCQUlBLEtBQUMsQ0FBQSxtQkFBRCxDQUFBO1FBakJJO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURSLENBb0JFLEVBQUMsS0FBRCxFQXBCRixDQW9CUyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRDtVQUNMLEtBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQTtpQkFDQSxLQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsQ0FBd0IsSUFBQSxTQUFBLENBQVUsS0FBQyxDQUFBLGNBQVgsRUFBMkIsS0FBM0IsQ0FBeEI7UUFGSztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FwQlQ7SUFGWTs7MEJBMkJkLGtCQUFBLEdBQW9CLFNBQUE7TUFDbEIsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBQyxDQUFBLGdCQUFELENBQUE7TUFDakIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUMsQ0FBQSxvQkFBRCxDQUFBO01BQ3JCLElBQUMsQ0FBQSxrQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLHdCQUFELENBQUE7YUFDQSxJQUFDLENBQUEsNkJBQUQsQ0FBQTtJQUxrQjs7MEJBT3BCLDZCQUFBLEdBQStCLFNBQUE7TUFDN0IsSUFBQyxDQUFBLHFCQUFxQixDQUFDLEVBQXZCLENBQTBCLE9BQTFCLEVBQW1DLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO0FBQ2pDLGNBQUE7VUFBQSxLQUFLLENBQUMsZUFBTixDQUFBO1VBQ0EsYUFBQTs7K0JBQWdHLENBQUU7VUFDbEcsSUFBRyxxQkFBSDtpRkFDbUMsQ0FBRSxTQUFuQyxDQUE2QyxLQUFDLENBQUEsYUFBOUMsRUFBNkQ7Y0FDM0QsSUFBQSxFQUFNLFFBRHFEO2NBRTNELElBQUEsRUFBTSxhQUZxRDthQUE3RCxXQURGOztRQUhpQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkM7YUFTQSxJQUFDLENBQUEseUJBQXlCLENBQUMsRUFBM0IsQ0FBOEIsT0FBOUIsRUFBdUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7QUFDckMsY0FBQTtVQUFBLEtBQUssQ0FBQyxlQUFOLENBQUE7VUFDQSxpQkFBQTs7K0JBQXdHLENBQUU7VUFDMUcsSUFBRyx5QkFBSDtpRkFDbUMsQ0FBRSxTQUFuQyxDQUE2QyxLQUFDLENBQUEsaUJBQTlDLEVBQWlFO2NBQy9ELElBQUEsRUFBTSxRQUR5RDtjQUUvRCxJQUFBLEVBQU0saUJBRnlEO2FBQWpFLFdBREY7O1FBSHFDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QztJQVY2Qjs7MEJBbUIvQix3QkFBQSxHQUEwQixTQUFBO01BQ3hCLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsYUFBZCxDQUFIO1FBQ0UsSUFBQyxDQUFBLHFCQUFxQixDQUFDLElBQXZCLENBQUEsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEscUJBQXFCLENBQUMsSUFBdkIsQ0FBQSxFQUhGOztNQUtBLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsaUJBQWQsQ0FBSDtlQUNFLElBQUMsQ0FBQSx5QkFBeUIsQ0FBQyxJQUEzQixDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLHlCQUF5QixDQUFDLElBQTNCLENBQUEsRUFIRjs7SUFOd0I7OzBCQVcxQixXQUFBLEdBQWEsU0FBQyxXQUFEO2FBQWlCLElBQUMsQ0FBQSxjQUFjLENBQUMsa0JBQWhCLENBQW1DLFdBQW5DO0lBQWpCOzswQkFHYixrQkFBQSxHQUFvQixTQUFBO0FBQ2xCLFVBQUE7TUFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFBO01BQ0EsZUFBQSxHQUFrQixDQUFDLENBQUMsTUFBRixDQUFTLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBWixDQUFBLENBQVQsRUFBd0MsTUFBeEM7QUFDbEI7V0FBQSxpREFBQTttQ0FBSyxrQkFBTTtBQUNULGdCQUFPLFFBQVEsQ0FBQyxLQUFoQjtBQUFBLGVBQ08sSUFEUDtZQUVJLFNBQUEsR0FBWSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBckI7WUFDWixJQUFvQyxJQUFBLEtBQVEsSUFBQyxDQUFBLGFBQTdDO2NBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxVQUFmLEVBQTJCLElBQTNCLEVBQUE7O3lCQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFlLFNBQWY7QUFIRztBQURQLGVBS08sUUFMUDtZQU1JLFNBQUEsR0FBWSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBckI7WUFDWixJQUFvQyxJQUFBLEtBQVEsSUFBQyxDQUFBLGlCQUE3QztjQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsVUFBZixFQUEyQixJQUEzQixFQUFBOzt5QkFDQSxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosQ0FBbUIsU0FBbkI7QUFIRztBQUxQOztBQUFBO0FBREY7O0lBSmtCOzswQkFnQnBCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTt3QkFBSyxrQkFBTTtRQUNULElBQWUsUUFBUSxDQUFDLEtBQVQsS0FBa0IsSUFBakM7QUFBQSxpQkFBTyxLQUFQOztBQURGO2FBRUE7SUFIZ0I7OzBCQU1sQixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFVBQUE7QUFBQTtBQUFBLFdBQUEsc0NBQUE7d0JBQUssa0JBQU07UUFDVCxJQUFlLFFBQVEsQ0FBQyxLQUFULEtBQWtCLFFBQWpDO0FBQUEsaUJBQU8sS0FBUDs7QUFERjthQUVBO0lBSG9COzswQkFNdEIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsTUFBQSxHQUFTO01BQ1QsSUFBK0IsSUFBQyxDQUFBLGFBQWhDO1FBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsYUFBYixFQUFBOztNQUNBLElBQW1DLElBQUMsQ0FBQSxpQkFBcEM7UUFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxpQkFBYixFQUFBOztNQUNBLElBQTBDLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLENBQTFEO2VBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGFBQWhCLEVBQStCLE1BQS9CLEVBQUE7O0lBSmlCOzswQkFNbkIseUJBQUEsR0FBMkIsU0FBQTthQUN6QixVQUFBLENBQVcsQ0FBQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGlCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBRCxDQUFYLEVBQXNDLEdBQXRDO0lBRHlCOzswQkFJM0IsbUJBQUEsR0FBcUIsU0FBQyxTQUFEO0FBQ25CLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxTQUFmO2FBQ1IsRUFBQSxDQUFHLFNBQUE7ZUFBRyxJQUFDLENBQUEsTUFBRCxDQUFRO1VBQUEsS0FBQSxFQUFPLFNBQVA7U0FBUixFQUEwQixLQUExQjtNQUFILENBQUg7SUFGbUI7OzBCQUtyQixhQUFBLEdBQWUsU0FBQyxTQUFEO0FBQ2IsVUFBQTs7UUFEYyxZQUFVOztNQUN4QixLQUFBLEdBQVEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsZUFBbEIsRUFBbUMsRUFBbkMsQ0FBc0MsQ0FBQyxPQUF2QyxDQUErQyxVQUEvQyxFQUEyRCxFQUEzRDthQUNSLENBQUMsQ0FBQyxXQUFGLENBQWMsQ0FBQyxDQUFDLFdBQUYsQ0FBYyxLQUFkLENBQWQ7SUFGYTs7MEJBSWYsaUJBQUEsR0FBbUIsU0FBQyxJQUFEO0FBQ2pCLFVBQUE7TUFBQSxVQUFBLEdBQWEsRUFBQSxDQUFHLFNBQUE7ZUFBRyxJQUFDLENBQUEsR0FBRCxDQUFLO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxLQUFQO1NBQUw7TUFBSCxDQUFIO01BQ2IsUUFBQSxHQUFlLElBQUEsV0FBQSxDQUFZLElBQVosRUFBa0IsSUFBQyxDQUFBLGNBQW5CLEVBQW1DO1FBQUMsSUFBQSxFQUFNLFFBQVA7T0FBbkM7TUFDZixVQUFVLENBQUMsTUFBWCxDQUFrQixRQUFsQjthQUNBO0lBSmlCOzswQkFNbkIsdUJBQUEsR0FBeUIsU0FBQyxJQUFEO0FBQ3ZCLFVBQUE7TUFBQSxJQUFBLENBQWMsSUFBQyxDQUFBLFFBQWY7QUFBQSxlQUFBOztBQUVBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxRQUFBLEdBQVcsSUFBQyxDQUFBLFNBQVUsQ0FBQSxXQUFBLENBQVksQ0FBQyxRQUF4QixDQUFBO1FBQ1gsV0FBQSxHQUFjLElBQUMsQ0FBQSxTQUFVLENBQUEsV0FBQSxDQUFZLENBQUMsV0FBeEIsQ0FBb0MsU0FBQyxJQUFEO0FBQ2hELGNBQUE7VUFBQSxJQUFlLElBQUEsS0FBUSxFQUF2QjtBQUFBLG1CQUFPLEtBQVA7O1VBQ0EsS0FBQSx3Q0FBcUIsbUJBQUEsQ0FBb0IsSUFBSSxDQUFDLFVBQXpCO1VBQ3JCLFVBQUEsR0FBZ0IsSUFBSSxDQUFDLElBQU4sR0FBVyxHQUFYLEdBQWM7aUJBQzdCLFVBQVUsQ0FBQyxLQUFYLENBQWlCLFVBQWpCLEVBQTZCLElBQTdCLENBQUEsR0FBcUM7UUFKVyxDQUFwQztBQU1kLGFBQUEsNENBQUE7O2NBQTBCO1lBQ3hCLElBQUksQ0FBQyxJQUFMLENBQVUsZUFBVixDQUEwQixDQUFDLElBQTNCLENBQUEsQ0FBaUMsQ0FBQyxRQUFsQyxDQUEyQyxRQUEzQzs7QUFERjtBQUVBLGFBQUEsK0NBQUE7O2NBQTZCO1lBQzNCLElBQUksQ0FBQyxJQUFMLENBQVUsZUFBVixDQUEwQixDQUFDLElBQTNCLENBQUEsQ0FBaUMsQ0FBQyxXQUFsQyxDQUE4QyxRQUE5Qzs7QUFERjtBQVZGO2FBYUEsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFoQnVCOzswQkFrQnpCLDZCQUFBLEdBQStCLFNBQUE7TUFDN0IsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxxQkFBckIsRUFBNEMsSUFBQyxDQUFBLGNBQTdDLEVBQTZELElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQTVFO01BQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxnQkFBckIsRUFBdUMsSUFBQyxDQUFBLFNBQXhDLEVBQW1ELElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQWxFO01BQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSx1QkFBckIsRUFBOEMsSUFBQyxDQUFBLFFBQS9DLEVBQXlELElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQXZFO01BQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxlQUFyQixFQUFzQyxJQUFDLENBQUEsUUFBdkMsRUFBaUQsSUFBQyxDQUFBLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBL0Q7YUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBb0IsRUFBQSxHQUFFLENBQUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBZixHQUF3QixJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUF2QyxHQUFnRCxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUE5RCxHQUF1RSxJQUFDLENBQUEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUF0RixDQUF0QjtJQU42Qjs7MEJBUS9CLDJCQUFBLEdBQTZCLFNBQUE7QUFDM0IsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsSUFBQyxDQUFBLGlCQUF2QjtNQUNaLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFDLENBQUEscUJBQXJCLEVBQTRDLElBQUMsQ0FBQSxjQUE3QyxFQUE2RCxTQUE3RCxFQUF3RSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUF2RjtNQUVBLEdBQUEsR0FBTSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsSUFBQyxDQUFBLFdBQXZCO01BQ04sSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSx1QkFBckIsRUFBOEMsSUFBQyxDQUFBLFFBQS9DLEVBQXlELEdBQXpELEVBQThELElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQTVFO01BRUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixJQUFDLENBQUEsWUFBdkI7TUFDUCxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBQyxDQUFBLGdCQUFyQixFQUF1QyxJQUFDLENBQUEsU0FBeEMsRUFBbUQsSUFBbkQsRUFBeUQsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBeEU7TUFFQSxHQUFBLEdBQU0sSUFBQyxDQUFBLG9CQUFELENBQXNCLElBQUMsQ0FBQSxXQUF2QjthQUNOLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixJQUFDLENBQUEsZUFBckIsRUFBc0MsSUFBQyxDQUFBLFFBQXZDLEVBQWlELEdBQWpELEVBQXNELElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQXBFO0lBWDJCOzswQkFhN0Isb0JBQUEsR0FBc0IsU0FBQTthQUNwQixJQUFDLENBQUEsd0JBQUQsQ0FBMEIsQ0FBQyxJQUFDLENBQUEscUJBQUYsRUFBeUIsSUFBQyxDQUFBLGdCQUExQixFQUE0QyxJQUFDLENBQUEsdUJBQTdDLEVBQXNFLElBQUMsQ0FBQSxlQUF2RSxDQUExQjtJQURvQjs7MEJBR3RCLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLFVBQUEsR0FBYSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBQSxDQUF3QixDQUFDLE9BQXpCLENBQUE7YUFDYixJQUFDLENBQUEsdUJBQUQsQ0FBeUIsVUFBekI7SUFGYTs7OztLQWpUUztBQWxCMUIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcblxuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuZnV6emFsZHJpbiA9IHJlcXVpcmUgJ2Z1enphbGRyaW4nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskJCwgVGV4dEVkaXRvclZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbkNvbGxhcHNpYmxlU2VjdGlvblBhbmVsID0gcmVxdWlyZSAnLi9jb2xsYXBzaWJsZS1zZWN0aW9uLXBhbmVsJ1xuUGFja2FnZUNhcmQgPSByZXF1aXJlICcuL3BhY2thZ2UtY2FyZCdcbkVycm9yVmlldyA9IHJlcXVpcmUgJy4vZXJyb3ItdmlldydcblBhY2thZ2VNYW5hZ2VyID0gcmVxdWlyZSAnLi9wYWNrYWdlLW1hbmFnZXInXG5cbkxpc3QgPSByZXF1aXJlICcuL2xpc3QnXG5MaXN0VmlldyA9IHJlcXVpcmUgJy4vbGlzdC12aWV3J1xue293bmVyRnJvbVJlcG9zaXRvcnksIHBhY2thZ2VDb21wYXJhdG9yQXNjZW5kaW5nfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRoZW1lc1BhbmVsIGV4dGVuZHMgQ29sbGFwc2libGVTZWN0aW9uUGFuZWxcbiAgQGxvYWRQYWNrYWdlc0RlbGF5OiAzMDBcblxuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAncGFuZWxzLWl0ZW0nLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24gcGFja2FnZXMgdGhlbWVzLXBhbmVsJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24tY29udGFpbmVyJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wYWludGNhbicsICdDaG9vc2UgYSBUaGVtZSdcblxuICAgICAgICAgIEBkaXYgY2xhc3M6ICd0ZXh0IG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICAgICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1xdWVzdGlvbicsICdZb3UgY2FuIGFsc28gc3R5bGUgQXRvbSBieSBlZGl0aW5nICdcbiAgICAgICAgICAgIEBhIGNsYXNzOiAnbGluaycsIG91dGxldDogJ29wZW5Vc2VyU3R5c2hlZXQnLCAneW91ciBzdHlsZXNoZWV0J1xuXG4gICAgICAgICAgQGRpdiBjbGFzczogJ3RoZW1lcy1waWNrZXInLCA9PlxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3RoZW1lcy1waWNrZXItaXRlbSBjb250cm9sLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2xzJywgPT5cbiAgICAgICAgICAgICAgICBAbGFiZWwgY2xhc3M6ICdjb250cm9sLWxhYmVsJywgPT5cbiAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLXRpdGxlIHRoZW1lcy1sYWJlbCB0ZXh0JywgJ1VJIFRoZW1lJ1xuICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ3NldHRpbmctZGVzY3JpcHRpb24gdGV4dCB0aGVtZS1kZXNjcmlwdGlvbicsICdUaGlzIHN0eWxlcyB0aGUgdGFicywgc3RhdHVzIGJhciwgdHJlZSB2aWV3LCBhbmQgZHJvcGRvd25zJ1xuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZWxlY3QtY29udGFpbmVyJywgPT5cbiAgICAgICAgICAgICAgICAgIEBzZWxlY3Qgb3V0bGV0OiAndWlNZW51JywgY2xhc3M6ICdmb3JtLWNvbnRyb2wnXG4gICAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2FjdGl2ZVVpVGhlbWVTZXR0aW5ncycsIGNsYXNzOiAnYnRuIGljb24gaWNvbi1nZWFyIGFjdGl2ZS10aGVtZS1zZXR0aW5ncydcblxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3RoZW1lcy1waWNrZXItaXRlbSBjb250cm9sLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2xzJywgPT5cbiAgICAgICAgICAgICAgICBAbGFiZWwgY2xhc3M6ICdjb250cm9sLWxhYmVsJywgPT5cbiAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLXRpdGxlIHRoZW1lcy1sYWJlbCB0ZXh0JywgJ1N5bnRheCBUaGVtZSdcbiAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLWRlc2NyaXB0aW9uIHRleHQgdGhlbWUtZGVzY3JpcHRpb24nLCAnVGhpcyBzdHlsZXMgdGhlIHRleHQgaW5zaWRlIHRoZSBlZGl0b3InXG4gICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ3NlbGVjdC1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgICAgICAgQHNlbGVjdCBvdXRsZXQ6ICdzeW50YXhNZW51JywgY2xhc3M6ICdmb3JtLWNvbnRyb2wnXG4gICAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2FjdGl2ZVN5bnRheFRoZW1lU2V0dGluZ3MnLCBjbGFzczogJ2J0biBpY29uIGljb24tZ2VhciBhY3RpdmUtdGhlbWUtc2V0dGluZ3MnXG5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnc2VjdGlvbicsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdzZWN0aW9uLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24taGVhZGluZyBpY29uIGljb24tcGFpbnRjYW4nLCA9PlxuICAgICAgICAgICAgQHRleHQgJ0luc3RhbGxlZCBUaGVtZXMnXG4gICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICd0b3RhbFBhY2thZ2VzJywgY2xhc3M6ICdzZWN0aW9uLWhlYWRpbmctY291bnQgYmFkZ2UgYmFkZ2UtZmxleGlibGUnLCAn4oCmJ1xuICAgICAgICAgIEBkaXYgY2xhc3M6ICdlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgICAgICAgIEBzdWJ2aWV3ICdmaWx0ZXJFZGl0b3InLCBuZXcgVGV4dEVkaXRvclZpZXcobWluaTogdHJ1ZSwgcGxhY2Vob2xkZXJUZXh0OiAnRmlsdGVyIHRoZW1lcyBieSBuYW1lJylcblxuICAgICAgICAgIEBkaXYgb3V0bGV0OiAndGhlbWVFcnJvcnMnXG5cbiAgICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3N1Yi1zZWN0aW9uIGluc3RhbGxlZC1wYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAaDMgb3V0bGV0OiAnY29tbXVuaXR5VGhlbWVzSGVhZGVyJywgY2xhc3M6ICdzdWItc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wYWludGNhbicsID0+XG4gICAgICAgICAgICAgIEB0ZXh0ICdDb21tdW5pdHkgVGhlbWVzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdjb21tdW5pdHlDb3VudCcsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnY29tbXVuaXR5UGFja2FnZXMnLCBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGxvYWRpbmctYXJlYSBpY29uIGljb24taG91cmdsYXNzJywgXCJMb2FkaW5nIHRoZW1lc+KAplwiXG5cbiAgICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3N1Yi1zZWN0aW9uIGNvcmUtcGFja2FnZXMnLCA9PlxuICAgICAgICAgICAgQGgzIG91dGxldDogJ2NvcmVUaGVtZXNIZWFkZXInLCBjbGFzczogJ3N1Yi1zZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLXBhaW50Y2FuJywgPT5cbiAgICAgICAgICAgICAgQHRleHQgJ0NvcmUgVGhlbWVzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdjb3JlQ291bnQnLCBjbGFzczogJ3NlY3Rpb24taGVhZGluZy1jb3VudCBiYWRnZSBiYWRnZS1mbGV4aWJsZScsICfigKYnXG4gICAgICAgICAgICBAZGl2IG91dGxldDogJ2NvcmVQYWNrYWdlcycsIGNsYXNzOiAnY29udGFpbmVyIHBhY2thZ2UtY29udGFpbmVyJywgPT5cbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2FsZXJ0IGFsZXJ0LWluZm8gbG9hZGluZy1hcmVhIGljb24gaWNvbi1ob3VyZ2xhc3MnLCBcIkxvYWRpbmcgdGhlbWVz4oCmXCJcblxuICAgICAgICAgIEBzZWN0aW9uIGNsYXNzOiAnc3ViLXNlY3Rpb24gZGV2LXBhY2thZ2VzJywgPT5cbiAgICAgICAgICAgIEBoMyBvdXRsZXQ6ICdkZXZlbG9wbWVudFRoZW1lc0hlYWRlcicsIGNsYXNzOiAnc3ViLXNlY3Rpb24taGVhZGluZyBpY29uIGljb24tcGFpbnRjYW4nLCA9PlxuICAgICAgICAgICAgICBAdGV4dCAnRGV2ZWxvcG1lbnQgVGhlbWVzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkZXZDb3VudCcsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnZGV2UGFja2FnZXMnLCBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGxvYWRpbmctYXJlYSBpY29uIGljb24taG91cmdsYXNzJywgXCJMb2FkaW5nIHRoZW1lc+KAplwiXG5cbiAgICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3N1Yi1zZWN0aW9uIGdpdC1wYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAaDMgb3V0bGV0OiAnZ2l0VGhlbWVzSGVhZGVyJywgY2xhc3M6ICdzdWItc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wYWludGNhbicsID0+XG4gICAgICAgICAgICAgIEB0ZXh0ICdHaXQgVGhlbWVzJ1xuICAgICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdnaXRDb3VudCcsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nLWNvdW50IGJhZGdlIGJhZGdlLWZsZXhpYmxlJywgJ+KApidcbiAgICAgICAgICAgIEBkaXYgb3V0bGV0OiAnZ2l0UGFja2FnZXMnLCBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGxvYWRpbmctYXJlYSBpY29uIGljb24taG91cmdsYXNzJywgXCJMb2FkaW5nIHRoZW1lc+KAplwiXG5cbiAgaW5pdGlhbGl6ZTogKEBwYWNrYWdlTWFuYWdlcikgLT5cbiAgICBzdXBlclxuICAgIEBpdGVtcyA9XG4gICAgICBkZXY6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIGNvcmU6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIHVzZXI6IG5ldyBMaXN0KCduYW1lJylcbiAgICAgIGdpdDogbmV3IExpc3QoJ25hbWUnKVxuICAgIEBpdGVtVmlld3MgPVxuICAgICAgZGV2OiBuZXcgTGlzdFZpZXcoQGl0ZW1zLmRldiwgQGRldlBhY2thZ2VzLCBAY3JlYXRlUGFja2FnZUNhcmQpXG4gICAgICBjb3JlOiBuZXcgTGlzdFZpZXcoQGl0ZW1zLmNvcmUsIEBjb3JlUGFja2FnZXMsIEBjcmVhdGVQYWNrYWdlQ2FyZClcbiAgICAgIHVzZXI6IG5ldyBMaXN0VmlldyhAaXRlbXMudXNlciwgQGNvbW11bml0eVBhY2thZ2VzLCBAY3JlYXRlUGFja2FnZUNhcmQpXG4gICAgICBnaXQ6IG5ldyBMaXN0VmlldyhAaXRlbXMuZ2l0LCBAZ2l0UGFja2FnZXMsIEBjcmVhdGVQYWNrYWdlQ2FyZClcblxuICAgIEBoYW5kbGVFdmVudHMoKVxuICAgIEBsb2FkUGFja2FnZXMoKVxuXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICd0aGVtZS1pbnN0YWxsLWZhaWxlZCB0aGVtZS11bmluc3RhbGwtZmFpbGVkJywgKHtwYWNrLCBlcnJvcn0pID0+XG4gICAgICBAdGhlbWVFcnJvcnMuYXBwZW5kKG5ldyBFcnJvclZpZXcoQHBhY2thZ2VNYW5hZ2VyLCBlcnJvcikpXG5cbiAgICBAb3BlblVzZXJTdHlzaGVldC5vbiAnY2xpY2snLCAtPlxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnYXBwbGljYXRpb246b3Blbi15b3VyLXN0eWxlc2hlZXQnKVxuICAgICAgZmFsc2VcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICd0aGVtZS1pbnN0YWxsZWQgdGhlbWUtdW5pbnN0YWxsZWQnLCA9PlxuICAgICAgY2xlYXJUaW1lb3V0KGxvYWRQYWNrYWdlc1RpbWVvdXQpXG4gICAgICBsb2FkUGFja2FnZXNUaW1lb3V0ID0gc2V0VGltZW91dCA9PlxuICAgICAgICBAcG9wdWxhdGVUaGVtZU1lbnVzKClcbiAgICAgICAgQGxvYWRQYWNrYWdlcygpXG4gICAgICAsIFRoZW1lc1BhbmVsLmxvYWRQYWNrYWdlc0RlbGF5XG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20udGhlbWVzLm9uRGlkQ2hhbmdlQWN0aXZlVGhlbWVzID0+IEB1cGRhdGVBY3RpdmVUaGVtZXMoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS50b29sdGlwcy5hZGQoQGFjdGl2ZVVpVGhlbWVTZXR0aW5ncywge3RpdGxlOiAnU2V0dGluZ3MnfSlcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20udG9vbHRpcHMuYWRkKEBhY3RpdmVTeW50YXhUaGVtZVNldHRpbmdzLCB7dGl0bGU6ICdTZXR0aW5ncyd9KVxuICAgIEB1cGRhdGVBY3RpdmVUaGVtZXMoKVxuXG4gICAgQGZpbHRlckVkaXRvci5nZXRNb2RlbCgpLm9uRGlkU3RvcENoYW5naW5nID0+IEBtYXRjaFBhY2thZ2VzKClcblxuICAgIEBzeW50YXhNZW51LmNoYW5nZSA9PlxuICAgICAgQGFjdGl2ZVN5bnRheFRoZW1lID0gQHN5bnRheE1lbnUudmFsKClcbiAgICAgIEBzY2hlZHVsZVVwZGF0ZVRoZW1lQ29uZmlnKClcblxuICAgIEB1aU1lbnUuY2hhbmdlID0+XG4gICAgICBAYWN0aXZlVWlUaGVtZSA9IEB1aU1lbnUudmFsKClcbiAgICAgIEBzY2hlZHVsZVVwZGF0ZVRoZW1lQ29uZmlnKClcblxuICBmb2N1czogLT5cbiAgICBAZmlsdGVyRWRpdG9yLmZvY3VzKClcblxuICBkaXNwb3NlOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBmaWx0ZXJUaGVtZXM6IChwYWNrYWdlcykgLT5cbiAgICBwYWNrYWdlcy5kZXYgPSBwYWNrYWdlcy5kZXYuZmlsdGVyICh7dGhlbWV9KSAtPiB0aGVtZVxuICAgIHBhY2thZ2VzLnVzZXIgPSBwYWNrYWdlcy51c2VyLmZpbHRlciAoe3RoZW1lfSkgLT4gdGhlbWVcbiAgICBwYWNrYWdlcy5jb3JlID0gcGFja2FnZXMuY29yZS5maWx0ZXIgKHt0aGVtZX0pIC0+IHRoZW1lXG4gICAgcGFja2FnZXMuZ2l0ID0gKHBhY2thZ2VzLmdpdCBvciBbXSkuZmlsdGVyICh7dGhlbWV9KSAtPiB0aGVtZVxuXG4gICAgZm9yIHBhY2sgaW4gcGFja2FnZXMuY29yZVxuICAgICAgcGFjay5yZXBvc2l0b3J5ID89IFwiaHR0cHM6Ly9naXRodWIuY29tL2F0b20vI3twYWNrLm5hbWV9XCJcblxuICAgIGZvciBwYWNrYWdlVHlwZSBpbiBbJ2RldicsICdjb3JlJywgJ3VzZXInLCAnZ2l0J11cbiAgICAgIGZvciBwYWNrIGluIHBhY2thZ2VzW3BhY2thZ2VUeXBlXVxuICAgICAgICBwYWNrLm93bmVyID0gb3duZXJGcm9tUmVwb3NpdG9yeShwYWNrLnJlcG9zaXRvcnkpXG4gICAgcGFja2FnZXNcblxuICBzb3J0VGhlbWVzOiAocGFja2FnZXMpIC0+XG4gICAgcGFja2FnZXMuZGV2LnNvcnQocGFja2FnZUNvbXBhcmF0b3JBc2NlbmRpbmcpXG4gICAgcGFja2FnZXMuY29yZS5zb3J0KHBhY2thZ2VDb21wYXJhdG9yQXNjZW5kaW5nKVxuICAgIHBhY2thZ2VzLnVzZXIuc29ydChwYWNrYWdlQ29tcGFyYXRvckFzY2VuZGluZylcbiAgICBwYWNrYWdlcy5naXQuc29ydChwYWNrYWdlQ29tcGFyYXRvckFzY2VuZGluZylcbiAgICBwYWNrYWdlc1xuXG4gIGxvYWRQYWNrYWdlczogLT5cbiAgICBAcGFja2FnZVZpZXdzID0gW11cbiAgICBAcGFja2FnZU1hbmFnZXIuZ2V0SW5zdGFsbGVkKClcbiAgICAgIC50aGVuIChwYWNrYWdlcykgPT5cbiAgICAgICAgQHBhY2thZ2VzID0gQHNvcnRUaGVtZXMoQGZpbHRlclRoZW1lcyhwYWNrYWdlcykpXG5cbiAgICAgICAgQGRldlBhY2thZ2VzLmZpbmQoJy5hbGVydC5sb2FkaW5nLWFyZWEnKS5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMuZGV2LnNldEl0ZW1zKEBwYWNrYWdlcy5kZXYpXG5cbiAgICAgICAgQGNvcmVQYWNrYWdlcy5maW5kKCcuYWxlcnQubG9hZGluZy1hcmVhJykucmVtb3ZlKClcbiAgICAgICAgQGl0ZW1zLmNvcmUuc2V0SXRlbXMoQHBhY2thZ2VzLmNvcmUpXG5cbiAgICAgICAgQGNvbW11bml0eVBhY2thZ2VzLmZpbmQoJy5hbGVydC5sb2FkaW5nLWFyZWEnKS5yZW1vdmUoKVxuICAgICAgICBAaXRlbXMudXNlci5zZXRJdGVtcyhAcGFja2FnZXMudXNlcilcblxuICAgICAgICBAZ2l0UGFja2FnZXMuZmluZCgnLmFsZXJ0LmxvYWRpbmctYXJlYScpLnJlbW92ZSgpXG4gICAgICAgIEBpdGVtcy5naXQuc2V0SXRlbXMoQHBhY2thZ2VzLmdpdClcblxuICAgICAgICAjIFRPRE8gc2hvdyBlbXB0eSBtZXNhZ2UgcGVyIHNlY3Rpb25cblxuICAgICAgICBAdXBkYXRlU2VjdGlvbkNvdW50cygpXG5cbiAgICAgIC5jYXRjaCAoZXJyb3IpID0+XG4gICAgICAgIEBsb2FkaW5nTWVzc2FnZS5oaWRlKClcbiAgICAgICAgQHRoZW1lRXJyb3JzLmFwcGVuZChuZXcgRXJyb3JWaWV3KEBwYWNrYWdlTWFuYWdlciwgZXJyb3IpKVxuXG4gICMgVXBkYXRlIHRoZSBhY3RpdmUgVUkgYW5kIHN5bnRheCB0aGVtZXMgYW5kIHBvcHVsYXRlIHRoZSBtZW51XG4gIHVwZGF0ZUFjdGl2ZVRoZW1lczogLT5cbiAgICBAYWN0aXZlVWlUaGVtZSA9IEBnZXRBY3RpdmVVaVRoZW1lKClcbiAgICBAYWN0aXZlU3ludGF4VGhlbWUgPSBAZ2V0QWN0aXZlU3ludGF4VGhlbWUoKVxuICAgIEBwb3B1bGF0ZVRoZW1lTWVudXMoKVxuICAgIEB0b2dnbGVBY3RpdmVUaGVtZUJ1dHRvbnMoKVxuICAgIEBoYW5kbGVBY3RpdmVUaGVtZUJ1dHRvbkV2ZW50cygpXG5cbiAgaGFuZGxlQWN0aXZlVGhlbWVCdXR0b25FdmVudHM6IC0+XG4gICAgQGFjdGl2ZVVpVGhlbWVTZXR0aW5ncy5vbiAnY2xpY2snLCAoZXZlbnQpID0+XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgYWN0aXZlVWlUaGVtZSA9IGF0b20udGhlbWVzLmdldEFjdGl2ZVRoZW1lcygpLmZpbHRlcigodGhlbWUpIC0+IHRoZW1lLm1ldGFkYXRhLnRoZW1lIGlzICd1aScpWzBdPy5tZXRhZGF0YVxuICAgICAgaWYgYWN0aXZlVWlUaGVtZT9cbiAgICAgICAgQHBhcmVudHMoJy5zZXR0aW5ncy12aWV3JykudmlldygpPy5zaG93UGFuZWwoQGFjdGl2ZVVpVGhlbWUsIHtcbiAgICAgICAgICBiYWNrOiAnVGhlbWVzJyxcbiAgICAgICAgICBwYWNrOiBhY3RpdmVVaVRoZW1lXG4gICAgICAgIH0pXG5cbiAgICBAYWN0aXZlU3ludGF4VGhlbWVTZXR0aW5ncy5vbiAnY2xpY2snLCAoZXZlbnQpID0+XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgYWN0aXZlU3ludGF4VGhlbWUgPSBhdG9tLnRoZW1lcy5nZXRBY3RpdmVUaGVtZXMoKS5maWx0ZXIoKHRoZW1lKSAtPiB0aGVtZS5tZXRhZGF0YS50aGVtZSBpcyAnc3ludGF4JylbMF0/Lm1ldGFkYXRhXG4gICAgICBpZiBhY3RpdmVTeW50YXhUaGVtZT9cbiAgICAgICAgQHBhcmVudHMoJy5zZXR0aW5ncy12aWV3JykudmlldygpPy5zaG93UGFuZWwoQGFjdGl2ZVN5bnRheFRoZW1lLCB7XG4gICAgICAgICAgYmFjazogJ1RoZW1lcycsXG4gICAgICAgICAgcGFjazogYWN0aXZlU3ludGF4VGhlbWVcbiAgICAgICAgfSlcblxuICB0b2dnbGVBY3RpdmVUaGVtZUJ1dHRvbnM6IC0+XG4gICAgaWYgQGhhc1NldHRpbmdzKEBhY3RpdmVVaVRoZW1lKVxuICAgICAgQGFjdGl2ZVVpVGhlbWVTZXR0aW5ncy5zaG93KClcbiAgICBlbHNlXG4gICAgICBAYWN0aXZlVWlUaGVtZVNldHRpbmdzLmhpZGUoKVxuXG4gICAgaWYgQGhhc1NldHRpbmdzKEBhY3RpdmVTeW50YXhUaGVtZSlcbiAgICAgIEBhY3RpdmVTeW50YXhUaGVtZVNldHRpbmdzLnNob3coKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmVTeW50YXhUaGVtZVNldHRpbmdzLmhpZGUoKVxuXG4gIGhhc1NldHRpbmdzOiAocGFja2FnZU5hbWUpIC0+IEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlSGFzU2V0dGluZ3MocGFja2FnZU5hbWUpXG5cbiAgIyBQb3B1bGF0ZSB0aGUgdGhlbWUgbWVudXMgZnJvbSB0aGUgdGhlbWUgbWFuYWdlcidzIGFjdGl2ZSB0aGVtZXNcbiAgcG9wdWxhdGVUaGVtZU1lbnVzOiAtPlxuICAgIEB1aU1lbnUuZW1wdHkoKVxuICAgIEBzeW50YXhNZW51LmVtcHR5KClcbiAgICBhdmFpbGFibGVUaGVtZXMgPSBfLnNvcnRCeShhdG9tLnRoZW1lcy5nZXRMb2FkZWRUaGVtZXMoKSwgJ25hbWUnKVxuICAgIGZvciB7bmFtZSwgbWV0YWRhdGF9IGluIGF2YWlsYWJsZVRoZW1lc1xuICAgICAgc3dpdGNoIG1ldGFkYXRhLnRoZW1lXG4gICAgICAgIHdoZW4gJ3VpJ1xuICAgICAgICAgIHRoZW1lSXRlbSA9IEBjcmVhdGVUaGVtZU1lbnVJdGVtKG5hbWUpXG4gICAgICAgICAgdGhlbWVJdGVtLmF0dHIoJ3NlbGVjdGVkJywgdHJ1ZSkgaWYgbmFtZSBpcyBAYWN0aXZlVWlUaGVtZVxuICAgICAgICAgIEB1aU1lbnUuYXBwZW5kKHRoZW1lSXRlbSlcbiAgICAgICAgd2hlbiAnc3ludGF4J1xuICAgICAgICAgIHRoZW1lSXRlbSA9IEBjcmVhdGVUaGVtZU1lbnVJdGVtKG5hbWUpXG4gICAgICAgICAgdGhlbWVJdGVtLmF0dHIoJ3NlbGVjdGVkJywgdHJ1ZSkgaWYgbmFtZSBpcyBAYWN0aXZlU3ludGF4VGhlbWVcbiAgICAgICAgICBAc3ludGF4TWVudS5hcHBlbmQodGhlbWVJdGVtKVxuXG4gICMgR2V0IHRoZSBuYW1lIG9mIHRoZSBhY3RpdmUgdWkgdGhlbWUuXG4gIGdldEFjdGl2ZVVpVGhlbWU6IC0+XG4gICAgZm9yIHtuYW1lLCBtZXRhZGF0YX0gaW4gYXRvbS50aGVtZXMuZ2V0QWN0aXZlVGhlbWVzKClcbiAgICAgIHJldHVybiBuYW1lIGlmIG1ldGFkYXRhLnRoZW1lIGlzICd1aSdcbiAgICBudWxsXG5cbiAgIyBHZXQgdGhlIG5hbWUgb2YgdGhlIGFjdGl2ZSBzeW50YXggdGhlbWUuXG4gIGdldEFjdGl2ZVN5bnRheFRoZW1lOiAtPlxuICAgIGZvciB7bmFtZSwgbWV0YWRhdGF9IGluIGF0b20udGhlbWVzLmdldEFjdGl2ZVRoZW1lcygpXG4gICAgICByZXR1cm4gbmFtZSBpZiBtZXRhZGF0YS50aGVtZSBpcyAnc3ludGF4J1xuICAgIG51bGxcblxuICAjIFVwZGF0ZSB0aGUgY29uZmlnIHdpdGggdGhlIHNlbGVjdGVkIHRoZW1lc1xuICB1cGRhdGVUaGVtZUNvbmZpZzogLT5cbiAgICB0aGVtZXMgPSBbXVxuICAgIHRoZW1lcy5wdXNoKEBhY3RpdmVVaVRoZW1lKSBpZiBAYWN0aXZlVWlUaGVtZVxuICAgIHRoZW1lcy5wdXNoKEBhY3RpdmVTeW50YXhUaGVtZSkgaWYgQGFjdGl2ZVN5bnRheFRoZW1lXG4gICAgYXRvbS5jb25maWcuc2V0KFwiY29yZS50aGVtZXNcIiwgdGhlbWVzKSBpZiB0aGVtZXMubGVuZ3RoID4gMFxuXG4gIHNjaGVkdWxlVXBkYXRlVGhlbWVDb25maWc6IC0+XG4gICAgc2V0VGltZW91dCgoPT4gQHVwZGF0ZVRoZW1lQ29uZmlnKCkpLCAxMDApXG5cbiAgIyBDcmVhdGUgYSBtZW51IGl0ZW0gZm9yIHRoZSBnaXZlbiB0aGVtZSBuYW1lLlxuICBjcmVhdGVUaGVtZU1lbnVJdGVtOiAodGhlbWVOYW1lKSAtPlxuICAgIHRpdGxlID0gQGdldFRoZW1lVGl0bGUodGhlbWVOYW1lKVxuICAgICQkIC0+IEBvcHRpb24gdmFsdWU6IHRoZW1lTmFtZSwgdGl0bGVcblxuICAjIEdldCBhIGh1bWFuIHJlYWRhYmxlIHRpdGxlIGZvciB0aGUgZ2l2ZW4gdGhlbWUgbmFtZS5cbiAgZ2V0VGhlbWVUaXRsZTogKHRoZW1lTmFtZT0nJykgLT5cbiAgICB0aXRsZSA9IHRoZW1lTmFtZS5yZXBsYWNlKC8tKHVpfHN5bnRheCkvZywgJycpLnJlcGxhY2UoLy10aGVtZSQvZywgJycpXG4gICAgXy51bmRhc2hlcml6ZShfLnVuY2FtZWxjYXNlKHRpdGxlKSlcblxuICBjcmVhdGVQYWNrYWdlQ2FyZDogKHBhY2spID0+XG4gICAgcGFja2FnZVJvdyA9ICQkIC0+IEBkaXYgY2xhc3M6ICdyb3cnXG4gICAgcGFja1ZpZXcgPSBuZXcgUGFja2FnZUNhcmQocGFjaywgQHBhY2thZ2VNYW5hZ2VyLCB7YmFjazogJ1RoZW1lcyd9KVxuICAgIHBhY2thZ2VSb3cuYXBwZW5kKHBhY2tWaWV3KVxuICAgIHBhY2thZ2VSb3dcblxuICBmaWx0ZXJQYWNrYWdlTGlzdEJ5VGV4dDogKHRleHQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGFja2FnZXNcblxuICAgIGZvciBwYWNrYWdlVHlwZSBpbiBbJ2RldicsICdjb3JlJywgJ3VzZXInLCAnZ2l0J11cbiAgICAgIGFsbFZpZXdzID0gQGl0ZW1WaWV3c1twYWNrYWdlVHlwZV0uZ2V0Vmlld3MoKVxuICAgICAgYWN0aXZlVmlld3MgPSBAaXRlbVZpZXdzW3BhY2thZ2VUeXBlXS5maWx0ZXJWaWV3cyAocGFjaykgLT5cbiAgICAgICAgcmV0dXJuIHRydWUgaWYgdGV4dCBpcyAnJ1xuICAgICAgICBvd25lciA9IHBhY2sub3duZXIgPyBvd25lckZyb21SZXBvc2l0b3J5KHBhY2sucmVwb3NpdG9yeSlcbiAgICAgICAgZmlsdGVyVGV4dCA9IFwiI3twYWNrLm5hbWV9ICN7b3duZXJ9XCJcbiAgICAgICAgZnV6emFsZHJpbi5zY29yZShmaWx0ZXJUZXh0LCB0ZXh0KSA+IDBcblxuICAgICAgZm9yIHZpZXcgaW4gYWxsVmlld3Mgd2hlbiB2aWV3XG4gICAgICAgIHZpZXcuZmluZCgnLnBhY2thZ2UtY2FyZCcpLmhpZGUoKS5hZGRDbGFzcygnaGlkZGVuJylcbiAgICAgIGZvciB2aWV3IGluIGFjdGl2ZVZpZXdzIHdoZW4gdmlld1xuICAgICAgICB2aWV3LmZpbmQoJy5wYWNrYWdlLWNhcmQnKS5zaG93KCkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cbiAgICBAdXBkYXRlU2VjdGlvbkNvdW50cygpXG5cbiAgdXBkYXRlVW5maWx0ZXJlZFNlY3Rpb25Db3VudHM6IC0+XG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAY29tbXVuaXR5VGhlbWVzSGVhZGVyLCBAY29tbXVuaXR5Q291bnQsIEBwYWNrYWdlcy51c2VyLmxlbmd0aClcbiAgICBAdXBkYXRlU2VjdGlvbkNvdW50KEBjb3JlVGhlbWVzSGVhZGVyLCBAY29yZUNvdW50LCBAcGFja2FnZXMuY29yZS5sZW5ndGgpXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZGV2ZWxvcG1lbnRUaGVtZXNIZWFkZXIsIEBkZXZDb3VudCwgQHBhY2thZ2VzLmRldi5sZW5ndGgpXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZ2l0VGhlbWVzSGVhZGVyLCBAZ2l0Q291bnQsIEBwYWNrYWdlcy5naXQubGVuZ3RoKVxuXG4gICAgQHRvdGFsUGFja2FnZXMudGV4dCBcIiN7QHBhY2thZ2VzLnVzZXIubGVuZ3RoICsgQHBhY2thZ2VzLmNvcmUubGVuZ3RoICsgQHBhY2thZ2VzLmRldi5sZW5ndGggKyBAcGFja2FnZXMuZ2l0Lmxlbmd0aH1cIlxuXG4gIHVwZGF0ZUZpbHRlcmVkU2VjdGlvbkNvdW50czogLT5cbiAgICBjb21tdW5pdHkgPSBAbm90SGlkZGVuQ2FyZHNMZW5ndGgoQGNvbW11bml0eVBhY2thZ2VzKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGNvbW11bml0eVRoZW1lc0hlYWRlciwgQGNvbW11bml0eUNvdW50LCBjb21tdW5pdHksIEBwYWNrYWdlcy51c2VyLmxlbmd0aClcblxuICAgIGRldiA9IEBub3RIaWRkZW5DYXJkc0xlbmd0aChAZGV2UGFja2FnZXMpXG4gICAgQHVwZGF0ZVNlY3Rpb25Db3VudChAZGV2ZWxvcG1lbnRUaGVtZXNIZWFkZXIsIEBkZXZDb3VudCwgZGV2LCBAcGFja2FnZXMuZGV2Lmxlbmd0aClcblxuICAgIGNvcmUgPSBAbm90SGlkZGVuQ2FyZHNMZW5ndGgoQGNvcmVQYWNrYWdlcylcbiAgICBAdXBkYXRlU2VjdGlvbkNvdW50KEBjb3JlVGhlbWVzSGVhZGVyLCBAY29yZUNvdW50LCBjb3JlLCBAcGFja2FnZXMuY29yZS5sZW5ndGgpXG5cbiAgICBnaXQgPSBAbm90SGlkZGVuQ2FyZHNMZW5ndGgoQGdpdFBhY2thZ2VzKVxuICAgIEB1cGRhdGVTZWN0aW9uQ291bnQoQGdpdFRoZW1lc0hlYWRlciwgQGdpdENvdW50LCBnaXQsIEBwYWNrYWdlcy5naXQubGVuZ3RoKVxuXG4gIHJlc2V0U2VjdGlvbkhhc0l0ZW1zOiAtPlxuICAgIEByZXNldENvbGxhcHNpYmxlU2VjdGlvbnMoW0Bjb21tdW5pdHlUaGVtZXNIZWFkZXIsIEBjb3JlVGhlbWVzSGVhZGVyLCBAZGV2ZWxvcG1lbnRUaGVtZXNIZWFkZXIsIEBnaXRUaGVtZXNIZWFkZXJdKVxuXG4gIG1hdGNoUGFja2FnZXM6IC0+XG4gICAgZmlsdGVyVGV4dCA9IEBmaWx0ZXJFZGl0b3IuZ2V0TW9kZWwoKS5nZXRUZXh0KClcbiAgICBAZmlsdGVyUGFja2FnZUxpc3RCeVRleHQoZmlsdGVyVGV4dClcbiJdfQ==
