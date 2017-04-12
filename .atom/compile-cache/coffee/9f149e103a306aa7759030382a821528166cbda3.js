(function() {
  var CommentScopeRegex, Token, TokenizedLine, idCounter,
    slice = [].slice;

  Token = require('./token');

  CommentScopeRegex = /(\b|\.)comment/;

  idCounter = 1;

  module.exports = TokenizedLine = (function() {
    function TokenizedLine(properties) {
      this.id = idCounter++;
      if (properties == null) {
        return;
      }
      this.openScopes = properties.openScopes, this.text = properties.text, this.tags = properties.tags, this.ruleStack = properties.ruleStack, this.tokenIterator = properties.tokenIterator;
    }

    TokenizedLine.prototype.getTokenIterator = function() {
      var ref;
      return (ref = this.tokenIterator).reset.apply(ref, [this].concat(slice.call(arguments)));
    };

    Object.defineProperty(TokenizedLine.prototype, 'tokens', {
      get: function() {
        var iterator, tokens;
        iterator = this.getTokenIterator();
        tokens = [];
        while (iterator.next()) {
          tokens.push(new Token({
            value: iterator.getText(),
            scopes: iterator.getScopes().slice()
          }));
        }
        return tokens;
      }
    });

    TokenizedLine.prototype.tokenAtBufferColumn = function(bufferColumn) {
      return this.tokens[this.tokenIndexAtBufferColumn(bufferColumn)];
    };

    TokenizedLine.prototype.tokenIndexAtBufferColumn = function(bufferColumn) {
      var column, i, index, len, ref, token;
      column = 0;
      ref = this.tokens;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        token = ref[index];
        column += token.value.length;
        if (column > bufferColumn) {
          return index;
        }
      }
      return index - 1;
    };

    TokenizedLine.prototype.tokenStartColumnForBufferColumn = function(bufferColumn) {
      var delta, i, len, nextDelta, ref, token;
      delta = 0;
      ref = this.tokens;
      for (i = 0, len = ref.length; i < len; i++) {
        token = ref[i];
        nextDelta = delta + token.bufferDelta;
        if (nextDelta > bufferColumn) {
          break;
        }
        delta = nextDelta;
      }
      return delta;
    };

    TokenizedLine.prototype.isComment = function() {
      var i, iterator, len, scope, scopes;
      if (this.isCommentLine != null) {
        return this.isCommentLine;
      }
      this.isCommentLine = false;
      iterator = this.getTokenIterator();
      while (iterator.next()) {
        scopes = iterator.getScopes();
        if (scopes.length === 1) {
          continue;
        }
        for (i = 0, len = scopes.length; i < len; i++) {
          scope = scopes[i];
          if (CommentScopeRegex.test(scope)) {
            this.isCommentLine = true;
            break;
          }
        }
        break;
      }
      return this.isCommentLine;
    };

    TokenizedLine.prototype.tokenAtIndex = function(index) {
      return this.tokens[index];
    };

    TokenizedLine.prototype.getTokenCount = function() {
      var count, i, len, ref, tag;
      count = 0;
      ref = this.tags;
      for (i = 0, len = ref.length; i < len; i++) {
        tag = ref[i];
        if (tag >= 0) {
          count++;
        }
      }
      return count;
    };

    return TokenizedLine;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90b2tlbml6ZWQtbGluZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtEQUFBO0lBQUE7O0VBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLGlCQUFBLEdBQW9COztFQUVwQixTQUFBLEdBQVk7O0VBRVosTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHVCQUFDLFVBQUQ7TUFDWCxJQUFDLENBQUEsRUFBRCxHQUFNLFNBQUE7TUFFTixJQUFjLGtCQUFkO0FBQUEsZUFBQTs7TUFFQyxJQUFDLENBQUEsd0JBQUEsVUFBRixFQUFjLElBQUMsQ0FBQSxrQkFBQSxJQUFmLEVBQXFCLElBQUMsQ0FBQSxrQkFBQSxJQUF0QixFQUE0QixJQUFDLENBQUEsdUJBQUEsU0FBN0IsRUFBd0MsSUFBQyxDQUFBLDJCQUFBO0lBTDlCOzs0QkFPYixnQkFBQSxHQUFrQixTQUFBO0FBQUcsVUFBQTthQUFBLE9BQUEsSUFBQyxDQUFBLGFBQUQsQ0FBYyxDQUFDLEtBQWYsWUFBcUIsQ0FBQSxJQUFNLFNBQUEsV0FBQSxTQUFBLENBQUEsQ0FBM0I7SUFBSDs7SUFFbEIsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsYUFBQyxDQUFBLFNBQXZCLEVBQWtDLFFBQWxDLEVBQTRDO01BQUEsR0FBQSxFQUFLLFNBQUE7QUFDL0MsWUFBQTtRQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUNYLE1BQUEsR0FBUztBQUVULGVBQU0sUUFBUSxDQUFDLElBQVQsQ0FBQSxDQUFOO1VBQ0UsTUFBTSxDQUFDLElBQVAsQ0FBZ0IsSUFBQSxLQUFBLENBQU07WUFDcEIsS0FBQSxFQUFPLFFBQVEsQ0FBQyxPQUFULENBQUEsQ0FEYTtZQUVwQixNQUFBLEVBQVEsUUFBUSxDQUFDLFNBQVQsQ0FBQSxDQUFvQixDQUFDLEtBQXJCLENBQUEsQ0FGWTtXQUFOLENBQWhCO1FBREY7ZUFNQTtNQVYrQyxDQUFMO0tBQTVDOzs0QkFZQSxtQkFBQSxHQUFxQixTQUFDLFlBQUQ7YUFDbkIsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsWUFBMUIsQ0FBQTtJQURXOzs0QkFHckIsd0JBQUEsR0FBMEIsU0FBQyxZQUFEO0FBQ3hCLFVBQUE7TUFBQSxNQUFBLEdBQVM7QUFDVDtBQUFBLFdBQUEscURBQUE7O1FBQ0UsTUFBQSxJQUFVLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDdEIsSUFBZ0IsTUFBQSxHQUFTLFlBQXpCO0FBQUEsaUJBQU8sTUFBUDs7QUFGRjthQUdBLEtBQUEsR0FBUTtJQUxnQjs7NEJBTzFCLCtCQUFBLEdBQWlDLFNBQUMsWUFBRDtBQUMvQixVQUFBO01BQUEsS0FBQSxHQUFRO0FBQ1I7QUFBQSxXQUFBLHFDQUFBOztRQUNFLFNBQUEsR0FBWSxLQUFBLEdBQVEsS0FBSyxDQUFDO1FBQzFCLElBQVMsU0FBQSxHQUFZLFlBQXJCO0FBQUEsZ0JBQUE7O1FBQ0EsS0FBQSxHQUFRO0FBSFY7YUFJQTtJQU4rQjs7NEJBUWpDLFNBQUEsR0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLElBQXlCLDBCQUF6QjtBQUFBLGVBQU8sSUFBQyxDQUFBLGNBQVI7O01BRUEsSUFBQyxDQUFBLGFBQUQsR0FBaUI7TUFDakIsUUFBQSxHQUFXLElBQUMsQ0FBQSxnQkFBRCxDQUFBO0FBQ1gsYUFBTSxRQUFRLENBQUMsSUFBVCxDQUFBLENBQU47UUFDRSxNQUFBLEdBQVMsUUFBUSxDQUFDLFNBQVQsQ0FBQTtRQUNULElBQVksTUFBTSxDQUFDLE1BQVAsS0FBaUIsQ0FBN0I7QUFBQSxtQkFBQTs7QUFDQSxhQUFBLHdDQUFBOztVQUNFLElBQUcsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsS0FBdkIsQ0FBSDtZQUNFLElBQUMsQ0FBQSxhQUFELEdBQWlCO0FBQ2pCLGtCQUZGOztBQURGO0FBSUE7TUFQRjthQVFBLElBQUMsQ0FBQTtJQWJROzs0QkFlWCxZQUFBLEdBQWMsU0FBQyxLQUFEO2FBQ1osSUFBQyxDQUFBLE1BQU8sQ0FBQSxLQUFBO0lBREk7OzRCQUdkLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLEtBQUEsR0FBUTtBQUNSO0FBQUEsV0FBQSxxQ0FBQTs7WUFBOEIsR0FBQSxJQUFPO1VBQXJDLEtBQUE7O0FBQUE7YUFDQTtJQUhhOzs7OztBQWhFakIiLCJzb3VyY2VzQ29udGVudCI6WyJUb2tlbiA9IHJlcXVpcmUgJy4vdG9rZW4nXG5Db21tZW50U2NvcGVSZWdleCA9IC8oXFxifFxcLiljb21tZW50L1xuXG5pZENvdW50ZXIgPSAxXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRva2VuaXplZExpbmVcbiAgY29uc3RydWN0b3I6IChwcm9wZXJ0aWVzKSAtPlxuICAgIEBpZCA9IGlkQ291bnRlcisrXG5cbiAgICByZXR1cm4gdW5sZXNzIHByb3BlcnRpZXM/XG5cbiAgICB7QG9wZW5TY29wZXMsIEB0ZXh0LCBAdGFncywgQHJ1bGVTdGFjaywgQHRva2VuSXRlcmF0b3J9ID0gcHJvcGVydGllc1xuXG4gIGdldFRva2VuSXRlcmF0b3I6IC0+IEB0b2tlbkl0ZXJhdG9yLnJlc2V0KHRoaXMsIGFyZ3VtZW50cy4uLilcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkgQHByb3RvdHlwZSwgJ3Rva2VucycsIGdldDogLT5cbiAgICBpdGVyYXRvciA9IEBnZXRUb2tlbkl0ZXJhdG9yKClcbiAgICB0b2tlbnMgPSBbXVxuXG4gICAgd2hpbGUgaXRlcmF0b3IubmV4dCgpXG4gICAgICB0b2tlbnMucHVzaChuZXcgVG9rZW4oe1xuICAgICAgICB2YWx1ZTogaXRlcmF0b3IuZ2V0VGV4dCgpXG4gICAgICAgIHNjb3BlczogaXRlcmF0b3IuZ2V0U2NvcGVzKCkuc2xpY2UoKVxuICAgICAgfSkpXG5cbiAgICB0b2tlbnNcblxuICB0b2tlbkF0QnVmZmVyQ29sdW1uOiAoYnVmZmVyQ29sdW1uKSAtPlxuICAgIEB0b2tlbnNbQHRva2VuSW5kZXhBdEJ1ZmZlckNvbHVtbihidWZmZXJDb2x1bW4pXVxuXG4gIHRva2VuSW5kZXhBdEJ1ZmZlckNvbHVtbjogKGJ1ZmZlckNvbHVtbikgLT5cbiAgICBjb2x1bW4gPSAwXG4gICAgZm9yIHRva2VuLCBpbmRleCBpbiBAdG9rZW5zXG4gICAgICBjb2x1bW4gKz0gdG9rZW4udmFsdWUubGVuZ3RoXG4gICAgICByZXR1cm4gaW5kZXggaWYgY29sdW1uID4gYnVmZmVyQ29sdW1uXG4gICAgaW5kZXggLSAxXG5cbiAgdG9rZW5TdGFydENvbHVtbkZvckJ1ZmZlckNvbHVtbjogKGJ1ZmZlckNvbHVtbikgLT5cbiAgICBkZWx0YSA9IDBcbiAgICBmb3IgdG9rZW4gaW4gQHRva2Vuc1xuICAgICAgbmV4dERlbHRhID0gZGVsdGEgKyB0b2tlbi5idWZmZXJEZWx0YVxuICAgICAgYnJlYWsgaWYgbmV4dERlbHRhID4gYnVmZmVyQ29sdW1uXG4gICAgICBkZWx0YSA9IG5leHREZWx0YVxuICAgIGRlbHRhXG5cbiAgaXNDb21tZW50OiAtPlxuICAgIHJldHVybiBAaXNDb21tZW50TGluZSBpZiBAaXNDb21tZW50TGluZT9cblxuICAgIEBpc0NvbW1lbnRMaW5lID0gZmFsc2VcbiAgICBpdGVyYXRvciA9IEBnZXRUb2tlbkl0ZXJhdG9yKClcbiAgICB3aGlsZSBpdGVyYXRvci5uZXh0KClcbiAgICAgIHNjb3BlcyA9IGl0ZXJhdG9yLmdldFNjb3BlcygpXG4gICAgICBjb250aW51ZSBpZiBzY29wZXMubGVuZ3RoIGlzIDFcbiAgICAgIGZvciBzY29wZSBpbiBzY29wZXNcbiAgICAgICAgaWYgQ29tbWVudFNjb3BlUmVnZXgudGVzdChzY29wZSlcbiAgICAgICAgICBAaXNDb21tZW50TGluZSA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgYnJlYWtcbiAgICBAaXNDb21tZW50TGluZVxuXG4gIHRva2VuQXRJbmRleDogKGluZGV4KSAtPlxuICAgIEB0b2tlbnNbaW5kZXhdXG5cbiAgZ2V0VG9rZW5Db3VudDogLT5cbiAgICBjb3VudCA9IDBcbiAgICBjb3VudCsrIGZvciB0YWcgaW4gQHRhZ3Mgd2hlbiB0YWcgPj0gMFxuICAgIGNvdW50XG4iXX0=
