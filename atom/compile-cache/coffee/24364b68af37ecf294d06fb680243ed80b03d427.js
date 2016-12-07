(function() {
  var AddDialog, Dialog, fs, path, repoForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  repoForPath = require('./helpers').repoForPath;

  module.exports = AddDialog = (function(superClass) {
    extend(AddDialog, superClass);

    function AddDialog(initialPath, isCreatingFile) {
      var directoryPath, ref, relativeDirectoryPath;
      this.isCreatingFile = isCreatingFile;
      if (fs.isFileSync(initialPath)) {
        directoryPath = path.dirname(initialPath);
      } else {
        directoryPath = initialPath;
      }
      relativeDirectoryPath = directoryPath;
      ref = atom.project.relativizePath(directoryPath), this.rootProjectPath = ref[0], relativeDirectoryPath = ref[1];
      if (relativeDirectoryPath.length > 0) {
        relativeDirectoryPath += path.sep;
      }
      AddDialog.__super__.constructor.call(this, {
        prompt: "Enter the path for the new " + (isCreatingFile ? "file." : "folder."),
        initialPath: relativeDirectoryPath,
        select: false,
        iconClass: isCreatingFile ? 'icon-file-add' : 'icon-file-directory-create'
      });
    }

    AddDialog.prototype.onConfirm = function(newPath) {
      var endsWithDirectorySeparator, error, ref;
      newPath = newPath.replace(/\s+$/, '');
      endsWithDirectorySeparator = newPath[newPath.length - 1] === path.sep;
      if (!path.isAbsolute(newPath)) {
        if (this.rootProjectPath == null) {
          this.showError("You must open a directory to create a file with a relative path");
          return;
        }
        newPath = path.join(this.rootProjectPath, newPath);
      }
      if (!newPath) {
        return;
      }
      try {
        if (fs.existsSync(newPath)) {
          return this.showError("'" + newPath + "' already exists.");
        } else if (this.isCreatingFile) {
          if (endsWithDirectorySeparator) {
            return this.showError("File names must not end with a '" + path.sep + "' character.");
          } else {
            fs.writeFileSync(newPath, '');
            if ((ref = repoForPath(newPath)) != null) {
              ref.getPathStatus(newPath);
            }
            this.trigger('file-created', [newPath]);
            return this.close();
          }
        } else {
          fs.makeTreeSync(newPath);
          this.trigger('directory-created', [newPath]);
          return this.cancel();
        }
      } catch (error1) {
        error = error1;
        return this.showError(error.message + ".");
      }
    };

    return AddDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2FkZC1kaWFsb2cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3Q0FBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7RUFDUixjQUFlLE9BQUEsQ0FBUSxXQUFSOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxtQkFBQyxXQUFELEVBQWMsY0FBZDtBQUNYLFVBQUE7TUFBQSxJQUFDLENBQUEsY0FBRCxHQUFrQjtNQUVsQixJQUFHLEVBQUUsQ0FBQyxVQUFILENBQWMsV0FBZCxDQUFIO1FBQ0UsYUFBQSxHQUFnQixJQUFJLENBQUMsT0FBTCxDQUFhLFdBQWIsRUFEbEI7T0FBQSxNQUFBO1FBR0UsYUFBQSxHQUFnQixZQUhsQjs7TUFLQSxxQkFBQSxHQUF3QjtNQUN4QixNQUE0QyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsYUFBNUIsQ0FBNUMsRUFBQyxJQUFDLENBQUEsd0JBQUYsRUFBbUI7TUFDbkIsSUFBcUMscUJBQXFCLENBQUMsTUFBdEIsR0FBK0IsQ0FBcEU7UUFBQSxxQkFBQSxJQUF5QixJQUFJLENBQUMsSUFBOUI7O01BRUEsMkNBQ0U7UUFBQSxNQUFBLEVBQVEsNkJBQUEsR0FBZ0MsQ0FBRyxjQUFILEdBQXVCLE9BQXZCLEdBQW9DLFNBQXBDLENBQXhDO1FBQ0EsV0FBQSxFQUFhLHFCQURiO1FBRUEsTUFBQSxFQUFRLEtBRlI7UUFHQSxTQUFBLEVBQWMsY0FBSCxHQUF1QixlQUF2QixHQUE0Qyw0QkFIdkQ7T0FERjtJQVpXOzt3QkFrQmIsU0FBQSxHQUFXLFNBQUMsT0FBRDtBQUNULFVBQUE7TUFBQSxPQUFBLEdBQVUsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsTUFBaEIsRUFBd0IsRUFBeEI7TUFDViwwQkFBQSxHQUE2QixPQUFRLENBQUEsT0FBTyxDQUFDLE1BQVIsR0FBaUIsQ0FBakIsQ0FBUixLQUErQixJQUFJLENBQUM7TUFDakUsSUFBQSxDQUFPLElBQUksQ0FBQyxVQUFMLENBQWdCLE9BQWhCLENBQVA7UUFDRSxJQUFPLDRCQUFQO1VBQ0UsSUFBQyxDQUFBLFNBQUQsQ0FBVyxpRUFBWDtBQUNBLGlCQUZGOztRQUlBLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxlQUFYLEVBQTRCLE9BQTVCLEVBTFo7O01BT0EsSUFBQSxDQUFjLE9BQWQ7QUFBQSxlQUFBOztBQUVBO1FBQ0UsSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLE9BQWQsQ0FBSDtpQkFDRSxJQUFDLENBQUEsU0FBRCxDQUFXLEdBQUEsR0FBSSxPQUFKLEdBQVksbUJBQXZCLEVBREY7U0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGNBQUo7VUFDSCxJQUFHLDBCQUFIO21CQUNFLElBQUMsQ0FBQSxTQUFELENBQVcsa0NBQUEsR0FBbUMsSUFBSSxDQUFDLEdBQXhDLEdBQTRDLGNBQXZELEVBREY7V0FBQSxNQUFBO1lBR0UsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsT0FBakIsRUFBMEIsRUFBMUI7O2lCQUNvQixDQUFFLGFBQXRCLENBQW9DLE9BQXBDOztZQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxFQUF5QixDQUFDLE9BQUQsQ0FBekI7bUJBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQU5GO1dBREc7U0FBQSxNQUFBO1VBU0gsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsT0FBaEI7VUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULEVBQThCLENBQUMsT0FBRCxDQUE5QjtpQkFDQSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBWEc7U0FIUDtPQUFBLGNBQUE7UUFlTTtlQUNKLElBQUMsQ0FBQSxTQUFELENBQWMsS0FBSyxDQUFDLE9BQVAsR0FBZSxHQUE1QixFQWhCRjs7SUFaUzs7OztLQW5CVztBQU54QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuRGlhbG9nID0gcmVxdWlyZSAnLi9kaWFsb2cnXG57cmVwb0ZvclBhdGh9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBZGREaWFsb2cgZXh0ZW5kcyBEaWFsb2dcbiAgY29uc3RydWN0b3I6IChpbml0aWFsUGF0aCwgaXNDcmVhdGluZ0ZpbGUpIC0+XG4gICAgQGlzQ3JlYXRpbmdGaWxlID0gaXNDcmVhdGluZ0ZpbGVcblxuICAgIGlmIGZzLmlzRmlsZVN5bmMoaW5pdGlhbFBhdGgpXG4gICAgICBkaXJlY3RvcnlQYXRoID0gcGF0aC5kaXJuYW1lKGluaXRpYWxQYXRoKVxuICAgIGVsc2VcbiAgICAgIGRpcmVjdG9yeVBhdGggPSBpbml0aWFsUGF0aFxuXG4gICAgcmVsYXRpdmVEaXJlY3RvcnlQYXRoID0gZGlyZWN0b3J5UGF0aFxuICAgIFtAcm9vdFByb2plY3RQYXRoLCByZWxhdGl2ZURpcmVjdG9yeVBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGRpcmVjdG9yeVBhdGgpXG4gICAgcmVsYXRpdmVEaXJlY3RvcnlQYXRoICs9IHBhdGguc2VwIGlmIHJlbGF0aXZlRGlyZWN0b3J5UGF0aC5sZW5ndGggPiAwXG5cbiAgICBzdXBlclxuICAgICAgcHJvbXB0OiBcIkVudGVyIHRoZSBwYXRoIGZvciB0aGUgbmV3IFwiICsgaWYgaXNDcmVhdGluZ0ZpbGUgdGhlbiBcImZpbGUuXCIgZWxzZSBcImZvbGRlci5cIlxuICAgICAgaW5pdGlhbFBhdGg6IHJlbGF0aXZlRGlyZWN0b3J5UGF0aFxuICAgICAgc2VsZWN0OiBmYWxzZVxuICAgICAgaWNvbkNsYXNzOiBpZiBpc0NyZWF0aW5nRmlsZSB0aGVuICdpY29uLWZpbGUtYWRkJyBlbHNlICdpY29uLWZpbGUtZGlyZWN0b3J5LWNyZWF0ZSdcblxuICBvbkNvbmZpcm06IChuZXdQYXRoKSAtPlxuICAgIG5ld1BhdGggPSBuZXdQYXRoLnJlcGxhY2UoL1xccyskLywgJycpICMgUmVtb3ZlIHRyYWlsaW5nIHdoaXRlc3BhY2VcbiAgICBlbmRzV2l0aERpcmVjdG9yeVNlcGFyYXRvciA9IG5ld1BhdGhbbmV3UGF0aC5sZW5ndGggLSAxXSBpcyBwYXRoLnNlcFxuICAgIHVubGVzcyBwYXRoLmlzQWJzb2x1dGUobmV3UGF0aClcbiAgICAgIHVubGVzcyBAcm9vdFByb2plY3RQYXRoP1xuICAgICAgICBAc2hvd0Vycm9yKFwiWW91IG11c3Qgb3BlbiBhIGRpcmVjdG9yeSB0byBjcmVhdGUgYSBmaWxlIHdpdGggYSByZWxhdGl2ZSBwYXRoXCIpXG4gICAgICAgIHJldHVyblxuXG4gICAgICBuZXdQYXRoID0gcGF0aC5qb2luKEByb290UHJvamVjdFBhdGgsIG5ld1BhdGgpXG5cbiAgICByZXR1cm4gdW5sZXNzIG5ld1BhdGhcblxuICAgIHRyeVxuICAgICAgaWYgZnMuZXhpc3RzU3luYyhuZXdQYXRoKVxuICAgICAgICBAc2hvd0Vycm9yKFwiJyN7bmV3UGF0aH0nIGFscmVhZHkgZXhpc3RzLlwiKVxuICAgICAgZWxzZSBpZiBAaXNDcmVhdGluZ0ZpbGVcbiAgICAgICAgaWYgZW5kc1dpdGhEaXJlY3RvcnlTZXBhcmF0b3JcbiAgICAgICAgICBAc2hvd0Vycm9yKFwiRmlsZSBuYW1lcyBtdXN0IG5vdCBlbmQgd2l0aCBhICcje3BhdGguc2VwfScgY2hhcmFjdGVyLlwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdQYXRoLCAnJylcbiAgICAgICAgICByZXBvRm9yUGF0aChuZXdQYXRoKT8uZ2V0UGF0aFN0YXR1cyhuZXdQYXRoKVxuICAgICAgICAgIEB0cmlnZ2VyICdmaWxlLWNyZWF0ZWQnLCBbbmV3UGF0aF1cbiAgICAgICAgICBAY2xvc2UoKVxuICAgICAgZWxzZVxuICAgICAgICBmcy5tYWtlVHJlZVN5bmMobmV3UGF0aClcbiAgICAgICAgQHRyaWdnZXIgJ2RpcmVjdG9yeS1jcmVhdGVkJywgW25ld1BhdGhdXG4gICAgICAgIEBjYW5jZWwoKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBAc2hvd0Vycm9yKFwiI3tlcnJvci5tZXNzYWdlfS5cIilcbiJdfQ==
