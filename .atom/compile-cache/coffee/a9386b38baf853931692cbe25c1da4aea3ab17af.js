(function() {
  module.exports = {
    repositoryForPath: function(goalPath) {
      var directory, i, j, len, ref;
      ref = atom.project.getDirectories();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        directory = ref[i];
        if (goalPath === directory.getPath() || directory.contains(goalPath)) {
          return atom.project.getRepositories()[i];
        }
      }
      return null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9naXQtZGlmZi9saWIvaGVscGVycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsaUJBQUEsRUFBbUIsU0FBQyxRQUFEO0FBQ2pCLFVBQUE7QUFBQTtBQUFBLFdBQUEsNkNBQUE7O1FBQ0UsSUFBRyxRQUFBLEtBQVksU0FBUyxDQUFDLE9BQVYsQ0FBQSxDQUFaLElBQW1DLFNBQVMsQ0FBQyxRQUFWLENBQW1CLFFBQW5CLENBQXRDO0FBQ0UsaUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFiLENBQUEsQ0FBK0IsQ0FBQSxDQUFBLEVBRHhDOztBQURGO2FBR0E7SUFKaUIsQ0FBbkI7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIHJlcG9zaXRvcnlGb3JQYXRoOiAoZ29hbFBhdGgpIC0+XG4gICAgZm9yIGRpcmVjdG9yeSwgaSBpbiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVxuICAgICAgaWYgZ29hbFBhdGggaXMgZGlyZWN0b3J5LmdldFBhdGgoKSBvciBkaXJlY3RvcnkuY29udGFpbnMoZ29hbFBhdGgpXG4gICAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKClbaV1cbiAgICBudWxsXG4iXX0=
