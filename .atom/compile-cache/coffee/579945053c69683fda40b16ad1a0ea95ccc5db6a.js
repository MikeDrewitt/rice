(function() {
  var CompositeDisposable, ImageEditor, _, imageExtensions, openURI, path;

  path = require('path');

  _ = require('underscore-plus');

  ImageEditor = require('./image-editor');

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    activate: function() {
      this.statusViewAttached = false;
      this.disposables = new CompositeDisposable;
      this.disposables.add(atom.workspace.addOpener(openURI));
      return this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.attachImageEditorStatusView();
        };
      })(this)));
    },
    deactivate: function() {
      return this.disposables.dispose();
    },
    consumeStatusBar: function(statusBar) {
      this.statusBar = statusBar;
      return this.attachImageEditorStatusView();
    },
    attachImageEditorStatusView: function() {
      var ImageEditorStatusView, view;
      if (this.statusViewAttached) {
        return;
      }
      if (this.statusBar == null) {
        return;
      }
      if (!(atom.workspace.getActivePaneItem() instanceof ImageEditor)) {
        return;
      }
      ImageEditorStatusView = require('./image-editor-status-view');
      view = new ImageEditorStatusView(this.statusBar);
      view.attach();
      return this.statusViewAttached = true;
    }
  };

  imageExtensions = ['.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.webp'];

  openURI = function(uriToOpen) {
    var uriExtension;
    uriExtension = path.extname(uriToOpen).toLowerCase();
    if (_.include(imageExtensions, uriExtension)) {
      return new ImageEditor(uriToOpen);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9pbWFnZS12aWV3L2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDYixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxrQkFBRCxHQUFzQjtNQUN0QixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBZixDQUF5QixPQUF6QixDQUFqQjthQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUFmLENBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsMkJBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QyxDQUFqQjtJQUpRLENBQVY7SUFNQSxVQUFBLEVBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO0lBRFUsQ0FOWjtJQVNBLGdCQUFBLEVBQWtCLFNBQUMsU0FBRDtNQUFDLElBQUMsQ0FBQSxZQUFEO2FBQWUsSUFBQyxDQUFBLDJCQUFELENBQUE7SUFBaEIsQ0FUbEI7SUFXQSwyQkFBQSxFQUE2QixTQUFBO0FBQzNCLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxrQkFBWDtBQUFBLGVBQUE7O01BQ0EsSUFBYyxzQkFBZDtBQUFBLGVBQUE7O01BQ0EsSUFBQSxDQUFBLENBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBLENBQUEsWUFBOEMsV0FBNUQsQ0FBQTtBQUFBLGVBQUE7O01BRUEscUJBQUEsR0FBd0IsT0FBQSxDQUFRLDRCQUFSO01BQ3hCLElBQUEsR0FBVyxJQUFBLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxTQUF2QjtNQUNYLElBQUksQ0FBQyxNQUFMLENBQUE7YUFFQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7SUFUSyxDQVg3Qjs7O0VBdUJGLGVBQUEsR0FBa0IsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixNQUFqQixFQUF5QixPQUF6QixFQUFrQyxNQUFsQyxFQUEwQyxNQUExQyxFQUFrRCxPQUFsRDs7RUFDbEIsT0FBQSxHQUFVLFNBQUMsU0FBRDtBQUNSLFFBQUE7SUFBQSxZQUFBLEdBQWUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiLENBQXVCLENBQUMsV0FBeEIsQ0FBQTtJQUNmLElBQUcsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxlQUFWLEVBQTJCLFlBQTNCLENBQUg7YUFDTSxJQUFBLFdBQUEsQ0FBWSxTQUFaLEVBRE47O0VBRlE7QUE5QlYiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5JbWFnZUVkaXRvciA9IHJlcXVpcmUgJy4vaW1hZ2UtZWRpdG9yJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAc3RhdHVzVmlld0F0dGFjaGVkID0gZmFsc2VcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKG9wZW5VUkkpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+IEBhdHRhY2hJbWFnZUVkaXRvclN0YXR1c1ZpZXcoKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGNvbnN1bWVTdGF0dXNCYXI6IChAc3RhdHVzQmFyKSAtPiBAYXR0YWNoSW1hZ2VFZGl0b3JTdGF0dXNWaWV3KClcblxuICBhdHRhY2hJbWFnZUVkaXRvclN0YXR1c1ZpZXc6IC0+XG4gICAgcmV0dXJuIGlmIEBzdGF0dXNWaWV3QXR0YWNoZWRcbiAgICByZXR1cm4gdW5sZXNzIEBzdGF0dXNCYXI/XG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpIGluc3RhbmNlb2YgSW1hZ2VFZGl0b3JcblxuICAgIEltYWdlRWRpdG9yU3RhdHVzVmlldyA9IHJlcXVpcmUgJy4vaW1hZ2UtZWRpdG9yLXN0YXR1cy12aWV3J1xuICAgIHZpZXcgPSBuZXcgSW1hZ2VFZGl0b3JTdGF0dXNWaWV3KEBzdGF0dXNCYXIpXG4gICAgdmlldy5hdHRhY2goKVxuXG4gICAgQHN0YXR1c1ZpZXdBdHRhY2hlZCA9IHRydWVcblxuIyBGaWxlcyB3aXRoIHRoZXNlIGV4dGVuc2lvbnMgd2lsbCBiZSBvcGVuZWQgYXMgaW1hZ2VzXG5pbWFnZUV4dGVuc2lvbnMgPSBbJy5ibXAnLCAnLmdpZicsICcuaWNvJywgJy5qcGVnJywgJy5qcGcnLCAnLnBuZycsICcud2VicCddXG5vcGVuVVJJID0gKHVyaVRvT3BlbikgLT5cbiAgdXJpRXh0ZW5zaW9uID0gcGF0aC5leHRuYW1lKHVyaVRvT3BlbikudG9Mb3dlckNhc2UoKVxuICBpZiBfLmluY2x1ZGUoaW1hZ2VFeHRlbnNpb25zLCB1cmlFeHRlbnNpb24pXG4gICAgbmV3IEltYWdlRWRpdG9yKHVyaVRvT3BlbilcbiJdfQ==
