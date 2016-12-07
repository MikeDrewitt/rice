(function() {
  var CSON, ScopedProperties;

  CSON = require('season');

  module.exports = ScopedProperties = (function() {
    ScopedProperties.load = function(scopedPropertiesPath, config, callback) {
      return CSON.readFile(scopedPropertiesPath, function(error, scopedProperties) {
        if (scopedProperties == null) {
          scopedProperties = {};
        }
        if (error != null) {
          return callback(error);
        } else {
          return callback(null, new ScopedProperties(scopedPropertiesPath, scopedProperties, config));
        }
      });
    };

    function ScopedProperties(path, scopedProperties1, config1) {
      this.path = path;
      this.scopedProperties = scopedProperties1;
      this.config = config1;
    }

    ScopedProperties.prototype.activate = function() {
      var properties, ref, selector;
      ref = this.scopedProperties;
      for (selector in ref) {
        properties = ref[selector];
        this.config.set(null, properties, {
          scopeSelector: selector,
          source: this.path
        });
      }
    };

    ScopedProperties.prototype.deactivate = function() {
      var selector;
      for (selector in this.scopedProperties) {
        this.config.unset(null, {
          scopeSelector: selector,
          source: this.path
        });
      }
    };

    return ScopedProperties;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zY29wZWQtcHJvcGVydGllcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osZ0JBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxvQkFBRCxFQUF1QixNQUF2QixFQUErQixRQUEvQjthQUNMLElBQUksQ0FBQyxRQUFMLENBQWMsb0JBQWQsRUFBb0MsU0FBQyxLQUFELEVBQVEsZ0JBQVI7O1VBQVEsbUJBQWlCOztRQUMzRCxJQUFHLGFBQUg7aUJBQ0UsUUFBQSxDQUFTLEtBQVQsRUFERjtTQUFBLE1BQUE7aUJBR0UsUUFBQSxDQUFTLElBQVQsRUFBbUIsSUFBQSxnQkFBQSxDQUFpQixvQkFBakIsRUFBdUMsZ0JBQXZDLEVBQXlELE1BQXpELENBQW5CLEVBSEY7O01BRGtDLENBQXBDO0lBREs7O0lBT00sMEJBQUMsSUFBRCxFQUFRLGlCQUFSLEVBQTJCLE9BQTNCO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFBTyxJQUFDLENBQUEsbUJBQUQ7TUFBbUIsSUFBQyxDQUFBLFNBQUQ7SUFBM0I7OytCQUViLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtBQUFBO0FBQUEsV0FBQSxlQUFBOztRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFZLElBQVosRUFBa0IsVUFBbEIsRUFBOEI7VUFBQSxhQUFBLEVBQWUsUUFBZjtVQUF5QixNQUFBLEVBQVEsSUFBQyxDQUFBLElBQWxDO1NBQTlCO0FBREY7SUFEUTs7K0JBS1YsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO0FBQUEsV0FBQSxpQ0FBQTtRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLElBQWQsRUFBb0I7VUFBQSxhQUFBLEVBQWUsUUFBZjtVQUF5QixNQUFBLEVBQVEsSUFBQyxDQUFBLElBQWxDO1NBQXBCO0FBREY7SUFEVTs7Ozs7QUFsQmQiLCJzb3VyY2VzQ29udGVudCI6WyJDU09OID0gcmVxdWlyZSAnc2Vhc29uJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTY29wZWRQcm9wZXJ0aWVzXG4gIEBsb2FkOiAoc2NvcGVkUHJvcGVydGllc1BhdGgsIGNvbmZpZywgY2FsbGJhY2spIC0+XG4gICAgQ1NPTi5yZWFkRmlsZSBzY29wZWRQcm9wZXJ0aWVzUGF0aCwgKGVycm9yLCBzY29wZWRQcm9wZXJ0aWVzPXt9KSAtPlxuICAgICAgaWYgZXJyb3I/XG4gICAgICAgIGNhbGxiYWNrKGVycm9yKVxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjayhudWxsLCBuZXcgU2NvcGVkUHJvcGVydGllcyhzY29wZWRQcm9wZXJ0aWVzUGF0aCwgc2NvcGVkUHJvcGVydGllcywgY29uZmlnKSlcblxuICBjb25zdHJ1Y3RvcjogKEBwYXRoLCBAc2NvcGVkUHJvcGVydGllcywgQGNvbmZpZykgLT5cblxuICBhY3RpdmF0ZTogLT5cbiAgICBmb3Igc2VsZWN0b3IsIHByb3BlcnRpZXMgb2YgQHNjb3BlZFByb3BlcnRpZXNcbiAgICAgIEBjb25maWcuc2V0KG51bGwsIHByb3BlcnRpZXMsIHNjb3BlU2VsZWN0b3I6IHNlbGVjdG9yLCBzb3VyY2U6IEBwYXRoKVxuICAgIHJldHVyblxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgZm9yIHNlbGVjdG9yIG9mIEBzY29wZWRQcm9wZXJ0aWVzXG4gICAgICBAY29uZmlnLnVuc2V0KG51bGwsIHNjb3BlU2VsZWN0b3I6IHNlbGVjdG9yLCBzb3VyY2U6IEBwYXRoKVxuICAgIHJldHVyblxuIl19
