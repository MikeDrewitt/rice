(function() {
  var TokenIterator;

  module.exports = TokenIterator = (function() {
    function TokenIterator(tokenizedBuffer) {
      this.tokenizedBuffer = tokenizedBuffer;
    }

    TokenIterator.prototype.reset = function(line) {
      this.line = line;
      this.index = null;
      this.startColumn = 0;
      this.endColumn = 0;
      this.scopes = this.line.openScopes.map((function(_this) {
        return function(id) {
          return _this.tokenizedBuffer.grammar.scopeForId(id);
        };
      })(this));
      this.scopeStarts = this.scopes.slice();
      this.scopeEnds = [];
      return this;
    };

    TokenIterator.prototype.next = function() {
      var scope, tag, tags;
      tags = this.line.tags;
      if (this.index != null) {
        this.startColumn = this.endColumn;
        this.scopeEnds.length = 0;
        this.scopeStarts.length = 0;
        this.index++;
      } else {
        this.index = 0;
      }
      while (this.index < tags.length) {
        tag = tags[this.index];
        if (tag < 0) {
          scope = this.tokenizedBuffer.grammar.scopeForId(tag);
          if (tag % 2 === 0) {
            if (this.scopeStarts[this.scopeStarts.length - 1] === scope) {
              this.scopeStarts.pop();
            } else {
              this.scopeEnds.push(scope);
            }
            this.scopes.pop();
          } else {
            this.scopeStarts.push(scope);
            this.scopes.push(scope);
          }
          this.index++;
        } else {
          this.endColumn += tag;
          this.text = this.line.text.substring(this.startColumn, this.endColumn);
          return true;
        }
      }
      return false;
    };

    TokenIterator.prototype.getScopes = function() {
      return this.scopes;
    };

    TokenIterator.prototype.getScopeStarts = function() {
      return this.scopeStarts;
    };

    TokenIterator.prototype.getScopeEnds = function() {
      return this.scopeEnds;
    };

    TokenIterator.prototype.getText = function() {
      return this.text;
    };

    TokenIterator.prototype.getBufferStart = function() {
      return this.startColumn;
    };

    TokenIterator.prototype.getBufferEnd = function() {
      return this.endColumn;
    };

    return TokenIterator;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90b2tlbi1pdGVyYXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx1QkFBQyxlQUFEO01BQUMsSUFBQyxDQUFBLGtCQUFEO0lBQUQ7OzRCQUViLEtBQUEsR0FBTyxTQUFDLElBQUQ7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUNOLElBQUMsQ0FBQSxLQUFELEdBQVM7TUFDVCxJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBakIsQ0FBcUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEVBQUQ7aUJBQVEsS0FBQyxDQUFBLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBekIsQ0FBb0MsRUFBcEM7UUFBUjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7TUFDVixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO01BQ2YsSUFBQyxDQUFBLFNBQUQsR0FBYTthQUNiO0lBUEs7OzRCQVNQLElBQUEsR0FBTSxTQUFBO0FBQ0osVUFBQTtNQUFDLE9BQVEsSUFBQyxDQUFBO01BRVYsSUFBRyxrQkFBSDtRQUNFLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBO1FBQ2hCLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBWCxHQUFvQjtRQUNwQixJQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLEtBQUQsR0FKRjtPQUFBLE1BQUE7UUFNRSxJQUFDLENBQUEsS0FBRCxHQUFTLEVBTlg7O0FBUUEsYUFBTSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxNQUFwQjtRQUNFLEdBQUEsR0FBTSxJQUFLLENBQUEsSUFBQyxDQUFBLEtBQUQ7UUFDWCxJQUFHLEdBQUEsR0FBTSxDQUFUO1VBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQXpCLENBQW9DLEdBQXBDO1VBQ1IsSUFBRyxHQUFBLEdBQU0sQ0FBTixLQUFXLENBQWQ7WUFDRSxJQUFHLElBQUMsQ0FBQSxXQUFZLENBQUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLEdBQXNCLENBQXRCLENBQWIsS0FBeUMsS0FBNUM7Y0FDRSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBQSxFQURGO2FBQUEsTUFBQTtjQUdFLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixLQUFoQixFQUhGOztZQUlBLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFBLEVBTEY7V0FBQSxNQUFBO1lBT0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLEtBQWxCO1lBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsS0FBYixFQVJGOztVQVNBLElBQUMsQ0FBQSxLQUFELEdBWEY7U0FBQSxNQUFBO1VBYUUsSUFBQyxDQUFBLFNBQUQsSUFBYztVQUNkLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBWCxDQUFxQixJQUFDLENBQUEsV0FBdEIsRUFBbUMsSUFBQyxDQUFBLFNBQXBDO0FBQ1IsaUJBQU8sS0FmVDs7TUFGRjthQW1CQTtJQTlCSTs7NEJBZ0NOLFNBQUEsR0FBVyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzRCQUVYLGNBQUEsR0FBZ0IsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs0QkFFaEIsWUFBQSxHQUFjLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7NEJBRWQsT0FBQSxHQUFTLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7NEJBRVQsY0FBQSxHQUFnQixTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzRCQUVoQixZQUFBLEdBQWMsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzs7OztBQXZEaEIiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUb2tlbkl0ZXJhdG9yXG4gIGNvbnN0cnVjdG9yOiAoQHRva2VuaXplZEJ1ZmZlcikgLT5cblxuICByZXNldDogKEBsaW5lKSAtPlxuICAgIEBpbmRleCA9IG51bGxcbiAgICBAc3RhcnRDb2x1bW4gPSAwXG4gICAgQGVuZENvbHVtbiA9IDBcbiAgICBAc2NvcGVzID0gQGxpbmUub3BlblNjb3Blcy5tYXAgKGlkKSA9PiBAdG9rZW5pemVkQnVmZmVyLmdyYW1tYXIuc2NvcGVGb3JJZChpZClcbiAgICBAc2NvcGVTdGFydHMgPSBAc2NvcGVzLnNsaWNlKClcbiAgICBAc2NvcGVFbmRzID0gW11cbiAgICB0aGlzXG5cbiAgbmV4dDogLT5cbiAgICB7dGFnc30gPSBAbGluZVxuXG4gICAgaWYgQGluZGV4P1xuICAgICAgQHN0YXJ0Q29sdW1uID0gQGVuZENvbHVtblxuICAgICAgQHNjb3BlRW5kcy5sZW5ndGggPSAwXG4gICAgICBAc2NvcGVTdGFydHMubGVuZ3RoID0gMFxuICAgICAgQGluZGV4KytcbiAgICBlbHNlXG4gICAgICBAaW5kZXggPSAwXG5cbiAgICB3aGlsZSBAaW5kZXggPCB0YWdzLmxlbmd0aFxuICAgICAgdGFnID0gdGFnc1tAaW5kZXhdXG4gICAgICBpZiB0YWcgPCAwXG4gICAgICAgIHNjb3BlID0gQHRva2VuaXplZEJ1ZmZlci5ncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxuICAgICAgICBpZiB0YWcgJSAyIGlzIDBcbiAgICAgICAgICBpZiBAc2NvcGVTdGFydHNbQHNjb3BlU3RhcnRzLmxlbmd0aCAtIDFdIGlzIHNjb3BlXG4gICAgICAgICAgICBAc2NvcGVTdGFydHMucG9wKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2NvcGVFbmRzLnB1c2goc2NvcGUpXG4gICAgICAgICAgQHNjb3Blcy5wb3AoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHNjb3BlU3RhcnRzLnB1c2goc2NvcGUpXG4gICAgICAgICAgQHNjb3Blcy5wdXNoKHNjb3BlKVxuICAgICAgICBAaW5kZXgrK1xuICAgICAgZWxzZVxuICAgICAgICBAZW5kQ29sdW1uICs9IHRhZ1xuICAgICAgICBAdGV4dCA9IEBsaW5lLnRleHQuc3Vic3RyaW5nKEBzdGFydENvbHVtbiwgQGVuZENvbHVtbilcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIGZhbHNlXG5cbiAgZ2V0U2NvcGVzOiAtPiBAc2NvcGVzXG5cbiAgZ2V0U2NvcGVTdGFydHM6IC0+IEBzY29wZVN0YXJ0c1xuXG4gIGdldFNjb3BlRW5kczogLT4gQHNjb3BlRW5kc1xuXG4gIGdldFRleHQ6IC0+IEB0ZXh0XG5cbiAgZ2V0QnVmZmVyU3RhcnQ6IC0+IEBzdGFydENvbHVtblxuXG4gIGdldEJ1ZmZlckVuZDogLT4gQGVuZENvbHVtblxuIl19
