(function() {
  var CompositeDisposable, PaneElement, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  CompositeDisposable = require('event-kit').CompositeDisposable;

  PaneElement = (function(superClass) {
    extend(PaneElement, superClass);

    function PaneElement() {
      return PaneElement.__super__.constructor.apply(this, arguments);
    }

    PaneElement.prototype.attached = false;

    PaneElement.prototype.createdCallback = function() {
      this.attached = false;
      this.subscriptions = new CompositeDisposable;
      this.inlineDisplayStyles = new WeakMap;
      this.initializeContent();
      return this.subscribeToDOMEvents();
    };

    PaneElement.prototype.attachedCallback = function() {
      this.attached = true;
      if (this.model.isFocused()) {
        return this.focus();
      }
    };

    PaneElement.prototype.detachedCallback = function() {
      return this.attached = false;
    };

    PaneElement.prototype.initializeContent = function() {
      this.setAttribute('class', 'pane');
      this.setAttribute('tabindex', -1);
      this.appendChild(this.itemViews = document.createElement('div'));
      return this.itemViews.setAttribute('class', 'item-views');
    };

    PaneElement.prototype.subscribeToDOMEvents = function() {
      var handleBlur, handleDragOver, handleDrop, handleFocus;
      handleFocus = (function(_this) {
        return function(event) {
          var view;
          _this.model.focus();
          if (event.target === _this && (view = _this.getActiveView())) {
            view.focus();
            return event.stopPropagation();
          }
        };
      })(this);
      handleBlur = (function(_this) {
        return function(event) {
          if (!_this.contains(event.relatedTarget)) {
            return _this.model.blur();
          }
        };
      })(this);
      handleDragOver = function(event) {
        event.preventDefault();
        return event.stopPropagation();
      };
      handleDrop = (function(_this) {
        return function(event) {
          var pathsToOpen;
          event.preventDefault();
          event.stopPropagation();
          _this.getModel().activate();
          pathsToOpen = Array.prototype.map.call(event.dataTransfer.files, function(file) {
            return file.path;
          });
          if (pathsToOpen.length > 0) {
            return _this.applicationDelegate.open({
              pathsToOpen: pathsToOpen
            });
          }
        };
      })(this);
      this.addEventListener('focus', handleFocus, true);
      this.addEventListener('blur', handleBlur, true);
      this.addEventListener('dragover', handleDragOver);
      return this.addEventListener('drop', handleDrop);
    };

    PaneElement.prototype.initialize = function(model, arg) {
      this.model = model;
      this.views = arg.views, this.applicationDelegate = arg.applicationDelegate;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing PaneElements");
      }
      if (this.applicationDelegate == null) {
        throw new Error("Must pass an applicationDelegate parameter when initializing PaneElements");
      }
      this.subscriptions.add(this.model.onDidActivate(this.activated.bind(this)));
      this.subscriptions.add(this.model.observeActive(this.activeStatusChanged.bind(this)));
      this.subscriptions.add(this.model.observeActiveItem(this.activeItemChanged.bind(this)));
      this.subscriptions.add(this.model.onDidRemoveItem(this.itemRemoved.bind(this)));
      this.subscriptions.add(this.model.onDidDestroy(this.paneDestroyed.bind(this)));
      this.subscriptions.add(this.model.observeFlexScale(this.flexScaleChanged.bind(this)));
      return this;
    };

    PaneElement.prototype.getModel = function() {
      return this.model;
    };

    PaneElement.prototype.activated = function() {
      return this.focus();
    };

    PaneElement.prototype.activeStatusChanged = function(active) {
      if (active) {
        return this.classList.add('active');
      } else {
        return this.classList.remove('active');
      }
    };

    PaneElement.prototype.activeItemChanged = function(item) {
      var child, hasFocus, i, itemPath, itemView, len, ref;
      delete this.dataset.activeItemName;
      delete this.dataset.activeItemPath;
      if (item == null) {
        return;
      }
      hasFocus = this.hasFocus();
      itemView = this.views.getView(item);
      if (itemPath = typeof item.getPath === "function" ? item.getPath() : void 0) {
        this.dataset.activeItemName = path.basename(itemPath);
        this.dataset.activeItemPath = itemPath;
      }
      if (!this.itemViews.contains(itemView)) {
        this.itemViews.appendChild(itemView);
      }
      ref = this.itemViews.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (child === itemView) {
          if (this.attached) {
            this.showItemView(child);
          }
        } else {
          this.hideItemView(child);
        }
      }
      if (hasFocus) {
        return itemView.focus();
      }
    };

    PaneElement.prototype.showItemView = function(itemView) {
      var inlineDisplayStyle;
      inlineDisplayStyle = this.inlineDisplayStyles.get(itemView);
      if (inlineDisplayStyle != null) {
        return itemView.style.display = inlineDisplayStyle;
      } else {
        return itemView.style.display = '';
      }
    };

    PaneElement.prototype.hideItemView = function(itemView) {
      var inlineDisplayStyle;
      inlineDisplayStyle = itemView.style.display;
      if (inlineDisplayStyle !== 'none') {
        if (inlineDisplayStyle != null) {
          this.inlineDisplayStyles.set(itemView, inlineDisplayStyle);
        }
        return itemView.style.display = 'none';
      }
    };

    PaneElement.prototype.itemRemoved = function(arg) {
      var destroyed, index, item, viewToRemove;
      item = arg.item, index = arg.index, destroyed = arg.destroyed;
      if (viewToRemove = this.views.getView(item)) {
        return viewToRemove.remove();
      }
    };

    PaneElement.prototype.paneDestroyed = function() {
      return this.subscriptions.dispose();
    };

    PaneElement.prototype.flexScaleChanged = function(flexScale) {
      return this.style.flexGrow = flexScale;
    };

    PaneElement.prototype.getActiveView = function() {
      return this.views.getView(this.model.getActiveItem());
    };

    PaneElement.prototype.hasFocus = function() {
      return this === document.activeElement || this.contains(document.activeElement);
    };

    return PaneElement;

  })(HTMLElement);

  module.exports = PaneElement = document.registerElement('atom-pane', {
    prototype: PaneElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxzQ0FBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ04sc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUVsQjs7Ozs7OzswQkFDSixRQUFBLEdBQVU7OzBCQUVWLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixJQUFJO01BRTNCLElBQUMsQ0FBQSxpQkFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLG9CQUFELENBQUE7SUFOZTs7MEJBUWpCLGdCQUFBLEdBQWtCLFNBQUE7TUFDaEIsSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUNaLElBQVksSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLENBQUEsQ0FBWjtlQUFBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFBQTs7SUFGZ0I7OzBCQUlsQixnQkFBQSxHQUFrQixTQUFBO2FBQ2hCLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFESTs7MEJBR2xCLGlCQUFBLEdBQW1CLFNBQUE7TUFDakIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxPQUFkLEVBQXVCLE1BQXZCO01BQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxVQUFkLEVBQTBCLENBQUMsQ0FBM0I7TUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxTQUFELEdBQWEsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBMUI7YUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVgsQ0FBd0IsT0FBeEIsRUFBaUMsWUFBakM7SUFKaUI7OzBCQU1uQixvQkFB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QUFDLE1BQWIsQ0FBQSxFQURGOztJQURXOzswQkFJYixhQUFBLEdBQWUsU0FBQTthQUNiLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRGE7OzBCQUdmLGdCQUFBLEdBQWtCLFNBQUMsU0FBRDthQUNoQixJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0I7SUFERjs7MEJBR2xCLGFBQUEsR0FBZSxTQUFBO2FBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxhQUFQLENBQUEsQ0FBZjtJQUFIOzswQkFFZixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUEsS0FBUSxRQUFRLENBQUMsYUFBakIsSUFBa0MsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFRLENBQUMsYUFBbkI7SUFEMUI7Ozs7S0ExSGM7O0VBNkgxQixNQUFNLENBQUMsT0FBUCxHQUFpQixXQUFBLEdBQWMsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsV0FBekIsRUFBc0M7SUFBQSxTQUFBLEVBQVcsV0FBVyxDQUFDLFNBQXZCO0dBQXRDO0FBaEkvQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5jbGFzcyBQYW5lRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGF0dGFjaGVkOiBmYWxzZVxuXG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAYXR0YWNoZWQgPSBmYWxzZVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAaW5saW5lRGlzcGxheVN0eWxlcyA9IG5ldyBXZWFrTWFwXG5cbiAgICBAaW5pdGlhbGl6ZUNvbnRlbnQoKVxuICAgIEBzdWJzY3JpYmVUb0RPTUV2ZW50cygpXG5cbiAgYXR0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAYXR0YWNoZWQgPSB0cnVlXG4gICAgQGZvY3VzKCkgaWYgQG1vZGVsLmlzRm9jdXNlZCgpXG5cbiAgZGV0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAYXR0YWNoZWQgPSBmYWxzZVxuXG4gIGluaXRpYWxpemVDb250ZW50OiAtPlxuICAgIEBzZXRBdHRyaWJ1dGUgJ2NsYXNzJywgJ3BhbmUnXG4gICAgQHNldEF0dHJpYnV0ZSAndGFiaW5kZXgnLCAtMVxuICAgIEBhcHBlbmRDaGlsZCBAaXRlbVZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAaXRlbVZpZXdzLnNldEF0dHJpYnV0ZSAnY2xhc3MnLCAnaXRlbS12aWV3cydcblxuICBzdWJzY3JpYmVUb0RPTUV2ZW50czogLT5cbiAgICBoYW5kbGVGb2N1cyA9IChldmVudCkgPT5cbiAgICAgIEBtb2RlbC5mb2N1cygpXG4gICAgICBpZiBldmVudC50YXJnZXQgaXMgdGhpcyBhbmQgdmlldyA9IEBnZXRBY3RpdmVWaWV3KClcbiAgICAgICAgdmlldy5mb2N1cygpXG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBoYW5kbGVCbHVyID0gKGV2ZW50KSA9PlxuICAgICAgQG1vZGVsLmJsdXIoKSB1bmxlc3MgQGNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpXG5cbiAgICBoYW5kbGVEcmFnT3ZlciA9IChldmVudCkgLT5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBoYW5kbGVEcm9wID0gKGV2ZW50KSA9PlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIEBnZXRNb2RlbCgpLmFjdGl2YXRlKClcbiAgICAgIHBhdGhzVG9PcGVuID0gQXJyYXk6Om1hcC5jYWxsIGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcywgKGZpbGUpIC0+IGZpbGUucGF0aFxuICAgICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUub3Blbih7cGF0aHNUb09wZW59KSBpZiBwYXRoc1RvT3Blbi5sZW5ndGggPiAwXG5cbiAgICBAYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCBoYW5kbGVGb2N1cywgdHJ1ZVxuICAgIEBhZGRFdmVudExpc3RlbmVyICdibHVyJywgaGFuZGxlQmx1ciwgdHJ1ZVxuICAgIEBhZGRFdmVudExpc3RlbmVyICdkcmFnb3ZlcicsIGhhbmRsZURyYWdPdmVyXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgJ2Ryb3AnLCBoYW5kbGVEcm9wXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwge0B2aWV3cywgQGFwcGxpY2F0aW9uRGVsZWdhdGV9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHZpZXdzIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBQYW5lRWxlbWVudHNcIikgdW5sZXNzIEB2aWV3cz9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYW4gYXBwbGljYXRpb25EZWxlZ2F0ZSBwYXJhbWV0ZXIgd2hlbiBpbml0aWFsaXppbmcgUGFuZUVsZW1lbnRzXCIpIHVubGVzcyBAYXBwbGljYXRpb25EZWxlZ2F0ZT9cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRBY3RpdmF0ZShAYWN0aXZhdGVkLmJpbmQodGhpcykpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vYnNlcnZlQWN0aXZlKEBhY3RpdmVTdGF0dXNDaGFuZ2VkLmJpbmQodGhpcykpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vYnNlcnZlQWN0aXZlSXRlbShAYWN0aXZlSXRlbUNoYW5nZWQuYmluZCh0aGlzKSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkUmVtb3ZlSXRlbShAaXRlbVJlbW92ZWQuYmluZCh0aGlzKSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkRGVzdHJveShAcGFuZURlc3Ryb3llZC5iaW5kKHRoaXMpKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub2JzZXJ2ZUZsZXhTY2FsZShAZmxleFNjYWxlQ2hhbmdlZC5iaW5kKHRoaXMpKVxuICAgIHRoaXNcblxuICBnZXRNb2RlbDogLT4gQG1vZGVsXG5cbiAgYWN0aXZhdGVkOiAtPlxuICAgIEBmb2N1cygpXG5cbiAgYWN0aXZlU3RhdHVzQ2hhbmdlZDogKGFjdGl2ZSkgLT5cbiAgICBpZiBhY3RpdmVcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICAgIGVsc2VcbiAgICAgIEBjbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuXG4gIGFjdGl2ZUl0ZW1DaGFuZ2VkOiAoaXRlbSkgLT5cbiAgICBkZWxldGUgQGRhdGFzZXQuYWN0aXZlSXRlbU5hbWVcbiAgICBkZWxldGUgQGRhdGFzZXQuYWN0aXZlSXRlbVBhdGhcblxuICAgIHJldHVybiB1bmxlc3MgaXRlbT9cblxuICAgIGhhc0ZvY3VzID0gQGhhc0ZvY3VzKClcbiAgICBpdGVtVmlldyA9IEB2aWV3cy5nZXRWaWV3KGl0ZW0pXG5cbiAgICBpZiBpdGVtUGF0aCA9IGl0ZW0uZ2V0UGF0aD8oKVxuICAgICAgQGRhdGFzZXQuYWN0aXZlSXRlbU5hbWUgPSBwYXRoLmJhc2VuYW1lKGl0ZW1QYXRoKVxuICAgICAgQGRhdGFzZXQuYWN0aXZlSXRlbVBhdGggPSBpdGVtUGF0aFxuXG4gICAgdW5sZXNzIEBpdGVtVmlld3MuY29udGFpbnMoaXRlbVZpZXcpXG4gICAgICBAaXRlbVZpZXdzLmFwcGVuZENoaWxkKGl0ZW1WaWV3KVxuXG4gICAgZm9yIGNoaWxkIGluIEBpdGVtVmlld3MuY2hpbGRyZW5cbiAgICAgIGlmIGNoaWxkIGlzIGl0ZW1WaWV3XG4gICAgICAgIEBzaG93SXRlbVZpZXcoY2hpbGQpIGlmIEBhdHRhY2hlZFxuICAgICAgZWxzZVxuICAgICAgICBAaGlkZUl0ZW1WaWV3KGNoaWxkKVxuXG4gICAgaXRlbVZpZXcuZm9jdXMoKSBpZiBoYXNGb2N1c1xuXG4gIHNob3dJdGVtVmlldzogKGl0ZW1WaWV3KSAtPlxuICAgIGlubGluZURpc3BsYXlTdHlsZSA9IEBpbmxpbmVEaXNwbGF5U3R5bGVzLmdldChpdGVtVmlldylcbiAgICBpZiBpbmxpbmVEaXNwbGF5U3R5bGU/XG4gICAgICBpdGVtVmlldy5zdHlsZS5kaXNwbGF5ID0gaW5saW5lRGlzcGxheVN0eWxlXG4gICAgZWxzZVxuICAgICAgaXRlbVZpZXcuc3R5bGUuZGlzcGxheSA9ICcnXG5cbiAgaGlkZUl0ZW1WaWV3OiAoaXRlbVZpZXcpIC0+XG4gICAgaW5saW5lRGlzcGxheVN0eWxlID0gaXRlbVZpZXcuc3R5bGUuZGlzcGxheVxuICAgIHVubGVzcyBpbmxpbmVEaXNwbGF5U3R5bGUgaXMgJ25vbmUnXG4gICAgICBAaW5saW5lRGlzcGxheVN0eWxlcy5zZXQoaXRlbVZpZXcsIGlubGluZURpc3BsYXlTdHlsZSkgaWYgaW5saW5lRGlzcGxheVN0eWxlP1xuICAgICAgaXRlbVZpZXcuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gIGl0ZW1SZW1vdmVkOiAoe2l0ZW0sIGluZGV4LCBkZXN0cm95ZWR9KSAtPlxuICAgIGlmIHZpZXdUb1JlbW92ZSA9IEB2aWV3cy5nZXRWaWV3KGl0ZW0pXG4gICAgICB2aWV3VG9SZW1vdmUucmVtb3ZlKClcblxuICBwYW5lRGVzdHJveWVkOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIGZsZXhTY2FsZUNoYW5nZWQ6IChmbGV4U2NhbGUpIC0+XG4gICAgQHN0eWxlLmZsZXhHcm93ID0gZmxleFNjYWxlXG5cbiAgZ2V0QWN0aXZlVmlldzogLT4gQHZpZXdzLmdldFZpZXcoQG1vZGVsLmdldEFjdGl2ZUl0ZW0oKSlcblxuICBoYXNGb2N1czogLT5cbiAgICB0aGlzIGlzIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgb3IgQGNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZUVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tcGFuZScsIHByb3RvdHlwZTogUGFuZUVsZW1lbnQucHJvdG90eXBlXG4iXX0=
