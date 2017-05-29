Object.defineProperty(exports, '__esModule', {
  value: true
});

var updateProcessEnv = _asyncToGenerator(function* (launchEnv) {
  var envToAssign = undefined;
  if (launchEnv) {
    if (shouldGetEnvFromShell(launchEnv)) {
      envToAssign = yield getEnvFromShell(launchEnv);
    } else if (launchEnv.PWD) {
      envToAssign = launchEnv;
    }
  }

  if (envToAssign) {
    for (var key in process.env) {
      if (!ENVIRONMENT_VARIABLES_TO_PRESERVE.has(key)) {
        delete process.env[key];
      }
    }

    for (var key in envToAssign) {
      if (!ENVIRONMENT_VARIABLES_TO_PRESERVE.has(key) || !process.env[key] && envToAssign[key]) {
        process.env[key] = envToAssign[key];
      }
    }

    if (envToAssign.ATOM_HOME && _fs2['default'].existsSync(envToAssign.ATOM_HOME)) {
      process.env.ATOM_HOME = envToAssign.ATOM_HOME;
    }
  }
});

var getEnvFromShell = _asyncToGenerator(function* (env) {
  var _ref = yield new Promise(function (resolve) {
    var child = undefined;
    var error = undefined;
    var stdout = '';
    var done = false;
    var cleanup = function cleanup() {
      if (!done && child) {
        child.kill();
        done = true;
      }
    };
    process.once('exit', cleanup);
    setTimeout(function () {
      cleanup();
    }, 5000);
    child = _child_process2['default'].spawn(env.SHELL, ['-ilc', 'command env'], { encoding: 'utf8', detached: true, stdio: ['ignore', 'pipe', process.stderr] });
    var buffers = [];
    child.on('error', function (e) {
      done = true;
      error = e;
    });
    child.stdout.on('data', function (data) {
      buffers.push(data);
    });
    child.on('close', function (code, signal) {
      done = true;
      process.removeListener('exit', cleanup);
      if (buffers.length) {
        stdout = Buffer.concat(buffers).toString('utf8');
      }

      resolve({ stdout: stdout, error: error });
    });
  });

  var stdout = _ref.stdout;
  var error = _ref.error;

  if (error) {
    if (error.handle) {
      error.handle();
    }
    console.log('warning: ' + env.SHELL + ' -ilc "command env" failed with signal (' + error.signal + ')');
    console.log(error);
  }

  if (!stdout || stdout.trim() === '') {
    return null;
  }

  var result = {};
  for (var line of stdout.split('\n')) {
    if (line.includes('=')) {
      var components = line.split('=');
      var key = components.shift();
      var value = components.join('=');
      result[key] = value;
    }
  }
  return result;
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/** @babel */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var ENVIRONMENT_VARIABLES_TO_PRESERVE = new Set(['NODE_ENV', 'NODE_PATH', 'ATOM_HOME', 'ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT']);

var PLATFORMS_KNOWN_TO_WORK = new Set(['darwin', 'linux']);

function shouldGetEnvFromShell(env) {
  if (!PLATFORMS_KNOWN_TO_WORK.has(process.platform)) {
    return false;
  }

  if (!env || !env.SHELL || env.SHELL.trim() === '') {
    return false;
  }

  if (env.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT || process.env.ATOM_DISABLE_SHELLING_OUT_FOR_ENVIRONMENT) {
    return false;
  }

  return true;
}

exports['default'] = { updateProcessEnv: updateProcessEnv, shouldGetEnvFromShell: shouldGetEnvFromShell };
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvdXBkYXRlLXByb2Nlc3MtZW52LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFpQmUsZ0JBQWdCLHFCQUEvQixXQUFpQyxTQUFTLEVBQUU7QUFDMUMsTUFBSSxXQUFXLFlBQUEsQ0FBQTtBQUNmLE1BQUksU0FBUyxFQUFFO0FBQ2IsUUFBSSxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxpQkFBVyxHQUFHLE1BQU0sZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0tBQy9DLE1BQU0sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ3hCLGlCQUFXLEdBQUcsU0FBUyxDQUFBO0tBQ3hCO0dBQ0Y7O0FBRUQsTUFBSSxXQUFXLEVBQUU7QUFDZixTQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7QUFDM0IsVUFBSSxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMvQyxlQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7T0FDeEI7S0FDRjs7QUFFRCxTQUFLLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRTtBQUMzQixVQUFJLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLEFBQUMsRUFBRTtBQUMxRixlQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtPQUNwQztLQUNGOztBQUVELFFBQUksV0FBVyxDQUFDLFNBQVMsSUFBSSxnQkFBRyxVQUFVLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ2pFLGFBQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUE7S0FDOUM7R0FDRjtDQUNGOztJQWtCYyxlQUFlLHFCQUE5QixXQUFnQyxHQUFHLEVBQUU7YUFDYixNQUFNLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFLO0FBQ25ELFFBQUksS0FBSyxZQUFBLENBQUE7QUFDVCxRQUFJLEtBQUssWUFBQSxDQUFBO0FBQ1QsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFBO0FBQ2YsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFBO0FBQ2hCLFFBQU0sT0FBTyxHQUFHLFNBQVYsT0FBTyxHQUFTO0FBQ3BCLFVBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ2xCLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUNaLFlBQUksR0FBRyxJQUFJLENBQUE7T0FDWjtLQUNGLENBQUE7QUFDRCxXQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUM3QixjQUFVLENBQUMsWUFBTTtBQUNmLGFBQU8sRUFBRSxDQUFBO0tBQ1YsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNSLFNBQUssR0FBRywyQkFBYSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsRUFBRSxFQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUE7QUFDN0ksUUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFNBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQUMsQ0FBQyxFQUFLO0FBQ3ZCLFVBQUksR0FBRyxJQUFJLENBQUE7QUFDWCxXQUFLLEdBQUcsQ0FBQyxDQUFBO0tBQ1YsQ0FBQyxDQUFBO0FBQ0YsU0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUMsSUFBSSxFQUFLO0FBQ2hDLGFBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDbkIsQ0FBQyxDQUFBO0FBQ0YsU0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFLO0FBQ2xDLFVBQUksR0FBRyxJQUFJLENBQUE7QUFDWCxhQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUN2QyxVQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDbEIsY0FBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO09BQ2pEOztBQUVELGFBQU8sQ0FBQyxFQUFDLE1BQU0sRUFBTixNQUFNLEVBQUUsS0FBSyxFQUFMLEtBQUssRUFBQyxDQUFDLENBQUE7S0FDekIsQ0FBQyxDQUFBO0dBQ0gsQ0FBQzs7TUFqQ0csTUFBTSxRQUFOLE1BQU07TUFBRSxLQUFLLFFBQUwsS0FBSzs7QUFtQ2xCLE1BQUksS0FBSyxFQUFFO0FBQ1QsUUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQ2hCLFdBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQTtLQUNmO0FBQ0QsV0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLEtBQUssR0FBRywwQ0FBMEMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0FBQ3RHLFdBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7R0FDbkI7O0FBRUQsTUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO0FBQ25DLFdBQU8sSUFBSSxDQUFBO0dBQ1o7O0FBRUQsTUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFBO0FBQ2YsT0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ25DLFFBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUN0QixVQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2hDLFVBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUM1QixVQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2hDLFlBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7S0FDcEI7R0FDRjtBQUNELFNBQU8sTUFBTSxDQUFBO0NBQ2Q7Ozs7Ozs7O2tCQXRIYyxJQUFJOzs7OzZCQUNNLGVBQWU7Ozs7QUFFeEMsSUFBTSxpQ0FBaUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUNoRCxVQUFVLEVBQ1YsV0FBVyxFQUNYLFdBQVcsRUFDWCwyQ0FBMkMsQ0FDNUMsQ0FBQyxDQUFBOztBQUVGLElBQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FDdEMsUUFBUSxFQUNSLE9BQU8sQ0FDUixDQUFDLENBQUE7O0FBK0JGLFNBQVMscUJBQXFCLENBQUUsR0FBRyxFQUFFO0FBQ25DLE1BQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2xELFdBQU8sS0FBSyxDQUFBO0dBQ2I7O0FBRUQsTUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDakQsV0FBTyxLQUFLLENBQUE7R0FDYjs7QUFFRCxNQUFJLEdBQUcsQ0FBQyx5Q0FBeUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxFQUFFO0FBQzFHLFdBQU8sS0FBSyxDQUFBO0dBQ2I7O0FBRUQsU0FBTyxJQUFJLENBQUE7Q0FDWjs7cUJBOERjLEVBQUUsZ0JBQWdCLEVBQWhCLGdCQUFnQixFQUFFLHFCQUFxQixFQUFyQixxQkFBcUIsRUFBRSIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvc3JjL3VwZGF0ZS1wcm9jZXNzLWVudi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IGNoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuXG5jb25zdCBFTlZJUk9OTUVOVF9WQVJJQUJMRVNfVE9fUFJFU0VSVkUgPSBuZXcgU2V0KFtcbiAgJ05PREVfRU5WJyxcbiAgJ05PREVfUEFUSCcsXG4gICdBVE9NX0hPTUUnLFxuICAnQVRPTV9ESVNBQkxFX1NIRUxMSU5HX09VVF9GT1JfRU5WSVJPTk1FTlQnXG5dKVxuXG5jb25zdCBQTEFURk9STVNfS05PV05fVE9fV09SSyA9IG5ldyBTZXQoW1xuICAnZGFyd2luJyxcbiAgJ2xpbnV4J1xuXSlcblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJvY2Vzc0VudiAobGF1bmNoRW52KSB7XG4gIGxldCBlbnZUb0Fzc2lnblxuICBpZiAobGF1bmNoRW52KSB7XG4gICAgaWYgKHNob3VsZEdldEVudkZyb21TaGVsbChsYXVuY2hFbnYpKSB7XG4gICAgICBlbnZUb0Fzc2lnbiA9IGF3YWl0IGdldEVudkZyb21TaGVsbChsYXVuY2hFbnYpXG4gICAgfSBlbHNlIGlmIChsYXVuY2hFbnYuUFdEKSB7XG4gICAgICBlbnZUb0Fzc2lnbiA9IGxhdW5jaEVudlxuICAgIH1cbiAgfVxuXG4gIGlmIChlbnZUb0Fzc2lnbikge1xuICAgIGZvciAobGV0IGtleSBpbiBwcm9jZXNzLmVudikge1xuICAgICAgaWYgKCFFTlZJUk9OTUVOVF9WQVJJQUJMRVNfVE9fUFJFU0VSVkUuaGFzKGtleSkpIHtcbiAgICAgICAgZGVsZXRlIHByb2Nlc3MuZW52W2tleV1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gZW52VG9Bc3NpZ24pIHtcbiAgICAgIGlmICghRU5WSVJPTk1FTlRfVkFSSUFCTEVTX1RPX1BSRVNFUlZFLmhhcyhrZXkpIHx8ICghcHJvY2Vzcy5lbnZba2V5XSAmJiBlbnZUb0Fzc2lnbltrZXldKSkge1xuICAgICAgICBwcm9jZXNzLmVudltrZXldID0gZW52VG9Bc3NpZ25ba2V5XVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbnZUb0Fzc2lnbi5BVE9NX0hPTUUgJiYgZnMuZXhpc3RzU3luYyhlbnZUb0Fzc2lnbi5BVE9NX0hPTUUpKSB7XG4gICAgICBwcm9jZXNzLmVudi5BVE9NX0hPTUUgPSBlbnZUb0Fzc2lnbi5BVE9NX0hPTUVcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvdWxkR2V0RW52RnJvbVNoZWxsIChlbnYpIHtcbiAgaWYgKCFQTEFURk9STVNfS05PV05fVE9fV09SSy5oYXMocHJvY2Vzcy5wbGF0Zm9ybSkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGlmICghZW52IHx8ICFlbnYuU0hFTEwgfHwgZW52LlNIRUxMLnRyaW0oKSA9PT0gJycpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGlmIChlbnYuQVRPTV9ESVNBQkxFX1NIRUxMSU5HX09VVF9GT1JfRU5WSVJPTk1FTlQgfHwgcHJvY2Vzcy5lbnYuQVRPTV9ESVNBQkxFX1NIRUxMSU5HX09VVF9GT1JfRU5WSVJPTk1FTlQpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEVudkZyb21TaGVsbCAoZW52KSB7XG4gIGxldCB7c3Rkb3V0LCBlcnJvcn0gPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGxldCBjaGlsZFxuICAgIGxldCBlcnJvclxuICAgIGxldCBzdGRvdXQgPSAnJ1xuICAgIGxldCBkb25lID0gZmFsc2VcbiAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgaWYgKCFkb25lICYmIGNoaWxkKSB7XG4gICAgICAgIGNoaWxkLmtpbGwoKVxuICAgICAgICBkb25lID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICBwcm9jZXNzLm9uY2UoJ2V4aXQnLCBjbGVhbnVwKVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2xlYW51cCgpXG4gICAgfSwgNTAwMClcbiAgICBjaGlsZCA9IGNoaWxkUHJvY2Vzcy5zcGF3bihlbnYuU0hFTEwsIFsnLWlsYycsICdjb21tYW5kIGVudiddLCB7ZW5jb2Rpbmc6ICd1dGY4JywgZGV0YWNoZWQ6IHRydWUsIHN0ZGlvOiBbJ2lnbm9yZScsICdwaXBlJywgcHJvY2Vzcy5zdGRlcnJdfSlcbiAgICBjb25zdCBidWZmZXJzID0gW11cbiAgICBjaGlsZC5vbignZXJyb3InLCAoZSkgPT4ge1xuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIGVycm9yID0gZVxuICAgIH0pXG4gICAgY2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgIGJ1ZmZlcnMucHVzaChkYXRhKVxuICAgIH0pXG4gICAgY2hpbGQub24oJ2Nsb3NlJywgKGNvZGUsIHNpZ25hbCkgPT4ge1xuICAgICAgZG9uZSA9IHRydWVcbiAgICAgIHByb2Nlc3MucmVtb3ZlTGlzdGVuZXIoJ2V4aXQnLCBjbGVhbnVwKVxuICAgICAgaWYgKGJ1ZmZlcnMubGVuZ3RoKSB7XG4gICAgICAgIHN0ZG91dCA9IEJ1ZmZlci5jb25jYXQoYnVmZmVycykudG9TdHJpbmcoJ3V0ZjgnKVxuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHtzdGRvdXQsIGVycm9yfSlcbiAgICB9KVxuICB9KVxuXG4gIGlmIChlcnJvcikge1xuICAgIGlmIChlcnJvci5oYW5kbGUpIHtcbiAgICAgIGVycm9yLmhhbmRsZSgpXG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCd3YXJuaW5nOiAnICsgZW52LlNIRUxMICsgJyAtaWxjIFwiY29tbWFuZCBlbnZcIiBmYWlsZWQgd2l0aCBzaWduYWwgKCcgKyBlcnJvci5zaWduYWwgKyAnKScpXG4gICAgY29uc29sZS5sb2coZXJyb3IpXG4gIH1cblxuICBpZiAoIXN0ZG91dCB8fCBzdGRvdXQudHJpbSgpID09PSAnJykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBsZXQgcmVzdWx0ID0ge31cbiAgZm9yIChsZXQgbGluZSBvZiBzdGRvdXQuc3BsaXQoJ1xcbicpKSB7XG4gICAgaWYgKGxpbmUuaW5jbHVkZXMoJz0nKSkge1xuICAgICAgbGV0IGNvbXBvbmVudHMgPSBsaW5lLnNwbGl0KCc9JylcbiAgICAgIGxldCBrZXkgPSBjb21wb25lbnRzLnNoaWZ0KClcbiAgICAgIGxldCB2YWx1ZSA9IGNvbXBvbmVudHMuam9pbignPScpXG4gICAgICByZXN1bHRba2V5XSA9IHZhbHVlXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyB1cGRhdGVQcm9jZXNzRW52LCBzaG91bGRHZXRFbnZGcm9tU2hlbGwgfVxuIl19