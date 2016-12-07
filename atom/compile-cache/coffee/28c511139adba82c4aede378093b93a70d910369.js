(function() {
  var NotificationsElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  NotificationsElement = (function(superClass) {
    extend(NotificationsElement, superClass);

    function NotificationsElement() {}

    return NotificationsElement;

  })(HTMLElement);

  module.exports = NotificationsElement = document.registerElement('atom-notifications', {
    prototype: NotificationsElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi9ub3RpZmljYXRpb25zLWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBO0FBQUEsTUFBQSxvQkFBQTtJQUFBOzs7RUFBTTs7O0lBQ1MsOEJBQUEsR0FBQTs7OztLQURvQjs7RUFHbkMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsb0JBQUEsR0FBdUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsb0JBQXpCLEVBQStDO0lBQUEsU0FBQSxFQUFXLG9CQUFvQixDQUFDLFNBQWhDO0dBQS9DO0FBSHhDIiwic291cmNlc0NvbnRlbnQiOlsiIyBBIGNvbnRhaW5lciBub2RlIGZvciBub3RpZmljYXRpb25zXG5cbmNsYXNzIE5vdGlmaWNhdGlvbnNFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgY29uc3RydWN0b3I6IC0+XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uc0VsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tbm90aWZpY2F0aW9ucycsIHByb3RvdHlwZTogTm90aWZpY2F0aW9uc0VsZW1lbnQucHJvdG90eXBlXG4iXX0=
