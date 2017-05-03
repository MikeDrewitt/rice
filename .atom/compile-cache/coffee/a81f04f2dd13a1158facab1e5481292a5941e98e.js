(function() {
  var $, BufferedProcess, PackageGeneratorView, TextEditorView, View, _, fs, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, TextEditorView = ref.TextEditorView, View = ref.View;

  BufferedProcess = require('atom').BufferedProcess;

  fs = require('fs-plus');

  module.exports = PackageGeneratorView = (function(superClass) {
    extend(PackageGeneratorView, superClass);

    function PackageGeneratorView() {
      return PackageGeneratorView.__super__.constructor.apply(this, arguments);
    }

    PackageGeneratorView.prototype.previouslyFocusedElement = null;

    PackageGeneratorView.prototype.mode = null;

    PackageGeneratorView.content = function() {
      return this.div({
        "class": 'package-generator'
      }, (function(_this) {
        return function() {
          _this.subview('miniEditor', new TextEditorView({
            mini: true
          }));
          _this.div({
            "class": 'error',
            outlet: 'error'
          });
          return _this.div({
            "class": 'message',
            outlet: 'message'
          });
        };
      })(this));
    };

    PackageGeneratorView.prototype.initialize = function() {
      this.commandSubscription = atom.commands.add('atom-workspace', {
        'package-generator:generate-package': (function(_this) {
          return function() {
            return _this.attach('package');
          };
        })(this),
        'package-generator:generate-syntax-theme': (function(_this) {
          return function() {
            return _this.attach('theme');
          };
        })(this)
      });
      this.miniEditor.on('blur', (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
      return atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.close();
          };
        })(this)
      });
    };

    PackageGeneratorView.prototype.destroy = function() {
      var ref1;
      if ((ref1 = this.panel) != null) {
        ref1.destroy();
      }
      return this.commandSubscription.dispose();
    };

    PackageGeneratorView.prototype.attach = function(mode) {
      this.mode = mode;
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this,
          visible: false
        });
      }
      this.previouslyFocusedElement = $(document.activeElement);
      this.panel.show();
      this.message.text("Enter " + this.mode + " path");
      if (this.isInPackageMode()) {
        this.setPathText("my-package");
      } else {
        this.setPathText("my-theme-syntax", [0, 8]);
      }
      return this.miniEditor.focus();
    };

    PackageGeneratorView.prototype.setPathText = function(placeholderName, rangeToSelect) {
      var editor, endOfDirectoryIndex, packagesDirectory, pathLength;
      editor = this.miniEditor.getModel();
      if (rangeToSelect == null) {
        rangeToSelect = [0, placeholderName.length];
      }
      packagesDirectory = this.getPackagesDirectory();
      editor.setText(path.join(packagesDirectory, placeholderName));
      pathLength = editor.getText().length;
      endOfDirectoryIndex = pathLength - placeholderName.length;
      return editor.setSelectedBufferRange([[0, endOfDirectoryIndex + rangeToSelect[0]], [0, endOfDirectoryIndex + rangeToSelect[1]]]);
    };

    PackageGeneratorView.prototype.close = function() {
      var ref1;
      if (!this.panel.isVisible()) {
        return;
      }
      this.panel.hide();
      return (ref1 = this.previouslyFocusedElement) != null ? ref1.focus() : void 0;
    };

    PackageGeneratorView.prototype.confirm = function() {
      if (this.validPackagePath()) {
        return this.createPackageFiles((function(_this) {
          return function() {
            var packagePath;
            packagePath = _this.getPackagePath();
            atom.open({
              pathsToOpen: [packagePath]
            });
            return _this.close();
          };
        })(this));
      }
    };

    PackageGeneratorView.prototype.getPackagePath = function() {
      var packageName, packagePath;
      packagePath = fs.normalize(this.miniEditor.getText().trim());
      packageName = _.dasherize(path.basename(packagePath));
      return path.join(path.dirname(packagePath), packageName);
    };

    PackageGeneratorView.prototype.getPackagesDirectory = function() {
      return atom.config.get('core.projectHome') || process.env.ATOM_REPOS_HOME || path.join(fs.getHomeDirectory(), 'github');
    };

    PackageGeneratorView.prototype.validPackagePath = function() {
      if (fs.existsSync(this.getPackagePath())) {
        this.error.text("Path already exists at '" + (this.getPackagePath()) + "'");
        this.error.show();
        return false;
      } else {
        return true;
      }
    };

    PackageGeneratorView.prototype.getInitOptions = function(packagePath) {
      var options;
      options = ["--" + this.mode, packagePath];
      if (this.isInPackageMode()) {
        return slice.call(options).concat(['--syntax'], [atom.config.get('package-generator.packageSyntax')]);
      } else {
        return options;
      }
    };

    PackageGeneratorView.prototype.initPackage = function(packagePath, callback) {
      var command;
      command = ['init'].concat(slice.call(this.getInitOptions(packagePath)));
      return this.runCommand(atom.packages.getApmPath(), command, callback);
    };

    PackageGeneratorView.prototype.linkPackage = function(packagePath, callback) {
      var args;
      args = ['link'];
      if (atom.config.get('package-generator.createInDevMode')) {
        args.push('--dev');
      }
      args.push(packagePath.toString());
      return this.runCommand(atom.packages.getApmPath(), args, callback);
    };

    PackageGeneratorView.prototype.isInPackageMode = function() {
      return this.mode === 'package';
    };

    PackageGeneratorView.prototype.isStoredInDotAtom = function(packagePath) {
      var devPackagesPath, packagesPath;
      packagesPath = path.join(atom.getConfigDirPath(), 'packages', path.sep);
      if (packagePath.indexOf(packagesPath) === 0) {
        return true;
      }
      devPackagesPath = path.join(atom.getConfigDirPath(), 'dev', 'packages', path.sep);
      return packagePath.indexOf(devPackagesPath) === 0;
    };

    PackageGeneratorView.prototype.createPackageFiles = function(callback) {
      var packagePath;
      packagePath = this.getPackagePath();
      if (this.isStoredInDotAtom(packagePath)) {
        return this.initPackage(packagePath, callback);
      } else {
        return this.initPackage(packagePath, (function(_this) {
          return function() {
            return _this.linkPackage(packagePath, callback);
          };
        })(this));
      }
    };

    PackageGeneratorView.prototype.runCommand = function(command, args, exit) {
      return new BufferedProcess({
        command: command,
        args: args,
        exit: exit
      });
    };

    return PackageGeneratorView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9wYWNrYWdlLWdlbmVyYXRvci9saWIvcGFja2FnZS1nZW5lcmF0b3Itdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdGQUFBO0lBQUE7Ozs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUE0QixPQUFBLENBQVEsc0JBQVIsQ0FBNUIsRUFBQyxTQUFELEVBQUksbUNBQUosRUFBb0I7O0VBQ25CLGtCQUFtQixPQUFBLENBQVEsTUFBUjs7RUFDcEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUVMLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7bUNBQ0osd0JBQUEsR0FBMEI7O21DQUMxQixJQUFBLEdBQU07O0lBRU4sb0JBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO09BQUwsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQy9CLEtBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxFQUEyQixJQUFBLGNBQUEsQ0FBZTtZQUFBLElBQUEsRUFBTSxJQUFOO1dBQWYsQ0FBM0I7VUFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxPQUFQO1lBQWdCLE1BQUEsRUFBUSxPQUF4QjtXQUFMO2lCQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7WUFBa0IsTUFBQSxFQUFRLFNBQTFCO1dBQUw7UUFIK0I7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpDO0lBRFE7O21D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LElBQWhCO2FBQ04sSUFBQSxlQUFBLENBQWdCO1FBQUMsU0FBQSxPQUFEO1FBQVUsTUFBQSxJQUFWO1FBQWdCLE1BQUEsSUFBaEI7T0FBaEI7SUFETTs7OztLQTlHcUI7QUFQbkMiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57JCwgVGV4dEVkaXRvclZpZXcsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57QnVmZmVyZWRQcm9jZXNzfSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VHZW5lcmF0b3JWaWV3IGV4dGVuZHMgVmlld1xuICBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ6IG51bGxcbiAgbW9kZTogbnVsbFxuXG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdwYWNrYWdlLWdlbmVyYXRvcicsID0+XG4gICAgICBAc3VidmlldyAnbWluaUVkaXRvcicsIG5ldyBUZXh0RWRpdG9yVmlldyhtaW5pOiB0cnVlKVxuICAgICAgQGRpdiBjbGFzczogJ2Vycm9yJywgb3V0bGV0OiAnZXJyb3InXG4gICAgICBAZGl2IGNsYXNzOiAnbWVzc2FnZScsIG91dGxldDogJ21lc3NhZ2UnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAncGFja2FnZS1nZW5lcmF0b3I6Z2VuZXJhdGUtcGFja2FnZSc6ID0+IEBhdHRhY2goJ3BhY2thZ2UnKVxuICAgICAgJ3BhY2thZ2UtZ2VuZXJhdG9yOmdlbmVyYXRlLXN5bnRheC10aGVtZSc6ID0+IEBhdHRhY2goJ3RoZW1lJylcblxuICAgIEBtaW5pRWRpdG9yLm9uICdibHVyJywgPT4gQGNsb3NlKClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZWxlbWVudCxcbiAgICAgICdjb3JlOmNvbmZpcm0nOiA9PiBAY29uZmlybSgpXG4gICAgICAnY29yZTpjYW5jZWwnOiA9PiBAY2xvc2UoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHBhbmVsPy5kZXN0cm95KClcbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbi5kaXNwb3NlKClcblxuICBhdHRhY2g6IChAbW9kZSkgLT5cbiAgICBAcGFuZWwgPz0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB0aGlzLCB2aXNpYmxlOiBmYWxzZSlcbiAgICBAcHJldmlvdXNseUZvY3VzZWRFbGVtZW50ID0gJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAbWVzc2FnZS50ZXh0KFwiRW50ZXIgI3tAbW9kZX0gcGF0aFwiKVxuICAgIGlmIEBpc0luUGFja2FnZU1vZGUoKVxuICAgICAgQHNldFBhdGhUZXh0KFwibXktcGFja2FnZVwiKVxuICAgIGVsc2VcbiAgICAgIEBzZXRQYXRoVGV4dChcIm15LXRoZW1lLXN5bnRheFwiLCBbMCwgOF0pXG4gICAgQG1pbmlFZGl0b3IuZm9jdXMoKVxuXG4gIHNldFBhdGhUZXh0OiAocGxhY2Vob2xkZXJOYW1lLCByYW5nZVRvU2VsZWN0KSAtPlxuICAgIGVkaXRvciA9IEBtaW5pRWRpdG9yLmdldE1vZGVsKClcbiAgICByYW5nZVRvU2VsZWN0ID89IFswLCBwbGFjZWhvbGRlck5hbWUubGVuZ3RoXVxuICAgIHBhY2thZ2VzRGlyZWN0b3J5ID0gQGdldFBhY2thZ2VzRGlyZWN0b3J5KClcbiAgICBlZGl0b3Iuc2V0VGV4dChwYXRoLmpvaW4ocGFja2FnZXNEaXJlY3RvcnksIHBsYWNlaG9sZGVyTmFtZSkpXG4gICAgcGF0aExlbmd0aCA9IGVkaXRvci5nZXRUZXh0KCkubGVuZ3RoXG4gICAgZW5kT2ZEaXJlY3RvcnlJbmRleCA9IHBhdGhMZW5ndGggLSBwbGFjZWhvbGRlck5hbWUubGVuZ3RoXG4gICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoW1swLCBlbmRPZkRpcmVjdG9yeUluZGV4ICsgcmFuZ2VUb1NlbGVjdFswXV0sIFswLCBlbmRPZkRpcmVjdG9yeUluZGV4ICsgcmFuZ2VUb1NlbGVjdFsxXV1dKVxuXG4gIGNsb3NlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgQHBhbmVsLmhpZGUoKVxuICAgIEBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ/LmZvY3VzKClcblxuICBjb25maXJtOiAtPlxuICAgIGlmIEB2YWxpZFBhY2thZ2VQYXRoKClcbiAgICAgIEBjcmVhdGVQYWNrYWdlRmlsZXMgPT5cbiAgICAgICAgcGFja2FnZVBhdGggPSBAZ2V0UGFja2FnZVBhdGgoKVxuICAgICAgICBhdG9tLm9wZW4ocGF0aHNUb09wZW46IFtwYWNrYWdlUGF0aF0pXG4gICAgICAgIEBjbG9zZSgpXG5cbiAgZ2V0UGFja2FnZVBhdGg6IC0+XG4gICAgcGFja2FnZVBhdGggPSBmcy5ub3JtYWxpemUoQG1pbmlFZGl0b3IuZ2V0VGV4dCgpLnRyaW0oKSlcbiAgICBwYWNrYWdlTmFtZSA9IF8uZGFzaGVyaXplKHBhdGguYmFzZW5hbWUocGFja2FnZVBhdGgpKVxuICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUocGFja2FnZVBhdGgpLCBwYWNrYWdlTmFtZSlcblxuICBnZXRQYWNrYWdlc0RpcmVjdG9yeTogLT5cbiAgICBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUucHJvamVjdEhvbWUnKSBvclxuICAgICAgcHJvY2Vzcy5lbnYuQVRPTV9SRVBPU19IT01FIG9yXG4gICAgICBwYXRoLmpvaW4oZnMuZ2V0SG9tZURpcmVjdG9yeSgpLCAnZ2l0aHViJylcblxuICB2YWxpZFBhY2thZ2VQYXRoOiAtPlxuICAgIGlmIGZzLmV4aXN0c1N5bmMoQGdldFBhY2thZ2VQYXRoKCkpXG4gICAgICBAZXJyb3IudGV4dChcIlBhdGggYWxyZWFkeSBleGlzdHMgYXQgJyN7QGdldFBhY2thZ2VQYXRoKCl9J1wiKVxuICAgICAgQGVycm9yLnNob3coKVxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICB0cnVlXG5cbiAgZ2V0SW5pdE9wdGlvbnM6IChwYWNrYWdlUGF0aCkgLT5cbiAgICBvcHRpb25zID0gW1wiLS0je0Btb2RlfVwiLCBwYWNrYWdlUGF0aF1cbiAgICBpZiBAaXNJblBhY2thZ2VNb2RlKClcbiAgICAgIFtvcHRpb25zLi4uLCAnLS1zeW50YXgnLCBhdG9tLmNvbmZpZy5nZXQoJ3BhY2thZ2UtZ2VuZXJhdG9yLnBhY2thZ2VTeW50YXgnKV1cbiAgICBlbHNlXG4gICAgICBvcHRpb25zXG5cbiAgaW5pdFBhY2thZ2U6IChwYWNrYWdlUGF0aCwgY2FsbGJhY2spIC0+XG4gICAgY29tbWFuZCA9IFsnaW5pdCcsIEBnZXRJbml0T3B0aW9ucyhwYWNrYWdlUGF0aCkuLi5dXG4gICAgQHJ1bkNvbW1hbmQoYXRvbS5wYWNrYWdlcy5nZXRBcG1QYXRoKCksIGNvbW1hbmQsIGNhbGxiYWNrKVxuXG4gIGxpbmtQYWNrYWdlOiAocGFja2FnZVBhdGgsIGNhbGxiYWNrKSAtPlxuICAgIGFyZ3MgPSBbJ2xpbmsnXVxuICAgIGFyZ3MucHVzaCgnLS1kZXYnKSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3BhY2thZ2UtZ2VuZXJhdG9yLmNyZWF0ZUluRGV2TW9kZScpXG4gICAgYXJncy5wdXNoIHBhY2thZ2VQYXRoLnRvU3RyaW5nKClcblxuICAgIEBydW5Db21tYW5kKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpLCBhcmdzLCBjYWxsYmFjaylcblxuICBpc0luUGFja2FnZU1vZGU6IC0+XG4gICAgQG1vZGUgaXMgJ3BhY2thZ2UnXG5cbiAgaXNTdG9yZWRJbkRvdEF0b206IChwYWNrYWdlUGF0aCkgLT5cbiAgICBwYWNrYWdlc1BhdGggPSBwYXRoLmpvaW4oYXRvbS5nZXRDb25maWdEaXJQYXRoKCksICdwYWNrYWdlcycsIHBhdGguc2VwKVxuICAgIHJldHVybiB0cnVlIGlmIHBhY2thZ2VQYXRoLmluZGV4T2YocGFja2FnZXNQYXRoKSBpcyAwXG5cbiAgICBkZXZQYWNrYWdlc1BhdGggPSBwYXRoLmpvaW4oYXRvbS5nZXRDb25maWdEaXJQYXRoKCksICdkZXYnLCAncGFja2FnZXMnLCBwYXRoLnNlcClcbiAgICBwYWNrYWdlUGF0aC5pbmRleE9mKGRldlBhY2thZ2VzUGF0aCkgaXMgMFxuXG4gIGNyZWF0ZVBhY2thZ2VGaWxlczogKGNhbGxiYWNrKSAtPlxuICAgIHBhY2thZ2VQYXRoID0gQGdldFBhY2thZ2VQYXRoKClcblxuICAgIGlmIEBpc1N0b3JlZEluRG90QXRvbShwYWNrYWdlUGF0aClcbiAgICAgIEBpbml0UGFja2FnZShwYWNrYWdlUGF0aCwgY2FsbGJhY2spXG4gICAgZWxzZVxuICAgICAgQGluaXRQYWNrYWdlIHBhY2thZ2VQYXRoLCA9PiBAbGlua1BhY2thZ2UocGFja2FnZVBhdGgsIGNhbGxiYWNrKVxuXG4gIHJ1bkNvbW1hbmQ6IChjb21tYW5kLCBhcmdzLCBleGl0KSAtPlxuICAgIG5ldyBCdWZmZXJlZFByb2Nlc3Moe2NvbW1hbmQsIGFyZ3MsIGV4aXR9KVxuIl19
