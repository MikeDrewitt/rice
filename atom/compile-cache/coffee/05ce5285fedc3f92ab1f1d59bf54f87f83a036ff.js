(function() {
  var LessCache, LessCompileCache, path;

  path = require('path');

  LessCache = require('less-cache');

  module.exports = LessCompileCache = (function() {
    LessCompileCache.cacheDir = path.join(process.env.ATOM_HOME, 'compile-cache', 'less');

    function LessCompileCache(arg) {
      var importPaths, resourcePath;
      resourcePath = arg.resourcePath, importPaths = arg.importPaths;
      this.lessSearchPaths = [path.join(resourcePath, 'static', 'variables'), path.join(resourcePath, 'static')];
      if (importPaths != null) {
        importPaths = importPaths.concat(this.lessSearchPaths);
      } else {
        importPaths = this.lessSearchPaths;
      }
      this.cache = new LessCache({
        cacheDir: this.constructor.cacheDir,
        importPaths: importPaths,
        resourcePath: resourcePath,
        fallbackDir: path.join(resourcePath, 'less-compile-cache')
      });
    }

    LessCompileCache.prototype.setImportPaths = function(importPaths) {
      if (importPaths == null) {
        importPaths = [];
      }
      return this.cache.setImportPaths(importPaths.concat(this.lessSearchPaths));
    };

    LessCompileCache.prototype.read = function(stylesheetPath) {
      return this.cache.readFileSync(stylesheetPath);
    };

    LessCompileCache.prototype.cssForFile = function(stylesheetPath, lessContent) {
      return this.cache.cssForFile(stylesheetPath, lessContent);
    };

    return LessCompileCache;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9sZXNzLWNvbXBpbGUtY2FjaGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsU0FBQSxHQUFZLE9BQUEsQ0FBUSxZQUFSOztFQUdaLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixnQkFBQyxDQUFBLFFBQUQsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBdEIsRUFBaUMsZUFBakMsRUFBa0QsTUFBbEQ7O0lBRUUsMEJBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSxpQ0FBYztNQUMzQixJQUFDLENBQUEsZUFBRCxHQUFtQixDQUNqQixJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBd0IsUUFBeEIsRUFBa0MsV0FBbEMsQ0FEaUIsRUFFakIsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLFFBQXhCLENBRmlCO01BS25CLElBQUcsbUJBQUg7UUFDRSxXQUFBLEdBQWMsV0FBVyxDQUFDLE1BQVosQ0FBbUIsSUFBQyxDQUFBLGVBQXBCLEVBRGhCO09BQUEsTUFBQTtRQUdFLFdBQUEsR0FBYyxJQUFDLENBQUEsZ0JBSGpCOztNQUtBLElBQUMsQ0FBQSxLQUFELEdBQWEsSUFBQSxTQUFBLENBQ1g7UUFBQSxRQUFBLEVBQVUsSUFBQyxDQUFBLFdBQVcsQ0FBQyxRQUF2QjtRQUNBLFdBQUEsRUFBYSxXQURiO1FBRUEsWUFBQSxFQUFjLFlBRmQ7UUFHQSxXQUFBLEVBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLG9CQUF4QixDQUhiO09BRFc7SUFYRjs7K0JBaUJiLGNBQUEsR0FBZ0IsU0FBQyxXQUFEOztRQUFDLGNBQVk7O2FBQzNCLElBQUMsQ0FBQSxLQUFLLENBQUMsY0FBUCxDQUFzQixXQUFXLENBQUMsTUFBWixDQUFtQixJQUFDLENBQUEsZUFBcEIsQ0FBdEI7SUFEYzs7K0JBR2hCLElBQUEsR0FBTSxTQUFDLGNBQUQ7YUFDSixJQUFDLENBQUEsS0FBSyxDQUFDLFlBQVAsQ0FBb0IsY0FBcEI7SUFESTs7K0JBR04sVUFBQSxHQUFZLFNBQUMsY0FBRCxFQUFpQixXQUFqQjthQUNWLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFrQixjQUFsQixFQUFrQyxXQUFsQztJQURVOzs7OztBQS9CZCIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuTGVzc0NhY2hlID0gcmVxdWlyZSAnbGVzcy1jYWNoZSdcblxuIyB7TGVzc0NhY2hlfSB3cmFwcGVyIHVzZWQgYnkge1RoZW1lTWFuYWdlcn0gdG8gcmVhZCBzdHlsZXNoZWV0cy5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIExlc3NDb21waWxlQ2FjaGVcbiAgQGNhY2hlRGlyOiBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuQVRPTV9IT01FLCAnY29tcGlsZS1jYWNoZScsICdsZXNzJylcblxuICBjb25zdHJ1Y3RvcjogKHtyZXNvdXJjZVBhdGgsIGltcG9ydFBhdGhzfSkgLT5cbiAgICBAbGVzc1NlYXJjaFBhdGhzID0gW1xuICAgICAgcGF0aC5qb2luKHJlc291cmNlUGF0aCwgJ3N0YXRpYycsICd2YXJpYWJsZXMnKVxuICAgICAgcGF0aC5qb2luKHJlc291cmNlUGF0aCwgJ3N0YXRpYycpXG4gICAgXVxuXG4gICAgaWYgaW1wb3J0UGF0aHM/XG4gICAgICBpbXBvcnRQYXRocyA9IGltcG9ydFBhdGhzLmNvbmNhdChAbGVzc1NlYXJjaFBhdGhzKVxuICAgIGVsc2VcbiAgICAgIGltcG9ydFBhdGhzID0gQGxlc3NTZWFyY2hQYXRoc1xuXG4gICAgQGNhY2hlID0gbmV3IExlc3NDYWNoZVxuICAgICAgY2FjaGVEaXI6IEBjb25zdHJ1Y3Rvci5jYWNoZURpclxuICAgICAgaW1wb3J0UGF0aHM6IGltcG9ydFBhdGhzXG4gICAgICByZXNvdXJjZVBhdGg6IHJlc291cmNlUGF0aFxuICAgICAgZmFsbGJhY2tEaXI6IHBhdGguam9pbihyZXNvdXJjZVBhdGgsICdsZXNzLWNvbXBpbGUtY2FjaGUnKVxuXG4gIHNldEltcG9ydFBhdGhzOiAoaW1wb3J0UGF0aHM9W10pIC0+XG4gICAgQGNhY2hlLnNldEltcG9ydFBhdGhzKGltcG9ydFBhdGhzLmNvbmNhdChAbGVzc1NlYXJjaFBhdGhzKSlcblxuICByZWFkOiAoc3R5bGVzaGVldFBhdGgpIC0+XG4gICAgQGNhY2hlLnJlYWRGaWxlU3luYyhzdHlsZXNoZWV0UGF0aClcblxuICBjc3NGb3JGaWxlOiAoc3R5bGVzaGVldFBhdGgsIGxlc3NDb250ZW50KSAtPlxuICAgIEBjYWNoZS5jc3NGb3JGaWxlKHN0eWxlc2hlZXRQYXRoLCBsZXNzQ29udGVudClcbiJdfQ==
