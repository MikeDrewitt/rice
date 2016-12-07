(function() {
  var GitRepository, Minimatch, PathLoader, PathsChunkSize, _, async, emittedPaths, fs, path;

  async = require('async');

  fs = require('fs');

  path = require('path');

  _ = require('underscore-plus');

  GitRepository = require('atom').GitRepository;

  Minimatch = require('minimatch').Minimatch;

  PathsChunkSize = 100;

  emittedPaths = new Set;

  PathLoader = (function() {
    function PathLoader(rootPath1, ignoreVcsIgnores, traverseSymlinkDirectories, ignoredNames1) {
      var repo;
      this.rootPath = rootPath1;
      this.traverseSymlinkDirectories = traverseSymlinkDirectories;
      this.ignoredNames = ignoredNames1;
      this.paths = [];
      this.realPathCache = {};
      this.repo = null;
      if (ignoreVcsIgnores) {
        repo = GitRepository.open(this.rootPath, {
          refreshOnWindowFocus: false
        });
        if ((repo != null ? repo.relativize(path.join(this.rootPath, 'test')) : void 0) === 'test') {
          this.repo = repo;
        }
      }
    }

    PathLoader.prototype.load = function(done) {
      return this.loadPath(this.rootPath, true, (function(_this) {
        return function() {
          var ref;
          _this.flushPaths();
          if ((ref = _this.repo) != null) {
            ref.destroy();
          }
          return done();
        };
      })(this));
    };

    PathLoader.prototype.isIgnored = function(loadedPath) {
      var i, ignoredName, len, ref, ref1, relativePath;
      relativePath = path.relative(this.rootPath, loadedPath);
      if ((ref = this.repo) != null ? ref.isPathIgnored(relativePath) : void 0) {
        return true;
      } else {
        ref1 = this.ignoredNames;
        for (i = 0, len = ref1.length; i < len; i++) {
          ignoredName = ref1[i];
          if (ignoredName.match(relativePath)) {
            return true;
          }
        }
      }
    };

    PathLoader.prototype.pathLoaded = function(loadedPath, done) {
      if (!(this.isIgnored(loadedPath) || emittedPaths.has(loadedPath))) {
        this.paths.push(loadedPath);
        emittedPaths.add(loadedPath);
      }
      if (this.paths.length === PathsChunkSize) {
        this.flushPaths();
      }
      return done();
    };

    PathLoader.prototype.flushPaths = function() {
      emit('load-paths:paths-found', this.paths);
      return this.paths = [];
    };

    PathLoader.prototype.loadPath = function(pathToLoad, root, done) {
      if (this.isIgnored(pathToLoad) && !root) {
        return done();
      }
      return fs.lstat(pathToLoad, (function(_this) {
        return function(error, stats) {
          if (error != null) {
            return done();
          }
          if (stats.isSymbolicLink()) {
            return _this.isInternalSymlink(pathToLoad, function(isInternal) {
              if (isInternal) {
                return done();
              }
              return fs.stat(pathToLoad, function(error, stats) {
                if (error != null) {
                  return done();
                }
                if (stats.isFile()) {
                  return _this.pathLoaded(pathToLoad, done);
                } else if (stats.isDirectory()) {
                  if (_this.traverseSymlinkDirectories) {
                    return _this.loadFolder(pathToLoad, done);
                  } else {
                    return done();
                  }
                } else {
                  return done();
                }
              });
            });
          } else if (stats.isDirectory()) {
            return _this.loadFolder(pathToLoad, done);
          } else if (stats.isFile()) {
            return _this.pathLoaded(pathToLoad, done);
          } else {
            return done();
          }
        };
      })(this));
    };

    PathLoader.prototype.loadFolder = function(folderPath, done) {
      return fs.readdir(folderPath, (function(_this) {
        return function(error, children) {
          if (children == null) {
            children = [];
          }
          return async.each(children, function(childName, next) {
            return _this.loadPath(path.join(folderPath, childName), false, next);
          }, done);
        };
      })(this));
    };

    PathLoader.prototype.isInternalSymlink = function(pathToLoad, done) {
      return fs.realpath(pathToLoad, this.realPathCache, (function(_this) {
        return function(err, realPath) {
          if (err) {
            return done(false);
          } else {
            return done(realPath.search(_this.rootPath) === 0);
          }
        };
      })(this));
    };

    return PathLoader;

  })();

  module.exports = function(rootPaths, followSymlinks, ignoreVcsIgnores, ignores) {
    var error, i, ignore, ignoredNames, len;
    if (ignores == null) {
      ignores = [];
    }
    ignoredNames = [];
    for (i = 0, len = ignores.length; i < len; i++) {
      ignore = ignores[i];
      if (ignore) {
        try {
          ignoredNames.push(new Minimatch(ignore, {
            matchBase: true,
            dot: true
          }));
        } catch (error1) {
          error = error1;
          console.warn("Error parsing ignore pattern (" + ignore + "): " + error.message);
        }
      }
    }
    return async.each(rootPaths, function(rootPath, next) {
      return new PathLoader(rootPath, ignoreVcsIgnores, followSymlinks, ignoredNames).load(next);
    }, this.async());
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL2xvYWQtcGF0aHMtaGFuZGxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFDUixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsZ0JBQWlCLE9BQUEsQ0FBUSxNQUFSOztFQUNqQixZQUFhLE9BQUEsQ0FBUSxXQUFSOztFQUVkLGNBQUEsR0FBaUI7O0VBRWpCLFlBQUEsR0FBZSxJQUFJOztFQUViO0lBQ1Msb0JBQUMsU0FBRCxFQUFZLGdCQUFaLEVBQThCLDBCQUE5QixFQUEyRCxhQUEzRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsV0FBRDtNQUE2QixJQUFDLENBQUEsNkJBQUQ7TUFBNkIsSUFBQyxDQUFBLGVBQUQ7TUFDdEUsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSxJQUFELEdBQVE7TUFDUixJQUFHLGdCQUFIO1FBQ0UsSUFBQSxHQUFPLGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQUMsQ0FBQSxRQUFwQixFQUE4QjtVQUFBLG9CQUFBLEVBQXNCLEtBQXRCO1NBQTlCO1FBQ1Asb0JBQWdCLElBQUksQ0FBRSxVQUFOLENBQWlCLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQVgsRUFBcUIsTUFBckIsQ0FBakIsV0FBQSxLQUFrRCxNQUFsRTtVQUFBLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBUjtTQUZGOztJQUpXOzt5QkFRYixJQUFBLEdBQU0s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WSxDQUFDLElBQWIsQ0FBc0IsSUFBQSxTQUFBLENBQVUsTUFBVixFQUFrQjtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQWlCLEdBQUEsRUFBSyxJQUF0QjtXQUFsQixDQUF0QixFQURGO1NBQUEsY0FBQTtVQUVNO1VBQ0osT0FBTyxDQUFDLElBQVIsQ0FBYSxnQ0FBQSxHQUFpQyxNQUFqQyxHQUF3QyxLQUF4QyxHQUE2QyxLQUFLLENBQUMsT0FBaEUsRUFIRjs7O0FBREY7V0FNQSxLQUFLLENBQUMsSUFBTixDQUNFLFNBREYsRUFFRSxTQUFDLFFBQUQsRUFBVyxJQUFYO2FBQ00sSUFBQSxVQUFBLENBQ0YsUUFERSxFQUVGLGdCQUZFLEVBR0YsY0FIRSxFQUlGLFlBSkUsQ0FLSCxDQUFDLElBTEUsQ0FLRyxJQUxIO0lBRE4sQ0FGRixFQVNFLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FURjtFQVJlO0FBeEZqQiIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSAnYXN5bmMnXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0dpdFJlcG9zaXRvcnl9ID0gcmVxdWlyZSAnYXRvbSdcbntNaW5pbWF0Y2h9ID0gcmVxdWlyZSAnbWluaW1hdGNoJ1xuXG5QYXRoc0NodW5rU2l6ZSA9IDEwMFxuXG5lbWl0dGVkUGF0aHMgPSBuZXcgU2V0XG5cbmNsYXNzIFBhdGhMb2FkZXJcbiAgY29uc3RydWN0b3I6IChAcm9vdFBhdGgsIGlnbm9yZVZjc0lnbm9yZXMsIEB0cmF2ZXJzZVN5bWxpbmtEaXJlY3RvcmllcywgQGlnbm9yZWROYW1lcykgLT5cbiAgICBAcGF0aHMgPSBbXVxuICAgIEByZWFsUGF0aENhY2hlID0ge31cbiAgICBAcmVwbyA9IG51bGxcbiAgICBpZiBpZ25vcmVWY3NJZ25vcmVzXG4gICAgICByZXBvID0gR2l0UmVwb3NpdG9yeS5vcGVuKEByb290UGF0aCwgcmVmcmVzaE9uV2luZG93Rm9jdXM6IGZhbHNlKVxuICAgICAgQHJlcG8gPSByZXBvIGlmIHJlcG8/LnJlbGF0aXZpemUocGF0aC5qb2luKEByb290UGF0aCwgJ3Rlc3QnKSkgaXMgJ3Rlc3QnXG5cbiAgbG9hZDogKGRvbmUpIC0+XG4gICAgQGxvYWRQYXRoIEByb290UGF0aCwgdHJ1ZSwgPT5cbiAgICAgIEBmbHVzaFBhdGhzKClcbiAgICAgIEByZXBvPy5kZXN0cm95KClcbiAgICAgIGRvbmUoKVxuXG4gIGlzSWdub3JlZDogKGxvYWRlZFBhdGgpIC0+XG4gICAgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShAcm9vdFBhdGgsIGxvYWRlZFBhdGgpXG4gICAgaWYgQHJlcG8/LmlzUGF0aElnbm9yZWQocmVsYXRpdmVQYXRoKVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZvciBpZ25vcmVkTmFtZSBpbiBAaWdub3JlZE5hbWVzXG4gICAgICAgIHJldHVybiB0cnVlIGlmIGlnbm9yZWROYW1lLm1hdGNoKHJlbGF0aXZlUGF0aClcblxuICBwYXRoTG9hZGVkOiAobG9hZGVkUGF0aCwgZG9uZSkgLT5cbiAgICB1bmxlc3MgQGlzSWdub3JlZChsb2FkZWRQYXRoKSBvciBlbWl0dGVkUGF0aHMuaGFzKGxvYWRlZFBhdGgpXG4gICAgICBAcGF0aHMucHVzaChsb2FkZWRQYXRoKVxuICAgICAgZW1pdHRlZFBhdGhzLmFkZChsb2FkZWRQYXRoKVxuXG4gICAgaWYgQHBhdGhzLmxlbmd0aCBpcyBQYXRoc0NodW5rU2l6ZVxuICAgICAgQGZsdXNoUGF0aHMoKVxuICAgIGRvbmUoKVxuXG4gIGZsdXNoUGF0aHM6IC0+XG4gICAgZW1pdCgnbG9hZC1wYXRoczpwYXRocy1mb3VuZCcsIEBwYXRocylcbiAgICBAcGF0aHMgPSBbXVxuXG4gIGxvYWRQYXRoOiAocGF0aFRvTG9hZCwgcm9vdCwgZG9uZSkgLT5cbiAgICByZXR1cm4gZG9uZSgpIGlmIEBpc0lnbm9yZWQocGF0aFRvTG9hZCkgYW5kIG5vdCByb290XG4gICAgZnMubHN0YXQgcGF0aFRvTG9hZCwgKGVycm9yLCBzdGF0cykgPT5cbiAgICAgIHJldHVybiBkb25lKCkgaWYgZXJyb3I/XG4gICAgICBpZiBzdGF0cy5pc1N5bWJvbGljTGluaygpXG4gICAgICAgIEBpc0ludGVybmFsU3ltbGluayBwYXRoVG9Mb2FkLCAoaXNJbnRlcm5hbCkgPT5cbiAgICAgICAgICByZXR1cm4gZG9uZSgpIGlmIGlzSW50ZXJuYWxcbiAgICAgICAgICBmcy5zdGF0IHBhdGhUb0xvYWQsIChlcnJvciwgc3RhdHMpID0+XG4gICAgICAgICAgICByZXR1cm4gZG9uZSgpIGlmIGVycm9yP1xuICAgICAgICAgICAgaWYgc3RhdHMuaXNGaWxlKClcbiAgICAgICAgICAgICAgQHBhdGhMb2FkZWQocGF0aFRvTG9hZCwgZG9uZSlcbiAgICAgICAgICAgIGVsc2UgaWYgc3RhdHMuaXNEaXJlY3RvcnkoKVxuICAgICAgICAgICAgICBpZiBAdHJhdmVyc2VTeW1saW5rRGlyZWN0b3JpZXNcbiAgICAgICAgICAgICAgICBAbG9hZEZvbGRlcihwYXRoVG9Mb2FkLCBkb25lKVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGRvbmUoKVxuICAgICAgZWxzZSBpZiBzdGF0cy5pc0RpcmVjdG9yeSgpXG4gICAgICAgIEBsb2FkRm9sZGVyKHBhdGhUb0xvYWQsIGRvbmUpXG4gICAgICBlbHNlIGlmIHN0YXRzLmlzRmlsZSgpXG4gICAgICAgIEBwYXRoTG9hZGVkKHBhdGhUb0xvYWQsIGRvbmUpXG4gICAgICBlbHNlXG4gICAgICAgIGRvbmUoKVxuXG4gIGxvYWRGb2xkZXI6IChmb2xkZXJQYXRoLCBkb25lKSAtPlxuICAgIGZzLnJlYWRkaXIgZm9sZGVyUGF0aCwgKGVycm9yLCBjaGlsZHJlbj1bXSkgPT5cbiAgICAgIGFzeW5jLmVhY2goXG4gICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAoY2hpbGROYW1lLCBuZXh0KSA9PlxuICAgICAgICAgIEBsb2FkUGF0aChwYXRoLmpvaW4oZm9sZGVyUGF0aCwgY2hpbGROYW1lKSwgZmFsc2UsIG5leHQpXG4gICAgICAgIGRvbmVcbiAgICAgIClcblxuICBpc0ludGVybmFsU3ltbGluazogKHBhdGhUb0xvYWQsIGRvbmUpIC0+XG4gICAgZnMucmVhbHBhdGggcGF0aFRvTG9hZCwgQHJlYWxQYXRoQ2FjaGUsIChlcnIsIHJlYWxQYXRoKSA9PlxuICAgICAgaWYgZXJyXG4gICAgICAgIGRvbmUoZmFsc2UpXG4gICAgICBlbHNlXG4gICAgICAgIGRvbmUocmVhbFBhdGguc2VhcmNoKEByb290UGF0aCkgaXMgMClcblxubW9kdWxlLmV4cG9ydHMgPSAocm9vdFBhdGhzLCBmb2xsb3dTeW1saW5rcywgaWdub3JlVmNzSWdub3JlcywgaWdub3Jlcz1bXSkgLT5cbiAgaWdub3JlZE5hbWVzID0gW11cbiAgZm9yIGlnbm9yZSBpbiBpZ25vcmVzIHdoZW4gaWdub3JlXG4gICAgdHJ5XG4gICAgICBpZ25vcmVkTmFtZXMucHVzaChuZXcgTWluaW1hdGNoKGlnbm9yZSwgbWF0Y2hCYXNlOiB0cnVlLCBkb3Q6IHRydWUpKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBjb25zb2xlLndhcm4gXCJFcnJvciBwYXJzaW5nIGlnbm9yZSBwYXR0ZXJuICgje2lnbm9yZX0pOiAje2Vycm9yLm1lc3NhZ2V9XCJcblxuICBhc3luYy5lYWNoKFxuICAgIHJvb3RQYXRocyxcbiAgICAocm9vdFBhdGgsIG5leHQpIC0+XG4gICAgICBuZXcgUGF0aExvYWRlcihcbiAgICAgICAgcm9vdFBhdGgsXG4gICAgICAgIGlnbm9yZVZjc0lnbm9yZXMsXG4gICAgICAgIGZvbGxvd1N5bWxpbmtzLFxuICAgICAgICBpZ25vcmVkTmFtZXNcbiAgICAgICkubG9hZChuZXh0KVxuICAgIEBhc3luYygpXG4gIClcbiJdfQ==
