(function() {
  var AtomIoClient, DefaultRequestHeaders, fs, glob, path, request;

  fs = require('fs-plus');

  path = require('path');

  glob = null;

  request = null;

  DefaultRequestHeaders = {
    'User-Agent': navigator.userAgent
  };

  module.exports = AtomIoClient = (function() {
    function AtomIoClient(packageManager, baseURL) {
      this.packageManager = packageManager;
      this.baseURL = baseURL;
      if (this.baseURL == null) {
        this.baseURL = 'https://atom.io/api/';
      }
      this.expiry = 1000 * 60 * 60 * 12;
      this.createAvatarCache();
      this.expireAvatarCache();
    }

    AtomIoClient.prototype.avatar = function(login, callback) {
      return this.cachedAvatar(login, (function(_this) {
        return function(err, cached) {
          var stale;
          if (cached) {
            stale = Date.now() - parseInt(cached.split('-').pop()) > _this.expiry;
          }
          if (cached && (!stale || !_this.online())) {
            return callback(null, cached);
          } else {
            return _this.fetchAndCacheAvatar(login, callback);
          }
        };
      })(this));
    };

    AtomIoClient.prototype["package"] = function(name, callback) {
      var packagePath;
      packagePath = "packages/" + name;
      return this.fetchFromCache(packagePath, {}, (function(_this) {
        return function(err, data) {
          if (data) {
            return callback(null, data);
          } else {
            return _this.request(packagePath, callback);
          }
        };
      })(this));
    };

    AtomIoClient.prototype.featuredPackages = function(callback) {
      return this.fetchFromCache('packages/featured', {}, (function(_this) {
        return function(err, data) {
          if (data) {
            return callback(null, data);
          } else {
            return _this.getFeatured(false, callback);
          }
        };
      })(this));
    };

    AtomIoClient.prototype.featuredThemes = function(callback) {
      return this.fetchFromCache('themes/featured', {}, (function(_this) {
        return function(err, data) {
          if (data) {
            return callback(null, data);
          } else {
            return _this.getFeatured(true, callback);
          }
        };
      })(this));
    };

    AtomIoClient.prototype.getFeatured = function(loadThemes, callback) {
      return this.packageManager.getFeatured(loadThemes).then((function(_this) {
        return function(packages) {
          var cached, key;
          key = loadThemes ? 'themes/featured' : 'packages/featured';
          cached = {
            data: packages,
            createdOn: Date.now()
          };
          localStorage.setItem(_this.cacheKeyForPath(key), JSON.stringify(cached));
          return callback(null, packages);
        };
      })(this))["catch"](function(error) {
        return callback(error, null);
      });
    };

    AtomIoClient.prototype.request = function(path, callback) {
      var options;
      if (request == null) {
        request = require('request');
      }
      options = {
        url: "" + this.baseURL + path,
        headers: DefaultRequestHeaders
      };
      return request(options, (function(_this) {
        return function(err, res, body) {
          var cached, data, error;
          try {
            data = JSON.parse(body);
          } catch (error1) {
            error = error1;
            return callback(error);
          }
          delete data.versions;
          cached = {
            data: data,
            createdOn: Date.now()
          };
          localStorage.setItem(_this.cacheKeyForPath(path), JSON.stringify(cached));
          return callback(err, cached.data);
        };
      })(this));
    };

    AtomIoClient.prototype.cacheKeyForPath = function(path) {
      return "settings-view:" + path;
    };

    AtomIoClient.prototype.online = function() {
      return navigator.onLine;
    };

    AtomIoClient.prototype.fetchFromCache = function(packagePath, options, callback) {
      var cached;
      if (!callback) {
        callback = options;
        options = {};
      }
      if (!options.force) {
        options.force = !this.online();
      }
      cached = localStorage.getItem(this.cacheKeyForPath(packagePath));
      cached = cached ? JSON.parse(cached) : void 0;
      if ((cached != null) && (!this.online() || options.force || (Date.now() - cached.createdOn < this.expiry))) {
        if (cached == null) {
          cached = {
            data: {}
          };
        }
        return callback(null, cached.data);
      } else if ((cached == null) && !this.online()) {
        return callback(null, {});
      } else {
        return callback(null, null);
      }
    };

    AtomIoClient.prototype.createAvatarCache = function() {
      return fs.makeTree(this.getCachePath());
    };

    AtomIoClient.prototype.avatarPath = function(login) {
      return path.join(this.getCachePath(), login + "-" + (Date.now()));
    };

    AtomIoClient.prototype.cachedAvatar = function(login, callback) {
      if (glob == null) {
        glob = require('glob');
      }
      return glob(this.avatarGlob(login), (function(_this) {
        return function(err, files) {
          var createdOn, filename, i, imagePath, len, ref;
          if (err) {
            return callback(err);
          }
          files.sort().reverse();
          for (i = 0, len = files.length; i < len; i++) {
            imagePath = files[i];
            filename = path.basename(imagePath);
            ref = filename.split('-'), createdOn = ref[ref.length - 1];
            if (Date.now() - parseInt(createdOn) < _this.expiry) {
              return callback(null, imagePath);
            }
          }
          return callback(null, null);
        };
      })(this));
    };

    AtomIoClient.prototype.avatarGlob = function(login) {
      return path.join(this.getCachePath(), login + "-*([0-9])");
    };

    AtomIoClient.prototype.fetchAndCacheAvatar = function(login, callback) {
      var imagePath, requestObject;
      if (!this.online()) {
        return callback(null, null);
      } else {
        imagePath = this.avatarPath(login);
        if (request == null) {
          request = require('request');
        }
        requestObject = {
          url: "https://avatars.githubusercontent.com/" + login,
          headers: DefaultRequestHeaders
        };
        return request.head(requestObject, function(error, response, body) {
          var writeStream;
          if ((error != null) || response.statusCode !== 200 || !response.headers['content-type'].startsWith('image/')) {
            return callback(error);
          } else {
            writeStream = fs.createWriteStream(imagePath);
            writeStream.on('finish', function() {
              return callback(null, imagePath);
            });
            writeStream.on('error', function(error) {
              writeStream.close();
              try {
                if (fs.existsSync(imagePath)) {
                  fs.unlinkSync(imagePath);
                }
              } catch (error1) {}
              return callback(error);
            });
            return request(requestObject).pipe(writeStream);
          }
        });
      }
    };

    AtomIoClient.prototype.expireAvatarCache = function() {
      var deleteAvatar;
      deleteAvatar = (function(_this) {
        return function(child) {
          var avatarPath;
          avatarPath = path.join(_this.getCachePath(), child);
          return fs.unlink(avatarPath, function(error) {
            if (error && error.code !== 'ENOENT') {
              return console.warn("Error deleting avatar (" + error.code + "): " + avatarPath);
            }
          });
        };
      })(this);
      return fs.readdir(this.getCachePath(), function(error, _files) {
        var children, filename, files, i, keep, key, len, parts, results, stamp;
        if (_files == null) {
          _files = [];
        }
        files = {};
        for (i = 0, len = _files.length; i < len; i++) {
          filename = _files[i];
          parts = filename.split('-');
          stamp = parts.pop();
          key = parts.join('-');
          if (files[key] == null) {
            files[key] = [];
          }
          files[key].push(key + "-" + stamp);
        }
        results = [];
        for (key in files) {
          children = files[key];
          children.sort();
          keep = children.pop();
          results.push(children.forEach(deleteAvatar));
        }
        return results;
      });
    };

    AtomIoClient.prototype.getCachePath = function() {
      var remote;
      remote = require('electron').remote;
      return this.cachePath != null ? this.cachePath : this.cachePath = path.join(remote.app.getPath('userData'), 'Cache', 'settings-view');
    };

    return AtomIoClient;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9hdG9tLWlvLWNsaWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsSUFBQSxHQUFPOztFQUNQLE9BQUEsR0FBVTs7RUFDVixxQkFBQSxHQUF3QjtJQUFDLFlBQUEsRUFBYyxTQUFTLENBQUMsU0FBekI7OztFQUV4QixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1Msc0JBQUMsY0FBRCxFQUFrQixPQUFsQjtNQUFDLElBQUMsQ0FBQSxpQkFBRDtNQUFpQixJQUFDLENBQUEsVUFBRDs7UUFDN0IsSUFBQyxDQUFBLFVBQVc7O01BRVosSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFBLEdBQU8sRUFBUCxHQUFZLEVBQVosR0FBaUI7TUFDM0IsSUFBQyxDQUFBLGlCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtJQUxXOzsyQkFRYixNQUFBLEdBQVEsU0FBQyxLQUFELEVBQVEsUUFBUjthQUNOLElBQUMsQ0FBQSxZQUFELENBQWMsS0FBZCxFQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRCxFQUFNLE1BQU47QUFDbkIsY0FBQTtVQUFBLElBQW9FLE1BQXBFO1lBQUEsS0FBQSxHQUFRLElBQUksQ0FBQyxHQUFMLENBQUEsQ0FBQSxHQUFhLFFBQUEsQ0FBUyxNQUFNLENBQUMsS0FBUCxDQUFhLEdBQWIsQ0FBaUIsQ0FBQyxHQUFsQixDQUFBLENBQVQsQ0FBYixHQUFpRCxLQUFDLENBQUEsT0FBMUQ7O1VBQ0EsSUFBRyxNQUFBLElBQVcsQ0FBQyxDQUFJLEtBQUosSUFBYSxD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QUFDLElBQU4sQ0FBVyxHQUFYOztZQUNOLEtBQU0sQ0FBQSxHQUFBLElBQVE7O1VBQ2QsS0FBTSxDQUFBLEdBQUEsQ0FBSSxDQUFDLElBQVgsQ0FBbUIsR0FBRCxHQUFLLEdBQUwsR0FBUSxLQUExQjtBQUxGO0FBT0E7YUFBQSxZQUFBOztVQUNFLFFBQVEsQ0FBQyxJQUFULENBQUE7VUFDQSxJQUFBLEdBQU8sUUFBUSxDQUFDLEdBQVQsQ0FBQTt1QkFJUCxRQUFRLENBQUMsT0FBVCxDQUFpQixZQUFqQjtBQU5GOztNQVYwQixDQUE1QjtJQVBpQjs7MkJBeUJuQixZQUFBLEdBQWMsU0FBQTtBQUNaLFVBQUE7TUFBQyxTQUFVLE9BQUEsQ0FBUSxVQUFSO3NDQUNYLElBQUMsQ0FBQSxZQUFELElBQUMsQ0FBQSxZQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFYLENBQW1CLFVBQW5CLENBQVYsRUFBMEMsT0FBMUMsRUFBbUQsZUFBbkQ7SUFGRjs7Ozs7QUE5TGhCIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmdsb2IgPSBudWxsICAgICMgZGVmZXIgdW50aWwgdXNlZFxucmVxdWVzdCA9IG51bGwgIyBkZWZlciB1bnRpbCB1c2VkXG5EZWZhdWx0UmVxdWVzdEhlYWRlcnMgPSB7J1VzZXItQWdlbnQnOiBuYXZpZ2F0b3IudXNlckFnZW50fVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBdG9tSW9DbGllbnRcbiAgY29uc3RydWN0b3I6IChAcGFja2FnZU1hbmFnZXIsIEBiYXNlVVJMKSAtPlxuICAgIEBiYXNlVVJMID89ICdodHRwczovL2F0b20uaW8vYXBpLydcbiAgICAjIDEyIGhvdXIgZXhwaXJ5XG4gICAgQGV4cGlyeSA9IDEwMDAgKiA2MCAqIDYwICogMTJcbiAgICBAY3JlYXRlQXZhdGFyQ2FjaGUoKVxuICAgIEBleHBpcmVBdmF0YXJDYWNoZSgpXG5cbiAgIyBQdWJsaWM6IEdldCBhbiBhdmF0YXIgaW1hZ2UgZnJvbSB0aGUgZmlsZXN5c3RlbSwgZmV0Y2hpbmcgaXQgZmlyc3QgaWYgbmVjZXNzYXJ5XG4gIGF2YXRhcjogKGxvZ2luLCBjYWxsYmFjaykgLT5cbiAgICBAY2FjaGVkQXZhdGFyIGxvZ2luLCAoZXJyLCBjYWNoZWQpID0+XG4gICAgICBzdGFsZSA9IERhdGUubm93KCkgLSBwYXJzZUludChjYWNoZWQuc3BsaXQoJy0nKS5wb3AoKSkgPiBAZXhwaXJ5IGlmIGNhY2hlZFxuICAgICAgaWYgY2FjaGVkIGFuZCAobm90IHN0YWxlIG9yIG5vdCBAb25saW5lKCkpXG4gICAgICAgIGNhbGxiYWNrIG51bGwsIGNhY2hlZFxuICAgICAgZWxzZVxuICAgICAgICBAZmV0Y2hBbmRDYWNoZUF2YXRhcihsb2dpbiwgY2FsbGJhY2spXG5cbiAgIyBQdWJsaWM6IGdldCBhIHBhY2thZ2UgZnJvbSB0aGUgYXRvbS5pbyBBUEksIHdpdGggdGhlIGFwcHJvcHJpYXRlIGxldmVsIG9mXG4gICMgY2FjaGluZy5cbiAgcGFja2FnZTogKG5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIHBhY2thZ2VQYXRoID0gXCJwYWNrYWdlcy8je25hbWV9XCJcbiAgICBAZmV0Y2hGcm9tQ2FjaGUgcGFja2FnZVBhdGgsIHt9LCAoZXJyLCBkYXRhKSA9PlxuICAgICAgaWYgZGF0YVxuICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhKVxuICAgICAgZWxzZVxuICAgICAgICBAcmVxdWVzdChwYWNrYWdlUGF0aCwgY2FsbGJhY2spXG5cbiAgZmVhdHVyZWRQYWNrYWdlczogKGNhbGxiYWNrKSAtPlxuICAgICMgVE9ETyBjbGVhbiB1cCBjYWNoaW5nIGNvcHlwYXN0YVxuICAgIEBmZXRjaEZyb21DYWNoZSAncGFja2FnZXMvZmVhdHVyZWQnLCB7fSwgKGVyciwgZGF0YSkgPT5cbiAgICAgIGlmIGRhdGFcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSlcbiAgICAgIGVsc2VcbiAgICAgICAgQGdldEZlYXR1cmVkKGZhbHNlLCBjYWxsYmFjaylcblxuICBmZWF0dXJlZFRoZW1lczogKGNhbGxiYWNrKSAtPlxuICAgICMgVE9ETyBjbGVhbiB1cCBjYWNoaW5nIGNvcHlwYXN0YVxuICAgIEBmZXRjaEZyb21DYWNoZSAndGhlbWVzL2ZlYXR1cmVkJywge30sIChlcnIsIGRhdGEpID0+XG4gICAgICBpZiBkYXRhXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpXG4gICAgICBlbHNlXG4gICAgICAgIEBnZXRGZWF0dXJlZCh0cnVlLCBjYWxsYmFjaylcblxuICBnZXRGZWF0dXJlZDogKGxvYWRUaGVtZXMsIGNhbGxiYWNrKSAtPlxuICAgICMgYXBtIGFscmVhZHkgZG9lcyB0aGlzLCBtaWdodCBhcyB3ZWxsIHVzZSBpdCBpbnN0ZWFkIG9mIHJlcXVlc3QgaSBndWVzcz8gVGhlXG4gICAgIyBkb3duc2lkZSBpcyB0aGF0IEkgbmVlZCB0byByZXBlYXQgY2FjaGluZyBsb2dpYyBoZXJlLlxuICAgIEBwYWNrYWdlTWFuYWdlci5nZXRGZWF0dXJlZChsb2FkVGhlbWVzKVxuICAgICAgLnRoZW4gKHBhY2thZ2VzKSA9PlxuICAgICAgICAjIGNvcHlwYXN0YSBmcm9tIGJlbG93XG4gICAgICAgIGtleSA9IGlmIGxvYWRUaGVtZXMgdGhlbiAndGhlbWVzL2ZlYXR1cmVkJyBlbHNlICdwYWNrYWdlcy9mZWF0dXJlZCdcbiAgICAgICAgY2FjaGVkID1cbiAgICAgICAgICBkYXRhOiBwYWNrYWdlc1xuICAgICAgICAgIGNyZWF0ZWRPbjogRGF0ZS5ub3coKVxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShAY2FjaGVLZXlGb3JQYXRoKGtleSksIEpTT04uc3RyaW5naWZ5KGNhY2hlZCkpXG4gICAgICAgICMgZW5kIGNvcHlwYXN0YVxuICAgICAgICBjYWxsYmFjayhudWxsLCBwYWNrYWdlcylcbiAgICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKVxuXG4gIHJlcXVlc3Q6IChwYXRoLCBjYWxsYmFjaykgLT5cbiAgICByZXF1ZXN0ID89IHJlcXVpcmUgJ3JlcXVlc3QnXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHVybDogXCIje0BiYXNlVVJMfSN7cGF0aH1cIlxuICAgICAgaGVhZGVyczogRGVmYXVsdFJlcXVlc3RIZWFkZXJzXG4gICAgfVxuXG4gICAgcmVxdWVzdCBvcHRpb25zLCAoZXJyLCByZXMsIGJvZHkpID0+XG4gICAgICB0cnlcbiAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoYm9keSlcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcilcblxuICAgICAgZGVsZXRlIGRhdGEudmVyc2lvbnNcbiAgICAgIGNhY2hlZCA9XG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgY3JlYXRlZE9uOiBEYXRlLm5vdygpXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShAY2FjaGVLZXlGb3JQYXRoKHBhdGgpLCBKU09OLnN0cmluZ2lmeShjYWNoZWQpKVxuICAgICAgY2FsbGJhY2soZXJyLCBjYWNoZWQuZGF0YSlcblxuICBjYWNoZUtleUZvclBhdGg6IChwYXRoKSAtPlxuICAgIFwic2V0dGluZ3Mtdmlldzoje3BhdGh9XCJcblxuICBvbmxpbmU6IC0+XG4gICAgbmF2aWdhdG9yLm9uTGluZVxuXG4gICMgVGhpcyBjb3VsZCB1c2UgYSBiZXR0ZXIgbmFtZSwgc2luY2UgaXQgY2hlY2tzIHdoZXRoZXIgaXQncyBhcHByb3ByaWF0ZSB0byByZXR1cm5cbiAgIyB0aGUgY2FjaGVkIGRhdGEgYW5kIHByZXRlbmRzIGl0J3MgbnVsbCBpZiBpdCdzIHN0YWxlIGFuZCB3ZSdyZSBvbmxpbmVcbiAgZmV0Y2hGcm9tQ2FjaGU6IChwYWNrYWdlUGF0aCwgb3B0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgdW5sZXNzIGNhbGxiYWNrXG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnNcbiAgICAgIG9wdGlvbnMgPSB7fVxuXG4gICAgdW5sZXNzIG9wdGlvbnMuZm9yY2VcbiAgICAgICMgU2V0IGBmb3JjZWAgdG8gdHJ1ZSBpZiB3ZSBjYW4ndCByZWFjaCB0aGUgbmV0d29yay5cbiAgICAgIG9wdGlvbnMuZm9yY2UgPSBub3QgQG9ubGluZSgpXG5cbiAgICBjYWNoZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShAY2FjaGVLZXlGb3JQYXRoKHBhY2thZ2VQYXRoKSlcbiAgICBjYWNoZWQgPSBpZiBjYWNoZWQgdGhlbiBKU09OLnBhcnNlKGNhY2hlZClcbiAgICBpZiBjYWNoZWQ/IGFuZCAobm90IEBvbmxpbmUoKSBvciBvcHRpb25zLmZvcmNlIG9yIChEYXRlLm5vdygpIC0gY2FjaGVkLmNyZWF0ZWRPbiA8IEBleHBpcnkpKVxuICAgICAgY2FjaGVkID89IGRhdGE6IHt9XG4gICAgICBjYWxsYmFjayhudWxsLCBjYWNoZWQuZGF0YSlcbiAgICBlbHNlIGlmIG5vdCBjYWNoZWQ/IGFuZCBub3QgQG9ubGluZSgpXG4gICAgICAjIFRoZSB1c2VyIGhhc24ndCByZXF1ZXN0ZWQgdGhpcyByZXNvdXJjZSBiZWZvcmUgYW5kIHRoZXJlJ3Mgbm8gd2F5IGZvciB1c1xuICAgICAgIyB0byBnZXQgaXQgdG8gdGhlbSBzbyBqdXN0IGhhbmQgYmFjayBhbiBlbXB0eSBvYmplY3Qgc28gY2FsbGVycyBkb24ndCBjcmFzaFxuICAgICAgY2FsbGJhY2sobnVsbCwge30pXG4gICAgZWxzZVxuICAgICAgIyBmYWxzeSBkYXRhIG1lYW5zIFwidHJ5IHRvIGhpdCB0aGUgbmV0d29ya1wiXG4gICAgICBjYWxsYmFjayhudWxsLCBudWxsKVxuXG4gIGNyZWF0ZUF2YXRhckNhY2hlOiAtPlxuICAgIGZzLm1ha2VUcmVlKEBnZXRDYWNoZVBhdGgoKSlcblxuICBhdmF0YXJQYXRoOiAobG9naW4pIC0+XG4gICAgcGF0aC5qb2luIEBnZXRDYWNoZVBhdGgoKSwgXCIje2xvZ2lufS0je0RhdGUubm93KCl9XCJcblxuICBjYWNoZWRBdmF0YXI6IChsb2dpbiwgY2FsbGJhY2spIC0+XG4gICAgZ2xvYiA/PSByZXF1aXJlICdnbG9iJ1xuICAgIGdsb2IgQGF2YXRhckdsb2IobG9naW4pLCAoZXJyLCBmaWxlcykgPT5cbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpIGlmIGVyclxuICAgICAgZmlsZXMuc29ydCgpLnJldmVyc2UoKVxuICAgICAgZm9yIGltYWdlUGF0aCBpbiBmaWxlc1xuICAgICAgICBmaWxlbmFtZSA9IHBhdGguYmFzZW5hbWUoaW1hZ2VQYXRoKVxuICAgICAgICBbLi4uLCBjcmVhdGVkT25dID0gZmlsZW5hbWUuc3BsaXQoJy0nKVxuICAgICAgICBpZiBEYXRlLm5vdygpIC0gcGFyc2VJbnQoY3JlYXRlZE9uKSA8IEBleHBpcnlcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgaW1hZ2VQYXRoKVxuICAgICAgY2FsbGJhY2sobnVsbCwgbnVsbClcblxuICBhdmF0YXJHbG9iOiAobG9naW4pIC0+XG4gICAgcGF0aC5qb2luIEBnZXRDYWNoZVBhdGgoKSwgXCIje2xvZ2lufS0qKFswLTldKVwiXG5cbiAgZmV0Y2hBbmRDYWNoZUF2YXRhcjogKGxvZ2luLCBjYWxsYmFjaykgLT5cbiAgICBpZiBub3QgQG9ubGluZSgpXG4gICAgICBjYWxsYmFjayhudWxsLCBudWxsKVxuICAgIGVsc2VcbiAgICAgIGltYWdlUGF0aCA9IEBhdmF0YXJQYXRoIGxvZ2luXG4gICAgICByZXF1ZXN0ID89IHJlcXVpcmUgJ3JlcXVlc3QnXG4gICAgICByZXF1ZXN0T2JqZWN0ID0ge1xuICAgICAgICB1cmw6IFwiaHR0cHM6Ly9hdmF0YXJzLmdpdGh1YnVzZXJjb250ZW50LmNvbS8je2xvZ2lufVwiXG4gICAgICAgIGhlYWRlcnM6IERlZmF1bHRSZXF1ZXN0SGVhZGVyc1xuICAgICAgfVxuICAgICAgcmVxdWVzdC5oZWFkIHJlcXVlc3RPYmplY3QsIChlcnJvciwgcmVzcG9uc2UsIGJvZHkpIC0+XG4gICAgICAgIGlmIGVycm9yPyBvciByZXNwb25zZS5zdGF0dXNDb2RlIGlzbnQgMjAwIG9yIG5vdCByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LXR5cGUnXS5zdGFydHNXaXRoKCdpbWFnZS8nKVxuICAgICAgICAgIGNhbGxiYWNrKGVycm9yKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgd3JpdGVTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSBpbWFnZVBhdGhcbiAgICAgICAgICB3cml0ZVN0cmVhbS5vbiAnZmluaXNoJywgLT4gY2FsbGJhY2sobnVsbCwgaW1hZ2VQYXRoKVxuICAgICAgICAgIHdyaXRlU3RyZWFtLm9uICdlcnJvcicsIChlcnJvcikgLT5cbiAgICAgICAgICAgIHdyaXRlU3RyZWFtLmNsb3NlKClcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jIGltYWdlUGF0aCBpZiBmcy5leGlzdHNTeW5jIGltYWdlUGF0aFxuICAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpXG4gICAgICAgICAgcmVxdWVzdChyZXF1ZXN0T2JqZWN0KS5waXBlKHdyaXRlU3RyZWFtKVxuXG4gICMgVGhlIGNhY2hlIGV4cGlyeSBkb2Vzbid0IG5lZWQgdG8gYmUgY2xldmVyLCBvciBldmVuIGNvbXBhcmUgZGF0ZXMsIGl0IGp1c3RcbiAgIyBuZWVkcyB0byBhbHdheXMga2VlcCBhcm91bmQgdGhlIG5ld2VzdCBpdGVtLCBhbmQgdGhhdCBpdGVtIG9ubHkuIFRoZSBsb2NhbFN0b3JhZ2VcbiAgIyBjYWNoZSB1cGRhdGVzIGluIHBsYWNlLCBzbyBpdCBkb2Vzbid0IG5lZWQgdG8gYmUgcHVyZ2VkLlxuXG4gIGV4cGlyZUF2YXRhckNhY2hlOiAtPlxuICAgIGRlbGV0ZUF2YXRhciA9IChjaGlsZCkgPT5cbiAgICAgIGF2YXRhclBhdGggPSBwYXRoLmpvaW4oQGdldENhY2hlUGF0aCgpLCBjaGlsZClcbiAgICAgIGZzLnVubGluayBhdmF0YXJQYXRoLCAoZXJyb3IpIC0+XG4gICAgICAgIGlmIGVycm9yIGFuZCBlcnJvci5jb2RlIGlzbnQgJ0VOT0VOVCcgIyBJZ25vcmUgY2FjaGUgcGF0aHMgdGhhdCBkb24ndCBleGlzdFxuICAgICAgICAgIGNvbnNvbGUud2FybihcIkVycm9yIGRlbGV0aW5nIGF2YXRhciAoI3tlcnJvci5jb2RlfSk6ICN7YXZhdGFyUGF0aH1cIilcblxuICAgIGZzLnJlYWRkaXIgQGdldENhY2hlUGF0aCgpLCAoZXJyb3IsIF9maWxlcykgLT5cbiAgICAgIF9maWxlcyA/PSBbXVxuICAgICAgZmlsZXMgPSB7fVxuICAgICAgZm9yIGZpbGVuYW1lIGluIF9maWxlc1xuICAgICAgICBwYXJ0cyA9IGZpbGVuYW1lLnNwbGl0KCctJylcbiAgICAgICAgc3RhbXAgPSBwYXJ0cy5wb3AoKVxuICAgICAgICBrZXkgPSBwYXJ0cy5qb2luKCctJylcbiAgICAgICAgZmlsZXNba2V5XSA/PSBbXVxuICAgICAgICBmaWxlc1trZXldLnB1c2ggXCIje2tleX0tI3tzdGFtcH1cIlxuXG4gICAgICBmb3Iga2V5LCBjaGlsZHJlbiBvZiBmaWxlc1xuICAgICAgICBjaGlsZHJlbi5zb3J0KClcbiAgICAgICAga2VlcCA9IGNoaWxkcmVuLnBvcCgpXG4gICAgICAgICMgUmlnaHQgbm93IGEgYnVuY2ggb2YgY2xpZW50cyBtaWdodCBiZSBpbnN0YW50aWF0ZWQgYXQgb25jZSwgc29cbiAgICAgICAgIyB3ZSBjYW4ganVzdCBpZ25vcmUgYXR0ZW1wdHMgdG8gdW5saW5rIGZpbGVzIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gcmVtb3ZlZFxuICAgICAgICAjIC0gdGhpcyBzaG91bGQgYmUgZml4ZWQgd2l0aCBhIHNpbmdsZXRvbiBjbGllbnRcbiAgICAgICAgY2hpbGRyZW4uZm9yRWFjaChkZWxldGVBdmF0YXIpXG5cbiAgZ2V0Q2FjaGVQYXRoOiAtPlxuICAgIHtyZW1vdGV9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG4gICAgQGNhY2hlUGF0aCA/PSBwYXRoLmpvaW4ocmVtb3RlLmFwcC5nZXRQYXRoKCd1c2VyRGF0YScpLCAnQ2FjaGUnLCAnc2V0dGluZ3MtdmlldycpXG4iXX0=
