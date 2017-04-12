Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _textBuffer = require('text-buffer');

var _textBuffer2 = _interopRequireDefault(_textBuffer);

var _pathwatcher = require('pathwatcher');

var _eventKit = require('event-kit');

var _srcBufferedNodeProcess = require('../src/buffered-node-process');

var _srcBufferedNodeProcess2 = _interopRequireDefault(_srcBufferedNodeProcess);

var _srcBufferedProcess = require('../src/buffered-process');

var _srcBufferedProcess2 = _interopRequireDefault(_srcBufferedProcess);

var _srcGitRepository = require('../src/git-repository');

var _srcGitRepository2 = _interopRequireDefault(_srcGitRepository);

var _srcNotification = require('../src/notification');

var _srcNotification2 = _interopRequireDefault(_srcNotification);

var atomExport = {
  BufferedNodeProcess: _srcBufferedNodeProcess2['default'],
  BufferedProcess: _srcBufferedProcess2['default'],
  GitRepository: _srcGitRepository2['default'],
  Notification: _srcNotification2['default'],
  TextBuffer: _textBuffer2['default'],
  Point: _textBuffer.Point,
  Range: _textBuffer.Range,
  File: _pathwatcher.File,
  Directory: _pathwatcher.Directory,
  Emitter: _eventKit.Emitter,
  Disposable: _eventKit.Disposable,
  CompositeDisposable: _eventKit.CompositeDisposable
};

// Shell integration is required by both Squirrel and Settings-View
if (process.platform === 'win32') {
  Object.defineProperty(atomExport, 'WinShell', {
    enumerable: true,
    get: function get() {
      return require('../src/main-process/win-shell');
    }
  });
}

// The following classes can't be used from a Task handler and should therefore
// only be exported when not running as a child node process
if (process.type === 'renderer') {
  atomExport.Task = require('../src/task');
  atomExport.TextEditor = require('../src/text-editor');
}

exports['default'] = atomExport;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9leHBvcnRzL2F0b20uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7MEJBRXVDLGFBQWE7Ozs7MkJBQ3RCLGFBQWE7O3dCQUNZLFdBQVc7O3NDQUNsQyw4QkFBOEI7Ozs7a0NBQ2xDLHlCQUF5Qjs7OztnQ0FDM0IsdUJBQXVCOzs7OytCQUN4QixxQkFBcUI7Ozs7QUFFOUMsSUFBTSxVQUFVLEdBQUc7QUFDakIscUJBQW1CLHFDQUFBO0FBQ25CLGlCQUFlLGlDQUFBO0FBQ2YsZUFBYSwrQkFBQTtBQUNiLGNBQVksOEJBQUE7QUFDWixZQUFVLHlCQUFBO0FBQ1YsT0FBSyxtQkFBQTtBQUNMLE9BQUssbUJBQUE7QUFDTCxNQUFJLG1CQUFBO0FBQ0osV0FBUyx3QkFBQTtBQUNULFNBQU8sbUJBQUE7QUFDUCxZQUFVLHNCQUFBO0FBQ1YscUJBQW1CLCtCQUFBO0NBQ3BCLENBQUE7OztBQUdELElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7QUFDaEMsUUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFO0FBQzVDLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLE9BQUcsRUFBQyxlQUFHO0FBQ0wsYUFBTyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQTtLQUNoRDtHQUNGLENBQUMsQ0FBQTtDQUNIOzs7O0FBSUQsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtBQUMvQixZQUFVLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUN4QyxZQUFVLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0NBQ3REOztxQkFFYyxVQUFVIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9leHBvcnRzL2F0b20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBUZXh0QnVmZmVyLCB7UG9pbnQsIFJhbmdlfSBmcm9tICd0ZXh0LWJ1ZmZlcidcbmltcG9ydCB7RmlsZSwgRGlyZWN0b3J5fSBmcm9tICdwYXRod2F0Y2hlcidcbmltcG9ydCB7RW1pdHRlciwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnZXZlbnQta2l0J1xuaW1wb3J0IEJ1ZmZlcmVkTm9kZVByb2Nlc3MgZnJvbSAnLi4vc3JjL2J1ZmZlcmVkLW5vZGUtcHJvY2VzcydcbmltcG9ydCBCdWZmZXJlZFByb2Nlc3MgZnJvbSAnLi4vc3JjL2J1ZmZlcmVkLXByb2Nlc3MnXG5pbXBvcnQgR2l0UmVwb3NpdG9yeSBmcm9tICcuLi9zcmMvZ2l0LXJlcG9zaXRvcnknXG5pbXBvcnQgTm90aWZpY2F0aW9uIGZyb20gJy4uL3NyYy9ub3RpZmljYXRpb24nXG5cbmNvbnN0IGF0b21FeHBvcnQgPSB7XG4gIEJ1ZmZlcmVkTm9kZVByb2Nlc3MsXG4gIEJ1ZmZlcmVkUHJvY2VzcyxcbiAgR2l0UmVwb3NpdG9yeSxcbiAgTm90aWZpY2F0aW9uLFxuICBUZXh0QnVmZmVyLFxuICBQb2ludCxcbiAgUmFuZ2UsXG4gIEZpbGUsXG4gIERpcmVjdG9yeSxcbiAgRW1pdHRlcixcbiAgRGlzcG9zYWJsZSxcbiAgQ29tcG9zaXRlRGlzcG9zYWJsZVxufVxuXG4vLyBTaGVsbCBpbnRlZ3JhdGlvbiBpcyByZXF1aXJlZCBieSBib3RoIFNxdWlycmVsIGFuZCBTZXR0aW5ncy1WaWV3XG5pZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYXRvbUV4cG9ydCwgJ1dpblNoZWxsJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0ICgpIHtcbiAgICAgIHJldHVybiByZXF1aXJlKCcuLi9zcmMvbWFpbi1wcm9jZXNzL3dpbi1zaGVsbCcpXG4gICAgfVxuICB9KVxufVxuXG4vLyBUaGUgZm9sbG93aW5nIGNsYXNzZXMgY2FuJ3QgYmUgdXNlZCBmcm9tIGEgVGFzayBoYW5kbGVyIGFuZCBzaG91bGQgdGhlcmVmb3JlXG4vLyBvbmx5IGJlIGV4cG9ydGVkIHdoZW4gbm90IHJ1bm5pbmcgYXMgYSBjaGlsZCBub2RlIHByb2Nlc3NcbmlmIChwcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicpIHtcbiAgYXRvbUV4cG9ydC5UYXNrID0gcmVxdWlyZSgnLi4vc3JjL3Rhc2snKVxuICBhdG9tRXhwb3J0LlRleHRFZGl0b3IgPSByZXF1aXJlKCcuLi9zcmMvdGV4dC1lZGl0b3InKVxufVxuXG5leHBvcnQgZGVmYXVsdCBhdG9tRXhwb3J0XG4iXX0=