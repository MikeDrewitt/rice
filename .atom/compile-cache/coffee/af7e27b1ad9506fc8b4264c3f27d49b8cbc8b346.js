(function() {
  var CompositeDisposable, Directory, Emitter, File, PathWatcher, _, fs, path, realpathCache, ref, repoForPath,
    slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  fs = require('fs-plus');

  PathWatcher = require('pathwatcher');

  File = require('./file');

  repoForPath = require('./helpers').repoForPath;

  realpathCache = {};

  module.exports = Directory = (function() {
    function Directory(arg) {
      var base, base1, fullPath, ref1;
      this.name = arg.name, fullPath = arg.fullPath, this.symlink = arg.symlink, this.expansionState = arg.expansionState, this.isRoot = arg.isRoot, this.ignoredPatterns = arg.ignoredPatterns, this.useSyncFS = arg.useSyncFS, this.stats = arg.stats;
      this.destroyed = false;
      this.emitter = new Emitter();
      this.subscriptions = new CompositeDisposable();
      if (atom.config.get('tree-view.squashDirectoryNames')) {
        fullPath = this.squashDirectoryNames(fullPath);
      }
      this.path = fullPath;
      this.realPath = this.path;
      if (fs.isCaseInsensitive()) {
        this.lowerCasePath = this.path.toLowerCase();
        this.lowerCaseRealPath = this.lowerCasePath;
      }
      if (this.isRoot == null) {
        this.isRoot = false;
      }
      if (this.expansionState == null) {
        this.expansionState = {};
      }
      if ((base = this.expansionState).isExpanded == null) {
        base.isExpanded = false;
      }
      if ((base1 = this.expansionState).entries == null) {
        base1.entries = {};
      }
      this.status = null;
      this.entries = {};
      this.submodule = (ref1 = repoForPath(this.path)) != null ? ref1.isSubmodule(this.path) : void 0;
      this.subscribeToRepo();
      this.updateStatus();
      this.loadRealPath();
    }

    Directory.prototype.destroy = function() {
      this.destroyed = true;
      this.unwatch();
      this.subscriptions.dispose();
      return this.emitter.emit('did-destroy');
    };

    Directory.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    Directory.prototype.onDidStatusChange = function(callback) {
      return this.emitter.on('did-status-change', callback);
    };

    Directory.prototype.onDidAddEntries = function(callback) {
      return this.emitter.on('did-add-entries', callback);
    };

    Directory.prototype.onDidRemoveEntries = function(callback) {
      return this.emitter.on('did-remove-entries', callback);
    };

    Directory.prototype.onDidCollapse = function(callback) {
      return this.emitter.on('did-collapse', callback);
    };

    Directory.prototype.onDidExpand = function(callback) {
      return this.emitter.on('did-expand', callback);
    };

    Directory.prototype.loadRealPath = function() {
      if (this.useSyncFS) {
        this.realPath = fs.realpathSync(this.path);
        if (fs.isCaseInsensitive()) {
          return this.lowerCaseRealPath = this.realPath.toLowerCase();
        }
      } else {
        return fs.realpath(this.path, realpathCache, (function(_this) {
          return function(error, realPath) {
            if (_this.destroyed) {
              return;
            }
            if (realPath && realPath !== _this.path) {
              _this.realPath = realPath;
              if (fs.isCaseInsensitive()) {
                _this.lowerCaseRealPath = _this.realPath.toLowerCase();
              }
              return _this.updateStatus();
            }
          };
        })(this));
      }
    };

    Directory.prototype.subscribeToRepo = function() {
      var repo;
      repo = repoForPath(this.path);
      if (repo == null) {
        return;
      }
      this.subscriptions.add(repo.onDidChangeStatus((function(_this) {
        return function(event) {
          if (_this.contains(event.path)) {
            return _this.updateStatus(repo);
          }
        };
      })(this)));
      return this.subscriptions.add(repo.onDidChangeStatuses((function(_this) {
        return function() {
          return _this.updateStatus(repo);
        };
      })(this)));
    };

    Directory.prototype.updateStatus = function() {
      var newStatus, repo, status;
      repo = repoForPath(this.path);
      if (repo == null) {
        return;
      }
      newStatus = null;
      if (repo.isPathIgnored(this.path)) {
        newStatus = 'ignored';
      } else {
        status = repo.getDirectoryStatus(this.path);
        if (repo.isStatusModified(status)) {
          newStatus = 'modified';
        } else if (repo.isStatusNew(status)) {
          newStatus = 'added';
        }
      }
      if (newStatus !== this.status) {
        this.status = newStatus;
        return this.emitter.emit('did-status-change', newStatus);
      }
    };

    Directory.prototype.isPathIgnored = function(filePath) {
      var i, ignoredPattern, len, ref1, repo;
      if (atom.config.get('tree-view.hideVcsIgnoredFiles')) {
        repo = repoForPath(this.path);
        if ((repo != null) && repo.isProjectAtRoot() && repo.isPathIgnored(filePath)) {
          return true;
        }
      }
      if (atom.config.get('tree-view.hideIgnoredNames')) {
        ref1 = this.ignoredPatterns;
        for (i = 0, len = ref1.length; i < len; i++) {
          ignoredPattern = ref1[i];
          if (ignoredPattern.match(filePath)) {
            return true;
          }
        }
      }
      return false;
    };

    Directory.prototype.isPathPrefixOf = function(prefix, fullPath) {
      return fullPath.indexOf(prefix) === 0 && fullPath[prefix.length] === path.sep;
    };

    Directory.prototype.isPathEqual = function(pathToCompare) {
      return this.path === pathToCompare || this.realPath === pathToCompare;
    };

    Directory.prototype.contains = function(pathToCheck) {
      var directoryPath;
      if (!pathToCheck) {
        return false;
      }
      if (process.platform === 'win32') {
        pathToCheck = pathToCheck.replace(/\//g, '\\');
      }
      if (fs.isCaseInsensitive()) {
        directoryPath = this.lowerCasePath;
        pathToCheck = pathToCheck.toLowerCase();
      } else {
        directoryPath = this.path;
      }
      if (this.isPathPrefixOf(directoryPath, pathToCheck)) {
        return true;
      }
      if (this.realPath !== this.path) {
        if (fs.isCaseInsensitive()) {
          directoryPath = this.lowerCaseRealPath;
        } else {
          directoryPath = this.realPath;
        }
        return this.isPathPrefixOf(directoryPath, pathToCheck);
      }
      return false;
    };

    Directory.prototype.unwatch = function() {
      var entry, key, ref1, results;
      if (this.watchSubscription != null) {
        this.watchSubscription.close();
        this.watchSubscription = null;
      }
      ref1 = this.entries;
      results = [];
      for (key in ref1) {
        entry = ref1[key];
        entry.destroy();
        results.push(delete this.entries[key]);
      }
      return results;
    };

    Directory.prototype.watch = function() {
      try {
        return this.watchSubscription != null ? this.watchSubscription : this.watchSubscription = PathWatcher.watch(this.path, (function(_this) {
          return function(eventType) {
            switch (eventType) {
              case 'change':
                return _this.reload();
              case 'delete':
                return _this.destroy();
            }
          };
        })(this));
      } catch (error1) {}
    };

    Directory.prototype.getEntries = function() {
      var directories, error, expansionState, files, fullPath, i, j, key, len, len1, name, names, ref1, ref2, stat, statFlat, symlink;
      try {
        names = fs.readdirSync(this.path);
      } catch (error1) {
        error = error1;
        names = [];
      }
      names.sort(new Intl.Collator(void 0, {
        numeric: true,
        sensitivity: "base"
      }).compare);
      files = [];
      directories = [];
      for (i = 0, len = names.length; i < len; i++) {
        name = names[i];
        fullPath = path.join(this.path, name);
        if (this.isPathIgnored(fullPath)) {
          continue;
        }
        stat = fs.lstatSyncNoException(fullPath);
        symlink = typeof stat.isSymbolicLink === "function" ? stat.isSymbolicLink() : void 0;
        if (symlink) {
          stat = fs.statSyncNoException(fullPath);
        }
        statFlat = _.pick.apply(_, [stat].concat(slice.call(_.keys(stat))));
        ref1 = ["atime", "birthtime", "ctime", "mtime"];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          key = ref1[j];
          statFlat[key] = (ref2 = statFlat[key]) != null ? ref2.getTime() : void 0;
        }
        if (typeof stat.isDirectory === "function" ? stat.isDirectory() : void 0) {
          if (this.entries.hasOwnProperty(name)) {
            directories.push(name);
          } else {
            expansionState = this.expansionState.entries[name];
            directories.push(new Directory({
              name: name,
              fullPath: fullPath,
              symlink: symlink,
              expansionState: expansionState,
              ignoredPatterns: this.ignoredPatterns,
              useSyncFS: this.useSyncFS,
              stats: statFlat
            }));
          }
        } else if (typeof stat.isFile === "function" ? stat.isFile() : void 0) {
          if (this.entries.hasOwnProperty(name)) {
            files.push(name);
          } else {
            files.push(new File({
              name: name,
              fullPath: fullPath,
              symlink: symlink,
              realpathCache: realpathCache,
              useSyncFS: this.useSyncFS,
              stats: statFlat
            }));
          }
        }
      }
      return this.sortEntries(directories.concat(files));
    };

    Directory.prototype.normalizeEntryName = function(value) {
      var normalizedValue;
      normalizedValue = value.name;
      if (normalizedValue == null) {
        normalizedValue = value;
      }
      if (normalizedValue != null) {
        normalizedValue = normalizedValue.toLowerCase();
      }
      return normalizedValue;
    };

    Directory.prototype.sortEntries = function(combinedEntries) {
      if (atom.config.get('tree-view.sortFoldersBeforeFiles')) {
        return combinedEntries;
      } else {
        return combinedEntries.sort((function(_this) {
          return function(first, second) {
            var firstName, secondName;
            firstName = _this.normalizeEntryName(first);
            secondName = _this.normalizeEntryName(second);
            return firstName.localeCompare(secondName);
          };
        })(this));
      }
    };

    Directory.prototype.reload = function() {
      var entriesRemoved, entry, i, index, j, len, len1, name, newEntries, ref1, removedEntries;
      newEntries = [];
      removedEntries = _.clone(this.entries);
      index = 0;
      ref1 = this.getEntries();
      for (i = 0, len = ref1.length; i < len; i++) {
        entry = ref1[i];
        if (this.entries.hasOwnProperty(entry)) {
          delete removedEntries[entry];
          index++;
          continue;
        }
        entry.indexInParentDirectory = index;
        index++;
        newEntries.push(entry);
      }
      entriesRemoved = false;
      for (name in removedEntries) {
        entry = removedEntries[name];
        entriesRemoved = true;
        entry.destroy();
        if (this.entries.hasOwnProperty(name)) {
          delete this.entries[name];
        }
        if (this.expansionState.entries.hasOwnProperty(name)) {
          delete this.expansionState.entries[name];
        }
      }
      if (entriesRemoved) {
        this.emitter.emit('did-remove-entries', removedEntries);
      }
      if (newEntries.length > 0) {
        for (j = 0, len1 = newEntries.length; j < len1; j++) {
          entry = newEntries[j];
          this.entries[entry.name] = entry;
        }
        return this.emitter.emit('did-add-entries', newEntries);
      }
    };

    Directory.prototype.collapse = function() {
      this.expansionState.isExpanded = false;
      this.expansionState = this.serializeExpansionState();
      this.unwatch();
      return this.emitter.emit('did-collapse');
    };

    Directory.prototype.expand = function() {
      this.expansionState.isExpanded = true;
      this.reload();
      this.watch();
      return this.emitter.emit('did-expand');
    };

    Directory.prototype.serializeExpansionState = function() {
      var entry, expansionState, name, ref1;
      expansionState = {};
      expansionState.isExpanded = this.expansionState.isExpanded;
      expansionState.entries = {};
      ref1 = this.entries;
      for (name in ref1) {
        entry = ref1[name];
        if (entry.expansionState != null) {
          expansionState.entries[name] = entry.serializeExpansionState();
        }
      }
      return expansionState;
    };

    Directory.prototype.squashDirectoryNames = function(fullPath) {
      var contents, relativeDir, squashedDirs;
      squashedDirs = [this.name];
      while (true) {
        contents = fs.listSync(fullPath);
        if (contents.length !== 1) {
          break;
        }
        if (!fs.isDirectorySync(contents[0])) {
          break;
        }
        relativeDir = path.relative(fullPath, contents[0]);
        squashedDirs.push(relativeDir);
        fullPath = path.join(fullPath, relativeDir);
      }
      if (squashedDirs.length > 1) {
        this.squashedNames = [squashedDirs.slice(0, +(squashedDirs.length - 2) + 1 || 9e9).join(path.sep) + path.sep, _.last(squashedDirs)];
      }
      return fullPath;
    };

    return Directory;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2RpcmVjdG9yeS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBaUMsT0FBQSxDQUFRLFdBQVIsQ0FBakMsRUFBQyw2Q0FBRCxFQUFzQjs7RUFDdEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFdBQUEsR0FBYyxPQUFBLENBQVEsYUFBUjs7RUFDZCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ04sY0FBZSxPQUFBLENBQVEsV0FBUjs7RUFDaEIsYUFBQSxHQUFnQjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLG1CQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsSUFBQyxDQUFBLFdBQUEsTUFBTSx5QkFBVSxJQUFDLENBQUEsY0FBQSxTQUFTLElBQUMsQ0FBQSxxQkFBQSxnQkFBZ0IsSUFBQyxDQUFBLGFBQUEsUUFBUSxJQUFDLENBQUEsc0JBQUEsaUJBQWlCLElBQUMsQ0FBQSxnQkFBQSxXQUFXLElBQUMsQ0FBQSxZQUFBO01BQ2pHLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsT0FBRCxHQUFlLElBQUEsT0FBQSxDQUFBO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxtQkFBQSxDQUFBO01BRXJCLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGdDQUFoQixDQUFIO1FBQ0UsUUFBQSxHQUFXLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixRQUF0QixFQURiOztNQUdBLElBQUMsQ0FBQSxJQUFELEdBQVE7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LENBQUksRUFBRSxDQUFDLGVBQUgsQ0FBbUIsUUFBUyxDQUFBLENBQUEsQ0FBNUIsQ0FBYjtBQUFBLGdCQUFBOztRQUNBLFdBQUEsR0FBYyxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQsRUFBd0IsUUFBUyxDQUFBLENBQUEsQ0FBakM7UUFDZCxZQUFZLENBQUMsSUFBYixDQUFrQixXQUFsQjtRQUNBLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLFFBQVYsRUFBb0IsV0FBcEI7TUFOYjtNQVFBLElBQUcsWUFBWSxDQUFDLE1BQWIsR0FBc0IsQ0FBekI7UUFDRSxJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFDLFlBQWEsZ0RBQTJCLENBQUMsSUFBekMsQ0FBOEMsSUFBSSxDQUFDLEdBQW5ELENBQUEsR0FBMEQsSUFBSSxDQUFDLEdBQWhFLEVBQXFFLENBQUMsQ0FBQyxJQUFGLENBQU8sWUFBUCxDQUFyRSxFQURuQjs7QUFHQSxhQUFPO0lBYmE7Ozs7O0FBeFJ4QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblBhdGhXYXRjaGVyID0gcmVxdWlyZSAncGF0aHdhdGNoZXInXG5GaWxlID0gcmVxdWlyZSAnLi9maWxlJ1xue3JlcG9Gb3JQYXRofSA9IHJlcXVpcmUgJy4vaGVscGVycydcbnJlYWxwYXRoQ2FjaGUgPSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBEaXJlY3RvcnlcbiAgY29uc3RydWN0b3I6ICh7QG5hbWUsIGZ1bGxQYXRoLCBAc3ltbGluaywgQGV4cGFuc2lvblN0YXRlLCBAaXNSb290LCBAaWdub3JlZFBhdHRlcm5zLCBAdXNlU3luY0ZTLCBAc3RhdHN9KSAtPlxuICAgIEBkZXN0cm95ZWQgPSBmYWxzZVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCd0cmVlLXZpZXcuc3F1YXNoRGlyZWN0b3J5TmFtZXMnKVxuICAgICAgZnVsbFBhdGggPSBAc3F1YXNoRGlyZWN0b3J5TmFtZXMoZnVsbFBhdGgpXG5cbiAgICBAcGF0aCA9IGZ1bGxQYXRoXG4gICAgQHJlYWxQYXRoID0gQHBhdGhcbiAgICBpZiBmcy5pc0Nhc2VJbnNlbnNpdGl2ZSgpXG4gICAgICBAbG93ZXJDYXNlUGF0aCA9IEBwYXRoLnRvTG93ZXJDYXNlKClcbiAgICAgIEBsb3dlckNhc2VSZWFsUGF0aCA9IEBsb3dlckNhc2VQYXRoXG5cbiAgICBAaXNSb290ID89IGZhbHNlXG4gICAgQGV4cGFuc2lvblN0YXRlID89IHt9XG4gICAgQGV4cGFuc2lvblN0YXRlLmlzRXhwYW5kZWQgPz0gZmFsc2VcbiAgICBAZXhwYW5zaW9uU3RhdGUuZW50cmllcyA/PSB7fVxuICAgIEBzdGF0dXMgPSBudWxsXG4gICAgQGVudHJpZXMgPSB7fVxuXG4gICAgQHN1Ym1vZHVsZSA9IHJlcG9Gb3JQYXRoKEBwYXRoKT8uaXNTdWJtb2R1bGUoQHBhdGgpXG5cbiAgICBAc3Vic2NyaWJlVG9SZXBvKClcbiAgICBAdXBkYXRlU3RhdHVzKClcbiAgICBAbG9hZFJlYWxQYXRoKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBkZXN0cm95ZWQgPSB0cnVlXG4gICAgQHVud2F0Y2goKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1kZXN0cm95JylcblxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBjYWxsYmFjaylcblxuICBvbkRpZFN0YXR1c0NoYW5nZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtc3RhdHVzLWNoYW5nZScsIGNhbGxiYWNrKVxuXG4gIG9uRGlkQWRkRW50cmllczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtYWRkLWVudHJpZXMnLCBjYWxsYmFjaylcblxuICBvbkRpZFJlbW92ZUVudHJpZXM6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLXJlbW92ZS1lbnRyaWVzJywgY2FsbGJhY2spXG5cbiAgb25EaWRDb2xsYXBzZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtY29sbGFwc2UnLCBjYWxsYmFjaylcblxuICBvbkRpZEV4cGFuZDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtZXhwYW5kJywgY2FsbGJhY2spXG5cbiAgbG9hZFJlYWxQYXRoOiAtPlxuICAgIGlmIEB1c2VTeW5jRlNcbiAgICAgIEByZWFsUGF0aCA9IGZzLnJlYWxwYXRoU3luYyhAcGF0aClcbiAgICAgIEBsb3dlckNhc2VSZWFsUGF0aCA9IEByZWFsUGF0aC50b0xvd2VyQ2FzZSgpIGlmIGZzLmlzQ2FzZUluc2Vuc2l0aXZlKClcbiAgICBlbHNlXG4gICAgICBmcy5yZWFscGF0aCBAcGF0aCwgcmVhbHBhdGhDYWNoZSwgKGVycm9yLCByZWFsUGF0aCkgPT5cbiAgICAgICAgcmV0dXJuIGlmIEBkZXN0cm95ZWRcbiAgICAgICAgaWYgcmVhbFBhdGggYW5kIHJlYWxQYXRoIGlzbnQgQHBhdGhcbiAgICAgICAgICBAcmVhbFBhdGggPSByZWFsUGF0aFxuICAgICAgICAgIEBsb3dlckNhc2VSZWFsUGF0aCA9IEByZWFsUGF0aC50b0xvd2VyQ2FzZSgpIGlmIGZzLmlzQ2FzZUluc2Vuc2l0aXZlKClcbiAgICAgICAgICBAdXBkYXRlU3RhdHVzKClcblxuICAjIFN1YnNjcmliZSB0byBwcm9qZWN0J3MgcmVwbyBmb3IgY2hhbmdlcyB0byB0aGUgR2l0IHN0YXR1cyBvZiB0aGlzIGRpcmVjdG9yeS5cbiAgc3Vic2NyaWJlVG9SZXBvOiAtPlxuICAgIHJlcG8gPSByZXBvRm9yUGF0aChAcGF0aClcbiAgICByZXR1cm4gdW5sZXNzIHJlcG8/XG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgcmVwby5vbkRpZENoYW5nZVN0YXR1cyAoZXZlbnQpID0+XG4gICAgICBAdXBkYXRlU3RhdHVzKHJlcG8pIGlmIEBjb250YWlucyhldmVudC5wYXRoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCByZXBvLm9uRGlkQ2hhbmdlU3RhdHVzZXMgPT5cbiAgICAgIEB1cGRhdGVTdGF0dXMocmVwbylcblxuICAjIFVwZGF0ZSB0aGUgc3RhdHVzIHByb3BlcnR5IG9mIHRoaXMgZGlyZWN0b3J5IHVzaW5nIHRoZSByZXBvLlxuICB1cGRhdGVTdGF0dXM6IC0+XG4gICAgcmVwbyA9IHJlcG9Gb3JQYXRoKEBwYXRoKVxuICAgIHJldHVybiB1bmxlc3MgcmVwbz9cblxuICAgIG5ld1N0YXR1cyA9IG51bGxcbiAgICBpZiByZXBvLmlzUGF0aElnbm9yZWQoQHBhdGgpXG4gICAgICBuZXdTdGF0dXMgPSAnaWdub3JlZCdcbiAgICBlbHNlXG4gICAgICBzdGF0dXMgPSByZXBvLmdldERpcmVjdG9yeVN0YXR1cyhAcGF0aClcbiAgICAgIGlmIHJlcG8uaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpXG4gICAgICAgIG5ld1N0YXR1cyA9ICdtb2RpZmllZCdcbiAgICAgIGVsc2UgaWYgcmVwby5pc1N0YXR1c05ldyhzdGF0dXMpXG4gICAgICAgIG5ld1N0YXR1cyA9ICdhZGRlZCdcblxuICAgIGlmIG5ld1N0YXR1cyBpc250IEBzdGF0dXNcbiAgICAgIEBzdGF0dXMgPSBuZXdTdGF0dXNcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1zdGF0dXMtY2hhbmdlJywgbmV3U3RhdHVzKVxuXG4gICMgSXMgdGhlIGdpdmVuIHBhdGggaWdub3JlZD9cbiAgaXNQYXRoSWdub3JlZDogKGZpbGVQYXRoKSAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldCgndHJlZS12aWV3LmhpZGVWY3NJZ25vcmVkRmlsZXMnKVxuICAgICAgcmVwbyA9IHJlcG9Gb3JQYXRoKEBwYXRoKVxuICAgICAgcmV0dXJuIHRydWUgaWYgcmVwbz8gYW5kIHJlcG8uaXNQcm9qZWN0QXRSb290KCkgYW5kIHJlcG8uaXNQYXRoSWdub3JlZChmaWxlUGF0aClcblxuICAgIGlmIGF0b20uY29uZmlnLmdldCgndHJlZS12aWV3LmhpZGVJZ25vcmVkTmFtZXMnKVxuICAgICAgZm9yIGlnbm9yZWRQYXR0ZXJuIGluIEBpZ25vcmVkUGF0dGVybnNcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgaWdub3JlZFBhdHRlcm4ubWF0Y2goZmlsZVBhdGgpXG5cbiAgICBmYWxzZVxuXG4gICMgRG9lcyBnaXZlbiBmdWxsIHBhdGggc3RhcnQgd2l0aCB0aGUgZ2l2ZW4gcHJlZml4P1xuICBpc1BhdGhQcmVmaXhPZjogKHByZWZpeCwgZnVsbFBhdGgpIC0+XG4gICAgZnVsbFBhdGguaW5kZXhPZihwcmVmaXgpIGlzIDAgYW5kIGZ1bGxQYXRoW3ByZWZpeC5sZW5ndGhdIGlzIHBhdGguc2VwXG5cbiAgaXNQYXRoRXF1YWw6IChwYXRoVG9Db21wYXJlKSAtPlxuICAgIEBwYXRoIGlzIHBhdGhUb0NvbXBhcmUgb3IgQHJlYWxQYXRoIGlzIHBhdGhUb0NvbXBhcmVcblxuICAjIFB1YmxpYzogRG9lcyB0aGlzIGRpcmVjdG9yeSBjb250YWluIHRoZSBnaXZlbiBwYXRoP1xuICAjXG4gICMgU2VlIGF0b20uRGlyZWN0b3J5Ojpjb250YWlucyBmb3IgbW9yZSBkZXRhaWxzLlxuICBjb250YWluczogKHBhdGhUb0NoZWNrKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcGF0aFRvQ2hlY2tcblxuICAgICMgTm9ybWFsaXplIGZvcndhcmQgc2xhc2hlcyB0byBiYWNrIHNsYXNoZXMgb24gd2luZG93c1xuICAgIHBhdGhUb0NoZWNrID0gcGF0aFRvQ2hlY2sucmVwbGFjZSgvXFwvL2csICdcXFxcJykgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG5cbiAgICBpZiBmcy5pc0Nhc2VJbnNlbnNpdGl2ZSgpXG4gICAgICBkaXJlY3RvcnlQYXRoID0gQGxvd2VyQ2FzZVBhdGhcbiAgICAgIHBhdGhUb0NoZWNrID0gcGF0aFRvQ2hlY2sudG9Mb3dlckNhc2UoKVxuICAgIGVsc2VcbiAgICAgIGRpcmVjdG9yeVBhdGggPSBAcGF0aFxuXG4gICAgcmV0dXJuIHRydWUgaWYgQGlzUGF0aFByZWZpeE9mKGRpcmVjdG9yeVBhdGgsIHBhdGhUb0NoZWNrKVxuXG4gICAgIyBDaGVjayByZWFsIHBhdGhcbiAgICBpZiBAcmVhbFBhdGggaXNudCBAcGF0aFxuICAgICAgaWYgZnMuaXNDYXNlSW5zZW5zaXRpdmUoKVxuICAgICAgICBkaXJlY3RvcnlQYXRoID0gQGxvd2VyQ2FzZVJlYWxQYXRoXG4gICAgICBlbHNlXG4gICAgICAgIGRpcmVjdG9yeVBhdGggPSBAcmVhbFBhdGhcblxuICAgICAgcmV0dXJuIEBpc1BhdGhQcmVmaXhPZihkaXJlY3RvcnlQYXRoLCBwYXRoVG9DaGVjaylcblxuICAgIGZhbHNlXG5cbiAgIyBQdWJsaWM6IFN0b3Agd2F0Y2hpbmcgdGhpcyBkaXJlY3RvcnkgZm9yIGNoYW5nZXMuXG4gIHVud2F0Y2g6IC0+XG4gICAgaWYgQHdhdGNoU3Vic2NyaXB0aW9uP1xuICAgICAgQHdhdGNoU3Vic2NyaXB0aW9uLmNsb3NlKClcbiAgICAgIEB3YXRjaFN1YnNjcmlwdGlvbiA9IG51bGxcblxuICAgIGZvciBrZXksIGVudHJ5IG9mIEBlbnRyaWVzXG4gICAgICBlbnRyeS5kZXN0cm95KClcbiAgICAgIGRlbGV0ZSBAZW50cmllc1trZXldXG5cbiAgIyBQdWJsaWM6IFdhdGNoIHRoaXMgZGlyZWN0b3J5IGZvciBjaGFuZ2VzLlxuICB3YXRjaDogLT5cbiAgICB0cnlcbiAgICAgIEB3YXRjaFN1YnNjcmlwdGlvbiA/PSBQYXRoV2F0Y2hlci53YXRjaCBAcGF0aCwgKGV2ZW50VHlwZSkgPT5cbiAgICAgICAgc3dpdGNoIGV2ZW50VHlwZVxuICAgICAgICAgIHdoZW4gJ2NoYW5nZScgdGhlbiBAcmVsb2FkKClcbiAgICAgICAgICB3aGVuICdkZWxldGUnIHRoZW4gQGRlc3Ryb3koKVxuXG4gIGdldEVudHJpZXM6IC0+XG4gICAgdHJ5XG4gICAgICBuYW1lcyA9IGZzLnJlYWRkaXJTeW5jKEBwYXRoKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBuYW1lcyA9IFtdXG4gICAgbmFtZXMuc29ydChuZXcgSW50bC5Db2xsYXRvcih1bmRlZmluZWQsIHtudW1lcmljOiB0cnVlLCBzZW5zaXRpdml0eTogXCJiYXNlXCJ9KS5jb21wYXJlKVxuXG4gICAgZmlsZXMgPSBbXVxuICAgIGRpcmVjdG9yaWVzID0gW11cblxuICAgIGZvciBuYW1lIGluIG5hbWVzXG4gICAgICBmdWxsUGF0aCA9IHBhdGguam9pbihAcGF0aCwgbmFtZSlcbiAgICAgIGNvbnRpbnVlIGlmIEBpc1BhdGhJZ25vcmVkKGZ1bGxQYXRoKVxuXG4gICAgICBzdGF0ID0gZnMubHN0YXRTeW5jTm9FeGNlcHRpb24oZnVsbFBhdGgpXG4gICAgICBzeW1saW5rID0gc3RhdC5pc1N5bWJvbGljTGluaz8oKVxuICAgICAgc3RhdCA9IGZzLnN0YXRTeW5jTm9FeGNlcHRpb24oZnVsbFBhdGgpIGlmIHN5bWxpbmtcbiAgICAgIHN0YXRGbGF0ID0gXy5waWNrIHN0YXQsIF8ua2V5cyhzdGF0KS4uLlxuICAgICAgZm9yIGtleSBpbiBbXCJhdGltZVwiLCBcImJpcnRodGltZVwiLCBcImN0aW1lXCIsIFwibXRpbWVcIl1cbiAgICAgICAgc3RhdEZsYXRba2V5XSA9IHN0YXRGbGF0W2tleV0/LmdldFRpbWUoKVxuXG4gICAgICBpZiBzdGF0LmlzRGlyZWN0b3J5PygpXG4gICAgICAgIGlmIEBlbnRyaWVzLmhhc093blByb3BlcnR5KG5hbWUpXG4gICAgICAgICAgIyBwdXNoIGEgcGxhY2Vob2xkZXIgc2luY2UgdGhpcyBlbnRyeSBhbHJlYWR5IGV4aXN0cyBidXQgdGhpcyBoZWxwc1xuICAgICAgICAgICMgdHJhY2sgdGhlIGluc2VydGlvbiBpbmRleCBmb3IgdGhlIGNyZWF0ZWQgdmlld3NcbiAgICAgICAgICBkaXJlY3Rvcmllcy5wdXNoKG5hbWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBleHBhbnNpb25TdGF0ZSA9IEBleHBhbnNpb25TdGF0ZS5lbnRyaWVzW25hbWVdXG4gICAgICAgICAgZGlyZWN0b3JpZXMucHVzaChuZXcgRGlyZWN0b3J5KHtuYW1lLCBmdWxsUGF0aCwgc3ltbGluaywgZXhwYW5zaW9uU3RhdGUsIEBpZ25vcmVkUGF0dGVybnMsIEB1c2VTeW5jRlMsIHN0YXRzOiBzdGF0RmxhdH0pKVxuICAgICAgZWxzZSBpZiBzdGF0LmlzRmlsZT8oKVxuICAgICAgICBpZiBAZW50cmllcy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuICAgICAgICAgICMgcHVzaCBhIHBsYWNlaG9sZGVyIHNpbmNlIHRoaXMgZW50cnkgYWxyZWFkeSBleGlzdHMgYnV0IHRoaXMgaGVscHNcbiAgICAgICAgICAjIHRyYWNrIHRoZSBpbnNlcnRpb24gaW5kZXggZm9yIHRoZSBjcmVhdGVkIHZpZXdzXG4gICAgICAgICAgZmlsZXMucHVzaChuYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZmlsZXMucHVzaChuZXcgRmlsZSh7bmFtZSwgZnVsbFBhdGgsIHN5bWxpbmssIHJlYWxwYXRoQ2FjaGUsIEB1c2VTeW5jRlMsIHN0YXRzOiBzdGF0RmxhdH0pKVxuXG4gICAgQHNvcnRFbnRyaWVzKGRpcmVjdG9yaWVzLmNvbmNhdChmaWxlcykpXG5cbiAgbm9ybWFsaXplRW50cnlOYW1lOiAodmFsdWUpIC0+XG4gICAgbm9ybWFsaXplZFZhbHVlID0gdmFsdWUubmFtZVxuICAgIHVubGVzcyBub3JtYWxpemVkVmFsdWU/XG4gICAgICBub3JtYWxpemVkVmFsdWUgPSB2YWx1ZVxuICAgIGlmIG5vcm1hbGl6ZWRWYWx1ZT9cbiAgICAgIG5vcm1hbGl6ZWRWYWx1ZSA9IG5vcm1hbGl6ZWRWYWx1ZS50b0xvd2VyQ2FzZSgpXG4gICAgbm9ybWFsaXplZFZhbHVlXG5cbiAgc29ydEVudHJpZXM6IChjb21iaW5lZEVudHJpZXMpIC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCd0cmVlLXZpZXcuc29ydEZvbGRlcnNCZWZvcmVGaWxlcycpXG4gICAgICBjb21iaW5lZEVudHJpZXNcbiAgICBlbHNlXG4gICAgICBjb21iaW5lZEVudHJpZXMuc29ydCAoZmlyc3QsIHNlY29uZCkgPT5cbiAgICAgICAgZmlyc3ROYW1lID0gQG5vcm1hbGl6ZUVudHJ5TmFtZShmaXJzdClcbiAgICAgICAgc2Vjb25kTmFtZSA9IEBub3JtYWxpemVFbnRyeU5hbWUoc2Vjb25kKVxuICAgICAgICBmaXJzdE5hbWUubG9jYWxlQ29tcGFyZShzZWNvbmROYW1lKVxuXG4gICMgUHVibGljOiBQZXJmb3JtIGEgc3luY2hyb25vdXMgcmVsb2FkIG9mIHRoZSBkaXJlY3RvcnkuXG4gIHJlbG9hZDogLT5cbiAgICBuZXdFbnRyaWVzID0gW11cbiAgICByZW1vdmVkRW50cmllcyA9IF8uY2xvbmUoQGVudHJpZXMpXG4gICAgaW5kZXggPSAwXG5cbiAgICBmb3IgZW50cnkgaW4gQGdldEVudHJpZXMoKVxuICAgICAgaWYgQGVudHJpZXMuaGFzT3duUHJvcGVydHkoZW50cnkpXG4gICAgICAgIGRlbGV0ZSByZW1vdmVkRW50cmllc1tlbnRyeV1cbiAgICAgICAgaW5kZXgrK1xuICAgICAgICBjb250aW51ZVxuXG4gICAgICBlbnRyeS5pbmRleEluUGFyZW50RGlyZWN0b3J5ID0gaW5kZXhcbiAgICAgIGluZGV4KytcbiAgICAgIG5ld0VudHJpZXMucHVzaChlbnRyeSlcblxuICAgIGVudHJpZXNSZW1vdmVkID0gZmFsc2VcbiAgICBmb3IgbmFtZSwgZW50cnkgb2YgcmVtb3ZlZEVudHJpZXNcbiAgICAgIGVudHJpZXNSZW1vdmVkID0gdHJ1ZVxuICAgICAgZW50cnkuZGVzdHJveSgpXG5cbiAgICAgIGlmIEBlbnRyaWVzLmhhc093blByb3BlcnR5KG5hbWUpXG4gICAgICAgIGRlbGV0ZSBAZW50cmllc1tuYW1lXVxuXG4gICAgICBpZiBAZXhwYW5zaW9uU3RhdGUuZW50cmllcy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuICAgICAgICBkZWxldGUgQGV4cGFuc2lvblN0YXRlLmVudHJpZXNbbmFtZV1cblxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1yZW1vdmUtZW50cmllcycsIHJlbW92ZWRFbnRyaWVzKSBpZiBlbnRyaWVzUmVtb3ZlZFxuXG4gICAgaWYgbmV3RW50cmllcy5sZW5ndGggPiAwXG4gICAgICBAZW50cmllc1tlbnRyeS5uYW1lXSA9IGVudHJ5IGZvciBlbnRyeSBpbiBuZXdFbnRyaWVzXG4gICAgICBAZW1pdHRlci5lbWl0KCdkaWQtYWRkLWVudHJpZXMnLCBuZXdFbnRyaWVzKVxuXG4gICMgUHVibGljOiBDb2xsYXBzZSB0aGlzIGRpcmVjdG9yeSBhbmQgc3RvcCB3YXRjaGluZyBpdC5cbiAgY29sbGFwc2U6IC0+XG4gICAgQGV4cGFuc2lvblN0YXRlLmlzRXhwYW5kZWQgPSBmYWxzZVxuICAgIEBleHBhbnNpb25TdGF0ZSA9IEBzZXJpYWxpemVFeHBhbnNpb25TdGF0ZSgpXG4gICAgQHVud2F0Y2goKVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jb2xsYXBzZScpXG5cbiAgIyBQdWJsaWM6IEV4cGFuZCB0aGlzIGRpcmVjdG9yeSwgbG9hZCBpdHMgY2hpbGRyZW4sIGFuZCBzdGFydCB3YXRjaGluZyBpdCBmb3JcbiAgIyBjaGFuZ2VzLlxuICBleHBhbmQ6IC0+XG4gICAgQGV4cGFuc2lvblN0YXRlLmlzRXhwYW5kZWQgPSB0cnVlXG4gICAgQHJlbG9hZCgpXG4gICAgQHdhdGNoKClcbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtZXhwYW5kJylcblxuICBzZXJpYWxpemVFeHBhbnNpb25TdGF0ZTogLT5cbiAgICBleHBhbnNpb25TdGF0ZSA9IHt9XG4gICAgZXhwYW5zaW9uU3RhdGUuaXNFeHBhbmRlZCA9IEBleHBhbnNpb25TdGF0ZS5pc0V4cGFuZGVkXG4gICAgZXhwYW5zaW9uU3RhdGUuZW50cmllcyA9IHt9XG4gICAgZm9yIG5hbWUsIGVudHJ5IG9mIEBlbnRyaWVzIHdoZW4gZW50cnkuZXhwYW5zaW9uU3RhdGU/XG4gICAgICBleHBhbnNpb25TdGF0ZS5lbnRyaWVzW25hbWVdID0gZW50cnkuc2VyaWFsaXplRXhwYW5zaW9uU3RhdGUoKVxuICAgIGV4cGFuc2lvblN0YXRlXG5cbiAgc3F1YXNoRGlyZWN0b3J5TmFtZXM6IChmdWxsUGF0aCkgLT5cbiAgICBzcXVhc2hlZERpcnMgPSBbQG5hbWVdXG4gICAgbG9vcFxuICAgICAgY29udGVudHMgPSBmcy5saXN0U3luYyBmdWxsUGF0aFxuICAgICAgYnJlYWsgaWYgY29udGVudHMubGVuZ3RoIGlzbnQgMVxuICAgICAgYnJlYWsgaWYgbm90IGZzLmlzRGlyZWN0b3J5U3luYyhjb250ZW50c1swXSlcbiAgICAgIHJlbGF0aXZlRGlyID0gcGF0aC5yZWxhdGl2ZShmdWxsUGF0aCwgY29udGVudHNbMF0pXG4gICAgICBzcXVhc2hlZERpcnMucHVzaCByZWxhdGl2ZURpclxuICAgICAgZnVsbFBhdGggPSBwYXRoLmpvaW4oZnVsbFBhdGgsIHJlbGF0aXZlRGlyKVxuXG4gICAgaWYgc3F1YXNoZWREaXJzLmxlbmd0aCA+IDFcbiAgICAgIEBzcXVhc2hlZE5hbWVzID0gW3NxdWFzaGVkRGlyc1swLi5zcXVhc2hlZERpcnMubGVuZ3RoIC0gMl0uam9pbihwYXRoLnNlcCkgKyBwYXRoLnNlcCwgXy5sYXN0KHNxdWFzaGVkRGlycyldXG5cbiAgICByZXR1cm4gZnVsbFBhdGhcbiJdfQ==
