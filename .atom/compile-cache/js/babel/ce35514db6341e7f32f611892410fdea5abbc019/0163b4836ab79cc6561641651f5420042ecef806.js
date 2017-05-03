Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _eventKit = require('event-kit');

var _atom = require('atom');

var _textEditor = require('./text-editor');

var _textEditor2 = _interopRequireDefault(_textEditor);

var _scopeDescriptor = require('./scope-descriptor');

var _scopeDescriptor2 = _interopRequireDefault(_scopeDescriptor);

var EDITOR_PARAMS_BY_SETTING_KEY = [['core.fileEncoding', 'encoding'], ['editor.atomicSoftTabs', 'atomicSoftTabs'], ['editor.showInvisibles', 'showInvisibles'], ['editor.tabLength', 'tabLength'], ['editor.invisibles', 'invisibles'], ['editor.showIndentGuide', 'showIndentGuide'], ['editor.showLineNumbers', 'showLineNumbers'], ['editor.softWrap', 'softWrapped'], ['editor.softWrapHangingIndent', 'softWrapHangingIndentLength'], ['editor.softWrapAtPreferredLineLength', 'softWrapAtPreferredLineLength'], ['editor.preferredLineLength', 'preferredLineLength'], ['editor.autoIndent', 'autoIndent'], ['editor.autoIndentOnPaste', 'autoIndentOnPaste'], ['editor.scrollPastEnd', 'scrollPastEnd'], ['editor.undoGroupingInterval', 'undoGroupingInterval'], ['editor.nonWordCharacters', 'nonWordCharacters'], ['editor.scrollSensitivity', 'scrollSensitivity']];

var GRAMMAR_SELECTION_RANGE = (0, _atom.Range)(_atom.Point.ZERO, (0, _atom.Point)(10, 0)).freeze();

// Experimental: This global registry tracks registered `TextEditors`.
//
// If you want to add functionality to a wider set of text editors than just
// those appearing within workspace panes, use `atom.textEditors.observe` to
// invoke a callback for all current and future registered text editors.
//
// If you want packages to be able to add functionality to your non-pane text
// editors (such as a search field in a custom user interface element), register
// them for observation via `atom.textEditors.add`. **Important:** When you're
// done using your editor, be sure to call `dispose` on the returned disposable
// to avoid leaking editors.

var TextEditorRegistry = (function () {
  function TextEditorRegistry(_ref) {
    var config = _ref.config;
    var grammarRegistry = _ref.grammarRegistry;
    var assert = _ref.assert;
    var packageManager = _ref.packageManager;

    _classCallCheck(this, TextEditorRegistry);

    this.assert = assert;
    this.config = config;
    this.grammarRegistry = grammarRegistry;
    this.scopedSettingsDelegate = new ScopedSettingsDelegate(config);
    this.grammarAddedOrUpdated = this.grammarAddedOrUpdated.bind(this);
    this.clear();

    this.initialPackageActivationPromise = new Promise(function (resolve) {
      // TODO: Remove this usage of a private property of PackageManager.
      // Should PackageManager just expose a promise-based API like this?
      if (packageManager.deferredActivationHooks) {
        packageManager.onDidActivateInitialPackages(resolve);
      } else {
        resolve();
      }
    });
  }

  _createClass(TextEditorRegistry, [{
    key: 'deserialize',
    value: function deserialize(state) {
      this.editorGrammarOverrides = state.editorGrammarOverrides;
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return {
        editorGrammarOverrides: Object.assign({}, this.editorGrammarOverrides)
      };
    }
  }, {
    key: 'clear',
    value: function clear() {
      if (this.subscriptions) {
        this.subscriptions.dispose();
      }

      this.subscriptions = new _eventKit.CompositeDisposable();
      this.editors = new Set();
      this.emitter = new _eventKit.Emitter();
      this.scopesWithConfigSubscriptions = new Set();
      this.editorsWithMaintainedConfig = new Set();
      this.editorsWithMaintainedGrammar = new Set();
      this.editorGrammarOverrides = {};
      this.editorGrammarScores = new WeakMap();
      this.subscriptions.add(this.grammarRegistry.onDidAddGrammar(this.grammarAddedOrUpdated), this.grammarRegistry.onDidUpdateGrammar(this.grammarAddedOrUpdated));
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.subscriptions.dispose();
      this.editorsWithMaintainedConfig = null;
    }

    // Register a `TextEditor`.
    //
    // * `editor` The editor to register.
    //
    // Returns a {Disposable} on which `.dispose()` can be called to remove the
    // added editor. To avoid any memory leaks this should be called when the
    // editor is destroyed.
  }, {
    key: 'add',
    value: function add(editor) {
      var _this = this;

      this.editors.add(editor);
      editor.registered = true;
      this.emitter.emit('did-add-editor', editor);

      return new _eventKit.Disposable(function () {
        return _this.remove(editor);
      });
    }
  }, {
    key: 'build',
    value: function build(params) {
      params = Object.assign({ assert: this.assert }, params);

      var scope = null;
      if (params.buffer) {
        var filePath = params.buffer.getPath();
        var headContent = params.buffer.getTextInRange(GRAMMAR_SELECTION_RANGE);
        params.grammar = this.grammarRegistry.selectGrammar(filePath, headContent);
        scope = new _scopeDescriptor2['default']({ scopes: [params.grammar.scopeName] });
      }

      Object.assign(params, this.textEditorParamsForScope(scope));

      return new _textEditor2['default'](params);
    }

    // Remove a `TextEditor`.
    //
    // * `editor` The editor to remove.
    //
    // Returns a {Boolean} indicating whether the editor was successfully removed.
  }, {
    key: 'remove',
    value: function remove(editor) {
      var removed = this.editors['delete'](editor);
      editor.registered = false;
      return removed;
    }

    // Invoke the given callback with all the current and future registered
    // `TextEditors`.
    //
    // * `callback` {Function} to be called with current and future text editors.
    //
    // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  }, {
    key: 'observe',
    value: function observe(callback) {
      this.editors.forEach(callback);
      return this.emitter.on('did-add-editor', callback);
    }

    // Keep a {TextEditor}'s configuration in sync with Atom's settings.
    //
    // * `editor` The editor whose configuration will be maintained.
    //
    // Returns a {Disposable} that can be used to stop updating the editor's
    // configuration.
  }, {
    key: 'maintainConfig',
    value: function maintainConfig(editor) {
      var _this2 = this;

      if (this.editorsWithMaintainedConfig.has(editor)) {
        return new _eventKit.Disposable(noop);
      }
      this.editorsWithMaintainedConfig.add(editor);

      editor.setScopedSettingsDelegate(this.scopedSettingsDelegate);

      this.subscribeToSettingsForEditorScope(editor);
      var grammarChangeSubscription = editor.onDidChangeGrammar(function () {
        _this2.subscribeToSettingsForEditorScope(editor);
      });
      this.subscriptions.add(grammarChangeSubscription);

      var updateTabTypes = function updateTabTypes() {
        var configOptions = { scope: editor.getRootScopeDescriptor() };
        editor.setSoftTabs(shouldEditorUseSoftTabs(editor, _this2.config.get('editor.tabType', configOptions), _this2.config.get('editor.softTabs', configOptions)));
      };

      updateTabTypes();
      var tokenizeSubscription = editor.onDidTokenize(updateTabTypes);
      this.subscriptions.add(tokenizeSubscription);

      return new _eventKit.Disposable(function () {
        _this2.editorsWithMaintainedConfig['delete'](editor);
        editor.setScopedSettingsDelegate(null);
        tokenizeSubscription.dispose();
        grammarChangeSubscription.dispose();
        _this2.subscriptions.remove(grammarChangeSubscription);
        _this2.subscriptions.remove(tokenizeSubscription);
      });
    }

    // Set a {TextEditor}'s grammar based on its path and content, and continue
    // to update its grammar as gramamrs are added or updated, or the editor's
    // file path changes.
    //
    // * `editor` The editor whose grammar will be maintained.
    //
    // Returns a {Disposable} that can be used to stop updating the editor's
    // grammar.
  }, {
    key: 'maintainGrammar',
    value: function maintainGrammar(editor) {
      var _this3 = this;

      if (this.editorsWithMaintainedGrammar.has(editor)) {
        return new _eventKit.Disposable(noop);
      }

      this.editorsWithMaintainedGrammar.add(editor);

      var buffer = editor.getBuffer();
      for (var existingEditor of this.editorsWithMaintainedGrammar) {
        if (existingEditor.getBuffer() === buffer) {
          var existingOverride = this.editorGrammarOverrides[existingEditor.id];
          if (existingOverride) {
            this.editorGrammarOverrides[editor.id] = existingOverride;
          }
          break;
        }
      }

      this.selectGrammarForEditor(editor);

      var pathChangeSubscription = editor.onDidChangePath(function () {
        _this3.editorGrammarScores['delete'](editor);
        _this3.selectGrammarForEditor(editor);
      });

      this.subscriptions.add(pathChangeSubscription);

      return new _eventKit.Disposable(function () {
        delete _this3.editorGrammarOverrides[editor.id];
        _this3.editorsWithMaintainedGrammar['delete'](editor);
        _this3.subscriptions.remove(pathChangeSubscription);
        pathChangeSubscription.dispose();
      });
    }

    // Force a {TextEditor} to use a different grammar than the one that would
    // otherwise be selected for it.
    //
    // * `editor` The editor whose gramamr will be set.
    // * `scopeName` The {String} root scope name for the desired {Grammar}.
  }, {
    key: 'setGrammarOverride',
    value: function setGrammarOverride(editor, scopeName) {
      this.editorGrammarOverrides[editor.id] = scopeName;
      this.editorGrammarScores['delete'](editor);
      editor.setGrammar(this.grammarRegistry.grammarForScopeName(scopeName));
    }

    // Retrieve the grammar scope name that has been set as a grammar override
    // for the given {TextEditor}.
    //
    // * `editor` The editor.
    //
    // Returns a {String} scope name, or `null` if no override has been set
    // for the given editor.
  }, {
    key: 'getGrammarOverride',
    value: function getGrammarOverride(editor) {
      return this.editorGrammarOverrides[editor.id];
    }

    // Remove any grammar override that has been set for the given {TextEditor}.
    //
    // * `editor` The editor.
  }, {
    key: 'clearGrammarOverride',
    value: function clearGrammarOverride(editor) {
      delete this.editorGrammarOverrides[editor.id];
      this.selectGrammarForEditor(editor);
    }

    // Private

  }, {
    key: 'grammarAddedOrUpdated',
    value: function grammarAddedOrUpdated(grammar) {
      var _this4 = this;

      this.editorsWithMaintainedGrammar.forEach(function (editor) {
        if (grammar.injectionSelector) {
          if (editor.tokenizedBuffer.hasTokenForSelector(grammar.injectionSelector)) {
            editor.tokenizedBuffer.retokenizeLines();
          }
          return;
        }

        var grammarOverride = _this4.editorGrammarOverrides[editor.id];
        if (grammarOverride) {
          if (grammar.scopeName === grammarOverride) {
            editor.setGrammar(grammar);
          }
        } else {
          var score = _this4.grammarRegistry.getGrammarScore(grammar, editor.getPath(), editor.getTextInBufferRange(GRAMMAR_SELECTION_RANGE));

          var currentScore = _this4.editorGrammarScores.get(editor);
          if (currentScore == null || score > currentScore) {
            editor.setGrammar(grammar, score);
            _this4.editorGrammarScores.set(editor, score);
          }
        }
      });
    }
  }, {
    key: 'selectGrammarForEditor',
    value: function selectGrammarForEditor(editor) {
      var grammarOverride = this.editorGrammarOverrides[editor.id];

      if (grammarOverride) {
        var _grammar = this.grammarRegistry.grammarForScopeName(grammarOverride);
        editor.setGrammar(_grammar);
        return;
      }

      var _grammarRegistry$selectGrammarWithScore = this.grammarRegistry.selectGrammarWithScore(editor.getPath(), editor.getTextInBufferRange(GRAMMAR_SELECTION_RANGE));

      var grammar = _grammarRegistry$selectGrammarWithScore.grammar;
      var score = _grammarRegistry$selectGrammarWithScore.score;

      if (!grammar) {
        throw new Error('No grammar found for path: ' + editor.getPath());
      }

      var currentScore = this.editorGrammarScores.get(editor);
      if (currentScore == null || score > currentScore) {
        editor.setGrammar(grammar);
        this.editorGrammarScores.set(editor, score);
      }
    }
  }, {
    key: 'subscribeToSettingsForEditorScope',
    value: _asyncToGenerator(function* (editor) {
      var _this5 = this;

      yield this.initialPackageActivationPromise;

      var scopeDescriptor = editor.getRootScopeDescriptor();
      var scopeChain = scopeDescriptor.getScopeChain();

      editor.update(this.textEditorParamsForScope(scopeDescriptor));

      if (!this.scopesWithConfigSubscriptions.has(scopeChain)) {
        (function () {
          _this5.scopesWithConfigSubscriptions.add(scopeChain);
          var configOptions = { scope: scopeDescriptor };

          var _loop = function (_ref2) {
            _ref22 = _slicedToArray(_ref2, 2);
            var settingKey = _ref22[0];
            var paramName = _ref22[1];

            _this5.subscriptions.add(_this5.config.onDidChange(settingKey, configOptions, function (_ref3) {
              var newValue = _ref3.newValue;

              _this5.editorsWithMaintainedConfig.forEach(function (editor) {
                if (editor.getRootScopeDescriptor().isEqual(scopeDescriptor)) {
                  editor.update(_defineProperty({}, paramName, newValue));
                }
              });
            }));
          };

          for (var _ref2 of EDITOR_PARAMS_BY_SETTING_KEY) {
            var _ref22;

            _loop(_ref2);
          }

          var updateTabTypes = function updateTabTypes() {
            var tabType = _this5.config.get('editor.tabType', configOptions);
            var softTabs = _this5.config.get('editor.softTabs', configOptions);
            _this5.editorsWithMaintainedConfig.forEach(function (editor) {
              if (editor.getRootScopeDescriptor().isEqual(scopeDescriptor)) {
                editor.setSoftTabs(shouldEditorUseSoftTabs(editor, tabType, softTabs));
              }
            });
          };

          _this5.subscriptions.add(_this5.config.onDidChange('editor.tabType', configOptions, updateTabTypes), _this5.config.onDidChange('editor.softTabs', configOptions, updateTabTypes));
        })();
      }
    })
  }, {
    key: 'textEditorParamsForScope',
    value: function textEditorParamsForScope(scopeDescriptor) {
      var result = {};
      var configOptions = { scope: scopeDescriptor };
      for (var _ref43 of EDITOR_PARAMS_BY_SETTING_KEY) {
        var _ref42 = _slicedToArray(_ref43, 2);

        var settingKey = _ref42[0];
        var paramName = _ref42[1];

        result[paramName] = this.config.get(settingKey, configOptions);
      }
      return result;
    }
  }]);

  return TextEditorRegistry;
})();

exports['default'] = TextEditorRegistry;

function shouldEditorUseSoftTabs(editor, tabType, softTabs) {
  switch (tabType) {
    case 'hard':
      return false;
    case 'soft':
      return true;
    case 'auto':
      switch (editor.usesSoftTabs()) {
        case true:
          return true;
        case false:
          return false;
        default:
          return softTabs;
      }
  }
}

function noop() {}

var ScopedSettingsDelegate = (function () {
  function ScopedSettingsDelegate(config) {
    _classCallCheck(this, ScopedSettingsDelegate);

    this.config = config;
  }

  _createClass(ScopedSettingsDelegate, [{
    key: 'getNonWordCharacters',
    value: function getNonWordCharacters(scope) {
      return this.config.get('editor.nonWordCharacters', { scope: scope });
    }
  }, {
    key: 'getIncreaseIndentPattern',
    value: function getIncreaseIndentPattern(scope) {
      return this.config.get('editor.increaseIndentPattern', { scope: scope });
    }
  }, {
    key: 'getDecreaseIndentPattern',
    value: function getDecreaseIndentPattern(scope) {
      return this.config.get('editor.decreaseIndentPattern', { scope: scope });
    }
  }, {
    key: 'getDecreaseNextIndentPattern',
    value: function getDecreaseNextIndentPattern(scope) {
      return this.config.get('editor.decreaseNextIndentPattern', { scope: scope });
    }
  }, {
    key: 'getFoldEndPattern',
    value: function getFoldEndPattern(scope) {
      return this.config.get('editor.foldEndPattern', { scope: scope });
    }
  }, {
    key: 'getCommentStrings',
    value: function getCommentStrings(scope) {
      var commentStartEntries = this.config.getAll('editor.commentStart', { scope: scope });
      var commentEndEntries = this.config.getAll('editor.commentEnd', { scope: scope });
      var commentStartEntry = commentStartEntries[0];
      var commentEndEntry = commentEndEntries.find(function (entry) {
        return entry.scopeSelector === commentStartEntry.scopeSelector;
      });
      return {
        commentStartString: commentStartEntry && commentStartEntry.value,
        commentEndString: commentEndEntry && commentEndEntry.value
      };
    }
  }]);

  return ScopedSettingsDelegate;
})();

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvdGV4dC1lZGl0b3ItcmVnaXN0cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQUV1RCxXQUFXOztvQkFDdkMsTUFBTTs7MEJBQ1YsZUFBZTs7OzsrQkFDVixvQkFBb0I7Ozs7QUFFaEQsSUFBTSw0QkFBNEIsR0FBRyxDQUNuQyxDQUFDLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxFQUNqQyxDQUFDLHVCQUF1QixFQUFFLGdCQUFnQixDQUFDLEVBQzNDLENBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLENBQUMsRUFDM0MsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsRUFDakMsQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUMsRUFDbkMsQ0FBQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUM3QyxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixDQUFDLEVBQzdDLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLEVBQ2xDLENBQUMsOEJBQThCLEVBQUUsNkJBQTZCLENBQUMsRUFDL0QsQ0FBQyxzQ0FBc0MsRUFBRSwrQkFBK0IsQ0FBQyxFQUN6RSxDQUFDLDRCQUE0QixFQUFFLHFCQUFxQixDQUFDLEVBQ3JELENBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUFDLEVBQ25DLENBQUMsMEJBQTBCLEVBQUUsbUJBQW1CLENBQUMsRUFDakQsQ0FBQyxzQkFBc0IsRUFBRSxlQUFlLENBQUMsRUFDekMsQ0FBQyw2QkFBNkIsRUFBRSxzQkFBc0IsQ0FBQyxFQUN2RCxDQUFDLDBCQUEwQixFQUFFLG1CQUFtQixDQUFDLEVBQ2pELENBQUMsMEJBQTBCLEVBQUUsbUJBQW1CLENBQUMsQ0FDbEQsQ0FBQTs7QUFFRCxJQUFNLHVCQUF1QixHQUFHLGlCQUFNLFlBQU0sSUFBSSxFQUFFLGlCQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBOzs7Ozs7Ozs7Ozs7OztJQWFuRCxrQkFBa0I7QUFDekIsV0FETyxrQkFBa0IsQ0FDeEIsSUFBaUQsRUFBRTtRQUFsRCxNQUFNLEdBQVAsSUFBaUQsQ0FBaEQsTUFBTTtRQUFFLGVBQWUsR0FBeEIsSUFBaUQsQ0FBeEMsZUFBZTtRQUFFLE1BQU0sR0FBaEMsSUFBaUQsQ0FBdkIsTUFBTTtRQUFFLGNBQWMsR0FBaEQsSUFBaUQsQ0FBZixjQUFjOzswQkFEMUMsa0JBQWtCOztBQUVuQyxRQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixRQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixRQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQTtBQUN0QyxRQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNoRSxRQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNsRSxRQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7O0FBRVosUUFBSSxDQUFDLCtCQUErQixHQUFHLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFLOzs7QUFHOUQsVUFBSSxjQUFjLENBQUMsdUJBQXVCLEVBQUU7QUFDMUMsc0JBQWMsQ0FBQyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQTtPQUNyRCxNQUFNO0FBQ0wsZUFBTyxFQUFFLENBQUE7T0FDVjtLQUNGLENBQUMsQ0FBQTtHQUNIOztlQWxCa0Isa0JBQWtCOztXQW9CekIscUJBQUMsS0FBSyxFQUFFO0FBQ2xCLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUMsc0JBQXNCLENBQUE7S0FDM0Q7OztXQUVTLHFCQUFHO0FBQ1gsYUFBTztBQUNMLDhCQUFzQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztPQUN2RSxDQUFBO0tBQ0Y7OztXQUVLLGlCQUFHO0FBQ1AsVUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDN0I7O0FBRUQsVUFBSSxDQUFDLGFBQWEsR0FBRyxtQ0FBeUIsQ0FBQTtBQUM5QyxVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDeEIsVUFBSSxDQUFDLE9BQU8sR0FBRyx1QkFBYSxDQUFBO0FBQzVCLFVBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQzlDLFVBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQzVDLFVBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQzdDLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxFQUFFLENBQUE7QUFDaEMsVUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7QUFDeEMsVUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUNoRSxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUNwRSxDQUFBO0tBQ0Y7OztXQUVPLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixVQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFBO0tBQ3hDOzs7Ozs7Ozs7OztXQVNHLGFBQUMsTUFBTSxFQUFFOzs7QUFDWCxVQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUN4QixZQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtBQUN4QixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQTs7QUFFM0MsYUFBTyx5QkFBZTtlQUFNLE1BQUssTUFBTSxDQUFDLE1BQU0sQ0FBQztPQUFBLENBQUMsQ0FBQTtLQUNqRDs7O1dBRUssZUFBQyxNQUFNLEVBQUU7QUFDYixZQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7O0FBRXJELFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQTtBQUNoQixVQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDakIsWUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUN4QyxZQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0FBQ3pFLGNBQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFBO0FBQzFFLGFBQUssR0FBRyxpQ0FBb0IsRUFBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtPQUNsRTs7QUFFRCxZQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTs7QUFFM0QsYUFBTyw0QkFBZSxNQUFNLENBQUMsQ0FBQTtLQUM5Qjs7Ozs7Ozs7O1dBT00sZ0JBQUMsTUFBTSxFQUFFO0FBQ2QsVUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sVUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3pDLFlBQU0sQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFBO0FBQ3pCLGFBQU8sT0FBTyxDQUFBO0tBQ2Y7Ozs7Ozs7Ozs7V0FRTyxpQkFBQyxRQUFRLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDOUIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNuRDs7Ozs7Ozs7OztXQVFjLHdCQUFDLE1BQU0sRUFBRTs7O0FBQ3RCLFVBQUksSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoRCxlQUFPLHlCQUFlLElBQUksQ0FBQyxDQUFBO09BQzVCO0FBQ0QsVUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTs7QUFFNUMsWUFBTSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBOztBQUU3RCxVQUFJLENBQUMsaUNBQWlDLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDOUMsVUFBTSx5QkFBeUIsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsWUFBTTtBQUNoRSxlQUFLLGlDQUFpQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO09BQy9DLENBQUMsQ0FBQTtBQUNGLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUE7O0FBRWpELFVBQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWMsR0FBUztBQUMzQixZQUFNLGFBQWEsR0FBRyxFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsRUFBQyxDQUFBO0FBQzlELGNBQU0sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLENBQ3hDLE1BQU0sRUFDTixPQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLEVBQ2hELE9BQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FDbEQsQ0FBQyxDQUFBO09BQ0gsQ0FBQTs7QUFFRCxvQkFBYyxFQUFFLENBQUE7QUFDaEIsVUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQ2pFLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUE7O0FBRTVDLGFBQU8seUJBQWUsWUFBTTtBQUMxQixlQUFLLDJCQUEyQixVQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDL0MsY0FBTSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3RDLDRCQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQzlCLGlDQUF5QixDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ25DLGVBQUssYUFBYSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0FBQ3BELGVBQUssYUFBYSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO09BQ2hELENBQUMsQ0FBQTtLQUNIOzs7Ozs7Ozs7Ozs7V0FVZSx5QkFBQyxNQUFNLEVBQUU7OztBQUN2QixVQUFJLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakQsZUFBTyx5QkFBZSxJQUFJLENBQUMsQ0FBQTtPQUM1Qjs7QUFFRCxVQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBOztBQUU3QyxVQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUE7QUFDakMsV0FBSyxJQUFJLGNBQWMsSUFBSSxJQUFJLENBQUMsNEJBQTRCLEVBQUU7QUFDNUQsWUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLEtBQUssTUFBTSxFQUFFO0FBQ3pDLGNBQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUN2RSxjQUFJLGdCQUFnQixFQUFFO0FBQ3BCLGdCQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixDQUFBO1dBQzFEO0FBQ0QsZ0JBQUs7U0FDTjtPQUNGOztBQUVELFVBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTs7QUFFbkMsVUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQU07QUFDMUQsZUFBSyxtQkFBbUIsVUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3ZDLGVBQUssc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUE7T0FDcEMsQ0FBQyxDQUFBOztBQUVGLFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUE7O0FBRTlDLGFBQU8seUJBQWUsWUFBTTtBQUMxQixlQUFPLE9BQUssc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQzdDLGVBQUssNEJBQTRCLFVBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNoRCxlQUFLLGFBQWEsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtBQUNqRCw4QkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNqQyxDQUFDLENBQUE7S0FDSDs7Ozs7Ozs7O1dBT2tCLDRCQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUU7QUFDckMsVUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUE7QUFDbEQsVUFBSSxDQUFDLG1CQUFtQixVQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDdkMsWUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7S0FDdkU7Ozs7Ozs7Ozs7O1dBU2tCLDRCQUFDLE1BQU0sRUFBRTtBQUMxQixhQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7S0FDOUM7Ozs7Ozs7V0FLb0IsOEJBQUMsTUFBTSxFQUFFO0FBQzVCLGFBQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUM3QyxVQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDcEM7Ozs7OztXQUlxQiwrQkFBQyxPQUFPLEVBQUU7OztBQUM5QixVQUFJLENBQUMsNEJBQTRCLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ3BELFlBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFO0FBQzdCLGNBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRTtBQUN6RSxrQkFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQTtXQUN6QztBQUNELGlCQUFNO1NBQ1A7O0FBRUQsWUFBTSxlQUFlLEdBQUcsT0FBSyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDOUQsWUFBSSxlQUFlLEVBQUU7QUFDbkIsY0FBSSxPQUFPLENBQUMsU0FBUyxLQUFLLGVBQWUsRUFBRTtBQUN6QyxrQkFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtXQUMzQjtTQUNGLE1BQU07QUFDTCxjQUFNLEtBQUssR0FBRyxPQUFLLGVBQWUsQ0FBQyxlQUFlLENBQ2hELE9BQU8sRUFDUCxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQ2hCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyx1QkFBdUIsQ0FBQyxDQUNyRCxDQUFBOztBQUVELGNBQUksWUFBWSxHQUFHLE9BQUssbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3ZELGNBQUksWUFBWSxJQUFJLElBQUksSUFBSSxLQUFLLEdBQUcsWUFBWSxFQUFFO0FBQ2hELGtCQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUNqQyxtQkFBSyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFBO1dBQzVDO1NBQ0Y7T0FDRixDQUFDLENBQUE7S0FDSDs7O1dBRXNCLGdDQUFDLE1BQU0sRUFBRTtBQUM5QixVQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBOztBQUU5RCxVQUFJLGVBQWUsRUFBRTtBQUNuQixZQUFNLFFBQU8sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQ3pFLGNBQU0sQ0FBQyxVQUFVLENBQUMsUUFBTyxDQUFDLENBQUE7QUFDMUIsZUFBTTtPQUNQOztvREFFd0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FDbEUsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUNoQixNQUFNLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsQ0FDckQ7O1VBSE0sT0FBTywyQ0FBUCxPQUFPO1VBQUUsS0FBSywyQ0FBTCxLQUFLOztBQUtyQixVQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1osY0FBTSxJQUFJLEtBQUssaUNBQStCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBRyxDQUFBO09BQ2xFOztBQUVELFVBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDekQsVUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRyxZQUFZLEVBQUU7QUFDaEQsY0FBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUMxQixZQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtPQUM1QztLQUNGOzs7NkJBRXVDLFdBQUMsTUFBTSxFQUFFOzs7QUFDL0MsWUFBTSxJQUFJLENBQUMsK0JBQStCLENBQUE7O0FBRTFDLFVBQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO0FBQ3ZELFVBQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQTs7QUFFbEQsWUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQTs7QUFFN0QsVUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7O0FBQ3ZELGlCQUFLLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNsRCxjQUFNLGFBQWEsR0FBRyxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUMsQ0FBQTs7OztnQkFFbEMsVUFBVTtnQkFBRSxTQUFTOztBQUMvQixtQkFBSyxhQUFhLENBQUMsR0FBRyxDQUNwQixPQUFLLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxVQUFDLEtBQVUsRUFBSztrQkFBZCxRQUFRLEdBQVQsS0FBVSxDQUFULFFBQVE7O0FBQzNELHFCQUFLLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxVQUFDLE1BQU0sRUFBSztBQUNuRCxvQkFBSSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUU7QUFDNUQsd0JBQU0sQ0FBQyxNQUFNLHFCQUFHLFNBQVMsRUFBRyxRQUFRLEVBQUUsQ0FBQTtpQkFDdkM7ZUFDRixDQUFDLENBQUE7YUFDSCxDQUFDLENBQ0gsQ0FBQTs7O0FBVEgsNEJBQXNDLDRCQUE0QixFQUFFOzs7O1dBVW5FOztBQUVELGNBQU0sY0FBYyxHQUFHLFNBQWpCLGNBQWMsR0FBUztBQUMzQixnQkFBTSxPQUFPLEdBQUcsT0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFBO0FBQ2hFLGdCQUFNLFFBQVEsR0FBRyxPQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFDbEUsbUJBQUssMkJBQTJCLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ25ELGtCQUFJLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRTtBQUM1RCxzQkFBTSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7ZUFDdkU7YUFDRixDQUFDLENBQUE7V0FDSCxDQUFBOztBQUVELGlCQUFLLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLE9BQUssTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLEVBQ3hFLE9BQUssTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQzFFLENBQUE7O09BQ0Y7S0FDRjs7O1dBRXdCLGtDQUFDLGVBQWUsRUFBRTtBQUN6QyxVQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFDakIsVUFBTSxhQUFhLEdBQUcsRUFBQyxLQUFLLEVBQUUsZUFBZSxFQUFDLENBQUE7QUFDOUMseUJBQXNDLDRCQUE0QixFQUFFOzs7WUFBeEQsVUFBVTtZQUFFLFNBQVM7O0FBQy9CLGNBQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUE7T0FDL0Q7QUFDRCxhQUFPLE1BQU0sQ0FBQTtLQUNkOzs7U0F4VWtCLGtCQUFrQjs7O3FCQUFsQixrQkFBa0I7O0FBMlV2QyxTQUFTLHVCQUF1QixDQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFO0FBQzNELFVBQVEsT0FBTztBQUNiLFNBQUssTUFBTTtBQUNULGFBQU8sS0FBSyxDQUFBO0FBQUEsQUFDZCxTQUFLLE1BQU07QUFDVCxhQUFPLElBQUksQ0FBQTtBQUFBLEFBQ2IsU0FBSyxNQUFNO0FBQ1QsY0FBUSxNQUFNLENBQUMsWUFBWSxFQUFFO0FBQzNCLGFBQUssSUFBSTtBQUNQLGlCQUFPLElBQUksQ0FBQTtBQUFBLEFBQ2IsYUFBSyxLQUFLO0FBQ1IsaUJBQU8sS0FBSyxDQUFBO0FBQUEsQUFDZDtBQUNFLGlCQUFPLFFBQVEsQ0FBQTtBQUFBLE9BQ2xCO0FBQUEsR0FDSjtDQUNGOztBQUVELFNBQVMsSUFBSSxHQUFJLEVBQUU7O0lBRWIsc0JBQXNCO0FBQ2QsV0FEUixzQkFBc0IsQ0FDYixNQUFNLEVBQUU7MEJBRGpCLHNCQUFzQjs7QUFFeEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7R0FDckI7O2VBSEcsc0JBQXNCOztXQUtMLDhCQUFDLEtBQUssRUFBRTtBQUMzQixhQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUE7S0FDbkU7OztXQUV3QixrQ0FBQyxLQUFLLEVBQUU7QUFDL0IsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFBO0tBQ3ZFOzs7V0FFd0Isa0NBQUMsS0FBSyxFQUFFO0FBQy9CLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQTtLQUN2RTs7O1dBRTRCLHNDQUFDLEtBQUssRUFBRTtBQUNuQyxhQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUE7S0FDM0U7OztXQUVpQiwyQkFBQyxLQUFLLEVBQUU7QUFDeEIsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFBO0tBQ2hFOzs7V0FFaUIsMkJBQUMsS0FBSyxFQUFFO0FBQ3hCLFVBQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFDLENBQUMsQ0FBQTtBQUM5RSxVQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBQyxDQUFDLENBQUE7QUFDMUUsVUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNoRCxVQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLLEVBQUs7QUFDeEQsZUFBTyxLQUFLLENBQUMsYUFBYSxLQUFLLGlCQUFpQixDQUFDLGFBQWEsQ0FBQTtPQUMvRCxDQUFDLENBQUE7QUFDRixhQUFPO0FBQ0wsMEJBQWtCLEVBQUUsaUJBQWlCLElBQUksaUJBQWlCLENBQUMsS0FBSztBQUNoRSx3QkFBZ0IsRUFBRSxlQUFlLElBQUksZUFBZSxDQUFDLEtBQUs7T0FDM0QsQ0FBQTtLQUNGOzs7U0FwQ0csc0JBQXNCIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvdGV4dC1lZGl0b3ItcmVnaXN0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7RW1pdHRlciwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnZXZlbnQta2l0J1xuaW1wb3J0IHtQb2ludCwgUmFuZ2V9IGZyb20gJ2F0b20nXG5pbXBvcnQgVGV4dEVkaXRvciBmcm9tICcuL3RleHQtZWRpdG9yJ1xuaW1wb3J0IFNjb3BlRGVzY3JpcHRvciBmcm9tICcuL3Njb3BlLWRlc2NyaXB0b3InXG5cbmNvbnN0IEVESVRPUl9QQVJBTVNfQllfU0VUVElOR19LRVkgPSBbXG4gIFsnY29yZS5maWxlRW5jb2RpbmcnLCAnZW5jb2RpbmcnXSxcbiAgWydlZGl0b3IuYXRvbWljU29mdFRhYnMnLCAnYXRvbWljU29mdFRhYnMnXSxcbiAgWydlZGl0b3Iuc2hvd0ludmlzaWJsZXMnLCAnc2hvd0ludmlzaWJsZXMnXSxcbiAgWydlZGl0b3IudGFiTGVuZ3RoJywgJ3RhYkxlbmd0aCddLFxuICBbJ2VkaXRvci5pbnZpc2libGVzJywgJ2ludmlzaWJsZXMnXSxcbiAgWydlZGl0b3Iuc2hvd0luZGVudEd1aWRlJywgJ3Nob3dJbmRlbnRHdWlkZSddLFxuICBbJ2VkaXRvci5zaG93TGluZU51bWJlcnMnLCAnc2hvd0xpbmVOdW1iZXJzJ10sXG4gIFsnZWRpdG9yLnNvZnRXcmFwJywgJ3NvZnRXcmFwcGVkJ10sXG4gIFsnZWRpdG9yLnNvZnRXcmFwSGFuZ2luZ0luZGVudCcsICdzb2Z0V3JhcEhhbmdpbmdJbmRlbnRMZW5ndGgnXSxcbiAgWydlZGl0b3Iuc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGgnLCAnc29mdFdyYXBBdFByZWZlcnJlZExpbmVMZW5ndGgnXSxcbiAgWydlZGl0b3IucHJlZmVycmVkTGluZUxlbmd0aCcsICdwcmVmZXJyZWRMaW5lTGVuZ3RoJ10sXG4gIFsnZWRpdG9yLmF1dG9JbmRlbnQnLCAnYXV0b0luZGVudCddLFxuICBbJ2VkaXRvci5hdXRvSW5kZW50T25QYXN0ZScsICdhdXRvSW5kZW50T25QYXN0ZSddLFxuICBbJ2VkaXRvci5zY3JvbGxQYXN0RW5kJywgJ3Njcm9sbFBhc3RFbmQnXSxcbiAgWydlZGl0b3IudW5kb0dyb3VwaW5nSW50ZXJ2YWwnLCAndW5kb0dyb3VwaW5nSW50ZXJ2YWwnXSxcbiAgWydlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnLCAnbm9uV29yZENoYXJhY3RlcnMnXSxcbiAgWydlZGl0b3Iuc2Nyb2xsU2Vuc2l0aXZpdHknLCAnc2Nyb2xsU2Vuc2l0aXZpdHknXVxuXVxuXG5jb25zdCBHUkFNTUFSX1NFTEVDVElPTl9SQU5HRSA9IFJhbmdlKFBvaW50LlpFUk8sIFBvaW50KDEwLCAwKSkuZnJlZXplKClcblxuLy8gRXhwZXJpbWVudGFsOiBUaGlzIGdsb2JhbCByZWdpc3RyeSB0cmFja3MgcmVnaXN0ZXJlZCBgVGV4dEVkaXRvcnNgLlxuLy9cbi8vIElmIHlvdSB3YW50IHRvIGFkZCBmdW5jdGlvbmFsaXR5IHRvIGEgd2lkZXIgc2V0IG9mIHRleHQgZWRpdG9ycyB0aGFuIGp1c3Rcbi8vIHRob3NlIGFwcGVhcmluZyB3aXRoaW4gd29ya3NwYWNlIHBhbmVzLCB1c2UgYGF0b20udGV4dEVkaXRvcnMub2JzZXJ2ZWAgdG9cbi8vIGludm9rZSBhIGNhbGxiYWNrIGZvciBhbGwgY3VycmVudCBhbmQgZnV0dXJlIHJlZ2lzdGVyZWQgdGV4dCBlZGl0b3JzLlxuLy9cbi8vIElmIHlvdSB3YW50IHBhY2thZ2VzIHRvIGJlIGFibGUgdG8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8geW91ciBub24tcGFuZSB0ZXh0XG4vLyBlZGl0b3JzIChzdWNoIGFzIGEgc2VhcmNoIGZpZWxkIGluIGEgY3VzdG9tIHVzZXIgaW50ZXJmYWNlIGVsZW1lbnQpLCByZWdpc3RlclxuLy8gdGhlbSBmb3Igb2JzZXJ2YXRpb24gdmlhIGBhdG9tLnRleHRFZGl0b3JzLmFkZGAuICoqSW1wb3J0YW50OioqIFdoZW4geW91J3JlXG4vLyBkb25lIHVzaW5nIHlvdXIgZWRpdG9yLCBiZSBzdXJlIHRvIGNhbGwgYGRpc3Bvc2VgIG9uIHRoZSByZXR1cm5lZCBkaXNwb3NhYmxlXG4vLyB0byBhdm9pZCBsZWFraW5nIGVkaXRvcnMuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0RWRpdG9yUmVnaXN0cnkge1xuICBjb25zdHJ1Y3RvciAoe2NvbmZpZywgZ3JhbW1hclJlZ2lzdHJ5LCBhc3NlcnQsIHBhY2thZ2VNYW5hZ2VyfSkge1xuICAgIHRoaXMuYXNzZXJ0ID0gYXNzZXJ0XG4gICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICB0aGlzLmdyYW1tYXJSZWdpc3RyeSA9IGdyYW1tYXJSZWdpc3RyeVxuICAgIHRoaXMuc2NvcGVkU2V0dGluZ3NEZWxlZ2F0ZSA9IG5ldyBTY29wZWRTZXR0aW5nc0RlbGVnYXRlKGNvbmZpZylcbiAgICB0aGlzLmdyYW1tYXJBZGRlZE9yVXBkYXRlZCA9IHRoaXMuZ3JhbW1hckFkZGVkT3JVcGRhdGVkLmJpbmQodGhpcylcbiAgICB0aGlzLmNsZWFyKClcblxuICAgIHRoaXMuaW5pdGlhbFBhY2thZ2VBY3RpdmF0aW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyB1c2FnZSBvZiBhIHByaXZhdGUgcHJvcGVydHkgb2YgUGFja2FnZU1hbmFnZXIuXG4gICAgICAvLyBTaG91bGQgUGFja2FnZU1hbmFnZXIganVzdCBleHBvc2UgYSBwcm9taXNlLWJhc2VkIEFQSSBsaWtlIHRoaXM/XG4gICAgICBpZiAocGFja2FnZU1hbmFnZXIuZGVmZXJyZWRBY3RpdmF0aW9uSG9va3MpIHtcbiAgICAgICAgcGFja2FnZU1hbmFnZXIub25EaWRBY3RpdmF0ZUluaXRpYWxQYWNrYWdlcyhyZXNvbHZlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGRlc2VyaWFsaXplIChzdGF0ZSkge1xuICAgIHRoaXMuZWRpdG9yR3JhbW1hck92ZXJyaWRlcyA9IHN0YXRlLmVkaXRvckdyYW1tYXJPdmVycmlkZXNcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVkaXRvckdyYW1tYXJPdmVycmlkZXM6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZWRpdG9yR3JhbW1hck92ZXJyaWRlcylcbiAgICB9XG4gIH1cblxuICBjbGVhciAoKSB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmVkaXRvcnMgPSBuZXcgU2V0KClcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5zY29wZXNXaXRoQ29uZmlnU3Vic2NyaXB0aW9ucyA9IG5ldyBTZXQoKVxuICAgIHRoaXMuZWRpdG9yc1dpdGhNYWludGFpbmVkQ29uZmlnID0gbmV3IFNldCgpXG4gICAgdGhpcy5lZGl0b3JzV2l0aE1haW50YWluZWRHcmFtbWFyID0gbmV3IFNldCgpXG4gICAgdGhpcy5lZGl0b3JHcmFtbWFyT3ZlcnJpZGVzID0ge31cbiAgICB0aGlzLmVkaXRvckdyYW1tYXJTY29yZXMgPSBuZXcgV2Vha01hcCgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMuZ3JhbW1hclJlZ2lzdHJ5Lm9uRGlkQWRkR3JhbW1hcih0aGlzLmdyYW1tYXJBZGRlZE9yVXBkYXRlZCksXG4gICAgICB0aGlzLmdyYW1tYXJSZWdpc3RyeS5vbkRpZFVwZGF0ZUdyYW1tYXIodGhpcy5ncmFtbWFyQWRkZWRPclVwZGF0ZWQpXG4gICAgKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIHRoaXMuZWRpdG9yc1dpdGhNYWludGFpbmVkQ29uZmlnID0gbnVsbFxuICB9XG5cbiAgLy8gUmVnaXN0ZXIgYSBgVGV4dEVkaXRvcmAuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIGVkaXRvciB0byByZWdpc3Rlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byByZW1vdmUgdGhlXG4gIC8vIGFkZGVkIGVkaXRvci4gVG8gYXZvaWQgYW55IG1lbW9yeSBsZWFrcyB0aGlzIHNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGVcbiAgLy8gZWRpdG9yIGlzIGRlc3Ryb3llZC5cbiAgYWRkIChlZGl0b3IpIHtcbiAgICB0aGlzLmVkaXRvcnMuYWRkKGVkaXRvcilcbiAgICBlZGl0b3IucmVnaXN0ZXJlZCA9IHRydWVcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWFkZC1lZGl0b3InLCBlZGl0b3IpXG5cbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4gdGhpcy5yZW1vdmUoZWRpdG9yKSlcbiAgfVxuXG4gIGJ1aWxkIChwYXJhbXMpIHtcbiAgICBwYXJhbXMgPSBPYmplY3QuYXNzaWduKHthc3NlcnQ6IHRoaXMuYXNzZXJ0fSwgcGFyYW1zKVxuXG4gICAgbGV0IHNjb3BlID0gbnVsbFxuICAgIGlmIChwYXJhbXMuYnVmZmVyKSB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IHBhcmFtcy5idWZmZXIuZ2V0UGF0aCgpXG4gICAgICBjb25zdCBoZWFkQ29udGVudCA9IHBhcmFtcy5idWZmZXIuZ2V0VGV4dEluUmFuZ2UoR1JBTU1BUl9TRUxFQ1RJT05fUkFOR0UpXG4gICAgICBwYXJhbXMuZ3JhbW1hciA9IHRoaXMuZ3JhbW1hclJlZ2lzdHJ5LnNlbGVjdEdyYW1tYXIoZmlsZVBhdGgsIGhlYWRDb250ZW50KVxuICAgICAgc2NvcGUgPSBuZXcgU2NvcGVEZXNjcmlwdG9yKHtzY29wZXM6IFtwYXJhbXMuZ3JhbW1hci5zY29wZU5hbWVdfSlcbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKHBhcmFtcywgdGhpcy50ZXh0RWRpdG9yUGFyYW1zRm9yU2NvcGUoc2NvcGUpKVxuXG4gICAgcmV0dXJuIG5ldyBUZXh0RWRpdG9yKHBhcmFtcylcbiAgfVxuXG4gIC8vIFJlbW92ZSBhIGBUZXh0RWRpdG9yYC5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgZWRpdG9yIHRvIHJlbW92ZS5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIGVkaXRvciB3YXMgc3VjY2Vzc2Z1bGx5IHJlbW92ZWQuXG4gIHJlbW92ZSAoZWRpdG9yKSB7XG4gICAgdmFyIHJlbW92ZWQgPSB0aGlzLmVkaXRvcnMuZGVsZXRlKGVkaXRvcilcbiAgICBlZGl0b3IucmVnaXN0ZXJlZCA9IGZhbHNlXG4gICAgcmV0dXJuIHJlbW92ZWRcbiAgfVxuXG4gIC8vIEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCBhbGwgdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSByZWdpc3RlcmVkXG4gIC8vIGBUZXh0RWRpdG9yc2AuXG4gIC8vXG4gIC8vICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aXRoIGN1cnJlbnQgYW5kIGZ1dHVyZSB0ZXh0IGVkaXRvcnMuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmUgKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5lZGl0b3JzLmZvckVhY2goY2FsbGJhY2spXG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWFkZC1lZGl0b3InLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8vIEtlZXAgYSB7VGV4dEVkaXRvcn0ncyBjb25maWd1cmF0aW9uIGluIHN5bmMgd2l0aCBBdG9tJ3Mgc2V0dGluZ3MuXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgVGhlIGVkaXRvciB3aG9zZSBjb25maWd1cmF0aW9uIHdpbGwgYmUgbWFpbnRhaW5lZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtEaXNwb3NhYmxlfSB0aGF0IGNhbiBiZSB1c2VkIHRvIHN0b3AgdXBkYXRpbmcgdGhlIGVkaXRvcidzXG4gIC8vIGNvbmZpZ3VyYXRpb24uXG4gIG1haW50YWluQ29uZmlnIChlZGl0b3IpIHtcbiAgICBpZiAodGhpcy5lZGl0b3JzV2l0aE1haW50YWluZWRDb25maWcuaGFzKGVkaXRvcikpIHtcbiAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZShub29wKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZENvbmZpZy5hZGQoZWRpdG9yKVxuXG4gICAgZWRpdG9yLnNldFNjb3BlZFNldHRpbmdzRGVsZWdhdGUodGhpcy5zY29wZWRTZXR0aW5nc0RlbGVnYXRlKVxuXG4gICAgdGhpcy5zdWJzY3JpYmVUb1NldHRpbmdzRm9yRWRpdG9yU2NvcGUoZWRpdG9yKVxuICAgIGNvbnN0IGdyYW1tYXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKCgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlVG9TZXR0aW5nc0ZvckVkaXRvclNjb3BlKGVkaXRvcilcbiAgICB9KVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoZ3JhbW1hckNoYW5nZVN1YnNjcmlwdGlvbilcblxuICAgIGNvbnN0IHVwZGF0ZVRhYlR5cGVzID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29uZmlnT3B0aW9ucyA9IHtzY29wZTogZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKX1cbiAgICAgIGVkaXRvci5zZXRTb2Z0VGFicyhzaG91bGRFZGl0b3JVc2VTb2Z0VGFicyhcbiAgICAgICAgZWRpdG9yLFxuICAgICAgICB0aGlzLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJUeXBlJywgY29uZmlnT3B0aW9ucyksXG4gICAgICAgIHRoaXMuY29uZmlnLmdldCgnZWRpdG9yLnNvZnRUYWJzJywgY29uZmlnT3B0aW9ucylcbiAgICAgICkpXG4gICAgfVxuXG4gICAgdXBkYXRlVGFiVHlwZXMoKVxuICAgIGNvbnN0IHRva2VuaXplU3Vic2NyaXB0aW9uID0gZWRpdG9yLm9uRGlkVG9rZW5pemUodXBkYXRlVGFiVHlwZXMpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0b2tlbml6ZVN1YnNjcmlwdGlvbilcblxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZENvbmZpZy5kZWxldGUoZWRpdG9yKVxuICAgICAgZWRpdG9yLnNldFNjb3BlZFNldHRpbmdzRGVsZWdhdGUobnVsbClcbiAgICAgIHRva2VuaXplU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgZ3JhbW1hckNoYW5nZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5yZW1vdmUoZ3JhbW1hckNoYW5nZVN1YnNjcmlwdGlvbilcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5yZW1vdmUodG9rZW5pemVTdWJzY3JpcHRpb24pXG4gICAgfSlcbiAgfVxuXG4gIC8vIFNldCBhIHtUZXh0RWRpdG9yfSdzIGdyYW1tYXIgYmFzZWQgb24gaXRzIHBhdGggYW5kIGNvbnRlbnQsIGFuZCBjb250aW51ZVxuICAvLyB0byB1cGRhdGUgaXRzIGdyYW1tYXIgYXMgZ3JhbWFtcnMgYXJlIGFkZGVkIG9yIHVwZGF0ZWQsIG9yIHRoZSBlZGl0b3Inc1xuICAvLyBmaWxlIHBhdGggY2hhbmdlcy5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgZWRpdG9yIHdob3NlIGdyYW1tYXIgd2lsbCBiZSBtYWludGFpbmVkLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IHRoYXQgY2FuIGJlIHVzZWQgdG8gc3RvcCB1cGRhdGluZyB0aGUgZWRpdG9yJ3NcbiAgLy8gZ3JhbW1hci5cbiAgbWFpbnRhaW5HcmFtbWFyIChlZGl0b3IpIHtcbiAgICBpZiAodGhpcy5lZGl0b3JzV2l0aE1haW50YWluZWRHcmFtbWFyLmhhcyhlZGl0b3IpKSB7XG4gICAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUobm9vcClcbiAgICB9XG5cbiAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZEdyYW1tYXIuYWRkKGVkaXRvcilcblxuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIGZvciAobGV0IGV4aXN0aW5nRWRpdG9yIG9mIHRoaXMuZWRpdG9yc1dpdGhNYWludGFpbmVkR3JhbW1hcikge1xuICAgICAgaWYgKGV4aXN0aW5nRWRpdG9yLmdldEJ1ZmZlcigpID09PSBidWZmZXIpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdPdmVycmlkZSA9IHRoaXMuZWRpdG9yR3JhbW1hck92ZXJyaWRlc1tleGlzdGluZ0VkaXRvci5pZF1cbiAgICAgICAgaWYgKGV4aXN0aW5nT3ZlcnJpZGUpIHtcbiAgICAgICAgICB0aGlzLmVkaXRvckdyYW1tYXJPdmVycmlkZXNbZWRpdG9yLmlkXSA9IGV4aXN0aW5nT3ZlcnJpZGVcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2VsZWN0R3JhbW1hckZvckVkaXRvcihlZGl0b3IpXG5cbiAgICBjb25zdCBwYXRoQ2hhbmdlU3Vic2NyaXB0aW9uID0gZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCgoKSA9PiB7XG4gICAgICB0aGlzLmVkaXRvckdyYW1tYXJTY29yZXMuZGVsZXRlKGVkaXRvcilcbiAgICAgIHRoaXMuc2VsZWN0R3JhbW1hckZvckVkaXRvcihlZGl0b3IpXG4gICAgfSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQocGF0aENoYW5nZVN1YnNjcmlwdGlvbilcblxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBkZWxldGUgdGhpcy5lZGl0b3JHcmFtbWFyT3ZlcnJpZGVzW2VkaXRvci5pZF1cbiAgICAgIHRoaXMuZWRpdG9yc1dpdGhNYWludGFpbmVkR3JhbW1hci5kZWxldGUoZWRpdG9yKVxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnJlbW92ZShwYXRoQ2hhbmdlU3Vic2NyaXB0aW9uKVxuICAgICAgcGF0aENoYW5nZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICB9KVxuICB9XG5cbiAgLy8gRm9yY2UgYSB7VGV4dEVkaXRvcn0gdG8gdXNlIGEgZGlmZmVyZW50IGdyYW1tYXIgdGhhbiB0aGUgb25lIHRoYXQgd291bGRcbiAgLy8gb3RoZXJ3aXNlIGJlIHNlbGVjdGVkIGZvciBpdC5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgZWRpdG9yIHdob3NlIGdyYW1hbXIgd2lsbCBiZSBzZXQuXG4gIC8vICogYHNjb3BlTmFtZWAgVGhlIHtTdHJpbmd9IHJvb3Qgc2NvcGUgbmFtZSBmb3IgdGhlIGRlc2lyZWQge0dyYW1tYXJ9LlxuICBzZXRHcmFtbWFyT3ZlcnJpZGUgKGVkaXRvciwgc2NvcGVOYW1lKSB7XG4gICAgdGhpcy5lZGl0b3JHcmFtbWFyT3ZlcnJpZGVzW2VkaXRvci5pZF0gPSBzY29wZU5hbWVcbiAgICB0aGlzLmVkaXRvckdyYW1tYXJTY29yZXMuZGVsZXRlKGVkaXRvcilcbiAgICBlZGl0b3Iuc2V0R3JhbW1hcih0aGlzLmdyYW1tYXJSZWdpc3RyeS5ncmFtbWFyRm9yU2NvcGVOYW1lKHNjb3BlTmFtZSkpXG4gIH1cblxuICAvLyBSZXRyaWV2ZSB0aGUgZ3JhbW1hciBzY29wZSBuYW1lIHRoYXQgaGFzIGJlZW4gc2V0IGFzIGEgZ3JhbW1hciBvdmVycmlkZVxuICAvLyBmb3IgdGhlIGdpdmVuIHtUZXh0RWRpdG9yfS5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgZWRpdG9yLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1N0cmluZ30gc2NvcGUgbmFtZSwgb3IgYG51bGxgIGlmIG5vIG92ZXJyaWRlIGhhcyBiZWVuIHNldFxuICAvLyBmb3IgdGhlIGdpdmVuIGVkaXRvci5cbiAgZ2V0R3JhbW1hck92ZXJyaWRlIChlZGl0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0b3JHcmFtbWFyT3ZlcnJpZGVzW2VkaXRvci5pZF1cbiAgfVxuXG4gIC8vIFJlbW92ZSBhbnkgZ3JhbW1hciBvdmVycmlkZSB0aGF0IGhhcyBiZWVuIHNldCBmb3IgdGhlIGdpdmVuIHtUZXh0RWRpdG9yfS5cbiAgLy9cbiAgLy8gKiBgZWRpdG9yYCBUaGUgZWRpdG9yLlxuICBjbGVhckdyYW1tYXJPdmVycmlkZSAoZWRpdG9yKSB7XG4gICAgZGVsZXRlIHRoaXMuZWRpdG9yR3JhbW1hck92ZXJyaWRlc1tlZGl0b3IuaWRdXG4gICAgdGhpcy5zZWxlY3RHcmFtbWFyRm9yRWRpdG9yKGVkaXRvcilcbiAgfVxuXG4gIC8vIFByaXZhdGVcblxuICBncmFtbWFyQWRkZWRPclVwZGF0ZWQgKGdyYW1tYXIpIHtcbiAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZEdyYW1tYXIuZm9yRWFjaCgoZWRpdG9yKSA9PiB7XG4gICAgICBpZiAoZ3JhbW1hci5pbmplY3Rpb25TZWxlY3Rvcikge1xuICAgICAgICBpZiAoZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5oYXNUb2tlbkZvclNlbGVjdG9yKGdyYW1tYXIuaW5qZWN0aW9uU2VsZWN0b3IpKSB7XG4gICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBncmFtbWFyT3ZlcnJpZGUgPSB0aGlzLmVkaXRvckdyYW1tYXJPdmVycmlkZXNbZWRpdG9yLmlkXVxuICAgICAgaWYgKGdyYW1tYXJPdmVycmlkZSkge1xuICAgICAgICBpZiAoZ3JhbW1hci5zY29wZU5hbWUgPT09IGdyYW1tYXJPdmVycmlkZSkge1xuICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID0gdGhpcy5ncmFtbWFyUmVnaXN0cnkuZ2V0R3JhbW1hclNjb3JlKFxuICAgICAgICAgIGdyYW1tYXIsXG4gICAgICAgICAgZWRpdG9yLmdldFBhdGgoKSxcbiAgICAgICAgICBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoR1JBTU1BUl9TRUxFQ1RJT05fUkFOR0UpXG4gICAgICAgIClcblxuICAgICAgICBsZXQgY3VycmVudFNjb3JlID0gdGhpcy5lZGl0b3JHcmFtbWFyU2NvcmVzLmdldChlZGl0b3IpXG4gICAgICAgIGlmIChjdXJyZW50U2NvcmUgPT0gbnVsbCB8fCBzY29yZSA+IGN1cnJlbnRTY29yZSkge1xuICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIsIHNjb3JlKVxuICAgICAgICAgIHRoaXMuZWRpdG9yR3JhbW1hclNjb3Jlcy5zZXQoZWRpdG9yLCBzY29yZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBzZWxlY3RHcmFtbWFyRm9yRWRpdG9yIChlZGl0b3IpIHtcbiAgICBjb25zdCBncmFtbWFyT3ZlcnJpZGUgPSB0aGlzLmVkaXRvckdyYW1tYXJPdmVycmlkZXNbZWRpdG9yLmlkXVxuXG4gICAgaWYgKGdyYW1tYXJPdmVycmlkZSkge1xuICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuZ3JhbW1hclJlZ2lzdHJ5LmdyYW1tYXJGb3JTY29wZU5hbWUoZ3JhbW1hck92ZXJyaWRlKVxuICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZ3JhbW1hcilcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHtncmFtbWFyLCBzY29yZX0gPSB0aGlzLmdyYW1tYXJSZWdpc3RyeS5zZWxlY3RHcmFtbWFyV2l0aFNjb3JlKFxuICAgICAgZWRpdG9yLmdldFBhdGgoKSxcbiAgICAgIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShHUkFNTUFSX1NFTEVDVElPTl9SQU5HRSlcbiAgICApXG5cbiAgICBpZiAoIWdyYW1tYXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gZ3JhbW1hciBmb3VuZCBmb3IgcGF0aDogJHtlZGl0b3IuZ2V0UGF0aCgpfWApXG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNjb3JlID0gdGhpcy5lZGl0b3JHcmFtbWFyU2NvcmVzLmdldChlZGl0b3IpXG4gICAgaWYgKGN1cnJlbnRTY29yZSA9PSBudWxsIHx8IHNjb3JlID4gY3VycmVudFNjb3JlKSB7XG4gICAgICBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuICAgICAgdGhpcy5lZGl0b3JHcmFtbWFyU2NvcmVzLnNldChlZGl0b3IsIHNjb3JlKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHN1YnNjcmliZVRvU2V0dGluZ3NGb3JFZGl0b3JTY29wZSAoZWRpdG9yKSB7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsUGFja2FnZUFjdGl2YXRpb25Qcm9taXNlXG5cbiAgICBjb25zdCBzY29wZURlc2NyaXB0b3IgPSBlZGl0b3IuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpXG4gICAgY29uc3Qgc2NvcGVDaGFpbiA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKClcblxuICAgIGVkaXRvci51cGRhdGUodGhpcy50ZXh0RWRpdG9yUGFyYW1zRm9yU2NvcGUoc2NvcGVEZXNjcmlwdG9yKSlcblxuICAgIGlmICghdGhpcy5zY29wZXNXaXRoQ29uZmlnU3Vic2NyaXB0aW9ucy5oYXMoc2NvcGVDaGFpbikpIHtcbiAgICAgIHRoaXMuc2NvcGVzV2l0aENvbmZpZ1N1YnNjcmlwdGlvbnMuYWRkKHNjb3BlQ2hhaW4pXG4gICAgICBjb25zdCBjb25maWdPcHRpb25zID0ge3Njb3BlOiBzY29wZURlc2NyaXB0b3J9XG5cbiAgICAgIGZvciAoY29uc3QgW3NldHRpbmdLZXksIHBhcmFtTmFtZV0gb2YgRURJVE9SX1BBUkFNU19CWV9TRVRUSU5HX0tFWSkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICAgIHRoaXMuY29uZmlnLm9uRGlkQ2hhbmdlKHNldHRpbmdLZXksIGNvbmZpZ09wdGlvbnMsICh7bmV3VmFsdWV9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZENvbmZpZy5mb3JFYWNoKChlZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRSb290U2NvcGVEZXNjcmlwdG9yKCkuaXNFcXVhbChzY29wZURlc2NyaXB0b3IpKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnVwZGF0ZSh7W3BhcmFtTmFtZV06IG5ld1ZhbHVlfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwZGF0ZVRhYlR5cGVzID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB0YWJUeXBlID0gdGhpcy5jb25maWcuZ2V0KCdlZGl0b3IudGFiVHlwZScsIGNvbmZpZ09wdGlvbnMpXG4gICAgICAgIGNvbnN0IHNvZnRUYWJzID0gdGhpcy5jb25maWcuZ2V0KCdlZGl0b3Iuc29mdFRhYnMnLCBjb25maWdPcHRpb25zKVxuICAgICAgICB0aGlzLmVkaXRvcnNXaXRoTWFpbnRhaW5lZENvbmZpZy5mb3JFYWNoKChlZGl0b3IpID0+IHtcbiAgICAgICAgICBpZiAoZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKS5pc0VxdWFsKHNjb3BlRGVzY3JpcHRvcikpIHtcbiAgICAgICAgICAgIGVkaXRvci5zZXRTb2Z0VGFicyhzaG91bGRFZGl0b3JVc2VTb2Z0VGFicyhlZGl0b3IsIHRhYlR5cGUsIHNvZnRUYWJzKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIHRoaXMuY29uZmlnLm9uRGlkQ2hhbmdlKCdlZGl0b3IudGFiVHlwZScsIGNvbmZpZ09wdGlvbnMsIHVwZGF0ZVRhYlR5cGVzKSxcbiAgICAgICAgdGhpcy5jb25maWcub25EaWRDaGFuZ2UoJ2VkaXRvci5zb2Z0VGFicycsIGNvbmZpZ09wdGlvbnMsIHVwZGF0ZVRhYlR5cGVzKVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIHRleHRFZGl0b3JQYXJhbXNGb3JTY29wZSAoc2NvcGVEZXNjcmlwdG9yKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICBjb25zdCBjb25maWdPcHRpb25zID0ge3Njb3BlOiBzY29wZURlc2NyaXB0b3J9XG4gICAgZm9yIChjb25zdCBbc2V0dGluZ0tleSwgcGFyYW1OYW1lXSBvZiBFRElUT1JfUEFSQU1TX0JZX1NFVFRJTkdfS0VZKSB7XG4gICAgICByZXN1bHRbcGFyYW1OYW1lXSA9IHRoaXMuY29uZmlnLmdldChzZXR0aW5nS2V5LCBjb25maWdPcHRpb25zKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvdWxkRWRpdG9yVXNlU29mdFRhYnMgKGVkaXRvciwgdGFiVHlwZSwgc29mdFRhYnMpIHtcbiAgc3dpdGNoICh0YWJUeXBlKSB7XG4gICAgY2FzZSAnaGFyZCc6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICBjYXNlICdzb2Z0JzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgY2FzZSAnYXV0byc6XG4gICAgICBzd2l0Y2ggKGVkaXRvci51c2VzU29mdFRhYnMoKSkge1xuICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgY2FzZSBmYWxzZTpcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gc29mdFRhYnNcbiAgICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBub29wICgpIHt9XG5cbmNsYXNzIFNjb3BlZFNldHRpbmdzRGVsZWdhdGUge1xuICBjb25zdHJ1Y3RvciAoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgfVxuXG4gIGdldE5vbldvcmRDaGFyYWN0ZXJzIChzY29wZSkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycsIHtzY29wZTogc2NvcGV9KVxuICB9XG5cbiAgZ2V0SW5jcmVhc2VJbmRlbnRQYXR0ZXJuIChzY29wZSkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXQoJ2VkaXRvci5pbmNyZWFzZUluZGVudFBhdHRlcm4nLCB7c2NvcGU6IHNjb3BlfSlcbiAgfVxuXG4gIGdldERlY3JlYXNlSW5kZW50UGF0dGVybiAoc2NvcGUpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0KCdlZGl0b3IuZGVjcmVhc2VJbmRlbnRQYXR0ZXJuJywge3Njb3BlOiBzY29wZX0pXG4gIH1cblxuICBnZXREZWNyZWFzZU5leHRJbmRlbnRQYXR0ZXJuIChzY29wZSkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXQoJ2VkaXRvci5kZWNyZWFzZU5leHRJbmRlbnRQYXR0ZXJuJywge3Njb3BlOiBzY29wZX0pXG4gIH1cblxuICBnZXRGb2xkRW5kUGF0dGVybiAoc2NvcGUpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0KCdlZGl0b3IuZm9sZEVuZFBhdHRlcm4nLCB7c2NvcGU6IHNjb3BlfSlcbiAgfVxuXG4gIGdldENvbW1lbnRTdHJpbmdzIChzY29wZSkge1xuICAgIGNvbnN0IGNvbW1lbnRTdGFydEVudHJpZXMgPSB0aGlzLmNvbmZpZy5nZXRBbGwoJ2VkaXRvci5jb21tZW50U3RhcnQnLCB7c2NvcGV9KVxuICAgIGNvbnN0IGNvbW1lbnRFbmRFbnRyaWVzID0gdGhpcy5jb25maWcuZ2V0QWxsKCdlZGl0b3IuY29tbWVudEVuZCcsIHtzY29wZX0pXG4gICAgY29uc3QgY29tbWVudFN0YXJ0RW50cnkgPSBjb21tZW50U3RhcnRFbnRyaWVzWzBdXG4gICAgY29uc3QgY29tbWVudEVuZEVudHJ5ID0gY29tbWVudEVuZEVudHJpZXMuZmluZCgoZW50cnkpID0+IHtcbiAgICAgIHJldHVybiBlbnRyeS5zY29wZVNlbGVjdG9yID09PSBjb21tZW50U3RhcnRFbnRyeS5zY29wZVNlbGVjdG9yXG4gICAgfSlcbiAgICByZXR1cm4ge1xuICAgICAgY29tbWVudFN0YXJ0U3RyaW5nOiBjb21tZW50U3RhcnRFbnRyeSAmJiBjb21tZW50U3RhcnRFbnRyeS52YWx1ZSxcbiAgICAgIGNvbW1lbnRFbmRTdHJpbmc6IGNvbW1lbnRFbmRFbnRyeSAmJiBjb21tZW50RW5kRW50cnkudmFsdWVcbiAgICB9XG4gIH1cbn1cbiJdfQ==