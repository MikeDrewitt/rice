(function() {
  var SpellCheckTask, idCounter;

  idCounter = 0;

  module.exports = SpellCheckTask = (function() {
    SpellCheckTask.handler = null;

    SpellCheckTask.callbacksById = {};

    function SpellCheckTask(task) {
      this.task = task;
      this.id = idCounter++;
    }

    SpellCheckTask.prototype.terminate = function() {
      return delete this.constructor.callbacksById[this.id];
    };

    SpellCheckTask.prototype.start = function(buffer) {
      var args, projectPath, ref, ref1, ref2, relativePath;
      projectPath = null;
      relativePath = null;
      if (buffer != null ? (ref = buffer.file) != null ? ref.path : void 0 : void 0) {
        ref1 = atom.project.relativizePath(buffer.file.path), projectPath = ref1[0], relativePath = ref1[1];
      }
      args = {
        id: this.id,
        projectPath: projectPath,
        relativePath: relativePath,
        text: buffer.getText()
      };
      return (ref2 = this.task) != null ? ref2.start(args, this.constructor.dispatchMisspellings) : void 0;
    };

    SpellCheckTask.prototype.onDidSpellCheck = function(callback) {
      return this.constructor.callbacksById[this.id] = callback;
    };

    SpellCheckTask.dispatchMisspellings = function(data) {
      var base, name;
      return typeof (base = SpellCheckTask.callbacksById)[name = data.id] === "function" ? base[name](data.misspellings) : void 0;
    };

    return SpellCheckTask;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvc3BlbGwtY2hlY2stdGFzay5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFNBQUEsR0FBWTs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osY0FBQyxDQUFBLE9BQUQsR0FBVTs7SUFDVixjQUFDLENBQUEsYUFBRCxHQUFnQjs7SUFFSCx3QkFBQyxJQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFDWixJQUFDLENBQUEsRUFBRCxHQUFNLFNBQUE7SUFESzs7NkJBR2IsU0FBQSxHQUFXLFNBQUE7YUFDVCxPQUFPLElBQUMsQ0FBQSxXQUFXLENBQUMsYUFBYyxDQUFBLElBQUMsQ0FBQSxFQUFEO0lBRHpCOzs2QkFHWCxLQUFBLEdBQU8sU0FBQyxNQUFEO0FBRUwsVUFBQTtNQUFBLFdBQUEsR0FBYztNQUNkLFlBQUEsR0FBZTtNQUNmLHNEQUFlLENBQUUsc0JBQWpCO1FBQ0UsT0FBOEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBeEMsQ0FBOUIsRUFBQyxxQkFBRCxFQUFjLHVCQURoQjs7TUFJQSxJQUFBLEdBQU87UUFDTCxFQUFBLEVBQUksSUFBQyxDQUFBLEVBREE7UUFFTCxhQUFBLFdBRks7UUFHTCxjQUFBLFlBSEs7UUFJTCxJQUFBLEVBQU0sTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUpEOzs4Q0FNRixDQUFFLEtBQVAsQ0FBYSxJQUFiLEVBQW1CLElBQUMsQ0FBQSxXQUFXLENBQUMsb0JBQWhDO0lBZEs7OzZCQWdCUCxlQUFBLEdBQWlCLFNBQUMsUUFBRDthQUNmLElBQUMsQ0FBQSxXQUFXLENBQUMsYUFBYyxDQUFBLElBQUMsQ0FBQSxFQUFELENBQTNCLEdBQWtDO0lBRG5COztJQUdqQixjQUFDLENBQUEsb0JBQUQsR0FBdUIsU0FBQyxJQUFEO0FBQ3JCLFVBQUE7c0dBQXlCLElBQUksQ0FBQztJQURUOzs7OztBQWhDekIiLCJzb3VyY2VzQ29udGVudCI6WyJpZENvdW50ZXIgPSAwXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFNwZWxsQ2hlY2tUYXNrXG4gIEBoYW5kbGVyOiBudWxsXG4gIEBjYWxsYmFja3NCeUlkOiB7fVxuXG4gIGNvbnN0cnVjdG9yOiAoQHRhc2spIC0+XG4gICAgQGlkID0gaWRDb3VudGVyKytcblxuICB0ZXJtaW5hdGU6IC0+XG4gICAgZGVsZXRlIEBjb25zdHJ1Y3Rvci5jYWxsYmFja3NCeUlkW0BpZF1cblxuICBzdGFydDogKGJ1ZmZlcikgLT5cbiAgICAjIEZpZ3VyZSBvdXQgdGhlIHBhdGhzIHNpbmNlIHdlIG5lZWQgdGhhdCBmb3IgY2hlY2tlcnMgdGhhdCBhcmUgcHJvamVjdC1zcGVjaWZpYy5cbiAgICBwcm9qZWN0UGF0aCA9IG51bGxcbiAgICByZWxhdGl2ZVBhdGggPSBudWxsXG4gICAgaWYgYnVmZmVyPy5maWxlPy5wYXRoXG4gICAgICBbcHJvamVjdFBhdGgsIHJlbGF0aXZlUGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoYnVmZmVyLmZpbGUucGF0aClcblxuICAgICMgU3VibWl0IHRoZSBzcGVsbCBjaGVjayByZXF1ZXN0IHRvIHRoZSBiYWNrZ3JvdW5kIHRhc2suXG4gICAgYXJncyA9IHtcbiAgICAgIGlkOiBAaWQsXG4gICAgICBwcm9qZWN0UGF0aCxcbiAgICAgIHJlbGF0aXZlUGF0aCxcbiAgICAgIHRleHQ6IGJ1ZmZlci5nZXRUZXh0KClcbiAgICB9XG4gICAgQHRhc2s/LnN0YXJ0IGFyZ3MsIEBjb25zdHJ1Y3Rvci5kaXNwYXRjaE1pc3NwZWxsaW5nc1xuXG4gIG9uRGlkU3BlbGxDaGVjazogKGNhbGxiYWNrKSAtPlxuICAgIEBjb25zdHJ1Y3Rvci5jYWxsYmFja3NCeUlkW0BpZF0gPSBjYWxsYmFja1xuXG4gIEBkaXNwYXRjaE1pc3NwZWxsaW5nczogKGRhdGEpID0+XG4gICAgQGNhbGxiYWNrc0J5SWRbZGF0YS5pZF0/KGRhdGEubWlzc3BlbGxpbmdzKVxuIl19
