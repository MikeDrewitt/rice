(function() {
  var SnippetsProvider, ascendingPrefixComparator, firstCharsEqual;

  module.exports = SnippetsProvider = (function() {
    SnippetsProvider.prototype.selector = '*';

    SnippetsProvider.prototype.disableForSelector = '.comment, .string';

    SnippetsProvider.prototype.inclusionPriority = 1;

    SnippetsProvider.prototype.suggestionPriority = 2;

    SnippetsProvider.prototype.filterSuggestions = true;

    function SnippetsProvider() {
      this.showIcon = atom.config.get('autocomplete-plus.defaultProvider') === 'Symbol';
      this.snippetsSource = {
        snippetsForScopes: function(scopeDescriptor) {
          return atom.config.get('snippets', {
            scope: scopeDescriptor
          });
        }
      };
    }

    SnippetsProvider.prototype.setSnippetsSource = function(snippetsSource) {
      if (typeof (snippetsSource != null ? snippetsSource.snippetsForScopes : void 0) === "function") {
        return this.snippetsSource = snippetsSource;
      }
    };

    SnippetsProvider.prototype.getSuggestions = function(arg) {
      var prefix, scopeDescriptor, scopeSnippets;
      scopeDescriptor = arg.scopeDescriptor, prefix = arg.prefix;
      if (!(prefix != null ? prefix.length : void 0)) {
        return;
      }
      scopeSnippets = this.snippetsSource.snippetsForScopes(scopeDescriptor);
      return this.findSuggestionsForPrefix(scopeSnippets, prefix);
    };

    SnippetsProvider.prototype.findSuggestionsForPrefix = function(snippets, prefix) {
      var snippet, snippetPrefix, suggestions;
      if (snippets == null) {
        return [];
      }
      suggestions = [];
      for (snippetPrefix in snippets) {
        snippet = snippets[snippetPrefix];
        if (!(snippet && snippetPrefix && prefix && firstCharsEqual(snippetPrefix, prefix))) {
          continue;
        }
        suggestions.push({
          iconHTML: this.showIcon ? void 0 : false,
          type: 'snippet',
          text: snippet.prefix,
          replacementPrefix: prefix,
          rightLabel: snippet.name,
          rightLabelHTML: snippet.rightLabelHTML,
          leftLabel: snippet.leftLabel,
          leftLabelHTML: snippet.leftLabelHTML,
          description: snippet.description,
          descriptionMoreURL: snippet.descriptionMoreURL
        });
      }
      suggestions.sort(ascendingPrefixComparator);
      return suggestions;
    };

    SnippetsProvider.prototype.onDidInsertSuggestion = function(arg) {
      var editor;
      editor = arg.editor;
      return atom.commands.dispatch(atom.views.getView(editor), 'snippets:expand');
    };

    return SnippetsProvider;

  })();

  ascendingPrefixComparator = function(a, b) {
    return a.text.localeCompare(b.text);
  };

  firstCharsEqual = function(str1, str2) {
    return str1[0].toLowerCase() === str2[0].toLowerCase();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtc25pcHBldHMvbGliL3NuaXBwZXRzLXByb3ZpZGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTsrQkFDSixRQUFBLEdBQVU7OytCQUNWLGtCQUFBLEdBQW9COzsrQkFDcEIsaUJBQUEsR0FBbUI7OytCQUNuQixrQkFBQSxHQUFvQjs7K0JBRXBCLGlCQUFBLEdBQW1COztJQUVOLDBCQUFBO01BQ1gsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsbUNBQWhCLENBQUEsS0FBd0Q7TUFDcEUsSUFBQyxDQUFBLGNBQUQsR0FDRTtRQUFBLGlCQUFBLEVBQW1CLFNBQUMsZUFBRDtpQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLFVBQWhCLEVBQTRCO1lBQUMsS0FBQSxFQUFPLGVBQVI7V0FBNUI7UUFEaUIsQ0FBbkI7O0lBSFM7OytCQU1iLGlCQUFBLEdBQW1CLFNBQUMsY0FBRDtNQUNqQixJQUFHLGlDQUFPLGNBQWMsQ0FBRSwyQkFBdkIsS0FBNEMsVUFBL0M7ZUFDRSxJQUFDLENBQUEsY0FBRCxHQUFrQixlQURwQjs7SUFEaUI7OytCQUluQixjQUFBLEdBQWdCLFNBQUMsR0FBRDtBQUNkLFVBQUE7TUFEZ0IsdUNBQWlCO01BQ2pDLElBQUEsbUJBQWMsTUFBTSxDQUFFLGdCQUF0QjtBQUFBLGVBQUE7O01BQ0EsYUFBQSxHQUFnQixJQUFDLENBQUEsY0FBYyxDQUFDLGlCQUFoQixDQUFrQyxlQUFsQzthQUNoQixJQUFDLENBQUEsd0JBQUQsQ0FBMEIsYUFBMUIsRUFBeUMsTUFBekM7SUFIYzs7K0JBS2hCLHdCQUFBLEdBQTBCLFNBQUMsUUFBRCxFQUFXLE1BQVg7QUFDeEIsVUFBQTtNQUFBLElBQWlCLGdCQUFqQjtBQUFBLGVBQU8sR0FBUDs7TUFFQSxXQUFBLEdBQWM7QUFDZCxXQUFBLHlCQUFBOztRQUNFLElBQUEsQ0FBQSxDQUFnQixPQUFBLElBQVksYUFBWixJQUE4QixNQUE5QixJQUF5QyxlQUFBLENBQWdCLGFBQWhCLEVBQStCLE1BQS9CLENBQXpELENBQUE7QUFBQSxtQkFBQTs7UUFDQSxXQUFXLENBQUMsSUFBWixDQUNFO1VBQUEsUUFBQSxFQUFhLElBQUMsQ0FBQSxRQUFKLEdBQWtCLE1BQWxCLEdBQWlDLEtBQTNDO1VBQ0EsSUFBQSxFQUFNLFNBRE47VUFFQSxJQUFBLEVBQU0sT0FBTyxDQUFDLE1BRmQ7VUFHQSxpQkFBQSxFQUFtQixNQUhuQjtVQUlBLFVBQUEsRUFBWSxPQUFPLENBQUMsSUFKcEI7VUFLQSxjQUFBLEVBQWdCLE9BQU8sQ0FBQyxjQUx4QjtVQU1BLFNBQUEsRUFBVyxPQUFPLENBQUMsU0FObkI7VUFPQSxhQUFBLEVBQWUsT0FBTyxDQUFDLGFBUHZCO1VBUUEsV0FBQSxFQUFhLE9BQU8sQ0FBQyxXQVJyQjtVQVNBLGtCQUFBLEVBQW9CLE9BQU8sQ0FBQyxrQkFUNUI7U0FERjtBQUZGO01BY0EsV0FBVyxDQUFDLElBQVosQ0FBaUIseUJBQWpCO2FBQ0E7SUFuQndCOzsrQkFxQjFCLHFCQUFBLEdBQXVCLFNBQUMsR0FBRDtBQUNyQixVQUFBO01BRHVCLFNBQUQ7YUFDdEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixNQUFuQixDQUF2QixFQUFtRCxpQkFBbkQ7SUFEcUI7Ozs7OztFQUd6Qix5QkFBQSxHQUE0QixTQUFDLENBQUQsRUFBSSxDQUFKO1dBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFQLENBQXFCLENBQUMsQ0FBQyxJQUF2QjtFQUFWOztFQUU1QixlQUFBLEdBQWtCLFNBQUMsSUFBRCxFQUFPLElBQVA7V0FDaEIsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQVIsQ0FBQSxDQUFBLEtBQXlCLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxXQUFSLENBQUE7RUFEVDtBQWxEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTbmlwcGV0c1Byb3ZpZGVyXG4gIHNlbGVjdG9yOiAnKidcbiAgZGlzYWJsZUZvclNlbGVjdG9yOiAnLmNvbW1lbnQsIC5zdHJpbmcnXG4gIGluY2x1c2lvblByaW9yaXR5OiAxXG4gIHN1Z2dlc3Rpb25Qcmlvcml0eTogMlxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zOiB0cnVlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHNob3dJY29uID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5kZWZhdWx0UHJvdmlkZXInKSBpcyAnU3ltYm9sJ1xuICAgIEBzbmlwcGV0c1NvdXJjZSA9XG4gICAgICBzbmlwcGV0c0ZvclNjb3BlczogKHNjb3BlRGVzY3JpcHRvcikgLT5cbiAgICAgICAgYXRvbS5jb25maWcuZ2V0KCdzbmlwcGV0cycsIHtzY29wZTogc2NvcGVEZXNjcmlwdG9yfSlcblxuICBzZXRTbmlwcGV0c1NvdXJjZTogKHNuaXBwZXRzU291cmNlKSAtPlxuICAgIGlmIHR5cGVvZiBzbmlwcGV0c1NvdXJjZT8uc25pcHBldHNGb3JTY29wZXMgaXMgXCJmdW5jdGlvblwiXG4gICAgICBAc25pcHBldHNTb3VyY2UgPSBzbmlwcGV0c1NvdXJjZVxuXG4gIGdldFN1Z2dlc3Rpb25zOiAoe3Njb3BlRGVzY3JpcHRvciwgcHJlZml4fSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHByZWZpeD8ubGVuZ3RoXG4gICAgc2NvcGVTbmlwcGV0cyA9IEBzbmlwcGV0c1NvdXJjZS5zbmlwcGV0c0ZvclNjb3BlcyhzY29wZURlc2NyaXB0b3IpXG4gICAgQGZpbmRTdWdnZXN0aW9uc0ZvclByZWZpeChzY29wZVNuaXBwZXRzLCBwcmVmaXgpXG5cbiAgZmluZFN1Z2dlc3Rpb25zRm9yUHJlZml4OiAoc25pcHBldHMsIHByZWZpeCkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIHNuaXBwZXRzP1xuXG4gICAgc3VnZ2VzdGlvbnMgPSBbXVxuICAgIGZvciBzbmlwcGV0UHJlZml4LCBzbmlwcGV0IG9mIHNuaXBwZXRzXG4gICAgICBjb250aW51ZSB1bmxlc3Mgc25pcHBldCBhbmQgc25pcHBldFByZWZpeCBhbmQgcHJlZml4IGFuZCBmaXJzdENoYXJzRXF1YWwoc25pcHBldFByZWZpeCwgcHJlZml4KVxuICAgICAgc3VnZ2VzdGlvbnMucHVzaFxuICAgICAgICBpY29uSFRNTDogaWYgQHNob3dJY29uIHRoZW4gdW5kZWZpbmVkIGVsc2UgZmFsc2VcbiAgICAgICAgdHlwZTogJ3NuaXBwZXQnXG4gICAgICAgIHRleHQ6IHNuaXBwZXQucHJlZml4XG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICAgICAgcmlnaHRMYWJlbDogc25pcHBldC5uYW1lXG4gICAgICAgIHJpZ2h0TGFiZWxIVE1MOiBzbmlwcGV0LnJpZ2h0TGFiZWxIVE1MXG4gICAgICAgIGxlZnRMYWJlbDogc25pcHBldC5sZWZ0TGFiZWxcbiAgICAgICAgbGVmdExhYmVsSFRNTDogc25pcHBldC5sZWZ0TGFiZWxIVE1MXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzbmlwcGV0LmRlc2NyaXB0aW9uXG4gICAgICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogc25pcHBldC5kZXNjcmlwdGlvbk1vcmVVUkxcblxuICAgIHN1Z2dlc3Rpb25zLnNvcnQoYXNjZW5kaW5nUHJlZml4Q29tcGFyYXRvcilcbiAgICBzdWdnZXN0aW9uc1xuXG4gIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbjogKHtlZGl0b3J9KSAtPlxuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksICdzbmlwcGV0czpleHBhbmQnKVxuXG5hc2NlbmRpbmdQcmVmaXhDb21wYXJhdG9yID0gKGEsIGIpIC0+IGEudGV4dC5sb2NhbGVDb21wYXJlKGIudGV4dClcblxuZmlyc3RDaGFyc0VxdWFsID0gKHN0cjEsIHN0cjIpIC0+XG4gIHN0cjFbMF0udG9Mb3dlckNhc2UoKSBpcyBzdHIyWzBdLnRvTG93ZXJDYXNlKClcbiJdfQ==
