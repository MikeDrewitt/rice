(function() {
  var ItemRegistry;

  module.exports = ItemRegistry = (function() {
    function ItemRegistry() {
      this.items = new WeakSet;
    }

    ItemRegistry.prototype.addItem = function(item) {
      if (this.hasItem(item)) {
        throw new Error("The workspace can only contain one instance of item " + item);
      }
      return this.items.add(item);
    };

    ItemRegistry.prototype.removeItem = function(item) {
      return this.items["delete"](item);
    };

    ItemRegistry.prototype.hasItem = function(item) {
      return this.items.has(item);
    };

    return ItemRegistry;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9pdGVtLXJlZ2lzdHJ5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFBO01BQ1gsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJO0lBREY7OzJCQUdiLE9BQUEsR0FBUyxTQUFDLElBQUQ7TUFDUCxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxDQUFIO0FBQ0UsY0FBVSxJQUFBLEtBQUEsQ0FBTSxzREFBQSxHQUF1RCxJQUE3RCxFQURaOzthQUVBLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBUCxDQUFXLElBQVg7SUFITzs7MkJBS1QsVUFBQSxHQUFZLFNBQUMsSUFBRDthQUNWLElBQUMsQ0FBQSxLQUFLLEVBQUMsTUFBRCxFQUFOLENBQWMsSUFBZDtJQURVOzsyQkFHWixPQUFBLEdBQVMsU0FBQyxJQUFEO2FBQ1AsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsSUFBWDtJQURPOzs7OztBQWJYIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSXRlbVJlZ2lzdHJ5XG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBpdGVtcyA9IG5ldyBXZWFrU2V0XG5cbiAgYWRkSXRlbTogKGl0ZW0pIC0+XG4gICAgaWYgQGhhc0l0ZW0oaXRlbSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSB3b3Jrc3BhY2UgY2FuIG9ubHkgY29udGFpbiBvbmUgaW5zdGFuY2Ugb2YgaXRlbSAje2l0ZW19XCIpXG4gICAgQGl0ZW1zLmFkZChpdGVtKVxuXG4gIHJlbW92ZUl0ZW06IChpdGVtKSAtPlxuICAgIEBpdGVtcy5kZWxldGUoaXRlbSlcblxuICBoYXNJdGVtOiAoaXRlbSkgLT5cbiAgICBAaXRlbXMuaGFzKGl0ZW0pXG4iXX0=
