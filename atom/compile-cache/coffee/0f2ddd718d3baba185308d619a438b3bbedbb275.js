(function() {
  var CompositeDisposable, DeprecationCopStatusBarView, Grim, View, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  View = require('atom-space-pen-views').View;

  _ = require('underscore-plus');

  Grim = require('grim');

  module.exports = DeprecationCopStatusBarView = (function(superClass) {
    extend(DeprecationCopStatusBarView, superClass);

    function DeprecationCopStatusBarView() {
      this.update = bind(this.update, this);
      return DeprecationCopStatusBarView.__super__.constructor.apply(this, arguments);
    }

    DeprecationCopStatusBarView.content = function() {
      return this.div({
        "class": 'deprecation-cop-status inline-block text-warning',
        tabindex: -1
      }, (function(_this) {
        return function() {
          _this.span({
            "class": 'icon icon-alert'
          });
          return _this.span({
            "class": 'deprecation-number',
            outlet: 'deprecationNumber'
          }, '0');
        };
      })(this));
    };

    DeprecationCopStatusBarView.prototype.lastLength = null;

    DeprecationCopStatusBarView.prototype.toolTipDisposable = null;

    DeprecationCopStatusBarView.prototype.initialize = function() {
      var debouncedUpdateDeprecatedSelectorCount;
      debouncedUpdateDeprecatedSelectorCount = _.debounce(this.update, 1000);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(Grim.on('updated', this.update));
      if (atom.styles.onDidUpdateDeprecations != null) {
        return this.subscriptions.add(atom.styles.onDidUpdateDeprecations(debouncedUpdateDeprecatedSelectorCount));
      }
    };

    DeprecationCopStatusBarView.prototype.destroy = function() {
      this.subscriptions.dispose();
      return this.detach();
    };

    DeprecationCopStatusBarView.prototype.attached = function() {
      this.update();
      return this.click(function() {
        var workspaceElement;
        workspaceElement = atom.views.getView(atom.workspace);
        return atom.commands.dispatch(workspaceElement, 'deprecation-cop:view');
      });
    };

    DeprecationCopStatusBarView.prototype.getDeprecatedCallCount = function() {
      return Grim.getDeprecations().map(function(d) {
        return d.getStackCount();
      }).reduce((function(a, b) {
        return a + b;
      }), 0);
    };

    DeprecationCopStatusBarView.prototype.getDeprecatedStyleSheetsCount = function() {
      if (atom.styles.getDeprecations != null) {
        return Object.keys(atom.styles.getDeprecations()).length;
      } else {
        return 0;
      }
    };

    DeprecationCopStatusBarView.prototype.update = function() {
      var length, ref;
      length = this.getDeprecatedCallCount() + this.getDeprecatedStyleSheetsCount();
      if (this.lastLength === length) {
        return;
      }
      this.lastLength = length;
      this.deprecationNumber.text("" + (_.pluralize(length, 'deprecation')));
      if ((ref = this.toolTipDisposable) != null) {
        ref.dispose();
      }
      this.toolTipDisposable = atom.tooltips.add(this.element, {
        title: (_.pluralize(length, 'call')) + " to deprecated methods"
      });
      if (length === 0) {
        return this.hide();
      } else {
        return this.show();
      }
    };

    return DeprecationCopStatusBarView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXByZWNhdGlvbi1jb3AvbGliL2RlcHJlY2F0aW9uLWNvcC1zdGF0dXMtYmFyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrREFBQTtJQUFBOzs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN2QixPQUFRLE9BQUEsQ0FBUSxzQkFBUjs7RUFDVCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OztJQUNKLDJCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrREFBUDtRQUEyRCxRQUFBLEVBQVUsQ0FBQyxDQUF0RTtPQUFMLEVBQThFLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUM1RSxLQUFDLENBQUEsSUFBRCxDQUFNO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBUDtXQUFOO2lCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1lBQTZCLE1BQUEsRUFBUSxtQkFBckM7V0FBTixFQUFnRSxHQUFoRTtRQUY0RTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUU7SUFEUTs7MENBS1YsVUFBQSxHQUFZOzswQ0FDWixpQkFBQSxHQUFtQjs7MENBRW5CLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLHNDQUFBLEdBQXlDLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBQyxDQUFBLE1BQVosRUFBb0IsSUFBcEI7TUFFekMsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQW1CLElBQUMsQ0FBQSxNQUFwQixDQUFuQjtNQUVBLElBQUcsMkNBQUg7ZUFDRSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBWixDQUFvQyxzQ0FBcEMsQ0FBbkIsRUFERjs7SUFOVTs7MENBU1osT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFGTzs7MENBSVQsUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsTUFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxTQUFBO0FBQ0wsWUFBQTtRQUFBLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7ZUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLGdCQUF2QixFQUF5QyxzQkFBekM7TUFGSyxDQUFQO0lBRlE7OzBDQU1WLHNCQUFBLEdBQXdCLFNBQUE7YUFDdEIsSUFBSSxDQUFDLGVBQUwsQ0FBQSxDQUFzQixDQUFDLEdBQXZCLENBQTJCLFNBQUMsQ0FBRDtlQUFPLENBQUMsQ0FBQyxhQUFGLENBQUE7TUFBUCxDQUEzQixDQUFvRCxDQUFDLE1BQXJELENBQTRELENBQUMsU0FBQyxDQUFELEVBQUksQ0FBSjtlQUFVLENBQUEsR0FBSTtNQUFkLENBQUQsQ0FBNUQsRUFBK0UsQ0FBL0U7SUFEc0I7OzBDQUd4Qiw2QkFBQSxHQUErQixTQUFBO01BRTdCLElBQUcsbUNBQUg7ZUFDRSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBWixDQUFBLENBQVosQ0FBMEMsQ0FBQyxPQUQ3QztPQUFBLE1BQUE7ZUFHRSxFQUhGOztJQUY2Qjs7MENBTy9CLE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsc0JBQUQsQ0FBQSxDQUFBLEdBQTRCLElBQUMsQ0FBQSw2QkFBRCxDQUFBO01BRXJDLElBQVUsSUFBQyxDQUFBLFVBQUQsS0FBZSxNQUF6QjtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLFVBQUQsR0FBYztNQUNkLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxJQUFuQixDQUF3QixFQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLE1BQVosRUFBb0IsYUFBcEIsQ0FBRCxDQUExQjs7V0FDa0IsQ0FBRSxPQUFwQixDQUFBOztNQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLE9BQW5CLEVBQTRCO1FBQUEsS0FBQSxFQUFTLENBQUMsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxNQUFaLEVBQW9CLE1BQXBCLENBQUQsQ0FBQSxHQUE2Qix3QkFBdEM7T0FBNUI7TUFFckIsSUFBRyxNQUFBLEtBQVUsQ0FBYjtlQUNFLElBQUMsQ0FBQSxJQUFELENBQUEsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBSEY7O0lBVk07Ozs7S0F0Q2dDO0FBTjFDIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBEZXByZWNhdGlvbkNvcFN0YXR1c0JhclZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdkZXByZWNhdGlvbi1jb3Atc3RhdHVzIGlubGluZS1ibG9jayB0ZXh0LXdhcm5pbmcnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1hbGVydCdcbiAgICAgIEBzcGFuIGNsYXNzOiAnZGVwcmVjYXRpb24tbnVtYmVyJywgb3V0bGV0OiAnZGVwcmVjYXRpb25OdW1iZXInLCAnMCdcblxuICBsYXN0TGVuZ3RoOiBudWxsXG4gIHRvb2xUaXBEaXNwb3NhYmxlOiBudWxsXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBkZWJvdW5jZWRVcGRhdGVEZXByZWNhdGVkU2VsZWN0b3JDb3VudCA9IF8uZGVib3VuY2UoQHVwZGF0ZSwgMTAwMClcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgR3JpbS5vbiAndXBkYXRlZCcsIEB1cGRhdGVcbiAgICAjIFRPRE86IFJlbW92ZSBjb25kaXRpb25hbCB3aGVuIHRoZSBuZXcgU3R5bGVNYW5hZ2VyIGRlcHJlY2F0aW9uIEFQSXMgcmVhY2ggc3RhYmxlLlxuICAgIGlmIGF0b20uc3R5bGVzLm9uRGlkVXBkYXRlRGVwcmVjYXRpb25zP1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uc3R5bGVzLm9uRGlkVXBkYXRlRGVwcmVjYXRpb25zKGRlYm91bmNlZFVwZGF0ZURlcHJlY2F0ZWRTZWxlY3RvckNvdW50KSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBkZXRhY2goKVxuXG4gIGF0dGFjaGVkOiAtPlxuICAgIEB1cGRhdGUoKVxuICAgIEBjbGljayAtPlxuICAgICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2ggd29ya3NwYWNlRWxlbWVudCwgJ2RlcHJlY2F0aW9uLWNvcDp2aWV3J1xuXG4gIGdldERlcHJlY2F0ZWRDYWxsQ291bnQ6IC0+XG4gICAgR3JpbS5nZXREZXByZWNhdGlvbnMoKS5tYXAoKGQpIC0+IGQuZ2V0U3RhY2tDb3VudCgpKS5yZWR1Y2UoKChhLCBiKSAtPiBhICsgYiksIDApXG5cbiAgZ2V0RGVwcmVjYXRlZFN0eWxlU2hlZXRzQ291bnQ6IC0+XG4gICAgIyBUT0RPOiBSZW1vdmUgY29uZGl0aW9uYWwgd2hlbiB0aGUgbmV3IFN0eWxlTWFuYWdlciBkZXByZWNhdGlvbiBBUElzIHJlYWNoIHN0YWJsZS5cbiAgICBpZiBhdG9tLnN0eWxlcy5nZXREZXByZWNhdGlvbnM/XG4gICAgICBPYmplY3Qua2V5cyhhdG9tLnN0eWxlcy5nZXREZXByZWNhdGlvbnMoKSkubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgMFxuXG4gIHVwZGF0ZTogPT5cbiAgICBsZW5ndGggPSBAZ2V0RGVwcmVjYXRlZENhbGxDb3VudCgpICsgQGdldERlcHJlY2F0ZWRTdHlsZVNoZWV0c0NvdW50KClcblxuICAgIHJldHVybiBpZiBAbGFzdExlbmd0aCBpcyBsZW5ndGhcblxuICAgIEBsYXN0TGVuZ3RoID0gbGVuZ3RoXG4gICAgQGRlcHJlY2F0aW9uTnVtYmVyLnRleHQoXCIje18ucGx1cmFsaXplKGxlbmd0aCwgJ2RlcHJlY2F0aW9uJyl9XCIpXG4gICAgQHRvb2xUaXBEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICBAdG9vbFRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCBAZWxlbWVudCwgdGl0bGU6IFwiI3tfLnBsdXJhbGl6ZShsZW5ndGgsICdjYWxsJyl9IHRvIGRlcHJlY2F0ZWQgbWV0aG9kc1wiXG5cbiAgICBpZiBsZW5ndGggaXMgMFxuICAgICAgQGhpZGUoKVxuICAgIGVsc2VcbiAgICAgIEBzaG93KClcbiJdfQ==
