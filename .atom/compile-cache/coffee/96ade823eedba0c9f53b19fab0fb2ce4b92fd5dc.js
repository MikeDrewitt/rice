(function() {
  var $, $$$, CompositeDisposable, Disposable, Emitter, File, MarkdownPreviewView, ScrollView, _, fs, path, ref, ref1, renderer,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable, File = ref.File;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, $$$ = ref1.$$$, ScrollView = ref1.ScrollView;

  _ = require('underscore-plus');

  fs = require('fs-plus');

  renderer = require('./renderer');

  module.exports = MarkdownPreviewView = (function(superClass) {
    extend(MarkdownPreviewView, superClass);

    MarkdownPreviewView.content = function() {
      return this.div({
        "class": 'markdown-preview native-key-bindings',
        tabindex: -1
      });
    };

    function MarkdownPreviewView(arg) {
      this.editorId = arg.editorId, this.filePath = arg.filePath;
      MarkdownPreviewView.__super__.constructor.apply(this, arguments);
      this.emitter = new Emitter;
      this.disposables = new CompositeDisposable;
      this.loaded = false;
    }

    MarkdownPreviewView.prototype.attached = function() {
      if (this.isAttached) {
        return;
      }
      this.isAttached = true;
      if (this.editorId != null) {
        return this.resolveEditor(this.editorId);
      } else if (atom.workspace != null) {
        return this.subscribeToFilePath(this.filePath);
      } else {
        return this.disposables.add(atom.packages.onDidActivateInitialPackages((function(_this) {
          return function() {
            return _this.subscribeToFilePath(_this.filePath);
          };
        })(this)));
      }
    };

    MarkdownPreviewView.prototype.serialize = function() {
      var ref2;
      return {
        deserializer: 'MarkdownPreviewView',
        filePath: (ref2 = this.getPath()) != null ? ref2 : this.filePath,
        editorId: this.editorId
      };
    };

    MarkdownPreviewView.prototype.destroy = function() {
      return this.disposables.dispose();
    };

    MarkdownPreviewView.prototype.onDidChangeTitle = function(callback) {
      return this.emitter.on('did-change-title', callback);
    };

    MarkdownPreviewView.prototype.onDidChangeModified = function(callback) {
      return new Disposable;
    };

    MarkdownPreviewView.prototype.onDidChangeMarkdown = function(callback) {
      return this.emitter.on('did-change-markdown', callback);
    };

    MarkdownPreviewView.prototype.subscribeToFilePath = function(filePath) {
      this.file = new File(filePath);
      this.emitter.emit('did-change-title');
      this.disposables.add(this.file.onDidRename((function(_this) {
        return function() {
          return _this.emitter.emit('did-change-title');
        };
      })(this)));
      this.handleEvents();
      return this.renderMarkdown();
    };

    MarkdownPreviewView.prototype.resolveEditor = function(editorId) {
      var resolve;
      resolve = (function(_this) {
        return function() {
          _this.editor = _this.editorForId(editorId);
          if (_this.editor != null) {
            _this.emitter.emit('did-change-title');
            _this.disposables.add(_this.editor.onDidDestroy(function() {
              return _this.subscribeToFilePath(_this.getPath());
            }));
            _this.handleEvents();
            return _this.renderMarkdown();
          } else {
            return _this.subscribeToFilePath(_this.filePath);
          }
        };
      })(this);
      if (atom.workspace != null) {
        return resolve();
      } else {
        return this.disposables.add(atom.packages.onDidActivateInitialPackages(resolve));
      }
    };

    MarkdownPreviewView.prototype.editorForId = function(editorId) {
      var editor, i, len, ref2, ref3;
      ref2 = atom.workspace.getTextEditors();
      for (i = 0, len = ref2.length; i < len; i++) {
        editor = ref2[i];
        if (((ref3 = editor.id) != null ? ref3.toString() : void 0) === editorId.toString()) {
          return editor;
        }
      }
      return null;
    };

    MarkdownPreviewView.prototype.handleEvents = function() {
      var changeHandler;
      this.disposables.add(atom.grammars.onDidAddGrammar((function(_this) {
        return function() {
          return _.debounce((function() {
            return _this.renderMarkdown();
          }), 250);
        };
      })(this)));
      this.disposables.add(atom.grammars.onDidUpdateGrammar(_.debounce(((function(_this) {
        return function() {
          return _this.renderMarkdown();
        };
      })(this)), 250)));
      atom.commands.add(this.element, {
        'core:move-up': (function(_this) {
          return function() {
            return _this.scrollUp();
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.scrollDown();
          };
        })(this),
        'core:save-as': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.saveAs();
          };
        })(this),
        'core:copy': (function(_this) {
          return function(event) {
            if (_this.copyToClipboard()) {
              return event.stopPropagation();
            }
          };
        })(this),
        'markdown-preview:zoom-in': (function(_this) {
          return function() {
            var zoomLevel;
            zoomLevel = parseFloat(_this.css('zoom')) || 1;
            return _this.css('zoom', zoomLevel + .1);
          };
        })(this),
        'markdown-preview:zoom-out': (function(_this) {
          return function() {
            var zoomLevel;
            zoomLevel = parseFloat(_this.css('zoom')) || 1;
            return _this.css('zoom', zoomLevel - .1);
          };
        })(this),
        'markdown-preview:reset-zoom': (function(_this) {
          return function() {
            return _this.css('zoom', 1);
          };
        })(this)
      });
      changeHandler = (function(_this) {
        return function() {
          var pane;
          _this.renderMarkdown();
          pane = atom.workspace.paneForItem(_this);
          if ((pane != null) && pane !== atom.workspace.getActivePane()) {
            return pane.activateItem(_this);
          }
        };
      })(this);
      if (this.file != null) {
        this.disposables.add(this.file.onDidChange(changeHandler));
      } else if (this.editor != null) {
        this.disposables.add(this.editor.getBuffer().onDidStopChanging(function() {
          if (atom.config.get('markdown-preview.liveUpdate')) {
            return changeHandler();
          }
        }));
        this.disposables.add(this.editor.onDidChangePath((function(_this) {
          return function() {
            return _this.emitter.emit('did-change-title');
          };
        })(this)));
        this.disposables.add(this.editor.getBuffer().onDidSave(function() {
          if (!atom.config.get('markdown-preview.liveUpdate')) {
            return changeHandler();
          }
        }));
        this.disposables.add(this.editor.getBuffer().onDidReload(function() {
          if (!atom.config.get('markdown-preview.liveUpdate')) {
            return changeHandler();
          }
        }));
      }
      this.disposables.add(atom.config.onDidChange('markdown-preview.breakOnSingleNewline', changeHandler));
      return this.disposables.add(atom.config.observe('markdown-preview.useGitHubStyle', (function(_this) {
        return function(useGitHubStyle) {
          if (useGitHubStyle) {
            return _this.element.setAttribute('data-use-github-style', '');
          } else {
            return _this.element.removeAttribute('data-use-github-style');
          }
        };
      })(this)));
    };

    MarkdownPreviewView.prototype.renderMarkdown = function() {
      if (!this.loaded) {
        this.showLoading();
      }
      return this.getMarkdownSource().then((function(_this) {
        return function(source) {
          if (source != null) {
            return _this.renderMarkdownText(source);
          }
        };
      })(this))["catch"]((function(_this) {
        return function(reason) {
          return _this.showError({
            message: reason
          });
        };
      })(this));
    };

    MarkdownPreviewView.prototype.getMarkdownSource = function() {
      var ref2;
      if ((ref2 = this.file) != null ? ref2.getPath() : void 0) {
        return this.file.read().then((function(_this) {
          return function(source) {
            if (source === null) {
              return Promise.reject((_this.file.getBaseName()) + " could not be found");
            } else {
              return Promise.resolve(source);
            }
          };
        })(this))["catch"](function(reason) {
          return Promise.reject(reason);
        });
      } else if (this.editor != null) {
        return Promise.resolve(this.editor.getText());
      } else {
        return Promise.reject();
      }
    };

    MarkdownPreviewView.prototype.getHTML = function(callback) {
      return this.getMarkdownSource().then((function(_this) {
        return function(source) {
          if (source == null) {
            return;
          }
          return renderer.toHTML(source, _this.getPath(), _this.getGrammar(), callback);
        };
      })(this));
    };

    MarkdownPreviewView.prototype.renderMarkdownText = function(text) {
      return renderer.toDOMFragment(text, this.getPath(), this.getGrammar(), (function(_this) {
        return function(error, domFragment) {
          if (error) {
            return _this.showError(error);
          } else {
            _this.loading = false;
            _this.loaded = true;
            _this.html(domFragment);
            _this.emitter.emit('did-change-markdown');
            return _this.originalTrigger('markdown-preview:markdown-changed');
          }
        };
      })(this));
    };

    MarkdownPreviewView.prototype.getTitle = function() {
      if ((this.file != null) && (this.getPath() != null)) {
        return (path.basename(this.getPath())) + " Preview";
      } else if (this.editor != null) {
        return (this.editor.getTitle()) + " Preview";
      } else {
        return "Markdown Preview";
      }
    };

    MarkdownPreviewView.prototype.getIconName = function() {
      return "markdown";
    };

    MarkdownPreviewView.prototype.getURI = function() {
      if (this.file != null) {
        return "markdown-preview://" + (this.getPath());
      } else {
        return "markdown-preview://editor/" + this.editorId;
      }
    };

    MarkdownPreviewView.prototype.getPath = function() {
      if (this.file != null) {
        return this.file.getPath();
      } else if (this.editor != null) {
        return this.editor.getPath();
      }
    };

    MarkdownPreviewView.prototype.getGrammar = function() {
      var ref2;
      return (ref2 = this.editor) != null ? ref2.getGrammar() : void 0;
    };

    MarkdownPreviewView.prototype.getDocumentStyleSheets = function() {
      return document.styleSheets;
    };

    MarkdownPreviewView.prototype.getTextEditorStyles = function() {
      var textEditorStyles;
      textEditorStyles = document.createElement("atom-styles");
      textEditorStyles.initialize(atom.styles);
      textEditorStyles.setAttribute("context", "atom-text-editor");
      document.body.appendChild(textEditorStyles);
      return Array.prototype.slice.apply(textEditorStyles.childNodes).map(function(styleElement) {
        return styleElement.innerText;
      });
    };

    MarkdownPreviewView.prototype.getMarkdownPreviewCSS = function() {
      var cssUrlRefExp, i, j, len, len1, markdownPreviewRules, ref2, ref3, ref4, rule, ruleRegExp, stylesheet;
      markdownPreviewRules = [];
      ruleRegExp = /\.markdown-preview/;
      cssUrlRefExp = /url\(atom:\/\/markdown-preview\/assets\/(.*)\)/;
      ref2 = this.getDocumentStyleSheets();
      for (i = 0, len = ref2.length; i < len; i++) {
        stylesheet = ref2[i];
        if (stylesheet.rules != null) {
          ref3 = stylesheet.rules;
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            rule = ref3[j];
            if (((ref4 = rule.selectorText) != null ? ref4.match(ruleRegExp) : void 0) != null) {
              markdownPreviewRules.push(rule.cssText);
            }
          }
        }
      }
      return markdownPreviewRules.concat(this.getTextEditorStyles()).join('\n').replace(/atom-text-editor/g, 'pre.editor-colors').replace(/:host/g, '.host').replace(cssUrlRefExp, function(match, assetsName, offset, string) {
        var assetPath, base64Data, originalData;
        assetPath = path.join(__dirname, '../assets', assetsName);
        originalData = fs.readFileSync(assetPath, 'binary');
        base64Data = new Buffer(originalData, 'binary').toString('base64');
        return "url('data:image/jpeg;base64," + base64Data + "')";
      });
    };

    MarkdownPreviewView.prototype.showError = function(result) {
      var failureMessage;
      failureMessage = result != null ? result.message : void 0;
      return this.html($$$(function() {
        this.h2('Previewing Markdown Failed');
        if (failureMessage != null) {
          return this.h3(failureMessage);
        }
      }));
    };

    MarkdownPreviewView.prototype.showLoading = function() {
      this.loading = true;
      return this.html($$$(function() {
        return this.div({
          "class": 'markdown-spinner'
        }, 'Loading Markdown\u2026');
      }));
    };

    MarkdownPreviewView.prototype.copyToClipboard = function() {
      var selectedNode, selectedText, selection;
      if (this.loading) {
        return false;
      }
      selection = window.getSelection();
      selectedText = selection.toString();
      selectedNode = selection.baseNode;
      if (selectedText && (selectedNode != null) && (this[0] === selectedNode || $.contains(this[0], selectedNode))) {
        return false;
      }
      this.getHTML(function(error, html) {
        if (error != null) {
          return console.warn('Copying Markdown as HTML failed', error);
        } else {
          return atom.clipboard.write(html);
        }
      });
      return true;
    };

    MarkdownPreviewView.prototype.saveAs = function() {
      var filePath, htmlFilePath, projectPath, title;
      if (this.loading) {
        return;
      }
      filePath = this.getPath();
      title = 'Markdown to HTML';
      if (filePath) {
        title = path.parse(filePath).name;
        filePath += '.html';
      } else {
        filePath = 'untitled.md.html';
        if (projectPath = atom.project.getPaths()[0]) {
          filePath = path.join(projectPath, filePath);
        }
      }
      if (htmlFilePath = atom.showSaveDialogSync(filePath)) {
        return this.getHTML((function(_this) {
          return function(error, htmlBody) {
            var html;
            if (error != null) {
              return console.warn('Saving Markdown as HTML failed', error);
            } else {
              html = ("<!DOCTYPE html>\n<html>\n  <head>\n      <meta charset=\"utf-8\" />\n      <title>" + title + "</title>\n      <style>" + (_this.getMarkdownPreviewCSS()) + "</style>\n  </head>\n  <body class='markdown-preview' data-use-github-style>" + htmlBody + "</body>\n</html>") + "\n";
              fs.writeFileSync(htmlFilePath, html);
              return atom.workspace.open(htmlFilePath);
            }
          };
        })(this));
      }
    };

    MarkdownPreviewView.prototype.isEqual = function(other) {
      return this[0] === (other != null ? other[0] : void 0);
    };

    return MarkdownPreviewView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9tYXJrZG93bi1wcmV2aWV3L2xpYi9tYXJrZG93bi1wcmV2aWV3LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5SEFBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBbUQsT0FBQSxDQUFRLE1BQVIsQ0FBbkQsRUFBQyxxQkFBRCxFQUFVLDJCQUFWLEVBQXNCLDZDQUF0QixFQUEyQzs7RUFDM0MsT0FBdUIsT0FBQSxDQUFRLHNCQUFSLENBQXZCLEVBQUMsVUFBRCxFQUFJLGNBQUosRUFBUzs7RUFDVCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFFTCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ0osbUJBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHNDQUFQO1FBQStDLFFBQUEsRUFBVSxDQUFDLENBQTFEO09BQUw7SUFEUTs7SUFHRyw2QkFBQyxHQUFEO01BQUUsSUFBQyxDQUFBLGVBQUEsVUFBVSxJQUFDLENBQUEsZUFBQTtNQUN6QixzREFBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFKQzs7a0NBTWIsUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFVLElBQUMsQ0FBQSxVQUFYO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO01BRWQsSUFBRyxxQkFB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UyxDQUFDLEtBQUMsQ0FBQSxxQkFBRCxDQUFBLENBQUQsQ0FOVCxHQU1tQyw4RUFObkMsR0FRb0QsUUFScEQsR0FRNkQsa0JBUjdELENBQUEsR0FTUTtjQUVmLEVBQUUsQ0FBQyxhQUFILENBQWlCLFlBQWpCLEVBQStCLElBQS9CO3FCQUNBLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixZQUFwQixFQWhCRjs7VUFETztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBVCxFQUZGOztJQWJNOztrQ0FrQ1IsT0FBQSxHQUFTLFNBQUMsS0FBRDthQUNQLElBQUUsQ0FBQSxDQUFBLENBQUYsc0JBQVEsS0FBTyxDQUFBLENBQUE7SUFEUjs7OztLQXZSdUI7QUFWbEMiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcblxue0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIEZpbGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskLCAkJCQsIFNjcm9sbFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuXG5yZW5kZXJlciA9IHJlcXVpcmUgJy4vcmVuZGVyZXInXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE1hcmtkb3duUHJldmlld1ZpZXcgZXh0ZW5kcyBTY3JvbGxWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdtYXJrZG93bi1wcmV2aWV3IG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTFcblxuICBjb25zdHJ1Y3RvcjogKHtAZWRpdG9ySWQsIEBmaWxlUGF0aH0pIC0+XG4gICAgc3VwZXJcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAbG9hZGVkID0gZmFsc2VcblxuICBhdHRhY2hlZDogLT5cbiAgICByZXR1cm4gaWYgQGlzQXR0YWNoZWRcbiAgICBAaXNBdHRhY2hlZCA9IHRydWVcblxuICAgIGlmIEBlZGl0b3JJZD9cbiAgICAgIEByZXNvbHZlRWRpdG9yKEBlZGl0b3JJZClcbiAgICBlbHNlIGlmIGF0b20ud29ya3NwYWNlP1xuICAgICAgQHN1YnNjcmliZVRvRmlsZVBhdGgoQGZpbGVQYXRoKVxuICAgIGVsc2VcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5wYWNrYWdlcy5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzID0+XG4gICAgICAgIEBzdWJzY3JpYmVUb0ZpbGVQYXRoKEBmaWxlUGF0aClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgZGVzZXJpYWxpemVyOiAnTWFya2Rvd25QcmV2aWV3VmlldydcbiAgICBmaWxlUGF0aDogQGdldFBhdGgoKSA/IEBmaWxlUGF0aFxuICAgIGVkaXRvcklkOiBAZWRpdG9ySWRcblxuICBkZXN0cm95OiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBvbkRpZENoYW5nZVRpdGxlOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtdGl0bGUnLCBjYWxsYmFja1xuXG4gIG9uRGlkQ2hhbmdlTW9kaWZpZWQ6IChjYWxsYmFjaykgLT5cbiAgICAjIE5vIG9wIHRvIHN1cHByZXNzIGRlcHJlY2F0aW9uIHdhcm5pbmdcbiAgICBuZXcgRGlzcG9zYWJsZVxuXG4gIG9uRGlkQ2hhbmdlTWFya2Rvd246IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1tYXJrZG93bicsIGNhbGxiYWNrXG5cbiAgc3Vic2NyaWJlVG9GaWxlUGF0aDogKGZpbGVQYXRoKSAtPlxuICAgIEBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS10aXRsZSdcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBmaWxlLm9uRGlkUmVuYW1lKD0+IEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdGl0bGUnKVxuICAgIEBoYW5kbGVFdmVudHMoKVxuICAgIEByZW5kZXJNYXJrZG93bigpXG5cbiAgcmVzb2x2ZUVkaXRvcjogKGVkaXRvcklkKSAtPlxuICAgIHJlc29sdmUgPSA9PlxuICAgICAgQGVkaXRvciA9IEBlZGl0b3JGb3JJZChlZGl0b3JJZClcblxuICAgICAgaWYgQGVkaXRvcj9cbiAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWNoYW5nZS10aXRsZSdcbiAgICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLm9uRGlkRGVzdHJveSg9PiBAc3Vic2NyaWJlVG9GaWxlUGF0aChAZ2V0UGF0aCgpKSlcbiAgICAgICAgQGhhbmRsZUV2ZW50cygpXG4gICAgICAgIEByZW5kZXJNYXJrZG93bigpXG4gICAgICBlbHNlXG4gICAgICAgIEBzdWJzY3JpYmVUb0ZpbGVQYXRoKEBmaWxlUGF0aClcblxuICAgIGlmIGF0b20ud29ya3NwYWNlP1xuICAgICAgcmVzb2x2ZSgpXG4gICAgZWxzZVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXMocmVzb2x2ZSlcblxuICBlZGl0b3JGb3JJZDogKGVkaXRvcklkKSAtPlxuICAgIGZvciBlZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuICAgICAgcmV0dXJuIGVkaXRvciBpZiBlZGl0b3IuaWQ/LnRvU3RyaW5nKCkgaXMgZWRpdG9ySWQudG9TdHJpbmcoKVxuICAgIG51bGxcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hciA9PiBfLmRlYm91bmNlKCg9PiBAcmVuZGVyTWFya2Rvd24oKSksIDI1MClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uZ3JhbW1hcnMub25EaWRVcGRhdGVHcmFtbWFyIF8uZGVib3VuY2UoKD0+IEByZW5kZXJNYXJrZG93bigpKSwgMjUwKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsXG4gICAgICAnY29yZTptb3ZlLXVwJzogPT5cbiAgICAgICAgQHNjcm9sbFVwKClcbiAgICAgICdjb3JlOm1vdmUtZG93bic6ID0+XG4gICAgICAgIEBzY3JvbGxEb3duKClcbiAgICAgICdjb3JlOnNhdmUtYXMnOiAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIEBzYXZlQXMoKVxuICAgICAgJ2NvcmU6Y29weSc6IChldmVudCkgPT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkgaWYgQGNvcHlUb0NsaXBib2FyZCgpXG4gICAgICAnbWFya2Rvd24tcHJldmlldzp6b29tLWluJzogPT5cbiAgICAgICAgem9vbUxldmVsID0gcGFyc2VGbG9hdChAY3NzKCd6b29tJykpIG9yIDFcbiAgICAgICAgQGNzcygnem9vbScsIHpvb21MZXZlbCArIC4xKVxuICAgICAgJ21hcmtkb3duLXByZXZpZXc6em9vbS1vdXQnOiA9PlxuICAgICAgICB6b29tTGV2ZWwgPSBwYXJzZUZsb2F0KEBjc3MoJ3pvb20nKSkgb3IgMVxuICAgICAgICBAY3NzKCd6b29tJywgem9vbUxldmVsIC0gLjEpXG4gICAgICAnbWFya2Rvd24tcHJldmlldzpyZXNldC16b29tJzogPT5cbiAgICAgICAgQGNzcygnem9vbScsIDEpXG5cbiAgICBjaGFuZ2VIYW5kbGVyID0gPT5cbiAgICAgIEByZW5kZXJNYXJrZG93bigpXG5cbiAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9ySXRlbSh0aGlzKVxuICAgICAgaWYgcGFuZT8gYW5kIHBhbmUgaXNudCBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW0odGhpcylcblxuICAgIGlmIEBmaWxlP1xuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBAZmlsZS5vbkRpZENoYW5nZShjaGFuZ2VIYW5kbGVyKVxuICAgIGVsc2UgaWYgQGVkaXRvcj9cbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgQGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZyAtPlxuICAgICAgICBjaGFuZ2VIYW5kbGVyKCkgaWYgYXRvbS5jb25maWcuZ2V0ICdtYXJrZG93bi1wcmV2aWV3LmxpdmVVcGRhdGUnXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VQYXRoID0+IEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdGl0bGUnXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlIC0+XG4gICAgICAgIGNoYW5nZUhhbmRsZXIoKSB1bmxlc3MgYXRvbS5jb25maWcuZ2V0ICdtYXJrZG93bi1wcmV2aWV3LmxpdmVVcGRhdGUnXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRSZWxvYWQgLT5cbiAgICAgICAgY2hhbmdlSGFuZGxlcigpIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQgJ21hcmtkb3duLXByZXZpZXcubGl2ZVVwZGF0ZSdcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ21hcmtkb3duLXByZXZpZXcuYnJlYWtPblNpbmdsZU5ld2xpbmUnLCBjaGFuZ2VIYW5kbGVyXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9ic2VydmUgJ21hcmtkb3duLXByZXZpZXcudXNlR2l0SHViU3R5bGUnLCAodXNlR2l0SHViU3R5bGUpID0+XG4gICAgICBpZiB1c2VHaXRIdWJTdHlsZVxuICAgICAgICBAZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlLWdpdGh1Yi1zdHlsZScsICcnKVxuICAgICAgZWxzZVxuICAgICAgICBAZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtdXNlLWdpdGh1Yi1zdHlsZScpXG5cbiAgcmVuZGVyTWFya2Rvd246IC0+XG4gICAgQHNob3dMb2FkaW5nKCkgdW5sZXNzIEBsb2FkZWRcbiAgICBAZ2V0TWFya2Rvd25Tb3VyY2UoKVxuICAgIC50aGVuIChzb3VyY2UpID0+IEByZW5kZXJNYXJrZG93blRleHQoc291cmNlKSBpZiBzb3VyY2U/XG4gICAgLmNhdGNoIChyZWFzb24pID0+IEBzaG93RXJyb3Ioe21lc3NhZ2U6IHJlYXNvbn0pXG5cbiAgZ2V0TWFya2Rvd25Tb3VyY2U6IC0+XG4gICAgaWYgQGZpbGU/LmdldFBhdGgoKVxuICAgICAgQGZpbGUucmVhZCgpLnRoZW4gKHNvdXJjZSkgPT5cbiAgICAgICAgaWYgc291cmNlIGlzIG51bGxcbiAgICAgICAgICBQcm9taXNlLnJlamVjdChcIiN7QGZpbGUuZ2V0QmFzZU5hbWUoKX0gY291bGQgbm90IGJlIGZvdW5kXCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBQcm9taXNlLnJlc29sdmUoc291cmNlKVxuICAgICAgLmNhdGNoIChyZWFzb24pIC0+IFByb21pc2UucmVqZWN0KHJlYXNvbilcbiAgICBlbHNlIGlmIEBlZGl0b3I/XG4gICAgICBQcm9taXNlLnJlc29sdmUoQGVkaXRvci5nZXRUZXh0KCkpXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZWplY3QoKVxuXG4gIGdldEhUTUw6IChjYWxsYmFjaykgLT5cbiAgICBAZ2V0TWFya2Rvd25Tb3VyY2UoKS50aGVuIChzb3VyY2UpID0+XG4gICAgICByZXR1cm4gdW5sZXNzIHNvdXJjZT9cblxuICAgICAgcmVuZGVyZXIudG9IVE1MIHNvdXJjZSwgQGdldFBhdGgoKSwgQGdldEdyYW1tYXIoKSwgY2FsbGJhY2tcblxuICByZW5kZXJNYXJrZG93blRleHQ6ICh0ZXh0KSAtPlxuICAgIHJlbmRlcmVyLnRvRE9NRnJhZ21lbnQgdGV4dCwgQGdldFBhdGgoKSwgQGdldEdyYW1tYXIoKSwgKGVycm9yLCBkb21GcmFnbWVudCkgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIEBzaG93RXJyb3IoZXJyb3IpXG4gICAgICBlbHNlXG4gICAgICAgIEBsb2FkaW5nID0gZmFsc2VcbiAgICAgICAgQGxvYWRlZCA9IHRydWVcbiAgICAgICAgQGh0bWwoZG9tRnJhZ21lbnQpXG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtbWFya2Rvd24nXG4gICAgICAgIEBvcmlnaW5hbFRyaWdnZXIoJ21hcmtkb3duLXByZXZpZXc6bWFya2Rvd24tY2hhbmdlZCcpXG5cbiAgZ2V0VGl0bGU6IC0+XG4gICAgaWYgQGZpbGU/IGFuZCBAZ2V0UGF0aCgpP1xuICAgICAgXCIje3BhdGguYmFzZW5hbWUoQGdldFBhdGgoKSl9IFByZXZpZXdcIlxuICAgIGVsc2UgaWYgQGVkaXRvcj9cbiAgICAgIFwiI3tAZWRpdG9yLmdldFRpdGxlKCl9IFByZXZpZXdcIlxuICAgIGVsc2VcbiAgICAgIFwiTWFya2Rvd24gUHJldmlld1wiXG5cbiAgZ2V0SWNvbk5hbWU6IC0+XG4gICAgXCJtYXJrZG93blwiXG5cbiAgZ2V0VVJJOiAtPlxuICAgIGlmIEBmaWxlP1xuICAgICAgXCJtYXJrZG93bi1wcmV2aWV3Oi8vI3tAZ2V0UGF0aCgpfVwiXG4gICAgZWxzZVxuICAgICAgXCJtYXJrZG93bi1wcmV2aWV3Oi8vZWRpdG9yLyN7QGVkaXRvcklkfVwiXG5cbiAgZ2V0UGF0aDogLT5cbiAgICBpZiBAZmlsZT9cbiAgICAgIEBmaWxlLmdldFBhdGgoKVxuICAgIGVsc2UgaWYgQGVkaXRvcj9cbiAgICAgIEBlZGl0b3IuZ2V0UGF0aCgpXG5cbiAgZ2V0R3JhbW1hcjogLT5cbiAgICBAZWRpdG9yPy5nZXRHcmFtbWFyKClcblxuICBnZXREb2N1bWVudFN0eWxlU2hlZXRzOiAtPiAjIFRoaXMgZnVuY3Rpb24gZXhpc3RzIHNvIHdlIGNhbiBzdHViIGl0XG4gICAgZG9jdW1lbnQuc3R5bGVTaGVldHNcblxuICBnZXRUZXh0RWRpdG9yU3R5bGVzOiAtPlxuICAgIHRleHRFZGl0b3JTdHlsZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXRvbS1zdHlsZXNcIilcbiAgICB0ZXh0RWRpdG9yU3R5bGVzLmluaXRpYWxpemUoYXRvbS5zdHlsZXMpXG4gICAgdGV4dEVkaXRvclN0eWxlcy5zZXRBdHRyaWJ1dGUgXCJjb250ZXh0XCIsIFwiYXRvbS10ZXh0LWVkaXRvclwiXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCB0ZXh0RWRpdG9yU3R5bGVzXG5cbiAgICAjIEV4dHJhY3Qgc3R5bGUgZWxlbWVudHMgY29udGVudFxuICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseSh0ZXh0RWRpdG9yU3R5bGVzLmNoaWxkTm9kZXMpLm1hcCAoc3R5bGVFbGVtZW50KSAtPlxuICAgICAgc3R5bGVFbGVtZW50LmlubmVyVGV4dFxuXG4gIGdldE1hcmtkb3duUHJldmlld0NTUzogLT5cbiAgICBtYXJrZG93blByZXZpZXdSdWxlcyA9IFtdXG4gICAgcnVsZVJlZ0V4cCA9IC9cXC5tYXJrZG93bi1wcmV2aWV3L1xuICAgIGNzc1VybFJlZkV4cCA9IC91cmxcXChhdG9tOlxcL1xcL21hcmtkb3duLXByZXZpZXdcXC9hc3NldHNcXC8oLiopXFwpL1xuXG4gICAgZm9yIHN0eWxlc2hlZXQgaW4gQGdldERvY3VtZW50U3R5bGVTaGVldHMoKVxuICAgICAgaWYgc3R5bGVzaGVldC5ydWxlcz9cbiAgICAgICAgZm9yIHJ1bGUgaW4gc3R5bGVzaGVldC5ydWxlc1xuICAgICAgICAgICMgV2Ugb25seSBuZWVkIGAubWFya2Rvd24tcmV2aWV3YCBjc3NcbiAgICAgICAgICBtYXJrZG93blByZXZpZXdSdWxlcy5wdXNoKHJ1bGUuY3NzVGV4dCkgaWYgcnVsZS5zZWxlY3RvclRleHQ/Lm1hdGNoKHJ1bGVSZWdFeHApP1xuXG4gICAgbWFya2Rvd25QcmV2aWV3UnVsZXNcbiAgICAgIC5jb25jYXQoQGdldFRleHRFZGl0b3JTdHlsZXMoKSlcbiAgICAgIC5qb2luKCdcXG4nKVxuICAgICAgLnJlcGxhY2UoL2F0b20tdGV4dC1lZGl0b3IvZywgJ3ByZS5lZGl0b3ItY29sb3JzJylcbiAgICAgIC5yZXBsYWNlKC86aG9zdC9nLCAnLmhvc3QnKSAjIFJlbW92ZSBzaGFkb3ctZG9tIDpob3N0IHNlbGVjdG9yIGNhdXNpbmcgcHJvYmxlbSBvbiBGRlxuICAgICAgLnJlcGxhY2UgY3NzVXJsUmVmRXhwLCAobWF0Y2gsIGFzc2V0c05hbWUsIG9mZnNldCwgc3RyaW5nKSAtPiAjIGJhc2U2NCBlbmNvZGUgYXNzZXRzXG4gICAgICAgIGFzc2V0UGF0aCA9IHBhdGguam9pbiBfX2Rpcm5hbWUsICcuLi9hc3NldHMnLCBhc3NldHNOYW1lXG4gICAgICAgIG9yaWdpbmFsRGF0YSA9IGZzLnJlYWRGaWxlU3luYyBhc3NldFBhdGgsICdiaW5hcnknXG4gICAgICAgIGJhc2U2NERhdGEgPSBuZXcgQnVmZmVyKG9yaWdpbmFsRGF0YSwgJ2JpbmFyeScpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICBcInVybCgnZGF0YTppbWFnZS9qcGVnO2Jhc2U2NCwje2Jhc2U2NERhdGF9JylcIlxuXG4gIHNob3dFcnJvcjogKHJlc3VsdCkgLT5cbiAgICBmYWlsdXJlTWVzc2FnZSA9IHJlc3VsdD8ubWVzc2FnZVxuXG4gICAgQGh0bWwgJCQkIC0+XG4gICAgICBAaDIgJ1ByZXZpZXdpbmcgTWFya2Rvd24gRmFpbGVkJ1xuICAgICAgQGgzIGZhaWx1cmVNZXNzYWdlIGlmIGZhaWx1cmVNZXNzYWdlP1xuXG4gIHNob3dMb2FkaW5nOiAtPlxuICAgIEBsb2FkaW5nID0gdHJ1ZVxuICAgIEBodG1sICQkJCAtPlxuICAgICAgQGRpdiBjbGFzczogJ21hcmtkb3duLXNwaW5uZXInLCAnTG9hZGluZyBNYXJrZG93blxcdTIwMjYnXG5cbiAgY29weVRvQ2xpcGJvYXJkOiAtPlxuICAgIHJldHVybiBmYWxzZSBpZiBAbG9hZGluZ1xuXG4gICAgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpXG4gICAgc2VsZWN0ZWRUZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKClcbiAgICBzZWxlY3RlZE5vZGUgPSBzZWxlY3Rpb24uYmFzZU5vZGVcblxuICAgICMgVXNlIGRlZmF1bHQgY29weSBldmVudCBoYW5kbGVyIGlmIHRoZXJlIGlzIHNlbGVjdGVkIHRleHQgaW5zaWRlIHRoaXMgdmlld1xuICAgIHJldHVybiBmYWxzZSBpZiBzZWxlY3RlZFRleHQgYW5kIHNlbGVjdGVkTm9kZT8gYW5kIChAWzBdIGlzIHNlbGVjdGVkTm9kZSBvciAkLmNvbnRhaW5zKEBbMF0sIHNlbGVjdGVkTm9kZSkpXG5cbiAgICBAZ2V0SFRNTCAoZXJyb3IsIGh0bWwpIC0+XG4gICAgICBpZiBlcnJvcj9cbiAgICAgICAgY29uc29sZS53YXJuKCdDb3B5aW5nIE1hcmtkb3duIGFzIEhUTUwgZmFpbGVkJywgZXJyb3IpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGh0bWwpXG5cbiAgICB0cnVlXG5cbiAgc2F2ZUFzOiAtPlxuICAgIHJldHVybiBpZiBAbG9hZGluZ1xuXG4gICAgZmlsZVBhdGggPSBAZ2V0UGF0aCgpXG4gICAgdGl0bGUgPSAnTWFya2Rvd24gdG8gSFRNTCdcbiAgICBpZiBmaWxlUGF0aFxuICAgICAgdGl0bGUgPSBwYXRoLnBhcnNlKGZpbGVQYXRoKS5uYW1lXG4gICAgICBmaWxlUGF0aCArPSAnLmh0bWwnXG4gICAgZWxzZVxuICAgICAgZmlsZVBhdGggPSAndW50aXRsZWQubWQuaHRtbCdcbiAgICAgIGlmIHByb2plY3RQYXRoID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsIGZpbGVQYXRoKVxuXG4gICAgaWYgaHRtbEZpbGVQYXRoID0gYXRvbS5zaG93U2F2ZURpYWxvZ1N5bmMoZmlsZVBhdGgpXG5cbiAgICAgIEBnZXRIVE1MIChlcnJvciwgaHRtbEJvZHkpID0+XG4gICAgICAgIGlmIGVycm9yP1xuICAgICAgICAgIGNvbnNvbGUud2FybignU2F2aW5nIE1hcmtkb3duIGFzIEhUTUwgZmFpbGVkJywgZXJyb3IpXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgIGh0bWwgPSBcIlwiXCJcbiAgICAgICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICAgICAgPGh0bWw+XG4gICAgICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgICAgICAgICAgPG1ldGEgY2hhcnNldD1cInV0Zi04XCIgLz5cbiAgICAgICAgICAgICAgICAgIDx0aXRsZT4je3RpdGxlfTwvdGl0bGU+XG4gICAgICAgICAgICAgICAgICA8c3R5bGU+I3tAZ2V0TWFya2Rvd25QcmV2aWV3Q1NTKCl9PC9zdHlsZT5cbiAgICAgICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgICAgICA8Ym9keSBjbGFzcz0nbWFya2Rvd24tcHJldmlldycgZGF0YS11c2UtZ2l0aHViLXN0eWxlPiN7aHRtbEJvZHl9PC9ib2R5PlxuICAgICAgICAgICAgPC9odG1sPlwiXCJcIiArIFwiXFxuXCIgIyBFbnN1cmUgdHJhaWxpbmcgbmV3bGluZVxuXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhodG1sRmlsZVBhdGgsIGh0bWwpXG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihodG1sRmlsZVBhdGgpXG5cbiAgaXNFcXVhbDogKG90aGVyKSAtPlxuICAgIEBbMF0gaXMgb3RoZXI/WzBdICMgQ29tcGFyZSBET00gZWxlbWVudHNcbiJdfQ==
