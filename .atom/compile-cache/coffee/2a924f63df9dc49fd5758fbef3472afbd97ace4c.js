(function() {
  var Spawner, WinPowerShell, WinShell, addCommandsToPath, appFolder, binFolder, createShortcuts, exeName, fs, path, removeCommandsFromPath, removeShortcuts, rootAtomFolder, setxPath, spawnSetx, spawnUpdate, system32Path, updateContextMenus, updateDotExe, updateShortcuts;

  fs = require('fs-plus');

  path = require('path');

  Spawner = require('./spawner');

  WinShell = require('./win-shell');

  WinPowerShell = require('./win-powershell');

  appFolder = path.resolve(process.execPath, '..');

  rootAtomFolder = path.resolve(appFolder, '..');

  binFolder = path.join(rootAtomFolder, 'bin');

  updateDotExe = path.join(rootAtomFolder, 'Update.exe');

  exeName = path.basename(process.execPath);

  if (process.env.SystemRoot) {
    system32Path = path.join(process.env.SystemRoot, 'System32');
    setxPath = path.join(system32Path, 'setx.exe');
  } else {
    setxPath = 'setx.exe';
  }

  spawnSetx = function(args, callback) {
    return Spawner.spawn(setxPath, args, callback);
  };

  spawnUpdate = function(args, callback) {
    return Spawner.spawn(updateDotExe, args, callback);
  };

  addCommandsToPath = function(callback) {
    var addBinToPath, installCommands;
    installCommands = function(callback) {
      var apmCommand, apmCommandPath, apmShCommand, apmShCommandPath, atomCommand, atomCommandPath, atomShCommand, atomShCommandPath, relativeApmPath, relativeApmShPath, relativeAtomPath, relativeAtomShPath;
      atomCommandPath = path.join(binFolder, 'atom.cmd');
      relativeAtomPath = path.relative(binFolder, path.join(appFolder, 'resources', 'cli', 'atom.cmd'));
      atomCommand = "@echo off\r\n\"%~dp0\\" + relativeAtomPath + "\" %*";
      atomShCommandPath = path.join(binFolder, 'atom');
      relativeAtomShPath = path.relative(binFolder, path.join(appFolder, 'resources', 'cli', 'atom.sh'));
      atomShCommand = "#!/bin/sh\r\n\"$(dirname \"$0\")/" + (relativeAtomShPath.replace(/\\/g, '/')) + "\" \"$@\"\r\necho";
      apmCommandPath = path.join(binFolder, 'apm.cmd');
      relativeApmPath = path.relative(binFolder, path.join(process.resourcesPath, 'app', 'apm', 'bin', 'apm.cmd'));
      apmCommand = "@echo off\r\n\"%~dp0\\" + relativeApmPath + "\" %*";
      apmShCommandPath = path.join(binFolder, 'apm');
      relativeApmShPath = path.relative(binFolder, path.join(appFolder, 'resources', 'cli', 'apm.sh'));
      apmShCommand = "#!/bin/sh\r\n\"$(dirname \"$0\")/" + (relativeApmShPath.replace(/\\/g, '/')) + "\" \"$@\"";
      return fs.writeFile(atomCommandPath, atomCommand, function() {
        return fs.writeFile(atomShCommandPath, atomShCommand, function() {
          return fs.writeFile(apmCommandPath, apmCommand, function() {
            return fs.writeFile(apmShCommandPath, apmShCommand, function() {
              return callback();
            });
          });
        });
      });
    };
    addBinToPath = function(pathSegments, callback) {
      var newPathEnv;
      pathSegments.push(binFolder);
      newPathEnv = pathSegments.join(';');
      return spawnSetx(['Path', newPathEnv], callback);
    };
    return installCommands(function(error) {
      if (error != null) {
        return callback(error);
      }
      return WinPowerShell.getPath(function(error, pathEnv) {
        var pathSegments;
        if (error != null) {
          return callback(error);
        }
        pathSegments = pathEnv.split(/;+/).filter(function(pathSegment) {
          return pathSegment;
        });
        if (pathSegments.indexOf(binFolder) === -1) {
          return addBinToPath(pathSegments, callback);
        } else {
          return callback();
        }
      });
    });
  };

  removeCommandsFromPath = function(callback) {
    return WinPowerShell.getPath(function(error, pathEnv) {
      var newPathEnv, pathSegments;
      if (error != null) {
        return callback(error);
      }
      pathSegments = pathEnv.split(/;+/).filter(function(pathSegment) {
        return pathSegment && pathSegment !== binFolder;
      });
      newPathEnv = pathSegments.join(';');
      if (pathEnv !== newPathEnv) {
        return spawnSetx(['Path', newPathEnv], callback);
      } else {
        return callback();
      }
    });
  };

  createShortcuts = function(callback) {
    return spawnUpdate(['--createShortcut', exeName], callback);
  };

  updateShortcuts = function(callback) {
    var desktopShortcutPath, homeDirectory;
    if (homeDirectory = fs.getHomeDirectory()) {
      desktopShortcutPath = path.join(homeDirectory, 'Desktop', 'Atom.lnk');
      return fs.exists(desktopShortcutPath, function(desktopShortcutExists) {
        return createShortcuts(function() {
          if (desktopShortcutExists) {
            return callback();
          } else {
            return fs.unlink(desktopShortcutPath, callback);
          }
        });
      });
    } else {
      return createShortcuts(callback);
    }
  };

  removeShortcuts = function(callback) {
    return spawnUpdate(['--removeShortcut', exeName], callback);
  };

  exports.spawn = spawnUpdate;

  exports.existsSync = function() {
    return fs.existsSync(updateDotExe);
  };

  exports.restartAtom = function(app) {
    var args, projectPath, ref, ref1;
    if (projectPath = (ref = global.atomApplication) != null ? (ref1 = ref.lastFocusedWindow) != null ? ref1.projectPath : void 0 : void 0) {
      args = [projectPath];
    }
    app.once('will-quit', function() {
      return Spawner.spawn(path.join(binFolder, 'atom.cmd'), args);
    });
    return app.quit();
  };

  updateContextMenus = function(callback) {
    return WinShell.fileContextMenu.update(function() {
      return WinShell.folderContextMenu.update(function() {
        return WinShell.folderBackgroundContextMenu.update(function() {
          return callback();
        });
      });
    });
  };

  exports.handleStartupEvent = function(app, squirrelCommand) {
    switch (squirrelCommand) {
      case '--squirrel-install':
        createShortcuts(function() {
          return addCommandsToPath(function() {
            return WinShell.fileHandler.register(function() {
              return updateContextMenus(function() {
                return app.quit();
              });
            });
          });
        });
        return true;
      case '--squirrel-updated':
        updateShortcuts(function() {
          return addCommandsToPath(function() {
            return WinShell.fileHandler.update(function() {
              return updateContextMenus(function() {
                return app.quit();
              });
            });
          });
        });
        return true;
      case '--squirrel-uninstall':
        removeShortcuts(function() {
          return removeCommandsFromPath(function() {
            return WinShell.fileHandler.deregister(function() {
              return WinShell.fileContextMenu.deregister(function() {
                return WinShell.folderContextMenu.deregister(function() {
                  return WinShell.folderBackgroundContextMenu.deregister(function() {
                    return app.quit();
                  });
                });
              });
            });
          });
        });
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
      default:
        return false;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3Mvc3F1aXJyZWwtdXBkYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0VBQ1YsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUVoQixTQUFBLEdBQVksSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFPLENBQUMsUUFBckIsRUFBK0IsSUFBL0I7O0VBQ1osY0FBQSxHQUFpQixJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsRUFBd0IsSUFBeEI7O0VBQ2pCLFNBQUEsR0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLGNBQVYsRUFBMEIsS0FBMUI7O0VBQ1osWUFBQSxHQUFlLElBQUksQ0FBQyxJQUFMLENBQVUsY0FBVixFQUEwQixZQUExQjs7RUFDZixPQUFBLEdBQVUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxPQUFPLENBQUMsUUFBdEI7O0VBRVYsSUFBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQWY7SUFDRSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQXRCLEVBQWtDLFVBQWxDO0lBQ2YsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF3QixVQUF4QixFQUZiO0dBQUEsTUFBQTtJQUlFLFFBQUEsR0FBVyxXQUpiOzs7RUFPQSxTQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sUUFBUDtXQUNWLE9BQU8sQ0FBQyxLQUFSLENBQWMsUUFBZCxFQUF3QixJQUF4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LEdBQUcsQ0FBQyxJQUFKLENBQUE7ZUFDQTtBQTFCSjtlQTRCSTtBQTVCSjtFQUQyQjtBQXRJN0IiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblNwYXduZXIgPSByZXF1aXJlICcuL3NwYXduZXInXG5XaW5TaGVsbCA9IHJlcXVpcmUgJy4vd2luLXNoZWxsJ1xuV2luUG93ZXJTaGVsbCA9IHJlcXVpcmUgJy4vd2luLXBvd2Vyc2hlbGwnXG5cbmFwcEZvbGRlciA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmV4ZWNQYXRoLCAnLi4nKVxucm9vdEF0b21Gb2xkZXIgPSBwYXRoLnJlc29sdmUoYXBwRm9sZGVyLCAnLi4nKVxuYmluRm9sZGVyID0gcGF0aC5qb2luKHJvb3RBdG9tRm9sZGVyLCAnYmluJylcbnVwZGF0ZURvdEV4ZSA9IHBhdGguam9pbihyb290QXRvbUZvbGRlciwgJ1VwZGF0ZS5leGUnKVxuZXhlTmFtZSA9IHBhdGguYmFzZW5hbWUocHJvY2Vzcy5leGVjUGF0aClcblxuaWYgcHJvY2Vzcy5lbnYuU3lzdGVtUm9vdFxuICBzeXN0ZW0zMlBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuU3lzdGVtUm9vdCwgJ1N5c3RlbTMyJylcbiAgc2V0eFBhdGggPSBwYXRoLmpvaW4oc3lzdGVtMzJQYXRoLCAnc2V0eC5leGUnKVxuZWxzZVxuICBzZXR4UGF0aCA9ICdzZXR4LmV4ZSdcblxuIyBTcGF3biBzZXR4LmV4ZSBhbmQgY2FsbGJhY2sgd2hlbiBpdCBjb21wbGV0ZXNcbnNwYXduU2V0eCA9IChhcmdzLCBjYWxsYmFjaykgLT5cbiAgU3Bhd25lci5zcGF3bihzZXR4UGF0aCwgYXJncywgY2FsbGJhY2spXG5cbiMgU3Bhd24gdGhlIFVwZGF0ZS5leGUgd2l0aCB0aGUgZ2l2ZW4gYXJndW1lbnRzIGFuZCBpbnZva2UgdGhlIGNhbGxiYWNrIHdoZW5cbiMgdGhlIGNvbW1hbmQgY29tcGxldGVzLlxuc3Bhd25VcGRhdGUgPSAoYXJncywgY2FsbGJhY2spIC0+XG4gIFNwYXduZXIuc3Bhd24odXBkYXRlRG90RXhlLCBhcmdzLCBjYWxsYmFjaylcblxuIyBBZGQgYXRvbSBhbmQgYXBtIHRvIHRoZSBQQVRIXG4jXG4jIFRoaXMgaXMgZG9uZSBieSBhZGRpbmcgLmNtZCBzaGltcyB0byB0aGUgcm9vdCBiaW4gZm9sZGVyIGluIHRoZSBBdG9tXG4jIGluc3RhbGwgZGlyZWN0b3J5IHRoYXQgcG9pbnQgdG8gdGhlIG5ld2x5IGluc3RhbGxlZCB2ZXJzaW9ucyBpbnNpZGVcbiMgdGhlIHZlcnNpb25lZCBhcHAgZGlyZWN0b3JpZXMuXG5hZGRDb21tYW5kc1RvUGF0aCA9IChjYWxsYmFjaykgLT5cbiAgaW5zdGFsbENvbW1hbmRzID0gKGNhbGxiYWNrKSAtPlxuICAgIGF0b21Db21tYW5kUGF0aCA9IHBhdGguam9pbihiaW5Gb2xkZXIsICdhdG9tLmNtZCcpXG4gICAgcmVsYXRpdmVBdG9tUGF0aCA9IHBhdGgucmVsYXRpdmUoYmluRm9sZGVyLCBwYXRoLmpvaW4oYXBwRm9sZGVyLCAncmVzb3VyY2VzJywgJ2NsaScsICdhdG9tLmNtZCcpKVxuICAgIGF0b21Db21tYW5kID0gXCJAZWNobyBvZmZcXHJcXG5cXFwiJX5kcDBcXFxcI3tyZWxhdGl2ZUF0b21QYXRofVxcXCIgJSpcIlxuXG4gICAgYXRvbVNoQ29tbWFuZFBhdGggPSBwYXRoLmpvaW4oYmluRm9sZGVyLCAnYXRvbScpXG4gICAgcmVsYXRpdmVBdG9tU2hQYXRoID0gcGF0aC5yZWxhdGl2ZShiaW5Gb2xkZXIsIHBhdGguam9pbihhcHBGb2xkZXIsICdyZXNvdXJjZXMnLCAnY2xpJywgJ2F0b20uc2gnKSlcbiAgICBhdG9tU2hDb21tYW5kID0gXCIjIS9iaW4vc2hcXHJcXG5cXFwiJChkaXJuYW1lIFxcXCIkMFxcXCIpLyN7cmVsYXRpdmVBdG9tU2hQYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKX1cXFwiIFxcXCIkQFxcXCJcXHJcXG5lY2hvXCJcblxuICAgIGFwbUNvbW1hbmRQYXRoID0gcGF0aC5qb2luKGJpbkZvbGRlciwgJ2FwbS5jbWQnKVxuICAgIHJlbGF0aXZlQXBtUGF0aCA9IHBhdGgucmVsYXRpdmUoYmluRm9sZGVyLCBwYXRoLmpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCAnYXBwJywgJ2FwbScsICdiaW4nLCAnYXBtLmNtZCcpKVxuICAgIGFwbUNvbW1hbmQgPSBcIkBlY2hvIG9mZlxcclxcblxcXCIlfmRwMFxcXFwje3JlbGF0aXZlQXBtUGF0aH1cXFwiICUqXCJcblxuICAgIGFwbVNoQ29tbWFuZFBhdGggPSBwYXRoLmpvaW4oYmluRm9sZGVyLCAnYXBtJylcbiAgICByZWxhdGl2ZUFwbVNoUGF0aCA9IHBhdGgucmVsYXRpdmUoYmluRm9sZGVyLCBwYXRoLmpvaW4oYXBwRm9sZGVyLCAncmVzb3VyY2VzJywgJ2NsaScsICdhcG0uc2gnKSlcbiAgICBhcG1TaENvbW1hbmQgPSBcIiMhL2Jpbi9zaFxcclxcblxcXCIkKGRpcm5hbWUgXFxcIiQwXFxcIikvI3tyZWxhdGl2ZUFwbVNoUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyl9XFxcIiBcXFwiJEBcXFwiXCJcblxuICAgIGZzLndyaXRlRmlsZSBhdG9tQ29tbWFuZFBhdGgsIGF0b21Db21tYW5kLCAtPlxuICAgICAgZnMud3JpdGVGaWxlIGF0b21TaENvbW1hbmRQYXRoLCBhdG9tU2hDb21tYW5kLCAtPlxuICAgICAgICBmcy53cml0ZUZpbGUgYXBtQ29tbWFuZFBhdGgsIGFwbUNvbW1hbmQsIC0+XG4gICAgICAgICAgZnMud3JpdGVGaWxlIGFwbVNoQ29tbWFuZFBhdGgsIGFwbVNoQ29tbWFuZCwgLT5cbiAgICAgICAgICAgIGNhbGxiYWNrKClcblxuICBhZGRCaW5Ub1BhdGggPSAocGF0aFNlZ21lbnRzLCBjYWxsYmFjaykgLT5cbiAgICBwYXRoU2VnbWVudHMucHVzaChiaW5Gb2xkZXIpXG4gICAgbmV3UGF0aEVudiA9IHBhdGhTZWdtZW50cy5qb2luKCc7JylcbiAgICBzcGF3blNldHgoWydQYXRoJywgbmV3UGF0aEVudl0sIGNhbGxiYWNrKVxuXG4gIGluc3RhbGxDb21tYW5kcyAoZXJyb3IpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKSBpZiBlcnJvcj9cblxuICAgIFdpblBvd2VyU2hlbGwuZ2V0UGF0aCAoZXJyb3IsIHBhdGhFbnYpIC0+XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpIGlmIGVycm9yP1xuXG4gICAgICBwYXRoU2VnbWVudHMgPSBwYXRoRW52LnNwbGl0KC87Ky8pLmZpbHRlciAocGF0aFNlZ21lbnQpIC0+IHBhdGhTZWdtZW50XG4gICAgICBpZiBwYXRoU2VnbWVudHMuaW5kZXhPZihiaW5Gb2xkZXIpIGlzIC0xXG4gICAgICAgIGFkZEJpblRvUGF0aChwYXRoU2VnbWVudHMsIGNhbGxiYWNrKVxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjaygpXG5cbiMgUmVtb3ZlIGF0b20gYW5kIGFwbSBmcm9tIHRoZSBQQVRIXG5yZW1vdmVDb21tYW5kc0Zyb21QYXRoID0gKGNhbGxiYWNrKSAtPlxuICBXaW5Qb3dlclNoZWxsLmdldFBhdGggKGVycm9yLCBwYXRoRW52KSAtPlxuICAgIHJldHVybiBjYWxsYmFjayhlcnJvcikgaWYgZXJyb3I/XG5cbiAgICBwYXRoU2VnbWVudHMgPSBwYXRoRW52LnNwbGl0KC87Ky8pLmZpbHRlciAocGF0aFNlZ21lbnQpIC0+XG4gICAgICBwYXRoU2VnbWVudCBhbmQgcGF0aFNlZ21lbnQgaXNudCBiaW5Gb2xkZXJcbiAgICBuZXdQYXRoRW52ID0gcGF0aFNlZ21lbnRzLmpvaW4oJzsnKVxuXG4gICAgaWYgcGF0aEVudiBpc250IG5ld1BhdGhFbnZcbiAgICAgIHNwYXduU2V0eChbJ1BhdGgnLCBuZXdQYXRoRW52XSwgY2FsbGJhY2spXG4gICAgZWxzZVxuICAgICAgY2FsbGJhY2soKVxuXG4jIENyZWF0ZSBhIGRlc2t0b3AgYW5kIHN0YXJ0IG1lbnUgc2hvcnRjdXQgYnkgdXNpbmcgdGhlIGNvbW1hbmQgbGluZSBBUElcbiMgcHJvdmlkZWQgYnkgU3F1aXJyZWwncyBVcGRhdGUuZXhlXG5jcmVhdGVTaG9ydGN1dHMgPSAoY2FsbGJhY2spIC0+XG4gIHNwYXduVXBkYXRlKFsnLS1jcmVhdGVTaG9ydGN1dCcsIGV4ZU5hbWVdLCBjYWxsYmFjaylcblxuIyBVcGRhdGUgdGhlIGRlc2t0b3AgYW5kIHN0YXJ0IG1lbnUgc2hvcnRjdXRzIGJ5IHVzaW5nIHRoZSBjb21tYW5kIGxpbmUgQVBJXG4jIHByb3ZpZGVkIGJ5IFNxdWlycmVsJ3MgVXBkYXRlLmV4ZVxudXBkYXRlU2hvcnRjdXRzID0gKGNhbGxiYWNrKSAtPlxuICBpZiBob21lRGlyZWN0b3J5ID0gZnMuZ2V0SG9tZURpcmVjdG9yeSgpXG4gICAgZGVza3RvcFNob3J0Y3V0UGF0aCA9IHBhdGguam9pbihob21lRGlyZWN0b3J5LCAnRGVza3RvcCcsICdBdG9tLmxuaycpXG4gICAgIyBDaGVjayBpZiB0aGUgZGVza3RvcCBzaG9ydGN1dCBoYXMgYmVlbiBwcmV2aW91c2x5IGRlbGV0ZWQgYW5kXG4gICAgIyBhbmQga2VlcCBpdCBkZWxldGVkIGlmIGl0IHdhc1xuICAgIGZzLmV4aXN0cyBkZXNrdG9wU2hvcnRjdXRQYXRoLCAoZGVza3RvcFNob3J0Y3V0RXhpc3RzKSAtPlxuICAgICAgY3JlYXRlU2hvcnRjdXRzIC0+XG4gICAgICAgIGlmIGRlc2t0b3BTaG9ydGN1dEV4aXN0c1xuICAgICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICMgUmVtb3ZlIHRoZSB1bndhbnRlZCBkZXNrdG9wIHNob3J0Y3V0IHRoYXQgd2FzIHJlY3JlYXRlZFxuICAgICAgICAgIGZzLnVubGluayhkZXNrdG9wU2hvcnRjdXRQYXRoLCBjYWxsYmFjaylcbiAgZWxzZVxuICAgIGNyZWF0ZVNob3J0Y3V0cyhjYWxsYmFjaylcblxuIyBSZW1vdmUgdGhlIGRlc2t0b3AgYW5kIHN0YXJ0IG1lbnUgc2hvcnRjdXRzIGJ5IHVzaW5nIHRoZSBjb21tYW5kIGxpbmUgQVBJXG4jIHByb3ZpZGVkIGJ5IFNxdWlycmVsJ3MgVXBkYXRlLmV4ZVxucmVtb3ZlU2hvcnRjdXRzID0gKGNhbGxiYWNrKSAtPlxuICBzcGF3blVwZGF0ZShbJy0tcmVtb3ZlU2hvcnRjdXQnLCBleGVOYW1lXSwgY2FsbGJhY2spXG5cbmV4cG9ydHMuc3Bhd24gPSBzcGF3blVwZGF0ZVxuXG4jIElzIHRoZSBVcGRhdGUuZXhlIGluc3RhbGxlZCB3aXRoIEF0b20/XG5leHBvcnRzLmV4aXN0c1N5bmMgPSAtPlxuICBmcy5leGlzdHNTeW5jKHVwZGF0ZURvdEV4ZSlcblxuIyBSZXN0YXJ0IEF0b20gdXNpbmcgdGhlIHZlcnNpb24gcG9pbnRlZCB0byBieSB0aGUgYXRvbS5jbWQgc2hpbVxuZXhwb3J0cy5yZXN0YXJ0QXRvbSA9IChhcHApIC0+XG4gIGlmIHByb2plY3RQYXRoID0gZ2xvYmFsLmF0b21BcHBsaWNhdGlvbj8ubGFzdEZvY3VzZWRXaW5kb3c/LnByb2plY3RQYXRoXG4gICAgYXJncyA9IFtwcm9qZWN0UGF0aF1cbiAgYXBwLm9uY2UgJ3dpbGwtcXVpdCcsIC0+IFNwYXduZXIuc3Bhd24ocGF0aC5qb2luKGJpbkZvbGRlciwgJ2F0b20uY21kJyksIGFyZ3MpXG4gIGFwcC5xdWl0KClcblxudXBkYXRlQ29udGV4dE1lbnVzID0gKGNhbGxiYWNrKSAtPlxuICBXaW5TaGVsbC5maWxlQ29udGV4dE1lbnUudXBkYXRlIC0+XG4gICAgV2luU2hlbGwuZm9sZGVyQ29udGV4dE1lbnUudXBkYXRlIC0+XG4gICAgICBXaW5TaGVsbC5mb2xkZXJCYWNrZ3JvdW5kQ29udGV4dE1lbnUudXBkYXRlIC0+XG4gICAgICAgIGNhbGxiYWNrKClcblxuIyBIYW5kbGUgc3F1aXJyZWwgZXZlbnRzIGRlbm90ZWQgYnkgLS1zcXVpcnJlbC0qIGNvbW1hbmQgbGluZSBhcmd1bWVudHMuXG5leHBvcnRzLmhhbmRsZVN0YXJ0dXBFdmVudCA9IChhcHAsIHNxdWlycmVsQ29tbWFuZCkgLT5cbiAgc3dpdGNoIHNxdWlycmVsQ29tbWFuZFxuICAgIHdoZW4gJy0tc3F1aXJyZWwtaW5zdGFsbCdcbiAgICAgIGNyZWF0ZVNob3J0Y3V0cyAtPlxuICAgICAgICBhZGRDb21tYW5kc1RvUGF0aCAtPlxuICAgICAgICAgIFdpblNoZWxsLmZpbGVIYW5kbGVyLnJlZ2lzdGVyIC0+XG4gICAgICAgICAgICB1cGRhdGVDb250ZXh0TWVudXMgLT5cbiAgICAgICAgICAgICAgYXBwLnF1aXQoKVxuICAgICAgdHJ1ZVxuICAgIHdoZW4gJy0tc3F1aXJyZWwtdXBkYXRlZCdcbiAgICAgIHVwZGF0ZVNob3J0Y3V0cyAtPlxuICAgICAgICBhZGRDb21tYW5kc1RvUGF0aCAtPlxuICAgICAgICAgIFdpblNoZWxsLmZpbGVIYW5kbGVyLnVwZGF0ZSAtPlxuICAgICAgICAgICAgdXBkYXRlQ29udGV4dE1lbnVzIC0+XG4gICAgICAgICAgICAgIGFwcC5xdWl0KClcbiAgICAgIHRydWVcbiAgICB3aGVuICctLXNxdWlycmVsLXVuaW5zdGFsbCdcbiAgICAgIHJlbW92ZVNob3J0Y3V0cyAtPlxuICAgICAgICByZW1vdmVDb21tYW5kc0Zyb21QYXRoIC0+XG4gICAgICAgICAgV2luU2hlbGwuZmlsZUhhbmRsZXIuZGVyZWdpc3RlciAtPlxuICAgICAgICAgICAgV2luU2hlbGwuZmlsZUNvbnRleHRNZW51LmRlcmVnaXN0ZXIgLT5cbiAgICAgICAgICAgICAgV2luU2hlbGwuZm9sZGVyQ29udGV4dE1lbnUuZGVyZWdpc3RlciAtPlxuICAgICAgICAgICAgICAgIFdpblNoZWxsLmZvbGRlckJhY2tncm91bmRDb250ZXh0TWVudS5kZXJlZ2lzdGVyIC0+XG4gICAgICAgICAgICAgICAgICBhcHAucXVpdCgpXG4gICAgICB0cnVlXG4gICAgd2hlbiAnLS1zcXVpcnJlbC1vYnNvbGV0ZSdcbiAgICAgIGFwcC5xdWl0KClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuIl19
