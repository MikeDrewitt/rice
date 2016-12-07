(function() {
  var PackageWatcher, Watcher, _, fs, path,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  path = require('path');

  Watcher = require('./watcher');

  module.exports = PackageWatcher = (function(superClass) {
    extend(PackageWatcher, superClass);

    PackageWatcher.supportsPackage = function(pack, type) {
      if (pack.getType() === type && pack.getStylesheetPaths().length) {
        return true;
      }
      return false;
    };

    function PackageWatcher(pack1) {
      this.pack = pack1;
      this.loadAllStylesheets = bind(this.loadAllStylesheets, this);
      PackageWatcher.__super__.constructor.call(this);
      this.pack.onDidDeactivate(this.destroy);
      this.watch();
    }

    PackageWatcher.prototype.watch = function() {
      var i, len, onFile, onFolder, ref, stylesheet, stylesheetPaths, stylesheetsPath, watchPath, watchedPaths;
      watchedPaths = [];
      watchPath = (function(_this) {
        return function(stylesheet) {
          if (!_.contains(watchedPaths, stylesheet)) {
            _this.watchFile(stylesheet);
          }
          return watchedPaths.push(stylesheet);
        };
      })(this);
      stylesheetsPath = this.pack.getStylesheetsPath();
      if (fs.isDirectorySync(stylesheetsPath)) {
        this.watchDirectory(stylesheetsPath);
      }
      stylesheetPaths = this.pack.getStylesheetPaths();
      onFile = function(stylesheetPath) {
        return stylesheetPaths.push(stylesheetPath);
      };
      onFolder = function() {
        return true;
      };
      fs.traverseTreeSync(stylesheetsPath, onFile, onFolder);
      ref = _.uniq(stylesheetPaths);
      for (i = 0, len = ref.length; i < len; i++) {
        stylesheet = ref[i];
        watchPath(stylesheet);
      }
      return this.entities;
    };

    PackageWatcher.prototype.loadStylesheet = function(pathName) {
      if (pathName.indexOf('variables') > -1) {
        this.emitGlobalsChanged();
      }
      return this.loadAllStylesheets();
    };

    PackageWatcher.prototype.loadAllStylesheets = function() {
      console.log('Reloading package', this.pack.name);
      return this.pack.reloadStylesheets();
    };

    return PackageWatcher;

  })(Watcher);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXYtbGl2ZS1yZWxvYWQvbGliL3BhY2thZ2Utd2F0Y2hlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9DQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztJQUNKLGNBQUMsQ0FBQSxlQUFELEdBQWtCLFNBQUMsSUFBRCxFQUFPLElBQVA7TUFDaEIsSUFBZSxJQUFJLENBQUMsT0FBTCxDQUFBLENBQUEsS0FBa0IsSUFBbEIsSUFBMkIsSUFBSSxDQUFDLGtCQUFMLENBQUEsQ0FBeUIsQ0FBQyxNQUFwRTtBQUFBLGVBQU8sS0FBUDs7YUFDQTtJQUZnQjs7SUFJTCx3QkFBQyxLQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7O01BQ1osOENBQUE7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLGVBQU4sQ0FBc0IsSUFBQyxDQUFBLE9BQXZCO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUhXOzs2QkFLYixLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxZQUFBLEdBQWU7TUFDZixTQUFBLEdBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFVBQUQ7VUFDVixJQUFBLENBQThCLENBQUMsQ0FBQyxRQUFGLENBQVcsWUFBWCxFQUF5QixVQUF6QixDQUE5QjtZQUFBLEtBQUMsQ0FBQSxTQUFELENBQVcsVUFBWCxFQUFBOztpQkFDQSxZQUFZLENBQUMsSUFBYixDQUFrQixVQUFsQjtRQUZVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUlaLGVBQUEsR0FBa0IsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBTixDQUFBO01BRWxCLElBQW9DLEVBQUUsQ0FBQyxlQUFILENBQW1CLGVBQW5CLENBQXBDO1FBQUEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZUFBaEIsRUFBQTs7TUFFQSxlQUFBLEdBQWtCLElBQUMsQ0FBQSxJQUFJLENBQUMsa0JBQU4sQ0FBQTtNQUNsQixNQUFBLEdBQVMsU0FBQyxjQUFEO2VBQW9CLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixjQUFyQjtNQUFwQjtNQUNULFFBQUEsR0FBVyxTQUFBO2VBQUc7TUFBSDtNQUNYLEVBQUUsQ0FBQyxnQkFBSCxDQUFvQixlQUFwQixFQUFxQyxNQUFyQyxFQUE2QyxRQUE3QztBQUVBO0FBQUEsV0FBQSxxQ0FBQTs7UUFBQSxTQUFBLENBQVUsVUFBVjtBQUFBO2FBRUEsSUFBQyxDQUFBO0lBakJJOzs2QkFtQlAsY0FBQSxHQUFnQixTQUFDLFFBQUQ7TUFDZCxJQUF5QixRQUFRLENBQUMsT0FBVCxDQUFpQixXQUFqQixDQUFBLEdBQWdDLENBQUMsQ0FBMUQ7UUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUFBOzthQUNBLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBRmM7OzZCQUloQixrQkFBQSxHQUFvQixTQUFBO01BQ2xCLE9BQU8sQ0FBQyxHQUFSLENBQVksbUJBQVosRUFBaUMsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUF2QzthQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsaUJBQU4sQ0FBQTtJQUZrQjs7OztLQWpDTztBQVA3QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuV2F0Y2hlciA9IHJlcXVpcmUgJy4vd2F0Y2hlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZVdhdGNoZXIgZXh0ZW5kcyBXYXRjaGVyXG4gIEBzdXBwb3J0c1BhY2thZ2U6IChwYWNrLCB0eXBlKSAtPlxuICAgIHJldHVybiB0cnVlIGlmIHBhY2suZ2V0VHlwZSgpIGlzIHR5cGUgYW5kIHBhY2suZ2V0U3R5bGVzaGVldFBhdGhzKCkubGVuZ3RoXG4gICAgZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKEBwYWNrKSAtPlxuICAgIHN1cGVyKClcbiAgICBAcGFjay5vbkRpZERlYWN0aXZhdGUoQGRlc3Ryb3kpXG4gICAgQHdhdGNoKClcblxuICB3YXRjaDogLT5cbiAgICB3YXRjaGVkUGF0aHMgPSBbXVxuICAgIHdhdGNoUGF0aCA9IChzdHlsZXNoZWV0KSA9PlxuICAgICAgQHdhdGNoRmlsZShzdHlsZXNoZWV0KSB1bmxlc3MgXy5jb250YWlucyh3YXRjaGVkUGF0aHMsIHN0eWxlc2hlZXQpXG4gICAgICB3YXRjaGVkUGF0aHMucHVzaChzdHlsZXNoZWV0KVxuXG4gICAgc3R5bGVzaGVldHNQYXRoID0gQHBhY2suZ2V0U3R5bGVzaGVldHNQYXRoKClcblxuICAgIEB3YXRjaERpcmVjdG9yeShzdHlsZXNoZWV0c1BhdGgpIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhzdHlsZXNoZWV0c1BhdGgpXG5cbiAgICBzdHlsZXNoZWV0UGF0aHMgPSBAcGFjay5nZXRTdHlsZXNoZWV0UGF0aHMoKVxuICAgIG9uRmlsZSA9IChzdHlsZXNoZWV0UGF0aCkgLT4gc3R5bGVzaGVldFBhdGhzLnB1c2goc3R5bGVzaGVldFBhdGgpXG4gICAgb25Gb2xkZXIgPSAtPiB0cnVlXG4gICAgZnMudHJhdmVyc2VUcmVlU3luYyhzdHlsZXNoZWV0c1BhdGgsIG9uRmlsZSwgb25Gb2xkZXIpXG5cbiAgICB3YXRjaFBhdGgoc3R5bGVzaGVldCkgZm9yIHN0eWxlc2hlZXQgaW4gXy51bmlxKHN0eWxlc2hlZXRQYXRocylcblxuICAgIEBlbnRpdGllc1xuXG4gIGxvYWRTdHlsZXNoZWV0OiAocGF0aE5hbWUpIC0+XG4gICAgQGVtaXRHbG9iYWxzQ2hhbmdlZCgpIGlmIHBhdGhOYW1lLmluZGV4T2YoJ3ZhcmlhYmxlcycpID4gLTFcbiAgICBAbG9hZEFsbFN0eWxlc2hlZXRzKClcblxuICBsb2FkQWxsU3R5bGVzaGVldHM6ID0+XG4gICAgY29uc29sZS5sb2cgJ1JlbG9hZGluZyBwYWNrYWdlJywgQHBhY2submFtZVxuICAgIEBwYWNrLnJlbG9hZFN0eWxlc2hlZXRzKClcbiJdfQ==
