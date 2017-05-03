(function() {
  module.exports = function(arg) {
    var ApplicationDelegate, AtomEnvironment, Clipboard, TextEditor, base, blobStore, clipboard, devMode, env, exportsPath, getWindowLoadSettings, ipcRenderer, path, ref, resourcePath, updateProcessEnv;
    blobStore = arg.blobStore;
    updateProcessEnv = require('./update-process-env').updateProcessEnv;
    path = require('path');
    require('./window');
    getWindowLoadSettings = require('./window-load-settings-helpers').getWindowLoadSettings;
    ipcRenderer = require('electron').ipcRenderer;
    ref = getWindowLoadSettings(), resourcePath = ref.resourcePath, devMode = ref.devMode, env = ref.env;
    require('./electron-shims');
    exportsPath = path.join(resourcePath, 'exports');
    require('module').globalPaths.push(exportsPath);
    process.env.NODE_PATH = exportsPath;
    if (!devMode) {
      if ((base = process.env).NODE_ENV == null) {
        base.NODE_ENV = 'production';
      }
    }
    AtomEnvironment = require('./atom-environment');
    ApplicationDelegate = require('./application-delegate');
    Clipboard = require('./clipboard');
    TextEditor = require('./text-editor');
    clipboard = new Clipboard;
    TextEditor.setClipboard(clipboard);
    window.atom = new AtomEnvironment({
      window: window,
      document: document,
      clipboard: clipboard,
      blobStore: blobStore,
      applicationDelegate: new ApplicationDelegate,
      configDirPath: process.env.ATOM_HOME,
      enablePersistence: true,
      env: process.env
    });
    return atom.startEditorWindow().then(function() {
      var windowFocused;
      windowFocused = function() {
        window.removeEventListener('focus', windowFocused);
        return setTimeout((function() {
          return document.querySelector('atom-workspace').focus();
        }), 0);
      };
      window.addEventListener('focus', windowFocused);
      return ipcRenderer.on('environment', function(event, env) {
        return updateProcessEnv(env);
      });
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9pbml0aWFsaXplLWFwcGxpY2F0aW9uLXdpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLEdBQUQ7QUFDZixRQUFBO0lBRGlCLFlBQUQ7SUFDZixtQkFBb0IsT0FBQSxDQUFRLHNCQUFSO0lBQ3JCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjtJQUNQLE9BQUEsQ0FBUSxVQUFSO0lBQ0Msd0JBQXlCLE9BQUEsQ0FBUSxnQ0FBUjtJQUN6QixjQUFlLE9BQUEsQ0FBUSxVQUFSO0lBQ2hCLE1BQStCLHFCQUFBLENBQUEsQ0FBL0IsRUFBQywrQkFBRCxFQUFlLHFCQUFmLEVBQXdCO0lBQ3hCLE9BQUEsQ0FBUSxrQkFBUjtJQUdBLFdBQUEsR0FBYyxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBd0IsU0FBeEI7SUFDZCxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLFdBQVcsQ0FBQyxJQUE5QixDQUFtQyxXQUFuQztJQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBWixHQUF3QjtJQUd4QixJQUFBLENBQTRDLE9BQTVDOztZQUFXLENBQUMsV0FBWTtPQUF4Qjs7SUFFQSxlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjtJQUNsQixtQkFBQSxHQUFzQixPQUFBLENBQVEsd0JBQVI7SUFDdEIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSO0lBQ1osVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSO0lBRWIsU0FBQSxHQUFZLElBQUk7SUFDaEIsVUFBVSxDQUFDLFlBQVgsQ0FBd0IsU0FBeEI7SUFFQSxNQUFNLENBQUMsSUFBUCxHQUFrQixJQUFBLGVBQUEsQ0FBZ0I7TUFDaEMsUUFBQSxNQURnQztNQUN4QixVQUFBLFFBRHdCO01BQ2QsV0FBQSxTQURjO01BQ0gsV0FBQSxTQURHO01BRWhDLG1CQUFBLEVBQXFCLElBQUksbUJBRk87TUFHaEMsYUFBQSxFQUFlLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FISztNQUloQyxpQkFBQSxFQUFtQixJQUphO01BS2hDLEdBQUEsRUFBSyxPQUFPLENBQUMsR0FMbUI7S0FBaEI7V0FRbEIsSUFBSSxDQUFDLGlCQUFMLENBQUEsQ0FBd0IsQ0FBQyxJQUF6QixDQUE4QixTQUFBO0FBRTVCLFVBQUE7TUFBQSxhQUFBLEdBQWdCLFNBQUE7UUFDZCxNQUFNLENBQUMsbUJBQVAsQ0FBMkIsT0FBM0IsRUFBb0MsYUFBcEM7ZUFDQSxVQUFBLENBQVcsQ0FBQyxTQUFBO2lCQUFHLFFBQVEsQ0FBQyxhQUFULENBQXVCLGdCQUF2QixDQUF3QyxDQUFDLEtBQXpDLENBQUE7UUFBSCxDQUFELENBQVgsRUFBa0UsQ0FBbEU7TUFGYztNQUdoQixNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsT0FBeEIsRUFBaUMsYUFBakM7YUFDQSxXQUFXLENBQUMsRUFBWixDQUFlLGFBQWYsRUFBOEIsU0FBQyxLQUFELEVBQVEsR0FBUjtlQUM1QixnQkFBQSxDQUFpQixHQUFqQjtNQUQ0QixDQUE5QjtJQU40QixDQUE5QjtFQWpDZTtBQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgTGlrZSBzYW5kcyB0aHJvdWdoIHRoZSBob3VyZ2xhc3MsIHNvIGFyZSB0aGUgZGF5cyBvZiBvdXIgbGl2ZXMuXG5tb2R1bGUuZXhwb3J0cyA9ICh7YmxvYlN0b3JlfSkgLT5cbiAge3VwZGF0ZVByb2Nlc3NFbnZ9ID0gcmVxdWlyZSgnLi91cGRhdGUtcHJvY2Vzcy1lbnYnKVxuICBwYXRoID0gcmVxdWlyZSAncGF0aCdcbiAgcmVxdWlyZSAnLi93aW5kb3cnXG4gIHtnZXRXaW5kb3dMb2FkU2V0dGluZ3N9ID0gcmVxdWlyZSAnLi93aW5kb3ctbG9hZC1zZXR0aW5ncy1oZWxwZXJzJ1xuICB7aXBjUmVuZGVyZXJ9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG4gIHtyZXNvdXJjZVBhdGgsIGRldk1vZGUsIGVudn0gPSBnZXRXaW5kb3dMb2FkU2V0dGluZ3MoKVxuICByZXF1aXJlICcuL2VsZWN0cm9uLXNoaW1zJ1xuXG4gICMgQWRkIGFwcGxpY2F0aW9uLXNwZWNpZmljIGV4cG9ydHMgdG8gbW9kdWxlIHNlYXJjaCBwYXRoLlxuICBleHBvcnRzUGF0aCA9IHBhdGguam9pbihyZXNvdXJjZVBhdGgsICdleHBvcnRzJylcbiAgcmVxdWlyZSgnbW9kdWxlJykuZ2xvYmFsUGF0aHMucHVzaChleHBvcnRzUGF0aClcbiAgcHJvY2Vzcy5lbnYuTk9ERV9QQVRIID0gZXhwb3J0c1BhdGhcblxuICAjIE1ha2UgUmVhY3QgZmFzdGVyXG4gIHByb2Nlc3MuZW52Lk5PREVfRU5WID89ICdwcm9kdWN0aW9uJyB1bmxlc3MgZGV2TW9kZVxuXG4gIEF0b21FbnZpcm9ubWVudCA9IHJlcXVpcmUgJy4vYXRvbS1lbnZpcm9ubWVudCdcbiAgQXBwbGljYXRpb25EZWxlZ2F0ZSA9IHJlcXVpcmUgJy4vYXBwbGljYXRpb24tZGVsZWdhdGUnXG4gIENsaXBib2FyZCA9IHJlcXVpcmUgJy4vY2xpcGJvYXJkJ1xuICBUZXh0RWRpdG9yID0gcmVxdWlyZSAnLi90ZXh0LWVkaXRvcidcblxuICBjbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkXG4gIFRleHRFZGl0b3Iuc2V0Q2xpcGJvYXJkKGNsaXBib2FyZClcblxuICB3aW5kb3cuYXRvbSA9IG5ldyBBdG9tRW52aXJvbm1lbnQoe1xuICAgIHdpbmRvdywgZG9jdW1lbnQsIGNsaXBib2FyZCwgYmxvYlN0b3JlLFxuICAgIGFwcGxpY2F0aW9uRGVsZWdhdGU6IG5ldyBBcHBsaWNhdGlvbkRlbGVnYXRlLFxuICAgIGNvbmZpZ0RpclBhdGg6IHByb2Nlc3MuZW52LkFUT01fSE9NRSxcbiAgICBlbmFibGVQZXJzaXN0ZW5jZTogdHJ1ZSxcbiAgICBlbnY6IHByb2Nlc3MuZW52XG4gIH0pXG5cbiAgYXRvbS5zdGFydEVkaXRvcldpbmRvdygpLnRoZW4gLT5cbiAgICAjIFdvcmthcm91bmQgZm9yIGZvY3VzIGdldHRpbmcgY2xlYXJlZCB1cG9uIHdpbmRvdyBjcmVhdGlvblxuICAgIHdpbmRvd0ZvY3VzZWQgPSAtPlxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgd2luZG93Rm9jdXNlZClcbiAgICAgIHNldFRpbWVvdXQgKC0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2F0b20td29ya3NwYWNlJykuZm9jdXMoKSksIDBcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB3aW5kb3dGb2N1c2VkKVxuICAgIGlwY1JlbmRlcmVyLm9uKCdlbnZpcm9ubWVudCcsIChldmVudCwgZW52KSAtPlxuICAgICAgdXBkYXRlUHJvY2Vzc0VudihlbnYpXG4gICAgKVxuIl19
