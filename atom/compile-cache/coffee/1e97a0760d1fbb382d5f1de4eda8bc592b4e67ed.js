(function() {
  var $, $$, CSON, Client, Disposable, EditorPanel, GeneralPanel, InstallPanel, InstalledPackagesPanel, KeybindingsPanel, PackageDetailView, PackageManager, ScrollView, SettingsView, TextEditorView, ThemesPanel, UpdatesPanel, _, async, fuzzaldrin, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, $$ = ref.$$, ScrollView = ref.ScrollView, TextEditorView = ref.TextEditorView;

  Disposable = require('atom').Disposable;

  async = require('async');

  CSON = require('season');

  fuzzaldrin = require('fuzzaldrin');

  Client = require('./atom-io-client');

  GeneralPanel = require('./general-panel');

  EditorPanel = require('./editor-panel');

  PackageDetailView = require('./package-detail-view');

  KeybindingsPanel = require('./keybindings-panel');

  PackageManager = require('./package-manager');

  InstallPanel = require('./install-panel');

  ThemesPanel = require('./themes-panel');

  InstalledPackagesPanel = require('./installed-packages-panel');

  UpdatesPanel = require('./updates-panel');

  module.exports = SettingsView = (function(superClass) {
    extend(SettingsView, superClass);

    function SettingsView() {
      return SettingsView.__super__.constructor.apply(this, arguments);
    }

    SettingsView.content = function() {
      return this.div({
        "class": 'settings-view pane-item',
        tabindex: -1
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'config-menu',
            outlet: 'sidebar'
          }, function() {
            _this.ul({
              "class": 'panels-menu nav nav-pills nav-stacked',
              outlet: 'panelMenu'
            }, function() {
              return _this.div({
                "class": 'panel-menu-separator',
                outlet: 'menuSeparator'
              });
            });
            return _this.div({
              "class": 'button-area'
            }, function() {
              return _this.button({
                "class": 'btn btn-default icon icon-link-external',
                outlet: 'openDotAtom'
              }, 'Open Config Folder');
            });
          });
          return _this.div({
            "class": 'panels',
            tabindex: -1,
            outlet: 'panels'
          });
        };
      })(this));
    };

    SettingsView.prototype.initialize = function(arg) {
      var activePanel, ref1;
      ref1 = arg != null ? arg : {}, this.uri = ref1.uri, this.snippetsProvider = ref1.snippetsProvider, activePanel = ref1.activePanel;
      SettingsView.__super__.initialize.apply(this, arguments);
      this.packageManager = new PackageManager();
      this.deferredPanel = activePanel;
      return process.nextTick((function(_this) {
        return function() {
          return _this.initializePanels();
        };
      })(this));
    };

    SettingsView.prototype.onDidChangeTitle = function() {
      return new Disposable();
    };

    SettingsView.prototype.dispose = function() {
      var name, panel, ref1;
      ref1 = this.panelsByName;
      for (name in ref1) {
        panel = ref1[name];
        if (typeof panel.dispose === "function") {
          panel.dispose();
        }
      }
    };

    SettingsView.prototype.initializePanels = function() {
      var SystemPanel;
      if (this.panels.size() > 1) {
        return;
      }
      this.panelsByName = {};
      this.on('click', '.panels-menu li a, .panels-packages li a', (function(_this) {
        return function(e) {
          return _this.showPanel($(e.target).closest('li').attr('name'));
        };
      })(this));
      this.on('focus', (function(_this) {
        return function() {
          return _this.focusActivePanel();
        };
      })(this));
      this.openDotAtom.on('click', function() {
        return atom.open({
          pathsToOpen: [atom.getConfigDirPath()]
        });
      });
      this.addCorePanel('Core', 'settings', function() {
        return new GeneralPanel;
      });
      this.addCorePanel('Editor', 'code', function() {
        return new EditorPanel;
      });
      if (process.platform === 'win32' && (require('atom').WinShell != null)) {
        SystemPanel = require('./system-windows-panel');
        this.addCorePanel('System', 'device-desktop', function() {
          return new SystemPanel;
        });
      }
      this.addCorePanel('Keybindings', 'keyboard', function() {
        return new KeybindingsPanel;
      });
      this.addCorePanel('Packages', 'package', (function(_this) {
        return function() {
          return new InstalledPackagesPanel(_this.packageManager);
        };
      })(this));
      this.addCorePanel('Themes', 'paintcan', (function(_this) {
        return function() {
          return new ThemesPanel(_this.packageManager);
        };
      })(this));
      this.addCorePanel('Updates', 'cloud-download', (function(_this) {
        return function() {
          return new UpdatesPanel(_this.packageManager);
        };
      })(this));
      this.addCorePanel('Install', 'plus', (function(_this) {
        return function() {
          return new InstallPanel(_this.packageManager);
        };
      })(this));
      this.showDeferredPanel();
      if (!this.activePanel) {
        this.showPanel('Core');
      }
      if (this.isOnDom()) {
        return this.sidebar.width(this.sidebar.width());
      }
    };

    SettingsView.prototype.serialize = function() {
      var ref1;
      return {
        deserializer: 'SettingsView',
        version: 2,
        activePanel: (ref1 = this.activePanel) != null ? ref1 : this.deferredPanel,
        uri: this.uri
      };
    };

    SettingsView.prototype.getPackages = function() {
      var bundledPackageMetadataCache, error, i, len, metadata, name, packageName, packagePath, ref1, ref2, ref3, ref4, ref5;
      if (this.packages != null) {
        return this.packages;
      }
      this.packages = atom.packages.getLoadedPackages();
      try {
        bundledPackageMetadataCache = (ref1 = require(path.join(atom.getLoadSettings().resourcePath, 'package.json'))) != null ? ref1._atomPackages : void 0;
      } catch (error1) {}
      ref3 = (ref2 = atom.config.get('core.disabledPackages')) != null ? ref2 : [];
      for (i = 0, len = ref3.length; i < len; i++) {
        packageName = ref3[i];
        packagePath = atom.packages.resolvePackagePath(packageName);
        if (!packagePath) {
          continue;
        }
        try {
          metadata = require(path.join(packagePath, 'package.json'));
        } catch (error1) {
          error = error1;
          metadata = bundledPackageMetadataCache != null ? (ref4 = bundledPackageMetadataCache[packageName]) != null ? ref4.metadata : void 0 : void 0;
        }
        if (metadata == null) {
          continue;
        }
        name = (ref5 = metadata.name) != null ? ref5 : packageName;
        if (!_.findWhere(this.packages, {
          name: name
        })) {
          this.packages.push({
            name: name,
            metadata: metadata,
            path: packagePath
          });
        }
      }
      this.packages.sort((function(_this) {
        return function(pack1, pack2) {
          var title1, title2;
          title1 = _this.packageManager.getPackageTitle(pack1);
          title2 = _this.packageManager.getPackageTitle(pack2);
          return title1.localeCompare(title2);
        };
      })(this));
      return this.packages;
    };

    SettingsView.prototype.addCorePanel = function(name, iconName, panel) {
      var panelMenuItem;
      panelMenuItem = $$(function() {
        return this.li({
          name: name
        }, (function(_this) {
          return function() {
            return _this.a({
              "class": "icon icon-" + iconName
            }, name);
          };
        })(this));
      });
      this.menuSeparator.before(panelMenuItem);
      return this.addPanel(name, panelMenuItem, panel);
    };

    SettingsView.prototype.addPanel = function(name, panelMenuItem, panelCreateCallback) {
      var ref1;
      if (this.panelCreateCallbacks == null) {
        this.panelCreateCallbacks = {};
      }
      this.panelCreateCallbacks[name] = panelCreateCallback;
      if (((ref1 = this.deferredPanel) != null ? ref1.name : void 0) === name) {
        return this.showDeferredPanel();
      }
    };

    SettingsView.prototype.getOrCreatePanel = function(name, options) {
      var callback, panel, ref1, ref2, ref3;
      panel = (ref1 = this.panelsByName) != null ? ref1[name] : void 0;
      if (panel == null) {
        callback = (ref2 = this.panelCreateCallbacks) != null ? ref2[name] : void 0;
        if ((options != null ? options.pack : void 0) && !callback) {
          callback = (function(_this) {
            return function() {
              var metadata;
              if (!options.pack.metadata) {
                metadata = _.clone(options.pack);
                options.pack.metadata = metadata;
              }
              return new PackageDetailView(options.pack, _this.packageManager, _this.snippetsProvider);
            };
          })(this);
        }
        if (callback) {
          panel = callback();
          if (this.panelsByName == null) {
            this.panelsByName = {};
          }
          this.panelsByName[name] = panel;
          if ((ref3 = this.panelCreateCallbacks) != null) {
            delete ref3[name];
          }
        }
      }
      return panel;
    };

    SettingsView.prototype.makePanelMenuActive = function(name) {
      this.sidebar.find('.active').removeClass('active');
      return this.sidebar.find("[name='" + name + "']").addClass('active');
    };

    SettingsView.prototype.focusActivePanel = function() {
      var child, i, len, panel, ref1, view;
      ref1 = this.panels.children();
      for (i = 0, len = ref1.length; i < len; i++) {
        panel = ref1[i];
        child = $(panel);
        if (child.isVisible()) {
          if (view = child.view()) {
            view.focus();
          } else {
            child.focus();
          }
          return;
        }
      }
    };

    SettingsView.prototype.showDeferredPanel = function() {
      var name, options, ref1;
      if (this.deferredPanel == null) {
        return;
      }
      ref1 = this.deferredPanel, name = ref1.name, options = ref1.options;
      return this.showPanel(name, options);
    };

    SettingsView.prototype.showPanel = function(name, options) {
      var panel;
      if (panel = this.getOrCreatePanel(name, options)) {
        this.appendPanel(panel, options);
        this.makePanelMenuActive(name);
        this.setActivePanel(name, options);
        return this.deferredPanel = null;
      } else {
        return this.deferredPanel = {
          name: name,
          options: options
        };
      }
    };

    SettingsView.prototype.appendPanel = function(panel, options) {
      this.panels.children().hide();
      if (!$.contains(this.panels[0], panel[0])) {
        this.panels.append(panel);
      }
      if (typeof panel.beforeShow === "function") {
        panel.beforeShow(options);
      }
      panel.show();
      return panel.focus();
    };

    SettingsView.prototype.setActivePanel = function(name, options) {
      if (options == null) {
        options = {};
      }
      return this.activePanel = {
        name: name,
        options: options
      };
    };

    SettingsView.prototype.removePanel = function(name) {
      var panel, ref1;
      if (panel = (ref1 = this.panelsByName) != null ? ref1[name] : void 0) {
        panel.remove();
        return delete this.panelsByName[name];
      }
    };

    SettingsView.prototype.getTitle = function() {
      return "Settings";
    };

    SettingsView.prototype.getIconName = function() {
      return "tools";
    };

    SettingsView.prototype.getURI = function() {
      return this.uri;
    };

    SettingsView.prototype.isEqual = function(other) {
      return other instanceof SettingsView;
    };

    return SettingsView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9zZXR0aW5ncy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMlBBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBc0MsT0FBQSxDQUFRLHNCQUFSLENBQXRDLEVBQUMsU0FBRCxFQUFJLFdBQUosRUFBUSwyQkFBUixFQUFvQjs7RUFDbkIsYUFBYyxPQUFBLENBQVEsTUFBUjs7RUFDZixLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0VBQ1IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLFVBQUEsR0FBYSxPQUFBLENBQVEsWUFBUjs7RUFFYixNQUFBLEdBQVMsT0FBQSxDQUFRLGtCQUFSOztFQUNULFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBQ2YsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxpQkFBQSxHQUFvQixPQUFBLENBQVEsdUJBQVI7O0VBQ3BCLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxxQkFBUjs7RUFDbkIsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBQ2YsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxzQkFBQSxHQUF5QixPQUFBLENBQVEsNEJBQVI7O0VBQ3pCLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBRWYsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUVKLFlBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtB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QW5CLENBQUE7TUFDQSxJQUFBLENBQTZCLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBQyxDQUFBLE1BQU8sQ0FBQSxDQUFBLENBQW5CLEVBQXVCLEtBQU0sQ0FBQSxDQUFBLENBQTdCLENBQTdCO1FBQUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQWUsS0FBZixFQUFBOzs7UUFDQSxLQUFLLENBQUMsV0FBWTs7TUFDbEIsS0FBSyxDQUFDLElBQU4sQ0FBQTthQUNBLEtBQUssQ0FBQyxLQUFOLENBQUE7SUFMVzs7MkJBT2IsY0FBQSxHQUFnQixTQUFDLElBQUQsRUFBTyxPQUFQOztRQUFPLFVBQVU7O2FBQy9CLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFBQyxNQUFBLElBQUQ7UUFBTyxTQUFBLE9BQVA7O0lBREQ7OzJCQUdoQixXQUFBLEdBQWEsU0FBQyxJQUFEO0FBQ1gsVUFBQTtNQUFBLElBQUcsS0FBQSw0Q0FBdUIsQ0FBQSxJQUFBLFVBQTFCO1FBQ0UsS0FBSyxDQUFDLE1BQU4sQ0FBQTtlQUNBLE9BQU8sSUFBQyxDQUFBLFlBQWEsQ0FBQSxJQUFBLEVBRnZCOztJQURXOzsyQkFLYixRQUFBLEdBQVUsU0FBQTthQUNSO0lBRFE7OzJCQUdWLFdBQUEsR0FBYSxTQUFBO2FBQ1g7SUFEVzs7MkJBR2IsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUE7SUFESzs7MkJBR1IsT0FBQSxHQUFTLFNBQUMsS0FBRDthQUNQLEtBQUEsWUFBaUI7SUFEVjs7OztLQWhNZ0I7QUFwQjNCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xueyQsICQkLCBTY3JvbGxWaWV3LCBUZXh0RWRpdG9yVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5hc3luYyA9IHJlcXVpcmUgJ2FzeW5jJ1xuQ1NPTiA9IHJlcXVpcmUgJ3NlYXNvbidcbmZ1enphbGRyaW4gPSByZXF1aXJlICdmdXp6YWxkcmluJ1xuXG5DbGllbnQgPSByZXF1aXJlICcuL2F0b20taW8tY2xpZW50J1xuR2VuZXJhbFBhbmVsID0gcmVxdWlyZSAnLi9nZW5lcmFsLXBhbmVsJ1xuRWRpdG9yUGFuZWwgPSByZXF1aXJlICcuL2VkaXRvci1wYW5lbCdcblBhY2thZ2VEZXRhaWxWaWV3ID0gcmVxdWlyZSAnLi9wYWNrYWdlLWRldGFpbC12aWV3J1xuS2V5YmluZGluZ3NQYW5lbCA9IHJlcXVpcmUgJy4va2V5YmluZGluZ3MtcGFuZWwnXG5QYWNrYWdlTWFuYWdlciA9IHJlcXVpcmUgJy4vcGFja2FnZS1tYW5hZ2VyJ1xuSW5zdGFsbFBhbmVsID0gcmVxdWlyZSAnLi9pbnN0YWxsLXBhbmVsJ1xuVGhlbWVzUGFuZWwgPSByZXF1aXJlICcuL3RoZW1lcy1wYW5lbCdcbkluc3RhbGxlZFBhY2thZ2VzUGFuZWwgPSByZXF1aXJlICcuL2luc3RhbGxlZC1wYWNrYWdlcy1wYW5lbCdcblVwZGF0ZXNQYW5lbCA9IHJlcXVpcmUgJy4vdXBkYXRlcy1wYW5lbCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2V0dGluZ3NWaWV3IGV4dGVuZHMgU2Nyb2xsVmlld1xuXG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5ncy12aWV3IHBhbmUtaXRlbScsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdjb25maWctbWVudScsIG91dGxldDogJ3NpZGViYXInLCA9PlxuICAgICAgICBAdWwgY2xhc3M6ICdwYW5lbHMtbWVudSBuYXYgbmF2LXBpbGxzIG5hdi1zdGFja2VkJywgb3V0bGV0OiAncGFuZWxNZW51JywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAncGFuZWwtbWVudS1zZXBhcmF0b3InLCBvdXRsZXQ6ICdtZW51U2VwYXJhdG9yJ1xuICAgICAgICBAZGl2IGNsYXNzOiAnYnV0dG9uLWFyZWEnLCA9PlxuICAgICAgICAgIEBidXR0b24gY2xhc3M6ICdidG4gYnRuLWRlZmF1bHQgaWNvbiBpY29uLWxpbmstZXh0ZXJuYWwnLCBvdXRsZXQ6ICdvcGVuRG90QXRvbScsICdPcGVuIENvbmZpZyBGb2xkZXInXG4gICAgICAjIFRoZSB0YWJpbmRleCBhdHRyIGJlbG93IGVuc3VyZXMgdGhhdCBjbGlja3MgaW4gYSBwYW5lbCBpdGVtIHdvbid0IGNhdXNlIHRoaXMgdmlldyB0byBnYWluIGZvY3VzLlxuICAgICAgIyBUaGlzIGlzIGltcG9ydGFudCBiZWNhdXNlIHdoZW4gdGhpcyB2aWV3IGdhaW5zIGZvY3VzIChlLmcuIGltbWVkaWF0ZWx5IGFmdGVyIGF0b20gZGlzcGxheXMgaXQpLFxuICAgICAgIyBpdCBmb2N1c2VzIHRoZSBjdXJyZW50bHkgYWN0aXZlIHBhbmVsIGl0ZW0uIElmIHRoYXQgZm9jdXNpbmcgY2F1c2VzIHRoZSBhY3RpdmUgcGFuZWwgdG8gc2Nyb2xsIChlLmcuXG4gICAgICAjIGJlY2F1c2UgdGhlIGFjdGl2ZSBwYW5lbCBpdHNlbGYgcGFzc2VzIGZvY3VzIG9uIHRvIGEgc2VhcmNoIGJveCBhdCB0aGUgdG9wIG9mIGEgc2Nyb2xsZWQgcGFuZWwpLFxuICAgICAgIyB0aGVuIHRoZSBicm93c2VyIHdpbGwgbm90IGZpcmUgdGhlIGNsaWNrIGV2ZW50IG9uIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgcGFuZWwgb24gd2hpY2ggdGhlIHVzZXIgb3JpZ2luYWxseVxuICAgICAgIyBjbGlja2VkIChlLmcuIGEgcGFja2FnZSBjYXJkKS4gVGhpcyB3b3VsZCBwcmV2ZW50IHVzIGZyb20gc2hvd2luZyBhIHBhY2thZ2UgZGV0YWlsIHZpZXcgd2hlbiBjbGlja2luZyBvbiBhXG4gICAgICAjIHBhY2thZ2UgY2FyZC4gUGhldyFcbiAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbHMnLCB0YWJpbmRleDogLTEsIG91dGxldDogJ3BhbmVscydcblxuICBpbml0aWFsaXplOiAoe0B1cmksIEBzbmlwcGV0c1Byb3ZpZGVyLCBhY3RpdmVQYW5lbH09e30pIC0+XG4gICAgc3VwZXJcbiAgICBAcGFja2FnZU1hbmFnZXIgPSBuZXcgUGFja2FnZU1hbmFnZXIoKVxuICAgIEBkZWZlcnJlZFBhbmVsID0gYWN0aXZlUGFuZWxcbiAgICBwcm9jZXNzLm5leHRUaWNrID0+IEBpbml0aWFsaXplUGFuZWxzKClcblxuICAjIFRoaXMgcHJldmVudHMgdGhlIHZpZXcgYmVpbmcgYWN0dWFsbHkgZGlzcG9zZWQgd2hlbiBjbG9zZWRcbiAgIyBJZiB5b3UgcmVtb3ZlIGl0IHlvdSB3aWxsIG5lZWQgdG8gZW5zdXJlIHRoZSBjYWNoZWQgc2V0dGluZ3NWaWV3XG4gICMgaW4gbWFpbi5jb2ZmZWUgaXMgY29ycmVjdGx5IHJlbGVhc2VkIG9uIGNsb3NlIGFzIHdlbGwuLi5cbiAgb25EaWRDaGFuZ2VUaXRsZTogLT4gbmV3IERpc3Bvc2FibGUoKVxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgZm9yIG5hbWUsIHBhbmVsIG9mIEBwYW5lbHNCeU5hbWVcbiAgICAgIHBhbmVsLmRpc3Bvc2U/KClcbiAgICByZXR1cm5cblxuICBpbml0aWFsaXplUGFuZWxzOiAtPlxuICAgIHJldHVybiBpZiBAcGFuZWxzLnNpemUoKSA+IDFcblxuICAgIEBwYW5lbHNCeU5hbWUgPSB7fVxuICAgIEBvbiAnY2xpY2snLCAnLnBhbmVscy1tZW51IGxpIGEsIC5wYW5lbHMtcGFja2FnZXMgbGkgYScsIChlKSA9PlxuICAgICAgQHNob3dQYW5lbCgkKGUudGFyZ2V0KS5jbG9zZXN0KCdsaScpLmF0dHIoJ25hbWUnKSlcblxuICAgIEBvbiAnZm9jdXMnLCA9PlxuICAgICAgQGZvY3VzQWN0aXZlUGFuZWwoKVxuXG4gICAgQG9wZW5Eb3RBdG9tLm9uICdjbGljaycsIC0+XG4gICAgICBhdG9tLm9wZW4ocGF0aHNUb09wZW46IFthdG9tLmdldENvbmZpZ0RpclBhdGgoKV0pXG5cbiAgICBAYWRkQ29yZVBhbmVsICdDb3JlJywgJ3NldHRpbmdzJywgLT4gbmV3IEdlbmVyYWxQYW5lbFxuICAgIEBhZGRDb3JlUGFuZWwgJ0VkaXRvcicsICdjb2RlJywgLT4gbmV3IEVkaXRvclBhbmVsXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInIGFuZCByZXF1aXJlKCdhdG9tJykuV2luU2hlbGw/XG4gICAgICBTeXN0ZW1QYW5lbCA9IHJlcXVpcmUgJy4vc3lzdGVtLXdpbmRvd3MtcGFuZWwnXG4gICAgICBAYWRkQ29yZVBhbmVsICdTeXN0ZW0nLCAnZGV2aWNlLWRlc2t0b3AnLCAtPiBuZXcgU3lzdGVtUGFuZWxcbiAgICBAYWRkQ29yZVBhbmVsICdLZXliaW5kaW5ncycsICdrZXlib2FyZCcsIC0+IG5ldyBLZXliaW5kaW5nc1BhbmVsXG4gICAgQGFkZENvcmVQYW5lbCAnUGFja2FnZXMnLCAncGFja2FnZScsID0+IG5ldyBJbnN0YWxsZWRQYWNrYWdlc1BhbmVsKEBwYWNrYWdlTWFuYWdlcilcbiAgICBAYWRkQ29yZVBhbmVsICdUaGVtZXMnLCAncGFpbnRjYW4nLCA9PiBuZXcgVGhlbWVzUGFuZWwoQHBhY2thZ2VNYW5hZ2VyKVxuICAgIEBhZGRDb3JlUGFuZWwgJ1VwZGF0ZXMnLCAnY2xvdWQtZG93bmxvYWQnLCA9PiBuZXcgVXBkYXRlc1BhbmVsKEBwYWNrYWdlTWFuYWdlcilcbiAgICBAYWRkQ29yZVBhbmVsICdJbnN0YWxsJywgJ3BsdXMnLCA9PiBuZXcgSW5zdGFsbFBhbmVsKEBwYWNrYWdlTWFuYWdlcilcblxuICAgIEBzaG93RGVmZXJyZWRQYW5lbCgpXG4gICAgQHNob3dQYW5lbCgnQ29yZScpIHVubGVzcyBAYWN0aXZlUGFuZWxcbiAgICBAc2lkZWJhci53aWR0aChAc2lkZWJhci53aWR0aCgpKSBpZiBAaXNPbkRvbSgpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGRlc2VyaWFsaXplcjogJ1NldHRpbmdzVmlldydcbiAgICB2ZXJzaW9uOiAyXG4gICAgYWN0aXZlUGFuZWw6IEBhY3RpdmVQYW5lbCA/IEBkZWZlcnJlZFBhbmVsXG4gICAgdXJpOiBAdXJpXG5cbiAgZ2V0UGFja2FnZXM6IC0+XG4gICAgcmV0dXJuIEBwYWNrYWdlcyBpZiBAcGFja2FnZXM/XG5cbiAgICBAcGFja2FnZXMgPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2VzKClcblxuICAgIHRyeVxuICAgICAgYnVuZGxlZFBhY2thZ2VNZXRhZGF0YUNhY2hlID0gcmVxdWlyZShwYXRoLmpvaW4oYXRvbS5nZXRMb2FkU2V0dGluZ3MoKS5yZXNvdXJjZVBhdGgsICdwYWNrYWdlLmpzb24nKSk/Ll9hdG9tUGFja2FnZXNcblxuICAgICMgSW5jbHVkZSBkaXNhYmxlZCBwYWNrYWdlcyBzbyB0aGV5IGNhbiBiZSByZS1lbmFibGVkIGZyb20gdGhlIFVJXG4gICAgZm9yIHBhY2thZ2VOYW1lIGluIGF0b20uY29uZmlnLmdldCgnY29yZS5kaXNhYmxlZFBhY2thZ2VzJykgPyBbXVxuICAgICAgcGFja2FnZVBhdGggPSBhdG9tLnBhY2thZ2VzLnJlc29sdmVQYWNrYWdlUGF0aChwYWNrYWdlTmFtZSlcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBwYWNrYWdlUGF0aFxuXG4gICAgICB0cnlcbiAgICAgICAgbWV0YWRhdGEgPSByZXF1aXJlKHBhdGguam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgbWV0YWRhdGEgPSBidW5kbGVkUGFja2FnZU1ldGFkYXRhQ2FjaGU/W3BhY2thZ2VOYW1lXT8ubWV0YWRhdGFcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBtZXRhZGF0YT9cblxuICAgICAgbmFtZSA9IG1ldGFkYXRhLm5hbWUgPyBwYWNrYWdlTmFtZVxuICAgICAgdW5sZXNzIF8uZmluZFdoZXJlKEBwYWNrYWdlcywge25hbWV9KVxuICAgICAgICBAcGFja2FnZXMucHVzaCh7bmFtZSwgbWV0YWRhdGEsIHBhdGg6IHBhY2thZ2VQYXRofSlcblxuICAgIEBwYWNrYWdlcy5zb3J0IChwYWNrMSwgcGFjazIpID0+XG4gICAgICB0aXRsZTEgPSBAcGFja2FnZU1hbmFnZXIuZ2V0UGFja2FnZVRpdGxlKHBhY2sxKVxuICAgICAgdGl0bGUyID0gQHBhY2thZ2VNYW5hZ2VyLmdldFBhY2thZ2VUaXRsZShwYWNrMilcbiAgICAgIHRpdGxlMS5sb2NhbGVDb21wYXJlKHRpdGxlMilcblxuICAgIEBwYWNrYWdlc1xuXG4gIGFkZENvcmVQYW5lbDogKG5hbWUsIGljb25OYW1lLCBwYW5lbCkgLT5cbiAgICBwYW5lbE1lbnVJdGVtID0gJCQgLT5cbiAgICAgIEBsaSBuYW1lOiBuYW1lLCA9PlxuICAgICAgICBAYSBjbGFzczogXCJpY29uIGljb24tI3tpY29uTmFtZX1cIiwgbmFtZVxuICAgIEBtZW51U2VwYXJhdG9yLmJlZm9yZShwYW5lbE1lbnVJdGVtKVxuICAgIEBhZGRQYW5lbChuYW1lLCBwYW5lbE1lbnVJdGVtLCBwYW5lbClcblxuICBhZGRQYW5lbDogKG5hbWUsIHBhbmVsTWVudUl0ZW0sIHBhbmVsQ3JlYXRlQ2FsbGJhY2spIC0+XG4gICAgQHBhbmVsQ3JlYXRlQ2FsbGJhY2tzID89IHt9XG4gICAgQHBhbmVsQ3JlYXRlQ2FsbGJhY2tzW25hbWVdID0gcGFuZWxDcmVhdGVDYWxsYmFja1xuICAgIEBzaG93RGVmZXJyZWRQYW5lbCgpIGlmIEBkZWZlcnJlZFBhbmVsPy5uYW1lIGlzIG5hbWVcblxuICBnZXRPckNyZWF0ZVBhbmVsOiAobmFtZSwgb3B0aW9ucykgLT5cbiAgICBwYW5lbCA9IEBwYW5lbHNCeU5hbWU/W25hbWVdXG4gICAgIyBUaGVzZSBuZXN0ZWQgY29uZGl0aW9uYWxzIGFyZSBub3QgZ3JlYXQgYnV0IEkgZmVlbCBsaWtlIGl0J3MgdGhlIG1vc3RcbiAgICAjIGV4cGVkaWVudCB0aGluZyB0byBkbyAtIEkgZmVlbCBsaWtlIHRoZSBcInJpZ2h0IHdheVwiIGludm9sdmVzIHJlZmFjdG9yaW5nXG4gICAgIyB0aGlzIHdob2xlIGZpbGUuXG4gICAgdW5sZXNzIHBhbmVsP1xuICAgICAgY2FsbGJhY2sgPSBAcGFuZWxDcmVhdGVDYWxsYmFja3M/W25hbWVdXG5cbiAgICAgIGlmIG9wdGlvbnM/LnBhY2sgYW5kIG5vdCBjYWxsYmFja1xuICAgICAgICBjYWxsYmFjayA9ID0+XG4gICAgICAgICAgdW5sZXNzIG9wdGlvbnMucGFjay5tZXRhZGF0YVxuICAgICAgICAgICAgbWV0YWRhdGEgPSBfLmNsb25lKG9wdGlvbnMucGFjaylcbiAgICAgICAgICAgIG9wdGlvbnMucGFjay5tZXRhZGF0YSA9IG1ldGFkYXRhXG4gICAgICAgICAgbmV3IFBhY2thZ2VEZXRhaWxWaWV3KG9wdGlvbnMucGFjaywgQHBhY2thZ2VNYW5hZ2VyLCBAc25pcHBldHNQcm92aWRlcilcblxuICAgICAgaWYgY2FsbGJhY2tcbiAgICAgICAgcGFuZWwgPSBjYWxsYmFjaygpXG4gICAgICAgIEBwYW5lbHNCeU5hbWUgPz0ge31cbiAgICAgICAgQHBhbmVsc0J5TmFtZVtuYW1lXSA9IHBhbmVsXG4gICAgICAgIGRlbGV0ZSBAcGFuZWxDcmVhdGVDYWxsYmFja3M/W25hbWVdXG5cbiAgICBwYW5lbFxuXG4gIG1ha2VQYW5lbE1lbnVBY3RpdmU6IChuYW1lKSAtPlxuICAgIEBzaWRlYmFyLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICBAc2lkZWJhci5maW5kKFwiW25hbWU9JyN7bmFtZX0nXVwiKS5hZGRDbGFzcygnYWN0aXZlJylcblxuICBmb2N1c0FjdGl2ZVBhbmVsOiAtPlxuICAgICMgUGFzcyBmb2N1cyB0byBwYW5lbCB0aGF0IGlzIGN1cnJlbnRseSB2aXNpYmxlXG4gICAgZm9yIHBhbmVsIGluIEBwYW5lbHMuY2hpbGRyZW4oKVxuICAgICAgY2hpbGQgPSAkKHBhbmVsKVxuICAgICAgaWYgY2hpbGQuaXNWaXNpYmxlKClcbiAgICAgICAgaWYgdmlldyA9IGNoaWxkLnZpZXcoKVxuICAgICAgICAgIHZpZXcuZm9jdXMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY2hpbGQuZm9jdXMoKVxuICAgICAgICByZXR1cm5cblxuICBzaG93RGVmZXJyZWRQYW5lbDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBkZWZlcnJlZFBhbmVsP1xuICAgIHtuYW1lLCBvcHRpb25zfSA9IEBkZWZlcnJlZFBhbmVsXG4gICAgQHNob3dQYW5lbChuYW1lLCBvcHRpb25zKVxuXG4gICMgUHVibGljOiBzaG93IGEgcGFuZWwuXG4gICNcbiAgIyAqIGBuYW1lYCB7U3RyaW5nfSB0aGUgbmFtZSBvZiB0aGUgcGFuZWwgdG8gc2hvd1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9IGFuIG9wdGlvbnMgaGFzaC4gV2lsbCBiZSBwYXNzZWQgdG8gYGJlZm9yZVNob3coKWAgb25cbiAgIyAgIHRoZSBwYW5lbC4gT3B0aW9ucyBtYXkgaW5jbHVkZSAoYnV0IGFyZSBub3QgbGltaXRlZCB0byk6XG4gICMgICAqIGB1cmlgIHRoZSBVUkkgdGhlIHBhbmVsIHdhcyBsYXVuY2hlZCBmcm9tXG4gIHNob3dQYW5lbDogKG5hbWUsIG9wdGlvbnMpIC0+XG4gICAgaWYgcGFuZWwgPSBAZ2V0T3JDcmVhdGVQYW5lbChuYW1lLCBvcHRpb25zKVxuICAgICAgQGFwcGVuZFBhbmVsKHBhbmVsLCBvcHRpb25zKVxuICAgICAgQG1ha2VQYW5lbE1lbnVBY3RpdmUobmFtZSlcbiAgICAgIEBzZXRBY3RpdmVQYW5lbChuYW1lLCBvcHRpb25zKVxuICAgICAgQGRlZmVycmVkUGFuZWwgPSBudWxsXG4gICAgZWxzZVxuICAgICAgQGRlZmVycmVkUGFuZWwgPSB7bmFtZSwgb3B0aW9uc31cblxuICBhcHBlbmRQYW5lbDogKHBhbmVsLCBvcHRpb25zKSAtPlxuICAgIEBwYW5lbHMuY2hpbGRyZW4oKS5oaWRlKClcbiAgICBAcGFuZWxzLmFwcGVuZChwYW5lbCkgdW5sZXNzICQuY29udGFpbnMoQHBhbmVsc1swXSwgcGFuZWxbMF0pXG4gICAgcGFuZWwuYmVmb3JlU2hvdz8ob3B0aW9ucylcbiAgICBwYW5lbC5zaG93KClcbiAgICBwYW5lbC5mb2N1cygpXG5cbiAgc2V0QWN0aXZlUGFuZWw6IChuYW1lLCBvcHRpb25zID0ge30pIC0+XG4gICAgQGFjdGl2ZVBhbmVsID0ge25hbWUsIG9wdGlvbnN9XG5cbiAgcmVtb3ZlUGFuZWw6IChuYW1lKSAtPlxuICAgIGlmIHBhbmVsID0gQHBhbmVsc0J5TmFtZT9bbmFtZV1cbiAgICAgIHBhbmVsLnJlbW92ZSgpXG4gICAgICBkZWxldGUgQHBhbmVsc0J5TmFtZVtuYW1lXVxuXG4gIGdldFRpdGxlOiAtPlxuICAgIFwiU2V0dGluZ3NcIlxuXG4gIGdldEljb25OYW1lOiAtPlxuICAgIFwidG9vbHNcIlxuXG4gIGdldFVSSTogLT5cbiAgICBAdXJpXG5cbiAgaXNFcXVhbDogKG90aGVyKSAtPlxuICAgIG90aGVyIGluc3RhbmNlb2YgU2V0dGluZ3NWaWV3XG4iXX0=
