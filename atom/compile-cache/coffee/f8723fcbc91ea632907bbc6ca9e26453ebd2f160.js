(function() {
  var LayerDecoration, idCounter, nextId;

  idCounter = 0;

  nextId = function() {
    return idCounter++;
  };

  module.exports = LayerDecoration = (function() {
    function LayerDecoration(markerLayer, decorationManager, properties1) {
      this.markerLayer = markerLayer;
      this.decorationManager = decorationManager;
      this.properties = properties1;
      this.id = nextId();
      this.destroyed = false;
      this.markerLayerDestroyedDisposable = this.markerLayer.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
      this.overridePropertiesByMarkerId = {};
    }

    LayerDecoration.prototype.destroy = function() {
      if (this.destroyed) {
        return;
      }
      this.markerLayerDestroyedDisposable.dispose();
      this.markerLayerDestroyedDisposable = null;
      this.destroyed = true;
      return this.decorationManager.didDestroyLayerDecoration(this);
    };

    LayerDecoration.prototype.isDestroyed = function() {
      return this.destroyed;
    };

    LayerDecoration.prototype.getId = function() {
      return this.id;
    };

    LayerDecoration.prototype.getMarkerLayer = function() {
      return this.markerLayer;
    };

    LayerDecoration.prototype.getProperties = function() {
      return this.properties;
    };

    LayerDecoration.prototype.setProperties = function(newProperties) {
      if (this.destroyed) {
        return;
      }
      this.properties = newProperties;
      return this.decorationManager.scheduleUpdateDecorationsEvent();
    };

    LayerDecoration.prototype.setPropertiesForMarker = function(marker, properties) {
      if (this.destroyed) {
        return;
      }
      if (properties != null) {
        this.overridePropertiesByMarkerId[marker.id] = properties;
      } else {
        delete this.overridePropertiesByMarkerId[marker.id];
      }
      return this.decorationManager.scheduleUpdateDecorationsEvent();
    };

    return LayerDecoration;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9sYXllci1kZWNvcmF0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsU0FBQSxHQUFZOztFQUNaLE1BQUEsR0FBUyxTQUFBO1dBQUcsU0FBQTtFQUFIOztFQUlULE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx5QkFBQyxXQUFELEVBQWUsaUJBQWYsRUFBbUMsV0FBbkM7TUFBQyxJQUFDLENBQUEsY0FBRDtNQUFjLElBQUMsQ0FBQSxvQkFBRDtNQUFvQixJQUFDLENBQUEsYUFBRDtNQUM5QyxJQUFDLENBQUEsRUFBRCxHQUFNLE1BQUEsQ0FBQTtNQUNOLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsOEJBQUQsR0FBa0MsSUFBQyxDQUFBLFdBQVcsQ0FBQyxZQUFiLENBQTBCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsT0FBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFCO01BQ2xDLElBQUMsQ0FBQSw0QkFBRCxHQUFnQztJQUpyQjs7OEJBT2IsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFVLElBQUMsQ0FBQSxTQUFYO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsOEJBQThCLENBQUMsT0FBaEMsQ0FBQTtNQUNBLElBQUMsQ0FBQSw4QkFBRCxHQUFrQztNQUNsQyxJQUFDLENBQUEsU0FBRCxHQUFhO2FBQ2IsSUFBQyxDQUFBLGlCQUFpQixDQUFDLHlCQUFuQixDQUE2QyxJQUE3QztJQUxPOzs4QkFVVCxXQUFBLEdBQWEsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs4QkFFYixLQUFBLEdBQU8sU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs4QkFFUCxjQUFBLEdBQWdCLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7OEJBS2hCLGFBQUEsR0FBZSxTQUFBO2FBQ2IsSUFBQyxDQUFBO0lBRFk7OzhCQVFmLGFBQUEsR0FBZSxTQUFDLGFBQUQ7TUFDYixJQUFVLElBQUMsQ0FBQSxTQUFYO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO2FBQ2QsSUFBQyxDQUFBLGlCQUFpQixDQUFDLDhCQUFuQixDQUFBO0lBSGE7OzhCQVdmLHNCQUFBLEdBQXdCLFNBQUMsTUFBRCxFQUFTLFVBQVQ7TUFDdEIsSUFBVSxJQUFDLENBQUEsU0FBWDtBQUFBLGVBQUE7O01BQ0EsSUFBRyxrQkFBSDtRQUNFLElBQUMsQ0FBQSw0QkFBNkIsQ0FBQSxNQUFNLENBQUMsRUFBUCxDQUE5QixHQUEyQyxXQUQ3QztPQUFBLE1BQUE7UUFHRSxPQUFPLElBQUMsQ0FBQSw0QkFBNkIsQ0FBQSxNQUFNLENBQUMsRUFBUCxFQUh2Qzs7YUFJQSxJQUFDLENBQUEsaUJBQWlCLENBQUMsOEJBQW5CLENBQUE7SUFOc0I7Ozs7O0FBcEQxQiIsInNvdXJjZXNDb250ZW50IjpbImlkQ291bnRlciA9IDBcbm5leHRJZCA9IC0+IGlkQ291bnRlcisrXG5cbiMgRXNzZW50aWFsOiBSZXByZXNlbnRzIGEgZGVjb3JhdGlvbiB0aGF0IGFwcGxpZXMgdG8gZXZlcnkgbWFya2VyIG9uIGEgZ2l2ZW5cbiMgbGF5ZXIuIENyZWF0ZWQgdmlhIHtUZXh0RWRpdG9yOjpkZWNvcmF0ZU1hcmtlckxheWVyfS5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIExheWVyRGVjb3JhdGlvblxuICBjb25zdHJ1Y3RvcjogKEBtYXJrZXJMYXllciwgQGRlY29yYXRpb25NYW5hZ2VyLCBAcHJvcGVydGllcykgLT5cbiAgICBAaWQgPSBuZXh0SWQoKVxuICAgIEBkZXN0cm95ZWQgPSBmYWxzZVxuICAgIEBtYXJrZXJMYXllckRlc3Ryb3llZERpc3Bvc2FibGUgPSBAbWFya2VyTGF5ZXIub25EaWREZXN0cm95ID0+IEBkZXN0cm95KClcbiAgICBAb3ZlcnJpZGVQcm9wZXJ0aWVzQnlNYXJrZXJJZCA9IHt9XG5cbiAgIyBFc3NlbnRpYWw6IERlc3Ryb3lzIHRoZSBkZWNvcmF0aW9uLlxuICBkZXN0cm95OiAtPlxuICAgIHJldHVybiBpZiBAZGVzdHJveWVkXG4gICAgQG1hcmtlckxheWVyRGVzdHJveWVkRGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICBAbWFya2VyTGF5ZXJEZXN0cm95ZWREaXNwb3NhYmxlID0gbnVsbFxuICAgIEBkZXN0cm95ZWQgPSB0cnVlXG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLmRpZERlc3Ryb3lMYXllckRlY29yYXRpb24odGhpcylcblxuICAjIEVzc2VudGlhbDogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBkZWNvcmF0aW9uIGlzIGRlc3Ryb3llZC5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzRGVzdHJveWVkOiAtPiBAZGVzdHJveWVkXG5cbiAgZ2V0SWQ6IC0+IEBpZFxuXG4gIGdldE1hcmtlckxheWVyOiAtPiBAbWFya2VyTGF5ZXJcblxuICAjIEVzc2VudGlhbDogR2V0IHRoaXMgZGVjb3JhdGlvbidzIHByb3BlcnRpZXMuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtPYmplY3R9LlxuICBnZXRQcm9wZXJ0aWVzOiAtPlxuICAgIEBwcm9wZXJ0aWVzXG5cbiAgIyBFc3NlbnRpYWw6IFNldCB0aGlzIGRlY29yYXRpb24ncyBwcm9wZXJ0aWVzLlxuICAjXG4gICMgKiBgbmV3UHJvcGVydGllc2AgU2VlIHtUZXh0RWRpdG9yOjpkZWNvcmF0ZU1hcmtlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24gb25cbiAgIyAgIHRoZSBwcm9wZXJ0aWVzLiBUaGUgYHR5cGVgIG9mIGBndXR0ZXJgIGFuZCBgb3ZlcmxheWAgYXJlIG5vdCBzdXBwb3J0ZWQgb25cbiAgIyAgIGxheWVyIGRlY29yYXRpb25zLlxuICBzZXRQcm9wZXJ0aWVzOiAobmV3UHJvcGVydGllcykgLT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIEBwcm9wZXJ0aWVzID0gbmV3UHJvcGVydGllc1xuICAgIEBkZWNvcmF0aW9uTWFuYWdlci5zY2hlZHVsZVVwZGF0ZURlY29yYXRpb25zRXZlbnQoKVxuXG4gICMgRXNzZW50aWFsOiBPdmVycmlkZSB0aGUgZGVjb3JhdGlvbiBwcm9wZXJ0aWVzIGZvciBhIHNwZWNpZmljIG1hcmtlci5cbiAgI1xuICAjICogYG1hcmtlcmAgVGhlIHtEaXNwbGF5TWFya2VyfSBvciB7TWFya2VyfSBmb3Igd2hpY2ggdG8gb3ZlcnJpZGVcbiAgIyAgIHByb3BlcnRpZXMuXG4gICMgKiBgcHJvcGVydGllc2AgQW4ge09iamVjdH0gY29udGFpbmluZyBwcm9wZXJ0aWVzIHRvIGFwcGx5IHRvIHRoaXMgbWFya2VyLlxuICAjICAgUGFzcyBgbnVsbGAgdG8gY2xlYXIgdGhlIG92ZXJyaWRlLlxuICBzZXRQcm9wZXJ0aWVzRm9yTWFya2VyOiAobWFya2VyLCBwcm9wZXJ0aWVzKSAtPlxuICAgIHJldHVybiBpZiBAZGVzdHJveWVkXG4gICAgaWYgcHJvcGVydGllcz9cbiAgICAgIEBvdmVycmlkZVByb3BlcnRpZXNCeU1hcmtlcklkW21hcmtlci5pZF0gPSBwcm9wZXJ0aWVzXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIEBvdmVycmlkZVByb3BlcnRpZXNCeU1hcmtlcklkW21hcmtlci5pZF1cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuc2NoZWR1bGVVcGRhdGVEZWNvcmF0aW9uc0V2ZW50KClcbiJdfQ==
