(function() {
  var CompositeDisposable, StyleguideUri;

  CompositeDisposable = require('atom').CompositeDisposable;

  StyleguideUri = 'atom://styleguide';

  module.exports = {
    activate: function() {
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.workspace.addOpener((function(_this) {
        return function(filePath) {
          if (filePath === StyleguideUri) {
            return _this.createStyleguideView({
              uri: StyleguideUri
            });
          }
        };
      })(this)));
      return this.subscriptions.add(atom.commands.add('atom-workspace', 'styleguide:show', function() {
        return atom.workspace.open(StyleguideUri);
      }));
    },
    deactivate: function() {
      return this.subscriptions.dispose();
    },
    createStyleguideView: function(state) {
      var StyleguideView;
      StyleguideView = require('./styleguide-view');
      return new StyleguideView(state);
    }
  };

  if (parseFloat(atom.getVersion()) < 1.7) {
    atom.deserializers.add({
      name: 'StyleguideView',
      deserialize: module.exports.createStyleguideView.bind(module.exports)
    });
  }

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdHlsZWd1aWRlL2xpYi9zdHlsZWd1aWRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixhQUFBLEdBQWdCOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQWYsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFFBQUQ7VUFDMUMsSUFBNkMsUUFBQSxLQUFZLGFBQXpEO21CQUFBLEtBQUMsQ0FBQSxvQkFBRCxDQUFzQjtjQUFBLEdBQUEsRUFBSyxhQUFMO2FBQXRCLEVBQUE7O1FBRDBDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixDQUFuQjthQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGlCQUFwQyxFQUF1RCxTQUFBO2VBQ3hFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixhQUFwQjtNQUR3RSxDQUF2RCxDQUFuQjtJQUpRLENBQVY7SUFPQSxVQUFBLEVBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRFUsQ0FQWjtJQVVBLG9CQUFBLEVBQXNCLFNBQUMsS0FBRDtBQUNwQixVQUFBO01BQUEsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7YUFDYixJQUFBLGNBQUEsQ0FBZSxLQUFmO0lBRmdCLENBVnRCOzs7RUFjRixJQUFHLFVBQUEsQ0FBVyxJQUFJLENBQUMsVUFBTCxDQUFBLENBQVgsQ0FBQSxHQUFnQyxHQUFuQztJQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FDRTtNQUFBLElBQUEsRUFBTSxnQkFBTjtNQUNBLFdBQUEsRUFBYSxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLElBQXBDLENBQXlDLE1BQU0sQ0FBQyxPQUFoRCxDQURiO0tBREYsRUFERjs7QUFsQkEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuU3R5bGVndWlkZVVyaSA9ICdhdG9tOi8vc3R5bGVndWlkZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lciAoZmlsZVBhdGgpID0+XG4gICAgICBAY3JlYXRlU3R5bGVndWlkZVZpZXcodXJpOiBTdHlsZWd1aWRlVXJpKSBpZiBmaWxlUGF0aCBpcyBTdHlsZWd1aWRlVXJpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdzdHlsZWd1aWRlOnNob3cnLCAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihTdHlsZWd1aWRlVXJpKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgY3JlYXRlU3R5bGVndWlkZVZpZXc6IChzdGF0ZSkgLT5cbiAgICBTdHlsZWd1aWRlVmlldyA9IHJlcXVpcmUgJy4vc3R5bGVndWlkZS12aWV3J1xuICAgIG5ldyBTdHlsZWd1aWRlVmlldyhzdGF0ZSlcblxuaWYgcGFyc2VGbG9hdChhdG9tLmdldFZlcnNpb24oKSkgPCAxLjdcbiAgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZFxuICAgIG5hbWU6ICdTdHlsZWd1aWRlVmlldydcbiAgICBkZXNlcmlhbGl6ZTogbW9kdWxlLmV4cG9ydHMuY3JlYXRlU3R5bGVndWlkZVZpZXcuYmluZChtb2R1bGUuZXhwb3J0cylcbiJdfQ==
