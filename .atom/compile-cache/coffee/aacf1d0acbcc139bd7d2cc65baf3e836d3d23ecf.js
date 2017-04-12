(function() {
  var CompositeDisposable, Panel, PanelElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  Panel = require('./panel');

  PanelElement = (function(superClass) {
    extend(PanelElement, superClass);

    function PanelElement() {
      return PanelElement.__super__.constructor.apply(this, arguments);
    }

    PanelElement.prototype.createdCallback = function() {
      return this.subscriptions = new CompositeDisposable;
    };

    PanelElement.prototype.initialize = function(model, arg) {
      var ref;
      this.model = model;
      this.views = arg.views;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing PanelElements");
      }
      this.appendChild(this.getItemView());
      if (this.model.getClassName() != null) {
        (ref = this.classList).add.apply(ref, this.model.getClassName().split(' '));
      }
      this.subscriptions.add(this.model.onDidChangeVisible(this.visibleChanged.bind(this)));
      this.subscriptions.add(this.model.onDidDestroy(this.destroyed.bind(this)));
      return this;
    };

    PanelElement.prototype.getModel = function() {
      return this.model != null ? this.model : this.model = new Panel;
    };

    PanelElement.prototype.getItemView = function() {
      return this.views.getView(this.getModel().getItem());
    };

    PanelElement.prototype.attachedCallback = function() {
      return this.visibleChanged(this.getModel().isVisible());
    };

    PanelElement.prototype.visibleChanged = function(visible) {
      if (visible) {
        return this.style.display = null;
      } else {
        return this.style.display = 'none';
      }
    };

    PanelElement.prototype.destroyed = function() {
      this.subscriptions.dispose();
      return this.remove();
    };

    return PanelElement;

  })(HTMLElement);

  module.exports = PanelElement = document.registerElement('atom-panel', {
    prototype: PanelElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lbC1lbGVtZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0NBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUN4QixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBRUY7Ozs7Ozs7MkJBQ0osZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtJQUROOzsyQkFHakIsVUFBQSxHQUFZLFNBQUMsS0FBRCxFQUFTLEdBQVQ7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLFFBQUQ7TUFBUyxJQUFDLENBQUEsUUFBRixJQUFFO01BQ3JCLElBQXNGLGtCQUF0RjtBQUFBLGNBQVUsSUFBQSxLQUFBLENBQU0sNkRBQU4sRUFBVjs7TUFFQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FBYjtNQUVBLElBQXVELGlDQUF2RDtRQUFBLE9BQUEsSUFBQyxDQUFBLFNBQUQsQ0FBVSxDQUFDLEdBQVgsWUFBZSxJQUFDLENBQUEsS0FBSyxDQUFDLFlBQVAsQ0FBQSxDQUFxQixDQUFDLEtBQXRCLENBQTRCLEdBQTVCLENBQWYsRUFBQTs7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxrQkFBUCxDQUEwQixJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQXFCLElBQXJCLENBQTFCLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFvQixJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBcEIsQ0FBbkI7YUFDQTtJQVJVOzsyQkFVWixRQUFBLEdBQVUsU0FBQTtrQ0FDUixJQUFDLENBQUEsUUFBRCxJQUFDLENBQUEsUUFBUyxJQUFJO0lBRE47OzJCQUdWLFdBQUEsR0FBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFXLENBQUMsT0FBWixDQUFBLENBQWY7SUFEVzs7MkJBR2IsZ0JBQUEsR0FBa0IsU0FBQTthQUNoQixJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxTQUFaLENBQUEsQ0FBaEI7SUFEZ0I7OzJCQUdsQixjQUFBLEdBQWdCLFNBQUMsT0FBRDtNQUNkLElBQUcsT0FBSDtlQUNFLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxHQUFpQixLQURuQjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsR0FBaUIsT0FIbkI7O0lBRGM7OzJCQU1oQixTQUFBLEdBQVcsU0FBQTtNQUNULElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO2FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUZTOzs7O0tBN0JjOztFQWlDM0IsTUFBTSxDQUFDLE9BQVAsR0FBaUIsWUFBQSxHQUFlLFFBQVEsQ0FBQyxlQUFULENBQXlCLFlBQXpCLEVBQXVDO0lBQUEsU0FBQSxFQUFXLFlBQVksQ0FBQyxTQUF4QjtHQUF2QztBQXBDaEMiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5QYW5lbCA9IHJlcXVpcmUgJy4vcGFuZWwnXG5cbmNsYXNzIFBhbmVsRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwge0B2aWV3c30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgdmlld3MgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFBhbmVsRWxlbWVudHNcIikgdW5sZXNzIEB2aWV3cz9cblxuICAgIEBhcHBlbmRDaGlsZChAZ2V0SXRlbVZpZXcoKSlcblxuICAgIEBjbGFzc0xpc3QuYWRkKEBtb2RlbC5nZXRDbGFzc05hbWUoKS5zcGxpdCgnICcpLi4uKSBpZiBAbW9kZWwuZ2V0Q2xhc3NOYW1lKCk/XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZENoYW5nZVZpc2libGUoQHZpc2libGVDaGFuZ2VkLmJpbmQodGhpcykpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZERlc3Ryb3koQGRlc3Ryb3llZC5iaW5kKHRoaXMpKVxuICAgIHRoaXNcblxuICBnZXRNb2RlbDogLT5cbiAgICBAbW9kZWwgPz0gbmV3IFBhbmVsXG5cbiAgZ2V0SXRlbVZpZXc6IC0+XG4gICAgQHZpZXdzLmdldFZpZXcoQGdldE1vZGVsKCkuZ2V0SXRlbSgpKVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2s6IC0+XG4gICAgQHZpc2libGVDaGFuZ2VkKEBnZXRNb2RlbCgpLmlzVmlzaWJsZSgpKVxuXG4gIHZpc2libGVDaGFuZ2VkOiAodmlzaWJsZSkgLT5cbiAgICBpZiB2aXNpYmxlXG4gICAgICBAc3R5bGUuZGlzcGxheSA9IG51bGxcbiAgICBlbHNlXG4gICAgICBAc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gIGRlc3Ryb3llZDogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAcmVtb3ZlKClcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tcGFuZWwnLCBwcm90b3R5cGU6IFBhbmVsRWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
