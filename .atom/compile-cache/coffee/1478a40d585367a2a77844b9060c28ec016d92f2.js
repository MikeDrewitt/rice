(function() {
  var CompositeDisposable, Emitter, File, ImageEditor, fs, path, ref;

  path = require('path');

  fs = require('fs-plus');

  ref = require('atom'), Emitter = ref.Emitter, File = ref.File, CompositeDisposable = ref.CompositeDisposable;

  module.exports = ImageEditor = (function() {
    atom.deserializers.add(ImageEditor);

    ImageEditor.deserialize = function(arg) {
      var filePath;
      filePath = arg.filePath;
      if (fs.isFileSync(filePath)) {
        return new ImageEditor(filePath);
      } else {
        return console.warn("Could not deserialize image editor for path '" + filePath + "' because that file no longer exists");
      }
    };

    function ImageEditor(filePath) {
      this.file = new File(filePath);
      this.subscriptions = new CompositeDisposable();
      this.emitter = new Emitter;
    }

    ImageEditor.prototype.serialize = function() {
      return {
        filePath: this.getPath(),
        deserializer: this.constructor.name
      };
    };

    ImageEditor.prototype.getViewClass = function() {
      return require('./image-editor-view');
    };

    ImageEditor.prototype.terminatePendingState = function() {
      if (this.isEqual(atom.workspace.getActivePane().getPendingItem())) {
        return this.emitter.emit('did-terminate-pending-state');
      }
    };

    ImageEditor.prototype.onDidTerminatePendingState = function(callback) {
      return this.emitter.on('did-terminate-pending-state', callback);
    };

    ImageEditor.prototype.onDidChange = function(callback) {
      var changeSubscription;
      changeSubscription = this.file.onDidChange(callback);
      this.subscriptions.add(changeSubscription);
      return changeSubscription;
    };

    ImageEditor.prototype.onDidChangeTitle = function(callback) {
      var renameSubscription;
      renameSubscription = this.file.onDidRename(callback);
      this.subscriptions.add(renameSubscription);
      return renameSubscription;
    };

    ImageEditor.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    ImageEditor.prototype.getTitle = function() {
      var filePath;
      if (filePath = this.getPath()) {
        return path.basename(filePath);
      } else {
        return 'untitled';
      }
    };

    ImageEditor.prototype.getPath = function() {
      return this.file.getPath();
    };

    ImageEditor.prototype.getURI = function() {
      return this.getPath();
    };

    ImageEditor.prototype.getEncodedURI = function() {
      return "file://" + encodeURI(this.getPath().replace(/\\/g, '/')).replace(/#/g, '%23').replace(/\?/g, '%3F');
    };

    ImageEditor.prototype.isEqual = function(other) {
      return other instanceof ImageEditor && this.getURI() === other.getURI();
    };

    ImageEditor.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    return ImageEditor;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9pbWFnZS12aWV3L2xpYi9pbWFnZS1lZGl0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQXVDLE9BQUEsQ0FBUSxNQUFSLENBQXZDLEVBQUMscUJBQUQsRUFBVSxlQUFWLEVBQWdCOztFQUdoQixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFuQixDQUF1QixXQUF2Qjs7SUFFQSxXQUFDLENBQUEsV0FBRCxHQUFjLFNBQUMsR0FBRDtBQUNaLFVBQUE7TUFEYyxXQUFEO01BQ2IsSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBSDtlQUNNLElBQUEsV0FBQSxDQUFZLFFBQVosRUFETjtPQUFBLE1BQUE7ZUFHRSxPQUFPLENBQUMsSUFBUixDQUFhLCtDQUFBLEdBQWdELFFBQWhELEdBQXlELHNDQUF0RSxFQUhGOztJQURZOztJQU1ELHFCQUFDLFFBQUQ7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFZLElBQUEsSUFBQSxDQUFLLFFBQUw7TUFDWixJQUFDLENBQUEsYUFBRCxHQUFxQixJQUFBLG1CQUFBLENBQUE7TUFDckIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO0lBSEo7OzBCQUtiLFNBQUEsR0FBVyxTQUFBO2FBQ1Q7UUFBQyxRQUFBLEVBQVUsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFYO1FBQXVCLFlBQUEsRUFBYyxJQUFDLENBQUEsV0FBVyxDQUFDLElBQWxEOztJQURTOzswQkFHWCxZQUFBLEdBQWMsU0FBQTthQUNaLE9BQUEsQ0FBUSxxQkFBUjtJQURZOzswQkFHZCxxQkFBQSxHQUF1QixTQUFBO01BQ3JCLElBQStDLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUEsQ0FBOEIsQ0FBQyxjQUEvQixDQUFBLENBQWIsQ0FBL0M7ZUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyw2QkFBZCxFQUFBOztJQURxQjs7MEJBR3ZCLDBCQUFBLEdBQTRCLFNBQUMsUUFBRDthQUMxQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSw2QkFBWixFQUEyQyxRQUEzQztJQUQwQjs7MEJBSTVCLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO01BQUEsa0JBQUEsR0FBcUIsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLFFBQWxCO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixrQkFBbkI7YUFDQTtJQUhXOzswQkFNYixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7QUFDaEIsVUFBQTtNQUFBLGtCQUFBLEdBQXFCLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixRQUFsQjtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsa0JBQW5CO2FBQ0E7SUFIZ0I7OzBCQUtsQixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRE87OzBCQVFULFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBZDtlQUNFLElBQUksQ0FBQyxRQUFMLENBQWMsUUFBZCxFQURGO09BQUEsTUFBQTtlQUdFLFdBSEY7O0lBRFE7OzBCQVNWLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7SUFETzs7MEJBTVQsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsT0FBRCxDQUFBO0lBRE07OzBCQU1SLGFBQUEsR0FBZSxTQUFBO2FBQ2IsU0FBQSxHQUFZLFNBQUEsQ0FBVSxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEdBQTFCLENBQVYsQ0FBeUMsQ0FBQyxPQUExQyxDQUFrRCxJQUFsRCxFQUF3RCxLQUF4RCxDQUE4RCxDQUFDLE9BQS9ELENBQXVFLEtBQXZFLEVBQThFLEtBQTlFO0lBREM7OzBCQVFmLE9BQUEsR0FBUyxTQUFDLEtBQUQ7YUFDUCxLQUFBLFlBQWlCLFdBQWpCLElBQWlDLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FBQSxLQUFhLEtBQUssQ0FBQyxNQUFOLENBQUE7SUFEdkM7OzBCQVFULFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCO0lBRFk7Ozs7O0FBekZoQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xue0VtaXR0ZXIsIEZpbGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuIyBFZGl0b3IgbW9kZWwgZm9yIGFuIGltYWdlIGZpbGVcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEltYWdlRWRpdG9yXG4gIGF0b20uZGVzZXJpYWxpemVycy5hZGQodGhpcylcblxuICBAZGVzZXJpYWxpemU6ICh7ZmlsZVBhdGh9KSAtPlxuICAgIGlmIGZzLmlzRmlsZVN5bmMoZmlsZVBhdGgpXG4gICAgICBuZXcgSW1hZ2VFZGl0b3IoZmlsZVBhdGgpXG4gICAgZWxzZVxuICAgICAgY29uc29sZS53YXJuIFwiQ291bGQgbm90IGRlc2VyaWFsaXplIGltYWdlIGVkaXRvciBmb3IgcGF0aCAnI3tmaWxlUGF0aH0nIGJlY2F1c2UgdGhhdCBmaWxlIG5vIGxvbmdlciBleGlzdHNcIlxuXG4gIGNvbnN0cnVjdG9yOiAoZmlsZVBhdGgpIC0+XG4gICAgQGZpbGUgPSBuZXcgRmlsZShmaWxlUGF0aClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIHtmaWxlUGF0aDogQGdldFBhdGgoKSwgZGVzZXJpYWxpemVyOiBAY29uc3RydWN0b3IubmFtZX1cblxuICBnZXRWaWV3Q2xhc3M6IC0+XG4gICAgcmVxdWlyZSAnLi9pbWFnZS1lZGl0b3ItdmlldydcblxuICB0ZXJtaW5hdGVQZW5kaW5nU3RhdGU6IC0+XG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXRlcm1pbmF0ZS1wZW5kaW5nLXN0YXRlJyBpZiB0aGlzLmlzRXF1YWwoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmdldFBlbmRpbmdJdGVtKCkpXG5cbiAgb25EaWRUZXJtaW5hdGVQZW5kaW5nU3RhdGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXRlcm1pbmF0ZS1wZW5kaW5nLXN0YXRlJywgY2FsbGJhY2tcblxuICAjIFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHdoZW4gdGhlIGltYWdlIGZpbGUgY2hhbmdlc1xuICBvbkRpZENoYW5nZTogKGNhbGxiYWNrKSAtPlxuICAgIGNoYW5nZVN1YnNjcmlwdGlvbiA9IEBmaWxlLm9uRGlkQ2hhbmdlKGNhbGxiYWNrKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChjaGFuZ2VTdWJzY3JpcHRpb24pXG4gICAgY2hhbmdlU3Vic2NyaXB0aW9uXG5cbiAgIyBSZWdpc3RlciBhIGNhbGxiYWNrIGZvciB3aG5lIHRoZSBpbWFnZSdzIHRpdGxlIGNoYW5nZXNcbiAgb25EaWRDaGFuZ2VUaXRsZTogKGNhbGxiYWNrKSAtPlxuICAgIHJlbmFtZVN1YnNjcmlwdGlvbiA9IEBmaWxlLm9uRGlkUmVuYW1lKGNhbGxiYWNrKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChyZW5hbWVTdWJzY3JpcHRpb24pXG4gICAgcmVuYW1lU3Vic2NyaXB0aW9uXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICAjIFJldHJpZXZlcyB0aGUgZmlsZW5hbWUgb2YgdGhlIG9wZW4gZmlsZS5cbiAgI1xuICAjIFRoaXMgaXMgYCd1bnRpdGxlZCdgIGlmIHRoZSBmaWxlIGlzIG5ldyBhbmQgbm90IHNhdmVkIHRvIHRoZSBkaXNrLlxuICAjXG4gICMgUmV0dXJucyBhIHtTdHJpbmd9LlxuICBnZXRUaXRsZTogLT5cbiAgICBpZiBmaWxlUGF0aCA9IEBnZXRQYXRoKClcbiAgICAgIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpXG4gICAgZWxzZVxuICAgICAgJ3VudGl0bGVkJ1xuXG4gICMgUmV0cmlldmVzIHRoZSBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBpbWFnZS5cbiAgI1xuICAjIFJldHVybnMgYSB7U3RyaW5nfSBwYXRoLlxuICBnZXRQYXRoOiAtPlxuICAgIEBmaWxlLmdldFBhdGgoKVxuXG4gICMgUmV0cmlldmVzIHRoZSBVUkkgb2YgdGhlIGltYWdlLlxuICAjXG4gICMgUmV0dXJucyBhIHtTdHJpbmd9LlxuICBnZXRVUkk6IC0+XG4gICAgQGdldFBhdGgoKVxuXG4gICMgUmV0cmlldmVzIHRoZSBlbmNvZGVkIFVSSSBvZiB0aGUgaW1hZ2UuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30uXG4gIGdldEVuY29kZWRVUkk6IC0+XG4gICAgXCJmaWxlOi8vXCIgKyBlbmNvZGVVUkkoQGdldFBhdGgoKS5yZXBsYWNlKC9cXFxcL2csICcvJykpLnJlcGxhY2UoLyMvZywgJyUyMycpLnJlcGxhY2UoL1xcPy9nLCAnJTNGJylcblxuICAjIENvbXBhcmVzIHR3byB7SW1hZ2VFZGl0b3J9cyB0byBkZXRlcm1pbmUgZXF1YWxpdHkuXG4gICNcbiAgIyBFcXVhbGl0eSBpcyBiYXNlZCBvbiB0aGUgY29uZGl0aW9uIHRoYXQgdGhlIHR3byBVUklzIGFyZSB0aGUgc2FtZS5cbiAgI1xuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0uXG4gIGlzRXF1YWw6IChvdGhlcikgLT5cbiAgICBvdGhlciBpbnN0YW5jZW9mIEltYWdlRWRpdG9yIGFuZCBAZ2V0VVJJKCkgaXMgb3RoZXIuZ2V0VVJJKClcblxuICAjIEVzc2VudGlhbDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBlZGl0b3IgaXMgZGVzdHJveWVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGVkaXRvciBpcyBkZXN0cm95ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWRlc3Ryb3knLCBjYWxsYmFja1xuIl19
