(function() {
  var BaseThemeWatcher, Watcher, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs-plus');

  path = require('path');

  Watcher = require('./watcher');

  module.exports = BaseThemeWatcher = (function(superClass) {
    extend(BaseThemeWatcher, superClass);

    function BaseThemeWatcher() {
      BaseThemeWatcher.__super__.constructor.call(this);
      this.stylesheetsPath = path.dirname(atom.themes.resolveStylesheet('../static/atom.less'));
      this.watch();
    }

    BaseThemeWatcher.prototype.watch = function() {
      var filePath, filePaths, i, len, results;
      filePaths = fs.readdirSync(this.stylesheetsPath).filter(function(filePath) {
        return path.extname(filePath).indexOf('less') > -1;
      });
      results = [];
      for (i = 0, len = filePaths.length; i < len; i++) {
        filePath = filePaths[i];
        results.push(this.watchFile(path.join(this.stylesheetsPath, filePath)));
      }
      return results;
    };

    BaseThemeWatcher.prototype.loadStylesheet = function() {
      return this.loadAllStylesheets();
    };

    BaseThemeWatcher.prototype.loadAllStylesheets = function() {
      return atom.themes.reloadBaseStylesheets();
    };

    return BaseThemeWatcher;

  })(Watcher);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXYtbGl2ZS1yZWxvYWQvbGliL2Jhc2UtdGhlbWUtd2F0Y2hlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1DQUFBO0lBQUE7OztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztJQUNTLDBCQUFBO01BQ1gsZ0RBQUE7TUFDQSxJQUFDLENBQUEsZUFBRCxHQUFtQixJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQVosQ0FBOEIscUJBQTlCLENBQWI7TUFDbkIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUhXOzsrQkFLYixLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxTQUFBLEdBQVksRUFBRSxDQUFDLFdBQUgsQ0FBZSxJQUFDLENBQUEsZUFBaEIsQ0FBZ0MsQ0FBQyxNQUFqQyxDQUF3QyxTQUFDLFFBQUQ7ZUFDbEQsSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBQXNCLENBQUMsT0FBdkIsQ0FBK0IsTUFBL0IsQ0FBQSxHQUF5QyxDQUFDO01BRFEsQ0FBeEM7QUFHWjtXQUFBLDJDQUFBOztxQkFBQSxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLGVBQVgsRUFBNEIsUUFBNUIsQ0FBWDtBQUFBOztJQUpLOzsrQkFNUCxjQUFBLEdBQWdCLFNBQUE7YUFDZCxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQURjOzsrQkFHaEIsa0JBQUEsR0FBb0IsU0FBQTthQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLHFCQUFaLENBQUE7SUFEa0I7Ozs7S0FmUztBQUwvQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuV2F0Y2hlciA9IHJlcXVpcmUgJy4vd2F0Y2hlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQmFzZVRoZW1lV2F0Y2hlciBleHRlbmRzIFdhdGNoZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXIoKVxuICAgIEBzdHlsZXNoZWV0c1BhdGggPSBwYXRoLmRpcm5hbWUoYXRvbS50aGVtZXMucmVzb2x2ZVN0eWxlc2hlZXQoJy4uL3N0YXRpYy9hdG9tLmxlc3MnKSlcbiAgICBAd2F0Y2goKVxuXG4gIHdhdGNoOiAtPlxuICAgIGZpbGVQYXRocyA9IGZzLnJlYWRkaXJTeW5jKEBzdHlsZXNoZWV0c1BhdGgpLmZpbHRlciAoZmlsZVBhdGgpIC0+XG4gICAgICBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLmluZGV4T2YoJ2xlc3MnKSA+IC0xXG5cbiAgICBAd2F0Y2hGaWxlKHBhdGguam9pbihAc3R5bGVzaGVldHNQYXRoLCBmaWxlUGF0aCkpIGZvciBmaWxlUGF0aCBpbiBmaWxlUGF0aHNcblxuICBsb2FkU3R5bGVzaGVldDogLT5cbiAgICBAbG9hZEFsbFN0eWxlc2hlZXRzKClcblxuICBsb2FkQWxsU3R5bGVzaGVldHM6IC0+XG4gICAgYXRvbS50aGVtZXMucmVsb2FkQmFzZVN0eWxlc2hlZXRzKClcbiJdfQ==
