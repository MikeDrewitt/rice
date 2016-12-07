(function() {
  var PathScanner, PathSearcher, async, path, processPaths, ref, search;

  path = require("path");

  async = require("async");

  ref = require('scandal'), PathSearcher = ref.PathSearcher, PathScanner = ref.PathScanner, search = ref.search;

  module.exports = function(rootPaths, regexSource, options) {
    var PATHS_COUNTER_SEARCHED_CHUNK, callback, flags, pathsSearched, regex, searcher;
    callback = this.async();
    PATHS_COUNTER_SEARCHED_CHUNK = 50;
    pathsSearched = 0;
    searcher = new PathSearcher();
    searcher.on('file-error', function(arg) {
      var code, message, path;
      code = arg.code, path = arg.path, message = arg.message;
      return emit('scan:file-error', {
        code: code,
        path: path,
        message: message
      });
    });
    searcher.on('results-found', function(result) {
      return emit('scan:result-found', result);
    });
    flags = "g";
    if (options.ignoreCase) {
      flags += "i";
    }
    regex = new RegExp(regexSource, flags);
    return async.each(rootPaths, function(rootPath, next) {
      var options2, scanner;
      options2 = Object.assign({}, options, {
        inclusions: processPaths(rootPath, options.inclusions),
        globalExclusions: processPaths(rootPath, options.globalExclusions)
      });
      scanner = new PathScanner(rootPath, options2);
      scanner.on('path-found', function() {
        pathsSearched++;
        if (pathsSearched % PATHS_COUNTER_SEARCHED_CHUNK === 0) {
          return emit('scan:paths-searched', pathsSearched);
        }
      });
      return search(regex, scanner, searcher, function() {
        emit('scan:paths-searched', pathsSearched);
        return next();
      });
    }, callback);
  };

  processPaths = function(rootPath, paths) {
    var firstSegment, givenPath, i, len, results, rootPathBase, segments;
    if (!((paths != null ? paths.length : void 0) > 0)) {
      return paths;
    }
    rootPathBase = path.basename(rootPath);
    results = [];
    for (i = 0, len = paths.length; i < len; i++) {
      givenPath = paths[i];
      segments = givenPath.split(path.sep);
      firstSegment = segments.shift();
      results.push(givenPath);
      if (firstSegment === rootPathBase) {
        if (segments.length === 0) {
          results.push(path.join("**", "*"));
        } else {
          results.push(path.join.apply(path, segments));
        }
      }
    }
    return results;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zY2FuLWhhbmRsZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztFQUNSLE1BQXNDLE9BQUEsQ0FBUSxTQUFSLENBQXRDLEVBQUMsK0JBQUQsRUFBZSw2QkFBZixFQUE0Qjs7RUFFNUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxTQUFELEVBQVksV0FBWixFQUF5QixPQUF6QjtBQUNmLFFBQUE7SUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUVYLDRCQUFBLEdBQStCO0lBQy9CLGFBQUEsR0FBZ0I7SUFFaEIsUUFBQSxHQUFlLElBQUEsWUFBQSxDQUFBO0lBRWYsUUFBUSxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLFNBQUMsR0FBRDtBQUN4QixVQUFBO01BRDBCLGlCQUFNLGlCQUFNO2FBQ3RDLElBQUEsQ0FBSyxpQkFBTCxFQUF3QjtRQUFDLE1BQUEsSUFBRDtRQUFPLE1BQUEsSUFBUDtRQUFhLFNBQUEsT0FBYjtPQUF4QjtJQUR3QixDQUExQjtJQUdBLFFBQVEsQ0FBQyxFQUFULENBQVksZUFBWixFQUE2QixTQUFDLE1BQUQ7YUFDM0IsSUFBQSxDQUFLLG1CQUFMLEVBQTBCLE1BQTFCO0lBRDJCLENBQTdCO0lBR0EsS0FBQSxHQUFRO0lBQ1IsSUFBZ0IsT0FBTyxDQUFDLFVBQXhCO01BQUEsS0FBQSxJQUFTLElBQVQ7O0lBQ0EsS0FBQSxHQUFZLElBQUEsTUFBQSxDQUFPLFdBQVAsRUFBb0IsS0FBcEI7V0FFWixLQUFLLENBQUMsSUFBTixDQUNFLFNBREYsRUFFRSxTQUFDLFFBQUQsRUFBVyxJQUFYO0FBQ0UsVUFBQTtNQUFBLFFBQUEsR0FBVyxNQUFNLENBQUMsTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFDVDtRQUFBLFVBQUEsRUFBWSxZQUFBLENBQWEsUUFBYixFQUF1QixPQUFPLENBQUMsVUFBL0IsQ0FBWjtRQUNBLGdCQUFBLEVBQWtCLFlBQUEsQ0FBYSxRQUFiLEVBQXVCLE9BQU8sQ0FBQyxnQkFBL0IsQ0FEbEI7T0FEUztNQUlYLE9BQUEsR0FBYyxJQUFBLFdBQUEsQ0FBWSxRQUFaLEVBQXNCLFFBQXRCO01BRWQsT0FBTyxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXlCLFNBQUE7UUFDdkIsYUFBQTtRQUNBLElBQUcsYUFBQSxHQUFnQiw0QkFBaEIsS0FBZ0QsQ0FBbkQ7aUJBQ0UsSUFBQSxDQUFLLHFCQUFMLEVBQTRCLGFBQTVCLEVBREY7O01BRnVCLENBQXpCO2FBS0EsTUFBQSxDQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLFFBQXZCLEVBQWlDLFNBQUE7UUFDL0IsSUFBQSxDQUFLLHFCQUFMLEVBQTRCLGFBQTVCO2VBQ0EsSUFBQSxDQUFBO01BRitCLENBQWpDO0lBWkYsQ0FGRixFQWlCRSxRQWpCRjtFQWxCZTs7RUFzQ2pCLFlBQUEsR0FBZSxTQUFDLFFBQUQsRUFBVyxLQUFYO0FBQ2IsUUFBQTtJQUFBLElBQUEsQ0FBQSxrQkFBb0IsS0FBSyxDQUFFLGdCQUFQLEdBQWdCLENBQXBDLENBQUE7QUFBQSxhQUFPLE1BQVA7O0lBQ0EsWUFBQSxHQUFlLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZDtJQUNmLE9BQUEsR0FBVTtBQUNWLFNBQUEsdUNBQUE7O01BQ0UsUUFBQSxHQUFXLFNBQVMsQ0FBQyxLQUFWLENBQWdCLElBQUksQ0FBQyxHQUFyQjtNQUNYLFlBQUEsR0FBZSxRQUFRLENBQUMsS0FBVCxDQUFBO01BQ2YsT0FBTyxDQUFDLElBQVIsQ0FBYSxTQUFiO01BQ0EsSUFBRyxZQUFBLEtBQWdCLFlBQW5CO1FBQ0UsSUFBRyxRQUFRLENBQUMsTUFBVCxLQUFtQixDQUF0QjtVQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFWLEVBQWdCLEdBQWhCLENBQWIsRUFERjtTQUFBLE1BQUE7VUFHRSxPQUFPLENBQUMsSUFBUixDQUFhLElBQUksQ0FBQyxJQUFMLGFBQVUsUUFBVixDQUFiLEVBSEY7U0FERjs7QUFKRjtXQVNBO0VBYmE7QUExQ2YiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSBcInBhdGhcIlxuYXN5bmMgPSByZXF1aXJlIFwiYXN5bmNcIlxue1BhdGhTZWFyY2hlciwgUGF0aFNjYW5uZXIsIHNlYXJjaH0gPSByZXF1aXJlICdzY2FuZGFsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IChyb290UGF0aHMsIHJlZ2V4U291cmNlLCBvcHRpb25zKSAtPlxuICBjYWxsYmFjayA9IEBhc3luYygpXG5cbiAgUEFUSFNfQ09VTlRFUl9TRUFSQ0hFRF9DSFVOSyA9IDUwXG4gIHBhdGhzU2VhcmNoZWQgPSAwXG5cbiAgc2VhcmNoZXIgPSBuZXcgUGF0aFNlYXJjaGVyKClcblxuICBzZWFyY2hlci5vbiAnZmlsZS1lcnJvcicsICh7Y29kZSwgcGF0aCwgbWVzc2FnZX0pIC0+XG4gICAgZW1pdCgnc2NhbjpmaWxlLWVycm9yJywge2NvZGUsIHBhdGgsIG1lc3NhZ2V9KVxuXG4gIHNlYXJjaGVyLm9uICdyZXN1bHRzLWZvdW5kJywgKHJlc3VsdCkgLT5cbiAgICBlbWl0KCdzY2FuOnJlc3VsdC1mb3VuZCcsIHJlc3VsdClcblxuICBmbGFncyA9IFwiZ1wiXG4gIGZsYWdzICs9IFwiaVwiIGlmIG9wdGlvbnMuaWdub3JlQ2FzZVxuICByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTb3VyY2UsIGZsYWdzKVxuXG4gIGFzeW5jLmVhY2goXG4gICAgcm9vdFBhdGhzLFxuICAgIChyb290UGF0aCwgbmV4dCkgLT5cbiAgICAgIG9wdGlvbnMyID0gT2JqZWN0LmFzc2lnbiB7fSwgb3B0aW9ucyxcbiAgICAgICAgaW5jbHVzaW9uczogcHJvY2Vzc1BhdGhzKHJvb3RQYXRoLCBvcHRpb25zLmluY2x1c2lvbnMpXG4gICAgICAgIGdsb2JhbEV4Y2x1c2lvbnM6IHByb2Nlc3NQYXRocyhyb290UGF0aCwgb3B0aW9ucy5nbG9iYWxFeGNsdXNpb25zKVxuXG4gICAgICBzY2FubmVyID0gbmV3IFBhdGhTY2FubmVyKHJvb3RQYXRoLCBvcHRpb25zMilcblxuICAgICAgc2Nhbm5lci5vbiAncGF0aC1mb3VuZCcsIC0+XG4gICAgICAgIHBhdGhzU2VhcmNoZWQrK1xuICAgICAgICBpZiBwYXRoc1NlYXJjaGVkICUgUEFUSFNfQ09VTlRFUl9TRUFSQ0hFRF9DSFVOSyBpcyAwXG4gICAgICAgICAgZW1pdCgnc2NhbjpwYXRocy1zZWFyY2hlZCcsIHBhdGhzU2VhcmNoZWQpXG5cbiAgICAgIHNlYXJjaCByZWdleCwgc2Nhbm5lciwgc2VhcmNoZXIsIC0+XG4gICAgICAgIGVtaXQoJ3NjYW46cGF0aHMtc2VhcmNoZWQnLCBwYXRoc1NlYXJjaGVkKVxuICAgICAgICBuZXh0KClcbiAgICBjYWxsYmFja1xuICApXG5cbnByb2Nlc3NQYXRocyA9IChyb290UGF0aCwgcGF0aHMpIC0+XG4gIHJldHVybiBwYXRocyB1bmxlc3MgcGF0aHM/Lmxlbmd0aCA+IDBcbiAgcm9vdFBhdGhCYXNlID0gcGF0aC5iYXNlbmFtZShyb290UGF0aClcbiAgcmVzdWx0cyA9IFtdXG4gIGZvciBnaXZlblBhdGggaW4gcGF0aHNcbiAgICBzZWdtZW50cyA9IGdpdmVuUGF0aC5zcGxpdChwYXRoLnNlcClcbiAgICBmaXJzdFNlZ21lbnQgPSBzZWdtZW50cy5zaGlmdCgpXG4gICAgcmVzdWx0cy5wdXNoKGdpdmVuUGF0aClcbiAgICBpZiBmaXJzdFNlZ21lbnQgaXMgcm9vdFBhdGhCYXNlXG4gICAgICBpZiBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICByZXN1bHRzLnB1c2gocGF0aC5qb2luKFwiKipcIiwgXCIqXCIpKVxuICAgICAgZWxzZVxuICAgICAgICByZXN1bHRzLnB1c2gocGF0aC5qb2luKHNlZ21lbnRzLi4uKSlcbiAgcmVzdWx0c1xuIl19
