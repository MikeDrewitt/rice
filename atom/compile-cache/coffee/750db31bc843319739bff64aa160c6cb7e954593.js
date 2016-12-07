(function() {
  var $, Dialog, TextEditorView, View, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $ = ref.$, TextEditorView = ref.TextEditorView, View = ref.View;

  path = require('path');

  module.exports = Dialog = (function(superClass) {
    extend(Dialog, superClass);

    function Dialog() {
      return Dialog.__super__.constructor.apply(this, arguments);
    }

    Dialog.content = function(arg) {
      var prompt;
      prompt = (arg != null ? arg : {}).prompt;
      return this.div({
        "class": 'tree-view-dialog'
      }, (function(_this) {
        return function() {
          _this.label(prompt, {
            "class": 'icon',
            outlet: 'promptText'
          });
          _this.subview('miniEditor', new TextEditorView({
            mini: true
          }));
          return _this.div({
            "class": 'error-message',
            outlet: 'errorMessage'
          });
        };
      })(this));
    };

    Dialog.prototype.initialize = function(arg) {
      var baseName, extension, iconClass, initialPath, range, ref1, select, selectionEnd;
      ref1 = arg != null ? arg : {}, initialPath = ref1.initialPath, select = ref1.select, iconClass = ref1.iconClass;
      if (iconClass) {
        this.promptText.addClass(iconClass);
      }
      atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.onConfirm(_this.miniEditor.getText());
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
      this.miniEditor.on('blur', (function(_this) {
        return function() {
          if (document.hasFocus()) {
            return _this.close();
          }
        };
      })(this));
      this.miniEditor.getModel().onDidChange((function(_this) {
        return function() {
          return _this.showError();
        };
      })(this));
      this.miniEditor.getModel().setText(initialPath);
      if (select) {
        extension = path.extname(initialPath);
        baseName = path.basename(initialPath);
        if (baseName === extension) {
          selectionEnd = initialPath.length;
        } else {
          selectionEnd = initialPath.length - extension.length;
        }
        range = [[0, initialPath.length - baseName.length], [0, selectionEnd]];
        return this.miniEditor.getModel().setSelectedBufferRange(range);
      }
    };

    Dialog.prototype.attach = function() {
      this.panel = atom.workspace.addModalPanel({
        item: this.element
      });
      this.miniEditor.focus();
      return this.miniEditor.getModel().scrollToCursorPosition();
    };

    Dialog.prototype.close = function() {
      var panelToDestroy;
      panelToDestroy = this.panel;
      this.panel = null;
      if (panelToDestroy != null) {
        panelToDestroy.destroy();
      }
      return atom.workspace.getActivePane().activate();
    };

    Dialog.prototype.cancel = function() {
      this.close();
      return $('.tree-view').focus();
    };

    Dialog.prototype.showError = function(message) {
      if (message == null) {
        message = '';
      }
      this.errorMessage.text(message);
      if (message) {
        return this.flashError();
      }
    };

    return Dialog;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2RpYWxvZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBDQUFBO0lBQUE7OztFQUFBLE1BQTRCLE9BQUEsQ0FBUSxzQkFBUixDQUE1QixFQUFDLFNBQUQsRUFBSSxtQ0FBSixFQUFvQjs7RUFDcEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixNQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsR0FBRDtBQUNSLFVBQUE7TUFEVSx3QkFBRCxNQUFXO2FBQ3BCLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO09BQUwsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQzlCLEtBQUMsQ0FBQSxLQUFELENBQU8sTUFBUCxFQUFlO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxNQUFQO1lBQWUsTUFBQSxFQUFRLFlBQXZCO1dBQWY7VUFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsRUFBMkIsSUFBQSxjQUFBLENBQWU7WUFBQSxJQUFBLEVBQU0sSUFBTjtXQUFmLENBQTNCO2lCQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7WUFBd0IsTUFBQSxFQUFRLGNBQWhDO1dBQUw7UUFIOEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhDO0lBRFE7O3FCQU1WLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBOzJCQURXLE1BQW1DLElBQWxDLGdDQUFhLHNCQUFRO01BQ2pDLElBQW1DLFNBQW5DO1FBQUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQXFCLFNBQXJCLEVBQUE7O01BQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxPQUFuQixFQUNFO1FBQUEsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxTQUFELENBQVcsS0FBQyxDQUFBLFVBQVUsQ0FBQyxPQUFaLENBQUEsQ0FBWDtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQjtRQUNBLGFBQUEsRUFBZSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEZjtPQURGO01BR0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxFQUFaLENBQWUsTUFBZixFQUF1QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFBRyxJQUFZLFFBQVEsQ0FBQyxRQUFULENBQUEsQ0FBWjttQkFBQSxLQUFDLENBQUEsS0FBRCxDQUFBLEVBQUE7O1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCO01BQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQUEsQ0FBc0IsQ0FBQyxXQUF2QixDQUFtQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFNBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQztNQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFBLENBQXNCLENBQUMsT0FBdkIsQ0FBK0IsV0FBL0I7TUFFQSxJQUFHLE1BQUg7UUFDRSxTQUFBLEdBQVksSUFBSSxDQUFDLE9BQUwsQ0FBYSxXQUFiO1FBQ1osUUFBQSxHQUFXLElBQUksQ0FBQyxRQUFMLENBQWMsV0FBZDtRQUNYLElBQUcsUUFBQSxLQUFZLFNBQWY7VUFDRSxZQUFBLEdBQWUsV0FBVyxDQUFDLE9BRDdCO1NBQUEsTUFBQTtVQUdFLFlBQUEsR0FBZSxXQUFXLENBQUMsTUFBWixHQUFxQixTQUFTLENBQUMsT0FIaEQ7O1FBSUEsS0FBQSxHQUFRLENBQUMsQ0FBQyxDQUFELEVBQUksV0FBVyxDQUFDLE1BQVosR0FBcUIsUUFBUSxDQUFDLE1BQWxDLENBQUQsRUFBNEMsQ0FBQyxDQUFELEVBQUksWUFBSixDQUE1QztlQUNSLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFBLENBQXNCLENBQUMsc0JBQXZCLENBQThDLEtBQTlDLEVBUkY7O0lBVFU7O3FCQW1CWixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1FBQUEsSUFBQSxFQUFNLElBQUksQ0FBQyxPQUFYO09BQTdCO01BQ1QsSUFBQyxDQUFBLFVBQVUsQ0FBQyxLQUFaLENBQUE7YUFDQSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBQSxDQUFzQixDQUFDLHNCQUF2QixDQUFBO0lBSE07O3FCQUtSLEtBQUEsR0FBTyxTQUFBO0FBQ0wsVUFBQTtNQUFBLGNBQUEsR0FBaUIsSUFBQyxDQUFBO01BQ2xCLElBQUMsQ0FBQSxLQUFELEdBQVM7O1FBQ1QsY0FBYyxDQUFFLE9BQWhCLENBQUE7O2FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUEsQ0FBOEIsQ0FBQyxRQUEvQixDQUFBO0lBSks7O3FCQU1QLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBQyxDQUFBLEtBQUQsQ0FBQTthQUNBLENBQUEsQ0FBRSxZQUFGLENBQWUsQ0FBQyxLQUFoQixDQUFBO0lBRk07O3FCQUlSLFNBQUEsR0FBVyxTQUFDLE9BQUQ7O1FBQUMsVUFBUTs7TUFDbEIsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLE9BQW5CO01BQ0EsSUFBaUIsT0FBakI7ZUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O0lBRlM7Ozs7S0F6Q1E7QUFKckIiLCJzb3VyY2VzQ29udGVudCI6WyJ7JCwgVGV4dEVkaXRvclZpZXcsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRGlhbG9nIGV4dGVuZHMgVmlld1xuICBAY29udGVudDogKHtwcm9tcHR9ID0ge30pIC0+XG4gICAgQGRpdiBjbGFzczogJ3RyZWUtdmlldy1kaWFsb2cnLCA9PlxuICAgICAgQGxhYmVsIHByb21wdCwgY2xhc3M6ICdpY29uJywgb3V0bGV0OiAncHJvbXB0VGV4dCdcbiAgICAgIEBzdWJ2aWV3ICdtaW5pRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUpXG4gICAgICBAZGl2IGNsYXNzOiAnZXJyb3ItbWVzc2FnZScsIG91dGxldDogJ2Vycm9yTWVzc2FnZSdcblxuICBpbml0aWFsaXplOiAoe2luaXRpYWxQYXRoLCBzZWxlY3QsIGljb25DbGFzc30gPSB7fSkgLT5cbiAgICBAcHJvbXB0VGV4dC5hZGRDbGFzcyhpY29uQ2xhc3MpIGlmIGljb25DbGFzc1xuICAgIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEBvbkNvbmZpcm0oQG1pbmlFZGl0b3IuZ2V0VGV4dCgpKVxuICAgICAgJ2NvcmU6Y2FuY2VsJzogPT4gQGNhbmNlbCgpXG4gICAgQG1pbmlFZGl0b3Iub24gJ2JsdXInLCA9PiBAY2xvc2UoKSBpZiBkb2N1bWVudC5oYXNGb2N1cygpXG4gICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5vbkRpZENoYW5nZSA9PiBAc2hvd0Vycm9yKClcbiAgICBAbWluaUVkaXRvci5nZXRNb2RlbCgpLnNldFRleHQoaW5pdGlhbFBhdGgpXG5cbiAgICBpZiBzZWxlY3RcbiAgICAgIGV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZShpbml0aWFsUGF0aClcbiAgICAgIGJhc2VOYW1lID0gcGF0aC5iYXNlbmFtZShpbml0aWFsUGF0aClcbiAgICAgIGlmIGJhc2VOYW1lIGlzIGV4dGVuc2lvblxuICAgICAgICBzZWxlY3Rpb25FbmQgPSBpbml0aWFsUGF0aC5sZW5ndGhcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0aW9uRW5kID0gaW5pdGlhbFBhdGgubGVuZ3RoIC0gZXh0ZW5zaW9uLmxlbmd0aFxuICAgICAgcmFuZ2UgPSBbWzAsIGluaXRpYWxQYXRoLmxlbmd0aCAtIGJhc2VOYW1lLmxlbmd0aF0sIFswLCBzZWxlY3Rpb25FbmRdXVxuICAgICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlKVxuXG4gIGF0dGFjaDogLT5cbiAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKGl0ZW06IHRoaXMuZWxlbWVudClcbiAgICBAbWluaUVkaXRvci5mb2N1cygpXG4gICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKClcblxuICBjbG9zZTogLT5cbiAgICBwYW5lbFRvRGVzdHJveSA9IEBwYW5lbFxuICAgIEBwYW5lbCA9IG51bGxcbiAgICBwYW5lbFRvRGVzdHJveT8uZGVzdHJveSgpXG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKClcblxuICBjYW5jZWw6IC0+XG4gICAgQGNsb3NlKClcbiAgICAkKCcudHJlZS12aWV3JykuZm9jdXMoKVxuXG4gIHNob3dFcnJvcjogKG1lc3NhZ2U9JycpIC0+XG4gICAgQGVycm9yTWVzc2FnZS50ZXh0KG1lc3NhZ2UpXG4gICAgQGZsYXNoRXJyb3IoKSBpZiBtZXNzYWdlXG4iXX0=
