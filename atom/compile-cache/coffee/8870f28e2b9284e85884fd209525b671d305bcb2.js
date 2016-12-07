(function() {
  var BracketMatcherView, CompositeDisposable, Range, TagFinder, _, endPair, endPairMatches, pairRegexes, startPair, startPairMatches,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  Range = require('atom').Range;

  TagFinder = require('./tag-finder');

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
      this.destroy = bind(this.destroy, this);
      this.subscriptions = new CompositeDisposable;
      this.tagFinder = new TagFinder(this.editor);
      this.pairHighlighted = false;
      this.tagHighlighted = false;
      if (typeof this.editor.getBuffer().onDidChangeText === "function") {
        this.subscriptions.add(this.editor.getBuffer().onDidChangeText((function(_this) {
          return function() {
            return _this.updateMatch();
          };
        })(this)));
      } else {
        this.subscriptions.add(this.editor.onDidChange((function(_this) {
          return function() {
            return _this.updateMatch();
          };
        })(this)));
      }
      this.subscriptions.add(this.editor.onDidChangeGrammar((function(_this) {
        return function() {
          return _this.updateMatch();
        };
      })(this)));
      this.subscribeToCursor();
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

    BracketMatcherView.prototype.subscribeToCursor = function() {
      var cursor, cursorSubscriptions;
      cursor = this.editor.getLastCursor();
      if (cursor == null) {
        return;
      }
      cursorSubscriptions = new CompositeDisposable;
      cursorSubscriptions.add(cursor.onDidChangePosition((function(_this) {
        return function(arg) {
          var textChanged;
          textChanged = arg.textChanged;
          if (!textChanged) {
            return _this.updateMatch();
          }
        };
      })(this)));
      return cursorSubscriptions.add(cursor.onDidDestroy((function(_this) {
        return function() {
          cursorSubscriptions.dispose();
          _this.subscribeToCursor();
          if (_this.editor.isAlive()) {
            return _this.updateMatch();
          }
        };
      })(this)));
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
      this.editor.scanInBufferRange(pairRegexes[startPair], scanRange, function(result) {
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
      });
      return endPairPosition;
    };

    BracketMatcherView.prototype.findMatchingStartPair = function(endPairPosition, startPair, endPair) {
      var scanRange, startPairPosition, unpairedCount;
      scanRange = new Range([0, 0], endPairPosition);
      startPairPosition = null;
      unpairedCount = 0;
      this.editor.backwardsScanInBufferRange(pairRegexes[startPair], scanRange, function(result) {
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
      });
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
      this.editor.backwardsScanInBufferRange(combinedRegExp, scanRange, function(result) {
        if (result.match[0].match(endPairRegExp)) {
          return unpairedCount++;
        } else if (result.match[0].match(startPairRegExp)) {
          unpairedCount--;
          if (unpairedCount < 0) {
            startPosition = result.range.start;
            return result.stop();
          }
        }
      });
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
      var cursorPosition, postFragment, preFragment, tag, textLimits;
      cursorPosition = this.editor.getCursorBufferPosition();
      textLimits = this.editor.getBuffer().getRange();
      preFragment = this.editor.getTextInBufferRange([[0, 0], cursorPosition]);
      postFragment = this.editor.getTextInBufferRange([cursorPosition, [2e308, 2e308]]);
      if (tag = this.tagFinder.closingTagForFragments(preFragment, postFragment)) {
        return this.editor.insertText("</" + tag + ">");
      }
    };

    return BracketMatcherView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL2JyYWNrZXQtbWF0Y2hlci9saWIvYnJhY2tldC1tYXRjaGVyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrSEFBQTtJQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUNWLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixnQkFBQSxHQUNFO0lBQUEsR0FBQSxFQUFLLEdBQUw7SUFDQSxHQUFBLEVBQUssR0FETDtJQUVBLEdBQUEsRUFBSyxHQUZMOzs7RUFJRixjQUFBLEdBQ0U7SUFBQSxHQUFBLEVBQUssR0FBTDtJQUNBLEdBQUEsRUFBSyxHQURMO0lBRUEsR0FBQSxFQUFLLEdBRkw7OztFQUlGLFdBQUEsR0FBYzs7QUFDZCxPQUFBLDZCQUFBOztJQUNFLFdBQVksQ0FBQSxTQUFBLENBQVosR0FBNkIsSUFBQSxNQUFBLENBQU8sR0FBQSxHQUFHLENBQUMsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxTQUFBLEdBQVksT0FBM0IsQ0FBRCxDQUFILEdBQXdDLEdBQS9DLEVBQW1ELEdBQW5EO0FBRC9COztFQUdBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyw0QkFBQyxNQUFELEVBQVUsYUFBVjtNQUFDLElBQUMsQ0FBQSxTQUFEOztNQUNaLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLFNBQUQsR0FBaUIsSUFBQSxTQUFBLENBQVUsSUFBQyxDQUFBLE1BQVg7TUFDakIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLGNBQUQsR0FBa0I7TUFHbEIsSUFBRyxPQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQW1CLENBQUMsZUFBM0IsS0FBOEMsVUFBakQ7UUFDRSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsQ0FBbUIsQ0FBQyxlQUFwQixDQUFvQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUNyRCxLQUFDLENBQUEsV0FBRCxDQUFBO1VBRHFEO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFwQyxDQUFuQixFQURGO09BQUEsTUFBQTtRQUlFLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDckMsS0FBQyxDQUFBLFdBQUQsQ0FBQTtVQURxQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsQ0FBbkIsRUFKRjs7TUFPQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzVDLEtBQUMsQ0FBQSxXQUFELENBQUE7UUFENEM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCLENBQW5CO01BR0EsSUFBQyxDQUFBLGlCQUFELENBQUE7TUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGFBQWxCLEVBQWlDLHdDQUFqQyxFQUEyRSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzVGLEtBQUMsQ0FBQSxnQkFBRCxDQUFBO1FBRDRGO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEzRSxDQUFuQjtNQUdBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsYUFBbEIsRUFBaUMseUNBQWpDLEVBQTRFLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0YsS0FBQyxDQUFBLGlCQUFELENBQUE7UUFENkY7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVFLENBQW5CO01BR0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixhQUFsQixFQUFpQyx3Q0FBakMsRUFBMkUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUM1RixLQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUQ0RjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0UsQ0FBbkI7TUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGFBQWxCLEVBQWlDLDJCQUFqQyxFQUE4RCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQy9FLEtBQUMsQ0FBQSxRQUFELENBQUE7UUFEK0U7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlELENBQW5CO01BR0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixhQUFsQixFQUFpQywwQ0FBakMsRUFBNkUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUM5RixLQUFDLENBQUEsc0JBQUQsQ0FBQTtRQUQ4RjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0UsQ0FBbkI7TUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQUMsQ0FBQSxPQUF0QixDQUFuQjtNQUVBLElBQUMsQ0FBQSxXQUFELENBQUE7SUFwQ1c7O2lDQXNDYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRE87O2lDQUdULGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQTtNQUNULElBQWMsY0FBZDtBQUFBLGVBQUE7O01BRUEsbUJBQUEsR0FBc0IsSUFBSTtNQUMxQixtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixNQUFNLENBQUMsbUJBQVAsQ0FBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDakQsY0FBQTtVQURtRCxjQUFEO1VBQ2xELElBQUEsQ0FBc0IsV0FBdEI7bUJBQUEsS0FBQyxDQUFBLFdBQUQsQ0FBQSxFQUFBOztRQURpRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0IsQ0FBeEI7YUFHQSxtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixNQUFNLENBQUMsWUFBUCxDQUFvQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDMUMsbUJBQW1CLENBQUMsT0FBcEIsQ0FBQTtVQUNBLEtBQUMsQ0FBQSxpQkFBRCxDQUFBO1VBQ0EsSUFBa0IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUEsQ0FBbEI7bUJBQUEsS0FBQyxDQUFBLFdBQUQsQ0FBQSxFQUFBOztRQUgwQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEIsQ0FBeEI7SUFSaUI7O2lDQWFuQixXQUFBLEdBQWEsU0FBQTtBQUNYLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxlQUFKO1FBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQXNCLElBQUMsQ0FBQSxXQUFXLENBQUMsRUFBbkM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxFQUFqQyxFQUZGOztNQUlBLElBQUMsQ0FBQSxlQUFELEdBQW1CO01BQ25CLElBQUMsQ0FBQSxjQUFELEdBQWtCO01BRWxCLElBQUEsQ0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBMEIsQ0FBQyxPQUEzQixDQUFBLENBQWQ7QUFBQSxlQUFBOztNQUNBLElBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxtQkFBUixDQUFBLENBQVY7QUFBQSxlQUFBOztNQUVBLE1BQXdDLElBQUMsQ0FBQSxlQUFELENBQWlCLGdCQUFqQixDQUF4QyxFQUFDLHVCQUFELEVBQVcsNkJBQVgsRUFBd0I7TUFDeEIsSUFBRyxRQUFIO1FBQ0UsYUFBQSxHQUFnQixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsUUFBckIsRUFBK0IsV0FBL0IsRUFBNEMsWUFBNUMsRUFEbEI7T0FBQSxNQUFBO1FBR0UsT0FBd0MsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsY0FBakIsQ0FBeEMsRUFBQyx3QkFBRCxFQUFXLDhCQUFYLEVBQXdCO1FBQ3hCLElBQUcsUUFBSDtVQUNFLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLHFCQUFELENBQXVCLFFBQXZCLEVBQWlDLFlBQWpDLEVBQStDLFdBQS9DLEVBRGxCO1NBSkY7O01BT0EsSUFBRyxrQkFBQSxJQUFjLHVCQUFqQjtRQUNFLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFDLFFBQUQsRUFBVyxRQUFRLENBQUMsUUFBVCxDQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWxCLENBQVgsQ0FBZDtRQUNmLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFDLGFBQUQsRUFBZ0IsYUFBYSxDQUFDLFFBQWQsQ0FBdUIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF2QixDQUFoQixDQUFkO2VBQ2IsSUFBQyxDQUFBLGVBQUQsR0FBbUIsS0FIckI7T0FBQSxNQUFBO1FBS0UsSUFBRyxJQUFBLEdBQU8sSUFBQyxDQUFBLFNBQVMsQ0FBQyxnQkFBWCxDQUFBLENBQVY7VUFDRSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBSSxDQUFDLFVBQW5CO1VBQ2YsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQUksQ0FBQyxRQUFuQjtVQUNiLElBQUMsQ0FBQSxlQUFELEdBQW1CO2lCQUNuQixJQUFDLENBQUEsY0FBRCxHQUFrQixLQUpwQjtTQUxGOztJQW5CVzs7aUNBOEJiLHNCQUFBLEdBQXdCLFNBQUE7TUFDdEIsSUFBOEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUFBLENBQTlCO0FBQUEsZUFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQUFQOzthQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDZixjQUFBO1VBQUEsSUFBd0IsS0FBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBLENBQTBCLENBQUMsT0FBM0IsQ0FBQSxDQUF4QjtZQUFBLEtBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLEVBQUE7O1VBQ0EsSUFBQSxHQUFPLEtBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUFBO1VBR1AsSUFBRyxnQkFBZ0IsQ0FBQyxjQUFqQixDQUFnQyxJQUFoQyxDQUFBLElBQXlDLGNBQWMsQ0FBQyxjQUFmLENBQThCLElBQTlCLENBQTVDO1lBQ0UsTUFBd0MsS0FBQyxDQUFBLGVBQUQsQ0FBaUIsZ0JBQWpCLENBQXhDLEVBQUMsdUJBQUQsRUFBVyw2QkFBWCxFQUF3QjtZQUN4QixJQUFHLFFBQUg7Y0FDRSxhQUFBLEdBQWdCLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixRQUFyQixFQUErQixXQUEvQixFQUE0QyxZQUE1QyxFQURsQjthQUFBLE1BQUE7Y0FHRSxPQUF3QyxLQUFDLENBQUEsZUFBRCxDQUFpQixjQUFqQixDQUF4QyxFQUFDLHdCQUFELEVBQVcsOEJBQVgsRUFBd0I7Y0FDeEIsSUFBRyxRQUFIO2dCQUNFLGFBQUEsR0FBZ0IsS0FBQyxDQUFBLHFCQUFELENBQXVCLFFBQXZCLEVBQWlDLFlBQWpDLEVBQStDLFdBQS9DLEVBRGxCO2VBSkY7O1lBT0EsSUFBRyxrQkFBQSxJQUFjLHVCQUFqQjtjQUNFLEtBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsYUFBaEM7Y0FDQSxLQUFDLENBQUEsTUFBTSxFQUFDLE1BQUQsRUFBUCxDQUFBO2NBR0EsSUFBRyxRQUFRLENBQUMsR0FBVCxLQUFnQixhQUFhLENBQUMsR0FBOUIsSUFBc0MsY0FBYyxDQUFDLGNBQWYsQ0FBOEIsV0FBOUIsQ0FBekM7Z0JBQ0UsUUFBQSxHQUFXLFFBQVEsQ0FBQyxRQUFULENBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFsQixFQURiOztjQUVBLEtBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsUUFBaEM7cUJBQ0EsS0FBQyxDQUFBLE1BQU0sRUFBQyxNQUFELEVBQVAsQ0FBQSxFQVJGO2FBQUEsTUFBQTtxQkFVRSxLQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQVZGO2FBVEY7V0FBQSxNQUFBO21CQXFCRSxLQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBQSxFQXJCRjs7UUFMZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFIc0I7O2lDQStCeEIsbUJBQUEsR0FBcUIsU0FBQyxpQkFBRCxFQUFvQixTQUFwQixFQUErQixPQUEvQjtBQUNuQixVQUFBO01BQUEsU0FBQSxHQUFnQixJQUFBLEtBQUEsQ0FBTSxpQkFBaUIsQ0FBQyxRQUFsQixDQUEyQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQTNCLENBQU4sRUFBMEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBZixDQUFBLENBQTFDO01BQ2hCLGVBQUEsR0FBa0I7TUFDbEIsYUFBQSxHQUFnQjtNQUNoQixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLFdBQVksQ0FBQSxTQUFBLENBQXRDLEVBQWtELFNBQWxELEVBQTZELFNBQUMsTUFBRDtBQUMzRCxnQkFBTyxNQUFNLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBcEI7QUFBQSxlQUNPLFNBRFA7bUJBRUksYUFBQTtBQUZKLGVBR08sT0FIUDtZQUlJLGFBQUE7WUFDQSxJQUFHLGFBQUEsR0FBZ0IsQ0FBbkI7Y0FDRSxlQUFBLEdBQWtCLE1BQU0sQ0FBQyxLQUFLLENBQUM7cUJBQy9CLE1BQU0sQ0FBQyxJQUFQLENBQUEsRUFGRjs7QUFMSjtNQUQyRCxDQUE3RDthQVVBO0lBZG1COztpQ0FnQnJCLHFCQUFBLEdBQXVCLFNBQUMsZUFBRCxFQUFrQixTQUFsQixFQUE2QixPQUE3QjtBQUNyQixVQUFBO01BQUEsU0FBQSxHQUFnQixJQUFBLEtBQUEsQ0FBTSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQU4sRUFBYyxlQUFkO01BQ2hCLGlCQUFBLEdBQW9CO01BQ3BCLGFBQUEsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQywwQkFBUixDQUFtQyxXQUFZLENBQUEsU0FBQSxDQUEvQyxFQUEyRCxTQUEzRCxFQUFzRSxTQUFDLE1BQUQ7QUFDcEUsZ0JBQU8sTUFBTSxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQXBCO0FBQUEsZUFDTyxTQURQO1lBRUksYUFBQTtZQUNBLElBQUcsYUFBQSxHQUFnQixDQUFuQjtjQUNFLGlCQUFBLEdBQW9CLE1BQU0sQ0FBQyxLQUFLLENBQUM7cUJBQ2pDLE1BQU0sQ0FBQyxJQUFQLENBQUEsRUFGRjs7QUFGRztBQURQLGVBTU8sT0FOUDttQkFPSSxhQUFBO0FBUEo7TUFEb0UsQ0FBdEU7YUFTQTtJQWJxQjs7aUNBZXZCLGdCQUFBLEdBQWtCLFNBQUMsY0FBRDtBQUNoQixVQUFBO01BQUEsU0FBQSxHQUFnQixJQUFBLEtBQUEsQ0FBTSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQU4sRUFBYyxjQUFkO01BQ2hCLFNBQUEsR0FBWSxDQUFDLENBQUMsWUFBRixDQUFlLENBQUMsQ0FBQyxJQUFGLENBQU8sZ0JBQVAsQ0FBd0IsQ0FBQyxJQUF6QixDQUE4QixFQUE5QixDQUFmO01BQ1osT0FBQSxHQUFVLENBQUMsQ0FBQyxZQUFGLENBQWUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxjQUFQLENBQXNCLENBQUMsSUFBdkIsQ0FBNEIsRUFBNUIsQ0FBZjtNQUNWLGNBQUEsR0FBcUIsSUFBQSxNQUFBLENBQU8sR0FBQSxHQUFJLFNBQUosR0FBZ0IsT0FBaEIsR0FBd0IsR0FBL0IsRUFBbUMsR0FBbkM7TUFDckIsZUFBQSxHQUFzQixJQUFBLE1BQUEsQ0FBTyxHQUFBLEdBQUksU0FBSixHQUFjLEdBQXJCLEVBQXlCLEdBQXpCO01BQ3RCLGFBQUEsR0FBb0IsSUFBQSxNQUFBLENBQU8sR0FBQSxHQUFJLE9BQUosR0FBWSxHQUFuQixFQUF1QixHQUF2QjtNQUNwQixhQUFBLEdBQWdCO01BQ2hCLGFBQUEsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQywwQkFBUixDQUFtQyxjQUFuQyxFQUFtRCxTQUFuRCxFQUE4RCxTQUFDLE1BQUQ7UUFDNUQsSUFBRyxNQUFNLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQWhCLENBQXNCLGFBQXRCLENBQUg7aUJBQ0UsYUFBQSxHQURGO1NBQUEsTUFFSyxJQUFHLE1BQU0sQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBaEIsQ0FBc0IsZUFBdEIsQ0FBSDtVQUNILGFBQUE7VUFDQSxJQUFHLGFBQUEsR0FBZ0IsQ0FBbkI7WUFDRSxhQUFBLEdBQWdCLE1BQU0sQ0FBQyxLQUFLLENBQUM7bUJBQzdCLE1BQU0sQ0FBQyxJQUFQLENBQUEsRUFGRjtXQUZHOztNQUh1RCxDQUE5RDthQVFDO0lBakJlOztpQ0FtQmxCLFlBQUEsR0FBYyxTQUFDLFdBQUQ7QUFDWixVQUFBO01BQUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUF3QixXQUF4QjtNQUNULElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixNQUF2QixFQUErQjtRQUFBLElBQUEsRUFBTSxXQUFOO1FBQW1CLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQTFCO1FBQTZDLHFCQUFBLEVBQXVCLGlCQUFwRTtPQUEvQjthQUNBO0lBSFk7O2lDQUtkLGVBQUEsR0FBaUIsU0FBQyxPQUFEO0FBQ2YsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUE7TUFDWCxXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLEtBQUssQ0FBQyxrQkFBTixDQUF5QixRQUF6QixFQUFtQyxDQUFuQyxFQUFzQyxDQUF0QyxDQUF2QjtNQUNkLElBQUEsQ0FBTyxPQUFRLENBQUEsV0FBQSxDQUFmO1FBQ0UsUUFBQSxHQUFXLFFBQVEsQ0FBQyxRQUFULENBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFsQjtRQUNYLFdBQUEsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsS0FBSyxDQUFDLGtCQUFOLENBQXlCLFFBQXpCLEVBQW1DLENBQW5DLEVBQXNDLENBQXRDLENBQXZCLEVBRmhCOztNQUdBLElBQUcsWUFBQSxHQUFlLE9BQVEsQ0FBQSxXQUFBLENBQTFCO2VBQ0U7VUFBQyxVQUFBLFFBQUQ7VUFBVyxhQUFBLFdBQVg7VUFBd0IsY0FBQSxZQUF4QjtVQURGO09BQUEsTUFBQTtlQUdFLEdBSEY7O0lBTmU7O2lDQVdqQixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxJQUFBLENBQW1DLElBQUMsQ0FBQSxlQUFwQztBQUFBLGVBQU8sSUFBQyxDQUFBLGlCQUFELENBQUEsRUFBUDs7TUFDQSxRQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBO01BRVgsSUFBRyxJQUFDLENBQUEsY0FBSjtRQUNFLFVBQUEsR0FBYSxJQUFDLENBQUEsV0FBVyxDQUFDLGNBQWIsQ0FBQTtRQUNiLFNBQUEsR0FBWSxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQWYsR0FBd0IsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUNyRCxRQUFBLEdBQVcsSUFBQyxDQUFBLFNBQVMsQ0FBQyxjQUFYLENBQUE7UUFDWCxJQUFHLFVBQVUsQ0FBQyxPQUFYLENBQW1CLFFBQW5CLENBQUEsR0FBK0IsQ0FBbEM7VUFDRSxNQUF5QixDQUFDLFFBQUQsRUFBVyxVQUFYLENBQXpCLEVBQUMsbUJBQUQsRUFBYSxrQkFEZjs7UUFJQSxVQUFBLEdBQWlCLElBQUEsS0FBQSxDQUFNLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBakIsQ0FBMEIsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQTFCLENBQU4sRUFBMEMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFiLENBQXNCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUF0QixDQUExQztRQUVqQixRQUFBLEdBQWUsSUFBQSxLQUFBLENBQU0sUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFmLENBQXdCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUF4QixDQUFOLEVBQXdDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBYixDQUFzQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBdEIsQ0FBeEM7UUFFZixJQUFHLFFBQVEsQ0FBQyxVQUFULENBQW9CLFFBQVEsQ0FBQyxLQUE3QixDQUFIO1VBQ0Usa0JBQUEsR0FBcUIsUUFBUSxDQUFDLE1BQVQsR0FBa0IsVUFBVSxDQUFDLEtBQUssQ0FBQztVQUN4RCxJQUF3QixrQkFBQSxHQUFxQixDQUE3QztZQUFBLGtCQUFBLEdBQUE7O1VBQ0Esa0JBQUEsR0FBcUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxrQkFBVCxFQUE2QixTQUFBLEdBQVksQ0FBekM7aUJBQ3JCLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFmLENBQXdCLENBQUMsQ0FBRCxFQUFJLGtCQUFKLENBQXhCLENBQWhDLEVBSkY7U0FBQSxNQUFBO1VBTUUsa0JBQUEsR0FBcUIsUUFBUSxDQUFDLE1BQVQsR0FBa0IsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUN0RCxJQUF3QixrQkFBQSxHQUFxQixDQUE3QztZQUFBLGtCQUFBLEdBQUE7O1VBQ0Esa0JBQUEsR0FBcUIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxrQkFBVCxFQUE2QixTQUFBLEdBQVksQ0FBekM7aUJBQ3JCLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFqQixDQUEwQixDQUFDLENBQUQsRUFBSSxrQkFBSixDQUExQixDQUFoQyxFQVRGO1NBWkY7T0FBQSxNQUFBO1FBdUJFLGdCQUFBLEdBQW1CLFFBQVEsQ0FBQyxRQUFULENBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFsQjtRQUNuQixhQUFBLEdBQWdCLElBQUMsQ0FBQSxXQUFXLENBQUMsc0JBQWIsQ0FBQTtRQUNoQixXQUFBLEdBQWMsSUFBQyxDQUFBLFNBQVMsQ0FBQyxzQkFBWCxDQUFBO1FBRWQsSUFBRyxRQUFRLENBQUMsT0FBVCxDQUFpQixhQUFqQixDQUFIO2lCQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsV0FBVyxDQUFDLFFBQVosQ0FBcUIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFyQixDQUFoQyxFQURGO1NBQUEsTUFFSyxJQUFHLGdCQUFnQixDQUFDLE9BQWpCLENBQXlCLGFBQXpCLENBQUg7aUJBQ0gsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxXQUFoQyxFQURHO1NBQUEsTUFFQSxJQUFHLFFBQVEsQ0FBQyxPQUFULENBQWlCLFdBQWpCLENBQUg7aUJBQ0gsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxhQUFhLENBQUMsUUFBZCxDQUF1QixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXZCLENBQWhDLEVBREc7U0FBQSxNQUVBLElBQUcsZ0JBQWdCLENBQUMsT0FBakIsQ0FBeUIsV0FBekIsQ0FBSDtpQkFDSCxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLGFBQWhDLEVBREc7U0FqQ1A7O0lBSmdCOztpQ0F3Q2xCLGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLElBQVUsSUFBQyxDQUFBLGVBQVg7QUFBQSxlQUFBOztNQUVBLElBQUcsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBLENBQWxCLENBQW5CO2VBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxhQUFoQyxFQURGO09BQUEsTUFFSyxJQUFHLElBQUEsR0FBTyxJQUFDLENBQUEsU0FBUyxDQUFDLGlCQUFYLENBQUEsQ0FBVjtRQUNGLDRCQUFELEVBQWE7UUFDYixJQUFHLFVBQVUsQ0FBQyxPQUFYLENBQW1CLFFBQW5CLENBQUEsR0FBK0IsQ0FBbEM7VUFDRSxNQUF5QixDQUFDLFFBQUQsRUFBVyxVQUFYLENBQXpCLEVBQUMsbUJBQUQsRUFBYSxrQkFEZjs7ZUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBaEQsRUFKRzs7SUFMWTs7aUNBV25CLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGVBQUo7UUFDRSxVQUFBLEdBQWEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxjQUFiLENBQUE7UUFDYixRQUFBLEdBQVcsSUFBQyxDQUFBLFNBQVMsQ0FBQyxjQUFYLENBQUE7UUFFWCxJQUFHLFVBQVUsQ0FBQyxPQUFYLENBQW1CLFFBQW5CLENBQUEsR0FBK0IsQ0FBbEM7VUFDRSxNQUF5QixDQUFDLFFBQUQsRUFBVyxVQUFYLENBQXpCLEVBQUMsbUJBQUQsRUFBYSxrQkFEZjs7UUFHQSxJQUFHLElBQUMsQ0FBQSxjQUFKO1VBQ0UsYUFBQSxHQUFnQixVQUFVLENBQUM7VUFDM0IsV0FBQSxHQUFjLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBZixDQUF3QixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBeEIsRUFGaEI7U0FBQSxNQUFBO1VBSUUsYUFBQSxHQUFnQixVQUFVLENBQUM7VUFDM0IsV0FBQSxHQUFjLFFBQVEsQ0FBQyxNQUx6QjtTQVBGO09BQUEsTUFBQTtRQWNFLElBQUcsYUFBQSxHQUFnQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBLENBQWxCLENBQW5CO1VBQ0UsU0FBQSxHQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixLQUFLLENBQUMsa0JBQU4sQ0FBeUIsYUFBekIsRUFBd0MsQ0FBeEMsRUFBMkMsQ0FBM0MsQ0FBdkI7VUFDWixXQUFBLEdBQWMsSUFBQyxDQUFBLG1CQUFELENBQXFCLGFBQXJCLEVBQW9DLFNBQXBDLEVBQStDLGdCQUFpQixDQUFBLFNBQUEsQ0FBaEUsRUFGaEI7U0FBQSxNQUdLLElBQUcsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFTLENBQUMsaUJBQVgsQ0FBQSxDQUFWO1VBQ0YsNEJBQUQsRUFBYTtVQUNiLElBQUcsVUFBVSxDQUFDLE9BQVgsQ0FBbUIsUUFBbkIsQ0FBQSxHQUErQixDQUFsQztZQUNFLE9BQXlCLENBQUMsUUFBRCxFQUFXLFVBQVgsQ0FBekIsRUFBQyxvQkFBRCxFQUFhLG1CQURmOztVQUVBLGFBQUEsR0FBZ0IsVUFBVSxDQUFDO1VBQzNCLFdBQUEsR0FBYyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQWYsQ0FBd0IsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQXhCLEVBTFg7U0FqQlA7O01Bd0JBLElBQUcsdUJBQUEsSUFBbUIscUJBQXRCO1FBQ0UsYUFBQSxHQUFvQixJQUFBLEtBQUEsQ0FBTSxhQUFhLENBQUMsUUFBZCxDQUF1QixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXZCLENBQU4sRUFBc0MsV0FBdEM7ZUFDcEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxzQkFBUixDQUErQixhQUEvQixFQUZGOztJQXpCZ0I7O2lDQStCbEIsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUE7TUFDakIsVUFBQSxHQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBLENBQW1CLENBQUMsUUFBcEIsQ0FBQTtNQUNiLFdBQUEsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsY0FBVCxDQUE3QjtNQUNkLFlBQUEsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLENBQUMsY0FBRCxFQUFpQixDQUFDLEtBQUQsRUFBVyxLQUFYLENBQWpCLENBQTdCO01BRWYsSUFBRyxHQUFBLEdBQU0sSUFBQyxDQUFBLFNBQVMsQ0FBQyxzQkFBWCxDQUFrQyxXQUFsQyxFQUErQyxZQUEvQyxDQUFUO2VBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQW1CLElBQUEsR0FBSyxHQUFMLEdBQVMsR0FBNUIsRUFERjs7SUFOUTs7Ozs7QUE1UloiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuVGFnRmluZGVyID0gcmVxdWlyZSAnLi90YWctZmluZGVyJ1xuXG5zdGFydFBhaXJNYXRjaGVzID1cbiAgJygnOiAnKSdcbiAgJ1snOiAnXSdcbiAgJ3snOiAnfSdcblxuZW5kUGFpck1hdGNoZXMgPVxuICAnKSc6ICcoJ1xuICAnXSc6ICdbJ1xuICAnfSc6ICd7J1xuXG5wYWlyUmVnZXhlcyA9IHt9XG5mb3Igc3RhcnRQYWlyLCBlbmRQYWlyIG9mIHN0YXJ0UGFpck1hdGNoZXNcbiAgcGFpclJlZ2V4ZXNbc3RhcnRQYWlyXSA9IG5ldyBSZWdFeHAoXCJbI3tfLmVzY2FwZVJlZ0V4cChzdGFydFBhaXIgKyBlbmRQYWlyKX1dXCIsICdnJylcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnJhY2tldE1hdGNoZXJWaWV3XG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgZWRpdG9yRWxlbWVudCkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHRhZ0ZpbmRlciA9IG5ldyBUYWdGaW5kZXIoQGVkaXRvcilcbiAgICBAcGFpckhpZ2hsaWdodGVkID0gZmFsc2VcbiAgICBAdGFnSGlnaGxpZ2h0ZWQgPSBmYWxzZVxuXG4gICAgIyBUT0RPOiByZW1vdmUgY29uZGl0aW9uYWwgd2hlbiBgb25EaWRDaGFuZ2VUZXh0YCBzaGlwcyBvbiBzdGFibGUuXG4gICAgaWYgdHlwZW9mIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2VUZXh0IGlzIFwiZnVuY3Rpb25cIlxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2VUZXh0ID0+XG4gICAgICAgIEB1cGRhdGVNYXRjaCgpXG4gICAgZWxzZVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2UgPT5cbiAgICAgICAgQHVwZGF0ZU1hdGNoKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hciA9PlxuICAgICAgQHVwZGF0ZU1hdGNoKClcblxuICAgIEBzdWJzY3JpYmVUb0N1cnNvcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgZWRpdG9yRWxlbWVudCwgJ2JyYWNrZXQtbWF0Y2hlcjpnby10by1tYXRjaGluZy1icmFja2V0JywgPT5cbiAgICAgIEBnb1RvTWF0Y2hpbmdQYWlyKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JFbGVtZW50LCAnYnJhY2tldC1tYXRjaGVyOmdvLXRvLWVuY2xvc2luZy1icmFja2V0JywgPT5cbiAgICAgIEBnb1RvRW5jbG9zaW5nUGFpcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgZWRpdG9yRWxlbWVudCwgJ2JyYWNrZXQtbWF0Y2hlcjpzZWxlY3QtaW5zaWRlLWJyYWNrZXRzJywgPT5cbiAgICAgIEBzZWxlY3RJbnNpZGVQYWlyKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JFbGVtZW50LCAnYnJhY2tldC1tYXRjaGVyOmNsb3NlLXRhZycsID0+XG4gICAgICBAY2xvc2VUYWcoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIGVkaXRvckVsZW1lbnQsICdicmFja2V0LW1hdGNoZXI6cmVtb3ZlLW1hdGNoaW5nLWJyYWNrZXRzJywgPT5cbiAgICAgIEByZW1vdmVNYXRjaGluZ0JyYWNrZXRzKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkRGVzdHJveSBAZGVzdHJveVxuXG4gICAgQHVwZGF0ZU1hdGNoKClcblxuICBkZXN0cm95OiA9PlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIHN1YnNjcmliZVRvQ3Vyc29yOiAtPlxuICAgIGN1cnNvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgcmV0dXJuIHVubGVzcyBjdXJzb3I/XG5cbiAgICBjdXJzb3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBjdXJzb3JTdWJzY3JpcHRpb25zLmFkZCBjdXJzb3Iub25EaWRDaGFuZ2VQb3NpdGlvbiAoe3RleHRDaGFuZ2VkfSkgPT5cbiAgICAgIEB1cGRhdGVNYXRjaCgpIHVubGVzcyB0ZXh0Q2hhbmdlZFxuXG4gICAgY3Vyc29yU3Vic2NyaXB0aW9ucy5hZGQgY3Vyc29yLm9uRGlkRGVzdHJveSA9PlxuICAgICAgY3Vyc29yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIEBzdWJzY3JpYmVUb0N1cnNvcigpXG4gICAgICBAdXBkYXRlTWF0Y2goKSBpZiBAZWRpdG9yLmlzQWxpdmUoKVxuXG4gIHVwZGF0ZU1hdGNoOiAtPlxuICAgIGlmIEBwYWlySGlnaGxpZ2h0ZWRcbiAgICAgIEBlZGl0b3IuZGVzdHJveU1hcmtlcihAc3RhcnRNYXJrZXIuaWQpXG4gICAgICBAZWRpdG9yLmRlc3Ryb3lNYXJrZXIoQGVuZE1hcmtlci5pZClcblxuICAgIEBwYWlySGlnaGxpZ2h0ZWQgPSBmYWxzZVxuICAgIEB0YWdIaWdobGlnaHRlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gdW5sZXNzIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmlzRW1wdHkoKVxuICAgIHJldHVybiBpZiBAZWRpdG9yLmlzRm9sZGVkQXRDdXJzb3JSb3coKVxuXG4gICAge3Bvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyfSA9IEBmaW5kQ3VycmVudFBhaXIoc3RhcnRQYWlyTWF0Y2hlcylcbiAgICBpZiBwb3NpdGlvblxuICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdFbmRQYWlyKHBvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyKVxuICAgIGVsc2VcbiAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn0gPSBAZmluZEN1cnJlbnRQYWlyKGVuZFBhaXJNYXRjaGVzKVxuICAgICAgaWYgcG9zaXRpb25cbiAgICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdTdGFydFBhaXIocG9zaXRpb24sIG1hdGNoaW5nUGFpciwgY3VycmVudFBhaXIpXG5cbiAgICBpZiBwb3NpdGlvbj8gYW5kIG1hdGNoUG9zaXRpb24/XG4gICAgICBAc3RhcnRNYXJrZXIgPSBAY3JlYXRlTWFya2VyKFtwb3NpdGlvbiwgcG9zaXRpb24udHJhdmVyc2UoWzAsIDFdKV0pXG4gICAgICBAZW5kTWFya2VyID0gQGNyZWF0ZU1hcmtlcihbbWF0Y2hQb3NpdGlvbiwgbWF0Y2hQb3NpdGlvbi50cmF2ZXJzZShbMCwgMV0pXSlcbiAgICAgIEBwYWlySGlnaGxpZ2h0ZWQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgaWYgcGFpciA9IEB0YWdGaW5kZXIuZmluZE1hdGNoaW5nVGFncygpXG4gICAgICAgIEBzdGFydE1hcmtlciA9IEBjcmVhdGVNYXJrZXIocGFpci5zdGFydFJhbmdlKVxuICAgICAgICBAZW5kTWFya2VyID0gQGNyZWF0ZU1hcmtlcihwYWlyLmVuZFJhbmdlKVxuICAgICAgICBAcGFpckhpZ2hsaWdodGVkID0gdHJ1ZVxuICAgICAgICBAdGFnSGlnaGxpZ2h0ZWQgPSB0cnVlXG5cbiAgcmVtb3ZlTWF0Y2hpbmdCcmFja2V0czogLT5cbiAgICByZXR1cm4gQGVkaXRvci5iYWNrc3BhY2UoKSBpZiBAZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpXG5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAZWRpdG9yLnNlbGVjdExlZnQoKSBpZiBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICAgIHRleHQgPSBAZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG5cbiAgICAgICNjaGVjayBpZiB0aGUgY2hhcmFjdGVyIHRvIHRoZSBsZWZ0IGlzIHBhcnQgb2YgYSBwYWlyXG4gICAgICBpZiBzdGFydFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KHRleHQpIG9yIGVuZFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KHRleHQpXG4gICAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn0gPSBAZmluZEN1cnJlbnRQYWlyKHN0YXJ0UGFpck1hdGNoZXMpXG4gICAgICAgIGlmIHBvc2l0aW9uXG4gICAgICAgICAgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kTWF0Y2hpbmdFbmRQYWlyKHBvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyKVxuICAgICAgICBlbHNlXG4gICAgICAgICAge3Bvc2l0aW9uLCBjdXJyZW50UGFpciwgbWF0Y2hpbmdQYWlyfSA9IEBmaW5kQ3VycmVudFBhaXIoZW5kUGFpck1hdGNoZXMpXG4gICAgICAgICAgaWYgcG9zaXRpb25cbiAgICAgICAgICAgIG1hdGNoUG9zaXRpb24gPSBAZmluZE1hdGNoaW5nU3RhcnRQYWlyKHBvc2l0aW9uLCBtYXRjaGluZ1BhaXIsIGN1cnJlbnRQYWlyKVxuXG4gICAgICAgIGlmIHBvc2l0aW9uPyBhbmQgbWF0Y2hQb3NpdGlvbj9cbiAgICAgICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKG1hdGNoUG9zaXRpb24pXG4gICAgICAgICAgQGVkaXRvci5kZWxldGUoKVxuICAgICAgICAgICMgaWYgb24gdGhlIHNhbWUgbGluZSBhbmQgdGhlIGN1cnNvciBpcyBpbiBmcm9udCBvZiBhbiBlbmQgcGFpclxuICAgICAgICAgICMgb2Zmc2V0IGJ5IG9uZSB0byBtYWtlIHVwIGZvciB0aGUgbWlzc2luZyBjaGFyYWN0ZXJcbiAgICAgICAgICBpZiBwb3NpdGlvbi5yb3cgaXMgbWF0Y2hQb3NpdGlvbi5yb3cgYW5kIGVuZFBhaXJNYXRjaGVzLmhhc093blByb3BlcnR5KGN1cnJlbnRQYWlyKVxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbi50cmF2ZXJzZShbMCwgLTFdKVxuICAgICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG4gICAgICAgICAgQGVkaXRvci5kZWxldGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgZWxzZVxuICAgICAgICBAZWRpdG9yLmJhY2tzcGFjZSgpXG5cbiAgZmluZE1hdGNoaW5nRW5kUGFpcjogKHN0YXJ0UGFpclBvc2l0aW9uLCBzdGFydFBhaXIsIGVuZFBhaXIpIC0+XG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKHN0YXJ0UGFpclBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSksIEBlZGl0b3IuYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpXG4gICAgZW5kUGFpclBvc2l0aW9uID0gbnVsbFxuICAgIHVucGFpcmVkQ291bnQgPSAwXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYWlyUmVnZXhlc1tzdGFydFBhaXJdLCBzY2FuUmFuZ2UsIChyZXN1bHQpIC0+XG4gICAgICBzd2l0Y2ggcmVzdWx0Lm1hdGNoWzBdXG4gICAgICAgIHdoZW4gc3RhcnRQYWlyXG4gICAgICAgICAgdW5wYWlyZWRDb3VudCsrXG4gICAgICAgIHdoZW4gZW5kUGFpclxuICAgICAgICAgIHVucGFpcmVkQ291bnQtLVxuICAgICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgICBlbmRQYWlyUG9zaXRpb24gPSByZXN1bHQucmFuZ2Uuc3RhcnRcbiAgICAgICAgICAgIHJlc3VsdC5zdG9wKClcblxuICAgIGVuZFBhaXJQb3NpdGlvblxuXG4gIGZpbmRNYXRjaGluZ1N0YXJ0UGFpcjogKGVuZFBhaXJQb3NpdGlvbiwgc3RhcnRQYWlyLCBlbmRQYWlyKSAtPlxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShbMCwgMF0sIGVuZFBhaXJQb3NpdGlvbilcbiAgICBzdGFydFBhaXJQb3NpdGlvbiA9IG51bGxcbiAgICB1bnBhaXJlZENvdW50ID0gMFxuICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcGFpclJlZ2V4ZXNbc3RhcnRQYWlyXSwgc2NhblJhbmdlLCAocmVzdWx0KSAtPlxuICAgICAgc3dpdGNoIHJlc3VsdC5tYXRjaFswXVxuICAgICAgICB3aGVuIHN0YXJ0UGFpclxuICAgICAgICAgIHVucGFpcmVkQ291bnQtLVxuICAgICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgICBzdGFydFBhaXJQb3NpdGlvbiA9IHJlc3VsdC5yYW5nZS5zdGFydFxuICAgICAgICAgICAgcmVzdWx0LnN0b3AoKVxuICAgICAgICB3aGVuIGVuZFBhaXJcbiAgICAgICAgICB1bnBhaXJlZENvdW50KytcbiAgICBzdGFydFBhaXJQb3NpdGlvblxuXG4gIGZpbmRBbnlTdGFydFBhaXI6IChjdXJzb3JQb3NpdGlvbikgLT5cbiAgICBzY2FuUmFuZ2UgPSBuZXcgUmFuZ2UoWzAsIDBdLCBjdXJzb3JQb3NpdGlvbilcbiAgICBzdGFydFBhaXIgPSBfLmVzY2FwZVJlZ0V4cChfLmtleXMoc3RhcnRQYWlyTWF0Y2hlcykuam9pbignJykpXG4gICAgZW5kUGFpciA9IF8uZXNjYXBlUmVnRXhwKF8ua2V5cyhlbmRQYWlyTWF0Y2hlcykuam9pbignJykpXG4gICAgY29tYmluZWRSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7c3RhcnRQYWlyfSN7ZW5kUGFpcn1dXCIsICdnJylcbiAgICBzdGFydFBhaXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7c3RhcnRQYWlyfV1cIiwgJ2cnKVxuICAgIGVuZFBhaXJSZWdFeHAgPSBuZXcgUmVnRXhwKFwiWyN7ZW5kUGFpcn1dXCIsICdnJylcbiAgICBzdGFydFBvc2l0aW9uID0gbnVsbFxuICAgIHVucGFpcmVkQ291bnQgPSAwXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBjb21iaW5lZFJlZ0V4cCwgc2NhblJhbmdlLCAocmVzdWx0KSAtPlxuICAgICAgaWYgcmVzdWx0Lm1hdGNoWzBdLm1hdGNoKGVuZFBhaXJSZWdFeHApXG4gICAgICAgIHVucGFpcmVkQ291bnQrK1xuICAgICAgZWxzZSBpZiByZXN1bHQubWF0Y2hbMF0ubWF0Y2goc3RhcnRQYWlyUmVnRXhwKVxuICAgICAgICB1bnBhaXJlZENvdW50LS1cbiAgICAgICAgaWYgdW5wYWlyZWRDb3VudCA8IDBcbiAgICAgICAgICBzdGFydFBvc2l0aW9uID0gcmVzdWx0LnJhbmdlLnN0YXJ0XG4gICAgICAgICAgcmVzdWx0LnN0b3AoKVxuICAgICBzdGFydFBvc2l0aW9uXG5cbiAgY3JlYXRlTWFya2VyOiAoYnVmZmVyUmFuZ2UpIC0+XG4gICAgbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoYnVmZmVyUmFuZ2UpXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2JyYWNrZXQtbWF0Y2hlcicsIGRlcHJlY2F0ZWRSZWdpb25DbGFzczogJ2JyYWNrZXQtbWF0Y2hlcicpXG4gICAgbWFya2VyXG5cbiAgZmluZEN1cnJlbnRQYWlyOiAobWF0Y2hlcykgLT5cbiAgICBwb3NpdGlvbiA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnJlbnRQYWlyID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9zaXRpb24sIDAsIDEpKVxuICAgIHVubGVzcyBtYXRjaGVzW2N1cnJlbnRQYWlyXVxuICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbi50cmF2ZXJzZShbMCwgLTFdKVxuICAgICAgY3VycmVudFBhaXIgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShwb3NpdGlvbiwgMCwgMSkpXG4gICAgaWYgbWF0Y2hpbmdQYWlyID0gbWF0Y2hlc1tjdXJyZW50UGFpcl1cbiAgICAgIHtwb3NpdGlvbiwgY3VycmVudFBhaXIsIG1hdGNoaW5nUGFpcn1cbiAgICBlbHNlXG4gICAgICB7fVxuXG4gIGdvVG9NYXRjaGluZ1BhaXI6IC0+XG4gICAgcmV0dXJuIEBnb1RvRW5jbG9zaW5nUGFpcigpIHVubGVzcyBAcGFpckhpZ2hsaWdodGVkXG4gICAgcG9zaXRpb24gPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmIEB0YWdIaWdobGlnaHRlZFxuICAgICAgc3RhcnRSYW5nZSA9IEBzdGFydE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICB0YWdMZW5ndGggPSBzdGFydFJhbmdlLmVuZC5jb2x1bW4gLSBzdGFydFJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgZW5kUmFuZ2UgPSBAZW5kTWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIGlmIHN0YXJ0UmFuZ2UuY29tcGFyZShlbmRSYW5nZSkgPiAwXG4gICAgICAgIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSBbZW5kUmFuZ2UsIHN0YXJ0UmFuZ2VdXG5cbiAgICAgICMgaW5jbHVkZSB0aGUgPFxuICAgICAgc3RhcnRSYW5nZSA9IG5ldyBSYW5nZShzdGFydFJhbmdlLnN0YXJ0LnRyYXZlcnNlKFswLCAtMV0pLCBlbmRSYW5nZS5lbmQudHJhdmVyc2UoWzAsIC0xXSkpXG4gICAgICAjIGluY2x1ZGUgdGhlIDwvXG4gICAgICBlbmRSYW5nZSA9IG5ldyBSYW5nZShlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSwgZW5kUmFuZ2UuZW5kLnRyYXZlcnNlKFswLCAtMl0pKVxuXG4gICAgICBpZiBwb3NpdGlvbi5pc0xlc3NUaGFuKGVuZFJhbmdlLnN0YXJ0KVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBwb3NpdGlvbi5jb2x1bW4gLSBzdGFydFJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQrKyBpZiB0YWdDaGFyYWN0ZXJPZmZzZXQgPiAwXG4gICAgICAgIHRhZ0NoYXJhY3Rlck9mZnNldCA9IE1hdGgubWluKHRhZ0NoYXJhY3Rlck9mZnNldCwgdGFnTGVuZ3RoICsgMikgIyBpbmNsdWRlIDwvXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUmFuZ2Uuc3RhcnQudHJhdmVyc2UoWzAsIHRhZ0NoYXJhY3Rlck9mZnNldF0pKVxuICAgICAgZWxzZVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBwb3NpdGlvbi5jb2x1bW4gLSBlbmRSYW5nZS5zdGFydC5jb2x1bW5cbiAgICAgICAgdGFnQ2hhcmFjdGVyT2Zmc2V0LS0gaWYgdGFnQ2hhcmFjdGVyT2Zmc2V0ID4gMVxuICAgICAgICB0YWdDaGFyYWN0ZXJPZmZzZXQgPSBNYXRoLm1pbih0YWdDaGFyYWN0ZXJPZmZzZXQsIHRhZ0xlbmd0aCArIDEpICMgaW5jbHVkZSA8XG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgdGFnQ2hhcmFjdGVyT2Zmc2V0XSkpXG4gICAgZWxzZVxuICAgICAgcHJldmlvdXNQb3NpdGlvbiA9IHBvc2l0aW9uLnRyYXZlcnNlKFswLCAtMV0pXG4gICAgICBzdGFydFBvc2l0aW9uID0gQHN0YXJ0TWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgZW5kUG9zaXRpb24gPSBAZW5kTWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgICBpZiBwb3NpdGlvbi5pc0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUG9zaXRpb24udHJhdmVyc2UoWzAsIDFdKSlcbiAgICAgIGVsc2UgaWYgcHJldmlvdXNQb3NpdGlvbi5pc0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oZW5kUG9zaXRpb24pXG4gICAgICBlbHNlIGlmIHBvc2l0aW9uLmlzRXF1YWwoZW5kUG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRQb3NpdGlvbi50cmF2ZXJzZShbMCwgMV0pKVxuICAgICAgZWxzZSBpZiBwcmV2aW91c1Bvc2l0aW9uLmlzRXF1YWwoZW5kUG9zaXRpb24pXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oc3RhcnRQb3NpdGlvbilcblxuICBnb1RvRW5jbG9zaW5nUGFpcjogLT5cbiAgICByZXR1cm4gaWYgQHBhaXJIaWdobGlnaHRlZFxuXG4gICAgaWYgbWF0Y2hQb3NpdGlvbiA9IEBmaW5kQW55U3RhcnRQYWlyKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24obWF0Y2hQb3NpdGlvbilcbiAgICBlbHNlIGlmIHBhaXIgPSBAdGFnRmluZGVyLmZpbmRFbmNsb3NpbmdUYWdzKClcbiAgICAgIHtzdGFydFJhbmdlLCBlbmRSYW5nZX0gPSBwYWlyXG4gICAgICBpZiBzdGFydFJhbmdlLmNvbXBhcmUoZW5kUmFuZ2UpID4gMFxuICAgICAgICBbc3RhcnRSYW5nZSwgZW5kUmFuZ2VdID0gW2VuZFJhbmdlLCBzdGFydFJhbmdlXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihwYWlyLnN0YXJ0UmFuZ2Uuc3RhcnQpXG5cbiAgc2VsZWN0SW5zaWRlUGFpcjogLT5cbiAgICBpZiBAcGFpckhpZ2hsaWdodGVkXG4gICAgICBzdGFydFJhbmdlID0gQHN0YXJ0TWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIGVuZFJhbmdlID0gQGVuZE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgICAgIGlmIHN0YXJ0UmFuZ2UuY29tcGFyZShlbmRSYW5nZSkgPiAwXG4gICAgICAgIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSBbZW5kUmFuZ2UsIHN0YXJ0UmFuZ2VdXG5cbiAgICAgIGlmIEB0YWdIaWdobGlnaHRlZFxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5lbmRcbiAgICAgICAgZW5kUG9zaXRpb24gPSBlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSAjIERvbid0IHNlbGVjdCA8L1xuICAgICAgZWxzZVxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5zdGFydFxuICAgICAgICBlbmRQb3NpdGlvbiA9IGVuZFJhbmdlLnN0YXJ0XG4gICAgZWxzZVxuICAgICAgaWYgc3RhcnRQb3NpdGlvbiA9IEBmaW5kQW55U3RhcnRQYWlyKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgc3RhcnRQYWlyID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoc3RhcnRQb3NpdGlvbiwgMCwgMSkpXG4gICAgICAgIGVuZFBvc2l0aW9uID0gQGZpbmRNYXRjaGluZ0VuZFBhaXIoc3RhcnRQb3NpdGlvbiwgc3RhcnRQYWlyLCBzdGFydFBhaXJNYXRjaGVzW3N0YXJ0UGFpcl0pXG4gICAgICBlbHNlIGlmIHBhaXIgPSBAdGFnRmluZGVyLmZpbmRFbmNsb3NpbmdUYWdzKClcbiAgICAgICAge3N0YXJ0UmFuZ2UsIGVuZFJhbmdlfSA9IHBhaXJcbiAgICAgICAgaWYgc3RhcnRSYW5nZS5jb21wYXJlKGVuZFJhbmdlKSA+IDBcbiAgICAgICAgICBbc3RhcnRSYW5nZSwgZW5kUmFuZ2VdID0gW2VuZFJhbmdlLCBzdGFydFJhbmdlXVxuICAgICAgICBzdGFydFBvc2l0aW9uID0gc3RhcnRSYW5nZS5lbmRcbiAgICAgICAgZW5kUG9zaXRpb24gPSBlbmRSYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgLTJdKSAjIERvbid0IHNlbGVjdCA8L1xuXG4gICAgaWYgc3RhcnRQb3NpdGlvbj8gYW5kIGVuZFBvc2l0aW9uP1xuICAgICAgcmFuZ2VUb1NlbGVjdCA9IG5ldyBSYW5nZShzdGFydFBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSksIGVuZFBvc2l0aW9uKVxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlVG9TZWxlY3QpXG5cbiAgIyBJbnNlcnQgYXQgdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uIGEgY2xvc2luZyB0YWcgaWYgdGhlcmUgZXhpc3RzIGFuXG4gICMgb3BlbiB0YWcgdGhhdCBpcyBub3QgY2xvc2VkIGFmdGVyd2FyZHMuXG4gIGNsb3NlVGFnOiAtPlxuICAgIGN1cnNvclBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgdGV4dExpbWl0cyA9IEBlZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0UmFuZ2UoKVxuICAgIHByZUZyYWdtZW50ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbWzAsIDBdLCBjdXJzb3JQb3NpdGlvbl0pXG4gICAgcG9zdEZyYWdtZW50ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbY3Vyc29yUG9zaXRpb24sIFtJbmZpbml0eSwgSW5maW5pdHldXSlcblxuICAgIGlmIHRhZyA9IEB0YWdGaW5kZXIuY2xvc2luZ1RhZ0ZvckZyYWdtZW50cyhwcmVGcmFnbWVudCwgcG9zdEZyYWdtZW50KVxuICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KFwiPC8je3RhZ30+XCIpXG4iXX0=
