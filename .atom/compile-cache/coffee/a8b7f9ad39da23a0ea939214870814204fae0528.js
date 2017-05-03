(function() {
  var CompositeDisposable, FileIcons, FileView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  FileIcons = require('./file-icons');

  module.exports = FileView = (function(superClass) {
    extend(FileView, superClass);

    function FileView() {
      return FileView.__super__.constructor.apply(this, arguments);
    }

    FileView.prototype.initialize = function(file) {
      var iconClass, ref;
      this.file = file;
      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add(this.file.onDidDestroy((function(_this) {
        return function() {
          return _this.subscriptions.dispose();
        };
      })(this)));
      this.draggable = true;
      this.classList.add('file', 'entry', 'list-item');
      this.fileName = document.createElement('span');
      this.fileName.classList.add('name', 'icon');
      this.appendChild(this.fileName);
      this.fileName.textContent = this.file.name;
      this.fileName.title = this.file.name;
      this.fileName.dataset.name = this.file.name;
      this.fileName.dataset.path = this.file.path;
      iconClass = FileIcons.getService().iconClassForPath(this.file.path, "tree-view");
      if (iconClass) {
        if (!Array.isArray(iconClass)) {
          iconClass = iconClass.toString().split(/\s+/g);
        }
        (ref = this.fileName.classList).add.apply(ref, iconClass);
      }
      this.subscriptions.add(this.file.onDidStatusChange((function(_this) {
        return function() {
          return _this.updateStatus();
        };
      })(this)));
      return this.updateStatus();
    };

    FileView.prototype.updateStatus = function() {
      this.classList.remove('status-ignored', 'status-modified', 'status-added');
      if (this.file.status != null) {
        return this.classList.add("status-" + this.file.status);
      }
    };

    FileView.prototype.getPath = function() {
      return this.fileName.dataset.path;
    };

    FileView.prototype.isPathEqual = function(pathToCompare) {
      return this.file.isPathEqual(pathToCompare);
    };

    return FileView;

  })(HTMLElement);

  module.exports = document.registerElement('tree-view-file', {
    prototype: FileView.prototype,
    "extends": 'li'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2ZpbGUtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdDQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsV0FBUjs7RUFDeEIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSOztFQUVaLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7dUJBQ0osVUFBQSxHQUFZLFNBQUMsSUFBRDtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsT0FBRDtNQUNYLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsbUJBQUEsQ0FBQTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFOLENBQW1CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQixDQUFuQjtNQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFFYixJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxNQUFmLEVBQXVCLE9BQXZCLEVBQWdDLFdBQWhDO01BRUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QjtNQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQXBCLENBQXdCLE1BQXhCLEVBQWdDLE1BQWhDO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsUUFBZDtNQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixHQUF3QixJQUFDLENBQUEsSUFBSSxDQUFDO01BQzlCLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFrQixJQUFDLENBQUEsSUFBSSxDQUFDO01BQ3hCLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQWxCLEdBQXlCLElBQUMsQ0FBQSxJQUFJLENBQUM7TUFDL0IsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBbEIsR0FBeUIsSUFBQyxDQUFBLElBQUksQ0FBQztNQUUvQixTQUFBLEdBQVksU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFzQixDQUFDLGdCQUF2QixDQUF3QyxJQUFDLENBQUEsSUFBSSxDQUFDLElBQTlDLEVBQW9ELFdBQXBEO01BQ1osSUFBRyxTQUFIO1FBQ0UsSUFBQSxDQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBZCxDQUFQO1VBQ0UsU0FBQSxHQUFZLFNBQVMsQ0FBQyxRQUFWLENBQUEsQ0FBb0IsQ0FBQyxLQUFyQixDQUEyQixNQUEzQixFQURkOztRQUVBLE9BQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxTQUFWLENBQW1CLENBQUMsR0FBcEIsWUFBd0IsU0FBeEIsRUFIRjs7TUFLQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLElBQUksQ0FBQyxpQkFBTixDQUF3QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFlBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QixDQUFuQjthQUNBLElBQUMsQ0FBQSxZQUFELENBQUE7SUF2QlU7O3VCQXlCWixZQUFBLEdBQWMsU0FBQTtNQUNaLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBWCxDQUFrQixnQkFBbEIsRUFBb0MsaUJBQXBDLEVBQXdELGNBQXhEO01BQ0EsSUFBNEMsd0JBQTVDO2VBQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsU0FBQSxHQUFVLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBL0IsRUFBQTs7SUFGWTs7dUJBSWQsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQU8sQ0FBQztJQURYOzt1QkFHVCxXQUFBLEdBQWEsU0FBQyxhQUFEO2FBQ1gsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLGFBQWxCO0lBRFc7Ozs7S0FqQ1E7O0VBb0N2QixNQUFNLENBQUMsT0FBUCxHQUFpQixRQUFRLENBQUMsZUFBVCxDQUF5QixnQkFBekIsRUFBMkM7SUFBQSxTQUFBLEVBQVcsUUFBUSxDQUFDLFNBQXBCO0lBQStCLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFBeEM7R0FBM0M7QUF4Q2pCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuRmlsZUljb25zID0gcmVxdWlyZSAnLi9maWxlLWljb25zJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGaWxlVmlldyBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGluaXRpYWxpemU6IChAZmlsZSkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGZpbGUub25EaWREZXN0cm95ID0+IEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gICAgQGRyYWdnYWJsZSA9IHRydWVcblxuICAgIEBjbGFzc0xpc3QuYWRkKCdmaWxlJywgJ2VudHJ5JywgJ2xpc3QtaXRlbScpXG5cbiAgICBAZmlsZU5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICBAZmlsZU5hbWUuY2xhc3NMaXN0LmFkZCgnbmFtZScsICdpY29uJylcbiAgICBAYXBwZW5kQ2hpbGQoQGZpbGVOYW1lKVxuICAgIEBmaWxlTmFtZS50ZXh0Q29udGVudCA9IEBmaWxlLm5hbWVcbiAgICBAZmlsZU5hbWUudGl0bGUgPSBAZmlsZS5uYW1lXG4gICAgQGZpbGVOYW1lLmRhdGFzZXQubmFtZSA9IEBmaWxlLm5hbWVcbiAgICBAZmlsZU5hbWUuZGF0YXNldC5wYXRoID0gQGZpbGUucGF0aFxuXG4gICAgaWNvbkNsYXNzID0gRmlsZUljb25zLmdldFNlcnZpY2UoKS5pY29uQ2xhc3NGb3JQYXRoKEBmaWxlLnBhdGgsIFwidHJlZS12aWV3XCIpXG4gICAgaWYgaWNvbkNsYXNzXG4gICAgICB1bmxlc3MgQXJyYXkuaXNBcnJheSBpY29uQ2xhc3NcbiAgICAgICAgaWNvbkNsYXNzID0gaWNvbkNsYXNzLnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICAgIEBmaWxlTmFtZS5jbGFzc0xpc3QuYWRkKGljb25DbGFzcy4uLilcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZmlsZS5vbkRpZFN0YXR1c0NoYW5nZSA9PiBAdXBkYXRlU3RhdHVzKClcbiAgICBAdXBkYXRlU3RhdHVzKClcblxuICB1cGRhdGVTdGF0dXM6IC0+XG4gICAgQGNsYXNzTGlzdC5yZW1vdmUoJ3N0YXR1cy1pZ25vcmVkJywgJ3N0YXR1cy1tb2RpZmllZCcsICAnc3RhdHVzLWFkZGVkJylcbiAgICBAY2xhc3NMaXN0LmFkZChcInN0YXR1cy0je0BmaWxlLnN0YXR1c31cIikgaWYgQGZpbGUuc3RhdHVzP1xuXG4gIGdldFBhdGg6IC0+XG4gICAgQGZpbGVOYW1lLmRhdGFzZXQucGF0aFxuXG4gIGlzUGF0aEVxdWFsOiAocGF0aFRvQ29tcGFyZSkgLT5cbiAgICBAZmlsZS5pc1BhdGhFcXVhbChwYXRoVG9Db21wYXJlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgndHJlZS12aWV3LWZpbGUnLCBwcm90b3R5cGU6IEZpbGVWaWV3LnByb3RvdHlwZSwgZXh0ZW5kczogJ2xpJylcbiJdfQ==
