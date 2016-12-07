(function() {
  var SettingsView, SnippetsProvider, configUri, openPanel, settingsView, uriRegex;

  SettingsView = null;

  settingsView = null;

  SnippetsProvider = {
    getSnippets: function() {
      return atom.config.scopedSettingsStore.propertySets;
    }
  };

  configUri = 'atom://config';

  uriRegex = /config\/([a-z]+)\/?([a-zA-Z0-9_-]+)?/i;

  openPanel = function(settingsView, panelName, uri) {
    var detail, match, options, panel;
    match = uriRegex.exec(uri);
    panel = match != null ? match[1] : void 0;
    detail = match != null ? match[2] : void 0;
    options = {
      uri: uri
    };
    if (panel === "packages" && (detail != null)) {
      panelName = detail;
      options.pack = {
        name: detail
      };
      if (atom.packages.getLoadedPackage(detail)) {
        options.back = 'Packages';
      }
    }
    return settingsView.showPanel(panelName, options);
  };

  module.exports = {
    activate: function() {
      atom.workspace.addOpener((function(_this) {
        return function(uri) {
          var match, panelName;
          if (uri.startsWith(configUri)) {
            if (settingsView == null) {
              settingsView = _this.createSettingsView({
                uri: uri
              });
            }
            if (match = uriRegex.exec(uri)) {
              panelName = match[1];
              panelName = panelName[0].toUpperCase() + panelName.slice(1);
              openPanel(settingsView, panelName, uri);
            }
            return settingsView;
          }
        };
      })(this));
      atom.commands.add('atom-workspace', {
        'settings-view:open': function() {
          return atom.workspace.open(configUri);
        },
        'settings-view:core': function() {
          return atom.workspace.open(configUri + "/core");
        },
        'settings-view:editor': function() {
          return atom.workspace.open(configUri + "/editor");
        },
        'settings-view:show-keybindings': function() {
          return atom.workspace.open(configUri + "/keybindings");
        },
        'settings-view:change-themes': function() {
          return atom.workspace.open(configUri + "/themes");
        },
        'settings-view:install-packages-and-themes': function() {
          return atom.workspace.open(configUri + "/install");
        },
        'settings-view:view-installed-themes': function() {
          return atom.workspace.open(configUri + "/themes");
        },
        'settings-view:uninstall-themes': function() {
          return atom.workspace.open(configUri + "/themes");
        },
        'settings-view:view-installed-packages': function() {
          return atom.workspace.open(configUri + "/packages");
        },
        'settings-view:uninstall-packages': function() {
          return atom.workspace.open(configUri + "/packages");
        },
        'settings-view:check-for-package-updates': function() {
          return atom.workspace.open(configUri + "/updates");
        }
      });
      if (process.platform === 'win32' && (require('atom').WinShell != null)) {
        return atom.commands.add('atom-workspace', {
          'settings-view:system': function() {
            return atom.workspace.open(configUri + "/system");
          }
        });
      }
    },
    deactivate: function() {
      if (settingsView != null) {
        settingsView.dispose();
      }
      if (settingsView != null) {
        settingsView.remove();
      }
      return settingsView = null;
    },
    consumeStatusBar: function(statusBar) {
      var PackageManager, packageManager;
      PackageManager = require('./package-manager');
      packageManager = new PackageManager();
      return Promise.all([packageManager.getOutdated(), packageManager.getInstalled()]).then(function(values) {
        var PackageUpdatesStatusView, allPackages, outdatedPackages, packageUpdatesStatusView;
        outdatedPackages = values[0];
        allPackages = values[1];
        if (outdatedPackages.length > 0) {
          PackageUpdatesStatusView = require('./package-updates-status-view');
          packageUpdatesStatusView = new PackageUpdatesStatusView(statusBar, outdatedPackages);
        }
        if (allPackages.length > 0 && !localStorage.getItem('hasSeenDeprecatedNotification')) {
          return this.showDeprecatedNotification(allPackages);
        }
      })["catch"](function(error) {
        return console.log(error.message, error.stack);
      });
    },
    consumeSnippets: function(snippets) {
      if (typeof snippets.getUnparsedSnippets === "function") {
        return SnippetsProvider.getSnippets = snippets.getUnparsedSnippets.bind(snippets);
      }
    },
    createSettingsView: function(params) {
      if (SettingsView == null) {
        SettingsView = require('./settings-view');
      }
      params.snippetsProvider = SnippetsProvider;
      return settingsView = new SettingsView(params);
    },
    showDeprecatedNotification: function(packages) {
      var deprecatedPackages, have, notification, pack, packageText, were;
      deprecatedPackages = packages.user.filter(function(arg) {
        var name, version;
        name = arg.name, version = arg.version;
        return atom.packages.isDeprecatedPackage(name, version);
      });
      if (!deprecatedPackages.length) {
        return;
      }
      were = 'were';
      have = 'have';
      packageText = 'packages';
      if (packages.length === 1) {
        packageText = 'package';
        were = 'was';
        have = 'has';
      }
      notification = atom.notifications.addWarning(deprecatedPackages.length + " " + packageText + " " + have + " deprecations and " + were + " not loaded.", {
        description: 'This message will show only one time. Deprecated packages can be viewed in the settings view.',
        detail: ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = deprecatedPackages.length; i < len; i++) {
            pack = deprecatedPackages[i];
            results.push(pack.name);
          }
          return results;
        })()).join(', '),
        dismissable: true,
        buttons: [
          {
            text: 'View Deprecated Packages',
            onDidClick: function() {
              atom.commands.dispatch(atom.views.getView(atom.workspace), 'settings-view:view-installed-packages');
              return notification.dismiss();
            }
          }
        ]
      });
      return localStorage.setItem('hasSeenDeprecatedNotification', true);
    }
  };

  if (parseFloat(atom.getVersion()) < 1.7) {
    atom.deserializers.add({
      name: 'SettingsView',
      deserialize: module.exports.createSettingsView.bind(module.exports)
    });
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsWUFBQSxHQUFlOztFQUNmLFlBQUEsR0FBZTs7RUFFZixnQkFBQSxHQUNFO0lBQUEsV0FBQSxFQUFhLFNBQUE7YUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO0lBQW5DLENBQWI7OztFQUVGLFNBQUEsR0FBWTs7RUFDWixRQUFBLEdBQVc7O0VBRVgsU0FBQSxHQUFZLFNBQUMsWUFBRCxFQUFlLFNBQWYsRUFBMEIsR0FBMUI7QUFDVixRQUFBO0lBQUEsS0FBQSxHQUFRLFFBQVEsQ0FBQyxJQUFULENBQWMsR0FBZDtJQUVSLEtBQUEsbUJBQVEsS0FBTyxDQUFBLENBQUE7SUFDZixNQUFBLG1CQUFTLEtBQU8sQ0FBQSxDQUFBO0lBQ2hCLE9BQUEsR0FBVTtNQUFBLEdBQUEsRUFBSyxHQUFMOztJQUNWLElBQUcsS0FBQSxLQUFTLFVBQVQsSUFBd0IsZ0JBQTNCO01BQ0UsU0FBQSxHQUFZO01BQ1osT0FBTyxDQUFDLElBQVIsR0FBZTtRQUFBLElBQUEsRUFBTSxNQUFOOztNQUNmLElBQTZCLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsTUFBL0IsQ0FBN0I7UUFBQSxPQUFPLENBQUMsSUFBUixHQUFlLFdBQWY7T0FIRjs7V0FLQSxZQUFZLENBQUMsU0FBYixDQUF1QixTQUF2QixFQUFrQyxPQUFsQztFQVhVOztFQWFaLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtNQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBZixDQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUN2Qixj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QUEsQ0FBVyxJQUFJLENBQUMsVUFBTCxDQUFBLENBQVgsQ0FBQSxHQUFnQyxHQUFuQztJQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FDRTtNQUFBLElBQUEsRUFBTSxjQUFOO01BQ0EsV0FBQSxFQUFhLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsSUFBbEMsQ0FBdUMsTUFBTSxDQUFDLE9BQTlDLENBRGI7S0FERixFQURGOztBQXRHQSIsInNvdXJjZXNDb250ZW50IjpbIlNldHRpbmdzVmlldyA9IG51bGxcbnNldHRpbmdzVmlldyA9IG51bGxcblxuU25pcHBldHNQcm92aWRlciA9XG4gIGdldFNuaXBwZXRzOiAtPiBhdG9tLmNvbmZpZy5zY29wZWRTZXR0aW5nc1N0b3JlLnByb3BlcnR5U2V0c1xuXG5jb25maWdVcmkgPSAnYXRvbTovL2NvbmZpZydcbnVyaVJlZ2V4ID0gL2NvbmZpZ1xcLyhbYS16XSspXFwvPyhbYS16QS1aMC05Xy1dKyk/L2lcblxub3BlblBhbmVsID0gKHNldHRpbmdzVmlldywgcGFuZWxOYW1lLCB1cmkpIC0+XG4gIG1hdGNoID0gdXJpUmVnZXguZXhlYyh1cmkpXG5cbiAgcGFuZWwgPSBtYXRjaD9bMV1cbiAgZGV0YWlsID0gbWF0Y2g/WzJdXG4gIG9wdGlvbnMgPSB1cmk6IHVyaVxuICBpZiBwYW5lbCBpcyBcInBhY2thZ2VzXCIgYW5kIGRldGFpbD9cbiAgICBwYW5lbE5hbWUgPSBkZXRhaWxcbiAgICBvcHRpb25zLnBhY2sgPSBuYW1lOiBkZXRhaWxcbiAgICBvcHRpb25zLmJhY2sgPSAnUGFja2FnZXMnIGlmIGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShkZXRhaWwpXG5cbiAgc2V0dGluZ3NWaWV3LnNob3dQYW5lbChwYW5lbE5hbWUsIG9wdGlvbnMpXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyICh1cmkpID0+XG4gICAgICBpZiB1cmkuc3RhcnRzV2l0aChjb25maWdVcmkpXG4gICAgICAgIHNldHRpbmdzVmlldyA/PSBAY3JlYXRlU2V0dGluZ3NWaWV3KHt1cml9KVxuICAgICAgICBpZiBtYXRjaCA9IHVyaVJlZ2V4LmV4ZWModXJpKVxuICAgICAgICAgIHBhbmVsTmFtZSA9IG1hdGNoWzFdXG4gICAgICAgICAgcGFuZWxOYW1lID0gcGFuZWxOYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBwYW5lbE5hbWUuc2xpY2UoMSlcbiAgICAgICAgICBvcGVuUGFuZWwoc2V0dGluZ3NWaWV3LCBwYW5lbE5hbWUsIHVyaSlcbiAgICAgICAgc2V0dGluZ3NWaWV3XG5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ3NldHRpbmdzLXZpZXc6b3Blbic6IC0+IGF0b20ud29ya3NwYWNlLm9wZW4oY29uZmlnVXJpKVxuICAgICAgJ3NldHRpbmdzLXZpZXc6Y29yZSc6IC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCIje2NvbmZpZ1VyaX0vY29yZVwiKVxuICAgICAgJ3NldHRpbmdzLXZpZXc6ZWRpdG9yJzogLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcIiN7Y29uZmlnVXJpfS9lZGl0b3JcIilcbiAgICAgICdzZXR0aW5ncy12aWV3OnNob3cta2V5YmluZGluZ3MnOiAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiI3tjb25maWdVcml9L2tleWJpbmRpbmdzXCIpXG4gICAgICAnc2V0dGluZ3MtdmlldzpjaGFuZ2UtdGhlbWVzJzogLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcIiN7Y29uZmlnVXJpfS90aGVtZXNcIilcbiAgICAgICdzZXR0aW5ncy12aWV3Omluc3RhbGwtcGFja2FnZXMtYW5kLXRoZW1lcyc6IC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCIje2NvbmZpZ1VyaX0vaW5zdGFsbFwiKVxuICAgICAgJ3NldHRpbmdzLXZpZXc6dmlldy1pbnN0YWxsZWQtdGhlbWVzJzogLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcIiN7Y29uZmlnVXJpfS90aGVtZXNcIilcbiAgICAgICdzZXR0aW5ncy12aWV3OnVuaW5zdGFsbC10aGVtZXMnOiAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiI3tjb25maWdVcml9L3RoZW1lc1wiKVxuICAgICAgJ3NldHRpbmdzLXZpZXc6dmlldy1pbnN0YWxsZWQtcGFja2FnZXMnOiAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiI3tjb25maWdVcml9L3BhY2thZ2VzXCIpXG4gICAgICAnc2V0dGluZ3Mtdmlldzp1bmluc3RhbGwtcGFja2FnZXMnOiAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiI3tjb25maWdVcml9L3BhY2thZ2VzXCIpXG4gICAgICAnc2V0dGluZ3MtdmlldzpjaGVjay1mb3ItcGFja2FnZS11cGRhdGVzJzogLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcIiN7Y29uZmlnVXJpfS91cGRhdGVzXCIpXG5cbiAgICBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMicgYW5kIHJlcXVpcmUoJ2F0b20nKS5XaW5TaGVsbD9cbiAgICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdzZXR0aW5ncy12aWV3OnN5c3RlbSc6IC0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCIje2NvbmZpZ1VyaX0vc3lzdGVtXCIpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBzZXR0aW5nc1ZpZXc/LmRpc3Bvc2UoKVxuICAgIHNldHRpbmdzVmlldz8ucmVtb3ZlKClcbiAgICBzZXR0aW5nc1ZpZXcgPSBudWxsXG5cbiAgY29uc3VtZVN0YXR1c0JhcjogKHN0YXR1c0JhcikgLT5cbiAgICBQYWNrYWdlTWFuYWdlciA9IHJlcXVpcmUgJy4vcGFja2FnZS1tYW5hZ2VyJ1xuICAgIHBhY2thZ2VNYW5hZ2VyID0gbmV3IFBhY2thZ2VNYW5hZ2VyKClcbiAgICBQcm9taXNlLmFsbChbcGFja2FnZU1hbmFnZXIuZ2V0T3V0ZGF0ZWQoKSwgcGFja2FnZU1hbmFnZXIuZ2V0SW5zdGFsbGVkKCldKS50aGVuICh2YWx1ZXMpIC0+XG4gICAgICBvdXRkYXRlZFBhY2thZ2VzID0gdmFsdWVzWzBdXG4gICAgICBhbGxQYWNrYWdlcyA9IHZhbHVlc1sxXVxuICAgICAgaWYgb3V0ZGF0ZWRQYWNrYWdlcy5sZW5ndGggPiAwXG4gICAgICAgIFBhY2thZ2VVcGRhdGVzU3RhdHVzVmlldyA9IHJlcXVpcmUgJy4vcGFja2FnZS11cGRhdGVzLXN0YXR1cy12aWV3J1xuICAgICAgICBwYWNrYWdlVXBkYXRlc1N0YXR1c1ZpZXcgPSBuZXcgUGFja2FnZVVwZGF0ZXNTdGF0dXNWaWV3KHN0YXR1c0Jhciwgb3V0ZGF0ZWRQYWNrYWdlcylcblxuICAgICAgaWYgYWxsUGFja2FnZXMubGVuZ3RoID4gMCBhbmQgbm90IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoYXNTZWVuRGVwcmVjYXRlZE5vdGlmaWNhdGlvbicpXG4gICAgICAgIEBzaG93RGVwcmVjYXRlZE5vdGlmaWNhdGlvbihhbGxQYWNrYWdlcylcbiAgICAuY2F0Y2ggKGVycm9yKSAtPlxuICAgICAgY29uc29sZS5sb2cgZXJyb3IubWVzc2FnZSwgZXJyb3Iuc3RhY2tcblxuICBjb25zdW1lU25pcHBldHM6IChzbmlwcGV0cykgLT5cbiAgICBpZiB0eXBlb2Ygc25pcHBldHMuZ2V0VW5wYXJzZWRTbmlwcGV0cyBpcyBcImZ1bmN0aW9uXCJcbiAgICAgIFNuaXBwZXRzUHJvdmlkZXIuZ2V0U25pcHBldHMgPSBzbmlwcGV0cy5nZXRVbnBhcnNlZFNuaXBwZXRzLmJpbmQoc25pcHBldHMpXG5cbiAgY3JlYXRlU2V0dGluZ3NWaWV3OiAocGFyYW1zKSAtPlxuICAgIFNldHRpbmdzVmlldyA/PSByZXF1aXJlICcuL3NldHRpbmdzLXZpZXcnXG4gICAgcGFyYW1zLnNuaXBwZXRzUHJvdmlkZXIgPSBTbmlwcGV0c1Byb3ZpZGVyXG4gICAgc2V0dGluZ3NWaWV3ID0gbmV3IFNldHRpbmdzVmlldyhwYXJhbXMpXG5cbiAgc2hvd0RlcHJlY2F0ZWROb3RpZmljYXRpb246IChwYWNrYWdlcykgLT5cbiAgICBkZXByZWNhdGVkUGFja2FnZXMgPSBwYWNrYWdlcy51c2VyLmZpbHRlciAoe25hbWUsIHZlcnNpb259KSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5pc0RlcHJlY2F0ZWRQYWNrYWdlKG5hbWUsIHZlcnNpb24pXG4gICAgcmV0dXJuIHVubGVzcyBkZXByZWNhdGVkUGFja2FnZXMubGVuZ3RoXG5cbiAgICB3ZXJlID0gJ3dlcmUnXG4gICAgaGF2ZSA9ICdoYXZlJ1xuICAgIHBhY2thZ2VUZXh0ID0gJ3BhY2thZ2VzJ1xuICAgIGlmIHBhY2thZ2VzLmxlbmd0aCBpcyAxXG4gICAgICBwYWNrYWdlVGV4dCA9ICdwYWNrYWdlJ1xuICAgICAgd2VyZSA9ICd3YXMnXG4gICAgICBoYXZlID0gJ2hhcydcbiAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIiN7ZGVwcmVjYXRlZFBhY2thZ2VzLmxlbmd0aH0gI3twYWNrYWdlVGV4dH0gI3toYXZlfSBkZXByZWNhdGlvbnMgYW5kICN7d2VyZX0gbm90IGxvYWRlZC5cIixcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtZXNzYWdlIHdpbGwgc2hvdyBvbmx5IG9uZSB0aW1lLiBEZXByZWNhdGVkIHBhY2thZ2VzIGNhbiBiZSB2aWV3ZWQgaW4gdGhlIHNldHRpbmdzIHZpZXcuJ1xuICAgICAgZGV0YWlsOiAocGFjay5uYW1lIGZvciBwYWNrIGluIGRlcHJlY2F0ZWRQYWNrYWdlcykuam9pbignLCAnKVxuICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgIHRleHQ6ICdWaWV3IERlcHJlY2F0ZWQgUGFja2FnZXMnLFxuICAgICAgICBvbkRpZENsaWNrOiAtPlxuICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3NldHRpbmdzLXZpZXc6dmlldy1pbnN0YWxsZWQtcGFja2FnZXMnKVxuICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKClcbiAgICAgIH1dXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hhc1NlZW5EZXByZWNhdGVkTm90aWZpY2F0aW9uJywgdHJ1ZSlcblxuaWYgcGFyc2VGbG9hdChhdG9tLmdldFZlcnNpb24oKSkgPCAxLjdcbiAgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZFxuICAgIG5hbWU6ICdTZXR0aW5nc1ZpZXcnXG4gICAgZGVzZXJpYWxpemU6IG1vZHVsZS5leHBvcnRzLmNyZWF0ZVNldHRpbmdzVmlldy5iaW5kKG1vZHVsZS5leHBvcnRzKVxuIl19
