Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscorePlus = require('underscore-plus');

var _underscorePlus2 = _interopRequireDefault(_underscorePlus);

var _atom = require('atom');

var _selectorKit = require('selector-kit');

var _unicodeHelpers = require('./unicode-helpers');

var _symbolStore = require('./symbol-store');

var _symbolStore2 = _interopRequireDefault(_symbolStore);

'use babel';

var SymbolProvider = (function () {
  function SymbolProvider() {
    var _this = this;

    _classCallCheck(this, SymbolProvider);

    this.defaults();
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.wordRegex = new RegExp('[' + _unicodeHelpers.UnicodeLetters + '\\d_]*[' + _unicodeHelpers.UnicodeLetters + '}_-]+[' + _unicodeHelpers.UnicodeLetters + '}\\d_]*(?=[^' + _unicodeHelpers.UnicodeLetters + '\\d_]|$)', 'g');
        _this.beginningOfLineWordRegex = new RegExp('^[' + _unicodeHelpers.UnicodeLetters + '\\d_]*[' + _unicodeHelpers.UnicodeLetters + '_-]+[' + _unicodeHelpers.UnicodeLetters + '\\d_]*(?=[^' + _unicodeHelpers.UnicodeLetters + '\\d_]|$)', 'g');
        _this.endOfLineWordRegex = new RegExp('[' + _unicodeHelpers.UnicodeLetters + '\\d_]*[' + _unicodeHelpers.UnicodeLetters + '_-]+[' + _unicodeHelpers.UnicodeLetters + '\\d_]*$', 'g');
      } else {
        _this.wordRegex = /\b\w*[a-zA-Z_-]+\w*\b/g;
        _this.beginningOfLineWordRegex = /^\w*[a-zA-Z_-]+\w*\b/g;
        _this.endOfLineWordRegex = /\b\w*[a-zA-Z_-]+\w*$/g;
      }

      _this.symbolStore = new _symbolStore2['default'](_this.wordRegex);
      return _this.symbolStore;
    }));
    this.watchedBuffers = new WeakMap();

    this.subscriptions.add(atom.config.observe('autocomplete-plus.minimumWordLength', function (minimumWordLength) {
      _this.minimumWordLength = minimumWordLength;
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.includeCompletionsFromAllBuffers', function (includeCompletionsFromAllBuffers) {
      _this.includeCompletionsFromAllBuffers = includeCompletionsFromAllBuffers;
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', function (useAlternateScoring) {
      _this.symbolStore.setUseAlternateScoring(useAlternateScoring);
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.useLocalityBonus', function (useLocalityBonus) {
      _this.symbolStore.setUseLocalityBonus(useLocalityBonus);
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.strictMatching', function (useStrictMatching) {
      _this.symbolStore.setUseStrictMatching(useStrictMatching);
    }));
    this.subscriptions.add(atom.workspace.observeActivePaneItem(function (e) {
      _this.updateCurrentEditor(e);
    }));
    this.subscriptions.add(atom.workspace.observeTextEditors(function (e) {
      _this.watchEditor(e);
    }));
  }

  _createClass(SymbolProvider, [{
    key: 'defaults',
    value: function defaults() {
      this.wordRegex = null;
      this.beginningOfLineWordRegex = null;
      this.endOfLineWordRegex = null;
      this.symbolStore = null;
      this.editor = null;
      this.buffer = null;
      this.changeUpdateDelay = 300;

      this.textEditorSelectors = new Set(['atom-pane > .item-views > atom-text-editor']);
      this.scopeSelector = '*';
      this.inclusionPriority = 0;
      this.suggestionPriority = 0;

      this.watchedBuffers = null;

      this.config = null;
      this.defaultConfig = {
        'class': {
          selector: '.class.name, .inherited-class, .instance.type',
          typePriority: 4
        },
        'function': {
          selector: '.function.name',
          typePriority: 3
        },
        variable: {
          selector: '.variable',
          typePriority: 2
        },
        '': {
          selector: '.source',
          typePriority: 1
        }
      };
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      return this.subscriptions.dispose();
    }
  }, {
    key: 'addTextEditorSelector',
    value: function addTextEditorSelector(selector) {
      var _this2 = this;

      this.textEditorSelectors.add(selector);
      return new _atom.Disposable(function () {
        return _this2.textEditorSelectors['delete'](selector);
      });
    }
  }, {
    key: 'getTextEditorSelector',
    value: function getTextEditorSelector() {
      return Array.from(this.textEditorSelectors).join(', ');
    }
  }, {
    key: 'watchEditor',
    value: function watchEditor(editor) {
      var _this3 = this;

      var bufferEditors = undefined;
      var buffer = editor.getBuffer();
      var editorSubscriptions = new _atom.CompositeDisposable();
      editorSubscriptions.add(editor.onDidTokenize(function () {
        return _this3.buildWordListOnNextTick(editor);
      }));
      editorSubscriptions.add(editor.onDidDestroy(function () {
        var index = _this3.getWatchedEditorIndex(editor);
        var editors = _this3.watchedBuffers.get(editor.getBuffer());
        if (index > -1) {
          editors.splice(index, 1);
        }
        return editorSubscriptions.dispose();
      }));

      bufferEditors = this.watchedBuffers.get(buffer);
      if (bufferEditors) {
        bufferEditors.push(editor);
      } else {
        (function () {
          var bufferSubscriptions = new _atom.CompositeDisposable();
          bufferSubscriptions.add(buffer.onDidStopChanging(function (_ref) {
            var changes = _ref.changes;

            var editors = _this3.watchedBuffers.get(buffer);
            if (!editors) {
              editors = [];
            }
            if (editors && editors.length > 0 && editors[0] && !editors[0].largeFileMode) {
              for (var _ref22 of changes) {
                var start = _ref22.start;
                var oldExtent = _ref22.oldExtent;
                var newExtent = _ref22.newExtent;

                _this3.symbolStore.recomputeSymbolsForEditorInBufferRange(editors[0], start, oldExtent, newExtent);
              }
            }
          }));
          bufferSubscriptions.add(buffer.onDidDestroy(function () {
            _this3.symbolStore.clear(buffer);
            bufferSubscriptions.dispose();
            return _this3.watchedBuffers['delete'](buffer);
          }));

          _this3.watchedBuffers.set(buffer, [editor]);
          _this3.buildWordListOnNextTick(editor);
        })();
      }
    }
  }, {
    key: 'isWatchingEditor',
    value: function isWatchingEditor(editor) {
      return this.getWatchedEditorIndex(editor) > -1;
    }
  }, {
    key: 'isWatchingBuffer',
    value: function isWatchingBuffer(buffer) {
      return this.watchedBuffers.get(buffer) != null;
    }
  }, {
    key: 'getWatchedEditorIndex',
    value: function getWatchedEditorIndex(editor) {
      var editors = this.watchedBuffers.get(editor.getBuffer());
      if (editors) {
        return editors.indexOf(editor);
      } else {
        return -1;
      }
    }
  }, {
    key: 'updateCurrentEditor',
    value: function updateCurrentEditor(currentPaneItem) {
      if (currentPaneItem == null) {
        return;
      }
      if (currentPaneItem === this.editor) {
        return;
      }
      this.editor = null;
      if (this.paneItemIsValid(currentPaneItem)) {
        this.editor = currentPaneItem;
        return this.editor;
      }
    }
  }, {
    key: 'buildConfigIfScopeChanged',
    value: function buildConfigIfScopeChanged(_ref3) {
      var editor = _ref3.editor;
      var scopeDescriptor = _ref3.scopeDescriptor;

      if (!this.scopeDescriptorsEqual(this.configScopeDescriptor, scopeDescriptor)) {
        this.buildConfig(scopeDescriptor);
        this.configScopeDescriptor = scopeDescriptor;
        return this.configScopeDescriptor;
      }
    }
  }, {
    key: 'buildConfig',
    value: function buildConfig(scopeDescriptor) {
      this.config = {};
      var legacyCompletions = this.settingsForScopeDescriptor(scopeDescriptor, 'editor.completions');
      var allConfigEntries = this.settingsForScopeDescriptor(scopeDescriptor, 'autocomplete.symbols');

      // Config entries are reverse sorted in order of specificity. We want most
      // specific to win; this simplifies the loop.
      allConfigEntries.reverse();

      for (var i = 0; i < legacyCompletions.length; i++) {
        var value = legacyCompletions[i].value;

        if (Array.isArray(value) && value.length) {
          this.addLegacyConfigEntry(value);
        }
      }

      var addedConfigEntry = false;
      for (var j = 0; j < allConfigEntries.length; j++) {
        var value = allConfigEntries[j].value;

        if (!Array.isArray(value) && typeof value === 'object') {
          this.addConfigEntry(value);
          addedConfigEntry = true;
        }
      }

      if (!addedConfigEntry) {
        return this.addConfigEntry(this.defaultConfig);
      }
    }
  }, {
    key: 'addLegacyConfigEntry',
    value: function addLegacyConfigEntry(suggestions) {
      suggestions = suggestions.map(function (suggestion) {
        return { text: suggestion, type: 'builtin' };
      });
      if (this.config.builtin == null) {
        this.config.builtin = { suggestions: [] };
      }
      this.config.builtin.suggestions = this.config.builtin.suggestions.concat(suggestions);
      return this.config.builtin.suggestions;
    }
  }, {
    key: 'addConfigEntry',
    value: function addConfigEntry(config) {
      for (var type in config) {
        var options = config[type];
        if (this.config[type] == null) {
          this.config[type] = {};
        }
        if (options.selector != null) {
          this.config[type].selectors = _selectorKit.Selector.create(options.selector);
        }
        this.config[type].typePriority = options.typePriority != null ? options.typePriority : 1;
        this.config[type].wordRegex = this.wordRegex;

        var suggestions = this.sanitizeSuggestionsFromConfig(options.suggestions, type);
        if (suggestions != null && suggestions.length) {
          this.config[type].suggestions = suggestions;
        }
      }
    }
  }, {
    key: 'sanitizeSuggestionsFromConfig',
    value: function sanitizeSuggestionsFromConfig(suggestions, type) {
      if (suggestions != null && Array.isArray(suggestions)) {
        var sanitizedSuggestions = [];
        for (var i = 0; i < suggestions.length; i++) {
          var suggestion = suggestions[i];
          if (typeof suggestion === 'string') {
            sanitizedSuggestions.push({ text: suggestion, type: type });
          } else if (typeof suggestions[0] === 'object' && (suggestion.text != null || suggestion.snippet != null)) {
            suggestion = _underscorePlus2['default'].clone(suggestion);
            if (suggestion.type == null) {
              suggestion.type = type;
            }
            sanitizedSuggestions.push(suggestion);
          }
        }
        return sanitizedSuggestions;
      } else {
        return null;
      }
    }
  }, {
    key: 'uniqueFilter',
    value: function uniqueFilter(completion) {
      return completion.text;
    }
  }, {
    key: 'paneItemIsValid',
    value: function paneItemIsValid(paneItem) {
      // TODO: remove conditional when `isTextEditor` is shipped.
      if (typeof atom.workspace.isTextEditor === 'function') {
        return atom.workspace.isTextEditor(paneItem);
      } else {
        if (paneItem == null) {
          return false;
        }
        // Should we disqualify TextEditors with the Grammar text.plain.null-grammar?
        return paneItem.getText != null;
      }
    }

    /*
    Section: Suggesting Completions
    */

  }, {
    key: 'getSuggestions',
    value: function getSuggestions(options) {
      if (!options.prefix) {
        return;
      }

      if (options.prefix.trim().length < this.minimumWordLength) {
        return;
      }

      this.buildConfigIfScopeChanged(options);
      var editor = options.editor;
      var bufferPosition = options.bufferPosition;
      var prefix = options.prefix;

      var numberOfWordsMatchingPrefix = 1;
      var wordUnderCursor = this.wordAtBufferPosition(editor, bufferPosition);
      var iterable = editor.getCursors();
      for (var i = 0; i < iterable.length; i++) {
        var cursor = iterable[i];
        if (cursor === editor.getLastCursor()) {
          continue;
        }
        var word = this.wordAtBufferPosition(editor, cursor.getBufferPosition());
        if (word === wordUnderCursor) {
          numberOfWordsMatchingPrefix += 1;
        }
      }

      var buffers = this.includeCompletionsFromAllBuffers ? null : [this.editor.getBuffer()];
      var symbolList = this.symbolStore.symbolsForConfig(this.config, buffers, prefix, wordUnderCursor, bufferPosition.row, numberOfWordsMatchingPrefix);

      symbolList.sort(function (a, b) {
        return b.score * b.localityScore - a.score * a.localityScore;
      });
      return symbolList.slice(0, 20).map(function (a) {
        return a.symbol;
      });
    }
  }, {
    key: 'wordAtBufferPosition',
    value: function wordAtBufferPosition(editor, bufferPosition) {
      var lineToPosition = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      var prefix = lineToPosition.match(this.endOfLineWordRegex);
      if (prefix) {
        prefix = prefix[0];
      } else {
        prefix = '';
      }

      var lineFromPosition = editor.getTextInRange([bufferPosition, [bufferPosition.row, Infinity]]);
      var suffix = lineFromPosition.match(this.beginningOfLineWordRegex);
      if (suffix) {
        suffix = suffix[0];
      } else {
        suffix = '';
      }

      return prefix + suffix;
    }
  }, {
    key: 'settingsForScopeDescriptor',
    value: function settingsForScopeDescriptor(scopeDescriptor, keyPath) {
      return atom.config.getAll(keyPath, { scope: scopeDescriptor });
    }

    /*
    Section: Word List Building
    */

  }, {
    key: 'buildWordListOnNextTick',
    value: function buildWordListOnNextTick(editor) {
      var _this4 = this;

      return _underscorePlus2['default'].defer(function () {
        if (editor && editor.isAlive() && !editor.largeFileMode) {
          var start = { row: 0, column: 0 };
          var oldExtent = { row: 0, column: 0 };
          var newExtent = editor.getBuffer().getRange().getExtent();
          return _this4.symbolStore.recomputeSymbolsForEditorInBufferRange(editor, start, oldExtent, newExtent);
        }
      });
    }

    // FIXME: this should go in the core ScopeDescriptor class
  }, {
    key: 'scopeDescriptorsEqual',
    value: function scopeDescriptorsEqual(a, b) {
      if (a === b) {
        return true;
      }
      if (a == null || b == null) {
        return false;
      }

      var arrayA = a.getScopesArray();
      var arrayB = b.getScopesArray();

      if (arrayA.length !== arrayB.length) {
        return false;
      }

      for (var i = 0; i < arrayA.length; i++) {
        var scope = arrayA[i];
        if (scope !== arrayB[i]) {
          return false;
        }
      }
      return true;
    }
  }]);

  return SymbolProvider;
})();

exports['default'] = SymbolProvider;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N5bWJvbC1wcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OzhCQUVjLGlCQUFpQjs7OztvQkFDaUIsTUFBTTs7MkJBQzdCLGNBQWM7OzhCQUNSLG1CQUFtQjs7MkJBQzFCLGdCQUFnQjs7OztBQU54QyxXQUFXLENBQUE7O0lBUVUsY0FBYztBQUNyQixXQURPLGNBQWMsR0FDbEI7OzswQkFESSxjQUFjOztBQUUvQixRQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDZixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQzlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdEQUFnRCxFQUFFLFVBQUEsNEJBQTRCLEVBQUk7QUFDM0gsVUFBSSw0QkFBNEIsRUFBRTtBQUNoQyxjQUFLLFNBQVMsR0FBRyxJQUFJLE1BQU0sK0xBQTJHLEdBQUcsQ0FBQyxDQUFBO0FBQzFJLGNBQUssd0JBQXdCLEdBQUcsSUFBSSxNQUFNLDhMQUEwRyxHQUFHLENBQUMsQ0FBQTtBQUN4SixjQUFLLGtCQUFrQixHQUFHLElBQUksTUFBTSwySUFBNEUsR0FBRyxDQUFDLENBQUE7T0FDckgsTUFBTTtBQUNMLGNBQUssU0FBUyxHQUFHLHdCQUF3QixDQUFBO0FBQ3pDLGNBQUssd0JBQXdCLEdBQUcsdUJBQXVCLENBQUE7QUFDdkQsY0FBSyxrQkFBa0IsR0FBRyx1QkFBdUIsQ0FBQTtPQUNsRDs7QUFFRCxZQUFLLFdBQVcsR0FBRyw2QkFBZ0IsTUFBSyxTQUFTLENBQUMsQ0FBQTtBQUNsRCxhQUFPLE1BQUssV0FBVyxDQUFBO0tBQ3hCLENBQUMsQ0FBQyxDQUFBO0FBQ0gsUUFBSSxDQUFDLGNBQWMsR0FBRyxJ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akMsVUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBOztBQUVqQyxVQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUFFLGVBQU8sS0FBSyxDQUFBO09BQUU7O0FBRXJELFdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RDLFlBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN2QixZQUFJLEtBQUssS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFBRSxpQkFBTyxLQUFLLENBQUE7U0FBRTtPQUMxQztBQUNELGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztTQXZWa0IsY0FBYzs7O3FCQUFkLGNBQWMiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvc3ltYm9sLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZS1wbHVzJ1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBTZWxlY3RvciB9IGZyb20gJ3NlbGVjdG9yLWtpdCdcbmltcG9ydCB7IFVuaWNvZGVMZXR0ZXJzIH0gZnJvbSAnLi91bmljb2RlLWhlbHBlcnMnXG5pbXBvcnQgU3ltYm9sU3RvcmUgZnJvbSAnLi9zeW1ib2wtc3RvcmUnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN5bWJvbFByb3ZpZGVyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuZGVmYXVsdHMoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQnLCBlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0ID0+IHtcbiAgICAgIGlmIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSB7XG4gICAgICAgIHRoaXMud29yZFJlZ2V4ID0gbmV3IFJlZ0V4cChgWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXSpbJHtVbmljb2RlTGV0dGVyc319Xy1dK1ske1VuaWNvZGVMZXR0ZXJzfX1cXFxcZF9dKig/PVteJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dfCQpYCwgJ2cnKVxuICAgICAgICB0aGlzLmJlZ2lubmluZ09mTGluZVdvcmRSZWdleCA9IG5ldyBSZWdFeHAoYF5bJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dKlske1VuaWNvZGVMZXR0ZXJzfV8tXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dKig/PVteJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dfCQpYCwgJ2cnKVxuICAgICAgICB0aGlzLmVuZE9mTGluZVdvcmRSZWdleCA9IG5ldyBSZWdFeHAoYFske1VuaWNvZGVMZXR0ZXJzfVxcXFxkX10qWyR7VW5pY29kZUxldHRlcnN9Xy1dK1ske1VuaWNvZGVMZXR0ZXJzfVxcXFxkX10qJGAsICdnJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMud29yZFJlZ2V4ID0gL1xcYlxcdypbYS16QS1aXy1dK1xcdypcXGIvZ1xuICAgICAgICB0aGlzLmJlZ2lubmluZ09mTGluZVdvcmRSZWdleCA9IC9eXFx3KlthLXpBLVpfLV0rXFx3KlxcYi9nXG4gICAgICAgIHRoaXMuZW5kT2ZMaW5lV29yZFJlZ2V4ID0gL1xcYlxcdypbYS16QS1aXy1dK1xcdyokL2dcbiAgICAgIH1cblxuICAgICAgdGhpcy5zeW1ib2xTdG9yZSA9IG5ldyBTeW1ib2xTdG9yZSh0aGlzLndvcmRSZWdleClcbiAgICAgIHJldHVybiB0aGlzLnN5bWJvbFN0b3JlXG4gICAgfSkpXG4gICAgdGhpcy53YXRjaGVkQnVmZmVycyA9IG5ldyBXZWFrTWFwKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGgnLCAobWluaW11bVdvcmRMZW5ndGgpID0+IHtcbiAgICAgIHRoaXMubWluaW11bVdvcmRMZW5ndGggPSBtaW5pbXVtV29yZExlbmd0aFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuaW5jbHVkZUNvbXBsZXRpb25zRnJvbUFsbEJ1ZmZlcnMnLCAoaW5jbHVkZUNvbXBsZXRpb25zRnJvbUFsbEJ1ZmZlcnMpID0+IHtcbiAgICAgIHRoaXMuaW5jbHVkZUNvbXBsZXRpb25zRnJvbUFsbEJ1ZmZlcnMgPSBpbmNsdWRlQ29tcGxldGlvbnNGcm9tQWxsQnVmZmVyc1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsICh1c2VBbHRlcm5hdGVTY29yaW5nKSA9PiB7XG4gICAgICB0aGlzLnN5bWJvbFN0b3JlLnNldFVzZUFsdGVybmF0ZVNjb3JpbmcodXNlQWx0ZXJuYXRlU2NvcmluZylcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnVzZUxvY2FsaXR5Qm9udXMnLCAodXNlTG9jYWxpdHlCb251cykgPT4ge1xuICAgICAgdGhpcy5zeW1ib2xTdG9yZS5zZXRVc2VMb2NhbGl0eUJvbnVzKHVzZUxvY2FsaXR5Qm9udXMpXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5zdHJpY3RNYXRjaGluZycsICh1c2VTdHJpY3RNYXRjaGluZykgPT4ge1xuICAgICAgdGhpcy5zeW1ib2xTdG9yZS5zZXRVc2VTdHJpY3RNYXRjaGluZyh1c2VTdHJpY3RNYXRjaGluZylcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgoZSkgPT4geyB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IoZSkgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGUpID0+IHsgdGhpcy53YXRjaEVkaXRvcihlKSB9KSlcbiAgfVxuXG4gIGRlZmF1bHRzICgpIHtcbiAgICB0aGlzLndvcmRSZWdleCA9IG51bGxcbiAgICB0aGlzLmJlZ2lubmluZ09mTGluZVdvcmRSZWdleCA9IG51bGxcbiAgICB0aGlzLmVuZE9mTGluZVdvcmRSZWdleCA9IG51bGxcbiAgICB0aGlzLnN5bWJvbFN0b3JlID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuYnVmZmVyID0gbnVsbFxuICAgIHRoaXMuY2hhbmdlVXBkYXRlRGVsYXkgPSAzMDBcblxuICAgIHRoaXMudGV4dEVkaXRvclNlbGVjdG9ycyA9IG5ldyBTZXQoWydhdG9tLXBhbmUgPiAuaXRlbS12aWV3cyA+IGF0b20tdGV4dC1lZGl0b3InXSlcbiAgICB0aGlzLnNjb3BlU2VsZWN0b3IgPSAnKidcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gMFxuICAgIHRoaXMuc3VnZ2VzdGlvblByaW9yaXR5ID0gMFxuXG4gICAgdGhpcy53YXRjaGVkQnVmZmVycyA9IG51bGxcblxuICAgIHRoaXMuY29uZmlnID0gbnVsbFxuICAgIHRoaXMuZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgIGNsYXNzOiB7XG4gICAgICAgIHNlbGVjdG9yOiAnLmNsYXNzLm5hbWUsIC5pbmhlcml0ZWQtY2xhc3MsIC5pbnN0YW5jZS50eXBlJyxcbiAgICAgICAgdHlwZVByaW9yaXR5OiA0XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb246IHtcbiAgICAgICAgc2VsZWN0b3I6ICcuZnVuY3Rpb24ubmFtZScsXG4gICAgICAgIHR5cGVQcmlvcml0eTogM1xuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIHNlbGVjdG9yOiAnLnZhcmlhYmxlJyxcbiAgICAgICAgdHlwZVByaW9yaXR5OiAyXG4gICAgICB9LFxuICAgICAgJyc6IHtcbiAgICAgICAgc2VsZWN0b3I6ICcuc291cmNlJyxcbiAgICAgICAgdHlwZVByaW9yaXR5OiAxXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZGlzcG9zZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxuXG4gIGFkZFRleHRFZGl0b3JTZWxlY3RvciAoc2VsZWN0b3IpIHtcbiAgICB0aGlzLnRleHRFZGl0b3JTZWxlY3RvcnMuYWRkKHNlbGVjdG9yKVxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB0aGlzLnRleHRFZGl0b3JTZWxlY3RvcnMuZGVsZXRlKHNlbGVjdG9yKSlcbiAgfVxuXG4gIGdldFRleHRFZGl0b3JTZWxlY3RvciAoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy50ZXh0RWRpdG9yU2VsZWN0b3JzKS5qb2luKCcsICcpXG4gIH1cblxuICB3YXRjaEVkaXRvciAoZWRpdG9yKSB7XG4gICAgbGV0IGJ1ZmZlckVkaXRvcnNcbiAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKClcbiAgICBjb25zdCBlZGl0b3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKGVkaXRvci5vbkRpZFRva2VuaXplKCgpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmJ1aWxkV29yZExpc3RPbk5leHRUaWNrKGVkaXRvcilcbiAgICB9KSlcbiAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nZXRXYXRjaGVkRWRpdG9ySW5kZXgoZWRpdG9yKVxuICAgICAgY29uc3QgZWRpdG9ycyA9IHRoaXMud2F0Y2hlZEJ1ZmZlcnMuZ2V0KGVkaXRvci5nZXRCdWZmZXIoKSlcbiAgICAgIGlmIChpbmRleCA+IC0xKSB7IGVkaXRvcnMuc3BsaWNlKGluZGV4LCAxKSB9XG4gICAgICByZXR1cm4gZWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9KSlcblxuICAgIGJ1ZmZlckVkaXRvcnMgPSB0aGlzLndhdGNoZWRCdWZmZXJzLmdldChidWZmZXIpXG4gICAgaWYgKGJ1ZmZlckVkaXRvcnMpIHtcbiAgICAgIGJ1ZmZlckVkaXRvcnMucHVzaChlZGl0b3IpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJ1ZmZlclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICBidWZmZXJTdWJzY3JpcHRpb25zLmFkZChidWZmZXIub25EaWRTdG9wQ2hhbmdpbmcoKHtjaGFuZ2VzfSkgPT4ge1xuICAgICAgICBsZXQgZWRpdG9ycyA9IHRoaXMud2F0Y2hlZEJ1ZmZlcnMuZ2V0KGJ1ZmZlcilcbiAgICAgICAgaWYgKCFlZGl0b3JzKSB7XG4gICAgICAgICAgZWRpdG9ycyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVkaXRvcnMgJiYgZWRpdG9ycy5sZW5ndGggPiAwICYmIGVkaXRvcnNbMF0gJiYgIWVkaXRvcnNbMF0ubGFyZ2VGaWxlTW9kZSkge1xuICAgICAgICAgIGZvciAoY29uc3Qge3N0YXJ0LCBvbGRFeHRlbnQsIG5ld0V4dGVudH0gb2YgY2hhbmdlcykge1xuICAgICAgICAgICAgdGhpcy5zeW1ib2xTdG9yZS5yZWNvbXB1dGVTeW1ib2xzRm9yRWRpdG9ySW5CdWZmZXJSYW5nZShlZGl0b3JzWzBdLCBzdGFydCwgb2xkRXh0ZW50LCBuZXdFeHRlbnQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSlcbiAgICAgIGJ1ZmZlclN1YnNjcmlwdGlvbnMuYWRkKGJ1ZmZlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICB0aGlzLnN5bWJvbFN0b3JlLmNsZWFyKGJ1ZmZlcilcbiAgICAgICAgYnVmZmVyU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgICAgcmV0dXJuIHRoaXMud2F0Y2hlZEJ1ZmZlcnMuZGVsZXRlKGJ1ZmZlcilcbiAgICAgIH0pKVxuXG4gICAgICB0aGlzLndhdGNoZWRCdWZmZXJzLnNldChidWZmZXIsIFtlZGl0b3JdKVxuICAgICAgdGhpcy5idWlsZFdvcmRMaXN0T25OZXh0VGljayhlZGl0b3IpXG4gICAgfVxuICB9XG5cbiAgaXNXYXRjaGluZ0VkaXRvciAoZWRpdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0V2F0Y2hlZEVkaXRvckluZGV4KGVkaXRvcikgPiAtMVxuICB9XG5cbiAgaXNXYXRjaGluZ0J1ZmZlciAoYnVmZmVyKSB7XG4gICAgcmV0dXJuICh0aGlzLndhdGNoZWRCdWZmZXJzLmdldChidWZmZXIpICE9IG51bGwpXG4gIH1cblxuICBnZXRXYXRjaGVkRWRpdG9ySW5kZXggKGVkaXRvcikge1xuICAgIGNvbnN0IGVkaXRvcnMgPSB0aGlzLndhdGNoZWRCdWZmZXJzLmdldChlZGl0b3IuZ2V0QnVmZmVyKCkpXG4gICAgaWYgKGVkaXRvcnMpIHtcbiAgICAgIHJldHVybiBlZGl0b3JzLmluZGV4T2YoZWRpdG9yKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gIH1cblxuICB1cGRhdGVDdXJyZW50RWRpdG9yIChjdXJyZW50UGFuZUl0ZW0pIHtcbiAgICBpZiAoY3VycmVudFBhbmVJdGVtID09IG51bGwpIHsgcmV0dXJuIH1cbiAgICBpZiAoY3VycmVudFBhbmVJdGVtID09PSB0aGlzLmVkaXRvcikgeyByZXR1cm4gfVxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIGlmICh0aGlzLnBhbmVJdGVtSXNWYWxpZChjdXJyZW50UGFuZUl0ZW0pKSB7XG4gICAgICB0aGlzLmVkaXRvciA9IGN1cnJlbnRQYW5lSXRlbVxuICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yXG4gICAgfVxuICB9XG5cbiAgYnVpbGRDb25maWdJZlNjb3BlQ2hhbmdlZCAoe2VkaXRvciwgc2NvcGVEZXNjcmlwdG9yfSkge1xuICAgIGlmICghdGhpcy5zY29wZURlc2NyaXB0b3JzRXF1YWwodGhpcy5jb25maWdTY29wZURlc2NyaXB0b3IsIHNjb3BlRGVzY3JpcHRvcikpIHtcbiAgICAgIHRoaXMuYnVpbGRDb25maWcoc2NvcGVEZXNjcmlwdG9yKVxuICAgICAgdGhpcy5jb25maWdTY29wZURlc2NyaXB0b3IgPSBzY29wZURlc2NyaXB0b3JcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ1Njb3BlRGVzY3JpcHRvclxuICAgIH1cbiAgfVxuXG4gIGJ1aWxkQ29uZmlnIChzY29wZURlc2NyaXB0b3IpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHt9XG4gICAgY29uc3QgbGVnYWN5Q29tcGxldGlvbnMgPSB0aGlzLnNldHRpbmdzRm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvciwgJ2VkaXRvci5jb21wbGV0aW9ucycpXG4gICAgY29uc3QgYWxsQ29uZmlnRW50cmllcyA9IHRoaXMuc2V0dGluZ3NGb3JTY29wZURlc2NyaXB0b3Ioc2NvcGVEZXNjcmlwdG9yLCAnYXV0b2NvbXBsZXRlLnN5bWJvbHMnKVxuXG4gICAgLy8gQ29uZmlnIGVudHJpZXMgYXJlIHJldmVyc2Ugc29ydGVkIGluIG9yZGVyIG9mIHNwZWNpZmljaXR5LiBXZSB3YW50IG1vc3RcbiAgICAvLyBzcGVjaWZpYyB0byB3aW47IHRoaXMgc2ltcGxpZmllcyB0aGUgbG9vcC5cbiAgICBhbGxDb25maWdFbnRyaWVzLnJldmVyc2UoKVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZWdhY3lDb21wbGV0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgeyB2YWx1ZSB9ID0gbGVnYWN5Q29tcGxldGlvbnNbaV1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5hZGRMZWdhY3lDb25maWdFbnRyeSh2YWx1ZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgYWRkZWRDb25maWdFbnRyeSA9IGZhbHNlXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhbGxDb25maWdFbnRyaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB7IHZhbHVlIH0gPSBhbGxDb25maWdFbnRyaWVzW2pdXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhpcy5hZGRDb25maWdFbnRyeSh2YWx1ZSlcbiAgICAgICAgYWRkZWRDb25maWdFbnRyeSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWFkZGVkQ29uZmlnRW50cnkpIHsgcmV0dXJuIHRoaXMuYWRkQ29uZmlnRW50cnkodGhpcy5kZWZhdWx0Q29uZmlnKSB9XG4gIH1cblxuICBhZGRMZWdhY3lDb25maWdFbnRyeSAoc3VnZ2VzdGlvbnMpIHtcbiAgICBzdWdnZXN0aW9ucyA9IChzdWdnZXN0aW9ucy5tYXAoKHN1Z2dlc3Rpb24pID0+ICh7dGV4dDogc3VnZ2VzdGlvbiwgdHlwZTogJ2J1aWx0aW4nfSkpKVxuICAgIGlmICh0aGlzLmNvbmZpZy5idWlsdGluID09IG51bGwpIHtcbiAgICAgIHRoaXMuY29uZmlnLmJ1aWx0aW4gPSB7c3VnZ2VzdGlvbnM6IFtdfVxuICAgIH1cbiAgICB0aGlzLmNvbmZpZy5idWlsdGluLnN1Z2dlc3Rpb25zID0gdGhpcy5jb25maWcuYnVpbHRpbi5zdWdnZXN0aW9ucy5jb25jYXQoc3VnZ2VzdGlvbnMpXG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmJ1aWx0aW4uc3VnZ2VzdGlvbnNcbiAgfVxuXG4gIGFkZENvbmZpZ0VudHJ5IChjb25maWcpIHtcbiAgICBmb3IgKGNvbnN0IHR5cGUgaW4gY29uZmlnKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gY29uZmlnW3R5cGVdXG4gICAgICBpZiAodGhpcy5jb25maWdbdHlwZV0gPT0gbnVsbCkgeyB0aGlzLmNvbmZpZ1t0eXBlXSA9IHt9IH1cbiAgICAgIGlmIChvcHRpb25zLnNlbGVjdG9yICE9IG51bGwpIHsgdGhpcy5jb25maWdbdHlwZV0uc2VsZWN0b3JzID0gU2VsZWN0b3IuY3JlYXRlKG9wdGlvbnMuc2VsZWN0b3IpIH1cbiAgICAgIHRoaXMuY29uZmlnW3R5cGVdLnR5cGVQcmlvcml0eSA9IG9wdGlvbnMudHlwZVByaW9yaXR5ICE9IG51bGwgPyBvcHRpb25zLnR5cGVQcmlvcml0eSA6IDFcbiAgICAgIHRoaXMuY29uZmlnW3R5cGVdLndvcmRSZWdleCA9IHRoaXMud29yZFJlZ2V4XG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gdGhpcy5zYW5pdGl6ZVN1Z2dlc3Rpb25zRnJvbUNvbmZpZyhvcHRpb25zLnN1Z2dlc3Rpb25zLCB0eXBlKVxuICAgICAgaWYgKChzdWdnZXN0aW9ucyAhPSBudWxsKSAmJiBzdWdnZXN0aW9ucy5sZW5ndGgpIHsgdGhpcy5jb25maWdbdHlwZV0uc3VnZ2VzdGlvbnMgPSBzdWdnZXN0aW9ucyB9XG4gICAgfVxuICB9XG5cbiAgc2FuaXRpemVTdWdnZXN0aW9uc0Zyb21Db25maWcgKHN1Z2dlc3Rpb25zLCB0eXBlKSB7XG4gICAgaWYgKChzdWdnZXN0aW9ucyAhPSBudWxsKSAmJiBBcnJheS5pc0FycmF5KHN1Z2dlc3Rpb25zKSkge1xuICAgICAgY29uc3Qgc2FuaXRpemVkU3VnZ2VzdGlvbnMgPSBbXVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICAgIGlmICh0eXBlb2Ygc3VnZ2VzdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBzYW5pdGl6ZWRTdWdnZXN0aW9ucy5wdXNoKHt0ZXh0OiBzdWdnZXN0aW9uLCB0eXBlfSlcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VnZ2VzdGlvbnNbMF0gPT09ICdvYmplY3QnICYmICgoc3VnZ2VzdGlvbi50ZXh0ICE9IG51bGwpIHx8IChzdWdnZXN0aW9uLnNuaXBwZXQgIT0gbnVsbCkpKSB7XG4gICAgICAgICAgc3VnZ2VzdGlvbiA9IF8uY2xvbmUoc3VnZ2VzdGlvbilcbiAgICAgICAgICBpZiAoc3VnZ2VzdGlvbi50eXBlID09IG51bGwpIHsgc3VnZ2VzdGlvbi50eXBlID0gdHlwZSB9XG4gICAgICAgICAgc2FuaXRpemVkU3VnZ2VzdGlvbnMucHVzaChzdWdnZXN0aW9uKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc2FuaXRpemVkU3VnZ2VzdGlvbnNcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICB1bmlxdWVGaWx0ZXIgKGNvbXBsZXRpb24pIHsgcmV0dXJuIGNvbXBsZXRpb24udGV4dCB9XG5cbiAgcGFuZUl0ZW1Jc1ZhbGlkIChwYW5lSXRlbSkge1xuICAgIC8vIFRPRE86IHJlbW92ZSBjb25kaXRpb25hbCB3aGVuIGBpc1RleHRFZGl0b3JgIGlzIHNoaXBwZWQuXG4gICAgaWYgKHR5cGVvZiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZUl0ZW0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwYW5lSXRlbSA9PSBudWxsKSB7IHJldHVybiBmYWxzZSB9XG4gICAgICAvLyBTaG91bGQgd2UgZGlzcXVhbGlmeSBUZXh0RWRpdG9ycyB3aXRoIHRoZSBHcmFtbWFyIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyP1xuICAgICAgcmV0dXJuIChwYW5lSXRlbS5nZXRUZXh0ICE9IG51bGwpXG4gICAgfVxuICB9XG5cbiAgLypcbiAgU2VjdGlvbjogU3VnZ2VzdGluZyBDb21wbGV0aW9uc1xuICAqL1xuXG4gIGdldFN1Z2dlc3Rpb25zIChvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zLnByZWZpeCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucHJlZml4LnRyaW0oKS5sZW5ndGggPCB0aGlzLm1pbmltdW1Xb3JkTGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmJ1aWxkQ29uZmlnSWZTY29wZUNoYW5nZWQob3B0aW9ucylcbiAgICBjb25zdCBlZGl0b3IgPSBvcHRpb25zLmVkaXRvclxuICAgIGNvbnN0IGJ1ZmZlclBvc2l0aW9uID0gb3B0aW9ucy5idWZmZXJQb3NpdGlvblxuICAgIGNvbnN0IHByZWZpeCA9IG9wdGlvbnMucHJlZml4XG5cbiAgICBsZXQgbnVtYmVyT2ZXb3Jkc01hdGNoaW5nUHJlZml4ID0gMVxuICAgIGNvbnN0IHdvcmRVbmRlckN1cnNvciA9IHRoaXMud29yZEF0QnVmZmVyUG9zaXRpb24oZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcbiAgICBjb25zdCBpdGVyYWJsZSA9IGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhYmxlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJzb3IgPSBpdGVyYWJsZVtpXVxuICAgICAgaWYgKGN1cnNvciA9PT0gZWRpdG9yLmdldExhc3RDdXJzb3IoKSkgeyBjb250aW51ZSB9XG4gICAgICBjb25zdCB3b3JkID0gdGhpcy53b3JkQXRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgaWYgKHdvcmQgPT09IHdvcmRVbmRlckN1cnNvcikgeyBudW1iZXJPZldvcmRzTWF0Y2hpbmdQcmVmaXggKz0gMSB9XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVycyA9IHRoaXMuaW5jbHVkZUNvbXBsZXRpb25zRnJvbUFsbEJ1ZmZlcnMgPyBudWxsIDogW3RoaXMuZWRpdG9yLmdldEJ1ZmZlcigpXVxuICAgIGNvbnN0IHN5bWJvbExpc3QgPSB0aGlzLnN5bWJvbFN0b3JlLnN5bWJvbHNGb3JDb25maWcoXG4gICAgICB0aGlzLmNvbmZpZyxcbiAgICAgIGJ1ZmZlcnMsXG4gICAgICBwcmVmaXgsXG4gICAgICB3b3JkVW5kZXJDdXJzb3IsXG4gICAgICBidWZmZXJQb3NpdGlvbi5yb3csXG4gICAgICBudW1iZXJPZldvcmRzTWF0Y2hpbmdQcmVmaXhcbiAgICApXG5cbiAgICBzeW1ib2xMaXN0LnNvcnQoKGEsIGIpID0+IChiLnNjb3JlICogYi5sb2NhbGl0eVNjb3JlKSAtIChhLnNjb3JlICogYS5sb2NhbGl0eVNjb3JlKSlcbiAgICByZXR1cm4gc3ltYm9sTGlzdC5zbGljZSgwLCAyMCkubWFwKGEgPT4gYS5zeW1ib2wpXG4gIH1cblxuICB3b3JkQXRCdWZmZXJQb3NpdGlvbiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikge1xuICAgIGNvbnN0IGxpbmVUb1Bvc2l0aW9uID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIGxldCBwcmVmaXggPSBsaW5lVG9Qb3NpdGlvbi5tYXRjaCh0aGlzLmVuZE9mTGluZVdvcmRSZWdleClcbiAgICBpZiAocHJlZml4KSB7XG4gICAgICBwcmVmaXggPSBwcmVmaXhbMF1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZml4ID0gJydcbiAgICB9XG5cbiAgICBjb25zdCBsaW5lRnJvbVBvc2l0aW9uID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtidWZmZXJQb3NpdGlvbiwgW2J1ZmZlclBvc2l0aW9uLnJvdywgSW5maW5pdHldXSlcbiAgICBsZXQgc3VmZml4ID0gbGluZUZyb21Qb3NpdGlvbi5tYXRjaCh0aGlzLmJlZ2lubmluZ09mTGluZVdvcmRSZWdleClcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICBzdWZmaXggPSBzdWZmaXhbMF1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VmZml4ID0gJydcbiAgICB9XG5cbiAgICByZXR1cm4gcHJlZml4ICsgc3VmZml4XG4gIH1cblxuICBzZXR0aW5nc0ZvclNjb3BlRGVzY3JpcHRvciAoc2NvcGVEZXNjcmlwdG9yLCBrZXlQYXRoKSB7XG4gICAgcmV0dXJuIGF0b20uY29uZmlnLmdldEFsbChrZXlQYXRoLCB7c2NvcGU6IHNjb3BlRGVzY3JpcHRvcn0pXG4gIH1cblxuICAvKlxuICBTZWN0aW9uOiBXb3JkIExpc3QgQnVpbGRpbmdcbiAgKi9cblxuICBidWlsZFdvcmRMaXN0T25OZXh0VGljayAoZWRpdG9yKSB7XG4gICAgcmV0dXJuIF8uZGVmZXIoKCkgPT4ge1xuICAgICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuaXNBbGl2ZSgpICYmICFlZGl0b3IubGFyZ2VGaWxlTW9kZSkge1xuICAgICAgICBjb25zdCBzdGFydCA9IHtyb3c6IDAsIGNvbHVtbjogMH1cbiAgICAgICAgY29uc3Qgb2xkRXh0ZW50ID0ge3JvdzogMCwgY29sdW1uOiAwfVxuICAgICAgICBjb25zdCBuZXdFeHRlbnQgPSBlZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0UmFuZ2UoKS5nZXRFeHRlbnQoKVxuICAgICAgICByZXR1cm4gdGhpcy5zeW1ib2xTdG9yZS5yZWNvbXB1dGVTeW1ib2xzRm9yRWRpdG9ySW5CdWZmZXJSYW5nZShlZGl0b3IsIHN0YXJ0LCBvbGRFeHRlbnQsIG5ld0V4dGVudClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLy8gRklYTUU6IHRoaXMgc2hvdWxkIGdvIGluIHRoZSBjb3JlIFNjb3BlRGVzY3JpcHRvciBjbGFzc1xuICBzY29wZURlc2NyaXB0b3JzRXF1YWwgKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYikgeyByZXR1cm4gdHJ1ZSB9XG4gICAgaWYgKChhID09IG51bGwpIHx8IChiID09IG51bGwpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBjb25zdCBhcnJheUEgPSBhLmdldFNjb3Blc0FycmF5KClcbiAgICBjb25zdCBhcnJheUIgPSBiLmdldFNjb3Blc0FycmF5KClcblxuICAgIGlmIChhcnJheUEubGVuZ3RoICE9PSBhcnJheUIubGVuZ3RoKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5QS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NvcGUgPSBhcnJheUFbaV1cbiAgICAgIGlmIChzY29wZSAhPT0gYXJyYXlCW2ldKSB7IHJldHVybiBmYWxzZSB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbn1cbiJdfQ==