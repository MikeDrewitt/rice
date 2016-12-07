(function() {
  var LanguageMode, NullGrammar, OnigRegExp, Range, ScopeDescriptor, _;

  Range = require('text-buffer').Range;

  _ = require('underscore-plus');

  OnigRegExp = require('oniguruma').OnigRegExp;

  ScopeDescriptor = require('./scope-descriptor');

  NullGrammar = require('./null-grammar');

  module.exports = LanguageMode = (function() {
    function LanguageMode(editor) {
      this.editor = editor;
      this.buffer = this.editor.buffer;
      this.regexesByPattern = {};
    }

    LanguageMode.prototype.destroy = function() {};

    LanguageMode.prototype.toggleLineCommentForBufferRow = function(row) {
      return this.toggleLineCommentsForBufferRows(row, row);
    };

    LanguageMode.prototype.toggleLineCommentsForBufferRows = function(start, end) {
      var allBlank, allBlankOrCommented, blank, buffer, columnEnd, columnStart, commentEndRegex, commentEndRegexString, commentEndString, commentStartRegex, commentStartRegexString, commentStartString, commentStrings, endMatch, i, indent, indentLength, indentRegex, indentString, j, k, line, match, ref, ref1, ref2, ref3, ref4, ref5, ref6, row, scope, shouldUncomment, startMatch, tabLength;
      scope = this.editor.scopeDescriptorForBufferPosition([start, 0]);
      commentStrings = this.editor.getCommentStrings(scope);
      if (!(commentStrings != null ? commentStrings.commentStartString : void 0)) {
        return;
      }
      commentStartString = commentStrings.commentStartString, commentEndString = commentStrings.commentEndString;
      buffer = this.editor.buffer;
      commentStartRegexString = _.escapeRegExp(commentStartString).replace(/(\s+)$/, '(?:$1)?');
      commentStartRegex = new OnigRegExp("^(\\s*)(" + commentStartRegexString + ")");
      if (commentEndString) {
        shouldUncomment = commentStartRegex.testSync(buffer.lineForRow(start));
        if (shouldUncomment) {
          commentEndRegexString = _.escapeRegExp(commentEndString).replace(/^(\s+)/, '(?:$1)?');
          commentEndRegex = new OnigRegExp("(" + commentEndRegexString + ")(\\s*)$");
          startMatch = commentStartRegex.searchSync(buffer.lineForRow(start));
          endMatch = commentEndRegex.searchSync(buffer.lineForRow(end));
          if (startMatch && endMatch) {
            buffer.transact(function() {
              var columnEnd, columnStart, endColumn, endLength;
              columnStart = startMatch[1].length;
              columnEnd = columnStart + startMatch[2].length;
              buffer.setTextInRange([[start, columnStart], [start, columnEnd]], "");
              endLength = buffer.lineLengthForRow(end) - endMatch[2].length;
              endColumn = endLength - endMatch[1].length;
              return buffer.setTextInRange([[end, endColumn], [end, endLength]], "");
            });
          }
        } else {
          buffer.transact(function() {
            var indentLength, ref, ref1;
            indentLength = (ref = (ref1 = buffer.lineForRow(start).match(/^\s*/)) != null ? ref1[0].length : void 0) != null ? ref : 0;
            buffer.insert([start, indentLength], commentStartString);
            return buffer.insert([end, buffer.lineLengthForRow(end)], commentEndString);
          });
        }
      } else {
        allBlank = true;
        allBlankOrCommented = true;
        for (row = i = ref = start, ref1 = end; i <= ref1; row = i += 1) {
          line = buffer.lineForRow(row);
          blank = line != null ? line.match(/^\s*$/) : void 0;
          if (!blank) {
            allBlank = false;
          }
          if (!(blank || commentStartRegex.testSync(line))) {
            allBlankOrCommented = false;
          }
        }
        shouldUncomment = allBlankOrCommented && !allBlank;
        if (shouldUncomment) {
          for (row = j = ref2 = start, ref3 = end; j <= ref3; row = j += 1) {
            if (match = commentStartRegex.searchSync(buffer.lineForRow(row))) {
              columnStart = match[1].length;
              columnEnd = columnStart + match[2].length;
              buffer.setTextInRange([[row, columnStart], [row, columnEnd]], "");
            }
          }
        } else {
          if (start === end) {
            indent = this.editor.indentationForBufferRow(start);
          } else {
            indent = this.minIndentLevelForRowRange(start, end);
          }
          indentString = this.editor.buildIndentString(indent);
          tabLength = this.editor.getTabLength();
          indentRegex = new RegExp("(\t|[ ]{" + tabLength + "}){" + (Math.floor(indent)) + "}");
          for (row = k = ref4 = start, ref5 = end; k <= ref5; row = k += 1) {
            line = buffer.lineForRow(row);
            if (indentLength = (ref6 = line.match(indentRegex)) != null ? ref6[0].length : void 0) {
              buffer.insert([row, indentLength], commentStartString);
            } else {
              buffer.setTextInRange([[row, 0], [row, indentString.length]], indentString + commentStartString);
            }
          }
        }
      }
    };

    LanguageMode.prototype.foldAll = function() {
      var currentRow, endRow, foldedRowRanges, i, ref, ref1, ref2, rowRange, startRow;
      this.unfoldAll();
      foldedRowRanges = {};
      for (currentRow = i = 0, ref = this.buffer.getLastRow(); i <= ref; currentRow = i += 1) {
        rowRange = (ref2 = (ref1 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? ref1 : [], startRow = ref2[0], endRow = ref2[1], ref2);
        if (startRow == null) {
          continue;
        }
        if (foldedRowRanges[rowRange]) {
          continue;
        }
        this.editor.foldBufferRowRange(startRow, endRow);
        foldedRowRanges[rowRange] = true;
      }
    };

    LanguageMode.prototype.unfoldAll = function() {
      return this.editor.displayLayer.destroyAllFolds();
    };

    LanguageMode.prototype.foldAllAtIndentLevel = function(indentLevel) {
      var currentRow, endRow, foldedRowRanges, i, ref, ref1, ref2, rowRange, startRow;
      this.unfoldAll();
      foldedRowRanges = {};
      for (currentRow = i = 0, ref = this.buffer.getLastRow(); i <= ref; currentRow = i += 1) {
        rowRange = (ref2 = (ref1 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? ref1 : [], startRow = ref2[0], endRow = ref2[1], ref2);
        if (startRow == null) {
          continue;
        }
        if (foldedRowRanges[rowRange]) {
          continue;
        }
        if (this.editor.indentationForBufferRow(startRow) === indentLevel) {
          this.editor.foldBufferRowRange(startRow, endRow);
          foldedRowRanges[rowRange] = true;
        }
      }
    };

    LanguageMode.prototype.foldBufferRow = function(bufferRow) {
      var currentRow, endRow, i, ref, ref1, ref2, startRow;
      for (currentRow = i = ref = bufferRow; i >= 0; currentRow = i += -1) {
        ref2 = (ref1 = this.rowRangeForFoldAtBufferRow(currentRow)) != null ? ref1 : [], startRow = ref2[0], endRow = ref2[1];
        if (!((startRow != null) && (startRow <= bufferRow && bufferRow <= endRow))) {
          continue;
        }
        if (!this.editor.isFoldedAtBufferRow(startRow)) {
          return this.editor.foldBufferRowRange(startRow, endRow);
        }
      }
    };

    LanguageMode.prototype.rowRangeForFoldAtBufferRow = function(bufferRow) {
      var rowRange;
      rowRange = this.rowRangeForCommentAtBufferRow(bufferRow);
      if (rowRange == null) {
        rowRange = this.rowRangeForCodeFoldAtBufferRow(bufferRow);
      }
      return rowRange;
    };

    LanguageMode.prototype.rowRangeForCommentAtBufferRow = function(bufferRow) {
      var currentRow, endRow, i, j, ref, ref1, ref2, ref3, ref4, ref5, startRow;
      if (!((ref = this.editor.tokenizedBuffer.tokenizedLines[bufferRow]) != null ? ref.isComment() : void 0)) {
        return;
      }
      startRow = bufferRow;
      endRow = bufferRow;
      if (bufferRow > 0) {
        for (currentRow = i = ref1 = bufferRow - 1; i >= 0; currentRow = i += -1) {
          if (!((ref2 = this.editor.tokenizedBuffer.tokenizedLines[currentRow]) != null ? ref2.isComment() : void 0)) {
            break;
          }
          startRow = currentRow;
        }
      }
      if (bufferRow < this.buffer.getLastRow()) {
        for (currentRow = j = ref3 = bufferRow + 1, ref4 = this.buffer.getLastRow(); j <= ref4; currentRow = j += 1) {
          if (!((ref5 = this.editor.tokenizedBuffer.tokenizedLines[currentRow]) != null ? ref5.isComment() : void 0)) {
            break;
          }
          endRow = currentRow;
        }
      }
      if (startRow !== endRow) {
        return [startRow, endRow];
      }
    };

    LanguageMode.prototype.rowRangeForCodeFoldAtBufferRow = function(bufferRow) {
      var foldEndRow, i, includeRowInFold, indentation, ref, ref1, ref2, row, scopeDescriptor, startIndentLevel;
      if (!this.isFoldableAtBufferRow(bufferRow)) {
        return null;
      }
      startIndentLevel = this.editor.indentationForBufferRow(bufferRow);
      scopeDescriptor = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]);
      for (row = i = ref = bufferRow + 1, ref1 = this.editor.getLastBufferRow(); i <= ref1; row = i += 1) {
        if (this.editor.isBufferRowBlank(row)) {
          continue;
        }
        indentation = this.editor.indentationForBufferRow(row);
        if (indentation <= startIndentLevel) {
          includeRowInFold = indentation === startIndentLevel && ((ref2 = this.foldEndRegexForScopeDescriptor(scopeDescriptor)) != null ? ref2.searchSync(this.editor.lineTextForBufferRow(row)) : void 0);
          if (includeRowInFold) {
            foldEndRow = row;
          }
          break;
        }
        foldEndRow = row;
      }
      return [bufferRow, foldEndRow];
    };

    LanguageMode.prototype.isFoldableAtBufferRow = function(bufferRow) {
      return this.editor.tokenizedBuffer.isFoldableAtRow(bufferRow);
    };

    LanguageMode.prototype.isLineCommentedAtBufferRow = function(bufferRow) {
      var ref;
      if (!((0 <= bufferRow && bufferRow <= this.editor.getLastBufferRow()))) {
        return false;
      }
      return (ref = this.editor.tokenizedBuffer.tokenizedLines[bufferRow]) != null ? ref.isComment() : void 0;
    };

    LanguageMode.prototype.rowRangeForParagraphAtBufferRow = function(bufferRow) {
      var commentStartRegex, commentStartRegexString, commentStrings, endRow, filterCommentStart, firstRow, isOriginalRowComment, lastRow, range, ref, ref1, scope, startRow;
      scope = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]);
      commentStrings = this.editor.getCommentStrings(scope);
      commentStartRegex = null;
      if (((commentStrings != null ? commentStrings.commentStartString : void 0) != null) && (commentStrings.commentEndString == null)) {
        commentStartRegexString = _.escapeRegExp(commentStrings.commentStartString).replace(/(\s+)$/, '(?:$1)?');
        commentStartRegex = new OnigRegExp("^(\\s*)(" + commentStartRegexString + ")");
      }
      filterCommentStart = function(line) {
        var matches;
        if (commentStartRegex != null) {
          matches = commentStartRegex.searchSync(line);
          if (matches != null ? matches.length : void 0) {
            line = line.substring(matches[0].end);
          }
        }
        return line;
      };
      if (!/\S/.test(filterCommentStart(this.editor.lineTextForBufferRow(bufferRow)))) {
        return;
      }
      if (this.isLineCommentedAtBufferRow(bufferRow)) {
        isOriginalRowComment = true;
        range = this.rowRangeForCommentAtBufferRow(bufferRow);
        ref = range || [bufferRow, bufferRow], firstRow = ref[0], lastRow = ref[1];
      } else {
        isOriginalRowComment = false;
        ref1 = [0, this.editor.getLastBufferRow() - 1], firstRow = ref1[0], lastRow = ref1[1];
      }
      startRow = bufferRow;
      while (startRow > firstRow) {
        if (this.isLineCommentedAtBufferRow(startRow - 1) !== isOriginalRowComment) {
          break;
        }
        if (!/\S/.test(filterCommentStart(this.editor.lineTextForBufferRow(startRow - 1)))) {
          break;
        }
        startRow--;
      }
      endRow = bufferRow;
      lastRow = this.editor.getLastBufferRow();
      while (endRow < lastRow) {
        if (this.isLineCommentedAtBufferRow(endRow + 1) !== isOriginalRowComment) {
          break;
        }
        if (!/\S/.test(filterCommentStart(this.editor.lineTextForBufferRow(endRow + 1)))) {
          break;
        }
        endRow++;
      }
      return new Range([startRow, 0], [endRow, this.editor.lineTextForBufferRow(endRow).length]);
    };

    LanguageMode.prototype.suggestedIndentForBufferRow = function(bufferRow, options) {
      var line, tokenizedLine;
      line = this.buffer.lineForRow(bufferRow);
      tokenizedLine = this.editor.tokenizedBuffer.tokenizedLineForRow(bufferRow);
      return this.suggestedIndentForTokenizedLineAtBufferRow(bufferRow, line, tokenizedLine, options);
    };

    LanguageMode.prototype.suggestedIndentForLineAtBufferRow = function(bufferRow, line, options) {
      var tokenizedLine;
      tokenizedLine = this.editor.tokenizedBuffer.buildTokenizedLineForRowWithText(bufferRow, line);
      return this.suggestedIndentForTokenizedLineAtBufferRow(bufferRow, line, tokenizedLine, options);
    };

    LanguageMode.prototype.suggestedIndentForTokenizedLineAtBufferRow = function(bufferRow, line, tokenizedLine, options) {
      var decreaseIndentRegex, decreaseNextIndentRegex, desiredIndentLevel, increaseIndentRegex, iterator, precedingLine, precedingRow, ref, scopeDescriptor;
      iterator = tokenizedLine.getTokenIterator();
      iterator.next();
      scopeDescriptor = new ScopeDescriptor({
        scopes: iterator.getScopes()
      });
      increaseIndentRegex = this.increaseIndentRegexForScopeDescriptor(scopeDescriptor);
      decreaseIndentRegex = this.decreaseIndentRegexForScopeDescriptor(scopeDescriptor);
      decreaseNextIndentRegex = this.decreaseNextIndentRegexForScopeDescriptor(scopeDescriptor);
      if ((ref = options != null ? options.skipBlankLines : void 0) != null ? ref : true) {
        precedingRow = this.buffer.previousNonBlankRow(bufferRow);
        if (precedingRow == null) {
          return 0;
        }
      } else {
        precedingRow = bufferRow - 1;
        if (precedingRow < 0) {
          return 0;
        }
      }
      desiredIndentLevel = this.editor.indentationForBufferRow(precedingRow);
      if (!increaseIndentRegex) {
        return desiredIndentLevel;
      }
      if (!this.editor.isBufferRowCommented(precedingRow)) {
        precedingLine = this.buffer.lineForRow(precedingRow);
        if (increaseIndentRegex != null ? increaseIndentRegex.testSync(precedingLine) : void 0) {
          desiredIndentLevel += 1;
        }
        if (decreaseNextIndentRegex != null ? decreaseNextIndentRegex.testSync(precedingLine) : void 0) {
          desiredIndentLevel -= 1;
        }
      }
      if (!this.buffer.isRowBlank(precedingRow)) {
        if (decreaseIndentRegex != null ? decreaseIndentRegex.testSync(line) : void 0) {
          desiredIndentLevel -= 1;
        }
      }
      return Math.max(desiredIndentLevel, 0);
    };

    LanguageMode.prototype.minIndentLevelForRowRange = function(startRow, endRow) {
      var indents, row;
      indents = (function() {
        var i, ref, ref1, results;
        results = [];
        for (row = i = ref = startRow, ref1 = endRow; i <= ref1; row = i += 1) {
          if (!this.editor.isBufferRowBlank(row)) {
            results.push(this.editor.indentationForBufferRow(row));
          }
        }
        return results;
      }).call(this);
      if (!indents.length) {
        indents = [0];
      }
      return Math.min.apply(Math, indents);
    };

    LanguageMode.prototype.autoIndentBufferRows = function(startRow, endRow) {
      var i, ref, ref1, row;
      for (row = i = ref = startRow, ref1 = endRow; i <= ref1; row = i += 1) {
        this.autoIndentBufferRow(row);
      }
    };

    LanguageMode.prototype.autoIndentBufferRow = function(bufferRow, options) {
      var indentLevel;
      indentLevel = this.suggestedIndentForBufferRow(bufferRow, options);
      return this.editor.setIndentationForBufferRow(bufferRow, indentLevel, options);
    };

    LanguageMode.prototype.autoDecreaseIndentForBufferRow = function(bufferRow) {
      var currentIndentLevel, decreaseIndentRegex, decreaseNextIndentRegex, desiredIndentLevel, increaseIndentRegex, line, precedingLine, precedingRow, scopeDescriptor;
      scopeDescriptor = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]);
      if (!(decreaseIndentRegex = this.decreaseIndentRegexForScopeDescriptor(scopeDescriptor))) {
        return;
      }
      line = this.buffer.lineForRow(bufferRow);
      if (!decreaseIndentRegex.testSync(line)) {
        return;
      }
      currentIndentLevel = this.editor.indentationForBufferRow(bufferRow);
      if (currentIndentLevel === 0) {
        return;
      }
      precedingRow = this.buffer.previousNonBlankRow(bufferRow);
      if (precedingRow == null) {
        return;
      }
      precedingLine = this.buffer.lineForRow(precedingRow);
      desiredIndentLevel = this.editor.indentationForBufferRow(precedingRow);
      if (increaseIndentRegex = this.increaseIndentRegexForScopeDescriptor(scopeDescriptor)) {
        if (!increaseIndentRegex.testSync(precedingLine)) {
          desiredIndentLevel -= 1;
        }
      }
      if (decreaseNextIndentRegex = this.decreaseNextIndentRegexForScopeDescriptor(scopeDescriptor)) {
        if (decreaseNextIndentRegex.testSync(precedingLine)) {
          desiredIndentLevel -= 1;
        }
      }
      if (desiredIndentLevel >= 0 && desiredIndentLevel < currentIndentLevel) {
        return this.editor.setIndentationForBufferRow(bufferRow, desiredIndentLevel);
      }
    };

    LanguageMode.prototype.cacheRegex = function(pattern) {
      var base;
      if (pattern) {
        return (base = this.regexesByPattern)[pattern] != null ? base[pattern] : base[pattern] = new OnigRegExp(pattern);
      }
    };

    LanguageMode.prototype.increaseIndentRegexForScopeDescriptor = function(scopeDescriptor) {
      return this.cacheRegex(this.editor.getIncreaseIndentPattern(scopeDescriptor));
    };

    LanguageMode.prototype.decreaseIndentRegexForScopeDescriptor = function(scopeDescriptor) {
      return this.cacheRegex(this.editor.getDecreaseIndentPattern(scopeDescriptor));
    };

    LanguageMode.prototype.decreaseNextIndentRegexForScopeDescriptor = function(scopeDescriptor) {
      return this.cacheRegex(this.editor.getDecreaseNextIndentPattern(scopeDescriptor));
    };

    LanguageMode.prototype.foldEndRegexForScopeDescriptor = function(scopeDescriptor) {
      return this.cacheRegex(this.editor.getFoldEndPattern(scopeDescriptor));
    };

    return LanguageMode;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9sYW5ndWFnZS1tb2RlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsUUFBUyxPQUFBLENBQVEsYUFBUjs7RUFDVixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILGFBQWMsT0FBQSxDQUFRLFdBQVI7O0VBQ2YsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBQ2xCLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBRWQsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUlTLHNCQUFDLE1BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNYLElBQUMsQ0FBQSxTQUFVLElBQUMsQ0FBQSxPQUFYO01BQ0YsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0lBRlQ7OzJCQUliLE9BQUEsR0FBUyxTQUFBLEdBQUE7OzJCQUVULDZCQUFBLEdBQStCLFNBQUMsR0FBRDthQUM3QixJQUFDLENBQUEsK0JBQUQsQ0FBaUMsR0FBakMsRUFBc0MsR0FBdEM7SUFENkI7OzJCQVMvQiwrQkFBQSxHQUFpQyxTQUFDLEtBQUQsRUFBUSxHQUFSO0FBQy9CLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQ0FBUixDQUF5QyxDQUFDLEtBQUQsRUFBUSxDQUFSLENBQXpDO01BQ1IsY0FBQSxHQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLEtBQTFCO01BQ2pCLElBQUEsMkJBQWMsY0FBYyxDQUFFLDRCQUE5QjtBQUFBLGVBQUE7O01BQ0Msc0RBQUQsRUFBcUI7TUFFckIsTUFBQSxHQUFTLElBQUMsQ0FBQSxNQUFNLENBQUM7TUFDakIsdUJBQUEsR0FBMEIsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxrQkFBZixDQUFrQyxDQUFDLE9BQW5D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LGtCQUFBLElBQXNCLEVBQXRCO1NBREY7O01BR0EsSUFBRyxrQkFBQSxJQUFzQixDQUF0QixJQUE0QixrQkFBQSxHQUFxQixrQkFBcEQ7ZUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQW1DLFNBQW5DLEVBQThDLGtCQUE5QyxFQURGOztJQXRCOEI7OzJCQXlCaEMsVUFBQSxHQUFZLFNBQUMsT0FBRDtBQUNWLFVBQUE7TUFBQSxJQUFHLE9BQUg7cUVBQ29CLENBQUEsT0FBQSxRQUFBLENBQUEsT0FBQSxJQUFnQixJQUFBLFVBQUEsQ0FBVyxPQUFYLEVBRHBDOztJQURVOzsyQkFJWixxQ0FBQSxHQUF1QyxTQUFDLGVBQUQ7YUFDckMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLGVBQWpDLENBQVo7SUFEcUM7OzJCQUd2QyxxQ0FBQSxHQUF1QyxTQUFDLGVBQUQ7YUFDckMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLGVBQWpDLENBQVo7SUFEcUM7OzJCQUd2Qyx5Q0FBQSxHQUEyQyxTQUFDLGVBQUQ7YUFDekMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLDRCQUFSLENBQXFDLGVBQXJDLENBQVo7SUFEeUM7OzJCQUczQyw4QkFBQSxHQUFnQyxTQUFDLGVBQUQ7YUFDOUIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLGVBQTFCLENBQVo7SUFEOEI7Ozs7O0FBNVZsQyIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlICd0ZXh0LWJ1ZmZlcidcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57T25pZ1JlZ0V4cH0gPSByZXF1aXJlICdvbmlndXJ1bWEnXG5TY29wZURlc2NyaXB0b3IgPSByZXF1aXJlICcuL3Njb3BlLWRlc2NyaXB0b3InXG5OdWxsR3JhbW1hciA9IHJlcXVpcmUgJy4vbnVsbC1ncmFtbWFyJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBMYW5ndWFnZU1vZGVcbiAgIyBTZXRzIHVwIGEgYExhbmd1YWdlTW9kZWAgZm9yIHRoZSBnaXZlbiB7VGV4dEVkaXRvcn0uXG4gICNcbiAgIyBlZGl0b3IgLSBUaGUge1RleHRFZGl0b3J9IHRvIGFzc29jaWF0ZSB3aXRoXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT5cbiAgICB7QGJ1ZmZlcn0gPSBAZWRpdG9yXG4gICAgQHJlZ2V4ZXNCeVBhdHRlcm4gPSB7fVxuXG4gIGRlc3Ryb3k6IC0+XG5cbiAgdG9nZ2xlTGluZUNvbW1lbnRGb3JCdWZmZXJSb3c6IChyb3cpIC0+XG4gICAgQHRvZ2dsZUxpbmVDb21tZW50c0ZvckJ1ZmZlclJvd3Mocm93LCByb3cpXG5cbiAgIyBXcmFwcyB0aGUgbGluZXMgYmV0d2VlbiB0d28gcm93cyBpbiBjb21tZW50cy5cbiAgI1xuICAjIElmIHRoZSBsYW5ndWFnZSBkb2Vzbid0IGhhdmUgY29tbWVudCwgbm90aGluZyBoYXBwZW5zLlxuICAjXG4gICMgc3RhcnRSb3cgLSBUaGUgcm93IHtOdW1iZXJ9IHRvIHN0YXJ0IGF0XG4gICMgZW5kUm93IC0gVGhlIHJvdyB7TnVtYmVyfSB0byBlbmQgYXRcbiAgdG9nZ2xlTGluZUNvbW1lbnRzRm9yQnVmZmVyUm93czogKHN0YXJ0LCBlbmQpIC0+XG4gICAgc2NvcGUgPSBAZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtzdGFydCwgMF0pXG4gICAgY29tbWVudFN0cmluZ3MgPSBAZWRpdG9yLmdldENvbW1lbnRTdHJpbmdzKHNjb3BlKVxuICAgIHJldHVybiB1bmxlc3MgY29tbWVudFN0cmluZ3M/LmNvbW1lbnRTdGFydFN0cmluZ1xuICAgIHtjb21tZW50U3RhcnRTdHJpbmcsIGNvbW1lbnRFbmRTdHJpbmd9ID0gY29tbWVudFN0cmluZ3NcblxuICAgIGJ1ZmZlciA9IEBlZGl0b3IuYnVmZmVyXG4gICAgY29tbWVudFN0YXJ0UmVnZXhTdHJpbmcgPSBfLmVzY2FwZVJlZ0V4cChjb21tZW50U3RhcnRTdHJpbmcpLnJlcGxhY2UoLyhcXHMrKSQvLCAnKD86JDEpPycpXG4gICAgY29tbWVudFN0YXJ0UmVnZXggPSBuZXcgT25pZ1JlZ0V4cChcIl4oXFxcXHMqKSgje2NvbW1lbnRTdGFydFJlZ2V4U3RyaW5nfSlcIilcblxuICAgIGlmIGNvbW1lbnRFbmRTdHJpbmdcbiAgICAgIHNob3VsZFVuY29tbWVudCA9IGNvbW1lbnRTdGFydFJlZ2V4LnRlc3RTeW5jKGJ1ZmZlci5saW5lRm9yUm93KHN0YXJ0KSlcbiAgICAgIGlmIHNob3VsZFVuY29tbWVudFxuICAgICAgICBjb21tZW50RW5kUmVnZXhTdHJpbmcgPSBfLmVzY2FwZVJlZ0V4cChjb21tZW50RW5kU3RyaW5nKS5yZXBsYWNlKC9eKFxccyspLywgJyg/OiQxKT8nKVxuICAgICAgICBjb21tZW50RW5kUmVnZXggPSBuZXcgT25pZ1JlZ0V4cChcIigje2NvbW1lbnRFbmRSZWdleFN0cmluZ30pKFxcXFxzKikkXCIpXG4gICAgICAgIHN0YXJ0TWF0Y2ggPSAgY29tbWVudFN0YXJ0UmVnZXguc2VhcmNoU3luYyhidWZmZXIubGluZUZvclJvdyhzdGFydCkpXG4gICAgICAgIGVuZE1hdGNoID0gY29tbWVudEVuZFJlZ2V4LnNlYXJjaFN5bmMoYnVmZmVyLmxpbmVGb3JSb3coZW5kKSlcbiAgICAgICAgaWYgc3RhcnRNYXRjaCBhbmQgZW5kTWF0Y2hcbiAgICAgICAgICBidWZmZXIudHJhbnNhY3QgLT5cbiAgICAgICAgICAgIGNvbHVtblN0YXJ0ID0gc3RhcnRNYXRjaFsxXS5sZW5ndGhcbiAgICAgICAgICAgIGNvbHVtbkVuZCA9IGNvbHVtblN0YXJ0ICsgc3RhcnRNYXRjaFsyXS5sZW5ndGhcbiAgICAgICAgICAgIGJ1ZmZlci5zZXRUZXh0SW5SYW5nZShbW3N0YXJ0LCBjb2x1bW5TdGFydF0sIFtzdGFydCwgY29sdW1uRW5kXV0sIFwiXCIpXG5cbiAgICAgICAgICAgIGVuZExlbmd0aCA9IGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGVuZCkgLSBlbmRNYXRjaFsyXS5sZW5ndGhcbiAgICAgICAgICAgIGVuZENvbHVtbiA9IGVuZExlbmd0aCAtIGVuZE1hdGNoWzFdLmxlbmd0aFxuICAgICAgICAgICAgYnVmZmVyLnNldFRleHRJblJhbmdlKFtbZW5kLCBlbmRDb2x1bW5dLCBbZW5kLCBlbmRMZW5ndGhdXSwgXCJcIilcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmZmVyLnRyYW5zYWN0IC0+XG4gICAgICAgICAgaW5kZW50TGVuZ3RoID0gYnVmZmVyLmxpbmVGb3JSb3coc3RhcnQpLm1hdGNoKC9eXFxzKi8pP1swXS5sZW5ndGggPyAwXG4gICAgICAgICAgYnVmZmVyLmluc2VydChbc3RhcnQsIGluZGVudExlbmd0aF0sIGNvbW1lbnRTdGFydFN0cmluZylcbiAgICAgICAgICBidWZmZXIuaW5zZXJ0KFtlbmQsIGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KGVuZCldLCBjb21tZW50RW5kU3RyaW5nKVxuICAgIGVsc2VcbiAgICAgIGFsbEJsYW5rID0gdHJ1ZVxuICAgICAgYWxsQmxhbmtPckNvbW1lbnRlZCA9IHRydWVcblxuICAgICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF0gYnkgMVxuICAgICAgICBsaW5lID0gYnVmZmVyLmxpbmVGb3JSb3cocm93KVxuICAgICAgICBibGFuayA9IGxpbmU/Lm1hdGNoKC9eXFxzKiQvKVxuXG4gICAgICAgIGFsbEJsYW5rID0gZmFsc2UgdW5sZXNzIGJsYW5rXG4gICAgICAgIGFsbEJsYW5rT3JDb21tZW50ZWQgPSBmYWxzZSB1bmxlc3MgYmxhbmsgb3IgY29tbWVudFN0YXJ0UmVnZXgudGVzdFN5bmMobGluZSlcblxuICAgICAgc2hvdWxkVW5jb21tZW50ID0gYWxsQmxhbmtPckNvbW1lbnRlZCBhbmQgbm90IGFsbEJsYW5rXG5cbiAgICAgIGlmIHNob3VsZFVuY29tbWVudFxuICAgICAgICBmb3Igcm93IGluIFtzdGFydC4uZW5kXSBieSAxXG4gICAgICAgICAgaWYgbWF0Y2ggPSBjb21tZW50U3RhcnRSZWdleC5zZWFyY2hTeW5jKGJ1ZmZlci5saW5lRm9yUm93KHJvdykpXG4gICAgICAgICAgICBjb2x1bW5TdGFydCA9IG1hdGNoWzFdLmxlbmd0aFxuICAgICAgICAgICAgY29sdW1uRW5kID0gY29sdW1uU3RhcnQgKyBtYXRjaFsyXS5sZW5ndGhcbiAgICAgICAgICAgIGJ1ZmZlci5zZXRUZXh0SW5SYW5nZShbW3JvdywgY29sdW1uU3RhcnRdLCBbcm93LCBjb2x1bW5FbmRdXSwgXCJcIilcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgc3RhcnQgaXMgZW5kXG4gICAgICAgICAgaW5kZW50ID0gQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhzdGFydClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGluZGVudCA9IEBtaW5JbmRlbnRMZXZlbEZvclJvd1JhbmdlKHN0YXJ0LCBlbmQpXG4gICAgICAgIGluZGVudFN0cmluZyA9IEBlZGl0b3IuYnVpbGRJbmRlbnRTdHJpbmcoaW5kZW50KVxuICAgICAgICB0YWJMZW5ndGggPSBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgICAgIGluZGVudFJlZ2V4ID0gbmV3IFJlZ0V4cChcIihcXHR8WyBdeyN7dGFiTGVuZ3RofX0peyN7TWF0aC5mbG9vcihpbmRlbnQpfX1cIilcbiAgICAgICAgZm9yIHJvdyBpbiBbc3RhcnQuLmVuZF0gYnkgMVxuICAgICAgICAgIGxpbmUgPSBidWZmZXIubGluZUZvclJvdyhyb3cpXG4gICAgICAgICAgaWYgaW5kZW50TGVuZ3RoID0gbGluZS5tYXRjaChpbmRlbnRSZWdleCk/WzBdLmxlbmd0aFxuICAgICAgICAgICAgYnVmZmVyLmluc2VydChbcm93LCBpbmRlbnRMZW5ndGhdLCBjb21tZW50U3RhcnRTdHJpbmcpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgYnVmZmVyLnNldFRleHRJblJhbmdlKFtbcm93LCAwXSwgW3JvdywgaW5kZW50U3RyaW5nLmxlbmd0aF1dLCBpbmRlbnRTdHJpbmcgKyBjb21tZW50U3RhcnRTdHJpbmcpXG4gICAgcmV0dXJuXG5cbiAgIyBGb2xkcyBhbGwgdGhlIGZvbGRhYmxlIGxpbmVzIGluIHRoZSBidWZmZXIuXG4gIGZvbGRBbGw6IC0+XG4gICAgQHVuZm9sZEFsbCgpXG4gICAgZm9sZGVkUm93UmFuZ2VzID0ge31cbiAgICBmb3IgY3VycmVudFJvdyBpbiBbMC4uQGJ1ZmZlci5nZXRMYXN0Um93KCldIGJ5IDFcbiAgICAgIHJvd1JhbmdlID0gW3N0YXJ0Um93LCBlbmRSb3ddID0gQHJvd1JhbmdlRm9yRm9sZEF0QnVmZmVyUm93KGN1cnJlbnRSb3cpID8gW11cbiAgICAgIGNvbnRpbnVlIHVubGVzcyBzdGFydFJvdz9cbiAgICAgIGNvbnRpbnVlIGlmIGZvbGRlZFJvd1Jhbmdlc1tyb3dSYW5nZV1cblxuICAgICAgQGVkaXRvci5mb2xkQnVmZmVyUm93UmFuZ2Uoc3RhcnRSb3csIGVuZFJvdylcbiAgICAgIGZvbGRlZFJvd1Jhbmdlc1tyb3dSYW5nZV0gPSB0cnVlXG4gICAgcmV0dXJuXG5cbiAgIyBVbmZvbGRzIGFsbCB0aGUgZm9sZGFibGUgbGluZXMgaW4gdGhlIGJ1ZmZlci5cbiAgdW5mb2xkQWxsOiAtPlxuICAgIEBlZGl0b3IuZGlzcGxheUxheWVyLmRlc3Ryb3lBbGxGb2xkcygpXG5cbiAgIyBGb2xkIGFsbCBjb21tZW50IGFuZCBjb2RlIGJsb2NrcyBhdCBhIGdpdmVuIGluZGVudExldmVsXG4gICNcbiAgIyBpbmRlbnRMZXZlbCAtIEEge051bWJlcn0gaW5kaWNhdGluZyBpbmRlbnRMZXZlbDsgMCBiYXNlZC5cbiAgZm9sZEFsbEF0SW5kZW50TGV2ZWw6IChpbmRlbnRMZXZlbCkgLT5cbiAgICBAdW5mb2xkQWxsKClcbiAgICBmb2xkZWRSb3dSYW5nZXMgPSB7fVxuICAgIGZvciBjdXJyZW50Um93IGluIFswLi5AYnVmZmVyLmdldExhc3RSb3coKV0gYnkgMVxuICAgICAgcm93UmFuZ2UgPSBbc3RhcnRSb3csIGVuZFJvd10gPSBAcm93UmFuZ2VGb3JGb2xkQXRCdWZmZXJSb3coY3VycmVudFJvdykgPyBbXVxuICAgICAgY29udGludWUgdW5sZXNzIHN0YXJ0Um93P1xuICAgICAgY29udGludWUgaWYgZm9sZGVkUm93UmFuZ2VzW3Jvd1JhbmdlXVxuXG4gICAgICAjIGFzc3VtcHRpb246IHN0YXJ0Um93IHdpbGwgYWx3YXlzIGJlIHRoZSBtaW4gaW5kZW50IGxldmVsIGZvciB0aGUgZW50aXJlIHJhbmdlXG4gICAgICBpZiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHN0YXJ0Um93KSBpcyBpbmRlbnRMZXZlbFxuICAgICAgICBAZWRpdG9yLmZvbGRCdWZmZXJSb3dSYW5nZShzdGFydFJvdywgZW5kUm93KVxuICAgICAgICBmb2xkZWRSb3dSYW5nZXNbcm93UmFuZ2VdID0gdHJ1ZVxuICAgIHJldHVyblxuXG4gICMgR2l2ZW4gYSBidWZmZXIgcm93LCBjcmVhdGVzIGEgZm9sZCBhdCBpdC5cbiAgI1xuICAjIGJ1ZmZlclJvdyAtIEEge051bWJlcn0gaW5kaWNhdGluZyB0aGUgYnVmZmVyIHJvd1xuICAjXG4gICMgUmV0dXJucyB0aGUgbmV3IHtGb2xkfS5cbiAgZm9sZEJ1ZmZlclJvdzogKGJ1ZmZlclJvdykgLT5cbiAgICBmb3IgY3VycmVudFJvdyBpbiBbYnVmZmVyUm93Li4wXSBieSAtMVxuICAgICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQHJvd1JhbmdlRm9yRm9sZEF0QnVmZmVyUm93KGN1cnJlbnRSb3cpID8gW11cbiAgICAgIGNvbnRpbnVlIHVubGVzcyBzdGFydFJvdz8gYW5kIHN0YXJ0Um93IDw9IGJ1ZmZlclJvdyA8PSBlbmRSb3dcbiAgICAgIHVubGVzcyBAZWRpdG9yLmlzRm9sZGVkQXRCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICAgIHJldHVybiBAZWRpdG9yLmZvbGRCdWZmZXJSb3dSYW5nZShzdGFydFJvdywgZW5kUm93KVxuXG4gICMgRmluZCB0aGUgcm93IHJhbmdlIGZvciBhIGZvbGQgYXQgYSBnaXZlbiBidWZmZXJSb3cuIFdpbGwgaGFuZGxlIGNvbW1lbnRzXG4gICMgYW5kIGNvZGUuXG4gICNcbiAgIyBidWZmZXJSb3cgLSBBIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhlIGJ1ZmZlciByb3dcbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiB0aGUgW3N0YXJ0Um93LCBlbmRSb3ddLiBSZXR1cm5zIG51bGwgaWYgbm8gcmFuZ2UuXG4gIHJvd1JhbmdlRm9yRm9sZEF0QnVmZmVyUm93OiAoYnVmZmVyUm93KSAtPlxuICAgIHJvd1JhbmdlID0gQHJvd1JhbmdlRm9yQ29tbWVudEF0QnVmZmVyUm93KGJ1ZmZlclJvdylcbiAgICByb3dSYW5nZSA/PSBAcm93UmFuZ2VGb3JDb2RlRm9sZEF0QnVmZmVyUm93KGJ1ZmZlclJvdylcbiAgICByb3dSYW5nZVxuXG4gIHJvd1JhbmdlRm9yQ29tbWVudEF0QnVmZmVyUm93OiAoYnVmZmVyUm93KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGVkaXRvci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVkTGluZXNbYnVmZmVyUm93XT8uaXNDb21tZW50KClcblxuICAgIHN0YXJ0Um93ID0gYnVmZmVyUm93XG4gICAgZW5kUm93ID0gYnVmZmVyUm93XG5cbiAgICBpZiBidWZmZXJSb3cgPiAwXG4gICAgICBmb3IgY3VycmVudFJvdyBpbiBbYnVmZmVyUm93LTEuLjBdIGJ5IC0xXG4gICAgICAgIGJyZWFrIHVubGVzcyBAZWRpdG9yLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZWRMaW5lc1tjdXJyZW50Um93XT8uaXNDb21tZW50KClcbiAgICAgICAgc3RhcnRSb3cgPSBjdXJyZW50Um93XG5cbiAgICBpZiBidWZmZXJSb3cgPCBAYnVmZmVyLmdldExhc3RSb3coKVxuICAgICAgZm9yIGN1cnJlbnRSb3cgaW4gW2J1ZmZlclJvdysxLi5AYnVmZmVyLmdldExhc3RSb3coKV0gYnkgMVxuICAgICAgICBicmVhayB1bmxlc3MgQGVkaXRvci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVkTGluZXNbY3VycmVudFJvd10/LmlzQ29tbWVudCgpXG4gICAgICAgIGVuZFJvdyA9IGN1cnJlbnRSb3dcblxuICAgIHJldHVybiBbc3RhcnRSb3csIGVuZFJvd10gaWYgc3RhcnRSb3cgaXNudCBlbmRSb3dcblxuICByb3dSYW5nZUZvckNvZGVGb2xkQXRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIEBpc0ZvbGRhYmxlQXRCdWZmZXJSb3coYnVmZmVyUm93KVxuXG4gICAgc3RhcnRJbmRlbnRMZXZlbCA9IEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3coYnVmZmVyUm93KVxuICAgIHNjb3BlRGVzY3JpcHRvciA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgMF0pXG4gICAgZm9yIHJvdyBpbiBbKGJ1ZmZlclJvdyArIDEpLi5AZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKV0gYnkgMVxuICAgICAgY29udGludWUgaWYgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgIGluZGVudGF0aW9uID0gQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhyb3cpXG4gICAgICBpZiBpbmRlbnRhdGlvbiA8PSBzdGFydEluZGVudExldmVsXG4gICAgICAgIGluY2x1ZGVSb3dJbkZvbGQgPSBpbmRlbnRhdGlvbiBpcyBzdGFydEluZGVudExldmVsIGFuZCBAZm9sZEVuZFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcik/LnNlYXJjaFN5bmMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKVxuICAgICAgICBmb2xkRW5kUm93ID0gcm93IGlmIGluY2x1ZGVSb3dJbkZvbGRcbiAgICAgICAgYnJlYWtcblxuICAgICAgZm9sZEVuZFJvdyA9IHJvd1xuXG4gICAgW2J1ZmZlclJvdywgZm9sZEVuZFJvd11cblxuICBpc0ZvbGRhYmxlQXRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgQGVkaXRvci50b2tlbml6ZWRCdWZmZXIuaXNGb2xkYWJsZUF0Um93KGJ1ZmZlclJvdylcblxuICAjIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBsaW5lIGF0IHRoZSBnaXZlbiBidWZmZXJcbiAgIyByb3cgaXMgYSBjb21tZW50LlxuICBpc0xpbmVDb21tZW50ZWRBdEJ1ZmZlclJvdzogKGJ1ZmZlclJvdykgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIDAgPD0gYnVmZmVyUm93IDw9IEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgQGVkaXRvci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVkTGluZXNbYnVmZmVyUm93XT8uaXNDb21tZW50KClcblxuICAjIEZpbmQgYSByb3cgcmFuZ2UgZm9yIGEgJ3BhcmFncmFwaCcgYXJvdW5kIHNwZWNpZmllZCBidWZmZXJSb3cuIEEgcGFyYWdyYXBoXG4gICMgaXMgYSBibG9jayBvZiB0ZXh0IGJvdW5kZWQgYnkgYW5kIGVtcHR5IGxpbmUgb3IgYSBibG9jayBvZiB0ZXh0IHRoYXQgaXMgbm90XG4gICMgdGhlIHNhbWUgdHlwZSAoY29tbWVudHMgbmV4dCB0byBzb3VyY2UgY29kZSkuXG4gIHJvd1JhbmdlRm9yUGFyYWdyYXBoQXRCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgc2NvcGUgPSBAZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJSb3csIDBdKVxuICAgIGNvbW1lbnRTdHJpbmdzID0gQGVkaXRvci5nZXRDb21tZW50U3RyaW5ncyhzY29wZSlcbiAgICBjb21tZW50U3RhcnRSZWdleCA9IG51bGxcbiAgICBpZiBjb21tZW50U3RyaW5ncz8uY29tbWVudFN0YXJ0U3RyaW5nPyBhbmQgbm90IGNvbW1lbnRTdHJpbmdzLmNvbW1lbnRFbmRTdHJpbmc/XG4gICAgICBjb21tZW50U3RhcnRSZWdleFN0cmluZyA9IF8uZXNjYXBlUmVnRXhwKGNvbW1lbnRTdHJpbmdzLmNvbW1lbnRTdGFydFN0cmluZykucmVwbGFjZSgvKFxccyspJC8sICcoPzokMSk/JylcbiAgICAgIGNvbW1lbnRTdGFydFJlZ2V4ID0gbmV3IE9uaWdSZWdFeHAoXCJeKFxcXFxzKikoI3tjb21tZW50U3RhcnRSZWdleFN0cmluZ30pXCIpXG5cbiAgICBmaWx0ZXJDb21tZW50U3RhcnQgPSAobGluZSkgLT5cbiAgICAgIGlmIGNvbW1lbnRTdGFydFJlZ2V4P1xuICAgICAgICBtYXRjaGVzID0gY29tbWVudFN0YXJ0UmVnZXguc2VhcmNoU3luYyhsaW5lKVxuICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcobWF0Y2hlc1swXS5lbmQpIGlmIG1hdGNoZXM/Lmxlbmd0aFxuICAgICAgbGluZVxuXG4gICAgcmV0dXJuIHVubGVzcyAvXFxTLy50ZXN0KGZpbHRlckNvbW1lbnRTdGFydChAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGJ1ZmZlclJvdykpKVxuXG4gICAgaWYgQGlzTGluZUNvbW1lbnRlZEF0QnVmZmVyUm93KGJ1ZmZlclJvdylcbiAgICAgIGlzT3JpZ2luYWxSb3dDb21tZW50ID0gdHJ1ZVxuICAgICAgcmFuZ2UgPSBAcm93UmFuZ2VGb3JDb21tZW50QXRCdWZmZXJSb3coYnVmZmVyUm93KVxuICAgICAgW2ZpcnN0Um93LCBsYXN0Um93XSA9IHJhbmdlIG9yIFtidWZmZXJSb3csIGJ1ZmZlclJvd11cbiAgICBlbHNlXG4gICAgICBpc09yaWdpbmFsUm93Q29tbWVudCA9IGZhbHNlXG4gICAgICBbZmlyc3RSb3csIGxhc3RSb3ddID0gWzAsIEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpLTFdXG5cbiAgICBzdGFydFJvdyA9IGJ1ZmZlclJvd1xuICAgIHdoaWxlIHN0YXJ0Um93ID4gZmlyc3RSb3dcbiAgICAgIGJyZWFrIGlmIEBpc0xpbmVDb21tZW50ZWRBdEJ1ZmZlclJvdyhzdGFydFJvdyAtIDEpIGlzbnQgaXNPcmlnaW5hbFJvd0NvbW1lbnRcbiAgICAgIGJyZWFrIHVubGVzcyAvXFxTLy50ZXN0KGZpbHRlckNvbW1lbnRTdGFydChAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHN0YXJ0Um93IC0gMSkpKVxuICAgICAgc3RhcnRSb3ctLVxuXG4gICAgZW5kUm93ID0gYnVmZmVyUm93XG4gICAgbGFzdFJvdyA9IEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgd2hpbGUgZW5kUm93IDwgbGFzdFJvd1xuICAgICAgYnJlYWsgaWYgQGlzTGluZUNvbW1lbnRlZEF0QnVmZmVyUm93KGVuZFJvdyArIDEpIGlzbnQgaXNPcmlnaW5hbFJvd0NvbW1lbnRcbiAgICAgIGJyZWFrIHVubGVzcyAvXFxTLy50ZXN0KGZpbHRlckNvbW1lbnRTdGFydChAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGVuZFJvdyArIDEpKSlcbiAgICAgIGVuZFJvdysrXG5cbiAgICBuZXcgUmFuZ2UoW3N0YXJ0Um93LCAwXSwgW2VuZFJvdywgQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhlbmRSb3cpLmxlbmd0aF0pXG5cbiAgIyBHaXZlbiBhIGJ1ZmZlciByb3csIHRoaXMgcmV0dXJucyBhIHN1Z2dlc3RlZCBpbmRlbnRhdGlvbiBsZXZlbC5cbiAgI1xuICAjIFRoZSBpbmRlbnRhdGlvbiBsZXZlbCBwcm92aWRlZCBpcyBiYXNlZCBvbiB0aGUgY3VycmVudCB7TGFuZ3VhZ2VNb2RlfS5cbiAgI1xuICAjIGJ1ZmZlclJvdyAtIEEge051bWJlcn0gaW5kaWNhdGluZyB0aGUgYnVmZmVyIHJvd1xuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9LlxuICBzdWdnZXN0ZWRJbmRlbnRGb3JCdWZmZXJSb3c6IChidWZmZXJSb3csIG9wdGlvbnMpIC0+XG4gICAgbGluZSA9IEBidWZmZXIubGluZUZvclJvdyhidWZmZXJSb3cpXG4gICAgdG9rZW5pemVkTGluZSA9IEBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplZExpbmVGb3JSb3coYnVmZmVyUm93KVxuICAgIEBzdWdnZXN0ZWRJbmRlbnRGb3JUb2tlbml6ZWRMaW5lQXRCdWZmZXJSb3coYnVmZmVyUm93LCBsaW5lLCB0b2tlbml6ZWRMaW5lLCBvcHRpb25zKVxuXG4gIHN1Z2dlc3RlZEluZGVudEZvckxpbmVBdEJ1ZmZlclJvdzogKGJ1ZmZlclJvdywgbGluZSwgb3B0aW9ucykgLT5cbiAgICB0b2tlbml6ZWRMaW5lID0gQGVkaXRvci50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQoYnVmZmVyUm93LCBsaW5lKVxuICAgIEBzdWdnZXN0ZWRJbmRlbnRGb3JUb2tlbml6ZWRMaW5lQXRCdWZmZXJSb3coYnVmZmVyUm93LCBsaW5lLCB0b2tlbml6ZWRMaW5lLCBvcHRpb25zKVxuXG4gIHN1Z2dlc3RlZEluZGVudEZvclRva2VuaXplZExpbmVBdEJ1ZmZlclJvdzogKGJ1ZmZlclJvdywgbGluZSwgdG9rZW5pemVkTGluZSwgb3B0aW9ucykgLT5cbiAgICBpdGVyYXRvciA9IHRva2VuaXplZExpbmUuZ2V0VG9rZW5JdGVyYXRvcigpXG4gICAgaXRlcmF0b3IubmV4dCgpXG4gICAgc2NvcGVEZXNjcmlwdG9yID0gbmV3IFNjb3BlRGVzY3JpcHRvcihzY29wZXM6IGl0ZXJhdG9yLmdldFNjb3BlcygpKVxuXG4gICAgaW5jcmVhc2VJbmRlbnRSZWdleCA9IEBpbmNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcbiAgICBkZWNyZWFzZUluZGVudFJlZ2V4ID0gQGRlY3JlYXNlSW5kZW50UmVnZXhGb3JTY29wZURlc2NyaXB0b3Ioc2NvcGVEZXNjcmlwdG9yKVxuICAgIGRlY3JlYXNlTmV4dEluZGVudFJlZ2V4ID0gQGRlY3JlYXNlTmV4dEluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcblxuICAgIGlmIG9wdGlvbnM/LnNraXBCbGFua0xpbmVzID8gdHJ1ZVxuICAgICAgcHJlY2VkaW5nUm93ID0gQGJ1ZmZlci5wcmV2aW91c05vbkJsYW5rUm93KGJ1ZmZlclJvdylcbiAgICAgIHJldHVybiAwIHVubGVzcyBwcmVjZWRpbmdSb3c/XG4gICAgZWxzZVxuICAgICAgcHJlY2VkaW5nUm93ID0gYnVmZmVyUm93IC0gMVxuICAgICAgcmV0dXJuIDAgaWYgcHJlY2VkaW5nUm93IDwgMFxuXG4gICAgZGVzaXJlZEluZGVudExldmVsID0gQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhwcmVjZWRpbmdSb3cpXG4gICAgcmV0dXJuIGRlc2lyZWRJbmRlbnRMZXZlbCB1bmxlc3MgaW5jcmVhc2VJbmRlbnRSZWdleFxuXG4gICAgdW5sZXNzIEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQocHJlY2VkaW5nUm93KVxuICAgICAgcHJlY2VkaW5nTGluZSA9IEBidWZmZXIubGluZUZvclJvdyhwcmVjZWRpbmdSb3cpXG4gICAgICBkZXNpcmVkSW5kZW50TGV2ZWwgKz0gMSBpZiBpbmNyZWFzZUluZGVudFJlZ2V4Py50ZXN0U3luYyhwcmVjZWRpbmdMaW5lKVxuICAgICAgZGVzaXJlZEluZGVudExldmVsIC09IDEgaWYgZGVjcmVhc2VOZXh0SW5kZW50UmVnZXg/LnRlc3RTeW5jKHByZWNlZGluZ0xpbmUpXG5cbiAgICB1bmxlc3MgQGJ1ZmZlci5pc1Jvd0JsYW5rKHByZWNlZGluZ1JvdylcbiAgICAgIGRlc2lyZWRJbmRlbnRMZXZlbCAtPSAxIGlmIGRlY3JlYXNlSW5kZW50UmVnZXg/LnRlc3RTeW5jKGxpbmUpXG5cbiAgICBNYXRoLm1heChkZXNpcmVkSW5kZW50TGV2ZWwsIDApXG5cbiAgIyBDYWxjdWxhdGUgYSBtaW5pbXVtIGluZGVudCBsZXZlbCBmb3IgYSByYW5nZSBvZiBsaW5lcyBleGNsdWRpbmcgZW1wdHkgbGluZXMuXG4gICNcbiAgIyBzdGFydFJvdyAtIFRoZSByb3cge051bWJlcn0gdG8gc3RhcnQgYXRcbiAgIyBlbmRSb3cgLSBUaGUgcm93IHtOdW1iZXJ9IHRvIGVuZCBhdFxuICAjXG4gICMgUmV0dXJucyBhIHtOdW1iZXJ9IG9mIHRoZSBpbmRlbnQgbGV2ZWwgb2YgdGhlIGJsb2NrIG9mIGxpbmVzLlxuICBtaW5JbmRlbnRMZXZlbEZvclJvd1JhbmdlOiAoc3RhcnRSb3csIGVuZFJvdykgLT5cbiAgICBpbmRlbnRzID0gKEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSBmb3Igcm93IGluIFtzdGFydFJvdy4uZW5kUm93XSBieSAxIHdoZW4gbm90IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpKVxuICAgIGluZGVudHMgPSBbMF0gdW5sZXNzIGluZGVudHMubGVuZ3RoXG4gICAgTWF0aC5taW4oaW5kZW50cy4uLilcblxuICAjIEluZGVudHMgYWxsIHRoZSByb3dzIGJldHdlZW4gdHdvIGJ1ZmZlciByb3cgbnVtYmVycy5cbiAgI1xuICAjIHN0YXJ0Um93IC0gVGhlIHJvdyB7TnVtYmVyfSB0byBzdGFydCBhdFxuICAjIGVuZFJvdyAtIFRoZSByb3cge051bWJlcn0gdG8gZW5kIGF0XG4gIGF1dG9JbmRlbnRCdWZmZXJSb3dzOiAoc3RhcnRSb3csIGVuZFJvdykgLT5cbiAgICBAYXV0b0luZGVudEJ1ZmZlclJvdyhyb3cpIGZvciByb3cgaW4gW3N0YXJ0Um93Li5lbmRSb3ddIGJ5IDFcbiAgICByZXR1cm5cblxuICAjIEdpdmVuIGEgYnVmZmVyIHJvdywgdGhpcyBpbmRlbnRzIGl0LlxuICAjXG4gICMgYnVmZmVyUm93IC0gVGhlIHJvdyB7TnVtYmVyfS5cbiAgIyBvcHRpb25zIC0gQW4gb3B0aW9ucyB7T2JqZWN0fSB0byBwYXNzIHRocm91Z2ggdG8ge1RleHRFZGl0b3I6OnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93fS5cbiAgYXV0b0luZGVudEJ1ZmZlclJvdzogKGJ1ZmZlclJvdywgb3B0aW9ucykgLT5cbiAgICBpbmRlbnRMZXZlbCA9IEBzdWdnZXN0ZWRJbmRlbnRGb3JCdWZmZXJSb3coYnVmZmVyUm93LCBvcHRpb25zKVxuICAgIEBlZGl0b3Iuc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3coYnVmZmVyUm93LCBpbmRlbnRMZXZlbCwgb3B0aW9ucylcblxuICAjIEdpdmVuIGEgYnVmZmVyIHJvdywgdGhpcyBkZWNyZWFzZXMgdGhlIGluZGVudGF0aW9uLlxuICAjXG4gICMgYnVmZmVyUm93IC0gVGhlIHJvdyB7TnVtYmVyfVxuICBhdXRvRGVjcmVhc2VJbmRlbnRGb3JCdWZmZXJSb3c6IChidWZmZXJSb3cpIC0+XG4gICAgc2NvcGVEZXNjcmlwdG9yID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUm93LCAwXSlcbiAgICByZXR1cm4gdW5sZXNzIGRlY3JlYXNlSW5kZW50UmVnZXggPSBAZGVjcmVhc2VJbmRlbnRSZWdleEZvclNjb3BlRGVzY3JpcHRvcihzY29wZURlc2NyaXB0b3IpXG5cbiAgICBsaW5lID0gQGJ1ZmZlci5saW5lRm9yUm93KGJ1ZmZlclJvdylcbiAgICByZXR1cm4gdW5sZXNzIGRlY3JlYXNlSW5kZW50UmVnZXgudGVzdFN5bmMobGluZSlcblxuICAgIGN1cnJlbnRJbmRlbnRMZXZlbCA9IEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3coYnVmZmVyUm93KVxuICAgIHJldHVybiBpZiBjdXJyZW50SW5kZW50TGV2ZWwgaXMgMFxuXG4gICAgcHJlY2VkaW5nUm93ID0gQGJ1ZmZlci5wcmV2aW91c05vbkJsYW5rUm93KGJ1ZmZlclJvdylcbiAgICByZXR1cm4gdW5sZXNzIHByZWNlZGluZ1Jvdz9cblxuICAgIHByZWNlZGluZ0xpbmUgPSBAYnVmZmVyLmxpbmVGb3JSb3cocHJlY2VkaW5nUm93KVxuICAgIGRlc2lyZWRJbmRlbnRMZXZlbCA9IEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocHJlY2VkaW5nUm93KVxuXG4gICAgaWYgaW5jcmVhc2VJbmRlbnRSZWdleCA9IEBpbmNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcbiAgICAgIGRlc2lyZWRJbmRlbnRMZXZlbCAtPSAxIHVubGVzcyBpbmNyZWFzZUluZGVudFJlZ2V4LnRlc3RTeW5jKHByZWNlZGluZ0xpbmUpXG5cbiAgICBpZiBkZWNyZWFzZU5leHRJbmRlbnRSZWdleCA9IEBkZWNyZWFzZU5leHRJbmRlbnRSZWdleEZvclNjb3BlRGVzY3JpcHRvcihzY29wZURlc2NyaXB0b3IpXG4gICAgICBkZXNpcmVkSW5kZW50TGV2ZWwgLT0gMSBpZiBkZWNyZWFzZU5leHRJbmRlbnRSZWdleC50ZXN0U3luYyhwcmVjZWRpbmdMaW5lKVxuXG4gICAgaWYgZGVzaXJlZEluZGVudExldmVsID49IDAgYW5kIGRlc2lyZWRJbmRlbnRMZXZlbCA8IGN1cnJlbnRJbmRlbnRMZXZlbFxuICAgICAgQGVkaXRvci5zZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhidWZmZXJSb3csIGRlc2lyZWRJbmRlbnRMZXZlbClcblxuICBjYWNoZVJlZ2V4OiAocGF0dGVybikgLT5cbiAgICBpZiBwYXR0ZXJuXG4gICAgICBAcmVnZXhlc0J5UGF0dGVybltwYXR0ZXJuXSA/PSBuZXcgT25pZ1JlZ0V4cChwYXR0ZXJuKVxuXG4gIGluY3JlYXNlSW5kZW50UmVnZXhGb3JTY29wZURlc2NyaXB0b3I6IChzY29wZURlc2NyaXB0b3IpIC0+XG4gICAgQGNhY2hlUmVnZXgoQGVkaXRvci5nZXRJbmNyZWFzZUluZGVudFBhdHRlcm4oc2NvcGVEZXNjcmlwdG9yKSlcblxuICBkZWNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yOiAoc2NvcGVEZXNjcmlwdG9yKSAtPlxuICAgIEBjYWNoZVJlZ2V4KEBlZGl0b3IuZ2V0RGVjcmVhc2VJbmRlbnRQYXR0ZXJuKHNjb3BlRGVzY3JpcHRvcikpXG5cbiAgZGVjcmVhc2VOZXh0SW5kZW50UmVnZXhGb3JTY29wZURlc2NyaXB0b3I6IChzY29wZURlc2NyaXB0b3IpIC0+XG4gICAgQGNhY2hlUmVnZXgoQGVkaXRvci5nZXREZWNyZWFzZU5leHRJbmRlbnRQYXR0ZXJuKHNjb3BlRGVzY3JpcHRvcikpXG5cbiAgZm9sZEVuZFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yOiAoc2NvcGVEZXNjcmlwdG9yKSAtPlxuICAgIEBjYWNoZVJlZ2V4KEBlZGl0b3IuZ2V0Rm9sZEVuZFBhdHRlcm4oc2NvcGVEZXNjcmlwdG9yKSlcbiJdfQ==
