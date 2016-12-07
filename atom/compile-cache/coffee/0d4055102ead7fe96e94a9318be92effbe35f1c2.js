(function() {
  var clone, firstCharsEqual, fs, path, propertyPrefixPattern;

  fs = require('fs');

  path = require('path');

  propertyPrefixPattern = /(?:^|\[|\(|,|=|:|\s)\s*(atom\.(?:[a-zA-Z]+\.?){0,2})$/;

  module.exports = {
    selector: '.source.coffee, .source.js',
    filterSuggestions: true,
    getSuggestions: function(arg) {
      var bufferPosition, editor, line;
      bufferPosition = arg.bufferPosition, editor = arg.editor;
      if (!this.isEditingAnAtomPackageFile(editor)) {
        return;
      }
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return this.getCompletions(line);
    },
    load: function() {
      this.loadCompletions();
      atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.scanProjectDirectories();
        };
      })(this));
      return this.scanProjectDirectories();
    },
    scanProjectDirectories: function() {
      this.packageDirectories = [];
      return atom.project.getDirectories().forEach((function(_this) {
        return function(directory) {
          if (directory == null) {
            return;
          }
          return _this.readMetadata(directory, function(error, metadata) {
            if (_this.isAtomPackage(metadata) || _this.isAtomCore(metadata)) {
              return _this.packageDirectories.push(directory);
            }
          });
        };
      })(this));
    },
    readMetadata: function(directory, callback) {
      return fs.readFile(path.join(directory.getPath(), 'package.json'), function(error, contents) {
        var metadata, parseError;
        if (error == null) {
          try {
            metadata = JSON.parse(contents);
          } catch (error1) {
            parseError = error1;
            error = parseError;
          }
        }
        return callback(error, metadata);
      });
    },
    isAtomPackage: function(metadata) {
      var ref, ref1;
      return (metadata != null ? (ref = metadata.engines) != null ? (ref1 = ref.atom) != null ? ref1.length : void 0 : void 0 : void 0) > 0;
    },
    isAtomCore: function(metadata) {
      return (metadata != null ? metadata.name : void 0) === 'atom';
    },
    isEditingAnAtomPackageFile: function(editor) {
      var directory, editorPath, i, len, ref, ref1;
      editorPath = editor.getPath();
      if ((editorPath != null) && (editorPath.endsWith('.atom/init.coffee') || editorPath.endsWith('.atom/init.js'))) {
        return true;
      }
      ref1 = (ref = this.packageDirectories) != null ? ref : [];
      for (i = 0, len = ref1.length; i < len; i++) {
        directory = ref1[i];
        if (directory.contains(editorPath)) {
          return true;
        }
      }
      return false;
    },
    loadCompletions: function() {
      if (this.completions == null) {
        this.completions = {};
      }
      return fs.readFile(path.resolve(__dirname, '..', 'completions.json'), (function(_this) {
        return function(error, content) {
          var classes;
          if (error != null) {
            return;
          }
          _this.completions = {};
          classes = JSON.parse(content);
          _this.loadProperty('atom', 'AtomEnvironment', classes);
        };
      })(this));
    },
    getCompletions: function(line) {
      var completion, completions, i, len, match, prefix, property, propertyCompletions, ref, ref1, ref2, ref3, segments;
      completions = [];
      match = (ref = propertyPrefixPattern.exec(line)) != null ? ref[1] : void 0;
      if (!match) {
        return completions;
      }
      segments = match.split('.');
      prefix = (ref1 = segments.pop()) != null ? ref1 : '';
      segments = segments.filter(function(segment) {
        return segment;
      });
      property = segments[segments.length - 1];
      propertyCompletions = (ref2 = (ref3 = this.completions[property]) != null ? ref3.completions : void 0) != null ? ref2 : [];
      for (i = 0, len = propertyCompletions.length; i < len; i++) {
        completion = propertyCompletions[i];
        if (!prefix || firstCharsEqual(completion.name, prefix)) {
          completions.push(clone(completion));
        }
      }
      return completions;
    },
    getPropertyClass: function(name) {
      var ref, ref1;
      return (ref = atom[name]) != null ? (ref1 = ref.constructor) != null ? ref1.name : void 0 : void 0;
    },
    loadProperty: function(propertyName, className, classes, parent) {
      var classCompletions, completion, i, len, propertyClass;
      classCompletions = classes[className];
      if (classCompletions == null) {
        return;
      }
      this.completions[propertyName] = {
        completions: []
      };
      for (i = 0, len = classCompletions.length; i < len; i++) {
        completion = classCompletions[i];
        this.completions[propertyName].completions.push(completion);
        if (completion.type === 'property') {
          propertyClass = this.getPropertyClass(completion.name);
          this.loadProperty(completion.name, propertyClass, classes);
        }
      }
    }
  };

  clone = function(obj) {
    var k, newObj, v;
    newObj = {};
    for (k in obj) {
      v = obj[k];
      newObj[k] = v;
    }
    return newObj;
  };

  firstCharsEqual = function(str1, str2) {
    return str1[0].toLowerCase() === str2[0].toLowerCase();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtYXRvbS1hcGkvbGliL3Byb3ZpZGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxxQkFBQSxHQUF3Qjs7RUFFeEIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSw0QkFBVjtJQUNBLGlCQUFBLEVBQW1CLElBRG5CO0lBR0EsY0FBQSxFQUFnQixTQUFDLEdBQUQ7QUFDZCxVQUFBO01BRGdCLHFDQUFnQjtNQUNoQyxJQUFBLENBQWMsSUFBQyxDQUFBLDBCQUFELENBQTRCLE1BQTVCLENBQWQ7QUFBQSxlQUFBOztNQUNBLElBQUEsR0FBTyxNQUFNLENBQUMsY0FBUCxDQUFzQixDQUFDLENBQUMsY0FBYyxDQUFDLEdBQWhCLEVBQXFCLENBQXJCLENBQUQsRUFBMEIsY0FBMUIsQ0FBdEI7YUFDUCxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFoQjtJQUhjLENBSGhCO0lBUUEsSUFBQSxFQUFNLFNBQUE7TUFDSixJQUFDLENBQUEsZUFBRCxDQUFBO01BQ0EsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBYixDQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLHNCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7YUFDQSxJQUFDLENBQUEsc0JBQUQsQ0FBQTtJQUhJLENBUk47SUFhQSxzQkFBQSxFQUF3QixTQUFBO01BQ3RCLElBQUMsQ0FBQSxrQkFBRCxHQUFzQjthQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBQSxDQUE2QixDQUFDLE9BQTlCLENBQXNDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxTQUFEO1VBQ3BDLElBQWMsaUJBQWQ7QUFBQSxtQkFBQTs7aUJBQ0EsS0FBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLEVBQXlCLFNBQUMsS0FBRCxFQUFRLFFBQVI7WUFDdkIsSUFBRyxLQUFDLENBQUEsYUFBRCxDQUFlLFFBQWYsQ0FBQSxJQUE0QixLQUFDLENBQUEsVUFBRCxDQUFZLFFBQVosQ0FBL0I7cUJBQ0UsS0FBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLFNBQXpCLEVBREY7O1VBRHVCLENBQXpCO1FBRm9DO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QztJQUZzQixDQWJ4QjtJQXFCQSxZQUFBLEVBQWMsU0FBQyxTQUFELEVBQVksUUFBWjthQUNaLEVBQUUsQ0FBQyxRQUFILENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFTLENBQUMsT0FBVixDQUFBLENBQVYsRUFBK0IsY0FBL0IsQ0FBWixFQUE0RCxTQUFDLEtBQUQsRUFBUSxRQUFSO0FBQzFELFlBQUE7UUFBQSxJQUFPLGFBQVA7QUFDRTtZQUNFLFFBQUEsR0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXLFFBQVgsRUFEYjtXQUFBLGNBQUE7WUFFTTtZQUNKLEtBQUEsR0FBUSxXQUhWO1dBREY7O2VBS0EsUUFBQSxDQUFTLEtBQVQsRUFBZ0IsUUFBaEI7TUFOMEQsQ0FBNUQ7SUFEWSxDQXJCZDtJQThCQSxhQUFBLEVBQWUsU0FBQyxRQUFEO0FBQ2IsVUFBQTtvR0FBdUIsQ0FBRSxrQ0FBekIsR0FBa0M7SUFEckIsQ0E5QmY7SUFpQ0EsVUFBQSxFQUFZLFNBQUMsUUFBRDtpQ0FDVixRQUFRLENBQUUsY0FBVixLQUFrQjtJQURSLENBakNaO0lBb0NBLDBCQUFBLEVBQTRCLFNBQUMsTUFBRDtBQUMxQixVQUFBO01BQUEsVUFBQSxHQUFhLE1BQU0sQ0FBQyxPQUFQLENBQUE7TUFDYixJQUFlLG9CQUFBLElBQWdCLENBQUMsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsbUJBQXBCLENBQUEsSUFBNEMsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsZUFBcEIsQ0FBN0MsQ0FBL0I7QUFBQSxlQUFPLEtBQVA7O0FBQ0E7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQWUsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsVUFBbkIsQ0FBZjtBQUFBLGlCQUFPLEtBQVA7O0FBREY7YUFFQTtJQUwwQixDQXBDNUI7SUEyQ0EsZUFBQSxFQUFpQixTQUFBOztRQUNmLElBQUMsQ0FBQSxjQUFlOzthQUVoQixFQUFFLENBQUMsUUFBSCxDQUFZLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixFQUF3QixJQUF4QixFQUE4QixrQkFBOUIsQ0FBWixFQUErRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRCxFQUFRLE9BQVI7QUFDN0QsY0FBQTtVQUFBLElBQVUsYUFBVjtBQUFBLG1CQUFBOztVQUNBLEtBQUMsQ0FBQSxXQUFELEdBQWU7VUFDZixPQUFBLEdBQVUsSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFYO1VBQ1YsS0FBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkLEVBQXNCLGlCQUF0QixFQUF5QyxPQUF6QztRQUo2RDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0Q7SUFIZSxDQTNDakI7SUFxREEsY0FBQSxFQUFnQixTQUFDLElBQUQ7QUFDZCxVQUFBO01BQUEsV0FBQSxHQUFjO01BQ2QsS0FBQSx5REFBMkMsQ0FBQSxDQUFBO01BQzNDLElBQUEsQ0FBMEIsS0FBMUI7QUFBQSxlQUFPLFlBQVA7O01BRUEsUUFBQSxHQUFXLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWjtNQUNYLE1BQUEsNENBQTBCO01BQzFCLFFBQUEsR0FBVyxRQUFRLENBQUMsTUFBVCxDQUFnQixTQUFDLE9BQUQ7ZUFBYTtNQUFiLENBQWhCO01BQ1gsUUFBQSxHQUFXLFFBQVMsQ0FBQSxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUFsQjtNQUNwQixtQkFBQSxxR0FBNEQ7QUFDNUQsV0FBQSxxREFBQTs7WUFBMkMsQ0FBSSxNQUFKLElBQWMsZUFBQSxDQUFnQixVQUFVLENBQUMsSUFBM0IsRUFBaUMsTUFBakM7VUFDdkQsV0FBVyxDQUFDLElBQVosQ0FBaUIsS0FBQSxDQUFNLFVBQU4sQ0FBakI7O0FBREY7YUFFQTtJQVpjLENBckRoQjtJQW1FQSxnQkFBQSxFQUFrQixTQUFDLElBQUQ7QUFDaEIsVUFBQTtpRkFBdUIsQ0FBRTtJQURULENBbkVsQjtJQXNFQSxZQUFBLEVBQWMsU0FBQyxZQUFELEVBQWUsU0FBZixFQUEwQixPQUExQixFQUFtQyxNQUFuQztBQUNaLFVBQUE7TUFBQSxnQkFBQSxHQUFtQixPQUFRLENBQUEsU0FBQTtNQUMzQixJQUFjLHdCQUFkO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsV0FBWSxDQUFBLFlBQUEsQ0FBYixHQUE2QjtRQUFBLFdBQUEsRUFBYSxFQUFiOztBQUU3QixXQUFBLGtEQUFBOztRQUNFLElBQUMsQ0FBQSxXQUFZLENBQUEsWUFBQSxDQUFhLENBQUMsV0FBVyxDQUFDLElBQXZDLENBQTRDLFVBQTVDO1FBQ0EsSUFBRyxVQUFVLENBQUMsSUFBWCxLQUFtQixVQUF0QjtVQUNFLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGdCQUFELENBQWtCLFVBQVUsQ0FBQyxJQUE3QjtVQUNoQixJQUFDLENBQUEsWUFBRCxDQUFjLFVBQVUsQ0FBQyxJQUF6QixFQUErQixhQUEvQixFQUE4QyxPQUE5QyxFQUZGOztBQUZGO0lBTlksQ0F0RWQ7OztFQW1GRixLQUFBLEdBQVEsU0FBQyxHQUFEO0FBQ04sUUFBQTtJQUFBLE1BQUEsR0FBUztBQUNULFNBQUEsUUFBQTs7TUFBQSxNQUFPLENBQUEsQ0FBQSxDQUFQLEdBQVk7QUFBWjtXQUNBO0VBSE07O0VBS1IsZUFBQSxHQUFrQixTQUFDLElBQUQsRUFBTyxJQUFQO1dBQ2hCLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxXQUFSLENBQUEsQ0FBQSxLQUF5QixJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsV0FBUixDQUFBO0VBRFQ7QUE5RmxCIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5wcm9wZXJ0eVByZWZpeFBhdHRlcm4gPSAvKD86XnxcXFt8XFwofCx8PXw6fFxccylcXHMqKGF0b21cXC4oPzpbYS16QS1aXStcXC4/KXswLDJ9KSQvXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgc2VsZWN0b3I6ICcuc291cmNlLmNvZmZlZSwgLnNvdXJjZS5qcydcbiAgZmlsdGVyU3VnZ2VzdGlvbnM6IHRydWVcblxuICBnZXRTdWdnZXN0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yfSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc0VkaXRpbmdBbkF0b21QYWNrYWdlRmlsZShlZGl0b3IpXG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBAZ2V0Q29tcGxldGlvbnMobGluZSlcblxuICBsb2FkOiAtPlxuICAgIEBsb2FkQ29tcGxldGlvbnMoKVxuICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzID0+IEBzY2FuUHJvamVjdERpcmVjdG9yaWVzKClcbiAgICBAc2NhblByb2plY3REaXJlY3RvcmllcygpXG5cbiAgc2NhblByb2plY3REaXJlY3RvcmllczogLT5cbiAgICBAcGFja2FnZURpcmVjdG9yaWVzID0gW11cbiAgICBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5mb3JFYWNoIChkaXJlY3RvcnkpID0+XG4gICAgICByZXR1cm4gdW5sZXNzIGRpcmVjdG9yeT9cbiAgICAgIEByZWFkTWV0YWRhdGEgZGlyZWN0b3J5LCAoZXJyb3IsIG1ldGFkYXRhKSA9PlxuICAgICAgICBpZiBAaXNBdG9tUGFja2FnZShtZXRhZGF0YSkgb3IgQGlzQXRvbUNvcmUobWV0YWRhdGEpXG4gICAgICAgICAgQHBhY2thZ2VEaXJlY3Rvcmllcy5wdXNoKGRpcmVjdG9yeSlcblxuICByZWFkTWV0YWRhdGE6IChkaXJlY3RvcnksIGNhbGxiYWNrKSAtPlxuICAgIGZzLnJlYWRGaWxlIHBhdGguam9pbihkaXJlY3RvcnkuZ2V0UGF0aCgpLCAncGFja2FnZS5qc29uJyksIChlcnJvciwgY29udGVudHMpIC0+XG4gICAgICB1bmxlc3MgZXJyb3I/XG4gICAgICAgIHRyeVxuICAgICAgICAgIG1ldGFkYXRhID0gSlNPTi5wYXJzZShjb250ZW50cylcbiAgICAgICAgY2F0Y2ggcGFyc2VFcnJvclxuICAgICAgICAgIGVycm9yID0gcGFyc2VFcnJvclxuICAgICAgY2FsbGJhY2soZXJyb3IsIG1ldGFkYXRhKVxuXG4gIGlzQXRvbVBhY2thZ2U6IChtZXRhZGF0YSkgLT5cbiAgICBtZXRhZGF0YT8uZW5naW5lcz8uYXRvbT8ubGVuZ3RoID4gMFxuXG4gIGlzQXRvbUNvcmU6IChtZXRhZGF0YSkgLT5cbiAgICBtZXRhZGF0YT8ubmFtZSBpcyAnYXRvbSdcblxuICBpc0VkaXRpbmdBbkF0b21QYWNrYWdlRmlsZTogKGVkaXRvcikgLT5cbiAgICBlZGl0b3JQYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgIHJldHVybiB0cnVlIGlmIGVkaXRvclBhdGg/IGFuZCAoZWRpdG9yUGF0aC5lbmRzV2l0aCgnLmF0b20vaW5pdC5jb2ZmZWUnKSBvciBlZGl0b3JQYXRoLmVuZHNXaXRoKCcuYXRvbS9pbml0LmpzJykpXG4gICAgZm9yIGRpcmVjdG9yeSBpbiBAcGFja2FnZURpcmVjdG9yaWVzID8gW11cbiAgICAgIHJldHVybiB0cnVlIGlmIGRpcmVjdG9yeS5jb250YWlucyhlZGl0b3JQYXRoKVxuICAgIGZhbHNlXG5cbiAgbG9hZENvbXBsZXRpb25zOiAtPlxuICAgIEBjb21wbGV0aW9ucyA/PSB7fVxuXG4gICAgZnMucmVhZEZpbGUgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ2NvbXBsZXRpb25zLmpzb24nKSwgKGVycm9yLCBjb250ZW50KSA9PlxuICAgICAgcmV0dXJuIGlmIGVycm9yP1xuICAgICAgQGNvbXBsZXRpb25zID0ge31cbiAgICAgIGNsYXNzZXMgPSBKU09OLnBhcnNlKGNvbnRlbnQpXG4gICAgICBAbG9hZFByb3BlcnR5KCdhdG9tJywgJ0F0b21FbnZpcm9ubWVudCcsIGNsYXNzZXMpXG4gICAgICByZXR1cm5cblxuICBnZXRDb21wbGV0aW9uczogKGxpbmUpIC0+XG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIG1hdGNoID0gIHByb3BlcnR5UHJlZml4UGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgIHJldHVybiBjb21wbGV0aW9ucyB1bmxlc3MgbWF0Y2hcblxuICAgIHNlZ21lbnRzID0gbWF0Y2guc3BsaXQoJy4nKVxuICAgIHByZWZpeCA9IHNlZ21lbnRzLnBvcCgpID8gJydcbiAgICBzZWdtZW50cyA9IHNlZ21lbnRzLmZpbHRlciAoc2VnbWVudCkgLT4gc2VnbWVudFxuICAgIHByb3BlcnR5ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV1cbiAgICBwcm9wZXJ0eUNvbXBsZXRpb25zID0gQGNvbXBsZXRpb25zW3Byb3BlcnR5XT8uY29tcGxldGlvbnMgPyBbXVxuICAgIGZvciBjb21wbGV0aW9uIGluIHByb3BlcnR5Q29tcGxldGlvbnMgd2hlbiBub3QgcHJlZml4IG9yIGZpcnN0Q2hhcnNFcXVhbChjb21wbGV0aW9uLm5hbWUsIHByZWZpeClcbiAgICAgIGNvbXBsZXRpb25zLnB1c2goY2xvbmUoY29tcGxldGlvbikpXG4gICAgY29tcGxldGlvbnNcblxuICBnZXRQcm9wZXJ0eUNsYXNzOiAobmFtZSkgLT5cbiAgICBhdG9tW25hbWVdPy5jb25zdHJ1Y3Rvcj8ubmFtZVxuXG4gIGxvYWRQcm9wZXJ0eTogKHByb3BlcnR5TmFtZSwgY2xhc3NOYW1lLCBjbGFzc2VzLCBwYXJlbnQpIC0+XG4gICAgY2xhc3NDb21wbGV0aW9ucyA9IGNsYXNzZXNbY2xhc3NOYW1lXVxuICAgIHJldHVybiB1bmxlc3MgY2xhc3NDb21wbGV0aW9ucz9cblxuICAgIEBjb21wbGV0aW9uc1twcm9wZXJ0eU5hbWVdID0gY29tcGxldGlvbnM6IFtdXG5cbiAgICBmb3IgY29tcGxldGlvbiBpbiBjbGFzc0NvbXBsZXRpb25zXG4gICAgICBAY29tcGxldGlvbnNbcHJvcGVydHlOYW1lXS5jb21wbGV0aW9ucy5wdXNoKGNvbXBsZXRpb24pXG4gICAgICBpZiBjb21wbGV0aW9uLnR5cGUgaXMgJ3Byb3BlcnR5J1xuICAgICAgICBwcm9wZXJ0eUNsYXNzID0gQGdldFByb3BlcnR5Q2xhc3MoY29tcGxldGlvbi5uYW1lKVxuICAgICAgICBAbG9hZFByb3BlcnR5KGNvbXBsZXRpb24ubmFtZSwgcHJvcGVydHlDbGFzcywgY2xhc3NlcylcbiAgICByZXR1cm5cblxuY2xvbmUgPSAob2JqKSAtPlxuICBuZXdPYmogPSB7fVxuICBuZXdPYmpba10gPSB2IGZvciBrLCB2IG9mIG9ialxuICBuZXdPYmpcblxuZmlyc3RDaGFyc0VxdWFsID0gKHN0cjEsIHN0cjIpIC0+XG4gIHN0cjFbMF0udG9Mb3dlckNhc2UoKSBpcyBzdHIyWzBdLnRvTG93ZXJDYXNlKClcbiJdfQ==
