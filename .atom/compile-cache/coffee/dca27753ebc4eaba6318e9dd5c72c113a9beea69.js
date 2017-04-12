(function() {
  var $, CommandLogger, FileURLRegExp, NotificationIssue, StackTraceParser, TITLE_CHAR_LIMIT, UserUtilities, fs, path;

  $ = require('jquery');

  fs = require('fs');

  path = require('path');

  StackTraceParser = require('stacktrace-parser');

  CommandLogger = require('./command-logger');

  UserUtilities = require('./user-utilities');

  TITLE_CHAR_LIMIT = 100;

  FileURLRegExp = new RegExp('file://\w*/(.*)');

  module.exports = NotificationIssue = (function() {
    function NotificationIssue(notification) {
      this.notification = notification;
    }

    NotificationIssue.prototype.findSimilarIssues = function() {
      var query, repo, repoUrl, url;
      url = "https://api.github.com/search/issues";
      repoUrl = this.getRepoUrl();
      if (repoUrl == null) {
        repoUrl = 'atom/atom';
      }
      repo = repoUrl.replace(/http(s)?:\/\/(\d+\.)?github.com\//gi, '');
      query = (this.getIssueTitle()) + " repo:" + repo;
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return $.ajax(url + "?q=" + (encodeURI(query)) + "&sort=created", {
            accept: 'application/vnd.github.v3+json',
            contentType: "application/json",
            success: function(data) {
              var issue, issues, j, len, ref;
              if (data.items != null) {
                issues = {};
                ref = data.items;
                for (j = 0, len = ref.length; j < len; j++) {
                  issue = ref[j];
                  if (issue.title.indexOf(_this.getIssueTitle()) > -1 && (issues[issue.state] == null)) {
                    issues[issue.state] = issue;
                    break;
                  }
                }
                if ((issues.open != null) || (issues.closed != null)) {
                  return resolve(issues);
                }
              }
              return resolve(null);
            },
            error: function() {
              return resolve(null);
            }
          });
        };
      })(this));
    };

    NotificationIssue.prototype.getIssueUrlForSystem = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          _this.getIssueUrl().then(function(issueUrl) {
            return $.ajax("https://is.gd/create.php?format=simple", {
              type: 'POST',
              data: {
                url: issueUrl
              },
              success: function(data) {
                return resolve(data);
              },
              error: function() {
                return resolve(issueUrl);
              }
            });
          });
        };
      })(this));
    };

    NotificationIssue.prototype.getIssueUrl = function() {
      return this.getIssueBody().then((function(_this) {
        return function(issueBody) {
          var repoUrl;
          repoUrl = _this.getRepoUrl();
          if (repoUrl == null) {
            repoUrl = 'https://github.com/atom/atom';
          }
          return repoUrl + "/issues/new?title=" + (_this.encodeURI(_this.getIssueTitle())) + "&body=" + (_this.encodeURI(issueBody));
        };
      })(this));
    };

    NotificationIssue.prototype.getIssueTitle = function() {
      var title;
      title = this.notification.getMessage();
      title = title.replace(process.env.ATOM_HOME, '$ATOM_HOME');
      if (process.platform === 'win32') {
        title = title.replace(process.env.USERPROFILE, '~');
        title = title.replace(path.sep, path.posix.sep);
      } else {
        title = title.replace(process.env.HOME, '~');
      }
      if (title.length > TITLE_CHAR_LIMIT) {
        title = title.substring(0, TITLE_CHAR_LIMIT - 3) + '...';
      }
      return title;
    };

    NotificationIssue.prototype.getIssueBody = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var installedPackagesPromise, systemPromise;
          if (_this.issueBody) {
            return resolve(_this.issueBody);
          }
          systemPromise = UserUtilities.getOSVersion();
          installedPackagesPromise = UserUtilities.getInstalledPackages();
          return Promise.all([systemPromise, installedPackagesPromise]).then(function(all) {
            var atomVersion, copyText, electronVersion, installedPackages, message, options, packageMessage, packageName, packageVersion, ref, ref1, repoUrl, rootUserStatus, systemName, systemUser, userConfig;
            systemName = all[0], installedPackages = all[1];
            message = _this.notification.getMessage();
            options = _this.notification.getOptions();
            repoUrl = _this.getRepoUrl();
            packageName = _this.getPackageName();
            if (packageName != null) {
              packageVersion = (ref = atom.packages.getLoadedPackage(packageName)) != null ? (ref1 = ref.metadata) != null ? ref1.version : void 0 : void 0;
            }
            userConfig = UserUtilities.getConfigForPackage(packageName);
            copyText = '';
            systemUser = process.env.USER;
            rootUserStatus = '';
            if (systemUser === 'root') {
              rootUserStatus = '**User**: root';
            }
            if ((packageName != null) && (repoUrl != null)) {
              packageMessage = "[" + packageName + "](" + repoUrl + ") package, v" + packageVersion;
            } else if (packageName != null) {
              packageMessage = "'" + packageName + "' package, v" + packageVersion;
            } else {
              packageMessage = 'Atom Core';
            }
            atomVersion = atom.getVersion();
            electronVersion = process.versions.electron;
            _this.issueBody = "[Enter steps to reproduce below:]\n\n1. ...\n2. ...\n\n**Atom Version**: " + atomVersion + "\n**Electron Version**: " + electronVersion + "\n**System**: " + systemName + "\n**Thrown From**: " + packageMessage + "\n" + rootUserStatus + "\n\n### Stack Trace\n\n" + message + "\n\n```\nAt " + options.detail + "\n\n" + options.stack + "\n```\n\n### Commands\n\n" + (CommandLogger.instance().getText()) + "\n\n### Config\n\n```json\n" + (JSON.stringify(userConfig, null, 2)) + "\n```\n\n### Installed Packages\n\n```coffee\n# User\n" + (installedPackages.user.join('\n') || 'No installed packages') + "\n\n# Dev\n" + (installedPackages.dev.join('\n') || 'No dev packages') + "\n```\n\n" + copyText;
            return resolve(_this.issueBody);
          });
        };
      })(this));
    };

    NotificationIssue.prototype.encodeURI = function(str) {
      str = encodeURI(str);
      return str.replace(/#/g, '%23').replace(/;/g, '%3B');
    };

    NotificationIssue.prototype.getRepoUrl = function() {
      var packageName, packagePath, ref, ref1, ref2, ref3, ref4, repo, repoUrl;
      packageName = this.getPackageName();
      if (packageName == null) {
        return;
      }
      repo = (ref = atom.packages.getLoadedPackage(packageName)) != null ? (ref1 = ref.metadata) != null ? ref1.repository : void 0 : void 0;
      repoUrl = (ref2 = repo != null ? repo.url : void 0) != null ? ref2 : repo;
      if (!repoUrl) {
        if (packagePath = atom.packages.resolvePackagePath(packageName)) {
          try {
            repo = (ref3 = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json')))) != null ? ref3.repository : void 0;
            repoUrl = (ref4 = repo != null ? repo.url : void 0) != null ? ref4 : repo;
          } catch (error) {}
        }
      }
      return repoUrl != null ? repoUrl.replace(/\.git$/, '').replace(/^git\+/, '') : void 0;
    };

    NotificationIssue.prototype.getPackageNameFromFilePath = function(filePath) {
      var packageName, ref, ref1, ref2, ref3;
      if (!filePath) {
        return;
      }
      packageName = (ref = /\/\.atom\/dev\/packages\/([^\/]+)\//.exec(filePath)) != null ? ref[1] : void 0;
      if (packageName) {
        return packageName;
      }
      packageName = (ref1 = /\\\.atom\\dev\\packages\\([^\\]+)\\/.exec(filePath)) != null ? ref1[1] : void 0;
      if (packageName) {
        return packageName;
      }
      packageName = (ref2 = /\/\.atom\/packages\/([^\/]+)\//.exec(filePath)) != null ? ref2[1] : void 0;
      if (packageName) {
        return packageName;
      }
      packageName = (ref3 = /\\\.atom\\packages\\([^\\]+)\\/.exec(filePath)) != null ? ref3[1] : void 0;
      if (packageName) {
        return packageName;
      }
    };

    NotificationIssue.prototype.getPackageName = function() {
      var file, getPackageName, i, j, options, packageName, packagePath, packagePaths, ref, stack;
      options = this.notification.getOptions();
      if (options.packageName != null) {
        return options.packageName;
      }
      if (!((options.stack != null) || (options.detail != null))) {
        return;
      }
      packagePaths = this.getPackagePathsByPackageName();
      for (packageName in packagePaths) {
        packagePath = packagePaths[packageName];
        if (packagePath.indexOf(path.join('.atom', 'dev', 'packages')) > -1 || packagePath.indexOf(path.join('.atom', 'packages')) > -1) {
          packagePaths[packageName] = fs.realpathSync(packagePath);
        }
      }
      getPackageName = (function(_this) {
        return function(filePath) {
          var isSubfolder, match, packName;
          filePath = /\((.+?):\d+|\((.+)\)|(.+)/.exec(filePath)[0];
          if (match = FileURLRegExp.exec(filePath)) {
            filePath = match[1];
          }
          filePath = path.normalize(filePath);
          if (path.isAbsolute(filePath)) {
            for (packName in packagePaths) {
              packagePath = packagePaths[packName];
              if (filePath === 'node.js') {
                continue;
              }
              isSubfolder = filePath.indexOf(path.normalize(packagePath + path.sep)) === 0;
              if (isSubfolder) {
                return packName;
              }
            }
          }
          return _this.getPackageNameFromFilePath(filePath);
        };
      })(this);
      if ((options.detail != null) && (packageName = getPackageName(options.detail))) {
        return packageName;
      }
      if (options.stack != null) {
        stack = StackTraceParser.parse(options.stack);
        for (i = j = 0, ref = stack.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          file = stack[i].file;
          if (!file) {
            return;
          }
          packageName = getPackageName(file);
          if (packageName != null) {
            return packageName;
          }
        }
      }
    };

    NotificationIssue.prototype.getPackagePathsByPackageName = function() {
      var j, len, pack, packagePathsByPackageName, ref;
      packagePathsByPackageName = {};
      ref = atom.packages.getLoadedPackages();
      for (j = 0, len = ref.length; j < len; j++) {
        pack = ref[j];
        packagePathsByPackageName[pack.name] = pack.path;
      }
      return packagePathsByPackageName;
    };

    return NotificationIssue;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi9ub3RpZmljYXRpb24taXNzdWUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxnQkFBQSxHQUFtQixPQUFBLENBQVEsbUJBQVI7O0VBRW5CLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFFaEIsZ0JBQUEsR0FBbUI7O0VBRW5CLGFBQUEsR0FBb0IsSUFBQSxNQUFBLENBQU8saUJBQVA7O0VBRXBCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUywyQkFBQyxZQUFEO01BQUMsSUFBQyxDQUFBLGVBQUQ7SUFBRDs7Z0NBRWIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsR0FBQSxHQUFNO01BQ04sT0FBQSxHQUFVLElBQUMsQ0FBQSxVQUFELENBQUE7TUFDVixJQUE2QixlQUE3QjtRQUFBLE9BQUEsR0FBVSxZQUFWOztNQUNBLElBQUEsR0FBTyxPQUFPLENBQUMsT0FBUixDQUFnQixxQ0FBaEIsRUFBdUQsRUFBdkQ7TUFDUCxLQUFBLEdBQVUsQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUQsQ0FBQSxHQUFrQixRQUFsQixHQUEwQjthQUVoQyxJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRCxFQUFVLE1BQVY7aUJBQ1YsQ0FBQyxDQUFDLElBQUYsQ0FBVSxHQUFELEdBQUssS0FBTCxHQUFTLENBQUMsU0FBQSxDQUFVLEtB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QixRQUE1QjtRQWRlO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQWdCakIsSUFBRyx3QkFBQSxJQUFvQixDQUFBLFdBQUEsR0FBYyxjQUFBLENBQWUsT0FBTyxDQUFDLE1BQXZCLENBQWQsQ0FBdkI7QUFDRSxlQUFPLFlBRFQ7O01BR0EsSUFBRyxxQkFBSDtRQUNFLEtBQUEsR0FBUSxnQkFBZ0IsQ0FBQyxLQUFqQixDQUF1QixPQUFPLENBQUMsS0FBL0I7QUFDUixhQUFTLHFGQUFUO1VBQ0csT0FBUSxLQUFNLENBQUEsQ0FBQTtVQUdmLElBQUEsQ0FBYyxJQUFkO0FBQUEsbUJBQUE7O1VBQ0EsV0FBQSxHQUFjLGNBQUEsQ0FBZSxJQUFmO1VBQ2QsSUFBc0IsbUJBQXRCO0FBQUEsbUJBQU8sWUFBUDs7QUFORixTQUZGOztJQTlCYzs7Z0NBMENoQiw0QkFBQSxHQUE4QixTQUFBO0FBQzVCLFVBQUE7TUFBQSx5QkFBQSxHQUE0QjtBQUM1QjtBQUFBLFdBQUEscUNBQUE7O1FBQ0UseUJBQTBCLENBQUEsSUFBSSxDQUFDLElBQUwsQ0FBMUIsR0FBdUMsSUFBSSxDQUFDO0FBRDlDO2FBRUE7SUFKNEI7Ozs7O0FBNU5oQyIsInNvdXJjZXNDb250ZW50IjpbIiQgPSByZXF1aXJlICdqcXVlcnknXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5TdGFja1RyYWNlUGFyc2VyID0gcmVxdWlyZSAnc3RhY2t0cmFjZS1wYXJzZXInXG5cbkNvbW1hbmRMb2dnZXIgPSByZXF1aXJlICcuL2NvbW1hbmQtbG9nZ2VyJ1xuVXNlclV0aWxpdGllcyA9IHJlcXVpcmUgJy4vdXNlci11dGlsaXRpZXMnXG5cblRJVExFX0NIQVJfTElNSVQgPSAxMDAgIyBUcnVuY2F0ZSBpc3N1ZSB0aXRsZSB0byAxMDAgY2hhcmFjdGVycyAoaW5jbHVkaW5nIGVsbGlwc2lzKVxuXG5GaWxlVVJMUmVnRXhwID0gbmV3IFJlZ0V4cCgnZmlsZTovL1xcdyovKC4qKScpXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE5vdGlmaWNhdGlvbklzc3VlXG4gIGNvbnN0cnVjdG9yOiAoQG5vdGlmaWNhdGlvbikgLT5cblxuICBmaW5kU2ltaWxhcklzc3VlczogLT5cbiAgICB1cmwgPSBcImh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vc2VhcmNoL2lzc3Vlc1wiXG4gICAgcmVwb1VybCA9IEBnZXRSZXBvVXJsKClcbiAgICByZXBvVXJsID0gJ2F0b20vYXRvbScgdW5sZXNzIHJlcG9Vcmw/XG4gICAgcmVwbyA9IHJlcG9VcmwucmVwbGFjZSAvaHR0cChzKT86XFwvXFwvKFxcZCtcXC4pP2dpdGh1Yi5jb21cXC8vZ2ksICcnXG4gICAgcXVlcnkgPSBcIiN7QGdldElzc3VlVGl0bGUoKX0gcmVwbzoje3JlcG99XCJcblxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAkLmFqYXggXCIje3VybH0/cT0je2VuY29kZVVSSShxdWVyeSl9JnNvcnQ9Y3JlYXRlZFwiLFxuICAgICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLnYzK2pzb24nXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgPT5cbiAgICAgICAgICBpZiBkYXRhLml0ZW1zP1xuICAgICAgICAgICAgaXNzdWVzID0ge31cbiAgICAgICAgICAgIGZvciBpc3N1ZSBpbiBkYXRhLml0ZW1zXG4gICAgICAgICAgICAgIGlmIGlzc3VlLnRpdGxlLmluZGV4T2YoQGdldElzc3VlVGl0bGUoKSkgPiAtMSBhbmQgbm90IGlzc3Vlc1tpc3N1ZS5zdGF0ZV0/XG4gICAgICAgICAgICAgICAgaXNzdWVzW2lzc3VlLnN0YXRlXSA9IGlzc3VlXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoaXNzdWVzKSBpZiBpc3N1ZXMub3Blbj8gb3IgaXNzdWVzLmNsb3NlZD9cbiAgICAgICAgICByZXNvbHZlKG51bGwpXG4gICAgICAgIGVycm9yOiAtPiByZXNvbHZlKG51bGwpXG5cbiAgZ2V0SXNzdWVVcmxGb3JTeXN0ZW06IC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIEBnZXRJc3N1ZVVybCgpLnRoZW4gKGlzc3VlVXJsKSAtPlxuICAgICAgICAkLmFqYXggXCJodHRwczovL2lzLmdkL2NyZWF0ZS5waHA/Zm9ybWF0PXNpbXBsZVwiLFxuICAgICAgICAgIHR5cGU6ICdQT1NUJ1xuICAgICAgICAgIGRhdGE6IHVybDogaXNzdWVVcmxcbiAgICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT4gcmVzb2x2ZShkYXRhKVxuICAgICAgICAgIGVycm9yOiAtPiByZXNvbHZlKGlzc3VlVXJsKVxuICAgICAgcmV0dXJuXG5cbiAgZ2V0SXNzdWVVcmw6IC0+XG4gICAgQGdldElzc3VlQm9keSgpLnRoZW4gKGlzc3VlQm9keSkgPT5cbiAgICAgIHJlcG9VcmwgPSBAZ2V0UmVwb1VybCgpXG4gICAgICByZXBvVXJsID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20nIHVubGVzcyByZXBvVXJsP1xuICAgICAgXCIje3JlcG9Vcmx9L2lzc3Vlcy9uZXc/dGl0bGU9I3tAZW5jb2RlVVJJKEBnZXRJc3N1ZVRpdGxlKCkpfSZib2R5PSN7QGVuY29kZVVSSShpc3N1ZUJvZHkpfVwiXG5cbiAgZ2V0SXNzdWVUaXRsZTogLT5cbiAgICB0aXRsZSA9IEBub3RpZmljYXRpb24uZ2V0TWVzc2FnZSgpXG4gICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlKHByb2Nlc3MuZW52LkFUT01fSE9NRSwgJyRBVE9NX0hPTUUnKVxuICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJ1xuICAgICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlKHByb2Nlc3MuZW52LlVTRVJQUk9GSUxFLCAnficpXG4gICAgICB0aXRsZSA9IHRpdGxlLnJlcGxhY2UocGF0aC5zZXAsIHBhdGgucG9zaXguc2VwKSAjIFN0YW5kYXJkaXplIGlzc3VlIHRpdGxlc1xuICAgIGVsc2VcbiAgICAgIHRpdGxlID0gdGl0bGUucmVwbGFjZShwcm9jZXNzLmVudi5IT01FLCAnficpXG5cbiAgICBpZiB0aXRsZS5sZW5ndGggPiBUSVRMRV9DSEFSX0xJTUlUXG4gICAgICB0aXRsZSA9IHRpdGxlLnN1YnN0cmluZygwLCBUSVRMRV9DSEFSX0xJTUlUIC0gMykgKyAnLi4uJ1xuICAgIHRpdGxlXG5cbiAgZ2V0SXNzdWVCb2R5OiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICByZXR1cm4gcmVzb2x2ZShAaXNzdWVCb2R5KSBpZiBAaXNzdWVCb2R5XG4gICAgICBzeXN0ZW1Qcm9taXNlID0gVXNlclV0aWxpdGllcy5nZXRPU1ZlcnNpb24oKVxuICAgICAgaW5zdGFsbGVkUGFja2FnZXNQcm9taXNlID0gVXNlclV0aWxpdGllcy5nZXRJbnN0YWxsZWRQYWNrYWdlcygpXG5cbiAgICAgIFByb21pc2UuYWxsKFtzeXN0ZW1Qcm9taXNlLCBpbnN0YWxsZWRQYWNrYWdlc1Byb21pc2VdKS50aGVuIChhbGwpID0+XG4gICAgICAgIFtzeXN0ZW1OYW1lLCBpbnN0YWxsZWRQYWNrYWdlc10gPSBhbGxcblxuICAgICAgICBtZXNzYWdlID0gQG5vdGlmaWNhdGlvbi5nZXRNZXNzYWdlKClcbiAgICAgICAgb3B0aW9ucyA9IEBub3RpZmljYXRpb24uZ2V0T3B0aW9ucygpXG4gICAgICAgIHJlcG9VcmwgPSBAZ2V0UmVwb1VybCgpXG4gICAgICAgIHBhY2thZ2VOYW1lID0gQGdldFBhY2thZ2VOYW1lKClcbiAgICAgICAgcGFja2FnZVZlcnNpb24gPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5tZXRhZGF0YT8udmVyc2lvbiBpZiBwYWNrYWdlTmFtZT9cbiAgICAgICAgdXNlckNvbmZpZyA9IFVzZXJVdGlsaXRpZXMuZ2V0Q29uZmlnRm9yUGFja2FnZShwYWNrYWdlTmFtZSlcbiAgICAgICAgY29weVRleHQgPSAnJ1xuICAgICAgICBzeXN0ZW1Vc2VyID0gcHJvY2Vzcy5lbnYuVVNFUlxuICAgICAgICByb290VXNlclN0YXR1cyA9ICcnXG5cbiAgICAgICAgaWYgc3lzdGVtVXNlciBpcyAncm9vdCdcbiAgICAgICAgICByb290VXNlclN0YXR1cyA9ICcqKlVzZXIqKjogcm9vdCdcblxuICAgICAgICBpZiBwYWNrYWdlTmFtZT8gYW5kIHJlcG9Vcmw/XG4gICAgICAgICAgcGFja2FnZU1lc3NhZ2UgPSBcIlsje3BhY2thZ2VOYW1lfV0oI3tyZXBvVXJsfSkgcGFja2FnZSwgdiN7cGFja2FnZVZlcnNpb259XCJcbiAgICAgICAgZWxzZSBpZiBwYWNrYWdlTmFtZT9cbiAgICAgICAgICBwYWNrYWdlTWVzc2FnZSA9IFwiJyN7cGFja2FnZU5hbWV9JyBwYWNrYWdlLCB2I3twYWNrYWdlVmVyc2lvbn1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGFja2FnZU1lc3NhZ2UgPSAnQXRvbSBDb3JlJ1xuXG4gICAgICAgIGF0b21WZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKClcbiAgICAgICAgZWxlY3Ryb25WZXJzaW9uID0gcHJvY2Vzcy52ZXJzaW9ucy5lbGVjdHJvblxuXG4gICAgICAgIEBpc3N1ZUJvZHkgPSBcIlwiXCJcbiAgICAgICAgICBbRW50ZXIgc3RlcHMgdG8gcmVwcm9kdWNlIGJlbG93Ol1cblxuICAgICAgICAgIDEuIC4uLlxuICAgICAgICAgIDIuIC4uLlxuXG4gICAgICAgICAgKipBdG9tIFZlcnNpb24qKjogI3thdG9tVmVyc2lvbn1cbiAgICAgICAgICAqKkVsZWN0cm9uIFZlcnNpb24qKjogI3tlbGVjdHJvblZlcnNpb259XG4gICAgICAgICAgKipTeXN0ZW0qKjogI3tzeXN0ZW1OYW1lfVxuICAgICAgICAgICoqVGhyb3duIEZyb20qKjogI3twYWNrYWdlTWVzc2FnZX1cbiAgICAgICAgICAje3Jvb3RVc2VyU3RhdHVzfVxuXG4gICAgICAgICAgIyMjIFN0YWNrIFRyYWNlXG5cbiAgICAgICAgICAje21lc3NhZ2V9XG5cbiAgICAgICAgICBgYGBcbiAgICAgICAgICBBdCAje29wdGlvbnMuZGV0YWlsfVxuXG4gICAgICAgICAgI3tvcHRpb25zLnN0YWNrfVxuICAgICAgICAgIGBgYFxuXG4gICAgICAgICAgIyMjIENvbW1hbmRzXG5cbiAgICAgICAgICAje0NvbW1hbmRMb2dnZXIuaW5zdGFuY2UoKS5nZXRUZXh0KCl9XG5cbiAgICAgICAgICAjIyMgQ29uZmlnXG5cbiAgICAgICAgICBgYGBqc29uXG4gICAgICAgICAgI3tKU09OLnN0cmluZ2lmeSh1c2VyQ29uZmlnLCBudWxsLCAyKX1cbiAgICAgICAgICBgYGBcblxuICAgICAgICAgICMjIyBJbnN0YWxsZWQgUGFja2FnZXNcblxuICAgICAgICAgIGBgYGNvZmZlZVxuICAgICAgICAgICMgVXNlclxuICAgICAgICAgICN7aW5zdGFsbGVkUGFja2FnZXMudXNlci5qb2luKCdcXG4nKSBvciAnTm8gaW5zdGFsbGVkIHBhY2thZ2VzJ31cblxuICAgICAgICAgICMgRGV2XG4gICAgICAgICAgI3tpbnN0YWxsZWRQYWNrYWdlcy5kZXYuam9pbignXFxuJykgb3IgJ05vIGRldiBwYWNrYWdlcyd9XG4gICAgICAgICAgYGBgXG5cbiAgICAgICAgICAje2NvcHlUZXh0fVxuICAgICAgICBcIlwiXCJcbiAgICAgICAgcmVzb2x2ZShAaXNzdWVCb2R5KVxuXG4gIGVuY29kZVVSSTogKHN0cikgLT5cbiAgICBzdHIgPSBlbmNvZGVVUkkoc3RyKVxuICAgIHN0ci5yZXBsYWNlKC8jL2csICclMjMnKS5yZXBsYWNlKC87L2csICclM0InKVxuXG4gIGdldFJlcG9Vcmw6IC0+XG4gICAgcGFja2FnZU5hbWUgPSBAZ2V0UGFja2FnZU5hbWUoKVxuICAgIHJldHVybiB1bmxlc3MgcGFja2FnZU5hbWU/XG4gICAgcmVwbyA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShwYWNrYWdlTmFtZSk/Lm1ldGFkYXRhPy5yZXBvc2l0b3J5XG4gICAgcmVwb1VybCA9IHJlcG8/LnVybCA/IHJlcG9cbiAgICB1bmxlc3MgcmVwb1VybFxuICAgICAgaWYgcGFja2FnZVBhdGggPSBhdG9tLnBhY2thZ2VzLnJlc29sdmVQYWNrYWdlUGF0aChwYWNrYWdlTmFtZSlcbiAgICAgICAgdHJ5XG4gICAgICAgICAgcmVwbyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihwYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpKSk/LnJlcG9zaXRvcnlcbiAgICAgICAgICByZXBvVXJsID0gcmVwbz8udXJsID8gcmVwb1xuXG4gICAgcmVwb1VybD8ucmVwbGFjZSgvXFwuZ2l0JC8sICcnKS5yZXBsYWNlKC9eZ2l0XFwrLywgJycpXG5cbiAgZ2V0UGFja2FnZU5hbWVGcm9tRmlsZVBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGZpbGVQYXRoXG5cbiAgICBwYWNrYWdlTmFtZSA9IC9cXC9cXC5hdG9tXFwvZGV2XFwvcGFja2FnZXNcXC8oW15cXC9dKylcXC8vLmV4ZWMoZmlsZVBhdGgpP1sxXVxuICAgIHJldHVybiBwYWNrYWdlTmFtZSBpZiBwYWNrYWdlTmFtZVxuXG4gICAgcGFja2FnZU5hbWUgPSAvXFxcXFxcLmF0b21cXFxcZGV2XFxcXHBhY2thZ2VzXFxcXChbXlxcXFxdKylcXFxcLy5leGVjKGZpbGVQYXRoKT9bMV1cbiAgICByZXR1cm4gcGFja2FnZU5hbWUgaWYgcGFja2FnZU5hbWVcblxuICAgIHBhY2thZ2VOYW1lID0gL1xcL1xcLmF0b21cXC9wYWNrYWdlc1xcLyhbXlxcL10rKVxcLy8uZXhlYyhmaWxlUGF0aCk/WzFdXG4gICAgcmV0dXJuIHBhY2thZ2VOYW1lIGlmIHBhY2thZ2VOYW1lXG5cbiAgICBwYWNrYWdlTmFtZSA9IC9cXFxcXFwuYXRvbVxcXFxwYWNrYWdlc1xcXFwoW15cXFxcXSspXFxcXC8uZXhlYyhmaWxlUGF0aCk/WzFdXG4gICAgcmV0dXJuIHBhY2thZ2VOYW1lIGlmIHBhY2thZ2VOYW1lXG5cbiAgZ2V0UGFja2FnZU5hbWU6IC0+XG4gICAgb3B0aW9ucyA9IEBub3RpZmljYXRpb24uZ2V0T3B0aW9ucygpXG5cbiAgICByZXR1cm4gb3B0aW9ucy5wYWNrYWdlTmFtZSBpZiBvcHRpb25zLnBhY2thZ2VOYW1lP1xuICAgIHJldHVybiB1bmxlc3Mgb3B0aW9ucy5zdGFjaz8gb3Igb3B0aW9ucy5kZXRhaWw/XG5cbiAgICBwYWNrYWdlUGF0aHMgPSBAZ2V0UGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZSgpXG4gICAgZm9yIHBhY2thZ2VOYW1lLCBwYWNrYWdlUGF0aCBvZiBwYWNrYWdlUGF0aHNcbiAgICAgIGlmIHBhY2thZ2VQYXRoLmluZGV4T2YocGF0aC5qb2luKCcuYXRvbScsICdkZXYnLCAncGFja2FnZXMnKSkgPiAtMSBvciBwYWNrYWdlUGF0aC5pbmRleE9mKHBhdGguam9pbignLmF0b20nLCAncGFja2FnZXMnKSkgPiAtMVxuICAgICAgICBwYWNrYWdlUGF0aHNbcGFja2FnZU5hbWVdID0gZnMucmVhbHBhdGhTeW5jKHBhY2thZ2VQYXRoKVxuXG4gICAgZ2V0UGFja2FnZU5hbWUgPSAoZmlsZVBhdGgpID0+XG4gICAgICBmaWxlUGF0aCA9IC9cXCgoLis/KTpcXGQrfFxcKCguKylcXCl8KC4rKS8uZXhlYyhmaWxlUGF0aClbMF1cblxuICAgICAgIyBTdGFjayB0cmFjZXMgbWF5IGJlIGEgZmlsZSBVUklcbiAgICAgIGlmIG1hdGNoID0gRmlsZVVSTFJlZ0V4cC5leGVjKGZpbGVQYXRoKVxuICAgICAgICBmaWxlUGF0aCA9IG1hdGNoWzFdXG5cbiAgICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoZmlsZVBhdGgpXG5cbiAgICAgIGlmIHBhdGguaXNBYnNvbHV0ZShmaWxlUGF0aClcbiAgICAgICAgZm9yIHBhY2tOYW1lLCBwYWNrYWdlUGF0aCBvZiBwYWNrYWdlUGF0aHNcbiAgICAgICAgICBjb250aW51ZSBpZiBmaWxlUGF0aCBpcyAnbm9kZS5qcydcbiAgICAgICAgICBpc1N1YmZvbGRlciA9IGZpbGVQYXRoLmluZGV4T2YocGF0aC5ub3JtYWxpemUocGFja2FnZVBhdGggKyBwYXRoLnNlcCkpIGlzIDBcbiAgICAgICAgICByZXR1cm4gcGFja05hbWUgaWYgaXNTdWJmb2xkZXJcbiAgICAgIEBnZXRQYWNrYWdlTmFtZUZyb21GaWxlUGF0aChmaWxlUGF0aClcblxuICAgIGlmIG9wdGlvbnMuZGV0YWlsPyBhbmQgcGFja2FnZU5hbWUgPSBnZXRQYWNrYWdlTmFtZShvcHRpb25zLmRldGFpbClcbiAgICAgIHJldHVybiBwYWNrYWdlTmFtZVxuXG4gICAgaWYgb3B0aW9ucy5zdGFjaz9cbiAgICAgIHN0YWNrID0gU3RhY2tUcmFjZVBhcnNlci5wYXJzZShvcHRpb25zLnN0YWNrKVxuICAgICAgZm9yIGkgaW4gWzAuLi5zdGFjay5sZW5ndGhdXG4gICAgICAgIHtmaWxlfSA9IHN0YWNrW2ldXG5cbiAgICAgICAgIyBFbXB0eSB3aGVuIGl0IHdhcyBydW4gZnJvbSB0aGUgZGV2IGNvbnNvbGVcbiAgICAgICAgcmV0dXJuIHVubGVzcyBmaWxlXG4gICAgICAgIHBhY2thZ2VOYW1lID0gZ2V0UGFja2FnZU5hbWUoZmlsZSlcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VOYW1lIGlmIHBhY2thZ2VOYW1lP1xuXG4gICAgcmV0dXJuXG5cbiAgZ2V0UGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZTogLT5cbiAgICBwYWNrYWdlUGF0aHNCeVBhY2thZ2VOYW1lID0ge31cbiAgICBmb3IgcGFjayBpbiBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2VzKClcbiAgICAgIHBhY2thZ2VQYXRoc0J5UGFja2FnZU5hbWVbcGFjay5uYW1lXSA9IHBhY2sucGF0aFxuICAgIHBhY2thZ2VQYXRoc0J5UGFja2FnZU5hbWVcbiJdfQ==
