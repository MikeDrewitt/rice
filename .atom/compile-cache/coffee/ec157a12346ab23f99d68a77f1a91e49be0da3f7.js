(function() {
  var Whitespace;

  Whitespace = require('./whitespace');

  module.exports = {
    activate: function() {
      return this.whitespace = new Whitespace();
    },
    deactivate: function() {
      var ref;
      if ((ref = this.whitespace) != null) {
        ref.destroy();
      }
      return this.whitespace = null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93aGl0ZXNwYWNlL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsVUFBQSxHQUFhLE9BQUEsQ0FBUSxjQUFSOztFQUViLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxVQUFELEdBQWtCLElBQUEsVUFBQSxDQUFBO0lBRFYsQ0FBVjtJQUdBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTs7V0FBVyxDQUFFLE9BQWIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO0lBRkosQ0FIWjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbIldoaXRlc3BhY2UgPSByZXF1aXJlICcuL3doaXRlc3BhY2UnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHdoaXRlc3BhY2UgPSBuZXcgV2hpdGVzcGFjZSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAd2hpdGVzcGFjZT8uZGVzdHJveSgpXG4gICAgQHdoaXRlc3BhY2UgPSBudWxsXG4iXX0=
