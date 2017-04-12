(function() {
  var CompositeDisposable, PaneAxisElement, PaneResizeHandleElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  PaneResizeHandleElement = require('./pane-resize-handle-element');

  PaneAxisElement = (function(superClass) {
    extend(PaneAxisElement, superClass);

    function PaneAxisElement() {
      return PaneAxisElement.__super__.constructor.apply(this, arguments);
    }

    PaneAxisElement.prototype.attachedCallback = function() {
      var child, i, index, len, ref, results;
      if (this.subscriptions == null) {
        this.subscriptions = this.subscribeToModel();
      }
      ref = this.model.getChildren();
      results = [];
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        child = ref[index];
        results.push(this.childAdded({
          child: child,
          index: index
        }));
      }
      return results;
    };

    PaneAxisElement.prototype.detachedCallback = function() {
      var child, i, len, ref, results;
      this.subscriptions.dispose();
      this.subscriptions = null;
      ref = this.model.getChildren();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        results.push(this.childRemoved({
          child: child
        }));
      }
      return results;
    };

    PaneAxisElement.prototype.initialize = function(model, arg) {
      var child, i, index, len, ref;
      this.model = model;
      this.views = arg.views;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing TextEditorElements");
      }
      if (this.subscriptions == null) {
        this.subscriptions = this.subscribeToModel();
      }
      ref = this.model.getChildren();
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        child = ref[index];
        this.childAdded({
          child: child,
          index: index
        });
      }
      switch (this.model.getOrientation()) {
        case 'horizontal':
          this.classList.add('horizontal', 'pane-row');
          break;
        case 'vertical':
          this.classList.add('vertical', 'pane-column');
      }
      return this;
    };

    PaneAxisElement.prototype.subscribeToModel = function() {
      var subscriptions;
      subscriptions = new CompositeDisposable;
      subscriptions.add(this.model.onDidAddChild(this.childAdded.bind(this)));
      subscriptions.add(this.model.onDidRemoveChild(this.childRemoved.bind(this)));
      subscriptions.add(this.model.onDidReplaceChild(this.childReplaced.bind(this)));
      subscriptions.add(this.model.observeFlexScale(this.flexScaleChanged.bind(this)));
      return subscriptions;
    };

    PaneAxisElement.prototype.isPaneResizeHandleElement = function(element) {
      return (element != null ? element.nodeName.toLowerCase() : void 0) === 'atom-pane-resize-handle';
    };

    PaneAxisElement.prototype.childAdded = function(arg) {
      var child, index, nextElement, prevElement, resizeHandle, view;
      child = arg.child, index = arg.index;
      view = this.views.getView(child);
      this.insertBefore(view, this.children[index * 2]);
      prevElement = view.previousSibling;
      if ((prevElement != null) && !this.isPaneResizeHandleElement(prevElement)) {
        resizeHandle = document.createElement('atom-pane-resize-handle');
        this.insertBefore(resizeHandle, view);
      }
      nextElement = view.nextSibling;
      if ((nextElement != null) && !this.isPaneResizeHandleElement(nextElement)) {
        resizeHandle = document.createElement('atom-pane-resize-handle');
        return this.insertBefore(resizeHandle, nextElement);
      }
    };

    PaneAxisElement.prototype.childRemoved = function(arg) {
      var child, siblingView, view;
      child = arg.child;
      view = this.views.getView(child);
      siblingView = view.previousSibling;
      if ((siblingView != null) && this.isPaneResizeHandleElement(siblingView)) {
        siblingView.remove();
      }
      return view.remove();
    };

    PaneAxisElement.prototype.childReplaced = function(arg) {
      var focusedElement, index, newChild, oldChild;
      index = arg.index, oldChild = arg.oldChild, newChild = arg.newChild;
      if (this.hasFocus()) {
        focusedElement = document.activeElement;
      }
      this.childRemoved({
        child: oldChild,
        index: index
      });
      this.childAdded({
        child: newChild,
        index: index
      });
      if (document.activeElement === document.body) {
        return focusedElement != null ? focusedElement.focus() : void 0;
      }
    };

    PaneAxisElement.prototype.flexScaleChanged = function(flexScale) {
      return this.style.flexGrow = flexScale;
    };

    PaneAxisElement.prototype.hasFocus = function() {
      return this === document.activeElement || this.contains(document.activeElement);
    };

    return PaneAxisElement;

  })(HTMLElement);

  module.exports = PaneAxisElement = document.registerElement('atom-pane-axis', {
    prototype: PaneAxisElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLWF4aXMtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZEQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsV0FBUjs7RUFDeEIsdUJBQUEsR0FBMEIsT0FBQSxDQUFRLDhCQUFSOztFQUVwQjs7Ozs7Ozs4QkFDSixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7O1FBQUEsSUFBQyxDQUFBLGdCQUFpQixJQUFDLENBQUEsZ0JBQUQsQ0FBQTs7QUFDbEI7QUFBQTtXQUFBLHFEQUFBOztxQkFBQSxJQUFDLENBQUEsVUFBRCxDQUFZO1VBQUMsT0FBQSxLQUFEO1VBQVEsT0FBQSxLQUFSO1NBQVo7QUFBQTs7SUFGZ0I7OzhCQUlsQixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtNQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO0FBQ2pCO0FBQUE7V0FBQSxxQ0FBQTs7cUJBQUEsSUFBQyxDQUFBLFlBQUQsQ0FBYztVQUFDLE9BQUEsS0FBRDtTQUFkO0FBQUE7O0lBSGdCOzs4QkFLbEIsVUFBQSxHQUFZLFNBQUMsS0FBRCxFQUFTLEdBQVQ7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLFFBQUQ7TUFBUyxJQUFDLENBQUEsUUFBRixJQUFFO01BQ3JCLElBQTJGLGtCQUEzRjtBQUFBLGNBQVUsSUFBQSxLQUFBLENBQU0sa0VBQU4sRUFBVjs7O1FBQ0EsSUFBQyxDQUFBLGdCQUFpQixJQUFDLENBQUEsZ0JBQUQsQ0FBQTs7QUFDbEI7QUFBQSxXQUFBLHFEQUFBOztRQUFBLElBQUMsQ0FBQSxVQUFELENBQVk7VUFBQyxPQUFBLEtBQUQ7VUFBUSxPQUFBLEtBQVI7U0FBWjtB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O1FBQWtCLE9BQUEsS0FBbEI7T0FBWjtNQUNBLElBQTJCLFFBQVEsQ0FBQyxhQUFULEtBQTBCLFFBQVEsQ0FBQyxJQUE5RDt3Q0FBQSxjQUFjLENBQUUsS0FBaEIsQ0FBQSxXQUFBOztJQUphOzs4QkFNZixnQkFBQSxHQUFrQixTQUFDLFNBQUQ7YUFBZSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0I7SUFBakM7OzhCQUVsQixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUEsS0FBUSxRQUFRLENBQUMsYUFBakIsSUFBa0MsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFRLENBQUMsYUFBbkI7SUFEMUI7Ozs7S0FqRWtCOztFQW9FOUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsZUFBQSxHQUFrQixRQUFRLENBQUMsZUFBVCxDQUF5QixnQkFBekIsRUFBMkM7SUFBQSxTQUFBLEVBQVcsZUFBZSxDQUFDLFNBQTNCO0dBQTNDO0FBdkVuQyIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcblBhbmVSZXNpemVIYW5kbGVFbGVtZW50ID0gcmVxdWlyZSAnLi9wYW5lLXJlc2l6ZS1oYW5kbGUtZWxlbWVudCdcblxuY2xhc3MgUGFuZUF4aXNFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgYXR0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA/PSBAc3Vic2NyaWJlVG9Nb2RlbCgpXG4gICAgQGNoaWxkQWRkZWQoe2NoaWxkLCBpbmRleH0pIGZvciBjaGlsZCwgaW5kZXggaW4gQG1vZGVsLmdldENoaWxkcmVuKClcblxuICBkZXRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIEBjaGlsZFJlbW92ZWQoe2NoaWxkfSkgZm9yIGNoaWxkIGluIEBtb2RlbC5nZXRDaGlsZHJlbigpXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwge0B2aWV3c30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgdmlld3MgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQHZpZXdzP1xuICAgIEBzdWJzY3JpcHRpb25zID89IEBzdWJzY3JpYmVUb01vZGVsKClcbiAgICBAY2hpbGRBZGRlZCh7Y2hpbGQsIGluZGV4fSkgZm9yIGNoaWxkLCBpbmRleCBpbiBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuXG4gICAgc3dpdGNoIEBtb2RlbC5nZXRPcmllbnRhdGlvbigpXG4gICAgICB3aGVuICdob3Jpem9udGFsJ1xuICAgICAgICBAY2xhc3NMaXN0LmFkZCgnaG9yaXpvbnRhbCcsICdwYW5lLXJvdycpXG4gICAgICB3aGVuICd2ZXJ0aWNhbCdcbiAgICAgICAgQGNsYXNzTGlzdC5hZGQoJ3ZlcnRpY2FsJywgJ3BhbmUtY29sdW1uJylcbiAgICB0aGlzXG5cbiAgc3Vic2NyaWJlVG9Nb2RlbDogLT5cbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRBZGRDaGlsZChAY2hpbGRBZGRlZC5iaW5kKHRoaXMpKVxuICAgIHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZFJlbW92ZUNoaWxkKEBjaGlsZFJlbW92ZWQuYmluZCh0aGlzKSlcbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRSZXBsYWNlQ2hpbGQoQGNoaWxkUmVwbGFjZWQuYmluZCh0aGlzKSlcbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub2JzZXJ2ZUZsZXhTY2FsZShAZmxleFNjYWxlQ2hhbmdlZC5iaW5kKHRoaXMpKVxuICAgIHN1YnNjcmlwdGlvbnNcblxuICBpc1BhbmVSZXNpemVIYW5kbGVFbGVtZW50OiAoZWxlbWVudCkgLT5cbiAgICBlbGVtZW50Py5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpIGlzICdhdG9tLXBhbmUtcmVzaXplLWhhbmRsZSdcblxuICBjaGlsZEFkZGVkOiAoe2NoaWxkLCBpbmRleH0pIC0+XG4gICAgdmlldyA9IEB2aWV3cy5nZXRWaWV3KGNoaWxkKVxuICAgIEBpbnNlcnRCZWZvcmUodmlldywgQGNoaWxkcmVuW2luZGV4ICogMl0pXG5cbiAgICBwcmV2RWxlbWVudCA9IHZpZXcucHJldmlvdXNTaWJsaW5nXG4gICAgIyBpZiBwcmV2aW91cyBlbGVtZW50IGlzIG5vdCBwYW5lIHJlc2l6ZSBlbGVtZW50LCB0aGVuIGluc2VydCBuZXcgcmVzaXplIGVsZW1lbnRcbiAgICBpZiBwcmV2RWxlbWVudD8gYW5kIG5vdCBAaXNQYW5lUmVzaXplSGFuZGxlRWxlbWVudChwcmV2RWxlbWVudClcbiAgICAgIHJlc2l6ZUhhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20tcGFuZS1yZXNpemUtaGFuZGxlJylcbiAgICAgIEBpbnNlcnRCZWZvcmUocmVzaXplSGFuZGxlLCB2aWV3KVxuXG4gICAgbmV4dEVsZW1lbnQgPSB2aWV3Lm5leHRTaWJsaW5nXG4gICAgIyBpZiBuZXh0IGVsZW1lbnQgaXNub3QgcmVzaXplIGVsZW1lbnQsIHRoZW4gaW5zZXJ0IG5ldyByZXNpemUgZWxlbWVudFxuICAgIGlmIG5leHRFbGVtZW50PyBhbmQgbm90IEBpc1BhbmVSZXNpemVIYW5kbGVFbGVtZW50KG5leHRFbGVtZW50KVxuICAgICAgcmVzaXplSGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXRvbS1wYW5lLXJlc2l6ZS1oYW5kbGUnKVxuICAgICAgQGluc2VydEJlZm9yZShyZXNpemVIYW5kbGUsIG5leHRFbGVtZW50KVxuXG4gIGNoaWxkUmVtb3ZlZDogKHtjaGlsZH0pIC0+XG4gICAgdmlldyA9IEB2aWV3cy5nZXRWaWV3KGNoaWxkKVxuICAgIHNpYmxpbmdWaWV3ID0gdmlldy5wcmV2aW91c1NpYmxpbmdcbiAgICAjIG1ha2Ugc3VyZSBuZXh0IHNpYmxpbmcgdmlldyBpcyBwYW5lIHJlc2l6ZSB2aWV3XG4gICAgaWYgc2libGluZ1ZpZXc/IGFuZCBAaXNQYW5lUmVzaXplSGFuZGxlRWxlbWVudChzaWJsaW5nVmlldylcbiAgICAgIHNpYmxpbmdWaWV3LnJlbW92ZSgpXG4gICAgdmlldy5yZW1vdmUoKVxuXG4gIGNoaWxkUmVwbGFjZWQ6ICh7aW5kZXgsIG9sZENoaWxkLCBuZXdDaGlsZH0pIC0+XG4gICAgZm9jdXNlZEVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGlmIEBoYXNGb2N1cygpXG4gICAgQGNoaWxkUmVtb3ZlZCh7Y2hpbGQ6IG9sZENoaWxkLCBpbmRleH0pXG4gICAgQGNoaWxkQWRkZWQoe2NoaWxkOiBuZXdDaGlsZCwgaW5kZXh9KVxuICAgIGZvY3VzZWRFbGVtZW50Py5mb2N1cygpIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaXMgZG9jdW1lbnQuYm9keVxuXG4gIGZsZXhTY2FsZUNoYW5nZWQ6IChmbGV4U2NhbGUpIC0+IEBzdHlsZS5mbGV4R3JvdyA9IGZsZXhTY2FsZVxuXG4gIGhhc0ZvY3VzOiAtPlxuICAgIHRoaXMgaXMgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBvciBAY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lQXhpc0VsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tcGFuZS1heGlzJywgcHJvdG90eXBlOiBQYW5lQXhpc0VsZW1lbnQucHJvdG90eXBlXG4iXX0=
