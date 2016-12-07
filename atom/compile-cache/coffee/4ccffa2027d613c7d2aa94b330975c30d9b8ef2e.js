(function() {
  var CompositeDisposable, Disposable, Emitter, GitRepository, GitUtils, Task, _, fs, join, path, ref;

  join = require('path').join;

  _ = require('underscore-plus');

  ref = require('event-kit'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  fs = require('fs-plus');

  path = require('path');

  GitUtils = require('git-utils');

  Task = require('./task');

  module.exports = GitRepository = (function() {
    GitRepository.exists = function(path) {
      var git;
      if (git = this.open(path)) {
        git.destroy();
        return true;
      } else {
        return false;
      }
    };


    /*
    Section: Construction and Destruction
     */

    GitRepository.open = function(path, options) {
      if (!path) {
        return null;
      }
      try {
        return new GitRepository(path, options);
      } catch (error) {
        return null;
      }
    };

    function GitRepository(path, options) {
      var onWindowFocus, ref1, refreshOnWindowFocus, submodulePath, submoduleRepo;
      if (options == null) {
        options = {};
      }
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.repo = GitUtils.open(path);
      if (this.repo == null) {
        throw new Error("No Git repository found searching path: " + path);
      }
      this.statuses = {};
      this.upstream = {
        ahead: 0,
        behind: 0
      };
      ref1 = this.repo.submodules;
      for (submodulePath in ref1) {
        submoduleRepo = ref1[submodulePath];
        submoduleRepo.upstream = {
          ahead: 0,
          behind: 0
        };
      }
      this.project = options.project, this.config = options.config, refreshOnWindowFocus = options.refreshOnWindowFocus;
      if (refreshOnWindowFocus == null) {
        refreshOnWindowFocus = true;
      }
      if (refreshOnWindowFocus) {
        onWindowFocus = (function(_this) {
          return function() {
            _this.refreshIndex();
            return _this.refreshStatus();
          };
        })(this);
        window.addEventListener('focus', onWindowFocus);
        this.subscriptions.add(new Disposable(function() {
          return window.removeEventListener('focus', onWindowFocus);
        }));
      }
      if (this.project != null) {
        this.project.getBuffers().forEach((function(_this) {
          return function(buffer) {
            return _this.subscribeToBuffer(buffer);
          };
        })(this));
        this.subscriptions.add(this.project.onDidAddBuffer((function(_this) {
          return function(buffer) {
            return _this.subscribeToBuffer(buffer);
          };
        })(this)));
      }
    }

    GitRepository.prototype.destroy = function() {
      if (this.emitter != null) {
        this.emitter.emit('did-destroy');
        this.emitter.dispose();
        this.emitter = null;
      }
      if (this.statusTask != null) {
        this.statusTask.terminate();
        this.statusTask = null;
      }
      if (this.repo != null) {
        this.repo.release();
        this.repo = null;
      }
      if (this.subscriptions != null) {
        this.subscriptions.dispose();
        return this.subscriptions = null;
      }
    };

    GitRepository.prototype.isDestroyed = function() {
      return this.repo == null;
    };

    GitRepository.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Event Subscription
     */

    GitRepository.prototype.onDidChangeStatus = function(callback) {
      return this.emitter.on('did-change-status', callback);
    };

    GitRepository.prototype.onDidChangeStatuses = function(callback) {
      return this.emitter.on('did-change-statuses', callback);
    };


    /*
    Section: Repository Details
     */

    GitRepository.prototype.getType = function() {
      return 'git';
    };

    GitRepository.prototype.getPath = function() {
      return this.path != null ? this.path : this.path = fs.absolute(this.getRepo().getPath());
    };

    GitRepository.prototype.getWorkingDirectory = function() {
      return this.getRepo().getWorkingDirectory();
    };

    GitRepository.prototype.isProjectAtRoot = function() {
      var ref1;
      return this.projectAtRoot != null ? this.projectAtRoot : this.projectAtRoot = ((ref1 = this.project) != null ? ref1.relativize(this.getWorkingDirectory()) : void 0) === '';
    };

    GitRepository.prototype.relativize = function(path) {
      return this.getRepo().relativize(path);
    };

    GitRepository.prototype.hasBranch = function(branch) {
      return this.getReferenceTarget("refs/heads/" + branch) != null;
    };

    GitRepository.prototype.getShortHead = function(path) {
      return this.getRepo(path).getShortHead();
    };

    GitRepository.prototype.isSubmodule = function(path) {
      var repo;
      if (!path) {
        return false;
      }
      repo = this.getRepo(path);
      if (repo.isSubmodule(repo.relativize(path))) {
        return true;
      } else {
        return repo !== this.getRepo() && repo.relativize(join(path, 'dir')) === 'dir';
      }
    };

    GitRepository.prototype.getAheadBehindCount = function(reference, path) {
      return this.getRepo(path).getAheadBehindCount(reference);
    };

    GitRepository.prototype.getCachedUpstreamAheadBehindCount = function(path) {
      var ref1;
      return (ref1 = this.getRepo(path).upstream) != null ? ref1 : this.upstream;
    };

    GitRepository.prototype.getConfigValue = function(key, path) {
      return this.getRepo(path).getConfigValue(key);
    };

    GitRepository.prototype.getOriginURL = function(path) {
      return this.getConfigValue('remote.origin.url', path);
    };

    GitRepository.prototype.getUpstreamBranch = function(path) {
      return this.getRepo(path).getUpstreamBranch();
    };

    GitRepository.prototype.getReferences = function(path) {
      return this.getRepo(path).getReferences();
    };

    GitRepository.prototype.getReferenceTarget = function(reference, path) {
      return this.getRepo(path).getReferenceTarget(reference);
    };


    /*
    Section: Reading Status
     */

    GitRepository.prototype.isPathModified = function(path) {
      return this.isStatusModified(this.getPathStatus(path));
    };

    GitRepository.prototype.isPathNew = function(path) {
      return this.isStatusNew(this.getPathStatus(path));
    };

    GitRepository.prototype.isPathIgnored = function(path) {
      return this.getRepo().isIgnored(this.relativize(path));
    };

    GitRepository.prototype.getDirectoryStatus = function(directoryPath) {
      var directoryStatus, ref1, status, statusPath;
      directoryPath = (this.relativize(directoryPath)) + "/";
      directoryStatus = 0;
      ref1 = this.statuses;
      for (statusPath in ref1) {
        status = ref1[statusPath];
        if (statusPath.indexOf(directoryPath) === 0) {
          directoryStatus |= status;
        }
      }
      return directoryStatus;
    };

    GitRepository.prototype.getPathStatus = function(path) {
      var currentPathStatus, pathStatus, ref1, ref2, relativePath, repo;
      repo = this.getRepo(path);
      relativePath = this.relativize(path);
      currentPathStatus = (ref1 = this.statuses[relativePath]) != null ? ref1 : 0;
      pathStatus = (ref2 = repo.getStatus(repo.relativize(path))) != null ? ref2 : 0;
      if (repo.isStatusIgnored(pathStatus)) {
        pathStatus = 0;
      }
      if (pathStatus > 0) {
        this.statuses[relativePath] = pathStatus;
      } else {
        delete this.statuses[relativePath];
      }
      if (currentPathStatus !== pathStatus) {
        this.emitter.emit('did-change-status', {
          path: path,
          pathStatus: pathStatus
        });
      }
      return pathStatus;
    };

    GitRepository.prototype.getCachedPathStatus = function(path) {
      return this.statuses[this.relativize(path)];
    };

    GitRepository.prototype.isStatusModified = function(status) {
      return this.getRepo().isStatusModified(status);
    };

    GitRepository.prototype.isStatusNew = function(status) {
      return this.getRepo().isStatusNew(status);
    };


    /*
    Section: Retrieving Diffs
     */

    GitRepository.prototype.getDiffStats = function(path) {
      var repo;
      repo = this.getRepo(path);
      return repo.getDiffStats(repo.relativize(path));
    };

    GitRepository.prototype.getLineDiffs = function(path, text) {
      var options, repo;
      options = {
        ignoreEolWhitespace: process.platform === 'win32'
      };
      repo = this.getRepo(path);
      return repo.getLineDiffs(repo.relativize(path), text, options);
    };


    /*
    Section: Checking Out
     */

    GitRepository.prototype.checkoutHead = function(path) {
      var headCheckedOut, repo;
      repo = this.getRepo(path);
      headCheckedOut = repo.checkoutHead(repo.relativize(path));
      if (headCheckedOut) {
        this.getPathStatus(path);
      }
      return headCheckedOut;
    };

    GitRepository.prototype.checkoutReference = function(reference, create) {
      return this.getRepo().checkoutReference(reference, create);
    };


    /*
    Section: Private
     */

    GitRepository.prototype.subscribeToBuffer = function(buffer) {
      var bufferSubscriptions, getBufferPathStatus;
      getBufferPathStatus = (function(_this) {
        return function() {
          var bufferPath;
          if (bufferPath = buffer.getPath()) {
            return _this.getPathStatus(bufferPath);
          }
        };
      })(this);
      bufferSubscriptions = new CompositeDisposable;
      bufferSubscriptions.add(buffer.onDidSave(getBufferPathStatus));
      bufferSubscriptions.add(buffer.onDidReload(getBufferPathStatus));
      bufferSubscriptions.add(buffer.onDidChangePath(getBufferPathStatus));
      bufferSubscriptions.add(buffer.onDidDestroy((function(_this) {
        return function() {
          bufferSubscriptions.dispose();
          return _this.subscriptions.remove(bufferSubscriptions);
        };
      })(this)));
      this.subscriptions.add(bufferSubscriptions);
    };

    GitRepository.prototype.checkoutHeadForEditor = function(editor) {
      var filePath;
      if (filePath = editor.getPath()) {
        if (editor.buffer.isModified()) {
          editor.buffer.reload();
        }
        return this.checkoutHead(filePath);
      }
    };

    GitRepository.prototype.getRepo = function(path) {
      var ref1;
      if (this.repo != null) {
        return (ref1 = this.repo.submoduleForPath(path)) != null ? ref1 : this.repo;
      } else {
        throw new Error("Repository has been destroyed");
      }
    };

    GitRepository.prototype.refreshIndex = function() {
      return this.getRepo().refreshIndex();
    };

    GitRepository.prototype.refreshStatus = function() {
      var ref1, ref2, relativeProjectPaths;
      if (this.handlerPath == null) {
        this.handlerPath = require.resolve('./repository-status-handler');
      }
      relativeProjectPaths = (ref1 = this.project) != null ? ref1.getPaths().map((function(_this) {
        return function(projectPath) {
          return _this.relativize(projectPath);
        };
      })(this)).filter(function(projectPath) {
        return projectPath.length > 0 && !path.isAbsolute(projectPath);
      }) : void 0;
      if ((ref2 = this.statusTask) != null) {
        ref2.terminate();
      }
      return new Promise((function(_this) {
        return function(resolve) {
          return _this.statusTask = Task.once(_this.handlerPath, _this.getPath(), relativeProjectPaths, function(arg) {
            var branch, ref3, ref4, ref5, statuses, statusesUnchanged, submodulePath, submoduleRepo, submodules, upstream;
            statuses = arg.statuses, upstream = arg.upstream, branch = arg.branch, submodules = arg.submodules;
            statusesUnchanged = _.isEqual(statuses, _this.statuses) && _.isEqual(upstream, _this.upstream) && _.isEqual(branch, _this.branch) && _.isEqual(submodules, _this.submodules);
            _this.statuses = statuses;
            _this.upstream = upstream;
            _this.branch = branch;
            _this.submodules = submodules;
            ref3 = _this.getRepo().submodules;
            for (submodulePath in ref3) {
              submoduleRepo = ref3[submodulePath];
              submoduleRepo.upstream = (ref4 = (ref5 = submodules[submodulePath]) != null ? ref5.upstream : void 0) != null ? ref4 : {
                ahead: 0,
                behind: 0
              };
            }
            if (!statusesUnchanged) {
              _this.emitter.emit('did-change-statuses');
            }
            return resolve();
          });
        };
      })(this));
    };

    return GitRepository;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9naXQtcmVwb3NpdG9yeS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLE9BQVEsT0FBQSxDQUFRLE1BQVI7O0VBRVQsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUE2QyxPQUFBLENBQVEsV0FBUixDQUE3QyxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0I7O0VBQ3RCLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsUUFBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUVYLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFrQ1AsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNKLGFBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFEO0FBQ1AsVUFBQTtNQUFBLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxJQUFELENBQU0sSUFBTixDQUFUO1FBQ0UsR0FBRyxDQUFDLE9BQUosQ0FBQTtlQUNBLEtBRkY7T0FBQSxNQUFBO2VBSUUsTUFKRjs7SUFETzs7O0FBT1Q7Ozs7SUFZQSxhQUFDLENBQUEsSUFBRCxHQUFPLFNBQUMsSUFBRCxFQUFPLE9BQVA7TUFDTCxJQUFBLENBQW1CLElBQW5CO0FBQUEsZUFBTyxLQUFQOztBQUNBO2VBQ00sSUFBQSxhQUFBLENBQWMsSUFBZCxFQUFvQixPQUFwQixFQUROO09BQUEsYUFBQTtlQUdFLEtBSEY7O0lBRks7O0lBT00sdUJBQUMsSUFBRCxFQUFPLE9BQVA7QUFDWCxVQUFBOztRQURrQixVQUFROztNQUMxQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BRXJCLElBQUMsQ0FBQSxJ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R0FBWTtZQUNaLEtBQUMsQ0FBQSxNQUFELEdBQVU7WUFDVixLQUFDLENBQUEsVUFBRCxHQUFjO0FBRWQ7QUFBQSxpQkFBQSxxQkFBQTs7Y0FDRSxhQUFhLENBQUMsUUFBZCxpR0FBK0Q7Z0JBQUMsS0FBQSxFQUFPLENBQVI7Z0JBQVcsTUFBQSxFQUFRLENBQW5COztBQURqRTtZQUdBLElBQUEsQ0FBTyxpQkFBUDtjQUNFLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHFCQUFkLEVBREY7O21CQUVBLE9BQUEsQ0FBQTtVQWhCc0UsQ0FBMUQ7UUFESjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUjtJQVJTOzs7OztBQXBkakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7am9pbn0gPSByZXF1aXJlICdwYXRoJ1xuXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5HaXRVdGlscyA9IHJlcXVpcmUgJ2dpdC11dGlscydcblxuVGFzayA9IHJlcXVpcmUgJy4vdGFzaydcblxuIyBFeHRlbmRlZDogUmVwcmVzZW50cyB0aGUgdW5kZXJseWluZyBnaXQgb3BlcmF0aW9ucyBwZXJmb3JtZWQgYnkgQXRvbS5cbiNcbiMgVGhpcyBjbGFzcyBzaG91bGRuJ3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5IGJ1dCBpbnN0ZWFkIGJ5IGFjY2Vzc2luZyB0aGVcbiMgYGF0b20ucHJvamVjdGAgZ2xvYmFsIGFuZCBjYWxsaW5nIGBnZXRSZXBvc2l0b3JpZXMoKWAuIE5vdGUgdGhhdCB0aGlzIHdpbGxcbiMgb25seSBiZSBhdmFpbGFibGUgd2hlbiB0aGUgcHJvamVjdCBpcyBiYWNrZWQgYnkgYSBHaXQgcmVwb3NpdG9yeS5cbiNcbiMgVGhpcyBjbGFzcyBoYW5kbGVzIHN1Ym1vZHVsZXMgYXV0b21hdGljYWxseSBieSB0YWtpbmcgYSBgcGF0aGAgYXJndW1lbnQgdG8gbWFueVxuIyBvZiB0aGUgbWV0aG9kcy4gIFRoaXMgYHBhdGhgIGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIHdoaWNoIHVuZGVybHlpbmdcbiMgcmVwb3NpdG9yeSBpcyB1c2VkLlxuI1xuIyBGb3IgYSByZXBvc2l0b3J5IHdpdGggc3VibW9kdWxlcyB0aGlzIHdvdWxkIGhhdmUgdGhlIGZvbGxvd2luZyBvdXRjb21lOlxuI1xuIyBgYGBjb2ZmZWVcbiMgcmVwbyA9IGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKVswXVxuIyByZXBvLmdldFNob3J0SGVhZCgpICMgJ21hc3RlcidcbiMgcmVwby5nZXRTaG9ydEhlYWQoJ3ZlbmRvci9wYXRoL3RvL2Evc3VibW9kdWxlJykgIyAnZGVhZDEyMzQnXG4jIGBgYFxuI1xuIyAjIyBFeGFtcGxlc1xuI1xuIyAjIyMgTG9nZ2luZyB0aGUgVVJMIG9mIHRoZSBvcmlnaW4gcmVtb3RlXG4jXG4jIGBgYGNvZmZlZVxuIyBnaXQgPSBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbMF1cbiMgY29uc29sZS5sb2cgZ2l0LmdldE9yaWdpblVSTCgpXG4jIGBgYFxuI1xuIyAjIyMgUmVxdWlyaW5nIGluIHBhY2thZ2VzXG4jXG4jIGBgYGNvZmZlZVxuIyB7R2l0UmVwb3NpdG9yeX0gPSByZXF1aXJlICdhdG9tJ1xuIyBgYGBcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEdpdFJlcG9zaXRvcnlcbiAgQGV4aXN0czogKHBhdGgpIC0+XG4gICAgaWYgZ2l0ID0gQG9wZW4ocGF0aClcbiAgICAgIGdpdC5kZXN0cm95KClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gICMjI1xuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb24gYW5kIERlc3RydWN0aW9uXG4gICMjI1xuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgbmV3IEdpdFJlcG9zaXRvcnkgaW5zdGFuY2UuXG4gICNcbiAgIyAqIGBwYXRoYCBUaGUge1N0cmluZ30gcGF0aCB0byB0aGUgR2l0IHJlcG9zaXRvcnkgdG8gb3Blbi5cbiAgIyAqIGBvcHRpb25zYCBBbiBvcHRpb25hbCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYHJlZnJlc2hPbldpbmRvd0ZvY3VzYCBBIHtCb29sZWFufSwgYHRydWVgIHRvIHJlZnJlc2ggdGhlIGluZGV4IGFuZFxuICAjICAgICBzdGF0dXNlcyB3aGVuIHRoZSB3aW5kb3cgaXMgZm9jdXNlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7R2l0UmVwb3NpdG9yeX0gaW5zdGFuY2Ugb3IgYG51bGxgIGlmIHRoZSByZXBvc2l0b3J5IGNvdWxkIG5vdCBiZSBvcGVuZWQuXG4gIEBvcGVuOiAocGF0aCwgb3B0aW9ucykgLT5cbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcGF0aFxuICAgIHRyeVxuICAgICAgbmV3IEdpdFJlcG9zaXRvcnkocGF0aCwgb3B0aW9ucylcbiAgICBjYXRjaFxuICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAocGF0aCwgb3B0aW9ucz17fSkgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQHJlcG8gPSBHaXRVdGlscy5vcGVuKHBhdGgpXG4gICAgdW5sZXNzIEByZXBvP1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gR2l0IHJlcG9zaXRvcnkgZm91bmQgc2VhcmNoaW5nIHBhdGg6ICN7cGF0aH1cIilcblxuICAgIEBzdGF0dXNlcyA9IHt9XG4gICAgQHVwc3RyZWFtID0ge2FoZWFkOiAwLCBiZWhpbmQ6IDB9XG4gICAgZm9yIHN1Ym1vZHVsZVBhdGgsIHN1Ym1vZHVsZVJlcG8gb2YgQHJlcG8uc3VibW9kdWxlc1xuICAgICAgc3VibW9kdWxlUmVwby51cHN0cmVhbSA9IHthaGVhZDogMCwgYmVoaW5kOiAwfVxuXG4gICAge0Bwcm9qZWN0LCBAY29uZmlnLCByZWZyZXNoT25XaW5kb3dGb2N1c30gPSBvcHRpb25zXG5cbiAgICByZWZyZXNoT25XaW5kb3dGb2N1cyA/PSB0cnVlXG4gICAgaWYgcmVmcmVzaE9uV2luZG93Rm9jdXNcbiAgICAgIG9uV2luZG93Rm9jdXMgPSA9PlxuICAgICAgICBAcmVmcmVzaEluZGV4KClcbiAgICAgICAgQHJlZnJlc2hTdGF0dXMoKVxuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCBvbldpbmRvd0ZvY3VzXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgbmV3IERpc3Bvc2FibGUoLT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3VzJywgb25XaW5kb3dGb2N1cylcblxuICAgIGlmIEBwcm9qZWN0P1xuICAgICAgQHByb2plY3QuZ2V0QnVmZmVycygpLmZvckVhY2ggKGJ1ZmZlcikgPT4gQHN1YnNjcmliZVRvQnVmZmVyKGJ1ZmZlcilcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAcHJvamVjdC5vbkRpZEFkZEJ1ZmZlciAoYnVmZmVyKSA9PiBAc3Vic2NyaWJlVG9CdWZmZXIoYnVmZmVyKVxuXG4gICMgUHVibGljOiBEZXN0cm95IHRoaXMge0dpdFJlcG9zaXRvcnl9IG9iamVjdC5cbiAgI1xuICAjIFRoaXMgZGVzdHJveXMgYW55IHRhc2tzIGFuZCBzdWJzY3JpcHRpb25zIGFuZCByZWxlYXNlcyB0aGUgdW5kZXJseWluZ1xuICAjIGxpYmdpdDIgcmVwb3NpdG9yeSBoYW5kbGUuIFRoaXMgbWV0aG9kIGlzIGlkZW1wb3RlbnQuXG4gIGRlc3Ryb3k6IC0+XG4gICAgaWYgQGVtaXR0ZXI/XG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuICAgICAgQGVtaXR0ZXIgPSBudWxsXG5cbiAgICBpZiBAc3RhdHVzVGFzaz9cbiAgICAgIEBzdGF0dXNUYXNrLnRlcm1pbmF0ZSgpXG4gICAgICBAc3RhdHVzVGFzayA9IG51bGxcblxuICAgIGlmIEByZXBvP1xuICAgICAgQHJlcG8ucmVsZWFzZSgpXG4gICAgICBAcmVwbyA9IG51bGxcblxuICAgIGlmIEBzdWJzY3JpcHRpb25zP1xuICAgICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICAjIFB1YmxpYzogUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGlmIHRoaXMgcmVwb3NpdG9yeSBoYXMgYmVlbiBkZXN0cm95ZWQuXG4gIGlzRGVzdHJveWVkOiAtPlxuICAgIG5vdCBAcmVwbz9cblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoaXMgR2l0UmVwb3NpdG9yeSdzIGRlc3Ryb3koKSBtZXRob2RcbiAgIyBpcyBpbnZva2VkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgc3BlY2lmaWMgZmlsZSdzIHN0YXR1cyBoYXNcbiAgIyBjaGFuZ2VkLiBXaGVuIGEgZmlsZSBpcyB1cGRhdGVkLCByZWxvYWRlZCwgZXRjLCBhbmQgdGhlIHN0YXR1cyBjaGFuZ2VzLCB0aGlzXG4gICMgd2lsbCBiZSBmaXJlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gICMgICAqIGBldmVudGAge09iamVjdH1cbiAgIyAgICAgKiBgcGF0aGAge1N0cmluZ30gdGhlIG9sZCBwYXJhbWV0ZXJzIHRoZSBkZWNvcmF0aW9uIHVzZWQgdG8gaGF2ZVxuICAjICAgICAqIGBwYXRoU3RhdHVzYCB7TnVtYmVyfSByZXByZXNlbnRpbmcgdGhlIHN0YXR1cy4gVGhpcyB2YWx1ZSBjYW4gYmUgcGFzc2VkIHRvXG4gICMgICAgICAgezo6aXNTdGF0dXNNb2RpZmllZH0gb3Igezo6aXNTdGF0dXNOZXd9IHRvIGdldCBtb3JlIGluZm9ybWF0aW9uLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VTdGF0dXM6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1zdGF0dXMnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBtdWx0aXBsZSBmaWxlcycgc3RhdHVzZXMgaGF2ZVxuICAjIGNoYW5nZWQuIEZvciBleGFtcGxlLCBvbiB3aW5kb3cgZm9jdXMsIHRoZSBzdGF0dXMgb2YgYWxsIHRoZSBwYXRocyBpbiB0aGVcbiAgIyByZXBvIGlzIGNoZWNrZWQuIElmIGFueSBvZiB0aGVtIGhhdmUgY2hhbmdlZCwgdGhpcyB3aWxsIGJlIGZpcmVkLiBDYWxsXG4gICMgezo6Z2V0UGF0aFN0YXR1cyhwYXRoKX0gdG8gZ2V0IHRoZSBzdGF0dXMgZm9yIHlvdXIgcGF0aCBvZiBjaG9pY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VTdGF0dXNlczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXN0YXR1c2VzJywgY2FsbGJhY2tcblxuICAjIyNcbiAgU2VjdGlvbjogUmVwb3NpdG9yeSBEZXRhaWxzXG4gICMjI1xuXG4gICMgUHVibGljOiBBIHtTdHJpbmd9IGluZGljYXRpbmcgdGhlIHR5cGUgb2YgdmVyc2lvbiBjb250cm9sIHN5c3RlbSB1c2VkIGJ5XG4gICMgdGhpcyByZXBvc2l0b3J5LlxuICAjXG4gICMgUmV0dXJucyBgXCJnaXRcImAuXG4gIGdldFR5cGU6IC0+ICdnaXQnXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHtTdHJpbmd9IHBhdGggb2YgdGhlIHJlcG9zaXRvcnkuXG4gIGdldFBhdGg6IC0+XG4gICAgQHBhdGggPz0gZnMuYWJzb2x1dGUoQGdldFJlcG8oKS5nZXRQYXRoKCkpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHtTdHJpbmd9IHdvcmtpbmcgZGlyZWN0b3J5IHBhdGggb2YgdGhlIHJlcG9zaXRvcnkuXG4gIGdldFdvcmtpbmdEaXJlY3Rvcnk6IC0+IEBnZXRSZXBvKCkuZ2V0V29ya2luZ0RpcmVjdG9yeSgpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdHJ1ZSBpZiBhdCB0aGUgcm9vdCwgZmFsc2UgaWYgaW4gYSBzdWJmb2xkZXIgb2YgdGhlXG4gICMgcmVwb3NpdG9yeS5cbiAgaXNQcm9qZWN0QXRSb290OiAtPlxuICAgIEBwcm9qZWN0QXRSb290ID89IEBwcm9qZWN0Py5yZWxhdGl2aXplKEBnZXRXb3JraW5nRGlyZWN0b3J5KCkpIGlzICcnXG5cbiAgIyBQdWJsaWM6IE1ha2VzIGEgcGF0aCByZWxhdGl2ZSB0byB0aGUgcmVwb3NpdG9yeSdzIHdvcmtpbmcgZGlyZWN0b3J5LlxuICByZWxhdGl2aXplOiAocGF0aCkgLT4gQGdldFJlcG8oKS5yZWxhdGl2aXplKHBhdGgpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gYnJhbmNoIGV4aXN0cy5cbiAgaGFzQnJhbmNoOiAoYnJhbmNoKSAtPiBAZ2V0UmVmZXJlbmNlVGFyZ2V0KFwicmVmcy9oZWFkcy8je2JyYW5jaH1cIik/XG5cbiAgIyBQdWJsaWM6IFJldHJpZXZlcyBhIHNob3J0ZW5lZCB2ZXJzaW9uIG9mIHRoZSBIRUFEIHJlZmVyZW5jZSB2YWx1ZS5cbiAgI1xuICAjIFRoaXMgcmVtb3ZlcyB0aGUgbGVhZGluZyBzZWdtZW50cyBvZiBgcmVmcy9oZWFkc2AsIGByZWZzL3RhZ3NgLCBvclxuICAjIGByZWZzL3JlbW90ZXNgLiAgSXQgYWxzbyBzaG9ydGVucyB0aGUgU0hBLTEgb2YgYSBkZXRhY2hlZCBgSEVBRGAgdG8gN1xuICAjIGNoYXJhY3RlcnMuXG4gICNcbiAgIyAqIGBwYXRoYCBBbiBvcHRpb25hbCB7U3RyaW5nfSBwYXRoIGluIHRoZSByZXBvc2l0b3J5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uXG4gICMgICBmb3IsIG9ubHkgbmVlZGVkIGlmIHRoZSByZXBvc2l0b3J5IGNvbnRhaW5zIHN1Ym1vZHVsZXMuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldFNob3J0SGVhZDogKHBhdGgpIC0+IEBnZXRSZXBvKHBhdGgpLmdldFNob3J0SGVhZCgpXG5cbiAgIyBQdWJsaWM6IElzIHRoZSBnaXZlbiBwYXRoIGEgc3VibW9kdWxlIGluIHRoZSByZXBvc2l0b3J5P1xuICAjXG4gICMgKiBgcGF0aGAgVGhlIHtTdHJpbmd9IHBhdGggdG8gY2hlY2suXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc1N1Ym1vZHVsZTogKHBhdGgpIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwYXRoXG5cbiAgICByZXBvID0gQGdldFJlcG8ocGF0aClcbiAgICBpZiByZXBvLmlzU3VibW9kdWxlKHJlcG8ucmVsYXRpdml6ZShwYXRoKSlcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICAjIENoZWNrIGlmIHRoZSBwYXRoIGlzIGEgd29ya2luZyBkaXJlY3RvcnkgaW4gYSByZXBvIHRoYXQgaXNuJ3QgdGhlIHJvb3QuXG4gICAgICByZXBvIGlzbnQgQGdldFJlcG8oKSBhbmQgcmVwby5yZWxhdGl2aXplKGpvaW4ocGF0aCwgJ2RpcicpKSBpcyAnZGlyJ1xuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgY29tbWl0cyBiZWhpbmQgdGhlIGN1cnJlbnQgYnJhbmNoIGlzIGZyb20gdGhlXG4gICMgaXRzIHVwc3RyZWFtIHJlbW90ZSBicmFuY2guXG4gICNcbiAgIyAqIGByZWZlcmVuY2VgIFRoZSB7U3RyaW5nfSBicmFuY2ggcmVmZXJlbmNlIG5hbWUuXG4gICMgKiBgcGF0aGAgICAgICBUaGUge1N0cmluZ30gcGF0aCBpbiB0aGUgcmVwb3NpdG9yeSB0byBnZXQgdGhpcyBpbmZvcm1hdGlvbiBmb3IsXG4gICMgICBvbmx5IG5lZWRlZCBpZiB0aGUgcmVwb3NpdG9yeSBjb250YWlucyBzdWJtb2R1bGVzLlxuICBnZXRBaGVhZEJlaGluZENvdW50OiAocmVmZXJlbmNlLCBwYXRoKSAtPlxuICAgIEBnZXRSZXBvKHBhdGgpLmdldEFoZWFkQmVoaW5kQ291bnQocmVmZXJlbmNlKVxuXG4gICMgUHVibGljOiBHZXQgdGhlIGNhY2hlZCBhaGVhZC9iZWhpbmQgY29tbWl0IGNvdW50cyBmb3IgdGhlIGN1cnJlbnQgYnJhbmNoJ3NcbiAgIyB1cHN0cmVhbSBicmFuY2guXG4gICNcbiAgIyAqIGBwYXRoYCBBbiBvcHRpb25hbCB7U3RyaW5nfSBwYXRoIGluIHRoZSByZXBvc2l0b3J5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uXG4gICMgICBmb3IsIG9ubHkgbmVlZGVkIGlmIHRoZSByZXBvc2l0b3J5IGhhcyBzdWJtb2R1bGVzLlxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGFoZWFkYCAgVGhlIHtOdW1iZXJ9IG9mIGNvbW1pdHMgYWhlYWQuXG4gICMgICAqIGBiZWhpbmRgIFRoZSB7TnVtYmVyfSBvZiBjb21taXRzIGJlaGluZC5cbiAgZ2V0Q2FjaGVkVXBzdHJlYW1BaGVhZEJlaGluZENvdW50OiAocGF0aCkgLT5cbiAgICBAZ2V0UmVwbyhwYXRoKS51cHN0cmVhbSA/IEB1cHN0cmVhbVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBnaXQgY29uZmlndXJhdGlvbiB2YWx1ZSBzcGVjaWZpZWQgYnkgdGhlIGtleS5cbiAgI1xuICAjICogYGtleWAgIFRoZSB7U3RyaW5nfSBrZXkgZm9yIHRoZSBjb25maWd1cmF0aW9uIHRvIGxvb2t1cC5cbiAgIyAqIGBwYXRoYCBBbiBvcHRpb25hbCB7U3RyaW5nfSBwYXRoIGluIHRoZSByZXBvc2l0b3J5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uXG4gICMgICBmb3IsIG9ubHkgbmVlZGVkIGlmIHRoZSByZXBvc2l0b3J5IGhhcyBzdWJtb2R1bGVzLlxuICBnZXRDb25maWdWYWx1ZTogKGtleSwgcGF0aCkgLT4gQGdldFJlcG8ocGF0aCkuZ2V0Q29uZmlnVmFsdWUoa2V5KVxuXG4gICMgUHVibGljOiBSZXR1cm5zIHRoZSBvcmlnaW4gdXJsIG9mIHRoZSByZXBvc2l0b3J5LlxuICAjXG4gICMgKiBgcGF0aGAgKG9wdGlvbmFsKSB7U3RyaW5nfSBwYXRoIGluIHRoZSByZXBvc2l0b3J5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uXG4gICMgICBmb3IsIG9ubHkgbmVlZGVkIGlmIHRoZSByZXBvc2l0b3J5IGhhcyBzdWJtb2R1bGVzLlxuICBnZXRPcmlnaW5VUkw6IChwYXRoKSAtPiBAZ2V0Q29uZmlnVmFsdWUoJ3JlbW90ZS5vcmlnaW4udXJsJywgcGF0aClcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgdXBzdHJlYW0gYnJhbmNoIGZvciB0aGUgY3VycmVudCBIRUFELCBvciBudWxsIGlmIHRoZXJlXG4gICMgaXMgbm8gdXBzdHJlYW0gYnJhbmNoIGZvciB0aGUgY3VycmVudCBIRUFELlxuICAjXG4gICMgKiBgcGF0aGAgQW4gb3B0aW9uYWwge1N0cmluZ30gcGF0aCBpbiB0aGUgcmVwbyB0byBnZXQgdGhpcyBpbmZvcm1hdGlvbiBmb3IsXG4gICMgICBvbmx5IG5lZWRlZCBpZiB0aGUgcmVwb3NpdG9yeSBjb250YWlucyBzdWJtb2R1bGVzLlxuICAjXG4gICMgUmV0dXJucyBhIHtTdHJpbmd9IGJyYW5jaCBuYW1lIHN1Y2ggYXMgYHJlZnMvcmVtb3Rlcy9vcmlnaW4vbWFzdGVyYC5cbiAgZ2V0VXBzdHJlYW1CcmFuY2g6IChwYXRoKSAtPiBAZ2V0UmVwbyhwYXRoKS5nZXRVcHN0cmVhbUJyYW5jaCgpXG5cbiAgIyBQdWJsaWM6IEdldHMgYWxsIHRoZSBsb2NhbCBhbmQgcmVtb3RlIHJlZmVyZW5jZXMuXG4gICNcbiAgIyAqIGBwYXRoYCBBbiBvcHRpb25hbCB7U3RyaW5nfSBwYXRoIGluIHRoZSByZXBvc2l0b3J5IHRvIGdldCB0aGlzIGluZm9ybWF0aW9uXG4gICMgICBmb3IsIG9ubHkgbmVlZGVkIGlmIHRoZSByZXBvc2l0b3J5IGhhcyBzdWJtb2R1bGVzLlxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgKiBgaGVhZHNgICAgQW4ge0FycmF5fSBvZiBoZWFkIHJlZmVyZW5jZSBuYW1lcy5cbiAgIyAgKiBgcmVtb3Rlc2AgQW4ge0FycmF5fSBvZiByZW1vdGUgcmVmZXJlbmNlIG5hbWVzLlxuICAjICAqIGB0YWdzYCAgICBBbiB7QXJyYXl9IG9mIHRhZyByZWZlcmVuY2UgbmFtZXMuXG4gIGdldFJlZmVyZW5jZXM6IChwYXRoKSAtPiBAZ2V0UmVwbyhwYXRoKS5nZXRSZWZlcmVuY2VzKClcblxuICAjIFB1YmxpYzogUmV0dXJucyB0aGUgY3VycmVudCB7U3RyaW5nfSBTSEEgZm9yIHRoZSBnaXZlbiByZWZlcmVuY2UuXG4gICNcbiAgIyAqIGByZWZlcmVuY2VgIFRoZSB7U3RyaW5nfSByZWZlcmVuY2UgdG8gZ2V0IHRoZSB0YXJnZXQgb2YuXG4gICMgKiBgcGF0aGAgQW4gb3B0aW9uYWwge1N0cmluZ30gcGF0aCBpbiB0aGUgcmVwbyB0byBnZXQgdGhlIHJlZmVyZW5jZSB0YXJnZXRcbiAgIyAgIGZvci4gT25seSBuZWVkZWQgaWYgdGhlIHJlcG9zaXRvcnkgY29udGFpbnMgc3VibW9kdWxlcy5cbiAgZ2V0UmVmZXJlbmNlVGFyZ2V0OiAocmVmZXJlbmNlLCBwYXRoKSAtPlxuICAgIEBnZXRSZXBvKHBhdGgpLmdldFJlZmVyZW5jZVRhcmdldChyZWZlcmVuY2UpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFJlYWRpbmcgU3RhdHVzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHBhdGggaXMgbW9kaWZpZWQuXG4gICNcbiAgIyAqIGBwYXRoYCBUaGUge1N0cmluZ30gcGF0aCB0byBjaGVjay5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gdGhhdCdzIHRydWUgaWYgdGhlIGBwYXRoYCBpcyBtb2RpZmllZC5cbiAgaXNQYXRoTW9kaWZpZWQ6IChwYXRoKSAtPiBAaXNTdGF0dXNNb2RpZmllZChAZ2V0UGF0aFN0YXR1cyhwYXRoKSlcblxuICAjIFB1YmxpYzogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBwYXRoIGlzIG5ldy5cbiAgI1xuICAjICogYHBhdGhgIFRoZSB7U3RyaW5nfSBwYXRoIHRvIGNoZWNrLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSB0aGF0J3MgdHJ1ZSBpZiB0aGUgYHBhdGhgIGlzIG5ldy5cbiAgaXNQYXRoTmV3OiAocGF0aCkgLT4gQGlzU3RhdHVzTmV3KEBnZXRQYXRoU3RhdHVzKHBhdGgpKVxuXG4gICMgUHVibGljOiBJcyB0aGUgZ2l2ZW4gcGF0aCBpZ25vcmVkP1xuICAjXG4gICMgKiBgcGF0aGAgVGhlIHtTdHJpbmd9IHBhdGggdG8gY2hlY2suXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQncyB0cnVlIGlmIHRoZSBgcGF0aGAgaXMgaWdub3JlZC5cbiAgaXNQYXRoSWdub3JlZDogKHBhdGgpIC0+IEBnZXRSZXBvKCkuaXNJZ25vcmVkKEByZWxhdGl2aXplKHBhdGgpKVxuXG4gICMgUHVibGljOiBHZXQgdGhlIHN0YXR1cyBvZiBhIGRpcmVjdG9yeSBpbiB0aGUgcmVwb3NpdG9yeSdzIHdvcmtpbmcgZGlyZWN0b3J5LlxuICAjXG4gICMgKiBgcGF0aGAgVGhlIHtTdHJpbmd9IHBhdGggdG8gY2hlY2suXG4gICNcbiAgIyBSZXR1cm5zIGEge051bWJlcn0gcmVwcmVzZW50aW5nIHRoZSBzdGF0dXMuIFRoaXMgdmFsdWUgY2FuIGJlIHBhc3NlZCB0b1xuICAjIHs6OmlzU3RhdHVzTW9kaWZpZWR9IG9yIHs6OmlzU3RhdHVzTmV3fSB0byBnZXQgbW9yZSBpbmZvcm1hdGlvbi5cbiAgZ2V0RGlyZWN0b3J5U3RhdHVzOiAoZGlyZWN0b3J5UGF0aCkgIC0+XG4gICAgZGlyZWN0b3J5UGF0aCA9IFwiI3tAcmVsYXRpdml6ZShkaXJlY3RvcnlQYXRoKX0vXCJcbiAgICBkaXJlY3RvcnlTdGF0dXMgPSAwXG4gICAgZm9yIHN0YXR1c1BhdGgsIHN0YXR1cyBvZiBAc3RhdHVzZXNcbiAgICAgIGRpcmVjdG9yeVN0YXR1cyB8PSBzdGF0dXMgaWYgc3RhdHVzUGF0aC5pbmRleE9mKGRpcmVjdG9yeVBhdGgpIGlzIDBcbiAgICBkaXJlY3RvcnlTdGF0dXNcblxuICAjIFB1YmxpYzogR2V0IHRoZSBzdGF0dXMgb2YgYSBzaW5nbGUgcGF0aCBpbiB0aGUgcmVwb3NpdG9yeS5cbiAgI1xuICAjICogYHBhdGhgIEEge1N0cmluZ30gcmVwb3NpdG9yeS1yZWxhdGl2ZSBwYXRoLlxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9IHJlcHJlc2VudGluZyB0aGUgc3RhdHVzLiBUaGlzIHZhbHVlIGNhbiBiZSBwYXNzZWQgdG9cbiAgIyB7Ojppc1N0YXR1c01vZGlmaWVkfSBvciB7Ojppc1N0YXR1c05ld30gdG8gZ2V0IG1vcmUgaW5mb3JtYXRpb24uXG4gIGdldFBhdGhTdGF0dXM6IChwYXRoKSAtPlxuICAgIHJlcG8gPSBAZ2V0UmVwbyhwYXRoKVxuICAgIHJlbGF0aXZlUGF0aCA9IEByZWxhdGl2aXplKHBhdGgpXG4gICAgY3VycmVudFBhdGhTdGF0dXMgPSBAc3RhdHVzZXNbcmVsYXRpdmVQYXRoXSA/IDBcbiAgICBwYXRoU3RhdHVzID0gcmVwby5nZXRTdGF0dXMocmVwby5yZWxhdGl2aXplKHBhdGgpKSA/IDBcbiAgICBwYXRoU3RhdHVzID0gMCBpZiByZXBvLmlzU3RhdHVzSWdub3JlZChwYXRoU3RhdHVzKVxuICAgIGlmIHBhdGhTdGF0dXMgPiAwXG4gICAgICBAc3RhdHVzZXNbcmVsYXRpdmVQYXRoXSA9IHBhdGhTdGF0dXNcbiAgICBlbHNlXG4gICAgICBkZWxldGUgQHN0YXR1c2VzW3JlbGF0aXZlUGF0aF1cbiAgICBpZiBjdXJyZW50UGF0aFN0YXR1cyBpc250IHBhdGhTdGF0dXNcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2Utc3RhdHVzJywge3BhdGgsIHBhdGhTdGF0dXN9XG5cbiAgICBwYXRoU3RhdHVzXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgY2FjaGVkIHN0YXR1cyBmb3IgdGhlIGdpdmVuIHBhdGguXG4gICNcbiAgIyAqIGBwYXRoYCBBIHtTdHJpbmd9IHBhdGggaW4gdGhlIHJlcG9zaXRvcnksIHJlbGF0aXZlIG9yIGFic29sdXRlLlxuICAjXG4gICMgUmV0dXJucyBhIHN0YXR1cyB7TnVtYmVyfSBvciBudWxsIGlmIHRoZSBwYXRoIGlzIG5vdCBpbiB0aGUgY2FjaGUuXG4gIGdldENhY2hlZFBhdGhTdGF0dXM6IChwYXRoKSAtPlxuICAgIEBzdGF0dXNlc1tAcmVsYXRpdml6ZShwYXRoKV1cblxuICAjIFB1YmxpYzogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBzdGF0dXMgaW5kaWNhdGVzIG1vZGlmaWNhdGlvbi5cbiAgI1xuICAjICogYHN0YXR1c2AgQSB7TnVtYmVyfSByZXByZXNlbnRpbmcgdGhlIHN0YXR1cy5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gdGhhdCdzIHRydWUgaWYgdGhlIGBzdGF0dXNgIGluZGljYXRlcyBtb2RpZmljYXRpb24uXG4gIGlzU3RhdHVzTW9kaWZpZWQ6IChzdGF0dXMpIC0+IEBnZXRSZXBvKCkuaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gc3RhdHVzIGluZGljYXRlcyBhIG5ldyBwYXRoLlxuICAjXG4gICMgKiBgc3RhdHVzYCBBIHtOdW1iZXJ9IHJlcHJlc2VudGluZyB0aGUgc3RhdHVzLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSB0aGF0J3MgdHJ1ZSBpZiB0aGUgYHN0YXR1c2AgaW5kaWNhdGVzIGEgbmV3IHBhdGguXG4gIGlzU3RhdHVzTmV3OiAoc3RhdHVzKSAtPiBAZ2V0UmVwbygpLmlzU3RhdHVzTmV3KHN0YXR1cylcblxuICAjIyNcbiAgU2VjdGlvbjogUmV0cmlldmluZyBEaWZmc1xuICAjIyNcblxuICAjIFB1YmxpYzogUmV0cmlldmVzIHRoZSBudW1iZXIgb2YgbGluZXMgYWRkZWQgYW5kIHJlbW92ZWQgdG8gYSBwYXRoLlxuICAjXG4gICMgVGhpcyBjb21wYXJlcyB0aGUgd29ya2luZyBkaXJlY3RvcnkgY29udGVudHMgb2YgdGhlIHBhdGggdG8gdGhlIGBIRUFEYFxuICAjIHZlcnNpb24uXG4gICNcbiAgIyAqIGBwYXRoYCBUaGUge1N0cmluZ30gcGF0aCB0byBjaGVjay5cbiAgI1xuICAjIFJldHVybnMgYW4ge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAqIGBhZGRlZGAgVGhlIHtOdW1iZXJ9IG9mIGFkZGVkIGxpbmVzLlxuICAjICAgKiBgZGVsZXRlZGAgVGhlIHtOdW1iZXJ9IG9mIGRlbGV0ZWQgbGluZXMuXG4gIGdldERpZmZTdGF0czogKHBhdGgpIC0+XG4gICAgcmVwbyA9IEBnZXRSZXBvKHBhdGgpXG4gICAgcmVwby5nZXREaWZmU3RhdHMocmVwby5yZWxhdGl2aXplKHBhdGgpKVxuXG4gICMgUHVibGljOiBSZXRyaWV2ZXMgdGhlIGxpbmUgZGlmZnMgY29tcGFyaW5nIHRoZSBgSEVBRGAgdmVyc2lvbiBvZiB0aGUgZ2l2ZW5cbiAgIyBwYXRoIGFuZCB0aGUgZ2l2ZW4gdGV4dC5cbiAgI1xuICAjICogYHBhdGhgIFRoZSB7U3RyaW5nfSBwYXRoIHJlbGF0aXZlIHRvIHRoZSByZXBvc2l0b3J5LlxuICAjICogYHRleHRgIFRoZSB7U3RyaW5nfSB0byBjb21wYXJlIGFnYWluc3QgdGhlIGBIRUFEYCBjb250ZW50c1xuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIGh1bmsge09iamVjdH1zIHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgb2xkU3RhcnRgIFRoZSBsaW5lIHtOdW1iZXJ9IG9mIHRoZSBvbGQgaHVuay5cbiAgIyAgICogYG5ld1N0YXJ0YCBUaGUgbGluZSB7TnVtYmVyfSBvZiB0aGUgbmV3IGh1bmsuXG4gICMgICAqIGBvbGRMaW5lc2AgVGhlIHtOdW1iZXJ9IG9mIGxpbmVzIGluIHRoZSBvbGQgaHVuay5cbiAgIyAgICogYG5ld0xpbmVzYCBUaGUge051bWJlcn0gb2YgbGluZXMgaW4gdGhlIG5ldyBodW5rXG4gIGdldExpbmVEaWZmczogKHBhdGgsIHRleHQpIC0+XG4gICAgIyBJZ25vcmUgZW9sIG9mIGxpbmUgZGlmZmVyZW5jZXMgb24gd2luZG93cyBzbyB0aGF0IGZpbGVzIGNoZWNrZWQgaW4gYXNcbiAgICAjIExGIGRvbid0IHJlcG9ydCBldmVyeSBsaW5lIG1vZGlmaWVkIHdoZW4gdGhlIHRleHQgY29udGFpbnMgQ1JMRiBlbmRpbmdzLlxuICAgIG9wdGlvbnMgPSBpZ25vcmVFb2xXaGl0ZXNwYWNlOiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcbiAgICByZXBvID0gQGdldFJlcG8ocGF0aClcbiAgICByZXBvLmdldExpbmVEaWZmcyhyZXBvLnJlbGF0aXZpemUocGF0aCksIHRleHQsIG9wdGlvbnMpXG5cbiAgIyMjXG4gIFNlY3Rpb246IENoZWNraW5nIE91dFxuICAjIyNcblxuICAjIFB1YmxpYzogUmVzdG9yZSB0aGUgY29udGVudHMgb2YgYSBwYXRoIGluIHRoZSB3b3JraW5nIGRpcmVjdG9yeSBhbmQgaW5kZXhcbiAgIyB0byB0aGUgdmVyc2lvbiBhdCBgSEVBRGAuXG4gICNcbiAgIyBUaGlzIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIHJ1bm5pbmc6XG4gICNcbiAgIyBgYGBzaFxuICAjICAgZ2l0IHJlc2V0IEhFQUQgLS0gPHBhdGg+XG4gICMgICBnaXQgY2hlY2tvdXQgSEVBRCAtLSA8cGF0aD5cbiAgIyBgYGBcbiAgI1xuICAjICogYHBhdGhgIFRoZSB7U3RyaW5nfSBwYXRoIHRvIGNoZWNrb3V0LlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSB0aGF0J3MgdHJ1ZSBpZiB0aGUgbWV0aG9kIHdhcyBzdWNjZXNzZnVsLlxuICBjaGVja291dEhlYWQ6IChwYXRoKSAtPlxuICAgIHJlcG8gPSBAZ2V0UmVwbyhwYXRoKVxuICAgIGhlYWRDaGVja2VkT3V0ID0gcmVwby5jaGVja291dEhlYWQocmVwby5yZWxhdGl2aXplKHBhdGgpKVxuICAgIEBnZXRQYXRoU3RhdHVzKHBhdGgpIGlmIGhlYWRDaGVja2VkT3V0XG4gICAgaGVhZENoZWNrZWRPdXRcblxuICAjIFB1YmxpYzogQ2hlY2tzIG91dCBhIGJyYW5jaCBpbiB5b3VyIHJlcG9zaXRvcnkuXG4gICNcbiAgIyAqIGByZWZlcmVuY2VgIFRoZSB7U3RyaW5nfSByZWZlcmVuY2UgdG8gY2hlY2tvdXQuXG4gICMgKiBgY3JlYXRlYCAgICBBIHtCb29sZWFufSB2YWx1ZSB3aGljaCwgaWYgdHJ1ZSBjcmVhdGVzIHRoZSBuZXcgcmVmZXJlbmNlIGlmXG4gICMgICBpdCBkb2Vzbid0IGV4aXN0LlxuICAjXG4gICMgUmV0dXJucyBhIEJvb2xlYW4gdGhhdCdzIHRydWUgaWYgdGhlIG1ldGhvZCB3YXMgc3VjY2Vzc2Z1bC5cbiAgY2hlY2tvdXRSZWZlcmVuY2U6IChyZWZlcmVuY2UsIGNyZWF0ZSkgLT5cbiAgICBAZ2V0UmVwbygpLmNoZWNrb3V0UmVmZXJlbmNlKHJlZmVyZW5jZSwgY3JlYXRlKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQcml2YXRlXG4gICMjI1xuXG4gICMgU3Vic2NyaWJlcyB0byBidWZmZXIgZXZlbnRzLlxuICBzdWJzY3JpYmVUb0J1ZmZlcjogKGJ1ZmZlcikgLT5cbiAgICBnZXRCdWZmZXJQYXRoU3RhdHVzID0gPT5cbiAgICAgIGlmIGJ1ZmZlclBhdGggPSBidWZmZXIuZ2V0UGF0aCgpXG4gICAgICAgIEBnZXRQYXRoU3RhdHVzKGJ1ZmZlclBhdGgpXG5cbiAgICBidWZmZXJTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBidWZmZXJTdWJzY3JpcHRpb25zLmFkZCBidWZmZXIub25EaWRTYXZlKGdldEJ1ZmZlclBhdGhTdGF0dXMpXG4gICAgYnVmZmVyU3Vic2NyaXB0aW9ucy5hZGQgYnVmZmVyLm9uRGlkUmVsb2FkKGdldEJ1ZmZlclBhdGhTdGF0dXMpXG4gICAgYnVmZmVyU3Vic2NyaXB0aW9ucy5hZGQgYnVmZmVyLm9uRGlkQ2hhbmdlUGF0aChnZXRCdWZmZXJQYXRoU3RhdHVzKVxuICAgIGJ1ZmZlclN1YnNjcmlwdGlvbnMuYWRkIGJ1ZmZlci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIGJ1ZmZlclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUoYnVmZmVyU3Vic2NyaXB0aW9ucylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYnVmZmVyU3Vic2NyaXB0aW9ucylcbiAgICByZXR1cm5cblxuICAjIFN1YnNjcmliZXMgdG8gZWRpdG9yIHZpZXcgZXZlbnQuXG4gIGNoZWNrb3V0SGVhZEZvckVkaXRvcjogKGVkaXRvcikgLT5cbiAgICBpZiBmaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGVkaXRvci5idWZmZXIucmVsb2FkKCkgaWYgZWRpdG9yLmJ1ZmZlci5pc01vZGlmaWVkKClcbiAgICAgIEBjaGVja291dEhlYWQoZmlsZVBhdGgpXG5cbiAgIyBSZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIHtSZXBvc2l0b3J5fVxuICBnZXRSZXBvOiAocGF0aCkgLT5cbiAgICBpZiBAcmVwbz9cbiAgICAgIEByZXBvLnN1Ym1vZHVsZUZvclBhdGgocGF0aCkgPyBAcmVwb1xuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcG9zaXRvcnkgaGFzIGJlZW4gZGVzdHJveWVkXCIpXG5cbiAgIyBSZXJlYWQgdGhlIGluZGV4IHRvIHVwZGF0ZSBhbnkgdmFsdWVzIHRoYXQgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZVxuICAjIGxhc3QgdGltZSB0aGUgaW5kZXggd2FzIHJlYWQuXG4gIHJlZnJlc2hJbmRleDogLT4gQGdldFJlcG8oKS5yZWZyZXNoSW5kZXgoKVxuXG4gICMgUmVmcmVzaGVzIHRoZSBjdXJyZW50IGdpdCBzdGF0dXMgaW4gYW4gb3V0c2lkZSBwcm9jZXNzIGFuZCBhc3luY2hyb25vdXNseVxuICAjIHVwZGF0ZXMgdGhlIHJlbGV2YW50IHByb3BlcnRpZXMuXG4gIHJlZnJlc2hTdGF0dXM6IC0+XG4gICAgQGhhbmRsZXJQYXRoID89IHJlcXVpcmUucmVzb2x2ZSgnLi9yZXBvc2l0b3J5LXN0YXR1cy1oYW5kbGVyJylcblxuICAgIHJlbGF0aXZlUHJvamVjdFBhdGhzID0gQHByb2plY3Q/LmdldFBhdGhzKClcbiAgICAgIC5tYXAgKHByb2plY3RQYXRoKSA9PiBAcmVsYXRpdml6ZShwcm9qZWN0UGF0aClcbiAgICAgIC5maWx0ZXIgKHByb2plY3RQYXRoKSAtPiBwcm9qZWN0UGF0aC5sZW5ndGggPiAwIGFuZCBub3QgcGF0aC5pc0Fic29sdXRlKHByb2plY3RQYXRoKVxuXG4gICAgQHN0YXR1c1Rhc2s/LnRlcm1pbmF0ZSgpXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICBAc3RhdHVzVGFzayA9IFRhc2sub25jZSBAaGFuZGxlclBhdGgsIEBnZXRQYXRoKCksIHJlbGF0aXZlUHJvamVjdFBhdGhzLCAoe3N0YXR1c2VzLCB1cHN0cmVhbSwgYnJhbmNoLCBzdWJtb2R1bGVzfSkgPT5cbiAgICAgICAgc3RhdHVzZXNVbmNoYW5nZWQgPSBfLmlzRXF1YWwoc3RhdHVzZXMsIEBzdGF0dXNlcykgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0VxdWFsKHVwc3RyZWFtLCBAdXBzdHJlYW0pIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNFcXVhbChicmFuY2gsIEBicmFuY2gpIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNFcXVhbChzdWJtb2R1bGVzLCBAc3VibW9kdWxlcylcblxuICAgICAgICBAc3RhdHVzZXMgPSBzdGF0dXNlc1xuICAgICAgICBAdXBzdHJlYW0gPSB1cHN0cmVhbVxuICAgICAgICBAYnJhbmNoID0gYnJhbmNoXG4gICAgICAgIEBzdWJtb2R1bGVzID0gc3VibW9kdWxlc1xuXG4gICAgICAgIGZvciBzdWJtb2R1bGVQYXRoLCBzdWJtb2R1bGVSZXBvIG9mIEBnZXRSZXBvKCkuc3VibW9kdWxlc1xuICAgICAgICAgIHN1Ym1vZHVsZVJlcG8udXBzdHJlYW0gPSBzdWJtb2R1bGVzW3N1Ym1vZHVsZVBhdGhdPy51cHN0cmVhbSA/IHthaGVhZDogMCwgYmVoaW5kOiAwfVxuXG4gICAgICAgIHVubGVzcyBzdGF0dXNlc1VuY2hhbmdlZFxuICAgICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2Utc3RhdHVzZXMnXG4gICAgICAgIHJlc29sdmUoKVxuIl19
