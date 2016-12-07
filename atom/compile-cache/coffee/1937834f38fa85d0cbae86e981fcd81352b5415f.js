(function() {
  var $, $$$, CompositeDisposable, FindView, TextEditorView, Util, View, _, buildTextEditor, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, $$$ = ref.$$$, View = ref.View, TextEditorView = ref.TextEditorView;

  CompositeDisposable = require('atom').CompositeDisposable;

  Util = require('./project/util');

  buildTextEditor = require('./build-text-editor');

  module.exports = FindView = (function(superClass) {
    extend(FindView, superClass);

    function FindView() {
      this.toggleWholeWordOption = bind(this.toggleWholeWordOption, this);
      this.toggleSelectionOption = bind(this.toggleSelectionOption, this);
      this.toggleCaseOption = bind(this.toggleCaseOption, this);
      this.toggleRegexOption = bind(this.toggleRegexOption, this);
      this.anyMarkersAreSelected = bind(this.anyMarkersAreSelected, this);
      this.updateOptionViews = bind(this.updateOptionViews, this);
      this.findPreviousSelected = bind(this.findPreviousSelected, this);
      this.findNextSelected = bind(this.findNextSelected, this);
      this.setSelectionAsFindPattern = bind(this.setSelectionAsFindPattern, this);
      this.selectAllMarkers = bind(this.selectAllMarkers, this);
      this.firstMarkerIndexStartingFromCursor = bind(this.firstMarkerIndexStartingFromCursor, this);
      this.selectFirstMarkerBeforeCursor = bind(this.selectFirstMarkerBeforeCursor, this);
      this.selectFirstMarkerStartingFromCursor = bind(this.selectFirstMarkerStartingFromCursor, this);
      this.selectFirstMarkerAfterCursor = bind(this.selectFirstMarkerAfterCursor, this);
      this.updateResultCounter = bind(this.updateResultCounter, this);
      this.findError = bind(this.findError, this);
      this.markersUpdated = bind(this.markersUpdated, this);
      this.replaceAll = bind(this.replaceAll, this);
      this.replacePrevious = bind(this.replacePrevious, this);
      this.replaceNext = bind(this.replaceNext, this);
      this.findAndSelectResult = bind(this.findAndSelectResult, this);
      this.findPrevious = bind(this.findPrevious, this);
      this.findNext = bind(this.findNext, this);
      this.findAll = bind(this.findAll, this);
      this.toggleFocus = bind(this.toggleFocus, this);
      this.focusReplaceEditor = bind(this.focusReplaceEditor, this);
      this.focusFindEditor = bind(this.focusFindEditor, this);
      return FindView.__super__.constructor.apply(this, arguments);
    }

    FindView.content = function(model, arg) {
      var findBuffer, findEditor, replaceBuffer, replaceEditor;
      findBuffer = arg.findBuffer, replaceBuffer = arg.replaceBuffer;
      findEditor = buildTextEditor({
        mini: true,
        tabLength: 2,
        softTabs: true,
        softWrapped: false,
        buffer: findBuffer,
        placeholderText: 'Find in current buffer'
      });
      replaceEditor = buildTextEditor({
        mini: true,
        tabLength: 2,
        softTabs: true,
        softWrapped: false,
        buffer: replaceBuffer,
        placeholderText: 'Replace in current buffer'
      });
      return this.div({
        tabIndex: -1,
        "class": 'find-and-replace'
      }, (function(_this) {
        return function() {
          _this.header({
            "class": 'header'
          }, function() {
            _this.span({
              outlet: 'descriptionLabel',
              "class": 'header-item description'
            }, 'Find in Current Buffer');
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
            "class": 'input-block find-container'
          }, function() {
            _this.div({
              "class": 'input-block-item input-block-item--flex editor-container'
            }, function() {
              _this.subview('findEditor', new TextEditorView({
                editor: findEditor
              }));
              return _this.div({
                "class": 'find-meta-container'
              }, function() {
                return _this.span({
                  outlet: 'resultCounter',
                  "class": 'text-subtle result-counter'
                }, '');
              });
            });
            return _this.div({
              "class": 'input-block-item'
            }, function() {
              _this.div({
                "class": 'btn-group btn-group-find'
              }, function() {
                return _this.button({
                  outlet: 'nextButton',
                  "class": 'btn'
                }, 'Find');
              });
              return _this.div({
                "class": 'btn-group btn-toggle btn-group-options'
              }, function() {
                _this.button({
                  outlet: 'regexOptionButton',
                  "class": 'btn'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-regex" /></svg>');
                });
                _this.button({
                  outlet: 'caseOptionButton',
                  "class": 'btn'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-case" /></svg>');
                });
                _this.button({
                  outlet: 'selectionOptionButton',
                  "class": 'btn option-selection'
                }, function() {
                  return _this.raw('<svg class="icon"><use xlink:href="#find-and-replace-icon-selection" /></svg>');
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
              _this.div({
                "class": 'btn-group btn-group-replace'
              }, function() {
                return _this.button({
                  outlet: 'replaceNextButton',
                  "class": 'btn btn-next'
                }, 'Replace');
              });
              return _this.div({
                "class": 'btn-group btn-group-replace-all'
              }, function() {
                return _this.button({
                  outlet: 'replaceAllButton',
                  "class": 'btn btn-all'
                }, 'Replace All');
              });
            });
          });
          return _this.raw('<svg xmlns="http://www.w3.org/2000/svg" style="display: none;"> <symbol id="find-and-replace-icon-regex" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd"> <rect x="3" y="10" width="3" height="3" rx="1"></rect> <rect x="12" y="3" width="2" height="9" rx="1"></rect> <rect transform="translate(13.000000, 7.500000) rotate(60.000000) translate(-13.000000, -7.500000) " x="12" y="3" width="2" height="9" rx="1"></rect> <rect transform="translate(13.000000, 7.500000) rotate(-60.000000) translate(-13.000000, -7.500000) " x="12" y="3" width="2" height="9" rx="1"></rect> </symbol> <symbol id="find-and-replace-icon-case" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd"> <path d="M10.919,13 L9.463,13 C9.29966585,13 9.16550052,12.9591671 9.0605,12.8775 C8.95549947,12.7958329 8.8796669,12.6943339 8.833,12.573 L8.077,10.508 L3.884,10.508 L3.128,12.573 C3.09066648,12.6803339 3.01716722,12.7783329 2.9075,12.867 C2.79783279,12.9556671 2.66366746,13 2.505,13 L1.042,13 L5.018,2.878 L6.943,2.878 L10.919,13 Z M4.367,9.178 L7.594,9.178 L6.362,5.811 C6.30599972,5.66166592 6.24416701,5.48550102 6.1765,5.2825 C6.108833,5.07949898 6.04233366,4.85900119 5.977,4.621 C5.91166634,4.85900119 5.84750032,5.08066564 5.7845,5.286 C5.72149969,5.49133436 5.65966697,5.67099923 5.599,5.825 L4.367,9.178 Z M18.892,13 L18.115,13 C17.9516658,13 17.8233338,12.9755002 17.73,12.9265 C17.6366662,12.8774998 17.5666669,12.7783341 17.52,12.629 L17.366,12.118 C17.1839991,12.2813341 17.0055009,12.4248327 16.8305,12.5485 C16.6554991,12.6721673 16.4746676,12.7759996 16.288,12.86 C16.1013324,12.9440004 15.903001,13.0069998 15.693,13.049 C15.4829989,13.0910002 15.2496679,13.112 14.993,13.112 C14.6896651,13.112 14.4096679,13.0711671 14.153,12.9895 C13.896332,12.9078329 13.6758342,12.7853342 13.4915,12.622 C13.3071657,12.4586658 13.1636672,12.2556679 13.061,12.013 C12.9583328,11.7703321 12.907,11.4880016 12.907,11.166 C12.907,10.895332 12.9781659,10.628168 13.1205,10.3645 C13.262834,10.100832 13.499665,9.8628344 13.831,9.6505 C14.162335,9.43816561 14.6033306,9.2620007 15.154,9.122 C15.7046694,8.9819993 16.3883292,8.90266676 17.205,8.884 L17.205,8.464 C17.205,7.98333093 17.103501,7.62750116 16.9005,7.3965 C16.697499,7.16549885 16.4023352,7.05 16.015,7.05 C15.7349986,7.05 15.5016676,7.08266634 15.315,7.148 C15.1283324,7.21333366 14.9661673,7.28683292 14.8285,7.3685 C14.6908326,7.45016707 14.5636672,7.52366634 14.447,7.589 C14.3303327,7.65433366 14.2020007,7.687 14.062,7.687 C13.9453327,7.687 13.8450004,7.65666697 13.761,7.596 C13.6769996,7.53533303 13.6093336,7.46066711 13.558,7.372 L13.243,6.819 C14.0690041,6.06299622 15.0653275,5.685 16.232,5.685 C16.6520021,5.685 17.0264983,5.75383264 17.3555,5.8915 C17.6845016,6.02916736 17.9633322,6.22049877 18.192,6.4655 C18.4206678,6.71050122 18.5944994,7.00333163 18.7135,7.344 C18.8325006,7.68466837 18.892,8.05799797 18.892,8.464 L18.892,13 Z M15.532,11.922 C15.7093342,11.922 15.8726659,11.9056668 16.022,11.873 C16.1713341,11.8403332 16.3124993,11.7913337 16.4455,11.726 C16.5785006,11.6606663 16.7068327,11.5801671 16.8305,11.4845 C16.9541673,11.3888329 17.0789993,11.2756673 17.205,11.145 L17.205,9.934 C16.7009975,9.95733345 16.279835,10.0004997 15.9415,10.0635 C15.603165,10.1265003 15.3313343,10.2069995 15.126,10.305 C14.9206656,10.4030005 14.7748337,10.5173327 14.6885,10.648 C14.6021662,10.7786673 14.559,10.9209992 14.559,11.075 C14.559,11.3783349 14.6488324,11.5953327 14.8285,11.726 C15.0081675,11.8566673 15.2426652,11.922 15.532,11.922 L15.532,11.922 Z"></path> </symbol> <symbol id="find-and-replace-icon-selection" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd"> <rect opacity="0.6" x="17" y="9" width="2" height="4"></rect> <rect opacity="0.6" x="14" y="9" width="2" height="4"></rect> <rect opacity="0.6" x="1" y="3" width="2" height="4"></rect> <rect x="1" y="9" width="11" height="4"></rect> <rect x="5" y="3" width="14" height="4"></rect> </symbol> <symbol id="find-and-replace-icon-word" viewBox="0 0 20 16" stroke="none" fill-rule="evenodd"> <rect opacity="0.6" x="1" y="3" width="2" height="6"></rect> <rect opacity="0.6" x="17" y="3" width="2" height="6"></rect> <rect x="6" y="3" width="2" height="6"></rect> <rect x="12" y="3" width="2" height="6"></rect> <rect x="9" y="3" width="2" height="6"></rect> <path d="M4.5,13 L15.5,13 L16,13 L16,12 L15.5,12 L4.5,12 L4,12 L4,13 L4.5,13 L4.5,13 Z"></path> <path d="M4,10.5 L4,12.5 L4,13 L5,13 L5,12.5 L5,10.5 L5,10 L4,10 L4,10.5 L4,10.5 Z"></path> <path d="M15,10.5 L15,12.5 L15,13 L16,13 L16,12.5 L16,10.5 L16,10 L15,10 L15,10.5 L15,10.5 Z"></path> </symbol> </svg>');
        };
      })(this));
    };

    FindView.prototype.initialize = function(model1, arg) {
      this.model = model1;
      this.findHistoryCycler = arg.findHistoryCycler, this.replaceHistoryCycler = arg.replaceHistoryCycler;
      this.subscriptions = new CompositeDisposable;
      this.findHistoryCycler.addEditorElement(this.findEditor.element);
      this.replaceHistoryCycler.addEditorElement(this.replaceEditor.element);
      this.handleEvents();
      this.clearMessage();
      this.updateOptionViews();
      this.updateReplaceEnablement();
      return this.createWrapIcon();
    };

    FindView.prototype.destroy = function() {
      var ref1, ref2;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      return (ref2 = this.tooltipSubscriptions) != null ? ref2.dispose() : void 0;
    };

    FindView.prototype.setPanel = function(panel) {
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

    FindView.prototype.didShow = function() {
      var subs;
      atom.views.getView(atom.workspace).classList.add('find-visible');
      if (this.tooltipSubscriptions != null) {
        return;
      }
      this.tooltipSubscriptions = subs = new CompositeDisposable;
      subs.add(atom.tooltips.add(this.regexOptionButton, {
        title: "Use Regex",
        keyBindingCommand: 'find-and-replace:toggle-regex-option',
        keyBindingTarget: this.findEditor.element
      }));
      subs.add(atom.tooltips.add(this.caseOptionButton, {
        title: "Match Case",
        keyBindingCommand: 'find-and-replace:toggle-case-option',
        keyBindingTarget: this.findEditor.element
      }));
      subs.add(atom.tooltips.add(this.selectionOptionButton, {
        title: "Only In Selection",
        keyBindingCommand: 'find-and-replace:toggle-selection-option',
        keyBindingTarget: this.findEditor.element
      }));
      subs.add(atom.tooltips.add(this.wholeWordOptionButton, {
        title: "Whole Word",
        keyBindingCommand: 'find-and-replace:toggle-whole-word-option',
        keyBindingTarget: this.findEditor.element
      }));
      return subs.add(atom.tooltips.add(this.nextButton, {
        title: "Find Next",
        keyBindingCommand: 'find-and-replace:find-next',
        keyBindingTarget: this.findEditor.element
      }));
    };

    FindView.prototype.didHide = function() {
      var workspaceElement;
      this.hideAllTooltips();
      workspaceElement = atom.views.getView(atom.workspace);
      workspaceElement.focus();
      return workspaceElement.classList.remove('find-visible');
    };

    FindView.prototype.hideAllTooltips = function() {
      this.tooltipSubscriptions.dispose();
      return this.tooltipSubscriptions = null;
    };

    FindView.prototype.handleEvents = function() {
      this.handleFindEvents();
      this.handleReplaceEvents();
      this.subscriptions.add(atom.commands.add(this.findEditor.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'find-and-replace:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'find-and-replace:show-previous': (function(_this) {
          return function() {
            return _this.showPrevious();
          };
        })(this),
        'find-and-replace:find-all': (function(_this) {
          return function() {
            return _this.findAll();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add(this.replaceEditor.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.replaceNext();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add(this.element, {
        'core:close': (function(_this) {
          return function() {
            var ref1;
            return (ref1 = _this.panel) != null ? ref1.hide() : void 0;
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            var ref1;
            return (ref1 = _this.panel) != null ? ref1.hide() : void 0;
          };
        })(this),
        'find-and-replace:focus-next': this.toggleFocus,
        'find-and-replace:focus-previous': this.toggleFocus,
        'find-and-replace:toggle-regex-option': this.toggleRegexOption,
        'find-and-replace:toggle-case-option': this.toggleCaseOption,
        'find-and-replace:toggle-selection-option': this.toggleSelectionOption,
        'find-and-replace:toggle-whole-word-option': this.toggleWholeWordOption
      }));
      this.subscriptions.add(this.model.onDidUpdate(this.markersUpdated));
      this.subscriptions.add(this.model.onDidError(this.findError));
      this.subscriptions.add(this.model.onDidChangeCurrentResult(this.updateResultCounter));
      this.subscriptions.add(this.model.getFindOptions().onDidChange(this.updateOptionViews));
      this.regexOptionButton.on('click', this.toggleRegexOption);
      this.caseOptionButton.on('click', this.toggleCaseOption);
      this.selectionOptionButton.on('click', this.toggleSelectionOption);
      this.wholeWordOptionButton.on('click', this.toggleWholeWordOption);
      this.on('focus', (function(_this) {
        return function() {
          return _this.findEditor.focus();
        };
      })(this));
      return this.find('button').on('click', function() {
        var workspaceElement;
        workspaceElement = atom.views.getView(atom.workspace);
        return workspaceElement.focus();
      });
    };

    FindView.prototype.handleFindEvents = function() {
      this.findEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.liveSearch();
        };
      })(this));
      this.nextButton.on('click', (function(_this) {
        return function(e) {
          if (e.shiftKey) {
            return _this.findPrevious({
              focusEditorAfter: true
            });
          } else {
            return _this.findNext({
              focusEditorAfter: true
            });
          }
        };
      })(this));
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'find-and-replace:find-next': (function(_this) {
          return function() {
            return _this.findNext({
              focusEditorAfter: true
            });
          };
        })(this),
        'find-and-replace:find-previous': (function(_this) {
          return function() {
            return _this.findPrevious({
              focusEditorAfter: true
            });
          };
        })(this),
        'find-and-replace:find-next-selected': this.findNextSelected,
        'find-and-replace:find-previous-selected': this.findPreviousSelected,
        'find-and-replace:use-selection-as-find-pattern': this.setSelectionAsFindPattern
      }));
    };

    FindView.prototype.handleReplaceEvents = function() {
      this.replaceNextButton.on('click', this.replaceNext);
      this.replaceAllButton.on('click', this.replaceAll);
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'find-and-replace:replace-previous': this.replacePrevious,
        'find-and-replace:replace-next': this.replaceNext,
        'find-and-replace:replace-all': this.replaceAll
      }));
    };

    FindView.prototype.focusFindEditor = function() {
      var ref1, selectedText;
      selectedText = (ref1 = atom.workspace.getActiveTextEditor()) != null ? typeof ref1.getSelectedText === "function" ? ref1.getSelectedText() : void 0 : void 0;
      if (selectedText && selectedText.indexOf('\n') < 0) {
        if (this.model.getFindOptions().useRegex) {
          selectedText = Util.escapeRegex(selectedText);
        }
        this.findEditor.setText(selectedText);
      }
      this.findEditor.focus();
      return this.findEditor.getModel().selectAll();
    };

    FindView.prototype.focusReplaceEditor = function() {
      var ref1, selectedText;
      selectedText = (ref1 = atom.workspace.getActiveTextEditor()) != null ? typeof ref1.getSelectedText === "function" ? ref1.getSelectedText() : void 0 : void 0;
      if (selectedText && selectedText.indexOf('\n') < 0) {
        this.replaceEditor.setText(selectedText);
      }
      this.replaceEditor.focus();
      return this.replaceEditor.getModel().selectAll();
    };

    FindView.prototype.toggleFocus = function() {
      if (this.findEditor.hasClass('is-focused')) {
        return this.replaceEditor.focus();
      } else {
        return this.findEditor.focus();
      }
    };

    FindView.prototype.confirm = function() {
      return this.findNext({
        focusEditorAfter: atom.config.get('find-and-replace.focusEditorAfterSearch')
      });
    };

    FindView.prototype.showPrevious = function() {
      return this.findPrevious({
        focusEditorAfter: atom.config.get('find-and-replace.focusEditorAfterSearch')
      });
    };

    FindView.prototype.liveSearch = function() {
      var findPattern;
      findPattern = this.findEditor.getText();
      if (findPattern.length === 0 || findPattern.length >= atom.config.get('find-and-replace.liveSearchMinimumCharacters') && !this.model.patternMatchesEmptyString(findPattern)) {
        return this.model.search(findPattern);
      }
    };

    FindView.prototype.search = function(findPattern, options) {
      if (arguments.length === 1 && typeof findPattern === 'object') {
        options = findPattern;
        findPattern = null;
      }
      if (findPattern == null) {
        findPattern = this.findEditor.getText();
      }
      return this.model.search(findPattern, options);
    };

    FindView.prototype.findAll = function(options) {
      if (options == null) {
        options = {
          focusEditorAfter: true
        };
      }
      return this.findAndSelectResult(this.selectAllMarkers, options);
    };

    FindView.prototype.findNext = function(options) {
      if (options == null) {
        options = {
          focusEditorAfter: false
        };
      }
      return this.findAndSelectResult(this.selectFirstMarkerAfterCursor, options);
    };

    FindView.prototype.findPrevious = function(options) {
      if (options == null) {
        options = {
          focusEditorAfter: false
        };
      }
      return this.findAndSelectResult(this.selectFirstMarkerBeforeCursor, options);
    };

    FindView.prototype.findAndSelectResult = function(selectFunction, arg) {
      var fieldToFocus, focusEditorAfter, ref1, workspaceElement;
      focusEditorAfter = arg.focusEditorAfter, fieldToFocus = arg.fieldToFocus;
      this.search();
      this.findHistoryCycler.store();
      if (((ref1 = this.markers) != null ? ref1.length : void 0) > 0) {
        selectFunction();
        if (fieldToFocus) {
          return fieldToFocus.focus();
        } else if (focusEditorAfter) {
          workspaceElement = atom.views.getView(atom.workspace);
          return workspaceElement.focus();
        } else {
          return this.findEditor.focus();
        }
      } else {
        return atom.beep();
      }
    };

    FindView.prototype.replaceNext = function() {
      return this.replace('findNext', 'firstMarkerIndexStartingFromCursor');
    };

    FindView.prototype.replacePrevious = function() {
      return this.replace('findPrevious', 'firstMarkerIndexBeforeCursor');
    };

    FindView.prototype.replace = function(nextOrPreviousFn, nextIndexFn) {
      var currentMarker, position, ref1;
      this.search();
      this.findHistoryCycler.store();
      this.replaceHistoryCycler.store();
      if (((ref1 = this.markers) != null ? ref1.length : void 0) > 0) {
        if (!(currentMarker = this.model.currentResultMarker)) {
          if (position = this[nextIndexFn]()) {
            currentMarker = this.markers[position.index];
          }
        }
        this.model.replace([currentMarker], this.replaceEditor.getText());
        return this[nextOrPreviousFn]({
          fieldToFocus: this.replaceEditor
        });
      } else {
        return atom.beep();
      }
    };

    FindView.prototype.replaceAll = function() {
      var ref1;
      this.search();
      if ((ref1 = this.markers) != null ? ref1.length : void 0) {
        this.findHistoryCycler.store();
        this.replaceHistoryCycler.store();
        return this.model.replace(this.markers, this.replaceEditor.getText());
      } else {
        return atom.beep();
      }
    };

    FindView.prototype.markersUpdated = function(markers) {
      var results, resultsStr;
      this.markers = markers;
      this.findError = null;
      this.updateResultCounter();
      this.updateReplaceEnablement();
      if (this.model.getFindOptions().findPattern) {
        results = this.markers.length;
        resultsStr = results ? _.pluralize(results, 'result') : 'No results';
        this.removeClass('has-results has-no-results');
        this.addClass(results ? 'has-results' : 'has-no-results');
        this.setInfoMessage(resultsStr + " found for '" + (this.model.getFindOptions().findPattern) + "'");
        if (this.findEditor.hasFocus() && results > 0 && atom.config.get('find-and-replace.scrollToResultOnLiveSearch')) {
          return this.findAndSelectResult(this.selectFirstMarkerStartingFromCursor, {
            focusEditorAfter: false
          });
        }
      } else {
        return this.clearMessage();
      }
    };

    FindView.prototype.findError = function(error) {
      return this.setErrorMessage(error.message);
    };

    FindView.prototype.updateResultCounter = function() {
      var index, ref1, text;
      if (this.model.currentResultMarker && (index = (ref1 = this.markers) != null ? ref1.indexOf(this.model.currentResultMarker) : void 0) > -1) {
        text = (index + 1) + " of " + this.markers.length;
      } else {
        if ((this.markers == null) || this.markers.length === 0) {
          text = "no results";
        } else if (this.markers.length === 1) {
          text = "1 found";
        } else {
          text = this.markers.length + " found";
        }
      }
      return this.resultCounter.text(text);
    };

    FindView.prototype.setInfoMessage = function(infoMessage) {
      return this.descriptionLabel.text(infoMessage).removeClass('text-error');
    };

    FindView.prototype.setErrorMessage = function(errorMessage) {
      return this.descriptionLabel.text(errorMessage).addClass('text-error');
    };

    FindView.prototype.clearMessage = function() {
      this.removeClass('has-results has-no-results');
      return this.descriptionLabel.html('Find in Current Buffer <span class="subtle-info-message">Close this panel with the <span class="highlight">esc</span> key</span>').removeClass('text-error');
    };

    FindView.prototype.selectFirstMarkerAfterCursor = function() {
      var index, marker, wrapped;
      marker = this.firstMarkerIndexAfterCursor();
      if (!marker) {
        return;
      }
      index = marker.index, wrapped = marker.wrapped;
      return this.selectMarkerAtIndex(index, wrapped);
    };

    FindView.prototype.selectFirstMarkerStartingFromCursor = function() {
      var index, marker, wrapped;
      marker = this.firstMarkerIndexAfterCursor(true);
      if (!marker) {
        return;
      }
      index = marker.index, wrapped = marker.wrapped;
      return this.selectMarkerAtIndex(index, wrapped);
    };

    FindView.prototype.selectFirstMarkerBeforeCursor = function() {
      var index, marker, wrapped;
      marker = this.firstMarkerIndexBeforeCursor();
      if (!marker) {
        return;
      }
      index = marker.index, wrapped = marker.wrapped;
      return this.selectMarkerAtIndex(index, wrapped);
    };

    FindView.prototype.firstMarkerIndexStartingFromCursor = function() {
      return this.firstMarkerIndexAfterCursor(true);
    };

    FindView.prototype.firstMarkerIndexAfterCursor = function(indexIncluded) {
      var editor, end, i, index, len, marker, markerStartPosition, ref1, ref2, selection, start;
      if (indexIncluded == null) {
        indexIncluded = false;
      }
      editor = this.model.getEditor();
      if (!editor) {
        return null;
      }
      selection = editor.getLastSelection();
      ref1 = selection.getBufferRange(), start = ref1.start, end = ref1.end;
      if (selection.isReversed()) {
        start = end;
      }
      ref2 = this.markers;
      for (index = i = 0, len = ref2.length; i < len; index = ++i) {
        marker = ref2[index];
        markerStartPosition = marker.bufferMarker.getStartPosition();
        switch (markerStartPosition.compare(start)) {
          case -1:
            continue;
          case 0:
            if (!indexIncluded) {
              continue;
            }
        }
        return {
          index: index,
          wrapped: null
        };
      }
      return {
        index: 0,
        wrapped: 'up'
      };
    };

    FindView.prototype.firstMarkerIndexBeforeCursor = function() {
      var editor, end, i, index, marker, markerEndPosition, ref1, ref2, selection, start;
      editor = this.model.getEditor();
      if (!editor) {
        return null;
      }
      selection = this.model.getEditor().getLastSelection();
      ref1 = selection.getBufferRange(), start = ref1.start, end = ref1.end;
      if (selection.isReversed()) {
        start = end;
      }
      ref2 = this.markers;
      for (index = i = ref2.length - 1; i >= 0; index = i += -1) {
        marker = ref2[index];
        markerEndPosition = marker.bufferMarker.getEndPosition();
        if (markerEndPosition.isLessThan(start)) {
          return {
            index: index,
            wrapped: null
          };
        }
      }
      return {
        index: this.markers.length - 1,
        wrapped: 'down'
      };
    };

    FindView.prototype.selectAllMarkers = function() {
      var editor, marker, ranges, ref1, scrollMarker;
      if (!(((ref1 = this.markers) != null ? ref1.length : void 0) > 0)) {
        return;
      }
      ranges = (function() {
        var i, len, ref2, results1;
        ref2 = this.markers;
        results1 = [];
        for (i = 0, len = ref2.length; i < len; i++) {
          marker = ref2[i];
          results1.push(marker.getBufferRange());
        }
        return results1;
      }).call(this);
      scrollMarker = this.markers[this.firstMarkerIndexAfterCursor().index];
      editor = this.model.getEditor();
      editor.setSelectedBufferRanges(ranges, {
        flash: true
      });
      return editor.scrollToBufferPosition(scrollMarker.getStartBufferPosition(), {
        center: true
      });
    };

    FindView.prototype.selectMarkerAtIndex = function(markerIndex, wrapped) {
      var editor, marker, ref1, screenRange;
      if (!(((ref1 = this.markers) != null ? ref1.length : void 0) > 0)) {
        return;
      }
      if (marker = this.markers[markerIndex]) {
        editor = this.model.getEditor();
        screenRange = marker.getScreenRange();
        if (screenRange.start.row < editor.getFirstVisibleScreenRow() || screenRange.end.row > editor.getLastVisibleScreenRow()) {
          switch (wrapped) {
            case 'up':
              this.showWrapIcon('icon-move-up');
              break;
            case 'down':
              this.showWrapIcon('icon-move-down');
          }
        }
        editor.setSelectedScreenRange(screenRange, {
          flash: true
        });
        return editor.scrollToCursorPosition({
          center: true
        });
      }
    };

    FindView.prototype.setSelectionAsFindPattern = function() {
      var editor, findPattern;
      editor = this.model.getEditor();
      if ((editor != null ? editor.getSelectedText : void 0) != null) {
        findPattern = editor.getSelectedText() || editor.getWordUnderCursor();
        if (this.model.getFindOptions().useRegex) {
          findPattern = Util.escapeRegex(findPattern);
        }
        if (findPattern) {
          this.findEditor.setText(findPattern);
          return this.search();
        }
      }
    };

    FindView.prototype.findNextSelected = function() {
      this.setSelectionAsFindPattern();
      return this.findNext({
        focusEditorAfter: true
      });
    };

    FindView.prototype.findPreviousSelected = function() {
      this.setSelectionAsFindPattern();
      return this.findPrevious({
        focusEditorAfter: true
      });
    };

    FindView.prototype.updateOptionViews = function() {
      this.updateOptionButtons();
      this.updateOptionsLabel();
      return this.updateSyntaxHighlighting();
    };

    FindView.prototype.updateSyntaxHighlighting = function() {
      if (this.model.getFindOptions().useRegex) {
        this.findEditor.getModel().setGrammar(atom.grammars.grammarForScopeName('source.js.regexp'));
        return this.replaceEditor.getModel().setGrammar(atom.grammars.grammarForScopeName('source.js.regexp.replacement'));
      } else {
        this.findEditor.getModel().setGrammar(atom.grammars.nullGrammar);
        return this.replaceEditor.getModel().setGrammar(atom.grammars.nullGrammar);
      }
    };

    FindView.prototype.updateOptionsLabel = function() {
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
      if (this.model.getFindOptions().inCurrentSelection) {
        label.push('Within Current Selection');
      }
      if (this.model.getFindOptions().wholeWord) {
        label.push('Whole Word');
      }
      return this.optionsLabel.text(label.join(', '));
    };

    FindView.prototype.updateOptionButtons = function() {
      this.setOptionButtonState(this.regexOptionButton, this.model.getFindOptions().useRegex);
      this.setOptionButtonState(this.caseOptionButton, this.model.getFindOptions().caseSensitive);
      this.setOptionButtonState(this.selectionOptionButton, this.model.getFindOptions().inCurrentSelection);
      return this.setOptionButtonState(this.wholeWordOptionButton, this.model.getFindOptions().wholeWord);
    };

    FindView.prototype.setOptionButtonState = function(optionButton, selected) {
      if (selected) {
        return optionButton.addClass('selected');
      } else {
        return optionButton.removeClass('selected');
      }
    };

    FindView.prototype.anyMarkersAreSelected = function() {
      var editor;
      editor = this.model.getEditor();
      if (!editor) {
        return false;
      }
      return editor.getSelectedBufferRanges().some((function(_this) {
        return function(selectedRange) {
          return _this.model.findMarker(selectedRange);
        };
      })(this));
    };

    FindView.prototype.toggleRegexOption = function() {
      this.search({
        useRegex: !this.model.getFindOptions().useRegex
      });
      if (!this.anyMarkersAreSelected()) {
        return this.selectFirstMarkerAfterCursor();
      }
    };

    FindView.prototype.toggleCaseOption = function() {
      this.search({
        caseSensitive: !this.model.getFindOptions().caseSensitive
      });
      if (!this.anyMarkersAreSelected()) {
        return this.selectFirstMarkerAfterCursor();
      }
    };

    FindView.prototype.toggleSelectionOption = function() {
      this.search({
        inCurrentSelection: !this.model.getFindOptions().inCurrentSelection
      });
      if (!this.anyMarkersAreSelected()) {
        return this.selectFirstMarkerAfterCursor();
      }
    };

    FindView.prototype.toggleWholeWordOption = function() {
      this.search(this.findEditor.getText(), {
        wholeWord: !this.model.getFindOptions().wholeWord
      });
      if (!this.anyMarkersAreSelected()) {
        return this.selectFirstMarkerAfterCursor();
      }
    };

    FindView.prototype.updateReplaceEnablement = function() {
      var canReplace, ref1, ref2;
      canReplace = ((ref1 = this.markers) != null ? ref1.length : void 0) > 0;
      if (canReplace && !this.replaceAllButton[0].classList.contains('disabled')) {
        return;
      }
      if ((ref2 = this.replaceTooltipSubscriptions) != null) {
        ref2.dispose();
      }
      this.replaceTooltipSubscriptions = new CompositeDisposable;
      if (canReplace) {
        this.replaceAllButton[0].classList.remove('disabled');
        this.replaceNextButton[0].classList.remove('disabled');
        this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceNextButton, {
          title: "Replace Next",
          keyBindingCommand: 'find-and-replace:replace-next',
          keyBindingTarget: this.replaceEditor.element
        }));
        return this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceAllButton, {
          title: "Replace All",
          keyBindingCommand: 'find-and-replace:replace-all',
          keyBindingTarget: this.replaceEditor.element
        }));
      } else {
        this.replaceAllButton[0].classList.add('disabled');
        this.replaceNextButton[0].classList.add('disabled');
        this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceNextButton, {
          title: "Replace Next [when there are results]"
        }));
        return this.replaceTooltipSubscriptions.add(atom.tooltips.add(this.replaceAllButton, {
          title: "Replace All [when there are results]"
        }));
      }
    };

    FindView.prototype.createWrapIcon = function() {
      var wrapIcon;
      wrapIcon = document.createElement('div');
      wrapIcon.classList.add('find-wrap-icon');
      return this.wrapIcon = $(wrapIcon);
    };

    FindView.prototype.showWrapIcon = function(icon) {
      var editor, editorView;
      if (!atom.config.get('find-and-replace.showSearchWrapIcon')) {
        return;
      }
      editor = this.model.getEditor();
      if (editor == null) {
        return;
      }
      editorView = atom.views.getView(editor);
      if ((editorView != null ? editorView.parentNode : void 0) == null) {
        return;
      }
      editorView.parentNode.appendChild(this.wrapIcon[0]);
      this.wrapIcon.attr('class', "find-wrap-icon " + icon).fadeIn();
      clearTimeout(this.wrapTimeout);
      return this.wrapTimeout = setTimeout(((function(_this) {
        return function() {
          return _this.wrapIcon.fadeOut();
        };
      })(this)), 1000);
    };

    return FindView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9maW5kLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwRkFBQTtJQUFBOzs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQyxPQUFBLENBQVEsc0JBQVIsQ0FBakMsRUFBQyxTQUFELEVBQUksYUFBSixFQUFTLGVBQVQsRUFBZTs7RUFDZCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLElBQUEsR0FBTyxPQUFBLENBQVEsZ0JBQVI7O0VBQ1AsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFDSixRQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsS0FBRCxFQUFRLEdBQVI7QUFDUixVQUFBO01BRGlCLDZCQUFZO01BQzdCLFVBQUEsR0FBYSxlQUFBLENBQ1g7UUFBQSxJQUFBLEVBQU0sSUFBTjtRQUNBLFNBQUEsRUFBVyxDQURYO1FBRUEsUUFBQSxFQUFVLElBRlY7UUFHQSxXQUFBLEVBQWEsS0FIYjtRQUlBLE1BQUEsRUFBUSxVQUpSO1FBS0EsZUFBQSxFQUFpQix3QkFMakI7T0FEVztNQVFiLGFBQUEsR0FBZ0IsZUFBQSxDQUNkO1FBQUEsSUFBQSxFQUFNLElBQU47UUFDQSxTQUFBLEVBQVcsQ0FEWDtRQUVBLFFBQUEsRUFBVSxJQUZWO1FBR0EsV0FBQSxFQUFhLEtBSGI7UUFJQSxNQUFBLEVBQVEsYUFKUjtRQUtBLGVBQUEsRUFBaUIsMkJBTGpCO09BRGM7YUFRaEIsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLFFBQUEsRUFBVSxDQUFDLENBQVg7UUFB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O1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUQsQ0FBWCxFQUFxQyxJQUFyQztJQWRIOzs7O0tBOWdCTztBQVB2QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57JCwgJCQkLCBWaWV3LCBUZXh0RWRpdG9yVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5VdGlsID0gcmVxdWlyZSAnLi9wcm9qZWN0L3V0aWwnXG5idWlsZFRleHRFZGl0b3IgPSByZXF1aXJlICcuL2J1aWxkLXRleHQtZWRpdG9yJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGaW5kVmlldyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6IChtb2RlbCwge2ZpbmRCdWZmZXIsIHJlcGxhY2VCdWZmZXJ9KSAtPlxuICAgIGZpbmRFZGl0b3IgPSBidWlsZFRleHRFZGl0b3JcbiAgICAgIG1pbmk6IHRydWVcbiAgICAgIHRhYkxlbmd0aDogMlxuICAgICAgc29mdFRhYnM6IHRydWVcbiAgICAgIHNvZnRXcmFwcGVkOiBmYWxzZVxuICAgICAgYnVmZmVyOiBmaW5kQnVmZmVyXG4gICAgICBwbGFjZWhvbGRlclRleHQ6ICdGaW5kIGluIGN1cnJlbnQgYnVmZmVyJ1xuXG4gICAgcmVwbGFjZUVkaXRvciA9IGJ1aWxkVGV4dEVkaXRvclxuICAgICAgbWluaTogdHJ1ZVxuICAgICAgdGFiTGVuZ3RoOiAyXG4gICAgICBzb2Z0VGFiczogdHJ1ZVxuICAgICAgc29mdFdyYXBwZWQ6IGZhbHNlXG4gICAgICBidWZmZXI6IHJlcGxhY2VCdWZmZXJcbiAgICAgIHBsYWNlaG9sZGVyVGV4dDogJ1JlcGxhY2UgaW4gY3VycmVudCBidWZmZXInXG5cbiAgICBAZGl2IHRhYkluZGV4OiAtMSwgY2xhc3M6ICdmaW5kLWFuZC1yZXBsYWNlJywgPT5cbiAgICAgIEBoZWFkZXIgY2xhc3M6ICdoZWFkZXInLCA9PlxuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkZXNjcmlwdGlvbkxhYmVsJywgY2xhc3M6ICdoZWFkZXItaXRlbSBkZXNjcmlwdGlvbicsICdGaW5kIGluIEN1cnJlbnQgQnVmZmVyJ1xuICAgICAgICBAc3BhbiBjbGFzczogJ2hlYWRlci1pdGVtIG9wdGlvbnMtbGFiZWwgcHVsbC1yaWdodCcsID0+XG4gICAgICAgICAgQHNwYW4gJ0ZpbmRpbmcgd2l0aCBPcHRpb25zOiAnXG4gICAgICAgICAgQHNwYW4gb3V0bGV0OiAnb3B0aW9uc0xhYmVsJywgY2xhc3M6ICdvcHRpb25zJ1xuXG4gICAgICBAc2VjdGlvbiBjbGFzczogJ2lucHV0LWJsb2NrIGZpbmQtY29udGFpbmVyJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ2lucHV0LWJsb2NrLWl0ZW0gaW5wdXQtYmxvY2staXRlbS0tZmxleCBlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgICAgICBAc3VidmlldyAnZmluZEVkaXRvcicsIG5ldyBUZXh0RWRpdG9yVmlldyhlZGl0b3I6IGZpbmRFZGl0b3IpXG4gICAgICAgICAgQGRpdiBjbGFzczogJ2ZpbmQtbWV0YS1jb250YWluZXInLCA9PlxuICAgICAgICAgICAgQHNwYW4gb3V0bGV0OiAncmVzdWx0Q291bnRlcicsIGNsYXNzOiAndGV4dC1zdWJ0bGUgcmVzdWx0LWNvdW50ZXInLCAnJ1xuXG4gICAgICAgIEBkaXYgY2xhc3M6ICdpbnB1dC1ibG9jay1pdGVtJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwIGJ0bi1ncm91cC1maW5kJywgPT5cbiAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAnbmV4dEJ1dHRvbicsIGNsYXNzOiAnYnRuJywgJ0ZpbmQnXG4gICAgICAgICAgQGRpdiBjbGFzczogJ2J0bi1ncm91cCBidG4tdG9nZ2xlIGJ0bi1ncm91cC1vcHRpb25zJywgPT5cbiAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAncmVnZXhPcHRpb25CdXR0b24nLCBjbGFzczogJ2J0bicsID0+XG4gICAgICAgICAgICAgIEByYXcgJzxzdmcgY2xhc3M9XCJpY29uXCI+PHVzZSB4bGluazpocmVmPVwiI2ZpbmQtYW5kLXJlcGxhY2UtaWNvbi1yZWdleFwiIC8+PC9zdmc+J1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdjYXNlT3B0aW9uQnV0dG9uJywgY2xhc3M6ICdidG4nLCA9PlxuICAgICAgICAgICAgICBAcmF3ICc8c3ZnIGNsYXNzPVwiaWNvblwiPjx1c2UgeGxpbms6aHJlZj1cIiNmaW5kLWFuZC1yZXBsYWNlLWljb24tY2FzZVwiIC8+PC9zdmc+J1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdzZWxlY3Rpb25PcHRpb25CdXR0b24nLCBjbGFzczogJ2J0biBvcHRpb24tc2VsZWN0aW9uJywgPT5cbiAgICAgICAgICAgICAgQHJhdyAnPHN2ZyBjbGFzcz1cImljb25cIj48dXNlIHhsaW5rOmhyZWY9XCIjZmluZC1hbmQtcmVwbGFjZS1pY29uLXNlbGVjdGlvblwiIC8+PC9zdmc+J1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICd3aG9sZVdvcmRPcHRpb25CdXR0b24nLCBjbGFzczogJ2J0biBvcHRpb24td2hvbGUtd29yZCcsID0+XG4gICAgICAgICAgICAgIEByYXcgJzxzdmcgY2xhc3M9XCJpY29uXCI+PHVzZSB4bGluazpocmVmPVwiI2ZpbmQtYW5kLXJlcGxhY2UtaWNvbi13b3JkXCIgLz48L3N2Zz4nXG5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnaW5wdXQtYmxvY2sgcmVwbGFjZS1jb250YWluZXInLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnaW5wdXQtYmxvY2staXRlbSBpbnB1dC1ibG9jay1pdGVtLS1mbGV4IGVkaXRvci1jb250YWluZXInLCA9PlxuICAgICAgICAgIEBzdWJ2aWV3ICdyZXBsYWNlRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KGVkaXRvcjogcmVwbGFjZUVkaXRvcilcblxuICAgICAgICBAZGl2IGNsYXNzOiAnaW5wdXQtYmxvY2staXRlbScsID0+XG4gICAgICAgICAgQGRpdiBjbGFzczogJ2J0bi1ncm91cCBidG4tZ3JvdXAtcmVwbGFjZScsID0+XG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3JlcGxhY2VOZXh0QnV0dG9uJywgY2xhc3M6ICdidG4gYnRuLW5leHQnLCAnUmVwbGFjZSdcbiAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwIGJ0bi1ncm91cC1yZXBsYWNlLWFsbCcsID0+XG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3JlcGxhY2VBbGxCdXR0b24nLCBjbGFzczogJ2J0biBidG4tYWxsJywgJ1JlcGxhY2UgQWxsJ1xuXG4gICAgICBAcmF3ICc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgIDxzeW1ib2wgaWQ9XCJmaW5kLWFuZC1yZXBsYWNlLWljb24tcmVnZXhcIiB2aWV3Qm94PVwiMCAwIDIwIDE2XCIgc3Ryb2tlPVwibm9uZVwiIGZpbGwtcnVsZT1cImV2ZW5vZGRcIj5cbiAgICAgICAgICA8cmVjdCB4PVwiM1wiIHk9XCIxMFwiIHdpZHRoPVwiM1wiIGhlaWdodD1cIjNcIiByeD1cIjFcIj48L3JlY3Q+XG4gICAgICAgICAgPHJlY3QgeD1cIjEyXCIgeT1cIjNcIiB3aWR0aD1cIjJcIiBoZWlnaHQ9XCI5XCIgcng9XCIxXCI+PC9yZWN0PlxuICAgICAgICAgIDxyZWN0IHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgxMy4wMDAwMDAsIDcuNTAwMDAwKSByb3RhdGUoNjAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTcuNTAwMDAwKSBcIiB4PVwiMTJcIiB5PVwiM1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjlcIiByeD1cIjFcIj48L3JlY3Q+XG4gICAgICAgICAgPHJlY3QgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDEzLjAwMDAwMCwgNy41MDAwMDApIHJvdGF0ZSgtNjAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTcuNTAwMDAwKSBcIiB4PVwiMTJcIiB5PVwiM1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjlcIiByeD1cIjFcIj48L3JlY3Q+XG4gICAgICAgIDwvc3ltYm9sPlxuXG4gICAgICAgIDxzeW1ib2wgaWQ9XCJmaW5kLWFuZC1yZXBsYWNlLWljb24tY2FzZVwiIHZpZXdCb3g9XCIwIDAgMjAgMTZcIiBzdHJva2U9XCJub25lXCIgZmlsbC1ydWxlPVwiZXZlbm9kZFwiPlxuICAgICAgICAgIDxwYXRoIGQ9XCJNMTAuOTE5LDEzIEw5LjQ2MywxMyBDOS4yOTk2NjU4NSwxMyA5LjE2NTUwMDUyLDEyLjk1OTE2NzEgOS4wNjA1LDEyLjg3NzUgQzguOTU1NDk5NDcsMTIuNzk1ODMyOSA4Ljg3OTY2NjksMTIuNjk0MzMzOSA4LjgzMywxMi41NzMgTDguMDc3LDEwLjUwOCBMMy44ODQsMTAuNTA4IEwzLjEyOCwxMi41NzMgQzMuMDkwNjY2NDgsMTIuNjgwMzMzOSAzLjAxNzE2NzIyLDEyLjc3ODMzMjkgMi45MDc1LDEyLjg2NyBDMi43OTc4MzI3OSwxMi45NTU2NjcxIDIuNjYzNjY3NDYsMTMgMi41MDUsMTMgTDEuMDQyLDEzIEw1LjAxOCwyLjg3OCBMNi45NDMsMi44NzggTDEwLjkxOSwxMyBaIE00LjM2Nyw5LjE3OCBMNy41OTQsOS4xNzggTDYuMzYyLDUuODExIEM2LjMwNTk5OTcyLDUuNjYxNjY1OTIgNi4yNDQxNjcwMSw1LjQ4NTUwMTAyIDYuMTc2NSw1LjI4MjUgQzYuMTA4ODMzLDUuMDc5NDk4OTggNi4wNDIzMzM2Niw0Ljg1OTAwMTE5IDUuOTc3LDQuNjIxIEM1LjkxMTY2NjM0LDQuODU5MDAxMTkgNS44NDc1MDAzMiw1LjA4MDY2NTY0IDUuNzg0NSw1LjI4NiBDNS43MjE0OTk2OSw1LjQ5MTMzNDM2IDUuNjU5NjY2OTcsNS42NzA5OTkyMyA1LjU5OSw1LjgyNSBMNC4zNjcsOS4xNzggWiBNMTguODkyLDEzIEwxOC4xMTUsMTMgQzE3Ljk1MTY2NTgsMTMgMTcuODIzMzMzOCwxMi45NzU1MDAyIDE3LjczLDEyLjkyNjUgQzE3LjYzNjY2NjIsMTIuODc3NDk5OCAxNy41NjY2NjY5LDEyLjc3ODMzNDEgMTcuNTIsMTIuNjI5IEwxNy4zNjYsMTIuMTE4IEMxNy4xODM5OTkxLDEyLjI4MTMzNDEgMTcuMDA1NTAwOSwxMi40MjQ4MzI3IDE2LjgzMDUsMTIuNTQ4NSBDMTYuNjU1NDk5MSwxMi42NzIxNjczIDE2LjQ3NDY2NzYsMTIuNzc1OTk5NiAxNi4yODgsMTIuODYgQzE2LjEwMTMzMjQsMTIuOTQ0MDAwNCAxNS45MDMwMDEsMTMuMDA2OTk5OCAxNS42OTMsMTMuMDQ5IEMxNS40ODI5OTg5LDEzLjA5MTAwMDIgMTUuMjQ5NjY3OSwxMy4xMTIgMTQuOTkzLDEzLjExMiBDMTQuNjg5NjY1MSwxMy4xMTIgMTQuNDA5NjY3OSwxMy4wNzExNjcxIDE0LjE1MywxMi45ODk1IEMxMy44OTYzMzIsMTIuOTA3ODMyOSAxMy42NzU4MzQyLDEyLjc4NTMzNDIgMTMuNDkxNSwxMi42MjIgQzEzLjMwNzE2NTcsMTIuNDU4NjY1OCAxMy4xNjM2NjcyLDEyLjI1NTY2NzkgMTMuMDYxLDEyLjAxMyBDMTIuOTU4MzMyOCwxMS43NzAzMzIxIDEyLjkwNywxMS40ODgwMDE2IDEyLjkwNywxMS4xNjYgQzEyLjkwNywxMC44OTUzMzIgMTIuOTc4MTY1OSwxMC42MjgxNjggMTMuMTIwNSwxMC4zNjQ1IEMxMy4yNjI4MzQsMTAuMTAwODMyIDEzLjQ5OTY2NSw5Ljg2MjgzNDQgMTMuODMxLDkuNjUwNSBDMTQuMTYyMzM1LDkuNDM4MTY1NjEgMTQuNjAzMzMwNiw5LjI2MjAwMDcgMTUuMTU0LDkuMTIyIEMxNS43MDQ2Njk0LDguOTgxOTk5MyAxNi4zODgzMjkyLDguOTAyNjY2NzYgMTcuMjA1LDguODg0IEwxNy4yMDUsOC40NjQgQzE3LjIwNSw3Ljk4MzMzMDkzIDE3LjEwMzUwMSw3LjYyNzUwMTE2IDE2LjkwMDUsNy4zOTY1IEMxNi42OTc0OTksNy4xNjU0OTg4NSAxNi40MDIzMzUyLDcuMDUgMTYuMDE1LDcuMDUgQzE1LjczNDk5ODYsNy4wNSAxNS41MDE2Njc2LDcuMDgyNjY2MzQgMTUuMzE1LDcuMTQ4IEMxNS4xMjgzMzI0LDcuMjEzMzMzNjYgMTQuOTY2MTY3Myw3LjI4NjgzMjkyIDE0LjgyODUsNy4zNjg1IEMxNC42OTA4MzI2LDcuNDUwMTY3MDcgMTQuNTYzNjY3Miw3LjUyMzY2NjM0IDE0LjQ0Nyw3LjU4OSBDMTQuMzMwMzMyNyw3LjY1NDMzMzY2IDE0LjIwMjAwMDcsNy42ODcgMTQuMDYyLDcuNjg3IEMxMy45NDUzMzI3LDcuNjg3IDEzLjg0NTAwMDQsNy42NTY2NjY5NyAxMy43NjEsNy41OTYgQzEzLjY3Njk5OTYsNy41MzUzMzMwMyAxMy42MDkzMzM2LDcuNDYwNjY3MTEgMTMuNTU4LDcuMzcyIEwxMy4yNDMsNi44MTkgQzE0LjA2OTAwNDEsNi4wNjI5OTYyMiAxNS4wNjUzMjc1LDUuNjg1IDE2LjIzMiw1LjY4NSBDMTYuNjUyMDAyMSw1LjY4NSAxNy4wMjY0OTgzLDUuNzUzODMyNjQgMTcuMzU1NSw1Ljg5MTUgQzE3LjY4NDUwMTYsNi4wMjkxNjczNiAxNy45NjMzMzIyLDYuMjIwNDk4NzcgMTguMTkyLDYuNDY1NSBDMTguNDIwNjY3OCw2LjcxMDUwMTIyIDE4LjU5NDQ5OTQsNy4wMDMzMzE2MyAxOC43MTM1LDcuMzQ0IEMxOC44MzI1MDA2LDcuNjg0NjY4MzcgMTguODkyLDguMDU3OTk3OTcgMTguODkyLDguNDY0IEwxOC44OTIsMTMgWiBNMTUuNTMyLDExLjkyMiBDMTUuNzA5MzM0MiwxMS45MjIgMTUuODcyNjY1OSwxMS45MDU2NjY4IDE2LjAyMiwxMS44NzMgQzE2LjE3MTMzNDEsMTEuODQwMzMzMiAxNi4zMTI0OTkzLDExLjc5MTMzMzcgMTYuNDQ1NSwxMS43MjYgQzE2LjU3ODUwMDYsMTEuNjYwNjY2MyAxNi43MDY4MzI3LDExLjU4MDE2NzEgMTYuODMwNSwxMS40ODQ1IEMxNi45NTQxNjczLDExLjM4ODgzMjkgMTcuMDc4OTk5MywxMS4yNzU2NjczIDE3LjIwNSwxMS4xNDUgTDE3LjIwNSw5LjkzNCBDMTYuNzAwOTk3NSw5Ljk1NzMzMzQ1IDE2LjI3OTgzNSwxMC4wMDA0OTk3IDE1Ljk0MTUsMTAuMDYzNSBDMTUuNjAzMTY1LDEwLjEyNjUwMDMgMTUuMzMxMzM0MywxMC4yMDY5OTk1IDE1LjEyNiwxMC4zMDUgQzE0LjkyMDY2NTYsMTAuNDAzMDAwNSAxNC43NzQ4MzM3LDEwLjUxNzMzMjcgMTQuNjg4NSwxMC42NDggQzE0LjYwMjE2NjIsMTAuNzc4NjY3MyAxNC41NTksMTAuOTIwOTk5MiAxNC41NTksMTEuMDc1IEMxNC41NTksMTEuMzc4MzM0OSAxNC42NDg4MzI0LDExLjU5NTMzMjcgMTQuODI4NSwxMS43MjYgQzE1LjAwODE2NzUsMTEuODU2NjY3MyAxNS4yNDI2NjUyLDExLjkyMiAxNS41MzIsMTEuOTIyIEwxNS41MzIsMTEuOTIyIFpcIj48L3BhdGg+XG4gICAgICAgIDwvc3ltYm9sPlxuXG4gICAgICAgIDxzeW1ib2wgaWQ9XCJmaW5kLWFuZC1yZXBsYWNlLWljb24tc2VsZWN0aW9uXCIgdmlld0JveD1cIjAgMCAyMCAxNlwiIHN0cm9rZT1cIm5vbmVcIiBmaWxsLXJ1bGU9XCJldmVub2RkXCI+XG4gICAgICAgICAgPHJlY3Qgb3BhY2l0eT1cIjAuNlwiIHg9XCIxN1wiIHk9XCI5XCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiNFwiPjwvcmVjdD5cbiAgICAgICAgICA8cmVjdCBvcGFjaXR5PVwiMC42XCIgeD1cIjE0XCIgeT1cIjlcIiB3aWR0aD1cIjJcIiBoZWlnaHQ9XCI0XCI+PC9yZWN0PlxuICAgICAgICAgIDxyZWN0IG9wYWNpdHk9XCIwLjZcIiB4PVwiMVwiIHk9XCIzXCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiNFwiPjwvcmVjdD5cbiAgICAgICAgICA8cmVjdCB4PVwiMVwiIHk9XCI5XCIgd2lkdGg9XCIxMVwiIGhlaWdodD1cIjRcIj48L3JlY3Q+XG4gICAgICAgICAgPHJlY3QgeD1cIjVcIiB5PVwiM1wiIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCI0XCI+PC9yZWN0PlxuICAgICAgICA8L3N5bWJvbD5cblxuICAgICAgICA8c3ltYm9sIGlkPVwiZmluZC1hbmQtcmVwbGFjZS1pY29uLXdvcmRcIiB2aWV3Qm94PVwiMCAwIDIwIDE2XCIgc3Ryb2tlPVwibm9uZVwiIGZpbGwtcnVsZT1cImV2ZW5vZGRcIj5cbiAgICAgICAgICA8cmVjdCBvcGFjaXR5PVwiMC42XCIgeD1cIjFcIiB5PVwiM1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjZcIj48L3JlY3Q+XG4gICAgICAgICAgPHJlY3Qgb3BhY2l0eT1cIjAuNlwiIHg9XCIxN1wiIHk9XCIzXCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiNlwiPjwvcmVjdD5cbiAgICAgICAgICA8cmVjdCB4PVwiNlwiIHk9XCIzXCIgd2lkdGg9XCIyXCIgaGVpZ2h0PVwiNlwiPjwvcmVjdD5cbiAgICAgICAgICA8cmVjdCB4PVwiMTJcIiB5PVwiM1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjZcIj48L3JlY3Q+XG4gICAgICAgICAgPHJlY3QgeD1cIjlcIiB5PVwiM1wiIHdpZHRoPVwiMlwiIGhlaWdodD1cIjZcIj48L3JlY3Q+XG4gICAgICAgICAgPHBhdGggZD1cIk00LjUsMTMgTDE1LjUsMTMgTDE2LDEzIEwxNiwxMiBMMTUuNSwxMiBMNC41LDEyIEw0LDEyIEw0LDEzIEw0LjUsMTMgTDQuNSwxMyBaXCI+PC9wYXRoPlxuICAgICAgICAgIDxwYXRoIGQ9XCJNNCwxMC41IEw0LDEyLjUgTDQsMTMgTDUsMTMgTDUsMTIuNSBMNSwxMC41IEw1LDEwIEw0LDEwIEw0LDEwLjUgTDQsMTAuNSBaXCI+PC9wYXRoPlxuICAgICAgICAgIDxwYXRoIGQ9XCJNMTUsMTAuNSBMMTUsMTIuNSBMMTUsMTMgTDE2LDEzIEwxNiwxMi41IEwxNiwxMC41IEwxNiwxMCBMMTUsMTAgTDE1LDEwLjUgTDE1LDEwLjUgWlwiPjwvcGF0aD5cbiAgICAgICAgPC9zeW1ib2w+XG4gICAgICA8L3N2Zz4nXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwge0BmaW5kSGlzdG9yeUN5Y2xlciwgQHJlcGxhY2VIaXN0b3J5Q3ljbGVyfSkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBAZmluZEhpc3RvcnlDeWNsZXIuYWRkRWRpdG9yRWxlbWVudChAZmluZEVkaXRvci5lbGVtZW50KVxuICAgIEByZXBsYWNlSGlzdG9yeUN5Y2xlci5hZGRFZGl0b3JFbGVtZW50KEByZXBsYWNlRWRpdG9yLmVsZW1lbnQpXG5cbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICAgIEBjbGVhck1lc3NhZ2UoKVxuICAgIEB1cGRhdGVPcHRpb25WaWV3cygpXG4gICAgQHVwZGF0ZVJlcGxhY2VFbmFibGVtZW50KClcbiAgICBAY3JlYXRlV3JhcEljb24oKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEB0b29sdGlwU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG5cbiAgc2V0UGFuZWw6IChAcGFuZWwpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBwYW5lbC5vbkRpZENoYW5nZVZpc2libGUgKHZpc2libGUpID0+XG4gICAgICBpZiB2aXNpYmxlIHRoZW4gQGRpZFNob3coKSBlbHNlIEBkaWRIaWRlKClcblxuICBkaWRTaG93OiAtPlxuICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuY2xhc3NMaXN0LmFkZCgnZmluZC12aXNpYmxlJylcbiAgICByZXR1cm4gaWYgQHRvb2x0aXBTdWJzY3JpcHRpb25zP1xuXG4gICAgQHRvb2x0aXBTdWJzY3JpcHRpb25zID0gc3VicyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgc3Vicy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHJlZ2V4T3B0aW9uQnV0dG9uLFxuICAgICAgdGl0bGU6IFwiVXNlIFJlZ2V4XCJcbiAgICAgIGtleUJpbmRpbmdDb21tYW5kOiAnZmluZC1hbmQtcmVwbGFjZTp0b2dnbGUtcmVnZXgtb3B0aW9uJyxcbiAgICAgIGtleUJpbmRpbmdUYXJnZXQ6IEBmaW5kRWRpdG9yLmVsZW1lbnRcbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAY2FzZU9wdGlvbkJ1dHRvbixcbiAgICAgIHRpdGxlOiBcIk1hdGNoIENhc2VcIixcbiAgICAgIGtleUJpbmRpbmdDb21tYW5kOiAnZmluZC1hbmQtcmVwbGFjZTp0b2dnbGUtY2FzZS1vcHRpb24nLFxuICAgICAga2V5QmluZGluZ1RhcmdldDogQGZpbmRFZGl0b3IuZWxlbWVudFxuICAgIHN1YnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBzZWxlY3Rpb25PcHRpb25CdXR0b24sXG4gICAgICB0aXRsZTogXCJPbmx5IEluIFNlbGVjdGlvblwiLFxuICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS1zZWxlY3Rpb24tb3B0aW9uJyxcbiAgICAgIGtleUJpbmRpbmdUYXJnZXQ6IEBmaW5kRWRpdG9yLmVsZW1lbnRcbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAd2hvbGVXb3JkT3B0aW9uQnV0dG9uLFxuICAgICAgdGl0bGU6IFwiV2hvbGUgV29yZFwiLFxuICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS13aG9sZS13b3JkLW9wdGlvbicsXG4gICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAZmluZEVkaXRvci5lbGVtZW50XG5cbiAgICBzdWJzLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAbmV4dEJ1dHRvbixcbiAgICAgIHRpdGxlOiBcIkZpbmQgTmV4dFwiLFxuICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOmZpbmQtbmV4dCcsXG4gICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAZmluZEVkaXRvci5lbGVtZW50XG5cbiAgZGlkSGlkZTogLT5cbiAgICBAaGlkZUFsbFRvb2x0aXBzKClcbiAgICB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAgIHdvcmtzcGFjZUVsZW1lbnQuZm9jdXMoKVxuICAgIHdvcmtzcGFjZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZmluZC12aXNpYmxlJylcblxuICBoaWRlQWxsVG9vbHRpcHM6IC0+XG4gICAgQHRvb2x0aXBTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEB0b29sdGlwU3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgQGhhbmRsZUZpbmRFdmVudHMoKVxuICAgIEBoYW5kbGVSZXBsYWNlRXZlbnRzKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZmluZEVkaXRvci5lbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEBjb25maXJtKClcbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOmNvbmZpcm0nOiA9PiBAY29uZmlybSgpXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpzaG93LXByZXZpb3VzJzogPT4gQHNob3dQcmV2aW91cygpXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpmaW5kLWFsbCc6ID0+IEBmaW5kQWxsKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAcmVwbGFjZUVkaXRvci5lbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEByZXBsYWNlTmV4dCgpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsXG4gICAgICAnY29yZTpjbG9zZSc6ID0+IEBwYW5lbD8uaGlkZSgpXG4gICAgICAnY29yZTpjYW5jZWwnOiA9PiBAcGFuZWw/LmhpZGUoKVxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6Zm9jdXMtbmV4dCc6IEB0b2dnbGVGb2N1c1xuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6Zm9jdXMtcHJldmlvdXMnOiBAdG9nZ2xlRm9jdXNcbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS1yZWdleC1vcHRpb24nOiBAdG9nZ2xlUmVnZXhPcHRpb25cbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS1jYXNlLW9wdGlvbic6IEB0b2dnbGVDYXNlT3B0aW9uXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTp0b2dnbGUtc2VsZWN0aW9uLW9wdGlvbic6IEB0b2dnbGVTZWxlY3Rpb25PcHRpb25cbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS13aG9sZS13b3JkLW9wdGlvbic6IEB0b2dnbGVXaG9sZVdvcmRPcHRpb25cblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRVcGRhdGUgQG1hcmtlcnNVcGRhdGVkXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZEVycm9yIEBmaW5kRXJyb3JcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkQ2hhbmdlQ3VycmVudFJlc3VsdCBAdXBkYXRlUmVzdWx0Q291bnRlclxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS5vbkRpZENoYW5nZSBAdXBkYXRlT3B0aW9uVmlld3NcblxuICAgIEByZWdleE9wdGlvbkJ1dHRvbi5vbiAnY2xpY2snLCBAdG9nZ2xlUmVnZXhPcHRpb25cbiAgICBAY2FzZU9wdGlvbkJ1dHRvbi5vbiAnY2xpY2snLCBAdG9nZ2xlQ2FzZU9wdGlvblxuICAgIEBzZWxlY3Rpb25PcHRpb25CdXR0b24ub24gJ2NsaWNrJywgQHRvZ2dsZVNlbGVjdGlvbk9wdGlvblxuICAgIEB3aG9sZVdvcmRPcHRpb25CdXR0b24ub24gJ2NsaWNrJywgQHRvZ2dsZVdob2xlV29yZE9wdGlvblxuXG4gICAgQG9uICdmb2N1cycsID0+IEBmaW5kRWRpdG9yLmZvY3VzKClcbiAgICBAZmluZCgnYnV0dG9uJykub24gJ2NsaWNrJywgLT5cbiAgICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgICB3b3Jrc3BhY2VFbGVtZW50LmZvY3VzKClcblxuICBoYW5kbGVGaW5kRXZlbnRzOiAtPlxuICAgIEBmaW5kRWRpdG9yLmdldE1vZGVsKCkub25EaWRTdG9wQ2hhbmdpbmcgPT4gQGxpdmVTZWFyY2goKVxuICAgIEBuZXh0QnV0dG9uLm9uICdjbGljaycsIChlKSA9PiBpZiBlLnNoaWZ0S2V5IHRoZW4gQGZpbmRQcmV2aW91cyhmb2N1c0VkaXRvckFmdGVyOiB0cnVlKSBlbHNlIEBmaW5kTmV4dChmb2N1c0VkaXRvckFmdGVyOiB0cnVlKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6ZmluZC1uZXh0JzogPT4gQGZpbmROZXh0KGZvY3VzRWRpdG9yQWZ0ZXI6IHRydWUpXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpmaW5kLXByZXZpb3VzJzogPT4gQGZpbmRQcmV2aW91cyhmb2N1c0VkaXRvckFmdGVyOiB0cnVlKVxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6ZmluZC1uZXh0LXNlbGVjdGVkJzogQGZpbmROZXh0U2VsZWN0ZWRcbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOmZpbmQtcHJldmlvdXMtc2VsZWN0ZWQnOiBAZmluZFByZXZpb3VzU2VsZWN0ZWRcbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOnVzZS1zZWxlY3Rpb24tYXMtZmluZC1wYXR0ZXJuJzogQHNldFNlbGVjdGlvbkFzRmluZFBhdHRlcm5cblxuICBoYW5kbGVSZXBsYWNlRXZlbnRzOiAtPlxuICAgIEByZXBsYWNlTmV4dEJ1dHRvbi5vbiAnY2xpY2snLCBAcmVwbGFjZU5leHRcbiAgICBAcmVwbGFjZUFsbEJ1dHRvbi5vbiAnY2xpY2snLCBAcmVwbGFjZUFsbFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6cmVwbGFjZS1wcmV2aW91cyc6IEByZXBsYWNlUHJldmlvdXNcbiAgICAgICdmaW5kLWFuZC1yZXBsYWNlOnJlcGxhY2UtbmV4dCc6IEByZXBsYWNlTmV4dFxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6cmVwbGFjZS1hbGwnOiBAcmVwbGFjZUFsbFxuXG4gIGZvY3VzRmluZEVkaXRvcjogPT5cbiAgICBzZWxlY3RlZFRleHQgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFNlbGVjdGVkVGV4dD8oKVxuICAgIGlmIHNlbGVjdGVkVGV4dCBhbmQgc2VsZWN0ZWRUZXh0LmluZGV4T2YoJ1xcbicpIDwgMFxuICAgICAgc2VsZWN0ZWRUZXh0ID0gVXRpbC5lc2NhcGVSZWdleChzZWxlY3RlZFRleHQpIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLnVzZVJlZ2V4XG4gICAgICBAZmluZEVkaXRvci5zZXRUZXh0KHNlbGVjdGVkVGV4dClcbiAgICBAZmluZEVkaXRvci5mb2N1cygpXG4gICAgQGZpbmRFZGl0b3IuZ2V0TW9kZWwoKS5zZWxlY3RBbGwoKVxuXG4gIGZvY3VzUmVwbGFjZUVkaXRvcjogPT5cbiAgICBzZWxlY3RlZFRleHQgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFNlbGVjdGVkVGV4dD8oKVxuICAgIGlmIHNlbGVjdGVkVGV4dCBhbmQgc2VsZWN0ZWRUZXh0LmluZGV4T2YoJ1xcbicpIDwgMFxuICAgICAgQHJlcGxhY2VFZGl0b3Iuc2V0VGV4dChzZWxlY3RlZFRleHQpXG4gICAgQHJlcGxhY2VFZGl0b3IuZm9jdXMoKVxuICAgIEByZXBsYWNlRWRpdG9yLmdldE1vZGVsKCkuc2VsZWN0QWxsKClcblxuICB0b2dnbGVGb2N1czogPT5cbiAgICBpZiBAZmluZEVkaXRvci5oYXNDbGFzcygnaXMtZm9jdXNlZCcpXG4gICAgICBAcmVwbGFjZUVkaXRvci5mb2N1cygpXG4gICAgZWxzZVxuICAgICAgQGZpbmRFZGl0b3IuZm9jdXMoKVxuXG4gIGNvbmZpcm06IC0+XG4gICAgQGZpbmROZXh0KGZvY3VzRWRpdG9yQWZ0ZXI6IGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5mb2N1c0VkaXRvckFmdGVyU2VhcmNoJykpXG5cbiAgc2hvd1ByZXZpb3VzOiAtPlxuICAgIEBmaW5kUHJldmlvdXMoZm9jdXNFZGl0b3JBZnRlcjogYXRvbS5jb25maWcuZ2V0KCdmaW5kLWFuZC1yZXBsYWNlLmZvY3VzRWRpdG9yQWZ0ZXJTZWFyY2gnKSlcblxuICBsaXZlU2VhcmNoOiAtPlxuICAgIGZpbmRQYXR0ZXJuID0gQGZpbmRFZGl0b3IuZ2V0VGV4dCgpXG4gICAgaWYgZmluZFBhdHRlcm4ubGVuZ3RoIGlzIDAgb3IgZmluZFBhdHRlcm4ubGVuZ3RoID49IGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5saXZlU2VhcmNoTWluaW11bUNoYXJhY3RlcnMnKSBhbmQgbm90IEBtb2RlbC5wYXR0ZXJuTWF0Y2hlc0VtcHR5U3RyaW5nKGZpbmRQYXR0ZXJuKVxuICAgICAgQG1vZGVsLnNlYXJjaChmaW5kUGF0dGVybilcblxuICBzZWFyY2g6IChmaW5kUGF0dGVybiwgb3B0aW9ucykgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoIGlzIDEgYW5kIHR5cGVvZiBmaW5kUGF0dGVybiBpcyAnb2JqZWN0J1xuICAgICAgb3B0aW9ucyA9IGZpbmRQYXR0ZXJuXG4gICAgICBmaW5kUGF0dGVybiA9IG51bGxcbiAgICBmaW5kUGF0dGVybiA/PSBAZmluZEVkaXRvci5nZXRUZXh0KClcbiAgICBAbW9kZWwuc2VhcmNoKGZpbmRQYXR0ZXJuLCBvcHRpb25zKVxuXG4gIGZpbmRBbGw6IChvcHRpb25zPXtmb2N1c0VkaXRvckFmdGVyOiB0cnVlfSkgPT5cbiAgICBAZmluZEFuZFNlbGVjdFJlc3VsdChAc2VsZWN0QWxsTWFya2Vycywgb3B0aW9ucylcblxuICBmaW5kTmV4dDogKG9wdGlvbnM9e2ZvY3VzRWRpdG9yQWZ0ZXI6IGZhbHNlfSkgPT5cbiAgICBAZmluZEFuZFNlbGVjdFJlc3VsdChAc2VsZWN0Rmlyc3RNYXJrZXJBZnRlckN1cnNvciwgb3B0aW9ucylcblxuICBmaW5kUHJldmlvdXM6IChvcHRpb25zPXtmb2N1c0VkaXRvckFmdGVyOiBmYWxzZX0pID0+XG4gICAgQGZpbmRBbmRTZWxlY3RSZXN1bHQoQHNlbGVjdEZpcnN0TWFya2VyQmVmb3JlQ3Vyc29yLCBvcHRpb25zKVxuXG4gIGZpbmRBbmRTZWxlY3RSZXN1bHQ6IChzZWxlY3RGdW5jdGlvbiwge2ZvY3VzRWRpdG9yQWZ0ZXIsIGZpZWxkVG9Gb2N1c30pID0+XG4gICAgQHNlYXJjaCgpXG4gICAgQGZpbmRIaXN0b3J5Q3ljbGVyLnN0b3JlKClcblxuICAgIGlmIEBtYXJrZXJzPy5sZW5ndGggPiAwXG4gICAgICBzZWxlY3RGdW5jdGlvbigpXG4gICAgICBpZiBmaWVsZFRvRm9jdXNcbiAgICAgICAgZmllbGRUb0ZvY3VzLmZvY3VzKClcbiAgICAgIGVsc2UgaWYgZm9jdXNFZGl0b3JBZnRlclxuICAgICAgICB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAgICAgICB3b3Jrc3BhY2VFbGVtZW50LmZvY3VzKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGZpbmRFZGl0b3IuZm9jdXMoKVxuICAgIGVsc2VcbiAgICAgIGF0b20uYmVlcCgpXG5cbiAgcmVwbGFjZU5leHQ6ID0+XG4gICAgQHJlcGxhY2UoJ2ZpbmROZXh0JywgJ2ZpcnN0TWFya2VySW5kZXhTdGFydGluZ0Zyb21DdXJzb3InKVxuXG4gIHJlcGxhY2VQcmV2aW91czogPT5cbiAgICBAcmVwbGFjZSgnZmluZFByZXZpb3VzJywgJ2ZpcnN0TWFya2VySW5kZXhCZWZvcmVDdXJzb3InKVxuXG4gIHJlcGxhY2U6IChuZXh0T3JQcmV2aW91c0ZuLCBuZXh0SW5kZXhGbikgLT5cbiAgICBAc2VhcmNoKClcbiAgICBAZmluZEhpc3RvcnlDeWNsZXIuc3RvcmUoKVxuICAgIEByZXBsYWNlSGlzdG9yeUN5Y2xlci5zdG9yZSgpXG5cbiAgICBpZiBAbWFya2Vycz8ubGVuZ3RoID4gMFxuICAgICAgdW5sZXNzIGN1cnJlbnRNYXJrZXIgPSBAbW9kZWwuY3VycmVudFJlc3VsdE1hcmtlclxuICAgICAgICBpZiBwb3NpdGlvbiA9IEBbbmV4dEluZGV4Rm5dKClcbiAgICAgICAgICBjdXJyZW50TWFya2VyID0gQG1hcmtlcnNbcG9zaXRpb24uaW5kZXhdXG5cbiAgICAgIEBtb2RlbC5yZXBsYWNlKFtjdXJyZW50TWFya2VyXSwgQHJlcGxhY2VFZGl0b3IuZ2V0VGV4dCgpKVxuICAgICAgQFtuZXh0T3JQcmV2aW91c0ZuXShmaWVsZFRvRm9jdXM6IEByZXBsYWNlRWRpdG9yKVxuICAgIGVsc2VcbiAgICAgIGF0b20uYmVlcCgpXG5cbiAgcmVwbGFjZUFsbDogPT5cbiAgICBAc2VhcmNoKClcbiAgICBpZiBAbWFya2Vycz8ubGVuZ3RoXG4gICAgICBAZmluZEhpc3RvcnlDeWNsZXIuc3RvcmUoKVxuICAgICAgQHJlcGxhY2VIaXN0b3J5Q3ljbGVyLnN0b3JlKClcbiAgICAgIEBtb2RlbC5yZXBsYWNlKEBtYXJrZXJzLCBAcmVwbGFjZUVkaXRvci5nZXRUZXh0KCkpXG4gICAgZWxzZVxuICAgICAgYXRvbS5iZWVwKClcblxuICBtYXJrZXJzVXBkYXRlZDogKEBtYXJrZXJzKSA9PlxuICAgIEBmaW5kRXJyb3IgPSBudWxsXG4gICAgQHVwZGF0ZVJlc3VsdENvdW50ZXIoKVxuICAgIEB1cGRhdGVSZXBsYWNlRW5hYmxlbWVudCgpXG5cbiAgICBpZiBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS5maW5kUGF0dGVyblxuICAgICAgcmVzdWx0cyA9IEBtYXJrZXJzLmxlbmd0aFxuICAgICAgcmVzdWx0c1N0ciA9IGlmIHJlc3VsdHMgdGhlbiBfLnBsdXJhbGl6ZShyZXN1bHRzLCAncmVzdWx0JykgZWxzZSAnTm8gcmVzdWx0cydcbiAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ2hhcy1yZXN1bHRzIGhhcy1uby1yZXN1bHRzJylcbiAgICAgIHRoaXMuYWRkQ2xhc3MoaWYgcmVzdWx0cyB0aGVuICdoYXMtcmVzdWx0cycgZWxzZSAnaGFzLW5vLXJlc3VsdHMnKVxuICAgICAgQHNldEluZm9NZXNzYWdlKFwiI3tyZXN1bHRzU3RyfSBmb3VuZCBmb3IgJyN7QG1vZGVsLmdldEZpbmRPcHRpb25zKCkuZmluZFBhdHRlcm59J1wiKVxuICAgICAgaWYgQGZpbmRFZGl0b3IuaGFzRm9jdXMoKSBhbmQgcmVzdWx0cyA+IDAgYW5kIGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5zY3JvbGxUb1Jlc3VsdE9uTGl2ZVNlYXJjaCcpXG4gICAgICAgIEBmaW5kQW5kU2VsZWN0UmVzdWx0KEBzZWxlY3RGaXJzdE1hcmtlclN0YXJ0aW5nRnJvbUN1cnNvciwgZm9jdXNFZGl0b3JBZnRlcjogZmFsc2UpXG4gICAgZWxzZVxuICAgICAgQGNsZWFyTWVzc2FnZSgpXG5cbiAgZmluZEVycm9yOiAoZXJyb3IpID0+XG4gICAgQHNldEVycm9yTWVzc2FnZShlcnJvci5tZXNzYWdlKVxuXG4gIHVwZGF0ZVJlc3VsdENvdW50ZXI6ID0+XG4gICAgaWYgQG1vZGVsLmN1cnJlbnRSZXN1bHRNYXJrZXIgYW5kIChpbmRleCA9IEBtYXJrZXJzPy5pbmRleE9mKEBtb2RlbC5jdXJyZW50UmVzdWx0TWFya2VyKSkgPiAtMVxuICAgICAgdGV4dCA9IFwiI3sgaW5kZXggKyAxfSBvZiAje0BtYXJrZXJzLmxlbmd0aH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIG5vdCBAbWFya2Vycz8gb3IgQG1hcmtlcnMubGVuZ3RoIGlzIDBcbiAgICAgICAgdGV4dCA9IFwibm8gcmVzdWx0c1wiXG4gICAgICBlbHNlIGlmIEBtYXJrZXJzLmxlbmd0aCBpcyAxXG4gICAgICAgIHRleHQgPSBcIjEgZm91bmRcIlxuICAgICAgZWxzZVxuICAgICAgICB0ZXh0ID0gXCIje0BtYXJrZXJzLmxlbmd0aH0gZm91bmRcIlxuXG4gICAgQHJlc3VsdENvdW50ZXIudGV4dCB0ZXh0XG5cbiAgc2V0SW5mb01lc3NhZ2U6IChpbmZvTWVzc2FnZSkgLT5cbiAgICBAZGVzY3JpcHRpb25MYWJlbC50ZXh0KGluZm9NZXNzYWdlKS5yZW1vdmVDbGFzcygndGV4dC1lcnJvcicpXG5cbiAgc2V0RXJyb3JNZXNzYWdlOiAoZXJyb3JNZXNzYWdlKSAtPlxuICAgIEBkZXNjcmlwdGlvbkxhYmVsLnRleHQoZXJyb3JNZXNzYWdlKS5hZGRDbGFzcygndGV4dC1lcnJvcicpXG5cbiAgY2xlYXJNZXNzYWdlOiAtPlxuICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ2hhcy1yZXN1bHRzIGhhcy1uby1yZXN1bHRzJylcbiAgICBAZGVzY3JpcHRpb25MYWJlbC5odG1sKCdGaW5kIGluIEN1cnJlbnQgQnVmZmVyIDxzcGFuIGNsYXNzPVwic3VidGxlLWluZm8tbWVzc2FnZVwiPkNsb3NlIHRoaXMgcGFuZWwgd2l0aCB0aGUgPHNwYW4gY2xhc3M9XCJoaWdobGlnaHRcIj5lc2M8L3NwYW4+IGtleTwvc3Bhbj4nKS5yZW1vdmVDbGFzcygndGV4dC1lcnJvcicpXG5cbiAgc2VsZWN0Rmlyc3RNYXJrZXJBZnRlckN1cnNvcjogPT5cbiAgICBtYXJrZXIgPSBAZmlyc3RNYXJrZXJJbmRleEFmdGVyQ3Vyc29yKClcbiAgICByZXR1cm4gdW5sZXNzIG1hcmtlclxuICAgIHtpbmRleCwgd3JhcHBlZH0gPSBtYXJrZXJcbiAgICBAc2VsZWN0TWFya2VyQXRJbmRleChpbmRleCwgd3JhcHBlZClcblxuICBzZWxlY3RGaXJzdE1hcmtlclN0YXJ0aW5nRnJvbUN1cnNvcjogPT5cbiAgICBtYXJrZXIgPSBAZmlyc3RNYXJrZXJJbmRleEFmdGVyQ3Vyc29yKHRydWUpXG4gICAgcmV0dXJuIHVubGVzcyBtYXJrZXJcbiAgICB7aW5kZXgsIHdyYXBwZWR9ID0gbWFya2VyXG4gICAgQHNlbGVjdE1hcmtlckF0SW5kZXgoaW5kZXgsIHdyYXBwZWQpXG5cbiAgc2VsZWN0Rmlyc3RNYXJrZXJCZWZvcmVDdXJzb3I6ID0+XG4gICAgbWFya2VyID0gQGZpcnN0TWFya2VySW5kZXhCZWZvcmVDdXJzb3IoKVxuICAgIHJldHVybiB1bmxlc3MgbWFya2VyXG4gICAge2luZGV4LCB3cmFwcGVkfSA9IG1hcmtlclxuICAgIEBzZWxlY3RNYXJrZXJBdEluZGV4KGluZGV4LCB3cmFwcGVkKVxuXG4gIGZpcnN0TWFya2VySW5kZXhTdGFydGluZ0Zyb21DdXJzb3I6ID0+XG4gICAgQGZpcnN0TWFya2VySW5kZXhBZnRlckN1cnNvcih0cnVlKVxuXG4gIGZpcnN0TWFya2VySW5kZXhBZnRlckN1cnNvcjogKGluZGV4SW5jbHVkZWQ9ZmFsc2UpIC0+XG4gICAgZWRpdG9yID0gQG1vZGVsLmdldEVkaXRvcigpXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIGVkaXRvclxuXG4gICAgc2VsZWN0aW9uID0gZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgIHtzdGFydCwgZW5kfSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgc3RhcnQgPSBlbmQgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuXG4gICAgZm9yIG1hcmtlciwgaW5kZXggaW4gQG1hcmtlcnNcbiAgICAgIG1hcmtlclN0YXJ0UG9zaXRpb24gPSBtYXJrZXIuYnVmZmVyTWFya2VyLmdldFN0YXJ0UG9zaXRpb24oKVxuICAgICAgc3dpdGNoIG1hcmtlclN0YXJ0UG9zaXRpb24uY29tcGFyZShzdGFydClcbiAgICAgICAgd2hlbiAtMSB0aGVuIGNvbnRpbnVlXG4gICAgICAgIHdoZW4gMCB0aGVuIGNvbnRpbnVlIHVubGVzcyBpbmRleEluY2x1ZGVkXG4gICAgICByZXR1cm4ge2luZGV4LCB3cmFwcGVkOiBudWxsfVxuXG4gICAge2luZGV4OiAwLCB3cmFwcGVkOiAndXAnfVxuXG4gIGZpcnN0TWFya2VySW5kZXhCZWZvcmVDdXJzb3I6IC0+XG4gICAgZWRpdG9yID0gQG1vZGVsLmdldEVkaXRvcigpXG4gICAgcmV0dXJuIG51bGwgdW5sZXNzIGVkaXRvclxuXG4gICAgc2VsZWN0aW9uID0gQG1vZGVsLmdldEVkaXRvcigpLmdldExhc3RTZWxlY3Rpb24oKVxuICAgIHtzdGFydCwgZW5kfSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgc3RhcnQgPSBlbmQgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuXG4gICAgZm9yIG1hcmtlciwgaW5kZXggaW4gQG1hcmtlcnMgYnkgLTFcbiAgICAgIG1hcmtlckVuZFBvc2l0aW9uID0gbWFya2VyLmJ1ZmZlck1hcmtlci5nZXRFbmRQb3NpdGlvbigpXG4gICAgICByZXR1cm4ge2luZGV4LCB3cmFwcGVkOiBudWxsfSBpZiBtYXJrZXJFbmRQb3NpdGlvbi5pc0xlc3NUaGFuKHN0YXJ0KVxuXG4gICAge2luZGV4OiBAbWFya2Vycy5sZW5ndGggLSAxLCB3cmFwcGVkOiAnZG93bid9XG5cbiAgc2VsZWN0QWxsTWFya2VyczogPT5cbiAgICByZXR1cm4gdW5sZXNzIEBtYXJrZXJzPy5sZW5ndGggPiAwXG4gICAgcmFuZ2VzID0gKG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpIGZvciBtYXJrZXIgaW4gQG1hcmtlcnMpXG4gICAgc2Nyb2xsTWFya2VyID0gQG1hcmtlcnNbQGZpcnN0TWFya2VySW5kZXhBZnRlckN1cnNvcigpLmluZGV4XVxuICAgIGVkaXRvciA9IEBtb2RlbC5nZXRFZGl0b3IoKVxuICAgIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhyYW5nZXMsIGZsYXNoOiB0cnVlKVxuICAgIGVkaXRvci5zY3JvbGxUb0J1ZmZlclBvc2l0aW9uKHNjcm9sbE1hcmtlci5nZXRTdGFydEJ1ZmZlclBvc2l0aW9uKCksIGNlbnRlcjogdHJ1ZSlcblxuICBzZWxlY3RNYXJrZXJBdEluZGV4OiAobWFya2VySW5kZXgsIHdyYXBwZWQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbWFya2Vycz8ubGVuZ3RoID4gMFxuXG4gICAgaWYgbWFya2VyID0gQG1hcmtlcnNbbWFya2VySW5kZXhdXG4gICAgICBlZGl0b3IgPSBAbW9kZWwuZ2V0RWRpdG9yKClcbiAgICAgIHNjcmVlblJhbmdlID0gbWFya2VyLmdldFNjcmVlblJhbmdlKClcblxuICAgICAgaWYgKFxuICAgICAgICBzY3JlZW5SYW5nZS5zdGFydC5yb3cgPCBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkgb3JcbiAgICAgICAgc2NyZWVuUmFuZ2UuZW5kLnJvdyA+IGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgICApXG4gICAgICAgIHN3aXRjaCB3cmFwcGVkXG4gICAgICAgICAgd2hlbiAndXAnXG4gICAgICAgICAgICBAc2hvd1dyYXBJY29uKCdpY29uLW1vdmUtdXAnKVxuICAgICAgICAgIHdoZW4gJ2Rvd24nXG4gICAgICAgICAgICBAc2hvd1dyYXBJY29uKCdpY29uLW1vdmUtZG93bicpXG5cbiAgICAgIGVkaXRvci5zZXRTZWxlY3RlZFNjcmVlblJhbmdlKHNjcmVlblJhbmdlLCBmbGFzaDogdHJ1ZSlcbiAgICAgIGVkaXRvci5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKGNlbnRlcjogdHJ1ZSlcblxuICBzZXRTZWxlY3Rpb25Bc0ZpbmRQYXR0ZXJuOiA9PlxuICAgIGVkaXRvciA9IEBtb2RlbC5nZXRFZGl0b3IoKVxuICAgIGlmIGVkaXRvcj8uZ2V0U2VsZWN0ZWRUZXh0P1xuICAgICAgZmluZFBhdHRlcm4gPSBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkgb3IgZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpXG4gICAgICBmaW5kUGF0dGVybiA9IFV0aWwuZXNjYXBlUmVnZXgoZmluZFBhdHRlcm4pIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLnVzZVJlZ2V4XG4gICAgICBpZiBmaW5kUGF0dGVyblxuICAgICAgICBAZmluZEVkaXRvci5zZXRUZXh0KGZpbmRQYXR0ZXJuKVxuICAgICAgICBAc2VhcmNoKClcblxuICBmaW5kTmV4dFNlbGVjdGVkOiA9PlxuICAgIEBzZXRTZWxlY3Rpb25Bc0ZpbmRQYXR0ZXJuKClcbiAgICBAZmluZE5leHQoZm9jdXNFZGl0b3JBZnRlcjogdHJ1ZSlcblxuICBmaW5kUHJldmlvdXNTZWxlY3RlZDogPT5cbiAgICBAc2V0U2VsZWN0aW9uQXNGaW5kUGF0dGVybigpXG4gICAgQGZpbmRQcmV2aW91cyhmb2N1c0VkaXRvckFmdGVyOiB0cnVlKVxuXG4gIHVwZGF0ZU9wdGlvblZpZXdzOiA9PlxuICAgIEB1cGRhdGVPcHRpb25CdXR0b25zKClcbiAgICBAdXBkYXRlT3B0aW9uc0xhYmVsKClcbiAgICBAdXBkYXRlU3ludGF4SGlnaGxpZ2h0aW5nKClcblxuICB1cGRhdGVTeW50YXhIaWdobGlnaHRpbmc6IC0+XG4gICAgaWYgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkudXNlUmVnZXhcbiAgICAgIEBmaW5kRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcy5yZWdleHAnKSlcbiAgICAgIEByZXBsYWNlRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcy5yZWdleHAucmVwbGFjZW1lbnQnKSlcbiAgICBlbHNlXG4gICAgICBAZmluZEVkaXRvci5nZXRNb2RlbCgpLnNldEdyYW1tYXIoYXRvbS5ncmFtbWFycy5udWxsR3JhbW1hcilcbiAgICAgIEByZXBsYWNlRWRpdG9yLmdldE1vZGVsKCkuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLm51bGxHcmFtbWFyKVxuXG4gIHVwZGF0ZU9wdGlvbnNMYWJlbDogLT5cbiAgICBsYWJlbCA9IFtdXG4gICAgbGFiZWwucHVzaCgnUmVnZXgnKSBpZiBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleFxuICAgIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmNhc2VTZW5zaXRpdmVcbiAgICAgIGxhYmVsLnB1c2goJ0Nhc2UgU2Vuc2l0aXZlJylcbiAgICBlbHNlXG4gICAgICBsYWJlbC5wdXNoKCdDYXNlIEluc2Vuc2l0aXZlJylcbiAgICBsYWJlbC5wdXNoKCdXaXRoaW4gQ3VycmVudCBTZWxlY3Rpb24nKSBpZiBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS5pbkN1cnJlbnRTZWxlY3Rpb25cbiAgICBsYWJlbC5wdXNoKCdXaG9sZSBXb3JkJykgaWYgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkud2hvbGVXb3JkXG4gICAgQG9wdGlvbnNMYWJlbC50ZXh0KGxhYmVsLmpvaW4oJywgJykpXG5cbiAgdXBkYXRlT3B0aW9uQnV0dG9uczogLT5cbiAgICBAc2V0T3B0aW9uQnV0dG9uU3RhdGUoQHJlZ2V4T3B0aW9uQnV0dG9uLCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleClcbiAgICBAc2V0T3B0aW9uQnV0dG9uU3RhdGUoQGNhc2VPcHRpb25CdXR0b24sIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmNhc2VTZW5zaXRpdmUpXG4gICAgQHNldE9wdGlvbkJ1dHRvblN0YXRlKEBzZWxlY3Rpb25PcHRpb25CdXR0b24sIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmluQ3VycmVudFNlbGVjdGlvbilcbiAgICBAc2V0T3B0aW9uQnV0dG9uU3RhdGUoQHdob2xlV29yZE9wdGlvbkJ1dHRvbiwgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkud2hvbGVXb3JkKVxuXG4gIHNldE9wdGlvbkJ1dHRvblN0YXRlOiAob3B0aW9uQnV0dG9uLCBzZWxlY3RlZCkgLT5cbiAgICBpZiBzZWxlY3RlZFxuICAgICAgb3B0aW9uQnV0dG9uLmFkZENsYXNzICdzZWxlY3RlZCdcbiAgICBlbHNlXG4gICAgICBvcHRpb25CdXR0b24ucmVtb3ZlQ2xhc3MgJ3NlbGVjdGVkJ1xuXG4gIGFueU1hcmtlcnNBcmVTZWxlY3RlZDogPT5cbiAgICBlZGl0b3IgPSBAbW9kZWwuZ2V0RWRpdG9yKClcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGVkaXRvclxuICAgIGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpLnNvbWUgKHNlbGVjdGVkUmFuZ2UpID0+XG4gICAgICBAbW9kZWwuZmluZE1hcmtlcihzZWxlY3RlZFJhbmdlKVxuXG4gIHRvZ2dsZVJlZ2V4T3B0aW9uOiA9PlxuICAgIEBzZWFyY2godXNlUmVnZXg6IG5vdCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS51c2VSZWdleClcbiAgICBAc2VsZWN0Rmlyc3RNYXJrZXJBZnRlckN1cnNvcigpIHVubGVzcyBAYW55TWFya2Vyc0FyZVNlbGVjdGVkKClcblxuICB0b2dnbGVDYXNlT3B0aW9uOiA9PlxuICAgIEBzZWFyY2goY2FzZVNlbnNpdGl2ZTogbm90IEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLmNhc2VTZW5zaXRpdmUpXG4gICAgQHNlbGVjdEZpcnN0TWFya2VyQWZ0ZXJDdXJzb3IoKSB1bmxlc3MgQGFueU1hcmtlcnNBcmVTZWxlY3RlZCgpXG5cbiAgdG9nZ2xlU2VsZWN0aW9uT3B0aW9uOiA9PlxuICAgIEBzZWFyY2goaW5DdXJyZW50U2VsZWN0aW9uOiBub3QgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkuaW5DdXJyZW50U2VsZWN0aW9uKVxuICAgIEBzZWxlY3RGaXJzdE1hcmtlckFmdGVyQ3Vyc29yKCkgdW5sZXNzIEBhbnlNYXJrZXJzQXJlU2VsZWN0ZWQoKVxuXG4gIHRvZ2dsZVdob2xlV29yZE9wdGlvbjogPT5cbiAgICBAc2VhcmNoKEBmaW5kRWRpdG9yLmdldFRleHQoKSwgd2hvbGVXb3JkOiBub3QgQG1vZGVsLmdldEZpbmRPcHRpb25zKCkud2hvbGVXb3JkKVxuICAgIEBzZWxlY3RGaXJzdE1hcmtlckFmdGVyQ3Vyc29yKCkgdW5sZXNzIEBhbnlNYXJrZXJzQXJlU2VsZWN0ZWQoKVxuXG4gIHVwZGF0ZVJlcGxhY2VFbmFibGVtZW50OiAtPlxuICAgIGNhblJlcGxhY2UgPSBAbWFya2Vycz8ubGVuZ3RoID4gMFxuICAgIHJldHVybiBpZiBjYW5SZXBsYWNlIGFuZCBub3QgQHJlcGxhY2VBbGxCdXR0b25bMF0uY2xhc3NMaXN0LmNvbnRhaW5zKCdkaXNhYmxlZCcpXG5cbiAgICBAcmVwbGFjZVRvb2x0aXBTdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAcmVwbGFjZVRvb2x0aXBTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIGlmIGNhblJlcGxhY2VcbiAgICAgIEByZXBsYWNlQWxsQnV0dG9uWzBdLmNsYXNzTGlzdC5yZW1vdmUoJ2Rpc2FibGVkJylcbiAgICAgIEByZXBsYWNlTmV4dEJ1dHRvblswXS5jbGFzc0xpc3QucmVtb3ZlKCdkaXNhYmxlZCcpXG5cbiAgICAgIEByZXBsYWNlVG9vbHRpcFN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEByZXBsYWNlTmV4dEJ1dHRvbixcbiAgICAgICAgdGl0bGU6IFwiUmVwbGFjZSBOZXh0XCJcbiAgICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOnJlcGxhY2UtbmV4dCdcbiAgICAgICAga2V5QmluZGluZ1RhcmdldDogQHJlcGxhY2VFZGl0b3IuZWxlbWVudFxuICAgICAgQHJlcGxhY2VUb29sdGlwU3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHJlcGxhY2VBbGxCdXR0b24sXG4gICAgICAgIHRpdGxlOiBcIlJlcGxhY2UgQWxsXCJcbiAgICAgICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOnJlcGxhY2UtYWxsJ1xuICAgICAgICBrZXlCaW5kaW5nVGFyZ2V0OiBAcmVwbGFjZUVkaXRvci5lbGVtZW50XG4gICAgZWxzZVxuICAgICAgQHJlcGxhY2VBbGxCdXR0b25bMF0uY2xhc3NMaXN0LmFkZCgnZGlzYWJsZWQnKVxuICAgICAgQHJlcGxhY2VOZXh0QnV0dG9uWzBdLmNsYXNzTGlzdC5hZGQoJ2Rpc2FibGVkJylcblxuICAgICAgQHJlcGxhY2VUb29sdGlwU3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHJlcGxhY2VOZXh0QnV0dG9uLFxuICAgICAgICB0aXRsZTogXCJSZXBsYWNlIE5leHQgW3doZW4gdGhlcmUgYXJlIHJlc3VsdHNdXCJcbiAgICAgIEByZXBsYWNlVG9vbHRpcFN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEByZXBsYWNlQWxsQnV0dG9uLFxuICAgICAgICB0aXRsZTogXCJSZXBsYWNlIEFsbCBbd2hlbiB0aGVyZSBhcmUgcmVzdWx0c11cIlxuXG4gICMgRklYTUU6IFRoZSB3cmFwIGljb24gc2hvdWxkIHByb2JhYmx5IGJlIGl0cyBvd24gdmlldyByZXNwb25kaW5nIHRvIGV2ZW50c1xuICAjIHdoZW4gdGhlIHNlYXJjaCB3cmFwcy5cbiAgY3JlYXRlV3JhcEljb246IC0+XG4gICAgd3JhcEljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHdyYXBJY29uLmNsYXNzTGlzdC5hZGQoJ2ZpbmQtd3JhcC1pY29uJylcbiAgICBAd3JhcEljb24gPSAkKHdyYXBJY29uKVxuXG4gIHNob3dXcmFwSWNvbjogKGljb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ2ZpbmQtYW5kLXJlcGxhY2Uuc2hvd1NlYXJjaFdyYXBJY29uJylcbiAgICBlZGl0b3IgPSBAbW9kZWwuZ2V0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cbiAgICBlZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvclZpZXc/LnBhcmVudE5vZGU/XG5cbiAgICAjIEF0dGFjaCB0byB0aGUgcGFyZW50IG9mIHRoZSBhY3RpdmUgZWRpdG9yLCB0aGF0IHdheSB3ZSBjYW4gcG9zaXRpb24gaXRcbiAgICAjIGNvcnJlY3RseSBvdmVyIHRoZSBhY3RpdmUgZWRpdG9yLlxuICAgIGVkaXRvclZpZXcucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChAd3JhcEljb25bMF0pXG5cbiAgICAjIEZJWE1FOiBUaGlzIGFuaW1hdGlvbiBzaG91bGQgYmUgaW4gQ1NTXG4gICAgQHdyYXBJY29uLmF0dHIoJ2NsYXNzJywgXCJmaW5kLXdyYXAtaWNvbiAje2ljb259XCIpLmZhZGVJbigpXG4gICAgY2xlYXJUaW1lb3V0KEB3cmFwVGltZW91dClcbiAgICBAd3JhcFRpbWVvdXQgPSBzZXRUaW1lb3V0ICg9PiBAd3JhcEljb24uZmFkZU91dCgpKSwgMTAwMFxuIl19
