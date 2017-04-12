(function() {
  var CompositeDisposable, Disposable, Emitter, SearchInput, ref, registerElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  registerElement = require('./utils').registerElement;

  SearchInput = (function(superClass) {
    extend(SearchInput, superClass);

    function SearchInput() {
      return SearchInput.__super__.constructor.apply(this, arguments);
    }

    SearchInput.prototype.literalModeDeactivator = null;

    SearchInput.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    SearchInput.prototype.onDidConfirm = function(fn) {
      return this.emitter.on('did-confirm', fn);
    };

    SearchInput.prototype.onDidCancel = function(fn) {
      return this.emitter.on('did-cancel', fn);
    };

    SearchInput.prototype.onDidCommand = function(fn) {
      return this.emitter.on('did-command', fn);
    };

    SearchInput.prototype.createdCallback = function() {
      var editorContainer, optionsContainer, ref1;
      this.className = "vim-mode-plus-search-container";
      this.emitter = new Emitter;
      this.innerHTML = "<div class='options-container'>\n  <span class='inline-block-tight btn btn-primary'>.*</span>\n</div>\n<div class='editor-container'>\n  <atom-text-editor mini class='editor vim-mode-plus-search'></atom-text-editor>\n</div>";
      ref1 = this.getElementsByTagName('div'), optionsContainer = ref1[0], editorContainer = ref1[1];
      this.regexSearchStatus = optionsContainer.firstElementChild;
      this.editorElement = editorContainer.firstElementChild;
      this.editor = this.editorElement.getModel();
      this.editor.setMini(true);
      this.editor.onDidChange((function(_this) {
        return function() {
          if (_this.finished) {
            return;
          }
          return _this.emitter.emit('did-change', _this.editor.getText());
        };
      })(this));
      this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });
      return this;
    };

    SearchInput.prototype.destroy = function() {
      var ref1, ref2;
      this.disposables.dispose();
      this.editor.destroy();
      if ((ref1 = this.panel) != null) {
        ref1.destroy();
      }
      ref2 = {}, this.editor = ref2.editor, this.panel = ref2.panel, this.editorElement = ref2.editorElement, this.vimState = ref2.vimState;
      return this.remove();
    };

    SearchInput.prototype.handleEvents = function() {
      return atom.commands.add(this.editorElement, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        'blur': (function(_this) {
          return function() {
            if (!_this.finished) {
              return _this.cancel();
            }
          };
        })(this),
        'vim-mode-plus:input-cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
    };

    SearchInput.prototype.focus = function(options) {
      var disposable;
      this.options = options != null ? options : {};
      this.finished = false;
      if (this.options.backwards) {
        this.editorElement.classList.add('backwards');
      }
      this.panel.show();
      this.editorElement.focus();
      this.commandSubscriptions = this.handleEvents();
      return disposable = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          disposable.dispose();
          if (!_this.finished) {
            return _this.cancel();
          }
        };
      })(this));
    };

    SearchInput.prototype.unfocus = function() {
      var ref1, ref2, ref3;
      this.editorElement.classList.remove('backwards');
      this.regexSearchStatus.classList.add('btn-primary');
      if ((ref1 = this.literalModeDeactivator) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.commandSubscriptions) != null) {
        ref2.dispose();
      }
      this.finished = true;
      atom.workspace.getActivePane().activate();
      this.editor.setText('');
      return (ref3 = this.panel) != null ? ref3.hide() : void 0;
    };

    SearchInput.prototype.updateOptionSettings = function(arg) {
      var useRegexp;
      useRegexp = (arg != null ? arg : {}).useRegexp;
      return this.regexSearchStatus.classList.toggle('btn-primary', useRegexp);
    };

    SearchInput.prototype.setCursorWord = function() {
      return this.editor.insertText(this.vimState.editor.getWordUnderCursor());
    };

    SearchInput.prototype.activateLiteralMode = function() {
      if (this.literalModeDeactivator != null) {
        return this.literalModeDeactivator.dispose();
      } else {
        this.literalModeDeactivator = new CompositeDisposable();
        this.editorElement.classList.add('literal-mode');
        return this.literalModeDeactivator.add(new Disposable((function(_this) {
          return function() {
            _this.editorElement.classList.remove('literal-mode');
            return _this.literalModeDeactivator = null;
          };
        })(this)));
      }
    };

    SearchInput.prototype.isVisible = function() {
      var ref1;
      return (ref1 = this.panel) != null ? ref1.isVisible() : void 0;
    };

    SearchInput.prototype.cancel = function() {
      this.emitter.emit('did-cancel');
      return this.unfocus();
    };

    SearchInput.prototype.confirm = function(landingPoint) {
      if (landingPoint == null) {
        landingPoint = null;
      }
      this.emitter.emit('did-confirm', {
        input: this.editor.getText(),
        landingPoint: landingPoint
      });
      return this.unfocus();
    };

    SearchInput.prototype.stopPropagation = function(oldCommands) {
      var fn, fn1, name, newCommands;
      newCommands = {};
      fn1 = function(fn) {
        var commandName;
        if (indexOf.call(name, ':') >= 0) {
          commandName = name;
        } else {
          commandName = "vim-mode-plus:" + name;
        }
        return newCommands[commandName] = function(event) {
          event.stopImmediatePropagation();
          return fn(event);
        };
      };
      for (name in oldCommands) {
        fn = oldCommands[name];
        fn1(fn);
      }
      return newCommands;
    };

    SearchInput.prototype.initialize = function(vimState) {
      this.vimState = vimState;
      this.vimState.onDidFailToSetTarget((function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.registerCommands();
      return this;
    };

    SearchInput.prototype.registerCommands = function() {
      return atom.commands.add(this.editorElement, this.stopPropagation({
        "search-confirm": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-start": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-end": (function(_this) {
          return function() {
            return _this.confirm('end');
          };
        })(this),
        "search-cancel": (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        "search-visit-next": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'visit',
              direction: 'next'
            });
          };
        })(this),
        "search-visit-prev": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'visit',
              direction: 'prev'
            });
          };
        })(this),
        "select-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence',
              operation: 'SelectOccurrence'
            });
          };
        })(this),
        "change-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence',
              operation: 'ChangeOccurrence'
            });
          };
        })(this),
        "add-occurrence-pattern-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence'
            });
          };
        })(this),
        "search-insert-wild-pattern": (function(_this) {
          return function() {
            return _this.editor.insertText('.*?');
          };
        })(this),
        "search-activate-literal-mode": (function(_this) {
          return function() {
            return _this.activateLiteralMode();
          };
        })(this),
        "search-set-cursor-word": (function(_this) {
          return function() {
            return _this.setCursorWord();
          };
        })(this),
        'core:move-up': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('prev'));
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('next'));
          };
        })(this)
      }));
    };

    return SearchInput;

  })(HTMLElement);

  module.exports = registerElement('vim-mode-plus-search-input', {
    prototype: SearchInput.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWFyY2gtaW5wdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyRUFBQTtJQUFBOzs7O0VBQUEsTUFBNkMsT0FBQSxDQUFRLE1BQVIsQ0FBN0MsRUFBQyxxQkFBRCxFQUFVLDJCQUFWLEVBQXNCOztFQUNyQixrQkFBbUIsT0FBQSxDQUFRLFNBQVI7O0VBRWQ7Ozs7Ozs7MEJBQ0osc0JBQUEsR0FBd0I7OzBCQUV4QixXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOzswQkFDYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQUFSOzswQkFDZCxXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOzswQkFDYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQUFSOzswQkFFZCxlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUVmLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFRYixPQUFzQyxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsS0FBdEIsQ0FBdEMsRUFBQywwQkFBRCxFQUFtQjtNQUNuQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsZ0JBQWdCLENBQUM7TUFDdEMsSUFBQyxDQUFBLGFBQUQsR0FBaUIsZUFBZSxDQUFDO01BQ2pDLElBQUMsQ0FBQSxNQUFE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QTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWQxQjtRQWVBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsS0FBQyxDQUFBLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBeEIsQ0FBNEIsTUFBNUIsQ0FBaEI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FmaEI7UUFnQkEsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsS0FBQyxDQUFBLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBeEIsQ0FBNEIsTUFBNUIsQ0FBaEI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoQmxCO09BRGdDLENBQWxDO0lBRGdCOzs7O0tBMUhNOztFQStJMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsZUFBQSxDQUFnQiw0QkFBaEIsRUFDZjtJQUFBLFNBQUEsRUFBVyxXQUFXLENBQUMsU0FBdkI7R0FEZTtBQWxKakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlciwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue3JlZ2lzdGVyRWxlbWVudH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5jbGFzcyBTZWFyY2hJbnB1dCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGxpdGVyYWxNb2RlRGVhY3RpdmF0b3I6IG51bGxcblxuICBvbkRpZENoYW5nZTogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZScsIGZuXG4gIG9uRGlkQ29uZmlybTogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNvbmZpcm0nLCBmblxuICBvbkRpZENhbmNlbDogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNhbmNlbCcsIGZuXG4gIG9uRGlkQ29tbWFuZDogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNvbW1hbmQnLCBmblxuXG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAY2xhc3NOYW1lID0gXCJ2aW0tbW9kZS1wbHVzLXNlYXJjaC1jb250YWluZXJcIlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBpbm5lckhUTUwgPSBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPSdvcHRpb25zLWNvbnRhaW5lcic+XG4gICAgICA8c3BhbiBjbGFzcz0naW5saW5lLWJsb2NrLXRpZ2h0IGJ0biBidG4tcHJpbWFyeSc+Lio8L3NwYW4+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz0nZWRpdG9yLWNvbnRhaW5lcic+XG4gICAgICA8YXRvbS10ZXh0LWVkaXRvciBtaW5pIGNsYXNzPSdlZGl0b3IgdmltLW1vZGUtcGx1cy1zZWFyY2gnPjwvYXRvbS10ZXh0LWVkaXRvcj5cbiAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBbb3B0aW9uc0NvbnRhaW5lciwgZWRpdG9yQ29udGFpbmVyXSA9IEBnZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylcbiAgICBAcmVnZXhTZWFyY2hTdGF0dXMgPSBvcHRpb25zQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkXG4gICAgQGVkaXRvckVsZW1lbnQgPSBlZGl0b3JDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGRcbiAgICBAZWRpdG9yID0gQGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgIEBlZGl0b3Iuc2V0TWluaSh0cnVlKVxuXG4gICAgQGVkaXRvci5vbkRpZENoYW5nZSA9PlxuICAgICAgcmV0dXJuIGlmIEBmaW5pc2hlZFxuICAgICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZScsIEBlZGl0b3IuZ2V0VGV4dCgpKVxuXG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoaXRlbTogdGhpcywgdmlzaWJsZTogZmFsc2UpXG4gICAgdGhpc1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEBlZGl0b3IuZGVzdHJveSgpXG4gICAgQHBhbmVsPy5kZXN0cm95KClcbiAgICB7QGVkaXRvciwgQHBhbmVsLCBAZWRpdG9yRWxlbWVudCwgQHZpbVN0YXRlfSA9IHt9XG4gICAgQHJlbW92ZSgpXG5cbiAgaGFuZGxlRXZlbnRzOiAtPlxuICAgIGF0b20uY29tbWFuZHMuYWRkIEBlZGl0b3JFbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEBjb25maXJtKClcbiAgICAgICdjb3JlOmNhbmNlbCc6ID0+IEBjYW5jZWwoKVxuICAgICAgJ2JsdXInOiA9PiBAY2FuY2VsKCkgdW5sZXNzIEBmaW5pc2hlZFxuICAgICAgJ3ZpbS1tb2RlLXBsdXM6aW5wdXQtY2FuY2VsJzogPT4gQGNhbmNlbCgpXG5cbiAgZm9jdXM6IChAb3B0aW9ucz17fSkgLT5cbiAgICBAZmluaXNoZWQgPSBmYWxzZVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYmFja3dhcmRzJykgaWYgQG9wdGlvbnMuYmFja3dhcmRzXG4gICAgQHBhbmVsLnNob3coKVxuICAgIEBlZGl0b3JFbGVtZW50LmZvY3VzKClcbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbnMgPSBAaGFuZGxlRXZlbnRzKClcblxuICAgICMgQ2FuY2VsIG9uIHRhYiBzd2l0Y2hcbiAgICBkaXNwb3NhYmxlID0gYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSA9PlxuICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICAgIEBjYW5jZWwoKSB1bmxlc3MgQGZpbmlzaGVkXG5cbiAgdW5mb2N1czogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdiYWNrd2FyZHMnKVxuICAgIEByZWdleFNlYXJjaFN0YXR1cy5jbGFzc0xpc3QuYWRkICdidG4tcHJpbWFyeSdcbiAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG5cbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBmaW5pc2hlZCA9IHRydWVcbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKVxuICAgIEBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgIEBwYW5lbD8uaGlkZSgpXG5cbiAgdXBkYXRlT3B0aW9uU2V0dGluZ3M6ICh7dXNlUmVnZXhwfT17fSkgLT5cbiAgICBAcmVnZXhTZWFyY2hTdGF0dXMuY2xhc3NMaXN0LnRvZ2dsZSgnYnRuLXByaW1hcnknLCB1c2VSZWdleHApXG5cbiAgc2V0Q3Vyc29yV29yZDogLT5cbiAgICBAZWRpdG9yLmluc2VydFRleHQoQHZpbVN0YXRlLmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKSlcblxuICBhY3RpdmF0ZUxpdGVyYWxNb2RlOiAtPlxuICAgIGlmIEBsaXRlcmFsTW9kZURlYWN0aXZhdG9yP1xuICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IuZGlzcG9zZSgpXG4gICAgZWxzZVxuICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdsaXRlcmFsLW1vZGUnKVxuXG4gICAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvci5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnbGl0ZXJhbC1tb2RlJylcbiAgICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IgPSBudWxsXG5cbiAgaXNWaXNpYmxlOiAtPlxuICAgIEBwYW5lbD8uaXNWaXNpYmxlKClcblxuICBjYW5jZWw6IC0+XG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNhbmNlbCcpXG4gICAgQHVuZm9jdXMoKVxuXG4gIGNvbmZpcm06IChsYW5kaW5nUG9pbnQ9bnVsbCkgLT5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybScsIHtpbnB1dDogQGVkaXRvci5nZXRUZXh0KCksIGxhbmRpbmdQb2ludH0pXG4gICAgQHVuZm9jdXMoKVxuXG4gIHN0b3BQcm9wYWdhdGlvbjogKG9sZENvbW1hbmRzKSAtPlxuICAgIG5ld0NvbW1hbmRzID0ge31cbiAgICBmb3IgbmFtZSwgZm4gb2Ygb2xkQ29tbWFuZHNcbiAgICAgIGRvIChmbikgLT5cbiAgICAgICAgaWYgJzonIGluIG5hbWVcbiAgICAgICAgICBjb21tYW5kTmFtZSA9IG5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbW1hbmROYW1lID0gXCJ2aW0tbW9kZS1wbHVzOiN7bmFtZX1cIlxuICAgICAgICBuZXdDb21tYW5kc1tjb21tYW5kTmFtZV0gPSAoZXZlbnQpIC0+XG4gICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICBmbihldmVudClcbiAgICBuZXdDb21tYW5kc1xuXG4gIGluaXRpYWxpemU6IChAdmltU3RhdGUpIC0+XG4gICAgQHZpbVN0YXRlLm9uRGlkRmFpbFRvU2V0VGFyZ2V0ID0+XG4gICAgICBAY2FuY2VsKClcblxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgICBAcmVnaXN0ZXJDb21tYW5kcygpXG4gICAgdGhpc1xuXG4gIHJlZ2lzdGVyQ29tbWFuZHM6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvckVsZW1lbnQsIEBzdG9wUHJvcGFnYXRpb24oXG4gICAgICBcInNlYXJjaC1jb25maXJtXCI6ID0+IEBjb25maXJtKClcbiAgICAgIFwic2VhcmNoLWxhbmQtdG8tc3RhcnRcIjogPT4gQGNvbmZpcm0oKVxuICAgICAgXCJzZWFyY2gtbGFuZC10by1lbmRcIjogPT4gQGNvbmZpcm0oJ2VuZCcpXG4gICAgICBcInNlYXJjaC1jYW5jZWxcIjogPT4gQGNhbmNlbCgpXG5cbiAgICAgIFwic2VhcmNoLXZpc2l0LW5leHRcIjogPT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbW1hbmQnLCBuYW1lOiAndmlzaXQnLCBkaXJlY3Rpb246ICduZXh0JylcbiAgICAgIFwic2VhcmNoLXZpc2l0LXByZXZcIjogPT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbW1hbmQnLCBuYW1lOiAndmlzaXQnLCBkaXJlY3Rpb246ICdwcmV2JylcblxuICAgICAgXCJzZWxlY3Qtb2NjdXJyZW5jZS1mcm9tLXNlYXJjaFwiOiA9PiBAZW1pdHRlci5lbWl0KCdkaWQtY29tbWFuZCcsIG5hbWU6ICdvY2N1cnJlbmNlJywgb3BlcmF0aW9uOiAnU2VsZWN0T2NjdXJyZW5jZScpXG4gICAgICBcImNoYW5nZS1vY2N1cnJlbmNlLWZyb20tc2VhcmNoXCI6ID0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1jb21tYW5kJywgbmFtZTogJ29jY3VycmVuY2UnLCBvcGVyYXRpb246ICdDaGFuZ2VPY2N1cnJlbmNlJylcbiAgICAgIFwiYWRkLW9jY3VycmVuY2UtcGF0dGVybi1mcm9tLXNlYXJjaFwiOiA9PiBAZW1pdHRlci5lbWl0KCdkaWQtY29tbWFuZCcsIG5hbWU6ICdvY2N1cnJlbmNlJylcblxuICAgICAgXCJzZWFyY2gtaW5zZXJ0LXdpbGQtcGF0dGVyblwiOiA9PiBAZWRpdG9yLmluc2VydFRleHQoJy4qPycpXG4gICAgICBcInNlYXJjaC1hY3RpdmF0ZS1saXRlcmFsLW1vZGVcIjogPT4gQGFjdGl2YXRlTGl0ZXJhbE1vZGUoKVxuICAgICAgXCJzZWFyY2gtc2V0LWN1cnNvci13b3JkXCI6ID0+IEBzZXRDdXJzb3JXb3JkKClcbiAgICAgICdjb3JlOm1vdmUtdXAnOiA9PiBAZWRpdG9yLnNldFRleHQgQHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuZ2V0KCdwcmV2JylcbiAgICAgICdjb3JlOm1vdmUtZG93bic6ID0+IEBlZGl0b3Iuc2V0VGV4dCBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ25leHQnKVxuICAgIClcblxubW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlckVsZW1lbnQgJ3ZpbS1tb2RlLXBsdXMtc2VhcmNoLWlucHV0JyxcbiAgcHJvdG90eXBlOiBTZWFyY2hJbnB1dC5wcm90b3R5cGVcbiJdfQ==
