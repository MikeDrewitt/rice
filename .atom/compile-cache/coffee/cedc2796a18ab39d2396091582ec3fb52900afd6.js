(function() {
  var OperationAbortedError, VimModePlusError,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  VimModePlusError = (function(superClass) {
    extend(VimModePlusError, superClass);

    function VimModePlusError(arg) {
      this.message = arg.message;
      this.name = this.constructor.name;
    }

    return VimModePlusError;

  })(Error);

  OperationAbortedError = (function(superClass) {
    extend(OperationAbortedError, superClass);

    function OperationAbortedError() {
      return OperationAbortedError.__super__.constructor.apply(this, arguments);
    }

    return OperationAbortedError;

  })(VimModePlusError);

  module.exports = {
    OperationAbortedError: OperationAbortedError
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9lcnJvcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1Q0FBQTtJQUFBOzs7RUFBTTs7O0lBQ1MsMEJBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxVQUFGLElBQUU7TUFDZCxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxXQUFXLENBQUM7SUFEVjs7OztLQURnQjs7RUFJekI7Ozs7Ozs7OztLQUE4Qjs7RUFFcEMsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZix1QkFBQSxxQkFEZTs7QUFOakIiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBWaW1Nb2RlUGx1c0Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgY29uc3RydWN0b3I6ICh7QG1lc3NhZ2V9KSAtPlxuICAgIEBuYW1lID0gQGNvbnN0cnVjdG9yLm5hbWVcblxuY2xhc3MgT3BlcmF0aW9uQWJvcnRlZEVycm9yIGV4dGVuZHMgVmltTW9kZVBsdXNFcnJvclxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgT3BlcmF0aW9uQWJvcnRlZEVycm9yXG59XG4iXX0=
