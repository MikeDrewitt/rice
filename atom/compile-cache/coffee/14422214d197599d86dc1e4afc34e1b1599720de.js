(function() {
  var DiffListView, GitDiffView, diffListView, toggleDiffList;

  GitDiffView = require('./git-diff-view');

  DiffListView = null;

  diffListView = null;

  toggleDiffList = function() {
    if (DiffListView == null) {
      DiffListView = require('./diff-list-view');
    }
    if (diffListView == null) {
      diffListView = new DiffListView();
    }
    return diffListView.toggle();
  };

  module.exports = {
    activate: function() {
      return atom.workspace.observeTextEditors(function(editor) {
        new GitDiffView(editor);
        return atom.commands.add(atom.views.getView(editor), 'git-diff:toggle-diff-list', toggleDiffList);
      });
    },
    deactivate: function() {
      if (diffListView != null) {
        diffListView.cancel();
      }
      return diffListView = null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9naXQtZGlmZi9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsaUJBQVI7O0VBQ2QsWUFBQSxHQUFlOztFQUVmLFlBQUEsR0FBZTs7RUFDZixjQUFBLEdBQWlCLFNBQUE7O01BQ2YsZUFBZ0IsT0FBQSxDQUFRLGtCQUFSOzs7TUFDaEIsZUFBb0IsSUFBQSxZQUFBLENBQUE7O1dBQ3BCLFlBQVksQ0FBQyxNQUFiLENBQUE7RUFIZTs7RUFLakIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLE1BQUQ7UUFDNUIsSUFBQSxXQUFBLENBQVksTUFBWjtlQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBbEIsRUFBOEMsMkJBQTlDLEVBQTJFLGNBQTNFO01BRmdDLENBQWxDO0lBRFEsQ0FBVjtJQUtBLFVBQUEsRUFBWSxTQUFBOztRQUNWLFlBQVksQ0FBRSxNQUFkLENBQUE7O2FBQ0EsWUFBQSxHQUFlO0lBRkwsQ0FMWjs7QUFWRiIsInNvdXJjZXNDb250ZW50IjpbIkdpdERpZmZWaWV3ID0gcmVxdWlyZSAnLi9naXQtZGlmZi12aWV3J1xuRGlmZkxpc3RWaWV3ID0gbnVsbFxuXG5kaWZmTGlzdFZpZXcgPSBudWxsXG50b2dnbGVEaWZmTGlzdCA9IC0+XG4gIERpZmZMaXN0VmlldyA/PSByZXF1aXJlICcuL2RpZmYtbGlzdC12aWV3J1xuICBkaWZmTGlzdFZpZXcgPz0gbmV3IERpZmZMaXN0VmlldygpXG4gIGRpZmZMaXN0Vmlldy50b2dnbGUoKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSAtPlxuICAgICAgbmV3IEdpdERpZmZWaWV3KGVkaXRvcilcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCAnZ2l0LWRpZmY6dG9nZ2xlLWRpZmYtbGlzdCcsIHRvZ2dsZURpZmZMaXN0KVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgZGlmZkxpc3RWaWV3Py5jYW5jZWwoKVxuICAgIGRpZmZMaXN0VmlldyA9IG51bGxcbiJdfQ==
