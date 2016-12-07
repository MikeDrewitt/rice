(function() {
  var CompositeDisposable, Emitter, StylesElement, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  StylesElement = (function(superClass) {
    extend(StylesElement, superClass);

    function StylesElement() {
      return StylesElement.__super__.constructor.apply(this, arguments);
    }

    StylesElement.prototype.subscriptions = null;

    StylesElement.prototype.context = null;

    StylesElement.prototype.onDidAddStyleElement = function(callback) {
      return this.emitter.on('did-add-style-element', callback);
    };

    StylesElement.prototype.onDidRemoveStyleElement = function(callback) {
      return this.emitter.on('did-remove-style-element', callback);
    };

    StylesElement.prototype.onDidUpdateStyleElement = function(callback) {
      return this.emitter.on('did-update-style-element', callback);
    };

    StylesElement.prototype.createdCallback = function() {
      this.subscriptions = new CompositeDisposable;
      this.emitter = new Emitter;
      return this.styleElementClonesByOriginalElement = new WeakMap;
    };

    StylesElement.prototype.attachedCallback = function() {
      var ref1;
      return this.context = (ref1 = this.getAttribute('context')) != null ? ref1 : void 0;
    };

    StylesElement.prototype.detachedCallback = function() {
      this.subscriptions.dispose();
      return this.subscriptions = new CompositeDisposable;
    };

    StylesElement.prototype.attributeChangedCallback = function(attrName, oldVal, newVal) {
      if (attrName === 'context') {
        return this.contextChanged();
      }
    };

    StylesElement.prototype.initialize = function(styleManager) {
      this.styleManager = styleManager;
      if (this.styleManager == null) {
        throw new Error("Must pass a styleManager parameter when initializing a StylesElement");
      }
      this.subscriptions.add(this.styleManager.observeStyleElements(this.styleElementAdded.bind(this)));
      this.subscriptions.add(this.styleManager.onDidRemoveStyleElement(this.styleElementRemoved.bind(this)));
      return this.subscriptions.add(this.styleManager.onDidUpdateStyleElement(this.styleElementUpdated.bind(this)));
    };

    StylesElement.prototype.contextChanged = function() {
      var child, i, j, len, len1, ref1, ref2, styleElement;
      if (this.subscriptions == null) {
        return;
      }
      ref1 = Array.prototype.slice.call(this.children);
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        this.styleElementRemoved(child);
      }
      this.context = this.getAttribute('context');
      ref2 = this.styleManager.getStyleElements();
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        styleElement = ref2[j];
        this.styleElementAdded(styleElement);
      }
    };

    StylesElement.prototype.styleElementAdded = function(styleElement) {
      var child, i, insertBefore, len, priority, ref1, styleElementClone;
      if (!this.styleElementMatchesContext(styleElement)) {
        return;
      }
      styleElementClone = styleElement.cloneNode(true);
      styleElementClone.sourcePath = styleElement.sourcePath;
      styleElementClone.context = styleElement.context;
      styleElementClone.priority = styleElement.priority;
      this.styleElementClonesByOriginalElement.set(styleElement, styleElementClone);
      priority = styleElement.priority;
      if (priority != null) {
        ref1 = this.children;
        for (i = 0, len = ref1.length; i < len; i++) {
          child = ref1[i];
          if (child.priority > priority) {
            insertBefore = child;
            break;
          }
        }
      }
      this.insertBefore(styleElementClone, insertBefore);
      return this.emitter.emit('did-add-style-element', styleElementClone);
    };

    StylesElement.prototype.styleElementRemoved = function(styleElement) {
      var ref1, styleElementClone;
      if (!this.styleElementMatchesContext(styleElement)) {
        return;
      }
      styleElementClone = (ref1 = this.styleElementClonesByOriginalElement.get(styleElement)) != null ? ref1 : styleElement;
      styleElementClone.remove();
      return this.emitter.emit('did-remove-style-element', styleElementClone);
    };

    StylesElement.prototype.styleElementUpdated = function(styleElement) {
      var styleElementClone;
      if (!this.styleElementMatchesContext(styleElement)) {
        return;
      }
      styleElementClone = this.styleElementClonesByOriginalElement.get(styleElement);
      styleElementClone.textContent = styleElement.textContent;
      return this.emitter.emit('did-update-style-element', styleElementClone);
    };

    StylesElement.prototype.styleElementMatchesContext = function(styleElement) {
      return (this.context == null) || styleElement.context === this.context;
    };

    return StylesElement;

  })(HTMLElement);

  module.exports = StylesElement = document.registerElement('atom-styles', {
    prototype: StylesElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zdHlsZXMtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdEQUFBO0lBQUE7OztFQUFBLE1BQWlDLE9BQUEsQ0FBUSxXQUFSLENBQWpDLEVBQUMscUJBQUQsRUFBVTs7RUFFSjs7Ozs7Ozs0QkFDSixhQUFBLEdBQWU7OzRCQUNmLE9BQUEsR0FBUzs7NEJBRVQsb0JBQUEsR0FBc0IsU0FBQyxRQUFEO2FBQ3BCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLHVCQUFaLEVBQXFDLFFBQXJDO0lBRG9COzs0QkFHdEIsdUJBQUEsR0FBeUIsU0FBQyxRQUFEO2FBQ3ZCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLDBCQUFaLEVBQXdDLFFBQXhDO0lBRHVCOzs0QkFHekIsdUJBQUEsR0FBeUIsU0FBQyxRQUFEO2FBQ3ZCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLDBCQUFaLEVBQXdDLFFBQXhDO0lBRHVCOzs0QkFHekIsZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7YUFDZixJQUFDLENBQUEsbUNBQUQsR0FBdUMsSUFBSTtJQUg1Qjs7NEJBS2pCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTthQUFBLElBQUMsQ0FBQSxPQUFELDBEQUFzQztJQUR0Qjs7NEJBR2xCLGdCQUFBLEdBQWtCLFNBQUE7TUFDaEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO0lBRkw7OzRCQUlsQix3QkFBQSxHQUEwQixTQUFDLFFBQUQsRUFBVyxNQUFYLEVBQW1CLE1BQW5CO01BQ3hC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ckIsMEJBQUEsR0FBNEIsU0FBQyxZQUFEO2FBQ3RCLHNCQUFKLElBQWlCLFlBQVksQ0FBQyxPQUFiLEtBQXdCLElBQUMsQ0FBQTtJQURoQjs7OztLQTVFRjs7RUErRTVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLGFBQUEsR0FBZ0IsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsYUFBekIsRUFBd0M7SUFBQSxTQUFBLEVBQVcsYUFBYSxDQUFDLFNBQXpCO0dBQXhDO0FBakZqQyIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcblxuY2xhc3MgU3R5bGVzRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIHN1YnNjcmlwdGlvbnM6IG51bGxcbiAgY29udGV4dDogbnVsbFxuXG4gIG9uRGlkQWRkU3R5bGVFbGVtZW50OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hZGQtc3R5bGUtZWxlbWVudCcsIGNhbGxiYWNrXG5cbiAgb25EaWRSZW1vdmVTdHlsZUVsZW1lbnQ6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXJlbW92ZS1zdHlsZS1lbGVtZW50JywgY2FsbGJhY2tcblxuICBvbkRpZFVwZGF0ZVN0eWxlRWxlbWVudDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtdXBkYXRlLXN0eWxlLWVsZW1lbnQnLCBjYWxsYmFja1xuXG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdHlsZUVsZW1lbnRDbG9uZXNCeU9yaWdpbmFsRWxlbWVudCA9IG5ldyBXZWFrTWFwXG5cbiAgYXR0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAY29udGV4dCA9IEBnZXRBdHRyaWJ1dGUoJ2NvbnRleHQnKSA/IHVuZGVmaW5lZFxuXG4gIGRldGFjaGVkQ2FsbGJhY2s6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjazogKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCkgLT5cbiAgICBAY29udGV4dENoYW5nZWQoKSBpZiBhdHRyTmFtZSBpcyAnY29udGV4dCdcblxuICBpbml0aWFsaXplOiAoQHN0eWxlTWFuYWdlcikgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSBzdHlsZU1hbmFnZXIgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIGEgU3R5bGVzRWxlbWVudFwiKSB1bmxlc3MgQHN0eWxlTWFuYWdlcj9cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAc3R5bGVNYW5hZ2VyLm9ic2VydmVTdHlsZUVsZW1lbnRzKEBzdHlsZUVsZW1lbnRBZGRlZC5iaW5kKHRoaXMpKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAc3R5bGVNYW5hZ2VyLm9uRGlkUmVtb3ZlU3R5bGVFbGVtZW50KEBzdHlsZUVsZW1lbnRSZW1vdmVkLmJpbmQodGhpcykpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBzdHlsZU1hbmFnZXIub25EaWRVcGRhdGVTdHlsZUVsZW1lbnQoQHN0eWxlRWxlbWVudFVwZGF0ZWQuYmluZCh0aGlzKSlcblxuICBjb250ZXh0Q2hhbmdlZDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBzdWJzY3JpcHRpb25zP1xuXG4gICAgQHN0eWxlRWxlbWVudFJlbW92ZWQoY2hpbGQpIGZvciBjaGlsZCBpbiBBcnJheTo6c2xpY2UuY2FsbChAY2hpbGRyZW4pXG4gICAgQGNvbnRleHQgPSBAZ2V0QXR0cmlidXRlKCdjb250ZXh0JylcbiAgICBAc3R5bGVFbGVtZW50QWRkZWQoc3R5bGVFbGVtZW50KSBmb3Igc3R5bGVFbGVtZW50IGluIEBzdHlsZU1hbmFnZXIuZ2V0U3R5bGVFbGVtZW50cygpXG4gICAgcmV0dXJuXG5cbiAgc3R5bGVFbGVtZW50QWRkZWQ6IChzdHlsZUVsZW1lbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAc3R5bGVFbGVtZW50TWF0Y2hlc0NvbnRleHQoc3R5bGVFbGVtZW50KVxuXG4gICAgc3R5bGVFbGVtZW50Q2xvbmUgPSBzdHlsZUVsZW1lbnQuY2xvbmVOb2RlKHRydWUpXG4gICAgc3R5bGVFbGVtZW50Q2xvbmUuc291cmNlUGF0aCA9IHN0eWxlRWxlbWVudC5zb3VyY2VQYXRoXG4gICAgc3R5bGVFbGVtZW50Q2xvbmUuY29udGV4dCA9IHN0eWxlRWxlbWVudC5jb250ZXh0XG4gICAgc3R5bGVFbGVtZW50Q2xvbmUucHJpb3JpdHkgPSBzdHlsZUVsZW1lbnQucHJpb3JpdHlcbiAgICBAc3R5bGVFbGVtZW50Q2xvbmVzQnlPcmlnaW5hbEVsZW1lbnQuc2V0KHN0eWxlRWxlbWVudCwgc3R5bGVFbGVtZW50Q2xvbmUpXG5cbiAgICBwcmlvcml0eSA9IHN0eWxlRWxlbWVudC5wcmlvcml0eVxuICAgIGlmIHByaW9yaXR5P1xuICAgICAgZm9yIGNoaWxkIGluIEBjaGlsZHJlblxuICAgICAgICBpZiBjaGlsZC5wcmlvcml0eSA+IHByaW9yaXR5XG4gICAgICAgICAgaW5zZXJ0QmVmb3JlID0gY2hpbGRcbiAgICAgICAgICBicmVha1xuXG4gICAgQGluc2VydEJlZm9yZShzdHlsZUVsZW1lbnRDbG9uZSwgaW5zZXJ0QmVmb3JlKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtc3R5bGUtZWxlbWVudCcsIHN0eWxlRWxlbWVudENsb25lXG5cbiAgc3R5bGVFbGVtZW50UmVtb3ZlZDogKHN0eWxlRWxlbWVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBzdHlsZUVsZW1lbnRNYXRjaGVzQ29udGV4dChzdHlsZUVsZW1lbnQpXG5cbiAgICBzdHlsZUVsZW1lbnRDbG9uZSA9IEBzdHlsZUVsZW1lbnRDbG9uZXNCeU9yaWdpbmFsRWxlbWVudC5nZXQoc3R5bGVFbGVtZW50KSA/IHN0eWxlRWxlbWVudFxuICAgIHN0eWxlRWxlbWVudENsb25lLnJlbW92ZSgpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXJlbW92ZS1zdHlsZS1lbGVtZW50Jywgc3R5bGVFbGVtZW50Q2xvbmVcblxuICBzdHlsZUVsZW1lbnRVcGRhdGVkOiAoc3R5bGVFbGVtZW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN0eWxlRWxlbWVudE1hdGNoZXNDb250ZXh0KHN0eWxlRWxlbWVudClcblxuICAgIHN0eWxlRWxlbWVudENsb25lID0gQHN0eWxlRWxlbWVudENsb25lc0J5T3JpZ2luYWxFbGVtZW50LmdldChzdHlsZUVsZW1lbnQpXG4gICAgc3R5bGVFbGVtZW50Q2xvbmUudGV4dENvbnRlbnQgPSBzdHlsZUVsZW1lbnQudGV4dENvbnRlbnRcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtdXBkYXRlLXN0eWxlLWVsZW1lbnQnLCBzdHlsZUVsZW1lbnRDbG9uZVxuXG4gIHN0eWxlRWxlbWVudE1hdGNoZXNDb250ZXh0OiAoc3R5bGVFbGVtZW50KSAtPlxuICAgIG5vdCBAY29udGV4dD8gb3Igc3R5bGVFbGVtZW50LmNvbnRleHQgaXMgQGNvbnRleHRcblxubW9kdWxlLmV4cG9ydHMgPSBTdHlsZXNFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdhdG9tLXN0eWxlcycsIHByb3RvdHlwZTogU3R5bGVzRWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
