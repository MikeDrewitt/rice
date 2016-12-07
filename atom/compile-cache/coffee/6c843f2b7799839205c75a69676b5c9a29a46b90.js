(function() {
  var cloneObject, ipcHelpers;

  ipcHelpers = require('./ipc-helpers');

  cloneObject = function(object) {
    var clone, key, value;
    clone = {};
    for (key in object) {
      value = object[key];
      clone[key] = value;
    }
    return clone;
  };

  module.exports = function(arg) {
    var ApplicationDelegate, AtomEnvironment, Clipboard, TextEditor, blobStore, buildAtomEnvironment, buildDefaultApplicationDelegate, clipboard, error, exitWithStatusCode, exportsPath, getWindowLoadSettings, handleKeydown, headless, ipcRenderer, legacyTestRunner, legacyTestRunnerPath, logFile, path, promise, ref, ref1, remote, startCrashReporter, testPaths, testRunner, testRunnerPath;
    blobStore = arg.blobStore;
    startCrashReporter = require('./crash-reporter-start');
    remote = require('electron').remote;
    startCrashReporter();
    exitWithStatusCode = function(status) {
      remote.app.emit('will-quit');
      return remote.process.exit(status);
    };
    try {
      path = require('path');
      ipcRenderer = require('electron').ipcRenderer;
      getWindowLoadSettings = require('./window-load-settings-helpers').getWindowLoadSettings;
      AtomEnvironment = require('../src/atom-environment');
      ApplicationDelegate = require('../src/application-delegate');
      Clipboard = require('../src/clipboard');
      TextEditor = require('../src/text-editor');
      require('./electron-shims');
      ref = getWindowLoadSettings(), testRunnerPath = ref.testRunnerPath, legacyTestRunnerPath = ref.legacyTestRunnerPath, headless = ref.headless, logFile = ref.logFile, testPaths = ref.testPaths;
      if (!headless) {
        remote.getCurrentWindow().show();
      }
      handleKeydown = function(event) {
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 82) {
          ipcHelpers.call('window-method', 'reload');
        }
        if (event.keyCode === 73 && ((process.platform === 'darwin' && event.metaKey && event.altKey) || (process.platform !== 'darwin' && event.ctrlKey && event.shiftKey))) {
          ipcHelpers.call('window-method', 'toggleDevTools');
        }
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 87) {
          ipcHelpers.call('window-method', 'close');
        }
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 67) {
          return ipcHelpers.call('window-method', 'copy');
        }
      };
      window.addEventListener('keydown', handleKeydown, true);
      exportsPath = path.join(getWindowLoadSettings().resourcePath, 'exports');
      require('module').globalPaths.push(exportsPath);
      process.env.NODE_PATH = exportsPath;
      document.title = "Spec Suite";
      clipboard = new Clipboard;
      TextEditor.setClipboard(clipboard);
      testRunner = require(testRunnerPath);
      legacyTestRunner = require(legacyTestRunnerPath);
      buildDefaultApplicationDelegate = function() {
        return new ApplicationDelegate();
      };
      buildAtomEnvironment = function(params) {
        params = cloneObject(params);
        if (!params.hasOwnProperty("clipboard")) {
          params.clipboard = clipboard;
        }
        if (!params.hasOwnProperty("blobStore")) {
          params.blobStore = blobStore;
        }
        if (!params.hasOwnProperty("onlyLoadBaseStyleSheets")) {
          params.onlyLoadBaseStyleSheets = true;
        }
        return new AtomEnvironment(params);
      };
      promise = testRunner({
        logFile: logFile,
        headless: headless,
        testPaths: testPaths,
        buildAtomEnvironment: buildAtomEnvironment,
        buildDefaultApplicationDelegate: buildDefaultApplicationDelegate,
        legacyTestRunner: legacyTestRunner
      });
      return promise.then(function(statusCode) {
        if (getWindowLoadSettings().headless) {
          return exitWithStatusCode(statusCode);
        }
      });
    } catch (error1) {
      error = error1;
      if (getWindowLoadSettings().headless) {
        console.error((ref1 = error.stack) != null ? ref1 : error);
        return exitWithStatusCode(1);
      } else {
        throw error;
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9pbml0aWFsaXplLXRlc3Qtd2luZG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUViLFdBQUEsR0FBYyxTQUFDLE1BQUQ7QUFDWixRQUFBO0lBQUEsS0FBQSxHQUFRO0FBQ1IsU0FBQSxhQUFBOztNQUFBLEtBQU0sQ0FBQSxHQUFBLENBQU4sR0FBYTtBQUFiO1dBQ0E7RUFIWTs7RUFLZCxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLEdBQUQ7QUFDZixRQUFBO0lBRGlCLFlBQUQ7SUFDaEIsa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHdCQUFSO0lBQ3BCLFNBQVUsT0FBQSxDQUFRLFVBQVI7SUFFWCxrQkFBQSxDQUFBO0lBRUEsa0JBQUEsR0FBcUIsU0FBQyxNQUFEO01BQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBWCxDQUFnQixXQUFoQjthQUNBLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBZixDQUFvQixNQUFwQjtJQUZtQjtBQUlyQjtNQUNFLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjtNQUNOLGNBQWUsT0FBQSxDQUFRLFVBQVI7TUFDZix3QkFBeUIsT0FBQSxDQUFRLGdDQUFSO01BQzFCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHlCQUFSO01BQ2xCLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSw2QkFBUjtNQUN0QixTQUFBLEdBQVksT0FBQSxDQUFRLGtCQUFSO01BQ1osVUFBQSxHQUFhLE9BQUEsQ0FBUSxvQkFBUjtNQUNiLE9BQUEsQ0FBUSxrQkFBUjtNQUVBLE1BQXVFLHFCQUFBLENBQUEsQ0FBdkUsRUFBQyxtQ0FBRCxFQUFpQiwrQ0FBakIsRUFBdUMsdUJBQXZDLEVBQWlELHFCQUFqRCxF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RUFBQTs7TUFEVyxDQUFiLEVBOURGO0tBQUEsY0FBQTtNQWdFTTtNQUNKLElBQUcscUJBQUEsQ0FBQSxDQUF1QixDQUFDLFFBQTNCO1FBQ0UsT0FBTyxDQUFDLEtBQVIsdUNBQTRCLEtBQTVCO2VBQ0Esa0JBQUEsQ0FBbUIsQ0FBbkIsRUFGRjtPQUFBLE1BQUE7QUFJRSxjQUFNLE1BSlI7T0FqRUY7O0VBVmU7QUFQakIiLCJzb3VyY2VzQ29udGVudCI6WyJpcGNIZWxwZXJzID0gcmVxdWlyZSAnLi9pcGMtaGVscGVycydcblxuY2xvbmVPYmplY3QgPSAob2JqZWN0KSAtPlxuICBjbG9uZSA9IHt9XG4gIGNsb25lW2tleV0gPSB2YWx1ZSBmb3Iga2V5LCB2YWx1ZSBvZiBvYmplY3RcbiAgY2xvbmVcblxubW9kdWxlLmV4cG9ydHMgPSAoe2Jsb2JTdG9yZX0pIC0+XG4gIHN0YXJ0Q3Jhc2hSZXBvcnRlciA9IHJlcXVpcmUoJy4vY3Jhc2gtcmVwb3J0ZXItc3RhcnQnKVxuICB7cmVtb3RlfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG4gIHN0YXJ0Q3Jhc2hSZXBvcnRlcigpICMgQmVmb3JlIGFueXRoaW5nIGVsc2VcblxuICBleGl0V2l0aFN0YXR1c0NvZGUgPSAoc3RhdHVzKSAtPlxuICAgIHJlbW90ZS5hcHAuZW1pdCgnd2lsbC1xdWl0JylcbiAgICByZW1vdGUucHJvY2Vzcy5leGl0KHN0YXR1cylcblxuICB0cnlcbiAgICBwYXRoID0gcmVxdWlyZSAncGF0aCdcbiAgICB7aXBjUmVuZGVyZXJ9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG4gICAge2dldFdpbmRvd0xvYWRTZXR0aW5nc30gPSByZXF1aXJlICcuL3dpbmRvdy1sb2FkLXNldHRpbmdzLWhlbHBlcnMnXG4gICAgQXRvbUVudmlyb25tZW50ID0gcmVxdWlyZSAnLi4vc3JjL2F0b20tZW52aXJvbm1lbnQnXG4gICAgQXBwbGljYXRpb25EZWxlZ2F0ZSA9IHJlcXVpcmUgJy4uL3NyYy9hcHBsaWNhdGlvbi1kZWxlZ2F0ZSdcbiAgICBDbGlwYm9hcmQgPSByZXF1aXJlICcuLi9zcmMvY2xpcGJvYXJkJ1xuICAgIFRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9zcmMvdGV4dC1lZGl0b3InXG4gICAgcmVxdWlyZSAnLi9lbGVjdHJvbi1zaGltcydcblxuICAgIHt0ZXN0UnVubmVyUGF0aCwgbGVnYWN5VGVzdFJ1bm5lclBhdGgsIGhlYWRsZXNzLCBsb2dGaWxlLCB0ZXN0UGF0aHN9ID0gZ2V0V2luZG93TG9hZFNldHRpbmdzKClcblxuICAgIHVubGVzcyBoZWFkbGVzc1xuICAgICAgIyBTaG93IHdpbmRvdyBzeW5jaHJvbm91c2x5IHNvIGEgZm9jdXNvdXQgZG9lc24ndCBmaXJlIG9uIGlucHV0IGVsZW1lbnRzXG4gICAgICAjIHRoYXQgYXJlIGZvY3VzZWQgaW4gdGhlIHZlcnkgZmlyc3Qgc3BlYyBydW4uXG4gICAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLnNob3coKVxuXG4gICAgaGFuZGxlS2V5ZG93biA9IChldmVudCkgLT5cbiAgICAgICMgUmVsb2FkOiBjbWQtciAvIGN0cmwtclxuICAgICAgaWYgKGV2ZW50Lm1ldGFLZXkgb3IgZXZlbnQuY3RybEtleSkgYW5kIGV2ZW50LmtleUNvZGUgaXMgODJcbiAgICAgICAgaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ3JlbG9hZCcpXG5cbiAgICAgICMgVG9nZ2xlIERldiBUb29sczogY21kLWFsdC1pIChNYWMpIC8gY3RybC1zaGlmdC1pIChMaW51eC9XaW5kb3dzKVxuICAgICAgaWYgZXZlbnQua2V5Q29kZSBpcyA3MyBhbmQgKFxuICAgICAgICAocHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJyBhbmQgZXZlbnQubWV0YUtleSBhbmQgZXZlbnQuYWx0S2V5KSBvclxuICAgICAgICAocHJvY2Vzcy5wbGF0Zm9ybSBpc250ICdkYXJ3aW4nIGFuZCBldmVudC5jdHJsS2V5IGFuZCBldmVudC5zaGlmdEtleSkpXG4gICAgICAgICAgaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ3RvZ2dsZURldlRvb2xzJylcblxuICAgICAgIyBDbG9zZTogY21kLXcgLyBjdHJsLXdcbiAgICAgIGlmIChldmVudC5tZXRhS2V5IG9yIGV2ZW50LmN0cmxLZXkpIGFuZCBldmVudC5rZXlDb2RlIGlzIDg3XG4gICAgICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdjbG9zZScpXG5cbiAgICAgICMgQ29weTogY21kLWMgLyBjdHJsLWNcbiAgICAgIGlmIChldmVudC5tZXRhS2V5IG9yIGV2ZW50LmN0cmxLZXkpIGFuZCBldmVudC5rZXlDb2RlIGlzIDY3XG4gICAgICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdjb3B5JylcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5ZG93biwgdHJ1ZSlcblxuICAgICMgQWRkICdleHBvcnRzJyB0byBtb2R1bGUgc2VhcmNoIHBhdGguXG4gICAgZXhwb3J0c1BhdGggPSBwYXRoLmpvaW4oZ2V0V2luZG93TG9hZFNldHRpbmdzKCkucmVzb3VyY2VQYXRoLCAnZXhwb3J0cycpXG4gICAgcmVxdWlyZSgnbW9kdWxlJykuZ2xvYmFsUGF0aHMucHVzaChleHBvcnRzUGF0aClcbiAgICBwcm9jZXNzLmVudi5OT0RFX1BBVEggPSBleHBvcnRzUGF0aCAjIFNldCBOT0RFX1BBVEggZW52IHZhcmlhYmxlIHNpbmNlIHRhc2tzIG1heSBuZWVkIGl0LlxuXG4gICAgZG9jdW1lbnQudGl0bGUgPSBcIlNwZWMgU3VpdGVcIlxuXG4gICAgY2xpcGJvYXJkID0gbmV3IENsaXBib2FyZFxuICAgIFRleHRFZGl0b3Iuc2V0Q2xpcGJvYXJkKGNsaXBib2FyZClcblxuICAgIHRlc3RSdW5uZXIgPSByZXF1aXJlKHRlc3RSdW5uZXJQYXRoKVxuICAgIGxlZ2FjeVRlc3RSdW5uZXIgPSByZXF1aXJlKGxlZ2FjeVRlc3RSdW5uZXJQYXRoKVxuICAgIGJ1aWxkRGVmYXVsdEFwcGxpY2F0aW9uRGVsZWdhdGUgPSAtPiBuZXcgQXBwbGljYXRpb25EZWxlZ2F0ZSgpXG4gICAgYnVpbGRBdG9tRW52aXJvbm1lbnQgPSAocGFyYW1zKSAtPlxuICAgICAgcGFyYW1zID0gY2xvbmVPYmplY3QocGFyYW1zKVxuICAgICAgcGFyYW1zLmNsaXBib2FyZCA9IGNsaXBib2FyZCB1bmxlc3MgcGFyYW1zLmhhc093blByb3BlcnR5KFwiY2xpcGJvYXJkXCIpXG4gICAgICBwYXJhbXMuYmxvYlN0b3JlID0gYmxvYlN0b3JlIHVubGVzcyBwYXJhbXMuaGFzT3duUHJvcGVydHkoXCJibG9iU3RvcmVcIilcbiAgICAgIHBhcmFtcy5vbmx5TG9hZEJhc2VTdHlsZVNoZWV0cyA9IHRydWUgdW5sZXNzIHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShcIm9ubHlMb2FkQmFzZVN0eWxlU2hlZXRzXCIpXG4gICAgICBuZXcgQXRvbUVudmlyb25tZW50KHBhcmFtcylcblxuICAgIHByb21pc2UgPSB0ZXN0UnVubmVyKHtcbiAgICAgIGxvZ0ZpbGUsIGhlYWRsZXNzLCB0ZXN0UGF0aHMsIGJ1aWxkQXRvbUVudmlyb25tZW50LCBidWlsZERlZmF1bHRBcHBsaWNhdGlvbkRlbGVnYXRlLCBsZWdhY3lUZXN0UnVubmVyXG4gICAgfSlcblxuICAgIHByb21pc2UudGhlbiAoc3RhdHVzQ29kZSkgLT5cbiAgICAgIGV4aXRXaXRoU3RhdHVzQ29kZShzdGF0dXNDb2RlKSBpZiBnZXRXaW5kb3dMb2FkU2V0dGluZ3MoKS5oZWFkbGVzc1xuICBjYXRjaCBlcnJvclxuICAgIGlmIGdldFdpbmRvd0xvYWRTZXR0aW5ncygpLmhlYWRsZXNzXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yLnN0YWNrID8gZXJyb3IpXG4gICAgICBleGl0V2l0aFN0YXR1c0NvZGUoMSlcbiAgICBlbHNlXG4gICAgICB0aHJvdyBlcnJvclxuIl19
