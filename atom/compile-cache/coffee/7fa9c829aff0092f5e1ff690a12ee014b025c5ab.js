(function() {
  var ArchiveEditor, Emitter, File, FileIcons, Serializable, fs, isPathSupported, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  Serializable = require('serializable');

  ref = require('atom'), Emitter = ref.Emitter, File = ref.File;

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
      return this.fileIconsDisposable = service.onWillDeactivate(function() {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL2FyY2hpdmUtdmlldy9saWIvYXJjaGl2ZS1lZGl0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxRkFBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFlBQUEsR0FBZSxPQUFBLENBQVEsY0FBUjs7RUFDZixNQUFrQixPQUFBLENBQVEsTUFBUixDQUFsQixFQUFDLHFCQUFELEVBQVU7O0VBQ1YsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSOztFQUVaLGVBQUEsR0FBa0IsU0FBQyxRQUFEO0FBQ2hCLFlBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBQVA7QUFBQSxXQUNPLE1BRFA7QUFBQSxXQUNlLE9BRGY7QUFBQSxXQUN3QixNQUR4QjtBQUFBLFdBQ2dDLE9BRGhDO0FBQUEsV0FDeUMsUUFEekM7QUFBQSxXQUNtRCxNQURuRDtBQUFBLFdBQzJELE1BRDNEO0FBQUEsV0FDbUUsTUFEbkU7QUFBQSxXQUMyRSxNQUQzRTtBQUFBLFdBQ21GLE1BRG5GO0FBQUEsV0FDMkYsTUFEM0Y7QUFFSSxlQUFPO0FBRlgsV0FHTyxLQUhQO0FBSUksZUFBTyxJQUFJLENBQUMsT0FBTCxDQUFhLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZCxFQUF3QixLQUF4QixDQUFiLENBQUEsS0FBZ0Q7QUFKM0Q7QUFNSSxlQUFPO0FBTlg7RUFEZ0I7O0VBU2xCLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztJQUNKLGFBQUMsQ0FBQSxRQUFELEdBQVcsU0FBQTthQUNULElBQUksQ0FBQyxTQUFTLENBQUMsU0FBZixDQUF5QixTQUFDLFFBQUQ7O1VBQUMsV0FBUzs7UUFHakMsSUFBRyxlQUFBLENBQWdCLFFBQWhCLENBQUEsSUFBOEIsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQWpDO2lCQUNNLElBQUEsYUFBQSxDQUFjO1lBQUEsSUFBQSxFQUFNLFFBQU47V0FBZCxFQUROOztNQUh1QixDQUF6QjtJQURTOztJQU9FLHVCQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsT0FBRDtNQUNaLElBQUMsQ0FBQSxJQUFELEdBQVksSUFBQSxJQUFBLENBQUssSUFBTDtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQWUsSUFBQSxPQUFBLENBQUE7SUFGSjs7NEJBSWIsZUFBQSxHQUFpQixTQUFBO2FBQ2Y7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFOOztJQURlOzs0QkFHakIsaUJBQUEsR0FBbUIsU0FBQyxNQUFEOztRQUFDLFNBQU87O01BQ3pCLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxNQUFNLENBQUMsSUFBckIsQ0FBSDtlQUNFLE9BREY7T0FBQSxNQUFBO2VBR0UsT0FBTyxDQUFDLElBQVIsQ0FBYSwyQ0FBQSxHQUE0QyxNQUFNLENBQUMsSUFBbkQsR0FBd0Qsc0NBQXJFLEVBSEY7O0lBRGlCOztJQU1uQixhQUFDLENBQUEsZ0JBQUQsR0FBbUIsU0FBQyxPQUFEO01BQ2pCLFNBQVMsQ0FBQyxVQUFWLENBQXFCLE9BQXJCO2FBQ0EsSUFBQyxDQUFBLG1CQUFELEdBQXVCLE9BQU8sQ0FBQyxnQkFBUixDQUF5QixTQUFBO2VBQzlDLFNBQVMsQ0FBQyxZQUFWLENBQUE7TUFEOEMsQ0FBekI7SUFGTjs7NEJBS25CLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7SUFETzs7NEJBR1QsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxhQUFkO0lBRE87OzRCQUdULFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCO0lBRFk7OzRCQUdkLFlBQUEsR0FBYyxTQUFBO2FBQUcsT0FBQSxDQUFRLHVCQUFSO0lBQUg7OzRCQUVkLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBRyxzQkFBSDtlQUNFLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFkLEVBREY7T0FBQSxNQUFBO2VBR0UsV0FIRjs7SUFEUTs7NEJBTVYsTUFBQSxHQUFRLFNBQUE7YUFBRyxJQUFDLENBQUEsT0FBRCxDQUFBO0lBQUg7OzRCQUVSLE9BQUEsR0FBUyxTQUFDLEtBQUQ7YUFDUCxLQUFBLFlBQWlCLGFBQWpCLElBQW1DLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBQSxLQUFhLEtBQUssQ0FBQyxNQUFOLENBQUE7SUFEekM7Ozs7S0E3Q2lCOztFQWdENUIsSUFBRyxVQUFBLENBQVcsSUFBSSxDQUFDLFVBQUwsQ0FBQSxDQUFYLENBQUEsR0FBZ0MsR0FBbkM7SUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQW5CLENBQXVCLGFBQXZCLEVBREY7O0FBakVBIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblNlcmlhbGl6YWJsZSA9IHJlcXVpcmUgJ3NlcmlhbGl6YWJsZSdcbntFbWl0dGVyLCBGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5GaWxlSWNvbnMgPSByZXF1aXJlICcuL2ZpbGUtaWNvbnMnXG5cbmlzUGF0aFN1cHBvcnRlZCA9IChmaWxlUGF0aCkgLT5cbiAgc3dpdGNoIHBhdGguZXh0bmFtZShmaWxlUGF0aClcbiAgICB3aGVuICcuZWdnJywgJy5lcHViJywgJy5qYXInLCAnLmxvdmUnLCAnLm51cGtnJywgJy50YXInLCAnLnRneicsICcud2FyJywgJy53aGwnLCAnLnhwaScsICcuemlwJ1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB3aGVuICcuZ3onXG4gICAgICByZXR1cm4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsICcuZ3onKSkgaXMgJy50YXInXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzPVxuY2xhc3MgQXJjaGl2ZUVkaXRvciBleHRlbmRzIFNlcmlhbGl6YWJsZVxuICBAYWN0aXZhdGU6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyIChmaWxlUGF0aD0nJykgLT5cbiAgICAgICMgQ2hlY2sgdGhhdCB0aGUgZmlsZSBwYXRoIGV4aXN0cyBiZWZvcmUgb3BlbmluZyBpbiBjYXNlIHNvbWV0aGluZyBsaWtlXG4gICAgICAjIGFuIGh0dHA6IFVSSSBpcyBiZWluZyBvcGVuZWQuXG4gICAgICBpZiBpc1BhdGhTdXBwb3J0ZWQoZmlsZVBhdGgpIGFuZCBmcy5pc0ZpbGVTeW5jKGZpbGVQYXRoKVxuICAgICAgICBuZXcgQXJjaGl2ZUVkaXRvcihwYXRoOiBmaWxlUGF0aClcblxuICBjb25zdHJ1Y3RvcjogKHtwYXRofSkgLT5cbiAgICBAZmlsZSA9IG5ldyBGaWxlKHBhdGgpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cbiAgc2VyaWFsaXplUGFyYW1zOiAtPlxuICAgIHBhdGg6IEBnZXRQYXRoKClcblxuICBkZXNlcmlhbGl6ZVBhcmFtczogKHBhcmFtcz17fSkgLT5cbiAgICBpZiBmcy5pc0ZpbGVTeW5jKHBhcmFtcy5wYXRoKVxuICAgICAgcGFyYW1zXG4gICAgZWxzZVxuICAgICAgY29uc29sZS53YXJuIFwiQ291bGQgbm90IGJ1aWxkIGFyY2hpdmUgZWRpdG9yIGZvciBwYXRoICcje3BhcmFtcy5wYXRofScgYmVjYXVzZSB0aGF0IGZpbGUgbm8gbG9uZ2VyIGV4aXN0c1wiXG5cbiAgQGNvbnN1bWVGaWxlSWNvbnM6IChzZXJ2aWNlKSAtPlxuICAgIEZpbGVJY29ucy5zZXRTZXJ2aWNlKHNlcnZpY2UpXG4gICAgQGZpbGVJY29uc0Rpc3Bvc2FibGUgPSBzZXJ2aWNlLm9uV2lsbERlYWN0aXZhdGUgLT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuXG4gIGdldFBhdGg6IC0+XG4gICAgQGZpbGUuZ2V0UGF0aCgpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcblxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWRlc3Ryb3knLCBjYWxsYmFja1xuXG4gIGdldFZpZXdDbGFzczogLT4gcmVxdWlyZSAnLi9hcmNoaXZlLWVkaXRvci12aWV3J1xuXG4gIGdldFRpdGxlOiAtPlxuICAgIGlmIEBnZXRQYXRoKCk/XG4gICAgICBwYXRoLmJhc2VuYW1lKEBnZXRQYXRoKCkpXG4gICAgZWxzZVxuICAgICAgJ3VudGl0bGVkJ1xuXG4gIGdldFVSSTogLT4gQGdldFBhdGgoKVxuXG4gIGlzRXF1YWw6IChvdGhlcikgLT5cbiAgICBvdGhlciBpbnN0YW5jZW9mIEFyY2hpdmVFZGl0b3IgYW5kIEBnZXRVUkkoKSBpcyBvdGhlci5nZXRVUkkoKVxuXG5pZiBwYXJzZUZsb2F0KGF0b20uZ2V0VmVyc2lvbigpKSA8IDEuN1xuICBhdG9tLmRlc2VyaWFsaXplcnMuYWRkKEFyY2hpdmVFZGl0b3IpXG4iXX0=
