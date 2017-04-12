(function() {
  var AAngleBracket, AAngleBracketAllowForwarding, AAnyPair, AAnyPairAllowForwarding, AAnyQuote, ABackTick, AComment, ACurlyBracket, ACurlyBracketAllowForwarding, ACurrentLine, ACurrentSelectionAndAPersistentSelection, ADoubleQuote, AEdge, AEntire, AFold, AFunction, AFunctionOrInnerParagraph, AIndentation, ALatestChange, AParagraph, AParenthesis, AParenthesisAllowForwarding, APersistentSelection, ASingleQuote, ASmartWord, ASquareBracket, ASquareBracketAllowForwarding, ATag, AVisibleArea, AWholeWord, AWord, All, AngleBracket, AnyPair, AnyPairAllowForwarding, AnyQuote, BackTick, Base, Comment, CurlyBracket, CurrentLine, DoubleQuote, Edge, Empty, Entire, Fold, Function, Indentation, InnerAngleBracket, InnerAngleBracketAllowForwarding, InnerAnyPair, InnerAnyPairAllowForwarding, InnerAnyQuote, InnerBackTick, InnerComment, InnerCurlyBracket, InnerCurlyBracketAllowForwarding, InnerCurrentLine, InnerDoubleQuote, InnerEdge, InnerEntire, InnerFold, InnerFunction, InnerIndentation, InnerLatestChange, InnerParagraph, InnerParenthesis, InnerParenthesisAllowForwarding, InnerPersistentSelection, InnerSingleQuote, InnerSmartWord, InnerSquareBracket, InnerSquareBracketAllowForwarding, InnerTag, InnerVisibleArea, InnerWholeWord, InnerWord, LatestChange, Pair, Paragraph, Parenthesis, PersistentSelection, Point, PreviousSelection, Quote, Range, SearchMatchBackward, SearchMatchForward, SingleQuote, SmartWord, SquareBracket, Tag, TextObject, TextObjectFirstFound, UnionTextObject, VisibleArea, WholeWord, Word, _, countChar, getBufferRangeForRowRange, getBufferRows, getCodeFoldRowRangesContainesForRow, getEndPositionForPattern, getIndentLevelForBufferRow, getRangeByTranslatePointAndClip, getStartPositionForPattern, getTextToPoint, getValidVimBufferRow, getVisibleBufferRange, isIncludeFunctionScopeForRow, pointIsAtEndOfLine, ref, ref1, sortRanges, sortRangesByEndPosition, swrap, tagPattern, translatePointAndClip, trimRange,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  Base = require('./base');

  swrap = require('./selection-wrapper');

  ref1 = require('./utils'), sortRanges = ref1.sortRanges, sortRangesByEndPosition = ref1.sortRangesByEndPosition, countChar = ref1.countChar, pointIsAtEndOfLine = ref1.pointIsAtEndOfLine, getTextToPoint = ref1.getTextToPoint, getIndentLevelForBufferRow = ref1.getIndentLevelForBufferRow, getCodeFoldRowRangesContainesForRow = ref1.getCodeFoldRowRangesContainesForRow, getBufferRangeForRowRange = ref1.getBufferRangeForRowRange, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, getStartPositionForPattern = ref1.getStartPositionForPattern, getEndPositionForPattern = ref1.getEndPositionForPattern, getVisibleBufferRange = ref1.getVisibleBufferRange, translatePointAndClip = ref1.translatePointAndClip, getRangeByTranslatePointAndClip = ref1.getRangeByTranslatePointAndClip, getBufferRows = ref1.getBufferRows, getValidVimBufferRow = ref1.getValidVimBufferRow, getStartPositionForPattern = ref1.getStartPositionForPattern, trimRange = ref1.trimRange;

  TextObject = (function(superClass) {
    extend(TextObject, superClass);

    TextObject.extend(false);

    TextObject.prototype.allowSubmodeChange = true;

    function TextObject() {
      this.constructor.prototype.inner = this.getName().startsWith('Inner');
      TextObject.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    TextObject.prototype.isInner = function() {
      return this.inner;
    };

    TextObject.prototype.isA = function() {
      return !this.isInner();
    };

    TextObject.prototype.isAllowSubmodeChange = function() {
      return this.allowSubmodeChange;
    };

    TextObject.prototype.isLinewise = function() {
      if (this.isAllowSubmodeChange()) {
        return swrap.detectVisualModeSubmode(this.editor) === 'linewise';
      } else {
        return this.isMode('visual', 'linewise');
      }
    };

    TextObject.prototype.stopSelection = function() {
      return this.canSelect = false;
    };

    TextObject.prototype.getNormalizedHeadBufferPosition = function(selection) {
      var head;
      head = selection.getHeadBufferPosition();
      if (this.isMode('visual') && !selection.isReversed()) {
        head = translatePointAndClip(this.editor, head, 'backward');
      }
      return head;
    };

    TextObject.prototype.getNormalizedHeadScreenPosition = function(selection) {
      var bufferPosition;
      bufferPosition = this.getNormalizedHeadBufferPosition(selection);
      return this.editor.screenPositionForBufferPosition(bufferPosition);
    };

    TextObject.prototype.select = function() {
      this.canSelect = true;
      this.countTimes((function(_this) {
        return function() {
          var j, len, ref2, results, selection;
          ref2 = _this.editor.getSelections();
          results = [];
          for (j = 0, len = ref2.length; j < len; j++) {
            selection = ref2[j];
            if (_this.canSelect) {
              results.push(_this.selectTextObject(selection));
            }
          }
          return results;
        };
      })(this));
      this.editor.mergeIntersectingSelections();
      if (this.isMode('visual')) {
        return this.updateSelectionProperties();
      }
    };

    TextObject.prototype.selectTextObject = function(selection) {
      var range;
      range = this.getRange(selection);
      return swrap(selection).setBufferRangeSafely(range);
    };

    TextObject.prototype.getRange = function() {};

    return TextObject;

  })(Base);

  Word = (function(superClass) {
    extend(Word, superClass);

    function Word() {
      return Word.__super__.constructor.apply(this, arguments);
    }

    Word.extend(false);

    Word.prototype.getRange = function(selection) {
      var kind, point, range, ref2;
      point = this.getNormalizedHeadBufferPosition(selection);
      ref2 = this.getWordBufferRangeAndKindAtBufferPosition(point, {
        wordRegex: this.wordRegex
      }), range = ref2.range, kind = ref2.kind;
      if (this.isA() && kind === 'word') {
        range = this.expandRangeToWhiteSpaces(range);
      }
      return range;
    };

    Word.prototype.expandRangeToWhiteSpaces = function(range) {
      var newEnd, newStart;
      if (newEnd = getEndPositionForPattern(this.editor, range.end, /\s+/, {
        containedOnly: true
      })) {
        return new Range(range.start, newEnd);
      }
      if (newStart = getStartPositionForPattern(this.editor, range.start, /\s+/, {
        containedOnly: true
      })) {
        if (newStart.column !== 0) {
          return new Range(newStart, range.end);
        }
      }
      return range;
    };

    return Word;

  })(TextObject);

  AWord = (function(superClass) {
    extend(AWord, superClass);

    function AWord() {
      return AWord.__super__.constructor.apply(this, arguments);
    }

    AWord.extend();

    return AWord;

  })(Word);

  InnerWord = (function(superClass) {
    extend(InnerWord, superClass);

    function InnerWord() {
      return InnerWord.__super__.constructor.apply(this, arguments);
    }

    InnerWord.extend();

    return InnerWord;

  })(Word);

  WholeWord = (function(superClass) {
    extend(WholeWord, superClass);

    function WholeWord() {
      return WholeWord.__super__.constructor.apply(this, arguments);
    }

    WholeWord.extend(false);

    WholeWord.prototype.wordRegex = /\S+/;

    return WholeWord;

  })(Word);

  AWholeWord = (function(superClass) {
    extend(AWholeWord, superClass);

    function AWholeWord() {
      return AWholeWord.__super__.constructor.apply(this, arguments);
    }

    AWholeWord.extend();

    return AWholeWord;

  })(WholeWord);

  InnerWholeWord = (function(superClass) {
    extend(InnerWholeWord, superClass);

    function InnerWholeWord() {
      return InnerWholeWord.__super__.constructor.apply(this, arguments);
    }

    InnerWholeWord.extend();

    return InnerWholeWord;

  })(WholeWord);

  SmartWord = (function(superClass) {
    extend(SmartWord, superClass);

    function SmartWord() {
      return SmartWord.__super__.constructor.apply(this, arguments);
    }

    SmartWord.extend(false);

    SmartWord.prototype.wordRegex = /[\w-]+/;

    return SmartWord;

  })(Word);

  ASmartWord = (function(superClass) {
    extend(ASmartWord, superClass);

    function ASmartWord() {
      return ASmartWord.__super__.constructor.apply(this, arguments);
    }

    ASmartWord.description = "A word that consists of alphanumeric chars(`/[A-Za-z0-9_]/`) and hyphen `-`";

    ASmartWord.extend();

    return ASmartWord;

  })(SmartWord);

  InnerSmartWord = (function(superClass) {
    extend(InnerSmartWord, superClass);

    function InnerSmartWord() {
      return InnerSmartWord.__super__.constructor.apply(this, arguments);
    }

    InnerSmartWord.description = "Currently No diff from `a-smart-word`";

    InnerSmartWord.extend();

    return InnerSmartWord;

  })(SmartWord);

  Pair = (function(superClass) {
    var backSlashPattern;

    extend(Pair, superClass);

    function Pair() {
      return Pair.__super__.constructor.apply(this, arguments);
    }

    Pair.extend(false);

    Pair.prototype.allowNextLine = false;

    Pair.prototype.allowSubmodeChange = false;

    Pair.prototype.adjustInnerRange = true;

    Pair.prototype.pair = null;

    Pair.prototype.getPattern = function() {
      var close, open, ref2;
      ref2 = this.pair, open = ref2[0], close = ref2[1];
      if (open === close) {
        return new RegExp("(" + (_.escapeRegExp(open)) + ")", 'g');
      } else {
        return new RegExp("(" + (_.escapeRegExp(open)) + ")|(" + (_.escapeRegExp(close)) + ")", 'g');
      }
    };

    Pair.prototype.getPairState = function(arg) {
      var match, matchText, range;
      matchText = arg.matchText, range = arg.range, match = arg.match;
      switch (match.length) {
        case 2:
          return this.pairStateInBufferRange(range, matchText);
        case 3:
          switch (false) {
            case !match[1]:
              return 'open';
            case !match[2]:
              return 'close';
          }
      }
    };

    backSlashPattern = _.escapeRegExp('\\');

    Pair.prototype.pairStateInBufferRange = function(range, char) {
      var bs, escapedChar, pattern, patterns, text;
      text = getTextToPoint(this.editor, range.end);
      escapedChar = _.escapeRegExp(char);
      bs = backSlashPattern;
      patterns = ["" + bs + bs + escapedChar, "[^" + bs + "]?" + escapedChar];
      pattern = new RegExp(patterns.join('|'));
      return ['close', 'open'][countChar(text, pattern) % 2];
    };

    Pair.prototype.isEscapedCharAtPoint = function(point) {
      var bs, found, pattern, scanRange;
      found = false;
      bs = backSlashPattern;
      pattern = new RegExp("[^" + bs + "]" + bs);
      scanRange = [[point.row, 0], point];
      this.editor.backwardsScanInBufferRange(pattern, scanRange, function(arg) {
        var matchText, range, stop;
        matchText = arg.matchText, range = arg.range, stop = arg.stop;
        if (range.end.isEqual(point)) {
          stop();
          return found = true;
        }
      });
      return found;
    };

    Pair.prototype.findPair = function(which, options, fn) {
      var from, pattern, scanFunc, scanRange;
      from = options.from, pattern = options.pattern, scanFunc = options.scanFunc, scanRange = options.scanRange;
      return this.editor[scanFunc](pattern, scanRange, (function(_this) {
        return function(event) {
          var matchText, range, stop;
          matchText = event.matchText, range = event.range, stop = event.stop;
          if (!(_this.allowNextLine || (from.row === range.start.row))) {
            return stop();
          }
          if (_this.isEscapedCharAtPoint(range.start)) {
            return;
          }
          return fn(event);
        };
      })(this));
    };

    Pair.prototype.findOpen = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'backwardsScanInBufferRange';
      scanRange = new Range([0, 0], from);
      stack = [];
      found = null;
      this.findPair('open', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var matchText, pairState, range, stop;
          matchText = event.matchText, range = event.range, stop = event.stop;
          pairState = _this.getPairState(event);
          if (pairState === 'close') {
            stack.push({
              pairState: pairState,
              matchText: matchText,
              range: range
            });
          } else {
            stack.pop();
            if (stack.length === 0) {
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Pair.prototype.findClose = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'scanInBufferRange';
      scanRange = new Range(from, this.editor.buffer.getEndPosition());
      stack = [];
      found = null;
      this.findPair('close', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, openStart, pairState, range, stop;
          range = event.range, stop = event.stop;
          pairState = _this.getPairState(event);
          if (pairState === 'open') {
            stack.push({
              pairState: pairState,
              range: range
            });
          } else {
            entry = stack.pop();
            if (stack.length === 0) {
              if ((openStart = entry != null ? entry.range.start : void 0)) {
                if (_this.allowForwarding) {
                  if (openStart.row > from.row) {
                    return;
                  }
                } else {
                  if (openStart.isGreaterThan(from)) {
                    return;
                  }
                }
              }
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Pair.prototype.getPairInfo = function(from) {
      var aRange, closeRange, innerEnd, innerRange, innerStart, openRange, pairInfo, pattern, ref2, targetRange;
      pairInfo = null;
      pattern = this.getPattern();
      closeRange = this.findClose(from, pattern);
      if (closeRange != null) {
        openRange = this.findOpen(closeRange.end, pattern);
      }
      if (!((openRange != null) && (closeRange != null))) {
        return null;
      }
      aRange = new Range(openRange.start, closeRange.end);
      ref2 = [openRange.end, closeRange.start], innerStart = ref2[0], innerEnd = ref2[1];
      if (this.adjustInnerRange) {
        if (pointIsAtEndOfLine(this.editor, innerStart)) {
          innerStart = new Point(innerStart.row + 1, 0);
        }
        if (getTextToPoint(this.editor, innerEnd).match(/^\s*$/)) {
          innerEnd = new Point(innerEnd.row, 0);
        }
        if ((innerEnd.column === 0) && (innerStart.column !== 0)) {
          innerEnd = new Point(innerEnd.row - 1, 2e308);
        }
      }
      innerRange = new Range(innerStart, innerEnd);
      targetRange = this.isInner() ? innerRange : aRange;
      if (this.skipEmptyPair && innerRange.isEmpty()) {
        return this.getPairInfo(aRange.end);
      } else {
        return {
          openRange: openRange,
          closeRange: closeRange,
          aRange: aRange,
          innerRange: innerRange,
          targetRange: targetRange
        };
      }
    };

    Pair.prototype.getPointToSearchFrom = function(selection, searchFrom) {
      switch (searchFrom) {
        case 'head':
          return this.getNormalizedHeadBufferPosition(selection);
        case 'start':
          return swrap(selection).getBufferPositionFor('start');
      }
    };

    Pair.prototype.getRange = function(selection, options) {
      var allowForwarding, originalRange, pairInfo, searchFrom;
      if (options == null) {
        options = {};
      }
      allowForwarding = options.allowForwarding, searchFrom = options.searchFrom;
      if (searchFrom == null) {
        searchFrom = 'head';
      }
      if (allowForwarding != null) {
        this.allowForwarding = allowForwarding;
      }
      originalRange = selection.getBufferRange();
      pairInfo = this.getPairInfo(this.getPointToSearchFrom(selection, searchFrom));
      if (pairInfo != null ? pairInfo.targetRange.isEqual(originalRange) : void 0) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      return pairInfo != null ? pairInfo.targetRange : void 0;
    };

    return Pair;

  })(TextObject);

  AnyPair = (function(superClass) {
    extend(AnyPair, superClass);

    function AnyPair() {
      return AnyPair.__super__.constructor.apply(this, arguments);
    }

    AnyPair.extend(false);

    AnyPair.prototype.allowForwarding = false;

    AnyPair.prototype.allowNextLine = null;

    AnyPair.prototype.skipEmptyPair = false;

    AnyPair.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'Tag', 'SquareBracket', 'Parenthesis'];

    AnyPair.prototype.getRangeBy = function(klass, selection) {
      var options;
      options = {
        inner: this.inner,
        skipEmptyPair: this.skipEmptyPair
      };
      if (this.allowNextLine != null) {
        options.allowNextLine = this.allowNextLine;
      }
      return this["new"](klass, options).getRange(selection, {
        allowForwarding: this.allowForwarding,
        searchFrom: this.searchFrom
      });
    };

    AnyPair.prototype.getRanges = function(selection) {
      var j, klass, len, range, ref2, results;
      ref2 = this.member;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        klass = ref2[j];
        if ((range = this.getRangeBy(klass, selection))) {
          results.push(range);
        }
      }
      return results;
    };

    AnyPair.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.last(sortRanges(ranges));
      }
    };

    return AnyPair;

  })(Pair);

  AAnyPair = (function(superClass) {
    extend(AAnyPair, superClass);

    function AAnyPair() {
      return AAnyPair.__super__.constructor.apply(this, arguments);
    }

    AAnyPair.extend();

    return AAnyPair;

  })(AnyPair);

  InnerAnyPair = (function(superClass) {
    extend(InnerAnyPair, superClass);

    function InnerAnyPair() {
      return InnerAnyPair.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPair.extend();

    return InnerAnyPair;

  })(AnyPair);

  AnyPairAllowForwarding = (function(superClass) {
    extend(AnyPairAllowForwarding, superClass);

    function AnyPairAllowForwarding() {
      return AnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AnyPairAllowForwarding.extend(false);

    AnyPairAllowForwarding.description = "Range surrounded by auto-detected paired chars from enclosed and forwarding area";

    AnyPairAllowForwarding.prototype.allowForwarding = true;

    AnyPairAllowForwarding.prototype.skipEmptyPair = false;

    AnyPairAllowForwarding.prototype.searchFrom = 'start';

    AnyPairAllowForwarding.prototype.getRange = function(selection) {
      var enclosingRange, enclosingRanges, forwardingRanges, from, ranges, ref2;
      ranges = this.getRanges(selection);
      from = selection.cursor.getBufferPosition();
      ref2 = _.partition(ranges, function(range) {
        return range.start.isGreaterThanOrEqual(from);
      }), forwardingRanges = ref2[0], enclosingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return forwardingRanges[0] || enclosingRange;
    };

    return AnyPairAllowForwarding;

  })(AnyPair);

  AAnyPairAllowForwarding = (function(superClass) {
    extend(AAnyPairAllowForwarding, superClass);

    function AAnyPairAllowForwarding() {
      return AAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAnyPairAllowForwarding.extend();

    return AAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  InnerAnyPairAllowForwarding = (function(superClass) {
    extend(InnerAnyPairAllowForwarding, superClass);

    function InnerAnyPairAllowForwarding() {
      return InnerAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPairAllowForwarding.extend();

    return InnerAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  AnyQuote = (function(superClass) {
    extend(AnyQuote, superClass);

    function AnyQuote() {
      return AnyQuote.__super__.constructor.apply(this, arguments);
    }

    AnyQuote.extend(false);

    AnyQuote.prototype.allowForwarding = true;

    AnyQuote.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick'];

    AnyQuote.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.first(_.sortBy(ranges, function(r) {
          return r.end.column;
        }));
      }
    };

    return AnyQuote;

  })(AnyPair);

  AAnyQuote = (function(superClass) {
    extend(AAnyQuote, superClass);

    function AAnyQuote() {
      return AAnyQuote.__super__.constructor.apply(this, arguments);
    }

    AAnyQuote.extend();

    return AAnyQuote;

  })(AnyQuote);

  InnerAnyQuote = (function(superClass) {
    extend(InnerAnyQuote, superClass);

    function InnerAnyQuote() {
      return InnerAnyQuote.__super__.constructor.apply(this, arguments);
    }

    InnerAnyQuote.extend();

    return InnerAnyQuote;

  })(AnyQuote);

  Quote = (function(superClass) {
    extend(Quote, superClass);

    function Quote() {
      return Quote.__super__.constructor.apply(this, arguments);
    }

    Quote.extend(false);

    Quote.prototype.allowForwarding = true;

    Quote.prototype.allowNextLine = false;

    return Quote;

  })(Pair);

  DoubleQuote = (function(superClass) {
    extend(DoubleQuote, superClass);

    function DoubleQuote() {
      return DoubleQuote.__super__.constructor.apply(this, arguments);
    }

    DoubleQuote.extend(false);

    DoubleQuote.prototype.pair = ['"', '"'];

    return DoubleQuote;

  })(Quote);

  ADoubleQuote = (function(superClass) {
    extend(ADoubleQuote, superClass);

    function ADoubleQuote() {
      return ADoubleQuote.__super__.constructor.apply(this, arguments);
    }

    ADoubleQuote.extend();

    return ADoubleQuote;

  })(DoubleQuote);

  InnerDoubleQuote = (function(superClass) {
    extend(InnerDoubleQuote, superClass);

    function InnerDoubleQuote() {
      return InnerDoubleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerDoubleQuote.extend();

    return InnerDoubleQuote;

  })(DoubleQuote);

  SingleQuote = (function(superClass) {
    extend(SingleQuote, superClass);

    function SingleQuote() {
      return SingleQuote.__super__.constructor.apply(this, arguments);
    }

    SingleQuote.extend(false);

    SingleQuote.prototype.pair = ["'", "'"];

    return SingleQuote;

  })(Quote);

  ASingleQuote = (function(superClass) {
    extend(ASingleQuote, superClass);

    function ASingleQuote() {
      return ASingleQuote.__super__.constructor.apply(this, arguments);
    }

    ASingleQuote.extend();

    return ASingleQuote;

  })(SingleQuote);

  InnerSingleQuote = (function(superClass) {
    extend(InnerSingleQuote, superClass);

    function InnerSingleQuote() {
      return InnerSingleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerSingleQuote.extend();

    return InnerSingleQuote;

  })(SingleQuote);

  BackTick = (function(superClass) {
    extend(BackTick, superClass);

    function BackTick() {
      return BackTick.__super__.constructor.apply(this, arguments);
    }

    BackTick.extend(false);

    BackTick.prototype.pair = ['`', '`'];

    return BackTick;

  })(Quote);

  ABackTick = (function(superClass) {
    extend(ABackTick, superClass);

    function ABackTick() {
      return ABackTick.__super__.constructor.apply(this, arguments);
    }

    ABackTick.extend();

    return ABackTick;

  })(BackTick);

  InnerBackTick = (function(superClass) {
    extend(InnerBackTick, superClass);

    function InnerBackTick() {
      return InnerBackTick.__super__.constructor.apply(this, arguments);
    }

    InnerBackTick.extend();

    return InnerBackTick;

  })(BackTick);

  CurlyBracket = (function(superClass) {
    extend(CurlyBracket, superClass);

    function CurlyBracket() {
      return CurlyBracket.__super__.constructor.apply(this, arguments);
    }

    CurlyBracket.extend(false);

    CurlyBracket.prototype.pair = ['{', '}'];

    CurlyBracket.prototype.allowNextLine = true;

    return CurlyBracket;

  })(Pair);

  ACurlyBracket = (function(superClass) {
    extend(ACurlyBracket, superClass);

    function ACurlyBracket() {
      return ACurlyBracket.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracket.extend();

    return ACurlyBracket;

  })(CurlyBracket);

  InnerCurlyBracket = (function(superClass) {
    extend(InnerCurlyBracket, superClass);

    function InnerCurlyBracket() {
      return InnerCurlyBracket.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracket.extend();

    return InnerCurlyBracket;

  })(CurlyBracket);

  ACurlyBracketAllowForwarding = (function(superClass) {
    extend(ACurlyBracketAllowForwarding, superClass);

    function ACurlyBracketAllowForwarding() {
      return ACurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracketAllowForwarding.extend();

    ACurlyBracketAllowForwarding.prototype.allowForwarding = true;

    return ACurlyBracketAllowForwarding;

  })(CurlyBracket);

  InnerCurlyBracketAllowForwarding = (function(superClass) {
    extend(InnerCurlyBracketAllowForwarding, superClass);

    function InnerCurlyBracketAllowForwarding() {
      return InnerCurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracketAllowForwarding.extend();

    InnerCurlyBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerCurlyBracketAllowForwarding;

  })(CurlyBracket);

  SquareBracket = (function(superClass) {
    extend(SquareBracket, superClass);

    function SquareBracket() {
      return SquareBracket.__super__.constructor.apply(this, arguments);
    }

    SquareBracket.extend(false);

    SquareBracket.prototype.pair = ['[', ']'];

    SquareBracket.prototype.allowNextLine = true;

    return SquareBracket;

  })(Pair);

  ASquareBracket = (function(superClass) {
    extend(ASquareBracket, superClass);

    function ASquareBracket() {
      return ASquareBracket.__super__.constructor.apply(this, arguments);
    }

    ASquareBracket.extend();

    return ASquareBracket;

  })(SquareBracket);

  InnerSquareBracket = (function(superClass) {
    extend(InnerSquareBracket, superClass);

    function InnerSquareBracket() {
      return InnerSquareBracket.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracket.extend();

    return InnerSquareBracket;

  })(SquareBracket);

  ASquareBracketAllowForwarding = (function(superClass) {
    extend(ASquareBracketAllowForwarding, superClass);

    function ASquareBracketAllowForwarding() {
      return ASquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ASquareBracketAllowForwarding.extend();

    ASquareBracketAllowForwarding.prototype.allowForwarding = true;

    return ASquareBracketAllowForwarding;

  })(SquareBracket);

  InnerSquareBracketAllowForwarding = (function(superClass) {
    extend(InnerSquareBracketAllowForwarding, superClass);

    function InnerSquareBracketAllowForwarding() {
      return InnerSquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracketAllowForwarding.extend();

    InnerSquareBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerSquareBracketAllowForwarding;

  })(SquareBracket);

  Parenthesis = (function(superClass) {
    extend(Parenthesis, superClass);

    function Parenthesis() {
      return Parenthesis.__super__.constructor.apply(this, arguments);
    }

    Parenthesis.extend(false);

    Parenthesis.prototype.pair = ['(', ')'];

    Parenthesis.prototype.allowNextLine = true;

    return Parenthesis;

  })(Pair);

  AParenthesis = (function(superClass) {
    extend(AParenthesis, superClass);

    function AParenthesis() {
      return AParenthesis.__super__.constructor.apply(this, arguments);
    }

    AParenthesis.extend();

    return AParenthesis;

  })(Parenthesis);

  InnerParenthesis = (function(superClass) {
    extend(InnerParenthesis, superClass);

    function InnerParenthesis() {
      return InnerParenthesis.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesis.extend();

    return InnerParenthesis;

  })(Parenthesis);

  AParenthesisAllowForwarding = (function(superClass) {
    extend(AParenthesisAllowForwarding, superClass);

    function AParenthesisAllowForwarding() {
      return AParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AParenthesisAllowForwarding.extend();

    AParenthesisAllowForwarding.prototype.allowForwarding = true;

    return AParenthesisAllowForwarding;

  })(Parenthesis);

  InnerParenthesisAllowForwarding = (function(superClass) {
    extend(InnerParenthesisAllowForwarding, superClass);

    function InnerParenthesisAllowForwarding() {
      return InnerParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesisAllowForwarding.extend();

    InnerParenthesisAllowForwarding.prototype.allowForwarding = true;

    return InnerParenthesisAllowForwarding;

  })(Parenthesis);

  AngleBracket = (function(superClass) {
    extend(AngleBracket, superClass);

    function AngleBracket() {
      return AngleBracket.__super__.constructor.apply(this, arguments);
    }

    AngleBracket.extend(false);

    AngleBracket.prototype.pair = ['<', '>'];

    return AngleBracket;

  })(Pair);

  AAngleBracket = (function(superClass) {
    extend(AAngleBracket, superClass);

    function AAngleBracket() {
      return AAngleBracket.__super__.constructor.apply(this, arguments);
    }

    AAngleBracket.extend();

    return AAngleBracket;

  })(AngleBracket);

  InnerAngleBracket = (function(superClass) {
    extend(InnerAngleBracket, superClass);

    function InnerAngleBracket() {
      return InnerAngleBracket.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracket.extend();

    return InnerAngleBracket;

  })(AngleBracket);

  AAngleBracketAllowForwarding = (function(superClass) {
    extend(AAngleBracketAllowForwarding, superClass);

    function AAngleBracketAllowForwarding() {
      return AAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAngleBracketAllowForwarding.extend();

    AAngleBracketAllowForwarding.prototype.allowForwarding = true;

    return AAngleBracketAllowForwarding;

  })(AngleBracket);

  InnerAngleBracketAllowForwarding = (function(superClass) {
    extend(InnerAngleBracketAllowForwarding, superClass);

    function InnerAngleBracketAllowForwarding() {
      return InnerAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracketAllowForwarding.extend();

    InnerAngleBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerAngleBracketAllowForwarding;

  })(AngleBracket);

  tagPattern = /(<(\/?))([^\s>]+)[^>]*>/g;

  Tag = (function(superClass) {
    extend(Tag, superClass);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.extend(false);

    Tag.prototype.allowNextLine = true;

    Tag.prototype.allowForwarding = true;

    Tag.prototype.adjustInnerRange = false;

    Tag.prototype.getPattern = function() {
      return tagPattern;
    };

    Tag.prototype.getPairState = function(arg) {
      var __, match, matchText, slash, tagName;
      match = arg.match, matchText = arg.matchText;
      __ = match[0], __ = match[1], slash = match[2], tagName = match[3];
      if (slash === '') {
        return ['open', tagName];
      } else {
        return ['close', tagName];
      }
    };

    Tag.prototype.getTagStartPoint = function(from) {
      var ref2, scanRange, tagRange;
      tagRange = null;
      scanRange = this.editor.bufferRangeForBufferRow(from.row);
      this.editor.scanInBufferRange(tagPattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.containsPoint(from, true)) {
          tagRange = range;
          return stop();
        }
      });
      return (ref2 = tagRange != null ? tagRange.start : void 0) != null ? ref2 : from;
    };

    Tag.prototype.findTagState = function(stack, tagState) {
      var entry, i, j, ref2;
      if (stack.length === 0) {
        return null;
      }
      for (i = j = ref2 = stack.length - 1; ref2 <= 0 ? j <= 0 : j >= 0; i = ref2 <= 0 ? ++j : --j) {
        entry = stack[i];
        if (entry.tagState === tagState) {
          return entry;
        }
      }
      return null;
    };

    Tag.prototype.findOpen = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'backwardsScanInBufferRange';
      scanRange = new Range([0, 0], from);
      stack = [];
      found = null;
      this.findPair('open', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, pairState, range, ref2, stop, tagName, tagState;
          range = event.range, stop = event.stop;
          ref2 = _this.getPairState(event), pairState = ref2[0], tagName = ref2[1];
          if (pairState === 'close') {
            tagState = pairState + tagName;
            stack.push({
              tagState: tagState,
              range: range
            });
          } else {
            if (entry = _this.findTagState(stack, "close" + tagName)) {
              stack = stack.slice(0, stack.indexOf(entry));
            }
            if (stack.length === 0) {
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Tag.prototype.findClose = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'scanInBufferRange';
      from = this.getTagStartPoint(from);
      scanRange = new Range(from, this.editor.buffer.getEndPosition());
      stack = [];
      found = null;
      this.findPair('close', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, openStart, pairState, range, ref2, stop, tagName, tagState;
          range = event.range, stop = event.stop;
          ref2 = _this.getPairState(event), pairState = ref2[0], tagName = ref2[1];
          if (pairState === 'open') {
            tagState = pairState + tagName;
            stack.push({
              tagState: tagState,
              range: range
            });
          } else {
            if (entry = _this.findTagState(stack, "open" + tagName)) {
              stack = stack.slice(0, stack.indexOf(entry));
            } else {
              stack = [];
            }
            if (stack.length === 0) {
              if ((openStart = entry != null ? entry.range.start : void 0)) {
                if (_this.allowForwarding) {
                  if (openStart.row > from.row) {
                    return;
                  }
                } else {
                  if (openStart.isGreaterThan(from)) {
                    return;
                  }
                }
              }
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    return Tag;

  })(Pair);

  ATag = (function(superClass) {
    extend(ATag, superClass);

    function ATag() {
      return ATag.__super__.constructor.apply(this, arguments);
    }

    ATag.extend();

    return ATag;

  })(Tag);

  InnerTag = (function(superClass) {
    extend(InnerTag, superClass);

    function InnerTag() {
      return InnerTag.__super__.constructor.apply(this, arguments);
    }

    InnerTag.extend();

    return InnerTag;

  })(Tag);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.extend(false);

    Paragraph.prototype.findRow = function(fromRow, direction, fn) {
      var foundRow, j, len, ref2, row;
      if (typeof fn.reset === "function") {
        fn.reset();
      }
      foundRow = fromRow;
      ref2 = getBufferRows(this.editor, {
        startRow: fromRow,
        direction: direction
      });
      for (j = 0, len = ref2.length; j < len; j++) {
        row = ref2[j];
        if (!fn(row, direction)) {
          break;
        }
        foundRow = row;
      }
      return foundRow;
    };

    Paragraph.prototype.findRowRangeBy = function(fromRow, fn) {
      var endRow, startRow;
      startRow = this.findRow(fromRow, 'previous', fn);
      endRow = this.findRow(fromRow, 'next', fn);
      return [startRow, endRow];
    };

    Paragraph.prototype.getPredictFunction = function(fromRow, selection) {
      var directionToExtend, flip, fromRowResult, predict;
      fromRowResult = this.editor.isBufferRowBlank(fromRow);
      if (this.isInner()) {
        predict = (function(_this) {
          return function(row, direction) {
            return _this.editor.isBufferRowBlank(row) === fromRowResult;
          };
        })(this);
      } else {
        if (selection.isReversed()) {
          directionToExtend = 'previous';
        } else {
          directionToExtend = 'next';
        }
        flip = false;
        predict = (function(_this) {
          return function(row, direction) {
            var result;
            result = _this.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if ((!result) && (direction === directionToExtend)) {
                flip = true;
                return true;
              }
              return result;
            }
          };
        })(this);
        predict.reset = function() {
          return flip = false;
        };
      }
      return predict;
    };

    Paragraph.prototype.getRange = function(selection) {
      var fromRow, rowRange;
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) {
          fromRow--;
        } else {
          fromRow++;
        }
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(getBufferRangeForRowRange(this.editor, rowRange));
    };

    return Paragraph;

  })(TextObject);

  AParagraph = (function(superClass) {
    extend(AParagraph, superClass);

    function AParagraph() {
      return AParagraph.__super__.constructor.apply(this, arguments);
    }

    AParagraph.extend();

    return AParagraph;

  })(Paragraph);

  InnerParagraph = (function(superClass) {
    extend(InnerParagraph, superClass);

    function InnerParagraph() {
      return InnerParagraph.__super__.constructor.apply(this, arguments);
    }

    InnerParagraph.extend();

    return InnerParagraph;

  })(Paragraph);

  Indentation = (function(superClass) {
    extend(Indentation, superClass);

    function Indentation() {
      return Indentation.__super__.constructor.apply(this, arguments);
    }

    Indentation.extend(false);

    Indentation.prototype.getRange = function(selection) {
      var baseIndentLevel, fromRow, predict, rowRange;
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      baseIndentLevel = getIndentLevelForBufferRow(this.editor, fromRow);
      predict = (function(_this) {
        return function(row) {
          if (_this.editor.isBufferRowBlank(row)) {
            return _this.isA();
          } else {
            return getIndentLevelForBufferRow(_this.editor, row) >= baseIndentLevel;
          }
        };
      })(this);
      rowRange = this.findRowRangeBy(fromRow, predict);
      return getBufferRangeForRowRange(this.editor, rowRange);
    };

    return Indentation;

  })(Paragraph);

  AIndentation = (function(superClass) {
    extend(AIndentation, superClass);

    function AIndentation() {
      return AIndentation.__super__.constructor.apply(this, arguments);
    }

    AIndentation.extend();

    return AIndentation;

  })(Indentation);

  InnerIndentation = (function(superClass) {
    extend(InnerIndentation, superClass);

    function InnerIndentation() {
      return InnerIndentation.__super__.constructor.apply(this, arguments);
    }

    InnerIndentation.extend();

    return InnerIndentation;

  })(Indentation);

  Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.extend(false);

    Comment.prototype.getRange = function(selection) {
      var row, rowRange;
      row = selection.getBufferRange().start.row;
      rowRange = this.editor.languageMode.rowRangeForCommentAtBufferRow(row);
      if (this.editor.isBufferRowCommented(row)) {
        if (rowRange == null) {
          rowRange = [row, row];
        }
      }
      if (rowRange) {
        return getBufferRangeForRowRange(selection.editor, rowRange);
      }
    };

    return Comment;

  })(TextObject);

  AComment = (function(superClass) {
    extend(AComment, superClass);

    function AComment() {
      return AComment.__super__.constructor.apply(this, arguments);
    }

    AComment.extend();

    return AComment;

  })(Comment);

  InnerComment = (function(superClass) {
    extend(InnerComment, superClass);

    function InnerComment() {
      return InnerComment.__super__.constructor.apply(this, arguments);
    }

    InnerComment.extend();

    return InnerComment;

  })(Comment);

  Fold = (function(superClass) {
    extend(Fold, superClass);

    function Fold() {
      return Fold.__super__.constructor.apply(this, arguments);
    }

    Fold.extend(false);

    Fold.prototype.adjustRowRange = function(arg) {
      var endRow, endRowIndentLevel, startRow, startRowIndentLevel;
      startRow = arg[0], endRow = arg[1];
      if (!this.isInner()) {
        return [startRow, endRow];
      }
      startRowIndentLevel = getIndentLevelForBufferRow(this.editor, startRow);
      endRowIndentLevel = getIndentLevelForBufferRow(this.editor, endRow);
      if (startRowIndentLevel === endRowIndentLevel) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    };

    Fold.prototype.getFoldRowRangesContainsForRow = function(row) {
      var ref2;
      return (ref2 = getCodeFoldRowRangesContainesForRow(this.editor, row, {
        includeStartRow: false
      })) != null ? ref2.reverse() : void 0;
    };

    Fold.prototype.getRange = function(selection) {
      var range, rowRange, rowRanges, targetRange;
      range = selection.getBufferRange();
      rowRanges = this.getFoldRowRangesContainsForRow(range.start.row);
      if (!rowRanges.length) {
        return;
      }
      if ((rowRange = rowRanges.shift()) != null) {
        rowRange = this.adjustRowRange(rowRange);
        targetRange = getBufferRangeForRowRange(this.editor, rowRange);
        if (targetRange.isEqual(range) && rowRanges.length) {
          rowRange = this.adjustRowRange(rowRanges.shift());
        }
      }
      return getBufferRangeForRowRange(this.editor, rowRange);
    };

    return Fold;

  })(TextObject);

  AFold = (function(superClass) {
    extend(AFold, superClass);

    function AFold() {
      return AFold.__super__.constructor.apply(this, arguments);
    }

    AFold.extend();

    return AFold;

  })(Fold);

  InnerFold = (function(superClass) {
    extend(InnerFold, superClass);

    function InnerFold() {
      return InnerFold.__super__.constructor.apply(this, arguments);
    }

    InnerFold.extend();

    return InnerFold;

  })(Fold);

  Function = (function(superClass) {
    extend(Function, superClass);

    function Function() {
      return Function.__super__.constructor.apply(this, arguments);
    }

    Function.extend(false);

    Function.prototype.omittingClosingCharLanguages = ['go'];

    Function.prototype.initialize = function() {
      Function.__super__.initialize.apply(this, arguments);
      return this.language = this.editor.getGrammar().scopeName.replace(/^source\./, '');
    };

    Function.prototype.getFoldRowRangesContainsForRow = function(row) {
      var ref2, rowRanges;
      rowRanges = (ref2 = getCodeFoldRowRangesContainesForRow(this.editor, row)) != null ? ref2.reverse() : void 0;
      return rowRanges != null ? rowRanges.filter((function(_this) {
        return function(rowRange) {
          return isIncludeFunctionScopeForRow(_this.editor, rowRange[0]);
        };
      })(this)) : void 0;
    };

    Function.prototype.adjustRowRange = function(rowRange) {
      var endRow, ref2, ref3, startRow;
      ref2 = Function.__super__.adjustRowRange.apply(this, arguments), startRow = ref2[0], endRow = ref2[1];
      if (this.isA() && (ref3 = this.language, indexOf.call(this.omittingClosingCharLanguages, ref3) >= 0)) {
        endRow += 1;
      }
      return [startRow, endRow];
    };

    return Function;

  })(Fold);

  AFunction = (function(superClass) {
    extend(AFunction, superClass);

    function AFunction() {
      return AFunction.__super__.constructor.apply(this, arguments);
    }

    AFunction.extend();

    return AFunction;

  })(Function);

  InnerFunction = (function(superClass) {
    extend(InnerFunction, superClass);

    function InnerFunction() {
      return InnerFunction.__super__.constructor.apply(this, arguments);
    }

    InnerFunction.extend();

    return InnerFunction;

  })(Function);

  CurrentLine = (function(superClass) {
    extend(CurrentLine, superClass);

    function CurrentLine() {
      return CurrentLine.__super__.constructor.apply(this, arguments);
    }

    CurrentLine.extend(false);

    CurrentLine.prototype.getRange = function(selection) {
      var range, row;
      row = this.getNormalizedHeadBufferPosition(selection).row;
      range = this.editor.bufferRangeForBufferRow(row);
      if (this.isA()) {
        return range;
      } else {
        return trimRange(this.editor, range);
      }
    };

    return CurrentLine;

  })(TextObject);

  ACurrentLine = (function(superClass) {
    extend(ACurrentLine, superClass);

    function ACurrentLine() {
      return ACurrentLine.__super__.constructor.apply(this, arguments);
    }

    ACurrentLine.extend();

    return ACurrentLine;

  })(CurrentLine);

  InnerCurrentLine = (function(superClass) {
    extend(InnerCurrentLine, superClass);

    function InnerCurrentLine() {
      return InnerCurrentLine.__super__.constructor.apply(this, arguments);
    }

    InnerCurrentLine.extend();

    return InnerCurrentLine;

  })(CurrentLine);

  Entire = (function(superClass) {
    extend(Entire, superClass);

    function Entire() {
      return Entire.__super__.constructor.apply(this, arguments);
    }

    Entire.extend(false);

    Entire.prototype.getRange = function(selection) {
      this.stopSelection();
      return this.editor.buffer.getRange();
    };

    return Entire;

  })(TextObject);

  AEntire = (function(superClass) {
    extend(AEntire, superClass);

    function AEntire() {
      return AEntire.__super__.constructor.apply(this, arguments);
    }

    AEntire.extend();

    return AEntire;

  })(Entire);

  InnerEntire = (function(superClass) {
    extend(InnerEntire, superClass);

    function InnerEntire() {
      return InnerEntire.__super__.constructor.apply(this, arguments);
    }

    InnerEntire.extend();

    return InnerEntire;

  })(Entire);

  All = (function(superClass) {
    extend(All, superClass);

    function All() {
      return All.__super__.constructor.apply(this, arguments);
    }

    All.extend(false);

    return All;

  })(Entire);

  Empty = (function(superClass) {
    extend(Empty, superClass);

    function Empty() {
      return Empty.__super__.constructor.apply(this, arguments);
    }

    Empty.extend(false);

    return Empty;

  })(TextObject);

  LatestChange = (function(superClass) {
    extend(LatestChange, superClass);

    function LatestChange() {
      return LatestChange.__super__.constructor.apply(this, arguments);
    }

    LatestChange.extend(false);

    LatestChange.prototype.getRange = function() {
      this.stopSelection();
      return this.vimState.mark.getRange('[', ']');
    };

    return LatestChange;

  })(TextObject);

  ALatestChange = (function(superClass) {
    extend(ALatestChange, superClass);

    function ALatestChange() {
      return ALatestChange.__super__.constructor.apply(this, arguments);
    }

    ALatestChange.extend();

    return ALatestChange;

  })(LatestChange);

  InnerLatestChange = (function(superClass) {
    extend(InnerLatestChange, superClass);

    function InnerLatestChange() {
      return InnerLatestChange.__super__.constructor.apply(this, arguments);
    }

    InnerLatestChange.extend();

    return InnerLatestChange;

  })(LatestChange);

  SearchMatchForward = (function(superClass) {
    extend(SearchMatchForward, superClass);

    function SearchMatchForward() {
      return SearchMatchForward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchForward.extend();

    SearchMatchForward.prototype.backward = false;

    SearchMatchForward.prototype.findMatch = function(fromPoint, pattern) {
      var found, scanRange;
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      scanRange = [[fromPoint.row, 0], this.getVimEofBufferPosition()];
      found = null;
      this.editor.scanInBufferRange(pattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'end'
      };
    };

    SearchMatchForward.prototype.getRange = function(selection) {
      var fromPoint, pattern, range, ref2, whichIsHead;
      pattern = this.globalState.get('lastSearchPattern');
      if (pattern == null) {
        return;
      }
      fromPoint = selection.getHeadBufferPosition();
      ref2 = this.findMatch(fromPoint, pattern), range = ref2.range, whichIsHead = ref2.whichIsHead;
      if (range != null) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    };

    SearchMatchForward.prototype.unionRangeAndDetermineReversedState = function(selection, found, whichIsHead) {
      var head, tail;
      if (selection.isEmpty()) {
        return found;
      } else {
        head = found[whichIsHead];
        tail = selection.getTailBufferPosition();
        if (this.backward) {
          if (tail.isLessThan(head)) {
            head = translatePointAndClip(this.editor, head, 'forward');
          }
        } else {
          if (head.isLessThan(tail)) {
            head = translatePointAndClip(this.editor, head, 'backward');
          }
        }
        this.reversed = head.isLessThan(tail);
        return new Range(tail, head).union(swrap(selection).getTailBufferRange());
      }
    };

    SearchMatchForward.prototype.selectTextObject = function(selection) {
      var range, ref2, reversed;
      if (!(range = this.getRange(selection))) {
        return;
      }
      reversed = (ref2 = this.reversed) != null ? ref2 : this.backward;
      swrap(selection).setBufferRange(range, {
        reversed: reversed
      });
      return selection.cursor.autoscroll();
    };

    return SearchMatchForward;

  })(TextObject);

  SearchMatchBackward = (function(superClass) {
    extend(SearchMatchBackward, superClass);

    function SearchMatchBackward() {
      return SearchMatchBackward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchBackward.extend();

    SearchMatchBackward.prototype.backward = true;

    SearchMatchBackward.prototype.findMatch = function(fromPoint, pattern) {
      var found, scanRange;
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      scanRange = [[fromPoint.row, 2e308], [0, 0]];
      found = null;
      this.editor.backwardsScanInBufferRange(pattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.start.isLessThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'start'
      };
    };

    return SearchMatchBackward;

  })(SearchMatchForward);

  PreviousSelection = (function(superClass) {
    extend(PreviousSelection, superClass);

    function PreviousSelection() {
      return PreviousSelection.__super__.constructor.apply(this, arguments);
    }

    PreviousSelection.extend();

    PreviousSelection.prototype.select = function() {
      var properties, ref2, selection;
      ref2 = this.vimState.previousSelection, properties = ref2.properties, this.submode = ref2.submode;
      if ((properties != null) && (this.submode != null)) {
        selection = this.editor.getLastSelection();
        return swrap(selection).selectByProperties(properties);
      }
    };

    return PreviousSelection;

  })(TextObject);

  PersistentSelection = (function(superClass) {
    extend(PersistentSelection, superClass);

    function PersistentSelection() {
      return PersistentSelection.__super__.constructor.apply(this, arguments);
    }

    PersistentSelection.extend(false);

    PersistentSelection.prototype.select = function() {
      var ranges;
      ranges = this.vimState.persistentSelection.getMarkerBufferRanges();
      if (ranges.length) {
        this.editor.setSelectedBufferRanges(ranges);
      }
      return this.vimState.clearPersistentSelections();
    };

    return PersistentSelection;

  })(TextObject);

  APersistentSelection = (function(superClass) {
    extend(APersistentSelection, superClass);

    function APersistentSelection() {
      return APersistentSelection.__super__.constructor.apply(this, arguments);
    }

    APersistentSelection.extend();

    return APersistentSelection;

  })(PersistentSelection);

  InnerPersistentSelection = (function(superClass) {
    extend(InnerPersistentSelection, superClass);

    function InnerPersistentSelection() {
      return InnerPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    InnerPersistentSelection.extend();

    return InnerPersistentSelection;

  })(PersistentSelection);

  VisibleArea = (function(superClass) {
    extend(VisibleArea, superClass);

    function VisibleArea() {
      return VisibleArea.__super__.constructor.apply(this, arguments);
    }

    VisibleArea.extend(false);

    VisibleArea.prototype.getRange = function(selection) {
      this.stopSelection();
      return getVisibleBufferRange(this.editor).translate([+1, 0], [-3, 0]);
    };

    return VisibleArea;

  })(TextObject);

  AVisibleArea = (function(superClass) {
    extend(AVisibleArea, superClass);

    function AVisibleArea() {
      return AVisibleArea.__super__.constructor.apply(this, arguments);
    }

    AVisibleArea.extend();

    return AVisibleArea;

  })(VisibleArea);

  InnerVisibleArea = (function(superClass) {
    extend(InnerVisibleArea, superClass);

    function InnerVisibleArea() {
      return InnerVisibleArea.__super__.constructor.apply(this, arguments);
    }

    InnerVisibleArea.extend();

    return InnerVisibleArea;

  })(VisibleArea);

  Edge = (function(superClass) {
    extend(Edge, superClass);

    function Edge() {
      return Edge.__super__.constructor.apply(this, arguments);
    }

    Edge.extend(false);

    Edge.prototype.select = function() {
      this.success = null;
      Edge.__super__.select.apply(this, arguments);
      if (this.success) {
        return this.vimState.activate('visual', 'linewise');
      }
    };

    Edge.prototype.getRange = function(selection) {
      var endScreenPoint, fromPoint, moveDownToEdge, moveUpToEdge, range, screenRange, startScreenPoint;
      fromPoint = this.getNormalizedHeadScreenPosition(selection);
      moveUpToEdge = this["new"]('MoveUpToEdge');
      moveDownToEdge = this["new"]('MoveDownToEdge');
      if (!moveUpToEdge.isStoppablePoint(fromPoint)) {
        return;
      }
      startScreenPoint = endScreenPoint = null;
      if (moveUpToEdge.isEdge(fromPoint)) {
        startScreenPoint = endScreenPoint = fromPoint;
      }
      if (moveUpToEdge.isStoppablePoint(fromPoint.translate([-1, 0]))) {
        startScreenPoint = moveUpToEdge.getPoint(fromPoint);
      }
      if (moveDownToEdge.isStoppablePoint(fromPoint.translate([+1, 0]))) {
        endScreenPoint = moveDownToEdge.getPoint(fromPoint);
      }
      if ((startScreenPoint != null) && (endScreenPoint != null)) {
        if (this.success == null) {
          this.success = true;
        }
        screenRange = new Range(startScreenPoint, endScreenPoint);
        range = this.editor.bufferRangeForScreenRange(screenRange);
        return getRangeByTranslatePointAndClip(this.editor, range, 'end', 'forward');
      }
    };

    return Edge;

  })(TextObject);

  AEdge = (function(superClass) {
    extend(AEdge, superClass);

    function AEdge() {
      return AEdge.__super__.constructor.apply(this, arguments);
    }

    AEdge.extend();

    return AEdge;

  })(Edge);

  InnerEdge = (function(superClass) {
    extend(InnerEdge, superClass);

    function InnerEdge() {
      return InnerEdge.__super__.constructor.apply(this, arguments);
    }

    InnerEdge.extend();

    return InnerEdge;

  })(Edge);

  UnionTextObject = (function(superClass) {
    extend(UnionTextObject, superClass);

    function UnionTextObject() {
      return UnionTextObject.__super__.constructor.apply(this, arguments);
    }

    UnionTextObject.extend(false);

    UnionTextObject.prototype.member = [];

    UnionTextObject.prototype.getRange = function(selection) {
      var j, len, member, range, ref2, unionRange;
      unionRange = null;
      ref2 = this.member;
      for (j = 0, len = ref2.length; j < len; j++) {
        member = ref2[j];
        if (range = this["new"](member).getRange(selection)) {
          if (unionRange != null) {
            unionRange = unionRange.union(range);
          } else {
            unionRange = range;
          }
        }
      }
      return unionRange;
    };

    return UnionTextObject;

  })(TextObject);

  AFunctionOrInnerParagraph = (function(superClass) {
    extend(AFunctionOrInnerParagraph, superClass);

    function AFunctionOrInnerParagraph() {
      return AFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    AFunctionOrInnerParagraph.extend();

    AFunctionOrInnerParagraph.prototype.member = ['AFunction', 'InnerParagraph'];

    return AFunctionOrInnerParagraph;

  })(UnionTextObject);

  ACurrentSelectionAndAPersistentSelection = (function(superClass) {
    extend(ACurrentSelectionAndAPersistentSelection, superClass);

    function ACurrentSelectionAndAPersistentSelection() {
      return ACurrentSelectionAndAPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    ACurrentSelectionAndAPersistentSelection.extend();

    ACurrentSelectionAndAPersistentSelection.prototype.select = function() {
      var pesistentRanges, ranges, selectedRanges;
      pesistentRanges = this.vimState.getPersistentSelectionBuffferRanges();
      selectedRanges = this.editor.getSelectedBufferRanges();
      ranges = pesistentRanges.concat(selectedRanges);
      if (ranges.length) {
        this.editor.setSelectedBufferRanges(ranges);
      }
      this.vimState.clearPersistentSelections();
      return this.editor.mergeIntersectingSelections();
    };

    return ACurrentSelectionAndAPersistentSelection;

  })(TextObject);

  TextObjectFirstFound = (function(superClass) {
    extend(TextObjectFirstFound, superClass);

    function TextObjectFirstFound() {
      return TextObjectFirstFound.__super__.constructor.apply(this, arguments);
    }

    TextObjectFirstFound.extend(false);

    TextObjectFirstFound.prototype.member = [];

    TextObjectFirstFound.prototype.memberOptoins = {
      allowNextLine: false
    };

    TextObjectFirstFound.prototype.getRangeBy = function(klass, selection) {
      return this["new"](klass, this.memberOptoins).getRange(selection);
    };

    TextObjectFirstFound.prototype.getRanges = function(selection) {
      var j, klass, len, range, ref2, results;
      ref2 = this.member;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        klass = ref2[j];
        if ((range = this.getRangeBy(klass, selection))) {
          results.push(range);
        }
      }
      return results;
    };

    TextObjectFirstFound.prototype.getRange = function(selection) {
      var j, len, member, range, ref2;
      ref2 = this.member;
      for (j = 0, len = ref2.length; j < len; j++) {
        member = ref2[j];
        if (range = this.getRangeBy(member, selection)) {
          return range;
        }
      }
    };

    return TextObjectFirstFound;

  })(TextObject);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi90ZXh0LW9iamVjdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHE0REFBQTtJQUFBOzs7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBT0osSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1IsT0FpQkksT0FBQSxDQUFRLFNBQVIsQ0FqQkosRUFDRSw0QkFERixFQUNjLHNEQURkLEVBQ3VDLDBCQUR2QyxFQUNrRCw0Q0FEbEQsRUFFRSxvQ0FGRixFQUdFLDREQUhGLEVBSUUsOEVBSkYsRUFLRSwwREFMRixFQU1FLGdFQU5GLEVBT0UsNERBUEYsRUFRRSx3REFSRixFQVNFLGtEQVRGLEVBVUUsa0RBVkYsRUFXRSxzRUFYRixFQVlFLGtDQVpGLEVBYUUsZ0RBYkYsRUFlRSw0REFmRixFQWdCRTs7RUFHSTs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOzt5QkFDQSxrQkFBQSxHQUFvQjs7SUFDUCxvQkFBQTtNQUNYLElBQUMsQ0FBQSxXQUFXLENBQUEsU0FBRSxDQUFBLEtBQWQsR0FBc0IsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsVUFBWCxDQUFzQixPQUF0QjtNQUN0Qiw2Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQUhXOzt5QkFLYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQTtJQURNOzt5QkFHVCxHQUFBLEdBQUssU0FBQTthQUNILENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUREOzt5QkFHTCxvQkFBQSxHQUFzQixTQUFBO2FBQ3BCLElBQUMsQ0FBQTtJQURtQjs7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QyxDQUFDLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVosRUFBbUIsU0FBbkIsQ0FBVDt1QkFBaEM7O0FBQUE7O0lBRFE7O21DQUdYLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFDUixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztZQUEyQixLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLEVBQW9CLFNBQXBCO0FBQ2pDLGlCQUFPOztBQURUO0lBRFE7Ozs7S0FYdUI7QUE5N0JuQyIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZSwgUG9pbnR9ID0gcmVxdWlyZSAnYXRvbSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbiMgW1RPRE9dIE5lZWQgb3ZlcmhhdWxcbiMgIC0gWyBdIG11c3QgaGF2ZSBnZXRSYW5nZShzZWxlY3Rpb24pIC0+XG4jICAtIFsgXSBSZW1vdmUgc2VsZWN0VGV4dE9iamVjdD9cbiMgIC0gWyBdIE1ha2UgZXhwYW5kYWJsZSBieSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbihAZ2V0UmFuZ2Uoc2VsZWN0aW9uKSlcbiMgIC0gWyBdIENvdW50IHN1cHBvcnQocHJpb3JpdHkgbG93KT9cbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG57XG4gIHNvcnRSYW5nZXMsIHNvcnRSYW5nZXNCeUVuZFBvc2l0aW9uLCBjb3VudENoYXIsIHBvaW50SXNBdEVuZE9mTGluZSxcbiAgZ2V0VGV4dFRvUG9pbnRcbiAgZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3dcbiAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3dcbiAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZVxuICBpc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93XG4gIGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuXG4gIGdldEVuZFBvc2l0aW9uRm9yUGF0dGVyblxuICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2VcbiAgdHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXBcbiAgZ2V0QnVmZmVyUm93c1xuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuXG4gIGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuXG4gIHRyaW1SYW5nZVxufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbmNsYXNzIFRleHRPYmplY3QgZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93U3VibW9kZUNoYW5nZTogdHJ1ZVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY29uc3RydWN0b3I6OmlubmVyID0gQGdldE5hbWUoKS5zdGFydHNXaXRoKCdJbm5lcicpXG4gICAgc3VwZXJcbiAgICBAaW5pdGlhbGl6ZSgpXG5cbiAgaXNJbm5lcjogLT5cbiAgICBAaW5uZXJcblxuICBpc0E6IC0+XG4gICAgbm90IEBpc0lubmVyKClcblxuICBpc0FsbG93U3VibW9kZUNoYW5nZTogLT5cbiAgICBAYWxsb3dTdWJtb2RlQ2hhbmdlXG5cbiAgaXNMaW5ld2lzZTogLT5cbiAgICBpZiBAaXNBbGxvd1N1Ym1vZGVDaGFuZ2UoKVxuICAgICAgc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcikgaXMgJ2xpbmV3aXNlJ1xuICAgIGVsc2VcbiAgICAgIEBpc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpXG5cbiAgc3RvcFNlbGVjdGlvbjogLT5cbiAgICBAY2FuU2VsZWN0ID0gZmFsc2VcblxuICBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIGhlYWQgPSBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2JhY2t3YXJkJylcbiAgICBoZWFkXG5cbiAgZ2V0Tm9ybWFsaXplZEhlYWRTY3JlZW5Qb3NpdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBidWZmZXJQb3NpdGlvbiA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbilcbiAgICBAZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG5cbiAgc2VsZWN0OiAtPlxuICAgIEBjYW5TZWxlY3QgPSB0cnVlXG5cbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIEBjYW5TZWxlY3RcbiAgICAgICAgQHNlbGVjdFRleHRPYmplY3Qoc2VsZWN0aW9uKVxuICAgIEBlZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICBAdXBkYXRlU2VsZWN0aW9uUHJvcGVydGllcygpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG5cbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZSA9IEBnZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJSYW5nZVNhZmVseShyYW5nZSlcblxuICBnZXRSYW5nZTogLT5cbiAgICAjIEkgd2FudCB0b1xuICAgICMgdGhyb3cgbmV3IEVycm9yKCd0ZXh0LW9iamVjdCBtdXN0IHJlc3BvbmQgdG8gcmFuZ2UgYnkgZ2V0UmFuZ2UoKSEnKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFdvcmQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcG9pbnQgPSBAZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbihzZWxlY3Rpb24pXG4gICAge3JhbmdlLCBraW5kfSA9IEBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbihwb2ludCwge0B3b3JkUmVnZXh9KVxuICAgIGlmIEBpc0EoKSBhbmQga2luZCBpcyAnd29yZCdcbiAgICAgIHJhbmdlID0gQGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlcyhyYW5nZSlcbiAgICByYW5nZVxuXG4gIGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlczogKHJhbmdlKSAtPlxuICAgIGlmIG5ld0VuZCA9IGdldEVuZFBvc2l0aW9uRm9yUGF0dGVybihAZWRpdG9yLCByYW5nZS5lbmQsIC9cXHMrLywgY29udGFpbmVkT25seTogdHJ1ZSlcbiAgICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2Uuc3RhcnQsIG5ld0VuZClcblxuICAgIGlmIG5ld1N0YXJ0ID0gZ2V0U3RhcnRQb3NpdGlvbkZvclBhdHRlcm4oQGVkaXRvciwgcmFuZ2Uuc3RhcnQsIC9cXHMrLywgY29udGFpbmVkT25seTogdHJ1ZSlcbiAgICAgICMgVG8gY29tZm9ybSB3aXRoIHB1cmUgdmltLCBleHBhbmQgYXMgbG9uZyBhcyBpdCdzIG5vdCBpbmRlbnQod2hpdGUgc3BhY2VzIHN0YXJ0aW5nIHdpdGggY29sdW1uIDApLlxuICAgICAgcmV0dXJuIG5ldyBSYW5nZShuZXdTdGFydCwgcmFuZ2UuZW5kKSB1bmxlc3MgbmV3U3RhcnQuY29sdW1uIGlzIDBcblxuICAgIHJhbmdlICMgcmV0dXJuIG9yaWdpbmFsIHJhbmdlIGFzIGZhbGxiYWNrXG5cbmNsYXNzIEFXb3JkIGV4dGVuZHMgV29yZFxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJXb3JkIGV4dGVuZHMgV29yZFxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBXaG9sZVdvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoZmFsc2UpXG4gIHdvcmRSZWdleDogL1xcUysvXG5cbmNsYXNzIEFXaG9sZVdvcmQgZXh0ZW5kcyBXaG9sZVdvcmRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyV2hvbGVXb3JkIGV4dGVuZHMgV2hvbGVXb3JkXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFNtYXJ0V29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9cblxuY2xhc3MgQVNtYXJ0V29yZCBleHRlbmRzIFNtYXJ0V29yZFxuICBAZGVzY3JpcHRpb246IFwiQSB3b3JkIHRoYXQgY29uc2lzdHMgb2YgYWxwaGFudW1lcmljIGNoYXJzKGAvW0EtWmEtejAtOV9dL2ApIGFuZCBoeXBoZW4gYC1gXCJcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyU21hcnRXb3JkIGV4dGVuZHMgU21hcnRXb3JkXG4gIEBkZXNjcmlwdGlvbjogXCJDdXJyZW50bHkgTm8gZGlmZiBmcm9tIGBhLXNtYXJ0LXdvcmRgXCJcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgUGFpciBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dOZXh0TGluZTogZmFsc2VcbiAgYWxsb3dTdWJtb2RlQ2hhbmdlOiBmYWxzZVxuICBhZGp1c3RJbm5lclJhbmdlOiB0cnVlXG4gIHBhaXI6IG51bGxcblxuICBnZXRQYXR0ZXJuOiAtPlxuICAgIFtvcGVuLCBjbG9zZV0gPSBAcGFpclxuICAgIGlmIG9wZW4gaXMgY2xvc2VcbiAgICAgIG5ldyBSZWdFeHAoXCIoI3tfLmVzY2FwZVJlZ0V4cChvcGVuKX0pXCIsICdnJylcbiAgICBlbHNlXG4gICAgICBuZXcgUmVnRXhwKFwiKCN7Xy5lc2NhcGVSZWdFeHAob3Blbil9KXwoI3tfLmVzY2FwZVJlZ0V4cChjbG9zZSl9KVwiLCAnZycpXG5cbiAgIyBSZXR1cm4gJ29wZW4nIG9yICdjbG9zZSdcbiAgZ2V0UGFpclN0YXRlOiAoe21hdGNoVGV4dCwgcmFuZ2UsIG1hdGNofSkgLT5cbiAgICBzd2l0Y2ggbWF0Y2gubGVuZ3RoXG4gICAgICB3aGVuIDJcbiAgICAgICAgQHBhaXJTdGF0ZUluQnVmZmVyUmFuZ2UocmFuZ2UsIG1hdGNoVGV4dClcbiAgICAgIHdoZW4gM1xuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICB3aGVuIG1hdGNoWzFdIHRoZW4gJ29wZW4nXG4gICAgICAgICAgd2hlbiBtYXRjaFsyXSB0aGVuICdjbG9zZSdcblxuICBiYWNrU2xhc2hQYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAoJ1xcXFwnKVxuICBwYWlyU3RhdGVJbkJ1ZmZlclJhbmdlOiAocmFuZ2UsIGNoYXIpIC0+XG4gICAgdGV4dCA9IGdldFRleHRUb1BvaW50KEBlZGl0b3IsIHJhbmdlLmVuZClcbiAgICBlc2NhcGVkQ2hhciA9IF8uZXNjYXBlUmVnRXhwKGNoYXIpXG4gICAgYnMgPSBiYWNrU2xhc2hQYXR0ZXJuXG4gICAgcGF0dGVybnMgPSBbXG4gICAgICBcIiN7YnN9I3tic30je2VzY2FwZWRDaGFyfVwiXG4gICAgICBcIlteI3tic31dPyN7ZXNjYXBlZENoYXJ9XCJcbiAgICBdXG4gICAgcGF0dGVybiA9IG5ldyBSZWdFeHAocGF0dGVybnMuam9pbignfCcpKVxuICAgIFsnY2xvc2UnLCAnb3BlbiddWyhjb3VudENoYXIodGV4dCwgcGF0dGVybikgJSAyKV1cblxuICAjIFRha2Ugc3RhcnQgcG9pbnQgb2YgbWF0Y2hlZCByYW5nZS5cbiAgaXNFc2NhcGVkQ2hhckF0UG9pbnQ6IChwb2ludCkgLT5cbiAgICBmb3VuZCA9IGZhbHNlXG5cbiAgICBicyA9IGJhY2tTbGFzaFBhdHRlcm5cbiAgICBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcIlteI3tic31dI3tic31cIilcbiAgICBzY2FuUmFuZ2UgPSBbW3BvaW50LnJvdywgMF0sIHBvaW50XVxuICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe21hdGNoVGV4dCwgcmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzRXF1YWwocG9pbnQpXG4gICAgICAgIHN0b3AoKVxuICAgICAgICBmb3VuZCA9IHRydWVcbiAgICBmb3VuZFxuXG4gIGZpbmRQYWlyOiAod2hpY2gsIG9wdGlvbnMsIGZuKSAtPlxuICAgIHtmcm9tLCBwYXR0ZXJuLCBzY2FuRnVuYywgc2NhblJhbmdlfSA9IG9wdGlvbnNcbiAgICBAZWRpdG9yW3NjYW5GdW5jXSBwYXR0ZXJuLCBzY2FuUmFuZ2UsIChldmVudCkgPT5cbiAgICAgIHttYXRjaFRleHQsIHJhbmdlLCBzdG9wfSA9IGV2ZW50XG4gICAgICB1bmxlc3MgQGFsbG93TmV4dExpbmUgb3IgKGZyb20ucm93IGlzIHJhbmdlLnN0YXJ0LnJvdylcbiAgICAgICAgcmV0dXJuIHN0b3AoKVxuICAgICAgcmV0dXJuIGlmIEBpc0VzY2FwZWRDaGFyQXRQb2ludChyYW5nZS5zdGFydClcbiAgICAgIGZuKGV2ZW50KVxuXG4gIGZpbmRPcGVuOiAoZnJvbSwgIHBhdHRlcm4pIC0+XG4gICAgc2NhbkZ1bmMgPSAnYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UnXG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKFswLCAwXSwgZnJvbSlcbiAgICBzdGFjayA9IFtdXG4gICAgZm91bmQgPSBudWxsXG4gICAgQGZpbmRQYWlyICdvcGVuJywge2Zyb20sIHBhdHRlcm4sIHNjYW5GdW5jLCBzY2FuUmFuZ2V9LCAoZXZlbnQpID0+XG4gICAgICB7bWF0Y2hUZXh0LCByYW5nZSwgc3RvcH0gPSBldmVudFxuICAgICAgcGFpclN0YXRlID0gQGdldFBhaXJTdGF0ZShldmVudClcbiAgICAgIGlmIHBhaXJTdGF0ZSBpcyAnY2xvc2UnXG4gICAgICAgIHN0YWNrLnB1c2goe3BhaXJTdGF0ZSwgbWF0Y2hUZXh0LCByYW5nZX0pXG4gICAgICBlbHNlXG4gICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aCBpcyAwXG4gICAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgc3RvcCgpIGlmIGZvdW5kP1xuICAgIGZvdW5kXG5cbiAgZmluZENsb3NlOiAoZnJvbSwgIHBhdHRlcm4pIC0+XG4gICAgc2NhbkZ1bmMgPSAnc2NhbkluQnVmZmVyUmFuZ2UnXG4gICAgc2NhblJhbmdlID0gbmV3IFJhbmdlKGZyb20sIEBlZGl0b3IuYnVmZmVyLmdldEVuZFBvc2l0aW9uKCkpXG4gICAgc3RhY2sgPSBbXVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBmaW5kUGFpciAnY2xvc2UnLCB7ZnJvbSwgcGF0dGVybiwgc2NhbkZ1bmMsIHNjYW5SYW5nZX0sIChldmVudCkgPT5cbiAgICAgIHtyYW5nZSwgc3RvcH0gPSBldmVudFxuICAgICAgcGFpclN0YXRlID0gQGdldFBhaXJTdGF0ZShldmVudClcbiAgICAgIGlmIHBhaXJTdGF0ZSBpcyAnb3BlbidcbiAgICAgICAgc3RhY2sucHVzaCh7cGFpclN0YXRlLCByYW5nZX0pXG4gICAgICBlbHNlXG4gICAgICAgIGVudHJ5ID0gc3RhY2sucG9wKClcbiAgICAgICAgaWYgc3RhY2subGVuZ3RoIGlzIDBcbiAgICAgICAgICBpZiAob3BlblN0YXJ0ID0gZW50cnk/LnJhbmdlLnN0YXJ0KVxuICAgICAgICAgICAgaWYgQGFsbG93Rm9yd2FyZGluZ1xuICAgICAgICAgICAgICByZXR1cm4gaWYgb3BlblN0YXJ0LnJvdyA+IGZyb20ucm93XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHJldHVybiBpZiBvcGVuU3RhcnQuaXNHcmVhdGVyVGhhbihmcm9tKVxuICAgICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgIHN0b3AoKSBpZiBmb3VuZD9cbiAgICBmb3VuZFxuXG4gIGdldFBhaXJJbmZvOiAoZnJvbSkgLT5cbiAgICBwYWlySW5mbyA9IG51bGxcbiAgICBwYXR0ZXJuID0gQGdldFBhdHRlcm4oKVxuICAgIGNsb3NlUmFuZ2UgPSBAZmluZENsb3NlIGZyb20sIHBhdHRlcm5cbiAgICBvcGVuUmFuZ2UgPSBAZmluZE9wZW4gY2xvc2VSYW5nZS5lbmQsIHBhdHRlcm4gaWYgY2xvc2VSYW5nZT9cblxuICAgIHVubGVzcyAob3BlblJhbmdlPyBhbmQgY2xvc2VSYW5nZT8pXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgYVJhbmdlID0gbmV3IFJhbmdlKG9wZW5SYW5nZS5zdGFydCwgY2xvc2VSYW5nZS5lbmQpXG4gICAgW2lubmVyU3RhcnQsIGlubmVyRW5kXSA9IFtvcGVuUmFuZ2UuZW5kLCBjbG9zZVJhbmdlLnN0YXJ0XVxuICAgIGlmIEBhZGp1c3RJbm5lclJhbmdlXG4gICAgICAjIERpcnR5IHdvcmsgdG8gZmVlbCBuYXR1cmFsIGZvciBodW1hbiwgdG8gYmVoYXZlIGNvbXBhdGlibGUgd2l0aCBwdXJlIFZpbS5cbiAgICAgICMgV2hlcmUgdGhpcyBhZGp1c3RtZW50IGFwcGVhciBpcyBpbiBmb2xsb3dpbmcgc2l0dWF0aW9uLlxuICAgICAgIyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAgICMgb3AtMjogYGRpe2AgZGVsZXRlIG9ubHkgMm5kIGxpbmUuXG4gICAgICAjIHRleHQ6XG4gICAgICAjICB7XG4gICAgICAjICAgIGFhYVxuICAgICAgIyAgfVxuICAgICAgaW5uZXJTdGFydCA9IG5ldyBQb2ludChpbm5lclN0YXJ0LnJvdyArIDEsIDApIGlmIHBvaW50SXNBdEVuZE9mTGluZShAZWRpdG9yLCBpbm5lclN0YXJ0KVxuICAgICAgaW5uZXJFbmQgPSBuZXcgUG9pbnQoaW5uZXJFbmQucm93LCAwKSBpZiBnZXRUZXh0VG9Qb2ludChAZWRpdG9yLCBpbm5lckVuZCkubWF0Y2goL15cXHMqJC8pXG4gICAgICBpZiAoaW5uZXJFbmQuY29sdW1uIGlzIDApIGFuZCAoaW5uZXJTdGFydC5jb2x1bW4gaXNudCAwKVxuICAgICAgICBpbm5lckVuZCA9IG5ldyBQb2ludChpbm5lckVuZC5yb3cgLSAxLCBJbmZpbml0eSlcblxuICAgIGlubmVyUmFuZ2UgPSBuZXcgUmFuZ2UoaW5uZXJTdGFydCwgaW5uZXJFbmQpXG4gICAgdGFyZ2V0UmFuZ2UgPSBpZiBAaXNJbm5lcigpIHRoZW4gaW5uZXJSYW5nZSBlbHNlIGFSYW5nZVxuICAgIGlmIEBza2lwRW1wdHlQYWlyIGFuZCBpbm5lclJhbmdlLmlzRW1wdHkoKVxuICAgICAgQGdldFBhaXJJbmZvKGFSYW5nZS5lbmQpXG4gICAgZWxzZVxuICAgICAge29wZW5SYW5nZSwgY2xvc2VSYW5nZSwgYVJhbmdlLCBpbm5lclJhbmdlLCB0YXJnZXRSYW5nZX1cblxuICBnZXRQb2ludFRvU2VhcmNoRnJvbTogKHNlbGVjdGlvbiwgc2VhcmNoRnJvbSkgLT5cbiAgICBzd2l0Y2ggc2VhcmNoRnJvbVxuICAgICAgd2hlbiAnaGVhZCcgdGhlbiBAZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbihzZWxlY3Rpb24pXG4gICAgICB3aGVuICdzdGFydCcgdGhlbiBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdzdGFydCcpXG5cbiAgIyBBbGxvdyBvdmVycmlkZSBAYWxsb3dGb3J3YXJkaW5nIGJ5IDJuZCBhcmd1bWVudC5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24sIG9wdGlvbnM9e30pIC0+XG4gICAge2FsbG93Rm9yd2FyZGluZywgc2VhcmNoRnJvbX0gPSBvcHRpb25zXG4gICAgc2VhcmNoRnJvbSA/PSAnaGVhZCdcbiAgICBAYWxsb3dGb3J3YXJkaW5nID0gYWxsb3dGb3J3YXJkaW5nIGlmIGFsbG93Rm9yd2FyZGluZz9cbiAgICBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBwYWlySW5mbyA9IEBnZXRQYWlySW5mbyhAZ2V0UG9pbnRUb1NlYXJjaEZyb20oc2VsZWN0aW9uLCBzZWFyY2hGcm9tKSlcbiAgICAjIFdoZW4gcmFuZ2Ugd2FzIHNhbWUsIHRyeSB0byBleHBhbmQgcmFuZ2VcbiAgICBpZiBwYWlySW5mbz8udGFyZ2V0UmFuZ2UuaXNFcXVhbChvcmlnaW5hbFJhbmdlKVxuICAgICAgcGFpckluZm8gPSBAZ2V0UGFpckluZm8ocGFpckluZm8uYVJhbmdlLmVuZClcbiAgICBwYWlySW5mbz8udGFyZ2V0UmFuZ2VcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBBbnlQYWlyIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd0ZvcndhcmRpbmc6IGZhbHNlXG4gIGFsbG93TmV4dExpbmU6IG51bGxcbiAgc2tpcEVtcHR5UGFpcjogZmFsc2VcbiAgbWVtYmVyOiBbXG4gICAgJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJyxcbiAgICAnQ3VybHlCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCcsICdUYWcnLCAnU3F1YXJlQnJhY2tldCcsICdQYXJlbnRoZXNpcydcbiAgXVxuXG4gIGdldFJhbmdlQnk6IChrbGFzcywgc2VsZWN0aW9uKSAtPlxuICAgIG9wdGlvbnMgPSB7QGlubmVyLCBAc2tpcEVtcHR5UGFpcn1cbiAgICBvcHRpb25zLmFsbG93TmV4dExpbmUgPSBAYWxsb3dOZXh0TGluZSBpZiBAYWxsb3dOZXh0TGluZT9cbiAgICBAbmV3KGtsYXNzLCBvcHRpb25zKS5nZXRSYW5nZShzZWxlY3Rpb24sIHtAYWxsb3dGb3J3YXJkaW5nLCBAc2VhcmNoRnJvbX0pXG5cbiAgZ2V0UmFuZ2VzOiAoc2VsZWN0aW9uKSAtPlxuICAgIChyYW5nZSBmb3Iga2xhc3MgaW4gQG1lbWJlciB3aGVuIChyYW5nZSA9IEBnZXRSYW5nZUJ5KGtsYXNzLCBzZWxlY3Rpb24pKSlcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICBfLmxhc3Qoc29ydFJhbmdlcyhyYW5nZXMpKSBpZiByYW5nZXMubGVuZ3RoXG5cbmNsYXNzIEFBbnlQYWlyIGV4dGVuZHMgQW55UGFpclxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJBbnlQYWlyIGV4dGVuZHMgQW55UGFpclxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBBbnlQYWlyQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQW55UGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVzY3JpcHRpb246IFwiUmFuZ2Ugc3Vycm91bmRlZCBieSBhdXRvLWRldGVjdGVkIHBhaXJlZCBjaGFycyBmcm9tIGVuY2xvc2VkIGFuZCBmb3J3YXJkaW5nIGFyZWFcIlxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgc2tpcEVtcHR5UGFpcjogZmFsc2VcbiAgc2VhcmNoRnJvbTogJ3N0YXJ0J1xuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICBmcm9tID0gc2VsZWN0aW9uLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgW2ZvcndhcmRpbmdSYW5nZXMsIGVuY2xvc2luZ1Jhbmdlc10gPSBfLnBhcnRpdGlvbiByYW5nZXMsIChyYW5nZSkgLT5cbiAgICAgIHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW5PckVxdWFsKGZyb20pXG4gICAgZW5jbG9zaW5nUmFuZ2UgPSBfLmxhc3Qoc29ydFJhbmdlcyhlbmNsb3NpbmdSYW5nZXMpKVxuICAgIGZvcndhcmRpbmdSYW5nZXMgPSBzb3J0UmFuZ2VzKGZvcndhcmRpbmdSYW5nZXMpXG5cbiAgICAjIFdoZW4gZW5jbG9zaW5nUmFuZ2UgaXMgZXhpc3RzLFxuICAgICMgV2UgZG9uJ3QgZ28gYWNyb3NzIGVuY2xvc2luZ1JhbmdlLmVuZC5cbiAgICAjIFNvIGNob29zZSBmcm9tIHJhbmdlcyBjb250YWluZWQgaW4gZW5jbG9zaW5nUmFuZ2UuXG4gICAgaWYgZW5jbG9zaW5nUmFuZ2VcbiAgICAgIGZvcndhcmRpbmdSYW5nZXMgPSBmb3J3YXJkaW5nUmFuZ2VzLmZpbHRlciAocmFuZ2UpIC0+XG4gICAgICAgIGVuY2xvc2luZ1JhbmdlLmNvbnRhaW5zUmFuZ2UocmFuZ2UpXG5cbiAgICBmb3J3YXJkaW5nUmFuZ2VzWzBdIG9yIGVuY2xvc2luZ1JhbmdlXG5cbmNsYXNzIEFBbnlQYWlyQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQW55UGFpckFsbG93Rm9yd2FyZGluZ1xuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJBbnlQYWlyQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQW55UGFpckFsbG93Rm9yd2FyZGluZ1xuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBBbnlRdW90ZSBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG4gIG1lbWJlcjogWydEb3VibGVRdW90ZScsICdTaW5nbGVRdW90ZScsICdCYWNrVGljayddXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJhbmdlcyA9IEBnZXRSYW5nZXMoc2VsZWN0aW9uKVxuICAgICMgUGljayByYW5nZSB3aGljaCBlbmQuY29sdW0gaXMgbGVmdG1vc3QobWVhbiwgY2xvc2VkIGZpcnN0KVxuICAgIF8uZmlyc3QoXy5zb3J0QnkocmFuZ2VzLCAocikgLT4gci5lbmQuY29sdW1uKSkgaWYgcmFuZ2VzLmxlbmd0aFxuXG5jbGFzcyBBQW55UXVvdGUgZXh0ZW5kcyBBbnlRdW90ZVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJBbnlRdW90ZSBleHRlbmRzIEFueVF1b3RlXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFF1b3RlIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgYWxsb3dOZXh0TGluZTogZmFsc2VcblxuY2xhc3MgRG91YmxlUXVvdGUgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJ1wiJywgJ1wiJ11cblxuY2xhc3MgQURvdWJsZVF1b3RlIGV4dGVuZHMgRG91YmxlUXVvdGVcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyRG91YmxlUXVvdGUgZXh0ZW5kcyBEb3VibGVRdW90ZVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTaW5nbGVRdW90ZSBleHRlbmRzIFF1b3RlXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFtcIidcIiwgXCInXCJdXG5cbmNsYXNzIEFTaW5nbGVRdW90ZSBleHRlbmRzIFNpbmdsZVF1b3RlXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclNpbmdsZVF1b3RlIGV4dGVuZHMgU2luZ2xlUXVvdGVcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQmFja1RpY2sgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJ2AnLCAnYCddXG5cbmNsYXNzIEFCYWNrVGljayBleHRlbmRzIEJhY2tUaWNrXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckJhY2tUaWNrIGV4dGVuZHMgQmFja1RpY2tcbiAgQGV4dGVuZCgpXG5cbiMgUGFpciBleHBhbmRzIG11bHRpLWxpbmVzXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEN1cmx5QnJhY2tldCBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWyd7JywgJ30nXVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG5cbmNsYXNzIEFDdXJseUJyYWNrZXQgZXh0ZW5kcyBDdXJseUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyQ3VybHlCcmFja2V0IGV4dGVuZHMgQ3VybHlCcmFja2V0XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBBQ3VybHlCcmFja2V0QWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQ3VybHlCcmFja2V0XG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuY2xhc3MgSW5uZXJDdXJseUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBDdXJseUJyYWNrZXRcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNxdWFyZUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFsnWycsICddJ11cbiAgYWxsb3dOZXh0TGluZTogdHJ1ZVxuXG5jbGFzcyBBU3F1YXJlQnJhY2tldCBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyU3F1YXJlQnJhY2tldCBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIEFTcXVhcmVCcmFja2V0QWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgU3F1YXJlQnJhY2tldFxuICBAZXh0ZW5kKClcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG5cbmNsYXNzIElubmVyU3F1YXJlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFBhcmVudGhlc2lzIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJygnLCAnKSddXG4gIGFsbG93TmV4dExpbmU6IHRydWVcblxuY2xhc3MgQVBhcmVudGhlc2lzIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyUGFyZW50aGVzaXMgZXh0ZW5kcyBQYXJlbnRoZXNpc1xuICBAZXh0ZW5kKClcblxuY2xhc3MgQVBhcmVudGhlc2lzQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG5jbGFzcyBJbm5lclBhcmVudGhlc2lzQWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEFuZ2xlQnJhY2tldCBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWyc8JywgJz4nXVxuXG5jbGFzcyBBQW5nbGVCcmFja2V0IGV4dGVuZHMgQW5nbGVCcmFja2V0XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckFuZ2xlQnJhY2tldCBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcblxuY2xhc3MgQUFuZ2xlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG5cbmNsYXNzIElubmVyQW5nbGVCcmFja2V0QWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQW5nbGVCcmFja2V0XG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG50YWdQYXR0ZXJuID0gLyg8KFxcLz8pKShbXlxccz5dKylbXj5dKj4vZ1xuY2xhc3MgVGFnIGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBhZGp1c3RJbm5lclJhbmdlOiBmYWxzZVxuICBnZXRQYXR0ZXJuOiAtPlxuICAgIHRhZ1BhdHRlcm5cblxuICBnZXRQYWlyU3RhdGU6ICh7bWF0Y2gsIG1hdGNoVGV4dH0pIC0+XG4gICAgW19fLCBfXywgc2xhc2gsIHRhZ05hbWVdID0gbWF0Y2hcbiAgICBpZiBzbGFzaCBpcyAnJ1xuICAgICAgWydvcGVuJywgdGFnTmFtZV1cbiAgICBlbHNlXG4gICAgICBbJ2Nsb3NlJywgdGFnTmFtZV1cblxuICBnZXRUYWdTdGFydFBvaW50OiAoZnJvbSkgLT5cbiAgICB0YWdSYW5nZSA9IG51bGxcbiAgICBzY2FuUmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KGZyb20ucm93KVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgdGFnUGF0dGVybiwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmNvbnRhaW5zUG9pbnQoZnJvbSwgdHJ1ZSlcbiAgICAgICAgdGFnUmFuZ2UgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB0YWdSYW5nZT8uc3RhcnQgPyBmcm9tXG5cbiAgZmluZFRhZ1N0YXRlOiAoc3RhY2ssIHRhZ1N0YXRlKSAtPlxuICAgIHJldHVybiBudWxsIGlmIHN0YWNrLmxlbmd0aCBpcyAwXG4gICAgZm9yIGkgaW4gWyhzdGFjay5sZW5ndGggLSAxKS4uMF1cbiAgICAgIGVudHJ5ID0gc3RhY2tbaV1cbiAgICAgIGlmIGVudHJ5LnRhZ1N0YXRlIGlzIHRhZ1N0YXRlXG4gICAgICAgIHJldHVybiBlbnRyeVxuICAgIG51bGxcblxuICBmaW5kT3BlbjogKGZyb20sICBwYXR0ZXJuKSAtPlxuICAgIHNjYW5GdW5jID0gJ2JhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlJ1xuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShbMCwgMF0sIGZyb20pXG4gICAgc3RhY2sgPSBbXVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBmaW5kUGFpciAnb3BlbicsIHtmcm9tLCBwYXR0ZXJuLCBzY2FuRnVuYywgc2NhblJhbmdlfSwgKGV2ZW50KSA9PlxuICAgICAge3JhbmdlLCBzdG9wfSA9IGV2ZW50XG4gICAgICBbcGFpclN0YXRlLCB0YWdOYW1lXSA9IEBnZXRQYWlyU3RhdGUoZXZlbnQpXG4gICAgICBpZiBwYWlyU3RhdGUgaXMgJ2Nsb3NlJ1xuICAgICAgICB0YWdTdGF0ZSA9IHBhaXJTdGF0ZSArIHRhZ05hbWVcbiAgICAgICAgc3RhY2sucHVzaCh7dGFnU3RhdGUsIHJhbmdlfSlcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgZW50cnkgPSBAZmluZFRhZ1N0YXRlKHN0YWNrLCBcImNsb3NlI3t0YWdOYW1lfVwiKVxuICAgICAgICAgIHN0YWNrID0gc3RhY2tbMC4uLnN0YWNrLmluZGV4T2YoZW50cnkpXVxuICAgICAgICBpZiBzdGFjay5sZW5ndGggaXMgMFxuICAgICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgIHN0b3AoKSBpZiBmb3VuZD9cbiAgICBmb3VuZFxuXG4gIGZpbmRDbG9zZTogKGZyb20sICBwYXR0ZXJuKSAtPlxuICAgIHNjYW5GdW5jID0gJ3NjYW5JbkJ1ZmZlclJhbmdlJ1xuICAgIGZyb20gPSBAZ2V0VGFnU3RhcnRQb2ludChmcm9tKVxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShmcm9tLCBAZWRpdG9yLmJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpKVxuICAgIHN0YWNrID0gW11cbiAgICBmb3VuZCA9IG51bGxcbiAgICBAZmluZFBhaXIgJ2Nsb3NlJywge2Zyb20sIHBhdHRlcm4sIHNjYW5GdW5jLCBzY2FuUmFuZ2V9LCAoZXZlbnQpID0+XG4gICAgICB7cmFuZ2UsIHN0b3B9ID0gZXZlbnRcbiAgICAgIFtwYWlyU3RhdGUsIHRhZ05hbWVdID0gQGdldFBhaXJTdGF0ZShldmVudClcbiAgICAgIGlmIHBhaXJTdGF0ZSBpcyAnb3BlbidcbiAgICAgICAgdGFnU3RhdGUgPSBwYWlyU3RhdGUgKyB0YWdOYW1lXG4gICAgICAgIHN0YWNrLnB1c2goe3RhZ1N0YXRlLCByYW5nZX0pXG4gICAgICBlbHNlXG4gICAgICAgIGlmIGVudHJ5ID0gQGZpbmRUYWdTdGF0ZShzdGFjaywgXCJvcGVuI3t0YWdOYW1lfVwiKVxuICAgICAgICAgIHN0YWNrID0gc3RhY2tbMC4uLnN0YWNrLmluZGV4T2YoZW50cnkpXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgIyBJJ20gdmVyeSB0b3JlbGFudCBmb3Igb3JwaGFuIHRhZyBsaWtlICdicicsICdocicsIG9yIHVuY2xvc2VkIHRhZy5cbiAgICAgICAgICBzdGFjayA9IFtdXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aCBpcyAwXG4gICAgICAgICAgaWYgKG9wZW5TdGFydCA9IGVudHJ5Py5yYW5nZS5zdGFydClcbiAgICAgICAgICAgIGlmIEBhbGxvd0ZvcndhcmRpbmdcbiAgICAgICAgICAgICAgcmV0dXJuIGlmIG9wZW5TdGFydC5yb3cgPiBmcm9tLnJvd1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICByZXR1cm4gaWYgb3BlblN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbSlcbiAgICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICBzdG9wKCkgaWYgZm91bmQ/XG4gICAgZm91bmRcblxuY2xhc3MgQVRhZyBleHRlbmRzIFRhZ1xuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJUYWcgZXh0ZW5kcyBUYWdcbiAgQGV4dGVuZCgpXG5cbiMgUGFyYWdyYXBoXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgUGFyYWdyYXBoIGlzIGRlZmluZWQgYXMgY29uc2VjdXRpdmUgKG5vbi0pYmxhbmstbGluZS5cbmNsYXNzIFBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcblxuICBmaW5kUm93OiAoZnJvbVJvdywgZGlyZWN0aW9uLCBmbikgLT5cbiAgICBmbi5yZXNldD8oKVxuICAgIGZvdW5kUm93ID0gZnJvbVJvd1xuICAgIGZvciByb3cgaW4gZ2V0QnVmZmVyUm93cyhAZWRpdG9yLCB7c3RhcnRSb3c6IGZyb21Sb3csIGRpcmVjdGlvbn0pXG4gICAgICBicmVhayB1bmxlc3MgZm4ocm93LCBkaXJlY3Rpb24pXG4gICAgICBmb3VuZFJvdyA9IHJvd1xuXG4gICAgZm91bmRSb3dcblxuICBmaW5kUm93UmFuZ2VCeTogKGZyb21Sb3csIGZuKSAtPlxuICAgIHN0YXJ0Um93ID0gQGZpbmRSb3coZnJvbVJvdywgJ3ByZXZpb3VzJywgZm4pXG4gICAgZW5kUm93ID0gQGZpbmRSb3coZnJvbVJvdywgJ25leHQnLCBmbilcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBnZXRQcmVkaWN0RnVuY3Rpb246IChmcm9tUm93LCBzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvd1Jlc3VsdCA9IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhmcm9tUm93KVxuXG4gICAgaWYgQGlzSW5uZXIoKVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgIGVsc2VcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgZGlyZWN0aW9uVG9FeHRlbmQgPSAncHJldmlvdXMnXG4gICAgICBlbHNlXG4gICAgICAgIGRpcmVjdGlvblRvRXh0ZW5kID0gJ25leHQnXG5cbiAgICAgIGZsaXAgPSBmYWxzZVxuICAgICAgcHJlZGljdCA9IChyb3csIGRpcmVjdGlvbikgPT5cbiAgICAgICAgcmVzdWx0ID0gQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdykgaXMgZnJvbVJvd1Jlc3VsdFxuICAgICAgICBpZiBmbGlwXG4gICAgICAgICAgbm90IHJlc3VsdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgKG5vdCByZXN1bHQpIGFuZCAoZGlyZWN0aW9uIGlzIGRpcmVjdGlvblRvRXh0ZW5kKVxuICAgICAgICAgICAgZmxpcCA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgcmVzdWx0XG5cbiAgICAgIHByZWRpY3QucmVzZXQgPSAtPlxuICAgICAgICBmbGlwID0gZmFsc2VcbiAgICBwcmVkaWN0XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvdyA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbikucm93XG5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgICAgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgICBmcm9tUm93LS1cbiAgICAgIGVsc2VcbiAgICAgICAgZnJvbVJvdysrXG4gICAgICBmcm9tUm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgZnJvbVJvdylcblxuICAgIHJvd1JhbmdlID0gQGZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIEBnZXRQcmVkaWN0RnVuY3Rpb24oZnJvbVJvdywgc2VsZWN0aW9uKSlcbiAgICBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbihnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIHJvd1JhbmdlKSlcblxuY2xhc3MgQVBhcmFncmFwaCBleHRlbmRzIFBhcmFncmFwaFxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJQYXJhZ3JhcGggZXh0ZW5kcyBQYXJhZ3JhcGhcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgSW5kZW50YXRpb24gZXh0ZW5kcyBQYXJhZ3JhcGhcbiAgQGV4dGVuZChmYWxzZSlcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBmcm9tUm93ID0gQGdldE5vcm1hbGl6ZWRIZWFkQnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uKS5yb3dcblxuICAgIGJhc2VJbmRlbnRMZXZlbCA9IGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIGZyb21Sb3cpXG4gICAgcHJlZGljdCA9IChyb3cpID0+XG4gICAgICBpZiBAZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KVxuICAgICAgICBAaXNBKClcbiAgICAgIGVsc2VcbiAgICAgICAgZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coQGVkaXRvciwgcm93KSA+PSBiYXNlSW5kZW50TGV2ZWxcblxuICAgIHJvd1JhbmdlID0gQGZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHByZWRpY3QpXG4gICAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShAZWRpdG9yLCByb3dSYW5nZSlcblxuY2xhc3MgQUluZGVudGF0aW9uIGV4dGVuZHMgSW5kZW50YXRpb25cbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVySW5kZW50YXRpb24gZXh0ZW5kcyBJbmRlbnRhdGlvblxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDb21tZW50IGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJvdyA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0LnJvd1xuICAgIHJvd1JhbmdlID0gQGVkaXRvci5sYW5ndWFnZU1vZGUucm93UmFuZ2VGb3JDb21tZW50QXRCdWZmZXJSb3cocm93KVxuICAgIHJvd1JhbmdlID89IFtyb3csIHJvd10gaWYgQGVkaXRvci5pc0J1ZmZlclJvd0NvbW1lbnRlZChyb3cpXG5cbiAgICBpZiByb3dSYW5nZVxuICAgICAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShzZWxlY3Rpb24uZWRpdG9yLCByb3dSYW5nZSlcblxuY2xhc3MgQUNvbW1lbnQgZXh0ZW5kcyBDb21tZW50XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckNvbW1lbnQgZXh0ZW5kcyBDb21tZW50XG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEZvbGQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgYWRqdXN0Um93UmFuZ2U6IChbc3RhcnRSb3csIGVuZFJvd10pIC0+XG4gICAgcmV0dXJuIFtzdGFydFJvdywgZW5kUm93XSB1bmxlc3MgQGlzSW5uZXIoKVxuICAgIHN0YXJ0Um93SW5kZW50TGV2ZWwgPSBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCBzdGFydFJvdylcbiAgICBlbmRSb3dJbmRlbnRMZXZlbCA9IGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIGVuZFJvdylcbiAgICBlbmRSb3cgLT0gMSBpZiAoc3RhcnRSb3dJbmRlbnRMZXZlbCBpcyBlbmRSb3dJbmRlbnRMZXZlbClcbiAgICBzdGFydFJvdyArPSAxXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbiAgZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5zRm9yUm93OiAocm93KSAtPlxuICAgIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93KEBlZGl0b3IsIHJvdywgaW5jbHVkZVN0YXJ0Um93OiBmYWxzZSk/LnJldmVyc2UoKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICByb3dSYW5nZXMgPSBAZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5zRm9yUm93KHJhbmdlLnN0YXJ0LnJvdylcbiAgICByZXR1cm4gdW5sZXNzIHJvd1Jhbmdlcy5sZW5ndGhcblxuICAgIGlmIChyb3dSYW5nZSA9IHJvd1Jhbmdlcy5zaGlmdCgpKT9cbiAgICAgIHJvd1JhbmdlID0gQGFkanVzdFJvd1JhbmdlKHJvd1JhbmdlKVxuICAgICAgdGFyZ2V0UmFuZ2UgPSBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIHJvd1JhbmdlKVxuICAgICAgaWYgdGFyZ2V0UmFuZ2UuaXNFcXVhbChyYW5nZSkgYW5kIHJvd1Jhbmdlcy5sZW5ndGhcbiAgICAgICAgcm93UmFuZ2UgPSBAYWRqdXN0Um93UmFuZ2Uocm93UmFuZ2VzLnNoaWZ0KCkpXG5cbiAgICBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBlZGl0b3IsIHJvd1JhbmdlKVxuXG5jbGFzcyBBRm9sZCBleHRlbmRzIEZvbGRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyRm9sZCBleHRlbmRzIEZvbGRcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBOT1RFOiBGdW5jdGlvbiByYW5nZSBkZXRlcm1pbmF0aW9uIGlzIGRlcGVuZGluZyBvbiBmb2xkLlxuY2xhc3MgRnVuY3Rpb24gZXh0ZW5kcyBGb2xkXG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgIyBTb21lIGxhbmd1YWdlIGRvbid0IGluY2x1ZGUgY2xvc2luZyBgfWAgaW50byBmb2xkLlxuICBvbWl0dGluZ0Nsb3NpbmdDaGFyTGFuZ3VhZ2VzOiBbJ2dvJ11cblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQGxhbmd1YWdlID0gQGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lLnJlcGxhY2UoL15zb3VyY2VcXC4vLCAnJylcblxuICBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3c6IChyb3cpIC0+XG4gICAgcm93UmFuZ2VzID0gZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3coQGVkaXRvciwgcm93KT8ucmV2ZXJzZSgpXG4gICAgcm93UmFuZ2VzPy5maWx0ZXIgKHJvd1JhbmdlKSA9PlxuICAgICAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhAZWRpdG9yLCByb3dSYW5nZVswXSlcblxuICBhZGp1c3RSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHN1cGVyXG4gICAgaWYgQGlzQSgpIGFuZCAoQGxhbmd1YWdlIGluIEBvbWl0dGluZ0Nsb3NpbmdDaGFyTGFuZ3VhZ2VzKVxuICAgICAgZW5kUm93ICs9IDFcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuY2xhc3MgQUZ1bmN0aW9uIGV4dGVuZHMgRnVuY3Rpb25cbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyRnVuY3Rpb24gZXh0ZW5kcyBGdW5jdGlvblxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDdXJyZW50TGluZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcm93ID0gQGdldE5vcm1hbGl6ZWRIZWFkQnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uKS5yb3dcbiAgICByYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93KVxuICAgIGlmIEBpc0EoKVxuICAgICAgcmFuZ2VcbiAgICBlbHNlXG4gICAgICB0cmltUmFuZ2UoQGVkaXRvciwgcmFuZ2UpXG5cbmNsYXNzIEFDdXJyZW50TGluZSBleHRlbmRzIEN1cnJlbnRMaW5lXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckN1cnJlbnRMaW5lIGV4dGVuZHMgQ3VycmVudExpbmVcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgRW50aXJlIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBAc3RvcFNlbGVjdGlvbigpXG4gICAgQGVkaXRvci5idWZmZXIuZ2V0UmFuZ2UoKVxuXG5jbGFzcyBBRW50aXJlIGV4dGVuZHMgRW50aXJlXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckVudGlyZSBleHRlbmRzIEVudGlyZVxuICBAZXh0ZW5kKClcblxuIyBBbGlhcyBhcyBhY2Nlc3NpYmxlIG5hbWVcbmNsYXNzIEFsbCBleHRlbmRzIEVudGlyZVxuICBAZXh0ZW5kKGZhbHNlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEVtcHR5IGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIExhdGVzdENoYW5nZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgZ2V0UmFuZ2U6IC0+XG4gICAgQHN0b3BTZWxlY3Rpb24oKVxuICAgIEB2aW1TdGF0ZS5tYXJrLmdldFJhbmdlKCdbJywgJ10nKVxuXG5jbGFzcyBBTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgTGF0ZXN0Q2hhbmdlXG4gIEBleHRlbmQoKVxuXG4jIE5vIGRpZmYgZnJvbSBBTGF0ZXN0Q2hhbmdlXG5jbGFzcyBJbm5lckxhdGVzdENoYW5nZSBleHRlbmRzIExhdGVzdENoYW5nZVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2hNYXRjaEZvcndhcmQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZDogZmFsc2VcblxuICBmaW5kTWF0Y2g6IChmcm9tUG9pbnQsIHBhdHRlcm4pIC0+XG4gICAgZnJvbVBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGZyb21Qb2ludCwgXCJmb3J3YXJkXCIpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgc2NhblJhbmdlID0gW1tmcm9tUG9pbnQucm93LCAwXSwgQGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKCldXG4gICAgZm91bmQgPSBudWxsXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KVxuICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICAgIHN0b3AoKVxuICAgIHtyYW5nZTogZm91bmQsIHdoaWNoSXNIZWFkOiAnZW5kJ31cblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBwYXR0ZXJuID0gQGdsb2JhbFN0YXRlLmdldCgnbGFzdFNlYXJjaFBhdHRlcm4nKVxuICAgIHJldHVybiB1bmxlc3MgcGF0dGVybj9cblxuICAgIGZyb21Qb2ludCA9IHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHtyYW5nZSwgd2hpY2hJc0hlYWR9ID0gQGZpbmRNYXRjaChmcm9tUG9pbnQsIHBhdHRlcm4pXG4gICAgaWYgcmFuZ2U/XG4gICAgICBAdW5pb25SYW5nZUFuZERldGVybWluZVJldmVyc2VkU3RhdGUoc2VsZWN0aW9uLCByYW5nZSwgd2hpY2hJc0hlYWQpXG5cbiAgdW5pb25SYW5nZUFuZERldGVybWluZVJldmVyc2VkU3RhdGU6IChzZWxlY3Rpb24sIGZvdW5kLCB3aGljaElzSGVhZCkgLT5cbiAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBmb3VuZFxuICAgIGVsc2VcbiAgICAgIGhlYWQgPSBmb3VuZFt3aGljaElzSGVhZF1cbiAgICAgIHRhaWwgPSBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgICAgaWYgQGJhY2t3YXJkXG4gICAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2ZvcndhcmQnKSBpZiB0YWlsLmlzTGVzc1RoYW4oaGVhZClcbiAgICAgIGVsc2VcbiAgICAgICAgaGVhZCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBoZWFkLCAnYmFja3dhcmQnKSBpZiBoZWFkLmlzTGVzc1RoYW4odGFpbClcblxuICAgICAgQHJldmVyc2VkID0gaGVhZC5pc0xlc3NUaGFuKHRhaWwpXG4gICAgICBuZXcgUmFuZ2UodGFpbCwgaGVhZCkudW5pb24oc3dyYXAoc2VsZWN0aW9uKS5nZXRUYWlsQnVmZmVyUmFuZ2UoKSlcblxuICBzZWxlY3RUZXh0T2JqZWN0OiAoc2VsZWN0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3MgcmFuZ2UgPSBAZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgIHJldmVyc2VkID0gQHJldmVyc2VkID8gQGJhY2t3YXJkXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkfSlcbiAgICBzZWxlY3Rpb24uY3Vyc29yLmF1dG9zY3JvbGwoKVxuXG5jbGFzcyBTZWFyY2hNYXRjaEJhY2t3YXJkIGV4dGVuZHMgU2VhcmNoTWF0Y2hGb3J3YXJkXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZDogdHJ1ZVxuXG4gIGZpbmRNYXRjaDogKGZyb21Qb2ludCwgcGF0dGVybikgLT5cbiAgICBmcm9tUG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgZnJvbVBvaW50LCBcImJhY2t3YXJkXCIpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgc2NhblJhbmdlID0gW1tmcm9tUG9pbnQucm93LCBJbmZpbml0eV0sIFswLCAwXV1cbiAgICBmb3VuZCA9IG51bGxcbiAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5zdGFydC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ3N0YXJ0J31cblxuIyBbTGltaXRhdGlvbjogd29uJ3QgZml4XTogU2VsZWN0ZWQgcmFuZ2UgaXMgbm90IHN1Ym1vZGUgYXdhcmUuIGFsd2F5cyBjaGFyYWN0ZXJ3aXNlLlxuIyBTbyBldmVuIGlmIG9yaWdpbmFsIHNlbGVjdGlvbiB3YXMgdkwgb3IgdkIsIHNlbGVjdGVkIHJhbmdlIGJ5IHRoaXMgdGV4dC1vYmplY3RcbiMgaXMgYWx3YXlzIHZDIHJhbmdlLlxuY2xhc3MgUHJldmlvdXNTZWxlY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICBzZWxlY3Q6IC0+XG4gICAge3Byb3BlcnRpZXMsIEBzdWJtb2RlfSA9IEB2aW1TdGF0ZS5wcmV2aW91c1NlbGVjdGlvblxuICAgIGlmIHByb3BlcnRpZXM/IGFuZCBAc3VibW9kZT9cbiAgICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnNlbGVjdEJ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuXG5jbGFzcyBQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIHNlbGVjdDogLT5cbiAgICByYW5nZXMgPSBAdmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJCdWZmZXJSYW5nZXMoKVxuICAgIGlmIHJhbmdlcy5sZW5ndGhcbiAgICAgIEBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMocmFuZ2VzKVxuICAgIEB2aW1TdGF0ZS5jbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25zKClcblxuY2xhc3MgQVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBQZXJzaXN0ZW50U2VsZWN0aW9uXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBQZXJzaXN0ZW50U2VsZWN0aW9uXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFZpc2libGVBcmVhIGV4dGVuZHMgVGV4dE9iamVjdCAjIDgyMiB0byA4NjNcbiAgQGV4dGVuZChmYWxzZSlcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBAc3RvcFNlbGVjdGlvbigpXG4gICAgIyBbQlVHP10gTmVlZCB0cmFuc2xhdGUgdG8gc2hpbG5rIHRvcCBhbmQgYm90dG9tIHRvIGZpdCBhY3R1YWwgcm93LlxuICAgICMgVGhlIHJlYXNvbiBJIG5lZWQgLTIgYXQgYm90dG9tIGlzIGJlY2F1c2Ugb2Ygc3RhdHVzIGJhcj9cbiAgICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2UoQGVkaXRvcikudHJhbnNsYXRlKFsrMSwgMF0sIFstMywgMF0pXG5cbmNsYXNzIEFWaXNpYmxlQXJlYSBleHRlbmRzIFZpc2libGVBcmVhXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclZpc2libGVBcmVhIGV4dGVuZHMgVmlzaWJsZUFyZWFcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBbRklYTUVdIHdpc2UgbWlzbWF0Y2ggc2NlZW5Qb3NpdGlvbiB2cyBidWZmZXJQb3NpdGlvblxuY2xhc3MgRWRnZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcblxuICBzZWxlY3Q6IC0+XG4gICAgQHN1Y2Nlc3MgPSBudWxsXG5cbiAgICBzdXBlclxuXG4gICAgQHZpbVN0YXRlLmFjdGl2YXRlKCd2aXN1YWwnLCAnbGluZXdpc2UnKSBpZiBAc3VjY2Vzc1xuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGZyb21Qb2ludCA9IEBnZXROb3JtYWxpemVkSGVhZFNjcmVlblBvc2l0aW9uKHNlbGVjdGlvbilcblxuICAgIG1vdmVVcFRvRWRnZSA9IEBuZXcoJ01vdmVVcFRvRWRnZScpXG4gICAgbW92ZURvd25Ub0VkZ2UgPSBAbmV3KCdNb3ZlRG93blRvRWRnZScpXG4gICAgcmV0dXJuIHVubGVzcyBtb3ZlVXBUb0VkZ2UuaXNTdG9wcGFibGVQb2ludChmcm9tUG9pbnQpXG5cbiAgICBzdGFydFNjcmVlblBvaW50ID0gZW5kU2NyZWVuUG9pbnQgPSBudWxsXG4gICAgc3RhcnRTY3JlZW5Qb2ludCA9IGVuZFNjcmVlblBvaW50ID0gZnJvbVBvaW50IGlmIG1vdmVVcFRvRWRnZS5pc0VkZ2UoZnJvbVBvaW50KVxuXG4gICAgaWYgbW92ZVVwVG9FZGdlLmlzU3RvcHBhYmxlUG9pbnQoZnJvbVBvaW50LnRyYW5zbGF0ZShbLTEsIDBdKSlcbiAgICAgIHN0YXJ0U2NyZWVuUG9pbnQgPSBtb3ZlVXBUb0VkZ2UuZ2V0UG9pbnQoZnJvbVBvaW50KVxuXG4gICAgaWYgbW92ZURvd25Ub0VkZ2UuaXNTdG9wcGFibGVQb2ludChmcm9tUG9pbnQudHJhbnNsYXRlKFsrMSwgMF0pKVxuICAgICAgZW5kU2NyZWVuUG9pbnQgPSBtb3ZlRG93blRvRWRnZS5nZXRQb2ludChmcm9tUG9pbnQpXG5cbiAgICBpZiBzdGFydFNjcmVlblBvaW50PyBhbmQgZW5kU2NyZWVuUG9pbnQ/XG4gICAgICBAc3VjY2VzcyA/PSB0cnVlXG4gICAgICBzY3JlZW5SYW5nZSA9IG5ldyBSYW5nZShzdGFydFNjcmVlblBvaW50LCBlbmRTY3JlZW5Qb2ludClcbiAgICAgIHJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuICAgICAgZ2V0UmFuZ2VCeVRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCByYW5nZSwgJ2VuZCcsICdmb3J3YXJkJylcblxuY2xhc3MgQUVkZ2UgZXh0ZW5kcyBFZGdlXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckVkZ2UgZXh0ZW5kcyBFZGdlXG4gIEBleHRlbmQoKVxuXG4jIE1ldGEgdGV4dCBvYmplY3RcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgVW5pb25UZXh0T2JqZWN0IGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBtZW1iZXI6IFtdXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgdW5pb25SYW5nZSA9IG51bGxcbiAgICBmb3IgbWVtYmVyIGluIEBtZW1iZXIgd2hlbiByYW5nZSA9IEBuZXcobWVtYmVyKS5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgICBpZiB1bmlvblJhbmdlP1xuICAgICAgICB1bmlvblJhbmdlID0gdW5pb25SYW5nZS51bmlvbihyYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgdW5pb25SYW5nZSA9IHJhbmdlXG4gICAgdW5pb25SYW5nZVxuXG5jbGFzcyBBRnVuY3Rpb25PcklubmVyUGFyYWdyYXBoIGV4dGVuZHMgVW5pb25UZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICBtZW1iZXI6IFsnQUZ1bmN0aW9uJywgJ0lubmVyUGFyYWdyYXBoJ11cblxuIyBGSVhNRTogbWFrZSBNb3Rpb24uQ3VycmVudFNlbGVjdGlvbiB0byBUZXh0T2JqZWN0IHRoZW4gdXNlIGNvbmNhdFRleHRPYmplY3RcbmNsYXNzIEFDdXJyZW50U2VsZWN0aW9uQW5kQVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICBzZWxlY3Q6IC0+XG4gICAgcGVzaXN0ZW50UmFuZ2VzID0gQHZpbVN0YXRlLmdldFBlcnNpc3RlbnRTZWxlY3Rpb25CdWZmZmVyUmFuZ2VzKClcbiAgICBzZWxlY3RlZFJhbmdlcyA9IEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKVxuICAgIHJhbmdlcyA9IHBlc2lzdGVudFJhbmdlcy5jb25jYXQoc2VsZWN0ZWRSYW5nZXMpXG5cbiAgICBpZiByYW5nZXMubGVuZ3RoXG4gICAgICBAZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKHJhbmdlcylcbiAgICBAdmltU3RhdGUuY2xlYXJQZXJzaXN0ZW50U2VsZWN0aW9ucygpXG4gICAgQGVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgTm90IHVzZWQgY3VycmVudGx5XG5jbGFzcyBUZXh0T2JqZWN0Rmlyc3RGb3VuZCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgbWVtYmVyOiBbXVxuICBtZW1iZXJPcHRvaW5zOiB7YWxsb3dOZXh0TGluZTogZmFsc2V9XG5cbiAgZ2V0UmFuZ2VCeTogKGtsYXNzLCBzZWxlY3Rpb24pIC0+XG4gICAgQG5ldyhrbGFzcywgQG1lbWJlck9wdG9pbnMpLmdldFJhbmdlKHNlbGVjdGlvbilcblxuICBnZXRSYW5nZXM6IChzZWxlY3Rpb24pIC0+XG4gICAgKHJhbmdlIGZvciBrbGFzcyBpbiBAbWVtYmVyIHdoZW4gKHJhbmdlID0gQGdldFJhbmdlQnkoa2xhc3MsIHNlbGVjdGlvbikpKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGZvciBtZW1iZXIgaW4gQG1lbWJlciB3aGVuIHJhbmdlID0gQGdldFJhbmdlQnkobWVtYmVyLCBzZWxlY3Rpb24pXG4gICAgICByZXR1cm4gcmFuZ2VcbiJdfQ==
