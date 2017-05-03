(function() {
  var Emitter, Notification, NotificationManager;

  Emitter = require('event-kit').Emitter;

  Notification = require('../src/notification');

  module.exports = NotificationManager = (function() {
    function NotificationManager() {
      this.notifications = [];
      this.emitter = new Emitter;
    }


    /*
    Section: Events
     */

    NotificationManager.prototype.onDidAddNotification = function(callback) {
      return this.emitter.on('did-add-notification', callback);
    };


    /*
    Section: Adding Notifications
     */

    NotificationManager.prototype.addSuccess = function(message, options) {
      return this.addNotification(new Notification('success', message, options));
    };

    NotificationManager.prototype.addInfo = function(message, options) {
      return this.addNotification(new Notification('info', message, options));
    };

    NotificationManager.prototype.addWarning = function(message, options) {
      return this.addNotification(new Notification('warning', message, options));
    };

    NotificationManager.prototype.addError = function(message, options) {
      return this.addNotification(new Notification('error', message, options));
    };

    NotificationManager.prototype.addFatalError = function(message, options) {
      return this.addNotification(new Notification('fatal', message, options));
    };

    NotificationManager.prototype.add = function(type, message, options) {
      return this.addNotification(new Notification(type, message, options));
    };

    NotificationManager.prototype.addNotification = function(notification) {
      this.notifications.push(notification);
      this.emitter.emit('did-add-notification', notification);
      return notification;
    };


    /*
    Section: Getting Notifications
     */

    NotificationManager.prototype.getNotifications = function() {
      return this.notifications.slice();
    };


    /*
    Section: Managing Notifications
     */

    NotificationManager.prototype.clear = function() {
      return this.notifications = [];
    };

    return NotificationManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ub3RpZmljYXRpb24tbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFVBQVcsT0FBQSxDQUFRLFdBQVI7O0VBQ1osWUFBQSxHQUFlLE9BQUEsQ0FBUSxxQkFBUjs7RUFPZixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNkJBQUE7TUFDWCxJQUFDLENBQUEsYUFBRCxHQUFpQjtNQUNqQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7SUFGSjs7O0FBSWI7Ozs7a0NBVUEsb0JBQUEsR0FBc0IsU0FBQyxRQUFEO2FBQ3BCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLHNCQUFaLEVBQW9DLFFBQXBDO0lBRG9COzs7QUFHdEI7Ozs7a0NBMEJBLFVBQUEsR0FBWSxTQUFDLE9BQUQsRUFBVSxPQUFWO2FBQ1YsSUFBQyxDQUFBLGVBQUQsQ0FBcUIsSUFBQSxZQUFBLENBQWEsU0FBYixFQUF3QixPQUF4QixFQUFpQyxPQUFqQyxDQUFyQjtJQURVOztrQ0F5QlosT0FBQSxHQUFTLFNBQUMsT0FBRCxFQUFVLE9BQVY7YUFDUCxJQUFDLENBQUEsZUFBRCxDQUFxQixJQUFBLFlBQUEsQ0FBYSxNQUFiLEVBQXFCLE9BQXJCLEVBQThCLE9BQTlCLENBQXJCO0lBRE87O2tDQXlCVCxVQUFBLEdBQVksU0FBQyxPQUFELEVBQVUsT0FBVjthQUNWLElBQUMsQ0FBQSxlQUFELENBQXFCLElBQUEsWUFBQSxDQUFhLFNBQWIsRUFBd0IsT0FBeEIsRUFBaUMsT0FBakMsQ0FBckI7SUFEVTs7a0NBMkJaLFFBQUEsR0FBVSxTQUFDLE9BQUQsRUFBVSxPQUFWO2FBQ1IsSUFBQyxDQUFBLGVBQUQsQ0FBcUIsSUFBQSxZQUFBLENBQWEsT0FBYixFQUFzQixPQUF0QixFQUErQixPQUEvQixDQUFyQjtJQURROztrQ0EyQlYsYUFBQSxHQUFlLFNBQUMsT0FBRCxFQUFVLE9BQVY7YUFDYixJQUFDLENBQUEsZUFBRCxDQUFxQixJQUFBLFlBQUEsQ0FBYSxPQUFiLEVBQXNCLE9BQXRCLEVBQStCLE9BQS9CLENBQXJCO0lBRGE7O2tDQUdmLEdBQUEsR0FBSyxTQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLE9BQWhCO2FBQ0gsSUFBQyxDQUFBLGVBQUQsQ0FBcUIsSUFBQSxZQUFBLENBQWEsSUFBYixFQUFtQixPQUFuQixFQUE0QixPQUE1QixDQUFyQjtJQURHOztrQ0FHTCxlQUFBLEdBQWlCLFNBQUMsWUFBRDtNQUNmLElBQUMsQ0FBQSxhQUFhLENBQUMsSUFBZixDQUFvQixZQUFwQjtNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHNCQUFkLEVBQXNDLFlBQXRDO2FBQ0E7SUFIZTs7O0FBS2pCOzs7O2tDQU9BLGdCQUFBLEdBQWtCLFNBQUE7YUFBRyxJQUFDLENBQUEsYUFBYSxDQUFDLEtBQWYsQ0FBQTtJQUFIOzs7QUFFbEI7Ozs7a0NBSUEsS0FBQSxHQUFPLFNBQUE7YUFDTCxJQUFDLENBQUEsYUFBRCxHQUFpQjtJQURaOzs7OztBQXJMVCIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbk5vdGlmaWNhdGlvbiA9IHJlcXVpcmUgJy4uL3NyYy9ub3RpZmljYXRpb24nXG5cbiMgUHVibGljOiBBIG5vdGlmaWNhdGlvbiBtYW5hZ2VyIHVzZWQgdG8gY3JlYXRlIHtOb3RpZmljYXRpb259cyB0byBiZSBzaG93blxuIyB0byB0aGUgdXNlci5cbiNcbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS5ub3RpZmljYXRpb25zYFxuIyBnbG9iYWwuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBOb3RpZmljYXRpb25NYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBub3RpZmljYXRpb25zID0gW11cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50c1xuICAjIyNcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayBhZnRlciBhIG5vdGlmaWNhdGlvbiBoYXMgYmVlbiBhZGRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgbm90aWZpY2F0aW9uIGlzIGFkZGVkLlxuICAjICAgKiBgbm90aWZpY2F0aW9uYCBUaGUge05vdGlmaWNhdGlvbn0gdGhhdCB3YXMgYWRkZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZEFkZE5vdGlmaWNhdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLW5vdGlmaWNhdGlvbicsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFkZGluZyBOb3RpZmljYXRpb25zXG4gICMjI1xuXG4gICMgUHVibGljOiBBZGQgYSBzdWNjZXNzIG5vdGlmaWNhdGlvbi5cbiAgI1xuICAjICogYG1lc3NhZ2VgIEEge1N0cmluZ30gbWVzc2FnZVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAqIGBidXR0b25zYCAob3B0aW9uYWwpIEFuIHtBcnJheX0gb2Yge09iamVjdH0gd2hlcmUgZWFjaCB7T2JqZWN0fSBoYXMgdGhlXG4gICMgICAgICBmb2xsb3dpbmcgb3B0aW9uczpcbiAgIyAgICAgICogYGNsYXNzTmFtZWAgKG9wdGlvbmFsKSB7U3RyaW5nfSBhIGNsYXNzIG5hbWUgdG8gYWRkIHRvIHRoZSBidXR0b24nc1xuICAjICAgICAgICBkZWZhdWx0IGNsYXNzIG5hbWUgKGBidG4gYnRuLXN1Y2Nlc3NgKS5cbiAgIyAgICAgICogYG9uRGlkQ2xpY2tgIChvcHRpb25hbCkge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBjYWxsIHdoZW4gdGhlIGJ1dHRvblxuICAjICAgICAgICBoYXMgYmVlbiBjbGlja2VkLiBUaGUgY29udGV4dCB3aWxsIGJlIHNldCB0byB0aGVcbiAgIyAgICAgICAge05vdGlmaWNhdGlvbkVsZW1lbnR9IGluc3RhbmNlLlxuICAjICAgICAgKiBgdGV4dGAge1N0cmluZ30gaW5uZXIgdGV4dCBmb3IgdGhlIGJ1dHRvblxuICAjICAgICogYGRlc2NyaXB0aW9uYCAob3B0aW9uYWwpIEEgTWFya2Rvd24ge1N0cmluZ30gY29udGFpbmluZyBhIGxvbmdlclxuICAjICAgICAgZGVzY3JpcHRpb24gYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwgbm90KipcbiAgIyAgICAgIHByZXNlcnZlIG5ld2xpbmVzIGFuZCB3aGl0ZXNwYWNlIHdoZW4gaXQgaXMgcmVuZGVyZWQuXG4gICMgICAgKiBgZGV0YWlsYCAob3B0aW9uYWwpIEEgcGxhaW4tdGV4dCB7U3RyaW5nfSBjb250YWluaW5nIGFkZGl0aW9uYWwgZGV0YWlsc1xuICAjICAgICAgYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwqKiBwcmVzZXJ2ZSBuZXdsaW5lc1xuICAjICAgICAgYW5kIHdoaXRlc3BhY2Ugd2hlbiBpdCBpcyByZW5kZXJlZC5cbiAgIyAgICAqIGBkaXNtaXNzYWJsZWAgKG9wdGlvbmFsKSBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpc1xuICAjICAgICAgbm90aWZpY2F0aW9uIGNhbiBiZSBkaXNtaXNzZWQgYnkgdGhlIHVzZXIuIERlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICMgICAgKiBgaWNvbmAgKG9wdGlvbmFsKSBBIHtTdHJpbmd9IG5hbWUgb2YgYW4gaWNvbiBmcm9tIE9jdGljb25zIHRvIGRpc3BsYXlcbiAgIyAgICAgIGluIHRoZSBub3RpZmljYXRpb24gaGVhZGVyLiBEZWZhdWx0cyB0byBgJ2NoZWNrJ2AuXG4gIGFkZFN1Y2Nlc3M6IChtZXNzYWdlLCBvcHRpb25zKSAtPlxuICAgIEBhZGROb3RpZmljYXRpb24obmV3IE5vdGlmaWNhdGlvbignc3VjY2VzcycsIG1lc3NhZ2UsIG9wdGlvbnMpKVxuXG4gICMgUHVibGljOiBBZGQgYW4gaW5mb3JtYXRpb25hbCBub3RpZmljYXRpb24uXG4gICNcbiAgIyAqIGBtZXNzYWdlYCBBIHtTdHJpbmd9IG1lc3NhZ2VcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIG9wdGlvbnMge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgKiBgYnV0dG9uc2AgKG9wdGlvbmFsKSBBbiB7QXJyYXl9IG9mIHtPYmplY3R9IHdoZXJlIGVhY2gge09iamVjdH0gaGFzIHRoZVxuICAjICAgICAgZm9sbG93aW5nIG9wdGlvbnM6XG4gICMgICAgICAqIGBjbGFzc05hbWVgIChvcHRpb25hbCkge1N0cmluZ30gYSBjbGFzcyBuYW1lIHRvIGFkZCB0byB0aGUgYnV0dG9uJ3NcbiAgIyAgICAgICAgZGVmYXVsdCBjbGFzcyBuYW1lIChgYnRuIGJ0bi1pbmZvYCkuXG4gICMgICAgICAqIGBvbkRpZENsaWNrYCAob3B0aW9uYWwpIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gY2FsbCB3aGVuIHRoZSBidXR0b25cbiAgIyAgICAgICAgaGFzIGJlZW4gY2xpY2tlZC4gVGhlIGNvbnRleHQgd2lsbCBiZSBzZXQgdG8gdGhlXG4gICMgICAgICAgIHtOb3RpZmljYXRpb25FbGVtZW50fSBpbnN0YW5jZS5cbiAgIyAgICAgICogYHRleHRgIHtTdHJpbmd9IGlubmVyIHRleHQgZm9yIHRoZSBidXR0b25cbiAgIyAgICAqIGBkZXNjcmlwdGlvbmAgKG9wdGlvbmFsKSBBIE1hcmtkb3duIHtTdHJpbmd9IGNvbnRhaW5pbmcgYSBsb25nZXJcbiAgIyAgICAgIGRlc2NyaXB0aW9uIGFib3V0IHRoZSBub3RpZmljYXRpb24uIEJ5IGRlZmF1bHQsIHRoaXMgKip3aWxsIG5vdCoqXG4gICMgICAgICBwcmVzZXJ2ZSBuZXdsaW5lcyBhbmQgd2hpdGVzcGFjZSB3aGVuIGl0IGlzIHJlbmRlcmVkLlxuICAjICAgICogYGRldGFpbGAgKG9wdGlvbmFsKSBBIHBsYWluLXRleHQge1N0cmluZ30gY29udGFpbmluZyBhZGRpdGlvbmFsIGRldGFpbHNcbiAgIyAgICAgIGFib3V0IHRoZSBub3RpZmljYXRpb24uIEJ5IGRlZmF1bHQsIHRoaXMgKip3aWxsKiogcHJlc2VydmUgbmV3bGluZXNcbiAgIyAgICAgIGFuZCB3aGl0ZXNwYWNlIHdoZW4gaXQgaXMgcmVuZGVyZWQuXG4gICMgICAgKiBgZGlzbWlzc2FibGVgIChvcHRpb25hbCkgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoaXNcbiAgIyAgICAgIG5vdGlmaWNhdGlvbiBjYW4gYmUgZGlzbWlzc2VkIGJ5IHRoZSB1c2VyLiBEZWZhdWx0cyB0byBgZmFsc2VgLlxuICAjICAgICogYGljb25gIChvcHRpb25hbCkgQSB7U3RyaW5nfSBuYW1lIG9mIGFuIGljb24gZnJvbSBPY3RpY29ucyB0byBkaXNwbGF5XG4gICMgICAgICBpbiB0aGUgbm90aWZpY2F0aW9uIGhlYWRlci4gRGVmYXVsdHMgdG8gYCdpbmZvJ2AuXG4gIGFkZEluZm86IChtZXNzYWdlLCBvcHRpb25zKSAtPlxuICAgIEBhZGROb3RpZmljYXRpb24obmV3IE5vdGlmaWNhdGlvbignaW5mbycsIG1lc3NhZ2UsIG9wdGlvbnMpKVxuXG4gICMgUHVibGljOiBBZGQgYSB3YXJuaW5nIG5vdGlmaWNhdGlvbi5cbiAgI1xuICAjICogYG1lc3NhZ2VgIEEge1N0cmluZ30gbWVzc2FnZVxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkgQW4gb3B0aW9ucyB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAqIGBidXR0b25zYCAob3B0aW9uYWwpIEFuIHtBcnJheX0gb2Yge09iamVjdH0gd2hlcmUgZWFjaCB7T2JqZWN0fSBoYXMgdGhlXG4gICMgICAgICBmb2xsb3dpbmcgb3B0aW9uczpcbiAgIyAgICAgICogYGNsYXNzTmFtZWAgKG9wdGlvbmFsKSB7U3RyaW5nfSBhIGNsYXNzIG5hbWUgdG8gYWRkIHRvIHRoZSBidXR0b24nc1xuICAjICAgICAgICBkZWZhdWx0IGNsYXNzIG5hbWUgKGBidG4gYnRuLXdhcm5pbmdgKS5cbiAgIyAgICAgICogYG9uRGlkQ2xpY2tgIChvcHRpb25hbCkge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBjYWxsIHdoZW4gdGhlIGJ1dHRvblxuICAjICAgICAgICBoYXMgYmVlbiBjbGlja2VkLiBUaGUgY29udGV4dCB3aWxsIGJlIHNldCB0byB0aGVcbiAgIyAgICAgICAge05vdGlmaWNhdGlvbkVsZW1lbnR9IGluc3RhbmNlLlxuICAjICAgICAgKiBgdGV4dGAge1N0cmluZ30gaW5uZXIgdGV4dCBmb3IgdGhlIGJ1dHRvblxuICAjICAgICogYGRlc2NyaXB0aW9uYCAob3B0aW9uYWwpIEEgTWFya2Rvd24ge1N0cmluZ30gY29udGFpbmluZyBhIGxvbmdlclxuICAjICAgICAgZGVzY3JpcHRpb24gYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwgbm90KipcbiAgIyAgICAgIHByZXNlcnZlIG5ld2xpbmVzIGFuZCB3aGl0ZXNwYWNlIHdoZW4gaXQgaXMgcmVuZGVyZWQuXG4gICMgICAgKiBgZGV0YWlsYCAob3B0aW9uYWwpIEEgcGxhaW4tdGV4dCB7U3RyaW5nfSBjb250YWluaW5nIGFkZGl0aW9uYWwgZGV0YWlsc1xuICAjICAgICAgYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwqKiBwcmVzZXJ2ZSBuZXdsaW5lc1xuICAjICAgICAgYW5kIHdoaXRlc3BhY2Ugd2hlbiBpdCBpcyByZW5kZXJlZC5cbiAgIyAgICAqIGBkaXNtaXNzYWJsZWAgKG9wdGlvbmFsKSBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpc1xuICAjICAgICAgbm90aWZpY2F0aW9uIGNhbiBiZSBkaXNtaXNzZWQgYnkgdGhlIHVzZXIuIERlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICMgICAgKiBgaWNvbmAgKG9wdGlvbmFsKSBBIHtTdHJpbmd9IG5hbWUgb2YgYW4gaWNvbiBmcm9tIE9jdGljb25zIHRvIGRpc3BsYXlcbiAgIyAgICAgIGluIHRoZSBub3RpZmljYXRpb24gaGVhZGVyLiBEZWZhdWx0cyB0byBgJ2FsZXJ0J2AuXG4gIGFkZFdhcm5pbmc6IChtZXNzYWdlLCBvcHRpb25zKSAtPlxuICAgIEBhZGROb3RpZmljYXRpb24obmV3IE5vdGlmaWNhdGlvbignd2FybmluZycsIG1lc3NhZ2UsIG9wdGlvbnMpKVxuXG4gICMgUHVibGljOiBBZGQgYW4gZXJyb3Igbm90aWZpY2F0aW9uLlxuICAjXG4gICMgKiBgbWVzc2FnZWAgQSB7U3RyaW5nfSBtZXNzYWdlXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSBBbiBvcHRpb25zIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICogYGJ1dHRvbnNgIChvcHRpb25hbCkgQW4ge0FycmF5fSBvZiB7T2JqZWN0fSB3aGVyZSBlYWNoIHtPYmplY3R9IGhhcyB0aGVcbiAgIyAgICAgIGZvbGxvd2luZyBvcHRpb25zOlxuICAjICAgICAgKiBgY2xhc3NOYW1lYCAob3B0aW9uYWwpIHtTdHJpbmd9IGEgY2xhc3MgbmFtZSB0byBhZGQgdG8gdGhlIGJ1dHRvbidzXG4gICMgICAgICAgIGRlZmF1bHQgY2xhc3MgbmFtZSAoYGJ0biBidG4tZXJyb3JgKS5cbiAgIyAgICAgICogYG9uRGlkQ2xpY2tgIChvcHRpb25hbCkge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBjYWxsIHdoZW4gdGhlIGJ1dHRvblxuICAjICAgICAgICBoYXMgYmVlbiBjbGlja2VkLiBUaGUgY29udGV4dCB3aWxsIGJlIHNldCB0byB0aGVcbiAgIyAgICAgICAge05vdGlmaWNhdGlvbkVsZW1lbnR9IGluc3RhbmNlLlxuICAjICAgICAgKiBgdGV4dGAge1N0cmluZ30gaW5uZXIgdGV4dCBmb3IgdGhlIGJ1dHRvblxuICAjICAgICogYGRlc2NyaXB0aW9uYCAob3B0aW9uYWwpIEEgTWFya2Rvd24ge1N0cmluZ30gY29udGFpbmluZyBhIGxvbmdlclxuICAjICAgICAgZGVzY3JpcHRpb24gYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwgbm90KipcbiAgIyAgICAgIHByZXNlcnZlIG5ld2xpbmVzIGFuZCB3aGl0ZXNwYWNlIHdoZW4gaXQgaXMgcmVuZGVyZWQuXG4gICMgICAgKiBgZGV0YWlsYCAob3B0aW9uYWwpIEEgcGxhaW4tdGV4dCB7U3RyaW5nfSBjb250YWluaW5nIGFkZGl0aW9uYWwgZGV0YWlsc1xuICAjICAgICAgYWJvdXQgdGhlIG5vdGlmaWNhdGlvbi4gQnkgZGVmYXVsdCwgdGhpcyAqKndpbGwqKiBwcmVzZXJ2ZSBuZXdsaW5lc1xuICAjICAgICAgYW5kIHdoaXRlc3BhY2Ugd2hlbiBpdCBpcyByZW5kZXJlZC5cbiAgIyAgICAqIGBkaXNtaXNzYWJsZWAgKG9wdGlvbmFsKSBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpc1xuICAjICAgICAgbm90aWZpY2F0aW9uIGNhbiBiZSBkaXNtaXNzZWQgYnkgdGhlIHVzZXIuIERlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICMgICAgKiBgaWNvbmAgKG9wdGlvbmFsKSBBIHtTdHJpbmd9IG5hbWUgb2YgYW4gaWNvbiBmcm9tIE9jdGljb25zIHRvIGRpc3BsYXlcbiAgIyAgICAgIGluIHRoZSBub3RpZmljYXRpb24gaGVhZGVyLiBEZWZhdWx0cyB0byBgJ2ZsYW1lJ2AuXG4gICMgICAgKiBgc3RhY2tgIChvcHRpb25hbCkgQSBwcmVmb3JtYXR0ZWQge1N0cmluZ30gd2l0aCBzdGFjayB0cmFjZSBpbmZvcm1hdGlvblxuICAjICAgICAgZGVzY3JpYmluZyB0aGUgbG9jYXRpb24gb2YgdGhlIGVycm9yLlxuICBhZGRFcnJvcjogKG1lc3NhZ2UsIG9wdGlvbnMpIC0+XG4gICAgQGFkZE5vdGlmaWNhdGlvbihuZXcgTm90aWZpY2F0aW9uKCdlcnJvcicsIG1lc3NhZ2UsIG9wdGlvbnMpKVxuXG4gICMgUHVibGljOiBBZGQgYSBmYXRhbCBlcnJvciBub3RpZmljYXRpb24uXG4gICNcbiAgIyAqIGBtZXNzYWdlYCBBIHtTdHJpbmd9IG1lc3NhZ2VcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIEFuIG9wdGlvbnMge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgKiBgYnV0dG9uc2AgKG9wdGlvbmFsKSBBbiB7QXJyYXl9IG9mIHtPYmplY3R9IHdoZXJlIGVhY2gge09iamVjdH0gaGFzIHRoZVxuICAjICAgICAgZm9sbG93aW5nIG9wdGlvbnM6XG4gICMgICAgICAqIGBjbGFzc05hbWVgIChvcHRpb25hbCkge1N0cmluZ30gYSBjbGFzcyBuYW1lIHRvIGFkZCB0byB0aGUgYnV0dG9uJ3NcbiAgIyAgICAgICAgZGVmYXVsdCBjbGFzcyBuYW1lIChgYnRuIGJ0bi1lcnJvcmApLlxuICAjICAgICAgKiBgb25EaWRDbGlja2AgKG9wdGlvbmFsKSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGNhbGwgd2hlbiB0aGUgYnV0dG9uXG4gICMgICAgICAgIGhhcyBiZWVuIGNsaWNrZWQuIFRoZSBjb250ZXh0IHdpbGwgYmUgc2V0IHRvIHRoZVxuICAjICAgICAgICB7Tm90aWZpY2F0aW9uRWxlbWVudH0gaW5zdGFuY2UuXG4gICMgICAgICAqIGB0ZXh0YCB7U3RyaW5nfSBpbm5lciB0ZXh0IGZvciB0aGUgYnV0dG9uXG4gICMgICAgKiBgZGVzY3JpcHRpb25gIChvcHRpb25hbCkgQSBNYXJrZG93biB7U3RyaW5nfSBjb250YWluaW5nIGEgbG9uZ2VyXG4gICMgICAgICBkZXNjcmlwdGlvbiBhYm91dCB0aGUgbm90aWZpY2F0aW9uLiBCeSBkZWZhdWx0LCB0aGlzICoqd2lsbCBub3QqKlxuICAjICAgICAgcHJlc2VydmUgbmV3bGluZXMgYW5kIHdoaXRlc3BhY2Ugd2hlbiBpdCBpcyByZW5kZXJlZC5cbiAgIyAgICAqIGBkZXRhaWxgIChvcHRpb25hbCkgQSBwbGFpbi10ZXh0IHtTdHJpbmd9IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBkZXRhaWxzXG4gICMgICAgICBhYm91dCB0aGUgbm90aWZpY2F0aW9uLiBCeSBkZWZhdWx0LCB0aGlzICoqd2lsbCoqIHByZXNlcnZlIG5ld2xpbmVzXG4gICMgICAgICBhbmQgd2hpdGVzcGFjZSB3aGVuIGl0IGlzIHJlbmRlcmVkLlxuICAjICAgICogYGRpc21pc3NhYmxlYCAob3B0aW9uYWwpIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0aGlzXG4gICMgICAgICBub3RpZmljYXRpb24gY2FuIGJlIGRpc21pc3NlZCBieSB0aGUgdXNlci4gRGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAgIyAgICAqIGBpY29uYCAob3B0aW9uYWwpIEEge1N0cmluZ30gbmFtZSBvZiBhbiBpY29uIGZyb20gT2N0aWNvbnMgdG8gZGlzcGxheVxuICAjICAgICAgaW4gdGhlIG5vdGlmaWNhdGlvbiBoZWFkZXIuIERlZmF1bHRzIHRvIGAnYnVnJ2AuXG4gICMgICAgKiBgc3RhY2tgIChvcHRpb25hbCkgQSBwcmVmb3JtYXR0ZWQge1N0cmluZ30gd2l0aCBzdGFjayB0cmFjZSBpbmZvcm1hdGlvblxuICAjICAgICAgZGVzY3JpYmluZyB0aGUgbG9jYXRpb24gb2YgdGhlIGVycm9yLlxuICBhZGRGYXRhbEVycm9yOiAobWVzc2FnZSwgb3B0aW9ucykgLT5cbiAgICBAYWRkTm90aWZpY2F0aW9uKG5ldyBOb3RpZmljYXRpb24oJ2ZhdGFsJywgbWVzc2FnZSwgb3B0aW9ucykpXG5cbiAgYWRkOiAodHlwZSwgbWVzc2FnZSwgb3B0aW9ucykgLT5cbiAgICBAYWRkTm90aWZpY2F0aW9uKG5ldyBOb3RpZmljYXRpb24odHlwZSwgbWVzc2FnZSwgb3B0aW9ucykpXG5cbiAgYWRkTm90aWZpY2F0aW9uOiAobm90aWZpY2F0aW9uKSAtPlxuICAgIEBub3RpZmljYXRpb25zLnB1c2gobm90aWZpY2F0aW9uKVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1hZGQtbm90aWZpY2F0aW9uJywgbm90aWZpY2F0aW9uKVxuICAgIG5vdGlmaWNhdGlvblxuXG4gICMjI1xuICBTZWN0aW9uOiBHZXR0aW5nIE5vdGlmaWNhdGlvbnNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEdldCBhbGwgdGhlIG5vdGlmaWNhdGlvbnMuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge05vdGlmaWNhdGlvbn1zLlxuICBnZXROb3RpZmljYXRpb25zOiAtPiBAbm90aWZpY2F0aW9ucy5zbGljZSgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1hbmFnaW5nIE5vdGlmaWNhdGlvbnNcbiAgIyMjXG5cbiAgY2xlYXI6IC0+XG4gICAgQG5vdGlmaWNhdGlvbnMgPSBbXVxuIl19
