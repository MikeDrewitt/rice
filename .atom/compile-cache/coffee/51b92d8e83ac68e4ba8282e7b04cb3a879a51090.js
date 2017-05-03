(function() {
  var PackageUpdatesStatusView, View, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  View = require('atom-space-pen-views').View;

  module.exports = PackageUpdatesStatusView = (function(superClass) {
    extend(PackageUpdatesStatusView, superClass);

    function PackageUpdatesStatusView() {
      return PackageUpdatesStatusView.__super__.constructor.apply(this, arguments);
    }

    PackageUpdatesStatusView.content = function() {
      return this.div({
        "class": 'package-updates-status-view inline-block text text-info'
      }, (function(_this) {
        return function() {
          _this.span({
            "class": 'icon icon-package'
          });
          return _this.span({
            outlet: 'countLabel',
            "class": 'available-updates-status'
          });
        };
      })(this));
    };

    PackageUpdatesStatusView.prototype.initialize = function(statusBar, packages) {
      this.countLabel.text("" + (_.pluralize(packages.length, 'update')));
      this.tooltip = atom.tooltips.add(this.element, {
        title: (_.pluralize(packages.length, 'package update')) + " available"
      });
      this.tile = statusBar.addRightTile({
        item: this,
        priority: -99
      });
      return this.on('click', (function(_this) {
        return function() {
          atom.commands.dispatch(atom.views.getView(atom.workspace), 'settings-view:check-for-package-updates');
          _this.tooltip.dispose();
          return _this.tile.destroy();
        };
      })(this));
    };

    return PackageUpdatesStatusView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLXVwZGF0ZXMtc3RhdHVzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpQ0FBQTtJQUFBOzs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILE9BQVEsT0FBQSxDQUFRLHNCQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSix3QkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8seURBQVA7T0FBTCxFQUF1RSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDckUsS0FBQyxDQUFBLElBQUQsQ0FBTTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7V0FBTjtpQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO1lBQUEsTUFBQSxFQUFRLFlBQVI7WUFBc0IsQ0FBQSxLQUFBLENBQUEsRUFBTywwQkFBN0I7V0FBTjtRQUZxRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkU7SUFEUTs7dUNBS1YsVUFBQSxHQUFZLFNBQUMsU0FBRCxFQUFZLFFBQVo7TUFDVixJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsRUFBQSxHQUFFLENBQUMsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxRQUFRLENBQUMsTUFBckIsRUFBNkIsUUFBN0IsQ0FBRCxDQUFuQjtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxPQUFuQixFQUE0QjtRQUFBLEtBQUEsRUFBUyxDQUFDLENBQUMsQ0FBQyxTQUFGLENBQVksUUFBUSxDQUFDLE1BQXJCLEVBQTZCLGdCQUE3QixDQUFELENBQUEsR0FBZ0QsWUFBekQ7T0FBNUI7TUFFWCxJQUFDLENBQUEsSUFBRCxHQUFRLFNBQVMsQ0FBQyxZQUFWLENBQXVCO1FBQUEsSUFBQSxFQUFNLElBQU47UUFBWSxRQUFBLEVBQVUsQ0FBQyxFQUF2QjtPQUF2QjthQUVSLElBQUMsQ0FBQSxFQUFELENBQUksT0FBSixFQUFhLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNYLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsSUFBSSxDQUFDLFNBQXhCLENBQXZCLEVBQTJELHlDQUEzRDtVQUNBLEtBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBO2lCQUNBLEtBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBO1FBSFc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWI7SUFOVTs7OztLQU55QjtBQUp2QyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZVVwZGF0ZXNTdGF0dXNWaWV3IGV4dGVuZHMgVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAncGFja2FnZS11cGRhdGVzLXN0YXR1cy12aWV3IGlubGluZS1ibG9jayB0ZXh0IHRleHQtaW5mbycsID0+XG4gICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1wYWNrYWdlJ1xuICAgICAgQHNwYW4gb3V0bGV0OiAnY291bnRMYWJlbCcsIGNsYXNzOiAnYXZhaWxhYmxlLXVwZGF0ZXMtc3RhdHVzJ1xuXG4gIGluaXRpYWxpemU6IChzdGF0dXNCYXIsIHBhY2thZ2VzKSAtPlxuICAgIEBjb3VudExhYmVsLnRleHQoXCIje18ucGx1cmFsaXplKHBhY2thZ2VzLmxlbmd0aCwgJ3VwZGF0ZScpfVwiKVxuICAgIEB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQoQGVsZW1lbnQsIHRpdGxlOiBcIiN7Xy5wbHVyYWxpemUocGFja2FnZXMubGVuZ3RoLCAncGFja2FnZSB1cGRhdGUnKX0gYXZhaWxhYmxlXCIpXG4gICAgIyBQcmlvcml0eSBvZiAtOTkgc2hvdWxkIHB1dCB1cyBqdXN0IHRvIHRoZSBsZWZ0IG9mIHRoZSBTcXVpcnJlbCBpY29uLCB3aGljaCBkaXNwbGF5cyB3aGVuIEF0b20gaGFzIHVwZGF0ZXMgYXZhaWxhYmxlXG4gICAgQHRpbGUgPSBzdGF0dXNCYXIuYWRkUmlnaHRUaWxlKGl0ZW06IHRoaXMsIHByaW9yaXR5OiAtOTkpXG5cbiAgICBAb24gJ2NsaWNrJywgPT5cbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgJ3NldHRpbmdzLXZpZXc6Y2hlY2stZm9yLXBhY2thZ2UtdXBkYXRlcycpXG4gICAgICBAdG9vbHRpcC5kaXNwb3NlKClcbiAgICAgIEB0aWxlLmRlc3Ryb3koKVxuIl19
