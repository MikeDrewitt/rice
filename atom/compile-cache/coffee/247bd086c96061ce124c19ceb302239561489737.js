(function() {
  var TimecopView, ViewURI;

  TimecopView = null;

  ViewURI = 'atom://timecop';

  module.exports = {
    activate: function() {
      atom.workspace.addOpener((function(_this) {
        return function(filePath) {
          if (filePath === ViewURI) {
            return _this.createTimecopView({
              uri: ViewURI
            });
          }
        };
      })(this));
      return atom.commands.add('atom-workspace', 'timecop:view', function() {
        return atom.workspace.open(ViewURI);
      });
    },
    createTimecopView: function(state) {
      if (TimecopView == null) {
        TimecopView = require('./timecop-view');
      }
      return new TimecopView(state);
    }
  };

  if (parseFloat(atom.getVersion()) < 1.7) {
    atom.deserializers.add({
      name: 'TimecopView',
      deserialize: module.exports.createTimecopView.bind(module.exports)
    });
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90aW1lY29wL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsV0FBQSxHQUFjOztFQUNkLE9BQUEsR0FBVTs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7TUFDUixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQWYsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFFBQUQ7VUFDdkIsSUFBb0MsUUFBQSxLQUFZLE9BQWhEO21CQUFBLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQjtjQUFBLEdBQUEsRUFBSyxPQUFMO2FBQW5CLEVBQUE7O1FBRHVCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QjthQUdBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsY0FBcEMsRUFBb0QsU0FBQTtlQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsT0FBcEI7TUFEa0QsQ0FBcEQ7SUFKUSxDQUFWO0lBT0EsaUJBQUEsRUFBbUIsU0FBQyxLQUFEOztRQUNqQixjQUFlLE9BQUEsQ0FBUSxnQkFBUjs7YUFDWCxJQUFBLFdBQUEsQ0FBWSxLQUFaO0lBRmEsQ0FQbkI7OztFQVdGLElBQUcsVUFBQSxDQUFXLElBQUksQ0FBQyxVQUFMLENBQUEsQ0FBWCxDQUFBLEdBQWdDLEdBQW5DO0lBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFuQixDQUNFO01BQUEsSUFBQSxFQUFNLGFBQU47TUFDQSxXQUFBLEVBQWEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFqQyxDQUFzQyxNQUFNLENBQUMsT0FBN0MsQ0FEYjtLQURGLEVBREY7O0FBZkEiLCJzb3VyY2VzQ29udGVudCI6WyJUaW1lY29wVmlldyA9IG51bGxcblZpZXdVUkkgPSAnYXRvbTovL3RpbWVjb3AnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyIChmaWxlUGF0aCkgPT5cbiAgICAgIEBjcmVhdGVUaW1lY29wVmlldyh1cmk6IFZpZXdVUkkpIGlmIGZpbGVQYXRoIGlzIFZpZXdVUklcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICd0aW1lY29wOnZpZXcnLCAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihWaWV3VVJJKVxuXG4gIGNyZWF0ZVRpbWVjb3BWaWV3OiAoc3RhdGUpIC0+XG4gICAgVGltZWNvcFZpZXcgPz0gcmVxdWlyZSAnLi90aW1lY29wLXZpZXcnXG4gICAgbmV3IFRpbWVjb3BWaWV3KHN0YXRlKVxuXG5pZiBwYXJzZUZsb2F0KGF0b20uZ2V0VmVyc2lvbigpKSA8IDEuN1xuICBhdG9tLmRlc2VyaWFsaXplcnMuYWRkXG4gICAgbmFtZTogJ1RpbWVjb3BWaWV3J1xuICAgIGRlc2VyaWFsaXplOiBtb2R1bGUuZXhwb3J0cy5jcmVhdGVUaW1lY29wVmlldy5iaW5kKG1vZHVsZS5leHBvcnRzKVxuIl19
