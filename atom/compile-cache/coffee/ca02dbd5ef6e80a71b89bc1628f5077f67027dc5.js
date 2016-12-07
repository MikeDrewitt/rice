(function() {
  var CompositeDisposable, Directory, Emitter, File, Watcher, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), File = ref.File, Directory = ref.Directory;

  ref1 = require('atom'), CompositeDisposable = ref1.CompositeDisposable, Emitter = ref1.Emitter;

  path = require('path');

  module.exports = Watcher = (function() {
    function Watcher() {
      this.destroy = bind(this.destroy, this);
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.entities = [];
    }

    Watcher.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    Watcher.prototype.onDidChangeGlobals = function(callback) {
      return this.emitter.on('did-change-globals', callback);
    };

    Watcher.prototype.destroy = function() {
      this.disposables.dispose();
      this.entities = null;
      this.emitter.emit('did-destroy');
      return this.emitter.dispose();
    };

    Watcher.prototype.watch = function() {};

    Watcher.prototype.loadStylesheet = function(stylesheetPath) {};

    Watcher.prototype.loadAllStylesheets = function() {};

    Watcher.prototype.emitGlobalsChanged = function() {
      return this.emitter.emit('did-change-globals');
    };

    Watcher.prototype.watchDirectory = function(directoryPath) {
      var entity;
      if (this.isInAsarArchive(directoryPath)) {
        return;
      }
      entity = new Directory(directoryPath);
      this.disposables.add(entity.onDidChange((function(_this) {
        return function() {
          return _this.loadAllStylesheets();
        };
      })(this)));
      return this.entities.push(entity);
    };

    Watcher.prototype.watchGlobalFile = function(filePath) {
      var entity;
      entity = new File(filePath);
      this.disposables.add(entity.onDidChange((function(_this) {
        return function() {
          return _this.emitGlobalsChanged();
        };
      })(this)));
      return this.entities.push(entity);
    };

    Watcher.prototype.watchFile = function(filePath) {
      var entity, reloadFn;
      if (this.isInAsarArchive(filePath)) {
        return;
      }
      reloadFn = (function(_this) {
        return function() {
          return _this.loadStylesheet(entity.getPath());
        };
      })(this);
      entity = new File(filePath);
      this.disposables.add(entity.onDidChange(reloadFn));
      this.disposables.add(entity.onDidDelete(reloadFn));
      this.disposables.add(entity.onDidRename(reloadFn));
      return this.entities.push(entity);
    };

    Watcher.prototype.isInAsarArchive = function(pathToCheck) {
      var resourcePath;
      resourcePath = atom.getLoadSettings().resourcePath;
      return pathToCheck.startsWith("" + resourcePath + path.sep) && path.extname(resourcePath) === '.asar';
    };

    return Watcher;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXYtbGl2ZS1yZWxvYWQvbGliL3dhdGNoZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1RUFBQTtJQUFBOztFQUFBLE1BQW9CLE9BQUEsQ0FBUSxNQUFSLENBQXBCLEVBQUMsZUFBRCxFQUFPOztFQUNQLE9BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsOENBQUQsRUFBc0I7O0VBQ3RCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsaUJBQUE7O01BQ1gsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFIRDs7c0JBS2IsWUFBQSxHQUFjLFNBQUMsUUFBRDthQUNaLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGFBQVosRUFBMkIsUUFBM0I7SUFEWTs7c0JBR2Qsa0JBQUEsR0FBb0IsU0FBQyxRQUFEO2FBQ2xCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG9CQUFaLEVBQWtDLFFBQWxDO0lBRGtCOztzQkFHcEIsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxhQUFkO2FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQUE7SUFKTzs7c0JBTVQsS0FBQSxHQUFPLFNBQUEsR0FBQTs7c0JBR1AsY0FBQSxHQUFnQixTQUFDLGNBQUQsR0FBQTs7c0JBR2hCLGtCQUFBLEdBQW9CLFNBQUEsR0FBQTs7c0JBR3BCLGtCQUFBLEdBQW9CLFNBQUE7YUFDbEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0JBQWQ7SUFEa0I7O3NCQUdwQixjQUFBLEdBQWdCLFNBQUMsYUFBRDtBQUNkLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxlQUFELENBQWlCLGFBQWpCLENBQVY7QUFBQSxlQUFBOztNQUNBLE1BQUEsR0FBYSxJQUFBLFNBQUEsQ0FBVSxhQUFWO01BQ2IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLE1BQU0sQ0FBQyxXQUFQLENBQW1CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsa0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQixDQUFqQjthQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLE1BQWY7SUFKYzs7c0JBTWhCLGVBQUEsR0FBaUIsU0FBQyxRQUFEO0FBQ2YsVUFBQTtNQUFBLE1BQUEsR0FBYSxJQUFBLElBQUEsQ0FBSyxRQUFMO01BQ2IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLE1BQU0sQ0FBQyxXQUFQLENBQW1CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsa0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQixDQUFqQjthQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLE1BQWY7SUFIZTs7c0JBS2pCLFNBQUEsR0FBVyxTQUFDLFFBQUQ7QUFDVCxVQUFBO01BQUEsSUFBVSxJQUFDLENBQUEsZUFBRCxDQUFpQixRQUFqQixDQUFWO0FBQUEsZUFBQTs7TUFDQSxRQUFBLEdBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNULEtBQUMsQ0FBQSxjQUFELENBQWdCLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBaEI7UUFEUztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7TUFHWCxNQUFBLEdBQWEsSUFBQSxJQUFBLENBQUssUUFBTDtNQUNiLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixNQUFNLENBQUMsV0FBUCxDQUFtQixRQUFuQixDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixNQUFNLENBQUMsV0FBUCxDQUFtQixRQUFuQixDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixNQUFNLENBQUMsV0FBUCxDQUFtQixRQUFuQixDQUFqQjthQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLE1BQWY7SUFUUzs7c0JBV1gsZUFBQSxHQUFpQixTQUFDLFdBQUQ7QUFDZixVQUFBO01BQUMsZUFBZ0IsSUFBSSxDQUFDLGVBQUwsQ0FBQTthQUNqQixXQUFXLENBQUMsVUFBWixDQUF1QixFQUFBLEdBQUcsWUFBSCxHQUFrQixJQUFJLENBQUMsR0FBOUMsQ0FBQSxJQUF5RCxJQUFJLENBQUMsT0FBTCxDQUFhLFlBQWIsQ0FBQSxLQUE4QjtJQUZ4RTs7Ozs7QUF6RG5CIiwic291cmNlc0NvbnRlbnQiOlsie0ZpbGUsIERpcmVjdG9yeX0gPSByZXF1aXJlICdhdG9tJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBXYXRjaGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbnRpdGllcyA9IFtdXG5cbiAgb25EaWREZXN0cm95OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgY2FsbGJhY2tcblxuICBvbkRpZENoYW5nZUdsb2JhbHM6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1nbG9iYWxzJywgY2FsbGJhY2tcblxuICBkZXN0cm95OiA9PlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZW50aXRpZXMgPSBudWxsXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWRlc3Ryb3knKVxuICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuXG4gIHdhdGNoOiAtPlxuICAgICMgb3ZlcnJpZGUgbWVcblxuICBsb2FkU3R5bGVzaGVldDogKHN0eWxlc2hlZXRQYXRoKSAtPlxuICAgICMgb3ZlcnJpZGUgbWVcblxuICBsb2FkQWxsU3R5bGVzaGVldHM6IC0+XG4gICAgIyBvdmVycmlkZSBtZVxuXG4gIGVtaXRHbG9iYWxzQ2hhbmdlZDogLT5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLWdsb2JhbHMnKVxuXG4gIHdhdGNoRGlyZWN0b3J5OiAoZGlyZWN0b3J5UGF0aCkgLT5cbiAgICByZXR1cm4gaWYgQGlzSW5Bc2FyQXJjaGl2ZShkaXJlY3RvcnlQYXRoKVxuICAgIGVudGl0eSA9IG5ldyBEaXJlY3RvcnkoZGlyZWN0b3J5UGF0aClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGVudGl0eS5vbkRpZENoYW5nZSA9PiBAbG9hZEFsbFN0eWxlc2hlZXRzKClcbiAgICBAZW50aXRpZXMucHVzaChlbnRpdHkpXG5cbiAgd2F0Y2hHbG9iYWxGaWxlOiAoZmlsZVBhdGgpIC0+XG4gICAgZW50aXR5ID0gbmV3IEZpbGUoZmlsZVBhdGgpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBlbnRpdHkub25EaWRDaGFuZ2UgPT4gQGVtaXRHbG9iYWxzQ2hhbmdlZCgpXG4gICAgQGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gIHdhdGNoRmlsZTogKGZpbGVQYXRoKSAtPlxuICAgIHJldHVybiBpZiBAaXNJbkFzYXJBcmNoaXZlKGZpbGVQYXRoKVxuICAgIHJlbG9hZEZuID0gPT5cbiAgICAgIEBsb2FkU3R5bGVzaGVldChlbnRpdHkuZ2V0UGF0aCgpKVxuXG4gICAgZW50aXR5ID0gbmV3IEZpbGUoZmlsZVBhdGgpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBlbnRpdHkub25EaWRDaGFuZ2UocmVsb2FkRm4pXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBlbnRpdHkub25EaWREZWxldGUocmVsb2FkRm4pXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBlbnRpdHkub25EaWRSZW5hbWUocmVsb2FkRm4pXG4gICAgQGVudGl0aWVzLnB1c2goZW50aXR5KVxuXG4gIGlzSW5Bc2FyQXJjaGl2ZTogKHBhdGhUb0NoZWNrKSAtPlxuICAgIHtyZXNvdXJjZVBhdGh9ID0gYXRvbS5nZXRMb2FkU2V0dGluZ3MoKVxuICAgIHBhdGhUb0NoZWNrLnN0YXJ0c1dpdGgoXCIje3Jlc291cmNlUGF0aH0je3BhdGguc2VwfVwiKSBhbmQgcGF0aC5leHRuYW1lKHJlc291cmNlUGF0aCkgaXMgJy5hc2FyJ1xuIl19
