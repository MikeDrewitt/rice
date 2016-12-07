Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/** @babel */

var _electron = require('electron');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ipcHelpers = require('./ipc-helpers');

var _ipcHelpers2 = _interopRequireDefault(_ipcHelpers);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

exports['default'] = _asyncToGenerator(function* () {
  var _require = require('./window-load-settings-helpers');

  var getWindowLoadSettings = _require.getWindowLoadSettings;

  var _getWindowLoadSettings = getWindowLoadSettings();

  var test = _getWindowLoadSettings.test;
  var headless = _getWindowLoadSettings.headless;
  var resourcePath = _getWindowLoadSettings.resourcePath;
  var benchmarkPaths = _getWindowLoadSettings.benchmarkPaths;

  try {
    yield* (function* () {
      var Clipboard = require('../src/clipboard');
      var ApplicationDelegate = require('../src/application-delegate');
      var AtomEnvironment = require('../src/atom-environment');
      var TextEditor = require('../src/text-editor');
      require('./electron-shims');

      var exportsPath = _path2['default'].join(resourcePath, 'exports');
      require('module').globalPaths.push(exportsPath); // Add 'exports' to module search path.
      process.env.NODE_PATH = exportsPath; // Set NODE_PATH env variable since tasks may need it.

      document.title = 'Benchmarks';
      // Allow `document.title` to be assigned in benchmarks without actually changing the window title.
      var documentTitle = null;
      Object.defineProperty(document, 'title', {
        get: function get() {
          return documentTitle;
        },
        set: function set(title) {
          documentTitle = title;
        }
      });

      window.addEventListener('keydown', function (event) {
        // Reload: cmd-r / ctrl-r
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 82) {
          _ipcHelpers2['default'].call('window-method', 'reload');
        }

        // Toggle Dev Tools: cmd-alt-i (Mac) / ctrl-shift-i (Linux/Windows)
        if (event.keyCode === 73) {
          var isDarwin = process.platform === 'darwin';
          if (isDarwin && event.metaKey && event.altKey || !isDarwin && event.ctrlKey && event.shiftKey) {
            _ipcHelpers2['default'].call('window-method', 'toggleDevTools');
          }
        }

        // Close: cmd-w / ctrl-w
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 87) {
          _ipcHelpers2['default'].call('window-method', 'close');
        }

        // Copy: cmd-c / ctrl-c
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 67) {
          _ipcHelpers2['default'].call('window-method', 'copy');
        }
      }, true);

      var clipboard = new Clipboard();
      TextEditor.setClipboard(clipboard);

      var applicationDelegate = new ApplicationDelegate();
      global.atom = new AtomEnvironment({
        applicationDelegate: applicationDelegate,
        window: window,
        document: document,
        clipboard: clipboard,
        configDirPath: process.env.ATOM_HOME,
        enablePersistence: false
      });

      // Prevent benchmarks from modifying application menus
      global.atom.menu.sendToBrowserProcess = function () {};

      if (headless) {
        Object.defineProperties(process, {
          stdout: { value: _electron.remote.process.stdout },
          stderr: { value: _electron.remote.process.stderr }
        });

        console.log = function () {
          var formatted = _util2['default'].format.apply(_util2['default'], arguments);
          process.stdout.write(formatted + '\n');
        };
        console.warn = function () {
          var formatted = _util2['default'].format.apply(_util2['default'], arguments);
          process.stderr.write(formatted + '\n');
        };
        console.error = function () {
          var formatted = _util2['default'].format.apply(_util2['default'], arguments);
          process.stderr.write(formatted + '\n');
        };
      } else {
        _electron.remote.getCurrentWindow().show();
      }

      var benchmarkRunner = require('../benchmarks/benchmark-runner');
      var statusCode = yield benchmarkRunner({ test: test, benchmarkPaths: benchmarkPaths });
      if (headless) {
        exitWithStatusCode(statusCode);
      }
    })();
  } catch (error) {
    if (headless) {
      console.error(error.stack || error);
      exitWithStatusCode(1);
    } else {
      _ipcHelpers2['default'].call('window-method', 'openDevTools');
      throw error;
    }
  }
});

function exitWithStatusCode(statusCode) {
  _electron.remote.app.emit('will-quit');
  _electron.remote.process.exit(statusCode);
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvaW5pdGlhbGl6ZS1iZW5jaG1hcmstd2luZG93LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7d0JBRXFCLFVBQVU7O29CQUNkLE1BQU07Ozs7MEJBQ0EsZUFBZTs7OztvQkFDckIsTUFBTTs7Ozt1Q0FFUixhQUFrQjtpQkFDQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7O01BQWxFLHFCQUFxQixZQUFyQixxQkFBcUI7OytCQUMyQixxQkFBcUIsRUFBRTs7TUFBdkUsSUFBSSwwQkFBSixJQUFJO01BQUUsUUFBUSwwQkFBUixRQUFRO01BQUUsWUFBWSwwQkFBWixZQUFZO01BQUUsY0FBYywwQkFBZCxjQUFjOztBQUNuRCxNQUFJOztBQUNGLFVBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0FBQzdDLFVBQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUE7QUFDbEUsVUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUE7QUFDMUQsVUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFDaEQsYUFBTyxDQUFDLGtCQUFrQixDQUFDLENBQUE7O0FBRTNCLFVBQU0sV0FBVyxHQUFHLGtCQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDdEQsYUFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDL0MsYUFBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFBOztBQUVuQyxjQUFRLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQTs7QUFFN0IsVUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFBO0FBQ3hCLFlBQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxF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QUFHLElBQUksQ0FBQyxDQUFBO1NBQ3ZDLENBQUE7QUFDRCxlQUFPLENBQUMsS0FBSyxHQUFHLFlBQW1CO0FBQ2pDLGNBQU0sU0FBUyxHQUFHLGtCQUFLLE1BQU0sTUFBQSw4QkFBUyxDQUFBO0FBQ3RDLGlCQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUE7U0FDdkMsQ0FBQTtPQUNGLE1BQU07QUFDTCx5QkFBTyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBO09BQ2pDOztBQUVELFVBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO0FBQ2pFLFVBQU0sVUFBVSxHQUFHLE1BQU0sZUFBZSxDQUFDLEVBQUMsSUFBSSxFQUFKLElBQUksRUFBRSxjQUFjLEVBQWQsY0FBYyxFQUFDLENBQUMsQ0FBQTtBQUNoRSxVQUFJLFFBQVEsRUFBRTtBQUNaLDBCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFBO09BQy9COztHQUNGLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDZCxRQUFJLFFBQVEsRUFBRTtBQUNaLGFBQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQTtBQUNuQyx3QkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUN0QixNQUFNO0FBQ0wsOEJBQVcsSUFBSSxDQUFDLGVBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQTtBQUNoRCxZQUFNLEtBQUssQ0FBQTtLQUNaO0dBQ0Y7Q0FDRjs7QUFFRCxTQUFTLGtCQUFrQixDQUFFLFVBQVUsRUFBRTtBQUN2QyxtQkFBTyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQzVCLG1CQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7Q0FDaEMiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9pbml0aWFsaXplLWJlbmNobWFyay13aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7cmVtb3RlfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgaXBjSGVscGVycyBmcm9tICcuL2lwYy1oZWxwZXJzJ1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCdcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKCkge1xuICBjb25zdCB7Z2V0V2luZG93TG9hZFNldHRpbmdzfSA9IHJlcXVpcmUoJy4vd2luZG93LWxvYWQtc2V0dGluZ3MtaGVscGVycycpXG4gIGNvbnN0IHt0ZXN0LCBoZWFkbGVzcywgcmVzb3VyY2VQYXRoLCBiZW5jaG1hcmtQYXRoc30gPSBnZXRXaW5kb3dMb2FkU2V0dGluZ3MoKVxuICB0cnkge1xuICAgIGNvbnN0IENsaXBib2FyZCA9IHJlcXVpcmUoJy4uL3NyYy9jbGlwYm9hcmQnKVxuICAgIGNvbnN0IEFwcGxpY2F0aW9uRGVsZWdhdGUgPSByZXF1aXJlKCcuLi9zcmMvYXBwbGljYXRpb24tZGVsZWdhdGUnKVxuICAgIGNvbnN0IEF0b21FbnZpcm9ubWVudCA9IHJlcXVpcmUoJy4uL3NyYy9hdG9tLWVudmlyb25tZW50JylcbiAgICBjb25zdCBUZXh0RWRpdG9yID0gcmVxdWlyZSgnLi4vc3JjL3RleHQtZWRpdG9yJylcbiAgICByZXF1aXJlKCcuL2VsZWN0cm9uLXNoaW1zJylcblxuICAgIGNvbnN0IGV4cG9ydHNQYXRoID0gcGF0aC5qb2luKHJlc291cmNlUGF0aCwgJ2V4cG9ydHMnKVxuICAgIHJlcXVpcmUoJ21vZHVsZScpLmdsb2JhbFBhdGhzLnB1c2goZXhwb3J0c1BhdGgpIC8vIEFkZCAnZXhwb3J0cycgdG8gbW9kdWxlIHNlYXJjaCBwYXRoLlxuICAgIHByb2Nlc3MuZW52Lk5PREVfUEFUSCA9IGV4cG9ydHNQYXRoIC8vIFNldCBOT0RFX1BBVEggZW52IHZhcmlhYmxlIHNpbmNlIHRhc2tzIG1heSBuZWVkIGl0LlxuXG4gICAgZG9jdW1lbnQudGl0bGUgPSAnQmVuY2htYXJrcydcbiAgICAvLyBBbGxvdyBgZG9jdW1lbnQudGl0bGVgIHRvIGJlIGFzc2lnbmVkIGluIGJlbmNobWFya3Mgd2l0aG91dCBhY3R1YWxseSBjaGFuZ2luZyB0aGUgd2luZG93IHRpdGxlLlxuICAgIGxldCBkb2N1bWVudFRpdGxlID0gbnVsbFxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkb2N1bWVudCwgJ3RpdGxlJywge1xuICAgICAgZ2V0ICgpIHsgcmV0dXJuIGRvY3VtZW50VGl0bGUgfSxcbiAgICAgIHNldCAodGl0bGUpIHsgZG9jdW1lbnRUaXRsZSA9IHRpdGxlIH1cbiAgICB9KVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgIC8vIFJlbG9hZDogY21kLXIgLyBjdHJsLXJcbiAgICAgIGlmICgoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSAmJiBldmVudC5rZXlDb2RlID09PSA4Mikge1xuICAgICAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAncmVsb2FkJylcbiAgICAgIH1cblxuICAgICAgLy8gVG9nZ2xlIERldiBUb29sczogY21kLWFsdC1pIChNYWMpIC8gY3RybC1zaGlmdC1pIChMaW51eC9XaW5kb3dzKVxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDczKSB7XG4gICAgICAgIGNvbnN0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbidcbiAgICAgICAgaWYgKChpc0RhcndpbiAmJiBldmVudC5tZXRhS2V5ICYmIGV2ZW50LmFsdEtleSkgfHwgKCFpc0RhcndpbiAmJiBldmVudC5jdHJsS2V5ICYmIGV2ZW50LnNoaWZ0S2V5KSkge1xuICAgICAgICAgIGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICd0b2dnbGVEZXZUb29scycpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ2xvc2U6IGNtZC13IC8gY3RybC13XG4gICAgICBpZiAoKGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkgJiYgZXZlbnQua2V5Q29kZSA9PT0gODcpIHtcbiAgICAgICAgaXBjSGVscGVycy5jYWxsKCd3aW5kb3ctbWV0aG9kJywgJ2Nsb3NlJylcbiAgICAgIH1cblxuICAgICAgLy8gQ29weTogY21kLWMgLyBjdHJsLWNcbiAgICAgIGlmICgoZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5KSAmJiBldmVudC5rZXlDb2RlID09PSA2Nykge1xuICAgICAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAnY29weScpXG4gICAgICB9XG4gICAgfSwgdHJ1ZSlcblxuICAgIGNvbnN0IGNsaXBib2FyZCA9IG5ldyBDbGlwYm9hcmQoKVxuICAgIFRleHRFZGl0b3Iuc2V0Q2xpcGJvYXJkKGNsaXBib2FyZClcblxuICAgIGNvbnN0IGFwcGxpY2F0aW9uRGVsZWdhdGUgPSBuZXcgQXBwbGljYXRpb25EZWxlZ2F0ZSgpXG4gICAgZ2xvYmFsLmF0b20gPSBuZXcgQXRvbUVudmlyb25tZW50KHtcbiAgICAgIGFwcGxpY2F0aW9uRGVsZWdhdGUsXG4gICAgICB3aW5kb3csXG4gICAgICBkb2N1bWVudCxcbiAgICAgIGNsaXBib2FyZCxcbiAgICAgIGNvbmZpZ0RpclBhdGg6IHByb2Nlc3MuZW52LkFUT01fSE9NRSxcbiAgICAgIGVuYWJsZVBlcnNpc3RlbmNlOiBmYWxzZVxuICAgIH0pXG5cbiAgICAvLyBQcmV2ZW50IGJlbmNobWFya3MgZnJvbSBtb2RpZnlpbmcgYXBwbGljYXRpb24gbWVudXNcbiAgICBnbG9iYWwuYXRvbS5tZW51LnNlbmRUb0Jyb3dzZXJQcm9jZXNzID0gZnVuY3Rpb24gKCkgeyB9XG5cbiAgICBpZiAoaGVhZGxlc3MpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHByb2Nlc3MsIHtcbiAgICAgICAgc3Rkb3V0OiB7IHZhbHVlOiByZW1vdGUucHJvY2Vzcy5zdGRvdXQgfSxcbiAgICAgICAgc3RkZXJyOiB7IHZhbHVlOiByZW1vdGUucHJvY2Vzcy5zdGRlcnIgfVxuICAgICAgfSlcblxuICAgICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBjb25zdCBmb3JtYXR0ZWQgPSB1dGlsLmZvcm1hdCguLi5hcmdzKVxuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShmb3JtYXR0ZWQgKyAnXFxuJylcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybiA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IHV0aWwuZm9ybWF0KC4uLmFyZ3MpXG4gICAgICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKGZvcm1hdHRlZCArICdcXG4nKVxuICAgICAgfVxuICAgICAgY29uc29sZS5lcnJvciA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IGZvcm1hdHRlZCA9IHV0aWwuZm9ybWF0KC4uLmFyZ3MpXG4gICAgICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKGZvcm1hdHRlZCArICdcXG4nKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLnNob3coKVxuICAgIH1cblxuICAgIGNvbnN0IGJlbmNobWFya1J1bm5lciA9IHJlcXVpcmUoJy4uL2JlbmNobWFya3MvYmVuY2htYXJrLXJ1bm5lcicpXG4gICAgY29uc3Qgc3RhdHVzQ29kZSA9IGF3YWl0IGJlbmNobWFya1J1bm5lcih7dGVzdCwgYmVuY2htYXJrUGF0aHN9KVxuICAgIGlmIChoZWFkbGVzcykge1xuICAgICAgZXhpdFdpdGhTdGF0dXNDb2RlKHN0YXR1c0NvZGUpXG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChoZWFkbGVzcykge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvci5zdGFjayB8fCBlcnJvcilcbiAgICAgIGV4aXRXaXRoU3RhdHVzQ29kZSgxKVxuICAgIH0gZWxzZSB7XG4gICAgICBpcGNIZWxwZXJzLmNhbGwoJ3dpbmRvdy1tZXRob2QnLCAnb3BlbkRldlRvb2xzJylcbiAgICAgIHRocm93IGVycm9yXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4aXRXaXRoU3RhdHVzQ29kZSAoc3RhdHVzQ29kZSkge1xuICByZW1vdGUuYXBwLmVtaXQoJ3dpbGwtcXVpdCcpXG4gIHJlbW90ZS5wcm9jZXNzLmV4aXQoc3RhdHVzQ29kZSlcbn1cbiJdfQ==