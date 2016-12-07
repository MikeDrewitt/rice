(function() {
  var path;

  path = require("path");

  module.exports = {
    repoForPath: function(goalPath) {
      var i, j, len, projectPath, ref;
      ref = atom.project.getPaths();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        projectPath = ref[i];
        if (goalPath === projectPath || goalPath.indexOf(projectPath + path.sep) === 0) {
          return atom.project.getRepositories()[i];
        }
      }
      return null;
    },
    getStyleObject: function(el) {
      var camelizedAttr, property, styleObject, styleProperties, value;
      styleProperties = window.getComputedStyle(el);
      styleObject = {};
      for (property in styleProperties) {
        value = styleProperties.getPropertyValue(property);
        camelizedAttr = property.replace(/\-([a-z])/g, function(a, b) {
          return b.toUpperCase();
        });
        styleObject[camelizedAttr] = value;
      }
      return styleObject;
    },
    getFullExtension: function(filePath) {
      var extension, fullExtension;
      fullExtension = '';
      while (extension = path.extname(filePath)) {
        fullExtension = extension + fullExtension;
        filePath = path.basename(filePath, extension);
      }
      return fullExtension;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2hlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFdBQUEsRUFBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO0FBQUE7QUFBQSxXQUFBLDZDQUFBOztRQUNFLElBQUcsUUFBQSxLQUFZLFdBQVosSUFBMkIsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUFwQyxDQUFBLEtBQTRDLENBQTFFO0FBQ0UsaUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFiLENBQUEsQ0FBK0IsQ0FBQSxDQUFBLEVBRHhDOztBQURGO2FBR0E7SUFKVyxDQUFiO0lBTUEsY0FBQSxFQUFnQixTQUFDLEVBQUQ7QUFDZCxVQUFBO01BQUEsZUFBQSxHQUFrQixNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsRUFBeEI7TUFDbEIsV0FBQSxHQUFjO0FBQ2QsV0FBQSwyQkFBQTtRQUNFLEtBQUEsR0FBUSxlQUFlLENBQUMsZ0JBQWhCLENBQWlDLFFBQWpDO1FBQ1IsYUFBQSxHQUFnQixRQUFRLENBQUMsT0FBVCxDQUFpQixZQUFqQixFQUErQixTQUFDLENBQUQsRUFBSSxDQUFKO2lCQUFVLENBQUMsQ0FBQyxXQUFGLENBQUE7UUFBVixDQUEvQjtRQUNoQixXQUFZLENBQUEsYUFBQSxDQUFaLEdBQTZCO0FBSC9CO2FBSUE7SUFQYyxDQU5oQjtJQWVBLGdCQUFBLEVBQWtCLFNBQUMsUUFBRDtBQUNoQixVQUFBO01BQUEsYUFBQSxHQUFnQjtBQUNoQixhQUFNLFNBQUEsR0FBWSxJQUFJLENBQUMsT0FBTCxDQUFhLFFBQWIsQ0FBbEI7UUFDRSxhQUFBLEdBQWdCLFNBQUEsR0FBWTtRQUM1QixRQUFBLEdBQVcsSUFBSSxDQUFDLFFBQUwsQ0FBYyxRQUFkLEVBQXdCLFNBQXhCO01BRmI7YUFHQTtJQUxnQixDQWZsQjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlIFwicGF0aFwiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgcmVwb0ZvclBhdGg6IChnb2FsUGF0aCkgLT5cbiAgICBmb3IgcHJvamVjdFBhdGgsIGkgaW4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgIGlmIGdvYWxQYXRoIGlzIHByb2plY3RQYXRoIG9yIGdvYWxQYXRoLmluZGV4T2YocHJvamVjdFBhdGggKyBwYXRoLnNlcCkgaXMgMFxuICAgICAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpW2ldXG4gICAgbnVsbFxuXG4gIGdldFN0eWxlT2JqZWN0OiAoZWwpIC0+XG4gICAgc3R5bGVQcm9wZXJ0aWVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpXG4gICAgc3R5bGVPYmplY3QgPSB7fVxuICAgIGZvciBwcm9wZXJ0eSBvZiBzdHlsZVByb3BlcnRpZXNcbiAgICAgIHZhbHVlID0gc3R5bGVQcm9wZXJ0aWVzLmdldFByb3BlcnR5VmFsdWUgcHJvcGVydHlcbiAgICAgIGNhbWVsaXplZEF0dHIgPSBwcm9wZXJ0eS5yZXBsYWNlIC9cXC0oW2Etel0pL2csIChhLCBiKSAtPiBiLnRvVXBwZXJDYXNlKClcbiAgICAgIHN0eWxlT2JqZWN0W2NhbWVsaXplZEF0dHJdID0gdmFsdWVcbiAgICBzdHlsZU9iamVjdFxuXG4gIGdldEZ1bGxFeHRlbnNpb246IChmaWxlUGF0aCkgLT5cbiAgICBmdWxsRXh0ZW5zaW9uID0gJydcbiAgICB3aGlsZSBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpXG4gICAgICBmdWxsRXh0ZW5zaW9uID0gZXh0ZW5zaW9uICsgZnVsbEV4dGVuc2lvblxuICAgICAgZmlsZVBhdGggPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCBleHRlbnNpb24pXG4gICAgZnVsbEV4dGVuc2lvblxuIl19
