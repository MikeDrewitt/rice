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
      this.prefixCache = _fuzzaldrinPlus2['default'].prepQuery(prefix);

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
      var score = fuzzaldrinProvider.score(text, prefix, this.prefixCache);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtcGx1cy9saWIvc3ltYm9sLXN0b3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7NEJBSThELGlCQUFpQjs7MEJBQ3hELFlBQVk7Ozs7OEJBQ1IsaUJBQWlCOzs7OzhCQUNkLGlCQUFpQjs7QUFQL0MsV0FBVyxDQUFBOztBQUVYLElBQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQTs7SUFPaEIsTUFBTTtBQUNFLFdBRFIsTUFBTSxDQUNHLElBQUksRUFBRSxNQUFNLEVBQUU7MEJBRHZCLE1BQU07O0FBRVIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7QUFDaEIsUUFBSSxDQUFDLFVBQVUsR0FBRyx5Q0FBc0IsTUFBTSxDQUFDLENBQUE7R0FDaEQ7O2VBSkcsTUFBTTs7V0FNWSwrQkFBQyxNQUFNLEVBQUU7QUFDN0IsVUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFBO0FBQ3ZCLFVBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDNUIsV0FBSyxJQUFNLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFOzJCQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFBdkMsU0FBUyxnQkFBVCxTQUFTO1lBQUUsWUFBWSxnQkFBWixZQUFZOztBQUM1QixZQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUUsU0FBUTtBQUMvQixZQUFJLFlBQVksSUFBSSxJQUFJLEVBQUUsWUFBWSxHQUFHLENBQUMsQ0FBQTtBQUMxQyxZQUFJLFlBQVksR0FBRyxtQkFBbUIsSUFBSSw0Q0FBeUIsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUM5RixzQkFBWSxHQUFHLElBQUksQ0FBQTtBQUNuQiw2QkFBbUIsR0FBRyxZQUFZLENBQUE7U0FD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QUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQTtBQUM3RSxhQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxhQUFhLEVBQWIsYUFBYSxFQUFDLENBQUE7S0FDOUI7OztXQUVnQiwwQkFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFO0FBQ2xELFVBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDMUIsZUFBTyxDQUFDLENBQUE7T0FDVDs7QUFFRCxVQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUMsQ0FBQTtBQUNqRSxVQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTs7Ozs7QUFLNUIsWUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxhQUFhLENBQUEsQUFBQyxDQUFBO0FBQzFDLGVBQU8sR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUE7T0FDekIsTUFBTTs7QUFFTCxlQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO09BQ3pFO0tBQ0Y7OztTQTdLa0IsV0FBVzs7O3FCQUFYLFdBQVciLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9zeW1ib2wtc3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5jb25zdCBFTVBUWV9BUlJBWSA9IFtdXG5cbmltcG9ydCB7c2VsZWN0b3JzTWF0Y2hTY29wZUNoYWluLCBidWlsZFNjb3BlQ2hhaW5TdHJpbmd9IGZyb20gJy4vc2NvcGUtaGVscGVycydcbmltcG9ydCBmdXp6YWxkcmluIGZyb20gJ2Z1enphbGRyaW4nXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuaW1wb3J0IHtzcGxpY2VXaXRoQXJyYXl9IGZyb20gJ3VuZGVyc2NvcmUtcGx1cydcblxuY2xhc3MgU3ltYm9sIHtcbiAgY29uc3RydWN0b3IgKHRleHQsIHNjb3Blcykge1xuICAgIHRoaXMudGV4dCA9IHRleHRcbiAgICB0aGlzLnNjb3BlQ2hhaW4gPSBidWlsZFNjb3BlQ2hhaW5TdHJpbmcoc2NvcGVzKVxuICB9XG5cbiAgbWF0Y2hpbmdUeXBlRm9yQ29uZmlnIChjb25maWcpIHtcbiAgICBsZXQgbWF0Y2hpbmdUeXBlID0gbnVsbFxuICAgIGxldCBoaWdoZXN0VHlwZVByaW9yaXR5ID0gLTFcbiAgICBmb3IgKGNvbnN0IHR5cGUgb2YgT2JqZWN0LmtleXMoY29uZmlnKSkge1xuICAgICAgbGV0IHtzZWxlY3RvcnMsIHR5cGVQcmlvcml0eX0gPSBjb25maWdbdHlwZV1cbiAgICAgIGlmIChzZWxlY3RvcnMgPT0gbnVsbCkgY29udGludWVcbiAgICAgIGlmICh0eXBlUHJpb3JpdHkgPT0gbnVsbCkgdHlwZVByaW9yaXR5ID0gMFxuICAgICAgaWYgKHR5cGVQcmlvcml0eSA+IGhpZ2hlc3RUeXBlUHJpb3JpdHkgJiYgc2VsZWN0b3JzTWF0Y2hTY29wZUNoYWluKHNlbGVjdG9ycywgdGhpcy5zY29wZUNoYWluKSkge1xuICAgICAgICBtYXRjaGluZ1R5cGUgPSB0eXBlXG4gICAgICAgIGhpZ2hlc3RUeXBlUHJpb3JpdHkgPSB0eXBlUHJpb3JpdHlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hpbmdUeXBlXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3ltYm9sU3RvcmUge1xuICBjb25zdHJ1Y3RvciAod29yZFJlZ2V4KSB7XG4gICAgdGhpcy53b3JkUmVnZXggPSB3b3JkUmVnZXhcbiAgICB0aGlzLmxpbmVzQnlCdWZmZXIgPSBuZXcgTWFwKClcbiAgfVxuXG4gIGNsZWFyIChidWZmZXIpIHtcbiAgICBpZiAoYnVmZmVyKSB7XG4gICAgICB0aGlzLmxpbmVzQnlCdWZmZXIuZGVsZXRlKGJ1ZmZlcilcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saW5lc0J5QnVmZmVyLmNsZWFyKClcbiAgICB9XG4gIH1cblxuICBzeW1ib2xzRm9yQ29uZmlnIChjb25maWcsIGJ1ZmZlcnMsIHByZWZpeCwgd29yZFVuZGVyQ3Vyc29yLCBjdXJzb3JCdWZmZXJSb3csIG51bWJlck9mQ3Vyc29ycykge1xuICAgIHRoaXMucHJlZml4Q2FjaGUgPSBmdXp6YWxkcmluUGx1cy5wcmVwUXVlcnkocHJlZml4KVxuXG4gICAgY29uc3QgZmlyc3RMZXR0ZXIgPSBwcmVmaXhbMF0udG9Mb3dlckNhc2UoKVxuICAgIGNvbnN0IHN5bWJvbHNCeVdvcmQgPSBuZXcgTWFwKClcbiAgICBjb25zdCB3b3JkT2NjdXJyZW5jZXMgPSBuZXcgTWFwKClcbiAgICBjb25zdCBidWlsdGluU3ltYm9sc0J5V29yZCA9IG5ldyBTZXQoKVxuXG4gICAgY29uc3Qgc3VnZ2VzdGlvbnMgPSBbXVxuICAgIGZvciAoY29uc3QgdHlwZSBvZiBPYmplY3Qua2V5cyhjb25maWcpKSB7XG4gICAgICBjb25zdCBzeW1ib2xzID0gY29uZmlnW3R5cGVdLnN1Z2dlc3Rpb25zIHx8IEVNUFRZX0FSUkFZXG4gICAgICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBzeW1ib2xzKSB7XG4gICAgICAgIGNvbnN0IHtzY29yZX0gPSB0aGlzLnNjb3JlU3ltYm9sKHByZWZpeCwgc3ltYm9sLCBjdXJzb3JCdWZmZXJSb3csIE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgICBzeW1ib2wucmVwbGFjZW1lbnRQcmVmaXggPSBwcmVmaXhcbiAgICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHtzeW1ib2wsIHNjb3JlfSlcbiAgICAgICAgICBpZiAoc3ltYm9sLnRleHQpIHtcbiAgICAgICAgICAgIGJ1aWx0aW5TeW1ib2xzQnlXb3JkLmFkZChzeW1ib2wudGV4dClcbiAgICAgICAgICB9IGVsc2UgaWYgKHN5bWJvbC5zbmlwcGV0KSB7XG4gICAgICAgICAgICBidWlsdGluU3ltYm9sc0J5V29yZC5hZGQoc3ltYm9sLnNuaXBwZXQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBidWZmZXJMaW5lcyBvZiB0aGlzLmxpbmVzRm9yQnVmZmVycyhidWZmZXJzKSkge1xuICAgICAgbGV0IHN5bWJvbEJ1ZmZlclJvdyA9IDBcbiAgICAgIGZvciAoY29uc3QgbGluZVN5bWJvbHNCeUxldHRlciBvZiBidWZmZXJMaW5lcykge1xuICAgICAgICBjb25zdCBzeW1ib2xzID0gbGluZVN5bWJvbHNCeUxldHRlci5nZXQoZmlyc3RMZXR0ZXIpIHx8IEVNUFRZX0FSUkFZXG4gICAgICAgIGZvciAobGV0IHN5bWJvbCBvZiBzeW1ib2xzKSB7XG4gICAgICAgICAgd29yZE9jY3VycmVuY2VzLnNldChzeW1ib2wudGV4dCwgKHdvcmRPY2N1cnJlbmNlcy5nZXQoc3ltYm9sLnRleHQpIHx8IDApICsgMSlcblxuICAgICAgICAgIGNvbnN0IHN5bWJvbEZvcldvcmQgPSBzeW1ib2xzQnlXb3JkLmdldChzeW1ib2wudGV4dClcbiAgICAgICAgICBpZiAoc3ltYm9sRm9yV29yZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBzeW1ib2xGb3JXb3JkLmxvY2FsaXR5U2NvcmUgPSBNYXRoLm1heChcbiAgICAgICAgICAgICAgdGhpcy5nZXRMb2NhbGl0eVNjb3JlKGN1cnNvckJ1ZmZlclJvdywgc3ltYm9sQnVmZmVyUm93KSxcbiAgICAgICAgICAgICAgc3ltYm9sRm9yV29yZC5sb2NhbGl0eVNjb3JlXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSBlbHNlIGlmICh3b3JkVW5kZXJDdXJzb3IgPT09IHN5bWJvbC50ZXh0ICYmIHdvcmRPY2N1cnJlbmNlcy5nZXQoc3ltYm9sLnRleHQpIDw9IG51bWJlck9mQ3Vyc29ycykge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qge3Njb3JlLCBsb2NhbGl0eVNjb3JlfSA9IHRoaXMuc2NvcmVTeW1ib2wocHJlZml4LCBzeW1ib2wsIGN1cnNvckJ1ZmZlclJvdywgc3ltYm9sQnVmZmVyUm93KVxuICAgICAgICAgICAgaWYgKHNjb3JlID4gMCkge1xuICAgICAgICAgICAgICBjb25zdCB0eXBlID0gc3ltYm9sLm1hdGNoaW5nVHlwZUZvckNvbmZpZyhjb25maWcpXG4gICAgICAgICAgICAgIGlmICh0eXBlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSB7dGV4dDogc3ltYm9sLnRleHQsIHR5cGUsIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXh9XG4gICAgICAgICAgICAgICAgaWYgKCFidWlsdGluU3ltYm9sc0J5V29yZC5oYXMoc3ltYm9sLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICBzeW1ib2xzQnlXb3JkLnNldChzeW1ib2wudGV4dCwge3N5bWJvbCwgc2NvcmUsIGxvY2FsaXR5U2NvcmV9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN5bWJvbEJ1ZmZlclJvdysrXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oc3ltYm9sc0J5V29yZC52YWx1ZXMoKSkuY29uY2F0KHN1Z2dlc3Rpb25zKVxuICB9XG5cbiAgcmVjb21wdXRlU3ltYm9sc0ZvckVkaXRvckluQnVmZmVyUmFuZ2UgKGVkaXRvciwgc3RhcnQsIG9sZEV4dGVudCwgbmV3RXh0ZW50KSB7XG4gICAgY29uc3QgbmV3RW5kID0gc3RhcnQucm93ICsgbmV3RXh0ZW50LnJvd1xuICAgIGNvbnN0IG5ld0xpbmVzID0gW11cbiAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBjb25kaXRpb25hbCBvbmNlIGF0b20vbnMtdXNlLWRpc3BsYXktbGF5ZXJzIHJlYWNoZXMgc3RhYmxlIGFuZCBlZGl0b3IudG9rZW5pemVkQnVmZmVyIGlzIGF2YWlsYWJsZVxuICAgIGNvbnN0IHRva2VuaXplZEJ1ZmZlciA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXIgPyBlZGl0b3IudG9rZW5pemVkQnVmZmVyIDogZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyXG5cbiAgICBmb3IgKGxldCBidWZmZXJSb3cgPSBzdGFydC5yb3c7IGJ1ZmZlclJvdyA8PSBuZXdFbmQ7IGJ1ZmZlclJvdysrKSB7XG4gICAgICBjb25zdCB0b2tlbml6ZWRMaW5lID0gdG9rZW5pemVkQnVmZmVyLnRva2VuaXplZExpbmVGb3JSb3coYnVmZmVyUm93KVxuICAgICAgaWYgKHRva2VuaXplZExpbmUgPT0gbnVsbCkgY29udGludWVcblxuICAgICAgY29uc3Qgc3ltYm9sc0J5TGV0dGVyID0gbmV3IE1hcCgpXG4gICAgICBjb25zdCB0b2tlbkl0ZXJhdG9yID0gdG9rZW5pemVkTGluZS5nZXRUb2tlbkl0ZXJhdG9yKClcbiAgICAgIHdoaWxlICh0b2tlbkl0ZXJhdG9yLm5leHQoKSkge1xuICAgICAgICBjb25zdCB3b3Jkc1dpdGhpblRva2VuID0gdG9rZW5JdGVyYXRvci5nZXRUZXh0KCkubWF0Y2godGhpcy53b3JkUmVnZXgpIHx8IEVNUFRZX0FSUkFZXG4gICAgICAgIGZvciAoY29uc3Qgd29yZFdpdGhpblRva2VuIG9mIHdvcmRzV2l0aGluVG9rZW4pIHtcbiAgICAgICAgICBjb25zdCBzeW1ib2wgPSBuZXcgU3ltYm9sKHdvcmRXaXRoaW5Ub2tlbiwgdG9rZW5JdGVyYXRvci5nZXRTY29wZXMoKSlcbiAgICAgICAgICBjb25zdCBmaXJzdExldHRlciA9IHN5bWJvbC50ZXh0WzBdLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICBpZiAoIXN5bWJvbHNCeUxldHRlci5oYXMoZmlyc3RMZXR0ZXIpKSBzeW1ib2xzQnlMZXR0ZXIuc2V0KGZpcnN0TGV0dGVyLCBbXSlcbiAgICAgICAgICBzeW1ib2xzQnlMZXR0ZXIuZ2V0KGZpcnN0TGV0dGVyKS5wdXNoKHN5bWJvbClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBuZXdMaW5lcy5wdXNoKHN5bWJvbHNCeUxldHRlcilcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXJMaW5lcyA9IHRoaXMubGluZXNGb3JCdWZmZXIoZWRpdG9yLmdldEJ1ZmZlcigpKVxuICAgIHNwbGljZVdpdGhBcnJheShidWZmZXJMaW5lcywgc3RhcnQucm93LCBvbGRFeHRlbnQucm93ICsgMSwgbmV3TGluZXMpXG4gIH1cblxuICBsaW5lc0ZvckJ1ZmZlcnMgKGJ1ZmZlcnMpIHtcbiAgICBidWZmZXJzID0gYnVmZmVycyB8fCBBcnJheS5mcm9tKHRoaXMubGluZXNCeUJ1ZmZlci5rZXlzKCkpXG4gICAgcmV0dXJuIGJ1ZmZlcnMubWFwKGJ1ZmZlciA9PiB0aGlzLmxpbmVzRm9yQnVmZmVyKGJ1ZmZlcikpXG4gIH1cblxuICBsaW5lc0ZvckJ1ZmZlciAoYnVmZmVyKSB7XG4gICAgaWYgKCF0aGlzLmxpbmVzQnlCdWZmZXIuaGFzKGJ1ZmZlcikpIHtcbiAgICAgIHRoaXMubGluZXNCeUJ1ZmZlci5zZXQoYnVmZmVyLCBbXSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5saW5lc0J5QnVmZmVyLmdldChidWZmZXIpXG4gIH1cblxuICBzZXRVc2VBbHRlcm5hdGVTY29yaW5nICh1c2VBbHRlcm5hdGVTY29yaW5nKSB7XG4gICAgdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID0gdXNlQWx0ZXJuYXRlU2NvcmluZ1xuICB9XG5cbiAgc2V0VXNlTG9jYWxpdHlCb251cyAodXNlTG9jYWxpdHlCb251cykge1xuICAgIHRoaXMudXNlTG9jYWxpdHlCb251cyA9IHVzZUxvY2FsaXR5Qm9udXNcbiAgfVxuXG4gIHNldFVzZVN0cmljdE1hdGNoaW5nICh1c2VTdHJpY3RNYXRjaGluZykge1xuICAgIHRoaXMudXNlU3RyaWN0TWF0Y2hpbmcgPSB1c2VTdHJpY3RNYXRjaGluZ1xuICB9XG5cbiAgc2NvcmVTeW1ib2wgKHByZWZpeCwgc3ltYm9sLCBjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdykge1xuICAgIGNvbnN0IHRleHQgPSBzeW1ib2wudGV4dCB8fCBzeW1ib2wuc25pcHBldFxuICAgIGlmICh0aGlzLnVzZVN0cmljdE1hdGNoaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdHJpY3RNYXRjaFNjb3JlKHByZWZpeCwgdGV4dClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZnV6enlNYXRjaFNjb3JlKHByZWZpeCwgdGV4dCwgY3Vyc29yQnVmZmVyUm93LCBzeW1ib2xCdWZmZXJSb3cpXG4gICAgfVxuICB9XG5cbiAgc3RyaWN0TWF0Y2hTY29yZSAocHJlZml4LCB0ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3JlOiB0ZXh0LmluZGV4T2YocHJlZml4KSA9PT0gMCA/IDEgOiAwLFxuICAgICAgbG9jYWxpdHlTY29yZTogMVxuICAgIH1cbiAgfVxuXG4gIGZ1enp5TWF0Y2hTY29yZSAocHJlZml4LCB0ZXh0LCBjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdykge1xuICAgIGlmICh0ZXh0ID09IG51bGwgfHwgcHJlZml4WzBdLnRvTG93ZXJDYXNlKCkgIT09IHRleHRbMF0udG9Mb3dlckNhc2UoKSkge1xuICAgICAgcmV0dXJuIHtzY29yZTogMCwgbG9jYWxpdHlTY29yZTogMH1cbiAgICB9XG5cbiAgICBjb25zdCBmdXp6YWxkcmluUHJvdmlkZXIgPSB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPyBmdXp6YWxkcmluUGx1cyA6IGZ1enphbGRyaW5cbiAgICBjb25zdCBzY29yZSA9IGZ1enphbGRyaW5Qcm92aWRlci5zY29yZSh0ZXh0LCBwcmVmaXgsIHRoaXMucHJlZml4Q2FjaGUpXG4gICAgY29uc3QgbG9jYWxpdHlTY29yZSA9IHRoaXMuZ2V0TG9jYWxpdHlTY29yZShjdXJzb3JCdWZmZXJSb3csIHN5bWJvbEJ1ZmZlclJvdylcbiAgICByZXR1cm4ge3Njb3JlLCBsb2NhbGl0eVNjb3JlfVxuICB9XG5cbiAgZ2V0TG9jYWxpdHlTY29yZSAoY3Vyc29yQnVmZmVyUm93LCBzeW1ib2xCdWZmZXJSb3cpIHtcbiAgICBpZiAoIXRoaXMudXNlTG9jYWxpdHlCb251cykge1xuICAgICAgcmV0dXJuIDFcbiAgICB9XG5cbiAgICBjb25zdCByb3dEaWZmZXJlbmNlID0gTWF0aC5hYnMoc3ltYm9sQnVmZmVyUm93IC0gY3Vyc29yQnVmZmVyUm93KVxuICAgIGlmICh0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcpIHtcbiAgICAgIC8vIEJldHdlZW4gMSBhbmQgMSArIHN0cmVuZ3RoLiAoaGVyZSBiZXR3ZWVuIDEuMCBhbmQgMi4wKVxuICAgICAgLy8gQXZvaWQgYSBwb3cgYW5kIGEgYnJhbmNoaW5nIG1heC5cbiAgICAgIC8vIDI1IGlzIHRoZSBudW1iZXIgb2Ygcm93IHdoZXJlIHRoZSBib251cyBpcyAzLzQgZmFkZWQgYXdheS5cbiAgICAgIC8vIHN0cmVuZ3RoIGlzIHRoZSBmYWN0b3IgaW4gZnJvbnQgb2YgZmFkZSpmYWRlLiBIZXJlIGl0IGlzIDEuMFxuICAgICAgY29uc3QgZmFkZSA9IDI1LjAgLyAoMjUuMCArIHJvd0RpZmZlcmVuY2UpXG4gICAgICByZXR1cm4gMS4wICsgZmFkZSAqIGZhZGVcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2lsbCBiZSBiZXR3ZWVuIDEgYW5kIH4yLjc1XG4gICAgICByZXR1cm4gMSArIE1hdGgubWF4KC1NYXRoLnBvdygwLjIgKiByb3dEaWZmZXJlbmNlIC0gMywgMykgLyAyNSArIDAuNSwgMClcbiAgICB9XG4gIH1cbn1cbiJdfQ==