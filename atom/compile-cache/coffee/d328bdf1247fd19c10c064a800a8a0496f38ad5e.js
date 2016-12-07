(function() {
  var attributePattern, firstCharsEqual, fs, path, tagPattern, trailingWhitespace;

  fs = require('fs');

  path = require('path');

  trailingWhitespace = /\s$/;

  attributePattern = /\s+([a-zA-Z][-a-zA-Z]*)\s*=\s*$/;

  tagPattern = /<([a-zA-Z][-a-zA-Z]*)(?:\s|$)/;

  module.exports = {
    selector: '.text.html',
    disableForSelector: '.text.html .comment',
    filterSuggestions: true,
    getSuggestions: function(request) {
      var prefix;
      prefix = request.prefix;
      if (this.isAttributeValueStartWithNoPrefix(request)) {
        return this.getAttributeValueCompletions(request);
      } else if (this.isAttributeValueStartWithPrefix(request)) {
        return this.getAttributeValueCompletions(request, prefix);
      } else if (this.isAttributeStartWithNoPrefix(request)) {
        return this.getAttributeNameCompletions(request);
      } else if (this.isAttributeStartWithPrefix(request)) {
        return this.getAttributeNameCompletions(request, prefix);
      } else if (this.isTagStartWithNoPrefix(request)) {
        return this.getTagNameCompletions();
      } else if (this.isTagStartTagWithPrefix(request)) {
        return this.getTagNameCompletions(prefix);
      } else {
        return [];
      }
    },
    onDidInsertSuggestion: function(arg) {
      var editor, suggestion;
      editor = arg.editor, suggestion = arg.suggestion;
      if (suggestion.type === 'attribute') {
        return setTimeout(this.triggerAutocomplete.bind(this, editor), 1);
      }
    },
    triggerAutocomplete: function(editor) {
      return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {
        activatedManually: false
      });
    },
    isTagStartWithNoPrefix: function(arg) {
      var prefix, scopeDescriptor, scopes;
      prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      scopes = scopeDescriptor.getScopesArray();
      if (prefix === '<' && scopes.length === 1) {
        return scopes[0] === 'text.html.basic';
      } else if (prefix === '<' && scopes.length === 2) {
        return scopes[0] === 'text.html.basic' && scopes[1] === 'meta.scope.outside-tag.html';
      } else {
        return false;
      }
    },
    isTagStartTagWithPrefix: function(arg) {
      var prefix, scopeDescriptor;
      prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      if (!prefix) {
        return false;
      }
      if (trailingWhitespace.test(prefix)) {
        return false;
      }
      return this.hasTagScope(scopeDescriptor.getScopesArray());
    },
    isAttributeStartWithNoPrefix: function(arg) {
      var prefix, scopeDescriptor;
      prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      if (!trailingWhitespace.test(prefix)) {
        return false;
      }
      return this.hasTagScope(scopeDescriptor.getScopesArray());
    },
    isAttributeStartWithPrefix: function(arg) {
      var prefix, scopeDescriptor, scopes;
      prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      if (!prefix) {
        return false;
      }
      if (trailingWhitespace.test(prefix)) {
        return false;
      }
      scopes = scopeDescriptor.getScopesArray();
      if (scopes.indexOf('entity.other.attribute-name.html') !== -1) {
        return true;
      }
      if (!this.hasTagScope(scopes)) {
        return false;
      }
      return scopes.indexOf('punctuation.definition.tag.html') !== -1 || scopes.indexOf('punctuation.definition.tag.end.html') !== -1;
    },
    isAttributeValueStartWithNoPrefix: function(arg) {
      var lastPrefixCharacter, prefix, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, prefix = arg.prefix;
      lastPrefixCharacter = prefix[prefix.length - 1];
      if (lastPrefixCharacter !== '"' && lastPrefixCharacter !== "'") {
        return false;
      }
      scopes = scopeDescriptor.getScopesArray();
      return this.hasStringScope(scopes) && this.hasTagScope(scopes);
    },
    isAttributeValueStartWithPrefix: function(arg) {
      var lastPrefixCharacter, prefix, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, prefix = arg.prefix;
      lastPrefixCharacter = prefix[prefix.length - 1];
      if (lastPrefixCharacter === '"' || lastPrefixCharacter === "'") {
        return false;
      }
      scopes = scopeDescriptor.getScopesArray();
      return this.hasStringScope(scopes) && this.hasTagScope(scopes);
    },
    hasTagScope: function(scopes) {
      return scopes.indexOf('meta.tag.any.html') !== -1 || scopes.indexOf('meta.tag.other.html') !== -1 || scopes.indexOf('meta.tag.block.any.html') !== -1 || scopes.indexOf('meta.tag.inline.any.html') !== -1 || scopes.indexOf('meta.tag.structure.any.html') !== -1;
    },
    hasStringScope: function(scopes) {
      return scopes.indexOf('string.quoted.double.html') !== -1 || scopes.indexOf('string.quoted.single.html') !== -1;
    },
    getTagNameCompletions: function(prefix) {
      var attributes, completions, ref, tag;
      completions = [];
      ref = this.completions.tags;
      for (tag in ref) {
        attributes = ref[tag];
        if (!prefix || firstCharsEqual(tag, prefix)) {
          completions.push(this.buildTagCompletion(tag));
        }
      }
      return completions;
    },
    buildTagCompletion: function(tag) {
      return {
        text: tag,
        type: 'tag',
        description: "HTML <" + tag + "> tag",
        descriptionMoreURL: this.getTagDocsURL(tag)
      };
    },
    getAttributeNameCompletions: function(arg, prefix) {
      var attribute, bufferPosition, completions, editor, i, len, options, ref, tag, tagAttributes;
      editor = arg.editor, bufferPosition = arg.bufferPosition;
      completions = [];
      tag = this.getPreviousTag(editor, bufferPosition);
      tagAttributes = this.getTagAttributes(tag);
      for (i = 0, len = tagAttributes.length; i < len; i++) {
        attribute = tagAttributes[i];
        if (!prefix || firstCharsEqual(attribute, prefix)) {
          completions.push(this.buildAttributeCompletion(attribute, tag));
        }
      }
      ref = this.completions.attributes;
      for (attribute in ref) {
        options = ref[attribute];
        if (!prefix || firstCharsEqual(attribute, prefix)) {
          if (options.global) {
            completions.push(this.buildAttributeCompletion(attribute));
          }
        }
      }
      return completions;
    },
    buildAttributeCompletion: function(attribute, tag) {
      if (tag != null) {
        return {
          snippet: attribute + "=\"$1\"$0",
          displayText: attribute,
          type: 'attribute',
          rightLabel: "<" + tag + ">",
          description: attribute + " attribute local to <" + tag + "> tags",
          descriptionMoreURL: this.getLocalAttributeDocsURL(attribute, tag)
        };
      } else {
        return {
          snippet: attribute + "=\"$1\"$0",
          displayText: attribute,
          type: 'attribute',
          description: "Global " + attribute + " attribute",
          descriptionMoreURL: this.getGlobalAttributeDocsURL(attribute)
        };
      }
    },
    getAttributeValueCompletions: function(arg, prefix) {
      var attribute, bufferPosition, editor, i, len, results, tag, value, values;
      editor = arg.editor, bufferPosition = arg.bufferPosition;
      tag = this.getPreviousTag(editor, bufferPosition);
      attribute = this.getPreviousAttribute(editor, bufferPosition);
      values = this.getAttributeValues(attribute);
      results = [];
      for (i = 0, len = values.length; i < len; i++) {
        value = values[i];
        if (!prefix || firstCharsEqual(value, prefix)) {
          results.push(this.buildAttributeValueCompletion(tag, attribute, value));
        }
      }
      return results;
    },
    buildAttributeValueCompletion: function(tag, attribute, value) {
      if (this.completions.attributes[attribute].global) {
        return {
          text: value,
          type: 'value',
          description: value + " value for global " + attribute + " attribute",
          descriptionMoreURL: this.getGlobalAttributeDocsURL(attribute)
        };
      } else {
        return {
          text: value,
          type: 'value',
          description: value + " value for " + attribute + " attribute local to <" + tag + ">",
          descriptionMoreURL: this.getLocalAttributeDocsURL(attribute, tag)
        };
      }
    },
    loadCompletions: function() {
      this.completions = {};
      return fs.readFile(path.resolve(__dirname, '..', 'completions.json'), (function(_this) {
        return function(error, content) {
          if (error == null) {
            _this.completions = JSON.parse(content);
          }
        };
      })(this));
    },
    getPreviousTag: function(editor, bufferPosition) {
      var ref, row, tag;
      row = bufferPosition.row;
      while (row >= 0) {
        tag = (ref = tagPattern.exec(editor.lineTextForBufferRow(row))) != null ? ref[1] : void 0;
        if (tag) {
          return tag;
        }
        row--;
      }
    },
    getPreviousAttribute: function(editor, bufferPosition) {
      var line, quoteIndex, ref, ref1;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]).trim();
      quoteIndex = line.length - 1;
      while (line[quoteIndex] && !((ref = line[quoteIndex]) === '"' || ref === "'")) {
        quoteIndex--;
      }
      line = line.substring(0, quoteIndex);
      return (ref1 = attributePattern.exec(line)) != null ? ref1[1] : void 0;
    },
    getAttributeValues: function(attribute) {
      var ref;
      attribute = this.completions.attributes[attribute];
      return (ref = attribute != null ? attribute.attribOption : void 0) != null ? ref : [];
    },
    getTagAttributes: function(tag) {
      var ref, ref1;
      return (ref = (ref1 = this.completions.tags[tag]) != null ? ref1.attributes : void 0) != null ? ref : [];
    },
    getTagDocsURL: function(tag) {
      return "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/" + tag;
    },
    getLocalAttributeDocsURL: function(attribute, tag) {
      return (this.getTagDocsURL(tag)) + "#attr-" + attribute;
    },
    getGlobalAttributeDocsURL: function(attribute) {
      return "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/" + attribute;
    }
  };

  firstCharsEqual = function(str1, str2) {
    return str1[0].toLowerCase() === str2[0].toLowerCase();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtaHRtbC9saWIvcHJvdmlkZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLGtCQUFBLEdBQXFCOztFQUNyQixnQkFBQSxHQUFtQjs7RUFDbkIsVUFBQSxHQUFhOztFQUViLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsWUFBVjtJQUNBLGtCQUFBLEVBQW9CLHFCQURwQjtJQUVBLGlCQUFBLEVBQW1CLElBRm5CO0lBSUEsY0FBQSxFQUFnQixTQUFDLE9BQUQ7QUFDZCxVQUFBO01BQUMsU0FBVTtNQUNYLElBQUcsSUFBQyxDQUFBLGlDQUFELENBQW1DLE9BQW5DLENBQUg7ZUFDRSxJQUFDLENBQUEsNEJBQUQsQ0FBOEIsT0FBOUIsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsK0JBQUQsQ0FBaUMsT0FBakMsQ0FBSDtlQUNILElBQUMsQ0FBQSw0QkFBRCxDQUE4QixPQUE5QixFQUF1QyxNQUF2QyxFQURHO09BQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSw0QkFBRCxDQUE4QixPQUE5QixDQUFIO2VBQ0gsSUFBQyxDQUFBLDJCQUFELENBQTZCLE9BQTdCLEVBREc7T0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLDBCQUFELENBQTRCLE9BQTVCLENBQUg7ZUFDSCxJQUFDLENBQUEsMkJBQUQsQ0FBNkIsT0FBN0IsRUFBc0MsTUFBdEMsRUFERztPQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsT0FBeEIsQ0FBSDtlQUNILElBQUMsQ0FBQSxxQkFBRCxDQUFBLEVBREc7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LENBQUEsQ0FBRSxDQUFDLFdBQVIsQ0FBQTtFQURUO0FBMUxsQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxudHJhaWxpbmdXaGl0ZXNwYWNlID0gL1xccyQvXG5hdHRyaWJ1dGVQYXR0ZXJuID0gL1xccysoW2EtekEtWl1bLWEtekEtWl0qKVxccyo9XFxzKiQvXG50YWdQYXR0ZXJuID0gLzwoW2EtekEtWl1bLWEtekEtWl0qKSg/Olxcc3wkKS9cblxubW9kdWxlLmV4cG9ydHMgPVxuICBzZWxlY3RvcjogJy50ZXh0Lmh0bWwnXG4gIGRpc2FibGVGb3JTZWxlY3RvcjogJy50ZXh0Lmh0bWwgLmNvbW1lbnQnXG4gIGZpbHRlclN1Z2dlc3Rpb25zOiB0cnVlXG5cbiAgZ2V0U3VnZ2VzdGlvbnM6IChyZXF1ZXN0KSAtPlxuICAgIHtwcmVmaXh9ID0gcmVxdWVzdFxuICAgIGlmIEBpc0F0dHJpYnV0ZVZhbHVlU3RhcnRXaXRoTm9QcmVmaXgocmVxdWVzdClcbiAgICAgIEBnZXRBdHRyaWJ1dGVWYWx1ZUNvbXBsZXRpb25zKHJlcXVlc3QpXG4gICAgZWxzZSBpZiBAaXNBdHRyaWJ1dGVWYWx1ZVN0YXJ0V2l0aFByZWZpeChyZXF1ZXN0KVxuICAgICAgQGdldEF0dHJpYnV0ZVZhbHVlQ29tcGxldGlvbnMocmVxdWVzdCwgcHJlZml4KVxuICAgIGVsc2UgaWYgQGlzQXR0cmlidXRlU3RhcnRXaXRoTm9QcmVmaXgocmVxdWVzdClcbiAgICAgIEBnZXRBdHRyaWJ1dGVOYW1lQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICBlbHNlIGlmIEBpc0F0dHJpYnV0ZVN0YXJ0V2l0aFByZWZpeChyZXF1ZXN0KVxuICAgICAgQGdldEF0dHJpYnV0ZU5hbWVDb21wbGV0aW9ucyhyZXF1ZXN0LCBwcmVmaXgpXG4gICAgZWxzZSBpZiBAaXNUYWdTdGFydFdpdGhOb1ByZWZpeChyZXF1ZXN0KVxuICAgICAgQGdldFRhZ05hbWVDb21wbGV0aW9ucygpXG4gICAgZWxzZSBpZiBAaXNUYWdTdGFydFRhZ1dpdGhQcmVmaXgocmVxdWVzdClcbiAgICAgIEBnZXRUYWdOYW1lQ29tcGxldGlvbnMocHJlZml4KVxuICAgIGVsc2VcbiAgICAgIFtdXG5cbiAgb25EaWRJbnNlcnRTdWdnZXN0aW9uOiAoe2VkaXRvciwgc3VnZ2VzdGlvbn0pIC0+XG4gICAgc2V0VGltZW91dChAdHJpZ2dlckF1dG9jb21wbGV0ZS5iaW5kKHRoaXMsIGVkaXRvciksIDEpIGlmIHN1Z2dlc3Rpb24udHlwZSBpcyAnYXR0cmlidXRlJ1xuXG4gIHRyaWdnZXJBdXRvY29tcGxldGU6IChlZGl0b3IpIC0+XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJywgYWN0aXZhdGVkTWFudWFsbHk6IGZhbHNlKVxuXG4gIGlzVGFnU3RhcnRXaXRoTm9QcmVmaXg6ICh7cHJlZml4LCBzY29wZURlc2NyaXB0b3J9KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgaWYgcHJlZml4IGlzICc8JyBhbmQgc2NvcGVzLmxlbmd0aCBpcyAxXG4gICAgICBzY29wZXNbMF0gaXMgJ3RleHQuaHRtbC5iYXNpYydcbiAgICBlbHNlIGlmIHByZWZpeCBpcyAnPCcgYW5kIHNjb3Blcy5sZW5ndGggaXMgMlxuICAgICAgc2NvcGVzWzBdIGlzICd0ZXh0Lmh0bWwuYmFzaWMnIGFuZCBzY29wZXNbMV0gaXMgJ21ldGEuc2NvcGUub3V0c2lkZS10YWcuaHRtbCdcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGlzVGFnU3RhcnRUYWdXaXRoUHJlZml4OiAoe3ByZWZpeCwgc2NvcGVEZXNjcmlwdG9yfSkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZWZpeFxuICAgIHJldHVybiBmYWxzZSBpZiB0cmFpbGluZ1doaXRlc3BhY2UudGVzdChwcmVmaXgpXG4gICAgQGhhc1RhZ1Njb3BlKHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpKVxuXG4gIGlzQXR0cmlidXRlU3RhcnRXaXRoTm9QcmVmaXg6ICh7cHJlZml4LCBzY29wZURlc2NyaXB0b3J9KSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdHJhaWxpbmdXaGl0ZXNwYWNlLnRlc3QocHJlZml4KVxuICAgIEBoYXNUYWdTY29wZShzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKSlcblxuICBpc0F0dHJpYnV0ZVN0YXJ0V2l0aFByZWZpeDogKHtwcmVmaXgsIHNjb3BlRGVzY3JpcHRvcn0pIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmVmaXhcbiAgICByZXR1cm4gZmFsc2UgaWYgdHJhaWxpbmdXaGl0ZXNwYWNlLnRlc3QocHJlZml4KVxuXG4gICAgc2NvcGVzID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClcbiAgICByZXR1cm4gdHJ1ZSBpZiBzY29wZXMuaW5kZXhPZignZW50aXR5Lm90aGVyLmF0dHJpYnV0ZS1uYW1lLmh0bWwnKSBpc250IC0xXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAaGFzVGFnU2NvcGUoc2NvcGVzKVxuXG4gICAgc2NvcGVzLmluZGV4T2YoJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udGFnLmh0bWwnKSBpc250IC0xIG9yXG4gICAgICBzY29wZXMuaW5kZXhPZigncHVuY3R1YXRpb24uZGVmaW5pdGlvbi50YWcuZW5kLmh0bWwnKSBpc250IC0xXG5cbiAgaXNBdHRyaWJ1dGVWYWx1ZVN0YXJ0V2l0aE5vUHJlZml4OiAoe3Njb3BlRGVzY3JpcHRvciwgcHJlZml4fSkgLT5cbiAgICBsYXN0UHJlZml4Q2hhcmFjdGVyID0gcHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXVxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgbGFzdFByZWZpeENoYXJhY3RlciBpbiBbJ1wiJywgXCInXCJdXG4gICAgc2NvcGVzID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClcbiAgICBAaGFzU3RyaW5nU2NvcGUoc2NvcGVzKSBhbmQgQGhhc1RhZ1Njb3BlKHNjb3BlcylcblxuICBpc0F0dHJpYnV0ZVZhbHVlU3RhcnRXaXRoUHJlZml4OiAoe3Njb3BlRGVzY3JpcHRvciwgcHJlZml4fSkgLT5cbiAgICBsYXN0UHJlZml4Q2hhcmFjdGVyID0gcHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXVxuICAgIHJldHVybiBmYWxzZSBpZiBsYXN0UHJlZml4Q2hhcmFjdGVyIGluIFsnXCInLCBcIidcIl1cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIEBoYXNTdHJpbmdTY29wZShzY29wZXMpIGFuZCBAaGFzVGFnU2NvcGUoc2NvcGVzKVxuXG4gIGhhc1RhZ1Njb3BlOiAoc2NvcGVzKSAtPlxuICAgIHNjb3Blcy5pbmRleE9mKCdtZXRhLnRhZy5hbnkuaHRtbCcpIGlzbnQgLTEgb3JcbiAgICAgIHNjb3Blcy5pbmRleE9mKCdtZXRhLnRhZy5vdGhlci5odG1sJykgaXNudCAtMSBvclxuICAgICAgc2NvcGVzLmluZGV4T2YoJ21ldGEudGFnLmJsb2NrLmFueS5odG1sJykgaXNudCAtMSBvclxuICAgICAgc2NvcGVzLmluZGV4T2YoJ21ldGEudGFnLmlubGluZS5hbnkuaHRtbCcpIGlzbnQgLTEgb3JcbiAgICAgIHNjb3Blcy5pbmRleE9mKCdtZXRhLnRhZy5zdHJ1Y3R1cmUuYW55Lmh0bWwnKSBpc250IC0xXG5cbiAgaGFzU3RyaW5nU2NvcGU6IChzY29wZXMpIC0+XG4gICAgc2NvcGVzLmluZGV4T2YoJ3N0cmluZy5xdW90ZWQuZG91YmxlLmh0bWwnKSBpc250IC0xIG9yXG4gICAgICBzY29wZXMuaW5kZXhPZignc3RyaW5nLnF1b3RlZC5zaW5nbGUuaHRtbCcpIGlzbnQgLTFcblxuICBnZXRUYWdOYW1lQ29tcGxldGlvbnM6IChwcmVmaXgpIC0+XG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGZvciB0YWcsIGF0dHJpYnV0ZXMgb2YgQGNvbXBsZXRpb25zLnRhZ3Mgd2hlbiBub3QgcHJlZml4IG9yIGZpcnN0Q2hhcnNFcXVhbCh0YWcsIHByZWZpeClcbiAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkVGFnQ29tcGxldGlvbih0YWcpKVxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRUYWdDb21wbGV0aW9uOiAodGFnKSAtPlxuICAgIHRleHQ6IHRhZ1xuICAgIHR5cGU6ICd0YWcnXG4gICAgZGVzY3JpcHRpb246IFwiSFRNTCA8I3t0YWd9PiB0YWdcIlxuICAgIGRlc2NyaXB0aW9uTW9yZVVSTDogQGdldFRhZ0RvY3NVUkwodGFnKVxuXG4gIGdldEF0dHJpYnV0ZU5hbWVDb21wbGV0aW9uczogKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9ufSwgcHJlZml4KSAtPlxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICB0YWcgPSBAZ2V0UHJldmlvdXNUYWcoZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcbiAgICB0YWdBdHRyaWJ1dGVzID0gQGdldFRhZ0F0dHJpYnV0ZXModGFnKVxuXG4gICAgZm9yIGF0dHJpYnV0ZSBpbiB0YWdBdHRyaWJ1dGVzIHdoZW4gbm90IHByZWZpeCBvciBmaXJzdENoYXJzRXF1YWwoYXR0cmlidXRlLCBwcmVmaXgpXG4gICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZEF0dHJpYnV0ZUNvbXBsZXRpb24oYXR0cmlidXRlLCB0YWcpKVxuXG4gICAgZm9yIGF0dHJpYnV0ZSwgb3B0aW9ucyBvZiBAY29tcGxldGlvbnMuYXR0cmlidXRlcyB3aGVuIG5vdCBwcmVmaXggb3IgZmlyc3RDaGFyc0VxdWFsKGF0dHJpYnV0ZSwgcHJlZml4KVxuICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRBdHRyaWJ1dGVDb21wbGV0aW9uKGF0dHJpYnV0ZSkpIGlmIG9wdGlvbnMuZ2xvYmFsXG5cbiAgICBjb21wbGV0aW9uc1xuXG4gIGJ1aWxkQXR0cmlidXRlQ29tcGxldGlvbjogKGF0dHJpYnV0ZSwgdGFnKSAtPlxuICAgIGlmIHRhZz9cbiAgICAgIHNuaXBwZXQ6IFwiI3thdHRyaWJ1dGV9PVxcXCIkMVxcXCIkMFwiXG4gICAgICBkaXNwbGF5VGV4dDogYXR0cmlidXRlXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJ1xuICAgICAgcmlnaHRMYWJlbDogXCI8I3t0YWd9PlwiXG4gICAgICBkZXNjcmlwdGlvbjogXCIje2F0dHJpYnV0ZX0gYXR0cmlidXRlIGxvY2FsIHRvIDwje3RhZ30+IHRhZ3NcIlxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBAZ2V0TG9jYWxBdHRyaWJ1dGVEb2NzVVJMKGF0dHJpYnV0ZSwgdGFnKVxuICAgIGVsc2VcbiAgICAgIHNuaXBwZXQ6IFwiI3thdHRyaWJ1dGV9PVxcXCIkMVxcXCIkMFwiXG4gICAgICBkaXNwbGF5VGV4dDogYXR0cmlidXRlXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJ1xuICAgICAgZGVzY3JpcHRpb246IFwiR2xvYmFsICN7YXR0cmlidXRlfSBhdHRyaWJ1dGVcIlxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBAZ2V0R2xvYmFsQXR0cmlidXRlRG9jc1VSTChhdHRyaWJ1dGUpXG5cbiAgZ2V0QXR0cmlidXRlVmFsdWVDb21wbGV0aW9uczogKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9ufSwgcHJlZml4KSAtPlxuICAgIHRhZyA9IEBnZXRQcmV2aW91c1RhZyhlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIGF0dHJpYnV0ZSA9IEBnZXRQcmV2aW91c0F0dHJpYnV0ZShlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIHZhbHVlcyA9IEBnZXRBdHRyaWJ1dGVWYWx1ZXMoYXR0cmlidXRlKVxuICAgIGZvciB2YWx1ZSBpbiB2YWx1ZXMgd2hlbiBub3QgcHJlZml4IG9yIGZpcnN0Q2hhcnNFcXVhbCh2YWx1ZSwgcHJlZml4KVxuICAgICAgQGJ1aWxkQXR0cmlidXRlVmFsdWVDb21wbGV0aW9uKHRhZywgYXR0cmlidXRlLCB2YWx1ZSlcblxuICBidWlsZEF0dHJpYnV0ZVZhbHVlQ29tcGxldGlvbjogKHRhZywgYXR0cmlidXRlLCB2YWx1ZSkgLT5cbiAgICBpZiBAY29tcGxldGlvbnMuYXR0cmlidXRlc1thdHRyaWJ1dGVdLmdsb2JhbFxuICAgICAgdGV4dDogdmFsdWVcbiAgICAgIHR5cGU6ICd2YWx1ZSdcbiAgICAgIGRlc2NyaXB0aW9uOiBcIiN7dmFsdWV9IHZhbHVlIGZvciBnbG9iYWwgI3thdHRyaWJ1dGV9IGF0dHJpYnV0ZVwiXG4gICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IEBnZXRHbG9iYWxBdHRyaWJ1dGVEb2NzVVJMKGF0dHJpYnV0ZSlcbiAgICBlbHNlXG4gICAgICB0ZXh0OiB2YWx1ZVxuICAgICAgdHlwZTogJ3ZhbHVlJ1xuICAgICAgZGVzY3JpcHRpb246IFwiI3t2YWx1ZX0gdmFsdWUgZm9yICN7YXR0cmlidXRlfSBhdHRyaWJ1dGUgbG9jYWwgdG8gPCN7dGFnfT5cIlxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBAZ2V0TG9jYWxBdHRyaWJ1dGVEb2NzVVJMKGF0dHJpYnV0ZSwgdGFnKVxuXG4gIGxvYWRDb21wbGV0aW9uczogLT5cbiAgICBAY29tcGxldGlvbnMgPSB7fVxuICAgIGZzLnJlYWRGaWxlIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICdjb21wbGV0aW9ucy5qc29uJyksIChlcnJvciwgY29udGVudCkgPT5cbiAgICAgIEBjb21wbGV0aW9ucyA9IEpTT04ucGFyc2UoY29udGVudCkgdW5sZXNzIGVycm9yP1xuICAgICAgcmV0dXJuXG5cbiAgZ2V0UHJldmlvdXNUYWc6IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICAgIHtyb3d9ID0gYnVmZmVyUG9zaXRpb25cbiAgICB3aGlsZSByb3cgPj0gMFxuICAgICAgdGFnID0gdGFnUGF0dGVybi5leGVjKGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKT9bMV1cbiAgICAgIHJldHVybiB0YWcgaWYgdGFnXG4gICAgICByb3ctLVxuICAgIHJldHVyblxuXG4gIGdldFByZXZpb3VzQXR0cmlidXRlOiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKS50cmltKClcblxuICAgICMgUmVtb3ZlIGV2ZXJ5dGhpbmcgdW50aWwgdGhlIG9wZW5pbmcgcXVvdGVcbiAgICBxdW90ZUluZGV4ID0gbGluZS5sZW5ndGggLSAxXG4gICAgcXVvdGVJbmRleC0tIHdoaWxlIGxpbmVbcXVvdGVJbmRleF0gYW5kIG5vdCAobGluZVtxdW90ZUluZGV4XSBpbiBbJ1wiJywgXCInXCJdKVxuICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygwLCBxdW90ZUluZGV4KVxuXG4gICAgYXR0cmlidXRlUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuXG4gIGdldEF0dHJpYnV0ZVZhbHVlczogKGF0dHJpYnV0ZSkgLT5cbiAgICBhdHRyaWJ1dGUgPSBAY29tcGxldGlvbnMuYXR0cmlidXRlc1thdHRyaWJ1dGVdXG4gICAgYXR0cmlidXRlPy5hdHRyaWJPcHRpb24gPyBbXVxuXG4gIGdldFRhZ0F0dHJpYnV0ZXM6ICh0YWcpIC0+XG4gICAgQGNvbXBsZXRpb25zLnRhZ3NbdGFnXT8uYXR0cmlidXRlcyA/IFtdXG5cbiAgZ2V0VGFnRG9jc1VSTDogKHRhZykgLT5cbiAgICBcImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC8je3RhZ31cIlxuXG4gIGdldExvY2FsQXR0cmlidXRlRG9jc1VSTDogKGF0dHJpYnV0ZSwgdGFnKSAtPlxuICAgIFwiI3tAZ2V0VGFnRG9jc1VSTCh0YWcpfSNhdHRyLSN7YXR0cmlidXRlfVwiXG5cbiAgZ2V0R2xvYmFsQXR0cmlidXRlRG9jc1VSTDogKGF0dHJpYnV0ZSkgLT5cbiAgICBcImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvR2xvYmFsX2F0dHJpYnV0ZXMvI3thdHRyaWJ1dGV9XCJcblxuZmlyc3RDaGFyc0VxdWFsID0gKHN0cjEsIHN0cjIpIC0+XG4gIHN0cjFbMF0udG9Mb3dlckNhc2UoKSBpcyBzdHIyWzBdLnRvTG93ZXJDYXNlKClcbiJdfQ==
