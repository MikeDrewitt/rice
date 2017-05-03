(function() {
  var AtomReact, CompositeDisposable, Disposable, autoCompleteTagCloseRegex, autoCompleteTagStartRegex, contentCheckRegex, decreaseIndentForNextLinePattern, defaultDetectReactFilePattern, jsxComplexAttributePattern, jsxTagStartPattern, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  contentCheckRegex = null;

  defaultDetectReactFilePattern = '/((require\\([\'"]react(?:(-native|\\/addons))?[\'"]\\)))|(import\\s+[\\w{},\\s]+\\s+from\\s+[\'"]react(?:(-native|\\/addons))?[\'"])/';

  autoCompleteTagStartRegex = /(<)([a-zA-Z0-9\.:$_]+)/g;

  autoCompleteTagCloseRegex = /(<\/)([^>]+)(>)/g;

  jsxTagStartPattern = '(?x)((^|=|return)\\s*<([^!/?](?!.+?(</.+?>))))';

  jsxComplexAttributePattern = '(?x)\\{ [^}"\']* $|\\( [^)"\']* $';

  decreaseIndentForNextLinePattern = '(?x) />\\s*(,|;)?\\s*$ | ^(?!\\s*\\?)\\s*\\S+.*</[-_\\.A-Za-z0-9]+>$';

  AtomReact = (function() {
    AtomReact.prototype.config = {
      enabledForAllJavascriptFiles: {
        type: 'boolean',
        "default": false,
        description: 'Enable grammar, snippets and other features automatically for all .js files.'
      },
      disableAutoClose: {
        type: 'boolean',
        "default": false,
        description: 'Disabled tag autocompletion'
      },
      detectReactFilePattern: {
        type: 'string',
        "default": defaultDetectReactFilePattern
      },
      jsxTagStartPattern: {
        type: 'string',
        "default": jsxTagStartPattern
      },
      jsxComplexAttributePattern: {
        type: 'string',
        "default": jsxComplexAttributePattern
      },
      decreaseIndentForNextLinePattern: {
        type: 'string',
        "default": decreaseIndentForNextLinePattern
      }
    };

    function AtomReact() {}

    AtomReact.prototype.patchEditorLangModeAutoDecreaseIndentForBufferRow = function(editor) {
      var fn, self;
      self = this;
      fn = editor.languageMode.autoDecreaseIndentForBufferRow;
      if (fn.jsxPatch) {
        return;
      }
      return editor.languageMode.autoDecreaseIndentForBufferRow = function(bufferRow, options) {
        var currentIndentLevel, decreaseIndentRegex, decreaseNextLineIndentRegex, desiredIndentLevel, increaseIndentRegex, line, precedingLine, precedingRow, scopeDescriptor;
        if (editor.getGrammar().scopeName !== "source.js.jsx") {
          return fn.call(editor.languageMode, bufferRow, options);
        }
        scopeDescriptor = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]);
        decreaseNextLineIndentRegex = this.cacheRegex(atom.config.get('react.decreaseIndentForNextLinePattern') || decreaseIndentForNextLinePattern);
        decreaseIndentRegex = this.decreaseIndentRegexForScopeDescriptor(scopeDescriptor);
        increaseIndentRegex = this.increaseIndentRegexForScopeDescriptor(scopeDescriptor);
        precedingRow = this.buffer.previousNonBlankRow(bufferRow);
        if (precedingRow < 0) {
          return;
        }
        precedingLine = this.buffer.lineForRow(precedingRow);
        line = this.buffer.lineForRow(bufferRow);
        if (precedingLine && decreaseNextLineIndentRegex.testSync(precedingLine) && !(increaseIndentRegex && increaseIndentRegex.testSync(precedingLine)) && !this.editor.isBufferRowCommented(precedingRow)) {
          currentIndentLevel = this.editor.indentationForBufferRow(precedingRow);
          if (decreaseIndentRegex && decreaseIndentRegex.testSync(line)) {
            currentIndentLevel -= 1;
          }
          desiredIndentLevel = currentIndentLevel - 1;
          if (desiredIndentLevel >= 0 && desiredIndentLevel < currentIndentLevel) {
            return this.editor.setIndentationForBufferRow(bufferRow, desiredIndentLevel);
          }
        } else if (!this.editor.isBufferRowCommented(bufferRow)) {
          return fn.call(editor.languageMode, bufferRow, options);
        }
      };
    };

    AtomReact.prototype.patchEditorLangModeSuggestedIndentForBufferRow = function(editor) {
      var fn, self;
      self = this;
      fn = editor.languageMode.suggestedIndentForBufferRow;
      if (fn.jsxPatch) {
        return;
      }
      return editor.languageMode.suggestedIndentForBufferRow = function(bufferRow, options) {
        var complexAttributeRegex, decreaseIndentRegex, decreaseIndentTest, decreaseNextLineIndentRegex, increaseIndentRegex, indent, precedingLine, precedingRow, scopeDescriptor, tagStartRegex, tagStartTest;
        indent = fn.call(editor.languageMode, bufferRow, options);
        if (!(editor.getGrammar().scopeName === "source.js.jsx" && bufferRow > 1)) {
          return indent;
        }
        scopeDescriptor = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]);
        decreaseNextLineIndentRegex = this.cacheRegex(atom.config.get('react.decreaseIndentForNextLinePattern') || decreaseIndentForNextLinePattern);
        increaseIndentRegex = this.increaseIndentRegexForScopeDescriptor(scopeDescriptor);
        decreaseIndentRegex = this.decreaseIndentRegexForScopeDescriptor(scopeDescriptor);
        tagStartRegex = this.cacheRegex(atom.config.get('react.jsxTagStartPattern') || jsxTagStartPattern);
        complexAttributeRegex = this.cacheRegex(atom.config.get('react.jsxComplexAttributePattern') || jsxComplexAttributePattern);
        precedingRow = this.buffer.previousNonBlankRow(bufferRow);
        if (precedingRow < 0) {
          return indent;
        }
        precedingLine = this.buffer.lineForRow(precedingRow);
        if (precedingLine == null) {
          return indent;
        }
        if (this.editor.isBufferRowCommented(bufferRow) && this.editor.isBufferRowCommented(precedingRow)) {
          return this.editor.indentationForBufferRow(precedingRow);
        }
        tagStartTest = tagStartRegex.testSync(precedingLine);
        decreaseIndentTest = decreaseIndentRegex.testSync(precedingLine);
        if (tagStartTest && complexAttributeRegex.testSync(precedingLine) && !this.editor.isBufferRowCommented(precedingRow)) {
          indent += 1;
        }
        if (precedingLine && !decreaseIndentTest && decreaseNextLineIndentRegex.testSync(precedingLine) && !this.editor.isBufferRowCommented(precedingRow)) {
          indent -= 1;
        }
        return Math.max(indent, 0);
      };
    };

    AtomReact.prototype.patchEditorLangMode = function(editor) {
      var ref1, ref2;
      if ((ref1 = this.patchEditorLangModeSuggestedIndentForBufferRow(editor)) != null) {
        ref1.jsxPatch = true;
      }
      return (ref2 = this.patchEditorLangModeAutoDecreaseIndentForBufferRow(editor)) != null ? ref2.jsxPatch = true : void 0;
    };

    AtomReact.prototype.isReact = function(text) {
      var match;
      if (atom.config.get('react.enabledForAllJavascriptFiles')) {
        return true;
      }
      if (contentCheckRegex == null) {
        match = (atom.config.get('react.detectReactFilePattern') || defaultDetectReactFilePattern).match(new RegExp('^/(.*?)/([gimy]*)$'));
        contentCheckRegex = new RegExp(match[1], match[2]);
      }
      return text.match(contentCheckRegex) != null;
    };

    AtomReact.prototype.isReactEnabledForEditor = function(editor) {
      var ref1;
      return (editor != null) && ((ref1 = editor.getGrammar().scopeName) === "source.js.jsx" || ref1 === "source.coffee.jsx");
    };

    AtomReact.prototype.autoSetGrammar = function(editor) {
      var extName, jsxGrammar, path;
      if (this.isReactEnabledForEditor(editor)) {
        return;
      }
      path = require('path');
      extName = path.extname(editor.getPath() || '');
      if (extName === ".jsx" || ((extName === ".js" || extName === ".es6") && this.isReact(editor.getText()))) {
        jsxGrammar = atom.grammars.grammarsByScopeName["source.js.jsx"];
        if (jsxGrammar) {
          return editor.setGrammar(jsxGrammar);
        }
      }
    };

    AtomReact.prototype.onHTMLToJSX = function() {
      var HTMLtoJSX, converter, editor, jsxformat, selections;
      jsxformat = require('jsxformat');
      HTMLtoJSX = require('./htmltojsx');
      converter = new HTMLtoJSX({
        createClass: false
      });
      editor = atom.workspace.getActiveTextEditor();
      if (!this.isReactEnabledForEditor(editor)) {
        return;
      }
      selections = editor.getSelections();
      return editor.transact((function(_this) {
        return function() {
          var i, jsxOutput, len, range, results, selection, selectionText;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            selection = selections[i];
            try {
              selectionText = selection.getText();
              jsxOutput = converter.convert(selectionText);
              try {
                jsxformat.setOptions({});
                jsxOutput = jsxformat.format(jsxOutput);
              } catch (error) {}
              selection.insertText(jsxOutput);
              range = selection.getBufferRange();
              results.push(editor.autoIndentBufferRows(range.start.row, range.end.row));
            } catch (error) {}
          }
          return results;
        };
      })(this));
    };

    AtomReact.prototype.onReformat = function() {
      var _, editor, jsxformat, selections;
      jsxformat = require('jsxformat');
      _ = require('lodash');
      editor = atom.workspace.getActiveTextEditor();
      if (!this.isReactEnabledForEditor(editor)) {
        return;
      }
      selections = editor.getSelections();
      return editor.transact((function(_this) {
        return function() {
          var bufEnd, bufStart, err, firstChangedLine, i, lastChangedLine, len, newLineCount, original, originalLineCount, range, result, results, selection, serializedRange;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            selection = selections[i];
            try {
              range = selection.getBufferRange();
              serializedRange = range.serialize();
              bufStart = serializedRange[0];
              bufEnd = serializedRange[1];
              jsxformat.setOptions({});
              result = jsxformat.format(selection.getText());
              originalLineCount = editor.getLineCount();
              selection.insertText(result);
              newLineCount = editor.getLineCount();
              editor.autoIndentBufferRows(bufStart[0], bufEnd[0] + (newLineCount - originalLineCount));
              results.push(editor.setCursorBufferPosition(bufStart));
            } catch (error) {
              err = error;
              range = selection.getBufferRange().serialize();
              range[0][0]++;
              range[1][0]++;
              jsxformat.setOptions({
                range: range
              });
              original = editor.getText();
              try {
                result = jsxformat.format(original);
                selection.clear();
                originalLineCount = editor.getLineCount();
                editor.setText(result);
                newLineCount = editor.getLineCount();
                firstChangedLine = range[0][0] - 1;
                lastChangedLine = range[1][0] - 1 + (newLineCount - originalLineCount);
                editor.autoIndentBufferRows(firstChangedLine, lastChangedLine);
                results.push(editor.setCursorBufferPosition([firstChangedLine, range[0][1]]));
              } catch (error) {}
            }
          }
          return results;
        };
      })(this));
    };

    AtomReact.prototype.autoCloseTag = function(eventObj, editor) {
      var fullLine, lastLine, lastLineSpaces, line, lines, match, ref1, ref2, rest, row, serializedEndPoint, tagName, token, tokenizedLine;
      if (atom.config.get('react.disableAutoClose')) {
        return;
      }
      if (!this.isReactEnabledForEditor(editor) || editor !== atom.workspace.getActiveTextEditor()) {
        return;
      }
      if ((eventObj != null ? eventObj.newText : void 0) === '>' && !eventObj.oldText) {
        if (editor.getCursorBufferPositions().length > 1) {
          return;
        }
        tokenizedLine = (ref1 = editor.tokenizedBuffer) != null ? ref1.tokenizedLineForRow(eventObj.newRange.end.row) : void 0;
        if (tokenizedLine == null) {
          return;
        }
        token = tokenizedLine.tokenAtBufferColumn(eventObj.newRange.end.column - 1);
        if ((token == null) || token.scopes.indexOf('tag.open.js') === -1 || token.scopes.indexOf('punctuation.definition.tag.end.js') === -1) {
          return;
        }
        lines = editor.buffer.getLines();
        row = eventObj.newRange.end.row;
        line = lines[row];
        line = line.substr(0, eventObj.newRange.end.column);
        if (line.substr(line.length - 2, 1) === '/') {
          return;
        }
        tagName = null;
        while ((line != null) && (tagName == null)) {
          match = line.match(autoCompleteTagStartRegex);
          if ((match != null) && match.length > 0) {
            tagName = match.pop().substr(1);
          }
          row--;
          line = lines[row];
        }
        if (tagName != null) {
          editor.insertText('</' + tagName + '>', {
            undo: 'skip'
          });
          return editor.setCursorBufferPosition(eventObj.newRange.end);
        }
      } else if ((eventObj != null ? eventObj.oldText : void 0) === '>' && (eventObj != null ? eventObj.newText : void 0) === '') {
        lines = editor.buffer.getLines();
        row = eventObj.newRange.end.row;
        fullLine = lines[row];
        tokenizedLine = (ref2 = editor.tokenizedBuffer) != null ? ref2.tokenizedLineForRow(eventObj.newRange.end.row) : void 0;
        if (tokenizedLine == null) {
          return;
        }
        token = tokenizedLine.tokenAtBufferColumn(eventObj.newRange.end.column - 1);
        if ((token == null) || token.scopes.indexOf('tag.open.js') === -1) {
          return;
        }
        line = fullLine.substr(0, eventObj.newRange.end.column);
        if (line.substr(line.length - 1, 1) === '/') {
          return;
        }
        tagName = null;
        while ((line != null) && (tagName == null)) {
          match = line.match(autoCompleteTagStartRegex);
          if ((match != null) && match.length > 0) {
            tagName = match.pop().substr(1);
          }
          row--;
          line = lines[row];
        }
        if (tagName != null) {
          rest = fullLine.substr(eventObj.newRange.end.column);
          if (rest.indexOf('</' + tagName + '>') === 0) {
            serializedEndPoint = [eventObj.newRange.end.row, eventObj.newRange.end.column];
            return editor.setTextInBufferRange([serializedEndPoint, [serializedEndPoint[0], serializedEndPoint[1] + tagName.length + 3]], '', {
              undo: 'skip'
            });
          }
        }
      } else if ((eventObj != null ? eventObj.newText : void 0) === '\n') {
        lines = editor.buffer.getLines();
        row = eventObj.newRange.end.row;
        lastLine = lines[row - 1];
        fullLine = lines[row];
        if (/>$/.test(lastLine) && fullLine.search(autoCompleteTagCloseRegex) === 0) {
          while (lastLine != null) {
            match = lastLine.match(autoCompleteTagStartRegex);
            if ((match != null) && match.length > 0) {
              break;
            }
            row--;
            lastLine = lines[row];
          }
          lastLineSpaces = lastLine.match(/^\s*/);
          lastLineSpaces = lastLineSpaces != null ? lastLineSpaces[0] : '';
          editor.insertText('\n' + lastLineSpaces);
          return editor.setCursorBufferPosition(eventObj.newRange.end);
        }
      }
    };

    AtomReact.prototype.processEditor = function(editor) {
      var disposableBufferEvent;
      this.patchEditorLangMode(editor);
      this.autoSetGrammar(editor);
      disposableBufferEvent = editor.buffer.onDidChange((function(_this) {
        return function(e) {
          return _this.autoCloseTag(e, editor);
        };
      })(this));
      this.disposables.add(editor.onDidDestroy((function(_this) {
        return function() {
          return disposableBufferEvent.dispose();
        };
      })(this)));
      return this.disposables.add(disposableBufferEvent);
    };

    AtomReact.prototype.deactivate = function() {
      return this.disposables.dispose();
    };

    AtomReact.prototype.activate = function() {
      var disposableConfigListener, disposableHTMLTOJSX, disposableProcessEditor, disposableReformat;
      this.disposables = new CompositeDisposable();
      disposableConfigListener = atom.config.observe('react.detectReactFilePattern', function(newValue) {
        return contentCheckRegex = null;
      });
      disposableReformat = atom.commands.add('atom-workspace', 'react:reformat-JSX', (function(_this) {
        return function() {
          return _this.onReformat();
        };
      })(this));
      disposableHTMLTOJSX = atom.commands.add('atom-workspace', 'react:HTML-to-JSX', (function(_this) {
        return function() {
          return _this.onHTMLToJSX();
        };
      })(this));
      disposableProcessEditor = atom.workspace.observeTextEditors(this.processEditor.bind(this));
      this.disposables.add(disposableConfigListener);
      this.disposables.add(disposableReformat);
      this.disposables.add(disposableHTMLTOJSX);
      return this.disposables.add(disposableProcessEditor);
    };

    return AtomReact;

  })();

  module.exports = AtomReact;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9yZWFjdC9saWIvYXRvbS1yZWFjdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsNkNBQUQsRUFBc0I7O0VBRXRCLGlCQUFBLEdBQW9COztFQUNwQiw2QkFBQSxHQUFnQzs7RUFDaEMseUJBQUEsR0FBNEI7O0VBQzVCLHlCQUFBLEdBQTRCOztFQUU1QixrQkFBQSxHQUFxQjs7RUFDckIsMEJBQUEsR0FBNkI7O0VBQzdCLGdDQUFBLEdBQW1DOztFQUk3Qjt3QkFDSixNQUFBLEdBQ0U7TUFBQSw0QkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7UUFFQSxXQUFBLEVBQWEsOEVBRmI7T0FERjtNQUlBLGdCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLFdBQUEsRUFBYSw2QkFGYjtPQUxGO01BUUEsc0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyw2QkFEVDtPQVRGO01BV0Esa0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxrQkFEVDtPQVpGO01BY0EsMEJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUywwQkFEVDtPQWZGO01BaUJBLGdDQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsZ0NBRFQ7T0FsQkY7OztJQXFCVyxtQkFBQSxHQUFBOzt3QkFDYixpREFBQSxHQUFtRCxTQUFDLE1BQUQ7QUFDakQsVUFBQTtNQUFBLElBQUEsR0FB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TUFDdEIsdUJBQUEsR0FBMEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxJQUFDLENBQUEsYUFBYSxDQUFDLElBQWYsQ0FBb0IsSUFBcEIsQ0FBbEM7TUFFMUIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLHdCQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixrQkFBakI7TUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsbUJBQWpCO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLHVCQUFqQjtJQWhCUTs7Ozs7O0VBbUJaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBalZqQiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbmNvbnRlbnRDaGVja1JlZ2V4ID0gbnVsbFxuZGVmYXVsdERldGVjdFJlYWN0RmlsZVBhdHRlcm4gPSAnLygocmVxdWlyZVxcXFwoW1xcJ1wiXXJlYWN0KD86KC1uYXRpdmV8XFxcXC9hZGRvbnMpKT9bXFwnXCJdXFxcXCkpKXwoaW1wb3J0XFxcXHMrW1xcXFx3e30sXFxcXHNdK1xcXFxzK2Zyb21cXFxccytbXFwnXCJdcmVhY3QoPzooLW5hdGl2ZXxcXFxcL2FkZG9ucykpP1tcXCdcIl0pLydcbmF1dG9Db21wbGV0ZVRhZ1N0YXJ0UmVnZXggPSAvKDwpKFthLXpBLVowLTlcXC46JF9dKykvZ1xuYXV0b0NvbXBsZXRlVGFnQ2xvc2VSZWdleCA9IC8oPFxcLykoW14+XSspKD4pL2dcblxuanN4VGFnU3RhcnRQYXR0ZXJuID0gJyg/eCkoKF58PXxyZXR1cm4pXFxcXHMqPChbXiEvP10oPyEuKz8oPC8uKz8+KSkpKSdcbmpzeENvbXBsZXhBdHRyaWJ1dGVQYXR0ZXJuID0gJyg/eClcXFxceyBbXn1cIlxcJ10qICR8XFxcXCggW14pXCJcXCddKiAkJ1xuZGVjcmVhc2VJbmRlbnRGb3JOZXh0TGluZVBhdHRlcm4gPSAnKD94KVxuLz5cXFxccyooLHw7KT9cXFxccyokXG58IF4oPyFcXFxccypcXFxcPylcXFxccypcXFxcUysuKjwvWy1fXFxcXC5BLVphLXowLTldKz4kJ1xuXG5jbGFzcyBBdG9tUmVhY3RcbiAgY29uZmlnOlxuICAgIGVuYWJsZWRGb3JBbGxKYXZhc2NyaXB0RmlsZXM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ0VuYWJsZSBncmFtbWFyLCBzbmlwcGV0cyBhbmQgb3RoZXIgZmVhdHVyZXMgYXV0b21hdGljYWxseSBmb3IgYWxsIC5qcyBmaWxlcy4nXG4gICAgZGlzYWJsZUF1dG9DbG9zZTpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGlzYWJsZWQgdGFnIGF1dG9jb21wbGV0aW9uJ1xuICAgIGRldGVjdFJlYWN0RmlsZVBhdHRlcm46XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogZGVmYXVsdERldGVjdFJlYWN0RmlsZVBhdHRlcm5cbiAgICBqc3hUYWdTdGFydFBhdHRlcm46XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDoganN4VGFnU3RhcnRQYXR0ZXJuXG4gICAganN4Q29tcGxleEF0dHJpYnV0ZVBhdHRlcm46XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDoganN4Q29tcGxleEF0dHJpYnV0ZVBhdHRlcm5cbiAgICBkZWNyZWFzZUluZGVudEZvck5leHRMaW5lUGF0dGVybjpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiBkZWNyZWFzZUluZGVudEZvck5leHRMaW5lUGF0dGVyblxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICBwYXRjaEVkaXRvckxhbmdNb2RlQXV0b0RlY3JlYXNlSW5kZW50Rm9yQnVmZmVyUm93OiAoZWRpdG9yKSAtPlxuICAgIHNlbGYgPSB0aGlzXG4gICAgZm4gPSBlZGl0b3IubGFuZ3VhZ2VNb2RlLmF1dG9EZWNyZWFzZUluZGVudEZvckJ1ZmZlclJvd1xuICAgIHJldHVybiBpZiBmbi5qc3hQYXRjaFxuXG4gICAgZWRpdG9yLmxhbmd1YWdlTW9kZS5hdXRvRGVjcmVhc2VJbmRlbnRGb3JCdWZmZXJSb3cgPSAoYnVmZmVyUm93LCBvcHRpb25zKSAtPlxuICAgICAgcmV0dXJuIGZuLmNhbGwoZWRpdG9yLmxhbmd1YWdlTW9kZSwgYnVmZmVyUm93LCBvcHRpb25zKSB1bmxlc3MgZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUgPT0gXCJzb3VyY2UuanMuanN4XCJcblxuICAgICAgc2NvcGVEZXNjcmlwdG9yID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUm93LCAwXSlcbiAgICAgIGRlY3JlYXNlTmV4dExpbmVJbmRlbnRSZWdleCA9IEBjYWNoZVJlZ2V4KGF0b20uY29uZmlnLmdldCgncmVhY3QuZGVjcmVhc2VJbmRlbnRGb3JOZXh0TGluZVBhdHRlcm4nKSB8fMKgZGVjcmVhc2VJbmRlbnRGb3JOZXh0TGluZVBhdHRlcm4pXG4gICAgICBkZWNyZWFzZUluZGVudFJlZ2V4ID0gQGRlY3JlYXNlSW5kZW50UmVnZXhGb3JTY29wZURlc2NyaXB0b3Ioc2NvcGVEZXNjcmlwdG9yKVxuICAgICAgaW5jcmVhc2VJbmRlbnRSZWdleCA9IEBpbmNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcblxuICAgICAgcHJlY2VkaW5nUm93ID0gQGJ1ZmZlci5wcmV2aW91c05vbkJsYW5rUm93KGJ1ZmZlclJvdylcblxuICAgICAgcmV0dXJuIGlmIHByZWNlZGluZ1JvdyA8IDBcblxuICAgICAgcHJlY2VkaW5nTGluZSA9IEBidWZmZXIubGluZUZvclJvdyhwcmVjZWRpbmdSb3cpXG4gICAgICBsaW5lID0gQGJ1ZmZlci5saW5lRm9yUm93KGJ1ZmZlclJvdylcblxuICAgICAgaWYgcHJlY2VkaW5nTGluZSBhbmQgZGVjcmVhc2VOZXh0TGluZUluZGVudFJlZ2V4LnRlc3RTeW5jKHByZWNlZGluZ0xpbmUpIGFuZFxuICAgICAgICAgbm90IChpbmNyZWFzZUluZGVudFJlZ2V4IGFuZCBpbmNyZWFzZUluZGVudFJlZ2V4LnRlc3RTeW5jKHByZWNlZGluZ0xpbmUpKSBhbmRcbiAgICAgICAgIG5vdCBAZWRpdG9yLmlzQnVmZmVyUm93Q29tbWVudGVkKHByZWNlZGluZ1JvdylcbiAgICAgICAgY3VycmVudEluZGVudExldmVsID0gQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhwcmVjZWRpbmdSb3cpXG4gICAgICAgIGN1cnJlbnRJbmRlbnRMZXZlbCAtPSAxIGlmIGRlY3JlYXNlSW5kZW50UmVnZXggYW5kIGRlY3JlYXNlSW5kZW50UmVnZXgudGVzdFN5bmMobGluZSlcbiAgICAgICAgZGVzaXJlZEluZGVudExldmVsID0gY3VycmVudEluZGVudExldmVsIC0gMVxuICAgICAgICBpZiBkZXNpcmVkSW5kZW50TGV2ZWwgPj0gMCBhbmQgZGVzaXJlZEluZGVudExldmVsIDwgY3VycmVudEluZGVudExldmVsXG4gICAgICAgICAgQGVkaXRvci5zZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhidWZmZXJSb3csIGRlc2lyZWRJbmRlbnRMZXZlbClcbiAgICAgIGVsc2UgaWYgbm90IEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQoYnVmZmVyUm93KVxuICAgICAgICBmbi5jYWxsKGVkaXRvci5sYW5ndWFnZU1vZGUsIGJ1ZmZlclJvdywgb3B0aW9ucylcblxuICBwYXRjaEVkaXRvckxhbmdNb2RlU3VnZ2VzdGVkSW5kZW50Rm9yQnVmZmVyUm93OiAoZWRpdG9yKSAtPlxuICAgIHNlbGYgPSB0aGlzXG4gICAgZm4gPSBlZGl0b3IubGFuZ3VhZ2VNb2RlLnN1Z2dlc3RlZEluZGVudEZvckJ1ZmZlclJvd1xuICAgIHJldHVybiBpZiBmbi5qc3hQYXRjaFxuXG4gICAgZWRpdG9yLmxhbmd1YWdlTW9kZS5zdWdnZXN0ZWRJbmRlbnRGb3JCdWZmZXJSb3cgPSAoYnVmZmVyUm93LCBvcHRpb25zKSAtPlxuICAgICAgaW5kZW50ID0gZm4uY2FsbChlZGl0b3IubGFuZ3VhZ2VNb2RlLCBidWZmZXJSb3csIG9wdGlvbnMpXG4gICAgICByZXR1cm4gaW5kZW50IHVubGVzcyBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSA9PSBcInNvdXJjZS5qcy5qc3hcIiBhbmQgYnVmZmVyUm93ID4gMVxuXG4gICAgICBzY29wZURlc2NyaXB0b3IgPSBAZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJSb3csIDBdKVxuXG4gICAgICBkZWNyZWFzZU5leHRMaW5lSW5kZW50UmVnZXggPSBAY2FjaGVSZWdleChhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmRlY3JlYXNlSW5kZW50Rm9yTmV4dExpbmVQYXR0ZXJuJykgfHzCoGRlY3JlYXNlSW5kZW50Rm9yTmV4dExpbmVQYXR0ZXJuKVxuICAgICAgaW5jcmVhc2VJbmRlbnRSZWdleCA9IEBpbmNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcblxuICAgICAgZGVjcmVhc2VJbmRlbnRSZWdleCA9IEBkZWNyZWFzZUluZGVudFJlZ2V4Rm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcbiAgICAgIHRhZ1N0YXJ0UmVnZXggPSBAY2FjaGVSZWdleChhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmpzeFRhZ1N0YXJ0UGF0dGVybicpIHx8wqBqc3hUYWdTdGFydFBhdHRlcm4pXG4gICAgICBjb21wbGV4QXR0cmlidXRlUmVnZXggPSBAY2FjaGVSZWdleChhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmpzeENvbXBsZXhBdHRyaWJ1dGVQYXR0ZXJuJykgfHzCoGpzeENvbXBsZXhBdHRyaWJ1dGVQYXR0ZXJuKVxuXG4gICAgICBwcmVjZWRpbmdSb3cgPSBAYnVmZmVyLnByZXZpb3VzTm9uQmxhbmtSb3coYnVmZmVyUm93KVxuXG4gICAgICByZXR1cm4gaW5kZW50IGlmIHByZWNlZGluZ1JvdyA8IDBcblxuICAgICAgcHJlY2VkaW5nTGluZSA9IEBidWZmZXIubGluZUZvclJvdyhwcmVjZWRpbmdSb3cpXG5cbiAgICAgIHJldHVybiBpbmRlbnQgaWYgbm90IHByZWNlZGluZ0xpbmU/XG5cbiAgICAgIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQoYnVmZmVyUm93KSBhbmQgQGVkaXRvci5pc0J1ZmZlclJvd0NvbW1lbnRlZChwcmVjZWRpbmdSb3cpXG4gICAgICAgIHJldHVybiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHByZWNlZGluZ1JvdylcblxuICAgICAgdGFnU3RhcnRUZXN0ID0gdGFnU3RhcnRSZWdleC50ZXN0U3luYyhwcmVjZWRpbmdMaW5lKVxuICAgICAgZGVjcmVhc2VJbmRlbnRUZXN0ID0gZGVjcmVhc2VJbmRlbnRSZWdleC50ZXN0U3luYyhwcmVjZWRpbmdMaW5lKVxuXG4gICAgICBpbmRlbnQgKz0gMSBpZiB0YWdTdGFydFRlc3QgYW5kIGNvbXBsZXhBdHRyaWJ1dGVSZWdleC50ZXN0U3luYyhwcmVjZWRpbmdMaW5lKSBhbmQgbm90IEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQocHJlY2VkaW5nUm93KVxuICAgICAgaW5kZW50IC09IDEgaWYgcHJlY2VkaW5nTGluZSBhbmQgbm90IGRlY3JlYXNlSW5kZW50VGVzdCBhbmQgZGVjcmVhc2VOZXh0TGluZUluZGVudFJlZ2V4LnRlc3RTeW5jKHByZWNlZGluZ0xpbmUpIGFuZCBub3QgQGVkaXRvci5pc0J1ZmZlclJvd0NvbW1lbnRlZChwcmVjZWRpbmdSb3cpXG5cbiAgICAgIHJldHVybiBNYXRoLm1heChpbmRlbnQsIDApXG5cbiAgcGF0Y2hFZGl0b3JMYW5nTW9kZTogKGVkaXRvcikgLT5cbiAgICBAcGF0Y2hFZGl0b3JMYW5nTW9kZVN1Z2dlc3RlZEluZGVudEZvckJ1ZmZlclJvdyhlZGl0b3IpPy5qc3hQYXRjaCA9IHRydWVcbiAgICBAcGF0Y2hFZGl0b3JMYW5nTW9kZUF1dG9EZWNyZWFzZUluZGVudEZvckJ1ZmZlclJvdyhlZGl0b3IpPy5qc3hQYXRjaCA9IHRydWVcblxuICBpc1JlYWN0OiAodGV4dCkgLT5cbiAgICByZXR1cm4gdHJ1ZSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmVuYWJsZWRGb3JBbGxKYXZhc2NyaXB0RmlsZXMnKVxuXG5cbiAgICBpZiBub3QgY29udGVudENoZWNrUmVnZXg/XG4gICAgICBtYXRjaCA9IChhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmRldGVjdFJlYWN0RmlsZVBhdHRlcm4nKSB8fCBkZWZhdWx0RGV0ZWN0UmVhY3RGaWxlUGF0dGVybikubWF0Y2gobmV3IFJlZ0V4cCgnXi8oLio/KS8oW2dpbXldKikkJykpO1xuICAgICAgY29udGVudENoZWNrUmVnZXggPSBuZXcgUmVnRXhwKG1hdGNoWzFdLCBtYXRjaFsyXSlcbiAgICByZXR1cm4gdGV4dC5tYXRjaChjb250ZW50Q2hlY2tSZWdleCk/XG5cbiAgaXNSZWFjdEVuYWJsZWRGb3JFZGl0b3I6IChlZGl0b3IpIC0+XG4gICAgcmV0dXJuIGVkaXRvcj8gJiYgZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUgaW4gW1wic291cmNlLmpzLmpzeFwiLCBcInNvdXJjZS5jb2ZmZWUuanN4XCJdXG5cbiAgYXV0b1NldEdyYW1tYXI6IChlZGl0b3IpIC0+XG4gICAgcmV0dXJuIGlmIEBpc1JlYWN0RW5hYmxlZEZvckVkaXRvciBlZGl0b3JcblxuICAgIHBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG4gICAgIyBDaGVjayBpZiBmaWxlIGV4dGVuc2lvbiBpcyAuanN4IG9yIHRoZSBmaWxlIHJlcXVpcmVzIFJlYWN0XG4gICAgZXh0TmFtZSA9IHBhdGguZXh0bmFtZShlZGl0b3IuZ2V0UGF0aCgpIG9yICcnKVxuICAgIGlmIGV4dE5hbWUgaXMgXCIuanN4XCIgb3IgKChleHROYW1lIGlzIFwiLmpzXCIgb3IgZXh0TmFtZSBpcyBcIi5lczZcIikgYW5kIEBpc1JlYWN0KGVkaXRvci5nZXRUZXh0KCkpKVxuICAgICAganN4R3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuZ3JhbW1hcnNCeVNjb3BlTmFtZVtcInNvdXJjZS5qcy5qc3hcIl1cbiAgICAgIGVkaXRvci5zZXRHcmFtbWFyIGpzeEdyYW1tYXIgaWYganN4R3JhbW1hclxuXG4gIG9uSFRNTFRvSlNYOiAtPlxuICAgIGpzeGZvcm1hdCA9IHJlcXVpcmUgJ2pzeGZvcm1hdCdcbiAgICBIVE1MdG9KU1ggPSByZXF1aXJlICcuL2h0bWx0b2pzeCdcbiAgICBjb252ZXJ0ZXIgPSBuZXcgSFRNTHRvSlNYKGNyZWF0ZUNsYXNzOiBmYWxzZSlcblxuICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgcmV0dXJuIGlmIG5vdCBAaXNSZWFjdEVuYWJsZWRGb3JFZGl0b3IgZWRpdG9yXG5cbiAgICBzZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuXG4gICAgZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnNcbiAgICAgICAgdHJ5XG4gICAgICAgICAgc2VsZWN0aW9uVGV4dCA9IHNlbGVjdGlvbi5nZXRUZXh0KClcbiAgICAgICAgICBqc3hPdXRwdXQgPSBjb252ZXJ0ZXIuY29udmVydChzZWxlY3Rpb25UZXh0KVxuXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICBqc3hmb3JtYXQuc2V0T3B0aW9ucyh7fSk7XG4gICAgICAgICAgICBqc3hPdXRwdXQgPSBqc3hmb3JtYXQuZm9ybWF0KGpzeE91dHB1dClcblxuICAgICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KGpzeE91dHB1dCk7XG4gICAgICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKTtcbiAgICAgICAgICBlZGl0b3IuYXV0b0luZGVudEJ1ZmZlclJvd3MocmFuZ2Uuc3RhcnQucm93LCByYW5nZS5lbmQucm93KVxuXG4gIG9uUmVmb3JtYXQ6IC0+XG4gICAganN4Zm9ybWF0ID0gcmVxdWlyZSAnanN4Zm9ybWF0J1xuICAgIF8gPSByZXF1aXJlICdsb2Rhc2gnXG5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICAgIHJldHVybiBpZiBub3QgQGlzUmVhY3RFbmFibGVkRm9yRWRpdG9yIGVkaXRvclxuXG4gICAgc2VsZWN0aW9ucyA9IGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gc2VsZWN0aW9uc1xuICAgICAgICB0cnlcbiAgICAgICAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpO1xuICAgICAgICAgIHNlcmlhbGl6ZWRSYW5nZSA9IHJhbmdlLnNlcmlhbGl6ZSgpXG4gICAgICAgICAgYnVmU3RhcnQgPSBzZXJpYWxpemVkUmFuZ2VbMF1cbiAgICAgICAgICBidWZFbmQgPSBzZXJpYWxpemVkUmFuZ2VbMV1cblxuICAgICAgICAgIGpzeGZvcm1hdC5zZXRPcHRpb25zKHt9KTtcbiAgICAgICAgICByZXN1bHQgPSBqc3hmb3JtYXQuZm9ybWF0KHNlbGVjdGlvbi5nZXRUZXh0KCkpXG5cbiAgICAgICAgICBvcmlnaW5hbExpbmVDb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKVxuICAgICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHJlc3VsdClcbiAgICAgICAgICBuZXdMaW5lQ291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KClcblxuICAgICAgICAgIGVkaXRvci5hdXRvSW5kZW50QnVmZmVyUm93cyhidWZTdGFydFswXSwgYnVmRW5kWzBdICsgKG5ld0xpbmVDb3VudCAtIG9yaWdpbmFsTGluZUNvdW50KSlcbiAgICAgICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oYnVmU3RhcnQpXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICMgUGFyc2luZy9mb3JtYXR0aW5nIHRoZSBzZWxlY3Rpb24gZmFpbGVkIGxldHMgdHJ5IHRvIHBhcnNlIHRoZSB3aG9sZSBmaWxlIGJ1dCBmb3JtYXQgdGhlIHNlbGVjdGlvbiBvbmx5XG4gICAgICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zZXJpYWxpemUoKVxuICAgICAgICAgICMgZXNwcmltYSBhc3QgbGluZSBjb3VudCBzdGFydHMgZm9yIDFcbiAgICAgICAgICByYW5nZVswXVswXSsrXG4gICAgICAgICAgcmFuZ2VbMV1bMF0rK1xuXG4gICAgICAgICAganN4Zm9ybWF0LnNldE9wdGlvbnMoe3JhbmdlOiByYW5nZX0pO1xuXG4gICAgICAgICAgIyBUT0RPOiB1c2UgZm9sZFxuICAgICAgICAgIG9yaWdpbmFsID0gZWRpdG9yLmdldFRleHQoKTtcblxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgcmVzdWx0ID0ganN4Zm9ybWF0LmZvcm1hdChvcmlnaW5hbClcbiAgICAgICAgICAgIHNlbGVjdGlvbi5jbGVhcigpXG5cbiAgICAgICAgICAgIG9yaWdpbmFsTGluZUNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChyZXN1bHQpXG4gICAgICAgICAgICBuZXdMaW5lQ291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KClcblxuICAgICAgICAgICAgZmlyc3RDaGFuZ2VkTGluZSA9IHJhbmdlWzBdWzBdIC0gMVxuICAgICAgICAgICAgbGFzdENoYW5nZWRMaW5lID0gcmFuZ2VbMV1bMF0gLSAxICsgKG5ld0xpbmVDb3VudCAtIG9yaWdpbmFsTGluZUNvdW50KVxuXG4gICAgICAgICAgICBlZGl0b3IuYXV0b0luZGVudEJ1ZmZlclJvd3MoZmlyc3RDaGFuZ2VkTGluZSwgbGFzdENoYW5nZWRMaW5lKVxuXG4gICAgICAgICAgICAjIHJldHVybiBiYWNrXG4gICAgICAgICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oW2ZpcnN0Q2hhbmdlZExpbmUsIHJhbmdlWzBdWzFdXSlcblxuICBhdXRvQ2xvc2VUYWc6IChldmVudE9iaiwgZWRpdG9yKSAtPlxuICAgIHJldHVybiBpZiBhdG9tLmNvbmZpZy5nZXQoJ3JlYWN0LmRpc2FibGVBdXRvQ2xvc2UnKVxuXG4gICAgcmV0dXJuIGlmIG5vdCBAaXNSZWFjdEVuYWJsZWRGb3JFZGl0b3IoZWRpdG9yKSBvciBlZGl0b3IgIT0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICBpZiBldmVudE9iaj8ubmV3VGV4dCBpcyAnPicgYW5kICFldmVudE9iai5vbGRUZXh0XG4gICAgICAjIGF1dG8gY2xvc2luZyBtdWx0aXBsZSBjdXJzb3JzIGlzIGEgbGl0dGxlIGJpdCB0cmlja3kgc28gbGV0cyBkaXNhYmxlIGl0IGZvciBub3dcbiAgICAgIHJldHVybiBpZiBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKCkubGVuZ3RoID4gMTtcblxuICAgICAgdG9rZW5pemVkTGluZSA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXI/LnRva2VuaXplZExpbmVGb3JSb3coZXZlbnRPYmoubmV3UmFuZ2UuZW5kLnJvdylcbiAgICAgIHJldHVybiBpZiBub3QgdG9rZW5pemVkTGluZT9cblxuICAgICAgdG9rZW4gPSB0b2tlbml6ZWRMaW5lLnRva2VuQXRCdWZmZXJDb2x1bW4oZXZlbnRPYmoubmV3UmFuZ2UuZW5kLmNvbHVtbiAtIDEpXG5cbiAgICAgIGlmIG5vdCB0b2tlbj8gb3IgdG9rZW4uc2NvcGVzLmluZGV4T2YoJ3RhZy5vcGVuLmpzJykgPT0gLTEgb3IgdG9rZW4uc2NvcGVzLmluZGV4T2YoJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udGFnLmVuZC5qcycpID09IC0xXG4gICAgICAgIHJldHVyblxuXG4gICAgICBsaW5lcyA9IGVkaXRvci5idWZmZXIuZ2V0TGluZXMoKVxuICAgICAgcm93ID0gZXZlbnRPYmoubmV3UmFuZ2UuZW5kLnJvd1xuICAgICAgbGluZSA9IGxpbmVzW3Jvd11cbiAgICAgIGxpbmUgPSBsaW5lLnN1YnN0ciAwLCBldmVudE9iai5uZXdSYW5nZS5lbmQuY29sdW1uXG5cbiAgICAgICMgVGFnIGlzIHNlbGYgY2xvc2luZ1xuICAgICAgcmV0dXJuIGlmIGxpbmUuc3Vic3RyKGxpbmUubGVuZ3RoIC0gMiwgMSkgaXMgJy8nXG5cbiAgICAgIHRhZ05hbWUgPSBudWxsXG5cbiAgICAgIHdoaWxlIGxpbmU/IGFuZCBub3QgdGFnTmFtZT9cbiAgICAgICAgbWF0Y2ggPSBsaW5lLm1hdGNoIGF1dG9Db21wbGV0ZVRhZ1N0YXJ0UmVnZXhcbiAgICAgICAgaWYgbWF0Y2g/ICYmIG1hdGNoLmxlbmd0aCA+IDBcbiAgICAgICAgICB0YWdOYW1lID0gbWF0Y2gucG9wKCkuc3Vic3RyKDEpXG4gICAgICAgIHJvdy0tXG4gICAgICAgIGxpbmUgPSBsaW5lc1tyb3ddXG5cbiAgICAgIGlmIHRhZ05hbWU/XG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCc8LycgKyB0YWdOYW1lICsgJz4nLCB7dW5kbzogJ3NraXAnfSlcbiAgICAgICAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKGV2ZW50T2JqLm5ld1JhbmdlLmVuZClcblxuICAgIGVsc2UgaWYgZXZlbnRPYmo/Lm9sZFRleHQgaXMgJz4nIGFuZCBldmVudE9iaj8ubmV3VGV4dCBpcyAnJ1xuXG4gICAgICBsaW5lcyA9IGVkaXRvci5idWZmZXIuZ2V0TGluZXMoKVxuICAgICAgcm93ID0gZXZlbnRPYmoubmV3UmFuZ2UuZW5kLnJvd1xuICAgICAgZnVsbExpbmUgPSBsaW5lc1tyb3ddXG5cbiAgICAgIHRva2VuaXplZExpbmUgPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyPy50b2tlbml6ZWRMaW5lRm9yUm93KGV2ZW50T2JqLm5ld1JhbmdlLmVuZC5yb3cpXG4gICAgICByZXR1cm4gaWYgbm90IHRva2VuaXplZExpbmU/XG5cbiAgICAgIHRva2VuID0gdG9rZW5pemVkTGluZS50b2tlbkF0QnVmZmVyQ29sdW1uKGV2ZW50T2JqLm5ld1JhbmdlLmVuZC5jb2x1bW4gLSAxKVxuICAgICAgaWYgbm90IHRva2VuPyBvciB0b2tlbi5zY29wZXMuaW5kZXhPZigndGFnLm9wZW4uanMnKSA9PSAtMVxuICAgICAgICByZXR1cm5cbiAgICAgIGxpbmUgPSBmdWxsTGluZS5zdWJzdHIgMCwgZXZlbnRPYmoubmV3UmFuZ2UuZW5kLmNvbHVtblxuXG4gICAgICAjIFRhZyBpcyBzZWxmIGNsb3NpbmdcbiAgICAgIHJldHVybiBpZiBsaW5lLnN1YnN0cihsaW5lLmxlbmd0aCAtIDEsIDEpIGlzICcvJ1xuXG4gICAgICB0YWdOYW1lID0gbnVsbFxuXG4gICAgICB3aGlsZSBsaW5lPyBhbmQgbm90IHRhZ05hbWU/XG4gICAgICAgIG1hdGNoID0gbGluZS5tYXRjaCBhdXRvQ29tcGxldGVUYWdTdGFydFJlZ2V4XG4gICAgICAgIGlmIG1hdGNoPyAmJiBtYXRjaC5sZW5ndGggPiAwXG4gICAgICAgICAgdGFnTmFtZSA9IG1hdGNoLnBvcCgpLnN1YnN0cigxKVxuICAgICAgICByb3ctLVxuICAgICAgICBsaW5lID0gbGluZXNbcm93XVxuXG4gICAgICBpZiB0YWdOYW1lP1xuICAgICAgICByZXN0ID0gZnVsbExpbmUuc3Vic3RyKGV2ZW50T2JqLm5ld1JhbmdlLmVuZC5jb2x1bW4pXG4gICAgICAgIGlmIHJlc3QuaW5kZXhPZignPC8nICsgdGFnTmFtZSArICc+JykgPT0gMFxuICAgICAgICAgICMgcmVzdCBpcyBjbG9zaW5nIHRhZ1xuICAgICAgICAgIHNlcmlhbGl6ZWRFbmRQb2ludCA9IFtldmVudE9iai5uZXdSYW5nZS5lbmQucm93LCBldmVudE9iai5uZXdSYW5nZS5lbmQuY29sdW1uXTtcbiAgICAgICAgICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIHNlcmlhbGl6ZWRFbmRQb2ludCxcbiAgICAgICAgICAgICAgW3NlcmlhbGl6ZWRFbmRQb2ludFswXSwgc2VyaWFsaXplZEVuZFBvaW50WzFdICsgdGFnTmFtZS5sZW5ndGggKyAzXVxuICAgICAgICAgICAgXVxuICAgICAgICAgICwgJycsIHt1bmRvOiAnc2tpcCd9KVxuXG4gICAgZWxzZSBpZiBldmVudE9iaj8ubmV3VGV4dCBpcyAnXFxuJ1xuICAgICAgbGluZXMgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVzKClcbiAgICAgIHJvdyA9IGV2ZW50T2JqLm5ld1JhbmdlLmVuZC5yb3dcbiAgICAgIGxhc3RMaW5lID0gbGluZXNbcm93IC0gMV1cbiAgICAgIGZ1bGxMaW5lID0gbGluZXNbcm93XVxuXG4gICAgICBpZiAvPiQvLnRlc3QobGFzdExpbmUpIGFuZCBmdWxsTGluZS5zZWFyY2goYXV0b0NvbXBsZXRlVGFnQ2xvc2VSZWdleCkgPT0gMFxuICAgICAgICB3aGlsZSBsYXN0TGluZT9cbiAgICAgICAgICBtYXRjaCA9IGxhc3RMaW5lLm1hdGNoIGF1dG9Db21wbGV0ZVRhZ1N0YXJ0UmVnZXhcbiAgICAgICAgICBpZiBtYXRjaD8gJiYgbWF0Y2gubGVuZ3RoID4gMFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICByb3ctLVxuICAgICAgICAgIGxhc3RMaW5lID0gbGluZXNbcm93XVxuXG4gICAgICAgIGxhc3RMaW5lU3BhY2VzID0gbGFzdExpbmUubWF0Y2goL15cXHMqLylcbiAgICAgICAgbGFzdExpbmVTcGFjZXMgPSBpZiBsYXN0TGluZVNwYWNlcz8gdGhlbiBsYXN0TGluZVNwYWNlc1swXSBlbHNlICcnXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCdcXG4nICsgbGFzdExpbmVTcGFjZXMpXG4gICAgICAgIGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihldmVudE9iai5uZXdSYW5nZS5lbmQpXG5cbiAgcHJvY2Vzc0VkaXRvcjogKGVkaXRvcikgLT5cbiAgICBAcGF0Y2hFZGl0b3JMYW5nTW9kZShlZGl0b3IpXG4gICAgQGF1dG9TZXRHcmFtbWFyKGVkaXRvcilcbiAgICBkaXNwb3NhYmxlQnVmZmVyRXZlbnQgPSBlZGl0b3IuYnVmZmVyLm9uRGlkQ2hhbmdlIChlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQGF1dG9DbG9zZVRhZyBlLCBlZGl0b3JcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZWRpdG9yLm9uRGlkRGVzdHJveSA9PiBkaXNwb3NhYmxlQnVmZmVyRXZlbnQuZGlzcG9zZSgpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkKGRpc3Bvc2FibGVCdWZmZXJFdmVudCk7XG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIGFjdGl2YXRlOiAtPlxuXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGRpc3Bvc2FibGVDb25maWdMaXN0ZW5lciA9IGF0b20uY29uZmlnLm9ic2VydmUgJ3JlYWN0LmRldGVjdFJlYWN0RmlsZVBhdHRlcm4nLCAobmV3VmFsdWUpIC0+XG4gICAgICBjb250ZW50Q2hlY2tSZWdleCA9IG51bGxcblxuICAgIGRpc3Bvc2FibGVSZWZvcm1hdCA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdyZWFjdDpyZWZvcm1hdC1KU1gnLCA9PiBAb25SZWZvcm1hdCgpXG4gICAgZGlzcG9zYWJsZUhUTUxUT0pTWCA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdyZWFjdDpIVE1MLXRvLUpTWCcsID0+IEBvbkhUTUxUb0pTWCgpXG4gICAgZGlzcG9zYWJsZVByb2Nlc3NFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgQHByb2Nlc3NFZGl0b3IuYmluZCh0aGlzKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBkaXNwb3NhYmxlQ29uZmlnTGlzdGVuZXJcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGRpc3Bvc2FibGVSZWZvcm1hdFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZGlzcG9zYWJsZUhUTUxUT0pTWFxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZGlzcG9zYWJsZVByb2Nlc3NFZGl0b3JcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEF0b21SZWFjdFxuIl19
