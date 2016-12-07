(function() {
  var ScopeSelector, cache;

  ScopeSelector = null;

  cache = {};

  exports.get = function(selector) {
    var scopeSelector;
    scopeSelector = cache[selector];
    if (scopeSelector == null) {
      if (ScopeSelector == null) {
        ScopeSelector = require('first-mate').ScopeSelector;
      }
      scopeSelector = new ScopeSelector(selector);
      cache[selector] = scopeSelector;
    }
    return scopeSelector;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9icmFja2V0LW1hdGNoZXIvbGliL3NlbGVjdG9yLWNhY2hlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsYUFBQSxHQUFnQjs7RUFDaEIsS0FBQSxHQUFROztFQUVSLE9BQU8sQ0FBQyxHQUFSLEdBQWMsU0FBQyxRQUFEO0FBQ1osUUFBQTtJQUFBLGFBQUEsR0FBZ0IsS0FBTSxDQUFBLFFBQUE7SUFDdEIsSUFBTyxxQkFBUDs7UUFDRSxnQkFBaUIsT0FBQSxDQUFRLFlBQVIsQ0FBcUIsQ0FBQzs7TUFDdkMsYUFBQSxHQUFvQixJQUFBLGFBQUEsQ0FBYyxRQUFkO01BQ3BCLEtBQU0sQ0FBQSxRQUFBLENBQU4sR0FBa0IsY0FIcEI7O1dBSUE7RUFOWTtBQUhkIiwic291cmNlc0NvbnRlbnQiOlsiU2NvcGVTZWxlY3RvciA9IG51bGxcbmNhY2hlID0ge31cblxuZXhwb3J0cy5nZXQgPSAoc2VsZWN0b3IpIC0+XG4gIHNjb3BlU2VsZWN0b3IgPSBjYWNoZVtzZWxlY3Rvcl1cbiAgdW5sZXNzIHNjb3BlU2VsZWN0b3I/XG4gICAgU2NvcGVTZWxlY3RvciA/PSByZXF1aXJlKCdmaXJzdC1tYXRlJykuU2NvcGVTZWxlY3RvclxuICAgIHNjb3BlU2VsZWN0b3IgPSBuZXcgU2NvcGVTZWxlY3RvcihzZWxlY3RvcilcbiAgICBjYWNoZVtzZWxlY3Rvcl0gPSBzY29wZVNlbGVjdG9yXG4gIHNjb3BlU2VsZWN0b3JcbiJdfQ==
