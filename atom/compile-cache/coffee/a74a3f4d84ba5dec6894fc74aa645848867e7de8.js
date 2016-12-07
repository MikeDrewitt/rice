(function() {
  var $, $$$, CompositeDisposable, Disposable, ProjectFindView, ResultsModel, ResultsPaneView, TextEditorView, Util, View, _, buildTextEditor, fs, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs-plus');

  path = require('path');

  _ = require('underscore-plus');

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, $$$ = ref1.$$$, View = ref1.View, TextEditorView = ref1.TextEditorView;

  Util = require('./project/util');

  ResultsModel = require('./project/results-model');

  ResultsPaneView = require('./project/results-pane');

  buildTextEditor = require('./build-text-editor');

  module.exports = ProjectFindView = (function(superClass) {
    extend(ProjectFindView, superClass);

    function ProjectFindView() {
      this.updateOptionViews = bind(this.updateOptionViews, this);
      this.setSelectionAsFindPattern = bind(this.setSelectionAsFindPattern, this);
      this.generateResultsMessage = bind(this.generateResultsMessage, this);
      return ProjectFindView.__super__.constructor.apply(this, arguments);
    }

    ProjectFindView.content = function(model, arg) {
      var findBuffer, findEditor, pathsBuffer, pathsEditor, replaceBuffer, replaceEditor;
      findBuffer = arg.findBuffer, replaceBuffer = arg.replaceBuffer, pathsBuffer = arg.pathsBuffer;
      findEditor = buildTextEditor({
        mini: true,
        tabLength: 2,
        softTabs: true,
        softWrapped: false,
        buffer: findBuffer,
        placeholderText: 'Find in project'
      });
      replaceEditor = buildTextEditor({
        mini: true,
        tabLength: 2,
        softTabs: true,
        softWrapped: false,
        buffer: replaceBuffer,
        placeholderText: 'Replace in project'
      });
      pathsEditor = buildTextEditor({
        mini: true,
        tabLength: 2,
        softTabs: true,
        softWrapped: false,
        buffer: pathsBuffer,
        placeholderText: 'File/directory pattern. eg. `src` to search in the "src" directory or `*.js` to search all javascript files.'
      });
      return this.div({
        tabIndex: -1,
        "class": 'project-find padded'
      }, (function(_this) {
        return function() {
          _this.header({
            "class": 'header'
          }, function() {
            _this.span({
              outlet: 'descriptionLabel',
              "class": 'header-item description'
            });
            return _this.span({
              "class": 'header-item options-label pull-right'
            }, function() {
              _this.span('Finding with Options: ');
              return _this.span({
                outlet: 'optionsLabel',
                "class": 'options'
              });
            });
          });
          _this.section({
            outlet: 'replacmentInfoBlock',
            "class": 'input-block'
          }, function() {
            _this.progress({
              outlet: 'replacementProgress',
              "class": 'inline-block'
            });
            return _this.span({
              outlet: 'replacmentInfo',
              "class": 'inline-block'
            }, 'Replaced 2 files of 10 files');
          });
          _this.section({
            "class": 'input-block find-container'
          }, function() {
            _this.div({
              "class": 'input-block-item input-block-item--flex editor-container'
            }, function() {
              return _this.subview('findEditor', new TextEditorView({
                editor: findEditor
              }));
            });
            return _this.div({
              "class": 'input-block-item'
            }, function() {
              _this.div({
                "class": 'btn-group btn-group-find'
              }, function() {
                return _this.button({
                  outlet: 'findAllButton',
                  "class": 'btn'
                }, 'Find');
              });
              return _this.div({
                "class": 'btn-group btn-toggle btn-group-options'
              }, function() {
                _this.button({
                  outlet: 'regexOptionButton',
                  "class": 'btn option-regex'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-regex" /></svg>');
                });
                _this.button({
                  outlet: 'caseOptionButton',
                  "class": 'btn option-case-sensitive'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-case" /></svg>');
                });
                return _this.button({
                  outlet: 'wholeWordOptionButton',
                  "class": 'btn option-whole-word'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-word" /></svg>');
                });
              });
            });
          });
          _this.section({
            "class": 'input-block replace-container'
          }, function() {
            _this.div({
              "class": 'input-block-item input-block-item--flex editor-container'
            }, function() {
              return _this.subview('replaceEditor', new TextEditorView({
                editor: replaceEditor
              }));
            });
            return _this.div({
              "class": 'input-block-item'
            }, function() {
              return _this.div({
                "class": 'btn-group btn-group-replace-all'
              }, function() {
                return _this.button({
                  outlet: 'replaceAllButton',
                  "class": 'btn disabled'
                }, 'Replace All');
              });
            });
          });
          return _this.section({
            "class": 'input-block paths-container'
          }, function() {
            return _this.div({
              "class": 'input-block-item editor-container'
            }, function() {
              return _this.subview('pathsEditor', new TextEditorView({
                editor: pathsEditor
              }));
            });
          });
        };
      })(this));
    };

    ProjectFindView.prototype.initialize = function(model1, arg) {
      this.model = model1;
      this.findHistoryCycler = arg.findHistoryCycler, this.replaceHistoryCycler = arg.replaceHistoryCycler, this.pathsHistoryCycler = arg.pathsHistoryCycler;
      this.subscriptions = new CompositeDisposable;
      this.handleEvents();
      this.findHistoryCycler.addEditorElement(this.findEditor.element);
      this.replaceHistoryCycler.addEditorElement(this.replaceEditor.element);
      this.pathsHistoryCycler.addEditorElement(this.pathsEditor.element);
      this.onlyRunIfChanged = true;
      this.clearMessages();
      return this.updateOptionViews();
    };

    ProjectFindView.prototype.destroy = function() {
      var ref2, ref3;
      if ((ref2 = this.subscriptions) != null) {
        ref2.dispose();
      }
      return (ref3 = this.tooltipSubscriptions) != null ? ref3.dispose() : void 0;
    };

    ProjectFindView.prototype.setPanel = function(panel) {
      this.panel = panel;
      return this.subscriptions.add(this.panel.onDidChangeVisible((function(_this) {
        return function(visible) {
          if (visible) {
            return _this.didShow();
          } else {
            return _this.didHide();
          }
        };
      })(this)));
    };

    ProjectFindView.prototype.didShow = function() {
      var subs;
      atom.views.getView(atom.workspace).classList.add('find-visible');
      if (this.tooltipSubscriptions != null) {
        return;
      }
      this.updateReplaceAllButtonEnablement();
      this.tooltipSubscriptions = subs = new CompositeDisposable;
      subs.add(atom.tooltips.add(this.regexOptionButton, {
        title: "Use Regex",
        keyBindingCommand: 'project-find:toggle-regex-option',
        keyBindingTarget: this.findEditor.element
      }));
      subs.add(atom.tooltips.add(this.caseOptionButton, {
        title: "Match Case",
        keyBindingCommand: 'project-find:toggle-case-option',
        keyBindingTarget: this.findEditor.element
      }));
      subs.add(atom.tooltips.add(this.wholeWordOptionButton, {
        title: "Whole Word",
        keyBindingCommand: 'project-find:toggle-whole-word-option',
        keyBindingTarget: this.findEditor.element
      }));
      return subs.add(atom.tooltips.add(this.findAllButton, {
        title: "Find All",
        keyBindingCommand: 'find-and-replace:search',
        keyBindingTarget: this.findEditor.element
      }));
    };

    ProjectFindView.prototype.didHide = function() {
      var workspaceElement;
      this.hideAllTooltips();
      workspaceElement = atom.views.getView(atom.workspace);
      workspaceElement.focus();
      return workspaceElement.classList.remove('find-visible');
    };

    ProjectFindView.prototype.hideAllTooltips = function() {
      this.tooltipSubscriptions.dispose();
      return this.tooltipSubscriptions = null;
    };

    ProjectFindView.prototype.handleEvents = function() {
      var focusCallback, resetInterface, updateInterfaceForResults, updateInterfaceForSearching;
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'find-and-replace:use-selection-as-find-pattern': this.setSelectionAsFindPattern
      }));
      this.subscriptions.add(atom.commands.add(this.element, {
        'find-and-replace:focus-next': (function(_this) {
          return function() {
            return _this.focusNextElement(1);
          };
        })(this),
        'find-and-replace:focus-previous': (function(_this) {
          return function() {
            return _this.focusNextElement(-1);
          };
        })(this),
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'core:close': (function(_this) {
          return function() {
            var ref2;
            return (ref2 = _this.panel) != null ? ref2.hide() : void 0;
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            var ref2;
            return (ref2 = _this.panel) != null ? ref2.hide() : void 0;
          };
        })(this),
        'project-find:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'project-find:toggle-regex-option': (function(_this) {
          return function() {
            return _this.toggleRegexOption();
          };
        })(this),
        'project-find:toggle-case-option': (function(_this) {
          return function() {
            return _this.toggleCaseOption();
          };
        })(this),
        'project-find:toggle-whole-word-option': (function(_this) {
          return function() {
            return _this.toggleWholeWordOption();
          };
        })(this),
        'project-find:replace-all': (function(_this) {
          return function() {
            return _this.replaceAll();
          };
        })(this)
      }));
      updateInterfaceForSearching = (function(_this) {
        return function() {
          return _this.setInfoMessage('Searching...');
        };
      })(this);
      updateInterfaceForResults = (function(_this) {
        return function(results) {
          var ref2;
          if (atom.config.get('find-and-replace.closeFindPanelAfterSearch')) {
            return (ref2 = _this.panel) != null ? ref2.hide() : void 0;
          }
          if (results.matchCount === 0 && results.findPattern === '') {
            _this.clearMessages();
          } else {
            _this.generateResultsMessage(results);
          }
          return _this.updateReplaceAllButtonEnablement(results);
        };
      })(this);
      resetInterface = (function(_this) {
        return function() {
          _this.clearMessages();
          return _this.updateReplaceAllButtonEnablement(null);
        };
      })(this);
      this.subscriptions.add(this.model.onDidClear(resetInterface));
      this.subscriptions.add(this.model.onDidClearReplacementState(updateInterfaceForResults));
      this.subscriptions.add(this.model.onDidStartSearching(updateInterfaceForSearching));
      this.subscriptions.add(this.model.onDidFinishSearching(updateInterfaceForResults));
      this.subscriptions.add(this.model.getFindOptions().onDidChange(this.updateOptionViews));
      this.on('focus', (function(_this) {
        return function(e) {
          return _this.findEditor.focus();
        };
      })(this));
      this.regexOptionButton.click((function(_this) {
        return function() {
          return _this.toggleRegexOption();
        };
      })(this));
      this.caseOptionButton.click((function(_this) {
        return function() {
          return _this.toggleCaseOption();
        };
      })(this));
      this.wholeWordOptionButton.click((function(_this) {
        return function() {
          return _this.toggleWholeWordOption();
        };
      })(this));
      this.replaceAllButton.on('click', (function(_this) {
        return function() {
          return _this.replaceAll();
        };
      })(this));
      this.findAllButton.on('click', (function(_this) {
        return function() {
          return _this.search();
        };
      })(this));
      focusCallback = (function(_this) {
        return function() {
          return _this.onlyRunIfChanged = false;
        };
      })(this);
      $(window).on('focus', focusCallback);
      this.subscriptions.add(new Disposable(function() {
        return $(window).off('focus', focusCallback);
      }));
      this.findEditor.getModel().getBuffer().onDidChange((function(_this) {
        return function() {
          return _this.updateReplaceAllButtonEnablement(_this.model.getResultsSummary());
        };
      })(this));
      return this.handleEventsForReplace();
    };

    ProjectFindView.prototype.handleEventsForReplace = function() {
      this.replaceEditor.getModel().getBuffer().onDidChange((function(_this) {
        return function() {
          return _this.model.clearReplacementState();
        };
      })(this));
      this.replaceEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.model.getFindOptions().set({
            replacePattern: _this.replaceEditor.getText()
          });
        };
      })(this));
      this.replacementsMade = 0;
      this.subscriptions.add(this.model.onDidStartReplacing((function(_this) {
        return function(promise) {
          _this.replacementsMade = 0;
          _this.replacmentInfoBlock.show();
          return _this.replacementProgress.removeAttr('value');
        };
      })(this)));
      this.subscriptions.add(this.model.onDidReplacePath((function(_this) {
        return function(result) {
          _this.replacementsMade++;
          _this.replacementProgress[0].value = _this.replacementsMade / _this.model.getPathCount();
          return _this.replacmentInfo.text("Replaced " + _this.replacementsMade + " of " + (_.pluralize(_this.model.getPathCount(), 'file')));
        };
      })(this)));
      return this.subscriptions.add(this.model.onDidFinishReplacing((function(_this) {
        return function(result) {
          return _this.onFinishedReplacing(result);
        };
      })(this)));
    };

    ProjectFindView.prototype.focusNextElement = function(direction) {
      var base, elements, focusedElement, focusedIndex;
      elements = [this.findEditor, this.replaceEditor, this.pathsEditor];
      focusedElement = _.find(elements, function(el) {
        return el.hasClass('is-focused');
      });
      focusedIndex = elements.indexOf(focusedElement);
      focusedIndex = focusedIndex + direction;
      if (focusedIndex >= elements.length) {
        focusedIndex = 0;
      }
      if (focusedIndex < 0) {
        focusedIndex = elements.length - 1;
      }
      elements[focusedIndex].focus();
      return typeof (base = elements[focusedIndex]).getModel === "function" ? base.getModel().selectAll() : void 0;
    };

    ProjectFindView.prototype.focusFindElement = function() {
      var ref2, selectedText;
      selectedText = (ref2 = atom.workspace.getActiveTextEditor()) != null ? typeof ref2.getSelectedText === "function" ? ref2.getSelectedText() : void 0 : void 0;
      if (selectedText && selectedText.indexOf('\n') < 0) {
        if (this.model.getFindOptions().useRegex) {
          selectedText = Util.escapeRegex(selectedText);
        }
        this.findEditor.setText(selectedText);
      }
      this.findEditor.focus();
      return this.findEditor.getModel().selectAll();
    };

    ProjectFindView.prototype.confirm = function() {
      var searchPromise;
      if (this.findEditor.getText().length === 0) {
        this.model.clear();
        return;
      }
      this.findHistoryCycler.store();
      this.replaceHistoryCycler.store();
      this.pathsHistoryCycler.store();
      searchPromise = this.search({
        onlyRunIfChanged: this.onlyRunIfChanged
      });
      this.onlyRunIfChanged = true;
      return searchPromise;
    };

    ProjectFindView.prototype.search = function(options) {
      var findPattern, onlyRunIfActive, onlyRunIfChanged, pathsPattern, replacePattern;
      if (options == null) {
        options = {};
      }
      this.model.getFindOptions().set(options);
      findPattern = this.findEditor.getText();
      pathsPattern = this.pathsEditor.getText();
      replacePattern = this.replaceEditor.getText();
      onlyRunIfActive = options.onlyRunIfActive, onlyRunIfChanged = options.onlyRunIfChanged;
      if ((onlyRunIfActive && !this.model.active) || !findPattern) {
        return Promise.resolve();
      }
      return this.showResultPane().then((function(_this) {
        return function() {
          var e;
          try {
            return _this.model.search(findPattern, pathsPattern, replacePattern, options);
          } catch (error) {
            e = error;
            return _this.setErrorMessage(e.message);
          }
        };
      })(this));
    };

    ProjectFindView.prototype.replaceAll = function() {
      var currentPattern, findPattern;
      if (!this.model.matchCount) {
        return atom.beep();
      }
      findPattern = this.model.getLastFindPattern();
      currentPattern = this.findEditor.getText();
      if (findPattern && findPattern !== currentPattern) {
        atom.confirm({
          message: "The searched pattern '" + findPattern + "' was changed to '" + currentPattern + "'",
          detailedMessage: "Please run the search with the new pattern '" + currentPattern + "' before running a replace-all",
          buttons: ['OK']
        });
        return;
      }
      return this.showResultPane().then((function(_this) {
        return function() {
          var buttonChosen, message, pathsPattern, replacePattern;
          pathsPattern = _this.pathsEditor.getText();
          replacePattern = _this.replaceEditor.getText();
          message = "This will replace '" + findPattern + "' with '" + replacePattern + "' " + (_.pluralize(_this.model.matchCount, 'time')) + " in " + (_.pluralize(_this.model.pathCount, 'file'));
          buttonChosen = atom.confirm({
            message: 'Are you sure you want to replace all?',
            detailedMessage: message,
            buttons: ['OK', 'Cancel']
          });
          if (buttonChosen === 0) {
            _this.clearMessages();
            return _this.model.replace(pathsPattern, replacePattern, _this.model.getPaths());
          }
        };
      })(this));
    };

    ProjectFindView.prototype.directoryPathForElement = function(element) {
      var elementPath, ref2, ref3, ref4;
      elementPath = (ref2 = element != null ? element.dataset.path : void 0) != null ? ref2 : element != null ? (ref3 = element.querySelector('[data-path]')) != null ? ref3.dataset.path : void 0 : void 0;
      if (!elementPath) {
        while (element != null) {
          elementPath = element.dataset.path;
          if (elementPath) {
            break;
          }
          element = element.parentElement;
        }
        if (!elementPath) {
          elementPath = (ref4 = atom.workspace.getActiveTextEditor()) != null ? ref4.getPath() : void 0;
        }
      }
      if (fs.isFileSync(elementPath)) {
        return require('path').dirname(elementPath);
      } else {
        return elementPath;
      }
    };

    ProjectFindView.prototype.findInCurrentlySelectedDirectory = function(selectedElement) {
      var absPath, ref2, relPath, rootPath;
      if (absPath = this.directoryPathForElement(selectedElement)) {
        ref2 = atom.project.relativizePath(absPath), rootPath = ref2[0], relPath = ref2[1];
        if ((rootPath != null) && atom.project.getDirectories().length > 1) {
          relPath = path.join(path.basename(rootPath), relPath);
        }
        this.pathsEditor.setText(relPath);
        this.findEditor.focus();
        return this.findEditor.getModel().selectAll();
      }
    };

    ProjectFindView.prototype.showResultPane = function() {
      var options;
      options = {
        searchAllPanes: true
      };
      if (atom.config.get('find-and-replace.openProjectFindResultsInRightPane')) {
        options.split = 'right';
      }
      return atom.workspace.open(ResultsPaneView.URI, options);
    };

    ProjectFindView.prototype.onFinishedReplacing = function(results) {
      if (!results.replacedPathCount) {
        atom.beep();
      }
      return this.replacmentInfoBlock.hide();
    };

    ProjectFindView.prototype.generateResultsMessage = function(results) {
      var message;
      message = Util.getSearchResultsMessage(results);
      if (results.replacedPathCount != null) {
        message = Util.getReplacementResultsMessage(results);
      }
      return this.setInfoMessage(message);
    };

    ProjectFindView.prototype.clearMessages = function() {
      this.removeClass('has-results has-no-results');
      this.setInfoMessage('Find in Project <span class="subtle-info-message">Close this panel with the <span class="highlight">esc</span> key</span>').removeClass('text-error');
      return this.replacmentInfoBlock.hide();
    };

    ProjectFindView.prototype.setInfoMessage = function(infoMessage) {
      return this.descriptionLabel.html(infoMessage).removeClass('text-error');
    };

    ProjectFindView.prototype.setErrorMessage = function(errorMessage) {
      return this.descriptionLabel.html(errorMessage).addClass('text-error');
    };

    ProjectFindView.prototype.updateReplaceAllButtonEnablement = function(results) {
      var canReplace, ref2;
      canReplace = (results != null ? results.matchCount : void 0) && (results != null ? results.findPattern : void 0) === this.findEditor.getText();
      if (canReplace && !this.replaceAllButton[0].classList.contains('disabled')) {
        return;
      }
      if ((ref2 = this.replaceTooltipSubscriptions) != null) {
        ref2.dispose();
      }
      this.replaceTooltipSubscriptions = new CompositeDisposable;
      if (canReplace) {
        this.replaceAllButton[0].classList.remove('disabled');
        return this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceAllButton, {
          title: "Replace All",
          keyBindingCommand: 'project-find:replace-all',
          keyBindingTarget: this.replaceEditor.element
        }));
      } else {
        this.replaceAllButton[0].classList.add('disabled');
        return this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceAllButton, {
          title: "Replace All [run a search to enable]"
        }));
      }
    };

    ProjectFindView.prototype.setSelectionAsFindPattern = function() {
      var editor, pattern;
      editor = atom.workspace.getActivePaneItem();
      if ((editor != null ? editor.getSelectedText : void 0) != null) {
        pattern = editor.getSelectedText() || editor.getWordUnderCursor();
        if (this.model.getFindOptions().useRegex) {
          pattern = Util.escapeRegex(pattern);
        }
        if (pattern) {
          return this.findEditor.setText(pattern);
        }
      }
    };

    ProjectFindView.prototype.updateOptionViews = function() {
      this.updateOptionButtons();
      this.updateOptionsLabel();
      return this.updateSyntaxHighlighting();
    };

    ProjectFindView.prototype.updateSyntaxHighlighting = function() {
      if (this.model.getFindOptions().useRegex) {
        this.findEditor.getModel().setGrammar(atom.grammars.grammarForScopeName('source.js.regexp'));
        return this.replaceEditor.getModel().setGrammar(atom.grammars.grammarForScopeName('source.js.regexp.replacement'));
      } else {
        this.findEditor.getModel().setGrammar(atom.grammars.nullGrammar);
        return this.replaceEditor.getModel().setGrammar(atom.grammars.nullGrammar);
      }
    };

    ProjectFindView.prototype.updateOptionsLabel = function() {
      var label;
      label = [];
      if (this.model.getFindOptions().useRegex) {
        label.push('Regex');
      }
      if (this.model.getFindOptions().caseSensitive) {
        label.push('Case Sensitive');
      } else {
        label.push('Case Insensitive');
      }
      if (this.model.getFindOptions().wholeWord) {
        label.push('Whole Word');
      }
      return this.optionsLabel.text(label.join(', '));
    };

    ProjectFindView.prototype.updateOptionButtons = function() {
      this.setOptionButtonState(this.regexOptionButton, this.model.getFindOptions().useRegex);
      this.setOptionButtonState(this.caseOptionButton, this.model.getFindOptions().caseSensitive);
      return this.setOptionButtonState(this.wholeWordOptionButton, this.model.getFindOptions().wholeWord);
    };

    ProjectFindView.prototype.setOptionButtonState = function(optionButton, selected) {
      if (selected) {
        return optionButton.addClass('selected');
      } else {
        return optionButton.removeClass('selected');
      }
    };

    ProjectFindView.prototype.toggleRegexOption = function() {
      return this.search({
        onlyRunIfActive: true,
        useRegex: !this.model.getFindOptions().useRegex
      });
    };

    ProjectFindView.prototype.toggleCaseOption = function() {
      return this.search({
        onlyRunIfActive: true,
        caseSensitive: !this.model.getFindOptions().caseSensitive
      });
    };

    ProjectFindView.prototype.toggleWholeWordOption = function() {
      return this.search({
        onlyRunIfActive: true,
        wholeWord: !this.model.getFindOptions().wholeWord
      });
    };

    return ProjectFindView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0LWZpbmQtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDRKQUFBO0lBQUE7Ozs7RUFBQSxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLE9BQWlDLE9BQUEsQ0FBUSxzQkFBUixDQUFqQyxFQUFDLFVBQUQsRUFBSSxjQUFKLEVBQVMsZ0JBQVQsRUFBZTs7RUFFZixJQUFBLEdBQU8sT0FBQSxDQUFRLGdCQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEseUJBQVI7O0VBQ2YsZUFBQSxHQUFrQixPQUFBLENBQVEsd0JBQVI7O0VBRWxCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHFCQUFSOztFQUVsQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7Ozs7O0lBQ0osZUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEtBQUQsRUFBUSxHQUFSO0FBQ1IsVUFBQTtNQURpQiw2QkFBWSxtQ0FBZTtNQUM1QyxVQUFBLEdBQWEsZUFBQSxDQUNYO1FBQUEsSUFBQSxFQUFNLElBQU47UUFDQSxTQUFBLEVBQVcsQ0FEWDtRQUVBLFFBQUEsRUFBVSxJQUZWO1FBR0EsV0FBQSxFQUFhLEtBSGI7UUFJQSxNQUFBLEVBQVEsVUFKUjtRQUtBLGVBQUEsRUFBaUIsaUJBTGpCO09BRFc7TUFRYixhQUFBLEdBQWdCLGVBQUEsQ0FDZDtRQUFBLElBQUEsRUFBTSxJQUFOO1FBQ0EsU0FBQSxFQUFXLENBRFg7UUFF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XG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsICQkJCwgVmlldywgVGV4dEVkaXRvclZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cblV0aWwgPSByZXF1aXJlICcuL3Byb2plY3QvdXRpbCdcblJlc3VsdHNNb2RlbCA9IHJlcXVpcmUgJy4vcHJvamVjdC9yZXN1bHRzLW1vZGVsJ1xuUmVzdWx0c1BhbmVWaWV3ID0gcmVxdWlyZSAnLi9wcm9qZWN0L3Jlc3VsdHMtcGFuZSdcblxuYnVpbGRUZXh0RWRpdG9yID0gcmVxdWlyZSAnLi9idWlsZC10ZXh0LWVkaXRvcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUHJvamVjdEZpbmRWaWV3IGV4dGVuZHMgVmlld1xuICBAY29udGVudDogKG1vZGVsLCB7ZmluZEJ1ZmZlciwgcmVwbGFjZUJ1ZmZlciwgcGF0aHNCdWZmZXJ9KSAtPlxuICAgIGZpbmRFZGl0b3IgPSBidWlsZFRleHRFZGl0b3JcbiAgICAgIG1pbmk6IHRydWVcbiAgICAgIHRhYkxlbmd0aDogMlxuICAgICAgc29mdFRhYnM6IHRydWVcbiAgICAgIHNvZnRXcmFwcGVkOiBmYWxzZVxuICAgICAgYnVmZmVyOiBmaW5kQnVmZmVyXG4gICAgICBwbGFjZWhvbGRlclRleHQ6ICdGaW5kIGluIHByb2plY3QnXG5cbiAgICByZXBsYWNlRWRpdG9yID0gYnVpbGRUZXh0RWRpdG9yXG4gICAgICBtaW5pOiB0cnVlXG4gICAgICB0YWJMZW5ndGg6IDJcbiAgICAgIHNvZnRUYWJzOiB0cnVlXG4gICAgICBzb2Z0V3JhcHBlZDogZmFsc2VcbiAgICAgIGJ1ZmZlcjogcmVwbGFjZUJ1ZmZlclxuICAgICAgcGxhY2Vob2xkZXJUZXh0OiAnUmVwbGFjZSBpbiBwcm9qZWN0J1xuXG4gICAgcGF0aHNFZGl0b3IgPSBidWlsZFRleHRFZGl0b3JcbiAgICAgIG1pbmk6IHRydWVcbiAgICAgIHRhYkxlbmd0aDogMlxuICAgICAgc29mdFRhYnM6IHRydWVcbiAgICAgIHNvZnRXcmFwcGVkOiBmYWxzZVxuICAgICAgYnVmZmVyOiBwYXRoc0J1ZmZlclxuICAgICAgcGxhY2Vob2xkZXJUZXh0OiAnRmlsZS9kaXJlY3RvcnkgcGF0dGVybi4gZWcuIGBzcmNgIHRvIHNlYXJjaCBpbiB0aGUgXCJzcmNcIiBkaXJlY3Rvcnkgb3IgYCouanNgIHRvIHNlYXJjaCBhbGwgamF2YXNjcmlwdCBmaWxlcy4nXG5cbiAgICBAZGl2IHRhYkluZGV4OiAtMSwgY2xhc3M6ICdwcm9qZWN0LWZpbmQgcGFkZGVkJywgPT5cbiAgICAgIEBoZWFkZXIgY2xhc3M6ICdoZWFkZXInLCA9PlxuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkZXNjcmlwdGlvbkxhYmVsJywgY2xhc3M6ICdoZWFkZXItaXRlbSBkZXNjcmlwdGlvbidcbiAgICAgICAgQHNwYW4gY2xhc3M6ICdoZWFkZXItaXRlbSBvcHRpb25zLWxhYmVsIHB1bGwtcmlnaHQnLCA9PlxuICAgICAgICAgIEBzcGFuICdGaW5kaW5nIHdpdGggT3B0aW9uczogJ1xuICAgICAgICAgIEBzcGFuIG91dGxldDogJ29wdGlvbnNMYWJlbCcsIGNsYXNzOiAnb3B0aW9ucydcblxuICAgICAgQHNlY3Rpb24gb3V0bGV0OiAncmVwbGFjbWVudEluZm9CbG9jaycsIGNsYXNzOiAnaW5wdXQtYmxvY2snLCA9PlxuICAgICAgICBAcHJvZ3Jlc3Mgb3V0bGV0OiAncmVwbGFjZW1lbnRQcm9ncmVzcycsIGNsYXNzOiAnaW5saW5lLWJsb2NrJ1xuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdyZXBsYWNtZW50SW5mbycsIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgJ1JlcGxhY2VkIDIgZmlsZXMgb2YgMTAgZmlsZXMnXG5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnaW5wdXQtYmxvY2sgZmluZC1jb250YWluZXInLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnaW5wdXQtYmxvY2staXRlbSBpbnB1dC1ibG9jay1pdGVtLS1mbGV4IGVkaXRvci1jb250YWluZXInLCA9PlxuICAgICAgICAgIEBzdWJ2aWV3ICdmaW5kRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KGVkaXRvcjogZmluZEVkaXRvcilcbiAgICAgICAgQGRpdiBjbGFzczogJ2lucHV0LWJsb2NrLWl0ZW0nLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tZ3JvdXAgYnRuLWdyb3VwLWZpbmQnLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdmaW5kQWxsQnV0dG9uJywgY2xhc3M6ICdidG4nLCAnRmluZCdcbiAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwIGJ0bi10b2dnbGUgYnRuLWdyb3VwLW9wdGlvbnMnLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdyZWdleE9wdGlvbkJ1dHRvbicsIGNsYXNzOiAnYnRuIG9wdGlvbi1yZWdleCcsID0+XG4gICAgICAgICAgICAgIEByYXcgJzxzdmcgY2xhc3M9XCJpY29uXCI+PHVzZSB4bGluazpocmVmPVwiI2ZpbmQtYW5kLXJlcGxhY2UtaWNvbi1yZWdleFwiIC8+PC9zdmc+J1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdjYXNlT3B0aW9uQnV0dG9uJywgY2xhc3M6ICdidG4gb3B0aW9uLWNhc2Utc2Vuc2l0aXZlJywgPT5cbiAgICAgICAgICAgICAgQHJhdyAnPHN2ZyBjbGFzcz1cImljb25cIj48dXNlIHhsaW5rOmhyZWY9XCIjZmluZC1hbmQtcmVwbGFjZS1pY29uLWNhc2VcIiAvPjwvc3ZnPidcbiAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAnd2hvbGVXb3JkT3B0aW9uQnV0dG9uJywgY2xhc3M6ICdidG4gb3B0aW9uLXdob2xlLXdvcmQnLCA9PlxuICAgICAgICAgICAgICBAcmF3ICc8c3ZnIGNsYXNzPVwiaWNvblwiPjx1c2UgeGxpbms6aHJlZj1cIiNmaW5kLWFuZC1yZXBsYWNlLWljb24td29yZFwiIC8+PC9zdmc+J1xuXG4gICAgICBAc2VjdGlvbiBjbGFzczogJ2lucHV0LWJsb2NrIHJlcGxhY2UtY29udGFpbmVyJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ2lucHV0LWJsb2NrLWl0ZW0gaW5wdXQtYmxvY2staXRlbS0tZmxleCBlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgICAgICBAc3VidmlldyAncmVwbGFjZUVkaXRvcicsIG5ldyBUZXh0RWRpdG9yVmlldyhlZGl0b3I6IHJlcGxhY2VFZGl0b3IpXG4gICAgICAgIEBkaXYgY2xhc3M6ICdpbnB1dC1ibG9jay1pdGVtJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwIGJ0bi1ncm91cC1yZXBsYWNlLWFsbCcsID0+XG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3JlcGxhY2VBbGxCdXR0b24nLCBjbGFzczogJ2J0biBkaXNhYmxlZCcsICdSZXBsYWNlIEFsbCdcblxuICAgICAgQHNlY3Rpb24gY2xhc3M6ICdpbnB1dC1ibG9jayBwYXRocy1jb250YWluZXInLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnaW5wdXQtYmxvY2staXRlbSBlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgICAgICBAc3VidmlldyAncGF0aHNFZGl0b3InLCBuZXcgVGV4dEVkaXRvclZpZXcoZWRpdG9yOiBwYXRoc0VkaXRvcilcblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCB7QGZpbmRIaXN0b3J5Q3ljbGVyLCBAcmVwbGFjZUhpc3RvcnlDeWNsZXIsIEBwYXRoc0hpc3RvcnlDeWNsZXJ9KSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICAgIEBmaW5kSGlzdG9yeUN5Y2xlci5hZGRFZGl0b3JFbGVtZW50KEBmaW5kRWRpdG9yLmVsZW1lbnQpXG4gICAgQHJlcGxhY2VIaXN0b3J5Q3ljbGVyLmFkZEVkaXRvckVsZW1lbnQoQHJlcGxhY2VFZGl0b3IuZWxlbWVudClcbiAgICBAcGF0aHNIaXN0b3J5Q3ljbGVyLmFkZEVkaXRvckVsZW1lbnQoQHBhdGhzRWRpdG9yLmVsZW1lbnQpXG5cbiAgICBAb25seVJ1bklmQ2hhbmdlZCA9IHRydWVcblxuICAgIEBjbGVhck1lc3NhZ2VzKClcbiAgICBAdXBkYXRlT3B0aW9uVmlld3MoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEB0b29sdGlwU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG5cbiAgc2V0UGFuZWw6IChAcGFuZWwpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBwYW5lbC5vbkRpZENoYW5nZVZpc2libGUgKHZpc2libGUpID0+XG4gICAgICBpZiB2aXNpYmxlIHRoZW4gQGRpZFNob3coKSBlbHNlIEBkaWRIaWRlKClcblxuICBkaWRTaG93OiAtPlxuICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuY2xhc3NMaXN0LmFkZCgnZmluZC12aXNpYmxlJylcbiAgICByZXR1cm4gaWYgQHRvb2x0aXBTdWJzY3JpcHRpb25zP1xuXG4gICAgQHVwZGF0ZVJlcGxhY2VBbGxCdXR0b25FbmFibGVtZW50KClcbiAgICBAdG9vbHRpcFN1YnNjcmlwdGlvbnMgPSBzdWJzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAcmVnZXhPcHRpb25CdXR0b24sXG4gICAgICB0aXRsZTogXCJVc2UgUmVnZXhcIlxuICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdwcm9qZWN0LWZpbmQ6dG9nZ2xlLXJlZ2V4LW9wdGlvbicsXG4gICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAZmluZEVkaXRvci5lbGVtZW50XG5cbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAY2FzZU9wdGlvbkJ1dHRvbixcbiAgICAgIHRpdGxlOiBcIk1hdGNoIENhc2VcIixcbiAgICAgIGtleUJpbmRpbmdDb21tYW5kOiAncHJvamVjdC1maW5kOnRvZ2dsZS1jYXNlLW9wdGlvbicsXG4gICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAZmluZEVkaXRvci5lbGVtZW50XG5cbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAd2hvbGVXb3JkT3B0aW9uQnV0dG9uLFxuICAgICAgdGl0bGU6IFwiV2hvbGUgV29yZFwiLFxuICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdwcm9qZWN0LWZpbmQ6dG9nZ2xlLXdob2xlLXdvcmQtb3B0aW9uJyxcbiAgICAgIGtleUJpbmRpbmdUYXJnZXQ6IEBmaW5kRWRpdG9yLmVsZW1lbnRcblxuICAgIHN1YnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBmaW5kQWxsQnV0dG9uLFxuICAgICAgdGl0bGU6IFwiRmluZCBBbGxcIixcbiAgICAgIGtleUJpbmRpbmdDb21tYW5kOiAnZmluZC1hbmQtcmVwbGFjZTpzZWFyY2gnLFxuICAgICAga2V5QmluZGluZ1RhcmdldDogQGZpbmRFZGl0b3IuZWxlbWVudFxuXG4gIGRpZEhpZGU6IC0+XG4gICAgQGhpZGVBbGxUb29sdGlwcygpXG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiAgICB3b3Jrc3BhY2VFbGVtZW50LmZvY3VzKClcbiAgICB3b3Jrc3BhY2VFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2ZpbmQtdmlzaWJsZScpXG5cbiAgaGlkZUFsbFRvb2x0aXBzOiAtPlxuICAgIEB0b29sdGlwU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAdG9vbHRpcFN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgaGFuZGxlRXZlbnRzOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6dXNlLXNlbGVjdGlvbi1hcy1maW5kLXBhdHRlcm4nOiBAc2V0U2VsZWN0aW9uQXNGaW5kUGF0dGVyblxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LFxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6Zm9jdXMtbmV4dCc6ID0+IEBmb2N1c05leHRFbGVtZW50KDEpXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpmb2N1cy1wcmV2aW91cyc6ID0+IEBmb2N1c05leHRFbGVtZW50KC0xKVxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEBjb25maXJtKClcbiAgICAgICdjb3JlOmNsb3NlJzogPT4gQHBhbmVsPy5oaWRlKClcbiAgICAgICdjb3JlOmNhbmNlbCc6ID0+IEBwYW5lbD8uaGlkZSgpXG4gICAgICAncHJvamVjdC1maW5kOmNvbmZpcm0nOiA9PiBAY29uZmlybSgpXG4gICAgICAncHJvamVjdC1maW5kOnRvZ2dsZS1yZWdleC1vcHRpb24nOiA9PiBAdG9nZ2xlUmVnZXhPcHRpb24oKVxuICAgICAgJ3Byb2plY3QtZmluZDp0b2dnbGUtY2FzZS1vcHRpb24nOiA9PiBAdG9nZ2xlQ2FzZU9wdGlvbigpXG4gICAgICAncHJvamVjdC1maW5kOnRvZ2dsZS13aG9sZS13b3JkLW9wdGlvbic6ID0+IEB0b2dnbGVXaG9sZVdvcmRPcHRpb24oKVxuICAgICAgJ3Byb2plY3QtZmluZDpyZXBsYWNlLWFsbCc6ID0+IEByZXBsYWNlQWxsKClcblxuICAgIHVwZGF0ZUludGVyZmFjZUZvclNlYXJjaGluZyA9ID0+XG4gICAgICBAc2V0SW5mb01lc3NhZ2UoJ1NlYXJjaGluZy4uLicpXG5cbiAgICB1cGRhdGVJbnRlcmZhY2VGb3JSZXN1bHRzID0gKHJlc3VsdHMpID0+XG4gICAgICByZXR1cm4gQHBhbmVsPy5oaWRlKCkgaWYgYXRvbS5jb25maWcuZ2V0KCdmaW5kLWFuZC1yZXBsYWNlLmNsb3NlRmluZFBhbmVsQWZ0ZXJTZWFyY2gnKVxuICAgICAgaWYgcmVzdWx0cy5tYXRjaENvdW50IGlzIDAgYW5kIHJlc3VsdHMuZmluZFBhdHRlcm4gaXMgJydcbiAgICAgICAgQGNsZWFyTWVzc2FnZXMoKVxuICAgICAgZWxzZVxuICAgICAgICBAZ2VuZXJhdGVSZXN1bHRzTWVzc2FnZShyZXN1bHRzKVxuICAgICAgQHVwZGF0ZVJlcGxhY2VBbGxCdXR0b25FbmFibGVtZW50KHJlc3VsdHMpXG5cbiAgICByZXNldEludGVyZmFjZSA9ID0+XG4gICAgICBAY2xlYXJNZXNzYWdlcygpXG4gICAgICBAdXBkYXRlUmVwbGFjZUFsbEJ1dHRvbkVuYWJsZW1lbnQobnVsbClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRDbGVhcihyZXNldEludGVyZmFjZSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkQ2xlYXJSZXBsYWNlbWVudFN0YXRlKHVwZGF0ZUludGVyZmFjZUZvclJlc3VsdHMpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZFN0YXJ0U2VhcmNoaW5nKHVwZGF0ZUludGVyZmFjZUZvclNlYXJjaGluZylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkRmluaXNoU2VhcmNoaW5nKHVwZGF0ZUludGVyZmFjZUZvclJlc3VsdHMpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLm9uRGlkQ2hhbmdlIEB1cGRhdGVPcHRpb25WaWV3c1xuXG4gICAgQG9uICdmb2N1cycsIChlKSA9PiBAZmluZEVkaXRvci5mb2N1cygpXG4gICAgQHJlZ2V4T3B0aW9uQnV0dG9uLmNsaWNrID0+IEB0b2dnbGVSZWdleE9wdGlvbigpXG4gICAgQGNhc2VPcHRpb25CdXR0b24uY2xpY2sgPT4gQHRvZ2dsZUNhc2VPcHRpb24oKVxuICAgIEB3aG9sZVdvcmRPcHRpb25CdXR0b24uY2xpY2sgPT4gQHRvZ2dsZVdob2xlV29yZE9wdGlvbigpXG4gICAgQHJlcGxhY2VBbGxCdXR0b24ub24gJ2NsaWNrJywgPT4gQHJlcGxhY2VBbGwoKVxuICAgIEBmaW5kQWxsQnV0dG9uLm9uICdjbGljaycsID0+IEBzZWFyY2goKVxuXG4gICAgZm9jdXNDYWxsYmFjayA9ID0+IEBvbmx5UnVuSWZDaGFuZ2VkID0gZmFsc2VcbiAgICAkKHdpbmRvdykub24gJ2ZvY3VzJywgZm9jdXNDYWxsYmFja1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgJCh3aW5kb3cpLm9mZiAnZm9jdXMnLCBmb2N1c0NhbGxiYWNrXG5cbiAgICBAZmluZEVkaXRvci5nZXRNb2RlbCgpLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlID0+XG4gICAgICBAdXBkYXRlUmVwbGFjZUFsbEJ1dHRvbkVuYWJsZW1lbnQoQG1vZGVsLmdldFJlc3VsdHNTdW1tYXJ5KCkpXG4gICAgQGhhbmRsZUV2ZW50c0ZvclJlcGxhY2UoKVxuXG4gIGhhbmRsZUV2ZW50c0ZvclJlcGxhY2U6IC0+XG4gICAgQHJlcGxhY2VFZGl0b3IuZ2V0TW9kZWwoKS5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSA9PiBAbW9kZWwuY2xlYXJSZXBsYWNlbWVudFN0YXRlKClcbiAgICBAcmVwbGFjZUVkaXRvci5nZXRNb2RlbCgpLm9uRGlkU3RvcENoYW5naW5nID0+IEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLnNldChyZXBsYWNlUGF0dGVybjogQHJlcGxhY2VFZGl0b3IuZ2V0VGV4dCgpKVxuICAgIEByZXBsYWNlbWVudHNNYWRlID0gMFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRTdGFydFJlcGxhY2luZyAocHJvbWlzZSkgPT5cbiAgICAgIEByZXBsYWNlbWVudHNNYWRlID0gMFxuICAgICAgQHJlcGxhY21lbnRJbmZvQmxvY2suc2hvdygpXG4gICAgICBAcmVwbGFjZW1lbnRQcm9ncmVzcy5yZW1vdmVBdHRyKCd2YWx1ZScpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkUmVwbGFjZVBhdGggKHJlc3VsdCkgPT5cbiAgICAgIEByZXBsYWNlbWVudHNNYWRlKytcbiAgICAgIEByZXBsYWNlbWVudFByb2dyZXNzWzBdLnZhbHVlID0gQHJlcGxhY2VtZW50c01hZGUgLyBAbW9kZWwuZ2V0UGF0aENvdW50KClcbiAgICAgIEByZXBsYWNtZW50SW5mby50ZXh0KFwiUmVwbGFjZWQgI3tAcmVwbGFjZW1lbnRzTWFkZX0gb2YgI3tfLnBsdXJhbGl6ZShAbW9kZWwuZ2V0UGF0aENvdW50KCksICdmaWxlJyl9XCIpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkRmluaXNoUmVwbGFjaW5nIChyZXN1bHQpID0+IEBvbkZpbmlzaGVkUmVwbGFjaW5nKHJlc3VsdClcblxuICBmb2N1c05leHRFbGVtZW50OiAoZGlyZWN0aW9uKSAtPlxuICAgIGVsZW1lbnRzID0gW0BmaW5kRWRpdG9yLCBAcmVwbGFjZUVkaXRvciwgQHBhdGhzRWRpdG9yXVxuICAgIGZvY3VzZWRFbGVtZW50ID0gXy5maW5kIGVsZW1lbnRzLCAoZWwpIC0+IGVsLmhhc0NsYXNzKCdpcy1mb2N1c2VkJylcbiAgICBmb2N1c2VkSW5kZXggPSBlbGVtZW50cy5pbmRleE9mIGZvY3VzZWRFbGVtZW50XG5cbiAgICBmb2N1c2VkSW5kZXggPSBmb2N1c2VkSW5kZXggKyBkaXJlY3Rpb25cbiAgICBmb2N1c2VkSW5kZXggPSAwIGlmIGZvY3VzZWRJbmRleCA+PSBlbGVtZW50cy5sZW5ndGhcbiAgICBmb2N1c2VkSW5kZXggPSBlbGVtZW50cy5sZW5ndGggLSAxIGlmIGZvY3VzZWRJbmRleCA8IDBcbiAgICBlbGVtZW50c1tmb2N1c2VkSW5kZXhdLmZvY3VzKClcbiAgICBlbGVtZW50c1tmb2N1c2VkSW5kZXhdLmdldE1vZGVsPygpLnNlbGVjdEFsbCgpXG5cbiAgZm9jdXNGaW5kRWxlbWVudDogLT5cbiAgICBzZWxlY3RlZFRleHQgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFNlbGVjdGVkVGV4dD8oKVxuICAgIGlmIHNlbGVjdGVkVGV4dCBhbmQgc2VsZWN0ZWRUZXh0LmluZGV4T2YoJ1xcbicpIDwgMFxuICAgICAgc2VsZWN0ZWRUZXh0ID0gVXRpbC5lc2NhcGVSZWdleChzZWxlY3RlZFRleHQpIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLnVzZVJlZ2V4XG4gICAgICBAZmluZEVkaXRvci5zZXRUZXh0KHNlbGVjdGVkVGV4dClcbiAgICBAZmluZEVkaXRvci5mb2N1cygpXG4gICAgQGZpbmRFZGl0b3IuZ2V0TW9kZWwoKS5zZWxlY3RBbGwoKVxuXG4gIGNvbmZpcm06IC0+XG4gICAgaWYgQGZpbmRFZGl0b3IuZ2V0VGV4dCgpLmxlbmd0aCBpcyAwXG4gICAgICBAbW9kZWwuY2xlYXIoKVxuICAgICAgcmV0dXJuXG5cbiAgICBAZmluZEhpc3RvcnlDeWNsZXIuc3RvcmUoKVxuICAgIEByZXBsYWNlSGlzdG9yeUN5Y2xlci5zdG9yZSgpXG4gICAgQHBhdGhzSGlzdG9yeUN5Y2xlci5zdG9yZSgpXG5cbiAgICBzZWFyY2hQcm9taXNlID0gQHNlYXJjaCh7QG9ubHlSdW5JZkNoYW5nZWR9KVxuICAgIEBvbmx5UnVuSWZDaGFuZ2VkID0gdHJ1ZVxuICAgIHNlYXJjaFByb21pc2VcblxuICBzZWFyY2g6IChvcHRpb25zPXt9KSAtPlxuICAgICMgV2UgYWx3YXlzIHdhbnQgdG8gc2V0IHRoZSBvcHRpb25zIHBhc3NlZCBpbiwgZXZlbiBpZiB3ZSBkb250IGVuZCB1cCBkb2luZyB0aGUgc2VhcmNoXG4gICAgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkuc2V0KG9wdGlvbnMpXG5cbiAgICBmaW5kUGF0dGVybiA9IEBmaW5kRWRpdG9yLmdldFRleHQoKVxuICAgIHBhdGhzUGF0dGVybiA9IEBwYXRoc0VkaXRvci5nZXRUZXh0KClcbiAgICByZXBsYWNlUGF0dGVybiA9IEByZXBsYWNlRWRpdG9yLmdldFRleHQoKVxuXG4gICAge29ubHlSdW5JZkFjdGl2ZSwgb25seVJ1bklmQ2hhbmdlZH0gPSBvcHRpb25zXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIGlmIChvbmx5UnVuSWZBY3RpdmUgYW5kIG5vdCBAbW9kZWwuYWN0aXZlKSBvciBub3QgZmluZFBhdHRlcm5cblxuICAgIEBzaG93UmVzdWx0UGFuZSgpLnRoZW4gPT5cbiAgICAgIHRyeVxuICAgICAgICBAbW9kZWwuc2VhcmNoKGZpbmRQYXR0ZXJuLCBwYXRoc1BhdHRlcm4sIHJlcGxhY2VQYXR0ZXJuLCBvcHRpb25zKVxuICAgICAgY2F0Y2ggZVxuICAgICAgICBAc2V0RXJyb3JNZXNzYWdlKGUubWVzc2FnZSlcblxuICByZXBsYWNlQWxsOiAtPlxuICAgIHJldHVybiBhdG9tLmJlZXAoKSB1bmxlc3MgQG1vZGVsLm1hdGNoQ291bnRcbiAgICBmaW5kUGF0dGVybiA9IEBtb2RlbC5nZXRMYXN0RmluZFBhdHRlcm4oKVxuICAgIGN1cnJlbnRQYXR0ZXJuID0gQGZpbmRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgaWYgZmluZFBhdHRlcm4gYW5kIGZpbmRQYXR0ZXJuIGlzbnQgY3VycmVudFBhdHRlcm5cbiAgICAgIGF0b20uY29uZmlybVxuICAgICAgICBtZXNzYWdlOiBcIlRoZSBzZWFyY2hlZCBwYXR0ZXJuICcje2ZpbmRQYXR0ZXJufScgd2FzIGNoYW5nZWQgdG8gJyN7Y3VycmVudFBhdHRlcm59J1wiXG4gICAgICAgIGRldGFpbGVkTWVzc2FnZTogXCJQbGVhc2UgcnVuIHRoZSBzZWFyY2ggd2l0aCB0aGUgbmV3IHBhdHRlcm4gJyN7Y3VycmVudFBhdHRlcm59JyBiZWZvcmUgcnVubmluZyBhIHJlcGxhY2UtYWxsXCJcbiAgICAgICAgYnV0dG9uczogWydPSyddXG4gICAgICByZXR1cm5cblxuICAgIEBzaG93UmVzdWx0UGFuZSgpLnRoZW4gPT5cbiAgICAgIHBhdGhzUGF0dGVybiA9IEBwYXRoc0VkaXRvci5nZXRUZXh0KClcbiAgICAgIHJlcGxhY2VQYXR0ZXJuID0gQHJlcGxhY2VFZGl0b3IuZ2V0VGV4dCgpXG5cbiAgICAgIG1lc3NhZ2UgPSBcIlRoaXMgd2lsbCByZXBsYWNlICcje2ZpbmRQYXR0ZXJufScgd2l0aCAnI3tyZXBsYWNlUGF0dGVybn0nICN7Xy5wbHVyYWxpemUoQG1vZGVsLm1hdGNoQ291bnQsICd0aW1lJyl9IGluICN7Xy5wbHVyYWxpemUoQG1vZGVsLnBhdGhDb3VudCwgJ2ZpbGUnKX1cIlxuICAgICAgYnV0dG9uQ2hvc2VuID0gYXRvbS5jb25maXJtXG4gICAgICAgIG1lc3NhZ2U6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcmVwbGFjZSBhbGw/J1xuICAgICAgICBkZXRhaWxlZE1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgYnV0dG9uczogWydPSycsICdDYW5jZWwnXVxuXG4gICAgICBpZiBidXR0b25DaG9zZW4gaXMgMFxuICAgICAgICBAY2xlYXJNZXNzYWdlcygpXG4gICAgICAgIEBtb2RlbC5yZXBsYWNlKHBhdGhzUGF0dGVybiwgcmVwbGFjZVBhdHRlcm4sIEBtb2RlbC5nZXRQYXRocygpKVxuXG4gIGRpcmVjdG9yeVBhdGhGb3JFbGVtZW50OiAoZWxlbWVudCkgLT5cbiAgICBlbGVtZW50UGF0aCA9IGVsZW1lbnQ/LmRhdGFzZXQucGF0aCA/IGVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXBhdGhdJyk/LmRhdGFzZXQucGF0aFxuXG4gICAgIyBUcmF2ZXJzZSB1cCB0aGUgRE9NIGlmIHRoZSBlbGVtZW50IGFuZCBpdHMgY2hpbGRyZW4gZG9uJ3QgaGF2ZSBhIHBhdGhcbiAgICB1bmxlc3MgZWxlbWVudFBhdGhcbiAgICAgIHdoaWxlIGVsZW1lbnQ/XG4gICAgICAgIGVsZW1lbnRQYXRoID0gZWxlbWVudC5kYXRhc2V0LnBhdGhcbiAgICAgICAgYnJlYWsgaWYgZWxlbWVudFBhdGhcbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudFxuICAgICAgIyBVc2UgdGhlIGFjdGl2ZSBlZGl0b3IgcGF0aCBpZiBhbGwgZWxlbWVudHMgZG9uJ3QgaGF2ZSBhIHBhdGhcbiAgICAgIHVubGVzcyBlbGVtZW50UGF0aFxuICAgICAgICBlbGVtZW50UGF0aCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0UGF0aCgpXG5cbiAgICBpZiBmcy5pc0ZpbGVTeW5jKGVsZW1lbnRQYXRoKVxuICAgICAgcmVxdWlyZSgncGF0aCcpLmRpcm5hbWUoZWxlbWVudFBhdGgpXG4gICAgZWxzZVxuICAgICAgZWxlbWVudFBhdGhcblxuICBmaW5kSW5DdXJyZW50bHlTZWxlY3RlZERpcmVjdG9yeTogKHNlbGVjdGVkRWxlbWVudCkgLT5cbiAgICBpZiBhYnNQYXRoID0gQGRpcmVjdG9yeVBhdGhGb3JFbGVtZW50KHNlbGVjdGVkRWxlbWVudClcbiAgICAgIFtyb290UGF0aCwgcmVsUGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoYWJzUGF0aClcbiAgICAgIGlmIHJvb3RQYXRoPyBhbmQgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubGVuZ3RoID4gMVxuICAgICAgICByZWxQYXRoID0gcGF0aC5qb2luKHBhdGguYmFzZW5hbWUocm9vdFBhdGgpLCByZWxQYXRoKVxuICAgICAgQHBhdGhzRWRpdG9yLnNldFRleHQocmVsUGF0aClcbiAgICAgIEBmaW5kRWRpdG9yLmZvY3VzKClcbiAgICAgIEBmaW5kRWRpdG9yLmdldE1vZGVsKCkuc2VsZWN0QWxsKClcblxuICBzaG93UmVzdWx0UGFuZTogLT5cbiAgICBvcHRpb25zID0ge3NlYXJjaEFsbFBhbmVzOiB0cnVlfVxuICAgIG9wdGlvbnMuc3BsaXQgPSAncmlnaHQnIGlmIGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5vcGVuUHJvamVjdEZpbmRSZXN1bHRzSW5SaWdodFBhbmUnKVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oUmVzdWx0c1BhbmVWaWV3LlVSSSwgb3B0aW9ucylcblxuICBvbkZpbmlzaGVkUmVwbGFjaW5nOiAocmVzdWx0cykgLT5cbiAgICBhdG9tLmJlZXAoKSB1bmxlc3MgcmVzdWx0cy5yZXBsYWNlZFBhdGhDb3VudFxuICAgIEByZXBsYWNtZW50SW5mb0Jsb2NrLmhpZGUoKVxuXG4gIGdlbmVyYXRlUmVzdWx0c01lc3NhZ2U6IChyZXN1bHRzKSA9PlxuICAgIG1lc3NhZ2UgPSBVdGlsLmdldFNlYXJjaFJlc3VsdHNNZXNzYWdlKHJlc3VsdHMpXG4gICAgbWVzc2FnZSA9IFV0aWwuZ2V0UmVwbGFjZW1lbnRSZXN1bHRzTWVzc2FnZShyZXN1bHRzKSBpZiByZXN1bHRzLnJlcGxhY2VkUGF0aENvdW50P1xuICAgIEBzZXRJbmZvTWVzc2FnZShtZXNzYWdlKVxuXG4gIGNsZWFyTWVzc2FnZXM6IC0+XG4gICAgdGhpcy5yZW1vdmVDbGFzcygnaGFzLXJlc3VsdHMgaGFzLW5vLXJlc3VsdHMnKVxuICAgIEBzZXRJbmZvTWVzc2FnZSgnRmluZCBpbiBQcm9qZWN0IDxzcGFuIGNsYXNzPVwic3VidGxlLWluZm8tbWVzc2FnZVwiPkNsb3NlIHRoaXMgcGFuZWwgd2l0aCB0aGUgPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRcIj5lc2M8L3NwYW4+IGtleTwvc3Bhbj4nKS5yZW1vdmVDbGFzcygndGV4dC1lcnJvcicpXG4gICAgQHJlcGxhY21lbnRJbmZvQmxvY2suaGlkZSgpXG5cbiAgc2V0SW5mb01lc3NhZ2U6IChpbmZvTWVzc2FnZSkgLT5cbiAgICBAZGVzY3JpcHRpb25MYWJlbC5odG1sKGluZm9NZXNzYWdlKS5yZW1vdmVDbGFzcygndGV4dC1lcnJvcicpXG5cbiAgc2V0RXJyb3JNZXNzYWdlOiAoZXJyb3JNZXNzYWdlKSAtPlxuICAgIEBkZXNjcmlwdGlvbkxhYmVsLmh0bWwoZXJyb3JNZXNzYWdlKS5hZGRDbGFzcygndGV4dC1lcnJvcicpXG5cbiAgdXBkYXRlUmVwbGFjZUFsbEJ1dHRvbkVuYWJsZW1lbnQ6IChyZXN1bHRzKSAtPlxuICAgIGNhblJlcGxhY2UgPSByZXN1bHRzPy5tYXRjaENvdW50IGFuZCByZXN1bHRzPy5maW5kUGF0dGVybiBpcyBAZmluZEVkaXRvci5nZXRUZXh0KClcbiAgICByZXR1cm4gaWYgY2FuUmVwbGFjZSBhbmQgbm90IEByZXBsYWNlQWxsQnV0dG9uWzBdLmNsYXNzTGlzdC5jb250YWlucygnZGlzYWJsZWQnKVxuXG4gICAgQHJlcGxhY2VUb29sdGlwU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHJlcGxhY2VUb29sdGlwU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBpZiBjYW5SZXBsYWNlXG4gICAgICBAcmVwbGFjZUFsbEJ1dHRvblswXS5jbGFzc0xpc3QucmVtb3ZlKCdkaXNhYmxlZCcpXG4gICAgICBAcmVwbGFjZVRvb2x0aXBTdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAcmVwbGFjZUFsbEJ1dHRvbixcbiAgICAgICAgdGl0bGU6IFwiUmVwbGFjZSBBbGxcIixcbiAgICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdwcm9qZWN0LWZpbmQ6cmVwbGFjZS1hbGwnLFxuICAgICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAcmVwbGFjZUVkaXRvci5lbGVtZW50XG4gICAgZWxzZVxuICAgICAgQHJlcGxhY2VBbGxCdXR0b25bMF0uY2xhc3NMaXN0LmFkZCgnZGlzYWJsZWQnKVxuICAgICAgQHJlcGxhY2VUb29sdGlwU3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHJlcGxhY2VBbGxCdXR0b24sXG4gICAgICAgIHRpdGxlOiBcIlJlcGxhY2UgQWxsIFtydW4gYSBzZWFyY2ggdG8gZW5hYmxlXVwiXG5cbiAgc2V0U2VsZWN0aW9uQXNGaW5kUGF0dGVybjogPT5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgaWYgZWRpdG9yPy5nZXRTZWxlY3RlZFRleHQ/XG4gICAgICBwYXR0ZXJuID0gZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpIG9yIGVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKVxuICAgICAgcGF0dGVybiA9IFV0aWwuZXNjYXBlUmVnZXgocGF0dGVybikgaWYgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkudXNlUmVnZXhcbiAgICAgIEBmaW5kRWRpdG9yLnNldFRleHQocGF0dGVybikgaWYgcGF0dGVyblxuXG4gIHVwZGF0ZU9wdGlvblZpZXdzOiA9PlxuICAgIEB1cGRhdGVPcHRpb25CdXR0b25zKClcbiAgICBAdXBkYXRlT3B0aW9uc0xhYmVsKClcbiAgICBAdXBkYXRlU3ludGF4SGlnaGxpZ2h0aW5nKClcblxuICB1cGRhdGVTeW50YXhIaWdobGlnaHRpbmc6IC0+XG4gICAgaWYgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkudXNlUmVnZXhcbiAgICAgIEBmaW5kRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcy5yZWdleHAnKSlcbiAgICAgIEByZXBsYWNlRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcy5yZWdleHAucmVwbGFjZW1lbnQnKSlcbiAgICBlbHNlXG4gICAgICBAZmluZEVkaXRvci5nZXRNb2RlbCgpLnNldEdyYW1tYXIoYXRvbS5ncmFtbWFycy5udWxsR3JhbW1hcilcbiAgICAgIEByZXBsYWNlRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLm51bGxHcmFtbWFyKVxuXG4gIHVwZGF0ZU9wdGlvbnNMYWJlbDogLT5cbiAgICBsYWJlbCA9IFtdXG4gICAgbGFiZWwucHVzaCgnUmVnZXgnKSBpZiBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleFxuICAgIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmNhc2VTZW5zaXRpdmVcbiAgICAgIGxhYmVsLnB1c2goJ0Nhc2UgU2Vuc2l0aXZlJylcbiAgICBlbHNlXG4gICAgICBsYWJlbC5wdXNoKCdDYXNlIEluc2Vuc2l0aXZlJylcbiAgICBsYWJlbC5wdXNoKCdXaG9sZSBXb3JkJykgaWYgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkud2hvbGVXb3JkXG4gICAgQG9wdGlvbnNMYWJlbC50ZXh0KGxhYmVsLmpvaW4oJywgJykpXG5cbiAgdXBkYXRlT3B0aW9uQnV0dG9uczogLT5cbiAgICBAc2V0T3B0aW9uQnV0dG9uU3RhdGUoQHJlZ2V4T3B0aW9uQnV0dG9uLCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleClcbiAgICBAc2V0T3B0aW9uQnV0dG9uU3RhdGUoQGNhc2VPcHRpb25CdXR0b24sIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmNhc2VTZW5zaXRpdmUpXG4gICAgQHNldE9wdGlvbkJ1dHRvblN0YXRlKEB3aG9sZVdvcmRPcHRpb25CdXR0b24sIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLndob2xlV29yZClcblxuICBzZXRPcHRpb25CdXR0b25TdGF0ZTogKG9wdGlvbkJ1dHRvbiwgc2VsZWN0ZWQpIC0+XG4gICAgaWYgc2VsZWN0ZWRcbiAgICAgIG9wdGlvbkJ1dHRvbi5hZGRDbGFzcyAnc2VsZWN0ZWQnXG4gICAgZWxzZVxuICAgICAgb3B0aW9uQnV0dG9uLnJlbW92ZUNsYXNzICdzZWxlY3RlZCdcblxuICB0b2dnbGVSZWdleE9wdGlvbjogLT5cbiAgICBAc2VhcmNoKG9ubHlSdW5JZkFjdGl2ZTogdHJ1ZSwgdXNlUmVnZXg6IG5vdCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleClcblxuICB0b2dnbGVDYXNlT3B0aW9uOiAtPlxuICAgIEBzZWFyY2gob25seVJ1bklmQWN0aXZlOiB0cnVlLCBjYXNlU2Vuc2l0aXZlOiBub3QgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkuY2FzZVNlbnNpdGl2ZSlcblxuICB0b2dnbGVXaG9sZVdvcmRPcHRpb246IC0+XG4gICAgQHNlYXJjaChvbmx5UnVuSWZBY3RpdmU6IHRydWUsIHdob2xlV29yZDogbm90IEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLndob2xlV29yZClcbiJdfQ==
