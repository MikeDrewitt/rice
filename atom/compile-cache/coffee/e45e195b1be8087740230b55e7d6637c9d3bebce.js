(function() {
  var Promise, PropertiesURL, fetchPropertyDescriptions, fs, path, propertiesPromise, propertyDescriptionsPromise, request;

  path = require('path');

  fs = require('fs');

  request = require('request');

  Promise = require('bluebird');

  fetchPropertyDescriptions = require('./fetch-property-docs');

  PropertiesURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/CSSCodeHints/CSSProperties.json';

  propertyDescriptionsPromise = fetchPropertyDescriptions();

  propertiesPromise = new Promise(function(resolve) {
    return request({
      json: true,
      url: PropertiesURL
    }, function(error, response, properties) {
      if (error != null) {
        console.error(error.message);
        resolve(null);
      }
      if (response.statusCode !== 200) {
        console.error("Request for CSSProperties.json failed: " + response.statusCode);
        resolve(null);
      }
      return resolve(properties);
    });
  });

  Promise.settle([propertiesPromise, propertyDescriptionsPromise]).then(function(results) {
    var completions, i, len, metadata, properties, propertiesRaw, propertyDescriptions, propertyName, pseudoSelectors, sortedPropertyNames, tags;
    properties = {};
    propertiesRaw = results[0].value();
    propertyDescriptions = results[1].value();
    sortedPropertyNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'sorted-property-names.json')));
    for (i = 0, len = sortedPropertyNames.length; i < len; i++) {
      propertyName = sortedPropertyNames[i];
      if (!(metadata = propertiesRaw[propertyName])) {
        continue;
      }
      metadata.description = propertyDescriptions[propertyName];
      properties[propertyName] = metadata;
      if (propertyDescriptions[propertyName] == null) {
        console.warn("No description for property " + propertyName);
      }
    }
    for (propertyName in propertiesRaw) {
      if (sortedPropertyNames.indexOf(propertyName) < 0) {
        console.warn("Ignoring " + propertyName + "; not in sorted-property-names.json");
      }
    }
    tags = JSON.parse(fs.readFileSync(path.join(__dirname, 'html-tags.json')));
    pseudoSelectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'pseudo-selectors.json')));
    completions = {
      tags: tags,
      properties: properties,
      pseudoSelectors: pseudoSelectors
    };
    return fs.writeFileSync(path.join(__dirname, 'completions.json'), (JSON.stringify(completions, null, '  ')) + "\n");
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtY3NzL3VwZGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0E7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsT0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztFQUNWLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7RUFDVix5QkFBQSxHQUE0QixPQUFBLENBQVEsdUJBQVI7O0VBRTVCLGFBQUEsR0FBZ0I7O0VBRWhCLDJCQUFBLEdBQThCLHlCQUFBLENBQUE7O0VBQzlCLGlCQUFBLEdBQXdCLElBQUEsT0FBQSxDQUFRLFNBQUMsT0FBRDtXQUM5QixPQUFBLENBQVE7TUFBQyxJQUFBLEVBQU0sSUFBUDtNQUFhLEdBQUEsRUFBSyxhQUFsQjtLQUFSLEVBQTBDLFNBQUMsS0FBRCxFQUFRLFFBQVIsRUFBa0IsVUFBbEI7TUFDeEMsSUFBRyxhQUFIO1FBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxLQUFLLENBQUMsT0FBcEI7UUFDQSxPQUFBLENBQVEsSUFBUixFQUZGOztNQUdBLElBQUcsUUFBUSxDQUFDLFVBQVQsS0FBeUIsR0FBNUI7UUFDRSxPQUFPLENBQUMsS0FBUixDQUFjLHlDQUFBLEdBQTBDLFFBQVEsQ0FBQyxVQUFqRTtRQUNBLE9BQUEsQ0FBUSxJQUFSLEVBRkY7O2FBR0EsT0FBQSxDQUFRLFVBQVI7SUFQd0MsQ0FBMUM7RUFEOEIsQ0FBUjs7RUFVeEIsT0FBTyxDQUFDLE1BQVIsQ0FBZSxDQUFDLGlCQUFELEVBQW9CLDJCQUFwQixDQUFmLENBQWdFLENBQUMsSUFBakUsQ0FBc0UsU0FBQyxPQUFEO0FBQ3BFLFFBQUE7SUFBQSxVQUFBLEdBQWE7SUFDYixhQUFBLEdBQWdCLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxLQUFYLENBQUE7SUFDaEIsb0JBQUEsR0FBdUIsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQVgsQ0FBQTtJQUN2QixtQkFBQSxHQUFzQixJQUFJLENBQUMsS0FBTCxDQUFXLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw0QkFBckIsQ0FBaEIsQ0FBWDtBQUN0QixTQUFBLHFEQUFBOztNQUNFLElBQUEsQ0FBZ0IsQ0FBQSxRQUFBLEdBQVcsYUFBYyxDQUFBLFlBQUEsQ0FBekIsQ0FBaEI7QUFBQSxpQkFBQTs7TUFDQSxRQUFRLENBQUMsV0FBVCxHQUF1QixvQkFBcUIsQ0FBQSxZQUFBO01BQzVDLFVBQVcsQ0FBQSxZQUFBLENBQVgsR0FBMkI7TUFDM0IsSUFBa0UsMENBQWxFO1FBQUEsT0FBTyxDQUFDLElBQVIsQ0FBYSw4QkFBQSxHQUErQixZQUE1QyxFQUFBOztBQUpGO0FBTUEsU0FBQSw2QkFBQTtNQUNFLElBQThFLG1CQUFtQixDQUFDLE9BQXBCLENBQTRCLFlBQTVCLENBQUEsR0FBNEMsQ0FBMUg7UUFBQSxPQUFPLENBQUMsSUFBUixDQUFhLFdBQUEsR0FBWSxZQUFaLEdBQXlCLHFDQUF0QyxFQUFBOztBQURGO0lBR0EsSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVcsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLGdCQUFyQixDQUFoQixDQUFYO0lBQ1AsZUFBQSxHQUFrQixJQUFJLENBQUMsS0FBTCxDQUFXLEVBQUUsQ0FBQyxZQUFILENBQWdCLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQix1QkFBckIsQ0FBaEIsQ0FBWDtJQUVsQixXQUFBLEdBQWM7TUFBQyxNQUFBLElBQUQ7TUFBTyxZQUFBLFVBQVA7TUFBbUIsaUJBQUEsZUFBbkI7O1dBQ2QsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLGtCQUFyQixDQUFqQixFQUE2RCxDQUFDLElBQUksQ0FBQyxTQUFMLENBQWUsV0FBZixFQUE0QixJQUE1QixFQUFrQyxJQUFsQyxDQUFELENBQUEsR0FBeUMsSUFBdEc7RUFsQm9FLENBQXRFO0FBbkJBIiwic291cmNlc0NvbnRlbnQiOlsiIyBSdW4gdGhpcyB0byB1cGRhdGUgdGhlIHN0YXRpYyBsaXN0IG9mIHByb3BlcnRpZXMgc3RvcmVkIGluIHRoZSBwcm9wZXJ0aWVzLmpzb25cbiMgZmlsZSBhdCB0aGUgcm9vdCBvZiB0aGlzIHJlcG9zaXRvcnkuXG5cbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcydcbnJlcXVlc3QgPSByZXF1aXJlICdyZXF1ZXN0J1xuUHJvbWlzZSA9IHJlcXVpcmUgJ2JsdWViaXJkJ1xuZmV0Y2hQcm9wZXJ0eURlc2NyaXB0aW9ucyA9IHJlcXVpcmUgJy4vZmV0Y2gtcHJvcGVydHktZG9jcydcblxuUHJvcGVydGllc1VSTCA9ICdodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYWRvYmUvYnJhY2tldHMvbWFzdGVyL3NyYy9leHRlbnNpb25zL2RlZmF1bHQvQ1NTQ29kZUhpbnRzL0NTU1Byb3BlcnRpZXMuanNvbidcblxucHJvcGVydHlEZXNjcmlwdGlvbnNQcm9taXNlID0gZmV0Y2hQcm9wZXJ0eURlc2NyaXB0aW9ucygpXG5wcm9wZXJ0aWVzUHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlKSAtPlxuICByZXF1ZXN0IHtqc29uOiB0cnVlLCB1cmw6IFByb3BlcnRpZXNVUkx9LCAoZXJyb3IsIHJlc3BvbnNlLCBwcm9wZXJ0aWVzKSAtPlxuICAgIGlmIGVycm9yP1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvci5tZXNzYWdlKVxuICAgICAgcmVzb2x2ZShudWxsKVxuICAgIGlmIHJlc3BvbnNlLnN0YXR1c0NvZGUgaXNudCAyMDBcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1ZXN0IGZvciBDU1NQcm9wZXJ0aWVzLmpzb24gZmFpbGVkOiAje3Jlc3BvbnNlLnN0YXR1c0NvZGV9XCIpXG4gICAgICByZXNvbHZlKG51bGwpXG4gICAgcmVzb2x2ZShwcm9wZXJ0aWVzKVxuXG5Qcm9taXNlLnNldHRsZShbcHJvcGVydGllc1Byb21pc2UsIHByb3BlcnR5RGVzY3JpcHRpb25zUHJvbWlzZV0pLnRoZW4gKHJlc3VsdHMpIC0+XG4gIHByb3BlcnRpZXMgPSB7fVxuICBwcm9wZXJ0aWVzUmF3ID0gcmVzdWx0c1swXS52YWx1ZSgpXG4gIHByb3BlcnR5RGVzY3JpcHRpb25zID0gcmVzdWx0c1sxXS52YWx1ZSgpXG4gIHNvcnRlZFByb3BlcnR5TmFtZXMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnc29ydGVkLXByb3BlcnR5LW5hbWVzLmpzb24nKSkpXG4gIGZvciBwcm9wZXJ0eU5hbWUgaW4gc29ydGVkUHJvcGVydHlOYW1lc1xuICAgIGNvbnRpbnVlIHVubGVzcyBtZXRhZGF0YSA9IHByb3BlcnRpZXNSYXdbcHJvcGVydHlOYW1lXVxuICAgIG1ldGFkYXRhLmRlc2NyaXB0aW9uID0gcHJvcGVydHlEZXNjcmlwdGlvbnNbcHJvcGVydHlOYW1lXVxuICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IG1ldGFkYXRhXG4gICAgY29uc29sZS53YXJuIFwiTm8gZGVzY3JpcHRpb24gZm9yIHByb3BlcnR5ICN7cHJvcGVydHlOYW1lfVwiIHVubGVzcyBwcm9wZXJ0eURlc2NyaXB0aW9uc1twcm9wZXJ0eU5hbWVdP1xuXG4gIGZvciBwcm9wZXJ0eU5hbWUgb2YgcHJvcGVydGllc1Jhd1xuICAgIGNvbnNvbGUud2FybiBcIklnbm9yaW5nICN7cHJvcGVydHlOYW1lfTsgbm90IGluIHNvcnRlZC1wcm9wZXJ0eS1uYW1lcy5qc29uXCIgaWYgc29ydGVkUHJvcGVydHlOYW1lcy5pbmRleE9mKHByb3BlcnR5TmFtZSkgPCAwXG5cbiAgdGFncyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdodG1sLXRhZ3MuanNvbicpKSlcbiAgcHNldWRvU2VsZWN0b3JzID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ3BzZXVkby1zZWxlY3RvcnMuanNvbicpKSlcblxuICBjb21wbGV0aW9ucyA9IHt0YWdzLCBwcm9wZXJ0aWVzLCBwc2V1ZG9TZWxlY3RvcnN9XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2NvbXBsZXRpb25zLmpzb24nKSwgXCIje0pTT04uc3RyaW5naWZ5KGNvbXBsZXRpb25zLCBudWxsLCAnICAnKX1cXG5cIilcbiJdfQ==
