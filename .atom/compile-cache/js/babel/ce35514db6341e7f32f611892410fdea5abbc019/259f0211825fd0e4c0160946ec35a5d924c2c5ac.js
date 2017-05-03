Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _fuzzaldrin = require('fuzzaldrin');

var _fuzzaldrin2 = _interopRequireDefault(_fuzzaldrin);

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _providerManager = require('./provider-manager');

var _providerManager2 = _interopRequireDefault(_providerManager);

var _suggestionList = require('./suggestion-list');

var _suggestionList2 = _interopRequireDefault(_suggestionList);

var _suggestionListElement = require('./suggestion-list-element');

var _suggestionListElement2 = _interopRequireDefault(_suggestionListElement);

var _unicodeHelpers = require('./unicode-helpers');

// Deferred requires
'use babel';

var minimatch = null;
var grim = null;

var AutocompleteManager = (function () {
  function AutocompleteManager() {
    var _this = this;

    _classCallCheck(this, AutocompleteManager);

    this.autosaveEnabled = false;
    this.backspaceTriggersAutocomplete = true;
    this.autoConfirmSingleSuggestionEnabled = true;
    this.bracketMatcherPairs = ['()', '[]', '{}', '""', "''", '``', '“”', '‘’', '«»', '‹›'];
    this.buffer = null;
    this.compositionInProgress = false;
    this.disposed = false;
    this.editor = null;
    this.editorSubscriptions = null;
    this.editorView = null;
    this.providerManager = null;
    this.ready = false;
    this.subscriptions = null;
    this.suggestionDelay = 50;
    this.suggestionList = null;
    this.suppressForClasses = [];
    this.shouldDisplaySuggestions = false;
    this.prefixRegex = null;
    this.wordPrefixRegex = null;
    this.updateCurrentEditor = this.updateCurrentEditor.bind(this);
    this.handleCommands = this.handleCommands.bind(this);
    this.findSuggestions = this.findSuggestions.bind(this);
    this.getSuggestionsFromProviders = this.getSuggestionsFromProviders.bind(this);
    this.displaySuggestions = this.displaySuggestions.bind(this);
    this.hideSuggestionList = this.hideSuggestionList.bind(this);

    this.toggleActivationForBufferChange = this.toggleActivationForBufferChange.bind(this);
    this.showOrHideSuggestionListForBufferChanges = this.showOrHideSuggestionListForBufferChanges.bind(this);
    this.showOrHideSuggestionListForBufferChange = this.showOrHideSuggestionListForBufferChange.bind(this);
    this.subscriptions = new _atom.CompositeDisposable();
    this.providerManager = new _providerManager2['default']();
    this.suggestionList = new _suggestionList2['default']();

    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.prefixRegex = new RegExp('([\'"~`!@#\\$%^&*\\(\\)\\{\\}\\[\\]=+,/\\?>])?(([' + _unicodeHelpers.UnicodeLetters + '\\d_]+[' + _unicodeHelpers.UnicodeLetters + '\\d_-]*)|([.:;[{(< ]+))$');
        _this.wordPrefixRegex = new RegExp('^[' + _unicodeHelpers.UnicodeLetters + '\\d_]+[' + _unicodeHelpers.UnicodeLetters + '\\d_-]*$');
      } else {
        _this.prefixRegex = /(\b|['"~`!@#\$%^&*\(\)\{\}\[\]=\+,/\?>])((\w+[\w-]*)|([.:;[{(< ]+))$/;
        _this.wordPrefixRegex = /^\w+[\w-]*$/;
      }
    }));
    this.subscriptions.add(this.providerManager);
    this.subscriptions.add(atom.views.addViewProvider(_suggestionList2['default'], function (model) {
      return new _suggestionListElement2['default']().initialize(model);
    }));

    this.handleEvents();
    this.handleCommands();
    this.subscriptions.add(this.suggestionList); // We're adding this last so it is disposed after events
    this.ready = true;
  }

  _createClass(AutocompleteManager, [{
    key: 'setSnippetsManager',
    value: function setSnippetsManager(snippetsManager) {
      this.snippetsManager = snippetsManager;
    }
  }, {
    key: 'updateCurrentEditor',
    value: function updateCurrentEditor(currentEditor) {
      var _this2 = this;

      if (currentEditor == null || currentEditor === this.editor) {
        return;
      }
      if (this.editorSubscriptions) {
        this.editorSubscriptions.dispose();
      }
      this.editorSubscriptions = null;

      // Stop tracking editor + buffer
      this.editor = null;
      this.editorView = null;
      this.buffer = null;
      this.isCurrentFileBlackListedCache = null;

      if (!this.editorIsValid(currentEditor)) {
        return;
      }

      // Track the new editor, editorView, and buffer
      this.editor = currentEditor;
      this.editorView = atom.views.getView(this.editor);
      this.buffer = this.editor.getBuffer();

      this.editorSubscriptions = new _atom.CompositeDisposable();

      // Subscribe to buffer events:
      this.editorSubscriptions.add(this.buffer.onDidSave(function (e) {
        _this2.bufferSaved(e);
      }));
      if (typeof this.buffer.onDidChangeText === 'function') {
        this.editorSubscriptions.add(this.buffer.onDidChange(this.toggleActivationForBufferChange));
        this.editorSubscriptions.add(this.buffer.onDidChangeText(this.showOrHideSuggestionListForBufferChanges));
      } else {
        // TODO: Remove this after `TextBuffer.prototype.onDidChangeText` lands on Atom stable.
        this.editorSubscriptions.add(this.buffer.onDidChange(this.showOrHideSuggestionListForBufferChange));
      }

      // Watch IME Events To Allow IME To Function Without The Suggestion List Showing
      var compositionStart = function compositionStart() {
        _this2.compositionInProgress = true;
      };
      var compositionEnd = function compositionEnd() {
        _this2.compositionInProgress = false;
      };

      this.editorView.addEventListener('compositionstart', compositionStart);
      this.editorView.addEventListener('compositionend', compositionEnd);
      this.editorSubscriptions.add(new _atom.Disposable(function () {
        if (_this2.editorView) {
          _this2.editorView.removeEventListener('compositionstart', compositionStart);
          _this2.editorView.removeEventListener('compositionend', compositionEnd);
        }
      }));

      // Subscribe to editor events:
      // Close the overlay when the cursor moved without changing any text
      this.editorSubscriptions.add(this.editor.onDidChangeCursorPosition(function (e) {
        _this2.cursorMoved(e);
      }));
      return this.editorSubscriptions.add(this.editor.onDidChangePath(function () {
        _this2.isCurrentFileBlackListedCache = null;
      }));
    }
  }, {
    key: 'editorIsValid',
    value: function editorIsValid(editor) {
      // TODO: remove conditional when `isTextEditor` is shipped.
      if (typeof atom.workspace.isTextEditor === 'function') {
        return atom.workspace.isTextEditor(editor);
      } else {
        if (editor == null) {
          return false;
        }
        // Should we disqualify TextEditors with the Grammar text.plain.null-grammar?
        return editor.getText != null;
      }
    }
  }, {
    key: 'handleEvents',
    value: function handleEvents() {
      var _this3 = this;

      this.subscriptions.add(atom.textEditors.observe(function (editor) {
        var view = atom.views.getView(editor);
        if (view === document.activeElement.closest('atom-text-editor')) {
          _this3.updateCurrentEditor(editor);
        }
        view.addEventListener('focus', function (element) {
          _this3.updateCurrentEditor(editor);
        });
      }));

      // Watch config values
      this.subscriptions.add(atom.config.observe('autosave.enabled', function (value) {
        _this3.autosaveEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.backspaceTriggersAutocomplete', function (value) {
        _this3.backspaceTriggersAutocomplete = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoActivation', function (value) {
        _this3.autoActivationEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoConfirmSingleSuggestion', function (value) {
        _this3.autoConfirmSingleSuggestionEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.consumeSuffix', function (value) {
        _this3.consumeSuffix = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', function (value) {
        _this3.useAlternateScoring = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.fileBlacklist', function (value) {
        if (value) {
          _this3.fileBlacklist = value.map(function (s) {
            return s.trim();
          });
        }
        _this3.isCurrentFileBlackListedCache = null;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.suppressActivationForEditorClasses', function (value) {
        _this3.suppressForClasses = [];
        for (var i = 0; i < value.length; i++) {
          var selector = value[i];
          var classes = selector.trim().split('.').filter(function (className) {
            return className.trim();
          }).map(function (className) {
            return className.trim();
          });
          if (classes.length) {
            _this3.suppressForClasses.push(classes);
          }
        }
      }));

      // Handle events from suggestion list
      this.subscriptions.add(this.suggestionList.onDidConfirm(function (e) {
        _this3.confirm(e);
      }));
      this.subscriptions.add(this.suggestionList.onDidCancel(this.hideSuggestionList));
    }
  }, {
    key: 'handleCommands',
    value: function handleCommands() {
      var _this4 = this;

      return this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'autocomplete-plus:activate': function autocompletePlusActivate(event) {
          _this4.shouldDisplaySuggestions = true;
          var activatedManually = true;
          if (event.detail && event.detail.activatedManually !== null && typeof event.detail.activatedManually !== 'undefined') {
            activatedManually = event.detail.activatedManually;
          }
          _this4.findSuggestions(activatedManually);
        }
      }));
    }

    // Private: Finds suggestions for the current prefix, sets the list items,
    // positions the overlay and shows it
  }, {
    key: 'findSuggestions',
    value: function findSuggestions(activatedManually) {
      if (this.disposed) {
        return;
      }
      if (this.providerManager == null || this.editor == null || this.buffer == null) {
        return;
      }
      if (this.isCurrentFileBlackListed()) {
        return;
      }
      var cursor = this.editor.getLastCursor();
      if (cursor == null) {
        return;
      }

      var bufferPosition = cursor.getBufferPosition();
      var scopeDescriptor = cursor.getScopeDescriptor();
      var prefix = this.getPrefix(this.editor, bufferPosition);

      return this.getSuggestionsFromProviders({ editor: this.editor, bufferPosition: bufferPosition, scopeDescriptor: scopeDescriptor, prefix: prefix, activatedManually: activatedManually });
    }
  }, {
    key: 'getSuggestionsFromProviders',
    value: function getSuggestionsFromProviders(options) {
      var _this5 = this;

      var suggestionsPromise = undefined;
      var providers = this.providerManager.applicableProviders(options.editor, options.scopeDescriptor);

      var providerPromises = [];
      providers.forEach(function (provider) {
        var apiVersion = _this5.providerManager.apiVersionForProvider(provider);
        var apiIs20 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');

        // TODO API: remove upgrading when 1.0 support is removed
        var getSuggestions = undefined;
        var upgradedOptions = undefined;
        if (apiIs20) {
          getSuggestions = provider.getSuggestions.bind(provider);
          upgradedOptions = options;
        } else {
          getSuggestions = provider.requestHandler.bind(provider);
          upgradedOptions = {
            editor: options.editor,
            prefix: options.prefix,
            bufferPosition: options.bufferPosition,
            position: options.bufferPosition,
            scope: options.scopeDescriptor,
            scopeChain: options.scopeDescriptor.getScopeChain(),
            buffer: options.editor.getBuffer(),
            cursor: options.editor.getLastCursor()
          };
        }

        return providerPromises.push(Promise.resolve(getSuggestions(upgradedOptions)).then(function (providerSuggestions) {
          if (providerSuggestions == null) {
            return;
          }

          // TODO API: remove upgrading when 1.0 support is removed
          var hasDeprecations = false;
          if (apiIs20 && providerSuggestions.length) {
            hasDeprecations = _this5.deprecateForSuggestion(provider, providerSuggestions[0]);
          }

          if (hasDeprecations || !apiIs20) {
            providerSuggestions = providerSuggestions.map(function (suggestion) {
              var newSuggestion = {
                text: suggestion.text != null ? suggestion.text : suggestion.word,
                snippet: suggestion.snippet,
                replacementPrefix: suggestion.replacementPrefix != null ? suggestion.replacementPrefix : suggestion.prefix,
                className: suggestion.className,
                type: suggestion.type
              };
              if (newSuggestion.rightLabelHTML == null && suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabelHTML = suggestion.label;
              }
              if (newSuggestion.rightLabel == null && !suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabel = suggestion.label;
              }
              return newSuggestion;
            });
          }

          var hasEmpty = false; // Optimization: only create another array when there are empty items
          for (var i = 0; i < providerSuggestions.length; i++) {
            var suggestion = providerSuggestions[i];
            if (!suggestion.snippet && !suggestion.text) {
              hasEmpty = true;
            }
            if (suggestion.replacementPrefix == null) {
              suggestion.replacementPrefix = _this5.getDefaultReplacementPrefix(options.prefix);
            }
            suggestion.provider = provider;
          }

          if (hasEmpty) {
            var res = [];
            for (var s of providerSuggestions) {
              if (s.snippet || s.text) {
                res.push(s);
              }
            }
            providerSuggestions = res;
          }

          if (provider.filterSuggestions) {
            providerSuggestions = _this5.filterSuggestions(providerSuggestions, options);
          }
          return providerSuggestions;
        }));
      });

      if (!providerPromises || !providerPromises.length) {
        return;
      }

      suggestionsPromise = Promise.all(providerPromises);
      this.currentSuggestionsPromise = suggestionsPromise;
      return this.currentSuggestionsPromise.then(this.mergeSuggestionsFromProviders).then(function (suggestions) {
        if (_this5.currentSuggestionsPromise !== suggestionsPromise) {
          return;
        }
        if (options.activatedManually && _this5.shouldDisplaySuggestions && _this5.autoConfirmSingleSuggestionEnabled && suggestions.length === 1) {
          // When there is one suggestion in manual mode, just confirm it
          return _this5.confirm(suggestions[0]);
        } else {
          return _this5.displaySuggestions(suggestions, options);
        }
      });
    }
  }, {
    key: 'filterSuggestions',
    value: function filterSuggestions(suggestions, _ref) {
      var prefix = _ref.prefix;

      var results = [];
      var fuzzaldrinProvider = this.useAlternateScoring ? _fuzzaldrinPlus2['default'] : _fuzzaldrin2['default'];
      for (var i = 0; i < suggestions.length; i++) {
        // sortScore mostly preserves in the original sorting. The function is
        // chosen such that suggestions with a very high match score can break out.
        var score = undefined;
        var suggestion = suggestions[i];
        suggestion.sortScore = Math.max(-i / 10 + 3, 0) + 1;
        suggestion.score = null;

        var text = suggestion.snippet || suggestion.text;
        var suggestionPrefix = suggestion.replacementPrefix != null ? suggestion.replacementPrefix : prefix;
        var prefixIsEmpty = !suggestionPrefix || suggestionPrefix === ' ';
        var firstCharIsMatch = !prefixIsEmpty && suggestionPrefix[0].toLowerCase() === text[0].toLowerCase();

        if (prefixIsEmpty) {
          results.push(suggestion);
        }
        if (firstCharIsMatch && (score = fuzzaldrinProvider.score(text, suggestionPrefix)) > 0) {
          suggestion.score = score * suggestion.sortScore;
          results.push(suggestion);
        }
      }

      results.sort(this.reverseSortOnScoreComparator);
      return results;
    }
  }, {
    key: 'reverseSortOnScoreComparator',
    value: function reverseSortOnScoreComparator(a, b) {
      var bscore = b.score;
      if (!bscore) {
        bscore = b.sortScore;
      }
      var ascore = a.score;
      if (!ascore) {
        ascore = b.sortScore;
      }
      return bscore - ascore;
    }

    // providerSuggestions - array of arrays of suggestions provided by all called providers
  }, {
    key: 'mergeSuggestionsFromProviders',
    value: function mergeSuggestionsFromProviders(providerSuggestions) {
      return providerSuggestions.reduce(function (suggestions, providerSuggestions) {
        if (providerSuggestions && providerSuggestions.length) {
          suggestions = suggestions.concat(providerSuggestions);
        }

        return suggestions;
      }, []);
    }
  }, {
    key: 'deprecateForSuggestion',
    value: function deprecateForSuggestion(provider, suggestion) {
      var hasDeprecations = false;
      if (suggestion.word != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `word` attribute.\nThe `word` attribute is now `text`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.prefix != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `prefix` attribute.\nThe `prefix` attribute is now `replacementPrefix` and is optional.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.label != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `label` attribute.\nThe `label` attribute is now `rightLabel` or `rightLabelHTML`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.onWillConfirm != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `onWillConfirm` callback.\nThe `onWillConfirm` callback is no longer supported.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.onDidConfirm != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `onDidConfirm` callback.\nThe `onDidConfirm` callback is now a `onDidInsertSuggestion` callback on the provider itself.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      return hasDeprecations;
    }
  }, {
    key: 'displaySuggestions',
    value: function displaySuggestions(suggestions, options) {
      suggestions = this.getUniqueSuggestions(suggestions);

      if (this.shouldDisplaySuggestions && suggestions.length) {
        return this.showSuggestionList(suggestions, options);
      } else {
        return this.hideSuggestionList();
      }
    }
  }, {
    key: 'getUniqueSuggestions',
    value: function getUniqueSuggestions(suggestions) {
      var seen = {};
      var result = [];
      for (var i = 0; i < suggestions.length; i++) {
        var suggestion = suggestions[i];
        var val = suggestion.text + suggestion.snippet;
        if (!seen[val]) {
          result.push(suggestion);
          seen[val] = true;
        }
      }
      return result;
    }
  }, {
    key: 'getPrefix',
    value: function getPrefix(editor, bufferPosition) {
      var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      var prefix = this.prefixRegex.exec(line);
      if (!prefix || !prefix[2]) {
        return '';
      }
      return prefix[2];
    }
  }, {
    key: 'getDefaultReplacementPrefix',
    value: function getDefaultReplacementPrefix(prefix) {
      if (this.wordPrefixRegex.test(prefix)) {
        return prefix;
      } else {
        return '';
      }
    }

    // Private: Gets called when the user successfully confirms a suggestion
    //
    // match - An {Object} representing the confirmed suggestion
  }, {
    key: 'confirm',
    value: function confirm(suggestion) {
      if (this.editor == null || suggestion == null || !!this.disposed) {
        return;
      }

      var apiVersion = this.providerManager.apiVersionForProvider(suggestion.provider);
      var apiIs20 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');
      var triggerPosition = this.editor.getLastCursor().getBufferPosition();

      // TODO API: Remove as this is no longer used
      if (suggestion.onWillConfirm) {
        suggestion.onWillConfirm();
      }

      var selections = this.editor.getSelections();
      if (selections && selections.length) {
        for (var s of selections) {
          if (s && s.clear) {
            s.clear();
          }
        }
      }

      this.hideSuggestionList();

      this.replaceTextWithMatch(suggestion);

      // TODO API: Remove when we remove the 1.0 API
      if (apiIs20) {
        if (suggestion.provider && suggestion.provider.onDidInsertSuggestion) {
          suggestion.provider.onDidInsertSuggestion({ editor: this.editor, suggestion: suggestion, triggerPosition: triggerPosition });
        }
      } else {
        if (suggestion.onDidConfirm) {
          suggestion.onDidConfirm();
        }
      }
    }
  }, {
    key: 'showSuggestionList',
    value: function showSuggestionList(suggestions, options) {
      if (this.disposed) {
        return;
      }
      this.suggestionList.changeItems(suggestions);
      return this.suggestionList.show(this.editor, options);
    }
  }, {
    key: 'hideSuggestionList',
    value: function hideSuggestionList() {
      if (this.disposed) {
        return;
      }
      this.suggestionList.changeItems(null);
      this.suggestionList.hide();
      this.shouldDisplaySuggestions = false;
    }
  }, {
    key: 'requestHideSuggestionList',
    value: function requestHideSuggestionList(command) {
      this.hideTimeout = setTimeout(this.hideSuggestionList, 0);
      this.shouldDisplaySuggestions = false;
    }
  }, {
    key: 'cancelHideSuggestionListRequest',
    value: function cancelHideSuggestionListRequest() {
      return clearTimeout(this.hideTimeout);
    }

    // Private: Replaces the current prefix with the given match.
    //
    // match - The match to replace the current prefix with
  }, {
    key: 'replaceTextWithMatch',
    value: function replaceTextWithMatch(suggestion) {
      var _this6 = this;

      if (this.editor == null) {
        return;
      }

      var cursors = this.editor.getCursors();
      if (cursors == null) {
        return;
      }

      return this.editor.transact(function () {
        for (var i = 0; i < cursors.length; i++) {
          var cursor = cursors[i];
          var endPosition = cursor.getBufferPosition();
          var beginningPosition = [endPosition.row, endPosition.column - suggestion.replacementPrefix.length];

          if (_this6.editor.getTextInBufferRange([beginningPosition, endPosition]) === suggestion.replacementPrefix) {
            var suffix = _this6.consumeSuffix ? _this6.getSuffix(_this6.editor, endPosition, suggestion) : '';
            if (suffix.length) {
              cursor.moveRight(suffix.length);
            }
            cursor.selection.selectLeft(suggestion.replacementPrefix.length + suffix.length);

            if (suggestion.snippet != null && _this6.snippetsManager != null) {
              _this6.snippetsManager.insertSnippet(suggestion.snippet, _this6.editor, cursor);
            } else {
              cursor.selection.insertText(suggestion.text != null ? suggestion.text : suggestion.snippet, {
                autoIndentNewline: _this6.editor.shouldAutoIndent(),
                autoDecreaseIndent: _this6.editor.shouldAutoIndent()
              });
            }
          }
        }
      });
    }
  }, {
    key: 'getSuffix',
    value: function getSuffix(editor, bufferPosition, suggestion) {
      // This just chews through the suggestion and tries to match the suggestion
      // substring with the lineText starting at the cursor. There is probably a
      // more efficient way to do this.
      var suffix = suggestion.snippet != null ? suggestion.snippet : suggestion.text;
      var endPosition = [bufferPosition.row, bufferPosition.column + suffix.length];
      var endOfLineText = editor.getTextInBufferRange([bufferPosition, endPosition]);
      var nonWordCharacters = new Set(atom.config.get('editor.nonWordCharacters').split(''));
      while (suffix) {
        if (endOfLineText.startsWith(suffix) && !nonWordCharacters.has(suffix[0])) {
          break;
        }
        suffix = suffix.slice(1);
      }
      return suffix;
    }

    // Private: Checks whether the current file is blacklisted.
    //
    // Returns {Boolean} that defines whether the current file is blacklisted
  }, {
    key: 'isCurrentFileBlackListed',
    value: function isCurrentFileBlackListed() {
      // minimatch is slow. Not necessary to do this computation on every request for suggestions
      var left = undefined;
      if (this.isCurrentFileBlackListedCache != null) {
        return this.isCurrentFileBlackListedCache;
      }

      if (this.fileBlacklist == null || this.fileBlacklist.length === 0) {
        this.isCurrentFileBlackListedCache = false;
        return this.isCurrentFileBlackListedCache;
      }

      if (typeof minimatch === 'undefined' || minimatch === null) {
        minimatch = require('minimatch');
      }
      var fileName = _path2['default'].basename((left = this.buffer.getPath()) != null ? left : '');
      for (var i = 0; i < this.fileBlacklist.length; i++) {
        var blacklistGlob = this.fileBlacklist[i];
        if (minimatch(fileName, blacklistGlob)) {
          this.isCurrentFileBlackListedCache = true;
          return this.isCurrentFileBlackListedCache;
        }
      }

      this.isCurrentFileBlackListedCache = false;
      return this.isCurrentFileBlackListedCache;
    }

    // Private: Gets called when the content has been modified
  }, {
    key: 'requestNewSuggestions',
    value: function requestNewSuggestions() {
      var delay = atom.config.get('autocomplete-plus.autoActivationDelay');
      clearTimeout(this.delayTimeout);
      if (this.suggestionList.isActive()) {
        delay = this.suggestionDelay;
      }
      this.delayTimeout = setTimeout(this.findSuggestions, delay);
      this.shouldDisplaySuggestions = true;
    }
  }, {
    key: 'cancelNewSuggestionsRequest',
    value: function cancelNewSuggestionsRequest() {
      clearTimeout(this.delayTimeout);
      this.shouldDisplaySuggestions = false;
    }

    // Private: Gets called when the cursor has moved. Cancels the autocompletion if
    // the text has not been changed.
    //
    // data - An {Object} containing information on why the cursor has been moved
  }, {
    key: 'cursorMoved',
    value: function cursorMoved(_ref2) {
      var textChanged = _ref2.textChanged;

      // The delay is a workaround for the backspace case. The way atom implements
      // backspace is to select left 1 char, then delete. This results in a
      // cursorMoved event with textChanged == false. So we delay, and if the
      // bufferChanged handler decides to show suggestions, it will cancel the
      // hideSuggestionList request. If there is no bufferChanged event,
      // suggestionList will be hidden.
      if (!textChanged && !this.shouldActivate) {
        return this.requestHideSuggestionList();
      }
    }

    // Private: Gets called when the user saves the document. Cancels the
    // autocompletion.
  }, {
    key: 'bufferSaved',
    value: function bufferSaved() {
      if (!this.autosaveEnabled) {
        return this.hideSuggestionList();
      }
    }
  }, {
    key: 'toggleActivationForBufferChange',
    value: function toggleActivationForBufferChange(_ref3) {
      var newText = _ref3.newText;
      var newRange = _ref3.newRange;
      var oldText = _ref3.oldText;
      var oldRange = _ref3.oldRange;

      if (this.disposed) {
        return;
      }
      if (this.shouldActivate) {
        return;
      }
      if (this.compositionInProgress) {
        return this.hideSuggestionList();
      }

      if (this.autoActivationEnabled || this.suggestionList.isActive()) {
        if (newText.length > 0) {
          // Activate on space, a non-whitespace character, or a bracket-matcher pair.
          if (newText === ' ' || newText.trim().length === 1) {
            this.shouldActivate = true;
          }

          if (newText.length === 2) {
            for (var pair of this.bracketMatcherPairs) {
              if (newText === pair) {
                this.shouldActivate = true;
              }
            }
          }
        } else if (oldText.length > 0) {
          // Suggestion list must be either active or backspaceTriggersAutocomplete must be true for activation to occur.
          // Activate on removal of a space, a non-whitespace character, or a bracket-matcher pair.
          if (this.backspaceTriggersAutocomplete || this.suggestionList.isActive()) {
            if (oldText.length > 0 && (this.backspaceTriggersAutocomplete || this.suggestionList.isActive())) {
              if (oldText === ' ' || oldText.trim().length === 1) {
                this.shouldActivate = true;
              }

              if (oldText.length === 2) {
                for (var pair of this.bracketMatcherPairs) {
                  if (oldText === pair) {
                    this.shouldActivate = true;
                  }
                }
              }
            }
          }
        }

        if (this.shouldActivate && this.shouldSuppressActivationForEditorClasses()) {
          this.shouldActivate = false;
        }
      }
    }
  }, {
    key: 'showOrHideSuggestionListForBufferChanges',
    value: function showOrHideSuggestionListForBufferChanges(_ref4) {
      var changes = _ref4.changes;

      var lastCursorPosition = this.editor.getLastCursor().getBufferPosition();
      var changeOccurredNearLastCursor = changes.some(function (_ref5) {
        var start = _ref5.start;
        var newExtent = _ref5.newExtent;

        var newRange = new _atom.Range(start, start.traverse(newExtent));
        return newRange.containsPoint(lastCursorPosition);
      });

      if (this.shouldActivate && changeOccurredNearLastCursor) {
        this.cancelHideSuggestionListRequest();
        this.requestNewSuggestions();
      } else {
        this.cancelNewSuggestionsRequest();
        this.hideSuggestionList();
      }

      this.shouldActivate = false;
    }
  }, {
    key: 'showOrHideSuggestionListForBufferChange',
    value: function showOrHideSuggestionListForBufferChange(_ref6) {
      var newText = _ref6.newText;
      var newRange = _ref6.newRange;
      var oldText = _ref6.oldText;
      var oldRange = _ref6.oldRange;

      if (this.disposed) {
        return;
      }
      if (this.compositionInProgress) {
        return this.hideSuggestionList();
      }
      var shouldActivate = false;
      var cursorPositions = this.editor.getCursorBufferPositions();

      if (this.autoActivationEnabled || this.suggestionList.isActive()) {
        // Activate on space, a non-whitespace character, or a bracket-matcher pair.
        if (newText.length > 0) {
          if (cursorPositions.some(function (position) {
            return newRange.containsPoint(position);
          })) {
            if (newText === ' ' || newText.trim().length === 1) {
              shouldActivate = true;
            }
            if (newText.length === 2) {
              for (var pair of this.bracketMatcherPairs) {
                if (newText === pair) {
                  shouldActivate = true;
                }
              }
            }
          }
          // Suggestion list must be either active or backspaceTriggersAutocomplete must be true for activation to occur.
          // Activate on removal of a space, a non-whitespace character, or a bracket-matcher pair.
        } else if (oldText.length > 0) {
            if ((this.backspaceTriggersAutocomplete || this.suggestionList.isActive()) && cursorPositions.some(function (position) {
              return newRange.containsPoint(position);
            })) {
              if (oldText === ' ' || oldText.trim().length === 1) {
                shouldActivate = true;
              }
              if (oldText.length === 2) {
                for (var pair of this.bracketMatcherPairs) {
                  if (oldText === pair) {
                    shouldActivate = true;
                  }
                }
              }
            }
          }

        if (shouldActivate && this.shouldSuppressActivationForEditorClasses()) {
          shouldActivate = false;
        }
      }

      if (shouldActivate) {
        this.cancelHideSuggestionListRequest();
        this.requestNewSuggestions();
      } else {
        this.cancelNewSuggestionsRequest();
        this.hideSuggestionList();
      }
    }
  }, {
    key: 'shouldSuppressActivationForEditorClasses',
    value: function shouldSuppressActivationForEditorClasses() {
      for (var i = 0; i < this.suppressForClasses.length; i++) {
        var classNames = this.suppressForClasses[i];
        var containsCount = 0;
        for (var j = 0; j < classNames.length; j++) {
          var className = classNames[j];
          if (this.editorView.classList.contains(className)) {
            containsCount += 1;
          }
        }
        if (containsCount === classNames.length) {
          return true;
        }
      }
      return false;
    }

    // Public: Clean up, stop listening to events
  }, {
    key: 'dispose',
    value: function dispose() {
      this.hideSuggestionList();
      this.disposed = true;
      this.ready = false;
      if (this.editorSubscriptions) {
        this.editorSubscriptions.dispose();
      }
      this.editorSubscriptions = null;
      if (this.subscriptions) {
        this.subscriptions.dispose();
      }
      this.subscriptions = null;
      this.suggestionList = null;
      this.providerManager = null;
    }
  }]);

  return AutocompleteManager;
})();

exports['default'] = AutocompleteManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFdUQsTUFBTTs7b0JBQzVDLE1BQU07Ozs7c0JBQ0osUUFBUTs7OzswQkFDSixZQUFZOzs7OzhCQUNSLGlCQUFpQjs7OzsrQkFFaEIsb0JBQW9COzs7OzhCQUNyQixtQkFBbUI7Ozs7cUNBQ1osMkJBQTJCOzs7OzhCQUM5QixtQkFBbUI7OztBQVhsRCxXQUFXLENBQUE7O0FBY1gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTs7SUFFTSxtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsR0FDdkI7OzswQkFESSxtQkFBbUI7O0FBRXBDLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO0FBQzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUE7QUFDekMsUUFBSSxDQUFDLGtDQUFrQyxHQUFHLElBQUksQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN2RixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFD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LFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFBRSx5QkFBYSxJQUFJLENBQUMsQ0FBQTtXQUFFO1NBQzFFO0FBQ0QsWUFBSSxhQUFhLEtBQUssVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUFFLGlCQUFPLElBQUksQ0FBQTtTQUFFO09BQ3pEO0FBQ0QsYUFBTyxLQUFLLENBQUE7S0FDYjs7Ozs7V0FHTyxtQkFBRztBQUNULFVBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0FBQ3pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO0FBQ2xCLFVBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQzVCLFlBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNuQztBQUNELFVBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsVUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDN0I7QUFDRCxVQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtBQUN6QixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQTtBQUMxQixVQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtLQUM1Qjs7O1NBOXVCa0IsbUJBQW1COzs7cUJBQW5CLG1CQUFtQiIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItYmV0YS9zcmMvYXRvbS0xLjEzLjAtYmV0YTYvb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL2F1dG9jb21wbGV0ZS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgUmFuZ2UsIENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJ1xuaW1wb3J0IGZ1enphbGRyaW4gZnJvbSAnZnV6emFsZHJpbidcbmltcG9ydCBmdXp6YWxkcmluUGx1cyBmcm9tICdmdXp6YWxkcmluLXBsdXMnXG5cbmltcG9ydCBQcm92aWRlck1hbmFnZXIgZnJvbSAnLi9wcm92aWRlci1tYW5hZ2VyJ1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0IGZyb20gJy4vc3VnZ2VzdGlvbi1saXN0J1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBmcm9tICcuL3N1Z2dlc3Rpb24tbGlzdC1lbGVtZW50J1xuaW1wb3J0IHsgVW5pY29kZUxldHRlcnMgfSBmcm9tICcuL3VuaWNvZGUtaGVscGVycydcblxuLy8gRGVmZXJyZWQgcmVxdWlyZXNcbmxldCBtaW5pbWF0Y2ggPSBudWxsXG5sZXQgZ3JpbSA9IG51bGxcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXV0b2NvbXBsZXRlTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dG9zYXZlRW5hYmxlZCA9IGZhbHNlXG4gICAgdGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSA9IHRydWVcbiAgICB0aGlzLmF1dG9Db25maXJtU2luZ2xlU3VnZ2VzdGlvbkVuYWJsZWQgPSB0cnVlXG4gICAgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzID0gWycoKScsICdbXScsICd7fScsICdcIlwiJywgXCInJ1wiLCAnYGAnLCAn4oCc4oCdJywgJ+KAmOKAmScsICfCq8K7JywgJ+KAueKAuiddXG4gICAgdGhpcy5idWZmZXIgPSBudWxsXG4gICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIHRoaXMuZGlzcG9zZWQgPSBmYWxzZVxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLmVkaXRvclZpZXcgPSBudWxsXG4gICAgdGhpcy5wcm92aWRlck1hbmFnZXIgPSBudWxsXG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuc3VnZ2VzdGlvbkRlbGF5ID0gNTBcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbnVsbFxuICAgIHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzID0gW11cbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IGZhbHNlXG4gICAgdGhpcy5wcmVmaXhSZWdleCA9IG51bGxcbiAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IG51bGxcbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IgPSB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlQ29tbWFuZHMgPSB0aGlzLmhhbmRsZUNvbW1hbmRzLmJpbmQodGhpcylcbiAgICB0aGlzLmZpbmRTdWdnZXN0aW9ucyA9IHRoaXMuZmluZFN1Z2dlc3Rpb25zLmJpbmQodGhpcylcbiAgICB0aGlzLmdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycyA9IHRoaXMuZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzLmJpbmQodGhpcylcbiAgICB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucyA9IHRoaXMuZGlzcGxheVN1Z2dlc3Rpb25zLmJpbmQodGhpcylcbiAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCA9IHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0LmJpbmQodGhpcylcblxuICAgIHRoaXMudG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZSA9IHRoaXMudG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzID0gdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzLmJpbmQodGhpcylcbiAgICB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSA9IHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlLmJpbmQodGhpcylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5wcm92aWRlck1hbmFnZXIgPSBuZXcgUHJvdmlkZXJNYW5hZ2VyKClcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCcsIGVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQgPT4ge1xuICAgICAgaWYgKGVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQpIHtcbiAgICAgICAgdGhpcy5wcmVmaXhSZWdleCA9IG5ldyBSZWdFeHAoYChbJ1xcXCJ+XFxgIUAjXFxcXCQlXiYqXFxcXChcXFxcKVxcXFx7XFxcXH1cXFxcW1xcXFxdPVxcKywvXFxcXD8+XSk/KChbJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dK1ske1VuaWNvZGVMZXR0ZXJzfVxcXFxkXy1dKil8KFsuOjtbeyg8IF0rKSkkYClcbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXSokYClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJlZml4UmVnZXggPSAvKFxcYnxbJ1wifmAhQCNcXCQlXiYqXFwoXFwpXFx7XFx9XFxbXFxdPVxcKywvXFw/Pl0pKChcXHcrW1xcdy1dKil8KFsuOjtbeyg8IF0rKSkkL1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IC9eXFx3K1tcXHctXSokL1xuICAgICAgfVxuICAgIH1cbiAgICApKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5wcm92aWRlck1hbmFnZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnZpZXdzLmFkZFZpZXdQcm92aWRlcihTdWdnZXN0aW9uTGlzdCwgKG1vZGVsKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwpXG4gICAgfSkpXG5cbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5oYW5kbGVDb21tYW5kcygpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0KSAvLyBXZSdyZSBhZGRpbmcgdGhpcyBsYXN0IHNvIGl0IGlzIGRpc3Bvc2VkIGFmdGVyIGV2ZW50c1xuICAgIHRoaXMucmVhZHkgPSB0cnVlXG4gIH1cblxuICBzZXRTbmlwcGV0c01hbmFnZXIgKHNuaXBwZXRzTWFuYWdlcikge1xuICAgIHRoaXMuc25pcHBldHNNYW5hZ2VyID0gc25pcHBldHNNYW5hZ2VyXG4gIH1cblxuICB1cGRhdGVDdXJyZW50RWRpdG9yIChjdXJyZW50RWRpdG9yKSB7XG4gICAgaWYgKChjdXJyZW50RWRpdG9yID09IG51bGwpIHx8IGN1cnJlbnRFZGl0b3IgPT09IHRoaXMuZWRpdG9yKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICAvLyBTdG9wIHRyYWNraW5nIGVkaXRvciArIGJ1ZmZlclxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yVmlldyA9IG51bGxcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGxcbiAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuXG4gICAgaWYgKCF0aGlzLmVkaXRvcklzVmFsaWQoY3VycmVudEVkaXRvcikpIHsgcmV0dXJuIH1cblxuICAgIC8vIFRyYWNrIHRoZSBuZXcgZWRpdG9yLCBlZGl0b3JWaWV3LCBhbmQgYnVmZmVyXG4gICAgdGhpcy5lZGl0b3IgPSBjdXJyZW50RWRpdG9yXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuZWRpdG9yKVxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5lZGl0b3IuZ2V0QnVmZmVyKClcblxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIC8vIFN1YnNjcmliZSB0byBidWZmZXIgZXZlbnRzOlxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRTYXZlKChlKSA9PiB7IHRoaXMuYnVmZmVyU2F2ZWQoZSkgfSkpXG4gICAgaWYgKHR5cGVvZiB0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZVRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2UodGhpcy50b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlKSlcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2VUZXh0KHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcykpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGFmdGVyIGBUZXh0QnVmZmVyLnByb3RvdHlwZS5vbkRpZENoYW5nZVRleHRgIGxhbmRzIG9uIEF0b20gc3RhYmxlLlxuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZSh0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSkpXG4gICAgfVxuXG4gICAgLy8gV2F0Y2ggSU1FIEV2ZW50cyBUbyBBbGxvdyBJTUUgVG8gRnVuY3Rpb24gV2l0aG91dCBUaGUgU3VnZ2VzdGlvbiBMaXN0IFNob3dpbmdcbiAgICBjb25zdCBjb21wb3NpdGlvblN0YXJ0ID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSB0cnVlXG4gICAgfVxuICAgIGNvbnN0IGNvbXBvc2l0aW9uRW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuZWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbnN0YXJ0JywgY29tcG9zaXRpb25TdGFydClcbiAgICB0aGlzLmVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVkaXRvclZpZXcpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uc3RhcnQnLCBjb21wb3NpdGlvblN0YXJ0KVxuICAgICAgICB0aGlzLmVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIFN1YnNjcmliZSB0byBlZGl0b3IgZXZlbnRzOlxuICAgIC8vIENsb3NlIHRoZSBvdmVybGF5IHdoZW4gdGhlIGN1cnNvciBtb3ZlZCB3aXRob3V0IGNoYW5naW5nIGFueSB0ZXh0XG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKChlKSA9PiB7IHRoaXMuY3Vyc29yTW92ZWQoZSkgfSkpXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcbiAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBudWxsXG4gICAgfSkpXG4gIH1cblxuICBlZGl0b3JJc1ZhbGlkIChlZGl0b3IpIHtcbiAgICAvLyBUT0RPOiByZW1vdmUgY29uZGl0aW9uYWwgd2hlbiBgaXNUZXh0RWRpdG9yYCBpcyBzaGlwcGVkLlxuICAgIGlmICh0eXBlb2YgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGVkaXRvcilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVkaXRvciA9PSBudWxsKSB7IHJldHVybiBmYWxzZSB9XG4gICAgICAvLyBTaG91bGQgd2UgZGlzcXVhbGlmeSBUZXh0RWRpdG9ycyB3aXRoIHRoZSBHcmFtbWFyIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyP1xuICAgICAgcmV0dXJuIChlZGl0b3IuZ2V0VGV4dCAhPSBudWxsKVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUV2ZW50cyAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnRleHRFZGl0b3JzLm9ic2VydmUoKGVkaXRvcikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpXG4gICAgICBpZiAodmlldyA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbG9zZXN0KCdhdG9tLXRleHQtZWRpdG9yJykpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yKGVkaXRvcilcbiAgICAgIH1cbiAgICAgIHZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoZWxlbWVudCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IoZWRpdG9yKVxuICAgICAgfSlcbiAgICB9KSlcblxuICAgIC8vIFdhdGNoIGNvbmZpZyB2YWx1ZXNcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9zYXZlLmVuYWJsZWQnLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvc2F2ZUVuYWJsZWQgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlJywgKHZhbHVlKSA9PiB7IHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUF1dG9BY3RpdmF0aW9uJywgKHZhbHVlKSA9PiB7IHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVBdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb24nLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5jb25zdW1lU3VmZml4JywgKHZhbHVlKSA9PiB7IHRoaXMuY29uc3VtZVN1ZmZpeCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsICh2YWx1ZSkgPT4geyB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmZpbGVCbGFja2xpc3QnLCAodmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmZpbGVCbGFja2xpc3QgPSB2YWx1ZS5tYXAoKHMpID0+IHsgcmV0dXJuIHMudHJpbSgpIH0pXG4gICAgICB9XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuc3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcycsIHZhbHVlID0+IHtcbiAgICAgIHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB2YWx1ZVtpXVxuICAgICAgICBjb25zdCBjbGFzc2VzID0gKHNlbGVjdG9yLnRyaW0oKS5zcGxpdCgnLicpLmZpbHRlcigoY2xhc3NOYW1lKSA9PiBjbGFzc05hbWUudHJpbSgpKS5tYXAoKGNsYXNzTmFtZSkgPT4gY2xhc3NOYW1lLnRyaW0oKSkpXG4gICAgICAgIGlmIChjbGFzc2VzLmxlbmd0aCkgeyB0aGlzLnN1cHByZXNzRm9yQ2xhc3Nlcy5wdXNoKGNsYXNzZXMpIH1cbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIEhhbmRsZSBldmVudHMgZnJvbSBzdWdnZXN0aW9uIGxpc3RcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDb25maXJtKChlKSA9PiB7IHRoaXMuY29uZmlybShlKSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDYW5jZWwodGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QpKVxuICB9XG5cbiAgaGFuZGxlQ29tbWFuZHMgKCkge1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywge1xuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJzogKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gdHJ1ZVxuICAgICAgICBsZXQgYWN0aXZhdGVkTWFudWFsbHkgPSB0cnVlXG4gICAgICAgIGlmIChldmVudC5kZXRhaWwgJiYgZXZlbnQuZGV0YWlsLmFjdGl2YXRlZE1hbnVhbGx5ICE9PSBudWxsICYmIHR5cGVvZiBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgYWN0aXZhdGVkTWFudWFsbHkgPSBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbmRTdWdnZXN0aW9ucyhhY3RpdmF0ZWRNYW51YWxseSlcbiAgICAgIH1cbiAgICB9KSlcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEZpbmRzIHN1Z2dlc3Rpb25zIGZvciB0aGUgY3VycmVudCBwcmVmaXgsIHNldHMgdGhlIGxpc3QgaXRlbXMsXG4gIC8vIHBvc2l0aW9ucyB0aGUgb3ZlcmxheSBhbmQgc2hvd3MgaXRcbiAgZmluZFN1Z2dlc3Rpb25zIChhY3RpdmF0ZWRNYW51YWxseSkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgaWYgKCh0aGlzLnByb3ZpZGVyTWFuYWdlciA9PSBudWxsKSB8fCAodGhpcy5lZGl0b3IgPT0gbnVsbCkgfHwgKHRoaXMuYnVmZmVyID09IG51bGwpKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkKCkpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBpZiAoY3Vyc29yID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGJ1ZmZlclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBzY29wZURlc2NyaXB0b3IgPSBjdXJzb3IuZ2V0U2NvcGVEZXNjcmlwdG9yKClcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLmdldFByZWZpeCh0aGlzLmVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG5cbiAgICByZXR1cm4gdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMoe2VkaXRvcjogdGhpcy5lZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzY29wZURlc2NyaXB0b3IsIHByZWZpeCwgYWN0aXZhdGVkTWFudWFsbHl9KVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChvcHRpb25zKSB7XG4gICAgbGV0IHN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgIGNvbnN0IHByb3ZpZGVycyA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwcGxpY2FibGVQcm92aWRlcnMob3B0aW9ucy5lZGl0b3IsIG9wdGlvbnMuc2NvcGVEZXNjcmlwdG9yKVxuXG4gICAgY29uc3QgcHJvdmlkZXJQcm9taXNlcyA9IFtdXG4gICAgcHJvdmlkZXJzLmZvckVhY2gocHJvdmlkZXIgPT4ge1xuICAgICAgY29uc3QgYXBpVmVyc2lvbiA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwaVZlcnNpb25Gb3JQcm92aWRlcihwcm92aWRlcilcbiAgICAgIGNvbnN0IGFwaUlzMjAgPSBzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJylcblxuICAgICAgLy8gVE9ETyBBUEk6IHJlbW92ZSB1cGdyYWRpbmcgd2hlbiAxLjAgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICBsZXQgZ2V0U3VnZ2VzdGlvbnNcbiAgICAgIGxldCB1cGdyYWRlZE9wdGlvbnNcbiAgICAgIGlmIChhcGlJczIwKSB7XG4gICAgICAgIGdldFN1Z2dlc3Rpb25zID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMuYmluZChwcm92aWRlcilcbiAgICAgICAgdXBncmFkZWRPcHRpb25zID0gb3B0aW9uc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0U3VnZ2VzdGlvbnMgPSBwcm92aWRlci5yZXF1ZXN0SGFuZGxlci5iaW5kKHByb3ZpZGVyKVxuICAgICAgICB1cGdyYWRlZE9wdGlvbnMgPSB7XG4gICAgICAgICAgZWRpdG9yOiBvcHRpb25zLmVkaXRvcixcbiAgICAgICAgICBwcmVmaXg6IG9wdGlvbnMucHJlZml4LFxuICAgICAgICAgIGJ1ZmZlclBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHNjb3BlOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvcixcbiAgICAgICAgICBzY29wZUNoYWluOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKCksXG4gICAgICAgICAgYnVmZmVyOiBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKSxcbiAgICAgICAgICBjdXJzb3I6IG9wdGlvbnMuZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm92aWRlclByb21pc2VzLnB1c2goUHJvbWlzZS5yZXNvbHZlKGdldFN1Z2dlc3Rpb25zKHVwZ3JhZGVkT3B0aW9ucykpLnRoZW4ocHJvdmlkZXJTdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgIGlmIChwcm92aWRlclN1Z2dlc3Rpb25zID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgICAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHVwZ3JhZGluZyB3aGVuIDEuMCBzdXBwb3J0IGlzIHJlbW92ZWRcbiAgICAgICAgbGV0IGhhc0RlcHJlY2F0aW9ucyA9IGZhbHNlXG4gICAgICAgIGlmIChhcGlJczIwICYmIHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgaGFzRGVwcmVjYXRpb25zID0gdGhpcy5kZXByZWNhdGVGb3JTdWdnZXN0aW9uKHByb3ZpZGVyLCBwcm92aWRlclN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0RlcHJlY2F0aW9ucyB8fCAhYXBpSXMyMCkge1xuICAgICAgICAgIHByb3ZpZGVyU3VnZ2VzdGlvbnMgPSBwcm92aWRlclN1Z2dlc3Rpb25zLm1hcCgoc3VnZ2VzdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U3VnZ2VzdGlvbiA9IHtcbiAgICAgICAgICAgICAgdGV4dDogc3VnZ2VzdGlvbi50ZXh0ICE9IG51bGwgPyBzdWdnZXN0aW9uLnRleHQgOiBzdWdnZXN0aW9uLndvcmQsXG4gICAgICAgICAgICAgIHNuaXBwZXQ6IHN1Z2dlc3Rpb24uc25pcHBldCxcbiAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBzdWdnZXN0aW9uLnByZWZpeCxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiBzdWdnZXN0aW9uLmNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc3VnZ2VzdGlvbi50eXBlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbEhUTUwgPT0gbnVsbCkgJiYgc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWxIVE1MID0gc3VnZ2VzdGlvbi5sYWJlbCB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbCA9PSBudWxsKSAmJiAhc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPSBzdWdnZXN0aW9uLmxhYmVsIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdTdWdnZXN0aW9uXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYXNFbXB0eSA9IGZhbHNlIC8vIE9wdGltaXphdGlvbjogb25seSBjcmVhdGUgYW5vdGhlciBhcnJheSB3aGVuIHRoZXJlIGFyZSBlbXB0eSBpdGVtc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBzdWdnZXN0aW9uID0gcHJvdmlkZXJTdWdnZXN0aW9uc1tpXVxuICAgICAgICAgIGlmICghc3VnZ2VzdGlvbi5zbmlwcGV0ICYmICFzdWdnZXN0aW9uLnRleHQpIHsgaGFzRW1wdHkgPSB0cnVlIH1cbiAgICAgICAgICBpZiAoc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9PSBudWxsKSB7IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPSB0aGlzLmdldERlZmF1bHRSZXBsYWNlbWVudFByZWZpeChvcHRpb25zLnByZWZpeCkgfVxuICAgICAgICAgIHN1Z2dlc3Rpb24ucHJvdmlkZXIgPSBwcm92aWRlclxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0VtcHR5KSB7XG4gICAgICAgICAgY29uc3QgcmVzID0gW11cbiAgICAgICAgICBmb3IgKGNvbnN0IHMgb2YgcHJvdmlkZXJTdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHMuc25pcHBldCB8fCBzLnRleHQpIHtcbiAgICAgICAgICAgICAgcmVzLnB1c2gocylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHJlc1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3ZpZGVyLmZpbHRlclN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJvdmlkZXJTdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvdmlkZXJTdWdnZXN0aW9uc1xuICAgICAgfSkpXG4gICAgfSlcblxuICAgIGlmICghcHJvdmlkZXJQcm9taXNlcyB8fCAhcHJvdmlkZXJQcm9taXNlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHN1Z2dlc3Rpb25zUHJvbWlzZSA9IFByb21pc2UuYWxsKHByb3ZpZGVyUHJvbWlzZXMpXG4gICAgdGhpcy5jdXJyZW50U3VnZ2VzdGlvbnNQcm9taXNlID0gc3VnZ2VzdGlvbnNQcm9taXNlXG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgICAgLnRoZW4odGhpcy5tZXJnZVN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycylcbiAgICAgIC50aGVuKHN1Z2dlc3Rpb25zID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZSAhPT0gc3VnZ2VzdGlvbnNQcm9taXNlKSB7IHJldHVybiB9XG4gICAgICAgIGlmIChvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5ICYmIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHRoaXMuYXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uRW5hYmxlZCAmJiBzdWdnZXN0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAvLyBXaGVuIHRoZXJlIGlzIG9uZSBzdWdnZXN0aW9uIGluIG1hbnVhbCBtb2RlLCBqdXN0IGNvbmZpcm0gaXRcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb25maXJtKHN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucyhzdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucywge3ByZWZpeH0pIHtcbiAgICBjb25zdCByZXN1bHRzID0gW11cbiAgICBjb25zdCBmdXp6YWxkcmluUHJvdmlkZXIgPSB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPyBmdXp6YWxkcmluUGx1cyA6IGZ1enphbGRyaW5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBzb3J0U2NvcmUgbW9zdGx5IHByZXNlcnZlcyBpbiB0aGUgb3JpZ2luYWwgc29ydGluZy4gVGhlIGZ1bmN0aW9uIGlzXG4gICAgICAvLyBjaG9zZW4gc3VjaCB0aGF0IHN1Z2dlc3Rpb25zIHdpdGggYSB2ZXJ5IGhpZ2ggbWF0Y2ggc2NvcmUgY2FuIGJyZWFrIG91dC5cbiAgICAgIGxldCBzY29yZVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBzdWdnZXN0aW9uLnNvcnRTY29yZSA9IE1hdGgubWF4KCgtaSAvIDEwKSArIDMsIDApICsgMVxuICAgICAgc3VnZ2VzdGlvbi5zY29yZSA9IG51bGxcblxuICAgICAgY29uc3QgdGV4dCA9IChzdWdnZXN0aW9uLnNuaXBwZXQgfHwgc3VnZ2VzdGlvbi50ZXh0KVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvblByZWZpeCA9IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBwcmVmaXhcbiAgICAgIGNvbnN0IHByZWZpeElzRW1wdHkgPSAhc3VnZ2VzdGlvblByZWZpeCB8fCBzdWdnZXN0aW9uUHJlZml4ID09PSAnICdcbiAgICAgIGNvbnN0IGZpcnN0Q2hhcklzTWF0Y2ggPSAhcHJlZml4SXNFbXB0eSAmJiBzdWdnZXN0aW9uUHJlZml4WzBdLnRvTG93ZXJDYXNlKCkgPT09IHRleHRbMF0udG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAocHJlZml4SXNFbXB0eSkge1xuICAgICAgICByZXN1bHRzLnB1c2goc3VnZ2VzdGlvbilcbiAgICAgIH1cbiAgICAgIGlmIChmaXJzdENoYXJJc01hdGNoICYmIChzY29yZSA9IGZ1enphbGRyaW5Qcm92aWRlci5zY29yZSh0ZXh0LCBzdWdnZXN0aW9uUHJlZml4KSkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24uc2NvcmUgPSBzY29yZSAqIHN1Z2dlc3Rpb24uc29ydFNjb3JlXG4gICAgICAgIHJlc3VsdHMucHVzaChzdWdnZXN0aW9uKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJlc3VsdHMuc29ydCh0aGlzLnJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IpXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIHJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IgKGEsIGIpIHtcbiAgICBsZXQgYnNjb3JlID0gYi5zY29yZVxuICAgIGlmICghYnNjb3JlKSB7XG4gICAgICBic2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICBsZXQgYXNjb3JlID0gYS5zY29yZVxuICAgIGlmICghYXNjb3JlKSB7XG4gICAgICBhc2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICByZXR1cm4gYnNjb3JlIC0gYXNjb3JlXG4gIH1cblxuICAvLyBwcm92aWRlclN1Z2dlc3Rpb25zIC0gYXJyYXkgb2YgYXJyYXlzIG9mIHN1Z2dlc3Rpb25zIHByb3ZpZGVkIGJ5IGFsbCBjYWxsZWQgcHJvdmlkZXJzXG4gIG1lcmdlU3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChwcm92aWRlclN1Z2dlc3Rpb25zKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyU3VnZ2VzdGlvbnMucmVkdWNlKChzdWdnZXN0aW9ucywgcHJvdmlkZXJTdWdnZXN0aW9ucykgPT4ge1xuICAgICAgaWYgKHByb3ZpZGVyU3VnZ2VzdGlvbnMgJiYgcHJvdmlkZXJTdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgc3VnZ2VzdGlvbnMgPSBzdWdnZXN0aW9ucy5jb25jYXQocHJvdmlkZXJTdWdnZXN0aW9ucylcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zXG4gICAgfSwgW10pXG4gIH1cblxuICBkZXByZWNhdGVGb3JTdWdnZXN0aW9uIChwcm92aWRlciwgc3VnZ2VzdGlvbikge1xuICAgIGxldCBoYXNEZXByZWNhdGlvbnMgPSBmYWxzZVxuICAgIGlmIChzdWdnZXN0aW9uLndvcmQgIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGB3b3JkXFxgIGF0dHJpYnV0ZS5cblRoZSBcXGB3b3JkXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgdGV4dFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ucHJlZml4ICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgcHJlZml4XFxgIGF0dHJpYnV0ZS5cblRoZSBcXGBwcmVmaXhcXGAgYXR0cmlidXRlIGlzIG5vdyBcXGByZXBsYWNlbWVudFByZWZpeFxcYCBhbmQgaXMgb3B0aW9uYWwuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLmxhYmVsICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgbGFiZWxcXGAgYXR0cmlidXRlLlxuVGhlIFxcYGxhYmVsXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgcmlnaHRMYWJlbFxcYCBvciBcXGByaWdodExhYmVsSFRNTFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYG9uV2lsbENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25XaWxsQ29uZmlybVxcYCBjYWxsYmFjayBpcyBubyBsb25nZXIgc3VwcG9ydGVkLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5vbkRpZENvbmZpcm0gIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBvbkRpZENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25EaWRDb25maXJtXFxgIGNhbGxiYWNrIGlzIG5vdyBhIFxcYG9uRGlkSW5zZXJ0U3VnZ2VzdGlvblxcYCBjYWxsYmFjayBvbiB0aGUgcHJvdmlkZXIgaXRzZWxmLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gaGFzRGVwcmVjYXRpb25zXG4gIH1cblxuICBkaXNwbGF5U3VnZ2VzdGlvbnMgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgc3VnZ2VzdGlvbnMgPSB0aGlzLmdldFVuaXF1ZVN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zKVxuXG4gICAgaWYgKHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2hvd1N1Z2dlc3Rpb25MaXN0KHN1Z2dlc3Rpb25zLCBvcHRpb25zKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIGdldFVuaXF1ZVN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucykge1xuICAgIGNvbnN0IHNlZW4gPSB7fVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBjb25zdCB2YWwgPSBzdWdnZXN0aW9uLnRleHQgKyBzdWdnZXN0aW9uLnNuaXBwZXRcbiAgICAgIGlmICghc2Vlblt2YWxdKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICAgIHNlZW5bdmFsXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgZ2V0UHJlZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLnByZWZpeFJlZ2V4LmV4ZWMobGluZSlcbiAgICBpZiAoIXByZWZpeCB8fCAhcHJlZml4WzJdKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeFsyXVxuICB9XG5cbiAgZ2V0RGVmYXVsdFJlcGxhY2VtZW50UHJlZml4IChwcmVmaXgpIHtcbiAgICBpZiAodGhpcy53b3JkUHJlZml4UmVnZXgudGVzdChwcmVmaXgpKSB7XG4gICAgICByZXR1cm4gcHJlZml4XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc3VjY2Vzc2Z1bGx5IGNvbmZpcm1zIGEgc3VnZ2VzdGlvblxuICAvL1xuICAvLyBtYXRjaCAtIEFuIHtPYmplY3R9IHJlcHJlc2VudGluZyB0aGUgY29uZmlybWVkIHN1Z2dlc3Rpb25cbiAgY29uZmlybSAoc3VnZ2VzdGlvbikge1xuICAgIGlmICgodGhpcy5lZGl0b3IgPT0gbnVsbCkgfHwgKHN1Z2dlc3Rpb24gPT0gbnVsbCkgfHwgISF0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBhcGlWZXJzaW9uID0gdGhpcy5wcm92aWRlck1hbmFnZXIuYXBpVmVyc2lvbkZvclByb3ZpZGVyKHN1Z2dlc3Rpb24ucHJvdmlkZXIpXG4gICAgY29uc3QgYXBpSXMyMCA9IHNlbXZlci5zYXRpc2ZpZXMoYXBpVmVyc2lvbiwgJz49Mi4wLjAnKVxuICAgIGNvbnN0IHRyaWdnZXJQb3NpdGlvbiA9IHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAvLyBUT0RPIEFQSTogUmVtb3ZlIGFzIHRoaXMgaXMgbm8gbG9uZ2VyIHVzZWRcbiAgICBpZiAoc3VnZ2VzdGlvbi5vbldpbGxDb25maXJtKSB7XG4gICAgICBzdWdnZXN0aW9uLm9uV2lsbENvbmZpcm0oKVxuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBpZiAoc2VsZWN0aW9ucyAmJiBzZWxlY3Rpb25zLmxlbmd0aCkge1xuICAgICAgZm9yIChjb25zdCBzIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgaWYgKHMgJiYgcy5jbGVhcikge1xuICAgICAgICAgIHMuY2xlYXIoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuXG4gICAgdGhpcy5yZXBsYWNlVGV4dFdpdGhNYXRjaChzdWdnZXN0aW9uKVxuXG4gICAgLy8gVE9ETyBBUEk6IFJlbW92ZSB3aGVuIHdlIHJlbW92ZSB0aGUgMS4wIEFQSVxuICAgIGlmIChhcGlJczIwKSB7XG4gICAgICBpZiAoc3VnZ2VzdGlvbi5wcm92aWRlciAmJiBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbikge1xuICAgICAgICBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbih7ZWRpdG9yOiB0aGlzLmVkaXRvciwgc3VnZ2VzdGlvbiwgdHJpZ2dlclBvc2l0aW9ufSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaG93U3VnZ2VzdGlvbkxpc3QgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0LmNoYW5nZUl0ZW1zKHN1Z2dlc3Rpb25zKVxuICAgIHJldHVybiB0aGlzLnN1Z2dlc3Rpb25MaXN0LnNob3codGhpcy5lZGl0b3IsIG9wdGlvbnMpXG4gIH1cblxuICBoaWRlU3VnZ2VzdGlvbkxpc3QgKCkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdC5jaGFuZ2VJdGVtcyhudWxsKVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QuaGlkZSgpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgcmVxdWVzdEhpZGVTdWdnZXN0aW9uTGlzdCAoY29tbWFuZCkge1xuICAgIHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0LCAwKVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIGNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QgKCkge1xuICAgIHJldHVybiBjbGVhclRpbWVvdXQodGhpcy5oaWRlVGltZW91dClcbiAgfVxuXG4gIC8vIFByaXZhdGU6IFJlcGxhY2VzIHRoZSBjdXJyZW50IHByZWZpeCB3aXRoIHRoZSBnaXZlbiBtYXRjaC5cbiAgLy9cbiAgLy8gbWF0Y2ggLSBUaGUgbWF0Y2ggdG8gcmVwbGFjZSB0aGUgY3VycmVudCBwcmVmaXggd2l0aFxuICByZXBsYWNlVGV4dFdpdGhNYXRjaCAoc3VnZ2VzdGlvbikge1xuICAgIGlmICh0aGlzLmVkaXRvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBjdXJzb3JzID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgaWYgKGN1cnNvcnMgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLnRyYW5zYWN0KCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3Vyc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBjdXJzb3JzW2ldXG4gICAgICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgY29uc3QgYmVnaW5uaW5nUG9zaXRpb24gPSBbZW5kUG9zaXRpb24ucm93LCBlbmRQb3NpdGlvbi5jb2x1bW4gLSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aF1cblxuICAgICAgICBpZiAodGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2JlZ2lubmluZ1Bvc2l0aW9uLCBlbmRQb3NpdGlvbl0pID09PSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgICAgICAgY29uc3Qgc3VmZml4ID0gdGhpcy5jb25zdW1lU3VmZml4ID8gdGhpcy5nZXRTdWZmaXgodGhpcy5lZGl0b3IsIGVuZFBvc2l0aW9uLCBzdWdnZXN0aW9uKSA6ICcnXG4gICAgICAgICAgaWYgKHN1ZmZpeC5sZW5ndGgpIHsgY3Vyc29yLm1vdmVSaWdodChzdWZmaXgubGVuZ3RoKSB9XG4gICAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5zZWxlY3RMZWZ0KHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aClcblxuICAgICAgICAgIGlmICgoc3VnZ2VzdGlvbi5zbmlwcGV0ICE9IG51bGwpICYmICh0aGlzLnNuaXBwZXRzTWFuYWdlciAhPSBudWxsKSkge1xuICAgICAgICAgICAgdGhpcy5zbmlwcGV0c01hbmFnZXIuaW5zZXJ0U25pcHBldChzdWdnZXN0aW9uLnNuaXBwZXQsIHRoaXMuZWRpdG9yLCBjdXJzb3IpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnNvci5zZWxlY3Rpb24uaW5zZXJ0VGV4dChzdWdnZXN0aW9uLnRleHQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24udGV4dCA6IHN1Z2dlc3Rpb24uc25pcHBldCwge1xuICAgICAgICAgICAgICBhdXRvSW5kZW50TmV3bGluZTogdGhpcy5lZGl0b3Iuc2hvdWxkQXV0b0luZGVudCgpLFxuICAgICAgICAgICAgICBhdXRvRGVjcmVhc2VJbmRlbnQ6IHRoaXMuZWRpdG9yLnNob3VsZEF1dG9JbmRlbnQoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgKVxuICB9XG5cbiAgZ2V0U3VmZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzdWdnZXN0aW9uKSB7XG4gICAgLy8gVGhpcyBqdXN0IGNoZXdzIHRocm91Z2ggdGhlIHN1Z2dlc3Rpb24gYW5kIHRyaWVzIHRvIG1hdGNoIHRoZSBzdWdnZXN0aW9uXG4gICAgLy8gc3Vic3RyaW5nIHdpdGggdGhlIGxpbmVUZXh0IHN0YXJ0aW5nIGF0IHRoZSBjdXJzb3IuIFRoZXJlIGlzIHByb2JhYmx5IGFcbiAgICAvLyBtb3JlIGVmZmljaWVudCB3YXkgdG8gZG8gdGhpcy5cbiAgICBsZXQgc3VmZml4ID0gKHN1Z2dlc3Rpb24uc25pcHBldCAhPSBudWxsID8gc3VnZ2VzdGlvbi5zbmlwcGV0IDogc3VnZ2VzdGlvbi50ZXh0KVxuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gW2J1ZmZlclBvc2l0aW9uLnJvdywgYnVmZmVyUG9zaXRpb24uY29sdW1uICsgc3VmZml4Lmxlbmd0aF1cbiAgICBjb25zdCBlbmRPZkxpbmVUZXh0ID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtidWZmZXJQb3NpdGlvbiwgZW5kUG9zaXRpb25dKVxuICAgIGNvbnN0IG5vbldvcmRDaGFyYWN0ZXJzID0gbmV3IFNldChhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpLnNwbGl0KCcnKSlcbiAgICB3aGlsZSAoc3VmZml4KSB7XG4gICAgICBpZiAoZW5kT2ZMaW5lVGV4dC5zdGFydHNXaXRoKHN1ZmZpeCkgJiYgIW5vbldvcmRDaGFyYWN0ZXJzLmhhcyhzdWZmaXhbMF0pKSB7IGJyZWFrIH1cbiAgICAgIHN1ZmZpeCA9IHN1ZmZpeC5zbGljZSgxKVxuICAgIH1cbiAgICByZXR1cm4gc3VmZml4XG4gIH1cblxuICAvLyBQcml2YXRlOiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBmaWxlIGlzIGJsYWNrbGlzdGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIHtCb29sZWFufSB0aGF0IGRlZmluZXMgd2hldGhlciB0aGUgY3VycmVudCBmaWxlIGlzIGJsYWNrbGlzdGVkXG4gIGlzQ3VycmVudEZpbGVCbGFja0xpc3RlZCAoKSB7XG4gICAgLy8gbWluaW1hdGNoIGlzIHNsb3cuIE5vdCBuZWNlc3NhcnkgdG8gZG8gdGhpcyBjb21wdXRhdGlvbiBvbiBldmVyeSByZXF1ZXN0IGZvciBzdWdnZXN0aW9uc1xuICAgIGxldCBsZWZ0XG4gICAgaWYgKHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgIT0gbnVsbCkgeyByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSB9XG5cbiAgICBpZiAoKHRoaXMuZmlsZUJsYWNrbGlzdCA9PSBudWxsKSB8fCB0aGlzLmZpbGVCbGFja2xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gZmFsc2VcbiAgICAgIHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtaW5pbWF0Y2ggPT09ICd1bmRlZmluZWQnIHx8IG1pbmltYXRjaCA9PT0gbnVsbCkgeyBtaW5pbWF0Y2ggPSByZXF1aXJlKCdtaW5pbWF0Y2gnKSB9XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKChsZWZ0ID0gdGhpcy5idWZmZXIuZ2V0UGF0aCgpKSAhPSBudWxsID8gbGVmdCA6ICcnKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWxlQmxhY2tsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibGFja2xpc3RHbG9iID0gdGhpcy5maWxlQmxhY2tsaXN0W2ldXG4gICAgICBpZiAobWluaW1hdGNoKGZpbGVOYW1lLCBibGFja2xpc3RHbG9iKSkge1xuICAgICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gdHJ1ZVxuICAgICAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBmYWxzZVxuICAgIHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlXG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXRzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IGhhcyBiZWVuIG1vZGlmaWVkXG4gIHJlcXVlc3ROZXdTdWdnZXN0aW9ucyAoKSB7XG4gICAgbGV0IGRlbGF5ID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5hdXRvQWN0aXZhdGlvbkRlbGF5JylcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxheVRpbWVvdXQpXG4gICAgaWYgKHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkgeyBkZWxheSA9IHRoaXMuc3VnZ2VzdGlvbkRlbGF5IH1cbiAgICB0aGlzLmRlbGF5VGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5maW5kU3VnZ2VzdGlvbnMsIGRlbGF5KVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gdHJ1ZVxuICB9XG5cbiAgY2FuY2VsTmV3U3VnZ2VzdGlvbnNSZXF1ZXN0ICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxheVRpbWVvdXQpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgY3Vyc29yIGhhcyBtb3ZlZC4gQ2FuY2VscyB0aGUgYXV0b2NvbXBsZXRpb24gaWZcbiAgLy8gdGhlIHRleHQgaGFzIG5vdCBiZWVuIGNoYW5nZWQuXG4gIC8vXG4gIC8vIGRhdGEgLSBBbiB7T2JqZWN0fSBjb250YWluaW5nIGluZm9ybWF0aW9uIG9uIHdoeSB0aGUgY3Vyc29yIGhhcyBiZWVuIG1vdmVkXG4gIGN1cnNvck1vdmVkICh7dGV4dENoYW5nZWR9KSB7XG4gICAgLy8gVGhlIGRlbGF5IGlzIGEgd29ya2Fyb3VuZCBmb3IgdGhlIGJhY2tzcGFjZSBjYXNlLiBUaGUgd2F5IGF0b20gaW1wbGVtZW50c1xuICAgIC8vIGJhY2tzcGFjZSBpcyB0byBzZWxlY3QgbGVmdCAxIGNoYXIsIHRoZW4gZGVsZXRlLiBUaGlzIHJlc3VsdHMgaW4gYVxuICAgIC8vIGN1cnNvck1vdmVkIGV2ZW50IHdpdGggdGV4dENoYW5nZWQgPT0gZmFsc2UuIFNvIHdlIGRlbGF5LCBhbmQgaWYgdGhlXG4gICAgLy8gYnVmZmVyQ2hhbmdlZCBoYW5kbGVyIGRlY2lkZXMgdG8gc2hvdyBzdWdnZXN0aW9ucywgaXQgd2lsbCBjYW5jZWwgdGhlXG4gICAgLy8gaGlkZVN1Z2dlc3Rpb25MaXN0IHJlcXVlc3QuIElmIHRoZXJlIGlzIG5vIGJ1ZmZlckNoYW5nZWQgZXZlbnQsXG4gICAgLy8gc3VnZ2VzdGlvbkxpc3Qgd2lsbCBiZSBoaWRkZW4uXG4gICAgaWYgKCF0ZXh0Q2hhbmdlZCAmJiAhdGhpcy5zaG91bGRBY3RpdmF0ZSkgeyByZXR1cm4gdGhpcy5yZXF1ZXN0SGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgdXNlciBzYXZlcyB0aGUgZG9jdW1lbnQuIENhbmNlbHMgdGhlXG4gIC8vIGF1dG9jb21wbGV0aW9uLlxuICBidWZmZXJTYXZlZCAoKSB7XG4gICAgaWYgKCF0aGlzLmF1dG9zYXZlRW5hYmxlZCkgeyByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG4gIH1cblxuICB0b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlICh7bmV3VGV4dCwgbmV3UmFuZ2UsIG9sZFRleHQsIG9sZFJhbmdlfSkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuc2hvdWxkQWN0aXZhdGUpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MpIHsgcmV0dXJuIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuXG4gICAgaWYgKHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBBY3RpdmF0ZSBvbiBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICAgIGlmIChuZXdUZXh0ID09PSAnICcgfHwgbmV3VGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgIGlmIChuZXdUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG9sZFRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBTdWdnZXN0aW9uIGxpc3QgbXVzdCBiZSBlaXRoZXIgYWN0aXZlIG9yIGJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIG11c3QgYmUgdHJ1ZSBmb3IgYWN0aXZhdGlvbiB0byBvY2N1ci5cbiAgICAgICAgLy8gQWN0aXZhdGUgb24gcmVtb3ZhbCBvZiBhIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgICAgaWYgKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSB7XG4gICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID4gMCAmJiAodGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpKSB7XG4gICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gJyAnIHx8IG9sZFRleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2xkVGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgICAgIGlmIChvbGRUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSAmJiB0aGlzLnNob3VsZFN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMoKSkge1xuICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzICh7Y2hhbmdlc30pIHtcbiAgICBjb25zdCBsYXN0Q3Vyc29yUG9zaXRpb24gPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGNvbnN0IGNoYW5nZU9jY3VycmVkTmVhckxhc3RDdXJzb3IgPSBjaGFuZ2VzLnNvbWUoKHtzdGFydCwgbmV3RXh0ZW50fSkgPT4ge1xuICAgICAgY29uc3QgbmV3UmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnQsIHN0YXJ0LnRyYXZlcnNlKG5ld0V4dGVudCkpXG4gICAgICByZXR1cm4gbmV3UmFuZ2UuY29udGFpbnNQb2ludChsYXN0Q3Vyc29yUG9zaXRpb24pXG4gICAgfSlcblxuICAgIGlmICh0aGlzLnNob3VsZEFjdGl2YXRlICYmIGNoYW5nZU9jY3VycmVkTmVhckxhc3RDdXJzb3IpIHtcbiAgICAgIHRoaXMuY2FuY2VsSGlkZVN1Z2dlc3Rpb25MaXN0UmVxdWVzdCgpXG4gICAgICB0aGlzLnJlcXVlc3ROZXdTdWdnZXN0aW9ucygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsTmV3U3VnZ2VzdGlvbnNSZXF1ZXN0KClcbiAgICAgIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG5cbiAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgfVxuXG4gIHNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSAoe25ld1RleHQsIG5ld1JhbmdlLCBvbGRUZXh0LCBvbGRSYW5nZX0pIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcykgeyByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG4gICAgbGV0IHNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgICBjb25zdCBjdXJzb3JQb3NpdGlvbnMgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKVxuXG4gICAgaWYgKHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgLy8gQWN0aXZhdGUgb24gc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoY3Vyc29yUG9zaXRpb25zLnNvbWUoKHBvc2l0aW9uKSA9PiB7IHJldHVybiBuZXdSYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSB9KSkge1xuICAgICAgICAgIGlmIChuZXdUZXh0ID09PSAnICcgfHwgbmV3VGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICAgIGlmIChuZXdUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIC8vIFN1Z2dlc3Rpb24gbGlzdCBtdXN0IGJlIGVpdGhlciBhY3RpdmUgb3IgYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgbXVzdCBiZSB0cnVlIGZvciBhY3RpdmF0aW9uIHRvIG9jY3VyLlxuICAgICAgLy8gQWN0aXZhdGUgb24gcmVtb3ZhbCBvZiBhIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgIH0gZWxzZSBpZiAob2xkVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmICgodGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpICYmXG4gICAgICAgIChjdXJzb3JQb3NpdGlvbnMuc29tZSgocG9zaXRpb24pID0+IHsgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pIH0pKSkge1xuICAgICAgICAgIGlmIChvbGRUZXh0ID09PSAnICcgfHwgb2xkVGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICAgIGlmIChvbGRUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNob3VsZEFjdGl2YXRlICYmIHRoaXMuc2hvdWxkU3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcygpKSB7IHNob3VsZEFjdGl2YXRlID0gZmFsc2UgfVxuICAgIH1cblxuICAgIGlmIChzaG91bGRBY3RpdmF0ZSkge1xuICAgICAgdGhpcy5jYW5jZWxIaWRlU3VnZ2VzdGlvbkxpc3RSZXF1ZXN0KClcbiAgICAgIHRoaXMucmVxdWVzdE5ld1N1Z2dlc3Rpb25zKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxOZXdTdWdnZXN0aW9uc1JlcXVlc3QoKVxuICAgICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIHNob3VsZFN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMgKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNsYXNzTmFtZXMgPSB0aGlzLnN1cHByZXNzRm9yQ2xhc3Nlc1tpXVxuICAgICAgbGV0IGNvbnRhaW5zQ291bnQgPSAwXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNsYXNzTmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lc1tqXVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JWaWV3LmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpKSB7IGNvbnRhaW5zQ291bnQgKz0gMSB9XG4gICAgICB9XG4gICAgICBpZiAoY29udGFpbnNDb3VudCA9PT0gY2xhc3NOYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRydWUgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ2xlYW4gdXAsIHN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50c1xuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG4gICAgdGhpcy5kaXNwb3NlZCA9IHRydWVcbiAgICB0aGlzLnJlYWR5ID0gZmFsc2VcbiAgICBpZiAodGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBpZiAodGhpcy5zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbnVsbFxuICB9XG59XG4iXX0=