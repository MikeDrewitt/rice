(function() {
  var MarkerObservationWindow;

  module.exports = MarkerObservationWindow = (function() {
    function MarkerObservationWindow(decorationManager, bufferWindow) {
      this.decorationManager = decorationManager;
      this.bufferWindow = bufferWindow;
    }

    MarkerObservationWindow.prototype.setScreenRange = function(range) {
      return this.bufferWindow.setRange(this.decorationManager.bufferRangeForScreenRange(range));
    };

    MarkerObservationWindow.prototype.setBufferRange = function(range) {
      return this.bufferWindow.setRange(range);
    };

    MarkerObservationWindow.prototype.destroy = function() {
      return this.bufferWindow.destroy();
    };

    return MarkerObservationWindow;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYXJrZXItb2JzZXJ2YXRpb24td2luZG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGlDQUFDLGlCQUFELEVBQXFCLFlBQXJCO01BQUMsSUFBQyxDQUFBLG9CQUFEO01BQW9CLElBQUMsQ0FBQSxlQUFEO0lBQXJCOztzQ0FFYixjQUFBLEdBQWdCLFNBQUMsS0FBRDthQUNkLElBQUMsQ0FBQSxZQUFZLENBQUMsUUFBZCxDQUF1QixJQUFDLENBQUEsaUJBQWlCLENBQUMseUJBQW5CLENBQTZDLEtBQTdDLENBQXZCO0lBRGM7O3NDQUdoQixjQUFBLEdBQWdCLFNBQUMsS0FBRDthQUNkLElBQUMsQ0FBQSxZQUFZLENBQUMsUUFBZCxDQUF1QixLQUF2QjtJQURjOztzQ0FHaEIsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsWUFBWSxDQUFDLE9BQWQsQ0FBQTtJQURPOzs7OztBQVZYIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgTWFya2VyT2JzZXJ2YXRpb25XaW5kb3dcbiAgY29uc3RydWN0b3I6IChAZGVjb3JhdGlvbk1hbmFnZXIsIEBidWZmZXJXaW5kb3cpIC0+XG5cbiAgc2V0U2NyZWVuUmFuZ2U6IChyYW5nZSkgLT5cbiAgICBAYnVmZmVyV2luZG93LnNldFJhbmdlKEBkZWNvcmF0aW9uTWFuYWdlci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHJhbmdlKSlcblxuICBzZXRCdWZmZXJSYW5nZTogKHJhbmdlKSAtPlxuICAgIEBidWZmZXJXaW5kb3cuc2V0UmFuZ2UocmFuZ2UpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAYnVmZmVyV2luZG93LmRlc3Ryb3koKVxuIl19
