(function() {
  var Base, CompositeDisposable, Disposable, Emitter, ModeManager, Range, _, moveCursorLeft, ref, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Range = ref.Range, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ModeManager = (function() {
    ModeManager.prototype.mode = 'insert';

    ModeManager.prototype.submode = null;

    ModeManager.prototype.replacedCharsBySelection = null;

    function ModeManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
      this.mode = 'insert';
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
    }

    ModeManager.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    ModeManager.prototype.isMode = function(mode, submodes) {
      var ref1;
      if (submodes != null) {
        return (this.mode === mode) && (ref1 = this.submode, indexOf.call([].concat(submodes), ref1) >= 0);
      } else {
        return this.mode === mode;
      }
    };

    ModeManager.prototype.onWillActivateMode = function(fn) {
      return this.emitter.on('will-activate-mode', fn);
    };

    ModeManager.prototype.onDidActivateMode = function(fn) {
      return this.emitter.on('did-activate-mode', fn);
    };

    ModeManager.prototype.onWillDeactivateMode = function(fn) {
      return this.emitter.on('will-deactivate-mode', fn);
    };

    ModeManager.prototype.preemptWillDeactivateMode = function(fn) {
      return this.emitter.preempt('will-deactivate-mode', fn);
    };

    ModeManager.prototype.onDidDeactivateMode = function(fn) {
      return this.emitter.on('did-deactivate-mode', fn);
    };

    ModeManager.prototype.activate = function(mode, submode) {
      var ref1, ref2;
      if (submode == null) {
        submode = null;
      }
      if ((mode === 'visual') && this.editor.isEmpty()) {
        return;
      }
      this.emitter.emit('will-activate-mode', {
        mode: mode,
        submode: submode
      });
      if ((mode === 'visual') && (submode === this.submode)) {
        ref1 = ['normal', null], mode = ref1[0], submode = ref1[1];
      }
      if (mode !== this.mode) {
        this.deactivate();
      }
      this.deactivator = (function() {
        switch (mode) {
          case 'normal':
            return this.activateNormalMode();
          case 'operator-pending':
            return this.activateOperatorPendingMode();
          case 'insert':
            return this.activateInsertMode(submode);
          case 'visual':
            return this.activateVisualMode(submode);
        }
      }).call(this);
      this.editorElement.classList.remove(this.mode + "-mode");
      this.editorElement.classList.remove(this.submode);
      ref2 = [mode, submode], this.mode = ref2[0], this.submode = ref2[1];
      this.editorElement.classList.add(this.mode + "-mode");
      if (this.submode != null) {
        this.editorElement.classList.add(this.submode);
      }
      if (this.mode === 'visual') {
        this.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.statusBarManager.update(this.mode, this.submode);
      this.vimState.updateCursorsVisibility();
      return this.emitter.emit('did-activate-mode', {
        mode: this.mode,
        submode: this.submode
      });
    };

    ModeManager.prototype.deactivate = function() {
      var ref1, ref2;
      if (!((ref1 = this.deactivator) != null ? ref1.disposed : void 0)) {
        this.emitter.emit('will-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
        if ((ref2 = this.deactivator) != null) {
          ref2.dispose();
        }
        return this.emitter.emit('did-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
      }
    };

    ModeManager.prototype.activateNormalMode = function() {
      var ref1;
      this.vimState.reset();
      if ((ref1 = this.editorElement.component) != null) {
        ref1.setInputEnabled(false);
      }
      return new Disposable;
    };

    ModeManager.prototype.activateOperatorPendingMode = function() {
      return new Disposable;
    };

    ModeManager.prototype.activateInsertMode = function(submode) {
      var replaceModeDeactivator;
      if (submode == null) {
        submode = null;
      }
      this.editorElement.component.setInputEnabled(true);
      if (submode === 'replace') {
        replaceModeDeactivator = this.activateReplaceMode();
      }
      return new Disposable((function(_this) {
        return function() {
          var cursor, i, len, needSpecialCareToPreventWrapLine, ref1, ref2, results;
          if (replaceModeDeactivator != null) {
            replaceModeDeactivator.dispose();
          }
          replaceModeDeactivator = null;
          if (settings.get('clearMultipleCursorsOnEscapeInsertMode')) {
            _this.editor.clearSelections();
          }
          needSpecialCareToPreventWrapLine = (ref1 = atom.config.get('editor.atomicSoftTabs')) != null ? ref1 : true;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(moveCursorLeft(cursor, {
              needSpecialCareToPreventWrapLine: needSpecialCareToPreventWrapLine
            }));
          }
          return results;
        };
      })(this));
    };

    ModeManager.prototype.activateReplaceMode = function() {
      var subs;
      this.replacedCharsBySelection = {};
      subs = new CompositeDisposable;
      subs.add(this.editor.onWillInsertText((function(_this) {
        return function(arg) {
          var cancel, text;
          text = arg.text, cancel = arg.cancel;
          cancel();
          return _this.editor.getSelections().forEach(function(selection) {
            var base, char, i, len, name, ref1, ref2, results;
            ref2 = (ref1 = text.split('')) != null ? ref1 : [];
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              char = ref2[i];
              if ((char !== "\n") && (!selection.cursor.isAtEndOfLine())) {
                selection.selectRight();
              }
              if ((base = _this.replacedCharsBySelection)[name = selection.id] == null) {
                base[name] = [];
              }
              results.push(_this.replacedCharsBySelection[selection.id].push(swrap(selection).replace(char)));
            }
            return results;
          });
        };
      })(this)));
      subs.add(new Disposable((function(_this) {
        return function() {
          return _this.replacedCharsBySelection = null;
        };
      })(this)));
      return subs;
    };

    ModeManager.prototype.getReplacedCharForSelection = function(selection) {
      var ref1;
      return (ref1 = this.replacedCharsBySelection[selection.id]) != null ? ref1.pop() : void 0;
    };

    ModeManager.prototype.activateVisualMode = function(submode) {
      var i, len, ref1, selection;
      if (this.submode != null) {
        this.normalizeSelections();
      }
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if ((this.submode != null) || selection.isEmpty()) {
          swrap(selection).translateSelectionEndAndClip('forward');
        }
      }
      this.vimState.updateSelectionProperties();
      switch (submode) {
        case 'linewise':
          this.vimState.selectLinewise();
          break;
        case 'blockwise':
          this.vimState.selectBlockwise();
      }
      return new Disposable((function(_this) {
        return function() {
          var j, len1, ref2;
          _this.normalizeSelections();
          ref2 = _this.editor.getSelections();
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            selection = ref2[j];
            selection.clear({
              autoscroll: false
            });
          }
          return _this.updateNarrowedState(false);
        };
      })(this));
    };

    ModeManager.prototype.eachNonEmptySelection = function(fn) {
      var i, len, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (!selection.isEmpty()) {
          results.push(fn(selection));
        }
      }
      return results;
    };

    ModeManager.prototype.normalizeSelections = function() {
      var bs, i, len, ref1;
      switch (this.submode) {
        case 'characterwise':
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).translateSelectionEndAndClip('backward');
          });
          break;
        case 'linewise':
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).restoreColumnFromProperties();
          });
          break;
        case 'blockwise':
          ref1 = this.vimState.getBlockwiseSelections();
          for (i = 0, len = ref1.length; i < len; i++) {
            bs = ref1[i];
            bs.restoreCharacterwise();
          }
          this.vimState.clearBlockwiseSelections();
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).translateSelectionEndAndClip('backward');
          });
      }
      return swrap.clearProperties(this.editor);
    };

    ModeManager.prototype.hasMultiLineSelection = function() {
      var ref1;
      if (this.isMode('visual', 'blockwise')) {
        return !((ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.isSingleRow() : void 0);
      } else {
        return !swrap(this.editor.getLastSelection()).isSingleRow();
      }
    };

    ModeManager.prototype.updateNarrowedState = function(value) {
      if (value == null) {
        value = null;
      }
      return this.editorElement.classList.toggle('is-narrowed', value != null ? value : this.hasMultiLineSelection());
    };

    ModeManager.prototype.isNarrowed = function() {
      return this.editorElement.classList.contains('is-narrowed');
    };

    return ModeManager;

  })();

  module.exports = ModeManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb2RlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyR0FBQTtJQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBb0QsT0FBQSxDQUFRLE1BQVIsQ0FBcEQsRUFBQyxxQkFBRCxFQUFVLGlCQUFWLEVBQWlCLDZDQUFqQixFQUFzQzs7RUFDdEMsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1AsaUJBQWtCLE9BQUEsQ0FBUSxTQUFSOztFQUNuQixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRUw7MEJBQ0osSUFBQSxHQUFNOzswQkFDTixPQUFBLEdBQVM7OzBCQUNULHdCQUFBLEdBQTBCOztJQUViLHFCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixPQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQyxJQUFDLENBQUEsY0FBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLHFCQUFBO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixDQUF1QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQXZCLENBQW5CO0lBTFc7OzBCQU9iLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7SUFETzs7MEJBR1QsTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLFFBQVA7QUFDTixVQUFBO01BQUEsSUFB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QyxRQUFRLElBQUMsQ0FBQSxxQkFBRCxDQUFBLENBQXZEO0lBRG1COzswQkFHckIsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxRQUF6QixDQUFrQyxhQUFsQztJQURVOzs7Ozs7RUFHZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTlMakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0VtaXR0ZXIsIFJhbmdlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xue21vdmVDdXJzb3JMZWZ0fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5cbmNsYXNzIE1vZGVNYW5hZ2VyXG4gIG1vZGU6ICdpbnNlcnQnICMgTmF0aXZlIGF0b20gaXMgbm90IG1vZGFsIGVkaXRvciBhbmQgaXRzIGRlZmF1bHQgaXMgJ2luc2VydCdcbiAgc3VibW9kZTogbnVsbFxuICByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb246IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnR9ID0gQHZpbVN0YXRlXG4gICAgQG1vZGUgPSAnaW5zZXJ0J1xuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEB2aW1TdGF0ZS5vbkRpZERlc3Ryb3koQGRlc3Ryb3kuYmluZCh0aGlzKSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIGlzTW9kZTogKG1vZGUsIHN1Ym1vZGVzKSAtPlxuICAgIGlmIHN1Ym1vZGVzP1xuICAgICAgKEBtb2RlIGlzIG1vZGUpIGFuZCAoQHN1Ym1vZGUgaW4gW10uY29uY2F0KHN1Ym1vZGVzKSlcbiAgICBlbHNlXG4gICAgICBAbW9kZSBpcyBtb2RlXG5cbiAgIyBFdmVudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgb25XaWxsQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCd3aWxsLWFjdGl2YXRlLW1vZGUnLCBmbilcbiAgb25EaWRBY3RpdmF0ZU1vZGU6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1hY3RpdmF0ZS1tb2RlJywgZm4pXG4gIG9uV2lsbERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCd3aWxsLWRlYWN0aXZhdGUtbW9kZScsIGZuKVxuICBwcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLnByZWVtcHQoJ3dpbGwtZGVhY3RpdmF0ZS1tb2RlJywgZm4pXG4gIG9uRGlkRGVhY3RpdmF0ZU1vZGU6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1kZWFjdGl2YXRlLW1vZGUnLCBmbilcblxuICAjIGFjdGl2YXRlOiBQdWJsaWNcbiAgIyAgVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSBtb2RlLCBET05UIHVzZSBvdGhlciBkaXJlY3QgbWV0aG9kLlxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWN0aXZhdGU6IChtb2RlLCBzdWJtb2RlPW51bGwpIC0+XG4gICAgIyBBdm9pZCBvZGQgc3RhdGUoPXZpc3VhbC1tb2RlIGJ1dCBzZWxlY3Rpb24gaXMgZW1wdHkpXG4gICAgcmV0dXJuIGlmIChtb2RlIGlzICd2aXN1YWwnKSBhbmQgQGVkaXRvci5pc0VtcHR5KClcblxuICAgIEBlbWl0dGVyLmVtaXQoJ3dpbGwtYWN0aXZhdGUtbW9kZScsIHttb2RlLCBzdWJtb2RlfSlcblxuICAgIGlmIChtb2RlIGlzICd2aXN1YWwnKSBhbmQgKHN1Ym1vZGUgaXMgQHN1Ym1vZGUpXG4gICAgICBbbW9kZSwgc3VibW9kZV0gPSBbJ25vcm1hbCcsIG51bGxdXG5cbiAgICBAZGVhY3RpdmF0ZSgpIGlmIChtb2RlIGlzbnQgQG1vZGUpXG5cbiAgICBAZGVhY3RpdmF0b3IgPSBzd2l0Y2ggbW9kZVxuICAgICAgd2hlbiAnbm9ybWFsJyB0aGVuIEBhY3RpdmF0ZU5vcm1hbE1vZGUoKVxuICAgICAgd2hlbiAnb3BlcmF0b3ItcGVuZGluZycgdGhlbiBAYWN0aXZhdGVPcGVyYXRvclBlbmRpbmdNb2RlKClcbiAgICAgIHdoZW4gJ2luc2VydCcgdGhlbiBAYWN0aXZhdGVJbnNlcnRNb2RlKHN1Ym1vZGUpXG4gICAgICB3aGVuICd2aXN1YWwnIHRoZW4gQGFjdGl2YXRlVmlzdWFsTW9kZShzdWJtb2RlKVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcIiN7QG1vZGV9LW1vZGVcIilcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKEBzdWJtb2RlKVxuXG4gICAgW0Btb2RlLCBAc3VibW9kZV0gPSBbbW9kZSwgc3VibW9kZV1cblxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCIje0Btb2RlfS1tb2RlXCIpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChAc3VibW9kZSkgaWYgQHN1Ym1vZGU/XG5cbiAgICBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgQHVwZGF0ZU5hcnJvd2VkU3RhdGUoKVxuICAgICAgQHZpbVN0YXRlLnVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uKClcblxuICAgIEB2aW1TdGF0ZS5zdGF0dXNCYXJNYW5hZ2VyLnVwZGF0ZShAbW9kZSwgQHN1Ym1vZGUpXG4gICAgQHZpbVN0YXRlLnVwZGF0ZUN1cnNvcnNWaXNpYmlsaXR5KClcblxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1hY3RpdmF0ZS1tb2RlJywge0Btb2RlLCBAc3VibW9kZX0pXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICB1bmxlc3MgQGRlYWN0aXZhdG9yPy5kaXNwb3NlZFxuICAgICAgQGVtaXR0ZXIuZW1pdCgnd2lsbC1kZWFjdGl2YXRlLW1vZGUnLCB7QG1vZGUsIEBzdWJtb2RlfSlcbiAgICAgIEBkZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG4gICAgICBAZW1pdHRlci5lbWl0KCdkaWQtZGVhY3RpdmF0ZS1tb2RlJywge0Btb2RlLCBAc3VibW9kZX0pXG5cbiAgIyBOb3JtYWxcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlTm9ybWFsTW9kZTogLT5cbiAgICBAdmltU3RhdGUucmVzZXQoKVxuICAgICMgW0ZJWE1FXSBDb21wb25lbnQgaXMgbm90IG5lY2Vzc2FyeSBhdmFpYWJsZSBzZWUgIzk4LlxuICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudD8uc2V0SW5wdXRFbmFibGVkKGZhbHNlKVxuICAgIG5ldyBEaXNwb3NhYmxlXG5cbiAgIyBPcGVyYXRvciBQZW5kaW5nXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZU9wZXJhdG9yUGVuZGluZ01vZGU6IC0+XG4gICAgbmV3IERpc3Bvc2FibGVcblxuICAjIEluc2VydFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWN0aXZhdGVJbnNlcnRNb2RlOiAoc3VibW9kZT1udWxsKSAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC5zZXRJbnB1dEVuYWJsZWQodHJ1ZSlcbiAgICByZXBsYWNlTW9kZURlYWN0aXZhdG9yID0gQGFjdGl2YXRlUmVwbGFjZU1vZGUoKSBpZiBzdWJtb2RlIGlzICdyZXBsYWNlJ1xuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIHJlcGxhY2VNb2RlRGVhY3RpdmF0b3I/LmRpc3Bvc2UoKVxuICAgICAgcmVwbGFjZU1vZGVEZWFjdGl2YXRvciA9IG51bGxcblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdjbGVhck11bHRpcGxlQ3Vyc29yc09uRXNjYXBlSW5zZXJ0TW9kZScpXG4gICAgICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcblxuICAgICAgIyBXaGVuIGVzY2FwZSBmcm9tIGluc2VydC1tb2RlLCBjdXJzb3IgbW92ZSBMZWZ0LlxuICAgICAgbmVlZFNwZWNpYWxDYXJlVG9QcmV2ZW50V3JhcExpbmUgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5hdG9taWNTb2Z0VGFicycpID8gdHJ1ZVxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgICBtb3ZlQ3Vyc29yTGVmdChjdXJzb3IsIHtuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZX0pXG5cbiAgYWN0aXZhdGVSZXBsYWNlTW9kZTogLT5cbiAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uID0ge31cbiAgICBzdWJzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBzdWJzLmFkZCBAZWRpdG9yLm9uV2lsbEluc2VydFRleHQgKHt0ZXh0LCBjYW5jZWx9KSA9PlxuICAgICAgY2FuY2VsKClcbiAgICAgIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZvckVhY2ggKHNlbGVjdGlvbikgPT5cbiAgICAgICAgZm9yIGNoYXIgaW4gdGV4dC5zcGxpdCgnJykgPyBbXVxuICAgICAgICAgIGlmIChjaGFyIGlzbnQgXCJcXG5cIikgYW5kIChub3Qgc2VsZWN0aW9uLmN1cnNvci5pc0F0RW5kT2ZMaW5lKCkpXG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VsZWN0UmlnaHQoKVxuICAgICAgICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb25bc2VsZWN0aW9uLmlkXSA/PSBbXVxuICAgICAgICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb25bc2VsZWN0aW9uLmlkXS5wdXNoKHN3cmFwKHNlbGVjdGlvbikucmVwbGFjZShjaGFyKSlcblxuICAgIHN1YnMuYWRkIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uID0gbnVsbFxuICAgIHN1YnNcblxuICBnZXRSZXBsYWNlZENoYXJGb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbltzZWxlY3Rpb24uaWRdPy5wb3AoKVxuXG4gICMgVmlzdWFsXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIEF0IHRoaXMgcG9pbnQgQHN1Ym1vZGUgaXMgbm90IHlldCB1cGRhdGVkIHRvIGZpbmFsIHN1Ym1vZGUuXG4gIGFjdGl2YXRlVmlzdWFsTW9kZTogKHN1Ym1vZGUpIC0+XG4gICAgQG5vcm1hbGl6ZVNlbGVjdGlvbnMoKSBpZiBAc3VibW9kZT9cblxuICAgICMgV2Ugb25seSBzZWxlY3QtZm9yd2FyZCBvbmx5IHdoZW5cbiAgICAjICAtICBzdWJtb2RlIHNoaWZ0KEBzdWJtb2RlPyBpcyB0cnVlKVxuICAgICMgIC0gIGluaXRpYWwgYWN0aXZhdGlvbihAc3VibW9kZT8gaXMgZmFsc2UpIGFuZCBzZWxlY3Rpb24gd2FzIGVtcHR5LlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkgd2hlbiBAc3VibW9kZT8gb3Igc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS50cmFuc2xhdGVTZWxlY3Rpb25FbmRBbmRDbGlwKCdmb3J3YXJkJylcblxuICAgIEB2aW1TdGF0ZS51cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzKClcblxuICAgIHN3aXRjaCBzdWJtb2RlXG4gICAgICB3aGVuICdsaW5ld2lzZSdcbiAgICAgICAgQHZpbVN0YXRlLnNlbGVjdExpbmV3aXNlKClcbiAgICAgIHdoZW4gJ2Jsb2Nrd2lzZSdcbiAgICAgICAgQHZpbVN0YXRlLnNlbGVjdEJsb2Nrd2lzZSgpXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQG5vcm1hbGl6ZVNlbGVjdGlvbnMoKVxuICAgICAgc2VsZWN0aW9uLmNsZWFyKGF1dG9zY3JvbGw6IGZhbHNlKSBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAdXBkYXRlTmFycm93ZWRTdGF0ZShmYWxzZSlcblxuICBlYWNoTm9uRW1wdHlTZWxlY3Rpb246IChmbikgLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpIHdoZW4gbm90IHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIGZuKHNlbGVjdGlvbilcblxuICBub3JtYWxpemVTZWxlY3Rpb25zOiAtPlxuICAgIHN3aXRjaCBAc3VibW9kZVxuICAgICAgd2hlbiAnY2hhcmFjdGVyd2lzZSdcbiAgICAgICAgQGVhY2hOb25FbXB0eVNlbGVjdGlvbiAoc2VsZWN0aW9uKSAtPlxuICAgICAgICAgIHN3cmFwKHNlbGVjdGlvbikudHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnYmFja3dhcmQnKVxuICAgICAgd2hlbiAnbGluZXdpc2UnXG4gICAgICAgIEBlYWNoTm9uRW1wdHlTZWxlY3Rpb24gKHNlbGVjdGlvbikgLT5cbiAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLnJlc3RvcmVDb2x1bW5Gcm9tUHJvcGVydGllcygpXG4gICAgICB3aGVuICdibG9ja3dpc2UnXG4gICAgICAgIGZvciBicyBpbiBAdmltU3RhdGUuZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpXG4gICAgICAgICAgYnMucmVzdG9yZUNoYXJhY3Rlcndpc2UoKVxuICAgICAgICBAdmltU3RhdGUuY2xlYXJCbG9ja3dpc2VTZWxlY3Rpb25zKClcbiAgICAgICAgQGVhY2hOb25FbXB0eVNlbGVjdGlvbiAoc2VsZWN0aW9uKSAtPlxuICAgICAgICAgIHN3cmFwKHNlbGVjdGlvbikudHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnYmFja3dhcmQnKVxuXG4gICAgc3dyYXAuY2xlYXJQcm9wZXJ0aWVzKEBlZGl0b3IpXG5cbiAgIyBOYXJyb3cgdG8gc2VsZWN0aW9uXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBoYXNNdWx0aUxpbmVTZWxlY3Rpb246IC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICAjIFtGSVhNRV0gd2h5IEkgbmVlZCBudWxsIGd1YXJkIGhlcmVcbiAgICAgIG5vdCBAdmltU3RhdGUuZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpPy5pc1NpbmdsZVJvdygpXG4gICAgZWxzZVxuICAgICAgbm90IHN3cmFwKEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKS5pc1NpbmdsZVJvdygpXG5cbiAgdXBkYXRlTmFycm93ZWRTdGF0ZTogKHZhbHVlPW51bGwpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtbmFycm93ZWQnLCB2YWx1ZSA/IEBoYXNNdWx0aUxpbmVTZWxlY3Rpb24oKSlcblxuICBpc05hcnJvd2VkOiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnaXMtbmFycm93ZWQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVNYW5hZ2VyXG4iXX0=
