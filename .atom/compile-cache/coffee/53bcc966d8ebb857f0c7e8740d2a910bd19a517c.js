(function() {
  var AllWhitespace, Paragraph, Range, SelectAParagraph, SelectAWholeWord, SelectAWord, SelectInsideBrackets, SelectInsideParagraph, SelectInsideQuotes, SelectInsideWholeWord, SelectInsideWord, TextObject, WholeWordRegex, mergeRanges,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Range = require('atom').Range;

  AllWhitespace = /^\s$/;

  WholeWordRegex = /\S+/;

  mergeRanges = require('./utils').mergeRanges;

  TextObject = (function() {
    function TextObject(editor, state) {
      this.editor = editor;
      this.state = state;
    }

    TextObject.prototype.isComplete = function() {
      return true;
    };

    TextObject.prototype.isRecordable = function() {
      return false;
    };

    TextObject.prototype.execute = function() {
      return this.select.apply(this, arguments);
    };

    return TextObject;

  })();

  SelectInsideWord = (function(superClass) {
    extend(SelectInsideWord, superClass);

    function SelectInsideWord() {
      return SelectInsideWord.__super__.constructor.apply(this, arguments);
    }

    SelectInsideWord.prototype.select = function() {
      var i, len, ref, selection;
      ref = this.editor.getSelections();
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        if (selection.isEmpty()) {
          selection.selectRight();
        }
        selection.expandOverWord();
      }
      return [true];
    };

    return SelectInsideWord;

  })(TextObject);

  SelectInsideWholeWord = (function(superClass) {
    extend(SelectInsideWholeWord, superClass);

    function SelectInsideWholeWord() {
      return SelectInsideWholeWord.__super__.constructor.apply(this, arguments);
    }

    SelectInsideWholeWord.prototype.select = function() {
      var i, len, range, ref, results, selection;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        range = selection.cursor.getCurrentWordBufferRange({
          wordRegex: WholeWordRegex
        });
        selection.setBufferRange(mergeRanges(selection.getBufferRange(), range));
        results.push(true);
      }
      return results;
    };

    return SelectInsideWholeWord;

  })(TextObject);

  SelectInsideQuotes = (function(superClass) {
    extend(SelectInsideQuotes, superClass);

    function SelectInsideQuotes(editor, char1, includeQuotes) {
      this.editor = editor;
      this.char = char1;
      this.includeQuotes = includeQuotes;
    }

    SelectInsideQuotes.prototype.findOpeningQuote = function(pos) {
      var line, start;
      start = pos.copy();
      pos = pos.copy();
      while (pos.row >= 0) {
        line = this.editor.lineTextForBufferRow(pos.row);
        if (pos.column === -1) {
          pos.column = line.length - 1;
        }
        while (pos.column >= 0) {
          if (line[pos.column] === this.char) {
            if (pos.column === 0 || line[pos.column - 1] !== '\\') {
              if (this.isStartQuote(pos)) {
                return pos;
              } else {
                return this.lookForwardOnLine(start);
              }
            }
          }
          --pos.column;
        }
        pos.column = -1;
        --pos.row;
      }
      return this.lookForwardOnLine(start);
    };

    SelectInsideQuotes.prototype.isStartQuote = function(end) {
      var line, numQuotes;
      line = this.editor.lineTextForBufferRow(end.row);
      numQuotes = line.substring(0, end.column + 1).replace("'" + this.char, '').split(this.char).length - 1;
      return numQuotes % 2;
    };

    SelectInsideQuotes.prototype.lookForwardOnLine = function(pos) {
      var index, line;
      line = this.editor.lineTextForBufferRow(pos.row);
      index = line.substring(pos.column).indexOf(this.char);
      if (index >= 0) {
        pos.column += index;
        return pos;
      }
      return null;
    };

    SelectInsideQuotes.prototype.findClosingQuote = function(start) {
      var end, endLine, escaping;
      end = start.copy();
      escaping = false;
      while (end.row < this.editor.getLineCount()) {
        endLine = this.editor.lineTextForBufferRow(end.row);
        while (end.column < endLine.length) {
          if (endLine[end.column] === '\\') {
            ++end.column;
          } else if (endLine[end.column] === this.char) {
            if (this.includeQuotes) {
              --start.column;
            }
            if (this.includeQuotes) {
              ++end.column;
            }
            return end;
          }
          ++end.column;
        }
        end.column = 0;
        ++end.row;
      }
    };

    SelectInsideQuotes.prototype.select = function() {
      var end, i, len, ref, results, selection, start;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        start = this.findOpeningQuote(selection.cursor.getBufferPosition());
        if (start != null) {
          ++start.column;
          end = this.findClosingQuote(start);
          if (end != null) {
            selection.setBufferRange(mergeRanges(selection.getBufferRange(), [start, end]));
          }
        }
        results.push(!selection.isEmpty());
      }
      return results;
    };

    return SelectInsideQuotes;

  })(TextObject);

  SelectInsideBrackets = (function(superClass) {
    extend(SelectInsideBrackets, superClass);

    function SelectInsideBrackets(editor, beginChar, endChar, includeBrackets) {
      this.editor = editor;
      this.beginChar = beginChar;
      this.endChar = endChar;
      this.includeBrackets = includeBrackets;
    }

    SelectInsideBrackets.prototype.findOpeningBracket = function(pos) {
      var depth, line;
      pos = pos.copy();
      depth = 0;
      while (pos.row >= 0) {
        line = this.editor.lineTextForBufferRow(pos.row);
        if (pos.column === -1) {
          pos.column = line.length - 1;
        }
        while (pos.column >= 0) {
          switch (line[pos.column]) {
            case this.endChar:
              ++depth;
              break;
            case this.beginChar:
              if (--depth < 0) {
                return pos;
              }
          }
          --pos.column;
        }
        pos.column = -1;
        --pos.row;
      }
    };

    SelectInsideBrackets.prototype.findClosingBracket = function(start) {
      var depth, end, endLine;
      end = start.copy();
      depth = 0;
      while (end.row < this.editor.getLineCount()) {
        endLine = this.editor.lineTextForBufferRow(end.row);
        while (end.column < endLine.length) {
          switch (endLine[end.column]) {
            case this.beginChar:
              ++depth;
              break;
            case this.endChar:
              if (--depth < 0) {
                if (this.includeBrackets) {
                  --start.column;
                }
                if (this.includeBrackets) {
                  ++end.column;
                }
                return end;
              }
          }
          ++end.column;
        }
        end.column = 0;
        ++end.row;
      }
    };

    SelectInsideBrackets.prototype.select = function() {
      var end, i, len, ref, results, selection, start;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        start = this.findOpeningBracket(selection.cursor.getBufferPosition());
        if (start != null) {
          ++start.column;
          end = this.findClosingBracket(start);
          if (end != null) {
            selection.setBufferRange(mergeRanges(selection.getBufferRange(), [start, end]));
          }
        }
        results.push(!selection.isEmpty());
      }
      return results;
    };

    return SelectInsideBrackets;

  })(TextObject);

  SelectAWord = (function(superClass) {
    extend(SelectAWord, superClass);

    function SelectAWord() {
      return SelectAWord.__super__.constructor.apply(this, arguments);
    }

    SelectAWord.prototype.select = function() {
      var char, endPoint, i, len, ref, results, selection;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        if (selection.isEmpty()) {
          selection.selectRight();
        }
        selection.expandOverWord();
        while (true) {
          endPoint = selection.getBufferRange().end;
          char = this.editor.getTextInRange(Range.fromPointWithDelta(endPoint, 0, 1));
          if (!AllWhitespace.test(char)) {
            break;
          }
          selection.selectRight();
        }
        results.push(true);
      }
      return results;
    };

    return SelectAWord;

  })(TextObject);

  SelectAWholeWord = (function(superClass) {
    extend(SelectAWholeWord, superClass);

    function SelectAWholeWord() {
      return SelectAWholeWord.__super__.constructor.apply(this, arguments);
    }

    SelectAWholeWord.prototype.select = function() {
      var char, endPoint, i, len, range, ref, results, selection;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        range = selection.cursor.getCurrentWordBufferRange({
          wordRegex: WholeWordRegex
        });
        selection.setBufferRange(mergeRanges(selection.getBufferRange(), range));
        while (true) {
          endPoint = selection.getBufferRange().end;
          char = this.editor.getTextInRange(Range.fromPointWithDelta(endPoint, 0, 1));
          if (!AllWhitespace.test(char)) {
            break;
          }
          selection.selectRight();
        }
        results.push(true);
      }
      return results;
    };

    return SelectAWholeWord;

  })(TextObject);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.prototype.select = function() {
      var i, len, ref, results, selection;
      ref = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        selection = ref[i];
        results.push(this.selectParagraph(selection));
      }
      return results;
    };

    Paragraph.prototype.paragraphDelimitedRange = function(startPoint) {
      var inParagraph, lowerRow, upperRow;
      inParagraph = this.isParagraphLine(this.editor.lineTextForBufferRow(startPoint.row));
      upperRow = this.searchLines(startPoint.row, -1, inParagraph);
      lowerRow = this.searchLines(startPoint.row, this.editor.getLineCount(), inParagraph);
      return new Range([upperRow + 1, 0], [lowerRow, 0]);
    };

    Paragraph.prototype.searchLines = function(startRow, rowLimit, startedInParagraph) {
      var currentRow, i, line, ref, ref1;
      for (currentRow = i = ref = startRow, ref1 = rowLimit; ref <= ref1 ? i <= ref1 : i >= ref1; currentRow = ref <= ref1 ? ++i : --i) {
        line = this.editor.lineTextForBufferRow(currentRow);
        if (startedInParagraph !== this.isParagraphLine(line)) {
          return currentRow;
        }
      }
      return rowLimit;
    };

    Paragraph.prototype.isParagraphLine = function(line) {
      return /\S/.test(line);
    };

    return Paragraph;

  })(TextObject);

  SelectInsideParagraph = (function(superClass) {
    extend(SelectInsideParagraph, superClass);

    function SelectInsideParagraph() {
      return SelectInsideParagraph.__super__.constructor.apply(this, arguments);
    }

    SelectInsideParagraph.prototype.selectParagraph = function(selection) {
      var newRange, oldRange, startPoint;
      oldRange = selection.getBufferRange();
      startPoint = selection.cursor.getBufferPosition();
      newRange = this.paragraphDelimitedRange(startPoint);
      selection.setBufferRange(mergeRanges(oldRange, newRange));
      return true;
    };

    return SelectInsideParagraph;

  })(Paragraph);

  SelectAParagraph = (function(superClass) {
    extend(SelectAParagraph, superClass);

    function SelectAParagraph() {
      return SelectAParagraph.__super__.constructor.apply(this, arguments);
    }

    SelectAParagraph.prototype.selectParagraph = function(selection) {
      var newRange, nextRange, oldRange, startPoint;
      oldRange = selection.getBufferRange();
      startPoint = selection.cursor.getBufferPosition();
      newRange = this.paragraphDelimitedRange(startPoint);
      nextRange = this.paragraphDelimitedRange(newRange.end);
      selection.setBufferRange(mergeRanges(oldRange, [newRange.start, nextRange.end]));
      return true;
    };

    return SelectAParagraph;

  })(Paragraph);

  module.exports = {
    TextObject: TextObject,
    SelectInsideWord: SelectInsideWord,
    SelectInsideWholeWord: SelectInsideWholeWord,
    SelectInsideQuotes: SelectInsideQuotes,
    SelectInsideBrackets: SelectInsideBrackets,
    SelectAWord: SelectAWord,
    SelectAWholeWord: SelectAWholeWord,
    SelectInsideParagraph: SelectInsideParagraph,
    SelectAParagraph: SelectAParagraph
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdGV4dC1vYmplY3RzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsbU9BQUE7SUFBQTs7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixhQUFBLEdBQWdCOztFQUNoQixjQUFBLEdBQWlCOztFQUNoQixjQUFlLE9BQUEsQ0FBUSxTQUFSOztFQUVWO0lBQ1Msb0JBQUMsTUFBRCxFQUFVLEtBQVY7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxRQUFEO0lBQVY7O3lCQUViLFVBQUEsR0FBWSxTQUFBO2FBQUc7SUFBSDs7eUJBQ1osWUFBQSxHQUFjLFNBQUE7YUFBRztJQUFIOzt5QkFFZCxPQUFBLEdBQVMsU0FBQTthQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLElBQWQsRUFBb0IsU0FBcEI7SUFBSDs7Ozs7O0VBRUw7Ozs7Ozs7K0JBQ0osTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUNFLElBQUcsU0FBUyxDQUFDLE9BQVYsQ0FBQSxDQUFIO1VBQ0UsU0FBUyxDQUFDLFdBQVYsQ0FBQSxFQURGOztRQUVBLFNBQVMsQ0FBQyxjQUFWLENBQUE7QUFIRjthQUlBLENBQUMsSUFBRDtJQUxNOzs7O0tBRHFCOztFQVF6Qjs7Ozs7OztvQ0FDSixNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7QUFBQTtBQUFBO1dBQUEscUNBQUE7O1FBQ0UsS0FBQSxHQUFRLFNBQVMsQ0FBQyxNQUFNLENBQUMseUJBQWpCLENBQTJDO1VBQUMsU0FBQSxFQUFXLGNBQVo7U0FBM0M7UUFDUixTQUFTLENBQUMsY0FBVixDQUF5QixXQUFBLENBQVksU0FBUyxDQUFDLGNBQVYsQ0FBQSxDQUFaLEVBQXdDLEtBQXhDLENBQXpCO3FCQUNBO0FBSEY7O0lB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QUE7TUFDYixRQUFBLEdBQVcsSUFBQyxDQUFBLHVCQUFELENBQXlCLFVBQXpCO01BQ1gsU0FBQSxHQUFZLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixRQUFRLENBQUMsR0FBbEM7TUFDWixTQUFTLENBQUMsY0FBVixDQUF5QixXQUFBLENBQVksUUFBWixFQUFzQixDQUFDLFFBQVEsQ0FBQyxLQUFWLEVBQWlCLFNBQVMsQ0FBQyxHQUEzQixDQUF0QixDQUF6QjthQUNBO0lBTmU7Ozs7S0FEWTs7RUFTL0IsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBQyxZQUFBLFVBQUQ7SUFBYSxrQkFBQSxnQkFBYjtJQUErQix1QkFBQSxxQkFBL0I7SUFBc0Qsb0JBQUEsa0JBQXREO0lBQ2Ysc0JBQUEsb0JBRGU7SUFDTyxhQUFBLFdBRFA7SUFDb0Isa0JBQUEsZ0JBRHBCO0lBQ3NDLHVCQUFBLHFCQUR0QztJQUM2RCxrQkFBQSxnQkFEN0Q7O0FBak5qQiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuQWxsV2hpdGVzcGFjZSA9IC9eXFxzJC9cbldob2xlV29yZFJlZ2V4ID0gL1xcUysvXG57bWVyZ2VSYW5nZXN9ID0gcmVxdWlyZSAnLi91dGlscydcblxuY2xhc3MgVGV4dE9iamVjdFxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEBzdGF0ZSkgLT5cblxuICBpc0NvbXBsZXRlOiAtPiB0cnVlXG4gIGlzUmVjb3JkYWJsZTogLT4gZmFsc2VcblxuICBleGVjdXRlOiAtPiBAc2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuY2xhc3MgU2VsZWN0SW5zaWRlV29yZCBleHRlbmRzIFRleHRPYmplY3RcbiAgc2VsZWN0OiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgIHNlbGVjdGlvbi5leHBhbmRPdmVyV29yZCgpXG4gICAgW3RydWVdXG5cbmNsYXNzIFNlbGVjdEluc2lkZVdob2xlV29yZCBleHRlbmRzIFRleHRPYmplY3RcbiAgc2VsZWN0OiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmN1cnNvci5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKHt3b3JkUmVnZXg6IFdob2xlV29yZFJlZ2V4fSlcbiAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShtZXJnZVJhbmdlcyhzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSwgcmFuZ2UpKVxuICAgICAgdHJ1ZVxuXG4jIFNlbGVjdEluc2lkZVF1b3RlcyBhbmQgdGhlIG5leHQgY2xhc3MgZGVmaW5lZCAoU2VsZWN0SW5zaWRlQnJhY2tldHMpIGFyZVxuIyBhbG1vc3QtYnV0LW5vdC1xdWl0ZS1yZXBlYXRlZCBjb2RlLiBUaGV5IGFyZSBkaWZmZXJlbnQgYmVjYXVzZSBvZiB0aGUgZGVwdGhcbiMgY2hlY2tzIGluIHRoZSBicmFja2V0IG1hdGNoZXIuXG5cbmNsYXNzIFNlbGVjdEluc2lkZVF1b3RlcyBleHRlbmRzIFRleHRPYmplY3RcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAY2hhciwgQGluY2x1ZGVRdW90ZXMpIC0+XG5cbiAgZmluZE9wZW5pbmdRdW90ZTogKHBvcykgLT5cbiAgICBzdGFydCA9IHBvcy5jb3B5KClcbiAgICBwb3MgPSBwb3MuY29weSgpXG4gICAgd2hpbGUgcG9zLnJvdyA+PSAwXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb3Mucm93KVxuICAgICAgcG9zLmNvbHVtbiA9IGxpbmUubGVuZ3RoIC0gMSBpZiBwb3MuY29sdW1uIGlzIC0xXG4gICAgICB3aGlsZSBwb3MuY29sdW1uID49IDBcbiAgICAgICAgaWYgbGluZVtwb3MuY29sdW1uXSBpcyBAY2hhclxuICAgICAgICAgIGlmIHBvcy5jb2x1bW4gaXMgMCBvciBsaW5lW3Bvcy5jb2x1bW4gLSAxXSBpc250ICdcXFxcJ1xuICAgICAgICAgICAgaWYgQGlzU3RhcnRRdW90ZShwb3MpXG4gICAgICAgICAgICAgIHJldHVybiBwb3NcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgcmV0dXJuIEBsb29rRm9yd2FyZE9uTGluZShzdGFydClcbiAgICAgICAgLS0gcG9zLmNvbHVtblxuICAgICAgcG9zLmNvbHVtbiA9IC0xXG4gICAgICAtLSBwb3Mucm93XG4gICAgQGxvb2tGb3J3YXJkT25MaW5lKHN0YXJ0KVxuXG4gIGlzU3RhcnRRdW90ZTogKGVuZCkgLT5cbiAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhlbmQucm93KVxuICAgIG51bVF1b3RlcyA9IGxpbmUuc3Vic3RyaW5nKDAsIGVuZC5jb2x1bW4gKyAxKS5yZXBsYWNlKCBcIicje0BjaGFyfVwiLCAnJykuc3BsaXQoQGNoYXIpLmxlbmd0aCAtIDFcbiAgICBudW1RdW90ZXMgJSAyXG5cbiAgbG9va0ZvcndhcmRPbkxpbmU6IChwb3MpIC0+XG4gICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocG9zLnJvdylcblxuICAgIGluZGV4ID0gbGluZS5zdWJzdHJpbmcocG9zLmNvbHVtbikuaW5kZXhPZihAY2hhcilcbiAgICBpZiBpbmRleCA+PSAwXG4gICAgICBwb3MuY29sdW1uICs9IGluZGV4XG4gICAgICByZXR1cm4gcG9zXG4gICAgbnVsbFxuXG4gIGZpbmRDbG9zaW5nUXVvdGU6IChzdGFydCkgLT5cbiAgICBlbmQgPSBzdGFydC5jb3B5KClcbiAgICBlc2NhcGluZyA9IGZhbHNlXG5cbiAgICB3aGlsZSBlbmQucm93IDwgQGVkaXRvci5nZXRMaW5lQ291bnQoKVxuICAgICAgZW5kTGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coZW5kLnJvdylcbiAgICAgIHdoaWxlIGVuZC5jb2x1bW4gPCBlbmRMaW5lLmxlbmd0aFxuICAgICAgICBpZiBlbmRMaW5lW2VuZC5jb2x1bW5dIGlzICdcXFxcJ1xuICAgICAgICAgICsrIGVuZC5jb2x1bW5cbiAgICAgICAgZWxzZSBpZiBlbmRMaW5lW2VuZC5jb2x1bW5dIGlzIEBjaGFyXG4gICAgICAgICAgLS0gc3RhcnQuY29sdW1uIGlmIEBpbmNsdWRlUXVvdGVzXG4gICAgICAgICAgKysgZW5kLmNvbHVtbiBpZiBAaW5jbHVkZVF1b3Rlc1xuICAgICAgICAgIHJldHVybiBlbmRcbiAgICAgICAgKysgZW5kLmNvbHVtblxuICAgICAgZW5kLmNvbHVtbiA9IDBcbiAgICAgICsrIGVuZC5yb3dcbiAgICByZXR1cm5cblxuICBzZWxlY3Q6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgc3RhcnQgPSBAZmluZE9wZW5pbmdRdW90ZShzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBpZiBzdGFydD9cbiAgICAgICAgKysgc3RhcnQuY29sdW1uICMgc2tpcCB0aGUgb3BlbmluZyBxdW90ZVxuICAgICAgICBlbmQgPSBAZmluZENsb3NpbmdRdW90ZShzdGFydClcbiAgICAgICAgaWYgZW5kP1xuICAgICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShtZXJnZVJhbmdlcyhzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSwgW3N0YXJ0LCBlbmRdKSlcbiAgICAgIG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiMgU2VsZWN0SW5zaWRlQnJhY2tldHMgYW5kIHRoZSBwcmV2aW91cyBjbGFzcyBkZWZpbmVkIChTZWxlY3RJbnNpZGVRdW90ZXMpIGFyZVxuIyBhbG1vc3QtYnV0LW5vdC1xdWl0ZS1yZXBlYXRlZCBjb2RlLiBUaGV5IGFyZSBkaWZmZXJlbnQgYmVjYXVzZSBvZiB0aGUgZGVwdGhcbiMgY2hlY2tzIGluIHRoZSBicmFja2V0IG1hdGNoZXIuXG5cbmNsYXNzIFNlbGVjdEluc2lkZUJyYWNrZXRzIGV4dGVuZHMgVGV4dE9iamVjdFxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEBiZWdpbkNoYXIsIEBlbmRDaGFyLCBAaW5jbHVkZUJyYWNrZXRzKSAtPlxuXG4gIGZpbmRPcGVuaW5nQnJhY2tldDogKHBvcykgLT5cbiAgICBwb3MgPSBwb3MuY29weSgpXG4gICAgZGVwdGggPSAwXG4gICAgd2hpbGUgcG9zLnJvdyA+PSAwXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb3Mucm93KVxuICAgICAgcG9zLmNvbHVtbiA9IGxpbmUubGVuZ3RoIC0gMSBpZiBwb3MuY29sdW1uIGlzIC0xXG4gICAgICB3aGlsZSBwb3MuY29sdW1uID49IDBcbiAgICAgICAgc3dpdGNoIGxpbmVbcG9zLmNvbHVtbl1cbiAgICAgICAgICB3aGVuIEBlbmRDaGFyIHRoZW4gKysgZGVwdGhcbiAgICAgICAgICB3aGVuIEBiZWdpbkNoYXJcbiAgICAgICAgICAgIHJldHVybiBwb3MgaWYgLS0gZGVwdGggPCAwXG4gICAgICAgIC0tIHBvcy5jb2x1bW5cbiAgICAgIHBvcy5jb2x1bW4gPSAtMVxuICAgICAgLS0gcG9zLnJvd1xuXG4gIGZpbmRDbG9zaW5nQnJhY2tldDogKHN0YXJ0KSAtPlxuICAgIGVuZCA9IHN0YXJ0LmNvcHkoKVxuICAgIGRlcHRoID0gMFxuICAgIHdoaWxlIGVuZC5yb3cgPCBAZWRpdG9yLmdldExpbmVDb3VudCgpXG4gICAgICBlbmRMaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhlbmQucm93KVxuICAgICAgd2hpbGUgZW5kLmNvbHVtbiA8IGVuZExpbmUubGVuZ3RoXG4gICAgICAgIHN3aXRjaCBlbmRMaW5lW2VuZC5jb2x1bW5dXG4gICAgICAgICAgd2hlbiBAYmVnaW5DaGFyIHRoZW4gKysgZGVwdGhcbiAgICAgICAgICB3aGVuIEBlbmRDaGFyXG4gICAgICAgICAgICBpZiAtLSBkZXB0aCA8IDBcbiAgICAgICAgICAgICAgLS0gc3RhcnQuY29sdW1uIGlmIEBpbmNsdWRlQnJhY2tldHNcbiAgICAgICAgICAgICAgKysgZW5kLmNvbHVtbiBpZiBAaW5jbHVkZUJyYWNrZXRzXG4gICAgICAgICAgICAgIHJldHVybiBlbmRcbiAgICAgICAgKysgZW5kLmNvbHVtblxuICAgICAgZW5kLmNvbHVtbiA9IDBcbiAgICAgICsrIGVuZC5yb3dcbiAgICByZXR1cm5cblxuICBzZWxlY3Q6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgc3RhcnQgPSBAZmluZE9wZW5pbmdCcmFja2V0KHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIGlmIHN0YXJ0P1xuICAgICAgICArKyBzdGFydC5jb2x1bW4gIyBza2lwIHRoZSBvcGVuaW5nIHF1b3RlXG4gICAgICAgIGVuZCA9IEBmaW5kQ2xvc2luZ0JyYWNrZXQoc3RhcnQpXG4gICAgICAgIGlmIGVuZD9cbiAgICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UobWVyZ2VSYW5nZXMoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCksIFtzdGFydCwgZW5kXSkpXG4gICAgICBub3Qgc2VsZWN0aW9uLmlzRW1wdHkoKVxuXG5jbGFzcyBTZWxlY3RBV29yZCBleHRlbmRzIFRleHRPYmplY3RcbiAgc2VsZWN0OiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgIHNlbGVjdGlvbi5leHBhbmRPdmVyV29yZCgpXG4gICAgICBsb29wXG4gICAgICAgIGVuZFBvaW50ID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG4gICAgICAgIGNoYXIgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShlbmRQb2ludCwgMCwgMSkpXG4gICAgICAgIGJyZWFrIHVubGVzcyBBbGxXaGl0ZXNwYWNlLnRlc3QoY2hhcilcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgIHRydWVcblxuY2xhc3MgU2VsZWN0QVdob2xlV29yZCBleHRlbmRzIFRleHRPYmplY3RcbiAgc2VsZWN0OiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmN1cnNvci5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKHt3b3JkUmVnZXg6IFdob2xlV29yZFJlZ2V4fSlcbiAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShtZXJnZVJhbmdlcyhzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSwgcmFuZ2UpKVxuICAgICAgbG9vcFxuICAgICAgICBlbmRQb2ludCA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmVuZFxuICAgICAgICBjaGFyID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoZW5kUG9pbnQsIDAsIDEpKVxuICAgICAgICBicmVhayB1bmxlc3MgQWxsV2hpdGVzcGFjZS50ZXN0KGNoYXIpXG4gICAgICAgIHNlbGVjdGlvbi5zZWxlY3RSaWdodCgpXG4gICAgICB0cnVlXG5cbmNsYXNzIFBhcmFncmFwaCBleHRlbmRzIFRleHRPYmplY3RcblxuICBzZWxlY3Q6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgQHNlbGVjdFBhcmFncmFwaChzZWxlY3Rpb24pXG5cbiAgIyBSZXR1cm4gYSByYW5nZSBkZWxpbXRlZCBieSB0aGUgc3RhcnQgb3IgdGhlIGVuZCBvZiBhIHBhcmFncmFwaFxuICBwYXJhZ3JhcGhEZWxpbWl0ZWRSYW5nZTogKHN0YXJ0UG9pbnQpIC0+XG4gICAgaW5QYXJhZ3JhcGggPSBAaXNQYXJhZ3JhcGhMaW5lKEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coc3RhcnRQb2ludC5yb3cpKVxuICAgIHVwcGVyUm93ID0gQHNlYXJjaExpbmVzKHN0YXJ0UG9pbnQucm93LCAtMSwgaW5QYXJhZ3JhcGgpXG4gICAgbG93ZXJSb3cgPSBAc2VhcmNoTGluZXMoc3RhcnRQb2ludC5yb3csIEBlZGl0b3IuZ2V0TGluZUNvdW50KCksIGluUGFyYWdyYXBoKVxuICAgIG5ldyBSYW5nZShbdXBwZXJSb3cgKyAxLCAwXSwgW2xvd2VyUm93LCAwXSlcblxuICBzZWFyY2hMaW5lczogKHN0YXJ0Um93LCByb3dMaW1pdCwgc3RhcnRlZEluUGFyYWdyYXBoKSAtPlxuICAgIGZvciBjdXJyZW50Um93IGluIFtzdGFydFJvdy4ucm93TGltaXRdXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhjdXJyZW50Um93KVxuICAgICAgaWYgc3RhcnRlZEluUGFyYWdyYXBoIGlzbnQgQGlzUGFyYWdyYXBoTGluZShsaW5lKVxuICAgICAgICByZXR1cm4gY3VycmVudFJvd1xuICAgIHJvd0xpbWl0XG5cbiAgaXNQYXJhZ3JhcGhMaW5lOiAobGluZSkgLT4gKC9cXFMvLnRlc3QobGluZSkpXG5cbmNsYXNzIFNlbGVjdEluc2lkZVBhcmFncmFwaCBleHRlbmRzIFBhcmFncmFwaFxuICBzZWxlY3RQYXJhZ3JhcGg6IChzZWxlY3Rpb24pIC0+XG4gICAgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIHN0YXJ0UG9pbnQgPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBuZXdSYW5nZSA9IEBwYXJhZ3JhcGhEZWxpbWl0ZWRSYW5nZShzdGFydFBvaW50KVxuICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShtZXJnZVJhbmdlcyhvbGRSYW5nZSwgbmV3UmFuZ2UpKVxuICAgIHRydWVcblxuY2xhc3MgU2VsZWN0QVBhcmFncmFwaCBleHRlbmRzIFBhcmFncmFwaFxuICBzZWxlY3RQYXJhZ3JhcGg6IChzZWxlY3Rpb24pIC0+XG4gICAgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIHN0YXJ0UG9pbnQgPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBuZXdSYW5nZSA9IEBwYXJhZ3JhcGhEZWxpbWl0ZWRSYW5nZShzdGFydFBvaW50KVxuICAgIG5leHRSYW5nZSA9IEBwYXJhZ3JhcGhEZWxpbWl0ZWRSYW5nZShuZXdSYW5nZS5lbmQpXG4gICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKG1lcmdlUmFuZ2VzKG9sZFJhbmdlLCBbbmV3UmFuZ2Uuc3RhcnQsIG5leHRSYW5nZS5lbmRdKSlcbiAgICB0cnVlXG5cbm1vZHVsZS5leHBvcnRzID0ge1RleHRPYmplY3QsIFNlbGVjdEluc2lkZVdvcmQsIFNlbGVjdEluc2lkZVdob2xlV29yZCwgU2VsZWN0SW5zaWRlUXVvdGVzLFxuICBTZWxlY3RJbnNpZGVCcmFja2V0cywgU2VsZWN0QVdvcmQsIFNlbGVjdEFXaG9sZVdvcmQsIFNlbGVjdEluc2lkZVBhcmFncmFwaCwgU2VsZWN0QVBhcmFncmFwaH1cbiJdfQ==
