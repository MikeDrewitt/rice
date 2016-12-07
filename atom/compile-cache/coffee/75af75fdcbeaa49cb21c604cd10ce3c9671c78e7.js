(function() {
  var View, WindowPanelView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  module.exports = WindowPanelView = (function(superClass) {
    extend(WindowPanelView, superClass);

    function WindowPanelView() {
      return WindowPanelView.__super__.constructor.apply(this, arguments);
    }

    WindowPanelView.content = function() {
      return this.div({
        "class": 'tool-panel padded package-panel'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'inset-panel'
          }, function() {
            _this.div({
              "class": 'panel-heading'
            }, 'Startup Time');
            return _this.div({
              "class": 'panel-body padded'
            }, function() {
              _this.div({
                "class": 'timing',
                outlet: 'windowTiming'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'Window load time');
                return _this.span({
                  "class": 'inline-block',
                  outlet: 'windowLoadTime'
                });
              });
              _this.div({
                "class": 'timing',
                outlet: 'shellTiming'
              }, function() {
                _this.span({
                  "class": 'inline-block'
                }, 'Shell load time');
                return _this.span({
                  "class": 'inline-block',
                  outlet: 'shellLoadTime'
                });
              });
              return _this.div({
                outlet: 'deserializeTimings'
              }, function() {
                _this.div({
                  "class": 'timing',
                  outlet: 'workspaceTiming'
                }, function() {
                  _this.span({
                    "class": 'inline-block'
                  }, 'Workspace load time');
                  return _this.span({
                    "class": 'inline-block',
                    outlet: 'workspaceLoadTime'
                  });
                });
                _this.div({
                  "class": 'timing',
                  outlet: 'projectTiming'
                }, function() {
                  _this.span({
                    "class": 'inline-block'
                  }, 'Project load time');
                  return _this.span({
                    "class": 'inline-block',
                    outlet: 'projectLoadTime'
                  });
                });
                return _this.div({
                  "class": 'timing',
                  outlet: 'atomTiming'
                }, function() {
                  _this.span({
                    "class": 'inline-block'
                  }, 'Window state load time');
                  return _this.span({
                    "class": 'inline-block',
                    outlet: 'atomLoadTime'
                  });
                });
              });
            });
          });
        };
      })(this));
    };

    WindowPanelView.prototype.initialize = function() {
      atom.tooltips.add(this.windowTiming[0], {
        title: 'The time taken to load this window'
      });
      atom.tooltips.add(this.shellTiming[0], {
        title: 'The time taken to launch the app'
      });
      atom.tooltips.add(this.workspaceTiming[0], {
        title: 'The time taken to rebuild the previously opened editors'
      });
      atom.tooltips.add(this.projectTiming[0], {
        title: 'The time taken to rebuild the previously opened buffers'
      });
      return atom.tooltips.add(this.atomTiming[0], {
        title: 'The time taken to read and parse the stored window state'
      });
    };

    WindowPanelView.prototype.updateWindowLoadTime = function() {
      var shellLoadTime, time;
      time = atom.getWindowLoadTime();
      this.windowLoadTime.addClass(this.getHighlightClass(time));
      this.windowLoadTime.text(time + "ms");
      shellLoadTime = atom.getLoadSettings().shellLoadTime;
      if (shellLoadTime != null) {
        this.shellLoadTime.addClass(this.getHighlightClass(shellLoadTime));
        this.shellLoadTime.text(shellLoadTime + "ms");
      } else {
        this.shellTiming.hide();
      }
      if (atom.deserializeTimings != null) {
        this.workspaceLoadTime.addClass(this.getHighlightClass(atom.deserializeTimings.workspace));
        this.workspaceLoadTime.text(atom.deserializeTimings.workspace + "ms");
        this.projectLoadTime.addClass(this.getHighlightClass(atom.deserializeTimings.project));
        this.projectLoadTime.text(atom.deserializeTimings.project + "ms");
        this.atomLoadTime.addClass(this.getHighlightClass(atom.deserializeTimings.atom));
        return this.atomLoadTime.text(atom.deserializeTimings.atom + "ms");
      } else {
        return this.deserializeTimings.hide();
      }
    };

    WindowPanelView.prototype.getHighlightClass = function(time) {
      if (time > 1000) {
        return 'highlight-error';
      } else if (time > 800) {
        return 'highlight-warning';
      } else {
        return 'highlight-info';
      }
    };

    WindowPanelView.prototype.populate = function() {
      return this.updateWindowLoadTime();
    };

    return WindowPanelView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90aW1lY29wL2xpYi93aW5kb3ctcGFuZWwtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFCQUFBO0lBQUE7OztFQUFDLE9BQVEsT0FBQSxDQUFRLHNCQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixlQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQ0FBUDtPQUFMLEVBQStDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0MsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtXQUFMLEVBQTJCLFNBQUE7WUFDekIsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDthQUFMLEVBQTZCLGNBQTdCO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO2FBQUwsRUFBaUMsU0FBQTtjQUMvQixLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtnQkFBaUIsTUFBQSxFQUFRLGNBQXpCO2VBQUwsRUFBOEMsU0FBQTtnQkFDNUMsS0FBQyxDQUFBLElBQUQsQ0FBTTtrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7aUJBQU4sRUFBNkIsa0JBQTdCO3VCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2tCQUF1QixNQUFBLEVBQVEsZ0JBQS9CO2lCQUFOO2NBRjRDLENBQTlDO2NBSUEsS0FBQyxDQUFB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RUFORjtPQUFBLE1BQUE7ZUFRRSxJQUFDLENBQUEsa0JBQWtCLENBQUMsSUFBcEIsQ0FBQSxFQVJGOztJQVpvQjs7OEJBc0J0QixpQkFBQSxHQUFtQixTQUFDLElBQUQ7TUFDakIsSUFBRyxJQUFBLEdBQU8sSUFBVjtlQUNFLGtCQURGO09BQUEsTUFFSyxJQUFHLElBQUEsR0FBTyxHQUFWO2VBQ0gsb0JBREc7T0FBQSxNQUFBO2VBR0gsaUJBSEc7O0lBSFk7OzhCQVFuQixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRFE7Ozs7S0FoRWtCO0FBSDlCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFdpbmRvd1BhbmVsVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3Rvb2wtcGFuZWwgcGFkZGVkIHBhY2thZ2UtcGFuZWwnLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ2luc2V0LXBhbmVsJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWhlYWRpbmcnLCAnU3RhcnR1cCBUaW1lJ1xuICAgICAgICBAZGl2IGNsYXNzOiAncGFuZWwtYm9keSBwYWRkZWQnLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICd0aW1pbmcnLCBvdXRsZXQ6ICd3aW5kb3dUaW1pbmcnLCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpbmxpbmUtYmxvY2snLCAnV2luZG93IGxvYWQgdGltZSdcbiAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgb3V0bGV0OiAnd2luZG93TG9hZFRpbWUnXG5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgb3V0bGV0OiAnc2hlbGxUaW1pbmcnLCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpbmxpbmUtYmxvY2snLCAnU2hlbGwgbG9hZCB0aW1lJ1xuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpbmxpbmUtYmxvY2snLCBvdXRsZXQ6ICdzaGVsbExvYWRUaW1lJ1xuXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdkZXNlcmlhbGl6ZVRpbWluZ3MnLCA9PlxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3RpbWluZycsIG91dGxldDogJ3dvcmtzcGFjZVRpbWluZycsID0+XG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ1dvcmtzcGFjZSBsb2FkIHRpbWUnXG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgb3V0bGV0OiAnd29ya3NwYWNlTG9hZFRpbWUnXG5cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICd0aW1pbmcnLCBvdXRsZXQ6ICdwcm9qZWN0VGltaW5nJywgPT5cbiAgICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpbmxpbmUtYmxvY2snLCAnUHJvamVjdCBsb2FkIHRpbWUnXG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgb3V0bGV0OiAncHJvamVjdExvYWRUaW1lJ1xuXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAndGltaW5nJywgb3V0bGV0OiAnYXRvbVRpbWluZycsID0+XG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ1dpbmRvdyBzdGF0ZSBsb2FkIHRpbWUnXG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgb3V0bGV0OiAnYXRvbUxvYWRUaW1lJ1xuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgYXRvbS50b29sdGlwcy5hZGQoQHdpbmRvd1RpbWluZ1swXSwgdGl0bGU6ICdUaGUgdGltZSB0YWtlbiB0byBsb2FkIHRoaXMgd2luZG93JylcbiAgICBhdG9tLnRvb2x0aXBzLmFkZChAc2hlbGxUaW1pbmdbMF0sIHRpdGxlOiAnVGhlIHRpbWUgdGFrZW4gdG8gbGF1bmNoIHRoZSBhcHAnKVxuICAgIGF0b20udG9vbHRpcHMuYWRkKEB3b3Jrc3BhY2VUaW1pbmdbMF0sIHRpdGxlOiAnVGhlIHRpbWUgdGFrZW4gdG8gcmVidWlsZCB0aGUgcHJldmlvdXNseSBvcGVuZWQgZWRpdG9ycycpXG4gICAgYXRvbS50b29sdGlwcy5hZGQoQHByb2plY3RUaW1pbmdbMF0sIHRpdGxlOiAnVGhlIHRpbWUgdGFrZW4gdG8gcmVidWlsZCB0aGUgcHJldmlvdXNseSBvcGVuZWQgYnVmZmVycycpXG4gICAgYXRvbS50b29sdGlwcy5hZGQoQGF0b21UaW1pbmdbMF0sIHRpdGxlOiAnVGhlIHRpbWUgdGFrZW4gdG8gcmVhZCBhbmQgcGFyc2UgdGhlIHN0b3JlZCB3aW5kb3cgc3RhdGUnKVxuXG4gIHVwZGF0ZVdpbmRvd0xvYWRUaW1lOiAtPlxuICAgIHRpbWUgPSBhdG9tLmdldFdpbmRvd0xvYWRUaW1lKClcbiAgICBAd2luZG93TG9hZFRpbWUuYWRkQ2xhc3MoQGdldEhpZ2hsaWdodENsYXNzKHRpbWUpKVxuICAgIEB3aW5kb3dMb2FkVGltZS50ZXh0KFwiI3t0aW1lfW1zXCIpXG5cbiAgICB7c2hlbGxMb2FkVGltZX0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG4gICAgaWYgc2hlbGxMb2FkVGltZT9cbiAgICAgIEBzaGVsbExvYWRUaW1lLmFkZENsYXNzKEBnZXRIaWdobGlnaHRDbGFzcyhzaGVsbExvYWRUaW1lKSlcbiAgICAgIEBzaGVsbExvYWRUaW1lLnRleHQoXCIje3NoZWxsTG9hZFRpbWV9bXNcIilcbiAgICBlbHNlXG4gICAgICBAc2hlbGxUaW1pbmcuaGlkZSgpXG5cbiAgICBpZiBhdG9tLmRlc2VyaWFsaXplVGltaW5ncz9cbiAgICAgIEB3b3Jrc3BhY2VMb2FkVGltZS5hZGRDbGFzcyhAZ2V0SGlnaGxpZ2h0Q2xhc3MoYXRvbS5kZXNlcmlhbGl6ZVRpbWluZ3Mud29ya3NwYWNlKSlcbiAgICAgIEB3b3Jrc3BhY2VMb2FkVGltZS50ZXh0KFwiI3thdG9tLmRlc2VyaWFsaXplVGltaW5ncy53b3Jrc3BhY2V9bXNcIilcbiAgICAgIEBwcm9qZWN0TG9hZFRpbWUuYWRkQ2xhc3MoQGdldEhpZ2hsaWdodENsYXNzKGF0b20uZGVzZXJpYWxpemVUaW1pbmdzLnByb2plY3QpKVxuICAgICAgQHByb2plY3RMb2FkVGltZS50ZXh0KFwiI3thdG9tLmRlc2VyaWFsaXplVGltaW5ncy5wcm9qZWN0fW1zXCIpXG4gICAgICBAYXRvbUxvYWRUaW1lLmFkZENsYXNzKEBnZXRIaWdobGlnaHRDbGFzcyhhdG9tLmRlc2VyaWFsaXplVGltaW5ncy5hdG9tKSlcbiAgICAgIEBhdG9tTG9hZFRpbWUudGV4dChcIiN7YXRvbS5kZXNlcmlhbGl6ZVRpbWluZ3MuYXRvbX1tc1wiKVxuICAgIGVsc2VcbiAgICAgIEBkZXNlcmlhbGl6ZVRpbWluZ3MuaGlkZSgpXG5cbiAgZ2V0SGlnaGxpZ2h0Q2xhc3M6ICh0aW1lKSAtPlxuICAgIGlmIHRpbWUgPiAxMDAwXG4gICAgICAnaGlnaGxpZ2h0LWVycm9yJ1xuICAgIGVsc2UgaWYgdGltZSA+IDgwMFxuICAgICAgJ2hpZ2hsaWdodC13YXJuaW5nJ1xuICAgIGVsc2VcbiAgICAgICdoaWdobGlnaHQtaW5mbydcblxuICBwb3B1bGF0ZTogLT5cbiAgICBAdXBkYXRlV2luZG93TG9hZFRpbWUoKVxuIl19
