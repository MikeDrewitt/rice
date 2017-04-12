(function() {
  var CompositeDisposable, Emitter, PanelContainer, ref;

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  module.exports = PanelContainer = (function() {
    function PanelContainer(arg) {
      this.location = (arg != null ? arg : {}).location;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.panels = [];
    }

    PanelContainer.prototype.destroy = function() {
      var j, len, panel, ref1;
      ref1 = this.getPanels();
      for (j = 0, len = ref1.length; j < len; j++) {
        panel = ref1[j];
        panel.destroy();
      }
      this.subscriptions.dispose();
      this.emitter.emit('did-destroy', this);
      return this.emitter.dispose();
    };


    /*
    Section: Event Subscription
     */

    PanelContainer.prototype.onDidAddPanel = function(callback) {
      return this.emitter.on('did-add-panel', callback);
    };

    PanelContainer.prototype.onDidRemovePanel = function(callback) {
      return this.emitter.on('did-remove-panel', callback);
    };

    PanelContainer.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Panels
     */

    PanelContainer.prototype.getLocation = function() {
      return this.location;
    };

    PanelContainer.prototype.isModal = function() {
      return this.location === 'modal';
    };

    PanelContainer.prototype.getPanels = function() {
      return this.panels;
    };

    PanelContainer.prototype.addPanel = function(panel) {
      var index;
      this.subscriptions.add(panel.onDidDestroy(this.panelDestroyed.bind(this)));
      index = this.getPanelIndex(panel);
      if (index === this.panels.length) {
        this.panels.push(panel);
      } else {
        this.panels.splice(index, 0, panel);
      }
      this.emitter.emit('did-add-panel', {
        panel: panel,
        index: index
      });
      return panel;
    };

    PanelContainer.prototype.panelForItem = function(item) {
      var j, len, panel, ref1;
      ref1 = this.panels;
      for (j = 0, len = ref1.length; j < len; j++) {
        panel = ref1[j];
        if (panel.getItem() === item) {
          return panel;
        }
      }
      return null;
    };

    PanelContainer.prototype.panelDestroyed = function(panel) {
      var index;
      index = this.panels.indexOf(panel);
      if (index > -1) {
        this.panels.splice(index, 1);
        return this.emitter.emit('did-remove-panel', {
          panel: panel,
          index: index
        });
      }
    };

    PanelContainer.prototype.getPanelIndex = function(panel) {
      var i, j, k, len, p, priority, ref1, ref2, ref3;
      priority = panel.getPriority();
      if ((ref1 = this.location) === 'bottom' || ref1 === 'right') {
        ref2 = this.panels;
        for (i = j = ref2.length - 1; j >= 0; i = j += -1) {
          p = ref2[i];
          if (priority < p.getPriority()) {
            return i + 1;
          }
        }
        return 0;
      } else {
        ref3 = this.panels;
        for (i = k = 0, len = ref3.length; k < len; i = ++k) {
          p = ref3[i];
          if (priority < p.getPriority()) {
            return i;
          }
        }
        return this.panels.length;
      }
    };

    return PanelContainer;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lbC1jb250YWluZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHdCQUFDLEdBQUQ7TUFBRSxJQUFDLENBQUEsMEJBQUYsTUFBWSxJQUFWO01BQ2QsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsTUFBRCxHQUFVO0lBSEM7OzZCQUtiLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxLQUFLLENBQUMsT0FBTixDQUFBO0FBQUE7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQWQsRUFBNkIsSUFBN0I7YUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBQTtJQUpPOzs7QUFNVDs7Ozs2QkFJQSxhQUFBLEdBQWUsU0FBQyxRQUFEO2FBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksZUFBWixFQUE2QixRQUE3QjtJQURhOzs2QkFHZixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7YUFDaEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksa0JBQVosRUFBZ0MsUUFBaEM7SUFEZ0I7OzZCQUdsQixZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURZOzs7QUFHZDs7Ozs2QkFJQSxXQUFBLEdBQWEsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs2QkFFYixPQUFBLEdBQVMsU0FBQTthQUFHLElBQUMsQ0FBQSxRQUFELEtBQWE7SUFBaEI7OzZCQUVULFNBQUEsR0FBVyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzZCQUVYLFFBQUEsR0FBVSxTQUFDLEtBQUQ7QUFDUixVQUFBO01BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLEtBQUssQ0FBQyxZQUFOLENBQW1CLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsQ0FBbkIsQ0FBbkI7TUFFQSxLQUFBLEdBQVEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxLQUFmO01BQ1IsSUFBRyxLQUFBLEtBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFwQjtRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLEtBQWIsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBZSxLQUFmLEVBQXNCLENBQXRCLEVBQXlCLEtBQXpCLEVBSEY7O01BS0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsZUFBZCxFQUErQjtRQUFDLE9BQUEsS0FBRDtRQUFRLE9BQUEsS0FBUjtPQUEvQjthQUNBO0lBVlE7OzZCQVlWLFlBQUEsR0FBYyxTQUFDLElBQUQ7QUFDWixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQWdCLEtBQUssQ0FBQyxPQUFOLENBQUEsQ0FBQSxLQUFtQixJQUFuQztBQUFBLGlCQUFPLE1BQVA7O0FBREY7YUFFQTtJQUhZOzs2QkFLZCxjQUFBLEdBQWdCLFNBQUMsS0FBRDtBQUNkLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLEtBQWhCO01BQ1IsSUFBRyxLQUFBLEdBQVEsQ0FBQyxDQUFaO1FBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQWUsS0FBZixFQUFzQixDQUF0QjtlQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGtCQUFkLEVBQWtDO1VBQUMsT0FBQSxLQUFEO1VBQVEsT0FBQSxLQUFSO1NBQWxDLEVBRkY7O0lBRmM7OzZCQU1oQixhQUFBLEdBQWUsU0FBQyxLQUFEO0FBQ2IsVUFBQTtNQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsV0FBTixDQUFBO01BQ1gsWUFBRyxJQUFDLENBQUEsU0FBRCxLQUFjLFFBQWQsSUFBQSxJQUFBLEtBQXdCLE9BQTNCO0FBQ0U7QUFBQSxhQUFBLDRDQUFBOztVQUNFLElBQWdCLFFBQUEsR0FBVyxDQUFDLENBQUMsV0FBRixDQUFBLENBQTNCO0FBQUEsbUJBQU8sQ0FBQSxHQUFJLEVBQVg7O0FBREY7ZUFFQSxFQUhGO09BQUEsTUFBQTtBQUtFO0FBQUEsYUFBQSw4Q0FBQTs7VUFDRSxJQUFZLFFBQUEsR0FBVyxDQUFDLENBQUMsV0FBRixDQUFBLENBQXZCO0FBQUEsbUJBQU8sRUFBUDs7QUFERjtlQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FQVjs7SUFGYTs7Ozs7QUE3RGpCIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYW5lbENvbnRhaW5lclxuICBjb25zdHJ1Y3RvcjogKHtAbG9jYXRpb259PXt9KSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHBhbmVscyA9IFtdXG5cbiAgZGVzdHJveTogLT5cbiAgICBwYW5lbC5kZXN0cm95KCkgZm9yIHBhbmVsIGluIEBnZXRQYW5lbHMoKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95JywgdGhpc1xuICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgb25EaWRBZGRQYW5lbDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLXBhbmVsJywgY2FsbGJhY2tcblxuICBvbkRpZFJlbW92ZVBhbmVsOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZW1vdmUtcGFuZWwnLCBjYWxsYmFja1xuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IFBhbmVsc1xuICAjIyNcblxuICBnZXRMb2NhdGlvbjogLT4gQGxvY2F0aW9uXG5cbiAgaXNNb2RhbDogLT4gQGxvY2F0aW9uIGlzICdtb2RhbCdcblxuICBnZXRQYW5lbHM6IC0+IEBwYW5lbHNcblxuICBhZGRQYW5lbDogKHBhbmVsKSAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBwYW5lbC5vbkRpZERlc3Ryb3koQHBhbmVsRGVzdHJveWVkLmJpbmQodGhpcykpXG5cbiAgICBpbmRleCA9IEBnZXRQYW5lbEluZGV4KHBhbmVsKVxuICAgIGlmIGluZGV4IGlzIEBwYW5lbHMubGVuZ3RoXG4gICAgICBAcGFuZWxzLnB1c2gocGFuZWwpXG4gICAgZWxzZVxuICAgICAgQHBhbmVscy5zcGxpY2UoaW5kZXgsIDAsIHBhbmVsKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFkZC1wYW5lbCcsIHtwYW5lbCwgaW5kZXh9XG4gICAgcGFuZWxcblxuICBwYW5lbEZvckl0ZW06IChpdGVtKSAtPlxuICAgIGZvciBwYW5lbCBpbiBAcGFuZWxzXG4gICAgICByZXR1cm4gcGFuZWwgaWYgcGFuZWwuZ2V0SXRlbSgpIGlzIGl0ZW1cbiAgICBudWxsXG5cbiAgcGFuZWxEZXN0cm95ZWQ6IChwYW5lbCkgLT5cbiAgICBpbmRleCA9IEBwYW5lbHMuaW5kZXhPZihwYW5lbClcbiAgICBpZiBpbmRleCA+IC0xXG4gICAgICBAcGFuZWxzLnNwbGljZShpbmRleCwgMSlcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1yZW1vdmUtcGFuZWwnLCB7cGFuZWwsIGluZGV4fVxuXG4gIGdldFBhbmVsSW5kZXg6IChwYW5lbCkgLT5cbiAgICBwcmlvcml0eSA9IHBhbmVsLmdldFByaW9yaXR5KClcbiAgICBpZiBAbG9jYXRpb24gaW4gWydib3R0b20nLCAncmlnaHQnXVxuICAgICAgZm9yIHAsIGkgaW4gQHBhbmVscyBieSAtMVxuICAgICAgICByZXR1cm4gaSArIDEgaWYgcHJpb3JpdHkgPCBwLmdldFByaW9yaXR5KClcbiAgICAgIDBcbiAgICBlbHNlXG4gICAgICBmb3IgcCwgaSBpbiBAcGFuZWxzXG4gICAgICAgIHJldHVybiBpIGlmIHByaW9yaXR5IDwgcC5nZXRQcmlvcml0eSgpXG4gICAgICBAcGFuZWxzLmxlbmd0aFxuIl19
