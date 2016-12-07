(function() {
  var Emitter, Result, ResultsModel, _, binaryIndex, escapeHelper, stringCompare,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  Emitter = require('atom').Emitter;

  escapeHelper = require('../escape-helper');

  Result = (function() {
    Result.create = function(result) {
      var ref;
      if (result != null ? (ref = result.matches) != null ? ref.length : void 0 : void 0) {
        return new Result(result);
      } else {
        return null;
      }
    };

    function Result(result) {
      _.extend(this, result);
    }

    return Result;

  })();

  module.exports = ResultsModel = (function() {
    function ResultsModel(findOptions) {
      this.findOptions = findOptions;
      this.onContentsModified = bind(this.onContentsModified, this);
      this.emitter = new Emitter;
      atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return editor.onDidStopChanging(function() {
            return _this.onContentsModified(editor);
          });
        };
      })(this));
      this.clear();
    }

    ResultsModel.prototype.onDidClear = function(callback) {
      return this.emitter.on('did-clear', callback);
    };

    ResultsModel.prototype.onDidClearSearchState = function(callback) {
      return this.emitter.on('did-clear-search-state', callback);
    };

    ResultsModel.prototype.onDidClearReplacementState = function(callback) {
      return this.emitter.on('did-clear-replacement-state', callback);
    };

    ResultsModel.prototype.onDidSearchPaths = function(callback) {
      return this.emitter.on('did-search-paths', callback);
    };

    ResultsModel.prototype.onDidErrorForPath = function(callback) {
      return this.emitter.on('did-error-for-path', callback);
    };

    ResultsModel.prototype.onDidStartSearching = function(callback) {
      return this.emitter.on('did-start-searching', callback);
    };

    ResultsModel.prototype.onDidCancelSearching = function(callback) {
      return this.emitter.on('did-cancel-searching', callback);
    };

    ResultsModel.prototype.onDidFinishSearching = function(callback) {
      return this.emitter.on('did-finish-searching', callback);
    };

    ResultsModel.prototype.onDidStartReplacing = function(callback) {
      return this.emitter.on('did-start-replacing', callback);
    };

    ResultsModel.prototype.onDidFinishReplacing = function(callback) {
      return this.emitter.on('did-finish-replacing', callback);
    };

    ResultsModel.prototype.onDidSearchPath = function(callback) {
      return this.emitter.on('did-search-path', callback);
    };

    ResultsModel.prototype.onDidReplacePath = function(callback) {
      return this.emitter.on('did-replace-path', callback);
    };

    ResultsModel.prototype.onDidAddResult = function(callback) {
      return this.emitter.on('did-add-result', callback);
    };

    ResultsModel.prototype.onDidRemoveResult = function(callback) {
      return this.emitter.on('did-remove-result', callback);
    };

    ResultsModel.prototype.clear = function() {
      this.clearSearchState();
      this.clearReplacementState();
      return this.emitter.emit('did-clear', this.getResultsSummary());
    };

    ResultsModel.prototype.clearSearchState = function() {
      this.pathCount = 0;
      this.matchCount = 0;
      this.regex = null;
      this.results = {};
      this.paths = [];
      this.active = false;
      this.searchErrors = null;
      if (this.inProgressSearchPromise != null) {
        this.inProgressSearchPromise.cancel();
        this.inProgressSearchPromise = null;
      }
      return this.emitter.emit('did-clear-search-state', this.getResultsSummary());
    };

    ResultsModel.prototype.clearReplacementState = function() {
      this.replacePattern = null;
      this.replacedPathCount = null;
      this.replacementCount = null;
      this.replacementErrors = null;
      return this.emitter.emit('did-clear-replacement-state', this.getResultsSummary());
    };

    ResultsModel.prototype.shoudldRerunSearch = function(findPattern, pathsPattern, replacePattern, options) {
      var onlyRunIfChanged;
      if (options == null) {
        options = {};
      }
      onlyRunIfChanged = options.onlyRunIfChanged;
      if (onlyRunIfChanged && (findPattern != null) && (pathsPattern != null) && findPattern === this.lastFindPattern && pathsPattern === this.lastPathsPattern) {
        return false;
      } else {
        return true;
      }
    };

    ResultsModel.prototype.search = function(findPattern, pathsPattern, replacePattern, options) {
      var keepReplacementState, onPathsSearched, searchPaths;
      if (options == null) {
        options = {};
      }
      if (!this.shoudldRerunSearch(findPattern, pathsPattern, replacePattern, options)) {
        return Promise.resolve();
      }
      keepReplacementState = options.keepReplacementState;
      if (keepReplacementState) {
        this.clearSearchState();
      } else {
        this.clear();
      }
      this.lastFindPattern = findPattern;
      this.lastPathsPattern = pathsPattern;
      this.findOptions.set(_.extend({
        findPattern: findPattern,
        replacePattern: replacePattern,
        pathsPattern: pathsPattern
      }, options));
      this.regex = this.findOptions.getFindPatternRegex();
      this.active = true;
      searchPaths = this.pathsArrayFromPathsPattern(pathsPattern);
      onPathsSearched = (function(_this) {
        return function(numberOfPathsSearched) {
          return _this.emitter.emit('did-search-paths', numberOfPathsSearched);
        };
      })(this);
      this.inProgressSearchPromise = atom.workspace.scan(this.regex, {
        paths: searchPaths,
        onPathsSearched: onPathsSearched
      }, (function(_this) {
        return function(result, error) {
          if (result) {
            return _this.setResult(result.filePath, Result.create(result));
          } else {
            if (_this.searchErrors == null) {
              _this.searchErrors = [];
            }
            _this.searchErrors.push(error);
            return _this.emitter.emit('did-error-for-path', error);
          }
        };
      })(this));
      this.emitter.emit('did-start-searching', this.inProgressSearchPromise);
      return this.inProgressSearchPromise.then((function(_this) {
        return function(message) {
          if (message === 'cancelled') {
            return _this.emitter.emit('did-cancel-searching');
          } else {
            _this.inProgressSearchPromise = null;
            return _this.emitter.emit('did-finish-searching', _this.getResultsSummary());
          }
        };
      })(this));
    };

    ResultsModel.prototype.replace = function(pathsPattern, replacePattern, replacementPaths) {
      var promise;
      if (!(this.findOptions.findPattern && (this.regex != null))) {
        return;
      }
      this.findOptions.set({
        replacePattern: replacePattern,
        pathsPattern: pathsPattern
      });
      if (this.findOptions.useRegex) {
        replacePattern = escapeHelper.unescapeEscapeSequence(replacePattern);
      }
      this.active = false;
      this.replacedPathCount = 0;
      this.replacementCount = 0;
      promise = atom.workspace.replace(this.regex, replacePattern, replacementPaths, (function(_this) {
        return function(result, error) {
          if (result) {
            if (result.replacements) {
              _this.replacedPathCount++;
              _this.replacementCount += result.replacements;
            }
            return _this.emitter.emit('did-replace-path', result);
          } else {
            if (_this.replacementErrors == null) {
              _this.replacementErrors = [];
            }
            _this.replacementErrors.push(error);
            return _this.emitter.emit('did-error-for-path', error);
          }
        };
      })(this));
      this.emitter.emit('did-start-replacing', promise);
      return promise.then((function(_this) {
        return function() {
          _this.emitter.emit('did-finish-replacing', _this.getResultsSummary());
          return _this.search(_this.findOptions.findPattern, _this.findOptions.pathsPattern, _this.findOptions.replacePattern, {
            keepReplacementState: true
          });
        };
      })(this))["catch"](function(e) {
        return console.error(e.stack);
      });
    };

    ResultsModel.prototype.setActive = function(isActive) {
      if ((isActive && this.findOptions.findPattern) || !isActive) {
        return this.active = isActive;
      }
    };

    ResultsModel.prototype.getActive = function() {
      return this.active;
    };

    ResultsModel.prototype.getFindOptions = function() {
      return this.findOptions;
    };

    ResultsModel.prototype.getLastFindPattern = function() {
      return this.lastFindPattern;
    };

    ResultsModel.prototype.getResultsSummary = function() {
      var findPattern, ref, replacePattern;
      findPattern = (ref = this.lastFindPattern) != null ? ref : this.findOptions.findPattern;
      replacePattern = this.findOptions.replacePattern;
      return {
        findPattern: findPattern,
        replacePattern: replacePattern,
        pathCount: this.pathCount,
        matchCount: this.matchCount,
        searchErrors: this.searchErrors,
        replacedPathCount: this.replacedPathCount,
        replacementCount: this.replacementCount,
        replacementErrors: this.replacementErrors
      };
    };

    ResultsModel.prototype.getPathCount = function() {
      return this.pathCount;
    };

    ResultsModel.prototype.getMatchCount = function() {
      return this.matchCount;
    };

    ResultsModel.prototype.getPaths = function() {
      return this.paths;
    };

    ResultsModel.prototype.getResult = function(filePath) {
      return this.results[filePath];
    };

    ResultsModel.prototype.setResult = function(filePath, result) {
      if (result) {
        return this.addResult(filePath, result);
      } else {
        return this.removeResult(filePath);
      }
    };

    ResultsModel.prototype.addResult = function(filePath, result) {
      var filePathInsertedIndex;
      filePathInsertedIndex = null;
      if (this.results[filePath]) {
        this.matchCount -= this.results[filePath].matches.length;
      } else {
        this.pathCount++;
        filePathInsertedIndex = binaryIndex(this.paths, filePath, stringCompare);
        this.paths.splice(filePathInsertedIndex, 0, filePath);
      }
      this.matchCount += result.matches.length;
      this.results[filePath] = result;
      return this.emitter.emit('did-add-result', {
        filePath: filePath,
        result: result,
        filePathInsertedIndex: filePathInsertedIndex
      });
    };

    ResultsModel.prototype.removeResult = function(filePath) {
      if (this.results[filePath]) {
        this.pathCount--;
        this.matchCount -= this.results[filePath].matches.length;
        this.paths = _.without(this.paths, filePath);
        delete this.results[filePath];
        return this.emitter.emit('did-remove-result', {
          filePath: filePath
        });
      }
    };

    ResultsModel.prototype.onContentsModified = function(editor) {
      var matches, result;
      if (!(this.active && this.regex)) {
        return;
      }
      if (!editor.getPath()) {
        return;
      }
      matches = [];
      editor.scan(this.regex, function(match) {
        return matches.push(match);
      });
      result = Result.create({
        matches: matches
      });
      this.setResult(editor.getPath(), result);
      return this.emitter.emit('did-finish-searching', this.getResultsSummary());
    };

    ResultsModel.prototype.pathsArrayFromPathsPattern = function(pathsPattern) {
      var i, inputPath, len, ref, results;
      ref = pathsPattern.trim().split(',');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        inputPath = ref[i];
        if (inputPath) {
          results.push(inputPath.trim());
        }
      }
      return results;
    };

    return ResultsModel;

  })();

  stringCompare = function(a, b) {
    return a.localeCompare(b);
  };

  binaryIndex = function(array, value, comparator) {
    var high, low, mid;
    low = 0;
    high = array.length;
    while (low < high) {
      mid = Math.floor((low + high) / 2);
      if (comparator(array[mid], value) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L3Jlc3VsdHMtbW9kZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwRUFBQTtJQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsVUFBVyxPQUFBLENBQVEsTUFBUjs7RUFDWixZQUFBLEdBQWUsT0FBQSxDQUFRLGtCQUFSOztFQUVUO0lBQ0osTUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLE1BQUQ7QUFDUCxVQUFBO01BQUEseURBQWtCLENBQUUsd0JBQXBCO2VBQW9DLElBQUEsTUFBQSxDQUFPLE1BQVAsRUFBcEM7T0FBQSxNQUFBO2VBQXdELEtBQXhEOztJQURPOztJQUdJLGdCQUFDLE1BQUQ7TUFDWCxDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFBZSxNQUFmO0lBRFc7Ozs7OztFQUdmLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxzQkFBQyxXQUFEO01BQUMsSUFBQyxDQUFBLGNBQUQ7O01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFDaEMsTUFBTSxDQUFDLGlCQUFQLENBQXlCLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGtCQUFELENBQW9CLE1BQXBCO1VBQUgsQ0FBekI7UUFEZ0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxDO01BR0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQU5XOzsyQkFRYixVQUFBLEdBQVksU0FBQyxRQUFEO2FBQ1YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksV0FBWixFQUF5QixRQUF6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LE9BQVAsQ0FBQSxDQUFYLEVBQTZCLE1BQTdCO2FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsc0JBQWQsRUFBc0MsSUFBQyxDQUFBLGlCQUFELENBQUEsQ0FBdEM7SUFWa0I7OzJCQVlwQiwwQkFBQSxHQUE0QixTQUFDLFlBQUQ7QUFDMUIsVUFBQTtBQUFDO0FBQUE7V0FBQSxxQ0FBQTs7WUFBc0U7dUJBQXRFLFNBQVMsQ0FBQyxJQUFWLENBQUE7O0FBQUE7O0lBRHlCOzs7Ozs7RUFHOUIsYUFBQSxHQUFnQixTQUFDLENBQUQsRUFBSSxDQUFKO1dBQVUsQ0FBQyxDQUFDLGFBQUYsQ0FBZ0IsQ0FBaEI7RUFBVjs7RUFFaEIsV0FBQSxHQUFjLFNBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxVQUFmO0FBRVosUUFBQTtJQUFBLEdBQUEsR0FBTTtJQUNOLElBQUEsR0FBTyxLQUFLLENBQUM7QUFDYixXQUFNLEdBQUEsR0FBTSxJQUFaO01BQ0UsR0FBQSxHQUFNLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxHQUFBLEdBQU0sSUFBUCxDQUFBLEdBQWUsQ0FBMUI7TUFDTixJQUFHLFVBQUEsQ0FBVyxLQUFNLENBQUEsR0FBQSxDQUFqQixFQUF1QixLQUF2QixDQUFBLEdBQWdDLENBQW5DO1FBQ0UsR0FBQSxHQUFNLEdBQUEsR0FBTSxFQURkO09BQUEsTUFBQTtRQUdFLElBQUEsR0FBTyxJQUhUOztJQUZGO1dBTUE7RUFWWTtBQW5QZCIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuZXNjYXBlSGVscGVyID0gcmVxdWlyZSAnLi4vZXNjYXBlLWhlbHBlcidcblxuY2xhc3MgUmVzdWx0XG4gIEBjcmVhdGU6IChyZXN1bHQpIC0+XG4gICAgaWYgcmVzdWx0Py5tYXRjaGVzPy5sZW5ndGggdGhlbiBuZXcgUmVzdWx0KHJlc3VsdCkgZWxzZSBudWxsXG5cbiAgY29uc3RydWN0b3I6IChyZXN1bHQpIC0+XG4gICAgXy5leHRlbmQodGhpcywgcmVzdWx0KVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBSZXN1bHRzTW9kZWxcbiAgY29uc3RydWN0b3I6IChAZmluZE9wdGlvbnMpIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgPT4gQG9uQ29udGVudHNNb2RpZmllZChlZGl0b3IpXG5cbiAgICBAY2xlYXIoKVxuXG4gIG9uRGlkQ2xlYXI6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNsZWFyJywgY2FsbGJhY2tcblxuICBvbkRpZENsZWFyU2VhcmNoU3RhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNsZWFyLXNlYXJjaC1zdGF0ZScsIGNhbGxiYWNrXG5cbiAgb25EaWRDbGVhclJlcGxhY2VtZW50U3RhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNsZWFyLXJlcGxhY2VtZW50LXN0YXRlJywgY2FsbGJhY2tcblxuICBvbkRpZFNlYXJjaFBhdGhzOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1zZWFyY2gtcGF0aHMnLCBjYWxsYmFja1xuXG4gIG9uRGlkRXJyb3JGb3JQYXRoOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1lcnJvci1mb3ItcGF0aCcsIGNhbGxiYWNrXG5cbiAgb25EaWRTdGFydFNlYXJjaGluZzogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtc3RhcnQtc2VhcmNoaW5nJywgY2FsbGJhY2tcblxuICBvbkRpZENhbmNlbFNlYXJjaGluZzogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2FuY2VsLXNlYXJjaGluZycsIGNhbGxiYWNrXG5cbiAgb25EaWRGaW5pc2hTZWFyY2hpbmc6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWZpbmlzaC1zZWFyY2hpbmcnLCBjYWxsYmFja1xuXG4gIG9uRGlkU3RhcnRSZXBsYWNpbmc6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXN0YXJ0LXJlcGxhY2luZycsIGNhbGxiYWNrXG5cbiAgb25EaWRGaW5pc2hSZXBsYWNpbmc6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWZpbmlzaC1yZXBsYWNpbmcnLCBjYWxsYmFja1xuXG4gIG9uRGlkU2VhcmNoUGF0aDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtc2VhcmNoLXBhdGgnLCBjYWxsYmFja1xuXG4gIG9uRGlkUmVwbGFjZVBhdGg6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXJlcGxhY2UtcGF0aCcsIGNhbGxiYWNrXG5cbiAgb25EaWRBZGRSZXN1bHQ6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1yZXN1bHQnLCBjYWxsYmFja1xuXG4gIG9uRGlkUmVtb3ZlUmVzdWx0OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZW1vdmUtcmVzdWx0JywgY2FsbGJhY2tcblxuICBjbGVhcjogLT5cbiAgICBAY2xlYXJTZWFyY2hTdGF0ZSgpXG4gICAgQGNsZWFyUmVwbGFjZW1lbnRTdGF0ZSgpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNsZWFyJywgQGdldFJlc3VsdHNTdW1tYXJ5KClcblxuICBjbGVhclNlYXJjaFN0YXRlOiAtPlxuICAgIEBwYXRoQ291bnQgPSAwXG4gICAgQG1hdGNoQ291bnQgPSAwXG4gICAgQHJlZ2V4ID0gbnVsbFxuICAgIEByZXN1bHRzID0ge31cbiAgICBAcGF0aHMgPSBbXVxuICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgIEBzZWFyY2hFcnJvcnMgPSBudWxsXG5cbiAgICBpZiBAaW5Qcm9ncmVzc1NlYXJjaFByb21pc2U/XG4gICAgICBAaW5Qcm9ncmVzc1NlYXJjaFByb21pc2UuY2FuY2VsKClcbiAgICAgIEBpblByb2dyZXNzU2VhcmNoUHJvbWlzZSA9IG51bGxcblxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jbGVhci1zZWFyY2gtc3RhdGUnLCBAZ2V0UmVzdWx0c1N1bW1hcnkoKVxuXG4gIGNsZWFyUmVwbGFjZW1lbnRTdGF0ZTogLT5cbiAgICBAcmVwbGFjZVBhdHRlcm4gPSBudWxsXG4gICAgQHJlcGxhY2VkUGF0aENvdW50ID0gbnVsbFxuICAgIEByZXBsYWNlbWVudENvdW50ID0gbnVsbFxuICAgIEByZXBsYWNlbWVudEVycm9ycyA9IG51bGxcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2xlYXItcmVwbGFjZW1lbnQtc3RhdGUnLCBAZ2V0UmVzdWx0c1N1bW1hcnkoKVxuXG4gIHNob3VkbGRSZXJ1blNlYXJjaDogKGZpbmRQYXR0ZXJuLCBwYXRoc1BhdHRlcm4sIHJlcGxhY2VQYXR0ZXJuLCBvcHRpb25zPXt9KSAtPlxuICAgIHtvbmx5UnVuSWZDaGFuZ2VkfSA9IG9wdGlvbnNcbiAgICBpZiBvbmx5UnVuSWZDaGFuZ2VkIGFuZCBmaW5kUGF0dGVybj8gYW5kIHBhdGhzUGF0dGVybj8gYW5kIGZpbmRQYXR0ZXJuIGlzIEBsYXN0RmluZFBhdHRlcm4gYW5kIHBhdGhzUGF0dGVybiBpcyBAbGFzdFBhdGhzUGF0dGVyblxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICB0cnVlXG5cbiAgc2VhcmNoOiAoZmluZFBhdHRlcm4sIHBhdGhzUGF0dGVybiwgcmVwbGFjZVBhdHRlcm4sIG9wdGlvbnM9e30pIC0+XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIHVubGVzcyBAc2hvdWRsZFJlcnVuU2VhcmNoKGZpbmRQYXR0ZXJuLCBwYXRoc1BhdHRlcm4sIHJlcGxhY2VQYXR0ZXJuLCBvcHRpb25zKVxuXG4gICAge2tlZXBSZXBsYWNlbWVudFN0YXRlfSA9IG9wdGlvbnNcbiAgICBpZiBrZWVwUmVwbGFjZW1lbnRTdGF0ZVxuICAgICAgQGNsZWFyU2VhcmNoU3RhdGUoKVxuICAgIGVsc2VcbiAgICAgIEBjbGVhcigpXG5cbiAgICBAbGFzdEZpbmRQYXR0ZXJuID0gZmluZFBhdHRlcm5cbiAgICBAbGFzdFBhdGhzUGF0dGVybiA9IHBhdGhzUGF0dGVyblxuICAgIEBmaW5kT3B0aW9ucy5zZXQoXy5leHRlbmQoe2ZpbmRQYXR0ZXJuLCByZXBsYWNlUGF0dGVybiwgcGF0aHNQYXR0ZXJufSwgb3B0aW9ucykpXG4gICAgQHJlZ2V4ID0gQGZpbmRPcHRpb25zLmdldEZpbmRQYXR0ZXJuUmVnZXgoKVxuXG4gICAgQGFjdGl2ZSA9IHRydWVcbiAgICBzZWFyY2hQYXRocyA9IEBwYXRoc0FycmF5RnJvbVBhdGhzUGF0dGVybihwYXRoc1BhdHRlcm4pXG5cbiAgICBvblBhdGhzU2VhcmNoZWQgPSAobnVtYmVyT2ZQYXRoc1NlYXJjaGVkKSA9PlxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXNlYXJjaC1wYXRocycsIG51bWJlck9mUGF0aHNTZWFyY2hlZFxuXG4gICAgQGluUHJvZ3Jlc3NTZWFyY2hQcm9taXNlID0gYXRvbS53b3Jrc3BhY2Uuc2NhbiBAcmVnZXgsIHtwYXRoczogc2VhcmNoUGF0aHMsIG9uUGF0aHNTZWFyY2hlZH0sIChyZXN1bHQsIGVycm9yKSA9PlxuICAgICAgaWYgcmVzdWx0XG4gICAgICAgIEBzZXRSZXN1bHQocmVzdWx0LmZpbGVQYXRoLCBSZXN1bHQuY3JlYXRlKHJlc3VsdCkpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZWFyY2hFcnJvcnMgPz0gW11cbiAgICAgICAgQHNlYXJjaEVycm9ycy5wdXNoKGVycm9yKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZXJyb3ItZm9yLXBhdGgnLCBlcnJvclxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXN0YXJ0LXNlYXJjaGluZycsIEBpblByb2dyZXNzU2VhcmNoUHJvbWlzZVxuICAgIEBpblByb2dyZXNzU2VhcmNoUHJvbWlzZS50aGVuIChtZXNzYWdlKSA9PlxuICAgICAgaWYgbWVzc2FnZSBpcyAnY2FuY2VsbGVkJ1xuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2FuY2VsLXNlYXJjaGluZydcbiAgICAgIGVsc2VcbiAgICAgICAgQGluUHJvZ3Jlc3NTZWFyY2hQcm9taXNlID0gbnVsbFxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZmluaXNoLXNlYXJjaGluZycsIEBnZXRSZXN1bHRzU3VtbWFyeSgpXG5cbiAgcmVwbGFjZTogKHBhdGhzUGF0dGVybiwgcmVwbGFjZVBhdHRlcm4sIHJlcGxhY2VtZW50UGF0aHMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZmluZE9wdGlvbnMuZmluZFBhdHRlcm4gYW5kIEByZWdleD9cblxuICAgIEBmaW5kT3B0aW9ucy5zZXQoe3JlcGxhY2VQYXR0ZXJuLCBwYXRoc1BhdHRlcm59KVxuXG4gICAgcmVwbGFjZVBhdHRlcm4gPSBlc2NhcGVIZWxwZXIudW5lc2NhcGVFc2NhcGVTZXF1ZW5jZShyZXBsYWNlUGF0dGVybikgaWYgQGZpbmRPcHRpb25zLnVzZVJlZ2V4XG5cbiAgICBAYWN0aXZlID0gZmFsc2UgIyBub3QgYWN0aXZlIHVudGlsIHRoZSBzZWFyY2ggaXMgZmluaXNoZWRcbiAgICBAcmVwbGFjZWRQYXRoQ291bnQgPSAwXG4gICAgQHJlcGxhY2VtZW50Q291bnQgPSAwXG5cbiAgICBwcm9taXNlID0gYXRvbS53b3Jrc3BhY2UucmVwbGFjZSBAcmVnZXgsIHJlcGxhY2VQYXR0ZXJuLCByZXBsYWNlbWVudFBhdGhzLCAocmVzdWx0LCBlcnJvcikgPT5cbiAgICAgIGlmIHJlc3VsdFxuICAgICAgICBpZiByZXN1bHQucmVwbGFjZW1lbnRzXG4gICAgICAgICAgQHJlcGxhY2VkUGF0aENvdW50KytcbiAgICAgICAgICBAcmVwbGFjZW1lbnRDb3VudCArPSByZXN1bHQucmVwbGFjZW1lbnRzXG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1yZXBsYWNlLXBhdGgnLCByZXN1bHRcbiAgICAgIGVsc2VcbiAgICAgICAgQHJlcGxhY2VtZW50RXJyb3JzID89IFtdXG4gICAgICAgIEByZXBsYWNlbWVudEVycm9ycy5wdXNoKGVycm9yKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZXJyb3ItZm9yLXBhdGgnLCBlcnJvclxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXN0YXJ0LXJlcGxhY2luZycsIHByb21pc2VcbiAgICBwcm9taXNlLnRoZW4gPT5cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1maW5pc2gtcmVwbGFjaW5nJywgQGdldFJlc3VsdHNTdW1tYXJ5KClcbiAgICAgIEBzZWFyY2goQGZpbmRPcHRpb25zLmZpbmRQYXR0ZXJuLCBAZmluZE9wdGlvbnMucGF0aHNQYXR0ZXJuLCBAZmluZE9wdGlvbnMucmVwbGFjZVBhdHRlcm4sIHtrZWVwUmVwbGFjZW1lbnRTdGF0ZTogdHJ1ZX0pXG4gICAgLmNhdGNoIChlKSAtPlxuICAgICAgY29uc29sZS5lcnJvciBlLnN0YWNrXG5cbiAgc2V0QWN0aXZlOiAoaXNBY3RpdmUpIC0+XG4gICAgQGFjdGl2ZSA9IGlzQWN0aXZlIGlmIChpc0FjdGl2ZSBhbmQgQGZpbmRPcHRpb25zLmZpbmRQYXR0ZXJuKSBvciBub3QgaXNBY3RpdmVcblxuICBnZXRBY3RpdmU6IC0+IEBhY3RpdmVcblxuICBnZXRGaW5kT3B0aW9uczogLT4gQGZpbmRPcHRpb25zXG5cbiAgZ2V0TGFzdEZpbmRQYXR0ZXJuOiAtPiBAbGFzdEZpbmRQYXR0ZXJuXG5cbiAgZ2V0UmVzdWx0c1N1bW1hcnk6IC0+XG4gICAgZmluZFBhdHRlcm4gPSBAbGFzdEZpbmRQYXR0ZXJuID8gQGZpbmRPcHRpb25zLmZpbmRQYXR0ZXJuXG4gICAgcmVwbGFjZVBhdHRlcm4gPSBAZmluZE9wdGlvbnMucmVwbGFjZVBhdHRlcm5cbiAgICB7XG4gICAgICBmaW5kUGF0dGVyblxuICAgICAgcmVwbGFjZVBhdHRlcm5cbiAgICAgIEBwYXRoQ291bnRcbiAgICAgIEBtYXRjaENvdW50XG4gICAgICBAc2VhcmNoRXJyb3JzXG4gICAgICBAcmVwbGFjZWRQYXRoQ291bnRcbiAgICAgIEByZXBsYWNlbWVudENvdW50XG4gICAgICBAcmVwbGFjZW1lbnRFcnJvcnNcbiAgICB9XG5cbiAgZ2V0UGF0aENvdW50OiAtPlxuICAgIEBwYXRoQ291bnRcblxuICBnZXRNYXRjaENvdW50OiAtPlxuICAgIEBtYXRjaENvdW50XG5cbiAgZ2V0UGF0aHM6IC0+XG4gICAgQHBhdGhzXG5cbiAgZ2V0UmVzdWx0OiAoZmlsZVBhdGgpIC0+XG4gICAgQHJlc3VsdHNbZmlsZVBhdGhdXG5cbiAgc2V0UmVzdWx0OiAoZmlsZVBhdGgsIHJlc3VsdCkgLT5cbiAgICBpZiByZXN1bHRcbiAgICAgIEBhZGRSZXN1bHQoZmlsZVBhdGgsIHJlc3VsdClcbiAgICBlbHNlXG4gICAgICBAcmVtb3ZlUmVzdWx0KGZpbGVQYXRoKVxuXG4gIGFkZFJlc3VsdDogKGZpbGVQYXRoLCByZXN1bHQpIC0+XG4gICAgZmlsZVBhdGhJbnNlcnRlZEluZGV4ID0gbnVsbFxuICAgIGlmIEByZXN1bHRzW2ZpbGVQYXRoXVxuICAgICAgQG1hdGNoQ291bnQgLT0gQHJlc3VsdHNbZmlsZVBhdGhdLm1hdGNoZXMubGVuZ3RoXG4gICAgZWxzZVxuICAgICAgQHBhdGhDb3VudCsrXG4gICAgICBmaWxlUGF0aEluc2VydGVkSW5kZXggPSBiaW5hcnlJbmRleChAcGF0aHMsIGZpbGVQYXRoLCBzdHJpbmdDb21wYXJlKVxuICAgICAgQHBhdGhzLnNwbGljZShmaWxlUGF0aEluc2VydGVkSW5kZXgsIDAsIGZpbGVQYXRoKVxuXG4gICAgQG1hdGNoQ291bnQgKz0gcmVzdWx0Lm1hdGNoZXMubGVuZ3RoXG5cbiAgICBAcmVzdWx0c1tmaWxlUGF0aF0gPSByZXN1bHRcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLXJlc3VsdCcsIHtmaWxlUGF0aCwgcmVzdWx0LCBmaWxlUGF0aEluc2VydGVkSW5kZXh9XG5cbiAgcmVtb3ZlUmVzdWx0OiAoZmlsZVBhdGgpIC0+XG4gICAgaWYgQHJlc3VsdHNbZmlsZVBhdGhdXG4gICAgICBAcGF0aENvdW50LS1cbiAgICAgIEBtYXRjaENvdW50IC09IEByZXN1bHRzW2ZpbGVQYXRoXS5tYXRjaGVzLmxlbmd0aFxuXG4gICAgICBAcGF0aHMgPSBfLndpdGhvdXQoQHBhdGhzLCBmaWxlUGF0aClcbiAgICAgIGRlbGV0ZSBAcmVzdWx0c1tmaWxlUGF0aF1cbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1yZW1vdmUtcmVzdWx0Jywge2ZpbGVQYXRofVxuXG4gIG9uQ29udGVudHNNb2RpZmllZDogKGVkaXRvcikgPT5cbiAgICByZXR1cm4gdW5sZXNzIEBhY3RpdmUgYW5kIEByZWdleFxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yLmdldFBhdGgoKVxuXG4gICAgbWF0Y2hlcyA9IFtdXG4gICAgZWRpdG9yLnNjYW4gQHJlZ2V4LCAobWF0Y2gpIC0+XG4gICAgICBtYXRjaGVzLnB1c2gobWF0Y2gpXG5cbiAgICByZXN1bHQgPSBSZXN1bHQuY3JlYXRlKHttYXRjaGVzfSlcbiAgICBAc2V0UmVzdWx0KGVkaXRvci5nZXRQYXRoKCksIHJlc3VsdClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZmluaXNoLXNlYXJjaGluZycsIEBnZXRSZXN1bHRzU3VtbWFyeSgpXG5cbiAgcGF0aHNBcnJheUZyb21QYXRoc1BhdHRlcm46IChwYXRoc1BhdHRlcm4pIC0+XG4gICAgKGlucHV0UGF0aC50cmltKCkgZm9yIGlucHV0UGF0aCBpbiBwYXRoc1BhdHRlcm4udHJpbSgpLnNwbGl0KCcsJykgd2hlbiBpbnB1dFBhdGgpXG5cbnN0cmluZ0NvbXBhcmUgPSAoYSwgYikgLT4gYS5sb2NhbGVDb21wYXJlKGIpXG5cbmJpbmFyeUluZGV4ID0gKGFycmF5LCB2YWx1ZSwgY29tcGFyYXRvcikgLT5cbiAgIyBMaWZ0ZWQgZnJvbSB1bmRlcnNjb3JlJ3MgXy5zb3J0ZWRJbmRleCA7IGFkZHMgYSBmbGV4aWJsZSBjb21wYXJhdG9yXG4gIGxvdyA9IDBcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aFxuICB3aGlsZSBsb3cgPCBoaWdoXG4gICAgbWlkID0gTWF0aC5mbG9vcigobG93ICsgaGlnaCkgLyAyKVxuICAgIGlmIGNvbXBhcmF0b3IoYXJyYXlbbWlkXSwgdmFsdWUpIDwgMFxuICAgICAgbG93ID0gbWlkICsgMVxuICAgIGVsc2VcbiAgICAgIGhpZ2ggPSBtaWRcbiAgbG93XG4iXX0=
