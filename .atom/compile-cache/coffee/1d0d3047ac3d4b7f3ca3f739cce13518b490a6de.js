(function() {
  var CompositeDisposable, Disposable, GlobalVimState, StatusBarManager, VimState, ref, settings;

  ref = require('event-kit'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  StatusBarManager = require('./status-bar-manager');

  GlobalVimState = require('./global-vim-state');

  VimState = require('./vim-state');

  settings = require('./settings');

  module.exports = {
    config: settings.config,
    activate: function(state) {
      this.disposables = new CompositeDisposable;
      this.globalVimState = new GlobalVimState;
      this.statusBarManager = new StatusBarManager;
      this.vimStates = new Set;
      this.vimStatesByEditor = new WeakMap;
      this.disposables.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var vimState;
          if (editor.isMini() || _this.getEditorState(editor)) {
            return;
          }
          vimState = new VimState(atom.views.getView(editor), _this.statusBarManager, _this.globalVimState);
          _this.vimStates.add(vimState);
          _this.vimStatesByEditor.set(editor, vimState);
          return vimState.onDidDestroy(function() {
            return _this.vimStates["delete"](vimState);
          });
        };
      })(this)));
      this.disposables.add(atom.workspace.onDidChangeActivePaneItem(this.updateToPaneItem.bind(this)));
      return this.disposables.add(new Disposable((function(_this) {
        return function() {
          return _this.vimStates.forEach(function(vimState) {
            return vimState.destroy();
          });
        };
      })(this)));
    },
    deactivate: function() {
      return this.disposables.dispose();
    },
    getGlobalState: function() {
      return this.globalVimState;
    },
    getEditorState: function(editor) {
      return this.vimStatesByEditor.get(editor);
    },
    consumeStatusBar: function(statusBar) {
      this.statusBarManager.initialize(statusBar);
      this.statusBarManager.attach();
      return this.disposables.add(new Disposable((function(_this) {
        return function() {
          return _this.statusBarManager.detach();
        };
      })(this)));
    },
    updateToPaneItem: function(item) {
      var vimState;
      if (item != null) {
        vimState = this.getEditorState(item);
      }
      if (vimState != null) {
        return vimState.updateStatusBar();
      } else {
        return this.statusBarManager.hide();
      }
    },
    provideVimMode: function() {
      return {
        getGlobalState: this.getGlobalState.bind(this),
        getEditorState: this.getEditorState.bind(this)
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdmltLW1vZGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsV0FBUixDQUFwQyxFQUFDLDJCQUFELEVBQWE7O0VBQ2IsZ0JBQUEsR0FBbUIsT0FBQSxDQUFRLHNCQUFSOztFQUNuQixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxvQkFBUjs7RUFDakIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFFWCxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsTUFBQSxFQUFRLFFBQVEsQ0FBQyxNQUFqQjtJQUVBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSTtNQUN0QixJQUFDLENBQUEsZ0JBQUQsR0FBb0IsSUFBSTtNQUV4QixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUk7TUFDakIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUk7TUFFekIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBa0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7QUFDakQsY0FBQTtVQUFBLElBQVUsTUFBTSxDQUFDLE1BQVAsQ0FBQSxDQUFBLElBQW1CLEtBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQTdCO0FBQUEsbUJBQUE7O1VBRUEsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixNQUFuQixDQURhLEVBRWIsS0FBQyxDQUFBLGdCQUZZLEVBR2IsS0FBQyxDQUFBLGNBSFk7VUFNZixLQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxRQUFmO1VBQ0EsS0FBQyxDQUFBLGlCQUFpQixDQUFDLEdBQW5CLENBQXVCLE1BQXZCLEVBQStCLFFBQS9CO2lCQUNBLFFBQVEsQ0FBQyxZQUFULENBQXNCLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFNBQVMsRUFBQyxNQUFELEVBQVYsQ0FBa0IsUUFBbEI7VUFBSCxDQUF0QjtRQVhpRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEMsQ0FBakI7TUFhQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBZixDQUF5QyxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBekMsQ0FBakI7YUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBcUIsSUFBQSxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUM5QixLQUFDLENBQUEsU0FBUyxDQUFDLE9BQVgsQ0FBbUIsU0FBQyxRQUFEO21CQUFjLFFBQVEsQ0FBQyxPQUFULENBQUE7VUFBZCxDQUFuQjtRQUQ4QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxDQUFyQjtJQXZCUSxDQUZWO0lBNEJBLFVBQUEsRUFBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7SUFEVSxDQTVCWjtJQStCQSxjQUFBLEVBQWdCLFNBQUE7YUFDZCxJQUFDLENBQUE7SUFEYSxDQS9CaEI7SUFrQ0EsY0FBQSxFQUFnQixTQUFDLE1BQUQ7YUFDZCxJQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsTUFBdkI7SUFEYyxDQWxDaEI7SUFxQ0EsZ0JBQUEsRUFBa0IsU0FBQyxTQUFEO01BQ2hCLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxVQUFsQixDQUE2QixTQUE3QjtNQUNBLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxNQUFsQixDQUFBO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQXFCLElBQUEsVUFBQSxDQUFXLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDOUIsS0FBQyxDQUFBLGdCQUFnQixDQUFDLE1BQWxCLENBQUE7UUFEOEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVgsQ0FBckI7SUFIZ0IsQ0FyQ2xCO0lBMkNBLGdCQUFBLEVBQWtCLFNBQUMsSUFBRDtBQUNoQixVQUFBO01BQUEsSUFBb0MsWUFBcEM7UUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBaEIsRUFBWDs7TUFDQSxJQUFHLGdCQUFIO2VBQ0UsUUFBUSxDQUFDLGVBQVQsQ0FBQSxFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxJQUFsQixDQUFBLEVBSEY7O0lBRmdCLENBM0NsQjtJQWtEQSxjQUFBLEVBQWdCLFNBQUE7YUFDZDtRQUFBLGNBQUEsRUFBZ0IsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixJQUFyQixDQUFoQjtRQUNBLGNBQUEsRUFBZ0IsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixJQUFyQixDQURoQjs7SUFEYyxDQWxEaEI7O0FBUEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5TdGF0dXNCYXJNYW5hZ2VyID0gcmVxdWlyZSAnLi9zdGF0dXMtYmFyLW1hbmFnZXInXG5HbG9iYWxWaW1TdGF0ZSA9IHJlcXVpcmUgJy4vZ2xvYmFsLXZpbS1zdGF0ZSdcblZpbVN0YXRlID0gcmVxdWlyZSAnLi92aW0tc3RhdGUnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgY29uZmlnOiBzZXR0aW5ncy5jb25maWdcblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGdsb2JhbFZpbVN0YXRlID0gbmV3IEdsb2JhbFZpbVN0YXRlXG4gICAgQHN0YXR1c0Jhck1hbmFnZXIgPSBuZXcgU3RhdHVzQmFyTWFuYWdlclxuXG4gICAgQHZpbVN0YXRlcyA9IG5ldyBTZXRcbiAgICBAdmltU3RhdGVzQnlFZGl0b3IgPSBuZXcgV2Vha01hcFxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgIHJldHVybiBpZiBlZGl0b3IuaXNNaW5pKCkgb3IgQGdldEVkaXRvclN0YXRlKGVkaXRvcilcblxuICAgICAgdmltU3RhdGUgPSBuZXcgVmltU3RhdGUoXG4gICAgICAgIGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLFxuICAgICAgICBAc3RhdHVzQmFyTWFuYWdlcixcbiAgICAgICAgQGdsb2JhbFZpbVN0YXRlXG4gICAgICApXG5cbiAgICAgIEB2aW1TdGF0ZXMuYWRkKHZpbVN0YXRlKVxuICAgICAgQHZpbVN0YXRlc0J5RWRpdG9yLnNldChlZGl0b3IsIHZpbVN0YXRlKVxuICAgICAgdmltU3RhdGUub25EaWREZXN0cm95ID0+IEB2aW1TdGF0ZXMuZGVsZXRlKHZpbVN0YXRlKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtIEB1cGRhdGVUb1BhbmVJdGVtLmJpbmQodGhpcylcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEB2aW1TdGF0ZXMuZm9yRWFjaCAodmltU3RhdGUpIC0+IHZpbVN0YXRlLmRlc3Ryb3koKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGdldEdsb2JhbFN0YXRlOiAtPlxuICAgIEBnbG9iYWxWaW1TdGF0ZVxuXG4gIGdldEVkaXRvclN0YXRlOiAoZWRpdG9yKSAtPlxuICAgIEB2aW1TdGF0ZXNCeUVkaXRvci5nZXQoZWRpdG9yKVxuXG4gIGNvbnN1bWVTdGF0dXNCYXI6IChzdGF0dXNCYXIpIC0+XG4gICAgQHN0YXR1c0Jhck1hbmFnZXIuaW5pdGlhbGl6ZShzdGF0dXNCYXIpXG4gICAgQHN0YXR1c0Jhck1hbmFnZXIuYXR0YWNoKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAc3RhdHVzQmFyTWFuYWdlci5kZXRhY2goKVxuXG4gIHVwZGF0ZVRvUGFuZUl0ZW06IChpdGVtKSAtPlxuICAgIHZpbVN0YXRlID0gQGdldEVkaXRvclN0YXRlKGl0ZW0pIGlmIGl0ZW0/XG4gICAgaWYgdmltU3RhdGU/XG4gICAgICB2aW1TdGF0ZS51cGRhdGVTdGF0dXNCYXIoKVxuICAgIGVsc2VcbiAgICAgIEBzdGF0dXNCYXJNYW5hZ2VyLmhpZGUoKVxuXG4gIHByb3ZpZGVWaW1Nb2RlOiAtPlxuICAgIGdldEdsb2JhbFN0YXRlOiBAZ2V0R2xvYmFsU3RhdGUuYmluZCh0aGlzKVxuICAgIGdldEVkaXRvclN0YXRlOiBAZ2V0RWRpdG9yU3RhdGUuYmluZCh0aGlzKVxuIl19
