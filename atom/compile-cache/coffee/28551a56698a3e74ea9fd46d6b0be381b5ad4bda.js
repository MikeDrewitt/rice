(function() {
  var BracketMatcherView, CompositeDisposable, Range, SelectorCache, TagFinder, _, endPair, endPairMatches, pairRegexes, startPair, startPairMatches,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  Range = require('atom').Range;

  TagFinder = require('./tag-finder');

  SelectorCache = require('./selector-cache');

  startPairMatches = {
    '(': ')',
    '[': ']',
    '{': '}'
  };

  endPairMatches = {
    ')': '(',
    ']': '[',
    '}': '{'
  };

  pairRegexes = {};

  for (startPair in startPairMatches) {
    endPair = startPairMatches[startPair];
    pairRegexes[startPair] = new RegExp("[" + (_.escapeRegExp(startPair + endPair)) + "]", 'g');
  }

  module.exports = BracketMatcherView = (function() {
    function BracketMatcherView(editor, editorElement) {
      this.editor = editor;
      this.updateMatch = bind(this.updateMatch, this);
      this.destroy = bind(this.destroy, this);
      this.subscriptions = new CompositeDisposable;
      this.tagFinder = new TagFinder(this.editor);
      this.pairHighlighted = false;
      this.tagHighlighted = false;
      this.commentOrStringSelector = SelectorCache.get('comment.* | string.*');
      this.subscriptions.add(this.editor.onDidTokenize(this.updateMatch));
      this.subscriptions.add(this.editor.getBuffer().onDidChangeText(this.updateMatch));
      this.subscriptions.add(this.editor.onDidChangeGrammar(this.updateMatch));
      this.subscriptions.add(this.editor.onDidChangeSelectionRange(this.updateMatch));
      this.subscriptions.add(this.editor.onDidAddCursor(this.updateMatch));
      this.subscriptions.add(this.editor.onDidRemoveCursor(this.updateMatch));
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:go-to-matching-bracket', (function(_this) {
        return function() {
          return _this.goToMatchingPair();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:go-to-enclosing-bracket', (function(_this) {
        return function() {
          return _this.goToEnclosingPair();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:select-inside-brackets', (function(_this) {
        return function() {
          return _this.selectInsidePair();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:close-tag', (function(_this) {
        return function() {
          return _this.closeTag();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:remove-matching-brackets', (function(_this) {
        return function() {
          return _this.removeMatchingBrackets();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy));
      this.updateMatch();
    }

    BracketMatcherView.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    BracketMatcherView.prototype.updateMatch = function() {
      var currentPair, matchPosition, matchingPair, pair, position, ref, ref1;
      if (this.pairHighlighted) {
        this.editor.destroyMarker(this.startMarker.id);
        this.editor.destroyMarker(this.endMarker.id);
      }
      this.pairHighlighted = false;
      this.tagHighlighted = false;
      if (!this.editor.getLastSelection().isEmpty()) {
        return;
      }
      if (this.editor.isFoldedAtCursorRow()) {
        return;
      }
      if (this.isCursorOnCommentOrString()) {
        return;
      }
      ref = this.findCurrentPair(startPairMatches), position = ref.position, currentPair = ref.currentPair, matchingPair = ref.matchingPair;
      if (position) {
        matchPosition = this.findMatchingEndPair(position, currentPair, matchingPair);
      } else {
        ref1 = this.findCurrentPair(endPairMatches), position = ref1.position, currentPair = ref1.currentPair, matchingPair = ref1.matchingPair;
        if (position) {
          matchPosition = this.findMatchingStartPair(position, matchingPair, currentPair);
        }
      }
      if ((position != null) && (matchPosition != null)) {
        this.startMarker = this.createMarker([position, position.traverse([0, 1])]);
        this.endMarker = this.createMarker([matchPosition, matchPosition.traverse([0, 1])]);
        return this.pairHighlighted = true;
      } else {
        if (pair = this.tagFinder.findMatchingTags()) {
          this.startMarker = this.createMarker(pair.startRange);
          this.endMarker = this.createMarker(pair.endRange);
          this.pairHighlighted = true;
          return this.tagHighlighted = true;
        }
      }
    };

    BracketMatcherView.prototype.removeMatchingBrackets = function() {
      if (this.editor.hasMultipleCursors()) {
        return this.editor.backspace();
      }
      return this.editor.transact((function(_this) {
        return function() {
          var currentPair, matchPosition, matchingPair, position, ref, ref1, text;
          if (_this.editor.getLastSelection().isEmpty()) {
            _this.editor.selectLeft();
          }
          text = _this.editor.getSelectedText();
          if (startPairMatches.hasOwnProperty(text) || endPairMatches.hasOwnProperty(text)) {
            ref = _this.findCurrentPair(startPairMatches), position = ref.position, currentPair = ref.currentPair, matchingPair = ref.matchingPair;
            if (position) {
              matchPosition = _this.findMatchingEndPair(position, currentPair, matchingPair);
            } else {
              ref1 = _this.findCurrentPair(endPairMatches), position = ref1.position, currentPair = ref1.currentPair, matchingPair = ref1.matchingPair;
              if (position) {
                matchPosition = _this.findMatchingStartPair(position, matchingPair, currentPair);
              }
            }
            if ((position != null) && (matchPosition != null)) {
              _this.editor.setCursorBufferPosition(matchPosition);
              _this.editor["delete"]();
              if (position.row === matchPosition.row && endPairMatches.hasOwnProperty(currentPair)) {
                position = position.traverse([0, -1]);
              }
              _this.editor.setCursorBufferPosition(position);
              return _this.editor["delete"]();
            } else {
              return _this.editor.backspace();
            }
          } else {
            return _this.editor.backspace();
          }
        };
      })(this));
    };

    BracketMatcherView.prototype.findMatchingEndPair = function(startPairPosition, startPair, endPair) {
      var endPairPosition, scanRange, unpairedCount;
      scanRange = new Range(startPairPosition.traverse([0, 1]), this.editor.buffer.getEndPosition());
      endPairPosition = null;
      unpairedCount = 0;
      this.editor.scanInBufferRange(pairRegexes[startPair], scanRange, (function(_this) {
        return function(result) {
          if (_this.isRangeCommentedOrString(result.range)) {
            return;
          }
          switch (result.match[0]) {
            case startPair:
              return unpairedCount++;
            case endPair:
              unpairedCount--;
              if (unpairedCount < 0) {
                endPairPosition = result.range.start;
                return result.stop();
              }
          }
        };
      })(this));
      return endPairPosition;
    };

    BracketMatcherView.prototype.findMatchingStartPair = function(endPairPosition, startPair, endPair) {
      var scanRange, startPairPosition, unpairedCount;
      scanRange = new Range([0, 0], endPairPosition);
      startPairPosition = null;
      unpairedCount = 0;
      this.editor.backwardsScanInBufferRange(pairRegexes[startPair], scanRange, (function(_this) {
        return function(result) {
          if (_this.isRangeCommentedOrString(result.range)) {
            return;
          }
          switch (result.match[0]) {
            case startPair:
              unpairedCount--;
              if (unpairedCount < 0) {
                startPairPosition = result.range.start;
                return result.stop();
              }
              break;
            case endPair:
              return unpairedCount++;
          }
        };
      })(this));
      return startPairPosition;
    };

    BracketMatcherView.prototype.findAnyStartPair = function(cursorPosition) {
      var combinedRegExp, endPairRegExp, scanRange, startPairRegExp, startPosition, unpairedCount;
      scanRange = new Range([0, 0], cursorPosition);
      startPair = _.escapeRegExp(_.keys(startPairMatches).join(''));
      endPair = _.escapeRegExp(_.keys(endPairMatches).join(''));
      combinedRegExp = new RegExp("[" + startPair + endPair + "]", 'g');
      startPairRegExp = new RegExp("[" + startPair + "]", 'g');
      endPairRegExp = new RegExp("[" + endPair + "]", 'g');
      startPosition = null;
      unpairedCount = 0;
      this.editor.backwardsScanInBufferRange(combinedRegExp, scanRange, (function(_this) {
        return function(result) {
          if (_this.isRangeCommentedOrString(result.range)) {
            return;
          }
          if (result.match[0].match(endPairRegExp)) {
            return unpairedCount++;
          } else if (result.match[0].match(startPairRegExp)) {
            unpairedCount--;
            if (unpairedCount < 0) {
              startPosition = result.range.start;
              return result.stop();
            }
          }
        };
      })(this));
      return startPosition;
    };

    BracketMatcherView.prototype.createMarker = function(bufferRange) {
      var marker;
      marker = this.editor.markBufferRange(bufferRange);
      this.editor.decorateMarker(marker, {
        type: 'highlight',
        "class": 'bracket-matcher',
        deprecatedRegionClass: 'bracket-matcher'
      });
      return marker;
    };

    BracketMatcherView.prototype.findCurrentPair = function(matches) {
      var currentPair, matchingPair, position;
      position = this.editor.getCursorBufferPosition();
      currentPair = this.editor.getTextInRange(Range.fromPointWithDelta(position, 0, 1));
      if (!matches[currentPair]) {
        position = position.traverse([0, -1]);
        currentPair = this.editor.getTextInRange(Range.fromPointWithDelta(position, 0, 1));
      }
      if (matchingPair = matches[currentPair]) {
        return {
          position: position,
          currentPair: currentPair,
          matchingPair: matchingPair
        };
      } else {
        return {};
      }
    };

    BracketMatcherView.prototype.goToMatchingPair = function() {
      var endPosition, endRange, position, previousPosition, ref, startPosition, startRange, tagCharacterOffset, tagLength;
      if (!this.pairHighlighted) {
        return this.goToEnclosingPair();
      }
      position = this.editor.getCursorBufferPosition();
      if (this.tagHighlighted) {
        startRange = this.startMarker.getBufferRange();
        tagLength = startRange.end.column - startRange.start.column;
        endRange = this.endMarker.getBufferRange();
        if (startRange.compare(endRange) > 0) {
          ref = [endRange, startRange], startRange = ref[0], endRange = ref[1];
        }
        startRange = new Range(startRange.start.traverse([0, -1]), endRange.end.traverse([0, -1]));
        endRange = new Range(endRange.start.traverse([0, -2]), endRange.end.traverse([0, -2]));
        if (position.isLessThan(endRange.start)) {
          tagCharacterOffset = position.column - startRange.start.column;
          if (tagCharacterOffset > 0) {
            tagCharacterOffset++;
          }
          tagCharacterOffset = Math.min(tagCharacterOffset, tagLength + 2);
          return this.editor.setCursorBufferPosition(endRange.start.traverse([0, tagCharacterOffset]));
        } else {
          tagCharacterOffset = position.column - endRange.start.column;
          if (tagCharacterOffset > 1) {
            tagCharacterOffset--;
          }
          tagCharacterOffset = Math.min(tagCharacterOffset, tagLength + 1);
          return this.editor.setCursorBufferPosition(startRange.start.traverse([0, tagCharacterOffset]));
        }
      } else {
        previousPosition = position.traverse([0, -1]);
        startPosition = this.startMarker.getStartBufferPosition();
        endPosition = this.endMarker.getStartBufferPosition();
        if (position.isEqual(startPosition)) {
          return this.editor.setCursorBufferPosition(endPosition.traverse([0, 1]));
        } else if (previousPosition.isEqual(startPosition)) {
          return this.editor.setCursorBufferPosition(endPosition);
        } else if (position.isEqual(endPosition)) {
          return this.editor.setCursorBufferPosition(startPosition.traverse([0, 1]));
        } else if (previousPosition.isEqual(endPosition)) {
          return this.editor.setCursorBufferPosition(startPosition);
        }
      }
    };

    BracketMatcherView.prototype.goToEnclosingPair = function() {
      var endRange, matchPosition, pair, ref, startRange;
      if (this.pairHighlighted) {
        return;
      }
      if (matchPosition = this.findAnyStartPair(this.editor.getCursorBufferPosition())) {
        return this.editor.setCursorBufferPosition(matchPosition);
      } else if (pair = this.tagFinder.findEnclosingTags()) {
        startRange = pair.startRange, endRange = pair.endRange;
        if (startRange.compare(endRange) > 0) {
          ref = [endRange, startRange], startRange = ref[0], endRange = ref[1];
        }
        return this.editor.setCursorBufferPosition(pair.startRange.start);
      }
    };

    BracketMatcherView.prototype.selectInsidePair = function() {
      var endPosition, endRange, pair, rangeToSelect, ref, ref1, startPosition, startRange;
      if (this.pairHighlighted) {
        startRange = this.startMarker.getBufferRange();
        endRange = this.endMarker.getBufferRange();
        if (startRange.compare(endRange) > 0) {
          ref = [endRange, startRange], startRange = ref[0], endRange = ref[1];
        }
        if (this.tagHighlighted) {
          startPosition = startRange.end;
          endPosition = endRange.start.traverse([0, -2]);
        } else {
          startPosition = startRange.start;
          endPosition = endRange.start;
        }
      } else {
        if (startPosition = this.findAnyStartPair(this.editor.getCursorBufferPosition())) {
          startPair = this.editor.getTextInRange(Range.fromPointWithDelta(startPosition, 0, 1));
          endPosition = this.findMatchingEndPair(startPosition, startPair, startPairMatches[startPair]);
        } else if (pair = this.tagFinder.findEnclosingTags()) {
          startRange = pair.startRange, endRange = pair.endRange;
          if (startRange.compare(endRange) > 0) {
            ref1 = [endRange, startRange], startRange = ref1[0], endRange = ref1[1];
          }
          startPosition = startRange.end;
          endPosition = endRange.start.traverse([0, -2]);
        }
      }
      if ((startPosition != null) && (endPosition != null)) {
        rangeToSelect = new Range(startPosition.traverse([0, 1]), endPosition);
        return this.editor.setSelectedBufferRange(rangeToSelect);
      }
    };

    BracketMatcherView.prototype.closeTag = function() {
      var cursorPosition, postFragment, preFragment, tag;
      cursorPosition = this.editor.getCursorBufferPosition();
      preFragment = this.editor.getTextInBufferRange([[0, 0], cursorPosition]);
      postFragment = this.editor.getTextInBufferRange([cursorPosition, [2e308, 2e308]]);
      if (tag = this.tagFinder.closingTagForFragments(preFragment, postFragment)) {
        return this.editor.insertText("</" + tag + ">");
      }
    };

    BracketMatcherView.prototype.isCursorOnCommentOrString = function() {
      return this.commentOrStringSelector.matches(this.editor.getLastCursor().getScopeDescriptor().getScopesArray());
    };

    BracketMatcherView.prototype.isRangeCommentedOrString = function(range) {
      return this.commentOrStringSelector.matches(this.editor.scopeDescriptorForBufferPosition(range.start).getScopesArray());
    };

    return BracketMatcherView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9icmFja2V0LW1hdGNoZXIvbGliL2JyYWNrZXQtbWF0Y2hlci12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOElBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBQ1osYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBRWhCLGdCQUFBLEdBQ0U7SUFBQSxHQUFBLEVBQUssR0FBTDtJQUNBLEdBQUEsRUFBSyxHQURMO0lBRUEsR0FBQSxFQUFLLEdBRkw7OztFQUlGLGNBQUEsR0FDRTtJQUFBLEdBQUEsRUFBSyxHQUFMO0lBQ0EsR0FBQSxFQUFLLEdBREw7SUFFQSxHQUFBLEVBQUssR0FGTDs7O0VBSUYsV0FBQSxHQUFjOztBQUNkLE9BQUEsNkJBQUE7O0lBQ0UsV0FBWSxDQUFBLFNBQUEsQ0FBWixHQUE2QixJQUFBLE1BQUEsQ0FBTyxHQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBRixDQUFlLFNBQUEsR0FBWSxPQUEzQixDQUFELENBQUgsR0FBd0MsR0FBL0MsRUFBbUQsR0FBbkQ7QUFEL0I7O0VBR0EsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLDRCQUFDLE1BQUQsRUFBVSxhQUFWO01BQUMsSUFBQyxDQUFBLFNBQUQ7OztNQUNaLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxTQUFBLENBQVUsSUFBQyxDQUFBLE1BQVg7TUFDakIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFB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TUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLGtCQUF4QixDQUFBLENBQTRDLENBQUMsY0FBN0MsQ0FBQSxDQUFqQztJQUR5Qjs7aUNBRzNCLHdCQUFBLEdBQTBCLFNBQUMsS0FBRDthQUN4QixJQUFDLENBQUEsdUJBQXVCLENBQUMsT0FBekIsQ0FBaUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQ0FBUixDQUF5QyxLQUFLLENBQUMsS0FBL0MsQ0FBcUQsQ0FBQyxjQUF0RCxDQUFBLENBQWpDO0lBRHdCOzs7OztBQTFSNUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuVGFnRmluZGVyID0gcmVxdWlyZSAnLi90YWctZmluZGVyJ1xuU2VsZWN0b3JDYWNoZSA9IHJlcXVpcmUgJy4vc2VsZWN0b3ItY2FjaGUnXG5cbnN0YXJ0UGFpck1hdGNoZXMgPVxuICAnKCc6ICcpJ1xuICAnWyc6ICddJ1xuICAneyc6ICd9J1xuXG5lbmRQYWlyTWF0Y2hlcyA9XG4gICcpJzogJygnXG4gICddJzogJ1snXG4gICd9JzogJ3snXG5cbnBhaXJSZWdleGVzID0ge31cbmZvciBzdGFydFBhaXIsIGVuZFBhaXIgb2Ygc3RhcnRQYWlyTWF0Y2hlc1xuICBwYWlyUmVnZXhlc1tzdGFydFBhaXJdID0gbmV3IFJlZ0V4cChcIlsje18uZXNjYXBlUmVnRXhwKHN0YXJ0UGFpciArIGVuZFBhaXIpfV1cIiwgJ2cnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBCcmFja2V0TWF0Y2hlclZpZXdcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBlZGl0b3JFbGVtZW50KSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAdGFnRmluZGVyID0gbmV3IFRhZ0ZpbmRlcihAZWRpdG9yKVxuICAgIEBwYWlySGlnaGxpZ2h0ZWQgPSBmYWxzZVxuICAgIEB0YWdIaWdobGlnaHRlZCA9IGZhbHNlXG4gICAgQGNvbW1lbnRPclN0cmluZ1NlbGVjdG9yID0gU2VsZWN0b3JDYWNoZS5nZXQoJ2NvbW1lbnQuKiB8IHN0cmluZy4qJylcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkVG9rZW5pemUoQHVwZGF0ZU1hdGNoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlVGV4dChAdXBkYXRlTWF0Y2gpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKEB1cGRhdGVNYXRjaClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZENoYW5nZVNlbGVjdGlvblJhbmdlKEB1cGRhdGVNYXRjaClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZEFkZEN1cnNvcihAdXBkYXRlTWF0Y2gpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRSZW1vdmVDdXJzb3IoQHVwZGF0ZU1hdGNoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIGVkaXRvckVsZW1lbnQsICdicmFja2V0LW1hdGNoZXI6Z28tdG8tbWF0Y2hpbmctYnJhY2tldCcsID0+XG4gICAgICBAZ29Ub01hdGNoaW5nUGFpcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgZWRpdG9yRWxlbWVudCwgJ2JyYWNrZXQtbWF0Y2hlcjpnby10by1lbmNsb3NpbmctYnJhY2tldCcsID0+XG4gICAgICBAZ29Ub0VuY2xvc2luZ1BhaXIoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIGVkaXRvckVsZW1lbnQsICdicmFja2V0LW1hdGNoZXI6c2VsZWN0LWluc2lkZS1icmFja2V0cycsID0+XG4gICAgICBAc2VsZWN0SW5zaWRlUGFpcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgZWRpdG9yRWxlbWVudCwgJ2JyYWNrZXQtbWF0Y2hlcjpjbG9zZS10YWcnLCA9PlxuICAgICAgQGNsb3NlVGFnKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JFbGVtZW50LCAnYnJhY2tldC1tYXRjaGVyOnJlbW92ZS1tYXRjaGluZy1icmFja2V0cycsID0+XG4gICAgICBAcmVtb3ZlTWF0Y2hpbmdCcmFja2V0cygpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vbkRpZERlc3Ryb3kgQGRlc3Ryb3lcblxuICAgIEB1cGRhdGVNYXRjaCgpXG5cbiAgZGVzdHJveTogPT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICB1cGRhdGVNYXRjaDogPT5cbiAgICBpZiBAcGFpckhpZ2hsaWdodGVkXG4gICAgICBAZWRpdG9yLmRlc3Ryb3lNYXJrZXIoQHN0YXJ0TWFya2VyLmlkKVxuICAgICAgQGVkaXRvci5kZXN0cm95TWFya2VyKEBlbmRNYXJrZXIuaWQpXG5cbiAgICBAcGFpckhpZ2hsaWdodGVkID0gZmFsc2VcbiAgICBAdGFnSGlnaGxpZ2h0ZWQgPSBmYWxzZVxuXG4gICAgcmV0dXJuIHVubGVzcyBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICByZXR1cm4gaWYgQGVkaXRvci5pc0ZvbGRlZEF0Q3Vyc29yUm93KClcbiAgICByZXR1cm4gaWYgQGlzQ3Vyc29yT25Db21tZW50T3JTdHJpbmcoKVxuXG4gICAge3Bvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyfSA9IEBmaW5kQ3VycmVudFBhaXIoc3RhcnRQYWlyTWF0Y2hlcylcbiAgICBpZiBwb3NpdGlvblxuICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdFbmRQYWlyKHBvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyKVxuICAgIGVsc2VcbiAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn0gPSBAZmluZEN1cnJlbnRQYWlyKGVuZFBhaXJNYXRjaGVzKVxuICAgICAgaWYgcG9zaXRpb25cbiAgICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdTdGFydFBhaXIocG9zaXRpb24sIG1hdGNoaW5nUGFpciwgY3VycmVudFBhaXIpXG5cbiAgICBpZiBwb3NpdGlvbj8gYW5kIG1hdGNoUG9zaXRpb24/XG4gICAgICBAc3RhcnRNYXJrZXIgPSBAY3JlYXRlTWFya2VyKFtwb3NpdGlvbiwgcG9zaXRpb24udHJhdmVyc2UoWzAsIDFdKV0pXG4gICAgICBAZW5kTWFya2VyID0gQGNyZWF0ZU1hcmtlcihbbWF0Y2hQb3NpdGlvbiwgbWF0Y2hQb3NpdGlvbi50cmF2ZXJzZShbMCwgMV0pXSlcbiAgICAgIEBwYWlySGlnaGxpZ2h0ZWQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgaWYgcGFpciA9IEB0YWdGaW5kZXIuZmluZE1hdGNoaW5nVGFncygpXG4gICAgICAgIEBzdGFydE1hcmtlciA9IEBjcmVhdGVNYXJrZXIocGFpci5zdGFydFJhbmdlKVxuICAgICAgICBAZW5kTWFya2VyID0gQGNyZWF0ZU1hcmtlcihwYWlyLmVuZFJhbmdlKVxuICAgICAgICBAcGFpckhpZ2hsaWdodGVkID0gdHJ1ZVxuICAgICAgICBAdGFnSGlnaGxpZ2h0ZWQgPSB0cnVlXG5cbiAgcmVtb3ZlTWF0Y2hpbmdCcmFja2V0czogLT5cbiAgICByZXR1cm4gQGVkaXRvci5iYWNrc3BhY2UoKSBpZiBAZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpXG5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAZWRpdG9yLnNlbGVjdExlZnQoKSBpZiBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICAgIHRleHQgPSBAZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG5cbiAgICAgICNjaGVjayBpZiB0aGUgY2hhcmFjdGVyIHRvIHRoZSBsZWZ0IGlzIHBhcnQgb2YgYSBwYWlyXG4gICAgICBpZiBzdGFydFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KHRleHQpIG9yIGVuZFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KHRleHQpXG4gICAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn0gPSBAZmluZEN1cnJlbnRQYWlyKHN0YXJ0UGFpck1hdGNoZXMpXG4gICAgICAgIGlmIHBvc2l0aW9uXG4gICAgICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdFbmRQYWlyKHBvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyKVxuICAgICAgICBlbHNlXG4gICAgICAgICAge3Bvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyfSA9IEBmaW5kQ3VycmVudFBhaXIoZW5kUGFpck1hdGNoZXMpXG4gICAgICAgICAgaWYgcG9zaXRpb25cbiAgICAgICAgICAgIG1hdGNoUG9zaXRpb24gPSBAZmluZE1hdGNoaW5nU3RhcnRQYWlyKHBvc2l0aW9uLCBtYXRjaGluZ1BhaXIsIGN1cnJlbnRQYWlyKVxuXG4gICAgICAgIGlmIHBvc2l0aW9uPyBhbmQgbWF0Y2hQb3NpdGlvbj9cbiAgICAgICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKG1hdGNoUG9zaXRpb24pXG4gICAgICAgICAgQGVkaXRvci5kZWxldGUoKVxuICAgICAgICAgICMgaWYgb24gdGhlIHNhbWUgbGluZSBhbmQgdGhlIGN1cnNvciBpcyBpbiBmcm9udCBvZiBhbiBlbmQgcGFpclxuICAgICAgICAgICMgb2Zmc2V0IGJ5IG9uZSB0byBtYWtlIHVwIGZvciB0aGUgbWlzc2luZyBjaGFyYWN0ZXJcbiAgICAgICAgICBpZiBwb3NpdGlvbi5yb3cgaXMgbWF0Y2hQb3NpdGlvbi5yb3cgYW5kIGVuZFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KGN1cnJlbnRQYWlyKVxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbi50cmF2ZXJzZShbMCwgLTFdKVxuICAgICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG4gICAgICAgICAgQGVkaXRvci5kZWxldGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgZWxzZVxuICAgICAgICBAZWRpdG9yLmJhY2tzcGFjZSgpXG5cbiAgZmluZE1hdGNoaW5nRW5kUGFpcjogKHN0YXJ0UGFpclBvc2l0aW9uLCBzdGFydFBhaXIsIGVuZFBhaXIpIC0+XG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0UGFpclBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSksIEBlZGl0b3IuYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpXG4gICAgZW5kUGFpclBvc2l0aW9uID0gbnVsbFxuICAgIHVucGFpcmVkQ291bnQgPSAwXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYWlyUmVnZXhlc1tzdGFydFBhaXJdLCBzY2FuUmFuZ2UsIChyZXN1bHQpID0+XG4gICAgICByZXR1cm4gaWYgQGlzUmFuZ2VDb21tZW50ZWRPclN0cmluZyhyZXN1bHQucmFuZ2UpXG4gICAgICBzd2l0Y2ggcmVzdWx0Lm1hdGNoWzBdXG4gICAgICAgIHdoZW4gc3RhcnRQYWlyXG4gICAgICAgICAgdW5wYWlyZWRDb3VudCsrXG4gICAgICAgIHdoZW4gZW5kUGFpclxuICAgICAgICAgIHVucGFpcmVkQ291bnQtLVxuICAgICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgICBlbmRQYWlyUG9zaXRpb24gPSByZXN1bHQucmFuZ2Uuc3RhcnRcbiAgICAgICAgICAgIHJlc3VsdC5zdG9wKClcblxuICAgIGVuZFBhaXJQb3NpdGlvblxuXG4gIGZpbmRNYXRjaGluZ1N0YXJ0UGFpcjogKGVuZFBhaXJQb3NpdGlvbiwgc3RhcnRQYWlyLCBlbmRQYWlyKSAtPlxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShbMCwgMF0sIGVuZFBhaXJQb3NpdGlvbilcbiAgICBzdGFydFBhaXJQb3NpdGlvbiA9IG51bGxcbiAgICB1bnBhaXJlZENvdW50ID0gMFxuICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcGFpclJlZ2V4ZXNbc3RhcnRQYWlyXSwgc2NhblJhbmdlLCAocmVzdWx0KSA9PlxuICAgICAgcmV0dXJuIGlmIEBpc1JhbmdlQ29tbWVudGVkT3JTdHJpbmcocmVzdWx0LnJhbmdlKVxuICAgICAgc3dpdGNoIHJlc3VsdC5tYXRjaFswXVxuICAgICAgICB3aGVuIHN0YXJ0UGFpclxuICAgICAgICAgIHVucGFpcmVkQ291bnQtLVxuICAgICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgICBzdGFydFBhaXJQb3NpdGlvbiA9IHJlc3VsdC5yYW5nZS5zdGFydFxuICAgICAgICAgICAgcmVzdWx0LnN0b3AoKVxuICAgICAgICB3aGVuIGVuZFBhaXJcbiAgICAgICAgICB1bnBhaXJlZENvdW50KytcbiAgICBzdGFydFBhaXJQb3NpdGlvblxuXG4gIGZpbmRBbnlTdGFydFBhaXI6IChjdXJzb3JQb3NpdGlvbikgLT5cbiAgICBzY2FuUmFuZ2UgPSBuZXcgUmFuZ2UoWzAsIDBdLCBjdXJzb3JQb3NpdGlvbilcbiAgICBzdGFydFBhaXIgPSBfLmVzY2FwZVJlZ0V4cChfLmtleXMoc3RhcnRQYWlyTWF0Y2hlcykuam9pbignJykpXG4gICAgZW5kUGFpciA9IF8uZXNjYXBlUmVnRXhwKF8ua2V5cyhlbmRQYWlyTWF0Y2hlcykuam9pbignJykpXG4gICAgY29tYmluZWRSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7c3RhcnRQYWlyfSN7ZW5kUGFpcn1dXCIsICdnJylcbiAgICBzdGFydFBhaXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7c3RhcnRQYWlyfV1cIiwgJ2cnKVxuICAgIGVuZFBhaXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7ZW5kUGFpcn1dXCIsICdnJylcbiAgICBzdGFydFBvc2l0aW9uID0gbnVsbFxuICAgIHVucGFpcmVkQ291bnQgPSAwXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBjb21iaW5lZFJlZ0V4cCwgc2NhblJhbmdlLCAocmVzdWx0KSA9PlxuICAgICAgcmV0dXJuIGlmIEBpc1JhbmdlQ29tbWVudGVkT3JTdHJpbmcocmVzdWx0LnJhbmdlKVxuICAgICAgaWYgcmVzdWx0Lm1hdGNoWzBdLm1hdGNoKGVuZFBhaXJSZWdFeHApXG4gICAgICAgIHVucGFpcmVkQ291bnQrK1xuICAgICAgZWxzZSBpZiByZXN1bHQubWF0Y2hbMF0ubWF0Y2goc3RhcnRQYWlyUmVnRXhwKVxuICAgICAgICB1bnBhaXJlZENvdW50LS1cbiAgICAgICAgaWYgdW5wYWlyZWRDb3VudCA8IDBcbiAgICAgICAgICBzdGFydFBvc2l0aW9uID0gcmVzdWx0LnJhbmdlLnN0YXJ0XG4gICAgICAgICAgcmVzdWx0LnN0b3AoKVxuICAgICBzdGFydFBvc2l0aW9uXG5cbiAgY3JlYXRlTWFya2VyOiAoYnVmZmVyUmFuZ2UpIC0+XG4gICAgbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoYnVmZmVyUmFuZ2UpXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2JyYWNrZXQtbWF0Y2hlcicsIGRlcHJlY2F0ZWRSZWdpb25DbGFzczogJ2JyYWNrZXQtbWF0Y2hlcicpXG4gICAgbWFya2VyXG5cbiAgZmluZEN1cnJlbnRQYWlyOiAobWF0Y2hlcykgLT5cbiAgICBwb3NpdGlvbiA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnJlbnRQYWlyID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9zaXRpb24sIDAsIDEpKVxuICAgIHVubGVzcyBtYXRjaGVzW2N1cnJlbnRQYWlyXVxuICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbi50cmF2ZXJzZShbMCwgLTFdKVxuICAgICAgY3VycmVudFBhaXIgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShwb3NpdGlvbiwgMCwgMSkpXG4gICAgaWYgbWF0Y2hpbmdQYWlyID0gbWF0Y2hlc1tjdXJyZW50UGFpcl1cbiAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn1cbiAgICBlbHNlXG4gICAgICB7fVxuXG4gIGdvVG9NYXRjaGluZ1BhaXI6IC0+XG4gICAgcmV0dXJuIEBnb1RvRW5jbG9zaW5nUGFpcigpIHVubGVzcyBAcGFpckhpZ2hsaWdodGVkXG4gICAgcG9zaXRpb24gPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmIEB0YWdIaWdobGlnaHRlZFxuICAgICAgc3RhcnRSYW5nZSA9IEBzdGFydE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICB0YWdMZW5ndGggPSBzdGFydFJhbmdlLmVuZC5jb2x1bW4gLSBzdGFydFJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgZW5kUmFuZ2UgPSBAZW5kTWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIGlmIHN0YXJ0UmFuZ2UuY29tcGFyZShlbmRSYW5nZSkgPiAwXG4gICAgICAgIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSBbZW5kUmFuZ2UsIHN0YXJ0UmFuZ2VdXG5cbiAgICAgICMgaW5jbHVkZSB0aGUgPFxuICAgICAgc3RhcnRSYW5nZSA9IG5ldyBSYW5nZShzdGFydFJhbmdlLnN0YXJ0LnRyYXZlcnNlKFswLCAtMV0pLCBlbmRSYW5nZS5lbmQudHJhdmVyc2UoWzAsIC0xXSkpXG4gICAgICAjIGluY2x1ZGUgdGhlIDwvXG4gICAgICBlbmRSYW5nZSA9IG5ldyBSYW5nZShlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSwgZW5kUmFuZ2UuZW5kLnRyYXZlcnNlKFswLCAtMl0pKVxuXG4gICAgICBpZiBwb3NpdGlvbi5pc0xlc3NUaGFuKGVuZFJhbmdlLnN0YXJ0KVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBwb3NpdGlvbi5jb2x1bW4gLSBzdGFydFJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQrKyBpZiB0YWdDaGFyYWN0ZXJPZmZzZXQgPiAwXG4gICAgICAgIHRhZ0NoYXJhY3Rlck9mZnNldCA9IE1hdGgubWluKHRhZ0NoYXJhY3Rlck9mZnNldCwgdGFnTGVuZ3RoICsgMikgIyBpbmNsdWRlIDwvXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUmFuZ2Uuc3RhcnQudHJhdmVyc2UoWzAsIHRhZ0NoYXJhY3Rlck9mZnNldF0pKVxuICAgICAgZWxzZVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBwb3NpdGlvbi5jb2x1bW4gLSBlbmRSYW5nZS5zdGFydC5jb2x1bW5cbiAgICAgICAgdGFnQ2hhcmFjdGVyT2Zmc2V0LS0gaWYgdGFnQ2hhcmFjdGVyT2Zmc2V0ID4gMVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBNYXRoLm1pbih0YWdDaGFyYWN0ZXJPZmZzZXQsIHRhZ0xlbmd0aCArIDEpICMgaW5jbHVkZSA8XG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgdGFnQ2hhcmFjdGVyT2Zmc2V0XSkpXG4gICAgZWxzZVxuICAgICAgcHJldmlvdXNQb3NpdGlvbiA9IHBvc2l0aW9uLnRyYXZlcnNlKFswLCAtMV0pXG4gICAgICBzdGFydFBvc2l0aW9uID0gQHN0YXJ0TWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgZW5kUG9zaXRpb24gPSBAZW5kTWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgICBpZiBwb3NpdGlvbi5pc0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUG9zaXRpb24udHJhdmVyc2UoWzAsIDFdKSlcbiAgICAgIGVsc2UgaWYgcHJldmlvdXNQb3NpdGlvbi5pc0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUG9zaXRpb24pXG4gICAgICBlbHNlIGlmIHBvc2l0aW9uLmlzRXF1YWwoZW5kUG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRQb3NpdGlvbi50cmF2ZXJzZShbMCwgMV0pKVxuICAgICAgZWxzZSBpZiBwcmV2aW91c1Bvc2l0aW9uLmlzRXF1YWwoZW5kUG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRQb3NpdGlvbilcblxuICBnb1RvRW5jbG9zaW5nUGFpcjogLT5cbiAgICByZXR1cm4gaWYgQHBhaXJIaWdobGlnaHRlZFxuXG4gICAgaWYgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kQW55U3RhcnRQYWlyKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24obWF0Y2hQb3NpdGlvbilcbiAgICBlbHNlIGlmIHBhaXIgPSBAdGFnRmluZGVyLmZpbmRFbmNsb3NpbmdUYWdzKClcbiAgICAgIHtzdGFydFJhbmdlLCBlbmRSYW5nZX0gPSBwYWlyXG4gICAgICBpZiBzdGFydFJhbmdlLmNvbXBhcmUoZW5kUmFuZ2UpID4gMFxuICAgICAgICBbc3RhcnRSYW5nZSwgZW5kUmFuZ2VdID0gW2VuZFJhbmdlLCBzdGFydFJhbmdlXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihwYWlyLnN0YXJ0UmFuZ2Uuc3RhcnQpXG5cbiAgc2VsZWN0SW5zaWRlUGFpcjogLT5cbiAgICBpZiBAcGFpckhpZ2hsaWdodGVkXG4gICAgICBzdGFydFJhbmdlID0gQHN0YXJ0TWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIGVuZFJhbmdlID0gQGVuZE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgICAgIGlmIHN0YXJ0UmFuZ2UuY29tcGFyZShlbmRSYW5nZSkgPiAwXG4gICAgICAgIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSBbZW5kUmFuZ2UsIHN0YXJ0UmFuZ2VdXG5cbiAgICAgIGlmIEB0YWdIaWdobGlnaHRlZFxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5lbmRcbiAgICAgICAgZW5kUG9zaXRpb24gPSBlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSAjIERvbid0IHNlbGVjdCA8L1xuICAgICAgZWxzZVxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5zdGFydFxuICAgICAgICBlbmRQb3NpdGlvbiA9IGVuZFJhbmdlLnN0YXJ0XG4gICAgZWxzZVxuICAgICAgaWYgc3RhcnRQb3NpdGlvbiA9IEBmaW5kQW55U3RhcnRQYWlyKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgc3RhcnRQYWlyID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoc3RhcnRQb3NpdGlvbiwgMCwgMSkpXG4gICAgICAgIGVuZFBvc2l0aW9uID0gQGZpbmRNYXRjaGluZ0VuZFBhaXIoc3RhcnRQb3NpdGlvbiwgc3RhcnRQYWlyLCBzdGFydFBhaXJNYXRjaGVzW3N0YXJ0UGFpcl0pXG4gICAgICBlbHNlIGlmIHBhaXIgPSBAdGFnRmluZGVyLmZpbmRFbmNsb3NpbmdUYWdzKClcbiAgICAgICAge3N0YXJ0UmFuZ2UsIGVuZFJhbmdlfSA9IHBhaXJcbiAgICAgICAgaWYgc3RhcnRSYW5nZS5jb21wYXJlKGVuZFJhbmdlKSA+IDBcbiAgICAgICAgICBbc3RhcnRSYW5nZSwgZW5kUmFuZ2VdID0gW2VuZFJhbmdlLCBzdGFydFJhbmdlXVxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5lbmRcbiAgICAgICAgZW5kUG9zaXRpb24gPSBlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSAjIERvbid0IHNlbGVjdCA8L1xuXG4gICAgaWYgc3RhcnRQb3NpdGlvbj8gYW5kIGVuZFBvc2l0aW9uP1xuICAgICAgcmFuZ2VUb1NlbGVjdCA9IG5ldyBSYW5nZShzdGFydFBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSksIGVuZFBvc2l0aW9uKVxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlVG9TZWxlY3QpXG5cbiAgIyBJbnNlcnQgYXQgdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIGEgY2xvc2luZyB0YWcgaWYgdGhlcmUgZXhpc3RzIGFuXG4gICMgb3BlbiB0YWcgdGhhdCBpcyBub3QgY2xvc2VkIGFmdGVyd2FyZHMuXG4gIGNsb3NlVGFnOiAtPlxuICAgIGN1cnNvclBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgcHJlRnJhZ21lbnQgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbMCwgMF0sIGN1cnNvclBvc2l0aW9uXSlcbiAgICBwb3N0RnJhZ21lbnQgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtjdXJzb3JQb3NpdGlvbiwgW0luZmluaXR5LCBJbmZpbml0eV1dKVxuXG4gICAgaWYgdGFnID0gQHRhZ0ZpbmRlci5jbG9zaW5nVGFnRm9yRnJhZ21lbnRzKHByZUZyYWdtZW50LCBwb3N0RnJhZ21lbnQpXG4gICAgICBAZWRpdG9yLmluc2VydFRleHQoXCI8LyN7dGFnfT5cIilcblxuICBpc0N1cnNvck9uQ29tbWVudE9yU3RyaW5nOiAtPlxuICAgIEBjb21tZW50T3JTdHJpbmdTZWxlY3Rvci5tYXRjaGVzKEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KCkpXG5cbiAgaXNSYW5nZUNvbW1lbnRlZE9yU3RyaW5nOiAocmFuZ2UpIC0+XG4gICAgQGNvbW1lbnRPclN0cmluZ1NlbGVjdG9yLm1hdGNoZXMoQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihyYW5nZS5zdGFydCkuZ2V0U2NvcGVzQXJyYXkoKSlcbiJdfQ==
