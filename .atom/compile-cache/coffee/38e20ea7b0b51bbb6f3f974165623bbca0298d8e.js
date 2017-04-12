(function() {
  var PathReplacer;

  PathReplacer = require('scandal').PathReplacer;

  module.exports = function(filePaths, regexSource, regexFlags, replacementText) {
    var callback, regex, replacer;
    callback = this.async();
    replacer = new PathReplacer();
    regex = new RegExp(regexSource, regexFlags);
    replacer.on('file-error', function(arg) {
      var code, message, path;
      code = arg.code, path = arg.path, message = arg.message;
      return emit('replace:file-error', {
        code: code,
        path: path,
        message: message
      });
    });
    replacer.on('path-replaced', function(result) {
      return emit('replace:path-replaced', result);
    });
    return replacer.replacePaths(regex, replacementText, filePaths, function() {
      return callback();
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9yZXBsYWNlLWhhbmRsZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxlQUFnQixPQUFBLENBQVEsU0FBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxTQUFELEVBQVksV0FBWixFQUF5QixVQUF6QixFQUFxQyxlQUFyQztBQUNmLFFBQUE7SUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUVYLFFBQUEsR0FBZSxJQUFBLFlBQUEsQ0FBQTtJQUNmLEtBQUEsR0FBWSxJQUFBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CLFVBQXBCO0lBRVosUUFBUSxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLFNBQUMsR0FBRDtBQUN4QixVQUFBO01BRDBCLGlCQUFNLGlCQUFNO2FBQ3RDLElBQUEsQ0FBSyxvQkFBTCxFQUEyQjtRQUFDLE1BQUEsSUFBRDtRQUFPLE1BQUEsSUFBUDtRQUFhLFNBQUEsT0FBYjtPQUEzQjtJQUR3QixDQUExQjtJQUdBLFFBQVEsQ0FBQyxFQUFULENBQVksZUFBWixFQUE2QixTQUFDLE1BQUQ7YUFDM0IsSUFBQSxDQUFLLHVCQUFMLEVBQThCLE1BQTlCO0lBRDJCLENBQTdCO1dBR0EsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsS0FBdEIsRUFBNkIsZUFBN0IsRUFBOEMsU0FBOUMsRUFBeUQsU0FBQTthQUFHLFFBQUEsQ0FBQTtJQUFILENBQXpEO0VBWmU7QUFGakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UGF0aFJlcGxhY2VyfSA9IHJlcXVpcmUgJ3NjYW5kYWwnXG5cbm1vZHVsZS5leHBvcnRzID0gKGZpbGVQYXRocywgcmVnZXhTb3VyY2UsIHJlZ2V4RmxhZ3MsIHJlcGxhY2VtZW50VGV4dCkgLT5cbiAgY2FsbGJhY2sgPSBAYXN5bmMoKVxuXG4gIHJlcGxhY2VyID0gbmV3IFBhdGhSZXBsYWNlcigpXG4gIHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleFNvdXJjZSwgcmVnZXhGbGFncylcblxuICByZXBsYWNlci5vbiAnZmlsZS1lcnJvcicsICh7Y29kZSwgcGF0aCwgbWVzc2FnZX0pIC0+XG4gICAgZW1pdCgncmVwbGFjZTpmaWxlLWVycm9yJywge2NvZGUsIHBhdGgsIG1lc3NhZ2V9KVxuXG4gIHJlcGxhY2VyLm9uICdwYXRoLXJlcGxhY2VkJywgKHJlc3VsdCkgLT5cbiAgICBlbWl0KCdyZXBsYWNlOnBhdGgtcmVwbGFjZWQnLCByZXN1bHQpXG5cbiAgcmVwbGFjZXIucmVwbGFjZVBhdGhzKHJlZ2V4LCByZXBsYWNlbWVudFRleHQsIGZpbGVQYXRocywgLT4gY2FsbGJhY2soKSlcbiJdfQ==
