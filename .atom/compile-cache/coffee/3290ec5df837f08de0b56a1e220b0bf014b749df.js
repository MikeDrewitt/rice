(function() {
  var REGISTERS, RegisterManager, settings,
    slice = [].slice;

  settings = require('./settings');

  REGISTERS = /(?:[a-zA-Z*+%_".])/;

  RegisterManager = (function() {
    function RegisterManager(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement, this.globalState = ref.globalState;
      this.data = this.globalState.get('register');
      this.subscriptionBySelection = new Map;
      this.clipboardBySelection = new Map;
    }

    RegisterManager.prototype.reset = function() {
      this.name = null;
      return this.vimState.toggleClassList('with-register', this.hasName());
    };

    RegisterManager.prototype.destroy = function() {
      var ref;
      this.subscriptionBySelection.forEach(function(disposable) {
        return disposable.dispose();
      });
      this.subscriptionBySelection.clear();
      this.clipboardBySelection.clear();
      return ref = {}, this.subscriptionBySelection = ref.subscriptionBySelection, this.clipboardBySelection = ref.clipboardBySelection, ref;
    };

    RegisterManager.prototype.isValidName = function(name) {
      return REGISTERS.test(name);
    };

    RegisterManager.prototype.getText = function(name, selection) {
      var ref;
      return (ref = this.get(name, selection).text) != null ? ref : '';
    };

    RegisterManager.prototype.readClipboard = function(selection) {
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && this.clipboardBySelection.has(selection)) {
        return this.clipboardBySelection.get(selection);
      } else {
        return atom.clipboard.read();
      }
    };

    RegisterManager.prototype.writeClipboard = function(selection, text) {
      var disposable;
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && !this.clipboardBySelection.has(selection)) {
        disposable = selection.onDidDestroy((function(_this) {
          return function() {
            _this.subscriptionBySelection["delete"](selection);
            return _this.clipboardBySelection["delete"](selection);
          };
        })(this));
        this.subscriptionBySelection.set(selection, disposable);
      }
      if ((selection === null) || selection.isLastSelection()) {
        atom.clipboard.write(text);
      }
      if (selection != null) {
        return this.clipboardBySelection.set(selection, text);
      }
    };

    RegisterManager.prototype.get = function(name, selection) {
      var ref, ref1, text, type;
      if (name == null) {
        name = this.getName();
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      switch (name) {
        case '*':
        case '+':
          text = this.readClipboard(selection);
          break;
        case '%':
          text = this.editor.getURI();
          break;
        case '_':
          text = '';
          break;
        default:
          ref1 = (ref = this.data[name.toLowerCase()]) != null ? ref : {}, text = ref1.text, type = ref1.type;
      }
      if (type == null) {
        type = this.getCopyType(text != null ? text : '');
      }
      return {
        text: text,
        type: type
      };
    };

    RegisterManager.prototype.set = function() {
      var args, name, ref, selection, value;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      ref = [], name = ref[0], value = ref[1];
      switch (args.length) {
        case 1:
          value = args[0];
          break;
        case 2:
          name = args[0], value = args[1];
      }
      if (name == null) {
        name = this.getName();
      }
      if (!this.isValidName(name)) {
        return;
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      if (value.type == null) {
        value.type = this.getCopyType(value.text);
      }
      selection = value.selection;
      delete value.selection;
      switch (name) {
        case '*':
        case '+':
          return this.writeClipboard(selection, value.text);
        case '_':
        case '%':
          return null;
        default:
          if (/^[A-Z]$/.test(name)) {
            return this.append(name.toLowerCase(), value);
          } else {
            return this.data[name] = value;
          }
      }
    };

    RegisterManager.prototype.append = function(name, value) {
      var register;
      if (!(register = this.data[name])) {
        this.data[name] = value;
        return;
      }
      if ('linewise' === register.type || 'linewise' === value.type) {
        if (register.type !== 'linewise') {
          register.text += '\n';
          register.type = 'linewise';
        }
        if (value.type !== 'linewise') {
          value.text += '\n';
        }
      }
      return register.text += value.text;
    };

    RegisterManager.prototype.getName = function() {
      var ref;
      return (ref = this.name) != null ? ref : settings.get('defaultRegister');
    };

    RegisterManager.prototype.isDefaultName = function() {
      return this.getName() === settings.get('defaultRegister');
    };

    RegisterManager.prototype.hasName = function() {
      return this.name != null;
    };

    RegisterManager.prototype.setName = function(name) {
      if (name == null) {
        name = null;
      }
      if (name != null) {
        if (this.isValidName(name)) {
          return this.name = name;
        }
      } else {
        this.vimState.hover.add('"');
        this.vimState.onDidConfirmInput((function(_this) {
          return function(name1) {
            _this.name = name1;
            _this.vimState.toggleClassList('with-register', _this.hasName());
            return _this.vimState.hover.add(_this.name);
          };
        })(this));
        this.vimState.onDidCancelInput((function(_this) {
          return function() {
            return _this.vimState.hover.reset();
          };
        })(this));
        return this.vimState.input.focus(1);
      }
    };

    RegisterManager.prototype.getCopyType = function(text) {
      if (text.lastIndexOf("\n") === text.length - 1) {
        return 'linewise';
      } else if (text.lastIndexOf("\r") === text.length - 1) {
        return 'linewise';
      } else {
        return 'character';
      }
    };

    return RegisterManager;

  })();

  module.exports = RegisterManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9yZWdpc3Rlci1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0NBQUE7SUFBQTs7RUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsU0FBQSxHQUFZOztFQWlCTjtJQUNTLHlCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixNQUEwQyxJQUFDLENBQUEsUUFBM0MsRUFBQyxJQUFDLENBQUEsYUFBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLG9CQUFBLGFBQVgsRUFBMEIsSUFBQyxDQUFBLGtCQUFBO01BQzNCLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLFVBQWpCO01BQ1IsSUFBQyxDQUFBLHVCQUFELEdBQTJCLElBQUk7TUFDL0IsSUFBQyxDQUFBLG9CQUFELEdBQXdCLElBQUk7SUFKakI7OzhCQU1iLEtBQUEsR0FBTyxTQUFBO01BQ0wsSUFBQyxDQUFBLElBQUQsR0FBUTthQUNSLElBQUMsQ0FBQSxRQUFRLENBQUMsZUFBVixDQUEwQixlQUExQixFQUEyQyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQTNDO0lBRks7OzhCQUlQLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSx1QkFBdUIsQ0FBQyxPQUF6QixDQUFpQyxTQUFDLFVBQUQ7ZUFDL0IsVUFBVSxDQUFDLE9BQVgsQ0FBQTtNQUQrQixDQUFqQztNQUVBLElBQUMsQ0FBQSx1QkFBdUIsQ0FBQyxLQUF6QixDQUFBO01BQ0EsSUFBQyxDQUFBLG9CQUFvQixDQUFDLEtBQXRCLENBQUE7YUFDQSxNQUFvRCxFQUFwRCxFQUFDLElBQUMsQ0FBQSw4QkFBQSx1QkFBRixFQUEyQixJQUFDLENBQUEsMkJBQUEsb0JBQTVCLEVBQUE7SUFMTzs7OEJBT1QsV0FBQSxHQUFhLFNBQUMsSUFBRDthQUNYLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZjtJQURXOzs4QkFHYixPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sU0FBUDtBQUNQLFVBQUE7b0VBQTZCO0lBRHRCOzs4QkFHVCxhQUFBLEdBQWUsU0FBQyxTQUFEOztRQUFDLFlBQVU7O01BQ3hCLHlCQUFHLFNBQVMsQ0FBRSxNQUFNLENBQUMsa0JBQWxCLENBQUEsV0FBQSxJQUEyQyxJQUFDLENBQUEsb0JBQW9CLENBQUMsR0FBdEIsQ0FBMEIsU0FBMUIsQ0FBOUM7ZUFDRSxJQUFDLENBQUEsb0JBQW9CLENBQUMsR0FBdEIsQ0FBMEIsU0FBMUIsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBQSxFQUhGOztJQURhOzs4QkFNZixjQUFBLEdBQWdCLFNBQUMsU0FBRCxFQUFpQixJQUFqQjtBQUNkLFVBQUE7O1FBRGUsWUFBVTs7TUFDekIseUJBQUcsU0FBUyxDQUFFLE1BQU0sQ0FBQyxrQkFBbEIsQ0FBQSxXQUFBLElBQTJDLENBQUksSUFBQyxDQUFBLG9CQUFvQixDQUFDLEdBQXRCLENBQTBCLFNBQTFCLENBQWxEO1FBQ0UsVUFBQSxHQUFhLFNBQVMsQ0FBQyxZQUFWLENBQXVCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7WUFDbEMsS0FBQyxDQUFBLHVCQUF1QixFQUFDLE1BQUQsRUFBeEIsQ0FBZ0MsU0FBaEM7bUJBQ0EsS0FBQyxDQUFBLG9CQUFvQixFQUFDLE1BQUQsRUFBckIsQ0FBNkIsU0FBN0I7VUFGa0M7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCO1FBR2IsSUFBQyxDQUFBLHVCQUF1QixDQUFDLEdBQXpCLENBQTZCLFNBQTdCLEVBQXdDLFVBQXhDLEVBSkY7O01BTUEsSUFBRyxDQUFDLFNBQUEsS0FBYSxJQUFkLENBQUEsSUFBdUIsU0FBUyxDQUFDLGVBQVYsQ0FBQSxDQUExQjtRQUNFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixJQUFyQixFQURGOztNQUVBLElBQThDLGlCQUE5QztlQUFBLElBQUMsQ0FBQSxvQkFBb0IsQ0FBQyxHQUF0QixDQUEwQixTQUExQixFQUFxQyxJQUFyQyxFQUFBOztJQVRjOzs4QkFXaEIsR0FBQSxHQUFLLFNBQUMsSUFBRCxFQUFPLFNBQVA7QUFDSCxVQUFBOztRQUFBLE9BQVEsSUFBQyxDQUFBLE9BQUQsQ0FBQTs7TUFDUixJQUEwQyxJQUFBLEtBQVEsR0FBbEQ7UUFBQSxJQUFBLEdBQU8sUUFBUSxDQUFDLEdBQVQsQ0FBYSxpQkFBYixFQUFQOztBQUVBLGNBQU8sSUFBUDtBQUFBLGFBQ08sR0FEUDtBQUFBLGFBQ1ksR0FEWjtVQUNxQixJQUFBLEdBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBZSxTQUFmO0FBQWhCO0FBRFosYUFFTyxHQUZQO1VBRWdCLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBQTtBQUFoQjtBQUZQLGFBR08sR0FIUDtVQUdnQixJQUFBLEdBQU87QUFBaEI7QUFIUDtVQUtJLDZEQUEyQyxFQUEzQyxFQUFDLGdCQUFELEVBQU87QUFMWDs7UUFNQSxPQUFRLElBQUMsQ0FBQSxXQUFELGdCQUFhLE9BQU8sRUFBcEI7O2FBQ1I7UUFBQyxNQUFBLElBQUQ7UUFBTyxNQUFBLElBQVA7O0lBWEc7OzhCQXFCTCxHQUFBLEdBQUssU0FBQTtBQUNILFVBQUE7TUFESTtNQUNKLE1BQWdCLEVBQWhCLEVBQUMsYUFBRCxFQUFPO0FBQ1AsY0FBTyxJQUFJLENBQUMsTUFBWjtBQUFBLGFBQ08sQ0FEUDtVQUNlLFFBQVM7QUFBakI7QUFEUCxhQUVPLENBRlA7VUFFZSxjQUFELEVBQU87QUFGckI7O1FBSUEsT0FBUSxJQUFDLENBQUEsT0FBRCxDQUFBOztNQUNSLElBQUEsQ0FBYyxJQUFDLENBQUEsV0FBRCxDQUFhLElBQWIsQ0FBZDtBQUFBLGVBQUE7O01BQ0EsSUFBMEMsSUFBQSxLQUFRLEdBQWxEO1FBQUEsSUFBQSxHQUFPLFFBQVEsQ0FBQyxHQUFULENBQWEsaUJBQWIsRUFBUDs7O1FBQ0EsS0FBSyxDQUFDLE9BQVEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxLQUFLLENBQUMsSUFBbkI7O01BRWQsU0FBQSxHQUFZLEtBQUssQ0FBQztNQUNsQixPQUFPLEtBQUssQ0FBQztBQUNiLGNBQU8sSUFBUDtBQUFBLGFBQ08sR0FEUDtBQUFBLGFBQ1ksR0FEWjtpQkFDcUIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsU0FBaEIsRUFBMkIsS0FBSyxDQUFDLElBQWpDO0FBRHJCLGFBRU8sR0FGUDtBQUFBLGFBRVksR0FGWjtpQkFFcUI7QUFGckI7VUFJSSxJQUFHLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixDQUFIO21CQUNFLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFSLEVBQTRCLEtBQTVCLEVBREY7V0FBQSxNQUFBO21CQUdFLElBQUMsQ0FBQSxJQUFLLENBQUEsSUFBQSxDQUFOLEdBQWMsTUFIaEI7O0FBSko7SUFiRzs7OEJBd0JMLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxLQUFQO0FBQ04sVUFBQTtNQUFBLElBQUEsQ0FBTyxDQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsSUFBSyxDQUFBLElBQUEsQ0FBakIsQ0FBUDtRQUNFLElBQUMsQ0FBQSxJQUFLLENBQUEsSUFBQSxDQUFOLEdBQWM7QUFDZCxlQUZGOztNQUlBLElBQUcsVUFBQSxLQUFlLFFBQVEsQ0FBQyxJQUF4QixJQUFBLFVBQUEsS0FBOEIsS0FBSyxDQUFDLElBQXZDO1FBQ0UsSUFBRyxRQUFRLENBQUMsSUFBVCxLQUFtQixVQUF0QjtVQUNFLFFBQVEsQ0FBQyxJQUFULElBQWlCO1VBQ2pCLFFBQVEsQ0FBQyxJQUFULEdBQWdCLFdBRmxCOztRQUdBLElBQUcsS0FBSyxDQUFDLElBQU4sS0FBZ0IsVUFBbkI7VUFDRSxLQUFLLENBQUMsSUFBTixJQUFjLEtBRGhCO1NBSkY7O2FBTUEsUUFBUSxDQUFDLElBQVQsSUFBaUIsS0FBSyxDQUFDO0lBWGpCOzs4QkFhUixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7K0NBQVEsUUFBUSxDQUFDLEdBQVQsQ0FBYSxpQkFBYjtJQUREOzs4QkFHVCxhQUFBLEdBQWUsU0FBQTthQUNiLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxLQUFjLFFBQVEsQ0FBQyxHQUFULENBQWEsaUJBQWI7SUFERDs7OEJBR2YsT0FBQSxHQUFTLFNBQUE7YUFDUDtJQURPOzs4QkFHVCxPQUFBLEdBQVMsU0FBQyxJQUFEOztRQUFDLE9BQUs7O01BQ2IsSUFBRyxZQUFIO1FBQ0UsSUFBZ0IsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFiLENBQWhCO2lCQUFBLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBUjtTQURGO09BQUEsTUFBQTtRQUdFLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQWhCLENBQW9CLEdBQXBCO1FBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxpQkFBVixDQUE0QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLEtBQUQ7WUFBQyxLQUFDLENBQUEsT0FBRDtZQUMzQixLQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBMEIsZUFBMUIsRUFBMkMsS0FBQyxDQUFBLE9BQUQsQ0FBQSxDQUEzQzttQkFDQSxLQUFDLENBQUEsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFoQixDQUFvQixLQUFDLENBQUEsSUFBckI7VUFGMEI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVCO1FBR0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxnQkFBVixDQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQWhCLENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0I7ZUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFoQixDQUFzQixDQUF0QixFQVJGOztJQURPOzs4QkFXVCxXQUFBLEdBQWEsU0FBQyxJQUFEO01BQ1gsSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFqQixDQUFBLEtBQTBCLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBM0M7ZUFDRSxXQURGO09BQUEsTUFFSyxJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCLENBQUEsS0FBMEIsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUEzQztlQUNILFdBREc7T0FBQSxNQUFBO2VBSUgsWUFKRzs7SUFITTs7Ozs7O0VBU2YsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFuSmpCIiwic291cmNlc0NvbnRlbnQiOlsic2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5SRUdJU1RFUlMgPSAvLy8gKFxuICA/OiBbYS16QS1aKislX1wiLl1cbikgLy8vXG5cbiMgVE9ETzogVmltIHN1cHBvcnQgZm9sbG93aW5nIHJlZ2lzdGVycy5cbiMgeDogY29tcGxldGUsIC06IHBhcnRpYWxseVxuIyAgW3hdIDEuIFRoZSB1bm5hbWVkIHJlZ2lzdGVyIFwiXCJcbiMgIFsgXSAyLiAxMCBudW1iZXJlZCByZWdpc3RlcnMgXCIwIHRvIFwiOVxuIyAgWyBdIDMuIFRoZSBzbWFsbCBkZWxldGUgcmVnaXN0ZXIgXCItXG4jICBbeF0gNC4gMjYgbmFtZWQgcmVnaXN0ZXJzIFwiYSB0byBcInogb3IgXCJBIHRvIFwiWlxuIyAgWy1dIDUuIHRocmVlIHJlYWQtb25seSByZWdpc3RlcnMgXCI6LCBcIi4sIFwiJVxuIyAgWyBdIDYuIGFsdGVybmF0ZSBidWZmZXIgcmVnaXN0ZXIgXCIjXG4jICBbIF0gNy4gdGhlIGV4cHJlc3Npb24gcmVnaXN0ZXIgXCI9XG4jICBbIF0gOC4gVGhlIHNlbGVjdGlvbiBhbmQgZHJvcCByZWdpc3RlcnMgXCIqLCBcIisgYW5kIFwiflxuIyAgW3hdIDkuIFRoZSBibGFjayBob2xlIHJlZ2lzdGVyIFwiX1xuIyAgWyBdIDEwLiBMYXN0IHNlYXJjaCBwYXR0ZXJuIHJlZ2lzdGVyIFwiL1xuXG5jbGFzcyBSZWdpc3Rlck1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50LCBAZ2xvYmFsU3RhdGV9ID0gQHZpbVN0YXRlXG4gICAgQGRhdGEgPSBAZ2xvYmFsU3RhdGUuZ2V0KCdyZWdpc3RlcicpXG4gICAgQHN1YnNjcmlwdGlvbkJ5U2VsZWN0aW9uID0gbmV3IE1hcFxuICAgIEBjbGlwYm9hcmRCeVNlbGVjdGlvbiA9IG5ldyBNYXBcblxuICByZXNldDogLT5cbiAgICBAbmFtZSA9IG51bGxcbiAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLXJlZ2lzdGVyJywgQGhhc05hbWUoKSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25CeVNlbGVjdGlvbi5mb3JFYWNoIChkaXNwb3NhYmxlKSAtPlxuICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uY2xlYXIoKVxuICAgIEBjbGlwYm9hcmRCeVNlbGVjdGlvbi5jbGVhcigpXG4gICAge0BzdWJzY3JpcHRpb25CeVNlbGVjdGlvbiwgQGNsaXBib2FyZEJ5U2VsZWN0aW9ufSA9IHt9XG5cbiAgaXNWYWxpZE5hbWU6IChuYW1lKSAtPlxuICAgIFJFR0lTVEVSUy50ZXN0KG5hbWUpXG5cbiAgZ2V0VGV4dDogKG5hbWUsIHNlbGVjdGlvbikgLT5cbiAgICBAZ2V0KG5hbWUsIHNlbGVjdGlvbikudGV4dCA/ICcnXG5cbiAgcmVhZENsaXBib2FyZDogKHNlbGVjdGlvbj1udWxsKSAtPlxuICAgIGlmIHNlbGVjdGlvbj8uZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpIGFuZCBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uaGFzKHNlbGVjdGlvbilcbiAgICAgIEBjbGlwYm9hcmRCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKVxuICAgIGVsc2VcbiAgICAgIGF0b20uY2xpcGJvYXJkLnJlYWQoKVxuXG4gIHdyaXRlQ2xpcGJvYXJkOiAoc2VsZWN0aW9uPW51bGwsIHRleHQpIC0+XG4gICAgaWYgc2VsZWN0aW9uPy5lZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKCkgYW5kIG5vdCBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uaGFzKHNlbGVjdGlvbilcbiAgICAgIGRpc3Bvc2FibGUgPSBzZWxlY3Rpb24ub25EaWREZXN0cm95ID0+XG4gICAgICAgIEBzdWJzY3JpcHRpb25CeVNlbGVjdGlvbi5kZWxldGUoc2VsZWN0aW9uKVxuICAgICAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uZGVsZXRlKHNlbGVjdGlvbilcbiAgICAgIEBzdWJzY3JpcHRpb25CeVNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLCBkaXNwb3NhYmxlKVxuXG4gICAgaWYgKHNlbGVjdGlvbiBpcyBudWxsKSBvciBzZWxlY3Rpb24uaXNMYXN0U2VsZWN0aW9uKClcbiAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpXG4gICAgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLnNldChzZWxlY3Rpb24sIHRleHQpIGlmIHNlbGVjdGlvbj9cblxuICBnZXQ6IChuYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgbmFtZSA/PSBAZ2V0TmFtZSgpXG4gICAgbmFtZSA9IHNldHRpbmdzLmdldCgnZGVmYXVsdFJlZ2lzdGVyJykgaWYgbmFtZSBpcyAnXCInXG5cbiAgICBzd2l0Y2ggbmFtZVxuICAgICAgd2hlbiAnKicsICcrJyB0aGVuIHRleHQgPSBAcmVhZENsaXBib2FyZChzZWxlY3Rpb24pXG4gICAgICB3aGVuICclJyB0aGVuIHRleHQgPSBAZWRpdG9yLmdldFVSSSgpXG4gICAgICB3aGVuICdfJyB0aGVuIHRleHQgPSAnJyAjIEJsYWNraG9sZSBhbHdheXMgcmV0dXJucyBub3RoaW5nXG4gICAgICBlbHNlXG4gICAgICAgIHt0ZXh0LCB0eXBlfSA9IEBkYXRhW25hbWUudG9Mb3dlckNhc2UoKV0gPyB7fVxuICAgIHR5cGUgPz0gQGdldENvcHlUeXBlKHRleHQgPyAnJylcbiAgICB7dGV4dCwgdHlwZX1cblxuICAjIFByaXZhdGU6IFNldHMgdGhlIHZhbHVlIG9mIGEgZ2l2ZW4gcmVnaXN0ZXIuXG4gICNcbiAgIyBuYW1lICAtIFRoZSBuYW1lIG9mIHRoZSByZWdpc3RlciB0byBmZXRjaC5cbiAgIyB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXQgdGhlIHJlZ2lzdGVyIHRvLCB3aXRoIGZvbGxvd2luZyBwcm9wZXJ0aWVzLlxuICAjICB0ZXh0OiB0ZXh0IHRvIHNhdmUgdG8gcmVnaXN0ZXIuXG4gICMgIHR5cGU6IChvcHRpb25hbCkgaWYgb21taXRlZCBhdXRvbWF0aWNhbGx5IHNldCBmcm9tIHRleHQuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIHNldDogKGFyZ3MuLi4pIC0+XG4gICAgW25hbWUsIHZhbHVlXSA9IFtdXG4gICAgc3dpdGNoIGFyZ3MubGVuZ3RoXG4gICAgICB3aGVuIDEgdGhlbiBbdmFsdWVdID0gYXJnc1xuICAgICAgd2hlbiAyIHRoZW4gW25hbWUsIHZhbHVlXSA9IGFyZ3NcblxuICAgIG5hbWUgPz0gQGdldE5hbWUoKVxuICAgIHJldHVybiB1bmxlc3MgQGlzVmFsaWROYW1lKG5hbWUpXG4gICAgbmFtZSA9IHNldHRpbmdzLmdldCgnZGVmYXVsdFJlZ2lzdGVyJykgaWYgbmFtZSBpcyAnXCInXG4gICAgdmFsdWUudHlwZSA/PSBAZ2V0Q29weVR5cGUodmFsdWUudGV4dClcblxuICAgIHNlbGVjdGlvbiA9IHZhbHVlLnNlbGVjdGlvblxuICAgIGRlbGV0ZSB2YWx1ZS5zZWxlY3Rpb25cbiAgICBzd2l0Y2ggbmFtZVxuICAgICAgd2hlbiAnKicsICcrJyB0aGVuIEB3cml0ZUNsaXBib2FyZChzZWxlY3Rpb24sIHZhbHVlLnRleHQpXG4gICAgICB3aGVuICdfJywgJyUnIHRoZW4gbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBpZiAvXltBLVpdJC8udGVzdChuYW1lKVxuICAgICAgICAgIEBhcHBlbmQobmFtZS50b0xvd2VyQ2FzZSgpLCB2YWx1ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkYXRhW25hbWVdID0gdmFsdWVcblxuICAjIFByaXZhdGU6IGFwcGVuZCBhIHZhbHVlIGludG8gYSBnaXZlbiByZWdpc3RlclxuICAjIGxpa2Ugc2V0UmVnaXN0ZXIsIGJ1dCBhcHBlbmRzIHRoZSB2YWx1ZVxuICBhcHBlbmQ6IChuYW1lLCB2YWx1ZSkgLT5cbiAgICB1bmxlc3MgcmVnaXN0ZXIgPSBAZGF0YVtuYW1lXVxuICAgICAgQGRhdGFbbmFtZV0gPSB2YWx1ZVxuICAgICAgcmV0dXJuXG5cbiAgICBpZiAnbGluZXdpc2UnIGluIFtyZWdpc3Rlci50eXBlLCB2YWx1ZS50eXBlXVxuICAgICAgaWYgcmVnaXN0ZXIudHlwZSBpc250ICdsaW5ld2lzZSdcbiAgICAgICAgcmVnaXN0ZXIudGV4dCArPSAnXFxuJ1xuICAgICAgICByZWdpc3Rlci50eXBlID0gJ2xpbmV3aXNlJ1xuICAgICAgaWYgdmFsdWUudHlwZSBpc250ICdsaW5ld2lzZSdcbiAgICAgICAgdmFsdWUudGV4dCArPSAnXFxuJ1xuICAgIHJlZ2lzdGVyLnRleHQgKz0gdmFsdWUudGV4dFxuXG4gIGdldE5hbWU6IC0+XG4gICAgQG5hbWUgPyBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpXG5cbiAgaXNEZWZhdWx0TmFtZTogLT5cbiAgICBAZ2V0TmFtZSgpIGlzIHNldHRpbmdzLmdldCgnZGVmYXVsdFJlZ2lzdGVyJylcblxuICBoYXNOYW1lOiAtPlxuICAgIEBuYW1lP1xuXG4gIHNldE5hbWU6IChuYW1lPW51bGwpIC0+XG4gICAgaWYgbmFtZT9cbiAgICAgIEBuYW1lID0gbmFtZSBpZiBAaXNWYWxpZE5hbWUobmFtZSlcbiAgICBlbHNlXG4gICAgICBAdmltU3RhdGUuaG92ZXIuYWRkICdcIidcbiAgICAgIEB2aW1TdGF0ZS5vbkRpZENvbmZpcm1JbnB1dCAoQG5hbWUpID0+XG4gICAgICAgIEB2aW1TdGF0ZS50b2dnbGVDbGFzc0xpc3QoJ3dpdGgtcmVnaXN0ZXInLCBAaGFzTmFtZSgpKVxuICAgICAgICBAdmltU3RhdGUuaG92ZXIuYWRkKEBuYW1lKVxuICAgICAgQHZpbVN0YXRlLm9uRGlkQ2FuY2VsSW5wdXQgPT4gQHZpbVN0YXRlLmhvdmVyLnJlc2V0KClcbiAgICAgIEB2aW1TdGF0ZS5pbnB1dC5mb2N1cygxKVxuXG4gIGdldENvcHlUeXBlOiAodGV4dCkgLT5cbiAgICBpZiB0ZXh0Lmxhc3RJbmRleE9mKFwiXFxuXCIpIGlzIHRleHQubGVuZ3RoIC0gMVxuICAgICAgJ2xpbmV3aXNlJ1xuICAgIGVsc2UgaWYgdGV4dC5sYXN0SW5kZXhPZihcIlxcclwiKSBpcyB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICdsaW5ld2lzZSdcbiAgICBlbHNlXG4gICAgICAjIFtGSVhNRV0gc2hvdWxkIGNoYXJhY3Rlcndpc2Ugb3IgbGluZSBhbmQgY2hhcmFjdGVyXG4gICAgICAnY2hhcmFjdGVyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZ2lzdGVyTWFuYWdlclxuIl19
