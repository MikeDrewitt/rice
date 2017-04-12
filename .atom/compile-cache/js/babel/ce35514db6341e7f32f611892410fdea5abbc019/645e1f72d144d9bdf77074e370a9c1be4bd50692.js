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
    if (process.platform === 'win32' && options.shell === undefined) {
      this.spawnWithEscapedWindowsArgs(command, args, options);
    } else {
      this.spawn(command, args, options);
    }

    this.killed = false;
    this.handleEvents(stdout, stderr, exit);
  }

  // Windows has a bunch of special rules that node still doesn't take care of for you

  _createClass(BufferedProcess, [{
    key: 'spawnWithEscapedWindowsArgs',
    value: function spawnWithEscapedWindowsArgs(command, args, options) {
      var _this = this;

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
            // Escape double quotes by putting a backslash in front of them
            return '"' + arg.toString().replace(/"/g, '\\"') + '"';
          }
        });
      }

      // The command itself is quoted if it contains spaces, &, ^ or | chars
      cmdArgs.unshift(/\s|&|\^|\|/.test(command) ? '"' + command + '"' : command);

      var cmdOptions = _underscorePlus2['default'].clone(options);
      cmdOptions.windowsVerbatimArguments = true;

      this.spawn(this.getCmdPath(), ['/s', '/d', '/c', '"' + cmdArgs.join(' ') + '"'], cmdOptions);
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
  }, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvYnVmZmVyZWQtcHJvY2Vzcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OEJBRWMsaUJBQWlCOzs7OzZCQUNOLGVBQWU7Ozs7d0JBQ2xCLFdBQVc7O29CQUNoQixNQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JGLGVBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQnRCLFdBM0JPLGVBQWUsR0EyQnFDO3FFQUFKLEVBQUU7O1FBQXZELE9BQU8sUUFBUCxPQUFPO1FBQUUsSUFBSSxRQUFKLElBQUk7NEJBQUUsT0FBTztRQUFQLE9BQU8sZ0NBQUcsRUFBRTtRQUFFLE1BQU0sUUFBTixNQUFNO1FBQUUsTUFBTSxRQUFOLE1BQU07UUFBRSxJQUFJLFFBQUosSUFBSTs7MEJBM0I1QyxlQUFlOztBQTRCaEMsUUFBSSxDQUFDLE9BQU8sR0FBRyx1QkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBOztBQUV0QixRQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQy9ELFVBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQ3pELE1BQU07QUFDTCxVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDbkM7O0FBRUQsUUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUE7QUFDbkIsUUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0dBQ3hDOzs7O2VBdkNrQixlQUFlOztXQTBDTixxQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTs7O0FBQ25ELFVB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LENBQUMsT0FBTyxFQUFFLE1BQU0sS0FBSyxDQUFBO0tBQzFCOzs7U0FuUmtCLGVBQWU7OztxQkFBZixlQUFlIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvYnVmZmVyZWQtcHJvY2Vzcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZS1wbHVzJ1xuaW1wb3J0IENoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuaW1wb3J0IHtFbWl0dGVyfSBmcm9tICdldmVudC1raXQnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuXG4vLyBFeHRlbmRlZDogQSB3cmFwcGVyIHdoaWNoIHByb3ZpZGVzIHN0YW5kYXJkIGVycm9yL291dHB1dCBsaW5lIGJ1ZmZlcmluZyBmb3Jcbi8vIE5vZGUncyBDaGlsZFByb2Nlc3MuXG4vL1xuLy8gIyMgRXhhbXBsZXNcbi8vXG4vLyBgYGBqc1xuLy8ge0J1ZmZlcmVkUHJvY2Vzc30gPSByZXF1aXJlKCdhdG9tJylcbi8vXG4vLyBjb25zdCBjb21tYW5kID0gJ3BzJ1xuLy8gY29uc3QgYXJncyA9IFsnLWVmJ11cbi8vIGNvbnN0IHN0ZG91dCA9IChvdXRwdXQpID0+IGNvbnNvbGUubG9nKG91dHB1dClcbi8vIGNvbnN0IGV4aXQgPSAoY29kZSkgPT4gY29uc29sZS5sb2coXCJwcyAtZWYgZXhpdGVkIHdpdGggI3tjb2RlfVwiKVxuLy8gY29uc3QgcHJvY2VzcyA9IG5ldyBCdWZmZXJlZFByb2Nlc3Moe2NvbW1hbmQsIGFyZ3MsIHN0ZG91dCwgZXhpdH0pXG4vLyBgYGBcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlcmVkUHJvY2VzcyB7XG4gIC8qXG4gIFNlY3Rpb246IENvbnN0cnVjdGlvblxuICAqL1xuXG4gIC8vIFB1YmxpYzogUnVucyB0aGUgZ2l2ZW4gY29tbWFuZCBieSBzcGF3bmluZyBhIG5ldyBjaGlsZCBwcm9jZXNzLlxuICAvL1xuICAvLyAqIGBvcHRpb25zYCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgLy8gICAqIGBjb21tYW5kYCBUaGUge1N0cmluZ30gY29tbWFuZCB0byBleGVjdXRlLlxuICAvLyAgICogYGFyZ3NgIFRoZSB7QXJyYXl9IG9mIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBjb21tYW5kIChvcHRpb25hbCkuXG4gIC8vICAgKiBgb3B0aW9uc2Age09iamVjdH0gKG9wdGlvbmFsKSBUaGUgb3B0aW9ucyB7T2JqZWN0fSB0byBwYXNzIHRvIE5vZGUnc1xuICAvLyAgICAgYENoaWxkUHJvY2Vzcy5zcGF3bmAgbWV0aG9kLlxuICAvLyAgICogYHN0ZG91dGAge0Z1bmN0aW9ufSAob3B0aW9uYWwpIFRoZSBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIGEgc2luZ2xlXG4gIC8vICAgICBhcmd1bWVudCB3aGljaCBjb250YWlucyB0aGUgc3RhbmRhcmQgb3V0cHV0IGZyb20gdGhlIGNvbW1hbmQuIFRoZVxuICAvLyAgICAgY2FsbGJhY2sgaXMgY2FsbGVkIGFzIGRhdGEgaXMgcmVjZWl2ZWQgYnV0IGl0J3MgYnVmZmVyZWQgdG8gZW5zdXJlIG9ubHlcbiAgLy8gICAgIGNvbXBsZXRlIGxpbmVzIGFyZSBwYXNzZWQgdW50aWwgdGhlIHNvdXJjZSBzdHJlYW0gY2xvc2VzLiBBZnRlciB0aGVcbiAgLy8gICAgIHNvdXJjZSBzdHJlYW0gaGFzIGNsb3NlZCBhbGwgcmVtYWluaW5nIGRhdGEgaXMgc2VudCBpbiBhIGZpbmFsIGNhbGwuXG4gIC8vICAgICAqIGBkYXRhYCB7U3RyaW5nfVxuICAvLyAgICogYHN0ZGVycmAge0Z1bmN0aW9ufSAob3B0aW9uYWwpIFRoZSBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIGEgc2luZ2xlXG4gIC8vICAgICBhcmd1bWVudCB3aGljaCBjb250YWlucyB0aGUgc3RhbmRhcmQgZXJyb3Igb3V0cHV0IGZyb20gdGhlIGNvbW1hbmQuIFRoZVxuICAvLyAgICAgY2FsbGJhY2sgaXMgY2FsbGVkIGFzIGRhdGEgaXMgcmVjZWl2ZWQgYnV0IGl0J3MgYnVmZmVyZWQgdG8gZW5zdXJlIG9ubHlcbiAgLy8gICAgIGNvbXBsZXRlIGxpbmVzIGFyZSBwYXNzZWQgdW50aWwgdGhlIHNvdXJjZSBzdHJlYW0gY2xvc2VzLiBBZnRlciB0aGVcbiAgLy8gICAgIHNvdXJjZSBzdHJlYW0gaGFzIGNsb3NlZCBhbGwgcmVtYWluaW5nIGRhdGEgaXMgc2VudCBpbiBhIGZpbmFsIGNhbGwuXG4gIC8vICAgICAqIGBkYXRhYCB7U3RyaW5nfVxuICAvLyAgICogYGV4aXRgIHtGdW5jdGlvbn0gKG9wdGlvbmFsKSBUaGUgY2FsbGJhY2sgd2hpY2ggcmVjZWl2ZXMgYSBzaW5nbGVcbiAgLy8gICAgIGFyZ3VtZW50IGNvbnRhaW5pbmcgdGhlIGV4aXQgc3RhdHVzLlxuICAvLyAgICAgKiBgY29kZWAge051bWJlcn1cbiAgY29uc3RydWN0b3IgKHtjb21tYW5kLCBhcmdzLCBvcHRpb25zID0ge30sIHN0ZG91dCwgc3RkZXJyLCBleGl0fSA9IHt9KSB7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKVxuICAgIHRoaXMuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAvLyBSZWxhdGVkIHRvIGpveWVudC9ub2RlIzIzMThcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyAmJiBvcHRpb25zLnNoZWxsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuc3Bhd25XaXRoRXNjYXBlZFdpbmRvd3NBcmdzKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3Bhd24oY29tbWFuZCwgYXJncywgb3B0aW9ucylcbiAgICB9XG5cbiAgICB0aGlzLmtpbGxlZCA9IGZhbHNlXG4gICAgdGhpcy5oYW5kbGVFdmVudHMoc3Rkb3V0LCBzdGRlcnIsIGV4aXQpXG4gIH1cblxuICAvLyBXaW5kb3dzIGhhcyBhIGJ1bmNoIG9mIHNwZWNpYWwgcnVsZXMgdGhhdCBub2RlIHN0aWxsIGRvZXNuJ3QgdGFrZSBjYXJlIG9mIGZvciB5b3VcbiAgc3Bhd25XaXRoRXNjYXBlZFdpbmRvd3NBcmdzIChjb21tYW5kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgbGV0IGNtZEFyZ3MgPSBbXVxuICAgIC8vIFF1b3RlIGFsbCBhcmd1bWVudHMgYW5kIGVzY2FwZXMgaW5uZXIgcXVvdGVzXG4gICAgaWYgKGFyZ3MpIHtcbiAgICAgIGNtZEFyZ3MgPSBhcmdzLmZpbHRlcigoYXJnKSA9PiBhcmcgIT0gbnVsbClcbiAgICAgICAgLm1hcCgoYXJnKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNFeHBsb3JlckNvbW1hbmQoY29tbWFuZCkgJiYgL15cXC9bYS16QS1aXSssLiokLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIC8vIERvbid0IHdyYXAgL3Jvb3QsQzpcXGZvbGRlciBzdHlsZSBhcmd1bWVudHMgdG8gZXhwbG9yZXIgY2FsbHMgaW5cbiAgICAgICAgICAgIC8vIHF1b3RlcyBzaW5jZSB0aGV5IHdpbGwgbm90IGJlIGludGVycHJldGVkIGNvcnJlY3RseSBpZiB0aGV5IGFyZVxuICAgICAgICAgICAgcmV0dXJuIGFyZ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBFc2NhcGUgZG91YmxlIHF1b3RlcyBieSBwdXR0aW5nIGEgYmFja3NsYXNoIGluIGZyb250IG9mIHRoZW1cbiAgICAgICAgICAgIHJldHVybiBgXFxcIiR7YXJnLnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVxcXCJgXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8vIFRoZSBjb21tYW5kIGl0c2VsZiBpcyBxdW90ZWQgaWYgaXQgY29udGFpbnMgc3BhY2VzLCAmLCBeIG9yIHwgY2hhcnNcbiAgICBjbWRBcmdzLnVuc2hpZnQoL1xcc3wmfFxcXnxcXHwvLnRlc3QoY29tbWFuZCkgPyBgXFxcIiR7Y29tbWFuZH1cXFwiYCA6IGNvbW1hbmQpXG5cbiAgICBjb25zdCBjbWRPcHRpb25zID0gXy5jbG9uZShvcHRpb25zKVxuICAgIGNtZE9wdGlvbnMud2luZG93c1ZlcmJhdGltQXJndW1lbnRzID0gdHJ1ZVxuXG4gICAgdGhpcy5zcGF3bih0aGlzLmdldENtZFBhdGgoKSwgWycvcycsICcvZCcsICcvYycsIGBcXFwiJHtjbWRBcmdzLmpvaW4oJyAnKX1cXFwiYF0sIGNtZE9wdGlvbnMpXG4gIH1cblxuICAvKlxuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgKi9cblxuICAvLyBQdWJsaWM6IFdpbGwgY2FsbCB5b3VyIGNhbGxiYWNrIHdoZW4gYW4gZXJyb3Igd2lsbCBiZSByYWlzZWQgYnkgdGhlIHByb2Nlc3MuXG4gIC8vIFVzdWFsbHkgdGhpcyBpcyBkdWUgdG8gdGhlIGNvbW1hbmQgbm90IGJlaW5nIGF2YWlsYWJsZSBvciBub3Qgb24gdGhlIFBBVEguXG4gIC8vIFlvdSBjYW4gY2FsbCBgaGFuZGxlKClgIG9uIHRoZSBvYmplY3QgcGFzc2VkIHRvIHlvdXIgY2FsbGJhY2sgdG8gaW5kaWNhdGVcbiAgLy8gdGhhdCB5b3UgaGF2ZSBoYW5kbGVkIHRoaXMgZXJyb3IuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IGNhbGxiYWNrXG4gIC8vICAgKiBgZXJyb3JPYmplY3RgIHtPYmplY3R9XG4gIC8vICAgICAqIGBlcnJvcmAge09iamVjdH0gdGhlIGVycm9yIG9iamVjdFxuICAvLyAgICAgKiBgaGFuZGxlYCB7RnVuY3Rpb259IGNhbGwgdGhpcyB0byBpbmRpY2F0ZSB5b3UgaGF2ZSBoYW5kbGVkIHRoZSBlcnJvci5cbiAgLy8gICAgICAgVGhlIGVycm9yIHdpbGwgbm90IGJlIHRocm93biBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtEaXNwb3NhYmxlfVxuICBvbldpbGxUaHJvd0Vycm9yIChjYWxsYmFjaykge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ3dpbGwtdGhyb3ctZXJyb3InLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8qXG4gIFNlY3Rpb246IEhlbHBlciBNZXRob2RzXG4gICovXG5cbiAgLy8gSGVscGVyIG1ldGhvZCB0byBwYXNzIGRhdGEgbGluZSBieSBsaW5lLlxuICAvL1xuICAvLyAqIGBzdHJlYW1gIFRoZSBTdHJlYW0gdG8gcmVhZCBmcm9tLlxuICAvLyAqIGBvbkxpbmVzYCBUaGUgY2FsbGJhY2sgdG8gY2FsbCB3aXRoIGVhY2ggbGluZSBvZiBkYXRhLlxuICAvLyAqIGBvbkRvbmVgIFRoZSBjYWxsYmFjayB0byBjYWxsIHdoZW4gdGhlIHN0cmVhbSBoYXMgY2xvc2VkLlxuICBidWZmZXJTdHJlYW0gKHN0cmVhbSwgb25MaW5lcywgb25Eb25lKSB7XG4gICAgc3RyZWFtLnNldEVuY29kaW5nKCd1dGY4JylcbiAgICBsZXQgYnVmZmVyZWQgPSAnJ1xuXG4gICAgc3RyZWFtLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgIGlmICh0aGlzLmtpbGxlZCkgcmV0dXJuXG5cbiAgICAgIGxldCBidWZmZXJlZExlbmd0aCA9IGJ1ZmZlcmVkLmxlbmd0aFxuICAgICAgYnVmZmVyZWQgKz0gZGF0YVxuICAgICAgbGV0IGxhc3ROZXdsaW5lSW5kZXggPSBkYXRhLmxhc3RJbmRleE9mKCdcXG4nKVxuXG4gICAgICBpZiAobGFzdE5ld2xpbmVJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGxpbmVMZW5ndGggPSBsYXN0TmV3bGluZUluZGV4ICsgYnVmZmVyZWRMZW5ndGggKyAxXG4gICAgICAgIG9uTGluZXMoYnVmZmVyZWQuc3Vic3RyaW5nKDAsIGxpbmVMZW5ndGgpKVxuICAgICAgICBidWZmZXJlZCA9IGJ1ZmZlcmVkLnN1YnN0cmluZyhsaW5lTGVuZ3RoKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBzdHJlYW0ub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMua2lsbGVkKSByZXR1cm5cbiAgICAgIGlmIChidWZmZXJlZC5sZW5ndGggPiAwKSBvbkxpbmVzKGJ1ZmZlcmVkKVxuICAgICAgb25Eb25lKClcbiAgICB9KVxuICB9XG5cbiAgLy8gS2lsbCBhbGwgY2hpbGQgcHJvY2Vzc2VzIG9mIHRoZSBzcGF3bmVkIGNtZC5leGUgcHJvY2VzcyBvbiBXaW5kb3dzLlxuICAvL1xuICAvLyBUaGlzIGlzIHJlcXVpcmVkIHNpbmNlIGtpbGxpbmcgdGhlIGNtZC5leGUgZG9lcyBub3QgdGVybWluYXRlIGNoaWxkXG4gIC8vIHByb2Nlc3Nlcy5cbiAga2lsbE9uV2luZG93cyAoKSB7XG4gICAgaWYgKCF0aGlzLnByb2Nlc3MpIHJldHVyblxuXG4gICAgY29uc3QgcGFyZW50UGlkID0gdGhpcy5wcm9jZXNzLnBpZFxuICAgIGNvbnN0IGNtZCA9ICd3bWljJ1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICAncHJvY2VzcycsXG4gICAgICAnd2hlcmUnLFxuICAgICAgYChQYXJlbnRQcm9jZXNzSWQ9JHtwYXJlbnRQaWR9KWAsXG4gICAgICAnZ2V0JyxcbiAgICAgICdwcm9jZXNzaWQnXG4gICAgXVxuXG4gICAgbGV0IHdtaWNQcm9jZXNzXG5cbiAgICB0cnkge1xuICAgICAgd21pY1Byb2Nlc3MgPSBDaGlsZFByb2Nlc3Muc3Bhd24oY21kLCBhcmdzKVxuICAgIH0gY2F0Y2ggKHNwYXduRXJyb3IpIHtcbiAgICAgIHRoaXMua2lsbFByb2Nlc3MoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgd21pY1Byb2Nlc3Mub24oJ2Vycm9yJywgKCkgPT4ge30pIC8vIGlnbm9yZSBlcnJvcnNcblxuICAgIGxldCBvdXRwdXQgPSAnJ1xuICAgIHdtaWNQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICBvdXRwdXQgKz0gZGF0YVxuICAgIH0pXG4gICAgd21pY1Byb2Nlc3Muc3Rkb3V0Lm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHBpZHNUb0tpbGwgPSBvdXRwdXQuc3BsaXQoL1xccysvKVxuICAgICAgICAuZmlsdGVyKChwaWQpID0+IC9eXFxkKyQvLnRlc3QocGlkKSlcbiAgICAgICAgLm1hcCgocGlkKSA9PiBwYXJzZUludChwaWQpKVxuICAgICAgICAuZmlsdGVyKChwaWQpID0+IHBpZCAhPT0gcGFyZW50UGlkICYmIHBpZCA+IDAgJiYgcGlkIDwgSW5maW5pdHkpXG5cbiAgICAgIGZvciAobGV0IHBpZCBvZiBwaWRzVG9LaWxsKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcHJvY2Vzcy5raWxsKHBpZClcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gICAgICB9XG5cbiAgICAgIHRoaXMua2lsbFByb2Nlc3MoKVxuICAgIH0pXG4gIH1cblxuICBraWxsUHJvY2VzcyAoKSB7XG4gICAgaWYgKHRoaXMucHJvY2VzcykgdGhpcy5wcm9jZXNzLmtpbGwoKVxuICAgIHRoaXMucHJvY2VzcyA9IG51bGxcbiAgfVxuXG4gIGlzRXhwbG9yZXJDb21tYW5kIChjb21tYW5kKSB7XG4gICAgaWYgKGNvbW1hbmQgPT09ICdleHBsb3Jlci5leGUnIHx8IGNvbW1hbmQgPT09ICdleHBsb3JlcicpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5TeXN0ZW1Sb290KSB7XG4gICAgICByZXR1cm4gY29tbWFuZCA9PT0gcGF0aC5qb2luKHByb2Nlc3MuZW52LlN5c3RlbVJvb3QsICdleHBsb3Jlci5leGUnKSB8fCBjb21tYW5kID09PSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuU3lzdGVtUm9vdCwgJ2V4cGxvcmVyJylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgZ2V0Q21kUGF0aCAoKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52LmNvbXNwZWMpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzLmVudi5jb21zcGVjXG4gICAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5TeXN0ZW1Sb290KSB7XG4gICAgICByZXR1cm4gcGF0aC5qb2luKHByb2Nlc3MuZW52LlN5c3RlbVJvb3QsICdTeXN0ZW0zMicsICdjbWQuZXhlJylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdjbWQuZXhlJ1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1YmxpYzogVGVybWluYXRlIHRoZSBwcm9jZXNzLlxuICBraWxsICgpIHtcbiAgICBpZiAodGhpcy5raWxsZWQpIHJldHVyblxuXG4gICAgdGhpcy5raWxsZWQgPSB0cnVlXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIHRoaXMua2lsbE9uV2luZG93cygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2lsbFByb2Nlc3MoKVxuICAgIH1cbiAgfVxuXG4gIHNwYXduIChjb21tYW5kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucHJvY2VzcyA9IENoaWxkUHJvY2Vzcy5zcGF3bihjb21tYW5kLCBhcmdzLCBvcHRpb25zKVxuICAgIH0gY2F0Y2ggKHNwYXduRXJyb3IpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soKCkgPT4gdGhpcy5oYW5kbGVFcnJvcihzcGF3bkVycm9yKSlcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFdmVudHMgKHN0ZG91dCwgc3RkZXJyLCBleGl0KSB7XG4gICAgaWYgKCF0aGlzLnByb2Nlc3MpIHJldHVyblxuXG4gICAgY29uc3QgdHJpZ2dlckV4aXRDYWxsYmFjayA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmtpbGxlZCkgcmV0dXJuXG4gICAgICBpZiAoc3Rkb3V0Q2xvc2VkICYmIHN0ZGVyckNsb3NlZCAmJiBwcm9jZXNzRXhpdGVkICYmIHR5cGVvZiBleGl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGV4aXQoZXhpdENvZGUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHN0ZG91dENsb3NlZCA9IHRydWVcbiAgICBsZXQgc3RkZXJyQ2xvc2VkID0gdHJ1ZVxuICAgIGxldCBwcm9jZXNzRXhpdGVkID0gdHJ1ZVxuICAgIGxldCBleGl0Q29kZSA9IDBcblxuICAgIGlmIChzdGRvdXQpIHtcbiAgICAgIHN0ZG91dENsb3NlZCA9IGZhbHNlXG4gICAgICB0aGlzLmJ1ZmZlclN0cmVhbSh0aGlzLnByb2Nlc3Muc3Rkb3V0LCBzdGRvdXQsICgpID0+IHtcbiAgICAgICAgc3Rkb3V0Q2xvc2VkID0gdHJ1ZVxuICAgICAgICB0cmlnZ2VyRXhpdENhbGxiYWNrKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKHN0ZGVycikge1xuICAgICAgc3RkZXJyQ2xvc2VkID0gZmFsc2VcbiAgICAgIHRoaXMuYnVmZmVyU3RyZWFtKHRoaXMucHJvY2Vzcy5zdGRlcnIsIHN0ZGVyciwgKCkgPT4ge1xuICAgICAgICBzdGRlcnJDbG9zZWQgPSB0cnVlXG4gICAgICAgIHRyaWdnZXJFeGl0Q2FsbGJhY2soKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoZXhpdCkge1xuICAgICAgcHJvY2Vzc0V4aXRlZCA9IGZhbHNlXG4gICAgICB0aGlzLnByb2Nlc3Mub24oJ2V4aXQnLCAoY29kZSkgPT4ge1xuICAgICAgICBleGl0Q29kZSA9IGNvZGVcbiAgICAgICAgcHJvY2Vzc0V4aXRlZCA9IHRydWVcbiAgICAgICAgdHJpZ2dlckV4aXRDYWxsYmFjaygpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMucHJvY2Vzcy5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRXJyb3IoZXJyb3IpXG4gICAgfSlcbiAgfVxuXG4gIGhhbmRsZUVycm9yIChlcnJvcikge1xuICAgIGxldCBoYW5kbGVkID0gZmFsc2VcblxuICAgIGNvbnN0IGhhbmRsZSA9ICgpID0+IHtcbiAgICAgIGhhbmRsZWQgPSB0cnVlXG4gICAgfVxuXG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3dpbGwtdGhyb3ctZXJyb3InLCB7ZXJyb3IsIGhhbmRsZX0pXG5cbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ0VOT0VOVCcgJiYgZXJyb3Iuc3lzY2FsbC5pbmRleE9mKCdzcGF3bicpID09PSAwKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihgRmFpbGVkIHRvIHNwYXduIGNvbW1hbmQgXFxgJHt0aGlzLmNvbW1hbmR9XFxgLiBNYWtlIHN1cmUgXFxgJHt0aGlzLmNvbW1hbmR9XFxgIGlzIGluc3RhbGxlZCBhbmQgb24geW91ciBQQVRIYCwgZXJyb3IucGF0aClcbiAgICAgIGVycm9yLm5hbWUgPSAnQnVmZmVyZWRQcm9jZXNzRXJyb3InXG4gICAgfVxuXG4gICAgaWYgKCFoYW5kbGVkKSB0aHJvdyBlcnJvclxuICB9XG59XG4iXX0=