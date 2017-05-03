(function() {
  var ApplicationMenu, Menu, _, app, ref;

  ref = require('electron'), app = ref.app, Menu = ref.Menu;

  _ = require('underscore-plus');

  module.exports = ApplicationMenu = (function() {
    function ApplicationMenu(version, autoUpdateManager) {
      this.version = version;
      this.autoUpdateManager = autoUpdateManager;
      this.windowTemplates = new WeakMap();
      this.setActiveTemplate(this.getDefaultTemplate());
      this.autoUpdateManager.on('state-changed', (function(_this) {
        return function(state) {
          return _this.showUpdateMenuItem(state);
        };
      })(this));
    }

    ApplicationMenu.prototype.update = function(window, template, keystrokesByCommand) {
      this.translateTemplate(template, keystrokesByCommand);
      this.substituteVersion(template);
      this.windowTemplates.set(window, template);
      if (window === this.lastFocusedWindow) {
        return this.setActiveTemplate(template);
      }
    };

    ApplicationMenu.prototype.setActiveTemplate = function(template) {
      if (!_.isEqual(template, this.activeTemplate)) {
        this.activeTemplate = template;
        this.menu = Menu.buildFromTemplate(_.deepClone(template));
        Menu.setApplicationMenu(this.menu);
      }
      return this.showUpdateMenuItem(this.autoUpdateManager.getState());
    };

    ApplicationMenu.prototype.addWindow = function(window) {
      var focusHandler;
      if (this.lastFocusedWindow == null) {
        this.lastFocusedWindow = window;
      }
      focusHandler = (function(_this) {
        return function() {
          var template;
          _this.lastFocusedWindow = window;
          if (template = _this.windowTemplates.get(window)) {
            return _this.setActiveTemplate(template);
          }
        };
      })(this);
      window.on('focus', focusHandler);
      window.once('closed', (function(_this) {
        return function() {
          if (window === _this.lastFocusedWindow) {
            _this.lastFocusedWindow = null;
          }
          _this.windowTemplates["delete"](window);
          return window.removeListener('focus', focusHandler);
        };
      })(this));
      return this.enableWindowSpecificItems(true);
    };

    ApplicationMenu.prototype.flattenMenuItems = function(menu) {
      var index, item, items, ref1;
      items = [];
      ref1 = menu.items || {};
      for (index in ref1) {
        item = ref1[index];
        items.push(item);
        if (item.submenu) {
          items = items.concat(this.flattenMenuItems(item.submenu));
        }
      }
      return items;
    };

    ApplicationMenu.prototype.flattenMenuTemplate = function(template) {
      var i, item, items, len;
      items = [];
      for (i = 0, len = template.length; i < len; i++) {
        item = template[i];
        items.push(item);
        if (item.submenu) {
          items = items.concat(this.flattenMenuTemplate(item.submenu));
        }
      }
      return items;
    };

    ApplicationMenu.prototype.enableWindowSpecificItems = function(enable) {
      var i, item, len, ref1, ref2;
      ref1 = this.flattenMenuItems(this.menu);
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        if ((ref2 = item.metadata) != null ? ref2.windowSpecific : void 0) {
          item.enabled = enable;
        }
      }
    };

    ApplicationMenu.prototype.substituteVersion = function(template) {
      var item;
      if ((item = _.find(this.flattenMenuTemplate(template), function(arg) {
        var label;
        label = arg.label;
        return label === 'VERSION';
      }))) {
        return item.label = "Version " + this.version;
      }
    };

    ApplicationMenu.prototype.showUpdateMenuItem = function(state) {
      var checkForUpdateItem, checkingForUpdateItem, downloadingUpdateItem, installUpdateItem;
      checkForUpdateItem = _.find(this.flattenMenuItems(this.menu), function(arg) {
        var label;
        label = arg.label;
        return label === 'Check for Update';
      });
      checkingForUpdateItem = _.find(this.flattenMenuItems(this.menu), function(arg) {
        var label;
        label = arg.label;
        return label === 'Checking for Update';
      });
      downloadingUpdateItem = _.find(this.flattenMenuItems(this.menu), function(arg) {
        var label;
        label = arg.label;
        return label === 'Downloading Update';
      });
      installUpdateItem = _.find(this.flattenMenuItems(this.menu), function(arg) {
        var label;
        label = arg.label;
        return label === 'Restart and Install Update';
      });
      if (!((checkForUpdateItem != null) && (checkingForUpdateItem != null) && (downloadingUpdateItem != null) && (installUpdateItem != null))) {
        return;
      }
      checkForUpdateItem.visible = false;
      checkingForUpdateItem.visible = false;
      downloadingUpdateItem.visible = false;
      installUpdateItem.visible = false;
      switch (state) {
        case 'idle':
        case 'error':
        case 'no-update-available':
          return checkForUpdateItem.visible = true;
        case 'checking':
          return checkingForUpdateItem.visible = true;
        case 'downloading':
          return downloadingUpdateItem.visible = true;
        case 'update-available':
          return installUpdateItem.visible = true;
      }
    };

    ApplicationMenu.prototype.getDefaultTemplate = function() {
      return [
        {
          label: "Atom",
          submenu: [
            {
              label: "Check for Update",
              metadata: {
                autoUpdate: true
              }
            }, {
              label: 'Reload',
              accelerator: 'Command+R',
              click: (function(_this) {
                return function() {
                  var ref1;
                  return (ref1 = _this.focusedWindow()) != null ? ref1.reload() : void 0;
                };
              })(this)
            }, {
              label: 'Close Window',
              accelerator: 'Command+Shift+W',
              click: (function(_this) {
                return function() {
                  var ref1;
                  return (ref1 = _this.focusedWindow()) != null ? ref1.close() : void 0;
                };
              })(this)
            }, {
              label: 'Toggle Dev Tools',
              accelerator: 'Command+Alt+I',
              click: (function(_this) {
                return function() {
                  var ref1;
                  return (ref1 = _this.focusedWindow()) != null ? ref1.toggleDevTools() : void 0;
                };
              })(this)
            }, {
              label: 'Quit',
              accelerator: 'Command+Q',
              click: function() {
                return app.quit();
              }
            }
          ]
        }
      ];
    };

    ApplicationMenu.prototype.focusedWindow = function() {
      return _.find(global.atomApplication.windows, function(atomWindow) {
        return atomWindow.isFocused();
      });
    };

    ApplicationMenu.prototype.translateTemplate = function(template, keystrokesByCommand) {
      template.forEach((function(_this) {
        return function(item) {
          if (item.metadata == null) {
            item.metadata = {};
          }
          if (item.command) {
            item.accelerator = _this.acceleratorForCommand(item.command, keystrokesByCommand);
            item.click = function() {
              return global.atomApplication.sendCommand(item.command, item.commandDetail);
            };
            if (!/^application:/.test(item.command, item.commandDetail)) {
              item.metadata.windowSpecific = true;
            }
          }
          if (item.submenu) {
            return _this.translateTemplate(item.submenu, keystrokesByCommand);
          }
        };
      })(this));
      return template;
    };

    ApplicationMenu.prototype.acceleratorForCommand = function(command, keystrokesByCommand) {
      var firstKeystroke, key, keys, modifiers, ref1;
      firstKeystroke = (ref1 = keystrokesByCommand[command]) != null ? ref1[0] : void 0;
      if (!firstKeystroke) {
        return null;
      }
      modifiers = firstKeystroke.split(/-(?=.)/);
      key = modifiers.pop().toUpperCase().replace('+', 'Plus');
      modifiers = modifiers.map(function(modifier) {
        return modifier.replace(/shift/ig, "Shift").replace(/cmd/ig, "Command").replace(/ctrl/ig, "Ctrl").replace(/alt/ig, "Alt");
      });
      keys = modifiers.concat([key]);
      return keys.join("+");
    };

    return ApplicationMenu;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvYXBwbGljYXRpb24tbWVudS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQWMsT0FBQSxDQUFRLFVBQVIsQ0FBZCxFQUFDLGFBQUQsRUFBTTs7RUFDTixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQU1KLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx5QkFBQyxPQUFELEVBQVcsaUJBQVg7TUFBQyxJQUFDLENBQUEsVUFBRDtNQUFVLElBQUMsQ0FBQSxvQkFBRDtNQUN0QixJQUFDLENBQUEsZUFBRCxHQUF1QixJQUFBLE9BQUEsQ0FBQTtNQUN2QixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBQyxDQUFBLGtCQUFELENBQUEsQ0FBbkI7TUFDQSxJQUFDLENBQUEsaUJBQWlCLENBQUMsRUFBbkIsQ0FBc0IsZUFBdEIsRUFBdUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7aUJBQVcsS0FBQyxDQUFBLGtCQUFELENBQW9CLEtBQXBCO1FBQVg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZDO0lBSFc7OzhCQVdiLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEVBQW1CLG1CQUFuQjtNQUNOLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixRQUFuQixFQUE2QixtQkFBN0I7TUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsUUFBbkI7TUFDQSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLE1BQXJCLEVBQTZCLFFBQTdCO01BQ0EsSUFBZ0MsTUFBQSxLQUFVLElBQUMsQ0FBQSxpQkFBM0M7ZUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsUUFBbkIsRUFBQTs7SUFKTTs7OEJBTVIsaUJBQUEsR0FBbUIsU0FBQyxRQUFEO01BQ2pCLElBQUEsQ0FBTyxDQUFDLENBQUMsT0FBRixDQUFVLFFBQVYsRUFBb0IsSUFBQyxDQUFBLGNBQXJCLENBQVA7UUFDRSxJQUFDLENBQUEsY0FBRCxHQUFrQjtRQUNsQixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksQ0FBQyxpQkFBTCxDQUF1QixDQUFDLENBQUMsU0FBRixDQUFZLFFBQVosQ0FBdkI7UUFDUixJQUFJLENBQUMsa0JBQUwsQ0FBd0IsSUFBQyxDQUFBLElBQXpCLEVBSEY7O2FBS0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxRQUFuQixDQUFBLENBQXBCO0lBTmlCOzs4QkFTbkIsU0FBQSxHQUFXLFNBQUMsTUFBRDtBQUNULFVBQUE7O1FBQUEsSUFBQyxDQUFBLG9CQUFxQjs7TUFFdEIsWUFBQSxHQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNiLGNBQUE7VUFBQSxLQUFDLENBQUEsaUJBQUQsR0FBcUI7VUFDckIsSUFBRyxRQUFBLEdBQVcsS0FBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixNQUFyQixDQUFkO21CQUNFLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixRQUFuQixFQURGOztRQUZhO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUtmLE1BQU0sQ0FBQyxFQUFQLENBQVUsT0FBVixFQUFtQixZQUFuQjtNQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksUUFBWixFQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDcEIsSUFBNkIsTUFBQSxLQUFVLEtBQUMsQ0FBQSxpQkFBeEM7WUFBQSxLQUFDLENBQUEsaUJBQUQsR0FBcUIsS0FBckI7O1VBQ0EsS0FBQyxDQUFBLGVBQWUsRUFBQyxNQUFELEVBQWhCLENBQXdCLE1BQXhCO2lCQUNBLE1BQU0sQ0FBQyxjQUFQLENBQXNCLE9BQXRCLEVBQStCLFlBQS9CO1FBSG9CO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjthQUtBLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixJQUEzQjtJQWRTOzs4QkFxQlgsZ0JBQUEsR0FBa0IsU0FBQyxJQUFEO0FBQ2hCLFVBQUE7TUFBQSxLQUFBLEdBQVE7QUFDUjtBQUFBLFdBQUEsYUFBQTs7UUFDRSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7UUFDQSxJQUF5RCxJQUFJLENBQUMsT0FBOUQ7VUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBSSxDQUFDLE9BQXZCLENBQWIsRUFBUjs7QUFGRjthQUdBO0lBTGdCOzs4QkFZbEIsbUJBQUEsR0FBcUIsU0FBQyxRQUFEO0FBQ25CLFVBQUE7TUFBQSxLQUFBLEdBQVE7QUFDUixXQUFBLDBDQUFBOztRQUNFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtRQUNBLElBQTRELElBQUksQ0FBQyxPQUFqRTtVQUFBLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixDQUFhLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixJQUFJLENBQUMsT0FBMUIsQ0FBYixFQUFSOztBQUZGO2FBR0E7SUFMbUI7OzhCQVdyQix5QkFBQSxHQUEyQixTQUFDLE1BQUQ7QUFDekIsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSx5Q0FBc0MsQ0FBRSx1QkFBeEM7VUFBQSxJQUFJLENBQUMsT0FBTCxHQUFlLE9BQWY7O0FBREY7SUFEeUI7OzhCQU0zQixpQkFBQSxHQUFtQixTQUFDLFFBQUQ7QUFDakIsVUFBQTtNQUFBLElBQUcsQ0FBQyxJQUFBLEdBQU8sQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsUUFBckIsQ0FBUCxFQUF1QyxTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZLEtBQUEsS0FBUztNQUF0QixDQUF2QyxDQUFSLENBQUg7ZUFDRSxJQUFJLENBQUMsS0FBTCxHQUFhLFVBQUEsR0FBVyxJQUFDLENBQUEsUUFEM0I7O0lBRGlCOzs4QkFLbkIsa0JBQUEsR0FBb0IsU0FBQyxLQUFEO0FBQ2xCLFVBQUE7TUFBQSxrQkFBQSxHQUFxQixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsSUFBbkIsQ0FBUCxFQUFpQyxTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZLEtBQUEsS0FBUztNQUF0QixDQUFqQztNQUNyQixxQkFBQSxHQUF3QixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsSUFBbkIsQ0FBUCxFQUFpQyxTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZLEtBQUEsS0FBUztNQUF0QixDQUFqQztNQUN4QixxQkFBQSxHQUF3QixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsSUFBbkIsQ0FBUCxFQUFpQyxTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZLEtBQUEsS0FBUztNQUF0QixDQUFqQztNQUN4QixpQkFBQSxHQUFvQixDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsSUFBbkIsQ0FBUCxFQUFpQyxTQUFDLEdBQUQ7QUFBYSxZQUFBO1FBQVgsUUFBRDtlQUFZLEtBQUEsS0FBUztNQUF0QixDQUFqQztNQUVwQixJQUFBLENBQUEsQ0FBYyw0QkFBQSxJQUF3QiwrQkFBeEIsSUFBbUQsK0JBQW5ELElBQThFLDJCQUE1RixDQUFBO0FBQUEsZUFBQTs7TUFFQSxrQkFBa0IsQ0FBQyxPQUFuQixHQUE2QjtNQUM3QixxQkFBcUIsQ0FBQyxPQUF0QixHQUFnQztNQUNoQyxxQkFBcUIsQ0FBQyxPQUF0QixHQUFnQztNQUNoQyxpQkFBaUIsQ0FBQyxPQUFsQixHQUE0QjtBQUU1QixjQUFPLEtBQVA7QUFBQSxhQUNPLE1BRFA7QUFBQSxhQUNlLE9BRGY7QUFBQSxhQUN3QixxQkFEeEI7aUJBRUksa0JBQWtCLENBQUMsT0FBbkIsR0FBNkI7QUFGakMsYUFHTyxVQUhQO2lCQUlJLHFCQUFxQixDQUFDLE9BQXRCLEdBQWdDO0FBSnBDLGFBS08sYUFMUDtpQkFNSSxxQkFBcUIsQ0FBQyxPQUF0QixHQUFnQztBQU5wQyxhQU9PLGtCQVBQO2lCQVFJLGlCQUFpQixDQUFDLE9BQWxCLEdBQTRCO0FBUmhDO0lBYmtCOzs4QkEwQnBCLGtCQUFBLEdBQW9CLFNBQUE7YUFDbEI7UUFDRTtVQUFBLEtBQUEsRUFBTyxNQUFQO1VBQ0EsT0FBQSxFQUFTO1lBQ0w7Y0FBQyxLQUFBLEVBQU8sa0JBQVI7Y0FBNEIsUUFBQSxFQUFVO2dCQUFDLFVBQUEsRUFBWSxJQUFiO2VBQXRDO2FBREssRUFFTDtjQUFDLEtBQUEsRUFBTyxRQUFSO2NBQWtCLFdBQUEsRUFBYSxXQUEvQjtjQUE0QyxLQUFBLEVBQU8sQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQTtBQUFHLHNCQUFBO3NFQUFnQixDQUFFLE1BQWxCLENBQUE7Z0JBQUg7Y0FBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5EO2FBRkssRUFHTDtjQUFDLEtBQUEsRUFBTyxjQUFSO2NBQXdCLFdBQUEsRUFBYSxpQkFBckM7Y0FBd0QsS0FBQSxFQUFPLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7QUFBRyxzQkFBQTtzRUFBZ0IsQ0FBRSxLQUFsQixDQUFBO2dCQUFIO2NBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEvRDthQUhLLEVBSUw7Y0FBQyxLQUFBLEVBQU8sa0JBQVI7Y0FBNEIsV0FBQSxFQUFhLGVBQXpDO2NBQTBELEtBQUEsRUFBTyxDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO0FBQUcsc0JBQUE7c0VBQWdCLENBQUUsY0FBbEIsQ0FBQTtnQkFBSDtjQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakU7YUFKSyxFQUtMO2NBQUMsS0FBQSxFQUFPLE1BQVI7Y0FBZ0IsV0FBQSxFQUFhLFdBQTdCO2NBQTBDLEtBQUEsRUFBTyxTQUFBO3VCQUFHLEdBQUcsQ0FBQyxJQUFKLENBQUE7Y0FBSCxDQUFqRDthQUxLO1dBRFQ7U0FERjs7SUFEa0I7OzhCQVlwQixhQUFBLEdBQWUsU0FBQTthQUNiLENBQUMsQ0FBQyxJQUFGLENBQU8sTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUE5QixFQUF1QyxTQUFDLFVBQUQ7ZUFBZ0IsVUFBVSxDQUFDLFNBQVgsQ0FBQTtNQUFoQixDQUF2QztJQURhOzs4QkFXZixpQkFBQSxHQUFtQixTQUFDLFFBQUQsRUFBVyxtQkFBWDtNQUNqQixRQUFRLENBQUMsT0FBVCxDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsSUFBRDs7WUFDZixJQUFJLENBQUMsV0FBWTs7VUFDakIsSUFBRyxJQUFJLENBQUMsT0FBUjtZQUNFLElBQUksQ0FBQyxXQUFMLEdBQW1CLEtBQUMsQ0FBQSxxQkFBRCxDQUF1QixJQUFJLENBQUMsT0FBNUIsRUFBcUMsbUJBQXJDO1lBQ25CLElBQUksQ0FBQyxLQUFMLEdBQWEsU0FBQTtxQkFBRyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQXZCLENBQW1DLElBQUksQ0FBQyxPQUF4QyxFQUFpRCxJQUFJLENBQUMsYUFBdEQ7WUFBSDtZQUNiLElBQUEsQ0FBMkMsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQUksQ0FBQyxPQUExQixFQUFtQyxJQUFJLENBQUMsYUFBeEMsQ0FBM0M7Y0FBQSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWQsR0FBK0IsS0FBL0I7YUFIRjs7VUFJQSxJQUF5RCxJQUFJLENBQUMsT0FBOUQ7bUJBQUEsS0FBQyxDQUFBLGlCQUFELENBQW1CLElBQUksQ0FBQyxPQUF4QixFQUFpQyxtQkFBakMsRUFBQTs7UUFOZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7YUFPQTtJQVJpQjs7OEJBa0JuQixxQkFBQSxHQUF1QixTQUFDLE9BQUQsRUFBVSxtQkFBVjtBQUNyQixVQUFBO01BQUEsY0FBQSx1REFBK0MsQ0FBQSxDQUFBO01BQy9DLElBQUEsQ0FBbUIsY0FBbkI7QUFBQSxlQUFPLEtBQVA7O01BRUEsU0FBQSxHQUFZLGNBQWMsQ0FBQyxLQUFmLENBQXFCLFFBQXJCO01BQ1osR0FBQSxHQUFNLFNBQVMsQ0FBQyxHQUFWLENBQUEsQ0FBZSxDQUFDLFdBQWhCLENBQUEsQ0FBNkIsQ0FBQyxPQUE5QixDQUFzQyxHQUF0QyxFQUEyQyxNQUEzQztNQUVOLFNBQUEsR0FBWSxTQUFTLENBQUMsR0FBVixDQUFjLFNBQUMsUUFBRDtlQUN4QixRQUFRLENBQUMsT0FBVCxDQUFpQixTQUFqQixFQUE0QixPQUE1QixDQUNRLENBQUMsT0FEVCxDQUNpQixPQURqQixFQUMwQixTQUQxQixDQUVRLENBQUMsT0FGVCxDQUVpQixRQUZqQixFQUUyQixNQUYzQixDQUdRLENBQUMsT0FIVCxDQUdpQixPQUhqQixFQUcwQixLQUgxQjtNQUR3QixDQUFkO01BTVosSUFBQSxHQUFPLFNBQVMsQ0FBQyxNQUFWLENBQWlCLENBQUMsR0FBRCxDQUFqQjthQUNQLElBQUksQ0FBQyxJQUFMLENBQVUsR0FBVjtJQWRxQjs7Ozs7QUE3SnpCIiwic291cmNlc0NvbnRlbnQiOlsie2FwcCwgTWVudX0gPSByZXF1aXJlICdlbGVjdHJvbidcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbiMgVXNlZCB0byBtYW5hZ2UgdGhlIGdsb2JhbCBhcHBsaWNhdGlvbiBtZW51LlxuI1xuIyBJdCdzIGNyZWF0ZWQgYnkge0F0b21BcHBsaWNhdGlvbn0gdXBvbiBpbnN0YW50aWF0aW9uIGFuZCB1c2VkIHRvIGFkZCwgcmVtb3ZlXG4jIGFuZCBtYWludGFpbiB0aGUgc3RhdGUgb2YgYWxsIG1lbnUgaXRlbXMuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBcHBsaWNhdGlvbk1lbnVcbiAgY29uc3RydWN0b3I6IChAdmVyc2lvbiwgQGF1dG9VcGRhdGVNYW5hZ2VyKSAtPlxuICAgIEB3aW5kb3dUZW1wbGF0ZXMgPSBuZXcgV2Vha01hcCgpXG4gICAgQHNldEFjdGl2ZVRlbXBsYXRlKEBnZXREZWZhdWx0VGVtcGxhdGUoKSlcbiAgICBAYXV0b1VwZGF0ZU1hbmFnZXIub24gJ3N0YXRlLWNoYW5nZWQnLCAoc3RhdGUpID0+IEBzaG93VXBkYXRlTWVudUl0ZW0oc3RhdGUpXG5cbiAgIyBQdWJsaWM6IFVwZGF0ZXMgdGhlIGVudGlyZSBtZW51IHdpdGggdGhlIGdpdmVuIGtleWJpbmRpbmdzLlxuICAjXG4gICMgd2luZG93IC0gVGhlIEJyb3dzZXJXaW5kb3cgdGhpcyBtZW51IHRlbXBsYXRlIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgIyB0ZW1wbGF0ZSAtIFRoZSBPYmplY3Qgd2hpY2ggZGVzY3JpYmVzIHRoZSBtZW51IHRvIGRpc3BsYXkuXG4gICMga2V5c3Ryb2tlc0J5Q29tbWFuZCAtIEFuIE9iamVjdCB3aGVyZSB0aGUga2V5cyBhcmUgY29tbWFuZHMgYW5kIHRoZSB2YWx1ZXNcbiAgIyAgICAgICAgICAgICAgICAgICAgICAgYXJlIEFycmF5cyBjb250YWluaW5nIHRoZSBrZXlzdHJva2UuXG4gIHVwZGF0ZTogKHdpbmRvdywgdGVtcGxhdGUsIGtleXN0cm9rZXNCeUNvbW1hbmQpIC0+XG4gICAgQHRyYW5zbGF0ZVRlbXBsYXRlKHRlbXBsYXRlLCBrZXlzdHJva2VzQnlDb21tYW5kKVxuICAgIEBzdWJzdGl0dXRlVmVyc2lvbih0ZW1wbGF0ZSlcbiAgICBAd2luZG93VGVtcGxhdGVzLnNldCh3aW5kb3csIHRlbXBsYXRlKVxuICAgIEBzZXRBY3RpdmVUZW1wbGF0ZSh0ZW1wbGF0ZSkgaWYgd2luZG93IGlzIEBsYXN0Rm9jdXNlZFdpbmRvd1xuXG4gIHNldEFjdGl2ZVRlbXBsYXRlOiAodGVtcGxhdGUpIC0+XG4gICAgdW5sZXNzIF8uaXNFcXVhbCh0ZW1wbGF0ZSwgQGFjdGl2ZVRlbXBsYXRlKVxuICAgICAgQGFjdGl2ZVRlbXBsYXRlID0gdGVtcGxhdGVcbiAgICAgIEBtZW51ID0gTWVudS5idWlsZEZyb21UZW1wbGF0ZShfLmRlZXBDbG9uZSh0ZW1wbGF0ZSkpXG4gICAgICBNZW51LnNldEFwcGxpY2F0aW9uTWVudShAbWVudSlcblxuICAgIEBzaG93VXBkYXRlTWVudUl0ZW0oQGF1dG9VcGRhdGVNYW5hZ2VyLmdldFN0YXRlKCkpXG5cbiAgIyBSZWdpc3RlciBhIEJyb3dzZXJXaW5kb3cgd2l0aCB0aGlzIGFwcGxpY2F0aW9uIG1lbnUuXG4gIGFkZFdpbmRvdzogKHdpbmRvdykgLT5cbiAgICBAbGFzdEZvY3VzZWRXaW5kb3cgPz0gd2luZG93XG5cbiAgICBmb2N1c0hhbmRsZXIgPSA9PlxuICAgICAgQGxhc3RGb2N1c2VkV2luZG93ID0gd2luZG93XG4gICAgICBpZiB0ZW1wbGF0ZSA9IEB3aW5kb3dUZW1wbGF0ZXMuZ2V0KHdpbmRvdylcbiAgICAgICAgQHNldEFjdGl2ZVRlbXBsYXRlKHRlbXBsYXRlKVxuXG4gICAgd2luZG93Lm9uICdmb2N1cycsIGZvY3VzSGFuZGxlclxuICAgIHdpbmRvdy5vbmNlICdjbG9zZWQnLCA9PlxuICAgICAgQGxhc3RGb2N1c2VkV2luZG93ID0gbnVsbCBpZiB3aW5kb3cgaXMgQGxhc3RGb2N1c2VkV2luZG93XG4gICAgICBAd2luZG93VGVtcGxhdGVzLmRlbGV0ZSh3aW5kb3cpXG4gICAgICB3aW5kb3cucmVtb3ZlTGlzdGVuZXIgJ2ZvY3VzJywgZm9jdXNIYW5kbGVyXG5cbiAgICBAZW5hYmxlV2luZG93U3BlY2lmaWNJdGVtcyh0cnVlKVxuXG4gICMgRmxhdHRlbnMgdGhlIGdpdmVuIG1lbnUgYW5kIHN1Ym1lbnUgaXRlbXMgaW50byBhbiBzaW5nbGUgQXJyYXkuXG4gICNcbiAgIyBtZW51IC0gQSBjb21wbGV0ZSBtZW51IGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciBhdG9tLXNoZWxsJ3MgbWVudSBBUEkuXG4gICNcbiAgIyBSZXR1cm5zIGFuIEFycmF5IG9mIG5hdGl2ZSBtZW51IGl0ZW1zLlxuICBmbGF0dGVuTWVudUl0ZW1zOiAobWVudSkgLT5cbiAgICBpdGVtcyA9IFtdXG4gICAgZm9yIGluZGV4LCBpdGVtIG9mIG1lbnUuaXRlbXMgb3Ige31cbiAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KEBmbGF0dGVuTWVudUl0ZW1zKGl0ZW0uc3VibWVudSkpIGlmIGl0ZW0uc3VibWVudVxuICAgIGl0ZW1zXG5cbiAgIyBGbGF0dGVucyB0aGUgZ2l2ZW4gbWVudSB0ZW1wbGF0ZSBpbnRvIGFuIHNpbmdsZSBBcnJheS5cbiAgI1xuICAjIHRlbXBsYXRlIC0gQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIG1lbnUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYW4gQXJyYXkgb2YgbmF0aXZlIG1lbnUgaXRlbXMuXG4gIGZsYXR0ZW5NZW51VGVtcGxhdGU6ICh0ZW1wbGF0ZSkgLT5cbiAgICBpdGVtcyA9IFtdXG4gICAgZm9yIGl0ZW0gaW4gdGVtcGxhdGVcbiAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KEBmbGF0dGVuTWVudVRlbXBsYXRlKGl0ZW0uc3VibWVudSkpIGlmIGl0ZW0uc3VibWVudVxuICAgIGl0ZW1zXG5cbiAgIyBQdWJsaWM6IFVzZWQgdG8gbWFrZSBhbGwgd2luZG93IHJlbGF0ZWQgbWVudSBpdGVtcyBhcmUgYWN0aXZlLlxuICAjXG4gICMgZW5hYmxlIC0gSWYgdHJ1ZSBlbmFibGVzIGFsbCB3aW5kb3cgc3BlY2lmaWMgaXRlbXMsIGlmIGZhbHNlIGRpc2FibGVzIGFsbFxuICAjICAgICAgICAgIHdpbmRvdyBzcGVjaWZpYyBpdGVtcy5cbiAgZW5hYmxlV2luZG93U3BlY2lmaWNJdGVtczogKGVuYWJsZSkgLT5cbiAgICBmb3IgaXRlbSBpbiBAZmxhdHRlbk1lbnVJdGVtcyhAbWVudSlcbiAgICAgIGl0ZW0uZW5hYmxlZCA9IGVuYWJsZSBpZiBpdGVtLm1ldGFkYXRhPy53aW5kb3dTcGVjaWZpY1xuICAgIHJldHVyblxuXG4gICMgUmVwbGFjZXMgVkVSU0lPTiB3aXRoIHRoZSBjdXJyZW50IHZlcnNpb24uXG4gIHN1YnN0aXR1dGVWZXJzaW9uOiAodGVtcGxhdGUpIC0+XG4gICAgaWYgKGl0ZW0gPSBfLmZpbmQoQGZsYXR0ZW5NZW51VGVtcGxhdGUodGVtcGxhdGUpLCAoe2xhYmVsfSkgLT4gbGFiZWwgaXMgJ1ZFUlNJT04nKSlcbiAgICAgIGl0ZW0ubGFiZWwgPSBcIlZlcnNpb24gI3tAdmVyc2lvbn1cIlxuXG4gICMgU2V0cyB0aGUgcHJvcGVyIHZpc2libGUgc3RhdGUgdGhlIHVwZGF0ZSBtZW51IGl0ZW1zXG4gIHNob3dVcGRhdGVNZW51SXRlbTogKHN0YXRlKSAtPlxuICAgIGNoZWNrRm9yVXBkYXRlSXRlbSA9IF8uZmluZChAZmxhdHRlbk1lbnVJdGVtcyhAbWVudSksICh7bGFiZWx9KSAtPiBsYWJlbCBpcyAnQ2hlY2sgZm9yIFVwZGF0ZScpXG4gICAgY2hlY2tpbmdGb3JVcGRhdGVJdGVtID0gXy5maW5kKEBmbGF0dGVuTWVudUl0ZW1zKEBtZW51KSwgKHtsYWJlbH0pIC0+IGxhYmVsIGlzICdDaGVja2luZyBmb3IgVXBkYXRlJylcbiAgICBkb3dubG9hZGluZ1VwZGF0ZUl0ZW0gPSBfLmZpbmQoQGZsYXR0ZW5NZW51SXRlbXMoQG1lbnUpLCAoe2xhYmVsfSkgLT4gbGFiZWwgaXMgJ0Rvd25sb2FkaW5nIFVwZGF0ZScpXG4gICAgaW5zdGFsbFVwZGF0ZUl0ZW0gPSBfLmZpbmQoQGZsYXR0ZW5NZW51SXRlbXMoQG1lbnUpLCAoe2xhYmVsfSkgLT4gbGFiZWwgaXMgJ1Jlc3RhcnQgYW5kIEluc3RhbGwgVXBkYXRlJylcblxuICAgIHJldHVybiB1bmxlc3MgY2hlY2tGb3JVcGRhdGVJdGVtPyBhbmQgY2hlY2tpbmdGb3JVcGRhdGVJdGVtPyBhbmQgZG93bmxvYWRpbmdVcGRhdGVJdGVtPyBhbmQgaW5zdGFsbFVwZGF0ZUl0ZW0/XG5cbiAgICBjaGVja0ZvclVwZGF0ZUl0ZW0udmlzaWJsZSA9IGZhbHNlXG4gICAgY2hlY2tpbmdGb3JVcGRhdGVJdGVtLnZpc2libGUgPSBmYWxzZVxuICAgIGRvd25sb2FkaW5nVXBkYXRlSXRlbS52aXNpYmxlID0gZmFsc2VcbiAgICBpbnN0YWxsVXBkYXRlSXRlbS52aXNpYmxlID0gZmFsc2VcblxuICAgIHN3aXRjaCBzdGF0ZVxuICAgICAgd2hlbiAnaWRsZScsICdlcnJvcicsICduby11cGRhdGUtYXZhaWxhYmxlJ1xuICAgICAgICBjaGVja0ZvclVwZGF0ZUl0ZW0udmlzaWJsZSA9IHRydWVcbiAgICAgIHdoZW4gJ2NoZWNraW5nJ1xuICAgICAgICBjaGVja2luZ0ZvclVwZGF0ZUl0ZW0udmlzaWJsZSA9IHRydWVcbiAgICAgIHdoZW4gJ2Rvd25sb2FkaW5nJ1xuICAgICAgICBkb3dubG9hZGluZ1VwZGF0ZUl0ZW0udmlzaWJsZSA9IHRydWVcbiAgICAgIHdoZW4gJ3VwZGF0ZS1hdmFpbGFibGUnXG4gICAgICAgIGluc3RhbGxVcGRhdGVJdGVtLnZpc2libGUgPSB0cnVlXG5cbiAgIyBEZWZhdWx0IGxpc3Qgb2YgbWVudSBpdGVtcy5cbiAgI1xuICAjIFJldHVybnMgYW4gQXJyYXkgb2YgbWVudSBpdGVtIE9iamVjdHMuXG4gIGdldERlZmF1bHRUZW1wbGF0ZTogLT5cbiAgICBbXG4gICAgICBsYWJlbDogXCJBdG9tXCJcbiAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICB7bGFiZWw6IFwiQ2hlY2sgZm9yIFVwZGF0ZVwiLCBtZXRhZGF0YToge2F1dG9VcGRhdGU6IHRydWV9fVxuICAgICAgICAgIHtsYWJlbDogJ1JlbG9hZCcsIGFjY2VsZXJhdG9yOiAnQ29tbWFuZCtSJywgY2xpY2s6ID0+IEBmb2N1c2VkV2luZG93KCk/LnJlbG9hZCgpfVxuICAgICAgICAgIHtsYWJlbDogJ0Nsb3NlIFdpbmRvdycsIGFjY2VsZXJhdG9yOiAnQ29tbWFuZCtTaGlmdCtXJywgY2xpY2s6ID0+IEBmb2N1c2VkV2luZG93KCk/LmNsb3NlKCl9XG4gICAgICAgICAge2xhYmVsOiAnVG9nZ2xlIERldiBUb29scycsIGFjY2VsZXJhdG9yOiAnQ29tbWFuZCtBbHQrSScsIGNsaWNrOiA9PiBAZm9jdXNlZFdpbmRvdygpPy50b2dnbGVEZXZUb29scygpfVxuICAgICAgICAgIHtsYWJlbDogJ1F1aXQnLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrUScsIGNsaWNrOiAtPiBhcHAucXVpdCgpfVxuICAgICAgXVxuICAgIF1cblxuICBmb2N1c2VkV2luZG93OiAtPlxuICAgIF8uZmluZCBnbG9iYWwuYXRvbUFwcGxpY2F0aW9uLndpbmRvd3MsIChhdG9tV2luZG93KSAtPiBhdG9tV2luZG93LmlzRm9jdXNlZCgpXG5cbiAgIyBDb21iaW5lcyBhIG1lbnUgdGVtcGxhdGUgd2l0aCB0aGUgYXBwcm9wcmlhdGUga2V5c3Ryb2tlLlxuICAjXG4gICMgdGVtcGxhdGUgLSBBbiBPYmplY3QgY29uZm9ybWluZyB0byBhdG9tLXNoZWxsJ3MgbWVudSBhcGkgYnV0IGxhY2tpbmdcbiAgIyAgICAgICAgICAgIGFjY2VsZXJhdG9yIGFuZCBjbGljayBwcm9wZXJ0aWVzLlxuICAjIGtleXN0cm9rZXNCeUNvbW1hbmQgLSBBbiBPYmplY3Qgd2hlcmUgdGhlIGtleXMgYXJlIGNvbW1hbmRzIGFuZCB0aGUgdmFsdWVzXG4gICMgICAgICAgICAgICAgICAgICAgICAgIGFyZSBBcnJheXMgY29udGFpbmluZyB0aGUga2V5c3Ryb2tlLlxuICAjXG4gICMgUmV0dXJucyBhIGNvbXBsZXRlIG1lbnUgY29uZmlndXJhdGlvbiBvYmplY3QgZm9yIGF0b20tc2hlbGwncyBtZW51IEFQSS5cbiAgdHJhbnNsYXRlVGVtcGxhdGU6ICh0ZW1wbGF0ZSwga2V5c3Ryb2tlc0J5Q29tbWFuZCkgLT5cbiAgICB0ZW1wbGF0ZS5mb3JFYWNoIChpdGVtKSA9PlxuICAgICAgaXRlbS5tZXRhZGF0YSA/PSB7fVxuICAgICAgaWYgaXRlbS5jb21tYW5kXG4gICAgICAgIGl0ZW0uYWNjZWxlcmF0b3IgPSBAYWNjZWxlcmF0b3JGb3JDb21tYW5kKGl0ZW0uY29tbWFuZCwga2V5c3Ryb2tlc0J5Q29tbWFuZClcbiAgICAgICAgaXRlbS5jbGljayA9IC0+IGdsb2JhbC5hdG9tQXBwbGljYXRpb24uc2VuZENvbW1hbmQoaXRlbS5jb21tYW5kLCBpdGVtLmNvbW1hbmREZXRhaWwpXG4gICAgICAgIGl0ZW0ubWV0YWRhdGEud2luZG93U3BlY2lmaWMgPSB0cnVlIHVubGVzcyAvXmFwcGxpY2F0aW9uOi8udGVzdChpdGVtLmNvbW1hbmQsIGl0ZW0uY29tbWFuZERldGFpbClcbiAgICAgIEB0cmFuc2xhdGVUZW1wbGF0ZShpdGVtLnN1Ym1lbnUsIGtleXN0cm9rZXNCeUNvbW1hbmQpIGlmIGl0ZW0uc3VibWVudVxuICAgIHRlbXBsYXRlXG5cbiAgIyBEZXRlcm1pbmUgdGhlIGFjY2VsZXJhdG9yIGZvciBhIGdpdmVuIGNvbW1hbmQuXG4gICNcbiAgIyBjb21tYW5kIC0gVGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQuXG4gICMga2V5c3Ryb2tlc0J5Q29tbWFuZCAtIEFuIE9iamVjdCB3aGVyZSB0aGUga2V5cyBhcmUgY29tbWFuZHMgYW5kIHRoZSB2YWx1ZXNcbiAgIyAgICAgICAgICAgICAgICAgICAgICAgYXJlIEFycmF5cyBjb250YWluaW5nIHRoZSBrZXlzdHJva2UuXG4gICNcbiAgIyBSZXR1cm5zIGEgU3RyaW5nIGNvbnRhaW5pbmcgdGhlIGtleXN0cm9rZSBpbiBhIGZvcm1hdCB0aGF0IGNhbiBiZSBpbnRlcnByZXRlZFxuICAjICAgYnkgYXRvbSBzaGVsbCB0byBwcm92aWRlIG5pY2UgaWNvbnMgd2hlcmUgYXZhaWxhYmxlLlxuICBhY2NlbGVyYXRvckZvckNvbW1hbmQ6IChjb21tYW5kLCBrZXlzdHJva2VzQnlDb21tYW5kKSAtPlxuICAgIGZpcnN0S2V5c3Ryb2tlID0ga2V5c3Ryb2tlc0J5Q29tbWFuZFtjb21tYW5kXT9bMF1cbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgZmlyc3RLZXlzdHJva2VcblxuICAgIG1vZGlmaWVycyA9IGZpcnN0S2V5c3Ryb2tlLnNwbGl0KC8tKD89LikvKVxuICAgIGtleSA9IG1vZGlmaWVycy5wb3AoKS50b1VwcGVyQ2FzZSgpLnJlcGxhY2UoJysnLCAnUGx1cycpXG5cbiAgICBtb2RpZmllcnMgPSBtb2RpZmllcnMubWFwIChtb2RpZmllcikgLT5cbiAgICAgIG1vZGlmaWVyLnJlcGxhY2UoL3NoaWZ0L2lnLCBcIlNoaWZ0XCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9jbWQvaWcsIFwiQ29tbWFuZFwiKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvY3RybC9pZywgXCJDdHJsXCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9hbHQvaWcsIFwiQWx0XCIpXG5cbiAgICBrZXlzID0gbW9kaWZpZXJzLmNvbmNhdChba2V5XSlcbiAgICBrZXlzLmpvaW4oXCIrXCIpXG4iXX0=
