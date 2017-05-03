(function() {
  var CompositeDisposable, PanelContainerElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  PanelContainerElement = (function(superClass) {
    extend(PanelContainerElement, superClass);

    function PanelContainerElement() {
      return PanelContainerElement.__super__.constructor.apply(this, arguments);
    }

    PanelContainerElement.prototype.createdCallback = function() {
      return this.subscriptions = new CompositeDisposable;
    };

    PanelContainerElement.prototype.initialize = function(model, arg) {
      this.model = model;
      this.views = arg.views;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing PanelContainerElements");
      }
      this.subscriptions.add(this.model.onDidAddPanel(this.panelAdded.bind(this)));
      this.subscriptions.add(this.model.onDidDestroy(this.destroyed.bind(this)));
      this.classList.add(this.model.getLocation());
      return this;
    };

    PanelContainerElement.prototype.getModel = function() {
      return this.model;
    };

    PanelContainerElement.prototype.panelAdded = function(arg) {
      var index, panel, panelElement, referenceItem;
      panel = arg.panel, index = arg.index;
      panelElement = this.views.getView(panel);
      panelElement.classList.add(this.model.getLocation());
      if (this.model.isModal()) {
        panelElement.classList.add("overlay", "from-top");
      } else {
        panelElement.classList.add("tool-panel", "panel-" + (this.model.getLocation()));
      }
      if (index >= this.childNodes.length) {
        this.appendChild(panelElement);
      } else {
        referenceItem = this.childNodes[index];
        this.insertBefore(panelElement, referenceItem);
      }
      if (this.model.isModal()) {
        this.hideAllPanelsExcept(panel);
        return this.subscriptions.add(panel.onDidChangeVisible((function(_this) {
          return function(visible) {
            if (visible) {
              return _this.hideAllPanelsExcept(panel);
            }
          };
        })(this)));
      }
    };

    PanelContainerElement.prototype.destroyed = function() {
      var ref;
      this.subscriptions.dispose();
      return (ref = this.parentNode) != null ? ref.removeChild(this) : void 0;
    };

    PanelContainerElement.prototype.hideAllPanelsExcept = function(excludedPanel) {
      var i, len, panel, ref;
      ref = this.model.getPanels();
      for (i = 0, len = ref.length; i < len; i++) {
        panel = ref[i];
        if (panel !== excludedPanel) {
          panel.hide();
        }
      }
    };

    return PanelContainerElement;

  })(HTMLElement);

  module.exports = PanelContainerElement = document.registerElement('atom-panel-container', {
    prototype: PanelContainerElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lbC1jb250YWluZXItZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBDQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsV0FBUjs7RUFFbEI7Ozs7Ozs7b0NBQ0osZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtJQUROOztvQ0FHakIsVUFBQSxHQUFZLFNBQUMsS0FBRCxFQUFTLEdBQVQ7TUFBQyxJQUFDLENBQUEsUUFBRDtNQUFTLElBQUMsQ0FBQSxRQUFGLElBQUU7TUFDckIsSUFBK0Ysa0JBQS9GO0FBQUEsY0FBVSxJQUFBLEtBQUEsQ0FBTSxzRUFBTixFQUFWOztNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsS0FBSyxDQUFDLGFBQVAsQ0FBcUIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBQXJCLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFvQixJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBcEIsQ0FBbkI7TUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBQSxDQUFmO2FBQ0E7SUFOVTs7b0NBUVosUUFBQSxHQUFVLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7b0NBRVYsVUFBQSxHQUFZLFNBQUMsR0FBRDtBQUNWLFVBQUE7TUFEWSxtQkFBTztNQUNuQixZQUFBLEdBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQWUsS0FBZjtNQUNmLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBdkIsQ0FBMkIsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQUEsQ0FBM0I7TUFDQSxJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBLENBQUg7UUFDRSxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQXZCLENBQTJCLFNBQTNCLEVBQXNDLFVBQXRDLEVBREY7T0FBQSxNQUFBO1FBR0UsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUF2QixDQUEyQixZQUEzQixFQUF5QyxRQUFBLEdBQVEsQ0FBQyxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBQSxDQUFELENBQWpELEVBSEY7O01BS0EsSUFBRyxLQUFBLElBQVMsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUF4QjtRQUNFLElBQUMsQ0FBQSxXQUFELENBQWEsWUFBYixFQURGO09BQUEsTUFBQTtRQUdFLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLFVBQVcsQ0FBQSxLQUFBO1FBQzVCLElBQUMsQ0FBQSxZQUFELENBQWMsWUFBZCxFQUE0QixhQUE1QixFQUpGOztNQU1BLElBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUEsQ0FBSDtRQUNFLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQjtlQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixLQUFLLENBQUMsa0JBQU4sQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxPQUFEO1lBQzFDLElBQStCLE9BQS9CO3FCQUFBLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQUFBOztVQUQwQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekIsQ0FBbkIsRUFGRjs7SUFkVTs7b0NBbUJaLFNBQUEsR0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO2tEQUNXLENBQUUsV0FBYixDQUF5QixJQUF6QjtJQUZTOztvQ0FJWCxtQkFBQSxHQUFxQixTQUFDLGFBQUQ7QUFDbkIsVUFBQTtBQUFBO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxJQUFvQixLQUFBLEtBQVMsYUFBN0I7VUFBQSxLQUFLLENBQUMsSUFBTixDQUFBLEVBQUE7O0FBREY7SUFEbUI7Ozs7S0FyQ2E7O0VBMENwQyxNQUFNLENBQUMsT0FBUCxHQUFpQixxQkFBQSxHQUF3QixRQUFRLENBQUMsZUFBVCxDQUF5QixzQkFBekIsRUFBaUQ7SUFBQSxTQUFBLEVBQVcscUJBQXFCLENBQUMsU0FBakM7R0FBakQ7QUE1Q3pDIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5jbGFzcyBQYW5lbENvbnRhaW5lckVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIHtAdmlld3N9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHZpZXdzIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBQYW5lbENvbnRhaW5lckVsZW1lbnRzXCIpIHVubGVzcyBAdmlld3M/XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkQWRkUGFuZWwoQHBhbmVsQWRkZWQuYmluZCh0aGlzKSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkRGVzdHJveShAZGVzdHJveWVkLmJpbmQodGhpcykpXG4gICAgQGNsYXNzTGlzdC5hZGQoQG1vZGVsLmdldExvY2F0aW9uKCkpXG4gICAgdGhpc1xuXG4gIGdldE1vZGVsOiAtPiBAbW9kZWxcblxuICBwYW5lbEFkZGVkOiAoe3BhbmVsLCBpbmRleH0pIC0+XG4gICAgcGFuZWxFbGVtZW50ID0gQHZpZXdzLmdldFZpZXcocGFuZWwpXG4gICAgcGFuZWxFbGVtZW50LmNsYXNzTGlzdC5hZGQoQG1vZGVsLmdldExvY2F0aW9uKCkpXG4gICAgaWYgQG1vZGVsLmlzTW9kYWwoKVxuICAgICAgcGFuZWxFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJvdmVybGF5XCIsIFwiZnJvbS10b3BcIilcbiAgICBlbHNlXG4gICAgICBwYW5lbEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRvb2wtcGFuZWxcIiwgXCJwYW5lbC0je0Btb2RlbC5nZXRMb2NhdGlvbigpfVwiKVxuXG4gICAgaWYgaW5kZXggPj0gQGNoaWxkTm9kZXMubGVuZ3RoXG4gICAgICBAYXBwZW5kQ2hpbGQocGFuZWxFbGVtZW50KVxuICAgIGVsc2VcbiAgICAgIHJlZmVyZW5jZUl0ZW0gPSBAY2hpbGROb2Rlc1tpbmRleF1cbiAgICAgIEBpbnNlcnRCZWZvcmUocGFuZWxFbGVtZW50LCByZWZlcmVuY2VJdGVtKVxuXG4gICAgaWYgQG1vZGVsLmlzTW9kYWwoKVxuICAgICAgQGhpZGVBbGxQYW5lbHNFeGNlcHQocGFuZWwpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcGFuZWwub25EaWRDaGFuZ2VWaXNpYmxlICh2aXNpYmxlKSA9PlxuICAgICAgICBAaGlkZUFsbFBhbmVsc0V4Y2VwdChwYW5lbCkgaWYgdmlzaWJsZVxuXG4gIGRlc3Ryb3llZDogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAcGFyZW50Tm9kZT8ucmVtb3ZlQ2hpbGQodGhpcylcblxuICBoaWRlQWxsUGFuZWxzRXhjZXB0OiAoZXhjbHVkZWRQYW5lbCkgLT5cbiAgICBmb3IgcGFuZWwgaW4gQG1vZGVsLmdldFBhbmVscygpXG4gICAgICBwYW5lbC5oaWRlKCkgdW5sZXNzIHBhbmVsIGlzIGV4Y2x1ZGVkUGFuZWxcbiAgICByZXR1cm5cblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbENvbnRhaW5lckVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tcGFuZWwtY29udGFpbmVyJywgcHJvdG90eXBlOiBQYW5lbENvbnRhaW5lckVsZW1lbnQucHJvdG90eXBlXG4iXX0=
