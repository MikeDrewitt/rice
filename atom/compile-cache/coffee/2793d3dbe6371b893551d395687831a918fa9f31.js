(function() {
  var Disposable, FileInfoView, fs, url,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  url = require('url');

  fs = require('fs-plus');

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
      this.registerTooltip();
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

    FileInfoView.prototype.registerTooltip = function() {
      return this.tooltip = atom.tooltips.add(this, {
        title: function() {
          return "Click to copy file path";
        }
      });
    };

    FileInfoView.prototype.clearCopiedTooltip = function() {
      var ref;
      if ((ref = this.copiedTooltip) != null) {
        ref.dispose();
      }
      return this.registerTooltip();
    };

    FileInfoView.prototype.showCopiedTooltip = function(copyRelativePath) {
      var ref, ref1, text;
      if ((ref = this.tooltip) != null) {
        ref.dispose();
      }
      if ((ref1 = this.copiedTooltip) != null) {
        ref1.dispose();
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
      var ref, ref1, ref2, ref3, ref4;
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
      if ((ref3 = this.copiedTooltip) != null) {
        ref3.dispose();
      }
      return (ref4 = this.tooltip) != null ? ref4.dispose() : void 0;
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
        return this.currentPath.textContent = fs.tildify(atom.project.relativize(path));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9maWxlLWluZm8tdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlDQUFBO0lBQUE7OztFQUFDLGFBQWMsT0FBQSxDQUFRLE1BQVI7O0VBQ2YsR0FBQSxHQUFNLE9BQUEsQ0FBUSxLQUFSOztFQUNOLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFFQzs7Ozs7OzsyQkFDSixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxXQUFmLEVBQTRCLGNBQTVCO01BRUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxRQUFRLENBQUMsYUFBVCxDQUF1QixHQUF2QjtNQUNmLElBQUMsQ0FBQSxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQXZCLENBQTJCLGNBQTNCO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsV0FBZDtNQUVBLElBQUMsQ0FBQSxzQkFBRCxHQUEwQixJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUFmLENBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDakUsS0FBQyxDQUFBLHFCQUFELENBQUE7UUFEaUU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpDO01BRTFCLElBQUMsQ0FBQSxxQkFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLGVBQUQsQ0FBQTtNQUNBLFlBQUEsR0FBZSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRDtBQUNiLGNBQUE7VUFBQSxZQUFBLEdBQWUsS0FBSyxDQUFDO1VBQ3JCLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixZQUFuQjtVQUNBLElBQUEsR0FBTyxLQUFDLENBQUEscUJBQUQsQ0FBdUIsWUFBdkI7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QixDQUFFLDRCQUE3QjtlQUNILElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixHQUEyQixNQUR4QjtPQUFBLE1BQUE7ZUFHSCxJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsR0FBMkIsR0FIeEI7O0lBSFM7Ozs7S0FuR1M7O0VBMkczQixNQUFNLENBQUMsT0FBUCxHQUFpQixRQUFRLENBQUMsZUFBVCxDQUF5QixpQkFBekIsRUFBNEM7SUFBQSxTQUFBLEVBQVcsWUFBWSxDQUFDLFNBQXhCO0lBQW1DLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FBNUM7R0FBNUM7QUEvR2pCIiwic291cmNlc0NvbnRlbnQiOlsie0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnVybCA9IHJlcXVpcmUgJ3VybCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxuY2xhc3MgRmlsZUluZm9WaWV3IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnZmlsZS1pbmZvJywgJ2lubGluZS1ibG9jaycpXG5cbiAgICBAY3VycmVudFBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICBAY3VycmVudFBhdGguY2xhc3NMaXN0LmFkZCgnY3VycmVudC1wYXRoJylcbiAgICBAYXBwZW5kQ2hpbGQoQGN1cnJlbnRQYXRoKVxuXG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+XG4gICAgICBAc3Vic2NyaWJlVG9BY3RpdmVJdGVtKClcbiAgICBAc3Vic2NyaWJlVG9BY3RpdmVJdGVtKClcblxuICAgIEByZWdpc3RlclRvb2x0aXAoKVxuICAgIGNsaWNrSGFuZGxlciA9IChldmVudCkgPT5cbiAgICAgIGlzU2hpZnRDbGljayA9IGV2ZW50LnNoaWZ0S2V5XG4gICAgICBAc2hvd0NvcGllZFRvb2x0aXAoaXNTaGlmdENsaWNrKVxuICAgICAgdGV4dCA9IEBnZXRBY3RpdmVJdGVtQ29weVRleHQoaXNTaGlmdENsaWNrKVxuICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUodGV4dClcbiAgICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICAgQGNsZWFyQ29waWVkVG9vbHRpcCgpXG4gICAgICAsIDIwMDBcblxuICAgIEBjdXJyZW50UGF0aC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcilcbiAgICBAY2xpY2tTdWJzY3JpcHRpb24gPSBuZXcgRGlzcG9zYWJsZSA9PiBAcmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGlja0hhbmRsZXIpXG5cbiAgcmVnaXN0ZXJUb29sdGlwOiAtPlxuICAgIEB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQodGhpcywgdGl0bGU6IC0+XG4gICAgICBcIkNsaWNrIHRvIGNvcHkgZmlsZSBwYXRoXCIpXG5cbiAgY2xlYXJDb3BpZWRUb29sdGlwOiAtPlxuICAgIEBjb3BpZWRUb29sdGlwPy5kaXNwb3NlKClcbiAgICBAcmVnaXN0ZXJUb29sdGlwKClcblxuICBzaG93Q29waWVkVG9vbHRpcDogKGNvcHlSZWxhdGl2ZVBhdGgpIC0+XG4gICAgQHRvb2x0aXA/LmRpc3Bvc2UoKVxuICAgIEBjb3BpZWRUb29sdGlwPy5kaXNwb3NlKClcbiAgICB0ZXh0ID0gQGdldEFjdGl2ZUl0ZW1Db3B5VGV4dChjb3B5UmVsYXRpdmVQYXRoKVxuICAgIEBjb3BpZWRUb29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgdGhpcyxcbiAgICAgIHRpdGxlOiBcIkNvcGllZDogI3t0ZXh0fVwiXG4gICAgICB0cmlnZ2VyOiAnY2xpY2snXG4gICAgICBkZWxheTpcbiAgICAgICAgc2hvdzogMFxuXG4gIGdldEFjdGl2ZUl0ZW1Db3B5VGV4dDogKGNvcHlSZWxhdGl2ZVBhdGgpIC0+XG4gICAgYWN0aXZlSXRlbSA9IEBnZXRBY3RpdmVJdGVtKClcbiAgICBwYXRoID0gYWN0aXZlSXRlbT8uZ2V0UGF0aD8oKVxuICAgICMgQW4gaXRlbSBwYXRoIGNvdWxkIGJlIGEgdXJsLCB3ZSBvbmx5IHdhbnQgdG8gY29weSB0aGUgYHBhdGhgIHBhcnRcbiAgICBpZiBwYXRoPy5pbmRleE9mKCc6Ly8nKSA+IDBcbiAgICAgIHBhdGggPSB1cmwucGFyc2UocGF0aCkucGF0aFxuXG4gICAgcmV0dXJuIGFjdGl2ZUl0ZW0/LmdldFRpdGxlPygpIG9yICcnIGlmIG5vdCBwYXRoP1xuXG4gICAgaWYgY29weVJlbGF0aXZlUGF0aFxuICAgICAgYXRvbS5wcm9qZWN0LnJlbGF0aXZpemUocGF0aClcbiAgICBlbHNlXG4gICAgICBwYXRoXG5cbiAgc3Vic2NyaWJlVG9BY3RpdmVJdGVtOiAtPlxuICAgIEBtb2RpZmllZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHRpdGxlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcblxuICAgIGlmIGFjdGl2ZUl0ZW0gPSBAZ2V0QWN0aXZlSXRlbSgpXG4gICAgICBAdXBkYXRlQ2FsbGJhY2sgPz0gPT4gQHVwZGF0ZSgpXG5cbiAgICAgIGlmIHR5cGVvZiBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlVGl0bGUgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICBAdGl0bGVTdWJzY3JpcHRpb24gPSBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlVGl0bGUoQHVwZGF0ZUNhbGxiYWNrKVxuICAgICAgZWxzZSBpZiB0eXBlb2YgYWN0aXZlSXRlbS5vbiBpcyAnZnVuY3Rpb24nXG4gICAgICAgICNUT0RPIFJlbW92ZSBvbmNlIHRpdGxlLWNoYW5nZWQgZXZlbnQgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICAgIGFjdGl2ZUl0ZW0ub24oJ3RpdGxlLWNoYW5nZWQnLCBAdXBkYXRlQ2FsbGJhY2spXG4gICAgICAgIEB0aXRsZVN1YnNjcmlwdGlvbiA9IGRpc3Bvc2U6ID0+XG4gICAgICAgICAgYWN0aXZlSXRlbS5vZmY/KCd0aXRsZS1jaGFuZ2VkJywgQHVwZGF0ZUNhbGxiYWNrKVxuXG4gICAgICBAbW9kaWZpZWRTdWJzY3JpcHRpb24gPSBhY3RpdmVJdGVtLm9uRGlkQ2hhbmdlTW9kaWZpZWQ/KEB1cGRhdGVDYWxsYmFjaylcblxuICAgIEB1cGRhdGUoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgQHRpdGxlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAbW9kaWZpZWRTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjbGlja1N1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQGNvcGllZFRvb2x0aXA/LmRpc3Bvc2UoKVxuICAgIEB0b29sdGlwPy5kaXNwb3NlKClcblxuICBnZXRBY3RpdmVJdGVtOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKClcblxuICB1cGRhdGU6IC0+XG4gICAgQHVwZGF0ZVBhdGhUZXh0KClcbiAgICBAdXBkYXRlQnVmZmVySGFzTW9kaWZpZWRUZXh0KEBnZXRBY3RpdmVJdGVtKCk/LmlzTW9kaWZpZWQ/KCkpXG5cbiAgdXBkYXRlQnVmZmVySGFzTW9kaWZpZWRUZXh0OiAoaXNNb2RpZmllZCkgLT5cbiAgICBpZiBpc01vZGlmaWVkXG4gICAgICBAY2xhc3NMaXN0LmFkZCgnYnVmZmVyLW1vZGlmaWVkJylcbiAgICAgIEBpc01vZGlmaWVkID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIEBjbGFzc0xpc3QucmVtb3ZlKCdidWZmZXItbW9kaWZpZWQnKVxuICAgICAgQGlzTW9kaWZpZWQgPSBmYWxzZVxuXG4gIHVwZGF0ZVBhdGhUZXh0OiAtPlxuICAgIGlmIHBhdGggPSBAZ2V0QWN0aXZlSXRlbSgpPy5nZXRQYXRoPygpXG4gICAgICBAY3VycmVudFBhdGgudGV4dENvbnRlbnQgPSBmcy50aWxkaWZ5KGF0b20ucHJvamVjdC5yZWxhdGl2aXplKHBhdGgpKVxuICAgIGVsc2UgaWYgdGl0bGUgPSBAZ2V0QWN0aXZlSXRlbSgpPy5nZXRUaXRsZT8oKVxuICAgICAgQGN1cnJlbnRQYXRoLnRleHRDb250ZW50ID0gdGl0bGVcbiAgICBlbHNlXG4gICAgICBAY3VycmVudFBhdGgudGV4dENvbnRlbnQgPSAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnc3RhdHVzLWJhci1maWxlJywgcHJvdG90eXBlOiBGaWxlSW5mb1ZpZXcucHJvdG90eXBlLCBleHRlbmRzOiAnZGl2JylcbiJdfQ==
