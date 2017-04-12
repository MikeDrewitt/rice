(function() {
  var CompositeDisposable, CursorPositionView, Emitter, FileInfoView, GitView, Grim, SelectionCountView, StatusBarView, ref,
    slice = [].slice;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  Grim = require('grim');

  StatusBarView = require('./status-bar-view');

  FileInfoView = require('./file-info-view');

  CursorPositionView = require('./cursor-position-view');

  SelectionCountView = require('./selection-count-view');

  GitView = require('./git-view');

  module.exports = {
    activate: function() {
      var LaunchModeView, devMode, launchModeView, ref1, safeMode;
      this.emitters = new Emitter();
      this.subscriptions = new CompositeDisposable();
      this.statusBar = new StatusBarView();
      this.statusBar.initialize();
      this.attachStatusBar();
      this.subscriptions.add(atom.config.onDidChange('status-bar.fullWidth', (function(_this) {
        return function() {
          return _this.attachStatusBar();
        };
      })(this)));
      atom.commands.add('atom-workspace', 'status-bar:toggle', (function(_this) {
        return function() {
          if (_this.statusBarPanel.isVisible()) {
            return _this.statusBarPanel.hide();
          } else {
            return _this.statusBarPanel.show();
          }
        };
      })(this));
      ref1 = atom.getLoadSettings(), safeMode = ref1.safeMode, devMode = ref1.devMode;
      if (safeMode || devMode) {
        LaunchModeView = require('./launch-mode-view');
        launchModeView = new LaunchModeView();
        launchModeView.initialize({
          safeMode: safeMode,
          devMode: devMode
        });
        this.statusBar.addLeftTile({
          item: launchModeView,
          priority: -1
        });
      }
      this.fileInfo = new FileInfoView();
      this.fileInfo.initialize();
      this.statusBar.addLeftTile({
        item: this.fileInfo,
        priority: 0
      });
      this.cursorPosition = new CursorPositionView();
      this.cursorPosition.initialize();
      this.statusBar.addLeftTile({
        item: this.cursorPosition,
        priority: 1
      });
      this.selectionCount = new SelectionCountView();
      this.selectionCount.initialize();
      this.statusBar.addLeftTile({
        item: this.selectionCount,
        priority: 2
      });
      this.gitInfo = new GitView();
      this.gitInfo.initialize();
      return this.gitInfoTile = this.statusBar.addRightTile({
        item: this.gitInfo,
        priority: 0
      });
    },
    deactivate: function() {
      var ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
      if ((ref1 = this.gitInfo) != null) {
        ref1.destroy();
      }
      this.gitInfo = null;
      if ((ref2 = this.fileInfo) != null) {
        ref2.destroy();
      }
      this.fileInfo = null;
      if ((ref3 = this.cursorPosition) != null) {
        ref3.destroy();
      }
      this.cursorPosition = null;
      if ((ref4 = this.selectionCount) != null) {
        ref4.destroy();
      }
      this.selectionCount = null;
      if ((ref5 = this.statusBarPanel) != null) {
        ref5.destroy();
      }
      this.statusBarPanel = null;
      if ((ref6 = this.statusBar) != null) {
        ref6.destroy();
      }
      this.statusBar = null;
      if ((ref7 = this.subscriptions) != null) {
        ref7.dispose();
      }
      this.subscriptions = null;
      if ((ref8 = this.emitters) != null) {
        ref8.dispose();
      }
      this.emitters = null;
      if (atom.__workspaceView != null) {
        return delete atom.__workspaceView.statusBar;
      }
    },
    provideStatusBar: function() {
      return {
        addLeftTile: this.statusBar.addLeftTile.bind(this.statusBar),
        addRightTile: this.statusBar.addRightTile.bind(this.statusBar),
        getLeftTiles: this.statusBar.getLeftTiles.bind(this.statusBar),
        getRightTiles: this.statusBar.getRightTiles.bind(this.statusBar),
        disableGitInfoTile: this.gitInfoTile.destroy.bind(this.gitInfoTile)
      };
    },
    attachStatusBar: function() {
      var panelArgs;
      if (this.statusBarPanel != null) {
        this.statusBarPanel.destroy();
      }
      panelArgs = {
        item: this.statusBar,
        priority: 0
      };
      if (atom.config.get('status-bar.fullWidth')) {
        return this.statusBarPanel = atom.workspace.addFooterPanel(panelArgs);
      } else {
        return this.statusBarPanel = atom.workspace.addBottomPanel(panelArgs);
      }
    },
    legacyProvideStatusBar: function() {
      var statusbar;
      statusbar = this.provideStatusBar();
      return {
        addLeftTile: function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
          return statusbar.addLeftTile.apply(statusbar, args);
        },
        addRightTile: function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
          return statusbar.addRightTile.apply(statusbar, args);
        },
        getLeftTiles: function() {
          Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
          return statusbar.getLeftTiles();
        },
        getRightTiles: function() {
          Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
          return statusbar.getRightTiles();
        }
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3N0YXR1cy1iYXIvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxSEFBQTtJQUFBOztFQUFBLE1BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDaEIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxrQkFBUjs7RUFDZixrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVI7O0VBQ3JCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx3QkFBUjs7RUFDckIsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLE9BQUEsQ0FBQTtNQUNoQixJQUFDLENBQUEsYUFBRCxHQUFxQixJQUFBLG1CQUFBLENBQUE7TUFFckIsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxhQUFBLENBQUE7TUFDakIsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFYLENBQUE7TUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixzQkFBeEIsRUFBZ0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNqRSxLQUFDLENBQUEsZUFBRCxDQUFBO1FBRGlFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoRCxDQUFuQjtNQUdBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsbUJBQXBDLEVBQXlELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN2RCxJQUFHLEtBQUMsQ0FBQSxjQUFjLENBQUMsU0FBaEIsQ0FBQSxDQUFIO21CQUNFLEtBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQSxFQURGO1dBQUEsTUFBQTttQkFHRSxLQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQUEsRUFIRjs7UUFEdUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpEO01BTUEsT0FBc0IsSUFBSSxDQUFDLGVBQUwsQ0FBQSxDQUF0QixFQUFDLHdCQUFELEVBQVc7TUFDWCxJQUFHLFFBQUEsSUFBWSxPQUFmO1FBQ0UsY0FBQSxHQUFpQixPQUFBLENBQVEsb0JBQVI7UUFDakIsY0FBQSxHQUFxQixJQUFBLGNBQUEsQ0FBQTtRQUNyQixjQUFjLENBQUMsVUFBZixDQUEwQjtVQUFDLFVBQUEsUUFBRDtVQUFXLFNBQUEsT0FBWDtTQUExQjtRQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsV0FBWCxDQUF1QjtVQUFBLElBQUEsRUFBTSxjQUFOO1VBQXNCLFFBQUEsRUFBVSxDQUFDLENBQWpDO1NBQXZCLEVBSkY7O01BTUEsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxZQUFBLENBQUE7TUFDaEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQUE7TUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVgsQ0FBdUI7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLFFBQVA7UUFBaUIsUUFBQSxFQUFVLENBQTNCO09BQXZCO01BRUEsSUFBQyxDQUFBLGNBQUQsR0FBc0IsSUFBQSxrQkFBQSxDQUFBO01BQ3RCLElBQUMsQ0FBQSxjQUFjLENBQUMsVUFBaEIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsV0FBWCxDQUF1QjtRQUFBLElBQUEsRUFBTSxJQUFDLENBQUEsY0FBUDtRQUF1QixRQUFBLEVBQVUsQ0FBakM7T0FBdkI7TUFFQSxJQUFDLENBQUEsY0FBRCxHQUFzQixJQUFBLGtCQUFBLENBQUE7TUFDdEIsSUFBQyxDQUFBLGNBQWMsQ0FBQyxVQUFoQixDQUFBO01BQ0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxXQUFYLENBQXVCO1FBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxjQUFQO1FBQXVCLFFBQUEsRUFBVSxDQUFqQztPQUF2QjtNQUVBLElBQUMsQ0FBQSxPQUFELEdBQWUsSUFBQSxPQUFBLENBQUE7TUFDZixJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBQTthQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxZQUFYLENBQXdCO1FBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxPQUFQO1FBQWdCLFFBQUEsRUFBVSxDQUExQjtPQUF4QjtJQXRDUCxDQUFWO0lBd0NBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTs7WUFBUSxDQUFFLE9BQVYsQ0FBQTs7TUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXOztZQUVGLENBQUUsT0FBWCxDQUFBOztNQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7O1lBRUcsQ0FBRSxPQUFqQixDQUFBOztNQUNBLElBQUMsQ0FBQSxjQUFELEdBQWtCOztZQUVILENBQUUsT0FBakIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsY0FBRCxHQUFrQjs7WUFFSCxDQUFFLE9BQWpCLENBQUE7O01BQ0EsSUFBQyxDQUFBLGNBQUQsR0FBa0I7O1lBRVIsQ0FBRSxPQUFaLENBQUE7O01BQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYTs7WUFFQyxDQUFFLE9BQWhCLENBQUE7O01BQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUI7O1lBRVIsQ0FBRSxPQUFYLENBQUE7O01BQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUVaLElBQXlDLDRCQUF6QztlQUFBLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUE1Qjs7SUF6QlUsQ0F4Q1o7SUFtRUEsZ0JBQUEsRUFBa0IsU0FBQTthQUNoQjtRQUFBLFdBQUEsRUFBYSxJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUF2QixDQUE0QixJQUFDLENBQUEsU0FBN0IsQ0FBYjtRQUNBLFlBQUEsRUFBYyxJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUF4QixDQUE2QixJQUFDLENBQUEsU0FBOUIsQ0FEZDtRQUVBLFlBQUEsRUFBYyxJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUF4QixDQUE2QixJQUFDLENBQUEsU0FBOUIsQ0FGZDtRQUdBLGFBQUEsRUFBZSxJQUFDLENBQUEsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUF6QixDQUE4QixJQUFDLENBQUEsU0FBL0IsQ0FIZjtRQUlBLGtCQUFBLEVBQW9CLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQXJCLENBQTBCLElBQUMsQ0FBQSxXQUEzQixDQUpwQjs7SUFEZ0IsQ0FuRWxCO0lBMEVBLGVBQUEsRUFBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxJQUE2QiwyQkFBN0I7UUFBQSxJQUFDLENBQUEsY0FBYyxDQUFDLE9BQWhCLENBQUEsRUFBQTs7TUFFQSxTQUFBLEdBQVk7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLFNBQVA7UUFBa0IsUUFBQSxFQUFVLENBQTVCOztNQUNaLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNCQUFoQixDQUFIO2VBQ0UsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFmLENBQThCLFNBQTlCLEVBRHBCO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBZixDQUE4QixTQUE5QixFQUhwQjs7SUFKZSxDQTFFakI7SUF3RkEsc0JBQUEsRUFBd0IsU0FBQTtBQUN0QixVQUFBO01BQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxnQkFBRCxDQUFBO2FBRVo7UUFBQSxXQUFBLEVBQWEsU0FBQTtBQUNYLGNBQUE7VUFEWTtVQUNaLElBQUksQ0FBQyxTQUFMLENBQWUsbURBQWY7aUJBQ0EsU0FBUyxDQUFDLFdBQVYsa0JBQXNCLElBQXRCO1FBRlcsQ0FBYjtRQUdBLFlBQUEsRUFBYyxTQUFBO0FBQ1osY0FBQTtVQURhO1VBQ2IsSUFBSSxDQUFDLFNBQUwsQ0FBZSxtREFBZjtpQkFDQSxTQUFTLENBQUMsWUFBVixrQkFBdUIsSUFBdkI7UUFGWSxDQUhkO1FBTUEsWUFBQSxFQUFjLFNBQUE7VUFDWixJQUFJLENBQUMsU0FBTCxDQUFlLG1EQUFmO2lCQUNBLFNBQVMsQ0FBQyxZQUFWLENBQUE7UUFGWSxDQU5kO1FBU0EsYUFBQSxFQUFlLFNBQUE7VUFDYixJQUFJLENBQUMsU0FBTCxDQUFlLG1EQUFmO2lCQUNBLFNBQVMsQ0FBQyxhQUFWLENBQUE7UUFGYSxDQVRmOztJQUhzQixDQXhGeEI7O0FBVEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG5TdGF0dXNCYXJWaWV3ID0gcmVxdWlyZSAnLi9zdGF0dXMtYmFyLXZpZXcnXG5GaWxlSW5mb1ZpZXcgPSByZXF1aXJlICcuL2ZpbGUtaW5mby12aWV3J1xuQ3Vyc29yUG9zaXRpb25WaWV3ID0gcmVxdWlyZSAnLi9jdXJzb3ItcG9zaXRpb24tdmlldydcblNlbGVjdGlvbkNvdW50VmlldyA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLWNvdW50LXZpZXcnXG5HaXRWaWV3ID0gcmVxdWlyZSAnLi9naXQtdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAZW1pdHRlcnMgPSBuZXcgRW1pdHRlcigpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICBAc3RhdHVzQmFyID0gbmV3IFN0YXR1c0JhclZpZXcoKVxuICAgIEBzdGF0dXNCYXIuaW5pdGlhbGl6ZSgpXG4gICAgQGF0dGFjaFN0YXR1c0JhcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3N0YXR1cy1iYXIuZnVsbFdpZHRoJywgPT5cbiAgICAgIEBhdHRhY2hTdGF0dXNCYXIoKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ3N0YXR1cy1iYXI6dG9nZ2xlJywgPT5cbiAgICAgIGlmIEBzdGF0dXNCYXJQYW5lbC5pc1Zpc2libGUoKVxuICAgICAgICBAc3RhdHVzQmFyUGFuZWwuaGlkZSgpXG4gICAgICBlbHNlXG4gICAgICAgIEBzdGF0dXNCYXJQYW5lbC5zaG93KClcblxuICAgIHtzYWZlTW9kZSwgZGV2TW9kZX0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG4gICAgaWYgc2FmZU1vZGUgb3IgZGV2TW9kZVxuICAgICAgTGF1bmNoTW9kZVZpZXcgPSByZXF1aXJlICcuL2xhdW5jaC1tb2RlLXZpZXcnXG4gICAgICBsYXVuY2hNb2RlVmlldyA9IG5ldyBMYXVuY2hNb2RlVmlldygpXG4gICAgICBsYXVuY2hNb2RlVmlldy5pbml0aWFsaXplKHtzYWZlTW9kZSwgZGV2TW9kZX0pXG4gICAgICBAc3RhdHVzQmFyLmFkZExlZnRUaWxlKGl0ZW06IGxhdW5jaE1vZGVWaWV3LCBwcmlvcml0eTogLTEpXG5cbiAgICBAZmlsZUluZm8gPSBuZXcgRmlsZUluZm9WaWV3KClcbiAgICBAZmlsZUluZm8uaW5pdGlhbGl6ZSgpXG4gICAgQHN0YXR1c0Jhci5hZGRMZWZ0VGlsZShpdGVtOiBAZmlsZUluZm8sIHByaW9yaXR5OiAwKVxuXG4gICAgQGN1cnNvclBvc2l0aW9uID0gbmV3IEN1cnNvclBvc2l0aW9uVmlldygpXG4gICAgQGN1cnNvclBvc2l0aW9uLmluaXRpYWxpemUoKVxuICAgIEBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoaXRlbTogQGN1cnNvclBvc2l0aW9uLCBwcmlvcml0eTogMSlcblxuICAgIEBzZWxlY3Rpb25Db3VudCA9IG5ldyBTZWxlY3Rpb25Db3VudFZpZXcoKVxuICAgIEBzZWxlY3Rpb25Db3VudC5pbml0aWFsaXplKClcbiAgICBAc3RhdHVzQmFyLmFkZExlZnRUaWxlKGl0ZW06IEBzZWxlY3Rpb25Db3VudCwgcHJpb3JpdHk6IDIpXG5cbiAgICBAZ2l0SW5mbyA9IG5ldyBHaXRWaWV3KClcbiAgICBAZ2l0SW5mby5pbml0aWFsaXplKClcbiAgICBAZ2l0SW5mb1RpbGUgPSBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZShpdGVtOiBAZ2l0SW5mbywgcHJpb3JpdHk6IDApXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZ2l0SW5mbz8uZGVzdHJveSgpXG4gICAgQGdpdEluZm8gPSBudWxsXG5cbiAgICBAZmlsZUluZm8/LmRlc3Ryb3koKVxuICAgIEBmaWxlSW5mbyA9IG51bGxcblxuICAgIEBjdXJzb3JQb3NpdGlvbj8uZGVzdHJveSgpXG4gICAgQGN1cnNvclBvc2l0aW9uID0gbnVsbFxuXG4gICAgQHNlbGVjdGlvbkNvdW50Py5kZXN0cm95KClcbiAgICBAc2VsZWN0aW9uQ291bnQgPSBudWxsXG5cbiAgICBAc3RhdHVzQmFyUGFuZWw/LmRlc3Ryb3koKVxuICAgIEBzdGF0dXNCYXJQYW5lbCA9IG51bGxcblxuICAgIEBzdGF0dXNCYXI/LmRlc3Ryb3koKVxuICAgIEBzdGF0dXNCYXIgPSBudWxsXG5cbiAgICBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICBAZW1pdHRlcnM/LmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVycyA9IG51bGxcblxuICAgIGRlbGV0ZSBhdG9tLl9fd29ya3NwYWNlVmlldy5zdGF0dXNCYXIgaWYgYXRvbS5fX3dvcmtzcGFjZVZpZXc/XG5cbiAgcHJvdmlkZVN0YXR1c0JhcjogLT5cbiAgICBhZGRMZWZ0VGlsZTogQHN0YXR1c0Jhci5hZGRMZWZ0VGlsZS5iaW5kKEBzdGF0dXNCYXIpXG4gICAgYWRkUmlnaHRUaWxlOiBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZS5iaW5kKEBzdGF0dXNCYXIpXG4gICAgZ2V0TGVmdFRpbGVzOiBAc3RhdHVzQmFyLmdldExlZnRUaWxlcy5iaW5kKEBzdGF0dXNCYXIpXG4gICAgZ2V0UmlnaHRUaWxlczogQHN0YXR1c0Jhci5nZXRSaWdodFRpbGVzLmJpbmQoQHN0YXR1c0JhcilcbiAgICBkaXNhYmxlR2l0SW5mb1RpbGU6IEBnaXRJbmZvVGlsZS5kZXN0cm95LmJpbmQoQGdpdEluZm9UaWxlKVxuXG4gIGF0dGFjaFN0YXR1c0JhcjogLT5cbiAgICBAc3RhdHVzQmFyUGFuZWwuZGVzdHJveSgpIGlmIEBzdGF0dXNCYXJQYW5lbD9cblxuICAgIHBhbmVsQXJncyA9IGl0ZW06IEBzdGF0dXNCYXIsIHByaW9yaXR5OiAwXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzdGF0dXMtYmFyLmZ1bGxXaWR0aCcpXG4gICAgICBAc3RhdHVzQmFyUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRGb290ZXJQYW5lbCBwYW5lbEFyZ3NcbiAgICBlbHNlXG4gICAgICBAc3RhdHVzQmFyUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCBwYW5lbEFyZ3NcblxuICAjIERlcHJlY2F0ZWRcbiAgI1xuICAjIFdyYXAgZGVwcmVjYXRpb24gY2FsbHMgb24gdGhlIG1ldGhvZHMgcmV0dXJuZWQgcmF0aGVyIHRoYW5cbiAgIyBTZXJ2aWNlcyBBUEkgbWV0aG9kIHdoaWNoIHdvdWxkIGJlIHJlZ2lzdGVyZWQgYW5kIHRyaWdnZXJcbiAgIyBhIGRlcHJlY2F0aW9uIGNhbGxcbiAgbGVnYWN5UHJvdmlkZVN0YXR1c0JhcjogLT5cbiAgICBzdGF0dXNiYXIgPSBAcHJvdmlkZVN0YXR1c0JhcigpXG5cbiAgICBhZGRMZWZ0VGlsZTogKGFyZ3MuLi4pIC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5hZGRMZWZ0VGlsZShhcmdzLi4uKVxuICAgIGFkZFJpZ2h0VGlsZTogKGFyZ3MuLi4pIC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5hZGRSaWdodFRpbGUoYXJncy4uLilcbiAgICBnZXRMZWZ0VGlsZXM6IC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5nZXRMZWZ0VGlsZXMoKVxuICAgIGdldFJpZ2h0VGlsZXM6IC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5nZXRSaWdodFRpbGVzKClcbiJdfQ==
