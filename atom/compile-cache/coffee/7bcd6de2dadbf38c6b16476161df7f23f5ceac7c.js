(function() {
  var TextEditor;

  TextEditor = null;

  module.exports = function(params) {
    if (atom.workspace.buildTextEditor != null) {
      return atom.workspace.buildTextEditor(params);
    } else {
      if (TextEditor == null) {
        TextEditor = require("atom").TextEditor;
      }
      return new TextEditor(params);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9idWlsZC10ZXh0LWVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFVBQUEsR0FBYTs7RUFDYixNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLE1BQUQ7SUFDZixJQUFHLHNDQUFIO2FBQ0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFmLENBQStCLE1BQS9CLEVBREY7S0FBQSxNQUFBOztRQUdFLGFBQWMsT0FBQSxDQUFRLE1BQVIsQ0FBZSxDQUFDOzthQUMxQixJQUFBLFVBQUEsQ0FBVyxNQUFYLEVBSk47O0VBRGU7QUFEakIiLCJzb3VyY2VzQ29udGVudCI6WyJUZXh0RWRpdG9yID0gbnVsbFxubW9kdWxlLmV4cG9ydHMgPSAocGFyYW1zKSAtPlxuICBpZiBhdG9tLndvcmtzcGFjZS5idWlsZFRleHRFZGl0b3I/XG4gICAgYXRvbS53b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKHBhcmFtcylcbiAgZWxzZVxuICAgIFRleHRFZGl0b3IgPz0gcmVxdWlyZShcImF0b21cIikuVGV4dEVkaXRvclxuICAgIG5ldyBUZXh0RWRpdG9yKHBhcmFtcylcbiJdfQ==
