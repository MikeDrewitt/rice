(function() {
  var FirstMate, GrammarRegistry, Grim, PathSplitRegex, Token, _, fs, getEditorForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  FirstMate = require('first-mate');

  Token = require('./token');

  fs = require('fs-plus');

  Grim = require('grim');

  PathSplitRegex = new RegExp("[/.]");

  module.exports = GrammarRegistry = (function(superClass) {
    extend(GrammarRegistry, superClass);

    function GrammarRegistry(arg) {
      this.config = (arg != null ? arg : {}).config;
      GrammarRegistry.__super__.constructor.call(this, {
        maxTokensPerLine: 100
      });
    }

    GrammarRegistry.prototype.createToken = function(value, scopes) {
      return new Token({
        value: value,
        scopes: scopes
      });
    };

    GrammarRegistry.prototype.selectGrammar = function(filePath, fileContents) {
      return this.selectGrammarWithScore(filePath, fileContents).grammar;
    };

    GrammarRegistry.prototype.selectGrammarWithScore = function(filePath, fileContents) {
      var bestMatch, grammar, highestScore, j, len, ref, score;
      bestMatch = null;
      highestScore = -2e308;
      ref = this.grammars;
      for (j = 0, len = ref.length; j < len; j++) {
        grammar = ref[j];
        score = this.getGrammarScore(grammar, filePath, fileContents);
        if (score > highestScore || (bestMatch == null)) {
          bestMatch = grammar;
          highestScore = score;
        }
      }
      return {
        grammar: bestMatch,
        score: highestScore
      };
    };

    GrammarRegistry.prototype.getGrammarScore = function(grammar, filePath, contents) {
      var score;
      if ((contents == null) && fs.isFileSync(filePath)) {
        contents = fs.readFileSync(filePath, 'utf8');
      }
      score = this.getGrammarPathScore(grammar, filePath);
      if (score > 0 && !grammar.bundledPackage) {
        score += 0.25;
      }
      if (this.grammarMatchesContents(grammar, contents)) {
        score += 0.125;
      }
      return score;
    };

    GrammarRegistry.prototype.getGrammarPathScore = function(grammar, filePath) {
      var customFileTypes, fileType, fileTypeComponents, fileTypes, i, j, len, pathComponents, pathScore, pathSuffix, ref;
      if (!filePath) {
        return -1;
      }
      if (process.platform === 'win32') {
        filePath = filePath.replace(/\\/g, '/');
      }
      pathComponents = filePath.toLowerCase().split(PathSplitRegex);
      pathScore = -1;
      fileTypes = grammar.fileTypes;
      if (customFileTypes = (ref = this.config.get('core.customFileTypes')) != null ? ref[grammar.scopeName] : void 0) {
        fileTypes = fileTypes.concat(customFileTypes);
      }
      for (i = j = 0, len = fileTypes.length; j < len; i = ++j) {
        fileType = fileTypes[i];
        fileTypeComponents = fileType.toLowerCase().split(PathSplitRegex);
        pathSuffix = pathComponents.slice(-fileTypeComponents.length);
        if (_.isEqual(pathSuffix, fileTypeComponents)) {
          pathScore = Math.max(pathScore, fileType.length);
          if (i >= grammar.fileTypes.length) {
            pathScore += 0.5;
          }
        }
      }
      return pathScore;
    };

    GrammarRegistry.prototype.grammarMatchesContents = function(grammar, contents) {
      var character, escaped, j, len, lines, numberOfNewlinesInRegex, ref;
      if (!((contents != null) && (grammar.firstLineRegex != null))) {
        return false;
      }
      escaped = false;
      numberOfNewlinesInRegex = 0;
      ref = grammar.firstLineRegex.source;
      for (j = 0, len = ref.length; j < len; j++) {
        character = ref[j];
        switch (character) {
          case '\\':
            escaped = !escaped;
            break;
          case 'n':
            if (escaped) {
              numberOfNewlinesInRegex++;
            }
            escaped = false;
            break;
          default:
            escaped = false;
        }
      }
      lines = contents.split('\n');
      return grammar.firstLineRegex.testSync(lines.slice(0, +numberOfNewlinesInRegex + 1 || 9e9).join('\n'));
    };

    GrammarRegistry.prototype.grammarOverrideForPath = function(filePath) {
      var editor;
      Grim.deprecate('Use atom.textEditors.getGrammarOverride(editor) instead');
      if (editor = getEditorForPath(filePath)) {
        return atom.textEditors.getGrammarOverride(editor);
      }
    };

    GrammarRegistry.prototype.setGrammarOverrideForPath = function(filePath, scopeName) {
      var editor;
      Grim.deprecate('Use atom.textEditors.setGrammarOverride(editor, scopeName) instead');
      if (editor = getEditorForPath(filePath)) {
        atom.textEditors.setGrammarOverride(editor, scopeName);
      }
    };

    GrammarRegistry.prototype.clearGrammarOverrideForPath = function(filePath) {
      var editor;
      Grim.deprecate('Use atom.textEditors.clearGrammarOverride(editor) instead');
      if (editor = getEditorForPath(filePath)) {
        atom.textEditors.clearGrammarOverride(editor);
      }
    };

    return GrammarRegistry;

  })(FirstMate.GrammarRegistry);

  getEditorForPath = function(filePath) {
    if (filePath != null) {
      return atom.workspace.getTextEditors().find(function(editor) {
        return editor.getPath() === filePath;
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ncmFtbWFyLXJlZ2lzdHJ5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsZ0ZBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixTQUFBLEdBQVksT0FBQSxDQUFRLFlBQVI7O0VBQ1osS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsY0FBQSxHQUFxQixJQUFBLE1BQUEsQ0FBTyxNQUFQOztFQVFyQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyx5QkFBQyxHQUFEO01BQUUsSUFBQyxDQUFBLHdCQUFGLE1BQVUsSUFBUjtNQUNkLGlEQUFNO1FBQUEsZ0JBQUEsRUFBa0IsR0FBbEI7T0FBTjtJQURXOzs4QkFHYixXQUFBLEdBQWEsU0FBQyxLQUFELEVBQVEsTUFBUjthQUF1QixJQUFBLEtBQUEsQ0FBTTtRQUFDLE9BQUEsS0FBRDtRQUFRLFFBQUEsTUFBUjtPQUFOO0lBQXZCOzs4QkFXYixhQUFBLEdBQWUsU0FBQyxRQUFELEVBQVcsWUFBWDthQUNiLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixRQUF4QixFQUFrQyxZQUFsQyxDQUErQyxDQUFDO0lBRG5DOzs4QkFHZixzQkFBQSxHQUF3QixTQUFDLFFBQUQsRUFBVyxZQUFYO0FBQ3RCLFVBQUE7TUFBQSxTQUFBLEdBQVk7TUFDWixZQUFBLEdBQWUsQ0FBQztBQUNoQjtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxlQUFELENBQWlCLE9BQWpCLEVBQTBCLFFBQTFCLEVBQW9DLFlBQXBDO1FBQ1IsSUFBRyxLQUFBLEdBQVEsWUFB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QixDQUFvQyxNQUFwQyxFQURGOztJQUZzQjs7OEJBV3hCLHlCQUFBLEdBQTJCLFNBQUMsUUFBRCxFQUFXLFNBQVg7QUFDekIsVUFBQTtNQUFBLElBQUksQ0FBQyxTQUFMLENBQWUsb0VBQWY7TUFDQSxJQUFHLE1BQUEsR0FBUyxnQkFBQSxDQUFpQixRQUFqQixDQUFaO1FBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBakIsQ0FBb0MsTUFBcEMsRUFBNEMsU0FBNUMsRUFERjs7SUFGeUI7OzhCQVczQiwyQkFBQSxHQUE2QixTQUFDLFFBQUQ7QUFDM0IsVUFBQTtNQUFBLElBQUksQ0FBQyxTQUFMLENBQWUsMkRBQWY7TUFDQSxJQUFHLE1BQUEsR0FBUyxnQkFBQSxDQUFpQixRQUFqQixDQUFaO1FBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBakIsQ0FBc0MsTUFBdEMsRUFERjs7SUFGMkI7Ozs7S0F6R0QsU0FBUyxDQUFDOztFQStHeEMsZ0JBQUEsR0FBbUIsU0FBQyxRQUFEO0lBQ2pCLElBQUcsZ0JBQUg7YUFDRSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWYsQ0FBQSxDQUErQixDQUFDLElBQWhDLENBQXFDLFNBQUMsTUFBRDtlQUNuQyxNQUFNLENBQUMsT0FBUCxDQUFBLENBQUEsS0FBb0I7TUFEZSxDQUFyQyxFQURGOztFQURpQjtBQTlIbkIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuRmlyc3RNYXRlID0gcmVxdWlyZSAnZmlyc3QtbWF0ZSdcblRva2VuID0gcmVxdWlyZSAnLi90b2tlbidcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuXG5QYXRoU3BsaXRSZWdleCA9IG5ldyBSZWdFeHAoXCJbLy5dXCIpXG5cbiMgRXh0ZW5kZWQ6IFN5bnRheCBjbGFzcyBob2xkaW5nIHRoZSBncmFtbWFycyB1c2VkIGZvciB0b2tlbml6aW5nLlxuI1xuIyBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGFsd2F5cyBhdmFpbGFibGUgYXMgdGhlIGBhdG9tLmdyYW1tYXJzYCBnbG9iYWwuXG4jXG4jIFRoZSBTeW50YXggY2xhc3MgYWxzbyBjb250YWlucyBwcm9wZXJ0aWVzIGZvciB0aGluZ3Mgc3VjaCBhcyB0aGVcbiMgbGFuZ3VhZ2Utc3BlY2lmaWMgY29tbWVudCByZWdleGVzLiBTZWUgezo6Z2V0UHJvcGVydHl9IGZvciBtb3JlIGRldGFpbHMuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHcmFtbWFyUmVnaXN0cnkgZXh0ZW5kcyBGaXJzdE1hdGUuR3JhbW1hclJlZ2lzdHJ5XG4gIGNvbnN0cnVjdG9yOiAoe0Bjb25maWd9PXt9KSAtPlxuICAgIHN1cGVyKG1heFRva2Vuc1BlckxpbmU6IDEwMClcblxuICBjcmVhdGVUb2tlbjogKHZhbHVlLCBzY29wZXMpIC0+IG5ldyBUb2tlbih7dmFsdWUsIHNjb3Blc30pXG5cbiAgIyBFeHRlbmRlZDogU2VsZWN0IGEgZ3JhbW1hciBmb3IgdGhlIGdpdmVuIGZpbGUgcGF0aCBhbmQgZmlsZSBjb250ZW50cy5cbiAgI1xuICAjIFRoaXMgcGlja3MgdGhlIGJlc3QgbWF0Y2ggYnkgY2hlY2tpbmcgdGhlIGZpbGUgcGF0aCBhbmQgY29udGVudHMgYWdhaW5zdFxuICAjIGVhY2ggZ3JhbW1hci5cbiAgI1xuICAjICogYGZpbGVQYXRoYCBBIHtTdHJpbmd9IGZpbGUgcGF0aC5cbiAgIyAqIGBmaWxlQ29udGVudHNgIEEge1N0cmluZ30gb2YgdGV4dCBmb3IgdGhlIGZpbGUgcGF0aC5cbiAgI1xuICAjIFJldHVybnMgYSB7R3JhbW1hcn0sIG5ldmVyIG51bGwuXG4gIHNlbGVjdEdyYW1tYXI6IChmaWxlUGF0aCwgZmlsZUNvbnRlbnRzKSAtPlxuICAgIEBzZWxlY3RHcmFtbWFyV2l0aFNjb3JlKGZpbGVQYXRoLCBmaWxlQ29udGVudHMpLmdyYW1tYXJcblxuICBzZWxlY3RHcmFtbWFyV2l0aFNjb3JlOiAoZmlsZVBhdGgsIGZpbGVDb250ZW50cykgLT5cbiAgICBiZXN0TWF0Y2ggPSBudWxsXG4gICAgaGlnaGVzdFNjb3JlID0gLUluZmluaXR5XG4gICAgZm9yIGdyYW1tYXIgaW4gQGdyYW1tYXJzXG4gICAgICBzY29yZSA9IEBnZXRHcmFtbWFyU2NvcmUoZ3JhbW1hciwgZmlsZVBhdGgsIGZpbGVDb250ZW50cylcbiAgICAgIGlmIHNjb3JlID4gaGlnaGVzdFNjb3JlIG9yIG5vdCBiZXN0TWF0Y2g/XG4gICAgICAgIGJlc3RNYXRjaCA9IGdyYW1tYXJcbiAgICAgICAgaGlnaGVzdFNjb3JlID0gc2NvcmVcbiAgICB7Z3JhbW1hcjogYmVzdE1hdGNoLCBzY29yZTogaGlnaGVzdFNjb3JlfVxuXG4gICMgRXh0ZW5kZWQ6IFJldHVybnMgYSB7TnVtYmVyfSByZXByZXNlbnRpbmcgaG93IHdlbGwgdGhlIGdyYW1tYXIgbWF0Y2hlcyB0aGVcbiAgIyBgZmlsZVBhdGhgIGFuZCBgY29udGVudHNgLlxuICBnZXRHcmFtbWFyU2NvcmU6IChncmFtbWFyLCBmaWxlUGF0aCwgY29udGVudHMpIC0+XG4gICAgY29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4JykgaWYgbm90IGNvbnRlbnRzPyBhbmQgZnMuaXNGaWxlU3luYyhmaWxlUGF0aClcblxuICAgIHNjb3JlID0gQGdldEdyYW1tYXJQYXRoU2NvcmUoZ3JhbW1hciwgZmlsZVBhdGgpXG4gICAgaWYgc2NvcmUgPiAwIGFuZCBub3QgZ3JhbW1hci5idW5kbGVkUGFja2FnZVxuICAgICAgc2NvcmUgKz0gMC4yNVxuICAgIGlmIEBncmFtbWFyTWF0Y2hlc0NvbnRlbnRzKGdyYW1tYXIsIGNvbnRlbnRzKVxuICAgICAgc2NvcmUgKz0gMC4xMjVcbiAgICBzY29yZVxuXG4gIGdldEdyYW1tYXJQYXRoU2NvcmU6IChncmFtbWFyLCBmaWxlUGF0aCkgLT5cbiAgICByZXR1cm4gLTEgdW5sZXNzIGZpbGVQYXRoXG4gICAgZmlsZVBhdGggPSBmaWxlUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJykgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG5cbiAgICBwYXRoQ29tcG9uZW50cyA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQoUGF0aFNwbGl0UmVnZXgpXG4gICAgcGF0aFNjb3JlID0gLTFcblxuICAgIGZpbGVUeXBlcyA9IGdyYW1tYXIuZmlsZVR5cGVzXG4gICAgaWYgY3VzdG9tRmlsZVR5cGVzID0gQGNvbmZpZy5nZXQoJ2NvcmUuY3VzdG9tRmlsZVR5cGVzJyk/W2dyYW1tYXIuc2NvcGVOYW1lXVxuICAgICAgZmlsZVR5cGVzID0gZmlsZVR5cGVzLmNvbmNhdChjdXN0b21GaWxlVHlwZXMpXG5cbiAgICBmb3IgZmlsZVR5cGUsIGkgaW4gZmlsZVR5cGVzXG4gICAgICBmaWxlVHlwZUNvbXBvbmVudHMgPSBmaWxlVHlwZS50b0xvd2VyQ2FzZSgpLnNwbGl0KFBhdGhTcGxpdFJlZ2V4KVxuICAgICAgcGF0aFN1ZmZpeCA9IHBhdGhDb21wb25lbnRzWy1maWxlVHlwZUNvbXBvbmVudHMubGVuZ3RoLi4tMV1cbiAgICAgIGlmIF8uaXNFcXVhbChwYXRoU3VmZml4LCBmaWxlVHlwZUNvbXBvbmVudHMpXG4gICAgICAgIHBhdGhTY29yZSA9IE1hdGgubWF4KHBhdGhTY29yZSwgZmlsZVR5cGUubGVuZ3RoKVxuICAgICAgICBpZiBpID49IGdyYW1tYXIuZmlsZVR5cGVzLmxlbmd0aFxuICAgICAgICAgIHBhdGhTY29yZSArPSAwLjVcblxuICAgIHBhdGhTY29yZVxuXG4gIGdyYW1tYXJNYXRjaGVzQ29udGVudHM6IChncmFtbWFyLCBjb250ZW50cykgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGNvbnRlbnRzPyBhbmQgZ3JhbW1hci5maXJzdExpbmVSZWdleD9cblxuICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIG51bWJlck9mTmV3bGluZXNJblJlZ2V4ID0gMFxuICAgIGZvciBjaGFyYWN0ZXIgaW4gZ3JhbW1hci5maXJzdExpbmVSZWdleC5zb3VyY2VcbiAgICAgIHN3aXRjaCBjaGFyYWN0ZXJcbiAgICAgICAgd2hlbiAnXFxcXCdcbiAgICAgICAgICBlc2NhcGVkID0gbm90IGVzY2FwZWRcbiAgICAgICAgd2hlbiAnbidcbiAgICAgICAgICBudW1iZXJPZk5ld2xpbmVzSW5SZWdleCsrIGlmIGVzY2FwZWRcbiAgICAgICAgICBlc2NhcGVkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIGxpbmVzID0gY29udGVudHMuc3BsaXQoJ1xcbicpXG4gICAgZ3JhbW1hci5maXJzdExpbmVSZWdleC50ZXN0U3luYyhsaW5lc1swLi5udW1iZXJPZk5ld2xpbmVzSW5SZWdleF0uam9pbignXFxuJykpXG5cbiAgIyBEZXByZWNhdGVkOiBHZXQgdGhlIGdyYW1tYXIgb3ZlcnJpZGUgZm9yIHRoZSBnaXZlbiBmaWxlIHBhdGguXG4gICNcbiAgIyAqIGBmaWxlUGF0aGAgQSB7U3RyaW5nfSBmaWxlIHBhdGguXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30gc3VjaCBhcyBgXCJzb3VyY2UuanNcImAuXG4gIGdyYW1tYXJPdmVycmlkZUZvclBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZSAnVXNlIGF0b20udGV4dEVkaXRvcnMuZ2V0R3JhbW1hck92ZXJyaWRlKGVkaXRvcikgaW5zdGVhZCdcbiAgICBpZiBlZGl0b3IgPSBnZXRFZGl0b3JGb3JQYXRoKGZpbGVQYXRoKVxuICAgICAgYXRvbS50ZXh0RWRpdG9ycy5nZXRHcmFtbWFyT3ZlcnJpZGUoZWRpdG9yKVxuXG4gICMgRGVwcmVjYXRlZDogU2V0IHRoZSBncmFtbWFyIG92ZXJyaWRlIGZvciB0aGUgZ2l2ZW4gZmlsZSBwYXRoLlxuICAjXG4gICMgKiBgZmlsZVBhdGhgIEEgbm9uLWVtcHR5IHtTdHJpbmd9IGZpbGUgcGF0aC5cbiAgIyAqIGBzY29wZU5hbWVgIEEge1N0cmluZ30gc3VjaCBhcyBgXCJzb3VyY2UuanNcImAuXG4gICNcbiAgIyBSZXR1cm5zIHVuZGVmaW5lZFxuICBzZXRHcmFtbWFyT3ZlcnJpZGVGb3JQYXRoOiAoZmlsZVBhdGgsIHNjb3BlTmFtZSkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZSAnVXNlIGF0b20udGV4dEVkaXRvcnMuc2V0R3JhbW1hck92ZXJyaWRlKGVkaXRvciwgc2NvcGVOYW1lKSBpbnN0ZWFkJ1xuICAgIGlmIGVkaXRvciA9IGdldEVkaXRvckZvclBhdGgoZmlsZVBhdGgpXG4gICAgICBhdG9tLnRleHRFZGl0b3JzLnNldEdyYW1tYXJPdmVycmlkZShlZGl0b3IsIHNjb3BlTmFtZSlcbiAgICByZXR1cm5cblxuICAjIERlcHJlY2F0ZWQ6IFJlbW92ZSB0aGUgZ3JhbW1hciBvdmVycmlkZSBmb3IgdGhlIGdpdmVuIGZpbGUgcGF0aC5cbiAgI1xuICAjICogYGZpbGVQYXRoYCBBIHtTdHJpbmd9IGZpbGUgcGF0aC5cbiAgI1xuICAjIFJldHVybnMgdW5kZWZpbmVkLlxuICBjbGVhckdyYW1tYXJPdmVycmlkZUZvclBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBHcmltLmRlcHJlY2F0ZSAnVXNlIGF0b20udGV4dEVkaXRvcnMuY2xlYXJHcmFtbWFyT3ZlcnJpZGUoZWRpdG9yKSBpbnN0ZWFkJ1xuICAgIGlmIGVkaXRvciA9IGdldEVkaXRvckZvclBhdGgoZmlsZVBhdGgpXG4gICAgICBhdG9tLnRleHRFZGl0b3JzLmNsZWFyR3JhbW1hck92ZXJyaWRlKGVkaXRvcilcbiAgICByZXR1cm5cblxuZ2V0RWRpdG9yRm9yUGF0aCA9IChmaWxlUGF0aCkgLT5cbiAgaWYgZmlsZVBhdGg/XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5maW5kIChlZGl0b3IpIC0+XG4gICAgICBlZGl0b3IuZ2V0UGF0aCgpIGlzIGZpbGVQYXRoXG4iXX0=
