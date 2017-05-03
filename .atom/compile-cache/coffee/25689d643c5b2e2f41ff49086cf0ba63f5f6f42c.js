(function() {
  var UIWatcher;

  UIWatcher = require('./ui-watcher');

  module.exports = {
    commandDisposable: null,
    activate: function(state) {
      var activatedDisposable, uiWatcher;
      if (!(atom.inDevMode() && !atom.inSpecMode())) {
        return;
      }
      uiWatcher = null;
      activatedDisposable = atom.packages.onDidActivateInitialPackages(function() {
        var packages, themes;
        uiWatcher = new UIWatcher({
          themeManager: atom.themes
        });
        themes = Object.keys(uiWatcher.watchedThemes);
        packages = Object.keys(uiWatcher.watchedPackages);
        return activatedDisposable.dispose();
      });
      return this.commandDisposable = atom.commands.add('atom-workspace', 'dev-live-reload:reload-all', function() {
        return uiWatcher.reloadAll();
      });
    },
    deactivate: function() {
      var ref;
      return (ref = this.commandDisposable) != null ? ref.dispose() : void 0;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXYtbGl2ZS1yZWxvYWQvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBRVosTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLGlCQUFBLEVBQW1CLElBQW5CO0lBQ0EsUUFBQSxFQUFVLFNBQUMsS0FBRDtBQUNSLFVBQUE7TUFBQSxJQUFBLENBQUEsQ0FBYyxJQUFJLENBQUMsU0FBTCxDQUFBLENBQUEsSUFBcUIsQ0FBSSxJQUFJLENBQUMsVUFBTCxDQUFBLENBQXZDLENBQUE7QUFBQSxlQUFBOztNQUVBLFNBQUEsR0FBWTtNQUNaLG1CQUFBLEdBQXNCLElBQUksQ0FBQyxRQUFRLENBQUMsNEJBQWQsQ0FBMkMsU0FBQTtBQUMvRCxZQUFBO1FBQUEsU0FBQSxHQUFnQixJQUFBLFNBQUEsQ0FBVTtVQUFBLFlBQUEsRUFBYyxJQUFJLENBQUMsTUFBbkI7U0FBVjtRQUNoQixNQUFBLEdBQVMsTUFBTSxDQUFDLElBQVAsQ0FBWSxTQUFTLENBQUMsYUFBdEI7UUFDVCxRQUFBLEdBQVcsTUFBTSxDQUFDLElBQVAsQ0FBWSxTQUFTLENBQUMsZUFBdEI7ZUFDWCxtQkFBbUIsQ0FBQyxPQUFwQixDQUFBO01BSitELENBQTNDO2FBTXRCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLDRCQUFwQyxFQUFrRSxTQUFBO2VBQ3JGLFNBQVMsQ0FBQyxTQUFWLENBQUE7TUFEcUYsQ0FBbEU7SUFWYixDQURWO0lBY0EsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBO3lEQUFrQixDQUFFLE9BQXBCLENBQUE7SUFEVSxDQWRaOztBQUhGIiwic291cmNlc0NvbnRlbnQiOlsiVUlXYXRjaGVyID0gcmVxdWlyZSAnLi91aS13YXRjaGVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGNvbW1hbmREaXNwb3NhYmxlOiBudWxsXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLmluRGV2TW9kZSgpIGFuZCBub3QgYXRvbS5pblNwZWNNb2RlKClcblxuICAgIHVpV2F0Y2hlciA9IG51bGxcbiAgICBhY3RpdmF0ZWREaXNwb3NhYmxlID0gYXRvbS5wYWNrYWdlcy5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzIC0+XG4gICAgICB1aVdhdGNoZXIgPSBuZXcgVUlXYXRjaGVyKHRoZW1lTWFuYWdlcjogYXRvbS50aGVtZXMpXG4gICAgICB0aGVtZXMgPSBPYmplY3Qua2V5cyh1aVdhdGNoZXIud2F0Y2hlZFRoZW1lcylcbiAgICAgIHBhY2thZ2VzID0gT2JqZWN0LmtleXModWlXYXRjaGVyLndhdGNoZWRQYWNrYWdlcylcbiAgICAgIGFjdGl2YXRlZERpc3Bvc2FibGUuZGlzcG9zZSgpXG5cbiAgICBAY29tbWFuZERpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGV2LWxpdmUtcmVsb2FkOnJlbG9hZC1hbGwnLCAtPlxuICAgICAgdWlXYXRjaGVyLnJlbG9hZEFsbCgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAY29tbWFuZERpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuIl19
