(function() {
  var Task, fs;

  fs = require('fs-plus');

  Task = require('atom').Task;

  module.exports = {
    startTask: function(callback) {
      var followSymlinks, ignoreVcsIgnores, ignoredNames, projectPaths, ref, ref1, results, task, taskPath;
      results = [];
      taskPath = require.resolve('./load-paths-handler');
      followSymlinks = atom.config.get('core.followSymlinks');
      ignoredNames = (ref = atom.config.get('fuzzy-finder.ignoredNames')) != null ? ref : [];
      ignoredNames = ignoredNames.concat((ref1 = atom.config.get('core.ignoredNames')) != null ? ref1 : []);
      ignoreVcsIgnores = atom.config.get('core.excludeVcsIgnoredPaths');
      projectPaths = atom.project.getPaths().map((function(_this) {
        return function(path) {
          return fs.realpathSync(path);
        };
      })(this));
      task = Task.once(taskPath, projectPaths, followSymlinks, ignoreVcsIgnores, ignoredNames, function() {
        return callback(results);
      });
      task.on('load-paths:paths-found', function(paths) {
        return results.push.apply(results, paths);
      });
      return task;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL3BhdGgtbG9hZGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLE9BQVEsT0FBQSxDQUFRLE1BQVI7O0VBRVQsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFNBQUEsRUFBVyxTQUFDLFFBQUQ7QUFDVCxVQUFBO01BQUEsT0FBQSxHQUFVO01BQ1YsUUFBQSxHQUFXLE9BQU8sQ0FBQyxPQUFSLENBQWdCLHNCQUFoQjtNQUNYLGNBQUEsR0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFCQUFoQjtNQUNqQixZQUFBLHdFQUE4RDtNQUM5RCxZQUFBLEdBQWUsWUFBWSxDQUFDLE1BQWIsZ0VBQTJELEVBQTNEO01BQ2YsZ0JBQUEsR0FBbUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDZCQUFoQjtNQUNuQixZQUFBLEdBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUEsQ0FBdUIsQ0FBQyxHQUF4QixDQUE0QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsSUFBRDtpQkFBVSxFQUFFLENBQUMsWUFBSCxDQUFnQixJQUFoQjtRQUFWO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QjtNQUVmLElBQUEsR0FBTyxJQUFJLENBQUMsSUFBTCxDQUNMLFFBREssRUFFTCxZQUZLLEVBR0wsY0FISyxFQUlMLGdCQUpLLEVBS0wsWUFMSyxFQUtTLFNBQUE7ZUFDWixRQUFBLENBQVMsT0FBVDtNQURZLENBTFQ7TUFTUCxJQUFJLENBQUMsRUFBTCxDQUFRLHdCQUFSLEVBQWtDLFNBQUMsS0FBRDtlQUNoQyxPQUFPLENBQUMsSUFBUixnQkFBYSxLQUFiO01BRGdDLENBQWxDO2FBR0E7SUFyQlMsQ0FBWDs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntUYXNrfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc3RhcnRUYXNrOiAoY2FsbGJhY2spIC0+XG4gICAgcmVzdWx0cyA9IFtdXG4gICAgdGFza1BhdGggPSByZXF1aXJlLnJlc29sdmUoJy4vbG9hZC1wYXRocy1oYW5kbGVyJylcbiAgICBmb2xsb3dTeW1saW5rcyA9IGF0b20uY29uZmlnLmdldCAnY29yZS5mb2xsb3dTeW1saW5rcydcbiAgICBpZ25vcmVkTmFtZXMgPSBhdG9tLmNvbmZpZy5nZXQoJ2Z1enp5LWZpbmRlci5pZ25vcmVkTmFtZXMnKSA/IFtdXG4gICAgaWdub3JlZE5hbWVzID0gaWdub3JlZE5hbWVzLmNvbmNhdChhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuaWdub3JlZE5hbWVzJykgPyBbXSlcbiAgICBpZ25vcmVWY3NJZ25vcmVzID0gYXRvbS5jb25maWcuZ2V0KCdjb3JlLmV4Y2x1ZGVWY3NJZ25vcmVkUGF0aHMnKVxuICAgIHByb2plY3RQYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpLm1hcCgocGF0aCkgPT4gZnMucmVhbHBhdGhTeW5jKHBhdGgpKVxuXG4gICAgdGFzayA9IFRhc2sub25jZShcbiAgICAgIHRhc2tQYXRoLFxuICAgICAgcHJvamVjdFBhdGhzLFxuICAgICAgZm9sbG93U3ltbGlua3MsXG4gICAgICBpZ25vcmVWY3NJZ25vcmVzLFxuICAgICAgaWdub3JlZE5hbWVzLCAtPlxuICAgICAgICBjYWxsYmFjayhyZXN1bHRzKVxuICAgIClcblxuICAgIHRhc2sub24gJ2xvYWQtcGF0aHM6cGF0aHMtZm91bmQnLCAocGF0aHMpIC0+XG4gICAgICByZXN1bHRzLnB1c2gocGF0aHMuLi4pXG5cbiAgICB0YXNrXG4iXX0=
