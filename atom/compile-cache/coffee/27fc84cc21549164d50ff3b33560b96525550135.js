(function() {
  var StorageFolder, fs, path;

  path = require("path");

  fs = require("fs-plus");

  module.exports = StorageFolder = (function() {
    function StorageFolder(containingPath) {
      if (containingPath != null) {
        this.path = path.join(containingPath, "storage");
      }
    }

    StorageFolder.prototype.clear = function() {
      var error;
      if (this.path == null) {
        return;
      }
      try {
        return fs.removeSync(this.path);
      } catch (error1) {
        error = error1;
        return console.warn("Error deleting " + this.path, error.stack, error);
      }
    };

    StorageFolder.prototype.storeSync = function(name, object) {
      if (this.path == null) {
        return;
      }
      return fs.writeFileSync(this.pathForKey(name), JSON.stringify(object), 'utf8');
    };

    StorageFolder.prototype.load = function(name) {
      var error, statePath, stateString;
      if (this.path == null) {
        return;
      }
      statePath = this.pathForKey(name);
      try {
        stateString = fs.readFileSync(statePath, 'utf8');
      } catch (error1) {
        error = error1;
        if (error.code !== 'ENOENT') {
          console.warn("Error reading state file: " + statePath, error.stack, error);
        }
        return void 0;
      }
      try {
        return JSON.parse(stateString);
      } catch (error1) {
        error = error1;
        return console.warn("Error parsing state file: " + statePath, error.stack, error);
      }
    };

    StorageFolder.prototype.pathForKey = function(name) {
      return path.join(this.getPath(), name);
    };

    StorageFolder.prototype.getPath = function() {
      return this.path;
    };

    return StorageFolder;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zdG9yYWdlLWZvbGRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBRUwsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHVCQUFDLGNBQUQ7TUFDWCxJQUFnRCxzQkFBaEQ7UUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksQ0FBQyxJQUFMLENBQVUsY0FBVixFQUEwQixTQUExQixFQUFSOztJQURXOzs0QkFHYixLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxJQUFjLGlCQUFkO0FBQUEsZUFBQTs7QUFFQTtlQUNFLEVBQUUsQ0FBQyxVQUFILENBQWMsSUFBQyxDQUFBLElBQWYsRUFERjtPQUFBLGNBQUE7UUFFTTtlQUNKLE9BQU8sQ0FBQyxJQUFSLENBQWEsaUJBQUEsR0FBa0IsSUFBQyxDQUFBLElBQWhDLEVBQXdDLEtBQUssQ0FBQyxLQUE5QyxFQUFxRCxLQUFyRCxFQUhGOztJQUhLOzs0QkFRUCxTQUFBLEdBQVcsU0FBQyxJQUFELEVBQU8sTUFBUDtNQUNULElBQWMsaUJBQWQ7QUFBQSxlQUFBOzthQUVBLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWixDQUFqQixFQUFvQyxJQUFJLENBQUMsU0FBTCxDQUFlLE1BQWYsQ0FBcEMsRUFBNEQsTUFBNUQ7SUFIUzs7NEJBS1gsSUFBQSxHQUFNLFNBQUMsSUFBRDtBQUNKLFVBQUE7TUFBQSxJQUFjLGlCQUFkO0FBQUEsZUFBQTs7TUFFQSxTQUFBLEdBQVksSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaO0FBQ1o7UUFDRSxXQUFBLEdBQWMsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsU0FBaEIsRUFBMkIsTUFBM0IsRUFEaEI7T0FBQSxjQUFBO1FBRU07UUFDSixJQUFPLEtBQUssQ0FBQyxJQUFOLEtBQWMsUUFBckI7VUFDRSxPQUFPLENBQUMsSUFBUixDQUFhLDRCQUFBLEdBQTZCLFNBQTFDLEVBQXVELEtBQUssQ0FBQyxLQUE3RCxFQUFvRSxLQUFwRSxFQURGOztBQUVBLGVBQU8sT0FMVDs7QUFPQTtlQUNFLElBQUksQ0FBQyxLQUFMLENBQVcsV0FBWCxFQURGO09BQUEsY0FBQTtRQUVNO2VBQ0osT0FBTyxDQUFDLElBQVIsQ0FBYSw0QkFBQSxHQUE2QixTQUExQyxFQUF1RCxLQUFLLENBQUMsS0FBN0QsRUFBb0UsS0FBcEUsRUFIRjs7SUFYSTs7NEJBZ0JOLFVBQUEsR0FBWSxTQUFDLElBQUQ7YUFBVSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVixFQUFzQixJQUF0QjtJQUFWOzs0QkFDWixPQUFBLEdBQVMsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs7OztBQXRDWCIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlIFwicGF0aFwiXG5mcyA9IHJlcXVpcmUgXCJmcy1wbHVzXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU3RvcmFnZUZvbGRlclxuICBjb25zdHJ1Y3RvcjogKGNvbnRhaW5pbmdQYXRoKSAtPlxuICAgIEBwYXRoID0gcGF0aC5qb2luKGNvbnRhaW5pbmdQYXRoLCBcInN0b3JhZ2VcIikgaWYgY29udGFpbmluZ1BhdGg/XG5cbiAgY2xlYXI6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGF0aD9cblxuICAgIHRyeVxuICAgICAgZnMucmVtb3ZlU3luYyhAcGF0aClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgY29uc29sZS53YXJuIFwiRXJyb3IgZGVsZXRpbmcgI3tAcGF0aH1cIiwgZXJyb3Iuc3RhY2ssIGVycm9yXG5cbiAgc3RvcmVTeW5jOiAobmFtZSwgb2JqZWN0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHBhdGg/XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKEBwYXRoRm9yS2V5KG5hbWUpLCBKU09OLnN0cmluZ2lmeShvYmplY3QpLCAndXRmOCcpXG5cbiAgbG9hZDogKG5hbWUpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGF0aD9cblxuICAgIHN0YXRlUGF0aCA9IEBwYXRoRm9yS2V5KG5hbWUpXG4gICAgdHJ5XG4gICAgICBzdGF0ZVN0cmluZyA9IGZzLnJlYWRGaWxlU3luYyhzdGF0ZVBhdGgsICd1dGY4JylcbiAgICBjYXRjaCBlcnJvclxuICAgICAgdW5sZXNzIGVycm9yLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgY29uc29sZS53YXJuIFwiRXJyb3IgcmVhZGluZyBzdGF0ZSBmaWxlOiAje3N0YXRlUGF0aH1cIiwgZXJyb3Iuc3RhY2ssIGVycm9yXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICB0cnlcbiAgICAgIEpTT04ucGFyc2Uoc3RhdGVTdHJpbmcpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGNvbnNvbGUud2FybiBcIkVycm9yIHBhcnNpbmcgc3RhdGUgZmlsZTogI3tzdGF0ZVBhdGh9XCIsIGVycm9yLnN0YWNrLCBlcnJvclxuXG4gIHBhdGhGb3JLZXk6IChuYW1lKSAtPiBwYXRoLmpvaW4oQGdldFBhdGgoKSwgbmFtZSlcbiAgZ2V0UGF0aDogLT4gQHBhdGhcbiJdfQ==
