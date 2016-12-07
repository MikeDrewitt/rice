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
          relatedTarget: event.relatedTarget,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90ZXh0LWVkaXRvci1lbGVtZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkZBQUE7SUFBQTs7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1YsVUFBQSxHQUFhLE9BQUEsQ0FBUSxhQUFSOztFQUNiLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSx5QkFBUjs7RUFFaEI7Ozs7Ozs7Z0NBQ0osS0FBQSxHQUFPOztnQ0FDUCxtQkFBQSxHQUFxQjs7Z0NBQ3JCLFNBQUEsR0FBVzs7Z0NBQ1gsUUFBQSxHQUFVOztnQ0FDVixRQUFBLEdBQVU7O2dDQUNWLGFBQUEsR0FBZTs7Z0NBQ2YsaUJBQUEsR0FBbUI7O2dDQUNuQixvQkFBQSxHQUFzQjs7Z0NBQ3RCLFFBQUEsR0FBVTs7Z0NBRVYsZUFBQSxHQUFpQixTQUFBO01BRWYsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLENBQUM7TUFDZixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUksQ0FBQztNQUNsQixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksQ0FBQztNQUNmLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDO01BQ2QsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLENBQUM7TUFFZixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BRXJCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixPQUFsQixFQUEyQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQTNCO01BQ0EsSUFBQyxDQUFBLGdCQUFELENBQWtCLE1BQWxCLEVBQTBCLElBQUMs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R0FBcUMsU0FBQTtBQUNuQyxVQUFBO2FBQUEsUUFBQSxJQUFDLENBQUEsU0FBRCxDQUFVLENBQUMsbUNBQVgsYUFBK0MsU0FBL0M7SUFEbUM7Ozs7S0F2VFA7O0VBMFRoQyxNQUFNLENBQUMsT0FBUCxHQUFpQixpQkFBQSxHQUFvQixRQUFRLENBQUMsZUFBVCxDQUF5QixrQkFBekIsRUFBNkM7SUFBQSxTQUFBLEVBQVcsaUJBQWlCLENBQUMsU0FBN0I7R0FBN0M7QUEvVHJDIiwic291cmNlc0NvbnRlbnQiOlsiR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG57RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5UZXh0QnVmZmVyID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG5UZXh0RWRpdG9yQ29tcG9uZW50ID0gcmVxdWlyZSAnLi90ZXh0LWVkaXRvci1jb21wb25lbnQnXG5cbmNsYXNzIFRleHRFZGl0b3JFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgbW9kZWw6IG51bGxcbiAgY29tcG9uZW50RGVzY3JpcHRvcjogbnVsbFxuICBjb21wb25lbnQ6IG51bGxcbiAgYXR0YWNoZWQ6IGZhbHNlXG4gIHRpbGVTaXplOiBudWxsXG4gIGZvY3VzT25BdHRhY2g6IGZhbHNlXG4gIGhhc1RpbGVkUmVuZGVyaW5nOiB0cnVlXG4gIGxvZ2ljYWxEaXNwbGF5QnVmZmVyOiB0cnVlXG4gIGxpZ2h0RE9NOiB0cnVlXG5cbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgICMgVXNlIGdsb2JhbHMgd2hlbiB0aGUgZm9sbG93aW5nIGluc3RhbmNlIHZhcmlhYmxlcyBhcmVuJ3Qgc2V0LlxuICAgIEB0aGVtZXMgPSBhdG9tLnRoZW1lc1xuICAgIEB3b3Jrc3BhY2UgPSBhdG9tLndvcmtzcGFjZVxuICAgIEBhc3NlcnQgPSBhdG9tLmFzc2VydFxuICAgIEB2aWV3cyA9IGF0b20udmlld3NcbiAgICBAc3R5bGVzID0gYXRvbS5zdHlsZXNcblxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBAYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCBAZm9jdXNlZC5iaW5kKHRoaXMpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInLCBAYmx1cnJlZC5iaW5kKHRoaXMpXG5cbiAgICBAY2xhc3NMaXN0LmFkZCgnZWRpdG9yJylcbiAgICBAc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIC0xKVxuXG4gIGluaXRpYWxpemVDb250ZW50OiAoYXR0cmlidXRlcykgLT5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3NoYWRvd1Jvb3QnLCB7XG4gICAgICBnZXQ6ID0+XG4gICAgICAgIEdyaW0uZGVwcmVjYXRlKFwiXCJcIlxuICAgICAgICBUaGUgY29udGVudHMgb2YgYGF0b20tdGV4dC1lZGl0b3JgIGVsZW1lbnRzIGFyZSBubyBsb25nZXIgZW5jYXBzdWxhdGVkXG4gICAgICAgIHdpdGhpbiBhIHNoYWRvdyBET00gYm91bmRhcnkuIFBsZWFzZSwgc3RvcCB1c2luZyBgc2hhZG93Um9vdGAgYW5kIGFjY2Vzc1xuICAgICAgICB0aGUgZWRpdG9yIGNvbnRlbnRzIGRpcmVjdGx5IGluc3RlYWQuXG4gICAgICAgIFwiXCJcIilcbiAgICAgICAgdGhpc1xuICAgIH0pXG4gICAgQHJvb3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAcm9vdEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZWRpdG9yLS1wcml2YXRlJylcbiAgICBAYXBwZW5kQ2hpbGQoQHJvb3RFbGVtZW50KVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2s6IC0+XG4gICAgQGJ1aWxkTW9kZWwoKSB1bmxlc3MgQGdldE1vZGVsKCk/XG4gICAgQGFzc2VydChAbW9kZWwuaXNBbGl2ZSgpLCBcIkF0dGFjaGluZyBhIHZpZXcgZm9yIGEgZGVzdHJveWVkIGVkaXRvclwiKVxuICAgIEBtb3VudENvbXBvbmVudCgpIHVubGVzcyBAY29tcG9uZW50P1xuICAgIEBsaXN0ZW5Gb3JDb21wb25lbnRFdmVudHMoKVxuICAgIEBjb21wb25lbnQuY2hlY2tGb3JWaXNpYmlsaXR5Q2hhbmdlKClcbiAgICBpZiBAaGFzRm9jdXMoKVxuICAgICAgQGZvY3VzZWQoKVxuICAgIEBlbWl0dGVyLmVtaXQoXCJkaWQtYXR0YWNoXCIpXG5cbiAgZGV0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAdW5tb3VudENvbXBvbmVudCgpXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWl0dGVyLmVtaXQoXCJkaWQtZGV0YWNoXCIpXG5cbiAgbGlzdGVuRm9yQ29tcG9uZW50RXZlbnRzOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY29tcG9uZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsVG9wID0+XG4gICAgICBAZW1pdHRlci5lbWl0KFwiZGlkLWNoYW5nZS1zY3JvbGwtdG9wXCIsIGFyZ3VtZW50cy4uLilcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGNvbXBvbmVudC5vbkRpZENoYW5nZVNjcm9sbExlZnQgPT5cbiAgICAgIEBlbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLXNjcm9sbC1sZWZ0XCIsIGFyZ3VtZW50cy4uLilcblxuICBpbml0aWFsaXplOiAobW9kZWwsIHtAdmlld3MsIEB0aGVtZXMsIEB3b3Jrc3BhY2UsIEBhc3NlcnQsIEBzdHlsZXN9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIHZpZXdzIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBUZXh0RWRpdG9yRWxlbWVudHNcIikgdW5sZXNzIEB2aWV3cz9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSB0aGVtZXMgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQHRoZW1lcz9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSB3b3Jrc3BhY2UgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFRleHRFZGl0b3JFbGVtZW50c1wiKSB1bmxlc3MgQHdvcmtzcGFjZT9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYW4gYXNzZXJ0IHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBUZXh0RWRpdG9yRWxlbWVudHNcIikgdW5sZXNzIEBhc3NlcnQ/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgc3R5bGVzIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBUZXh0RWRpdG9yRWxlbWVudHNcIikgdW5sZXNzIEBzdHlsZXM/XG5cbiAgICBAc2V0TW9kZWwobW9kZWwpXG4gICAgdGhpc1xuXG4gIHNldE1vZGVsOiAobW9kZWwpIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZWwgYWxyZWFkeSBhc3NpZ25lZCBvbiBUZXh0RWRpdG9yRWxlbWVudFwiKSBpZiBAbW9kZWw/XG4gICAgcmV0dXJuIGlmIG1vZGVsLmlzRGVzdHJveWVkKClcblxuICAgIEBtb2RlbCA9IG1vZGVsXG4gICAgQG1vZGVsLnNldFVwZGF0ZWRTeW5jaHJvbm91c2x5KEBpc1VwZGF0ZWRTeW5jaHJvbm91c2x5KCkpXG4gICAgQGluaXRpYWxpemVDb250ZW50KClcbiAgICBAbW91bnRDb21wb25lbnQoKVxuICAgIEBhZGRHcmFtbWFyU2NvcGVBdHRyaWJ1dGUoKVxuICAgIEBhZGRNaW5pQXR0cmlidXRlKCkgaWYgQG1vZGVsLmlzTWluaSgpXG4gICAgQGFkZEVuY29kaW5nQXR0cmlidXRlKClcbiAgICBAbW9kZWwub25EaWRDaGFuZ2VHcmFtbWFyID0+IEBhZGRHcmFtbWFyU2NvcGVBdHRyaWJ1dGUoKVxuICAgIEBtb2RlbC5vbkRpZENoYW5nZUVuY29kaW5nID0+IEBhZGRFbmNvZGluZ0F0dHJpYnV0ZSgpXG4gICAgQG1vZGVsLm9uRGlkRGVzdHJveSA9PiBAdW5tb3VudENvbXBvbmVudCgpXG4gICAgQG1vZGVsLm9uRGlkQ2hhbmdlTWluaSAobWluaSkgPT4gaWYgbWluaSB0aGVuIEBhZGRNaW5pQXR0cmlidXRlKCkgZWxzZSBAcmVtb3ZlTWluaUF0dHJpYnV0ZSgpXG4gICAgQG1vZGVsXG5cbiAgZ2V0TW9kZWw6IC0+XG4gICAgQG1vZGVsID8gQGJ1aWxkTW9kZWwoKVxuXG4gIGJ1aWxkTW9kZWw6IC0+XG4gICAgQHNldE1vZGVsKEB3b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKFxuICAgICAgYnVmZmVyOiBuZXcgVGV4dEJ1ZmZlcihAdGV4dENvbnRlbnQpXG4gICAgICBzb2Z0V3JhcHBlZDogZmFsc2VcbiAgICAgIHRhYkxlbmd0aDogMlxuICAgICAgc29mdFRhYnM6IHRydWVcbiAgICAgIG1pbmk6IEBoYXNBdHRyaWJ1dGUoJ21pbmknKVxuICAgICAgbGluZU51bWJlckd1dHRlclZpc2libGU6IG5vdCBAaGFzQXR0cmlidXRlKCdndXR0ZXItaGlkZGVuJylcbiAgICAgIHBsYWNlaG9sZGVyVGV4dDogQGdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXItdGV4dCcpXG4gICAgKSlcblxuICBtb3VudENvbXBvbmVudDogLT5cbiAgICBAY29tcG9uZW50ID0gbmV3IFRleHRFZGl0b3JDb21wb25lbnQoXG4gICAgICBob3N0RWxlbWVudDogdGhpc1xuICAgICAgZWRpdG9yOiBAbW9kZWxcbiAgICAgIHRpbGVTaXplOiBAdGlsZVNpemVcbiAgICAgIHZpZXdzOiBAdmlld3NcbiAgICAgIHRoZW1lczogQHRoZW1lc1xuICAgICAgc3R5bGVzOiBAc3R5bGVzXG4gICAgICB3b3Jrc3BhY2U6IEB3b3Jrc3BhY2VcbiAgICAgIGFzc2VydDogQGFzc2VydFxuICAgIClcbiAgICBAcm9vdEVsZW1lbnQuYXBwZW5kQ2hpbGQoQGNvbXBvbmVudC5nZXREb21Ob2RlKCkpXG4gICAgaW5wdXROb2RlID0gQGNvbXBvbmVudC5oaWRkZW5JbnB1dENvbXBvbmVudC5nZXREb21Ob2RlKClcbiAgICBpbnB1dE5vZGUuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCBAZm9jdXNlZC5iaW5kKHRoaXMpXG4gICAgaW5wdXROb2RlLmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInLCBAaW5wdXROb2RlQmx1cnJlZC5iaW5kKHRoaXMpXG5cbiAgdW5tb3VudENvbXBvbmVudDogLT5cbiAgICBpZiBAY29tcG9uZW50P1xuICAgICAgQGNvbXBvbmVudC5kZXN0cm95KClcbiAgICAgIEBjb21wb25lbnQuZ2V0RG9tTm9kZSgpLnJlbW92ZSgpXG4gICAgICBAY29tcG9uZW50ID0gbnVsbFxuXG4gIGZvY3VzZWQ6IChldmVudCkgLT5cbiAgICBAY29tcG9uZW50Py5mb2N1c2VkKClcblxuICBibHVycmVkOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQucmVsYXRlZFRhcmdldCBpcyBAY29tcG9uZW50Py5oaWRkZW5JbnB1dENvbXBvbmVudC5nZXREb21Ob2RlKClcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICByZXR1cm5cbiAgICBAY29tcG9uZW50Py5ibHVycmVkKClcblxuICBpbnB1dE5vZGVCbHVycmVkOiAoZXZlbnQpIC0+XG4gICAgaWYgZXZlbnQucmVsYXRlZFRhcmdldCBpc250IHRoaXNcbiAgICAgIEBkaXNwYXRjaEV2ZW50KG5ldyBGb2N1c0V2ZW50KCdibHVyJywgcmVsYXRlZFRhcmdldDogZXZlbnQucmVsYXRlZFRhcmdldCwgYnViYmxlczogZmFsc2UpKVxuXG4gIGFkZEdyYW1tYXJTY29wZUF0dHJpYnV0ZTogLT5cbiAgICBAZGF0YXNldC5ncmFtbWFyID0gQG1vZGVsLmdldEdyYW1tYXIoKT8uc2NvcGVOYW1lPy5yZXBsYWNlKC9cXC4vZywgJyAnKVxuXG4gIGFkZE1pbmlBdHRyaWJ1dGU6IC0+XG4gICAgQHNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwibWluaVwiKSlcblxuICByZW1vdmVNaW5pQXR0cmlidXRlOiAtPlxuICAgIEByZW1vdmVBdHRyaWJ1dGUoXCJtaW5pXCIpXG5cbiAgYWRkRW5jb2RpbmdBdHRyaWJ1dGU6IC0+XG4gICAgQGRhdGFzZXQuZW5jb2RpbmcgPSBAbW9kZWwuZ2V0RW5jb2RpbmcoKVxuXG4gIGhhc0ZvY3VzOiAtPlxuICAgIHRoaXMgaXMgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBvciBAY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcblxuICBzZXRVcGRhdGVkU3luY2hyb25vdXNseTogKEB1cGRhdGVkU3luY2hyb25vdXNseSkgLT5cbiAgICBAbW9kZWw/LnNldFVwZGF0ZWRTeW5jaHJvbm91c2x5KEB1cGRhdGVkU3luY2hyb25vdXNseSlcbiAgICBAdXBkYXRlZFN5bmNocm9ub3VzbHlcblxuICBpc1VwZGF0ZWRTeW5jaHJvbm91c2x5OiAtPiBAdXBkYXRlZFN5bmNocm9ub3VzbHlcblxuICAjIEV4dGVuZGVkOiBDb250aW51b3VzbHkgcmVmbG93cyBsaW5lcyBhbmQgbGluZSBudW1iZXJzLiAoSGFzIHBlcmZvcm1hbmNlIG92ZXJoZWFkKVxuICAjXG4gICMgKiBgY29udGludW91c1JlZmxvd2AgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGtlZXAgcmVmbG93aW5nIG9yIG5vdC5cbiAgc2V0Q29udGludW91c1JlZmxvdzogKGNvbnRpbnVvdXNSZWZsb3cpIC0+XG4gICAgQGNvbXBvbmVudD8uc2V0Q29udGludW91c1JlZmxvdyhjb250aW51b3VzUmVmbG93KVxuXG4gICMgRXh0ZW5kZWQ6IGdldCB0aGUgd2lkdGggb2YgYSBjaGFyYWN0ZXIgb2YgdGV4dCBkaXNwbGF5ZWQgaW4gdGhpcyBlbGVtZW50LlxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9IG9mIHBpeGVscy5cbiAgZ2V0RGVmYXVsdENoYXJhY3RlcldpZHRoOiAtPlxuICAgIEBnZXRNb2RlbCgpLmdldERlZmF1bHRDaGFyV2lkdGgoKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUgbWF4aW11bSBzY3JvbGwgdG9wIHRoYXQgY2FuIGJlIGFwcGxpZWQgdG8gdGhpcyBlbGVtZW50LlxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9IG9mIHBpeGVscy5cbiAgZ2V0TWF4U2Nyb2xsVG9wOiAtPlxuICAgIEBjb21wb25lbnQ/LmdldE1heFNjcm9sbFRvcCgpXG5cbiAgIyBFeHRlbmRlZDogQ29udmVydHMgYSBidWZmZXIgcG9zaXRpb24gdG8gYSBwaXhlbCBwb3NpdGlvbi5cbiAgI1xuICAjICogYGJ1ZmZlclBvc2l0aW9uYCBBbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYnVmZmVyIHBvc2l0aW9uLiBJdCBjYW4gYmUgZWl0aGVyXG4gICMgICBhbiB7T2JqZWN0fSAoYHtyb3csIGNvbHVtbn1gKSwge0FycmF5fSAoYFtyb3csIGNvbHVtbl1gKSwgb3Ige1BvaW50fVxuICAjXG4gICMgUmV0dXJucyBhbiB7T2JqZWN0fSB3aXRoIHR3byB2YWx1ZXM6IGB0b3BgIGFuZCBgbGVmdGAsIHJlcHJlc2VudGluZyB0aGUgcGl4ZWwgcG9zaXRpb24uXG4gIHBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbjogKGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIEBjb21wb25lbnQucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKVxuXG4gICMgRXh0ZW5kZWQ6IENvbnZlcnRzIGEgc2NyZWVuIHBvc2l0aW9uIHRvIGEgcGl4ZWwgcG9zaXRpb24uXG4gICNcbiAgIyAqIGBzY3JlZW5Qb3NpdGlvbmAgQW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIHNjcmVlbiBwb3NpdGlvbi4gSXQgY2FuIGJlIGVpdGhlclxuICAjICAgYW4ge09iamVjdH0gKGB7cm93LCBjb2x1bW59YCksIHtBcnJheX0gKGBbcm93LCBjb2x1bW5dYCksIG9yIHtQb2ludH1cbiAgI1xuICAjIFJldHVybnMgYW4ge09iamVjdH0gd2l0aCB0d28gdmFsdWVzOiBgdG9wYCBhbmQgYGxlZnRgLCByZXByZXNlbnRpbmcgdGhlIHBpeGVsIHBvc2l0aW9ucy5cbiAgcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24pIC0+XG4gICAgQGNvbXBvbmVudC5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24pXG5cbiAgIyBFeHRlbmRlZDogUmV0cmlldmVzIHRoZSBudW1iZXIgb2YgdGhlIHJvdyB0aGF0IGlzIHZpc2libGUgYW5kIGN1cnJlbnRseSBhdCB0aGVcbiAgIyB0b3Agb2YgdGhlIGVkaXRvci5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93OiAtPlxuICAgIEBnZXRWaXNpYmxlUm93UmFuZ2UoKVswXVxuXG4gICMgRXh0ZW5kZWQ6IFJldHJpZXZlcyB0aGUgbnVtYmVyIG9mIHRoZSByb3cgdGhhdCBpcyB2aXNpYmxlIGFuZCBjdXJyZW50bHkgYXQgdGhlXG4gICMgYm90dG9tIG9mIHRoZSBlZGl0b3IuXG4gICNcbiAgIyBSZXR1cm5zIGEge051bWJlcn0uXG4gIGdldExhc3RWaXNpYmxlU2NyZWVuUm93OiAtPlxuICAgIEBnZXRWaXNpYmxlUm93UmFuZ2UoKVsxXVxuXG4gICMgRXh0ZW5kZWQ6IGNhbGwgdGhlIGdpdmVuIGBjYWxsYmFja2Agd2hlbiB0aGUgZWRpdG9yIGlzIGF0dGFjaGVkIHRvIHRoZSBET00uXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICBvbkRpZEF0dGFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKFwiZGlkLWF0dGFjaFwiLCBjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBjYWxsIHRoZSBnaXZlbiBgY2FsbGJhY2tgIHdoZW4gdGhlIGVkaXRvciBpcyBkZXRhY2hlZCBmcm9tIHRoZSBET00uXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufVxuICBvbkRpZERldGFjaDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKFwiZGlkLWRldGFjaFwiLCBjYWxsYmFjaylcblxuICBvbkRpZENoYW5nZVNjcm9sbFRvcDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKFwiZGlkLWNoYW5nZS1zY3JvbGwtdG9wXCIsIGNhbGxiYWNrKVxuXG4gIG9uRGlkQ2hhbmdlU2Nyb2xsTGVmdDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uKFwiZGlkLWNoYW5nZS1zY3JvbGwtbGVmdFwiLCBjYWxsYmFjaylcblxuICBzZXRTY3JvbGxMZWZ0OiAoc2Nyb2xsTGVmdCkgLT5cbiAgICBAY29tcG9uZW50LnNldFNjcm9sbExlZnQoc2Nyb2xsTGVmdClcblxuICBzZXRTY3JvbGxSaWdodDogKHNjcm9sbFJpZ2h0KSAtPlxuICAgIEBjb21wb25lbnQuc2V0U2Nyb2xsUmlnaHQoc2Nyb2xsUmlnaHQpXG5cbiAgc2V0U2Nyb2xsVG9wOiAoc2Nyb2xsVG9wKSAtPlxuICAgIEBjb21wb25lbnQuc2V0U2Nyb2xsVG9wKHNjcm9sbFRvcClcblxuICBzZXRTY3JvbGxCb3R0b206IChzY3JvbGxCb3R0b20pIC0+XG4gICAgQGNvbXBvbmVudC5zZXRTY3JvbGxCb3R0b20oc2Nyb2xsQm90dG9tKVxuXG4gICMgRXNzZW50aWFsOiBTY3JvbGxzIHRoZSBlZGl0b3IgdG8gdGhlIHRvcFxuICBzY3JvbGxUb1RvcDogLT5cbiAgICBAc2V0U2Nyb2xsVG9wKDApXG5cbiAgIyBFc3NlbnRpYWw6IFNjcm9sbHMgdGhlIGVkaXRvciB0byB0aGUgYm90dG9tXG4gIHNjcm9sbFRvQm90dG9tOiAtPlxuICAgIEBzZXRTY3JvbGxCb3R0b20oSW5maW5pdHkpXG5cbiAgZ2V0U2Nyb2xsVG9wOiAtPlxuICAgIEBjb21wb25lbnQ/LmdldFNjcm9sbFRvcCgpIG9yIDBcblxuICBnZXRTY3JvbGxMZWZ0OiAtPlxuICAgIEBjb21wb25lbnQ/LmdldFNjcm9sbExlZnQoKSBvciAwXG5cbiAgZ2V0U2Nyb2xsUmlnaHQ6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsUmlnaHQoKSBvciAwXG5cbiAgZ2V0U2Nyb2xsQm90dG9tOiAtPlxuICAgIEBjb21wb25lbnQ/LmdldFNjcm9sbEJvdHRvbSgpIG9yIDBcblxuICBnZXRTY3JvbGxIZWlnaHQ6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0U2Nyb2xsSGVpZ2h0KCkgb3IgMFxuXG4gIGdldFNjcm9sbFdpZHRoOiAtPlxuICAgIEBjb21wb25lbnQ/LmdldFNjcm9sbFdpZHRoKCkgb3IgMFxuXG4gIGdldFZlcnRpY2FsU2Nyb2xsYmFyV2lkdGg6IC0+XG4gICAgQGNvbXBvbmVudD8uZ2V0VmVydGljYWxTY3JvbGxiYXJXaWR0aCgpIG9yIDBcblxuICBnZXRIb3Jpem9udGFsU2Nyb2xsYmFySGVpZ2h0OiAtPlxuICAgIEBjb21wb25lbnQ/LmdldEhvcml6b250YWxTY3JvbGxiYXJIZWlnaHQoKSBvciAwXG5cbiAgZ2V0VmlzaWJsZVJvd1JhbmdlOiAtPlxuICAgIEBjb21wb25lbnQ/LmdldFZpc2libGVSb3dSYW5nZSgpIG9yIFswLCAwXVxuXG4gIGludGVyc2VjdHNWaXNpYmxlUm93UmFuZ2U6IChzdGFydFJvdywgZW5kUm93KSAtPlxuICAgIFt2aXNpYmxlU3RhcnQsIHZpc2libGVFbmRdID0gQGdldFZpc2libGVSb3dSYW5nZSgpXG4gICAgbm90IChlbmRSb3cgPD0gdmlzaWJsZVN0YXJ0IG9yIHZpc2libGVFbmQgPD0gc3RhcnRSb3cpXG5cbiAgc2VsZWN0aW9uSW50ZXJzZWN0c1Zpc2libGVSb3dSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICB7c3RhcnQsIGVuZH0gPSBzZWxlY3Rpb24uZ2V0U2NyZWVuUmFuZ2UoKVxuICAgIEBpbnRlcnNlY3RzVmlzaWJsZVJvd1JhbmdlKHN0YXJ0LnJvdywgZW5kLnJvdyArIDEpXG5cbiAgc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uOiAocGl4ZWxQb3NpdGlvbikgLT5cbiAgICBAY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFBvc2l0aW9uKVxuXG4gIHBpeGVsUmVjdEZvclNjcmVlblJhbmdlOiAoc2NyZWVuUmFuZ2UpIC0+XG4gICAgQGNvbXBvbmVudC5waXhlbFJlY3RGb3JTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSlcblxuICBwaXhlbFJhbmdlRm9yU2NyZWVuUmFuZ2U6IChzY3JlZW5SYW5nZSkgLT5cbiAgICBAY29tcG9uZW50LnBpeGVsUmFuZ2VGb3JTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSlcblxuICBzZXRXaWR0aDogKHdpZHRoKSAtPlxuICAgIEBzdHlsZS53aWR0aCA9IChAY29tcG9uZW50LmdldEd1dHRlcldpZHRoKCkgKyB3aWR0aCkgKyBcInB4XCJcblxuICBnZXRXaWR0aDogLT5cbiAgICBAb2Zmc2V0V2lkdGggLSBAY29tcG9uZW50LmdldEd1dHRlcldpZHRoKClcblxuICBzZXRIZWlnaHQ6IChoZWlnaHQpIC0+XG4gICAgQHN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIlxuXG4gIGdldEhlaWdodDogLT5cbiAgICBAb2Zmc2V0SGVpZ2h0XG5cbiAgIyBFeHBlcmltZW50YWw6IEludmFsaWRhdGUgdGhlIHBhc3NlZCBibG9jayB7RGVjb3JhdGlvbn0gZGltZW5zaW9ucywgZm9yY2luZ1xuICAjIHRoZW0gdG8gYmUgcmVjYWxjdWxhdGVkIGFuZCB0aGUgc3Vycm91bmRpbmcgY29udGVudCB0byBiZSBhZGp1c3RlZCBvbiB0aGVcbiAgIyBuZXh0IGFuaW1hdGlvbiBmcmFtZS5cbiAgI1xuICAjICoge2Jsb2NrRGVjb3JhdGlvbn0gQSB7RGVjb3JhdGlvbn0gcmVwcmVzZW50aW5nIHRoZSBibG9jayBkZWNvcmF0aW9uIHlvdVxuICAjIHdhbnQgdG8gdXBkYXRlIHRoZSBkaW1lbnNpb25zIG9mLlxuICBpbnZhbGlkYXRlQmxvY2tEZWNvcmF0aW9uRGltZW5zaW9uczogLT5cbiAgICBAY29tcG9uZW50LmludmFsaWRhdGVCbG9ja0RlY29yYXRpb25EaW1lbnNpb25zKGFyZ3VtZW50cy4uLilcblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0RWRpdG9yRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCAnYXRvbS10ZXh0LWVkaXRvcicsIHByb3RvdHlwZTogVGV4dEVkaXRvckVsZW1lbnQucHJvdG90eXBlXG4iXX0=
