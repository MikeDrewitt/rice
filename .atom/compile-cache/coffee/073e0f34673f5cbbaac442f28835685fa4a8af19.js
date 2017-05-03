(function() {
  module.exports = {
    reporter: null,
    queue: [],
    setReporter: function(reporter) {
      var event, i, len, ref;
      this.reporter = reporter;
      ref = this.queue;
      for (i = 0, len = ref.length; i < len; i++) {
        event = ref[i];
        this.reporter.sendEvent.apply(this.reporter, event);
      }
      return this.queue = [];
    },
    sendEvent: function(action, label, value) {
      if (this.reporter) {
        return this.reporter.sendEvent('welcome-v1', action, label, value);
      } else {
        return this.queue.push(['welcome-v1', action, label, value]);
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93ZWxjb21lL2xpYi9yZXBvcnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFDQSxLQUFBLEVBQU8sRUFEUDtJQUdBLFdBQUEsRUFBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7QUFDWjtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBcEIsQ0FBMEIsSUFBQyxDQUFBLFFBQTNCLEVBQXFDLEtBQXJDO0FBREY7YUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTO0lBSEUsQ0FIYjtJQVFBLFNBQUEsRUFBVyxTQUFDLE1BQUQsRUFBUyxLQUFULEVBQWdCLEtBQWhCO01BQ1QsSUFBRyxJQUFDLENBQUEsUUFBSjtlQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFvQixZQUFwQixFQUFrQyxNQUFsQyxFQUEwQyxLQUExQyxFQUFpRCxLQUFqRCxFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLENBQUMsWUFBRCxFQUFlLE1BQWYsRUFBdUIsS0FBdkIsRUFBOEIsS0FBOUIsQ0FBWixFQUhGOztJQURTLENBUlg7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIHJlcG9ydGVyOiBudWxsXG4gIHF1ZXVlOiBbXVxuXG4gIHNldFJlcG9ydGVyOiAoQHJlcG9ydGVyKSAtPlxuICAgIGZvciBldmVudCBpbiBAcXVldWVcbiAgICAgIEByZXBvcnRlci5zZW5kRXZlbnQuYXBwbHkoQHJlcG9ydGVyLCBldmVudClcbiAgICBAcXVldWUgPSBbXVxuXG4gIHNlbmRFdmVudDogKGFjdGlvbiwgbGFiZWwsIHZhbHVlKSAtPlxuICAgIGlmIEByZXBvcnRlclxuICAgICAgQHJlcG9ydGVyLnNlbmRFdmVudCgnd2VsY29tZS12MScsIGFjdGlvbiwgbGFiZWwsIHZhbHVlKVxuICAgIGVsc2VcbiAgICAgIEBxdWV1ZS5wdXNoKFsnd2VsY29tZS12MScsIGFjdGlvbiwgbGFiZWwsIHZhbHVlXSlcbiJdfQ==
