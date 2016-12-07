(function() {
  var DefaultDirectoryProvider, Disposable, Emitter, GitRepositoryProvider, Model, Project, TextBuffer, _, fs, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  ref = require('event-kit'), Emitter = ref.Emitter, Disposable = ref.Disposable;

  TextBuffer = require('text-buffer');

  DefaultDirectoryProvider = require('./default-directory-provider');

  Model = require('./model');

  GitRepositoryProvider = require('./git-repository-provider');

  module.exports = Project = (function(superClass) {
    extend(Project, superClass);


    /*
    Section: Construction and Destruction
     */

    function Project(arg) {
      var config, packageManager;
      this.notificationManager = arg.notificationManager, packageManager = arg.packageManager, config = arg.config, this.applicationDelegate = arg.applicationDelegate;
      this.emitter = new Emitter;
      this.buffers = [];
      this.paths = [];
      this.rootDirectories = [];
      this.repositories = [];
      this.directoryProviders = [];
      this.defaultDirectoryProvider = new DefaultDirectoryProvider();
      this.repositoryPromisesByPath = new Map();
      this.repositoryProviders = [new GitRepositoryProvider(this, config)];
      this.consumeServices(packageManager);
    }

    Project.prototype.destroyed = function() {
      var buffer, j, len, ref1;
      ref1 = this.buffers;
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        buffer.destroy();
      }
      return this.setPaths([]);
    };

    Project.prototype.reset = function(packageManager) {
      var buffer, j, len, ref1;
      this.emitter.dispose();
      this.emitter = new Emitter;
      ref1 = this.buffers;
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        if (buffer != null) {
          buffer.destroy();
        }
      }
      this.buffers = [];
      this.setPaths([]);
      return this.consumeServices(packageManager);
    };

    Project.prototype.destroyUnretainedBuffers = function() {
      var buffer, j, len, ref1;
      ref1 = this.getBuffers();
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        if (!buffer.isRetained()) {
          buffer.destroy();
        }
      }
    };


    /*
    Section: Serialization
     */

    Project.prototype.deserialize = function(state) {
      var buffer, j, len, ref1;
      if (state.path != null) {
        state.paths = [state.path];
      }
      this.buffers = _.compact(state.buffers.map(function(bufferState) {
        var error;
        if (fs.isDirectorySync(bufferState.filePath)) {
          return;
        }
        if (bufferState.filePath) {
          try {
            fs.closeSync(fs.openSync(bufferState.filePath, 'r'));
          } catch (error1) {
            error = error1;
            if (error.code !== 'ENOENT') {
              return;
            }
          }
        }
        return TextBuffer.deserialize(bufferState);
      }));
      ref1 = this.buffers;
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        this.subscribeToBuffer(buffer);
      }
      return this.setPaths(state.paths);
    };

    Project.prototype.serialize = function(options) {
      if (options == null) {
        options = {};
      }
      return {
        deserializer: 'Project',
        paths: this.getPaths(),
        buffers: _.compact(this.buffers.map(function(buffer) {
          if (buffer.isRetained()) {
            return buffer.serialize({
              markerLayers: options.isUnloading === true
            });
          }
        }))
      };
    };


    /*
    Section: Event Subscription
     */

    Project.prototype.onDidChangePaths = function(callback) {
      return this.emitter.on('did-change-paths', callback);
    };

    Project.prototype.onDidAddBuffer = function(callback) {
      return this.emitter.on('did-add-buffer', callback);
    };

    Project.prototype.observeBuffers = function(callback) {
      var buffer, j, len, ref1;
      ref1 = this.getBuffers();
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        callback(buffer);
      }
      return this.onDidAddBuffer(callback);
    };


    /*
    Section: Accessing the git repository
     */

    Project.prototype.getRepositories = function() {
      return this.repositories;
    };

    Project.prototype.repositoryForDirectory = function(directory) {
      var pathForDirectory, promise, promises;
      pathForDirectory = directory.getRealPathSync();
      promise = this.repositoryPromisesByPath.get(pathForDirectory);
      if (!promise) {
        promises = this.repositoryProviders.map(function(provider) {
          return provider.repositoryForDirectory(directory);
        });
        promise = Promise.all(promises).then((function(_this) {
          return function(repositories) {
            var ref1, repo;
            repo = (ref1 = _.find(repositories, function(repo) {
              return repo != null;
            })) != null ? ref1 : null;
            if (repo == null) {
              _this.repositoryPromisesByPath["delete"](pathForDirectory);
            }
            if (repo != null) {
              if (typeof repo.onDidDestroy === "function") {
                repo.onDidDestroy(function() {
                  return _this.repositoryPromisesByPath["delete"](pathForDirectory);
                });
              }
            }
            return repo;
          };
        })(this));
        this.repositoryPromisesByPath.set(pathForDirectory, promise);
      }
      return promise;
    };


    /*
    Section: Managing Paths
     */

    Project.prototype.getPaths = function() {
      var j, len, ref1, results, rootDirectory;
      ref1 = this.rootDirectories;
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        rootDirectory = ref1[j];
        results.push(rootDirectory.getPath());
      }
      return results;
    };

    Project.prototype.setPaths = function(projectPaths) {
      var j, k, len, len1, projectPath, ref1, repository;
      ref1 = this.repositories;
      for (j = 0, len = ref1.length; j < len; j++) {
        repository = ref1[j];
        if (repository != null) {
          repository.destroy();
        }
      }
      this.rootDirectories = [];
      this.repositories = [];
      for (k = 0, len1 = projectPaths.length; k < len1; k++) {
        projectPath = projectPaths[k];
        this.addPath(projectPath, {
          emitEvent: false
        });
      }
      return this.emitter.emit('did-change-paths', projectPaths);
    };

    Project.prototype.addPath = function(projectPath, options) {
      var directory, existingDirectory, j, k, l, len, len1, len2, provider, ref1, ref2, ref3, repo;
      directory = null;
      ref1 = this.directoryProviders;
      for (j = 0, len = ref1.length; j < len; j++) {
        provider = ref1[j];
        if (directory = typeof provider.directoryForURISync === "function" ? provider.directoryForURISync(projectPath) : void 0) {
          break;
        }
      }
      if (directory == null) {
        directory = this.defaultDirectoryProvider.directoryForURISync(projectPath);
      }
      if (!directory.existsSync()) {
        return;
      }
      ref2 = this.getDirectories();
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        existingDirectory = ref2[k];
        if (existingDirectory.getPath() === directory.getPath()) {
          return;
        }
      }
      this.rootDirectories.push(directory);
      repo = null;
      ref3 = this.repositoryProviders;
      for (l = 0, len2 = ref3.length; l < len2; l++) {
        provider = ref3[l];
        if (repo = typeof provider.repositoryForDirectorySync === "function" ? provider.repositoryForDirectorySync(directory) : void 0) {
          break;
        }
      }
      this.repositories.push(repo != null ? repo : null);
      if ((options != null ? options.emitEvent : void 0) !== false) {
        return this.emitter.emit('did-change-paths', this.getPaths());
      }
    };

    Project.prototype.removePath = function(projectPath) {
      var directory, i, indexToRemove, j, len, ref1, removedDirectory, removedRepository;
      if (indexOf.call(this.getPaths(), projectPath) < 0) {
        projectPath = path.normalize(projectPath);
      }
      indexToRemove = null;
      ref1 = this.rootDirectories;
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        directory = ref1[i];
        if (directory.getPath() === projectPath) {
          indexToRemove = i;
          break;
        }
      }
      if (indexToRemove != null) {
        removedDirectory = this.rootDirectories.splice(indexToRemove, 1)[0];
        removedRepository = this.repositories.splice(indexToRemove, 1)[0];
        if (indexOf.call(this.repositories, removedRepository) < 0) {
          if (removedRepository != null) {
            removedRepository.destroy();
          }
        }
        this.emitter.emit("did-change-paths", this.getPaths());
        return true;
      } else {
        return false;
      }
    };

    Project.prototype.getDirectories = function() {
      return this.rootDirectories;
    };

    Project.prototype.resolvePath = function(uri) {
      var projectPath;
      if (!uri) {
        return;
      }
      if (uri != null ? uri.match(/[A-Za-z0-9+-.]+:\/\//) : void 0) {
        return uri;
      } else {
        if (fs.isAbsolute(uri)) {
          return path.normalize(fs.absolute(uri));
        } else if (projectPath = this.getPaths()[0]) {
          return path.normalize(fs.absolute(path.join(projectPath, uri)));
        } else {
          return void 0;
        }
      }
    };

    Project.prototype.relativize = function(fullPath) {
      return this.relativizePath(fullPath)[1];
    };

    Project.prototype.relativizePath = function(fullPath) {
      var j, len, ref1, relativePath, result, rootDirectory;
      result = [null, fullPath];
      if (fullPath != null) {
        ref1 = this.rootDirectories;
        for (j = 0, len = ref1.length; j < len; j++) {
          rootDirectory = ref1[j];
          relativePath = rootDirectory.relativize(fullPath);
          if ((relativePath != null ? relativePath.length : void 0) < result[1].length) {
            result = [rootDirectory.getPath(), relativePath];
          }
        }
      }
      return result;
    };

    Project.prototype.contains = function(pathToCheck) {
      return this.rootDirectories.some(function(dir) {
        return dir.contains(pathToCheck);
      });
    };


    /*
    Section: Private
     */

    Project.prototype.consumeServices = function(arg) {
      var serviceHub;
      serviceHub = arg.serviceHub;
      serviceHub.consume('atom.directory-provider', '^0.1.0', (function(_this) {
        return function(provider) {
          _this.directoryProviders.unshift(provider);
          return new Disposable(function() {
            return _this.directoryProviders.splice(_this.directoryProviders.indexOf(provider), 1);
          });
        };
      })(this));
      return serviceHub.consume('atom.repository-provider', '^0.1.0', (function(_this) {
        return function(provider) {
          _this.repositoryProviders.unshift(provider);
          if (indexOf.call(_this.repositories, null) >= 0) {
            _this.setPaths(_this.getPaths());
          }
          return new Disposable(function() {
            return _this.repositoryProviders.splice(_this.repositoryProviders.indexOf(provider), 1);
          });
        };
      })(this));
    };

    Project.prototype.getBuffers = function() {
      return this.buffers.slice();
    };

    Project.prototype.isPathModified = function(filePath) {
      var ref1;
      return (ref1 = this.findBufferForPath(this.resolvePath(filePath))) != null ? ref1.isModified() : void 0;
    };

    Project.prototype.findBufferForPath = function(filePath) {
      return _.find(this.buffers, function(buffer) {
        return buffer.getPath() === filePath;
      });
    };

    Project.prototype.findBufferForId = function(id) {
      return _.find(this.buffers, function(buffer) {
        return buffer.getId() === id;
      });
    };

    Project.prototype.bufferForPathSync = function(filePath) {
      var absoluteFilePath, existingBuffer;
      absoluteFilePath = this.resolvePath(filePath);
      if (filePath) {
        existingBuffer = this.findBufferForPath(absoluteFilePath);
      }
      return existingBuffer != null ? existingBuffer : this.buildBufferSync(absoluteFilePath);
    };

    Project.prototype.bufferForIdSync = function(id) {
      var existingBuffer;
      if (id) {
        existingBuffer = this.findBufferForId(id);
      }
      return existingBuffer != null ? existingBuffer : this.buildBufferSync();
    };

    Project.prototype.bufferForPath = function(absoluteFilePath) {
      var existingBuffer;
      if (absoluteFilePath != null) {
        existingBuffer = this.findBufferForPath(absoluteFilePath);
      }
      if (existingBuffer) {
        return Promise.resolve(existingBuffer);
      } else {
        return this.buildBuffer(absoluteFilePath);
      }
    };

    Project.prototype.buildBufferSync = function(absoluteFilePath) {
      var buffer;
      buffer = new TextBuffer({
        filePath: absoluteFilePath
      });
      this.addBuffer(buffer);
      buffer.loadSync();
      return buffer;
    };

    Project.prototype.buildBuffer = function(absoluteFilePath) {
      var buffer;
      buffer = new TextBuffer({
        filePath: absoluteFilePath
      });
      this.addBuffer(buffer);
      return buffer.load().then(function(buffer) {
        return buffer;
      })["catch"]((function(_this) {
        return function() {
          return _this.removeBuffer(buffer);
        };
      })(this));
    };

    Project.prototype.addBuffer = function(buffer, options) {
      if (options == null) {
        options = {};
      }
      return this.addBufferAtIndex(buffer, this.buffers.length, options);
    };

    Project.prototype.addBufferAtIndex = function(buffer, index, options) {
      if (options == null) {
        options = {};
      }
      this.buffers.splice(index, 0, buffer);
      this.subscribeToBuffer(buffer);
      this.emitter.emit('did-add-buffer', buffer);
      return buffer;
    };

    Project.prototype.removeBuffer = function(buffer) {
      var index;
      index = this.buffers.indexOf(buffer);
      if (index !== -1) {
        return this.removeBufferAtIndex(index);
      }
    };

    Project.prototype.removeBufferAtIndex = function(index, options) {
      var buffer;
      if (options == null) {
        options = {};
      }
      buffer = this.buffers.splice(index, 1)[0];
      return buffer != null ? buffer.destroy() : void 0;
    };

    Project.prototype.eachBuffer = function() {
      var args, buffer, callback, j, len, ref1, subscriber;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (args.length > 1) {
        subscriber = args.shift();
      }
      callback = args.shift();
      ref1 = this.getBuffers();
      for (j = 0, len = ref1.length; j < len; j++) {
        buffer = ref1[j];
        callback(buffer);
      }
      if (subscriber) {
        return subscriber.subscribe(this, 'buffer-created', function(buffer) {
          return callback(buffer);
        });
      } else {
        return this.on('buffer-created', function(buffer) {
          return callback(buffer);
        });
      }
    };

    Project.prototype.subscribeToBuffer = function(buffer) {
      buffer.onWillSave((function(_this) {
        return function(arg) {
          var path;
          path = arg.path;
          return _this.applicationDelegate.emitWillSavePath(path);
        };
      })(this));
      buffer.onDidSave((function(_this) {
        return function(arg) {
          var path;
          path = arg.path;
          return _this.applicationDelegate.emitDidSavePath(path);
        };
      })(this));
      buffer.onDidDestroy((function(_this) {
        return function() {
          return _this.removeBuffer(buffer);
        };
      })(this));
      buffer.onDidChangePath((function(_this) {
        return function() {
          if (!(_this.getPaths().length > 0)) {
            return _this.setPaths([path.dirname(buffer.getPath())]);
          }
        };
      })(this));
      return buffer.onWillThrowWatchError((function(_this) {
        return function(arg) {
          var error, handle;
          error = arg.error, handle = arg.handle;
          handle();
          return _this.notificationManager.addWarning("Unable to read file after file `" + error.eventType + "` event.\nMake sure you have permission to access `" + (buffer.getPath()) + "`.", {
            detail: error.message,
            dismissable: true
          });
        };
      })(this));
    };

    return Project;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wcm9qZWN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0hBQUE7SUFBQTs7Ozs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsTUFBd0IsT0FBQSxDQUFRLFdBQVIsQ0FBeEIsRUFBQyxxQkFBRCxFQUFVOztFQUNWLFVBQUEsR0FBYSxPQUFBLENBQVEsYUFBUjs7RUFFYix3QkFBQSxHQUEyQixPQUFBLENBQVEsOEJBQVI7O0VBQzNCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixxQkFBQSxHQUF3QixPQUFBLENBQVEsMkJBQVI7O0VBS3hCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7QUFDSjs7OztJQUlhLGlCQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsSUFBQyxDQUFBLDBCQUFBLHFCQUFxQixxQ0FBZ0IscUJBQVEsSUFBQyxDQUFBLDBCQUFBO01BQzVELElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLGtCQUFELEdBQXNCO01BQ3RCLElBQUMsQ0FBQSx3QkFBRCxHQUFnQyxJQUFBLHdCQUFBLENBQUE7TUFDaEMsSUFBQyxDQUFBLHdCQUFELEdBQWdDLElBQUEsR0FBQSxDQUFBO01BQ2hDLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixDQUFLLElBQUEscUJBQUEsQ0FBc0IsSUFBdEIsRUFBNEIsTUFBNUIsQ0FB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QixDQUFBO21CQUNFLEtBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTCxDQUFhLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBYixDQUFELENBQVYsRUFERjs7UUFEcUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCO2FBR0EsTUFBTSxDQUFDLHFCQUFQLENBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzNCLGNBQUE7VUFENkIsbUJBQU87VUFDcEMsTUFBQSxDQUFBO2lCQUNBLEtBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxVQUFyQixDQUFnQyxrQ0FBQSxHQUNJLEtBQUssQ0FBQyxTQURWLEdBQ29CLHFEQURwQixHQUVZLENBQUMsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUFELENBRlosR0FFOEIsSUFGOUQsRUFJRTtZQUFBLE1BQUEsRUFBUSxLQUFLLENBQUMsT0FBZDtZQUNBLFdBQUEsRUFBYSxJQURiO1dBSkY7UUFGMkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdCO0lBUGlCOzs7O0tBcllDO0FBZnRCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG57RW1pdHRlciwgRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5UZXh0QnVmZmVyID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG5cbkRlZmF1bHREaXJlY3RvcnlQcm92aWRlciA9IHJlcXVpcmUgJy4vZGVmYXVsdC1kaXJlY3RvcnktcHJvdmlkZXInXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5HaXRSZXBvc2l0b3J5UHJvdmlkZXIgPSByZXF1aXJlICcuL2dpdC1yZXBvc2l0b3J5LXByb3ZpZGVyJ1xuXG4jIEV4dGVuZGVkOiBSZXByZXNlbnRzIGEgcHJvamVjdCB0aGF0J3Mgb3BlbmVkIGluIEF0b20uXG4jXG4jIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20ucHJvamVjdGAgZ2xvYmFsLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUHJvamVjdCBleHRlbmRzIE1vZGVsXG4gICMjI1xuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb24gYW5kIERlc3RydWN0aW9uXG4gICMjI1xuXG4gIGNvbnN0cnVjdG9yOiAoe0Bub3RpZmljYXRpb25NYW5hZ2VyLCBwYWNrYWdlTWFuYWdlciwgY29uZmlnLCBAYXBwbGljYXRpb25EZWxlZ2F0ZX0pIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBidWZmZXJzID0gW11cbiAgICBAcGF0aHMgPSBbXVxuICAgIEByb290RGlyZWN0b3JpZXMgPSBbXVxuICAgIEByZXBvc2l0b3JpZXMgPSBbXVxuICAgIEBkaXJlY3RvcnlQcm92aWRlcnMgPSBbXVxuICAgIEBkZWZhdWx0RGlyZWN0b3J5UHJvdmlkZXIgPSBuZXcgRGVmYXVsdERpcmVjdG9yeVByb3ZpZGVyKClcbiAgICBAcmVwb3NpdG9yeVByb21pc2VzQnlQYXRoID0gbmV3IE1hcCgpXG4gICAgQHJlcG9zaXRvcnlQcm92aWRlcnMgPSBbbmV3IEdpdFJlcG9zaXRvcnlQcm92aWRlcih0aGlzLCBjb25maWcpXVxuICAgIEBjb25zdW1lU2VydmljZXMocGFja2FnZU1hbmFnZXIpXG5cbiAgZGVzdHJveWVkOiAtPlxuICAgIGJ1ZmZlci5kZXN0cm95KCkgZm9yIGJ1ZmZlciBpbiBAYnVmZmVyc1xuICAgIEBzZXRQYXRocyhbXSlcblxuICByZXNldDogKHBhY2thZ2VNYW5hZ2VyKSAtPlxuICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIGJ1ZmZlcj8uZGVzdHJveSgpIGZvciBidWZmZXIgaW4gQGJ1ZmZlcnNcbiAgICBAYnVmZmVycyA9IFtdXG4gICAgQHNldFBhdGhzKFtdKVxuICAgIEBjb25zdW1lU2VydmljZXMocGFja2FnZU1hbmFnZXIpXG5cbiAgZGVzdHJveVVucmV0YWluZWRCdWZmZXJzOiAtPlxuICAgIGJ1ZmZlci5kZXN0cm95KCkgZm9yIGJ1ZmZlciBpbiBAZ2V0QnVmZmVycygpIHdoZW4gbm90IGJ1ZmZlci5pc1JldGFpbmVkKClcbiAgICByZXR1cm5cblxuICAjIyNcbiAgU2VjdGlvbjogU2VyaWFsaXphdGlvblxuICAjIyNcblxuICBkZXNlcmlhbGl6ZTogKHN0YXRlKSAtPlxuICAgIHN0YXRlLnBhdGhzID0gW3N0YXRlLnBhdGhdIGlmIHN0YXRlLnBhdGg/ICMgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuXG4gICAgQGJ1ZmZlcnMgPSBfLmNvbXBhY3Qgc3RhdGUuYnVmZmVycy5tYXAgKGJ1ZmZlclN0YXRlKSAtPlxuICAgICAgIyBDaGVjayB0aGF0IGJ1ZmZlcidzIGZpbGUgcGF0aCBpcyBhY2Nlc3NpYmxlXG4gICAgICByZXR1cm4gaWYgZnMuaXNEaXJlY3RvcnlTeW5jKGJ1ZmZlclN0YXRlLmZpbGVQYXRoKVxuICAgICAgaWYgYnVmZmVyU3RhdGUuZmlsZVBhdGhcbiAgICAgICAgdHJ5XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGJ1ZmZlclN0YXRlLmZpbGVQYXRoLCAncicpKVxuICAgICAgICBjYXRjaCBlcnJvclxuICAgICAgICAgIHJldHVybiB1bmxlc3MgZXJyb3IuY29kZSBpcyAnRU5PRU5UJ1xuICAgICAgVGV4dEJ1ZmZlci5kZXNlcmlhbGl6ZShidWZmZXJTdGF0ZSlcblxuICAgIEBzdWJzY3JpYmVUb0J1ZmZlcihidWZmZXIpIGZvciBidWZmZXIgaW4gQGJ1ZmZlcnNcbiAgICBAc2V0UGF0aHMoc3RhdGUucGF0aHMpXG5cbiAgc2VyaWFsaXplOiAob3B0aW9ucz17fSkgLT5cbiAgICBkZXNlcmlhbGl6ZXI6ICdQcm9qZWN0J1xuICAgIHBhdGhzOiBAZ2V0UGF0aHMoKVxuICAgIGJ1ZmZlcnM6IF8uY29tcGFjdChAYnVmZmVycy5tYXAgKGJ1ZmZlcikgLT4gYnVmZmVyLnNlcmlhbGl6ZSh7bWFya2VyTGF5ZXJzOiBvcHRpb25zLmlzVW5sb2FkaW5nIGlzIHRydWV9KSBpZiBidWZmZXIuaXNSZXRhaW5lZCgpKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgcHJvamVjdCBwYXRocyBjaGFuZ2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHByb2plY3QgcGF0aHMgY2hhbmdlLlxuICAjICAgICogYHByb2plY3RQYXRoc2AgQW4ge0FycmF5fSBvZiB7U3RyaW5nfSBwcm9qZWN0IHBhdGhzLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VQYXRoczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLXBhdGhzJywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgdGV4dCBidWZmZXIgaXMgYWRkZWQgdG8gdGhlXG4gICMgcHJvamVjdC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIGEgdGV4dCBidWZmZXIgaXMgYWRkZWQuXG4gICMgICAqIGBidWZmZXJgIEEge1RleHRCdWZmZXJ9IGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZEFkZEJ1ZmZlcjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLWJ1ZmZlcicsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCBhbGwgY3VycmVudCBhbmQgZnV0dXJlIHRleHRcbiAgIyBidWZmZXJzIGluIHRoZSBwcm9qZWN0LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggY3VycmVudCBhbmQgZnV0dXJlIHRleHQgYnVmZmVycy5cbiAgIyAgICogYGJ1ZmZlcmAgQSB7VGV4dEJ1ZmZlcn0gaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVCdWZmZXJzOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2soYnVmZmVyKSBmb3IgYnVmZmVyIGluIEBnZXRCdWZmZXJzKClcbiAgICBAb25EaWRBZGRCdWZmZXIgY2FsbGJhY2tcblxuICAjIyNcbiAgU2VjdGlvbjogQWNjZXNzaW5nIHRoZSBnaXQgcmVwb3NpdG9yeVxuICAjIyNcblxuICAjIFB1YmxpYzogR2V0IGFuIHtBcnJheX0gb2Yge0dpdFJlcG9zaXRvcnl9cyBhc3NvY2lhdGVkIHdpdGggdGhlIHByb2plY3Qnc1xuICAjIGRpcmVjdG9yaWVzLlxuICAjXG4gICMgVGhpcyBtZXRob2Qgd2lsbCBiZSByZW1vdmVkIGluIDIuMCBiZWNhdXNlIGl0IGRvZXMgc3luY2hyb25vdXMgSS9PLlxuICAjIFByZWZlciB0aGUgZm9sbG93aW5nLCB3aGljaCBldmFsdWF0ZXMgdG8gYSB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB0byBhblxuICAjIHtBcnJheX0gb2Yge1JlcG9zaXRvcnl9IG9iamVjdHM6XG4gICMgYGBgXG4gICMgUHJvbWlzZS5hbGwoYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubWFwKFxuICAjICAgICBhdG9tLnByb2plY3QucmVwb3NpdG9yeUZvckRpcmVjdG9yeS5iaW5kKGF0b20ucHJvamVjdCkpKVxuICAjIGBgYFxuICBnZXRSZXBvc2l0b3JpZXM6IC0+IEByZXBvc2l0b3JpZXNcblxuICAjIFB1YmxpYzogR2V0IHRoZSByZXBvc2l0b3J5IGZvciBhIGdpdmVuIGRpcmVjdG9yeSBhc3luY2hyb25vdXNseS5cbiAgI1xuICAjICogYGRpcmVjdG9yeWAge0RpcmVjdG9yeX0gZm9yIHdoaWNoIHRvIGdldCBhIHtSZXBvc2l0b3J5fS5cbiAgI1xuICAjIFJldHVybnMgYSB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB3aXRoIGVpdGhlcjpcbiAgIyAqIHtSZXBvc2l0b3J5fSBpZiBhIHJlcG9zaXRvcnkgY2FuIGJlIGNyZWF0ZWQgZm9yIHRoZSBnaXZlbiBkaXJlY3RvcnlcbiAgIyAqIGBudWxsYCBpZiBubyByZXBvc2l0b3J5IGNhbiBiZSBjcmVhdGVkIGZvciB0aGUgZ2l2ZW4gZGlyZWN0b3J5LlxuICByZXBvc2l0b3J5Rm9yRGlyZWN0b3J5OiAoZGlyZWN0b3J5KSAtPlxuICAgIHBhdGhGb3JEaXJlY3RvcnkgPSBkaXJlY3RvcnkuZ2V0UmVhbFBhdGhTeW5jKClcbiAgICBwcm9taXNlID0gQHJlcG9zaXRvcnlQcm9taXNlc0J5UGF0aC5nZXQocGF0aEZvckRpcmVjdG9yeSlcbiAgICB1bmxlc3MgcHJvbWlzZVxuICAgICAgcHJvbWlzZXMgPSBAcmVwb3NpdG9yeVByb3ZpZGVycy5tYXAgKHByb3ZpZGVyKSAtPlxuICAgICAgICBwcm92aWRlci5yZXBvc2l0b3J5Rm9yRGlyZWN0b3J5KGRpcmVjdG9yeSlcbiAgICAgIHByb21pc2UgPSBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbiAocmVwb3NpdG9yaWVzKSA9PlxuICAgICAgICByZXBvID0gXy5maW5kKHJlcG9zaXRvcmllcywgKHJlcG8pIC0+IHJlcG8/KSA/IG51bGxcblxuICAgICAgICAjIElmIG5vIHJlcG9zaXRvcnkgaXMgZm91bmQsIHJlbW92ZSB0aGUgZW50cnkgaW4gZm9yIHRoZSBkaXJlY3RvcnkgaW5cbiAgICAgICAgIyBAcmVwb3NpdG9yeVByb21pc2VzQnlQYXRoIGluIGNhc2Ugc29tZSBvdGhlciBSZXBvc2l0b3J5UHJvdmlkZXIgaXNcbiAgICAgICAgIyByZWdpc3RlcmVkIGluIHRoZSBmdXR1cmUgdGhhdCBjb3VsZCBzdXBwbHkgYSBSZXBvc2l0b3J5IGZvciB0aGVcbiAgICAgICAgIyBkaXJlY3RvcnkuXG4gICAgICAgIEByZXBvc2l0b3J5UHJvbWlzZXNCeVBhdGguZGVsZXRlKHBhdGhGb3JEaXJlY3RvcnkpIHVubGVzcyByZXBvP1xuICAgICAgICByZXBvPy5vbkRpZERlc3Ryb3k/KD0+IEByZXBvc2l0b3J5UHJvbWlzZXNCeVBhdGguZGVsZXRlKHBhdGhGb3JEaXJlY3RvcnkpKVxuICAgICAgICByZXBvXG4gICAgICBAcmVwb3NpdG9yeVByb21pc2VzQnlQYXRoLnNldChwYXRoRm9yRGlyZWN0b3J5LCBwcm9taXNlKVxuICAgIHByb21pc2VcblxuICAjIyNcbiAgU2VjdGlvbjogTWFuYWdpbmcgUGF0aHNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEdldCBhbiB7QXJyYXl9IG9mIHtTdHJpbmd9cyBjb250YWluaW5nIHRoZSBwYXRocyBvZiB0aGUgcHJvamVjdCdzXG4gICMgZGlyZWN0b3JpZXMuXG4gIGdldFBhdGhzOiAtPiByb290RGlyZWN0b3J5LmdldFBhdGgoKSBmb3Igcm9vdERpcmVjdG9yeSBpbiBAcm9vdERpcmVjdG9yaWVzXG5cbiAgIyBQdWJsaWM6IFNldCB0aGUgcGF0aHMgb2YgdGhlIHByb2plY3QncyBkaXJlY3Rvcmllcy5cbiAgI1xuICAjICogYHByb2plY3RQYXRoc2Age0FycmF5fSBvZiB7U3RyaW5nfSBwYXRocy5cbiAgc2V0UGF0aHM6IChwcm9qZWN0UGF0aHMpIC0+XG4gICAgcmVwb3NpdG9yeT8uZGVzdHJveSgpIGZvciByZXBvc2l0b3J5IGluIEByZXBvc2l0b3JpZXNcbiAgICBAcm9vdERpcmVjdG9yaWVzID0gW11cbiAgICBAcmVwb3NpdG9yaWVzID0gW11cblxuICAgIEBhZGRQYXRoKHByb2plY3RQYXRoLCBlbWl0RXZlbnQ6IGZhbHNlKSBmb3IgcHJvamVjdFBhdGggaW4gcHJvamVjdFBhdGhzXG5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLXBhdGhzJywgcHJvamVjdFBhdGhzXG5cbiAgIyBQdWJsaWM6IEFkZCBhIHBhdGggdG8gdGhlIHByb2plY3QncyBsaXN0IG9mIHJvb3QgcGF0aHNcbiAgI1xuICAjICogYHByb2plY3RQYXRoYCB7U3RyaW5nfSBUaGUgcGF0aCB0byB0aGUgZGlyZWN0b3J5IHRvIGFkZC5cbiAgYWRkUGF0aDogKHByb2plY3RQYXRoLCBvcHRpb25zKSAtPlxuICAgIGRpcmVjdG9yeSA9IG51bGxcbiAgICBmb3IgcHJvdmlkZXIgaW4gQGRpcmVjdG9yeVByb3ZpZGVyc1xuICAgICAgYnJlYWsgaWYgZGlyZWN0b3J5ID0gcHJvdmlkZXIuZGlyZWN0b3J5Rm9yVVJJU3luYz8ocHJvamVjdFBhdGgpXG4gICAgZGlyZWN0b3J5ID89IEBkZWZhdWx0RGlyZWN0b3J5UHJvdmlkZXIuZGlyZWN0b3J5Rm9yVVJJU3luYyhwcm9qZWN0UGF0aClcblxuICAgIHJldHVybiB1bmxlc3MgZGlyZWN0b3J5LmV4aXN0c1N5bmMoKVxuICAgIGZvciBleGlzdGluZ0RpcmVjdG9yeSBpbiBAZ2V0RGlyZWN0b3JpZXMoKVxuICAgICAgcmV0dXJuIGlmIGV4aXN0aW5nRGlyZWN0b3J5LmdldFBhdGgoKSBpcyBkaXJlY3RvcnkuZ2V0UGF0aCgpXG5cbiAgICBAcm9vdERpcmVjdG9yaWVzLnB1c2goZGlyZWN0b3J5KVxuXG4gICAgcmVwbyA9IG51bGxcbiAgICBmb3IgcHJvdmlkZXIgaW4gQHJlcG9zaXRvcnlQcm92aWRlcnNcbiAgICAgIGJyZWFrIGlmIHJlcG8gPSBwcm92aWRlci5yZXBvc2l0b3J5Rm9yRGlyZWN0b3J5U3luYz8oZGlyZWN0b3J5KVxuICAgIEByZXBvc2l0b3JpZXMucHVzaChyZXBvID8gbnVsbClcblxuICAgIHVubGVzcyBvcHRpb25zPy5lbWl0RXZlbnQgaXMgZmFsc2VcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtcGF0aHMnLCBAZ2V0UGF0aHMoKVxuXG4gICMgUHVibGljOiByZW1vdmUgYSBwYXRoIGZyb20gdGhlIHByb2plY3QncyBsaXN0IG9mIHJvb3QgcGF0aHMuXG4gICNcbiAgIyAqIGBwcm9qZWN0UGF0aGAge1N0cmluZ30gVGhlIHBhdGggdG8gcmVtb3ZlLlxuICByZW1vdmVQYXRoOiAocHJvamVjdFBhdGgpIC0+XG4gICAgIyBUaGUgcHJvamVjdFBhdGggbWF5IGJlIGEgVVJJLCBpbiB3aGljaCBjYXNlIGl0IHNob3VsZCBub3QgYmUgbm9ybWFsaXplZC5cbiAgICB1bmxlc3MgcHJvamVjdFBhdGggaW4gQGdldFBhdGhzKClcbiAgICAgIHByb2plY3RQYXRoID0gcGF0aC5ub3JtYWxpemUocHJvamVjdFBhdGgpXG5cbiAgICBpbmRleFRvUmVtb3ZlID0gbnVsbFxuICAgIGZvciBkaXJlY3RvcnksIGkgaW4gQHJvb3REaXJlY3Rvcmllc1xuICAgICAgaWYgZGlyZWN0b3J5LmdldFBhdGgoKSBpcyBwcm9qZWN0UGF0aFxuICAgICAgICBpbmRleFRvUmVtb3ZlID0gaVxuICAgICAgICBicmVha1xuXG4gICAgaWYgaW5kZXhUb1JlbW92ZT9cbiAgICAgIFtyZW1vdmVkRGlyZWN0b3J5XSA9IEByb290RGlyZWN0b3JpZXMuc3BsaWNlKGluZGV4VG9SZW1vdmUsIDEpXG4gICAgICBbcmVtb3ZlZFJlcG9zaXRvcnldID0gQHJlcG9zaXRvcmllcy5zcGxpY2UoaW5kZXhUb1JlbW92ZSwgMSlcbiAgICAgIHJlbW92ZWRSZXBvc2l0b3J5Py5kZXN0cm95KCkgdW5sZXNzIHJlbW92ZWRSZXBvc2l0b3J5IGluIEByZXBvc2l0b3JpZXNcbiAgICAgIEBlbWl0dGVyLmVtaXQgXCJkaWQtY2hhbmdlLXBhdGhzXCIsIEBnZXRQYXRocygpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICAjIFB1YmxpYzogR2V0IGFuIHtBcnJheX0gb2Yge0RpcmVjdG9yeX1zIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHByb2plY3QuXG4gIGdldERpcmVjdG9yaWVzOiAtPlxuICAgIEByb290RGlyZWN0b3JpZXNcblxuICByZXNvbHZlUGF0aDogKHVyaSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHVyaVxuXG4gICAgaWYgdXJpPy5tYXRjaCgvW0EtWmEtejAtOSstLl0rOlxcL1xcLy8pICMgbGVhdmUgcGF0aCBhbG9uZSBpZiBpdCBoYXMgYSBzY2hlbWVcbiAgICAgIHVyaVxuICAgIGVsc2VcbiAgICAgIGlmIGZzLmlzQWJzb2x1dGUodXJpKVxuICAgICAgICBwYXRoLm5vcm1hbGl6ZShmcy5hYnNvbHV0ZSh1cmkpKVxuXG4gICAgICAjIFRPRE86IHdoYXQgc2hvdWxkIHdlIGRvIGhlcmUgd2hlbiB0aGVyZSBhcmUgbXVsdGlwbGUgZGlyZWN0b3JpZXM/XG4gICAgICBlbHNlIGlmIHByb2plY3RQYXRoID0gQGdldFBhdGhzKClbMF1cbiAgICAgICAgcGF0aC5ub3JtYWxpemUoZnMuYWJzb2x1dGUocGF0aC5qb2luKHByb2plY3RQYXRoLCB1cmkpKSlcbiAgICAgIGVsc2VcbiAgICAgICAgdW5kZWZpbmVkXG5cbiAgcmVsYXRpdml6ZTogKGZ1bGxQYXRoKSAtPlxuICAgIEByZWxhdGl2aXplUGF0aChmdWxsUGF0aClbMV1cblxuICAjIFB1YmxpYzogR2V0IHRoZSBwYXRoIHRvIHRoZSBwcm9qZWN0IGRpcmVjdG9yeSB0aGF0IGNvbnRhaW5zIHRoZSBnaXZlbiBwYXRoLFxuICAjIGFuZCB0aGUgcmVsYXRpdmUgcGF0aCBmcm9tIHRoYXQgcHJvamVjdCBkaXJlY3RvcnkgdG8gdGhlIGdpdmVuIHBhdGguXG4gICNcbiAgIyAqIGBmdWxsUGF0aGAge1N0cmluZ30gQW4gYWJzb2x1dGUgcGF0aC5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSB3aXRoIHR3byBlbGVtZW50czpcbiAgIyAqIGBwcm9qZWN0UGF0aGAgVGhlIHtTdHJpbmd9IHBhdGggdG8gdGhlIHByb2plY3QgZGlyZWN0b3J5IHRoYXQgY29udGFpbnMgdGhlXG4gICMgICBnaXZlbiBwYXRoLCBvciBgbnVsbGAgaWYgbm9uZSBpcyBmb3VuZC5cbiAgIyAqIGByZWxhdGl2ZVBhdGhgIHtTdHJpbmd9IFRoZSByZWxhdGl2ZSBwYXRoIGZyb20gdGhlIHByb2plY3QgZGlyZWN0b3J5IHRvXG4gICMgICB0aGUgZ2l2ZW4gcGF0aC5cbiAgcmVsYXRpdml6ZVBhdGg6IChmdWxsUGF0aCkgLT5cbiAgICByZXN1bHQgPSBbbnVsbCwgZnVsbFBhdGhdXG4gICAgaWYgZnVsbFBhdGg/XG4gICAgICBmb3Igcm9vdERpcmVjdG9yeSBpbiBAcm9vdERpcmVjdG9yaWVzXG4gICAgICAgIHJlbGF0aXZlUGF0aCA9IHJvb3REaXJlY3RvcnkucmVsYXRpdml6ZShmdWxsUGF0aClcbiAgICAgICAgaWYgcmVsYXRpdmVQYXRoPy5sZW5ndGggPCByZXN1bHRbMV0ubGVuZ3RoXG4gICAgICAgICAgcmVzdWx0ID0gW3Jvb3REaXJlY3RvcnkuZ2V0UGF0aCgpLCByZWxhdGl2ZVBhdGhdXG4gICAgcmVzdWx0XG5cbiAgIyBQdWJsaWM6IERldGVybWluZXMgd2hldGhlciB0aGUgZ2l2ZW4gcGF0aCAocmVhbCBvciBzeW1ib2xpYykgaXMgaW5zaWRlIHRoZVxuICAjIHByb2plY3QncyBkaXJlY3RvcnkuXG4gICNcbiAgIyBUaGlzIG1ldGhvZCBkb2VzIG5vdCBhY3R1YWxseSBjaGVjayBpZiB0aGUgcGF0aCBleGlzdHMsIGl0IGp1c3QgY2hlY2tzIHRoZWlyXG4gICMgbG9jYXRpb25zIHJlbGF0aXZlIHRvIGVhY2ggb3RoZXIuXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjXG4gICMgQmFzaWMgb3BlcmF0aW9uXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyAjIFByb2plY3QncyByb290IGRpcmVjdG9yeSBpcyAvZm9vL2JhclxuICAjIHByb2plY3QuY29udGFpbnMoJy9mb28vYmFyL2JheicpICAgICAgICAjID0+IHRydWVcbiAgIyBwcm9qZWN0LmNvbnRhaW5zKCcvdXNyL2xpYi9iYXonKSAgICAgICAgIyA9PiBmYWxzZVxuICAjIGBgYFxuICAjXG4gICMgRXhpc3RlbmNlIG9mIHRoZSBwYXRoIGlzIG5vdCByZXF1aXJlZFxuICAjXG4gICMgYGBgY29mZmVlXG4gICMgIyBQcm9qZWN0J3Mgcm9vdCBkaXJlY3RvcnkgaXMgL2Zvby9iYXJcbiAgIyBmcy5leGlzdHNTeW5jKCcvZm9vL2Jhci9iYXonKSAgICAgICAgICAgIyA9PiBmYWxzZVxuICAjIHByb2plY3QuY29udGFpbnMoJy9mb28vYmFyL2JheicpICAgICAgICAjID0+IHRydWVcbiAgIyBgYGBcbiAgI1xuICAjICogYHBhdGhUb0NoZWNrYCB7U3RyaW5nfSBwYXRoXG4gICNcbiAgIyBSZXR1cm5zIHdoZXRoZXIgdGhlIHBhdGggaXMgaW5zaWRlIHRoZSBwcm9qZWN0J3Mgcm9vdCBkaXJlY3RvcnkuXG4gIGNvbnRhaW5zOiAocGF0aFRvQ2hlY2spIC0+XG4gICAgQHJvb3REaXJlY3Rvcmllcy5zb21lIChkaXIpIC0+IGRpci5jb250YWlucyhwYXRoVG9DaGVjaylcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZVxuICAjIyNcblxuICBjb25zdW1lU2VydmljZXM6ICh7c2VydmljZUh1Yn0pIC0+XG4gICAgc2VydmljZUh1Yi5jb25zdW1lKFxuICAgICAgJ2F0b20uZGlyZWN0b3J5LXByb3ZpZGVyJyxcbiAgICAgICdeMC4xLjAnLFxuICAgICAgKHByb3ZpZGVyKSA9PlxuICAgICAgICBAZGlyZWN0b3J5UHJvdmlkZXJzLnVuc2hpZnQocHJvdmlkZXIpXG4gICAgICAgIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICAgICAgQGRpcmVjdG9yeVByb3ZpZGVycy5zcGxpY2UoQGRpcmVjdG9yeVByb3ZpZGVycy5pbmRleE9mKHByb3ZpZGVyKSwgMSlcbiAgICApXG5cbiAgICBzZXJ2aWNlSHViLmNvbnN1bWUoXG4gICAgICAnYXRvbS5yZXBvc2l0b3J5LXByb3ZpZGVyJyxcbiAgICAgICdeMC4xLjAnLFxuICAgICAgKHByb3ZpZGVyKSA9PlxuICAgICAgICBAcmVwb3NpdG9yeVByb3ZpZGVycy51bnNoaWZ0KHByb3ZpZGVyKVxuICAgICAgICBAc2V0UGF0aHMoQGdldFBhdGhzKCkpIGlmIG51bGwgaW4gQHJlcG9zaXRvcmllc1xuICAgICAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgICAgIEByZXBvc2l0b3J5UHJvdmlkZXJzLnNwbGljZShAcmVwb3NpdG9yeVByb3ZpZGVycy5pbmRleE9mKHByb3ZpZGVyKSwgMSlcbiAgICApXG5cbiAgIyBSZXRyaWV2ZXMgYWxsIHRoZSB7VGV4dEJ1ZmZlcn1zIGluIHRoZSBwcm9qZWN0OyB0aGF0IGlzLCB0aGVcbiAgIyBidWZmZXJzIGZvciBhbGwgb3BlbiBmaWxlcy5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB7VGV4dEJ1ZmZlcn1zLlxuICBnZXRCdWZmZXJzOiAtPlxuICAgIEBidWZmZXJzLnNsaWNlKClcblxuICAjIElzIHRoZSBidWZmZXIgZm9yIHRoZSBnaXZlbiBwYXRoIG1vZGlmaWVkP1xuICBpc1BhdGhNb2RpZmllZDogKGZpbGVQYXRoKSAtPlxuICAgIEBmaW5kQnVmZmVyRm9yUGF0aChAcmVzb2x2ZVBhdGgoZmlsZVBhdGgpKT8uaXNNb2RpZmllZCgpXG5cbiAgZmluZEJ1ZmZlckZvclBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBfLmZpbmQgQGJ1ZmZlcnMsIChidWZmZXIpIC0+IGJ1ZmZlci5nZXRQYXRoKCkgaXMgZmlsZVBhdGhcblxuICBmaW5kQnVmZmVyRm9ySWQ6IChpZCkgLT5cbiAgICBfLmZpbmQgQGJ1ZmZlcnMsIChidWZmZXIpIC0+IGJ1ZmZlci5nZXRJZCgpIGlzIGlkXG5cbiAgIyBPbmx5IHRvIGJlIHVzZWQgaW4gc3BlY3NcbiAgYnVmZmVyRm9yUGF0aFN5bmM6IChmaWxlUGF0aCkgLT5cbiAgICBhYnNvbHV0ZUZpbGVQYXRoID0gQHJlc29sdmVQYXRoKGZpbGVQYXRoKVxuICAgIGV4aXN0aW5nQnVmZmVyID0gQGZpbmRCdWZmZXJGb3JQYXRoKGFic29sdXRlRmlsZVBhdGgpIGlmIGZpbGVQYXRoXG4gICAgZXhpc3RpbmdCdWZmZXIgPyBAYnVpbGRCdWZmZXJTeW5jKGFic29sdXRlRmlsZVBhdGgpXG5cbiAgIyBPbmx5IHRvIGJlIHVzZWQgd2hlbiBkZXNlcmlhbGl6aW5nXG4gIGJ1ZmZlckZvcklkU3luYzogKGlkKSAtPlxuICAgIGV4aXN0aW5nQnVmZmVyID0gQGZpbmRCdWZmZXJGb3JJZChpZCkgaWYgaWRcbiAgICBleGlzdGluZ0J1ZmZlciA/IEBidWlsZEJ1ZmZlclN5bmMoKVxuXG4gICMgR2l2ZW4gYSBmaWxlIHBhdGgsIHRoaXMgcmV0cmlldmVzIG9yIGNyZWF0ZXMgYSBuZXcge1RleHRCdWZmZXJ9LlxuICAjXG4gICMgSWYgdGhlIGBmaWxlUGF0aGAgYWxyZWFkeSBoYXMgYSBgYnVmZmVyYCwgdGhhdCB2YWx1ZSBpcyB1c2VkIGluc3RlYWQuIE90aGVyd2lzZSxcbiAgIyBgdGV4dGAgaXMgdXNlZCBhcyB0aGUgY29udGVudHMgb2YgdGhlIG5ldyBidWZmZXIuXG4gICNcbiAgIyAqIGBmaWxlUGF0aGAgQSB7U3RyaW5nfSByZXByZXNlbnRpbmcgYSBwYXRoLiBJZiBgbnVsbGAsIGFuIFwiVW50aXRsZWRcIiBidWZmZXIgaXMgY3JlYXRlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB0byB0aGUge1RleHRCdWZmZXJ9LlxuICBidWZmZXJGb3JQYXRoOiAoYWJzb2x1dGVGaWxlUGF0aCkgLT5cbiAgICBleGlzdGluZ0J1ZmZlciA9IEBmaW5kQnVmZmVyRm9yUGF0aChhYnNvbHV0ZUZpbGVQYXRoKSBpZiBhYnNvbHV0ZUZpbGVQYXRoP1xuICAgIGlmIGV4aXN0aW5nQnVmZmVyXG4gICAgICBQcm9taXNlLnJlc29sdmUoZXhpc3RpbmdCdWZmZXIpXG4gICAgZWxzZVxuICAgICAgQGJ1aWxkQnVmZmVyKGFic29sdXRlRmlsZVBhdGgpXG5cbiAgIyBTdGlsbCBuZWVkZWQgd2hlbiBkZXNlcmlhbGl6aW5nIGEgdG9rZW5pemVkIGJ1ZmZlclxuICBidWlsZEJ1ZmZlclN5bmM6IChhYnNvbHV0ZUZpbGVQYXRoKSAtPlxuICAgIGJ1ZmZlciA9IG5ldyBUZXh0QnVmZmVyKHtmaWxlUGF0aDogYWJzb2x1dGVGaWxlUGF0aH0pXG4gICAgQGFkZEJ1ZmZlcihidWZmZXIpXG4gICAgYnVmZmVyLmxvYWRTeW5jKClcbiAgICBidWZmZXJcblxuICAjIEdpdmVuIGEgZmlsZSBwYXRoLCB0aGlzIHNldHMgaXRzIHtUZXh0QnVmZmVyfS5cbiAgI1xuICAjICogYGFic29sdXRlRmlsZVBhdGhgIEEge1N0cmluZ30gcmVwcmVzZW50aW5nIGEgcGF0aC5cbiAgIyAqIGB0ZXh0YCBUaGUge1N0cmluZ30gdGV4dCB0byB1c2UgYXMgYSBidWZmZXIuXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHtUZXh0QnVmZmVyfS5cbiAgYnVpbGRCdWZmZXI6IChhYnNvbHV0ZUZpbGVQYXRoKSAtPlxuICAgIGJ1ZmZlciA9IG5ldyBUZXh0QnVmZmVyKHtmaWxlUGF0aDogYWJzb2x1dGVGaWxlUGF0aH0pXG4gICAgQGFkZEJ1ZmZlcihidWZmZXIpXG4gICAgYnVmZmVyLmxvYWQoKVxuICAgICAgLnRoZW4oKGJ1ZmZlcikgLT4gYnVmZmVyKVxuICAgICAgLmNhdGNoKD0+IEByZW1vdmVCdWZmZXIoYnVmZmVyKSlcblxuICBhZGRCdWZmZXI6IChidWZmZXIsIG9wdGlvbnM9e30pIC0+XG4gICAgQGFkZEJ1ZmZlckF0SW5kZXgoYnVmZmVyLCBAYnVmZmVycy5sZW5ndGgsIG9wdGlvbnMpXG5cbiAgYWRkQnVmZmVyQXRJbmRleDogKGJ1ZmZlciwgaW5kZXgsIG9wdGlvbnM9e30pIC0+XG4gICAgQGJ1ZmZlcnMuc3BsaWNlKGluZGV4LCAwLCBidWZmZXIpXG4gICAgQHN1YnNjcmliZVRvQnVmZmVyKGJ1ZmZlcilcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLWJ1ZmZlcicsIGJ1ZmZlclxuICAgIGJ1ZmZlclxuXG4gICMgUmVtb3ZlcyBhIHtUZXh0QnVmZmVyfSBhc3NvY2lhdGlvbiBmcm9tIHRoZSBwcm9qZWN0LlxuICAjXG4gICMgUmV0dXJucyB0aGUgcmVtb3ZlZCB7VGV4dEJ1ZmZlcn0uXG4gIHJlbW92ZUJ1ZmZlcjogKGJ1ZmZlcikgLT5cbiAgICBpbmRleCA9IEBidWZmZXJzLmluZGV4T2YoYnVmZmVyKVxuICAgIEByZW1vdmVCdWZmZXJBdEluZGV4KGluZGV4KSB1bmxlc3MgaW5kZXggaXMgLTFcblxuICByZW1vdmVCdWZmZXJBdEluZGV4OiAoaW5kZXgsIG9wdGlvbnM9e30pIC0+XG4gICAgW2J1ZmZlcl0gPSBAYnVmZmVycy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgYnVmZmVyPy5kZXN0cm95KClcblxuICBlYWNoQnVmZmVyOiAoYXJncy4uLikgLT5cbiAgICBzdWJzY3JpYmVyID0gYXJncy5zaGlmdCgpIGlmIGFyZ3MubGVuZ3RoID4gMVxuICAgIGNhbGxiYWNrID0gYXJncy5zaGlmdCgpXG5cbiAgICBjYWxsYmFjayhidWZmZXIpIGZvciBidWZmZXIgaW4gQGdldEJ1ZmZlcnMoKVxuICAgIGlmIHN1YnNjcmliZXJcbiAgICAgIHN1YnNjcmliZXIuc3Vic2NyaWJlIHRoaXMsICdidWZmZXItY3JlYXRlZCcsIChidWZmZXIpIC0+IGNhbGxiYWNrKGJ1ZmZlcilcbiAgICBlbHNlXG4gICAgICBAb24gJ2J1ZmZlci1jcmVhdGVkJywgKGJ1ZmZlcikgLT4gY2FsbGJhY2soYnVmZmVyKVxuXG4gIHN1YnNjcmliZVRvQnVmZmVyOiAoYnVmZmVyKSAtPlxuICAgIGJ1ZmZlci5vbldpbGxTYXZlICh7cGF0aH0pID0+IEBhcHBsaWNhdGlvbkRlbGVnYXRlLmVtaXRXaWxsU2F2ZVBhdGgocGF0aClcbiAgICBidWZmZXIub25EaWRTYXZlICh7cGF0aH0pID0+IEBhcHBsaWNhdGlvbkRlbGVnYXRlLmVtaXREaWRTYXZlUGF0aChwYXRoKVxuICAgIGJ1ZmZlci5vbkRpZERlc3Ryb3kgPT4gQHJlbW92ZUJ1ZmZlcihidWZmZXIpXG4gICAgYnVmZmVyLm9uRGlkQ2hhbmdlUGF0aCA9PlxuICAgICAgdW5sZXNzIEBnZXRQYXRocygpLmxlbmd0aCA+IDBcbiAgICAgICAgQHNldFBhdGhzKFtwYXRoLmRpcm5hbWUoYnVmZmVyLmdldFBhdGgoKSldKVxuICAgIGJ1ZmZlci5vbldpbGxUaHJvd1dhdGNoRXJyb3IgKHtlcnJvciwgaGFuZGxlfSkgPT5cbiAgICAgIGhhbmRsZSgpXG4gICAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRXYXJuaW5nIFwiXCJcIlxuICAgICAgICBVbmFibGUgdG8gcmVhZCBmaWxlIGFmdGVyIGZpbGUgYCN7ZXJyb3IuZXZlbnRUeXBlfWAgZXZlbnQuXG4gICAgICAgIE1ha2Ugc3VyZSB5b3UgaGF2ZSBwZXJtaXNzaW9uIHRvIGFjY2VzcyBgI3tidWZmZXIuZ2V0UGF0aCgpfWAuXG4gICAgICAgIFwiXCJcIixcbiAgICAgICAgZGV0YWlsOiBlcnJvci5tZXNzYWdlXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4iXX0=
