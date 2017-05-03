(function() {
  var Disposable, FileInfoView, url,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  url = require('url');

  FileInfoView = (function(superClass) {
    extend(FileInfoView, superClass);

    function FileInfoView() {
      return FileInfoView.__super__.constructor.apply(this, arguments);
    }

    FileInfoView.prototype.initialize = function() {
      var clickHandler;
      this.classList.add('file-info', 'inline-block');
      this.currentPath = document.createElement('a');
      this.currentPath.classList.add('current-path');
      this.appendChild(this.currentPath);
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.subscribeToActiveItem();
        };
      })(this));
      this.subscribeToActiveItem();
      clickHandler = (function(_this) {
        return function(event) {
          var isShiftClick, text;
          isShiftClick = event.shiftKey;
          _this.showCopiedTooltip(isShiftClick);
          text = _this.getActiveItemCopyText(isShiftClick);
          atom.clipboard.write(text);
          return setTimeout(function() {
            return _this.clearCopiedTooltip();
          }, 2000);
        };
      })(this);
      this.currentPath.addEventListener('click', clickHandler);
      return this.clickSubscription = new Disposable((function(_this) {
        return function() {
          return _this.removeEventListener('click', clickHandler);
        };
      })(this));
    };

    FileInfoView.prototype.clearCopiedTooltip = function() {
      var ref;
      return (ref = this.copiedTooltip) != null ? ref.dispose() : void 0;
    };

    FileInfoView.prototype.showCopiedTooltip = function(copyRelativePath) {
      var ref, text;
      if ((ref = this.copiedTooltip) != null) {
        ref.dispose();
      }
      text = this.getActiveItemCopyText(copyRelativePath);
      return this.copiedTooltip = atom.tooltips.add(this, {
        title: "Copied: " + text,
        trigger: 'click',
        delay: {
          show: 0
        }
      });
    };

    FileInfoView.prototype.getActiveItemCopyText = function(copyRelativePath) {
      var activeItem, path;
      activeItem = this.getActiveItem();
      path = activeItem != null ? typeof activeItem.getPath === "function" ? activeItem.getPath() : void 0 : void 0;
      if ((path != null ? path.indexOf('://') : void 0) > 0) {
        path = url.parse(path).path;
      }
      if (path == null) {
        return (activeItem != null ? typeof activeItem.getTitle === "function" ? activeItem.getTitle() : void 0 : void 0) || '';
      }
      if (copyRelativePath) {
        return atom.project.relativize(path);
      } else {
        return path;
      }
    };

    FileInfoView.prototype.subscribeToActiveItem = function() {
      var activeItem, ref, ref1;
      if ((ref = this.modifiedSubscription) != null) {
        ref.dispose();
      }
      if ((ref1 = this.titleSubscription) != null) {
        ref1.dispose();
      }
      if (activeItem = this.getActiveItem()) {
        if (this.updateCallback == null) {
          this.updateCallback = (function(_this) {
            return function() {
              return _this.update();
            };
          })(this);
        }
        if (typeof activeItem.onDidChangeTitle === 'function') {
          this.titleSubscription = activeItem.onDidChangeTitle(this.updateCallback);
        } else if (typeof activeItem.on === 'function') {
          activeItem.on('title-changed', this.updateCallback);
          this.titleSubscription = {
            dispose: (function(_this) {
              return function() {
                return typeof activeItem.off === "function" ? activeItem.off('title-changed', _this.updateCallback) : void 0;
              };
            })(this)
          };
        }
        this.modifiedSubscription = typeof activeItem.onDidChangeModified === "function" ? activeItem.onDidChangeModified(this.updateCallback) : void 0;
      }
      return this.update();
    };

    FileInfoView.prototype.destroy = function() {
      var ref, ref1, ref2, ref3;
      this.activeItemSubscription.dispose();
      if ((ref = this.titleSubscription) != null) {
        ref.dispose();
      }
      if ((ref1 = this.modifiedSubscription) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.clickSubscription) != null) {
        ref2.dispose();
      }
      return (ref3 = this.copiedTooltip) != null ? ref3.dispose() : void 0;
    };

    FileInfoView.prototype.getActiveItem = function() {
      return atom.workspace.getActivePaneItem();
    };

    FileInfoView.prototype.update = function() {
      var ref;
      this.updatePathText();
      return this.updateBufferHasModifiedText((ref = this.getActiveItem()) != null ? typeof ref.isModified === "function" ? ref.isModified() : void 0 : void 0);
    };

    FileInfoView.prototype.updateBufferHasModifiedText = function(isModified) {
      if (isModified) {
        this.classList.add('buffer-modified');
        return this.isModified = true;
      } else {
        this.classList.remove('buffer-modified');
        return this.isModified = false;
      }
    };

    FileInfoView.prototype.updatePathText = function() {
      var path, ref, ref1, title;
      if (path = (ref = this.getActiveItem()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0) {
        return this.currentPath.textContent = atom.project.relativize(path);
      } else if (title = (ref1 = this.getActiveItem()) != null ? typeof ref1.getTitle === "function" ? ref1.getTitle() : void 0 : void 0) {
        return this.currentPath.textContent = title;
      } else {
        return this.currentPath.textContent = '';
      }
    };

    return FileInfoView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar-file', {
    prototype: FileInfoView.prototype,
    "extends": 'div'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3N0YXR1cy1iYXIvbGliL2ZpbGUtaW5mby12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQTs7O0VBQUMsYUFBYyxPQUFBLENBQVEsTUFBUjs7RUFDZixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0VBRUE7Ozs7Ozs7MkJBQ0osVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsV0FBZixFQUE0QixjQUE1QjtNQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsR0FBdkI7TUFDZixJQUFDLENBQUEsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUF2QixDQUEyQixjQUEzQjtNQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLFdBQWQ7TUFFQSxJQUFDLENBQUEsc0JBQUQsR0FBMEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBZixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ2pFLEtBQUMsQ0FBQSxxQkFBRCxDQUFBO1FBRGlFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QztNQUUxQixJQUFDLENBQUEscUJBQUQsQ0FBQTtNQUVBLFlBQUEsR0FBZSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRDtBQUNiLGNBQUE7VUFBQSxZQUFBLEdBQWUsS0FBSyxDQUFDO1VBQ3JCLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixZQUFuQjtVQUNBLElBQUEsR0FBTyxLQUFDLENBQUEscUJBQUQsQ0FBdUIsWUFBdkI7VUFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQWYsQ0FBcUIsSUFBckI7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IjpbIntEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG51cmwgPSByZXF1aXJlICd1cmwnXG5cbmNsYXNzIEZpbGVJbmZvVmlldyBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGNsYXNzTGlzdC5hZGQoJ2ZpbGUtaW5mbycsICdpbmxpbmUtYmxvY2snKVxuXG4gICAgQGN1cnJlbnRQYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgQGN1cnJlbnRQYXRoLmNsYXNzTGlzdC5hZGQoJ2N1cnJlbnQtcGF0aCcpXG4gICAgQGFwcGVuZENoaWxkKEBjdXJyZW50UGF0aClcblxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSA9PlxuICAgICAgQHN1YnNjcmliZVRvQWN0aXZlSXRlbSgpXG4gICAgQHN1YnNjcmliZVRvQWN0aXZlSXRlbSgpXG5cbiAgICBjbGlja0hhbmRsZXIgPSAoZXZlbnQpID0+XG4gICAgICBpc1NoaWZ0Q2xpY2sgPSBldmVudC5zaGlmdEtleVxuICAgICAgQHNob3dDb3BpZWRUb29sdGlwKGlzU2hpZnRDbGljaylcbiAgICAgIHRleHQgPSBAZ2V0QWN0aXZlSXRlbUNvcHlUZXh0KGlzU2hpZnRDbGljaylcbiAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpXG4gICAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAgIEBjbGVhckNvcGllZFRvb2x0aXAoKVxuICAgICAgLCAyMDAwXG5cbiAgICBAY3VycmVudFBhdGguYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGlja0hhbmRsZXIpXG4gICAgQGNsaWNrU3Vic2NyaXB0aW9uID0gbmV3IERpc3Bvc2FibGUgPT4gQHJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKVxuXG4gIGNsZWFyQ29waWVkVG9vbHRpcDogLT5cbiAgICBAY29waWVkVG9vbHRpcD8uZGlzcG9zZSgpXG5cbiAgc2hvd0NvcGllZFRvb2x0aXA6IChjb3B5UmVsYXRpdmVQYXRoKSAtPlxuICAgIEBjb3BpZWRUb29sdGlwPy5kaXNwb3NlKClcbiAgICB0ZXh0ID0gQGdldEFjdGl2ZUl0ZW1Db3B5VGV4dChjb3B5UmVsYXRpdmVQYXRoKVxuICAgIEBjb3BpZWRUb29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgdGhpcyxcbiAgICAgIHRpdGxlOiBcIkNvcGllZDogI3t0ZXh0fVwiXG4gICAgICB0cmlnZ2VyOiAnY2xpY2snXG4gICAgICBkZWxheTpcbiAgICAgICAgc2hvdzogMFxuXG4gIGdldEFjdGl2ZUl0ZW1Db3B5VGV4dDogKGNvcHlSZWxhdGl2ZVBhdGgpIC0+XG4gICAgYWN0aXZlSXRlbSA9IEBnZXRBY3RpdmVJdGVtKClcbiAgICBwYXRoID0gYWN0aXZlSXRlbT8uZ2V0UGF0aD8oKVxuICAgICMgQW4gaXRlbSBwYXRoIGNvdWxkIGJlIGEgdXJsLCB3ZSBvbmx5IHdhbnQgdG8gY29weSB0aGUgYHBhdGhgIHBhcnRcbiAgICBpZiBwYXRoPy5pbmRleE9mKCc6Ly8nKSA+IDBcbiAgICAgIHBhdGggPSB1cmwucGFyc2UocGF0aCkucGF0aFxuXG4gICAgcmV0dXJuIGFjdGl2ZUl0ZW0/LmdldFRpdGxlPygpIG9yICcnIGlmIG5vdCBwYXRoP1xuXG4gICAgaWYgY29weVJlbGF0aXZlUGF0aFxuICAgICAgYXRvbS5wcm9qZWN0LnJlbGF0aXZpemUocGF0aClcbiAgICBlbHNlXG4gICAgICBwYXRoXG5cbiAgc3Vic2NyaWJlVG9BY3RpdmVJdGVtOiAtPlxuICAgIEBtb2RpZmllZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHRpdGxlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcblxuICAgIGlmIGFjdGl2ZUl0ZW0gPSBAZ2V0QWN0aXZlSXRlbSgpXG4gICAgICBAdXBkYXRlQ2FsbGJhY2sgPz0gPT4gQHVwZGF0ZSgpXG5cbiAgICAgIGlmIHR5cGVvZiBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlVGl0bGUgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBAdGl0bGVTdWJzY3JpcHRpb24gPSBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlVGl0bGUoQHVwZGF0ZUNhbGxiYWNrKVxuICAgICAgZWxzZSBpZiB0eXBlb2YgYWN0aXZlSXRlbS5vbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICNUT0RPIFJlbW92ZSBvbmNlIHRpdGxlLWNoYW5nZWQgZXZlbnQgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICAgIGFjdGl2ZUl0ZW0ub24oJ3RpdGxlLWNoYW5nZWQnLCBAdXBkYXRlQ2FsbGJhY2spXG4gICAgICAgIEB0aXRsZVN1YnNjcmlwdGlvbiA9IGRpc3Bvc2U6ID0+XG4gICAgICAgICAgYWN0aXZlSXRlbS5vZmY/KCd0aXRsZS1jaGFuZ2VkJywgQHVwZGF0ZUNhbGxiYWNrKVxuXG4gICAgICBAbW9kaWZpZWRTdWJzY3JpcHRpb24gPSBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlTW9kaWZpZWQ/KEB1cGRhdGVDYWxsYmFjaylcblxuICAgIEB1cGRhdGUoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgQHRpdGxlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAbW9kaWZpZWRTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjbGlja1N1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQGNvcGllZFRvb2x0aXA/LmRpc3Bvc2UoKVxuXG4gIGdldEFjdGl2ZUl0ZW06IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuXG4gIHVwZGF0ZTogLT5cbiAgICBAdXBkYXRlUGF0aFRleHQoKVxuICAgIEB1cGRhdGVCdWZmZXJIYXNNb2RpZmllZFRleHQoQGdldEFjdGl2ZUl0ZW0oKT8uaXNNb2RpZmllZD8oKSlcblxuICB1cGRhdGVCdWZmZXJIYXNNb2RpZmllZFRleHQ6IChpc01vZGlmaWVkKSAtPlxuICAgIGlmIGlzTW9kaWZpZWRcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdidWZmZXItbW9kaWZpZWQnKVxuICAgICAgQGlzTW9kaWZpZWQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNsYXNzTGlzdC5yZW1vdmUoJ2J1ZmZlci1tb2RpZmllZCcpXG4gICAgICBAaXNNb2RpZmllZCA9IGZhbHNlXG5cbiAgdXBkYXRlUGF0aFRleHQ6IC0+XG4gICAgaWYgcGF0aCA9IEBnZXRBY3RpdmVJdGVtKCk/LmdldFBhdGg/KClcbiAgICAgIEBjdXJyZW50UGF0aC50ZXh0Q29udGVudCA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplKHBhdGgpXG4gICAgZWxzZSBpZiB0aXRsZSA9IEBnZXRBY3RpdmVJdGVtKCk/LmdldFRpdGxlPygpXG4gICAgICBAY3VycmVudFBhdGgudGV4dENvbnRlbnQgPSB0aXRsZVxuICAgIGVsc2VcbiAgICAgIEBjdXJyZW50UGF0aC50ZXh0Q29udGVudCA9ICcnXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdzdGF0dXMtYmFyLWZpbGUnLCBwcm90b3R5cGU6IEZpbGVJbmZvVmlldy5wcm90b3R5cGUsIGV4dGVuZHM6ICdkaXYnKVxuIl19
