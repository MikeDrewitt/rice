(function() {
  var SpellCheckerManager, manager;

  SpellCheckerManager = (function() {
    function SpellCheckerManager() {}

    SpellCheckerManager.prototype.checkers = [];

    SpellCheckerManager.prototype.checkerPaths = [];

    SpellCheckerManager.prototype.locales = [];

    SpellCheckerManager.prototype.localePaths = [];

    SpellCheckerManager.prototype.useLocales = false;

    SpellCheckerManager.prototype.localeCheckers = null;

    SpellCheckerManager.prototype.knownWords = [];

    SpellCheckerManager.prototype.addKnownWords = false;

    SpellCheckerManager.prototype.knownWordsChecker = null;

    SpellCheckerManager.prototype.isTask = false;

    SpellCheckerManager.prototype.setGlobalArgs = function(data) {
      var _, changed, checker, checkers, i, len, ref, removeKnownWordsChecker, removeLocaleCheckers;
      _ = require("underscore-plus");
      changed = false;
      removeLocaleCheckers = false;
      removeKnownWordsChecker = false;
      if (!_.isEqual(this.locales, data.locales)) {
        if (!this.localeCheckers || ((ref = data.locales) != null ? ref.length : void 0) !== 0) {
          this.locales = data.locales;
          removeLocaleCheckers = true;
        }
      }
      if (!_.isEqual(this.localePaths, data.localePaths)) {
        this.localePaths = data.localePaths;
        removeLocaleCheckers = true;
      }
      if (this.useLocales !== data.useLocales) {
        this.useLocales = data.useLocales;
        removeLocaleCheckers = true;
      }
      if (this.knownWords !== data.knownWords) {
        this.knownWords = data.knownWords;
        removeKnownWordsChecker = true;
        changed = true;
      }
      if (this.addKnownWords !== data.addKnownWords) {
        this.addKnownWords = data.addKnownWords;
        removeKnownWordsChecker = true;
      }
      if (removeLocaleCheckers && this.localeCheckers) {
        checkers = this.localeCheckers;
        for (i = 0, len = checkers.length; i < len; i++) {
          checker = checkers[i];
          this.removeSpellChecker(checker);
        }
        this.localeCheckers = null;
        changed = true;
      }
      if (removeKnownWordsChecker && this.knownWordsChecker) {
        this.removeSpellChecker(this.knownWordsChecker);
        this.knownWordsChecker = null;
        changed = true;
      }
      if (changed) {
        return this.emitSettingsChanged();
      }
    };

    SpellCheckerManager.prototype.emitSettingsChanged = function() {
      if (this.isTask) {
        return emit("spell-check:settings-changed");
      }
    };

    SpellCheckerManager.prototype.addCheckerPath = function(checkerPath) {
      var checker;
      checker = require(checkerPath);
      return this.addPluginChecker(checker);
    };

    SpellCheckerManager.prototype.addPluginChecker = function(checker) {
      this.addSpellChecker(checker);
      return this.emitSettingsChanged();
    };

    SpellCheckerManager.prototype.addSpellChecker = function(checker) {
      return this.checkers.push(checker);
    };

    SpellCheckerManager.prototype.removeSpellChecker = function(spellChecker) {
      return this.checkers = this.checkers.filter(function(plugin) {
        return plugin !== spellChecker;
      });
    };

    SpellCheckerManager.prototype.check = function(args, text) {
      var checker, correct, i, incorrect, incorrects, intersection, invertedCorrect, j, k, l, len, len1, len2, len3, len4, lineBeginIndex, lineEndIndex, lineRange, m, misspellings, multirange, newIncorrect, range, rangeIndex, rangeRange, ref, ref1, ref2, ref3, removeRange, results, row;
      this.init();
      multirange = require('multi-integer-range');
      correct = new multirange.MultiRange([]);
      incorrects = [];
      ref = this.checkers;
      for (i = 0, len = ref.length; i < len; i++) {
        checker = ref[i];
        if (!checker.isEnabled() || !checker.providesSpelling(args)) {
          continue;
        }
        results = checker.check(args, text);
        if (results.invertIncorrectAsCorrect && results.incorrect) {
          invertedCorrect = new multirange.MultiRange([[0, text.length]]);
          removeRange = new multirange.MultiRange([]);
          ref1 = results.incorrect;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            range = ref1[j];
            removeRange.appendRange(range.start, range.end);
          }
          invertedCorrect.subtract(removeRange);
          correct.append(invertedCorrect);
        } else if (results.correct) {
          ref2 = results.correct;
          for (k = 0, len2 = ref2.length; k < len2; k++) {
            range = ref2[k];
            correct.appendRange(range.start, range.end);
          }
        }
        if (results.incorrect) {
          newIncorrect = new multirange.MultiRange([]);
          incorrects.push(newIncorrect);
          ref3 = results.incorrect;
          for (l = 0, len3 = ref3.length; l < len3; l++) {
            range = ref3[l];
            newIncorrect.appendRange(range.start, range.end);
          }
        }
      }
      if (incorrects.length === 0) {
        return {
          id: args.id,
          misspellings: []
        };
      }
      intersection = null;
      for (m = 0, len4 = incorrects.length; m < len4; m++) {
        incorrect = incorrects[m];
        if (intersection === null) {
          intersection = incorrect;
        } else {
          intersection.append(incorrect);
        }
      }
      if (intersection.length === 0) {
        return {
          id: args.id,
          misspellings: []
        };
      }
      if (correct.ranges.length > 0) {
        intersection.subtract(correct);
      }
      row = 0;
      rangeIndex = 0;
      lineBeginIndex = 0;
      misspellings = [];
      while (lineBeginIndex < text.length && rangeIndex < intersection.ranges.length) {
        lineEndIndex = text.indexOf('\n', lineBeginIndex);
        if (lineEndIndex === -1) {
          lineEndIndex = 2e308;
        }
        while (true) {
          range = intersection.ranges[rangeIndex];
          if (range && range[0] < lineEndIndex) {
            lineRange = new multirange.MultiRange([]).appendRange(lineBeginIndex, lineEndIndex);
            rangeRange = new multirange.MultiRange([]).appendRange(range[0], range[1]);
            lineRange.intersect(rangeRange);
            this.addMisspellings(misspellings, row, lineRange.ranges[0], lineBeginIndex, text);
            if (lineEndIndex >= range[1]) {
              rangeIndex++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        lineBeginIndex = lineEndIndex + 1;
        row++;
      }
      return {
        id: args.id,
        misspellings: misspellings
      };
    };

    SpellCheckerManager.prototype.suggest = function(args, word) {
      var checker, i, index, j, k, key, keys, l, len, len1, len2, len3, len4, m, priority, ref, ref1, results, s, seen, suggestion, suggestions, target, targets, that;
      this.init();
      suggestions = [];
      ref = this.checkers;
      for (i = 0, len = ref.length; i < len; i++) {
        checker = ref[i];
        if (!checker.isEnabled() || !checker.providesSuggestions(args)) {
          continue;
        }
        index = 0;
        priority = checker.getPriority();
        ref1 = checker.suggest(args, word);
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          suggestion = ref1[j];
          suggestions.push({
            isSuggestion: true,
            priority: priority,
            index: index++,
            suggestion: suggestion,
            label: suggestion
          });
        }
      }
      keys = Object.keys(suggestions).sort(function(key1, key2) {
        var value1, value2, weight1, weight2;
        value1 = suggestions[key1];
        value2 = suggestions[key2];
        weight1 = value1.priority + value1.index;
        weight2 = value2.priority + value2.index;
        if (weight1 !== weight2) {
          return weight1 - weight2;
        }
        return value1.suggestion.localeCompare(value2.suggestion);
      });
      results = [];
      seen = [];
      for (k = 0, len2 = keys.length; k < len2; k++) {
        key = keys[k];
        s = suggestions[key];
        if (seen.hasOwnProperty(s.suggestion)) {
          continue;
        }
        results.push(s);
        seen[s.suggestion] = 1;
      }
      that = this;
      keys = Object.keys(this.checkers).sort(function(key1, key2) {
        var value1, value2;
        value1 = that.checkers[key1];
        value2 = that.checkers[key2];
        return value1.getPriority() - value2.getPriority();
      });
      for (l = 0, len3 = keys.length; l < len3; l++) {
        key = keys[l];
        checker = this.checkers[key];
        if (!checker.isEnabled() || !checker.providesAdding(args)) {
          continue;
        }
        targets = checker.getAddingTargets(args);
        for (m = 0, len4 = targets.length; m < len4; m++) {
          target = targets[m];
          target.plugin = checker;
          target.word = word;
          target.isSuggestion = false;
          results.push(target);
        }
      }
      return results;
    };

    SpellCheckerManager.prototype.addMisspellings = function(misspellings, row, range, lineBeginIndex, text) {
      var i, len, markBeginIndex, markEndIndex, part, parts, substring, substringIndex;
      substring = text.substring(range[0], range[1]);
      if (/\s+/.test(substring)) {
        parts = substring.split(/(\s+)/);
        substringIndex = 0;
        for (i = 0, len = parts.length; i < len; i++) {
          part = parts[i];
          if (!/\s+/.test(part)) {
            markBeginIndex = range[0] - lineBeginIndex + substringIndex;
            markEndIndex = markBeginIndex + part.length;
            misspellings.push([[row, markBeginIndex], [row, markEndIndex]]);
          }
          substringIndex += part.length;
        }
        return;
      }
      return misspellings.push([[row, range[0] - lineBeginIndex], [row, range[1] - lineBeginIndex]]);
    };

    SpellCheckerManager.prototype.init = function() {
      var KnownWordsChecker, SystemChecker, checker, defaultLocale, i, len, locale, ref, separatorChar;
      if (this.localeCheckers === null) {
        this.localeCheckers = [];
        if (this.useLocales) {
          if (!this.locales.length) {
            defaultLocale = process.env.LANG;
            if (defaultLocale) {
              this.locales = [defaultLocale.split('.')[0]];
            }
          }
          if (!this.locales.length) {
            defaultLocale = navigator.language;
            if (defaultLocale && defaultLocale.length === 5) {
              separatorChar = defaultLocale.charAt(2);
              if (separatorChar === '_' || separatorChar === '-') {
                this.locales = [defaultLocale];
              }
            }
          }
          if (!this.locales.length) {
            this.locales = ['en_US'];
          }
          SystemChecker = require("./system-checker");
          ref = this.locales;
          for (i = 0, len = ref.length; i < len; i++) {
            locale = ref[i];
            checker = new SystemChecker(locale, this.localePaths);
            this.addSpellChecker(checker);
            this.localeCheckers.push(checker);
          }
        }
      }
      if (this.knownWordsChecker === null) {
        KnownWordsChecker = require('./known-words-checker');
        this.knownWordsChecker = new KnownWordsChecker(this.knownWords);
        this.knownWordsChecker.enableAdd = this.addKnownWords;
        return this.addSpellChecker(this.knownWordsChecker);
      }
    };

    SpellCheckerManager.prototype.deactivate = function() {
      this.checkers = [];
      this.locales = [];
      this.localePaths = [];
      this.useLocales = false;
      this.localeCheckers = null;
      this.knownWords = [];
      this.addKnownWords = false;
      return this.knownWordsChecker = null;
    };

    SpellCheckerManager.prototype.reloadLocales = function() {
      var i, len, localeChecker, ref;
      if (this.localeCheckers) {
        ref = this.localeCheckers;
        for (i = 0, len = ref.length; i < len; i++) {
          localeChecker = ref[i];
          this.removeSpellChecker(localeChecker);
        }
        return this.localeCheckers = null;
      }
    };

    SpellCheckerManager.prototype.reloadKnownWords = function() {
      if (this.knownWordsChecker) {
        this.removeSpellChecker(this.knownWordsChecker);
        return this.knownWordsChecker = null;
      }
    };

    return SpellCheckerManager;

  })();

  manager = new SpellCheckerManager;

  module.exports = manager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvc3BlbGwtY2hlY2stbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFNOzs7a0NBQ0osUUFBQSxHQUFVOztrQ0FDVixZQUFBLEdBQWM7O2tDQUNkLE9BQUEsR0FBUzs7a0NBQ1QsV0FBQSxHQUFhOztrQ0FDYixVQUFBLEdBQVk7O2tDQUNaLGNBQUEsR0FBZ0I7O2tDQUNoQixVQUFBLEdBQVk7O2tDQUNaLGFBQUEsR0FBZTs7a0NBQ2YsaUJBQUEsR0FBbUI7O2tDQUNuQixNQUFBLEdBQVE7O2tDQUVSLGFBQUEsR0FBZSxTQUFDLElBQUQ7QUFFYixVQUFBO01BQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjtNQUlKLE9BQUEsR0FBVTtNQUNWLG9CQUFBLEdBQXVCO01BQ3ZCLHVCQUFBLEdBQTBCO01BRTFCLElBQUcsQ0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLElBQUMsQ0FBQSxPQUFYLEVBQW9CLElBQUksQ0FBQyxPQUF6QixDQUFQO1FBR0UsSUFBRyxDQUFJLElBQUMsQ0FBQSxjQUFMLHVDQUFtQyxDQUFFLGdCQUFkLEtBQTBCLENBQXBEO1VBQ0UsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJLENBQUM7VUFDaEIsb0JBQUEsR0FBdUIsS0FGekI7U0FIRjs7TUFNQSxJQUFHLENBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFDLENBQUEsV0FBWCxFQUF3QixJQUFJLENBQUMsV0FBN0IsQ0FBUDtRQUNFLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSSxDQUFDO1FBQ3BCLG9CQUFBLEdBQXVCLEtBRnpCOztNQUdBLElBQUcsSUFBQyxDQUFBLFVBQUQsS0FBaUIsSUFBSSxDQUFDLFVBQXpCO1FBQ0UsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLENBQUM7UUFDbkIsb0JBQUEsR0FBdUIsS0FGekI7O01BR0EsSUFBRyxJQUFDLENBQUEsVUFBRCxLQUFpQixJQUFJLENBQUMsVUFBekI7UUFDRSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUksQ0FBQztRQUNuQix1QkFBQSxHQUEwQjtRQUMxQixPQUFBLEdBQVUsS0FIWjs7TUFJQSxJQUFHLElBQUMsQ0FBQSxhQUFELEtBQW9CLElBQUksQ0FBQyxhQUE1QjtRQUNFLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUksQ0FBQztRQUN0Qix1QkFBQSxHQUEwQixLQUY1Qjs7TUFPQSxJQUFHLG9CQUFBLElBQXlCLElBQUMsQ0FBQSxjQUE3QjtRQUNFLFFBQUEsR0FBVyxJQUFDLENBQUE7QUFDWixhQUFBLDBDQUFBOztVQUNFLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixPQUFwQjtBQURGO1FBRUEsSUFBQyxDQUFBLGNBQUQsR0FBa0I7UUFDbEIsT0FBQSxHQUFVLEtBTFo7O01BT0EsSUFBRyx1QkFBQSxJQUE0QixJQUFDLENBQUEsaUJBQWhDO1FBQ0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxpQkFBckI7UUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7UUFDckIsT0FBQSxHQUFVLEtBSFo7O01BUUEsSUFBRyxPQUFIO2VBQ0UsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFERjs7SUFoRGE7O2tDQW1EZixtQkFBQSxHQUFxQixTQUFBO01BQ25CLElBQUcsSUFBQyxDQUFBLE1BQUo7ZUFDRSxJQUFBLENBQUssOEJBQUwsRUFERjs7SUFEbUI7O2tDQUlyQixjQUFBLEdBQWdCLFNBQUMsV0FBRDtBQUNkLFVBQUE7TUFBQSxPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7YUFDVixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsT0FBbEI7SUFGYzs7a0NBSWhCLGdCQUFBLEdBQWtCLFNBQUMsT0FBRDtNQUVoQixJQUFDLENBQUEsZUFBRCxDQUFpQixPQUFqQjthQUlBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO0lBTmdCOztrQ0FRbEIsZUFBQSxHQUFpQixTQUFDLE9BQUQ7YUFDZixJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxPQUFmO0lBRGU7O2tDQUdqQixrQkFBQSxHQUFvQixTQUFDLFlBQUQ7YUFDbEIsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsU0FBQyxNQUFEO2VBQVksTUFBQSxLQUFZO01BQXhCLENBQWpCO0lBRE07O2tDQUdwQixLQUFBLEdBQU8sU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVMLFVBQUE7TUFBQSxJQUFDLENBQUEsSUFBRCxDQUFBO01BR0EsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjtNQU9iLE9BQUEsR0FBYyxJQUFBLFVBQVUsQ0FBQyxVQUFYLENBQXNCLEVBQXRCO01BQ2QsVUFBQSxHQUFhO0FBRWI7QUFBQSxXQUFBLHFDQUFBOztRQUVFLElBQUcsQ0FBSSxPQUFPLENBQUMsU0FBUixDQUFBLENBQUosSUFBMkIsQ0FBSSxPQUFPLENBQUMsZ0JBQVIsQ0FBeUIsSUFBekIsQ0FBbEM7QUFDRSxtQkFERjs7UUFNQSxPQUFBLEdBQVUsT0FBTyxDQUFDLEtBQVIsQ0FBYyxJQUFkLEVBQW9CLElBQXBCO1FBRVYsSUFBRyxPQUFPLENBQUMsd0JBQVIsSUFBcUMsT0FBTyxDQUFDLFNBQWhEO1VBR0UsZUFBQSxHQUFzQixJQUFBLFVBQVUsQ0FBQyxVQUFYLENBQXNCLENBQUMsQ0FBQyxDQUFELEVBQUksSUFBSSxDQUFDLE1BQVQsQ0FBRCxDQUF0QjtVQUN0QixXQUFBLEdBQWtCLElBQUEsVUFBVSxDQUFDLFVBQVgsQ0FBc0IsRUFBdEI7QUFDbEI7QUFBQSxlQUFBLHdDQUFBOztZQUNFLFdBQVcsQ0FBQyxXQUFaLENBQXdCLEtBQUssQ0FBQyxLQUE5QixFQUFxQyxLQUFLLENBQUMsR0FBM0M7QUFERjtVQUVBLGVBQWUsQ0FBQyxRQUFoQixDQUF5QixXQUF6QjtVQUlBLE9BQU8sQ0FBQyxNQUFSLENBQWUsZUFBZixFQVhGO1NBQUEsTUFZSyxJQUFHLE9BQU8sQ0FBQyxPQUFYO0FBQ0g7QUFBQSxlQUFBLHdDQUFBOztZQUNFLE9BQU8sQ0FBQyxXQUFSLENBQW9CLEtBQUssQ0FBQyxLQUExQixFQUFpQyxLQUFLLENBQUMsR0FBdkM7QUFERixXQURHOztRQUlMLElBQUcsT0FBTyxDQUFDLFNBQVg7VUFDRSxZQUFBLEdBQW1CLElBQUEsVUFBVSxDQUFDLFVBQVgsQ0FBc0IsRUFBdEI7VUFDbkIsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsWUFBaEI7QUFFQTtBQUFBLGVBQUEsd0NBQUE7O1lBQ0UsWUFBWSxDQUFDLFdBQWIsQ0FBeUIsS0FBSyxDQUFDLEtBQS9CLEVBQXNDLEtBQUssQ0FBQyxHQUE1QztBQURGLFdBSkY7O0FBMUJGO01BbUNBLElBQUcsVUFBVSxDQUFDLE1BQVgsS0FBcUIsQ0FBeEI7QUFDRSxlQUFPO1VBQUMsRUFBQSxFQUFJLElBQUksQ0FBQyxFQUFWO1VBQWMsWUFBQSxFQUFjLEVBQTVCO1VBRFQ7O01BVUEsWUFBQSxHQUFlO0FBRWYsV0FBQSw4Q0FBQTs7UUFDRSxJQUFHLFlBQUEsS0FBZ0IsSUFBbkI7VUFDRSxZQUFBLEdBQWUsVUFEakI7U0FBQSxNQUFBO1VBR0UsWUFBWSxDQUFDLE1BQWIsQ0FBb0IsU0FBcEIsRUFIRjs7QUFERjtNQU9BLElBQUcsWUFBWSxDQUFDLE1BQWIsS0FBdUIsQ0FBMUI7QUFDRSxlQUFPO1VBQUMsRUFBQSxFQUFJLElBQUksQ0FBQyxFQUFWO1VBQWMsWUFBQSxFQUFjLEVBQTVCO1VBRFQ7O01BTUEsSUFBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQWYsR0FBd0IsQ0FBM0I7UUFDRSxZQUFZLENBQUMsUUFBYixDQUFzQixPQUF0QixFQURGOztNQUtBLEdBQUEsR0FBTTtNQUNOLFVBQUEsR0FBYTtNQUNiLGNBQUEsR0FBaUI7TUFDakIsWUFBQSxHQUFlO0FBQ2YsYUFBTSxjQUFBLEdBQWlCLElBQUksQ0FBQyxNQUF0QixJQUFpQyxVQUFBLEdBQWEsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUF4RTtRQUdFLFlBQUEsR0FBZSxJQUFJLENBQUMsT0FBTCxDQUFhLElBQWIsRUFBbUIsY0FBbkI7UUFDZixJQUFHLFlBQUEsS0FBZ0IsQ0FBQyxDQUFwQjtVQUNFLFlBQUEsR0FBZSxNQURqQjs7QUFJQSxlQUFBLElBQUE7VUFDRSxLQUFBLEdBQVEsWUFBWSxDQUFDLE1BQU8sQ0FBQSxVQUFBO1VBQzVCLElBQUcsS0FBQSxJQUFVLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxZQUF4QjtZQUlFLFNBQUEsR0FBZ0IsSUFBQSxVQUFVLENBQUMsVUFBWCxDQUFzQixFQUF0QixDQUF5QixDQUFDLFdBQTFCLENBQXNDLGNBQXRDLEVBQXNELFlBQXREO1lBQ2hCLFVBQUEsR0FBaUIsSUFBQSxVQUFVLENBQUMsVUFBWCxDQUFzQixFQUF0QixDQUF5QixDQUFDLFdBQTFCLENBQXNDLEtBQU0sQ0FBQSxDQUFBLENBQTVDLEVBQWdELEtBQU0sQ0FBQSxDQUFBLENBQXREO1lBQ2pCLFNBQVMsQ0FBQyxTQUFWLENBQW9CLFVBQXBCO1lBTUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsWUFBakIsRUFBK0IsR0FBL0IsRUFBb0MsU0FBUyxDQUFDLE1BQU8sQ0FBQSxDQUFBLENBQXJELEVBQXlELGNBQXpELEVBQXlFLElBQXpFO1lBS0EsSUFBRyxZQUFBLElBQWdCLEtBQU0sQ0FBQSxDQUFBLENBQXpCO2NBQ0UsVUFBQSxHQURGO2FBQUEsTUFBQTtBQUdFLG9CQUhGO2FBakJGO1dBQUEsTUFBQTtBQXNCRSxrQkF0QkY7O1FBRkY7UUEwQkEsY0FBQSxHQUFpQixZQUFBLEdBQWU7UUFDaEMsR0FBQTtNQW5DRjthQXNDQTtRQUFDLEVBQUEsRUFBSSxJQUFJLENBQUMsRUFBVjtRQUFjLFlBQUEsRUFBYyxZQUE1Qjs7SUExSEs7O2tDQTRIUCxPQUFBLEdBQVMsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUVQLFVBQUE7TUFBQSxJQUFDLENBQUEsSUFBRCxDQUFBO01BT0EsV0FBQSxHQUFjO0FBRWQ7QUFBQSxXQUFBLHFDQUFBOztRQUVFLElBQUcsQ0FBSSxPQUFPLENBQUMsU0FBUixDQUFBLENBQUosSUFBMkIsQ0FBSSxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsSUFBNUIsQ0FBbEM7QUFDRSxtQkFERjs7UUFJQSxLQUFBLEdBQVE7UUFDUixRQUFBLEdBQVcsT0FBTyxDQUFDLFdBQVIsQ0FBQTtBQUVYO0FBQUEsYUFBQSx3Q0FBQTs7VUFDRSxXQUFXLENBQUMsSUFBWixDQUFpQjtZQUFDLFlBQUEsRUFBYyxJQUFmO1lBQXFCLFFBQUEsRUFBVSxRQUEvQjtZQUF5QyxLQUFBLEVBQU8sS0FBQSxFQUFoRDtZQUF5RCxVQUFBLEVBQVksVUFBckU7WUFBaUYsS0FBQSxFQUFPLFVBQXhGO1dBQWpCO0FBREY7QUFURjtNQWFBLElBQUEsR0FBTyxNQUFNLENBQUMsSUFBUCxDQUFZLFdBQVosQ0FBd0IsQ0FBQyxJQUF6QixDQUE4QixTQUFDLElBQUQsRUFBTyxJQUFQO0FBQ25DLFlBQUE7UUFBQSxNQUFBLEdBQVMsV0FBWSxDQUFBLElBQUE7UUFDckIsTUFBQSxHQUFTLFdBQVksQ0FBQSxJQUFBO1FBQ3JCLE9BQUEsR0FBVSxNQUFNLENBQUMsUUFBUCxHQUFrQixNQUFNLENBQUM7UUFDbkMsT0FBQSxHQUFVLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLE1BQU0sQ0FBQztRQUVuQyxJQUFHLE9BQUEsS0FBYSxPQUFoQjtBQUNFLGlCQUFPLE9BQUEsR0FBVSxRQURuQjs7QUFHQSxlQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBbEIsQ0FBZ0MsTUFBTSxDQUFDLFVBQXZDO01BVDRCLENBQTlCO01BYVAsT0FBQSxHQUFVO01BQ1YsSUFBQSxHQUFPO0FBQ1AsV0FBQSx3Q0FBQTs7UUFDRSxDQUFBLEdBQUksV0FBWSxDQUFBLEdBQUE7UUFDaEIsSUFBRyxJQUFJLENBQUMsY0FBTCxDQUFvQixDQUFDLENBQUMsVUFBdEIsQ0FBSDtBQUNFLG1CQURGOztRQUVBLE9BQU8sQ0FBQyxJQUFSLENBQWEsQ0FBYjtRQUNBLElBQUssQ0FBQSxDQUFDLENBQUMsVUFBRixDQUFMLEdBQXFCO0FBTHZCO01BUUEsSUFBQSxHQUFPO01BQ1AsSUFBQSxHQUFPLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLFFBQWIsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixTQUFDLElBQUQsRUFBTyxJQUFQO0FBQ2pDLFlBQUE7UUFBQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFFBQVMsQ0FBQSxJQUFBO1FBQ3ZCLE1BQUEsR0FBUyxJQUFJLENBQUMsUUFBUyxDQUFBLElBQUE7ZUFDdkIsTUFBTSxDQUFDLFdBQVAsQ0FBQSxDQUFBLEdBQXVCLE1BQU0sQ0FBQyxXQUFQLENBQUE7TUFIVSxDQUE1QjtBQUtQLFdBQUEsd0NBQUE7O1FBRUUsT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFTLENBQUEsR0FBQTtRQUNwQixJQUFHLENBQUksT0FBTyxDQUFDLFNBQVIsQ0FBQSxDQUFKLElBQTJCLENBQUksT0FBTyxDQUFDLGNBQVIsQ0FBdUIsSUFBdkIsQ0FBbEM7QUFDRSxtQkFERjs7UUFJQSxPQUFBLEdBQVUsT0FBTyxDQUFDLGdCQUFSLENBQXlCLElBQXpCO0FBQ1YsYUFBQSwyQ0FBQTs7VUFDRSxNQUFNLENBQUMsTUFBUCxHQUFnQjtVQUNoQixNQUFNLENBQUMsSUFBUCxHQUFjO1VBQ2QsTUFBTSxDQUFDLFlBQVAsR0FBc0I7VUFDdEIsT0FBTyxDQUFDLElBQVIsQ0FBYSxNQUFiO0FBSkY7QUFSRjthQWVBO0lBcEVPOztrQ0FzRVQsZUFBQSxHQUFpQixTQUFDLFlBQUQsRUFBZSxHQUFmLEVBQW9CLEtBQXBCLEVBQTJCLGNBQTNCLEVBQTJDLElBQTNDO0FBR2YsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsU0FBTCxDQUFlLEtBQU0sQ0FBQSxDQUFBLENBQXJCLEVBQXlCLEtBQU0sQ0FBQSxDQUFBLENBQS9CO01BRVosSUFBRyxLQUFLLENBQUMsSUFBTixDQUFXLFNBQVgsQ0FBSDtRQUdFLEtBQUEsR0FBUSxTQUFTLENBQUMsS0FBVixDQUFnQixPQUFoQjtRQUNSLGNBQUEsR0FBaUI7QUFDakIsYUFBQSx1Q0FBQTs7VUFDRSxJQUFHLENBQUksS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQVA7WUFDRSxjQUFBLEdBQWlCLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxjQUFYLEdBQTRCO1lBQzdDLFlBQUEsR0FBZSxjQUFBLEdBQWlCLElBQUksQ0FBQztZQUNyQyxZQUFZLENBQUMsSUFBYixDQUFrQixDQUFDLENBQUMsR0FBRCxFQUFNLGNBQU4sQ0FBRCxFQUF3QixDQUFDLEdBQUQsRUFBTSxZQUFOLENBQXhCLENBQWxCLEVBSEY7O1VBS0EsY0FBQSxJQUFrQixJQUFJLENBQUM7QUFOekI7QUFRQSxlQWJGOzthQWdCQSxZQUFZLENBQUMsSUFBYixDQUFrQixDQUNoQixDQUFDLEdBQUQsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQUFOLEdBQVcsY0FBakIsQ0FEZ0IsRUFFaEIsQ0FBQyxHQUFELEVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBTixHQUFXLGNBQWpCLENBRmdCLENBQWxCO0lBckJlOztrQ0EwQmpCLElBQUEsR0FBTSxTQUFBO0FBRUosVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGNBQUQsS0FBbUIsSUFBdEI7UUFFRSxJQUFDLENBQUEsY0FBRCxHQUFrQjtRQUVsQixJQUFHLElBQUMsQ0FBQSxVQUFKO1VBR0UsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBaEI7WUFDRSxhQUFBLEdBQWdCLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDNUIsSUFBRyxhQUFIO2NBQ0UsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLGFBQWEsQ0FBQyxLQUFkLENBQW9CLEdBQXBCLENBQXlCLENBQUEsQ0FBQSxDQUExQixFQURiO2FBRkY7O1VBVUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBaEI7WUFDRSxhQUFBLEdBQWdCLFNBQVMsQ0FBQztZQUMxQixJQUFHLGFBQUEsSUFBa0IsYUFBYSxDQUFDLE1BQWQsS0FBd0IsQ0FBN0M7Y0FDRSxhQUFBLEdBQWdCLGFBQWEsQ0FBQyxNQUFkLENBQXFCLENBQXJCO2NBQ2hCLElBQUcsYUFBQSxLQUFpQixHQUFqQixJQUF3QixhQUFBLEtBQWlCLEdBQTVDO2dCQUNFLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBQyxhQUFELEVBRGI7ZUFGRjthQUZGOztVQVVBLElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQWhCO1lBQ0UsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLE9BQUQsRUFEYjs7VUFJQSxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjtBQUNoQjtBQUFBLGVBQUEscUNBQUE7O1lBQ0UsT0FBQSxHQUFjLElBQUEsYUFBQSxDQUFjLE1BQWQsRUFBc0IsSUFBQyxDQUFBLFdBQXZCO1lBQ2QsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsT0FBakI7WUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQXFCLE9BQXJCO0FBSEYsV0E1QkY7U0FKRjs7TUFzQ0EsSUFBRyxJQUFDLENBQUEsaUJBQUQsS0FBc0IsSUFBekI7UUFDRSxpQkFBQSxHQUFvQixPQUFBLENBQVEsdUJBQVI7UUFDcEIsSUFBQyxDQUFBLGlCQUFELEdBQXlCLElBQUEsaUJBQUEsQ0FBa0IsSUFBQyxDQUFBLFVBQW5CO1FBQ3pCLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxTQUFuQixHQUErQixJQUFDLENBQUE7ZUFDaEMsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBQyxDQUFBLGlCQUFsQixFQUpGOztJQXhDSTs7a0NBOENOLFVBQUEsR0FBWSxTQUFBO01BQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLFVBQUQsR0FBYztNQUNkLElBQUMsQ0FBQSxjQUFELEdBQWtCO01BQ2xCLElBQUMsQ0FBQSxVQUFELEdBQWM7TUFDZCxJQUFDLENBQUEsYUFBRCxHQUFpQjthQUNqQixJQUFDLENBQUEsaUJBQUQsR0FBcUI7SUFSWDs7a0NBVVosYUFBQSxHQUFlLFNBQUE7QUFDYixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsY0FBSjtBQUNFO0FBQUEsYUFBQSxxQ0FBQTs7VUFDRSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsYUFBcEI7QUFERjtlQUVBLElBQUMsQ0FBQSxjQUFELEdBQWtCLEtBSHBCOztJQURhOztrQ0FNZixnQkFBQSxHQUFrQixTQUFBO01BQ2hCLElBQUcsSUFBQyxDQUFBLGlCQUFKO1FBQ0UsSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQUMsQ0FBQSxpQkFBckI7ZUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUIsS0FGdkI7O0lBRGdCOzs7Ozs7RUFLcEIsT0FBQSxHQUFVLElBQUk7O0VBQ2QsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFyWGpCIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgU3BlbGxDaGVja2VyTWFuYWdlclxuICBjaGVja2VyczogW11cbiAgY2hlY2tlclBhdGhzOiBbXVxuICBsb2NhbGVzOiBbXVxuICBsb2NhbGVQYXRoczogW11cbiAgdXNlTG9jYWxlczogZmFsc2VcbiAgbG9jYWxlQ2hlY2tlcnM6IG51bGxcbiAga25vd25Xb3JkczogW11cbiAgYWRkS25vd25Xb3JkczogZmFsc2VcbiAga25vd25Xb3Jkc0NoZWNrZXI6IG51bGxcbiAgaXNUYXNrOiBmYWxzZVxuXG4gIHNldEdsb2JhbEFyZ3M6IChkYXRhKSAtPlxuICAgICMgV2UgbmVlZCB1bmRlcnNjb3JlIHRvIGRvIHRoZSBhcnJheSBjb21wYXJpc29ucy5cbiAgICBfID0gcmVxdWlyZSBcInVuZGVyc2NvcmUtcGx1c1wiXG5cbiAgICAjIENoZWNrIHRvIHNlZSBpZiBhbnkgdmFsdWVzIGhhdmUgY2hhbmdlZC4gV2hlbiB0aGV5IGhhdmUsIHRoZXkgY2xlYXIgb3V0XG4gICAgIyB0aGUgYXBwbGljYWJsZSBjaGVja2VyIHdoaWNoIGZvcmNlcyBhIHJlbG9hZC5cbiAgICBjaGFuZ2VkID0gZmFsc2VcbiAgICByZW1vdmVMb2NhbGVDaGVja2VycyA9IGZhbHNlXG4gICAgcmVtb3ZlS25vd25Xb3Jkc0NoZWNrZXIgPSBmYWxzZVxuXG4gICAgaWYgbm90IF8uaXNFcXVhbChAbG9jYWxlcywgZGF0YS5sb2NhbGVzKVxuICAgICAgIyBJZiB0aGUgbG9jYWxlcyBpcyBibGFuaywgdGhlbiB3ZSBhbHdheXMgY3JlYXRlIGEgZGVmYXVsdCBvbmUuIEhvd2V2ZXIsXG4gICAgICAjIGFueSBuZXcgZGF0YS5sb2NhbGVzIHdpbGwgcmVtYWluIGJsYW5rLlxuICAgICAgaWYgbm90IEBsb2NhbGVDaGVja2VycyBvciBkYXRhLmxvY2FsZXM/Lmxlbmd0aCBpc250IDBcbiAgICAgICAgQGxvY2FsZXMgPSBkYXRhLmxvY2FsZXNcbiAgICAgICAgcmVtb3ZlTG9jYWxlQ2hlY2tlcnMgPSB0cnVlXG4gICAgaWYgbm90IF8uaXNFcXVhbChAbG9jYWxlUGF0aHMsIGRhdGEubG9jYWxlUGF0aHMpXG4gICAgICBAbG9jYWxlUGF0aHMgPSBkYXRhLmxvY2FsZVBhdGhzXG4gICAgICByZW1vdmVMb2NhbGVDaGVja2VycyA9IHRydWVcbiAgICBpZiBAdXNlTG9jYWxlcyBpc250IGRhdGEudXNlTG9jYWxlc1xuICAgICAgQHVzZUxvY2FsZXMgPSBkYXRhLnVzZUxvY2FsZXNcbiAgICAgIHJlbW92ZUxvY2FsZUNoZWNrZXJzID0gdHJ1ZVxuICAgIGlmIEBrbm93bldvcmRzIGlzbnQgZGF0YS5rbm93bldvcmRzXG4gICAgICBAa25vd25Xb3JkcyA9IGRhdGEua25vd25Xb3Jkc1xuICAgICAgcmVtb3ZlS25vd25Xb3Jkc0NoZWNrZXIgPSB0cnVlXG4gICAgICBjaGFuZ2VkID0gdHJ1ZVxuICAgIGlmIEBhZGRLbm93bldvcmRzIGlzbnQgZGF0YS5hZGRLbm93bldvcmRzXG4gICAgICBAYWRkS25vd25Xb3JkcyA9IGRhdGEuYWRkS25vd25Xb3Jkc1xuICAgICAgcmVtb3ZlS25vd25Xb3Jkc0NoZWNrZXIgPSB0cnVlXG4gICAgICAjIFdlIGRvbid0IHVwZGF0ZSBgY2hhbmdlZGAgc2luY2UgaXQgZG9lc24ndCBhZmZlY3QgdGhlIHBsdWdpbnMuXG5cbiAgICAjIElmIHdlIG1hZGUgYSBjaGFuZ2UgdG8gdGhlIGNoZWNrZXJzLCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGVtIGZyb20gdGhlXG4gICAgIyBzeXN0ZW0gc28gdGhleSBjYW4gYmUgcmVpbml0aWFsaXplZC5cbiAgICBpZiByZW1vdmVMb2NhbGVDaGVja2VycyBhbmQgQGxvY2FsZUNoZWNrZXJzXG4gICAgICBjaGVja2VycyA9IEBsb2NhbGVDaGVja2Vyc1xuICAgICAgZm9yIGNoZWNrZXIgaW4gY2hlY2tlcnNcbiAgICAgICAgQHJlbW92ZVNwZWxsQ2hlY2tlciBjaGVja2VyXG4gICAgICBAbG9jYWxlQ2hlY2tlcnMgPSBudWxsXG4gICAgICBjaGFuZ2VkID0gdHJ1ZVxuXG4gICAgaWYgcmVtb3ZlS25vd25Xb3Jkc0NoZWNrZXIgYW5kIEBrbm93bldvcmRzQ2hlY2tlclxuICAgICAgQHJlbW92ZVNwZWxsQ2hlY2tlciBAa25vd25Xb3Jkc0NoZWNrZXJcbiAgICAgIEBrbm93bldvcmRzQ2hlY2tlciA9IG51bGxcbiAgICAgIGNoYW5nZWQgPSB0cnVlXG5cbiAgICAjIElmIHdlIGhhZCBhbnkgY2hhbmdlIHRvIHRoZSBzeXN0ZW0sIHdlIG5lZWQgdG8gc2VuZCBhIG1lc3NhZ2UgYmFjayB0byB0aGVcbiAgICAjIG1haW4gcHJvY2VzcyBzbyBpdCBjYW4gdHJpZ2dlciBhIHJlY2hlY2sgd2hpY2ggdGhlbiBjYWxscyBgaW5pdGAgd2hpY2hcbiAgICAjIHRoZW4gbG9jYWxlcyBhbnkgY2hhbmdlZCBsb2NhbGVzIG9yIGtub3duIHdvcmRzIGNoZWNrZXIuXG4gICAgaWYgY2hhbmdlZFxuICAgICAgQGVtaXRTZXR0aW5nc0NoYW5nZWQoKVxuXG4gIGVtaXRTZXR0aW5nc0NoYW5nZWQ6IC0+XG4gICAgaWYgQGlzVGFza1xuICAgICAgZW1pdChcInNwZWxsLWNoZWNrOnNldHRpbmdzLWNoYW5nZWRcIilcblxuICBhZGRDaGVja2VyUGF0aDogKGNoZWNrZXJQYXRoKSAtPlxuICAgIGNoZWNrZXIgPSByZXF1aXJlIGNoZWNrZXJQYXRoXG4gICAgQGFkZFBsdWdpbkNoZWNrZXIgY2hlY2tlclxuXG4gIGFkZFBsdWdpbkNoZWNrZXI6IChjaGVja2VyKSAtPlxuICAgICMgQWRkIHRoZSBzcGVsbCBjaGVja2VyIHRvIHRoZSBsaXN0LlxuICAgIEBhZGRTcGVsbENoZWNrZXIgY2hlY2tlclxuXG4gICAgIyBXZSBvbmx5IGVtaXQgYSBzZXR0aW5ncyBjaGFuZ2UgZm9yIHBsdWdpbnMgc2luY2UgdGhlIGNvcmUgY2hlY2tlcnMgYXJlXG4gICAgIyBoYW5kbGVkIGluIGEgZGlmZmVyZW50IG1hbm5lci5cbiAgICBAZW1pdFNldHRpbmdzQ2hhbmdlZCgpXG5cbiAgYWRkU3BlbGxDaGVja2VyOiAoY2hlY2tlcikgLT5cbiAgICBAY2hlY2tlcnMucHVzaCBjaGVja2VyXG5cbiAgcmVtb3ZlU3BlbGxDaGVja2VyOiAoc3BlbGxDaGVja2VyKSAtPlxuICAgIEBjaGVja2VycyA9IEBjaGVja2Vycy5maWx0ZXIgKHBsdWdpbikgLT4gcGx1Z2luIGlzbnQgc3BlbGxDaGVja2VyXG5cbiAgY2hlY2s6IChhcmdzLCB0ZXh0KSAtPlxuICAgICMgTWFrZSBzdXJlIG91ciBkZWZlcnJlZCBpbml0aWFsaXphdGlvbiBpcyBkb25lLlxuICAgIEBpbml0KClcblxuICAgICMgV2UgbmVlZCBhIGNvdXBsZSBwYWNrYWdlcy5cbiAgICBtdWx0aXJhbmdlID0gcmVxdWlyZSAnbXVsdGktaW50ZWdlci1yYW5nZSdcblxuICAgICMgRm9yIGV2ZXJ5IHJlZ2lzdGVyZWQgc3BlbGxjaGVja2VyLCB3ZSBuZWVkIHRvIGZpbmQgb3V0IHRoZSByYW5nZXMgaW4gdGhlXG4gICAgIyB0ZXh0IHRoYXQgdGhlIGNoZWNrZXIgY29uZmlybXMgYXJlIGNvcnJlY3Qgb3IgaW5kaWNhdGVzIGlzIGEgbWlzc3BlbGxpbmcuXG4gICAgIyBXZSBrZWVwIHRoZXNlIGFzIHNlcGFyYXRlIGxpc3RzIHNpbmNlIHRoZSBkaWZmZXJlbnQgY2hlY2tlcnMgbWF5IGluZGljYXRlXG4gICAgIyB0aGUgc2FtZSByYW5nZSBmb3IgZWl0aGVyIGFuZCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVtb3ZlIGNvbmZpcm1lZCB3b3Jkc1xuICAgICMgZnJvbSB0aGUgbWlzc3BlbGxlZCBvbmVzLlxuICAgIGNvcnJlY3QgPSBuZXcgbXVsdGlyYW5nZS5NdWx0aVJhbmdlKFtdKVxuICAgIGluY29ycmVjdHMgPSBbXVxuXG4gICAgZm9yIGNoZWNrZXIgaW4gQGNoZWNrZXJzXG4gICAgICAjIFdlIG9ubHkgY2FyZSBpZiB0aGlzIHBsdWdpbiBjb250cmlidXRlcyB0byBjaGVja2luZyBzcGVsbGluZy5cbiAgICAgIGlmIG5vdCBjaGVja2VyLmlzRW5hYmxlZCgpIG9yIG5vdCBjaGVja2VyLnByb3ZpZGVzU3BlbGxpbmcoYXJncylcbiAgICAgICAgY29udGludWVcblxuICAgICAgIyBHZXQgdGhlIHJlc3VsdHMgd2hpY2ggaW5jbHVkZXMgcG9zaXRpdmUgKGNvcnJlY3QpIGFuZCBuZWdhdGl2ZSAoaW5jb3JyZWN0KVxuICAgICAgIyByYW5nZXMuIElmIHdlIGhhdmUgYW4gaW5jb3JyZWN0IHJhbmdlIGJ1dCBubyBjb3JyZWN0LCBldmVyeXRoaW5nIG5vdFxuICAgICAgIyBpbiBpbmNvcnJlY3QgaXMgY29uc2lkZXJlZCBjb3JyZWN0LlxuICAgICAgcmVzdWx0cyA9IGNoZWNrZXIuY2hlY2soYXJncywgdGV4dClcblxuICAgICAgaWYgcmVzdWx0cy5pbnZlcnRJbmNvcnJlY3RBc0NvcnJlY3QgYW5kIHJlc3VsdHMuaW5jb3JyZWN0XG4gICAgICAgICMgV2UgbmVlZCB0byBhZGQgdGhlIG9wcG9zaXRlIG9mIHRoZSBpbmNvcnJlY3QgYXMgY29ycmVjdCBlbGVtZW50cyBpblxuICAgICAgICAjIHRoZSBsaXN0LiBXZSBkbyB0aGlzIGJ5IGNyZWF0aW5nIGEgc3VidHJhY3Rpb24uXG4gICAgICAgIGludmVydGVkQ29ycmVjdCA9IG5ldyBtdWx0aXJhbmdlLk11bHRpUmFuZ2UoW1swLCB0ZXh0Lmxlbmd0aF1dKVxuICAgICAgICByZW1vdmVSYW5nZSA9IG5ldyBtdWx0aXJhbmdlLk11bHRpUmFuZ2UoW10pXG4gICAgICAgIGZvciByYW5nZSBpbiByZXN1bHRzLmluY29ycmVjdFxuICAgICAgICAgIHJlbW92ZVJhbmdlLmFwcGVuZFJhbmdlKHJhbmdlLnN0YXJ0LCByYW5nZS5lbmQpXG4gICAgICAgIGludmVydGVkQ29ycmVjdC5zdWJ0cmFjdChyZW1vdmVSYW5nZSlcblxuICAgICAgICAjIEV2ZXJ5dGhpbmcgaW4gYGludmVydGVkQ29ycmVjdGAgaXMgY29ycmVjdCwgc28gYWRkIGl0IGRpcmVjdGx5IHRvXG4gICAgICAgICMgdGhlIGxpc3QuXG4gICAgICAgIGNvcnJlY3QuYXBwZW5kIGludmVydGVkQ29ycmVjdFxuICAgICAgZWxzZSBpZiByZXN1bHRzLmNvcnJlY3RcbiAgICAgICAgZm9yIHJhbmdlIGluIHJlc3VsdHMuY29ycmVjdFxuICAgICAgICAgIGNvcnJlY3QuYXBwZW5kUmFuZ2UocmFuZ2Uuc3RhcnQsIHJhbmdlLmVuZClcblxuICAgICAgaWYgcmVzdWx0cy5pbmNvcnJlY3RcbiAgICAgICAgbmV3SW5jb3JyZWN0ID0gbmV3IG11bHRpcmFuZ2UuTXVsdGlSYW5nZShbXSlcbiAgICAgICAgaW5jb3JyZWN0cy5wdXNoKG5ld0luY29ycmVjdClcblxuICAgICAgICBmb3IgcmFuZ2UgaW4gcmVzdWx0cy5pbmNvcnJlY3RcbiAgICAgICAgICBuZXdJbmNvcnJlY3QuYXBwZW5kUmFuZ2UocmFuZ2Uuc3RhcnQsIHJhbmdlLmVuZClcblxuICAgICMgSWYgd2UgZG9uJ3QgaGF2ZSBhbnkgaW5jb3JyZWN0IHNwZWxsaW5ncywgdGhlbiB0aGVyZSBpcyBub3RoaW5nIHRvIHdvcnJ5XG4gICAgIyBhYm91dCwgc28ganVzdCByZXR1cm4gYW5kIHN0b3AgcHJvY2Vzc2luZy5cbiAgICBpZiBpbmNvcnJlY3RzLmxlbmd0aCBpcyAwXG4gICAgICByZXR1cm4ge2lkOiBhcmdzLmlkLCBtaXNzcGVsbGluZ3M6IFtdfVxuXG4gICAgIyBCdWlsZCB1cCBhbiBpbnRlcnNlY3Rpb24gb2YgYWxsIHRoZSBpbmNvcnJlY3QgcmFuZ2VzLiBXZSBvbmx5IHRyZWF0IGEgd29yZFxuICAgICMgYXMgYmVpbmcgaW5jb3JyZWN0IGlmICpldmVyeSogY2hlY2tlciB0aGF0IHByb3ZpZGVzIG5lZ2F0aXZlIHZhbHVlcyB0cmVhdHNcbiAgICAjIGl0IGFzIGluY29ycmVjdC4gV2Uga25vdyB0aGVyZSBhcmUgYXQgbGVhc3Qgb25lIGl0ZW0gaW4gdGhpcyBsaXN0LCBzbyBwdWxsXG4gICAgIyB0aGF0IG91dC4gSWYgdGhhdCBpcyB0aGUgb25seSBvbmUsIHdlIGRvbid0IGhhdmUgdG8gZG8gYW55IGFkZGl0aW9uYWwgd29yayxcbiAgICAjIG90aGVyd2lzZSB3ZSBjb21wYXJlIGV2ZXJ5IG90aGVyIG9uZSBhZ2FpbnN0IGl0LCByZW1vdmluZyBhbnkgZWxlbWVudHNcbiAgICAjIHRoYXQgYXJlbid0IGFuIGludGVyc2VjdGlvbiB3aGljaCAoaG9wZWZ1bGx5KSB3aWxsIHByb2R1Y2UgYSBzbWFsbGVyIGxpc3RcbiAgICAjIHdpdGggZWFjaCBpdGVyYXRpb24uXG4gICAgaW50ZXJzZWN0aW9uID0gbnVsbFxuXG4gICAgZm9yIGluY29ycmVjdCBpbiBpbmNvcnJlY3RzXG4gICAgICBpZiBpbnRlcnNlY3Rpb24gaXMgbnVsbFxuICAgICAgICBpbnRlcnNlY3Rpb24gPSBpbmNvcnJlY3RcbiAgICAgIGVsc2VcbiAgICAgICAgaW50ZXJzZWN0aW9uLmFwcGVuZChpbmNvcnJlY3QpXG5cbiAgICAjIElmIHdlIGhhdmUgbm8gaW50ZXJzZWN0aW9uLCB0aGVuIG5vdGhpbmcgdG8gcmVwb3J0IGFzIGEgcHJvYmxlbS5cbiAgICBpZiBpbnRlcnNlY3Rpb24ubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiB7aWQ6IGFyZ3MuaWQsIG1pc3NwZWxsaW5nczogW119XG5cbiAgICAjIFJlbW92ZSBhbGwgb2YgdGhlIGNvbmZpcm1lZCBjb3JyZWN0IHdvcmRzIGZyb20gdGhlIHJlc3VsdGluZyBpbmNvcnJlY3RcbiAgICAjIGxpc3QuIFRoaXMgYWxsb3dzIHVzIHRvIGhhdmUgY29ycmVjdC1vbmx5IHByb3ZpZGVycyBhcyBvcHBvc2VkIHRvIG9ubHlcbiAgICAjIGluY29ycmVjdCBwcm92aWRlcnMuXG4gICAgaWYgY29ycmVjdC5yYW5nZXMubGVuZ3RoID4gMFxuICAgICAgaW50ZXJzZWN0aW9uLnN1YnRyYWN0KGNvcnJlY3QpXG5cbiAgICAjIENvbnZlcnQgdGhlIHRleHQgcmFuZ2VzIChpbmRleCBpbnRvIHRoZSBzdHJpbmcpIGludG8gQXRvbSBidWZmZXJcbiAgICAjIGNvb3JkaW5hdGVzICggcm93IGFuZCBjb2x1bW4pLlxuICAgIHJvdyA9IDBcbiAgICByYW5nZUluZGV4ID0gMFxuICAgIGxpbmVCZWdpbkluZGV4ID0gMFxuICAgIG1pc3NwZWxsaW5ncyA9IFtdXG4gICAgd2hpbGUgbGluZUJlZ2luSW5kZXggPCB0ZXh0Lmxlbmd0aCBhbmQgcmFuZ2VJbmRleCA8IGludGVyc2VjdGlvbi5yYW5nZXMubGVuZ3RoXG4gICAgICAjIEZpZ3VyZSBvdXQgd2hlcmUgdGhlIG5leHQgbGluZSBicmVhayBpcy4gSWYgd2UgaGl0IC0xLCB0aGVuIHdlIG1ha2Ugc3VyZVxuICAgICAgIyBpdCBpcyBhIGhpZ2hlciBudW1iZXIgc28gb3VyIDwgY29tcGFyaXNvbnMgd29yayBwcm9wZXJseS5cbiAgICAgIGxpbmVFbmRJbmRleCA9IHRleHQuaW5kZXhPZignXFxuJywgbGluZUJlZ2luSW5kZXgpXG4gICAgICBpZiBsaW5lRW5kSW5kZXggaXMgLTFcbiAgICAgICAgbGluZUVuZEluZGV4ID0gSW5maW5pdHlcblxuICAgICAgIyBMb29wIHRocm91Z2ggYW5kIGdldCBhbGwgdGhlIHJhbmVncyBmb3IgdGhpcyBsaW5lLlxuICAgICAgbG9vcFxuICAgICAgICByYW5nZSA9IGludGVyc2VjdGlvbi5yYW5nZXNbcmFuZ2VJbmRleF1cbiAgICAgICAgaWYgcmFuZ2UgYW5kIHJhbmdlWzBdIDwgbGluZUVuZEluZGV4XG4gICAgICAgICAgIyBGaWd1cmUgb3V0IHRoZSBjaGFyYWN0ZXIgcmFuZ2Ugb2YgdGhpcyBsaW5lLiBXZSBuZWVkIHRoaXMgYmVjYXVzZVxuICAgICAgICAgICMgQGFkZE1pc3NwZWxsaW5ncyBkb2Vzbid0IGhhbmRsZSBqdW1waW5nIGFjcm9zcyBsaW5lcyBlYXNpbHkgYW5kIHRoZVxuICAgICAgICAgICMgdXNlIG9mIHRoZSBudW1iZXIgcmFuZ2VzIGlzIGluY2x1c2l2ZS5cbiAgICAgICAgICBsaW5lUmFuZ2UgPSBuZXcgbXVsdGlyYW5nZS5NdWx0aVJhbmdlKFtdKS5hcHBlbmRSYW5nZShsaW5lQmVnaW5JbmRleCwgbGluZUVuZEluZGV4KVxuICAgICAgICAgIHJhbmdlUmFuZ2UgPSBuZXcgbXVsdGlyYW5nZS5NdWx0aVJhbmdlKFtdKS5hcHBlbmRSYW5nZShyYW5nZVswXSwgcmFuZ2VbMV0pXG4gICAgICAgICAgbGluZVJhbmdlLmludGVyc2VjdChyYW5nZVJhbmdlKVxuXG4gICAgICAgICAgIyBUaGUgcmFuZ2Ugd2UgaGF2ZSBoZXJlIGluY2x1ZGVzIHdoaXRlc3BhY2UgYmV0d2VlbiB0d28gY29uY3VycmVudFxuICAgICAgICAgICMgdG9rZW5zIChcInp6IHp6IHp6XCIgc2hvd3MgdXAgYXMgYSBzaW5nbGUgbWlzc3BlbGxpbmcpLiBUaGUgb3JpZ2luYWxcbiAgICAgICAgICAjIHZlcnNpb24gd291bGQgc3BsaXQgdGhlIGV4YW1wbGUgaW50byB0aHJlZSBzZXBhcmF0ZSBvbmVzLCBzbyB3ZVxuICAgICAgICAgICMgZG8gdGhlIHNhbWUgdGhpbmcsIGJ1dCBvbmx5IGZvciB0aGUgcmFuZ2VzIHdpdGhpbiB0aGUgbGluZS5cbiAgICAgICAgICBAYWRkTWlzc3BlbGxpbmdzKG1pc3NwZWxsaW5ncywgcm93LCBsaW5lUmFuZ2UucmFuZ2VzWzBdLCBsaW5lQmVnaW5JbmRleCwgdGV4dClcblxuICAgICAgICAgICMgSWYgdGhpcyBsaW5lIGlzIGJleW9uZCB0aGUgbGltaXRzIG9mIG91ciBjdXJyZW50IHJhbmdlLCB3ZSBtb3ZlIHRvXG4gICAgICAgICAgIyB0aGUgbmV4dCBvbmUsIG90aGVyd2lzZSB3ZSBsb29wIGFnYWluIHRvIHJldXNlIHRoaXMgcmFuZ2UgYWdhaW5zdFxuICAgICAgICAgICMgdGhlIG5leHQgbGluZS5cbiAgICAgICAgICBpZiBsaW5lRW5kSW5kZXggPj0gcmFuZ2VbMV1cbiAgICAgICAgICAgIHJhbmdlSW5kZXgrK1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBicmVha1xuXG4gICAgICBsaW5lQmVnaW5JbmRleCA9IGxpbmVFbmRJbmRleCArIDFcbiAgICAgIHJvdysrXG5cbiAgICAjIFJldHVybiB0aGUgcmVzdWx0aW5nIG1pc3NwZWxsaW5ncy5cbiAgICB7aWQ6IGFyZ3MuaWQsIG1pc3NwZWxsaW5nczogbWlzc3BlbGxpbmdzfVxuXG4gIHN1Z2dlc3Q6IChhcmdzLCB3b3JkKSAtPlxuICAgICMgTWFrZSBzdXJlIG91ciBkZWZlcnJlZCBpbml0aWFsaXphdGlvbiBpcyBkb25lLlxuICAgIEBpbml0KClcblxuICAgICMgR2F0aGVyIHVwIGEgbGlzdCBvZiBjb3JyZWN0aW9ucyBhbmQgcHV0IHRoZW0gaW50byBhIGN1c3RvbSBvYmplY3QgdGhhdCBoYXNcbiAgICAjIHRoZSBwcmlvcml0eSBvZiB0aGUgcGx1Z2luLCB0aGUgaW5kZXggaW4gdGhlIHJlc3VsdHMsIGFuZCB0aGUgd29yZCBpdHNlbGYuXG4gICAgIyBXZSB1c2UgdGhpcyB0byBpbnRlcnNwZXJzZSB0aGUgcmVzdWx0cyB0b2dldGhlciB0byBhdm9pZCBoYXZpbmcgdGhlXG4gICAgIyBwcmVmZXJyZWQgYW5zd2VyIGZvciB0aGUgc2Vjb25kIHBsdWdpbiBiZWxvdyB0aGUgbGVhc3QgcHJlZmVycmVkIG9mIHRoZVxuICAgICMgZmlyc3QuXG4gICAgc3VnZ2VzdGlvbnMgPSBbXVxuXG4gICAgZm9yIGNoZWNrZXIgaW4gQGNoZWNrZXJzXG4gICAgICAjIFdlIG9ubHkgY2FyZSBpZiB0aGlzIHBsdWdpbiBjb250cmlidXRlcyB0byBjaGVja2luZyB0byBzdWdnZXN0aW9ucy5cbiAgICAgIGlmIG5vdCBjaGVja2VyLmlzRW5hYmxlZCgpIG9yIG5vdCBjaGVja2VyLnByb3ZpZGVzU3VnZ2VzdGlvbnMoYXJncylcbiAgICAgICAgY29udGludWVcblxuICAgICAgIyBHZXQgdGhlIHN1Z2dlc3Rpb25zIGZvciB0aGlzIHdvcmQuXG4gICAgICBpbmRleCA9IDBcbiAgICAgIHByaW9yaXR5ID0gY2hlY2tlci5nZXRQcmlvcml0eSgpXG5cbiAgICAgIGZvciBzdWdnZXN0aW9uIGluIGNoZWNrZXIuc3VnZ2VzdChhcmdzLCB3b3JkKVxuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoIHtpc1N1Z2dlc3Rpb246IHRydWUsIHByaW9yaXR5OiBwcmlvcml0eSwgaW5kZXg6IGluZGV4KyssIHN1Z2dlc3Rpb246IHN1Z2dlc3Rpb24sIGxhYmVsOiBzdWdnZXN0aW9ufVxuXG4gICAgIyBPbmNlIHdlIGhhdmUgdGhlIHN1Z2dlc3Rpb25zLCB0aGVuIHNvcnQgdGhlbSB0byBpbnRlcnNwZXJzZSB0aGUgcmVzdWx0cy5cbiAgICBrZXlzID0gT2JqZWN0LmtleXMoc3VnZ2VzdGlvbnMpLnNvcnQgKGtleTEsIGtleTIpIC0+XG4gICAgICB2YWx1ZTEgPSBzdWdnZXN0aW9uc1trZXkxXVxuICAgICAgdmFsdWUyID0gc3VnZ2VzdGlvbnNba2V5Ml1cbiAgICAgIHdlaWdodDEgPSB2YWx1ZTEucHJpb3JpdHkgKyB2YWx1ZTEuaW5kZXhcbiAgICAgIHdlaWdodDIgPSB2YWx1ZTIucHJpb3JpdHkgKyB2YWx1ZTIuaW5kZXhcblxuICAgICAgaWYgd2VpZ2h0MSBpc250IHdlaWdodDJcbiAgICAgICAgcmV0dXJuIHdlaWdodDEgLSB3ZWlnaHQyXG5cbiAgICAgIHJldHVybiB2YWx1ZTEuc3VnZ2VzdGlvbi5sb2NhbGVDb21wYXJlKHZhbHVlMi5zdWdnZXN0aW9uKVxuXG4gICAgIyBHbyB0aHJvdWdoIHRoZSBrZXlzIGFuZCBidWlsZCB0aGUgZmluYWwgbGlzdCBvZiBzdWdnZXN0aW9ucy4gQXMgd2UgZ29cbiAgICAjIHRocm91Z2gsIHdlIGFsc28gd2FudCB0byByZW1vdmUgZHVwbGljYXRlcy5cbiAgICByZXN1bHRzID0gW11cbiAgICBzZWVuID0gW11cbiAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgIHMgPSBzdWdnZXN0aW9uc1trZXldXG4gICAgICBpZiBzZWVuLmhhc093blByb3BlcnR5IHMuc3VnZ2VzdGlvblxuICAgICAgICBjb250aW51ZVxuICAgICAgcmVzdWx0cy5wdXNoIHNcbiAgICAgIHNlZW5bcy5zdWdnZXN0aW9uXSA9IDFcblxuICAgICMgV2UgYWxzbyBncmFiIHRoZSBcImFkZCB0byBkaWN0aW9uYXJ5XCIgbGlzdGluZ3MuXG4gICAgdGhhdCA9IHRoaXNcbiAgICBrZXlzID0gT2JqZWN0LmtleXMoQGNoZWNrZXJzKS5zb3J0IChrZXkxLCBrZXkyKSAtPlxuICAgICAgdmFsdWUxID0gdGhhdC5jaGVja2Vyc1trZXkxXVxuICAgICAgdmFsdWUyID0gdGhhdC5jaGVja2Vyc1trZXkyXVxuICAgICAgdmFsdWUxLmdldFByaW9yaXR5KCkgLSB2YWx1ZTIuZ2V0UHJpb3JpdHkoKVxuXG4gICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICAjIFdlIG9ubHkgY2FyZSBpZiB0aGlzIHBsdWdpbiBjb250cmlidXRlcyB0byBjaGVja2luZyB0byBzdWdnZXN0aW9ucy5cbiAgICAgIGNoZWNrZXIgPSBAY2hlY2tlcnNba2V5XVxuICAgICAgaWYgbm90IGNoZWNrZXIuaXNFbmFibGVkKCkgb3Igbm90IGNoZWNrZXIucHJvdmlkZXNBZGRpbmcoYXJncylcbiAgICAgICAgY29udGludWVcblxuICAgICAgIyBBZGQgYWxsIHRoZSB0YXJnZXRzIHRvIHRoZSBsaXN0LlxuICAgICAgdGFyZ2V0cyA9IGNoZWNrZXIuZ2V0QWRkaW5nVGFyZ2V0cyBhcmdzXG4gICAgICBmb3IgdGFyZ2V0IGluIHRhcmdldHNcbiAgICAgICAgdGFyZ2V0LnBsdWdpbiA9IGNoZWNrZXJcbiAgICAgICAgdGFyZ2V0LndvcmQgPSB3b3JkXG4gICAgICAgIHRhcmdldC5pc1N1Z2dlc3Rpb24gPSBmYWxzZVxuICAgICAgICByZXN1bHRzLnB1c2ggdGFyZ2V0XG5cbiAgICAjIFJldHVybiB0aGUgcmVzdWx0aW5nIGxpc3Qgb2Ygb3B0aW9ucy5cbiAgICByZXN1bHRzXG5cbiAgYWRkTWlzc3BlbGxpbmdzOiAobWlzc3BlbGxpbmdzLCByb3csIHJhbmdlLCBsaW5lQmVnaW5JbmRleCwgdGV4dCkgLT5cbiAgICAjIEdldCB0aGUgc3Vic3RyaW5nIG9mIHRleHQsIGlmIHRoZXJlIGlzIG5vIHNwYWNlLCB0aGVuIHdlIGNhbiBqdXN0IHJldHVyblxuICAgICMgdGhlIGVudGlyZSByZXN1bHQuXG4gICAgc3Vic3RyaW5nID0gdGV4dC5zdWJzdHJpbmcocmFuZ2VbMF0sIHJhbmdlWzFdKVxuXG4gICAgaWYgL1xccysvLnRlc3Qgc3Vic3RyaW5nXG4gICAgICAjIFdlIGhhdmUgYSBzcGFjZSwgdG8gYnJlYWsgaXQgaW50byBpbmRpdmlkdWFsIGNvbXBvbmVudHMgYW5kIHB1c2ggZWFjaFxuICAgICAgIyBvbmUgdG8gdGhlIG1pc3NwZWxsaW5nIGxpc3QuXG4gICAgICBwYXJ0cyA9IHN1YnN0cmluZy5zcGxpdCAvKFxccyspL1xuICAgICAgc3Vic3RyaW5nSW5kZXggPSAwXG4gICAgICBmb3IgcGFydCBpbiBwYXJ0c1xuICAgICAgICBpZiBub3QgL1xccysvLnRlc3QgcGFydFxuICAgICAgICAgIG1hcmtCZWdpbkluZGV4ID0gcmFuZ2VbMF0gLSBsaW5lQmVnaW5JbmRleCArIHN1YnN0cmluZ0luZGV4XG4gICAgICAgICAgbWFya0VuZEluZGV4ID0gbWFya0JlZ2luSW5kZXggKyBwYXJ0Lmxlbmd0aFxuICAgICAgICAgIG1pc3NwZWxsaW5ncy5wdXNoKFtbcm93LCBtYXJrQmVnaW5JbmRleF0sIFtyb3csIG1hcmtFbmRJbmRleF1dKVxuXG4gICAgICAgIHN1YnN0cmluZ0luZGV4ICs9IHBhcnQubGVuZ3RoXG5cbiAgICAgIHJldHVyblxuXG4gICAgIyBUaGVyZSB3ZXJlIG5vIHNwYWNlcywgc28ganVzdCByZXR1cm4gdGhlIGVudGlyZSBsaXN0LlxuICAgIG1pc3NwZWxsaW5ncy5wdXNoKFtcbiAgICAgIFtyb3csIHJhbmdlWzBdIC0gbGluZUJlZ2luSW5kZXhdLFxuICAgICAgW3JvdywgcmFuZ2VbMV0gLSBsaW5lQmVnaW5JbmRleF1cbiAgICBdKVxuXG4gIGluaXQ6IC0+XG4gICAgIyBTZWUgaWYgd2UgbmVlZCB0byBpbml0aWFsaXplIHRoZSBzeXN0ZW0gY2hlY2tlcnMuXG4gICAgaWYgQGxvY2FsZUNoZWNrZXJzIGlzIG51bGxcbiAgICAgICMgSW5pdGlhbGl6ZSB0aGUgY29sbGVjdGlvbi4gSWYgd2UgYXJlbid0IHVzaW5nIGFueSwgdGhlbiBzdG9wIGRvaW5nIGFueXRoaW5nLlxuICAgICAgQGxvY2FsZUNoZWNrZXJzID0gW11cblxuICAgICAgaWYgQHVzZUxvY2FsZXNcbiAgICAgICAgIyBJZiB3ZSBoYXZlIGEgYmxhbmsgbG9jYXRpb24sIHVzZSB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgcHJvY2Vzcy4gSWZcbiAgICAgICAgIyBzZXQsIHRoZW4gaXQgd2lsbCBiZSB0aGUgYmVzdCBsYW5ndWFnZS5cbiAgICAgICAgaWYgbm90IEBsb2NhbGVzLmxlbmd0aFxuICAgICAgICAgIGRlZmF1bHRMb2NhbGUgPSBwcm9jZXNzLmVudi5MQU5HXG4gICAgICAgICAgaWYgZGVmYXVsdExvY2FsZVxuICAgICAgICAgICAgQGxvY2FsZXMgPSBbZGVmYXVsdExvY2FsZS5zcGxpdCgnLicpWzBdXVxuXG4gICAgICAgICMgSWYgd2UgY2FuJ3QgZmlndXJlIG91dCB0aGUgbGFuZ3VhZ2UgZnJvbSB0aGUgcHJvY2VzcywgY2hlY2sgdGhlXG4gICAgICAgICMgYnJvd3Nlci4gQWZ0ZXIgdGVzdGluZyB0aGlzLCB3ZSBmb3VuZCB0aGF0IHRoaXMgZG9lcyBub3QgcmVsaWFibHlcbiAgICAgICAgIyBwcm9kdWNlIGEgcHJvcGVyIElFRlQgdGFnIGZvciBsYW5ndWFnZXM7IG9uIE9TIFgsIGl0IHdhcyBwcm92aWRpbmdcbiAgICAgICAgIyBcIkVuZ2xpc2hcIiB3aGljaCBkb2Vzbid0IHdvcmsgd2l0aCB0aGUgbG9jYWxlIHNlbGVjdGlvbi4gVG8gYXZvaWQgdXNpbmdcbiAgICAgICAgIyBpdCwgd2UgdXNlIHNvbWUgdGVzdHMgdG8gbWFrZSBzdXJlIGl0IFwibG9va3MgbGlrZVwiIGFuIElFRlQgdGFnLlxuICAgICAgICBpZiBub3QgQGxvY2FsZXMubGVuZ3RoXG4gICAgICAgICAgZGVmYXVsdExvY2FsZSA9IG5hdmlnYXRvci5sYW5ndWFnZVxuICAgICAgICAgIGlmIGRlZmF1bHRMb2NhbGUgYW5kIGRlZmF1bHRMb2NhbGUubGVuZ3RoIGlzIDVcbiAgICAgICAgICAgIHNlcGFyYXRvckNoYXIgPSBkZWZhdWx0TG9jYWxlLmNoYXJBdCgyKVxuICAgICAgICAgICAgaWYgc2VwYXJhdG9yQ2hhciBpcyAnXycgb3Igc2VwYXJhdG9yQ2hhciBpcyAnLSdcbiAgICAgICAgICAgICAgQGxvY2FsZXMgPSBbZGVmYXVsdExvY2FsZV1cblxuICAgICAgICAjIElmIHdlIHN0aWxsIGNhbid0IGZpZ3VyZSBpdCBvdXQsIHVzZSBVUyBFbmdsaXNoLiBJdCBpc24ndCBhIGdyZWF0XG4gICAgICAgICMgY2hvaWNlLCBidXQgaXQgaXMgYSByZWFzb25hYmxlIGRlZmF1bHQgbm90IHRvIG1lbnRpb24gaXMgY2FuIGJlIHVzZWRcbiAgICAgICAgIyB3aXRoIHRoZSBmYWxsYmFjayBwYXRoIG9mIHRoZSBgc3BlbGxjaGVja2VyYCBwYWNrYWdlLlxuICAgICAgICBpZiBub3QgQGxvY2FsZXMubGVuZ3RoXG4gICAgICAgICAgQGxvY2FsZXMgPSBbJ2VuX1VTJ11cblxuICAgICAgICAjIEdvIHRocm91Z2ggdGhlIG5ldyBsaXN0IGFuZCBjcmVhdGUgbmV3IGxvY2FsZSBjaGVja2Vycy5cbiAgICAgICAgU3lzdGVtQ2hlY2tlciA9IHJlcXVpcmUgXCIuL3N5c3RlbS1jaGVja2VyXCJcbiAgICAgICAgZm9yIGxvY2FsZSBpbiBAbG9jYWxlc1xuICAgICAgICAgIGNoZWNrZXIgPSBuZXcgU3lzdGVtQ2hlY2tlciBsb2NhbGUsIEBsb2NhbGVQYXRoc1xuICAgICAgICAgIEBhZGRTcGVsbENoZWNrZXIgY2hlY2tlclxuICAgICAgICAgIEBsb2NhbGVDaGVja2Vycy5wdXNoIGNoZWNrZXJcblxuICAgICMgU2VlIGlmIHdlIG5lZWQgdG8gcmVsb2FkIHRoZSBrbm93biB3b3Jkcy5cbiAgICBpZiBAa25vd25Xb3Jkc0NoZWNrZXIgaXMgbnVsbFxuICAgICAgS25vd25Xb3Jkc0NoZWNrZXIgPSByZXF1aXJlICcuL2tub3duLXdvcmRzLWNoZWNrZXInXG4gICAgICBAa25vd25Xb3Jkc0NoZWNrZXIgPSBuZXcgS25vd25Xb3Jkc0NoZWNrZXIgQGtub3duV29yZHNcbiAgICAgIEBrbm93bldvcmRzQ2hlY2tlci5lbmFibGVBZGQgPSBAYWRkS25vd25Xb3Jkc1xuICAgICAgQGFkZFNwZWxsQ2hlY2tlciBAa25vd25Xb3Jkc0NoZWNrZXJcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBjaGVja2VycyA9IFtdXG4gICAgQGxvY2FsZXMgPSBbXVxuICAgIEBsb2NhbGVQYXRocyA9IFtdXG4gICAgQHVzZUxvY2FsZXM9ICBmYWxzZVxuICAgIEBsb2NhbGVDaGVja2VycyA9IG51bGxcbiAgICBAa25vd25Xb3JkcyA9IFtdXG4gICAgQGFkZEtub3duV29yZHMgPSBmYWxzZVxuICAgIEBrbm93bldvcmRzQ2hlY2tlciA9IG51bGxcblxuICByZWxvYWRMb2NhbGVzOiAtPlxuICAgIGlmIEBsb2NhbGVDaGVja2Vyc1xuICAgICAgZm9yIGxvY2FsZUNoZWNrZXIgaW4gQGxvY2FsZUNoZWNrZXJzXG4gICAgICAgIEByZW1vdmVTcGVsbENoZWNrZXIgbG9jYWxlQ2hlY2tlclxuICAgICAgQGxvY2FsZUNoZWNrZXJzID0gbnVsbFxuXG4gIHJlbG9hZEtub3duV29yZHM6IC0+XG4gICAgaWYgQGtub3duV29yZHNDaGVja2VyXG4gICAgICBAcmVtb3ZlU3BlbGxDaGVja2VyIEBrbm93bldvcmRzQ2hlY2tlclxuICAgICAgQGtub3duV29yZHNDaGVja2VyID0gbnVsbFxuXG5tYW5hZ2VyID0gbmV3IFNwZWxsQ2hlY2tlck1hbmFnZXJcbm1vZHVsZS5leHBvcnRzID0gbWFuYWdlclxuIl19
