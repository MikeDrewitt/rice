(function() {
  var $, CompositeDisposable, Emitter, ImageEditorView, ScrollView, fs, ref, ref1,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, ScrollView = ref.ScrollView;

  ref1 = require('atom'), Emitter = ref1.Emitter, CompositeDisposable = ref1.CompositeDisposable;

  module.exports = ImageEditorView = (function(superClass) {
    extend(ImageEditorView, superClass);

    function ImageEditorView() {
      return ImageEditorView.__super__.constructor.apply(this, arguments);
    }

    ImageEditorView.content = function() {
      return this.div({
        "class": 'image-view',
        tabindex: -1
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'image-controls',
            outlet: 'imageControls'
          }, function() {
            _this.div({
              "class": 'image-controls-group'
            }, function() {
              _this.a({
                outlet: 'whiteTransparentBackgroundButton',
                "class": 'image-controls-color-white',
                value: 'white'
              }, function() {
                return _this.text('white');
              });
              _this.a({
                outlet: 'blackTransparentBackgroundButton',
                "class": 'image-controls-color-black',
                value: 'black'
              }, function() {
                return _this.text('black');
              });
              return _this.a({
                outlet: 'transparentTransparentBackgroundButton',
                "class": 'image-controls-color-transparent',
                value: 'transparent'
              }, function() {
                return _this.text('transparent');
              });
            });
            _this.div({
              "class": 'image-controls-group btn-group'
            }, function() {
              _this.button({
                "class": 'btn',
                outlet: 'zoomOutButton'
              }, '-');
              _this.button({
                "class": 'btn reset-zoom-button',
                outlet: 'resetZoomButton'
              }, '100%');
              return _this.button({
                "class": 'btn',
                outlet: 'zoomInButton'
              }, '+');
            });
            return _this.div({
              "class": 'image-controls-group btn-group'
            }, function() {
              return _this.button({
                "class": 'btn',
                outlet: 'zoomToFitButton'
              }, 'Zoom to fit');
            });
          });
          return _this.div({
            "class": 'image-container',
            background: 'white',
            outlet: 'imageContainer'
          }, function() {
            return _this.img({
              outlet: 'image'
            });
          });
        };
      })(this));
    };

    ImageEditorView.prototype.initialize = function(editor) {
      this.editor = editor;
      ImageEditorView.__super__.initialize.apply(this, arguments);
      this.emitter = new Emitter;
      return this.imageSize = fs.statSync(this.editor.getPath())["size"];
    };

    ImageEditorView.prototype.attached = function() {
      this.disposables = new CompositeDisposable;
      this.loaded = false;
      this.mode = 'reset-zoom';
      this.image.hide();
      this.updateImageURI();
      this.disposables.add(this.editor.onDidChange((function(_this) {
        return function() {
          return _this.updateImageURI();
        };
      })(this)));
      this.disposables.add(atom.commands.add(this.element, {
        'image-view:reload': (function(_this) {
          return function() {
            return _this.updateImageURI();
          };
        })(this),
        'image-view:zoom-in': (function(_this) {
          return function() {
            return _this.zoomIn();
          };
        })(this),
        'image-view:zoom-out': (function(_this) {
          return function() {
            return _this.zoomOut();
          };
        })(this),
        'image-view:zoom-to-fit': (function(_this) {
          return function() {
            return _this.zoomToFit();
          };
        })(this),
        'image-view:reset-zoom': (function(_this) {
          return function() {
            return _this.resetZoom();
          };
        })(this)
      }));
      this.image.load((function(_this) {
        return function() {
          _this.originalHeight = _this.image.prop('naturalHeight');
          _this.originalWidth = _this.image.prop('naturalWidth');
          _this.loaded = true;
          _this.image.show();
          return _this.emitter.emit('did-load');
        };
      })(this));
      this.disposables.add(atom.tooltips.add(this.whiteTransparentBackgroundButton[0], {
        title: "Use white transparent background"
      }));
      this.disposables.add(atom.tooltips.add(this.blackTransparentBackgroundButton[0], {
        title: "Use black transparent background"
      }));
      this.disposables.add(atom.tooltips.add(this.transparentTransparentBackgroundButton[0], {
        title: "Use transparent background"
      }));
      if (this.getPane()) {
        this.imageControls.find('a').on('click', (function(_this) {
          return function(e) {
            return _this.changeBackground($(e.target).attr('value'));
          };
        })(this));
      }
      this.zoomInButton.on('click', (function(_this) {
        return function() {
          return _this.zoomIn();
        };
      })(this));
      this.zoomOutButton.on('click', (function(_this) {
        return function() {
          return _this.zoomOut();
        };
      })(this));
      this.resetZoomButton.on('click', (function(_this) {
        return function() {
          return _this.resetZoom();
        };
      })(this));
      return this.zoomToFitButton.on('click', (function(_this) {
        return function() {
          return _this.zoomToFit();
        };
      })(this));
    };

    ImageEditorView.prototype.onDidLoad = function(callback) {
      return this.emitter.on('did-load', callback);
    };

    ImageEditorView.prototype.detached = function() {
      return this.disposables.dispose();
    };

    ImageEditorView.prototype.updateImageURI = function() {
      return this.image.attr('src', (this.editor.getEncodedURI()) + "?time=" + (Date.now()));
    };

    ImageEditorView.prototype.getPane = function() {
      return this.parents('.pane')[0];
    };

    ImageEditorView.prototype.zoomOut = function() {
      return this.adjustSize(0.75);
    };

    ImageEditorView.prototype.zoomIn = function() {
      return this.adjustSize(1.25);
    };

    ImageEditorView.prototype.resetZoom = function() {
      if (!(this.loaded && this.isVisible())) {
        return;
      }
      this.mode = 'reset-zoom';
      this.imageContainer.removeClass('zoom-to-fit');
      this.zoomToFitButton.removeClass('selected');
      this.image.width(this.originalWidth);
      this.image.height(this.originalHeight);
      return this.resetZoomButton.text('100%');
    };

    ImageEditorView.prototype.zoomToFit = function() {
      if (!(this.loaded && this.isVisible())) {
        return;
      }
      this.mode = 'zoom-to-fit';
      this.imageContainer.addClass('zoom-to-fit');
      this.zoomToFitButton.addClass('selected');
      this.image.width('');
      this.image.height('');
      return this.resetZoomButton.text('Auto');
    };

    ImageEditorView.prototype.adjustSize = function(factor) {
      var newHeight, newWidth, percent;
      if (!(this.loaded && this.isVisible())) {
        return;
      }
      if (this.mode === 'zoom-to-fit') {
        this.mode = 'zoom-manual';
        this.imageContainer.removeClass('zoom-to-fit');
        this.zoomToFitButton.removeClass('selected');
      } else if (this.mode === 'reset-zoom') {
        this.mode = 'zoom-manual';
      }
      newWidth = this.image.width() * factor;
      newHeight = this.image.height() * factor;
      percent = Math.max(1, Math.round(newWidth / this.originalWidth * 100));
      if (newWidth > this.originalWidth * 2) {
        this.image.css('image-rendering', 'pixelated');
      } else {
        this.image.css('image-rendering', '');
      }
      this.image.width(newWidth);
      this.image.height(newHeight);
      return this.resetZoomButton.text(percent + '%');
    };

    ImageEditorView.prototype.changeBackground = function(color) {
      if (!(this.loaded && this.isVisible() && color)) {
        return;
      }
      return this.imageContainer.attr('background', color);
    };

    return ImageEditorView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9pbWFnZS12aWV3L2xpYi9pbWFnZS1lZGl0b3Itdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJFQUFBO0lBQUE7OztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxNQUFrQixPQUFBLENBQVEsc0JBQVIsQ0FBbEIsRUFBQyxTQUFELEVBQUk7O0VBQ0osT0FBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyxzQkFBRCxFQUFVOztFQUdWLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixlQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO1FBQXFCLFFBQUEsRUFBVSxDQUFDLENBQWhDO09BQUwsRUFBd0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3RDLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdCQUFQO1lBQXlCLE1BQUEsRUFBUSxlQUFqQztXQUFMLEVBQXVELFNBQUE7WUFDckQsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sc0JBQVA7YUFBTCxFQUFvQyxTQUFBO2NBQ2xDLEtBQUMsQ0FBQSxDQUFELENBQUc7Z0JBQUEsTUFBQSxFQUFRLGtDQUFSO2dCQUE0QyxDQUFBLEtBQUEsQ0FBQSxFQUFPLDRCQUFuRDtnQkFBaUYsS0FBQSxFQUFPLE9BQXhGO2VBQUgsRUFBb0csU0FBQTt1QkFDbEcsS0FBQyxDQUFBLElBQUQsQ0FBTSxPQUFOO2NBRGtHLENBQXBHO2NBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRztnQkFBQSxNQUFBLEVBQVEs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R0FBaUI7TUFDNUIsU0FBQSxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFBLENBQUEsR0FBa0I7TUFDOUIsT0FBQSxHQUFVLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLElBQUksQ0FBQyxLQUFMLENBQVcsUUFBQSxHQUFTLElBQUMsQ0FBQSxhQUFWLEdBQXdCLEdBQW5DLENBQVo7TUFHVixJQUFHLFFBQUEsR0FBVyxJQUFDLENBQUEsYUFBRCxHQUFlLENBQTdCO1FBQ0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsaUJBQVgsRUFBOEIsV0FBOUIsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQVAsQ0FBVyxpQkFBWCxFQUE4QixFQUE5QixFQUhGOztNQUtBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFhLFFBQWI7TUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsQ0FBYyxTQUFkO2FBQ0EsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixPQUFBLEdBQVUsR0FBaEM7SUF0QlU7OzhCQTJCWixnQkFBQSxHQUFrQixTQUFDLEtBQUQ7TUFDaEIsSUFBQSxDQUFBLENBQWMsSUFBQyxDQUFBLE1BQUQsSUFBWSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQVosSUFBNkIsS0FBM0MsQ0FBQTtBQUFBLGVBQUE7O2FBQ0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixZQUFyQixFQUFtQyxLQUFuQztJQUZnQjs7OztLQXpJVTtBQU45QiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnskLCBTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuIyBWaWV3IHRoYXQgcmVuZGVycyB0aGUgaW1hZ2Ugb2YgYW4ge0ltYWdlRWRpdG9yfS5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEltYWdlRWRpdG9yVmlldyBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ2ltYWdlLXZpZXcnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICBAZGl2IGNsYXNzOiAnaW1hZ2UtY29udHJvbHMnLCBvdXRsZXQ6ICdpbWFnZUNvbnRyb2xzJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ2ltYWdlLWNvbnRyb2xzLWdyb3VwJywgPT5cbiAgICAgICAgICBAYSBvdXRsZXQ6ICd3aGl0ZVRyYW5zcGFyZW50QmFja2dyb3VuZEJ1dHRvbicsIGNsYXNzOiAnaW1hZ2UtY29udHJvbHMtY29sb3Itd2hpdGUnLCB2YWx1ZTogJ3doaXRlJywgPT5cbiAgICAgICAgICAgIEB0ZXh0ICd3aGl0ZSdcbiAgICAgICAgICBAYSBvdXRsZXQ6ICdibGFja1RyYW5zcGFyZW50QmFja2dyb3VuZEJ1dHRvbicsIGNsYXNzOiAnaW1hZ2UtY29udHJvbHMtY29sb3ItYmxhY2snLCB2YWx1ZTogJ2JsYWNrJywgPT5cbiAgICAgICAgICAgIEB0ZXh0ICdibGFjaydcbiAgICAgICAgICBAYSBvdXRsZXQ6ICd0cmFuc3BhcmVudFRyYW5zcGFyZW50QmFja2dyb3VuZEJ1dHRvbicsIGNsYXNzOiAnaW1hZ2UtY29udHJvbHMtY29sb3ItdHJhbnNwYXJlbnQnLCB2YWx1ZTogJ3RyYW5zcGFyZW50JywgPT5cbiAgICAgICAgICAgIEB0ZXh0ICd0cmFuc3BhcmVudCdcbiAgICAgICAgQGRpdiBjbGFzczogJ2ltYWdlLWNvbnRyb2xzLWdyb3VwIGJ0bi1ncm91cCcsID0+XG4gICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0bicsIG91dGxldDogJ3pvb21PdXRCdXR0b24nLCAnLSdcbiAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIHJlc2V0LXpvb20tYnV0dG9uJywgb3V0bGV0OiAncmVzZXRab29tQnV0dG9uJywgJzEwMCUnXG4gICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0bicsIG91dGxldDogJ3pvb21JbkJ1dHRvbicsICcrJ1xuICAgICAgICBAZGl2IGNsYXNzOiAnaW1hZ2UtY29udHJvbHMtZ3JvdXAgYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuJywgb3V0bGV0OiAnem9vbVRvRml0QnV0dG9uJywgJ1pvb20gdG8gZml0J1xuXG4gICAgICBAZGl2IGNsYXNzOiAnaW1hZ2UtY29udGFpbmVyJywgYmFja2dyb3VuZDogJ3doaXRlJywgb3V0bGV0OiAnaW1hZ2VDb250YWluZXInLCA9PlxuICAgICAgICBAaW1nIG91dGxldDogJ2ltYWdlJ1xuXG4gIGluaXRpYWxpemU6IChAZWRpdG9yKSAtPlxuICAgIHN1cGVyXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBpbWFnZVNpemUgPSBmcy5zdGF0U3luYyhAZWRpdG9yLmdldFBhdGgoKSlbXCJzaXplXCJdXG5cbiAgYXR0YWNoZWQ6IC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBsb2FkZWQgPSBmYWxzZVxuICAgIEBtb2RlID0gJ3Jlc2V0LXpvb20nXG4gICAgQGltYWdlLmhpZGUoKVxuICAgIEB1cGRhdGVJbWFnZVVSSSgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2UgPT4gQHVwZGF0ZUltYWdlVVJJKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LFxuICAgICAgJ2ltYWdlLXZpZXc6cmVsb2FkJzogPT4gQHVwZGF0ZUltYWdlVVJJKClcbiAgICAgICdpbWFnZS12aWV3Onpvb20taW4nOiA9PiBAem9vbUluKClcbiAgICAgICdpbWFnZS12aWV3Onpvb20tb3V0JzogPT4gQHpvb21PdXQoKVxuICAgICAgJ2ltYWdlLXZpZXc6em9vbS10by1maXQnOiA9PiBAem9vbVRvRml0KClcbiAgICAgICdpbWFnZS12aWV3OnJlc2V0LXpvb20nOiA9PiBAcmVzZXRab29tKClcblxuICAgIEBpbWFnZS5sb2FkID0+XG4gICAgICBAb3JpZ2luYWxIZWlnaHQgPSBAaW1hZ2UucHJvcCgnbmF0dXJhbEhlaWdodCcpXG4gICAgICBAb3JpZ2luYWxXaWR0aCA9IEBpbWFnZS5wcm9wKCduYXR1cmFsV2lkdGgnKVxuICAgICAgQGxvYWRlZCA9IHRydWVcbiAgICAgIEBpbWFnZS5zaG93KClcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1sb2FkJ1xuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAd2hpdGVUcmFuc3BhcmVudEJhY2tncm91bmRCdXR0b25bMF0sIHRpdGxlOiBcIlVzZSB3aGl0ZSB0cmFuc3BhcmVudCBiYWNrZ3JvdW5kXCJcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBibGFja1RyYW5zcGFyZW50QmFja2dyb3VuZEJ1dHRvblswXSwgdGl0bGU6IFwiVXNlIGJsYWNrIHRyYW5zcGFyZW50IGJhY2tncm91bmRcIlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHRyYW5zcGFyZW50VHJhbnNwYXJlbnRCYWNrZ3JvdW5kQnV0dG9uWzBdLCB0aXRsZTogXCJVc2UgdHJhbnNwYXJlbnQgYmFja2dyb3VuZFwiXG5cbiAgICBpZiBAZ2V0UGFuZSgpXG4gICAgICBAaW1hZ2VDb250cm9scy5maW5kKCdhJykub24gJ2NsaWNrJywgKGUpID0+XG4gICAgICAgIEBjaGFuZ2VCYWNrZ3JvdW5kICQoZS50YXJnZXQpLmF0dHIgJ3ZhbHVlJ1xuXG4gICAgQHpvb21JbkJ1dHRvbi5vbiAnY2xpY2snLCA9PiBAem9vbUluKClcbiAgICBAem9vbU91dEJ1dHRvbi5vbiAnY2xpY2snLCA9PiBAem9vbU91dCgpXG4gICAgQHJlc2V0Wm9vbUJ1dHRvbi5vbiAnY2xpY2snLCA9PiBAcmVzZXRab29tKClcbiAgICBAem9vbVRvRml0QnV0dG9uLm9uICdjbGljaycsID0+IEB6b29tVG9GaXQoKVxuXG4gIG9uRGlkTG9hZDogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtbG9hZCcsIGNhbGxiYWNrXG5cbiAgZGV0YWNoZWQ6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIHVwZGF0ZUltYWdlVVJJOiAtPlxuICAgIEBpbWFnZS5hdHRyKCdzcmMnLCBcIiN7QGVkaXRvci5nZXRFbmNvZGVkVVJJKCl9P3RpbWU9I3tEYXRlLm5vdygpfVwiKVxuXG4gICMgUmV0cmlldmVzIHRoaXMgdmlldydzIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmV9LlxuICBnZXRQYW5lOiAtPlxuICAgIEBwYXJlbnRzKCcucGFuZScpWzBdXG5cbiAgIyBab29tcyB0aGUgaW1hZ2Ugb3V0IGJ5IDI1JS5cbiAgem9vbU91dDogLT5cbiAgICBAYWRqdXN0U2l6ZSgwLjc1KVxuXG4gICMgWm9vbXMgdGhlIGltYWdlIGluIGJ5IDI1JS5cbiAgem9vbUluOiAtPlxuICAgIEBhZGp1c3RTaXplKDEuMjUpXG5cbiAgIyBab29tcyB0aGUgaW1hZ2UgdG8gaXRzIG5vcm1hbCB3aWR0aCBhbmQgaGVpZ2h0LlxuICByZXNldFpvb206IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbG9hZGVkIGFuZCBAaXNWaXNpYmxlKClcblxuICAgIEBtb2RlID0gJ3Jlc2V0LXpvb20nXG4gICAgQGltYWdlQ29udGFpbmVyLnJlbW92ZUNsYXNzICd6b29tLXRvLWZpdCdcbiAgICBAem9vbVRvRml0QnV0dG9uLnJlbW92ZUNsYXNzICdzZWxlY3RlZCdcbiAgICBAaW1hZ2Uud2lkdGgoQG9yaWdpbmFsV2lkdGgpXG4gICAgQGltYWdlLmhlaWdodChAb3JpZ2luYWxIZWlnaHQpXG4gICAgQHJlc2V0Wm9vbUJ1dHRvbi50ZXh0KCcxMDAlJylcblxuICAjIFpvb21zIHRvIGZpdCB0aGUgaW1hZ2UsIGRvZXNuJ3Qgc2NhbGUgYmV5b25kIGFjdHVhbCBzaXplXG4gIHpvb21Ub0ZpdDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBsb2FkZWQgYW5kIEBpc1Zpc2libGUoKVxuXG4gICAgQG1vZGUgPSAnem9vbS10by1maXQnXG4gICAgQGltYWdlQ29udGFpbmVyLmFkZENsYXNzICd6b29tLXRvLWZpdCdcbiAgICBAem9vbVRvRml0QnV0dG9uLmFkZENsYXNzICdzZWxlY3RlZCdcbiAgICBAaW1hZ2Uud2lkdGgoJycpXG4gICAgQGltYWdlLmhlaWdodCgnJylcbiAgICBAcmVzZXRab29tQnV0dG9uLnRleHQoJ0F1dG8nKVxuXG4gICMgQWRqdXN0IHRoZSBzaXplIG9mIHRoZSBpbWFnZSBieSB0aGUgZ2l2ZW4gbXVsdGlwbHlpbmcgZmFjdG9yLlxuICAjXG4gICMgZmFjdG9yIC0gQSB7TnVtYmVyfSB0byBtdWx0aXBseSBhZ2FpbnN0IHRoZSBjdXJyZW50IHNpemUuXG4gIGFkanVzdFNpemU6IChmYWN0b3IpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbG9hZGVkIGFuZCBAaXNWaXNpYmxlKClcblxuICAgIGlmIEBtb2RlIGlzICd6b29tLXRvLWZpdCdcbiAgICAgIEBtb2RlID0gJ3pvb20tbWFudWFsJ1xuICAgICAgQGltYWdlQ29udGFpbmVyLnJlbW92ZUNsYXNzICd6b29tLXRvLWZpdCdcbiAgICAgIEB6b29tVG9GaXRCdXR0b24ucmVtb3ZlQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgIGVsc2UgaWYgQG1vZGUgaXMgJ3Jlc2V0LXpvb20nXG4gICAgICBAbW9kZSA9ICd6b29tLW1hbnVhbCdcblxuICAgIG5ld1dpZHRoID0gQGltYWdlLndpZHRoKCkgKiBmYWN0b3JcbiAgICBuZXdIZWlnaHQgPSBAaW1hZ2UuaGVpZ2h0KCkgKiBmYWN0b3JcbiAgICBwZXJjZW50ID0gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZChuZXdXaWR0aC9Ab3JpZ2luYWxXaWR0aCoxMDApKVxuXG4gICAgIyBTd2l0Y2ggdG8gcGl4ZWxhdGVkIHJlbmRlcmluZyB3aGVuIGltYWdlIGlzIGJpZ2dlciB0aGFuIDIwMCVcbiAgICBpZiBuZXdXaWR0aCA+IEBvcmlnaW5hbFdpZHRoKjJcbiAgICAgIEBpbWFnZS5jc3MgJ2ltYWdlLXJlbmRlcmluZycsICdwaXhlbGF0ZWQnXG4gICAgZWxzZVxuICAgICAgQGltYWdlLmNzcyAnaW1hZ2UtcmVuZGVyaW5nJywgJydcblxuICAgIEBpbWFnZS53aWR0aChuZXdXaWR0aClcbiAgICBAaW1hZ2UuaGVpZ2h0KG5ld0hlaWdodClcbiAgICBAcmVzZXRab29tQnV0dG9uLnRleHQocGVyY2VudCArICclJylcblxuICAjIENoYW5nZXMgdGhlIGJhY2tncm91bmQgY29sb3Igb2YgdGhlIGltYWdlIHZpZXcuXG4gICNcbiAgIyBjb2xvciAtIEEge1N0cmluZ30gdGhhdCBnZXRzIHVzZWQgYXMgY2xhc3MgbmFtZS5cbiAgY2hhbmdlQmFja2dyb3VuZDogKGNvbG9yKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGxvYWRlZCBhbmQgQGlzVmlzaWJsZSgpIGFuZCBjb2xvclxuICAgIEBpbWFnZUNvbnRhaW5lci5hdHRyKCdiYWNrZ3JvdW5kJywgY29sb3IpXG4iXX0=
