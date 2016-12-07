(function() {
  var Emitter, List, difference;

  Emitter = require('atom').Emitter;

  module.exports = List = (function() {
    function List(key1) {
      this.key = key1;
      this.items = [];
      this.emitter = new Emitter;
    }

    List.prototype.getItems = function() {
      return this.items;
    };

    List.prototype.filterItems = function(filterFn) {
      var i, item, len, ref, results;
      ref = this.items;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (filterFn(item)) {
          results.push(item);
        }
      }
      return results;
    };

    List.prototype.keyForItem = function(item) {
      return item[this.key];
    };

    List.prototype.setItems = function(items) {
      var i, item, j, len, len1, results, setToAdd, setToRemove;
      items = items.slice(0);
      setToAdd = difference(items, this.items, this.key);
      setToRemove = difference(this.items, items, this.key);
      this.items = items;
      for (i = 0, len = setToAdd.length; i < len; i++) {
        item = setToAdd[i];
        this.emitter.emit('did-add-item', item);
      }
      results = [];
      for (j = 0, len1 = setToRemove.length; j < len1; j++) {
        item = setToRemove[j];
        results.push(this.emitter.emit('did-remove-item', item));
      }
      return results;
    };

    List.prototype.onDidAddItem = function(callback) {
      return this.emitter.on('did-add-item', callback);
    };

    List.prototype.onDidRemoveItem = function(callback) {
      return this.emitter.on('did-remove-item', callback);
    };

    return List;

  })();

  difference = function(array1, array2, key) {
    var diff, i, item, j, k, len, len1, obj1, obj2, v;
    obj1 = {};
    for (i = 0, len = array1.length; i < len; i++) {
      item = array1[i];
      obj1[item[key]] = item;
    }
    obj2 = {};
    for (j = 0, len1 = array2.length; j < len1; j++) {
      item = array2[j];
      obj2[item[key]] = item;
    }
    diff = [];
    for (k in obj1) {
      v = obj1[k];
      if (obj2[k] == null) {
        diff.push(v);
      }
    }
    return diff;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9saXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsVUFBVyxPQUFBLENBQVEsTUFBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsY0FBQyxJQUFEO01BQUMsSUFBQyxDQUFBLE1BQUQ7TUFDWixJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO0lBRko7O21CQUliLFFBQUEsR0FBVSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O21CQUVWLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO0FBQUM7QUFBQTtXQUFBLHFDQUFBOztZQUE2QixRQUFBLENBQVMsSUFBVDt1QkFBN0I7O0FBQUE7O0lBRFU7O21CQUdiLFVBQUEsR0FBWSxTQUFDLElBQUQ7YUFBVSxJQUFLLENBQUEsSUFBQyxDQUFBLEdBQUQ7SUFBZjs7bUJBRVosUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUNSLFVBQUE7TUFBQSxLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxDQUFaO01BQ1IsUUFBQSxHQUFXLFVBQUEsQ0FBVyxLQUFYLEVBQWtCLElBQUMsQ0FBQSxLQUFuQixFQUEwQixJQUFDLENBQUEsR0FBM0I7TUFDWCxXQUFBLEdBQWMsVUFBQSxDQUFXLElBQUMsQ0FBQSxLQUFaLEVBQW1CLEtBQW5CLEVBQTBCLElBQUMsQ0FBQSxHQUEzQjtNQUVkLElBQUMsQ0FBQSxLQUFELEdBQVM7QUFFVCxXQUFBLDBDQUFBOztRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGNBQWQsRUFBOEIsSUFBOUI7QUFERjtBQUVBO1dBQUEsK0NBQUE7O3FCQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGlCQUFkLEVBQWlDLElBQWpDO0FBREY7O0lBVFE7O21CQVlWLFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxjQUFaLEVBQTRCLFFBQTVCO0lBRFk7O21CQUdkLGVBQUEsR0FBaUIsU0FBQyxRQUFEO2FBQ2YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksaUJBQVosRUFBK0IsUUFBL0I7SUFEZTs7Ozs7O0VBR25CLFVBQUEsR0FBYSxTQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEdBQWpCO0FBQ1gsUUFBQTtJQUFBLElBQUEsR0FBTztBQUNQLFNBQUEsd0NBQUE7O01BQ0UsSUFBSyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQUwsQ0FBTCxHQUFrQjtBQURwQjtJQUdBLElBQUEsR0FBTztBQUNQLFNBQUEsMENBQUE7O01BQ0UsSUFBSyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQUwsQ0FBTCxHQUFrQjtBQURwQjtJQUdBLElBQUEsR0FBTztBQUNQLFNBQUEsU0FBQTs7TUFDRSxJQUFvQixlQUFwQjtRQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsQ0FBVixFQUFBOztBQURGO1dBRUE7RUFaVztBQWpDYiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIExpc3RcbiAgY29uc3RydWN0b3I6IChAa2V5KSAtPlxuICAgIEBpdGVtcyA9IFtdXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gIGdldEl0ZW1zOiAtPiBAaXRlbXNcblxuICBmaWx0ZXJJdGVtczogKGZpbHRlckZuKSAtPlxuICAgIChpdGVtIGZvciBpdGVtIGluIEBpdGVtcyB3aGVuIGZpbHRlckZuKGl0ZW0pKVxuXG4gIGtleUZvckl0ZW06IChpdGVtKSAtPiBpdGVtW0BrZXldXG5cbiAgc2V0SXRlbXM6IChpdGVtcykgLT5cbiAgICBpdGVtcyA9IGl0ZW1zLnNsaWNlKDApXG4gICAgc2V0VG9BZGQgPSBkaWZmZXJlbmNlKGl0ZW1zLCBAaXRlbXMsIEBrZXkpXG4gICAgc2V0VG9SZW1vdmUgPSBkaWZmZXJlbmNlKEBpdGVtcywgaXRlbXMsIEBrZXkpXG5cbiAgICBAaXRlbXMgPSBpdGVtc1xuXG4gICAgZm9yIGl0ZW0gaW4gc2V0VG9BZGRcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1hZGQtaXRlbScsIGl0ZW0pXG4gICAgZm9yIGl0ZW0gaW4gc2V0VG9SZW1vdmVcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1yZW1vdmUtaXRlbScsIGl0ZW0pXG5cbiAgb25EaWRBZGRJdGVtOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1hZGQtaXRlbScsIGNhbGxiYWNrKVxuXG4gIG9uRGlkUmVtb3ZlSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtcmVtb3ZlLWl0ZW0nLCBjYWxsYmFjaylcblxuZGlmZmVyZW5jZSA9IChhcnJheTEsIGFycmF5Miwga2V5KSAtPlxuICBvYmoxID0ge31cbiAgZm9yIGl0ZW0gaW4gYXJyYXkxXG4gICAgb2JqMVtpdGVtW2tleV1dID0gaXRlbVxuXG4gIG9iajIgPSB7fVxuICBmb3IgaXRlbSBpbiBhcnJheTJcbiAgICBvYmoyW2l0ZW1ba2V5XV0gPSBpdGVtXG5cbiAgZGlmZiA9IFtdXG4gIGZvciBrLCB2IG9mIG9iajFcbiAgICBkaWZmLnB1c2godikgdW5sZXNzIG9iajJba10/XG4gIGRpZmZcbiJdfQ==
