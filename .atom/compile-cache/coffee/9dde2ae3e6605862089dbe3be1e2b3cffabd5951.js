(function() {
  var Emitter, Notification, _;

  Emitter = require('event-kit').Emitter;

  _ = require('underscore-plus');

  module.exports = Notification = (function() {
    function Notification(type, message, options) {
      this.type = type;
      this.message = message;
      this.options = options != null ? options : {};
      this.emitter = new Emitter;
      this.timestamp = new Date();
      this.dismissed = true;
      if (this.isDismissable()) {
        this.dismissed = false;
      }
      this.displayed = false;
      this.validate();
    }

    Notification.prototype.validate = function() {
      if (typeof this.message !== 'string') {
        throw new Error("Notification must be created with string message: " + this.message);
      }
      if (!(_.isObject(this.options) && !_.isArray(this.options))) {
        throw new Error("Notification must be created with an options object: " + this.options);
      }
    };


    /*
    Section: Event Subscription
     */

    Notification.prototype.onDidDismiss = function(callback) {
      return this.emitter.on('did-dismiss', callback);
    };

    Notification.prototype.onDidDisplay = function(callback) {
      return this.emitter.on('did-display', callback);
    };

    Notification.prototype.getOptions = function() {
      return this.options;
    };


    /*
    Section: Methods
     */

    Notification.prototype.getType = function() {
      return this.type;
    };

    Notification.prototype.getMessage = function() {
      return this.message;
    };

    Notification.prototype.getTimestamp = function() {
      return this.timestamp;
    };

    Notification.prototype.getDetail = function() {
      return this.options.detail;
    };

    Notification.prototype.isEqual = function(other) {
      return this.getMessage() === other.getMessage() && this.getType() === other.getType() && this.getDetail() === other.getDetail();
    };

    Notification.prototype.dismiss = function() {
      if (!(this.isDismissable() && !this.isDismissed())) {
        return;
      }
      this.dismissed = true;
      return this.emitter.emit('did-dismiss', this);
    };

    Notification.prototype.isDismissed = function() {
      return this.dismissed;
    };

    Notification.prototype.isDismissable = function() {
      return !!this.options.dismissable;
    };

    Notification.prototype.wasDisplayed = function() {
      return this.displayed;
    };

    Notification.prototype.setDisplayed = function(displayed) {
      this.displayed = displayed;
      return this.emitter.emit('did-display', this);
    };

    Notification.prototype.getIcon = function() {
      if (this.options.icon != null) {
        return this.options.icon;
      }
      switch (this.type) {
        case 'fatal':
          return 'bug';
        case 'error':
          return 'flame';
        case 'warning':
          return 'alert';
        case 'info':
          return 'info';
        case 'success':
          return 'check';
      }
    };

    return Notification;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ub3RpZmljYXRpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUNaLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBR0osTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFDLElBQUQsRUFBUSxPQUFSLEVBQWtCLE9BQWxCO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFBTyxJQUFDLENBQUEsVUFBRDtNQUFVLElBQUMsQ0FBQSw0QkFBRCxVQUFTO01BQ3RDLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxTQUFELEdBQWlCLElBQUEsSUFBQSxDQUFBO01BQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFzQixJQUFDLENBQUEsYUFBRCxDQUFBLENBQXRCO1FBQUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxNQUFiOztNQUNBLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsUUFBRCxDQUFBO0lBTlc7OzJCQVFiLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBRyxPQUFPLElBQUMsQ0FBQSxPQUFSLEtBQXFCLFFBQXhCO0FBQ0UsY0FBVSxJQUFBLEtBQUEsQ0FBTSxvREFBQSxHQUFxRCxJQUFDLENBQUEsT0FBNUQsRUFEWjs7TUFHQSxJQUFBLENBQUEsQ0FBTyxDQUFDLENBQUMsUUFBRixDQUFXLElBQUMsQ0FBQSxPQUFaLENBQUEsSUFBeUIsQ0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLElBQUMsQ0FBQSxPQUFYLENBQXBDLENBQUE7QUFDRSxjQUFVLElBQUEsS0FBQSxDQUFNLHVEQUFBLEdBQXdELElBQUMsQ0FBQSxPQUEvRCxFQURaOztJQUpROzs7QUFPVjs7OzsyQkFTQSxZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURZOzsyQkFRZCxZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURZOzsyQkFHZCxVQUFBLEdBQVksU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs7QUFFWjs7OzsyQkFLQSxPQUFBLEdBQVMsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzsyQkFHVCxVQUFBLEdBQVksU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzsyQkFFWixZQUFBLEdBQWMsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzsyQkFFZCxTQUFBLEdBQVcsU0FBQTthQUFHLElBQUMsQ0FBQSxPQUFPLENBQUM7SUFBWjs7MkJBRVgsT0FBQSxHQUFTLFNBQUMsS0FBRDthQUNQLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBQSxLQUFpQixLQUFLLENBQUMsVUFBTixDQUFBLENBQWpCLElBQ00sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEtBQWMsS0FBSyxDQUFDLE9BQU4sQ0FBQSxDQURwQixJQUVNLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBQSxLQUFnQixLQUFLLENBQUMsU0FBTixDQUFBO0lBSGY7OzJCQU9ULE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQSxDQUFBLENBQWMsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLElBQXFCLENBQUksSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUF2QyxDQUFBO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsU0FBRCxHQUFhO2FBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZCxFQUE2QixJQUE3QjtJQUhPOzsyQkFLVCxXQUFBLEdBQWEsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzsyQkFFYixhQUFBLEdBQWUsU0FBQTthQUFHLENBQUMsQ0FBQyxJQUFDLENBQUEsT0FBTyxDQUFDO0lBQWQ7OzJCQUVmLFlBQUEsR0FBYyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzJCQUVkLFlBQUEsR0FBYyxTQUFDLFNBQUQ7TUFBQyxJQUFDLENBQUEsWUFBRDthQUNiLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQWQsRUFBNkIsSUFBN0I7SUFEWTs7MkJBR2QsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUF3Qix5QkFBeEI7QUFBQSxlQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBaEI7O0FBQ0EsY0FBTyxJQUFDLENBQUEsSUFBUjtBQUFBLGFBQ08sT0FEUDtpQkFDb0I7QUFEcEIsYUFFTyxPQUZQO2lCQUVvQjtBQUZwQixhQUdPLFNBSFA7aUJBR3NCO0FBSHRCLGFBSU8sTUFKUDtpQkFJbUI7QUFKbkIsYUFLTyxTQUxQO2lCQUtzQjtBQUx0QjtJQUZPOzs7OztBQTlFWCIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbiMgUHVibGljOiBBIG5vdGlmaWNhdGlvbiB0byB0aGUgdXNlciBjb250YWluaW5nIGEgbWVzc2FnZSBhbmQgdHlwZS5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE5vdGlmaWNhdGlvblxuICBjb25zdHJ1Y3RvcjogKEB0eXBlLCBAbWVzc2FnZSwgQG9wdGlvbnM9e30pIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpXG4gICAgQGRpc21pc3NlZCA9IHRydWVcbiAgICBAZGlzbWlzc2VkID0gZmFsc2UgaWYgQGlzRGlzbWlzc2FibGUoKVxuICAgIEBkaXNwbGF5ZWQgPSBmYWxzZVxuICAgIEB2YWxpZGF0ZSgpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgaWYgdHlwZW9mIEBtZXNzYWdlIGlzbnQgJ3N0cmluZydcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdGlmaWNhdGlvbiBtdXN0IGJlIGNyZWF0ZWQgd2l0aCBzdHJpbmcgbWVzc2FnZTogI3tAbWVzc2FnZX1cIilcblxuICAgIHVubGVzcyBfLmlzT2JqZWN0KEBvcHRpb25zKSBhbmQgbm90IF8uaXNBcnJheShAb3B0aW9ucylcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdGlmaWNhdGlvbiBtdXN0IGJlIGNyZWF0ZWQgd2l0aCBhbiBvcHRpb25zIG9iamVjdDogI3tAb3B0aW9uc31cIilcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gdGhlIG5vdGlmaWNhdGlvbiBpcyBkaXNtaXNzZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiB0aGUgbm90aWZpY2F0aW9uIGlzIGRpc21pc3NlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGlzbWlzczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGlzbWlzcycsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgbm90aWZpY2F0aW9uIGlzIGRpc3BsYXllZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBub3RpZmljYXRpb24gaXMgZGlzcGxheWVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWREaXNwbGF5OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kaXNwbGF5JywgY2FsbGJhY2tcblxuICBnZXRPcHRpb25zOiAtPiBAb3B0aW9uc1xuXG4gICMjI1xuICBTZWN0aW9uOiBNZXRob2RzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSB7U3RyaW5nfSB0eXBlLlxuICBnZXRUeXBlOiAtPiBAdHlwZVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSB7U3RyaW5nfSBtZXNzYWdlLlxuICBnZXRNZXNzYWdlOiAtPiBAbWVzc2FnZVxuXG4gIGdldFRpbWVzdGFtcDogLT4gQHRpbWVzdGFtcFxuXG4gIGdldERldGFpbDogLT4gQG9wdGlvbnMuZGV0YWlsXG5cbiAgaXNFcXVhbDogKG90aGVyKSAtPlxuICAgIEBnZXRNZXNzYWdlKCkgaXMgb3RoZXIuZ2V0TWVzc2FnZSgpIFxcXG4gICAgICBhbmQgQGdldFR5cGUoKSBpcyBvdGhlci5nZXRUeXBlKCkgXFxcbiAgICAgIGFuZCBAZ2V0RGV0YWlsKCkgaXMgb3RoZXIuZ2V0RGV0YWlsKClcblxuICAjIEV4dGVuZGVkOiBEaXNtaXNzZXMgdGhlIG5vdGlmaWNhdGlvbiwgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgVUkuIENhbGxpbmcgdGhpcyBwcm9ncmFtbWF0aWNhbGx5XG4gICMgd2lsbCBjYWxsIGFsbCBjYWxsYmFja3MgYWRkZWQgdmlhIGBvbkRpZERpc21pc3NgLlxuICBkaXNtaXNzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzRGlzbWlzc2FibGUoKSBhbmQgbm90IEBpc0Rpc21pc3NlZCgpXG4gICAgQGRpc21pc3NlZCA9IHRydWVcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGlzbWlzcycsIHRoaXNcblxuICBpc0Rpc21pc3NlZDogLT4gQGRpc21pc3NlZFxuXG4gIGlzRGlzbWlzc2FibGU6IC0+ICEhQG9wdGlvbnMuZGlzbWlzc2FibGVcblxuICB3YXNEaXNwbGF5ZWQ6IC0+IEBkaXNwbGF5ZWRcblxuICBzZXREaXNwbGF5ZWQ6IChAZGlzcGxheWVkKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kaXNwbGF5JywgdGhpc1xuXG4gIGdldEljb246IC0+XG4gICAgcmV0dXJuIEBvcHRpb25zLmljb24gaWYgQG9wdGlvbnMuaWNvbj9cbiAgICBzd2l0Y2ggQHR5cGVcbiAgICAgIHdoZW4gJ2ZhdGFsJyB0aGVuICdidWcnXG4gICAgICB3aGVuICdlcnJvcicgdGhlbiAnZmxhbWUnXG4gICAgICB3aGVuICd3YXJuaW5nJyB0aGVuICdhbGVydCdcbiAgICAgIHdoZW4gJ2luZm8nIHRoZW4gJ2luZm8nXG4gICAgICB3aGVuICdzdWNjZXNzJyB0aGVuICdjaGVjaydcbiJdfQ==
