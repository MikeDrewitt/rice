(function() {
  var exitIfError, fs, getAttributes, getTags, path, request;

  path = require('path');

  fs = require('fs');

  request = require('request');

  exitIfError = function(error) {
    if (error != null) {
      console.error(error.message);
      return process.exit(1);
    }
  };

  getTags = function(callback) {
    var requestOptions;
    requestOptions = {
      url: 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlTags.json',
      json: true
    };
    return request(requestOptions, function(error, response, tags) {
      var options, ref, tag;
      if (error != null) {
        return callback(error);
      }
      if (response.statusCode !== 200) {
        return callback(new Error("Request for HtmlTags.json failed: " + response.statusCode));
      }
      for (tag in tags) {
        options = tags[tag];
        if (((ref = options.attributes) != null ? ref.length : void 0) === 0) {
          delete options.attributes;
        }
      }
      return callback(null, tags);
    });
  };

  getAttributes = function(callback) {
    var requestOptions;
    requestOptions = {
      url: 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/HTMLCodeHints/HtmlAttributes.json',
      json: true
    };
    return request(requestOptions, function(error, response, attributes) {
      var attribute, options, ref;
      if (error != null) {
        return callback(error);
      }
      if (response.statusCode !== 200) {
        return callback(new Error("Request for HtmlAttributes.json failed: " + response.statusCode));
      }
      for (attribute in attributes) {
        options = attributes[attribute];
        if (attribute.indexOf('/') !== -1) {
          delete attributes[attribute];
        }
        if (((ref = options.attribOption) != null ? ref.length : void 0) === 0) {
          delete options.attribOption;
        }
      }
      return callback(null, attributes);
    });
  };

  getTags(function(error, tags) {
    exitIfError(error);
    return getAttributes(function(error, attributes) {
      var completions;
      exitIfError(error);
      completions = {
        tags: tags,
        attributes: attributes
      };
      return fs.writeFileSync(path.join(__dirname, 'completions.json'), (JSON.stringify(completions, null, 0)) + "\n");
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtaHRtbC91cGRhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7RUFFVixXQUFBLEdBQWMsU0FBQyxLQUFEO0lBQ1osSUFBRyxhQUFIO01BQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxLQUFLLENBQUMsT0FBcEI7QUFDQSxhQUFPLE9BQU8sQ0FBQyxJQUFSLENBQWEsQ0FBYixFQUZUOztFQURZOztFQUtkLE9BQUEsR0FBVSxTQUFDLFFBQUQ7QUFDUixRQUFBO0lBQUEsY0FBQSxHQUNFO01BQUEsR0FBQSxFQUFLLDRHQUFMO01BQ0EsSUFBQSxFQUFNLElBRE47O1dBR0YsT0FBQSxDQUFRLGNBQVIsRUFBd0IsU0FBQyxLQUFELEVBQVEsUUFBUixFQUFrQixJQUFsQjtBQUN0QixVQUFBO01BQUEsSUFBMEIsYUFBMUI7QUFBQSxlQUFPLFFBQUEsQ0FBUyxLQUFULEVBQVA7O01BRUEsSUFBRyxRQUFRLENBQUMsVUFBVCxLQUF5QixHQUE1QjtBQUNFLGVBQU8sUUFBQSxDQUFhLElBQUEsS0FBQSxDQUFNLG9DQUFBLEdBQXFDLFFBQVEsQ0FBQyxVQUFwRCxDQUFiLEVBRFQ7O0FBR0EsV0FBQSxXQUFBOztRQUNFLDZDQUErQyxDQUFFLGdCQUFwQixLQUE4QixDQUEzRDtVQUFBLE9BQU8sT0FBTyxDQUFDLFdBQWY7O0FBREY7YUFHQSxRQUFBLENBQVMsSUFBVCxFQUFlLElBQWY7SUFUc0IsQ0FBeEI7RUFMUTs7RUFnQlYsYUFBQSxHQUFnQixTQUFDLFFBQUQ7QUFDZCxRQUFBO0lBQUEsY0FBQSxHQUNFO01BQUEsR0FBQSxFQUFLLGtIQUFMO01BQ0EsSUFBQSxFQUFNLElBRE47O1dBR0YsT0FBQSxDQUFRLGNBQVIsRUFBd0IsU0FBQyxLQUFELEVBQVEsUUFBUixFQUFrQixVQUFsQjtBQUN0QixVQUFBO01BQUEsSUFBMEIsYUFBMUI7QUFBQSxlQUFPLFFBQUEsQ0FBUyxLQUFULEVBQVA7O01BRUEsSUFBRyxRQUFRLENBQUMsVUFBVCxLQUF5QixHQUE1QjtBQUNFLGVBQU8sUUFBQSxDQUFhLElBQUEsS0FBQSxDQUFNLDBDQUFBLEdBQTJDLFFBQVEsQ0FBQyxVQUExRCxDQUFiLEVBRFQ7O0FBR0EsV0FBQSx1QkFBQTs7UUFDRSxJQUFnQyxTQUFTLENBQUMsT0FBVixDQUFrQixHQUFsQixDQUFBLEtBQTRCLENBQUMsQ0FBN0Q7VUFBQSxPQUFPLFVBQVcsQ0FBQSxTQUFBLEVBQWxCOztRQUNBLCtDQUFtRCxDQUFFLGdCQUF0QixLQUFnQyxDQUEvRDtVQUFBLE9BQU8sT0FBTyxDQUFDLGFBQWY7O0FBRkY7YUFJQSxRQUFBLENBQVMsSUFBVCxFQUFlLFVBQWY7SUFWc0IsQ0FBeEI7RUFMYzs7RUFpQmhCLE9BQUEsQ0FBUSxTQUFDLEtBQUQsRUFBUSxJQUFSO0lBQ04sV0FBQSxDQUFZLEtBQVo7V0FFQSxhQUFBLENBQWMsU0FBQyxLQUFELEVBQVEsVUFBUjtBQUNaLFVBQUE7TUFBQSxXQUFBLENBQVksS0FBWjtNQUVBLFdBQUEsR0FBYztRQUFDLE1BQUEsSUFBRDtRQUFPLFlBQUEsVUFBUDs7YUFDZCxFQUFFLENBQUMsYUFBSCxDQUFpQixJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsa0JBQXJCLENBQWpCLEVBQTZELENBQUMsSUFBSSxDQUFDLFNBQUwsQ0FBZSxXQUFmLEVBQTRCLElBQTVCLEVBQWtDLENBQWxDLENBQUQsQ0FBQSxHQUFzQyxJQUFuRztJQUpZLENBQWQ7RUFITSxDQUFSO0FBMUNBIiwic291cmNlc0NvbnRlbnQiOlsiIyBSdW4gdGhpcyB0byB1cGRhdGUgdGhlIHN0YXRpYyBsaXN0IG9mIHRhZy9hdHRyaWJ1dGVzIHN0b3JlZCBpbiB0aGlzIHBhY2thZ2Unc1xuIyBwYWNrYWdlLmpzb24gZmlsZS5cblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucmVxdWVzdCA9IHJlcXVpcmUgJ3JlcXVlc3QnXG5cbmV4aXRJZkVycm9yID0gKGVycm9yKSAtPlxuICBpZiBlcnJvcj9cbiAgICBjb25zb2xlLmVycm9yKGVycm9yLm1lc3NhZ2UpXG4gICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxuXG5nZXRUYWdzID0gKGNhbGxiYWNrKSAtPlxuICByZXF1ZXN0T3B0aW9ucyA9XG4gICAgdXJsOiAnaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2Fkb2JlL2JyYWNrZXRzL21hc3Rlci9zcmMvZXh0ZW5zaW9ucy9kZWZhdWx0L0hUTUxDb2RlSGludHMvSHRtbFRhZ3MuanNvbidcbiAgICBqc29uOiB0cnVlXG5cbiAgcmVxdWVzdCByZXF1ZXN0T3B0aW9ucywgKGVycm9yLCByZXNwb25zZSwgdGFncykgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpIGlmIGVycm9yP1xuXG4gICAgaWYgcmVzcG9uc2Uuc3RhdHVzQ29kZSBpc250IDIwMFxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIlJlcXVlc3QgZm9yIEh0bWxUYWdzLmpzb24gZmFpbGVkOiAje3Jlc3BvbnNlLnN0YXR1c0NvZGV9XCIpKVxuXG4gICAgZm9yIHRhZywgb3B0aW9ucyBvZiB0YWdzXG4gICAgICBkZWxldGUgb3B0aW9ucy5hdHRyaWJ1dGVzIGlmIG9wdGlvbnMuYXR0cmlidXRlcz8ubGVuZ3RoIGlzIDBcblxuICAgIGNhbGxiYWNrKG51bGwsIHRhZ3MpXG5cbmdldEF0dHJpYnV0ZXMgPSAoY2FsbGJhY2spIC0+XG4gIHJlcXVlc3RPcHRpb25zID1cbiAgICB1cmw6ICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYWRvYmUvYnJhY2tldHMvbWFzdGVyL3NyYy9leHRlbnNpb25zL2RlZmF1bHQvSFRNTENvZGVIaW50cy9IdG1sQXR0cmlidXRlcy5qc29uJ1xuICAgIGpzb246IHRydWVcblxuICByZXF1ZXN0IHJlcXVlc3RPcHRpb25zLCAoZXJyb3IsIHJlc3BvbnNlLCBhdHRyaWJ1dGVzKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayhlcnJvcikgaWYgZXJyb3I/XG5cbiAgICBpZiByZXNwb25zZS5zdGF0dXNDb2RlIGlzbnQgMjAwXG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiUmVxdWVzdCBmb3IgSHRtbEF0dHJpYnV0ZXMuanNvbiBmYWlsZWQ6ICN7cmVzcG9uc2Uuc3RhdHVzQ29kZX1cIikpXG5cbiAgICBmb3IgYXR0cmlidXRlLCBvcHRpb25zIG9mIGF0dHJpYnV0ZXNcbiAgICAgIGRlbGV0ZSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gaWYgYXR0cmlidXRlLmluZGV4T2YoJy8nKSBpc250IC0xXG4gICAgICBkZWxldGUgb3B0aW9ucy5hdHRyaWJPcHRpb24gaWYgb3B0aW9ucy5hdHRyaWJPcHRpb24/Lmxlbmd0aCBpcyAwXG5cbiAgICBjYWxsYmFjayhudWxsLCBhdHRyaWJ1dGVzKVxuXG5nZXRUYWdzIChlcnJvciwgdGFncykgLT5cbiAgZXhpdElmRXJyb3IoZXJyb3IpXG5cbiAgZ2V0QXR0cmlidXRlcyAoZXJyb3IsIGF0dHJpYnV0ZXMpIC0+XG4gICAgZXhpdElmRXJyb3IoZXJyb3IpXG5cbiAgICBjb21wbGV0aW9ucyA9IHt0YWdzLCBhdHRyaWJ1dGVzfVxuICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2NvbXBsZXRpb25zLmpzb24nKSwgXCIje0pTT04uc3RyaW5naWZ5KGNvbXBsZXRpb25zLCBudWxsLCAwKX1cXG5cIilcbiJdfQ==
