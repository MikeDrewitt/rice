Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _scopeHelpers = require('./scope-helpers');

var _fuzzaldrin = require('fuzzaldrin');

var _fuzzaldrin2 = _interopRequireDefault(_fuzzaldrin);

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _underscorePlus = require('underscore-plus');

'use babel';

var EMPTY_ARRAY = [];

var Symbol = (function () {
  function Symbol(text, scopes) {
    _classCallCheck(this, Symbol);

    this.text = text;
    this.scopeChain = (0, _scopeHelpers.buildScopeChainString)(scopes);
  }

  _createClass(Symbol, [{
    key: 'matchingTypeForConfig',
    value: function matchingTypeForConfig(config) {
      var matchingType = null;
      var highestTypePriority = -1;
      for (var type of Object.keys(config)) {
        var _config$type = config[type];
        var selectors = _config$type.selectors;
        var typePriority = _config$type.typePriority;

        if (selectors == null) continue;
        if (typePriority == null) typePriority = 0;
        if (typePriority > highestTypePriority && (0, _scopeHelpers.selectorsMatchScopeChain)(selectors, this.scopeChain)) {
          matchingType = type;
          highestTypePriority = typePriority;
        }
      }

      return matchingType;
    }
  }]);

  return Symbol;
})();

var SymbolStore = (function () {
  function SymbolStore(wordRegex) {
    _classCallCheck(this, SymbolStore);

    this.wordRegex = wordRegex;
    this.linesByBuffer = new Map();
  }

  _createClass(SymbolStore, [{
    key: 'clear',
    value: function clear(buffer) {
      if (buffer) {
        this.linesByBuffer['delete'](buffer);
      } else {
        this.linesByBuffer.clear();
      }
    }
  }, {
    key: 'symbolsForConfig',
    value: function symbolsForConfig(config, buffers, prefix, wordUnderCursor, cursorBufferRow, numberOfCursors) {
      this.prefixCache = _fuzzaldrinPlus2['default'].prepareQuery(prefix);

      var firstLetter = prefix[0].toLowerCase();
      var symbolsByWord = new Map();
      var wordOccurrences = new Map();
      var builtinSymbolsByWord = new Set();

      var suggestions = [];
      for (var type of Object.keys(config)) {
        var symbols = config[type].suggestions || EMPTY_ARRAY;
        for (var symbol of symbols) {
          var _scoreSymbol = this.scoreSymbol(prefix, symbol, cursorBufferRow, Number.MAX_VALUE);

          var score = _scoreSymbol.score;

          if (score > 0) {
            symbol.replacementPrefix = prefix;
            suggestions.push({ symbol: symbol, score: score });
            if (symbol.text) {
              builtinSymbolsByWord.add(symbol.text);
            } else if (symbol.snippet) {
              builtinSymbolsByWord.add(symbol.snippet);
            }
          }
        }
      }

      for (var bufferLines of this.linesForBuffers(buffers)) {
        var symbolBufferRow = 0;
        for (var lineSymbolsByLetter of bufferLines) {
          var symbols = lineSymbolsByLetter.get(firstLetter) || EMPTY_ARRAY;
          for (var symbol of symbols) {
            wordOccurrences.set(symbol.text, (wordOccurrences.get(symbol.text) || 0) + 1);

            var symbolForWord = symbolsByWord.get(symbol.text);
            if (symbolForWord != null) {
              symbolForWord.localityScore = Math.max(this.getLocalityScore(cursorBufferRow, symbolBufferRow), symbolForWord.localityScore);
            } else if (wordUnderCursor === symbol.text && wordOccurrences.get(symbol.text) <= numberOfCursors) {
              continue;
            } else {
              var _scoreSymbol2 = this.scoreSymbol(prefix, symbol, cursorBufferRow, symbolBufferRow);

              var score = _scoreSymbol2.score;
              var localityScore = _scoreSymbol2.localityScore;

              if (score > 0) {
                var type = symbol.matchingTypeForConfig(config);
                if (type != null) {
                  symbol = { text: symbol.text, type: type, replacementPrefix: prefix };
                  if (!builtinSymbolsByWord.has(symbol.text)) {
                    symbolsByWord.set(symbol.text, { symbol: symbol, score: score, localityScore: localityScore });
                  }
                }
              }
            }
          }

          symbolBufferRow++;
        }
      }

      return Array.from(symbolsByWord.values()).concat(suggestions);
    }
  }, {
    key: 'recomputeSymbolsForEditorInBufferRange',
    value: function recomputeSymbolsForEditorInBufferRange(editor, start, oldExtent, newExtent) {
      var newEnd = start.row + newExtent.row;
      var newLines = [];
      // TODO: Remove this conditional once atom/ns-use-display-layers reaches stable and editor.tokenizedBuffer is available
      var tokenizedBuffer = editor.tokenizedBuffer ? editor.tokenizedBuffer : editor.displayBuffer.tokenizedBuffer;

      for (var bufferRow = start.row; bufferRow <= newEnd; bufferRow++) {
        var tokenizedLine = tokenizedBuffer.tokenizedLineForRow(bufferRow);
        if (tokenizedLine == null) continue;

        var symbolsByLetter = new Map();
        var tokenIterator = tokenizedLine.getTokenIterator();
        while (tokenIterator.next()) {
          var wordsWithinToken = tokenIterator.getText().match(this.wordRegex) || EMPTY_ARRAY;
          for (var wordWithinToken of wordsWithinToken) {
            var symbol = new Symbol(wordWithinToken, tokenIterator.getScopes());
            var firstLetter = symbol.text[0].toLowerCase();
            if (!symbolsByLetter.has(firstLetter)) symbolsByLetter.set(firstLetter, []);
            symbolsByLetter.get(firstLetter).push(symbol);
          }
        }

        newLines.push(symbolsByLetter);
      }

      var bufferLines = this.linesForBuffer(editor.getBuffer());
      (0, _underscorePlus.spliceWithArray)(bufferLines, start.row, oldExtent.row + 1, newLines);
    }
  }, {
    key: 'linesForBuffers',
    value: function linesForBuffers(buffers) {
      var _this = this;

      buffers = buffers || Array.from(this.linesByBuffer.keys());
      return buffers.map(function (buffer) {
        return _this.linesForBuffer(buffer);
      });
    }
  }, {
    key: 'linesForBuffer',
    value: function linesForBuffer(buffer) {
      if (!this.linesByBuffer.has(buffer)) {
        this.linesByBuffer.set(buffer, []);
      }

      return this.linesByBuffer.get(buffer);
    }
  }, {
    key: 'setUseAlternateScoring',
    value: function setUseAlternateScoring(useAlternateScoring) {
      this.useAlternateScoring = useAlternateScoring;
    }
  }, {
    key: 'setUseLocalityBonus',
    value: function setUseLocalityBonus(useLocalityBonus) {
      this.useLocalityBonus = useLocalityBonus;
    }
  }, {
    key: 'setUseStrictMatching',
    value: function setUseStrictMatching(useStrictMatching) {
      this.useStrictMatching = useStrictMatching;
    }
  }, {
    key: 'scoreSymbol',
    value: function scoreSymbol(prefix, symbol, cursorBufferRow, symbolBufferRow) {
      var text = symbol.text || symbol.snippet;
      if (this.useStrictMatching) {
        return this.strictMatchScore(prefix, text);
      } else {
        return this.fuzzyMatchScore(prefix, text, cursorBufferRow, symbolBufferRow);
      }
    }
  }, {
    key: 'strictMatchScore',
    value: function strictMatchScore(prefix, text) {
      return {
        score: text.indexOf(prefix) === 0 ? 1 : 0,
        localityScore: 1
      };
    }
  }, {
    key: 'fuzzyMatchScore',
    value: function fuzzyMatchScore(prefix, text, cursorBufferRow, symbolBufferRow) {
      if (text == null || prefix[0].toLowerCase() !== text[0].toLowerCase()) {
        return { score: 0, localityScore: 0 };
      }

      var fuzzaldrinProvider = this.useAlternateScoring ? _fuzzaldrinPlus2['default'] : _fuzzaldrin2['default'];
      var score = fuzzaldrinProvider.score(text, prefix, { preparedQuery: this.prefixCache });
      var localityScore = this.getLocalityScore(cursorBufferRow, symbolBufferRow);
      return { score: score, localityScore: localityScore };
    }
  }, {
    key: 'getLocalityScore',
    value: function getLocalityScore(cursorBufferRow, symbolBufferRow) {
      if (!this.useLocalityBonus) {
        return 1;
      }

      var rowDifference = Math.abs(symbolBufferRow - cursorBufferRow);
      if (this.useAlternateScoring) {
        // Between 1 and 1 + strength. (here between 1.0 and 2.0)
        // Avoid a pow and a branching max.
        // 25 is the number of row where the bonus is 3/4 faded away.
        // strength is the factor in front of fade*fade. Here it is 1.0
        var fade = 25.0 / (25.0 + rowDifference);
        return 1.0 + fade * fade;
      } else {
        // Will be between 1 and ~2.75
        return 1 + Math.max(-Math.pow(0.2 * rowDifference - 3, 3) / 25 + 0.5, 0);
      }
    }
  }]);

  return SymbolStore;
})();

exports['default'] = SymbolStore;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N5bWJvbC1zdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OzRCQUk4RCxpQkFBaUI7OzBCQUN4RCxZQUFZOzs7OzhCQUNSLGlCQUFpQjs7Ozs4QkFDZCxpQkFBaUI7O0FBUC9DLFdBQVcsQ0FBQTs7QUFFWCxJQUFNLFdBQVcsR0FBRyxFQUFFLENBQUE7O0lBT2hCLE1BQU07QUFDRSxXQURSLE1BQU0sQ0FDRyxJQUFJLEVBQUUsTUFBTSxFQUFFOzBCQUR2QixNQUFNOztBQUVSLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLFFBQUksQ0FBQyxVQUFVLEdBQUcseUNBQXNCLE1BQU0sQ0FBQyxDQUFBO0dBQ2hEOztlQUpHLE1BQU07O1dBTVksK0JBQUMsTUFBTSxFQUFFO0FBQzdCLFVBQUksWUFBWSxHQUFHLElBQUksQ0FBQTtBQUN2QixVQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQzVCLFdBQUssSUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTsyQkFDTixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQXZDLFNBQVMsZ0JBQVQsU0FBUztZQUFFLFlBQVksZ0JBQVosWUFBWTs7QUFDNUIsWUFBSSxTQUFTLElBQUksSUFBSSxFQUFFLFNBQVE7QUFDL0IsWUFBSSxZQUFZLElBQUksSUFBSSxFQUFFLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDMUMsWUFBSSxZQUFZLEdBQUcsbUJBQW1CLElBQUksNENBQXlCLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7QUFDOUYsc0JBQVksR0FBRyxJQUFJLENBQUE7QUFDbkIsNkJBQW1CLEdBQUcsWUFBWSxDQUFBO1NBQ25DO09BQ0Y7O0FBRUQs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QUFnQixDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQTtBQUM3RSxhQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxhQUFhLEVBQWIsYUFBYSxFQUFDLENBQUE7S0FDOUI7OztXQUVnQiwwQkFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFO0FBQ2xELFVBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDMUIsZUFBTyxDQUFDLENBQUE7T0FDVDs7QUFFRCxVQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUMsQ0FBQTtBQUNqRSxVQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTs7Ozs7QUFLNUIsWUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxhQUFhLENBQUEsQUFBQyxDQUFBO0FBQzFDLGVBQU8sR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUE7T0FDekIsTUFBTTs7QUFFTCxlQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO09BQ3pFO0tBQ0Y7OztTQTdLa0IsV0FBVzs7O3FCQUFYLFdBQVciLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvc3ltYm9sLXN0b3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuY29uc3QgRU1QVFlfQVJSQVkgPSBbXVxuXG5pbXBvcnQge3NlbGVjdG9yc01hdGNoU2NvcGVDaGFpbiwgYnVpbGRTY29wZUNoYWluU3RyaW5nfSBmcm9tICcuL3Njb3BlLWhlbHBlcnMnXG5pbXBvcnQgZnV6emFsZHJpbiBmcm9tICdmdXp6YWxkcmluJ1xuaW1wb3J0IGZ1enphbGRyaW5QbHVzIGZyb20gJ2Z1enphbGRyaW4tcGx1cydcbmltcG9ydCB7c3BsaWNlV2l0aEFycmF5fSBmcm9tICd1bmRlcnNjb3JlLXBsdXMnXG5cbmNsYXNzIFN5bWJvbCB7XG4gIGNvbnN0cnVjdG9yICh0ZXh0LCBzY29wZXMpIHtcbiAgICB0aGlzLnRleHQgPSB0ZXh0XG4gICAgdGhpcy5zY29wZUNoYWluID0gYnVpbGRTY29wZUNoYWluU3RyaW5nKHNjb3BlcylcbiAgfVxuXG4gIG1hdGNoaW5nVHlwZUZvckNvbmZpZyAoY29uZmlnKSB7XG4gICAgbGV0IG1hdGNoaW5nVHlwZSA9IG51bGxcbiAgICBsZXQgaGlnaGVzdFR5cGVQcmlvcml0eSA9IC0xXG4gICAgZm9yIChjb25zdCB0eXBlIG9mIE9iamVjdC5rZXlzKGNvbmZpZykpIHtcbiAgICAgIGxldCB7c2VsZWN0b3JzLCB0eXBlUHJpb3JpdHl9ID0gY29uZmlnW3R5cGVdXG4gICAgICBpZiAoc2VsZWN0b3JzID09IG51bGwpIGNvbnRpbnVlXG4gICAgICBpZiAodHlwZVByaW9yaXR5ID09IG51bGwpIHR5cGVQcmlvcml0eSA9IDBcbiAgICAgIGlmICh0eXBlUHJpb3JpdHkgPiBoaWdoZXN0VHlwZVByaW9yaXR5ICYmIHNlbGVjdG9yc01hdGNoU2NvcGVDaGFpbihzZWxlY3RvcnMsIHRoaXMuc2NvcGVDaGFpbikpIHtcbiAgICAgICAgbWF0Y2hpbmdUeXBlID0gdHlwZVxuICAgICAgICBoaWdoZXN0VHlwZVByaW9yaXR5ID0gdHlwZVByaW9yaXR5XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoaW5nVHlwZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN5bWJvbFN0b3JlIHtcbiAgY29uc3RydWN0b3IgKHdvcmRSZWdleCkge1xuICAgIHRoaXMud29yZFJlZ2V4ID0gd29yZFJlZ2V4XG4gICAgdGhpcy5saW5lc0J5QnVmZmVyID0gbmV3IE1hcCgpXG4gIH1cblxuICBjbGVhciAoYnVmZmVyKSB7XG4gICAgaWYgKGJ1ZmZlcikge1xuICAgICAgdGhpcy5saW5lc0J5QnVmZmVyLmRlbGV0ZShidWZmZXIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGluZXNCeUJ1ZmZlci5jbGVhcigpXG4gICAgfVxuICB9XG5cbiAgc3ltYm9sc0ZvckNvbmZpZyAoY29uZmlnLCBidWZmZXJzLCBwcmVmaXgsIHdvcmRVbmRlckN1cnNvciwgY3Vyc29yQnVmZmVyUm93LCBudW1iZXJPZkN1cnNvcnMpIHtcbiAgICB0aGlzLnByZWZpeENhY2hlID0gZnV6emFsZHJpblBsdXMucHJlcGFyZVF1ZXJ5KHByZWZpeClcblxuICAgIGNvbnN0IGZpcnN0TGV0dGVyID0gcHJlZml4WzBdLnRvTG93ZXJDYXNlKClcbiAgICBjb25zdCBzeW1ib2xzQnlXb3JkID0gbmV3IE1hcCgpXG4gICAgY29uc3Qgd29yZE9jY3VycmVuY2VzID0gbmV3IE1hcCgpXG4gICAgY29uc3QgYnVpbHRpblN5bWJvbHNCeVdvcmQgPSBuZXcgU2V0KClcblxuICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gW11cbiAgICBmb3IgKGNvbnN0IHR5cGUgb2YgT2JqZWN0LmtleXMoY29uZmlnKSkge1xuICAgICAgY29uc3Qgc3ltYm9scyA9IGNvbmZpZ1t0eXBlXS5zdWdnZXN0aW9ucyB8fCBFTVBUWV9BUlJBWVxuICAgICAgZm9yIChjb25zdCBzeW1ib2wgb2Ygc3ltYm9scykge1xuICAgICAgICBjb25zdCB7c2NvcmV9ID0gdGhpcy5zY29yZVN5bWJvbChwcmVmaXgsIHN5bWJvbCwgY3Vyc29yQnVmZmVyUm93LCBOdW1iZXIuTUFYX1ZBTFVFKVxuICAgICAgICBpZiAoc2NvcmUgPiAwKSB7XG4gICAgICAgICAgc3ltYm9sLnJlcGxhY2VtZW50UHJlZml4ID0gcHJlZml4XG4gICAgICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7c3ltYm9sLCBzY29yZX0pXG4gICAgICAgICAgaWYgKHN5bWJvbC50ZXh0KSB7XG4gICAgICAgICAgICBidWlsdGluU3ltYm9sc0J5V29yZC5hZGQoc3ltYm9sLnRleHQpXG4gICAgICAgICAgfSBlbHNlIGlmIChzeW1ib2wuc25pcHBldCkge1xuICAgICAgICAgICAgYnVpbHRpblN5bWJvbHNCeVdvcmQuYWRkKHN5bWJvbC5zbmlwcGV0KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYnVmZmVyTGluZXMgb2YgdGhpcy5saW5lc0ZvckJ1ZmZlcnMoYnVmZmVycykpIHtcbiAgICAgIGxldCBzeW1ib2xCdWZmZXJSb3cgPSAwXG4gICAgICBmb3IgKGNvbnN0IGxpbmVTeW1ib2xzQnlMZXR0ZXIgb2YgYnVmZmVyTGluZXMpIHtcbiAgICAgICAgY29uc3Qgc3ltYm9scyA9IGxpbmVTeW1ib2xzQnlMZXR0ZXIuZ2V0KGZpcnN0TGV0dGVyKSB8fCBFTVBUWV9BUlJBWVxuICAgICAgICBmb3IgKGxldCBzeW1ib2wgb2Ygc3ltYm9scykge1xuICAgICAgICAgIHdvcmRPY2N1cnJlbmNlcy5zZXQoc3ltYm9sLnRleHQsICh3b3JkT2NjdXJyZW5jZXMuZ2V0KHN5bWJvbC50ZXh0KSB8fCAwKSArIDEpXG5cbiAgICAgICAgICBjb25zdCBzeW1ib2xGb3JXb3JkID0gc3ltYm9sc0J5V29yZC5nZXQoc3ltYm9sLnRleHQpXG4gICAgICAgICAgaWYgKHN5bWJvbEZvcldvcmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3ltYm9sRm9yV29yZC5sb2NhbGl0eVNjb3JlID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0TG9jYWxpdHlTY29yZShjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdyksXG4gICAgICAgICAgICAgIHN5bWJvbEZvcldvcmQubG9jYWxpdHlTY29yZVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0gZWxzZSBpZiAod29yZFVuZGVyQ3Vyc29yID09PSBzeW1ib2wudGV4dCAmJiB3b3JkT2NjdXJyZW5jZXMuZ2V0KHN5bWJvbC50ZXh0KSA8PSBudW1iZXJPZkN1cnNvcnMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHtzY29yZSwgbG9jYWxpdHlTY29yZX0gPSB0aGlzLnNjb3JlU3ltYm9sKHByZWZpeCwgc3ltYm9sLCBjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdylcbiAgICAgICAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHN5bWJvbC5tYXRjaGluZ1R5cGVGb3JDb25maWcoY29uZmlnKVxuICAgICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0ge3RleHQ6IHN5bWJvbC50ZXh0LCB0eXBlLCByZXBsYWNlbWVudFByZWZpeDogcHJlZml4fVxuICAgICAgICAgICAgICAgIGlmICghYnVpbHRpblN5bWJvbHNCeVdvcmQuaGFzKHN5bWJvbC50ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgc3ltYm9sc0J5V29yZC5zZXQoc3ltYm9sLnRleHQsIHtzeW1ib2wsIHNjb3JlLCBsb2NhbGl0eVNjb3JlfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzeW1ib2xCdWZmZXJSb3crK1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKHN5bWJvbHNCeVdvcmQudmFsdWVzKCkpLmNvbmNhdChzdWdnZXN0aW9ucylcbiAgfVxuXG4gIHJlY29tcHV0ZVN5bWJvbHNGb3JFZGl0b3JJbkJ1ZmZlclJhbmdlIChlZGl0b3IsIHN0YXJ0LCBvbGRFeHRlbnQsIG5ld0V4dGVudCkge1xuICAgIGNvbnN0IG5ld0VuZCA9IHN0YXJ0LnJvdyArIG5ld0V4dGVudC5yb3dcbiAgICBjb25zdCBuZXdMaW5lcyA9IFtdXG4gICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgY29uZGl0aW9uYWwgb25jZSBhdG9tL25zLXVzZS1kaXNwbGF5LWxheWVycyByZWFjaGVzIHN0YWJsZSBhbmQgZWRpdG9yLnRva2VuaXplZEJ1ZmZlciBpcyBhdmFpbGFibGVcbiAgICBjb25zdCB0b2tlbml6ZWRCdWZmZXIgPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyID8gZWRpdG9yLnRva2VuaXplZEJ1ZmZlciA6IGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlclxuXG4gICAgZm9yIChsZXQgYnVmZmVyUm93ID0gc3RhcnQucm93OyBidWZmZXJSb3cgPD0gbmV3RW5kOyBidWZmZXJSb3crKykge1xuICAgICAgY29uc3QgdG9rZW5pemVkTGluZSA9IHRva2VuaXplZEJ1ZmZlci50b2tlbml6ZWRMaW5lRm9yUm93KGJ1ZmZlclJvdylcbiAgICAgIGlmICh0b2tlbml6ZWRMaW5lID09IG51bGwpIGNvbnRpbnVlXG5cbiAgICAgIGNvbnN0IHN5bWJvbHNCeUxldHRlciA9IG5ldyBNYXAoKVxuICAgICAgY29uc3QgdG9rZW5JdGVyYXRvciA9IHRva2VuaXplZExpbmUuZ2V0VG9rZW5JdGVyYXRvcigpXG4gICAgICB3aGlsZSAodG9rZW5JdGVyYXRvci5uZXh0KCkpIHtcbiAgICAgICAgY29uc3Qgd29yZHNXaXRoaW5Ub2tlbiA9IHRva2VuSXRlcmF0b3IuZ2V0VGV4dCgpLm1hdGNoKHRoaXMud29yZFJlZ2V4KSB8fCBFTVBUWV9BUlJBWVxuICAgICAgICBmb3IgKGNvbnN0IHdvcmRXaXRoaW5Ub2tlbiBvZiB3b3Jkc1dpdGhpblRva2VuKSB7XG4gICAgICAgICAgY29uc3Qgc3ltYm9sID0gbmV3IFN5bWJvbCh3b3JkV2l0aGluVG9rZW4sIHRva2VuSXRlcmF0b3IuZ2V0U2NvcGVzKCkpXG4gICAgICAgICAgY29uc3QgZmlyc3RMZXR0ZXIgPSBzeW1ib2wudGV4dFswXS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgaWYgKCFzeW1ib2xzQnlMZXR0ZXIuaGFzKGZpcnN0TGV0dGVyKSkgc3ltYm9sc0J5TGV0dGVyLnNldChmaXJzdExldHRlciwgW10pXG4gICAgICAgICAgc3ltYm9sc0J5TGV0dGVyLmdldChmaXJzdExldHRlcikucHVzaChzeW1ib2wpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbmV3TGluZXMucHVzaChzeW1ib2xzQnlMZXR0ZXIpXG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyTGluZXMgPSB0aGlzLmxpbmVzRm9yQnVmZmVyKGVkaXRvci5nZXRCdWZmZXIoKSlcbiAgICBzcGxpY2VXaXRoQXJyYXkoYnVmZmVyTGluZXMsIHN0YXJ0LnJvdywgb2xkRXh0ZW50LnJvdyArIDEsIG5ld0xpbmVzKVxuICB9XG5cbiAgbGluZXNGb3JCdWZmZXJzIChidWZmZXJzKSB7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMgfHwgQXJyYXkuZnJvbSh0aGlzLmxpbmVzQnlCdWZmZXIua2V5cygpKVxuICAgIHJldHVybiBidWZmZXJzLm1hcChidWZmZXIgPT4gdGhpcy5saW5lc0ZvckJ1ZmZlcihidWZmZXIpKVxuICB9XG5cbiAgbGluZXNGb3JCdWZmZXIgKGJ1ZmZlcikge1xuICAgIGlmICghdGhpcy5saW5lc0J5QnVmZmVyLmhhcyhidWZmZXIpKSB7XG4gICAgICB0aGlzLmxpbmVzQnlCdWZmZXIuc2V0KGJ1ZmZlciwgW10pXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubGluZXNCeUJ1ZmZlci5nZXQoYnVmZmVyKVxuICB9XG5cbiAgc2V0VXNlQWx0ZXJuYXRlU2NvcmluZyAodXNlQWx0ZXJuYXRlU2NvcmluZykge1xuICAgIHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZyA9IHVzZUFsdGVybmF0ZVNjb3JpbmdcbiAgfVxuXG4gIHNldFVzZUxvY2FsaXR5Qm9udXMgKHVzZUxvY2FsaXR5Qm9udXMpIHtcbiAgICB0aGlzLnVzZUxvY2FsaXR5Qm9udXMgPSB1c2VMb2NhbGl0eUJvbnVzXG4gIH1cblxuICBzZXRVc2VTdHJpY3RNYXRjaGluZyAodXNlU3RyaWN0TWF0Y2hpbmcpIHtcbiAgICB0aGlzLnVzZVN0cmljdE1hdGNoaW5nID0gdXNlU3RyaWN0TWF0Y2hpbmdcbiAgfVxuXG4gIHNjb3JlU3ltYm9sIChwcmVmaXgsIHN5bWJvbCwgY3Vyc29yQnVmZmVyUm93LCBzeW1ib2xCdWZmZXJSb3cpIHtcbiAgICBjb25zdCB0ZXh0ID0gc3ltYm9sLnRleHQgfHwgc3ltYm9sLnNuaXBwZXRcbiAgICBpZiAodGhpcy51c2VTdHJpY3RNYXRjaGluZykge1xuICAgICAgcmV0dXJuIHRoaXMuc3RyaWN0TWF0Y2hTY29yZShwcmVmaXgsIHRleHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmZ1enp5TWF0Y2hTY29yZShwcmVmaXgsIHRleHQsIGN1cnNvckJ1ZmZlclJvdywgc3ltYm9sQnVmZmVyUm93KVxuICAgIH1cbiAgfVxuXG4gIHN0cmljdE1hdGNoU2NvcmUgKHByZWZpeCwgdGV4dCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29yZTogdGV4dC5pbmRleE9mKHByZWZpeCkgPT09IDAgPyAxIDogMCxcbiAgICAgIGxvY2FsaXR5U2NvcmU6IDFcbiAgICB9XG4gIH1cblxuICBmdXp6eU1hdGNoU2NvcmUgKHByZWZpeCwgdGV4dCwgY3Vyc29yQnVmZmVyUm93LCBzeW1ib2xCdWZmZXJSb3cpIHtcbiAgICBpZiAodGV4dCA9PSBudWxsIHx8IHByZWZpeFswXS50b0xvd2VyQ2FzZSgpICE9PSB0ZXh0WzBdLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIHJldHVybiB7c2NvcmU6IDAsIGxvY2FsaXR5U2NvcmU6IDB9XG4gICAgfVxuXG4gICAgY29uc3QgZnV6emFsZHJpblByb3ZpZGVyID0gdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID8gZnV6emFsZHJpblBsdXMgOiBmdXp6YWxkcmluXG4gICAgY29uc3Qgc2NvcmUgPSBmdXp6YWxkcmluUHJvdmlkZXIuc2NvcmUodGV4dCwgcHJlZml4LCB7IHByZXBhcmVkUXVlcnk6IHRoaXMucHJlZml4Q2FjaGUgfSlcbiAgICBjb25zdCBsb2NhbGl0eVNjb3JlID0gdGhpcy5nZXRMb2NhbGl0eVNjb3JlKGN1cnNvckJ1ZmZlclJvdywgc3ltYm9sQnVmZmVyUm93KVxuICAgIHJldHVybiB7c2NvcmUsIGxvY2FsaXR5U2NvcmV9XG4gIH1cblxuICBnZXRMb2NhbGl0eVNjb3JlIChjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdykge1xuICAgIGlmICghdGhpcy51c2VMb2NhbGl0eUJvbnVzKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGNvbnN0IHJvd0RpZmZlcmVuY2UgPSBNYXRoLmFicyhzeW1ib2xCdWZmZXJSb3cgLSBjdXJzb3JCdWZmZXJSb3cpXG4gICAgaWYgKHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZykge1xuICAgICAgLy8gQmV0d2VlbiAxIGFuZCAxICsgc3RyZW5ndGguIChoZXJlIGJldHdlZW4gMS4wIGFuZCAyLjApXG4gICAgICAvLyBBdm9pZCBhIHBvdyBhbmQgYSBicmFuY2hpbmcgbWF4LlxuICAgICAgLy8gMjUgaXMgdGhlIG51bWJlciBvZiByb3cgd2hlcmUgdGhlIGJvbnVzIGlzIDMvNCBmYWRlZCBhd2F5LlxuICAgICAgLy8gc3RyZW5ndGggaXMgdGhlIGZhY3RvciBpbiBmcm9udCBvZiBmYWRlKmZhZGUuIEhlcmUgaXQgaXMgMS4wXG4gICAgICBjb25zdCBmYWRlID0gMjUuMCAvICgyNS4wICsgcm93RGlmZmVyZW5jZSlcbiAgICAgIHJldHVybiAxLjAgKyBmYWRlICogZmFkZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaWxsIGJlIGJldHdlZW4gMSBhbmQgfjIuNzVcbiAgICAgIHJldHVybiAxICsgTWF0aC5tYXgoLU1hdGgucG93KDAuMiAqIHJvd0RpZmZlcmVuY2UgLSAzLCAzKSAvIDI1ICsgMC41LCAwKVxuICAgIH1cbiAgfVxufVxuIl19