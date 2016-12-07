Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _bufferedProcess = require('./buffered-process');

var _bufferedProcess2 = _interopRequireDefault(_bufferedProcess);

// Extended: Like {BufferedProcess}, but accepts a Node script as the command
// to run.
//
// This is necessary on Windows since it doesn't support shebang `#!` lines.
//
// ## Examples
//
// ```js
//   const {BufferedNodeProcess} = require('atom')
// ```

var BufferedNodeProcess = (function (_BufferedProcess) {
  _inherits(BufferedNodeProcess, _BufferedProcess);

  // Public: Runs the given Node script by spawning a new child process.
  //
  // * `options` An {Object} with the following keys:
  //   * `command` The {String} path to the JavaScript script to execute.
  //   * `args` The {Array} of arguments to pass to the script (optional).
  //   * `options` The options {Object} to pass to Node's `ChildProcess.spawn`
  //               method (optional).
  //   * `stdout` The callback {Function} that receives a single argument which
  //              contains the standard output from the command. The callback is
  //              called as data is received but it's buffered to ensure only
  //              complete lines are passed until the source stream closes. After
  //              the source stream has closed all remaining data is sent in a
  //              final call (optional).
  //   * `stderr` The callback {Function} that receives a single argument which
  //              contains the standard error output from the command. The
  //              callback is called as data is received but it's buffered to
  //              ensure only complete lines are passed until the source stream
  //              closes. After the source stream has closed all remaining data
  //              is sent in a final call (optional).
  //   * `exit` The callback {Function} which receives a single argument
  //            containing the exit status (optional).

  function BufferedNodeProcess(_ref) {
    var command = _ref.command;
    var args = _ref.args;
    var _ref$options = _ref.options;
    var options = _ref$options === undefined ? {} : _ref$options;
    var stdout = _ref.stdout;
    var stderr = _ref.stderr;
    var exit = _ref.exit;

    _classCallCheck(this, BufferedNodeProcess);

    options.env = options.env || Object.create(process.env);
    options.env.ELECTRON_RUN_AS_NODE = 1;
    options.env.ELECTRON_NO_ATTACH_CONSOLE = 1;

    args = args ? args.slice() : [];
    args.unshift(command);
    args.unshift('--no-deprecation');

    _get(Object.getPrototypeOf(BufferedNodeProcess.prototype), 'constructor', this).call(this, {
      command: process.execPath,
      args: args,
      options: options,
      stdout: stdout,
      stderr: stderr,
      exit: exit
    });
  }

  return BufferedNodeProcess;
})(_bufferedProcess2['default']);

exports['default'] = BufferedNodeProcess;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvYnVmZmVyZWQtbm9kZS1wcm9jZXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OytCQUU0QixvQkFBb0I7Ozs7Ozs7Ozs7Ozs7OztJQVkzQixtQkFBbUI7WUFBbkIsbUJBQW1COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QjFCLFdBdkJPLG1CQUFtQixDQXVCekIsSUFBbUQsRUFBRTtRQUFwRCxPQUFPLEdBQVIsSUFBbUQsQ0FBbEQsT0FBTztRQUFFLElBQUksR0FBZCxJQUFtRCxDQUF6QyxJQUFJO3VCQUFkLElBQW1ELENBQW5DLE9BQU87UUFBUCxPQUFPLGdDQUFHLEVBQUU7UUFBRSxNQUFNLEdBQXBDLElBQW1ELENBQXJCLE1BQU07UUFBRSxNQUFNLEdBQTVDLElBQW1ELENBQWIsTUFBTTtRQUFFLElBQUksR0FBbEQsSUFBbUQsQ0FBTCxJQUFJOzswQkF2QjVDLG1CQUFtQjs7QUF3QnBDLFdBQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUN2RCxXQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQTtBQUNwQyxXQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixHQUFHLENBQUMsQ0FBQTs7QUFFMUMsUUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFBO0FBQy9CLFFBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDckIsUUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBOztBQUVoQywrQkFoQ2lCLG1CQUFtQiw2Q0FnQzlCO0FBQ0osYUFBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRO0FBQ3pCLFVBQUksRUFBSixJQUFJO0FBQ0osYUFBTyxFQUFQLE9BQU87QUFDUCxZQUFNLEVBQU4sTUFBTTtBQUNOLFlBQU0sRUFBTixNQUFNO0FBQ04sVUFBSSxFQUFKLElBQUk7S0FDTCxFQUFDO0dBQ0g7O1NBeENrQixtQkFBbUI7OztxQkFBbkIsbUJBQW1CIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvYnVmZmVyZWQtbm9kZS1wcm9jZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgQnVmZmVyZWRQcm9jZXNzIGZyb20gJy4vYnVmZmVyZWQtcHJvY2VzcydcblxuLy8gRXh0ZW5kZWQ6IExpa2Uge0J1ZmZlcmVkUHJvY2Vzc30sIGJ1dCBhY2NlcHRzIGEgTm9kZSBzY3JpcHQgYXMgdGhlIGNvbW1hbmRcbi8vIHRvIHJ1bi5cbi8vXG4vLyBUaGlzIGlzIG5lY2Vzc2FyeSBvbiBXaW5kb3dzIHNpbmNlIGl0IGRvZXNuJ3Qgc3VwcG9ydCBzaGViYW5nIGAjIWAgbGluZXMuXG4vL1xuLy8gIyMgRXhhbXBsZXNcbi8vXG4vLyBgYGBqc1xuLy8gICBjb25zdCB7QnVmZmVyZWROb2RlUHJvY2Vzc30gPSByZXF1aXJlKCdhdG9tJylcbi8vIGBgYFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnVmZmVyZWROb2RlUHJvY2VzcyBleHRlbmRzIEJ1ZmZlcmVkUHJvY2VzcyB7XG5cbiAgLy8gUHVibGljOiBSdW5zIHRoZSBnaXZlbiBOb2RlIHNjcmlwdCBieSBzcGF3bmluZyBhIG5ldyBjaGlsZCBwcm9jZXNzLlxuICAvL1xuICAvLyAqIGBvcHRpb25zYCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgLy8gICAqIGBjb21tYW5kYCBUaGUge1N0cmluZ30gcGF0aCB0byB0aGUgSmF2YVNjcmlwdCBzY3JpcHQgdG8gZXhlY3V0ZS5cbiAgLy8gICAqIGBhcmdzYCBUaGUge0FycmF5fSBvZiBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgc2NyaXB0IChvcHRpb25hbCkuXG4gIC8vICAgKiBgb3B0aW9uc2AgVGhlIG9wdGlvbnMge09iamVjdH0gdG8gcGFzcyB0byBOb2RlJ3MgYENoaWxkUHJvY2Vzcy5zcGF3bmBcbiAgLy8gICAgICAgICAgICAgICBtZXRob2QgKG9wdGlvbmFsKS5cbiAgLy8gICAqIGBzdGRvdXRgIFRoZSBjYWxsYmFjayB7RnVuY3Rpb259IHRoYXQgcmVjZWl2ZXMgYSBzaW5nbGUgYXJndW1lbnQgd2hpY2hcbiAgLy8gICAgICAgICAgICAgIGNvbnRhaW5zIHRoZSBzdGFuZGFyZCBvdXRwdXQgZnJvbSB0aGUgY29tbWFuZC4gVGhlIGNhbGxiYWNrIGlzXG4gIC8vICAgICAgICAgICAgICBjYWxsZWQgYXMgZGF0YSBpcyByZWNlaXZlZCBidXQgaXQncyBidWZmZXJlZCB0byBlbnN1cmUgb25seVxuICAvLyAgICAgICAgICAgICAgY29tcGxldGUgbGluZXMgYXJlIHBhc3NlZCB1bnRpbCB0aGUgc291cmNlIHN0cmVhbSBjbG9zZXMuIEFmdGVyXG4gIC8vICAgICAgICAgICAgICB0aGUgc291cmNlIHN0cmVhbSBoYXMgY2xvc2VkIGFsbCByZW1haW5pbmcgZGF0YSBpcyBzZW50IGluIGFcbiAgLy8gICAgICAgICAgICAgIGZpbmFsIGNhbGwgKG9wdGlvbmFsKS5cbiAgLy8gICAqIGBzdGRlcnJgIFRoZSBjYWxsYmFjayB7RnVuY3Rpb259IHRoYXQgcmVjZWl2ZXMgYSBzaW5nbGUgYXJndW1lbnQgd2hpY2hcbiAgLy8gICAgICAgICAgICAgIGNvbnRhaW5zIHRoZSBzdGFuZGFyZCBlcnJvciBvdXRwdXQgZnJvbSB0aGUgY29tbWFuZC4gVGhlXG4gIC8vICAgICAgICAgICAgICBjYWxsYmFjayBpcyBjYWxsZWQgYXMgZGF0YSBpcyByZWNlaXZlZCBidXQgaXQncyBidWZmZXJlZCB0b1xuICAvLyAgICAgICAgICAgICAgZW5zdXJlIG9ubHkgY29tcGxldGUgbGluZXMgYXJlIHBhc3NlZCB1bnRpbCB0aGUgc291cmNlIHN0cmVhbVxuICAvLyAgICAgICAgICAgICAgY2xvc2VzLiBBZnRlciB0aGUgc291cmNlIHN0cmVhbSBoYXMgY2xvc2VkIGFsbCByZW1haW5pbmcgZGF0YVxuICAvLyAgICAgICAgICAgICAgaXMgc2VudCBpbiBhIGZpbmFsIGNhbGwgKG9wdGlvbmFsKS5cbiAgLy8gICAqIGBleGl0YCBUaGUgY2FsbGJhY2sge0Z1bmN0aW9ufSB3aGljaCByZWNlaXZlcyBhIHNpbmdsZSBhcmd1bWVudFxuICAvLyAgICAgICAgICAgIGNvbnRhaW5pbmcgdGhlIGV4aXQgc3RhdHVzIChvcHRpb25hbCkuXG4gIGNvbnN0cnVjdG9yICh7Y29tbWFuZCwgYXJncywgb3B0aW9ucyA9IHt9LCBzdGRvdXQsIHN0ZGVyciwgZXhpdH0pIHtcbiAgICBvcHRpb25zLmVudiA9IG9wdGlvbnMuZW52IHx8IE9iamVjdC5jcmVhdGUocHJvY2Vzcy5lbnYpXG4gICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fUlVOX0FTX05PREUgPSAxXG4gICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fTk9fQVRUQUNIX0NPTlNPTEUgPSAxXG5cbiAgICBhcmdzID0gYXJncyA/IGFyZ3Muc2xpY2UoKSA6IFtdXG4gICAgYXJncy51bnNoaWZ0KGNvbW1hbmQpXG4gICAgYXJncy51bnNoaWZ0KCctLW5vLWRlcHJlY2F0aW9uJylcblxuICAgIHN1cGVyKHtcbiAgICAgIGNvbW1hbmQ6IHByb2Nlc3MuZXhlY1BhdGgsXG4gICAgICBhcmdzLFxuICAgICAgb3B0aW9ucyxcbiAgICAgIHN0ZG91dCxcbiAgICAgIHN0ZGVycixcbiAgICAgIGV4aXRcbiAgICB9KVxuICB9XG59XG4iXX0=