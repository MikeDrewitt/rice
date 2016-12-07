(function() {
  var KnownWordsChecker;

  KnownWordsChecker = (function() {
    KnownWordsChecker.prototype.enableAdd = false;

    KnownWordsChecker.prototype.spelling = null;

    KnownWordsChecker.prototype.checker = null;

    function KnownWordsChecker(knownWords) {
      var spellingManager;
      spellingManager = require("spelling-manager");
      this.spelling = new spellingManager.TokenSpellingManager;
      this.checker = new spellingManager.BufferSpellingChecker(this.spelling);
      this.setKnownWords(knownWords);
    }

    KnownWordsChecker.prototype.deactivate = function() {};

    KnownWordsChecker.prototype.getId = function() {
      return "spell-check:known-words";
    };

    KnownWordsChecker.prototype.getName = function() {
      return "Known Words";
    };

    KnownWordsChecker.prototype.getPriority = function() {
      return 10;
    };

    KnownWordsChecker.prototype.isEnabled = function() {
      return this.spelling.sensitive || this.spelling.insensitive;
    };

    KnownWordsChecker.prototype.getStatus = function() {
      return "Working correctly.";
    };

    KnownWordsChecker.prototype.providesSpelling = function(args) {
      return true;
    };

    KnownWordsChecker.prototype.providesSuggestions = function(args) {
      return true;
    };

    KnownWordsChecker.prototype.providesAdding = function(args) {
      return this.enableAdd;
    };

    KnownWordsChecker.prototype.check = function(args, text) {
      var checked, i, len, ranges, token;
      ranges = [];
      checked = this.checker.check(text);
      for (i = 0, len = checked.length; i < len; i++) {
        token = checked[i];
        if (token.status === 1) {
          ranges.push({
            start: token.start,
            end: token.end
          });
        }
      }
      return {
        correct: ranges
      };
    };

    KnownWordsChecker.prototype.suggest = function(args, word) {
      return this.spelling.suggest(word);
    };

    KnownWordsChecker.prototype.getAddingTargets = function(args) {
      if (this.enableAdd) {
        return [
          {
            sensitive: false,
            label: "Add to " + this.getName()
          }
        ];
      } else {
        return [];
      }
    };

    KnownWordsChecker.prototype.add = function(args, target) {
      var c;
      c = atom.config.get('spell-check.knownWords');
      c.push(target.word);
      return atom.config.set('spell-check.knownWords', c);
    };

    KnownWordsChecker.prototype.setAddKnownWords = function(newValue) {
      return this.enableAdd = newValue;
    };

    KnownWordsChecker.prototype.setKnownWords = function(knownWords) {
      var i, ignore, len, results;
      this.spelling.sensitive = {};
      this.spelling.insensitive = {};
      if (knownWords) {
        results = [];
        for (i = 0, len = knownWords.length; i < len; i++) {
          ignore = knownWords[i];
          results.push(this.spelling.add(ignore));
        }
        return results;
      }
    };

    return KnownWordsChecker;

  })();

  module.exports = KnownWordsChecker;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIva25vd24td29yZHMtY2hlY2tlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFNO2dDQUNKLFNBQUEsR0FBVzs7Z0NBQ1gsUUFBQSxHQUFVOztnQ0FDVixPQUFBLEdBQVM7O0lBRUksMkJBQUMsVUFBRDtBQUVYLFVBQUE7TUFBQSxlQUFBLEdBQWtCLE9BQUEsQ0FBUSxrQkFBUjtNQUNsQixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksZUFBZSxDQUFDO01BQ2hDLElBQUMsQ0FBQSxPQUFELEdBQWUsSUFBQSxlQUFlLENBQUMscUJBQWhCLENBQXNDLElBQUMsQ0FBQSxRQUF2QztNQUdmLElBQUMsQ0FBQSxhQUFELENBQWUsVUFBZjtJQVBXOztnQ0FTYixVQUFBLEdBQVksU0FBQSxHQUFBOztnQ0FHWixLQUFBLEdBQU8sU0FBQTthQUFHO0lBQUg7O2dDQUNQLE9BQUEsR0FBUyxTQUFBO2FBQUc7SUFBSDs7Z0NBQ1QsV0FBQSxHQUFhLFNBQUE7YUFBRztJQUFIOztnQ0FDYixTQUFBLEdBQVcsU0FBQTthQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixJQUF1QixJQUFDLENBQUEsUUFBUSxDQUFDO0lBQXBDOztnQ0FFWCxTQUFBLEdBQVcsU0FBQTthQUFHO0lBQUg7O2dDQUNYLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDthQUFVO0lBQVY7O2dDQUNsQixtQkFBQSxHQUFxQixTQUFDLElBQUQ7YUFBVTtJQUFWOztnQ0FDckIsY0FBQSxHQUFnQixTQUFDLElBQUQ7YUFBVSxJQUFDLENBQUE7SUFBWDs7Z0NBRWhCLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxJQUFQO0FBQ0wsVUFBQTtNQUFBLE1BQUEsR0FBUztNQUNULE9BQUEsR0FBVSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBZSxJQUFmO0FBQ1YsV0FBQSx5Q0FBQTs7UUFDRSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1VBQ0UsTUFBTSxDQUFDLElBQVAsQ0FBWTtZQUFDLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FBZDtZQUFxQixHQUFBLEVBQUssS0FBSyxDQUFDLEdBQWhDO1dBQVosRUFERjs7QUFERjthQUdBO1FBQUMsT0FBQSxFQUFTLE1BQVY7O0lBTks7O2dDQVFQLE9BQUEsR0FBUyxTQUFDLElBQUQsRUFBTyxJQUFQO2FBQ1AsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQWtCLElBQWxCO0lBRE87O2dDQUdULGdCQUFBLEdBQWtCLFNBQUMsSUFBRDtNQUNoQixJQUFHLElBQUMsQ0FBQSxTQUFKO2VBQ0U7VUFBQztZQUFDLFNBQUEsRUFBVyxLQUFaO1lBQW1CLEtBQUEsRUFBTyxTQUFBLEdBQVksSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUF0QztXQUFEO1VBREY7T0FBQSxNQUFBO2VBR0UsR0FIRjs7SUFEZ0I7O2dDQU1sQixHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sTUFBUDtBQUNILFVBQUE7TUFBQSxDQUFBLEdBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQjtNQUNKLENBQUMsQ0FBQyxJQUFGLENBQU8sTUFBTSxDQUFDLElBQWQ7YUFDQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isd0JBQWhCLEVBQTBDLENBQTFDO0lBSEc7O2dDQUtMLGdCQUFBLEdBQWtCLFNBQUMsUUFBRDthQUNoQixJQUFDLENBQUEsU0FBRCxHQUFhO0lBREc7O2dDQUdsQixhQUFBLEdBQWUsU0FBQyxVQUFEO0FBRWIsVUFBQTtNQUFBLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixHQUFzQjtNQUN0QixJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVYsR0FBd0I7TUFHeEIsSUFBRyxVQUFIO0FBQ0U7YUFBQSw0Q0FBQTs7dUJBQ0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxHQUFWLENBQWMsTUFBZDtBQURGO3VCQURGOztJQU5hOzs7Ozs7RUFVakIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE5RGpCIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgS25vd25Xb3Jkc0NoZWNrZXJcbiAgZW5hYmxlQWRkOiBmYWxzZVxuICBzcGVsbGluZzogbnVsbFxuICBjaGVja2VyOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChrbm93bldvcmRzKSAtPlxuICAgICMgU2V0IHVwIHRoZSBzcGVsbGluZyBtYW5hZ2VyIHdlJ2xsIGJlIHVzaW5nLlxuICAgIHNwZWxsaW5nTWFuYWdlciA9IHJlcXVpcmUgXCJzcGVsbGluZy1tYW5hZ2VyXCJcbiAgICBAc3BlbGxpbmcgPSBuZXcgc3BlbGxpbmdNYW5hZ2VyLlRva2VuU3BlbGxpbmdNYW5hZ2VyXG4gICAgQGNoZWNrZXIgPSBuZXcgc3BlbGxpbmdNYW5hZ2VyLkJ1ZmZlclNwZWxsaW5nQ2hlY2tlciBAc3BlbGxpbmdcblxuICAgICMgU2V0IG91ciBrbm93biB3b3Jkcy5cbiAgICBAc2V0S25vd25Xb3JkcyBrbm93bldvcmRzXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICByZXR1cm5cblxuICBnZXRJZDogLT4gXCJzcGVsbC1jaGVjazprbm93bi13b3Jkc1wiXG4gIGdldE5hbWU6IC0+IFwiS25vd24gV29yZHNcIlxuICBnZXRQcmlvcml0eTogLT4gMTBcbiAgaXNFbmFibGVkOiAtPiBAc3BlbGxpbmcuc2Vuc2l0aXZlIG9yIEBzcGVsbGluZy5pbnNlbnNpdGl2ZVxuXG4gIGdldFN0YXR1czogLT4gXCJXb3JraW5nIGNvcnJlY3RseS5cIlxuICBwcm92aWRlc1NwZWxsaW5nOiAoYXJncykgLT4gdHJ1ZVxuICBwcm92aWRlc1N1Z2dlc3Rpb25zOiAoYXJncykgLT4gdHJ1ZVxuICBwcm92aWRlc0FkZGluZzogKGFyZ3MpIC0+IEBlbmFibGVBZGRcblxuICBjaGVjazogKGFyZ3MsIHRleHQpIC0+XG4gICAgcmFuZ2VzID0gW11cbiAgICBjaGVja2VkID0gQGNoZWNrZXIuY2hlY2sgdGV4dFxuICAgIGZvciB0b2tlbiBpbiBjaGVja2VkXG4gICAgICBpZiB0b2tlbi5zdGF0dXMgaXMgMVxuICAgICAgICByYW5nZXMucHVzaCB7c3RhcnQ6IHRva2VuLnN0YXJ0LCBlbmQ6IHRva2VuLmVuZH1cbiAgICB7Y29ycmVjdDogcmFuZ2VzfVxuXG4gIHN1Z2dlc3Q6IChhcmdzLCB3b3JkKSAtPlxuICAgIEBzcGVsbGluZy5zdWdnZXN0IHdvcmRcblxuICBnZXRBZGRpbmdUYXJnZXRzOiAoYXJncykgLT5cbiAgICBpZiBAZW5hYmxlQWRkXG4gICAgICBbe3NlbnNpdGl2ZTogZmFsc2UsIGxhYmVsOiBcIkFkZCB0byBcIiArIEBnZXROYW1lKCl9XVxuICAgIGVsc2VcbiAgICAgIFtdXG5cbiAgYWRkOiAoYXJncywgdGFyZ2V0KSAtPlxuICAgIGMgPSBhdG9tLmNvbmZpZy5nZXQgJ3NwZWxsLWNoZWNrLmtub3duV29yZHMnXG4gICAgYy5wdXNoIHRhcmdldC53b3JkXG4gICAgYXRvbS5jb25maWcuc2V0ICdzcGVsbC1jaGVjay5rbm93bldvcmRzJywgY1xuXG4gIHNldEFkZEtub3duV29yZHM6IChuZXdWYWx1ZSkgLT5cbiAgICBAZW5hYmxlQWRkID0gbmV3VmFsdWVcblxuICBzZXRLbm93bldvcmRzOiAoa25vd25Xb3JkcykgLT5cbiAgICAjIENsZWFyIG91dCB0aGUgb2xkIGxpc3QuXG4gICAgQHNwZWxsaW5nLnNlbnNpdGl2ZSA9IHt9XG4gICAgQHNwZWxsaW5nLmluc2Vuc2l0aXZlID0ge31cblxuICAgICMgQWRkIHRoZSBuZXcgb25lcyBpbnRvIHRoZSBsaXN0LlxuICAgIGlmIGtub3duV29yZHNcbiAgICAgIGZvciBpZ25vcmUgaW4ga25vd25Xb3Jkc1xuICAgICAgICBAc3BlbGxpbmcuYWRkIGlnbm9yZVxuXG5tb2R1bGUuZXhwb3J0cyA9IEtub3duV29yZHNDaGVja2VyXG4iXX0=
