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
      this.updateStatusBarVisibility();
      this.statusBarVisibilitySubscription = atom.config.observe('status-bar.isVisible', (function(_this) {
        return function() {
          return _this.updateStatusBarVisibility();
        };
      })(this));
      atom.commands.add('atom-workspace', 'status-bar:toggle', (function(_this) {
        return function() {
          if (_this.statusBarPanel.isVisible()) {
            return atom.config.set('status-bar.isVisible', false);
          } else {
            return atom.config.set('status-bar.isVisible', true);
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
      var ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if ((ref1 = this.statusBarVisibilitySubscription) != null) {
        ref1.dispose();
      }
      this.statusBarVisibilitySubscription = null;
      if ((ref2 = this.gitInfo) != null) {
        ref2.destroy();
      }
      this.gitInfo = null;
      if ((ref3 = this.fileInfo) != null) {
        ref3.destroy();
      }
      this.fileInfo = null;
      if ((ref4 = this.cursorPosition) != null) {
        ref4.destroy();
      }
      this.cursorPosition = null;
      if ((ref5 = this.selectionCount) != null) {
        ref5.destroy();
      }
      this.selectionCount = null;
      if ((ref6 = this.statusBarPanel) != null) {
        ref6.destroy();
      }
      this.statusBarPanel = null;
      if ((ref7 = this.statusBar) != null) {
        ref7.destroy();
      }
      this.statusBar = null;
      if ((ref8 = this.subscriptions) != null) {
        ref8.dispose();
      }
      this.subscriptions = null;
      if ((ref9 = this.emitters) != null) {
        ref9.dispose();
      }
      this.emitters = null;
      if (atom.__workspaceView != null) {
        return delete atom.__workspaceView.statusBar;
      }
    },
    updateStatusBarVisibility: function() {
      if (atom.config.get('status-bar.isVisible')) {
        return this.statusBarPanel.show();
      } else {
        return this.statusBarPanel.hide();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUhBQUE7SUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsYUFBQSxHQUFnQixPQUFBLENBQVEsbUJBQVI7O0VBQ2hCLFlBQUEsR0FBZSxPQUFBLENBQVEsa0JBQVI7O0VBQ2Ysa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHdCQUFSOztFQUNyQixrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVI7O0VBQ3JCLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxPQUFBLENBQUE7TUFDaEIsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxtQkFBQSxDQUFBO01BRXJCLElBQUMsQ0FBQSxTQUFELEdBQWlCLElBQUEsYUFBQSxDQUFBO01BQ2pCLElBQUMsQ0FBQSxTQUFTLENBQUMsVUFBWCxDQUFBO01BQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTtNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVosQ0FBd0Isc0JBQXhCLEVBQWdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDakUsS0FBQyxDQUFBLGVBQUQsQ0FBQTtRQURpRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEQsQ0FBbkI7TUFHQSxJQUFDLENBQUEseUJBQUQsQ0FBQTtNQUVB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Q0FBQyxPQUFoQixDQUFBLEVBQUE7O01BRUEsU0FBQSxHQUFZO1FBQUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxTQUFQO1FBQWtCLFFBQUEsRUFBVSxDQUE1Qjs7TUFDWixJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBaEIsQ0FBSDtlQUNFLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBZixDQUE4QixTQUE5QixFQURwQjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWYsQ0FBOEIsU0FBOUIsRUFIcEI7O0lBSmUsQ0F6RmpCO0lBdUdBLHNCQUFBLEVBQXdCLFNBQUE7QUFDdEIsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTthQUVaO1FBQUEsV0FBQSxFQUFhLFNBQUE7QUFDWCxjQUFBO1VBRFk7VUFDWixJQUFJLENBQUMsU0FBTCxDQUFlLG1EQUFmO2lCQUNBLFNBQVMsQ0FBQyxXQUFWLGtCQUFzQixJQUF0QjtRQUZXLENBQWI7UUFHQSxZQUFBLEVBQWMsU0FBQTtBQUNaLGNBQUE7VUFEYTtVQUNiLElBQUksQ0FBQyxTQUFMLENBQWUsbURBQWY7aUJBQ0EsU0FBUyxDQUFDLFlBQVYsa0JBQXVCLElBQXZCO1FBRlksQ0FIZDtRQU1BLFlBQUEsRUFBYyxTQUFBO1VBQ1osSUFBSSxDQUFDLFNBQUwsQ0FBZSxtREFBZjtpQkFDQSxTQUFTLENBQUMsWUFBVixDQUFBO1FBRlksQ0FOZDtRQVNBLGFBQUEsRUFBZSxTQUFBO1VBQ2IsSUFBSSxDQUFDLFNBQUwsQ0FBZSxtREFBZjtpQkFDQSxTQUFTLENBQUMsYUFBVixDQUFBO1FBRmEsQ0FUZjs7SUFIc0IsQ0F2R3hCOztBQVRGIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuU3RhdHVzQmFyVmlldyA9IHJlcXVpcmUgJy4vc3RhdHVzLWJhci12aWV3J1xuRmlsZUluZm9WaWV3ID0gcmVxdWlyZSAnLi9maWxlLWluZm8tdmlldydcbkN1cnNvclBvc2l0aW9uVmlldyA9IHJlcXVpcmUgJy4vY3Vyc29yLXBvc2l0aW9uLXZpZXcnXG5TZWxlY3Rpb25Db3VudFZpZXcgPSByZXF1aXJlICcuL3NlbGVjdGlvbi1jb3VudC12aWV3J1xuR2l0VmlldyA9IHJlcXVpcmUgJy4vZ2l0LXZpZXcnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGVtaXR0ZXJzID0gbmV3IEVtaXR0ZXIoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgQHN0YXR1c0JhciA9IG5ldyBTdGF0dXNCYXJWaWV3KClcbiAgICBAc3RhdHVzQmFyLmluaXRpYWxpemUoKVxuICAgIEBhdHRhY2hTdGF0dXNCYXIoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzdGF0dXMtYmFyLmZ1bGxXaWR0aCcsID0+XG4gICAgICBAYXR0YWNoU3RhdHVzQmFyKClcblxuICAgIEB1cGRhdGVTdGF0dXNCYXJWaXNpYmlsaXR5KClcblxuICAgIEBzdGF0dXNCYXJWaXNpYmlsaXR5U3Vic2NyaXB0aW9uID1cbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ3N0YXR1cy1iYXIuaXNWaXNpYmxlJywgPT5cbiAgICAgICAgQHVwZGF0ZVN0YXR1c0JhclZpc2liaWxpdHkoKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ3N0YXR1cy1iYXI6dG9nZ2xlJywgPT5cbiAgICAgIGlmIEBzdGF0dXNCYXJQYW5lbC5pc1Zpc2libGUoKVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQgJ3N0YXR1cy1iYXIuaXNWaXNpYmxlJywgZmFsc2VcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5jb25maWcuc2V0ICdzdGF0dXMtYmFyLmlzVmlzaWJsZScsIHRydWVcblxuICAgIHtzYWZlTW9kZSwgZGV2TW9kZX0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG4gICAgaWYgc2FmZU1vZGUgb3IgZGV2TW9kZVxuICAgICAgTGF1bmNoTW9kZVZpZXcgPSByZXF1aXJlICcuL2xhdW5jaC1tb2RlLXZpZXcnXG4gICAgICBsYXVuY2hNb2RlVmlldyA9IG5ldyBMYXVuY2hNb2RlVmlldygpXG4gICAgICBsYXVuY2hNb2RlVmlldy5pbml0aWFsaXplKHtzYWZlTW9kZSwgZGV2TW9kZX0pXG4gICAgICBAc3RhdHVzQmFyLmFkZExlZnRUaWxlKGl0ZW06IGxhdW5jaE1vZGVWaWV3LCBwcmlvcml0eTogLTEpXG5cbiAgICBAZmlsZUluZm8gPSBuZXcgRmlsZUluZm9WaWV3KClcbiAgICBAZmlsZUluZm8uaW5pdGlhbGl6ZSgpXG4gICAgQHN0YXR1c0Jhci5hZGRMZWZ0VGlsZShpdGVtOiBAZmlsZUluZm8sIHByaW9yaXR5OiAwKVxuXG4gICAgQGN1cnNvclBvc2l0aW9uID0gbmV3IEN1cnNvclBvc2l0aW9uVmlldygpXG4gICAgQGN1cnNvclBvc2l0aW9uLmluaXRpYWxpemUoKVxuICAgIEBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoaXRlbTogQGN1cnNvclBvc2l0aW9uLCBwcmlvcml0eTogMSlcblxuICAgIEBzZWxlY3Rpb25Db3VudCA9IG5ldyBTZWxlY3Rpb25Db3VudFZpZXcoKVxuICAgIEBzZWxlY3Rpb25Db3VudC5pbml0aWFsaXplKClcbiAgICBAc3RhdHVzQmFyLmFkZExlZnRUaWxlKGl0ZW06IEBzZWxlY3Rpb25Db3VudCwgcHJpb3JpdHk6IDIpXG5cbiAgICBAZ2l0SW5mbyA9IG5ldyBHaXRWaWV3KClcbiAgICBAZ2l0SW5mby5pbml0aWFsaXplKClcbiAgICBAZ2l0SW5mb1RpbGUgPSBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZShpdGVtOiBAZ2l0SW5mbywgcHJpb3JpdHk6IDApXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAc3RhdHVzQmFyVmlzaWJpbGl0eVN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHN0YXR1c0JhclZpc2liaWxpdHlTdWJzY3JpcHRpb24gPSBudWxsXG4gICAgXG4gICAgQGdpdEluZm8/LmRlc3Ryb3koKVxuICAgIEBnaXRJbmZvID0gbnVsbFxuXG4gICAgQGZpbGVJbmZvPy5kZXN0cm95KClcbiAgICBAZmlsZUluZm8gPSBudWxsXG5cbiAgICBAY3Vyc29yUG9zaXRpb24/LmRlc3Ryb3koKVxuICAgIEBjdXJzb3JQb3NpdGlvbiA9IG51bGxcblxuICAgIEBzZWxlY3Rpb25Db3VudD8uZGVzdHJveSgpXG4gICAgQHNlbGVjdGlvbkNvdW50ID0gbnVsbFxuXG4gICAgQHN0YXR1c0JhclBhbmVsPy5kZXN0cm95KClcbiAgICBAc3RhdHVzQmFyUGFuZWwgPSBudWxsXG5cbiAgICBAc3RhdHVzQmFyPy5kZXN0cm95KClcbiAgICBAc3RhdHVzQmFyID0gbnVsbFxuXG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gICAgQGVtaXR0ZXJzPy5kaXNwb3NlKClcbiAgICBAZW1pdHRlcnMgPSBudWxsXG5cbiAgICBkZWxldGUgYXRvbS5fX3dvcmtzcGFjZVZpZXcuc3RhdHVzQmFyIGlmIGF0b20uX193b3Jrc3BhY2VWaWV3P1xuXG4gIHVwZGF0ZVN0YXR1c0JhclZpc2liaWxpdHk6IC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0ICdzdGF0dXMtYmFyLmlzVmlzaWJsZSdcbiAgICAgIEBzdGF0dXNCYXJQYW5lbC5zaG93KClcbiAgICBlbHNlXG4gICAgICBAc3RhdHVzQmFyUGFuZWwuaGlkZSgpXG5cbiAgcHJvdmlkZVN0YXR1c0JhcjogLT5cbiAgICBhZGRMZWZ0VGlsZTogQHN0YXR1c0Jhci5hZGRMZWZ0VGlsZS5iaW5kKEBzdGF0dXNCYXIpXG4gICAgYWRkUmlnaHRUaWxlOiBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZS5iaW5kKEBzdGF0dXNCYXIpXG4gICAgZ2V0TGVmdFRpbGVzOiBAc3RhdHVzQmFyLmdldExlZnRUaWxlcy5iaW5kKEBzdGF0dXNCYXIpXG4gICAgZ2V0UmlnaHRUaWxlczogQHN0YXR1c0Jhci5nZXRSaWdodFRpbGVzLmJpbmQoQHN0YXR1c0JhcilcbiAgICBkaXNhYmxlR2l0SW5mb1RpbGU6IEBnaXRJbmZvVGlsZS5kZXN0cm95LmJpbmQoQGdpdEluZm9UaWxlKVxuXG4gIGF0dGFjaFN0YXR1c0JhcjogLT5cbiAgICBAc3RhdHVzQmFyUGFuZWwuZGVzdHJveSgpIGlmIEBzdGF0dXNCYXJQYW5lbD9cblxuICAgIHBhbmVsQXJncyA9IGl0ZW06IEBzdGF0dXNCYXIsIHByaW9yaXR5OiAwXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdzdGF0dXMtYmFyLmZ1bGxXaWR0aCcpXG4gICAgICBAc3RhdHVzQmFyUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRGb290ZXJQYW5lbCBwYW5lbEFyZ3NcbiAgICBlbHNlXG4gICAgICBAc3RhdHVzQmFyUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbCBwYW5lbEFyZ3NcblxuICAjIERlcHJlY2F0ZWRcbiAgI1xuICAjIFdyYXAgZGVwcmVjYXRpb24gY2FsbHMgb24gdGhlIG1ldGhvZHMgcmV0dXJuZWQgcmF0aGVyIHRoYW5cbiAgIyBTZXJ2aWNlcyBBUEkgbWV0aG9kIHdoaWNoIHdvdWxkIGJlIHJlZ2lzdGVyZWQgYW5kIHRyaWdnZXJcbiAgIyBhIGRlcHJlY2F0aW9uIGNhbGxcbiAgbGVnYWN5UHJvdmlkZVN0YXR1c0JhcjogLT5cbiAgICBzdGF0dXNiYXIgPSBAcHJvdmlkZVN0YXR1c0JhcigpXG5cbiAgICBhZGRMZWZ0VGlsZTogKGFyZ3MuLi4pIC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5hZGRMZWZ0VGlsZShhcmdzLi4uKVxuICAgIGFkZFJpZ2h0VGlsZTogKGFyZ3MuLi4pIC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5hZGRSaWdodFRpbGUoYXJncy4uLilcbiAgICBnZXRMZWZ0VGlsZXM6IC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5nZXRMZWZ0VGlsZXMoKVxuICAgIGdldFJpZ2h0VGlsZXM6IC0+XG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlVzZSB2ZXJzaW9uIF4xLjAuMCBvZiB0aGUgc3RhdHVzLWJhciBTZXJ2aWNlIEFQSS5cIilcbiAgICAgIHN0YXR1c2Jhci5nZXRSaWdodFRpbGVzKClcbiJdfQ==
