(function() {
  var AutoIndent, Base, BufferedProcess, CamelCase, ChangeOrder, ChangeSurround, ChangeSurroundAnyPair, ChangeSurroundAnyPairAllowForwarding, CompactSpaces, ConvertToHardTab, ConvertToSoftTab, DashCase, DecodeUriComponent, DeleteSurround, DeleteSurroundAnyPair, DeleteSurroundAnyPairAllowForwarding, EncodeUriComponent, Indent, Join, JoinByInput, JoinByInputWithKeepingSpace, JoinWithKeepingSpace, LineEndingRegExp, LowerCase, MapSurround, Operator, Outdent, PascalCase, Range, Replace, ReplaceWithRegister, Reverse, SnakeCase, Sort, SplitByCharacter, SplitString, Surround, SurroundSmartWord, SurroundWord, SwapWithRegister, TitleCase, ToggleCase, ToggleCaseAndMoveRight, ToggleLineComments, TransformSmartWordBySelectList, TransformString, TransformStringByExternalCommand, TransformStringBySelectList, TransformWordBySelectList, TrimString, UpperCase, _, haveSomeNonEmptySelection, isSingleLine, ref, ref1, selectListItems, settings, swrap, transformerRegistry,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  LineEndingRegExp = /(?:\n|\r\n)$/;

  _ = require('underscore-plus');

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, Range = ref.Range;

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, isSingleLine = ref1.isSingleLine;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Operator = Base.getClass('Operator');

  transformerRegistry = [];

  TransformString = (function(superClass) {
    extend(TransformString, superClass);

    function TransformString() {
      return TransformString.__super__.constructor.apply(this, arguments);
    }

    TransformString.extend(false);

    TransformString.prototype.trackChange = true;

    TransformString.prototype.stayOnLinewise = true;

    TransformString.prototype.autoIndent = false;

    TransformString.registerToSelectList = function() {
      return transformerRegistry.push(this);
    };

    TransformString.prototype.mutateSelection = function(selection, stopMutation) {
      var text;
      if (text = this.getNewText(selection.getText(), selection, stopMutation)) {
        return selection.insertText(text, {
          autoIndent: this.autoIndent
        });
      }
    };

    return TransformString;

  })(Operator);

  ToggleCase = (function(superClass) {
    extend(ToggleCase, superClass);

    function ToggleCase() {
      return ToggleCase.__super__.constructor.apply(this, arguments);
    }

    ToggleCase.extend();

    ToggleCase.registerToSelectList();

    ToggleCase.description = "`Hello World` -> `hELLO wORLD`";

    ToggleCase.prototype.displayName = 'Toggle ~';

    ToggleCase.prototype.hover = {
      icon: ':toggle-case:',
      emoji: ':clap:'
    };

    ToggleCase.prototype.toggleCase = function(char) {
      var charLower;
      charLower = char.toLowerCase();
      if (charLower === char) {
        return char.toUpperCase();
      } else {
        return charLower;
      }
    };

    ToggleCase.prototype.getNewText = function(text) {
      return text.replace(/./g, this.toggleCase.bind(this));
    };

    return ToggleCase;

  })(TransformString);

  ToggleCaseAndMoveRight = (function(superClass) {
    extend(ToggleCaseAndMoveRight, superClass);

    function ToggleCaseAndMoveRight() {
      return ToggleCaseAndMoveRight.__super__.constructor.apply(this, arguments);
    }

    ToggleCaseAndMoveRight.extend();

    ToggleCaseAndMoveRight.prototype.hover = null;

    ToggleCaseAndMoveRight.prototype.flashTarget = false;

    ToggleCaseAndMoveRight.prototype.restorePositions = false;

    ToggleCaseAndMoveRight.prototype.target = 'MoveRight';

    return ToggleCaseAndMoveRight;

  })(ToggleCase);

  UpperCase = (function(superClass) {
    extend(UpperCase, superClass);

    function UpperCase() {
      return UpperCase.__super__.constructor.apply(this, arguments);
    }

    UpperCase.extend();

    UpperCase.registerToSelectList();

    UpperCase.description = "`Hello World` -> `HELLO WORLD`";

    UpperCase.prototype.hover = {
      icon: ':upper-case:',
      emoji: ':point_up:'
    };

    UpperCase.prototype.displayName = 'Upper';

    UpperCase.prototype.getNewText = function(text) {
      return text.toUpperCase();
    };

    return UpperCase;

  })(TransformString);

  LowerCase = (function(superClass) {
    extend(LowerCase, superClass);

    function LowerCase() {
      return LowerCase.__super__.constructor.apply(this, arguments);
    }

    LowerCase.extend();

    LowerCase.registerToSelectList();

    LowerCase.description = "`Hello World` -> `hello world`";

    LowerCase.prototype.hover = {
      icon: ':lower-case:',
      emoji: ':point_down:'
    };

    LowerCase.prototype.displayName = 'Lower';

    LowerCase.prototype.getNewText = function(text) {
      return text.toLowerCase();
    };

    return LowerCase;

  })(TransformString);

  Replace = (function(superClass) {
    extend(Replace, superClass);

    function Replace() {
      return Replace.__super__.constructor.apply(this, arguments);
    }

    Replace.extend();

    Replace.prototype.input = null;

    Replace.prototype.hover = {
      icon: ':replace:',
      emoji: ':tractor:'
    };

    Replace.prototype.requireInput = true;

    Replace.prototype.initialize = function() {
      Replace.__super__.initialize.apply(this, arguments);
      if (this.isMode('normal')) {
        this.target = 'MoveRightBufferColumn';
      }
      return this.focusInput();
    };

    Replace.prototype.getInput = function() {
      return Replace.__super__.getInput.apply(this, arguments) || "\n";
    };

    Replace.prototype.mutateSelection = function(selection) {
      var input, text;
      if (this.target.is('MoveRightBufferColumn')) {
        if (selection.getText().length !== this.getCount()) {
          return;
        }
      }
      input = this.getInput();
      if (input === "\n") {
        this.restorePositions = false;
      }
      text = selection.getText().replace(/./g, input);
      return selection.insertText(text, {
        autoIndentNewline: true
      });
    };

    return Replace;

  })(TransformString);

  SplitByCharacter = (function(superClass) {
    extend(SplitByCharacter, superClass);

    function SplitByCharacter() {
      return SplitByCharacter.__super__.constructor.apply(this, arguments);
    }

    SplitByCharacter.extend();

    SplitByCharacter.registerToSelectList();

    SplitByCharacter.prototype.getNewText = function(text) {
      return text.split('').join(' ');
    };

    return SplitByCharacter;

  })(TransformString);

  CamelCase = (function(superClass) {
    extend(CamelCase, superClass);

    function CamelCase() {
      return CamelCase.__super__.constructor.apply(this, arguments);
    }

    CamelCase.extend();

    CamelCase.registerToSelectList();

    CamelCase.prototype.displayName = 'Camelize';

    CamelCase.description = "`hello-world` -> `helloWorld`";

    CamelCase.prototype.hover = {
      icon: ':camel-case:',
      emoji: ':camel:'
    };

    CamelCase.prototype.getNewText = function(text) {
      return _.camelize(text);
    };

    return CamelCase;

  })(TransformString);

  SnakeCase = (function(superClass) {
    extend(SnakeCase, superClass);

    function SnakeCase() {
      return SnakeCase.__super__.constructor.apply(this, arguments);
    }

    SnakeCase.extend();

    SnakeCase.registerToSelectList();

    SnakeCase.description = "`HelloWorld` -> `hello_world`";

    SnakeCase.prototype.displayName = 'Underscore _';

    SnakeCase.prototype.hover = {
      icon: ':snake-case:',
      emoji: ':snake:'
    };

    SnakeCase.prototype.getNewText = function(text) {
      return _.underscore(text);
    };

    return SnakeCase;

  })(TransformString);

  PascalCase = (function(superClass) {
    extend(PascalCase, superClass);

    function PascalCase() {
      return PascalCase.__super__.constructor.apply(this, arguments);
    }

    PascalCase.extend();

    PascalCase.registerToSelectList();

    PascalCase.description = "`hello_world` -> `HelloWorld`";

    PascalCase.prototype.displayName = 'Pascalize';

    PascalCase.prototype.hover = {
      icon: ':pascal-case:',
      emoji: ':triangular_ruler:'
    };

    PascalCase.prototype.getNewText = function(text) {
      return _.capitalize(_.camelize(text));
    };

    return PascalCase;

  })(TransformString);

  DashCase = (function(superClass) {
    extend(DashCase, superClass);

    function DashCase() {
      return DashCase.__super__.constructor.apply(this, arguments);
    }

    DashCase.extend();

    DashCase.registerToSelectList();

    DashCase.prototype.displayName = 'Dasherize -';

    DashCase.description = "HelloWorld -> hello-world";

    DashCase.prototype.hover = {
      icon: ':dash-case:',
      emoji: ':dash:'
    };

    DashCase.prototype.getNewText = function(text) {
      return _.dasherize(text);
    };

    return DashCase;

  })(TransformString);

  TitleCase = (function(superClass) {
    extend(TitleCase, superClass);

    function TitleCase() {
      return TitleCase.__super__.constructor.apply(this, arguments);
    }

    TitleCase.extend();

    TitleCase.registerToSelectList();

    TitleCase.description = "`HelloWorld` -> `Hello World`";

    TitleCase.prototype.displayName = 'Titlize';

    TitleCase.prototype.getNewText = function(text) {
      return _.humanizeEventName(_.dasherize(text));
    };

    return TitleCase;

  })(TransformString);

  EncodeUriComponent = (function(superClass) {
    extend(EncodeUriComponent, superClass);

    function EncodeUriComponent() {
      return EncodeUriComponent.__super__.constructor.apply(this, arguments);
    }

    EncodeUriComponent.extend();

    EncodeUriComponent.registerToSelectList();

    EncodeUriComponent.description = "`Hello World` -> `Hello%20World`";

    EncodeUriComponent.prototype.displayName = 'Encode URI Component %';

    EncodeUriComponent.prototype.hover = {
      icon: 'encodeURI',
      emoji: 'encodeURI'
    };

    EncodeUriComponent.prototype.getNewText = function(text) {
      return encodeURIComponent(text);
    };

    return EncodeUriComponent;

  })(TransformString);

  DecodeUriComponent = (function(superClass) {
    extend(DecodeUriComponent, superClass);

    function DecodeUriComponent() {
      return DecodeUriComponent.__super__.constructor.apply(this, arguments);
    }

    DecodeUriComponent.extend();

    DecodeUriComponent.registerToSelectList();

    DecodeUriComponent.description = "`Hello%20World` -> `Hello World`";

    DecodeUriComponent.prototype.displayName = 'Decode URI Component %%';

    DecodeUriComponent.prototype.hover = {
      icon: 'decodeURI',
      emoji: 'decodeURI'
    };

    DecodeUriComponent.prototype.getNewText = function(text) {
      return decodeURIComponent(text);
    };

    return DecodeUriComponent;

  })(TransformString);

  TrimString = (function(superClass) {
    extend(TrimString, superClass);

    function TrimString() {
      return TrimString.__super__.constructor.apply(this, arguments);
    }

    TrimString.extend();

    TrimString.registerToSelectList();

    TrimString.description = "` hello ` -> `hello`";

    TrimString.prototype.displayName = 'Trim string';

    TrimString.prototype.getNewText = function(text) {
      return text.trim();
    };

    return TrimString;

  })(TransformString);

  CompactSpaces = (function(superClass) {
    extend(CompactSpaces, superClass);

    function CompactSpaces() {
      return CompactSpaces.__super__.constructor.apply(this, arguments);
    }

    CompactSpaces.extend();

    CompactSpaces.registerToSelectList();

    CompactSpaces.description = "`  a    b    c` -> `a b c`";

    CompactSpaces.prototype.displayName = 'Compact space';

    CompactSpaces.prototype.getNewText = function(text) {
      if (text.match(/^[ ]+$/)) {
        return ' ';
      } else {
        return text.replace(/^(\s*)(.*?)(\s*)$/gm, function(m, leading, middle, trailing) {
          return leading + middle.split(/[ \t]+/).join(' ') + trailing;
        });
      }
    };

    return CompactSpaces;

  })(TransformString);

  ConvertToSoftTab = (function(superClass) {
    extend(ConvertToSoftTab, superClass);

    function ConvertToSoftTab() {
      return ConvertToSoftTab.__super__.constructor.apply(this, arguments);
    }

    ConvertToSoftTab.extend();

    ConvertToSoftTab.registerToSelectList();

    ConvertToSoftTab.prototype.displayName = 'Soft Tab';

    ConvertToSoftTab.prototype.wise = 'linewise';

    ConvertToSoftTab.prototype.mutateSelection = function(selection) {
      var scanRange;
      scanRange = selection.getBufferRange();
      return this.editor.scanInBufferRange(/\t/g, scanRange, (function(_this) {
        return function(arg) {
          var length, range, replace;
          range = arg.range, replace = arg.replace;
          length = _this.editor.screenRangeForBufferRange(range).getExtent().column;
          return replace(" ".repeat(length));
        };
      })(this));
    };

    return ConvertToSoftTab;

  })(TransformString);

  ConvertToHardTab = (function(superClass) {
    extend(ConvertToHardTab, superClass);

    function ConvertToHardTab() {
      return ConvertToHardTab.__super__.constructor.apply(this, arguments);
    }

    ConvertToHardTab.extend();

    ConvertToHardTab.registerToSelectList();

    ConvertToHardTab.prototype.displayName = 'Hard Tab';

    ConvertToHardTab.prototype.mutateSelection = function(selection) {
      var scanRange, tabLength;
      tabLength = this.editor.getTabLength();
      scanRange = selection.getBufferRange();
      return this.editor.scanInBufferRange(/[ \t]+/g, scanRange, (function(_this) {
        return function(arg) {
          var endColumn, newText, nextTabStop, range, ref2, ref3, remainder, replace, screenRange, startColumn;
          range = arg.range, replace = arg.replace;
          screenRange = _this.editor.screenRangeForBufferRange(range);
          (ref2 = screenRange.start, startColumn = ref2.column), (ref3 = screenRange.end, endColumn = ref3.column);
          newText = '';
          while (true) {
            remainder = modulo(startColumn, tabLength);
            nextTabStop = startColumn + (remainder === 0 ? tabLength : remainder);
            if (nextTabStop > endColumn) {
              newText += " ".repeat(endColumn - startColumn);
            } else {
              newText += "\t";
            }
            startColumn = nextTabStop;
            if (startColumn >= endColumn) {
              break;
            }
          }
          return replace(newText);
        };
      })(this));
    };

    return ConvertToHardTab;

  })(TransformString);

  TransformStringByExternalCommand = (function(superClass) {
    extend(TransformStringByExternalCommand, superClass);

    function TransformStringByExternalCommand() {
      return TransformStringByExternalCommand.__super__.constructor.apply(this, arguments);
    }

    TransformStringByExternalCommand.extend(false);

    TransformStringByExternalCommand.prototype.autoIndent = true;

    TransformStringByExternalCommand.prototype.command = '';

    TransformStringByExternalCommand.prototype.args = [];

    TransformStringByExternalCommand.prototype.stdoutBySelection = null;

    TransformStringByExternalCommand.prototype.execute = function() {
      if (this.selectTarget()) {
        return new Promise((function(_this) {
          return function(resolve) {
            return _this.collect(resolve);
          };
        })(this)).then((function(_this) {
          return function() {
            var i, len, ref2, selection, text;
            ref2 = _this.editor.getSelections();
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              text = _this.getNewText(selection.getText(), selection);
              selection.insertText(text, {
                autoIndent: _this.autoIndent
              });
            }
            _this.restoreCursorPositionsIfNecessary();
            return _this.activateMode(_this.finalMode, _this.finalSubmode);
          };
        })(this));
      }
    };

    TransformStringByExternalCommand.prototype.collect = function(resolve) {
      var args, command, fn, i, len, processFinished, processRunning, ref2, ref3, ref4, selection;
      this.stdoutBySelection = new Map;
      processRunning = processFinished = 0;
      ref2 = this.editor.getSelections();
      fn = (function(_this) {
        return function(selection) {
          var exit, stdin, stdout;
          stdin = _this.getStdin(selection);
          stdout = function(output) {
            return _this.stdoutBySelection.set(selection, output);
          };
          exit = function(code) {
            processFinished++;
            if (processRunning === processFinished) {
              return resolve();
            }
          };
          return _this.runExternalCommand({
            command: command,
            args: args,
            stdout: stdout,
            exit: exit,
            stdin: stdin
          });
        };
      })(this);
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        ref4 = (ref3 = this.getCommand(selection)) != null ? ref3 : {}, command = ref4.command, args = ref4.args;
        if (!((command != null) && (args != null))) {
          return;
        }
        processRunning++;
        fn(selection);
      }
    };

    TransformStringByExternalCommand.prototype.runExternalCommand = function(options) {
      var bufferedProcess, stdin;
      stdin = options.stdin;
      delete options.stdin;
      bufferedProcess = new BufferedProcess(options);
      bufferedProcess.onWillThrowError((function(_this) {
        return function(arg) {
          var commandName, error, handle;
          error = arg.error, handle = arg.handle;
          if (error.code === 'ENOENT' && error.syscall.indexOf('spawn') === 0) {
            commandName = _this.constructor.getCommandName();
            console.log(commandName + ": Failed to spawn command " + error.path + ".");
            handle();
          }
          return _this.cancelOperation();
        };
      })(this));
      if (stdin) {
        bufferedProcess.process.stdin.write(stdin);
        return bufferedProcess.process.stdin.end();
      }
    };

    TransformStringByExternalCommand.prototype.getNewText = function(text, selection) {
      var ref2;
      return (ref2 = this.getStdout(selection)) != null ? ref2 : text;
    };

    TransformStringByExternalCommand.prototype.getCommand = function(selection) {
      return {
        command: this.command,
        args: this.args
      };
    };

    TransformStringByExternalCommand.prototype.getStdin = function(selection) {
      return selection.getText();
    };

    TransformStringByExternalCommand.prototype.getStdout = function(selection) {
      return this.stdoutBySelection.get(selection);
    };

    return TransformStringByExternalCommand;

  })(TransformString);

  selectListItems = null;

  TransformStringBySelectList = (function(superClass) {
    extend(TransformStringBySelectList, superClass);

    function TransformStringBySelectList() {
      return TransformStringBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformStringBySelectList.extend();

    TransformStringBySelectList.description = "Interactively choose string transformation operator from select-list";

    TransformStringBySelectList.prototype.requireInput = true;

    TransformStringBySelectList.prototype.getItems = function() {
      return selectListItems != null ? selectListItems : selectListItems = transformerRegistry.map(function(klass) {
        var displayName;
        if (klass.prototype.hasOwnProperty('displayName')) {
          displayName = klass.prototype.displayName;
        } else {
          displayName = _.humanizeEventName(_.dasherize(klass.name));
        }
        return {
          name: klass,
          displayName: displayName
        };
      });
    };

    TransformStringBySelectList.prototype.initialize = function() {
      TransformStringBySelectList.__super__.initialize.apply(this, arguments);
      this.vimState.onDidConfirmSelectList((function(_this) {
        return function(transformer) {
          var ref2, target;
          _this.vimState.reset();
          target = (ref2 = _this.target) != null ? ref2.constructor.name : void 0;
          return _this.vimState.operationStack.run(transformer.name, {
            target: target
          });
        };
      })(this));
      return this.focusSelectList({
        items: this.getItems()
      });
    };

    TransformStringBySelectList.prototype.execute = function() {
      throw new Error((this.getName()) + " should not be executed");
    };

    return TransformStringBySelectList;

  })(TransformString);

  TransformWordBySelectList = (function(superClass) {
    extend(TransformWordBySelectList, superClass);

    function TransformWordBySelectList() {
      return TransformWordBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformWordBySelectList.extend();

    TransformWordBySelectList.prototype.target = "InnerWord";

    return TransformWordBySelectList;

  })(TransformStringBySelectList);

  TransformSmartWordBySelectList = (function(superClass) {
    extend(TransformSmartWordBySelectList, superClass);

    function TransformSmartWordBySelectList() {
      return TransformSmartWordBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformSmartWordBySelectList.extend();

    TransformSmartWordBySelectList.description = "Transform InnerSmartWord by `transform-string-by-select-list`";

    TransformSmartWordBySelectList.prototype.target = "InnerSmartWord";

    return TransformSmartWordBySelectList;

  })(TransformStringBySelectList);

  ReplaceWithRegister = (function(superClass) {
    extend(ReplaceWithRegister, superClass);

    function ReplaceWithRegister() {
      return ReplaceWithRegister.__super__.constructor.apply(this, arguments);
    }

    ReplaceWithRegister.extend();

    ReplaceWithRegister.description = "Replace target with specified register value";

    ReplaceWithRegister.prototype.hover = {
      icon: ':replace-with-register:',
      emoji: ':pencil:'
    };

    ReplaceWithRegister.prototype.getNewText = function(text) {
      return this.vimState.register.getText();
    };

    return ReplaceWithRegister;

  })(TransformString);

  SwapWithRegister = (function(superClass) {
    extend(SwapWithRegister, superClass);

    function SwapWithRegister() {
      return SwapWithRegister.__super__.constructor.apply(this, arguments);
    }

    SwapWithRegister.extend();

    SwapWithRegister.description = "Swap register value with target";

    SwapWithRegister.prototype.getNewText = function(text, selection) {
      var newText;
      newText = this.vimState.register.getText();
      this.setTextToRegister(text, selection);
      return newText;
    };

    return SwapWithRegister;

  })(TransformString);

  Indent = (function(superClass) {
    extend(Indent, superClass);

    function Indent() {
      return Indent.__super__.constructor.apply(this, arguments);
    }

    Indent.extend();

    Indent.prototype.hover = {
      icon: ':indent:',
      emoji: ':point_right:'
    };

    Indent.prototype.stayOnLinewise = false;

    Indent.prototype.useMarkerForStay = true;

    Indent.prototype.clipToMutationEndOnStay = false;

    Indent.prototype.execute = function() {
      if (!this.needStay()) {
        this.onDidRestoreCursorPositions((function(_this) {
          return function() {
            return _this.editor.moveToFirstCharacterOfLine();
          };
        })(this));
      }
      return Indent.__super__.execute.apply(this, arguments);
    };

    Indent.prototype.mutateSelection = function(selection) {
      return selection.indentSelectedRows();
    };

    return Indent;

  })(TransformString);

  Outdent = (function(superClass) {
    extend(Outdent, superClass);

    function Outdent() {
      return Outdent.__super__.constructor.apply(this, arguments);
    }

    Outdent.extend();

    Outdent.prototype.hover = {
      icon: ':outdent:',
      emoji: ':point_left:'
    };

    Outdent.prototype.mutateSelection = function(selection) {
      return selection.outdentSelectedRows();
    };

    return Outdent;

  })(Indent);

  AutoIndent = (function(superClass) {
    extend(AutoIndent, superClass);

    function AutoIndent() {
      return AutoIndent.__super__.constructor.apply(this, arguments);
    }

    AutoIndent.extend();

    AutoIndent.prototype.hover = {
      icon: ':auto-indent:',
      emoji: ':open_hands:'
    };

    AutoIndent.prototype.mutateSelection = function(selection) {
      return selection.autoIndentSelectedRows();
    };

    return AutoIndent;

  })(Indent);

  ToggleLineComments = (function(superClass) {
    extend(ToggleLineComments, superClass);

    function ToggleLineComments() {
      return ToggleLineComments.__super__.constructor.apply(this, arguments);
    }

    ToggleLineComments.extend();

    ToggleLineComments.prototype.hover = {
      icon: ':toggle-line-comments:',
      emoji: ':mute:'
    };

    ToggleLineComments.prototype.useMarkerForStay = true;

    ToggleLineComments.prototype.mutateSelection = function(selection) {
      return selection.toggleLineComments();
    };

    return ToggleLineComments;

  })(TransformString);

  Surround = (function(superClass) {
    extend(Surround, superClass);

    function Surround() {
      return Surround.__super__.constructor.apply(this, arguments);
    }

    Surround.extend();

    Surround.description = "Surround target by specified character like `(`, `[`, `\"`";

    Surround.prototype.displayName = "Surround ()";

    Surround.prototype.hover = {
      icon: ':surround:',
      emoji: ':two_women_holding_hands:'
    };

    Surround.prototype.pairs = [['[', ']'], ['(', ')'], ['{', '}'], ['<', '>']];

    Surround.prototype.input = null;

    Surround.prototype.charsMax = 1;

    Surround.prototype.requireInput = true;

    Surround.prototype.autoIndent = false;

    Surround.prototype.initialize = function() {
      Surround.__super__.initialize.apply(this, arguments);
      if (!this.requireInput) {
        return;
      }
      if (this.requireTarget) {
        return this.onDidSetTarget((function(_this) {
          return function() {
            _this.onDidConfirmInput(function(input) {
              return _this.onConfirm(input);
            });
            _this.onDidChangeInput(function(input) {
              return _this.addHover(input);
            });
            _this.onDidCancelInput(function() {
              return _this.cancelOperation();
            });
            return _this.vimState.input.focus(_this.charsMax);
          };
        })(this));
      } else {
        this.onDidConfirmInput((function(_this) {
          return function(input) {
            return _this.onConfirm(input);
          };
        })(this));
        this.onDidChangeInput((function(_this) {
          return function(input) {
            return _this.addHover(input);
          };
        })(this));
        this.onDidCancelInput((function(_this) {
          return function() {
            return _this.cancelOperation();
          };
        })(this));
        return this.vimState.input.focus(this.charsMax);
      }
    };

    Surround.prototype.onConfirm = function(input1) {
      this.input = input1;
      return this.processOperation();
    };

    Surround.prototype.getPair = function(char) {
      var pair;
      pair = _.detect(this.pairs, function(pair) {
        return indexOf.call(pair, char) >= 0;
      });
      return pair != null ? pair : pair = [char, char];
    };

    Surround.prototype.surround = function(text, char, options) {
      var close, keepLayout, open, ref2, ref3;
      if (options == null) {
        options = {};
      }
      keepLayout = (ref2 = options.keepLayout) != null ? ref2 : false;
      ref3 = this.getPair(char), open = ref3[0], close = ref3[1];
      if ((!keepLayout) && LineEndingRegExp.test(text)) {
        this.autoIndent = true;
        open += "\n";
        close += "\n";
      }
      if (indexOf.call(settings.get('charactersToAddSpaceOnSurround'), char) >= 0 && isSingleLine(text)) {
        return open + ' ' + text + ' ' + close;
      } else {
        return open + text + close;
      }
    };

    Surround.prototype.getNewText = function(text) {
      return this.surround(text, this.input);
    };

    return Surround;

  })(TransformString);

  SurroundWord = (function(superClass) {
    extend(SurroundWord, superClass);

    function SurroundWord() {
      return SurroundWord.__super__.constructor.apply(this, arguments);
    }

    SurroundWord.extend();

    SurroundWord.description = "Surround **word**";

    SurroundWord.prototype.target = 'InnerWord';

    return SurroundWord;

  })(Surround);

  SurroundSmartWord = (function(superClass) {
    extend(SurroundSmartWord, superClass);

    function SurroundSmartWord() {
      return SurroundSmartWord.__super__.constructor.apply(this, arguments);
    }

    SurroundSmartWord.extend();

    SurroundSmartWord.description = "Surround **smart-word**";

    SurroundSmartWord.prototype.target = 'InnerSmartWord';

    return SurroundSmartWord;

  })(Surround);

  MapSurround = (function(superClass) {
    extend(MapSurround, superClass);

    function MapSurround() {
      return MapSurround.__super__.constructor.apply(this, arguments);
    }

    MapSurround.extend();

    MapSurround.description = "Surround each word(`/\w+/`) within target";

    MapSurround.prototype.occurrence = true;

    MapSurround.prototype.patternForOccurrence = /\w+/g;

    return MapSurround;

  })(Surround);

  DeleteSurround = (function(superClass) {
    extend(DeleteSurround, superClass);

    function DeleteSurround() {
      return DeleteSurround.__super__.constructor.apply(this, arguments);
    }

    DeleteSurround.extend();

    DeleteSurround.description = "Delete specified surround character like `(`, `[`, `\"`";

    DeleteSurround.prototype.pairChars = ['[]', '()', '{}'].join('');

    DeleteSurround.prototype.requireTarget = false;

    DeleteSurround.prototype.onConfirm = function(input1) {
      var ref2;
      this.input = input1;
      this.setTarget(this["new"]('Pair', {
        pair: this.getPair(this.input),
        inner: false,
        allowNextLine: (ref2 = this.input, indexOf.call(this.pairChars, ref2) >= 0)
      }));
      return this.processOperation();
    };

    DeleteSurround.prototype.getNewText = function(text) {
      var closeChar, openChar, ref2;
      ref2 = [text[0], _.last(text)], openChar = ref2[0], closeChar = ref2[1];
      text = text.slice(1, -1);
      if (isSingleLine(text)) {
        if (openChar !== closeChar) {
          text = text.trim();
        }
      }
      return text;
    };

    return DeleteSurround;

  })(Surround);

  DeleteSurroundAnyPair = (function(superClass) {
    extend(DeleteSurroundAnyPair, superClass);

    function DeleteSurroundAnyPair() {
      return DeleteSurroundAnyPair.__super__.constructor.apply(this, arguments);
    }

    DeleteSurroundAnyPair.extend();

    DeleteSurroundAnyPair.description = "Delete surround character by auto-detect paired char from cursor enclosed pair";

    DeleteSurroundAnyPair.prototype.requireInput = false;

    DeleteSurroundAnyPair.prototype.target = 'AAnyPair';

    return DeleteSurroundAnyPair;

  })(DeleteSurround);

  DeleteSurroundAnyPairAllowForwarding = (function(superClass) {
    extend(DeleteSurroundAnyPairAllowForwarding, superClass);

    function DeleteSurroundAnyPairAllowForwarding() {
      return DeleteSurroundAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    DeleteSurroundAnyPairAllowForwarding.extend();

    DeleteSurroundAnyPairAllowForwarding.description = "Delete surround character by auto-detect paired char from cursor enclosed pair and forwarding pair within same line";

    DeleteSurroundAnyPairAllowForwarding.prototype.target = 'AAnyPairAllowForwarding';

    return DeleteSurroundAnyPairAllowForwarding;

  })(DeleteSurroundAnyPair);

  ChangeSurround = (function(superClass) {
    extend(ChangeSurround, superClass);

    function ChangeSurround() {
      return ChangeSurround.__super__.constructor.apply(this, arguments);
    }

    ChangeSurround.extend();

    ChangeSurround.description = "Change surround character, specify both from and to pair char";

    ChangeSurround.prototype.charsMax = 2;

    ChangeSurround.prototype.char = null;

    ChangeSurround.prototype.onConfirm = function(input) {
      var from, ref2;
      if (!input) {
        return;
      }
      ref2 = input.split(''), from = ref2[0], this.char = ref2[1];
      return ChangeSurround.__super__.onConfirm.call(this, from);
    };

    ChangeSurround.prototype.getNewText = function(text) {
      var innerText;
      innerText = ChangeSurround.__super__.getNewText.apply(this, arguments);
      return this.surround(innerText, this.char, {
        keepLayout: true
      });
    };

    return ChangeSurround;

  })(DeleteSurround);

  ChangeSurroundAnyPair = (function(superClass) {
    extend(ChangeSurroundAnyPair, superClass);

    function ChangeSurroundAnyPair() {
      return ChangeSurroundAnyPair.__super__.constructor.apply(this, arguments);
    }

    ChangeSurroundAnyPair.extend();

    ChangeSurroundAnyPair.description = "Change surround character, from char is auto-detected";

    ChangeSurroundAnyPair.prototype.charsMax = 1;

    ChangeSurroundAnyPair.prototype.target = "AAnyPair";

    ChangeSurroundAnyPair.prototype.highlightTargetRange = function(selection) {
      var marker, range;
      if (range = this.target.getRange(selection)) {
        marker = this.editor.markBufferRange(range);
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          "class": 'vim-mode-plus-target-range'
        });
        return marker;
      } else {
        return null;
      }
    };

    ChangeSurroundAnyPair.prototype.initialize = function() {
      var marker;
      marker = null;
      this.onDidSetTarget((function(_this) {
        return function() {
          var char, textRange;
          if (marker = _this.highlightTargetRange(_this.editor.getLastSelection())) {
            textRange = Range.fromPointWithDelta(marker.getBufferRange().start, 0, 1);
            char = _this.editor.getTextInBufferRange(textRange);
            return _this.addHover(char, {}, _this.editor.getCursorBufferPosition());
          } else {
            _this.vimState.input.cancel();
            return _this.abort();
          }
        };
      })(this));
      this.onDidResetOperationStack(function() {
        return marker != null ? marker.destroy() : void 0;
      });
      return ChangeSurroundAnyPair.__super__.initialize.apply(this, arguments);
    };

    ChangeSurroundAnyPair.prototype.onConfirm = function(char1) {
      this.char = char1;
      this.input = this.char;
      return this.processOperation();
    };

    return ChangeSurroundAnyPair;

  })(ChangeSurround);

  ChangeSurroundAnyPairAllowForwarding = (function(superClass) {
    extend(ChangeSurroundAnyPairAllowForwarding, superClass);

    function ChangeSurroundAnyPairAllowForwarding() {
      return ChangeSurroundAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ChangeSurroundAnyPairAllowForwarding.extend();

    ChangeSurroundAnyPairAllowForwarding.description = "Change surround character, from char is auto-detected from enclosed and forwarding area";

    ChangeSurroundAnyPairAllowForwarding.prototype.target = "AAnyPairAllowForwarding";

    return ChangeSurroundAnyPairAllowForwarding;

  })(ChangeSurroundAnyPair);

  Join = (function(superClass) {
    extend(Join, superClass);

    function Join() {
      return Join.__super__.constructor.apply(this, arguments);
    }

    Join.extend();

    Join.prototype.target = "MoveToRelativeLine";

    Join.prototype.flashTarget = false;

    Join.prototype.restorePositions = false;

    Join.prototype.mutateSelection = function(selection) {
      var end, range;
      if (swrap(selection).isLinewise()) {
        range = selection.getBufferRange();
        selection.setBufferRange(range.translate([0, 0], [-1, 2e308]));
      }
      selection.joinLines();
      end = selection.getBufferRange().end;
      return selection.cursor.setBufferPosition(end.translate([0, -1]));
    };

    return Join;

  })(TransformString);

  JoinWithKeepingSpace = (function(superClass) {
    extend(JoinWithKeepingSpace, superClass);

    function JoinWithKeepingSpace() {
      return JoinWithKeepingSpace.__super__.constructor.apply(this, arguments);
    }

    JoinWithKeepingSpace.extend();

    JoinWithKeepingSpace.registerToSelectList();

    JoinWithKeepingSpace.prototype.input = '';

    JoinWithKeepingSpace.prototype.requireTarget = false;

    JoinWithKeepingSpace.prototype.trim = false;

    JoinWithKeepingSpace.prototype.initialize = function() {
      return this.setTarget(this["new"]("MoveToRelativeLineWithMinimum", {
        min: 1
      }));
    };

    JoinWithKeepingSpace.prototype.mutateSelection = function(selection) {
      var endRow, ref2, row, rows, startRow, text;
      ref2 = selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      swrap(selection).expandOverLine();
      rows = (function() {
        var i, ref3, ref4, results;
        results = [];
        for (row = i = ref3 = startRow, ref4 = endRow; ref3 <= ref4 ? i <= ref4 : i >= ref4; row = ref3 <= ref4 ? ++i : --i) {
          text = this.editor.lineTextForBufferRow(row);
          if (this.trim && row !== startRow) {
            results.push(text.trimLeft());
          } else {
            results.push(text);
          }
        }
        return results;
      }).call(this);
      return selection.insertText(this.join(rows) + "\n");
    };

    JoinWithKeepingSpace.prototype.join = function(rows) {
      return rows.join(this.input);
    };

    return JoinWithKeepingSpace;

  })(TransformString);

  JoinByInput = (function(superClass) {
    extend(JoinByInput, superClass);

    function JoinByInput() {
      return JoinByInput.__super__.constructor.apply(this, arguments);
    }

    JoinByInput.extend();

    JoinByInput.registerToSelectList();

    JoinByInput.description = "Transform multi-line to single-line by with specified separator character";

    JoinByInput.prototype.hover = {
      icon: ':join:',
      emoji: ':couple:'
    };

    JoinByInput.prototype.requireInput = true;

    JoinByInput.prototype.input = null;

    JoinByInput.prototype.trim = true;

    JoinByInput.prototype.initialize = function() {
      var charsMax;
      JoinByInput.__super__.initialize.apply(this, arguments);
      charsMax = 10;
      return this.focusInput(charsMax);
    };

    JoinByInput.prototype.join = function(rows) {
      return rows.join(" " + this.input + " ");
    };

    return JoinByInput;

  })(JoinWithKeepingSpace);

  JoinByInputWithKeepingSpace = (function(superClass) {
    extend(JoinByInputWithKeepingSpace, superClass);

    function JoinByInputWithKeepingSpace() {
      return JoinByInputWithKeepingSpace.__super__.constructor.apply(this, arguments);
    }

    JoinByInputWithKeepingSpace.description = "Join lines without padding space between each line";

    JoinByInputWithKeepingSpace.extend();

    JoinByInputWithKeepingSpace.registerToSelectList();

    JoinByInputWithKeepingSpace.prototype.trim = false;

    JoinByInputWithKeepingSpace.prototype.join = function(rows) {
      return rows.join(this.input);
    };

    return JoinByInputWithKeepingSpace;

  })(JoinByInput);

  SplitString = (function(superClass) {
    extend(SplitString, superClass);

    function SplitString() {
      return SplitString.__super__.constructor.apply(this, arguments);
    }

    SplitString.extend();

    SplitString.registerToSelectList();

    SplitString.description = "Split single-line into multi-line by splitting specified separator chars";

    SplitString.prototype.hover = {
      icon: ':split-string:',
      emoji: ':hocho:'
    };

    SplitString.prototype.requireInput = true;

    SplitString.prototype.input = null;

    SplitString.prototype.initialize = function() {
      var charsMax;
      SplitString.__super__.initialize.apply(this, arguments);
      if (!this.isMode('visual')) {
        this.setTarget(this["new"]("MoveToRelativeLine", {
          min: 1
        }));
      }
      charsMax = 10;
      return this.focusInput(charsMax);
    };

    SplitString.prototype.getNewText = function(text) {
      var regex;
      if (this.input === '') {
        this.input = "\\n";
      }
      regex = RegExp("" + (_.escapeRegExp(this.input)), "g");
      return text.split(regex).join("\n");
    };

    return SplitString;

  })(TransformString);

  ChangeOrder = (function(superClass) {
    extend(ChangeOrder, superClass);

    function ChangeOrder() {
      return ChangeOrder.__super__.constructor.apply(this, arguments);
    }

    ChangeOrder.extend(false);

    ChangeOrder.prototype.wise = 'linewise';

    ChangeOrder.prototype.mutateSelection = function(selection) {
      var newText, rows, textForRows;
      textForRows = swrap(selection).lineTextForBufferRows();
      rows = this.getNewRows(textForRows);
      newText = rows.join("\n") + "\n";
      return selection.insertText(newText);
    };

    return ChangeOrder;

  })(TransformString);

  Reverse = (function(superClass) {
    extend(Reverse, superClass);

    function Reverse() {
      return Reverse.__super__.constructor.apply(this, arguments);
    }

    Reverse.extend();

    Reverse.registerToSelectList();

    Reverse.description = "Reverse lines(e.g reverse selected three line)";

    Reverse.prototype.getNewRows = function(rows) {
      return rows.reverse();
    };

    return Reverse;

  })(ChangeOrder);

  Sort = (function(superClass) {
    extend(Sort, superClass);

    function Sort() {
      return Sort.__super__.constructor.apply(this, arguments);
    }

    Sort.extend();

    Sort.registerToSelectList();

    Sort.description = "Sort lines alphabetically";

    Sort.prototype.getNewRows = function(rows) {
      return rows.sort();
    };

    return Sort;

  })(ChangeOrder);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci10cmFuc2Zvcm0tc3RyaW5nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNjdCQUFBO0lBQUE7Ozs7O0VBQUEsZ0JBQUEsR0FBbUI7O0VBQ25CLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBMkIsT0FBQSxDQUFRLE1BQVIsQ0FBM0IsRUFBQyxxQ0FBRCxFQUFrQjs7RUFFbEIsT0FHSSxPQUFBLENBQVEsU0FBUixDQUhKLEVBQ0UsMERBREYsRUFFRTs7RUFFRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsUUFBQSxHQUFXLElBQUksQ0FBQyxRQUFMLENBQWMsVUFBZDs7RUFJWCxtQkFBQSxHQUFzQjs7RUFDaEI7Ozs7Ozs7SUFDSixlQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7OzhCQUNBLFdBQUEsR0FBYTs7OEJBQ2IsY0FBQSxHQUFnQjs7OEJBQ2hCLFVBQUEsR0FBWTs7SUFFWixlQUFDLENBQUEsb0JBQUQsR0FBdUIsU0FBQTthQUNyQixtQkFBbUIsQ0FBQyxJQUFwQixDQUF5QixJQUF6QjtJQURxQjs7OEJBR3ZCLGVBQUEsR0FBaUIsU0FBQyxTQUFELEVBQVksWUFBWjtBQUNmLFVBQUE7TUFBQSxJQUFHLElBQUEsR0FBTyxJQUFDLENBQUEsVUFBRCxDQUFZLFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FBWixFQUFpQyxTQUFqQyxFQUE0QyxZQUE1QyxDQUFWO2VBQ0UsU0FBUyxDQUFDLFVBQVYsQ0FBcUIsSUFBckIsRUFBMkI7VUFBRSxZQUFELElBQUMsQ0FBQSxVQUFGO1NBQTNCLEVBREY7O0lBRGU7Ozs7S0FUVzs7RUFheEI7Ozs7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QUFDLENBQUEsb0JBQUQsQ0FBQTs7SUFDQSxPQUFDLENBQUEsV0FBRCxHQUFjOztzQkFDZCxVQUFBLEdBQVksU0FBQyxJQUFEO2FBQ1YsSUFBSSxDQUFDLE9BQUwsQ0FBQTtJQURVOzs7O0tBSlE7O0VBT2hCOzs7Ozs7O0lBQ0osSUFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxJQUFDLENBQUEsb0JBQUQsQ0FBQTs7SUFDQSxJQUFDLENBQUEsV0FBRCxHQUFjOzttQkFDZCxVQUFBLEdBQVksU0FBQyxJQUFEO2FBQ1YsSUFBSSxDQUFDLElBQUwsQ0FBQTtJQURVOzs7O0tBSks7QUFsb0JuQiIsInNvdXJjZXNDb250ZW50IjpbIkxpbmVFbmRpbmdSZWdFeHAgPSAvKD86XFxufFxcclxcbikkL1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntCdWZmZXJlZFByb2Nlc3MsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbntcbiAgaGF2ZVNvbWVOb25FbXB0eVNlbGVjdGlvblxuICBpc1NpbmdsZUxpbmVcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbk9wZXJhdG9yID0gQmFzZS5nZXRDbGFzcygnT3BlcmF0b3InKVxuXG4jIFRyYW5zZm9ybVN0cmluZ1xuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxudHJhbnNmb3JtZXJSZWdpc3RyeSA9IFtdXG5jbGFzcyBUcmFuc2Zvcm1TdHJpbmcgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKGZhbHNlKVxuICB0cmFja0NoYW5nZTogdHJ1ZVxuICBzdGF5T25MaW5ld2lzZTogdHJ1ZVxuICBhdXRvSW5kZW50OiBmYWxzZVxuXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdDogLT5cbiAgICB0cmFuc2Zvcm1lclJlZ2lzdHJ5LnB1c2godGhpcylcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24sIHN0b3BNdXRhdGlvbikgLT5cbiAgICBpZiB0ZXh0ID0gQGdldE5ld1RleHQoc2VsZWN0aW9uLmdldFRleHQoKSwgc2VsZWN0aW9uLCBzdG9wTXV0YXRpb24pXG4gICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCB7QGF1dG9JbmRlbnR9KVxuXG5jbGFzcyBUb2dnbGVDYXNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYEhlbGxvIFdvcmxkYCAtPiBgaEVMTE8gd09STERgXCJcbiAgZGlzcGxheU5hbWU6ICdUb2dnbGUgfidcbiAgaG92ZXI6IGljb246ICc6dG9nZ2xlLWNhc2U6JywgZW1vamk6ICc6Y2xhcDonXG5cbiAgdG9nZ2xlQ2FzZTogKGNoYXIpIC0+XG4gICAgY2hhckxvd2VyID0gY2hhci50b0xvd2VyQ2FzZSgpXG4gICAgaWYgY2hhckxvd2VyIGlzIGNoYXJcbiAgICAgIGNoYXIudG9VcHBlckNhc2UoKVxuICAgIGVsc2VcbiAgICAgIGNoYXJMb3dlclxuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIHRleHQucmVwbGFjZSgvLi9nLCBAdG9nZ2xlQ2FzZS5iaW5kKHRoaXMpKVxuXG5jbGFzcyBUb2dnbGVDYXNlQW5kTW92ZVJpZ2h0IGV4dGVuZHMgVG9nZ2xlQ2FzZVxuICBAZXh0ZW5kKClcbiAgaG92ZXI6IG51bGxcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIHJlc3RvcmVQb3NpdGlvbnM6IGZhbHNlXG4gIHRhcmdldDogJ01vdmVSaWdodCdcblxuY2xhc3MgVXBwZXJDYXNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYEhlbGxvIFdvcmxkYCAtPiBgSEVMTE8gV09STERgXCJcbiAgaG92ZXI6IGljb246ICc6dXBwZXItY2FzZTonLCBlbW9qaTogJzpwb2ludF91cDonXG4gIGRpc3BsYXlOYW1lOiAnVXBwZXInXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIHRleHQudG9VcHBlckNhc2UoKVxuXG5jbGFzcyBMb3dlckNhc2UgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgSGVsbG8gV29ybGRgIC0+IGBoZWxsbyB3b3JsZGBcIlxuICBob3ZlcjogaWNvbjogJzpsb3dlci1jYXNlOicsIGVtb2ppOiAnOnBvaW50X2Rvd246J1xuICBkaXNwbGF5TmFtZTogJ0xvd2VyJ1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICB0ZXh0LnRvTG93ZXJDYXNlKClcblxuIyBSZXBsYWNlXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFJlcGxhY2UgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIGlucHV0OiBudWxsXG4gIGhvdmVyOiBpY29uOiAnOnJlcGxhY2U6JywgZW1vamk6ICc6dHJhY3RvcjonXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBpZiBAaXNNb2RlKCdub3JtYWwnKVxuICAgICAgQHRhcmdldCA9ICdNb3ZlUmlnaHRCdWZmZXJDb2x1bW4nXG4gICAgQGZvY3VzSW5wdXQoKVxuXG4gIGdldElucHV0OiAtPlxuICAgIHN1cGVyIG9yIFwiXFxuXCJcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgQHRhcmdldC5pcygnTW92ZVJpZ2h0QnVmZmVyQ29sdW1uJylcbiAgICAgIHJldHVybiB1bmxlc3Mgc2VsZWN0aW9uLmdldFRleHQoKS5sZW5ndGggaXMgQGdldENvdW50KClcblxuICAgIGlucHV0ID0gQGdldElucHV0KClcbiAgICBAcmVzdG9yZVBvc2l0aW9ucyA9IGZhbHNlIGlmIGlucHV0IGlzIFwiXFxuXCJcbiAgICB0ZXh0ID0gc2VsZWN0aW9uLmdldFRleHQoKS5yZXBsYWNlKC8uL2csIGlucHV0KVxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQsIGF1dG9JbmRlbnROZXdsaW5lOiB0cnVlKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgRFVQIG1lYW5pbmcgd2l0aCBTcGxpdFN0cmluZyBuZWVkIGNvbnNvbGlkYXRlLlxuY2xhc3MgU3BsaXRCeUNoYXJhY3RlciBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgdGV4dC5zcGxpdCgnJykuam9pbignICcpXG5cbmNsYXNzIENhbWVsQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgZGlzcGxheU5hbWU6ICdDYW1lbGl6ZSdcbiAgQGRlc2NyaXB0aW9uOiBcImBoZWxsby13b3JsZGAgLT4gYGhlbGxvV29ybGRgXCJcbiAgaG92ZXI6IGljb246ICc6Y2FtZWwtY2FzZTonLCBlbW9qaTogJzpjYW1lbDonXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIF8uY2FtZWxpemUodGV4dClcblxuY2xhc3MgU25ha2VDYXNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYEhlbGxvV29ybGRgIC0+IGBoZWxsb193b3JsZGBcIlxuICBkaXNwbGF5TmFtZTogJ1VuZGVyc2NvcmUgXydcbiAgaG92ZXI6IGljb246ICc6c25ha2UtY2FzZTonLCBlbW9qaTogJzpzbmFrZTonXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIF8udW5kZXJzY29yZSh0ZXh0KVxuXG5jbGFzcyBQYXNjYWxDYXNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYGhlbGxvX3dvcmxkYCAtPiBgSGVsbG9Xb3JsZGBcIlxuICBkaXNwbGF5TmFtZTogJ1Bhc2NhbGl6ZSdcbiAgaG92ZXI6IGljb246ICc6cGFzY2FsLWNhc2U6JywgZW1vamk6ICc6dHJpYW5ndWxhcl9ydWxlcjonXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIF8uY2FwaXRhbGl6ZShfLmNhbWVsaXplKHRleHQpKVxuXG5jbGFzcyBEYXNoQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgZGlzcGxheU5hbWU6ICdEYXNoZXJpemUgLSdcbiAgQGRlc2NyaXB0aW9uOiBcIkhlbGxvV29ybGQgLT4gaGVsbG8td29ybGRcIlxuICBob3ZlcjogaWNvbjogJzpkYXNoLWNhc2U6JywgZW1vamk6ICc6ZGFzaDonXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIF8uZGFzaGVyaXplKHRleHQpXG5cbmNsYXNzIFRpdGxlQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBIZWxsb1dvcmxkYCAtPiBgSGVsbG8gV29ybGRgXCJcbiAgZGlzcGxheU5hbWU6ICdUaXRsaXplJ1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBfLmh1bWFuaXplRXZlbnROYW1lKF8uZGFzaGVyaXplKHRleHQpKVxuXG5jbGFzcyBFbmNvZGVVcmlDb21wb25lbnQgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgSGVsbG8gV29ybGRgIC0+IGBIZWxsbyUyMFdvcmxkYFwiXG4gIGRpc3BsYXlOYW1lOiAnRW5jb2RlIFVSSSBDb21wb25lbnQgJSdcbiAgaG92ZXI6IGljb246ICdlbmNvZGVVUkknLCBlbW9qaTogJ2VuY29kZVVSSSdcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpXG5cbmNsYXNzIERlY29kZVVyaUNvbXBvbmVudCBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBIZWxsbyUyMFdvcmxkYCAtPiBgSGVsbG8gV29ybGRgXCJcbiAgZGlzcGxheU5hbWU6ICdEZWNvZGUgVVJJIENvbXBvbmVudCAlJSdcbiAgaG92ZXI6IGljb246ICdkZWNvZGVVUkknLCBlbW9qaTogJ2RlY29kZVVSSSdcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgZGVjb2RlVVJJQ29tcG9uZW50KHRleHQpXG5cbmNsYXNzIFRyaW1TdHJpbmcgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgIGhlbGxvIGAgLT4gYGhlbGxvYFwiXG4gIGRpc3BsYXlOYW1lOiAnVHJpbSBzdHJpbmcnXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIHRleHQudHJpbSgpXG5cbmNsYXNzIENvbXBhY3RTcGFjZXMgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgICBhICAgIGIgICAgY2AgLT4gYGEgYiBjYFwiXG4gIGRpc3BsYXlOYW1lOiAnQ29tcGFjdCBzcGFjZSdcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgaWYgdGV4dC5tYXRjaCgvXlsgXSskLylcbiAgICAgICcgJ1xuICAgIGVsc2VcbiAgICAgICMgRG9uJ3QgY29tcGFjdCBmb3IgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGUgc3BhY2VzLlxuICAgICAgdGV4dC5yZXBsYWNlIC9eKFxccyopKC4qPykoXFxzKikkL2dtLCAobSwgbGVhZGluZywgbWlkZGxlLCB0cmFpbGluZykgLT5cbiAgICAgICAgbGVhZGluZyArIG1pZGRsZS5zcGxpdCgvWyBcXHRdKy8pLmpvaW4oJyAnKSArIHRyYWlsaW5nXG5cbmNsYXNzIENvbnZlcnRUb1NvZnRUYWIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIGRpc3BsYXlOYW1lOiAnU29mdCBUYWInXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgc2NhblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC9cXHQvZywgc2NhblJhbmdlLCAoe3JhbmdlLCByZXBsYWNlfSkgPT5cbiAgICAgICMgUmVwbGFjZSBcXHQgdG8gc3BhY2VzIHdoaWNoIGxlbmd0aCBpcyB2YXJ5IGRlcGVuZGluZyBvbiB0YWJTdG9wIGFuZCB0YWJMZW5naHRcbiAgICAgICMgU28gd2UgZGlyZWN0bHkgY29uc3VsdCBpdCdzIHNjcmVlbiByZXByZXNlbnRpbmcgbGVuZ3RoLlxuICAgICAgbGVuZ3RoID0gQGVkaXRvci5zY3JlZW5SYW5nZUZvckJ1ZmZlclJhbmdlKHJhbmdlKS5nZXRFeHRlbnQoKS5jb2x1bW5cbiAgICAgIHJlcGxhY2UoXCIgXCIucmVwZWF0KGxlbmd0aCkpXG5cbmNsYXNzIENvbnZlcnRUb0hhcmRUYWIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIGRpc3BsYXlOYW1lOiAnSGFyZCBUYWInXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHRhYkxlbmd0aCA9IEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBzY2FuUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgL1sgXFx0XSsvZywgc2NhblJhbmdlLCAoe3JhbmdlLCByZXBsYWNlfSkgPT5cbiAgICAgIHNjcmVlblJhbmdlID0gQGVkaXRvci5zY3JlZW5SYW5nZUZvckJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAge3N0YXJ0OiB7Y29sdW1uOiBzdGFydENvbHVtbn0sIGVuZDoge2NvbHVtbjogZW5kQ29sdW1ufX0gPSBzY3JlZW5SYW5nZVxuXG4gICAgICAjIFdlIGNhbid0IG5haXZlbHkgcmVwbGFjZSBzcGFjZXMgdG8gdGFiLCB3ZSBoYXZlIHRvIGNvbnNpZGVyIHZhbGlkIHRhYlN0b3AgY29sdW1uXG4gICAgICAjIElmIG5leHRUYWJTdG9wIGNvbHVtbiBleGNlZWRzIHJlcGxhY2FibGUgcmFuZ2UsIHdlIHBhZCB3aXRoIHNwYWNlcy5cbiAgICAgIG5ld1RleHQgPSAnJ1xuICAgICAgbG9vcFxuICAgICAgICByZW1haW5kZXIgPSBzdGFydENvbHVtbiAlJSB0YWJMZW5ndGhcbiAgICAgICAgbmV4dFRhYlN0b3AgPSBzdGFydENvbHVtbiArIChpZiByZW1haW5kZXIgaXMgMCB0aGVuIHRhYkxlbmd0aCBlbHNlIHJlbWFpbmRlcilcbiAgICAgICAgaWYgbmV4dFRhYlN0b3AgPiBlbmRDb2x1bW5cbiAgICAgICAgICBuZXdUZXh0ICs9IFwiIFwiLnJlcGVhdChlbmRDb2x1bW4gLSBzdGFydENvbHVtbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG5ld1RleHQgKz0gXCJcXHRcIlxuICAgICAgICBzdGFydENvbHVtbiA9IG5leHRUYWJTdG9wXG4gICAgICAgIGJyZWFrIGlmIHN0YXJ0Q29sdW1uID49IGVuZENvbHVtblxuXG4gICAgICByZXBsYWNlKG5ld1RleHQpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgVHJhbnNmb3JtU3RyaW5nQnlFeHRlcm5hbENvbW1hbmQgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZChmYWxzZSlcbiAgYXV0b0luZGVudDogdHJ1ZVxuICBjb21tYW5kOiAnJyAjIGUuZy4gY29tbWFuZDogJ3NvcnQnXG4gIGFyZ3M6IFtdICMgZS5nIGFyZ3M6IFsnLXJuJ11cbiAgc3Rkb3V0QnlTZWxlY3Rpb246IG51bGxcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICAgIEBjb2xsZWN0KHJlc29sdmUpXG4gICAgICAudGhlbiA9PlxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgdGV4dCA9IEBnZXROZXdUZXh0KHNlbGVjdGlvbi5nZXRUZXh0KCksIHNlbGVjdGlvbilcbiAgICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCB7QGF1dG9JbmRlbnR9KVxuICAgICAgICBAcmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5KClcbiAgICAgICAgQGFjdGl2YXRlTW9kZShAZmluYWxNb2RlLCBAZmluYWxTdWJtb2RlKVxuXG4gIGNvbGxlY3Q6IChyZXNvbHZlKSAtPlxuICAgIEBzdGRvdXRCeVNlbGVjdGlvbiA9IG5ldyBNYXBcbiAgICBwcm9jZXNzUnVubmluZyA9IHByb2Nlc3NGaW5pc2hlZCA9IDBcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICB7Y29tbWFuZCwgYXJnc30gPSBAZ2V0Q29tbWFuZChzZWxlY3Rpb24pID8ge31cbiAgICAgIHJldHVybiB1bmxlc3MgKGNvbW1hbmQ/IGFuZCBhcmdzPylcbiAgICAgIHByb2Nlc3NSdW5uaW5nKytcbiAgICAgIGRvIChzZWxlY3Rpb24pID0+XG4gICAgICAgIHN0ZGluID0gQGdldFN0ZGluKHNlbGVjdGlvbilcbiAgICAgICAgc3Rkb3V0ID0gKG91dHB1dCkgPT5cbiAgICAgICAgICBAc3Rkb3V0QnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgb3V0cHV0KVxuICAgICAgICBleGl0ID0gKGNvZGUpIC0+XG4gICAgICAgICAgcHJvY2Vzc0ZpbmlzaGVkKytcbiAgICAgICAgICByZXNvbHZlKCkgaWYgKHByb2Nlc3NSdW5uaW5nIGlzIHByb2Nlc3NGaW5pc2hlZClcbiAgICAgICAgQHJ1bkV4dGVybmFsQ29tbWFuZCB7Y29tbWFuZCwgYXJncywgc3Rkb3V0LCBleGl0LCBzdGRpbn1cblxuICBydW5FeHRlcm5hbENvbW1hbmQ6IChvcHRpb25zKSAtPlxuICAgIHN0ZGluID0gb3B0aW9ucy5zdGRpblxuICAgIGRlbGV0ZSBvcHRpb25zLnN0ZGluXG4gICAgYnVmZmVyZWRQcm9jZXNzID0gbmV3IEJ1ZmZlcmVkUHJvY2VzcyhvcHRpb25zKVxuICAgIGJ1ZmZlcmVkUHJvY2Vzcy5vbldpbGxUaHJvd0Vycm9yICh7ZXJyb3IsIGhhbmRsZX0pID0+XG4gICAgICAjIFN1cHByZXNzIGNvbW1hbmQgbm90IGZvdW5kIGVycm9yIGludGVudGlvbmFsbHkuXG4gICAgICBpZiBlcnJvci5jb2RlIGlzICdFTk9FTlQnIGFuZCBlcnJvci5zeXNjYWxsLmluZGV4T2YoJ3NwYXduJykgaXMgMFxuICAgICAgICBjb21tYW5kTmFtZSA9IEBjb25zdHJ1Y3Rvci5nZXRDb21tYW5kTmFtZSgpXG4gICAgICAgIGNvbnNvbGUubG9nIFwiI3tjb21tYW5kTmFtZX06IEZhaWxlZCB0byBzcGF3biBjb21tYW5kICN7ZXJyb3IucGF0aH0uXCJcbiAgICAgICAgaGFuZGxlKClcbiAgICAgIEBjYW5jZWxPcGVyYXRpb24oKVxuXG4gICAgaWYgc3RkaW5cbiAgICAgIGJ1ZmZlcmVkUHJvY2Vzcy5wcm9jZXNzLnN0ZGluLndyaXRlKHN0ZGluKVxuICAgICAgYnVmZmVyZWRQcm9jZXNzLnByb2Nlc3Muc3RkaW4uZW5kKClcblxuICBnZXROZXdUZXh0OiAodGV4dCwgc2VsZWN0aW9uKSAtPlxuICAgIEBnZXRTdGRvdXQoc2VsZWN0aW9uKSA/IHRleHRcblxuICAjIEZvciBlYXNpbHkgZXh0ZW5kIGJ5IHZtcCBwbHVnaW4uXG4gIGdldENvbW1hbmQ6IChzZWxlY3Rpb24pIC0+IHtAY29tbWFuZCwgQGFyZ3N9XG4gIGdldFN0ZGluOiAoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24uZ2V0VGV4dCgpXG4gIGdldFN0ZG91dDogKHNlbGVjdGlvbikgLT4gQHN0ZG91dEJ5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2VsZWN0TGlzdEl0ZW1zID0gbnVsbFxuY2xhc3MgVHJhbnNmb3JtU3RyaW5nQnlTZWxlY3RMaXN0IGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiSW50ZXJhY3RpdmVseSBjaG9vc2Ugc3RyaW5nIHRyYW5zZm9ybWF0aW9uIG9wZXJhdG9yIGZyb20gc2VsZWN0LWxpc3RcIlxuICByZXF1aXJlSW5wdXQ6IHRydWVcblxuICBnZXRJdGVtczogLT5cbiAgICBzZWxlY3RMaXN0SXRlbXMgPz0gdHJhbnNmb3JtZXJSZWdpc3RyeS5tYXAgKGtsYXNzKSAtPlxuICAgICAgaWYga2xhc3M6Omhhc093blByb3BlcnR5KCdkaXNwbGF5TmFtZScpXG4gICAgICAgIGRpc3BsYXlOYW1lID0ga2xhc3M6OmRpc3BsYXlOYW1lXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYXlOYW1lID0gXy5odW1hbml6ZUV2ZW50TmFtZShfLmRhc2hlcml6ZShrbGFzcy5uYW1lKSlcbiAgICAgIHtuYW1lOiBrbGFzcywgZGlzcGxheU5hbWV9XG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuXG4gICAgQHZpbVN0YXRlLm9uRGlkQ29uZmlybVNlbGVjdExpc3QgKHRyYW5zZm9ybWVyKSA9PlxuICAgICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICAgIHRhcmdldCA9IEB0YXJnZXQ/LmNvbnN0cnVjdG9yLm5hbWVcbiAgICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5ydW4odHJhbnNmb3JtZXIubmFtZSwge3RhcmdldH0pXG4gICAgQGZvY3VzU2VsZWN0TGlzdCh7aXRlbXM6IEBnZXRJdGVtcygpfSlcblxuICBleGVjdXRlOiAtPlxuICAgICMgTkVWRVIgYmUgZXhlY3V0ZWQgc2luY2Ugb3BlcmF0aW9uU3RhY2sgaXMgcmVwbGFjZWQgd2l0aCBzZWxlY3RlZCB0cmFuc2Zvcm1lclxuICAgIHRocm93IG5ldyBFcnJvcihcIiN7QGdldE5hbWUoKX0gc2hvdWxkIG5vdCBiZSBleGVjdXRlZFwiKVxuXG5jbGFzcyBUcmFuc2Zvcm1Xb3JkQnlTZWxlY3RMaXN0IGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nQnlTZWxlY3RMaXN0XG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiSW5uZXJXb3JkXCJcblxuY2xhc3MgVHJhbnNmb3JtU21hcnRXb3JkQnlTZWxlY3RMaXN0IGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nQnlTZWxlY3RMaXN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiVHJhbnNmb3JtIElubmVyU21hcnRXb3JkIGJ5IGB0cmFuc2Zvcm0tc3RyaW5nLWJ5LXNlbGVjdC1saXN0YFwiXG4gIHRhcmdldDogXCJJbm5lclNtYXJ0V29yZFwiXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgUmVwbGFjZVdpdGhSZWdpc3RlciBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlJlcGxhY2UgdGFyZ2V0IHdpdGggc3BlY2lmaWVkIHJlZ2lzdGVyIHZhbHVlXCJcbiAgaG92ZXI6IGljb246ICc6cmVwbGFjZS13aXRoLXJlZ2lzdGVyOicsIGVtb2ppOiAnOnBlbmNpbDonXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KClcblxuIyBTYXZlIHRleHQgdG8gcmVnaXN0ZXIgYmVmb3JlIHJlcGxhY2VcbmNsYXNzIFN3YXBXaXRoUmVnaXN0ZXIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTd2FwIHJlZ2lzdGVyIHZhbHVlIHdpdGggdGFyZ2V0XCJcbiAgZ2V0TmV3VGV4dDogKHRleHQsIHNlbGVjdGlvbikgLT5cbiAgICBuZXdUZXh0ID0gQHZpbVN0YXRlLnJlZ2lzdGVyLmdldFRleHQoKVxuICAgIEBzZXRUZXh0VG9SZWdpc3Rlcih0ZXh0LCBzZWxlY3Rpb24pXG4gICAgbmV3VGV4dFxuXG4jIEluZGVudCA8IFRyYW5zZm9ybVN0cmluZ1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBJbmRlbnQgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIGhvdmVyOiBpY29uOiAnOmluZGVudDonLCBlbW9qaTogJzpwb2ludF9yaWdodDonXG4gIHN0YXlPbkxpbmV3aXNlOiBmYWxzZVxuICB1c2VNYXJrZXJGb3JTdGF5OiB0cnVlXG4gIGNsaXBUb011dGF0aW9uRW5kT25TdGF5OiBmYWxzZVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgdW5sZXNzIEBuZWVkU3RheSgpXG4gICAgICBAb25EaWRSZXN0b3JlQ3Vyc29yUG9zaXRpb25zID0+XG4gICAgICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuICAgIHN1cGVyXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNlbGVjdGlvbi5pbmRlbnRTZWxlY3RlZFJvd3MoKVxuXG5jbGFzcyBPdXRkZW50IGV4dGVuZHMgSW5kZW50XG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzpvdXRkZW50OicsIGVtb2ppOiAnOnBvaW50X2xlZnQ6J1xuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgc2VsZWN0aW9uLm91dGRlbnRTZWxlY3RlZFJvd3MoKVxuXG5jbGFzcyBBdXRvSW5kZW50IGV4dGVuZHMgSW5kZW50XG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzphdXRvLWluZGVudDonLCBlbW9qaTogJzpvcGVuX2hhbmRzOidcbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNlbGVjdGlvbi5hdXRvSW5kZW50U2VsZWN0ZWRSb3dzKClcblxuY2xhc3MgVG9nZ2xlTGluZUNvbW1lbnRzIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzp0b2dnbGUtbGluZS1jb21tZW50czonLCBlbW9qaTogJzptdXRlOidcbiAgdXNlTWFya2VyRm9yU3RheTogdHJ1ZVxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgc2VsZWN0aW9uLnRvZ2dsZUxpbmVDb21tZW50cygpXG5cbiMgU3Vycm91bmQgPCBUcmFuc2Zvcm1TdHJpbmdcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU3Vycm91bmQgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTdXJyb3VuZCB0YXJnZXQgYnkgc3BlY2lmaWVkIGNoYXJhY3RlciBsaWtlIGAoYCwgYFtgLCBgXFxcImBcIlxuICBkaXNwbGF5TmFtZTogXCJTdXJyb3VuZCAoKVwiXG4gIGhvdmVyOiBpY29uOiAnOnN1cnJvdW5kOicsIGVtb2ppOiAnOnR3b193b21lbl9ob2xkaW5nX2hhbmRzOidcbiAgcGFpcnM6IFtcbiAgICBbJ1snLCAnXSddXG4gICAgWycoJywgJyknXVxuICAgIFsneycsICd9J11cbiAgICBbJzwnLCAnPiddXG4gIF1cbiAgaW5wdXQ6IG51bGxcbiAgY2hhcnNNYXg6IDFcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGF1dG9JbmRlbnQ6IGZhbHNlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuXG4gICAgcmV0dXJuIHVubGVzcyBAcmVxdWlyZUlucHV0XG4gICAgaWYgQHJlcXVpcmVUYXJnZXRcbiAgICAgIEBvbkRpZFNldFRhcmdldCA9PlxuICAgICAgICBAb25EaWRDb25maXJtSW5wdXQgKGlucHV0KSA9PiBAb25Db25maXJtKGlucHV0KVxuICAgICAgICBAb25EaWRDaGFuZ2VJbnB1dCAoaW5wdXQpID0+IEBhZGRIb3ZlcihpbnB1dClcbiAgICAgICAgQG9uRGlkQ2FuY2VsSW5wdXQgPT4gQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgICAgIEB2aW1TdGF0ZS5pbnB1dC5mb2N1cyhAY2hhcnNNYXgpXG4gICAgZWxzZVxuICAgICAgQG9uRGlkQ29uZmlybUlucHV0IChpbnB1dCkgPT4gQG9uQ29uZmlybShpbnB1dClcbiAgICAgIEBvbkRpZENoYW5nZUlucHV0IChpbnB1dCkgPT4gQGFkZEhvdmVyKGlucHV0KVxuICAgICAgQG9uRGlkQ2FuY2VsSW5wdXQgPT4gQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgICBAdmltU3RhdGUuaW5wdXQuZm9jdXMoQGNoYXJzTWF4KVxuXG4gIG9uQ29uZmlybTogKEBpbnB1dCkgLT5cbiAgICBAcHJvY2Vzc09wZXJhdGlvbigpXG5cbiAgZ2V0UGFpcjogKGNoYXIpIC0+XG4gICAgcGFpciA9IF8uZGV0ZWN0KEBwYWlycywgKHBhaXIpIC0+IGNoYXIgaW4gcGFpcilcbiAgICBwYWlyID89IFtjaGFyLCBjaGFyXVxuXG4gIHN1cnJvdW5kOiAodGV4dCwgY2hhciwgb3B0aW9ucz17fSkgLT5cbiAgICBrZWVwTGF5b3V0ID0gb3B0aW9ucy5rZWVwTGF5b3V0ID8gZmFsc2VcbiAgICBbb3BlbiwgY2xvc2VdID0gQGdldFBhaXIoY2hhcilcbiAgICBpZiAobm90IGtlZXBMYXlvdXQpIGFuZCBMaW5lRW5kaW5nUmVnRXhwLnRlc3QodGV4dClcbiAgICAgIEBhdXRvSW5kZW50ID0gdHJ1ZSAjIFtGSVhNRV1cbiAgICAgIG9wZW4gKz0gXCJcXG5cIlxuICAgICAgY2xvc2UgKz0gXCJcXG5cIlxuXG4gICAgaWYgY2hhciBpbiBzZXR0aW5ncy5nZXQoJ2NoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZCcpIGFuZCBpc1NpbmdsZUxpbmUodGV4dClcbiAgICAgIG9wZW4gKyAnICcgKyB0ZXh0ICsgJyAnICsgY2xvc2VcbiAgICBlbHNlXG4gICAgICBvcGVuICsgdGV4dCArIGNsb3NlXG5cbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgQHN1cnJvdW5kKHRleHQsIEBpbnB1dClcblxuY2xhc3MgU3Vycm91bmRXb3JkIGV4dGVuZHMgU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTdXJyb3VuZCAqKndvcmQqKlwiXG4gIHRhcmdldDogJ0lubmVyV29yZCdcblxuY2xhc3MgU3Vycm91bmRTbWFydFdvcmQgZXh0ZW5kcyBTdXJyb3VuZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlN1cnJvdW5kICoqc21hcnQtd29yZCoqXCJcbiAgdGFyZ2V0OiAnSW5uZXJTbWFydFdvcmQnXG5cbmNsYXNzIE1hcFN1cnJvdW5kIGV4dGVuZHMgU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTdXJyb3VuZCBlYWNoIHdvcmQoYC9cXHcrL2ApIHdpdGhpbiB0YXJnZXRcIlxuICBvY2N1cnJlbmNlOiB0cnVlXG4gIHBhdHRlcm5Gb3JPY2N1cnJlbmNlOiAvXFx3Ky9nXG5cbmNsYXNzIERlbGV0ZVN1cnJvdW5kIGV4dGVuZHMgU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJEZWxldGUgc3BlY2lmaWVkIHN1cnJvdW5kIGNoYXJhY3RlciBsaWtlIGAoYCwgYFtgLCBgXFxcImBcIlxuICBwYWlyQ2hhcnM6IFsnW10nLCAnKCknLCAne30nXS5qb2luKCcnKVxuICByZXF1aXJlVGFyZ2V0OiBmYWxzZVxuXG4gIG9uQ29uZmlybTogKEBpbnB1dCkgLT5cbiAgICAjIEZJWE1FOiBkb250IG1hbmFnZSBhbGxvd05leHRMaW5lIGluZGVwZW5kZW50bHkuIEVhY2ggUGFpciB0ZXh0LW9iamVjdCBjYW4gaGFuZGxlIGJ5IHRoZW1zZWx2cy5cbiAgICBAc2V0VGFyZ2V0IEBuZXcgJ1BhaXInLFxuICAgICAgcGFpcjogQGdldFBhaXIoQGlucHV0KVxuICAgICAgaW5uZXI6IGZhbHNlXG4gICAgICBhbGxvd05leHRMaW5lOiAoQGlucHV0IGluIEBwYWlyQ2hhcnMpXG4gICAgQHByb2Nlc3NPcGVyYXRpb24oKVxuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIFtvcGVuQ2hhciwgY2xvc2VDaGFyXSA9IFt0ZXh0WzBdLCBfLmxhc3QodGV4dCldXG4gICAgdGV4dCA9IHRleHRbMS4uLi0xXVxuICAgIGlmIGlzU2luZ2xlTGluZSh0ZXh0KVxuICAgICAgdGV4dCA9IHRleHQudHJpbSgpIGlmIG9wZW5DaGFyIGlzbnQgY2xvc2VDaGFyXG4gICAgdGV4dFxuXG5jbGFzcyBEZWxldGVTdXJyb3VuZEFueVBhaXIgZXh0ZW5kcyBEZWxldGVTdXJyb3VuZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSBzdXJyb3VuZCBjaGFyYWN0ZXIgYnkgYXV0by1kZXRlY3QgcGFpcmVkIGNoYXIgZnJvbSBjdXJzb3IgZW5jbG9zZWQgcGFpclwiXG4gIHJlcXVpcmVJbnB1dDogZmFsc2VcbiAgdGFyZ2V0OiAnQUFueVBhaXInXG5cbmNsYXNzIERlbGV0ZVN1cnJvdW5kQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIERlbGV0ZVN1cnJvdW5kQW55UGFpclxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkRlbGV0ZSBzdXJyb3VuZCBjaGFyYWN0ZXIgYnkgYXV0by1kZXRlY3QgcGFpcmVkIGNoYXIgZnJvbSBjdXJzb3IgZW5jbG9zZWQgcGFpciBhbmQgZm9yd2FyZGluZyBwYWlyIHdpdGhpbiBzYW1lIGxpbmVcIlxuICB0YXJnZXQ6ICdBQW55UGFpckFsbG93Rm9yd2FyZGluZydcblxuY2xhc3MgQ2hhbmdlU3Vycm91bmQgZXh0ZW5kcyBEZWxldGVTdXJyb3VuZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkNoYW5nZSBzdXJyb3VuZCBjaGFyYWN0ZXIsIHNwZWNpZnkgYm90aCBmcm9tIGFuZCB0byBwYWlyIGNoYXJcIlxuICBjaGFyc01heDogMlxuICBjaGFyOiBudWxsXG5cbiAgb25Db25maXJtOiAoaW5wdXQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBpbnB1dFxuICAgIFtmcm9tLCBAY2hhcl0gPSBpbnB1dC5zcGxpdCgnJylcbiAgICBzdXBlcihmcm9tKVxuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIGlubmVyVGV4dCA9IHN1cGVyICMgRGVsZXRlIHN1cnJvdW5kXG4gICAgQHN1cnJvdW5kKGlubmVyVGV4dCwgQGNoYXIsIGtlZXBMYXlvdXQ6IHRydWUpXG5cbmNsYXNzIENoYW5nZVN1cnJvdW5kQW55UGFpciBleHRlbmRzIENoYW5nZVN1cnJvdW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiQ2hhbmdlIHN1cnJvdW5kIGNoYXJhY3RlciwgZnJvbSBjaGFyIGlzIGF1dG8tZGV0ZWN0ZWRcIlxuICBjaGFyc01heDogMVxuICB0YXJnZXQ6IFwiQUFueVBhaXJcIlxuXG4gIGhpZ2hsaWdodFRhcmdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGlmIHJhbmdlID0gQHRhcmdldC5nZXRSYW5nZShzZWxlY3Rpb24pXG4gICAgICBtYXJrZXIgPSBAZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLXRhcmdldC1yYW5nZScpXG4gICAgICBtYXJrZXJcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBtYXJrZXIgPSBudWxsXG4gICAgQG9uRGlkU2V0VGFyZ2V0ID0+XG4gICAgICBpZiBtYXJrZXIgPSBAaGlnaGxpZ2h0VGFyZ2V0UmFuZ2UoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpXG4gICAgICAgIHRleHRSYW5nZSA9IFJhbmdlLmZyb21Qb2ludFdpdGhEZWx0YShtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydCwgMCwgMSlcbiAgICAgICAgY2hhciA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UodGV4dFJhbmdlKVxuICAgICAgICBAYWRkSG92ZXIoY2hhciwge30sIEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIGVsc2VcbiAgICAgICAgQHZpbVN0YXRlLmlucHV0LmNhbmNlbCgpXG4gICAgICAgIEBhYm9ydCgpXG5cbiAgICBAb25EaWRSZXNldE9wZXJhdGlvblN0YWNrIC0+XG4gICAgICBtYXJrZXI/LmRlc3Ryb3koKVxuICAgIHN1cGVyXG5cbiAgb25Db25maXJtOiAoQGNoYXIpIC0+XG4gICAgQGlucHV0ID0gQGNoYXJcbiAgICBAcHJvY2Vzc09wZXJhdGlvbigpXG5cbmNsYXNzIENoYW5nZVN1cnJvdW5kQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIENoYW5nZVN1cnJvdW5kQW55UGFpclxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkNoYW5nZSBzdXJyb3VuZCBjaGFyYWN0ZXIsIGZyb20gY2hhciBpcyBhdXRvLWRldGVjdGVkIGZyb20gZW5jbG9zZWQgYW5kIGZvcndhcmRpbmcgYXJlYVwiXG4gIHRhcmdldDogXCJBQW55UGFpckFsbG93Rm9yd2FyZGluZ1wiXG5cbiMgSm9pbiA8IFRyYW5zZm9ybVN0cmluZ1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEZJWE1FXG4jIEN1cnJlbnRseSBuYXRpdmUgZWRpdG9yLmpvaW5MaW5lcygpIGlzIGJldHRlciBmb3IgY3Vyc29yIHBvc2l0aW9uIHNldHRpbmdcbiMgU28gSSB1c2UgbmF0aXZlIG1ldGhvZHMgZm9yIGEgbWVhbndoaWxlLlxuY2xhc3MgSm9pbiBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiBcIk1vdmVUb1JlbGF0aXZlTGluZVwiXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICByZXN0b3JlUG9zaXRpb25zOiBmYWxzZVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBpZiBzd3JhcChzZWxlY3Rpb24pLmlzTGluZXdpc2UoKVxuICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlLnRyYW5zbGF0ZShbMCwgMF0sIFstMSwgSW5maW5pdHldKSlcbiAgICBzZWxlY3Rpb24uam9pbkxpbmVzKClcbiAgICBlbmQgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5lbmRcbiAgICBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGVuZC50cmFuc2xhdGUoWzAsIC0xXSkpXG5cbmNsYXNzIEpvaW5XaXRoS2VlcGluZ1NwYWNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBpbnB1dDogJydcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgdHJpbTogZmFsc2VcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAc2V0VGFyZ2V0IEBuZXcoXCJNb3ZlVG9SZWxhdGl2ZUxpbmVXaXRoTWluaW11bVwiLCB7bWluOiAxfSlcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBzd3JhcChzZWxlY3Rpb24pLmV4cGFuZE92ZXJMaW5lKClcbiAgICByb3dzID0gZm9yIHJvdyBpbiBbc3RhcnRSb3cuLmVuZFJvd11cbiAgICAgIHRleHQgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgICAgIGlmIEB0cmltIGFuZCByb3cgaXNudCBzdGFydFJvd1xuICAgICAgICB0ZXh0LnRyaW1MZWZ0KClcbiAgICAgIGVsc2VcbiAgICAgICAgdGV4dFxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0IEBqb2luKHJvd3MpICsgXCJcXG5cIlxuXG4gIGpvaW46IChyb3dzKSAtPlxuICAgIHJvd3Muam9pbihAaW5wdXQpXG5cbmNsYXNzIEpvaW5CeUlucHV0IGV4dGVuZHMgSm9pbldpdGhLZWVwaW5nU3BhY2VcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJUcmFuc2Zvcm0gbXVsdGktbGluZSB0byBzaW5nbGUtbGluZSBieSB3aXRoIHNwZWNpZmllZCBzZXBhcmF0b3IgY2hhcmFjdGVyXCJcbiAgaG92ZXI6IGljb246ICc6am9pbjonLCBlbW9qaTogJzpjb3VwbGU6J1xuICByZXF1aXJlSW5wdXQ6IHRydWVcbiAgaW5wdXQ6IG51bGxcbiAgdHJpbTogdHJ1ZVxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgY2hhcnNNYXggPSAxMFxuICAgIEBmb2N1c0lucHV0KGNoYXJzTWF4KVxuXG4gIGpvaW46IChyb3dzKSAtPlxuICAgIHJvd3Muam9pbihcIiAje0BpbnB1dH0gXCIpXG5cbmNsYXNzIEpvaW5CeUlucHV0V2l0aEtlZXBpbmdTcGFjZSBleHRlbmRzIEpvaW5CeUlucHV0XG4gIEBkZXNjcmlwdGlvbjogXCJKb2luIGxpbmVzIHdpdGhvdXQgcGFkZGluZyBzcGFjZSBiZXR3ZWVuIGVhY2ggbGluZVwiXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICB0cmltOiBmYWxzZVxuICBqb2luOiAocm93cykgLT5cbiAgICByb3dzLmpvaW4oQGlucHV0KVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU3RyaW5nIHN1ZmZpeCBpbiBuYW1lIGlzIHRvIGF2b2lkIGNvbmZ1c2lvbiB3aXRoICdzcGxpdCcgd2luZG93LlxuY2xhc3MgU3BsaXRTdHJpbmcgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTcGxpdCBzaW5nbGUtbGluZSBpbnRvIG11bHRpLWxpbmUgYnkgc3BsaXR0aW5nIHNwZWNpZmllZCBzZXBhcmF0b3IgY2hhcnNcIlxuICBob3ZlcjogaWNvbjogJzpzcGxpdC1zdHJpbmc6JywgZW1vamk6ICc6aG9jaG86J1xuICByZXF1aXJlSW5wdXQ6IHRydWVcbiAgaW5wdXQ6IG51bGxcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgdW5sZXNzIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAc2V0VGFyZ2V0IEBuZXcoXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIiwge21pbjogMX0pXG4gICAgY2hhcnNNYXggPSAxMFxuICAgIEBmb2N1c0lucHV0KGNoYXJzTWF4KVxuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIEBpbnB1dCA9IFwiXFxcXG5cIiBpZiBAaW5wdXQgaXMgJydcbiAgICByZWdleCA9IC8vLyN7Xy5lc2NhcGVSZWdFeHAoQGlucHV0KX0vLy9nXG4gICAgdGV4dC5zcGxpdChyZWdleCkuam9pbihcIlxcblwiKVxuXG5jbGFzcyBDaGFuZ2VPcmRlciBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKGZhbHNlKVxuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHRleHRGb3JSb3dzID0gc3dyYXAoc2VsZWN0aW9uKS5saW5lVGV4dEZvckJ1ZmZlclJvd3MoKVxuICAgIHJvd3MgPSBAZ2V0TmV3Um93cyh0ZXh0Rm9yUm93cylcbiAgICBuZXdUZXh0ID0gcm93cy5qb2luKFwiXFxuXCIpICsgXCJcXG5cIlxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KG5ld1RleHQpXG5cbmNsYXNzIFJldmVyc2UgZXh0ZW5kcyBDaGFuZ2VPcmRlclxuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcIlJldmVyc2UgbGluZXMoZS5nIHJldmVyc2Ugc2VsZWN0ZWQgdGhyZWUgbGluZSlcIlxuICBnZXROZXdSb3dzOiAocm93cykgLT5cbiAgICByb3dzLnJldmVyc2UoKVxuXG5jbGFzcyBTb3J0IGV4dGVuZHMgQ2hhbmdlT3JkZXJcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTb3J0IGxpbmVzIGFscGhhYmV0aWNhbGx5XCJcbiAgZ2V0TmV3Um93czogKHJvd3MpIC0+XG4gICAgcm93cy5zb3J0KClcbiJdfQ==
