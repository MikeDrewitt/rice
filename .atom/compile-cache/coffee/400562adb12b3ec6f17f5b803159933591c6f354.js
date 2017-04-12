(function() {
  var CompositeDisposable, Disposable, FileIcons, path, ref;

  ref = require('event-kit'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  path = require('path');

  FileIcons = require('./file-icons');

  module.exports = {
    treeView: null,
    activate: function(state) {
      var base;
      this.state = state;
      this.disposables = new CompositeDisposable;
      if (this.shouldAttach()) {
        if ((base = this.state).attached == null) {
          base.attached = true;
        }
      }
      if (this.state.attached) {
        this.createView();
      }
      return this.disposables.add(atom.commands.add('atom-workspace', {
        'tree-view:show': (function(_this) {
          return function() {
            return _this.createView().show();
          };
        })(this),
        'tree-view:toggle': (function(_this) {
          return function() {
            return _this.createView().toggle();
          };
        })(this),
        'tree-view:toggle-focus': (function(_this) {
          return function() {
            return _this.createView().toggleFocus();
          };
        })(this),
        'tree-view:reveal-active-file': (function(_this) {
          return function() {
            return _this.createView().revealActiveFile();
          };
        })(this),
        'tree-view:toggle-side': (function(_this) {
          return function() {
            return _this.createView().toggleSide();
          };
        })(this),
        'tree-view:add-file': (function(_this) {
          return function() {
            return _this.createView().add(true);
          };
        })(this),
        'tree-view:add-folder': (function(_this) {
          return function() {
            return _this.createView().add(false);
          };
        })(this),
        'tree-view:duplicate': (function(_this) {
          return function() {
            return _this.createView().copySelectedEntry();
          };
        })(this),
        'tree-view:remove': (function(_this) {
          return function() {
            return _this.createView().removeSelectedEntries();
          };
        })(this),
        'tree-view:rename': (function(_this) {
          return function() {
            return _this.createView().moveSelectedEntry();
          };
        })(this),
        'tree-view:show-current-file-in-file-manager': (function(_this) {
          return function() {
            return _this.createView().showCurrentFileInFileManager();
          };
        })(this)
      }));
    },
    deactivate: function() {
      var ref1, ref2;
      this.disposables.dispose();
      if ((ref1 = this.fileIconsDisposable) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.treeView) != null) {
        ref2.deactivate();
      }
      return this.treeView = null;
    },
    consumeFileIcons: function(service) {
      var ref1;
      FileIcons.setService(service);
      if ((ref1 = this.treeView) != null) {
        ref1.updateRoots();
      }
      return new Disposable((function(_this) {
        return function() {
          var ref2;
          FileIcons.resetService();
          return (ref2 = _this.treeView) != null ? ref2.updateRoots() : void 0;
        };
      })(this));
    },
    serialize: function() {
      if (this.treeView != null) {
        return this.treeView.serialize();
      } else {
        return this.state;
      }
    },
    createView: function() {
      var TreeView;
      if (this.treeView == null) {
        TreeView = require('./tree-view');
        this.treeView = new TreeView(this.state);
      }
      return this.treeView;
    },
    shouldAttach: function() {
      var projectPath, ref1;
      projectPath = (ref1 = atom.project.getPaths()[0]) != null ? ref1 : '';
      if (atom.workspace.getActivePaneItem()) {
        return false;
      } else if (path.basename(projectPath) === '.git') {
        return projectPath === atom.getLoadSettings().pathToOpen;
      } else {
        return true;
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsV0FBUixDQUFwQyxFQUFDLDJCQUFELEVBQWE7O0VBQ2IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFFQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQURTLElBQUMsQ0FBQSxRQUFEO01BQ1QsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQTJCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBM0I7O2NBQU0sQ0FBQyxXQUFZO1NBQW5COztNQUVBLElBQWlCLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBeEI7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O2FBRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0M7UUFDbkQsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxJQUFkLENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEaUM7UUFFbkQsa0JBQUEsRUFBb0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxNQUFkLENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGK0I7UUFHbkQs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QUFBLEtBQVYsRUFGbEI7O2FBR0EsSUFBQyxDQUFBO0lBSlMsQ0F6Q1o7SUErQ0EsWUFBQSxFQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsV0FBQSx3REFBMkM7TUFDM0MsSUFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFmLENBQUEsQ0FBSDtlQUNFLE1BREY7T0FBQSxNQUVLLElBQUcsSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkLENBQUEsS0FBOEIsTUFBakM7ZUFJSCxXQUFBLEtBQWUsSUFBSSxDQUFDLGVBQUwsQ0FBQSxDQUFzQixDQUFDLFdBSm5DO09BQUEsTUFBQTtlQU1ILEtBTkc7O0lBSk8sQ0EvQ2Q7O0FBTkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuRmlsZUljb25zID0gcmVxdWlyZSAnLi9maWxlLWljb25zJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHRyZWVWaWV3OiBudWxsXG5cbiAgYWN0aXZhdGU6IChAc3RhdGUpIC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3RhdGUuYXR0YWNoZWQgPz0gdHJ1ZSBpZiBAc2hvdWxkQXR0YWNoKClcblxuICAgIEBjcmVhdGVWaWV3KCkgaWYgQHN0YXRlLmF0dGFjaGVkXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHtcbiAgICAgICd0cmVlLXZpZXc6c2hvdyc6ID0+IEBjcmVhdGVWaWV3KCkuc2hvdygpXG4gICAgICAndHJlZS12aWV3OnRvZ2dsZSc6ID0+IEBjcmVhdGVWaWV3KCkudG9nZ2xlKClcbiAgICAgICd0cmVlLXZpZXc6dG9nZ2xlLWZvY3VzJzogPT4gQGNyZWF0ZVZpZXcoKS50b2dnbGVGb2N1cygpXG4gICAgICAndHJlZS12aWV3OnJldmVhbC1hY3RpdmUtZmlsZSc6ID0+IEBjcmVhdGVWaWV3KCkucmV2ZWFsQWN0aXZlRmlsZSgpXG4gICAgICAndHJlZS12aWV3OnRvZ2dsZS1zaWRlJzogPT4gQGNyZWF0ZVZpZXcoKS50b2dnbGVTaWRlKClcbiAgICAgICd0cmVlLXZpZXc6YWRkLWZpbGUnOiA9PiBAY3JlYXRlVmlldygpLmFkZCh0cnVlKVxuICAgICAgJ3RyZWUtdmlldzphZGQtZm9sZGVyJzogPT4gQGNyZWF0ZVZpZXcoKS5hZGQoZmFsc2UpXG4gICAgICAndHJlZS12aWV3OmR1cGxpY2F0ZSc6ID0+IEBjcmVhdGVWaWV3KCkuY29weVNlbGVjdGVkRW50cnkoKVxuICAgICAgJ3RyZWUtdmlldzpyZW1vdmUnOiA9PiBAY3JlYXRlVmlldygpLnJlbW92ZVNlbGVjdGVkRW50cmllcygpXG4gICAgICAndHJlZS12aWV3OnJlbmFtZSc6ID0+IEBjcmVhdGVWaWV3KCkubW92ZVNlbGVjdGVkRW50cnkoKVxuICAgICAgJ3RyZWUtdmlldzpzaG93LWN1cnJlbnQtZmlsZS1pbi1maWxlLW1hbmFnZXInOiA9PiBAY3JlYXRlVmlldygpLnNob3dDdXJyZW50RmlsZUluRmlsZU1hbmFnZXIoKVxuICAgIH0pXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGZpbGVJY29uc0Rpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgIEB0cmVlVmlldz8uZGVhY3RpdmF0ZSgpXG4gICAgQHRyZWVWaWV3ID0gbnVsbFxuXG4gIGNvbnN1bWVGaWxlSWNvbnM6IChzZXJ2aWNlKSAtPlxuICAgIEZpbGVJY29ucy5zZXRTZXJ2aWNlKHNlcnZpY2UpXG4gICAgQHRyZWVWaWV3Py51cGRhdGVSb290cygpXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuICAgICAgQHRyZWVWaWV3Py51cGRhdGVSb290cygpXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIGlmIEB0cmVlVmlldz9cbiAgICAgIEB0cmVlVmlldy5zZXJpYWxpemUoKVxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZVxuXG4gIGNyZWF0ZVZpZXc6IC0+XG4gICAgdW5sZXNzIEB0cmVlVmlldz9cbiAgICAgIFRyZWVWaWV3ID0gcmVxdWlyZSAnLi90cmVlLXZpZXcnXG4gICAgICBAdHJlZVZpZXcgPSBuZXcgVHJlZVZpZXcoQHN0YXRlKVxuICAgIEB0cmVlVmlld1xuXG4gIHNob3VsZEF0dGFjaDogLT5cbiAgICBwcm9qZWN0UGF0aCA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdID8gJydcbiAgICBpZiBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgICBmYWxzZVxuICAgIGVsc2UgaWYgcGF0aC5iYXNlbmFtZShwcm9qZWN0UGF0aCkgaXMgJy5naXQnXG4gICAgICAjIE9ubHkgYXR0YWNoIHdoZW4gdGhlIHByb2plY3QgcGF0aCBtYXRjaGVzIHRoZSBwYXRoIHRvIG9wZW4gc2lnbmlmeWluZ1xuICAgICAgIyB0aGUgLmdpdCBmb2xkZXIgd2FzIG9wZW5lZCBleHBsaWNpdGx5IGFuZCBub3QgYnkgdXNpbmcgQXRvbSBhcyB0aGUgR2l0XG4gICAgICAjIGVkaXRvci5cbiAgICAgIHByb2plY3RQYXRoIGlzIGF0b20uZ2V0TG9hZFNldHRpbmdzKCkucGF0aFRvT3BlblxuICAgIGVsc2VcbiAgICAgIHRydWVcbiJdfQ==
