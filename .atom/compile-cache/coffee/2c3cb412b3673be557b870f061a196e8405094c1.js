(function() {
  var CSON, FunctionsURL, Promise, functionsPromise, path, request, sanitizeFunc;

  path = require('path');

  request = require('request');

  Promise = require('bluebird');

  CSON = require('season');

  FunctionsURL = 'https://raw.githubusercontent.com/less/less-docs/master/content/functions/data/functions.json';

  functionsPromise = new Promise(function(resolve) {
    return request({
      json: true,
      url: FunctionsURL
    }, function(error, response, properties) {
      if (error != null) {
        console.error(error.message);
        resolve(null);
      }
      if (response.statusCode !== 200) {
        console.error("Request failed: " + response.statusCode);
        resolve(null);
      }
      return resolve(properties);
    });
  });

  functionsPromise.then(function(results) {
    var builtins, config, configPath, func, functionType, functions, i, len, suggestions;
    suggestions = [];
    for (functionType in results) {
      functions = results[functionType];
      for (i = 0, len = functions.length; i < len; i++) {
        func = functions[i];
        suggestions.push({
          type: 'function',
          rightLabel: 'Less Builtin',
          snippet: sanitizeFunc(func.example),
          description: func.description,
          descriptionMoreURL: "http://lesscss.org/functions/#" + functionType + "-" + func.name
        });
      }
    }
    configPath = path.join(__dirname, 'settings', 'language-less.cson');
    config = CSON.readFileSync(configPath);
    builtins = config['.source.css.less .meta.property-value'].autocomplete.symbols.builtins;
    builtins.suggestions = suggestions;
    return CSON.writeFileSync(configPath, config);
  });

  sanitizeFunc = function(functionExample) {
    var argsRe;
    functionExample = functionExample.replace(';', '');
    functionExample = functionExample.replace(/\[, /g, ', [');
    functionExample = functionExample.replace(/\,] /g, '], ');
    argsRe = /\(([^\)]+)\)/;
    functionExample = functionExample.replace(argsRe, function(args) {
      var arg, index;
      args = argsRe.exec(args)[1];
      args = args.split(',');
      args = (function() {
        var i, len, results1;
        results1 = [];
        for (index = i = 0, len = args.length; i < len; index = ++i) {
          arg = args[index];
          results1.push("${" + (index + 1) + ":" + (arg.trim()) + "}");
        }
        return results1;
      })();
      return "(" + (args.join(', ')) + ")${" + (index + 1) + ":;}";
    });
    return functionExample + "$0";
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9sYW5ndWFnZS1sZXNzL3VwZGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztFQUNWLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFUCxZQUFBLEdBQWU7O0VBRWYsZ0JBQUEsR0FBdUIsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFEO1dBQzdCLE9BQUEsQ0FBUTtNQUFDLElBQUEsRUFBTSxJQUFQO01BQWEsR0FBQSxFQUFLLFlBQWxCO0tBQVIsRUFBeUMsU0FBQyxLQUFELEVBQVEsUUFBUixFQUFrQixVQUFsQjtNQUN2QyxJQUFHLGFBQUg7UUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLEtBQUssQ0FBQyxPQUFwQjtRQUNBLE9BQUEsQ0FBUSxJQUFSLEVBRkY7O01BR0EsSUFBRyxRQUFRLENBQUMsVUFBVCxLQUF5QixHQUE1QjtRQUNFLE9BQU8sQ0FBQyxLQUFSLENBQWMsa0JBQUEsR0FBbUIsUUFBUSxDQUFDLFVBQTFDO1FBQ0EsT0FBQSxDQUFRLElBQVIsRUFGRjs7YUFHQSxPQUFBLENBQVEsVUFBUjtJQVB1QyxDQUF6QztFQUQ2QixDQUFSOztFQVV2QixnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQixTQUFDLE9BQUQ7QUFDcEIsUUFBQTtJQUFBLFdBQUEsR0FBYztBQUNkLFNBQUEsdUJBQUE7O0FBQ0UsV0FBQSwyQ0FBQTs7UUFDRSxXQUFXLENBQUMsSUFBWixDQUNFO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFDQSxVQUFBLEVBQVksY0FEWjtVQUVBLE9BQUEsRUFBUyxZQUFBLENBQWEsSUFBSSxDQUFDLE9BQWxCLENBRlQ7VUFHQSxXQUFBLEVBQWEsSUFBSSxDQUFDLFdBSGxCO1VBSUEsa0JBQUEsRUFBb0IsZ0NBQUEsR0FBaUMsWUFBakMsR0FBOEMsR0FBOUMsR0FBaUQsSUFBSSxDQUFDLElBSjFFO1NBREY7QUFERjtBQURGO0lBU0EsVUFBQSxHQUFhLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixVQUFyQixFQUFpQyxvQkFBakM7SUFDYixNQUFBLEdBQVMsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsVUFBbEI7SUFDVCxRQUFBLEdBQVcsTUFBTyxDQUFBLHVDQUFBLENBQXdDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztJQUNoRixRQUFRLENBQUMsV0FBVCxHQUF1QjtXQUN2QixJQUFJLENBQUMsYUFBTCxDQUFtQixVQUFuQixFQUErQixNQUEvQjtFQWZvQixDQUF0Qjs7RUFpQkEsWUFBQSxHQUFlLFNBQUMsZUFBRDtBQUNiLFFBQUE7SUFBQSxlQUFBLEdBQWtCLGVBQWUsQ0FBQyxPQUFoQixDQUF3QixHQUF4QixFQUE2QixFQUE3QjtJQUNsQixlQUFBLEdBQWtCLGVBQWUsQ0FBQyxPQUFoQixDQUF3QixPQUF4QixFQUFpQyxLQUFqQztJQUNsQixlQUFBLEdBQWtCLGVBQWUsQ0FBQyxPQUFoQixDQUF3QixPQUF4QixFQUFpQyxLQUFqQztJQUVsQixNQUFBLEdBQVM7SUFDVCxlQUFBLEdBQWtCLGVBQWUsQ0FBQyxPQUFoQixDQUF3QixNQUF4QixFQUFnQyxTQUFDLElBQUQ7QUFDaEQsVUFBQTtNQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBa0IsQ0FBQSxDQUFBO01BQ3pCLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVg7TUFDUCxJQUFBOztBQUFRO2FBQUEsc0RBQUE7O3dCQUFBLElBQUEsR0FBSSxDQUFDLEtBQUEsR0FBUSxDQUFULENBQUosR0FBZSxHQUFmLEdBQWlCLENBQUMsR0FBRyxDQUFDLElBQUosQ0FBQSxDQUFELENBQWpCLEdBQTZCO0FBQTdCOzs7YUFDUixHQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBTCxDQUFVLElBQVYsQ0FBRCxDQUFILEdBQW9CLEtBQXBCLEdBQXdCLENBQUMsS0FBQSxHQUFNLENBQVAsQ0FBeEIsR0FBaUM7SUFKZSxDQUFoQztXQU1mLGVBQUQsR0FBaUI7RUFaTjtBQWxDZiIsInNvdXJjZXNDb250ZW50IjpbIiMgUnVuIHRoaXMgdG8gdXBkYXRlIHRoZSBsaXN0IG9mIGJ1aWx0aW4gbGVzcyBmdW5jdGlvbnNcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5yZXF1ZXN0ID0gcmVxdWlyZSAncmVxdWVzdCdcblByb21pc2UgPSByZXF1aXJlICdibHVlYmlyZCdcbkNTT04gPSByZXF1aXJlICdzZWFzb24nXG5cbkZ1bmN0aW9uc1VSTCA9ICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbGVzcy9sZXNzLWRvY3MvbWFzdGVyL2NvbnRlbnQvZnVuY3Rpb25zL2RhdGEvZnVuY3Rpb25zLmpzb24nXG5cbmZ1bmN0aW9uc1Byb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgLT5cbiAgcmVxdWVzdCB7anNvbjogdHJ1ZSwgdXJsOiBGdW5jdGlvbnNVUkx9LCAoZXJyb3IsIHJlc3BvbnNlLCBwcm9wZXJ0aWVzKSAtPlxuICAgIGlmIGVycm9yP1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvci5tZXNzYWdlKVxuICAgICAgcmVzb2x2ZShudWxsKVxuICAgIGlmIHJlc3BvbnNlLnN0YXR1c0NvZGUgaXNudCAyMDBcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1ZXN0IGZhaWxlZDogI3tyZXNwb25zZS5zdGF0dXNDb2RlfVwiKVxuICAgICAgcmVzb2x2ZShudWxsKVxuICAgIHJlc29sdmUocHJvcGVydGllcylcblxuZnVuY3Rpb25zUHJvbWlzZS50aGVuIChyZXN1bHRzKSAtPlxuICBzdWdnZXN0aW9ucyA9IFtdXG4gIGZvciBmdW5jdGlvblR5cGUsIGZ1bmN0aW9ucyBvZiByZXN1bHRzXG4gICAgZm9yIGZ1bmMgaW4gZnVuY3Rpb25zXG4gICAgICBzdWdnZXN0aW9ucy5wdXNoXG4gICAgICAgIHR5cGU6ICdmdW5jdGlvbidcbiAgICAgICAgcmlnaHRMYWJlbDogJ0xlc3MgQnVpbHRpbidcbiAgICAgICAgc25pcHBldDogc2FuaXRpemVGdW5jKGZ1bmMuZXhhbXBsZSlcbiAgICAgICAgZGVzY3JpcHRpb246IGZ1bmMuZGVzY3JpcHRpb25cbiAgICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcImh0dHA6Ly9sZXNzY3NzLm9yZy9mdW5jdGlvbnMvIyN7ZnVuY3Rpb25UeXBlfS0je2Z1bmMubmFtZX1cIlxuXG4gIGNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2V0dGluZ3MnLCAnbGFuZ3VhZ2UtbGVzcy5jc29uJylcbiAgY29uZmlnID0gQ1NPTi5yZWFkRmlsZVN5bmMoY29uZmlnUGF0aClcbiAgYnVpbHRpbnMgPSBjb25maWdbJy5zb3VyY2UuY3NzLmxlc3MgLm1ldGEucHJvcGVydHktdmFsdWUnXS5hdXRvY29tcGxldGUuc3ltYm9scy5idWlsdGluc1xuICBidWlsdGlucy5zdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zXG4gIENTT04ud3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCBjb25maWcpXG5cbnNhbml0aXplRnVuYyA9IChmdW5jdGlvbkV4YW1wbGUpIC0+XG4gIGZ1bmN0aW9uRXhhbXBsZSA9IGZ1bmN0aW9uRXhhbXBsZS5yZXBsYWNlKCc7JywgJycpXG4gIGZ1bmN0aW9uRXhhbXBsZSA9IGZ1bmN0aW9uRXhhbXBsZS5yZXBsYWNlKC9cXFssIC9nLCAnLCBbJylcbiAgZnVuY3Rpb25FeGFtcGxlID0gZnVuY3Rpb25FeGFtcGxlLnJlcGxhY2UoL1xcLF0gL2csICddLCAnKVxuXG4gIGFyZ3NSZSA9IC9cXCgoW15cXCldKylcXCkvXG4gIGZ1bmN0aW9uRXhhbXBsZSA9IGZ1bmN0aW9uRXhhbXBsZS5yZXBsYWNlIGFyZ3NSZSwgKGFyZ3MpIC0+XG4gICAgYXJncyA9IGFyZ3NSZS5leGVjKGFyZ3MpWzFdXG4gICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKVxuICAgIGFyZ3MgPSAoXCIkeyN7aW5kZXggKyAxfToje2FyZy50cmltKCl9fVwiIGZvciBhcmcsIGluZGV4IGluIGFyZ3MpXG4gICAgXCIoI3thcmdzLmpvaW4oJywgJyl9KSR7I3tpbmRleCsxfTo7fVwiXG5cbiAgXCIje2Z1bmN0aW9uRXhhbXBsZX0kMFwiXG4iXX0=
