(function() {
  var CompositeDisposable, Emitter, File, fs, path, ref, repoForPath;

  path = require('path');

  fs = require('fs-plus');

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  repoForPath = require('./helpers').repoForPath;

  module.exports = File = (function() {
    function File(arg) {
      var fullPath, realpathCache, useSyncFS;
      this.name = arg.name, fullPath = arg.fullPath, this.symlink = arg.symlink, realpathCache = arg.realpathCache, useSyncFS = arg.useSyncFS, this.stats = arg.stats;
      this.destroyed = false;
      this.emitter = new Emitter();
      this.subscriptions = new CompositeDisposable();
      this.path = fullPath;
      this.realPath = this.path;
      this.subscribeToRepo();
      this.updateStatus();
      if (useSyncFS) {
        this.realPath = fs.realpathSync(this.path);
      } else {
        fs.realpath(this.path, realpathCache, (function(_this) {
          return function(error, realPath) {
            if (_this.destroyed) {
              return;
            }
            if (realPath && realPath !== _this.path) {
              _this.realPath = realPath;
              return _this.updateStatus();
            }
          };
        })(this));
      }
    }

    File.prototype.destroy = function() {
      this.destroyed = true;
      this.subscriptions.dispose();
      return this.emitter.emit('did-destroy');
    };

    File.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    File.prototype.onDidStatusChange = function(callback) {
      return this.emitter.on('did-status-change', callback);
    };

    File.prototype.subscribeToRepo = function() {
      var repo;
      repo = repoForPath(this.path);
      if (repo == null) {
        return;
      }
      this.subscriptions.add(repo.onDidChangeStatus((function(_this) {
        return function(event) {
          if (_this.isPathEqual(event.path)) {
            return _this.updateStatus(repo);
          }
        };
      })(this)));
      return this.subscriptions.add(repo.onDidChangeStatuses((function(_this) {
        return function() {
          return _this.updateStatus(repo);
        };
      })(this)));
    };

    File.prototype.updateStatus = function() {
      var newStatus, repo, status;
      repo = repoForPath(this.path);
      if (repo == null) {
        return;
      }
      newStatus = null;
      if (repo.isPathIgnored(this.path)) {
        newStatus = 'ignored';
      } else {
        status = repo.getCachedPathStatus(this.path);
        if (repo.isStatusModified(status)) {
          newStatus = 'modified';
        } else if (repo.isStatusNew(status)) {
          newStatus = 'added';
        }
      }
      if (newStatus !== this.status) {
        this.status = newStatus;
        return this.emitter.emit('did-status-change', newStatus);
      }
    };

    File.prototype.isPathEqual = function(pathToCompare) {
      return this.path === pathToCompare || this.realPath === pathToCompare;
    };

    return File;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2ZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQWlDLE9BQUEsQ0FBUSxXQUFSLENBQWpDLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3JCLGNBQWUsT0FBQSxDQUFRLFdBQVI7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxjQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsSUFBQyxDQUFBLFdBQUEsTUFBTSx5QkFBVSxJQUFDLENBQUEsY0FBQSxTQUFTLG1DQUFlLDJCQUFXLElBQUMsQ0FBQSxZQUFBO01BQ25FLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsT0FBRCxHQUFlLElBQUEsT0FBQSxDQUFBO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxtQkFBQSxDQUFBO01BRXJCLElBQUMsQ0FBQSxJQUFELEdBQVE7TUFDUixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQTtNQUViLElBQUMsQ0FBQSxlQUFELENBQUE7TUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO01BRUEsSUFBRyxTQUFIO1FBQ0UsSUFBQyxDQUFBLFFBQUQsR0FBWSxFQUFFLENBQUMsWUFBSCxDQUFnQixJQUFDLENBQUEsSUFBakIsRUFEZDtPQUFBLE1BQUE7UUFHRSxFQUFFLENBQUMsUUFBSCxDQUFZLElBQUMsQ0FBQSxJQUFiLEVBQW1CLGFBQW5CLEVBQWtDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRCxFQUFRLFFBQVI7WUFDaEMsSUFBVSxLQUFDLENBQUEsU0FBWDtBQUFBLHFCQUFBOztZQUNBLElBQUcsUUFBQSxJQUFhLFFBQUEsS0FBYyxLQUFDLENBQUEsSUFBL0I7Y0FDRSxLQUFDLENBQUEsUUFBRCxHQUFZO3FCQUNaLEtBQUMsQ0FBQSxZQUFELENBQUEsRUFGRjs7VUFGZ0M7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxDLEVBSEY7O0lBWFc7O21CQW9CYixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQWQ7SUFITzs7bUJBS1QsWUFBQSxHQUFjLFNBQUMsUUFBRDthQUNaLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGFBQVosRUFBMkIsUUFBM0I7SUFEWTs7bUJBR2QsaUJBQUEsR0FBbUIsU0FBQyxRQUFEO2FBQ2pCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG1CQUFaLEVBQWlDLFFBQWpDO0lBRGlCOzttQkFJbkIsZUFBQSxHQUFpQixTQUFBO0FBQ2YsVUFBQTtNQUFBLElBQUEsR0FBTyxXQUFBLENBQVksSUFBQyxDQUFBLElBQWI7TUFDUCxJQUFjLFlBQWQ7QUFBQSxlQUFBOztNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsaUJBQUwsQ0FBdUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7VUFDeEMsSUFBdUIsS0FBQyxDQUFBLFdBQUQsQ0FBYSxLQUFLLENBQUMsSUFBbkIsQ0FBdkI7bUJBQUEsS0FBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLEVBQUE7O1FBRHdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QixDQUFuQjthQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsbUJBQUwsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUMxQyxLQUFDLENBQUEsWUFBRCxDQUFjLElBQWQ7UUFEMEM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCLENBQW5CO0lBTmU7O21CQVVqQixZQUFBLEdBQWMsU0FBQTtBQUNaLFVBQUE7TUFBQSxJQUFBLEdBQU8sV0FBQSxDQUFZLElBQUMsQ0FBQSxJQUFiO01BQ1AsSUFBYyxZQUFkO0FBQUEsZUFBQTs7TUFFQSxTQUFBLEdBQVk7TUFDWixJQUFHLElBQUksQ0FBQyxhQUFMLENBQW1CLElBQUMsQ0FBQSxJQUFwQixDQUFIO1FBQ0UsU0FBQSxHQUFZLFVBRGQ7T0FBQSxNQUFBO1FBR0UsTUFBQSxHQUFTLElBQUksQ0FBQyxtQkFBTCxDQUF5QixJQUFDLENBQUEsSUFBMUI7UUFDVCxJQUFHLElBQUksQ0FBQyxnQkFBTCxDQUFzQixNQUF0QixDQUFIO1VBQ0UsU0FBQSxHQUFZLFdBRGQ7U0FBQSxNQUVLLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsTUFBakIsQ0FBSDtVQUNILFNBQUEsR0FBWSxRQURUO1NBTlA7O01BU0EsSUFBRyxTQUFBLEtBQWUsSUFBQyxDQUFBLE1BQW5CO1FBQ0UsSUFBQyxDQUFBLE1BQUQsR0FBVTtlQUNWLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkLEVBQW1DLFNBQW5DLEVBRkY7O0lBZFk7O21CQWtCZCxXQUFBLEdBQWEsU0FBQyxhQUFEO2FBQ1gsSUFBQyxDQUFBLElBQUQsS0FBUyxhQUFULElBQTBCLElBQUMsQ0FBQSxRQUFELEtBQWE7SUFENUI7Ozs7O0FBbkVmIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG57Q29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlICdldmVudC1raXQnXG57cmVwb0ZvclBhdGh9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGaWxlXG4gIGNvbnN0cnVjdG9yOiAoe0BuYW1lLCBmdWxsUGF0aCwgQHN5bWxpbmssIHJlYWxwYXRoQ2FjaGUsIHVzZVN5bmNGUywgQHN0YXRzfSkgLT5cbiAgICBAZGVzdHJveWVkID0gZmFsc2VcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIEBwYXRoID0gZnVsbFBhdGhcbiAgICBAcmVhbFBhdGggPSBAcGF0aFxuXG4gICAgQHN1YnNjcmliZVRvUmVwbygpXG4gICAgQHVwZGF0ZVN0YXR1cygpXG5cbiAgICBpZiB1c2VTeW5jRlNcbiAgICAgIEByZWFsUGF0aCA9IGZzLnJlYWxwYXRoU3luYyhAcGF0aClcbiAgICBlbHNlXG4gICAgICBmcy5yZWFscGF0aCBAcGF0aCwgcmVhbHBhdGhDYWNoZSwgKGVycm9yLCByZWFsUGF0aCkgPT5cbiAgICAgICAgcmV0dXJuIGlmIEBkZXN0cm95ZWRcbiAgICAgICAgaWYgcmVhbFBhdGggYW5kIHJlYWxQYXRoIGlzbnQgQHBhdGhcbiAgICAgICAgICBAcmVhbFBhdGggPSByZWFsUGF0aFxuICAgICAgICAgIEB1cGRhdGVTdGF0dXMoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRlc3Ryb3llZCA9IHRydWVcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpXG5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1kZXN0cm95JywgY2FsbGJhY2spXG5cbiAgb25EaWRTdGF0dXNDaGFuZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLXN0YXR1cy1jaGFuZ2UnLCBjYWxsYmFjaylcblxuICAjIFN1YnNjcmliZSB0byB0aGUgcHJvamVjdCdzIHJlcG8gZm9yIGNoYW5nZXMgdG8gdGhlIEdpdCBzdGF0dXMgb2YgdGhpcyBmaWxlLlxuICBzdWJzY3JpYmVUb1JlcG86IC0+XG4gICAgcmVwbyA9IHJlcG9Gb3JQYXRoKEBwYXRoKVxuICAgIHJldHVybiB1bmxlc3MgcmVwbz9cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCByZXBvLm9uRGlkQ2hhbmdlU3RhdHVzIChldmVudCkgPT5cbiAgICAgIEB1cGRhdGVTdGF0dXMocmVwbykgaWYgQGlzUGF0aEVxdWFsKGV2ZW50LnBhdGgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIHJlcG8ub25EaWRDaGFuZ2VTdGF0dXNlcyA9PlxuICAgICAgQHVwZGF0ZVN0YXR1cyhyZXBvKVxuXG4gICMgVXBkYXRlIHRoZSBzdGF0dXMgcHJvcGVydHkgb2YgdGhpcyBkaXJlY3RvcnkgdXNpbmcgdGhlIHJlcG8uXG4gIHVwZGF0ZVN0YXR1czogLT5cbiAgICByZXBvID0gcmVwb0ZvclBhdGgoQHBhdGgpXG4gICAgcmV0dXJuIHVubGVzcyByZXBvP1xuXG4gICAgbmV3U3RhdHVzID0gbnVsbFxuICAgIGlmIHJlcG8uaXNQYXRoSWdub3JlZChAcGF0aClcbiAgICAgIG5ld1N0YXR1cyA9ICdpZ25vcmVkJ1xuICAgIGVsc2VcbiAgICAgIHN0YXR1cyA9IHJlcG8uZ2V0Q2FjaGVkUGF0aFN0YXR1cyhAcGF0aClcbiAgICAgIGlmIHJlcG8uaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpXG4gICAgICAgIG5ld1N0YXR1cyA9ICdtb2RpZmllZCdcbiAgICAgIGVsc2UgaWYgcmVwby5pc1N0YXR1c05ldyhzdGF0dXMpXG4gICAgICAgIG5ld1N0YXR1cyA9ICdhZGRlZCdcblxuICAgIGlmIG5ld1N0YXR1cyBpc250IEBzdGF0dXNcbiAgICAgIEBzdGF0dXMgPSBuZXdTdGF0dXNcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1zdGF0dXMtY2hhbmdlJywgbmV3U3RhdHVzKVxuXG4gIGlzUGF0aEVxdWFsOiAocGF0aFRvQ29tcGFyZSkgLT5cbiAgICBAcGF0aCBpcyBwYXRoVG9Db21wYXJlIG9yIEByZWFsUGF0aCBpcyBwYXRoVG9Db21wYXJlXG4iXX0=
