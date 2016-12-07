Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _unicodeHelpers = require('./unicode-helpers');

'use babel';

var SuggestionList = (function () {
  function SuggestionList() {
    var _this = this;

    _classCallCheck(this, SuggestionList);

    this.wordPrefixRegex = null;
    this.cancel = this.cancel.bind(this);
    this.confirm = this.confirm.bind(this);
    this.confirmSelection = this.confirmSelection.bind(this);
    this.confirmSelectionIfNonDefault = this.confirmSelectionIfNonDefault.bind(this);
    this.show = this.show.bind(this);
    this.showAtBeginningOfPrefix = this.showAtBeginningOfPrefix.bind(this);
    this.showAtCursorPosition = this.showAtCursorPosition.bind(this);
    this.hide = this.hide.bind(this);
    this.destroyOverlay = this.destroyOverlay.bind(this);
    this.activeEditor = null;
    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-text-editor.autocomplete-active', {
      'autocomplete-plus:confirm': this.confirmSelection,
      'autocomplete-plus:confirmIfNonDefault': this.confirmSelectionIfNonDefault,
      'autocomplete-plus:cancel': this.cancel
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.wordPrefixRegex = new RegExp('^[' + _unicodeHelpers.UnicodeLetters + '\\d_-]');
      } else {
        _this.wordPrefixRegex = /^[\w-]/;
      }
      return _this.wordPrefixRegex;
    }));
  }

  _createClass(SuggestionList, [{
    key: 'addBindings',
    value: function addBindings(editor) {
      var _this2 = this;

      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }
      this.bindings = new _atom.CompositeDisposable();

      var completionKey = atom.config.get('autocomplete-plus.confirmCompletion') || '';

      var keys = {};
      if (completionKey.indexOf('tab') > -1) {
        keys['tab'] = 'autocomplete-plus:confirm';
      }
      if (completionKey.indexOf('enter') > -1) {
        if (completionKey.indexOf('always') > -1) {
          keys['enter'] = 'autocomplete-plus:confirmIfNonDefault';
        } else {
          keys['enter'] = 'autocomplete-plus:confirm';
        }
      }

      this.bindings.add(atom.keymaps.add('atom-text-editor.autocomplete-active', { 'atom-text-editor.autocomplete-active': keys }));

      var useCoreMovementCommands = atom.config.get('autocomplete-plus.useCoreMovementCommands');
      var commandNamespace = useCoreMovementCommands ? 'core' : 'autocomplete-plus';

      var commands = {};
      commands[commandNamespace + ':move-up'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPrevious();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-down'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectNext();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':page-up'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPageUp();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':page-down'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPageDown();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-to-top'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectTop();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-to-bottom'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectBottom();
          return event.stopImmediatePropagation();
        }
      };

      this.bindings.add(atom.commands.add(atom.views.getView(editor), commands));

      return this.bindings.add(atom.config.onDidChange('autocomplete-plus.useCoreMovementCommands', function () {
        return _this2.addBindings(editor);
      }));
    }

    /*
    Section: Event Triggers
    */

  }, {
    key: 'cancel',
    value: function cancel() {
      return this.emitter.emit('did-cancel');
    }
  }, {
    key: 'confirm',
    value: function confirm(match) {
      return this.emitter.emit('did-confirm', match);
    }
  }, {
    key: 'confirmSelection',
    value: function confirmSelection() {
      return this.emitter.emit('did-confirm-selection');
    }
  }, {
    key: 'confirmSelectionIfNonDefault',
    value: function confirmSelectionIfNonDefault(event) {
      return this.emitter.emit('did-confirm-selection-if-non-default', event);
    }
  }, {
    key: 'selectNext',
    value: function selectNext() {
      return this.emitter.emit('did-select-next');
    }
  }, {
    key: 'selectPrevious',
    value: function selectPrevious() {
      return this.emitter.emit('did-select-previous');
    }
  }, {
    key: 'selectPageUp',
    value: function selectPageUp() {
      return this.emitter.emit('did-select-page-up');
    }
  }, {
    key: 'selectPageDown',
    value: function selectPageDown() {
      return this.emitter.emit('did-select-page-down');
    }
  }, {
    key: 'selectTop',
    value: function selectTop() {
      return this.emitter.emit('did-select-top');
    }
  }, {
    key: 'selectBottom',
    value: function selectBottom() {
      return this.emitter.emit('did-select-bottom');
    }

    /*
    Section: Events
    */

  }, {
    key: 'onDidConfirmSelection',
    value: function onDidConfirmSelection(fn) {
      return this.emitter.on('did-confirm-selection', fn);
    }
  }, {
    key: 'onDidconfirmSelectionIfNonDefault',
    value: function onDidconfirmSelectionIfNonDefault(fn) {
      return this.emitter.on('did-confirm-selection-if-non-default', fn);
    }
  }, {
    key: 'onDidConfirm',
    value: function onDidConfirm(fn) {
      return this.emitter.on('did-confirm', fn);
    }
  }, {
    key: 'onDidSelectNext',
    value: function onDidSelectNext(fn) {
      return this.emitter.on('did-select-next', fn);
    }
  }, {
    key: 'onDidSelectPrevious',
    value: function onDidSelectPrevious(fn) {
      return this.emitter.on('did-select-previous', fn);
    }
  }, {
    key: 'onDidSelectPageUp',
    value: function onDidSelectPageUp(fn) {
      return this.emitter.on('did-select-page-up', fn);
    }
  }, {
    key: 'onDidSelectPageDown',
    value: function onDidSelectPageDown(fn) {
      return this.emitter.on('did-select-page-down', fn);
    }
  }, {
    key: 'onDidSelectTop',
    value: function onDidSelectTop(fn) {
      return this.emitter.on('did-select-top', fn);
    }
  }, {
    key: 'onDidSelectBottom',
    value: function onDidSelectBottom(fn) {
      return this.emitter.on('did-select-bottom', fn);
    }
  }, {
    key: 'onDidCancel',
    value: function onDidCancel(fn) {
      return this.emitter.on('did-cancel', fn);
    }
  }, {
    key: 'onDidDispose',
    value: function onDidDispose(fn) {
      return this.emitter.on('did-dispose', fn);
    }
  }, {
    key: 'onDidChangeItems',
    value: function onDidChangeItems(fn) {
      return this.emitter.on('did-change-items', fn);
    }
  }, {
    key: 'isActive',
    value: function isActive() {
      return this.activeEditor != null;
    }
  }, {
    key: 'show',
    value: function show(editor, options) {
      if (atom.config.get('autocomplete-plus.suggestionListFollows') === 'Cursor') {
        return this.showAtCursorPosition(editor, options);
      } else {
        var prefix = options.prefix;

        var followRawPrefix = false;
        for (var i = 0; i < this.items.length; i++) {
          var item = this.items[i];
          if (item.replacementPrefix != null) {
            prefix = item.replacementPrefix.trim();
            followRawPrefix = true;
            break;
          }
        }
        return this.showAtBeginningOfPrefix(editor, prefix, followRawPrefix);
      }
    }
  }, {
    key: 'showAtBeginningOfPrefix',
    value: function showAtBeginningOfPrefix(editor, prefix) {
      var followRawPrefix = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      if (!editor) {
        return;
      }

      var bufferPosition = editor.getCursorBufferPosition();
      if (followRawPrefix || this.wordPrefixRegex.test(prefix)) {
        bufferPosition = bufferPosition.translate([0, -prefix.length]);
      }

      if (this.activeEditor === editor) {
        if (!bufferPosition.isEqual(this.displayBufferPosition)) {
          this.displayBufferPosition = bufferPosition;
          if (this.suggestionMarker) {
            this.suggestionMarker.setBufferRange([bufferPosition, bufferPosition]);
          }
        }
      } else {
        this.destroyOverlay();
        this.activeEditor = editor;
        this.displayBufferPosition = bufferPosition;
        var marker = this.suggestionMarker = editor.markBufferRange([bufferPosition, bufferPosition]);
        this.overlayDecoration = editor.decorateMarker(marker, { type: 'overlay', item: this, position: 'tail' });
        this.addBindings(editor);
      }
    }
  }, {
    key: 'showAtCursorPosition',
    value: function showAtCursorPosition(editor) {
      if (this.activeEditor === editor || editor == null) {
        return;
      }
      this.destroyOverlay();
      var marker = undefined;
      if (editor.getLastCursor()) {
        marker = editor.getLastCursor().getMarker();
      }
      if (marker) {
        this.activeEditor = editor;
        this.overlayDecoration = editor.decorateMarker(marker, { type: 'overlay', item: this });
        return this.addBindings(editor);
      }
    }
  }, {
    key: 'hide',
    value: function hide() {
      if (this.activeEditor === null) {
        return;
      }
      this.destroyOverlay();
      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }

      this.activeEditor = null;
      return this.activeEditor;
    }
  }, {
    key: 'destroyOverlay',
    value: function destroyOverlay() {
      if (this.suggestionMarker && this.suggestionMarker.destroy) {
        this.suggestionMarker.destroy();
      } else if (this.overlayDecoration && this.overlayDecoration.destroy) {
        this.overlayDecoration.destroy();
      }
      this.suggestionMarker = undefined;
      this.overlayDecoration = undefined;
      return this.overlayDecoration;
    }
  }, {
    key: 'changeItems',
    value: function changeItems(items) {
      this.items = items;
      return this.emitter.emit('did-change-items', this.items);
    }

    // Public: Clean up, stop listening to events
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this.subscriptions) {
        this.subscriptions.dispose();
      }

      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }
      this.emitter.emit('did-dispose');
      return this.emitter.dispose();
    }
  }]);

  return SuggestionList;
})();

exports['default'] = SuggestionList;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N1Z2dlc3Rpb24tbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztvQkFFNkMsTUFBTTs7OEJBQ3BCLG1CQUFtQjs7QUFIbEQsV0FBVyxDQUFBOztJQUtVLGNBQWM7QUFDckIsV0FETyxjQUFjLEdBQ2xCOzs7MEJBREksY0FBYzs7QUFFL0IsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7QUFDM0IsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNwQyxRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3RDLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3hELFFBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2hGLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEMsUUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDdEUsUUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEUsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNoQyxRQUFJLENBQUMs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QU8sRUFBRTtBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3hCO0FBQ0QsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDaEMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzlCOzs7U0E5U2tCLGNBQWM7OztxQkFBZCxjQUFjIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N1Z2dlc3Rpb24tbGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IEVtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgVW5pY29kZUxldHRlcnMgfSBmcm9tICcuL3VuaWNvZGUtaGVscGVycydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3VnZ2VzdGlvbkxpc3Qge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy5jYW5jZWwgPSB0aGlzLmNhbmNlbC5iaW5kKHRoaXMpXG4gICAgdGhpcy5jb25maXJtID0gdGhpcy5jb25maXJtLmJpbmQodGhpcylcbiAgICB0aGlzLmNvbmZpcm1TZWxlY3Rpb24gPSB0aGlzLmNvbmZpcm1TZWxlY3Rpb24uYmluZCh0aGlzKVxuICAgIHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCA9IHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdC5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93ID0gdGhpcy5zaG93LmJpbmQodGhpcylcbiAgICB0aGlzLnNob3dBdEJlZ2lubmluZ09mUHJlZml4ID0gdGhpcy5zaG93QXRCZWdpbm5pbmdPZlByZWZpeC5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93QXRDdXJzb3JQb3NpdGlvbiA9IHRoaXMuc2hvd0F0Q3Vyc29yUG9zaXRpb24uYmluZCh0aGlzKVxuICAgIHRoaXMuaGlkZSA9IHRoaXMuaGlkZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSA9IHRoaXMuZGVzdHJveU92ZXJsYXkuYmluZCh0aGlzKVxuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvci5hdXRvY29tcGxldGUtYWN0aXZlJywge1xuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm0nOiB0aGlzLmNvbmZpcm1TZWxlY3Rpb24sXG4gICAgICAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybUlmTm9uRGVmYXVsdCc6IHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCxcbiAgICAgICdhdXRvY29tcGxldGUtcGx1czpjYW5jZWwnOiB0aGlzLmNhbmNlbFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCcsIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSA9PiB7XG4gICAgICBpZiAoZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCkge1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IG5ldyBSZWdFeHAoYF5bJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXWApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IC9eW1xcdy1dL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMud29yZFByZWZpeFJlZ2V4XG4gICAgfSkpXG4gIH1cblxuICBhZGRCaW5kaW5ncyAoZWRpdG9yKSB7XG4gICAgaWYgKHRoaXMuYmluZGluZ3MgJiYgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmJpbmRpbmdzLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmJpbmRpbmdzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgY29uc3QgY29tcGxldGlvbktleSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuY29uZmlybUNvbXBsZXRpb24nKSB8fCAnJ1xuXG4gICAgY29uc3Qga2V5cyA9IHt9XG4gICAgaWYgKGNvbXBsZXRpb25LZXkuaW5kZXhPZigndGFiJykgPiAtMSkgeyBrZXlzWyd0YWInXSA9ICdhdXRvY29tcGxldGUtcGx1czpjb25maXJtJyB9XG4gICAgaWYgKGNvbXBsZXRpb25LZXkuaW5kZXhPZignZW50ZXInKSA+IC0xKSB7XG4gICAgICBpZiAoY29tcGxldGlvbktleS5pbmRleE9mKCdhbHdheXMnKSA+IC0xKSB7XG4gICAgICAgIGtleXNbJ2VudGVyJ10gPSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybUlmTm9uRGVmYXVsdCdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleXNbJ2VudGVyJ10gPSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJpbmRpbmdzLmFkZChhdG9tLmtleW1hcHMuYWRkKFxuICAgICAgJ2F0b20tdGV4dC1lZGl0b3IuYXV0b2NvbXBsZXRlLWFjdGl2ZScsXG4gICAgICB7J2F0b20tdGV4dC1lZGl0b3IuYXV0b2NvbXBsZXRlLWFjdGl2ZSc6IGtleXN9KVxuICAgIClcblxuICAgIGNvbnN0IHVzZUNvcmVNb3ZlbWVudENvbW1hbmRzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy51c2VDb3JlTW92ZW1lbnRDb21tYW5kcycpXG4gICAgY29uc3QgY29tbWFuZE5hbWVzcGFjZSA9IHVzZUNvcmVNb3ZlbWVudENvbW1hbmRzID8gJ2NvcmUnIDogJ2F1dG9jb21wbGV0ZS1wbHVzJ1xuXG4gICAgY29uc3QgY29tbWFuZHMgPSB7fVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtdXBgXSA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNBY3RpdmUoKSAmJiB0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLnNlbGVjdFByZXZpb3VzKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtZG93bmBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0TmV4dCgpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTpwYWdlLXVwYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQYWdlVXAoKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gICAgY29tbWFuZHNbYCR7Y29tbWFuZE5hbWVzcGFjZX06cGFnZS1kb3duYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQYWdlRG93bigpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTptb3ZlLXRvLXRvcGBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0VG9wKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtdG8tYm90dG9tYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RCb3R0b20oKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJpbmRpbmdzLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgIGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBjb21tYW5kcylcbiAgICApXG5cbiAgICByZXR1cm4gdGhpcy5iaW5kaW5ncy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQ29yZU1vdmVtZW50Q29tbWFuZHMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZEJpbmRpbmdzKGVkaXRvcilcbiAgICAgIH1cbiAgICAgICkpXG4gIH1cblxuICAvKlxuICBTZWN0aW9uOiBFdmVudCBUcmlnZ2Vyc1xuICAqL1xuXG4gIGNhbmNlbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2FuY2VsJylcbiAgfVxuXG4gIGNvbmZpcm0gKG1hdGNoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybScsIG1hdGNoKVxuICB9XG5cbiAgY29uZmlybVNlbGVjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybS1zZWxlY3Rpb24nKVxuICB9XG5cbiAgY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCAoZXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jb25maXJtLXNlbGVjdGlvbi1pZi1ub24tZGVmYXVsdCcsIGV2ZW50KVxuICB9XG5cbiAgc2VsZWN0TmV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LW5leHQnKVxuICB9XG5cbiAgc2VsZWN0UHJldmlvdXMgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1wcmV2aW91cycpXG4gIH1cblxuICBzZWxlY3RQYWdlVXAgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1wYWdlLXVwJylcbiAgfVxuXG4gIHNlbGVjdFBhZ2VEb3duICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtcGFnZS1kb3duJylcbiAgfVxuXG4gIHNlbGVjdFRvcCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LXRvcCcpXG4gIH1cblxuICBzZWxlY3RCb3R0b20gKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1ib3R0b20nKVxuICB9XG5cbiAgLypcbiAgU2VjdGlvbjogRXZlbnRzXG4gICovXG5cbiAgb25EaWRDb25maXJtU2VsZWN0aW9uIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jb25maXJtLXNlbGVjdGlvbicsIGZuKVxuICB9XG5cbiAgb25EaWRjb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0IChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jb25maXJtLXNlbGVjdGlvbi1pZi1ub24tZGVmYXVsdCcsIGZuKVxuICB9XG5cbiAgb25EaWRDb25maXJtIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jb25maXJtJywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdE5leHQgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXNlbGVjdC1uZXh0JywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdFByZXZpb3VzIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtcHJldmlvdXMnLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0UGFnZVVwIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtcGFnZS11cCcsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3RQYWdlRG93biAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LXBhZ2UtZG93bicsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3RUb3AgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXNlbGVjdC10b3AnLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0Qm90dG9tIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtYm90dG9tJywgZm4pXG4gIH1cblxuICBvbkRpZENhbmNlbCAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY2FuY2VsJywgZm4pXG4gIH1cblxuICBvbkRpZERpc3Bvc2UgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWRpc3Bvc2UnLCBmbilcbiAgfVxuXG4gIG9uRGlkQ2hhbmdlSXRlbXMgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWNoYW5nZS1pdGVtcycsIGZuKVxuICB9XG5cbiAgaXNBY3RpdmUgKCkge1xuICAgIHJldHVybiAodGhpcy5hY3RpdmVFZGl0b3IgIT0gbnVsbClcbiAgfVxuXG4gIHNob3cgKGVkaXRvciwgb3B0aW9ucykge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cycpID09PSAnQ3Vyc29yJykge1xuICAgICAgcmV0dXJuIHRoaXMuc2hvd0F0Q3Vyc29yUG9zaXRpb24oZWRpdG9yLCBvcHRpb25zKVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgeyBwcmVmaXggfSA9IG9wdGlvbnNcbiAgICAgIGxldCBmb2xsb3dSYXdQcmVmaXggPSBmYWxzZVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLml0ZW1zW2ldXG4gICAgICAgIGlmIChpdGVtLnJlcGxhY2VtZW50UHJlZml4ICE9IG51bGwpIHtcbiAgICAgICAgICBwcmVmaXggPSBpdGVtLnJlcGxhY2VtZW50UHJlZml4LnRyaW0oKVxuICAgICAgICAgIGZvbGxvd1Jhd1ByZWZpeCA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5zaG93QXRCZWdpbm5pbmdPZlByZWZpeChlZGl0b3IsIHByZWZpeCwgZm9sbG93UmF3UHJlZml4KVxuICAgIH1cbiAgfVxuXG4gIHNob3dBdEJlZ2lubmluZ09mUHJlZml4IChlZGl0b3IsIHByZWZpeCwgZm9sbG93UmF3UHJlZml4ID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IGJ1ZmZlclBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiAoZm9sbG93UmF3UHJlZml4IHx8IHRoaXMud29yZFByZWZpeFJlZ2V4LnRlc3QocHJlZml4KSkge1xuICAgICAgYnVmZmVyUG9zaXRpb24gPSBidWZmZXJQb3NpdGlvbi50cmFuc2xhdGUoWzAsIC1wcmVmaXgubGVuZ3RoXSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IgPT09IGVkaXRvcikge1xuICAgICAgaWYgKCFidWZmZXJQb3NpdGlvbi5pc0VxdWFsKHRoaXMuZGlzcGxheUJ1ZmZlclBvc2l0aW9uKSkge1xuICAgICAgICB0aGlzLmRpc3BsYXlCdWZmZXJQb3NpdGlvbiA9IGJ1ZmZlclBvc2l0aW9uXG4gICAgICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25NYXJrZXIpIHtcbiAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25NYXJrZXIuc2V0QnVmZmVyUmFuZ2UoW2J1ZmZlclBvc2l0aW9uLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpXG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGVkaXRvclxuICAgICAgdGhpcy5kaXNwbGF5QnVmZmVyUG9zaXRpb24gPSBidWZmZXJQb3NpdGlvblxuICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5zdWdnZXN0aW9uTWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbYnVmZmVyUG9zaXRpb24sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICAgIHRoaXMub3ZlcmxheURlY29yYXRpb24gPSBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7dHlwZTogJ292ZXJsYXknLCBpdGVtOiB0aGlzLCBwb3NpdGlvbjogJ3RhaWwnfSlcbiAgICAgIHRoaXMuYWRkQmluZGluZ3MoZWRpdG9yKVxuICAgIH1cbiAgfVxuXG4gIHNob3dBdEN1cnNvclBvc2l0aW9uIChlZGl0b3IpIHtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IgPT09IGVkaXRvciB8fCAoZWRpdG9yID09IG51bGwpKSB7IHJldHVybiB9XG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpXG4gICAgbGV0IG1hcmtlclxuICAgIGlmIChlZGl0b3IuZ2V0TGFzdEN1cnNvcigpKSB7XG4gICAgICBtYXJrZXIgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpXG4gICAgfVxuICAgIGlmIChtYXJrZXIpIHtcbiAgICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gZWRpdG9yXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdvdmVybGF5JywgaXRlbTogdGhpc30pXG4gICAgICByZXR1cm4gdGhpcy5hZGRCaW5kaW5ncyhlZGl0b3IpXG4gICAgfVxuICB9XG5cbiAgaGlkZSAoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yID09PSBudWxsKSB7IHJldHVybiB9XG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpXG4gICAgaWYgKHRoaXMuYmluZGluZ3MgJiYgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmJpbmRpbmdzLmRpc3Bvc2UoKVxuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gbnVsbFxuICAgIHJldHVybiB0aGlzLmFjdGl2ZUVkaXRvclxuICB9XG5cbiAgZGVzdHJveU92ZXJsYXkgKCkge1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25NYXJrZXIgJiYgdGhpcy5zdWdnZXN0aW9uTWFya2VyLmRlc3Ryb3kpIHtcbiAgICAgIHRoaXMuc3VnZ2VzdGlvbk1hcmtlci5kZXN0cm95KClcbiAgICB9IGVsc2UgaWYgKHRoaXMub3ZlcmxheURlY29yYXRpb24gJiYgdGhpcy5vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KSB7XG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKVxuICAgIH1cbiAgICB0aGlzLnN1Z2dlc3Rpb25NYXJrZXIgPSB1bmRlZmluZWRcbiAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheURlY29yYXRpb25cbiAgfVxuXG4gIGNoYW5nZUl0ZW1zIChpdGVtcykge1xuICAgIHRoaXMuaXRlbXMgPSBpdGVtc1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZS1pdGVtcycsIHRoaXMuaXRlbXMpXG4gIH1cblxuICAvLyBQdWJsaWM6IENsZWFuIHVwLCBzdG9wIGxpc3RlbmluZyB0byBldmVudHNcbiAgZGlzcG9zZSAoKSB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmJpbmRpbmdzICYmIHRoaXMuYmluZGluZ3MuZGlzcG9zZSkge1xuICAgICAgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1kaXNwb3NlJylcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=