(function() {
  var FixesForCrappyDescriptions, Promise, fetch, filterExcerpt, fs, mdnCSSURL, mdnJSONAPI, path, propertiesURL, request;

  path = require('path');

  fs = require('fs');

  request = require('request');

  Promise = require('bluebird');

  mdnCSSURL = 'https://developer.mozilla.org/en-US/docs/Web/CSS';

  mdnJSONAPI = 'https://developer.mozilla.org/en-US/search.json';

  propertiesURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/CSSCodeHints/CSSProperties.json';

  fetch = function() {
    var propertiesPromise;
    propertiesPromise = new Promise(function(resolve) {
      return request({
        json: true,
        url: propertiesURL
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
    return propertiesPromise.then(function(properties) {
      var MAX, docs, queue, running;
      if (properties == null) {
        return;
      }
      MAX = 10;
      queue = Object.keys(properties);
      running = [];
      docs = {};
      return new Promise(function(resolve) {
        var checkEnd, handleRequest, i, ref, removeRunning, run, runNext;
        checkEnd = function() {
          if (queue.length === 0 && running.length === 0) {
            return resolve(docs);
          }
        };
        removeRunning = function(propertyName) {
          var index;
          index = running.indexOf(propertyName);
          if (index > -1) {
            return running.splice(index, 1);
          }
        };
        runNext = function() {
          var propertyName;
          checkEnd();
          if (queue.length !== 0) {
            propertyName = queue.pop();
            running.push(propertyName);
            return run(propertyName);
          }
        };
        run = function(propertyName) {
          var url;
          url = mdnJSONAPI + "?q=" + propertyName;
          return request({
            json: true,
            url: url
          }, function(error, response, searchResults) {
            if ((error == null) && response.statusCode === 200) {
              handleRequest(propertyName, searchResults);
            } else {
              console.error("Req failed " + url + "; " + response.statusCode + ", " + error);
            }
            removeRunning(propertyName);
            checkEnd();
            return runNext();
          });
        };
        handleRequest = function(propertyName, searchResults) {
          var doc, i, len, ref;
          if (searchResults.documents != null) {
            ref = searchResults.documents;
            for (i = 0, len = ref.length; i < len; i++) {
              doc = ref[i];
              if (doc.url === (mdnCSSURL + "/" + propertyName)) {
                docs[propertyName] = filterExcerpt(propertyName, doc.excerpt);
                break;
              }
            }
          }
        };
        for (i = 0, ref = MAX; 0 <= ref ? i <= ref : i >= ref; 0 <= ref ? i++ : i--) {
          runNext();
        }
      });
    });
  };

  FixesForCrappyDescriptions = {
    border: 'Specifies all borders on an HTMLElement.',
    clear: 'Specifies whether an element can be next to floating elements that precede it or must be moved down (cleared) below them.'
  };

  filterExcerpt = function(propertyName, excerpt) {
    var beginningPattern, periodIndex;
    if (FixesForCrappyDescriptions[propertyName] != null) {
      return FixesForCrappyDescriptions[propertyName];
    }
    beginningPattern = /^the (css )?[a-z-]+ (css )?property (is )?(\w+)/i;
    excerpt = excerpt.replace(/<\/?mark>/g, '');
    excerpt = excerpt.replace(beginningPattern, function(match) {
      var firstWord, matches;
      matches = beginningPattern.exec(match);
      firstWord = matches[4];
      return firstWord[0].toUpperCase() + firstWord.slice(1);
    });
    periodIndex = excerpt.indexOf('.');
    if (periodIndex > -1) {
      excerpt = excerpt.slice(0, periodIndex + 1);
    }
    return excerpt;
  };

  if (require.main === module) {
    fetch().then(function(docs) {
      if (docs != null) {
        return fs.writeFileSync(path.join(__dirname, 'property-docs.json'), (JSON.stringify(docs, null, '  ')) + "\n");
      } else {
        return console.error('No docs');
      }
    });
  }

  module.exports = fetch;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtY3NzL2ZldGNoLXByb3BlcnR5LWRvY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7RUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0VBRVYsU0FBQSxHQUFZOztFQUNaLFVBQUEsR0FBYTs7RUFDYixhQUFBLEdBQWdCOztFQUVoQixLQUFBLEdBQVEsU0FBQTtBQUNOLFFBQUE7SUFBQSxpQkFBQSxHQUF3QixJQUFBLE9BQUEsQ0FBUSxTQUFDLE9BQUQ7YUFDOUIsT0FBQSxDQUFRO1FBQUMsSUFBQSxFQUFNLElBQVA7UUFBYSxHQUFBLEVBQUssYUFBbEI7T0FBUixFQUEwQyxTQUFDLEtBQUQsRUFBUSxRQUFSLEVBQWtCLFVBQWxCO1FBQ3hDLElBQUcsYUFBSDtVQUNFLE9BQU8sQ0FBQyxLQUFSLENBQWMsS0FBSyxDQUFDLE9BQXBCO1VBQ0EsT0FBQSxDQUFRLElBQVIsRUFGRjs7UUFJQSxJQUFHLFFBQVEsQ0FBQyxVQUFULEtBQXlCLEdBQTVCO1VBQ0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyx5Q0FBQSxHQUEwQyxRQUFRLENBQUMsVUFBakU7VUFDQSxPQUFBLENBQVEsSUFBUixFQUZGOztlQUlBLE9BQUEsQ0FBUSxVQUFSO01BVHdDLENBQTFDO0lBRDhCLENBQVI7V0FZeEIsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsU0FBQyxVQUFEO0FBQ3JCLFVBQUE7TUFBQSxJQUFjLGtCQUFkO0FBQUEsZUFBQTs7TUFFQSxHQUFBLEdBQU07TUFDTixLQUFBLEdBQVEsTUFBTSxDQUFDLElBQVAsQ0FBWSxVQUFaO01BQ1IsT0FBQSxHQUFVO01BQ1YsSUFBQSxHQUFPO2FBRUgsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFEO0FBQ1YsWUFBQTtRQUFBLFFBQUEsR0FBVyxTQUFBO1VBQ1QsSUFBaUIsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBaEIsSUFBc0IsT0FBTyxDQUFDLE1BQVIsS0FBa0IsQ0FBekQ7bUJBQUEsT0FBQSxDQUFRLElBQVIsRUFBQTs7UUFEUztRQUdYLGFBQUEsR0FBZ0IsU0FBQyxZQUFEO0FBQ2QsY0FBQTtVQUFBLEtBQUEsR0FBUSxPQUFPLENBQUMsT0FBUixDQUFnQixZQUFoQjtVQUNSLElBQTRCLEtBQUEsR0FBUSxDQUFDLENBQXJDO21CQUFBLE9BQU8sQ0FBQyxNQUFSLENBQWUsS0FBZixFQUFzQixDQUF0QixFQUFBOztRQUZjO1FBSWhCLE9BQUEsR0FBVSxTQUFBO0FBQ1IsY0FBQTtVQUFBLFFBQUEsQ0FBQTtVQUNBLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBa0IsQ0FBckI7WUFDRSxZQUFBLEdBQWUsS0FBSyxDQUFDLEdBQU4sQ0FBQTtZQUNmLE9BQU8sQ0FBQyxJQUFSLENBQWEsWUFBYjttQkFDQSxHQUFBLENBQUksWUFBSixFQUhGOztRQUZRO1FBT1YsR0FBQSxHQUFNLFNBQUMsWUFBRDtBQUNKLGNBQUE7VUFBQSxHQUFBLEdBQVMsVUFBRCxHQUFZLEtBQVosR0FBaUI7aUJBQ3pCLE9BQUEsQ0FBUTtZQUFDLElBQUEsRUFBTSxJQUFQO1lBQWEsS0FBQSxHQUFiO1dBQVIsRUFBMkIsU0FBQyxLQUFELEVBQVEsUUFBUixFQUFrQixhQUFsQjtZQUN6QixJQUFPLGVBQUosSUFBZSxRQUFRLENBQUMsVUFBVCxLQUF1QixHQUF6QztjQUNFLGFBQUEsQ0FBYyxZQUFkLEVBQTRCLGFBQTVCLEVBREY7YUFBQSxNQUFBO2NBR0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxhQUFBLEdBQWMsR0FBZCxHQUFrQixJQUFsQixHQUFzQixRQUFRLENBQUMsVUFBL0IsR0FBMEMsSUFBMUMsR0FBOEMsS0FBNUQsRUFIRjs7WUFJQSxhQUFBLENBQWMsWUFBZDtZQUNBLFFBQUEsQ0FBQTttQkFDQSxPQUFBLENBQUE7VUFQeUIsQ0FBM0I7UUFGSTtRQVdOLGFBQUEsR0FBZ0IsU0FBQyxZQUFELEVBQWUsYUFBZjtBQUNkLGNBQUE7VUFBQSxJQUFHLCtCQUFIO0FBQ0U7QUFBQSxpQkFBQSxxQ0FBQTs7Y0FDRSxJQUFHLEdBQUcsQ0FBQyxHQUFKLEtBQVcsQ0FBRyxTQUFELEdBQVcsR0FBWCxHQUFjLFlBQWhCLENBQWQ7Z0JBQ0UsSUFBSyxDQUFBLFlBQUEsQ0FBTCxHQUFxQixhQUFBLENBQWMsWUFBZCxFQUE0QixHQUFHLENBQUMsT0FBaEM7QUFDckIsc0JBRkY7O0FBREYsYUFERjs7UUFEYztBQVFoQixhQUFjLHNFQUFkO1VBQUEsT0FBQSxDQUFBO0FBQUE7TUFsQ1UsQ0FBUjtJQVJpQixDQUF2QjtFQWJNOztFQTBEUiwwQkFBQSxHQUNFO0lBQUEsTUFBQSxFQUFRLDBDQUFSO0lBQ0EsS0FBQSxFQUFPLDJIQURQOzs7RUFHRixhQUFBLEdBQWdCLFNBQUMsWUFBRCxFQUFlLE9BQWY7QUFDZCxRQUFBO0lBQUEsSUFBbUQsZ0RBQW5EO0FBQUEsYUFBTywwQkFBMkIsQ0FBQSxZQUFBLEVBQWxDOztJQUNBLGdCQUFBLEdBQW1CO0lBQ25CLE9BQUEsR0FBVSxPQUFPLENBQUMsT0FBUixDQUFnQixZQUFoQixFQUE4QixFQUE5QjtJQUNWLE9BQUEsR0FBVSxPQUFPLENBQUMsT0FBUixDQUFnQixnQkFBaEIsRUFBa0MsU0FBQyxLQUFEO0FBQzFDLFVBQUE7TUFBQSxPQUFBLEdBQVUsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsS0FBdEI7TUFDVixTQUFBLEdBQVksT0FBUSxDQUFBLENBQUE7YUFDcEIsU0FBVSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQWIsQ0FBQSxDQUFBLEdBQTZCLFNBQVMsQ0FBQyxLQUFWLENBQWdCLENBQWhCO0lBSGEsQ0FBbEM7SUFJVixXQUFBLEdBQWMsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsR0FBaEI7SUFDZCxJQUErQyxXQUFBLEdBQWMsQ0FBQyxDQUE5RDtNQUFBLE9BQUEsR0FBVSxPQUFPLENBQUMsS0FBUixDQUFjLENBQWQsRUFBaUIsV0FBQSxHQUFjLENBQS9CLEVBQVY7O1dBQ0E7RUFWYzs7RUFhaEIsSUFBRyxPQUFPLENBQUMsSUFBUixLQUFnQixNQUFuQjtJQUNFLEtBQUEsQ0FBQSxDQUFPLENBQUMsSUFBUixDQUFhLFNBQUMsSUFBRDtNQUNYLElBQUcsWUFBSDtlQUNFLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixvQkFBckIsQ0FBakIsRUFBK0QsQ0FBQyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsRUFBcUIsSUFBckIsRUFBMkIsSUFBM0IsQ0FBRCxDQUFBLEdBQWtDLElBQWpHLEVBREY7T0FBQSxNQUFBO2VBR0UsT0FBTyxDQUFDLEtBQVIsQ0FBYyxTQUFkLEVBSEY7O0lBRFcsQ0FBYixFQURGOzs7RUFPQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTNGakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMnXG5yZXF1ZXN0ID0gcmVxdWlyZSAncmVxdWVzdCdcblByb21pc2UgPSByZXF1aXJlICdibHVlYmlyZCdcblxubWRuQ1NTVVJMID0gJ2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUydcbm1kbkpTT05BUEkgPSAnaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvc2VhcmNoLmpzb24nXG5wcm9wZXJ0aWVzVVJMID0gJ2h0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hZG9iZS9icmFja2V0cy9tYXN0ZXIvc3JjL2V4dGVuc2lvbnMvZGVmYXVsdC9DU1NDb2RlSGludHMvQ1NTUHJvcGVydGllcy5qc29uJ1xuXG5mZXRjaCA9IC0+XG4gIHByb3BlcnRpZXNQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUpIC0+XG4gICAgcmVxdWVzdCB7anNvbjogdHJ1ZSwgdXJsOiBwcm9wZXJ0aWVzVVJMfSwgKGVycm9yLCByZXNwb25zZSwgcHJvcGVydGllcykgLT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yLm1lc3NhZ2UpXG4gICAgICAgIHJlc29sdmUobnVsbClcblxuICAgICAgaWYgcmVzcG9uc2Uuc3RhdHVzQ29kZSBpc250IDIwMFxuICAgICAgICBjb25zb2xlLmVycm9yKFwiUmVxdWVzdCBmb3IgQ1NTUHJvcGVydGllcy5qc29uIGZhaWxlZDogI3tyZXNwb25zZS5zdGF0dXNDb2RlfVwiKVxuICAgICAgICByZXNvbHZlKG51bGwpXG5cbiAgICAgIHJlc29sdmUocHJvcGVydGllcylcblxuICBwcm9wZXJ0aWVzUHJvbWlzZS50aGVuIChwcm9wZXJ0aWVzKSAtPlxuICAgIHJldHVybiB1bmxlc3MgcHJvcGVydGllcz9cblxuICAgIE1BWCA9IDEwXG4gICAgcXVldWUgPSBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKVxuICAgIHJ1bm5pbmcgPSBbXVxuICAgIGRvY3MgPSB7fVxuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUpIC0+XG4gICAgICBjaGVja0VuZCA9IC0+XG4gICAgICAgIHJlc29sdmUoZG9jcykgaWYgcXVldWUubGVuZ3RoIGlzIDAgYW5kIHJ1bm5pbmcubGVuZ3RoIGlzIDBcblxuICAgICAgcmVtb3ZlUnVubmluZyA9IChwcm9wZXJ0eU5hbWUpIC0+XG4gICAgICAgIGluZGV4ID0gcnVubmluZy5pbmRleE9mKHByb3BlcnR5TmFtZSlcbiAgICAgICAgcnVubmluZy5zcGxpY2UoaW5kZXgsIDEpIGlmIGluZGV4ID4gLTFcblxuICAgICAgcnVuTmV4dCA9IC0+XG4gICAgICAgIGNoZWNrRW5kKClcbiAgICAgICAgaWYgcXVldWUubGVuZ3RoIGlzbnQgMFxuICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHF1ZXVlLnBvcCgpXG4gICAgICAgICAgcnVubmluZy5wdXNoKHByb3BlcnR5TmFtZSlcbiAgICAgICAgICBydW4ocHJvcGVydHlOYW1lKVxuXG4gICAgICBydW4gPSAocHJvcGVydHlOYW1lKSAtPlxuICAgICAgICB1cmwgPSBcIiN7bWRuSlNPTkFQSX0/cT0je3Byb3BlcnR5TmFtZX1cIlxuICAgICAgICByZXF1ZXN0IHtqc29uOiB0cnVlLCB1cmx9LCAoZXJyb3IsIHJlc3BvbnNlLCBzZWFyY2hSZXN1bHRzKSAtPlxuICAgICAgICAgIGlmIG5vdCBlcnJvcj8gYW5kIHJlc3BvbnNlLnN0YXR1c0NvZGUgaXMgMjAwXG4gICAgICAgICAgICBoYW5kbGVSZXF1ZXN0KHByb3BlcnR5TmFtZSwgc2VhcmNoUmVzdWx0cylcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yIFwiUmVxIGZhaWxlZCAje3VybH07ICN7cmVzcG9uc2Uuc3RhdHVzQ29kZX0sICN7ZXJyb3J9XCJcbiAgICAgICAgICByZW1vdmVSdW5uaW5nKHByb3BlcnR5TmFtZSlcbiAgICAgICAgICBjaGVja0VuZCgpXG4gICAgICAgICAgcnVuTmV4dCgpXG5cbiAgICAgIGhhbmRsZVJlcXVlc3QgPSAocHJvcGVydHlOYW1lLCBzZWFyY2hSZXN1bHRzKSAtPlxuICAgICAgICBpZiBzZWFyY2hSZXN1bHRzLmRvY3VtZW50cz9cbiAgICAgICAgICBmb3IgZG9jIGluIHNlYXJjaFJlc3VsdHMuZG9jdW1lbnRzXG4gICAgICAgICAgICBpZiBkb2MudXJsIGlzIFwiI3ttZG5DU1NVUkx9LyN7cHJvcGVydHlOYW1lfVwiXG4gICAgICAgICAgICAgIGRvY3NbcHJvcGVydHlOYW1lXSA9IGZpbHRlckV4Y2VycHQocHJvcGVydHlOYW1lLCBkb2MuZXhjZXJwdClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIHJ1bk5leHQoKSBmb3IgWzAuLk1BWF1cbiAgICAgIHJldHVyblxuXG5GaXhlc0ZvckNyYXBweURlc2NyaXB0aW9ucyA9XG4gIGJvcmRlcjogJ1NwZWNpZmllcyBhbGwgYm9yZGVycyBvbiBhbiBIVE1MRWxlbWVudC4nXG4gIGNsZWFyOiAnU3BlY2lmaWVzIHdoZXRoZXIgYW4gZWxlbWVudCBjYW4gYmUgbmV4dCB0byBmbG9hdGluZyBlbGVtZW50cyB0aGF0IHByZWNlZGUgaXQgb3IgbXVzdCBiZSBtb3ZlZCBkb3duIChjbGVhcmVkKSBiZWxvdyB0aGVtLidcblxuZmlsdGVyRXhjZXJwdCA9IChwcm9wZXJ0eU5hbWUsIGV4Y2VycHQpIC0+XG4gIHJldHVybiBGaXhlc0ZvckNyYXBweURlc2NyaXB0aW9uc1twcm9wZXJ0eU5hbWVdIGlmIEZpeGVzRm9yQ3JhcHB5RGVzY3JpcHRpb25zW3Byb3BlcnR5TmFtZV0/XG4gIGJlZ2lubmluZ1BhdHRlcm4gPSAvXnRoZSAoY3NzICk/W2Etei1dKyAoY3NzICk/cHJvcGVydHkgKGlzICk/KFxcdyspL2lcbiAgZXhjZXJwdCA9IGV4Y2VycHQucmVwbGFjZSgvPFxcLz9tYXJrPi9nLCAnJylcbiAgZXhjZXJwdCA9IGV4Y2VycHQucmVwbGFjZSBiZWdpbm5pbmdQYXR0ZXJuLCAobWF0Y2gpIC0+XG4gICAgbWF0Y2hlcyA9IGJlZ2lubmluZ1BhdHRlcm4uZXhlYyhtYXRjaClcbiAgICBmaXJzdFdvcmQgPSBtYXRjaGVzWzRdXG4gICAgZmlyc3RXb3JkWzBdLnRvVXBwZXJDYXNlKCkgKyBmaXJzdFdvcmQuc2xpY2UoMSlcbiAgcGVyaW9kSW5kZXggPSBleGNlcnB0LmluZGV4T2YoJy4nKVxuICBleGNlcnB0ID0gZXhjZXJwdC5zbGljZSgwLCBwZXJpb2RJbmRleCArIDEpIGlmIHBlcmlvZEluZGV4ID4gLTFcbiAgZXhjZXJwdFxuXG4jIFNhdmUgYSBmaWxlIGlmIHJ1biBmcm9tIHRoZSBjb21tYW5kIGxpbmVcbmlmIHJlcXVpcmUubWFpbiBpcyBtb2R1bGVcbiAgZmV0Y2goKS50aGVuIChkb2NzKSAtPlxuICAgIGlmIGRvY3M/XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdwcm9wZXJ0eS1kb2NzLmpzb24nKSwgXCIje0pTT04uc3RyaW5naWZ5KGRvY3MsIG51bGwsICcgICcpfVxcblwiKVxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUuZXJyb3IgJ05vIGRvY3MnXG5cbm1vZHVsZS5leHBvcnRzID0gZmV0Y2hcbiJdfQ==
