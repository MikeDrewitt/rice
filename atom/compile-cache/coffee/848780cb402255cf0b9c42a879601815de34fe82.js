(function() {
  var ChildProcess, Emitter, Grim, Task, _,
    slice = [].slice;

  _ = require('underscore-plus');

  ChildProcess = require('child_process');

  Emitter = require('event-kit').Emitter;

  Grim = require('grim');

  module.exports = Task = (function() {
    Task.once = function() {
      var args, task, taskPath;
      taskPath = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      task = new Task(taskPath);
      task.once('task:completed', function() {
        return task.terminate();
      });
      task.start.apply(task, args);
      return task;
    };

    Task.prototype.callback = null;

    function Task(taskPath) {
      var bootstrap, compileCachePath, compileCacheRequire, env, taskBootstrapRequire;
      this.emitter = new Emitter;
      compileCacheRequire = "require('" + (require.resolve('./compile-cache')) + "')";
      compileCachePath = require('./compile-cache').getCacheDirectory();
      taskBootstrapRequire = "require('" + (require.resolve('./task-bootstrap')) + "');";
      bootstrap = compileCacheRequire + ".setCacheDirectory('" + compileCachePath + "');\n" + taskBootstrapRequire;
      bootstrap = bootstrap.replace(/\\/g, "\\\\");
      taskPath = require.resolve(taskPath);
      taskPath = taskPath.replace(/\\/g, "\\\\");
      env = _.extend({}, process.env, {
        taskPath: taskPath,
        userAgent: navigator.userAgent
      });
      this.childProcess = ChildProcess.fork('--eval', [bootstrap], {
        env: env,
        silent: true
      });
      this.on("task:log", function() {
        return console.log.apply(console, arguments);
      });
      this.on("task:warn", function() {
        return console.warn.apply(console, arguments);
      });
      this.on("task:error", function() {
        return console.error.apply(console, arguments);
      });
      this.on("task:deprecations", function(deprecations) {
        var deprecation, i, len;
        for (i = 0, len = deprecations.length; i < len; i++) {
          deprecation = deprecations[i];
          Grim.addSerializedDeprecation(deprecation);
        }
      });
      this.on("task:completed", (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return typeof _this.callback === "function" ? _this.callback.apply(_this, args) : void 0;
        };
      })(this));
      this.handleEvents();
    }

    Task.prototype.handleEvents = function() {
      this.childProcess.removeAllListeners();
      this.childProcess.on('message', (function(_this) {
        return function(arg) {
          var args, event;
          event = arg.event, args = arg.args;
          if (_this.childProcess != null) {
            return _this.emitter.emit(event, args);
          }
        };
      })(this));
      if (this.childProcess.stdout != null) {
        this.childProcess.stdout.removeAllListeners();
        this.childProcess.stdout.on('data', function(data) {
          return console.log(data.toString());
        });
      }
      if (this.childProcess.stderr != null) {
        this.childProcess.stderr.removeAllListeners();
        return this.childProcess.stderr.on('data', function(data) {
          return console.error(data.toString());
        });
      }
    };

    Task.prototype.start = function() {
      var args, callback, i;
      args = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), callback = arguments[i++];
      if (this.childProcess == null) {
        throw new Error('Cannot start terminated process');
      }
      this.handleEvents();
      if (_.isFunction(callback)) {
        this.callback = callback;
      } else {
        args.push(callback);
      }
      this.send({
        event: 'start',
        args: args
      });
      return void 0;
    };

    Task.prototype.send = function(message) {
      if (this.childProcess != null) {
        this.childProcess.send(message);
      } else {
        throw new Error('Cannot send message to terminated process');
      }
      return void 0;
    };

    Task.prototype.on = function(eventName, callback) {
      return this.emitter.on(eventName, function(args) {
        return callback.apply(null, args);
      });
    };

    Task.prototype.once = function(eventName, callback) {
      var disposable;
      return disposable = this.on(eventName, function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        disposable.dispose();
        return callback.apply(null, args);
      });
    };

    Task.prototype.terminate = function() {
      var ref, ref1;
      if (this.childProcess == null) {
        return false;
      }
      this.childProcess.removeAllListeners();
      if ((ref = this.childProcess.stdout) != null) {
        ref.removeAllListeners();
      }
      if ((ref1 = this.childProcess.stderr) != null) {
        ref1.removeAllListeners();
      }
      this.childProcess.kill();
      this.childProcess = null;
      return true;
    };

    Task.prototype.cancel = function() {
      var didForcefullyTerminate;
      didForcefullyTerminate = this.terminate();
      if (didForcefullyTerminate) {
        this.emitter.emit('task:cancelled');
      }
      return didForcefullyTerminate;
    };

    return Task;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90YXNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0NBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLFlBQUEsR0FBZSxPQUFBLENBQVEsZUFBUjs7RUFDZCxVQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUNaLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFtQ1AsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQVFKLElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFETSx5QkFBVTtNQUNoQixJQUFBLEdBQVcsSUFBQSxJQUFBLENBQUssUUFBTDtNQUNYLElBQUksQ0FBQyxJQUFMLENBQVUsZ0JBQVYsRUFBNEIsU0FBQTtlQUFHLElBQUksQ0FBQyxTQUFMLENBQUE7TUFBSCxDQUE1QjtNQUNBLElBQUksQ0FBQyxLQUFMLGFBQVcsSUFBWDthQUNBO0lBSks7O21CQVlQLFFBQUEsR0FBVTs7SUFNRyxjQUFDLFFBQUQ7QUFDWCxVQUFBO01BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsbUJBQUEsR0FBc0IsV0FBQSxHQUFXLENBQUMsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsaUJBQWhCLENBQUQsQ0FBWCxHQUErQztNQUNyRSxnQkFBQSxHQUFtQixPQUFBLENBQVEsaUJBQVIsQ0FBMEIsQ0FBQyxpQkFBM0IsQ0FBQTtNQUNuQixvQkFBQSxHQUF1QixXQUFBLEdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBUixDQUFnQixrQkFBaEIsQ0FBRCxDQUFYLEdBQWdEO01BQ3ZFLFNBQUEsR0FDSSxtQkFBRCxHQUFxQixzQkFBckIsR0FBMkMsZ0JBQTNDLEdBQTRELE9BQTVELEdBQ0M7TUFFSixTQUFBLEdBQVksU0FBUyxD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QUFULENBQWMsZ0JBQWQsRUFERjs7YUFFQTtJQUpNOzs7OztBQXRLViIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5DaGlsZFByb2Nlc3MgPSByZXF1aXJlICdjaGlsZF9wcm9jZXNzJ1xue0VtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG5cbiMgRXh0ZW5kZWQ6IFJ1biBhIG5vZGUgc2NyaXB0IGluIGEgc2VwYXJhdGUgcHJvY2Vzcy5cbiNcbiMgVXNlZCBieSB0aGUgZnV6enktZmluZGVyIGFuZCBbZmluZCBpbiBwcm9qZWN0XShodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2Jsb2IvbWFzdGVyL3NyYy9zY2FuLWhhbmRsZXIuY29mZmVlKS5cbiNcbiMgRm9yIGEgcmVhbC13b3JsZCBleGFtcGxlLCBzZWUgdGhlIFtzY2FuLWhhbmRsZXJdKGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi9tYXN0ZXIvc3JjL3NjYW4taGFuZGxlci5jb2ZmZWUpXG4jIGFuZCB0aGUgW2luc3RhbnRpYXRpb24gb2YgdGhlIHRhc2tdKGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi80YTIwZjEzMTYyZjY1YWZjODE2YjUxMmFkNzIwMWU1MjhjMzQ0M2Q3L3NyYy9wcm9qZWN0LmNvZmZlZSNMMjQ1KS5cbiNcbiMgIyMgRXhhbXBsZXNcbiNcbiMgSW4geW91ciBwYWNrYWdlIGNvZGU6XG4jXG4jIGBgYGNvZmZlZVxuIyB7VGFza30gPSByZXF1aXJlICdhdG9tJ1xuI1xuIyB0YXNrID0gVGFzay5vbmNlICcvcGF0aC90by90YXNrLWZpbGUuY29mZmVlJywgcGFyYW1ldGVyMSwgcGFyYW1ldGVyMiwgLT5cbiMgICBjb25zb2xlLmxvZyAndGFzayBoYXMgZmluaXNoZWQnXG4jXG4jIHRhc2sub24gJ3NvbWUtZXZlbnQtZnJvbS10aGUtdGFzaycsIChkYXRhKSA9PlxuIyAgIGNvbnNvbGUubG9nIGRhdGEuc29tZVN0cmluZyAjIHByaW50cyAneWVwIHRoaXMgaXMgaXQnXG4jIGBgYFxuI1xuIyBJbiBgJy9wYXRoL3RvL3Rhc2stZmlsZS5jb2ZmZWUnYDpcbiNcbiMgYGBgY29mZmVlXG4jIG1vZHVsZS5leHBvcnRzID0gKHBhcmFtZXRlcjEsIHBhcmFtZXRlcjIpIC0+XG4jICAgIyBJbmRpY2F0ZXMgdGhhdCB0aGlzIHRhc2sgd2lsbCBiZSBhc3luYy5cbiMgICAjIENhbGwgdGhlIGBjYWxsYmFja2AgdG8gZmluaXNoIHRoZSB0YXNrXG4jICAgY2FsbGJhY2sgPSBAYXN5bmMoKVxuI1xuIyAgIGVtaXQoJ3NvbWUtZXZlbnQtZnJvbS10aGUtdGFzaycsIHtzb21lU3RyaW5nOiAneWVwIHRoaXMgaXMgaXQnfSlcbiNcbiMgICBjYWxsYmFjaygpXG4jIGBgYFxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGFza1xuICAjIFB1YmxpYzogQSBoZWxwZXIgbWV0aG9kIHRvIGVhc2lseSBsYXVuY2ggYW5kIHJ1biBhIHRhc2sgb25jZS5cbiAgI1xuICAjICogYHRhc2tQYXRoYCBUaGUge1N0cmluZ30gcGF0aCB0byB0aGUgQ29mZmVlU2NyaXB0L0phdmFTY3JpcHQgZmlsZSB3aGljaFxuICAjICAgZXhwb3J0cyBhIHNpbmdsZSB7RnVuY3Rpb259IHRvIGV4ZWN1dGUuXG4gICMgKiBgYXJnc2AgVGhlIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBleHBvcnRlZCBmdW5jdGlvbi5cbiAgI1xuICAjIFJldHVybnMgdGhlIGNyZWF0ZWQge1Rhc2t9LlxuICBAb25jZTogKHRhc2tQYXRoLCBhcmdzLi4uKSAtPlxuICAgIHRhc2sgPSBuZXcgVGFzayh0YXNrUGF0aClcbiAgICB0YXNrLm9uY2UgJ3Rhc2s6Y29tcGxldGVkJywgLT4gdGFzay50ZXJtaW5hdGUoKVxuICAgIHRhc2suc3RhcnQoYXJncy4uLilcbiAgICB0YXNrXG5cbiAgIyBDYWxsZWQgdXBvbiB0YXNrIGNvbXBsZXRpb24uXG4gICNcbiAgIyBJdCByZWNlaXZlcyB0aGUgc2FtZSBhcmd1bWVudHMgdGhhdCB3ZXJlIHBhc3NlZCB0byB0aGUgdGFzay5cbiAgI1xuICAjIElmIHN1YmNsYXNzZWQsIHRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgb3ZlcnJpZGRlbi4gSG93ZXZlciBpZiB7OjpzdGFydH1cbiAgIyByZWNlaXZlcyBhIGNvbXBsZXRpb24gY2FsbGJhY2ssIHRoaXMgaXMgb3ZlcnJpZGRlbi5cbiAgY2FsbGJhY2s6IG51bGxcblxuICAjIFB1YmxpYzogQ3JlYXRlcyBhIHRhc2suIFlvdSBzaG91bGQgcHJvYmFibHkgdXNlIHsub25jZX1cbiAgI1xuICAjICogYHRhc2tQYXRoYCBUaGUge1N0cmluZ30gcGF0aCB0byB0aGUgQ29mZmVlU2NyaXB0L0phdmFTY3JpcHQgZmlsZSB0aGF0XG4gICMgICBleHBvcnRzIGEgc2luZ2xlIHtGdW5jdGlvbn0gdG8gZXhlY3V0ZS5cbiAgY29uc3RydWN0b3I6ICh0YXNrUGF0aCkgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICBjb21waWxlQ2FjaGVSZXF1aXJlID0gXCJyZXF1aXJlKCcje3JlcXVpcmUucmVzb2x2ZSgnLi9jb21waWxlLWNhY2hlJyl9JylcIlxuICAgIGNvbXBpbGVDYWNoZVBhdGggPSByZXF1aXJlKCcuL2NvbXBpbGUtY2FjaGUnKS5nZXRDYWNoZURpcmVjdG9yeSgpXG4gICAgdGFza0Jvb3RzdHJhcFJlcXVpcmUgPSBcInJlcXVpcmUoJyN7cmVxdWlyZS5yZXNvbHZlKCcuL3Rhc2stYm9vdHN0cmFwJyl9Jyk7XCJcbiAgICBib290c3RyYXAgPSBcIlwiXCJcbiAgICAgICN7Y29tcGlsZUNhY2hlUmVxdWlyZX0uc2V0Q2FjaGVEaXJlY3RvcnkoJyN7Y29tcGlsZUNhY2hlUGF0aH0nKTtcbiAgICAgICN7dGFza0Jvb3RzdHJhcFJlcXVpcmV9XG4gICAgXCJcIlwiXG4gICAgYm9vdHN0cmFwID0gYm9vdHN0cmFwLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKVxuXG4gICAgdGFza1BhdGggPSByZXF1aXJlLnJlc29sdmUodGFza1BhdGgpXG4gICAgdGFza1BhdGggPSB0YXNrUGF0aC5yZXBsYWNlKC9cXFxcL2csIFwiXFxcXFxcXFxcIilcblxuICAgIGVudiA9IF8uZXh0ZW5kKHt9LCBwcm9jZXNzLmVudiwge3Rhc2tQYXRoLCB1c2VyQWdlbnQ6IG5hdmlnYXRvci51c2VyQWdlbnR9KVxuICAgIEBjaGlsZFByb2Nlc3MgPSBDaGlsZFByb2Nlc3MuZm9yayAnLS1ldmFsJywgW2Jvb3RzdHJhcF0sIHtlbnYsIHNpbGVudDogdHJ1ZX1cblxuICAgIEBvbiBcInRhc2s6bG9nXCIsIC0+IGNvbnNvbGUubG9nKGFyZ3VtZW50cy4uLilcbiAgICBAb24gXCJ0YXNrOndhcm5cIiwgLT4gY29uc29sZS53YXJuKGFyZ3VtZW50cy4uLilcbiAgICBAb24gXCJ0YXNrOmVycm9yXCIsIC0+IGNvbnNvbGUuZXJyb3IoYXJndW1lbnRzLi4uKVxuICAgIEBvbiBcInRhc2s6ZGVwcmVjYXRpb25zXCIsIChkZXByZWNhdGlvbnMpIC0+XG4gICAgICBHcmltLmFkZFNlcmlhbGl6ZWREZXByZWNhdGlvbihkZXByZWNhdGlvbikgZm9yIGRlcHJlY2F0aW9uIGluIGRlcHJlY2F0aW9uc1xuICAgICAgcmV0dXJuXG4gICAgQG9uIFwidGFzazpjb21wbGV0ZWRcIiwgKGFyZ3MuLi4pID0+IEBjYWxsYmFjaz8oYXJncy4uLilcblxuICAgIEBoYW5kbGVFdmVudHMoKVxuXG4gICMgUm91dGVzIG1lc3NhZ2VzIGZyb20gdGhlIGNoaWxkIHRvIHRoZSBhcHByb3ByaWF0ZSBldmVudC5cbiAgaGFuZGxlRXZlbnRzOiAtPlxuICAgIEBjaGlsZFByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzKClcbiAgICBAY2hpbGRQcm9jZXNzLm9uICdtZXNzYWdlJywgKHtldmVudCwgYXJnc30pID0+XG4gICAgICBAZW1pdHRlci5lbWl0KGV2ZW50LCBhcmdzKSBpZiBAY2hpbGRQcm9jZXNzP1xuXG4gICAgIyBDYXRjaCB0aGUgZXJyb3JzIHRoYXQgaGFwcGVuZWQgYmVmb3JlIHRhc2stYm9vdHN0cmFwLlxuICAgIGlmIEBjaGlsZFByb2Nlc3Muc3Rkb3V0P1xuICAgICAgQGNoaWxkUHJvY2Vzcy5zdGRvdXQucmVtb3ZlQWxsTGlzdGVuZXJzKClcbiAgICAgIEBjaGlsZFByb2Nlc3Muc3Rkb3V0Lm9uICdkYXRhJywgKGRhdGEpIC0+IGNvbnNvbGUubG9nIGRhdGEudG9TdHJpbmcoKVxuXG4gICAgaWYgQGNoaWxkUHJvY2Vzcy5zdGRlcnI/XG4gICAgICBAY2hpbGRQcm9jZXNzLnN0ZGVyci5yZW1vdmVBbGxMaXN0ZW5lcnMoKVxuICAgICAgQGNoaWxkUHJvY2Vzcy5zdGRlcnIub24gJ2RhdGEnLCAoZGF0YSkgLT4gY29uc29sZS5lcnJvciBkYXRhLnRvU3RyaW5nKClcblxuICAjIFB1YmxpYzogU3RhcnRzIHRoZSB0YXNrLlxuICAjXG4gICMgVGhyb3dzIGFuIGVycm9yIGlmIHRoaXMgdGFzayBoYXMgYWxyZWFkeSBiZWVuIHRlcm1pbmF0ZWQgb3IgaWYgc2VuZGluZyBhXG4gICMgbWVzc2FnZSB0byB0aGUgY2hpbGQgcHJvY2VzcyBmYWlscy5cbiAgI1xuICAjICogYGFyZ3NgIFRoZSBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgZnVuY3Rpb24gZXhwb3J0ZWQgYnkgdGhpcyB0YXNrJ3Mgc2NyaXB0LlxuICAjICogYGNhbGxiYWNrYCAob3B0aW9uYWwpIEEge0Z1bmN0aW9ufSB0byBjYWxsIHdoZW4gdGhlIHRhc2sgY29tcGxldGVzLlxuICBzdGFydDogKGFyZ3MuLi4sIGNhbGxiYWNrKSAtPlxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHN0YXJ0IHRlcm1pbmF0ZWQgcHJvY2VzcycpIHVubGVzcyBAY2hpbGRQcm9jZXNzP1xuXG4gICAgQGhhbmRsZUV2ZW50cygpXG4gICAgaWYgXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKVxuICAgICAgQGNhbGxiYWNrID0gY2FsbGJhY2tcbiAgICBlbHNlXG4gICAgICBhcmdzLnB1c2goY2FsbGJhY2spXG4gICAgQHNlbmQoe2V2ZW50OiAnc3RhcnQnLCBhcmdzfSlcbiAgICB1bmRlZmluZWRcblxuICAjIFB1YmxpYzogU2VuZCBtZXNzYWdlIHRvIHRoZSB0YXNrLlxuICAjXG4gICMgVGhyb3dzIGFuIGVycm9yIGlmIHRoaXMgdGFzayBoYXMgYWxyZWFkeSBiZWVuIHRlcm1pbmF0ZWQgb3IgaWYgc2VuZGluZyBhXG4gICMgbWVzc2FnZSB0byB0aGUgY2hpbGQgcHJvY2VzcyBmYWlscy5cbiAgI1xuICAjICogYG1lc3NhZ2VgIFRoZSBtZXNzYWdlIHRvIHNlbmQgdG8gdGhlIHRhc2suXG4gIHNlbmQ6IChtZXNzYWdlKSAtPlxuICAgIGlmIEBjaGlsZFByb2Nlc3M/XG4gICAgICBAY2hpbGRQcm9jZXNzLnNlbmQobWVzc2FnZSlcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZW5kIG1lc3NhZ2UgdG8gdGVybWluYXRlZCBwcm9jZXNzJylcbiAgICB1bmRlZmluZWRcblxuICAjIFB1YmxpYzogQ2FsbCBhIGZ1bmN0aW9uIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZCBieSB0aGUgY2hpbGQgcHJvY2Vzc1xuICAjXG4gICMgKiBgZXZlbnROYW1lYCBUaGUge1N0cmluZ30gbmFtZSBvZiB0aGUgZXZlbnQgdG8gaGFuZGxlLlxuICAjICogYGNhbGxiYWNrYCBUaGUge0Z1bmN0aW9ufSB0byBjYWxsIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IHRoYXQgY2FuIGJlIHVzZWQgdG8gc3RvcCBsaXN0ZW5pbmcgZm9yIHRoZSBldmVudC5cbiAgb246IChldmVudE5hbWUsIGNhbGxiYWNrKSAtPiBAZW1pdHRlci5vbiBldmVudE5hbWUsIChhcmdzKSAtPiBjYWxsYmFjayhhcmdzLi4uKVxuXG4gIG9uY2U6IChldmVudE5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIGRpc3Bvc2FibGUgPSBAb24gZXZlbnROYW1lLCAoYXJncy4uLikgLT5cbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICBjYWxsYmFjayhhcmdzLi4uKVxuXG4gICMgUHVibGljOiBGb3JjZWZ1bGx5IHN0b3AgdGhlIHJ1bm5pbmcgdGFzay5cbiAgI1xuICAjIE5vIG1vcmUgZXZlbnRzIGFyZSBlbWl0dGVkIG9uY2UgdGhpcyBtZXRob2QgaXMgY2FsbGVkLlxuICB0ZXJtaW5hdGU6IC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAY2hpbGRQcm9jZXNzP1xuXG4gICAgQGNoaWxkUHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKVxuICAgIEBjaGlsZFByb2Nlc3Muc3Rkb3V0Py5yZW1vdmVBbGxMaXN0ZW5lcnMoKVxuICAgIEBjaGlsZFByb2Nlc3Muc3RkZXJyPy5yZW1vdmVBbGxMaXN0ZW5lcnMoKVxuICAgIEBjaGlsZFByb2Nlc3Mua2lsbCgpXG4gICAgQGNoaWxkUHJvY2VzcyA9IG51bGxcblxuICAgIHRydWVcblxuICBjYW5jZWw6IC0+XG4gICAgZGlkRm9yY2VmdWxseVRlcm1pbmF0ZSA9IEB0ZXJtaW5hdGUoKVxuICAgIGlmIGRpZEZvcmNlZnVsbHlUZXJtaW5hdGVcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ3Rhc2s6Y2FuY2VsbGVkJylcbiAgICBkaWRGb3JjZWZ1bGx5VGVybWluYXRlXG4iXX0=
