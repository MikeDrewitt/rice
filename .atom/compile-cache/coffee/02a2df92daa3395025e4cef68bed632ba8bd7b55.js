(function() {
  module.exports = {
    activate: function() {
      var BackgroundTipsView;
      BackgroundTipsView = require('./background-tips-view');
      return this.backgroundTipsView = new BackgroundTipsView();
    },
    deactivate: function() {
      return this.backgroundTipsView.destroy();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9iYWNrZ3JvdW5kLXRpcHMvbGliL2JhY2tncm91bmQtdGlwcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHdCQUFSO2FBQ3JCLElBQUMsQ0FBQSxrQkFBRCxHQUEwQixJQUFBLGtCQUFBLENBQUE7SUFGbEIsQ0FBVjtJQUlBLFVBQUEsRUFBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLGtCQUFrQixDQUFDLE9BQXBCLENBQUE7SUFEVSxDQUpaOztBQURGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBCYWNrZ3JvdW5kVGlwc1ZpZXcgPSByZXF1aXJlICcuL2JhY2tncm91bmQtdGlwcy12aWV3J1xuICAgIEBiYWNrZ3JvdW5kVGlwc1ZpZXcgPSBuZXcgQmFja2dyb3VuZFRpcHNWaWV3KClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBiYWNrZ3JvdW5kVGlwc1ZpZXcuZGVzdHJveSgpXG4iXX0=
