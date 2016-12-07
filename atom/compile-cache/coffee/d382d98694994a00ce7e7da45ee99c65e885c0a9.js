(function() {
  var Disposable, StatusBarView, Tile,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  Tile = require('./tile');

  StatusBarView = (function(superClass) {
    extend(StatusBarView, superClass);

    function StatusBarView() {
      return StatusBarView.__super__.constructor.apply(this, arguments);
    }

    StatusBarView.prototype.createdCallback = function() {
      var flexboxHackElement;
      this.classList.add('status-bar');
      flexboxHackElement = document.createElement('div');
      flexboxHackElement.classList.add('flexbox-repaint-hack');
      this.appendChild(flexboxHackElement);
      this.leftPanel = document.createElement('div');
      this.leftPanel.classList.add('status-bar-left');
      flexboxHackElement.appendChild(this.leftPanel);
      this.rightPanel = document.createElement('div');
      this.rightPanel.classList.add('status-bar-right');
      flexboxHackElement.appendChild(this.rightPanel);
      this.leftTiles = [];
      return this.rightTiles = [];
    };

    StatusBarView.prototype.initialize = function() {
      this.bufferSubscriptions = [];
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          _this.unsubscribeAllFromBuffer();
          _this.storeActiveBuffer();
          _this.subscribeAllToBuffer();
          return _this.dispatchEvent(new CustomEvent('active-buffer-changed', {
            bubbles: true
          }));
        };
      })(this));
      this.storeActiveBuffer();
      return this;
    };

    StatusBarView.prototype.destroy = function() {
      this.activeItemSubscription.dispose();
      this.unsubscribeAllFromBuffer();
      return this.remove();
    };

    StatusBarView.prototype.addLeftTile = function(options) {
      var i, index, item, len, newElement, newItem, newPriority, newTile, nextElement, nextItem, priority, ref, ref1, ref2;
      newItem = options.item;
      newPriority = (ref = options != null ? options.priority : void 0) != null ? ref : this.leftTiles[this.leftTiles.length - 1].priority + 1;
      nextItem = null;
      ref1 = this.leftTiles;
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        ref2 = ref1[index], priority = ref2.priority, item = ref2.item;
        if (priority > newPriority) {
          nextItem = item;
          break;
        }
      }
      newTile = new Tile(newItem, newPriority, this.leftTiles);
      this.leftTiles.splice(index, 0, newTile);
      newElement = atom.views.getView(newItem);
      nextElement = atom.views.getView(nextItem);
      this.leftPanel.insertBefore(newElement, nextElement);
      return newTile;
    };

    StatusBarView.prototype.addRightTile = function(options) {
      var i, index, item, len, newElement, newItem, newPriority, newTile, nextElement, nextItem, priority, ref, ref1, ref2;
      newItem = options.item;
      newPriority = (ref = options != null ? options.priority : void 0) != null ? ref : this.rightTiles[0].priority + 1;
      nextItem = null;
      ref1 = this.rightTiles;
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        ref2 = ref1[index], priority = ref2.priority, item = ref2.item;
        if (priority < newPriority) {
          nextItem = item;
          break;
        }
      }
      newTile = new Tile(newItem, newPriority, this.rightTiles);
      this.rightTiles.splice(index, 0, newTile);
      newElement = atom.views.getView(newItem);
      nextElement = atom.views.getView(nextItem);
      this.rightPanel.insertBefore(newElement, nextElement);
      return newTile;
    };

    StatusBarView.prototype.getLeftTiles = function() {
      return this.leftTiles;
    };

    StatusBarView.prototype.getRightTiles = function() {
      return this.rightTiles;
    };

    StatusBarView.prototype.getActiveBuffer = function() {
      return this.buffer;
    };

    StatusBarView.prototype.getActiveItem = function() {
      return atom.workspace.getActivePaneItem();
    };

    StatusBarView.prototype.storeActiveBuffer = function() {
      var ref;
      return this.buffer = (ref = this.getActiveItem()) != null ? typeof ref.getBuffer === "function" ? ref.getBuffer() : void 0 : void 0;
    };

    StatusBarView.prototype.subscribeToBuffer = function(event, callback) {
      this.bufferSubscriptions.push([event, callback]);
      if (this.buffer) {
        return this.buffer.on(event, callback);
      }
    };

    StatusBarView.prototype.subscribeAllToBuffer = function() {
      var callback, event, i, len, ref, ref1, results;
      if (!this.buffer) {
        return;
      }
      ref = this.bufferSubscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        ref1 = ref[i], event = ref1[0], callback = ref1[1];
        results.push(this.buffer.on(event, callback));
      }
      return results;
    };

    StatusBarView.prototype.unsubscribeAllFromBuffer = function() {
      var callback, event, i, len, ref, ref1, results;
      if (!this.buffer) {
        return;
      }
      ref = this.bufferSubscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        ref1 = ref[i], event = ref1[0], callback = ref1[1];
        results.push(this.buffer.off(event, callback));
      }
      return results;
    };

    return StatusBarView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar', {
    prototype: StatusBarView.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9zdGF0dXMtYmFyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrQkFBQTtJQUFBOzs7RUFBQyxhQUFjLE9BQUEsQ0FBUSxNQUFSOztFQUNmLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7Ozs7Ozs0QkFDSixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsWUFBZjtNQUVBLGtCQUFBLEdBQXFCLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ3JCLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxHQUE3QixDQUFpQyxzQkFBakM7TUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLGtCQUFiO01BRUEsSUFBQyxDQUFBLFNBQUQsR0FBYSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNiLElBQUMsQ0FBQSxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQXJCLENBQXlCLGlCQUF6QjtNQUNBLGtCQUFrQixDQUFDLFdBQW5CLENBQStCLElBQUMsQ0FBQSxTQUFoQztNQUVBLElBQUMsQ0FBQSxVQUFELEdBQWMsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDZCxJQUFDLENBQUEsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUF0QixDQUEwQixrQkFBMUI7TUFDQSxrQkFBa0IsQ0FBQyxXQUFuQixDQUErQixJQUFDLENBQUEsVUFBaEM7TUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhO2FBQ2IsSUFBQyxDQUFBLFVBQUQsR0FBYztJQWhCQzs7NEJBa0JqQixVQUFBLEdBQVksU0FBQTtNQUNWLElBQUMsQ0FBQSxtQkFBRCxHQUF1QjtNQUV2QixJQUFDLENB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aUJBQUEsR0FBbUIsU0FBQyxLQUFELEVBQVEsUUFBUjtNQUNqQixJQUFDLENBQUEsbUJBQW1CLENBQUMsSUFBckIsQ0FBMEIsQ0FBQyxLQUFELEVBQVEsUUFBUixDQUExQjtNQUNBLElBQStCLElBQUMsQ0FBQSxNQUFoQztlQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLEtBQVgsRUFBa0IsUUFBbEIsRUFBQTs7SUFGaUI7OzRCQUluQixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFVBQUE7TUFBQSxJQUFBLENBQWMsSUFBQyxDQUFBLE1BQWY7QUFBQSxlQUFBOztBQUNBO0FBQUE7V0FBQSxxQ0FBQTt1QkFBSyxpQkFBTztxQkFDVixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxLQUFYLEVBQWtCLFFBQWxCO0FBREY7O0lBRm9COzs0QkFLdEIsd0JBQUEsR0FBMEIsU0FBQTtBQUN4QixVQUFBO01BQUEsSUFBQSxDQUFjLElBQUMsQ0FBQSxNQUFmO0FBQUEsZUFBQTs7QUFDQTtBQUFBO1dBQUEscUNBQUE7dUJBQUssaUJBQU87cUJBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksS0FBWixFQUFtQixRQUFuQjtBQURGOztJQUZ3Qjs7OztLQTdGQTs7RUFrRzVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQVEsQ0FBQyxlQUFULENBQXlCLFlBQXpCLEVBQXVDO0lBQUEsU0FBQSxFQUFXLGFBQWEsQ0FBQyxTQUF6QjtHQUF2QztBQXJHakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuVGlsZSA9IHJlcXVpcmUgJy4vdGlsZSdcblxuY2xhc3MgU3RhdHVzQmFyVmlldyBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnc3RhdHVzLWJhcicpXG5cbiAgICBmbGV4Ym94SGFja0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIGZsZXhib3hIYWNrRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmbGV4Ym94LXJlcGFpbnQtaGFjaycpXG4gICAgQGFwcGVuZENoaWxkKGZsZXhib3hIYWNrRWxlbWVudClcblxuICAgIEBsZWZ0UGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBsZWZ0UGFuZWwuY2xhc3NMaXN0LmFkZCgnc3RhdHVzLWJhci1sZWZ0JylcbiAgICBmbGV4Ym94SGFja0VsZW1lbnQuYXBwZW5kQ2hpbGQoQGxlZnRQYW5lbClcblxuICAgIEByaWdodFBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAcmlnaHRQYW5lbC5jbGFzc0xpc3QuYWRkKCdzdGF0dXMtYmFyLXJpZ2h0JylcbiAgICBmbGV4Ym94SGFja0VsZW1lbnQuYXBwZW5kQ2hpbGQoQHJpZ2h0UGFuZWwpXG5cbiAgICBAbGVmdFRpbGVzID0gW11cbiAgICBAcmlnaHRUaWxlcyA9IFtdXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAYnVmZmVyU3Vic2NyaXB0aW9ucyA9IFtdXG5cbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbiA9IGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEB1bnN1YnNjcmliZUFsbEZyb21CdWZmZXIoKVxuICAgICAgQHN0b3JlQWN0aXZlQnVmZmVyKClcbiAgICAgIEBzdWJzY3JpYmVBbGxUb0J1ZmZlcigpXG5cbiAgICAgIEBkaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnYWN0aXZlLWJ1ZmZlci1jaGFuZ2VkJywgYnViYmxlczogdHJ1ZSkpXG5cbiAgICBAc3RvcmVBY3RpdmVCdWZmZXIoKVxuICAgIHRoaXNcblxuICBkZXN0cm95OiAtPlxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgIEB1bnN1YnNjcmliZUFsbEZyb21CdWZmZXIoKVxuICAgIEByZW1vdmUoKVxuXG4gIGFkZExlZnRUaWxlOiAob3B0aW9ucykgLT5cbiAgICBuZXdJdGVtID0gb3B0aW9ucy5pdGVtXG4gICAgbmV3UHJpb3JpdHkgPSBvcHRpb25zPy5wcmlvcml0eSA/IEBsZWZ0VGlsZXNbQGxlZnRUaWxlcy5sZW5ndGggLSAxXS5wcmlvcml0eSArIDFcbiAgICBuZXh0SXRlbSA9IG51bGxcbiAgICBmb3Ige3ByaW9yaXR5LCBpdGVtfSwgaW5kZXggaW4gQGxlZnRUaWxlc1xuICAgICAgaWYgcHJpb3JpdHkgPiBuZXdQcmlvcml0eVxuICAgICAgICBuZXh0SXRlbSA9IGl0ZW1cbiAgICAgICAgYnJlYWtcblxuICAgIG5ld1RpbGUgPSBuZXcgVGlsZShuZXdJdGVtLCBuZXdQcmlvcml0eSwgQGxlZnRUaWxlcylcbiAgICBAbGVmdFRpbGVzLnNwbGljZShpbmRleCwgMCwgbmV3VGlsZSlcbiAgICBuZXdFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KG5ld0l0ZW0pXG4gICAgbmV4dEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcobmV4dEl0ZW0pXG4gICAgQGxlZnRQYW5lbC5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgbmV4dEVsZW1lbnQpXG4gICAgbmV3VGlsZVxuXG4gIGFkZFJpZ2h0VGlsZTogKG9wdGlvbnMpIC0+XG4gICAgbmV3SXRlbSA9IG9wdGlvbnMuaXRlbVxuICAgIG5ld1ByaW9yaXR5ID0gb3B0aW9ucz8ucHJpb3JpdHkgPyBAcmlnaHRUaWxlc1swXS5wcmlvcml0eSArIDFcbiAgICBuZXh0SXRlbSA9IG51bGxcbiAgICBmb3Ige3ByaW9yaXR5LCBpdGVtfSwgaW5kZXggaW4gQHJpZ2h0VGlsZXNcbiAgICAgIGlmIHByaW9yaXR5IDwgbmV3UHJpb3JpdHlcbiAgICAgICAgbmV4dEl0ZW0gPSBpdGVtXG4gICAgICAgIGJyZWFrXG5cbiAgICBuZXdUaWxlID0gbmV3IFRpbGUobmV3SXRlbSwgbmV3UHJpb3JpdHksIEByaWdodFRpbGVzKVxuICAgIEByaWdodFRpbGVzLnNwbGljZShpbmRleCwgMCwgbmV3VGlsZSlcbiAgICBuZXdFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KG5ld0l0ZW0pXG4gICAgbmV4dEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcobmV4dEl0ZW0pXG4gICAgQHJpZ2h0UGFuZWwuaW5zZXJ0QmVmb3JlKG5ld0VsZW1lbnQsIG5leHRFbGVtZW50KVxuICAgIG5ld1RpbGVcblxuICBnZXRMZWZ0VGlsZXM6IC0+XG4gICAgQGxlZnRUaWxlc1xuXG4gIGdldFJpZ2h0VGlsZXM6IC0+XG4gICAgQHJpZ2h0VGlsZXNcblxuICBnZXRBY3RpdmVCdWZmZXI6IC0+XG4gICAgQGJ1ZmZlclxuXG4gIGdldEFjdGl2ZUl0ZW06IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuXG4gIHN0b3JlQWN0aXZlQnVmZmVyOiAtPlxuICAgIEBidWZmZXIgPSBAZ2V0QWN0aXZlSXRlbSgpPy5nZXRCdWZmZXI/KClcblxuICBzdWJzY3JpYmVUb0J1ZmZlcjogKGV2ZW50LCBjYWxsYmFjaykgLT5cbiAgICBAYnVmZmVyU3Vic2NyaXB0aW9ucy5wdXNoKFtldmVudCwgY2FsbGJhY2tdKVxuICAgIEBidWZmZXIub24oZXZlbnQsIGNhbGxiYWNrKSBpZiBAYnVmZmVyXG5cbiAgc3Vic2NyaWJlQWxsVG9CdWZmZXI6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYnVmZmVyXG4gICAgZm9yIFtldmVudCwgY2FsbGJhY2tdIGluIEBidWZmZXJTdWJzY3JpcHRpb25zXG4gICAgICBAYnVmZmVyLm9uKGV2ZW50LCBjYWxsYmFjaylcblxuICB1bnN1YnNjcmliZUFsbEZyb21CdWZmZXI6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYnVmZmVyXG4gICAgZm9yIFtldmVudCwgY2FsbGJhY2tdIGluIEBidWZmZXJTdWJzY3JpcHRpb25zXG4gICAgICBAYnVmZmVyLm9mZihldmVudCwgY2FsbGJhY2spXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdzdGF0dXMtYmFyJywgcHJvdG90eXBlOiBTdGF0dXNCYXJWaWV3LnByb3RvdHlwZSlcbiJdfQ==
