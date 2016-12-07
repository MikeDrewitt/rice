(function() {
  var CompositeDisposable, Emitter, Model, NullGrammar, Point, Range, ScopeDescriptor, TokenIterator, TokenizedBuffer, TokenizedBufferIterator, TokenizedLine, _, ref, ref1, selectorMatchesAnyScope,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('event-kit'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  ref1 = require('text-buffer'), Point = ref1.Point, Range = ref1.Range;

  Model = require('./model');

  TokenizedLine = require('./tokenized-line');

  TokenIterator = require('./token-iterator');

  ScopeDescriptor = require('./scope-descriptor');

  TokenizedBufferIterator = require('./tokenized-buffer-iterator');

  NullGrammar = require('./null-grammar');

  module.exports = TokenizedBuffer = (function(superClass) {
    extend(TokenizedBuffer, superClass);

    TokenizedBuffer.prototype.grammar = null;

    TokenizedBuffer.prototype.buffer = null;

    TokenizedBuffer.prototype.tabLength = null;

    TokenizedBuffer.prototype.tokenizedLines = null;

    TokenizedBuffer.prototype.chunkSize = 50;

    TokenizedBuffer.prototype.invalidRows = null;

    TokenizedBuffer.prototype.visible = false;

    TokenizedBuffer.prototype.changeCount = 0;

    TokenizedBuffer.deserialize = function(state, atomEnvironment) {
      if (state.bufferId) {
        state.buffer = atomEnvironment.project.bufferForIdSync(state.bufferId);
      } else {
        state.buffer = atomEnvironment.project.bufferForPathSync(state.bufferPath);
      }
      state.assert = atomEnvironment.assert;
      return new this(state);
    };

    function TokenizedBuffer(params) {
      var grammar;
      grammar = params.grammar, this.buffer = params.buffer, this.tabLength = params.tabLength, this.largeFileMode = params.largeFileMode, this.assert = params.assert;
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.tokenIterator = new TokenIterator(this);
      this.disposables.add(this.buffer.registerTextDecorationLayer(this));
      this.setGrammar(grammar != null ? grammar : NullGrammar);
    }

    TokenizedBuffer.prototype.destroyed = function() {
      return this.disposables.dispose();
    };

    TokenizedBuffer.prototype.buildIterator = function() {
      return new TokenizedBufferIterator(this);
    };

    TokenizedBuffer.prototype.getInvalidatedRanges = function() {
      return [];
    };

    TokenizedBuffer.prototype.onDidInvalidateRange = function(fn) {
      return this.emitter.on('did-invalidate-range', fn);
    };

    TokenizedBuffer.prototype.serialize = function() {
      return {
        deserializer: 'TokenizedBuffer',
        bufferPath: this.buffer.getPath(),
        bufferId: this.buffer.getId(),
        tabLength: this.tabLength,
        largeFileMode: this.largeFileMode
      };
    };

    TokenizedBuffer.prototype.observeGrammar = function(callback) {
      callback(this.grammar);
      return this.onDidChangeGrammar(callback);
    };

    TokenizedBuffer.prototype.onDidChangeGrammar = function(callback) {
      return this.emitter.on('did-change-grammar', callback);
    };

    TokenizedBuffer.prototype.onDidTokenize = function(callback) {
      return this.emitter.on('did-tokenize', callback);
    };

    TokenizedBuffer.prototype.setGrammar = function(grammar) {
      var ref2;
      if (!((grammar != null) && grammar !== this.grammar)) {
        return;
      }
      this.grammar = grammar;
      this.rootScopeDescriptor = new ScopeDescriptor({
        scopes: [this.grammar.scopeName]
      });
      if ((ref2 = this.grammarUpdateDisposable) != null) {
        ref2.dispose();
      }
      this.grammarUpdateDisposable = this.grammar.onDidUpdate((function(_this) {
        return function() {
          return _this.retokenizeLines();
        };
      })(this));
      this.disposables.add(this.grammarUpdateDisposable);
      this.retokenizeLines();
      return this.emitter.emit('did-change-grammar', grammar);
    };

    TokenizedBuffer.prototype.getGrammarSelectionContent = function() {
      return this.buffer.getTextInRange([[0, 0], [10, 0]]);
    };

    TokenizedBuffer.prototype.hasTokenForSelector = function(selector) {
      var i, j, len, len1, ref2, ref3, token, tokenizedLine;
      ref2 = this.tokenizedLines;
      for (i = 0, len = ref2.length; i < len; i++) {
        tokenizedLine = ref2[i];
        if (tokenizedLine != null) {
          ref3 = tokenizedLine.tokens;
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            token = ref3[j];
            if (selector.matches(token.scopes)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    TokenizedBuffer.prototype.retokenizeLines = function() {
      this.fullyTokenized = false;
      this.tokenizedLines = new Array(this.buffer.getLineCount());
      this.invalidRows = [];
      if (this.largeFileMode || this.grammar.name === 'Null Grammar') {
        return this.markTokenizationComplete();
      } else {
        return this.invalidateRow(0);
      }
    };

    TokenizedBuffer.prototype.setVisible = function(visible) {
      this.visible = visible;
      if (this.visible && this.grammar.name !== 'Null Grammar' && !this.largeFileMode) {
        return this.tokenizeInBackground();
      }
    };

    TokenizedBuffer.prototype.getTabLength = function() {
      return this.tabLength;
    };

    TokenizedBuffer.prototype.setTabLength = function(tabLength) {
      this.tabLength = tabLength;
    };

    TokenizedBuffer.prototype.tokenizeInBackground = function() {
      if (!this.visible || this.pendingChunk || !this.isAlive()) {
        return;
      }
      this.pendingChunk = true;
      return _.defer((function(_this) {
        return function() {
          _this.pendingChunk = false;
          if (_this.isAlive() && _this.buffer.isAlive()) {
            return _this.tokenizeNextChunk();
          }
        };
      })(this));
    };

    TokenizedBuffer.prototype.tokenizeNextChunk = function() {
      var endRow, filledRegion, lastRow, previousStack, row, rowsRemaining, startRow;
      rowsRemaining = this.chunkSize;
      while ((this.firstInvalidRow() != null) && rowsRemaining > 0) {
        startRow = this.invalidRows.shift();
        lastRow = this.getLastRow();
        if (startRow > lastRow) {
          continue;
        }
        row = startRow;
        while (true) {
          previousStack = this.stackForRow(row);
          this.tokenizedLines[row] = this.buildTokenizedLineForRow(row, this.stackForRow(row - 1), this.openScopesForRow(row));
          if (--rowsRemaining === 0) {
            filledRegion = false;
            endRow = row;
            break;
          }
          if (row === lastRow || _.isEqual(this.stackForRow(row), previousStack)) {
            filledRegion = true;
            endRow = row;
            break;
          }
          row++;
        }
        this.validateRow(endRow);
        if (!filledRegion) {
          this.invalidateRow(endRow + 1);
        }
        this.emitter.emit('did-invalidate-range', Range(Point(startRow, 0), Point(endRow + 1, 0)));
      }
      if (this.firstInvalidRow() != null) {
        return this.tokenizeInBackground();
      } else {
        return this.markTokenizationComplete();
      }
    };

    TokenizedBuffer.prototype.markTokenizationComplete = function() {
      if (!this.fullyTokenized) {
        this.emitter.emit('did-tokenize');
      }
      return this.fullyTokenized = true;
    };

    TokenizedBuffer.prototype.firstInvalidRow = function() {
      return this.invalidRows[0];
    };

    TokenizedBuffer.prototype.validateRow = function(row) {
      while (this.invalidRows[0] <= row) {
        this.invalidRows.shift();
      }
    };

    TokenizedBuffer.prototype.invalidateRow = function(row) {
      this.invalidRows.push(row);
      this.invalidRows.sort(function(a, b) {
        return a - b;
      });
      return this.tokenizeInBackground();
    };

    TokenizedBuffer.prototype.updateInvalidRows = function(start, end, delta) {
      return this.invalidRows = this.invalidRows.map(function(row) {
        if (row < start) {
          return row;
        } else if ((start <= row && row <= end)) {
          return end + delta + 1;
        } else if (row > end) {
          return row + delta;
        }
      });
    };

    TokenizedBuffer.prototype.bufferDidChange = function(e) {
      var delta, end, newEndStack, newLineCount, newRange, newTokenizedLines, oldLineCount, oldRange, previousEndStack, start;
      this.changeCount = this.buffer.changeCount;
      oldRange = e.oldRange, newRange = e.newRange;
      start = oldRange.start.row;
      end = oldRange.end.row;
      delta = newRange.end.row - oldRange.end.row;
      oldLineCount = oldRange.end.row - oldRange.start.row + 1;
      newLineCount = newRange.end.row - newRange.start.row + 1;
      this.updateInvalidRows(start, end, delta);
      previousEndStack = this.stackForRow(end);
      if (this.largeFileMode || this.grammar.name === 'Null Grammar') {
        return _.spliceWithArray(this.tokenizedLines, start, oldLineCount, new Array(newLineCount));
      } else {
        newTokenizedLines = this.buildTokenizedLinesForRows(start, end + delta, this.stackForRow(start - 1), this.openScopesForRow(start));
        _.spliceWithArray(this.tokenizedLines, start, oldLineCount, newTokenizedLines);
        newEndStack = this.stackForRow(end + delta);
        if (newEndStack && !_.isEqual(newEndStack, previousEndStack)) {
          return this.invalidateRow(end + delta + 1);
        }
      }
    };

    TokenizedBuffer.prototype.isFoldableAtRow = function(row) {
      if (this.largeFileMode) {
        return false;
      } else {
        return this.isFoldableCodeAtRow(row) || this.isFoldableCommentAtRow(row);
      }
    };

    TokenizedBuffer.prototype.isFoldableCodeAtRow = function(row) {
      var nextRow, tokenizedLine;
      if ((0 <= row && row <= this.buffer.getLastRow())) {
        nextRow = this.buffer.nextNonBlankRow(row);
        tokenizedLine = this.tokenizedLines[row];
        if (this.buffer.isRowBlank(row) || (tokenizedLine != null ? tokenizedLine.isComment() : void 0) || (nextRow == null)) {
          return false;
        } else {
          return this.indentLevelForRow(nextRow) > this.indentLevelForRow(row);
        }
      } else {
        return false;
      }
    };

    TokenizedBuffer.prototype.isFoldableCommentAtRow = function(row) {
      var nextRow, previousRow, ref2, ref3, ref4;
      previousRow = row - 1;
      nextRow = row + 1;
      if (nextRow > this.buffer.getLastRow()) {
        return false;
      } else {
        return Boolean(!((ref2 = this.tokenizedLines[previousRow]) != null ? ref2.isComment() : void 0) && ((ref3 = this.tokenizedLines[row]) != null ? ref3.isComment() : void 0) && ((ref4 = this.tokenizedLines[nextRow]) != null ? ref4.isComment() : void 0));
      }
    };

    TokenizedBuffer.prototype.buildTokenizedLinesForRows = function(startRow, endRow, startingStack, startingopenScopes) {
      var openScopes, row, ruleStack, stopTokenizingAt, tokenizedLine, tokenizedLines;
      ruleStack = startingStack;
      openScopes = startingopenScopes;
      stopTokenizingAt = startRow + this.chunkSize;
      tokenizedLines = (function() {
        var i, ref2, ref3, results;
        results = [];
        for (row = i = ref2 = startRow, ref3 = endRow; i <= ref3; row = i += 1) {
          if ((ruleStack || row === 0) && row < stopTokenizingAt) {
            tokenizedLine = this.buildTokenizedLineForRow(row, ruleStack, openScopes);
            ruleStack = tokenizedLine.ruleStack;
            openScopes = this.scopesFromTags(openScopes, tokenizedLine.tags);
          } else {
            tokenizedLine = void 0;
          }
          results.push(tokenizedLine);
        }
        return results;
      }).call(this);
      if (endRow >= stopTokenizingAt) {
        this.invalidateRow(stopTokenizingAt);
        this.tokenizeInBackground();
      }
      return tokenizedLines;
    };

    TokenizedBuffer.prototype.buildTokenizedLineForRow = function(row, ruleStack, openScopes) {
      return this.buildTokenizedLineForRowWithText(row, this.buffer.lineForRow(row), ruleStack, openScopes);
    };

    TokenizedBuffer.prototype.buildTokenizedLineForRowWithText = function(row, text, ruleStack, openScopes) {
      var lineEnding, ref2, tags;
      if (ruleStack == null) {
        ruleStack = this.stackForRow(row - 1);
      }
      if (openScopes == null) {
        openScopes = this.openScopesForRow(row);
      }
      lineEnding = this.buffer.lineEndingForRow(row);
      ref2 = this.grammar.tokenizeLine(text, ruleStack, row === 0, false), tags = ref2.tags, ruleStack = ref2.ruleStack;
      return new TokenizedLine({
        openScopes: openScopes,
        text: text,
        tags: tags,
        ruleStack: ruleStack,
        lineEnding: lineEnding,
        tokenIterator: this.tokenIterator
      });
    };

    TokenizedBuffer.prototype.tokenizedLineForRow = function(bufferRow) {
      var lineEnding, tags, text, tokenizedLine;
      if ((0 <= bufferRow && bufferRow <= this.buffer.getLastRow())) {
        if (tokenizedLine = this.tokenizedLines[bufferRow]) {
          return tokenizedLine;
        } else {
          text = this.buffer.lineForRow(bufferRow);
          lineEnding = this.buffer.lineEndingForRow(bufferRow);
          tags = [this.grammar.startIdForScope(this.grammar.scopeName), text.length, this.grammar.endIdForScope(this.grammar.scopeName)];
          return this.tokenizedLines[bufferRow] = new TokenizedLine({
            openScopes: [],
            text: text,
            tags: tags,
            lineEnding: lineEnding,
            tokenIterator: this.tokenIterator
          });
        }
      }
    };

    TokenizedBuffer.prototype.tokenizedLinesForRows = function(startRow, endRow) {
      var i, ref2, ref3, results, row;
      results = [];
      for (row = i = ref2 = startRow, ref3 = endRow; i <= ref3; row = i += 1) {
        results.push(this.tokenizedLineForRow(row));
      }
      return results;
    };

    TokenizedBuffer.prototype.stackForRow = function(bufferRow) {
      var ref2;
      return (ref2 = this.tokenizedLines[bufferRow]) != null ? ref2.ruleStack : void 0;
    };

    TokenizedBuffer.prototype.openScopesForRow = function(bufferRow) {
      var precedingLine;
      if (precedingLine = this.tokenizedLines[bufferRow - 1]) {
        return this.scopesFromTags(precedingLine.openScopes, precedingLine.tags);
      } else {
        return [];
      }
    };

    TokenizedBuffer.prototype.scopesFromTags = function(startingScopes, tags) {
      var i, len, matchingStartTag, scopes, tag;
      scopes = startingScopes.slice();
      for (i = 0, len = tags.length; i < len; i++) {
        tag = tags[i];
        if (tag < 0) {
          if ((tag % 2) === -1) {
            scopes.push(tag);
          } else {
            matchingStartTag = tag + 1;
            while (true) {
              if (scopes.pop() === matchingStartTag) {
                break;
              }
              if (scopes.length === 0) {
                this.assert(false, "Encountered an unmatched scope end tag.", (function(_this) {
                  return function(error) {
                    var path;
                    error.metadata = {
                      grammarScopeName: _this.grammar.scopeName,
                      unmatchedEndTag: _this.grammar.scopeForId(tag)
                    };
                    path = require('path');
                    error.privateMetadataDescription = "The contents of `" + (path.basename(_this.buffer.getPath())) + "`";
                    return error.privateMetadata = {
                      filePath: _this.buffer.getPath(),
                      fileContents: _this.buffer.getText()
                    };
                  };
                })(this));
                break;
              }
            }
          }
        }
      }
      return scopes;
    };

    TokenizedBuffer.prototype.indentLevelForRow = function(bufferRow) {
      var indentLevel, line, lineCount, nextLine, nextRow, previousLine, previousRow;
      line = this.buffer.lineForRow(bufferRow);
      indentLevel = 0;
      if (line === '') {
        nextRow = bufferRow + 1;
        lineCount = this.getLineCount();
        while (nextRow < lineCount) {
          nextLine = this.buffer.lineForRow(nextRow);
          if (nextLine !== '') {
            indentLevel = Math.ceil(this.indentLevelForLine(nextLine));
            break;
          }
          nextRow++;
        }
        previousRow = bufferRow - 1;
        while (previousRow >= 0) {
          previousLine = this.buffer.lineForRow(previousRow);
          if (previousLine !== '') {
            indentLevel = Math.max(Math.ceil(this.indentLevelForLine(previousLine)), indentLevel);
            break;
          }
          previousRow--;
        }
        return indentLevel;
      } else {
        return this.indentLevelForLine(line);
      }
    };

    TokenizedBuffer.prototype.indentLevelForLine = function(line) {
      var character, i, indentLength, len, match, ref2;
      if (match = line.match(/^[\t ]+/)) {
        indentLength = 0;
        ref2 = match[0];
        for (i = 0, len = ref2.length; i < len; i++) {
          character = ref2[i];
          if (character === '\t') {
            indentLength += this.getTabLength() - (indentLength % this.getTabLength());
          } else {
            indentLength++;
          }
        }
        return indentLength / this.getTabLength();
      } else {
        return 0;
      }
    };

    TokenizedBuffer.prototype.scopeDescriptorForPosition = function(position) {
      var column, iterator, ref2, row, scopes;
      ref2 = this.buffer.clipPosition(Point.fromObject(position)), row = ref2.row, column = ref2.column;
      iterator = this.tokenizedLineForRow(row).getTokenIterator();
      while (iterator.next()) {
        if (iterator.getBufferEnd() > column) {
          scopes = iterator.getScopes();
          break;
        }
      }
      if (scopes == null) {
        scopes = iterator.getScopes();
        scopes.push.apply(scopes, iterator.getScopeEnds().reverse());
      }
      return new ScopeDescriptor({
        scopes: scopes
      });
    };

    TokenizedBuffer.prototype.tokenForPosition = function(position) {
      var column, ref2, row;
      ref2 = Point.fromObject(position), row = ref2.row, column = ref2.column;
      return this.tokenizedLineForRow(row).tokenAtBufferColumn(column);
    };

    TokenizedBuffer.prototype.tokenStartPositionForPosition = function(position) {
      var column, ref2, row;
      ref2 = Point.fromObject(position), row = ref2.row, column = ref2.column;
      column = this.tokenizedLineForRow(row).tokenStartColumnForBufferColumn(column);
      return new Point(row, column);
    };

    TokenizedBuffer.prototype.bufferRangeForScopeAtPosition = function(selector, position) {
      var endColumn, endScopes, endTokenIndex, i, j, k, len, openScopes, ref2, ref3, ref4, ref5, scopes, startColumn, startScopes, startTokenIndex, tag, tags, tokenIndex;
      position = Point.fromObject(position);
      ref2 = this.tokenizedLineForRow(position.row), openScopes = ref2.openScopes, tags = ref2.tags;
      scopes = openScopes.map((function(_this) {
        return function(tag) {
          return _this.grammar.scopeForId(tag);
        };
      })(this));
      startColumn = 0;
      for (tokenIndex = i = 0, len = tags.length; i < len; tokenIndex = ++i) {
        tag = tags[tokenIndex];
        if (tag < 0) {
          if (tag % 2 === -1) {
            scopes.push(this.grammar.scopeForId(tag));
          } else {
            scopes.pop();
          }
        } else {
          endColumn = startColumn + tag;
          if (endColumn >= position.column) {
            break;
          } else {
            startColumn = endColumn;
          }
        }
      }
      if (!selectorMatchesAnyScope(selector, scopes)) {
        return;
      }
      startScopes = scopes.slice();
      for (startTokenIndex = j = ref3 = tokenIndex - 1; j >= 0; startTokenIndex = j += -1) {
        tag = tags[startTokenIndex];
        if (tag < 0) {
          if (tag % 2 === -1) {
            startScopes.pop();
          } else {
            startScopes.push(this.grammar.scopeForId(tag));
          }
        } else {
          if (!selectorMatchesAnyScope(selector, startScopes)) {
            break;
          }
          startColumn -= tag;
        }
      }
      endScopes = scopes.slice();
      for (endTokenIndex = k = ref4 = tokenIndex + 1, ref5 = tags.length; k < ref5; endTokenIndex = k += 1) {
        tag = tags[endTokenIndex];
        if (tag < 0) {
          if (tag % 2 === -1) {
            endScopes.push(this.grammar.scopeForId(tag));
          } else {
            endScopes.pop();
          }
        } else {
          if (!selectorMatchesAnyScope(selector, endScopes)) {
            break;
          }
          endColumn += tag;
        }
      }
      return new Range(new Point(position.row, startColumn), new Point(position.row, endColumn));
    };

    TokenizedBuffer.prototype.getLastRow = function() {
      return this.buffer.getLastRow();
    };

    TokenizedBuffer.prototype.getLineCount = function() {
      return this.buffer.getLineCount();
    };

    TokenizedBuffer.prototype.logLines = function(start, end) {
      var i, line, ref2, ref3, row;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = this.buffer.getLastRow();
      }
      for (row = i = ref2 = start, ref3 = end; ref2 <= ref3 ? i <= ref3 : i >= ref3; row = ref2 <= ref3 ? ++i : --i) {
        line = this.tokenizedLines[row].text;
        console.log(row, line, line.length);
      }
    };

    return TokenizedBuffer;

  })(Model);

  selectorMatchesAnyScope = function(selector, scopes) {
    var targetClasses;
    targetClasses = selector.replace(/^\./, '').split('.');
    return _.any(scopes, function(scope) {
      var scopeClasses;
      scopeClasses = scope.split('.');
      return _.isSubset(targetClasses, scopeClasses);
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90b2tlbml6ZWQtYnVmZmVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOExBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixPQUFpQixPQUFBLENBQVEsYUFBUixDQUFqQixFQUFDLGtCQUFELEVBQVE7O0VBQ1IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFDaEIsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBQ2xCLHVCQUFBLEdBQTBCLE9BQUEsQ0FBUSw2QkFBUjs7RUFDMUIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFFZCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7OEJBQ0osT0FBQSxHQUFTOzs4QkFDVCxNQUFBLEdBQVE7OzhCQUNSLFNBQUEsR0FBVzs7OEJBQ1gsY0FBQSxHQUFnQjs7OEJBQ2hCLFNBQUEsR0FBVzs7OEJBQ1gsV0FBQSxHQUFhOzs4QkFDYixPQUFBLEdBQVM7OzhCQUNULFdBQUEsR0FBYTs7SUFFYixlQUFDLENBQUEsV0FBRCxHQUFjLFNBQUMsS0FBRCxFQUFRLGVBQVI7TUFDWixJQUFHLEtBQUssQ0FBQyxRQUFUO1FBQ0UsS0FBSyxDQUFDLE1BQU4sR0FBZSxlQUFlLENBQUMsT0FBTyxDQUFDLGVBQXhCLENBQXdDLEtBQUssQ0FBQyxRQUE5QyxFQURqQjtPQUFBLE1BQUE7UUFJRSxLQUFLLENBQUMsTUFBTixHQUFlLGVBQWUsQ0FBQyxPQUFPLENBQUMsaUJBQXhC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LENBQU0sUUFBUSxDQUFDLEdBQWYsRUFBb0IsU0FBcEIsQ0FBaEQ7SUEvQ3lCOzs4QkFvRC9CLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUE7SUFEVTs7OEJBR1osWUFBQSxHQUFjLFNBQUE7YUFDWixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQTtJQURZOzs4QkFHZCxRQUFBLEdBQVUsU0FBQyxLQUFELEVBQVUsR0FBVjtBQUNSLFVBQUE7O1FBRFMsUUFBTTs7O1FBQUcsTUFBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTs7QUFDdEIsV0FBVyx3R0FBWDtRQUNFLElBQUEsR0FBTyxJQUFDLENBQUEsY0FBZSxDQUFBLEdBQUEsQ0FBSSxDQUFDO1FBQzVCLE9BQU8sQ0FBQyxHQUFSLENBQVksR0FBWixFQUFpQixJQUFqQixFQUF1QixJQUFJLENBQUMsTUFBNUI7QUFGRjtJQURROzs7O0tBL1prQjs7RUFxYTlCLHVCQUFBLEdBQTBCLFNBQUMsUUFBRCxFQUFXLE1BQVg7QUFDeEIsUUFBQTtJQUFBLGFBQUEsR0FBZ0IsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsS0FBakIsRUFBd0IsRUFBeEIsQ0FBMkIsQ0FBQyxLQUE1QixDQUFrQyxHQUFsQztXQUNoQixDQUFDLENBQUMsR0FBRixDQUFNLE1BQU4sRUFBYyxTQUFDLEtBQUQ7QUFDWixVQUFBO01BQUEsWUFBQSxHQUFlLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWjthQUNmLENBQUMsQ0FBQyxRQUFGLENBQVcsYUFBWCxFQUEwQixZQUExQjtJQUZZLENBQWQ7RUFGd0I7QUFoYjFCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAndGV4dC1idWZmZXInXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5Ub2tlbml6ZWRMaW5lID0gcmVxdWlyZSAnLi90b2tlbml6ZWQtbGluZSdcblRva2VuSXRlcmF0b3IgPSByZXF1aXJlICcuL3Rva2VuLWl0ZXJhdG9yJ1xuU2NvcGVEZXNjcmlwdG9yID0gcmVxdWlyZSAnLi9zY29wZS1kZXNjcmlwdG9yJ1xuVG9rZW5pemVkQnVmZmVySXRlcmF0b3IgPSByZXF1aXJlICcuL3Rva2VuaXplZC1idWZmZXItaXRlcmF0b3InXG5OdWxsR3JhbW1hciA9IHJlcXVpcmUgJy4vbnVsbC1ncmFtbWFyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUb2tlbml6ZWRCdWZmZXIgZXh0ZW5kcyBNb2RlbFxuICBncmFtbWFyOiBudWxsXG4gIGJ1ZmZlcjogbnVsbFxuICB0YWJMZW5ndGg6IG51bGxcbiAgdG9rZW5pemVkTGluZXM6IG51bGxcbiAgY2h1bmtTaXplOiA1MFxuICBpbnZhbGlkUm93czogbnVsbFxuICB2aXNpYmxlOiBmYWxzZVxuICBjaGFuZ2VDb3VudDogMFxuXG4gIEBkZXNlcmlhbGl6ZTogKHN0YXRlLCBhdG9tRW52aXJvbm1lbnQpIC0+XG4gICAgaWYgc3RhdGUuYnVmZmVySWRcbiAgICAgIHN0YXRlLmJ1ZmZlciA9IGF0b21FbnZpcm9ubWVudC5wcm9qZWN0LmJ1ZmZlckZvcklkU3luYyhzdGF0ZS5idWZmZXJJZClcbiAgICBlbHNlXG4gICAgICAjIFRPRE86IHJlbW92ZSB0aGlzIGZhbGxiYWNrIGFmdGVyIGV2ZXJ5b25lIHRyYW5zaXRpb25zIHRvIHRoZSBsYXRlc3QgdmVyc2lvbi5cbiAgICAgIHN0YXRlLmJ1ZmZlciA9IGF0b21FbnZpcm9ubWVudC5wcm9qZWN0LmJ1ZmZlckZvclBhdGhTeW5jKHN0YXRlLmJ1ZmZlclBhdGgpXG4gICAgc3RhdGUuYXNzZXJ0ID0gYXRvbUVudmlyb25tZW50LmFzc2VydFxuICAgIG5ldyB0aGlzKHN0YXRlKVxuXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHtncmFtbWFyLCBAYnVmZmVyLCBAdGFiTGVuZ3RoLCBAbGFyZ2VGaWxlTW9kZSwgQGFzc2VydH0gPSBwYXJhbXNcblxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEB0b2tlbkl0ZXJhdG9yID0gbmV3IFRva2VuSXRlcmF0b3IodGhpcylcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQGJ1ZmZlci5yZWdpc3RlclRleHREZWNvcmF0aW9uTGF5ZXIodGhpcylcblxuICAgIEBzZXRHcmFtbWFyKGdyYW1tYXIgPyBOdWxsR3JhbW1hcilcblxuICBkZXN0cm95ZWQ6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGJ1aWxkSXRlcmF0b3I6IC0+XG4gICAgbmV3IFRva2VuaXplZEJ1ZmZlckl0ZXJhdG9yKHRoaXMpXG5cbiAgZ2V0SW52YWxpZGF0ZWRSYW5nZXM6IC0+XG4gICAgW11cblxuICBvbkRpZEludmFsaWRhdGVSYW5nZTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtaW52YWxpZGF0ZS1yYW5nZScsIGZuXG5cbiAgc2VyaWFsaXplOiAtPlxuICAgIHtcbiAgICAgIGRlc2VyaWFsaXplcjogJ1Rva2VuaXplZEJ1ZmZlcidcbiAgICAgIGJ1ZmZlclBhdGg6IEBidWZmZXIuZ2V0UGF0aCgpXG4gICAgICBidWZmZXJJZDogQGJ1ZmZlci5nZXRJZCgpXG4gICAgICB0YWJMZW5ndGg6IEB0YWJMZW5ndGhcbiAgICAgIGxhcmdlRmlsZU1vZGU6IEBsYXJnZUZpbGVNb2RlXG4gICAgfVxuXG4gIG9ic2VydmVHcmFtbWFyOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2soQGdyYW1tYXIpXG4gICAgQG9uRGlkQ2hhbmdlR3JhbW1hcihjYWxsYmFjaylcblxuICBvbkRpZENoYW5nZUdyYW1tYXI6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1ncmFtbWFyJywgY2FsbGJhY2tcblxuICBvbkRpZFRva2VuaXplOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC10b2tlbml6ZScsIGNhbGxiYWNrXG5cbiAgc2V0R3JhbW1hcjogKGdyYW1tYXIpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBncmFtbWFyPyBhbmQgZ3JhbW1hciBpc250IEBncmFtbWFyXG5cbiAgICBAZ3JhbW1hciA9IGdyYW1tYXJcbiAgICBAcm9vdFNjb3BlRGVzY3JpcHRvciA9IG5ldyBTY29wZURlc2NyaXB0b3Ioc2NvcGVzOiBbQGdyYW1tYXIuc2NvcGVOYW1lXSlcblxuICAgIEBncmFtbWFyVXBkYXRlRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG4gICAgQGdyYW1tYXJVcGRhdGVEaXNwb3NhYmxlID0gQGdyYW1tYXIub25EaWRVcGRhdGUgPT4gQHJldG9rZW5pemVMaW5lcygpXG4gICAgQGRpc3Bvc2FibGVzLmFkZChAZ3JhbW1hclVwZGF0ZURpc3Bvc2FibGUpXG5cbiAgICBAcmV0b2tlbml6ZUxpbmVzKClcblxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtZ3JhbW1hcicsIGdyYW1tYXJcblxuICBnZXRHcmFtbWFyU2VsZWN0aW9uQ29udGVudDogLT5cbiAgICBAYnVmZmVyLmdldFRleHRJblJhbmdlKFtbMCwgMF0sIFsxMCwgMF1dKVxuXG4gIGhhc1Rva2VuRm9yU2VsZWN0b3I6IChzZWxlY3RvcikgLT5cbiAgICBmb3IgdG9rZW5pemVkTGluZSBpbiBAdG9rZW5pemVkTGluZXMgd2hlbiB0b2tlbml6ZWRMaW5lP1xuICAgICAgZm9yIHRva2VuIGluIHRva2VuaXplZExpbmUudG9rZW5zXG4gICAgICAgIHJldHVybiB0cnVlIGlmIHNlbGVjdG9yLm1hdGNoZXModG9rZW4uc2NvcGVzKVxuICAgIGZhbHNlXG5cbiAgcmV0b2tlbml6ZUxpbmVzOiAtPlxuICAgIEBmdWxseVRva2VuaXplZCA9IGZhbHNlXG4gICAgQHRva2VuaXplZExpbmVzID0gbmV3IEFycmF5KEBidWZmZXIuZ2V0TGluZUNvdW50KCkpXG4gICAgQGludmFsaWRSb3dzID0gW11cbiAgICBpZiBAbGFyZ2VGaWxlTW9kZSBvciBAZ3JhbW1hci5uYW1lIGlzICdOdWxsIEdyYW1tYXInXG4gICAgICBAbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlKClcbiAgICBlbHNlXG4gICAgICBAaW52YWxpZGF0ZVJvdygwKVxuXG4gIHNldFZpc2libGU6IChAdmlzaWJsZSkgLT5cbiAgICBpZiBAdmlzaWJsZSBhbmQgQGdyYW1tYXIubmFtZSBpc250ICdOdWxsIEdyYW1tYXInIGFuZCBub3QgQGxhcmdlRmlsZU1vZGVcbiAgICAgIEB0b2tlbml6ZUluQmFja2dyb3VuZCgpXG5cbiAgZ2V0VGFiTGVuZ3RoOiAtPiBAdGFiTGVuZ3RoXG5cbiAgc2V0VGFiTGVuZ3RoOiAoQHRhYkxlbmd0aCkgLT5cblxuICB0b2tlbml6ZUluQmFja2dyb3VuZDogLT5cbiAgICByZXR1cm4gaWYgbm90IEB2aXNpYmxlIG9yIEBwZW5kaW5nQ2h1bmsgb3Igbm90IEBpc0FsaXZlKClcblxuICAgIEBwZW5kaW5nQ2h1bmsgPSB0cnVlXG4gICAgXy5kZWZlciA9PlxuICAgICAgQHBlbmRpbmdDaHVuayA9IGZhbHNlXG4gICAgICBAdG9rZW5pemVOZXh0Q2h1bmsoKSBpZiBAaXNBbGl2ZSgpIGFuZCBAYnVmZmVyLmlzQWxpdmUoKVxuXG4gIHRva2VuaXplTmV4dENodW5rOiAtPlxuICAgIHJvd3NSZW1haW5pbmcgPSBAY2h1bmtTaXplXG5cbiAgICB3aGlsZSBAZmlyc3RJbnZhbGlkUm93KCk/IGFuZCByb3dzUmVtYWluaW5nID4gMFxuICAgICAgc3RhcnRSb3cgPSBAaW52YWxpZFJvd3Muc2hpZnQoKVxuICAgICAgbGFzdFJvdyA9IEBnZXRMYXN0Um93KClcbiAgICAgIGNvbnRpbnVlIGlmIHN0YXJ0Um93ID4gbGFzdFJvd1xuXG4gICAgICByb3cgPSBzdGFydFJvd1xuICAgICAgbG9vcFxuICAgICAgICBwcmV2aW91c1N0YWNrID0gQHN0YWNrRm9yUm93KHJvdylcbiAgICAgICAgQHRva2VuaXplZExpbmVzW3Jvd10gPSBAYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93KHJvdywgQHN0YWNrRm9yUm93KHJvdyAtIDEpLCBAb3BlblNjb3Blc0ZvclJvdyhyb3cpKVxuICAgICAgICBpZiAtLXJvd3NSZW1haW5pbmcgaXMgMFxuICAgICAgICAgIGZpbGxlZFJlZ2lvbiA9IGZhbHNlXG4gICAgICAgICAgZW5kUm93ID0gcm93XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgaWYgcm93IGlzIGxhc3RSb3cgb3IgXy5pc0VxdWFsKEBzdGFja0ZvclJvdyhyb3cpLCBwcmV2aW91c1N0YWNrKVxuICAgICAgICAgIGZpbGxlZFJlZ2lvbiA9IHRydWVcbiAgICAgICAgICBlbmRSb3cgPSByb3dcbiAgICAgICAgICBicmVha1xuICAgICAgICByb3crK1xuXG4gICAgICBAdmFsaWRhdGVSb3coZW5kUm93KVxuICAgICAgQGludmFsaWRhdGVSb3coZW5kUm93ICsgMSkgdW5sZXNzIGZpbGxlZFJlZ2lvblxuXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtaW52YWxpZGF0ZS1yYW5nZScsIFJhbmdlKFBvaW50KHN0YXJ0Um93LCAwKSwgUG9pbnQoZW5kUm93ICsgMSwgMCkpXG5cbiAgICBpZiBAZmlyc3RJbnZhbGlkUm93KCk/XG4gICAgICBAdG9rZW5pemVJbkJhY2tncm91bmQoKVxuICAgIGVsc2VcbiAgICAgIEBtYXJrVG9rZW5pemF0aW9uQ29tcGxldGUoKVxuXG4gIG1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTogLT5cbiAgICB1bmxlc3MgQGZ1bGx5VG9rZW5pemVkXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtdG9rZW5pemUnXG4gICAgQGZ1bGx5VG9rZW5pemVkID0gdHJ1ZVxuXG4gIGZpcnN0SW52YWxpZFJvdzogLT5cbiAgICBAaW52YWxpZFJvd3NbMF1cblxuICB2YWxpZGF0ZVJvdzogKHJvdykgLT5cbiAgICBAaW52YWxpZFJvd3Muc2hpZnQoKSB3aGlsZSBAaW52YWxpZFJvd3NbMF0gPD0gcm93XG4gICAgcmV0dXJuXG5cbiAgaW52YWxpZGF0ZVJvdzogKHJvdykgLT5cbiAgICBAaW52YWxpZFJvd3MucHVzaChyb3cpXG4gICAgQGludmFsaWRSb3dzLnNvcnQgKGEsIGIpIC0+IGEgLSBiXG4gICAgQHRva2VuaXplSW5CYWNrZ3JvdW5kKClcblxuICB1cGRhdGVJbnZhbGlkUm93czogKHN0YXJ0LCBlbmQsIGRlbHRhKSAtPlxuICAgIEBpbnZhbGlkUm93cyA9IEBpbnZhbGlkUm93cy5tYXAgKHJvdykgLT5cbiAgICAgIGlmIHJvdyA8IHN0YXJ0XG4gICAgICAgIHJvd1xuICAgICAgZWxzZSBpZiBzdGFydCA8PSByb3cgPD0gZW5kXG4gICAgICAgIGVuZCArIGRlbHRhICsgMVxuICAgICAgZWxzZSBpZiByb3cgPiBlbmRcbiAgICAgICAgcm93ICsgZGVsdGFcblxuICBidWZmZXJEaWRDaGFuZ2U6IChlKSAtPlxuICAgIEBjaGFuZ2VDb3VudCA9IEBidWZmZXIuY2hhbmdlQ291bnRcblxuICAgIHtvbGRSYW5nZSwgbmV3UmFuZ2V9ID0gZVxuICAgIHN0YXJ0ID0gb2xkUmFuZ2Uuc3RhcnQucm93XG4gICAgZW5kID0gb2xkUmFuZ2UuZW5kLnJvd1xuICAgIGRlbHRhID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3dcbiAgICBvbGRMaW5lQ291bnQgPSBvbGRSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2Uuc3RhcnQucm93ICsgMVxuICAgIG5ld0xpbmVDb3VudCA9IG5ld1JhbmdlLmVuZC5yb3cgLSBuZXdSYW5nZS5zdGFydC5yb3cgKyAxXG5cbiAgICBAdXBkYXRlSW52YWxpZFJvd3Moc3RhcnQsIGVuZCwgZGVsdGEpXG4gICAgcHJldmlvdXNFbmRTdGFjayA9IEBzdGFja0ZvclJvdyhlbmQpICMgdXNlZCBpbiBzcGlsbCBkZXRlY3Rpb24gYmVsb3dcbiAgICBpZiBAbGFyZ2VGaWxlTW9kZSBvciBAZ3JhbW1hci5uYW1lIGlzICdOdWxsIEdyYW1tYXInXG4gICAgICBfLnNwbGljZVdpdGhBcnJheShAdG9rZW5pemVkTGluZXMsIHN0YXJ0LCBvbGRMaW5lQ291bnQsIG5ldyBBcnJheShuZXdMaW5lQ291bnQpKVxuICAgIGVsc2VcbiAgICAgIG5ld1Rva2VuaXplZExpbmVzID0gQGJ1aWxkVG9rZW5pemVkTGluZXNGb3JSb3dzKHN0YXJ0LCBlbmQgKyBkZWx0YSwgQHN0YWNrRm9yUm93KHN0YXJ0IC0gMSksIEBvcGVuU2NvcGVzRm9yUm93KHN0YXJ0KSlcbiAgICAgIF8uc3BsaWNlV2l0aEFycmF5KEB0b2tlbml6ZWRMaW5lcywgc3RhcnQsIG9sZExpbmVDb3VudCwgbmV3VG9rZW5pemVkTGluZXMpXG4gICAgICBuZXdFbmRTdGFjayA9IEBzdGFja0ZvclJvdyhlbmQgKyBkZWx0YSlcbiAgICAgIGlmIG5ld0VuZFN0YWNrIGFuZCBub3QgXy5pc0VxdWFsKG5ld0VuZFN0YWNrLCBwcmV2aW91c0VuZFN0YWNrKVxuICAgICAgICBAaW52YWxpZGF0ZVJvdyhlbmQgKyBkZWx0YSArIDEpXG5cbiAgaXNGb2xkYWJsZUF0Um93OiAocm93KSAtPlxuICAgIGlmIEBsYXJnZUZpbGVNb2RlXG4gICAgICBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBpc0ZvbGRhYmxlQ29kZUF0Um93KHJvdykgb3IgQGlzRm9sZGFibGVDb21tZW50QXRSb3cocm93KVxuXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIGdpdmVuIGJ1ZmZlciByb3cgc3RhcnRzXG4gICMgYSBhIGZvbGRhYmxlIHJvdyByYW5nZSBkdWUgdG8gdGhlIGNvZGUncyBpbmRlbnRhdGlvbiBwYXR0ZXJucy5cbiAgaXNGb2xkYWJsZUNvZGVBdFJvdzogKHJvdykgLT5cbiAgICBpZiAwIDw9IHJvdyA8PSBAYnVmZmVyLmdldExhc3RSb3coKVxuICAgICAgbmV4dFJvdyA9IEBidWZmZXIubmV4dE5vbkJsYW5rUm93KHJvdylcbiAgICAgIHRva2VuaXplZExpbmUgPSBAdG9rZW5pemVkTGluZXNbcm93XVxuICAgICAgaWYgQGJ1ZmZlci5pc1Jvd0JsYW5rKHJvdykgb3IgdG9rZW5pemVkTGluZT8uaXNDb21tZW50KCkgb3Igbm90IG5leHRSb3c/XG4gICAgICAgIGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIEBpbmRlbnRMZXZlbEZvclJvdyhuZXh0Um93KSA+IEBpbmRlbnRMZXZlbEZvclJvdyhyb3cpXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBpc0ZvbGRhYmxlQ29tbWVudEF0Um93OiAocm93KSAtPlxuICAgIHByZXZpb3VzUm93ID0gcm93IC0gMVxuICAgIG5leHRSb3cgPSByb3cgKyAxXG4gICAgaWYgbmV4dFJvdyA+IEBidWZmZXIuZ2V0TGFzdFJvdygpXG4gICAgICBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEJvb2xlYW4oXG4gICAgICAgIG5vdCAoQHRva2VuaXplZExpbmVzW3ByZXZpb3VzUm93XT8uaXNDb21tZW50KCkpIGFuZFxuICAgICAgICBAdG9rZW5pemVkTGluZXNbcm93XT8uaXNDb21tZW50KCkgYW5kXG4gICAgICAgIEB0b2tlbml6ZWRMaW5lc1tuZXh0Um93XT8uaXNDb21tZW50KClcbiAgICAgIClcblxuICBidWlsZFRva2VuaXplZExpbmVzRm9yUm93czogKHN0YXJ0Um93LCBlbmRSb3csIHN0YXJ0aW5nU3RhY2ssIHN0YXJ0aW5nb3BlblNjb3BlcykgLT5cbiAgICBydWxlU3RhY2sgPSBzdGFydGluZ1N0YWNrXG4gICAgb3BlblNjb3BlcyA9IHN0YXJ0aW5nb3BlblNjb3Blc1xuICAgIHN0b3BUb2tlbml6aW5nQXQgPSBzdGFydFJvdyArIEBjaHVua1NpemVcbiAgICB0b2tlbml6ZWRMaW5lcyA9IGZvciByb3cgaW4gW3N0YXJ0Um93Li5lbmRSb3ddIGJ5IDFcbiAgICAgIGlmIChydWxlU3RhY2sgb3Igcm93IGlzIDApIGFuZCByb3cgPCBzdG9wVG9rZW5pemluZ0F0XG4gICAgICAgIHRva2VuaXplZExpbmUgPSBAYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93KHJvdywgcnVsZVN0YWNrLCBvcGVuU2NvcGVzKVxuICAgICAgICBydWxlU3RhY2sgPSB0b2tlbml6ZWRMaW5lLnJ1bGVTdGFja1xuICAgICAgICBvcGVuU2NvcGVzID0gQHNjb3Blc0Zyb21UYWdzKG9wZW5TY29wZXMsIHRva2VuaXplZExpbmUudGFncylcbiAgICAgIGVsc2VcbiAgICAgICAgdG9rZW5pemVkTGluZSA9IHVuZGVmaW5lZFxuICAgICAgdG9rZW5pemVkTGluZVxuXG4gICAgaWYgZW5kUm93ID49IHN0b3BUb2tlbml6aW5nQXRcbiAgICAgIEBpbnZhbGlkYXRlUm93KHN0b3BUb2tlbml6aW5nQXQpXG4gICAgICBAdG9rZW5pemVJbkJhY2tncm91bmQoKVxuXG4gICAgdG9rZW5pemVkTGluZXNcblxuICBidWlsZFRva2VuaXplZExpbmVGb3JSb3c6IChyb3csIHJ1bGVTdGFjaywgb3BlblNjb3BlcykgLT5cbiAgICBAYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQocm93LCBAYnVmZmVyLmxpbmVGb3JSb3cocm93KSwgcnVsZVN0YWNrLCBvcGVuU2NvcGVzKVxuXG4gIGJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0OiAocm93LCB0ZXh0LCBydWxlU3RhY2sgPSBAc3RhY2tGb3JSb3cocm93IC0gMSksIG9wZW5TY29wZXMgPSBAb3BlblNjb3Blc0ZvclJvdyhyb3cpKSAtPlxuICAgIGxpbmVFbmRpbmcgPSBAYnVmZmVyLmxpbmVFbmRpbmdGb3JSb3cocm93KVxuICAgIHt0YWdzLCBydWxlU3RhY2t9ID0gQGdyYW1tYXIudG9rZW5pemVMaW5lKHRleHQsIHJ1bGVTdGFjaywgcm93IGlzIDAsIGZhbHNlKVxuICAgIG5ldyBUb2tlbml6ZWRMaW5lKHtvcGVuU2NvcGVzLCB0ZXh0LCB0YWdzLCBydWxlU3RhY2ssIGxpbmVFbmRpbmcsIEB0b2tlbkl0ZXJhdG9yfSlcblxuICB0b2tlbml6ZWRMaW5lRm9yUm93OiAoYnVmZmVyUm93KSAtPlxuICAgIGlmIDAgPD0gYnVmZmVyUm93IDw9IEBidWZmZXIuZ2V0TGFzdFJvdygpXG4gICAgICBpZiB0b2tlbml6ZWRMaW5lID0gQHRva2VuaXplZExpbmVzW2J1ZmZlclJvd11cbiAgICAgICAgdG9rZW5pemVkTGluZVxuICAgICAgZWxzZVxuICAgICAgICB0ZXh0ID0gQGJ1ZmZlci5saW5lRm9yUm93KGJ1ZmZlclJvdylcbiAgICAgICAgbGluZUVuZGluZyA9IEBidWZmZXIubGluZUVuZGluZ0ZvclJvdyhidWZmZXJSb3cpXG4gICAgICAgIHRhZ3MgPSBbQGdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKEBncmFtbWFyLnNjb3BlTmFtZSksIHRleHQubGVuZ3RoLCBAZ3JhbW1hci5lbmRJZEZvclNjb3BlKEBncmFtbWFyLnNjb3BlTmFtZSldXG4gICAgICAgIEB0b2tlbml6ZWRMaW5lc1tidWZmZXJSb3ddID0gbmV3IFRva2VuaXplZExpbmUoe29wZW5TY29wZXM6IFtdLCB0ZXh0LCB0YWdzLCBsaW5lRW5kaW5nLCBAdG9rZW5JdGVyYXRvcn0pXG5cbiAgdG9rZW5pemVkTGluZXNGb3JSb3dzOiAoc3RhcnRSb3csIGVuZFJvdykgLT5cbiAgICBmb3Igcm93IGluIFtzdGFydFJvdy4uZW5kUm93XSBieSAxXG4gICAgICBAdG9rZW5pemVkTGluZUZvclJvdyhyb3cpXG5cbiAgc3RhY2tGb3JSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgQHRva2VuaXplZExpbmVzW2J1ZmZlclJvd10/LnJ1bGVTdGFja1xuXG4gIG9wZW5TY29wZXNGb3JSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgaWYgcHJlY2VkaW5nTGluZSA9IEB0b2tlbml6ZWRMaW5lc1tidWZmZXJSb3cgLSAxXVxuICAgICAgQHNjb3Blc0Zyb21UYWdzKHByZWNlZGluZ0xpbmUub3BlblNjb3BlcywgcHJlY2VkaW5nTGluZS50YWdzKVxuICAgIGVsc2VcbiAgICAgIFtdXG5cbiAgc2NvcGVzRnJvbVRhZ3M6IChzdGFydGluZ1Njb3BlcywgdGFncykgLT5cbiAgICBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpXG4gICAgZm9yIHRhZyBpbiB0YWdzIHdoZW4gdGFnIDwgMFxuICAgICAgaWYgKHRhZyAlIDIpIGlzIC0xXG4gICAgICAgIHNjb3Blcy5wdXNoKHRhZylcbiAgICAgIGVsc2VcbiAgICAgICAgbWF0Y2hpbmdTdGFydFRhZyA9IHRhZyArIDFcbiAgICAgICAgbG9vcFxuICAgICAgICAgIGJyZWFrIGlmIHNjb3Blcy5wb3AoKSBpcyBtYXRjaGluZ1N0YXJ0VGFnXG4gICAgICAgICAgaWYgc2NvcGVzLmxlbmd0aCBpcyAwXG4gICAgICAgICAgICBAYXNzZXJ0IGZhbHNlLCBcIkVuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLlwiLCAoZXJyb3IpID0+XG4gICAgICAgICAgICAgIGVycm9yLm1ldGFkYXRhID0ge1xuICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IEBncmFtbWFyLnNjb3BlTmFtZVxuICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogQGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG4gICAgICAgICAgICAgIGVycm9yLnByaXZhdGVNZXRhZGF0YURlc2NyaXB0aW9uID0gXCJUaGUgY29udGVudHMgb2YgYCN7cGF0aC5iYXNlbmFtZShAYnVmZmVyLmdldFBhdGgoKSl9YFwiXG4gICAgICAgICAgICAgIGVycm9yLnByaXZhdGVNZXRhZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogQGJ1ZmZlci5nZXRQYXRoKClcbiAgICAgICAgICAgICAgICBmaWxlQ29udGVudHM6IEBidWZmZXIuZ2V0VGV4dCgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrXG4gICAgc2NvcGVzXG5cbiAgaW5kZW50TGV2ZWxGb3JSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgbGluZSA9IEBidWZmZXIubGluZUZvclJvdyhidWZmZXJSb3cpXG4gICAgaW5kZW50TGV2ZWwgPSAwXG5cbiAgICBpZiBsaW5lIGlzICcnXG4gICAgICBuZXh0Um93ID0gYnVmZmVyUm93ICsgMVxuICAgICAgbGluZUNvdW50ID0gQGdldExpbmVDb3VudCgpXG4gICAgICB3aGlsZSBuZXh0Um93IDwgbGluZUNvdW50XG4gICAgICAgIG5leHRMaW5lID0gQGJ1ZmZlci5saW5lRm9yUm93KG5leHRSb3cpXG4gICAgICAgIHVubGVzcyBuZXh0TGluZSBpcyAnJ1xuICAgICAgICAgIGluZGVudExldmVsID0gTWF0aC5jZWlsKEBpbmRlbnRMZXZlbEZvckxpbmUobmV4dExpbmUpKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIG5leHRSb3crK1xuXG4gICAgICBwcmV2aW91c1JvdyA9IGJ1ZmZlclJvdyAtIDFcbiAgICAgIHdoaWxlIHByZXZpb3VzUm93ID49IDBcbiAgICAgICAgcHJldmlvdXNMaW5lID0gQGJ1ZmZlci5saW5lRm9yUm93KHByZXZpb3VzUm93KVxuICAgICAgICB1bmxlc3MgcHJldmlvdXNMaW5lIGlzICcnXG4gICAgICAgICAgaW5kZW50TGV2ZWwgPSBNYXRoLm1heChNYXRoLmNlaWwoQGluZGVudExldmVsRm9yTGluZShwcmV2aW91c0xpbmUpKSwgaW5kZW50TGV2ZWwpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgcHJldmlvdXNSb3ctLVxuXG4gICAgICBpbmRlbnRMZXZlbFxuICAgIGVsc2VcbiAgICAgIEBpbmRlbnRMZXZlbEZvckxpbmUobGluZSlcblxuICBpbmRlbnRMZXZlbEZvckxpbmU6IChsaW5lKSAtPlxuICAgIGlmIG1hdGNoID0gbGluZS5tYXRjaCgvXltcXHQgXSsvKVxuICAgICAgaW5kZW50TGVuZ3RoID0gMFxuICAgICAgZm9yIGNoYXJhY3RlciBpbiBtYXRjaFswXVxuICAgICAgICBpZiBjaGFyYWN0ZXIgaXMgJ1xcdCdcbiAgICAgICAgICBpbmRlbnRMZW5ndGggKz0gQGdldFRhYkxlbmd0aCgpIC0gKGluZGVudExlbmd0aCAlIEBnZXRUYWJMZW5ndGgoKSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGluZGVudExlbmd0aCsrXG5cbiAgICAgIGluZGVudExlbmd0aCAvIEBnZXRUYWJMZW5ndGgoKVxuICAgIGVsc2VcbiAgICAgIDBcblxuICBzY29wZURlc2NyaXB0b3JGb3JQb3NpdGlvbjogKHBvc2l0aW9uKSAtPlxuICAgIHtyb3csIGNvbHVtbn0gPSBAYnVmZmVyLmNsaXBQb3NpdGlvbihQb2ludC5mcm9tT2JqZWN0KHBvc2l0aW9uKSlcblxuICAgIGl0ZXJhdG9yID0gQHRva2VuaXplZExpbmVGb3JSb3cocm93KS5nZXRUb2tlbkl0ZXJhdG9yKClcbiAgICB3aGlsZSBpdGVyYXRvci5uZXh0KClcbiAgICAgIGlmIGl0ZXJhdG9yLmdldEJ1ZmZlckVuZCgpID4gY29sdW1uXG4gICAgICAgIHNjb3BlcyA9IGl0ZXJhdG9yLmdldFNjb3BlcygpXG4gICAgICAgIGJyZWFrXG5cbiAgICAjIHJlYnVpbGQgc2NvcGUgb2YgbGFzdCB0b2tlbiBpZiB3ZSBpdGVyYXRlZCBvZmYgdGhlIGVuZFxuICAgIHVubGVzcyBzY29wZXM/XG4gICAgICBzY29wZXMgPSBpdGVyYXRvci5nZXRTY29wZXMoKVxuICAgICAgc2NvcGVzLnB1c2goaXRlcmF0b3IuZ2V0U2NvcGVFbmRzKCkucmV2ZXJzZSgpLi4uKVxuXG4gICAgbmV3IFNjb3BlRGVzY3JpcHRvcih7c2NvcGVzfSlcblxuICB0b2tlbkZvclBvc2l0aW9uOiAocG9zaXRpb24pIC0+XG4gICAge3JvdywgY29sdW1ufSA9IFBvaW50LmZyb21PYmplY3QocG9zaXRpb24pXG4gICAgQHRva2VuaXplZExpbmVGb3JSb3cocm93KS50b2tlbkF0QnVmZmVyQ29sdW1uKGNvbHVtbilcblxuICB0b2tlblN0YXJ0UG9zaXRpb25Gb3JQb3NpdGlvbjogKHBvc2l0aW9uKSAtPlxuICAgIHtyb3csIGNvbHVtbn0gPSBQb2ludC5mcm9tT2JqZWN0KHBvc2l0aW9uKVxuICAgIGNvbHVtbiA9IEB0b2tlbml6ZWRMaW5lRm9yUm93KHJvdykudG9rZW5TdGFydENvbHVtbkZvckJ1ZmZlckNvbHVtbihjb2x1bW4pXG4gICAgbmV3IFBvaW50KHJvdywgY29sdW1uKVxuXG4gIGJ1ZmZlclJhbmdlRm9yU2NvcGVBdFBvc2l0aW9uOiAoc2VsZWN0b3IsIHBvc2l0aW9uKSAtPlxuICAgIHBvc2l0aW9uID0gUG9pbnQuZnJvbU9iamVjdChwb3NpdGlvbilcblxuICAgIHtvcGVuU2NvcGVzLCB0YWdzfSA9IEB0b2tlbml6ZWRMaW5lRm9yUm93KHBvc2l0aW9uLnJvdylcbiAgICBzY29wZXMgPSBvcGVuU2NvcGVzLm1hcCAodGFnKSA9PiBAZ3JhbW1hci5zY29wZUZvcklkKHRhZylcblxuICAgIHN0YXJ0Q29sdW1uID0gMFxuICAgIGZvciB0YWcsIHRva2VuSW5kZXggaW4gdGFnc1xuICAgICAgaWYgdGFnIDwgMFxuICAgICAgICBpZiB0YWcgJSAyIGlzIC0xXG4gICAgICAgICAgc2NvcGVzLnB1c2goQGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc2NvcGVzLnBvcCgpXG4gICAgICBlbHNlXG4gICAgICAgIGVuZENvbHVtbiA9IHN0YXJ0Q29sdW1uICsgdGFnXG4gICAgICAgIGlmIGVuZENvbHVtbiA+PSBwb3NpdGlvbi5jb2x1bW5cbiAgICAgICAgICBicmVha1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc3RhcnRDb2x1bW4gPSBlbmRDb2x1bW5cblxuXG4gICAgcmV0dXJuIHVubGVzcyBzZWxlY3Rvck1hdGNoZXNBbnlTY29wZShzZWxlY3Rvciwgc2NvcGVzKVxuXG4gICAgc3RhcnRTY29wZXMgPSBzY29wZXMuc2xpY2UoKVxuICAgIGZvciBzdGFydFRva2VuSW5kZXggaW4gWyh0b2tlbkluZGV4IC0gMSkuLjBdIGJ5IC0xXG4gICAgICB0YWcgPSB0YWdzW3N0YXJ0VG9rZW5JbmRleF1cbiAgICAgIGlmIHRhZyA8IDBcbiAgICAgICAgaWYgdGFnICUgMiBpcyAtMVxuICAgICAgICAgIHN0YXJ0U2NvcGVzLnBvcCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzdGFydFNjb3Blcy5wdXNoKEBncmFtbWFyLnNjb3BlRm9ySWQodGFnKSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnJlYWsgdW5sZXNzIHNlbGVjdG9yTWF0Y2hlc0FueVNjb3BlKHNlbGVjdG9yLCBzdGFydFNjb3BlcylcbiAgICAgICAgc3RhcnRDb2x1bW4gLT0gdGFnXG5cbiAgICBlbmRTY29wZXMgPSBzY29wZXMuc2xpY2UoKVxuICAgIGZvciBlbmRUb2tlbkluZGV4IGluIFsodG9rZW5JbmRleCArIDEpLi4udGFncy5sZW5ndGhdIGJ5IDFcbiAgICAgIHRhZyA9IHRhZ3NbZW5kVG9rZW5JbmRleF1cbiAgICAgIGlmIHRhZyA8IDBcbiAgICAgICAgaWYgdGFnICUgMiBpcyAtMVxuICAgICAgICAgIGVuZFNjb3Blcy5wdXNoKEBncmFtbWFyLnNjb3BlRm9ySWQodGFnKSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVuZFNjb3Blcy5wb3AoKVxuICAgICAgZWxzZVxuICAgICAgICBicmVhayB1bmxlc3Mgc2VsZWN0b3JNYXRjaGVzQW55U2NvcGUoc2VsZWN0b3IsIGVuZFNjb3BlcylcbiAgICAgICAgZW5kQ29sdW1uICs9IHRhZ1xuXG4gICAgbmV3IFJhbmdlKG5ldyBQb2ludChwb3NpdGlvbi5yb3csIHN0YXJ0Q29sdW1uKSwgbmV3IFBvaW50KHBvc2l0aW9uLnJvdywgZW5kQ29sdW1uKSlcblxuICAjIEdldHMgdGhlIHJvdyBudW1iZXIgb2YgdGhlIGxhc3QgbGluZS5cbiAgI1xuICAjIFJldHVybnMgYSB7TnVtYmVyfS5cbiAgZ2V0TGFzdFJvdzogLT5cbiAgICBAYnVmZmVyLmdldExhc3RSb3coKVxuXG4gIGdldExpbmVDb3VudDogLT5cbiAgICBAYnVmZmVyLmdldExpbmVDb3VudCgpXG5cbiAgbG9nTGluZXM6IChzdGFydD0wLCBlbmQ9QGJ1ZmZlci5nZXRMYXN0Um93KCkpIC0+XG4gICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF1cbiAgICAgIGxpbmUgPSBAdG9rZW5pemVkTGluZXNbcm93XS50ZXh0XG4gICAgICBjb25zb2xlLmxvZyByb3csIGxpbmUsIGxpbmUubGVuZ3RoXG4gICAgcmV0dXJuXG5cbnNlbGVjdG9yTWF0Y2hlc0FueVNjb3BlID0gKHNlbGVjdG9yLCBzY29wZXMpIC0+XG4gIHRhcmdldENsYXNzZXMgPSBzZWxlY3Rvci5yZXBsYWNlKC9eXFwuLywgJycpLnNwbGl0KCcuJylcbiAgXy5hbnkgc2NvcGVzLCAoc2NvcGUpIC0+XG4gICAgc2NvcGVDbGFzc2VzID0gc2NvcGUuc3BsaXQoJy4nKVxuICAgIF8uaXNTdWJzZXQodGFyZ2V0Q2xhc3Nlcywgc2NvcGVDbGFzc2VzKVxuIl19
