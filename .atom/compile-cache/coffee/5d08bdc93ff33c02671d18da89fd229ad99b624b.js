(function() {
  var provider;

  provider = require('./provider');

  module.exports = {
    activate: function() {
      return provider.loadProperties();
    },
    getProvider: function() {
      return provider;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtY3NzL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTthQUFHLFFBQVEsQ0FBQyxjQUFULENBQUE7SUFBSCxDQUFWO0lBRUEsV0FBQSxFQUFhLFNBQUE7YUFBRztJQUFILENBRmI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJwcm92aWRlciA9IHJlcXVpcmUgJy4vcHJvdmlkZXInXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+IHByb3ZpZGVyLmxvYWRQcm9wZXJ0aWVzKClcblxuICBnZXRQcm92aWRlcjogLT4gcHJvdmlkZXJcbiJdfQ==
