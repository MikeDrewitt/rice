(function() {
  var SystemChecker, spellchecker;

  spellchecker = require('spellchecker');

  SystemChecker = (function() {
    SystemChecker.prototype.spellchecker = null;

    SystemChecker.prototype.locale = null;

    SystemChecker.prototype.enabled = true;

    SystemChecker.prototype.reason = null;

    SystemChecker.prototype.paths = null;

    function SystemChecker(locale, paths) {
      this.locale = locale;
      this.paths = paths;
    }

    SystemChecker.prototype.deactivate = function() {};

    SystemChecker.prototype.getId = function() {
      return "spell-check:" + this.locale.toLowerCase().replace("_", "-");
    };

    SystemChecker.prototype.getName = function() {
      return "System Dictionary (" + this.locale + ")";
    };

    SystemChecker.prototype.getPriority = function() {
      return 100;
    };

    SystemChecker.prototype.isEnabled = function() {
      return this.enabled;
    };

    SystemChecker.prototype.getStatus = function() {
      if (this.enabled) {
        return "Working correctly.";
      } else {
        return this.reason;
      }
    };

    SystemChecker.prototype.providesSpelling = function(args) {
      return true;
    };

    SystemChecker.prototype.providesSuggestions = function(args) {
      return true;
    };

    SystemChecker.prototype.providesAdding = function(args) {
      return false;
    };

    SystemChecker.prototype.check = function(args, text) {
      this.deferredInit();
      return {
        invertIncorrectAsCorrect: true,
        incorrect: this.spellchecker.checkSpelling(text)
      };
    };

    SystemChecker.prototype.suggest = function(args, word) {
      this.deferredInit();
      return this.spellchecker.getCorrectionsForMisspelling(word);
    };

    SystemChecker.prototype.deferredInit = function() {
      var i, len, path, ref, vendor;
      if (this.spellchecker) {
        return;
      }
      this.spellchecker = new spellchecker.Spellchecker;
      if (/win32/.test(process.platform)) {
        if (this.spellchecker.setDictionary(this.locale, "C:\\")) {
          return;
        }
      }
      ref = this.paths;
      for (i = 0, len = ref.length; i < len; i++) {
        path = ref[i];
        if (this.spellchecker.setDictionary(this.locale, path)) {
          return;
        }
      }
      if (/linux/.test(process.platform)) {
        if (this.spellchecker.setDictionary(this.locale, "/usr/share/hunspell")) {
          return;
        }
        if (this.spellchecker.setDictionary(this.locale, "/usr/share/myspell/dicts")) {
          return;
        }
      }
      if (/darwin/.test(process.platform)) {
        if (this.spellchecker.setDictionary(this.locale, "/")) {
          return;
        }
        if (this.spellchecker.setDictionary(this.locale, "/System/Library/Spelling")) {
          return;
        }
      }
      path = require('path');
      vendor = path.join(__dirname, "..", "node_modules", "spellchecker", "vendor", "hunspell_dictionaries");
      if (this.spellchecker.setDictionary(this.locale, vendor)) {
        return;
      }
      this.enabled = false;
      this.reason = "Cannot find dictionary for " + this.locale + ".";
      return console.log(this.getId(), "Can't load " + this.locale + ": " + this.reason);
    };

    return SystemChecker;

  })();

  module.exports = SystemChecker;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvc3lzdGVtLWNoZWNrZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxZQUFBLEdBQWUsT0FBQSxDQUFRLGNBQVI7O0VBRVQ7NEJBQ0osWUFBQSxHQUFjOzs0QkFDZCxNQUFBLEdBQVE7OzRCQUNSLE9BQUEsR0FBUzs7NEJBQ1QsTUFBQSxHQUFROzs0QkFDUixLQUFBLEdBQU87O0lBRU0sdUJBQUMsTUFBRCxFQUFTLEtBQVQ7TUFDWCxJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUZFOzs0QkFJYixVQUFBLEdBQVksU0FBQSxHQUFBOzs0QkFHWixLQUFBLEdBQU8sU0FBQTthQUFHLGNBQUEsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQUEsQ0FBcUIsQ0FBQyxPQUF0QixDQUE4QixHQUE5QixFQUFtQyxHQUFuQztJQUFwQjs7NEJBQ1AsT0FBQSxHQUFTLFNBQUE7YUFBRyxxQkFBQSxHQUF3QixJQUFDLENBQUEsTUFBekIsR0FBa0M7SUFBckM7OzRCQUNULFdBQUEsR0FBYSxTQUFBO2FBQUc7SUFBSDs7NEJBQ2IsU0FBQSxHQUFXLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7NEJBQ1gsU0FBQSxHQUFXLFNBQUE7TUFDVCxJQUFHLElBQUMsQ0FBQSxPQUFKO2VBQ0UscUJBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLE9BSEg7O0lBRFM7OzRCQU1YLGdCQUFBLEdBQWtCLFNBQUMsSUFBRDthQUFVO0lBQVY7OzRCQUNsQixtQkFBQSxHQUFxQixTQUFDLElBQUQ7YUFBVTtJQUFWOzs0QkFDckIsY0FBQSxHQUFnQixTQUFDLElBQUQ7YUFBVTtJQUFWOzs0QkFFaEIsS0FBQSxHQUFPLFNBQUMsSUFBRCxFQUFPLElBQVA7TUFDTCxJQUFDLENBQUEsWUFBRCxDQUFBO2FBQ0E7UUFBQyx3QkFBQSxFQUEwQixJQUEzQjtRQUFpQyxTQUFBLEVBQVcsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLElBQTVCLENBQTVDOztJQUZLOzs0QkFJUCxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUDtNQUNQLElBQUMsQ0FBQSxZQUFELENBQUE7YUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLDRCQUFkLENBQTJDLElBQTNDO0lBRk87OzRCQUlULFlBQUEsR0FBYyxTQUFBO0FBRVosVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLFlBQUo7QUFDRSxlQURGOztNQUlBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUksWUFBWSxDQUFDO01BSWpDLElBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYSxPQUFPLENBQUMsUUFBckIsQ0FBSDtRQUNFLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLElBQUMsQ0FBQSxNQUE3QixFQUFxQyxNQUFyQyxDQUFIO0FBQ0UsaUJBREY7U0FERjs7QUFLQTtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLGFBQWQsQ0FBNEIsSUFBQyxDQUFBLE1BQTdCLEVBQXFDLElBQXJDLENBQUg7QUFDRSxpQkFERjs7QUFERjtNQUtBLElBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYSxPQUFPLENBQUMsUUFBckIsQ0FBSDtRQUNFLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLElBQUMsQ0FBQSxNQUE3QixFQUFxQyxxQkFBckMsQ0FBSDtBQUNFLGlCQURGOztRQUVBLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLElBQUMsQ0FBQSxNQUE3QixFQUFxQywwQkFBckMsQ0FBSDtBQUNFLGlCQURGO1NBSEY7O01BT0EsSUFBRyxRQUFRLENBQUMsSUFBVCxDQUFjLE9BQU8sQ0FBQyxRQUF0QixDQUFIO1FBQ0UsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLGFBQWQsQ0FBNEIsSUFBQyxDQUFBLE1BQTdCLEVBQXFDLEdBQXJDLENBQUg7QUFDRSxpQkFERjs7UUFFQSxJQUFHLElBQUMsQ0FBQSxZQUFZLENBQUMsYUFBZCxDQUE0QixJQUFDLENBQUEsTUFBN0IsRUFBcUMsMEJBQXJDLENBQUg7QUFDRSxpQkFERjtTQUhGOztNQVFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjtNQUNQLE1BQUEsR0FBUyxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsSUFBckIsRUFBMkIsY0FBM0IsRUFBMkMsY0FBM0MsRUFBMkQsUUFBM0QsRUFBcUUsdUJBQXJFO01BQ1QsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLGFBQWQsQ0FBNEIsSUFBQyxDQUFBLE1BQTdCLEVBQXFDLE1BQXJDLENBQUg7QUFDRSxlQURGOztNQUlBLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsTUFBRCxHQUFVLDZCQUFBLEdBQWdDLElBQUMsQ0FBQSxNQUFqQyxHQUEwQzthQUNwRCxPQUFPLENBQUMsR0FBUixDQUFZLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBWixFQUFzQixhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFqQixHQUEwQixJQUExQixHQUFpQyxJQUFDLENBQUEsTUFBeEQ7SUEzQ1k7Ozs7OztFQTZDaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFuRmpCIiwic291cmNlc0NvbnRlbnQiOlsic3BlbGxjaGVja2VyID0gcmVxdWlyZSAnc3BlbGxjaGVja2VyJ1xuXG5jbGFzcyBTeXN0ZW1DaGVja2VyXG4gIHNwZWxsY2hlY2tlcjogbnVsbFxuICBsb2NhbGU6IG51bGxcbiAgZW5hYmxlZDogdHJ1ZVxuICByZWFzb246IG51bGxcbiAgcGF0aHM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKGxvY2FsZSwgcGF0aHMpIC0+XG4gICAgQGxvY2FsZSA9IGxvY2FsZVxuICAgIEBwYXRocyA9IHBhdGhzXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICByZXR1cm5cblxuICBnZXRJZDogLT4gXCJzcGVsbC1jaGVjazpcIiArIEBsb2NhbGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiX1wiLCBcIi1cIilcbiAgZ2V0TmFtZTogLT4gXCJTeXN0ZW0gRGljdGlvbmFyeSAoXCIgKyBAbG9jYWxlICsgXCIpXCJcbiAgZ2V0UHJpb3JpdHk6IC0+IDEwMCAjIFN5c3RlbSBsZXZlbCBkYXRhLCBoYXMgbm8gdXNlciBpbnB1dC5cbiAgaXNFbmFibGVkOiAtPiBAZW5hYmxlZFxuICBnZXRTdGF0dXM6IC0+XG4gICAgaWYgQGVuYWJsZWRcbiAgICAgIFwiV29ya2luZyBjb3JyZWN0bHkuXCJcbiAgICBlbHNlXG4gICAgICBAcmVhc29uXG5cbiAgcHJvdmlkZXNTcGVsbGluZzogKGFyZ3MpIC0+IHRydWVcbiAgcHJvdmlkZXNTdWdnZXN0aW9uczogKGFyZ3MpIC0+IHRydWVcbiAgcHJvdmlkZXNBZGRpbmc6IChhcmdzKSAtPiBmYWxzZSAjIFVzZXJzIHNob3VsZG4ndCBiZSBhZGRpbmcgdG8gdGhlIHN5c3RlbSBkaWN0aW9uYXJ5LlxuXG4gIGNoZWNrOiAoYXJncywgdGV4dCkgLT5cbiAgICBAZGVmZXJyZWRJbml0KClcbiAgICB7aW52ZXJ0SW5jb3JyZWN0QXNDb3JyZWN0OiB0cnVlLCBpbmNvcnJlY3Q6IEBzcGVsbGNoZWNrZXIuY2hlY2tTcGVsbGluZyh0ZXh0KX1cblxuICBzdWdnZXN0OiAoYXJncywgd29yZCkgLT5cbiAgICBAZGVmZXJyZWRJbml0KClcbiAgICBAc3BlbGxjaGVja2VyLmdldENvcnJlY3Rpb25zRm9yTWlzc3BlbGxpbmcod29yZClcblxuICBkZWZlcnJlZEluaXQ6IC0+XG4gICAgIyBJZiB3ZSBhbHJlYWR5IGhhdmUgYSBzcGVsbGNoZWNrZXIsIHRoZW4gd2UgZG9uJ3QgaGF2ZSB0byBkbyBhbnl0aGluZy5cbiAgICBpZiBAc3BlbGxjaGVja2VyXG4gICAgICByZXR1cm5cblxuICAgICMgSW5pdGlhbGl6ZSB0aGUgc3BlbGwgY2hlY2tlciB3aGljaCBjYW4gdGFrZSBzb21lIHRpbWUuXG4gICAgQHNwZWxsY2hlY2tlciA9IG5ldyBzcGVsbGNoZWNrZXIuU3BlbGxjaGVja2VyXG5cbiAgICAjIFdpbmRvd3MgdXNlcyBpdHMgb3duIEFQSSBhbmQgdGhlIHBhdGhzIGFyZSB1bmltcG9ydGFudCwgb25seSBhdHRlbXB0aW5nXG4gICAgIyB0byBsb2FkIGl0IHdvcmtzLlxuICAgIGlmIC93aW4zMi8udGVzdCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICBpZiBAc3BlbGxjaGVja2VyLnNldERpY3Rpb25hcnkgQGxvY2FsZSwgXCJDOlxcXFxcIlxuICAgICAgICByZXR1cm5cblxuICAgICMgQ2hlY2sgdGhlIHBhdGhzIHN1cHBsaWVkIGJ5IHRoZSB1c2VyLlxuICAgIGZvciBwYXRoIGluIEBwYXRoc1xuICAgICAgaWYgQHNwZWxsY2hlY2tlci5zZXREaWN0aW9uYXJ5IEBsb2NhbGUsIHBhdGhcbiAgICAgICAgcmV0dXJuXG5cbiAgICAjIEZvciBMaW51eCwgd2UgaGF2ZSB0byBzZWFyY2ggdGhlIGRpcmVjdG9yeSBwYXRocyB0byBmaW5kIHRoZSBkaWN0aW9uYXJ5LlxuICAgIGlmIC9saW51eC8udGVzdCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICBpZiBAc3BlbGxjaGVja2VyLnNldERpY3Rpb25hcnkgQGxvY2FsZSwgXCIvdXNyL3NoYXJlL2h1bnNwZWxsXCJcbiAgICAgICAgcmV0dXJuXG4gICAgICBpZiBAc3BlbGxjaGVja2VyLnNldERpY3Rpb25hcnkgQGxvY2FsZSwgXCIvdXNyL3NoYXJlL215c3BlbGwvZGljdHNcIlxuICAgICAgICByZXR1cm5cblxuICAgICMgT1MgWCB1c2VzIHRoZSBmb2xsb3dpbmcgcGF0aHMuXG4gICAgaWYgL2Rhcndpbi8udGVzdCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICBpZiBAc3BlbGxjaGVja2VyLnNldERpY3Rpb25hcnkgQGxvY2FsZSwgXCIvXCJcbiAgICAgICAgcmV0dXJuXG4gICAgICBpZiBAc3BlbGxjaGVja2VyLnNldERpY3Rpb25hcnkgQGxvY2FsZSwgXCIvU3lzdGVtL0xpYnJhcnkvU3BlbGxpbmdcIlxuICAgICAgICByZXR1cm5cblxuICAgICMgVHJ5IHRoZSBwYWNrYWdlZCBsaWJyYXJ5IGluc2lkZSB0aGUgbm9kZV9tb2R1bGVzLiBgZ2V0RGljdGlvbmFyeVBhdGhgIGlzXG4gICAgIyBub3QgYXZhaWxhYmxlLCBzbyB3ZSBoYXZlIHRvIGZha2UgaXQuIFRoaXMgd2lsbCBvbmx5IHdvcmsgZm9yIGVuLVVTLlxuICAgIHBhdGggPSByZXF1aXJlICdwYXRoJ1xuICAgIHZlbmRvciA9IHBhdGguam9pbiBfX2Rpcm5hbWUsIFwiLi5cIiwgXCJub2RlX21vZHVsZXNcIiwgXCJzcGVsbGNoZWNrZXJcIiwgXCJ2ZW5kb3JcIiwgXCJodW5zcGVsbF9kaWN0aW9uYXJpZXNcIlxuICAgIGlmIEBzcGVsbGNoZWNrZXIuc2V0RGljdGlvbmFyeSBAbG9jYWxlLCB2ZW5kb3JcbiAgICAgIHJldHVyblxuXG4gICAgIyBJZiB3ZSBmZWxsIHRocm91Z2ggYWxsIHRoZSBpZiBibG9ja3MsIHRoZW4gd2UgY291bGRuJ3QgbG9hZCB0aGUgZGljdGlvbmFyeS5cbiAgICBAZW5hYmxlZCA9IGZhbHNlXG4gICAgQHJlYXNvbiA9IFwiQ2Fubm90IGZpbmQgZGljdGlvbmFyeSBmb3IgXCIgKyBAbG9jYWxlICsgXCIuXCJcbiAgICBjb25zb2xlLmxvZyBAZ2V0SWQoKSwgXCJDYW4ndCBsb2FkIFwiICsgQGxvY2FsZSArIFwiOiBcIiArIEByZWFzb25cblxubW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW1DaGVja2VyXG4iXX0=
