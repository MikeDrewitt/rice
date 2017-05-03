(function() {
  var GitHubFile, getActivePath, getSelectedRange;

  GitHubFile = require('./github-file');

  module.exports = {
    activate: function() {
      return atom.commands.add('atom-pane', {
        'open-on-github:file': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).open(getSelectedRange());
          }
        },
        'open-on-github:file-on-master': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange());
          }
        },
        'open-on-github:blame': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).blame(getSelectedRange());
          }
        },
        'open-on-github:history': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).history();
          }
        },
        'open-on-github:issues': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).openIssues();
          }
        },
        'open-on-github:copy-url': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange());
          }
        },
        'open-on-github:branch-compare': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).openBranchCompare();
          }
        },
        'open-on-github:repository': function() {
          var itemPath;
          if (itemPath = getActivePath()) {
            return GitHubFile.fromPath(itemPath).openRepository();
          }
        }
      });
    }
  };

  getActivePath = function() {
    var ref;
    return (ref = atom.workspace.getActivePaneItem()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0;
  };

  getSelectedRange = function() {
    var ref;
    return (ref = atom.workspace.getActivePaneItem()) != null ? typeof ref.getSelectedBufferRange === "function" ? ref.getSelectedBufferRange() : void 0 : void 0;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9vcGVuLW9uLWdpdGh1Yi9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFVBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7RUFFZCxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7YUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsV0FBbEIsRUFDRTtRQUFBLHFCQUFBLEVBQXVCLFNBQUE7QUFDckIsY0FBQTtVQUFBLElBQUcsUUFBQSxHQUFXLGFBQUEsQ0FBQSxDQUFkO21CQUNFLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsZ0JBQUEsQ0FBQSxDQUFuQyxFQURGOztRQURxQixDQUF2QjtRQUlBLCtCQUFBLEVBQWlDLFNBQUE7QUFDL0IsY0FBQTtVQUFBLElBQUcsUUFBQSxHQUFXLGFBQUEsQ0FBQSxDQUFkO21CQUNFLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLENBQUMsWUFBOUIsQ0FBMkMsZ0JBQUEsQ0FBQSxDQUEzQyxFQURGOztRQUQrQixDQUpqQztRQVFBLHNCQUFBLEVBQXdCLFNBQUE7QUFDdEIsY0FBQTtVQUFBLElBQUcsUUFBQSxHQUFXLGFBQUEsQ0FBQSxDQUFkO21CQUNFLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLENBQUMsS0FBOUIsQ0FBb0MsZ0JBQUEsQ0FBQSxDQUFwQyxFQURGOztRQURzQixDQVJ4QjtRQVlBLHdCQUFBLEVBQTBCLFNBQUE7QUFDeEIsY0FBQTtVQUFBLElBQUcsUUFBQSxHQUFXLGFBQUEsQ0FBQSxDQUFkO21CQUNFLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLENBQUMsT0FBOUIsQ0FBQSxFQURGOztRQUR3QixDQVoxQjtRQWdCQSx1QkFBQSxFQUF5QixTQUFBO0FBQ3ZCLGNBQUE7VUFBQSxJQUFHLFFBQUEsR0FBVyxhQUFBLENBQUEsQ0FBZDttQkFDRSxVQUFVLENBQUMsUUFBWCxDQUFvQixRQUFwQixDQUE2QixDQUFDLFVBQTlCLENBQUEsRUFERjs7UUFEdUIsQ0FoQnpCO1FBb0JBLHlCQUFBLEVBQTJCLFNBQUE7QUFDekIsY0FBQTtVQUFBLElBQUcsUUFBQSxHQUFXLGFBQUEsQ0FBQSxDQUFkO21CQUNFLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLENBQUMsT0FBOUIsQ0FBc0MsZ0JBQUEsQ0FBQSxDQUF0QyxFQURGOztRQUR5QixDQXBCM0I7UUF3QkEsK0JBQUEsRUFBaUMsU0FBQTtBQUMvQixjQUFBO1VBQUEsSUFBRyxRQUFBLEdBQVcsYUFBQSxDQUFBLENBQWQ7bUJBQ0UsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsUUFBcEIsQ0FBNkIsQ0FBQyxpQkFBOUIsQ0FBQSxFQURGOztRQUQrQixDQXhCakM7UUE0QkEsMkJBQUEsRUFBNkIsU0FBQTtBQUMzQixjQUFBO1VBQUEsSUFBRyxRQUFBLEdBQVcsYUFBQSxDQUFBLENBQWQ7bUJBQ0UsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsUUFBcEIsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLEVBREY7O1FBRDJCLENBNUI3QjtPQURGO0lBRFEsQ0FBVjs7O0VBa0NGLGFBQUEsR0FBZ0IsU0FBQTtBQUNkLFFBQUE7dUdBQWtDLENBQUU7RUFEdEI7O0VBR2hCLGdCQUFBLEdBQW1CLFNBQUE7QUFDakIsUUFBQTtzSEFBa0MsQ0FBRTtFQURuQjtBQXhDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJHaXRIdWJGaWxlICA9IHJlcXVpcmUgJy4vZ2l0aHViLWZpbGUnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tcGFuZScsXG4gICAgICAnb3Blbi1vbi1naXRodWI6ZmlsZSc6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkub3BlbihnZXRTZWxlY3RlZFJhbmdlKCkpXG5cbiAgICAgICdvcGVuLW9uLWdpdGh1YjpmaWxlLW9uLW1hc3Rlcic6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkub3Blbk9uTWFzdGVyKGdldFNlbGVjdGVkUmFuZ2UoKSlcblxuICAgICAgJ29wZW4tb24tZ2l0aHViOmJsYW1lJzogLT5cbiAgICAgICAgaWYgaXRlbVBhdGggPSBnZXRBY3RpdmVQYXRoKClcbiAgICAgICAgICBHaXRIdWJGaWxlLmZyb21QYXRoKGl0ZW1QYXRoKS5ibGFtZShnZXRTZWxlY3RlZFJhbmdlKCkpXG5cbiAgICAgICdvcGVuLW9uLWdpdGh1YjpoaXN0b3J5JzogLT5cbiAgICAgICAgaWYgaXRlbVBhdGggPSBnZXRBY3RpdmVQYXRoKClcbiAgICAgICAgICBHaXRIdWJGaWxlLmZyb21QYXRoKGl0ZW1QYXRoKS5oaXN0b3J5KClcblxuICAgICAgJ29wZW4tb24tZ2l0aHViOmlzc3Vlcyc6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkub3Blbklzc3VlcygpXG5cbiAgICAgICdvcGVuLW9uLWdpdGh1Yjpjb3B5LXVybCc6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkuY29weVVybChnZXRTZWxlY3RlZFJhbmdlKCkpXG5cbiAgICAgICdvcGVuLW9uLWdpdGh1YjpicmFuY2gtY29tcGFyZSc6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkub3BlbkJyYW5jaENvbXBhcmUoKVxuXG4gICAgICAnb3Blbi1vbi1naXRodWI6cmVwb3NpdG9yeSc6IC0+XG4gICAgICAgIGlmIGl0ZW1QYXRoID0gZ2V0QWN0aXZlUGF0aCgpXG4gICAgICAgICAgR2l0SHViRmlsZS5mcm9tUGF0aChpdGVtUGF0aCkub3BlblJlcG9zaXRvcnkoKVxuXG5nZXRBY3RpdmVQYXRoID0gLT5cbiAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKT8uZ2V0UGF0aD8oKVxuXG5nZXRTZWxlY3RlZFJhbmdlID0gLT5cbiAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKT8uZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZT8oKVxuIl19
