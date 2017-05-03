(function() {
  var provider;

  provider = require('./provider');

  module.exports = {
    activate: function() {
      return provider.load();
    },
    getProvider: function() {
      return provider;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtYXRvbS1hcGkvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQUcsUUFBUSxDQUFDLElBQVQsQ0FBQTtJQUFILENBQVY7SUFFQSxXQUFBLEVBQWEsU0FBQTthQUFHO0lBQUgsQ0FGYjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbInByb3ZpZGVyID0gcmVxdWlyZSAnLi9wcm92aWRlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT4gcHJvdmlkZXIubG9hZCgpXG5cbiAgZ2V0UHJvdmlkZXI6IC0+IHByb3ZpZGVyXG4iXX0=
