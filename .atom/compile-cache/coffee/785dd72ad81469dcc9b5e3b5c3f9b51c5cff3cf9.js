(function() {
  var Base, CreatePersistentSelection, Decrease, DecrementNumber, Delete, DeleteLeft, DeleteLine, DeleteOccurrenceInAFunctionOrInnerParagraph, DeleteRight, DeleteToLastCharacterOfLine, Disposable, Increase, IncrementNumber, LineEndingRegExp, Mark, Operator, Point, PutAfter, PutAfterAndSelect, PutBefore, PutBeforeAndSelect, Range, Select, SelectLatestChange, SelectOccurrence, SelectOccurrenceInAFunctionOrInnerParagraph, SelectPersistentSelection, SelectPreviousSelection, TogglePersistentSelection, TogglePresetOccurrence, Yank, YankLine, YankToLastCharacterOfLine, _, cursorIsAtEmptyRow, debug, destroyNonLastSelection, getValidVimBufferRow, getVisibleBufferRange, getWordPatternAtBufferPosition, haveSomeNonEmptySelection, highlightRanges, inspect, isEndsWithNewLineForBufferRow, ref, ref1, selectedRange, selectedText, settings, swrap, toString,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  LineEndingRegExp = /(?:\n|\r\n)$/;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range, Disposable = ref.Disposable;

  inspect = require('util').inspect;

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, highlightRanges = ref1.highlightRanges, isEndsWithNewLineForBufferRow = ref1.isEndsWithNewLineForBufferRow, getValidVimBufferRow = ref1.getValidVimBufferRow, cursorIsAtEmptyRow = ref1.cursorIsAtEmptyRow, getVisibleBufferRange = ref1.getVisibleBufferRange, getWordPatternAtBufferPosition = ref1.getWordPatternAtBufferPosition, destroyNonLastSelection = ref1.destroyNonLastSelection, selectedRange = ref1.selectedRange, selectedText = ref1.selectedText, toString = ref1.toString, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Operator = (function(superClass) {
    extend(Operator, superClass);

    Operator.extend(false);

    Operator.prototype.requireTarget = true;

    Operator.prototype.recordable = true;

    Operator.prototype.wise = null;

    Operator.prototype.occurrence = false;

    Operator.prototype.patternForOccurrence = null;

    Operator.prototype.stayOnLinewise = false;

    Operator.prototype.stayAtSamePosition = null;

    Operator.prototype.clipToMutationEndOnStay = true;

    Operator.prototype.useMarkerForStay = false;

    Operator.prototype.restorePositions = true;

    Operator.prototype.restorePositionsToMutationEnd = false;

    Operator.prototype.flashTarget = true;

    Operator.prototype.trackChange = false;

    Operator.prototype.acceptPresetOccurrence = true;

    Operator.prototype.acceptPersistentSelection = true;

    Operator.prototype.needStay = function() {
      return this.stayAtSamePosition != null ? this.stayAtSamePosition : this.stayAtSamePosition = (function(_this) {
        return function() {
          var base, param;
          param = _this.getStayParam();
          if (_this.isMode('visual', 'linewise')) {
            return settings.get(param);
          } else {
            return settings.get(param) || (_this.stayOnLinewise && (typeof (base = _this.target).isLinewise === "function" ? base.isLinewise() : void 0));
          }
        };
      })(this)();
    };

    Operator.prototype.getStayParam = function() {
      switch (false) {
        case !this["instanceof"]('Increase'):
          return 'stayOnIncrease';
        case !this["instanceof"]('TransformString'):
          return 'stayOnTransformString';
        case !this["instanceof"]('Delete'):
          return 'stayOnDelete';
        default:
          return "stayOn" + (this.getName());
      }
    };

    Operator.prototype.isOccurrence = function() {
      return this.occurrence;
    };

    Operator.prototype.setMarkForChange = function(range) {
      return this.vimState.mark.setRange('[', ']', range);
    };

    Operator.prototype.needFlash = function() {
      var ref2;
      if (this.flashTarget && !this.isMode('visual')) {
        return settings.get('flashOnOperate') && (ref2 = this.getName(), indexOf.call(settings.get('flashOnOperateBlacklist'), ref2) < 0);
      }
    };

    Operator.prototype.flashIfNecessary = function(ranges) {
      if (!this.needFlash()) {
        return;
      }
      return highlightRanges(this.editor, ranges, {
        "class": 'vim-mode-plus-flash',
        timeout: settings.get('flashOnOperateDuration')
      });
    };

    Operator.prototype.flashChangeIfNecessary = function() {
      if (!this.needFlash()) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var ranges;
          ranges = _this.mutationManager.getMarkerBufferRanges().filter(function(range) {
            return !range.isEmpty();
          });
          if (ranges.length) {
            return _this.flashIfNecessary(ranges);
          }
        };
      })(this));
    };

    Operator.prototype.trackChangeIfNecessary = function() {
      if (!this.trackChange) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var marker, ref2;
          if (marker = (ref2 = _this.mutationManager.getMutationForSelection(_this.editor.getLastSelection())) != null ? ref2.marker : void 0) {
            return _this.setMarkForChange(marker.getBufferRange());
          }
        };
      })(this));
    };

    function Operator() {
      var implicitTarget, ref2;
      Operator.__super__.constructor.apply(this, arguments);
      ref2 = this.vimState, this.mutationManager = ref2.mutationManager, this.occurrenceManager = ref2.occurrenceManager, this.persistentSelection = ref2.persistentSelection;
      this.initialize();
      this.onDidSetOperatorModifier((function(_this) {
        return function(arg) {
          var occurrence, wise;
          occurrence = arg.occurrence, wise = arg.wise;
          if (wise != null) {
            _this.wise = wise;
          }
          if (occurrence != null) {
            return _this.setOccurrence('modifier');
          }
        };
      })(this));
      if (implicitTarget = this.getImplicitTarget()) {
        if (this.target == null) {
          this.target = implicitTarget;
        }
      }
      if (_.isString(this.target)) {
        this.setTarget(this["new"](this.target));
      }
      if (this.occurrence) {
        this.setOccurrence('static');
      } else if (this.acceptPresetOccurrence && this.occurrenceManager.hasPatterns()) {
        this.setOccurrence('preset');
      }
      if (this.acceptPersistentSelection) {
        this.subscribe(this.onDidDeactivateMode((function(_this) {
          return function(arg) {
            var mode;
            mode = arg.mode;
            if (mode === 'operator-pending') {
              return _this.occurrenceManager.resetPatterns();
            }
          };
        })(this)));
      }
    }

    Operator.prototype.getImplicitTarget = function() {
      if (this.canSelectPersistentSelection()) {
        this.destroyUnknownSelection = true;
        if (this.isMode('visual')) {
          return "ACurrentSelectionAndAPersistentSelection";
        } else {
          return "APersistentSelection";
        }
      } else {
        if (this.isMode('visual')) {
          return "CurrentSelection";
        }
      }
    };

    Operator.prototype.canSelectPersistentSelection = function() {
      return this.acceptPersistentSelection && this.vimState.hasPersistentSelections() && settings.get('autoSelectPersistentSelectionOnOperate');
    };

    Operator.prototype.setOccurrence = function(type) {
      this.occurrence = true;
      switch (type) {
        case 'static':
          if (!this.isComplete()) {
            debug('static: mark as we enter operator-pending');
            if (!this.occurrenceManager.hasMarkers()) {
              return this.addOccurrencePattern();
            }
          }
          break;
        case 'preset':
          return debug('preset: nothing to do since we have markers already');
        case 'modifier':
          debug('modifier: overwrite existing marker when manually typed `o`');
          this.occurrenceManager.resetPatterns();
          return this.addOccurrencePattern();
      }
    };

    Operator.prototype.addOccurrencePattern = function(pattern) {
      var point;
      if (pattern == null) {
        pattern = null;
      }
      if (pattern == null) {
        pattern = this.patternForOccurrence;
      }
      if (pattern == null) {
        point = this.getCursorBufferPosition();
        pattern = getWordPatternAtBufferPosition(this.editor, point, {
          singleNonWordChar: true
        });
      }
      return this.occurrenceManager.addPattern(pattern);
    };

    Operator.prototype.setTarget = function(target) {
      this.target = target;
      this.target.setOperator(this);
      this.emitDidSetTarget(this);
      return this;
    };

    Operator.prototype.setTextToRegisterForSelection = function(selection) {
      return this.setTextToRegister(selection.getText(), selection);
    };

    Operator.prototype.setTextToRegister = function(text, selection) {
      var base;
      if ((typeof (base = this.target).isLinewise === "function" ? base.isLinewise() : void 0) && (!text.endsWith('\n'))) {
        text += "\n";
      }
      if (text) {
        return this.vimState.register.set({
          text: text,
          selection: selection
        });
      }
    };

    Operator.prototype.execute = function() {
      var canMutate, stopMutation;
      canMutate = true;
      stopMutation = function() {
        return canMutate = false;
      };
      if (this.selectTarget()) {
        this.editor.transact((function(_this) {
          return function() {
            var i, len, ref2, results, selection;
            ref2 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              if (canMutate) {
                results.push(_this.mutateSelection(selection, stopMutation));
              }
            }
            return results;
          };
        })(this));
        this.restoreCursorPositionsIfNecessary();
      }
      return this.activateMode('normal');
    };

    Operator.prototype.selectOccurrence = function() {
      var ranges, selectedRanges;
      if (!this.occurrenceManager.hasMarkers()) {
        this.addOccurrencePattern();
      }
      if (this.patternForOccurrence == null) {
        this.patternForOccurrence = this.occurrenceManager.buildPattern();
      }
      selectedRanges = this.editor.getSelectedBufferRanges();
      ranges = this.occurrenceManager.getMarkerRangesIntersectsWithRanges(selectedRanges, this.isMode('visual'));
      if (ranges.length) {
        if (this.isMode('visual')) {
          this.vimState.modeManager.deactivate();
        }
        this.editor.setSelectedBufferRanges(ranges);
      } else {
        this.mutationManager.restoreInitialPositions();
      }
      return this.occurrenceManager.resetPatterns();
    };

    Operator.prototype.selectTarget = function() {
      var options;
      options = {
        isSelect: this["instanceof"]('Select'),
        useMarker: this.useMarkerForStay
      };
      this.mutationManager.init(options);
      this.mutationManager.setCheckPoint('will-select');
      if (this.wise && this.target.isMotion()) {
        this.target.forceWise(this.wise);
      }
      this.emitWillSelectTarget();
      if (this.isOccurrence() && !this.occurrenceManager.hasMarkers()) {
        this.addOccurrencePattern();
      }
      this.target.select();
      if (this.isOccurrence()) {
        this.selectOccurrence();
      }
      if (haveSomeNonEmptySelection(this.editor) || this.target.getName() === "Empty") {
        this.mutationManager.setCheckPoint('did-select');
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
        return true;
      } else {
        return false;
      }
    };

    Operator.prototype.restoreCursorPositionsIfNecessary = function() {
      var options, ref2;
      if (!this.restorePositions) {
        return;
      }
      options = {
        stay: this.needStay(),
        strict: this.isOccurrence() || this.destroyUnknownSelection,
        clipToMutationEnd: this.clipToMutationEndOnStay,
        isBlockwise: (ref2 = this.target) != null ? typeof ref2.isBlockwise === "function" ? ref2.isBlockwise() : void 0 : void 0,
        mutationEnd: this.restorePositionsToMutationEnd
      };
      this.mutationManager.restoreCursorPositions(options);
      return this.emitDidRestoreCursorPositions();
    };

    return Operator;

  })(Base);

  Select = (function(superClass) {
    extend(Select, superClass);

    function Select() {
      return Select.__super__.constructor.apply(this, arguments);
    }

    Select.extend(false);

    Select.prototype.flashTarget = false;

    Select.prototype.recordable = false;

    Select.prototype.acceptPresetOccurrence = false;

    Select.prototype.acceptPersistentSelection = false;

    Select.prototype.canChangeMode = function() {
      var base;
      if (this.isMode('visual')) {
        return this.isOccurrence() || (typeof (base = this.target).isAllowSubmodeChange === "function" ? base.isAllowSubmodeChange() : void 0);
      } else {
        return true;
      }
    };

    Select.prototype.execute = function() {
      var submode;
      this.selectTarget();
      if (this.canChangeMode()) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        return this.activateModeIfNecessary('visual', submode);
      }
    };

    return Select;

  })(Operator);

  SelectLatestChange = (function(superClass) {
    extend(SelectLatestChange, superClass);

    function SelectLatestChange() {
      return SelectLatestChange.__super__.constructor.apply(this, arguments);
    }

    SelectLatestChange.extend();

    SelectLatestChange.description = "Select latest yanked or changed range";

    SelectLatestChange.prototype.target = 'ALatestChange';

    return SelectLatestChange;

  })(Select);

  SelectPreviousSelection = (function(superClass) {
    extend(SelectPreviousSelection, superClass);

    function SelectPreviousSelection() {
      return SelectPreviousSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPreviousSelection.extend();

    SelectPreviousSelection.prototype.target = "PreviousSelection";

    SelectPreviousSelection.prototype.execute = function() {
      this.selectTarget();
      if (this.target.submode != null) {
        return this.activateModeIfNecessary('visual', this.target.submode);
      }
    };

    return SelectPreviousSelection;

  })(Select);

  SelectPersistentSelection = (function(superClass) {
    extend(SelectPersistentSelection, superClass);

    function SelectPersistentSelection() {
      return SelectPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPersistentSelection.extend();

    SelectPersistentSelection.description = "Select persistent-selection and clear all persistent-selection, it's like convert to real-selection";

    SelectPersistentSelection.prototype.target = "APersistentSelection";

    return SelectPersistentSelection;

  })(Select);

  SelectOccurrence = (function(superClass) {
    extend(SelectOccurrence, superClass);

    function SelectOccurrence() {
      return SelectOccurrence.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrence.extend();

    SelectOccurrence.description = "Add selection onto each matching word within target range";

    SelectOccurrence.prototype.occurrence = true;

    SelectOccurrence.prototype.initialize = function() {
      SelectOccurrence.__super__.initialize.apply(this, arguments);
      return this.onDidSelectTarget((function(_this) {
        return function() {
          return swrap.clearProperties(_this.editor);
        };
      })(this));
    };

    SelectOccurrence.prototype.execute = function() {
      var submode;
      if (this.selectTarget()) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        return this.activateModeIfNecessary('visual', submode);
      }
    };

    return SelectOccurrence;

  })(Operator);

  SelectOccurrenceInAFunctionOrInnerParagraph = (function(superClass) {
    extend(SelectOccurrenceInAFunctionOrInnerParagraph, superClass);

    function SelectOccurrenceInAFunctionOrInnerParagraph() {
      return SelectOccurrenceInAFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrenceInAFunctionOrInnerParagraph.extend();

    SelectOccurrenceInAFunctionOrInnerParagraph.prototype.target = "AFunctionOrInnerParagraph";

    return SelectOccurrenceInAFunctionOrInnerParagraph;

  })(SelectOccurrence);

  CreatePersistentSelection = (function(superClass) {
    extend(CreatePersistentSelection, superClass);

    function CreatePersistentSelection() {
      return CreatePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    CreatePersistentSelection.extend();

    CreatePersistentSelection.prototype.flashTarget = false;

    CreatePersistentSelection.prototype.stayAtSamePosition = true;

    CreatePersistentSelection.prototype.acceptPresetOccurrence = false;

    CreatePersistentSelection.prototype.acceptPersistentSelection = false;

    CreatePersistentSelection.prototype.mutateSelection = function(selection) {
      return this.persistentSelection.markBufferRange(selection.getBufferRange());
    };

    CreatePersistentSelection.prototype.execute = function() {
      this.onDidFinishOperation((function(_this) {
        return function() {
          return destroyNonLastSelection(_this.editor);
        };
      })(this));
      return CreatePersistentSelection.__super__.execute.apply(this, arguments);
    };

    return CreatePersistentSelection;

  })(Operator);

  TogglePersistentSelection = (function(superClass) {
    extend(TogglePersistentSelection, superClass);

    function TogglePersistentSelection() {
      return TogglePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    TogglePersistentSelection.extend();

    TogglePersistentSelection.prototype.isComplete = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      if (this.markerToRemove = this.persistentSelection.getMarkerAtPoint(point)) {
        return true;
      } else {
        return TogglePersistentSelection.__super__.isComplete.apply(this, arguments);
      }
    };

    TogglePersistentSelection.prototype.execute = function() {
      if (this.markerToRemove) {
        return this.markerToRemove.destroy();
      } else {
        return TogglePersistentSelection.__super__.execute.apply(this, arguments);
      }
    };

    return TogglePersistentSelection;

  })(CreatePersistentSelection);

  TogglePresetOccurrence = (function(superClass) {
    extend(TogglePresetOccurrence, superClass);

    function TogglePresetOccurrence() {
      return TogglePresetOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetOccurrence.extend();

    TogglePresetOccurrence.prototype.flashTarget = false;

    TogglePresetOccurrence.prototype.requireTarget = false;

    TogglePresetOccurrence.prototype.stayAtSamePosition = true;

    TogglePresetOccurrence.prototype.acceptPresetOccurrence = false;

    TogglePresetOccurrence.prototype.execute = function() {
      var isNarrowed, marker, pattern, text;
      this.occurrenceManager = this.vimState.occurrenceManager;
      if (marker = this.occurrenceManager.getMarkerAtPoint(this.editor.getCursorBufferPosition())) {
        return marker.destroy();
      } else {
        pattern = null;
        isNarrowed = this.vimState.modeManager.isNarrowed();
        if (this.isMode('visual') && !isNarrowed) {
          text = this.editor.getSelectedText();
          pattern = new RegExp(_.escapeRegExp(text), 'g');
        }
        this.addOccurrencePattern(pattern);
        if (!isNarrowed) {
          return this.activateMode('normal');
        }
      }
    };

    return TogglePresetOccurrence;

  })(Operator);

  Delete = (function(superClass) {
    extend(Delete, superClass);

    function Delete() {
      this.mutateSelection = bind(this.mutateSelection, this);
      return Delete.__super__.constructor.apply(this, arguments);
    }

    Delete.extend();

    Delete.prototype.hover = {
      icon: ':delete:',
      emoji: ':scissors:'
    };

    Delete.prototype.trackChange = true;

    Delete.prototype.flashTarget = false;

    Delete.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          if (_this.target.isLinewise()) {
            return _this.requestAdjustCursorPositions();
          }
        };
      })(this));
      return Delete.__super__.execute.apply(this, arguments);
    };

    Delete.prototype.mutateSelection = function(selection) {
      this.setTextToRegisterForSelection(selection);
      return selection.deleteSelectedText();
    };

    Delete.prototype.requestAdjustCursorPositions = function() {
      return this.onDidRestoreCursorPositions((function(_this) {
        return function() {
          var cursor, i, len, ref2, results;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(_this.adjustCursor(cursor));
          }
          return results;
        };
      })(this));
    };

    Delete.prototype.adjustCursor = function(cursor) {
      var point, row;
      row = getValidVimBufferRow(this.editor, cursor.getBufferRow());
      if (this.needStay()) {
        point = this.mutationManager.getInitialPointForSelection(cursor.selection);
        return cursor.setBufferPosition([row, point.column]);
      } else {
        cursor.setBufferPosition([row, 0]);
        return cursor.skipLeadingWhitespace();
      }
    };

    return Delete;

  })(Operator);

  DeleteRight = (function(superClass) {
    extend(DeleteRight, superClass);

    function DeleteRight() {
      return DeleteRight.__super__.constructor.apply(this, arguments);
    }

    DeleteRight.extend();

    DeleteRight.prototype.target = 'MoveRight';

    DeleteRight.prototype.hover = null;

    return DeleteRight;

  })(Delete);

  DeleteLeft = (function(superClass) {
    extend(DeleteLeft, superClass);

    function DeleteLeft() {
      return DeleteLeft.__super__.constructor.apply(this, arguments);
    }

    DeleteLeft.extend();

    DeleteLeft.prototype.target = 'MoveLeft';

    return DeleteLeft;

  })(Delete);

  DeleteToLastCharacterOfLine = (function(superClass) {
    extend(DeleteToLastCharacterOfLine, superClass);

    function DeleteToLastCharacterOfLine() {
      return DeleteToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    DeleteToLastCharacterOfLine.extend();

    DeleteToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    DeleteToLastCharacterOfLine.prototype.execute = function() {
      if (this.isMode('visual', 'blockwise')) {
        swrap.setReversedState(this.editor, false);
      }
      return DeleteToLastCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return DeleteToLastCharacterOfLine;

  })(Delete);

  DeleteLine = (function(superClass) {
    extend(DeleteLine, superClass);

    function DeleteLine() {
      return DeleteLine.__super__.constructor.apply(this, arguments);
    }

    DeleteLine.extend();

    DeleteLine.commandScope = 'atom-text-editor.vim-mode-plus.visual-mode';

    DeleteLine.prototype.wise = 'linewise';

    return DeleteLine;

  })(Delete);

  DeleteOccurrenceInAFunctionOrInnerParagraph = (function(superClass) {
    extend(DeleteOccurrenceInAFunctionOrInnerParagraph, superClass);

    function DeleteOccurrenceInAFunctionOrInnerParagraph() {
      return DeleteOccurrenceInAFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    DeleteOccurrenceInAFunctionOrInnerParagraph.extend();

    DeleteOccurrenceInAFunctionOrInnerParagraph.prototype.occurrence = true;

    DeleteOccurrenceInAFunctionOrInnerParagraph.prototype.target = "AFunctionOrInnerParagraph";

    return DeleteOccurrenceInAFunctionOrInnerParagraph;

  })(Delete);

  Yank = (function(superClass) {
    extend(Yank, superClass);

    function Yank() {
      return Yank.__super__.constructor.apply(this, arguments);
    }

    Yank.extend();

    Yank.prototype.hover = {
      icon: ':yank:',
      emoji: ':clipboard:'
    };

    Yank.prototype.trackChange = true;

    Yank.prototype.stayOnLinewise = true;

    Yank.prototype.clipToMutationEndOnStay = false;

    Yank.prototype.mutateSelection = function(selection) {
      return this.setTextToRegisterForSelection(selection);
    };

    return Yank;

  })(Operator);

  YankLine = (function(superClass) {
    extend(YankLine, superClass);

    function YankLine() {
      return YankLine.__super__.constructor.apply(this, arguments);
    }

    YankLine.extend();

    YankLine.prototype.wise = 'linewise';

    YankLine.prototype.initialize = function() {
      YankLine.__super__.initialize.apply(this, arguments);
      if (this.isMode('normal')) {
        this.target = 'MoveToRelativeLine';
      }
      if (this.isMode('visual', 'characterwise')) {
        return this.stayOnLinewise = false;
      }
    };

    return YankLine;

  })(Yank);

  YankToLastCharacterOfLine = (function(superClass) {
    extend(YankToLastCharacterOfLine, superClass);

    function YankToLastCharacterOfLine() {
      return YankToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    YankToLastCharacterOfLine.extend();

    YankToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    return YankToLastCharacterOfLine;

  })(Yank);

  Increase = (function(superClass) {
    extend(Increase, superClass);

    function Increase() {
      return Increase.__super__.constructor.apply(this, arguments);
    }

    Increase.extend();

    Increase.prototype.requireTarget = false;

    Increase.prototype.step = 1;

    Increase.prototype.execute = function() {
      var newRanges, pattern;
      pattern = RegExp("" + (settings.get('numberRegex')), "g");
      newRanges = [];
      this.editor.transact((function(_this) {
        return function() {
          var cursor, i, len, ranges, ref2, results, scanRange;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            scanRange = _this.isMode('visual') ? cursor.selection.getBufferRange() : cursor.getCurrentLineBufferRange();
            ranges = _this.increaseNumber(cursor, scanRange, pattern);
            if (!_this.isMode('visual') && ranges.length) {
              cursor.setBufferPosition(ranges[0].end.translate([0, -1]));
            }
            results.push(newRanges.push(ranges));
          }
          return results;
        };
      })(this));
      if ((newRanges = _.flatten(newRanges)).length) {
        return this.flashIfNecessary(newRanges);
      } else {
        return atom.beep();
      }
    };

    Increase.prototype.increaseNumber = function(cursor, scanRange, pattern) {
      var newRanges;
      newRanges = [];
      this.editor.scanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var matchText, newText, range, replace, stop;
          matchText = arg.matchText, range = arg.range, stop = arg.stop, replace = arg.replace;
          newText = String(parseInt(matchText, 10) + _this.step * _this.getCount());
          if (_this.isMode('visual')) {
            return newRanges.push(replace(newText));
          } else {
            if (!range.end.isGreaterThan(cursor.getBufferPosition())) {
              return;
            }
            newRanges.push(replace(newText));
            return stop();
          }
        };
      })(this));
      return newRanges;
    };

    return Increase;

  })(Operator);

  Decrease = (function(superClass) {
    extend(Decrease, superClass);

    function Decrease() {
      return Decrease.__super__.constructor.apply(this, arguments);
    }

    Decrease.extend();

    Decrease.prototype.step = -1;

    return Decrease;

  })(Increase);

  IncrementNumber = (function(superClass) {
    extend(IncrementNumber, superClass);

    function IncrementNumber() {
      return IncrementNumber.__super__.constructor.apply(this, arguments);
    }

    IncrementNumber.extend();

    IncrementNumber.prototype.displayName = 'Increment ++';

    IncrementNumber.prototype.step = 1;

    IncrementNumber.prototype.baseNumber = null;

    IncrementNumber.prototype.execute = function() {
      var i, len, newRanges, pattern, ref2, selection;
      pattern = RegExp("" + (settings.get('numberRegex')), "g");
      newRanges = null;
      this.selectTarget();
      this.editor.transact((function(_this) {
        return function() {
          var selection;
          return newRanges = (function() {
            var i, len, ref2, results;
            ref2 = this.editor.getSelectionsOrderedByBufferPosition();
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              results.push(this.replaceNumber(selection.getBufferRange(), pattern));
            }
            return results;
          }).call(_this);
        };
      })(this));
      if ((newRanges = _.flatten(newRanges)).length) {
        this.flashIfNecessary(newRanges);
      } else {
        atom.beep();
      }
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        selection.cursor.setBufferPosition(selection.getBufferRange().start);
      }
      return this.activateModeIfNecessary('normal');
    };

    IncrementNumber.prototype.replaceNumber = function(scanRange, pattern) {
      var newRanges;
      newRanges = [];
      this.editor.scanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var matchText, replace;
          matchText = arg.matchText, replace = arg.replace;
          return newRanges.push(replace(_this.getNewText(matchText)));
        };
      })(this));
      return newRanges;
    };

    IncrementNumber.prototype.getNewText = function(text) {
      this.baseNumber = this.baseNumber != null ? this.baseNumber + this.step * this.getCount() : parseInt(text, 10);
      return String(this.baseNumber);
    };

    return IncrementNumber;

  })(Operator);

  DecrementNumber = (function(superClass) {
    extend(DecrementNumber, superClass);

    function DecrementNumber() {
      return DecrementNumber.__super__.constructor.apply(this, arguments);
    }

    DecrementNumber.extend();

    DecrementNumber.prototype.displayName = 'Decrement --';

    DecrementNumber.prototype.step = -1;

    return DecrementNumber;

  })(IncrementNumber);

  PutBefore = (function(superClass) {
    extend(PutBefore, superClass);

    function PutBefore() {
      return PutBefore.__super__.constructor.apply(this, arguments);
    }

    PutBefore.extend();

    PutBefore.prototype.restorePositions = false;

    PutBefore.prototype.location = 'before';

    PutBefore.prototype.initialize = function() {
      if (this.isMode('normal')) {
        return this.target = 'Empty';
      }
    };

    PutBefore.prototype.mutateSelection = function(selection) {
      var linewise, ref2, text, type;
      ref2 = this.vimState.register.get(null, selection), text = ref2.text, type = ref2.type;
      if (!text) {
        return;
      }
      text = _.multiplyString(text, this.getCount());
      linewise = (type === 'linewise') || this.isMode('visual', 'linewise');
      return this.paste(selection, text, {
        linewise: linewise,
        selectPastedText: this.selectPastedText
      });
    };

    PutBefore.prototype.paste = function(selection, text, arg) {
      var adjustCursor, cursor, linewise, newRange, selectPastedText;
      linewise = arg.linewise, selectPastedText = arg.selectPastedText;
      cursor = selection.cursor;
      if (linewise) {
        newRange = this.pasteLinewise(selection, text);
        adjustCursor = function(range) {
          cursor.setBufferPosition(range.start);
          return cursor.moveToFirstCharacterOfLine();
        };
      } else {
        newRange = this.pasteCharacterwise(selection, text);
        adjustCursor = function(range) {
          return cursor.setBufferPosition(range.end.translate([0, -1]));
        };
      }
      this.setMarkForChange(newRange);
      if (selectPastedText) {
        return selection.setBufferRange(newRange);
      } else {
        return adjustCursor(newRange);
      }
    };

    PutBefore.prototype.pasteLinewise = function(selection, text) {
      var cursor, end, range, row;
      cursor = selection.cursor;
      if (!text.endsWith("\n")) {
        text += "\n";
      }
      if (selection.isEmpty()) {
        row = cursor.getBufferRow();
        switch (this.location) {
          case 'before':
            range = [[row, 0], [row, 0]];
            break;
          case 'after':
            if (!isEndsWithNewLineForBufferRow(this.editor, row)) {
              text = text.replace(LineEndingRegExp, '');
            }
            cursor.moveToEndOfLine();
            end = selection.insertText("\n").end;
            range = this.editor.bufferRangeForBufferRow(end.row, {
              includeNewline: true
            });
        }
        return this.editor.setTextInBufferRange(range, text);
      } else {
        if (this.isMode('visual', 'linewise')) {
          if (selection.getBufferRange().end.column !== 0) {
            text = text.replace(LineEndingRegExp, '');
          }
        } else {
          selection.insertText("\n");
        }
        return selection.insertText(text);
      }
    };

    PutBefore.prototype.pasteCharacterwise = function(selection, text) {
      if (this.location === 'after' && selection.isEmpty() && !cursorIsAtEmptyRow(selection.cursor)) {
        selection.cursor.moveRight();
      }
      return selection.insertText(text);
    };

    return PutBefore;

  })(Operator);

  PutAfter = (function(superClass) {
    extend(PutAfter, superClass);

    function PutAfter() {
      return PutAfter.__super__.constructor.apply(this, arguments);
    }

    PutAfter.extend();

    PutAfter.prototype.location = 'after';

    return PutAfter;

  })(PutBefore);

  PutBeforeAndSelect = (function(superClass) {
    extend(PutBeforeAndSelect, superClass);

    function PutBeforeAndSelect() {
      return PutBeforeAndSelect.__super__.constructor.apply(this, arguments);
    }

    PutBeforeAndSelect.extend();

    PutBeforeAndSelect.description = "Paste before then select";

    PutBeforeAndSelect.prototype.selectPastedText = true;

    PutBeforeAndSelect.prototype.activateMode = function() {
      var submode;
      submode = swrap.detectVisualModeSubmode(this.editor);
      if (!this.vimState.isMode('visual', submode)) {
        return PutBeforeAndSelect.__super__.activateMode.call(this, 'visual', submode);
      }
    };

    return PutBeforeAndSelect;

  })(PutBefore);

  PutAfterAndSelect = (function(superClass) {
    extend(PutAfterAndSelect, superClass);

    function PutAfterAndSelect() {
      return PutAfterAndSelect.__super__.constructor.apply(this, arguments);
    }

    PutAfterAndSelect.extend();

    PutAfterAndSelect.description = "Paste after then select";

    PutAfterAndSelect.prototype.location = 'after';

    return PutAfterAndSelect;

  })(PutBeforeAndSelect);

  Mark = (function(superClass) {
    extend(Mark, superClass);

    function Mark() {
      return Mark.__super__.constructor.apply(this, arguments);
    }

    Mark.extend();

    Mark.prototype.requireInput = true;

    Mark.prototype.requireTarget = false;

    Mark.prototype.initialize = function() {
      return this.focusInput();
    };

    Mark.prototype.execute = function() {
      return this.vimState.mark.set(this.input, this.editor.getCursorBufferPosition());
    };

    return Mark;

  })(Operator);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDQwQkFBQTtJQUFBOzs7OztFQUFBLGdCQUFBLEdBQW1COztFQUNuQixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQTZCLE9BQUEsQ0FBUSxNQUFSLENBQTdCLEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlOztFQUVkLFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBQ1osT0FjSSxPQUFBLENBQVEsU0FBUixDQWRKLEVBQ0UsMERBREYsRUFFRSxzQ0FGRixFQUdFLGtFQUhGLEVBSUUsZ0RBSkYsRUFLRSw0Q0FMRixFQU1FLGtEQU5GLEVBT0Usb0VBUEYsRUFRRSxzREFSRixFQVVFLGtDQVZGLEVBV0UsZ0NBWEYsRUFZRSx3QkFaRixFQWFFOztFQUVGLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7O0lBQ0osUUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOzt1QkFDQSxhQUFBLEdBQWU7O3VCQUNmLFVBQUEsR0FBWTs7dUJBRVosSUFBQSxHQUFNOzt1QkFDTixVQUFBLEdBQVk7O3VCQUVaLG9CQUFBLEdBQXNCOzt1QkFDdEIsY0FBQSxHQUFnQjs7dUJBQ2hCLGtCQUFBLEdBQW9COzt1QkFDcEIsdUJBQUEsR0FBeUI7O3VCQUN6QixnQkFBQSxHQUFrQjs7dUJBQ2xCLGdCQUFBLEdBQWtCOzt1QkFDbEIsNkJBQUEsR0FBK0I7O3VCQUMvQixXQUFBLEdBQWE7O3VCQUNiLFdBQUEsR0FBYTs7dUJBQ2Isc0JBQUEsR0FBd0I7O3VCQUN4Qix5QkFBQSxHQUEyQjs7dUJBSzNCLFFBQUEsR0FBVSxTQUFBOytD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T0FBM0IsQ0FBUDtlQUNFLHFEQUFNLFFBQU4sRUFBZ0IsT0FBaEIsRUFERjs7SUFGWTs7OztLQUxpQjs7RUFVM0I7Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxpQkFBQyxDQUFBLFdBQUQsR0FBYzs7Z0NBQ2QsUUFBQSxHQUFVOzs7O0tBSG9COztFQU0xQjs7Ozs7OztJQUNKLElBQUMsQ0FBQSxNQUFELENBQUE7O21CQUVBLFlBQUEsR0FBYzs7bUJBQ2QsYUFBQSxHQUFlOzttQkFDZixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxVQUFELENBQUE7SUFEVTs7bUJBR1osT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxLQUFwQixFQUEyQixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUEsQ0FBM0I7SUFETzs7OztLQVJRO0FBeG1CbkIiLCJzb3VyY2VzQ29udGVudCI6WyJMaW5lRW5kaW5nUmVnRXhwID0gLyg/OlxcbnxcXHJcXG4pJC9cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57UG9pbnQsIFJhbmdlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbntpbnNwZWN0fSA9IHJlcXVpcmUgJ3V0aWwnXG57XG4gIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb25cbiAgaGlnaGxpZ2h0UmFuZ2VzXG4gIGlzRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93XG4gIGdldFZhbGlkVmltQnVmZmVyUm93XG4gIGN1cnNvcklzQXRFbXB0eVJvd1xuICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2VcbiAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uXG4gIGRlc3Ryb3lOb25MYXN0U2VsZWN0aW9uXG5cbiAgc2VsZWN0ZWRSYW5nZVxuICBzZWxlY3RlZFRleHRcbiAgdG9TdHJpbmdcbiAgZGVidWdcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcblxuY2xhc3MgT3BlcmF0b3IgZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIHJlcXVpcmVUYXJnZXQ6IHRydWVcbiAgcmVjb3JkYWJsZTogdHJ1ZVxuXG4gIHdpc2U6IG51bGxcbiAgb2NjdXJyZW5jZTogZmFsc2VcblxuICBwYXR0ZXJuRm9yT2NjdXJyZW5jZTogbnVsbFxuICBzdGF5T25MaW5ld2lzZTogZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uOiBudWxsXG4gIGNsaXBUb011dGF0aW9uRW5kT25TdGF5OiB0cnVlXG4gIHVzZU1hcmtlckZvclN0YXk6IGZhbHNlXG4gIHJlc3RvcmVQb3NpdGlvbnM6IHRydWVcbiAgcmVzdG9yZVBvc2l0aW9uc1RvTXV0YXRpb25FbmQ6IGZhbHNlXG4gIGZsYXNoVGFyZ2V0OiB0cnVlXG4gIHRyYWNrQ2hhbmdlOiBmYWxzZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlOiB0cnVlXG4gIGFjY2VwdFBlcnNpc3RlbnRTZWxlY3Rpb246IHRydWVcblxuICAjIFtGSVhNRV1cbiAgIyBGb3IgVGV4dE9iamVjdCwgaXNMaW5ld2lzZSByZXN1bHQgaXMgY2hhbmdlZCBiZWZvcmUgLyBhZnRlciBzZWxlY3QuXG4gICMgVGhpcyBtZWFuIHJldHVybiB2YWx1ZSBtYXkgY2hhbmdlIGRlcGVuZGluZyBvbiB3aGVuIHlvdSBjYWxsLlxuICBuZWVkU3RheTogLT5cbiAgICBAc3RheUF0U2FtZVBvc2l0aW9uID89IGRvID0+XG4gICAgICBwYXJhbSA9IEBnZXRTdGF5UGFyYW0oKVxuICAgICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICAgICAgc2V0dGluZ3MuZ2V0KHBhcmFtKVxuICAgICAgZWxzZVxuICAgICAgICBzZXR0aW5ncy5nZXQocGFyYW0pIG9yIChAc3RheU9uTGluZXdpc2UgYW5kIEB0YXJnZXQuaXNMaW5ld2lzZT8oKSlcblxuICBnZXRTdGF5UGFyYW06IC0+XG4gICAgc3dpdGNoXG4gICAgICB3aGVuIEBpbnN0YW5jZW9mKCdJbmNyZWFzZScpXG4gICAgICAgICdzdGF5T25JbmNyZWFzZSdcbiAgICAgIHdoZW4gQGluc3RhbmNlb2YoJ1RyYW5zZm9ybVN0cmluZycpXG4gICAgICAgICdzdGF5T25UcmFuc2Zvcm1TdHJpbmcnXG4gICAgICB3aGVuIEBpbnN0YW5jZW9mKCdEZWxldGUnKVxuICAgICAgICAnc3RheU9uRGVsZXRlJ1xuICAgICAgZWxzZVxuICAgICAgICBcInN0YXlPbiN7QGdldE5hbWUoKX1cIlxuXG4gIGlzT2NjdXJyZW5jZTogLT5cbiAgICBAb2NjdXJyZW5jZVxuXG4gIHNldE1hcmtGb3JDaGFuZ2U6IChyYW5nZSkgLT5cbiAgICBAdmltU3RhdGUubWFyay5zZXRSYW5nZSgnWycsICddJywgcmFuZ2UpXG5cbiAgbmVlZEZsYXNoOiAtPlxuICAgIGlmIEBmbGFzaFRhcmdldCBhbmQgbm90IEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBzZXR0aW5ncy5nZXQoJ2ZsYXNoT25PcGVyYXRlJykgYW5kIChAZ2V0TmFtZSgpIG5vdCBpbiBzZXR0aW5ncy5nZXQoJ2ZsYXNoT25PcGVyYXRlQmxhY2tsaXN0JykpXG5cbiAgZmxhc2hJZk5lY2Vzc2FyeTogKHJhbmdlcykgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBuZWVkRmxhc2goKVxuXG4gICAgaGlnaGxpZ2h0UmFuZ2VzIEBlZGl0b3IsIHJhbmdlcyxcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaCdcbiAgICAgIHRpbWVvdXQ6IHNldHRpbmdzLmdldCgnZmxhc2hPbk9wZXJhdGVEdXJhdGlvbicpXG5cbiAgZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBuZWVkRmxhc2goKVxuXG4gICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICByYW5nZXMgPSBAbXV0YXRpb25NYW5hZ2VyLmdldE1hcmtlckJ1ZmZlclJhbmdlcygpLmZpbHRlciAocmFuZ2UpIC0+IG5vdCByYW5nZS5pc0VtcHR5KClcbiAgICAgIGlmIHJhbmdlcy5sZW5ndGhcbiAgICAgICAgQGZsYXNoSWZOZWNlc3NhcnkocmFuZ2VzKVxuXG4gIHRyYWNrQ2hhbmdlSWZOZWNlc3Nhcnk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAdHJhY2tDaGFuZ2VcblxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgaWYgbWFya2VyID0gQG11dGF0aW9uTWFuYWdlci5nZXRNdXRhdGlvbkZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSk/Lm1hcmtlclxuICAgICAgICBAc2V0TWFya0ZvckNoYW5nZShtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuICAgIHtAbXV0YXRpb25NYW5hZ2VyLCBAb2NjdXJyZW5jZU1hbmFnZXIsIEBwZXJzaXN0ZW50U2VsZWN0aW9ufSA9IEB2aW1TdGF0ZVxuXG4gICAgQGluaXRpYWxpemUoKVxuXG4gICAgQG9uRGlkU2V0T3BlcmF0b3JNb2RpZmllciAoe29jY3VycmVuY2UsIHdpc2V9KSA9PlxuICAgICAgQHdpc2UgPSB3aXNlIGlmIHdpc2U/XG4gICAgICBAc2V0T2NjdXJyZW5jZSgnbW9kaWZpZXInKSBpZiBvY2N1cnJlbmNlP1xuXG4gICAgQHRhcmdldCA/PSBpbXBsaWNpdFRhcmdldCBpZiBpbXBsaWNpdFRhcmdldCA9IEBnZXRJbXBsaWNpdFRhcmdldCgpXG5cbiAgICBpZiBfLmlzU3RyaW5nKEB0YXJnZXQpXG4gICAgICBAc2V0VGFyZ2V0KEBuZXcoQHRhcmdldCkpXG5cbiAgICAjIFdoZW4gcHJlc2V0LW9jY3VycmVuY2Ugd2FzIGV4aXN0cywgYXV0byBlbmFibGUgb2NjdXJyZW5jZS13aXNlXG4gICAgaWYgQG9jY3VycmVuY2VcbiAgICAgIEBzZXRPY2N1cnJlbmNlKCdzdGF0aWMnKVxuICAgIGVsc2UgaWYgQGFjY2VwdFByZXNldE9jY3VycmVuY2UgYW5kIEBvY2N1cnJlbmNlTWFuYWdlci5oYXNQYXR0ZXJucygpXG4gICAgICBAc2V0T2NjdXJyZW5jZSgncHJlc2V0JylcblxuICAgIGlmIEBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uXG4gICAgICBAc3Vic2NyaWJlIEBvbkRpZERlYWN0aXZhdGVNb2RlICh7bW9kZX0pID0+XG4gICAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5yZXNldFBhdHRlcm5zKCkgaWYgbW9kZSBpcyAnb3BlcmF0b3ItcGVuZGluZydcblxuICBnZXRJbXBsaWNpdFRhcmdldDogLT5cbiAgICAjIEluIHZpc3VhbC1tb2RlIGFuZCB0YXJnZXQgd2FzIG5vdCBwcmUtc2V0LCBvcGVyYXRlIG9uIHNlbGVjdGVkIGFyZWEuXG4gICAgaWYgQGNhblNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb24oKVxuICAgICAgQGRlc3Ryb3lVbmtub3duU2VsZWN0aW9uID0gdHJ1ZVxuICAgICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgICAgXCJBQ3VycmVudFNlbGVjdGlvbkFuZEFQZXJzaXN0ZW50U2VsZWN0aW9uXCJcbiAgICAgIGVsc2VcbiAgICAgICAgXCJBUGVyc2lzdGVudFNlbGVjdGlvblwiXG4gICAgZWxzZVxuICAgICAgXCJDdXJyZW50U2VsZWN0aW9uXCIgaWYgQGlzTW9kZSgndmlzdWFsJylcblxuICBjYW5TZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uOiAtPlxuICAgIEBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uIGFuZFxuICAgIEB2aW1TdGF0ZS5oYXNQZXJzaXN0ZW50U2VsZWN0aW9ucygpIGFuZFxuICAgIHNldHRpbmdzLmdldCgnYXV0b1NlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25Pbk9wZXJhdGUnKVxuXG4gICMgdHlwZSBpcyBvbmUgb2YgWydwcmVzZXQnLCAnbW9kaWZpZXInXVxuICBzZXRPY2N1cnJlbmNlOiAodHlwZSkgLT5cbiAgICBAb2NjdXJyZW5jZSA9IHRydWVcbiAgICBzd2l0Y2ggdHlwZVxuICAgICAgd2hlbiAnc3RhdGljJ1xuICAgICAgICB1bmxlc3MgQGlzQ29tcGxldGUoKSAjIHdlIGVudGVyIG9wZXJhdG9yLXBlbmRpbmdcbiAgICAgICAgICBkZWJ1ZyAnc3RhdGljOiBtYXJrIGFzIHdlIGVudGVyIG9wZXJhdG9yLXBlbmRpbmcnXG4gICAgICAgICAgQGFkZE9jY3VycmVuY2VQYXR0ZXJuKCkgdW5sZXNzIEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIHdoZW4gJ3ByZXNldCdcbiAgICAgICAgZGVidWcgJ3ByZXNldDogbm90aGluZyB0byBkbyBzaW5jZSB3ZSBoYXZlIG1hcmtlcnMgYWxyZWFkeSdcbiAgICAgIHdoZW4gJ21vZGlmaWVyJ1xuICAgICAgICBkZWJ1ZyAnbW9kaWZpZXI6IG92ZXJ3cml0ZSBleGlzdGluZyBtYXJrZXIgd2hlbiBtYW51YWxseSB0eXBlZCBgb2AnXG4gICAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5yZXNldFBhdHRlcm5zKCkgIyBjbGVhciBleGlzdGluZyBtYXJrZXJcbiAgICAgICAgQGFkZE9jY3VycmVuY2VQYXR0ZXJuKCkgIyBtYXJrIGN1cnNvciB3b3JkLlxuXG4gIGFkZE9jY3VycmVuY2VQYXR0ZXJuOiAocGF0dGVybj1udWxsKSAtPlxuICAgIHBhdHRlcm4gPz0gQHBhdHRlcm5Gb3JPY2N1cnJlbmNlXG4gICAgdW5sZXNzIHBhdHRlcm4/XG4gICAgICBwb2ludCA9IEBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgICBwYXR0ZXJuID0gZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIHBvaW50LCBzaW5nbGVOb25Xb3JkQ2hhcjogdHJ1ZSlcbiAgICBAb2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihwYXR0ZXJuKVxuXG4gICMgdGFyZ2V0IGlzIFRleHRPYmplY3Qgb3IgTW90aW9uIHRvIG9wZXJhdGUgb24uXG4gIHNldFRhcmdldDogKEB0YXJnZXQpIC0+XG4gICAgQHRhcmdldC5zZXRPcGVyYXRvcih0aGlzKVxuICAgIEBlbWl0RGlkU2V0VGFyZ2V0KHRoaXMpXG4gICAgdGhpc1xuXG4gIHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzZXRUZXh0VG9SZWdpc3RlcihzZWxlY3Rpb24uZ2V0VGV4dCgpLCBzZWxlY3Rpb24pXG5cbiAgc2V0VGV4dFRvUmVnaXN0ZXI6ICh0ZXh0LCBzZWxlY3Rpb24pIC0+XG4gICAgdGV4dCArPSBcIlxcblwiIGlmIChAdGFyZ2V0LmlzTGluZXdpc2U/KCkgYW5kIChub3QgdGV4dC5lbmRzV2l0aCgnXFxuJykpKVxuICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5zZXQoe3RleHQsIHNlbGVjdGlvbn0pIGlmIHRleHRcblxuICAjIE1haW5cbiAgZXhlY3V0ZTogLT5cbiAgICBjYW5NdXRhdGUgPSB0cnVlXG4gICAgc3RvcE11dGF0aW9uID0gLT4gY2FuTXV0YXRlID0gZmFsc2VcbiAgICBpZiBAc2VsZWN0VGFyZ2V0KClcbiAgICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIGNhbk11dGF0ZVxuICAgICAgICAgIEBtdXRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uLCBzdG9wTXV0YXRpb24pXG4gICAgICBAcmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5KClcblxuICAgICMgRXZlbiB0aG91Z2ggd2UgZmFpbCB0byBzZWxlY3QgdGFyZ2V0IGFuZCBmYWlsIHRvIG11dGF0ZSxcbiAgICAjIHdlIGhhdmUgdG8gcmV0dXJuIHRvIG5vcm1hbC1tb2RlIGZyb20gb3BlcmF0b3ItcGVuZGluZyBvciB2aXN1YWxcbiAgICBAYWN0aXZhdGVNb2RlKCdub3JtYWwnKVxuXG4gIHNlbGVjdE9jY3VycmVuY2U6IC0+XG4gICAgQGFkZE9jY3VycmVuY2VQYXR0ZXJuKCkgdW5sZXNzIEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcblxuICAgICMgVG8gcmVwb2VhdChgLmApIG9wZXJhdGlvbiB3aGVyZSBtdWx0aXBsZSBvY2N1cnJlbmNlIHBhdHRlcm5zIHdhcyBzZXQuXG4gICAgIyBIZXJlIHdlIHNhdmUgcGF0dGVybnMgd2hpY2ggcmVzcmVzZW50IHVuaW9uZWQgcmVnZXggd2hpY2ggQG9jY3VycmVuY2VNYW5hZ2VyIGtub3dzLlxuICAgIEBwYXR0ZXJuRm9yT2NjdXJyZW5jZSA/PSBAb2NjdXJyZW5jZU1hbmFnZXIuYnVpbGRQYXR0ZXJuKClcblxuICAgIHNlbGVjdGVkUmFuZ2VzID0gQGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpXG4gICAgcmFuZ2VzID0gQG9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlclJhbmdlc0ludGVyc2VjdHNXaXRoUmFuZ2VzKHNlbGVjdGVkUmFuZ2VzLCBAaXNNb2RlKCd2aXN1YWwnKSlcbiAgICBpZiByYW5nZXMubGVuZ3RoXG4gICAgICBAdmltU3RhdGUubW9kZU1hbmFnZXIuZGVhY3RpdmF0ZSgpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKHJhbmdlcylcbiAgICBlbHNlXG4gICAgICBAbXV0YXRpb25NYW5hZ2VyLnJlc3RvcmVJbml0aWFsUG9zaXRpb25zKCkgIyBSZXN0b3JlaW5nIHBvc2l0aW9uIGFsc28gY2xlYXIgc2VsZWN0aW9uLlxuICAgIEBvY2N1cnJlbmNlTWFuYWdlci5yZXNldFBhdHRlcm5zKClcblxuICAjIFJldHVybiB0cnVlIHVubGVzcyBhbGwgc2VsZWN0aW9uIGlzIGVtcHR5LlxuICBzZWxlY3RUYXJnZXQ6IC0+XG4gICAgb3B0aW9ucyA9IHtpc1NlbGVjdDogQGluc3RhbmNlb2YoJ1NlbGVjdCcpLCB1c2VNYXJrZXI6IEB1c2VNYXJrZXJGb3JTdGF5fVxuICAgIEBtdXRhdGlvbk1hbmFnZXIuaW5pdChvcHRpb25zKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2tQb2ludCgnd2lsbC1zZWxlY3QnKVxuXG4gICAgQHRhcmdldC5mb3JjZVdpc2UoQHdpc2UpIGlmIEB3aXNlIGFuZCBAdGFyZ2V0LmlzTW90aW9uKClcbiAgICBAZW1pdFdpbGxTZWxlY3RUYXJnZXQoKVxuXG4gICAgIyBUbyB1c2UgQ1VSUkVOVCBjdXJzb3IgcG9zaXRpb24sIHRoaXMgaGFzIHRvIGJlIEJFRk9SRSBAdGFyZ2V0LnNlbGVjdCgpIHdoaWNoIG1vdmUgY3Vyc29ycy5cbiAgICBpZiBAaXNPY2N1cnJlbmNlKCkgYW5kIG5vdCBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpXG4gICAgICBAYWRkT2NjdXJyZW5jZVBhdHRlcm4oKVxuXG4gICAgQHRhcmdldC5zZWxlY3QoKVxuICAgIGlmIEBpc09jY3VycmVuY2UoKVxuICAgICAgQHNlbGVjdE9jY3VycmVuY2UoKVxuXG4gICAgaWYgaGF2ZVNvbWVOb25FbXB0eVNlbGVjdGlvbihAZWRpdG9yKSBvciBAdGFyZ2V0LmdldE5hbWUoKSBpcyBcIkVtcHR5XCJcbiAgICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2tQb2ludCgnZGlkLXNlbGVjdCcpXG4gICAgICBAZW1pdERpZFNlbGVjdFRhcmdldCgpXG4gICAgICBAZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICBAdHJhY2tDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICByZXN0b3JlQ3Vyc29yUG9zaXRpb25zSWZOZWNlc3Nhcnk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcmVzdG9yZVBvc2l0aW9uc1xuXG4gICAgb3B0aW9ucyA9XG4gICAgICBzdGF5OiBAbmVlZFN0YXkoKVxuICAgICAgc3RyaWN0OiBAaXNPY2N1cnJlbmNlKCkgb3IgQGRlc3Ryb3lVbmtub3duU2VsZWN0aW9uXG4gICAgICBjbGlwVG9NdXRhdGlvbkVuZDogQGNsaXBUb011dGF0aW9uRW5kT25TdGF5XG4gICAgICBpc0Jsb2Nrd2lzZTogQHRhcmdldD8uaXNCbG9ja3dpc2U/KClcbiAgICAgIG11dGF0aW9uRW5kOiBAcmVzdG9yZVBvc2l0aW9uc1RvTXV0YXRpb25FbmRcblxuICAgIEBtdXRhdGlvbk1hbmFnZXIucmVzdG9yZUN1cnNvclBvc2l0aW9ucyhvcHRpb25zKVxuICAgIEBlbWl0RGlkUmVzdG9yZUN1cnNvclBvc2l0aW9ucygpXG5cbiMgU2VsZWN0XG4jIFdoZW4gdGV4dC1vYmplY3QgaXMgaW52b2tlZCBmcm9tIG5vcm1hbCBvciB2aXVzYWwtbW9kZSwgb3BlcmF0aW9uIHdvdWxkIGJlXG4jICA9PiBTZWxlY3Qgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9dGV4dC1vYmplY3RcbiMgV2hlbiBtb3Rpb24gaXMgaW52b2tlZCBmcm9tIHZpc3VhbC1tb2RlLCBvcGVyYXRpb24gd291bGQgYmVcbiMgID0+IFNlbGVjdCBvcGVyYXRvciB3aXRoIHRhcmdldD1tb3Rpb24pXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBTZWxlY3QgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKGZhbHNlKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbjogZmFsc2VcblxuICBjYW5DaGFuZ2VNb2RlOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAaXNPY2N1cnJlbmNlKCkgb3IgQHRhcmdldC5pc0FsbG93U3VibW9kZUNoYW5nZT8oKVxuICAgIGVsc2VcbiAgICAgIHRydWVcblxuICBleGVjdXRlOiAtPlxuICAgIEBzZWxlY3RUYXJnZXQoKVxuICAgIGlmIEBjYW5DaGFuZ2VNb2RlKClcbiAgICAgIHN1Ym1vZGUgPSBzd3JhcC5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZShAZWRpdG9yKVxuICAgICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCBzdWJtb2RlKVxuXG5jbGFzcyBTZWxlY3RMYXRlc3RDaGFuZ2UgZXh0ZW5kcyBTZWxlY3RcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTZWxlY3QgbGF0ZXN0IHlhbmtlZCBvciBjaGFuZ2VkIHJhbmdlXCJcbiAgdGFyZ2V0OiAnQUxhdGVzdENoYW5nZSdcblxuY2xhc3MgU2VsZWN0UHJldmlvdXNTZWxlY3Rpb24gZXh0ZW5kcyBTZWxlY3RcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogXCJQcmV2aW91c1NlbGVjdGlvblwiXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHNlbGVjdFRhcmdldCgpXG4gICAgaWYgQHRhcmdldC5zdWJtb2RlP1xuICAgICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCBAdGFyZ2V0LnN1Ym1vZGUpXG5cbmNsYXNzIFNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBTZWxlY3RcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTZWxlY3QgcGVyc2lzdGVudC1zZWxlY3Rpb24gYW5kIGNsZWFyIGFsbCBwZXJzaXN0ZW50LXNlbGVjdGlvbiwgaXQncyBsaWtlIGNvbnZlcnQgdG8gcmVhbC1zZWxlY3Rpb25cIlxuICB0YXJnZXQ6IFwiQVBlcnNpc3RlbnRTZWxlY3Rpb25cIlxuXG5jbGFzcyBTZWxlY3RPY2N1cnJlbmNlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJBZGQgc2VsZWN0aW9uIG9udG8gZWFjaCBtYXRjaGluZyB3b3JkIHdpdGhpbiB0YXJnZXQgcmFuZ2VcIlxuICBvY2N1cnJlbmNlOiB0cnVlXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAb25EaWRTZWxlY3RUYXJnZXQgPT5cbiAgICAgIHN3cmFwLmNsZWFyUHJvcGVydGllcyhAZWRpdG9yKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQHNlbGVjdFRhcmdldCgpXG4gICAgICBzdWJtb2RlID0gc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcilcbiAgICAgIEBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeSgndmlzdWFsJywgc3VibW9kZSlcblxuY2xhc3MgU2VsZWN0T2NjdXJyZW5jZUluQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaCBleHRlbmRzIFNlbGVjdE9jY3VycmVuY2VcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogXCJBRnVuY3Rpb25PcklubmVyUGFyYWdyYXBoXCJcblxuIyBSYW5nZSBNYXJrZXJcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uOiB0cnVlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2U6IGZhbHNlXG4gIGFjY2VwdFBlcnNpc3RlbnRTZWxlY3Rpb246IGZhbHNlXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLm1hcmtCdWZmZXJSYW5nZShzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICBleGVjdXRlOiAtPlxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgZGVzdHJveU5vbkxhc3RTZWxlY3Rpb24oQGVkaXRvcilcbiAgICBzdXBlclxuXG5jbGFzcyBUb2dnbGVQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvblxuICBAZXh0ZW5kKClcblxuICBpc0NvbXBsZXRlOiAtPlxuICAgIHBvaW50ID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgQG1hcmtlclRvUmVtb3ZlID0gQHBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQXRQb2ludChwb2ludClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBzdXBlclxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQG1hcmtlclRvUmVtb3ZlXG4gICAgICBAbWFya2VyVG9SZW1vdmUuZGVzdHJveSgpXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuIyBQcmVzZXQgT2NjdXJyZW5jZVxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUb2dnbGVQcmVzZXRPY2N1cnJlbmNlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICByZXF1aXJlVGFyZ2V0OiBmYWxzZVxuICBzdGF5QXRTYW1lUG9zaXRpb246IHRydWVcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogZmFsc2VcblxuICBleGVjdXRlOiAtPlxuICAgIHtAb2NjdXJyZW5jZU1hbmFnZXJ9ID0gQHZpbVN0YXRlXG4gICAgaWYgbWFya2VyID0gQG9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlckF0UG9pbnQoQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgbWFya2VyLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIHBhdHRlcm4gPSBudWxsXG4gICAgICBpc05hcnJvd2VkID0gQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLmlzTmFycm93ZWQoKVxuICAgICAgaWYgQGlzTW9kZSgndmlzdWFsJykgYW5kIG5vdCBpc05hcnJvd2VkXG4gICAgICAgIHRleHQgPSBAZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG4gICAgICAgIHBhdHRlcm4gPSBuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKHRleHQpLCAnZycpXG5cbiAgICAgIEBhZGRPY2N1cnJlbmNlUGF0dGVybihwYXR0ZXJuKVxuICAgICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJykgdW5sZXNzIGlzTmFycm93ZWRcblxuIyBEZWxldGVcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERlbGV0ZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzpkZWxldGU6JywgZW1vamk6ICc6c2Npc3NvcnM6J1xuICB0cmFja0NoYW5nZTogdHJ1ZVxuICBmbGFzaFRhcmdldDogZmFsc2VcblxuICBleGVjdXRlOiAtPlxuICAgIEBvbkRpZFNlbGVjdFRhcmdldCA9PlxuICAgICAgQHJlcXVlc3RBZGp1c3RDdXJzb3JQb3NpdGlvbnMoKSBpZiBAdGFyZ2V0LmlzTGluZXdpc2UoKVxuICAgIHN1cGVyXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSA9PlxuICAgIEBzZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgc2VsZWN0aW9uLmRlbGV0ZVNlbGVjdGVkVGV4dCgpXG5cbiAgcmVxdWVzdEFkanVzdEN1cnNvclBvc2l0aW9uczogLT5cbiAgICBAb25EaWRSZXN0b3JlQ3Vyc29yUG9zaXRpb25zID0+XG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgIEBhZGp1c3RDdXJzb3IoY3Vyc29yKVxuXG4gIGFkanVzdEN1cnNvcjogKGN1cnNvcikgLT5cbiAgICByb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgaWYgQG5lZWRTdGF5KClcbiAgICAgIHBvaW50ID0gQG11dGF0aW9uTWFuYWdlci5nZXRJbml0aWFsUG9pbnRGb3JTZWxlY3Rpb24oY3Vyc29yLnNlbGVjdGlvbilcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCBwb2ludC5jb2x1bW5dKVxuICAgIGVsc2VcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCAwXSlcbiAgICAgIGN1cnNvci5za2lwTGVhZGluZ1doaXRlc3BhY2UoKVxuXG5jbGFzcyBEZWxldGVSaWdodCBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVJpZ2h0J1xuICBob3ZlcjogbnVsbFxuXG5jbGFzcyBEZWxldGVMZWZ0IGV4dGVuZHMgRGVsZXRlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlTGVmdCdcblxuY2xhc3MgRGVsZXRlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgRGVsZXRlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lJ1xuICBleGVjdXRlOiAtPlxuICAgICMgRW5zdXJlIGFsbCBzZWxlY3Rpb25zIHRvIHVuLXJldmVyc2VkXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICBzd3JhcC5zZXRSZXZlcnNlZFN0YXRlKEBlZGl0b3IsIGZhbHNlKVxuICAgIHN1cGVyXG5cbmNsYXNzIERlbGV0ZUxpbmUgZXh0ZW5kcyBEZWxldGVcbiAgQGV4dGVuZCgpXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXMudmlzdWFsLW1vZGUnXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuY2xhc3MgRGVsZXRlT2NjdXJyZW5jZUluQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaCBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgb2NjdXJyZW5jZTogdHJ1ZVxuICB0YXJnZXQ6IFwiQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaFwiXG5cbiMgWWFua1xuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBZYW5rIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIGhvdmVyOiBpY29uOiAnOnlhbms6JywgZW1vamk6ICc6Y2xpcGJvYXJkOidcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgc3RheU9uTGluZXdpc2U6IHRydWVcbiAgY2xpcFRvTXV0YXRpb25FbmRPblN0YXk6IGZhbHNlXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG5cbmNsYXNzIFlhbmtMaW5lIGV4dGVuZHMgWWFua1xuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAdGFyZ2V0ID0gJ01vdmVUb1JlbGF0aXZlTGluZScgaWYgQGlzTW9kZSgnbm9ybWFsJylcbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZScpXG4gICAgICBAc3RheU9uTGluZXdpc2UgPSBmYWxzZVxuXG5jbGFzcyBZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgWWFua1xuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtGSVhNRT9dOiBpbmNvbnNpc3RlbnQgYmVoYXZpb3IgZnJvbSBub3JtYWwgb3BlcmF0b3JcbiMgU2luY2UgaXRzIHN1cHBvcnQgdmlzdWFsLW1vZGUgYnV0IG5vdCB1c2Ugc2V0VGFyZ2V0KCkgY29udmVuc2lvbi5cbiMgTWF5YmUgc2VwYXJhdGluZyBjb21wbGV0ZS9pbi1jb21wbGV0ZSB2ZXJzaW9uIGxpa2UgSW5jcmVhc2VOb3cgYW5kIEluY3JlYXNlP1xuY2xhc3MgSW5jcmVhc2UgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgc3RlcDogMVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgcGF0dGVybiA9IC8vLyN7c2V0dGluZ3MuZ2V0KCdudW1iZXJSZWdleCcpfS8vL2dcblxuICAgIG5ld1JhbmdlcyA9IFtdXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgICBzY2FuUmFuZ2UgPSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgICAgIGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY3Vyc29yLmdldEN1cnJlbnRMaW5lQnVmZmVyUmFuZ2UoKVxuICAgICAgICByYW5nZXMgPSBAaW5jcmVhc2VOdW1iZXIoY3Vyc29yLCBzY2FuUmFuZ2UsIHBhdHRlcm4pXG4gICAgICAgIGlmIG5vdCBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgcmFuZ2VzLmxlbmd0aFxuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbiByYW5nZXNbMF0uZW5kLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgICAgICBuZXdSYW5nZXMucHVzaCByYW5nZXNcblxuICAgIGlmIChuZXdSYW5nZXMgPSBfLmZsYXR0ZW4obmV3UmFuZ2VzKSkubGVuZ3RoXG4gICAgICBAZmxhc2hJZk5lY2Vzc2FyeShuZXdSYW5nZXMpXG4gICAgZWxzZVxuICAgICAgYXRvbS5iZWVwKClcblxuICBpbmNyZWFzZU51bWJlcjogKGN1cnNvciwgc2NhblJhbmdlLCBwYXR0ZXJuKSAtPlxuICAgIG5ld1JhbmdlcyA9IFtdXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7bWF0Y2hUZXh0LCByYW5nZSwgc3RvcCwgcmVwbGFjZX0pID0+XG4gICAgICBuZXdUZXh0ID0gU3RyaW5nKHBhcnNlSW50KG1hdGNoVGV4dCwgMTApICsgQHN0ZXAgKiBAZ2V0Q291bnQoKSlcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICAgIG5ld1Jhbmdlcy5wdXNoIHJlcGxhY2UobmV3VGV4dClcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHVubGVzcyByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbiBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICBuZXdSYW5nZXMucHVzaCByZXBsYWNlKG5ld1RleHQpXG4gICAgICAgIHN0b3AoKVxuICAgIG5ld1Jhbmdlc1xuXG5jbGFzcyBEZWNyZWFzZSBleHRlbmRzIEluY3JlYXNlXG4gIEBleHRlbmQoKVxuICBzdGVwOiAtMVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluY3JlbWVudE51bWJlciBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBkaXNwbGF5TmFtZTogJ0luY3JlbWVudCArKydcbiAgc3RlcDogMVxuICBiYXNlTnVtYmVyOiBudWxsXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBwYXR0ZXJuID0gLy8vI3tzZXR0aW5ncy5nZXQoJ251bWJlclJlZ2V4Jyl9Ly8vZ1xuICAgIG5ld1JhbmdlcyA9IG51bGxcbiAgICBAc2VsZWN0VGFyZ2V0KClcbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBuZXdSYW5nZXMgPSBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgQHJlcGxhY2VOdW1iZXIoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCksIHBhdHRlcm4pXG4gICAgaWYgKG5ld1JhbmdlcyA9IF8uZmxhdHRlbihuZXdSYW5nZXMpKS5sZW5ndGhcbiAgICAgIEBmbGFzaElmTmVjZXNzYXJ5KG5ld1JhbmdlcylcbiAgICBlbHNlXG4gICAgICBhdG9tLmJlZXAoKVxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnQpXG4gICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCdub3JtYWwnKVxuXG4gIHJlcGxhY2VOdW1iZXI6IChzY2FuUmFuZ2UsIHBhdHRlcm4pIC0+XG4gICAgbmV3UmFuZ2VzID0gW11cbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHttYXRjaFRleHQsIHJlcGxhY2V9KSA9PlxuICAgICAgbmV3UmFuZ2VzLnB1c2ggcmVwbGFjZShAZ2V0TmV3VGV4dChtYXRjaFRleHQpKVxuICAgIG5ld1Jhbmdlc1xuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIEBiYXNlTnVtYmVyID0gaWYgQGJhc2VOdW1iZXI/XG4gICAgICBAYmFzZU51bWJlciArIEBzdGVwICogQGdldENvdW50KClcbiAgICBlbHNlXG4gICAgICBwYXJzZUludCh0ZXh0LCAxMClcbiAgICBTdHJpbmcoQGJhc2VOdW1iZXIpXG5cbmNsYXNzIERlY3JlbWVudE51bWJlciBleHRlbmRzIEluY3JlbWVudE51bWJlclxuICBAZXh0ZW5kKClcbiAgZGlzcGxheU5hbWU6ICdEZWNyZW1lbnQgLS0nXG4gIHN0ZXA6IC0xXG5cbiMgUHV0XG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFB1dEJlZm9yZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICByZXN0b3JlUG9zaXRpb25zOiBmYWxzZVxuICBsb2NhdGlvbjogJ2JlZm9yZSdcblxuICBpbml0aWFsaXplOiAtPlxuICAgIEB0YXJnZXQgPSAnRW1wdHknIGlmIEBpc01vZGUoJ25vcm1hbCcpXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHt0ZXh0LCB0eXBlfSA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXQobnVsbCwgc2VsZWN0aW9uKVxuICAgIHJldHVybiB1bmxlc3MgdGV4dFxuXG4gICAgdGV4dCA9IF8ubXVsdGlwbHlTdHJpbmcodGV4dCwgQGdldENvdW50KCkpXG4gICAgbGluZXdpc2UgPSAodHlwZSBpcyAnbGluZXdpc2UnKSBvciBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgIEBwYXN0ZShzZWxlY3Rpb24sIHRleHQsIHtsaW5ld2lzZSwgQHNlbGVjdFBhc3RlZFRleHR9KVxuXG4gIHBhc3RlOiAoc2VsZWN0aW9uLCB0ZXh0LCB7bGluZXdpc2UsIHNlbGVjdFBhc3RlZFRleHR9KSAtPlxuICAgIHtjdXJzb3J9ID0gc2VsZWN0aW9uXG4gICAgaWYgbGluZXdpc2VcbiAgICAgIG5ld1JhbmdlID0gQHBhc3RlTGluZXdpc2Uoc2VsZWN0aW9uLCB0ZXh0KVxuICAgICAgYWRqdXN0Q3Vyc29yID0gKHJhbmdlKSAtPlxuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocmFuZ2Uuc3RhcnQpXG4gICAgICAgIGN1cnNvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4gICAgZWxzZVxuICAgICAgbmV3UmFuZ2UgPSBAcGFzdGVDaGFyYWN0ZXJ3aXNlKHNlbGVjdGlvbiwgdGV4dClcbiAgICAgIGFkanVzdEN1cnNvciA9IChyYW5nZSkgLT5cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHJhbmdlLmVuZC50cmFuc2xhdGUoWzAsIC0xXSkpXG5cbiAgICBAc2V0TWFya0ZvckNoYW5nZShuZXdSYW5nZSlcbiAgICBpZiBzZWxlY3RQYXN0ZWRUZXh0XG4gICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UpXG4gICAgZWxzZVxuICAgICAgYWRqdXN0Q3Vyc29yKG5ld1JhbmdlKVxuXG4gICMgUmV0dXJuIG5ld1JhbmdlXG4gIHBhc3RlTGluZXdpc2U6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICB0ZXh0ICs9IFwiXFxuXCIgdW5sZXNzIHRleHQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICAgIHN3aXRjaCBAbG9jYXRpb25cbiAgICAgICAgd2hlbiAnYmVmb3JlJ1xuICAgICAgICAgIHJhbmdlID0gW1tyb3csIDBdLCBbcm93LCAwXV1cbiAgICAgICAgd2hlbiAnYWZ0ZXInXG4gICAgICAgICAgdW5sZXNzIGlzRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdylcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoTGluZUVuZGluZ1JlZ0V4cCwgJycpXG4gICAgICAgICAgY3Vyc29yLm1vdmVUb0VuZE9mTGluZSgpXG4gICAgICAgICAge2VuZH0gPSBzZWxlY3Rpb24uaW5zZXJ0VGV4dChcIlxcblwiKVxuICAgICAgICAgIHJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhlbmQucm93LCB7aW5jbHVkZU5ld2xpbmU6IHRydWV9KVxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgdGV4dClcbiAgICBlbHNlXG4gICAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgICAgICB1bmxlc3Mgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kLmNvbHVtbiBpcyAwXG4gICAgICAgICAgIyBQb3NzaWJsZSBpbiBsYXN0IGJ1ZmZlciBsaW5lIG5vdCBoYXZlIGVuZGluZyBuZXdMaW5lXG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShMaW5lRW5kaW5nUmVnRXhwLCAnJylcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoXCJcXG5cIilcbiAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQpXG5cbiAgcGFzdGVDaGFyYWN0ZXJ3aXNlOiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIGlmIEBsb2NhdGlvbiBpcyAnYWZ0ZXInIGFuZCBzZWxlY3Rpb24uaXNFbXB0eSgpIGFuZCBub3QgY3Vyc29ySXNBdEVtcHR5Um93KHNlbGVjdGlvbi5jdXJzb3IpXG4gICAgICBzZWxlY3Rpb24uY3Vyc29yLm1vdmVSaWdodCgpXG4gICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcblxuY2xhc3MgUHV0QWZ0ZXIgZXh0ZW5kcyBQdXRCZWZvcmVcbiAgQGV4dGVuZCgpXG4gIGxvY2F0aW9uOiAnYWZ0ZXInXG5cbmNsYXNzIFB1dEJlZm9yZUFuZFNlbGVjdCBleHRlbmRzIFB1dEJlZm9yZVxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlBhc3RlIGJlZm9yZSB0aGVuIHNlbGVjdFwiXG4gIHNlbGVjdFBhc3RlZFRleHQ6IHRydWVcblxuICBhY3RpdmF0ZU1vZGU6IC0+XG4gICAgc3VibW9kZSA9IHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpXG4gICAgdW5sZXNzIEB2aW1TdGF0ZS5pc01vZGUoJ3Zpc3VhbCcsIHN1Ym1vZGUpXG4gICAgICBzdXBlcigndmlzdWFsJywgc3VibW9kZSlcblxuY2xhc3MgUHV0QWZ0ZXJBbmRTZWxlY3QgZXh0ZW5kcyBQdXRCZWZvcmVBbmRTZWxlY3RcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJQYXN0ZSBhZnRlciB0aGVuIHNlbGVjdFwiXG4gIGxvY2F0aW9uOiAnYWZ0ZXInXG5cbiMgW0ZJWE1FXSB0aGlzIGlzIG5vdCBvcGVyYXRvclxuY2xhc3MgTWFyayBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICAjIGhvdmVyOiBpY29uOiAnOm1hcms6JywgZW1vamk6ICc6cm91bmRfcHVzaHBpbjonXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuICByZXF1aXJlVGFyZ2V0OiBmYWxzZVxuICBpbml0aWFsaXplOiAtPlxuICAgIEBmb2N1c0lucHV0KClcblxuICBleGVjdXRlOiAtPlxuICAgIEB2aW1TdGF0ZS5tYXJrLnNldChAaW5wdXQsIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiJdfQ==
