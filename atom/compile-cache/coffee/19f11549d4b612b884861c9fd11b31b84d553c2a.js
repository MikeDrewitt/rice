(function() {
  var cssDocsURL, firstCharsEqual, firstInlinePropertyNameWithColonPattern, fs, hasScope, importantPrefixPattern, inlinePropertyNameWithColonPattern, path, pesudoSelectorPrefixPattern, propertyNamePrefixPattern, propertyNameWithColonPattern, tagSelectorPrefixPattern;

  fs = require('fs');

  path = require('path');

  firstInlinePropertyNameWithColonPattern = /{\s*(\S+)\s*:/;

  inlinePropertyNameWithColonPattern = /(?:;.+?)*;\s*(\S+)\s*:/;

  propertyNameWithColonPattern = /^\s*(\S+)\s*:/;

  propertyNamePrefixPattern = /[a-zA-Z]+[-a-zA-Z]*$/;

  pesudoSelectorPrefixPattern = /:(:)?([a-z]+[a-z-]*)?$/;

  tagSelectorPrefixPattern = /(^|\s|,)([a-z]+)?$/;

  importantPrefixPattern = /(![a-z]+)$/;

  cssDocsURL = "https://developer.mozilla.org/en-US/docs/Web/CSS";

  module.exports = {
    selector: '.source.css, .source.sass',
    disableForSelector: '.source.css .comment, .source.css .string, .source.sass .comment, .source.sass .string',
    filterSuggestions: true,
    getSuggestions: function(request) {
      var completions, isSass, scopes, tagCompletions;
      completions = null;
      scopes = request.scopeDescriptor.getScopesArray();
      isSass = hasScope(scopes, 'source.sass');
      if (this.isCompletingValue(request)) {
        completions = this.getPropertyValueCompletions(request);
      } else if (this.isCompletingPseudoSelector(request)) {
        completions = this.getPseudoSelectorCompletions(request);
      } else {
        if (isSass && this.isCompletingNameOrTag(request)) {
          completions = this.getPropertyNameCompletions(request).concat(this.getTagCompletions(request));
        } else if (!isSass && this.isCompletingName(request)) {
          completions = this.getPropertyNameCompletions(request);
        }
      }
      if (!isSass && this.isCompletingTagSelector(request)) {
        tagCompletions = this.getTagCompletions(request);
        if (tagCompletions != null ? tagCompletions.length : void 0) {
          if (completions == null) {
            completions = [];
          }
          completions = completions.concat(tagCompletions);
        }
      }
      return completions;
    },
    onDidInsertSuggestion: function(arg) {
      var editor, suggestion;
      editor = arg.editor, suggestion = arg.suggestion;
      if (suggestion.type === 'property') {
        return setTimeout(this.triggerAutocomplete.bind(this, editor), 1);
      }
    },
    triggerAutocomplete: function(editor) {
      return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {
        activatedManually: false
      });
    },
    loadProperties: function() {
      this.properties = {};
      return fs.readFile(path.resolve(__dirname, '..', 'completions.json'), (function(_this) {
        return function(error, content) {
          var ref;
          if (error == null) {
            ref = JSON.parse(content), _this.pseudoSelectors = ref.pseudoSelectors, _this.properties = ref.properties, _this.tags = ref.tags;
          }
        };
      })(this));
    },
    isCompletingValue: function(arg) {
      var beforePrefixBufferPosition, beforePrefixScopes, beforePrefixScopesArray, bufferPosition, editor, prefix, previousBufferPosition, previousScopes, previousScopesArray, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, prefix = arg.prefix, editor = arg.editor;
      scopes = scopeDescriptor.getScopesArray();
      beforePrefixBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
      beforePrefixScopes = editor.scopeDescriptorForBufferPosition(beforePrefixBufferPosition);
      beforePrefixScopesArray = beforePrefixScopes.getScopesArray();
      previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)];
      previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
      previousScopesArray = previousScopes.getScopesArray();
      return (hasScope(scopes, 'meta.property-list.css') && prefix.trim() === ":") || (hasScope(previousScopesArray, 'meta.property-value.css')) || (hasScope(scopes, 'meta.property-list.scss') && prefix.trim() === ":") || (hasScope(previousScopesArray, 'meta.property-value.scss')) || (hasScope(scopes, 'source.sass') && (hasScope(scopes, 'meta.property-value.sass') || (!hasScope(beforePrefixScopesArray, "entity.name.tag.css.sass") && prefix.trim() === ":")));
    },
    isCompletingName: function(arg) {
      var bufferPosition, editor, isAtBeginScopePunctuation, isAtEndScopePunctuation, isAtParentSymbol, isAtTerminator, isInPropertyList, prefix, previousBufferPosition, previousScopes, previousScopesArray, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, prefix = arg.prefix, editor = arg.editor;
      scopes = scopeDescriptor.getScopesArray();
      isAtTerminator = prefix.endsWith(';');
      isAtParentSymbol = prefix.endsWith('&');
      isInPropertyList = !isAtTerminator && (hasScope(scopes, 'meta.property-list.css') || hasScope(scopes, 'meta.property-list.scss'));
      if (!isInPropertyList) {
        return false;
      }
      if (isAtParentSymbol) {
        return false;
      }
      previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
      previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
      previousScopesArray = previousScopes.getScopesArray();
      if (hasScope(previousScopesArray, 'entity.other.attribute-name.class.css') || hasScope(previousScopesArray, 'entity.other.attribute-name.id.css') || hasScope(previousScopesArray, 'entity.other.attribute-name.id') || hasScope(previousScopesArray, 'entity.other.attribute-name.parent-selector.css') || hasScope(previousScopesArray, 'entity.name.tag.reference.scss') || hasScope(previousScopesArray, 'entity.name.tag.scss')) {
        return false;
      }
      isAtBeginScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.begin.css') || hasScope(scopes, 'punctuation.section.property-list.begin.bracket.curly.scss');
      isAtEndScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.end.css') || hasScope(scopes, 'punctuation.section.property-list.end.bracket.curly.scss');
      if (isAtBeginScopePunctuation) {
        return prefix.endsWith('{');
      } else if (isAtEndScopePunctuation) {
        return !prefix.endsWith('}');
      } else {
        return true;
      }
    },
    isCompletingNameOrTag: function(arg) {
      var bufferPosition, editor, prefix, scopeDescriptor, scopes;
      scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition, editor = arg.editor;
      scopes = scopeDescriptor.getScopesArray();
      prefix = this.getPropertyNamePrefix(bufferPosition, editor);
      return this.isPropertyNamePrefix(prefix) && hasScope(scopes, 'meta.selector.css') && !hasScope(scopes, 'entity.other.attribute-name.id.css.sass') && !hasScope(scopes, 'entity.other.attribute-name.class.sass');
    },
    isCompletingTagSelector: function(arg) {
      var bufferPosition, editor, previousBufferPosition, previousScopes, previousScopesArray, scopeDescriptor, scopes, tagSelectorPrefix;
      editor = arg.editor, scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition;
      scopes = scopeDescriptor.getScopesArray();
      tagSelectorPrefix = this.getTagSelectorPrefix(editor, bufferPosition);
      if (!(tagSelectorPrefix != null ? tagSelectorPrefix.length : void 0)) {
        return false;
      }
      previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)];
      previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
      previousScopesArray = previousScopes.getScopesArray();
      if (hasScope(scopes, 'meta.selector.css')) {
        return true;
      } else if (hasScope(scopes, 'source.css.scss') || hasScope(scopes, 'source.css.less')) {
        return !hasScope(previousScopesArray, 'meta.property-value.scss') && !hasScope(previousScopesArray, 'meta.property-value.css') && !hasScope(previousScopesArray, 'support.type.property-value.css');
      } else {
        return false;
      }
    },
    isCompletingPseudoSelector: function(arg) {
      var bufferPosition, editor, prefix, previousBufferPosition, previousScopes, previousScopesArray, scopeDescriptor, scopes;
      editor = arg.editor, scopeDescriptor = arg.scopeDescriptor, bufferPosition = arg.bufferPosition;
      scopes = scopeDescriptor.getScopesArray();
      if (hasScope(scopes, 'meta.selector.css') && !hasScope(scopes, 'source.sass')) {
        return true;
      } else if (hasScope(scopes, 'source.css.scss') || hasScope(scopes, 'source.css.less') || hasScope(scopes, 'source.sass')) {
        prefix = this.getPseudoSelectorPrefix(editor, bufferPosition);
        if (prefix) {
          previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)];
          previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition);
          previousScopesArray = previousScopes.getScopesArray();
          return !hasScope(previousScopesArray, 'meta.property-name.scss') && !hasScope(previousScopesArray, 'meta.property-value.scss') && !hasScope(previousScopesArray, 'support.type.property-name.css') && !hasScope(previousScopesArray, 'support.type.property-value.css');
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
    isPropertyValuePrefix: function(prefix) {
      prefix = prefix.trim();
      return prefix.length > 0 && prefix !== ':';
    },
    isPropertyNamePrefix: function(prefix) {
      if (prefix == null) {
        return false;
      }
      prefix = prefix.trim();
      return prefix.length > 0 && prefix.match(/^[a-zA-Z-]+$/);
    },
    getImportantPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = importantPrefixPattern.exec(line)) != null ? ref[1] : void 0;
    },
    getPreviousPropertyName: function(bufferPosition, editor) {
      var line, propertyName, ref, ref1, ref2, row;
      row = bufferPosition.row;
      while (row >= 0) {
        line = editor.lineTextForBufferRow(row);
        propertyName = (ref = inlinePropertyNameWithColonPattern.exec(line)) != null ? ref[1] : void 0;
        if (propertyName == null) {
          propertyName = (ref1 = firstInlinePropertyNameWithColonPattern.exec(line)) != null ? ref1[1] : void 0;
        }
        if (propertyName == null) {
          propertyName = (ref2 = propertyNameWithColonPattern.exec(line)) != null ? ref2[1] : void 0;
        }
        if (propertyName) {
          return propertyName;
        }
        row--;
      }
    },
    getPropertyValueCompletions: function(arg) {
      var bufferPosition, completions, editor, i, importantPrefix, j, len, len1, prefix, property, ref, scopeDescriptor, scopes, value, values;
      bufferPosition = arg.bufferPosition, editor = arg.editor, prefix = arg.prefix, scopeDescriptor = arg.scopeDescriptor;
      property = this.getPreviousPropertyName(bufferPosition, editor);
      values = (ref = this.properties[property]) != null ? ref.values : void 0;
      if (values == null) {
        return null;
      }
      scopes = scopeDescriptor.getScopesArray();
      completions = [];
      if (this.isPropertyValuePrefix(prefix)) {
        for (i = 0, len = values.length; i < len; i++) {
          value = values[i];
          if (firstCharsEqual(value, prefix)) {
            completions.push(this.buildPropertyValueCompletion(value, property, scopes));
          }
        }
      } else {
        for (j = 0, len1 = values.length; j < len1; j++) {
          value = values[j];
          completions.push(this.buildPropertyValueCompletion(value, property, scopes));
        }
      }
      if (importantPrefix = this.getImportantPrefix(editor, bufferPosition)) {
        completions.push({
          type: 'keyword',
          text: '!important',
          displayText: '!important',
          replacementPrefix: importantPrefix,
          description: "Forces this property to override any other declaration of the same property. Use with caution.",
          descriptionMoreURL: cssDocsURL + "/Specificity#The_!important_exception"
        });
      }
      return completions;
    },
    buildPropertyValueCompletion: function(value, propertyName, scopes) {
      var text;
      text = value;
      if (!hasScope(scopes, 'source.sass')) {
        text += ';';
      }
      return {
        type: 'value',
        text: text,
        displayText: value,
        description: value + " value for the " + propertyName + " property",
        descriptionMoreURL: cssDocsURL + "/" + propertyName + "#Values"
      };
    },
    getPropertyNamePrefix: function(bufferPosition, editor) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = propertyNamePrefixPattern.exec(line)) != null ? ref[0] : void 0;
    },
    getPropertyNameCompletions: function(arg) {
      var activatedManually, bufferPosition, completions, editor, line, options, prefix, property, ref, scopeDescriptor, scopes;
      bufferPosition = arg.bufferPosition, editor = arg.editor, scopeDescriptor = arg.scopeDescriptor, activatedManually = arg.activatedManually;
      scopes = scopeDescriptor.getScopesArray();
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      if (hasScope(scopes, 'source.sass') && !line.match(/^(\s|\t)/)) {
        return [];
      }
      prefix = this.getPropertyNamePrefix(bufferPosition, editor);
      if (!(activatedManually || prefix)) {
        return [];
      }
      completions = [];
      ref = this.properties;
      for (property in ref) {
        options = ref[property];
        if (!prefix || firstCharsEqual(property, prefix)) {
          completions.push(this.buildPropertyNameCompletion(property, prefix, options));
        }
      }
      return completions;
    },
    buildPropertyNameCompletion: function(propertyName, prefix, arg) {
      var description;
      description = arg.description;
      return {
        type: 'property',
        text: propertyName + ": ",
        displayText: propertyName,
        replacementPrefix: prefix,
        description: description,
        descriptionMoreURL: cssDocsURL + "/" + propertyName
      };
    },
    getPseudoSelectorPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = line.match(pesudoSelectorPrefixPattern)) != null ? ref[0] : void 0;
    },
    getPseudoSelectorCompletions: function(arg) {
      var bufferPosition, completions, editor, options, prefix, pseudoSelector, ref;
      bufferPosition = arg.bufferPosition, editor = arg.editor;
      prefix = this.getPseudoSelectorPrefix(editor, bufferPosition);
      if (!prefix) {
        return null;
      }
      completions = [];
      ref = this.pseudoSelectors;
      for (pseudoSelector in ref) {
        options = ref[pseudoSelector];
        if (firstCharsEqual(pseudoSelector, prefix)) {
          completions.push(this.buildPseudoSelectorCompletion(pseudoSelector, prefix, options));
        }
      }
      return completions;
    },
    buildPseudoSelectorCompletion: function(pseudoSelector, prefix, arg) {
      var argument, completion, description;
      argument = arg.argument, description = arg.description;
      completion = {
        type: 'pseudo-selector',
        replacementPrefix: prefix,
        description: description,
        descriptionMoreURL: cssDocsURL + "/" + pseudoSelector
      };
      if (argument != null) {
        completion.snippet = pseudoSelector + "(${1:" + argument + "})";
      } else {
        completion.text = pseudoSelector;
      }
      return completion;
    },
    getTagSelectorPrefix: function(editor, bufferPosition) {
      var line, ref;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (ref = tagSelectorPrefixPattern.exec(line)) != null ? ref[2] : void 0;
    },
    getTagCompletions: function(arg) {
      var bufferPosition, completions, editor, i, len, prefix, ref, tag;
      bufferPosition = arg.bufferPosition, editor = arg.editor, prefix = arg.prefix;
      completions = [];
      if (prefix) {
        ref = this.tags;
        for (i = 0, len = ref.length; i < len; i++) {
          tag = ref[i];
          if (firstCharsEqual(tag, prefix)) {
            completions.push(this.buildTagCompletion(tag));
          }
        }
      }
      return completions;
    },
    buildTagCompletion: function(tag) {
      return {
        type: 'tag',
        text: tag,
        description: "Selector for <" + tag + "> elements"
      };
    }
  };

  hasScope = function(scopesArray, scope) {
    return scopesArray.indexOf(scope) !== -1;
  };

  firstCharsEqual = function(str1, str2) {
    return str1[0].toLowerCase() === str2[0].toLowerCase();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtY3NzL2xpYi9wcm92aWRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsdUNBQUEsR0FBMEM7O0VBQzFDLGtDQUFBLEdBQXFDOztFQUNyQyw0QkFBQSxHQUErQjs7RUFDL0IseUJBQUEsR0FBNEI7O0VBQzVCLDJCQUFBLEdBQThCOztFQUM5Qix3QkFBQSxHQUEyQjs7RUFDM0Isc0JBQUEsR0FBeUI7O0VBQ3pCLFVBQUEsR0FBYTs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLDJCQUFWO0lBQ0Esa0JBQUEsRUFBb0Isd0ZBRHBCO0lBTUEsaUJBQUEsRUFBbUIsSUFObkI7SUFRQSxjQUFBLEVBQWdCLFNBQUMsT0FBRDtBQUNkLFVBQUE7TUFBQSxXQUFBLEdBQWM7TUFDZCxNQUFBLEdBQVMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxjQUF4QixDQUFBO01BQ1QsTUFBQSxHQUFTLFFBQUEsQ0FBUyxNQUFULEVBQWlCLGFBQWpCO01BRVQsSUFBRyxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsT0FBbkIsQ0FBSDtRQUNFLFdBQUEsR0FBYyxJQUFDLENBQUEsMkJBQUQsQ0FBNkIsT0FBN0IsRUFEaEI7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLDBCQUFELENBQTRCLE9BQTVCLENBQUg7UUFDSCxXQUFBLEdBQWMsSUFBQyxDQUFBLDRCQUFELENBQThCLE9BQTlCLEVBRFg7T0FBQSxNQUFBO1FBR0gsSUFBRyxNQUFBLElBQVcsSUFBQyxDQUFBLHFCQUFELENBQXVCLE9BQXZCLENBQWQ7VUFD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TUFBQSxJQUFBLEdBQU8sTUFBTSxDQUFDLGNBQVAsQ0FBc0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFoQixFQUFxQixDQUFyQixDQUFELEVBQTBCLGNBQTFCLENBQXRCO3NFQUM4QixDQUFBLENBQUE7SUFGakIsQ0FyUXRCO0lBeVFBLGlCQUFBLEVBQW1CLFNBQUMsR0FBRDtBQUNqQixVQUFBO01BRG1CLHFDQUFnQixxQkFBUTtNQUMzQyxXQUFBLEdBQWM7TUFDZCxJQUFHLE1BQUg7QUFDRTtBQUFBLGFBQUEscUNBQUE7O2NBQXNCLGVBQUEsQ0FBZ0IsR0FBaEIsRUFBcUIsTUFBckI7WUFDcEIsV0FBVyxDQUFDLElBQVosQ0FBaUIsSUFBQyxDQUFBLGtCQUFELENBQW9CLEdBQXBCLENBQWpCOztBQURGLFNBREY7O2FBR0E7SUFMaUIsQ0F6UW5CO0lBZ1JBLGtCQUFBLEVBQW9CLFNBQUMsR0FBRDthQUNsQjtRQUFBLElBQUEsRUFBTSxLQUFOO1FBQ0EsSUFBQSxFQUFNLEdBRE47UUFFQSxXQUFBLEVBQWEsZ0JBQUEsR0FBaUIsR0FBakIsR0FBcUIsWUFGbEM7O0lBRGtCLENBaFJwQjs7O0VBcVJGLFFBQUEsR0FBVyxTQUFDLFdBQUQsRUFBYyxLQUFkO1dBQ1QsV0FBVyxDQUFDLE9BQVosQ0FBb0IsS0FBcEIsQ0FBQSxLQUFnQyxDQUFDO0VBRHhCOztFQUdYLGVBQUEsR0FBa0IsU0FBQyxJQUFELEVBQU8sSUFBUDtXQUNoQixJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsV0FBUixDQUFBLENBQUEsS0FBeUIsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQVIsQ0FBQTtFQURUO0FBclNsQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxuZmlyc3RJbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gL3tcXHMqKFxcUyspXFxzKjovICMgLmV4YW1wbGUgeyBkaXNwbGF5OiB9XG5pbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gLyg/OjsuKz8pKjtcXHMqKFxcUyspXFxzKjovICMgLmV4YW1wbGUgeyBkaXNwbGF5OiBibG9jazsgZmxvYXQ6IGxlZnQ7IGNvbG9yOiB9IChtYXRjaCB0aGUgbGFzdCBvbmUpXG5wcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuID0gL15cXHMqKFxcUyspXFxzKjovICMgZGlzcGxheTpcbnByb3BlcnR5TmFtZVByZWZpeFBhdHRlcm4gPSAvW2EtekEtWl0rWy1hLXpBLVpdKiQvXG5wZXN1ZG9TZWxlY3RvclByZWZpeFBhdHRlcm4gPSAvOig6KT8oW2Etel0rW2Etei1dKik/JC9cbnRhZ1NlbGVjdG9yUHJlZml4UGF0dGVybiA9IC8oXnxcXHN8LCkoW2Etel0rKT8kL1xuaW1wb3J0YW50UHJlZml4UGF0dGVybiA9IC8oIVthLXpdKykkL1xuY3NzRG9jc1VSTCA9IFwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuICBzZWxlY3RvcjogJy5zb3VyY2UuY3NzLCAuc291cmNlLnNhc3MnXG4gIGRpc2FibGVGb3JTZWxlY3RvcjogJy5zb3VyY2UuY3NzIC5jb21tZW50LCAuc291cmNlLmNzcyAuc3RyaW5nLCAuc291cmNlLnNhc3MgLmNvbW1lbnQsIC5zb3VyY2Uuc2FzcyAuc3RyaW5nJ1xuXG4gICMgVGVsbCBhdXRvY29tcGxldGUgdG8gZnV6enkgZmlsdGVyIHRoZSByZXN1bHRzIG9mIGdldFN1Z2dlc3Rpb25zKCkuIFdlIGFyZVxuICAjIHN0aWxsIGZpbHRlcmluZyBieSB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBwcmVmaXggaW4gdGhpcyBwcm92aWRlciBmb3JcbiAgIyBlZmZpY2llbmN5LlxuICBmaWx0ZXJTdWdnZXN0aW9uczogdHJ1ZVxuXG4gIGdldFN1Z2dlc3Rpb25zOiAocmVxdWVzdCkgLT5cbiAgICBjb21wbGV0aW9ucyA9IG51bGxcbiAgICBzY29wZXMgPSByZXF1ZXN0LnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgaXNTYXNzID0gaGFzU2NvcGUoc2NvcGVzLCAnc291cmNlLnNhc3MnKVxuXG4gICAgaWYgQGlzQ29tcGxldGluZ1ZhbHVlKHJlcXVlc3QpXG4gICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbnMocmVxdWVzdClcbiAgICBlbHNlIGlmIEBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcihyZXF1ZXN0KVxuICAgICAgY29tcGxldGlvbnMgPSBAZ2V0UHNldWRvU2VsZWN0b3JDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgIGVsc2VcbiAgICAgIGlmIGlzU2FzcyBhbmQgQGlzQ29tcGxldGluZ05hbWVPclRhZyhyZXF1ZXN0KVxuICAgICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eU5hbWVDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgICAgICAgIC5jb25jYXQoQGdldFRhZ0NvbXBsZXRpb25zKHJlcXVlc3QpKVxuICAgICAgZWxzZSBpZiBub3QgaXNTYXNzIGFuZCBAaXNDb21wbGV0aW5nTmFtZShyZXF1ZXN0KVxuICAgICAgICBjb21wbGV0aW9ucyA9IEBnZXRQcm9wZXJ0eU5hbWVDb21wbGV0aW9ucyhyZXF1ZXN0KVxuXG4gICAgaWYgbm90IGlzU2FzcyBhbmQgQGlzQ29tcGxldGluZ1RhZ1NlbGVjdG9yKHJlcXVlc3QpXG4gICAgICB0YWdDb21wbGV0aW9ucyA9IEBnZXRUYWdDb21wbGV0aW9ucyhyZXF1ZXN0KVxuICAgICAgaWYgdGFnQ29tcGxldGlvbnM/Lmxlbmd0aFxuICAgICAgICBjb21wbGV0aW9ucyA/PSBbXVxuICAgICAgICBjb21wbGV0aW9ucyA9IGNvbXBsZXRpb25zLmNvbmNhdCh0YWdDb21wbGV0aW9ucylcblxuICAgIGNvbXBsZXRpb25zXG5cbiAgb25EaWRJbnNlcnRTdWdnZXN0aW9uOiAoe2VkaXRvciwgc3VnZ2VzdGlvbn0pIC0+XG4gICAgc2V0VGltZW91dChAdHJpZ2dlckF1dG9jb21wbGV0ZS5iaW5kKHRoaXMsIGVkaXRvciksIDEpIGlmIHN1Z2dlc3Rpb24udHlwZSBpcyAncHJvcGVydHknXG5cbiAgdHJpZ2dlckF1dG9jb21wbGV0ZTogKGVkaXRvcikgLT5cbiAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCAnYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGUnLCB7YWN0aXZhdGVkTWFudWFsbHk6IGZhbHNlfSlcblxuICBsb2FkUHJvcGVydGllczogLT5cbiAgICBAcHJvcGVydGllcyA9IHt9XG4gICAgZnMucmVhZEZpbGUgcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ2NvbXBsZXRpb25zLmpzb24nKSwgKGVycm9yLCBjb250ZW50KSA9PlxuICAgICAge0Bwc2V1ZG9TZWxlY3RvcnMsIEBwcm9wZXJ0aWVzLCBAdGFnc30gPSBKU09OLnBhcnNlKGNvbnRlbnQpIHVubGVzcyBlcnJvcj9cbiAgICAgIHJldHVyblxuXG4gIGlzQ29tcGxldGluZ1ZhbHVlOiAoe3Njb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb24sIHByZWZpeCwgZWRpdG9yfSkgLT5cbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgYmVmb3JlUHJlZml4QnVmZmVyUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBNYXRoLm1heCgwLCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmVmaXgubGVuZ3RoIC0gMSldXG4gICAgYmVmb3JlUHJlZml4U2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJlZm9yZVByZWZpeEJ1ZmZlclBvc2l0aW9uKVxuICAgIGJlZm9yZVByZWZpeFNjb3Blc0FycmF5ID0gYmVmb3JlUHJlZml4U2NvcGVzLmdldFNjb3Blc0FycmF5KClcblxuICAgIHByZXZpb3VzQnVmZmVyUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBNYXRoLm1heCgwLCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gLSAxKV1cbiAgICBwcmV2aW91c1Njb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihwcmV2aW91c0J1ZmZlclBvc2l0aW9uKVxuICAgIHByZXZpb3VzU2NvcGVzQXJyYXkgPSBwcmV2aW91c1Njb3Blcy5nZXRTY29wZXNBcnJheSgpXG5cbiAgICAoaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5wcm9wZXJ0eS1saXN0LmNzcycpIGFuZCBwcmVmaXgudHJpbSgpIGlzIFwiOlwiKSBvclxuICAgIChoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnbWV0YS5wcm9wZXJ0eS12YWx1ZS5jc3MnKSkgb3JcbiAgICAoaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5wcm9wZXJ0eS1saXN0LnNjc3MnKSBhbmQgcHJlZml4LnRyaW0oKSBpcyBcIjpcIikgb3JcbiAgICAoaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ21ldGEucHJvcGVydHktdmFsdWUuc2NzcycpKSBvclxuICAgIChoYXNTY29wZShzY29wZXMsICdzb3VyY2Uuc2FzcycpIGFuZCAoaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5wcm9wZXJ0eS12YWx1ZS5zYXNzJykgb3JcbiAgICAgIChub3QgaGFzU2NvcGUoYmVmb3JlUHJlZml4U2NvcGVzQXJyYXksIFwiZW50aXR5Lm5hbWUudGFnLmNzcy5zYXNzXCIpIGFuZCBwcmVmaXgudHJpbSgpIGlzIFwiOlwiKVxuICAgICkpXG5cbiAgaXNDb21wbGV0aW5nTmFtZTogKHtzY29wZURlc2NyaXB0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXgsIGVkaXRvcn0pIC0+XG4gICAgc2NvcGVzID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClcbiAgICBpc0F0VGVybWluYXRvciA9IHByZWZpeC5lbmRzV2l0aCgnOycpXG4gICAgaXNBdFBhcmVudFN5bWJvbCA9IHByZWZpeC5lbmRzV2l0aCgnJicpXG4gICAgaXNJblByb3BlcnR5TGlzdCA9IG5vdCBpc0F0VGVybWluYXRvciBhbmRcbiAgICAgIChoYXNTY29wZShzY29wZXMsICdtZXRhLnByb3BlcnR5LWxpc3QuY3NzJykgb3JcbiAgICAgIGhhc1Njb3BlKHNjb3BlcywgJ21ldGEucHJvcGVydHktbGlzdC5zY3NzJykpXG5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGlzSW5Qcm9wZXJ0eUxpc3RcbiAgICByZXR1cm4gZmFsc2UgaWYgaXNBdFBhcmVudFN5bWJvbFxuXG4gICAgcHJldmlvdXNCdWZmZXJQb3NpdGlvbiA9IFtidWZmZXJQb3NpdGlvbi5yb3csIE1hdGgubWF4KDAsIGJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIHByZWZpeC5sZW5ndGggLSAxKV1cbiAgICBwcmV2aW91c1Njb3BlcyA9IGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihwcmV2aW91c0J1ZmZlclBvc2l0aW9uKVxuICAgIHByZXZpb3VzU2NvcGVzQXJyYXkgPSBwcmV2aW91c1Njb3Blcy5nZXRTY29wZXNBcnJheSgpXG5cbiAgICByZXR1cm4gZmFsc2UgaWYgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ2VudGl0eS5vdGhlci5hdHRyaWJ1dGUtbmFtZS5jbGFzcy5jc3MnKSBvclxuICAgICAgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ2VudGl0eS5vdGhlci5hdHRyaWJ1dGUtbmFtZS5pZC5jc3MnKSBvclxuICAgICAgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ2VudGl0eS5vdGhlci5hdHRyaWJ1dGUtbmFtZS5pZCcpIG9yXG4gICAgICBoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnZW50aXR5Lm90aGVyLmF0dHJpYnV0ZS1uYW1lLnBhcmVudC1zZWxlY3Rvci5jc3MnKSBvclxuICAgICAgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ2VudGl0eS5uYW1lLnRhZy5yZWZlcmVuY2Uuc2NzcycpIG9yXG4gICAgICBoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnZW50aXR5Lm5hbWUudGFnLnNjc3MnKVxuXG4gICAgaXNBdEJlZ2luU2NvcGVQdW5jdHVhdGlvbiA9IGhhc1Njb3BlKHNjb3BlcywgJ3B1bmN0dWF0aW9uLnNlY3Rpb24ucHJvcGVydHktbGlzdC5iZWdpbi5jc3MnKSBvclxuICAgICAgaGFzU2NvcGUoc2NvcGVzLCAncHVuY3R1YXRpb24uc2VjdGlvbi5wcm9wZXJ0eS1saXN0LmJlZ2luLmJyYWNrZXQuY3VybHkuc2NzcycpXG4gICAgaXNBdEVuZFNjb3BlUHVuY3R1YXRpb24gPSBoYXNTY29wZShzY29wZXMsICdwdW5jdHVhdGlvbi5zZWN0aW9uLnByb3BlcnR5LWxpc3QuZW5kLmNzcycpIG9yXG4gICAgICBoYXNTY29wZShzY29wZXMsICdwdW5jdHVhdGlvbi5zZWN0aW9uLnByb3BlcnR5LWxpc3QuZW5kLmJyYWNrZXQuY3VybHkuc2NzcycpXG5cbiAgICBpZiBpc0F0QmVnaW5TY29wZVB1bmN0dWF0aW9uXG4gICAgICAjICogRGlzYWxsb3cgaGVyZTogYGNhbnZhcyx8e31gXG4gICAgICAjICogQWxsb3cgaGVyZTogYGNhbnZhcyx7fCB9YFxuICAgICAgcHJlZml4LmVuZHNXaXRoKCd7JylcbiAgICBlbHNlIGlmIGlzQXRFbmRTY29wZVB1bmN0dWF0aW9uXG4gICAgICAjICogRGlzYWxsb3cgaGVyZTogYGNhbnZhcyx7fXxgXG4gICAgICAjICogQWxsb3cgaGVyZTogYGNhbnZhcyx7IHx9YFxuICAgICAgbm90IHByZWZpeC5lbmRzV2l0aCgnfScpXG4gICAgZWxzZVxuICAgICAgdHJ1ZVxuXG4gIGlzQ29tcGxldGluZ05hbWVPclRhZzogKHtzY29wZURlc2NyaXB0b3IsIGJ1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgcHJlZml4ID0gQGdldFByb3BlcnR5TmFtZVByZWZpeChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHJldHVybiBAaXNQcm9wZXJ0eU5hbWVQcmVmaXgocHJlZml4KSBhbmRcbiAgICAgIGhhc1Njb3BlKHNjb3BlcywgJ21ldGEuc2VsZWN0b3IuY3NzJykgYW5kXG4gICAgICBub3QgaGFzU2NvcGUoc2NvcGVzLCAnZW50aXR5Lm90aGVyLmF0dHJpYnV0ZS1uYW1lLmlkLmNzcy5zYXNzJykgYW5kXG4gICAgICBub3QgaGFzU2NvcGUoc2NvcGVzLCAnZW50aXR5Lm90aGVyLmF0dHJpYnV0ZS1uYW1lLmNsYXNzLnNhc3MnKVxuXG4gIGlzQ29tcGxldGluZ1RhZ1NlbGVjdG9yOiAoe2VkaXRvciwgc2NvcGVEZXNjcmlwdG9yLCBidWZmZXJQb3NpdGlvbn0pIC0+XG4gICAgc2NvcGVzID0gc2NvcGVEZXNjcmlwdG9yLmdldFNjb3Blc0FycmF5KClcbiAgICB0YWdTZWxlY3RvclByZWZpeCA9IEBnZXRUYWdTZWxlY3RvclByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdGFnU2VsZWN0b3JQcmVmaXg/Lmxlbmd0aFxuXG4gICAgcHJldmlvdXNCdWZmZXJQb3NpdGlvbiA9IFtidWZmZXJQb3NpdGlvbi5yb3csIE1hdGgubWF4KDAsIGJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIDEpXVxuICAgIHByZXZpb3VzU2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHByZXZpb3VzQnVmZmVyUG9zaXRpb24pXG4gICAgcHJldmlvdXNTY29wZXNBcnJheSA9IHByZXZpb3VzU2NvcGVzLmdldFNjb3Blc0FycmF5KClcblxuICAgIGlmIGhhc1Njb3BlKHNjb3BlcywgJ21ldGEuc2VsZWN0b3IuY3NzJylcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5jc3Muc2NzcycpIG9yIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5jc3MubGVzcycpXG4gICAgICBub3QgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ21ldGEucHJvcGVydHktdmFsdWUuc2NzcycpIGFuZFxuICAgICAgICBub3QgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ21ldGEucHJvcGVydHktdmFsdWUuY3NzJykgYW5kXG4gICAgICAgIG5vdCBoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnc3VwcG9ydC50eXBlLnByb3BlcnR5LXZhbHVlLmNzcycpXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBpc0NvbXBsZXRpbmdQc2V1ZG9TZWxlY3RvcjogKHtlZGl0b3IsIHNjb3BlRGVzY3JpcHRvciwgYnVmZmVyUG9zaXRpb259KSAtPlxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG4gICAgaWYgaGFzU2NvcGUoc2NvcGVzLCAnbWV0YS5zZWxlY3Rvci5jc3MnKSBhbmQgbm90IGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5zYXNzJylcbiAgICAgIHRydWVcbiAgICBlbHNlIGlmIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5jc3Muc2NzcycpIG9yIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5jc3MubGVzcycpIG9yIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5zYXNzJylcbiAgICAgIHByZWZpeCA9IEBnZXRQc2V1ZG9TZWxlY3RvclByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgaWYgcHJlZml4XG4gICAgICAgIHByZXZpb3VzQnVmZmVyUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBNYXRoLm1heCgwLCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmVmaXgubGVuZ3RoIC0gMSldXG4gICAgICAgIHByZXZpb3VzU2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHByZXZpb3VzQnVmZmVyUG9zaXRpb24pXG4gICAgICAgIHByZXZpb3VzU2NvcGVzQXJyYXkgPSBwcmV2aW91c1Njb3Blcy5nZXRTY29wZXNBcnJheSgpXG4gICAgICAgIG5vdCBoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnbWV0YS5wcm9wZXJ0eS1uYW1lLnNjc3MnKSBhbmRcbiAgICAgICAgICBub3QgaGFzU2NvcGUocHJldmlvdXNTY29wZXNBcnJheSwgJ21ldGEucHJvcGVydHktdmFsdWUuc2NzcycpIGFuZFxuICAgICAgICAgIG5vdCBoYXNTY29wZShwcmV2aW91c1Njb3Blc0FycmF5LCAnc3VwcG9ydC50eXBlLnByb3BlcnR5LW5hbWUuY3NzJykgYW5kXG4gICAgICAgICAgbm90IGhhc1Njb3BlKHByZXZpb3VzU2NvcGVzQXJyYXksICdzdXBwb3J0LnR5cGUucHJvcGVydHktdmFsdWUuY3NzJylcbiAgICAgIGVsc2VcbiAgICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGlzUHJvcGVydHlWYWx1ZVByZWZpeDogKHByZWZpeCkgLT5cbiAgICBwcmVmaXggPSBwcmVmaXgudHJpbSgpXG4gICAgcHJlZml4Lmxlbmd0aCA+IDAgYW5kIHByZWZpeCBpc250ICc6J1xuXG4gIGlzUHJvcGVydHlOYW1lUHJlZml4OiAocHJlZml4KSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJlZml4P1xuICAgIHByZWZpeCA9IHByZWZpeC50cmltKClcbiAgICBwcmVmaXgubGVuZ3RoID4gMCBhbmQgcHJlZml4Lm1hdGNoKC9eW2EtekEtWi1dKyQvKVxuXG4gIGdldEltcG9ydGFudFByZWZpeDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBpbXBvcnRhbnRQcmVmaXhQYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG5cbiAgZ2V0UHJldmlvdXNQcm9wZXJ0eU5hbWU6IChidWZmZXJQb3NpdGlvbiwgZWRpdG9yKSAtPlxuICAgIHtyb3d9ID0gYnVmZmVyUG9zaXRpb25cbiAgICB3aGlsZSByb3cgPj0gMFxuICAgICAgbGluZSA9IGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gICAgICBwcm9wZXJ0eU5hbWUgPSBpbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG4gICAgICBwcm9wZXJ0eU5hbWUgPz0gZmlyc3RJbmxpbmVQcm9wZXJ0eU5hbWVXaXRoQ29sb25QYXR0ZXJuLmV4ZWMobGluZSk/WzFdXG4gICAgICBwcm9wZXJ0eU5hbWUgPz0gcHJvcGVydHlOYW1lV2l0aENvbG9uUGF0dGVybi5leGVjKGxpbmUpP1sxXVxuICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZSBpZiBwcm9wZXJ0eU5hbWVcbiAgICAgIHJvdy0tXG4gICAgcmV0dXJuXG5cbiAgZ2V0UHJvcGVydHlWYWx1ZUNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3IsIHByZWZpeCwgc2NvcGVEZXNjcmlwdG9yfSkgLT5cbiAgICBwcm9wZXJ0eSA9IEBnZXRQcmV2aW91c1Byb3BlcnR5TmFtZShidWZmZXJQb3NpdGlvbiwgZWRpdG9yKVxuICAgIHZhbHVlcyA9IEBwcm9wZXJ0aWVzW3Byb3BlcnR5XT8udmFsdWVzXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIHZhbHVlcz9cblxuICAgIHNjb3BlcyA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZXNBcnJheSgpXG5cbiAgICBjb21wbGV0aW9ucyA9IFtdXG4gICAgaWYgQGlzUHJvcGVydHlWYWx1ZVByZWZpeChwcmVmaXgpXG4gICAgICBmb3IgdmFsdWUgaW4gdmFsdWVzIHdoZW4gZmlyc3RDaGFyc0VxdWFsKHZhbHVlLCBwcmVmaXgpXG4gICAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkUHJvcGVydHlWYWx1ZUNvbXBsZXRpb24odmFsdWUsIHByb3BlcnR5LCBzY29wZXMpKVxuICAgIGVsc2VcbiAgICAgIGZvciB2YWx1ZSBpbiB2YWx1ZXNcbiAgICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbih2YWx1ZSwgcHJvcGVydHksIHNjb3BlcykpXG5cbiAgICBpZiBpbXBvcnRhbnRQcmVmaXggPSBAZ2V0SW1wb3J0YW50UHJlZml4KGVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG4gICAgICAjIGF0dGVudGlvbjogcsOoZ2xlIGRhbmdlcmV1eFxuICAgICAgY29tcGxldGlvbnMucHVzaFxuICAgICAgICB0eXBlOiAna2V5d29yZCdcbiAgICAgICAgdGV4dDogJyFpbXBvcnRhbnQnXG4gICAgICAgIGRpc3BsYXlUZXh0OiAnIWltcG9ydGFudCdcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IGltcG9ydGFudFByZWZpeFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJGb3JjZXMgdGhpcyBwcm9wZXJ0eSB0byBvdmVycmlkZSBhbnkgb3RoZXIgZGVjbGFyYXRpb24gb2YgdGhlIHNhbWUgcHJvcGVydHkuIFVzZSB3aXRoIGNhdXRpb24uXCJcbiAgICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vU3BlY2lmaWNpdHkjVGhlXyFpbXBvcnRhbnRfZXhjZXB0aW9uXCJcblxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRQcm9wZXJ0eVZhbHVlQ29tcGxldGlvbjogKHZhbHVlLCBwcm9wZXJ0eU5hbWUsIHNjb3BlcykgLT5cbiAgICB0ZXh0ID0gdmFsdWVcbiAgICB0ZXh0ICs9ICc7JyB1bmxlc3MgaGFzU2NvcGUoc2NvcGVzLCAnc291cmNlLnNhc3MnKVxuXG4gICAge1xuICAgICAgdHlwZTogJ3ZhbHVlJ1xuICAgICAgdGV4dDogdGV4dFxuICAgICAgZGlzcGxheVRleHQ6IHZhbHVlXG4gICAgICBkZXNjcmlwdGlvbjogXCIje3ZhbHVlfSB2YWx1ZSBmb3IgdGhlICN7cHJvcGVydHlOYW1lfSBwcm9wZXJ0eVwiXG4gICAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFwiI3tjc3NEb2NzVVJMfS8je3Byb3BlcnR5TmFtZX0jVmFsdWVzXCJcbiAgICB9XG5cbiAgZ2V0UHJvcGVydHlOYW1lUHJlZml4OiAoYnVmZmVyUG9zaXRpb24sIGVkaXRvcikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIHByb3BlcnR5TmFtZVByZWZpeFBhdHRlcm4uZXhlYyhsaW5lKT9bMF1cblxuICBnZXRQcm9wZXJ0eU5hbWVDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBzY29wZURlc2NyaXB0b3IsIGFjdGl2YXRlZE1hbnVhbGx5fSkgLT5cbiAgICAjIERvbid0IGF1dG9jb21wbGV0ZSBwcm9wZXJ0eSBuYW1lcyBpbiBTQVNTIG9uIHJvb3QgbGV2ZWxcbiAgICBzY29wZXMgPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIGxpbmUgPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgcmV0dXJuIFtdIGlmIGhhc1Njb3BlKHNjb3BlcywgJ3NvdXJjZS5zYXNzJykgYW5kIG5vdCBsaW5lLm1hdGNoKC9eKFxcc3xcXHQpLylcblxuICAgIHByZWZpeCA9IEBnZXRQcm9wZXJ0eU5hbWVQcmVmaXgoYnVmZmVyUG9zaXRpb24sIGVkaXRvcilcbiAgICByZXR1cm4gW10gdW5sZXNzIGFjdGl2YXRlZE1hbnVhbGx5IG9yIHByZWZpeFxuXG4gICAgY29tcGxldGlvbnMgPSBbXVxuICAgIGZvciBwcm9wZXJ0eSwgb3B0aW9ucyBvZiBAcHJvcGVydGllcyB3aGVuIG5vdCBwcmVmaXggb3IgZmlyc3RDaGFyc0VxdWFsKHByb3BlcnR5LCBwcmVmaXgpXG4gICAgICBjb21wbGV0aW9ucy5wdXNoKEBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb24ocHJvcGVydHksIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFByb3BlcnR5TmFtZUNvbXBsZXRpb246IChwcm9wZXJ0eU5hbWUsIHByZWZpeCwge2Rlc2NyaXB0aW9ufSkgLT5cbiAgICB0eXBlOiAncHJvcGVydHknXG4gICAgdGV4dDogXCIje3Byb3BlcnR5TmFtZX06IFwiXG4gICAgZGlzcGxheVRleHQ6IHByb3BlcnR5TmFtZVxuICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICBkZXNjcmlwdGlvbk1vcmVVUkw6IFwiI3tjc3NEb2NzVVJMfS8je3Byb3BlcnR5TmFtZX1cIlxuXG4gIGdldFBzZXVkb1NlbGVjdG9yUHJlZml4OiAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikgLT5cbiAgICBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIGxpbmUubWF0Y2gocGVzdWRvU2VsZWN0b3JQcmVmaXhQYXR0ZXJuKT9bMF1cblxuICBnZXRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb25zOiAoe2J1ZmZlclBvc2l0aW9uLCBlZGl0b3J9KSAtPlxuICAgIHByZWZpeCA9IEBnZXRQc2V1ZG9TZWxlY3RvclByZWZpeChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuICAgIHJldHVybiBudWxsIHVubGVzcyBwcmVmaXhcblxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBmb3IgcHNldWRvU2VsZWN0b3IsIG9wdGlvbnMgb2YgQHBzZXVkb1NlbGVjdG9ycyB3aGVuIGZpcnN0Q2hhcnNFcXVhbChwc2V1ZG9TZWxlY3RvciwgcHJlZml4KVxuICAgICAgY29tcGxldGlvbnMucHVzaChAYnVpbGRQc2V1ZG9TZWxlY3RvckNvbXBsZXRpb24ocHNldWRvU2VsZWN0b3IsIHByZWZpeCwgb3B0aW9ucykpXG4gICAgY29tcGxldGlvbnNcblxuICBidWlsZFBzZXVkb1NlbGVjdG9yQ29tcGxldGlvbjogKHBzZXVkb1NlbGVjdG9yLCBwcmVmaXgsIHthcmd1bWVudCwgZGVzY3JpcHRpb259KSAtPlxuICAgIGNvbXBsZXRpb24gPVxuICAgICAgdHlwZTogJ3BzZXVkby1zZWxlY3RvcidcbiAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBwcmVmaXhcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgICAgZGVzY3JpcHRpb25Nb3JlVVJMOiBcIiN7Y3NzRG9jc1VSTH0vI3twc2V1ZG9TZWxlY3Rvcn1cIlxuXG4gICAgaWYgYXJndW1lbnQ/XG4gICAgICBjb21wbGV0aW9uLnNuaXBwZXQgPSBcIiN7cHNldWRvU2VsZWN0b3J9KCR7MToje2FyZ3VtZW50fX0pXCJcbiAgICBlbHNlXG4gICAgICBjb21wbGV0aW9uLnRleHQgPSBwc2V1ZG9TZWxlY3RvclxuICAgIGNvbXBsZXRpb25cblxuICBnZXRUYWdTZWxlY3RvclByZWZpeDogKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIC0+XG4gICAgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICB0YWdTZWxlY3RvclByZWZpeFBhdHRlcm4uZXhlYyhsaW5lKT9bMl1cblxuICBnZXRUYWdDb21wbGV0aW9uczogKHtidWZmZXJQb3NpdGlvbiwgZWRpdG9yLCBwcmVmaXh9KSAtPlxuICAgIGNvbXBsZXRpb25zID0gW11cbiAgICBpZiBwcmVmaXhcbiAgICAgIGZvciB0YWcgaW4gQHRhZ3Mgd2hlbiBmaXJzdENoYXJzRXF1YWwodGFnLCBwcmVmaXgpXG4gICAgICAgIGNvbXBsZXRpb25zLnB1c2goQGJ1aWxkVGFnQ29tcGxldGlvbih0YWcpKVxuICAgIGNvbXBsZXRpb25zXG5cbiAgYnVpbGRUYWdDb21wbGV0aW9uOiAodGFnKSAtPlxuICAgIHR5cGU6ICd0YWcnXG4gICAgdGV4dDogdGFnXG4gICAgZGVzY3JpcHRpb246IFwiU2VsZWN0b3IgZm9yIDwje3RhZ30+IGVsZW1lbnRzXCJcblxuaGFzU2NvcGUgPSAoc2NvcGVzQXJyYXksIHNjb3BlKSAtPlxuICBzY29wZXNBcnJheS5pbmRleE9mKHNjb3BlKSBpc250IC0xXG5cbmZpcnN0Q2hhcnNFcXVhbCA9IChzdHIxLCBzdHIyKSAtPlxuICBzdHIxWzBdLnRvTG93ZXJDYXNlKCkgaXMgc3RyMlswXS50b0xvd2VyQ2FzZSgpXG4iXX0=
