(function() {
  var provider;

  provider = require('./provider');

  module.exports = {
    activate: function() {
      return provider.loadCompletions();
    },
    getProvider: function() {
      return provider;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtaHRtbC9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFFWCxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7YUFBRyxRQUFRLENBQUMsZUFBVCxDQUFBO0lBQUgsQ0FBVjtJQUVBLFdBQUEsRUFBYSxTQUFBO2FBQUc7SUFBSCxDQUZiOztBQUhGIiwic291cmNlc0NvbnRlbnQiOlsicHJvdmlkZXIgPSByZXF1aXJlICcuL3Byb3ZpZGVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPiBwcm92aWRlci5sb2FkQ29tcGxldGlvbnMoKVxuXG4gIGdldFByb3ZpZGVyOiAtPiBwcm92aWRlclxuIl19
