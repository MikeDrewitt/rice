(function() {
  var CompositeDisposable, Emitter, Model, PaneAxis, flatten, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  flatten = require('underscore-plus').flatten;

  Model = require('./model');

  module.exports = PaneAxis = (function(superClass) {
    extend(PaneAxis, superClass);

    PaneAxis.prototype.parent = null;

    PaneAxis.prototype.container = null;

    PaneAxis.prototype.orientation = null;

    PaneAxis.deserialize = function(state, arg) {
      var deserializers;
      deserializers = arg.deserializers;
      state.children = state.children.map(function(childState) {
        return deserializers.deserialize(childState);
      });
      return new this(state);
    };

    function PaneAxis(arg) {
      var child, children, flexScale, i, len, ref1;
      ref1 = arg != null ? arg : {}, this.orientation = ref1.orientation, children = ref1.children, flexScale = ref1.flexScale;
      this.emitter = new Emitter;
      this.subscriptionsByChild = new WeakMap;
      this.subscriptions = new CompositeDisposable;
      this.children = [];
      if (children != null) {
        for (i = 0, len = children.length; i < len; i++) {
          child = children[i];
          this.addChild(child);
        }
      }
      this.flexScale = flexScale != null ? flexScale : 1;
    }

    PaneAxis.prototype.serialize = function() {
      return {
        deserializer: 'PaneAxis',
        children: this.children.map(function(child) {
          return child.serialize();
        }),
        orientation: this.orientation,
        flexScale: this.flexScale
      };
    };

    PaneAxis.prototype.getFlexScale = function() {
      return this.flexScale;
    };

    PaneAxis.prototype.setFlexScale = function(flexScale1) {
      this.flexScale = flexScale1;
      this.emitter.emit('did-change-flex-scale', this.flexScale);
      return this.flexScale;
    };

    PaneAxis.prototype.getParent = function() {
      return this.parent;
    };

    PaneAxis.prototype.setParent = function(parent) {
      this.parent = parent;
      return this.parent;
    };

    PaneAxis.prototype.getContainer = function() {
      return this.container;
    };

    PaneAxis.prototype.setContainer = function(container) {
      var child, i, len, ref1, results;
      if (container && container !== this.container) {
        this.container = container;
        ref1 = this.children;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          child = ref1[i];
          results.push(child.setContainer(container));
        }
        return results;
      }
    };

    PaneAxis.prototype.getOrientation = function() {
      return this.orientation;
    };

    PaneAxis.prototype.getChildren = function() {
      return this.children.slice();
    };

    PaneAxis.prototype.getPanes = function() {
      return flatten(this.children.map(function(child) {
        return child.getPanes();
      }));
    };

    PaneAxis.prototype.getItems = function() {
      return flatten(this.children.map(function(child) {
        return child.getItems();
      }));
    };

    PaneAxis.prototype.onDidAddChild = function(fn) {
      return this.emitter.on('did-add-child', fn);
    };

    PaneAxis.prototype.onDidRemoveChild = function(fn) {
      return this.emitter.on('did-remove-child', fn);
    };

    PaneAxis.prototype.onDidReplaceChild = function(fn) {
      return this.emitter.on('did-replace-child', fn);
    };

    PaneAxis.prototype.onDidDestroy = function(fn) {
      return this.emitter.on('did-destroy', fn);
    };

    PaneAxis.prototype.onDidChangeFlexScale = function(fn) {
      return this.emitter.on('did-change-flex-scale', fn);
    };

    PaneAxis.prototype.observeFlexScale = function(fn) {
      fn(this.flexScale);
      return this.onDidChangeFlexScale(fn);
    };

    PaneAxis.prototype.addChild = function(child, index) {
      if (index == null) {
        index = this.children.length;
      }
      this.children.splice(index, 0, child);
      child.setParent(this);
      child.setContainer(this.container);
      this.subscribeToChild(child);
      return this.emitter.emit('did-add-child', {
        child: child,
        index: index
      });
    };

    PaneAxis.prototype.adjustFlexScale = function() {
      var child, i, j, len, len1, needTotal, ref1, ref2, results, total;
      total = 0;
      ref1 = this.children;
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        total += child.getFlexScale();
      }
      needTotal = this.children.length;
      ref2 = this.children;
      results = [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        child = ref2[j];
        results.push(child.setFlexScale(needTotal * child.getFlexScale() / total));
      }
      return results;
    };

    PaneAxis.prototype.removeChild = function(child, replacing) {
      var index;
      if (replacing == null) {
        replacing = false;
      }
      index = this.children.indexOf(child);
      if (index === -1) {
        throw new Error("Removing non-existent child");
      }
      this.unsubscribeFromChild(child);
      this.children.splice(index, 1);
      this.adjustFlexScale();
      this.emitter.emit('did-remove-child', {
        child: child,
        index: index
      });
      if (!replacing && this.children.length < 2) {
        return this.reparentLastChild();
      }
    };

    PaneAxis.prototype.replaceChild = function(oldChild, newChild) {
      var index;
      this.unsubscribeFromChild(oldChild);
      this.subscribeToChild(newChild);
      newChild.setParent(this);
      newChild.setContainer(this.container);
      index = this.children.indexOf(oldChild);
      this.children.splice(index, 1, newChild);
      return this.emitter.emit('did-replace-child', {
        oldChild: oldChild,
        newChild: newChild,
        index: index
      });
    };

    PaneAxis.prototype.insertChildBefore = function(currentChild, newChild) {
      var index;
      index = this.children.indexOf(currentChild);
      return this.addChild(newChild, index);
    };

    PaneAxis.prototype.insertChildAfter = function(currentChild, newChild) {
      var index;
      index = this.children.indexOf(currentChild);
      return this.addChild(newChild, index + 1);
    };

    PaneAxis.prototype.reparentLastChild = function() {
      var lastChild;
      lastChild = this.children[0];
      lastChild.setFlexScale(this.flexScale);
      this.parent.replaceChild(this, lastChild);
      return this.destroy();
    };

    PaneAxis.prototype.subscribeToChild = function(child) {
      var subscription;
      subscription = child.onDidDestroy((function(_this) {
        return function() {
          return _this.removeChild(child);
        };
      })(this));
      this.subscriptionsByChild.set(child, subscription);
      return this.subscriptions.add(subscription);
    };

    PaneAxis.prototype.unsubscribeFromChild = function(child) {
      var subscription;
      subscription = this.subscriptionsByChild.get(child);
      this.subscriptions.remove(subscription);
      return subscription.dispose();
    };

    PaneAxis.prototype.destroyed = function() {
      this.subscriptions.dispose();
      this.emitter.emit('did-destroy');
      return this.emitter.dispose();
    };

    return PaneAxis;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLWF4aXMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyREFBQTtJQUFBOzs7RUFBQSxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1QsVUFBVyxPQUFBLENBQVEsaUJBQVI7O0VBQ1osS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUVSLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozt1QkFDSixNQUFBLEdBQVE7O3VCQUNSLFNBQUEsR0FBVzs7dUJBQ1gsV0FBQSxHQUFhOztJQUViLFFBQUMsQ0FBQSxXQUFELEdBQWMsU0FBQyxLQUFELEVBQVEsR0FBUjtBQUNaLFVBQUE7TUFEcUIsZ0JBQUQ7TUFDcEIsS0FBSyxDQUFDLFFBQU4sR0FBaUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFmLENBQW1CLFNBQUMsVUFBRDtlQUNsQyxhQUFhLENBQUMsV0FBZCxDQUEwQixVQUExQjtNQURrQyxDQUFuQjthQUViLElBQUEsSUFBQSxDQUFLLEtBQUw7SUFIUTs7SUFLRCxrQkFBQyxHQUFEO0FBQ1gsVUFBQTsyQkFEWSxNQUFvQyxJQUFuQyxJQUFDLENBQUEsbUJBQUEsYUFBYSwwQkFBVTtNQUNyQyxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsb0JBQUQsR0FBd0IsSUFBSTtNQUM1QixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFHLGdCQUFIO0FBQ0UsYUFBQSwwQ0FBQTs7VUFBQSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVY7QUFBQSxTQURGOztNQUVBLElBQUMsQ0FBQSxTQUFELHVCQUFhLFlBQVk7SUFQZDs7dUJBU2IsU0FBQSxHQUFX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O0FBQ2hCLFVBQUE7TUFBQSxZQUFBLEdBQWUsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQjtNQUNmLElBQUMsQ0FBQSxvQkFBb0IsQ0FBQyxHQUF0QixDQUEwQixLQUExQixFQUFpQyxZQUFqQzthQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixZQUFuQjtJQUhnQjs7dUJBS2xCLG9CQUFBLEdBQXNCLFNBQUMsS0FBRDtBQUNwQixVQUFBO01BQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxvQkFBb0IsQ0FBQyxHQUF0QixDQUEwQixLQUExQjtNQUNmLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixDQUFzQixZQUF0QjthQUNBLFlBQVksQ0FBQyxPQUFiLENBQUE7SUFIb0I7O3VCQUt0QixTQUFBLEdBQVcsU0FBQTtNQUNULElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZDthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBO0lBSFM7Ozs7S0F0SVU7QUFMdkIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG57ZmxhdHRlbn0gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhbmVBeGlzIGV4dGVuZHMgTW9kZWxcbiAgcGFyZW50OiBudWxsXG4gIGNvbnRhaW5lcjogbnVsbFxuICBvcmllbnRhdGlvbjogbnVsbFxuXG4gIEBkZXNlcmlhbGl6ZTogKHN0YXRlLCB7ZGVzZXJpYWxpemVyc30pIC0+XG4gICAgc3RhdGUuY2hpbGRyZW4gPSBzdGF0ZS5jaGlsZHJlbi5tYXAgKGNoaWxkU3RhdGUpIC0+XG4gICAgICBkZXNlcmlhbGl6ZXJzLmRlc2VyaWFsaXplKGNoaWxkU3RhdGUpXG4gICAgbmV3IHRoaXMoc3RhdGUpXG5cbiAgY29uc3RydWN0b3I6ICh7QG9yaWVudGF0aW9uLCBjaGlsZHJlbiwgZmxleFNjYWxlfT17fSkgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnNCeUNoaWxkID0gbmV3IFdlYWtNYXBcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGNoaWxkcmVuID0gW11cbiAgICBpZiBjaGlsZHJlbj9cbiAgICAgIEBhZGRDaGlsZChjaGlsZCkgZm9yIGNoaWxkIGluIGNoaWxkcmVuXG4gICAgQGZsZXhTY2FsZSA9IGZsZXhTY2FsZSA/IDFcblxuICBzZXJpYWxpemU6IC0+XG4gICAgZGVzZXJpYWxpemVyOiAnUGFuZUF4aXMnXG4gICAgY2hpbGRyZW46IEBjaGlsZHJlbi5tYXAgKGNoaWxkKSAtPiBjaGlsZC5zZXJpYWxpemUoKVxuICAgIG9yaWVudGF0aW9uOiBAb3JpZW50YXRpb25cbiAgICBmbGV4U2NhbGU6IEBmbGV4U2NhbGVcblxuICBnZXRGbGV4U2NhbGU6IC0+IEBmbGV4U2NhbGVcblxuICBzZXRGbGV4U2NhbGU6IChAZmxleFNjYWxlKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtZmxleC1zY2FsZScsIEBmbGV4U2NhbGVcbiAgICBAZmxleFNjYWxlXG5cbiAgZ2V0UGFyZW50OiAtPiBAcGFyZW50XG5cbiAgc2V0UGFyZW50OiAoQHBhcmVudCkgLT4gQHBhcmVudFxuXG4gIGdldENvbnRhaW5lcjogLT4gQGNvbnRhaW5lclxuXG4gIHNldENvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIgYW5kIGNvbnRhaW5lciBpc250IEBjb250YWluZXJcbiAgICAgIEBjb250YWluZXIgPSBjb250YWluZXJcbiAgICAgIGNoaWxkLnNldENvbnRhaW5lcihjb250YWluZXIpIGZvciBjaGlsZCBpbiBAY2hpbGRyZW5cblxuICBnZXRPcmllbnRhdGlvbjogLT4gQG9yaWVudGF0aW9uXG5cbiAgZ2V0Q2hpbGRyZW46IC0+IEBjaGlsZHJlbi5zbGljZSgpXG5cbiAgZ2V0UGFuZXM6IC0+XG4gICAgZmxhdHRlbihAY2hpbGRyZW4ubWFwIChjaGlsZCkgLT4gY2hpbGQuZ2V0UGFuZXMoKSlcblxuICBnZXRJdGVtczogLT5cbiAgICBmbGF0dGVuKEBjaGlsZHJlbi5tYXAgKGNoaWxkKSAtPiBjaGlsZC5nZXRJdGVtcygpKVxuXG4gIG9uRGlkQWRkQ2hpbGQ6IChmbikgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1jaGlsZCcsIGZuXG5cbiAgb25EaWRSZW1vdmVDaGlsZDogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtcmVtb3ZlLWNoaWxkJywgZm5cblxuICBvbkRpZFJlcGxhY2VDaGlsZDogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtcmVwbGFjZS1jaGlsZCcsIGZuXG5cbiAgb25EaWREZXN0cm95OiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kZXN0cm95JywgZm5cblxuICBvbkRpZENoYW5nZUZsZXhTY2FsZTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWZsZXgtc2NhbGUnLCBmblxuXG4gIG9ic2VydmVGbGV4U2NhbGU6IChmbikgLT5cbiAgICBmbihAZmxleFNjYWxlKVxuICAgIEBvbkRpZENoYW5nZUZsZXhTY2FsZShmbilcblxuICBhZGRDaGlsZDogKGNoaWxkLCBpbmRleD1AY2hpbGRyZW4ubGVuZ3RoKSAtPlxuICAgIEBjaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDAsIGNoaWxkKVxuICAgIGNoaWxkLnNldFBhcmVudCh0aGlzKVxuICAgIGNoaWxkLnNldENvbnRhaW5lcihAY29udGFpbmVyKVxuICAgIEBzdWJzY3JpYmVUb0NoaWxkKGNoaWxkKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtY2hpbGQnLCB7Y2hpbGQsIGluZGV4fVxuXG4gIGFkanVzdEZsZXhTY2FsZTogLT5cbiAgICAjIGdldCBjdXJyZW50IHRvdGFsIGZsZXggc2NhbGUgb2YgY2hpbGRyZW5cbiAgICB0b3RhbCA9IDBcbiAgICB0b3RhbCArPSBjaGlsZC5nZXRGbGV4U2NhbGUoKSBmb3IgY2hpbGQgaW4gQGNoaWxkcmVuXG5cbiAgICBuZWVkVG90YWwgPSBAY2hpbGRyZW4ubGVuZ3RoXG4gICAgIyBzZXQgZXZlcnkgY2hpbGQncyBmbGV4IHNjYWxlIGJ5IHRoZSByYXRpb1xuICAgIGZvciBjaGlsZCBpbiBAY2hpbGRyZW5cbiAgICAgIGNoaWxkLnNldEZsZXhTY2FsZShuZWVkVG90YWwgKiBjaGlsZC5nZXRGbGV4U2NhbGUoKSAvIHRvdGFsKVxuXG4gIHJlbW92ZUNoaWxkOiAoY2hpbGQsIHJlcGxhY2luZz1mYWxzZSkgLT5cbiAgICBpbmRleCA9IEBjaGlsZHJlbi5pbmRleE9mKGNoaWxkKVxuICAgIHRocm93IG5ldyBFcnJvcihcIlJlbW92aW5nIG5vbi1leGlzdGVudCBjaGlsZFwiKSBpZiBpbmRleCBpcyAtMVxuXG4gICAgQHVuc3Vic2NyaWJlRnJvbUNoaWxkKGNoaWxkKVxuXG4gICAgQGNoaWxkcmVuLnNwbGljZShpbmRleCwgMSlcbiAgICBAYWRqdXN0RmxleFNjYWxlKClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtcmVtb3ZlLWNoaWxkJywge2NoaWxkLCBpbmRleH1cbiAgICBAcmVwYXJlbnRMYXN0Q2hpbGQoKSBpZiBub3QgcmVwbGFjaW5nIGFuZCBAY2hpbGRyZW4ubGVuZ3RoIDwgMlxuXG4gIHJlcGxhY2VDaGlsZDogKG9sZENoaWxkLCBuZXdDaGlsZCkgLT5cbiAgICBAdW5zdWJzY3JpYmVGcm9tQ2hpbGQob2xkQ2hpbGQpXG4gICAgQHN1YnNjcmliZVRvQ2hpbGQobmV3Q2hpbGQpXG5cbiAgICBuZXdDaGlsZC5zZXRQYXJlbnQodGhpcylcbiAgICBuZXdDaGlsZC5zZXRDb250YWluZXIoQGNvbnRhaW5lcilcblxuICAgIGluZGV4ID0gQGNoaWxkcmVuLmluZGV4T2Yob2xkQ2hpbGQpXG4gICAgQGNoaWxkcmVuLnNwbGljZShpbmRleCwgMSwgbmV3Q2hpbGQpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXJlcGxhY2UtY2hpbGQnLCB7b2xkQ2hpbGQsIG5ld0NoaWxkLCBpbmRleH1cblxuICBpbnNlcnRDaGlsZEJlZm9yZTogKGN1cnJlbnRDaGlsZCwgbmV3Q2hpbGQpIC0+XG4gICAgaW5kZXggPSBAY2hpbGRyZW4uaW5kZXhPZihjdXJyZW50Q2hpbGQpXG4gICAgQGFkZENoaWxkKG5ld0NoaWxkLCBpbmRleClcblxuICBpbnNlcnRDaGlsZEFmdGVyOiAoY3VycmVudENoaWxkLCBuZXdDaGlsZCkgLT5cbiAgICBpbmRleCA9IEBjaGlsZHJlbi5pbmRleE9mKGN1cnJlbnRDaGlsZClcbiAgICBAYWRkQ2hpbGQobmV3Q2hpbGQsIGluZGV4ICsgMSlcblxuICByZXBhcmVudExhc3RDaGlsZDogLT5cbiAgICBsYXN0Q2hpbGQgPSBAY2hpbGRyZW5bMF1cbiAgICBsYXN0Q2hpbGQuc2V0RmxleFNjYWxlKEBmbGV4U2NhbGUpXG4gICAgQHBhcmVudC5yZXBsYWNlQ2hpbGQodGhpcywgbGFzdENoaWxkKVxuICAgIEBkZXN0cm95KClcblxuICBzdWJzY3JpYmVUb0NoaWxkOiAoY2hpbGQpIC0+XG4gICAgc3Vic2NyaXB0aW9uID0gY2hpbGQub25EaWREZXN0cm95ID0+IEByZW1vdmVDaGlsZChjaGlsZClcbiAgICBAc3Vic2NyaXB0aW9uc0J5Q2hpbGQuc2V0KGNoaWxkLCBzdWJzY3JpcHRpb24pXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKHN1YnNjcmlwdGlvbilcblxuICB1bnN1YnNjcmliZUZyb21DaGlsZDogKGNoaWxkKSAtPlxuICAgIHN1YnNjcmlwdGlvbiA9IEBzdWJzY3JpcHRpb25zQnlDaGlsZC5nZXQoY2hpbGQpXG4gICAgQHN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbilcbiAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpXG5cbiAgZGVzdHJveWVkOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuIl19
