(function() {
  var BufferedProcess, ProgressElement;

  BufferedProcess = require('atom').BufferedProcess;

  ProgressElement = require('./progress-element');

  module.exports = {
    activate: function() {
      return atom.commands.add("atom-workspace", 'update-package-dependencies:update', (function(_this) {
        return function() {
          return _this.update();
        };
      })(this));
    },
    update: function() {
      var args, command, exit, options, panel, view;
      view = new ProgressElement;
      view.displayLoading();
      panel = atom.workspace.addModalPanel({
        item: view
      });
      command = atom.packages.getApmPath();
      args = ['install'];
      options = {
        cwd: this.getActiveProjectPath()
      };
      exit = function(code) {
        view.focus();
        atom.commands.add(view, 'core:cancel', function() {
          return panel.destroy();
        });
        if (code === 0) {
          return view.displaySuccess();
        } else {
          return view.displayFailure();
        }
      };
      return this.runBufferedProcess({
        command: command,
        args: args,
        exit: exit,
        options: options
      });
    },
    runBufferedProcess: function(params) {
      return new BufferedProcess(params);
    },
    getActiveProjectPath: function() {
      var activeItemPath, ref;
      if (activeItemPath = (ref = atom.workspace.getActivePaneItem()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0) {
        return atom.project.relativizePath(activeItemPath)[0];
      } else {
        return atom.project.getPaths()[0];
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy91cGRhdGUtcGFja2FnZS1kZXBlbmRlbmNpZXMvbGliL3VwZGF0ZS1wYWNrYWdlLWRlcGVuZGVuY2llcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLGtCQUFtQixPQUFBLENBQVEsTUFBUjs7RUFDcEIsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTthQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0Msb0NBQXBDLEVBQTBFLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDeEUsS0FBQyxDQUFBLE1BQUQsQ0FBQTtRQUR3RTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUU7SUFEUSxDQUFWO0lBSUEsTUFBQSxFQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUk7TUFDWCxJQUFJLENBQUMsY0FBTCxDQUFBO01BQ0EsS0FBQSxHQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUE2QjtRQUFBLElBQUEsRUFBTSxJQUFOO09BQTdCO01BRVIsT0FBQSxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBZCxDQUFBO01BQ1YsSUFBQSxHQUFPLENBQUMsU0FBRDtNQUNQLE9BQUEsR0FBVTtRQUFDLEdBQUEsRUFBSyxJQUFDLENBQUEsb0JBQUQsQ0FBQSxDQUFOOztNQUVWLElBQUEsR0FBTyxTQUFDLElBQUQ7UUFDTCxJQUFJLENBQUMsS0FBTCxDQUFBO1FBRUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQWxCLEVBQXdCLGFBQXhCLEVBQXVDLFNBQUE7aUJBQ3JDLEtBQUssQ0FBQyxPQUFOLENBQUE7UUFEcUMsQ0FBdkM7UUFHQSxJQUFHLElBQUEsS0FBUSxDQUFYO2lCQUNFLElBQUksQ0FBQyxjQUFMLENBQUEsRUFERjtTQUFBLE1BQUE7aUJBR0UsSUFBSSxDQUFDLGNBQUwsQ0FBQSxFQUhGOztNQU5LO2FBV1AsSUFBQyxDQUFBLGtCQUFELENBQW9CO1FBQUMsU0FBQSxPQUFEO1FBQVUsTUFBQSxJQUFWO1FBQWdCLE1BQUEsSUFBaEI7UUFBc0IsU0FBQSxPQUF0QjtPQUFwQjtJQXBCTSxDQUpSO0lBMEJBLGtCQUFBLEVBQW9CLFNBQUMsTUFBRDthQUNkLElBQUEsZUFBQSxDQUFnQixNQUFoQjtJQURjLENBMUJwQjtJQTZCQSxvQkFBQSxFQUFzQixTQUFBO0FBQ3BCLFVBQUE7TUFBQSxJQUFHLGNBQUEsK0ZBQW1ELENBQUUsMkJBQXhEO2VBQ0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLGNBQTVCLENBQTRDLENBQUEsQ0FBQSxFQUQ5QztPQUFBLE1BQUE7ZUFHRSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBQSxDQUF3QixDQUFBLENBQUEsRUFIMUI7O0lBRG9CLENBN0J0Qjs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbIntCdWZmZXJlZFByb2Nlc3N9ID0gcmVxdWlyZSAnYXRvbSdcblByb2dyZXNzRWxlbWVudCA9IHJlcXVpcmUgJy4vcHJvZ3Jlc3MtZWxlbWVudCdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBcImF0b20td29ya3NwYWNlXCIsICd1cGRhdGUtcGFja2FnZS1kZXBlbmRlbmNpZXM6dXBkYXRlJywgPT5cbiAgICAgIEB1cGRhdGUoKVxuXG4gIHVwZGF0ZTogLT5cbiAgICB2aWV3ID0gbmV3IFByb2dyZXNzRWxlbWVudFxuICAgIHZpZXcuZGlzcGxheUxvYWRpbmcoKVxuICAgIHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB2aWV3KVxuXG4gICAgY29tbWFuZCA9IGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpXG4gICAgYXJncyA9IFsnaW5zdGFsbCddXG4gICAgb3B0aW9ucyA9IHtjd2Q6IEBnZXRBY3RpdmVQcm9qZWN0UGF0aCgpfVxuXG4gICAgZXhpdCA9IChjb2RlKSAtPlxuICAgICAgdmlldy5mb2N1cygpXG5cbiAgICAgIGF0b20uY29tbWFuZHMuYWRkIHZpZXcsICdjb3JlOmNhbmNlbCcsIC0+XG4gICAgICAgIHBhbmVsLmRlc3Ryb3koKVxuXG4gICAgICBpZiBjb2RlID09IDBcbiAgICAgICAgdmlldy5kaXNwbGF5U3VjY2VzcygpXG4gICAgICBlbHNlXG4gICAgICAgIHZpZXcuZGlzcGxheUZhaWx1cmUoKVxuXG4gICAgQHJ1bkJ1ZmZlcmVkUHJvY2Vzcyh7Y29tbWFuZCwgYXJncywgZXhpdCwgb3B0aW9uc30pXG5cbiAgcnVuQnVmZmVyZWRQcm9jZXNzOiAocGFyYW1zKSAtPlxuICAgIG5ldyBCdWZmZXJlZFByb2Nlc3MocGFyYW1zKVxuXG4gIGdldEFjdGl2ZVByb2plY3RQYXRoOiAtPlxuICAgIGlmIGFjdGl2ZUl0ZW1QYXRoID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKT8uZ2V0UGF0aD8oKVxuICAgICAgYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGFjdGl2ZUl0ZW1QYXRoKVswXVxuICAgIGVsc2VcbiAgICAgIGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdXG4iXX0=
