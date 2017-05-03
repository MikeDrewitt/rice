(function() {
  var Emitter, FindOptions, Params, _;

  _ = require('underscore-plus');

  Emitter = require('atom').Emitter;

  Params = ['findPattern', 'replacePattern', 'pathsPattern', 'useRegex', 'wholeWord', 'caseSensitive', 'inCurrentSelection'];

  module.exports = FindOptions = (function() {
    function FindOptions(state) {
      var ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if (state == null) {
        state = {};
      }
      this.emitter = new Emitter;
      this.findPattern = (ref = state.findPattern) != null ? ref : '';
      this.replacePattern = (ref1 = state.replacePattern) != null ? ref1 : '';
      this.pathsPattern = (ref2 = state.pathsPattern) != null ? ref2 : '';
      this.useRegex = (ref3 = (ref4 = state.useRegex) != null ? ref4 : atom.config.get('find-and-replace.useRegex')) != null ? ref3 : false;
      this.caseSensitive = (ref5 = (ref6 = state.caseSensitive) != null ? ref6 : atom.config.get('find-and-replace.caseSensitive')) != null ? ref5 : false;
      this.wholeWord = (ref7 = (ref8 = state.wholeWord) != null ? ref8 : atom.config.get('find-and-replace.wholeWord')) != null ? ref7 : false;
      this.inCurrentSelection = (ref9 = (ref10 = state.inCurrentSelection) != null ? ref10 : atom.config.get('find-and-replace.inCurrentSelection')) != null ? ref9 : false;
    }

    FindOptions.prototype.onDidChange = function(callback) {
      return this.emitter.on('did-change', callback);
    };

    FindOptions.prototype.onDidChangeReplacePattern = function(callback) {
      return this.emitter.on('did-change-replacePattern', callback);
    };

    FindOptions.prototype.serialize = function() {
      var i, len, param, result;
      result = {};
      for (i = 0, len = Params.length; i < len; i++) {
        param = Params[i];
        result[param] = this[param];
      }
      return result;
    };

    FindOptions.prototype.set = function(newParams) {
      var changedParams, i, key, len, param, val;
      if (newParams == null) {
        newParams = {};
      }
      changedParams = null;
      for (i = 0, len = Params.length; i < len; i++) {
        key = Params[i];
        if ((newParams[key] != null) && newParams[key] !== this[key]) {
          if (changedParams == null) {
            changedParams = {};
          }
          this[key] = changedParams[key] = newParams[key];
        }
      }
      if (changedParams != null) {
        for (param in changedParams) {
          val = changedParams[param];
          this.emitter.emit("did-change-" + param);
        }
        return this.emitter.emit('did-change', changedParams);
      }
    };

    FindOptions.prototype.getFindPatternRegex = function() {
      var expression, flags;
      flags = 'g';
      if (!this.caseSensitive) {
        flags += 'i';
      }
      if (this.useRegex) {
        expression = this.findPattern;
      } else {
        expression = _.escapeRegExp(this.findPattern);
      }
      if (this.wholeWord) {
        expression = "\\b" + expression + "\\b";
      }
      return new RegExp(expression, flags);
    };

    return FindOptions;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9maW5kLW9wdGlvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBRVosTUFBQSxHQUFTLENBQ1AsYUFETyxFQUVQLGdCQUZPLEVBR1AsY0FITyxFQUlQLFVBSk8sRUFLUCxXQUxPLEVBTVAsZUFOTyxFQU9QLG9CQVBPOztFQVVULE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxxQkFBQyxLQUFEO0FBQ1gsVUFBQTs7UUFEWSxRQUFNOztNQUNsQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFFZixJQUFDLENBQUEsV0FBRCw2Q0FBbUM7TUFDbkMsSUFBQyxDQUFBLGNBQUQsa0RBQXlDO01BQ3pDLElBQUMsQ0FBQSxZQUFELGdEQUFxQztNQUNyQyxJQUFDLENBQUEsUUFBRCxtSEFBNEU7TUFDNUUsSUFBQyxDQUFBLGFBQUQsNkhBQTJGO01BQzNGLElBQUMsQ0FBQSxTQUFELHFIQUErRTtNQUMvRSxJQUFDLENBQUEsa0JBQUQseUlBQTBHO0lBVC9GOzswQkFXYixXQUFBLEdBQWEsU0FBQyxRQUFEO2FBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixRQUExQjtJQURXOzswQkFHYix5QkFBQSxHQUEyQixTQUFDLFFBQUQ7YUFDekIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksMkJBQVosRUFBeUMsUUFBekM7SUFEeUI7OzBCQUczQixTQUFBLEdBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxNQUFBLEdBQVM7QUFDVCxXQUFBLHdDQUFBOztRQUNFLE1BQU8sQ0FBQSxLQUFBLENBQVAsR0FBZ0IsSUFBSyxDQUFBLEtBQUE7QUFEdkI7YUFFQTtJQUpTOzswQkFNWCxHQUFBLEdBQUssU0FBQyxTQUFEO0FBQ0gsVUFBQTs7UUFESSxZQUFVOztNQUNkLGFBQUEsR0FBZ0I7QUFDaEIsV0FBQSx3Q0FBQTs7UUFDRSxJQUFHLHdCQUFBLElBQW9CLFNBQVUsQ0FBQSxHQUFBLENBQVYsS0FBb0IsSUFBSyxDQUFBLEdBQUEsQ0FBaEQ7O1lBQ0UsZ0JBQWlCOztVQUNqQixJQUFLLENBQUEsR0FBQSxDQUFMLEdBQVksYUFBYyxDQUFBLEdBQUEsQ0FBZCxHQUFxQixTQUFVLENBQUEsR0FBQSxFQUY3Qzs7QUFERjtNQUtBLElBQUcscUJBQUg7QUFDRSxhQUFBLHNCQUFBOztVQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQUEsR0FBYyxLQUE1QjtBQURGO2VBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsWUFBZCxFQUE0QixhQUE1QixFQUhGOztJQVBHOzswQkFZTCxtQkFBQSxHQUFxQixTQUFBO0FBQ25CLFVBQUE7TUFBQSxLQUFBLEdBQVE7TUFDUixJQUFBLENBQW9CLElBQUMsQ0FBQSxhQUFyQjtRQUFBLEtBQUEsSUFBUyxJQUFUOztNQUVBLElBQUcsSUFBQyxDQUFBLFFBQUo7UUFDRSxVQUFBLEdBQWEsSUFBQyxDQUFBLFlBRGhCO09BQUEsTUFBQTtRQUdFLFVBQUEsR0FBYSxDQUFDLENBQUMsWUFBRixDQUFlLElBQUMsQ0FBQSxXQUFoQixFQUhmOztNQUtBLElBQXNDLElBQUMsQ0FBQSxTQUF2QztRQUFBLFVBQUEsR0FBYSxLQUFBLEdBQU0sVUFBTixHQUFpQixNQUE5Qjs7YUFFSSxJQUFBLE1BQUEsQ0FBTyxVQUFQLEVBQW1CLEtBQW5CO0lBWGU7Ozs7O0FBbER2QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuXG5QYXJhbXMgPSBbXG4gICdmaW5kUGF0dGVybidcbiAgJ3JlcGxhY2VQYXR0ZXJuJ1xuICAncGF0aHNQYXR0ZXJuJ1xuICAndXNlUmVnZXgnXG4gICd3aG9sZVdvcmQnXG4gICdjYXNlU2Vuc2l0aXZlJ1xuICAnaW5DdXJyZW50U2VsZWN0aW9uJ1xuXVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGaW5kT3B0aW9uc1xuICBjb25zdHJ1Y3RvcjogKHN0YXRlPXt9KSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBmaW5kUGF0dGVybiA9IHN0YXRlLmZpbmRQYXR0ZXJuID8gJydcbiAgICBAcmVwbGFjZVBhdHRlcm4gPSBzdGF0ZS5yZXBsYWNlUGF0dGVybiA/ICcnXG4gICAgQHBhdGhzUGF0dGVybiA9IHN0YXRlLnBhdGhzUGF0dGVybiA/ICcnXG4gICAgQHVzZVJlZ2V4ID0gc3RhdGUudXNlUmVnZXggPyBhdG9tLmNvbmZpZy5nZXQoJ2ZpbmQtYW5kLXJlcGxhY2UudXNlUmVnZXgnKSA/IGZhbHNlXG4gICAgQGNhc2VTZW5zaXRpdmUgPSBzdGF0ZS5jYXNlU2Vuc2l0aXZlID8gYXRvbS5jb25maWcuZ2V0KCdmaW5kLWFuZC1yZXBsYWNlLmNhc2VTZW5zaXRpdmUnKSA/IGZhbHNlXG4gICAgQHdob2xlV29yZCA9IHN0YXRlLndob2xlV29yZCA/IGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS53aG9sZVdvcmQnKSA/IGZhbHNlXG4gICAgQGluQ3VycmVudFNlbGVjdGlvbiA9IHN0YXRlLmluQ3VycmVudFNlbGVjdGlvbiA/IGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5pbkN1cnJlbnRTZWxlY3Rpb24nKSA/IGZhbHNlXG5cbiAgb25EaWRDaGFuZ2U6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWNoYW5nZScsIGNhbGxiYWNrKVxuXG4gIG9uRGlkQ2hhbmdlUmVwbGFjZVBhdHRlcm46IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWNoYW5nZS1yZXBsYWNlUGF0dGVybicsIGNhbGxiYWNrKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIGZvciBwYXJhbSBpbiBQYXJhbXNcbiAgICAgIHJlc3VsdFtwYXJhbV0gPSB0aGlzW3BhcmFtXVxuICAgIHJlc3VsdFxuXG4gIHNldDogKG5ld1BhcmFtcz17fSkgLT5cbiAgICBjaGFuZ2VkUGFyYW1zID0gbnVsbFxuICAgIGZvciBrZXkgaW4gUGFyYW1zXG4gICAgICBpZiBuZXdQYXJhbXNba2V5XT8gYW5kIG5ld1BhcmFtc1trZXldIGlzbnQgdGhpc1trZXldXG4gICAgICAgIGNoYW5nZWRQYXJhbXMgPz0ge31cbiAgICAgICAgdGhpc1trZXldID0gY2hhbmdlZFBhcmFtc1trZXldID0gbmV3UGFyYW1zW2tleV1cblxuICAgIGlmIGNoYW5nZWRQYXJhbXM/XG4gICAgICBmb3IgcGFyYW0sIHZhbCBvZiBjaGFuZ2VkUGFyYW1zXG4gICAgICAgIEBlbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLSN7cGFyYW19XCIpXG4gICAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJywgY2hhbmdlZFBhcmFtcylcblxuICBnZXRGaW5kUGF0dGVyblJlZ2V4OiAtPlxuICAgIGZsYWdzID0gJ2cnXG4gICAgZmxhZ3MgKz0gJ2knIHVubGVzcyBAY2FzZVNlbnNpdGl2ZVxuXG4gICAgaWYgQHVzZVJlZ2V4XG4gICAgICBleHByZXNzaW9uID0gQGZpbmRQYXR0ZXJuXG4gICAgZWxzZVxuICAgICAgZXhwcmVzc2lvbiA9IF8uZXNjYXBlUmVnRXhwKEBmaW5kUGF0dGVybilcblxuICAgIGV4cHJlc3Npb24gPSBcIlxcXFxiI3tleHByZXNzaW9ufVxcXFxiXCIgaWYgQHdob2xlV29yZFxuXG4gICAgbmV3IFJlZ0V4cChleHByZXNzaW9uLCBmbGFncylcbiJdfQ==
