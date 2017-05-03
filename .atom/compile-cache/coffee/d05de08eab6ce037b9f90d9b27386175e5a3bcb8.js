(function() {
  var PackageGeneratorView;

  PackageGeneratorView = require('./package-generator-view');

  module.exports = {
    activate: function() {
      return this.view = new PackageGeneratorView();
    },
    deactivate: function() {
      var ref;
      return (ref = this.view) != null ? ref.destroy() : void 0;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9wYWNrYWdlLWdlbmVyYXRvci9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLG9CQUFBLEdBQXVCLE9BQUEsQ0FBUSwwQkFBUjs7RUFFdkIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLElBQUQsR0FBWSxJQUFBLG9CQUFBLENBQUE7SUFESixDQUFWO0lBR0EsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBOzRDQUFLLENBQUUsT0FBUCxDQUFBO0lBRFUsQ0FIWjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbIlBhY2thZ2VHZW5lcmF0b3JWaWV3ID0gcmVxdWlyZSAnLi9wYWNrYWdlLWdlbmVyYXRvci12aWV3J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPlxuICAgIEB2aWV3ID0gbmV3IFBhY2thZ2VHZW5lcmF0b3JWaWV3KClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEB2aWV3Py5kZXN0cm95KClcbiJdfQ==
