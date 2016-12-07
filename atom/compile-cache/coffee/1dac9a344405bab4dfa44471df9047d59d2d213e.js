(function() {
  var $, $$, Client, CompositeDisposable, ErrorView, InstallPanel, PackageCard, PackageManager, PackageNameRegex, ScrollView, TextEditorView, _, fs, hostedGitInfo, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, $$ = ref.$$, TextEditorView = ref.TextEditorView, ScrollView = ref.ScrollView;

  CompositeDisposable = require('atom').CompositeDisposable;

  PackageCard = require('./package-card');

  Client = require('./atom-io-client');

  ErrorView = require('./error-view');

  PackageManager = require('./package-manager');

  PackageNameRegex = /config\/install\/(package|theme):([a-z0-9-_]+)/i;

  hostedGitInfo = require('hosted-git-info');

  module.exports = InstallPanel = (function(superClass) {
    extend(InstallPanel, superClass);

    function InstallPanel() {
      return InstallPanel.__super__.constructor.apply(this, arguments);
    }

    InstallPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'section packages'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.h1({
                outlet: 'installHeading',
                "class": 'section-heading icon icon-plus'
              }, 'Install Packages');
              _this.div({
                "class": 'text native-key-bindings',
                tabindex: -1
              }, function() {
                _this.span({
                  "class": 'icon icon-question'
                });
                _this.span({
                  outlet: 'publishedToText'
                }, 'Packages are published to ');
                _this.a({
                  "class": 'link',
                  outlet: "openAtomIo"
                }, "atom.io");
                return _this.span(" and are installed to " + (path.join(process.env.ATOM_HOME, 'packages')));
              });
              _this.div({
                "class": 'search-container clearfix'
              }, function() {
                _this.div({
                  "class": 'editor-container'
                }, function() {
                  return _this.subview('searchEditorView', new TextEditorView({
                    mini: true
                  }));
                });
                return _this.div({
                  "class": 'btn-group'
                }, function() {
                  _this.button({
                    outlet: 'searchPackagesButton',
                    "class": 'btn btn-default selected'
                  }, 'Packages');
                  return _this.button({
                    outlet: 'searchThemesButton',
                    "class": 'btn btn-default'
                  }, 'Themes');
                });
              });
              _this.div({
                outlet: 'searchErrors'
              });
              _this.div({
                outlet: 'searchMessage',
                "class": 'alert alert-info search-message icon icon-search'
              });
              return _this.div({
                outlet: 'resultsContainer',
                "class": 'container package-container'
              });
            });
          });
          return _this.div({
            "class": 'section packages'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.div({
                outlet: 'featuredHeading',
                "class": 'section-heading icon icon-star'
              });
              _this.div({
                outlet: 'featuredErrors'
              });
              _this.div({
                outlet: 'loadingMessage',
                "class": 'alert alert-info icon icon-hourglass'
              });
              return _this.div({
                outlet: 'featuredContainer',
                "class": 'container package-container'
              });
            });
          });
        };
      })(this));
    };

    InstallPanel.prototype.initialize = function(packageManager) {
      var client, ref1;
      this.packageManager = packageManager;
      InstallPanel.__super__.initialize.apply(this, arguments);
      this.disposables = new CompositeDisposable();
      client = (ref1 = $('.settings-view').view()) != null ? ref1.client : void 0;
      this.client = this.packageManager.getClient();
      this.atomIoURL = 'https://atom.io/packages';
      this.openAtomIo.on('click', (function(_this) {
        return function() {
          require('electron').shell.openExternal(_this.atomIoURL);
          return false;
        };
      })(this));
      this.searchMessage.hide();
      this.searchEditorView.getModel().setPlaceholderText('Search packages');
      this.searchType = 'packages';
      this.handleSearchEvents();
      return this.loadFeaturedPackages();
    };

    InstallPanel.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    InstallPanel.prototype.focus = function() {
      return this.searchEditorView.focus();
    };

    InstallPanel.prototype.handleSearchEvents = function() {
      this.disposables.add(this.packageManager.on('package-install-failed', (function(_this) {
        return function(arg) {
          var error, pack;
          pack = arg.pack, error = arg.error;
          return _this.searchErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this)));
      this.disposables.add(this.packageManager.on('package-installed theme-installed', (function(_this) {
        return function(arg) {
          var gitUrlInfo, pack, ref1, ref2;
          pack = arg.pack;
          gitUrlInfo = (ref1 = _this.currentGitPackageCard) != null ? (ref2 = ref1.pack) != null ? ref2.gitUrlInfo : void 0 : void 0;
          if ((gitUrlInfo != null) && gitUrlInfo === pack.gitUrlInfo) {
            return _this.updateGitPackageCard(pack);
          }
        };
      })(this)));
      this.disposables.add(atom.commands.add(this.searchEditorView.element, 'core:confirm', (function(_this) {
        return function() {
          return _this.performSearch();
        };
      })(this)));
      this.searchPackagesButton.on('click', (function(_this) {
        return function() {
          if (!_this.searchPackagesButton.hasClass('selected')) {
            _this.setSearchType('package');
          }
          return _this.performSearch();
        };
      })(this));
      return this.searchThemesButton.on('click', (function(_this) {
        return function() {
          if (!_this.searchThemesButton.hasClass('selected')) {
            _this.setSearchType('theme');
          }
          return _this.performSearch();
        };
      })(this));
    };

    InstallPanel.prototype.setSearchType = function(searchType) {
      if (searchType === 'theme') {
        this.searchType = 'themes';
        this.searchThemesButton.addClass('selected');
        this.searchPackagesButton.removeClass('selected');
        this.searchEditorView.getModel().setPlaceholderText('Search themes');
        this.publishedToText.text('Themes are published to ');
        this.atomIoURL = 'https://atom.io/themes';
        return this.loadFeaturedPackages(true);
      } else if (searchType === 'package') {
        this.searchType = 'packages';
        this.searchPackagesButton.addClass('selected');
        this.searchThemesButton.removeClass('selected');
        this.searchEditorView.getModel().setPlaceholderText('Search packages');
        this.publishedToText.text('Packages are published to ');
        this.atomIoURL = 'https://atom.io/packages';
        return this.loadFeaturedPackages();
      }
    };

    InstallPanel.prototype.beforeShow = function(options) {
      var packageName, query, searchType;
      if ((options != null ? options.uri : void 0) == null) {
        return;
      }
      query = this.extractQueryFromURI(options.uri);
      if (query != null) {
        searchType = query.searchType, packageName = query.packageName;
        this.setSearchType(searchType);
        this.searchEditorView.setText(packageName);
        return this.performSearch();
      }
    };

    InstallPanel.prototype.extractQueryFromURI = function(uri) {
      var __, matches, packageName, searchType;
      matches = PackageNameRegex.exec(uri);
      if (matches != null) {
        __ = matches[0], searchType = matches[1], packageName = matches[2];
        return {
          searchType: searchType,
          packageName: packageName
        };
      } else {
        return null;
      }
    };

    InstallPanel.prototype.performSearch = function() {
      var query;
      if (query = this.searchEditorView.getText().trim().toLowerCase()) {
        return this.performSearchForQuery(query);
      }
    };

    InstallPanel.prototype.performSearchForQuery = function(query) {
      var gitUrlInfo, type;
      if (gitUrlInfo = hostedGitInfo.fromUrl(query)) {
        type = gitUrlInfo["default"];
        if (type === 'sshurl' || type === 'https' || type === 'shortcut') {
          return this.showGitInstallPackageCard({
            name: query,
            gitUrlInfo: gitUrlInfo
          });
        }
      } else {
        return this.search(query);
      }
    };

    InstallPanel.prototype.showGitInstallPackageCard = function(pack) {
      var ref1;
      if ((ref1 = this.currentGitPackageCard) != null) {
        ref1.dispose();
      }
      this.currentGitPackageCard = this.getPackageCardView(pack);
      this.currentGitPackageCard.displayGitPackageInstallInformation();
      return this.replaceCurrentGitPackageCardView();
    };

    InstallPanel.prototype.updateGitPackageCard = function(pack) {
      this.currentGitPackageCard.dispose();
      this.currentGitPackageCard = this.getPackageCardView(pack);
      return this.replaceCurrentGitPackageCardView();
    };

    InstallPanel.prototype.replaceCurrentGitPackageCardView = function() {
      this.resultsContainer.empty();
      return this.addPackageCardView(this.resultsContainer, this.currentGitPackageCard);
    };

    InstallPanel.prototype.search = function(query) {
      var opts;
      this.resultsContainer.empty();
      this.searchMessage.text("Searching " + this.searchType + " for \u201C" + query + "\u201D\u2026").show();
      opts = {};
      opts[this.searchType] = true;
      opts['sortBy'] = "downloads";
      return this.packageManager.search(query, opts).then((function(_this) {
        return function(packages) {
          if (packages == null) {
            packages = [];
          }
          _this.resultsContainer.empty();
          return packages;
        };
      })(this)).then((function(_this) {
        return function(packages) {
          if (packages == null) {
            packages = [];
          }
          _this.searchMessage.hide();
          if (packages.length === 0) {
            _this.showNoResultMessage;
          }
          return packages;
        };
      })(this)).then((function(_this) {
        return function(packages) {
          if (packages == null) {
            packages = [];
          }
          return _this.highlightExactMatch(_this.resultsContainer, query, packages);
        };
      })(this)).then((function(_this) {
        return function(packages) {
          if (packages == null) {
            packages = [];
          }
          return _this.addCloseMatches(_this.resultsContainer, query, packages);
        };
      })(this)).then((function(_this) {
        return function(packages) {
          if (packages == null) {
            packages = [];
          }
          return _this.addPackageViews(_this.resultsContainer, packages);
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          _this.searchMessage.hide();
          return _this.searchErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this));
    };

    InstallPanel.prototype.showNoResultMessage = function() {
      return this.searchMessage.text("No " + (this.searchType.replace(/s$/, '')) + " results for \u201C" + query + "\u201D").show();
    };

    InstallPanel.prototype.highlightExactMatch = function(container, query, packages) {
      var exactMatch;
      exactMatch = _.filter(packages, function(pkg) {
        return pkg.name === query;
      })[0];
      if (exactMatch) {
        this.addPackageCardView(container, this.getPackageCardView(exactMatch));
        packages.splice(packages.indexOf(exactMatch), 1);
      }
      return packages;
    };

    InstallPanel.prototype.addCloseMatches = function(container, query, packages) {
      var i, len, matches, pack;
      matches = _.filter(packages, function(pkg) {
        return pkg.name.indexOf(query) >= 0;
      });
      for (i = 0, len = matches.length; i < len; i++) {
        pack = matches[i];
        this.addPackageCardView(container, this.getPackageCardView(pack));
        packages.splice(packages.indexOf(pack), 1);
      }
      return packages;
    };

    InstallPanel.prototype.addPackageViews = function(container, packages) {
      var i, len, pack, results;
      results = [];
      for (i = 0, len = packages.length; i < len; i++) {
        pack = packages[i];
        results.push(this.addPackageCardView(container, this.getPackageCardView(pack)));
      }
      return results;
    };

    InstallPanel.prototype.addPackageCardView = function(container, packageCard) {
      var packageRow;
      packageRow = $$(function() {
        return this.div({
          "class": 'row'
        });
      });
      container.append(packageRow);
      return packageRow.append(packageCard);
    };

    InstallPanel.prototype.getPackageCardView = function(pack) {
      return new PackageCard(pack, this.packageManager, {
        back: 'Install'
      });
    };

    InstallPanel.prototype.filterPackages = function(packages, themes) {
      return packages.filter(function(arg) {
        var theme;
        theme = arg.theme;
        if (themes) {
          return theme;
        } else {
          return !theme;
        }
      });
    };

    InstallPanel.prototype.loadFeaturedPackages = function(loadThemes) {
      var handle;
      if (loadThemes == null) {
        loadThemes = false;
      }
      this.featuredContainer.empty();
      if (loadThemes) {
        this.installHeading.text('Install Themes');
        this.featuredHeading.text('Featured Themes');
        this.loadingMessage.text('Loading featured themes\u2026');
      } else {
        this.installHeading.text('Install Packages');
        this.featuredHeading.text('Featured Packages');
        this.loadingMessage.text('Loading featured packages\u2026');
      }
      this.loadingMessage.show();
      handle = (function(_this) {
        return function(error) {
          _this.loadingMessage.hide();
          return _this.featuredErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this);
      if (loadThemes) {
        return this.client.featuredThemes((function(_this) {
          return function(error, themes) {
            if (error) {
              return handle(error);
            } else {
              _this.loadingMessage.hide();
              _this.featuredHeading.text('Featured Themes');
              return _this.addPackageViews(_this.featuredContainer, themes);
            }
          };
        })(this));
      } else {
        return this.client.featuredPackages((function(_this) {
          return function(error, packages) {
            if (error) {
              return handle(error);
            } else {
              _this.loadingMessage.hide();
              _this.featuredHeading.text('Featured Packages');
              return _this.addPackageViews(_this.featuredContainer, packages);
            }
          };
        })(this));
      }
    };

    return InstallPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9pbnN0YWxsLXBhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUtBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQXNDLE9BQUEsQ0FBUSxzQkFBUixDQUF0QyxFQUFDLFNBQUQsRUFBSSxXQUFKLEVBQVEsbUNBQVIsRUFBd0I7O0VBQ3ZCLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFFeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxNQUFBLEdBQVMsT0FBQSxDQUFRLGtCQUFSOztFQUNULFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFDWixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFFakIsZ0JBQUEsR0FBbUI7O0VBQ25CLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGlCQUFSOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osWUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtPQUFMLEVBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQkFBUDtXQUFMLEVBQWdDLFNBQUE7bUJBQzlCLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO2FBQUwsRUFBaUMsU0FBQTtjQUMvQixL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QUFSLENBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRCxFQUFRLFFBQVI7WUFDdkIsSUFBRyxLQUFIO3FCQUNFLE1BQUEsQ0FBTyxLQUFQLEVBREY7YUFBQSxNQUFBO2NBR0UsS0FBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFBO2NBQ0EsS0FBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixtQkFBdEI7cUJBQ0EsS0FBQyxDQUFBLGVBQUQsQ0FBaUIsS0FBQyxDQUFBLGlCQUFsQixFQUFxQyxRQUFyQyxFQUxGOztVQUR1QjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekIsRUFWRjs7SUFuQm9COzs7O0tBN01HO0FBaEIzQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xueyQsICQkLCBUZXh0RWRpdG9yVmlldywgU2Nyb2xsVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cblBhY2thZ2VDYXJkID0gcmVxdWlyZSAnLi9wYWNrYWdlLWNhcmQnXG5DbGllbnQgPSByZXF1aXJlICcuL2F0b20taW8tY2xpZW50J1xuRXJyb3JWaWV3ID0gcmVxdWlyZSAnLi9lcnJvci12aWV3J1xuUGFja2FnZU1hbmFnZXIgPSByZXF1aXJlICcuL3BhY2thZ2UtbWFuYWdlcidcblxuUGFja2FnZU5hbWVSZWdleCA9IC9jb25maWdcXC9pbnN0YWxsXFwvKHBhY2thZ2V8dGhlbWUpOihbYS16MC05LV9dKykvaVxuaG9zdGVkR2l0SW5mbyA9IHJlcXVpcmUgJ2hvc3RlZC1naXQtaW5mbydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSW5zdGFsbFBhbmVsIGV4dGVuZHMgU2Nyb2xsVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAncGFuZWxzLWl0ZW0nLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24gcGFja2FnZXMnLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1jb250YWluZXInLCA9PlxuICAgICAgICAgIEBoMSBvdXRsZXQ6ICdpbnN0YWxsSGVhZGluZycsIGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1wbHVzJywgJ0luc3RhbGwgUGFja2FnZXMnXG5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGV4dCBuYXRpdmUta2V5LWJpbmRpbmdzJywgdGFiaW5kZXg6IC0xLCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpY29uIGljb24tcXVlc3Rpb24nXG4gICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdwdWJsaXNoZWRUb1RleHQnLCAnUGFja2FnZXMgYXJlIHB1Ymxpc2hlZCB0byAnXG4gICAgICAgICAgICBAYSBjbGFzczogJ2xpbmsnLCBvdXRsZXQ6IFwib3BlbkF0b21Jb1wiLCBcImF0b20uaW9cIlxuICAgICAgICAgICAgQHNwYW4gXCIgYW5kIGFyZSBpbnN0YWxsZWQgdG8gI3twYXRoLmpvaW4ocHJvY2Vzcy5lbnYuQVRPTV9IT01FLCAncGFja2FnZXMnKX1cIlxuXG4gICAgICAgICAgQGRpdiBjbGFzczogJ3NlYXJjaC1jb250YWluZXIgY2xlYXJmaXgnLCA9PlxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2VkaXRvci1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgICBAc3VidmlldyAnc2VhcmNoRWRpdG9yVmlldycsIG5ldyBUZXh0RWRpdG9yVmlldyhtaW5pOiB0cnVlKVxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2J0bi1ncm91cCcsID0+XG4gICAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAnc2VhcmNoUGFja2FnZXNCdXR0b24nLCBjbGFzczogJ2J0biBidG4tZGVmYXVsdCBzZWxlY3RlZCcsICdQYWNrYWdlcydcbiAgICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdzZWFyY2hUaGVtZXNCdXR0b24nLCBjbGFzczogJ2J0biBidG4tZGVmYXVsdCcsICdUaGVtZXMnXG5cbiAgICAgICAgICBAZGl2IG91dGxldDogJ3NlYXJjaEVycm9ycydcbiAgICAgICAgICBAZGl2IG91dGxldDogJ3NlYXJjaE1lc3NhZ2UnLCBjbGFzczogJ2FsZXJ0IGFsZXJ0LWluZm8gc2VhcmNoLW1lc3NhZ2UgaWNvbiBpY29uLXNlYXJjaCdcbiAgICAgICAgICBAZGl2IG91dGxldDogJ3Jlc3VsdHNDb250YWluZXInLCBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcidcblxuICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24gcGFja2FnZXMnLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1jb250YWluZXInLCA9PlxuICAgICAgICAgIEBkaXYgb3V0bGV0OiAnZmVhdHVyZWRIZWFkaW5nJywgY2xhc3M6ICdzZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLXN0YXInXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdmZWF0dXJlZEVycm9ycydcbiAgICAgICAgICBAZGl2IG91dGxldDogJ2xvYWRpbmdNZXNzYWdlJywgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGljb24gaWNvbi1ob3VyZ2xhc3MnXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdmZWF0dXJlZENvbnRhaW5lcicsIGNsYXNzOiAnY29udGFpbmVyIHBhY2thZ2UtY29udGFpbmVyJ1xuXG4gIGluaXRpYWxpemU6IChAcGFja2FnZU1hbmFnZXIpIC0+XG4gICAgc3VwZXJcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgY2xpZW50ID0gJCgnLnNldHRpbmdzLXZpZXcnKS52aWV3KCk/LmNsaWVudFxuICAgIEBjbGllbnQgPSBAcGFja2FnZU1hbmFnZXIuZ2V0Q2xpZW50KClcbiAgICBAYXRvbUlvVVJMID0gJ2h0dHBzOi8vYXRvbS5pby9wYWNrYWdlcydcbiAgICBAb3BlbkF0b21Jby5vbiAnY2xpY2snLCA9PlxuICAgICAgcmVxdWlyZSgnZWxlY3Ryb24nKS5zaGVsbC5vcGVuRXh0ZXJuYWwoQGF0b21Jb1VSTClcbiAgICAgIGZhbHNlXG5cbiAgICBAc2VhcmNoTWVzc2FnZS5oaWRlKClcblxuICAgIEBzZWFyY2hFZGl0b3JWaWV3LmdldE1vZGVsKCkuc2V0UGxhY2Vob2xkZXJUZXh0KCdTZWFyY2ggcGFja2FnZXMnKVxuICAgIEBzZWFyY2hUeXBlID0gJ3BhY2thZ2VzJ1xuICAgIEBoYW5kbGVTZWFyY2hFdmVudHMoKVxuXG4gICAgQGxvYWRGZWF0dXJlZFBhY2thZ2VzKClcblxuICBkaXNwb3NlOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBmb2N1czogLT5cbiAgICBAc2VhcmNoRWRpdG9yVmlldy5mb2N1cygpXG5cbiAgaGFuZGxlU2VhcmNoRXZlbnRzOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICdwYWNrYWdlLWluc3RhbGwtZmFpbGVkJywgKHtwYWNrLCBlcnJvcn0pID0+XG4gICAgICBAc2VhcmNoRXJyb3JzLmFwcGVuZChuZXcgRXJyb3JWaWV3KEBwYWNrYWdlTWFuYWdlciwgZXJyb3IpKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAcGFja2FnZU1hbmFnZXIub24gJ3BhY2thZ2UtaW5zdGFsbGVkIHRoZW1lLWluc3RhbGxlZCcsICh7cGFja30pID0+XG4gICAgICBnaXRVcmxJbmZvID0gQGN1cnJlbnRHaXRQYWNrYWdlQ2FyZD8ucGFjaz8uZ2l0VXJsSW5mb1xuICAgICAgaWYgZ2l0VXJsSW5mbz8gYW5kIGdpdFVybEluZm8gaXMgcGFjay5naXRVcmxJbmZvXG4gICAgICAgIEB1cGRhdGVHaXRQYWNrYWdlQ2FyZChwYWNrKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAc2VhcmNoRWRpdG9yVmlldy5lbGVtZW50LCAnY29yZTpjb25maXJtJywgPT5cbiAgICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICAgIEBzZWFyY2hQYWNrYWdlc0J1dHRvbi5vbiAnY2xpY2snLCA9PlxuICAgICAgQHNldFNlYXJjaFR5cGUoJ3BhY2thZ2UnKSB1bmxlc3MgQHNlYXJjaFBhY2thZ2VzQnV0dG9uLmhhc0NsYXNzKCdzZWxlY3RlZCcpXG4gICAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiAgICBAc2VhcmNoVGhlbWVzQnV0dG9uLm9uICdjbGljaycsID0+XG4gICAgICBAc2V0U2VhcmNoVHlwZSgndGhlbWUnKSB1bmxlc3MgQHNlYXJjaFRoZW1lc0J1dHRvbi5oYXNDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIHNldFNlYXJjaFR5cGU6IChzZWFyY2hUeXBlKSAtPlxuICAgIGlmIHNlYXJjaFR5cGUgaXMgJ3RoZW1lJ1xuICAgICAgQHNlYXJjaFR5cGUgPSAndGhlbWVzJ1xuICAgICAgQHNlYXJjaFRoZW1lc0J1dHRvbi5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgQHNlYXJjaFBhY2thZ2VzQnV0dG9uLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXG4gICAgICBAc2VhcmNoRWRpdG9yVmlldy5nZXRNb2RlbCgpLnNldFBsYWNlaG9sZGVyVGV4dCgnU2VhcmNoIHRoZW1lcycpXG4gICAgICBAcHVibGlzaGVkVG9UZXh0LnRleHQoJ1RoZW1lcyBhcmUgcHVibGlzaGVkIHRvICcpXG4gICAgICBAYXRvbUlvVVJMID0gJ2h0dHBzOi8vYXRvbS5pby90aGVtZXMnXG4gICAgICBAbG9hZEZlYXR1cmVkUGFja2FnZXModHJ1ZSlcbiAgICBlbHNlIGlmIHNlYXJjaFR5cGUgaXMgJ3BhY2thZ2UnXG4gICAgICBAc2VhcmNoVHlwZSA9ICdwYWNrYWdlcydcbiAgICAgIEBzZWFyY2hQYWNrYWdlc0J1dHRvbi5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgQHNlYXJjaFRoZW1lc0J1dHRvbi5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgQHNlYXJjaEVkaXRvclZpZXcuZ2V0TW9kZWwoKS5zZXRQbGFjZWhvbGRlclRleHQoJ1NlYXJjaCBwYWNrYWdlcycpXG4gICAgICBAcHVibGlzaGVkVG9UZXh0LnRleHQoJ1BhY2thZ2VzIGFyZSBwdWJsaXNoZWQgdG8gJylcbiAgICAgIEBhdG9tSW9VUkwgPSAnaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzJ1xuICAgICAgQGxvYWRGZWF0dXJlZFBhY2thZ2VzKClcblxuICBiZWZvcmVTaG93OiAob3B0aW9ucykgLT5cbiAgICByZXR1cm4gdW5sZXNzIG9wdGlvbnM/LnVyaT9cbiAgICBxdWVyeSA9IEBleHRyYWN0UXVlcnlGcm9tVVJJKG9wdGlvbnMudXJpKVxuICAgIGlmIHF1ZXJ5P1xuICAgICAge3NlYXJjaFR5cGUsIHBhY2thZ2VOYW1lfSA9IHF1ZXJ5XG4gICAgICBAc2V0U2VhcmNoVHlwZShzZWFyY2hUeXBlKVxuICAgICAgQHNlYXJjaEVkaXRvclZpZXcuc2V0VGV4dChwYWNrYWdlTmFtZSlcbiAgICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICBleHRyYWN0UXVlcnlGcm9tVVJJOiAodXJpKSAtPlxuICAgIG1hdGNoZXMgPSBQYWNrYWdlTmFtZVJlZ2V4LmV4ZWModXJpKVxuICAgIGlmIG1hdGNoZXM/XG4gICAgICBbX18sIHNlYXJjaFR5cGUsIHBhY2thZ2VOYW1lXSA9IG1hdGNoZXNcbiAgICAgIHtzZWFyY2hUeXBlLCBwYWNrYWdlTmFtZX1cbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgcGVyZm9ybVNlYXJjaDogLT5cbiAgICBpZiBxdWVyeSA9IEBzZWFyY2hFZGl0b3JWaWV3LmdldFRleHQoKS50cmltKCkudG9Mb3dlckNhc2UoKVxuICAgICAgQHBlcmZvcm1TZWFyY2hGb3JRdWVyeShxdWVyeSlcblxuICBwZXJmb3JtU2VhcmNoRm9yUXVlcnk6IChxdWVyeSkgLT5cbiAgICBpZiBnaXRVcmxJbmZvID0gaG9zdGVkR2l0SW5mby5mcm9tVXJsKHF1ZXJ5KVxuICAgICAgdHlwZSA9IGdpdFVybEluZm8uZGVmYXVsdFxuICAgICAgaWYgdHlwZSBpcyAnc3NodXJsJyBvciB0eXBlIGlzICdodHRwcycgb3IgdHlwZSBpcyAnc2hvcnRjdXQnXG4gICAgICAgIEBzaG93R2l0SW5zdGFsbFBhY2thZ2VDYXJkKG5hbWU6IHF1ZXJ5LCBnaXRVcmxJbmZvOiBnaXRVcmxJbmZvKVxuICAgIGVsc2VcbiAgICAgIEBzZWFyY2gocXVlcnkpXG5cbiAgc2hvd0dpdEluc3RhbGxQYWNrYWdlQ2FyZDogKHBhY2spIC0+XG4gICAgQGN1cnJlbnRHaXRQYWNrYWdlQ2FyZD8uZGlzcG9zZSgpXG4gICAgQGN1cnJlbnRHaXRQYWNrYWdlQ2FyZCA9IEBnZXRQYWNrYWdlQ2FyZFZpZXcocGFjaylcbiAgICBAY3VycmVudEdpdFBhY2thZ2VDYXJkLmRpc3BsYXlHaXRQYWNrYWdlSW5zdGFsbEluZm9ybWF0aW9uKClcbiAgICBAcmVwbGFjZUN1cnJlbnRHaXRQYWNrYWdlQ2FyZFZpZXcoKVxuXG4gIHVwZGF0ZUdpdFBhY2thZ2VDYXJkOiAocGFjaykgLT5cbiAgICBAY3VycmVudEdpdFBhY2thZ2VDYXJkLmRpc3Bvc2UoKVxuICAgIEBjdXJyZW50R2l0UGFja2FnZUNhcmQgPSBAZ2V0UGFja2FnZUNhcmRWaWV3KHBhY2spXG4gICAgQHJlcGxhY2VDdXJyZW50R2l0UGFja2FnZUNhcmRWaWV3KClcblxuICByZXBsYWNlQ3VycmVudEdpdFBhY2thZ2VDYXJkVmlldzogLT5cbiAgICBAcmVzdWx0c0NvbnRhaW5lci5lbXB0eSgpXG4gICAgQGFkZFBhY2thZ2VDYXJkVmlldyhAcmVzdWx0c0NvbnRhaW5lciwgQGN1cnJlbnRHaXRQYWNrYWdlQ2FyZClcblxuICBzZWFyY2g6IChxdWVyeSkgLT5cbiAgICBAcmVzdWx0c0NvbnRhaW5lci5lbXB0eSgpXG4gICAgQHNlYXJjaE1lc3NhZ2UudGV4dChcIlNlYXJjaGluZyAje0BzZWFyY2hUeXBlfSBmb3IgXFx1MjAxQyN7cXVlcnl9XFx1MjAxRFxcdTIwMjZcIikuc2hvdygpXG5cbiAgICBvcHRzID0ge31cbiAgICBvcHRzW0BzZWFyY2hUeXBlXSA9IHRydWVcbiAgICBvcHRzWydzb3J0QnknXSA9IFwiZG93bmxvYWRzXCJcblxuICAgIEBwYWNrYWdlTWFuYWdlci5zZWFyY2gocXVlcnksIG9wdHMpXG4gICAgICAudGhlbiAocGFja2FnZXM9W10pID0+XG4gICAgICAgIEByZXN1bHRzQ29udGFpbmVyLmVtcHR5KClcbiAgICAgICAgcGFja2FnZXNcbiAgICAgIC50aGVuIChwYWNrYWdlcz1bXSkgPT5cbiAgICAgICAgQHNlYXJjaE1lc3NhZ2UuaGlkZSgpXG4gICAgICAgIEBzaG93Tm9SZXN1bHRNZXNzYWdlIGlmIHBhY2thZ2VzLmxlbmd0aCBpcyAwXG4gICAgICAgIHBhY2thZ2VzXG4gICAgICAudGhlbiAocGFja2FnZXM9W10pID0+XG4gICAgICAgIEBoaWdobGlnaHRFeGFjdE1hdGNoKEByZXN1bHRzQ29udGFpbmVyLCBxdWVyeSwgcGFja2FnZXMpXG4gICAgICAudGhlbiAocGFja2FnZXM9W10pID0+XG4gICAgICAgIEBhZGRDbG9zZU1hdGNoZXMoQHJlc3VsdHNDb250YWluZXIsIHF1ZXJ5LCBwYWNrYWdlcylcbiAgICAgIC50aGVuIChwYWNrYWdlcz1bXSkgPT5cbiAgICAgICAgQGFkZFBhY2thZ2VWaWV3cyhAcmVzdWx0c0NvbnRhaW5lciwgcGFja2FnZXMpXG4gICAgICAuY2F0Y2ggKGVycm9yKSA9PlxuICAgICAgICBAc2VhcmNoTWVzc2FnZS5oaWRlKClcbiAgICAgICAgQHNlYXJjaEVycm9ycy5hcHBlbmQobmV3IEVycm9yVmlldyhAcGFja2FnZU1hbmFnZXIsIGVycm9yKSlcblxuICBzaG93Tm9SZXN1bHRNZXNzYWdlOiAtPlxuICAgIEBzZWFyY2hNZXNzYWdlLnRleHQoXCJObyAje0BzZWFyY2hUeXBlLnJlcGxhY2UoL3MkLywgJycpfSByZXN1bHRzIGZvciBcXHUyMDFDI3txdWVyeX1cXHUyMDFEXCIpLnNob3coKVxuXG4gIGhpZ2hsaWdodEV4YWN0TWF0Y2g6IChjb250YWluZXIsIHF1ZXJ5LCBwYWNrYWdlcykgLT5cbiAgICBleGFjdE1hdGNoID0gXy5maWx0ZXIocGFja2FnZXMsIChwa2cpIC0+XG4gICAgICBwa2cubmFtZSBpcyBxdWVyeSlbMF1cblxuICAgIGlmIGV4YWN0TWF0Y2hcbiAgICAgIEBhZGRQYWNrYWdlQ2FyZFZpZXcoY29udGFpbmVyLCBAZ2V0UGFja2FnZUNhcmRWaWV3KGV4YWN0TWF0Y2gpKVxuICAgICAgcGFja2FnZXMuc3BsaWNlKHBhY2thZ2VzLmluZGV4T2YoZXhhY3RNYXRjaCksIDEpXG5cbiAgICBwYWNrYWdlc1xuXG4gIGFkZENsb3NlTWF0Y2hlczogKGNvbnRhaW5lciwgcXVlcnksIHBhY2thZ2VzKSAtPlxuICAgIG1hdGNoZXMgPSBfLmZpbHRlcihwYWNrYWdlcywgKHBrZykgLT4gcGtnLm5hbWUuaW5kZXhPZihxdWVyeSkgPj0gMClcblxuICAgIGZvciBwYWNrIGluIG1hdGNoZXNcbiAgICAgIEBhZGRQYWNrYWdlQ2FyZFZpZXcoY29udGFpbmVyLCBAZ2V0UGFja2FnZUNhcmRWaWV3KHBhY2spKVxuICAgICAgcGFja2FnZXMuc3BsaWNlKHBhY2thZ2VzLmluZGV4T2YocGFjayksIDEpXG5cbiAgICBwYWNrYWdlc1xuXG4gIGFkZFBhY2thZ2VWaWV3czogKGNvbnRhaW5lciwgcGFja2FnZXMpIC0+XG4gICAgZm9yIHBhY2sgaW4gcGFja2FnZXNcbiAgICAgIEBhZGRQYWNrYWdlQ2FyZFZpZXcoY29udGFpbmVyLCBAZ2V0UGFja2FnZUNhcmRWaWV3KHBhY2spKVxuXG4gIGFkZFBhY2thZ2VDYXJkVmlldzogKGNvbnRhaW5lciwgcGFja2FnZUNhcmQpIC0+XG4gICAgcGFja2FnZVJvdyA9ICQkIC0+IEBkaXYgY2xhc3M6ICdyb3cnXG4gICAgY29udGFpbmVyLmFwcGVuZChwYWNrYWdlUm93KVxuICAgIHBhY2thZ2VSb3cuYXBwZW5kKHBhY2thZ2VDYXJkKVxuXG4gIGdldFBhY2thZ2VDYXJkVmlldzogKHBhY2spIC0+XG4gICAgbmV3IFBhY2thZ2VDYXJkKHBhY2ssIEBwYWNrYWdlTWFuYWdlciwgYmFjazogJ0luc3RhbGwnKVxuXG4gIGZpbHRlclBhY2thZ2VzOiAocGFja2FnZXMsIHRoZW1lcykgLT5cbiAgICBwYWNrYWdlcy5maWx0ZXIgKHt0aGVtZX0pIC0+XG4gICAgICBpZiB0aGVtZXNcbiAgICAgICAgdGhlbWVcbiAgICAgIGVsc2VcbiAgICAgICAgbm90IHRoZW1lXG5cbiAgIyBMb2FkIGFuZCBkaXNwbGF5IHRoZSBmZWF0dXJlZCBwYWNrYWdlcyB0aGF0IGFyZSBhdmFpbGFibGUgdG8gaW5zdGFsbC5cbiAgbG9hZEZlYXR1cmVkUGFja2FnZXM6IChsb2FkVGhlbWVzKSAtPlxuICAgIGxvYWRUaGVtZXMgPz0gZmFsc2VcbiAgICBAZmVhdHVyZWRDb250YWluZXIuZW1wdHkoKVxuXG4gICAgaWYgbG9hZFRoZW1lc1xuICAgICAgQGluc3RhbGxIZWFkaW5nLnRleHQgJ0luc3RhbGwgVGhlbWVzJ1xuICAgICAgQGZlYXR1cmVkSGVhZGluZy50ZXh0ICdGZWF0dXJlZCBUaGVtZXMnXG4gICAgICBAbG9hZGluZ01lc3NhZ2UudGV4dCgnTG9hZGluZyBmZWF0dXJlZCB0aGVtZXNcXHUyMDI2JylcbiAgICBlbHNlXG4gICAgICBAaW5zdGFsbEhlYWRpbmcudGV4dCAnSW5zdGFsbCBQYWNrYWdlcydcbiAgICAgIEBmZWF0dXJlZEhlYWRpbmcudGV4dCAnRmVhdHVyZWQgUGFja2FnZXMnXG4gICAgICBAbG9hZGluZ01lc3NhZ2UudGV4dCgnTG9hZGluZyBmZWF0dXJlZCBwYWNrYWdlc1xcdTIwMjYnKVxuXG4gICAgQGxvYWRpbmdNZXNzYWdlLnNob3coKVxuXG4gICAgaGFuZGxlID0gKGVycm9yKSA9PlxuICAgICAgQGxvYWRpbmdNZXNzYWdlLmhpZGUoKVxuICAgICAgQGZlYXR1cmVkRXJyb3JzLmFwcGVuZChuZXcgRXJyb3JWaWV3KEBwYWNrYWdlTWFuYWdlciwgZXJyb3IpKVxuXG4gICAgaWYgbG9hZFRoZW1lc1xuICAgICAgQGNsaWVudC5mZWF0dXJlZFRoZW1lcyAoZXJyb3IsIHRoZW1lcykgPT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICBoYW5kbGUoZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbG9hZGluZ01lc3NhZ2UuaGlkZSgpXG4gICAgICAgICAgQGZlYXR1cmVkSGVhZGluZy50ZXh0ICdGZWF0dXJlZCBUaGVtZXMnXG4gICAgICAgICAgQGFkZFBhY2thZ2VWaWV3cyhAZmVhdHVyZWRDb250YWluZXIsIHRoZW1lcylcblxuICAgIGVsc2VcbiAgICAgIEBjbGllbnQuZmVhdHVyZWRQYWNrYWdlcyAoZXJyb3IsIHBhY2thZ2VzKSA9PlxuICAgICAgICBpZiBlcnJvclxuICAgICAgICAgIGhhbmRsZShlcnJvcilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBsb2FkaW5nTWVzc2FnZS5oaWRlKClcbiAgICAgICAgICBAZmVhdHVyZWRIZWFkaW5nLnRleHQgJ0ZlYXR1cmVkIFBhY2thZ2VzJ1xuICAgICAgICAgIEBhZGRQYWNrYWdlVmlld3MoQGZlYXR1cmVkQ29udGFpbmVyLCBwYWNrYWdlcylcbiJdfQ==
