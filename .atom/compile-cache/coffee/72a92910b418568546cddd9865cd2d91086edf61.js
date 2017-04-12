(function() {
  var Tile;

  module.exports = Tile = (function() {
    function Tile(item, priority, collection) {
      this.item = item;
      this.priority = priority;
      this.collection = collection;
    }

    Tile.prototype.getItem = function() {
      return this.item;
    };

    Tile.prototype.getPriority = function() {
      return this.priority;
    };

    Tile.prototype.destroy = function() {
      this.collection.splice(this.collection.indexOf(this), 1);
      return atom.views.getView(this.item).remove();
    };

    return Tile;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi90aWxlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGNBQUMsSUFBRCxFQUFRLFFBQVIsRUFBbUIsVUFBbkI7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxXQUFEO01BQVcsSUFBQyxDQUFBLGFBQUQ7SUFBbkI7O21CQUViLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBO0lBRE07O21CQUdULFdBQUEsR0FBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBO0lBRFU7O21CQUdiLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLENBQW1CLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFvQixJQUFwQixDQUFuQixFQUE4QyxDQUE5QzthQUNBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsSUFBcEIsQ0FBeUIsQ0FBQyxNQUExQixDQUFBO0lBRk87Ozs7O0FBVlgiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUaWxlXG4gIGNvbnN0cnVjdG9yOiAoQGl0ZW0sIEBwcmlvcml0eSwgQGNvbGxlY3Rpb24pIC0+XG5cbiAgZ2V0SXRlbTogLT5cbiAgICBAaXRlbVxuXG4gIGdldFByaW9yaXR5OiAtPlxuICAgIEBwcmlvcml0eVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGNvbGxlY3Rpb24uc3BsaWNlKEBjb2xsZWN0aW9uLmluZGV4T2YodGhpcyksIDEpXG4gICAgYXRvbS52aWV3cy5nZXRWaWV3KEBpdGVtKS5yZW1vdmUoKVxuIl19
