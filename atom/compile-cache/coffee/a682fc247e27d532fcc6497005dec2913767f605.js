(function() {
  var GeneralPanel, ScrollView, SettingsPanel,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ScrollView = require('atom-space-pen-views').ScrollView;

  SettingsPanel = require('./settings-panel');

  module.exports = GeneralPanel = (function(superClass) {
    extend(GeneralPanel, superClass);

    function GeneralPanel() {
      return GeneralPanel.__super__.constructor.apply(this, arguments);
    }

    GeneralPanel.content = function() {
      return this.div({
        tabindex: 0,
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.form({
            "class": 'general-panel section'
          }, function() {
            return _this.div({
              outlet: "loadingElement",
              "class": 'alert alert-info loading-area icon icon-hourglass'
            }, "Loading settings");
          });
        };
      })(this));
    };

    GeneralPanel.prototype.initialize = function() {
      var i, len, ref, subPanel;
      GeneralPanel.__super__.initialize.apply(this, arguments);
      this.loadingElement.remove();
      this.subPanels = [
        new SettingsPanel('core', {
          icon: 'settings',
          note: '<div class="text icon icon-question" id="core-settings-note" tabindex="-1">These are Atom\'s core settings which affect behavior unrelated to text editing. Individual packages may have their own additional settings found within their package card in the <a class="link packages-open">Packages list</a>.</div>'
        })
      ];
      ref = this.subPanels;
      for (i = 0, len = ref.length; i < len; i++) {
        subPanel = ref[i];
        this.append(subPanel);
      }
      this.on('click', '.packages-open', function() {
        return atom.workspace.open('atom://config/packages');
      });
    };

    GeneralPanel.prototype.dispose = function() {
      var i, len, ref, subPanel;
      ref = this.subPanels;
      for (i = 0, len = ref.length; i < len; i++) {
        subPanel = ref[i];
        subPanel.dispose();
      }
    };

    return GeneralPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9nZW5lcmFsLXBhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUNBQUE7SUFBQTs7O0VBQUMsYUFBYyxPQUFBLENBQVEsc0JBQVI7O0VBQ2YsYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixZQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsUUFBQSxFQUFVLENBQVY7UUFBYSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQXBCO09BQUwsRUFBd0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN0QyxLQUFDLENBQUEsSUFBRCxDQUFNO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1QkFBUDtXQUFOLEVBQXNDLFNBQUE7bUJBQ3BDLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxNQUFBLEVBQVEsZ0JBQVI7Y0FBMEIsQ0FBQSxLQUFBLENBQUEsRUFBTyxtREFBakM7YUFBTCxFQUEyRixrQkFBM0Y7VUFEb0MsQ0FBdEM7UUFEc0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhDO0lBRFE7OzJCQUtWLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLDhDQUFBLFNBQUE7TUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLE1BQWhCLENBQUE7TUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ1AsSUFBQSxhQUFBLENBQWMsTUFBZCxFQUFzQjtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQWtCLElBQUEsRUFBTSxzVEFBeEI7U0FBdEIsQ0FETzs7QUFNYjtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsSUFBQyxDQUFBLE1BQUQsQ0FBUSxRQUFSO0FBREY7TUFHQSxJQUFDLENBQUEsRUFBRCxDQUFJLE9BQUosRUFBYSxnQkFBYixFQUErQixTQUFBO2VBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQix3QkFBcEI7TUFENkIsQ0FBL0I7SUFiVTs7MkJBa0JaLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtBQUFBO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxRQUFRLENBQUMsT0FBVCxDQUFBO0FBREY7SUFETzs7OztLQXhCZ0I7QUFKM0IiLCJzb3VyY2VzQ29udGVudCI6WyJ7U2Nyb2xsVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblNldHRpbmdzUGFuZWwgPSByZXF1aXJlICcuL3NldHRpbmdzLXBhbmVsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHZW5lcmFsUGFuZWwgZXh0ZW5kcyBTY3JvbGxWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgdGFiaW5kZXg6IDAsIGNsYXNzOiAncGFuZWxzLWl0ZW0nLCA9PlxuICAgICAgQGZvcm0gY2xhc3M6ICdnZW5lcmFsLXBhbmVsIHNlY3Rpb24nLCA9PlxuICAgICAgICBAZGl2IG91dGxldDogXCJsb2FkaW5nRWxlbWVudFwiLCBjbGFzczogJ2FsZXJ0IGFsZXJ0LWluZm8gbG9hZGluZy1hcmVhIGljb24gaWNvbi1ob3VyZ2xhc3MnLCBcIkxvYWRpbmcgc2V0dGluZ3NcIlxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAbG9hZGluZ0VsZW1lbnQucmVtb3ZlKClcblxuICAgIEBzdWJQYW5lbHMgPSBbXG4gICAgICBuZXcgU2V0dGluZ3NQYW5lbCgnY29yZScsIGljb246ICdzZXR0aW5ncycsIG5vdGU6ICcnJ1xuICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dCBpY29uIGljb24tcXVlc3Rpb25cIiBpZD1cImNvcmUtc2V0dGluZ3Mtbm90ZVwiIHRhYmluZGV4PVwiLTFcIj5UaGVzZSBhcmUgQXRvbSdzIGNvcmUgc2V0dGluZ3Mgd2hpY2ggYWZmZWN0IGJlaGF2aW9yIHVucmVsYXRlZCB0byB0ZXh0IGVkaXRpbmcuIEluZGl2aWR1YWwgcGFja2FnZXMgbWF5IGhhdmUgdGhlaXIgb3duIGFkZGl0aW9uYWwgc2V0dGluZ3MgZm91bmQgd2l0aGluIHRoZWlyIHBhY2thZ2UgY2FyZCBpbiB0aGUgPGEgY2xhc3M9XCJsaW5rIHBhY2thZ2VzLW9wZW5cIj5QYWNrYWdlcyBsaXN0PC9hPi48L2Rpdj5cbiAgICAgICcnJylcbiAgICBdXG5cbiAgICBmb3Igc3ViUGFuZWwgaW4gQHN1YlBhbmVsc1xuICAgICAgQGFwcGVuZChzdWJQYW5lbClcblxuICAgIEBvbiAnY2xpY2snLCAnLnBhY2thZ2VzLW9wZW4nLCAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovL2NvbmZpZy9wYWNrYWdlcycpXG5cbiAgICByZXR1cm5cblxuICBkaXNwb3NlOiAtPlxuICAgIGZvciBzdWJQYW5lbCBpbiBAc3ViUGFuZWxzXG4gICAgICBzdWJQYW5lbC5kaXNwb3NlKClcbiAgICByZXR1cm5cbiJdfQ==
