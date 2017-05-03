(function() {
  var convertMethodToSuggestion, convertPropertyToSuggestion, fs, getDocLink, isVisible, path, request, requestOptions, textComparator;

  path = require('path');

  fs = require('fs');

  request = require('request');

  requestOptions = {
    url: 'https://api.github.com/repos/atom/atom/releases/latest',
    json: true,
    headers: {
      'User-Agent': 'agent'
    }
  };

  request(requestOptions, function(error, response, release) {
    var apiAsset, apiRequestOptions;
    if (error != null) {
      console.error(error.message);
      return process.exit(1);
    }
    apiAsset = release.assets.filter(function(arg1) {
      var name;
      name = arg1.name;
      return name === 'atom-api.json';
    })[0];
    if (!(apiAsset != null ? apiAsset.browser_download_url : void 0)) {
      console.error('No atom-api.json asset found in latest release');
      return process.exit(1);
    }
    apiRequestOptions = {
      json: true,
      url: apiAsset.browser_download_url
    };
    return request(apiRequestOptions, function(error, response, atomApi) {
      var classes, instanceMethods, instanceProperties, methods, name, pluckMethodAttributes, pluckPropertyAttributes, properties, publicClasses, ref;
      if (error != null) {
        console.error(error.message);
        return process.exit(1);
      }
      classes = atomApi.classes;
      publicClasses = {};
      for (name in classes) {
        ref = classes[name], instanceProperties = ref.instanceProperties, instanceMethods = ref.instanceMethods;
        pluckPropertyAttributes = convertPropertyToSuggestion.bind(this, name);
        pluckMethodAttributes = convertMethodToSuggestion.bind(this, name);
        properties = instanceProperties.filter(isVisible).map(pluckPropertyAttributes).sort(textComparator);
        methods = instanceMethods.filter(isVisible).map(pluckMethodAttributes).sort(textComparator);
        if ((properties != null ? properties.length : void 0) > 0 || methods.length > 0) {
          publicClasses[name] = properties.concat(methods);
        }
      }
      return fs.writeFileSync('completions.json', JSON.stringify(publicClasses));
    });
  });

  isVisible = function(arg1) {
    var visibility;
    visibility = arg1.visibility;
    return visibility === 'Essential' || visibility === 'Extended' || visibility === 'Public';
  };

  convertMethodToSuggestion = function(className, method) {
    var arg, args, description, descriptionMoreURL, i, j, len, name, ref, returnValue, returnValues, snippet, snippets, summary, text;
    name = method.name, summary = method.summary, returnValues = method.returnValues;
    args = method['arguments'];
    snippets = [];
    if (args != null ? args.length : void 0) {
      for (i = j = 0, len = args.length; j < len; i = ++j) {
        arg = args[i];
        snippets.push("${" + (i + 1) + ":" + arg.name + "}");
      }
    }
    text = null;
    snippet = null;
    if (snippets.length) {
      snippet = name + "(" + (snippets.join(', ')) + ")";
    } else {
      text = name + "()";
    }
    returnValue = returnValues != null ? (ref = returnValues[0]) != null ? ref.type : void 0 : void 0;
    description = summary;
    descriptionMoreURL = getDocLink(className, name);
    return {
      name: name,
      text: text,
      snippet: snippet,
      description: description,
      descriptionMoreURL: descriptionMoreURL,
      leftLabel: returnValue,
      type: 'method'
    };
  };

  convertPropertyToSuggestion = function(className, arg1) {
    var description, descriptionMoreURL, name, ref, returnValue, summary, text;
    name = arg1.name, summary = arg1.summary;
    text = name;
    returnValue = summary != null ? (ref = summary.match(/\{(\w+)\}/)) != null ? ref[1] : void 0 : void 0;
    description = summary;
    descriptionMoreURL = getDocLink(className, name);
    return {
      name: name,
      text: text,
      description: description,
      descriptionMoreURL: descriptionMoreURL,
      leftLabel: returnValue,
      type: 'property'
    };
  };

  getDocLink = function(className, instanceName) {
    return "https://atom.io/docs/api/latest/" + className + "#instance-" + instanceName;
  };

  textComparator = function(a, b) {
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }
    return 0;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtYXRvbS1hcGkvdXBkYXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBRVYsY0FBQSxHQUNFO0lBQUEsR0FBQSxFQUFLLHdEQUFMO0lBQ0EsSUFBQSxFQUFNLElBRE47SUFFQSxPQUFBLEVBQ0U7TUFBQSxZQUFBLEVBQWMsT0FBZDtLQUhGOzs7RUFLRixPQUFBLENBQVEsY0FBUixFQUF3QixTQUFDLEtBQUQsRUFBUSxRQUFSLEVBQWtCLE9BQWxCO0FBQ3RCLFFBQUE7SUFBQSxJQUFHLGFBQUg7TUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLEtBQUssQ0FBQyxPQUFwQjtBQUNBLGFBQU8sT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiLEVBRlQ7O0lBSUMsV0FBWSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQWYsQ0FBc0IsU0FBQyxJQUFEO0FBQVksVUFBQTtNQUFWLE9BQUQ7YUFBVyxJQUFBLEtBQVE7SUFBcEIsQ0FBdEI7SUFFYixJQUFBLHFCQUFPLFFBQVEsQ0FBRSw4QkFBakI7TUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLGdEQUFkO0FBQ0EsYUFBTyxPQUFPLENBQUMsSUFBUixDQUFhLENBQWIsRUFGVDs7SUFJQSxpQkFBQSxHQUNFO01BQUEsSUFBQSxFQUFNLElBQU47TUFDQSxHQUFBLEVBQUssUUFBUSxDQUFDLG9CQURkOztXQUdGLE9BQUEsQ0FBUSxpQkFBUixFQUEyQixTQUFDLEtBQUQsRUFBUSxRQUFSLEVBQWtCLE9BQWxCO0FBQ3pCLFVBQUE7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RUFPOUIsVUFBQSxHQUFhLFNBQUMsU0FBRCxFQUFZLFlBQVo7V0FDWCxrQ0FBQSxHQUFtQyxTQUFuQyxHQUE2QyxZQUE3QyxHQUF5RDtFQUQ5Qzs7RUFHYixjQUFBLEdBQWlCLFNBQUMsQ0FBRCxFQUFJLENBQUo7SUFDZixJQUFZLENBQUMsQ0FBQyxJQUFGLEdBQVMsQ0FBQyxDQUFDLElBQXZCO0FBQUEsYUFBTyxFQUFQOztJQUNBLElBQWEsQ0FBQyxDQUFDLElBQUYsR0FBUyxDQUFDLENBQUMsSUFBeEI7QUFBQSxhQUFPLENBQUMsRUFBUjs7V0FDQTtFQUhlO0FBOUVqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgUnVuIHRoaXMgdG8gdXBkYXRlIHRoZSBzdGF0aWMgbGlzdCBvZiBwcm9wZXJ0aWVzIHN0b3JlZCBpbiB0aGVcbiMgY29tcGxldGlvbnMuanNvbiBmaWxlIGF0IHRoZSByb290IG9mIHRoaXMgcmVwb3NpdG9yeS5cblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucmVxdWVzdCA9IHJlcXVpcmUgJ3JlcXVlc3QnXG5cbnJlcXVlc3RPcHRpb25zID1cbiAgdXJsOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hdG9tL2F0b20vcmVsZWFzZXMvbGF0ZXN0J1xuICBqc29uOiB0cnVlXG4gIGhlYWRlcnM6XG4gICAgJ1VzZXItQWdlbnQnOiAnYWdlbnQnXG5cbnJlcXVlc3QgcmVxdWVzdE9wdGlvbnMsIChlcnJvciwgcmVzcG9uc2UsIHJlbGVhc2UpIC0+XG4gIGlmIGVycm9yP1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IubWVzc2FnZSlcbiAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDEpXG5cbiAgW2FwaUFzc2V0XSA9IHJlbGVhc2UuYXNzZXRzLmZpbHRlciAoe25hbWV9KSAtPiBuYW1lIGlzICdhdG9tLWFwaS5qc29uJ1xuXG4gIHVubGVzcyBhcGlBc3NldD8uYnJvd3Nlcl9kb3dubG9hZF91cmxcbiAgICBjb25zb2xlLmVycm9yKCdObyBhdG9tLWFwaS5qc29uIGFzc2V0IGZvdW5kIGluIGxhdGVzdCByZWxlYXNlJylcbiAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDEpXG5cbiAgYXBpUmVxdWVzdE9wdGlvbnMgPVxuICAgIGpzb246IHRydWVcbiAgICB1cmw6IGFwaUFzc2V0LmJyb3dzZXJfZG93bmxvYWRfdXJsXG5cbiAgcmVxdWVzdCBhcGlSZXF1ZXN0T3B0aW9ucywgKGVycm9yLCByZXNwb25zZSwgYXRvbUFwaSkgLT5cbiAgICBpZiBlcnJvcj9cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IubWVzc2FnZSlcbiAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcblxuICAgIHtjbGFzc2VzfSA9IGF0b21BcGlcblxuICAgIHB1YmxpY0NsYXNzZXMgPSB7fVxuICAgIGZvciBuYW1lLCB7aW5zdGFuY2VQcm9wZXJ0aWVzLCBpbnN0YW5jZU1ldGhvZHN9IG9mIGNsYXNzZXNcbiAgICAgIHBsdWNrUHJvcGVydHlBdHRyaWJ1dGVzID0gY29udmVydFByb3BlcnR5VG9TdWdnZXN0aW9uLmJpbmQodGhpcywgbmFtZSlcbiAgICAgIHBsdWNrTWV0aG9kQXR0cmlidXRlcyA9IGNvbnZlcnRNZXRob2RUb1N1Z2dlc3Rpb24uYmluZCh0aGlzLCBuYW1lKVxuICAgICAgcHJvcGVydGllcyA9IGluc3RhbmNlUHJvcGVydGllcy5maWx0ZXIoaXNWaXNpYmxlKS5tYXAocGx1Y2tQcm9wZXJ0eUF0dHJpYnV0ZXMpLnNvcnQodGV4dENvbXBhcmF0b3IpXG4gICAgICBtZXRob2RzID0gaW5zdGFuY2VNZXRob2RzLmZpbHRlcihpc1Zpc2libGUpLm1hcChwbHVja01ldGhvZEF0dHJpYnV0ZXMpLnNvcnQodGV4dENvbXBhcmF0b3IpXG5cbiAgICAgIGlmIHByb3BlcnRpZXM/Lmxlbmd0aCA+IDAgb3IgbWV0aG9kcy5sZW5ndGggPiAwXG4gICAgICAgIHB1YmxpY0NsYXNzZXNbbmFtZV0gPSBwcm9wZXJ0aWVzLmNvbmNhdChtZXRob2RzKVxuXG4gICAgZnMud3JpdGVGaWxlU3luYygnY29tcGxldGlvbnMuanNvbicsIEpTT04uc3RyaW5naWZ5KHB1YmxpY0NsYXNzZXMpKVxuXG5pc1Zpc2libGUgPSAoe3Zpc2liaWxpdHl9KSAtPlxuICB2aXNpYmlsaXR5IGluIFsnRXNzZW50aWFsJywgJ0V4dGVuZGVkJywgJ1B1YmxpYyddXG5cbmNvbnZlcnRNZXRob2RUb1N1Z2dlc3Rpb24gPSAoY2xhc3NOYW1lLCBtZXRob2QpIC0+XG4gIHtuYW1lLCBzdW1tYXJ5LCByZXR1cm5WYWx1ZXN9ID0gbWV0aG9kXG4gIGFyZ3MgPSBtZXRob2RbJ2FyZ3VtZW50cyddXG5cbiAgc25pcHBldHMgPSBbXVxuICBpZiBhcmdzPy5sZW5ndGhcbiAgICBmb3IgYXJnLCBpIGluIGFyZ3NcbiAgICAgIHNuaXBwZXRzLnB1c2goXCIkeyN7aSsxfToje2FyZy5uYW1lfX1cIilcblxuICB0ZXh0ID0gbnVsbFxuICBzbmlwcGV0ID0gbnVsbFxuICBpZiBzbmlwcGV0cy5sZW5ndGhcbiAgICBzbmlwcGV0ID0gXCIje25hbWV9KCN7c25pcHBldHMuam9pbignLCAnKX0pXCJcbiAgZWxzZVxuICAgIHRleHQgPSBcIiN7bmFtZX0oKVwiXG5cbiAgcmV0dXJuVmFsdWUgPSByZXR1cm5WYWx1ZXM/WzBdPy50eXBlXG4gIGRlc2NyaXB0aW9uID0gc3VtbWFyeVxuICBkZXNjcmlwdGlvbk1vcmVVUkwgPSBnZXREb2NMaW5rKGNsYXNzTmFtZSwgbmFtZSlcbiAge25hbWUsIHRleHQsIHNuaXBwZXQsIGRlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbk1vcmVVUkwsIGxlZnRMYWJlbDogcmV0dXJuVmFsdWUsIHR5cGU6ICdtZXRob2QnfVxuXG5jb252ZXJ0UHJvcGVydHlUb1N1Z2dlc3Rpb24gPSAoY2xhc3NOYW1lLCB7bmFtZSwgc3VtbWFyeX0pIC0+XG4gIHRleHQgPSBuYW1lXG4gIHJldHVyblZhbHVlID0gc3VtbWFyeT8ubWF0Y2goL1xceyhcXHcrKVxcfS8pP1sxXVxuICBkZXNjcmlwdGlvbiA9IHN1bW1hcnlcbiAgZGVzY3JpcHRpb25Nb3JlVVJMID0gZ2V0RG9jTGluayhjbGFzc05hbWUsIG5hbWUpXG4gIHtuYW1lLCB0ZXh0LCBkZXNjcmlwdGlvbiwgZGVzY3JpcHRpb25Nb3JlVVJMLCBsZWZ0TGFiZWw6IHJldHVyblZhbHVlLCB0eXBlOiAncHJvcGVydHknfVxuXG5nZXREb2NMaW5rID0gKGNsYXNzTmFtZSwgaW5zdGFuY2VOYW1lKSAtPlxuICBcImh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS9sYXRlc3QvI3tjbGFzc05hbWV9I2luc3RhbmNlLSN7aW5zdGFuY2VOYW1lfVwiXG5cbnRleHRDb21wYXJhdG9yID0gKGEsIGIpIC0+XG4gIHJldHVybiAxIGlmIGEubmFtZSA+IGIubmFtZVxuICByZXR1cm4gLTEgaWYgYS5uYW1lIDwgYi5uYW1lXG4gIDBcbiJdfQ==
