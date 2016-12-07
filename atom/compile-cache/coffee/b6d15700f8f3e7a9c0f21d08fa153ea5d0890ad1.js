(function() {
  var $$, PackagePanelView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $$ = ref.$$, View = ref.View;

  module.exports = PackagePanelView = (function(superClass) {
    extend(PackagePanelView, superClass);

    function PackagePanelView() {
      return PackagePanelView.__super__.constructor.apply(this, arguments);
    }

    PackagePanelView.content = function(title) {
      return this.div({
        "class": 'tool-panel padded package-panel'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'inset-panel'
          }, function() {
            _this.div({
              "class": 'panel-heading'
            }, title);
            return _this.div({
              "class": 'panel-body padded'
            }, function() {
              _this.div({
                "class": 'text-info',
                outlet: 'summary'
              });
              return _this.ul({
                "class": 'list-group',
                outlet: 'list'
              });
            });
          });
        };
      })(this));
    };

    PackagePanelView.prototype.addPackages = function(packages, timeKey) {
      var i, len, pack, results;
      results = [];
      for (i = 0, len = packages.length; i < len; i++) {
        pack = packages[i];
        results.push(this.addPackage(pack, timeKey));
      }
      return results;
    };

    PackagePanelView.prototype.addPackage = function(pack, timeKey) {
      return this.list.append($$(function() {
        return this.li({
          "class": 'list-item'
        }, (function(_this) {
          return function() {
            var highlightClass;
            _this.a({
              "class": 'inline-block package',
              'data-package': pack.name
            }, pack.name);
            highlightClass = 'highlight-warning';
            if (pack[timeKey] > 25) {
              highlightClass = 'highlight-error';
            }
            return _this.span({
              "class": "inline-block " + highlightClass
            }, pack[timeKey] + "ms");
          };
        })(this));
      }));
    };

    PackagePanelView.prototype.initialize = function() {
      return this.on('click', 'a.package', function() {
        var packageName;
        packageName = this.dataset['package'];
        return atom.workspace.open("atom://config/packages/" + packageName);
      });
    };

    return PackagePanelView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90aW1lY29wL2xpYi9wYWNrYWdlLXBhbmVsLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrQkFBQTtJQUFBOzs7RUFBQSxNQUFhLE9BQUEsQ0FBUSxzQkFBUixDQUFiLEVBQUMsV0FBRCxFQUFLOztFQUVMLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixnQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEtBQUQ7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQ0FBUDtPQUFMLEVBQStDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0MsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtXQUFMLEVBQTJCLFNBQUE7WUFDekIsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDthQUFMLEVBQTZCLEtBQTdCO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO2FBQUwsRUFBaUMsU0FBQTtjQUMvQixLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtnQkFBb0IsTUFBQSxFQUFRLFNBQTVCO2VBQUw7cUJBQ0EsS0FBQyxDQUFBLEVBQUQsQ0FBSTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFlBQVA7Z0JBQXFCLE1BQUEsRUFBUSxNQUE3QjtlQUFKO1lBRitCLENBQWpDO1VBRnlCLENBQTNCO1FBRDZDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEvQztJQURROzsrQkFRVixXQUFBLEdBQWEsU0FBQyxRQUFELEVBQVcsT0FBWDtBQUNYLFVBQUE7QUFBQTtXQUFBLDBDQUFBOztxQkFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLElBQVosRUFBa0IsT0FBbEI7QUFBQTs7SUFEVzs7K0JBR2IsVUFBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLE9BQVA7YUFDVixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxFQUFBLENBQUcsU0FBQTtlQUNkLElBQUMsQ0FBQSxFQUFELENBQUk7VUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFdBQVA7U0FBSixFQUF3QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO0FBQ3RCLGdCQUFBO1lBQUEsS0FBQyxDQUFBLENBQUQsQ0FBRztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sc0JBQVA7Y0FBK0IsY0FBQSxFQUFnQixJQUFJLENBQUMsSUFBcEQ7YUFBSCxFQUE2RCxJQUFJLENBQUMsSUFBbEU7WUFDQSxjQUFBLEdBQWlCO1lBQ2pCLElBQXNDLElBQUssQ0FBQSxPQUFBLENBQUwsR0FBZ0IsRUFBdEQ7Y0FBQSxjQUFBLEdBQWlCLGtCQUFqQjs7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTTtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBQSxHQUFnQixjQUF2QjthQUFOLEVBQWtELElBQUssQ0FBQSxPQUFBLENBQU4sR0FBZSxJQUFoRTtVQUpzQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEI7TUFEYyxDQUFILENBQWI7SUFEVTs7K0JBUVosVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsRUFBRCxDQUFJLE9BQUosRUFBYSxXQUFiLEVBQTBCLFNBQUE7QUFDeEIsWUFBQTtRQUFBLFdBQUEsR0FBYyxJQUFJLENBQUMsT0FBUSxDQUFBLFNBQUE7ZUFDM0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHlCQUFBLEdBQTBCLFdBQTlDO01BRndCLENBQTFCO0lBRFU7Ozs7S0FwQmlCO0FBSC9CIiwic291cmNlc0NvbnRlbnQiOlsieyQkLCBWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYWNrYWdlUGFuZWxWaWV3IGV4dGVuZHMgVmlld1xuICBAY29udGVudDogKHRpdGxlKSAtPlxuICAgIEBkaXYgY2xhc3M6ICd0b29sLXBhbmVsIHBhZGRlZCBwYWNrYWdlLXBhbmVsJywgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdpbnNldC1wYW5lbCcsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbC1oZWFkaW5nJywgdGl0bGVcbiAgICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWJvZHkgcGFkZGVkJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAndGV4dC1pbmZvJywgb3V0bGV0OiAnc3VtbWFyeSdcbiAgICAgICAgICBAdWwgY2xhc3M6ICdsaXN0LWdyb3VwJywgb3V0bGV0OiAnbGlzdCdcblxuICBhZGRQYWNrYWdlczogKHBhY2thZ2VzLCB0aW1lS2V5KSAtPlxuICAgIEBhZGRQYWNrYWdlKHBhY2ssIHRpbWVLZXkpIGZvciBwYWNrIGluIHBhY2thZ2VzXG5cbiAgYWRkUGFja2FnZTogKHBhY2ssIHRpbWVLZXkpIC0+XG4gICAgQGxpc3QuYXBwZW5kICQkIC0+XG4gICAgICBAbGkgY2xhc3M6ICdsaXN0LWl0ZW0nLCA9PlxuICAgICAgICBAYSBjbGFzczogJ2lubGluZS1ibG9jayBwYWNrYWdlJywgJ2RhdGEtcGFja2FnZSc6IHBhY2submFtZSwgcGFjay5uYW1lXG4gICAgICAgIGhpZ2hsaWdodENsYXNzID0gJ2hpZ2hsaWdodC13YXJuaW5nJ1xuICAgICAgICBoaWdobGlnaHRDbGFzcyA9ICdoaWdobGlnaHQtZXJyb3InIGlmIHBhY2tbdGltZUtleV0gPiAyNVxuICAgICAgICBAc3BhbiBjbGFzczogXCJpbmxpbmUtYmxvY2sgI3toaWdobGlnaHRDbGFzc31cIiwgXCIje3BhY2tbdGltZUtleV19bXNcIlxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQG9uICdjbGljaycsICdhLnBhY2thZ2UnLCAtPlxuICAgICAgcGFja2FnZU5hbWUgPSB0aGlzLmRhdGFzZXRbJ3BhY2thZ2UnXVxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvI3twYWNrYWdlTmFtZX1cIilcbiJdfQ==
