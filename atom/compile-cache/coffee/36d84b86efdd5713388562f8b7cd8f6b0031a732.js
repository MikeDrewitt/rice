(function() {
  var Emitter, HISTORY_MAX, History, HistoryCycler, _;

  _ = require('underscore-plus');

  Emitter = require('atom').Emitter;

  HISTORY_MAX = 25;

  History = (function() {
    function History(items) {
      this.items = items != null ? items : [];
      this.emitter = new Emitter;
      this.length = this.items.length;
    }

    History.prototype.onDidAddItem = function(callback) {
      return this.emitter.on('did-add-item', callback);
    };

    History.prototype.serialize = function() {
      return this.items.slice(-HISTORY_MAX);
    };

    History.prototype.getLast = function() {
      return _.last(this.items);
    };

    History.prototype.getAtIndex = function(index) {
      return this.items[index];
    };

    History.prototype.add = function(text) {
      this.items.push(text);
      this.length = this.items.length;
      return this.emitter.emit('did-add-item', text);
    };

    History.prototype.clear = function() {
      this.items = [];
      return this.length = 0;
    };

    return History;

  })();

  HistoryCycler = (function() {
    function HistoryCycler(buffer, history) {
      this.buffer = buffer;
      this.history = history;
      this.index = this.history.length;
      this.history.onDidAddItem((function(_this) {
        return function(text) {
          if (text !== _this.buffer.getText()) {
            return _this.buffer.setText(text);
          }
        };
      })(this));
    }

    HistoryCycler.prototype.addEditorElement = function(editorElement) {
      return atom.commands.add(editorElement, {
        'core:move-up': (function(_this) {
          return function() {
            return _this.previous();
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.next();
          };
        })(this)
      });
    };

    HistoryCycler.prototype.previous = function() {
      var ref;
      if (this.history.length === 0 || (this.atLastItem() && this.buffer.getText() !== this.history.getLast())) {
        this.scratch = this.buffer.getText();
      } else if (this.index > 0) {
        this.index--;
      }
      return this.buffer.setText((ref = this.history.getAtIndex(this.index)) != null ? ref : '');
    };

    HistoryCycler.prototype.next = function() {
      var item;
      if (this.index < this.history.length - 1) {
        this.index++;
        item = this.history.getAtIndex(this.index);
      } else if (this.scratch) {
        item = this.scratch;
      } else {
        item = '';
      }
      return this.buffer.setText(item);
    };

    HistoryCycler.prototype.atLastItem = function() {
      return this.index === this.history.length - 1;
    };

    HistoryCycler.prototype.store = function() {
      var text;
      text = this.buffer.getText();
      if (!text || text === this.history.getLast()) {
        return;
      }
      this.scratch = null;
      this.history.add(text);
      return this.index = this.history.length - 1;
    };

    return HistoryCycler;

  })();

  module.exports = {
    History: History,
    HistoryCycler: HistoryCycler
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9oaXN0b3J5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVaLFdBQUEsR0FBYzs7RUFFUjtJQUNTLGlCQUFDLEtBQUQ7TUFBQyxJQUFDLENBQUEsd0JBQUQsUUFBTztNQUNuQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxLQUFLLENBQUM7SUFGTjs7c0JBSWIsWUFBQSxHQUFjLFNBQUMsUUFBRDthQUNaLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGNBQVosRUFBNEIsUUFBNUI7SUFEWTs7c0JBR2QsU0FBQSxHQUFXLFNBQUE7YUFDVCxJQUFDLENBQUEsS0FBTTtJQURFOztzQkFHWCxPQUFBLEdBQVMsU0FBQTthQUNQLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLEtBQVI7SUFETzs7c0JBR1QsVUFBQSxHQUFZLFNBQUMsS0FBRDthQUNWLElBQUMsQ0FBQSxLQUFNLENBQUEsS0FBQTtJQURHOztzQkFHWixHQUFBLEdBQUssU0FBQyxJQUFEO01BQ0gsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksSUFBWjtNQUNBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLEtBQUssQ0FBQzthQUNqQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxjQUFkLEVBQThCLElBQTlCO0lBSEc7O3NCQUtMLEtBQUEsR0FBTyxTQUFBO01BQ0wsSUFBQyxDQUFBLEtBQUQsR0FBUzthQUNULElBQUMsQ0FBQSxNQUFELEdBQVU7SUFGTDs7Ozs7O0VBS0g7SUFJUyx1QkFBQyxNQUFELEVBQVUsT0FBVjtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQVMsSUFBQyxDQUFBLFVBQUQ7TUFDckIsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDO01BQ2xCLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxDQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsSUFBRDtVQUNwQixJQUF5QixJQUFBLEtBQVUsS0FBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsQ0FBbkM7bUJBQUEsS0FBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQUE7O1FBRG9CO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtJQUZXOzs0QkFLYixnQkFBQSxHQUFrQixTQUFDLGFBQUQ7YUFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGFBQWxCLEVBQ0U7UUFBQSxjQUFBLEVBQWdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFFBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQjtRQUNBLGdCQUFBLEVBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLElBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURsQjtPQURGO0lBRGdCOzs0QkFLbEIsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsS0FBbUIsQ0FBbkIsSUFBd0IsQ0FBQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsSUFBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsQ0FBQSxLQUF1QixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBQSxDQUExQyxDQUEzQjtRQUNFLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsRUFEYjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsS0FBRCxHQUFTLENBQVo7UUFDSCxJQUFDLENBQUEsS0FBRCxHQURHOzthQUdMLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUiw2REFBOEMsRUFBOUM7SUFOUTs7NEJBUVYsSUFBQSxHQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQixDQUE5QjtRQUNFLElBQUMsQ0FBQSxLQUFEO1FBQ0EsSUFBQSxHQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBVCxDQUFvQixJQUFDLENBQUEsS0FBckIsRUFGVDtPQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBSjtRQUNILElBQUEsR0FBTyxJQUFDLENBQUEsUUFETDtPQUFBLE1BQUE7UUFHSCxJQUFBLEdBQU8sR0FISjs7YUFLTCxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEI7SUFUSTs7NEJBV04sVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsS0FBRCxLQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQjtJQURsQjs7NEJBR1osS0FBQSxHQUFPLFNBQUE7QUFDTCxVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBO01BQ1AsSUFBVSxDQUFJLElBQUosSUFBWSxJQUFBLEtBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQUEsQ0FBOUI7QUFBQSxlQUFBOztNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEdBQVQsQ0FBYSxJQUFiO2FBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0I7SUFMdEI7Ozs7OztFQU9ULE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUMsU0FBQSxPQUFEO0lBQVUsZUFBQSxhQUFWOztBQTNFakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0VtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcblxuSElTVE9SWV9NQVggPSAyNVxuXG5jbGFzcyBIaXN0b3J5XG4gIGNvbnN0cnVjdG9yOiAoQGl0ZW1zPVtdKSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAbGVuZ3RoID0gQGl0ZW1zLmxlbmd0aFxuXG4gIG9uRGlkQWRkSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLWl0ZW0nLCBjYWxsYmFja1xuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAaXRlbXNbLUhJU1RPUllfTUFYLi5dXG5cbiAgZ2V0TGFzdDogLT5cbiAgICBfLmxhc3QoQGl0ZW1zKVxuXG4gIGdldEF0SW5kZXg6IChpbmRleCkgLT5cbiAgICBAaXRlbXNbaW5kZXhdXG5cbiAgYWRkOiAodGV4dCkgLT5cbiAgICBAaXRlbXMucHVzaCh0ZXh0KVxuICAgIEBsZW5ndGggPSBAaXRlbXMubGVuZ3RoXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFkZC1pdGVtJywgdGV4dFxuXG4gIGNsZWFyOiAtPlxuICAgIEBpdGVtcyA9IFtdXG4gICAgQGxlbmd0aCA9IDBcblxuIyBBZGRzIHRoZSBhYmlsaXR5IHRvIGN5Y2xlIHRocm91Z2ggaGlzdG9yeVxuY2xhc3MgSGlzdG9yeUN5Y2xlclxuXG4gICMgKiBgYnVmZmVyYCBhbiB7RWRpdG9yfSBpbnN0YW5jZSB0byBhdHRhY2ggdGhlIGN5Y2xlciB0b1xuICAjICogYGhpc3RvcnlgIGEge0hpc3Rvcnl9IG9iamVjdFxuICBjb25zdHJ1Y3RvcjogKEBidWZmZXIsIEBoaXN0b3J5KSAtPlxuICAgIEBpbmRleCA9IEBoaXN0b3J5Lmxlbmd0aFxuICAgIEBoaXN0b3J5Lm9uRGlkQWRkSXRlbSAodGV4dCkgPT5cbiAgICAgIEBidWZmZXIuc2V0VGV4dCh0ZXh0KSBpZiB0ZXh0IGlzbnQgQGJ1ZmZlci5nZXRUZXh0KClcblxuICBhZGRFZGl0b3JFbGVtZW50OiAoZWRpdG9yRWxlbWVudCkgLT5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JFbGVtZW50LFxuICAgICAgJ2NvcmU6bW92ZS11cCc6ID0+IEBwcmV2aW91cygpXG4gICAgICAnY29yZTptb3ZlLWRvd24nOiA9PiBAbmV4dCgpXG5cbiAgcHJldmlvdXM6IC0+XG4gICAgaWYgQGhpc3RvcnkubGVuZ3RoIGlzIDAgb3IgKEBhdExhc3RJdGVtKCkgYW5kIEBidWZmZXIuZ2V0VGV4dCgpIGlzbnQgQGhpc3RvcnkuZ2V0TGFzdCgpKVxuICAgICAgQHNjcmF0Y2ggPSBAYnVmZmVyLmdldFRleHQoKVxuICAgIGVsc2UgaWYgQGluZGV4ID4gMFxuICAgICAgQGluZGV4LS1cblxuICAgIEBidWZmZXIuc2V0VGV4dCBAaGlzdG9yeS5nZXRBdEluZGV4KEBpbmRleCkgPyAnJ1xuXG4gIG5leHQ6IC0+XG4gICAgaWYgQGluZGV4IDwgQGhpc3RvcnkubGVuZ3RoIC0gMVxuICAgICAgQGluZGV4KytcbiAgICAgIGl0ZW0gPSBAaGlzdG9yeS5nZXRBdEluZGV4KEBpbmRleClcbiAgICBlbHNlIGlmIEBzY3JhdGNoXG4gICAgICBpdGVtID0gQHNjcmF0Y2hcbiAgICBlbHNlXG4gICAgICBpdGVtID0gJydcblxuICAgIEBidWZmZXIuc2V0VGV4dCBpdGVtXG5cbiAgYXRMYXN0SXRlbTogLT5cbiAgICBAaW5kZXggaXMgQGhpc3RvcnkubGVuZ3RoIC0gMVxuXG4gIHN0b3JlOiAtPlxuICAgIHRleHQgPSBAYnVmZmVyLmdldFRleHQoKVxuICAgIHJldHVybiBpZiBub3QgdGV4dCBvciB0ZXh0IGlzIEBoaXN0b3J5LmdldExhc3QoKVxuICAgIEBzY3JhdGNoID0gbnVsbFxuICAgIEBoaXN0b3J5LmFkZCh0ZXh0KVxuICAgIEBpbmRleCA9IEBoaXN0b3J5Lmxlbmd0aCAtIDFcblxubW9kdWxlLmV4cG9ydHMgPSB7SGlzdG9yeSwgSGlzdG9yeUN5Y2xlcn1cbiJdfQ==
