Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atom = require('atom');

var _snippetParser = require('./snippet-parser');

var _snippetParser2 = _interopRequireDefault(_snippetParser);

var _typeHelpers = require('./type-helpers');

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

'use babel';

var ItemTemplate = '<span class="icon-container"></span>\n  <span class="left-label"></span>\n  <span class="word-container">\n    <span class="word"></span>\n  </span>\n  <span class="right-label"></span>';

var ListTemplate = '<div class="suggestion-list-scroller">\n    <ol class="list-group"></ol>\n  </div>\n  <div class="suggestion-description">\n    <span class="suggestion-description-content"></span>\n    <a class="suggestion-description-more-link" href="#">More..</a>\n  </div>';

var IconTemplate = '<i class="icon"></i>';

var DefaultSuggestionTypeIconHTML = {
  'snippet': '<i class="icon-move-right"></i>',
  'import': '<i class="icon-package"></i>',
  'require': '<i class="icon-package"></i>',
  'module': '<i class="icon-package"></i>',
  'package': '<i class="icon-package"></i>',
  'tag': '<i class="icon-code"></i>',
  'attribute': '<i class="icon-tag"></i>'
};

var SnippetStart = 1;
var SnippetEnd = 2;
var SnippetStartAndEnd = 3;

var SuggestionListElement = (function (_HTMLElement) {
  _inherits(SuggestionListElement, _HTMLElement);

  function SuggestionListElement() {
    _classCallCheck(this, SuggestionListElement);

    _get(Object.getPrototypeOf(SuggestionListElement.prototype), 'constructor', this).apply(this, arguments);
  }

  // https://github.com/component/escape-html/blob/master/index.js

  _createClass(SuggestionListElement, [{
    key: 'createdCallback',
    value: function createdCallback() {
      this.maxItems = 200;
      this.emptySnippetGroupRegex = /(\$\{\d+:\})|(\$\{\d+\})|(\$\d+)/ig;
      this.slashesInSnippetRegex = /\\\\/g;
      this.nodePool = null;
      this.subscriptions = new _atom.CompositeDisposable();
      this.classList.add('popover-list', 'select-list', 'autocomplete-suggestion-list');
      this.registerMouseHandling();
      this.snippetParser = new _snippetParser2['default']();
      this.nodePool = [];
    }
  }, {
    key: 'attachedCallback',
    value: function attachedCallback() {
      // TODO: Fix overlay decorator to in atom to apply class attribute correctly, then move this to overlay creation point.
      this.parentElement.classList.add('autocomplete-plus');
      this.addActiveClassToEditor();
      if (!this.ol) {
        this.renderList();
      }
      return this.itemsChanged();
    }
  }, {
    key: 'detachedCallback',
    value: function detachedCallback() {
      if (this.activeClassDisposable && this.activeClassDisposable.dispose) {
        this.activeClassDisposable.dispose();
      }
    }
  }, {
    key: 'initialize',
    value: function initialize(model) {
      var _this = this;

      this.model = model;
      if (this.model == null) {
        return;
      }
      this.subscriptions.add(this.model.onDidChangeItems(this.itemsChanged.bind(this)));
      this.subscriptions.add(this.model.onDidSelectNext(this.moveSelectionDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPrevious(this.moveSelectionUp.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPageUp(this.moveSelectionPageUp.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPageDown(this.moveSelectionPageDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectTop(this.moveSelectionToTop.bind(this)));
      this.subscriptions.add(this.model.onDidSelectBottom(this.moveSelectionToBottom.bind(this)));
      this.subscriptions.add(this.model.onDidConfirmSelection(this.confirmSelection.bind(this)));
      this.subscriptions.add(this.model.onDidconfirmSelectionIfNonDefault(this.confirmSelectionIfNonDefault.bind(this)));
      this.subscriptions.add(this.model.onDidDispose(this.dispose.bind(this)));

      this.subscriptions.add(atom.config.observe('autocomplete-plus.suggestionListFollows', function (suggestionListFollows) {
        _this.suggestionListFollows = suggestionListFollows;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.maxVisibleSuggestions', function (maxVisibleSuggestions) {
        _this.maxVisibleSuggestions = maxVisibleSuggestions;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', function (useAlternateScoring) {
        _this.useAlternateScoring = useAlternateScoring;
      }));
      return this;
    }

    // This should be unnecessary but the events we need to override
    // are handled at a level that can't be blocked by react synthetic
    // events because they are handled at the document
  }, {
    key: 'registerMouseHandling',
    value: function registerMouseHandling() {
      var _this2 = this;

      this.onmousewheel = function (event) {
        return event.stopPropagation();
      };
      this.onmousedown = function (event) {
        var item = _this2.findItem(event);
        if (item && item.dataset && item.dataset.index) {
          _this2.selectedIndex = item.dataset.index;
          event.stopPropagation();
        }
      };

      this.onmouseup = function (event) {
        var item = _this2.findItem(event);
        if (item && item.dataset && item.dataset.index) {
          event.stopPropagation();
          _this2.confirmSelection();
        }
      };
    }
  }, {
    key: 'findItem',
    value: function findItem(event) {
      var item = event.target;
      while (item.tagName !== 'LI' && item !== this) {
        item = item.parentNode;
      }
      if (item.tagName === 'LI') {
        return item;
      }
    }
  }, {
    key: 'updateDescription',
    value: function updateDescription(item) {
      if (!item) {
        if (this.model && this.model.items) {
          item = this.model.items[this.selectedIndex];
        }
      }
      if (!item) {
        return;
      }

      if (item.description && item.description.length > 0) {
        this.descriptionContainer.style.display = 'block';
        this.descriptionContent.textContent = item.description;
        if (item.descriptionMoreURL != null && item.descriptionMoreURL.length != null) {
          this.descriptionMoreLink.style.display = 'inline';
          this.descriptionMoreLink.setAttribute('href', item.descriptionMoreURL);
        } else {
          this.descriptionMoreLink.style.display = 'none';
          this.descriptionMoreLink.setAttribute('href', '#');
        }
      } else {
        this.descriptionContainer.style.display = 'none';
      }
    }
  }, {
    key: 'itemsChanged',
    value: function itemsChanged() {
      if (this.model && this.model.items && this.model.items.length) {
        return this.render();
      } else {
        return this.returnItemsToPool(0);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      this.nonDefaultIndex = false;
      this.selectedIndex = 0;
      if (atom.views.pollAfterNextUpdate) {
        atom.views.pollAfterNextUpdate();
      }

      atom.views.updateDocument(this.renderItems.bind(this));
      return atom.views.readDocument(this.readUIPropsFromDOM.bind(this));
    }
  }, {
    key: 'addActiveClassToEditor',
    value: function addActiveClassToEditor() {
      var activeEditor = undefined;
      if (this.model) {
        activeEditor = this.model.activeEditor;
      }
      var editorElement = atom.views.getView(activeEditor);
      if (editorElement && editorElement.classList) {
        editorElement.classList.add('autocomplete-active');
      }

      this.activeClassDisposable = new _atom.Disposable(function () {
        if (editorElement && editorElement.classList) {
          editorElement.classList.remove('autocomplete-active');
        }
      });
    }
  }, {
    key: 'moveSelectionUp',
    value: function moveSelectionUp() {
      if (this.selectedIndex > 0) {
        return this.setSelectedIndex(this.selectedIndex - 1);
      } else {
        return this.setSelectedIndex(this.visibleItems().length - 1);
      }
    }
  }, {
    key: 'moveSelectionDown',
    value: function moveSelectionDown() {
      if (this.selectedIndex < this.visibleItems().length - 1) {
        return this.setSelectedIndex(this.selectedIndex + 1);
      } else {
        return this.setSelectedIndex(0);
      }
    }
  }, {
    key: 'moveSelectionPageUp',
    value: function moveSelectionPageUp() {
      var newIndex = Math.max(0, this.selectedIndex - this.maxVisibleSuggestions);
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionPageDown',
    value: function moveSelectionPageDown() {
      var itemsLength = this.visibleItems().length;
      var newIndex = Math.min(itemsLength - 1, this.selectedIndex + this.maxVisibleSuggestions);
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionToTop',
    value: function moveSelectionToTop() {
      var newIndex = 0;
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionToBottom',
    value: function moveSelectionToBottom() {
      var newIndex = this.visibleItems().length - 1;
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'setSelectedIndex',
    value: function setSelectedIndex(index) {
      this.nonDefaultIndex = true;
      this.selectedIndex = index;
      return atom.views.updateDocument(this.renderSelectedItem.bind(this));
    }
  }, {
    key: 'visibleItems',
    value: function visibleItems() {
      if (this.model && this.model.items) {
        return this.model.items.slice(0, this.maxItems);
      }
    }

    // Private: Get the currently selected item
    //
    // Returns the selected {Object}
  }, {
    key: 'getSelectedItem',
    value: function getSelectedItem() {
      if (this.model && this.model.items) {
        return this.model.items[this.selectedIndex];
      }
    }

    // Private: Confirms the currently selected item or cancels the list view
    // if no item has been selected
  }, {
    key: 'confirmSelection',
    value: function confirmSelection() {
      if (!this.model.isActive()) {
        return;
      }
      var item = this.getSelectedItem();
      if (item != null) {
        return this.model.confirm(item);
      } else {
        return this.model.cancel();
      }
    }

    // Private: Confirms the currently selected item only if it is not the default
    // item or cancels the view if none has been selected.
  }, {
    key: 'confirmSelectionIfNonDefault',
    value: function confirmSelectionIfNonDefault(event) {
      if (!this.model.isActive()) {
        return;
      }
      if (this.nonDefaultIndex) {
        return this.confirmSelection();
      } else {
        this.model.cancel();
        return event.abortKeyBinding();
      }
    }
  }, {
    key: 'renderList',
    value: function renderList() {
      this.innerHTML = ListTemplate;
      this.ol = this.querySelector('.list-group');
      this.scroller = this.querySelector('.suggestion-list-scroller');
      this.descriptionContainer = this.querySelector('.suggestion-description');
      this.descriptionContent = this.querySelector('.suggestion-description-content');
      this.descriptionMoreLink = this.querySelector('.suggestion-description-more-link');
    }
  }, {
    key: 'renderItems',
    value: function renderItems() {
      var left = undefined;
      this.style.width = null;
      var items = (left = this.visibleItems()) != null ? left : [];
      var longestDesc = 0;
      var longestDescIndex = null;
      for (var index = 0; index < items.length; index++) {
        var item = items[index];
        this.renderItem(item, index);
        var descLength = this.descriptionLength(item);
        if (descLength > longestDesc) {
          longestDesc = descLength;
          longestDescIndex = index;
        }
      }
      this.updateDescription(items[longestDescIndex]);
      return this.returnItemsToPool(items.length);
    }
  }, {
    key: 'returnItemsToPool',
    value: function returnItemsToPool(pivotIndex) {
      if (!this.ol) {
        return;
      }

      var li = this.ol.childNodes[pivotIndex];
      while (this.ol != null && li) {
        li.remove();
        this.nodePool.push(li);
        li = this.ol.childNodes[pivotIndex];
      }
    }
  }, {
    key: 'descriptionLength',
    value: function descriptionLength(item) {
      var count = 0;
      if (item.description != null) {
        count += item.description.length;
      }
      if (item.descriptionMoreURL != null) {
        count += 6;
      }
      return count;
    }
  }, {
    key: 'renderSelectedItem',
    value: function renderSelectedItem() {
      if (this.selectedLi && this.selectedLi.classList) {
        this.selectedLi.classList.remove('selected');
      }

      this.selectedLi = this.ol.childNodes[this.selectedIndex];
      if (this.selectedLi != null) {
        this.selectedLi.classList.add('selected');
        this.scrollSelectedItemIntoView();
        return this.updateDescription();
      }
    }

    // This is reading the DOM in the updateDOM cycle. If we dont, there is a flicker :/
  }, {
    key: 'scrollSelectedItemIntoView',
    value: function scrollSelectedItemIntoView() {
      var scrollTop = this.scroller.scrollTop;

      var selectedItemTop = this.selectedLi.offsetTop;
      if (selectedItemTop < scrollTop) {
        // scroll up
        this.scroller.scrollTop = selectedItemTop;
        return;
      }

      var itemHeight = this.uiProps.itemHeight;

      var scrollerHeight = this.maxVisibleSuggestions * itemHeight + this.uiProps.paddingHeight;
      if (selectedItemTop + itemHeight > scrollTop + scrollerHeight) {
        // scroll down
        this.scroller.scrollTop = selectedItemTop - scrollerHeight + itemHeight;
      }
    }
  }, {
    key: 'readUIPropsFromDOM',
    value: function readUIPropsFromDOM() {
      var wordContainer = undefined;
      if (this.selectedLi) {
        wordContainer = this.selectedLi.querySelector('.word-container');
      }

      if (!this.uiProps) {
        this.uiProps = {};
      }
      this.uiProps.width = this.offsetWidth + 1;
      this.uiProps.marginLeft = 0;
      if (wordContainer && wordContainer.offsetLeft) {
        this.uiProps.marginLeft = -wordContainer.offsetLeft;
      }
      if (!this.uiProps.itemHeight) {
        this.uiProps.itemHeight = this.selectedLi.offsetHeight;
      }
      if (!this.uiProps.paddingHeight) {
        this.uiProps.paddingHeight = parseInt(getComputedStyle(this)['padding-top']) + parseInt(getComputedStyle(this)['padding-bottom']);
        if (!this.uiProps.paddingHeight) {
          this.uiProps.paddingHeight = 0;
        }
      }

      // Update UI during this read, so that when polling the document the latest
      // changes can be picked up.
      return this.updateUIForChangedProps();
    }
  }, {
    key: 'updateUIForChangedProps',
    value: function updateUIForChangedProps() {
      this.scroller.style['max-height'] = this.maxVisibleSuggestions * this.uiProps.itemHeight + this.uiProps.paddingHeight + 'px';
      this.style.width = this.uiProps.width + 'px';
      if (this.suggestionListFollows === 'Word') {
        this.style['margin-left'] = this.uiProps.marginLeft + 'px';
      }
      return this.updateDescription();
    }

    // Splits the classes on spaces so as not to anger the DOM gods
  }, {
    key: 'addClassToElement',
    value: function addClassToElement(element, classNames) {
      if (!classNames) {
        return;
      }
      var classes = classNames.split(' ');
      if (classes) {
        for (var i = 0; i < classes.length; i++) {
          var className = classes[i];
          className = className.trim();
          if (className) {
            element.classList.add(className);
          }
        }
      }
    }
  }, {
    key: 'renderItem',
    value: function renderItem(_ref, index) {
      var iconHTML = _ref.iconHTML;
      var type = _ref.type;
      var snippet = _ref.snippet;
      var text = _ref.text;
      var displayText = _ref.displayText;
      var className = _ref.className;
      var replacementPrefix = _ref.replacementPrefix;
      var leftLabel = _ref.leftLabel;
      var leftLabelHTML = _ref.leftLabelHTML;
      var rightLabel = _ref.rightLabel;
      var rightLabelHTML = _ref.rightLabelHTML;

      var li = this.ol.childNodes[index];
      if (!li) {
        if (this.nodepool && this.nodePool.length > 0) {
          li = this.nodePool.pop();
        } else {
          li = document.createElement('li');
          li.innerHTML = ItemTemplate;
        }
        li.dataset.index = index;
        this.ol.appendChild(li);
      }

      li.className = '';
      if (index === this.selectedIndex) {
        li.classList.add('selected');
      }
      if (className) {
        this.addClassToElement(li, className);
      }
      if (index === this.selectedIndex) {
        this.selectedLi = li;
      }

      var typeIconContainer = li.querySelector('.icon-container');
      typeIconContainer.innerHTML = '';

      var sanitizedType = escapeHtml((0, _typeHelpers.isString)(type) ? type : '');
      var sanitizedIconHTML = (0, _typeHelpers.isString)(iconHTML) ? iconHTML : undefined;
      var defaultLetterIconHTML = sanitizedType ? '<span class="icon-letter">' + sanitizedType[0] + '</span>' : '';
      var defaultIconHTML = DefaultSuggestionTypeIconHTML[sanitizedType] != null ? DefaultSuggestionTypeIconHTML[sanitizedType] : defaultLetterIconHTML;
      if ((sanitizedIconHTML || defaultIconHTML) && iconHTML !== false) {
        typeIconContainer.innerHTML = IconTemplate;
        var typeIcon = typeIconContainer.childNodes[0];
        typeIcon.innerHTML = sanitizedIconHTML != null ? sanitizedIconHTML : defaultIconHTML;
        if (type) {
          this.addClassToElement(typeIcon, type);
        }
      }

      var wordSpan = li.querySelector('.word');
      wordSpan.innerHTML = this.getDisplayHTML(text, snippet, displayText, replacementPrefix);

      var leftLabelSpan = li.querySelector('.left-label');
      if (leftLabelHTML != null) {
        leftLabelSpan.innerHTML = leftLabelHTML;
      } else if (leftLabel != null) {
        leftLabelSpan.textContent = leftLabel;
      } else {
        leftLabelSpan.textContent = '';
      }

      var rightLabelSpan = li.querySelector('.right-label');
      if (rightLabelHTML != null) {
        rightLabelSpan.innerHTML = rightLabelHTML;
      } else if (rightLabel != null) {
        rightLabelSpan.textContent = rightLabel;
      } else {
        rightLabelSpan.textContent = '';
      }
    }
  }, {
    key: 'getDisplayHTML',
    value: function getDisplayHTML(text, snippet, displayText, replacementPrefix) {
      var replacementText = text;
      var snippetIndices = undefined;
      if (typeof displayText === 'string') {
        replacementText = displayText;
      } else if (typeof snippet === 'string') {
        replacementText = this.removeEmptySnippets(snippet);
        var snippets = this.snippetParser.findSnippets(replacementText);
        replacementText = this.removeSnippetsFromText(snippets, replacementText);
        snippetIndices = this.findSnippetIndices(snippets);
      }
      var characterMatchIndices = this.findCharacterMatchIndices(replacementText, replacementPrefix);

      var displayHTML = '';
      for (var index = 0; index < replacementText.length; index++) {
        if (snippetIndices && (snippetIndices[index] === SnippetStart || snippetIndices[index] === SnippetStartAndEnd)) {
          displayHTML += '<span class="snippet-completion">';
        }
        if (characterMatchIndices && characterMatchIndices[index]) {
          displayHTML += '<span class="character-match">' + escapeHtml(replacementText[index]) + '</span>';
        } else {
          displayHTML += escapeHtml(replacementText[index]);
        }
        if (snippetIndices && (snippetIndices[index] === SnippetEnd || snippetIndices[index] === SnippetStartAndEnd)) {
          displayHTML += '</span>';
        }
      }
      return displayHTML;
    }
  }, {
    key: 'removeEmptySnippets',
    value: function removeEmptySnippets(text) {
      if (!text || !text.length || text.indexOf('$') === -1) {
        return text;
      } // No snippets
      return text.replace(this.emptySnippetGroupRegex, ''); // Remove all occurrences of $0 or ${0} or ${0:}
    }

    // Will convert 'abc(${1:d}, ${2:e})f' => 'abc(d, e)f'
    //
    // * `snippets` {Array} from `SnippetParser.findSnippets`
    // * `text` {String} to remove snippets from
    //
    // Returns {String}
  }, {
    key: 'removeSnippetsFromText',
    value: function removeSnippetsFromText(snippets, text) {
      if (!text || !text.length || !snippets || !snippets.length) {
        return text;
      }
      var index = 0;
      var result = '';
      for (var _ref22 of snippets) {
        var snippetStart = _ref22.snippetStart;
        var snippetEnd = _ref22.snippetEnd;
        var body = _ref22.body;

        result += text.slice(index, snippetStart) + body;
        index = snippetEnd + 1;
      }
      if (index !== text.length) {
        result += text.slice(index, text.length);
      }
      result = result.replace(this.slashesInSnippetRegex, '\\');
      return result;
    }

    // Computes the indices of snippets in the resulting string from
    // `removeSnippetsFromText`.
    //
    // * `snippets` {Array} from `SnippetParser.findSnippets`
    //
    // e.g. A replacement of 'abc(${1:d})e' is replaced to 'abc(d)e' will result in
    //
    // `{4: SnippetStartAndEnd}`
    //
    // Returns {Object} of {index: SnippetStart|End|StartAndEnd}
  }, {
    key: 'findSnippetIndices',
    value: function findSnippetIndices(snippets) {
      if (!snippets) {
        return;
      }
      var indices = {};
      var offsetAccumulator = 0;
      for (var _ref32 of snippets) {
        var snippetStart = _ref32.snippetStart;
        var snippetEnd = _ref32.snippetEnd;
        var body = _ref32.body;

        var bodyLength = body.length;
        var snippetLength = snippetEnd - snippetStart + 1;
        var startIndex = snippetStart - offsetAccumulator;
        var endIndex = startIndex + bodyLength - 1;
        offsetAccumulator += snippetLength - bodyLength;

        if (startIndex === endIndex) {
          indices[startIndex] = SnippetStartAndEnd;
        } else {
          indices[startIndex] = SnippetStart;
          indices[endIndex] = SnippetEnd;
        }
      }

      return indices;
    }

    // Finds the indices of the chars in text that are matched by replacementPrefix
    //
    // e.g. text = 'abcde', replacementPrefix = 'acd' Will result in
    //
    // {0: true, 2: true, 3: true}
    //
    // Returns an {Object}
  }, {
    key: 'findCharacterMatchIndices',
    value: function findCharacterMatchIndices(text, replacementPrefix) {
      if (!text || !text.length || !replacementPrefix || !replacementPrefix.length) {
        return;
      }
      var matches = {};
      if (this.useAlternateScoring) {
        var matchIndices = _fuzzaldrinPlus2['default'].match(text, replacementPrefix);
        for (var i of matchIndices) {
          matches[i] = true;
        }
      } else {
        var wordIndex = 0;
        for (var i = 0; i < replacementPrefix.length; i++) {
          var ch = replacementPrefix[i];
          while (wordIndex < text.length && text[wordIndex].toLowerCase() !== ch.toLowerCase()) {
            wordIndex += 1;
          }
          if (wordIndex >= text.length) {
            break;
          }
          matches[wordIndex] = true;
          wordIndex += 1;
        }
      }
      return matches;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }]);

  return SuggestionListElement;
})(HTMLElement);

var escapeHtml = function escapeHtml(html) {
  return String(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

exports['default'] = SuggestionListElement = document.registerElement('autocomplete-suggestion-list', { prototype: SuggestionListElement.prototype });
// eslint-disable-line no-class-assign
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O0FBTDVDLFdBQVcsQ0FBQTs7QUFPWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFB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QUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUN2QixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUN0QixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0NBQ3pCLENBQUE7O3FCQUVjLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsOEJBQThCLEVBQUUsRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsU0FBUyxFQUFDLENBQUMiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9zdWdnZXN0aW9uLWxpc3QtZWxlbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IFNuaXBwZXRQYXJzZXIgZnJvbSAnLi9zbmlwcGV0LXBhcnNlcidcbmltcG9ydCB7IGlzU3RyaW5nIH0gZnJvbSAnLi90eXBlLWhlbHBlcnMnXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuXG5jb25zdCBJdGVtVGVtcGxhdGUgPSBgPHNwYW4gY2xhc3M9XCJpY29uLWNvbnRhaW5lclwiPjwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJsZWZ0LWxhYmVsXCI+PC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cIndvcmQtY29udGFpbmVyXCI+XG4gICAgPHNwYW4gY2xhc3M9XCJ3b3JkXCI+PC9zcGFuPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwicmlnaHQtbGFiZWxcIj48L3NwYW4+YFxuXG5jb25zdCBMaXN0VGVtcGxhdGUgPSBgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tbGlzdC1zY3JvbGxlclwiPlxuICAgIDxvbCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L29sPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb25cIj5cbiAgICA8c3BhbiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tY29udGVudFwiPjwvc3Bhbj5cbiAgICA8YSBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rXCIgaHJlZj1cIiNcIj5Nb3JlLi48L2E+XG4gIDwvZGl2PmBcblxuY29uc3QgSWNvblRlbXBsYXRlID0gJzxpIGNsYXNzPVwiaWNvblwiPjwvaT4nXG5cbmNvbnN0IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MID0ge1xuICAnc25pcHBldCc6ICc8aSBjbGFzcz1cImljb24tbW92ZS1yaWdodFwiPjwvaT4nLFxuICAnaW1wb3J0JzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdyZXF1aXJlJzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdtb2R1bGUnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3BhY2thZ2UnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3RhZyc6ICc8aSBjbGFzcz1cImljb24tY29kZVwiPjwvaT4nLFxuICAnYXR0cmlidXRlJzogJzxpIGNsYXNzPVwiaWNvbi10YWdcIj48L2k+J1xufVxuXG5jb25zdCBTbmlwcGV0U3RhcnQgPSAxXG5jb25zdCBTbmlwcGV0RW5kID0gMlxuY29uc3QgU25pcHBldFN0YXJ0QW5kRW5kID0gM1xuXG5jbGFzcyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNyZWF0ZWRDYWxsYmFjayAoKSB7XG4gICAgdGhpcy5tYXhJdGVtcyA9IDIwMFxuICAgIHRoaXMuZW1wdHlTbmlwcGV0R3JvdXBSZWdleCA9IC8oXFwkXFx7XFxkKzpcXH0pfChcXCRcXHtcXGQrXFx9KXwoXFwkXFxkKykvaWdcbiAgICB0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCA9IC9cXFxcXFxcXC9nXG4gICAgdGhpcy5ub2RlUG9vbCA9IG51bGxcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdwb3BvdmVyLWxpc3QnLCAnc2VsZWN0LWxpc3QnLCAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24tbGlzdCcpXG4gICAgdGhpcy5yZWdpc3Rlck1vdXNlSGFuZGxpbmcoKVxuICAgIHRoaXMuc25pcHBldFBhcnNlciA9IG5ldyBTbmlwcGV0UGFyc2VyKClcbiAgICB0aGlzLm5vZGVQb29sID0gW11cbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIC8vIFRPRE86IEZpeCBvdmVybGF5IGRlY29yYXRvciB0byBpbiBhdG9tIHRvIGFwcGx5IGNsYXNzIGF0dHJpYnV0ZSBjb3JyZWN0bHksIHRoZW4gbW92ZSB0aGlzIHRvIG92ZXJsYXkgY3JlYXRpb24gcG9pbnQuXG4gICAgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1wbHVzJylcbiAgICB0aGlzLmFkZEFjdGl2ZUNsYXNzVG9FZGl0b3IoKVxuICAgIGlmICghdGhpcy5vbCkgeyB0aGlzLnJlbmRlckxpc3QoKSB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNDaGFuZ2VkKClcbiAgfVxuXG4gIGRldGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZSAmJiB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplIChtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbFxuICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRDaGFuZ2VJdGVtcyh0aGlzLml0ZW1zQ2hhbmdlZC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3ROZXh0KHRoaXMubW92ZVNlbGVjdGlvbkRvd24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UHJldmlvdXModGhpcy5tb3ZlU2VsZWN0aW9uVXAuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UGFnZVVwKHRoaXMubW92ZVNlbGVjdGlvblBhZ2VVcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQYWdlRG93bih0aGlzLm1vdmVTZWxlY3Rpb25QYWdlRG93bi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RUb3AodGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0Qm90dG9tKHRoaXMubW92ZVNlbGVjdGlvblRvQm90dG9tLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZENvbmZpcm1TZWxlY3Rpb24odGhpcy5jb25maXJtU2VsZWN0aW9uLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQodGhpcy5jb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0LmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZERpc3Bvc2UodGhpcy5kaXNwb3NlLmJpbmQodGhpcykpKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MnLCBzdWdnZXN0aW9uTGlzdEZvbGxvd3MgPT4ge1xuICAgICAgdGhpcy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MgPSBzdWdnZXN0aW9uTGlzdEZvbGxvd3NcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLm1heFZpc2libGVTdWdnZXN0aW9ucycsIG1heFZpc2libGVTdWdnZXN0aW9ucyA9PiB7XG4gICAgICB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyA9IG1heFZpc2libGVTdWdnZXN0aW9uc1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsIHVzZUFsdGVybmF0ZVNjb3JpbmcgPT4ge1xuICAgICAgdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID0gdXNlQWx0ZXJuYXRlU2NvcmluZ1xuICAgIH0pKVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBUaGlzIHNob3VsZCBiZSB1bm5lY2Vzc2FyeSBidXQgdGhlIGV2ZW50cyB3ZSBuZWVkIHRvIG92ZXJyaWRlXG4gIC8vIGFyZSBoYW5kbGVkIGF0IGEgbGV2ZWwgdGhhdCBjYW4ndCBiZSBibG9ja2VkIGJ5IHJlYWN0IHN5bnRoZXRpY1xuICAvLyBldmVudHMgYmVjYXVzZSB0aGV5IGFyZSBoYW5kbGVkIGF0IHRoZSBkb2N1bWVudFxuICByZWdpc3Rlck1vdXNlSGFuZGxpbmcgKCkge1xuICAgIHRoaXMub25tb3VzZXdoZWVsID0gZXZlbnQgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICB0aGlzLm9ubW91c2Vkb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5maW5kSXRlbShldmVudClcbiAgICAgIGlmIChpdGVtICYmIGl0ZW0uZGF0YXNldCAmJiBpdGVtLmRhdGFzZXQuaW5kZXgpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaXRlbS5kYXRhc2V0LmluZGV4XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vbm1vdXNldXAgPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmZpbmRJdGVtKGV2ZW50KVxuICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5kYXRhc2V0ICYmIGl0ZW0uZGF0YXNldC5pbmRleCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICB0aGlzLmNvbmZpcm1TZWxlY3Rpb24oKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZpbmRJdGVtIChldmVudCkge1xuICAgIGxldCBpdGVtID0gZXZlbnQudGFyZ2V0XG4gICAgd2hpbGUgKGl0ZW0udGFnTmFtZSAhPT0gJ0xJJyAmJiBpdGVtICE9PSB0aGlzKSB7IGl0ZW0gPSBpdGVtLnBhcmVudE5vZGUgfVxuICAgIGlmIChpdGVtLnRhZ05hbWUgPT09ICdMSScpIHsgcmV0dXJuIGl0ZW0gfVxuICB9XG5cbiAgdXBkYXRlRGVzY3JpcHRpb24gKGl0ZW0pIHtcbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMpIHtcbiAgICAgICAgaXRlbSA9IHRoaXMubW9kZWwuaXRlbXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uICYmIGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQudGV4dENvbnRlbnQgPSBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICBpZiAoKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMICE9IG51bGwpICYmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTC5sZW5ndGggIT0gbnVsbCkpIHtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICB9XG4gIH1cblxuICBpdGVtc0NoYW5nZWQgKCkge1xuICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMgJiYgdGhpcy5tb2RlbC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKDApXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICB0aGlzLm5vbkRlZmF1bHRJbmRleCA9IGZhbHNlXG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMFxuICAgIGlmIChhdG9tLnZpZXdzLnBvbGxBZnRlck5leHRVcGRhdGUpIHtcbiAgICAgIGF0b20udmlld3MucG9sbEFmdGVyTmV4dFVwZGF0ZSgpXG4gICAgfVxuXG4gICAgYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlckl0ZW1zLmJpbmQodGhpcykpXG4gICAgcmV0dXJuIGF0b20udmlld3MucmVhZERvY3VtZW50KHRoaXMucmVhZFVJUHJvcHNGcm9tRE9NLmJpbmQodGhpcykpXG4gIH1cblxuICBhZGRBY3RpdmVDbGFzc1RvRWRpdG9yICgpIHtcbiAgICBsZXQgYWN0aXZlRWRpdG9yXG4gICAgaWYgKHRoaXMubW9kZWwpIHtcbiAgICAgIGFjdGl2ZUVkaXRvciA9IHRoaXMubW9kZWwuYWN0aXZlRWRpdG9yXG4gICAgfVxuICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYWN0aXZlRWRpdG9yKVxuICAgIGlmIChlZGl0b3JFbGVtZW50ICYmIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKVxuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKGVkaXRvckVsZW1lbnQgJiYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdhdXRvY29tcGxldGUtYWN0aXZlJylcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblVwICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMSlcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uRG93biAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCA8ICh0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDEpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMuc2VsZWN0ZWRJbmRleCArIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgoMClcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uUGFnZVVwICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IE1hdGgubWF4KDAsIHRoaXMuc2VsZWN0ZWRJbmRleCAtIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25QYWdlRG93biAoKSB7XG4gICAgY29uc3QgaXRlbXNMZW5ndGggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aFxuICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5taW4oaXRlbXNMZW5ndGggLSAxLCB0aGlzLnNlbGVjdGVkSW5kZXggKyB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucylcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVG9Ub3AgKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gMFxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub0JvdHRvbSAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDFcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBzZXRTZWxlY3RlZEluZGV4IChpbmRleCkge1xuICAgIHRoaXMubm9uRGVmYXVsdEluZGV4ID0gdHJ1ZVxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4XG4gICAgcmV0dXJuIGF0b20udmlld3MudXBkYXRlRG9jdW1lbnQodGhpcy5yZW5kZXJTZWxlY3RlZEl0ZW0uYmluZCh0aGlzKSlcbiAgfVxuXG4gIHZpc2libGVJdGVtcyAoKSB7XG4gICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuaXRlbXMuc2xpY2UoMCwgdGhpcy5tYXhJdGVtcylcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXQgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHNlbGVjdGVkIHtPYmplY3R9XG4gIGdldFNlbGVjdGVkSXRlbSAoKSB7XG4gICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuaXRlbXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IENvbmZpcm1zIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBvciBjYW5jZWxzIHRoZSBsaXN0IHZpZXdcbiAgLy8gaWYgbm8gaXRlbSBoYXMgYmVlbiBzZWxlY3RlZFxuICBjb25maXJtU2VsZWN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwuaXNBY3RpdmUoKSkgeyByZXR1cm4gfVxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldFNlbGVjdGVkSXRlbSgpXG4gICAgaWYgKGl0ZW0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29uZmlybShpdGVtKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5jYW5jZWwoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IENvbmZpcm1zIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBvbmx5IGlmIGl0IGlzIG5vdCB0aGUgZGVmYXVsdFxuICAvLyBpdGVtIG9yIGNhbmNlbHMgdGhlIHZpZXcgaWYgbm9uZSBoYXMgYmVlbiBzZWxlY3RlZC5cbiAgY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCAoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwuaXNBY3RpdmUoKSkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLm5vbkRlZmF1bHRJbmRleCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29uZmlybVNlbGVjdGlvbigpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubW9kZWwuY2FuY2VsKClcbiAgICAgIHJldHVybiBldmVudC5hYm9ydEtleUJpbmRpbmcoKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlckxpc3QgKCkge1xuICAgIHRoaXMuaW5uZXJIVE1MID0gTGlzdFRlbXBsYXRlXG4gICAgdGhpcy5vbCA9IHRoaXMucXVlcnlTZWxlY3RvcignLmxpc3QtZ3JvdXAnKVxuICAgIHRoaXMuc2Nyb2xsZXIgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWxpc3Qtc2Nyb2xsZXInKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uJylcbiAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGVudCA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tY29udGVudCcpXG4gICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1tb3JlLWxpbmsnKVxuICB9XG5cbiAgcmVuZGVySXRlbXMgKCkge1xuICAgIGxldCBsZWZ0XG4gICAgdGhpcy5zdHlsZS53aWR0aCA9IG51bGxcbiAgICBjb25zdCBpdGVtcyA9IChsZWZ0ID0gdGhpcy52aXNpYmxlSXRlbXMoKSkgIT0gbnVsbCA/IGxlZnQgOiBbXVxuICAgIGxldCBsb25nZXN0RGVzYyA9IDBcbiAgICBsZXQgbG9uZ2VzdERlc2NJbmRleCA9IG51bGxcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgaXRlbXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gaXRlbXNbaW5kZXhdXG4gICAgICB0aGlzLnJlbmRlckl0ZW0oaXRlbSwgaW5kZXgpXG4gICAgICBjb25zdCBkZXNjTGVuZ3RoID0gdGhpcy5kZXNjcmlwdGlvbkxlbmd0aChpdGVtKVxuICAgICAgaWYgKGRlc2NMZW5ndGggPiBsb25nZXN0RGVzYykge1xuICAgICAgICBsb25nZXN0RGVzYyA9IGRlc2NMZW5ndGhcbiAgICAgICAgbG9uZ2VzdERlc2NJbmRleCA9IGluZGV4XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oaXRlbXNbbG9uZ2VzdERlc2NJbmRleF0pXG4gICAgcmV0dXJuIHRoaXMucmV0dXJuSXRlbXNUb1Bvb2woaXRlbXMubGVuZ3RoKVxuICB9XG5cbiAgcmV0dXJuSXRlbXNUb1Bvb2wgKHBpdm90SW5kZXgpIHtcbiAgICBpZiAoIXRoaXMub2wpIHsgcmV0dXJuIH1cblxuICAgIGxldCBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1twaXZvdEluZGV4XVxuICAgIHdoaWxlICgodGhpcy5vbCAhPSBudWxsKSAmJiBsaSkge1xuICAgICAgbGkucmVtb3ZlKClcbiAgICAgIHRoaXMubm9kZVBvb2wucHVzaChsaSlcbiAgICAgIGxpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3Bpdm90SW5kZXhdXG4gICAgfVxuICB9XG5cbiAgZGVzY3JpcHRpb25MZW5ndGggKGl0ZW0pIHtcbiAgICBsZXQgY291bnQgPSAwXG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgY291bnQgKz0gaXRlbS5kZXNjcmlwdGlvbi5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMICE9IG51bGwpIHtcbiAgICAgIGNvdW50ICs9IDZcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZEl0ZW0gKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkTGkgJiYgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdCkge1xuICAgICAgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJylcbiAgICB9XG5cbiAgICB0aGlzLnNlbGVjdGVkTGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgIGlmICh0aGlzLnNlbGVjdGVkTGkgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJylcbiAgICAgIHRoaXMuc2Nyb2xsU2VsZWN0ZWRJdGVtSW50b1ZpZXcoKVxuICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRoaXMgaXMgcmVhZGluZyB0aGUgRE9NIGluIHRoZSB1cGRhdGVET00gY3ljbGUuIElmIHdlIGRvbnQsIHRoZXJlIGlzIGEgZmxpY2tlciA6L1xuICBzY3JvbGxTZWxlY3RlZEl0ZW1JbnRvVmlldyAoKSB7XG4gICAgY29uc3QgeyBzY3JvbGxUb3AgfSA9IHRoaXMuc2Nyb2xsZXJcbiAgICBjb25zdCBzZWxlY3RlZEl0ZW1Ub3AgPSB0aGlzLnNlbGVjdGVkTGkub2Zmc2V0VG9wXG4gICAgaWYgKHNlbGVjdGVkSXRlbVRvcCA8IHNjcm9sbFRvcCkge1xuICAgICAgLy8gc2Nyb2xsIHVwXG4gICAgICB0aGlzLnNjcm9sbGVyLnNjcm9sbFRvcCA9IHNlbGVjdGVkSXRlbVRvcFxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBpdGVtSGVpZ2h0IH0gPSB0aGlzLnVpUHJvcHNcbiAgICBjb25zdCBzY3JvbGxlckhlaWdodCA9ICh0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyAqIGl0ZW1IZWlnaHQpICsgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHRcbiAgICBpZiAoc2VsZWN0ZWRJdGVtVG9wICsgaXRlbUhlaWdodCA+IHNjcm9sbFRvcCArIHNjcm9sbGVySGVpZ2h0KSB7XG4gICAgICAvLyBzY3JvbGwgZG93blxuICAgICAgdGhpcy5zY3JvbGxlci5zY3JvbGxUb3AgPSAoc2VsZWN0ZWRJdGVtVG9wIC0gc2Nyb2xsZXJIZWlnaHQpICsgaXRlbUhlaWdodFxuICAgIH1cbiAgfVxuXG4gIHJlYWRVSVByb3BzRnJvbURPTSAoKSB7XG4gICAgbGV0IHdvcmRDb250YWluZXJcbiAgICBpZiAodGhpcy5zZWxlY3RlZExpKSB7XG4gICAgICB3b3JkQ29udGFpbmVyID0gdGhpcy5zZWxlY3RlZExpLnF1ZXJ5U2VsZWN0b3IoJy53b3JkLWNvbnRhaW5lcicpXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnVpUHJvcHMpIHsgdGhpcy51aVByb3BzID0ge30gfVxuICAgIHRoaXMudWlQcm9wcy53aWR0aCA9IHRoaXMub2Zmc2V0V2lkdGggKyAxXG4gICAgdGhpcy51aVByb3BzLm1hcmdpbkxlZnQgPSAwXG4gICAgaWYgKHdvcmRDb250YWluZXIgJiYgd29yZENvbnRhaW5lci5vZmZzZXRMZWZ0KSB7XG4gICAgICB0aGlzLnVpUHJvcHMubWFyZ2luTGVmdCA9IC13b3JkQ29udGFpbmVyLm9mZnNldExlZnRcbiAgICB9XG4gICAgaWYgKCF0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCkge1xuICAgICAgdGhpcy51aVByb3BzLml0ZW1IZWlnaHQgPSB0aGlzLnNlbGVjdGVkTGkub2Zmc2V0SGVpZ2h0XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0ID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKVsncGFkZGluZy10b3AnXSkgKyBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKHRoaXMpWydwYWRkaW5nLWJvdHRvbSddKVxuICAgICAgaWYgKCF0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCkge1xuICAgICAgICB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCA9IDBcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgVUkgZHVyaW5nIHRoaXMgcmVhZCwgc28gdGhhdCB3aGVuIHBvbGxpbmcgdGhlIGRvY3VtZW50IHRoZSBsYXRlc3RcbiAgICAvLyBjaGFuZ2VzIGNhbiBiZSBwaWNrZWQgdXAuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMoKVxuICB9XG5cbiAgdXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMgKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGVbJ21heC1oZWlnaHQnXSA9IGAkeyh0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyAqIHRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0fXB4YFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBgJHt0aGlzLnVpUHJvcHMud2lkdGh9cHhgXG4gICAgaWYgKHRoaXMuc3VnZ2VzdGlvbkxpc3RGb2xsb3dzID09PSAnV29yZCcpIHtcbiAgICAgIHRoaXMuc3R5bGVbJ21hcmdpbi1sZWZ0J10gPSBgJHt0aGlzLnVpUHJvcHMubWFyZ2luTGVmdH1weGBcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oKVxuICB9XG5cbiAgLy8gU3BsaXRzIHRoZSBjbGFzc2VzIG9uIHNwYWNlcyBzbyBhcyBub3QgdG8gYW5nZXIgdGhlIERPTSBnb2RzXG4gIGFkZENsYXNzVG9FbGVtZW50IChlbGVtZW50LCBjbGFzc05hbWVzKSB7XG4gICAgaWYgKCFjbGFzc05hbWVzKSB7IHJldHVybiB9XG4gICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMuc3BsaXQoJyAnKVxuICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzZXNbaV1cbiAgICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnRyaW0oKVxuICAgICAgICBpZiAoY2xhc3NOYW1lKSB7IGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW5kZXJJdGVtICh7aWNvbkhUTUwsIHR5cGUsIHNuaXBwZXQsIHRleHQsIGRpc3BsYXlUZXh0LCBjbGFzc05hbWUsIHJlcGxhY2VtZW50UHJlZml4LCBsZWZ0TGFiZWwsIGxlZnRMYWJlbEhUTUwsIHJpZ2h0TGFiZWwsIHJpZ2h0TGFiZWxIVE1MfSwgaW5kZXgpIHtcbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbaW5kZXhdXG4gICAgaWYgKCFsaSkge1xuICAgICAgaWYgKHRoaXMubm9kZXBvb2wgJiYgdGhpcy5ub2RlUG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpID0gdGhpcy5ub2RlUG9vbC5wb3AoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICAgIGxpLmlubmVySFRNTCA9IEl0ZW1UZW1wbGF0ZVxuICAgICAgfVxuICAgICAgbGkuZGF0YXNldC5pbmRleCA9IGluZGV4XG4gICAgICB0aGlzLm9sLmFwcGVuZENoaWxkKGxpKVxuICAgIH1cblxuICAgIGxpLmNsYXNzTmFtZSA9ICcnXG4gICAgaWYgKGluZGV4ID09PSB0aGlzLnNlbGVjdGVkSW5kZXgpIHsgbGkuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKSB9XG4gICAgaWYgKGNsYXNzTmFtZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KGxpLCBjbGFzc05hbWUpIH1cbiAgICBpZiAoaW5kZXggPT09IHRoaXMuc2VsZWN0ZWRJbmRleCkgeyB0aGlzLnNlbGVjdGVkTGkgPSBsaSB9XG5cbiAgICBjb25zdCB0eXBlSWNvbkNvbnRhaW5lciA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5pY29uLWNvbnRhaW5lcicpXG4gICAgdHlwZUljb25Db250YWluZXIuaW5uZXJIVE1MID0gJydcblxuICAgIGNvbnN0IHNhbml0aXplZFR5cGUgPSBlc2NhcGVIdG1sKGlzU3RyaW5nKHR5cGUpID8gdHlwZSA6ICcnKVxuICAgIGNvbnN0IHNhbml0aXplZEljb25IVE1MID0gaXNTdHJpbmcoaWNvbkhUTUwpID8gaWNvbkhUTUwgOiB1bmRlZmluZWRcbiAgICBjb25zdCBkZWZhdWx0TGV0dGVySWNvbkhUTUwgPSBzYW5pdGl6ZWRUeXBlID8gYDxzcGFuIGNsYXNzPVxcXCJpY29uLWxldHRlclxcXCI+JHtzYW5pdGl6ZWRUeXBlWzBdfTwvc3Bhbj5gIDogJydcbiAgICBjb25zdCBkZWZhdWx0SWNvbkhUTUwgPSBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTFtzYW5pdGl6ZWRUeXBlXSAhPSBudWxsID8gRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUxbc2FuaXRpemVkVHlwZV0gOiBkZWZhdWx0TGV0dGVySWNvbkhUTUxcbiAgICBpZiAoKHNhbml0aXplZEljb25IVE1MIHx8IGRlZmF1bHRJY29uSFRNTCkgJiYgaWNvbkhUTUwgIT09IGZhbHNlKSB7XG4gICAgICB0eXBlSWNvbkNvbnRhaW5lci5pbm5lckhUTUwgPSBJY29uVGVtcGxhdGVcbiAgICAgIGNvbnN0IHR5cGVJY29uID0gdHlwZUljb25Db250YWluZXIuY2hpbGROb2Rlc1swXVxuICAgICAgdHlwZUljb24uaW5uZXJIVE1MID0gc2FuaXRpemVkSWNvbkhUTUwgIT0gbnVsbCA/IHNhbml0aXplZEljb25IVE1MIDogZGVmYXVsdEljb25IVE1MXG4gICAgICBpZiAodHlwZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KHR5cGVJY29uLCB0eXBlKSB9XG4gICAgfVxuXG4gICAgY29uc3Qgd29yZFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcud29yZCcpXG4gICAgd29yZFNwYW4uaW5uZXJIVE1MID0gdGhpcy5nZXREaXNwbGF5SFRNTCh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG5cbiAgICBjb25zdCBsZWZ0TGFiZWxTcGFuID0gbGkucXVlcnlTZWxlY3RvcignLmxlZnQtbGFiZWwnKVxuICAgIGlmIChsZWZ0TGFiZWxIVE1MICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4uaW5uZXJIVE1MID0gbGVmdExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAobGVmdExhYmVsICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSBsZWZ0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdExhYmVsU3Bhbi50ZXh0Q29udGVudCA9ICcnXG4gICAgfVxuXG4gICAgY29uc3QgcmlnaHRMYWJlbFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcucmlnaHQtbGFiZWwnKVxuICAgIGlmIChyaWdodExhYmVsSFRNTCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi5pbm5lckhUTUwgPSByaWdodExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAocmlnaHRMYWJlbCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi50ZXh0Q29udGVudCA9IHJpZ2h0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIGdldERpc3BsYXlIVE1MICh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBsZXQgcmVwbGFjZW1lbnRUZXh0ID0gdGV4dFxuICAgIGxldCBzbmlwcGV0SW5kaWNlc1xuICAgIGlmICh0eXBlb2YgZGlzcGxheVRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSBkaXNwbGF5VGV4dFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNuaXBwZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZUVtcHR5U25pcHBldHMoc25pcHBldClcbiAgICAgIGNvbnN0IHNuaXBwZXRzID0gdGhpcy5zbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0cyhyZXBsYWNlbWVudFRleHQpXG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZVNuaXBwZXRzRnJvbVRleHQoc25pcHBldHMsIHJlcGxhY2VtZW50VGV4dClcbiAgICAgIHNuaXBwZXRJbmRpY2VzID0gdGhpcy5maW5kU25pcHBldEluZGljZXMoc25pcHBldHMpXG4gICAgfVxuICAgIGNvbnN0IGNoYXJhY3Rlck1hdGNoSW5kaWNlcyA9IHRoaXMuZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyhyZXBsYWNlbWVudFRleHQsIHJlcGxhY2VtZW50UHJlZml4KVxuXG4gICAgbGV0IGRpc3BsYXlIVE1MID0gJydcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVwbGFjZW1lbnRUZXh0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydCB8fCBzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydEFuZEVuZCkpIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gJzxzcGFuIGNsYXNzPVwic25pcHBldC1jb21wbGV0aW9uXCI+J1xuICAgICAgfVxuICAgICAgaWYgKGNoYXJhY3Rlck1hdGNoSW5kaWNlcyAmJiBjaGFyYWN0ZXJNYXRjaEluZGljZXNbaW5kZXhdKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9IGA8c3BhbiBjbGFzcz1cImNoYXJhY3Rlci1tYXRjaFwiPiR7ZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKX08L3NwYW4+YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKVxuICAgICAgfVxuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRFbmQgfHwgc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0U3RhcnRBbmRFbmQpKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9ICc8L3NwYW4+J1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlzcGxheUhUTUxcbiAgfVxuXG4gIHJlbW92ZUVtcHR5U25pcHBldHMgKHRleHQpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8IHRleHQuaW5kZXhPZignJCcpID09PSAtMSkgeyByZXR1cm4gdGV4dCB9IC8vIE5vIHNuaXBwZXRzXG4gICAgcmV0dXJuIHRleHQucmVwbGFjZSh0aGlzLmVtcHR5U25pcHBldEdyb3VwUmVnZXgsICcnKSAvLyBSZW1vdmUgYWxsIG9jY3VycmVuY2VzIG9mICQwIG9yICR7MH0gb3IgJHswOn1cbiAgfVxuXG4gIC8vIFdpbGwgY29udmVydCAnYWJjKCR7MTpkfSwgJHsyOmV9KWYnID0+ICdhYmMoZCwgZSlmJ1xuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy8gKiBgdGV4dGAge1N0cmluZ30gdG8gcmVtb3ZlIHNuaXBwZXRzIGZyb21cbiAgLy9cbiAgLy8gUmV0dXJucyB7U3RyaW5nfVxuICByZW1vdmVTbmlwcGV0c0Zyb21UZXh0IChzbmlwcGV0cywgdGV4dCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgIXNuaXBwZXRzIHx8ICFzbmlwcGV0cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0ZXh0XG4gICAgfVxuICAgIGxldCBpbmRleCA9IDBcbiAgICBsZXQgcmVzdWx0ID0gJydcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICByZXN1bHQgKz0gdGV4dC5zbGljZShpbmRleCwgc25pcHBldFN0YXJ0KSArIGJvZHlcbiAgICAgIGluZGV4ID0gc25pcHBldEVuZCArIDFcbiAgICB9XG4gICAgaWYgKGluZGV4ICE9PSB0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmVzdWx0ICs9IHRleHQuc2xpY2UoaW5kZXgsIHRleHQubGVuZ3RoKVxuICAgIH1cbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSh0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCwgJ1xcXFwnKVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8vIENvbXB1dGVzIHRoZSBpbmRpY2VzIG9mIHNuaXBwZXRzIGluIHRoZSByZXN1bHRpbmcgc3RyaW5nIGZyb21cbiAgLy8gYHJlbW92ZVNuaXBwZXRzRnJvbVRleHRgLlxuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy9cbiAgLy8gZS5nLiBBIHJlcGxhY2VtZW50IG9mICdhYmMoJHsxOmR9KWUnIGlzIHJlcGxhY2VkIHRvICdhYmMoZCllJyB3aWxsIHJlc3VsdCBpblxuICAvL1xuICAvLyBgezQ6IFNuaXBwZXRTdGFydEFuZEVuZH1gXG4gIC8vXG4gIC8vIFJldHVybnMge09iamVjdH0gb2Yge2luZGV4OiBTbmlwcGV0U3RhcnR8RW5kfFN0YXJ0QW5kRW5kfVxuICBmaW5kU25pcHBldEluZGljZXMgKHNuaXBwZXRzKSB7XG4gICAgaWYgKCFzbmlwcGV0cykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGluZGljZXMgPSB7fVxuICAgIGxldCBvZmZzZXRBY2N1bXVsYXRvciA9IDBcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICBjb25zdCBib2R5TGVuZ3RoID0gYm9keS5sZW5ndGhcbiAgICAgIGNvbnN0IHNuaXBwZXRMZW5ndGggPSAoc25pcHBldEVuZCAtIHNuaXBwZXRTdGFydCkgKyAxXG4gICAgICBjb25zdCBzdGFydEluZGV4ID0gc25pcHBldFN0YXJ0IC0gb2Zmc2V0QWNjdW11bGF0b3JcbiAgICAgIGNvbnN0IGVuZEluZGV4ID0gKHN0YXJ0SW5kZXggKyBib2R5TGVuZ3RoKSAtIDFcbiAgICAgIG9mZnNldEFjY3VtdWxhdG9yICs9IHNuaXBwZXRMZW5ndGggLSBib2R5TGVuZ3RoXG5cbiAgICAgIGlmIChzdGFydEluZGV4ID09PSBlbmRJbmRleCkge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0QW5kRW5kXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0XG4gICAgICAgIGluZGljZXNbZW5kSW5kZXhdID0gU25pcHBldEVuZFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmRpY2VzXG4gIH1cblxuICAvLyBGaW5kcyB0aGUgaW5kaWNlcyBvZiB0aGUgY2hhcnMgaW4gdGV4dCB0aGF0IGFyZSBtYXRjaGVkIGJ5IHJlcGxhY2VtZW50UHJlZml4XG4gIC8vXG4gIC8vIGUuZy4gdGV4dCA9ICdhYmNkZScsIHJlcGxhY2VtZW50UHJlZml4ID0gJ2FjZCcgV2lsbCByZXN1bHQgaW5cbiAgLy9cbiAgLy8gezA6IHRydWUsIDI6IHRydWUsIDM6IHRydWV9XG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge09iamVjdH1cbiAgZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyAodGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8ICFyZXBsYWNlbWVudFByZWZpeCB8fCAhcmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoKSB7IHJldHVybiB9XG4gICAgY29uc3QgbWF0Y2hlcyA9IHt9XG4gICAgaWYgKHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZykge1xuICAgICAgY29uc3QgbWF0Y2hJbmRpY2VzID0gZnV6emFsZHJpblBsdXMubWF0Y2godGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG4gICAgICBmb3IgKGNvbnN0IGkgb2YgbWF0Y2hJbmRpY2VzKSB7XG4gICAgICAgIG1hdGNoZXNbaV0gPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB3b3JkSW5kZXggPSAwXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoID0gcmVwbGFjZW1lbnRQcmVmaXhbaV1cbiAgICAgICAgd2hpbGUgKHdvcmRJbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRbd29yZEluZGV4XS50b0xvd2VyQ2FzZSgpICE9PSBjaC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgd29yZEluZGV4ICs9IDFcbiAgICAgICAgfVxuICAgICAgICBpZiAod29yZEluZGV4ID49IHRleHQubGVuZ3RoKSB7IGJyZWFrIH1cbiAgICAgICAgbWF0Y2hlc1t3b3JkSW5kZXhdID0gdHJ1ZVxuICAgICAgICB3b3JkSW5kZXggKz0gMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlc1xuICB9XG5cbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKVxuICAgIH1cbiAgfVxufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY29tcG9uZW50L2VzY2FwZS1odG1sL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5jb25zdCBlc2NhcGVIdG1sID0gKGh0bWwpID0+IHtcbiAgcmV0dXJuIFN0cmluZyhodG1sKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jylcbn1cblxuZXhwb3J0IGRlZmF1bHQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0Jywge3Byb3RvdHlwZTogU3VnZ2VzdGlvbkxpc3RFbGVtZW50LnByb3RvdHlwZX0pIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY2xhc3MtYXNzaWduXG4iXX0=