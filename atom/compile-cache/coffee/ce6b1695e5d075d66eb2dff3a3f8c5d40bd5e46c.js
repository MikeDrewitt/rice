(function() {
  var $, CompositeDisposable, Disposable, FuzzyFinderView, PathLoader, ProjectView, humanize, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  $ = require('atom-space-pen-views').$;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  humanize = require('humanize-plus');

  FuzzyFinderView = require('./fuzzy-finder-view');

  PathLoader = require('./path-loader');

  module.exports = ProjectView = (function(superClass) {
    extend(ProjectView, superClass);

    function ProjectView() {
      return ProjectView.__super__.constructor.apply(this, arguments);
    }

    ProjectView.prototype.paths = null;

    ProjectView.prototype.reloadPaths = true;

    ProjectView.prototype.reloadAfterFirstLoad = false;

    ProjectView.prototype.initialize = function(paths1) {
      var ref1, windowFocused;
      this.paths = paths1;
      ProjectView.__super__.initialize.apply(this, arguments);
      this.disposables = new CompositeDisposable;
      if (((ref1 = this.paths) != null ? ref1.length : void 0) > 0) {
        this.reloadPaths = false;
      }
      windowFocused = (function(_this) {
        return function() {
          if (_this.paths != null) {
            return _this.reloadPaths = true;
          } else {
            return _this.reloadAfterFirstLoad = true;
          }
        };
      })(this);
      window.addEventListener('focus', windowFocused);
      this.disposables.add(new Disposable(function() {
        return window.removeEventListener('focus', windowFocused);
      }));
      this.subscribeToConfig();
      return this.disposables.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          _this.reloadPaths = true;
          return _this.paths = null;
        };
      })(this)));
    };

    ProjectView.prototype.subscribeToConfig = function() {
      this.disposables.add(atom.config.onDidChange('fuzzy-finder.ignoredNames', (function(_this) {
        return function() {
          return _this.reloadPaths = true;
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('core.followSymlinks', (function(_this) {
        return function() {
          return _this.reloadPaths = true;
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('core.ignoredNames', (function(_this) {
        return function() {
          return _this.reloadPaths = true;
        };
      })(this)));
      return this.disposables.add(atom.config.onDidChange('core.excludeVcsIgnoredPaths', (function(_this) {
        return function() {
          return _this.reloadPaths = true;
        };
      })(this)));
    };

    ProjectView.prototype.toggle = function() {
      var ref1;
      if ((ref1 = this.panel) != null ? ref1.isVisible() : void 0) {
        return this.cancel();
      } else {
        this.populate();
        return this.show();
      }
    };

    ProjectView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'Project is empty';
      } else {
        return ProjectView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    ProjectView.prototype.populate = function() {
      var error, pathsFound, task;
      if (this.paths != null) {
        this.setItems(this.paths);
      }
      if (atom.project.getPaths().length === 0) {
        this.setItems([]);
        return;
      }
      if (this.reloadPaths) {
        this.reloadPaths = false;
        try {
          task = this.runLoadPathsTask((function(_this) {
            return function() {
              if (_this.reloadAfterFirstLoad) {
                _this.reloadPaths = true;
                _this.reloadAfterFirstLoad = false;
              }
              return _this.populate();
            };
          })(this));
        } catch (error1) {
          error = error1;
          if (error.code === 'ENOENT' || error.code === 'EPERM') {
            atom.notifications.addError('Project path not found!', {
              detail: error.message
            });
          } else {
            throw error;
          }
        }
        if (this.paths != null) {
          return this.setLoading("Reindexing project\u2026");
        } else {
          this.setLoading("Indexing project\u2026");
          this.loadingBadge.text('0');
          pathsFound = 0;
          return task != null ? task.on('load-paths:paths-found', (function(_this) {
            return function(paths) {
              pathsFound += paths.length;
              return _this.loadingBadge.text(humanize.intComma(pathsFound));
            };
          })(this)) : void 0;
        }
      }
    };

    ProjectView.prototype.projectRelativePathsForFilePaths = function() {
      var entry, filePath, i, index, lastOpenedPath, len, projectRelativePaths;
      projectRelativePaths = ProjectView.__super__.projectRelativePathsForFilePaths.apply(this, arguments);
      if (lastOpenedPath = this.getLastOpenedPath()) {
        for (index = i = 0, len = projectRelativePaths.length; i < len; index = ++i) {
          filePath = projectRelativePaths[index].filePath;
          if (filePath === lastOpenedPath) {
            entry = projectRelativePaths.splice(index, 1)[0];
            projectRelativePaths.unshift(entry);
            break;
          }
        }
      }
      return projectRelativePaths;
    };

    ProjectView.prototype.getLastOpenedPath = function() {
      var activePath, editor, filePath, i, lastOpenedEditor, len, ref1, ref2;
      activePath = (ref1 = atom.workspace.getActivePaneItem()) != null ? typeof ref1.getPath === "function" ? ref1.getPath() : void 0 : void 0;
      lastOpenedEditor = null;
      ref2 = atom.workspace.getTextEditors();
      for (i = 0, len = ref2.length; i < len; i++) {
        editor = ref2[i];
        filePath = editor.getPath();
        if (!filePath) {
          continue;
        }
        if (activePath === filePath) {
          continue;
        }
        if (lastOpenedEditor == null) {
          lastOpenedEditor = editor;
        }
        if (editor.lastOpened > lastOpenedEditor.lastOpened) {
          lastOpenedEditor = editor;
        }
      }
      return lastOpenedEditor != null ? lastOpenedEditor.getPath() : void 0;
    };

    ProjectView.prototype.destroy = function() {
      var ref1;
      if ((ref1 = this.loadPathsTask) != null) {
        ref1.terminate();
      }
      this.disposables.dispose();
      return ProjectView.__super__.destroy.apply(this, arguments);
    };

    ProjectView.prototype.runLoadPathsTask = function(fn) {
      var ref1;
      if ((ref1 = this.loadPathsTask) != null) {
        ref1.terminate();
      }
      return this.loadPathsTask = PathLoader.startTask((function(_this) {
        return function(paths1) {
          _this.paths = paths1;
          _this.reloadPaths = false;
          return typeof fn === "function" ? fn() : void 0;
        };
      })(this));
    };

    return ProjectView;

  })(FuzzyFinderView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL3Byb2plY3Qtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJGQUFBO0lBQUE7OztFQUFDLElBQUssT0FBQSxDQUFRLHNCQUFSOztFQUNOLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixRQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0VBRVgsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBQ2xCLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzBCQUNKLEtBQUEsR0FBTzs7MEJBQ1AsV0FBQSxHQUFhOzswQkFDYixvQkFBQSxHQUFzQjs7MEJBRXRCLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLFFBQUQ7TUFDWCw2Q0FBQSxTQUFBO01BRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLHVDQUE4QixDQUFFLGdCQUFSLEdBQWlCLENBQXpDO1FBQUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxNQUFmOztNQUVBLGFBQUEsR0FBZ0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ2QsSUFBRyxtQkFBSDttQkFDRSxLQUFDLENBQUEsV0FBRCxHQUFlLEtBRGpCO1dBQUEsTUFBQTttQkFLRSxLQUFDLENBQUEsb0JBQUQsR0FBd0IsS0FMMUI7O1FBRGM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BUWhCLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQyxhQUFqQztNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFxQixJQUFBLFVBQUEsQ0FB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O0FBRW5CO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxRQUFBLEdBQVcsTUFBTSxDQUFDLE9BQVAsQ0FBQTtRQUNYLElBQUEsQ0FBZ0IsUUFBaEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFZLFVBQUEsS0FBYyxRQUExQjtBQUFBLG1CQUFBOzs7VUFFQSxtQkFBb0I7O1FBQ3BCLElBQUcsTUFBTSxDQUFDLFVBQVAsR0FBb0IsZ0JBQWdCLENBQUMsVUFBeEM7VUFDRSxnQkFBQSxHQUFtQixPQURyQjs7QUFORjt3Q0FTQSxnQkFBZ0IsQ0FBRSxPQUFsQixDQUFBO0lBZGlCOzswQkFnQm5CLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTs7WUFBYyxDQUFFLFNBQWhCLENBQUE7O01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7YUFDQSwwQ0FBQSxTQUFBO0lBSE87OzBCQUtULGdCQUFBLEdBQWtCLFNBQUMsRUFBRDtBQUNoQixVQUFBOztZQUFjLENBQUUsU0FBaEIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixVQUFVLENBQUMsU0FBWCxDQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtVQUFDLEtBQUMsQ0FBQSxRQUFEO1VBQ3JDLEtBQUMsQ0FBQSxXQUFELEdBQWU7NENBQ2Y7UUFGb0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCO0lBRkQ7Ozs7S0E1SE07QUFSMUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7JH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5odW1hbml6ZSA9IHJlcXVpcmUgJ2h1bWFuaXplLXBsdXMnXG5cbkZ1enp5RmluZGVyVmlldyA9IHJlcXVpcmUgJy4vZnV6enktZmluZGVyLXZpZXcnXG5QYXRoTG9hZGVyID0gcmVxdWlyZSAnLi9wYXRoLWxvYWRlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUHJvamVjdFZpZXcgZXh0ZW5kcyBGdXp6eUZpbmRlclZpZXdcbiAgcGF0aHM6IG51bGxcbiAgcmVsb2FkUGF0aHM6IHRydWVcbiAgcmVsb2FkQWZ0ZXJGaXJzdExvYWQ6IGZhbHNlXG5cbiAgaW5pdGlhbGl6ZTogKEBwYXRocykgLT5cbiAgICBzdXBlclxuXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAcmVsb2FkUGF0aHMgPSBmYWxzZSBpZiBAcGF0aHM/Lmxlbmd0aCA+IDBcblxuICAgIHdpbmRvd0ZvY3VzZWQgPSA9PlxuICAgICAgaWYgQHBhdGhzP1xuICAgICAgICBAcmVsb2FkUGF0aHMgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgICMgVGhlIHdpbmRvdyBnYWluZWQgZm9jdXNlZCB3aGlsZSB0aGUgZmlyc3QgdGFzayB3YXMgc3RpbGwgcnVubmluZ1xuICAgICAgICAjIHNvIGxldCBpdCBjb21wbGV0ZSBidXQgcmVsb2FkIHRoZSBwYXRocyBvbiB0aGUgbmV4dCBwb3B1bGF0ZSBjYWxsLlxuICAgICAgICBAcmVsb2FkQWZ0ZXJGaXJzdExvYWQgPSB0cnVlXG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB3aW5kb3dGb2N1c2VkKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgbmV3IERpc3Bvc2FibGUgLT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgd2luZG93Rm9jdXNlZClcblxuICAgIEBzdWJzY3JpYmVUb0NvbmZpZygpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzID0+XG4gICAgICBAcmVsb2FkUGF0aHMgPSB0cnVlXG4gICAgICBAcGF0aHMgPSBudWxsXG5cbiAgc3Vic2NyaWJlVG9Db25maWc6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZnV6enktZmluZGVyLmlnbm9yZWROYW1lcycsID0+XG4gICAgICBAcmVsb2FkUGF0aHMgPSB0cnVlXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdjb3JlLmZvbGxvd1N5bWxpbmtzJywgPT5cbiAgICAgIEByZWxvYWRQYXRocyA9IHRydWVcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2NvcmUuaWdub3JlZE5hbWVzJywgPT5cbiAgICAgIEByZWxvYWRQYXRocyA9IHRydWVcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2NvcmUuZXhjbHVkZVZjc0lnbm9yZWRQYXRocycsID0+XG4gICAgICBAcmVsb2FkUGF0aHMgPSB0cnVlXG5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIEBwYW5lbD8uaXNWaXNpYmxlKClcbiAgICAgIEBjYW5jZWwoKVxuICAgIGVsc2VcbiAgICAgIEBwb3B1bGF0ZSgpXG4gICAgICBAc2hvdygpXG5cbiAgZ2V0RW1wdHlNZXNzYWdlOiAoaXRlbUNvdW50KSAtPlxuICAgIGlmIGl0ZW1Db3VudCBpcyAwXG4gICAgICAnUHJvamVjdCBpcyBlbXB0eSdcbiAgICBlbHNlXG4gICAgICBzdXBlclxuXG4gIHBvcHVsYXRlOiAtPlxuICAgIEBzZXRJdGVtcyhAcGF0aHMpIGlmIEBwYXRocz9cblxuICAgIGlmIGF0b20ucHJvamVjdC5nZXRQYXRocygpLmxlbmd0aCBpcyAwXG4gICAgICBAc2V0SXRlbXMoW10pXG4gICAgICByZXR1cm5cblxuICAgIGlmIEByZWxvYWRQYXRoc1xuICAgICAgQHJlbG9hZFBhdGhzID0gZmFsc2VcblxuICAgICAgdHJ5XG4gICAgICAgIHRhc2sgPSBAcnVuTG9hZFBhdGhzVGFzayA9PlxuICAgICAgICAgIGlmIEByZWxvYWRBZnRlckZpcnN0TG9hZFxuICAgICAgICAgICAgQHJlbG9hZFBhdGhzID0gdHJ1ZVxuICAgICAgICAgICAgQHJlbG9hZEFmdGVyRmlyc3RMb2FkID0gZmFsc2VcbiAgICAgICAgICBAcG9wdWxhdGUoKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgIyBJZiwgZm9yIGV4YW1wbGUsIGEgbmV0d29yayBkcml2ZSBpcyB1bm1vdW50ZWQsIEBydW5Mb2FkUGF0aHNUYXNrIHdpbGxcbiAgICAgICAgIyB0aHJvdyBFTk9FTlQgd2hlbiBpdCB0cmllcyB0byBnZXQgdGhlIHJlYWxwYXRoIG9mIGFsbCB0aGUgcHJvamVjdCBwYXRocy5cbiAgICAgICAgIyBUaGlzIGNhdGNoIGJsb2NrIGFsbG93cyB0aGUgZmlsZSBmaW5kZXIgdG8gc3RpbGwgb3BlcmF0ZSBvbiB0aGUgbGFzdFxuICAgICAgICAjIHNldCBvZiBwYXRocyBhbmQgc3RpbGwgbGV0IHRoZSB1c2VyIGtub3cgdGhhdCBzb21ldGhpbmcgaXMgd3JvbmcuXG4gICAgICAgIGlmIGVycm9yLmNvZGUgaXMgJ0VOT0VOVCcgb3IgZXJyb3IuY29kZSBpcyAnRVBFUk0nXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdQcm9qZWN0IHBhdGggbm90IGZvdW5kIScsIGRldGFpbDogZXJyb3IubWVzc2FnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRocm93IGVycm9yXG5cblxuICAgICAgaWYgQHBhdGhzP1xuICAgICAgICBAc2V0TG9hZGluZyhcIlJlaW5kZXhpbmcgcHJvamVjdFxcdTIwMjZcIilcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldExvYWRpbmcoXCJJbmRleGluZyBwcm9qZWN0XFx1MjAyNlwiKVxuICAgICAgICBAbG9hZGluZ0JhZGdlLnRleHQoJzAnKVxuICAgICAgICBwYXRoc0ZvdW5kID0gMFxuICAgICAgICB0YXNrPy5vbiAnbG9hZC1wYXRoczpwYXRocy1mb3VuZCcsIChwYXRocykgPT5cbiAgICAgICAgICBwYXRoc0ZvdW5kICs9IHBhdGhzLmxlbmd0aFxuICAgICAgICAgIEBsb2FkaW5nQmFkZ2UudGV4dChodW1hbml6ZS5pbnRDb21tYShwYXRoc0ZvdW5kKSlcblxuICBwcm9qZWN0UmVsYXRpdmVQYXRoc0ZvckZpbGVQYXRoczogLT5cbiAgICBwcm9qZWN0UmVsYXRpdmVQYXRocyA9IHN1cGVyXG5cbiAgICBpZiBsYXN0T3BlbmVkUGF0aCA9IEBnZXRMYXN0T3BlbmVkUGF0aCgpXG4gICAgICBmb3Ige2ZpbGVQYXRofSwgaW5kZXggaW4gcHJvamVjdFJlbGF0aXZlUGF0aHNcbiAgICAgICAgaWYgZmlsZVBhdGggaXMgbGFzdE9wZW5lZFBhdGhcbiAgICAgICAgICBbZW50cnldID0gcHJvamVjdFJlbGF0aXZlUGF0aHMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgIHByb2plY3RSZWxhdGl2ZVBhdGhzLnVuc2hpZnQoZW50cnkpXG4gICAgICAgICAgYnJlYWtcblxuICAgIHByb2plY3RSZWxhdGl2ZVBhdGhzXG5cbiAgZ2V0TGFzdE9wZW5lZFBhdGg6IC0+XG4gICAgYWN0aXZlUGF0aCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk/LmdldFBhdGg/KClcblxuICAgIGxhc3RPcGVuZWRFZGl0b3IgPSBudWxsXG5cbiAgICBmb3IgZWRpdG9yIGluIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKClcbiAgICAgIGZpbGVQYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgICAgY29udGludWUgdW5sZXNzIGZpbGVQYXRoXG4gICAgICBjb250aW51ZSBpZiBhY3RpdmVQYXRoIGlzIGZpbGVQYXRoXG5cbiAgICAgIGxhc3RPcGVuZWRFZGl0b3IgPz0gZWRpdG9yXG4gICAgICBpZiBlZGl0b3IubGFzdE9wZW5lZCA+IGxhc3RPcGVuZWRFZGl0b3IubGFzdE9wZW5lZFxuICAgICAgICBsYXN0T3BlbmVkRWRpdG9yID0gZWRpdG9yXG5cbiAgICBsYXN0T3BlbmVkRWRpdG9yPy5nZXRQYXRoKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBsb2FkUGF0aHNUYXNrPy50ZXJtaW5hdGUoKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBzdXBlclxuXG4gIHJ1bkxvYWRQYXRoc1Rhc2s6IChmbikgLT5cbiAgICBAbG9hZFBhdGhzVGFzaz8udGVybWluYXRlKClcbiAgICBAbG9hZFBhdGhzVGFzayA9IFBhdGhMb2FkZXIuc3RhcnRUYXNrIChAcGF0aHMpID0+XG4gICAgICBAcmVsb2FkUGF0aHMgPSBmYWxzZVxuICAgICAgZm4/KClcbiJdfQ==
