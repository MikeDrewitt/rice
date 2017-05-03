(function() {
  var CompositeDisposable, Disposable, fs, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  fs = require('fs-plus');

  module.exports = {
    subscriptions: null,
    activate: function() {
      var handleBeforeUnload, handleBlur;
      this.subscriptions = new CompositeDisposable;
      handleBeforeUnload = this.autosaveAllPaneItems.bind(this);
      window.addEventListener('beforeunload', handleBeforeUnload, true);
      this.subscriptions.add(new Disposable(function() {
        return window.removeEventListener('beforeunload', handleBeforeUnload, true);
      }));
      handleBlur = (function(_this) {
        return function(event) {
          var editorElement;
          if (event.target === window) {
            return _this.autosaveAllPaneItems();
          } else if (editorElement = event.target.closest('atom-text-editor:not(mini)')) {
            if (!(editorElement.contains(event.relatedTarget) || (editorElement.lightDOM && editorElement === event.target))) {
              return _this.autosavePaneItem(editorElement.getModel());
            }
          }
        };
      })(this);
      window.addEventListener('blur', handleBlur, true);
      this.subscriptions.add(new Disposable(function() {
        return window.removeEventListener('blur', handleBlur, true);
      }));
      return this.subscriptions.add(atom.workspace.onWillDestroyPaneItem((function(_this) {
        return function(arg) {
          var item;
          item = arg.item;
          return _this.autosavePaneItem(item);
        };
      })(this)));
    },
    deactivate: function() {
      return this.subscriptions.dispose();
    },
    autosavePaneItem: function(paneItem) {
      var pane;
      if (!atom.config.get('autosave.enabled')) {
        return;
      }
      if ((paneItem != null ? typeof paneItem.getURI === "function" ? paneItem.getURI() : void 0 : void 0) == null) {
        return;
      }
      if (!(paneItem != null ? typeof paneItem.isModified === "function" ? paneItem.isModified() : void 0 : void 0)) {
        return;
      }
      if (!(((paneItem != null ? typeof paneItem.getPath === "function" ? paneItem.getPath() : void 0 : void 0) != null) && fs.isFileSync(paneItem.getPath()))) {
        return;
      }
      pane = atom.workspace.paneForItem(paneItem);
      if (pane != null) {
        return pane.saveItem(paneItem);
      } else {
        return typeof paneItem.save === "function" ? paneItem.save() : void 0;
      }
    },
    autosaveAllPaneItems: function() {
      var i, len, paneItem, ref1, results;
      ref1 = atom.workspace.getPaneItems();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        paneItem = ref1[i];
        results.push(this.autosavePaneItem(paneItem));
      }
      return results;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvc2F2ZS9saWIvYXV0b3NhdmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsTUFBUixDQUFwQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBRUwsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLGFBQUEsRUFBZSxJQUFmO0lBRUEsUUFBQSxFQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUVyQixrQkFBQSxHQUFxQixJQUFDLENBQUEsb0JBQW9CLENBQUMsSUFBdEIsQ0FBMkIsSUFBM0I7TUFFckIsTUFBTSxDQUFDLGdCQUFQLENBQXdCLGNBQXhCLEVBQXdDLGtCQUF4QyxFQUE0RCxJQUE1RDtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUF1QixJQUFBLFVBQUEsQ0FBVyxTQUFBO2VBQUcsTUFBTSxDQUFDLG1CQUFQLENBQTJCLGNBQTNCLEVBQTJDLGtCQUEzQyxFQUErRCxJQUEvRDtNQUFILENBQVgsQ0FBdkI7TUFFQSxVQUFBLEdBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7QUFDWCxjQUFBO1VBQUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixNQUFuQjttQkFDRSxLQUFDLENBQUEsb0JBQUQsQ0FBQSxFQURGO1dBQUEsTUFFSyxJQUFHLGFBQUEsR0FBZ0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFiLENBQXFCLDRCQUFyQixDQUFuQjtZQUNILElBQUEsQ0FBQSxDQUFPLGFBQWEsQ0FBQyxRQUFkLENBQXVCLEtBQUssQ0FBQyxhQUE3QixDQUFBLElBQStDLENBQUMsYUFBYSxDQUFDLFFBQWQsSUFBMkIsYUFBQSxLQUFpQixLQUFLLENBQUMsTUFBbkQsQ0FBdEQsQ0FBQTtxQkFDRSxLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsYUFBYSxDQUFDLFFBQWQsQ0FBQSxDQUFsQixFQURGO2FBREc7O1FBSE07TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BT2IsTUFBTSxDQUFDLGdCQUFQLENBQXdCLE1BQXhCLEVBQWdDLFVBQWhDLEVBQTRDLElBQTVDO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQXVCLElBQUEsVUFBQSxDQUFXLFNBQUE7ZUFBRyxNQUFNLENBQUMsbUJBQVAsQ0FBMkIsTUFBM0IsRUFBbUMsVUFBbkMsRUFBK0MsSUFBL0M7TUFBSCxDQUFYLENBQXZCO2FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQWYsQ0FBcUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFBWSxjQUFBO1VBQVYsT0FBRDtpQkFBVyxLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBbEI7UUFBWjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckMsQ0FBbkI7SUFsQlEsQ0FGVjtJQXNCQSxVQUFBLEVBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRFUsQ0F0Qlo7SUF5QkEsZ0JBQUEsRUFBa0IsU0FBQyxRQUFEO0FBQ2hCLFVBQUE7TUFBQSxJQUFBLENBQWMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGtCQUFoQixDQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFjLHdHQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFBLGlFQUFjLFFBQVEsQ0FBRSwrQkFBeEI7QUFBQSxlQUFBOztNQUNBLElBQUEsQ0FBQSxDQUFjLDRHQUFBLElBQTBCLEVBQUUsQ0FBQyxVQUFILENBQWMsUUFBUSxDQUFDLE9BQVQsQ0FBQSxDQUFkLENBQXhDLENBQUE7QUFBQSxlQUFBOztNQUVBLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQWYsQ0FBMkIsUUFBM0I7TUFDUCxJQUFHLFlBQUg7ZUFDRSxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQsRUFERjtPQUFBLE1BQUE7cURBR0UsUUFBUSxDQUFDLGdCQUhYOztJQVBnQixDQXpCbEI7SUFxQ0Esb0JBQUEsRUFBc0IsU0FBQTtBQUNwQixVQUFBO0FBQUE7QUFBQTtXQUFBLHNDQUFBOztxQkFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsUUFBbEI7QUFBQTs7SUFEb0IsQ0FyQ3RCOztBQUpGIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuICBzdWJzY3JpcHRpb25zOiBudWxsXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgaGFuZGxlQmVmb3JlVW5sb2FkID0gQGF1dG9zYXZlQWxsUGFuZUl0ZW1zLmJpbmQodGhpcylcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCBoYW5kbGVCZWZvcmVVbmxvYWQsIHRydWUpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIG5ldyBEaXNwb3NhYmxlIC0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCBoYW5kbGVCZWZvcmVVbmxvYWQsIHRydWUpXG5cbiAgICBoYW5kbGVCbHVyID0gKGV2ZW50KSA9PlxuICAgICAgaWYgZXZlbnQudGFyZ2V0IGlzIHdpbmRvd1xuICAgICAgICBAYXV0b3NhdmVBbGxQYW5lSXRlbXMoKVxuICAgICAgZWxzZSBpZiBlZGl0b3JFbGVtZW50ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoJ2F0b20tdGV4dC1lZGl0b3I6bm90KG1pbmkpJylcbiAgICAgICAgdW5sZXNzIGVkaXRvckVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkgb3IgKGVkaXRvckVsZW1lbnQubGlnaHRET00gYW5kIGVkaXRvckVsZW1lbnQgaXMgZXZlbnQudGFyZ2V0KVxuICAgICAgICAgIEBhdXRvc2F2ZVBhbmVJdGVtKGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKSlcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgdHJ1ZSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgbmV3IERpc3Bvc2FibGUgLT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCB0cnVlKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9uV2lsbERlc3Ryb3lQYW5lSXRlbSAoe2l0ZW19KSA9PiBAYXV0b3NhdmVQYW5lSXRlbShpdGVtKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgYXV0b3NhdmVQYW5lSXRlbTogKHBhbmVJdGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgYXRvbS5jb25maWcuZ2V0KCdhdXRvc2F2ZS5lbmFibGVkJylcbiAgICByZXR1cm4gdW5sZXNzIHBhbmVJdGVtPy5nZXRVUkk/KCk/XG4gICAgcmV0dXJuIHVubGVzcyBwYW5lSXRlbT8uaXNNb2RpZmllZD8oKVxuICAgIHJldHVybiB1bmxlc3MgcGFuZUl0ZW0/LmdldFBhdGg/KCk/IGFuZCBmcy5pc0ZpbGVTeW5jKHBhbmVJdGVtLmdldFBhdGgoKSlcblxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbShwYW5lSXRlbSlcbiAgICBpZiBwYW5lP1xuICAgICAgcGFuZS5zYXZlSXRlbShwYW5lSXRlbSlcbiAgICBlbHNlXG4gICAgICBwYW5lSXRlbS5zYXZlPygpXG5cbiAgYXV0b3NhdmVBbGxQYW5lSXRlbXM6IC0+XG4gICAgQGF1dG9zYXZlUGFuZUl0ZW0ocGFuZUl0ZW0pIGZvciBwYW5lSXRlbSBpbiBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKVxuIl19
