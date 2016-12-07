(function() {
  var $, CompositeDisposable, ImageEditor, ImageEditorStatusView, View, bytes, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $ = ref.$, View = ref.View;

  CompositeDisposable = require('atom').CompositeDisposable;

  ImageEditor = require('./image-editor');

  bytes = require('bytes');

  module.exports = ImageEditorStatusView = (function(superClass) {
    extend(ImageEditorStatusView, superClass);

    function ImageEditorStatusView() {
      return ImageEditorStatusView.__super__.constructor.apply(this, arguments);
    }

    ImageEditorStatusView.content = function() {
      return this.div({
        "class": 'status-image inline-block'
      }, (function(_this) {
        return function() {
          return _this.span({
            "class": 'image-size',
            outlet: 'imageSizeStatus'
          });
        };
      })(this));
    };

    ImageEditorStatusView.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
      this.disposables = new CompositeDisposable;
      this.attach();
      return this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.updateImageSize();
        };
      })(this)));
    };

    ImageEditorStatusView.prototype.attach = function() {
      return this.statusBar.addLeftTile({
        item: this
      });
    };

    ImageEditorStatusView.prototype.attached = function() {
      return this.updateImageSize();
    };

    ImageEditorStatusView.prototype.getImageSize = function(arg) {
      var imageSize, originalHeight, originalWidth;
      originalHeight = arg.originalHeight, originalWidth = arg.originalWidth, imageSize = arg.imageSize;
      return this.imageSizeStatus.text(originalWidth + "x" + originalHeight + " " + (bytes(imageSize))).show();
    };

    ImageEditorStatusView.prototype.updateImageSize = function() {
      var editor, ref1;
      if ((ref1 = this.imageLoadDisposable) != null) {
        ref1.dispose();
      }
      editor = atom.workspace.getActivePaneItem();
      if (editor instanceof ImageEditor) {
        this.editorView = $(atom.views.getView(editor)).view();
        if (this.editorView.loaded) {
          this.getImageSize(this.editorView);
        }
        return this.imageLoadDisposable = this.editorView.onDidLoad((function(_this) {
          return function() {
            if (editor === atom.workspace.getActivePaneItem()) {
              return _this.getImageSize(_this.editorView);
            }
          };
        })(this));
      } else {
        return this.imageSizeStatus.hide();
      }
    };

    return ImageEditorStatusView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9pbWFnZS12aWV3L2xpYi9pbWFnZS1lZGl0b3Itc3RhdHVzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0RUFBQTtJQUFBOzs7RUFBQSxNQUFZLE9BQUEsQ0FBUSxzQkFBUixDQUFaLEVBQUMsU0FBRCxFQUFJOztFQUNILHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVI7O0VBRVIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNKLHFCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTywyQkFBUDtPQUFMLEVBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDdkMsS0FBQyxDQUFBLElBQUQsQ0FBTTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBUDtZQUFxQixNQUFBLEVBQVEsaUJBQTdCO1dBQU47UUFEdUM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpDO0lBRFE7O29DQUlWLFVBQUEsR0FBWSxTQUFDLFNBQUQ7TUFBQyxJQUFDLENBQUEsWUFBRDtNQUNYLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsTUFBRCxDQUFBO2FBRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxlQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekMsQ0FBakI7SUFKVTs7b0NBTVosTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVgsQ0FBdUI7UUFBQSxJQUFBLEVBQU0sSUFBTjtPQUF2QjtJQURNOztvQ0FHUixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxlQUFELENBQUE7SUFEUTs7b0NBR1YsWUFBQSxHQUFjLFNBQUMsR0FBRDtBQUNaLFVBQUE7TUFEYyxxQ0FBZ0IsbUNBQWU7YUFDN0MsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUF5QixhQUFELEdBQWUsR0FBZixHQUFrQixjQUFsQixHQUFpQyxHQUFqQyxHQUFtQyxDQUFDLEtBQUEsQ0FBTSxTQUFOLENBQUQsQ0FBM0QsQ0FBK0UsQ0FBQyxJQUFoRixDQUFBO0lBRFk7O29DQUdkLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7O1lBQW9CLENBQUUsT0FBdEIsQ0FBQTs7TUFFQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBO01BQ1QsSUFBRyxNQUFBLFlBQWtCLFdBQXJCO1FBQ0UsSUFBQyxDQUFBLFVBQUQsR0FBYyxDQUFBLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLE1BQW5CLENBQUYsQ0FBNkIsQ0FBQyxJQUE5QixDQUFBO1FBQ2QsSUFBOEIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUExQztVQUFBLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLFVBQWYsRUFBQTs7ZUFDQSxJQUFDLENBQUEsbUJBQUQsR0FBdUIsSUFBQyxDQUFBLFVBQVUsQ0FBQyxTQUFaLENBQXNCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7WUFDM0MsSUFBRyxNQUFBLEtBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBLENBQWI7cUJBQ0UsS0FBQyxDQUFBLFlBQUQsQ0FBYyxLQUFDLENBQUEsVUFBZixFQURGOztVQUQyQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEIsRUFIekI7T0FBQSxNQUFBO2VBT0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFBLEVBUEY7O0lBSmU7Ozs7S0FwQmlCO0FBTnBDIiwic291cmNlc0NvbnRlbnQiOlsieyQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuSW1hZ2VFZGl0b3IgPSByZXF1aXJlICcuL2ltYWdlLWVkaXRvcidcbmJ5dGVzID0gcmVxdWlyZSAnYnl0ZXMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEltYWdlRWRpdG9yU3RhdHVzVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3N0YXR1cy1pbWFnZSBpbmxpbmUtYmxvY2snLCA9PlxuICAgICAgQHNwYW4gY2xhc3M6ICdpbWFnZS1zaXplJywgb3V0bGV0OiAnaW1hZ2VTaXplU3RhdHVzJ1xuXG4gIGluaXRpYWxpemU6IChAc3RhdHVzQmFyKSAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGF0dGFjaCgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT4gQHVwZGF0ZUltYWdlU2l6ZSgpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoaXRlbTogdGhpcylcblxuICBhdHRhY2hlZDogLT5cbiAgICBAdXBkYXRlSW1hZ2VTaXplKClcblxuICBnZXRJbWFnZVNpemU6ICh7b3JpZ2luYWxIZWlnaHQsIG9yaWdpbmFsV2lkdGgsIGltYWdlU2l6ZX0pIC0+XG4gICAgQGltYWdlU2l6ZVN0YXR1cy50ZXh0KFwiI3tvcmlnaW5hbFdpZHRofXgje29yaWdpbmFsSGVpZ2h0fSAje2J5dGVzKGltYWdlU2l6ZSl9XCIpLnNob3coKVxuXG4gIHVwZGF0ZUltYWdlU2l6ZTogLT5cbiAgICBAaW1hZ2VMb2FkRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgaWYgZWRpdG9yIGluc3RhbmNlb2YgSW1hZ2VFZGl0b3JcbiAgICAgIEBlZGl0b3JWaWV3ID0gJChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSkudmlldygpXG4gICAgICBAZ2V0SW1hZ2VTaXplKEBlZGl0b3JWaWV3KSBpZiBAZWRpdG9yVmlldy5sb2FkZWRcbiAgICAgIEBpbWFnZUxvYWREaXNwb3NhYmxlID0gQGVkaXRvclZpZXcub25EaWRMb2FkID0+XG4gICAgICAgIGlmIGVkaXRvciBpcyBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgICAgICAgQGdldEltYWdlU2l6ZShAZWRpdG9yVmlldylcbiAgICBlbHNlXG4gICAgICBAaW1hZ2VTaXplU3RhdHVzLmhpZGUoKVxuIl19
