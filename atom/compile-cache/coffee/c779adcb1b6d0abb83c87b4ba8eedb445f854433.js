(function() {
  var Range, deprecatedPackages, ranges, ref, ref1, satisfies, semver,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  semver = require('semver');

  deprecatedPackages = (ref = (ref1 = require('../package.json')) != null ? ref1._deprecatedPackages : void 0) != null ? ref : {};

  ranges = {};

  exports.getDeprecatedPackageMetadata = function(name) {
    var metadata;
    metadata = null;
    if (deprecatedPackages.hasOwnProperty(name)) {
      metadata = deprecatedPackages[name];
    }
    if (metadata) {
      Object.freeze(metadata);
    }
    return metadata;
  };

  exports.isDeprecatedPackage = function(name, version) {
    var deprecatedVersionRange;
    if (!deprecatedPackages.hasOwnProperty(name)) {
      return false;
    }
    deprecatedVersionRange = deprecatedPackages[name].version;
    if (!deprecatedVersionRange) {
      return true;
    }
    return semver.valid(version) && satisfies(version, deprecatedVersionRange);
  };

  satisfies = function(version, rawRange) {
    var parsedRange;
    if (!(parsedRange = ranges[rawRange])) {
      parsedRange = new Range(rawRange);
      ranges[rawRange] = parsedRange;
    }
    return parsedRange.test(version);
  };

  Range = (function(superClass) {
    extend(Range, superClass);

    function Range() {
      Range.__super__.constructor.apply(this, arguments);
      this.matchedVersions = new Set();
      this.unmatchedVersions = new Set();
    }

    Range.prototype.test = function(version) {
      var matches;
      if (this.matchedVersions.has(version)) {
        return true;
      }
      if (this.unmatchedVersions.has(version)) {
        return false;
      }
      matches = Range.__super__.test.apply(this, arguments);
      if (matches) {
        this.matchedVersions.add(version);
      } else {
        this.unmatchedVersions.add(version);
      }
      return matches;
    };

    return Range;

  })(semver.Range);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9kZXByZWNhdGVkLXBhY2thZ2VzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsK0RBQUE7SUFBQTs7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUVULGtCQUFBLDJHQUF1RTs7RUFDdkUsTUFBQSxHQUFTOztFQUVULE9BQU8sQ0FBQyw0QkFBUixHQUF1QyxTQUFDLElBQUQ7QUFDckMsUUFBQTtJQUFBLFFBQUEsR0FBVztJQUNYLElBQUcsa0JBQWtCLENBQUMsY0FBbkIsQ0FBa0MsSUFBbEMsQ0FBSDtNQUNFLFFBQUEsR0FBVyxrQkFBbUIsQ0FBQSxJQUFBLEVBRGhDOztJQUVBLElBQTJCLFFBQTNCO01BQUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxRQUFkLEVBQUE7O1dBQ0E7RUFMcUM7O0VBT3ZDLE9BQU8sQ0FBQyxtQkFBUixHQUE4QixTQUFDLElBQUQsRUFBTyxPQUFQO0FBQzVCLFFBQUE7SUFBQSxJQUFBLENBQW9CLGtCQUFrQixDQUFDLGNBQW5CLENBQWtDLElBQWxDLENBQXBCO0FBQUEsYUFBTyxNQUFQOztJQUVBLHNCQUFBLEdBQXlCLGtCQUFtQixDQUFBLElBQUEsQ0FBSyxDQUFDO0lBQ2xELElBQUEsQ0FBbUIsc0JBQW5CO0FBQUEsYUFBTyxLQUFQOztXQUVBLE1BQU0sQ0FBQyxLQUFQLENBQWEsT0FBYixDQUFBLElBQTBCLFNBQUEsQ0FBVSxPQUFWLEVBQW1CLHNCQUFuQjtFQU5FOztFQVE5QixTQUFBLEdBQVksU0FBQyxPQUFELEVBQVUsUUFBVjtBQUNWLFFBQUE7SUFBQSxJQUFBLENBQU8sQ0FBQSxXQUFBLEdBQWMsTUFBTyxDQUFBLFFBQUEsQ0FBckIsQ0FBUDtNQUNFLFdBQUEsR0FBa0IsSUFBQSxLQUFBLENBQU0sUUFBTjtNQUNsQixNQUFPLENBQUEsUUFBQSxDQUFQLEdBQW1CLFlBRnJCOztXQUdBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLE9BQWpCO0VBSlU7O0VBT047OztJQUNTLGVBQUE7TUFDWCx3Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLGVBQUQsR0FBdUIsSUFBQSxHQUFBLENBQUE7TUFDdkIsSUFBQyxDQUFBLGlCQUFELEdBQXlCLElBQUEsR0FBQSxDQUFBO0lBSGQ7O29CQUtiLElBQUEsR0FBTSxTQUFDLE9BQUQ7QUFDSixVQUFBO01BQUEsSUFBZSxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLE9BQXJCLENBQWY7QUFBQSxlQUFPLEtBQVA7O01BQ0EsSUFBZ0IsSUFBQyxDQUFBLGlCQUFpQixDQUFDLEdBQW5CLENBQXVCLE9BQXZCLENBQWhCO0FBQUEsZUFBTyxNQUFQOztNQUVBLE9BQUEsR0FBVSxpQ0FBQSxTQUFBO01BQ1YsSUFBRyxPQUFIO1FBQ0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixPQUFyQixFQURGO09BQUEsTUFBQTtRQUdFLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxHQUFuQixDQUF1QixPQUF2QixFQUhGOzthQUlBO0lBVEk7Ozs7S0FOWSxNQUFNLENBQUM7QUEzQjNCIiwic291cmNlc0NvbnRlbnQiOlsic2VtdmVyID0gcmVxdWlyZSAnc2VtdmVyJ1xuXG5kZXByZWNhdGVkUGFja2FnZXMgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKT8uX2RlcHJlY2F0ZWRQYWNrYWdlcyA/IHt9XG5yYW5nZXMgPSB7fVxuXG5leHBvcnRzLmdldERlcHJlY2F0ZWRQYWNrYWdlTWV0YWRhdGEgPSAobmFtZSkgLT5cbiAgbWV0YWRhdGEgPSBudWxsXG4gIGlmIGRlcHJlY2F0ZWRQYWNrYWdlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuICAgIG1ldGFkYXRhID0gZGVwcmVjYXRlZFBhY2thZ2VzW25hbWVdXG4gIE9iamVjdC5mcmVlemUobWV0YWRhdGEpIGlmIG1ldGFkYXRhXG4gIG1ldGFkYXRhXG5cbmV4cG9ydHMuaXNEZXByZWNhdGVkUGFja2FnZSA9IChuYW1lLCB2ZXJzaW9uKSAtPlxuICByZXR1cm4gZmFsc2UgdW5sZXNzIGRlcHJlY2F0ZWRQYWNrYWdlcy5oYXNPd25Qcm9wZXJ0eShuYW1lKVxuXG4gIGRlcHJlY2F0ZWRWZXJzaW9uUmFuZ2UgPSBkZXByZWNhdGVkUGFja2FnZXNbbmFtZV0udmVyc2lvblxuICByZXR1cm4gdHJ1ZSB1bmxlc3MgZGVwcmVjYXRlZFZlcnNpb25SYW5nZVxuXG4gIHNlbXZlci52YWxpZCh2ZXJzaW9uKSBhbmQgc2F0aXNmaWVzKHZlcnNpb24sIGRlcHJlY2F0ZWRWZXJzaW9uUmFuZ2UpXG5cbnNhdGlzZmllcyA9ICh2ZXJzaW9uLCByYXdSYW5nZSkgLT5cbiAgdW5sZXNzIHBhcnNlZFJhbmdlID0gcmFuZ2VzW3Jhd1JhbmdlXVxuICAgIHBhcnNlZFJhbmdlID0gbmV3IFJhbmdlKHJhd1JhbmdlKVxuICAgIHJhbmdlc1tyYXdSYW5nZV0gPSBwYXJzZWRSYW5nZVxuICBwYXJzZWRSYW5nZS50ZXN0KHZlcnNpb24pXG5cbiMgRXh0ZW5kIHNlbXZlci5SYW5nZSB0byBtZW1vaXplIG1hdGNoZWQgdmVyc2lvbnMgZm9yIHNwZWVkXG5jbGFzcyBSYW5nZSBleHRlbmRzIHNlbXZlci5SYW5nZVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuICAgIEBtYXRjaGVkVmVyc2lvbnMgPSBuZXcgU2V0KClcbiAgICBAdW5tYXRjaGVkVmVyc2lvbnMgPSBuZXcgU2V0KClcblxuICB0ZXN0OiAodmVyc2lvbikgLT5cbiAgICByZXR1cm4gdHJ1ZSBpZiBAbWF0Y2hlZFZlcnNpb25zLmhhcyh2ZXJzaW9uKVxuICAgIHJldHVybiBmYWxzZSBpZiBAdW5tYXRjaGVkVmVyc2lvbnMuaGFzKHZlcnNpb24pXG5cbiAgICBtYXRjaGVzID0gc3VwZXJcbiAgICBpZiBtYXRjaGVzXG4gICAgICBAbWF0Y2hlZFZlcnNpb25zLmFkZCh2ZXJzaW9uKVxuICAgIGVsc2VcbiAgICAgIEB1bm1hdGNoZWRWZXJzaW9ucy5hZGQodmVyc2lvbilcbiAgICBtYXRjaGVzXG4iXX0=
