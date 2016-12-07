(function() {
  var ArchiveEditor, Disposable, Emitter, File, FileIcons, Serializable, fs, isPathSupported, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  Serializable = require('serializable');

  ref = require('atom'), Disposable = ref.Disposable, Emitter = ref.Emitter, File = ref.File;

  FileIcons = require('./file-icons');

  isPathSupported = function(filePath) {
    switch (path.extname(filePath)) {
      case '.egg':
      case '.epub':
      case '.jar':
      case '.love':
      case '.nupkg':
      case '.tar':
      case '.tgz':
      case '.war':
      case '.whl':
      case '.xpi':
      case '.zip':
        return true;
      case '.gz':
        return path.extname(path.basename(filePath, '.gz')) === '.tar';
      default:
        return false;
    }
  };

  module.exports = ArchiveEditor = (function(superClass) {
    extend(ArchiveEditor, superClass);

    ArchiveEditor.activate = function() {
      return atom.workspace.addOpener(function(filePath) {
        if (filePath == null) {
          filePath = '';
        }
        if (isPathSupported(filePath) && fs.isFileSync(filePath)) {
          return new ArchiveEditor({
            path: filePath
          });
        }
      });
    };

    function ArchiveEditor(arg) {
      var path;
      path = arg.path;
      this.file = new File(path);
      this.emitter = new Emitter();
    }

    ArchiveEditor.prototype.serializeParams = function() {
      return {
        path: this.getPath()
      };
    };

    ArchiveEditor.prototype.deserializeParams = function(params) {
      if (params == null) {
        params = {};
      }
      if (fs.isFileSync(params.path)) {
        return params;
      } else {
        return console.warn("Could not build archive editor for path '" + params.path + "' because that file no longer exists");
      }
    };

    ArchiveEditor.consumeFileIcons = function(service) {
      FileIcons.setService(service);
      return new Disposable(function() {
        return FileIcons.resetService();
      });
    };

    ArchiveEditor.prototype.getPath = function() {
      return this.file.getPath();
    };

    ArchiveEditor.prototype.destroy = function() {
      return this.emitter.emit('did-destroy');
    };

    ArchiveEditor.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    ArchiveEditor.prototype.getViewClass = function() {
      return require('./archive-editor-view');
    };

    ArchiveEditor.prototype.getTitle = function() {
      if (this.getPath() != null) {
        return path.basename(this.getPath());
      } else {
        return 'untitled';
      }
    };

    ArchiveEditor.prototype.getURI = function() {
      return this.getPath();
    };

    ArchiveEditor.prototype.isEqual = function(other) {
      return other instanceof ArchiveEditor && this.getURI() === other.getURI();
    };

    return ArchiveEditor;

  })(Serializable);

  if (parseFloat(atom.getVersion()) < 1.7) {
    atom.deserializers.add(ArchiveEditor);
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2FyY2hpdmUtZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaUdBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxZQUFBLEdBQWUsT0FBQSxDQUFRLGNBQVI7O0VBQ2YsTUFBOEIsT0FBQSxDQUFRLE1BQVIsQ0FBOUIsRUFBQywyQkFBRCxFQUFhLHFCQUFiLEVBQXNCOztFQUN0QixTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBRVosZUFBQSxHQUFrQixTQUFDLFFBQUQ7QUFDaEIsWUFBTyxJQUFJLENBQUMsT0FBTCxDQUFhLFFBQWIsQ0FBUDtBQUFBLFdBQ08sTUFEUDtBQUFBLFdBQ2UsT0FEZjtBQUFBLFdBQ3dCLE1BRHhCO0FBQUEsV0FDZ0MsT0FEaEM7QUFBQSxXQUN5QyxRQUR6QztBQUFBLFdBQ21ELE1BRG5EO0FBQUEsV0FDMkQsTUFEM0Q7QUFBQSxXQUNtRSxNQURuRTtBQUFBLFdBQzJFLE1BRDNFO0FBQUEsV0FDbUYsTUFEbkY7QUFBQSxXQUMyRixNQUQzRjtBQUVJLGVBQU87QUFGWCxXQUdPLEtBSFA7QUFJSSxlQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxRQUFkLEVBQXdCLEtBQXhCLENBQWIsQ0FBQSxLQUFnRDtBQUozRDtBQU1JLGVBQU87QUFOWDtFQURnQjs7RUFTbEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ0osYUFBQyxDQUFBLFFBQUQsR0FBVyxTQUFBO2FBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLFNBQUMsUUFBRDs7VUFBQyxXQUFTOztRQUdqQyxJQUFHLGVBQUEsQ0FBZ0IsUUFBaEIsQ0FBQSxJQUE4QixFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBakM7aUJBQ00sSUFBQSxhQUFBLENBQWM7WUFBQSxJQUFBLEVBQU0sUUFBTjtXQUFkLEVBRE47O01BSHVCLENBQXpCO0lBRFM7O0lBT0UsdUJBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSxPQUFEO01BQ1osSUFBQyxDQUFBLElBQUQsR0FBWSxJQUFBLElBQUEsQ0FBSyxJQUFMO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBZSxJQUFBLE9BQUEsQ0FBQTtJQUZKOzs0QkFJYixlQUFBLEdBQWlCLFNBQUE7YUFDZjtRQUFBLElBQUEsRUFBTSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQU47O0lBRGU7OzRCQUdqQixpQkFBQSxHQUFtQixTQUFDLE1BQUQ7O1FBQUMsU0FBTzs7TUFDekIsSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLE1BQU0sQ0FBQyxJQUFyQixDQUFIO2VBQ0UsT0FERjtPQUFBLE1BQUE7ZUFHRSxPQUFPLENBQUMsSUFBUixDQUFhLDJDQUFBLEdBQTRDLE1BQU0sQ0FBQyxJQUFuRCxHQUF3RCxzQ0FBckUsRUFIRjs7SUFEaUI7O0lBTW5CLGFBQUMsQ0FBQSxnQkFBRCxHQUFtQixTQUFDLE9BQUQ7TUFDakIsU0FBUyxDQUFDLFVBQVYsQ0FBcUIsT0FBckI7YUFDSSxJQUFBLFVBQUEsQ0FBVyxTQUFBO2VBQ2IsU0FBUyxDQUFDLFlBQVYsQ0FBQTtNQURhLENBQVg7SUFGYTs7NEJBS25CLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7SUFETzs7NEJBR1QsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxhQUFkO0lBRE87OzRCQUdULFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCO0lBRFk7OzRCQUdkLFlBQUEsR0FBYyxTQUFBO2FBQUcsT0FBQSxDQUFRLHVCQUFSO0lBQUg7OzRCQUVkLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBRyxzQkFBSDtlQUNFLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFkLEVBREY7T0FBQSxNQUFBO2VBR0UsV0FIRjs7SUFEUTs7NEJBTVYsTUFBQSxHQUFRLFNBQUE7YUFBRyxJQUFDLENBQUEsT0FBRCxDQUFBO0lBQUg7OzRCQUVSLE9BQUEsR0FBUyxTQUFDLEtBQUQ7YUFDUCxLQUFBLFlBQWlCLGFBQWpCLElBQW1DLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBQSxLQUFhLEtBQUssQ0FBQyxNQUFOLENBQUE7SUFEekM7Ozs7S0E3Q2lCOztFQWdENUIsSUFBRyxVQUFBLENBQVcsSUFBSSxDQUFDLFVBQUwsQ0FBQSxDQUFYLENBQUEsR0FBZ0MsR0FBbkM7SUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQW5CLENBQXVCLGFBQXZCLEVBREY7O0FBakVBIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblNlcmlhbGl6YWJsZSA9IHJlcXVpcmUgJ3NlcmlhbGl6YWJsZSdcbntEaXNwb3NhYmxlLCBFbWl0dGVyLCBGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5GaWxlSWNvbnMgPSByZXF1aXJlICcuL2ZpbGUtaWNvbnMnXG5cbmlzUGF0aFN1cHBvcnRlZCA9IChmaWxlUGF0aCkgLT5cbiAgc3dpdGNoIHBhdGguZXh0bmFtZShmaWxlUGF0aClcbiAgICB3aGVuICcuZWdnJywgJy5lcHViJywgJy5qYXInLCAnLmxvdmUnLCAnLm51cGtnJywgJy50YXInLCAnLnRneicsICcud2FyJywgJy53aGwnLCAnLnhwaScsICcuemlwJ1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB3aGVuICcuZ3onXG4gICAgICByZXR1cm4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsICcuZ3onKSkgaXMgJy50YXInXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzPVxuY2xhc3MgQXJjaGl2ZUVkaXRvciBleHRlbmRzIFNlcmlhbGl6YWJsZVxuICBAYWN0aXZhdGU6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyIChmaWxlUGF0aD0nJykgLT5cbiAgICAgICMgQ2hlY2sgdGhhdCB0aGUgZmlsZSBwYXRoIGV4aXN0cyBiZWZvcmUgb3BlbmluZyBpbiBjYXNlIHNvbWV0aGluZyBsaWtlXG4gICAgICAjIGFuIGh0dHA6IFVSSSBpcyBiZWluZyBvcGVuZWQuXG4gICAgICBpZiBpc1BhdGhTdXBwb3J0ZWQoZmlsZVBhdGgpIGFuZCBmcy5pc0ZpbGVTeW5jKGZpbGVQYXRoKVxuICAgICAgICBuZXcgQXJjaGl2ZUVkaXRvcihwYXRoOiBmaWxlUGF0aClcblxuICBjb25zdHJ1Y3RvcjogKHtwYXRofSkgLT5cbiAgICBAZmlsZSA9IG5ldyBGaWxlKHBhdGgpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cbiAgc2VyaWFsaXplUGFyYW1zOiAtPlxuICAgIHBhdGg6IEBnZXRQYXRoKClcblxuICBkZXNlcmlhbGl6ZVBhcmFtczogKHBhcmFtcz17fSkgLT5cbiAgICBpZiBmcy5pc0ZpbGVTeW5jKHBhcmFtcy5wYXRoKVxuICAgICAgcGFyYW1zXG4gICAgZWxzZVxuICAgICAgY29uc29sZS53YXJuIFwiQ291bGQgbm90IGJ1aWxkIGFyY2hpdmUgZWRpdG9yIGZvciBwYXRoICcje3BhcmFtcy5wYXRofScgYmVjYXVzZSB0aGF0IGZpbGUgbm8gbG9uZ2VyIGV4aXN0c1wiXG5cbiAgQGNvbnN1bWVGaWxlSWNvbnM6IChzZXJ2aWNlKSAtPlxuICAgIEZpbGVJY29ucy5zZXRTZXJ2aWNlKHNlcnZpY2UpXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuXG4gIGdldFBhdGg6IC0+XG4gICAgQGZpbGUuZ2V0UGF0aCgpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcblxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWRlc3Ryb3knLCBjYWxsYmFja1xuXG4gIGdldFZpZXdDbGFzczogLT4gcmVxdWlyZSAnLi9hcmNoaXZlLWVkaXRvci12aWV3J1xuXG4gIGdldFRpdGxlOiAtPlxuICAgIGlmIEBnZXRQYXRoKCk/XG4gICAgICBwYXRoLmJhc2VuYW1lKEBnZXRQYXRoKCkpXG4gICAgZWxzZVxuICAgICAgJ3VudGl0bGVkJ1xuXG4gIGdldFVSSTogLT4gQGdldFBhdGgoKVxuXG4gIGlzRXF1YWw6IChvdGhlcikgLT5cbiAgICBvdGhlciBpbnN0YW5jZW9mIEFyY2hpdmVFZGl0b3IgYW5kIEBnZXRVUkkoKSBpcyBvdGhlci5nZXRVUkkoKVxuXG5pZiBwYXJzZUZsb2F0KGF0b20uZ2V0VmVyc2lvbigpKSA8IDEuN1xuICBhdG9tLmRlc2VyaWFsaXplcnMuYWRkKEFyY2hpdmVFZGl0b3IpXG4iXX0=
