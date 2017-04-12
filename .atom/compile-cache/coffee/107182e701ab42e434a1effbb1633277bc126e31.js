(function() {
  var commandDisposable, createGrammarListView, grammarListView, grammarStatusView;

  commandDisposable = null;

  grammarListView = null;

  grammarStatusView = null;

  module.exports = {
    activate: function() {
      return commandDisposable = atom.commands.add('atom-text-editor', 'grammar-selector:show', createGrammarListView);
    },
    deactivate: function() {
      if (commandDisposable != null) {
        commandDisposable.dispose();
      }
      commandDisposable = null;
      if (grammarStatusView != null) {
        grammarStatusView.destroy();
      }
      grammarStatusView = null;
      if (grammarListView != null) {
        grammarListView.destroy();
      }
      return grammarListView = null;
    },
    consumeStatusBar: function(statusBar) {
      var GrammarStatusView;
      GrammarStatusView = require('./grammar-status-view');
      grammarStatusView = new GrammarStatusView().initialize(statusBar);
      return grammarStatusView.attach();
    }
  };

  createGrammarListView = function() {
    var GrammarListView;
    if (grammarListView == null) {
      GrammarListView = require('./grammar-list-view');
      grammarListView = new GrammarListView();
    }
    return grammarListView.toggle();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ncmFtbWFyLXNlbGVjdG9yL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsaUJBQUEsR0FBb0I7O0VBQ3BCLGVBQUEsR0FBa0I7O0VBQ2xCLGlCQUFBLEdBQW9COztFQUVwQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7YUFDUixpQkFBQSxHQUFvQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQXNDLHVCQUF0QyxFQUErRCxxQkFBL0Q7SUFEWixDQUFWO0lBR0EsVUFBQSxFQUFZLFNBQUE7O1FBQ1YsaUJBQWlCLENBQUUsT0FBbkIsQ0FBQTs7TUFDQSxpQkFBQSxHQUFvQjs7UUFFcEIsaUJBQWlCLENBQUUsT0FBbkIsQ0FBQTs7TUFDQSxpQkFBQSxHQUFvQjs7UUFFcEIsZUFBZSxDQUFFLE9BQWpCLENBQUE7O2FBQ0EsZUFBQSxHQUFrQjtJQVJSLENBSFo7SUFhQSxnQkFBQSxFQUFrQixTQUFDLFNBQUQ7QUFDaEIsVUFBQTtNQUFBLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSx1QkFBUjtNQUNwQixpQkFBQSxHQUF3QixJQUFBLGlCQUFBLENBQUEsQ0FBbUIsQ0FBQyxVQUFwQixDQUErQixTQUEvQjthQUN4QixpQkFBaUIsQ0FBQyxNQUFsQixDQUFBO0lBSGdCLENBYmxCOzs7RUFrQkYscUJBQUEsR0FBd0IsU0FBQTtBQUN0QixRQUFBO0lBQUEsSUFBTyx1QkFBUDtNQUNFLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHFCQUFSO01BQ2xCLGVBQUEsR0FBc0IsSUFBQSxlQUFBLENBQUEsRUFGeEI7O1dBR0EsZUFBZSxDQUFDLE1BQWhCLENBQUE7RUFKc0I7QUF2QnhCIiwic291cmNlc0NvbnRlbnQiOlsiY29tbWFuZERpc3Bvc2FibGUgPSBudWxsXG5ncmFtbWFyTGlzdFZpZXcgPSBudWxsXG5ncmFtbWFyU3RhdHVzVmlldyA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBjb21tYW5kRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ2dyYW1tYXItc2VsZWN0b3I6c2hvdycsIGNyZWF0ZUdyYW1tYXJMaXN0VmlldylcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIGNvbW1hbmREaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICBjb21tYW5kRGlzcG9zYWJsZSA9IG51bGxcblxuICAgIGdyYW1tYXJTdGF0dXNWaWV3Py5kZXN0cm95KClcbiAgICBncmFtbWFyU3RhdHVzVmlldyA9IG51bGxcblxuICAgIGdyYW1tYXJMaXN0Vmlldz8uZGVzdHJveSgpXG4gICAgZ3JhbW1hckxpc3RWaWV3ID0gbnVsbFxuXG4gIGNvbnN1bWVTdGF0dXNCYXI6IChzdGF0dXNCYXIpIC0+XG4gICAgR3JhbW1hclN0YXR1c1ZpZXcgPSByZXF1aXJlICcuL2dyYW1tYXItc3RhdHVzLXZpZXcnXG4gICAgZ3JhbW1hclN0YXR1c1ZpZXcgPSBuZXcgR3JhbW1hclN0YXR1c1ZpZXcoKS5pbml0aWFsaXplKHN0YXR1c0JhcilcbiAgICBncmFtbWFyU3RhdHVzVmlldy5hdHRhY2goKVxuXG5jcmVhdGVHcmFtbWFyTGlzdFZpZXcgPSAtPlxuICB1bmxlc3MgZ3JhbW1hckxpc3RWaWV3P1xuICAgIEdyYW1tYXJMaXN0VmlldyA9IHJlcXVpcmUgJy4vZ3JhbW1hci1saXN0LXZpZXcnXG4gICAgZ3JhbW1hckxpc3RWaWV3ID0gbmV3IEdyYW1tYXJMaXN0VmlldygpXG4gIGdyYW1tYXJMaXN0Vmlldy50b2dnbGUoKVxuIl19
