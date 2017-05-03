(function() {
  var DefaultDirectorySearcher, DirectorySearch, Task,
    slice = [].slice;

  Task = require('./task');

  DirectorySearch = (function() {
    function DirectorySearch(rootPaths, regex, options) {
      var scanHandlerOptions;
      scanHandlerOptions = {
        ignoreCase: regex.ignoreCase,
        inclusions: options.inclusions,
        includeHidden: options.includeHidden,
        excludeVcsIgnores: options.excludeVcsIgnores,
        globalExclusions: options.exclusions,
        follow: options.follow
      };
      this.task = new Task(require.resolve('./scan-handler'));
      this.task.on('scan:result-found', options.didMatch);
      this.task.on('scan:file-error', options.didError);
      this.task.on('scan:paths-searched', options.didSearchPaths);
      this.promise = new Promise((function(_this) {
        return function(resolve, reject) {
          _this.task.on('task:cancelled', reject);
          return _this.task.start(rootPaths, regex.source, scanHandlerOptions, function() {
            _this.task.terminate();
            return resolve();
          });
        };
      })(this));
    }

    DirectorySearch.prototype.then = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.promise.then.apply(this.promise, args);
    };

    DirectorySearch.prototype.cancel = function() {
      this.task.cancel();
      return null;
    };

    return DirectorySearch;

  })();

  module.exports = DefaultDirectorySearcher = (function() {
    function DefaultDirectorySearcher() {}

    DefaultDirectorySearcher.prototype.canSearchDirectory = function(directory) {
      return true;
    };

    DefaultDirectorySearcher.prototype.search = function(directories, regex, options) {
      var directorySearch, isCancelled, promise, rootPaths;
      rootPaths = directories.map(function(directory) {
        return directory.getPath();
      });
      isCancelled = false;
      directorySearch = new DirectorySearch(rootPaths, regex, options);
      promise = new Promise(function(resolve, reject) {
        return directorySearch.then(resolve, function() {
          if (isCancelled) {
            return resolve();
          } else {
            return reject();
          }
        });
      });
      return {
        then: promise.then.bind(promise),
        "catch": promise["catch"].bind(promise),
        cancel: function() {
          isCancelled = true;
          return directorySearch.cancel();
        }
      };
    };

    return DefaultDirectorySearcher;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9kZWZhdWx0LWRpcmVjdG9yeS1zZWFyY2hlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtDQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUlEO0lBQ1MseUJBQUMsU0FBRCxFQUFZLEtBQVosRUFBbUIsT0FBbkI7QUFDWCxVQUFBO01BQUEsa0JBQUEsR0FDRTtRQUFBLFVBQUEsRUFBWSxLQUFLLENBQUMsVUFBbEI7UUFDQSxVQUFBLEVBQVksT0FBTyxDQUFDLFVBRHBCO1FBRUEsYUFBQSxFQUFlLE9BQU8sQ0FBQyxhQUZ2QjtRQUdBLGlCQUFBLEVBQW1CLE9BQU8sQ0FBQyxpQkFIM0I7UUFJQSxnQkFBQSxFQUFrQixPQUFPLENBQUMsVUFKMUI7UUFLQSxNQUFBLEVBQVEsT0FBTyxDQUFDLE1BTGhCOztNQU1GLElBQUMsQ0FBQSxJQUFELEdBQVksSUFBQSxJQUFBLENBQUssT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsZ0JBQWhCLENBQUw7TUFDWixJQUFDLENBQUEsSUFBSSxDQUFDLEVBQU4sQ0FBUyxtQkFBVCxFQUE4QixPQUFPLENBQUMsUUFBdEM7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEVBQU4sQ0FBUyxpQkFBVCxFQUE0QixPQUFPLENBQUMsUUFBcEM7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEVBQU4sQ0FBUyxxQkFBVCxFQUFnQyxPQUFPLENBQUMsY0FBeEM7TUFDQSxJQUFDLENBQUEsT0FBRCxHQUFlLElBQUEsT0FBQSxDQUFRLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxPQUFELEVBQVUsTUFBVjtVQUNyQixLQUFDLENBQUEsSUFBSSxDQUFDLEVBQU4sQ0FBUyxnQkFBVCxFQUEyQixNQUEzQjtpQkFDQSxLQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sQ0FBWSxTQUFaLEVBQXVCLEtBQUssQ0FBQyxNQUE3QixFQUFxQyxrQkFBckMsRUFBeUQsU0FBQTtZQUN2RCxLQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBQTttQkFDQSxPQUFBLENBQUE7VUFGdUQsQ0FBekQ7UUFGcUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVI7SUFaSjs7OEJBa0JiLElBQUEsR0FBTSxTQUFBO0FBQ0osVUFBQTtNQURLO2FBQ0wsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBZCxDQUFvQixJQUFDLENBQUEsT0FBckIsRUFBOEIsSUFBOUI7SUFESTs7OEJBR04sTUFBQSxHQUFRLFNBQUE7TUFFTixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTthQUNBO0lBSE07Ozs7OztFQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozt1Q0FNSixrQkFBQSxHQUFvQixTQUFDLFNBQUQ7YUFBZTtJQUFmOzt1Q0FtQ3BCLE1BQUEsR0FBUSxTQUFDLFdBQUQsRUFBYyxLQUFkLEVBQXFCLE9BQXJCO0FBQ04sVUFBQTtNQUFBLFNBQUEsR0FBWSxXQUFXLENBQUMsR0FBWixDQUFnQixTQUFDLFNBQUQ7ZUFBZSxTQUFTLENBQUMsT0FBVixDQUFBO01BQWYsQ0FBaEI7TUFDWixXQUFBLEdBQWM7TUFDZCxlQUFBLEdBQXNCLElBQUEsZUFBQSxDQUFnQixTQUFoQixFQUEyQixLQUEzQixFQUFrQyxPQUFsQztNQUN0QixPQUFBLEdBQWMsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFELEVBQVUsTUFBVjtlQUNwQixlQUFlLENBQUMsSUFBaEIsQ0FBcUIsT0FBckIsRUFBOEIsU0FBQTtVQUM1QixJQUFHLFdBQUg7bUJBQ0UsT0FBQSxDQUFBLEVBREY7V0FBQSxNQUFBO21CQUdFLE1BQUEsQ0FBQSxFQUhGOztRQUQ0QixDQUE5QjtNQURvQixDQUFSO0FBTWQsYUFBTztRQUNMLElBQUEsRUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQWIsQ0FBa0IsT0FBbEIsQ0FERDtRQUVMLENBQUEsS0FBQSxDQUFBLEVBQU8sT0FBTyxFQUFDLEtBQUQsRUFBTSxDQUFDLElBQWQsQ0FBbUIsT0FBbkIsQ0FGRjtRQUdMLE1BQUEsRUFBUSxTQUFBO1VBQ04sV0FBQSxHQUFjO2lCQUNkLGVBQWUsQ0FBQyxNQUFoQixDQUFBO1FBRk0sQ0FISDs7SUFWRDs7Ozs7QUExRVYiLCJzb3VyY2VzQ29udGVudCI6WyJUYXNrID0gcmVxdWlyZSAnLi90YXNrJ1xuXG4jIFNlYXJjaGVzIGxvY2FsIGZpbGVzIGZvciBsaW5lcyBtYXRjaGluZyBhIHNwZWNpZmllZCByZWdleC4gSW1wbGVtZW50cyBgLnRoZW4oKWBcbiMgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCB3aXRoIGBQcm9taXNlLmFsbCgpYC5cbmNsYXNzIERpcmVjdG9yeVNlYXJjaFxuICBjb25zdHJ1Y3RvcjogKHJvb3RQYXRocywgcmVnZXgsIG9wdGlvbnMpIC0+XG4gICAgc2NhbkhhbmRsZXJPcHRpb25zID1cbiAgICAgIGlnbm9yZUNhc2U6IHJlZ2V4Lmlnbm9yZUNhc2VcbiAgICAgIGluY2x1c2lvbnM6IG9wdGlvbnMuaW5jbHVzaW9uc1xuICAgICAgaW5jbHVkZUhpZGRlbjogb3B0aW9ucy5pbmNsdWRlSGlkZGVuXG4gICAgICBleGNsdWRlVmNzSWdub3Jlczogb3B0aW9ucy5leGNsdWRlVmNzSWdub3Jlc1xuICAgICAgZ2xvYmFsRXhjbHVzaW9uczogb3B0aW9ucy5leGNsdXNpb25zXG4gICAgICBmb2xsb3c6IG9wdGlvbnMuZm9sbG93XG4gICAgQHRhc2sgPSBuZXcgVGFzayhyZXF1aXJlLnJlc29sdmUoJy4vc2Nhbi1oYW5kbGVyJykpXG4gICAgQHRhc2sub24gJ3NjYW46cmVzdWx0LWZvdW5kJywgb3B0aW9ucy5kaWRNYXRjaFxuICAgIEB0YXNrLm9uICdzY2FuOmZpbGUtZXJyb3InLCBvcHRpb25zLmRpZEVycm9yXG4gICAgQHRhc2sub24gJ3NjYW46cGF0aHMtc2VhcmNoZWQnLCBvcHRpb25zLmRpZFNlYXJjaFBhdGhzXG4gICAgQHByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgQHRhc2sub24oJ3Rhc2s6Y2FuY2VsbGVkJywgcmVqZWN0KVxuICAgICAgQHRhc2suc3RhcnQgcm9vdFBhdGhzLCByZWdleC5zb3VyY2UsIHNjYW5IYW5kbGVyT3B0aW9ucywgPT5cbiAgICAgICAgQHRhc2sudGVybWluYXRlKClcbiAgICAgICAgcmVzb2x2ZSgpXG5cbiAgdGhlbjogKGFyZ3MuLi4pIC0+XG4gICAgQHByb21pc2UudGhlbi5hcHBseShAcHJvbWlzZSwgYXJncylcblxuICBjYW5jZWw6IC0+XG4gICAgIyBUaGlzIHdpbGwgY2F1c2UgQHByb21pc2UgdG8gcmVqZWN0LlxuICAgIEB0YXNrLmNhbmNlbCgpXG4gICAgbnVsbFxuXG4jIERlZmF1bHQgcHJvdmlkZXIgZm9yIHRoZSBgYXRvbS5kaXJlY3Rvcnktc2VhcmNoZXJgIHNlcnZpY2UuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBEZWZhdWx0RGlyZWN0b3J5U2VhcmNoZXJcbiAgIyBEZXRlcm1pbmVzIHdoZXRoZXIgdGhpcyBvYmplY3Qgc3VwcG9ydHMgc2VhcmNoIGZvciBhIGBEaXJlY3RvcnlgLlxuICAjXG4gICMgKiBgZGlyZWN0b3J5YCB7RGlyZWN0b3J5fSB3aG9zZSBzZWFyY2ggbmVlZHMgbWlnaHQgYmUgc3VwcG9ydGVkIGJ5IHRoaXMgb2JqZWN0LlxuICAjXG4gICMgUmV0dXJucyBhIGBib29sZWFuYCBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpcyBvYmplY3QgY2FuIHNlYXJjaCB0aGlzIGBEaXJlY3RvcnlgLlxuICBjYW5TZWFyY2hEaXJlY3Rvcnk6IChkaXJlY3RvcnkpIC0+IHRydWVcblxuICAjIFBlcmZvcm1zIGEgdGV4dCBzZWFyY2ggZm9yIGZpbGVzIGluIHRoZSBzcGVjaWZpZWQgYERpcmVjdG9yeWAsIHN1YmplY3QgdG8gdGhlXG4gICMgc3BlY2lmaWVkIHBhcmFtZXRlcnMuXG4gICNcbiAgIyBSZXN1bHRzIGFyZSBzdHJlYW1lZCBiYWNrIHRvIHRoZSBjYWxsZXIgYnkgaW52b2tpbmcgbWV0aG9kcyBvbiB0aGUgc3BlY2lmaWVkIGBvcHRpb25zYCxcbiAgIyBzdWNoIGFzIGBkaWRNYXRjaGAgYW5kIGBkaWRFcnJvcmAuXG4gICNcbiAgIyAqIGBkaXJlY3Rvcmllc2Age0FycmF5fSBvZiB7RGlyZWN0b3J5fSBvYmplY3RzIHRvIHNlYXJjaCwgYWxsIG9mIHdoaWNoIGhhdmUgYmVlbiBhY2NlcHRlZCBieVxuICAjIHRoaXMgc2VhcmNoZXIncyBgY2FuU2VhcmNoRGlyZWN0b3J5KClgIHByZWRpY2F0ZS5cbiAgIyAqIGByZWdleGAge1JlZ0V4cH0gdG8gc2VhcmNoIHdpdGguXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICMgICAqIGBkaWRNYXRjaGAge0Z1bmN0aW9ufSBjYWxsIHdpdGggYSBzZWFyY2ggcmVzdWx0IHN0cnVjdHVyZWQgYXMgZm9sbG93czpcbiAgIyAgICAgKiBgc2VhcmNoUmVzdWx0YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgICAqIGBmaWxlUGF0aGAge1N0cmluZ30gYWJzb2x1dGUgcGF0aCB0byB0aGUgbWF0Y2hpbmcgZmlsZS5cbiAgIyAgICAgICAqIGBtYXRjaGVzYCB7QXJyYXl9IHdpdGggb2JqZWN0IGVsZW1lbnRzIHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAgICAgKiBgbGluZVRleHRgIHtTdHJpbmd9IFRoZSBmdWxsIHRleHQgb2YgdGhlIG1hdGNoaW5nIGxpbmUgKHdpdGhvdXQgYSBsaW5lIHRlcm1pbmF0b3IgY2hhcmFjdGVyKS5cbiAgIyAgICAgICAgICogYGxpbmVUZXh0T2Zmc2V0YCB7TnVtYmVyfSAoVGhpcyBhbHdheXMgc2VlbXMgdG8gYmUgMD8pXG4gICMgICAgICAgICAqIGBtYXRjaFRleHRgIHtTdHJpbmd9IFRoZSB0ZXh0IHRoYXQgbWF0Y2hlZCB0aGUgYHJlZ2V4YCB1c2VkIGZvciB0aGUgc2VhcmNoLlxuICAjICAgICAgICAgKiBgcmFuZ2VgIHtSYW5nZX0gSWRlbnRpZmllcyB0aGUgbWF0Y2hpbmcgcmVnaW9uIGluIHRoZSBmaWxlLiAoTGlrZWx5IGFzIGFuIGFycmF5IG9mIG51bWVyaWMgYXJyYXlzLilcbiAgIyAgICogYGRpZEVycm9yYCB7RnVuY3Rpb259IGNhbGwgd2l0aCBhbiBFcnJvciBpZiB0aGVyZSBpcyBhIHByb2JsZW0gZHVyaW5nIHRoZSBzZWFyY2guXG4gICMgICAqIGBkaWRTZWFyY2hQYXRoc2Age0Z1bmN0aW9ufSBwZXJpb2RpY2FsbHkgY2FsbCB3aXRoIHRoZSBudW1iZXIgb2YgcGF0aHMgc2VhcmNoZWQgdGh1cyBmYXIuXG4gICMgICAqIGBpbmNsdXNpb25zYCB7QXJyYXl9IG9mIGdsb2IgcGF0dGVybnMgKGFzIHN0cmluZ3MpIHRvIHNlYXJjaCB3aXRoaW4uIE5vdGUgdGhhdCB0aGlzXG4gICMgICBhcnJheSBtYXkgYmUgZW1wdHksIGluZGljYXRpbmcgdGhhdCBhbGwgZmlsZXMgc2hvdWxkIGJlIHNlYXJjaGVkLlxuICAjXG4gICMgICBFYWNoIGl0ZW0gaW4gdGhlIGFycmF5IGlzIGEgZmlsZS9kaXJlY3RvcnkgcGF0dGVybiwgZS5nLiwgYHNyY2AgdG8gc2VhcmNoIGluIHRoZSBcInNyY1wiXG4gICMgICBkaXJlY3Rvcnkgb3IgYCouanNgIHRvIHNlYXJjaCBhbGwgSmF2YVNjcmlwdCBmaWxlcy4gSW4gcHJhY3RpY2UsIHRoaXMgb2Z0ZW4gY29tZXMgZnJvbSB0aGVcbiAgIyAgIGNvbW1hLWRlbGltaXRlZCBsaXN0IG9mIHBhdHRlcm5zIGluIHRoZSBib3R0b20gdGV4dCBpbnB1dCBvZiB0aGUgUHJvamVjdEZpbmRWaWV3IGRpYWxvZy5cbiAgIyAgICogYGlnbm9yZUhpZGRlbmAge2Jvb2xlYW59IHdoZXRoZXIgdG8gaWdub3JlIGhpZGRlbiBmaWxlcy5cbiAgIyAgICogYGV4Y2x1ZGVWY3NJZ25vcmVzYCB7Ym9vbGVhbn0gd2hldGhlciB0byBleGNsdWRlIFZDUyBpZ25vcmVkIHBhdGhzLlxuICAjICAgKiBgZXhjbHVzaW9uc2Age0FycmF5fSBzaW1pbGFyIHRvIGluY2x1c2lvbnNcbiAgIyAgICogYGZvbGxvd2Age2Jvb2xlYW59IHdoZXRoZXIgc3ltbGlua3Mgc2hvdWxkIGJlIGZvbGxvd2VkLlxuICAjXG4gICMgUmV0dXJucyBhICp0aGVuYWJsZSogYERpcmVjdG9yeVNlYXJjaGAgdGhhdCBpbmNsdWRlcyBhIGBjYW5jZWwoKWAgbWV0aG9kLiBJZiBgY2FuY2VsKClgIGlzXG4gICMgaW52b2tlZCBiZWZvcmUgdGhlIGBEaXJlY3RvcnlTZWFyY2hgIGlzIGRldGVybWluZWQsIGl0IHdpbGwgcmVzb2x2ZSB0aGUgYERpcmVjdG9yeVNlYXJjaGAuXG4gIHNlYXJjaDogKGRpcmVjdG9yaWVzLCByZWdleCwgb3B0aW9ucykgLT5cbiAgICByb290UGF0aHMgPSBkaXJlY3Rvcmllcy5tYXAgKGRpcmVjdG9yeSkgLT4gZGlyZWN0b3J5LmdldFBhdGgoKVxuICAgIGlzQ2FuY2VsbGVkID0gZmFsc2VcbiAgICBkaXJlY3RvcnlTZWFyY2ggPSBuZXcgRGlyZWN0b3J5U2VhcmNoKHJvb3RQYXRocywgcmVnZXgsIG9wdGlvbnMpXG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICBkaXJlY3RvcnlTZWFyY2gudGhlbiByZXNvbHZlLCAtPlxuICAgICAgICBpZiBpc0NhbmNlbGxlZFxuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVqZWN0KClcbiAgICByZXR1cm4ge1xuICAgICAgdGhlbjogcHJvbWlzZS50aGVuLmJpbmQocHJvbWlzZSlcbiAgICAgIGNhdGNoOiBwcm9taXNlLmNhdGNoLmJpbmQocHJvbWlzZSlcbiAgICAgIGNhbmNlbDogLT5cbiAgICAgICAgaXNDYW5jZWxsZWQgPSB0cnVlXG4gICAgICAgIGRpcmVjdG9yeVNlYXJjaC5jYW5jZWwoKVxuICAgIH1cbiJdfQ==
