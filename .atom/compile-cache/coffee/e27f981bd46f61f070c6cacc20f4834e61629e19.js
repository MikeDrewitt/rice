(function() {
  var MarkdownPreviewView, fs, isMarkdownPreviewView, renderer, url,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  url = require('url');

  fs = require('fs-plus');

  MarkdownPreviewView = null;

  renderer = null;

  isMarkdownPreviewView = function(object) {
    if (MarkdownPreviewView == null) {
      MarkdownPreviewView = require('./markdown-preview-view');
    }
    return object instanceof MarkdownPreviewView;
  };

  module.exports = {
    activate: function() {
      var previewFile;
      if (parseFloat(atom.getVersion()) < 1.7) {
        atom.deserializers.add({
          name: 'MarkdownPreviewView',
          deserialize: module.exports.createMarkdownPreviewView.bind(module.exports)
        });
      }
      atom.commands.add('atom-workspace', {
        'markdown-preview:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this),
        'markdown-preview:copy-html': (function(_this) {
          return function() {
            return _this.copyHtml();
          };
        })(this),
        'markdown-preview:save-as-html': (function(_this) {
          return function() {
            return _this.saveAsHtml();
          };
        })(this),
        'markdown-preview:toggle-break-on-single-newline': function() {
          var keyPath;
          keyPath = 'markdown-preview.breakOnSingleNewline';
          return atom.config.set(keyPath, !atom.config.get(keyPath));
        },
        'markdown-preview:toggle-github-style': function() {
          var keyPath;
          keyPath = 'markdown-preview.useGitHubStyle';
          return atom.config.set(keyPath, !atom.config.get(keyPath));
        }
      });
      previewFile = this.previewFile.bind(this);
      atom.commands.add('.tree-view .file .name[data-name$=\\.markdown]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.md]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.mdown]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.mkd]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.mkdown]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.ron]', 'markdown-preview:preview-file', previewFile);
      atom.commands.add('.tree-view .file .name[data-name$=\\.txt]', 'markdown-preview:preview-file', previewFile);
      return atom.workspace.addOpener((function(_this) {
        return function(uriToOpen) {
          var path, protocol, ref;
          ref = uriToOpen.split('://'), protocol = ref[0], path = ref[1];
          if (protocol !== 'markdown-preview') {
            return;
          }
          try {
            path = decodeURI(path);
          } catch (error1) {
            return;
          }
          if (path.startsWith('editor/')) {
            return _this.createMarkdownPreviewView({
              editorId: path.substring(7)
            });
          } else {
            return _this.createMarkdownPreviewView({
              filePath: path
            });
          }
        };
      })(this));
    },
    createMarkdownPreviewView: function(state) {
      if (state.editorId || fs.isFileSync(state.filePath)) {
        if (MarkdownPreviewView == null) {
          MarkdownPreviewView = require('./markdown-preview-view');
        }
        return new MarkdownPreviewView(state);
      }
    },
    toggle: function() {
      var editor, grammars, ref, ref1;
      if (isMarkdownPreviewView(atom.workspace.getActivePaneItem())) {
        atom.workspace.destroyActivePaneItem();
        return;
      }
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      grammars = (ref = atom.config.get('markdown-preview.grammars')) != null ? ref : [];
      if (ref1 = editor.getGrammar().scopeName, indexOf.call(grammars, ref1) < 0) {
        return;
      }
      if (!this.removePreviewForEditor(editor)) {
        return this.addPreviewForEditor(editor);
      }
    },
    uriForEditor: function(editor) {
      return "markdown-preview://editor/" + editor.id;
    },
    removePreviewForEditor: function(editor) {
      var previewPane, uri;
      uri = this.uriForEditor(editor);
      previewPane = atom.workspace.paneForURI(uri);
      if (previewPane != null) {
        previewPane.destroyItem(previewPane.itemForURI(uri));
        return true;
      } else {
        return false;
      }
    },
    addPreviewForEditor: function(editor) {
      var options, previousActivePane, uri;
      uri = this.uriForEditor(editor);
      previousActivePane = atom.workspace.getActivePane();
      options = {
        searchAllPanes: true
      };
      if (atom.config.get('markdown-preview.openPreviewInSplitPane')) {
        options.split = 'right';
      }
      return atom.workspace.open(uri, options).then(function(markdownPreviewView) {
        if (isMarkdownPreviewView(markdownPreviewView)) {
          return previousActivePane.activate();
        }
      });
    },
    previewFile: function(arg) {
      var editor, filePath, i, len, ref, target;
      target = arg.target;
      filePath = target.dataset.path;
      if (!filePath) {
        return;
      }
      ref = atom.workspace.getTextEditors();
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        if (!(editor.getPath() === filePath)) {
          continue;
        }
        this.addPreviewForEditor(editor);
        return;
      }
      return atom.workspace.open("markdown-preview://" + (encodeURI(filePath)), {
        searchAllPanes: true
      });
    },
    copyHtml: function() {
      var editor, text;
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      if (renderer == null) {
        renderer = require('./renderer');
      }
      text = editor.getSelectedText() || editor.getText();
      return renderer.toHTML(text, editor.getPath(), editor.getGrammar(), function(error, html) {
        if (error) {
          return console.warn('Copying Markdown as HTML failed', error);
        } else {
          return atom.clipboard.write(html);
        }
      });
    },
    saveAsHtml: function() {
      var activePane, editor, grammars, markdownPreviewPane, previousActivePane, ref, ref1, uri;
      activePane = atom.workspace.getActivePaneItem();
      if (isMarkdownPreviewView(activePane)) {
        activePane.saveAs();
        return;
      }
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      grammars = (ref = atom.config.get('markdown-preview.grammars')) != null ? ref : [];
      if (ref1 = editor.getGrammar().scopeName, indexOf.call(grammars, ref1) < 0) {
        return;
      }
      uri = this.uriForEditor(editor);
      markdownPreviewPane = atom.workspace.paneForURI(uri);
      if (markdownPreviewPane == null) {
        return;
      }
      previousActivePane = atom.workspace.getActivePane();
      markdownPreviewPane.activate();
      activePane = atom.workspace.getActivePaneItem();
      if (isMarkdownPreviewView(activePane)) {
        return activePane.saveAs().then(function() {
          return previousActivePane.activate();
        });
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9tYXJrZG93bi1wcmV2aWV3L2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkRBQUE7SUFBQTs7RUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0VBQ04sRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUVMLG1CQUFBLEdBQXNCOztFQUN0QixRQUFBLEdBQVc7O0VBRVgscUJBQUEsR0FBd0IsU0FBQyxNQUFEOztNQUN0QixzQkFBdUIsT0FBQSxDQUFRLHlCQUFSOztXQUN2QixNQUFBLFlBQWtCO0VBRkk7O0VBSXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxJQUFHLFVBQUEsQ0FBVyxJQUFJLENBQUMsVUFBTCxDQUFBLENBQVgsQ0FBQSxHQUFnQyxHQUFuQztRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FDRTtVQUFBLElBQUEsRUFBTSxxQkFBTjtVQUNBLFdBQUEsRUFBYSxNQUFNLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLElBQXpDLENBQThDLE1BQU0sQ0FBQyxPQUFyRCxDQURiO1NBREYsRUFERjs7TUFLQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQ0U7UUFBQSx5QkFBQSxFQUEyQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUN6QixLQUFDLENBQUEsTUFBRCxDQUFBO1VBRHlCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEzQjtRQUVBLDRCQUFBLEVBQThCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQzVCLEtBQUMsQ0FBQSxRQUFELENBQUE7VUFENEI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRjlCO1FBSUEsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDL0IsS0FBQyxDQUFBLFVBQUQsQ0FBQTtVQUQrQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKakM7UUFNQSxpREFBQSxFQUFtRCxTQUFBO0FBQ2pELGNBQUE7VUFBQSxPQUFBLEdBQVU7aUJBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLE9BQWhCLEVBQXlCLENBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLE9BQWhCLENBQTdCO1FBRmlELENBTm5EO1FBU0Esc0NBQUEsRUFBd0MsU0FBQTtBQUN0QyxjQUFBO1VBQUEsT0FBQSxHQUFVO2lCQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixPQUFoQixFQUF5QixDQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixPQUFoQixDQUE3QjtRQUZzQyxDQVR4QztPQURGO01BY0EsV0FBQSxHQUFjLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixJQUFsQjtNQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnREFBbEIsRUFBb0UsK0JBQXBFLEVBQXFHLFdBQXJHO01BQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLDBDQUFsQixFQUE4RCwrQkFBOUQsRUFBK0YsV0FBL0Y7TUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsNkNBQWxCLEVBQWlFLCtCQUFqRSxFQUFrRyxXQUFsRztNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQiwyQ0FBbEIsRUFBK0QsK0JBQS9ELEVBQWdHLFdBQWhHO01BQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLDhDQUFsQixFQUFrRSwrQkFBbEUsRUFBbUcsV0FBbkc7TUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsMkNBQWxCLEVBQStELCtCQUEvRCxFQUFnRyxXQUFoRztNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQiwyQ0FBbEIsRUFBK0QsK0JBQS9ELEVBQWdHLFdBQWhHO2FBRUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxTQUFEO0FBQ3ZCLGNBQUE7VUFBQSxNQUFtQixTQUFTLENBQUMsS0FBVixDQUFnQixLQUFoQixDQUFuQixFQUFDLGlCQUFELEVBQVc7VUFDWCxJQUFjLFFBQUEsS0FBWSxrQkFBMUI7QUFBQSxtQkFBQTs7QUFFQTtZQUNFLElBQUEsR0FBTyxTQUFBLENBQVUsSUFBVixFQURUO1dBQUEsY0FBQTtBQUdFLG1CQUhGOztVQUtBLElBQUcsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsU0FBaEIsQ0FBSDttQkFDRSxLQUFDLENBQUEseUJBQUQsQ0FBMkI7Y0FBQSxRQUFBLEVBQVUsSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFmLENBQVY7YUFBM0IsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBQyxDQUFBLHlCQUFELENBQTJCO2NBQUEsUUFBQSxFQUFVLElBQVY7YUFBM0IsRUFIRjs7UUFUdUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCO0lBN0JRLENBQVY7SUEyQ0EseUJBQUEsRUFBMkIsU0FBQyxLQUFEO01BQ3pCLElBQUcsS0FBSyxDQUFDLFFBQU4sSUFBa0IsRUFBRSxDQUFDLFVBQUgsQ0FBYyxLQUFLLENBQUMsUUFBcEIsQ0FBckI7O1VBQ0Usc0JBQXVCLE9BQUEsQ0FBUSx5QkFBUjs7ZUFDbkIsSUFBQSxtQkFBQSxDQUFvQixLQUFwQixFQUZOOztJQUR5QixDQTNDM0I7SUFnREEsTUFBQSxFQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsSUFBRyxxQkFBQSxDQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFmLENBQUEsQ0FBdEIsQ0FBSDtRQUNFLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQWYsQ0FBQTtBQUNBLGVBRkY7O01BSUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtNQUNULElBQWMsY0FBZDtBQUFBLGVBQUE7O01BRUEsUUFBQSx3RUFBMEQ7TUFDMUQsV0FBYyxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsU0FBcEIsRUFBQSxhQUFpQyxRQUFqQyxFQUFBLElBQUEsS0FBZDtBQUFBLGVBQUE7O01BRUEsSUFBQSxDQUFvQyxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsTUFBeEIsQ0FBcEM7ZUFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsTUFBckIsRUFBQTs7SUFYTSxDQWhEUjtJQTZEQSxZQUFBLEVBQWMsU0FBQyxNQUFEO2FBQ1osNEJBQUEsR0FBNkIsTUFBTSxDQUFDO0lBRHhCLENBN0RkO0lBZ0VBLHNCQUFBLEVBQXdCLFNBQUMsTUFBRDtBQUN0QixVQUFBO01BQUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxZQUFELENBQWMsTUFBZDtNQUNOLFdBQUEsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQWYsQ0FBMEIsR0FBMUI7TUFDZCxJQUFHLG1CQUFIO1FBQ0UsV0FBVyxDQUFDLFdBQVosQ0FBd0IsV0FBVyxDQUFDLFVBQVosQ0FBdUIsR0FBdkIsQ0FBeEI7ZUFDQSxLQUZGO09BQUEsTUFBQTtlQUlFLE1BSkY7O0lBSHNCLENBaEV4QjtJQXlFQSxtQkFBQSxFQUFxQixTQUFDLE1BQUQ7QUFDbkIsVUFBQTtNQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQ7TUFDTixrQkFBQSxHQUFxQixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQTtNQUNyQixPQUFBLEdBQ0U7UUFBQSxjQUFBLEVBQWdCLElBQWhCOztNQUNGLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHlDQUFoQixDQUFIO1FBQ0UsT0FBTyxDQUFDLEtBQVIsR0FBZ0IsUUFEbEI7O2FBRUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLEdBQXBCLEVBQXlCLE9BQXpCLENBQWlDLENBQUMsSUFBbEMsQ0FBdUMsU0FBQyxtQkFBRDtRQUNyQyxJQUFHLHFCQUFBLENBQXNCLG1CQUF0QixDQUFIO2lCQUNFLGtCQUFrQixDQUFDLFFBQW5CLENBQUEsRUFERjs7TUFEcUMsQ0FBdkM7SUFQbUIsQ0F6RXJCO0lBb0ZBLFdBQUEsRUFBYSxTQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsU0FBRDtNQUNaLFFBQUEsR0FBVyxNQUFNLENBQUMsT0FBTyxDQUFDO01BQzFCLElBQUEsQ0FBYyxRQUFkO0FBQUEsZUFBQTs7QUFFQTtBQUFBLFdBQUEscUNBQUE7O2NBQW1ELE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBQSxLQUFvQjs7O1FBQ3JFLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixNQUFyQjtBQUNBO0FBRkY7YUFJQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IscUJBQUEsR0FBcUIsQ0FBQyxTQUFBLENBQVUsUUFBVixDQUFELENBQXpDLEVBQWlFO1FBQUEsY0FBQSxFQUFnQixJQUFoQjtPQUFqRTtJQVJXLENBcEZiO0lBOEZBLFFBQUEsRUFBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7TUFDVCxJQUFjLGNBQWQ7QUFBQSxlQUFBOzs7UUFFQSxXQUFZLE9BQUEsQ0FBUSxZQUFSOztNQUNaLElBQUEsR0FBTyxNQUFNLENBQUMsZUFBUCxDQUFBLENBQUEsSUFBNEIsTUFBTSxDQUFDLE9BQVAsQ0FBQTthQUNuQyxRQUFRLENBQUMsTUFBVCxDQUFnQixJQUFoQixFQUFzQixNQUFNLENBQUMsT0FBUCxDQUFBLENBQXRCLEVBQXdDLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBeEMsRUFBNkQsU0FBQyxLQUFELEVBQVEsSUFBUjtRQUMzRCxJQUFHLEtBQUg7aUJBQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxpQ0FBYixFQUFnRCxLQUFoRCxFQURGO1NBQUEsTUFBQTtpQkFHRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQWYsQ0FBcUIsSUFBckIsRUFIRjs7TUFEMkQsQ0FBN0Q7SUFOUSxDQTlGVjtJQTBHQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxVQUFBLEdBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBO01BQ2IsSUFBRyxxQkFBQSxDQUFzQixVQUF0QixDQUFIO1FBQ0UsVUFBVSxDQUFDLE1BQVgsQ0FBQTtBQUNBLGVBRkY7O01BSUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtNQUNULElBQWMsY0FBZDtBQUFBLGVBQUE7O01BRUEsUUFBQSx3RUFBMEQ7TUFDMUQsV0FBYyxNQUFNLENBQUMsVUFBUCxDQUFBLENBQW1CLENBQUMsU0FBcEIsRUFBQSxhQUFpQyxRQUFqQyxFQUFBLElBQUEsS0FBZDtBQUFBLGVBQUE7O01BRUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxZQUFELENBQWMsTUFBZDtNQUNOLG1CQUFBLEdBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBZixDQUEwQixHQUExQjtNQUN0QixJQUFjLDJCQUFkO0FBQUEsZUFBQTs7TUFFQSxrQkFBQSxHQUFxQixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQTtNQUNyQixtQkFBbUIsQ0FBQyxRQUFwQixDQUFBO01BQ0EsVUFBQSxHQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWYsQ0FBQTtNQUViLElBQUcscUJBQUEsQ0FBc0IsVUFBdEIsQ0FBSDtlQUNFLFVBQVUsQ0FBQyxNQUFYLENBQUEsQ0FBbUIsQ0FBQyxJQUFwQixDQUF5QixTQUFBO2lCQUN2QixrQkFBa0IsQ0FBQyxRQUFuQixDQUFBO1FBRHVCLENBQXpCLEVBREY7O0lBcEJVLENBMUdaOztBQVhGIiwic291cmNlc0NvbnRlbnQiOlsidXJsID0gcmVxdWlyZSAndXJsJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuXG5NYXJrZG93blByZXZpZXdWaWV3ID0gbnVsbFxucmVuZGVyZXIgPSBudWxsXG5cbmlzTWFya2Rvd25QcmV2aWV3VmlldyA9IChvYmplY3QpIC0+XG4gIE1hcmtkb3duUHJldmlld1ZpZXcgPz0gcmVxdWlyZSAnLi9tYXJrZG93bi1wcmV2aWV3LXZpZXcnXG4gIG9iamVjdCBpbnN0YW5jZW9mIE1hcmtkb3duUHJldmlld1ZpZXdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBpZiBwYXJzZUZsb2F0KGF0b20uZ2V0VmVyc2lvbigpKSA8IDEuN1xuICAgICAgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZFxuICAgICAgICBuYW1lOiAnTWFya2Rvd25QcmV2aWV3VmlldydcbiAgICAgICAgZGVzZXJpYWxpemU6IG1vZHVsZS5leHBvcnRzLmNyZWF0ZU1hcmtkb3duUHJldmlld1ZpZXcuYmluZChtb2R1bGUuZXhwb3J0cylcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnbWFya2Rvd24tcHJldmlldzp0b2dnbGUnOiA9PlxuICAgICAgICBAdG9nZ2xlKClcbiAgICAgICdtYXJrZG93bi1wcmV2aWV3OmNvcHktaHRtbCc6ID0+XG4gICAgICAgIEBjb3B5SHRtbCgpXG4gICAgICAnbWFya2Rvd24tcHJldmlldzpzYXZlLWFzLWh0bWwnOiA9PlxuICAgICAgICBAc2F2ZUFzSHRtbCgpXG4gICAgICAnbWFya2Rvd24tcHJldmlldzp0b2dnbGUtYnJlYWstb24tc2luZ2xlLW5ld2xpbmUnOiAtPlxuICAgICAgICBrZXlQYXRoID0gJ21hcmtkb3duLXByZXZpZXcuYnJlYWtPblNpbmdsZU5ld2xpbmUnXG4gICAgICAgIGF0b20uY29uZmlnLnNldChrZXlQYXRoLCBub3QgYXRvbS5jb25maWcuZ2V0KGtleVBhdGgpKVxuICAgICAgJ21hcmtkb3duLXByZXZpZXc6dG9nZ2xlLWdpdGh1Yi1zdHlsZSc6IC0+XG4gICAgICAgIGtleVBhdGggPSAnbWFya2Rvd24tcHJldmlldy51c2VHaXRIdWJTdHlsZSdcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KGtleVBhdGgsIG5vdCBhdG9tLmNvbmZpZy5nZXQoa2V5UGF0aCkpXG5cbiAgICBwcmV2aWV3RmlsZSA9IEBwcmV2aWV3RmlsZS5iaW5kKHRoaXMpXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmZpbGUgLm5hbWVbZGF0YS1uYW1lJD1cXFxcLm1hcmtkb3duXScsICdtYXJrZG93bi1wcmV2aWV3OnByZXZpZXctZmlsZScsIHByZXZpZXdGaWxlXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmZpbGUgLm5hbWVbZGF0YS1uYW1lJD1cXFxcLm1kXScsICdtYXJrZG93bi1wcmV2aWV3OnByZXZpZXctZmlsZScsIHByZXZpZXdGaWxlXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmZpbGUgLm5hbWVbZGF0YS1uYW1lJD1cXFxcLm1kb3duXScsICdtYXJrZG93bi1wcmV2aWV3OnByZXZpZXctZmlsZScsIHByZXZpZXdGaWxlXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmZpbGUgLm5hbWVbZGF0YS1uYW1lJD1cXFxcLm1rZF0nLCAnbWFya2Rvd24tcHJldmlldzpwcmV2aWV3LWZpbGUnLCBwcmV2aWV3RmlsZVxuICAgIGF0b20uY29tbWFuZHMuYWRkICcudHJlZS12aWV3IC5maWxlIC5uYW1lW2RhdGEtbmFtZSQ9XFxcXC5ta2Rvd25dJywgJ21hcmtkb3duLXByZXZpZXc6cHJldmlldy1maWxlJywgcHJldmlld0ZpbGVcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZmlsZSAubmFtZVtkYXRhLW5hbWUkPVxcXFwucm9uXScsICdtYXJrZG93bi1wcmV2aWV3OnByZXZpZXctZmlsZScsIHByZXZpZXdGaWxlXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy50cmVlLXZpZXcgLmZpbGUgLm5hbWVbZGF0YS1uYW1lJD1cXFxcLnR4dF0nLCAnbWFya2Rvd24tcHJldmlldzpwcmV2aWV3LWZpbGUnLCBwcmV2aWV3RmlsZVxuXG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyICh1cmlUb09wZW4pID0+XG4gICAgICBbcHJvdG9jb2wsIHBhdGhdID0gdXJpVG9PcGVuLnNwbGl0KCc6Ly8nKVxuICAgICAgcmV0dXJuIHVubGVzcyBwcm90b2NvbCBpcyAnbWFya2Rvd24tcHJldmlldydcblxuICAgICAgdHJ5XG4gICAgICAgIHBhdGggPSBkZWNvZGVVUkkocGF0aClcbiAgICAgIGNhdGNoXG4gICAgICAgIHJldHVyblxuXG4gICAgICBpZiBwYXRoLnN0YXJ0c1dpdGggJ2VkaXRvci8nXG4gICAgICAgIEBjcmVhdGVNYXJrZG93blByZXZpZXdWaWV3KGVkaXRvcklkOiBwYXRoLnN1YnN0cmluZyg3KSlcbiAgICAgIGVsc2VcbiAgICAgICAgQGNyZWF0ZU1hcmtkb3duUHJldmlld1ZpZXcoZmlsZVBhdGg6IHBhdGgpXG5cbiAgY3JlYXRlTWFya2Rvd25QcmV2aWV3VmlldzogKHN0YXRlKSAtPlxuICAgIGlmIHN0YXRlLmVkaXRvcklkIG9yIGZzLmlzRmlsZVN5bmMoc3RhdGUuZmlsZVBhdGgpXG4gICAgICBNYXJrZG93blByZXZpZXdWaWV3ID89IHJlcXVpcmUgJy4vbWFya2Rvd24tcHJldmlldy12aWV3J1xuICAgICAgbmV3IE1hcmtkb3duUHJldmlld1ZpZXcoc3RhdGUpXG5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIGlzTWFya2Rvd25QcmV2aWV3VmlldyhhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpKVxuICAgICAgYXRvbS53b3Jrc3BhY2UuZGVzdHJveUFjdGl2ZVBhbmVJdGVtKClcbiAgICAgIHJldHVyblxuXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgcmV0dXJuIHVubGVzcyBlZGl0b3I/XG5cbiAgICBncmFtbWFycyA9IGF0b20uY29uZmlnLmdldCgnbWFya2Rvd24tcHJldmlldy5ncmFtbWFycycpID8gW11cbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lIGluIGdyYW1tYXJzXG5cbiAgICBAYWRkUHJldmlld0ZvckVkaXRvcihlZGl0b3IpIHVubGVzcyBAcmVtb3ZlUHJldmlld0ZvckVkaXRvcihlZGl0b3IpXG5cbiAgdXJpRm9yRWRpdG9yOiAoZWRpdG9yKSAtPlxuICAgIFwibWFya2Rvd24tcHJldmlldzovL2VkaXRvci8je2VkaXRvci5pZH1cIlxuXG4gIHJlbW92ZVByZXZpZXdGb3JFZGl0b3I6IChlZGl0b3IpIC0+XG4gICAgdXJpID0gQHVyaUZvckVkaXRvcihlZGl0b3IpXG4gICAgcHJldmlld1BhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKHVyaSlcbiAgICBpZiBwcmV2aWV3UGFuZT9cbiAgICAgIHByZXZpZXdQYW5lLmRlc3Ryb3lJdGVtKHByZXZpZXdQYW5lLml0ZW1Gb3JVUkkodXJpKSlcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGFkZFByZXZpZXdGb3JFZGl0b3I6IChlZGl0b3IpIC0+XG4gICAgdXJpID0gQHVyaUZvckVkaXRvcihlZGl0b3IpXG4gICAgcHJldmlvdXNBY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgb3B0aW9ucyA9XG4gICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnbWFya2Rvd24tcHJldmlldy5vcGVuUHJldmlld0luU3BsaXRQYW5lJylcbiAgICAgIG9wdGlvbnMuc3BsaXQgPSAncmlnaHQnXG4gICAgYXRvbS53b3Jrc3BhY2Uub3Blbih1cmksIG9wdGlvbnMpLnRoZW4gKG1hcmtkb3duUHJldmlld1ZpZXcpIC0+XG4gICAgICBpZiBpc01hcmtkb3duUHJldmlld1ZpZXcobWFya2Rvd25QcmV2aWV3VmlldylcbiAgICAgICAgcHJldmlvdXNBY3RpdmVQYW5lLmFjdGl2YXRlKClcblxuICBwcmV2aWV3RmlsZTogKHt0YXJnZXR9KSAtPlxuICAgIGZpbGVQYXRoID0gdGFyZ2V0LmRhdGFzZXQucGF0aFxuICAgIHJldHVybiB1bmxlc3MgZmlsZVBhdGhcblxuICAgIGZvciBlZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKSB3aGVuIGVkaXRvci5nZXRQYXRoKCkgaXMgZmlsZVBhdGhcbiAgICAgIEBhZGRQcmV2aWV3Rm9yRWRpdG9yKGVkaXRvcilcbiAgICAgIHJldHVyblxuXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbiBcIm1hcmtkb3duLXByZXZpZXc6Ly8je2VuY29kZVVSSShmaWxlUGF0aCl9XCIsIHNlYXJjaEFsbFBhbmVzOiB0cnVlXG5cbiAgY29weUh0bWw6IC0+XG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgcmV0dXJuIHVubGVzcyBlZGl0b3I/XG5cbiAgICByZW5kZXJlciA/PSByZXF1aXJlICcuL3JlbmRlcmVyJ1xuICAgIHRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkgb3IgZWRpdG9yLmdldFRleHQoKVxuICAgIHJlbmRlcmVyLnRvSFRNTCB0ZXh0LCBlZGl0b3IuZ2V0UGF0aCgpLCBlZGl0b3IuZ2V0R3JhbW1hcigpLCAoZXJyb3IsIGh0bWwpIC0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBjb25zb2xlLndhcm4oJ0NvcHlpbmcgTWFya2Rvd24gYXMgSFRNTCBmYWlsZWQnLCBlcnJvcilcbiAgICAgIGVsc2VcbiAgICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoaHRtbClcblxuICBzYXZlQXNIdG1sOiAtPlxuICAgIGFjdGl2ZVBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgaWYgaXNNYXJrZG93blByZXZpZXdWaWV3KGFjdGl2ZVBhbmUpXG4gICAgICBhY3RpdmVQYW5lLnNhdmVBcygpXG4gICAgICByZXR1cm5cblxuICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yP1xuXG4gICAgZ3JhbW1hcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ21hcmtkb3duLXByZXZpZXcuZ3JhbW1hcnMnKSA/IFtdXG4gICAgcmV0dXJuIHVubGVzcyBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSBpbiBncmFtbWFyc1xuXG4gICAgdXJpID0gQHVyaUZvckVkaXRvcihlZGl0b3IpXG4gICAgbWFya2Rvd25QcmV2aWV3UGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JVUkkodXJpKVxuICAgIHJldHVybiB1bmxlc3MgbWFya2Rvd25QcmV2aWV3UGFuZT9cblxuICAgIHByZXZpb3VzQWN0aXZlUGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIG1hcmtkb3duUHJldmlld1BhbmUuYWN0aXZhdGUoKVxuICAgIGFjdGl2ZVBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG5cbiAgICBpZiBpc01hcmtkb3duUHJldmlld1ZpZXcoYWN0aXZlUGFuZSlcbiAgICAgIGFjdGl2ZVBhbmUuc2F2ZUFzKCkudGhlbiAtPlxuICAgICAgICBwcmV2aW91c0FjdGl2ZVBhbmUuYWN0aXZhdGUoKVxuIl19
