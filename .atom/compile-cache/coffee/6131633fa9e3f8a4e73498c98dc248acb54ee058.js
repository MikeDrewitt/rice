(function() {
  var closest, indexOf, matches;

  closest = function(element, selector) {
    if (element == null) {
      return;
    }
    if (element.matches(selector)) {
      return element;
    }
    return closest(element.parentElement, selector);
  };

  indexOf = function(element, elements) {
    var child, i, index, len;
    if (elements == null) {
      elements = element.parentElement.children;
    }
    for (index = i = 0, len = elements.length; i < len; index = ++i) {
      child = elements[index];
      if (element === child) {
        return index;
      }
    }
    return -1;
  };

  matches = function(element, selector) {
    return element.matches(selector) || element.matches(selector + " *");
  };

  module.exports = {
    matches: matches,
    closest: closest,
    indexOf: indexOf
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90YWJzL2xpYi9odG1sLWhlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxPQUFBLEdBQVUsU0FBQyxPQUFELEVBQVUsUUFBVjtJQUNSLElBQWMsZUFBZDtBQUFBLGFBQUE7O0lBQ0EsSUFBa0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsUUFBaEIsQ0FBbEI7QUFBQSxhQUFPLFFBQVA7O1dBQ0EsT0FBQSxDQUFRLE9BQU8sQ0FBQyxhQUFoQixFQUErQixRQUEvQjtFQUhROztFQUtWLE9BQUEsR0FBVSxTQUFDLE9BQUQsRUFBVSxRQUFWO0FBQ1IsUUFBQTs7TUFBQSxXQUFZLE9BQU8sQ0FBQyxhQUFhLENBQUM7O0FBQ2xDLFNBQUEsMERBQUE7O01BQ0UsSUFBZ0IsT0FBQSxLQUFXLEtBQTNCO0FBQUEsZUFBTyxNQUFQOztBQURGO0FBRUEsV0FBTyxDQUFDO0VBSkE7O0VBTVYsT0FBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLFFBQVY7V0FDUixPQUFPLENBQUMsT0FBUixDQUFnQixRQUFoQixDQUFBLElBQTZCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFFBQUEsR0FBVyxJQUEzQjtFQURyQjs7RUFHVixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLFNBQUEsT0FBRDtJQUFVLFNBQUEsT0FBVjtJQUFtQixTQUFBLE9BQW5COztBQWRqQiIsInNvdXJjZXNDb250ZW50IjpbImNsb3Nlc3QgPSAoZWxlbWVudCwgc2VsZWN0b3IpIC0+XG4gIHJldHVybiB1bmxlc3MgZWxlbWVudD9cbiAgcmV0dXJuIGVsZW1lbnQgaWYgZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKVxuICBjbG9zZXN0KGVsZW1lbnQucGFyZW50RWxlbWVudCwgc2VsZWN0b3IpXG5cbmluZGV4T2YgPSAoZWxlbWVudCwgZWxlbWVudHMpIC0+XG4gIGVsZW1lbnRzID89IGVsZW1lbnQucGFyZW50RWxlbWVudC5jaGlsZHJlblxuICBmb3IgY2hpbGQsIGluZGV4IGluIGVsZW1lbnRzXG4gICAgcmV0dXJuIGluZGV4IGlmIGVsZW1lbnQgaXMgY2hpbGRcbiAgcmV0dXJuIC0xXG5cbm1hdGNoZXMgPSAoZWxlbWVudCwgc2VsZWN0b3IpIC0+XG4gIGVsZW1lbnQubWF0Y2hlcyhzZWxlY3Rvcikgb3IgZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yICsgXCIgKlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHttYXRjaGVzLCBjbG9zZXN0LCBpbmRleE9mfVxuIl19
