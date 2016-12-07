(function() {
  var $, BufferedProcess, DEV_PACKAGE_PATH, fs, os, path, semver,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $ = require('jquery');

  os = require('os');

  fs = require('fs');

  path = require('path');

  semver = require('semver');

  BufferedProcess = require('atom').BufferedProcess;


  /*
  A collection of methods for retrieving information about the user's system for
  bug report purposes.
   */

  DEV_PACKAGE_PATH = path.join('dev', 'packages');

  module.exports = {

    /*
    Section: System Information
     */
    getPlatform: function() {
      return os.platform();
    },
    getOSVersion: function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          switch (_this.getPlatform()) {
            case 'darwin':
              return resolve(_this.macVersionText());
            case 'win32':
              return resolve(_this.winVersionText());
            case 'linux':
              return resolve(_this.linuxVersionText());
            default:
              return resolve((os.platform()) + " " + (os.release()));
          }
        };
      })(this));
    },
    macVersionText: function() {
      return this.macVersionInfo().then(function(info) {
        if (!(info.ProductName && info.ProductVersion)) {
          return 'Unknown OS X version';
        }
        return info.ProductName + " " + info.ProductVersion;
      });
    },
    macVersionInfo: function() {
      return new Promise(function(resolve, reject) {
        var plistBuddy, stdout;
        stdout = '';
        plistBuddy = new BufferedProcess({
          command: '/usr/libexec/PlistBuddy',
          args: ['-c', 'Print ProductVersion', '-c', 'Print ProductName', '/System/Library/CoreServices/SystemVersion.plist'],
          stdout: function(output) {
            return stdout += output;
          },
          exit: function() {
            var ProductName, ProductVersion, ref;
            ref = stdout.trim().split('\n'), ProductVersion = ref[0], ProductName = ref[1];
            return resolve({
              ProductVersion: ProductVersion,
              ProductName: ProductName
            });
          }
        });
        return plistBuddy.onWillThrowError(function(arg) {
          var handle;
          handle = arg.handle;
          handle();
          return resolve({});
        });
      });
    },
    linuxVersionText: function() {
      return this.linuxVersionInfo().then(function(info) {
        if (info.DistroName && info.DistroVersion) {
          return info.DistroName + " " + info.DistroVersion;
        } else {
          return (os.platform()) + " " + (os.release());
        }
      });
    },
    linuxVersionInfo: function() {
      return new Promise(function(resolve, reject) {
        var lsbRelease, stdout;
        stdout = '';
        lsbRelease = new BufferedProcess({
          command: 'lsb_release',
          args: ['-ds'],
          stdout: function(output) {
            return stdout += output;
          },
          exit: function(exitCode) {
            var DistroName, DistroVersion, ref;
            ref = stdout.trim().split(' '), DistroName = ref[0], DistroVersion = ref[1];
            return resolve({
              DistroName: DistroName,
              DistroVersion: DistroVersion
            });
          }
        });
        return lsbRelease.onWillThrowError(function(arg) {
          var handle;
          handle = arg.handle;
          handle();
          return resolve({});
        });
      });
    },
    winVersionText: function() {
      return new Promise(function(resolve, reject) {
        var data, systemInfo;
        data = [];
        systemInfo = new BufferedProcess({
          command: 'systeminfo',
          stdout: function(oneLine) {
            return data.push(oneLine);
          },
          exit: function() {
            var info, res;
            info = data.join('\n');
            info = (res = /OS.Name.\s+(.*)$/im.exec(info)) ? res[1] : 'Unknown Windows Version';
            return resolve(info);
          }
        });
        return systemInfo.onWillThrowError(function(arg) {
          var handle;
          handle = arg.handle;
          handle();
          return resolve('Unknown Windows Version');
        });
      });
    },

    /*
    Section: Config Values
     */
    getConfigForPackage: function(packageName) {
      var config;
      config = {
        core: atom.config.settings.core
      };
      if (packageName != null) {
        config[packageName] = atom.config.settings[packageName];
      } else {
        config.editor = atom.config.settings.editor;
      }
      return config;
    },

    /*
    Section: Installed Packages
     */
    isDevModePackagePath: function(packagePath) {
      return packagePath.match(DEV_PACKAGE_PATH) != null;
    },
    getInstalledPackages: function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var activePackageNames, availablePackages, devPackageNames, devPackagePaths;
          devPackagePaths = atom.packages.getAvailablePackagePaths().filter(_this.isDevModePackagePath);
          devPackageNames = devPackagePaths.map(function(packagePath) {
            return path.basename(packagePath);
          });
          availablePackages = atom.packages.getAvailablePackageMetadata();
          activePackageNames = atom.packages.getActivePackages().map(function(activePackage) {
            return activePackage.name;
          });
          return resolve({
            dev: _this.getPackageNames(availablePackages, devPackageNames, activePackageNames, true),
            user: _this.getPackageNames(availablePackages, devPackageNames, activePackageNames, false)
          });
        };
      })(this));
    },
    getActiveLabel: function(packageName, activePackageNames) {
      if (indexOf.call(activePackageNames, packageName) >= 0) {
        return 'active';
      } else {
        return 'inactive';
      }
    },
    getPackageNames: function(availablePackages, devPackageNames, activePackageNames, devMode) {
      var i, j, len, len1, pack, ref, ref1, ref2, ref3, results, results1;
      if (devMode) {
        ref = availablePackages != null ? availablePackages : [];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          pack = ref[i];
          if (ref1 = pack.name, indexOf.call(devPackageNames, ref1) >= 0) {
            results.push(pack.name + ", v" + pack.version + " (" + (this.getActiveLabel(pack.name, activePackageNames)) + ")");
          }
        }
        return results;
      } else {
        ref2 = availablePackages != null ? availablePackages : [];
        results1 = [];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          pack = ref2[j];
          if (ref3 = pack.name, indexOf.call(devPackageNames, ref3) < 0) {
            results1.push(pack.name + ", v" + pack.version + " (" + (this.getActiveLabel(pack.name, activePackageNames)) + ")");
          }
        }
        return results1;
      }
    },
    getLatestAtomData: function() {
      var atomUrl;
      atomUrl = 'https://atom.io/api/updates';
      return new Promise(function(resolve, reject) {
        return $.ajax(atomUrl, {
          accept: 'application/vnd.github.v3+json',
          contentType: "application/json",
          success: function(data) {
            return resolve(data);
          },
          error: function(error) {
            return reject(error);
          }
        });
      });
    },
    checkAtomUpToDate: function() {
      return this.getLatestAtomData().then(function(latestAtomData) {
        var installedVersion, latestVersion, ref, upToDate;
        installedVersion = (ref = atom.getVersion()) != null ? ref.replace(/-.*$/, '') : void 0;
        latestVersion = latestAtomData.name;
        upToDate = (installedVersion != null) && semver.gte(installedVersion, latestVersion);
        return {
          upToDate: upToDate,
          latestVersion: latestVersion,
          installedVersion: installedVersion
        };
      });
    },
    getPackageVersion: function(packageName) {
      var pack;
      pack = atom.packages.getLoadedPackage(packageName);
      return pack != null ? pack.metadata.version : void 0;
    },
    getPackageVersionShippedWithAtom: function(packageName) {
      return require(path.join(atom.getLoadSettings().resourcePath, 'package.json')).packageDependencies[packageName];
    },
    getLatestPackageData: function(packageName) {
      var packagesUrl;
      packagesUrl = 'https://atom.io/api/packages';
      return new Promise(function(resolve, reject) {
        return $.ajax(packagesUrl + "/" + packageName, {
          accept: 'application/vnd.github.v3+json',
          contentType: "application/json",
          success: function(data) {
            return resolve(data);
          },
          error: function(error) {
            return reject(error);
          }
        });
      });
    },
    checkPackageUpToDate: function(packageName) {
      return this.getLatestPackageData(packageName).then((function(_this) {
        return function(latestPackageData) {
          var installedVersion, isCore, latestVersion, upToDate, versionShippedWithAtom;
          installedVersion = _this.getPackageVersion(packageName);
          upToDate = (installedVersion != null) && semver.gte(installedVersion, latestPackageData.releases.latest);
          latestVersion = latestPackageData.releases.latest;
          versionShippedWithAtom = _this.getPackageVersionShippedWithAtom(packageName);
          if (isCore = versionShippedWithAtom != null) {
            upToDate = (installedVersion != null) && semver.gte(installedVersion, versionShippedWithAtom);
          }
          return {
            isCore: isCore,
            upToDate: upToDate,
            latestVersion: latestVersion,
            installedVersion: installedVersion,
            versionShippedWithAtom: versionShippedWithAtom
          };
        };
      })(this));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi91c2VyLXV0aWxpdGllcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBEQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7RUFDUixrQkFBbUIsT0FBQSxDQUFRLE1BQVI7OztBQUVwQjs7Ozs7RUFLQSxnQkFBQSxHQUFtQixJQUFJLENBQUMsSUFBTCxDQUFVLEtBQVYsRUFBaUIsVUFBakI7O0VBRW5CLE1BQU0sQ0FBQyxPQUFQLEdBRUU7O0FBQUE7OztJQUlBLFdBQUEsRUFBYSxTQUFBO2FBQ1gsRUFBRSxDQUFDLFFBQUgsQ0FBQTtJQURXLENBSmI7SUFRQSxZQUFBLEVBQWMsU0FBQTthQUNSLElBQUEsT0FBQSxDQUFRLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxPQUFELEVBQVUsTUFBVjtBQUNWLGtCQUFPLEtBQUMsQ0FBQSxXQUFELENBQUEsQ0FBUDtBQUFBLGlCQUNPLFFBRFA7cUJBQ3FCLE9BQUEsQ0FBUSxLQUFDLENBQUEsY0FBRCxDQUFBLENBQVI7QUFEckIsaUJBRU8sT0FGUDtxQkFFb0IsT0FBQSxDQUFRLEtBQUMsQ0FBQSxjQUFELENBQUEsQ0FBUjtBQUZwQixpQkFHTyxPQUhQO3FCQUdvQixPQUFBLENBQVEsS0FBQyxDQUFBLGdCQUFELENBQUEsQ0FBUjtBQUhwQjtxQkFJTyxPQUFBLENBQVUsQ0FBQyxFQUFFLENBQUMsUUFBSCxDQUFBLENBQUQs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Z0JBQUEsR0FBbUIsS0FBQyxDQUFBLGlCQUFELENBQW1CLFdBQW5CO1VBQ25CLFFBQUEsR0FBVywwQkFBQSxJQUFzQixNQUFNLENBQUMsR0FBUCxDQUFXLGdCQUFYLEVBQTZCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxNQUF4RDtVQUNqQyxhQUFBLEdBQWdCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztVQUMzQyxzQkFBQSxHQUF5QixLQUFDLENBQUEsZ0NBQUQsQ0FBa0MsV0FBbEM7VUFFekIsSUFBRyxNQUFBLEdBQVMsOEJBQVo7WUFLRSxRQUFBLEdBQVcsMEJBQUEsSUFBc0IsTUFBTSxDQUFDLEdBQVAsQ0FBVyxnQkFBWCxFQUE2QixzQkFBN0IsRUFMbkM7O2lCQU9BO1lBQUMsUUFBQSxNQUFEO1lBQVMsVUFBQSxRQUFUO1lBQW1CLGVBQUEsYUFBbkI7WUFBa0Msa0JBQUEsZ0JBQWxDO1lBQW9ELHdCQUFBLHNCQUFwRDs7UUFic0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhDO0lBRG9CLENBMUp0Qjs7QUFoQkYiLCJzb3VyY2VzQ29udGVudCI6WyIkID0gcmVxdWlyZSAnanF1ZXJ5J1xub3MgPSByZXF1aXJlICdvcydcbmZzID0gcmVxdWlyZSAnZnMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbnNlbXZlciA9IHJlcXVpcmUgJ3NlbXZlcidcbntCdWZmZXJlZFByb2Nlc3N9ID0gcmVxdWlyZSAnYXRvbSdcblxuIyMjXG5BIGNvbGxlY3Rpb24gb2YgbWV0aG9kcyBmb3IgcmV0cmlldmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdXNlcidzIHN5c3RlbSBmb3JcbmJ1ZyByZXBvcnQgcHVycG9zZXMuXG4jIyNcblxuREVWX1BBQ0tBR0VfUEFUSCA9IHBhdGguam9pbignZGV2JywgJ3BhY2thZ2VzJylcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gICMjI1xuICBTZWN0aW9uOiBTeXN0ZW0gSW5mb3JtYXRpb25cbiAgIyMjXG5cbiAgZ2V0UGxhdGZvcm06IC0+XG4gICAgb3MucGxhdGZvcm0oKVxuXG4gICMgT1MgdmVyc2lvbiBzdHJpbmdzIGxpZnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9sZWUtZG9obS9idWctcmVwb3J0XG4gIGdldE9TVmVyc2lvbjogLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgc3dpdGNoIEBnZXRQbGF0Zm9ybSgpXG4gICAgICAgIHdoZW4gJ2RhcndpbicgdGhlbiByZXNvbHZlKEBtYWNWZXJzaW9uVGV4dCgpKVxuICAgICAgICB3aGVuICd3aW4zMicgdGhlbiByZXNvbHZlKEB3aW5WZXJzaW9uVGV4dCgpKVxuICAgICAgICB3aGVuICdsaW51eCcgdGhlbiByZXNvbHZlKEBsaW51eFZlcnNpb25UZXh0KCkpXG4gICAgICAgIGVsc2UgcmVzb2x2ZShcIiN7b3MucGxhdGZvcm0oKX0gI3tvcy5yZWxlYXNlKCl9XCIpXG5cbiAgbWFjVmVyc2lvblRleHQ6IC0+XG4gICAgQG1hY1ZlcnNpb25JbmZvKCkudGhlbiAoaW5mbykgLT5cbiAgICAgIHJldHVybiAnVW5rbm93biBPUyBYIHZlcnNpb24nIHVubGVzcyBpbmZvLlByb2R1Y3ROYW1lIGFuZCBpbmZvLlByb2R1Y3RWZXJzaW9uXG4gICAgICBcIiN7aW5mby5Qcm9kdWN0TmFtZX0gI3tpbmZvLlByb2R1Y3RWZXJzaW9ufVwiXG5cbiAgbWFjVmVyc2lvbkluZm86IC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIHN0ZG91dCA9ICcnXG4gICAgICBwbGlzdEJ1ZGR5ID0gbmV3IEJ1ZmZlcmVkUHJvY2Vzc1xuICAgICAgICBjb21tYW5kOiAnL3Vzci9saWJleGVjL1BsaXN0QnVkZHknXG4gICAgICAgIGFyZ3M6IFtcbiAgICAgICAgICAnLWMnXG4gICAgICAgICAgJ1ByaW50IFByb2R1Y3RWZXJzaW9uJ1xuICAgICAgICAgICctYydcbiAgICAgICAgICAnUHJpbnQgUHJvZHVjdE5hbWUnXG4gICAgICAgICAgJy9TeXN0ZW0vTGlicmFyeS9Db3JlU2VydmljZXMvU3lzdGVtVmVyc2lvbi5wbGlzdCdcbiAgICAgICAgXVxuICAgICAgICBzdGRvdXQ6IChvdXRwdXQpIC0+IHN0ZG91dCArPSBvdXRwdXRcbiAgICAgICAgZXhpdDogLT5cbiAgICAgICAgICBbUHJvZHVjdFZlcnNpb24sIFByb2R1Y3ROYW1lXSA9IHN0ZG91dC50cmltKCkuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgcmVzb2x2ZSh7UHJvZHVjdFZlcnNpb24sIFByb2R1Y3ROYW1lfSlcblxuICAgICAgcGxpc3RCdWRkeS5vbldpbGxUaHJvd0Vycm9yICh7aGFuZGxlfSkgLT5cbiAgICAgICAgaGFuZGxlKClcbiAgICAgICAgcmVzb2x2ZSh7fSlcblxuICBsaW51eFZlcnNpb25UZXh0OiAtPlxuICAgIEBsaW51eFZlcnNpb25JbmZvKCkudGhlbiAoaW5mbykgLT5cbiAgICAgIGlmIGluZm8uRGlzdHJvTmFtZSBhbmQgaW5mby5EaXN0cm9WZXJzaW9uXG4gICAgICAgIFwiI3tpbmZvLkRpc3Ryb05hbWV9ICN7aW5mby5EaXN0cm9WZXJzaW9ufVwiXG4gICAgICBlbHNlXG4gICAgICAgIFwiI3tvcy5wbGF0Zm9ybSgpfSAje29zLnJlbGVhc2UoKX1cIlxuXG4gIGxpbnV4VmVyc2lvbkluZm86IC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIHN0ZG91dCA9ICcnXG5cbiAgICAgIGxzYlJlbGVhc2UgPSBuZXcgQnVmZmVyZWRQcm9jZXNzXG4gICAgICAgIGNvbW1hbmQ6ICdsc2JfcmVsZWFzZSdcbiAgICAgICAgYXJnczogWyctZHMnXVxuICAgICAgICBzdGRvdXQ6IChvdXRwdXQpIC0+IHN0ZG91dCArPSBvdXRwdXRcbiAgICAgICAgZXhpdDogKGV4aXRDb2RlKSAtPlxuICAgICAgICAgIFtEaXN0cm9OYW1lLCBEaXN0cm9WZXJzaW9uXSA9IHN0ZG91dC50cmltKCkuc3BsaXQoJyAnKVxuICAgICAgICAgIHJlc29sdmUoe0Rpc3Ryb05hbWUsIERpc3Ryb1ZlcnNpb259KVxuXG4gICAgICBsc2JSZWxlYXNlLm9uV2lsbFRocm93RXJyb3IgKHtoYW5kbGV9KSAtPlxuICAgICAgICBoYW5kbGUoKVxuICAgICAgICByZXNvbHZlKHt9KVxuXG4gIHdpblZlcnNpb25UZXh0OiAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICBkYXRhID0gW11cbiAgICAgIHN5c3RlbUluZm8gPSBuZXcgQnVmZmVyZWRQcm9jZXNzXG4gICAgICAgIGNvbW1hbmQ6ICdzeXN0ZW1pbmZvJ1xuICAgICAgICBzdGRvdXQ6IChvbmVMaW5lKSAtPiBkYXRhLnB1c2gob25lTGluZSlcbiAgICAgICAgZXhpdDogLT5cbiAgICAgICAgICBpbmZvID0gZGF0YS5qb2luKCdcXG4nKVxuICAgICAgICAgIGluZm8gPSBpZiAocmVzID0gL09TLk5hbWUuXFxzKyguKikkL2ltLmV4ZWMoaW5mbykpIHRoZW4gcmVzWzFdIGVsc2UgJ1Vua25vd24gV2luZG93cyBWZXJzaW9uJ1xuICAgICAgICAgIHJlc29sdmUoaW5mbylcblxuICAgICAgc3lzdGVtSW5mby5vbldpbGxUaHJvd0Vycm9yICh7aGFuZGxlfSkgLT5cbiAgICAgICAgaGFuZGxlKClcbiAgICAgICAgcmVzb2x2ZSgnVW5rbm93biBXaW5kb3dzIFZlcnNpb24nKVxuXG4gICMjI1xuICBTZWN0aW9uOiBDb25maWcgVmFsdWVzXG4gICMjI1xuXG4gIGdldENvbmZpZ0ZvclBhY2thZ2U6IChwYWNrYWdlTmFtZSkgLT5cbiAgICBjb25maWcgPSBjb3JlOiBhdG9tLmNvbmZpZy5zZXR0aW5ncy5jb3JlXG4gICAgaWYgcGFja2FnZU5hbWU/XG4gICAgICBjb25maWdbcGFja2FnZU5hbWVdID0gYXRvbS5jb25maWcuc2V0dGluZ3NbcGFja2FnZU5hbWVdXG4gICAgZWxzZVxuICAgICAgY29uZmlnLmVkaXRvciA9IGF0b20uY29uZmlnLnNldHRpbmdzLmVkaXRvclxuICAgIGNvbmZpZ1xuXG4gICMjI1xuICBTZWN0aW9uOiBJbnN0YWxsZWQgUGFja2FnZXNcbiAgIyMjXG5cbiAgaXNEZXZNb2RlUGFja2FnZVBhdGg6IChwYWNrYWdlUGF0aCkgLT5cbiAgICBwYWNrYWdlUGF0aC5tYXRjaChERVZfUEFDS0FHRV9QQVRIKT9cblxuICAjIFJldHVybnMgYSBwcm9taXNlLiBSZXNvbHZlcyB3aXRoIG9iamVjdCBvZiBhcnJheXMge2RldjogWydzb21lLXBhY2thZ2UsIHYwLjIuMycsIC4uLl0sIHVzZXI6IFsuLi5dfVxuICBnZXRJbnN0YWxsZWRQYWNrYWdlczogLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgZGV2UGFja2FnZVBhdGhzID0gYXRvbS5wYWNrYWdlcy5nZXRBdmFpbGFibGVQYWNrYWdlUGF0aHMoKS5maWx0ZXIoQGlzRGV2TW9kZVBhY2thZ2VQYXRoKVxuICAgICAgZGV2UGFja2FnZU5hbWVzID0gZGV2UGFja2FnZVBhdGhzLm1hcCgocGFja2FnZVBhdGgpIC0+IHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpKVxuICAgICAgYXZhaWxhYmxlUGFja2FnZXMgPSBhdG9tLnBhY2thZ2VzLmdldEF2YWlsYWJsZVBhY2thZ2VNZXRhZGF0YSgpXG4gICAgICBhY3RpdmVQYWNrYWdlTmFtZXMgPSBhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2VzKCkubWFwKChhY3RpdmVQYWNrYWdlKSAtPiBhY3RpdmVQYWNrYWdlLm5hbWUpXG4gICAgICByZXNvbHZlXG4gICAgICAgIGRldjogQGdldFBhY2thZ2VOYW1lcyhhdmFpbGFibGVQYWNrYWdlcywgZGV2UGFja2FnZU5hbWVzLCBhY3RpdmVQYWNrYWdlTmFtZXMsIHRydWUpXG4gICAgICAgIHVzZXI6IEBnZXRQYWNrYWdlTmFtZXMoYXZhaWxhYmxlUGFja2FnZXMsIGRldlBhY2thZ2VOYW1lcywgYWN0aXZlUGFja2FnZU5hbWVzLCBmYWxzZSlcblxuICBnZXRBY3RpdmVMYWJlbDogKHBhY2thZ2VOYW1lLCBhY3RpdmVQYWNrYWdlTmFtZXMpIC0+XG4gICAgaWYgcGFja2FnZU5hbWUgaW4gYWN0aXZlUGFja2FnZU5hbWVzXG4gICAgICAnYWN0aXZlJ1xuICAgIGVsc2VcbiAgICAgICdpbmFjdGl2ZSdcblxuICBnZXRQYWNrYWdlTmFtZXM6IChhdmFpbGFibGVQYWNrYWdlcywgZGV2UGFja2FnZU5hbWVzLCBhY3RpdmVQYWNrYWdlTmFtZXMsIGRldk1vZGUpIC0+XG4gICAgaWYgZGV2TW9kZVxuICAgICAgXCIje3BhY2submFtZX0sIHYje3BhY2sudmVyc2lvbn0gKCN7QGdldEFjdGl2ZUxhYmVsKHBhY2submFtZSwgYWN0aXZlUGFja2FnZU5hbWVzKX0pXCIgZm9yIHBhY2sgaW4gKGF2YWlsYWJsZVBhY2thZ2VzID8gW10pIHdoZW4gcGFjay5uYW1lIGluIGRldlBhY2thZ2VOYW1lc1xuICAgIGVsc2VcbiAgICAgIFwiI3twYWNrLm5hbWV9LCB2I3twYWNrLnZlcnNpb259ICgje0BnZXRBY3RpdmVMYWJlbChwYWNrLm5hbWUsIGFjdGl2ZVBhY2thZ2VOYW1lcyl9KVwiIGZvciBwYWNrIGluIChhdmFpbGFibGVQYWNrYWdlcyA/IFtdKSB3aGVuIHBhY2submFtZSBub3QgaW4gZGV2UGFja2FnZU5hbWVzXG5cbiAgZ2V0TGF0ZXN0QXRvbURhdGE6IC0+XG4gICAgYXRvbVVybCA9ICdodHRwczovL2F0b20uaW8vYXBpL3VwZGF0ZXMnXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICQuYWpheCBhdG9tVXJsLFxuICAgICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLnYzK2pzb24nXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT4gcmVzb2x2ZShkYXRhKVxuICAgICAgICBlcnJvcjogKGVycm9yKSAtPiByZWplY3QoZXJyb3IpXG5cbiAgY2hlY2tBdG9tVXBUb0RhdGU6IC0+XG4gICAgQGdldExhdGVzdEF0b21EYXRhKCkudGhlbiAobGF0ZXN0QXRvbURhdGEpIC0+XG4gICAgICBpbnN0YWxsZWRWZXJzaW9uID0gYXRvbS5nZXRWZXJzaW9uKCk/LnJlcGxhY2UoLy0uKiQvLCAnJylcbiAgICAgIGxhdGVzdFZlcnNpb24gPSBsYXRlc3RBdG9tRGF0YS5uYW1lXG4gICAgICB1cFRvRGF0ZSA9IGluc3RhbGxlZFZlcnNpb24/IGFuZCBzZW12ZXIuZ3RlKGluc3RhbGxlZFZlcnNpb24sIGxhdGVzdFZlcnNpb24pXG4gICAgICB7dXBUb0RhdGUsIGxhdGVzdFZlcnNpb24sIGluc3RhbGxlZFZlcnNpb259XG5cbiAgZ2V0UGFja2FnZVZlcnNpb246IChwYWNrYWdlTmFtZSkgLT5cbiAgICBwYWNrID0gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlKHBhY2thZ2VOYW1lKVxuICAgIHBhY2s/Lm1ldGFkYXRhLnZlcnNpb25cblxuICBnZXRQYWNrYWdlVmVyc2lvblNoaXBwZWRXaXRoQXRvbTogKHBhY2thZ2VOYW1lKSAtPlxuICAgIHJlcXVpcmUocGF0aC5qb2luKGF0b20uZ2V0TG9hZFNldHRpbmdzKCkucmVzb3VyY2VQYXRoLCAncGFja2FnZS5qc29uJykpLnBhY2thZ2VEZXBlbmRlbmNpZXNbcGFja2FnZU5hbWVdXG5cbiAgZ2V0TGF0ZXN0UGFja2FnZURhdGE6IChwYWNrYWdlTmFtZSkgLT5cbiAgICBwYWNrYWdlc1VybCA9ICdodHRwczovL2F0b20uaW8vYXBpL3BhY2thZ2VzJ1xuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICAkLmFqYXggXCIje3BhY2thZ2VzVXJsfS8je3BhY2thZ2VOYW1lfVwiLFxuICAgICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLnYzK2pzb24nXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT4gcmVzb2x2ZShkYXRhKVxuICAgICAgICBlcnJvcjogKGVycm9yKSAtPiByZWplY3QoZXJyb3IpXG5cbiAgY2hlY2tQYWNrYWdlVXBUb0RhdGU6IChwYWNrYWdlTmFtZSkgLT5cbiAgICBAZ2V0TGF0ZXN0UGFja2FnZURhdGEocGFja2FnZU5hbWUpLnRoZW4gKGxhdGVzdFBhY2thZ2VEYXRhKSA9PlxuICAgICAgaW5zdGFsbGVkVmVyc2lvbiA9IEBnZXRQYWNrYWdlVmVyc2lvbihwYWNrYWdlTmFtZSlcbiAgICAgIHVwVG9EYXRlID0gaW5zdGFsbGVkVmVyc2lvbj8gYW5kIHNlbXZlci5ndGUoaW5zdGFsbGVkVmVyc2lvbiwgbGF0ZXN0UGFja2FnZURhdGEucmVsZWFzZXMubGF0ZXN0KVxuICAgICAgbGF0ZXN0VmVyc2lvbiA9IGxhdGVzdFBhY2thZ2VEYXRhLnJlbGVhc2VzLmxhdGVzdFxuICAgICAgdmVyc2lvblNoaXBwZWRXaXRoQXRvbSA9IEBnZXRQYWNrYWdlVmVyc2lvblNoaXBwZWRXaXRoQXRvbShwYWNrYWdlTmFtZSlcblxuICAgICAgaWYgaXNDb3JlID0gdmVyc2lvblNoaXBwZWRXaXRoQXRvbT9cbiAgICAgICAgIyBBIGNvcmUgcGFja2FnZSBpcyBvdXQgb2YgZGF0ZSBpZiB0aGUgdmVyc2lvbiB3aGljaCBpcyBiZWluZyB1c2VkXG4gICAgICAgICMgaXMgbG93ZXIgdGhhbiB0aGUgdmVyc2lvbiB3aGljaCBub3JtYWxseSBzaGlwcyB3aXRoIHRoZSB2ZXJzaW9uXG4gICAgICAgICMgb2YgQXRvbSB3aGljaCBpcyBydW5uaW5nLiBUaGlzIHdpbGwgaGFwcGVuIHdoZW4gdGhlcmUncyBhIGxvY2FsbHlcbiAgICAgICAgIyBpbnN0YWxsZWQgdmVyc2lvbiBvZiB0aGUgcGFja2FnZSB3aXRoIGEgbG93ZXIgdmVyc2lvbiB0aGFuIEF0b20ncy5cbiAgICAgICAgdXBUb0RhdGUgPSBpbnN0YWxsZWRWZXJzaW9uPyBhbmQgc2VtdmVyLmd0ZShpbnN0YWxsZWRWZXJzaW9uLCB2ZXJzaW9uU2hpcHBlZFdpdGhBdG9tKVxuXG4gICAgICB7aXNDb3JlLCB1cFRvRGF0ZSwgbGF0ZXN0VmVyc2lvbiwgaW5zdGFsbGVkVmVyc2lvbiwgdmVyc2lvblNoaXBwZWRXaXRoQXRvbX1cbiJdfQ==
