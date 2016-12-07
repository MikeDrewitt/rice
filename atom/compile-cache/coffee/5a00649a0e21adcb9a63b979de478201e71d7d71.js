(function() {
  var AutoUpdater, EventEmitter, SquirrelUpdate;

  EventEmitter = require('events').EventEmitter;

  SquirrelUpdate = require('./squirrel-update');

  AutoUpdater = (function() {
    function AutoUpdater() {}

    Object.assign(AutoUpdater.prototype, EventEmitter.prototype);

    AutoUpdater.prototype.setFeedURL = function(updateUrl) {
      this.updateUrl = updateUrl;
    };

    AutoUpdater.prototype.quitAndInstall = function() {
      if (SquirrelUpdate.existsSync()) {
        return SquirrelUpdate.restartAtom(require('electron').app);
      } else {
        return require('electron').autoUpdater.quitAndInstall();
      }
    };

    AutoUpdater.prototype.downloadUpdate = function(callback) {
      return SquirrelUpdate.spawn(['--download', this.updateUrl], function(error, stdout) {
        var json, ref, ref1, update;
        if (error != null) {
          return callback(error);
        }
        try {
          json = stdout.trim().split('\n').pop();
          update = (ref = JSON.parse(json)) != null ? (ref1 = ref.releasesToApply) != null ? typeof ref1.pop === "function" ? ref1.pop() : void 0 : void 0 : void 0;
        } catch (error1) {
          error = error1;
          error.stdout = stdout;
          return callback(error);
        }
        return callback(null, update);
      });
    };

    AutoUpdater.prototype.installUpdate = function(callback) {
      return SquirrelUpdate.spawn(['--update', this.updateUrl], callback);
    };

    AutoUpdater.prototype.supportsUpdates = function() {
      return SquirrelUpdate.existsSync();
    };

    AutoUpdater.prototype.checkForUpdates = function() {
      if (!this.updateUrl) {
        throw new Error('Update URL is not set');
      }
      this.emit('checking-for-update');
      if (!SquirrelUpdate.existsSync()) {
        this.emit('update-not-available');
        return;
      }
      return this.downloadUpdate((function(_this) {
        return function(error, update) {
          if (error != null) {
            _this.emit('update-not-available');
            return;
          }
          if (update == null) {
            _this.emit('update-not-available');
            return;
          }
          _this.emit('update-available');
          return _this.installUpdate(function(error) {
            if (error != null) {
              _this.emit('update-not-available');
              return;
            }
            return _this.emit('update-downloaded', {}, update.releaseNotes, update.version, new Date(), 'https://atom.io', function() {
              return _this.quitAndInstall();
            });
          });
        };
      })(this));
    };

    return AutoUpdater;

  })();

  module.exports = new AutoUpdater();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvYXV0by11cGRhdGVyLXdpbjMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsZUFBZ0IsT0FBQSxDQUFRLFFBQVI7O0VBQ2pCLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUVYOzs7SUFDSixNQUFNLENBQUMsTUFBUCxDQUFjLFdBQUMsQ0FBQSxTQUFmLEVBQTBCLFlBQVksQ0FBQyxTQUF2Qzs7MEJBRUEsVUFBQSxHQUFZLFNBQUMsU0FBRDtNQUFDLElBQUMsQ0FBQSxZQUFEO0lBQUQ7OzBCQUVaLGNBQUEsR0FBZ0IsU0FBQTtNQUNkLElBQUcsY0FBYyxDQUFDLFVBQWYsQ0FBQSxDQUFIO2VBQ0UsY0FBYyxDQUFDLFdBQWYsQ0FBMkIsT0FBQSxDQUFRLFVBQVIsQ0FBbUIsQ0FBQyxHQUEvQyxFQURGO09BQUEsTUFBQTtlQUdFLE9BQUEsQ0FBUSxVQUFSLENBQW1CLENBQUMsV0FBVyxDQUFDLGNBQWhDLENBQUEsRUFIRjs7SUFEYzs7MEJBTWhCLGNBQUEsR0FBZ0IsU0FBQyxRQUFEO2FBQ2QsY0FBYyxDQUFDLEtBQWYsQ0FBcUIsQ0FBQyxZQUFELEVBQWUsSUFBQyxDQUFBLFNBQWhCLENBQXJCLEVBQWlELFNBQUMsS0FBRCxFQUFRLE1BQVI7QUFDL0MsWUFBQTtRQUFBLElBQTBCLGFBQTFCO0FBQUEsaUJBQU8sUUFBQSxDQUFTLEtBQVQsRUFBUDs7QUFFQTtVQUVFLElBQUEsR0FBTyxNQUFNLENBQUMsSUFBUCxDQUFBLENBQWEsQ0FBQyxLQUFkLENBQW9CLElBQXBCLENBQXlCLENBQUMsR0FBMUIsQ0FBQTtVQUNQLE1BQUEsa0hBQTBDLENBQUUsaUNBSDlDO1NBQUEsY0FBQTtVQUlNO1VBQ0osS0FBSyxDQUFDLE1BQU4sR0FBZTtBQUNmLGlCQUFPLFFBQUEsQ0FBUyxLQUFULEVBTlQ7O2VBUUEsUUFBQSxDQUFTLElBQVQsRUFBZSxNQUFmO01BWCtDLENBQWpEO0lBRGM7OzBCQWNoQixhQUFBLEdBQWUsU0FBQyxRQUFEO2FBQ2IsY0FBYyxDQUFDLEtBQWYsQ0FBcUIsQ0FBQyxVQUFELEVBQWEsSUFBQyxDQUFBLFNBQWQsQ0FBckIsRUFBK0MsUUFBL0M7SUFEYTs7MEJBR2YsZUFBQSxHQUFpQixTQUFBO2FBQ2YsY0FBYyxDQUFDLFVBQWYsQ0FBQTtJQURlOzswQkFHakIsZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQSxDQUFnRCxJQUFDLENBQUEsU0FBakQ7QUFBQSxjQUFVLElBQUEsS0FBQSxDQUFNLHVCQUFOLEVBQVY7O01BRUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxxQkFBTjtNQUVBLElBQUEsQ0FBTyxjQUFjLENBQUMsVUFBZixDQUFBLENBQVA7UUFDRSxJQUFDLENBQUEsSUFBRCxDQUFNLHNCQUFOO0FBQ0EsZUFGRjs7YUFJQSxJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRCxFQUFRLE1BQVI7VUFDZCxJQUFHLGFBQUg7WUFDRSxLQUFDLENBQUEsSUFBRCxDQUFNLHNCQUFOO0FBQ0EsbUJBRkY7O1VBSUEsSUFBTyxjQUFQO1lBQ0UsS0FBQyxDQUFBLElBQUQsQ0FBTSxzQkFBTjtBQUNBLG1CQUZGOztVQUlBLEtBQUMsQ0FBQSxJQUFELENBQU0sa0JBQU47aUJBRUEsS0FBQyxDQUFBLGFBQUQsQ0FBZSxTQUFDLEtBQUQ7WUFDYixJQUFHLGFBQUg7Y0FDRSxLQUFDLENBQUEsSUFBRCxDQUFNLHNCQUFOO0FBQ0EscUJBRkY7O21CQUlBLEtBQUMsQ0FBQSxJQUFELENBQU0sbUJBQU4sRUFBMkIsRUFBM0IsRUFBK0IsTUFBTSxDQUFDLFlBQXRDLEVBQW9ELE1BQU0sQ0FBQyxPQUEzRCxFQUF3RSxJQUFBLElBQUEsQ0FBQSxDQUF4RSxFQUFnRixpQkFBaEYsRUFBbUcsU0FBQTtxQkFBRyxLQUFDLENBQUEsY0FBRCxDQUFBO1lBQUgsQ0FBbkc7VUFMYSxDQUFmO1FBWGM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhCO0lBVGU7Ozs7OztFQTJCbkIsTUFBTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSxXQUFBLENBQUE7QUE3RHJCIiwic291cmNlc0NvbnRlbnQiOlsie0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlICdldmVudHMnXG5TcXVpcnJlbFVwZGF0ZSA9IHJlcXVpcmUgJy4vc3F1aXJyZWwtdXBkYXRlJ1xuXG5jbGFzcyBBdXRvVXBkYXRlclxuICBPYmplY3QuYXNzaWduIEBwcm90b3R5cGUsIEV2ZW50RW1pdHRlci5wcm90b3R5cGVcblxuICBzZXRGZWVkVVJMOiAoQHVwZGF0ZVVybCkgLT5cblxuICBxdWl0QW5kSW5zdGFsbDogLT5cbiAgICBpZiBTcXVpcnJlbFVwZGF0ZS5leGlzdHNTeW5jKClcbiAgICAgIFNxdWlycmVsVXBkYXRlLnJlc3RhcnRBdG9tKHJlcXVpcmUoJ2VsZWN0cm9uJykuYXBwKVxuICAgIGVsc2VcbiAgICAgIHJlcXVpcmUoJ2VsZWN0cm9uJykuYXV0b1VwZGF0ZXIucXVpdEFuZEluc3RhbGwoKVxuXG4gIGRvd25sb2FkVXBkYXRlOiAoY2FsbGJhY2spIC0+XG4gICAgU3F1aXJyZWxVcGRhdGUuc3Bhd24gWyctLWRvd25sb2FkJywgQHVwZGF0ZVVybF0sIChlcnJvciwgc3Rkb3V0KSAtPlxuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKSBpZiBlcnJvcj9cblxuICAgICAgdHJ5XG4gICAgICAgICMgTGFzdCBsaW5lIG9mIG91dHB1dCBpcyB0aGUgSlNPTiBkZXRhaWxzIGFib3V0IHRoZSByZWxlYXNlc1xuICAgICAgICBqc29uID0gc3Rkb3V0LnRyaW0oKS5zcGxpdCgnXFxuJykucG9wKClcbiAgICAgICAgdXBkYXRlID0gSlNPTi5wYXJzZShqc29uKT8ucmVsZWFzZXNUb0FwcGx5Py5wb3A/KClcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgIGVycm9yLnN0ZG91dCA9IHN0ZG91dFxuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpXG5cbiAgICAgIGNhbGxiYWNrKG51bGwsIHVwZGF0ZSlcblxuICBpbnN0YWxsVXBkYXRlOiAoY2FsbGJhY2spIC0+XG4gICAgU3F1aXJyZWxVcGRhdGUuc3Bhd24oWyctLXVwZGF0ZScsIEB1cGRhdGVVcmxdLCBjYWxsYmFjaylcblxuICBzdXBwb3J0c1VwZGF0ZXM6IC0+XG4gICAgU3F1aXJyZWxVcGRhdGUuZXhpc3RzU3luYygpXG5cbiAgY2hlY2tGb3JVcGRhdGVzOiAtPlxuICAgIHRocm93IG5ldyBFcnJvcignVXBkYXRlIFVSTCBpcyBub3Qgc2V0JykgdW5sZXNzIEB1cGRhdGVVcmxcblxuICAgIEBlbWl0ICdjaGVja2luZy1mb3ItdXBkYXRlJ1xuXG4gICAgdW5sZXNzIFNxdWlycmVsVXBkYXRlLmV4aXN0c1N5bmMoKVxuICAgICAgQGVtaXQgJ3VwZGF0ZS1ub3QtYXZhaWxhYmxlJ1xuICAgICAgcmV0dXJuXG5cbiAgICBAZG93bmxvYWRVcGRhdGUgKGVycm9yLCB1cGRhdGUpID0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgQGVtaXQgJ3VwZGF0ZS1ub3QtYXZhaWxhYmxlJ1xuICAgICAgICByZXR1cm5cblxuICAgICAgdW5sZXNzIHVwZGF0ZT9cbiAgICAgICAgQGVtaXQgJ3VwZGF0ZS1ub3QtYXZhaWxhYmxlJ1xuICAgICAgICByZXR1cm5cblxuICAgICAgQGVtaXQgJ3VwZGF0ZS1hdmFpbGFibGUnXG5cbiAgICAgIEBpbnN0YWxsVXBkYXRlIChlcnJvcikgPT5cbiAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgQGVtaXQgJ3VwZGF0ZS1ub3QtYXZhaWxhYmxlJ1xuICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBlbWl0ICd1cGRhdGUtZG93bmxvYWRlZCcsIHt9LCB1cGRhdGUucmVsZWFzZU5vdGVzLCB1cGRhdGUudmVyc2lvbiwgbmV3IERhdGUoKSwgJ2h0dHBzOi8vYXRvbS5pbycsID0+IEBxdWl0QW5kSW5zdGFsbCgpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEF1dG9VcGRhdGVyKClcbiJdfQ==
