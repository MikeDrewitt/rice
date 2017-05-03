(function() {
  var ScrollView, SettingsPanel, SystemPanel, WinShell,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ScrollView = require('atom-space-pen-views').ScrollView;

  WinShell = require('atom').WinShell;

  SettingsPanel = require('./settings-panel');

  module.exports = SystemPanel = (function(superClass) {
    extend(SystemPanel, superClass);

    function SystemPanel() {
      return SystemPanel.__super__.constructor.apply(this, arguments);
    }

    SystemPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.form({
            "class": 'general-panel section'
          }, function() {
            return _this.div({
              "class": 'settings-panel'
            }, function() {
              return _this.div({
                "class": 'section-container'
              }, function() {
                _this.div({
                  "class": 'block section-heading icon icon-device-desktop'
                }, 'System Settings');
                _this.div({
                  "class": 'text icon icon-question'
                }, 'These settings determine how Atom integrates with your operating system.');
                return _this.div({
                  "class": 'section-body'
                }, function() {
                  _this.div({
                    "class": 'control-group'
                  }, function() {
                    return _this.div({
                      "class": 'controls'
                    }, function() {
                      return _this.div({
                        "class": 'checkbox'
                      }, function() {
                        return _this.label({
                          "for": 'system.windows.file-handler'
                        }, function() {
                          _this.input({
                            outlet: 'fileHandlerCheckbox',
                            id: 'system.windows.file-handler',
                            type: 'checkbox'
                          });
                          _this.div({
                            "class": 'setting-title'
                          }, 'Register as file handler');
                          return _this.div({
                            "class": 'setting-description'
                          }, function() {
                            return _this.raw("Show " + WinShell.appName + " in the \"Open with\" application list for easy association with file types.");
                          });
                        });
                      });
                    });
                  });
                  _this.div({
                    "class": 'control-group'
                  }, function() {
                    return _this.div({
                      "class": 'controls'
                    }, function() {
                      return _this.div({
                        "class": 'checkbox'
                      }, function() {
                        return _this.label({
                          "for": 'system.windows.shell-menu-files'
                        }, function() {
                          _this.input({
                            outlet: 'fileContextMenuCheckbox',
                            id: 'system.windows.shell-menu-files',
                            type: 'checkbox'
                          });
                          _this.div({
                            "class": 'setting-title'
                          }, 'Show in file context menus');
                          return _this.div({
                            "class": 'setting-description'
                          }, function() {
                            return _this.raw("Add \"Open with " + WinShell.appName + "\" to the File Explorer context menu for files.");
                          });
                        });
                      });
                    });
                  });
                  return _this.div({
                    "class": 'control-group'
                  }, function() {
                    return _this.div({
                      "class": 'controls'
                    }, function() {
                      return _this.div({
                        "class": 'checkbox'
                      }, function() {
                        return _this.label({
                          "for": 'system.windows.shell-menu-folders'
                        }, function() {
                          _this.input({
                            outlet: 'folderContextMenuCheckbox',
                            id: 'system.windows.shell-menu-folders',
                            type: 'checkbox'
                          });
                          _this.div({
                            "class": 'setting-title'
                          }, 'Show in folder context menus');
                          return _this.div({
                            "class": 'setting-description'
                          }, function() {
                            return _this.raw("Add \"Open with " + WinShell.appName + "\" to the File Explorer context menu for folders.");
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        };
      })(this));
    };

    SystemPanel.prototype.initialize = function() {
      SystemPanel.__super__.initialize.apply(this, arguments);
      WinShell.fileHandler.isRegistered((function(_this) {
        return function(i) {
          return _this.fileHandlerCheckbox.prop('checked', i);
        };
      })(this));
      WinShell.fileContextMenu.isRegistered((function(_this) {
        return function(i) {
          return _this.fileContextMenuCheckbox.prop('checked', i);
        };
      })(this));
      WinShell.folderContextMenu.isRegistered((function(_this) {
        return function(i) {
          return _this.folderContextMenuCheckbox.prop('checked', i);
        };
      })(this));
      this.fileHandlerCheckbox.on('click', (function(_this) {
        return function(e) {
          return _this.setRegistration(WinShell.fileHandler, e.target.checked);
        };
      })(this));
      this.fileContextMenuCheckbox.on('click', (function(_this) {
        return function(e) {
          return _this.setRegistration(WinShell.fileContextMenu, e.target.checked);
        };
      })(this));
      return this.folderContextMenuCheckbox.on('click', (function(_this) {
        return function(e) {
          _this.setRegistration(WinShell.folderContextMenu, e.target.checked);
          return _this.setRegistration(WinShell.folderBackgroundContextMenu, e.target.checked);
        };
      })(this));
    };

    SystemPanel.prototype.dispose = function() {};

    SystemPanel.prototype.setRegistration = function(option, shouldBeRegistered) {
      if (shouldBeRegistered) {
        return option.register(function() {});
      } else {
        return option.deregister(function() {});
      }
    };

    return SystemPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9zeXN0ZW0td2luZG93cy1wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdEQUFBO0lBQUE7OztFQUFDLGFBQWMsT0FBQSxDQUFRLHNCQUFSOztFQUNkLFdBQVksT0FBQSxDQUFRLE1BQVI7O0VBQ2IsYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixXQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO09BQUwsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN6QixLQUFDLENBQUEsSUFBRCxDQUFNO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtXQUFOLEVBQXNDLFNBQUE7bUJBQ3BDLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdCQUFQO2FBQUwsRUFBOEIsU0FBQTtxQkFDNUIsS0FBQyxDQUFBLEdBQUQsQ0FBSztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO2VBQUwsRUFBaUMsU0FBQTtnQkFDL0IsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdEQUFQO2lCQUFMLEVBQThELGlCQUE5RDtnQkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8seUJBQVA7aUJBQUwsRUFBdUMsMEVBQXZDO3VCQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2lC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b20tc3BhY2UtcGVuLXZpZXdzJ1xue1dpblNoZWxsfSA9IHJlcXVpcmUgJ2F0b20nXG5TZXR0aW5nc1BhbmVsID0gcmVxdWlyZSAnLi9zZXR0aW5ncy1wYW5lbCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU3lzdGVtUGFuZWwgZXh0ZW5kcyBTY3JvbGxWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdwYW5lbHMtaXRlbScsID0+XG4gICAgICBAZm9ybSBjbGFzczogJ2dlbmVyYWwtcGFuZWwgc2VjdGlvbicsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5ncy1wYW5lbCcsID0+XG4gICAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24tY29udGFpbmVyJywgPT5cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdibG9jayBzZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLWRldmljZS1kZXNrdG9wJywgJ1N5c3RlbSBTZXR0aW5ncydcbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICd0ZXh0IGljb24gaWNvbi1xdWVzdGlvbicsICdUaGVzZSBzZXR0aW5ncyBkZXRlcm1pbmUgaG93IEF0b20gaW50ZWdyYXRlcyB3aXRoIHlvdXIgb3BlcmF0aW5nIHN5c3RlbS4nXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1ib2R5JywgPT5cbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2wtZ3JvdXAnLCA9PlxuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdjb250cm9scycsID0+XG4gICAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnY2hlY2tib3gnLCA9PlxuICAgICAgICAgICAgICAgICAgICBAbGFiZWwgZm9yOiAnc3lzdGVtLndpbmRvd3MuZmlsZS1oYW5kbGVyJywgPT5cbiAgICAgICAgICAgICAgICAgICAgICBAaW5wdXQgb3V0bGV0OiAnZmlsZUhhbmRsZXJDaGVja2JveCcsIGlkOiAnc3lzdGVtLndpbmRvd3MuZmlsZS1oYW5kbGVyJywgdHlwZTogJ2NoZWNrYm94J1xuICAgICAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLXRpdGxlJywgJ1JlZ2lzdGVyIGFzIGZpbGUgaGFuZGxlcidcbiAgICAgICAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy1kZXNjcmlwdGlvbicsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcmF3KFwiU2hvdyAje1dpblNoZWxsLmFwcE5hbWV9IGluIHRoZSBcXFwiT3BlbiB3aXRoXFxcIiBhcHBsaWNhdGlvbiBsaXN0IGZvciBlYXN5IGFzc29jaWF0aW9uIHdpdGggZmlsZSB0eXBlcy5cIilcbiAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2wtZ3JvdXAnLCA9PlxuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdjb250cm9scycsID0+XG4gICAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnY2hlY2tib3gnLCA9PlxuICAgICAgICAgICAgICAgICAgICBAbGFiZWwgZm9yOiAnc3lzdGVtLndpbmRvd3Muc2hlbGwtbWVudS1maWxlcycsID0+XG4gICAgICAgICAgICAgICAgICAgICAgQGlucHV0IG91dGxldDogJ2ZpbGVDb250ZXh0TWVudUNoZWNrYm94JywgaWQ6ICdzeXN0ZW0ud2luZG93cy5zaGVsbC1tZW51LWZpbGVzJywgdHlwZTogJ2NoZWNrYm94J1xuICAgICAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLXRpdGxlJywgJ1Nob3cgaW4gZmlsZSBjb250ZXh0IG1lbnVzJ1xuICAgICAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLWRlc2NyaXB0aW9uJywgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEByYXcoXCJBZGQgXFxcIk9wZW4gd2l0aCAje1dpblNoZWxsLmFwcE5hbWV9XFxcIiB0byB0aGUgRmlsZSBFeHBsb3JlciBjb250ZXh0IG1lbnUgZm9yIGZpbGVzLlwiKVxuICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnY29udHJvbC1ncm91cCcsID0+XG4gICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2NvbnRyb2xzJywgPT5cbiAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdjaGVja2JveCcsID0+XG4gICAgICAgICAgICAgICAgICAgIEBsYWJlbCBmb3I6ICdzeXN0ZW0ud2luZG93cy5zaGVsbC1tZW51LWZvbGRlcnMnLCA9PlxuICAgICAgICAgICAgICAgICAgICAgIEBpbnB1dCBvdXRsZXQ6ICdmb2xkZXJDb250ZXh0TWVudUNoZWNrYm94JywgaWQ6ICdzeXN0ZW0ud2luZG93cy5zaGVsbC1tZW51LWZvbGRlcnMnLCB0eXBlOiAnY2hlY2tib3gnXG4gICAgICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ3NldHRpbmctdGl0bGUnLCAnU2hvdyBpbiBmb2xkZXIgY29udGV4dCBtZW51cydcbiAgICAgICAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy1kZXNjcmlwdGlvbicsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcmF3KFwiQWRkIFxcXCJPcGVuIHdpdGggI3tXaW5TaGVsbC5hcHBOYW1lfVxcXCIgdG8gdGhlIEZpbGUgRXhwbG9yZXIgY29udGV4dCBtZW51IGZvciBmb2xkZXJzLlwiKVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBXaW5TaGVsbC5maWxlSGFuZGxlci5pc1JlZ2lzdGVyZWQgKGkpID0+IEBmaWxlSGFuZGxlckNoZWNrYm94LnByb3AoJ2NoZWNrZWQnLCBpKVxuICAgIFdpblNoZWxsLmZpbGVDb250ZXh0TWVudS5pc1JlZ2lzdGVyZWQgKGkpID0+IEBmaWxlQ29udGV4dE1lbnVDaGVja2JveC5wcm9wKCdjaGVja2VkJywgaSlcbiAgICBXaW5TaGVsbC5mb2xkZXJDb250ZXh0TWVudS5pc1JlZ2lzdGVyZWQgKGkpID0+IEBmb2xkZXJDb250ZXh0TWVudUNoZWNrYm94LnByb3AoJ2NoZWNrZWQnLCBpKVxuXG4gICAgQGZpbGVIYW5kbGVyQ2hlY2tib3gub24gJ2NsaWNrJywgKGUpID0+IEBzZXRSZWdpc3RyYXRpb24gV2luU2hlbGwuZmlsZUhhbmRsZXIsIGUudGFyZ2V0LmNoZWNrZWRcbiAgICBAZmlsZUNvbnRleHRNZW51Q2hlY2tib3gub24gJ2NsaWNrJywgKGUpID0+IEBzZXRSZWdpc3RyYXRpb24gV2luU2hlbGwuZmlsZUNvbnRleHRNZW51LCBlLnRhcmdldC5jaGVja2VkXG4gICAgQGZvbGRlckNvbnRleHRNZW51Q2hlY2tib3gub24gJ2NsaWNrJywgKGUpID0+XG4gICAgICBAc2V0UmVnaXN0cmF0aW9uIFdpblNoZWxsLmZvbGRlckNvbnRleHRNZW51LCBlLnRhcmdldC5jaGVja2VkXG4gICAgICBAc2V0UmVnaXN0cmF0aW9uIFdpblNoZWxsLmZvbGRlckJhY2tncm91bmRDb250ZXh0TWVudSwgZS50YXJnZXQuY2hlY2tlZFxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgcmV0dXJuXG5cbiAgc2V0UmVnaXN0cmF0aW9uOiAob3B0aW9uLCBzaG91bGRCZVJlZ2lzdGVyZWQpIC0+XG4gICAgaWYgc2hvdWxkQmVSZWdpc3RlcmVkXG4gICAgICBvcHRpb24ucmVnaXN0ZXIgLT5cbiAgICBlbHNlXG4gICAgICBvcHRpb24uZGVyZWdpc3RlciAtPlxuIl19
