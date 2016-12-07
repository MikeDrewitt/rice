Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _underscorePlus = require('underscore-plus');

var _underscorePlus2 = _interopRequireDefault(_underscorePlus);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _eventKit = require('event-kit');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

// Extended: A wrapper which provides standard error/output line buffering for
// Node's ChildProcess.
//
// ## Examples
//
// ```js
// {BufferedProcess} = require('atom')
//
// const command = 'ps'
// const args = ['-ef']
// const stdout = (output) => console.log(output)
// const exit = (code) => console.log("ps -ef exited with #{code}")
// const process = new BufferedProcess({command, args, stdout, exit})
// ```

var BufferedProcess = (function () {
  /*
  Section: Construction
  */

  // Public: Runs the given command by spawning a new child process.
  //
  // * `options` An {Object} with the following keys:
  //   * `command` The {String} command to execute.
  //   * `args` The {Array} of arguments to pass to the command (optional).
  //   * `options` {Object} (optional) The options {Object} to pass to Node's
  //     `ChildProcess.spawn` method.
  //   * `stdout` {Function} (optional) The callback that receives a single
  //     argument which contains the standard output from the command. The
  //     callback is called as data is received but it's buffered to ensure only
  //     complete lines are passed until the source stream closes. After the
  //     source stream has closed all remaining data is sent in a final call.
  //     * `data` {String}
  //   * `stderr` {Function} (optional) The callback that receives a single
  //     argument which contains the standard error output from the command. The
  //     callback is called as data is received but it's buffered to ensure only
  //     complete lines are passed until the source stream closes. After the
  //     source stream has closed all remaining data is sent in a final call.
  //     * `data` {String}
  //   * `exit` {Function} (optional) The callback which receives a single
  //     argument containing the exit status.
  //     * `code` {Number}

  function BufferedProcess() {
    var _this = this;

    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var command = _ref.command;
    var args = _ref.args;
    var _ref$options = _ref.options;
    var options = _ref$options === undefined ? {} : _ref$options;
    var stdout = _ref.stdout;
    var stderr = _ref.stderr;
    var exit = _ref.exit;

    _classCallCheck(this, BufferedProcess);

    this.emitter = new _eventKit.Emitter();
    this.command = command;
    // Related to joyent/node#2318
    if (process.platform === 'win32' && !options.shell) {
      var cmdArgs = [];

      // Quote all arguments and escapes inner quotes
      if (args) {
        cmdArgs = args.filter(function (arg) {
          return arg != null;
        }).map(function (arg) {
          if (_this.isExplorerCommand(command) && /^\/[a-zA-Z]+,.*$/.test(arg)) {
            // Don't wrap /root,C:\folder style arguments to explorer calls in
            // quotes since they will not be interpreted correctly if they are
            return arg;
          } else {
            return '"' + arg.toString().replace(/"/g, '\\"') + '"';
          }
        });
      }

      if (/\s/.test(command)) {
        cmdArgs.unshift('"' + command + '"');
      } else {
        cmdArgs.unshift(command);
      }

      cmdArgs = ['/s', '/d', '/c', '"' + cmdArgs.join(' ') + '"'];
      var cmdOptions = _underscorePlus2['default'].clone(options);
      cmdOptions.windowsVerbatimArguments = true;
      this.spawn(this.getCmdPath(), cmdArgs, cmdOptions);
    } else {
      this.spawn(command, args, options);
    }

    this.killed = false;
    this.handleEvents(stdout, stderr, exit);
  }

  /*
  Section: Event Subscription
  */

  // Public: Will call your callback when an error will be raised by the process.
  // Usually this is due to the command not being available or not on the PATH.
  // You can call `handle()` on the object passed to your callback to indicate
  // that you have handled this error.
  //
  // * `callback` {Function} callback
  //   * `errorObject` {Object}
  //     * `error` {Object} the error object
  //     * `handle` {Function} call this to indicate you have handled the error.
  //       The error will not be thrown if this function is called.
  //
  // Returns a {Disposable}

  _createClass(BufferedProcess, [{
    key: 'onWillThrowError',
    value: function onWillThrowError(callback) {
      return this.emitter.on('will-throw-error', callback);
    }

    /*
    Section: Helper Methods
    */

    // Helper method to pass data line by line.
    //
    // * `stream` The Stream to read from.
    // * `onLines` The callback to call with each line of data.
    // * `onDone` The callback to call when the stream has closed.
  }, {
    key: 'bufferStream',
    value: function bufferStream(stream, onLines, onDone) {
      var _this2 = this;

      stream.setEncoding('utf8');
      var buffered = '';

      stream.on('data', function (data) {
        if (_this2.killed) return;

        var bufferedLength = buffered.length;
        buffered += data;
        var lastNewlineIndex = data.lastIndexOf('\n');

        if (lastNewlineIndex !== -1) {
          var lineLength = lastNewlineIndex + bufferedLength + 1;
          onLines(buffered.substring(0, lineLength));
          buffered = buffered.substring(lineLength);
        }
      });

      stream.on('close', function () {
        if (_this2.killed) return;
        if (buffered.length > 0) onLines(buffered);
        onDone();
      });
    }

    // Kill all child processes of the spawned cmd.exe process on Windows.
    //
    // This is required since killing the cmd.exe does not terminate child
    // processes.
  }, {
    key: 'killOnWindows',
    value: function killOnWindows() {
      var _this3 = this;

      if (!this.process) return;

      var parentPid = this.process.pid;
      var cmd = 'wmic';
      var args = ['process', 'where', '(ParentProcessId=' + parentPid + ')', 'get', 'processid'];

      var wmicProcess = undefined;

      try {
        wmicProcess = _child_process2['default'].spawn(cmd, args);
      } catch (spawnError) {
        this.killProcess();
        return;
      }

      wmicProcess.on('error', function () {}); // ignore errors

      var output = '';
      wmicProcess.stdout.on('data', function (data) {
        output += data;
      });
      wmicProcess.stdout.on('close', function () {
        var pidsToKill = output.split(/\s+/).filter(function (pid) {
          return (/^\d+$/.test(pid)
          );
        }).map(function (pid) {
          return parseInt(pid);
        }).filter(function (pid) {
          return pid !== parentPid && pid > 0 && pid < Infinity;
        });

        for (var pid of pidsToKill) {
          try {
            process.kill(pid);
          } catch (error) {}
        }

        _this3.killProcess();
      });
    }
  }, {
    key: 'killProcess',
    value: function killProcess() {
      if (this.process) this.process.kill();
      this.process = null;
    }
  }, {
    key: 'isExplorerCommand',
    value: function isExplorerCommand(command) {
      if (command === 'explorer.exe' || command === 'explorer') {
        return true;
      } else if (process.env.SystemRoot) {
        return command === _path2['default'].join(process.env.SystemRoot, 'explorer.exe') || command === _path2['default'].join(process.env.SystemRoot, 'explorer');
      } else {
        return false;
      }
    }
  }, {
    key: 'getCmdPath',
    value: function getCmdPath() {
      if (process.env.comspec) {
        return process.env.comspec;
      } else if (process.env.SystemRoot) {
        return _path2['default'].join(process.env.SystemRoot, 'System32', 'cmd.exe');
      } else {
        return 'cmd.exe';
      }
    }

    // Public: Terminate the process.
  }, {
    key: 'kill',
    value: function kill() {
      if (this.killed) return;

      this.killed = true;
      if (process.platform === 'win32') {
        this.killOnWindows();
      } else {
        this.killProcess();
      }
    }
  }, {
    key: 'spawn',
    value: function spawn(command, args, options) {
      var _this4 = this;

      try {
        this.process = _child_process2['default'].spawn(command, args, options);
      } catch (spawnError) {
        process.nextTick(function () {
          return _this4.handleError(spawnError);
        });
      }
    }
  }, {
    key: 'handleEvents',
    value: function handleEvents(stdout, stderr, exit) {
      var _this5 = this;

      if (!this.process) return;

      var triggerExitCallback = function triggerExitCallback() {
        if (_this5.killed) return;
        if (stdoutClosed && stderrClosed && processExited && typeof exit === 'function') {
          exit(exitCode);
        }
      };

      var stdoutClosed = true;
      var stderrClosed = true;
      var processExited = true;
      var exitCode = 0;

      if (stdout) {
        stdoutClosed = false;
        this.bufferStream(this.process.stdout, stdout, function () {
          stdoutClosed = true;
          triggerExitCallback();
        });
      }

      if (stderr) {
        stderrClosed = false;
        this.bufferStream(this.process.stderr, stderr, function () {
          stderrClosed = true;
          triggerExitCallback();
        });
      }

      if (exit) {
        processExited = false;
        this.process.on('exit', function (code) {
          exitCode = code;
          processExited = true;
          triggerExitCallback();
        });
      }

      this.process.on('error', function (error) {
        _this5.handleError(error);
      });
    }
  }, {
    key: 'handleError',
    value: function handleError(error) {
      var handled = false;

      var handle = function handle() {
        handled = true;
      };

      this.emitter.emit('will-throw-error', { error: error, handle: handle });

      if (error.code === 'ENOENT' && error.syscall.indexOf('spawn') === 0) {
        error = new Error('Failed to spawn command `' + this.command + '`. Make sure `' + this.command + '` is installed and on your PATH', error.path);
        error.name = 'BufferedProcessError';
      }

      if (!handled) throw error;
    }
  }]);

  return BufferedProcess;
})();

exports['default'] = BufferedProcess;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL3NyYy9idWZmZXJlZC1wcm9jZXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs4QkFFYyxpQkFBaUI7Ozs7NkJBQ04sZUFBZTs7Ozt3QkFDbEIsV0FBVzs7b0JBQ2hCLE1BQU07Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQkYsZUFBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCdEIsV0EzQk8sZUFBZSxHQTJCcUM7OztxRUFBSixFQUFFOztRQUF2RCxPQUFPLFFBQVAsT0FBTztRQUFFLElBQUksUUFBSixJQUFJOzRCQUFFLE9BQU87UUFBUCxPQUFPLGdDQUFHLEVBQUU7UUFBRSxNQUFNLFFBQU4sTUFBTTtRQUFFLE1BQU0sUUFBTixNQUFNO1FBQUUsSUFBSSxRQUFKLElBQUk7OzBCQTNCNUMsZUFBZTs7QUE0QmhDLFFBQUksQ0FBQyxPQUFPLEdBQUcsdUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTs7QUFFdEIsUUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDbEQsVUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFBOzs7QUFHaEIsVUFBSSxJQUFJLEVBQUU7QUFDUixlQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFDLEdBQUc7aUJBQUssR0FBRyxJQUFJLElBQUk7U0FBQSxDQUFDLENBQ3hDLEdBQUcsQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUNaLGNBQUksTUFBSyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7OztBQUduRSxtQkFBTyxHQUFHLENBQUE7V0FDWCxNQUFNO0FBQ0wseUJBQVksR0FBRyxDQUFDLFFBQVEs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LENBQUE7S0FDMUI7OztTQWpSa0IsZUFBZTs7O3FCQUFmLGVBQWUiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL2J1ZmZlcmVkLXByb2Nlc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUtcGx1cydcbmltcG9ydCBDaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2VzcydcbmltcG9ydCB7RW1pdHRlcn0gZnJvbSAnZXZlbnQta2l0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuLy8gRXh0ZW5kZWQ6IEEgd3JhcHBlciB3aGljaCBwcm92aWRlcyBzdGFuZGFyZCBlcnJvci9vdXRwdXQgbGluZSBidWZmZXJpbmcgZm9yXG4vLyBOb2RlJ3MgQ2hpbGRQcm9jZXNzLlxuLy9cbi8vICMjIEV4YW1wbGVzXG4vL1xuLy8gYGBganNcbi8vIHtCdWZmZXJlZFByb2Nlc3N9ID0gcmVxdWlyZSgnYXRvbScpXG4vL1xuLy8gY29uc3QgY29tbWFuZCA9ICdwcydcbi8vIGNvbnN0IGFyZ3MgPSBbJy1lZiddXG4vLyBjb25zdCBzdGRvdXQgPSAob3V0cHV0KSA9PiBjb25zb2xlLmxvZyhvdXRwdXQpXG4vLyBjb25zdCBleGl0ID0gKGNvZGUpID0+IGNvbnNvbGUubG9nKFwicHMgLWVmIGV4aXRlZCB3aXRoICN7Y29kZX1cIilcbi8vIGNvbnN0IHByb2Nlc3MgPSBuZXcgQnVmZmVyZWRQcm9jZXNzKHtjb21tYW5kLCBhcmdzLCBzdGRvdXQsIGV4aXR9KVxuLy8gYGBgXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWZmZXJlZFByb2Nlc3Mge1xuICAvKlxuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb25cbiAgKi9cblxuICAvLyBQdWJsaWM6IFJ1bnMgdGhlIGdpdmVuIGNvbW1hbmQgYnkgc3Bhd25pbmcgYSBuZXcgY2hpbGQgcHJvY2Vzcy5cbiAgLy9cbiAgLy8gKiBgb3B0aW9uc2AgQW4ge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gIC8vICAgKiBgY29tbWFuZGAgVGhlIHtTdHJpbmd9IGNvbW1hbmQgdG8gZXhlY3V0ZS5cbiAgLy8gICAqIGBhcmdzYCBUaGUge0FycmF5fSBvZiBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgY29tbWFuZCAob3B0aW9uYWwpLlxuICAvLyAgICogYG9wdGlvbnNgIHtPYmplY3R9IChvcHRpb25hbCkgVGhlIG9wdGlvbnMge09iamVjdH0gdG8gcGFzcyB0byBOb2RlJ3NcbiAgLy8gICAgIGBDaGlsZFByb2Nlc3Muc3Bhd25gIG1ldGhvZC5cbiAgLy8gICAqIGBzdGRvdXRgIHtGdW5jdGlvbn0gKG9wdGlvbmFsKSBUaGUgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyBhIHNpbmdsZVxuICAvLyAgICAgYXJndW1lbnQgd2hpY2ggY29udGFpbnMgdGhlIHN0YW5kYXJkIG91dHB1dCBmcm9tIHRoZSBjb21tYW5kLiBUaGVcbiAgLy8gICAgIGNhbGxiYWNrIGlzIGNhbGxlZCBhcyBkYXRhIGlzIHJlY2VpdmVkIGJ1dCBpdCdzIGJ1ZmZlcmVkIHRvIGVuc3VyZSBvbmx5XG4gIC8vICAgICBjb21wbGV0ZSBsaW5lcyBhcmUgcGFzc2VkIHVudGlsIHRoZSBzb3VyY2Ugc3RyZWFtIGNsb3Nlcy4gQWZ0ZXIgdGhlXG4gIC8vICAgICBzb3VyY2Ugc3RyZWFtIGhhcyBjbG9zZWQgYWxsIHJlbWFpbmluZyBkYXRhIGlzIHNlbnQgaW4gYSBmaW5hbCBjYWxsLlxuICAvLyAgICAgKiBgZGF0YWAge1N0cmluZ31cbiAgLy8gICAqIGBzdGRlcnJgIHtGdW5jdGlvbn0gKG9wdGlvbmFsKSBUaGUgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyBhIHNpbmdsZVxuICAvLyAgICAgYXJndW1lbnQgd2hpY2ggY29udGFpbnMgdGhlIHN0YW5kYXJkIGVycm9yIG91dHB1dCBmcm9tIHRoZSBjb21tYW5kLiBUaGVcbiAgLy8gICAgIGNhbGxiYWNrIGlzIGNhbGxlZCBhcyBkYXRhIGlzIHJlY2VpdmVkIGJ1dCBpdCdzIGJ1ZmZlcmVkIHRvIGVuc3VyZSBvbmx5XG4gIC8vICAgICBjb21wbGV0ZSBsaW5lcyBhcmUgcGFzc2VkIHVudGlsIHRoZSBzb3VyY2Ugc3RyZWFtIGNsb3Nlcy4gQWZ0ZXIgdGhlXG4gIC8vICAgICBzb3VyY2Ugc3RyZWFtIGhhcyBjbG9zZWQgYWxsIHJlbWFpbmluZyBkYXRhIGlzIHNlbnQgaW4gYSBmaW5hbCBjYWxsLlxuICAvLyAgICAgKiBgZGF0YWAge1N0cmluZ31cbiAgLy8gICAqIGBleGl0YCB7RnVuY3Rpb259IChvcHRpb25hbCkgVGhlIGNhbGxiYWNrIHdoaWNoIHJlY2VpdmVzIGEgc2luZ2xlXG4gIC8vICAgICBhcmd1bWVudCBjb250YWluaW5nIHRoZSBleGl0IHN0YXR1cy5cbiAgLy8gICAgICogYGNvZGVgIHtOdW1iZXJ9XG4gIGNvbnN0cnVjdG9yICh7Y29tbWFuZCwgYXJncywgb3B0aW9ucyA9IHt9LCBzdGRvdXQsIHN0ZGVyciwgZXhpdH0gPSB7fSkge1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgLy8gUmVsYXRlZCB0byBqb3llbnQvbm9kZSMyMzE4XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgJiYgIW9wdGlvbnMuc2hlbGwpIHtcbiAgICAgIGxldCBjbWRBcmdzID0gW11cblxuICAgICAgLy8gUXVvdGUgYWxsIGFyZ3VtZW50cyBhbmQgZXNjYXBlcyBpbm5lciBxdW90ZXNcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGNtZEFyZ3MgPSBhcmdzLmZpbHRlcigoYXJnKSA9PiBhcmcgIT0gbnVsbClcbiAgICAgICAgICAubWFwKChhcmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRXhwbG9yZXJDb21tYW5kKGNvbW1hbmQpICYmIC9eXFwvW2EtekEtWl0rLC4qJC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICAgIC8vIERvbid0IHdyYXAgL3Jvb3QsQzpcXGZvbGRlciBzdHlsZSBhcmd1bWVudHMgdG8gZXhwbG9yZXIgY2FsbHMgaW5cbiAgICAgICAgICAgICAgLy8gcXVvdGVzIHNpbmNlIHRoZXkgd2lsbCBub3QgYmUgaW50ZXJwcmV0ZWQgY29ycmVjdGx5IGlmIHRoZXkgYXJlXG4gICAgICAgICAgICAgIHJldHVybiBhcmdcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBgXFxcIiR7YXJnLnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVxcXCJgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaWYgKC9cXHMvLnRlc3QoY29tbWFuZCkpIHtcbiAgICAgICAgY21kQXJncy51bnNoaWZ0KGBcXFwiJHtjb21tYW5kfVxcXCJgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY21kQXJncy51bnNoaWZ0KGNvbW1hbmQpXG4gICAgICB9XG5cbiAgICAgIGNtZEFyZ3MgPSBbJy9zJywgJy9kJywgJy9jJywgYFxcXCIke2NtZEFyZ3Muam9pbignICcpfVxcXCJgXVxuICAgICAgY29uc3QgY21kT3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucylcbiAgICAgIGNtZE9wdGlvbnMud2luZG93c1ZlcmJhdGltQXJndW1lbnRzID0gdHJ1ZVxuICAgICAgdGhpcy5zcGF3bih0aGlzLmdldENtZFBhdGgoKSwgY21kQXJncywgY21kT3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zcGF3bihjb21tYW5kLCBhcmdzLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHRoaXMua2lsbGVkID0gZmFsc2VcbiAgICB0aGlzLmhhbmRsZUV2ZW50cyhzdGRvdXQsIHN0ZGVyciwgZXhpdClcbiAgfVxuXG4gIC8qXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAqL1xuXG4gIC8vIFB1YmxpYzogV2lsbCBjYWxsIHlvdXIgY2FsbGJhY2sgd2hlbiBhbiBlcnJvciB3aWxsIGJlIHJhaXNlZCBieSB0aGUgcHJvY2Vzcy5cbiAgLy8gVXN1YWxseSB0aGlzIGlzIGR1ZSB0byB0aGUgY29tbWFuZCBub3QgYmVpbmcgYXZhaWxhYmxlIG9yIG5vdCBvbiB0aGUgUEFUSC5cbiAgLy8gWW91IGNhbiBjYWxsIGBoYW5kbGUoKWAgb24gdGhlIG9iamVjdCBwYXNzZWQgdG8geW91ciBjYWxsYmFjayB0byBpbmRpY2F0ZVxuICAvLyB0aGF0IHlvdSBoYXZlIGhhbmRsZWQgdGhpcyBlcnJvci5cbiAgLy9cbiAgLy8gKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgLy8gICAqIGBlcnJvck9iamVjdGAge09iamVjdH1cbiAgLy8gICAgICogYGVycm9yYCB7T2JqZWN0fSB0aGUgZXJyb3Igb2JqZWN0XG4gIC8vICAgICAqIGBoYW5kbGVgIHtGdW5jdGlvbn0gY2FsbCB0aGlzIHRvIGluZGljYXRlIHlvdSBoYXZlIGhhbmRsZWQgdGhlIGVycm9yLlxuICAvLyAgICAgICBUaGUgZXJyb3Igd2lsbCBub3QgYmUgdGhyb3duIGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9XG4gIG9uV2lsbFRocm93RXJyb3IgKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignd2lsbC10aHJvdy1lcnJvcicsIGNhbGxiYWNrKVxuICB9XG5cbiAgLypcbiAgU2VjdGlvbjogSGVscGVyIE1ldGhvZHNcbiAgKi9cblxuICAvLyBIZWxwZXIgbWV0aG9kIHRvIHBhc3MgZGF0YSBsaW5lIGJ5IGxpbmUuXG4gIC8vXG4gIC8vICogYHN0cmVhbWAgVGhlIFN0cmVhbSB0byByZWFkIGZyb20uXG4gIC8vICogYG9uTGluZXNgIFRoZSBjYWxsYmFjayB0byBjYWxsIHdpdGggZWFjaCBsaW5lIG9mIGRhdGEuXG4gIC8vICogYG9uRG9uZWAgVGhlIGNhbGxiYWNrIHRvIGNhbGwgd2hlbiB0aGUgc3RyZWFtIGhhcyBjbG9zZWQuXG4gIGJ1ZmZlclN0cmVhbSAoc3RyZWFtLCBvbkxpbmVzLCBvbkRvbmUpIHtcbiAgICBzdHJlYW0uc2V0RW5jb2RpbmcoJ3V0ZjgnKVxuICAgIGxldCBidWZmZXJlZCA9ICcnXG5cbiAgICBzdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgaWYgKHRoaXMua2lsbGVkKSByZXR1cm5cblxuICAgICAgbGV0IGJ1ZmZlcmVkTGVuZ3RoID0gYnVmZmVyZWQubGVuZ3RoXG4gICAgICBidWZmZXJlZCArPSBkYXRhXG4gICAgICBsZXQgbGFzdE5ld2xpbmVJbmRleCA9IGRhdGEubGFzdEluZGV4T2YoJ1xcbicpXG5cbiAgICAgIGlmIChsYXN0TmV3bGluZUluZGV4ICE9PSAtMSkge1xuICAgICAgICBsZXQgbGluZUxlbmd0aCA9IGxhc3ROZXdsaW5lSW5kZXggKyBidWZmZXJlZExlbmd0aCArIDFcbiAgICAgICAgb25MaW5lcyhidWZmZXJlZC5zdWJzdHJpbmcoMCwgbGluZUxlbmd0aCkpXG4gICAgICAgIGJ1ZmZlcmVkID0gYnVmZmVyZWQuc3Vic3RyaW5nKGxpbmVMZW5ndGgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHN0cmVhbS5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5raWxsZWQpIHJldHVyblxuICAgICAgaWYgKGJ1ZmZlcmVkLmxlbmd0aCA+IDApIG9uTGluZXMoYnVmZmVyZWQpXG4gICAgICBvbkRvbmUoKVxuICAgIH0pXG4gIH1cblxuICAvLyBLaWxsIGFsbCBjaGlsZCBwcm9jZXNzZXMgb2YgdGhlIHNwYXduZWQgY21kLmV4ZSBwcm9jZXNzIG9uIFdpbmRvd3MuXG4gIC8vXG4gIC8vIFRoaXMgaXMgcmVxdWlyZWQgc2luY2Uga2lsbGluZyB0aGUgY21kLmV4ZSBkb2VzIG5vdCB0ZXJtaW5hdGUgY2hpbGRcbiAgLy8gcHJvY2Vzc2VzLlxuICBraWxsT25XaW5kb3dzICgpIHtcbiAgICBpZiAoIXRoaXMucHJvY2VzcykgcmV0dXJuXG5cbiAgICBjb25zdCBwYXJlbnRQaWQgPSB0aGlzLnByb2Nlc3MucGlkXG4gICAgY29uc3QgY21kID0gJ3dtaWMnXG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgICdwcm9jZXNzJyxcbiAgICAgICd3aGVyZScsXG4gICAgICBgKFBhcmVudFByb2Nlc3NJZD0ke3BhcmVudFBpZH0pYCxcbiAgICAgICdnZXQnLFxuICAgICAgJ3Byb2Nlc3NpZCdcbiAgICBdXG5cbiAgICBsZXQgd21pY1Byb2Nlc3NcblxuICAgIHRyeSB7XG4gICAgICB3bWljUHJvY2VzcyA9IENoaWxkUHJvY2Vzcy5zcGF3bihjbWQsIGFyZ3MpXG4gICAgfSBjYXRjaCAoc3Bhd25FcnJvcikge1xuICAgICAgdGhpcy5raWxsUHJvY2VzcygpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB3bWljUHJvY2Vzcy5vbignZXJyb3InLCAoKSA9PiB7fSkgLy8gaWdub3JlIGVycm9yc1xuXG4gICAgbGV0IG91dHB1dCA9ICcnXG4gICAgd21pY1Byb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgIG91dHB1dCArPSBkYXRhXG4gICAgfSlcbiAgICB3bWljUHJvY2Vzcy5zdGRvdXQub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgY29uc3QgcGlkc1RvS2lsbCA9IG91dHB1dC5zcGxpdCgvXFxzKy8pXG4gICAgICAgIC5maWx0ZXIoKHBpZCkgPT4gL15cXGQrJC8udGVzdChwaWQpKVxuICAgICAgICAubWFwKChwaWQpID0+IHBhcnNlSW50KHBpZCkpXG4gICAgICAgIC5maWx0ZXIoKHBpZCkgPT4gcGlkICE9PSBwYXJlbnRQaWQgJiYgcGlkID4gMCAmJiBwaWQgPCBJbmZpbml0eSlcblxuICAgICAgZm9yIChsZXQgcGlkIG9mIHBpZHNUb0tpbGwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwcm9jZXNzLmtpbGwocGlkKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge31cbiAgICAgIH1cblxuICAgICAgdGhpcy5raWxsUHJvY2VzcygpXG4gICAgfSlcbiAgfVxuXG4gIGtpbGxQcm9jZXNzICgpIHtcbiAgICBpZiAodGhpcy5wcm9jZXNzKSB0aGlzLnByb2Nlc3Mua2lsbCgpXG4gICAgdGhpcy5wcm9jZXNzID0gbnVsbFxuICB9XG5cbiAgaXNFeHBsb3JlckNvbW1hbmQgKGNvbW1hbmQpIHtcbiAgICBpZiAoY29tbWFuZCA9PT0gJ2V4cGxvcmVyLmV4ZScgfHwgY29tbWFuZCA9PT0gJ2V4cGxvcmVyJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52LlN5c3RlbVJvb3QpIHtcbiAgICAgIHJldHVybiBjb21tYW5kID09PSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuU3lzdGVtUm9vdCwgJ2V4cGxvcmVyLmV4ZScpIHx8IGNvbW1hbmQgPT09IHBhdGguam9pbihwcm9jZXNzLmVudi5TeXN0ZW1Sb290LCAnZXhwbG9yZXInKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBnZXRDbWRQYXRoICgpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuY29tc3BlYykge1xuICAgICAgcmV0dXJuIHByb2Nlc3MuZW52LmNvbXNwZWNcbiAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52LlN5c3RlbVJvb3QpIHtcbiAgICAgIHJldHVybiBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuU3lzdGVtUm9vdCwgJ1N5c3RlbTMyJywgJ2NtZC5leGUnKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ2NtZC5leGUnXG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBUZXJtaW5hdGUgdGhlIHByb2Nlc3MuXG4gIGtpbGwgKCkge1xuICAgIGlmICh0aGlzLmtpbGxlZCkgcmV0dXJuXG5cbiAgICB0aGlzLmtpbGxlZCA9IHRydWVcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgdGhpcy5raWxsT25XaW5kb3dzKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5raWxsUHJvY2VzcygpXG4gICAgfVxuICB9XG5cbiAgc3Bhd24gKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5wcm9jZXNzID0gQ2hpbGRQcm9jZXNzLnNwYXduKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpXG4gICAgfSBjYXRjaCAoc3Bhd25FcnJvcikge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB0aGlzLmhhbmRsZUVycm9yKHNwYXduRXJyb3IpKVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUV2ZW50cyAoc3Rkb3V0LCBzdGRlcnIsIGV4aXQpIHtcbiAgICBpZiAoIXRoaXMucHJvY2VzcykgcmV0dXJuXG5cbiAgICBjb25zdCB0cmlnZ2VyRXhpdENhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMua2lsbGVkKSByZXR1cm5cbiAgICAgIGlmIChzdGRvdXRDbG9zZWQgJiYgc3RkZXJyQ2xvc2VkICYmIHByb2Nlc3NFeGl0ZWQgJiYgdHlwZW9mIGV4aXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZXhpdChleGl0Q29kZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgc3Rkb3V0Q2xvc2VkID0gdHJ1ZVxuICAgIGxldCBzdGRlcnJDbG9zZWQgPSB0cnVlXG4gICAgbGV0IHByb2Nlc3NFeGl0ZWQgPSB0cnVlXG4gICAgbGV0IGV4aXRDb2RlID0gMFxuXG4gICAgaWYgKHN0ZG91dCkge1xuICAgICAgc3Rkb3V0Q2xvc2VkID0gZmFsc2VcbiAgICAgIHRoaXMuYnVmZmVyU3RyZWFtKHRoaXMucHJvY2Vzcy5zdGRvdXQsIHN0ZG91dCwgKCkgPT4ge1xuICAgICAgICBzdGRvdXRDbG9zZWQgPSB0cnVlXG4gICAgICAgIHRyaWdnZXJFeGl0Q2FsbGJhY2soKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoc3RkZXJyKSB7XG4gICAgICBzdGRlcnJDbG9zZWQgPSBmYWxzZVxuICAgICAgdGhpcy5idWZmZXJTdHJlYW0odGhpcy5wcm9jZXNzLnN0ZGVyciwgc3RkZXJyLCAoKSA9PiB7XG4gICAgICAgIHN0ZGVyckNsb3NlZCA9IHRydWVcbiAgICAgICAgdHJpZ2dlckV4aXRDYWxsYmFjaygpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChleGl0KSB7XG4gICAgICBwcm9jZXNzRXhpdGVkID0gZmFsc2VcbiAgICAgIHRoaXMucHJvY2Vzcy5vbignZXhpdCcsIChjb2RlKSA9PiB7XG4gICAgICAgIGV4aXRDb2RlID0gY29kZVxuICAgICAgICBwcm9jZXNzRXhpdGVkID0gdHJ1ZVxuICAgICAgICB0cmlnZ2VyRXhpdENhbGxiYWNrKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5wcm9jZXNzLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgdGhpcy5oYW5kbGVFcnJvcihlcnJvcilcbiAgICB9KVxuICB9XG5cbiAgaGFuZGxlRXJyb3IgKGVycm9yKSB7XG4gICAgbGV0IGhhbmRsZWQgPSBmYWxzZVxuXG4gICAgY29uc3QgaGFuZGxlID0gKCkgPT4ge1xuICAgICAgaGFuZGxlZCA9IHRydWVcbiAgICB9XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnd2lsbC10aHJvdy1lcnJvcicsIHtlcnJvciwgaGFuZGxlfSlcblxuICAgIGlmIChlcnJvci5jb2RlID09PSAnRU5PRU5UJyAmJiBlcnJvci5zeXNjYWxsLmluZGV4T2YoJ3NwYXduJykgPT09IDApIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGBGYWlsZWQgdG8gc3Bhd24gY29tbWFuZCBcXGAke3RoaXMuY29tbWFuZH1cXGAuIE1ha2Ugc3VyZSBcXGAke3RoaXMuY29tbWFuZH1cXGAgaXMgaW5zdGFsbGVkIGFuZCBvbiB5b3VyIFBBVEhgLCBlcnJvci5wYXRoKVxuICAgICAgZXJyb3IubmFtZSA9ICdCdWZmZXJlZFByb2Nlc3NFcnJvcidcbiAgICB9XG5cbiAgICBpZiAoIWhhbmRsZWQpIHRocm93IGVycm9yXG4gIH1cbn1cbiJdfQ==