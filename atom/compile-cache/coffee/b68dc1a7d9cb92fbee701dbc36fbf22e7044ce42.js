(function() {
  module.exports = {
    config: {
      distractionFree: {
        type: 'object',
        properties: {
          hideFiles: {
            title: 'Tree View',
            description: 'Reduces the opacity of collapsed folders and files',
            type: 'boolean',
            "default": true
          },
          hideTabs: {
            title: 'Tabs',
            description: 'Reduces the opacity of idle tabs',
            type: 'boolean',
            "default": true
          },
          hideBottom: {
            title: 'Status Bar',
            description: 'Reduces the opacity of idle status bar',
            type: 'boolean',
            "default": true
          },
          hideSpotified: {
            title: 'Spotified Package',
            description: 'Reduces the opacity of Spotified package',
            type: 'boolean',
            "default": false
          }
        }
      },
      treeView: {
        type: 'object',
        properties: {
          toggleHovers: {
            title: 'Toggle Tree Item Hover Effect',
            description: 'Adds a rollover hover effect to files/folders in tree view',
            type: 'boolean',
            "default": true
          }
        }
      }
    },
    activate: function(state) {
      return atom.themes.onDidChangeActiveThemes(function() {
        var Config;
        Config = require('./config');
        return Config.apply();
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9nZW5lc2lzLXVpL2xpYi9zZXR0aW5ncy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNJO0lBQUEsTUFBQSxFQUNJO01BQUEsZUFBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxVQUFBLEVBQ0k7VUFBQSxTQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sV0FBUDtZQUNBLFdBQUEsRUFBYSxvREFEYjtZQUVBLElBQUEsRUFBTSxTQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUhUO1dBREo7VUFLQSxRQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sTUFBUDtZQUNBLFdBQUEsRUFBYSxrQ0FEYjtZQUVBLElBQUEsRUFBTSxTQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUhUO1dBTko7VUFVQSxVQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sWUFBUDtZQUNBLFdBQUEsRUFBYSx3Q0FEYjtZQUVBLElBQUEsRUFBTSxTQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUhUO1dBWEo7VUFlQSxhQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sbUJBQVA7WUFDQSxXQUFBLEVBQWEsMENBRGI7WUFFQSxJQUFBLEVBQU0sU0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FIVDtXQWhCSjtTQUZKO09BREo7TUF1QkEsUUFBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxVQUFBLEVBQ0k7VUFBQSxZQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sK0JBQVA7WUFDQSxXQUFBLEVBQWEsNERBRGI7WUFFQSxJQUFBLEVBQU0sU0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFIVDtXQURKO1NBRko7T0F4Qko7S0FESjtJQWlDQSxRQUFBLEVBQVUsU0FBQyxLQUFEO2FBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBWixDQUFvQyxTQUFBO0FBQ2hDLFlBQUE7UUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7ZUFDVCxNQUFNLENBQUMsS0FBUCxDQUFBO01BRmdDLENBQXBDO0lBRE0sQ0FqQ1Y7O0FBREoiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gICAgY29uZmlnOlxuICAgICAgICBkaXN0cmFjdGlvbkZyZWU6XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0J1xuICAgICAgICAgICAgcHJvcGVydGllczpcbiAgICAgICAgICAgICAgICBoaWRlRmlsZXM6XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVHJlZSBWaWV3J1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JlZHVjZXMgdGhlIG9wYWNpdHkgb2YgY29sbGFwc2VkIGZvbGRlcnMgYW5kIGZpbGVzJ1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgIGhpZGVUYWJzOlxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1RhYnMnXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVkdWNlcyB0aGUgb3BhY2l0eSBvZiBpZGxlIHRhYnMnXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgaGlkZUJvdHRvbTpcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdTdGF0dXMgQmFyJ1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JlZHVjZXMgdGhlIG9wYWNpdHkgb2YgaWRsZSBzdGF0dXMgYmFyJ1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgIGhpZGVTcG90aWZpZWQ6XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnU3BvdGlmaWVkIFBhY2thZ2UnXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVkdWNlcyB0aGUgb3BhY2l0eSBvZiBTcG90aWZpZWQgcGFja2FnZSdcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgIHRyZWVWaWV3OlxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgICAgICAgIHByb3BlcnRpZXM6XG4gICAgICAgICAgICAgICAgdG9nZ2xlSG92ZXJzOlxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1RvZ2dsZSBUcmVlIEl0ZW0gSG92ZXIgRWZmZWN0J1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FkZHMgYSByb2xsb3ZlciBob3ZlciBlZmZlY3QgdG8gZmlsZXMvZm9sZGVycyBpbiB0cmVlIHZpZXcnXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG5cbiAgICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgICAgICBhdG9tLnRoZW1lcy5vbkRpZENoYW5nZUFjdGl2ZVRoZW1lcyAtPlxuICAgICAgICAgICAgQ29uZmlnID0gcmVxdWlyZSAnLi9jb25maWcnXG4gICAgICAgICAgICBDb25maWcuYXBwbHkoKSJdfQ==
