(function() {
  var CompositeDisposable, Whitespace,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = Whitespace = (function() {
    function Whitespace() {
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.handleEvents(editor);
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'whitespace:remove-trailing-whitespace': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              return _this.removeTrailingWhitespace(editor, editor.getGrammar().scopeName);
            }
          };
        })(this),
        'whitespace:save-with-trailing-whitespace': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              _this.ignore = true;
              editor.save();
              return _this.ignore = false;
            }
          };
        })(this),
        'whitespace:save-without-trailing-whitespace': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              _this.removeTrailingWhitespace(editor, editor.getGrammar().scopeName);
              return editor.save();
            }
          };
        })(this),
        'whitespace:convert-tabs-to-spaces': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              return _this.convertTabsToSpaces(editor);
            }
          };
        })(this),
        'whitespace:convert-spaces-to-tabs': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              return _this.convertSpacesToTabs(editor);
            }
          };
        })(this),
        'whitespace:convert-all-tabs-to-spaces': (function(_this) {
          return function() {
            var editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              return _this.convertTabsToSpaces(editor, true);
            }
          };
        })(this)
      }));
    }

    Whitespace.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    Whitespace.prototype.handleEvents = function(editor) {
      var buffer, bufferSavedSubscription, editorDestroyedSubscription, editorTextInsertedSubscription;
      buffer = editor.getBuffer();
      bufferSavedSubscription = buffer.onWillSave((function(_this) {
        return function() {
          return buffer.transact(function() {
            var scopeDescriptor;
            scopeDescriptor = editor.getRootScopeDescriptor();
            if (atom.config.get('whitespace.removeTrailingWhitespace', {
              scope: scopeDescriptor
            }) && !_this.ignore) {
              _this.removeTrailingWhitespace(editor, editor.getGrammar().scopeName);
            }
            if (atom.config.get('whitespace.ensureSingleTrailingNewline', {
              scope: scopeDescriptor
            })) {
              return _this.ensureSingleTrailingNewline(editor);
            }
          });
        };
      })(this));
      editorTextInsertedSubscription = editor.onDidInsertText(function(event) {
        var scopeDescriptor;
        if (event.text !== '\n') {
          return;
        }
        if (!buffer.isRowBlank(event.range.start.row)) {
          return;
        }
        scopeDescriptor = editor.getRootScopeDescriptor();
        if (atom.config.get('whitespace.removeTrailingWhitespace', {
          scope: scopeDescriptor
        })) {
          if (!atom.config.get('whitespace.ignoreWhitespaceOnlyLines', {
            scope: scopeDescriptor
          })) {
            return editor.setIndentationForBufferRow(event.range.start.row, 0);
          }
        }
      });
      editorDestroyedSubscription = editor.onDidDestroy((function(_this) {
        return function() {
          bufferSavedSubscription.dispose();
          editorTextInsertedSubscription.dispose();
          editorDestroyedSubscription.dispose();
          _this.subscriptions.remove(bufferSavedSubscription);
          _this.subscriptions.remove(editorTextInsertedSubscription);
          return _this.subscriptions.remove(editorDestroyedSubscription);
        };
      })(this));
      this.subscriptions.add(bufferSavedSubscription);
      this.subscriptions.add(editorTextInsertedSubscription);
      return this.subscriptions.add(editorDestroyedSubscription);
    };

    Whitespace.prototype.removeTrailingWhitespace = function(editor, grammarScopeName) {
      var buffer, ignoreCurrentLine, ignoreWhitespaceOnlyLines, scopeDescriptor;
      buffer = editor.getBuffer();
      scopeDescriptor = editor.getRootScopeDescriptor();
      ignoreCurrentLine = atom.config.get('whitespace.ignoreWhitespaceOnCurrentLine', {
        scope: scopeDescriptor
      });
      ignoreWhitespaceOnlyLines = atom.config.get('whitespace.ignoreWhitespaceOnlyLines', {
        scope: scopeDescriptor
      });
      return buffer.backwardsScan(/[ \t]+$/g, function(arg) {
        var cursor, cursorRows, lineText, match, replace, whitespace, whitespaceRow;
        lineText = arg.lineText, match = arg.match, replace = arg.replace;
        whitespaceRow = buffer.positionForCharacterIndex(match.index).row;
        cursorRows = (function() {
          var i, len, ref, results;
          ref = editor.getCursors();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            cursor = ref[i];
            results.push(cursor.getBufferRow());
          }
          return results;
        })();
        if (ignoreCurrentLine && indexOf.call(cursorRows, whitespaceRow) >= 0) {
          return;
        }
        whitespace = match[0];
        if (ignoreWhitespaceOnlyLines && whitespace === lineText) {
          return;
        }
        if (grammarScopeName === 'source.gfm' && atom.config.get('whitespace.keepMarkdownLineBreakWhitespace')) {
          if (!(whitespace.length >= 2 && whitespace !== lineText)) {
            return replace('');
          }
        } else {
          return replace('');
        }
      });
    };

    Whitespace.prototype.ensureSingleTrailingNewline = function(editor) {
      var buffer, lastRow, results, row, selectedBufferRanges;
      buffer = editor.getBuffer();
      lastRow = buffer.getLastRow();
      if (buffer.lineForRow(lastRow) === '') {
        row = lastRow - 1;
        results = [];
        while (row && buffer.lineForRow(row) === '') {
          results.push(buffer.deleteRow(row--));
        }
        return results;
      } else {
        selectedBufferRanges = editor.getSelectedBufferRanges();
        buffer.append('\n');
        return editor.setSelectedBufferRanges(selectedBufferRanges);
      }
    };

    Whitespace.prototype.convertTabsToSpaces = function(editor, convertAllTabs) {
      var buffer, regex, spacesText;
      buffer = editor.getBuffer();
      spacesText = new Array(editor.getTabLength() + 1).join(' ');
      regex = convertAllTabs ? /\t/g : /^\t+/g;
      buffer.transact(function() {
        return buffer.scan(regex, function(arg) {
          var replace;
          replace = arg.replace;
          return replace(spacesText);
        });
      });
      return editor.setSoftTabs(true);
    };

    Whitespace.prototype.convertSpacesToTabs = function(editor) {
      var buffer, fileTabSize, regex, scope, userTabSize;
      buffer = editor.getBuffer();
      scope = editor.getRootScopeDescriptor();
      fileTabSize = editor.getTabLength();
      userTabSize = atom.config.get('editor.tabLength', {
        scope: scope
      });
      regex = new RegExp(' '.repeat(fileTabSize), 'g');
      buffer.transact(function() {
        return buffer.scan(/^[ \t]+/g, function(arg) {
          var matchText, replace;
          matchText = arg.matchText, replace = arg.replace;
          return replace(matchText.replace(regex, "\t").replace(/[ ]+\t/g, "\t"));
        });
      });
      editor.setSoftTabs(false);
      if (fileTabSize !== userTabSize) {
        return editor.setTabLength(userTabSize);
      }
    };

    return Whitespace;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93aGl0ZXNwYWNlL2xpYi93aGl0ZXNwYWNlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsK0JBQUE7SUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxvQkFBQTtNQUNYLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBa0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7aUJBQ25ELEtBQUMsQ0FBQSxZQUFELENBQWMsTUFBZDtRQURtRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEMsQ0FBbkI7TUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUNqQjtRQUFBLHVDQUFBLEVBQXlDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7QUFDdkMsZ0JBQUE7WUFBQSxJQUFHLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBWjtxQkFDRSxLQUFDLENBQUEsd0JBQUQsQ0FBMEIsTUFBMUIsRUFBa0MsTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUFtQixDQUFDLFNBQXRELEVBREY7O1VBRHVDO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QztRQUdBLDBDQUFBLEVBQTRDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7QUFDMUMsZ0JBQUE7WUFBQSxJQUFHLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FB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QyxPQUFBLEtBQUQ7T0FBcEM7TUFDZCxLQUFBLEdBQVksSUFBQSxNQUFBLENBQU8sR0FBRyxDQUFDLE1BQUosQ0FBVyxXQUFYLENBQVAsRUFBZ0MsR0FBaEM7TUFFWixNQUFNLENBQUMsUUFBUCxDQUFnQixTQUFBO2VBQ2QsTUFBTSxDQUFDLElBQVAsQ0FBWSxVQUFaLEVBQXdCLFNBQUMsR0FBRDtBQUN0QixjQUFBO1VBRHdCLDJCQUFXO2lCQUNuQyxPQUFBLENBQVEsU0FBUyxDQUFDLE9BQVYsQ0FBa0IsS0FBbEIsRUFBeUIsSUFBekIsQ0FBOEIsQ0FBQyxPQUEvQixDQUF1QyxTQUF2QyxFQUFrRCxJQUFsRCxDQUFSO1FBRHNCLENBQXhCO01BRGMsQ0FBaEI7TUFJQSxNQUFNLENBQUMsV0FBUCxDQUFtQixLQUFuQjtNQUNBLElBQXdDLFdBQUEsS0FBZSxXQUF2RDtlQUFBLE1BQU0sQ0FBQyxZQUFQLENBQW9CLFdBQXBCLEVBQUE7O0lBWm1COzs7OztBQTlHdkIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBXaGl0ZXNwYWNlXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICBAaGFuZGxlRXZlbnRzKGVkaXRvcilcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ3doaXRlc3BhY2U6cmVtb3ZlLXRyYWlsaW5nLXdoaXRlc3BhY2UnOiA9PlxuICAgICAgICBpZiBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICBAcmVtb3ZlVHJhaWxpbmdXaGl0ZXNwYWNlKGVkaXRvciwgZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpXG4gICAgICAnd2hpdGVzcGFjZTpzYXZlLXdpdGgtdHJhaWxpbmctd2hpdGVzcGFjZSc6ID0+XG4gICAgICAgIGlmIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgICAgIEBpZ25vcmUgPSB0cnVlXG4gICAgICAgICAgZWRpdG9yLnNhdmUoKVxuICAgICAgICAgIEBpZ25vcmUgPSBmYWxzZVxuICAgICAgJ3doaXRlc3BhY2U6c2F2ZS13aXRob3V0LXRyYWlsaW5nLXdoaXRlc3BhY2UnOiA9PlxuICAgICAgICBpZiBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICBAcmVtb3ZlVHJhaWxpbmdXaGl0ZXNwYWNlKGVkaXRvciwgZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpXG4gICAgICAgICAgZWRpdG9yLnNhdmUoKVxuICAgICAgJ3doaXRlc3BhY2U6Y29udmVydC10YWJzLXRvLXNwYWNlcyc6ID0+XG4gICAgICAgIGlmIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgICAgIEBjb252ZXJ0VGFic1RvU3BhY2VzKGVkaXRvcilcbiAgICAgICd3aGl0ZXNwYWNlOmNvbnZlcnQtc3BhY2VzLXRvLXRhYnMnOiA9PlxuICAgICAgICBpZiBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICBAY29udmVydFNwYWNlc1RvVGFicyhlZGl0b3IpXG4gICAgICAnd2hpdGVzcGFjZTpjb252ZXJ0LWFsbC10YWJzLXRvLXNwYWNlcyc6ID0+XG4gICAgICAgIGlmIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgICAgIEBjb252ZXJ0VGFic1RvU3BhY2VzKGVkaXRvciwgdHJ1ZSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIGhhbmRsZUV2ZW50czogKGVkaXRvcikgLT5cbiAgICBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKClcbiAgICBidWZmZXJTYXZlZFN1YnNjcmlwdGlvbiA9IGJ1ZmZlci5vbldpbGxTYXZlID0+XG4gICAgICBidWZmZXIudHJhbnNhY3QgPT5cbiAgICAgICAgc2NvcGVEZXNjcmlwdG9yID0gZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKVxuICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3doaXRlc3BhY2UucmVtb3ZlVHJhaWxpbmdXaGl0ZXNwYWNlJywgc2NvcGU6IHNjb3BlRGVzY3JpcHRvcikgYW5kIG5vdCBAaWdub3JlXG4gICAgICAgICAgQHJlbW92ZVRyYWlsaW5nV2hpdGVzcGFjZShlZGl0b3IsIGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lKVxuICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3doaXRlc3BhY2UuZW5zdXJlU2luZ2xlVHJhaWxpbmdOZXdsaW5lJywgc2NvcGU6IHNjb3BlRGVzY3JpcHRvcilcbiAgICAgICAgICBAZW5zdXJlU2luZ2xlVHJhaWxpbmdOZXdsaW5lKGVkaXRvcilcblxuICAgIGVkaXRvclRleHRJbnNlcnRlZFN1YnNjcmlwdGlvbiA9IGVkaXRvci5vbkRpZEluc2VydFRleHQgKGV2ZW50KSAtPlxuICAgICAgcmV0dXJuIHVubGVzcyBldmVudC50ZXh0IGlzICdcXG4nXG4gICAgICByZXR1cm4gdW5sZXNzIGJ1ZmZlci5pc1Jvd0JsYW5rKGV2ZW50LnJhbmdlLnN0YXJ0LnJvdylcblxuICAgICAgc2NvcGVEZXNjcmlwdG9yID0gZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKVxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCd3aGl0ZXNwYWNlLnJlbW92ZVRyYWlsaW5nV2hpdGVzcGFjZScsIHNjb3BlOiBzY29wZURlc2NyaXB0b3IpXG4gICAgICAgIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ3doaXRlc3BhY2UuaWdub3JlV2hpdGVzcGFjZU9ubHlMaW5lcycsIHNjb3BlOiBzY29wZURlc2NyaXB0b3IpXG4gICAgICAgICAgZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93KGV2ZW50LnJhbmdlLnN0YXJ0LnJvdywgMClcblxuICAgIGVkaXRvckRlc3Ryb3llZFN1YnNjcmlwdGlvbiA9IGVkaXRvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgIGJ1ZmZlclNhdmVkU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgZWRpdG9yVGV4dEluc2VydGVkU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgZWRpdG9yRGVzdHJveWVkU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUoYnVmZmVyU2F2ZWRTdWJzY3JpcHRpb24pXG4gICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUoZWRpdG9yVGV4dEluc2VydGVkU3Vic2NyaXB0aW9uKVxuICAgICAgQHN1YnNjcmlwdGlvbnMucmVtb3ZlKGVkaXRvckRlc3Ryb3llZFN1YnNjcmlwdGlvbilcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChidWZmZXJTYXZlZFN1YnNjcmlwdGlvbilcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoZWRpdG9yVGV4dEluc2VydGVkU3Vic2NyaXB0aW9uKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChlZGl0b3JEZXN0cm95ZWRTdWJzY3JpcHRpb24pXG5cbiAgcmVtb3ZlVHJhaWxpbmdXaGl0ZXNwYWNlOiAoZWRpdG9yLCBncmFtbWFyU2NvcGVOYW1lKSAtPlxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIHNjb3BlRGVzY3JpcHRvciA9IGVkaXRvci5nZXRSb290U2NvcGVEZXNjcmlwdG9yKClcbiAgICBpZ25vcmVDdXJyZW50TGluZSA9IGF0b20uY29uZmlnLmdldCgnd2hpdGVzcGFjZS5pZ25vcmVXaGl0ZXNwYWNlT25DdXJyZW50TGluZScsIHNjb3BlOiBzY29wZURlc2NyaXB0b3IpXG4gICAgaWdub3JlV2hpdGVzcGFjZU9ubHlMaW5lcyA9IGF0b20uY29uZmlnLmdldCgnd2hpdGVzcGFjZS5pZ25vcmVXaGl0ZXNwYWNlT25seUxpbmVzJywgc2NvcGU6IHNjb3BlRGVzY3JpcHRvcilcblxuICAgIGJ1ZmZlci5iYWNrd2FyZHNTY2FuIC9bIFxcdF0rJC9nLCAoe2xpbmVUZXh0LCBtYXRjaCwgcmVwbGFjZX0pIC0+XG4gICAgICB3aGl0ZXNwYWNlUm93ID0gYnVmZmVyLnBvc2l0aW9uRm9yQ2hhcmFjdGVySW5kZXgobWF0Y2guaW5kZXgpLnJvd1xuICAgICAgY3Vyc29yUm93cyA9IChjdXJzb3IuZ2V0QnVmZmVyUm93KCkgZm9yIGN1cnNvciBpbiBlZGl0b3IuZ2V0Q3Vyc29ycygpKVxuXG4gICAgICByZXR1cm4gaWYgaWdub3JlQ3VycmVudExpbmUgYW5kIHdoaXRlc3BhY2VSb3cgaW4gY3Vyc29yUm93c1xuXG4gICAgICBbd2hpdGVzcGFjZV0gPSBtYXRjaFxuICAgICAgcmV0dXJuIGlmIGlnbm9yZVdoaXRlc3BhY2VPbmx5TGluZXMgYW5kIHdoaXRlc3BhY2UgaXMgbGluZVRleHRcblxuICAgICAgaWYgZ3JhbW1hclNjb3BlTmFtZSBpcyAnc291cmNlLmdmbScgYW5kIGF0b20uY29uZmlnLmdldCgnd2hpdGVzcGFjZS5rZWVwTWFya2Rvd25MaW5lQnJlYWtXaGl0ZXNwYWNlJylcbiAgICAgICAgIyBHaXRIdWIgRmxhdm9yZWQgTWFya2Rvd24gcGVybWl0cyB0d28gb3IgbW9yZSBzcGFjZXMgYXQgdGhlIGVuZCBvZiBhIGxpbmVcbiAgICAgICAgcmVwbGFjZSgnJykgdW5sZXNzIHdoaXRlc3BhY2UubGVuZ3RoID49IDIgYW5kIHdoaXRlc3BhY2UgaXNudCBsaW5lVGV4dFxuICAgICAgZWxzZVxuICAgICAgICByZXBsYWNlKCcnKVxuXG4gIGVuc3VyZVNpbmdsZVRyYWlsaW5nTmV3bGluZTogKGVkaXRvcikgLT5cbiAgICBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKClcbiAgICBsYXN0Um93ID0gYnVmZmVyLmdldExhc3RSb3coKVxuXG4gICAgaWYgYnVmZmVyLmxpbmVGb3JSb3cobGFzdFJvdykgaXMgJydcbiAgICAgIHJvdyA9IGxhc3RSb3cgLSAxXG4gICAgICBidWZmZXIuZGVsZXRlUm93KHJvdy0tKSB3aGlsZSByb3cgYW5kIGJ1ZmZlci5saW5lRm9yUm93KHJvdykgaXMgJydcbiAgICBlbHNlXG4gICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlcyA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgICBidWZmZXIuYXBwZW5kKCdcXG4nKVxuICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKHNlbGVjdGVkQnVmZmVyUmFuZ2VzKVxuXG4gIGNvbnZlcnRUYWJzVG9TcGFjZXM6IChlZGl0b3IsIGNvbnZlcnRBbGxUYWJzKSAtPlxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIHNwYWNlc1RleHQgPSBuZXcgQXJyYXkoZWRpdG9yLmdldFRhYkxlbmd0aCgpICsgMSkuam9pbignICcpXG4gICAgcmVnZXggPSBpZiBjb252ZXJ0QWxsVGFicyB0aGVuIC9cXHQvZyBlbHNlIC9eXFx0Ky9nXG5cbiAgICBidWZmZXIudHJhbnNhY3QgLT5cbiAgICAgIGJ1ZmZlci5zY2FuIHJlZ2V4LCAoe3JlcGxhY2V9KSAtPiByZXBsYWNlKHNwYWNlc1RleHQpXG5cbiAgICBlZGl0b3Iuc2V0U29mdFRhYnModHJ1ZSlcblxuICBjb252ZXJ0U3BhY2VzVG9UYWJzOiAoZWRpdG9yKSAtPlxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIHNjb3BlID0gZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKVxuICAgIGZpbGVUYWJTaXplID0gZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgdXNlclRhYlNpemUgPSBhdG9tLmNvbmZpZy5nZXQgJ2VkaXRvci50YWJMZW5ndGgnLCB7c2NvcGV9XG4gICAgcmVnZXggPSBuZXcgUmVnRXhwICcgJy5yZXBlYXQoZmlsZVRhYlNpemUpLCAnZydcblxuICAgIGJ1ZmZlci50cmFuc2FjdCAtPlxuICAgICAgYnVmZmVyLnNjYW4gL15bIFxcdF0rL2csICh7bWF0Y2hUZXh0LCByZXBsYWNlfSkgLT5cbiAgICAgICAgcmVwbGFjZSBtYXRjaFRleHQucmVwbGFjZShyZWdleCwgXCJcXHRcIikucmVwbGFjZSgvWyBdK1xcdC9nLCBcIlxcdFwiKVxuXG4gICAgZWRpdG9yLnNldFNvZnRUYWJzKGZhbHNlKVxuICAgIGVkaXRvci5zZXRUYWJMZW5ndGgodXNlclRhYlNpemUpIHVubGVzcyBmaWxlVGFiU2l6ZSBpcyB1c2VyVGFiU2l6ZVxuIl19
