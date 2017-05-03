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
      var escapedId;
      escapedId = id.replace(/\\/g, '\\\\');
      return document.head.querySelector("atom-styles style[source-path=\"" + escapedId + "\"]");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90aGVtZS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBaUMsT0FBQSxDQUFRLFdBQVIsQ0FBakMsRUFBQyxxQkFBRCxFQUFVOztFQUNULE9BQVEsT0FBQSxDQUFRLGFBQVI7O0VBQ1QsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUtMLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxzQkFBQyxHQUFEO01BQUUsSUFBQyxDQUFBLHFCQUFBLGdCQUFnQixJQUFDLENBQUEsbUJBQUEsY0FBYyxJQUFDLENBQUEsb0JBQUEsZUFBZSxJQUFDLENBQUEsZUFBQSxVQUFVLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLG1CQUFBLGNBQWMsSUFBQyxDQUFBLDBCQUFBLHFCQUFxQixJQUFDLENBQUEsbUJBQUE7TUFDdkgsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLGlDQUFELEdBQXFDO01BQ3JDLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsbUJBQUQsR0FBdUI7TUFDdkIsSUFBQyxDQUFBLGNBQWMsQ0FBQyx3QkFBaEIsQ0FBeUMsSUFBekMsRUFBK0MsQ0FBQyxPQUFELENBQS9DO01BQ0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyw0QkFBaEIsQ0FBNkMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUMzQyxLQUFDLENBQUEsdUJBQUQsQ0FBeUIsU0FBQTttQkFBRyxLQUFDLENBQUEsY0FBYyxDQUFDLDhCQUFoQixDQUFBO1VBQUgsQ0FBekI7UUFEMkM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdDO0lBTlc7OztBQVNiOzs7OzJCQVFBLHVCQUFBLEdBQXlCLFNBQUMsUUFBRDthQUN2QixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSwwQkFBWixFQUF3QyxRQUF4QztJQUR1Qjs7O0FBR3pCOzs7OzJCQUlBLGlCQUFBLEdBQW1CLFNBQUE7YUFFakIsSUFBQyxDQUFBLGNBQUQsQ0FBQTtJQUZpQjs7O0FBSW5COzs7OzJCQUtBLG1CQUFBLEdBQXFCLFNBQUE7QUFDbkIsVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQUEsS0FBSyxDQUFDO0FBQU47O0lBRG1COzsyQkFJckIsZUFBQSxHQUFpQixTQUFBO0FBQ2YsVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7WUFBMEQsSUFBSSxDQUFDLE9BQUwsQ0FBQTt1QkFBMUQ7O0FBQUE7O0lBRGU7OztBQUdqQjs7OzsyQkFLQSxtQkFBQSxHQUFxQixTQUFBO0FBQ25CLFVBQUE7QUFBQTtBQUFBO1dBQUEsc0NBQUE7O3FCQUFBLEtBQUssQ0FBQztBQUFOOztJQURtQjs7MkJBSXJCLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7QUFBQTtBQUFBO1dBQUEsc0NBQUE7O1lBQTBELElBQUksQ0FBQyxPQUFMLENBQUE7dUJBQTFEOztBQUFBOztJQURlOzsyQkFHakIsZ0JBQUEsR0FBa0IsU0FBQTthQUFHLElBQUMsQ0FBQSxjQUFELENBQUE7SUFBSDs7O0FBRWxCOzs7OzJCQUlBLHdCQUFBLEdBQTBCLFNBQUE7QUFDeEIsVUFBQTtNQUFBLFVBQUEsNERBQTBDO01BQzFDLElBQUEsQ0FBaUMsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxVQUFWLENBQWpDO1FBQUEsVUFBQSxHQUFhLENBQUMsVUFBRCxFQUFiOztBQUNBO1dBQUEsNENBQUE7O1FBQ0UsSUFBQSxDQUFBLENBQU8sU0FBQSxJQUFjLE9BQU8sU0FBUCxLQUFvQixRQUFsQyxJQUErQyxJQUFDLENBQUEsY0FBYyxDQUFDLGtCQUFoQixDQUFtQyxTQUFuQyxDQUF0RCxDQUFBO3VCQUNFLE9BQU8sQ0FBQyxJQUFSLENBQWEsaUJBQUEsR0FBa0IsU0FBbEIsR0FBNEIscUJBQXpDLEdBREY7U0FBQSxNQUFBOytCQUFBOztBQURGOztJQUh3Qjs7MkJBVTFCLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLFVBQUEsNERBQTBDO01BQzFDLElBQUEsQ0FBaUMsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxVQUFWLENBQWpDO1FBQUEsVUFBQSxHQUFhLENBQUMsVUFBRCxFQUFiOztNQUNBLFVBQUEsR0FBYSxVQUFVLENBQUMsTUFBWCxDQUFrQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsU0FBRDtVQUM3QixJQUFHLFNBQUEsSUFBYyxPQUFPLFNBQVAsS0FBb0IsUUFBckM7WUFDRSxJQUFlLEtBQUMsQ0FBQSxjQUFjLENBQUMsa0JBQWhCLENBQW1DLFNBQW5DLENBQWY7QUFBQSxxQkFBTyxLQUFQO2FBREY7O2lCQUVBO1FBSDZCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFsQjtNQU9iLElBQUcsVUFBVSxDQUFDLE1BQVgsR0FBb0IsQ0FBdkI7UUFDRSxpQkFBQSxHQUFvQixDQUNsQixrQkFEa0IsRUFFbEIsY0FGa0IsRUFHbEIsbUJBSGtCLEVBSWxCLGVBSmtCLEVBS2xCLDRCQUxrQixFQU1sQiw2QkFOa0IsRUFPbEIsdUJBUGtCLEVBUWxCLHdCQVJrQjtRQVVwQixVQUFBLEdBQWEsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxVQUFmLEVBQTJCLGlCQUEzQjtRQUNiLElBQUcsVUFBVSxDQUFDLE1BQVgsS0FBcUIsQ0FBeEI7VUFDRSxVQUFBLEdBQWEsQ0FBQyxrQkFBRCxFQUFxQixjQUFyQixFQURmO1NBQUEsTUFFSyxJQUFHLFVBQVUsQ0FBQyxNQUFYLEtBQXFCLENBQXhCO1VBQ0gsSUFBRyxDQUFDLENBQUMsUUFBRixDQUFXLFVBQVcsQ0FBQSxDQUFBLENBQXRCLEVBQTBCLEtBQTFCLENBQUg7WUFDRSxVQUFVLENBQUMsT0FBWCxDQUFtQixrQkFBbkIsRUFERjtXQUFBLE1BQUE7WUFHRSxVQUFVLENBQUMsSUFBWCxDQUFnQixjQUFoQixFQUhGO1dBREc7U0FkUDs7YUFzQkEsVUFBVSxDQUFDLE9BQVgsQ0FBQTtJQWhDb0I7OztBQWtDdEI7Ozs7MkJBYUEsaUJBQUEsR0FBbUIsU0FBQyxjQUFEO0FBQ2pCLFVBQUE7TUFBQSxJQUFHLFFBQUEsR0FBVyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsY0FBbkIsQ0FBZDtRQUNFLE9BQUEsR0FBVSxJQUFDLENBQUEsY0FBRCxDQUFnQixRQUFoQjtlQUNWLElBQUMsQ0FBQSxlQUFELENBQWlCLFFBQWpCLEVBQTJCLE9BQTNCLEVBRkY7T0FBQSxNQUFBO0FBSUUsY0FBVSxJQUFBLEtBQUEsQ0FBTSxpQ0FBQSxHQUFrQyxjQUFsQyxHQUFpRCxHQUF2RCxFQUpaOztJQURpQjs7MkJBT25CLHFCQUFBLEdBQXVCLFNBQUE7QUFDckIsVUFBQTs7WUFBMkIsQ0FBRSxPQUE3QixDQUFBOztNQUNBLElBQUMsQ0FBQSwwQkFBRCxHQUE4QjtNQUM5QixJQUFDLENBQUEsa0JBQUQsR0FBc0I7O1lBQ0csQ0FBRSxPQUEzQixDQUFBOzthQUNBLElBQUMsQ0FBQSx3QkFBRCxHQUE0QjtJQUxQOzsyQkFPdkIsa0JBQUEsR0FBb0IsU0FBQTtBQUNsQixVQUFBO01BQUEsSUFBQyxDQUFBLHFCQUFELENBQUE7TUFFQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsWUFBWSxDQUFDLHFCQUFkLENBQUE7TUFDckIsSUFBQSxDQUFjLEVBQUUsQ0FBQyxVQUFILENBQWMsa0JBQWQsQ0FBZDtBQUFBLGVBQUE7O0FBRUE7UUFDRSxJQUFDLENBQUEsa0JBQUQsR0FBMEIsSUFBQSxJQUFBLENBQUssa0JBQUw7UUFDMUIsSUFBQyxDQUFBLDBCQUFELEdBQWtDLElBQUEsbUJBQUEsQ0FBQTtRQUNsQyxnQkFBQSxHQUFtQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxrQkFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBQ25CLElBQUMsQ0FBQSwwQkFBMEIsQ0FBQyxHQUE1QixDQUFnQyxJQUFDLENBQUEsa0JBQWtCLENBQUMsV0FBcEIsQ0FBZ0MsZ0JBQWhDLENBQWhDO1FBQ0EsSUFBQyxDQUFBLDBCQUEwQixDQUFDLEdBQTVCLENBQWdDLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxXQUFwQixDQUFnQyxnQkFBaEMsQ0FBaEM7UUFDQSxJQUFDLENBQUEsMEJBQTBCLENBQUMsR0FBNUIsQ0FBZ0MsSUFBQyxDQUFBLGtCQUFrQixDQUFDLFdBQXBCLENBQWdDLGdCQUFoQyxDQUFoQyxFQU5GO09BQUEsY0FBQTtRQU9NO1FBQ0osT0FBQSxHQUFVLHlCQUFBLEdBQ2dCLENBQUMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxrQkFBZCxDQUFELENBRGhCLEdBQ21ELHlDQURuRCxHQUVtQixrQkFGbkIsR0FFc0M7UUFNaEQsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFFBQXJCLENBQThCLE9BQTlCLEVBQXVDO1VBQUEsV0FBQSxFQUFhLElBQWI7U0FBdkMsRUFoQkY7O0FBa0JBO1FBQ0Usc0JBQUEsR0FBeUIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0Isa0JBQWhCLEVBQW9DLElBQXBDLEVBRDNCO09BQUEsY0FBQTtBQUdFLGVBSEY7O2FBS0EsSUFBQyxDQUFBLHdCQUFELEdBQTRCLElBQUMsQ0FBQSxZQUFZLENBQUMsYUFBZCxDQUE0QixzQkFBNUIsRUFBb0Q7UUFBQSxVQUFBLEVBQVksa0JBQVo7UUFBZ0MsUUFBQSxFQUFVLENBQTFDO09BQXBEO0lBN0JWOzsyQkErQnBCLG1CQUFBLEdBQXFCLFNBQUE7YUFDbkIsSUFBQyxDQUFBLHFCQUFELENBQUE7SUFEbUI7OzJCQUdyQixxQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFVBQUE7TUFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsZ0JBQW5CO01BQ0EsSUFBRyxvQkFBQSxHQUF1QixFQUFFLENBQUMsaUJBQUgsQ0FBcUIsT0FBTyxDQUFDLFFBQTdCLEVBQXVDLENBQUMsS0FBRCxFQUFRLE1BQVIsQ0FBdkMsQ0FBMUI7ZUFDRSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsb0JBQW5CLEVBREY7O0lBRnFCOzsyQkFLdkIsc0JBQUEsR0FBd0IsU0FBQyxFQUFEO0FBQ3RCLFVBQUE7TUFBQSxTQUFBLEdBQVksRUFBRSxDQUFDLE9BQUgsQ0FBVyxLQUFYLEVBQWtCLE1BQWxCO2FBQ1osUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFkLENBQTRCLGtDQUFBLEdBQW1DLFNBQW5DLEdBQTZDLEtBQXpFO0lBRnNCOzsyQkFJeEIsaUJBQUEsR0FBbUIsU0FBQyxjQUFEO01BQ2pCLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxjQUFiLENBQTRCLENBQUMsTUFBN0IsR0FBc0MsQ0FBekM7ZUFDRSxFQUFFLENBQUMsaUJBQUgsQ0FBcUIsY0FBckIsRUFERjtPQUFBLE1BQUE7ZUFHRSxFQUFFLENBQUMsaUJBQUgsQ0FBcUIsY0FBckIsRUFBcUMsQ0FBQyxLQUFELEVBQVEsTUFBUixDQUFyQyxFQUhGOztJQURpQjs7MkJBTW5CLGNBQUEsR0FBZ0IsU0FBQyxjQUFELEVBQWlCLHVCQUFqQjtNQUNkLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxjQUFiLENBQUEsS0FBZ0MsT0FBbkM7ZUFDRSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsY0FBcEIsRUFBb0MsdUJBQXBDLEVBREY7T0FBQSxNQUFBO2VBR0UsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsY0FBaEIsRUFBZ0MsTUFBaEMsRUFIRjs7SUFEYzs7MkJBTWhCLGtCQUFBLEdBQW9CLFNBQUMsa0JBQUQsRUFBcUIsdUJBQXJCO0FBQ2xCLFVBQUE7O1FBRHVDLDBCQUF3Qjs7TUFDL0QsSUFBTyxzQkFBUDtRQUNFLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxzQkFBUjtRQUNuQixJQUFDLENBQUEsU0FBRCxHQUFpQixJQUFBLGdCQUFBLENBQWlCO1VBQUUsY0FBRCxJQUFDLENBQUEsWUFBRjtVQUFnQixXQUFBLEVBQWEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUE3QjtTQUFqQixFQUZuQjs7QUFJQTtRQUNFLElBQUcsdUJBQUg7VUFDRSxjQUFBLEdBQWlCO1VBSWpCLElBQUEsR0FBTyxFQUFFLENBQUMsWUFBSCxDQUFnQixrQkFBaEIsRUFBb0MsTUFBcEM7aUJBQ1AsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFYLENBQXNCLGtCQUF0QixFQUEwQyxDQUFDLGNBQUQsRUFBaUIsSUFBakIsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixJQUE1QixDQUExQyxFQU5GO1NBQUEsTUFBQTtpQkFRRSxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0Isa0JBQWhCLEVBUkY7U0FERjtPQUFBLGNBQUE7UUFVTTtRQUNKLEtBQUssQ0FBQyxJQUFOLEdBQWE7UUFDYixJQUFHLGtCQUFIO1VBRUUsSUFBbUIsdUJBQW5CO1lBQUEsS0FBSyxDQUFDLElBQU4sSUFBYyxFQUFkOztVQUVBLE9BQUEsR0FBVSxvQ0FBQSxHQUFxQyxrQkFBckMsR0FBd0Q7VUFDbEUsTUFBQSxHQUFTLGVBQUEsR0FDUSxLQUFLLENBQUMsSUFEZCxHQUNtQixJQURuQixHQUVMLEtBQUssQ0FBQyxRQVBaO1NBQUEsTUFBQTtVQVVFLE9BQUEsR0FBVSxrQ0FBQSxHQUFtQyxrQkFBbkMsR0FBc0Q7VUFDaEUsTUFBQSxHQUFTLEtBQUssQ0FBQyxRQVhqQjs7UUFhQSxJQUFDLENBQUEsbUJBQW1CLENBQUMsUUFBckIsQ0FBOEIsT0FBOUIsRUFBdUM7VUFBQyxRQUFBLE1BQUQ7VUFBUyxXQUFBLEVBQWEsSUFBdEI7U0FBdkM7QUFDQSxjQUFNLE1BMUJSOztJQUxrQjs7MkJBaUNwQixnQkFBQSxHQUFrQixTQUFDLGNBQUQ7QUFDaEIsVUFBQTsyRkFBa0QsQ0FBRSxPQUFwRCxDQUFBO0lBRGdCOzsyQkFHbEIsZUFBQSxHQUFpQixTQUFDLElBQUQsRUFBTyxJQUFQO2FBQ2YsSUFBQyxDQUFBLGlDQUFrQyxDQUFBLElBQUEsQ0FBbkMsR0FBMkMsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLElBQTVCLEVBQWtDO1FBQUEsVUFBQSxFQUFZLElBQVo7T0FBbEM7SUFENUI7OzJCQUdqQixjQUFBLEdBQWdCLFNBQUE7YUFDVixJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtpQkFFVixLQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsYUFBaEIsRUFBK0IsU0FBQTtBQUM3QixnQkFBQTtZQUFBLEtBQUMsQ0FBQSxnQkFBRCxDQUFBO1lBRUEsS0FBQyxDQUFBLHdCQUFELENBQUE7WUFFQSxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtZQUVBLFFBQUEsR0FBVztBQUNYO0FBQUEsaUJBQUEsc0NBQUE7O2NBQ0UsSUFBRyxLQUFDLENBQUEsY0FBYyxDQUFDLGtCQUFoQixDQUFtQyxTQUFuQyxDQUFIO2dCQUNFLFFBQVEsQ0FBQyxJQUFULENBQWMsS0FBQyxDQUFBLGNBQWMsQ0FBQyxlQUFoQixDQUFnQyxTQUFoQyxDQUFkLEVBREY7ZUFBQSxNQUFBO2dCQUdFLE9BQU8sQ0FBQyxJQUFSLENBQWEsNEJBQUEsR0FBNkIsU0FBN0IsR0FBdUMsK0JBQXBELEVBSEY7O0FBREY7bUJBTUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxRQUFaLENBQXFCLENBQUMsSUFBdEIsQ0FBMkIsU0FBQTtjQUN6QixLQUFDLENBQUEscUJBQUQsQ0FBQTtjQUNBLEtBQUMsQ0FBQSxnQkFBRCxDQUFBO2NBQ0EsS0FBQyxDQUFBLGtCQUFELENBQUE7Y0FDQSxLQUFDLENBQUEscUJBQUQsQ0FBQTtjQUNBLEtBQUMsQ0FBQSxtQkFBRCxHQUF1QjtjQUN2QixLQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYywwQkFBZDtxQkFDQSxPQUFBLENBQUE7WUFQeUIsQ0FBM0I7VUFkNkIsQ0FBL0I7UUFGVTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUjtJQURVOzsyQkEwQmhCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLElBQUMsQ0FBQSx3QkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLHFCQUFELENBQUE7QUFDQTtBQUFBLFdBQUEsc0NBQUE7O1FBQUEsSUFBQyxDQUFBLGNBQWMsQ0FBQyxpQkFBaEIsQ0FBa0MsSUFBSSxDQUFDLElBQXZDO0FBQUE7YUFDQTtJQUpnQjs7MkJBTWxCLHFCQUFBLEdBQXVCLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7MkJBRXZCLHFCQUFBLEdBQXVCLFNBQUE7QUFDckIsVUFBQTtNQUFBLElBQUcsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLENBQXNCLElBQUMsQ0FBQSxTQUF2QixDQUF0QjtBQUNFO0FBQUEsYUFBQSxzQ0FBQTs7VUFDRSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBM0IsQ0FBK0IsUUFBQSxHQUFTLElBQUksQ0FBQyxJQUE3QztBQURGLFNBREY7O0lBRHFCOzsyQkFNdkIsd0JBQUEsR0FBMEIsU0FBQTtBQUN4QixVQUFBO01BQUEsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLFlBQVksQ0FBQyxPQUFkLENBQXNCLElBQUMsQ0FBQSxTQUF2QjtBQUNuQjtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQTNCLENBQWtDLFFBQUEsR0FBUyxJQUFJLENBQUMsSUFBaEQ7QUFERjtJQUZ3Qjs7MkJBTTFCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTttREFBVSxDQUFFLGNBQVosQ0FBMkIsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUEzQjtJQURnQjs7MkJBR2xCLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxZQUFBLEdBQWUsSUFBQyxDQUFBLGVBQUQsQ0FBQTtNQUNmLElBQUcsWUFBWSxDQUFDLE1BQWIsR0FBc0IsQ0FBekI7UUFDRSxVQUFBOztBQUFjO2VBQUEsOENBQUE7O2dCQUEwRDsyQkFBMUQsS0FBSyxDQUFDLGtCQUFOLENBQUE7O0FBQUE7O2FBRGhCO09BQUEsTUFBQTtRQUdFLFVBQUEsR0FBYTtBQUNiO0FBQUEsYUFBQSxzQ0FBQTs7VUFDRSxJQUFHLFNBQUEsR0FBWSxJQUFDLENBQUEsY0FBYyxDQUFDLGtCQUFoQixDQUFtQyxTQUFuQyxDQUFmO1lBQ0UsY0FBQSxHQUFpQixJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsYUFBckI7WUFDakIsSUFBRyxFQUFFLENBQUMsZUFBSCxDQUFtQixjQUFuQixDQUFIO2NBQ0UsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsY0FBaEIsRUFERjthQUFBLE1BQUE7Y0FHRSxVQUFVLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsUUFBckIsQ0FBaEIsRUFIRjthQUZGOztBQURGLFNBSkY7O2FBWUEsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsU0FBQyxTQUFEO2VBQWUsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsU0FBbkI7TUFBZixDQUFsQjtJQWRjOzs7OztBQTNSbEIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG57RmlsZX0gPSByZXF1aXJlICdwYXRod2F0Y2hlcidcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxuIyBFeHRlbmRlZDogSGFuZGxlcyBsb2FkaW5nIGFuZCBhY3RpdmF0aW5nIGF2YWlsYWJsZSB0aGVtZXMuXG4jXG4jIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20udGhlbWVzYCBnbG9iYWwuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUaGVtZU1hbmFnZXJcbiAgY29uc3RydWN0b3I6ICh7QHBhY2thZ2VNYW5hZ2VyLCBAcmVzb3VyY2VQYXRoLCBAY29uZmlnRGlyUGF0aCwgQHNhZmVNb2RlLCBAY29uZmlnLCBAc3R5bGVNYW5hZ2VyLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQHZpZXdSZWdpc3RyeX0pIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdHlsZVNoZWV0RGlzcG9zYWJsZXNCeVNvdXJjZVBhdGggPSB7fVxuICAgIEBsZXNzQ2FjaGUgPSBudWxsXG4gICAgQGluaXRpYWxMb2FkQ29tcGxldGUgPSBmYWxzZVxuICAgIEBwYWNrYWdlTWFuYWdlci5yZWdpc3RlclBhY2thZ2VBY3RpdmF0b3IodGhpcywgWyd0aGVtZSddKVxuICAgIEBwYWNrYWdlTWFuYWdlci5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzID0+XG4gICAgICBAb25EaWRDaGFuZ2VBY3RpdmVUaGVtZXMgPT4gQHBhY2thZ2VNYW5hZ2VyLnJlbG9hZEFjdGl2ZVBhY2thZ2VTdHlsZVNoZWV0cygpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIEVzc2VudGlhbDogSW52b2tlIGBjYWxsYmFja2Agd2hlbiBzdHlsZSBzaGVldCBjaGFuZ2VzIGFzc29jaWF0ZWQgd2l0aFxuICAjIHVwZGF0aW5nIHRoZSBsaXN0IG9mIGFjdGl2ZSB0aGVtZXMgaGF2ZSBjb21wbGV0ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICBvbkRpZENoYW5nZUFjdGl2ZVRoZW1lczogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWFjdGl2ZS10aGVtZXMnLCBjYWxsYmFja1xuXG4gICMjI1xuICBTZWN0aW9uOiBBY2Nlc3NpbmcgQXZhaWxhYmxlIFRoZW1lc1xuICAjIyNcblxuICBnZXRBdmFpbGFibGVOYW1lczogLT5cbiAgICAjIFRPRE86IE1heWJlIHNob3VsZCBjaGFuZ2UgdG8gbGlzdCBhbGwgdGhlIGF2YWlsYWJsZSB0aGVtZXMgb3V0IHRoZXJlP1xuICAgIEBnZXRMb2FkZWROYW1lcygpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFjY2Vzc2luZyBMb2FkZWQgVGhlbWVzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zIG9mIGFsbCB0aGUgbG9hZGVkIHRoZW1lIG5hbWVzLlxuICBnZXRMb2FkZWRUaGVtZU5hbWVzOiAtPlxuICAgIHRoZW1lLm5hbWUgZm9yIHRoZW1lIGluIEBnZXRMb2FkZWRUaGVtZXMoKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2YgYWxsIHRoZSBsb2FkZWQgdGhlbWVzLlxuICBnZXRMb2FkZWRUaGVtZXM6IC0+XG4gICAgcGFjayBmb3IgcGFjayBpbiBAcGFja2FnZU1hbmFnZXIuZ2V0TG9hZGVkUGFja2FnZXMoKSB3aGVuIHBhY2suaXNUaGVtZSgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEFjY2Vzc2luZyBBY3RpdmUgVGhlbWVzXG4gICMjI1xuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zIGFsbCB0aGUgYWN0aXZlIHRoZW1lIG5hbWVzLlxuICBnZXRBY3RpdmVUaGVtZU5hbWVzOiAtPlxuICAgIHRoZW1lLm5hbWUgZm9yIHRoZW1lIGluIEBnZXRBY3RpdmVUaGVtZXMoKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2YgYWxsIHRoZSBhY3RpdmUgdGhlbWVzLlxuICBnZXRBY3RpdmVUaGVtZXM6IC0+XG4gICAgcGFjayBmb3IgcGFjayBpbiBAcGFja2FnZU1hbmFnZXIuZ2V0QWN0aXZlUGFja2FnZXMoKSB3aGVuIHBhY2suaXNUaGVtZSgpXG5cbiAgYWN0aXZhdGVQYWNrYWdlczogLT4gQGFjdGl2YXRlVGhlbWVzKClcblxuICAjIyNcbiAgU2VjdGlvbjogTWFuYWdpbmcgRW5hYmxlZCBUaGVtZXNcbiAgIyMjXG5cbiAgd2FybkZvck5vbkV4aXN0ZW50VGhlbWVzOiAtPlxuICAgIHRoZW1lTmFtZXMgPSBAY29uZmlnLmdldCgnY29yZS50aGVtZXMnKSA/IFtdXG4gICAgdGhlbWVOYW1lcyA9IFt0aGVtZU5hbWVzXSB1bmxlc3MgXy5pc0FycmF5KHRoZW1lTmFtZXMpXG4gICAgZm9yIHRoZW1lTmFtZSBpbiB0aGVtZU5hbWVzXG4gICAgICB1bmxlc3MgdGhlbWVOYW1lIGFuZCB0eXBlb2YgdGhlbWVOYW1lIGlzICdzdHJpbmcnIGFuZCBAcGFja2FnZU1hbmFnZXIucmVzb2x2ZVBhY2thZ2VQYXRoKHRoZW1lTmFtZSlcbiAgICAgICAgY29uc29sZS53YXJuKFwiRW5hYmxlZCB0aGVtZSAnI3t0aGVtZU5hbWV9JyBpcyBub3QgaW5zdGFsbGVkLlwiKVxuXG4gICMgUHVibGljOiBHZXQgdGhlIGVuYWJsZWQgdGhlbWUgbmFtZXMgZnJvbSB0aGUgY29uZmlnLlxuICAjXG4gICMgUmV0dXJucyBhbiBhcnJheSBvZiB0aGVtZSBuYW1lcyBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IHNob3VsZCBiZSBhY3RpdmF0ZWQuXG4gIGdldEVuYWJsZWRUaGVtZU5hbWVzOiAtPlxuICAgIHRoZW1lTmFtZXMgPSBAY29uZmlnLmdldCgnY29yZS50aGVtZXMnKSA/IFtdXG4gICAgdGhlbWVOYW1lcyA9IFt0aGVtZU5hbWVzXSB1bmxlc3MgXy5pc0FycmF5KHRoZW1lTmFtZXMpXG4gICAgdGhlbWVOYW1lcyA9IHRoZW1lTmFtZXMuZmlsdGVyICh0aGVtZU5hbWUpID0+XG4gICAgICBpZiB0aGVtZU5hbWUgYW5kIHR5cGVvZiB0aGVtZU5hbWUgaXMgJ3N0cmluZydcbiAgICAgICAgcmV0dXJuIHRydWUgaWYgQHBhY2thZ2VNYW5hZ2VyLnJlc29sdmVQYWNrYWdlUGF0aCh0aGVtZU5hbWUpXG4gICAgICBmYWxzZVxuXG4gICAgIyBVc2UgYSBidWlsdC1pbiBzeW50YXggYW5kIFVJIHRoZW1lIGFueSB0aW1lIHRoZSBjb25maWd1cmVkIHRoZW1lcyBhcmUgbm90XG4gICAgIyBhdmFpbGFibGUuXG4gICAgaWYgdGhlbWVOYW1lcy5sZW5ndGggPCAyXG4gICAgICBidWlsdEluVGhlbWVOYW1lcyA9IFtcbiAgICAgICAgJ2F0b20tZGFyay1zeW50YXgnXG4gICAgICAgICdhdG9tLWRhcmstdWknXG4gICAgICAgICdhdG9tLWxpZ2h0LXN5bnRheCdcbiAgICAgICAgJ2F0b20tbGlnaHQtdWknXG4gICAgICAgICdiYXNlMTYtdG9tb3Jyb3ctZGFyay10aGVtZSdcbiAgICAgICAgJ2Jhc2UxNi10b21vcnJvdy1saWdodC10aGVtZSdcbiAgICAgICAgJ3NvbGFyaXplZC1kYXJrLXN5bnRheCdcbiAgICAgICAgJ3NvbGFyaXplZC1saWdodC1zeW50YXgnXG4gICAgICBdXG4gICAgICB0aGVtZU5hbWVzID0gXy5pbnRlcnNlY3Rpb24odGhlbWVOYW1lcywgYnVpbHRJblRoZW1lTmFtZXMpXG4gICAgICBpZiB0aGVtZU5hbWVzLmxlbmd0aCBpcyAwXG4gICAgICAgIHRoZW1lTmFtZXMgPSBbJ2F0b20tZGFyay1zeW50YXgnLCAnYXRvbS1kYXJrLXVpJ11cbiAgICAgIGVsc2UgaWYgdGhlbWVOYW1lcy5sZW5ndGggaXMgMVxuICAgICAgICBpZiBfLmVuZHNXaXRoKHRoZW1lTmFtZXNbMF0sICctdWknKVxuICAgICAgICAgIHRoZW1lTmFtZXMudW5zaGlmdCgnYXRvbS1kYXJrLXN5bnRheCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGVtZU5hbWVzLnB1c2goJ2F0b20tZGFyay11aScpXG5cbiAgICAjIFJldmVyc2Ugc28gdGhlIGZpcnN0ICh0b3ApIHRoZW1lIGlzIGxvYWRlZCBhZnRlciB0aGUgb3RoZXJzLiBXZSB3YW50XG4gICAgIyB0aGUgZmlyc3QvdG9wIHRoZW1lIHRvIG92ZXJyaWRlIGxhdGVyIHRoZW1lcyBpbiB0aGUgc3RhY2suXG4gICAgdGhlbWVOYW1lcy5yZXZlcnNlKClcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZVxuICAjIyNcblxuICAjIFJlc29sdmUgYW5kIGFwcGx5IHRoZSBzdHlsZXNoZWV0IHNwZWNpZmllZCBieSB0aGUgcGF0aC5cbiAgI1xuICAjIFRoaXMgc3VwcG9ydHMgYm90aCBDU1MgYW5kIExlc3Mgc3R5bHNoZWV0cy5cbiAgI1xuICAjICogYHN0eWxlc2hlZXRQYXRoYCBBIHtTdHJpbmd9IHBhdGggdG8gdGhlIHN0eWxlc2hlZXQgdGhhdCBjYW4gYmUgYW4gYWJzb2x1dGVcbiAgIyAgIHBhdGggb3IgYSByZWxhdGl2ZSBwYXRoIHRoYXQgd2lsbCBiZSByZXNvbHZlZCBhZ2FpbnN0IHRoZSBsb2FkIHBhdGguXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHJlbW92ZSB0aGVcbiAgIyByZXF1aXJlZCBzdHlsZXNoZWV0LlxuICByZXF1aXJlU3R5bGVzaGVldDogKHN0eWxlc2hlZXRQYXRoKSAtPlxuICAgIGlmIGZ1bGxQYXRoID0gQHJlc29sdmVTdHlsZXNoZWV0KHN0eWxlc2hlZXRQYXRoKVxuICAgICAgY29udGVudCA9IEBsb2FkU3R5bGVzaGVldChmdWxsUGF0aClcbiAgICAgIEBhcHBseVN0eWxlc2hlZXQoZnVsbFBhdGgsIGNvbnRlbnQpXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgYSBmaWxlIGF0IHBhdGggJyN7c3R5bGVzaGVldFBhdGh9J1wiKVxuXG4gIHVud2F0Y2hVc2VyU3R5bGVzaGVldDogLT5cbiAgICBAdXNlclN0eWxzaGVldFN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEB1c2VyU3R5bHNoZWV0U3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBAdXNlclN0eWxlc2hlZXRGaWxlID0gbnVsbFxuICAgIEB1c2VyU3R5bGVTaGVldERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgIEB1c2VyU3R5bGVTaGVldERpc3Bvc2FibGUgPSBudWxsXG5cbiAgbG9hZFVzZXJTdHlsZXNoZWV0OiAtPlxuICAgIEB1bndhdGNoVXNlclN0eWxlc2hlZXQoKVxuXG4gICAgdXNlclN0eWxlc2hlZXRQYXRoID0gQHN0eWxlTWFuYWdlci5nZXRVc2VyU3R5bGVTaGVldFBhdGgoKVxuICAgIHJldHVybiB1bmxlc3MgZnMuaXNGaWxlU3luYyh1c2VyU3R5bGVzaGVldFBhdGgpXG5cbiAgICB0cnlcbiAgICAgIEB1c2VyU3R5bGVzaGVldEZpbGUgPSBuZXcgRmlsZSh1c2VyU3R5bGVzaGVldFBhdGgpXG4gICAgICBAdXNlclN0eWxzaGVldFN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICByZWxvYWRTdHlsZXNoZWV0ID0gPT4gQGxvYWRVc2VyU3R5bGVzaGVldCgpXG4gICAgICBAdXNlclN0eWxzaGVldFN1YnNjcmlwdGlvbnMuYWRkKEB1c2VyU3R5bGVzaGVldEZpbGUub25EaWRDaGFuZ2UocmVsb2FkU3R5bGVzaGVldCkpXG4gICAgICBAdXNlclN0eWxzaGVldFN1YnNjcmlwdGlvbnMuYWRkKEB1c2VyU3R5bGVzaGVldEZpbGUub25EaWRSZW5hbWUocmVsb2FkU3R5bGVzaGVldCkpXG4gICAgICBAdXNlclN0eWxzaGVldFN1YnNjcmlwdGlvbnMuYWRkKEB1c2VyU3R5bGVzaGVldEZpbGUub25EaWREZWxldGUocmVsb2FkU3R5bGVzaGVldCkpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIG1lc3NhZ2UgPSBcIlwiXCJcbiAgICAgICAgVW5hYmxlIHRvIHdhdGNoIHBhdGg6IGAje3BhdGguYmFzZW5hbWUodXNlclN0eWxlc2hlZXRQYXRoKX1gLiBNYWtlIHN1cmVcbiAgICAgICAgeW91IGhhdmUgcGVybWlzc2lvbnMgdG8gYCN7dXNlclN0eWxlc2hlZXRQYXRofWAuXG5cbiAgICAgICAgT24gbGludXggdGhlcmUgYXJlIGN1cnJlbnRseSBwcm9ibGVtcyB3aXRoIHdhdGNoIHNpemVzLiBTZWVcbiAgICAgICAgW3RoaXMgZG9jdW1lbnRdW3dhdGNoZXNdIGZvciBtb3JlIGluZm8uXG4gICAgICAgIFt3YXRjaGVzXTpodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2Jsb2IvbWFzdGVyL2RvY3MvYnVpbGQtaW5zdHJ1Y3Rpb25zL2xpbnV4Lm1kI3R5cGVlcnJvci11bmFibGUtdG8td2F0Y2gtcGF0aFxuICAgICAgXCJcIlwiXG4gICAgICBAbm90aWZpY2F0aW9uTWFuYWdlci5hZGRFcnJvcihtZXNzYWdlLCBkaXNtaXNzYWJsZTogdHJ1ZSlcblxuICAgIHRyeVxuICAgICAgdXNlclN0eWxlc2hlZXRDb250ZW50cyA9IEBsb2FkU3R5bGVzaGVldCh1c2VyU3R5bGVzaGVldFBhdGgsIHRydWUpXG4gICAgY2F0Y2hcbiAgICAgIHJldHVyblxuXG4gICAgQHVzZXJTdHlsZVNoZWV0RGlzcG9zYWJsZSA9IEBzdHlsZU1hbmFnZXIuYWRkU3R5bGVTaGVldCh1c2VyU3R5bGVzaGVldENvbnRlbnRzLCBzb3VyY2VQYXRoOiB1c2VyU3R5bGVzaGVldFBhdGgsIHByaW9yaXR5OiAyKVxuXG4gIGxvYWRCYXNlU3R5bGVzaGVldHM6IC0+XG4gICAgQHJlbG9hZEJhc2VTdHlsZXNoZWV0cygpXG5cbiAgcmVsb2FkQmFzZVN0eWxlc2hlZXRzOiAtPlxuICAgIEByZXF1aXJlU3R5bGVzaGVldCgnLi4vc3RhdGljL2F0b20nKVxuICAgIGlmIG5hdGl2ZVN0eWxlc2hlZXRQYXRoID0gZnMucmVzb2x2ZU9uTG9hZFBhdGgocHJvY2Vzcy5wbGF0Zm9ybSwgWydjc3MnLCAnbGVzcyddKVxuICAgICAgQHJlcXVpcmVTdHlsZXNoZWV0KG5hdGl2ZVN0eWxlc2hlZXRQYXRoKVxuXG4gIHN0eWxlc2hlZXRFbGVtZW50Rm9ySWQ6IChpZCkgLT5cbiAgICBlc2NhcGVkSWQgPSBpZC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpXG4gICAgZG9jdW1lbnQuaGVhZC5xdWVyeVNlbGVjdG9yKFwiYXRvbS1zdHlsZXMgc3R5bGVbc291cmNlLXBhdGg9XFxcIiN7ZXNjYXBlZElkfVxcXCJdXCIpXG5cbiAgcmVzb2x2ZVN0eWxlc2hlZXQ6IChzdHlsZXNoZWV0UGF0aCkgLT5cbiAgICBpZiBwYXRoLmV4dG5hbWUoc3R5bGVzaGVldFBhdGgpLmxlbmd0aCA+IDBcbiAgICAgIGZzLnJlc29sdmVPbkxvYWRQYXRoKHN0eWxlc2hlZXRQYXRoKVxuICAgIGVsc2VcbiAgICAgIGZzLnJlc29sdmVPbkxvYWRQYXRoKHN0eWxlc2hlZXRQYXRoLCBbJ2NzcycsICdsZXNzJ10pXG5cbiAgbG9hZFN0eWxlc2hlZXQ6IChzdHlsZXNoZWV0UGF0aCwgaW1wb3J0RmFsbGJhY2tWYXJpYWJsZXMpIC0+XG4gICAgaWYgcGF0aC5leHRuYW1lKHN0eWxlc2hlZXRQYXRoKSBpcyAnLmxlc3MnXG4gICAgICBAbG9hZExlc3NTdHlsZXNoZWV0KHN0eWxlc2hlZXRQYXRoLCBpbXBvcnRGYWxsYmFja1ZhcmlhYmxlcylcbiAgICBlbHNlXG4gICAgICBmcy5yZWFkRmlsZVN5bmMoc3R5bGVzaGVldFBhdGgsICd1dGY4JylcblxuICBsb2FkTGVzc1N0eWxlc2hlZXQ6IChsZXNzU3R5bGVzaGVldFBhdGgsIGltcG9ydEZhbGxiYWNrVmFyaWFibGVzPWZhbHNlKSAtPlxuICAgIHVubGVzcyBAbGVzc0NhY2hlP1xuICAgICAgTGVzc0NvbXBpbGVDYWNoZSA9IHJlcXVpcmUgJy4vbGVzcy1jb21waWxlLWNhY2hlJ1xuICAgICAgQGxlc3NDYWNoZSA9IG5ldyBMZXNzQ29tcGlsZUNhY2hlKHtAcmVzb3VyY2VQYXRoLCBpbXBvcnRQYXRoczogQGdldEltcG9ydFBhdGhzKCl9KVxuXG4gICAgdHJ5XG4gICAgICBpZiBpbXBvcnRGYWxsYmFja1ZhcmlhYmxlc1xuICAgICAgICBiYXNlVmFySW1wb3J0cyA9IFwiXCJcIlxuICAgICAgICBAaW1wb3J0IFwidmFyaWFibGVzL3VpLXZhcmlhYmxlc1wiO1xuICAgICAgICBAaW1wb3J0IFwidmFyaWFibGVzL3N5bnRheC12YXJpYWJsZXNcIjtcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGxlc3MgPSBmcy5yZWFkRmlsZVN5bmMobGVzc1N0eWxlc2hlZXRQYXRoLCAndXRmOCcpXG4gICAgICAgIEBsZXNzQ2FjaGUuY3NzRm9yRmlsZShsZXNzU3R5bGVzaGVldFBhdGgsIFtiYXNlVmFySW1wb3J0cywgbGVzc10uam9pbignXFxuJykpXG4gICAgICBlbHNlXG4gICAgICAgIEBsZXNzQ2FjaGUucmVhZChsZXNzU3R5bGVzaGVldFBhdGgpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGVycm9yLmxlc3MgPSB0cnVlXG4gICAgICBpZiBlcnJvci5saW5lP1xuICAgICAgICAjIEFkanVzdCBsaW5lIG51bWJlcnMgZm9yIGltcG9ydCBmYWxsYmFja3NcbiAgICAgICAgZXJyb3IubGluZSAtPSAyIGlmIGltcG9ydEZhbGxiYWNrVmFyaWFibGVzXG5cbiAgICAgICAgbWVzc2FnZSA9IFwiRXJyb3IgY29tcGlsaW5nIExlc3Mgc3R5bGVzaGVldDogYCN7bGVzc1N0eWxlc2hlZXRQYXRofWBcIlxuICAgICAgICBkZXRhaWwgPSBcIlwiXCJcbiAgICAgICAgICBMaW5lIG51bWJlcjogI3tlcnJvci5saW5lfVxuICAgICAgICAgICN7ZXJyb3IubWVzc2FnZX1cbiAgICAgICAgXCJcIlwiXG4gICAgICBlbHNlXG4gICAgICAgIG1lc3NhZ2UgPSBcIkVycm9yIGxvYWRpbmcgTGVzcyBzdHlsZXNoZWV0OiBgI3tsZXNzU3R5bGVzaGVldFBhdGh9YFwiXG4gICAgICAgIGRldGFpbCA9IGVycm9yLm1lc3NhZ2VcblxuICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkRXJyb3IobWVzc2FnZSwge2RldGFpbCwgZGlzbWlzc2FibGU6IHRydWV9KVxuICAgICAgdGhyb3cgZXJyb3JcblxuICByZW1vdmVTdHlsZXNoZWV0OiAoc3R5bGVzaGVldFBhdGgpIC0+XG4gICAgQHN0eWxlU2hlZXREaXNwb3NhYmxlc0J5U291cmNlUGF0aFtzdHlsZXNoZWV0UGF0aF0/LmRpc3Bvc2UoKVxuXG4gIGFwcGx5U3R5bGVzaGVldDogKHBhdGgsIHRleHQpIC0+XG4gICAgQHN0eWxlU2hlZXREaXNwb3NhYmxlc0J5U291cmNlUGF0aFtwYXRoXSA9IEBzdHlsZU1hbmFnZXIuYWRkU3R5bGVTaGVldCh0ZXh0LCBzb3VyY2VQYXRoOiBwYXRoKVxuXG4gIGFjdGl2YXRlVGhlbWVzOiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgIyBAY29uZmlnLm9ic2VydmUgcnVucyB0aGUgY2FsbGJhY2sgb25jZSwgdGhlbiBvbiBzdWJzZXF1ZW50IGNoYW5nZXMuXG4gICAgICBAY29uZmlnLm9ic2VydmUgJ2NvcmUudGhlbWVzJywgPT5cbiAgICAgICAgQGRlYWN0aXZhdGVUaGVtZXMoKVxuXG4gICAgICAgIEB3YXJuRm9yTm9uRXhpc3RlbnRUaGVtZXMoKVxuXG4gICAgICAgIEByZWZyZXNoTGVzc0NhY2hlKCkgIyBVcGRhdGUgY2FjaGUgZm9yIHBhY2thZ2VzIGluIGNvcmUudGhlbWVzIGNvbmZpZ1xuXG4gICAgICAgIHByb21pc2VzID0gW11cbiAgICAgICAgZm9yIHRoZW1lTmFtZSBpbiBAZ2V0RW5hYmxlZFRoZW1lTmFtZXMoKVxuICAgICAgICAgIGlmIEBwYWNrYWdlTWFuYWdlci5yZXNvbHZlUGFja2FnZVBhdGgodGhlbWVOYW1lKVxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChAcGFja2FnZU1hbmFnZXIuYWN0aXZhdGVQYWNrYWdlKHRoZW1lTmFtZSkpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRmFpbGVkIHRvIGFjdGl2YXRlIHRoZW1lICcje3RoZW1lTmFtZX0nIGJlY2F1c2UgaXQgaXNuJ3QgaW5zdGFsbGVkLlwiKVxuXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuID0+XG4gICAgICAgICAgQGFkZEFjdGl2ZVRoZW1lQ2xhc3NlcygpXG4gICAgICAgICAgQHJlZnJlc2hMZXNzQ2FjaGUoKSAjIFVwZGF0ZSBjYWNoZSBhZ2FpbiBub3cgdGhhdCBAZ2V0QWN0aXZlVGhlbWVzKCkgaXMgcG9wdWxhdGVkXG4gICAgICAgICAgQGxvYWRVc2VyU3R5bGVzaGVldCgpXG4gICAgICAgICAgQHJlbG9hZEJhc2VTdHlsZXNoZWV0cygpXG4gICAgICAgICAgQGluaXRpYWxMb2FkQ29tcGxldGUgPSB0cnVlXG4gICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS1hY3RpdmUtdGhlbWVzJ1xuICAgICAgICAgIHJlc29sdmUoKVxuXG4gIGRlYWN0aXZhdGVUaGVtZXM6IC0+XG4gICAgQHJlbW92ZUFjdGl2ZVRoZW1lQ2xhc3NlcygpXG4gICAgQHVud2F0Y2hVc2VyU3R5bGVzaGVldCgpXG4gICAgQHBhY2thZ2VNYW5hZ2VyLmRlYWN0aXZhdGVQYWNrYWdlKHBhY2submFtZSkgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgbnVsbFxuXG4gIGlzSW5pdGlhbExvYWRDb21wbGV0ZTogLT4gQGluaXRpYWxMb2FkQ29tcGxldGVcblxuICBhZGRBY3RpdmVUaGVtZUNsYXNzZXM6IC0+XG4gICAgaWYgd29ya3NwYWNlRWxlbWVudCA9IEB2aWV3UmVnaXN0cnkuZ2V0VmlldyhAd29ya3NwYWNlKVxuICAgICAgZm9yIHBhY2sgaW4gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgICAgIHdvcmtzcGFjZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInRoZW1lLSN7cGFjay5uYW1lfVwiKVxuICAgICAgcmV0dXJuXG5cbiAgcmVtb3ZlQWN0aXZlVGhlbWVDbGFzc2VzOiAtPlxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBAdmlld1JlZ2lzdHJ5LmdldFZpZXcoQHdvcmtzcGFjZSlcbiAgICBmb3IgcGFjayBpbiBAZ2V0QWN0aXZlVGhlbWVzKClcbiAgICAgIHdvcmtzcGFjZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInRoZW1lLSN7cGFjay5uYW1lfVwiKVxuICAgIHJldHVyblxuXG4gIHJlZnJlc2hMZXNzQ2FjaGU6IC0+XG4gICAgQGxlc3NDYWNoZT8uc2V0SW1wb3J0UGF0aHMoQGdldEltcG9ydFBhdGhzKCkpXG5cbiAgZ2V0SW1wb3J0UGF0aHM6IC0+XG4gICAgYWN0aXZlVGhlbWVzID0gQGdldEFjdGl2ZVRoZW1lcygpXG4gICAgaWYgYWN0aXZlVGhlbWVzLmxlbmd0aCA+IDBcbiAgICAgIHRoZW1lUGF0aHMgPSAodGhlbWUuZ2V0U3R5bGVzaGVldHNQYXRoKCkgZm9yIHRoZW1lIGluIGFjdGl2ZVRoZW1lcyB3aGVuIHRoZW1lKVxuICAgIGVsc2VcbiAgICAgIHRoZW1lUGF0aHMgPSBbXVxuICAgICAgZm9yIHRoZW1lTmFtZSBpbiBAZ2V0RW5hYmxlZFRoZW1lTmFtZXMoKVxuICAgICAgICBpZiB0aGVtZVBhdGggPSBAcGFja2FnZU1hbmFnZXIucmVzb2x2ZVBhY2thZ2VQYXRoKHRoZW1lTmFtZSlcbiAgICAgICAgICBkZXByZWNhdGVkUGF0aCA9IHBhdGguam9pbih0aGVtZVBhdGgsICdzdHlsZXNoZWV0cycpXG4gICAgICAgICAgaWYgZnMuaXNEaXJlY3RvcnlTeW5jKGRlcHJlY2F0ZWRQYXRoKVxuICAgICAgICAgICAgdGhlbWVQYXRocy5wdXNoKGRlcHJlY2F0ZWRQYXRoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoZW1lUGF0aHMucHVzaChwYXRoLmpvaW4odGhlbWVQYXRoLCAnc3R5bGVzJykpXG5cbiAgICB0aGVtZVBhdGhzLmZpbHRlciAodGhlbWVQYXRoKSAtPiBmcy5pc0RpcmVjdG9yeVN5bmModGhlbWVQYXRoKVxuIl19
