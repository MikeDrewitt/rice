(function() {
  var CompositeDisposable, Emitter, Grim, TextBuffer, TextEditorComponent, TextEditorElement, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Grim = require('grim');

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  TextBuffer = require('text-buffer');

  TextEditorComponent = require('./text-editor-component');

  TextEditorElement = (function(superClass) {
    extend(TextEditorElement, superClass);

    function TextEditorElement() {
      return TextEditorElement.__super__.constructor.apply(this, arguments);
    }

    TextEditorElement.prototype.model = null;

    TextEditorElement.prototype.componentDescriptor = null;

    TextEditorElement.prototype.component = null;

    TextEditorElement.prototype.attached = false;

    TextEditorElement.prototype.tileSize = null;

    TextEditorElement.prototype.focusOnAttach = false;

    TextEditorElement.prototype.hasTiledRendering = true;

    TextEditorElement.prototype.logicalDisplayBuffer = true;

    TextEditorElement.prototype.lightDOM = true;

    TextEditorElement.prototype.createdCallback = function() {
      this.themes = atom.themes;
      this.workspace = atom.workspace;
      this.assert = atom.assert;
      this.views = atom.views;
      this.styles = atom.styles;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.addEventListener('focus', this.focused.bind(this));
      this.addEventListener('blur', this.blurred.bind(this));
      this.classList.add('editor');
      return this.setAttribute('tabindex', -1);
    };

    TextEditorElement.prototype.initializeContent = function(attributes) {
      Object.defineProperty(this, 'shadowRoot', {
        get: (function(_this) {
          return function() {
            Grim.deprecate("The contents of `atom-text-editor` elements are no longer encapsulated\nwithin a shadow DOM boundary. Please, stop using `shadowRoot` and access\nthe editor contents directly instead.");
            return _this;
          };
        })(this)
      });
      this.rootElement = document.createElement('div');
      this.rootElement.classList.add('editor--private');
      return this.appendChild(this.rootElement);
    };

    TextEditorElement.prototype.attachedCallback = function() {
      if (this.getModel() == null) {
        this.buildModel();
      }
      this.assert(this.model.isAlive(), "Attaching a view for a destroyed editor");
      if (this.component == null) {
        this.mountComponent();
      }
      this.listenForComponentEvents();
      this.component.checkForVisibilityChange();
      if (this.hasFocus()) {
        this.focused();
      }
      return this.emitter.emit("did-attach");
    };

    TextEditorElement.prototype.detachedCallback = function() {
      this.unmountComponent();
      this.subscriptions.dispose();
      this.subscriptions = new CompositeDisposable;
      return this.emitter.emit("did-detach");
    };

    TextEditorElement.prototype.listenForComponentEvents = function() {
      this.subscriptions.add(this.component.onDidChangeScrollTop((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this.emitter).emit.apply(ref1, ["did-change-scroll-top"].concat(slice.call(arguments)));
        };
      })(this)));
      return this.subscriptions.add(this.component.onDidChangeScrollLeft((function(_this) {
        return function() {
          var ref1;
          return (ref1 = _this.emitter).emit.apply(ref1, ["did-change-scroll-left"].concat(slice.call(arguments)));
        };
      })(this)));
    };

    TextEditorElement.prototype.initialize = function(model, arg) {
      this.views = arg.views, this.themes = arg.themes, this.workspace = arg.workspace, this.assert = arg.assert, this.styles = arg.styles;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing TextEditorElements");
      }
      if (this.themes == null) {
        throw new Error("Must pass a themes parameter when initializing TextEditorElements");
      }
      if (this.workspace == null) {
        throw new Error("Must pass a workspace parameter when initializing TextEditorElements");
      }
      if (this.assert == null) {
        throw new Error("Must pass an assert parameter when initializing TextEditorElements");
      }
      if (this.styles == null) {
        throw new Error("Must pass a styles parameter when initializing TextEditorElements");
      }
      this.setModel(model);
      return this;
    };

    TextEditorElement.prototype.setModel = function(model) {
      if (this.model != null) {
        throw new Error("Model already assigned on TextEditorElement");
      }
      if (model.isDestroyed()) {
        return;
      }
      this.model = model;
      this.model.setUpdatedSynchronously(this.isUpdatedSynchronously());
      this.initializeContent();
      this.mountComponent();
      this.addGrammarScopeAttribute();
      if (this.model.isMini()) {
        this.addMiniAttribute();
      }
      this.addEncodingAttribute();
      this.model.onDidChangeGrammar((function(_this) {
        return function() {
          return _this.addGrammarScopeAttribute();
        };
      })(this));
      this.model.onDidChangeEncoding((function(_this) {
        return function() {
          return _this.addEncodingAttribute();
        };
      })(this));
      this.model.onDidDestroy((function(_this) {
        return function() {
          return _this.unmountComponent();
        };
      })(this));
      this.model.onDidChangeMini((function(_this) {
        return function(mini) {
          if (mini) {
            return _this.addMiniAttribute();
          } else {
            return _this.removeMiniAttribute();
          }
        };
      })(this));
      return this.model;
    };

    TextEditorElement.prototype.getModel = function() {
      var ref1;
      return (ref1 = this.model) != null ? ref1 : this.buildModel();
    };

    TextEditorElement.prototype.buildModel = function() {
      return this.setModel(this.workspace.buildTextEditor({
        buffer: new TextBuffer(this.textContent),
        softWrapped: false,
        tabLength: 2,
        softTabs: true,
        mini: this.hasAttribute('mini'),
        lineNumberGutterVisible: !this.hasAttribute('gutter-hidden'),
        placeholderText: this.getAttribute('placeholder-text')
      }));
    };

    TextEditorElement.prototype.mountComponent = function() {
      var inputNode;
      this.component = new TextEditorComponent({
        hostElement: this,
        editor: this.model,
        tileSize: this.tileSize,
        views: this.views,
        themes: this.themes,
        styles: this.styles,
        workspace: this.workspace,
        assert: this.assert
      });
      this.rootElement.appendChild(this.component.getDomNode());
      inputNode = this.component.hiddenInputComponent.getDomNode();
      inputNode.addEventListener('focus', this.focused.bind(this));
      return inputNode.addEventListener('blur', this.inputNodeBlurred.bind(this));
    };

    TextEditorElement.prototype.unmountComponent = function() {
      if (this.component != null) {
        this.component.destroy();
        this.component.getDomNode().remove();
        return this.component = null;
      }
    };

    TextEditorElement.prototype.focused = function(event) {
      var ref1;
      return (ref1 = this.component) != null ? ref1.focused() : void 0;
    };

    TextEditorElement.prototype.blurred = function(event) {
      var ref1, ref2;
      if (event.relatedTarget === ((ref1 = this.component) != null ? ref1.hiddenInputComponent.getDomNode() : void 0)) {
        event.stopImmediatePropagation();
        return;
      }
      return (ref2 = this.component) != null ? ref2.blurred() : void 0;
    };

    TextEditorElement.prototype.inputNodeBlurred = function(event) {
      if (event.relatedTarget !== this) {
        return this.dispatchEvent(new FocusEvent('blur', {
          bubbles: false
        }));
      }
    };

    TextEditorElement.prototype.addGrammarScopeAttribute = function() {
      var ref1, ref2;
      return this.dataset.grammar = (ref1 = this.model.getGrammar()) != null ? (ref2 = ref1.scopeName) != null ? ref2.replace(/\./g, ' ') : void 0 : void 0;
    };

    TextEditorElement.prototype.addMiniAttribute = function() {
      return this.setAttributeNode(document.createAttribute("mini"));
    };

    TextEditorElement.prototype.removeMiniAttribute = function() {
      return this.removeAttribute("mini");
    };

    TextEditorElement.prototype.addEncodingAttribute = function() {
      return this.dataset.encoding = this.model.getEncoding();
    };

    TextEditorElement.prototype.hasFocus = function() {
      return this === document.activeElement || this.contains(document.activeElement);
    };

    TextEditorElement.prototype.setUpdatedSynchronously = function(updatedSynchronously) {
      var ref1;
      this.updatedSynchronously = updatedSynchronously;
      if ((ref1 = this.model) != null) {
        ref1.setUpdatedSynchronously(this.updatedSynchronously);
      }
      return this.updatedSynchronously;
    };

    TextEditorElement.prototype.isUpdatedSynchronously = function() {
      return this.updatedSynchronously;
    };

    TextEditorElement.prototype.setContinuousReflow = function(continuousReflow) {
      var ref1;
      return (ref1 = this.component) != null ? ref1.setContinuousReflow(continuousReflow) : void 0;
    };

    TextEditorElement.prototype.getDefaultCharacterWidth = function() {
      return this.getModel().getDefaultCharWidth();
    };

    TextEditorElement.prototype.getMaxScrollTop = function() {
      var ref1;
      return (ref1 = this.component) != null ? ref1.getMaxScrollTop() : void 0;
    };

    TextEditorElement.prototype.pixelPositionForBufferPosition = function(bufferPosition) {
      return this.component.pixelPositionForBufferPosition(bufferPosition);
    };

    TextEditorElement.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      return this.component.pixelPositionForScreenPosition(screenPosition);
    };

    TextEditorElement.prototype.getFirstVisibleScreenRow = function() {
      return this.getVisibleRowRange()[0];
    };

    TextEditorElement.prototype.getLastVisibleScreenRow = function() {
      return this.getVisibleRowRange()[1];
    };

    TextEditorElement.prototype.onDidAttach = function(callback) {
      return this.emitter.on("did-attach", callback);
    };

    TextEditorElement.prototype.onDidDetach = function(callback) {
      return this.emitter.on("did-detach", callback);
    };

    TextEditorElement.prototype.onDidChangeScrollTop = function(callback) {
      return this.emitter.on("did-change-scroll-top", callback);
    };

    TextEditorElement.prototype.onDidChangeScrollLeft = function(callback) {
      return this.emitter.on("did-change-scroll-left", callback);
    };

    TextEditorElement.prototype.setScrollLeft = function(scrollLeft) {
      return this.component.setScrollLeft(scrollLeft);
    };

    TextEditorElement.prototype.setScrollRight = function(scrollRight) {
      return this.component.setScrollRight(scrollRight);
    };

    TextEditorElement.prototype.setScrollTop = function(scrollTop) {
      return this.component.setScrollTop(scrollTop);
    };

    TextEditorElement.prototype.setScrollBottom = function(scrollBottom) {
      return this.component.setScrollBottom(scrollBottom);
    };

    TextEditorElement.prototype.scrollToTop = function() {
      return this.setScrollTop(0);
    };

    TextEditorElement.prototype.scrollToBottom = function() {
      return this.setScrollBottom(2e308);
    };

    TextEditorElement.prototype.getScrollTop = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollTop() : void 0) || 0;
    };

    TextEditorElement.prototype.getScrollLeft = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollLeft() : void 0) || 0;
    };

    TextEditorElement.prototype.getScrollRight = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollRight() : void 0) || 0;
    };

    TextEditorElement.prototype.getScrollBottom = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollBottom() : void 0) || 0;
    };

    TextEditorElement.prototype.getScrollHeight = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollHeight() : void 0) || 0;
    };

    TextEditorElement.prototype.getScrollWidth = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getScrollWidth() : void 0) || 0;
    };

    TextEditorElement.prototype.getVerticalScrollbarWidth = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getVerticalScrollbarWidth() : void 0) || 0;
    };

    TextEditorElement.prototype.getHorizontalScrollbarHeight = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getHorizontalScrollbarHeight() : void 0) || 0;
    };

    TextEditorElement.prototype.getVisibleRowRange = function() {
      var ref1;
      return ((ref1 = this.component) != null ? ref1.getVisibleRowRange() : void 0) || [0, 0];
    };

    TextEditorElement.prototype.intersectsVisibleRowRange = function(startRow, endRow) {
      var ref1, visibleEnd, visibleStart;
      ref1 = this.getVisibleRowRange(), visibleStart = ref1[0], visibleEnd = ref1[1];
      return !(endRow <= visibleStart || visibleEnd <= startRow);
    };

    TextEditorElement.prototype.selectionIntersectsVisibleRowRange = function(selection) {
      var end, ref1, start;
      ref1 = selection.getScreenRange(), start = ref1.start, end = ref1.end;
      return this.intersectsVisibleRowRange(start.row, end.row + 1);
    };

    TextEditorElement.prototype.screenPositionForPixelPosition = function(pixelPosition) {
      return this.component.screenPositionForPixelPosition(pixelPosition);
    };

    TextEditorElement.prototype.pixelRectForScreenRange = function(screenRange) {
      return this.component.pixelRectForScreenRange(screenRange);
    };

    TextEditorElement.prototype.pixelRangeForScreenRange = function(screenRange) {
      return this.component.pixelRangeForScreenRange(screenRange);
    };

    TextEditorElement.prototype.setWidth = function(width) {
      return this.style.width = (this.component.getGutterWidth() + width) + "px";
    };

    TextEditorElement.prototype.getWidth = function() {
      return this.offsetWidth - this.component.getGutterWidth();
    };

    TextEditorElement.prototype.setHeight = function(height) {
      return this.style.height = height + "px";
    };

    TextEditorElement.prototype.getHeight = function() {
      return this.offsetHeight;
    };

    TextEditorElement.prototype.invalidateBlockDecorationDimensions = function() {
      var ref1;
      return (ref1 = this.component).invalidateBlockDecorationDimensions.apply(ref1, arguments);
    };

    return TextEditorElement;

  })(HTMLElement);

  module.exports = TextEditorElement = document.registerElement('atom-text-editor', {
    prototype: TextEditorElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3RleHQtZWRpdG9yLWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyRkFBQTtJQUFBOzs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQWlDLE9BQUEsQ0FBUSxXQUFSLENBQWpDLEVBQUMscUJBQUQsRUFBVTs7RUFDVixVQUFBLEdBQWEsT0FBQSxDQUFRLGFBQVI7O0VBQ2IsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLHlCQUFSOztFQUVoQjs7Ozs7OztnQ0FDSixLQUFBLEdBQU87O2dDQUNQLG1CQUFBLEdBQXFCOztnQ0FDckIsU0FBQSxHQUFXOztnQ0FDWCxRQUFBLEdBQVU7O2dDQUNWLFFBQUEsR0FBVTs7Z0NBQ1YsYUFBQSxHQUFlOztnQ0FDZixpQkFBQSxHQUFtQjs7Z0NBQ25CLG9CQUFBLEdBQXNCOztnQ0FDdEIsUUFBQSxHQUFVOztnQ0FFVixlQUFBLEdBQWlCLFNBQUE7TUFFZixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksQ0FBQztNQUNmLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBSSxDQUFDO01BQ2xCLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBSSxDQUFDO01BQ2YsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7TUFDZCxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksQ0FBQztNQUVmLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFFckIsSUFBQyxDQUFBLGdCQUFELENBQWtCLE9BQWxCLEVBQTJCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBM0I7TUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFB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QUE7YUFBQSxRQUFBLElBQUMsQ0FBQSxTQUFELENBQVUsQ0FBQyxtQ0FBWCxhQUErQyxTQUEvQztJQURtQzs7OztLQXZUUDs7RUEwVGhDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLGlCQUFBLEdBQW9CLFFBQVEsQ0FBQyxlQUFULENBQXlCLGtCQUF6QixFQUE2QztJQUFBLFNBQUEsRUFBVyxpQkFBaUIsQ0FBQyxTQUE3QjtHQUE3QztBQS9UckMiLCJzb3VyY2VzQ29udGVudCI6WyJHcmltID0gcmVxdWlyZSAnZ3JpbSdcbntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcblRleHRCdWZmZXIgPSByZXF1aXJlICd0ZXh0LWJ1ZmZlcidcblRleHRFZGl0b3JDb21wb25lbnQgPSByZXF1aXJlICcuL3RleHQtZWRpdG9yLWNvbXBvbmVudCdcblxuY2xhc3MgVGV4dEVkaXRvckVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBtb2RlbDogbnVsbFxuICBjb21wb25lbnREZXNjcmlwdG9yOiBudWxsXG4gIGNvbXBvbmVudDogbnVsbFxuICBhdHRhY2hlZDogZmFsc2VcbiAgdGlsZVNpemU6IG51bGxcbiAgZm9jdXNPbkF0dGFjaDogZmFsc2VcbiAgaGFzVGlsZWRSZW5kZXJpbmc6IHRydWVcbiAgbG9naWNhbERpc3BsYXlCdWZmZXI6IHRydWVcbiAgbGlnaHRET006IHRydWVcblxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgIyBVc2UgZ2xvYmFscyB3aGVuIHRoZSBmb2xsb3dpbmcgaW5zdGFuY2UgdmFyaWFibGVzIGFyZW4ndCBzZXQuXG4gICAgQHRoZW1lcyA9IGF0b20udGhlbWVzXG4gICAgQHdvcmtzcGFjZSA9IGF0b20ud29ya3NwYWNlXG4gICAgQGFzc2VydCA9IGF0b20uYXNzZXJ0XG4gICAgQHZpZXdzID0gYXRvbS52aWV3c1xuICAgIEBzdHlsZXMgPSBhdG9tLnN0eWxlc1xuXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBhZGRFdmVudExpc3RlbmVyICdmb2N1cycsIEBmb2N1c2VkLmJpbmQodGhpcylcbiAgICBAYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicsIEBibHVycmVkLmJpbmQodGhpcylcblxuICAgIEBjbGFzc0xpc3QuYWRkKCdlZGl0b3InKVxuICAgIEBzZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgLTEpXG5cbiAgaW5pdGlhbGl6ZUNvbnRlbnQ6IChhdHRyaWJ1dGVzKSAtPlxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc2hhZG93Um9vdCcsIHtcbiAgICAgIGdldDogPT5cbiAgICAgICAgR3JpbS5kZXByZWNhdGUoXCJcIlwiXG4gICAgICAgIFRoZSBjb250ZW50cyBvZiBgYXRvbS10ZXh0LWVkaXRvcmAgZWxlbWVudHMgYXJlIG5vIGxvbmdlciBlbmNhcHN1bGF0ZWRcbiAgICAgICAgd2l0aGluIGEgc2hhZG93IERPTSBib3VuZGFyeS4gUGxlYXNlLCBzdG9wIHVzaW5nIGBzaGFkb3dSb290YCBhbmQgYWNjZXNzXG4gICAgICAgIHRoZSBlZGl0b3IgY29udGVudHMgZGlyZWN0bHkgaW5zdGVhZC5cbiAgICAgICAgXCJcIlwiKVxuICAgICAgICB0aGlzXG4gICAgfSlcbiAgICBAcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEByb290RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdlZGl0b3ItLXByaXZhdGUnKVxuICAgIEBhcHBlbmRDaGlsZChAcm9vdEVsZW1lbnQpXG5cbiAgYXR0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAYnVpbGRNb2RlbCgpIHVubGVzcyBAZ2V0TW9kZWwoKT9cbiAgICBAYXNzZXJ0KEBtb2RlbC5pc0FsaXZlKCksIFwiQXR0YWNoaW5nIGEgdmlldyBmb3IgYSBkZXN0cm95ZWQgZWRpdG9yXCIpXG4gICAgQG1vdW50Q29tcG9uZW50KCkgdW5sZXNzIEBjb21wb25lbnQ/XG4gICAgQGxpc3RlbkZvckNvbXBvbmVudEV2ZW50cygpXG4gICAgQGNvbXBvbmVudC5jaGVja0ZvclZpc2liaWxpdHlDaGFuZ2UoKVxuICAgIGlmIEBoYXNGb2N1cygpXG4gICAgICBAZm9jdXNlZCgpXG4gICAgQGVtaXR0ZXIuZW1pdChcImRpZC1hdHRhY2hcIilcblxuICBkZXRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEB1bm1vdW50Q29tcG9uZW50KClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGVtaXR0ZXIuZW1pdChcImRpZC1kZXRhY2hcIilcblxuICBsaXN0ZW5Gb3JDb21wb25lbnRFdmVudHM6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBjb21wb25lbnQub25EaWRDaGFuZ2VTY3JvbGxUb3AgPT5cbiAgICAgIEBlbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLXNjcm9sbC10b3BcIiwgYXJndW1lbnRzLi4uKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY29tcG9uZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsTGVmdCA9PlxuICAgICAgQGVtaXR0ZXIuZW1pdChcImRpZC1jaGFuZ2Utc2Nyb2xsLWxlZnRcIiwgYXJndW1lbnRzLi4uKVxuXG4gIGluaXRpYWxpemU6IChtb2RlbCwge0B2aWV3cywgQHRoZW1lcywgQHdvcmtzcGFjZSwgQGFzc2VydCwgQHN0eWxlc30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgdmlld3MgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQHZpZXdzP1xuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHRoZW1lcyBwYXJhbWV0ZXIgd2hlbiBpbml0aWFsaXppbmcgVGV4dEVkaXRvckVsZW1lbnRzXCIpIHVubGVzcyBAdGhlbWVzP1xuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHdvcmtzcGFjZSBwYXJhbWV0ZXIgd2hlbiBpbml0aWFsaXppbmcgVGV4dEVkaXRvckVsZW1lbnRzXCIpIHVubGVzcyBAd29ya3NwYWNlP1xuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhbiBhc3NlcnQgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQGFzc2VydD9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSBzdHlsZXMgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQHN0eWxlcz9cblxuICAgIEBzZXRNb2RlbChtb2RlbClcbiAgICB0aGlzXG5cbiAgc2V0TW9kZWw6IChtb2RlbCkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb2RlbCBhbHJlYWR5IGFzc2lnbmVkIG9uIFRleHRFZGl0b3JFbGVtZW50XCIpIGlmIEBtb2RlbD9cbiAgICByZXR1cm4gaWYgbW9kZWwuaXNEZXN0cm95ZWQoKVxuXG4gICAgQG1vZGVsID0gbW9kZWxcbiAgICBAbW9kZWwuc2V0VXBkYXRlZFN5bmNocm9ub3VzbHkoQGlzVXBkYXRlZFN5bmNocm9ub3VzbHkoKSlcbiAgICBAaW5pdGlhbGl6ZUNvbnRlbnQoKVxuICAgIEBtb3VudENvbXBvbmVudCgpXG4gICAgQGFkZEdyYW1tYXJTY29wZUF0dHJpYnV0ZSgpXG4gICAgQGFkZE1pbmlBdHRyaWJ1dGUoKSBpZiBAbW9kZWwuaXNNaW5pKClcbiAgICBAYWRkRW5jb2RpbmdBdHRyaWJ1dGUoKVxuICAgIEBtb2RlbC5vbkRpZENoYW5nZUdyYW1tYXIgPT4gQGFkZEdyYW1tYXJTY29wZUF0dHJpYnV0ZSgpXG4gICAgQG1vZGVsLm9uRGlkQ2hhbmdlRW5jb2RpbmcgPT4gQGFkZEVuY29kaW5nQXR0cmlidXRlKClcbiAgICBAbW9kZWwub25EaWREZXN0cm95ID0+IEB1bm1vdW50Q29tcG9uZW50KClcbiAgICBAbW9kZWwub25EaWRDaGFuZ2VNaW5pIChtaW5pKSA9PiBpZiBtaW5pIHRoZW4gQGFkZE1pbmlBdHRyaWJ1dGUoKSBlbHNlIEByZW1vdmVNaW5pQXR0cmlidXRlKClcbiAgICBAbW9kZWxcblxuICBnZXRNb2RlbDogLT5cbiAgICBAbW9kZWwgPyBAYnVpbGRNb2RlbCgpXG5cbiAgYnVpbGRNb2RlbDogLT5cbiAgICBAc2V0TW9kZWwoQHdvcmtzcGFjZS5idWlsZFRleHRFZGl0b3IoXG4gICAgICBidWZmZXI6IG5ldyBUZXh0QnVmZmVyKEB0ZXh0Q29udGVudClcbiAgICAgIHNvZnRXcmFwcGVkOiBmYWxzZVxuICAgICAgdGFiTGVuZ3RoOiAyXG4gICAgICBzb2Z0VGFiczogdHJ1ZVxuICAgICAgbWluaTogQGhhc0F0dHJpYnV0ZSgnbWluaScpXG4gICAgICBsaW5lTnVtYmVyR3V0dGVyVmlzaWJsZTogbm90IEBoYXNBdHRyaWJ1dGUoJ2d1dHRlci1oaWRkZW4nKVxuICAgICAgcGxhY2Vob2xkZXJUZXh0OiBAZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlci10ZXh0JylcbiAgICApKVxuXG4gIG1vdW50Q29tcG9uZW50OiAtPlxuICAgIEBjb21wb25lbnQgPSBuZXcgVGV4dEVkaXRvckNvbXBvbmVudChcbiAgICAgIGhvc3RFbGVtZW50OiB0aGlzXG4gICAgICBlZGl0b3I6IEBtb2RlbFxuICAgICAgdGlsZVNpemU6IEB0aWxlU2l6ZVxuICAgICAgdmlld3M6IEB2aWV3c1xuICAgICAgdGhlbWVzOiBAdGhlbWVzXG4gICAgICBzdHlsZXM6IEBzdHlsZXNcbiAgICAgIHdvcmtzcGFjZTogQHdvcmtzcGFjZVxuICAgICAgYXNzZXJ0OiBAYXNzZXJ0XG4gICAgKVxuICAgIEByb290RWxlbWVudC5hcHBlbmRDaGlsZChAY29tcG9uZW50LmdldERvbU5vZGUoKSlcbiAgICBpbnB1dE5vZGUgPSBAY29tcG9uZW50LmhpZGRlbklucHV0Q29tcG9uZW50LmdldERvbU5vZGUoKVxuICAgIGlucHV0Tm9kZS5hZGRFdmVudExpc3RlbmVyICdmb2N1cycsIEBmb2N1c2VkLmJpbmQodGhpcylcbiAgICBpbnB1dE5vZGUuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicsIEBpbnB1dE5vZGVCbHVycmVkLmJpbmQodGhpcylcblxuICB1bm1vdW50Q29tcG9uZW50OiAtPlxuICAgIGlmIEBjb21wb25lbnQ/XG4gICAgICBAY29tcG9uZW50LmRlc3Ryb3koKVxuICAgICAgQGNvbXBvbmVudC5nZXREb21Ob2RlKCkucmVtb3ZlKClcbiAgICAgIEBjb21wb25lbnQgPSBudWxsXG5cbiAgZm9jdXNlZDogKGV2ZW50KSAtPlxuICAgIEBjb21wb25lbnQ/LmZvY3VzZWQoKVxuXG4gIGJsdXJyZWQ6IChldmVudCkgLT5cbiAgICBpZiBldmVudC5yZWxhdGVkVGFyZ2V0IGlzIEBjb21wb25lbnQ/LmhpZGRlbklucHV0Q29tcG9uZW50LmdldERvbU5vZGUoKVxuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIHJldHVyblxuICAgIEBjb21wb25lbnQ/LmJsdXJyZWQoKVxuXG4gIGlucHV0Tm9kZUJsdXJyZWQ6IChldmVudCkgLT5cbiAgICBpZiBldmVudC5yZWxhdGVkVGFyZ2V0IGlzbnQgdGhpc1xuICAgICAgQGRpc3BhdGNoRXZlbnQobmV3IEZvY3VzRXZlbnQoJ2JsdXInLCBidWJibGVzOiBmYWxzZSkpXG5cbiAgYWRkR3JhbW1hclNjb3BlQXR0cmlidXRlOiAtPlxuICAgIEBkYXRhc2V0LmdyYW1tYXIgPSBAbW9kZWwuZ2V0R3JhbW1hcigpPy5zY29wZU5hbWU/LnJlcGxhY2UoL1xcLi9nLCAnICcpXG5cbiAgYWRkTWluaUF0dHJpYnV0ZTogLT5cbiAgICBAc2V0QXR0cmlidXRlTm9kZShkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJtaW5pXCIpKVxuXG4gIHJlbW92ZU1pbmlBdHRyaWJ1dGU6IC0+XG4gICAgQHJlbW92ZUF0dHJpYnV0ZShcIm1pbmlcIilcblxuICBhZGRFbmNvZGluZ0F0dHJpYnV0ZTogLT5cbiAgICBAZGF0YXNldC5lbmNvZGluZyA9IEBtb2RlbC5nZXRFbmNvZGluZygpXG5cbiAgaGFzRm9jdXM6IC0+XG4gICAgdGhpcyBpcyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IG9yIEBjb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuXG4gIHNldFVwZGF0ZWRTeW5jaHJvbm91c2x5OiAoQHVwZGF0ZWRTeW5jaHJvbm91c2x5KSAtPlxuICAgIEBtb2RlbD8uc2V0VXBkYXRlZFN5bmNocm9ub3VzbHkoQHVwZGF0ZWRTeW5jaHJvbm91c2x5KVxuICAgIEB1cGRhdGVkU3luY2hyb25vdXNseVxuXG4gIGlzVXBkYXRlZFN5bmNocm9ub3VzbHk6IC0+IEB1cGRhdGVkU3luY2hyb25vdXNseVxuXG4gICMgRXh0ZW5kZWQ6IENvbnRpbnVvdXNseSByZWZsb3dzIGxpbmVzIGFuZCBsaW5lIG51bWJlcnMuIChIYXMgcGVyZm9ybWFuY2Ugb3ZlcmhlYWQpXG4gICNcbiAgIyAqIGBjb250aW51b3VzUmVmbG93YCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8ga2VlcCByZWZsb3dpbmcgb3Igbm90LlxuICBzZXRDb250aW51b3VzUmVmbG93OiAoY29udGludW91c1JlZmxvdykgLT5cbiAgICBAY29tcG9uZW50Py5zZXRDb250aW51b3VzUmVmbG93KGNvbnRpbnVvdXNSZWZsb3cpXG5cbiAgIyBFeHRlbmRlZDogZ2V0IHRoZSB3aWR0aCBvZiBhIGNoYXJhY3RlciBvZiB0ZXh0IGRpc3BsYXllZCBpbiB0aGlzIGVsZW1lbnQuXG4gICNcbiAgIyBSZXR1cm5zIGEge051bWJlcn0gb2YgcGl4ZWxzLlxuICBnZXREZWZhdWx0Q2hhcmFjdGVyV2lkdGg6IC0+XG4gICAgQGdldE1vZGVsKCkuZ2V0RGVmYXVsdENoYXJXaWR0aCgpXG5cbiAgIyBFeHRlbmRlZDogR2V0IHRoZSBtYXhpbXVtIHNjcm9sbCB0b3AgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB0aGlzIGVsZW1lbnQuXG4gICNcbiAgIyBSZXR1cm5zIGEge051bWJlcn0gb2YgcGl4ZWxzLlxuICBnZXRNYXhTY3JvbGxUb3A6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0TWF4U2Nyb2xsVG9wKClcblxuICAjIEV4dGVuZGVkOiBDb252ZXJ0cyBhIGJ1ZmZlciBwb3NpdGlvbiB0byBhIHBpeGVsIHBvc2l0aW9uLlxuICAjXG4gICMgKiBgYnVmZmVyUG9zaXRpb25gIEFuIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBidWZmZXIgcG9zaXRpb24uIEl0IGNhbiBiZSBlaXRoZXJcbiAgIyAgIGFuIHtPYmplY3R9IChge3JvdywgY29sdW1ufWApLCB7QXJyYXl9IChgW3JvdywgY29sdW1uXWApLCBvciB7UG9pbnR9XG4gICNcbiAgIyBSZXR1cm5zIGFuIHtPYmplY3R9IHdpdGggdHdvIHZhbHVlczogYHRvcGAgYW5kIGBsZWZ0YCwgcmVwcmVzZW50aW5nIHRoZSBwaXhlbCBwb3NpdGlvbi5cbiAgcGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uOiAoYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgQGNvbXBvbmVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG5cbiAgIyBFeHRlbmRlZDogQ29udmVydHMgYSBzY3JlZW4gcG9zaXRpb24gdG8gYSBwaXhlbCBwb3NpdGlvbi5cbiAgI1xuICAjICogYHNjcmVlblBvc2l0aW9uYCBBbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgc2NyZWVuIHBvc2l0aW9uLiBJdCBjYW4gYmUgZWl0aGVyXG4gICMgICBhbiB7T2JqZWN0fSAoYHtyb3csIGNvbHVtbn1gKSwge0FycmF5fSAoYFtyb3csIGNvbHVtbl1gKSwgb3Ige1BvaW50fVxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB3aXRoIHR3byB2YWx1ZXM6IGB0b3BgIGFuZCBgbGVmdGAsIHJlcHJlc2VudGluZyB0aGUgcGl4ZWwgcG9zaXRpb25zLlxuICBwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb246IChzY3JlZW5Qb3NpdGlvbikgLT5cbiAgICBAY29tcG9uZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbilcblxuICAjIEV4dGVuZGVkOiBSZXRyaWV2ZXMgdGhlIG51bWJlciBvZiB0aGUgcm93IHRoYXQgaXMgdmlzaWJsZSBhbmQgY3VycmVudGx5IGF0IHRoZVxuICAjIHRvcCBvZiB0aGUgZWRpdG9yLlxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9LlxuICBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3c6IC0+XG4gICAgQGdldFZpc2libGVSb3dSYW5nZSgpWzBdXG5cbiAgIyBFeHRlbmRlZDogUmV0cmlldmVzIHRoZSBudW1iZXIgb2YgdGhlIHJvdyB0aGF0IGlzIHZpc2libGUgYW5kIGN1cnJlbnRseSBhdCB0aGVcbiAgIyBib3R0b20gb2YgdGhlIGVkaXRvci5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3c6IC0+XG4gICAgQGdldFZpc2libGVSb3dSYW5nZSgpWzFdXG5cbiAgIyBFeHRlbmRlZDogY2FsbCB0aGUgZ2l2ZW4gYGNhbGxiYWNrYCB3aGVuIHRoZSBlZGl0b3IgaXMgYXR0YWNoZWQgdG8gdGhlIERPTS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gIG9uRGlkQXR0YWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oXCJkaWQtYXR0YWNoXCIsIGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IGNhbGwgdGhlIGdpdmVuIGBjYWxsYmFja2Agd2hlbiB0aGUgZWRpdG9yIGlzIGRldGFjaGVkIGZyb20gdGhlIERPTS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259XG4gIG9uRGlkRGV0YWNoOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oXCJkaWQtZGV0YWNoXCIsIGNhbGxiYWNrKVxuXG4gIG9uRGlkQ2hhbmdlU2Nyb2xsVG9wOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oXCJkaWQtY2hhbmdlLXNjcm9sbC10b3BcIiwgY2FsbGJhY2spXG5cbiAgb25EaWRDaGFuZ2VTY3JvbGxMZWZ0OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24oXCJkaWQtY2hhbmdlLXNjcm9sbC1sZWZ0XCIsIGNhbGxiYWNrKVxuXG4gIHNldFNjcm9sbExlZnQ6IChzY3JvbGxMZWZ0KSAtPlxuICAgIEBjb21wb25lbnQuc2V0U2Nyb2xsTGVmdChzY3JvbGxMZWZ0KVxuXG4gIHNldFNjcm9sbFJpZ2h0OiAoc2Nyb2xsUmlnaHQpIC0+XG4gICAgQGNvbXBvbmVudC5zZXRTY3JvbGxSaWdodChzY3JvbGxSaWdodClcblxuICBzZXRTY3JvbGxUb3A6IChzY3JvbGxUb3ApIC0+XG4gICAgQGNvbXBvbmVudC5zZXRTY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuXG4gIHNldFNjcm9sbEJvdHRvbTogKHNjcm9sbEJvdHRvbSkgLT5cbiAgICBAY29tcG9uZW50LnNldFNjcm9sbEJvdHRvbShzY3JvbGxCb3R0b20pXG5cbiAgIyBFc3NlbnRpYWw6IFNjcm9sbHMgdGhlIGVkaXRvciB0byB0aGUgdG9wXG4gIHNjcm9sbFRvVG9wOiAtPlxuICAgIEBzZXRTY3JvbGxUb3AoMClcblxuICAjIEVzc2VudGlhbDogU2Nyb2xscyB0aGUgZWRpdG9yIHRvIHRoZSBib3R0b21cbiAgc2Nyb2xsVG9Cb3R0b206IC0+XG4gICAgQHNldFNjcm9sbEJvdHRvbShJbmZpbml0eSlcblxuICBnZXRTY3JvbGxUb3A6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsVG9wKCkgb3IgMFxuXG4gIGdldFNjcm9sbExlZnQ6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsTGVmdCgpIG9yIDBcblxuICBnZXRTY3JvbGxSaWdodDogLT5cbiAgICBAY29tcG9uZW50Py5nZXRTY3JvbGxSaWdodCgpIG9yIDBcblxuICBnZXRTY3JvbGxCb3R0b206IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsQm90dG9tKCkgb3IgMFxuXG4gIGdldFNjcm9sbEhlaWdodDogLT5cbiAgICBAY29tcG9uZW50Py5nZXRTY3JvbGxIZWlnaHQoKSBvciAwXG5cbiAgZ2V0U2Nyb2xsV2lkdGg6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsV2lkdGgoKSBvciAwXG5cbiAgZ2V0VmVydGljYWxTY3JvbGxiYXJXaWR0aDogLT5cbiAgICBAY29tcG9uZW50Py5nZXRWZXJ0aWNhbFNjcm9sbGJhcldpZHRoKCkgb3IgMFxuXG4gIGdldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQ6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0SG9yaXpvbnRhbFNjcm9sbGJhckhlaWdodCgpIG9yIDBcblxuICBnZXRWaXNpYmxlUm93UmFuZ2U6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0VmlzaWJsZVJvd1JhbmdlKCkgb3IgWzAsIDBdXG5cbiAgaW50ZXJzZWN0c1Zpc2libGVSb3dSYW5nZTogKHN0YXJ0Um93LCBlbmRSb3cpIC0+XG4gICAgW3Zpc2libGVTdGFydCwgdmlzaWJsZUVuZF0gPSBAZ2V0VmlzaWJsZVJvd1JhbmdlKClcbiAgICBub3QgKGVuZFJvdyA8PSB2aXNpYmxlU3RhcnQgb3IgdmlzaWJsZUVuZCA8PSBzdGFydFJvdylcblxuICBzZWxlY3Rpb25JbnRlcnNlY3RzVmlzaWJsZVJvd1JhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHtzdGFydCwgZW5kfSA9IHNlbGVjdGlvbi5nZXRTY3JlZW5SYW5nZSgpXG4gICAgQGludGVyc2VjdHNWaXNpYmxlUm93UmFuZ2Uoc3RhcnQucm93LCBlbmQucm93ICsgMSlcblxuICBzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb246IChwaXhlbFBvc2l0aW9uKSAtPlxuICAgIEBjb21wb25lbnQuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUG9zaXRpb24pXG5cbiAgcGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSkgLT5cbiAgICBAY29tcG9uZW50LnBpeGVsUmVjdEZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuXG4gIHBpeGVsUmFuZ2VGb3JTY3JlZW5SYW5nZTogKHNjcmVlblJhbmdlKSAtPlxuICAgIEBjb21wb25lbnQucGl4ZWxSYW5nZUZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuXG4gIHNldFdpZHRoOiAod2lkdGgpIC0+XG4gICAgQHN0eWxlLndpZHRoID0gKEBjb21wb25lbnQuZ2V0R3V0dGVyV2lkdGgoKSArIHdpZHRoKSArIFwicHhcIlxuXG4gIGdldFdpZHRoOiAtPlxuICAgIEBvZmZzZXRXaWR0aCAtIEBjb21wb25lbnQuZ2V0R3V0dGVyV2lkdGgoKVxuXG4gIHNldEhlaWdodDogKGhlaWdodCkgLT5cbiAgICBAc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgXCJweFwiXG5cbiAgZ2V0SGVpZ2h0OiAtPlxuICAgIEBvZmZzZXRIZWlnaHRcblxuICAjIEV4cGVyaW1lbnRhbDogSW52YWxpZGF0ZSB0aGUgcGFzc2VkIGJsb2NrIHtEZWNvcmF0aW9ufSBkaW1lbnNpb25zLCBmb3JjaW5nXG4gICMgdGhlbSB0byBiZSByZWNhbGN1bGF0ZWQgYW5kIHRoZSBzdXJyb3VuZGluZyBjb250ZW50IHRvIGJlIGFkanVzdGVkIG9uIHRoZVxuICAjIG5leHQgYW5pbWF0aW9uIGZyYW1lLlxuICAjXG4gICMgKiB7YmxvY2tEZWNvcmF0aW9ufSBBIHtEZWNvcmF0aW9ufSByZXByZXNlbnRpbmcgdGhlIGJsb2NrIGRlY29yYXRpb24geW91XG4gICMgd2FudCB0byB1cGRhdGUgdGhlIGRpbWVuc2lvbnMgb2YuXG4gIGludmFsaWRhdGVCbG9ja0RlY29yYXRpb25EaW1lbnNpb25zOiAtPlxuICAgIEBjb21wb25lbnQuaW52YWxpZGF0ZUJsb2NrRGVjb3JhdGlvbkRpbWVuc2lvbnMoYXJndW1lbnRzLi4uKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdhdG9tLXRleHQtZWRpdG9yJywgcHJvdG90eXBlOiBUZXh0RWRpdG9yRWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
