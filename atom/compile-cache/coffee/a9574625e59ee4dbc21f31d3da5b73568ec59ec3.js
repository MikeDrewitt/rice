(function() {
  var DefaultPriority, Emitter, Gutter;

  Emitter = require('event-kit').Emitter;

  DefaultPriority = -100;

  module.exports = Gutter = (function() {
    function Gutter(gutterContainer, options) {
      var ref, ref1;
      this.gutterContainer = gutterContainer;
      this.name = options != null ? options.name : void 0;
      this.priority = (ref = options != null ? options.priority : void 0) != null ? ref : DefaultPriority;
      this.visible = (ref1 = options != null ? options.visible : void 0) != null ? ref1 : true;
      this.emitter = new Emitter;
    }


    /*
    Section: Gutter Destruction
     */

    Gutter.prototype.destroy = function() {
      if (this.name === 'line-number') {
        throw new Error('The line-number gutter cannot be destroyed.');
      } else {
        this.gutterContainer.removeGutter(this);
        this.emitter.emit('did-destroy');
        return this.emitter.dispose();
      }
    };


    /*
    Section: Event Subscription
     */

    Gutter.prototype.onDidChangeVisible = function(callback) {
      return this.emitter.on('did-change-visible', callback);
    };

    Gutter.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Visibility
     */

    Gutter.prototype.hide = function() {
      if (this.visible) {
        this.visible = false;
        return this.emitter.emit('did-change-visible', this);
      }
    };

    Gutter.prototype.show = function() {
      if (!this.visible) {
        this.visible = true;
        return this.emitter.emit('did-change-visible', this);
      }
    };

    Gutter.prototype.isVisible = function() {
      return this.visible;
    };

    Gutter.prototype.decorateMarker = function(marker, options) {
      return this.gutterContainer.addGutterDecoration(this, marker, options);
    };

    return Gutter;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ndXR0ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUVaLGVBQUEsR0FBa0IsQ0FBQzs7RUFLbkIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGdCQUFDLGVBQUQsRUFBa0IsT0FBbEI7QUFDWCxVQUFBO01BQUEsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLElBQUQscUJBQVEsT0FBTyxDQUFFO01BQ2pCLElBQUMsQ0FBQSxRQUFELHVFQUFnQztNQUNoQyxJQUFDLENBQUEsT0FBRCx3RUFBOEI7TUFFOUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO0lBTko7OztBQVFiOzs7O3FCQUtBLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLGFBQVo7QUFDRSxjQUFVLElBQUEsS0FBQSxDQUFNLDZDQUFOLEVBRFo7T0FBQSxNQUFBO1FBR0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxZQUFqQixDQUE4QixJQUE5QjtRQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQWQ7ZUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBQSxFQUxGOztJQURPOzs7QUFRVDs7OztxQkFVQSxrQkFBQSxHQUFvQixTQUFDLFFBQUQ7YUFDbEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksb0JBQVosRUFBa0MsUUFBbEM7SUFEa0I7O3FCQVFwQixZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURZOzs7QUFHZDs7OztxQkFLQSxJQUFBLEdBQU0sU0FBQTtNQUNKLElBQUcsSUFBQyxDQUFBLE9BQUo7UUFDRSxJQUFDLENBQUEsT0FBRCxHQUFXO2VBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0JBQWQsRUFBb0MsSUFBcEMsRUFGRjs7SUFESTs7cUJBTU4sSUFBQSxHQUFNLFNBQUE7TUFDSixJQUFHLENBQUksSUFBQyxDQUFBLE9BQVI7UUFDRSxJQUFDLENBQUEsT0FBRCxHQUFXO2VBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0JBQWQsRUFBb0MsSUFBcEMsRUFGRjs7SUFESTs7cUJBUU4sU0FBQSxHQUFXLFNBQUE7YUFDVCxJQUFDLENBQUE7SUFEUTs7cUJBaUJYLGNBQUEsR0FBZ0IsU0FBQyxNQUFELEVBQVMsT0FBVDthQUNkLElBQUMsQ0FBQSxlQUFlLENBQUMsbUJBQWpCLENBQXFDLElBQXJDLEVBQTJDLE1BQTNDLEVBQW1ELE9BQW5EO0lBRGM7Ozs7O0FBdkZsQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcblxuRGVmYXVsdFByaW9yaXR5ID0gLTEwMFxuXG4jIEV4dGVuZGVkOiBSZXByZXNlbnRzIGEgZ3V0dGVyIHdpdGhpbiBhIHtUZXh0RWRpdG9yfS5cbiNcbiMgU2VlIHtUZXh0RWRpdG9yOjphZGRHdXR0ZXJ9IGZvciBpbmZvcm1hdGlvbiBvbiBjcmVhdGluZyBhIGd1dHRlci5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEd1dHRlclxuICBjb25zdHJ1Y3RvcjogKGd1dHRlckNvbnRhaW5lciwgb3B0aW9ucykgLT5cbiAgICBAZ3V0dGVyQ29udGFpbmVyID0gZ3V0dGVyQ29udGFpbmVyXG4gICAgQG5hbWUgPSBvcHRpb25zPy5uYW1lXG4gICAgQHByaW9yaXR5ID0gb3B0aW9ucz8ucHJpb3JpdHkgPyBEZWZhdWx0UHJpb3JpdHlcbiAgICBAdmlzaWJsZSA9IG9wdGlvbnM/LnZpc2libGUgPyB0cnVlXG5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgIyMjXG4gIFNlY3Rpb246IEd1dHRlciBEZXN0cnVjdGlvblxuICAjIyNcblxuICAjIEVzc2VudGlhbDogRGVzdHJveXMgdGhlIGd1dHRlci5cbiAgZGVzdHJveTogLT5cbiAgICBpZiBAbmFtZSBpcyAnbGluZS1udW1iZXInXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBsaW5lLW51bWJlciBndXR0ZXIgY2Fubm90IGJlIGRlc3Ryb3llZC4nKVxuICAgIGVsc2VcbiAgICAgIEBndXR0ZXJDb250YWluZXIucmVtb3ZlR3V0dGVyKHRoaXMpXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBndXR0ZXIncyB2aXNpYmlsaXR5IGNoYW5nZXMuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjICAqIGBndXR0ZXJgIFRoZSBndXR0ZXIgd2hvc2UgdmlzaWJpbGl0eSBjaGFuZ2VkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VWaXNpYmxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtdmlzaWJsZScsIGNhbGxiYWNrXG5cbiAgIyBFc3NlbnRpYWw6IENhbGxzIHlvdXIgYGNhbGxiYWNrYCB3aGVuIHRoZSBndXR0ZXIgaXMgZGVzdHJveWVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IFZpc2liaWxpdHlcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEhpZGUgdGhlIGd1dHRlci5cbiAgaGlkZTogLT5cbiAgICBpZiBAdmlzaWJsZVxuICAgICAgQHZpc2libGUgPSBmYWxzZVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS12aXNpYmxlJywgdGhpc1xuXG4gICMgRXNzZW50aWFsOiBTaG93IHRoZSBndXR0ZXIuXG4gIHNob3c6IC0+XG4gICAgaWYgbm90IEB2aXNpYmxlXG4gICAgICBAdmlzaWJsZSA9IHRydWVcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdmlzaWJsZScsIHRoaXNcblxuICAjIEVzc2VudGlhbDogRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGd1dHRlciBpcyB2aXNpYmxlLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufS5cbiAgaXNWaXNpYmxlOiAtPlxuICAgIEB2aXNpYmxlXG5cbiAgIyBFc3NlbnRpYWw6IEFkZCBhIGRlY29yYXRpb24gdGhhdCB0cmFja3MgYSB7RGlzcGxheU1hcmtlcn0uIFdoZW4gdGhlIG1hcmtlciBtb3ZlcyxcbiAgIyBpcyBpbnZhbGlkYXRlZCwgb3IgaXMgZGVzdHJveWVkLCB0aGUgZGVjb3JhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gcmVmbGVjdFxuICAjIHRoZSBtYXJrZXIncyBzdGF0ZS5cbiAgI1xuICAjICMjIEFyZ3VtZW50c1xuICAjXG4gICMgKiBgbWFya2VyYCBBIHtEaXNwbGF5TWFya2VyfSB5b3Ugd2FudCB0aGlzIGRlY29yYXRpb24gdG8gZm9sbG93LlxuICAjICogYGRlY29yYXRpb25QYXJhbXNgIEFuIHtPYmplY3R9IHJlcHJlc2VudGluZyB0aGUgZGVjb3JhdGlvbi4gSXQgaXMgcGFzc2VkXG4gICMgICB0byB7VGV4dEVkaXRvcjo6ZGVjb3JhdGVNYXJrZXJ9IGFzIGl0cyBgZGVjb3JhdGlvblBhcmFtc2AgYW5kIHNvIHN1cHBvcnRzXG4gICMgICBhbGwgb3B0aW9ucyBkb2N1bWVudGVkIHRoZXJlLlxuICAjICAgKiBgdHlwZWAgX19DYXZlYXRfXzogc2V0IHRvIGAnbGluZS1udW1iZXInYCBpZiB0aGlzIGlzIHRoZSBsaW5lLW51bWJlclxuICAjICAgICBndXR0ZXIsIGAnZ3V0dGVyJ2Agb3RoZXJ3aXNlLiBUaGlzIGNhbm5vdCBiZSBvdmVycmlkZGVuLlxuICAjXG4gICMgUmV0dXJucyBhIHtEZWNvcmF0aW9ufSBvYmplY3RcbiAgZGVjb3JhdGVNYXJrZXI6IChtYXJrZXIsIG9wdGlvbnMpIC0+XG4gICAgQGd1dHRlckNvbnRhaW5lci5hZGRHdXR0ZXJEZWNvcmF0aW9uKHRoaXMsIG1hcmtlciwgb3B0aW9ucylcbiJdfQ==
