(function() {
  var BracketMatcher, CompositeDisposable, SelectorCache, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  SelectorCache = require('./selector-cache');

  module.exports = BracketMatcher = (function() {
    BracketMatcher.prototype.pairsToIndent = {
      '(': ')',
      '[': ']',
      '{': '}'
    };

    BracketMatcher.prototype.defaultPairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    BracketMatcher.prototype.smartQuotePairs = {
      "“": "”",
      '‘': '’',
      "«": "»",
      "‹": "›"
    };

    BracketMatcher.prototype.toggleQuotes = function(includeSmartQuotes) {
      if (includeSmartQuotes) {
        return this.pairedCharacters = _.extend({}, this.defaultPairs, this.smartQuotePairs);
      } else {
        return this.pairedCharacters = this.defaultPairs;
      }
    };

    function BracketMatcher(editor, editorElement) {
      this.editor = editor;
      this.backspace = bind(this.backspace, this);
      this.insertNewline = bind(this.insertNewline, this);
      this.insertText = bind(this.insertText, this);
      this.subscriptions = new CompositeDisposable;
      this.bracketMarkers = [];
      _.adviseBefore(this.editor, 'insertText', this.insertText);
      _.adviseBefore(this.editor, 'insertNewline', this.insertNewline);
      _.adviseBefore(this.editor, 'backspace', this.backspace);
      this.subscriptions.add(atom.commands.add(editorElement, 'bracket-matcher:remove-brackets-from-selection', (function(_this) {
        return function(event) {
          if (!_this.removeBrackets()) {
            return event.abortKeyBinding();
          }
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          return _this.unsubscribe();
        };
      })(this)));
    }

    BracketMatcher.prototype.insertText = function(text, options) {
      var autoCompleteOpeningBracket, bracketMarker, cursorBufferPosition, hasEscapeSequenceBeforeCursor, hasQuoteBeforeCursor, hasWordAfterCursor, hasWordBeforeCursor, nextCharacter, pair, previousCharacter, previousCharacters, range, ref, skipOverExistingClosingBracket;
      if (!text) {
        return true;
      }
      if ((options != null ? options.select : void 0) || (options != null ? options.undo : void 0) === 'skip') {
        return true;
      }
      this.toggleQuotes(this.getScopedSetting('bracket-matcher.autocompleteSmartQuotes'));
      if (this.wrapSelectionInBrackets(text)) {
        return false;
      }
      if (this.editor.hasMultipleCursors()) {
        return true;
      }
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      previousCharacters = this.editor.getTextInBufferRange([cursorBufferPosition.traverse([0, -2]), cursorBufferPosition]);
      nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])]);
      previousCharacter = previousCharacters.slice(-1);
      hasWordAfterCursor = /\w/.test(nextCharacter);
      hasWordBeforeCursor = /\w/.test(previousCharacter);
      hasQuoteBeforeCursor = previousCharacter === text[0];
      hasEscapeSequenceBeforeCursor = ((ref = previousCharacters.match(/\\/g)) != null ? ref.length : void 0) >= 1;
      if (text === '#' && this.isCursorOnInterpolatedString()) {
        autoCompleteOpeningBracket = this.getScopedSetting('bracket-matcher.autocompleteBrackets') && !hasEscapeSequenceBeforeCursor;
        text += '{';
        pair = '}';
      } else {
        autoCompleteOpeningBracket = this.getScopedSetting('bracket-matcher.autocompleteBrackets') && this.isOpeningBracket(text) && !hasWordAfterCursor && !(this.isQuote(text) && (hasWordBeforeCursor || hasQuoteBeforeCursor)) && !hasEscapeSequenceBeforeCursor;
        pair = this.pairedCharacters[text];
      }
      skipOverExistingClosingBracket = false;
      if (this.isClosingBracket(text) && nextCharacter === text && !hasEscapeSequenceBeforeCursor) {
        if (bracketMarker = _.find(this.bracketMarkers, function(marker) {
          return marker.isValid() && marker.getBufferRange().end.isEqual(cursorBufferPosition);
        })) {
          skipOverExistingClosingBracket = true;
        }
      }
      if (skipOverExistingClosingBracket) {
        bracketMarker.destroy();
        _.remove(this.bracketMarkers, bracketMarker);
        this.editor.moveRight();
        return false;
      } else if (autoCompleteOpeningBracket) {
        this.editor.insertText(text + pair);
        this.editor.moveLeft();
        range = [cursorBufferPosition, cursorBufferPosition.traverse([0, text.length])];
        this.bracketMarkers.push(this.editor.markBufferRange(range));
        return false;
      }
    };

    BracketMatcher.prototype.insertNewline = function() {
      var cursorBufferPosition, hasEscapeSequenceBeforeCursor, nextCharacter, previousCharacter, previousCharacters, ref;
      if (this.editor.hasMultipleCursors()) {
        return;
      }
      if (!this.editor.getLastSelection().isEmpty()) {
        return;
      }
      this.toggleQuotes(this.getScopedSetting('bracket-matcher.autocompleteSmartQuotes'));
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      previousCharacters = this.editor.getTextInBufferRange([cursorBufferPosition.traverse([0, -2]), cursorBufferPosition]);
      nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])]);
      previousCharacter = previousCharacters.slice(-1);
      hasEscapeSequenceBeforeCursor = ((ref = previousCharacters.match(/\\/g)) != null ? ref.length : void 0) >= 1;
      if (this.pairsToIndent[previousCharacter] === nextCharacter && !hasEscapeSequenceBeforeCursor) {
        this.editor.transact((function(_this) {
          return function() {
            var cursorRow;
            _this.editor.insertText("\n\n");
            _this.editor.moveUp();
            if (_this.getScopedSetting('editor.autoIndent')) {
              cursorRow = _this.editor.getCursorBufferPosition().row;
              return _this.editor.autoIndentBufferRows(cursorRow, cursorRow + 1);
            }
          };
        })(this));
        return false;
      }
    };

    BracketMatcher.prototype.backspace = function() {
      var cursorBufferPosition, hasEscapeSequenceBeforeCursor, nextCharacter, previousCharacter, previousCharacters, ref;
      if (this.editor.hasMultipleCursors()) {
        return;
      }
      if (!this.editor.getLastSelection().isEmpty()) {
        return;
      }
      this.toggleQuotes(this.getScopedSetting('bracket-matcher.autocompleteSmartQuotes'));
      cursorBufferPosition = this.editor.getCursorBufferPosition();
      previousCharacters = this.editor.getTextInBufferRange([cursorBufferPosition.traverse([0, -2]), cursorBufferPosition]);
      nextCharacter = this.editor.getTextInBufferRange([cursorBufferPosition, cursorBufferPosition.traverse([0, 1])]);
      previousCharacter = previousCharacters.slice(-1);
      hasEscapeSequenceBeforeCursor = ((ref = previousCharacters.match(/\\/g)) != null ? ref.length : void 0) >= 1;
      if ((this.pairedCharacters[previousCharacter] === nextCharacter) && !hasEscapeSequenceBeforeCursor && this.getScopedSetting('bracket-matcher.autocompleteBrackets')) {
        this.editor.transact((function(_this) {
          return function() {
            _this.editor.moveLeft();
            _this.editor["delete"]();
            return _this.editor["delete"]();
          };
        })(this));
        return false;
      }
    };

    BracketMatcher.prototype.removeBrackets = function() {
      var bracketsRemoved;
      bracketsRemoved = false;
      this.toggleQuotes(this.getScopedSetting('bracket-matcher.autocompleteSmartQuotes'));
      this.editor.mutateSelectedText((function(_this) {
        return function(selection) {
          var options, range, selectionEnd, selectionStart, text;
          if (!_this.selectionIsWrappedByMatchingBrackets(selection)) {
            return;
          }
          range = selection.getBufferRange();
          options = {
            reversed: selection.isReversed()
          };
          selectionStart = range.start;
          if (range.start.row === range.end.row) {
            selectionEnd = range.end.traverse([0, -2]);
          } else {
            selectionEnd = range.end.traverse([0, -1]);
          }
          text = selection.getText();
          selection.insertText(text.substring(1, text.length - 1));
          selection.setBufferRange([selectionStart, selectionEnd], options);
          return bracketsRemoved = true;
        };
      })(this));
      return bracketsRemoved;
    };

    BracketMatcher.prototype.wrapSelectionInBrackets = function(bracket) {
      var pair, selectionWrapped;
      if (!this.getScopedSetting('bracket-matcher.wrapSelectionsInBrackets')) {
        return false;
      }
      if (bracket === '#') {
        if (!this.isCursorOnInterpolatedString()) {
          return false;
        }
        bracket = '#{';
        pair = '}';
      } else {
        if (!this.isOpeningBracket(bracket)) {
          return false;
        }
        pair = this.pairedCharacters[bracket];
      }
      selectionWrapped = false;
      this.editor.mutateSelectedText(function(selection) {
        var options, range, selectionEnd, selectionStart;
        if (selection.isEmpty()) {
          return;
        }
        if (bracket === '#{' && !selection.getBufferRange().isSingleLine()) {
          return;
        }
        selectionWrapped = true;
        range = selection.getBufferRange();
        options = {
          reversed: selection.isReversed()
        };
        selection.insertText("" + bracket + (selection.getText()) + pair);
        selectionStart = range.start.traverse([0, bracket.length]);
        if (range.start.row === range.end.row) {
          selectionEnd = range.end.traverse([0, bracket.length]);
        } else {
          selectionEnd = range.end;
        }
        return selection.setBufferRange([selectionStart, selectionEnd], options);
      });
      return selectionWrapped;
    };

    BracketMatcher.prototype.isQuote = function(string) {
      return /['"`]/.test(string);
    };

    BracketMatcher.prototype.isCursorOnInterpolatedString = function() {
      var segments;
      if (this.interpolatedStringSelector == null) {
        segments = ['*.*.*.interpolated.ruby', 'string.interpolated.ruby', 'string.regexp.interpolated.ruby', 'string.quoted.double.coffee', 'string.unquoted.heredoc.ruby', 'string.quoted.double.livescript', 'string.quoted.double.heredoc.livescript', 'string.quoted.double.elixir', 'string.quoted.double.heredoc.elixir', 'comment.documentation.heredoc.elixir'];
        this.interpolatedStringSelector = SelectorCache.get(segments.join(' | '));
      }
      return this.interpolatedStringSelector.matches(this.editor.getLastCursor().getScopeDescriptor().getScopesArray());
    };

    BracketMatcher.prototype.getInvertedPairedCharacters = function() {
      var close, open, ref;
      if (this.invertedPairedCharacters) {
        return this.invertedPairedCharacters;
      }
      this.invertedPairedCharacters = {};
      ref = this.pairedCharacters;
      for (open in ref) {
        close = ref[open];
        this.invertedPairedCharacters[close] = open;
      }
      return this.invertedPairedCharacters;
    };

    BracketMatcher.prototype.isOpeningBracket = function(string) {
      return this.pairedCharacters.hasOwnProperty(string);
    };

    BracketMatcher.prototype.isClosingBracket = function(string) {
      return this.getInvertedPairedCharacters().hasOwnProperty(string);
    };

    BracketMatcher.prototype.selectionIsWrappedByMatchingBrackets = function(selection) {
      var firstCharacter, lastCharacter, selectedText;
      if (selection.isEmpty()) {
        return false;
      }
      selectedText = selection.getText();
      firstCharacter = selectedText[0];
      lastCharacter = selectedText[selectedText.length - 1];
      return this.pairedCharacters[firstCharacter] === lastCharacter;
    };

    BracketMatcher.prototype.unsubscribe = function() {
      return this.subscriptions.dispose();
    };

    BracketMatcher.prototype.getScopedSetting = function(key) {
      return atom.config.get(key, {
        scope: this.editor.getLastCursor().getScopeDescriptor()
      });
    };

    return BracketMatcher;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9icmFja2V0LW1hdGNoZXIvbGliL2JyYWNrZXQtbWF0Y2hlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFEQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNNOzZCQUNKLGFBQUEsR0FDRTtNQUFBLEdBQUEsRUFBSyxHQUFMO01BQ0EsR0FBQSxFQUFLLEdBREw7TUFFQSxHQUFBLEVBQUssR0FGTDs7OzZCQUlGLFlBQUEsR0FDRTtNQUFBLEdBQUEsRUFBSyxHQUFMO01BQ0EsR0FBQSxFQUFLLEdBREw7TUFFQSxHQUFBLEVBQUssR0FGTDtNQUdBLEdBQUEsRUFBSyxHQUhMO01BSUEsR0FBQSxFQUFLLEdBSkw7TUFLQSxHQUFBLEVBQUssR0FMTDs7OzZCQU9GLGVBQUEsR0FDRTtNQUFBLEdBQUEsRUFBSyxHQUFMO01BQ0EsR0FBQSxFQUFLLEdBREw7TUFFQSxHQUFBLEVBQUssR0FGTDtNQUdBLEdBQUEsRUFBSyxHQUhMOzs7NkJBS0YsWUFBQSxHQUFjLFNBQUMsa0JBQUQ7TUFDWixJQUFHLGtCQUFIO2VBQ0UsSUFBQyxDQUFBLGdCQUFELEdBQW9CLENBQUMsQ0FBQyxNQUFGLENBQVMsRUFBVCxFQUFhLElBQUMsQ0FBQSxZQUFkLEVBQTRCLElBQUMsQ0FBQSxlQUE3QixFQUR0QjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsZ0JBQUQsR0FBb0IsSUFBQyxDQUFBLGFBSHZCOztJQURZOztJQU1ELHdCQUFDLE1BQUQsRUFBVSxhQUFWO01BQUMsSUFBQyxDQUFBLFNB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Q0FBQSxNQUFNLENBQUMsYUFBUixDQUFBLENBQXVCLENBQUMsa0JBQXhCLENBQUEsQ0FBUDtPQUFyQjtJQURnQjs7Ozs7QUFsT3BCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TZWxlY3RvckNhY2hlID0gcmVxdWlyZSAnLi9zZWxlY3Rvci1jYWNoZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnJhY2tldE1hdGNoZXJcbiAgcGFpcnNUb0luZGVudDpcbiAgICAnKCc6ICcpJ1xuICAgICdbJzogJ10nXG4gICAgJ3snOiAnfSdcblxuICBkZWZhdWx0UGFpcnM6XG4gICAgJygnOiAnKSdcbiAgICAnWyc6ICddJ1xuICAgICd7JzogJ30nXG4gICAgJ1wiJzogJ1wiJ1xuICAgIFwiJ1wiOiBcIidcIlxuICAgICdgJzogJ2AnXG5cbiAgc21hcnRRdW90ZVBhaXJzOlxuICAgIFwi4oCcXCI6IFwi4oCdXCJcbiAgICAn4oCYJzogJ+KAmSdcbiAgICBcIsKrXCI6IFwiwrtcIlxuICAgIFwi4oC5XCI6IFwi4oC6XCJcblxuICB0b2dnbGVRdW90ZXM6IChpbmNsdWRlU21hcnRRdW90ZXMpIC0+XG4gICAgaWYgaW5jbHVkZVNtYXJ0UXVvdGVzXG4gICAgICBAcGFpcmVkQ2hhcmFjdGVycyA9IF8uZXh0ZW5kKHt9LCBAZGVmYXVsdFBhaXJzLCBAc21hcnRRdW90ZVBhaXJzKVxuICAgIGVsc2VcbiAgICAgIEBwYWlyZWRDaGFyYWN0ZXJzID0gQGRlZmF1bHRQYWlyc1xuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgZWRpdG9yRWxlbWVudCkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGJyYWNrZXRNYXJrZXJzID0gW11cblxuICAgIF8uYWR2aXNlQmVmb3JlKEBlZGl0b3IsICdpbnNlcnRUZXh0JywgQGluc2VydFRleHQpXG4gICAgXy5hZHZpc2VCZWZvcmUoQGVkaXRvciwgJ2luc2VydE5ld2xpbmUnLCBAaW5zZXJ0TmV3bGluZSlcbiAgICBfLmFkdmlzZUJlZm9yZShAZWRpdG9yLCAnYmFja3NwYWNlJywgQGJhY2tzcGFjZSlcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JFbGVtZW50LCAnYnJhY2tldC1tYXRjaGVyOnJlbW92ZS1icmFja2V0cy1mcm9tLXNlbGVjdGlvbicsIChldmVudCkgPT5cbiAgICAgIGV2ZW50LmFib3J0S2V5QmluZGluZygpIHVubGVzcyBAcmVtb3ZlQnJhY2tldHMoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWREZXN0cm95ID0+IEB1bnN1YnNjcmliZSgpXG5cbiAgaW5zZXJ0VGV4dDogKHRleHQsIG9wdGlvbnMpID0+XG4gICAgcmV0dXJuIHRydWUgdW5sZXNzIHRleHRcbiAgICByZXR1cm4gdHJ1ZSBpZiBvcHRpb25zPy5zZWxlY3Qgb3Igb3B0aW9ucz8udW5kbyBpcyAnc2tpcCdcblxuICAgIEB0b2dnbGVRdW90ZXMoQGdldFNjb3BlZFNldHRpbmcoJ2JyYWNrZXQtbWF0Y2hlci5hdXRvY29tcGxldGVTbWFydFF1b3RlcycpKVxuXG4gICAgcmV0dXJuIGZhbHNlIGlmIEB3cmFwU2VsZWN0aW9uSW5CcmFja2V0cyh0ZXh0KVxuICAgIHJldHVybiB0cnVlIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcblxuICAgIGN1cnNvckJ1ZmZlclBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgcHJldmlvdXNDaGFyYWN0ZXJzID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbY3Vyc29yQnVmZmVyUG9zaXRpb24udHJhdmVyc2UoWzAsIC0yXSksIGN1cnNvckJ1ZmZlclBvc2l0aW9uXSlcbiAgICBuZXh0Q2hhcmFjdGVyID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbY3Vyc29yQnVmZmVyUG9zaXRpb24sIGN1cnNvckJ1ZmZlclBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSldKVxuXG4gICAgcHJldmlvdXNDaGFyYWN0ZXIgPSBwcmV2aW91c0NoYXJhY3RlcnMuc2xpY2UoLTEpXG5cbiAgICBoYXNXb3JkQWZ0ZXJDdXJzb3IgPSAvXFx3Ly50ZXN0KG5leHRDaGFyYWN0ZXIpXG4gICAgaGFzV29yZEJlZm9yZUN1cnNvciA9IC9cXHcvLnRlc3QocHJldmlvdXNDaGFyYWN0ZXIpXG4gICAgaGFzUXVvdGVCZWZvcmVDdXJzb3IgPSBwcmV2aW91c0NoYXJhY3RlciBpcyB0ZXh0WzBdXG4gICAgaGFzRXNjYXBlU2VxdWVuY2VCZWZvcmVDdXJzb3IgPSBwcmV2aW91c0NoYXJhY3RlcnMubWF0Y2goL1xcXFwvZyk/Lmxlbmd0aCA+PSAxICMgVG8gZ3VhcmQgYWdhaW5zdCB0aGUgXCJcXFxcXCIgc2VxdWVuY2VcblxuICAgIGlmIHRleHQgaXMgJyMnIGFuZCBAaXNDdXJzb3JPbkludGVycG9sYXRlZFN0cmluZygpXG4gICAgICBhdXRvQ29tcGxldGVPcGVuaW5nQnJhY2tldCA9IEBnZXRTY29wZWRTZXR0aW5nKCdicmFja2V0LW1hdGNoZXIuYXV0b2NvbXBsZXRlQnJhY2tldHMnKSBhbmQgbm90IGhhc0VzY2FwZVNlcXVlbmNlQmVmb3JlQ3Vyc29yXG4gICAgICB0ZXh0ICs9ICd7J1xuICAgICAgcGFpciA9ICd9J1xuICAgIGVsc2VcbiAgICAgIGF1dG9Db21wbGV0ZU9wZW5pbmdCcmFja2V0ID0gQGdldFNjb3BlZFNldHRpbmcoJ2JyYWNrZXQtbWF0Y2hlci5hdXRvY29tcGxldGVCcmFja2V0cycpIGFuZCBAaXNPcGVuaW5nQnJhY2tldCh0ZXh0KSBhbmQgbm90IGhhc1dvcmRBZnRlckN1cnNvciBhbmQgbm90IChAaXNRdW90ZSh0ZXh0KSBhbmQgKGhhc1dvcmRCZWZvcmVDdXJzb3Igb3IgaGFzUXVvdGVCZWZvcmVDdXJzb3IpKSBhbmQgbm90IGhhc0VzY2FwZVNlcXVlbmNlQmVmb3JlQ3Vyc29yXG4gICAgICBwYWlyID0gQHBhaXJlZENoYXJhY3RlcnNbdGV4dF1cblxuICAgIHNraXBPdmVyRXhpc3RpbmdDbG9zaW5nQnJhY2tldCA9IGZhbHNlXG4gICAgaWYgQGlzQ2xvc2luZ0JyYWNrZXQodGV4dCkgYW5kIG5leHRDaGFyYWN0ZXIgaXMgdGV4dCBhbmQgbm90IGhhc0VzY2FwZVNlcXVlbmNlQmVmb3JlQ3Vyc29yXG4gICAgICBpZiBicmFja2V0TWFya2VyID0gXy5maW5kKEBicmFja2V0TWFya2VycywgKG1hcmtlcikgLT4gbWFya2VyLmlzVmFsaWQoKSBhbmQgbWFya2VyLmdldEJ1ZmZlclJhbmdlKCkuZW5kLmlzRXF1YWwoY3Vyc29yQnVmZmVyUG9zaXRpb24pKVxuICAgICAgICBza2lwT3ZlckV4aXN0aW5nQ2xvc2luZ0JyYWNrZXQgPSB0cnVlXG5cbiAgICBpZiBza2lwT3ZlckV4aXN0aW5nQ2xvc2luZ0JyYWNrZXRcbiAgICAgIGJyYWNrZXRNYXJrZXIuZGVzdHJveSgpXG4gICAgICBfLnJlbW92ZShAYnJhY2tldE1hcmtlcnMsIGJyYWNrZXRNYXJrZXIpXG4gICAgICBAZWRpdG9yLm1vdmVSaWdodCgpXG4gICAgICBmYWxzZVxuICAgIGVsc2UgaWYgYXV0b0NvbXBsZXRlT3BlbmluZ0JyYWNrZXRcbiAgICAgIEBlZGl0b3IuaW5zZXJ0VGV4dCh0ZXh0ICsgcGFpcilcbiAgICAgIEBlZGl0b3IubW92ZUxlZnQoKVxuICAgICAgcmFuZ2UgPSBbY3Vyc29yQnVmZmVyUG9zaXRpb24sIGN1cnNvckJ1ZmZlclBvc2l0aW9uLnRyYXZlcnNlKFswLCB0ZXh0Lmxlbmd0aF0pXVxuICAgICAgQGJyYWNrZXRNYXJrZXJzLnB1c2ggQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICBmYWxzZVxuXG4gIGluc2VydE5ld2xpbmU6ID0+XG4gICAgcmV0dXJuIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICByZXR1cm4gdW5sZXNzIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmlzRW1wdHkoKVxuXG4gICAgQHRvZ2dsZVF1b3RlcyhAZ2V0U2NvcGVkU2V0dGluZygnYnJhY2tldC1tYXRjaGVyLmF1dG9jb21wbGV0ZVNtYXJ0UXVvdGVzJykpXG5cbiAgICBjdXJzb3JCdWZmZXJQb3NpdGlvbiA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIHByZXZpb3VzQ2hhcmFjdGVycyA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2N1cnNvckJ1ZmZlclBvc2l0aW9uLnRyYXZlcnNlKFswLCAtMl0pLCBjdXJzb3JCdWZmZXJQb3NpdGlvbl0pXG4gICAgbmV4dENoYXJhY3RlciA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2N1cnNvckJ1ZmZlclBvc2l0aW9uLCBjdXJzb3JCdWZmZXJQb3NpdGlvbi50cmF2ZXJzZShbMCwgMV0pXSlcblxuICAgIHByZXZpb3VzQ2hhcmFjdGVyID0gcHJldmlvdXNDaGFyYWN0ZXJzLnNsaWNlKC0xKVxuXG4gICAgaGFzRXNjYXBlU2VxdWVuY2VCZWZvcmVDdXJzb3IgPSBwcmV2aW91c0NoYXJhY3RlcnMubWF0Y2goL1xcXFwvZyk/Lmxlbmd0aCA+PSAxICMgVG8gZ3VhcmQgYWdhaW5zdCB0aGUgXCJcXFxcXCIgc2VxdWVuY2VcbiAgICBpZiBAcGFpcnNUb0luZGVudFtwcmV2aW91c0NoYXJhY3Rlcl0gaXMgbmV4dENoYXJhY3RlciBhbmQgbm90IGhhc0VzY2FwZVNlcXVlbmNlQmVmb3JlQ3Vyc29yXG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIEBlZGl0b3IuaW5zZXJ0VGV4dCBcIlxcblxcblwiXG4gICAgICAgIEBlZGl0b3IubW92ZVVwKClcbiAgICAgICAgaWYgQGdldFNjb3BlZFNldHRpbmcoJ2VkaXRvci5hdXRvSW5kZW50JylcbiAgICAgICAgICBjdXJzb3JSb3cgPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93XG4gICAgICAgICAgQGVkaXRvci5hdXRvSW5kZW50QnVmZmVyUm93cyhjdXJzb3JSb3csIGN1cnNvclJvdyArIDEpXG4gICAgICBmYWxzZVxuXG4gIGJhY2tzcGFjZTogPT5cbiAgICByZXR1cm4gaWYgQGVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKVxuICAgIHJldHVybiB1bmxlc3MgQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNFbXB0eSgpXG5cbiAgICBAdG9nZ2xlUXVvdGVzKEBnZXRTY29wZWRTZXR0aW5nKCdicmFja2V0LW1hdGNoZXIuYXV0b2NvbXBsZXRlU21hcnRRdW90ZXMnKSlcblxuICAgIGN1cnNvckJ1ZmZlclBvc2l0aW9uID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgcHJldmlvdXNDaGFyYWN0ZXJzID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbY3Vyc29yQnVmZmVyUG9zaXRpb24udHJhdmVyc2UoWzAsIC0yXSksIGN1cnNvckJ1ZmZlclBvc2l0aW9uXSlcbiAgICBuZXh0Q2hhcmFjdGVyID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbY3Vyc29yQnVmZmVyUG9zaXRpb24sIGN1cnNvckJ1ZmZlclBvc2l0aW9uLnRyYXZlcnNlKFswLCAxXSldKVxuXG4gICAgcHJldmlvdXNDaGFyYWN0ZXIgPSBwcmV2aW91c0NoYXJhY3RlcnMuc2xpY2UoLTEpXG5cbiAgICBoYXNFc2NhcGVTZXF1ZW5jZUJlZm9yZUN1cnNvciA9IHByZXZpb3VzQ2hhcmFjdGVycy5tYXRjaCgvXFxcXC9nKT8ubGVuZ3RoID49IDEgIyBUbyBndWFyZCBhZ2FpbnN0IHRoZSBcIlxcXFxcIiBzZXF1ZW5jZVxuICAgIGlmIChAcGFpcmVkQ2hhcmFjdGVyc1twcmV2aW91c0NoYXJhY3Rlcl0gaXMgbmV4dENoYXJhY3RlcikgYW5kIG5vdCBoYXNFc2NhcGVTZXF1ZW5jZUJlZm9yZUN1cnNvciBhbmQgQGdldFNjb3BlZFNldHRpbmcoJ2JyYWNrZXQtbWF0Y2hlci5hdXRvY29tcGxldGVCcmFja2V0cycpXG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIEBlZGl0b3IubW92ZUxlZnQoKVxuICAgICAgICBAZWRpdG9yLmRlbGV0ZSgpXG4gICAgICAgIEBlZGl0b3IuZGVsZXRlKClcbiAgICAgIGZhbHNlXG5cbiAgcmVtb3ZlQnJhY2tldHM6IC0+XG4gICAgYnJhY2tldHNSZW1vdmVkID0gZmFsc2VcbiAgICBAdG9nZ2xlUXVvdGVzKEBnZXRTY29wZWRTZXR0aW5nKCdicmFja2V0LW1hdGNoZXIuYXV0b2NvbXBsZXRlU21hcnRRdW90ZXMnKSlcbiAgICBAZWRpdG9yLm11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBAc2VsZWN0aW9uSXNXcmFwcGVkQnlNYXRjaGluZ0JyYWNrZXRzKHNlbGVjdGlvbilcblxuICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgb3B0aW9ucyA9IHJldmVyc2VkOiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBzZWxlY3Rpb25TdGFydCA9IHJhbmdlLnN0YXJ0XG4gICAgICBpZiByYW5nZS5zdGFydC5yb3cgaXMgcmFuZ2UuZW5kLnJvd1xuICAgICAgICBzZWxlY3Rpb25FbmQgPSByYW5nZS5lbmQudHJhdmVyc2UoWzAsIC0yXSlcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0aW9uRW5kID0gcmFuZ2UuZW5kLnRyYXZlcnNlKFswLCAtMV0pXG5cbiAgICAgIHRleHQgPSBzZWxlY3Rpb24uZ2V0VGV4dCgpXG4gICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LnN1YnN0cmluZygxLCB0ZXh0Lmxlbmd0aCAtIDEpKVxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kXSwgb3B0aW9ucylcbiAgICAgIGJyYWNrZXRzUmVtb3ZlZCA9IHRydWVcbiAgICBicmFja2V0c1JlbW92ZWRcblxuICB3cmFwU2VsZWN0aW9uSW5CcmFja2V0czogKGJyYWNrZXQpIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAZ2V0U2NvcGVkU2V0dGluZygnYnJhY2tldC1tYXRjaGVyLndyYXBTZWxlY3Rpb25zSW5CcmFja2V0cycpXG5cbiAgICBpZiBicmFja2V0IGlzICcjJ1xuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAaXNDdXJzb3JPbkludGVycG9sYXRlZFN0cmluZygpXG4gICAgICBicmFja2V0ID0gJyN7J1xuICAgICAgcGFpciA9ICd9J1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGlzT3BlbmluZ0JyYWNrZXQoYnJhY2tldClcbiAgICAgIHBhaXIgPSBAcGFpcmVkQ2hhcmFjdGVyc1ticmFja2V0XVxuXG4gICAgc2VsZWN0aW9uV3JhcHBlZCA9IGZhbHNlXG4gICAgQGVkaXRvci5tdXRhdGVTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIHJldHVybiBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICAgICMgRG9uJ3Qgd3JhcCBpbiAje30gaWYgdGhlIHNlbGVjdGlvbiBzcGFucyBtb3JlIHRoYW4gb25lIGxpbmVcbiAgICAgIHJldHVybiBpZiBicmFja2V0IGlzICcjeycgYW5kIG5vdCBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5pc1NpbmdsZUxpbmUoKVxuXG4gICAgICBzZWxlY3Rpb25XcmFwcGVkID0gdHJ1ZVxuICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgb3B0aW9ucyA9IHJldmVyc2VkOiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChcIiN7YnJhY2tldH0je3NlbGVjdGlvbi5nZXRUZXh0KCl9I3twYWlyfVwiKVxuICAgICAgc2VsZWN0aW9uU3RhcnQgPSByYW5nZS5zdGFydC50cmF2ZXJzZShbMCwgYnJhY2tldC5sZW5ndGhdKVxuICAgICAgaWYgcmFuZ2Uuc3RhcnQucm93IGlzIHJhbmdlLmVuZC5yb3dcbiAgICAgICAgc2VsZWN0aW9uRW5kID0gcmFuZ2UuZW5kLnRyYXZlcnNlKFswLCBicmFja2V0Lmxlbmd0aF0pXG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdGlvbkVuZCA9IHJhbmdlLmVuZFxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kXSwgb3B0aW9ucylcblxuICAgIHNlbGVjdGlvbldyYXBwZWRcblxuICBpc1F1b3RlOiAoc3RyaW5nKSAtPlxuICAgIC9bJ1wiYF0vLnRlc3Qoc3RyaW5nKVxuXG4gIGlzQ3Vyc29yT25JbnRlcnBvbGF0ZWRTdHJpbmc6IC0+XG4gICAgdW5sZXNzIEBpbnRlcnBvbGF0ZWRTdHJpbmdTZWxlY3Rvcj9cbiAgICAgIHNlZ21lbnRzID0gW1xuICAgICAgICAnKi4qLiouaW50ZXJwb2xhdGVkLnJ1YnknXG4gICAgICAgICdzdHJpbmcuaW50ZXJwb2xhdGVkLnJ1YnknXG4gICAgICAgICdzdHJpbmcucmVnZXhwLmludGVycG9sYXRlZC5ydWJ5J1xuICAgICAgICAnc3RyaW5nLnF1b3RlZC5kb3VibGUuY29mZmVlJ1xuICAgICAgICAnc3RyaW5nLnVucXVvdGVkLmhlcmVkb2MucnVieSdcbiAgICAgICAgJ3N0cmluZy5xdW90ZWQuZG91YmxlLmxpdmVzY3JpcHQnXG4gICAgICAgICdzdHJpbmcucXVvdGVkLmRvdWJsZS5oZXJlZG9jLmxpdmVzY3JpcHQnXG4gICAgICAgICdzdHJpbmcucXVvdGVkLmRvdWJsZS5lbGl4aXInXG4gICAgICAgICdzdHJpbmcucXVvdGVkLmRvdWJsZS5oZXJlZG9jLmVsaXhpcidcbiAgICAgICAgJ2NvbW1lbnQuZG9jdW1lbnRhdGlvbi5oZXJlZG9jLmVsaXhpcidcbiAgICAgIF1cbiAgICAgIEBpbnRlcnBvbGF0ZWRTdHJpbmdTZWxlY3RvciA9IFNlbGVjdG9yQ2FjaGUuZ2V0KHNlZ21lbnRzLmpvaW4oJyB8ICcpKVxuICAgIEBpbnRlcnBvbGF0ZWRTdHJpbmdTZWxlY3Rvci5tYXRjaGVzKEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KCkpXG5cbiAgZ2V0SW52ZXJ0ZWRQYWlyZWRDaGFyYWN0ZXJzOiAtPlxuICAgIHJldHVybiBAaW52ZXJ0ZWRQYWlyZWRDaGFyYWN0ZXJzIGlmIEBpbnZlcnRlZFBhaXJlZENoYXJhY3RlcnNcblxuICAgIEBpbnZlcnRlZFBhaXJlZENoYXJhY3RlcnMgPSB7fVxuICAgIGZvciBvcGVuLCBjbG9zZSBvZiBAcGFpcmVkQ2hhcmFjdGVyc1xuICAgICAgQGludmVydGVkUGFpcmVkQ2hhcmFjdGVyc1tjbG9zZV0gPSBvcGVuXG4gICAgQGludmVydGVkUGFpcmVkQ2hhcmFjdGVyc1xuXG4gIGlzT3BlbmluZ0JyYWNrZXQ6IChzdHJpbmcpIC0+XG4gICAgQHBhaXJlZENoYXJhY3RlcnMuaGFzT3duUHJvcGVydHkoc3RyaW5nKVxuXG4gIGlzQ2xvc2luZ0JyYWNrZXQ6IChzdHJpbmcpIC0+XG4gICAgQGdldEludmVydGVkUGFpcmVkQ2hhcmFjdGVycygpLmhhc093blByb3BlcnR5KHN0cmluZylcblxuICBzZWxlY3Rpb25Jc1dyYXBwZWRCeU1hdGNoaW5nQnJhY2tldHM6IChzZWxlY3Rpb24pIC0+XG4gICAgcmV0dXJuIGZhbHNlIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICBzZWxlY3RlZFRleHQgPSBzZWxlY3Rpb24uZ2V0VGV4dCgpXG4gICAgZmlyc3RDaGFyYWN0ZXIgPSBzZWxlY3RlZFRleHRbMF1cbiAgICBsYXN0Q2hhcmFjdGVyID0gc2VsZWN0ZWRUZXh0W3NlbGVjdGVkVGV4dC5sZW5ndGggLSAxXVxuICAgIEBwYWlyZWRDaGFyYWN0ZXJzW2ZpcnN0Q2hhcmFjdGVyXSBpcyBsYXN0Q2hhcmFjdGVyXG5cbiAgdW5zdWJzY3JpYmU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgZ2V0U2NvcGVkU2V0dGluZzogKGtleSkgLT5cbiAgICBhdG9tLmNvbmZpZy5nZXQoa2V5LCBzY29wZTogQGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0U2NvcGVEZXNjcmlwdG9yKCkpXG4iXX0=
