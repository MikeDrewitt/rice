(function() {
  var VimNormalModeInputElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  VimNormalModeInputElement = (function(superClass) {
    extend(VimNormalModeInputElement, superClass);

    function VimNormalModeInputElement() {
      return VimNormalModeInputElement.__super__.constructor.apply(this, arguments);
    }

    VimNormalModeInputElement.prototype.createdCallback = function() {
      return this.className = "normal-mode-input";
    };

    VimNormalModeInputElement.prototype.initialize = function(viewModel, mainEditorElement, opts) {
      var ref;
      this.viewModel = viewModel;
      this.mainEditorElement = mainEditorElement;
      if (opts == null) {
        opts = {};
      }
      if (opts["class"] != null) {
        this.classList.add(opts["class"]);
      }
      this.editorElement = document.createElement("atom-text-editor");
      this.editorElement.classList.add('editor');
      this.editorElement.getModel().setMini(true);
      this.editorElement.setAttribute('mini', '');
      this.appendChild(this.editorElement);
      this.singleChar = opts.singleChar;
      this.defaultText = (ref = opts.defaultText) != null ? ref : '';
      if (opts.hidden) {
        this.classList.add('vim-hidden-normal-mode-input');
        this.mainEditorElement.parentNode.appendChild(this);
      } else {
        this.panel = atom.workspace.addBottomPanel({
          item: this,
          priority: 100
        });
      }
      this.focus();
      this.handleEvents();
      return this;
    };

    VimNormalModeInputElement.prototype.handleEvents = function() {
      var compositing;
      if (this.singleChar != null) {
        compositing = false;
        this.editorElement.getModel().getBuffer().onDidChange((function(_this) {
          return function(e) {
            if (e.newText && !compositing) {
              return _this.confirm();
            }
          };
        })(this));
        this.editorElement.addEventListener('compositionstart', function() {
          return compositing = true;
        });
        this.editorElement.addEventListener('compositionend', function() {
          return compositing = false;
        });
      } else {
        atom.commands.add(this.editorElement, 'editor:newline', this.confirm.bind(this));
      }
      atom.commands.add(this.editorElement, 'core:confirm', this.confirm.bind(this));
      atom.commands.add(this.editorElement, 'core:cancel', this.cancel.bind(this));
      return atom.commands.add(this.editorElement, 'blur', this.cancel.bind(this));
    };

    VimNormalModeInputElement.prototype.confirm = function() {
      this.value = this.editorElement.getModel().getText() || this.defaultText;
      this.viewModel.confirm(this);
      return this.removePanel();
    };

    VimNormalModeInputElement.prototype.focus = function() {
      return this.editorElement.focus();
    };

    VimNormalModeInputElement.prototype.cancel = function(e) {
      this.viewModel.cancel(this);
      return this.removePanel();
    };

    VimNormalModeInputElement.prototype.removePanel = function() {
      atom.workspace.getActivePane().activate();
      if (this.panel != null) {
        return this.panel.destroy();
      } else {
        return this.remove();
      }
    };

    return VimNormalModeInputElement;

  })(HTMLDivElement);

  module.exports = document.registerElement("vim-normal-mode-input", {
    "extends": "div",
    prototype: VimNormalModeInputElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdmlldy1tb2RlbHMvdmltLW5vcm1hbC1tb2RlLWlucHV0LWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5QkFBQTtJQUFBOzs7RUFBTTs7Ozs7Ozt3Q0FDSixlQUFBLEdBQWlCLFNBQUE7YUFDZixJQUFDLENBQUEsU0FBRCxHQUFhO0lBREU7O3dDQUdqQixVQUFBLEdBQVksU0FBQyxTQUFELEVBQWEsaUJBQWIsRUFBaUMsSUFBakM7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLFlBQUQ7TUFBWSxJQUFDLENBQUEsb0JBQUQ7O1FBQW9CLE9BQU87O01BQ2xELElBQUcscUJBQUg7UUFDRSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxJQUFJLEVBQUMsS0FBRCxFQUFuQixFQURGOztNQUdBLElBQUMsQ0FBQSxhQUFELEdBQWlCLFFBQVEsQ0FBQyxhQUFULENBQXVCLGtCQUF2QjtNQUNqQixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUF6QixDQUE2QixRQUE3QjtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsUUFBZixDQUFBLENBQXlCLENBQUMsT0FBMUIsQ0FBa0MsSUFBbEM7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFlBQWYsQ0FBNEIsTUFBNUIsRUFBb0MsRUFBcEM7TUFDQSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxhQUFkO01BRUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLENBQUM7TUFDbkIsSUFBQyxDQUFBLFdBQUQsNENBQWtDO01BRWxDLElBQUcsSUFBSSxDQUFDLE1BQVI7UUFDRSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSw4QkFBZjtRQUNBLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsV0FBOUIsQ0FBMEMsSUFB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Q29udGVudCI6WyJjbGFzcyBWaW1Ob3JtYWxNb2RlSW5wdXRFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnRcbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIEBjbGFzc05hbWUgPSBcIm5vcm1hbC1tb2RlLWlucHV0XCJcblxuICBpbml0aWFsaXplOiAoQHZpZXdNb2RlbCwgQG1haW5FZGl0b3JFbGVtZW50LCBvcHRzID0ge30pIC0+XG4gICAgaWYgb3B0cy5jbGFzcz9cbiAgICAgIEBjbGFzc0xpc3QuYWRkKG9wdHMuY2xhc3MpXG5cbiAgICBAZWRpdG9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJhdG9tLXRleHQtZWRpdG9yXCJcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdlZGl0b3InKVxuICAgIEBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCkuc2V0TWluaSh0cnVlKVxuICAgIEBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZSgnbWluaScsICcnKVxuICAgIEBhcHBlbmRDaGlsZChAZWRpdG9yRWxlbWVudClcblxuICAgIEBzaW5nbGVDaGFyID0gb3B0cy5zaW5nbGVDaGFyXG4gICAgQGRlZmF1bHRUZXh0ID0gb3B0cy5kZWZhdWx0VGV4dCA/ICcnXG5cbiAgICBpZiBvcHRzLmhpZGRlblxuICAgICAgQGNsYXNzTGlzdC5hZGQoJ3ZpbS1oaWRkZW4tbm9ybWFsLW1vZGUtaW5wdXQnKVxuICAgICAgQG1haW5FZGl0b3JFbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcylcbiAgICBlbHNlXG4gICAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbChpdGVtOiB0aGlzLCBwcmlvcml0eTogMTAwKVxuXG4gICAgQGZvY3VzKClcbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICAgIHRoaXNcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgaWYgQHNpbmdsZUNoYXI/XG4gICAgICBjb21wb3NpdGluZyA9IGZhbHNlXG4gICAgICBAZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlIChlKSA9PlxuICAgICAgICBAY29uZmlybSgpIGlmIGUubmV3VGV4dCBhbmQgbm90IGNvbXBvc2l0aW5nXG4gICAgICBAZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdjb21wb3NpdGlvbnN0YXJ0JywgLT4gY29tcG9zaXRpbmcgPSB0cnVlXG4gICAgICBAZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyICdjb21wb3NpdGlvbmVuZCcsIC0+IGNvbXBvc2l0aW5nID0gZmFsc2VcbiAgICBlbHNlXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChAZWRpdG9yRWxlbWVudCwgJ2VkaXRvcjpuZXdsaW5lJywgQGNvbmZpcm0uYmluZCh0aGlzKSlcblxuICAgIGF0b20uY29tbWFuZHMuYWRkKEBlZGl0b3JFbGVtZW50LCAnY29yZTpjb25maXJtJywgQGNvbmZpcm0uYmluZCh0aGlzKSlcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChAZWRpdG9yRWxlbWVudCwgJ2NvcmU6Y2FuY2VsJywgQGNhbmNlbC5iaW5kKHRoaXMpKVxuICAgIGF0b20uY29tbWFuZHMuYWRkKEBlZGl0b3JFbGVtZW50LCAnYmx1cicsIEBjYW5jZWwuYmluZCh0aGlzKSlcblxuICBjb25maXJtOiAtPlxuICAgIEB2YWx1ZSA9IEBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCkuZ2V0VGV4dCgpIG9yIEBkZWZhdWx0VGV4dFxuICAgIEB2aWV3TW9kZWwuY29uZmlybSh0aGlzKVxuICAgIEByZW1vdmVQYW5lbCgpXG5cbiAgZm9jdXM6IC0+XG4gICAgQGVkaXRvckVsZW1lbnQuZm9jdXMoKVxuXG4gIGNhbmNlbDogKGUpIC0+XG4gICAgQHZpZXdNb2RlbC5jYW5jZWwodGhpcylcbiAgICBAcmVtb3ZlUGFuZWwoKVxuXG4gIHJlbW92ZVBhbmVsOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpXG4gICAgaWYgQHBhbmVsP1xuICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIHRoaXMucmVtb3ZlKClcblxubW9kdWxlLmV4cG9ydHMgPVxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwidmltLW5vcm1hbC1tb2RlLWlucHV0XCJcbiAgZXh0ZW5kczogXCJkaXZcIixcbiAgcHJvdG90eXBlOiBWaW1Ob3JtYWxNb2RlSW5wdXRFbGVtZW50LnByb3RvdHlwZVxuKVxuIl19
