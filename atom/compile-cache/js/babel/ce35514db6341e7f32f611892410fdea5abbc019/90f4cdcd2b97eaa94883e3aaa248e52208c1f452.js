Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fuzzaldrin = require('fuzzaldrin');

var _fuzzaldrin2 = _interopRequireDefault(_fuzzaldrin);

var _atom = require('atom');

var _refCountedTokenList = require('./ref-counted-token-list');

var _refCountedTokenList2 = _interopRequireDefault(_refCountedTokenList);

var _unicodeHelpers = require('./unicode-helpers');

'use babel';

var FuzzyProvider = (function () {
  function FuzzyProvider() {
    var _this = this;

    _classCallCheck(this, FuzzyProvider);

    this.deferBuildWordListInterval = 300;
    this.updateBuildWordListTimeout = null;
    this.updateCurrentEditorTimeout = null;
    this.wordRegex = null;
    this.tokenList = new _refCountedTokenList2['default']();
    this.currentEditorSubscriptions = null;
    this.editor = null;
    this.buffer = null;

    this.scopeSelector = '*';
    this.inclusionPriority = 0;
    this.suggestionPriority = 0;
    this.debouncedUpdateCurrentEditor = this.debouncedUpdateCurrentEditor.bind(this);
    this.updateCurrentEditor = this.updateCurrentEditor.bind(this);
    this.getSuggestions = this.getSuggestions.bind(this);
    this.bufferSaved = this.bufferSaved.bind(this);
    this.bufferWillChange = this.bufferWillChange.bind(this);
    this.bufferDidChange = this.bufferDidChange.bind(this);
    this.buildWordList = this.buildWordList.bind(this);
    this.findSuggestionsForWord = this.findSuggestionsForWord.bind(this);
    this.dispose = this.dispose.bind(this);
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.wordRegex = new RegExp('[' + _unicodeHelpers.UnicodeLetters + '\\d_]+[' + _unicodeHelpers.UnicodeLetters + '\\d_-]*', 'g');
      } else {
        _this.wordRegex = /\b\w+[\w-]*\b/g;
      }
    }));
    this.debouncedBuildWordList();
    this.subscriptions.add(atom.workspace.observeActivePaneItem(this.debouncedUpdateCurrentEditor));
    var builtinProviderBlacklist = atom.config.get('autocomplete-plus.builtinProviderBlacklist');
    if (builtinProviderBlacklist != null && builtinProviderBlacklist.length) {
      this.disableForScopeSelector = builtinProviderBlacklist;
    }
  }

  _createClass(FuzzyProvider, [{
    key: 'debouncedUpdateCurrentEditor',
    value: function debouncedUpdateCurrentEditor(currentPaneItem) {
      var _this2 = this;

      clearTimeout(this.updateBuildWordListTimeout);
      clearTimeout(this.updateCurrentEditorTimeout);
      this.updateCurrentEditorTimeout = setTimeout(function () {
        _this2.updateCurrentEditor(currentPaneItem);
      }, this.deferBuildWordListInterval);
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

      // Stop listening to buffer events
      if (this.currentEditorSubscriptions) {
        this.currentEditorSubscriptions.dispose();
      }

      this.editor = null;
      this.buffer = null;

      if (!this.paneItemIsValid(currentPaneItem)) {
        return;
      }

      // Track the new editor, editorView, and buffer
      this.editor = currentPaneItem;
      this.buffer = this.editor.getBuffer();

      // Subscribe to buffer events:
      this.currentEditorSubscriptions = new _atom.CompositeDisposable();
      if (this.editor && !this.editor.largeFileMode) {
        this.currentEditorSubscriptions.add(this.buffer.onDidSave(this.bufferSaved));
        this.currentEditorSubscriptions.add(this.buffer.onWillChange(this.bufferWillChange));
        this.currentEditorSubscriptions.add(this.buffer.onDidChange(this.bufferDidChange));
        this.buildWordList();
      }
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

    // Public:  Gets called when the document has been changed. Returns an array
    // with suggestions. If `exclusive` is set to true and this method returns
    // suggestions, the suggestions will be the only ones that are displayed.
    //
    // Returns an {Array} of Suggestion instances
  }, {
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var editor = _ref.editor;
      var prefix = _ref.prefix;
      var scopeDescriptor = _ref.scopeDescriptor;

      if (editor == null) {
        return;
      }

      // No prefix? Don't autocomplete!
      if (!prefix.trim().length) {
        return;
      }

      var suggestions = this.findSuggestionsForWord(prefix, scopeDescriptor);

      // No suggestions? Don't autocomplete!
      if (!suggestions || !suggestions.length) {
        return;
      }

      // Now we're ready - display the suggestions
      return suggestions;
    }

    // Private: Gets called when the user saves the document. Rebuilds the word
    // list.
  }, {
    key: 'bufferSaved',
    value: function bufferSaved() {
      return this.buildWordList();
    }
  }, {
    key: 'bufferWillChange',
    value: function bufferWillChange(_ref2) {
      var oldRange = _ref2.oldRange;

      var oldLines = this.editor.getTextInBufferRange([[oldRange.start.row, 0], [oldRange.end.row, Infinity]]);
      return this.removeWordsForText(oldLines);
    }
  }, {
    key: 'bufferDidChange',
    value: function bufferDidChange(_ref3) {
      var newRange = _ref3.newRange;

      var newLines = this.editor.getTextInBufferRange([[newRange.start.row, 0], [newRange.end.row, Infinity]]);
      return this.addWordsForText(newLines);
    }
  }, {
    key: 'debouncedBuildWordList',
    value: function debouncedBuildWordList() {
      var _this3 = this;

      clearTimeout(this.updateBuildWordListTimeout);
      this.updateBuildWordListTimeout = setTimeout(function () {
        _this3.buildWordList();
      }, this.deferBuildWordListInterval);
    }
  }, {
    key: 'buildWordList',
    value: function buildWordList() {
      var _this4 = this;

      if (this.editor == null) {
        return;
      }

      this.tokenList.clear();
      var editors = undefined;
      if (atom.config.get('autocomplete-plus.includeCompletionsFromAllBuffers')) {
        editors = atom.workspace.getTextEditors();
      } else {
        editors = [this.editor];
      }

      return editors.map(function (editor) {
        return _this4.addWordsForText(editor.getText());
      });
    }
  }, {
    key: 'addWordsForText',
    value: function addWordsForText(text) {
      var _this5 = this;

      var minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength');
      var matches = text.match(this.wordRegex);
      if (matches == null) {
        return;
      }
      return (function () {
        var result = [];
        for (var i = 0; i < matches.length; i++) {
          var match = matches[i];
          var item = undefined;
          if (minimumWordLength && match.length >= minimumWordLength || !minimumWordLength) {
            item = _this5.tokenList.addToken(match);
          }
          result.push(item);
        }
        return result;
      })();
    }
  }, {
    key: 'removeWordsForText',
    value: function removeWordsForText(text) {
      var _this6 = this;

      var matches = text.match(this.wordRegex);
      if (matches == null) {
        return;
      }
      return matches.map(function (match) {
        return _this6.tokenList.removeToken(match);
      });
    }

    // Private: Finds possible matches for the given string / prefix
    //
    // prefix - {String} The prefix
    //
    // Returns an {Array} of Suggestion instances
  }, {
    key: 'findSuggestionsForWord',
    value: function findSuggestionsForWord(prefix, scopeDescriptor) {
      if (!this.tokenList.getLength() || this.editor == null) {
        return;
      }

      // Merge the scope specific words into the default word list
      var tokens = this.tokenList.getTokens();
      tokens = tokens.concat(this.getCompletionsForCursorScope(scopeDescriptor));

      var words = undefined;
      if (atom.config.get('autocomplete-plus.strictMatching')) {
        words = tokens.filter(function (word) {
          if (!word) {
            return false;
          }
          return word.indexOf(prefix) === 0;
        });
      } else {
        words = _fuzzaldrin2['default'].filter(tokens, prefix);
      }

      var results = [];

      // dont show matches that are the same as the prefix
      for (var i = 0; i < words.length; i++) {
        // must match the first char!
        var word = words[i];
        if (word !== prefix) {
          if (!word || !prefix || prefix[0].toLowerCase() !== word[0].toLowerCase()) {
            continue;
          }
          results.push({ text: word, replacementPrefix: prefix });
        }
      }
      return results;
    }
  }, {
    key: 'settingsForScopeDescriptor',
    value: function settingsForScopeDescriptor(scopeDescriptor, keyPath) {
      return atom.config.getAll(keyPath, { scope: scopeDescriptor });
    }

    // Private: Finds autocompletions in the current syntax scope (e.g. css values)
    //
    // Returns an {Array} of strings
  }, {
    key: 'getCompletionsForCursorScope',
    value: function getCompletionsForCursorScope(scopeDescriptor) {
      var completions = this.settingsForScopeDescriptor(scopeDescriptor, 'editor.completions');
      var seen = {};
      var resultCompletions = [];
      for (var i = 0; i < completions.length; i++) {
        var value = completions[i].value;

        if (Array.isArray(value)) {
          for (var j = 0; j < value.length; j++) {
            var completion = value[j];
            if (!seen[completion]) {
              resultCompletions.push(completion);
              seen[completion] = true;
            }
          }
        }
      }
      return resultCompletions;
    }

    // Public: Clean up, stop listening to events
  }, {
    key: 'dispose',
    value: function dispose() {
      clearTimeout(this.updateBuildWordListTimeout);
      clearTimeout(this.updateCurrentEditorTimeout);
      if (this.currentEditorSubscriptions) {
        this.currentEditorSubscriptions.dispose();
      }
      return this.subscriptions.dispose();
    }
  }]);

  return FuzzyProvider;
})();

exports['default'] = FuzzyProvider;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL2Z1enp5LXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7MEJBRXVCLFlBQVk7Ozs7b0JBQ0MsTUFBTTs7bUNBQ1YsMEJBQTBCOzs7OzhCQUMzQixtQkFBbUI7O0FBTGxELFdBQVcsQ0FBQTs7SUFPVSxhQUFhO0FBQ3BCLFdBRE8sYUFBYSxHQUNqQjs7OzBCQURJLGFBQWE7O0FBRTlCLFFBQUksQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUE7QUFDckMsUUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQTtBQUN0QyxRQUFJLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxDQUFBO0FBQ3RDLFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxTQUFTLEdBQUcsc0NBQXlCLENBQUE7QUFDMUMsUUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQTtBQUN0QyxRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTs7QUFFbEIsUUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUE7QUFDeEIsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQTtBQUMxQixRQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFBO0FBQzNCLFFBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2hGLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzlELFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FB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LENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDcEMsS0FBSyxHQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBdkIsS0FBSzs7QUFDWixZQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDeEIsZUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckMsZ0JBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMzQixnQkFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUNyQiwrQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDbEMsa0JBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUE7YUFDeEI7V0FDRjtTQUNGO09BQ0Y7QUFDRCxhQUFPLGlCQUFpQixDQUFBO0tBQ3pCOzs7OztXQUdPLG1CQUFHO0FBQ1Qsa0JBQVksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQTtBQUM3QyxrQkFBWSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFBO0FBQzdDLFVBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFO0FBQ25DLFlBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUMxQztBQUNELGFBQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUNwQzs7O1NBblBrQixhQUFhOzs7cUJBQWIsYUFBYSIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9mdXp6eS1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCBmdXp6YWxkcmluIGZyb20gJ2Z1enphbGRyaW4nXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBSZWZDb3VudGVkVG9rZW5MaXN0IGZyb20gJy4vcmVmLWNvdW50ZWQtdG9rZW4tbGlzdCdcbmltcG9ydCB7IFVuaWNvZGVMZXR0ZXJzIH0gZnJvbSAnLi91bmljb2RlLWhlbHBlcnMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZ1enp5UHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5kZWZlckJ1aWxkV29yZExpc3RJbnRlcnZhbCA9IDMwMFxuICAgIHRoaXMudXBkYXRlQnVpbGRXb3JkTGlzdFRpbWVvdXQgPSBudWxsXG4gICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yVGltZW91dCA9IG51bGxcbiAgICB0aGlzLndvcmRSZWdleCA9IG51bGxcbiAgICB0aGlzLnRva2VuTGlzdCA9IG5ldyBSZWZDb3VudGVkVG9rZW5MaXN0KClcbiAgICB0aGlzLmN1cnJlbnRFZGl0b3JTdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuYnVmZmVyID0gbnVsbFxuXG4gICAgdGhpcy5zY29wZVNlbGVjdG9yID0gJyonXG4gICAgdGhpcy5pbmNsdXNpb25Qcmlvcml0eSA9IDBcbiAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IDBcbiAgICB0aGlzLmRlYm91bmNlZFVwZGF0ZUN1cnJlbnRFZGl0b3IgPSB0aGlzLmRlYm91bmNlZFVwZGF0ZUN1cnJlbnRFZGl0b3IuYmluZCh0aGlzKVxuICAgIHRoaXMudXBkYXRlQ3VycmVudEVkaXRvciA9IHRoaXMudXBkYXRlQ3VycmVudEVkaXRvci5iaW5kKHRoaXMpXG4gICAgdGhpcy5nZXRTdWdnZXN0aW9ucyA9IHRoaXMuZ2V0U3VnZ2VzdGlvbnMuYmluZCh0aGlzKVxuICAgIHRoaXMuYnVmZmVyU2F2ZWQgPSB0aGlzLmJ1ZmZlclNhdmVkLmJpbmQodGhpcylcbiAgICB0aGlzLmJ1ZmZlcldpbGxDaGFuZ2UgPSB0aGlzLmJ1ZmZlcldpbGxDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuYnVmZmVyRGlkQ2hhbmdlID0gdGhpcy5idWZmZXJEaWRDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuYnVpbGRXb3JkTGlzdCA9IHRoaXMuYnVpbGRXb3JkTGlzdC5iaW5kKHRoaXMpXG4gICAgdGhpcy5maW5kU3VnZ2VzdGlvbnNGb3JXb3JkID0gdGhpcy5maW5kU3VnZ2VzdGlvbnNGb3JXb3JkLmJpbmQodGhpcylcbiAgICB0aGlzLmRpc3Bvc2UgPSB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQnLCBlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0ID0+IHtcbiAgICAgIGlmIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSB7XG4gICAgICAgIHRoaXMud29yZFJlZ2V4ID0gbmV3IFJlZ0V4cChgWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXSpgLCAnZycpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndvcmRSZWdleCA9IC9cXGJcXHcrW1xcdy1dKlxcYi9nXG4gICAgICB9XG4gICAgfSkpXG4gICAgdGhpcy5kZWJvdW5jZWRCdWlsZFdvcmRMaXN0KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSh0aGlzLmRlYm91bmNlZFVwZGF0ZUN1cnJlbnRFZGl0b3IpKVxuICAgIGNvbnN0IGJ1aWx0aW5Qcm92aWRlckJsYWNrbGlzdCA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuYnVpbHRpblByb3ZpZGVyQmxhY2tsaXN0JylcbiAgICBpZiAoKGJ1aWx0aW5Qcm92aWRlckJsYWNrbGlzdCAhPSBudWxsKSAmJiBidWlsdGluUHJvdmlkZXJCbGFja2xpc3QubGVuZ3RoKSB7IHRoaXMuZGlzYWJsZUZvclNjb3BlU2VsZWN0b3IgPSBidWlsdGluUHJvdmlkZXJCbGFja2xpc3QgfVxuICB9XG5cbiAgZGVib3VuY2VkVXBkYXRlQ3VycmVudEVkaXRvciAoY3VycmVudFBhbmVJdGVtKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudXBkYXRlQnVpbGRXb3JkTGlzdFRpbWVvdXQpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudXBkYXRlQ3VycmVudEVkaXRvclRpbWVvdXQpXG4gICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yKGN1cnJlbnRQYW5lSXRlbSlcbiAgICB9XG4gICAgLCB0aGlzLmRlZmVyQnVpbGRXb3JkTGlzdEludGVydmFsKVxuICB9XG5cbiAgdXBkYXRlQ3VycmVudEVkaXRvciAoY3VycmVudFBhbmVJdGVtKSB7XG4gICAgaWYgKGN1cnJlbnRQYW5lSXRlbSA9PSBudWxsKSB7IHJldHVybiB9XG4gICAgaWYgKGN1cnJlbnRQYW5lSXRlbSA9PT0gdGhpcy5lZGl0b3IpIHsgcmV0dXJuIH1cblxuICAgIC8vIFN0b3AgbGlzdGVuaW5nIHRvIGJ1ZmZlciBldmVudHNcbiAgICBpZiAodGhpcy5jdXJyZW50RWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5jdXJyZW50RWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9XG5cbiAgICB0aGlzLmVkaXRvciA9IG51bGxcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGxcblxuICAgIGlmICghdGhpcy5wYW5lSXRlbUlzVmFsaWQoY3VycmVudFBhbmVJdGVtKSkgeyByZXR1cm4gfVxuXG4gICAgLy8gVHJhY2sgdGhlIG5ldyBlZGl0b3IsIGVkaXRvclZpZXcsIGFuZCBidWZmZXJcbiAgICB0aGlzLmVkaXRvciA9IGN1cnJlbnRQYW5lSXRlbVxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5lZGl0b3IuZ2V0QnVmZmVyKClcblxuICAgIC8vIFN1YnNjcmliZSB0byBidWZmZXIgZXZlbnRzOlxuICAgIHRoaXMuY3VycmVudEVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgaWYgKHRoaXMuZWRpdG9yICYmICF0aGlzLmVkaXRvci5sYXJnZUZpbGVNb2RlKSB7XG4gICAgICB0aGlzLmN1cnJlbnRFZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZFNhdmUodGhpcy5idWZmZXJTYXZlZCkpXG4gICAgICB0aGlzLmN1cnJlbnRFZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbldpbGxDaGFuZ2UodGhpcy5idWZmZXJXaWxsQ2hhbmdlKSlcbiAgICAgIHRoaXMuY3VycmVudEVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYnVmZmVyLm9uRGlkQ2hhbmdlKHRoaXMuYnVmZmVyRGlkQ2hhbmdlKSlcbiAgICAgIHRoaXMuYnVpbGRXb3JkTGlzdCgpXG4gICAgfVxuICB9XG5cbiAgcGFuZUl0ZW1Jc1ZhbGlkIChwYW5lSXRlbSkge1xuICAgIC8vIFRPRE86IHJlbW92ZSBjb25kaXRpb25hbCB3aGVuIGBpc1RleHRFZGl0b3JgIGlzIHNoaXBwZWQuXG4gICAgaWYgKHR5cGVvZiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZUl0ZW0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwYW5lSXRlbSA9PSBudWxsKSB7IHJldHVybiBmYWxzZSB9XG4gICAgICAvLyBTaG91bGQgd2UgZGlzcXVhbGlmeSBUZXh0RWRpdG9ycyB3aXRoIHRoZSBHcmFtbWFyIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyP1xuICAgICAgcmV0dXJuIChwYW5lSXRlbS5nZXRUZXh0ICE9IG51bGwpXG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiAgR2V0cyBjYWxsZWQgd2hlbiB0aGUgZG9jdW1lbnQgaGFzIGJlZW4gY2hhbmdlZC4gUmV0dXJucyBhbiBhcnJheVxuICAvLyB3aXRoIHN1Z2dlc3Rpb25zLiBJZiBgZXhjbHVzaXZlYCBpcyBzZXQgdG8gdHJ1ZSBhbmQgdGhpcyBtZXRob2QgcmV0dXJuc1xuICAvLyBzdWdnZXN0aW9ucywgdGhlIHN1Z2dlc3Rpb25zIHdpbGwgYmUgdGhlIG9ubHkgb25lcyB0aGF0IGFyZSBkaXNwbGF5ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge0FycmF5fSBvZiBTdWdnZXN0aW9uIGluc3RhbmNlc1xuICBnZXRTdWdnZXN0aW9ucyAoe2VkaXRvciwgcHJlZml4LCBzY29wZURlc2NyaXB0b3J9KSB7XG4gICAgaWYgKGVkaXRvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICAvLyBObyBwcmVmaXg/IERvbid0IGF1dG9jb21wbGV0ZSFcbiAgICBpZiAoIXByZWZpeC50cmltKCkubGVuZ3RoKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHRoaXMuZmluZFN1Z2dlc3Rpb25zRm9yV29yZChwcmVmaXgsIHNjb3BlRGVzY3JpcHRvcilcblxuICAgIC8vIE5vIHN1Z2dlc3Rpb25zPyBEb24ndCBhdXRvY29tcGxldGUhXG4gICAgaWYgKCFzdWdnZXN0aW9ucyB8fCAhc3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBOb3cgd2UncmUgcmVhZHkgLSBkaXNwbGF5IHRoZSBzdWdnZXN0aW9uc1xuICAgIHJldHVybiBzdWdnZXN0aW9uc1xuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgdXNlciBzYXZlcyB0aGUgZG9jdW1lbnQuIFJlYnVpbGRzIHRoZSB3b3JkXG4gIC8vIGxpc3QuXG4gIGJ1ZmZlclNhdmVkICgpIHtcbiAgICByZXR1cm4gdGhpcy5idWlsZFdvcmRMaXN0KClcbiAgfVxuXG4gIGJ1ZmZlcldpbGxDaGFuZ2UgKHtvbGRSYW5nZX0pIHtcbiAgICBjb25zdCBvbGRMaW5lcyA9IHRoaXMuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbb2xkUmFuZ2Uuc3RhcnQucm93LCAwXSwgW29sZFJhbmdlLmVuZC5yb3csIEluZmluaXR5XV0pXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlV29yZHNGb3JUZXh0KG9sZExpbmVzKVxuICB9XG5cbiAgYnVmZmVyRGlkQ2hhbmdlICh7bmV3UmFuZ2V9KSB7XG4gICAgY29uc3QgbmV3TGluZXMgPSB0aGlzLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbW25ld1JhbmdlLnN0YXJ0LnJvdywgMF0sIFtuZXdSYW5nZS5lbmQucm93LCBJbmZpbml0eV1dKVxuICAgIHJldHVybiB0aGlzLmFkZFdvcmRzRm9yVGV4dChuZXdMaW5lcylcbiAgfVxuXG4gIGRlYm91bmNlZEJ1aWxkV29yZExpc3QgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnVwZGF0ZUJ1aWxkV29yZExpc3RUaW1lb3V0KVxuICAgIHRoaXMudXBkYXRlQnVpbGRXb3JkTGlzdFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuYnVpbGRXb3JkTGlzdCgpXG4gICAgfVxuICAgICwgdGhpcy5kZWZlckJ1aWxkV29yZExpc3RJbnRlcnZhbClcbiAgfVxuXG4gIGJ1aWxkV29yZExpc3QgKCkge1xuICAgIGlmICh0aGlzLmVkaXRvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICB0aGlzLnRva2VuTGlzdC5jbGVhcigpXG4gICAgbGV0IGVkaXRvcnNcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5pbmNsdWRlQ29tcGxldGlvbnNGcm9tQWxsQnVmZmVycycpKSB7XG4gICAgICBlZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuICAgIH0gZWxzZSB7XG4gICAgICBlZGl0b3JzID0gW3RoaXMuZWRpdG9yXVxuICAgIH1cblxuICAgIHJldHVybiBlZGl0b3JzLm1hcCgoZWRpdG9yKSA9PlxuICAgICAgdGhpcy5hZGRXb3Jkc0ZvclRleHQoZWRpdG9yLmdldFRleHQoKSkpXG4gIH1cblxuICBhZGRXb3Jkc0ZvclRleHQgKHRleHQpIHtcbiAgICBjb25zdCBtaW5pbXVtV29yZExlbmd0aCA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGgnKVxuICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMud29yZFJlZ2V4KVxuICAgIGlmIChtYXRjaGVzID09IG51bGwpIHsgcmV0dXJuIH1cbiAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IFtdXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBtYXRjaGVzW2ldXG4gICAgICAgIGxldCBpdGVtXG4gICAgICAgIGlmICgobWluaW11bVdvcmRMZW5ndGggJiYgbWF0Y2gubGVuZ3RoID49IG1pbmltdW1Xb3JkTGVuZ3RoKSB8fCAhbWluaW11bVdvcmRMZW5ndGgpIHtcbiAgICAgICAgICBpdGVtID0gdGhpcy50b2tlbkxpc3QuYWRkVG9rZW4obWF0Y2gpXG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0LnB1c2goaXRlbSlcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9KSgpXG4gIH1cblxuICByZW1vdmVXb3Jkc0ZvclRleHQgKHRleHQpIHtcbiAgICBjb25zdCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLndvcmRSZWdleClcbiAgICBpZiAobWF0Y2hlcyA9PSBudWxsKSB7IHJldHVybiB9XG4gICAgcmV0dXJuIG1hdGNoZXMubWFwKChtYXRjaCkgPT5cbiAgICAgIHRoaXMudG9rZW5MaXN0LnJlbW92ZVRva2VuKG1hdGNoKSlcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEZpbmRzIHBvc3NpYmxlIG1hdGNoZXMgZm9yIHRoZSBnaXZlbiBzdHJpbmcgLyBwcmVmaXhcbiAgLy9cbiAgLy8gcHJlZml4IC0ge1N0cmluZ30gVGhlIHByZWZpeFxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2YgU3VnZ2VzdGlvbiBpbnN0YW5jZXNcbiAgZmluZFN1Z2dlc3Rpb25zRm9yV29yZCAocHJlZml4LCBzY29wZURlc2NyaXB0b3IpIHtcbiAgICBpZiAoIXRoaXMudG9rZW5MaXN0LmdldExlbmd0aCgpIHx8ICh0aGlzLmVkaXRvciA9PSBudWxsKSkgeyByZXR1cm4gfVxuXG4gICAgLy8gTWVyZ2UgdGhlIHNjb3BlIHNwZWNpZmljIHdvcmRzIGludG8gdGhlIGRlZmF1bHQgd29yZCBsaXN0XG4gICAgbGV0IHRva2VucyA9IHRoaXMudG9rZW5MaXN0LmdldFRva2VucygpXG4gICAgdG9rZW5zID0gdG9rZW5zLmNvbmNhdCh0aGlzLmdldENvbXBsZXRpb25zRm9yQ3Vyc29yU2NvcGUoc2NvcGVEZXNjcmlwdG9yKSlcblxuICAgIGxldCB3b3Jkc1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLnN0cmljdE1hdGNoaW5nJykpIHtcbiAgICAgIHdvcmRzID0gdG9rZW5zLmZpbHRlcigod29yZCkgPT4ge1xuICAgICAgICBpZiAoIXdvcmQpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd29yZC5pbmRleE9mKHByZWZpeCkgPT09IDBcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHdvcmRzID0gZnV6emFsZHJpbi5maWx0ZXIodG9rZW5zLCBwcmVmaXgpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdXG5cbiAgICAvLyBkb250IHNob3cgbWF0Y2hlcyB0aGF0IGFyZSB0aGUgc2FtZSBhcyB0aGUgcHJlZml4XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gbXVzdCBtYXRjaCB0aGUgZmlyc3QgY2hhciFcbiAgICAgIGNvbnN0IHdvcmQgPSB3b3Jkc1tpXVxuICAgICAgaWYgKHdvcmQgIT09IHByZWZpeCkge1xuICAgICAgICBpZiAoIXdvcmQgfHwgIXByZWZpeCB8fCBwcmVmaXhbMF0udG9Mb3dlckNhc2UoKSAhPT0gd29yZFswXS50b0xvd2VyQ2FzZSgpKSB7IGNvbnRpbnVlIH1cbiAgICAgICAgcmVzdWx0cy5wdXNoKHt0ZXh0OiB3b3JkLCByZXBsYWNlbWVudFByZWZpeDogcHJlZml4fSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIHNldHRpbmdzRm9yU2NvcGVEZXNjcmlwdG9yIChzY29wZURlc2NyaXB0b3IsIGtleVBhdGgpIHtcbiAgICByZXR1cm4gYXRvbS5jb25maWcuZ2V0QWxsKGtleVBhdGgsIHtzY29wZTogc2NvcGVEZXNjcmlwdG9yfSlcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEZpbmRzIGF1dG9jb21wbGV0aW9ucyBpbiB0aGUgY3VycmVudCBzeW50YXggc2NvcGUgKGUuZy4gY3NzIHZhbHVlcylcbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7QXJyYXl9IG9mIHN0cmluZ3NcbiAgZ2V0Q29tcGxldGlvbnNGb3JDdXJzb3JTY29wZSAoc2NvcGVEZXNjcmlwdG9yKSB7XG4gICAgY29uc3QgY29tcGxldGlvbnMgPSB0aGlzLnNldHRpbmdzRm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvciwgJ2VkaXRvci5jb21wbGV0aW9ucycpXG4gICAgY29uc3Qgc2VlbiA9IHt9XG4gICAgY29uc3QgcmVzdWx0Q29tcGxldGlvbnMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcGxldGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHt2YWx1ZX0gPSBjb21wbGV0aW9uc1tpXVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBjb21wbGV0aW9uID0gdmFsdWVbal1cbiAgICAgICAgICBpZiAoIXNlZW5bY29tcGxldGlvbl0pIHtcbiAgICAgICAgICAgIHJlc3VsdENvbXBsZXRpb25zLnB1c2goY29tcGxldGlvbilcbiAgICAgICAgICAgIHNlZW5bY29tcGxldGlvbl0gPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRDb21wbGV0aW9uc1xuICB9XG5cbiAgLy8gUHVibGljOiBDbGVhbiB1cCwgc3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnRzXG4gIGRpc3Bvc2UgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnVwZGF0ZUJ1aWxkV29yZExpc3RUaW1lb3V0KVxuICAgIGNsZWFyVGltZW91dCh0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3JUaW1lb3V0KVxuICAgIGlmICh0aGlzLmN1cnJlbnRFZGl0b3JTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmN1cnJlbnRFZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=