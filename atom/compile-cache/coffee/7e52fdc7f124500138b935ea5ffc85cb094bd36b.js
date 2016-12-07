(function() {
  var CommandInstaller, fs, path, runas, symlinkCommand, symlinkCommandWithPrivilegeSync;

  path = require('path');

  fs = require('fs-plus');

  runas = null;

  symlinkCommand = function(sourcePath, destinationPath, callback) {
    return fs.unlink(destinationPath, function(error) {
      if ((error != null) && (error != null ? error.code : void 0) !== 'ENOENT') {
        return callback(error);
      } else {
        return fs.makeTree(path.dirname(destinationPath), function(error) {
          if (error != null) {
            return callback(error);
          } else {
            return fs.symlink(sourcePath, destinationPath, callback);
          }
        });
      }
    });
  };

  symlinkCommandWithPrivilegeSync = function(sourcePath, destinationPath) {
    if (runas == null) {
      runas = require('runas');
    }
    if (runas('/bin/rm', ['-f', destinationPath], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to remove '" + destinationPath + "'");
    }
    if (runas('/bin/mkdir', ['-p', path.dirname(destinationPath)], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to create directory '" + destinationPath + "'");
    }
    if (runas('/bin/ln', ['-s', sourcePath, destinationPath], {
      admin: true
    }) !== 0) {
      throw new Error("Failed to symlink '" + sourcePath + "' to '" + destinationPath + "'");
    }
  };

  module.exports = CommandInstaller = (function() {
    function CommandInstaller(appVersion, applicationDelegate) {
      this.appVersion = appVersion;
      this.applicationDelegate = applicationDelegate;
    }

    CommandInstaller.prototype.getInstallDirectory = function() {
      return "/usr/local/bin";
    };

    CommandInstaller.prototype.getResourcesDirectory = function() {
      return process.resourcesPath;
    };

    CommandInstaller.prototype.installShellCommandsInteractively = function() {
      var showErrorDialog;
      showErrorDialog = (function(_this) {
        return function(error) {
          return _this.applicationDelegate.confirm({
            message: "Failed to install shell commands",
            detailedMessage: error.message
          });
        };
      })(this);
      return this.installAtomCommand(true, (function(_this) {
        return function(error) {
          if (error != null) {
            return showErrorDialog(error);
          } else {
            return _this.installApmCommand(true, function(error) {
              if (error != null) {
                return showErrorDialog(error);
              } else {
                return _this.applicationDelegate.confirm({
                  message: "Commands installed.",
                  detailedMessage: "The shell commands `atom` and `apm` are installed."
                });
              }
            });
          }
        };
      })(this));
    };

    CommandInstaller.prototype.installAtomCommand = function(askForPrivilege, callback) {
      var commandPath, programName;
      programName = this.appVersion.includes("beta") ? "atom-beta" : "atom";
      commandPath = path.join(this.getResourcesDirectory(), 'app', 'atom.sh');
      return this.createSymlink(commandPath, programName, askForPrivilege, callback);
    };

    CommandInstaller.prototype.installApmCommand = function(askForPrivilege, callback) {
      var commandPath, programName;
      programName = this.appVersion.includes("beta") ? "apm-beta" : "apm";
      commandPath = path.join(this.getResourcesDirectory(), 'app', 'apm', 'node_modules', '.bin', 'apm');
      return this.createSymlink(commandPath, programName, askForPrivilege, callback);
    };

    CommandInstaller.prototype.createSymlink = function(commandPath, commandName, askForPrivilege, callback) {
      var destinationPath;
      if (process.platform !== 'darwin') {
        return;
      }
      destinationPath = path.join(this.getInstallDirectory(), commandName);
      return fs.readlink(destinationPath, function(error, realpath) {
        if (realpath === commandPath) {
          callback();
          return;
        }
        return symlinkCommand(commandPath, destinationPath, function(error) {
          var err;
          if (askForPrivilege && (error != null ? error.code : void 0) === 'EACCES') {
            try {
              error = null;
              symlinkCommandWithPrivilegeSync(commandPath, destinationPath);
            } catch (error1) {
              err = error1;
              error = err;
            }
          }
          return typeof callback === "function" ? callback(error) : void 0;
        });
      });
    };

    return CommandInstaller;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jb21tYW5kLWluc3RhbGxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsS0FBQSxHQUFROztFQUVSLGNBQUEsR0FBaUIsU0FBQyxVQUFELEVBQWEsZUFBYixFQUE4QixRQUE5QjtXQUNmLEVBQUUsQ0FBQyxNQUFILENBQVUsZUFBVixFQUEyQixTQUFDLEtBQUQ7TUFDekIsSUFBRyxlQUFBLHFCQUFXLEtBQUssQ0FBRSxjQUFQLEtBQWlCLFFBQS9CO2VBQ0UsUUFBQSxDQUFTLEtBQVQsRUFERjtPQUFBLE1BQUE7ZUFHRSxFQUFFLENBQUMsUUFBSCxDQUFZLElBQUksQ0FBQyxPQUFMLENBQWEsZUFBYixDQUFaLEVBQTJDLFNBQUMsS0FBRDtVQUN6QyxJQUFHLGFBQUg7bUJBQ0UsUUFBQSxDQUFTLEtBQVQsRUFERjtXQUFBLE1BQUE7bUJBR0UsRUFBRSxDQUFDLE9BQUgsQ0FBVyxVQUFYLEVBQXVCLGVBQXZCLEVBQXdDLFFBQXhDLEVBSEY7O1FBRHlDLENBQTNDLEVBSEY7O0lBRHlCLENBQTNCO0VBRGU7O0VBV2pCLCtCQUFBLEdBQWtDLFNBQUMsVUFBRCxFQUFhLGVBQWI7O01BQ2hDLFFBQVMsT0FBQSxDQUFRLE9BQVI7O0lBQ1QsSUFBRyxLQUFBLENBQU0sU0FBTixFQUFpQixDQUFDLElBQUQsRUFBTyxlQUFQLENBQWpCLEVBQTBDO01BQUEsS0FBQSxFQUFPLElBQVA7S0FBMUMsQ0FBQSxLQUE0RCxDQUEvRDtBQUNFLFlBQVUsSUFBQSxLQUFBLENBQU0sb0JBQUEsR0FBcUIsZUFBckIsR0FBcUMsR0FBM0MsRUFEWjs7SUFHQSxJQUFH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RCxFQUFjLFdBQWQsRUFBMkIsZUFBM0IsRUFBNEMsUUFBNUM7QUFDYixVQUFBO01BQUEsSUFBYyxPQUFPLENBQUMsUUFBUixLQUFvQixRQUFsQztBQUFBLGVBQUE7O01BRUEsZUFBQSxHQUFrQixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQVYsRUFBa0MsV0FBbEM7YUFFbEIsRUFBRSxDQUFDLFFBQUgsQ0FBWSxlQUFaLEVBQTZCLFNBQUMsS0FBRCxFQUFRLFFBQVI7UUFDM0IsSUFBRyxRQUFBLEtBQVksV0FBZjtVQUNFLFFBQUEsQ0FBQTtBQUNBLGlCQUZGOztlQUlBLGNBQUEsQ0FBZSxXQUFmLEVBQTRCLGVBQTVCLEVBQTZDLFNBQUMsS0FBRDtBQUMzQyxjQUFBO1VBQUEsSUFBRyxlQUFBLHFCQUFvQixLQUFLLENBQUUsY0FBUCxLQUFlLFFBQXRDO0FBQ0U7Y0FDRSxLQUFBLEdBQVE7Y0FDUiwrQkFBQSxDQUFnQyxXQUFoQyxFQUE2QyxlQUE3QyxFQUZGO2FBQUEsY0FBQTtjQUdNO2NBQ0osS0FBQSxHQUFRLElBSlY7YUFERjs7a0RBT0EsU0FBVTtRQVJpQyxDQUE3QztNQUwyQixDQUE3QjtJQUxhOzs7OztBQXhFakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnJ1bmFzID0gbnVsbCAjIGRlZmVyIHVudGlsIHVzZWRcblxuc3ltbGlua0NvbW1hbmQgPSAoc291cmNlUGF0aCwgZGVzdGluYXRpb25QYXRoLCBjYWxsYmFjaykgLT5cbiAgZnMudW5saW5rIGRlc3RpbmF0aW9uUGF0aCwgKGVycm9yKSAtPlxuICAgIGlmIGVycm9yPyBhbmQgZXJyb3I/LmNvZGUgaXNudCAnRU5PRU5UJ1xuICAgICAgY2FsbGJhY2soZXJyb3IpXG4gICAgZWxzZVxuICAgICAgZnMubWFrZVRyZWUgcGF0aC5kaXJuYW1lKGRlc3RpbmF0aW9uUGF0aCksIChlcnJvcikgLT5cbiAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgY2FsbGJhY2soZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmcy5zeW1saW5rIHNvdXJjZVBhdGgsIGRlc3RpbmF0aW9uUGF0aCwgY2FsbGJhY2tcblxuc3ltbGlua0NvbW1hbmRXaXRoUHJpdmlsZWdlU3luYyA9IChzb3VyY2VQYXRoLCBkZXN0aW5hdGlvblBhdGgpIC0+XG4gIHJ1bmFzID89IHJlcXVpcmUgJ3J1bmFzJ1xuICBpZiBydW5hcygnL2Jpbi9ybScsIFsnLWYnLCBkZXN0aW5hdGlvblBhdGhdLCBhZG1pbjogdHJ1ZSkgaXNudCAwXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHJlbW92ZSAnI3tkZXN0aW5hdGlvblBhdGh9J1wiKVxuXG4gIGlmIHJ1bmFzKCcvYmluL21rZGlyJywgWyctcCcsIHBhdGguZGlybmFtZShkZXN0aW5hdGlvblBhdGgpXSwgYWRtaW46IHRydWUpIGlzbnQgMFxuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjcmVhdGUgZGlyZWN0b3J5ICcje2Rlc3RpbmF0aW9uUGF0aH0nXCIpXG5cbiAgaWYgcnVuYXMoJy9iaW4vbG4nLCBbJy1zJywgc291cmNlUGF0aCwgZGVzdGluYXRpb25QYXRoXSwgYWRtaW46IHRydWUpIGlzbnQgMFxuICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBzeW1saW5rICcje3NvdXJjZVBhdGh9JyB0byAnI3tkZXN0aW5hdGlvblBhdGh9J1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb21tYW5kSW5zdGFsbGVyXG4gIGNvbnN0cnVjdG9yOiAoQGFwcFZlcnNpb24sIEBhcHBsaWNhdGlvbkRlbGVnYXRlKSAtPlxuXG4gIGdldEluc3RhbGxEaXJlY3Rvcnk6IC0+XG4gICAgXCIvdXNyL2xvY2FsL2JpblwiXG5cbiAgZ2V0UmVzb3VyY2VzRGlyZWN0b3J5OiAtPlxuICAgIHByb2Nlc3MucmVzb3VyY2VzUGF0aFxuXG4gIGluc3RhbGxTaGVsbENvbW1hbmRzSW50ZXJhY3RpdmVseTogLT5cbiAgICBzaG93RXJyb3JEaWFsb2cgPSAoZXJyb3IpID0+XG4gICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5jb25maXJtXG4gICAgICAgIG1lc3NhZ2U6IFwiRmFpbGVkIHRvIGluc3RhbGwgc2hlbGwgY29tbWFuZHNcIlxuICAgICAgICBkZXRhaWxlZE1lc3NhZ2U6IGVycm9yLm1lc3NhZ2VcblxuICAgIEBpbnN0YWxsQXRvbUNvbW1hbmQgdHJ1ZSwgKGVycm9yKSA9PlxuICAgICAgaWYgZXJyb3I/XG4gICAgICAgIHNob3dFcnJvckRpYWxvZyhlcnJvcilcbiAgICAgIGVsc2VcbiAgICAgICAgQGluc3RhbGxBcG1Db21tYW5kIHRydWUsIChlcnJvcikgPT5cbiAgICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICAgIHNob3dFcnJvckRpYWxvZyhlcnJvcilcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5jb25maXJtXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiQ29tbWFuZHMgaW5zdGFsbGVkLlwiXG4gICAgICAgICAgICAgIGRldGFpbGVkTWVzc2FnZTogXCJUaGUgc2hlbGwgY29tbWFuZHMgYGF0b21gIGFuZCBgYXBtYCBhcmUgaW5zdGFsbGVkLlwiXG5cbiAgaW5zdGFsbEF0b21Db21tYW5kOiAoYXNrRm9yUHJpdmlsZWdlLCBjYWxsYmFjaykgLT5cbiAgICBwcm9ncmFtTmFtZSA9IGlmIEBhcHBWZXJzaW9uLmluY2x1ZGVzKFwiYmV0YVwiKVxuICAgICAgXCJhdG9tLWJldGFcIlxuICAgIGVsc2VcbiAgICAgIFwiYXRvbVwiXG5cbiAgICBjb21tYW5kUGF0aCA9IHBhdGguam9pbihAZ2V0UmVzb3VyY2VzRGlyZWN0b3J5KCksICdhcHAnLCAnYXRvbS5zaCcpXG4gICAgQGNyZWF0ZVN5bWxpbmsgY29tbWFuZFBhdGgsIHByb2dyYW1OYW1lLCBhc2tGb3JQcml2aWxlZ2UsIGNhbGxiYWNrXG5cbiAgaW5zdGFsbEFwbUNvbW1hbmQ6IChhc2tGb3JQcml2aWxlZ2UsIGNhbGxiYWNrKSAtPlxuICAgIHByb2dyYW1OYW1lID0gaWYgQGFwcFZlcnNpb24uaW5jbHVkZXMoXCJiZXRhXCIpXG4gICAgICBcImFwbS1iZXRhXCJcbiAgICBlbHNlXG4gICAgICBcImFwbVwiXG5cbiAgICBjb21tYW5kUGF0aCA9IHBhdGguam9pbihAZ2V0UmVzb3VyY2VzRGlyZWN0b3J5KCksICdhcHAnLCAnYXBtJywgJ25vZGVfbW9kdWxlcycsICcuYmluJywgJ2FwbScpXG4gICAgQGNyZWF0ZVN5bWxpbmsgY29tbWFuZFBhdGgsIHByb2dyYW1OYW1lLCBhc2tGb3JQcml2aWxlZ2UsIGNhbGxiYWNrXG5cbiAgY3JlYXRlU3ltbGluazogKGNvbW1hbmRQYXRoLCBjb21tYW5kTmFtZSwgYXNrRm9yUHJpdmlsZWdlLCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcblxuICAgIGRlc3RpbmF0aW9uUGF0aCA9IHBhdGguam9pbihAZ2V0SW5zdGFsbERpcmVjdG9yeSgpLCBjb21tYW5kTmFtZSlcblxuICAgIGZzLnJlYWRsaW5rIGRlc3RpbmF0aW9uUGF0aCwgKGVycm9yLCByZWFscGF0aCkgLT5cbiAgICAgIGlmIHJlYWxwYXRoIGlzIGNvbW1hbmRQYXRoXG4gICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIHN5bWxpbmtDb21tYW5kIGNvbW1hbmRQYXRoLCBkZXN0aW5hdGlvblBhdGgsIChlcnJvcikgLT5cbiAgICAgICAgaWYgYXNrRm9yUHJpdmlsZWdlIGFuZCBlcnJvcj8uY29kZSBpcyAnRUFDQ0VTJ1xuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgZXJyb3IgPSBudWxsXG4gICAgICAgICAgICBzeW1saW5rQ29tbWFuZFdpdGhQcml2aWxlZ2VTeW5jKGNvbW1hbmRQYXRoLCBkZXN0aW5hdGlvblBhdGgpXG4gICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBlcnJvciA9IGVyclxuXG4gICAgICAgIGNhbGxiYWNrPyhlcnJvcilcbiJdfQ==
