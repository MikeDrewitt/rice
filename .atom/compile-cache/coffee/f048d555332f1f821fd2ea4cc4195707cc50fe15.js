(function() {
  var CompositeDisposable, Emitter, File, ThemeManager, _, fs, path, ref;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  File = require('pathwatcher').File;

  fs = require('fs-plus');

  module.exports = ThemeManager = (function() {
    function ThemeManager(arg) {
      this.packageManager = arg.packageManager, this.resourcePath = arg.resourcePath, this.configDirPath = arg.configDirPath, this.safeMode = arg.safeMode, this.config = arg.config, this.styleManager = arg.styleManager, this.notificationManager = arg.notificationManager, this.viewRegistry = arg.viewRegistry;
      this.emitter = new Emitter;
      this.styleSheetDisposablesBySourcePath = {};
      this.lessCache = null;
      this.initialLoadComplete = false;
      this.packageManager.registerPackageActivator(this, ['theme']);
      this.packageManager.onDidActivateInitialPackages((function(_this) {
        return function() {
          return _this.onDidChangeActiveThemes(function() {
            return _this.packageManager.reloadActivePackageStyleSheets();
          });
        };
      })(this));
    }


    /*
    Section: Event Subscription
     */

    ThemeManager.prototype.onDidChangeActiveThemes = function(callback) {
      return this.emitter.on('did-change-active-themes', callback);
    };


    /*
    Section: Accessing Available Themes
     */

    ThemeManager.prototype.getAvailableNames = function() {
      return this.getLoadedNames();
    };


    /*
    Section: Accessing Loaded Themes
     */

    ThemeManager.prototype.getLoadedThemeNames = function() {
      var i, len, ref1, results, theme;
      ref1 = this.getLoadedThemes();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        theme = ref1[i];
        results.push(theme.name);
      }
      return results;
    };

    ThemeManager.prototype.getLoadedThemes = function() {
      var i, len, pack, ref1, results;
      ref1 = this.packageManager.getLoadedPackages();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        if (pack.isTheme()) {
          results.push(pack);
        }
      }
      return results;
    };


    /*
    Section: Accessing Active Themes
     */

    ThemeManager.prototype.getActiveThemeNames = function() {
      var i, len, ref1, results, theme;
      ref1 = this.getActiveThemes();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        theme = ref1[i];
        results.push(theme.name);
      }
      return results;
    };

    ThemeManager.prototype.getActiveThemes = function() {
      var i, len, pack, ref1, results;
      ref1 = this.packageManager.getActivePackages();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        if (pack.isTheme()) {
          results.push(pack);
        }
      }
      return results;
    };

    ThemeManager.prototype.activatePackages = function() {
      return this.activateThemes();
    };


    /*
    Section: Managing Enabled Themes
     */

    ThemeManager.prototype.warnForNonExistentThemes = function() {
      var i, len, ref1, results, themeName, themeNames;
      themeNames = (ref1 = this.config.get('core.themes')) != null ? ref1 : [];
      if (!_.isArray(themeNames)) {
        themeNames = [themeNames];
      }
      results = [];
      for (i = 0, len = themeNames.length; i < len; i++) {
        themeName = themeNames[i];
        if (!(themeName && typeof themeName === 'string' && this.packageManager.resolvePackagePath(themeName))) {
          results.push(console.warn("Enabled theme '" + themeName + "' is not installed."));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    ThemeManager.prototype.getEnabledThemeNames = function() {
      var builtInThemeNames, ref1, themeNames;
      themeNames = (ref1 = this.config.get('core.themes')) != null ? ref1 : [];
      if (!_.isArray(themeNames)) {
        themeNames = [themeNames];
      }
      themeNames = themeNames.filter((function(_this) {
        return function(themeName) {
          if (themeName && typeof themeName === 'string') {
            if (_this.packageManager.resolvePackagePath(themeName)) {
              return true;
            }
          }
          return false;
        };
      })(this));
      if (themeNames.length < 2) {
        builtInThemeNames = ['atom-dark-syntax', 'atom-dark-ui', 'atom-light-syntax', 'atom-light-ui', 'base16-tomorrow-dark-theme', 'base16-tomorrow-light-theme', 'solarized-dark-syntax', 'solarized-light-syntax'];
        themeNames = _.intersection(themeNames, builtInThemeNames);
        if (themeNames.length === 0) {
          themeNames = ['atom-dark-syntax', 'atom-dark-ui'];
        } else if (themeNames.length === 1) {
          if (_.endsWith(themeNames[0], '-ui')) {
            themeNames.unshift('atom-dark-syntax');
          } else {
            themeNames.push('atom-dark-ui');
          }
        }
      }
      return themeNames.reverse();
    };


    /*
    Section: Private
     */

    ThemeManager.prototype.requireStylesheet = function(stylesheetPath) {
      var content, fullPath;
      if (fullPath = this.resolveStylesheet(stylesheetPath)) {
        content = this.loadStylesheet(fullPath);
        return this.applyStylesheet(fullPath, content);
      } else {
        throw new Error("Could not find a file at path '" + stylesheetPath + "'");
      }
    };

    ThemeManager.prototype.unwatchUserStylesheet = function() {
      var ref1, ref2;
      if ((ref1 = this.userStylsheetSubscriptions) != null) {
        ref1.dispose();
      }
      this.userStylsheetSubscriptions = null;
      this.userStylesheetFile = null;
      if ((ref2 = this.userStyleSheetDisposable) != null) {
        ref2.dispose();
      }
      return this.userStyleSheetDisposable = null;
    };

    ThemeManager.prototype.loadUserStylesheet = function() {
      var error, message, reloadStylesheet, userStylesheetContents, userStylesheetPath;
      this.unwatchUserStylesheet();
      userStylesheetPath = this.styleManager.getUserStyleSheetPath();
      if (!fs.isFileSync(userStylesheetPath)) {
        return;
      }
      try {
        this.userStylesheetFile = new File(userStylesheetPath);
        this.userStylsheetSubscriptions = new CompositeDisposable();
        reloadStylesheet = (function(_this) {
          return function() {
            return _this.loadUserStylesheet();
          };
        })(this);
        this.userStylsheetSubscriptions.add(this.userStylesheetFile.onDidChange(reloadStylesheet));
        this.userStylsheetSubscriptions.add(this.userStylesheetFile.onDidRename(reloadStylesheet));
        this.userStylsheetSubscriptions.add(this.userStylesheetFile.onDidDelete(reloadStylesheet));
      } catch (error1) {
        error = error1;
        message = "Unable to watch path: `" + (path.basename(userStylesheetPath)) + "`. Make sure\nyou have permissions to `" + userStylesheetPath + "`.\n\nOn linux there are currently problems with watch sizes. See\n[this document][watches] for more info.\n[watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path";
        this.notificationManager.addError(message, {
          dismissable: true
        });
      }
      try {
        userStylesheetContents = this.loadStylesheet(userStylesheetPath, true);
      } catch (error1) {
        return;
      }
      return this.userStyleSheetDisposable = this.styleManager.addStyleSheet(userStylesheetContents, {
        sourcePath: userStylesheetPath,
        priority: 2
      });
    };

    ThemeManager.prototype.loadBaseStylesheets = function() {
      return this.reloadBaseStylesheets();
    };

    ThemeManager.prototype.reloadBaseStylesheets = function() {
      var nativeStylesheetPath;
      this.requireStylesheet('../static/atom');
      if (nativeStylesheetPath = fs.resolveOnLoadPath(process.platform, ['css', 'less'])) {
        return this.requireStylesheet(nativeStylesheetPath);
      }
    };

    ThemeManager.prototype.stylesheetElementForId = function(id) {
      return document.head.querySelector("atom-styles style[source-path=\"" + id + "\"]");
    };

    ThemeManager.prototype.resolveStylesheet = function(stylesheetPath) {
      if (path.extname(stylesheetPath).length > 0) {
        return fs.resolveOnLoadPath(stylesheetPath);
      } else {
        return fs.resolveOnLoadPath(stylesheetPath, ['css', 'less']);
      }
    };

    ThemeManager.prototype.loadStylesheet = function(stylesheetPath, importFallbackVariables) {
      if (path.extname(stylesheetPath) === '.less') {
        return this.loadLessStylesheet(stylesheetPath, importFallbackVariables);
      } else {
        return fs.readFileSync(stylesheetPath, 'utf8');
      }
    };

    ThemeManager.prototype.loadLessStylesheet = function(lessStylesheetPath, importFallbackVariables) {
      var LessCompileCache, baseVarImports, detail, error, less, message;
      if (importFallbackVariables == null) {
        importFallbackVariables = false;
      }
      if (this.lessCache == null) {
        LessCompileCache = require('./less-compile-cache');
        this.lessCache = new LessCompileCache({
          resourcePath: this.resourcePath,
          importPaths: this.getImportPaths()
        });
      }
      try {
        if (importFallbackVariables) {
          baseVarImports = "@import \"variables/ui-variables\";\n@import \"variables/syntax-variables\";";
          less = fs.readFileSync(lessStylesheetPath, 'utf8');
          return this.lessCache.cssForFile(lessStylesheetPath, [baseVarImports, less].join('\n'));
        } else {
          return this.lessCache.read(lessStylesheetPath);
        }
      } catch (error1) {
        error = error1;
        error.less = true;
        if (error.line != null) {
          if (importFallbackVariables) {
            error.line -= 2;
          }
          message = "Error compiling Less stylesheet: `" + lessStylesheetPath + "`";
          detail = "Line number: " + error.line + "\n" + error.message;
        } else {
          message = "Error loading Less stylesheet: `" + lessStylesheetPath + "`";
          detail = error.message;
        }
        this.notificationManager.addError(message, {
          detail: detail,
          dismissable: true
        });
        throw error;
      }
    };

    ThemeManager.prototype.removeStylesheet = function(stylesheetPath) {
      var ref1;
      return (ref1 = this.styleSheetDisposablesBySourcePath[stylesheetPath]) != null ? ref1.dispose() : void 0;
    };

    ThemeManager.prototype.applyStylesheet = function(path, text) {
      return this.styleSheetDisposablesBySourcePath[path] = this.styleManager.addStyleSheet(text, {
        sourcePath: path
      });
    };

    ThemeManager.prototype.stringToId = function(string) {
      return string.replace(/\\/g, '/');
    };

    ThemeManager.prototype.activateThemes = function() {
      return new Promise((function(_this) {
        return function(resolve) {
          return _this.config.observe('core.themes', function() {
            var i, len, promises, ref1, themeName;
            _this.deactivateThemes();
            _this.warnForNonExistentThemes();
            _this.refreshLessCache();
            promises = [];
            ref1 = _this.getEnabledThemeNames();
            for (i = 0, len = ref1.length; i < len; i++) {
              themeName = ref1[i];
              if (_this.packageManager.resolvePackagePath(themeName)) {
                promises.push(_this.packageManager.activatePackage(themeName));
              } else {
                console.warn("Failed to activate theme '" + themeName + "' because it isn't installed.");
              }
            }
            return Promise.all(promises).then(function() {
              _this.addActiveThemeClasses();
              _this.refreshLessCache();
              _this.loadUserStylesheet();
              _this.reloadBaseStylesheets();
              _this.initialLoadComplete = true;
              _this.emitter.emit('did-change-active-themes');
              return resolve();
            });
          });
        };
      })(this));
    };

    ThemeManager.prototype.deactivateThemes = function() {
      var i, len, pack, ref1;
      this.removeActiveThemeClasses();
      this.unwatchUserStylesheet();
      ref1 = this.getActiveThemes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        this.packageManager.deactivatePackage(pack.name);
      }
      return null;
    };

    ThemeManager.prototype.isInitialLoadComplete = function() {
      return this.initialLoadComplete;
    };

    ThemeManager.prototype.addActiveThemeClasses = function() {
      var i, len, pack, ref1, workspaceElement;
      if (workspaceElement = this.viewRegistry.getView(this.workspace)) {
        ref1 = this.getActiveThemes();
        for (i = 0, len = ref1.length; i < len; i++) {
          pack = ref1[i];
          workspaceElement.classList.add("theme-" + pack.name);
        }
      }
    };

    ThemeManager.prototype.removeActiveThemeClasses = function() {
      var i, len, pack, ref1, workspaceElement;
      workspaceElement = this.viewRegistry.getView(this.workspace);
      ref1 = this.getActiveThemes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        workspaceElement.classList.remove("theme-" + pack.name);
      }
    };

    ThemeManager.prototype.refreshLessCache = function() {
      var ref1;
      return (ref1 = this.lessCache) != null ? ref1.setImportPaths(this.getImportPaths()) : void 0;
    };

    ThemeManager.prototype.getImportPaths = function() {
      var activeThemes, deprecatedPath, i, len, ref1, theme, themeName, themePath, themePaths;
      activeThemes = this.getActiveThemes();
      if (activeThemes.length > 0) {
        themePaths = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = activeThemes.length; i < len; i++) {
            theme = activeThemes[i];
            if (theme) {
              results.push(theme.getStylesheetsPath());
            }
          }
          return results;
        })();
      } else {
        themePaths = [];
        ref1 = this.getEnabledThemeNames();
        for (i = 0, len = ref1.length; i < len; i++) {
          themeName = ref1[i];
          if (themePath = this.packageManager.resolvePackagePath(themeName)) {
            deprecatedPath = path.join(themePath, 'stylesheets');
            if (fs.isDirectorySync(deprecatedPath)) {
              themePaths.push(deprecatedPath);
            } else {
              themePaths.push(path.join(themePath, 'styles'));
            }
          }
        }
      }
      return themePaths.filter(function(themePath) {
        return fs.isDirectorySync(themePath);
      });
    };

    return ThemeManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3RoZW1lLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1QsT0FBUSxPQUFBLENBQVEsYUFBUjs7RUFDVCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBS0wsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFDLEdBQUQ7TUFBRSxJQUFDLENBQUEscUJBQUEsZ0JBQWdCLElBQUMsQ0FBQSxtQkFBQSxjQUFjLElBQUMsQ0FBQSxvQkFBQSxlQUFlLElBQUMsQ0FBQSxlQUFBLFVBQVUsSUFBQyxDQUFBLGFBQUEsUUFBUSxJQUFDLENBQUEsbUJBQUEsY0FBYyxJQUFDLENBQUEsMEJBQUEscUJBQXFCLElBQUMsQ0FBQSxtQkFBQTtNQUN2SCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsaUNBQUQsR0FBcUM7TUFDckMsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtNQUN2QixJQUFDLENBQUEsY0FBYyxDQUFDLHdCQUFoQixDQUF5QyxJQUF6QyxFQUErQyxDQUFDLE9BQUQsQ0FBL0M7TUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLDRCQUFoQixDQUE2QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzNDLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixTQUFBO21CQUFHLEtBQUMsQ0FBQSxjQUFjLENBQUMsOEJBQWhCLENBQUE7VUFBSCxDQUF6QjtRQUQy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QWhCLENBQW1DLFNBQW5DLENBQWY7WUFDRSxjQUFBLEdBQWlCLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixhQUFyQjtZQUNqQixJQUFHLEVBQUUsQ0FBQyxlQUFILENBQW1CLGNBQW5CLENBQUg7Y0FDRSxVQUFVLENBQUMsSUFBWCxDQUFnQixjQUFoQixFQURGO2FBQUEsTUFBQTtjQUdFLFVBQVUsQ0FBQyxJQUFYLENBQWdCLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixRQUFyQixDQUFoQixFQUhGO2FBRkY7O0FBREYsU0FKRjs7YUFZQSxVQUFVLENBQUMsTUFBWCxDQUFrQixTQUFDLFNBQUQ7ZUFBZSxFQUFFLENBQUMsZUFBSCxDQUFtQixTQUFuQjtNQUFmLENBQWxCO0lBZGM7Ozs7O0FBN1JsQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbntGaWxlfSA9IHJlcXVpcmUgJ3BhdGh3YXRjaGVyJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuXG4jIEV4dGVuZGVkOiBIYW5kbGVzIGxvYWRpbmcgYW5kIGFjdGl2YXRpbmcgYXZhaWxhYmxlIHRoZW1lcy5cbiNcbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS50aGVtZXNgIGdsb2JhbC5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRoZW1lTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKHtAcGFja2FnZU1hbmFnZXIsIEByZXNvdXJjZVBhdGgsIEBjb25maWdEaXJQYXRoLCBAc2FmZU1vZGUsIEBjb25maWcsIEBzdHlsZU1hbmFnZXIsIEBub3RpZmljYXRpb25NYW5hZ2VyLCBAdmlld1JlZ2lzdHJ5fSkgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN0eWxlU2hlZXREaXNwb3NhYmxlc0J5U291cmNlUGF0aCA9IHt9XG4gICAgQGxlc3NDYWNoZSA9IG51bGxcbiAgICBAaW5pdGlhbExvYWRDb21wbGV0ZSA9IGZhbHNlXG4gICAgQHBhY2thZ2VNYW5hZ2VyLnJlZ2lzdGVyUGFja2FnZUFjdGl2YXRvcih0aGlzLCBbJ3RoZW1lJ10pXG4gICAgQHBhY2thZ2VNYW5hZ2VyLm9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXMgPT5cbiAgICAgIEBvbkRpZENoYW5nZUFjdGl2ZVRoZW1lcyA9PiBAcGFja2FnZU1hbmFnZXIucmVsb2FkQWN0aXZlUGFja2FnZVN0eWxlU2hlZXRzKClcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgYGNhbGxiYWNrYCB3aGVuIHN0eWxlIHNoZWV0IGNoYW5nZXMgYXNzb2NpYXRlZCB3aXRoXG4gICMgdXBkYXRpbmcgdGhlIGxpc3Qgb2YgYWN0aXZlIHRoZW1lcyBoYXZlIGNvbXBsZXRlZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gIG9uRGlkQ2hhbmdlQWN0aXZlVGhlbWVzOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtYWN0aXZlLXRoZW1lcycsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFjY2Vzc2luZyBBdmFpbGFibGUgVGhlbWVzXG4gICMjI1xuXG4gIGdldEF2YWlsYWJsZU5hbWVzOiAtPlxuICAgICMgVE9ETzogTWF5YmUgc2hvdWxkIGNoYW5nZSB0byBsaXN0IGFsbCB0aGUgYXZhaWxhYmxlIHRoZW1lcyBvdXQgdGhlcmU/XG4gICAgQGdldExvYWRlZE5hbWVzKClcblxuICAjIyNcbiAgU2VjdGlvbjogQWNjZXNzaW5nIExvYWRlZCBUaGVtZXNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMgb2YgYWxsIHRoZSBsb2FkZWQgdGhlbWUgbmFtZXMuXG4gIGdldExvYWRlZFRoZW1lTmFtZXM6IC0+XG4gICAgdGhlbWUubmFtZSBmb3IgdGhlbWUgaW4gQGdldExvYWRlZFRoZW1lcygpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiBhbGwgdGhlIGxvYWRlZCB0aGVtZXMuXG4gIGdldExvYWRlZFRoZW1lczogLT5cbiAgICBwYWNrIGZvciBwYWNrIGluIEBwYWNrYWdlTWFuYWdlci5nZXRMb2FkZWRQYWNrYWdlcygpIHdoZW4gcGFjay5pc1RoZW1lKClcblxuICAjIyNcbiAgU2VjdGlvbjogQWNjZXNzaW5nIEFjdGl2ZSBUaGVtZXNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiB7U3RyaW5nfXMgYWxsIHRoZSBhY3RpdmUgdGhlbWUgbmFtZXMuXG4gIGdldEFjdGl2ZVRoZW1lTmFtZXM6IC0+XG4gICAgdGhlbWUubmFtZSBmb3IgdGhlbWUgaW4gQGdldEFjdGl2ZVRoZW1lcygpXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYW4ge0FycmF5fSBvZiBhbGwgdGhlIGFjdGl2ZSB0aGVtZXMuXG4gIGdldEFjdGl2ZVRoZW1lczogLT5cbiAgICBwYWNrIGZvciBwYWNrIGluIEBwYWNrYWdlTWFuYWdlci5nZXRBY3RpdmVQYWNrYWdlcygpIHdoZW4gcGFjay5pc1RoZW1lKClcblxuICBhY3RpdmF0ZVBhY2thZ2VzOiAtPiBAYWN0aXZhdGVUaGVtZXMoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBNYW5hZ2luZyBFbmFibGVkIFRoZW1lc1xuICAjIyNcblxuICB3YXJuRm9yTm9uRXhpc3RlbnRUaGVtZXM6IC0+XG4gICAgdGhlbWVOYW1lcyA9IEBjb25maWcuZ2V0KCdjb3JlLnRoZW1lcycpID8gW11cbiAgICB0aGVtZU5hbWVzID0gW3RoZW1lTmFtZXNdIHVubGVzcyBfLmlzQXJyYXkodGhlbWVOYW1lcylcbiAgICBmb3IgdGhlbWVOYW1lIGluIHRoZW1lTmFtZXNcbiAgICAgIHVubGVzcyB0aGVtZU5hbWUgYW5kIHR5cGVvZiB0aGVtZU5hbWUgaXMgJ3N0cmluZycgYW5kIEBwYWNrYWdlTWFuYWdlci5yZXNvbHZlUGFja2FnZVBhdGgodGhlbWVOYW1lKVxuICAgICAgICBjb25zb2xlLndhcm4oXCJFbmFibGVkIHRoZW1lICcje3RoZW1lTmFtZX0nIGlzIG5vdCBpbnN0YWxsZWQuXCIpXG5cbiAgIyBQdWJsaWM6IEdldCB0aGUgZW5hYmxlZCB0aGVtZSBuYW1lcyBmcm9tIHRoZSBjb25maWcuXG4gICNcbiAgIyBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZW1lIG5hbWVzIGluIHRoZSBvcmRlciB0aGF0IHRoZXkgc2hvdWxkIGJlIGFjdGl2YXRlZC5cbiAgZ2V0RW5hYmxlZFRoZW1lTmFtZXM6IC0+XG4gICAgdGhlbWVOYW1lcyA9IEBjb25maWcuZ2V0KCdjb3JlLnRoZW1lcycpID8gW11cbiAgICB0aGVtZU5hbWVzID0gW3RoZW1lTmFtZXNdIHVubGVzcyBfLmlzQXJyYXkodGhlbWVOYW1lcylcbiAgICB0aGVtZU5hbWVzID0gdGhlbWVOYW1lcy5maWx0ZXIgKHRoZW1lTmFtZSkgPT5cbiAgICAgIGlmIHRoZW1lTmFtZSBhbmQgdHlwZW9mIHRoZW1lTmFtZSBpcyAnc3RyaW5nJ1xuICAgICAgICByZXR1cm4gdHJ1ZSBpZiBAcGFja2FnZU1hbmFnZXIucmVzb2x2ZVBhY2thZ2VQYXRoKHRoZW1lTmFtZSlcbiAgICAgIGZhbHNlXG5cbiAgICAjIFVzZSBhIGJ1aWx0LWluIHN5bnRheCBhbmQgVUkgdGhlbWUgYW55IHRpbWUgdGhlIGNvbmZpZ3VyZWQgdGhlbWVzIGFyZSBub3RcbiAgICAjIGF2YWlsYWJsZS5cbiAgICBpZiB0aGVtZU5hbWVzLmxlbmd0aCA8IDJcbiAgICAgIGJ1aWx0SW5UaGVtZU5hbWVzID0gW1xuICAgICAgICAnYXRvbS1kYXJrLXN5bnRheCdcbiAgICAgICAgJ2F0b20tZGFyay11aSdcbiAgICAgICAgJ2F0b20tbGlnaHQtc3ludGF4J1xuICAgICAgICAnYXRvbS1saWdodC11aSdcbiAgICAgICAgJ2Jhc2UxNi10b21vcnJvdy1kYXJrLXRoZW1lJ1xuICAgICAgICAnYmFzZTE2LXRvbW9ycm93LWxpZ2h0LXRoZW1lJ1xuICAgICAgICAnc29sYXJpemVkLWRhcmstc3ludGF4J1xuICAgICAgICAnc29sYXJpemVkLWxpZ2h0LXN5bnRheCdcbiAgICAgIF1cbiAgICAgIHRoZW1lTmFtZXMgPSBfLmludGVyc2VjdGlvbih0aGVtZU5hbWVzLCBidWlsdEluVGhlbWVOYW1lcylcbiAgICAgIGlmIHRoZW1lTmFtZXMubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhlbWVOYW1lcyA9IFsnYXRvbS1kYXJrLXN5bnRheCcsICdhdG9tLWRhcmstdWknXVxuICAgICAgZWxzZSBpZiB0aGVtZU5hbWVzLmxlbmd0aCBpcyAxXG4gICAgICAgIGlmIF8uZW5kc1dpdGgodGhlbWVOYW1lc1swXSwgJy11aScpXG4gICAgICAgICAgdGhlbWVOYW1lcy51bnNoaWZ0KCdhdG9tLWRhcmstc3ludGF4JylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoZW1lTmFtZXMucHVzaCgnYXRvbS1kYXJrLXVpJylcblxuICAgICMgUmV2ZXJzZSBzbyB0aGUgZmlyc3QgKHRvcCkgdGhlbWUgaXMgbG9hZGVkIGFmdGVyIHRoZSBvdGhlcnMuIFdlIHdhbnRcbiAgICAjIHRoZSBmaXJzdC90b3AgdGhlbWUgdG8gb3ZlcnJpZGUgbGF0ZXIgdGhlbWVzIGluIHRoZSBzdGFjay5cbiAgICB0aGVtZU5hbWVzLnJldmVyc2UoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQcml2YXRlXG4gICMjI1xuXG4gICMgUmVzb2x2ZSBhbmQgYXBwbHkgdGhlIHN0eWxlc2hlZXQgc3BlY2lmaWVkIGJ5IHRoZSBwYXRoLlxuICAjXG4gICMgVGhpcyBzdXBwb3J0cyBib3RoIENTUyBhbmQgTGVzcyBzdHlsc2hlZXRzLlxuICAjXG4gICMgKiBgc3R5bGVzaGVldFBhdGhgIEEge1N0cmluZ30gcGF0aCB0byB0aGUgc3R5bGVzaGVldCB0aGF0IGNhbiBiZSBhbiBhYnNvbHV0ZVxuICAjICAgcGF0aCBvciBhIHJlbGF0aXZlIHBhdGggdGhhdCB3aWxsIGJlIHJlc29sdmVkIGFnYWluc3QgdGhlIGxvYWQgcGF0aC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gcmVtb3ZlIHRoZVxuICAjIHJlcXVpcmVkIHN0eWxlc2hlZXQuXG4gIHJlcXVpcmVTdHlsZXNoZWV0OiAoc3R5bGVzaGVldFBhdGgpIC0+XG4gICAgaWYgZnVsbFBhdGggPSBAcmVzb2x2ZVN0eWxlc2hlZXQoc3R5bGVzaGVldFBhdGgpXG4gICAgICBjb250ZW50ID0gQGxvYWRTdHlsZXNoZWV0KGZ1bGxQYXRoKVxuICAgICAgQGFwcGx5U3R5bGVzaGVldChmdWxsUGF0aCwgY29udGVudClcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCBhIGZpbGUgYXQgcGF0aCAnI3tzdHlsZXNoZWV0UGF0aH0nXCIpXG5cbiAgdW53YXRjaFVzZXJTdHlsZXNoZWV0OiAtPlxuICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHVzZXJTdHlsc2hlZXRTdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIEB1c2VyU3R5bGVzaGVldEZpbGUgPSBudWxsXG4gICAgQHVzZXJTdHlsZVNoZWV0RGlzcG9zYWJsZT8uZGlzcG9zZSgpXG4gICAgQHVzZXJTdHlsZVNoZWV0RGlzcG9zYWJsZSA9IG51bGxcblxuICBsb2FkVXNlclN0eWxlc2hlZXQ6IC0+XG4gICAgQHVud2F0Y2hVc2VyU3R5bGVzaGVldCgpXG5cbiAgICB1c2VyU3R5bGVzaGVldFBhdGggPSBAc3R5bGVNYW5hZ2VyLmdldFVzZXJTdHlsZVNoZWV0UGF0aCgpXG4gICAgcmV0dXJuIHVubGVzcyBmcy5pc0ZpbGVTeW5jKHVzZXJTdHlsZXNoZWV0UGF0aClcblxuICAgIHRyeVxuICAgICAgQHVzZXJTdHlsZXNoZWV0RmlsZSA9IG5ldyBGaWxlKHVzZXJTdHlsZXNoZWV0UGF0aClcbiAgICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICAgIHJlbG9hZFN0eWxlc2hlZXQgPSA9PiBAbG9hZFVzZXJTdHlsZXNoZWV0KClcbiAgICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucy5hZGQoQHVzZXJTdHlsZXNoZWV0RmlsZS5vbkRpZENoYW5nZShyZWxvYWRTdHlsZXNoZWV0KSlcbiAgICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucy5hZGQoQHVzZXJTdHlsZXNoZWV0RmlsZS5vbkRpZFJlbmFtZShyZWxvYWRTdHlsZXNoZWV0KSlcbiAgICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucy5hZGQoQHVzZXJTdHlsZXNoZWV0RmlsZS5vbkRpZERlbGV0ZShyZWxvYWRTdHlsZXNoZWV0KSlcbiAgICBjYXRjaCBlcnJvclxuICAgICAgbWVzc2FnZSA9IFwiXCJcIlxuICAgICAgICBVbmFibGUgdG8gd2F0Y2ggcGF0aDogYCN7cGF0aC5iYXNlbmFtZSh1c2VyU3R5bGVzaGVldFBhdGgpfWAuIE1ha2Ugc3VyZVxuICAgICAgICB5b3UgaGF2ZSBwZXJtaXNzaW9ucyB0byBgI3t1c2VyU3R5bGVzaGVldFBhdGh9YC5cblxuICAgICAgICBPbiBsaW51eCB0aGVyZSBhcmUgY3VycmVudGx5IHByb2JsZW1zIHdpdGggd2F0Y2ggc2l6ZXMuIFNlZVxuICAgICAgICBbdGhpcyBkb2N1bWVudF1bd2F0Y2hlc10gZm9yIG1vcmUgaW5mby5cbiAgICAgICAgW3dhdGNoZXNdOmh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi9tYXN0ZXIvZG9jcy9idWlsZC1pbnN0cnVjdGlvbnMvbGludXgubWQjdHlwZWVycm9yLXVuYWJsZS10by13YXRjaC1wYXRoXG4gICAgICBcIlwiXCJcbiAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZEVycm9yKG1lc3NhZ2UsIGRpc21pc3NhYmxlOiB0cnVlKVxuXG4gICAgdHJ5XG4gICAgICB1c2VyU3R5bGVzaGVldENvbnRlbnRzID0gQGxvYWRTdHlsZXNoZWV0KHVzZXJTdHlsZXNoZWV0UGF0aCwgdHJ1ZSlcbiAgICBjYXRjaFxuICAgICAgcmV0dXJuXG5cbiAgICBAdXNlclN0eWxlU2hlZXREaXNwb3NhYmxlID0gQHN0eWxlTWFuYWdlci5hZGRTdHlsZVNoZWV0KHVzZXJTdHlsZXNoZWV0Q29udGVudHMsIHNvdXJjZVBhdGg6IHVzZXJTdHlsZXNoZWV0UGF0aCwgcHJpb3JpdHk6IDIpXG5cbiAgbG9hZEJhc2VTdHlsZXNoZWV0czogLT5cbiAgICBAcmVsb2FkQmFzZVN0eWxlc2hlZXRzKClcblxuICByZWxvYWRCYXNlU3R5bGVzaGVldHM6IC0+XG4gICAgQHJlcXVpcmVTdHlsZXNoZWV0KCcuLi9zdGF0aWMvYXRvbScpXG4gICAgaWYgbmF0aXZlU3R5bGVzaGVldFBhdGggPSBmcy5yZXNvbHZlT25Mb2FkUGF0aChwcm9jZXNzLnBsYXRmb3JtLCBbJ2NzcycsICdsZXNzJ10pXG4gICAgICBAcmVxdWlyZVN0eWxlc2hlZXQobmF0aXZlU3R5bGVzaGVldFBhdGgpXG5cbiAgc3R5bGVzaGVldEVsZW1lbnRGb3JJZDogKGlkKSAtPlxuICAgIGRvY3VtZW50LmhlYWQucXVlcnlTZWxlY3RvcihcImF0b20tc3R5bGVzIHN0eWxlW3NvdXJjZS1wYXRoPVxcXCIje2lkfVxcXCJdXCIpXG5cbiAgcmVzb2x2ZVN0eWxlc2hlZXQ6IChzdHlsZXNoZWV0UGF0aCkgLT5cbiAgICBpZiBwYXRoLmV4dG5hbWUoc3R5bGVzaGVldFBhdGgpLmxlbmd0aCA+IDBcbiAgICAgIGZzLnJlc29sdmVPbkxvYWRQYXRoKHN0eWxlc2hlZXRQYXRoKVxuICAgIGVsc2VcbiAgICAgIGZzLnJlc29sdmVPbkxvYWRQYXRoKHN0eWxlc2hlZXRQYXRoLCBbJ2NzcycsICdsZXNzJ10pXG5cbiAgbG9hZFN0eWxlc2hlZXQ6IChzdHlsZXNoZWV0UGF0aCwgaW1wb3J0RmFsbGJhY2tWYXJpYWJsZXMpIC0+XG4gICAgaWYgcGF0aC5leHRuYW1lKHN0eWxlc2hlZXRQYXRoKSBpcyAnLmxlc3MnXG4gICAgICBAbG9hZExlc3NTdHlsZXNoZWV0KHN0eWxlc2hlZXRQYXRoLCBpbXBvcnRGYWxsYmFja1ZhcmlhYmxlcylcbiAgICBlbHNlXG4gICAgICBmcy5yZWFkRmlsZVN5bmMoc3R5bGVzaGVldFBhdGgsICd1dGY4JylcblxuICBsb2FkTGVzc1N0eWxlc2hlZXQ6IChsZXNzU3R5bGVzaGVldFBhdGgsIGltcG9ydEZhbGxiYWNrVmFyaWFibGVzPWZhbHNlKSAtPlxuICAgIHVubGVzcyBAbGVzc0NhY2hlP1xuICAgICAgTGVzc0NvbXBpbGVDYWNoZSA9IHJlcXVpcmUgJy4vbGVzcy1jb21waWxlLWNhY2hlJ1xuICAgICAgQGxlc3NDYWNoZSA9IG5ldyBMZXNzQ29tcGlsZUNhY2hlKHtAcmVzb3VyY2VQYXRoLCBpbXBvcnRQYXRoczogQGdldEltcG9ydFBhdGhzKCl9KVxuXG4gICAgdHJ5XG4gICAgICBpZiBpbXBvcnRGYWxsYmFja1ZhcmlhYmxlc1xuICAgICAgICBiYXNlVmFySW1wb3J0cyA9IFwiXCJcIlxuICAgICAgICBAaW1wb3J0IFwidmFyaWFibGVzL3VpLXZhcmlhYmxlc1wiO1xuICAgICAgICBAaW1wb3J0IFwidmFyaWFibGVzL3N5bnRheC12YXJpYWJsZXNcIjtcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGxlc3MgPSBmcy5yZWFkRmlsZVN5bmMobGVzc1N0eWxlc2hlZXRQYXRoLCAndXRmOCcpXG4gICAgICAgIEBsZXNzQ2FjaGUuY3NzRm9yRmlsZShsZXNzU3R5bGVzaGVldFBhdGgsIFtiYXNlVmFySW1wb3J0cywgbGVzc10uam9pbignXFxuJykpXG4gICAgICBlbHNlXG4gICAgICAgIEBsZXNzQ2FjaGUucmVhZChsZXNzU3R5bGVzaGVldFBhdGgpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGVycm9yLmxlc3MgPSB0cnVlXG4gICAgICBpZiBlcnJvci5saW5lP1xuICAgICAgICAjIEFkanVzdCBsaW5lIG51bWJlcnMgZm9yIGltcG9ydCBmYWxsYmFja3NcbiAgICAgICAgZXJyb3IubGluZSAtPSAyIGlmIGltcG9ydEZhbGxiYWNrVmFyaWFibGVzXG5cbiAgICAgICAgbWVzc2FnZSA9IFwiRXJyb3IgY29tcGlsaW5nIExlc3Mgc3R5bGVzaGVldDogYCN7bGVzc1N0eWxlc2hlZXRQYXRofWBcIlxuICAgICAgICBkZXRhaWwgPSBcIlwiXCJcbiAgICAgICAgICBMaW5lIG51bWJlcjogI3tlcnJvci5saW5lfVxuICAgICAgICAgICN7ZXJyb3IubWVzc2FnZX1cbiAgICAgICAgXCJcIlwiXG4gICAgICBlbHNlXG4gICAgICAgIG1lc3NhZ2UgPSBcIkVycm9yIGxvYWRpbmcgTGVzcyBzdHlsZXNoZWV0OiBgI3tsZXNzU3R5bGVzaGVldFBhdGh9YFwiXG4gICAgICAgIGRldGFpbCA9IGVycm9yLm1lc3NhZ2VcblxuICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRXJyb3IobWVzc2FnZSwge2RldGFpbCwgZGlzbWlzc2FibGU6IHRydWV9KVxuICAgICAgdGhyb3cgZXJyb3JcblxuICByZW1vdmVTdHlsZXNoZWV0OiAoc3R5bGVzaGVldFBhdGgpIC0+XG4gICAgQHN0eWxlU2hlZXREaXNwb3NhYmxlc0J5U291cmNlUGF0aFtzdHlsZXNoZWV0UGF0aF0/LmRpc3Bvc2UoKVxuXG4gIGFwcGx5U3R5bGVzaGVldDogKHBhdGgsIHRleHQpIC0+XG4gICAgQHN0eWxlU2hlZXREaXNwb3NhYmxlc0J5U291cmNlUGF0aFtwYXRoXSA9IEBzdHlsZU1hbmFnZXIuYWRkU3R5bGVTaGVldCh0ZXh0LCBzb3VyY2VQYXRoOiBwYXRoKVxuXG4gIHN0cmluZ1RvSWQ6IChzdHJpbmcpIC0+XG4gICAgc3RyaW5nLnJlcGxhY2UoL1xcXFwvZywgJy8nKVxuXG4gIGFjdGl2YXRlVGhlbWVzOiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgIyBAY29uZmlnLm9ic2VydmUgcnVucyB0aGUgY2FsbGJhY2sgb25jZSwgdGhlbiBvbiBzdWJzZXF1ZW50IGNoYW5nZXMuXG4gICAgICBAY29uZmlnLm9ic2VydmUgJ2NvcmUudGhlbWVzJywgPT5cbiAgICAgICAgQGRlYWN0aXZhdGVUaGVtZXMoKVxuXG4gICAgICAgIEB3YXJuRm9yTm9uRXhpc3RlbnRUaGVtZXMoKVxuXG4gICAgICAgIEByZWZyZXNoTGVzc0NhY2hlKCkgIyBVcGRhdGUgY2FjaGUgZm9yIHBhY2thZ2VzIGluIGNvcmUudGhlbWVzIGNvbmZpZ1xuXG4gICAgICAgIHByb21pc2VzID0gW11cbiAgICAgICAgZm9yIHRoZW1lTmFtZSBpbiBAZ2V0RW5hYmxlZFRoZW1lTmFtZXMoKVxuICAgICAgICAgIGlmIEBwYWNrYWdlTWFuYWdlci5yZXNvbHZlUGFja2FnZVBhdGgodGhlbWVOYW1lKVxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChAcGFja2FnZU1hbmFnZXIuYWN0aXZhdGVQYWNrYWdlKHRoZW1lTmFtZSkpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGFjdGl2YXRlIHRoZW1lICcje3RoZW1lTmFtZX0nIGJlY2F1c2UgaXQgaXNuJ3QgaW5zdGFsbGVkLlwiKVxuXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuID0+XG4gICAgICAgICAgQGFkZEFjdGl2ZVRoZW1lQ2xhc3NlcygpXG4gICAgICAgICAgQHJlZnJlc2hMZXNzQ2FjaGUoKSAjIFVwZGF0ZSBjYWNoZSBhZ2FpbiBub3cgdGhhdCBAZ2V0QWN0aXZlVGhlbWVzKCkgaXMgcG9wdWxhdGVkXG4gICAgICAgICAgQGxvYWRVc2VyU3R5bGVzaGVldCgpXG4gICAgICAgICAgQHJlbG9hZEJhc2VTdHlsZXNoZWV0cygpXG4gICAgICAgICAgQGluaXRpYWxMb2FkQ29tcGxldGUgPSB0cnVlXG4gICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1hY3RpdmUtdGhlbWVzJ1xuICAgICAgICAgIHJlc29sdmUoKVxuXG4gIGRlYWN0aXZhdGVUaGVtZXM6IC0+XG4gICAgQHJlbW92ZUFjdGl2ZVRoZW1lQ2xhc3NlcygpXG4gICAgQHVud2F0Y2hVc2VyU3R5bGVzaGVldCgpXG4gICAgQHBhY2thZ2VNYW5hZ2VyLmRlYWN0aXZhdGVQYWNrYWdlKHBhY2submFtZSkgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgbnVsbFxuXG4gIGlzSW5pdGlhbExvYWRDb21wbGV0ZTogLT4gQGluaXRpYWxMb2FkQ29tcGxldGVcblxuICBhZGRBY3RpdmVUaGVtZUNsYXNzZXM6IC0+XG4gICAgaWYgd29ya3NwYWNlRWxlbWVudCA9IEB2aWV3UmVnaXN0cnkuZ2V0VmlldyhAd29ya3NwYWNlKVxuICAgICAgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgICAgIHdvcmtzcGFjZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRoZW1lLSN7cGFjay5uYW1lfVwiKVxuICAgICAgcmV0dXJuXG5cbiAgcmVtb3ZlQWN0aXZlVGhlbWVDbGFzc2VzOiAtPlxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBAdmlld1JlZ2lzdHJ5LmdldFZpZXcoQHdvcmtzcGFjZSlcbiAgICBmb3IgcGFjayBpbiBAZ2V0QWN0aXZlVGhlbWVzKClcbiAgICAgIHdvcmtzcGFjZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInRoZW1lLSN7cGFjay5uYW1lfVwiKVxuICAgIHJldHVyblxuXG4gIHJlZnJlc2hMZXNzQ2FjaGU6IC0+XG4gICAgQGxlc3NDYWNoZT8uc2V0SW1wb3J0UGF0aHMoQGdldEltcG9ydFBhdGhzKCkpXG5cbiAgZ2V0SW1wb3J0UGF0aHM6IC0+XG4gICAgYWN0aXZlVGhlbWVzID0gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgaWYgYWN0aXZlVGhlbWVzLmxlbmd0aCA+IDBcbiAgICAgIHRoZW1lUGF0aHMgPSAodGhlbWUuZ2V0U3R5bGVzaGVldHNQYXRoKCkgZm9yIHRoZW1lIGluIGFjdGl2ZVRoZW1lcyB3aGVuIHRoZW1lKVxuICAgIGVsc2VcbiAgICAgIHRoZW1lUGF0aHMgPSBbXVxuICAgICAgZm9yIHRoZW1lTmFtZSBpbiBAZ2V0RW5hYmxlZFRoZW1lTmFtZXMoKVxuICAgICAgICBpZiB0aGVtZVBhdGggPSBAcGFja2FnZU1hbmFnZXIucmVzb2x2ZVBhY2thZ2VQYXRoKHRoZW1lTmFtZSlcbiAgICAgICAgICBkZXByZWNhdGVkUGF0aCA9IHBhdGguam9pbih0aGVtZVBhdGgsICdzdHlsZXNoZWV0cycpXG4gICAgICAgICAgaWYgZnMuaXNEaXJlY3RvcnlTeW5jKGRlcHJlY2F0ZWRQYXRoKVxuICAgICAgICAgICAgdGhlbWVQYXRocy5wdXNoKGRlcHJlY2F0ZWRQYXRoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoZW1lUGF0aHMucHVzaChwYXRoLmpvaW4odGhlbWVQYXRoLCAnc3R5bGVzJykpXG5cbiAgICB0aGVtZVBhdGhzLmZpbHRlciAodGhlbWVQYXRoKSAtPiBmcy5pc0RpcmVjdG9yeVN5bmModGhlbWVQYXRoKVxuIl19
