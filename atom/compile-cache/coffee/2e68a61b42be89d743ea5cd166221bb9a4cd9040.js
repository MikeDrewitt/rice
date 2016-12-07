(function() {
  var BaseThemeWatcher, PackageWatcher, UIWatcher, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  BaseThemeWatcher = require('./base-theme-watcher');

  PackageWatcher = require('./package-watcher');

  module.exports = UIWatcher = (function() {
    function UIWatcher() {
      this.reloadAll = bind(this.reloadAll, this);
      this.watchers = [];
      this.baseTheme = this.createWatcher(BaseThemeWatcher);
      this.watchPackages();
    }

    UIWatcher.prototype.watchPackages = function() {
      var i, j, len, len1, pack, ref, ref1, theme;
      this.watchedThemes = {};
      this.watchedPackages = {};
      ref = atom.themes.getActiveThemes();
      for (i = 0, len = ref.length; i < len; i++) {
        theme = ref[i];
        this.watchTheme(theme);
      }
      ref1 = atom.packages.getLoadedPackages();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        pack = ref1[j];
        this.watchPackage(pack);
      }
      return this.watchForPackageChanges();
    };

    UIWatcher.prototype.watchForPackageChanges = function() {
      return atom.themes.onDidChangeActiveThemes((function(_this) {
        return function() {
          var i, len, name, ref, ref1, theme, themes, watcher;
          ref = _this.watchedThemes;
          for (name in ref) {
            watcher = ref[name];
            watcher.destroy();
          }
          _this.watchedThemes = {};
          ref1 = atom.themes.getActiveThemes();
          for (i = 0, len = ref1.length; i < len; i++) {
            theme = ref1[i];
            _this.watchTheme(theme);
          }
          themes = Object.keys(_this.watchedThemes);
          return null;
        };
      })(this));
    };

    UIWatcher.prototype.watchTheme = function(theme) {
      if (PackageWatcher.supportsPackage(theme, 'theme')) {
        return this.watchedThemes[theme.name] = this.createWatcher(PackageWatcher, theme);
      }
    };

    UIWatcher.prototype.watchPackage = function(pack) {
      if (PackageWatcher.supportsPackage(pack, 'atom')) {
        return this.watchedPackages[pack.name] = this.createWatcher(PackageWatcher, pack);
      }
    };

    UIWatcher.prototype.createWatcher = function(type, object) {
      var watcher;
      watcher = new type(object);
      watcher.onDidChangeGlobals((function(_this) {
        return function() {
          console.log('Global changed, reloading all styles');
          return _this.reloadAll();
        };
      })(this));
      watcher.onDidDestroy((function(_this) {
        return function() {
          return _this.watchers = _.without(_this.watchers, watcher);
        };
      })(this));
      this.watchers.push(watcher);
      return watcher;
    };

    UIWatcher.prototype.reloadAll = function() {
      var i, j, len, len1, pack, ref, ref1, results;
      this.baseTheme.loadAllStylesheets();
      ref = atom.packages.getActivePackages();
      for (i = 0, len = ref.length; i < len; i++) {
        pack = ref[i];
        if (PackageWatcher.supportsPackage(pack, 'atom')) {
          pack.reloadStylesheets();
        }
      }
      ref1 = atom.themes.getActiveThemes();
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        pack = ref1[j];
        if (PackageWatcher.supportsPackage(pack, 'theme')) {
          results.push(pack.reloadStylesheets());
        }
      }
      return results;
    };

    UIWatcher.prototype.destroy = function() {
      var name, ref, ref1, results, watcher;
      this.baseTheme.destroy();
      ref = this.watchedPackages;
      for (name in ref) {
        watcher = ref[name];
        watcher.destroy();
      }
      ref1 = this.watchedThemes;
      results = [];
      for (name in ref1) {
        watcher = ref1[name];
        results.push(watcher.destroy());
      }
      return results;
    };

    return UIWatcher;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXYtbGl2ZS1yZWxvYWQvbGliL3VpLXdhdGNoZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4Q0FBQTtJQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osZ0JBQUEsR0FBbUIsT0FBQSxDQUFRLHNCQUFSOztFQUNuQixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxtQkFBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLG1CQUFBOztNQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxhQUFELENBQWUsZ0JBQWY7TUFDYixJQUFDLENBQUEsYUFBRCxDQUFBO0lBSFc7O3dCQUtiLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSxlQUFELEdBQW1CO0FBQ25CO0FBQUEsV0FBQSxxQ0FBQTs7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7QUFBQTtBQUNBO0FBQUEsV0FBQSx3Q0FBQTs7UUFBQSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQWQ7QUFBQTthQUNBLElBQUMsQ0FBQSxzQkFBRCxDQUFBO0lBTGE7O3dCQU9mLHNCQUFBLEdBQXdCLFNBQUE7YUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBWixDQUFvQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFHbEMsY0FBQTtBQUFBO0FBQUEsZUFBQSxXQUFBOztZQUFBLE9BQU8sQ0FBQyxPQUFSLENBQUE7QUFBQTtVQUVBLEtBQUMsQ0FBQSxhQUFELEdBQWlCO0FBRWpCO0FBQUEsZUFBQSxzQ0FBQTs7WUFBQSxLQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7QUFBQTtVQUVBLE1BQUEsR0FBUyxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQUMsQ0FBQSxhQUFiO2lCQUVUO1FBWGtDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFwQztJQURzQjs7d0JBY3hCLFVBQUEsR0FBWSxTQUFDLEtBQUQ7TUFDVixJQUFzRSxjQUFjLENBQUMsZUFBZixDQUErQixLQUEvQixFQUFzQyxPQUF0QyxDQUF0RTtlQUFBLElBQUMsQ0FBQSxhQUFjLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBZixHQUE2QixJQUFDLENBQUEsYUFBRCxDQUFlLGNBQWYsRUFBK0IsS0FBL0IsRUFBN0I7O0lBRFU7O3dCQUdaLFlBQUEsR0FBYyxTQUFDLElBQUQ7TUFDWixJQUFzRSxjQUFjLENBQUMsZUFBZixDQUErQixJQUEvQixFQUFxQyxNQUFyQyxDQUF0RTtlQUFBLElBQUMsQ0FBQSxlQUFnQixDQUFBLElBQUksQ0FBQyxJQUFMLENBQWpCLEdBQThCLElBQUMsQ0FBQSxhQUFELENBQWUsY0FBZixFQUErQixJQUEvQixFQUE5Qjs7SUFEWTs7d0JBR2QsYUFBQSxHQUFlLFNBQUMsSUFBRCxFQUFPLE1BQVA7QUFDYixVQUFBO01BQUEsT0FBQSxHQUFjLElBQUEsSUFBQSxDQUFLLE1BQUw7TUFDZCxPQUFPLENBQUMsa0JBQVIsQ0FBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3pCLE9BQU8sQ0FBQyxHQUFSLENBQVksc0NBQVo7aUJBQ0EsS0FBQyxDQUFBLFNBQUQsQ0FBQTtRQUZ5QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0I7TUFHQSxPQUFPLENBQUMsWUFBUixDQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ25CLEtBQUMsQ0FBQSxRQUFELEdBQVksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFDLENBQUEsUUFBWCxFQUFxQixPQUFyQjtRQURPO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtNQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLE9BQWY7YUFDQTtJQVJhOzt3QkFVZixTQUFBLEdBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLGtCQUFYLENBQUE7QUFDQTtBQUFBLFdBQUEscUNBQUE7O1lBQTRFLGNBQWMsQ0FBQyxlQUFmLENBQStCLElBQS9CLEVBQXFDLE1BQXJDO1VBQTVFLElBQUksQ0FBQyxpQkFBTCxDQUFBOztBQUFBO0FBQ0E7QUFBQTtXQUFBLHdDQUFBOztZQUF3RSxjQUFjLENBQUMsZUFBZixDQUErQixJQUEvQixFQUFxQyxPQUFyQzt1QkFBeEUsSUFBSSxDQUFDLGlCQUFMLENBQUE7O0FBQUE7O0lBSFM7O3dCQUtYLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBWCxDQUFBO0FBQ0E7QUFBQSxXQUFBLFdBQUE7O1FBQUEsT0FBTyxDQUFDLE9BQVIsQ0FBQTtBQUFBO0FBQ0E7QUFBQTtXQUFBLFlBQUE7O3FCQUFBLE9BQU8sQ0FBQyxPQUFSLENBQUE7QUFBQTs7SUFITzs7Ozs7QUFyRFgiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuQmFzZVRoZW1lV2F0Y2hlciA9IHJlcXVpcmUgJy4vYmFzZS10aGVtZS13YXRjaGVyJ1xuUGFja2FnZVdhdGNoZXIgPSByZXF1aXJlICcuL3BhY2thZ2Utd2F0Y2hlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVUlXYXRjaGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEB3YXRjaGVycyA9IFtdXG4gICAgQGJhc2VUaGVtZSA9IEBjcmVhdGVXYXRjaGVyKEJhc2VUaGVtZVdhdGNoZXIpXG4gICAgQHdhdGNoUGFja2FnZXMoKVxuXG4gIHdhdGNoUGFja2FnZXM6IC0+XG4gICAgQHdhdGNoZWRUaGVtZXMgPSB7fVxuICAgIEB3YXRjaGVkUGFja2FnZXMgPSB7fVxuICAgIEB3YXRjaFRoZW1lKHRoZW1lKSBmb3IgdGhlbWUgaW4gYXRvbS50aGVtZXMuZ2V0QWN0aXZlVGhlbWVzKClcbiAgICBAd2F0Y2hQYWNrYWdlKHBhY2spIGZvciBwYWNrIGluIGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZXMoKVxuICAgIEB3YXRjaEZvclBhY2thZ2VDaGFuZ2VzKClcblxuICB3YXRjaEZvclBhY2thZ2VDaGFuZ2VzOiAtPlxuICAgIGF0b20udGhlbWVzLm9uRGlkQ2hhbmdlQWN0aXZlVGhlbWVzID0+XG4gICAgICAjIHdlIG5lZWQgdG8gZGVzdHJveSBhbGwgd2F0Y2hlcnMgYXMgYWxsIHRoZW1lIHBhY2thZ2VzIGFyZSBkZXN0cm95ZWQgd2hlbiBhXG4gICAgICAjIHRoZW1lIGNoYW5nZXMuXG4gICAgICB3YXRjaGVyLmRlc3Ryb3koKSBmb3IgbmFtZSwgd2F0Y2hlciBvZiBAd2F0Y2hlZFRoZW1lc1xuXG4gICAgICBAd2F0Y2hlZFRoZW1lcyA9IHt9XG4gICAgICAjIFJld2F0Y2ggZXZlcnl0aGluZyFcbiAgICAgIEB3YXRjaFRoZW1lKHRoZW1lKSBmb3IgdGhlbWUgaW4gYXRvbS50aGVtZXMuZ2V0QWN0aXZlVGhlbWVzKClcblxuICAgICAgdGhlbWVzID0gT2JqZWN0LmtleXMoQHdhdGNoZWRUaGVtZXMpXG5cbiAgICAgIG51bGxcblxuICB3YXRjaFRoZW1lOiAodGhlbWUpIC0+XG4gICAgQHdhdGNoZWRUaGVtZXNbdGhlbWUubmFtZV0gPSBAY3JlYXRlV2F0Y2hlcihQYWNrYWdlV2F0Y2hlciwgdGhlbWUpIGlmIFBhY2thZ2VXYXRjaGVyLnN1cHBvcnRzUGFja2FnZSh0aGVtZSwgJ3RoZW1lJylcblxuICB3YXRjaFBhY2thZ2U6IChwYWNrKSAtPlxuICAgIEB3YXRjaGVkUGFja2FnZXNbcGFjay5uYW1lXSA9IEBjcmVhdGVXYXRjaGVyKFBhY2thZ2VXYXRjaGVyLCBwYWNrKSBpZiBQYWNrYWdlV2F0Y2hlci5zdXBwb3J0c1BhY2thZ2UocGFjaywgJ2F0b20nKVxuXG4gIGNyZWF0ZVdhdGNoZXI6ICh0eXBlLCBvYmplY3QpIC0+XG4gICAgd2F0Y2hlciA9IG5ldyB0eXBlKG9iamVjdClcbiAgICB3YXRjaGVyLm9uRGlkQ2hhbmdlR2xvYmFscyA9PlxuICAgICAgY29uc29sZS5sb2cgJ0dsb2JhbCBjaGFuZ2VkLCByZWxvYWRpbmcgYWxsIHN0eWxlcydcbiAgICAgIEByZWxvYWRBbGwoKVxuICAgIHdhdGNoZXIub25EaWREZXN0cm95ID0+XG4gICAgICBAd2F0Y2hlcnMgPSBfLndpdGhvdXQoQHdhdGNoZXJzLCB3YXRjaGVyKVxuICAgIEB3YXRjaGVycy5wdXNoKHdhdGNoZXIpXG4gICAgd2F0Y2hlclxuXG4gIHJlbG9hZEFsbDogPT5cbiAgICBAYmFzZVRoZW1lLmxvYWRBbGxTdHlsZXNoZWV0cygpXG4gICAgcGFjay5yZWxvYWRTdHlsZXNoZWV0cygpIGZvciBwYWNrIGluIGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZXMoKSB3aGVuIFBhY2thZ2VXYXRjaGVyLnN1cHBvcnRzUGFja2FnZShwYWNrLCAnYXRvbScpXG4gICAgcGFjay5yZWxvYWRTdHlsZXNoZWV0cygpIGZvciBwYWNrIGluIGF0b20udGhlbWVzLmdldEFjdGl2ZVRoZW1lcygpIHdoZW4gUGFja2FnZVdhdGNoZXIuc3VwcG9ydHNQYWNrYWdlKHBhY2ssICd0aGVtZScpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAYmFzZVRoZW1lLmRlc3Ryb3koKVxuICAgIHdhdGNoZXIuZGVzdHJveSgpIGZvciBuYW1lLCB3YXRjaGVyIG9mIEB3YXRjaGVkUGFja2FnZXNcbiAgICB3YXRjaGVyLmRlc3Ryb3koKSBmb3IgbmFtZSwgd2F0Y2hlciBvZiBAd2F0Y2hlZFRoZW1lc1xuIl19
