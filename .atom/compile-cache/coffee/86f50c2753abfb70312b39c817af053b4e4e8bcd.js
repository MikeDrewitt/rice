(function() {
  var ChildProcess;

  ChildProcess = require('child_process');

  exports.spawn = function(command, args, callback) {
    var error, spawnedProcess, stdout;
    stdout = '';
    try {
      spawnedProcess = ChildProcess.spawn(command, args);
    } catch (error1) {
      error = error1;
      process.nextTick(function() {
        return typeof callback === "function" ? callback(error, stdout) : void 0;
      });
      return;
    }
    spawnedProcess.stdout.on('data', function(data) {
      return stdout += data;
    });
    error = null;
    spawnedProcess.on('error', function(processError) {
      return error != null ? error : error = processError;
    });
    spawnedProcess.on('close', function(code, signal) {
      if (code !== 0) {
        if (error == null) {
          error = new Error("Command failed: " + (signal != null ? signal : code));
        }
      }
      if (error != null) {
        if (error.code == null) {
          error.code = code;
        }
      }
      if (error != null) {
        if (error.stdout == null) {
          error.stdout = stdout;
        }
      }
      return typeof callback === "function" ? callback(error, stdout) : void 0;
    });
    return spawnedProcess.stdin.end();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3Mvc3Bhd25lci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFlBQUEsR0FBZSxPQUFBLENBQVEsZUFBUjs7RUFjZixPQUFPLENBQUMsS0FBUixHQUFnQixTQUFDLE9BQUQsRUFBVSxJQUFWLEVBQWdCLFFBQWhCO0FBQ2QsUUFBQTtJQUFBLE1BQUEsR0FBUztBQUVUO01BQ0UsY0FBQSxHQUFpQixZQUFZLENBQUMsS0FBYixDQUFtQixPQUFuQixFQUE0QixJQUE1QixFQURuQjtLQUFBLGNBQUE7TUFFTTtNQUVKLE9BQU8sQ0FBQyxRQUFSLENBQWlCLFNBQUE7Z0RBQUcsU0FBVSxPQUFPO01BQXBCLENBQWpCO0FBQ0EsYUFMRjs7SUFPQSxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQXRCLENBQXlCLE1BQXpCLEVBQWlDLFNBQUMsSUFBRDthQUFVLE1BQUEsSUFBVTtJQUFwQixDQUFqQztJQUVBLEtBQUEsR0FBUTtJQUNSLGNBQWMsQ0FBQyxFQUFmLENBQWtCLE9BQWxCLEVBQTJCLFNBQUMsWUFBRDs2QkFBa0IsUUFBQSxRQUFTO0lBQTNCLENBQTNCO0lBQ0EsY0FBYyxDQUFDLEVBQWYsQ0FBa0IsT0FBbEIsRUFBMkIsU0FBQyxJQUFELEVBQU8sTUFBUDtNQUN6QixJQUEwRCxJQUFBLEtBQVUsQ0FBcEU7O1VBQUEsUUFBYSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFrQixrQkFBQyxTQUFTLElBQVYsQ0FBeEI7U0FBYjs7OztVQUNBLEtBQUssQ0FBRSxPQUFROzs7OztVQUNmLEtBQUssQ0FBRSxTQUFVOzs7OENBQ2pCLFNBQVUsT0FBTztJQUpRLENBQTNCO1dBT0EsY0FBYyxDQUFDLEtBQUssQ0FBQyxHQUFyQixDQUFBO0VBckJjO0FBZGhCIiwic291cmNlc0NvbnRlbnQiOlsiQ2hpbGRQcm9jZXNzID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcblxuIyBTcGF3biBhIGNvbW1hbmQgYW5kIGludm9rZSB0aGUgY2FsbGJhY2sgd2hlbiBpdCBjb21wbGV0ZXMgd2l0aCBhbiBlcnJvclxuIyBhbmQgdGhlIG91dHB1dCBmcm9tIHN0YW5kYXJkIG91dC5cbiNcbiMgKiBgY29tbWFuZGAgICAgVGhlIHVuZGVybHlpbmcgT1MgY29tbWFuZCB7U3RyaW5nfSB0byBleGVjdXRlLlxuIyAqIGBhcmdzYCAob3B0aW9uYWwpIFRoZSB7QXJyYXl9IHdpdGggYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBjb21tYW5kLlxuIyAqIGBjYWxsYmFja2AgKG9wdGlvbmFsKSBUaGUge0Z1bmN0aW9ufSB0byBjYWxsIGFmdGVyIHRoZSBjb21tYW5kIGhhcyBydW4uIEl0IHdpbGwgYmUgaW52b2tlZCB3aXRoIGFyZ3VtZW50czpcbiMgICAqIGBlcnJvcmAgKG9wdGlvbmFsKSBBbiB7RXJyb3J9IG9iamVjdCByZXR1cm5lZCBieSB0aGUgY29tbWFuZCwgYG51bGxgIGlmIG5vIGVycm9yIHdhcyB0aHJvd24uXG4jICAgICAqIGBjb2RlYCBFcnJvciBjb2RlIHJldHVybmVkIGJ5IHRoZSBjb21tYW5kLlxuIyAgICAgKiBgc3Rkb3V0YCAgVGhlIHtTdHJpbmd9IG91dHB1dCB0ZXh0IGdlbmVyYXRlZCBieSB0aGUgY29tbWFuZC5cbiMgICAqIGBzdGRvdXRgICBUaGUge1N0cmluZ30gb3V0cHV0IHRleHQgZ2VuZXJhdGVkIGJ5IHRoZSBjb21tYW5kLlxuI1xuIyBSZXR1cm5zIGB1bmRlZmluZWRgLlxuZXhwb3J0cy5zcGF3biA9IChjb21tYW5kLCBhcmdzLCBjYWxsYmFjaykgLT5cbiAgc3Rkb3V0ID0gJydcblxuICB0cnlcbiAgICBzcGF3bmVkUHJvY2VzcyA9IENoaWxkUHJvY2Vzcy5zcGF3bihjb21tYW5kLCBhcmdzKVxuICBjYXRjaCBlcnJvclxuICAgICMgU3Bhd24gY2FuIHRocm93IGFuIGVycm9yXG4gICAgcHJvY2Vzcy5uZXh0VGljayAtPiBjYWxsYmFjaz8oZXJyb3IsIHN0ZG91dClcbiAgICByZXR1cm5cblxuICBzcGF3bmVkUHJvY2Vzcy5zdGRvdXQub24gJ2RhdGEnLCAoZGF0YSkgLT4gc3Rkb3V0ICs9IGRhdGFcblxuICBlcnJvciA9IG51bGxcbiAgc3Bhd25lZFByb2Nlc3Mub24gJ2Vycm9yJywgKHByb2Nlc3NFcnJvcikgLT4gZXJyb3IgPz0gcHJvY2Vzc0Vycm9yXG4gIHNwYXduZWRQcm9jZXNzLm9uICdjbG9zZScsIChjb2RlLCBzaWduYWwpIC0+XG4gICAgZXJyb3IgPz0gbmV3IEVycm9yKFwiQ29tbWFuZCBmYWlsZWQ6ICN7c2lnbmFsID8gY29kZX1cIikgaWYgY29kZSBpc250IDBcbiAgICBlcnJvcj8uY29kZSA/PSBjb2RlXG4gICAgZXJyb3I/LnN0ZG91dCA/PSBzdGRvdXRcbiAgICBjYWxsYmFjaz8oZXJyb3IsIHN0ZG91dClcbiAgIyBUaGlzIGlzIG5lY2Vzc2FyeSBpZiB1c2luZyBQb3dlcnNoZWxsIDIgb24gV2luZG93cyA3IHRvIGdldCB0aGUgZXZlbnRzIHRvIHJhaXNlXG4gICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MTU1Mjg5L2NhbGxpbmctcG93ZXJzaGVsbC1mcm9tLW5vZGVqc1xuICBzcGF3bmVkUHJvY2Vzcy5zdGRpbi5lbmQoKVxuIl19
