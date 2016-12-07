(function() {
  var Disposable, FileIcons;

  Disposable = require('atom').Disposable;

  FileIcons = require('./file-icons');

  module.exports = {
    activate: function(state) {
      var editor, i, len, ref;
      this.active = true;
      atom.commands.add('atom-workspace', {
        'fuzzy-finder:toggle-file-finder': (function(_this) {
          return function() {
            return _this.createProjectView().toggle();
          };
        })(this),
        'fuzzy-finder:toggle-buffer-finder': (function(_this) {
          return function() {
            return _this.createBufferView().toggle();
          };
        })(this),
        'fuzzy-finder:toggle-git-status-finder': (function(_this) {
          return function() {
            return _this.createGitStatusView().toggle();
          };
        })(this)
      });
      process.nextTick((function(_this) {
        return function() {
          return _this.startLoadPathsTask();
        };
      })(this));
      ref = atom.workspace.getTextEditors();
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        editor.lastOpened = state[editor.getPath()];
      }
      return atom.workspace.observePanes(function(pane) {
        return pane.observeActiveItem(function(item) {
          return item != null ? item.lastOpened = Date.now() : void 0;
        });
      });
    },
    deactivate: function() {
      if (this.projectView != null) {
        this.projectView.destroy();
        this.projectView = null;
      }
      if (this.bufferView != null) {
        this.bufferView.destroy();
        this.bufferView = null;
      }
      if (this.gitStatusView != null) {
        this.gitStatusView.destroy();
        this.gitStatusView = null;
      }
      this.projectPaths = null;
      this.stopLoadPathsTask();
      return this.active = false;
    },
    consumeFileIcons: function(service) {
      FileIcons.setService(service);
      return new Disposable(function() {
        return FileIcons.resetService();
      });
    },
    serialize: function() {
      var editor, i, len, path, paths, ref;
      paths = {};
      ref = atom.workspace.getTextEditors();
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        path = editor.getPath();
        if (path != null) {
          paths[path] = editor.lastOpened;
        }
      }
      return paths;
    },
    createProjectView: function() {
      var ProjectView;
      this.stopLoadPathsTask();
      if (this.projectView == null) {
        ProjectView = require('./project-view');
        this.projectView = new ProjectView(this.projectPaths);
        this.projectPaths = null;
      }
      return this.projectView;
    },
    createGitStatusView: function() {
      var GitStatusView;
      if (this.gitStatusView == null) {
        GitStatusView = require('./git-status-view');
        this.gitStatusView = new GitStatusView();
      }
      return this.gitStatusView;
    },
    createBufferView: function() {
      var BufferView;
      if (this.bufferView == null) {
        BufferView = require('./buffer-view');
        this.bufferView = new BufferView();
      }
      return this.bufferView;
    },
    startLoadPathsTask: function() {
      var PathLoader;
      this.stopLoadPathsTask();
      if (!this.active) {
        return;
      }
      if (atom.project.getPaths().length === 0) {
        return;
      }
      PathLoader = require('./path-loader');
      this.loadPathsTask = PathLoader.startTask((function(_this) {
        return function(projectPaths) {
          _this.projectPaths = projectPaths;
        };
      })(this));
      return this.projectPathsSubscription = atom.project.onDidChangePaths((function(_this) {
        return function() {
          _this.projectPaths = null;
          return _this.stopLoadPathsTask();
        };
      })(this));
    },
    stopLoadPathsTask: function() {
      var ref, ref1;
      if ((ref = this.projectPathsSubscription) != null) {
        ref.dispose();
      }
      this.projectPathsSubscription = null;
      if ((ref1 = this.loadPathsTask) != null) {
        ref1.terminate();
      }
      return this.loadPathsTask = null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxhQUFjLE9BQUEsQ0FBUSxNQUFSOztFQUNmLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUMsS0FBRDtBQUNSLFVBQUE7TUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUNFO1FBQUEsaUNBQUEsRUFBbUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDakMsS0FBQyxDQUFBLGlCQUFELENBQUEsQ0FBb0IsQ0FBQyxNQUFyQixDQUFBO1VBRGlDO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQztRQUVBLG1DQUFBLEVBQXFDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ25DLEtBQUMsQ0FBQSxnQkFBRCxDQUFBLENBQW1CLENBQUMsTUFBcEIsQ0FBQTtVQURtQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGckM7UUFJQSx1Q0FBQSxFQUF5QyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUN2QyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFzQixDQUFDLE1BQXZCLENBQUE7VUFEdUM7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSnpDO09BREY7TUFRQSxPQUFPLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGtCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7QUFFQTtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsTUFBTSxDQUFDLFVBQVAsR0FBb0IsS0FBTSxDQUFBLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBQTtBQUQ1QjthQUdBLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBZixDQUE0QixTQUFDLElBQUQ7ZUFDMUIsSUFBSSxDQUFDLGlCQUFMLENBQXVCLFNBQUMsSUFBRDtnQ0FBVSxJQUFJLENBQUUsVUFBTixHQUFtQixJQUFJLENBQUMsR0FBTCxDQUFBO1FBQTdCLENBQXZCO01BRDBCLENBQTVCO0lBaEJRLENBQVY7SUFtQkEsVUFBQSxFQUFZLFNBQUE7TUFDVixJQUFHLHdCQUFIO1FBQ0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7UUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLEtBRmpCOztNQUdBLElBQUcsdUJBQUg7UUFDRSxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsS0FGaEI7O01BR0EsSUFBRywwQkFBSDtRQUNFLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO1FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsS0FGbkI7O01BR0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLGlCQUFELENBQUE7YUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBWkEsQ0FuQlo7SUFpQ0EsZ0JBQUEsRUFBa0IsU0FBQyxPQUFEO01BQ2hCLFNBQVMsQ0FBQyxVQUFWLENBQXFCLE9BQXJCO2FBQ0ksSUFBQSxVQUFBLENBQVcsU0FBQTtlQUNiLFNBQVMsQ0FBQyxZQUFWLENBQUE7TUFEYSxDQUFYO0lBRlksQ0FqQ2xCO0lBc0NBLFNBQUEsRUFBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLEtBQUEsR0FBUTtBQUNSO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxJQUFBLEdBQU8sTUFBTSxDQUFDLE9BQVAsQ0FBQTtRQUNQLElBQW1DLFlBQW5DO1VBQUEsS0FBTSxDQUFBLElBQUEsQ0FBTixHQUFjLE1BQU0sQ0FBQyxXQUFyQjs7QUFGRjthQUdBO0lBTFMsQ0F0Q1g7SUE2Q0EsaUJBQUEsRUFBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsSUFBQyxDQUFBLGlCQUFELENBQUE7TUFFQSxJQUFPLHdCQUFQO1FBQ0UsV0FBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjtRQUNmLElBQUMsQ0FBQSxXQUFELEdBQW1CLElBQUEsV0FBQSxDQUFZLElBQUMsQ0FBQSxZQUFiO1FBQ25CLElBQUMsQ0FBQSxZQUFELEdBQWdCLEtBSGxCOzthQUlBLElBQUMsQ0FBQTtJQVBnQixDQTdDbkI7SUFzREEsbUJBQUEsRUFBcUIsU0FBQTtBQUNuQixVQUFBO01BQUEsSUFBTywwQkFBUDtRQUNFLGFBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSO1FBQ2pCLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsYUFBQSxDQUFBLEVBRnZCOzthQUdBLElBQUMsQ0FBQTtJQUprQixDQXREckI7SUE0REEsZ0JBQUEsRUFBa0IsU0FBQTtBQUNoQixVQUFBO01BQUEsSUFBTyx1QkFBUDtRQUNFLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjtRQUNiLElBQUMsQ0FBQSxVQUFELEdBQWtCLElBQUEsVUFBQSxDQUFBLEVBRnBCOzthQUdBLElBQUMsQ0FBQTtJQUplLENBNURsQjtJQWtFQSxrQkFBQSxFQUFvQixTQUFBO0FBQ2xCLFVBQUE7TUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtNQUVBLElBQUEsQ0FBYyxJQUFDLENBQUEsTUFBZjtBQUFBLGVBQUE7O01BQ0EsSUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBQSxDQUF1QixDQUFDLE1BQXhCLEtBQWtDLENBQTVDO0FBQUEsZUFBQTs7TUFFQSxVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7TUFDYixJQUFDLENBQUEsYUFBRCxHQUFpQixVQUFVLENBQUMsU0FBWCxDQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsWUFBRDtVQUFDLEtBQUMsQ0FBQSxlQUFEO1FBQUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCO2FBQ2pCLElBQUMsQ0FBQSx3QkFBRCxHQUE0QixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFiLENBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN4RCxLQUFDLENBQUEsWUFBRCxHQUFnQjtpQkFDaEIsS0FBQyxDQUFBLGlCQUFELENBQUE7UUFGd0Q7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBUlYsQ0FsRXBCO0lBOEVBLGlCQUFBLEVBQW1CLFNBQUE7QUFDakIsVUFBQTs7V0FBeUIsQ0FBRSxPQUEzQixDQUFBOztNQUNBLElBQUMsQ0FBQSx3QkFBRCxHQUE0Qjs7WUFDZCxDQUFFLFNBQWhCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUI7SUFKQSxDQTlFbkI7O0FBSkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuRmlsZUljb25zID0gcmVxdWlyZSAnLi9maWxlLWljb25zJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQGFjdGl2ZSA9IHRydWVcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnZnV6enktZmluZGVyOnRvZ2dsZS1maWxlLWZpbmRlcic6ID0+XG4gICAgICAgIEBjcmVhdGVQcm9qZWN0VmlldygpLnRvZ2dsZSgpXG4gICAgICAnZnV6enktZmluZGVyOnRvZ2dsZS1idWZmZXItZmluZGVyJzogPT5cbiAgICAgICAgQGNyZWF0ZUJ1ZmZlclZpZXcoKS50b2dnbGUoKVxuICAgICAgJ2Z1enp5LWZpbmRlcjp0b2dnbGUtZ2l0LXN0YXR1cy1maW5kZXInOiA9PlxuICAgICAgICBAY3JlYXRlR2l0U3RhdHVzVmlldygpLnRvZ2dsZSgpXG5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+IEBzdGFydExvYWRQYXRoc1Rhc2soKVxuXG4gICAgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICBlZGl0b3IubGFzdE9wZW5lZCA9IHN0YXRlW2VkaXRvci5nZXRQYXRoKCldXG5cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlUGFuZXMgKHBhbmUpIC0+XG4gICAgICBwYW5lLm9ic2VydmVBY3RpdmVJdGVtIChpdGVtKSAtPiBpdGVtPy5sYXN0T3BlbmVkID0gRGF0ZS5ub3coKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgaWYgQHByb2plY3RWaWV3P1xuICAgICAgQHByb2plY3RWaWV3LmRlc3Ryb3koKVxuICAgICAgQHByb2plY3RWaWV3ID0gbnVsbFxuICAgIGlmIEBidWZmZXJWaWV3P1xuICAgICAgQGJ1ZmZlclZpZXcuZGVzdHJveSgpXG4gICAgICBAYnVmZmVyVmlldyA9IG51bGxcbiAgICBpZiBAZ2l0U3RhdHVzVmlldz9cbiAgICAgIEBnaXRTdGF0dXNWaWV3LmRlc3Ryb3koKVxuICAgICAgQGdpdFN0YXR1c1ZpZXcgPSBudWxsXG4gICAgQHByb2plY3RQYXRocyA9IG51bGxcbiAgICBAc3RvcExvYWRQYXRoc1Rhc2soKVxuICAgIEBhY3RpdmUgPSBmYWxzZVxuXG4gIGNvbnN1bWVGaWxlSWNvbnM6IChzZXJ2aWNlKSAtPlxuICAgIEZpbGVJY29ucy5zZXRTZXJ2aWNlKHNlcnZpY2UpXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBwYXRocyA9IHt9XG4gICAgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICBwYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgcGF0aHNbcGF0aF0gPSBlZGl0b3IubGFzdE9wZW5lZCBpZiBwYXRoP1xuICAgIHBhdGhzXG5cbiAgY3JlYXRlUHJvamVjdFZpZXc6IC0+XG4gICAgQHN0b3BMb2FkUGF0aHNUYXNrKClcblxuICAgIHVubGVzcyBAcHJvamVjdFZpZXc/XG4gICAgICBQcm9qZWN0VmlldyAgPSByZXF1aXJlICcuL3Byb2plY3QtdmlldydcbiAgICAgIEBwcm9qZWN0VmlldyA9IG5ldyBQcm9qZWN0VmlldyhAcHJvamVjdFBhdGhzKVxuICAgICAgQHByb2plY3RQYXRocyA9IG51bGxcbiAgICBAcHJvamVjdFZpZXdcblxuICBjcmVhdGVHaXRTdGF0dXNWaWV3OiAtPlxuICAgIHVubGVzcyBAZ2l0U3RhdHVzVmlldz9cbiAgICAgIEdpdFN0YXR1c1ZpZXcgID0gcmVxdWlyZSAnLi9naXQtc3RhdHVzLXZpZXcnXG4gICAgICBAZ2l0U3RhdHVzVmlldyA9IG5ldyBHaXRTdGF0dXNWaWV3KClcbiAgICBAZ2l0U3RhdHVzVmlld1xuXG4gIGNyZWF0ZUJ1ZmZlclZpZXc6IC0+XG4gICAgdW5sZXNzIEBidWZmZXJWaWV3P1xuICAgICAgQnVmZmVyVmlldyA9IHJlcXVpcmUgJy4vYnVmZmVyLXZpZXcnXG4gICAgICBAYnVmZmVyVmlldyA9IG5ldyBCdWZmZXJWaWV3KClcbiAgICBAYnVmZmVyVmlld1xuXG4gIHN0YXJ0TG9hZFBhdGhzVGFzazogLT5cbiAgICBAc3RvcExvYWRQYXRoc1Rhc2soKVxuXG4gICAgcmV0dXJuIHVubGVzcyBAYWN0aXZlXG4gICAgcmV0dXJuIGlmIGF0b20ucHJvamVjdC5nZXRQYXRocygpLmxlbmd0aCBpcyAwXG5cbiAgICBQYXRoTG9hZGVyID0gcmVxdWlyZSAnLi9wYXRoLWxvYWRlcidcbiAgICBAbG9hZFBhdGhzVGFzayA9IFBhdGhMb2FkZXIuc3RhcnRUYXNrIChAcHJvamVjdFBhdGhzKSA9PlxuICAgIEBwcm9qZWN0UGF0aHNTdWJzY3JpcHRpb24gPSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQHByb2plY3RQYXRocyA9IG51bGxcbiAgICAgIEBzdG9wTG9hZFBhdGhzVGFzaygpXG5cbiAgc3RvcExvYWRQYXRoc1Rhc2s6IC0+XG4gICAgQHByb2plY3RQYXRoc1N1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHByb2plY3RQYXRoc1N1YnNjcmlwdGlvbiA9IG51bGxcbiAgICBAbG9hZFBhdGhzVGFzaz8udGVybWluYXRlKClcbiAgICBAbG9hZFBhdGhzVGFzayA9IG51bGxcbiJdfQ==
