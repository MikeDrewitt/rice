(function() {
  var Decoration, Emitter, _, idCounter, nextId, translateDecorationParamsOldToNew,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  Emitter = require('event-kit').Emitter;

  idCounter = 0;

  nextId = function() {
    return idCounter++;
  };

  translateDecorationParamsOldToNew = function(decorationParams) {
    if (decorationParams.type === 'line-number') {
      decorationParams.gutterName = 'line-number';
    }
    return decorationParams;
  };

  module.exports = Decoration = (function() {
    Decoration.isType = function(decorationProperties, type) {
      var ref;
      if (_.isArray(decorationProperties.type)) {
        if (indexOf.call(decorationProperties.type, type) >= 0) {
          return true;
        }
        if (type === 'gutter') {
          if (indexOf.call(decorationProperties.type, 'line-number') >= 0) {
            return true;
          }
        }
        return false;
      } else {
        if (type === 'gutter') {
          if ((ref = decorationProperties.type) === 'gutter' || ref === 'line-number') {
            return true;
          }
        } else {
          return type === decorationProperties.type;
        }
      }
    };


    /*
    Section: Construction and Destruction
     */

    function Decoration(marker, decorationManager, properties) {
      this.marker = marker;
      this.decorationManager = decorationManager;
      this.emitter = new Emitter;
      this.id = nextId();
      this.setProperties(properties);
      this.destroyed = false;
      this.markerDestroyDisposable = this.marker.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
    }

    Decoration.prototype.destroy = function() {
      if (this.destroyed) {
        return;
      }
      this.markerDestroyDisposable.dispose();
      this.markerDestroyDisposable = null;
      this.destroyed = true;
      this.decorationManager.didDestroyMarkerDecoration(this);
      this.emitter.emit('did-destroy');
      return this.emitter.dispose();
    };

    Decoration.prototype.isDestroyed = function() {
      return this.destroyed;
    };


    /*
    Section: Event Subscription
     */

    Decoration.prototype.onDidChangeProperties = function(callback) {
      return this.emitter.on('did-change-properties', callback);
    };

    Decoration.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Decoration Details
     */

    Decoration.prototype.getId = function() {
      return this.id;
    };

    Decoration.prototype.getMarker = function() {
      return this.marker;
    };

    Decoration.prototype.isType = function(type) {
      return Decoration.isType(this.properties, type);
    };


    /*
    Section: Properties
     */

    Decoration.prototype.getProperties = function() {
      return this.properties;
    };

    Decoration.prototype.setProperties = function(newProperties) {
      var oldProperties;
      if (this.destroyed) {
        return;
      }
      oldProperties = this.properties;
      this.properties = translateDecorationParamsOldToNew(newProperties);
      if (newProperties.type != null) {
        this.decorationManager.decorationDidChangeType(this);
      }
      this.decorationManager.scheduleUpdateDecorationsEvent();
      return this.emitter.emit('did-change-properties', {
        oldProperties: oldProperties,
        newProperties: newProperties
      });
    };


    /*
    Section: Utility
     */

    Decoration.prototype.inspect = function() {
      return "<Decoration " + this.id + ">";
    };


    /*
    Section: Private methods
     */

    Decoration.prototype.matchesPattern = function(decorationPattern) {
      var key, value;
      if (decorationPattern == null) {
        return false;
      }
      for (key in decorationPattern) {
        value = decorationPattern[key];
        if (this.properties[key] !== value) {
          return false;
        }
      }
      return true;
    };

    Decoration.prototype.flash = function(klass, duration) {
      var base;
      if (duration == null) {
        duration = 500;
      }
      if ((base = this.properties).flashCount == null) {
        base.flashCount = 0;
      }
      this.properties.flashCount++;
      this.properties.flashClass = klass;
      this.properties.flashDuration = duration;
      this.decorationManager.scheduleUpdateDecorationsEvent();
      return this.emitter.emit('did-flash');
    };

    return Decoration;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9kZWNvcmF0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNEVBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILFVBQVcsT0FBQSxDQUFRLFdBQVI7O0VBRVosU0FBQSxHQUFZOztFQUNaLE1BQUEsR0FBUyxTQUFBO1dBQUcsU0FBQTtFQUFIOztFQUlULGlDQUFBLEdBQW9DLFNBQUMsZ0JBQUQ7SUFDbEMsSUFBRyxnQkFBZ0IsQ0FBQyxJQUFqQixLQUF5QixhQUE1QjtNQUNFLGdCQUFnQixDQUFDLFVBQWpCLEdBQThCLGNBRGhDOztXQUVBO0VBSGtDOztFQTJCcEMsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQVdKLFVBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxvQkFBRCxFQUF1QixJQUF2QjtBQUVQLFVBQUE7TUFBQSxJQUFHLENBQUMsQ0FBQyxPQUFGLENBQVUsb0JBQW9CLENBQUMsSUFBL0IsQ0FBSDtRQUNFLElBQWUsYUFBUSxvQkFBb0IsQ0FBQyxJQUE3QixFQUFBLElBQUEsTUFBZjtBQUFBLGlCQUFPLEtBQVA7O1FBQ0EsSUFBRyxJQUFBLEtBQVEsUUFBWDtVQUNFLElBQWUsYUFBaUIsb0JBQW9CLENBQUMsSUFBdEMsRUFBQSxhQUFBLE1BQWY7QUFBQSxtQkFBTyxLQUFQO1dBREY7O0FBRUEsZUFBTyxNQUpUO09BQUEsTUFBQTtRQU1FLElBQUcsSUFBQSxLQUFRLFFBQVg7VUFDRSxXQUFlLG9CQUFvQixDQUFDLEtBQXJCLEtBQThCLFFBQTlCLElBQUEsR0FBQSxLQUF3QyxhQUF2RDtBQUFBLG1CQUFPLEtBQVA7V0FERjtTQUFBLE1BQUE7aUJBR0UsSUFBQSxLQUFRLG9CQUFvQixDQUFDLEtBSC9CO1NBTkY7O0lBRk87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QSxJQUFDLENBQUEsVUFBVSxDQUFDLFVBQVosR0FBeUI7TUFDekIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxhQUFaLEdBQTRCO01BQzVCLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyw4QkFBbkIsQ0FBQTthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFdBQWQ7SUFOSzs7Ozs7QUE1S1QiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0VtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5pZENvdW50ZXIgPSAwXG5uZXh0SWQgPSAtPiBpZENvdW50ZXIrK1xuXG4jIEFwcGxpZXMgY2hhbmdlcyB0byBhIGRlY29yYXRpb25zUGFyYW0ge09iamVjdH0gdG8gbWFrZSBpdCBwb3NzaWJsZSB0b1xuIyBkaWZmZXJlbnRpYXRlIGRlY29yYXRpb25zIG9uIGN1c3RvbSBndXR0ZXJzIHZlcnN1cyB0aGUgbGluZS1udW1iZXIgZ3V0dGVyLlxudHJhbnNsYXRlRGVjb3JhdGlvblBhcmFtc09sZFRvTmV3ID0gKGRlY29yYXRpb25QYXJhbXMpIC0+XG4gIGlmIGRlY29yYXRpb25QYXJhbXMudHlwZSBpcyAnbGluZS1udW1iZXInXG4gICAgZGVjb3JhdGlvblBhcmFtcy5ndXR0ZXJOYW1lID0gJ2xpbmUtbnVtYmVyJ1xuICBkZWNvcmF0aW9uUGFyYW1zXG5cbiMgRXNzZW50aWFsOiBSZXByZXNlbnRzIGEgZGVjb3JhdGlvbiB0aGF0IGZvbGxvd3MgYSB7RGlzcGxheU1hcmtlcn0uIEEgZGVjb3JhdGlvbiBpc1xuIyBiYXNpY2FsbHkgYSB2aXN1YWwgcmVwcmVzZW50YXRpb24gb2YgYSBtYXJrZXIuIEl0IGFsbG93cyB5b3UgdG8gYWRkIENTU1xuIyBjbGFzc2VzIHRvIGxpbmUgbnVtYmVycyBpbiB0aGUgZ3V0dGVyLCBsaW5lcywgYW5kIGFkZCBzZWxlY3Rpb24tbGluZSByZWdpb25zXG4jIGFyb3VuZCBtYXJrZWQgcmFuZ2VzIG9mIHRleHQuXG4jXG4jIHtEZWNvcmF0aW9ufSBvYmplY3RzIGFyZSBub3QgbWVhbnQgdG8gYmUgY3JlYXRlZCBkaXJlY3RseSwgYnV0IGNyZWF0ZWQgd2l0aFxuIyB7VGV4dEVkaXRvcjo6ZGVjb3JhdGVNYXJrZXJ9LiBlZy5cbiNcbiMgYGBgY29mZmVlXG4jIHJhbmdlID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKSAjIGFueSByYW5nZSB5b3UgbGlrZVxuIyBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKVxuIyBkZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdsaW5lJywgY2xhc3M6ICdteS1saW5lLWNsYXNzJ30pXG4jIGBgYFxuI1xuIyBCZXN0IHByYWN0aWNlIGZvciBkZXN0cm95aW5nIHRoZSBkZWNvcmF0aW9uIGlzIGJ5IGRlc3Ryb3lpbmcgdGhlIHtEaXNwbGF5TWFya2VyfS5cbiNcbiMgYGBgY29mZmVlXG4jIG1hcmtlci5kZXN0cm95KClcbiMgYGBgXG4jXG4jIFlvdSBzaG91bGQgb25seSB1c2Uge0RlY29yYXRpb246OmRlc3Ryb3l9IHdoZW4geW91IHN0aWxsIG5lZWQgb3IgZG8gbm90IG93blxuIyB0aGUgbWFya2VyLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRGVjb3JhdGlvblxuICAjIFByaXZhdGU6IENoZWNrIGlmIHRoZSBgZGVjb3JhdGlvblByb3BlcnRpZXMudHlwZWAgbWF0Y2hlcyBgdHlwZWBcbiAgI1xuICAjICogYGRlY29yYXRpb25Qcm9wZXJ0aWVzYCB7T2JqZWN0fSBlZy4gYHt0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ215LW5ldy1jbGFzcyd9YFxuICAjICogYHR5cGVgIHtTdHJpbmd9IHR5cGUgbGlrZSBgJ2xpbmUtbnVtYmVyJ2AsIGAnbGluZSdgLCBldGMuIGB0eXBlYCBjYW4gYWxzb1xuICAjICAgYmUgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMsIHdoZXJlIGl0IHdpbGwgcmV0dXJuIHRydWUgaWYgdGhlIGRlY29yYXRpb24nc1xuICAjICAgdHlwZSBtYXRjaGVzIGFueSBpbiB0aGUgYXJyYXkuXG4gICNcbiAgIyBSZXR1cm5zIHtCb29sZWFufVxuICAjIE5vdGU6ICdsaW5lLW51bWJlcicgaXMgYSBzcGVjaWFsIHN1YnR5cGUgb2YgdGhlICdndXR0ZXInIHR5cGUuIEkuZS4sIGFcbiAgIyAnbGluZS1udW1iZXInIGlzIGEgJ2d1dHRlcicsIGJ1dCBhICdndXR0ZXInIGlzIG5vdCBhICdsaW5lLW51bWJlcicuXG4gIEBpc1R5cGU6IChkZWNvcmF0aW9uUHJvcGVydGllcywgdHlwZSkgLT5cbiAgICAjICdsaW5lLW51bWJlcicgaXMgYSBzcGVjaWFsIGNhc2Ugb2YgJ2d1dHRlcicuXG4gICAgaWYgXy5pc0FycmF5KGRlY29yYXRpb25Qcm9wZXJ0aWVzLnR5cGUpXG4gICAgICByZXR1cm4gdHJ1ZSBpZiB0eXBlIGluIGRlY29yYXRpb25Qcm9wZXJ0aWVzLnR5cGVcbiAgICAgIGlmIHR5cGUgaXMgJ2d1dHRlcidcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgJ2xpbmUtbnVtYmVyJyBpbiBkZWNvcmF0aW9uUHJvcGVydGllcy50eXBlXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICBlbHNlXG4gICAgICBpZiB0eXBlIGlzICdndXR0ZXInXG4gICAgICAgIHJldHVybiB0cnVlIGlmIGRlY29yYXRpb25Qcm9wZXJ0aWVzLnR5cGUgaW4gWydndXR0ZXInLCAnbGluZS1udW1iZXInXVxuICAgICAgZWxzZVxuICAgICAgICB0eXBlIGlzIGRlY29yYXRpb25Qcm9wZXJ0aWVzLnR5cGVcblxuICAjIyNcbiAgU2VjdGlvbjogQ29uc3RydWN0aW9uIGFuZCBEZXN0cnVjdGlvblxuICAjIyNcblxuICBjb25zdHJ1Y3RvcjogKEBtYXJrZXIsIEBkZWNvcmF0aW9uTWFuYWdlciwgcHJvcGVydGllcykgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGlkID0gbmV4dElkKClcbiAgICBAc2V0UHJvcGVydGllcyBwcm9wZXJ0aWVzXG4gICAgQGRlc3Ryb3llZCA9IGZhbHNlXG4gICAgQG1hcmtlckRlc3Ryb3lEaXNwb3NhYmxlID0gQG1hcmtlci5vbkRpZERlc3Ryb3kgPT4gQGRlc3Ryb3koKVxuXG4gICMgRXNzZW50aWFsOiBEZXN0cm95IHRoaXMgbWFya2VyIGRlY29yYXRpb24uXG4gICNcbiAgIyBZb3UgY2FuIGFsc28gZGVzdHJveSB0aGUgbWFya2VyIGlmIHlvdSBvd24gaXQsIHdoaWNoIHdpbGwgZGVzdHJveSB0aGlzXG4gICMgZGVjb3JhdGlvbi5cbiAgZGVzdHJveTogLT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIEBtYXJrZXJEZXN0cm95RGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICBAbWFya2VyRGVzdHJveURpc3Bvc2FibGUgPSBudWxsXG4gICAgQGRlc3Ryb3llZCA9IHRydWVcbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuZGlkRGVzdHJveU1hcmtlckRlY29yYXRpb24odGhpcylcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICBAZW1pdHRlci5kaXNwb3NlKClcblxuICBpc0Rlc3Ryb3llZDogLT4gQGRlc3Ryb3llZFxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IFdoZW4gdGhlIHtEZWNvcmF0aW9ufSBpcyB1cGRhdGVkIHZpYSB7RGVjb3JhdGlvbjo6dXBkYXRlfS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBldmVudGAge09iamVjdH1cbiAgIyAgICAgKiBgb2xkUHJvcGVydGllc2Age09iamVjdH0gdGhlIG9sZCBwYXJhbWV0ZXJzIHRoZSBkZWNvcmF0aW9uIHVzZWQgdG8gaGF2ZVxuICAjICAgICAqIGBuZXdQcm9wZXJ0aWVzYCB7T2JqZWN0fSB0aGUgbmV3IHBhcmFtZXRlcnMgdGhlIGRlY29yYXRpb24gbm93IGhhc1xuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VQcm9wZXJ0aWVzOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtcHJvcGVydGllcycsIGNhbGxiYWNrXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUge0RlY29yYXRpb259IGlzIGRlc3Ryb3llZFxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IERlY29yYXRpb24gRGV0YWlsc1xuICAjIyNcblxuICAjIEVzc2VudGlhbDogQW4gaWQgdW5pcXVlIGFjcm9zcyBhbGwge0RlY29yYXRpb259IG9iamVjdHNcbiAgZ2V0SWQ6IC0+IEBpZFxuXG4gICMgRXNzZW50aWFsOiBSZXR1cm5zIHRoZSBtYXJrZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMge0RlY29yYXRpb259XG4gIGdldE1hcmtlcjogLT4gQG1hcmtlclxuXG4gICMgUHVibGljOiBDaGVjayBpZiB0aGlzIGRlY29yYXRpb24gaXMgb2YgdHlwZSBgdHlwZWBcbiAgI1xuICAjICogYHR5cGVgIHtTdHJpbmd9IHR5cGUgbGlrZSBgJ2xpbmUtbnVtYmVyJ2AsIGAnbGluZSdgLCBldGMuIGB0eXBlYCBjYW4gYWxzb1xuICAjICAgYmUgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMsIHdoZXJlIGl0IHdpbGwgcmV0dXJuIHRydWUgaWYgdGhlIGRlY29yYXRpb24nc1xuICAjICAgdHlwZSBtYXRjaGVzIGFueSBpbiB0aGUgYXJyYXkuXG4gICNcbiAgIyBSZXR1cm5zIHtCb29sZWFufVxuICBpc1R5cGU6ICh0eXBlKSAtPlxuICAgIERlY29yYXRpb24uaXNUeXBlKEBwcm9wZXJ0aWVzLCB0eXBlKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQcm9wZXJ0aWVzXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBSZXR1cm5zIHRoZSB7RGVjb3JhdGlvbn0ncyBwcm9wZXJ0aWVzLlxuICBnZXRQcm9wZXJ0aWVzOiAtPlxuICAgIEBwcm9wZXJ0aWVzXG5cbiAgIyBFc3NlbnRpYWw6IFVwZGF0ZSB0aGUgbWFya2VyIHdpdGggbmV3IFByb3BlcnRpZXMuIEFsbG93cyB5b3UgdG8gY2hhbmdlIHRoZSBkZWNvcmF0aW9uJ3MgY2xhc3MuXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjXG4gICMgYGBgY29mZmVlXG4gICMgZGVjb3JhdGlvbi51cGRhdGUoe3R5cGU6ICdsaW5lLW51bWJlcicsIGNsYXNzOiAnbXktbmV3LWNsYXNzJ30pXG4gICMgYGBgXG4gICNcbiAgIyAqIGBuZXdQcm9wZXJ0aWVzYCB7T2JqZWN0fSBlZy4gYHt0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ215LW5ldy1jbGFzcyd9YFxuICBzZXRQcm9wZXJ0aWVzOiAobmV3UHJvcGVydGllcykgLT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIG9sZFByb3BlcnRpZXMgPSBAcHJvcGVydGllc1xuICAgIEBwcm9wZXJ0aWVzID0gdHJhbnNsYXRlRGVjb3JhdGlvblBhcmFtc09sZFRvTmV3KG5ld1Byb3BlcnRpZXMpXG4gICAgaWYgbmV3UHJvcGVydGllcy50eXBlP1xuICAgICAgQGRlY29yYXRpb25NYW5hZ2VyLmRlY29yYXRpb25EaWRDaGFuZ2VUeXBlKHRoaXMpXG4gICAgQGRlY29yYXRpb25NYW5hZ2VyLnNjaGVkdWxlVXBkYXRlRGVjb3JhdGlvbnNFdmVudCgpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1wcm9wZXJ0aWVzJywge29sZFByb3BlcnRpZXMsIG5ld1Byb3BlcnRpZXN9XG5cbiAgIyMjXG4gIFNlY3Rpb246IFV0aWxpdHlcbiAgIyMjXG5cbiAgaW5zcGVjdDogLT5cbiAgICBcIjxEZWNvcmF0aW9uICN7QGlkfT5cIlxuXG4gICMjI1xuICBTZWN0aW9uOiBQcml2YXRlIG1ldGhvZHNcbiAgIyMjXG5cbiAgbWF0Y2hlc1BhdHRlcm46IChkZWNvcmF0aW9uUGF0dGVybikgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGRlY29yYXRpb25QYXR0ZXJuP1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGRlY29yYXRpb25QYXR0ZXJuXG4gICAgICByZXR1cm4gZmFsc2UgaWYgQHByb3BlcnRpZXNba2V5XSBpc250IHZhbHVlXG4gICAgdHJ1ZVxuXG4gIGZsYXNoOiAoa2xhc3MsIGR1cmF0aW9uPTUwMCkgLT5cbiAgICBAcHJvcGVydGllcy5mbGFzaENvdW50ID89IDBcbiAgICBAcHJvcGVydGllcy5mbGFzaENvdW50KytcbiAgICBAcHJvcGVydGllcy5mbGFzaENsYXNzID0ga2xhc3NcbiAgICBAcHJvcGVydGllcy5mbGFzaER1cmF0aW9uID0gZHVyYXRpb25cbiAgICBAZGVjb3JhdGlvbk1hbmFnZXIuc2NoZWR1bGVVcGRhdGVEZWNvcmF0aW9uc0V2ZW50KClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZmxhc2gnXG4iXX0=
