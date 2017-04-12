(function() {
  var path;

  path = require("path");

  module.exports = {
    repositoryForPath: function(filePath) {
      var i, j, len, projectPath, ref;
      ref = atom.project.getPaths();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        projectPath = ref[i];
        if (filePath === projectPath || filePath.startsWith(projectPath + path.sep)) {
          return atom.project.getRepositories()[i];
        }
      }
      return null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL2hlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLGlCQUFBLEVBQW1CLFNBQUMsUUFBRDtBQUNqQixVQUFBO0FBQUE7QUFBQSxXQUFBLDZDQUFBOztRQUNFLElBQUcsUUFBQSxLQUFZLFdBQVosSUFBMkIsUUFBUSxDQUFDLFVBQVQsQ0FBb0IsV0FBQSxHQUFjLElBQUksQ0FBQyxHQUF2QyxDQUE5QjtBQUNFLGlCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBYixDQUFBLENBQStCLENBQUEsQ0FBQSxFQUR4Qzs7QUFERjtBQUdBLGFBQU87SUFKVSxDQUFuQjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlIFwicGF0aFwiXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgcmVwb3NpdG9yeUZvclBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBmb3IgcHJvamVjdFBhdGgsIGkgaW4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgIGlmIGZpbGVQYXRoIGlzIHByb2plY3RQYXRoIG9yIGZpbGVQYXRoLnN0YXJ0c1dpdGgocHJvamVjdFBhdGggKyBwYXRoLnNlcClcbiAgICAgICAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKVtpXVxuICAgIHJldHVybiBudWxsXG4iXX0=
