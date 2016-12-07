(function() {
  var closest;

  closest = require('./html-helpers').closest;

  module.exports = {
    activate: function() {
      this.view = document.createElement('div');
      atom.views.getView(atom.workspace).appendChild(this.view);
      return this.view.classList.add('tabs-layout-overlay');
    },
    deactivate: function() {
      var ref;
      return (ref = this.view.parentElement) != null ? ref.removeChild(this.view) : void 0;
    },
    test: {},
    drag: function(e) {
      var coords, itemView, pane;
      this.lastCoords = e;
      pane = this.getPaneAt(e);
      itemView = this.getItemViewAt(e);
      if ((pane != null) && (itemView != null)) {
        coords = !(this.isOnlyTabInPane(pane, e.target) || pane.getItems().length === 0) ? [e.clientX, e.clientY] : void 0;
        return this.lastSplit = this.updateView(itemView, coords);
      } else {
        return this.disableView();
      }
    },
    end: function(e) {
      var fromPane, item, tab, target, toPane;
      this.disableView();
      if (!((this.lastCoords != null) && this.getItemViewAt(this.lastCoords))) {
        return;
      }
      target = this.getPaneAt(this.lastCoords);
      if (target == null) {
        return;
      }
      toPane = (function() {
        switch (this.lastSplit) {
          case 'left':
            return target.splitLeft();
          case 'right':
            return target.splitRight();
          case 'up':
            return target.splitUp();
          case 'down':
            return target.splitDown();
        }
      }).call(this);
      tab = e.target;
      if (toPane == null) {
        toPane = target;
      }
      fromPane = tab.pane;
      if (toPane === fromPane) {
        return;
      }
      item = tab.item;
      fromPane.moveItemToPane(item, toPane);
      toPane.activateItem(item);
      return toPane.activate();
    },
    getElement: function(arg, selector) {
      var clientX, clientY;
      clientX = arg.clientX, clientY = arg.clientY;
      if (selector == null) {
        selector = '*';
      }
      return closest(document.elementFromPoint(clientX, clientY), selector);
    },
    getItemViewAt: function(coords) {
      return this.test.itemView || this.getElement(coords, '.item-views');
    },
    getPaneAt: function(coords) {
      var ref;
      return this.test.pane || ((ref = this.getElement(this.lastCoords, 'atom-pane')) != null ? ref.getModel() : void 0);
    },
    isOnlyTabInPane: function(pane, tab) {
      return pane.getItems().length === 1 && pane === tab.pane;
    },
    normalizeCoords: function(arg, arg1) {
      var height, left, top, width, x, y;
      left = arg.left, top = arg.top, width = arg.width, height = arg.height;
      x = arg1[0], y = arg1[1];
      return [(x - left) / width, (y - top) / height];
    },
    splitType: function(arg) {
      var x, y;
      x = arg[0], y = arg[1];
      if (x < 1 / 3) {
        return 'left';
      } else if (x > 2 / 3) {
        return 'right';
      } else if (y < 1 / 3) {
        return 'up';
      } else if (y > 2 / 3) {
        return 'down';
      }
    },
    boundsForSplit: function(split) {
      var h, ref, w, x, y;
      return ref = (function() {
        switch (split) {
          case 'left':
            return [0, 0, 0.5, 1];
          case 'right':
            return [0.5, 0, 0.5, 1];
          case 'up':
            return [0, 0, 1, 0.5];
          case 'down':
            return [0, 0.5, 1, 0.5];
          default:
            return [0, 0, 1, 1];
        }
      })(), x = ref[0], y = ref[1], w = ref[2], h = ref[3], ref;
    },
    innerBounds: function(arg, arg1) {
      var h, height, left, top, w, width, x, y;
      left = arg.left, top = arg.top, width = arg.width, height = arg.height;
      x = arg1[0], y = arg1[1], w = arg1[2], h = arg1[3];
      left += x * width;
      top += y * height;
      width *= w;
      height *= h;
      return {
        left: left,
        top: top,
        width: width,
        height: height
      };
    },
    updateViewBounds: function(arg) {
      var height, left, top, width;
      left = arg.left, top = arg.top, width = arg.width, height = arg.height;
      this.view.style.left = left + "px";
      this.view.style.top = top + "px";
      this.view.style.width = width + "px";
      return this.view.style.height = height + "px";
    },
    updateView: function(pane, coords) {
      var rect, split;
      this.view.classList.add('visible');
      rect = this.test.rect || pane.getBoundingClientRect();
      split = coords ? this.splitType(this.normalizeCoords(rect, coords)) : void 0;
      this.updateViewBounds(this.innerBounds(rect, this.boundsForSplit(split)));
      return split;
    },
    disableView: function() {
      return this.view.classList.remove('visible');
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90YWJzL2xpYi9sYXlvdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxnQkFBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUksQ0FBQyxTQUF4QixDQUFrQyxDQUFDLFdBQW5DLENBQStDLElBQUMsQ0FBQSxJQUFoRDthQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLHFCQUFwQjtJQUhRLENBQVY7SUFLQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7MERBQW1CLENBQUUsV0FBckIsQ0FBaUMsSUFBQyxDQUFBLElBQWxDO0lBRFUsQ0FMWjtJQVFBLElBQUEsRUFBTSxFQVJOO0lBVUEsSUFBQSxFQUFNLFNBQUMsQ0FBRDtBQUNKLFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxHQUFjO01BQ2QsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFELENBQVcsQ0FBWDtNQUNQLFFBQUEsR0FBVyxJQUFDLENBQUEsYUFBRCxDQUFlLENBQWY7TUFDWCxJQUFHLGNBQUEsSUFBVSxrQkFBYjtRQUNFLE1BQUEsR0FBWSxDQUFJLENBQUMsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsRUFBdUIsQ0FBQyxDQUFDLE1BQXpCLENBQUEsSUFBb0MsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFlLENBQUMsTUFBaEIsS0FBMEIsQ0FBL0QsQ0FBUCxHQUNQLENBQUMsQ0FBQyxDQUFDLE9BQUgsRUFB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LE1BQVosR0FBd0IsTUFBRCxHQUFRO0lBSmYsQ0E1RWxCO0lBa0ZBLFVBQUEsRUFBWSxTQUFDLElBQUQsRUFBTyxNQUFQO0FBQ1YsVUFBQTtNQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLFNBQXBCO01BQ0EsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixJQUFjLElBQUksQ0FBQyxxQkFBTCxDQUFBO01BQ3JCLEtBQUEsR0FBVyxNQUFILEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixFQUF1QixNQUF2QixDQUFYLENBQWYsR0FBQTtNQUNSLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsRUFBbUIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsS0FBaEIsQ0FBbkIsQ0FBbEI7YUFDQTtJQUxVLENBbEZaO0lBeUZBLFdBQUEsRUFBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBaEIsQ0FBdUIsU0FBdkI7SUFEVyxDQXpGYjs7QUFIRiIsInNvdXJjZXNDb250ZW50IjpbIntjbG9zZXN0fSA9IHJlcXVpcmUgJy4vaHRtbC1oZWxwZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPlxuICAgIEB2aWV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuYXBwZW5kQ2hpbGQgQHZpZXdcbiAgICBAdmlldy5jbGFzc0xpc3QuYWRkICd0YWJzLWxheW91dC1vdmVybGF5J1xuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHZpZXcucGFyZW50RWxlbWVudD8ucmVtb3ZlQ2hpbGQgQHZpZXdcblxuICB0ZXN0OiB7fVxuXG4gIGRyYWc6IChlKSAtPlxuICAgIEBsYXN0Q29vcmRzID0gZVxuICAgIHBhbmUgPSBAZ2V0UGFuZUF0IGVcbiAgICBpdGVtVmlldyA9IEBnZXRJdGVtVmlld0F0IGVcbiAgICBpZiBwYW5lPyBhbmQgaXRlbVZpZXc/XG4gICAgICBjb29yZHMgPSBpZiBub3QgKEBpc09ubHlUYWJJblBhbmUocGFuZSwgZS50YXJnZXQpIG9yIHBhbmUuZ2V0SXRlbXMoKS5sZW5ndGggaXMgMClcbiAgICAgICAgW2UuY2xpZW50WCwgZS5jbGllbnRZXVxuICAgICAgQGxhc3RTcGxpdCA9IEB1cGRhdGVWaWV3IGl0ZW1WaWV3LCBjb29yZHNcbiAgICBlbHNlXG4gICAgICBAZGlzYWJsZVZpZXcoKVxuXG4gIGVuZDogKGUpIC0+XG4gICAgQGRpc2FibGVWaWV3KClcbiAgICByZXR1cm4gdW5sZXNzIEBsYXN0Q29vcmRzPyBhbmQgQGdldEl0ZW1WaWV3QXQgQGxhc3RDb29yZHNcbiAgICB0YXJnZXQgPSBAZ2V0UGFuZUF0IEBsYXN0Q29vcmRzXG4gICAgcmV0dXJuIHVubGVzcyB0YXJnZXQ/XG4gICAgdG9QYW5lID0gc3dpdGNoIEBsYXN0U3BsaXRcbiAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIHRhcmdldC5zcGxpdExlZnQoKVxuICAgICAgd2hlbiAncmlnaHQnIHRoZW4gdGFyZ2V0LnNwbGl0UmlnaHQoKVxuICAgICAgd2hlbiAndXAnICAgIHRoZW4gdGFyZ2V0LnNwbGl0VXAoKVxuICAgICAgd2hlbiAnZG93bicgIHRoZW4gdGFyZ2V0LnNwbGl0RG93bigpXG4gICAgdGFiID0gZS50YXJnZXRcbiAgICB0b1BhbmUgPz0gdGFyZ2V0XG4gICAgZnJvbVBhbmUgPSB0YWIucGFuZVxuICAgIHJldHVybiBpZiB0b1BhbmUgaXMgZnJvbVBhbmVcbiAgICBpdGVtID0gdGFiLml0ZW1cbiAgICBmcm9tUGFuZS5tb3ZlSXRlbVRvUGFuZSBpdGVtLCB0b1BhbmVcbiAgICB0b1BhbmUuYWN0aXZhdGVJdGVtIGl0ZW1cbiAgICB0b1BhbmUuYWN0aXZhdGUoKVxuXG4gIGdldEVsZW1lbnQ6ICh7Y2xpZW50WCwgY2xpZW50WX0sIHNlbGVjdG9yID0gJyonKSAtPlxuICAgIGNsb3Nlc3QgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChjbGllbnRYLCBjbGllbnRZKSwgc2VsZWN0b3JcblxuICBnZXRJdGVtVmlld0F0OiAoY29vcmRzKSAtPlxuICAgIEB0ZXN0Lml0ZW1WaWV3IG9yIEBnZXRFbGVtZW50IGNvb3JkcywgJy5pdGVtLXZpZXdzJ1xuXG4gIGdldFBhbmVBdDogKGNvb3JkcykgLT5cbiAgICBAdGVzdC5wYW5lIG9yIEBnZXRFbGVtZW50KEBsYXN0Q29vcmRzLCAnYXRvbS1wYW5lJyk/LmdldE1vZGVsKClcblxuICBpc09ubHlUYWJJblBhbmU6IChwYW5lLCB0YWIpIC0+XG4gICAgcGFuZS5nZXRJdGVtcygpLmxlbmd0aCBpcyAxIGFuZCBwYW5lIGlzIHRhYi5wYW5lXG5cbiAgbm9ybWFsaXplQ29vcmRzOiAoe2xlZnQsIHRvcCwgd2lkdGgsIGhlaWdodH0sIFt4LCB5XSkgLT5cbiAgICBbKHgtbGVmdCkvd2lkdGgsICh5LXRvcCkvaGVpZ2h0XVxuXG4gIHNwbGl0VHlwZTogKFt4LCB5XSkgLT5cbiAgICBpZiAgICAgIHggPCAxLzMgdGhlbiAnbGVmdCdcbiAgICBlbHNlIGlmIHggPiAyLzMgdGhlbiAncmlnaHQnXG4gICAgZWxzZSBpZiB5IDwgMS8zIHRoZW4gJ3VwJ1xuICAgIGVsc2UgaWYgeSA+IDIvMyB0aGVuICdkb3duJ1xuXG4gIGJvdW5kc0ZvclNwbGl0OiAoc3BsaXQpIC0+XG4gICAgW3gsIHksIHcsIGhdID0gc3dpdGNoIHNwbGl0XG4gICAgICB3aGVuICdsZWZ0JyAgIHRoZW4gWzAsICAgMCwgICAwLjUsIDEgIF1cbiAgICAgIHdoZW4gJ3JpZ2h0JyAgdGhlbiBbMC41LCAwLCAgIDAuNSwgMSAgXVxuICAgICAgd2hlbiAndXAnICAgICB0aGVuIFswLCAgIDAsICAgMSwgICAwLjVdXG4gICAgICB3aGVuICdkb3duJyAgIHRoZW4gWzAsICAgMC41LCAxLCAgIDAuNV1cbiAgICAgIGVsc2UgICAgICAgICAgICAgICBbMCwgICAwLCAgIDEsICAgMSAgXVxuXG4gIGlubmVyQm91bmRzOiAoe2xlZnQsIHRvcCwgd2lkdGgsIGhlaWdodH0sIFt4LCB5LCB3LCBoXSkgLT5cbiAgICBsZWZ0ICs9IHgqd2lkdGhcbiAgICB0b3AgICs9IHkqaGVpZ2h0XG4gICAgd2lkdGggICo9IHdcbiAgICBoZWlnaHQgKj0gaFxuICAgIHtsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHR9XG5cbiAgdXBkYXRlVmlld0JvdW5kczogKHtsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHR9KSAtPlxuICAgIEB2aWV3LnN0eWxlLmxlZnQgPSBcIiN7bGVmdH1weFwiXG4gICAgQHZpZXcuc3R5bGUudG9wID0gXCIje3RvcH1weFwiXG4gICAgQHZpZXcuc3R5bGUud2lkdGggPSBcIiN7d2lkdGh9cHhcIlxuICAgIEB2aWV3LnN0eWxlLmhlaWdodCA9IFwiI3toZWlnaHR9cHhcIlxuXG4gIHVwZGF0ZVZpZXc6IChwYW5lLCBjb29yZHMpIC0+XG4gICAgQHZpZXcuY2xhc3NMaXN0LmFkZCAndmlzaWJsZSdcbiAgICByZWN0ID0gQHRlc3QucmVjdCBvciBwYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgc3BsaXQgPSBpZiBjb29yZHMgdGhlbiBAc3BsaXRUeXBlIEBub3JtYWxpemVDb29yZHMgcmVjdCwgY29vcmRzXG4gICAgQHVwZGF0ZVZpZXdCb3VuZHMgQGlubmVyQm91bmRzIHJlY3QsIEBib3VuZHNGb3JTcGxpdCBzcGxpdFxuICAgIHNwbGl0XG5cbiAgZGlzYWJsZVZpZXc6IC0+XG4gICAgQHZpZXcuY2xhc3NMaXN0LnJlbW92ZSAndmlzaWJsZSdcbiJdfQ==
