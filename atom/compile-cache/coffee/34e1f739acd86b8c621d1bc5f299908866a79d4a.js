(function() {
  var Dialog, MoveDialog, fs, path, repoForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  repoForPath = require("./helpers").repoForPath;

  module.exports = MoveDialog = (function(superClass) {
    extend(MoveDialog, superClass);

    function MoveDialog(initialPath) {
      var prompt;
      this.initialPath = initialPath;
      if (fs.isDirectorySync(this.initialPath)) {
        prompt = 'Enter the new path for the directory.';
      } else {
        prompt = 'Enter the new path for the file.';
      }
      MoveDialog.__super__.constructor.call(this, {
        prompt: prompt,
        initialPath: atom.project.relativize(this.initialPath),
        select: true,
        iconClass: 'icon-arrow-right'
      });
    }

    MoveDialog.prototype.onConfirm = function(newPath) {
      var directoryPath, error, repo, rootPath;
      newPath = newPath.replace(/\s+$/, '');
      if (!path.isAbsolute(newPath)) {
        rootPath = atom.project.relativizePath(this.initialPath)[0];
        newPath = path.join(rootPath, newPath);
        if (!newPath) {
          return;
        }
      }
      if (this.initialPath === newPath) {
        this.close();
        return;
      }
      if (!this.isNewPathValid(newPath)) {
        this.showError("'" + newPath + "' already exists.");
        return;
      }
      directoryPath = path.dirname(newPath);
      try {
        if (!fs.existsSync(directoryPath)) {
          fs.makeTreeSync(directoryPath);
        }
        fs.moveSync(this.initialPath, newPath);
        if (repo = repoForPath(newPath)) {
          repo.getPathStatus(this.initialPath);
          repo.getPathStatus(newPath);
        }
        return this.close();
      } catch (error1) {
        error = error1;
        return this.showError(error.message + ".");
      }
    };

    MoveDialog.prototype.isNewPathValid = function(newPath) {
      var newStat, oldStat;
      try {
        oldStat = fs.statSync(this.initialPath);
        newStat = fs.statSync(newPath);
        return this.initialPath.toLowerCase() === newPath.toLowerCase() && oldStat.dev === newStat.dev && oldStat.ino === newStat.ino;
      } catch (error1) {
        return true;
      }
    };

    return MoveDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL21vdmUtZGlhbG9nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEseUNBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0VBQ1IsY0FBZSxPQUFBLENBQVEsV0FBUjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1Msb0JBQUMsV0FBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsY0FBRDtNQUNaLElBQUcsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsSUFBQyxDQUFBLFdBQXBCLENBQUg7UUFDRSxNQUFBLEdBQVMsd0NBRFg7T0FBQSxNQUFBO1FBR0UsTUFBQSxHQUFTLG1DQUhYOztNQUtBLDRDQUNFO1FBQUEsTUFBQSxFQUFRLE1BQVI7UUFDQSxXQUFBLEVBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFiLENBQXdCLElBQUMsQ0FBQSxXQUF6QixDQURiO1FBRUEsTUFBQSxFQUFRLElBRlI7UUFHQSxTQUFBLEVBQVcsa0JBSFg7T0FERjtJQU5XOzt5QkFZYixTQUFBLEdBQVcsU0FBQyxPQUFEO0FBQ1QsVUFBQTtNQUFBLE9BQUEsR0FBVSxPQUFPLENBQUMsT0FBUixDQUFnQixNQUFoQixFQUF3QixFQUF4QjtNQUNWLElBQUEsQ0FBTyxJQUFJLENBQUMsVUFBTCxDQUFnQixPQUFoQixDQUFQO1FBQ0csV0FBWSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsSUFBQyxDQUFBLFdBQTdCO1FBQ2IsT0FBQSxHQUFVLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixPQUFwQjtRQUNWLElBQUEsQ0FBYyxPQUFkO0FBQUEsaUJBQUE7U0FIRjs7TUFLQSxJQUFHLElBQUMsQ0FBQSxXQUFELEtBQWdCLE9BQW5CO1FBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUNBLGVBRkY7O01BSUEsSUFBQSxDQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLE9BQWhCLENBQVA7UUFDRSxJQUFDLENBQUEsU0FBRCxDQUFXLEdBQUEsR0FBSSxPQUFKLEdBQVksbUJBQXZCO0FBQ0EsZUFGRjs7TUFJQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYjtBQUNoQjtRQUNFLElBQUEsQ0FBc0MsRUFBRSxDQUFDLFVBQUgsQ0FBYyxhQUFkLENBQXRDO1VBQUEsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsYUFBaEIsRUFBQTs7UUFDQSxFQUFFLENBQUMsUUFBSCxDQUFZLElBQUMsQ0FBQSxXQUFiLEVBQTBCLE9BQTFCO1FBQ0EsSUFBRyxJQUFBLEdBQU8sV0FBQSxDQUFZLE9BQVosQ0FBVjtVQUNFLElBQUksQ0FBQyxhQUFMLENBQW1CLElBQUMsQ0FBQSxXQUFwQjtVQUNBLElBQUksQ0FBQyxhQUFMLENBQW1CLE9BQW5CLEVBRkY7O2VBR0EsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQU5GO09BQUEsY0FBQTtRQU9NO2VBQ0osSUFBQyxDQUFBLFNBQUQsQ0FBYyxLQUFLLENBQUMsT0FBUCxHQUFlLEdBQTVCLEVBUkY7O0lBaEJTOzt5QkEwQlgsY0FBQSxHQUFnQixTQUFDLE9BQUQ7QUFDZCxVQUFBO0FBQUE7UUFDRSxPQUFBLEdBQVUsRUFBRSxDQUFDLFFBQUgsQ0FBWSxJQUFDLENBQUEsV0FBYjtRQUNWLE9BQUEsR0FBVSxFQUFFLENBQUMsUUFBSCxDQUFZLE9BQVo7ZUFLVixJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBQSxDQUFBLEtBQThCLE9BQU8sQ0FBQyxXQUFSLENBQUEsQ0FBOUIsSUFDRSxPQUFPLENBQUMsR0FBUixLQUFlLE9BQU8sQ0FBQyxHQUR6QixJQUVFLE9BQU8sQ0FBQyxHQUFSLEtBQWUsT0FBTyxDQUFDLElBVDNCO09BQUEsY0FBQTtlQVdFLEtBWEY7O0lBRGM7Ozs7S0F2Q087QUFOekIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbkRpYWxvZyA9IHJlcXVpcmUgJy4vZGlhbG9nJ1xue3JlcG9Gb3JQYXRofSA9IHJlcXVpcmUgXCIuL2hlbHBlcnNcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBNb3ZlRGlhbG9nIGV4dGVuZHMgRGlhbG9nXG4gIGNvbnN0cnVjdG9yOiAoQGluaXRpYWxQYXRoKSAtPlxuICAgIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhAaW5pdGlhbFBhdGgpXG4gICAgICBwcm9tcHQgPSAnRW50ZXIgdGhlIG5ldyBwYXRoIGZvciB0aGUgZGlyZWN0b3J5LidcbiAgICBlbHNlXG4gICAgICBwcm9tcHQgPSAnRW50ZXIgdGhlIG5ldyBwYXRoIGZvciB0aGUgZmlsZS4nXG5cbiAgICBzdXBlclxuICAgICAgcHJvbXB0OiBwcm9tcHRcbiAgICAgIGluaXRpYWxQYXRoOiBhdG9tLnByb2plY3QucmVsYXRpdml6ZShAaW5pdGlhbFBhdGgpXG4gICAgICBzZWxlY3Q6IHRydWVcbiAgICAgIGljb25DbGFzczogJ2ljb24tYXJyb3ctcmlnaHQnXG5cbiAgb25Db25maXJtOiAobmV3UGF0aCkgLT5cbiAgICBuZXdQYXRoID0gbmV3UGF0aC5yZXBsYWNlKC9cXHMrJC8sICcnKSAjIFJlbW92ZSB0cmFpbGluZyB3aGl0ZXNwYWNlXG4gICAgdW5sZXNzIHBhdGguaXNBYnNvbHV0ZShuZXdQYXRoKVxuICAgICAgW3Jvb3RQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChAaW5pdGlhbFBhdGgpXG4gICAgICBuZXdQYXRoID0gcGF0aC5qb2luKHJvb3RQYXRoLCBuZXdQYXRoKVxuICAgICAgcmV0dXJuIHVubGVzcyBuZXdQYXRoXG5cbiAgICBpZiBAaW5pdGlhbFBhdGggaXMgbmV3UGF0aFxuICAgICAgQGNsb3NlKClcbiAgICAgIHJldHVyblxuXG4gICAgdW5sZXNzIEBpc05ld1BhdGhWYWxpZChuZXdQYXRoKVxuICAgICAgQHNob3dFcnJvcihcIicje25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0cy5cIilcbiAgICAgIHJldHVyblxuXG4gICAgZGlyZWN0b3J5UGF0aCA9IHBhdGguZGlybmFtZShuZXdQYXRoKVxuICAgIHRyeVxuICAgICAgZnMubWFrZVRyZWVTeW5jKGRpcmVjdG9yeVBhdGgpIHVubGVzcyBmcy5leGlzdHNTeW5jKGRpcmVjdG9yeVBhdGgpXG4gICAgICBmcy5tb3ZlU3luYyhAaW5pdGlhbFBhdGgsIG5ld1BhdGgpXG4gICAgICBpZiByZXBvID0gcmVwb0ZvclBhdGgobmV3UGF0aClcbiAgICAgICAgcmVwby5nZXRQYXRoU3RhdHVzKEBpbml0aWFsUGF0aClcbiAgICAgICAgcmVwby5nZXRQYXRoU3RhdHVzKG5ld1BhdGgpXG4gICAgICBAY2xvc2UoKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBAc2hvd0Vycm9yKFwiI3tlcnJvci5tZXNzYWdlfS5cIilcblxuICBpc05ld1BhdGhWYWxpZDogKG5ld1BhdGgpIC0+XG4gICAgdHJ5XG4gICAgICBvbGRTdGF0ID0gZnMuc3RhdFN5bmMoQGluaXRpYWxQYXRoKVxuICAgICAgbmV3U3RhdCA9IGZzLnN0YXRTeW5jKG5ld1BhdGgpXG5cbiAgICAgICMgTmV3IHBhdGggZXhpc3RzIHNvIGNoZWNrIGlmIGl0IHBvaW50cyB0byB0aGUgc2FtZSBmaWxlIGFzIHRoZSBpbml0aWFsXG4gICAgICAjIHBhdGggdG8gc2VlIGlmIHRoZSBjYXNlIG9mIHRoZSBmaWxlIG5hbWUgaXMgYmVpbmcgY2hhbmdlZCBvbiBhIG9uIGFcbiAgICAgICMgY2FzZSBpbnNlbnNpdGl2ZSBmaWxlc3lzdGVtLlxuICAgICAgQGluaXRpYWxQYXRoLnRvTG93ZXJDYXNlKCkgaXMgbmV3UGF0aC50b0xvd2VyQ2FzZSgpIGFuZFxuICAgICAgICBvbGRTdGF0LmRldiBpcyBuZXdTdGF0LmRldiBhbmRcbiAgICAgICAgb2xkU3RhdC5pbm8gaXMgbmV3U3RhdC5pbm9cbiAgICBjYXRjaFxuICAgICAgdHJ1ZSAjIG5ldyBwYXRoIGRvZXMgbm90IGV4aXN0IHNvIGl0IGlzIHZhbGlkXG4iXX0=
