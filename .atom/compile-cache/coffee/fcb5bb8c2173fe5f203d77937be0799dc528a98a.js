(function() {
  var Emitter, Gutter, GutterContainer;

  Emitter = require('event-kit').Emitter;

  Gutter = require('./gutter');

  module.exports = GutterContainer = (function() {
    function GutterContainer(textEditor) {
      this.gutters = [];
      this.textEditor = textEditor;
      this.emitter = new Emitter;
    }

    GutterContainer.prototype.destroy = function() {
      var gutter, guttersToDestroy, j, len;
      guttersToDestroy = this.gutters.slice(0);
      for (j = 0, len = guttersToDestroy.length; j < len; j++) {
        gutter = guttersToDestroy[j];
        if (gutter.name !== 'line-number') {
          gutter.destroy();
        }
      }
      this.gutters = [];
      return this.emitter.dispose();
    };

    GutterContainer.prototype.addGutter = function(options) {
      var gutterName, i, inserted, j, newGutter, ref;
      options = options != null ? options : {};
      gutterName = options.name;
      if (gutterName === null) {
        throw new Error('A name is required to create a gutter.');
      }
      if (this.gutterWithName(gutterName)) {
        throw new Error('Tried to create a gutter with a name that is already in use.');
      }
      newGutter = new Gutter(this, options);
      inserted = false;
      for (i = j = 0, ref = this.gutters.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        if (this.gutters[i].priority >= newGutter.priority) {
          this.gutters.splice(i, 0, newGutter);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.gutters.push(newGutter);
      }
      this.emitter.emit('did-add-gutter', newGutter);
      return newGutter;
    };

    GutterContainer.prototype.getGutters = function() {
      return this.gutters.slice();
    };

    GutterContainer.prototype.gutterWithName = function(name) {
      var gutter, j, len, ref;
      ref = this.gutters;
      for (j = 0, len = ref.length; j < len; j++) {
        gutter = ref[j];
        if (gutter.name === name) {
          return gutter;
        }
      }
      return null;
    };

    GutterContainer.prototype.observeGutters = function(callback) {
      var gutter, j, len, ref;
      ref = this.getGutters();
      for (j = 0, len = ref.length; j < len; j++) {
        gutter = ref[j];
        callback(gutter);
      }
      return this.onDidAddGutter(callback);
    };

    GutterContainer.prototype.onDidAddGutter = function(callback) {
      return this.emitter.on('did-add-gutter', callback);
    };

    GutterContainer.prototype.onDidRemoveGutter = function(callback) {
      return this.emitter.on('did-remove-gutter', callback);
    };


    /*
    Section: Private Methods
     */

    GutterContainer.prototype.removeGutter = function(gutter) {
      var index;
      index = this.gutters.indexOf(gutter);
      if (index > -1) {
        this.gutters.splice(index, 1);
        return this.emitter.emit('did-remove-gutter', gutter.name);
      } else {
        throw new Error('The given gutter cannot be removed because it is not ' + 'within this GutterContainer.');
      }
    };

    GutterContainer.prototype.addGutterDecoration = function(gutter, marker, options) {
      if (gutter.name === 'line-number') {
        options.type = 'line-number';
      } else {
        options.type = 'gutter';
      }
      options.gutterName = gutter.name;
      return this.textEditor.decorateMarker(marker, options);
    };

    return GutterContainer;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ndXR0ZXItY29udGFpbmVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsVUFBVyxPQUFBLENBQVEsV0FBUjs7RUFDWixNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0VBRVQsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHlCQUFDLFVBQUQ7TUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLFVBQUQsR0FBYztNQUNkLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtJQUhKOzs4QkFLYixPQUFBLEdBQVMsU0FBQTtBQUdQLFVBQUE7TUFBQSxnQkFBQSxHQUFtQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBZSxDQUFmO0FBQ25CLFdBQUEsa0RBQUE7O1FBQ0UsSUFBb0IsTUFBTSxDQUFDLElBQVAsS0FBaUIsYUFBckM7VUFBQSxNQUFNLENBQUMsT0FBUCxDQUFBLEVBQUE7O0FBREY7TUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXO2FBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQUE7SUFQTzs7OEJBU1QsU0FBQSxHQUFXLFNBQUMsT0FBRDtBQUNULFVBQUE7TUFBQSxPQUFBLHFCQUFVLFVBQVU7TUFDcEIsVUFBQSxHQUFhLE9BQU8sQ0FBQztNQUNyQixJQUFHLFVBQUEsS0FBYyxJQUFqQjtBQUNFLGNBQVUsSUFBQSxLQUFBLENBQU0sd0NBQU4sRUFEWjs7TUFFQSxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLFVBQWhCLENBQUg7QUFDRSxjQUFVLElBQUEsS0FBQSxDQUFNLDhEQUFOLEVBRFo7O01BRUEsU0FBQSxHQUFnQixJQUFBLE1BQUEsQ0FBTyxJQUFQLEVBQWEsT0FBYjtNQUVoQixRQUFBLEdBQVc7QUFHWCxXQUFTLDRGQUFUO1FBQ0UsSUFBRyxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVosSUFBd0IsU0FBUyxDQUFDLFFBQXJDO1VBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLFNBQXRCO1VBQ0EsUUFBQSxHQUFXO0FBQ1gsZ0JBSEY7O0FBREY7TUFLQSxJQUFHLENBQUksUUFBUDtRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFNBQWQsRUFERjs7TUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxnQkFBZCxFQUFnQyxTQUFoQztBQUNBLGFBQU87SUFwQkU7OzhCQXNCWCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBO0lBRFU7OzhCQUdaLGNBQUEsR0FBZ0IsU0FBQyxJQUFEO0FBQ2QsVUFBQTtBQUFBO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxJQUFHLE1BQU0sQ0FBQyxJQUFQLEtBQWUsSUFBbEI7QUFBNEIsaUJBQU8sT0FBbkM7O0FBREY7YUFFQTtJQUhjOzs4QkFLaEIsY0FBQSxHQUFnQixTQUFDLFFBQUQ7QUFDZCxVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUFBLFFBQUEsQ0FBUyxNQUFUO0FBQUE7YUFDQSxJQUFDLENBQUEsY0FBRCxDQUFnQixRQUFoQjtJQUZjOzs4QkFJaEIsY0FBQSxHQUFnQixTQUFDLFFBQUQ7YUFDZCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxnQkFBWixFQUE4QixRQUE5QjtJQURjOzs4QkFHaEIsaUJBQUEsR0FBbUIsU0FBQyxRQUFEO2FBQ2pCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG1CQUFaLEVBQWlDLFFBQWpDO0lBRGlCOzs7QUFHbkI7Ozs7OEJBTUEsWUFBQSxHQUFjLFNBQUMsTUFBRDtBQUNaLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLE1BQWpCO01BQ1IsSUFBRyxLQUFBLEdBQVEsQ0FBQyxDQUFaO1FBQ0UsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLEtBQWhCLEVBQXVCLENBQXZCO2VBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsbUJBQWQsRUFBbUMsTUFBTSxDQUFDLElBQTFDLEVBRkY7T0FBQSxNQUFBO0FBSUUsY0FBVSxJQUFBLEtBQUEsQ0FBTSx1REFBQSxHQUNaLDhCQURNLEVBSlo7O0lBRlk7OzhCQVVkLG1CQUFBLEdBQXFCLFNBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsT0FBakI7TUFDbkIsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLGFBQWxCO1FBQ0UsT0FBTyxDQUFDLElBQVIsR0FBZSxjQURqQjtPQUFBLE1BQUE7UUFHRSxPQUFPLENBQUMsSUFBUixHQUFlLFNBSGpCOztNQUlBLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLE1BQU0sQ0FBQzthQUM1QixJQUFDLENBQUEsVUFBVSxDQUFDLGNBQVosQ0FBMkIsTUFBM0IsRUFBbUMsT0FBbkM7SUFObUI7Ozs7O0FBM0V2QiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbkd1dHRlciA9IHJlcXVpcmUgJy4vZ3V0dGVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHdXR0ZXJDb250YWluZXJcbiAgY29uc3RydWN0b3I6ICh0ZXh0RWRpdG9yKSAtPlxuICAgIEBndXR0ZXJzID0gW11cbiAgICBAdGV4dEVkaXRvciA9IHRleHRFZGl0b3JcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgZGVzdHJveTogLT5cbiAgICAjIENyZWF0ZSBhIGNvcHksIGJlY2F1c2UgYEd1dHRlcjo6ZGVzdHJveWAgcmVtb3ZlcyB0aGUgZ3V0dGVyIGZyb21cbiAgICAjIEd1dHRlckNvbnRhaW5lcidzIEBndXR0ZXJzLlxuICAgIGd1dHRlcnNUb0Rlc3Ryb3kgPSBAZ3V0dGVycy5zbGljZSgwKVxuICAgIGZvciBndXR0ZXIgaW4gZ3V0dGVyc1RvRGVzdHJveVxuICAgICAgZ3V0dGVyLmRlc3Ryb3koKSBpZiBndXR0ZXIubmFtZSBpc250ICdsaW5lLW51bWJlcidcbiAgICBAZ3V0dGVycyA9IFtdXG4gICAgQGVtaXR0ZXIuZGlzcG9zZSgpXG5cbiAgYWRkR3V0dGVyOiAob3B0aW9ucykgLT5cbiAgICBvcHRpb25zID0gb3B0aW9ucyA/IHt9XG4gICAgZ3V0dGVyTmFtZSA9IG9wdGlvbnMubmFtZVxuICAgIGlmIGd1dHRlck5hbWUgaXMgbnVsbFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIG5hbWUgaXMgcmVxdWlyZWQgdG8gY3JlYXRlIGEgZ3V0dGVyLicpXG4gICAgaWYgQGd1dHRlcldpdGhOYW1lKGd1dHRlck5hbWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyaWVkIHRvIGNyZWF0ZSBhIGd1dHRlciB3aXRoIGEgbmFtZSB0aGF0IGlzIGFscmVhZHkgaW4gdXNlLicpXG4gICAgbmV3R3V0dGVyID0gbmV3IEd1dHRlcih0aGlzLCBvcHRpb25zKVxuXG4gICAgaW5zZXJ0ZWQgPSBmYWxzZVxuICAgICMgSW5zZXJ0IHRoZSBndXR0ZXIgaW50byB0aGUgZ3V0dGVycyBhcnJheSwgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlciBieSAncHJpb3JpdHknLlxuICAgICMgVGhpcyBjb3VsZCBiZSBvcHRpbWl6ZWQsIGJ1dCB0aGVyZSBhcmUgdW5saWtlbHkgdG8gYmUgbWFueSBndXR0ZXJzLlxuICAgIGZvciBpIGluIFswLi4uQGd1dHRlcnMubGVuZ3RoXVxuICAgICAgaWYgQGd1dHRlcnNbaV0ucHJpb3JpdHkgPj0gbmV3R3V0dGVyLnByaW9yaXR5XG4gICAgICAgIEBndXR0ZXJzLnNwbGljZShpLCAwLCBuZXdHdXR0ZXIpXG4gICAgICAgIGluc2VydGVkID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgIGlmIG5vdCBpbnNlcnRlZFxuICAgICAgQGd1dHRlcnMucHVzaCBuZXdHdXR0ZXJcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLWd1dHRlcicsIG5ld0d1dHRlclxuICAgIHJldHVybiBuZXdHdXR0ZXJcblxuICBnZXRHdXR0ZXJzOiAtPlxuICAgIEBndXR0ZXJzLnNsaWNlKClcblxuICBndXR0ZXJXaXRoTmFtZTogKG5hbWUpIC0+XG4gICAgZm9yIGd1dHRlciBpbiBAZ3V0dGVyc1xuICAgICAgaWYgZ3V0dGVyLm5hbWUgaXMgbmFtZSB0aGVuIHJldHVybiBndXR0ZXJcbiAgICBudWxsXG5cbiAgb2JzZXJ2ZUd1dHRlcnM6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhndXR0ZXIpIGZvciBndXR0ZXIgaW4gQGdldEd1dHRlcnMoKVxuICAgIEBvbkRpZEFkZEd1dHRlciBjYWxsYmFja1xuXG4gIG9uRGlkQWRkR3V0dGVyOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hZGQtZ3V0dGVyJywgY2FsbGJhY2tcblxuICBvbkRpZFJlbW92ZUd1dHRlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtcmVtb3ZlLWd1dHRlcicsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGUgTWV0aG9kc1xuICAjIyNcblxuICAjIFByb2Nlc3NlcyB0aGUgZGVzdHJ1Y3Rpb24gb2YgdGhlIGd1dHRlci4gVGhyb3dzIGFuIGVycm9yIGlmIHRoaXMgZ3V0dGVyIGlzXG4gICMgbm90IHdpdGhpbiB0aGlzIGd1dHRlckNvbnRhaW5lci5cbiAgcmVtb3ZlR3V0dGVyOiAoZ3V0dGVyKSAtPlxuICAgIGluZGV4ID0gQGd1dHRlcnMuaW5kZXhPZihndXR0ZXIpXG4gICAgaWYgaW5kZXggPiAtMVxuICAgICAgQGd1dHRlcnMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXJlbW92ZS1ndXR0ZXInLCBndXR0ZXIubmFtZVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciAnVGhlIGdpdmVuIGd1dHRlciBjYW5ub3QgYmUgcmVtb3ZlZCBiZWNhdXNlIGl0IGlzIG5vdCAnICtcbiAgICAgICAgICAnd2l0aGluIHRoaXMgR3V0dGVyQ29udGFpbmVyLidcblxuICAjIFRoZSBwdWJsaWMgaW50ZXJmYWNlIGlzIEd1dHRlcjo6ZGVjb3JhdGVNYXJrZXIgb3IgVGV4dEVkaXRvcjo6ZGVjb3JhdGVNYXJrZXIuXG4gIGFkZEd1dHRlckRlY29yYXRpb246IChndXR0ZXIsIG1hcmtlciwgb3B0aW9ucykgLT5cbiAgICBpZiBndXR0ZXIubmFtZSBpcyAnbGluZS1udW1iZXInXG4gICAgICBvcHRpb25zLnR5cGUgPSAnbGluZS1udW1iZXInXG4gICAgZWxzZVxuICAgICAgb3B0aW9ucy50eXBlID0gJ2d1dHRlcidcbiAgICBvcHRpb25zLmd1dHRlck5hbWUgPSBndXR0ZXIubmFtZVxuICAgIEB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgb3B0aW9ucylcbiJdfQ==
