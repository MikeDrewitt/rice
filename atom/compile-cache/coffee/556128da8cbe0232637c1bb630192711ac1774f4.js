(function() {
  var markdown, marked, renderer;

  marked = require('marked');

  renderer = new marked.Renderer();

  renderer.code = function() {
    return '';
  };

  renderer.blockquote = function() {
    return '';
  };

  renderer.heading = function() {
    return '';
  };

  renderer.html = function() {
    return '';
  };

  renderer.image = function() {
    return '';
  };

  renderer.list = function() {
    return '';
  };

  markdown = function(text) {
    return marked(text, {
      renderer: renderer
    }).replace(/<p>(.*)<\/p>/, "$1").trim();
  };

  module.exports = {
    getSettingDescription: function(keyPath) {
      var description, ref;
      description = ((ref = atom.config.getSchema(keyPath)) != null ? ref.description : void 0) || '';
      return markdown(description);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9yaWNoLWRlc2NyaXB0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUVULFFBQUEsR0FBZSxJQUFBLE1BQU0sQ0FBQyxRQUFQLENBQUE7O0VBQ2YsUUFBUSxDQUFDLElBQVQsR0FBZ0IsU0FBQTtXQUFHO0VBQUg7O0VBQ2hCLFFBQVEsQ0FBQyxVQUFULEdBQXNCLFNBQUE7V0FBRztFQUFIOztFQUN0QixRQUFRLENBQUMsT0FBVCxHQUFtQixTQUFBO1dBQUc7RUFBSDs7RUFDbkIsUUFBUSxDQUFDLElBQVQsR0FBZ0IsU0FBQTtXQUFHO0VBQUg7O0VBQ2hCLFFBQVEsQ0FBQyxLQUFULEdBQWlCLFNBQUE7V0FBRztFQUFIOztFQUNqQixRQUFRLENBQUMsSUFBVCxHQUFnQixTQUFBO1dBQUc7RUFBSDs7RUFFaEIsUUFBQSxHQUFXLFNBQUMsSUFBRDtXQUNULE1BQUEsQ0FBTyxJQUFQLEVBQWE7TUFBQSxRQUFBLEVBQVUsUUFBVjtLQUFiLENBQWdDLENBQUMsT0FBakMsQ0FBeUMsY0FBekMsRUFBeUQsSUFBekQsQ0FBOEQsQ0FBQyxJQUEvRCxDQUFBO0VBRFM7O0VBR1gsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLHFCQUFBLEVBQXVCLFNBQUMsT0FBRDtBQUNyQixVQUFBO01BQUEsV0FBQSx3REFBNEMsQ0FBRSxxQkFBaEMsSUFBK0M7YUFDN0QsUUFBQSxDQUFTLFdBQVQ7SUFGcUIsQ0FBdkI7O0FBZEYiLCJzb3VyY2VzQ29udGVudCI6WyJtYXJrZWQgPSByZXF1aXJlICdtYXJrZWQnXG5cbnJlbmRlcmVyID0gbmV3IG1hcmtlZC5SZW5kZXJlcigpXG5yZW5kZXJlci5jb2RlID0gLT4gJydcbnJlbmRlcmVyLmJsb2NrcXVvdGUgPSAtPiAnJ1xucmVuZGVyZXIuaGVhZGluZyA9IC0+ICcnXG5yZW5kZXJlci5odG1sID0gLT4gJydcbnJlbmRlcmVyLmltYWdlID0gLT4gJydcbnJlbmRlcmVyLmxpc3QgPSAtPiAnJ1xuXG5tYXJrZG93biA9ICh0ZXh0KSAtPlxuICBtYXJrZWQodGV4dCwgcmVuZGVyZXI6IHJlbmRlcmVyKS5yZXBsYWNlKC88cD4oLiopPFxcL3A+LywgXCIkMVwiKS50cmltKClcblxubW9kdWxlLmV4cG9ydHMgPVxuICBnZXRTZXR0aW5nRGVzY3JpcHRpb246IChrZXlQYXRoKSAtPlxuICAgIGRlc2NyaXB0aW9uID0gYXRvbS5jb25maWcuZ2V0U2NoZW1hKGtleVBhdGgpPy5kZXNjcmlwdGlvbiBvciAnJ1xuICAgIG1hcmtkb3duKGRlc2NyaXB0aW9uKVxuIl19
