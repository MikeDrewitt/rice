(function() {
  var Prefix, Register, Repeat,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Prefix = (function() {
    function Prefix() {}

    Prefix.prototype.complete = null;

    Prefix.prototype.composedObject = null;

    Prefix.prototype.isComplete = function() {
      return this.complete;
    };

    Prefix.prototype.isRecordable = function() {
      return this.composedObject.isRecordable();
    };

    Prefix.prototype.compose = function(composedObject1) {
      this.composedObject = composedObject1;
      return this.complete = true;
    };

    Prefix.prototype.execute = function() {
      var base;
      return typeof (base = this.composedObject).execute === "function" ? base.execute(this.count) : void 0;
    };

    Prefix.prototype.select = function() {
      var base;
      return typeof (base = this.composedObject).select === "function" ? base.select(this.count) : void 0;
    };

    Prefix.prototype.isLinewise = function() {
      var base;
      return typeof (base = this.composedObject).isLinewise === "function" ? base.isLinewise() : void 0;
    };

    return Prefix;

  })();

  Repeat = (function(superClass) {
    extend(Repeat, superClass);

    Repeat.prototype.count = null;

    function Repeat(count) {
      this.count = count;
      this.complete = false;
    }

    Repeat.prototype.addDigit = function(digit) {
      return this.count = this.count * 10 + digit;
    };

    return Repeat;

  })(Prefix);

  Register = (function(superClass) {
    extend(Register, superClass);

    Register.prototype.name = null;

    function Register(name) {
      this.name = name;
      this.complete = false;
    }

    Register.prototype.compose = function(composedObject) {
      Register.__super__.compose.call(this, composedObject);
      if (composedObject.register != null) {
        return composedObject.register = this.name;
      }
    };

    return Register;

  })(Prefix);

  module.exports = {
    Repeat: Repeat,
    Register: Register
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvcHJlZml4ZXMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3QkFBQTtJQUFBOzs7RUFBTTs7O3FCQUNKLFFBQUEsR0FBVTs7cUJBQ1YsY0FBQSxHQUFnQjs7cUJBRWhCLFVBQUEsR0FBWSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O3FCQUVaLFlBQUEsR0FBYyxTQUFBO2FBQUcsSUFBQyxDQUFBLGNBQWMsQ0FBQyxZQUFoQixDQUFBO0lBQUg7O3FCQU9kLE9BQUEsR0FBUyxTQUFDLGVBQUQ7TUFBQyxJQUFDLENBQUEsaUJBQUQ7YUFDUixJQUFDLENBQUEsUUFBRCxHQUFZO0lBREw7O3FCQU1ULE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTs4RUFBZSxDQUFDLFFBQVMsSUFBQyxDQUFBO0lBRG5COztxQkFNVCxNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7NkVBQWUsQ0FBQyxPQUFRLElBQUMsQ0FBQTtJQURuQjs7cUJBR1IsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO2lGQUFlLENBQUM7SUFETjs7Ozs7O0VBT1I7OztxQkFDSixLQUFBLEdBQU87O0lBR00sZ0JBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxRQUFEO01BQVcsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUF4Qjs7cUJBT2IsUUFBQSxHQUFVLFNBQUMsS0FBRDthQUNSLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLEtBQUQsR0FBUyxFQUFULEdBQWM7SUFEZjs7OztLQVhTOztFQWlCZjs7O3VCQUNKLElBQUEsR0FBTTs7SUFHTyxrQkFBQyxJQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFBVSxJQUFDLENBQUEsUUFBRCxHQUFZO0lBQXZCOzt1QkFPYixPQUFBLEdBQVMsU0FBQyxjQUFEO01BQ1Asc0NBQU0sY0FBTjtNQUNBLElBQW1DLCtCQUFuQztlQUFBLGNBQWMsQ0FBQyxRQUFmLEdBQTBCLElBQUMsQ0FBQSxLQUEzQjs7SUFGTzs7OztLQVhZOztFQWV2QixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLFFBQUEsTUFBRDtJQUFTLFVBQUEsUUFBVDs7QUFuRWpCIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgUHJlZml4XG4gIGNvbXBsZXRlOiBudWxsXG4gIGNvbXBvc2VkT2JqZWN0OiBudWxsXG5cbiAgaXNDb21wbGV0ZTogLT4gQGNvbXBsZXRlXG5cbiAgaXNSZWNvcmRhYmxlOiAtPiBAY29tcG9zZWRPYmplY3QuaXNSZWNvcmRhYmxlKClcblxuICAjIFB1YmxpYzogTWFya3MgdGhpcyBhcyBjb21wbGV0ZSB1cG9uIHJlY2VpdmluZyBhbiBvYmplY3QgdG8gY29tcG9zZSB3aXRoLlxuICAjXG4gICMgY29tcG9zZWRPYmplY3QgLSBUaGUgbmV4dCBtb3Rpb24gb3Igb3BlcmF0b3IuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIGNvbXBvc2U6IChAY29tcG9zZWRPYmplY3QpIC0+XG4gICAgQGNvbXBsZXRlID0gdHJ1ZVxuXG4gICMgUHVibGljOiBFeGVjdXRlcyB0aGUgY29tcG9zZWQgb3BlcmF0b3Igb3IgbW90aW9uLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBleGVjdXRlOiAtPlxuICAgIEBjb21wb3NlZE9iamVjdC5leGVjdXRlPyhAY291bnQpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgdXNpbmcgdGhlIGNvbXBvc2VkIG1vdGlvbi5cbiAgI1xuICAjIFJldHVybnMgYW4gYXJyYXkgb2YgYm9vbGVhbnMgcmVwcmVzZW50aW5nIHdoZXRoZXIgZWFjaCBzZWxlY3Rpb25zJyBzdWNjZXNzLlxuICBzZWxlY3Q6IC0+XG4gICAgQGNvbXBvc2VkT2JqZWN0LnNlbGVjdD8oQGNvdW50KVxuXG4gIGlzTGluZXdpc2U6IC0+XG4gICAgQGNvbXBvc2VkT2JqZWN0LmlzTGluZXdpc2U/KClcblxuI1xuIyBVc2VkIHRvIHRyYWNrIHRoZSBudW1iZXIgb2YgdGltZXMgZWl0aGVyIGEgbW90aW9uIG9yIG9wZXJhdG9yIHNob3VsZFxuIyBiZSByZXBlYXRlZC5cbiNcbmNsYXNzIFJlcGVhdCBleHRlbmRzIFByZWZpeFxuICBjb3VudDogbnVsbFxuXG4gICMgY291bnQgLSBUaGUgaW5pdGlhbCBkaWdpdCBvZiB0aGUgcmVwZWF0IHNlcXVlbmNlLlxuICBjb25zdHJ1Y3RvcjogKEBjb3VudCkgLT4gQGNvbXBsZXRlID0gZmFsc2VcblxuICAjIFB1YmxpYzogQWRkcyBhbiBhZGRpdGlvbmFsIGRpZ2l0IHRvIHRoaXMgcmVwZWF0IHNlcXVlbmNlLlxuICAjXG4gICMgZGlnaXQgLSBBIHNpbmdsZSBkaWdpdCwgMC05LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBhZGREaWdpdDogKGRpZ2l0KSAtPlxuICAgIEBjb3VudCA9IEBjb3VudCAqIDEwICsgZGlnaXRcblxuI1xuIyBVc2VkIHRvIHRyYWNrIHdoaWNoIHJlZ2lzdGVyIHRoZSBmb2xsb3dpbmcgb3BlcmF0b3Igc2hvdWxkIG9wZXJhdGUgb24uXG4jXG5jbGFzcyBSZWdpc3RlciBleHRlbmRzIFByZWZpeFxuICBuYW1lOiBudWxsXG5cbiAgIyBuYW1lIC0gVGhlIHNpbmdsZSBjaGFyYWN0ZXIgbmFtZSBvZiB0aGUgZGVzaXJlZCByZWdpc3RlclxuICBjb25zdHJ1Y3RvcjogKEBuYW1lKSAtPiBAY29tcGxldGUgPSBmYWxzZVxuXG4gICMgUHVibGljOiBNYXJrcyBhcyBjb21wbGV0ZSBhbmQgc2V0cyB0aGUgb3BlcmF0b3IncyByZWdpc3RlciBpZiBpdCBhY2NlcHRzIGl0LlxuICAjXG4gICMgY29tcG9zZWRPcGVyYXRvciAtIFRoZSBvcGVyYXRvciB0aGlzIHJlZ2lzdGVyIHBlcnRhaW5zIHRvLlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBjb21wb3NlOiAoY29tcG9zZWRPYmplY3QpIC0+XG4gICAgc3VwZXIoY29tcG9zZWRPYmplY3QpXG4gICAgY29tcG9zZWRPYmplY3QucmVnaXN0ZXIgPSBAbmFtZSBpZiBjb21wb3NlZE9iamVjdC5yZWdpc3Rlcj9cblxubW9kdWxlLmV4cG9ydHMgPSB7UmVwZWF0LCBSZWdpc3Rlcn1cbiJdfQ==
