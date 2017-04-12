(function() {
  var CompositeDisposable, PaneContainerElement, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  _ = require('underscore-plus');

  module.exports = PaneContainerElement = (function(superClass) {
    extend(PaneContainerElement, superClass);

    function PaneContainerElement() {
      return PaneContainerElement.__super__.constructor.apply(this, arguments);
    }

    PaneContainerElement.prototype.createdCallback = function() {
      this.subscriptions = new CompositeDisposable;
      return this.classList.add('panes');
    };

    PaneContainerElement.prototype.initialize = function(model, arg) {
      this.model = model;
      this.views = arg.views;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing PaneContainerElements");
      }
      this.subscriptions.add(this.model.observeRoot(this.rootChanged.bind(this)));
      return this;
    };

    PaneContainerElement.prototype.rootChanged = function(root) {
      var focusedElement, ref, view;
      if (this.hasFocus()) {
        focusedElement = document.activeElement;
      }
      if ((ref = this.firstChild) != null) {
        ref.remove();
      }
      if (root != null) {
        view = this.views.getView(root);
        this.appendChild(view);
        return focusedElement != null ? focusedElement.focus() : void 0;
      }
    };

    PaneContainerElement.prototype.hasFocus = function() {
      return this === document.activeElement || this.contains(document.activeElement);
    };

    PaneContainerElement.prototype.focusPaneViewAbove = function() {
      var ref;
      return (ref = this.nearestPaneInDirection('above')) != null ? ref.focus() : void 0;
    };

    PaneContainerElement.prototype.focusPaneViewBelow = function() {
      var ref;
      return (ref = this.nearestPaneInDirection('below')) != null ? ref.focus() : void 0;
    };

    PaneContainerElement.prototype.focusPaneViewOnLeft = function() {
      var ref;
      return (ref = this.nearestPaneInDirection('left')) != null ? ref.focus() : void 0;
    };

    PaneContainerElement.prototype.focusPaneViewOnRight = function() {
      var ref;
      return (ref = this.nearestPaneInDirection('right')) != null ? ref.focus() : void 0;
    };

    PaneContainerElement.prototype.moveActiveItemToPaneAbove = function(params) {
      return this.moveActiveItemToNearestPaneInDirection('above', params);
    };

    PaneContainerElement.prototype.moveActiveItemToPaneBelow = function(params) {
      return this.moveActiveItemToNearestPaneInDirection('below', params);
    };

    PaneContainerElement.prototype.moveActiveItemToPaneOnLeft = function(params) {
      return this.moveActiveItemToNearestPaneInDirection('left', params);
    };

    PaneContainerElement.prototype.moveActiveItemToPaneOnRight = function(params) {
      return this.moveActiveItemToNearestPaneInDirection('right', params);
    };

    PaneContainerElement.prototype.moveActiveItemToNearestPaneInDirection = function(direction, params) {
      var destPane, ref;
      destPane = (ref = this.nearestPaneInDirection(direction)) != null ? ref.getModel() : void 0;
      if (destPane == null) {
        return;
      }
      if (params != null ? params.keepOriginal : void 0) {
        this.model.copyActiveItemToPane(destPane);
      } else {
        this.model.moveActiveItemToPane(destPane);
      }
      return destPane.focus();
    };

    PaneContainerElement.prototype.nearestPaneInDirection = function(direction) {
      var box, distance, paneView, paneViews;
      distance = function(pointA, pointB) {
        var x, y;
        x = pointB.x - pointA.x;
        y = pointB.y - pointA.y;
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      };
      paneView = this.views.getView(this.model.getActivePane());
      box = this.boundingBoxForPaneView(paneView);
      paneViews = _.toArray(this.querySelectorAll('atom-pane')).filter((function(_this) {
        return function(otherPaneView) {
          var otherBox;
          otherBox = _this.boundingBoxForPaneView(otherPaneView);
          switch (direction) {
            case 'left':
              return otherBox.right.x <= box.left.x;
            case 'right':
              return otherBox.left.x >= box.right.x;
            case 'above':
              return otherBox.bottom.y <= box.top.y;
            case 'below':
              return otherBox.top.y >= box.bottom.y;
          }
        };
      })(this)).sort((function(_this) {
        return function(paneViewA, paneViewB) {
          var boxA, boxB;
          boxA = _this.boundingBoxForPaneView(paneViewA);
          boxB = _this.boundingBoxForPaneView(paneViewB);
          switch (direction) {
            case 'left':
              return distance(box.left, boxA.right) - distance(box.left, boxB.right);
            case 'right':
              return distance(box.right, boxA.left) - distance(box.right, boxB.left);
            case 'above':
              return distance(box.top, boxA.bottom) - distance(box.top, boxB.bottom);
            case 'below':
              return distance(box.bottom, boxA.top) - distance(box.bottom, boxB.top);
          }
        };
      })(this));
      return paneViews[0];
    };

    PaneContainerElement.prototype.boundingBoxForPaneView = function(paneView) {
      var boundingBox;
      boundingBox = paneView.getBoundingClientRect();
      return {
        left: {
          x: boundingBox.left,
          y: boundingBox.top
        },
        right: {
          x: boundingBox.right,
          y: boundingBox.top
        },
        top: {
          x: boundingBox.left,
          y: boundingBox.top
        },
        bottom: {
          x: boundingBox.left,
          y: boundingBox.bottom
        }
      };
    };

    return PaneContainerElement;

  })(HTMLElement);

  module.exports = PaneContainerElement = document.registerElement('atom-pane-container', {
    prototype: PaneContainerElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLWNvbnRhaW5lci1lbGVtZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNENBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUN4QixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7bUNBQ0osZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTthQUNyQixJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxPQUFmO0lBRmU7O21DQUlqQixVQUFBLEdBQVksU0FBQyxLQUFELEVBQVMsR0FBVDtNQUFDLElBQUMsQ0FBQSxRQUFEO01BQVMsSUFBQyxDQUFBLFFBQUYsSUFBRTtNQUNyQixJQUE4RixrQkFBOUY7QUFBQSxjQUFVLElBQUEsS0FBQSxDQUFNLHFFQUFOLEVBQVY7O01BRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxLQUFLLENBQUMsV0FBUCxDQUFtQixJQUFDLENBQUEsV0FBVyxDQUFDLElBQWIsQ0FBa0IsSUFBbEIsQ0FBbkIsQ0FBbkI7YUFDQTtJQUpVOzttQ0FNWixXQUFBLEdBQWEsU0FBQyxJQUFEO0FBQ1gsVUFBQTtNQUFBLElBQTJDLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBM0M7UUFBQSxjQUFBLEdBQWlCLFFBQVEsQ0FBQyxjQUExQjs7O1dBQ1csQ0FBRSxNQUFiLENBQUE7O01BQ0EsSUFBRyxZQUFIO1FBQ0UsSUFBQSxHQUFPLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWY7UUFDUCxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWI7d0NBQ0EsY0FBYyxDQUFFLEtBQWhC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d0IsU0FBQyxRQUFEO0FBQ3RCLFVBQUE7TUFBQSxXQUFBLEdBQWMsUUFBUSxDQUFDLHFCQUFULENBQUE7YUFFZDtRQUFBLElBQUEsRUFBTTtVQUFDLENBQUEsRUFBRyxXQUFXLENBQUMsSUFBaEI7VUFBc0IsQ0FBQSxFQUFHLFdBQVcsQ0FBQyxHQUFyQztTQUFOO1FBQ0EsS0FBQSxFQUFPO1VBQUMsQ0FBQSxFQUFHLFdBQVcsQ0FBQyxLQUFoQjtVQUF1QixDQUFBLEVBQUcsV0FBVyxDQUFDLEdBQXRDO1NBRFA7UUFFQSxHQUFBLEVBQUs7VUFBQyxDQUFBLEVBQUcsV0FBVyxDQUFDLElBQWhCO1VBQXNCLENBQUEsRUFBRyxXQUFXLENBQUMsR0FBckM7U0FGTDtRQUdBLE1BQUEsRUFBUTtVQUFDLENBQUEsRUFBRyxXQUFXLENBQUMsSUFBaEI7VUFBc0IsQ0FBQSxFQUFHLFdBQVcsQ0FBQyxNQUFyQztTQUhSOztJQUhzQjs7OztLQW5GUzs7RUEyRm5DLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLG9CQUFBLEdBQXVCLFFBQVEsQ0FBQyxlQUFULENBQXlCLHFCQUF6QixFQUFnRDtJQUFBLFNBQUEsRUFBVyxvQkFBb0IsQ0FBQyxTQUFoQztHQUFoRDtBQS9GeEMiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYW5lQ29udGFpbmVyRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGNsYXNzTGlzdC5hZGQgJ3BhbmVzJ1xuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIHtAdmlld3N9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHZpZXdzIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBQYW5lQ29udGFpbmVyRWxlbWVudHNcIikgdW5sZXNzIEB2aWV3cz9cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub2JzZXJ2ZVJvb3QoQHJvb3RDaGFuZ2VkLmJpbmQodGhpcykpXG4gICAgdGhpc1xuXG4gIHJvb3RDaGFuZ2VkOiAocm9vdCkgLT5cbiAgICBmb2N1c2VkRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaWYgQGhhc0ZvY3VzKClcbiAgICBAZmlyc3RDaGlsZD8ucmVtb3ZlKClcbiAgICBpZiByb290P1xuICAgICAgdmlldyA9IEB2aWV3cy5nZXRWaWV3KHJvb3QpXG4gICAgICBAYXBwZW5kQ2hpbGQodmlldylcbiAgICAgIGZvY3VzZWRFbGVtZW50Py5mb2N1cygpXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgdGhpcyBpcyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IG9yIEBjb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuXG4gIGZvY3VzUGFuZVZpZXdBYm92ZTogLT5cbiAgICBAbmVhcmVzdFBhbmVJbkRpcmVjdGlvbignYWJvdmUnKT8uZm9jdXMoKVxuXG4gIGZvY3VzUGFuZVZpZXdCZWxvdzogLT5cbiAgICBAbmVhcmVzdFBhbmVJbkRpcmVjdGlvbignYmVsb3cnKT8uZm9jdXMoKVxuXG4gIGZvY3VzUGFuZVZpZXdPbkxlZnQ6IC0+XG4gICAgQG5lYXJlc3RQYW5lSW5EaXJlY3Rpb24oJ2xlZnQnKT8uZm9jdXMoKVxuXG4gIGZvY3VzUGFuZVZpZXdPblJpZ2h0OiAtPlxuICAgIEBuZWFyZXN0UGFuZUluRGlyZWN0aW9uKCdyaWdodCcpPy5mb2N1cygpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVBYm92ZTogKHBhcmFtcykgLT5cbiAgICBAbW92ZUFjdGl2ZUl0ZW1Ub05lYXJlc3RQYW5lSW5EaXJlY3Rpb24oJ2Fib3ZlJywgcGFyYW1zKVxuXG4gIG1vdmVBY3RpdmVJdGVtVG9QYW5lQmVsb3c6IChwYXJhbXMpIC0+XG4gICAgQG1vdmVBY3RpdmVJdGVtVG9OZWFyZXN0UGFuZUluRGlyZWN0aW9uKCdiZWxvdycsIHBhcmFtcylcblxuICBtb3ZlQWN0aXZlSXRlbVRvUGFuZU9uTGVmdDogKHBhcmFtcykgLT5cbiAgICBAbW92ZUFjdGl2ZUl0ZW1Ub05lYXJlc3RQYW5lSW5EaXJlY3Rpb24oJ2xlZnQnLCBwYXJhbXMpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVPblJpZ2h0OiAocGFyYW1zKSAtPlxuICAgIEBtb3ZlQWN0aXZlSXRlbVRvTmVhcmVzdFBhbmVJbkRpcmVjdGlvbigncmlnaHQnLCBwYXJhbXMpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub05lYXJlc3RQYW5lSW5EaXJlY3Rpb246IChkaXJlY3Rpb24sIHBhcmFtcykgLT5cbiAgICBkZXN0UGFuZSA9IEBuZWFyZXN0UGFuZUluRGlyZWN0aW9uKGRpcmVjdGlvbik/LmdldE1vZGVsKClcbiAgICByZXR1cm4gdW5sZXNzIGRlc3RQYW5lP1xuICAgIGlmIHBhcmFtcz8ua2VlcE9yaWdpbmFsXG4gICAgICBAbW9kZWwuY29weUFjdGl2ZUl0ZW1Ub1BhbmUoZGVzdFBhbmUpXG4gICAgZWxzZVxuICAgICAgQG1vZGVsLm1vdmVBY3RpdmVJdGVtVG9QYW5lKGRlc3RQYW5lKVxuICAgIGRlc3RQYW5lLmZvY3VzKClcblxuICBuZWFyZXN0UGFuZUluRGlyZWN0aW9uOiAoZGlyZWN0aW9uKSAtPlxuICAgIGRpc3RhbmNlID0gKHBvaW50QSwgcG9pbnRCKSAtPlxuICAgICAgeCA9IHBvaW50Qi54IC0gcG9pbnRBLnhcbiAgICAgIHkgPSBwb2ludEIueSAtIHBvaW50QS55XG4gICAgICBNYXRoLnNxcnQoTWF0aC5wb3coeCwgMikgKyBNYXRoLnBvdyh5LCAyKSlcblxuICAgIHBhbmVWaWV3ID0gQHZpZXdzLmdldFZpZXcoQG1vZGVsLmdldEFjdGl2ZVBhbmUoKSlcbiAgICBib3ggPSBAYm91bmRpbmdCb3hGb3JQYW5lVmlldyhwYW5lVmlldylcblxuICAgIHBhbmVWaWV3cyA9IF8udG9BcnJheShAcXVlcnlTZWxlY3RvckFsbCgnYXRvbS1wYW5lJykpXG4gICAgICAuZmlsdGVyIChvdGhlclBhbmVWaWV3KSA9PlxuICAgICAgICBvdGhlckJveCA9IEBib3VuZGluZ0JveEZvclBhbmVWaWV3KG90aGVyUGFuZVZpZXcpXG4gICAgICAgIHN3aXRjaCBkaXJlY3Rpb25cbiAgICAgICAgICB3aGVuICdsZWZ0JyB0aGVuIG90aGVyQm94LnJpZ2h0LnggPD0gYm94LmxlZnQueFxuICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIG90aGVyQm94LmxlZnQueCA+PSBib3gucmlnaHQueFxuICAgICAgICAgIHdoZW4gJ2Fib3ZlJyB0aGVuIG90aGVyQm94LmJvdHRvbS55IDw9IGJveC50b3AueVxuICAgICAgICAgIHdoZW4gJ2JlbG93JyB0aGVuIG90aGVyQm94LnRvcC55ID49IGJveC5ib3R0b20ueVxuICAgICAgLnNvcnQgKHBhbmVWaWV3QSwgcGFuZVZpZXdCKSA9PlxuICAgICAgICBib3hBID0gQGJvdW5kaW5nQm94Rm9yUGFuZVZpZXcocGFuZVZpZXdBKVxuICAgICAgICBib3hCID0gQGJvdW5kaW5nQm94Rm9yUGFuZVZpZXcocGFuZVZpZXdCKVxuICAgICAgICBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgICAgICAgd2hlbiAnbGVmdCcgdGhlbiBkaXN0YW5jZShib3gubGVmdCwgYm94QS5yaWdodCkgLSBkaXN0YW5jZShib3gubGVmdCwgYm94Qi5yaWdodClcbiAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBkaXN0YW5jZShib3gucmlnaHQsIGJveEEubGVmdCkgLSBkaXN0YW5jZShib3gucmlnaHQsIGJveEIubGVmdClcbiAgICAgICAgICB3aGVuICdhYm92ZScgdGhlbiBkaXN0YW5jZShib3gudG9wLCBib3hBLmJvdHRvbSkgLSBkaXN0YW5jZShib3gudG9wLCBib3hCLmJvdHRvbSlcbiAgICAgICAgICB3aGVuICdiZWxvdycgdGhlbiBkaXN0YW5jZShib3guYm90dG9tLCBib3hBLnRvcCkgLSBkaXN0YW5jZShib3guYm90dG9tLCBib3hCLnRvcClcblxuICAgIHBhbmVWaWV3c1swXVxuXG4gIGJvdW5kaW5nQm94Rm9yUGFuZVZpZXc6IChwYW5lVmlldykgLT5cbiAgICBib3VuZGluZ0JveCA9IHBhbmVWaWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICBsZWZ0OiB7eDogYm91bmRpbmdCb3gubGVmdCwgeTogYm91bmRpbmdCb3gudG9wfVxuICAgIHJpZ2h0OiB7eDogYm91bmRpbmdCb3gucmlnaHQsIHk6IGJvdW5kaW5nQm94LnRvcH1cbiAgICB0b3A6IHt4OiBib3VuZGluZ0JveC5sZWZ0LCB5OiBib3VuZGluZ0JveC50b3B9XG4gICAgYm90dG9tOiB7eDogYm91bmRpbmdCb3gubGVmdCwgeTogYm91bmRpbmdCb3guYm90dG9tfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVDb250YWluZXJFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdhdG9tLXBhbmUtY29udGFpbmVyJywgcHJvdG90eXBlOiBQYW5lQ29udGFpbmVyRWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
