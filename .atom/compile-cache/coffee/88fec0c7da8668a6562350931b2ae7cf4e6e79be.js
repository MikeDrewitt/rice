(function() {
  var BracketMatcher, BracketMatcherView;

  BracketMatcherView = null;

  BracketMatcher = null;

  module.exports = {
    activate: function() {
      return atom.workspace.observeTextEditors(function(editor) {
        var editorElement;
        editorElement = atom.views.getView(editor);
        if (BracketMatcherView == null) {
          BracketMatcherView = require('./bracket-matcher-view');
        }
        new BracketMatcherView(editor, editorElement);
        if (BracketMatcher == null) {
          BracketMatcher = require('./bracket-matcher');
        }
        return new BracketMatcher(editor, editorElement);
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9icmFja2V0LW1hdGNoZXIvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxrQkFBQSxHQUFxQjs7RUFDckIsY0FBQSxHQUFpQjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLE1BQUQ7QUFDaEMsWUFBQTtRQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLE1BQW5COztVQUVoQixxQkFBc0IsT0FBQSxDQUFRLHdCQUFSOztRQUNsQixJQUFBLGtCQUFBLENBQW1CLE1BQW5CLEVBQTJCLGFBQTNCOztVQUVKLGlCQUFrQixPQUFBLENBQVEsbUJBQVI7O2VBQ2QsSUFBQSxjQUFBLENBQWUsTUFBZixFQUF1QixhQUF2QjtNQVA0QixDQUFsQztJQURRLENBQVY7O0FBSkYiLCJzb3VyY2VzQ29udGVudCI6WyJCcmFja2V0TWF0Y2hlclZpZXcgPSBudWxsXG5CcmFja2V0TWF0Y2hlciA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuXG4gICAgICBCcmFja2V0TWF0Y2hlclZpZXcgPz0gcmVxdWlyZSAnLi9icmFja2V0LW1hdGNoZXItdmlldydcbiAgICAgIG5ldyBCcmFja2V0TWF0Y2hlclZpZXcoZWRpdG9yLCBlZGl0b3JFbGVtZW50KVxuXG4gICAgICBCcmFja2V0TWF0Y2hlciA/PSByZXF1aXJlICcuL2JyYWNrZXQtbWF0Y2hlcidcbiAgICAgIG5ldyBCcmFja2V0TWF0Y2hlcihlZGl0b3IsIGVkaXRvckVsZW1lbnQpXG4iXX0=
