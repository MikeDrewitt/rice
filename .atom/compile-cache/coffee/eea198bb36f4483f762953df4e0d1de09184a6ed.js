(function() {
  var ListView;

  module.exports = ListView = (function() {
    function ListView(list, container, createView) {
      this.list = list;
      this.container = container;
      this.createView = createView;
      this.views = [];
      this.viewMap = {};
      this.list.onDidAddItem((function(_this) {
        return function(item) {
          return _this.addView(item);
        };
      })(this));
      this.list.onDidRemoveItem((function(_this) {
        return function(item) {
          return _this.removeView(item);
        };
      })(this));
      this.addViews();
    }

    ListView.prototype.getViews = function() {
      return this.views;
    };

    ListView.prototype.filterViews = function(filterFn) {
      var i, item, len, ref, results;
      ref = this.list.filterItems(filterFn);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(this.viewMap[this.list.keyForItem(item)]);
      }
      return results;
    };

    ListView.prototype.addViews = function() {
      var i, item, len, ref;
      ref = this.list.getItems();
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        this.addView(item);
      }
    };

    ListView.prototype.addView = function(item) {
      var view;
      view = this.createView(item);
      this.views.push(view);
      this.viewMap[this.list.keyForItem(item)] = view;
      return this.container.prepend(view);
    };

    ListView.prototype.removeView = function(item) {
      var index, key, view;
      key = this.list.keyForItem(item);
      view = this.viewMap[key];
      if (view != null) {
        index = this.views.indexOf(view);
        if (index > -1) {
          this.views.splice(index, 1);
        }
        delete this.viewMap[key];
        return view.remove();
      }
    };

    return ListView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9saXN0LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNNO0lBS1Msa0JBQUMsSUFBRCxFQUFRLFNBQVIsRUFBb0IsVUFBcEI7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxZQUFEO01BQVksSUFBQyxDQUFBLGFBQUQ7TUFDL0IsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsSUFBSSxDQUFDLFlBQU4sQ0FBbUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLElBQUQ7aUJBQVUsS0FBQyxDQUFBLE9BQUQsQ0FBUyxJQUFUO1FBQVY7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5CO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxlQUFOLENBQXNCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFEO2lCQUFVLEtBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtRQUFWO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtNQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7SUFMVzs7dUJBT2IsUUFBQSxHQUFVLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7dUJBRVYsV0FBQSxHQUFhLFNBQUMsUUFBRDtBQUNYLFVBQUE7QUFBQztBQUFBO1dBQUEscUNBQUE7O3FCQUFBLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLENBQWlCLElBQWpCLENBQUE7QUFBVDs7SUFEVTs7dUJBR2IsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUNFLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVDtBQURGO0lBRFE7O3VCQUtWLE9BQUEsR0FBUyxTQUFDLElBQUQ7QUFDUCxVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtNQUNQLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLElBQVo7TUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixDQUFpQixJQUFqQixDQUFBLENBQVQsR0FBbUM7YUFDbkMsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFYLENBQW1CLElBQW5CO0lBSk87O3VCQU1ULFVBQUEsR0FBWSxTQUFDLElBQUQ7QUFDVixVQUFBO01BQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixDQUFpQixJQUFqQjtNQUNOLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBUSxDQUFBLEdBQUE7TUFDaEIsSUFBRyxZQUFIO1FBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWY7UUFDUixJQUEyQixLQUFBLEdBQVEsQ0FBQyxDQUFwQztVQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLEtBQWQsRUFBcUIsQ0FBckIsRUFBQTs7UUFDQSxPQUFPLElBQUMsQ0FBQSxPQUFRLENBQUEsR0FBQTtlQUNoQixJQUFJLENBQUMsTUFBTCxDQUFBLEVBSkY7O0lBSFU7Ozs7O0FBN0JkIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgTGlzdFZpZXdcbiAgIyAqIGBsaXN0YCBhIHtMaXN0fSBvYmplY3RcbiAgIyAqIGBjb250YWluZXJgIGEgalF1ZXJ5IGVsZW1lbnRcbiAgIyAqIGBjcmVhdGVWaWV3YCBhIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGpRdWVyeSBlbGVtZW50IC8gSFRNTEVsZW1lbnRcbiAgIyAgICogYGl0ZW1gIHRoZSBpdGVtIHRvIGNyZWF0ZSB0aGUgdmlldyBmb3JcbiAgY29uc3RydWN0b3I6IChAbGlzdCwgQGNvbnRhaW5lciwgQGNyZWF0ZVZpZXcpIC0+XG4gICAgQHZpZXdzID0gW11cbiAgICBAdmlld01hcCA9IHt9XG4gICAgQGxpc3Qub25EaWRBZGRJdGVtIChpdGVtKSA9PiBAYWRkVmlldyhpdGVtKVxuICAgIEBsaXN0Lm9uRGlkUmVtb3ZlSXRlbSAoaXRlbSkgPT4gQHJlbW92ZVZpZXcoaXRlbSlcbiAgICBAYWRkVmlld3MoKVxuXG4gIGdldFZpZXdzOiAtPiBAdmlld3NcblxuICBmaWx0ZXJWaWV3czogKGZpbHRlckZuKSAtPlxuICAgIChAdmlld01hcFtAbGlzdC5rZXlGb3JJdGVtKGl0ZW0pXSBmb3IgaXRlbSBpbiBAbGlzdC5maWx0ZXJJdGVtcyhmaWx0ZXJGbikpXG5cbiAgYWRkVmlld3M6IC0+XG4gICAgZm9yIGl0ZW0gaW4gQGxpc3QuZ2V0SXRlbXMoKVxuICAgICAgQGFkZFZpZXcoaXRlbSlcbiAgICByZXR1cm5cblxuICBhZGRWaWV3OiAoaXRlbSkgLT5cbiAgICB2aWV3ID0gQGNyZWF0ZVZpZXcoaXRlbSlcbiAgICBAdmlld3MucHVzaCh2aWV3KVxuICAgIEB2aWV3TWFwW0BsaXN0LmtleUZvckl0ZW0oaXRlbSldID0gdmlld1xuICAgIEBjb250YWluZXIucHJlcGVuZCh2aWV3KVxuXG4gIHJlbW92ZVZpZXc6IChpdGVtKSAtPlxuICAgIGtleSA9IEBsaXN0LmtleUZvckl0ZW0oaXRlbSlcbiAgICB2aWV3ID0gQHZpZXdNYXBba2V5XVxuICAgIGlmIHZpZXc/XG4gICAgICBpbmRleCA9IEB2aWV3cy5pbmRleE9mKHZpZXcpXG4gICAgICBAdmlld3Muc3BsaWNlKGluZGV4LCAxKSBpZiBpbmRleCA+IC0xXG4gICAgICBkZWxldGUgQHZpZXdNYXBba2V5XVxuICAgICAgdmlldy5yZW1vdmUoKVxuIl19
