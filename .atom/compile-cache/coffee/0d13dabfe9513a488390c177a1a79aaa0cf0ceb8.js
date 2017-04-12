(function() {
  var Task, _, async, ctags, getTagsFile, handlerPath, wordAtCursor;

  Task = require('atom').Task;

  ctags = require('ctags');

  async = require('async');

  getTagsFile = require("./get-tags-file");

  _ = require('underscore-plus');

  handlerPath = require.resolve('./load-tags-handler');

  wordAtCursor = function(text, cursorIndex, wordSeparator, noStripBefore) {
    var afterCursor, afterCursorWordEnds, beforeCursor, beforeCursorWordBegins;
    beforeCursor = text.slice(0, cursorIndex);
    afterCursor = text.slice(cursorIndex);
    beforeCursorWordBegins = noStripBefore ? 0 : beforeCursor.lastIndexOf(wordSeparator) + 1;
    afterCursorWordEnds = afterCursor.indexOf(wordSeparator);
    if (afterCursorWordEnds === -1) {
      afterCursorWordEnds = afterCursor.length;
    }
    return beforeCursor.slice(beforeCursorWordBegins) + afterCursor.slice(0, afterCursorWordEnds);
  };

  module.exports = {
    find: function(editor, callback) {
      var addSymbol, cursor, cursorPosition, nonWordCharacters, rubyScopes, scope, symbol, symbols, wordRegExp;
      symbols = [];
      if (symbol = editor.getSelectedText()) {
        symbols.push(symbol);
      }
      if (!symbols.length) {
        cursor = editor.getLastCursor();
        cursorPosition = cursor.getBufferPosition();
        scope = cursor.getScopeDescriptor();
        rubyScopes = scope.getScopesArray().filter(function(s) {
          return /^source\.ruby($|\.)/.test(s);
        });
        wordRegExp = rubyScopes.length ? (nonWordCharacters = atom.config.get('editor.nonWordCharacters', {
          scope: scope
        }), nonWordCharacters = nonWordCharacters.replace(/:/g, ''), new RegExp("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+([!?]|\\s*=>?)?|[<=>]+", 'g')) : cursor.wordRegExp();
        addSymbol = function(symbol) {
          if (rubyScopes.length) {
            if (/\s+=?$/.test(symbol)) {
              symbols.push(symbol.replace(/\s+=$/, '='));
            }
            return symbols.push(symbol.replace(/\s+=>?$/, ''));
          } else {
            return symbols.push(symbol);
          }
        };
        editor.scanInBufferRange(wordRegExp, cursor.getCurrentLineBufferRange(), function(arg) {
          var cursorWithinSymbol, match, range;
          range = arg.range, match = arg.match;
          if (range.containsPoint(cursorPosition)) {
            symbol = match[0];
            if (rubyScopes.length && symbol.indexOf(':') > -1) {
              cursorWithinSymbol = cursorPosition.column - range.start.column;
              addSymbol(wordAtCursor(symbol, cursorWithinSymbol, ':', true));
              return addSymbol(wordAtCursor(symbol, cursorWithinSymbol, ':'));
            } else {
              return addSymbol(symbol);
            }
          }
        });
      }
      if (!symbols.length) {
        return process.nextTick(function() {
          return callback(null, []);
        });
      }
      return async.map(atom.project.getPaths(), function(projectPath, done) {
        var detectCallback, foundErr, foundTags, tagsFile;
        tagsFile = getTagsFile(projectPath);
        foundTags = [];
        foundErr = null;
        detectCallback = function() {
          return done(foundErr, foundTags);
        };
        if (tagsFile == null) {
          return detectCallback();
        }
        return async.detectSeries(symbols, function(symbol, doneDetect) {
          return ctags.findTags(tagsFile, symbol, function(err, tags) {
            var i, len, tag;
            if (tags == null) {
              tags = [];
            }
            if (err) {
              foundErr = err;
              return doneDetect(false);
            } else if (tags.length) {
              for (i = 0, len = tags.length; i < len; i++) {
                tag = tags[i];
                tag.directory = projectPath;
              }
              foundTags = tags;
              return doneDetect(true);
            } else {
              return doneDetect(false);
            }
          });
        }, detectCallback);
      }, function(err, foundTags) {
        return callback(err, _.flatten(foundTags));
      });
    },
    getAllTags: function(callback) {
      var projectTags, task;
      projectTags = [];
      task = Task.once(handlerPath, atom.project.getPaths(), function() {
        return callback(projectTags);
      });
      task.on('tags', function(tags) {
        return projectTags.push.apply(projectTags, tags);
      });
      return task;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL3RhZy1yZWFkZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxPQUFRLE9BQUEsQ0FBUSxNQUFSOztFQUNULEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFDUixLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0VBQ1IsV0FBQSxHQUFjLE9BQUEsQ0FBUSxpQkFBUjs7RUFDZCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLFdBQUEsR0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixxQkFBaEI7O0VBRWQsWUFBQSxHQUFlLFNBQUMsSUFBRCxFQUFPLFdBQVAsRUFBb0IsYUFBcEIsRUFBbUMsYUFBbkM7QUFDYixRQUFBO0lBQUEsWUFBQSxHQUFlLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQUFjLFdBQWQ7SUFDZixXQUFBLEdBQWMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxXQUFYO0lBQ2Qsc0JBQUEsR0FBNEIsYUFBSCxHQUFzQixDQUF0QixHQUE2QixZQUFZLENBQUMsV0FBYixDQUF5QixhQUF6QixDQUFBLEdBQTBDO0lBQ2hHLG1CQUFBLEdBQXNCLFdBQVcsQ0FBQyxPQUFaLENBQW9CLGFBQXBCO0lBQ3RCLElBQTRDLG1CQUFBLEtBQXVCLENBQUMsQ0FBcEU7TUFBQSxtQkFBQSxHQUFzQixXQUFXLENBQUMsT0FBbEM7O1dBQ0EsWUFBWSxDQUFDLEtBQWIsQ0FBbUIsc0JBQW5CLENBQUEsR0FBNkMsV0FBVyxDQUFDLEtBQVosQ0FBa0IsQ0FBbEIsRUFBcUIsbUJBQXJCO0VBTmhDOztFQVFmLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxJQUFBLEVBQU0sU0FBQyxNQUFELEVBQVMsUUFBVDtB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bmN0YWdzID0gcmVxdWlyZSAnY3RhZ3MnXG5hc3luYyA9IHJlcXVpcmUgJ2FzeW5jJ1xuZ2V0VGFnc0ZpbGUgPSByZXF1aXJlIFwiLi9nZXQtdGFncy1maWxlXCJcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbmhhbmRsZXJQYXRoID0gcmVxdWlyZS5yZXNvbHZlICcuL2xvYWQtdGFncy1oYW5kbGVyJ1xuXG53b3JkQXRDdXJzb3IgPSAodGV4dCwgY3Vyc29ySW5kZXgsIHdvcmRTZXBhcmF0b3IsIG5vU3RyaXBCZWZvcmUpIC0+XG4gIGJlZm9yZUN1cnNvciA9IHRleHQuc2xpY2UoMCwgY3Vyc29ySW5kZXgpXG4gIGFmdGVyQ3Vyc29yID0gdGV4dC5zbGljZShjdXJzb3JJbmRleClcbiAgYmVmb3JlQ3Vyc29yV29yZEJlZ2lucyA9IGlmIG5vU3RyaXBCZWZvcmUgdGhlbiAwIGVsc2UgYmVmb3JlQ3Vyc29yLmxhc3RJbmRleE9mKHdvcmRTZXBhcmF0b3IpICsgMVxuICBhZnRlckN1cnNvcldvcmRFbmRzID0gYWZ0ZXJDdXJzb3IuaW5kZXhPZih3b3JkU2VwYXJhdG9yKVxuICBhZnRlckN1cnNvcldvcmRFbmRzID0gYWZ0ZXJDdXJzb3IubGVuZ3RoIGlmIGFmdGVyQ3Vyc29yV29yZEVuZHMgaXMgLTFcbiAgYmVmb3JlQ3Vyc29yLnNsaWNlKGJlZm9yZUN1cnNvcldvcmRCZWdpbnMpICsgYWZ0ZXJDdXJzb3Iuc2xpY2UoMCwgYWZ0ZXJDdXJzb3JXb3JkRW5kcylcblxubW9kdWxlLmV4cG9ydHMgPVxuICBmaW5kOiAoZWRpdG9yLCBjYWxsYmFjaykgLT5cbiAgICBzeW1ib2xzID0gW11cblxuICAgIGlmIHN5bWJvbCA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgc3ltYm9scy5wdXNoIHN5bWJvbFxuXG4gICAgdW5sZXNzIHN5bWJvbHMubGVuZ3RoXG4gICAgICBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBzY29wZSA9IGN1cnNvci5nZXRTY29wZURlc2NyaXB0b3IoKVxuICAgICAgcnVieVNjb3BlcyA9IHNjb3BlLmdldFNjb3Blc0FycmF5KCkuZmlsdGVyIChzKSAtPiAvXnNvdXJjZVxcLnJ1YnkoJHxcXC4pLy50ZXN0KHMpXG5cbiAgICAgIHdvcmRSZWdFeHAgPSBpZiBydWJ5U2NvcGVzLmxlbmd0aFxuICAgICAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGF0b20uY29uZmlnLmdldCAnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJywge3Njb3BlfVxuICAgICAgICAjIEFsbG93IHNwZWNpYWwgaGFuZGxpbmcgZm9yIGZ1bGx5LXF1YWxpZmllZCBydWJ5IGNvbnN0YW50c1xuICAgICAgICBub25Xb3JkQ2hhcmFjdGVycyA9IG5vbldvcmRDaGFyYWN0ZXJzLnJlcGxhY2UoLzovZywgJycpXG4gICAgICAgIG5ldyBSZWdFeHAoXCJbXlxcXFxzI3tfLmVzY2FwZVJlZ0V4cCBub25Xb3JkQ2hhcmFjdGVyc31dKyhbIT9dfFxcXFxzKj0+Pyk/fFs8PT5dK1wiLCAnZycpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnNvci53b3JkUmVnRXhwKClcblxuICAgICAgYWRkU3ltYm9sID0gKHN5bWJvbCkgLT5cbiAgICAgICAgaWYgcnVieVNjb3Blcy5sZW5ndGhcbiAgICAgICAgICAjIE5vcm1hbGl6ZSBhc3NpZ25tZW50IHN5bnRheFxuICAgICAgICAgIHN5bWJvbHMucHVzaCBzeW1ib2wucmVwbGFjZSgvXFxzKz0kLywgJz0nKSBpZiAvXFxzKz0/JC8udGVzdChzeW1ib2wpXG4gICAgICAgICAgIyBTdHJpcCBhd2F5IGFzc2lnbm1lbnQgJiBoYXNocm9ja2V0IHN5bnRheFxuICAgICAgICAgIHN5bWJvbHMucHVzaCBzeW1ib2wucmVwbGFjZSgvXFxzKz0+PyQvLCAnJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHN5bWJvbHMucHVzaCBzeW1ib2xcblxuICAgICAgIyBDYW4ndCB1c2UgYGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2VgIGhlcmUgYmVjYXVzZSB3ZSB3YW50IHRvIHNlbGVjdFxuICAgICAgIyB0aGUgbGFzdCBtYXRjaCBvZiB0aGUgcG90ZW50aWFsIDIgbWF0Y2hlcyB1bmRlciBjdXJzb3IuXG4gICAgICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2Ugd29yZFJlZ0V4cCwgY3Vyc29yLmdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2UoKSwgKHtyYW5nZSwgbWF0Y2h9KSAtPlxuICAgICAgICBpZiByYW5nZS5jb250YWluc1BvaW50KGN1cnNvclBvc2l0aW9uKVxuICAgICAgICAgIHN5bWJvbCA9IG1hdGNoWzBdXG4gICAgICAgICAgaWYgcnVieVNjb3Blcy5sZW5ndGggYW5kIHN5bWJvbC5pbmRleE9mKCc6JykgPiAtMVxuICAgICAgICAgICAgY3Vyc29yV2l0aGluU3ltYm9sID0gY3Vyc29yUG9zaXRpb24uY29sdW1uIC0gcmFuZ2Uuc3RhcnQuY29sdW1uXG4gICAgICAgICAgICAjIEFkZCBmdWxseS1xdWFsaWZpZWQgcnVieSBjb25zdGFudCB1cCB1bnRpbCB0aGUgY3Vyc29yIHBvc2l0aW9uXG4gICAgICAgICAgICBhZGRTeW1ib2wgd29yZEF0Q3Vyc29yKHN5bWJvbCwgY3Vyc29yV2l0aGluU3ltYm9sLCAnOicsIHRydWUpXG4gICAgICAgICAgICAjIEFkZGl0aW9uYWxseSwgYWxzbyBsb29rIHVwIHRoZSBiYXJlIHdvcmQgdW5kZXIgY3Vyc29yXG4gICAgICAgICAgICBhZGRTeW1ib2wgd29yZEF0Q3Vyc29yKHN5bWJvbCwgY3Vyc29yV2l0aGluU3ltYm9sLCAnOicpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgYWRkU3ltYm9sIHN5bWJvbFxuXG4gICAgdW5sZXNzIHN5bWJvbHMubGVuZ3RoXG4gICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayAtPiBjYWxsYmFjayhudWxsLCBbXSlcblxuICAgIGFzeW5jLm1hcChcbiAgICAgIGF0b20ucHJvamVjdC5nZXRQYXRocygpLFxuICAgICAgKHByb2plY3RQYXRoLCBkb25lKSAtPlxuICAgICAgICB0YWdzRmlsZSA9IGdldFRhZ3NGaWxlKHByb2plY3RQYXRoKVxuICAgICAgICBmb3VuZFRhZ3MgPSBbXVxuICAgICAgICBmb3VuZEVyciA9IG51bGxcbiAgICAgICAgZGV0ZWN0Q2FsbGJhY2sgPSAtPiBkb25lKGZvdW5kRXJyLCBmb3VuZFRhZ3MpXG4gICAgICAgIHJldHVybiBkZXRlY3RDYWxsYmFjaygpIHVubGVzcyB0YWdzRmlsZT9cbiAgICAgICAgIyBGaW5kIHRoZSBmaXJzdCBzeW1ib2wgaW4gdGhlIGxpc3QgdGhhdCBtYXRjaGVzIGEgdGFnXG4gICAgICAgIGFzeW5jLmRldGVjdFNlcmllcyBzeW1ib2xzLFxuICAgICAgICAgIChzeW1ib2wsIGRvbmVEZXRlY3QpIC0+XG4gICAgICAgICAgICBjdGFncy5maW5kVGFncyB0YWdzRmlsZSwgc3ltYm9sLCAoZXJyLCB0YWdzPVtdKSAtPlxuICAgICAgICAgICAgICBpZiBlcnJcbiAgICAgICAgICAgICAgICBmb3VuZEVyciA9IGVyclxuICAgICAgICAgICAgICAgIGRvbmVEZXRlY3QgZmFsc2VcbiAgICAgICAgICAgICAgZWxzZSBpZiB0YWdzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHRhZy5kaXJlY3RvcnkgPSBwcm9qZWN0UGF0aCBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgICAgICAgICBmb3VuZFRhZ3MgPSB0YWdzXG4gICAgICAgICAgICAgICAgZG9uZURldGVjdCB0cnVlXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkb25lRGV0ZWN0IGZhbHNlXG4gICAgICAgICAgZGV0ZWN0Q2FsbGJhY2tcbiAgICAgIChlcnIsIGZvdW5kVGFncykgLT5cbiAgICAgICAgY2FsbGJhY2sgZXJyLCBfLmZsYXR0ZW4oZm91bmRUYWdzKVxuICAgIClcblxuICBnZXRBbGxUYWdzOiAoY2FsbGJhY2spIC0+XG4gICAgcHJvamVjdFRhZ3MgPSBbXVxuICAgIHRhc2sgPSBUYXNrLm9uY2UgaGFuZGxlclBhdGgsIGF0b20ucHJvamVjdC5nZXRQYXRocygpLCAtPiBjYWxsYmFjayhwcm9qZWN0VGFncylcbiAgICB0YXNrLm9uICd0YWdzJywgKHRhZ3MpIC0+IHByb2plY3RUYWdzLnB1c2godGFncy4uLilcbiAgICB0YXNrXG4iXX0=
