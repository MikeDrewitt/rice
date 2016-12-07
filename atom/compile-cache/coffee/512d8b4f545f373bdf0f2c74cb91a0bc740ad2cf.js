(function() {
  var FileIcons;

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
      var ref;
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
      if ((ref = this.fileIconsDisposable) != null) {
        ref.dispose();
      }
      this.stopLoadPathsTask();
      return this.active = false;
    },
    consumeFileIcons: function(service) {
      FileIcons.setService(service);
      return this.fileIconsDisposable = service.onWillDeactivate(function() {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL2Z1enp5LWZpbmRlci9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUMsS0FBRDtBQUNSLFVBQUE7TUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUNFO1FBQUEsaUNBQUEsRUFBbUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDakMsS0FBQyxDQUFBLGlCQUFELENBQUEsQ0FBb0IsQ0FBQyxNQUFyQixDQUFBO1VBRGlDO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQztRQUVBLG1DQUFBLEVBQXFDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ25DLEtBQUMsQ0FBQSxnQkFBRCxDQUFBLENBQW1CLENBQUMsTUFBcEIsQ0FBQTtVQURtQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGckM7UUFJQSx1Q0FBQSxFQUF5QyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUN2QyxLQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFzQixDQUFDLE1BQXZCLENBQUE7VUFEdUM7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSnpDO09BREY7TUFRQSxPQUFPLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGtCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7QUFFQTtBQUFBLFdBQUEscUNB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QUFDLFlBQUQ7VUFBQyxLQUFDLENBQUEsZUFBRDtRQUFEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjthQUNqQixJQUFDLENBQUEsd0JBQUQsR0FBNEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBYixDQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDeEQsS0FBQyxDQUFBLFlBQUQsR0FBZ0I7aUJBQ2hCLEtBQUMsQ0FBQSxpQkFBRCxDQUFBO1FBRndEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE5QjtJQVJWLENBbkVwQjtJQStFQSxpQkFBQSxFQUFtQixTQUFBO0FBQ2pCLFVBQUE7O1dBQXlCLENBQUUsT0FBM0IsQ0FBQTs7TUFDQSxJQUFDLENBQUEsd0JBQUQsR0FBNEI7O1lBQ2QsQ0FBRSxTQUFoQixDQUFBOzthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO0lBSkEsQ0EvRW5COztBQUhGIiwic291cmNlc0NvbnRlbnQiOlsiRmlsZUljb25zID0gcmVxdWlyZSAnLi9maWxlLWljb25zJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQGFjdGl2ZSA9IHRydWVcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnZnV6enktZmluZGVyOnRvZ2dsZS1maWxlLWZpbmRlcic6ID0+XG4gICAgICAgIEBjcmVhdGVQcm9qZWN0VmlldygpLnRvZ2dsZSgpXG4gICAgICAnZnV6enktZmluZGVyOnRvZ2dsZS1idWZmZXItZmluZGVyJzogPT5cbiAgICAgICAgQGNyZWF0ZUJ1ZmZlclZpZXcoKS50b2dnbGUoKVxuICAgICAgJ2Z1enp5LWZpbmRlcjp0b2dnbGUtZ2l0LXN0YXR1cy1maW5kZXInOiA9PlxuICAgICAgICBAY3JlYXRlR2l0U3RhdHVzVmlldygpLnRvZ2dsZSgpXG5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+IEBzdGFydExvYWRQYXRoc1Rhc2soKVxuXG4gICAgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICBlZGl0b3IubGFzdE9wZW5lZCA9IHN0YXRlW2VkaXRvci5nZXRQYXRoKCldXG5cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlUGFuZXMgKHBhbmUpIC0+XG4gICAgICBwYW5lLm9ic2VydmVBY3RpdmVJdGVtIChpdGVtKSAtPiBpdGVtPy5sYXN0T3BlbmVkID0gRGF0ZS5ub3coKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgaWYgQHByb2plY3RWaWV3P1xuICAgICAgQHByb2plY3RWaWV3LmRlc3Ryb3koKVxuICAgICAgQHByb2plY3RWaWV3ID0gbnVsbFxuICAgIGlmIEBidWZmZXJWaWV3P1xuICAgICAgQGJ1ZmZlclZpZXcuZGVzdHJveSgpXG4gICAgICBAYnVmZmVyVmlldyA9IG51bGxcbiAgICBpZiBAZ2l0U3RhdHVzVmlldz9cbiAgICAgIEBnaXRTdGF0dXNWaWV3LmRlc3Ryb3koKVxuICAgICAgQGdpdFN0YXR1c1ZpZXcgPSBudWxsXG4gICAgQHByb2plY3RQYXRocyA9IG51bGxcbiAgICBAZmlsZUljb25zRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG4gICAgQHN0b3BMb2FkUGF0aHNUYXNrKClcbiAgICBAYWN0aXZlID0gZmFsc2VcblxuICBjb25zdW1lRmlsZUljb25zOiAoc2VydmljZSkgLT5cbiAgICBGaWxlSWNvbnMuc2V0U2VydmljZShzZXJ2aWNlKVxuICAgIEBmaWxlSWNvbnNEaXNwb3NhYmxlID0gc2VydmljZS5vbldpbGxEZWFjdGl2YXRlIC0+XG4gICAgICBGaWxlSWNvbnMucmVzZXRTZXJ2aWNlKClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgcGF0aHMgPSB7fVxuICAgIGZvciBlZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuICAgICAgcGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIHBhdGhzW3BhdGhdID0gZWRpdG9yLmxhc3RPcGVuZWQgaWYgcGF0aD9cbiAgICBwYXRoc1xuXG4gIGNyZWF0ZVByb2plY3RWaWV3OiAtPlxuICAgIEBzdG9wTG9hZFBhdGhzVGFzaygpXG5cbiAgICB1bmxlc3MgQHByb2plY3RWaWV3P1xuICAgICAgUHJvamVjdFZpZXcgID0gcmVxdWlyZSAnLi9wcm9qZWN0LXZpZXcnXG4gICAgICBAcHJvamVjdFZpZXcgPSBuZXcgUHJvamVjdFZpZXcoQHByb2plY3RQYXRocylcbiAgICAgIEBwcm9qZWN0UGF0aHMgPSBudWxsXG4gICAgQHByb2plY3RWaWV3XG5cbiAgY3JlYXRlR2l0U3RhdHVzVmlldzogLT5cbiAgICB1bmxlc3MgQGdpdFN0YXR1c1ZpZXc/XG4gICAgICBHaXRTdGF0dXNWaWV3ICA9IHJlcXVpcmUgJy4vZ2l0LXN0YXR1cy12aWV3J1xuICAgICAgQGdpdFN0YXR1c1ZpZXcgPSBuZXcgR2l0U3RhdHVzVmlldygpXG4gICAgQGdpdFN0YXR1c1ZpZXdcblxuICBjcmVhdGVCdWZmZXJWaWV3OiAtPlxuICAgIHVubGVzcyBAYnVmZmVyVmlldz9cbiAgICAgIEJ1ZmZlclZpZXcgPSByZXF1aXJlICcuL2J1ZmZlci12aWV3J1xuICAgICAgQGJ1ZmZlclZpZXcgPSBuZXcgQnVmZmVyVmlldygpXG4gICAgQGJ1ZmZlclZpZXdcblxuICBzdGFydExvYWRQYXRoc1Rhc2s6IC0+XG4gICAgQHN0b3BMb2FkUGF0aHNUYXNrKClcblxuICAgIHJldHVybiB1bmxlc3MgQGFjdGl2ZVxuICAgIHJldHVybiBpZiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGggaXMgMFxuXG4gICAgUGF0aExvYWRlciA9IHJlcXVpcmUgJy4vcGF0aC1sb2FkZXInXG4gICAgQGxvYWRQYXRoc1Rhc2sgPSBQYXRoTG9hZGVyLnN0YXJ0VGFzayAoQHByb2plY3RQYXRocykgPT5cbiAgICBAcHJvamVjdFBhdGhzU3Vic2NyaXB0aW9uID0gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMgPT5cbiAgICAgIEBwcm9qZWN0UGF0aHMgPSBudWxsXG4gICAgICBAc3RvcExvYWRQYXRoc1Rhc2soKVxuXG4gIHN0b3BMb2FkUGF0aHNUYXNrOiAtPlxuICAgIEBwcm9qZWN0UGF0aHNTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBwcm9qZWN0UGF0aHNTdWJzY3JpcHRpb24gPSBudWxsXG4gICAgQGxvYWRQYXRoc1Rhc2s/LnRlcm1pbmF0ZSgpXG4gICAgQGxvYWRQYXRoc1Rhc2sgPSBudWxsXG4iXX0=
