(function() {
  var CSON, KeymapManager, bundledKeymaps, fs, path, ref;

  fs = require('fs-plus');

  path = require('path');

  KeymapManager = require('atom-keymap');

  CSON = require('season');

  bundledKeymaps = (ref = require('../package.json')) != null ? ref._atomKeymaps : void 0;

  KeymapManager.prototype.onDidLoadBundledKeymaps = function(callback) {
    return this.emitter.on('did-load-bundled-keymaps', callback);
  };

  KeymapManager.prototype.loadBundledKeymaps = function() {
    var keymap, keymapName, keymapPath, keymapsPath;
    keymapsPath = path.join(this.resourcePath, 'keymaps');
    if (bundledKeymaps != null) {
      for (keymapName in bundledKeymaps) {
        keymap = bundledKeymaps[keymapName];
        keymapPath = path.join(keymapsPath, keymapName);
        this.add(keymapPath, keymap);
      }
    } else {
      this.loadKeymap(keymapsPath);
    }
    return this.emitter.emit('did-load-bundled-keymaps');
  };

  KeymapManager.prototype.getUserKeymapPath = function() {
    var userKeymapPath;
    if (this.configDirPath == null) {
      return "";
    }
    if (userKeymapPath = CSON.resolve(path.join(this.configDirPath, 'keymap'))) {
      return userKeymapPath;
    } else {
      return path.join(this.configDirPath, 'keymap.cson');
    }
  };

  KeymapManager.prototype.loadUserKeymap = function() {
    var detail, error, message, stack, userKeymapPath;
    userKeymapPath = this.getUserKeymapPath();
    if (!fs.isFileSync(userKeymapPath)) {
      return;
    }
    try {
      return this.loadKeymap(userKeymapPath, {
        watch: true,
        suppressErrors: true,
        priority: 100
      });
    } catch (error1) {
      error = error1;
      if (error.message.indexOf('Unable to watch path') > -1) {
        message = "Unable to watch path: `" + (path.basename(userKeymapPath)) + "`. Make sure you\nhave permission to read `" + userKeymapPath + "`.\n\nOn linux there are currently problems with watch sizes. See\n[this document][watches] for more info.\n[watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path";
        return this.notificationManager.addError(message, {
          dismissable: true
        });
      } else {
        detail = error.path;
        stack = error.stack;
        return this.notificationManager.addFatalError(error.message, {
          detail: detail,
          stack: stack,
          dismissable: true
        });
      }
    }
  };

  KeymapManager.prototype.subscribeToFileReadFailure = function() {
    return this.onDidFailToReadFile((function(_this) {
      return function(error) {
        var detail, message, userKeymapPath;
        userKeymapPath = _this.getUserKeymapPath();
        message = "Failed to load `" + userKeymapPath + "`";
        detail = error.location != null ? error.stack : error.message;
        return _this.notificationManager.addError(message, {
          detail: detail,
          dismissable: true
        });
      };
    })(this));
  };

  module.exports = KeymapManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9rZXltYXAtZXh0ZW5zaW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsYUFBQSxHQUFnQixPQUFBLENBQVEsYUFBUjs7RUFDaEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUVQLGNBQUEsbURBQTJDLENBQUU7O0VBRTdDLGFBQWEsQ0FBQSxTQUFFLENBQUEsdUJBQWYsR0FBeUMsU0FBQyxRQUFEO1dBQ3ZDLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLDBCQUFaLEVBQXdDLFFBQXhDO0VBRHVDOztFQUd6QyxhQUFhLENBQUEsU0FBRSxDQUFBLGtCQUFmLEdBQW9DLFNBQUE7QUFDbEMsUUFBQTtJQUFBLFdBQUEsR0FBYyxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxZQUFYLEVBQXlCLFNBQXpCO0lBQ2QsSUFBRyxzQkFBSDtBQUNFLFdBQUEsNEJBQUE7O1FBQ0UsVUFBQSxHQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixVQUF2QjtRQUNiLElBQUMsQ0FBQSxHQUFELENBQUssVUFBTCxFQUFpQixNQUFqQjtBQUZGLE9BREY7S0FBQSxNQUFBO01BS0UsSUFBQyxDQUFBLFVBQUQsQ0FBWSxXQUFaLEVBTEY7O1dBT0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsMEJBQWQ7RUFUa0M7O0VBV3BDLGFBQWEsQ0FBQSxTQUFFLENBQUEsaUJBQWYsR0FBbUMsU0FBQTtBQUNqQyxRQUFBO0lBQUEsSUFBaUIsMEJBQWpCO0FBQUEsYUFBTyxHQUFQOztJQUVBLElBQUcsY0FBQSxHQUFpQixJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLGFBQVgsRUFBMEIsUUFBMUIsQ0FBYixDQUFwQjthQUNFLGVBREY7S0FBQSxNQUFBO2FBR0UsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsYUFBWCxFQUEwQixhQUExQixFQUhGOztFQUhpQzs7RUFRbkMsYUFBYSxDQUFBLFNBQUUsQ0FBQSxjQUFmLEdBQWdDLFNBQUE7QUFDOUIsUUFBQTtJQUFBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFDakIsSUFBQSxDQUFjLEVBQUUsQ0FBQyxVQUFILENBQWMsY0FBZCxDQUFkO0FBQUEsYUFBQTs7QUFFQTthQUNFLElBQUMsQ0FBQSxVQUFELENBQVksY0FBWixFQUE0QjtRQUFBLEtBQUEsRUFBTyxJQUFQO1FBQWEsY0FBQSxFQUFnQixJQUE3QjtRQUFtQyxRQUFBLEVBQVUsR0FBN0M7T0FBNUIsRUFERjtLQUFBLGNBQUE7TUFFTTtNQUNKLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFkLENBQXNCLHNCQUF0QixDQUFBLEdBQWdELENBQUMsQ0FBcEQ7UUFDRSxPQUFBLEdBQVUseUJBQUEsR0FDZ0IsQ0FBQyxJQUFJLENBQUMsUUFBTCxDQUFjLGNBQWQsQ0FBRCxDQURoQixHQUMrQyw2Q0FEL0MsR0FFbUIsY0FGbkIsR0FFa0M7ZUFNNUMsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFFBQXJCLENBQThCLE9BQTlCLEVBQXVDO1VBQUMsV0FBQSxFQUFhLElBQWQ7U0FBdkMsRUFURjtPQUFBLE1BQUE7UUFXRSxNQUFBLEdBQVMsS0FBSyxDQUFDO1FBQ2YsS0FBQSxHQUFRLEtBQUssQ0FBQztlQUNkLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxhQUFyQixDQUFtQyxLQUFLLENBQUMsT0FBekMsRUFBa0Q7VUFBQyxRQUFBLE1BQUQ7VUFBUyxPQUFBLEtBQVQ7VUFBZ0IsV0FBQSxFQUFhLElBQTdCO1NBQWxELEVBYkY7T0FIRjs7RUFKOEI7O0VBc0JoQyxhQUFhLENBQUEsU0FBRSxDQUFBLDBCQUFmLEdBQTRDLFNBQUE7V0FDMUMsSUFBQyxDQUFBLG1CQUFELENBQXFCLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxLQUFEO0FBQ25CLFlBQUE7UUFBQSxjQUFBLEdBQWlCLEtBQUMsQ0FBQSxpQkFBRCxDQUFBO1FBQ2pCLE9BQUEsR0FBVSxrQkFBQSxHQUFtQixjQUFuQixHQUFrQztRQUU1QyxNQUFBLEdBQVksc0JBQUgsR0FDUCxLQUFLLENBQUMsS0FEQyxHQUdQLEtBQUssQ0FBQztlQUVSLEtBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxRQUFyQixDQUE4QixPQUE5QixFQUF1QztVQUFDLFFBQUEsTUFBRDtVQUFTLFdBQUEsRUFBYSxJQUF0QjtTQUF2QztNQVRtQjtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7RUFEMEM7O0VBWTVDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBL0RqQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuS2V5bWFwTWFuYWdlciA9IHJlcXVpcmUgJ2F0b20ta2V5bWFwJ1xuQ1NPTiA9IHJlcXVpcmUgJ3NlYXNvbidcblxuYnVuZGxlZEtleW1hcHMgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKT8uX2F0b21LZXltYXBzXG5cbktleW1hcE1hbmFnZXI6Om9uRGlkTG9hZEJ1bmRsZWRLZXltYXBzID0gKGNhbGxiYWNrKSAtPlxuICBAZW1pdHRlci5vbiAnZGlkLWxvYWQtYnVuZGxlZC1rZXltYXBzJywgY2FsbGJhY2tcblxuS2V5bWFwTWFuYWdlcjo6bG9hZEJ1bmRsZWRLZXltYXBzID0gLT5cbiAga2V5bWFwc1BhdGggPSBwYXRoLmpvaW4oQHJlc291cmNlUGF0aCwgJ2tleW1hcHMnKVxuICBpZiBidW5kbGVkS2V5bWFwcz9cbiAgICBmb3Iga2V5bWFwTmFtZSwga2V5bWFwIG9mIGJ1bmRsZWRLZXltYXBzXG4gICAgICBrZXltYXBQYXRoID0gcGF0aC5qb2luKGtleW1hcHNQYXRoLCBrZXltYXBOYW1lKVxuICAgICAgQGFkZChrZXltYXBQYXRoLCBrZXltYXApXG4gIGVsc2VcbiAgICBAbG9hZEtleW1hcChrZXltYXBzUGF0aClcblxuICBAZW1pdHRlci5lbWl0ICdkaWQtbG9hZC1idW5kbGVkLWtleW1hcHMnXG5cbktleW1hcE1hbmFnZXI6OmdldFVzZXJLZXltYXBQYXRoID0gLT5cbiAgcmV0dXJuIFwiXCIgdW5sZXNzIEBjb25maWdEaXJQYXRoP1xuXG4gIGlmIHVzZXJLZXltYXBQYXRoID0gQ1NPTi5yZXNvbHZlKHBhdGguam9pbihAY29uZmlnRGlyUGF0aCwgJ2tleW1hcCcpKVxuICAgIHVzZXJLZXltYXBQYXRoXG4gIGVsc2VcbiAgICBwYXRoLmpvaW4oQGNvbmZpZ0RpclBhdGgsICdrZXltYXAuY3NvbicpXG5cbktleW1hcE1hbmFnZXI6OmxvYWRVc2VyS2V5bWFwID0gLT5cbiAgdXNlcktleW1hcFBhdGggPSBAZ2V0VXNlcktleW1hcFBhdGgoKVxuICByZXR1cm4gdW5sZXNzIGZzLmlzRmlsZVN5bmModXNlcktleW1hcFBhdGgpXG5cbiAgdHJ5XG4gICAgQGxvYWRLZXltYXAodXNlcktleW1hcFBhdGgsIHdhdGNoOiB0cnVlLCBzdXBwcmVzc0Vycm9yczogdHJ1ZSwgcHJpb3JpdHk6IDEwMClcbiAgY2F0Y2ggZXJyb3JcbiAgICBpZiBlcnJvci5tZXNzYWdlLmluZGV4T2YoJ1VuYWJsZSB0byB3YXRjaCBwYXRoJykgPiAtMVxuICAgICAgbWVzc2FnZSA9IFwiXCJcIlxuICAgICAgICBVbmFibGUgdG8gd2F0Y2ggcGF0aDogYCN7cGF0aC5iYXNlbmFtZSh1c2VyS2V5bWFwUGF0aCl9YC4gTWFrZSBzdXJlIHlvdVxuICAgICAgICBoYXZlIHBlcm1pc3Npb24gdG8gcmVhZCBgI3t1c2VyS2V5bWFwUGF0aH1gLlxuXG4gICAgICAgIE9uIGxpbnV4IHRoZXJlIGFyZSBjdXJyZW50bHkgcHJvYmxlbXMgd2l0aCB3YXRjaCBzaXplcy4gU2VlXG4gICAgICAgIFt0aGlzIGRvY3VtZW50XVt3YXRjaGVzXSBmb3IgbW9yZSBpbmZvLlxuICAgICAgICBbd2F0Y2hlc106aHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9ibG9iL21hc3Rlci9kb2NzL2J1aWxkLWluc3RydWN0aW9ucy9saW51eC5tZCN0eXBlZXJyb3ItdW5hYmxlLXRvLXdhdGNoLXBhdGhcbiAgICAgIFwiXCJcIlxuICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRXJyb3IobWVzc2FnZSwge2Rpc21pc3NhYmxlOiB0cnVlfSlcbiAgICBlbHNlXG4gICAgICBkZXRhaWwgPSBlcnJvci5wYXRoXG4gICAgICBzdGFjayA9IGVycm9yLnN0YWNrXG4gICAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRGYXRhbEVycm9yKGVycm9yLm1lc3NhZ2UsIHtkZXRhaWwsIHN0YWNrLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG5cbktleW1hcE1hbmFnZXI6OnN1YnNjcmliZVRvRmlsZVJlYWRGYWlsdXJlID0gLT5cbiAgQG9uRGlkRmFpbFRvUmVhZEZpbGUgKGVycm9yKSA9PlxuICAgIHVzZXJLZXltYXBQYXRoID0gQGdldFVzZXJLZXltYXBQYXRoKClcbiAgICBtZXNzYWdlID0gXCJGYWlsZWQgdG8gbG9hZCBgI3t1c2VyS2V5bWFwUGF0aH1gXCJcblxuICAgIGRldGFpbCA9IGlmIGVycm9yLmxvY2F0aW9uP1xuICAgICAgZXJyb3Iuc3RhY2tcbiAgICBlbHNlXG4gICAgICBlcnJvci5tZXNzYWdlXG5cbiAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRFcnJvcihtZXNzYWdlLCB7ZGV0YWlsLCBkaXNtaXNzYWJsZTogdHJ1ZX0pXG5cbm1vZHVsZS5leHBvcnRzID0gS2V5bWFwTWFuYWdlclxuIl19
