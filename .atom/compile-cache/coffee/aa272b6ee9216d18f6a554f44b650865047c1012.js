(function() {
  var CompositeDisposable, NORMALIZE_PACKAGE_DATA_README_ERROR, PackageCard, PackageDetailView, PackageGrammarsView, PackageKeymapView, PackageReadmeView, PackageSnippetsView, ScrollView, SettingsPanel, _, fs, path, shell, url,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  url = require('url');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  shell = require('electron').shell;

  ScrollView = require('atom-space-pen-views').ScrollView;

  CompositeDisposable = require('atom').CompositeDisposable;

  PackageCard = require('./package-card');

  PackageGrammarsView = require('./package-grammars-view');

  PackageKeymapView = require('./package-keymap-view');

  PackageReadmeView = require('./package-readme-view');

  PackageSnippetsView = require('./package-snippets-view');

  SettingsPanel = require('./settings-panel');

  NORMALIZE_PACKAGE_DATA_README_ERROR = 'ERROR: No README data found!';

  module.exports = PackageDetailView = (function(superClass) {
    extend(PackageDetailView, superClass);

    function PackageDetailView() {
      return PackageDetailView.__super__.constructor.apply(this, arguments);
    }

    PackageDetailView.content = function(pack, packageManager) {
      return this.div({
        tabindex: 0,
        "class": 'package-detail panels-item'
      }, (function(_this) {
        return function() {
          _this.ol({
            outlet: 'breadcrumbContainer',
            "class": 'native-key-bindings breadcrumb',
            tabindex: -1
          }, function() {
            _this.li(function() {
              return _this.a({
                outlet: 'breadcrumb'
              });
            });
            return _this.li({
              "class": 'active'
            }, function() {
              return _this.a({
                outlet: 'title'
              });
            });
          });
          _this.section({
            "class": 'section'
          }, function() {
            return _this.form({
              "class": 'section-container package-detail-view'
            }, function() {
              _this.div({
                "class": 'container package-container'
              }, function() {
                return _this.div({
                  outlet: 'packageCardParent',
                  "class": 'row'
                }, function() {
                  if ((pack != null ? pack.metadata : void 0) && pack.metadata.owner) {
                    return _this.subview('packageCard', new PackageCard(pack.metadata, packageManager, {
                      onSettingsView: true
                    }));
                  } else {
                    _this.div({
                      outlet: 'loadingMessage',
                      "class": 'alert alert-info icon icon-hourglass'
                    }, "Loading " + pack.name + "\u2026");
                    return _this.div({
                      outlet: 'errorMessage',
                      "class": 'alert alert-danger icon icon-hourglass hidden'
                    }, "Failed to load " + pack.name + " - try again later.");
                  }
                });
              });
              _this.p({
                outlet: 'packageRepo',
                "class": 'link icon icon-repo repo-link hidden'
              });
              _this.p({
                outlet: 'startupTime',
                "class": 'text icon icon-dashboard hidden',
                tabindex: -1
              });
              _this.div({
                outlet: 'buttons',
                "class": 'btn-wrap-group hidden'
              }, function() {
                _this.button({
                  outlet: 'learnMoreButton',
                  "class": 'btn btn-default icon icon-link'
                }, 'View on Atom.io');
                _this.button({
                  outlet: 'issueButton',
                  "class": 'btn btn-default icon icon-bug'
                }, 'Report Issue');
                _this.button({
                  outlet: 'changelogButton',
                  "class": 'btn btn-default icon icon-squirrel'
                }, 'CHANGELOG');
                _this.button({
                  outlet: 'licenseButton',
                  "class": 'btn btn-default icon icon-law'
                }, 'LICENSE');
                return _this.button({
                  outlet: 'openButton',
                  "class": 'btn btn-default icon icon-link-external'
                }, 'View Code');
              });
              return _this.div({
                outlet: 'errors'
              });
            });
          });
          return _this.div({
            outlet: 'sections'
          });
        };
      })(this));
    };

    PackageDetailView.prototype.initialize = function(pack1, packageManager1, snippetsProvider) {
      this.pack = pack1;
      this.packageManager = packageManager1;
      this.snippetsProvider = snippetsProvider;
      PackageDetailView.__super__.initialize.apply(this, arguments);
      this.disposables = new CompositeDisposable();
      this.loadPackage();
      return this.handleButtonEvents();
    };

    PackageDetailView.prototype.completeInitialzation = function() {
      if (!this.packageCard) {
        this.packageCard = new PackageCard(this.pack.metadata, this.packageManager, {
          onSettingsView: true
        });
        this.loadingMessage.replaceWith(this.packageCard);
      }
      this.packageRepo.removeClass('hidden');
      this.startupTime.removeClass('hidden');
      this.buttons.removeClass('hidden');
      this.activateConfig();
      this.populate();
      this.updateFileButtons();
      this.subscribeToPackageManager();
      return this.renderReadme();
    };

    PackageDetailView.prototype.loadPackage = function() {
      var loadedPackage;
      if (loadedPackage = atom.packages.getLoadedPackage(this.pack.name)) {
        this.pack = loadedPackage;
        return this.completeInitialzation();
      } else {
        if (!((this.pack.metadata != null) && this.pack.metadata.owner)) {
          return this.fetchPackage();
        } else {
          return this.completeInitialzation();
        }
      }
    };

    PackageDetailView.prototype.fetchPackage = function() {
      this.showLoadingMessage();
      return this.packageManager.getClient()["package"](this.pack.name, (function(_this) {
        return function(err, packageData) {
          var ref;
          if (err || !((packageData != null ? packageData.name : void 0) != null)) {
            _this.hideLoadingMessage();
            return _this.showErrorMessage();
          } else {
            _this.pack = packageData;
            _this.pack.metadata = _.extend((ref = _this.pack.metadata) != null ? ref : {}, _this.pack);
            return _this.completeInitialzation();
          }
        };
      })(this));
    };

    PackageDetailView.prototype.showLoadingMessage = function() {
      return this.loadingMessage.removeClass('hidden');
    };

    PackageDetailView.prototype.hideLoadingMessage = function() {
      return this.loadingMessage.addClass('hidden');
    };

    PackageDetailView.prototype.showErrorMessage = function() {
      return this.errorMessage.removeClass('hidden');
    };

    PackageDetailView.prototype.hideErrorMessage = function() {
      return this.errorMessage.addClass('hidden');
    };

    PackageDetailView.prototype.activateConfig = function() {
      if (atom.packages.isPackageLoaded(this.pack.name) && !atom.packages.isPackageActive(this.pack.name)) {
        return this.pack.activateConfig();
      }
    };

    PackageDetailView.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    PackageDetailView.prototype.beforeShow = function(opts) {
      if (opts.back == null) {
        opts.back = 'Install';
      }
      return this.breadcrumb.text(opts.back).on('click', (function(_this) {
        return function() {
          var ref;
          return (ref = _this.parents('.settings-view').view()) != null ? ref.showPanel(opts.back) : void 0;
        };
      })(this));
    };

    PackageDetailView.prototype.populate = function() {
      var repoName, repoUrl;
      this.title.text("" + (_.undasherize(_.uncamelcase(this.pack.name))));
      this.type = this.pack.metadata.theme ? 'theme' : 'package';
      if (repoUrl = this.packageManager.getRepositoryUrl(this.pack)) {
        repoName = url.parse(repoUrl).pathname;
        this.packageRepo.text(repoName.substring(1)).show();
      } else {
        this.packageRepo.hide();
      }
      return this.updateInstalledState();
    };

    PackageDetailView.prototype.updateInstalledState = function() {
      this.sections.empty();
      this.updateFileButtons();
      this.activateConfig();
      this.startupTime.hide();
      if (atom.packages.isPackageLoaded(this.pack.name)) {
        if (!atom.packages.isPackageDisabled(this.pack.name)) {
          this.sections.append(new SettingsPanel(this.pack.name, {
            includeTitle: false
          }));
          this.sections.append(new PackageKeymapView(this.pack));
          if (this.pack.path) {
            this.sections.append(new PackageGrammarsView(this.pack.path));
            this.sections.append(new PackageSnippetsView(this.pack.path, this.snippetsProvider));
          }
          this.startupTime.html("This " + this.type + " added <span class='highlight'>" + (this.getStartupTime()) + "ms</span> to startup time.");
          this.startupTime.show();
        } else {
          this.openButton.hide();
        }
      }
      if (atom.packages.isBundledPackage(this.pack.name)) {
        this.openButton.hide();
      }
      return this.renderReadme();
    };

    PackageDetailView.prototype.renderReadme = function() {
      var readme, readmeView;
      if (this.pack.metadata.readme && this.pack.metadata.readme.trim() !== NORMALIZE_PACKAGE_DATA_README_ERROR) {
        readme = this.pack.metadata.readme;
      } else {
        readme = null;
      }
      if (this.readmePath && !readme) {
        readme = fs.readFileSync(this.readmePath, {
          encoding: 'utf8'
        });
      }
      readmeView = new PackageReadmeView(readme);
      if (this.readmeSection) {
        return this.readmeSection.replaceWith(readmeView);
      } else {
        this.readmeSection = readmeView;
        return this.sections.append(readmeView);
      }
    };

    PackageDetailView.prototype.subscribeToPackageManager = function() {
      this.disposables.add(this.packageManager.on('theme-installed package-installed', (function(_this) {
        return function(arg) {
          var pack;
          pack = arg.pack;
          if (_this.pack.name !== pack.name) {
            return;
          }
          _this.loadPackage();
          return _this.updateInstalledState();
        };
      })(this)));
      this.disposables.add(this.packageManager.on('theme-uninstalled package-uninstalled', (function(_this) {
        return function(arg) {
          var pack;
          pack = arg.pack;
          if (_this.pack.name === pack.name) {
            return _this.updateInstalledState();
          }
        };
      })(this)));
      return this.disposables.add(this.packageManager.on('theme-updated package-updated', (function(_this) {
        return function(arg) {
          var pack;
          pack = arg.pack;
          if (_this.pack.name !== pack.name) {
            return;
          }
          _this.loadPackage();
          _this.updateFileButtons();
          return _this.populate();
        };
      })(this)));
    };

    PackageDetailView.prototype.handleButtonEvents = function() {
      this.packageRepo.on('click', (function(_this) {
        return function() {
          var repoUrl;
          if (repoUrl = _this.packageManager.getRepositoryUrl(_this.pack)) {
            shell.openExternal(repoUrl);
          }
          return false;
        };
      })(this));
      this.issueButton.on('click', (function(_this) {
        return function() {
          var repoUrl;
          if (repoUrl = _this.packageManager.getRepositoryUrl(_this.pack)) {
            shell.openExternal(repoUrl + "/issues/new");
          }
          return false;
        };
      })(this));
      this.changelogButton.on('click', (function(_this) {
        return function() {
          if (_this.changelogPath) {
            _this.openMarkdownFile(_this.changelogPath);
          }
          return false;
        };
      })(this));
      this.licenseButton.on('click', (function(_this) {
        return function() {
          if (_this.licensePath) {
            _this.openMarkdownFile(_this.licensePath);
          }
          return false;
        };
      })(this));
      this.openButton.on('click', (function(_this) {
        return function() {
          if (fs.existsSync(_this.pack.path)) {
            atom.open({
              pathsToOpen: [_this.pack.path]
            });
          }
          return false;
        };
      })(this));
      return this.learnMoreButton.on('click', (function(_this) {
        return function() {
          shell.openExternal("https://atom.io/packages/" + _this.pack.name);
          return false;
        };
      })(this));
    };

    PackageDetailView.prototype.openMarkdownFile = function(path) {
      if (atom.packages.isPackageActive('markdown-preview')) {
        return atom.workspace.open(encodeURI("markdown-preview://" + path));
      } else {
        return atom.workspace.open(path);
      }
    };

    PackageDetailView.prototype.updateFileButtons = function() {
      var child, i, len, ref;
      this.changelogPath = null;
      this.licensePath = null;
      this.readmePath = null;
      ref = fs.listSync(this.pack.path);
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        switch (path.basename(child, path.extname(child)).toLowerCase()) {
          case 'changelog':
          case 'history':
            this.changelogPath = child;
            break;
          case 'license':
          case 'licence':
            this.licensePath = child;
            break;
          case 'readme':
            this.readmePath = child;
        }
        if (this.readmePath && this.changelogPath && this.licensePath) {
          break;
        }
      }
      if (this.changelogPath) {
        this.changelogButton.show();
      } else {
        this.changelogButton.hide();
      }
      if (this.licensePath) {
        return this.licenseButton.show();
      } else {
        return this.licenseButton.hide();
      }
    };

    PackageDetailView.prototype.getStartupTime = function() {
      var activateTime, loadTime, ref, ref1;
      loadTime = (ref = this.pack.loadTime) != null ? ref : 0;
      activateTime = (ref1 = this.pack.activateTime) != null ? ref1 : 0;
      return loadTime + activateTime;
    };

    PackageDetailView.prototype.isInstalled = function() {
      return atom.packages.isPackageLoaded(this.pack.name) && !atom.packages.isPackageDisabled(this.pack.name);
    };

    return PackageDetailView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLWRldGFpbC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNE5BQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEdBQUEsR0FBTSxPQUFBLENBQVEsS0FBUjs7RUFFTixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDSixRQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULGFBQWMsT0FBQSxDQUFRLHNCQUFSOztFQUNkLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFFeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVI7O0VBQ3RCLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSx1QkFBUjs7RUFDcEIsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLHVCQUFSOztFQUNwQixtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVI7O0VBQ3RCLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUVoQixtQ0FBQSxHQUFzQzs7RUFFdEMsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUVKLGlCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsSUFBRCxFQUFPLGNBQVA7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsUUFBQSxFQUFVLENBQVY7UUFBYSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDRCQUFwQjtPQUFMLEVBQXVELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNyRCxLQUFDLENBQUEsRUFBRCxDQUFJO1lBQUEsTUFBQSxFQUFRLHFCQUFSO1lBQStCLENB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QUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBQSxFQUFoRDs7SUFkaUI7O2dDQWdCbkIsY0FBQSxHQUFnQixTQUFBO0FBQ2QsVUFBQTtNQUFBLFFBQUEsOENBQTRCO01BQzVCLFlBQUEsb0RBQW9DO2FBQ3BDLFFBQUEsR0FBVztJQUhHOztnQ0FLaEIsV0FBQSxHQUFhLFNBQUE7YUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFwQyxDQUFBLElBQThDLENBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBZCxDQUFnQyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQXRDO0lBRHZDOzs7O0tBdk9pQjtBQW5CaEMiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbnVybCA9IHJlcXVpcmUgJ3VybCdcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntzaGVsbH0gPSByZXF1aXJlICdlbGVjdHJvbidcbntTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuUGFja2FnZUNhcmQgPSByZXF1aXJlICcuL3BhY2thZ2UtY2FyZCdcblBhY2thZ2VHcmFtbWFyc1ZpZXcgPSByZXF1aXJlICcuL3BhY2thZ2UtZ3JhbW1hcnMtdmlldydcblBhY2thZ2VLZXltYXBWaWV3ID0gcmVxdWlyZSAnLi9wYWNrYWdlLWtleW1hcC12aWV3J1xuUGFja2FnZVJlYWRtZVZpZXcgPSByZXF1aXJlICcuL3BhY2thZ2UtcmVhZG1lLXZpZXcnXG5QYWNrYWdlU25pcHBldHNWaWV3ID0gcmVxdWlyZSAnLi9wYWNrYWdlLXNuaXBwZXRzLXZpZXcnXG5TZXR0aW5nc1BhbmVsID0gcmVxdWlyZSAnLi9zZXR0aW5ncy1wYW5lbCdcblxuTk9STUFMSVpFX1BBQ0tBR0VfREFUQV9SRUFETUVfRVJST1IgPSAnRVJST1I6IE5vIFJFQURNRSBkYXRhIGZvdW5kISdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZURldGFpbFZpZXcgZXh0ZW5kcyBTY3JvbGxWaWV3XG5cbiAgQGNvbnRlbnQ6IChwYWNrLCBwYWNrYWdlTWFuYWdlcikgLT5cbiAgICBAZGl2IHRhYmluZGV4OiAwLCBjbGFzczogJ3BhY2thZ2UtZGV0YWlsIHBhbmVscy1pdGVtJywgPT5cbiAgICAgIEBvbCBvdXRsZXQ6ICdicmVhZGNydW1iQ29udGFpbmVyJywgY2xhc3M6ICduYXRpdmUta2V5LWJpbmRpbmdzIGJyZWFkY3J1bWInLCB0YWJpbmRleDogLTEsID0+XG4gICAgICAgIEBsaSA9PlxuICAgICAgICAgIEBhIG91dGxldDogJ2JyZWFkY3J1bWInXG4gICAgICAgIEBsaSBjbGFzczogJ2FjdGl2ZScsID0+XG4gICAgICAgICAgQGEgb3V0bGV0OiAndGl0bGUnXG5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnc2VjdGlvbicsID0+XG4gICAgICAgIEBmb3JtIGNsYXNzOiAnc2VjdGlvbi1jb250YWluZXIgcGFja2FnZS1kZXRhaWwtdmlldycsID0+XG4gICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRhaW5lciBwYWNrYWdlLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICBAZGl2IG91dGxldDogJ3BhY2thZ2VDYXJkUGFyZW50JywgY2xhc3M6ICdyb3cnLCA9PlxuICAgICAgICAgICAgICAjIFBhY2thZ2VzIHRoYXQgbmVlZCB0byBiZSBmZXRjaGVkIHdpbGwgKm9ubHkqIGhhdmUgYG5hbWVgIHNldFxuICAgICAgICAgICAgICBpZiBwYWNrPy5tZXRhZGF0YSBhbmQgcGFjay5tZXRhZGF0YS5vd25lclxuICAgICAgICAgICAgICAgIEBzdWJ2aWV3ICdwYWNrYWdlQ2FyZCcsIG5ldyBQYWNrYWdlQ2FyZChwYWNrLm1ldGFkYXRhLCBwYWNrYWdlTWFuYWdlciwgb25TZXR0aW5nc1ZpZXc6IHRydWUpXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAZGl2IG91dGxldDogJ2xvYWRpbmdNZXNzYWdlJywgY2xhc3M6ICdhbGVydCBhbGVydC1pbmZvIGljb24gaWNvbi1ob3VyZ2xhc3MnLCBcIkxvYWRpbmcgI3twYWNrLm5hbWV9XFx1MjAyNlwiXG5cbiAgICAgICAgICAgICAgICBAZGl2IG91dGxldDogJ2Vycm9yTWVzc2FnZScsIGNsYXNzOiAnYWxlcnQgYWxlcnQtZGFuZ2VyIGljb24gaWNvbi1ob3VyZ2xhc3MgaGlkZGVuJywgXCJGYWlsZWQgdG8gbG9hZCAje3BhY2submFtZX0gLSB0cnkgYWdhaW4gbGF0ZXIuXCJcblxuXG4gICAgICAgICAgQHAgb3V0bGV0OiAncGFja2FnZVJlcG8nLCBjbGFzczogJ2xpbmsgaWNvbiBpY29uLXJlcG8gcmVwby1saW5rIGhpZGRlbidcbiAgICAgICAgICBAcCBvdXRsZXQ6ICdzdGFydHVwVGltZScsIGNsYXNzOiAndGV4dCBpY29uIGljb24tZGFzaGJvYXJkIGhpZGRlbicsIHRhYmluZGV4OiAtMVxuXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdidXR0b25zJywgY2xhc3M6ICdidG4td3JhcC1ncm91cCBoaWRkZW4nLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdsZWFybk1vcmVCdXR0b24nLCBjbGFzczogJ2J0biBidG4tZGVmYXVsdCBpY29uIGljb24tbGluaycsICdWaWV3IG9uIEF0b20uaW8nXG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2lzc3VlQnV0dG9uJywgY2xhc3M6ICdidG4gYnRuLWRlZmF1bHQgaWNvbiBpY29uLWJ1ZycsICdSZXBvcnQgSXNzdWUnXG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2NoYW5nZWxvZ0J1dHRvbicsIGNsYXNzOiAnYnRuIGJ0bi1kZWZhdWx0IGljb24gaWNvbi1zcXVpcnJlbCcsICdDSEFOR0VMT0cnXG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2xpY2Vuc2VCdXR0b24nLCBjbGFzczogJ2J0biBidG4tZGVmYXVsdCBpY29uIGljb24tbGF3JywgJ0xJQ0VOU0UnXG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ29wZW5CdXR0b24nLCBjbGFzczogJ2J0biBidG4tZGVmYXVsdCBpY29uIGljb24tbGluay1leHRlcm5hbCcsICdWaWV3IENvZGUnXG5cbiAgICAgICAgICBAZGl2IG91dGxldDogJ2Vycm9ycydcblxuICAgICAgQGRpdiBvdXRsZXQ6ICdzZWN0aW9ucydcblxuICBpbml0aWFsaXplOiAoQHBhY2ssIEBwYWNrYWdlTWFuYWdlciwgQHNuaXBwZXRzUHJvdmlkZXIpIC0+XG4gICAgc3VwZXJcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGxvYWRQYWNrYWdlKClcbiAgICBAaGFuZGxlQnV0dG9uRXZlbnRzKClcblxuICBjb21wbGV0ZUluaXRpYWx6YXRpb246IC0+XG4gICAgdW5sZXNzIEBwYWNrYWdlQ2FyZCAjIEhhZCB0byBsb2FkIHRoaXMgZnJvbSB0aGUgbmV0d29ya1xuICAgICAgQHBhY2thZ2VDYXJkID0gbmV3IFBhY2thZ2VDYXJkKEBwYWNrLm1ldGFkYXRhLCBAcGFja2FnZU1hbmFnZXIsIG9uU2V0dGluZ3NWaWV3OiB0cnVlKVxuICAgICAgQGxvYWRpbmdNZXNzYWdlLnJlcGxhY2VXaXRoKEBwYWNrYWdlQ2FyZClcblxuICAgIEBwYWNrYWdlUmVwby5yZW1vdmVDbGFzcygnaGlkZGVuJylcbiAgICBAc3RhcnR1cFRpbWUucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG4gICAgQGJ1dHRvbnMucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG4gICAgQGFjdGl2YXRlQ29uZmlnKClcbiAgICBAcG9wdWxhdGUoKVxuICAgIEB1cGRhdGVGaWxlQnV0dG9ucygpXG4gICAgQHN1YnNjcmliZVRvUGFja2FnZU1hbmFnZXIoKVxuICAgIEByZW5kZXJSZWFkbWUoKVxuXG4gIGxvYWRQYWNrYWdlOiAtPlxuICAgIGlmIGxvYWRlZFBhY2thZ2UgPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UoQHBhY2submFtZSlcbiAgICAgIEBwYWNrID0gbG9hZGVkUGFja2FnZVxuICAgICAgQGNvbXBsZXRlSW5pdGlhbHphdGlvbigpXG4gICAgZWxzZVxuICAgICAgIyBJZiB0aGUgcGFja2FnZSBtZXRhZGF0YSBpbiBgQHBhY2tgIGlzbid0IGNvbXBsZXRlLCBoaXQgdGhlIG5ldHdvcmsuXG4gICAgICB1bmxlc3MgQHBhY2subWV0YWRhdGE/IGFuZCBAcGFjay5tZXRhZGF0YS5vd25lclxuICAgICAgICBAZmV0Y2hQYWNrYWdlKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGNvbXBsZXRlSW5pdGlhbHphdGlvbigpXG5cbiAgZmV0Y2hQYWNrYWdlOiAtPlxuICAgIEBzaG93TG9hZGluZ01lc3NhZ2UoKVxuICAgIEBwYWNrYWdlTWFuYWdlci5nZXRDbGllbnQoKS5wYWNrYWdlIEBwYWNrLm5hbWUsIChlcnIsIHBhY2thZ2VEYXRhKSA9PlxuICAgICAgaWYgZXJyIG9yIG5vdChwYWNrYWdlRGF0YT8ubmFtZT8pXG4gICAgICAgIEBoaWRlTG9hZGluZ01lc3NhZ2UoKVxuICAgICAgICBAc2hvd0Vycm9yTWVzc2FnZSgpXG4gICAgICBlbHNlXG4gICAgICAgIEBwYWNrID0gcGFja2FnZURhdGFcbiAgICAgICAgIyBUT0RPOiB0aGlzIHNob3VsZCBtYXRjaCBQYWNrYWdlLmxvYWRNZXRhZGF0YSBmcm9tIGNvcmUsIGJ1dCB0aGlzIGlzXG4gICAgICAgICMgYW4gYWNjZXB0YWJsZSBoYWNreSB3b3JrYXJvdW5kXG4gICAgICAgIEBwYWNrLm1ldGFkYXRhID0gXy5leHRlbmQoQHBhY2subWV0YWRhdGEgPyB7fSwgQHBhY2spXG4gICAgICAgIEBjb21wbGV0ZUluaXRpYWx6YXRpb24oKVxuXG4gIHNob3dMb2FkaW5nTWVzc2FnZTogLT5cbiAgICBAbG9hZGluZ01lc3NhZ2UucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cbiAgaGlkZUxvYWRpbmdNZXNzYWdlOiAtPlxuICAgIEBsb2FkaW5nTWVzc2FnZS5hZGRDbGFzcygnaGlkZGVuJylcblxuICBzaG93RXJyb3JNZXNzYWdlOiAtPlxuICAgIEBlcnJvck1lc3NhZ2UucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cbiAgaGlkZUVycm9yTWVzc2FnZTogLT5cbiAgICBAZXJyb3JNZXNzYWdlLmFkZENsYXNzKCdoaWRkZW4nKVxuXG4gIGFjdGl2YXRlQ29uZmlnOiAtPlxuICAgICMgUGFja2FnZS5hY3RpdmF0ZUNvbmZpZygpIGlzIHBhcnQgb2YgdGhlIFByaXZhdGUgcGFja2FnZSBBUEkgYW5kIHNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIG9mIGNvcmUuXG4gICAgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VMb2FkZWQoQHBhY2submFtZSkgYW5kIG5vdCBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShAcGFjay5uYW1lKVxuICAgICAgQHBhY2suYWN0aXZhdGVDb25maWcoKVxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGJlZm9yZVNob3c6IChvcHRzKSAtPlxuICAgIG9wdHMuYmFjayA/PSAnSW5zdGFsbCdcbiAgICBAYnJlYWRjcnVtYi50ZXh0KG9wdHMuYmFjaykub24gJ2NsaWNrJywgPT5cbiAgICAgIEBwYXJlbnRzKCcuc2V0dGluZ3MtdmlldycpLnZpZXcoKT8uc2hvd1BhbmVsKG9wdHMuYmFjaylcblxuICBwb3B1bGF0ZTogLT5cbiAgICBAdGl0bGUudGV4dChcIiN7Xy51bmRhc2hlcml6ZShfLnVuY2FtZWxjYXNlKEBwYWNrLm5hbWUpKX1cIilcblxuICAgIEB0eXBlID0gaWYgQHBhY2subWV0YWRhdGEudGhlbWUgdGhlbiAndGhlbWUnIGVsc2UgJ3BhY2thZ2UnXG5cbiAgICBpZiByZXBvVXJsID0gQHBhY2thZ2VNYW5hZ2VyLmdldFJlcG9zaXRvcnlVcmwoQHBhY2spXG4gICAgICByZXBvTmFtZSA9IHVybC5wYXJzZShyZXBvVXJsKS5wYXRobmFtZVxuICAgICAgQHBhY2thZ2VSZXBvLnRleHQocmVwb05hbWUuc3Vic3RyaW5nKDEpKS5zaG93KClcbiAgICBlbHNlXG4gICAgICBAcGFja2FnZVJlcG8uaGlkZSgpXG5cbiAgICBAdXBkYXRlSW5zdGFsbGVkU3RhdGUoKVxuXG4gIHVwZGF0ZUluc3RhbGxlZFN0YXRlOiAtPlxuICAgIEBzZWN0aW9ucy5lbXB0eSgpXG4gICAgQHVwZGF0ZUZpbGVCdXR0b25zKClcbiAgICBAYWN0aXZhdGVDb25maWcoKVxuXG4gICAgQHN0YXJ0dXBUaW1lLmhpZGUoKVxuXG4gICAgaWYgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VMb2FkZWQoQHBhY2submFtZSlcbiAgICAgIGlmIG5vdCBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZURpc2FibGVkKEBwYWNrLm5hbWUpXG4gICAgICAgIEBzZWN0aW9ucy5hcHBlbmQobmV3IFNldHRpbmdzUGFuZWwoQHBhY2submFtZSwge2luY2x1ZGVUaXRsZTogZmFsc2V9KSlcbiAgICAgICAgQHNlY3Rpb25zLmFwcGVuZChuZXcgUGFja2FnZUtleW1hcFZpZXcoQHBhY2spKVxuXG4gICAgICAgIGlmIEBwYWNrLnBhdGhcbiAgICAgICAgICBAc2VjdGlvbnMuYXBwZW5kKG5ldyBQYWNrYWdlR3JhbW1hcnNWaWV3KEBwYWNrLnBhdGgpKVxuICAgICAgICAgIEBzZWN0aW9ucy5hcHBlbmQobmV3IFBhY2thZ2VTbmlwcGV0c1ZpZXcoQHBhY2sucGF0aCwgQHNuaXBwZXRzUHJvdmlkZXIpKVxuXG4gICAgICAgIEBzdGFydHVwVGltZS5odG1sKFwiVGhpcyAje0B0eXBlfSBhZGRlZCA8c3BhbiBjbGFzcz0naGlnaGxpZ2h0Jz4je0BnZXRTdGFydHVwVGltZSgpfW1zPC9zcGFuPiB0byBzdGFydHVwIHRpbWUuXCIpXG4gICAgICAgIEBzdGFydHVwVGltZS5zaG93KClcbiAgICAgIGVsc2VcbiAgICAgICAgQG9wZW5CdXR0b24uaGlkZSgpXG5cbiAgICBAb3BlbkJ1dHRvbi5oaWRlKCkgaWYgYXRvbS5wYWNrYWdlcy5pc0J1bmRsZWRQYWNrYWdlKEBwYWNrLm5hbWUpXG5cbiAgICBAcmVuZGVyUmVhZG1lKClcblxuICByZW5kZXJSZWFkbWU6IC0+XG4gICAgaWYgQHBhY2subWV0YWRhdGEucmVhZG1lIGFuZCBAcGFjay5tZXRhZGF0YS5yZWFkbWUudHJpbSgpIGlzbnQgTk9STUFMSVpFX1BBQ0tBR0VfREFUQV9SRUFETUVfRVJST1JcbiAgICAgIHJlYWRtZSA9IEBwYWNrLm1ldGFkYXRhLnJlYWRtZVxuICAgIGVsc2VcbiAgICAgIHJlYWRtZSA9IG51bGxcblxuICAgIGlmIEByZWFkbWVQYXRoIGFuZCBub3QgcmVhZG1lXG4gICAgICByZWFkbWUgPSBmcy5yZWFkRmlsZVN5bmMoQHJlYWRtZVBhdGgsIGVuY29kaW5nOiAndXRmOCcpXG5cbiAgICByZWFkbWVWaWV3ID0gbmV3IFBhY2thZ2VSZWFkbWVWaWV3KHJlYWRtZSlcbiAgICBpZiBAcmVhZG1lU2VjdGlvblxuICAgICAgQHJlYWRtZVNlY3Rpb24ucmVwbGFjZVdpdGgocmVhZG1lVmlldylcbiAgICBlbHNlXG4gICAgICBAcmVhZG1lU2VjdGlvbiA9IHJlYWRtZVZpZXdcbiAgICAgIEBzZWN0aW9ucy5hcHBlbmQocmVhZG1lVmlldylcblxuICBzdWJzY3JpYmVUb1BhY2thZ2VNYW5hZ2VyOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICd0aGVtZS1pbnN0YWxsZWQgcGFja2FnZS1pbnN0YWxsZWQnLCAoe3BhY2t9KSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBAcGFjay5uYW1lIGlzIHBhY2submFtZVxuXG4gICAgICBAbG9hZFBhY2thZ2UoKVxuICAgICAgQHVwZGF0ZUluc3RhbGxlZFN0YXRlKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHBhY2thZ2VNYW5hZ2VyLm9uICd0aGVtZS11bmluc3RhbGxlZCBwYWNrYWdlLXVuaW5zdGFsbGVkJywgKHtwYWNrfSkgPT5cbiAgICAgIEB1cGRhdGVJbnN0YWxsZWRTdGF0ZSgpIGlmIEBwYWNrLm5hbWUgaXMgcGFjay5uYW1lXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBwYWNrYWdlTWFuYWdlci5vbiAndGhlbWUtdXBkYXRlZCBwYWNrYWdlLXVwZGF0ZWQnLCAoe3BhY2t9KSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBAcGFjay5uYW1lIGlzIHBhY2submFtZVxuXG4gICAgICBAbG9hZFBhY2thZ2UoKVxuICAgICAgQHVwZGF0ZUZpbGVCdXR0b25zKClcbiAgICAgIEBwb3B1bGF0ZSgpXG5cbiAgaGFuZGxlQnV0dG9uRXZlbnRzOiAtPlxuICAgIEBwYWNrYWdlUmVwby5vbiAnY2xpY2snLCA9PlxuICAgICAgaWYgcmVwb1VybCA9IEBwYWNrYWdlTWFuYWdlci5nZXRSZXBvc2l0b3J5VXJsKEBwYWNrKVxuICAgICAgICBzaGVsbC5vcGVuRXh0ZXJuYWwocmVwb1VybClcbiAgICAgIGZhbHNlXG5cbiAgICBAaXNzdWVCdXR0b24ub24gJ2NsaWNrJywgPT5cbiAgICAgIGlmIHJlcG9VcmwgPSBAcGFja2FnZU1hbmFnZXIuZ2V0UmVwb3NpdG9yeVVybChAcGFjaylcbiAgICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFwiI3tyZXBvVXJsfS9pc3N1ZXMvbmV3XCIpXG4gICAgICBmYWxzZVxuXG4gICAgQGNoYW5nZWxvZ0J1dHRvbi5vbiAnY2xpY2snLCA9PlxuICAgICAgQG9wZW5NYXJrZG93bkZpbGUoQGNoYW5nZWxvZ1BhdGgpIGlmIEBjaGFuZ2Vsb2dQYXRoXG4gICAgICBmYWxzZVxuXG4gICAgQGxpY2Vuc2VCdXR0b24ub24gJ2NsaWNrJywgPT5cbiAgICAgIEBvcGVuTWFya2Rvd25GaWxlKEBsaWNlbnNlUGF0aCkgaWYgQGxpY2Vuc2VQYXRoXG4gICAgICBmYWxzZVxuXG4gICAgQG9wZW5CdXR0b24ub24gJ2NsaWNrJywgPT5cbiAgICAgIGF0b20ub3BlbihwYXRoc1RvT3BlbjogW0BwYWNrLnBhdGhdKSBpZiBmcy5leGlzdHNTeW5jKEBwYWNrLnBhdGgpXG4gICAgICBmYWxzZVxuXG4gICAgQGxlYXJuTW9yZUJ1dHRvbi5vbiAnY2xpY2snLCA9PlxuICAgICAgc2hlbGwub3BlbkV4dGVybmFsIFwiaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzLyN7QHBhY2submFtZX1cIlxuICAgICAgZmFsc2VcblxuICBvcGVuTWFya2Rvd25GaWxlOiAocGF0aCkgLT5cbiAgICBpZiBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZSgnbWFya2Rvd24tcHJldmlldycpXG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGVuY29kZVVSSShcIm1hcmtkb3duLXByZXZpZXc6Ly8je3BhdGh9XCIpKVxuICAgIGVsc2VcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4ocGF0aClcblxuICB1cGRhdGVGaWxlQnV0dG9uczogLT5cbiAgICBAY2hhbmdlbG9nUGF0aCA9IG51bGxcbiAgICBAbGljZW5zZVBhdGggPSBudWxsXG4gICAgQHJlYWRtZVBhdGggPSBudWxsXG5cbiAgICBmb3IgY2hpbGQgaW4gZnMubGlzdFN5bmMoQHBhY2sucGF0aClcbiAgICAgIHN3aXRjaCBwYXRoLmJhc2VuYW1lKGNoaWxkLCBwYXRoLmV4dG5hbWUoY2hpbGQpKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHdoZW4gJ2NoYW5nZWxvZycsICdoaXN0b3J5JyB0aGVuIEBjaGFuZ2Vsb2dQYXRoID0gY2hpbGRcbiAgICAgICAgd2hlbiAnbGljZW5zZScsICdsaWNlbmNlJyB0aGVuIEBsaWNlbnNlUGF0aCA9IGNoaWxkXG4gICAgICAgIHdoZW4gJ3JlYWRtZScgdGhlbiBAcmVhZG1lUGF0aCA9IGNoaWxkXG5cbiAgICAgIGJyZWFrIGlmIEByZWFkbWVQYXRoIGFuZCBAY2hhbmdlbG9nUGF0aCBhbmQgQGxpY2Vuc2VQYXRoXG5cbiAgICBpZiBAY2hhbmdlbG9nUGF0aCB0aGVuIEBjaGFuZ2Vsb2dCdXR0b24uc2hvdygpIGVsc2UgQGNoYW5nZWxvZ0J1dHRvbi5oaWRlKClcbiAgICBpZiBAbGljZW5zZVBhdGggdGhlbiBAbGljZW5zZUJ1dHRvbi5zaG93KCkgZWxzZSBAbGljZW5zZUJ1dHRvbi5oaWRlKClcblxuICBnZXRTdGFydHVwVGltZTogLT5cbiAgICBsb2FkVGltZSA9IEBwYWNrLmxvYWRUaW1lID8gMFxuICAgIGFjdGl2YXRlVGltZSA9IEBwYWNrLmFjdGl2YXRlVGltZSA/IDBcbiAgICBsb2FkVGltZSArIGFjdGl2YXRlVGltZVxuXG4gIGlzSW5zdGFsbGVkOiAtPlxuICAgIGF0b20ucGFja2FnZXMuaXNQYWNrYWdlTG9hZGVkKEBwYWNrLm5hbWUpIGFuZCBub3QgYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VEaXNhYmxlZChAcGFjay5uYW1lKVxuIl19
