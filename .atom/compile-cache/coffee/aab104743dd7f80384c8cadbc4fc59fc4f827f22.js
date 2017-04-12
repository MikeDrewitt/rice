(function() {
  var CopyDialog, Dialog, fs, path, repoForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  Dialog = require('./dialog');

  repoForPath = require("./helpers").repoForPath;

  module.exports = CopyDialog = (function(superClass) {
    extend(CopyDialog, superClass);

    function CopyDialog(initialPath) {
      this.initialPath = initialPath;
      CopyDialog.__super__.constructor.call(this, {
        prompt: 'Enter the new path for the duplicate.',
        initialPath: atom.project.relativize(this.initialPath),
        select: true,
        iconClass: 'icon-arrow-right'
      });
    }

    CopyDialog.prototype.onConfirm = function(newPath) {
      var activeEditor, error, repo, rootPath;
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
      activeEditor = atom.workspace.getActiveTextEditor();
      if ((activeEditor != null ? activeEditor.getPath() : void 0) !== this.initialPath) {
        activeEditor = null;
      }
      try {
        if (fs.isDirectorySync(this.initialPath)) {
          fs.copySync(this.initialPath, newPath);
        } else {
          fs.copy(this.initialPath, newPath, function() {
            return atom.workspace.open(newPath, {
              activatePane: true,
              initialLine: activeEditor != null ? activeEditor.getLastCursor().getBufferRow() : void 0,
              initialColumn: activeEditor != null ? activeEditor.getLastCursor().getBufferColumn() : void 0
            });
          });
        }
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

    CopyDialog.prototype.isNewPathValid = function(newPath) {
      var newStat, oldStat;
      try {
        oldStat = fs.statSync(this.initialPath);
        newStat = fs.statSync(newPath);
        return this.initialPath.toLowerCase() === newPath.toLowerCase() && oldStat.dev === newStat.dev && oldStat.ino === newStat.ino;
      } catch (error1) {
        return true;
      }
    };

    return CopyDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2NvcHktZGlhbG9nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEseUNBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0VBQ1IsY0FBZSxPQUFBLENBQVEsV0FBUjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1Msb0JBQUMsV0FBRDtNQUFDLElBQUMsQ0FBQSxjQUFEO01BQ1osNENBQ0U7UUFBQSxNQUFBLEVBQVEsdUNBQVI7UUFDQSxXQUFBLEVBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFiLENBQXdCLElBQUMsQ0FBQSxXQUF6QixDQURiO1FBRUEsTUFBQSxFQUFRLElBRlI7UUFHQSxTQUFBLEVBQVcsa0JBSFg7T0FERjtJQURXOzt5QkFPYixTQUFBLEdBQVcsU0FBQyxPQUFEO0FBQ1QsVUFBQTtNQUFBLE9BQUEsR0FBVSxPQUFPLENBQUMsT0FBUixDQUFnQixNQUFoQixFQUF3QixFQUF4QjtNQUNWLElBQUEsQ0FBTyxJQUFJLENBQUMsVUFBTCxDQUFnQixPQUFoQixDQUFQO1FBQ0csV0FBWSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsSUFBQyxDQUFBLFdBQTdCO1FBQ2IsT0FBQSxHQUFVLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixPQUFwQjtRQUNWLElBQUEsQ0FBYyxPQUFkO0FBQUEsaUJBQUE7U0FIRjs7TUFLQSxJQUFHLElBQUMsQ0FBQSxXQUFELEtBQWdCLE9BQW5CO1FBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUNBLGVBRkY7O01BSUEsSUFBQSxDQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLE9BQWhCLENBQVA7UUFDRSxJQUFDLENBQUEsU0FBRCxDQUFXLEdBQUEsR0FBSSxPQUFKLEdBQVksbUJBQXZCO0FBQ0EsZUFGRjs7TUFJQSxZQUFBLEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO01BQ2YsNEJBQTJCLFlBQVksQ0FBRSxPQUFkLENBQUEsV0FBQSxLQUEyQixJQUFDLENBQUEsV0FBdkQ7UUFBQSxZQUFBLEdBQWUsS0FBZjs7QUFDQTtRQUNFLElBQUcsRUFBRSxDQUFDLGVBQUgsQ0FBbUIsSUFBQyxDQUFBLFdBQXBCLENBQUg7VUFDRSxFQUFFLENBQUMsUUFBSCxDQUFZLElBQUMsQ0FBQSxXQUFiLEVBQTBCLE9BQTFCLEVBREY7U0FBQSxNQUFBO1VBR0UsRUFBRSxDQUFDLElBQUgsQ0FBUSxJQUFDLENBQUEsV0FBVCxFQUFzQixPQUF0QixFQUErQixTQUFBO21CQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsT0FBcEIsRUFDRTtjQUFBLFlBQUEsRUFBYyxJQUFkO2NBQ0EsV0FBQSx5QkFBYSxZQUFZLENBQUUsYUFBZCxDQUFBLENBQTZCLENBQUMsWUFBOUIsQ0FBQSxVQURiO2NBRUEsYUFBQSx5QkFBZSxZQUFZLENBQUUsYUFBZCxDQUFBLENBQTZCLENBQUMsZUFBOUIsQ0FBQSxVQUZmO2FBREY7VUFENkIsQ0FBL0IsRUFIRjs7UUFRQSxJQUFHLElBQUEsR0FBTyxXQUFBLENBQVksT0FBWixDQUFWO1VBQ0UsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsSUFBQyxDQUFBLFdBQXBCO1VBQ0EsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsT0FBbkIsRUFGRjs7ZUFHQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBWkY7T0FBQSxjQUFBO1FBYU07ZUFDSixJQUFDLENBQUEsU0FBRCxDQUFjLEtBQUssQ0FBQyxPQUFQLEdBQWUsR0FBNUIsRUFkRjs7SUFqQlM7O3lCQWlDWCxjQUFBLEdBQWdCLFNBQUMsT0FBRDtBQUNkLFVBQUE7QUFBQTtRQUNFLE9BQUEsR0FBVSxFQUFFLENBQUMsUUFBSCxDQUFZLElBQUMsQ0FBQSxXQUFiO1FBQ1YsT0FBQSxHQUFVLEVBQUUsQ0FBQyxRQUFILENBQVksT0FBWjtlQUtWLElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixDQUFBLENBQUEsS0FBOEIsT0FBTyxDQUFDLFdBQVIsQ0FBQSxDQUE5QixJQUNFLE9BQU8sQ0FBQyxHQUFSLEtBQWUsT0FBTyxDQUFDLEdBRHpCLElBRUUsT0FBTyxDQUFDLEdBQVIsS0FBZSxPQUFPLENBQUMsSUFUM0I7T0FBQSxjQUFBO2VBV0UsS0FYRjs7SUFEYzs7OztLQXpDTztBQU56QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuRGlhbG9nID0gcmVxdWlyZSAnLi9kaWFsb2cnXG57cmVwb0ZvclBhdGh9ID0gcmVxdWlyZSBcIi4vaGVscGVyc1wiXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvcHlEaWFsb2cgZXh0ZW5kcyBEaWFsb2dcbiAgY29uc3RydWN0b3I6IChAaW5pdGlhbFBhdGgpIC0+XG4gICAgc3VwZXJcbiAgICAgIHByb21wdDogJ0VudGVyIHRoZSBuZXcgcGF0aCBmb3IgdGhlIGR1cGxpY2F0ZS4nXG4gICAgICBpbml0aWFsUGF0aDogYXRvbS5wcm9qZWN0LnJlbGF0aXZpemUoQGluaXRpYWxQYXRoKVxuICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICBpY29uQ2xhc3M6ICdpY29uLWFycm93LXJpZ2h0J1xuXG4gIG9uQ29uZmlybTogKG5ld1BhdGgpIC0+XG4gICAgbmV3UGF0aCA9IG5ld1BhdGgucmVwbGFjZSgvXFxzKyQvLCAnJykgIyBSZW1vdmUgdHJhaWxpbmcgd2hpdGVzcGFjZVxuICAgIHVubGVzcyBwYXRoLmlzQWJzb2x1dGUobmV3UGF0aClcbiAgICAgIFtyb290UGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoQGluaXRpYWxQYXRoKVxuICAgICAgbmV3UGF0aCA9IHBhdGguam9pbihyb290UGF0aCwgbmV3UGF0aClcbiAgICAgIHJldHVybiB1bmxlc3MgbmV3UGF0aFxuXG4gICAgaWYgQGluaXRpYWxQYXRoIGlzIG5ld1BhdGhcbiAgICAgIEBjbG9zZSgpXG4gICAgICByZXR1cm5cblxuICAgIHVubGVzcyBAaXNOZXdQYXRoVmFsaWQobmV3UGF0aClcbiAgICAgIEBzaG93RXJyb3IoXCInI3tuZXdQYXRofScgYWxyZWFkeSBleGlzdHMuXCIpXG4gICAgICByZXR1cm5cblxuICAgIGFjdGl2ZUVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGFjdGl2ZUVkaXRvciA9IG51bGwgdW5sZXNzIGFjdGl2ZUVkaXRvcj8uZ2V0UGF0aCgpIGlzIEBpbml0aWFsUGF0aFxuICAgIHRyeVxuICAgICAgaWYgZnMuaXNEaXJlY3RvcnlTeW5jKEBpbml0aWFsUGF0aClcbiAgICAgICAgZnMuY29weVN5bmMoQGluaXRpYWxQYXRoLCBuZXdQYXRoKVxuICAgICAgZWxzZVxuICAgICAgICBmcy5jb3B5IEBpbml0aWFsUGF0aCwgbmV3UGF0aCwgLT5cbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuIG5ld1BhdGgsXG4gICAgICAgICAgICBhY3RpdmF0ZVBhbmU6IHRydWVcbiAgICAgICAgICAgIGluaXRpYWxMaW5lOiBhY3RpdmVFZGl0b3I/LmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJSb3coKVxuICAgICAgICAgICAgaW5pdGlhbENvbHVtbjogYWN0aXZlRWRpdG9yPy5nZXRMYXN0Q3Vyc29yKCkuZ2V0QnVmZmVyQ29sdW1uKClcbiAgICAgIGlmIHJlcG8gPSByZXBvRm9yUGF0aChuZXdQYXRoKVxuICAgICAgICByZXBvLmdldFBhdGhTdGF0dXMoQGluaXRpYWxQYXRoKVxuICAgICAgICByZXBvLmdldFBhdGhTdGF0dXMobmV3UGF0aClcbiAgICAgIEBjbG9zZSgpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIEBzaG93RXJyb3IoXCIje2Vycm9yLm1lc3NhZ2V9LlwiKVxuXG4gIGlzTmV3UGF0aFZhbGlkOiAobmV3UGF0aCkgLT5cbiAgICB0cnlcbiAgICAgIG9sZFN0YXQgPSBmcy5zdGF0U3luYyhAaW5pdGlhbFBhdGgpXG4gICAgICBuZXdTdGF0ID0gZnMuc3RhdFN5bmMobmV3UGF0aClcblxuICAgICAgIyBOZXcgcGF0aCBleGlzdHMgc28gY2hlY2sgaWYgaXQgcG9pbnRzIHRvIHRoZSBzYW1lIGZpbGUgYXMgdGhlIGluaXRpYWxcbiAgICAgICMgcGF0aCB0byBzZWUgaWYgdGhlIGNhc2Ugb2YgdGhlIGZpbGUgbmFtZSBpcyBiZWluZyBjaGFuZ2VkIG9uIGEgb24gYVxuICAgICAgIyBjYXNlIGluc2Vuc2l0aXZlIGZpbGVzeXN0ZW0uXG4gICAgICBAaW5pdGlhbFBhdGgudG9Mb3dlckNhc2UoKSBpcyBuZXdQYXRoLnRvTG93ZXJDYXNlKCkgYW5kXG4gICAgICAgIG9sZFN0YXQuZGV2IGlzIG5ld1N0YXQuZGV2IGFuZFxuICAgICAgICBvbGRTdGF0LmlubyBpcyBuZXdTdGF0Lmlub1xuICAgIGNhdGNoXG4gICAgICB0cnVlICMgbmV3IHBhdGggZG9lcyBub3QgZXhpc3Qgc28gaXQgaXMgdmFsaWRcbiJdfQ==
