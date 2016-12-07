(function() {
  var Git, path;

  Git = require('git-utils');

  path = require('path');

  module.exports = function(repoPath, paths) {
    var absolutePath, branch, filePath, ref, ref1, relativePath, repo, repoStatus, status, statuses, submodulePath, submoduleRepo, submodules, upstream, workingDirectoryPath;
    if (paths == null) {
      paths = [];
    }
    repo = Git.open(repoPath);
    upstream = {};
    statuses = {};
    submodules = {};
    branch = null;
    if (repo != null) {
      workingDirectoryPath = repo.getWorkingDirectory();
      repoStatus = (paths.length > 0 ? repo.getStatusForPaths(paths) : repo.getStatus());
      for (filePath in repoStatus) {
        status = repoStatus[filePath];
        statuses[filePath] = status;
      }
      ref = repo.submodules;
      for (submodulePath in ref) {
        submoduleRepo = ref[submodulePath];
        submodules[submodulePath] = {
          branch: submoduleRepo.getHead(),
          upstream: submoduleRepo.getAheadBehindCount()
        };
        workingDirectoryPath = submoduleRepo.getWorkingDirectory();
        ref1 = submoduleRepo.getStatus();
        for (filePath in ref1) {
          status = ref1[filePath];
          absolutePath = path.join(workingDirectoryPath, filePath);
          relativePath = repo.relativize(absolutePath);
          statuses[relativePath] = status;
        }
      }
      upstream = repo.getAheadBehindCount();
      branch = repo.getHead();
      repo.release();
    }
    return {
      statuses: statuses,
      upstream: upstream,
      branch: branch,
      submodules: submodules
    };
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9yZXBvc2l0b3J5LXN0YXR1cy1oYW5kbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxXQUFSOztFQUNOLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLFFBQUQsRUFBVyxLQUFYO0FBQ2YsUUFBQTs7TUFEMEIsUUFBUTs7SUFDbEMsSUFBQSxHQUFPLEdBQUcsQ0FBQyxJQUFKLENBQVMsUUFBVDtJQUVQLFFBQUEsR0FBVztJQUNYLFFBQUEsR0FBVztJQUNYLFVBQUEsR0FBYTtJQUNiLE1BQUEsR0FBUztJQUVULElBQUcsWUFBSDtNQUVFLG9CQUFBLEdBQXVCLElBQUksQ0FBQyxtQkFBTCxDQUFBO01BQ3ZCLFVBQUEsR0FBYSxDQUFJLEtBQUssQ0FBQyxNQUFOLEdBQWUsQ0FBbEIsR0FBeUIsSUFBSSxDQUFDLGlCQUFMLENBQXVCLEtBQXZCLENBQXpCLEdBQTRELElBQUksQ0FBQyxTQUFMLENBQUEsQ0FBN0Q7QUFDYixXQUFBLHNCQUFBOztRQUNFLFFBQVMsQ0FBQSxRQUFBLENBQVQsR0FBcUI7QUFEdkI7QUFJQTtBQUFBLFdBQUEsb0JBQUE7O1FBQ0UsVUFBVyxDQUFBLGFBQUEsQ0FBWCxHQUNFO1VBQUEsTUFBQSxFQUFRLGFBQWEsQ0FBQyxPQUFkLENBQUEsQ0FBUjtVQUNBLFFBQUEsRUFBVSxhQUFhLENBQUMsbUJBQWQsQ0FBQSxDQURWOztRQUdGLG9CQUFBLEdBQXVCLGFBQWEsQ0FBQyxtQkFBZCxDQUFBO0FBQ3ZCO0FBQUEsYUFBQSxnQkFBQTs7VUFDRSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxvQkFBVixFQUFnQyxRQUFoQztVQUVmLFlBQUEsR0FBZSxJQUFJLENBQUMsVUFBTCxDQUFnQixZQUFoQjtVQUNmLFFBQVMsQ0FBQSxZQUFBLENBQVQsR0FBeUI7QUFKM0I7QUFORjtNQVlBLFFBQUEsR0FBVyxJQUFJLENBQUMsbUJBQUwsQ0FBQTtNQUNYLE1BQUEsR0FBUyxJQUFJLENBQUMsT0FBTCxDQUFBO01BQ1QsSUFBSSxDQUFDLE9BQUwsQ0FBQSxFQXRCRjs7V0F3QkE7TUFBQyxVQUFBLFFBQUQ7TUFBVyxVQUFBLFFBQVg7TUFBcUIsUUFBQSxNQUFyQjtNQUE2QixZQUFBLFVBQTdCOztFQWhDZTtBQUhqQiIsInNvdXJjZXNDb250ZW50IjpbIkdpdCA9IHJlcXVpcmUgJ2dpdC11dGlscydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChyZXBvUGF0aCwgcGF0aHMgPSBbXSkgLT5cbiAgcmVwbyA9IEdpdC5vcGVuKHJlcG9QYXRoKVxuXG4gIHVwc3RyZWFtID0ge31cbiAgc3RhdHVzZXMgPSB7fVxuICBzdWJtb2R1bGVzID0ge31cbiAgYnJhbmNoID0gbnVsbFxuXG4gIGlmIHJlcG8/XG4gICAgIyBTdGF0dXNlcyBpbiBtYWluIHJlcG9cbiAgICB3b3JraW5nRGlyZWN0b3J5UGF0aCA9IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpXG4gICAgcmVwb1N0YXR1cyA9IChpZiBwYXRocy5sZW5ndGggPiAwIHRoZW4gcmVwby5nZXRTdGF0dXNGb3JQYXRocyhwYXRocykgZWxzZSByZXBvLmdldFN0YXR1cygpKVxuICAgIGZvciBmaWxlUGF0aCwgc3RhdHVzIG9mIHJlcG9TdGF0dXNcbiAgICAgIHN0YXR1c2VzW2ZpbGVQYXRoXSA9IHN0YXR1c1xuXG4gICAgIyBTdGF0dXNlcyBpbiBzdWJtb2R1bGVzXG4gICAgZm9yIHN1Ym1vZHVsZVBhdGgsIHN1Ym1vZHVsZVJlcG8gb2YgcmVwby5zdWJtb2R1bGVzXG4gICAgICBzdWJtb2R1bGVzW3N1Ym1vZHVsZVBhdGhdID1cbiAgICAgICAgYnJhbmNoOiBzdWJtb2R1bGVSZXBvLmdldEhlYWQoKVxuICAgICAgICB1cHN0cmVhbTogc3VibW9kdWxlUmVwby5nZXRBaGVhZEJlaGluZENvdW50KClcblxuICAgICAgd29ya2luZ0RpcmVjdG9yeVBhdGggPSBzdWJtb2R1bGVSZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKVxuICAgICAgZm9yIGZpbGVQYXRoLCBzdGF0dXMgb2Ygc3VibW9kdWxlUmVwby5nZXRTdGF0dXMoKVxuICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4od29ya2luZ0RpcmVjdG9yeVBhdGgsIGZpbGVQYXRoKVxuICAgICAgICAjIE1ha2UgcGF0aCByZWxhdGl2ZSB0byBwYXJlbnQgcmVwb3NpdG9yeVxuICAgICAgICByZWxhdGl2ZVBhdGggPSByZXBvLnJlbGF0aXZpemUoYWJzb2x1dGVQYXRoKVxuICAgICAgICBzdGF0dXNlc1tyZWxhdGl2ZVBhdGhdID0gc3RhdHVzXG5cbiAgICB1cHN0cmVhbSA9IHJlcG8uZ2V0QWhlYWRCZWhpbmRDb3VudCgpXG4gICAgYnJhbmNoID0gcmVwby5nZXRIZWFkKClcbiAgICByZXBvLnJlbGVhc2UoKVxuXG4gIHtzdGF0dXNlcywgdXBzdHJlYW0sIGJyYW5jaCwgc3VibW9kdWxlc31cbiJdfQ==
