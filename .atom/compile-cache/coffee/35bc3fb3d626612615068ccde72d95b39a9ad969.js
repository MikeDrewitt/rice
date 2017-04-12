(function() {
  var Disposable, Point, Range, WhiteSpaceRegExp, _, adjustRangeToRowRange, buildWordPatternByCursor, countChar, cursorIsAtEmptyRow, cursorIsAtEndOfLineAtNonEmptyRow, cursorIsAtFirstCharacter, cursorIsAtVimEndOfFile, cursorIsOnWhiteSpace, debug, destroyNonLastSelection, detectScopeStartPositionForScope, findIndexBy, fs, getAncestors, getBeginningOfWordBufferPosition, getBufferRangeForPatternFromPoint, getBufferRangeForRowRange, getBufferRows, getCharacterAtBufferPosition, getCharacterAtCursor, getCharacterForEvent, getCodeFoldRowRanges, getCodeFoldRowRangesContainesForRow, getCurrentWordBufferRangeAndKind, getEndOfLineForBufferRow, getEndOfWordBufferPosition, getEndPositionForPattern, getFirstCharacterBufferPositionForScreenRow, getFirstCharacterColumForBufferRow, getFirstCharacterPositionForBufferRow, getFirstVisibleScreenRow, getIndentLevelForBufferRow, getIndex, getKeyBindingForCommand, getKeystrokeForEvent, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getNonWordCharactersForCursor, getParagraphBoundaryRow, getParent, getRangeByTranslatePointAndClip, getScopesForTokenizedLine, getStartPositionForPattern, getTextInScreenRange, getTextToPoint, getTokenizedLineForRow, getValidVimBufferRow, getValidVimScreenRow, getVimEofBufferPosition, getVimEofScreenPosition, getVimLastBufferRow, getVimLastScreenRow, getVisibleBufferRange, getVisibleEditors, getWordBufferRangeAndKindAtBufferPosition, getWordBufferRangeAtBufferPosition, getWordPatternAtBufferPosition, haveSomeNonEmptySelection, highlightRange, highlightRanges, include, isAllWhiteSpace, isEmptyRow, isEndsWithNewLineForBufferRow, isFunctionScope, isIncludeFunctionScopeForRow, isLinewiseRange, isRangeContainsSomePoint, isSingleLine, keystrokeToCharCode, matchScopes, mergeIntersectingRanges, moveCursor, moveCursorDownBuffer, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpBuffer, moveCursorUpScreen, pointIsAtEndOfLine, pointIsAtVimEndOfFile, pointIsOnWhiteSpace, ref, registerElement, saveCursorPositions, saveEditorState, scanEditor, scanForScopeStart, scanInRanges, screenPositionIsAtWhiteSpace, settings, shouldPreventWrapLine, shrinkRangeEndToBeforeNewLine, smartScrollToBufferPosition, sortComparable, sortRanges, sortRangesByEndPosition, translatePointAndClip, trimRange, withVisibleBufferRange,
    slice = [].slice;

  fs = require('fs-plus');

  settings = require('./settings');

  ref = require('atom'), Disposable = ref.Disposable, Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  getParent = function(obj) {
    var ref1;
    return (ref1 = obj.__super__) != null ? ref1.constructor : void 0;
  };

  getAncestors = function(obj) {
    var ancestors, current;
    ancestors = [];
    current = obj;
    while (true) {
      ancestors.push(current);
      current = getParent(current);
      if (!current) {
        break;
      }
    }
    return ancestors;
  };

  getKeyBindingForCommand = function(command, arg) {
    var j, keymap, keymapPath, keymaps, keystrokes, len, packageName, results, selector;
    packageName = arg.packageName;
    results = null;
    keymaps = atom.keymaps.getKeyBindings();
    if (packageName != null) {
      keymapPath = atom.packages.getActivePackage(packageName).getKeymapPaths().pop();
      keymaps = keymaps.filter(function(arg1) {
        var source;
        source = arg1.source;
        return source === keymapPath;
      });
    }
    for (j = 0, len = keymaps.length; j < len; j++) {
      keymap = keymaps[j];
      if (!(keymap.command === command)) {
        continue;
      }
      keystrokes = keymap.keystrokes, selector = keymap.selector;
      keystrokes = keystrokes.replace(/shift-/, '');
      (results != null ? results : results = []).push({
        keystrokes: keystrokes,
        selector: selector
      });
    }
    return results;
  };

  include = function(klass, module) {
    var key, results1, value;
    results1 = [];
    for (key in module) {
      value = module[key];
      results1.push(klass.prototype[key] = value);
    }
    return results1;
  };

  debug = function() {
    var filePath, messages;
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (!settings.get('debug')) {
      return;
    }
    switch (settings.get('debugOutput')) {
      case 'console':
        return console.log.apply(console, messages);
      case 'file':
        filePath = fs.normalize(settings.get('debugOutputFilePath'));
        if (fs.existsSync(filePath)) {
          return fs.appendFileSync(filePath, messages + "\n");
        }
    }
  };

  saveEditorState = function(editor) {
    var editorElement, foldStartRows, scrollTop;
    editorElement = editor.element;
    scrollTop = editorElement.getScrollTop();
    foldStartRows = editor.displayLayer.findFoldMarkers({}).map(function(m) {
      return m.getStartPosition().row;
    });
    return function() {
      var j, len, ref1, row;
      ref1 = foldStartRows.reverse();
      for (j = 0, len = ref1.length; j < len; j++) {
        row = ref1[j];
        if (!editor.isFoldedAtBufferRow(row)) {
          editor.foldBufferRow(row);
        }
      }
      return editorElement.setScrollTop(scrollTop);
    };
  };

  saveCursorPositions = function(editor) {
    var cursor, j, len, points, ref1;
    points = new Map;
    ref1 = editor.getCursors();
    for (j = 0, len = ref1.length; j < len; j++) {
      cursor = ref1[j];
      points.set(cursor, cursor.getBufferPosition());
    }
    return function() {
      var k, len1, point, ref2, results1;
      ref2 = editor.getCursors();
      results1 = [];
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        cursor = ref2[k];
        if (!(points.has(cursor))) {
          continue;
        }
        point = points.get(cursor);
        results1.push(cursor.setBufferPosition(point));
      }
      return results1;
    };
  };

  getKeystrokeForEvent = function(event) {
    var keyboardEvent, ref1;
    keyboardEvent = (ref1 = event.originalEvent.originalEvent) != null ? ref1 : event.originalEvent;
    return atom.keymaps.keystrokeForKeyboardEvent(keyboardEvent);
  };

  keystrokeToCharCode = {
    backspace: 8,
    tab: 9,
    enter: 13,
    escape: 27,
    space: 32,
    "delete": 127
  };

  getCharacterForEvent = function(event) {
    var charCode, keystroke;
    keystroke = getKeystrokeForEvent(event);
    if (charCode = keystrokeToCharCode[keystroke]) {
      return String.fromCharCode(charCode);
    } else {
      return keystroke;
    }
  };

  isLinewiseRange = function(arg) {
    var end, ref1, start;
    start = arg.start, end = arg.end;
    return (start.row !== end.row) && ((start.column === (ref1 = end.column) && ref1 === 0));
  };

  isEndsWithNewLineForBufferRow = function(editor, row) {
    var end, ref1, start;
    ref1 = editor.bufferRangeForBufferRow(row, {
      includeNewline: true
    }), start = ref1.start, end = ref1.end;
    return (!start.isEqual(end)) && end.column === 0;
  };

  haveSomeNonEmptySelection = function(editor) {
    return editor.getSelections().some(function(selection) {
      return !selection.isEmpty();
    });
  };

  sortRanges = function(ranges) {
    return ranges.sort(function(a, b) {
      return a.compare(b);
    });
  };

  sortRangesByEndPosition = function(ranges, fn) {
    return ranges.sort(function(a, b) {
      return a.end.compare(b.end);
    });
  };

  getIndex = function(index, list) {
    var length;
    length = list.length;
    if (length === 0) {
      return -1;
    } else {
      index = index % length;
      if (index >= 0) {
        return index;
      } else {
        return length + index;
      }
    }
  };

  withVisibleBufferRange = function(editor, fn) {
    var disposable, range;
    if (range = getVisibleBufferRange(editor)) {
      return fn(range);
    } else {
      return disposable = editor.element.onDidAttach(function() {
        disposable.dispose();
        range = getVisibleBufferRange(editor);
        return fn(range);
      });
    }
  };

  getVisibleBufferRange = function(editor) {
    var endRow, ref1, startRow;
    ref1 = editor.element.getVisibleRowRange(), startRow = ref1[0], endRow = ref1[1];
    if (!((startRow != null) && (endRow != null))) {
      return null;
    }
    startRow = editor.bufferRowForScreenRow(startRow);
    endRow = editor.bufferRowForScreenRow(endRow);
    return new Range([startRow, 0], [endRow, 2e308]);
  };

  getVisibleEditors = function() {
    var editor, j, len, pane, ref1, results1;
    ref1 = atom.workspace.getPanes();
    results1 = [];
    for (j = 0, len = ref1.length; j < len; j++) {
      pane = ref1[j];
      if (editor = pane.getActiveEditor()) {
        results1.push(editor);
      }
    }
    return results1;
  };

  countChar = function(string, char) {
    return string.split(char).length - 1;
  };

  findIndexBy = function(list, fn) {
    var i, item, j, len;
    for (i = j = 0, len = list.length; j < len; i = ++j) {
      item = list[i];
      if (fn(item)) {
        return i;
      }
    }
    return null;
  };

  mergeIntersectingRanges = function(ranges) {
    var i, index, j, len, range, result;
    result = [];
    for (i = j = 0, len = ranges.length; j < len; i = ++j) {
      range = ranges[i];
      if (index = findIndexBy(result, function(r) {
        return r.intersectsWith(range);
      })) {
        result[index] = result[index].union(range);
      } else {
        result.push(range);
      }
    }
    return result;
  };

  getEndOfLineForBufferRow = function(editor, row) {
    return editor.bufferRangeForBufferRow(row).end;
  };

  pointIsAtEndOfLine = function(editor, point) {
    point = Point.fromObject(point);
    return getEndOfLineForBufferRow(editor, point.row).isEqual(point);
  };

  getCharacterAtCursor = function(cursor) {
    return getTextInScreenRange(cursor.editor, cursor.getScreenRange());
  };

  getCharacterAtBufferPosition = function(editor, startPosition) {
    var endPosition;
    endPosition = startPosition.translate([0, 1]);
    return editor.getTextInBufferRange([startPosition, endPosition]);
  };

  getTextInScreenRange = function(editor, screenRange) {
    var bufferRange;
    bufferRange = editor.bufferRangeForScreenRange(screenRange);
    return editor.getTextInBufferRange(bufferRange);
  };

  cursorIsOnWhiteSpace = function(cursor) {
    return isAllWhiteSpace(getCharacterAtCursor(cursor));
  };

  pointIsOnWhiteSpace = function(editor, point) {
    return isAllWhiteSpace(getCharacterAtBufferPosition(editor, point));
  };

  screenPositionIsAtWhiteSpace = function(editor, screenPosition) {
    var char, screenRange;
    screenRange = Range.fromPointWithDelta(screenPosition, 0, 1);
    char = getTextInScreenRange(editor, screenRange);
    return (char != null) && /\S/.test(char);
  };

  getNonWordCharactersForCursor = function(cursor) {
    var scope;
    if (cursor.getNonWordCharacters != null) {
      return cursor.getNonWordCharacters();
    } else {
      scope = cursor.getScopeDescriptor().getScopesArray();
      return atom.config.get('editor.nonWordCharacters', {
        scope: scope
      });
    }
  };

  moveCursorToNextNonWhitespace = function(cursor) {
    var originalPoint, vimEof;
    originalPoint = cursor.getBufferPosition();
    vimEof = getVimEofBufferPosition(cursor.editor);
    while (cursorIsOnWhiteSpace(cursor) && !cursor.getBufferPosition().isGreaterThanOrEqual(vimEof)) {
      cursor.moveRight();
    }
    return !originalPoint.isEqual(cursor.getBufferPosition());
  };

  getBufferRows = function(editor, arg) {
    var direction, j, k, ref1, ref2, results1, results2, startRow, vimLastBufferRow;
    startRow = arg.startRow, direction = arg.direction;
    switch (direction) {
      case 'previous':
        if (startRow <= 0) {
          return [];
        } else {
          return (function() {
            results1 = [];
            for (var j = ref1 = startRow - 1; ref1 <= 0 ? j <= 0 : j >= 0; ref1 <= 0 ? j++ : j--){ results1.push(j); }
            return results1;
          }).apply(this);
        }
        break;
      case 'next':
        vimLastBufferRow = getVimLastBufferRow(editor);
        if (startRow >= vimLastBufferRow) {
          return [];
        } else {
          return (function() {
            results2 = [];
            for (var k = ref2 = startRow + 1; ref2 <= vimLastBufferRow ? k <= vimLastBufferRow : k >= vimLastBufferRow; ref2 <= vimLastBufferRow ? k++ : k--){ results2.push(k); }
            return results2;
          }).apply(this);
        }
    }
  };

  getParagraphBoundaryRow = function(editor, startRow, direction, fn) {
    var isAtNonBlankRow, j, len, ref1, row, wasAtNonBlankRow;
    wasAtNonBlankRow = !editor.isBufferRowBlank(startRow);
    ref1 = getBufferRows(editor, {
      startRow: startRow,
      direction: direction
    });
    for (j = 0, len = ref1.length; j < len; j++) {
      row = ref1[j];
      isAtNonBlankRow = !editor.isBufferRowBlank(row);
      if (wasAtNonBlankRow !== isAtNonBlankRow) {
        if (fn != null) {
          if (typeof fn === "function" ? fn(isAtNonBlankRow) : void 0) {
            return row;
          }
        } else {
          return row;
        }
      }
      wasAtNonBlankRow = isAtNonBlankRow;
    }
  };

  getVimEofBufferPosition = function(editor) {
    var eof;
    eof = editor.getEofBufferPosition();
    if ((eof.row === 0) || (eof.column > 0)) {
      return eof;
    } else {
      return getEndOfLineForBufferRow(editor, eof.row - 1);
    }
  };

  getVimEofScreenPosition = function(editor) {
    return editor.screenPositionForBufferPosition(getVimEofBufferPosition(editor));
  };

  pointIsAtVimEndOfFile = function(editor, point) {
    return getVimEofBufferPosition(editor).isEqual(point);
  };

  cursorIsAtVimEndOfFile = function(cursor) {
    return pointIsAtVimEndOfFile(cursor.editor, cursor.getBufferPosition());
  };

  isEmptyRow = function(editor, row) {
    return editor.bufferRangeForBufferRow(row).isEmpty();
  };

  cursorIsAtEmptyRow = function(cursor) {
    return isEmptyRow(cursor.editor, cursor.getBufferRow());
  };

  cursorIsAtEndOfLineAtNonEmptyRow = function(cursor) {
    return cursor.isAtEndOfLine() && !cursor.isAtBeginningOfLine();
  };

  getVimLastBufferRow = function(editor) {
    return getVimEofBufferPosition(editor).row;
  };

  getVimLastScreenRow = function(editor) {
    return getVimEofScreenPosition(editor).row;
  };

  getFirstVisibleScreenRow = function(editor) {
    return editor.element.getFirstVisibleScreenRow();
  };

  getLastVisibleScreenRow = function(editor) {
    return editor.element.getLastVisibleScreenRow();
  };

  getFirstCharacterColumForBufferRow = function(editor, row) {
    var column, text;
    text = editor.lineTextForBufferRow(row);
    if ((column = text.search(/\S/)) >= 0) {
      return column;
    } else {
      return 0;
    }
  };

  trimRange = function(editor, scanRange) {
    var end, pattern, ref1, setEnd, setStart, start;
    pattern = /\S/;
    ref1 = [], start = ref1[0], end = ref1[1];
    setStart = function(arg) {
      var range;
      range = arg.range;
      return start = range.start, range;
    };
    editor.scanInBufferRange(pattern, scanRange, setStart);
    if (start != null) {
      setEnd = function(arg) {
        var range;
        range = arg.range;
        return end = range.end, range;
      };
      editor.backwardsScanInBufferRange(pattern, scanRange, setEnd);
      return new Range(start, end);
    } else {
      return scanRange;
    }
  };

  getFirstCharacterPositionForBufferRow = function(editor, row) {
    var from;
    from = [row, 0];
    return getEndPositionForPattern(editor, from, /\s*/, {
      containedOnly: true
    }) || from;
  };

  getFirstCharacterBufferPositionForScreenRow = function(editor, screenRow) {
    var end, point, scanRange, start;
    start = editor.clipScreenPosition([screenRow, 0], {
      skipSoftWrapIndentation: true
    });
    end = [screenRow, 2e308];
    scanRange = editor.bufferRangeForScreenRange([start, end]);
    point = null;
    editor.scanInBufferRange(/\S/, scanRange, function(arg) {
      var range, stop;
      range = arg.range, stop = arg.stop;
      point = range.start;
      return stop();
    });
    return point != null ? point : scanRange.start;
  };

  cursorIsAtFirstCharacter = function(cursor) {
    var column, editor, firstCharColumn;
    editor = cursor.editor;
    column = cursor.getBufferColumn();
    firstCharColumn = getFirstCharacterColumForBufferRow(editor, cursor.getBufferRow());
    return column === firstCharColumn;
  };

  moveCursor = function(cursor, arg, fn) {
    var goalColumn, preserveGoalColumn;
    preserveGoalColumn = arg.preserveGoalColumn;
    goalColumn = cursor.goalColumn;
    fn(cursor);
    if (preserveGoalColumn && (goalColumn != null)) {
      return cursor.goalColumn = goalColumn;
    }
  };

  shouldPreventWrapLine = function(cursor) {
    var column, ref1, row, tabLength, text;
    ref1 = cursor.getBufferPosition(), row = ref1.row, column = ref1.column;
    if (atom.config.get('editor.softTabs')) {
      tabLength = atom.config.get('editor.tabLength');
      if ((0 < column && column < tabLength)) {
        text = cursor.editor.getTextInBufferRange([[row, 0], [row, tabLength]]);
        return /^\s+$/.test(text);
      } else {
        return false;
      }
    }
  };

  moveCursorLeft = function(cursor, options) {
    var allowWrap, motion, needSpecialCareToPreventWrapLine;
    if (options == null) {
      options = {};
    }
    allowWrap = options.allowWrap, needSpecialCareToPreventWrapLine = options.needSpecialCareToPreventWrapLine;
    delete options.allowWrap;
    if (needSpecialCareToPreventWrapLine) {
      if (shouldPreventWrapLine(cursor)) {
        return;
      }
    }
    if (!cursor.isAtBeginningOfLine() || allowWrap) {
      motion = function(cursor) {
        return cursor.moveLeft();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorRight = function(cursor, options) {
    var allowWrap, motion;
    if (options == null) {
      options = {};
    }
    allowWrap = options.allowWrap;
    delete options.allowWrap;
    if (!cursor.isAtEndOfLine() || allowWrap) {
      motion = function(cursor) {
        return cursor.moveRight();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorUpScreen = function(cursor, options) {
    var motion;
    if (options == null) {
      options = {};
    }
    if (cursor.getScreenRow() !== 0) {
      motion = function(cursor) {
        return cursor.moveUp();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorDownScreen = function(cursor, options) {
    var motion;
    if (options == null) {
      options = {};
    }
    if (getVimLastScreenRow(cursor.editor) !== cursor.getScreenRow()) {
      motion = function(cursor) {
        return cursor.moveDown();
      };
      return moveCursor(cursor, options, motion);
    }
  };

  moveCursorDownBuffer = function(cursor) {
    var point;
    point = cursor.getBufferPosition();
    if (getVimLastBufferRow(cursor.editor) !== point.row) {
      return cursor.setBufferPosition(point.translate([+1, 0]));
    }
  };

  moveCursorUpBuffer = function(cursor) {
    var point;
    point = cursor.getBufferPosition();
    if (point.row !== 0) {
      return cursor.setBufferPosition(point.translate([-1, 0]));
    }
  };

  moveCursorToFirstCharacterAtRow = function(cursor, row) {
    cursor.setBufferPosition([row, 0]);
    return cursor.moveToFirstCharacterOfLine();
  };

  highlightRanges = function(editor, ranges, options) {
    var decorateOptions, destroyMarkers, invalidate, j, len, marker, markers, range, ref1, timeout;
    if (!_.isArray(ranges)) {
      ranges = [ranges];
    }
    if (!ranges.length) {
      return null;
    }
    invalidate = (ref1 = options.invalidate) != null ? ref1 : 'never';
    markers = (function() {
      var j, len, results1;
      results1 = [];
      for (j = 0, len = ranges.length; j < len; j++) {
        range = ranges[j];
        results1.push(editor.markBufferRange(range, {
          invalidate: invalidate
        }));
      }
      return results1;
    })();
    decorateOptions = {
      type: 'highlight',
      "class": options["class"]
    };
    for (j = 0, len = markers.length; j < len; j++) {
      marker = markers[j];
      editor.decorateMarker(marker, decorateOptions);
    }
    timeout = options.timeout;
    if (timeout != null) {
      destroyMarkers = function() {
        return _.invoke(markers, 'destroy');
      };
      setTimeout(destroyMarkers, timeout);
    }
    return markers;
  };

  highlightRange = function(editor, range, options) {
    return highlightRanges(editor, [range], options)[0];
  };

  getValidVimBufferRow = function(editor, row) {
    var vimLastBufferRow;
    vimLastBufferRow = getVimLastBufferRow(editor);
    switch (false) {
      case !(row < 0):
        return 0;
      case !(row > vimLastBufferRow):
        return vimLastBufferRow;
      default:
        return row;
    }
  };

  getValidVimScreenRow = function(editor, row) {
    var vimLastScreenRow;
    vimLastScreenRow = getVimLastScreenRow(editor);
    switch (false) {
      case !(row < 0):
        return 0;
      case !(row > vimLastScreenRow):
        return vimLastScreenRow;
      default:
        return row;
    }
  };

  getTextToPoint = function(editor, arg, arg1) {
    var column, exclusive, row;
    row = arg.row, column = arg.column;
    exclusive = (arg1 != null ? arg1 : {}).exclusive;
    if (exclusive == null) {
      exclusive = true;
    }
    if (exclusive) {
      return editor.lineTextForBufferRow(row).slice(0, column);
    } else {
      return editor.lineTextForBufferRow(row).slice(0, +column + 1 || 9e9);
    }
  };

  getIndentLevelForBufferRow = function(editor, row) {
    var text;
    text = editor.lineTextForBufferRow(row);
    return editor.indentLevelForLine(text);
  };

  WhiteSpaceRegExp = /^\s*$/;

  isAllWhiteSpace = function(text) {
    return WhiteSpaceRegExp.test(text);
  };

  getCodeFoldRowRanges = function(editor) {
    var j, ref1, results1;
    return (function() {
      results1 = [];
      for (var j = 0, ref1 = editor.getLastBufferRow(); 0 <= ref1 ? j <= ref1 : j >= ref1; 0 <= ref1 ? j++ : j--){ results1.push(j); }
      return results1;
    }).apply(this).map(function(row) {
      return editor.languageMode.rowRangeForCodeFoldAtBufferRow(row);
    }).filter(function(rowRange) {
      return (rowRange != null) && (rowRange[0] != null) && (rowRange[1] != null);
    });
  };

  getCodeFoldRowRangesContainesForRow = function(editor, bufferRow, arg) {
    var includeStartRow;
    includeStartRow = (arg != null ? arg : {}).includeStartRow;
    if (includeStartRow == null) {
      includeStartRow = true;
    }
    return getCodeFoldRowRanges(editor).filter(function(arg1) {
      var endRow, startRow;
      startRow = arg1[0], endRow = arg1[1];
      if (includeStartRow) {
        return (startRow <= bufferRow && bufferRow <= endRow);
      } else {
        return (startRow < bufferRow && bufferRow <= endRow);
      }
    });
  };

  getBufferRangeForRowRange = function(editor, rowRange) {
    var endRange, ref1, startRange;
    ref1 = rowRange.map(function(row) {
      return editor.bufferRangeForBufferRow(row, {
        includeNewline: true
      });
    }), startRange = ref1[0], endRange = ref1[1];
    return startRange.union(endRange);
  };

  getTokenizedLineForRow = function(editor, row) {
    return editor.tokenizedBuffer.tokenizedLineForRow(row);
  };

  getScopesForTokenizedLine = function(line) {
    var j, len, ref1, results1, tag;
    ref1 = line.tags;
    results1 = [];
    for (j = 0, len = ref1.length; j < len; j++) {
      tag = ref1[j];
      if (tag < 0 && (tag % 2 === -1)) {
        results1.push(atom.grammars.scopeForId(tag));
      }
    }
    return results1;
  };

  scanForScopeStart = function(editor, fromPoint, direction, fn) {
    var column, continueScan, isValidToken, j, k, l, len, len1, len2, position, ref1, result, results, row, scanRows, scope, stop, tag, tokenIterator, tokenizedLine;
    fromPoint = Point.fromObject(fromPoint);
    scanRows = (function() {
      var j, k, ref1, ref2, ref3, results1, results2;
      switch (direction) {
        case 'forward':
          return (function() {
            results1 = [];
            for (var j = ref1 = fromPoint.row, ref2 = editor.getLastBufferRow(); ref1 <= ref2 ? j <= ref2 : j >= ref2; ref1 <= ref2 ? j++ : j--){ results1.push(j); }
            return results1;
          }).apply(this);
        case 'backward':
          return (function() {
            results2 = [];
            for (var k = ref3 = fromPoint.row; ref3 <= 0 ? k <= 0 : k >= 0; ref3 <= 0 ? k++ : k--){ results2.push(k); }
            return results2;
          }).apply(this);
      }
    })();
    continueScan = true;
    stop = function() {
      return continueScan = false;
    };
    isValidToken = (function() {
      switch (direction) {
        case 'forward':
          return function(arg) {
            var position;
            position = arg.position;
            return position.isGreaterThan(fromPoint);
          };
        case 'backward':
          return function(arg) {
            var position;
            position = arg.position;
            return position.isLessThan(fromPoint);
          };
      }
    })();
    for (j = 0, len = scanRows.length; j < len; j++) {
      row = scanRows[j];
      if (!(tokenizedLine = getTokenizedLineForRow(editor, row))) {
        continue;
      }
      column = 0;
      results = [];
      tokenIterator = tokenizedLine.getTokenIterator();
      ref1 = tokenizedLine.tags;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        tag = ref1[k];
        tokenIterator.next();
        if (tag < 0) {
          scope = atom.grammars.scopeForId(tag);
          if ((tag % 2) === 0) {
            null;
          } else {
            position = new Point(row, column);
            results.push({
              scope: scope,
              position: position,
              stop: stop
            });
          }
        } else {
          column += tag;
        }
      }
      results = results.filter(isValidToken);
      if (direction === 'backward') {
        results.reverse();
      }
      for (l = 0, len2 = results.length; l < len2; l++) {
        result = results[l];
        fn(result);
        if (!continueScan) {
          return;
        }
      }
      if (!continueScan) {
        return;
      }
    }
  };

  detectScopeStartPositionForScope = function(editor, fromPoint, direction, scope) {
    var point;
    point = null;
    scanForScopeStart(editor, fromPoint, direction, function(info) {
      if (info.scope.search(scope) >= 0) {
        info.stop();
        return point = info.position;
      }
    });
    return point;
  };

  isIncludeFunctionScopeForRow = function(editor, row) {
    var tokenizedLine;
    if (tokenizedLine = getTokenizedLineForRow(editor, row)) {
      return getScopesForTokenizedLine(tokenizedLine).some(function(scope) {
        return isFunctionScope(editor, scope);
      });
    } else {
      return false;
    }
  };

  isFunctionScope = function(editor, scope) {
    var scopeName;
    scopeName = editor.getGrammar().scopeName;
    switch (scopeName) {
      case 'source.go':
        return /^entity\.name\.function/.test(scope);
      default:
        return /^meta\.function\./.test(scope);
    }
  };

  getStartPositionForPattern = function(editor, from, pattern, options) {
    var containedOnly, point, ref1, scanRange;
    if (options == null) {
      options = {};
    }
    from = Point.fromObject(from);
    containedOnly = (ref1 = options.containedOnly) != null ? ref1 : false;
    scanRange = [[from.row, 0], from];
    point = null;
    editor.backwardsScanInBufferRange(pattern, scanRange, function(arg) {
      var matchText, range, stop;
      range = arg.range, matchText = arg.matchText, stop = arg.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if ((!containedOnly) || range.end.isGreaterThanOrEqual(from)) {
        point = range.start;
        return stop();
      }
    });
    return point;
  };

  getEndPositionForPattern = function(editor, from, pattern, options) {
    var containedOnly, point, ref1, scanRange;
    if (options == null) {
      options = {};
    }
    from = Point.fromObject(from);
    containedOnly = (ref1 = options.containedOnly) != null ? ref1 : false;
    scanRange = [from, [from.row, 2e308]];
    point = null;
    editor.scanInBufferRange(pattern, scanRange, function(arg) {
      var matchText, range, stop;
      range = arg.range, matchText = arg.matchText, stop = arg.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if ((!containedOnly) || range.start.isLessThanOrEqual(from)) {
        point = range.end;
        return stop();
      }
    });
    return point;
  };

  getBufferRangeForPatternFromPoint = function(editor, fromPoint, pattern) {
    var end, start;
    end = getEndPositionForPattern(editor, fromPoint, pattern, {
      containedOnly: true
    });
    if (end != null) {
      start = getStartPositionForPattern(editor, end, pattern, {
        containedOnly: true
      });
    }
    if (start != null) {
      return new Range(start, end);
    }
  };

  sortComparable = function(collection) {
    return collection.sort(function(a, b) {
      return a.compare(b);
    });
  };

  smartScrollToBufferPosition = function(editor, point) {
    var center, editorAreaHeight, editorElement, onePageDown, onePageUp, target;
    editorElement = editor.element;
    editorAreaHeight = editor.getLineHeightInPixels() * (editor.getRowsPerPage() - 1);
    onePageUp = editorElement.getScrollTop() - editorAreaHeight;
    onePageDown = editorElement.getScrollBottom() + editorAreaHeight;
    target = editorElement.pixelPositionForBufferPosition(point).top;
    center = (onePageDown < target) || (target < onePageUp);
    return editor.scrollToBufferPosition(point, {
      center: center
    });
  };

  matchScopes = function(editorElement, scopes) {
    var className, classNames, classes, containsCount, j, k, len, len1;
    classes = scopes.map(function(scope) {
      return scope.split('.');
    });
    for (j = 0, len = classes.length; j < len; j++) {
      classNames = classes[j];
      containsCount = 0;
      for (k = 0, len1 = classNames.length; k < len1; k++) {
        className = classNames[k];
        if (editorElement.classList.contains(className)) {
          containsCount += 1;
        }
      }
      if (containsCount === classNames.length) {
        return true;
      }
    }
    return false;
  };

  isSingleLine = function(text) {
    return text.split(/\n|\r\n/).length === 1;
  };

  getWordBufferRangeAndKindAtBufferPosition = function(editor, point, options) {
    var characterAtPoint, cursor, kind, nonWordCharacters, nonWordRegex, range, ref1, singleNonWordChar, source, wordRegex;
    if (options == null) {
      options = {};
    }
    singleNonWordChar = options.singleNonWordChar, wordRegex = options.wordRegex, nonWordCharacters = options.nonWordCharacters, cursor = options.cursor;
    if ((wordRegex == null) && (nonWordCharacters == null)) {
      if (cursor == null) {
        cursor = editor.getLastCursor();
      }
      ref1 = _.extend(options, buildWordPatternByCursor(cursor, options)), wordRegex = ref1.wordRegex, nonWordCharacters = ref1.nonWordCharacters;
    }
    if (singleNonWordChar == null) {
      singleNonWordChar = false;
    }
    characterAtPoint = getCharacterAtBufferPosition(editor, point);
    nonWordRegex = new RegExp("[" + (_.escapeRegExp(nonWordCharacters)) + "]+");
    if (/\s/.test(characterAtPoint)) {
      source = "[\t ]+";
      kind = 'white-space';
      wordRegex = new RegExp(source);
    } else if (nonWordRegex.test(characterAtPoint) && !wordRegex.test(characterAtPoint)) {
      kind = 'non-word';
      if (singleNonWordChar) {
        source = _.escapeRegExp(characterAtPoint);
        wordRegex = new RegExp(source);
      } else {
        wordRegex = nonWordRegex;
      }
    } else {
      kind = 'word';
    }
    range = getWordBufferRangeAtBufferPosition(editor, point, {
      wordRegex: wordRegex
    });
    return {
      kind: kind,
      range: range
    };
  };

  getWordPatternAtBufferPosition = function(editor, point, options) {
    var kind, pattern, range, ref1;
    if (options == null) {
      options = {};
    }
    ref1 = getWordBufferRangeAndKindAtBufferPosition(editor, point, options), range = ref1.range, kind = ref1.kind;
    pattern = _.escapeRegExp(editor.getTextInBufferRange(range));
    if (kind === 'word') {
      pattern = "\\b" + pattern + "\\b";
    }
    return new RegExp(pattern, 'g');
  };

  buildWordPatternByCursor = function(cursor, arg) {
    var nonWordCharacters, wordRegex;
    wordRegex = arg.wordRegex;
    nonWordCharacters = getNonWordCharactersForCursor(cursor);
    if (wordRegex == null) {
      wordRegex = new RegExp("^[\t ]*$|[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+");
    }
    return {
      wordRegex: wordRegex,
      nonWordCharacters: nonWordCharacters
    };
  };

  getCurrentWordBufferRangeAndKind = function(cursor, options) {
    if (options == null) {
      options = {};
    }
    return getWordBufferRangeAndKindAtBufferPosition(cursor.editor, cursor.getBufferPosition(), options);
  };

  getBeginningOfWordBufferPosition = function(editor, point, arg) {
    var found, scanRange, wordRegex;
    wordRegex = (arg != null ? arg : {}).wordRegex;
    scanRange = [[point.row, 0], point];
    found = null;
    editor.backwardsScanInBufferRange(wordRegex, scanRange, function(arg1) {
      var matchText, range, stop;
      range = arg1.range, matchText = arg1.matchText, stop = arg1.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if (range.start.isLessThan(point)) {
        if (range.end.isGreaterThanOrEqual(point)) {
          found = range.start;
        }
        return stop();
      }
    });
    return found != null ? found : point;
  };

  getEndOfWordBufferPosition = function(editor, point, arg) {
    var found, scanRange, wordRegex;
    wordRegex = (arg != null ? arg : {}).wordRegex;
    scanRange = [point, [point.row, 2e308]];
    found = null;
    editor.scanInBufferRange(wordRegex, scanRange, function(arg1) {
      var matchText, range, stop;
      range = arg1.range, matchText = arg1.matchText, stop = arg1.stop;
      if (matchText === '' && range.start.column !== 0) {
        return;
      }
      if (range.end.isGreaterThan(point)) {
        if (range.start.isLessThanOrEqual(point)) {
          found = range.end;
        }
        return stop();
      }
    });
    return found != null ? found : point;
  };

  getWordBufferRangeAtBufferPosition = function(editor, position, options) {
    var endPosition, startPosition;
    if (options == null) {
      options = {};
    }
    startPosition = getBeginningOfWordBufferPosition(editor, position, options);
    endPosition = getEndOfWordBufferPosition(editor, startPosition, options);
    return new Range(startPosition, endPosition);
  };

  adjustRangeToRowRange = function(arg, options) {
    var end, endRow, ref1, start;
    start = arg.start, end = arg.end;
    if (options == null) {
      options = {};
    }
    endRow = end.row;
    if (end.column === 0) {
      endRow = Math.max(start.row, end.row - 1);
    }
    if ((ref1 = options.endOnly) != null ? ref1 : false) {
      return new Range(start, [endRow, 2e308]);
    } else {
      return new Range([start.row, 0], [endRow, 2e308]);
    }
  };

  shrinkRangeEndToBeforeNewLine = function(range) {
    var end, endRow, start;
    start = range.start, end = range.end;
    if (end.column === 0) {
      endRow = Math.max(start.row, end.row - 1);
      return new Range(start, [endRow, 2e308]);
    } else {
      return range;
    }
  };

  scanInRanges = function(editor, pattern, scanRanges, arg) {
    var exclusiveIntersects, i, includeIntersects, isIntersects, j, len, originalScanRanges, ranges, ref1, scanRange;
    ref1 = arg != null ? arg : {}, includeIntersects = ref1.includeIntersects, exclusiveIntersects = ref1.exclusiveIntersects;
    if (includeIntersects) {
      originalScanRanges = scanRanges.slice();
      scanRanges = scanRanges.map(adjustRangeToRowRange);
      isIntersects = function(arg1) {
        var range, scanRange;
        range = arg1.range, scanRange = arg1.scanRange;
        return scanRange.intersectsWith(range, exclusiveIntersects);
      };
    }
    ranges = [];
    for (i = j = 0, len = scanRanges.length; j < len; i = ++j) {
      scanRange = scanRanges[i];
      editor.scanInBufferRange(pattern, scanRange, function(arg1) {
        var range;
        range = arg1.range;
        if (includeIntersects) {
          if (isIntersects({
            range: range,
            scanRange: originalScanRanges[i]
          })) {
            return ranges.push(range);
          }
        } else {
          return ranges.push(range);
        }
      });
    }
    return ranges;
  };

  scanEditor = function(editor, pattern) {
    var ranges;
    ranges = [];
    editor.scan(pattern, function(arg) {
      var range;
      range = arg.range;
      return ranges.push(range);
    });
    return ranges;
  };

  isRangeContainsSomePoint = function(range, points, arg) {
    var exclusive;
    exclusive = (arg != null ? arg : {}).exclusive;
    if (exclusive == null) {
      exclusive = false;
    }
    return points.some(function(point) {
      return range.containsPoint(point, exclusive);
    });
  };

  destroyNonLastSelection = function(editor) {
    var j, len, ref1, results1, selection;
    ref1 = editor.getSelections();
    results1 = [];
    for (j = 0, len = ref1.length; j < len; j++) {
      selection = ref1[j];
      if (!selection.isLastSelection()) {
        results1.push(selection.destroy());
      }
    }
    return results1;
  };

  getLargestFoldRangeContainsBufferRow = function(editor, row) {
    var end, endPoint, j, len, marker, markers, ref1, ref2, start, startPoint;
    markers = editor.displayLayer.findFoldMarkers({
      intersectsRow: row
    });
    startPoint = null;
    endPoint = null;
    ref1 = markers != null ? markers : [];
    for (j = 0, len = ref1.length; j < len; j++) {
      marker = ref1[j];
      ref2 = marker.getRange(), start = ref2.start, end = ref2.end;
      if (!startPoint) {
        startPoint = start;
        endPoint = end;
        continue;
      }
      if (start.isLessThan(startPoint)) {
        startPoint = start;
        endPoint = end;
      }
    }
    if ((startPoint != null) && (endPoint != null)) {
      return new Range(startPoint, endPoint);
    }
  };

  translatePointAndClip = function(editor, point, direction, arg) {
    var dontClip, eol, newRow, screenPoint, translate;
    translate = (arg != null ? arg : {}).translate;
    if (translate == null) {
      translate = true;
    }
    point = Point.fromObject(point);
    dontClip = false;
    switch (direction) {
      case 'forward':
        if (translate) {
          point = point.translate([0, +1]);
        }
        eol = editor.bufferRangeForBufferRow(point.row).end;
        if (point.isEqual(eol)) {
          dontClip = true;
        }
        if (point.isGreaterThan(eol)) {
          point = new Point(point.row + 1, 0);
          dontClip = true;
        }
        point = Point.min(point, editor.getEofBufferPosition());
        break;
      case 'backward':
        if (translate) {
          point = point.translate([0, -1]);
        }
        if (point.column < 0) {
          newRow = point.row - 1;
          eol = editor.bufferRangeForBufferRow(newRow).end;
          point = new Point(newRow, eol.column);
        }
        point = Point.max(point, Point.ZERO);
    }
    if (dontClip) {
      return point;
    } else {
      screenPoint = editor.screenPositionForBufferPosition(point, {
        clipDirection: direction
      });
      return editor.bufferPositionForScreenPosition(screenPoint);
    }
  };

  getRangeByTranslatePointAndClip = function(editor, range, which, direction, options) {
    var newPoint;
    newPoint = translatePointAndClip(editor, range[which], direction, options);
    switch (which) {
      case 'start':
        return new Range(newPoint, range.end);
      case 'end':
        return new Range(range.start, newPoint);
    }
  };

  registerElement = function(name, options) {
    var Element, element;
    element = document.createElement(name);
    if (element.constructor === HTMLElement) {
      Element = document.registerElement(name, options);
    } else {
      Element = element.constructor;
      if (options.prototype != null) {
        Element.prototype = options.prototype;
      }
    }
    return Element;
  };

  module.exports = {
    getParent: getParent,
    getAncestors: getAncestors,
    getKeyBindingForCommand: getKeyBindingForCommand,
    include: include,
    debug: debug,
    saveEditorState: saveEditorState,
    saveCursorPositions: saveCursorPositions,
    getKeystrokeForEvent: getKeystrokeForEvent,
    getCharacterForEvent: getCharacterForEvent,
    isLinewiseRange: isLinewiseRange,
    isEndsWithNewLineForBufferRow: isEndsWithNewLineForBufferRow,
    haveSomeNonEmptySelection: haveSomeNonEmptySelection,
    sortRanges: sortRanges,
    sortRangesByEndPosition: sortRangesByEndPosition,
    getIndex: getIndex,
    getVisibleBufferRange: getVisibleBufferRange,
    withVisibleBufferRange: withVisibleBufferRange,
    getVisibleEditors: getVisibleEditors,
    findIndexBy: findIndexBy,
    mergeIntersectingRanges: mergeIntersectingRanges,
    pointIsAtEndOfLine: pointIsAtEndOfLine,
    pointIsAtVimEndOfFile: pointIsAtVimEndOfFile,
    cursorIsAtVimEndOfFile: cursorIsAtVimEndOfFile,
    getVimEofBufferPosition: getVimEofBufferPosition,
    getVimEofScreenPosition: getVimEofScreenPosition,
    getVimLastBufferRow: getVimLastBufferRow,
    getVimLastScreenRow: getVimLastScreenRow,
    moveCursorLeft: moveCursorLeft,
    moveCursorRight: moveCursorRight,
    moveCursorUpScreen: moveCursorUpScreen,
    moveCursorDownScreen: moveCursorDownScreen,
    getEndOfLineForBufferRow: getEndOfLineForBufferRow,
    getFirstVisibleScreenRow: getFirstVisibleScreenRow,
    getLastVisibleScreenRow: getLastVisibleScreenRow,
    highlightRanges: highlightRanges,
    highlightRange: highlightRange,
    getValidVimBufferRow: getValidVimBufferRow,
    getValidVimScreenRow: getValidVimScreenRow,
    moveCursorToFirstCharacterAtRow: moveCursorToFirstCharacterAtRow,
    countChar: countChar,
    getTextToPoint: getTextToPoint,
    getIndentLevelForBufferRow: getIndentLevelForBufferRow,
    isAllWhiteSpace: isAllWhiteSpace,
    getCharacterAtCursor: getCharacterAtCursor,
    getTextInScreenRange: getTextInScreenRange,
    cursorIsOnWhiteSpace: cursorIsOnWhiteSpace,
    screenPositionIsAtWhiteSpace: screenPositionIsAtWhiteSpace,
    moveCursorToNextNonWhitespace: moveCursorToNextNonWhitespace,
    isEmptyRow: isEmptyRow,
    cursorIsAtEmptyRow: cursorIsAtEmptyRow,
    cursorIsAtEndOfLineAtNonEmptyRow: cursorIsAtEndOfLineAtNonEmptyRow,
    getCodeFoldRowRanges: getCodeFoldRowRanges,
    getCodeFoldRowRangesContainesForRow: getCodeFoldRowRangesContainesForRow,
    getBufferRangeForRowRange: getBufferRangeForRowRange,
    getFirstCharacterColumForBufferRow: getFirstCharacterColumForBufferRow,
    trimRange: trimRange,
    getFirstCharacterPositionForBufferRow: getFirstCharacterPositionForBufferRow,
    getFirstCharacterBufferPositionForScreenRow: getFirstCharacterBufferPositionForScreenRow,
    cursorIsAtFirstCharacter: cursorIsAtFirstCharacter,
    isFunctionScope: isFunctionScope,
    getStartPositionForPattern: getStartPositionForPattern,
    getEndPositionForPattern: getEndPositionForPattern,
    isIncludeFunctionScopeForRow: isIncludeFunctionScopeForRow,
    getTokenizedLineForRow: getTokenizedLineForRow,
    getScopesForTokenizedLine: getScopesForTokenizedLine,
    scanForScopeStart: scanForScopeStart,
    detectScopeStartPositionForScope: detectScopeStartPositionForScope,
    getBufferRows: getBufferRows,
    getParagraphBoundaryRow: getParagraphBoundaryRow,
    registerElement: registerElement,
    getBufferRangeForPatternFromPoint: getBufferRangeForPatternFromPoint,
    sortComparable: sortComparable,
    smartScrollToBufferPosition: smartScrollToBufferPosition,
    matchScopes: matchScopes,
    moveCursorDownBuffer: moveCursorDownBuffer,
    moveCursorUpBuffer: moveCursorUpBuffer,
    isSingleLine: isSingleLine,
    getCurrentWordBufferRangeAndKind: getCurrentWordBufferRangeAndKind,
    buildWordPatternByCursor: buildWordPatternByCursor,
    getWordBufferRangeAtBufferPosition: getWordBufferRangeAtBufferPosition,
    getWordBufferRangeAndKindAtBufferPosition: getWordBufferRangeAndKindAtBufferPosition,
    getWordPatternAtBufferPosition: getWordPatternAtBufferPosition,
    getNonWordCharactersForCursor: getNonWordCharactersForCursor,
    adjustRangeToRowRange: adjustRangeToRowRange,
    shrinkRangeEndToBeforeNewLine: shrinkRangeEndToBeforeNewLine,
    scanInRanges: scanInRanges,
    scanEditor: scanEditor,
    isRangeContainsSomePoint: isRangeContainsSomePoint,
    destroyNonLastSelection: destroyNonLastSelection,
    getLargestFoldRangeContainsBufferRow: getLargestFoldRangeContainsBufferRow,
    translatePointAndClip: translatePointAndClip,
    getRangeByTranslatePointAndClip: getRangeByTranslatePointAndClip
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi91dGlscy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHMwRUFBQTtJQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBNkIsT0FBQSxDQUFRLE1BQVIsQ0FBN0IsRUFBQywyQkFBRCxFQUFhLGlCQUFiLEVBQW9COztFQUNwQixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLFNBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixRQUFBO2dEQUFhLENBQUU7RUFETDs7RUFHWixZQUFBLEdBQWUsU0FBQyxHQUFEO0FBQ2IsUUFBQTtJQUFBLFNBQUEsR0FBWTtJQUNaLE9BQUEsR0FBVTtBQUNWLFdBQUEsSUFBQTtNQUNFLFNBQVMsQ0FBQyxJQUFWLENBQWUsT0FBZjtNQUNBLE9BQUEsR0FBVSxTQUFBLENBQVUsT0FBVjtNQUNWLElBQUEsQ0FBYSxPQUFiO0FBQUEsY0FBQTs7SUFIRjtXQUlBO0VBUGE7O0VBU2YsdUJBQUEsR0FBMEIsU0FBQyxPQUFELEVBQVUsR0FBVjtBQUN4QixRQUFBO0lBRG1DLGNBQUQ7SUFDbEMsT0FBQSxHQUFVO0lBQ1YsT0FBQSxHQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYixDQUFBO0lBQ1YsSUFBRyxtQkFBSDtNQUNFLFVBQUEsR0FBYSxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFkLENBQStCLFdBQS9CLENBQTJDLENBQUMsY0FBNUMsQ0FBQSxDQUE0RCxDQUFDLEdBQTdELENBQUE7TUFDYixPQUFBLEdBQVUsT0FBTyxDQUFDLE1BQVIsQ0FBZSxTQUFDLElBQUQ7QUFBYyxZQUFBO1FBQVosU0FBRDtlQUFhLE1BQUEsS0FBVTtNQUF4QixDQUFmLEVBRlo7O0FBSUEsU0FBQSx5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QTlEZTtJQStEZiw4QkFBQSw0QkEvRGU7SUFnRWYsd0JBQUEsc0JBaEVlO0lBaUVmLDJCQUFBLHlCQWpFZTtJQWtFZixtQkFBQSxpQkFsRWU7SUFtRWYsa0NBQUEsZ0NBbkVlO0lBb0VmLGVBQUEsYUFwRWU7SUFxRWYseUJBQUEsdUJBckVlO0lBc0VmLGlCQUFBLGVBdEVlO0lBdUVmLG1DQUFBLGlDQXZFZTtJQXdFZixnQkFBQSxjQXhFZTtJQXlFZiw2QkFBQSwyQkF6RWU7SUEwRWYsYUFBQSxXQTFFZTtJQTJFZixzQkFBQSxvQkEzRWU7SUE0RWYsb0JBQUEsa0JBNUVlO0lBNkVmLGNBQUEsWUE3RWU7SUE4RWYsa0NBQUEsZ0NBOUVlO0lBK0VmLDBCQUFBLHdCQS9FZTtJQWdGZixvQ0FBQSxrQ0FoRmU7SUFpRmYsMkNBQUEseUNBakZlO0lBa0ZmLGdDQUFBLDhCQWxGZTtJQW1GZiwrQkFBQSw2QkFuRmU7SUFvRmYsdUJBQUEscUJBcEZlO0lBcUZmLCtCQUFBLDZCQXJGZTtJQXNGZixjQUFBLFlBdEZlO0lBdUZmLFlBQUEsVUF2RmU7SUF3RmYsMEJBQUEsd0JBeEZlO0lBeUZmLHlCQUFBLHVCQXpGZTtJQTBGZixzQ0FBQSxvQ0ExRmU7SUEyRmYsdUJBQUEscUJBM0ZlO0lBNEZmLGlDQUFBLCtCQTVGZTs7QUFueUJqQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxue0Rpc3Bvc2FibGUsIFJhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuZ2V0UGFyZW50ID0gKG9iaikgLT5cbiAgb2JqLl9fc3VwZXJfXz8uY29uc3RydWN0b3JcblxuZ2V0QW5jZXN0b3JzID0gKG9iaikgLT5cbiAgYW5jZXN0b3JzID0gW11cbiAgY3VycmVudCA9IG9ialxuICBsb29wXG4gICAgYW5jZXN0b3JzLnB1c2goY3VycmVudClcbiAgICBjdXJyZW50ID0gZ2V0UGFyZW50KGN1cnJlbnQpXG4gICAgYnJlYWsgdW5sZXNzIGN1cnJlbnRcbiAgYW5jZXN0b3JzXG5cbmdldEtleUJpbmRpbmdGb3JDb21tYW5kID0gKGNvbW1hbmQsIHtwYWNrYWdlTmFtZX0pIC0+XG4gIHJlc3VsdHMgPSBudWxsXG4gIGtleW1hcHMgPSBhdG9tLmtleW1hcHMuZ2V0S2V5QmluZGluZ3MoKVxuICBpZiBwYWNrYWdlTmFtZT9cbiAgICBrZXltYXBQYXRoID0gYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlKHBhY2thZ2VOYW1lKS5nZXRLZXltYXBQYXRocygpLnBvcCgpXG4gICAga2V5bWFwcyA9IGtleW1hcHMuZmlsdGVyKCh7c291cmNlfSkgLT4gc291cmNlIGlzIGtleW1hcFBhdGgpXG5cbiAgZm9yIGtleW1hcCBpbiBrZXltYXBzIHdoZW4ga2V5bWFwLmNvbW1hbmQgaXMgY29tbWFuZFxuICAgIHtrZXlzdHJva2VzLCBzZWxlY3Rvcn0gPSBrZXltYXBcbiAgICBrZXlzdHJva2VzID0ga2V5c3Ryb2tlcy5yZXBsYWNlKC9zaGlmdC0vLCAnJylcbiAgICAocmVzdWx0cyA/PSBbXSkucHVzaCh7a2V5c3Ryb2tlcywgc2VsZWN0b3J9KVxuICByZXN1bHRzXG5cbiMgSW5jbHVkZSBtb2R1bGUob2JqZWN0IHdoaWNoIG5vcm1hbHkgcHJvdmlkZXMgc2V0IG9mIG1ldGhvZHMpIHRvIGtsYXNzXG5pbmNsdWRlID0gKGtsYXNzLCBtb2R1bGUpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIG1vZHVsZVxuICAgIGtsYXNzOjpba2V5XSA9IHZhbHVlXG5cbmRlYnVnID0gKG1lc3NhZ2VzLi4uKSAtPlxuICByZXR1cm4gdW5sZXNzIHNldHRpbmdzLmdldCgnZGVidWcnKVxuICBzd2l0Y2ggc2V0dGluZ3MuZ2V0KCdkZWJ1Z091dHB1dCcpXG4gICAgd2hlbiAnY29uc29sZSdcbiAgICAgIGNvbnNvbGUubG9nIG1lc3NhZ2VzLi4uXG4gICAgd2hlbiAnZmlsZSdcbiAgICAgIGZpbGVQYXRoID0gZnMubm9ybWFsaXplIHNldHRpbmdzLmdldCgnZGVidWdPdXRwdXRGaWxlUGF0aCcpXG4gICAgICBpZiBmcy5leGlzdHNTeW5jKGZpbGVQYXRoKVxuICAgICAgICBmcy5hcHBlbmRGaWxlU3luYyBmaWxlUGF0aCwgbWVzc2FnZXMgKyBcIlxcblwiXG5cbiMgUmV0dXJuIGZ1bmN0aW9uIHRvIHJlc3RvcmUgZWRpdG9yJ3Mgc2Nyb2xsVG9wIGFuZCBmb2xkIHN0YXRlLlxuc2F2ZUVkaXRvclN0YXRlID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yRWxlbWVudCA9IGVkaXRvci5lbGVtZW50XG4gIHNjcm9sbFRvcCA9IGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsVG9wKClcblxuICBmb2xkU3RhcnRSb3dzID0gZWRpdG9yLmRpc3BsYXlMYXllci5maW5kRm9sZE1hcmtlcnMoe30pLm1hcCAobSkgLT4gbS5nZXRTdGFydFBvc2l0aW9uKCkucm93XG4gIC0+XG4gICAgZm9yIHJvdyBpbiBmb2xkU3RhcnRSb3dzLnJldmVyc2UoKSB3aGVuIG5vdCBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICBlZGl0b3IuZm9sZEJ1ZmZlclJvdyhyb3cpXG4gICAgZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuXG4jIFJldHVybiBmdW5jdGlvbiB0byByZXN0b3JlIGN1cnNvciBwb3NpdGlvblxuIyBXaGVuIHJlc3RvcmluZywgcmVtb3ZlZCBjdXJzb3JzIGFyZSBpZ25vcmVkLlxuc2F2ZUN1cnNvclBvc2l0aW9ucyA9IChlZGl0b3IpIC0+XG4gIHBvaW50cyA9IG5ldyBNYXBcbiAgZm9yIGN1cnNvciBpbiBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgcG9pbnRzLnNldChjdXJzb3IsIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAtPlxuICAgIGZvciBjdXJzb3IgaW4gZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIHBvaW50cy5oYXMoY3Vyc29yKVxuICAgICAgcG9pbnQgPSBwb2ludHMuZ2V0KGN1cnNvcilcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuZ2V0S2V5c3Ryb2tlRm9yRXZlbnQgPSAoZXZlbnQpIC0+XG4gIGtleWJvYXJkRXZlbnQgPSBldmVudC5vcmlnaW5hbEV2ZW50Lm9yaWdpbmFsRXZlbnQgPyBldmVudC5vcmlnaW5hbEV2ZW50XG4gIGF0b20ua2V5bWFwcy5rZXlzdHJva2VGb3JLZXlib2FyZEV2ZW50KGtleWJvYXJkRXZlbnQpXG5cbmtleXN0cm9rZVRvQ2hhckNvZGUgPVxuICBiYWNrc3BhY2U6IDhcbiAgdGFiOiA5XG4gIGVudGVyOiAxM1xuICBlc2NhcGU6IDI3XG4gIHNwYWNlOiAzMlxuICBkZWxldGU6IDEyN1xuXG5nZXRDaGFyYWN0ZXJGb3JFdmVudCA9IChldmVudCkgLT5cbiAga2V5c3Ryb2tlID0gZ2V0S2V5c3Ryb2tlRm9yRXZlbnQoZXZlbnQpXG4gIGlmIGNoYXJDb2RlID0ga2V5c3Ryb2tlVG9DaGFyQ29kZVtrZXlzdHJva2VdXG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSlcbiAgZWxzZVxuICAgIGtleXN0cm9rZVxuXG5pc0xpbmV3aXNlUmFuZ2UgPSAoe3N0YXJ0LCBlbmR9KSAtPlxuICAoc3RhcnQucm93IGlzbnQgZW5kLnJvdykgYW5kIChzdGFydC5jb2x1bW4gaXMgZW5kLmNvbHVtbiBpcyAwKVxuXG5pc0VuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAge3N0YXJ0LCBlbmR9ID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdywgaW5jbHVkZU5ld2xpbmU6IHRydWUpXG4gIChub3Qgc3RhcnQuaXNFcXVhbChlbmQpKSBhbmQgZW5kLmNvbHVtbiBpcyAwXG5cbmhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24gPSAoZWRpdG9yKSAtPlxuICBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLnNvbWUgKHNlbGVjdGlvbikgLT5cbiAgICBub3Qgc2VsZWN0aW9uLmlzRW1wdHkoKVxuXG5zb3J0UmFuZ2VzID0gKHJhbmdlcykgLT5cbiAgcmFuZ2VzLnNvcnQoKGEsIGIpIC0+IGEuY29tcGFyZShiKSlcblxuc29ydFJhbmdlc0J5RW5kUG9zaXRpb24gPSAocmFuZ2VzLCBmbikgLT5cbiAgcmFuZ2VzLnNvcnQoKGEsIGIpIC0+IGEuZW5kLmNvbXBhcmUoYi5lbmQpKVxuXG4jIFJldHVybiBhZGp1c3RlZCBpbmRleCBmaXQgd2hpdGluIGdpdmVuIGxpc3QncyBsZW5ndGhcbiMgcmV0dXJuIC0xIGlmIGxpc3QgaXMgZW1wdHkuXG5nZXRJbmRleCA9IChpbmRleCwgbGlzdCkgLT5cbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGhcbiAgaWYgbGVuZ3RoIGlzIDBcbiAgICAtMVxuICBlbHNlXG4gICAgaW5kZXggPSBpbmRleCAlIGxlbmd0aFxuICAgIGlmIGluZGV4ID49IDBcbiAgICAgIGluZGV4XG4gICAgZWxzZVxuICAgICAgbGVuZ3RoICsgaW5kZXhcblxud2l0aFZpc2libGVCdWZmZXJSYW5nZSA9IChlZGl0b3IsIGZuKSAtPlxuICBpZiByYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZShlZGl0b3IpXG4gICAgZm4ocmFuZ2UpXG4gIGVsc2VcbiAgICBkaXNwb3NhYmxlID0gZWRpdG9yLmVsZW1lbnQub25EaWRBdHRhY2ggLT5cbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICByYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZShlZGl0b3IpXG4gICAgICBmbihyYW5nZSlcblxuIyBOT1RFOiBlbmRSb3cgYmVjb21lIHVuZGVmaW5lZCBpZiBAZWRpdG9yRWxlbWVudCBpcyBub3QgeWV0IGF0dGFjaGVkLlxuIyBlLmcuIEJlZ2luZyBjYWxsZWQgaW1tZWRpYXRlbHkgYWZ0ZXIgb3BlbiBmaWxlLlxuZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlID0gKGVkaXRvcikgLT5cbiAgW3N0YXJ0Um93LCBlbmRSb3ddID0gZWRpdG9yLmVsZW1lbnQuZ2V0VmlzaWJsZVJvd1JhbmdlKClcbiAgcmV0dXJuIG51bGwgdW5sZXNzIChzdGFydFJvdz8gYW5kIGVuZFJvdz8pXG4gIHN0YXJ0Um93ID0gZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhzdGFydFJvdylcbiAgZW5kUm93ID0gZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhlbmRSb3cpXG4gIG5ldyBSYW5nZShbc3RhcnRSb3csIDBdLCBbZW5kUm93LCBJbmZpbml0eV0pXG5cbmdldFZpc2libGVFZGl0b3JzID0gLT5cbiAgZm9yIHBhbmUgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKSB3aGVuIGVkaXRvciA9IHBhbmUuZ2V0QWN0aXZlRWRpdG9yKClcbiAgICBlZGl0b3JcblxuIyBjaGFyIGNhbiBiZSByZWdFeHAgcGF0dGVyblxuY291bnRDaGFyID0gKHN0cmluZywgY2hhcikgLT5cbiAgc3RyaW5nLnNwbGl0KGNoYXIpLmxlbmd0aCAtIDFcblxuZmluZEluZGV4QnkgPSAobGlzdCwgZm4pIC0+XG4gIGZvciBpdGVtLCBpIGluIGxpc3Qgd2hlbiBmbihpdGVtKVxuICAgIHJldHVybiBpXG4gIG51bGxcblxubWVyZ2VJbnRlcnNlY3RpbmdSYW5nZXMgPSAocmFuZ2VzKSAtPlxuICByZXN1bHQgPSBbXVxuICBmb3IgcmFuZ2UsIGkgaW4gcmFuZ2VzXG4gICAgaWYgaW5kZXggPSBmaW5kSW5kZXhCeShyZXN1bHQsIChyKSAtPiByLmludGVyc2VjdHNXaXRoKHJhbmdlKSlcbiAgICAgIHJlc3VsdFtpbmRleF0gPSByZXN1bHRbaW5kZXhdLnVuaW9uKHJhbmdlKVxuICAgIGVsc2VcbiAgICAgIHJlc3VsdC5wdXNoKHJhbmdlKVxuICByZXN1bHRcblxuZ2V0RW5kT2ZMaW5lRm9yQnVmZmVyUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93KS5lbmRcblxucG9pbnRJc0F0RW5kT2ZMaW5lID0gKGVkaXRvciwgcG9pbnQpIC0+XG4gIHBvaW50ID0gUG9pbnQuZnJvbU9iamVjdChwb2ludClcbiAgZ2V0RW5kT2ZMaW5lRm9yQnVmZmVyUm93KGVkaXRvciwgcG9pbnQucm93KS5pc0VxdWFsKHBvaW50KVxuXG5nZXRDaGFyYWN0ZXJBdEN1cnNvciA9IChjdXJzb3IpIC0+XG4gIGdldFRleHRJblNjcmVlblJhbmdlKGN1cnNvci5lZGl0b3IsIGN1cnNvci5nZXRTY3JlZW5SYW5nZSgpKVxuXG5nZXRDaGFyYWN0ZXJBdEJ1ZmZlclBvc2l0aW9uID0gKGVkaXRvciwgc3RhcnRQb3NpdGlvbikgLT5cbiAgZW5kUG9zaXRpb24gPSBzdGFydFBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgMV0pXG4gIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbc3RhcnRQb3NpdGlvbiwgZW5kUG9zaXRpb25dKVxuXG5nZXRUZXh0SW5TY3JlZW5SYW5nZSA9IChlZGl0b3IsIHNjcmVlblJhbmdlKSAtPlxuICBidWZmZXJSYW5nZSA9IGVkaXRvci5idWZmZXJSYW5nZUZvclNjcmVlblJhbmdlKHNjcmVlblJhbmdlKVxuICBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoYnVmZmVyUmFuZ2UpXG5cbmN1cnNvcklzT25XaGl0ZVNwYWNlID0gKGN1cnNvcikgLT5cbiAgaXNBbGxXaGl0ZVNwYWNlKGdldENoYXJhY3RlckF0Q3Vyc29yKGN1cnNvcikpXG5cbnBvaW50SXNPbldoaXRlU3BhY2UgPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgaXNBbGxXaGl0ZVNwYWNlKGdldENoYXJhY3RlckF0QnVmZmVyUG9zaXRpb24oZWRpdG9yLCBwb2ludCkpXG5cbnNjcmVlblBvc2l0aW9uSXNBdFdoaXRlU3BhY2UgPSAoZWRpdG9yLCBzY3JlZW5Qb3NpdGlvbikgLT5cbiAgc2NyZWVuUmFuZ2UgPSBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEoc2NyZWVuUG9zaXRpb24sIDAsIDEpXG4gIGNoYXIgPSBnZXRUZXh0SW5TY3JlZW5SYW5nZShlZGl0b3IsIHNjcmVlblJhbmdlKVxuICBjaGFyPyBhbmQgL1xcUy8udGVzdChjaGFyKVxuXG5nZXROb25Xb3JkQ2hhcmFjdGVyc0ZvckN1cnNvciA9IChjdXJzb3IpIC0+XG4gICMgQXRvbSAxLjExLjAtYmV0YTUgaGF2ZSB0aGlzIGV4cGVyaW1lbnRhbCBtZXRob2QuXG4gIGlmIGN1cnNvci5nZXROb25Xb3JkQ2hhcmFjdGVycz9cbiAgICBjdXJzb3IuZ2V0Tm9uV29yZENoYXJhY3RlcnMoKVxuICBlbHNlXG4gICAgc2NvcGUgPSBjdXJzb3IuZ2V0U2NvcGVEZXNjcmlwdG9yKCkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJywge3Njb3BlfSlcblxuIyByZXR1cm4gdHJ1ZSBpZiBtb3ZlZFxubW92ZUN1cnNvclRvTmV4dE5vbldoaXRlc3BhY2UgPSAoY3Vyc29yKSAtPlxuICBvcmlnaW5hbFBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgdmltRW9mID0gZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oY3Vyc29yLmVkaXRvcilcbiAgd2hpbGUgY3Vyc29ySXNPbldoaXRlU3BhY2UoY3Vyc29yKSBhbmQgbm90IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLmlzR3JlYXRlclRoYW5PckVxdWFsKHZpbUVvZilcbiAgICBjdXJzb3IubW92ZVJpZ2h0KClcbiAgbm90IG9yaWdpbmFsUG9pbnQuaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcblxuZ2V0QnVmZmVyUm93cyA9IChlZGl0b3IsIHtzdGFydFJvdywgZGlyZWN0aW9ufSkgLT5cbiAgc3dpdGNoIGRpcmVjdGlvblxuICAgIHdoZW4gJ3ByZXZpb3VzJ1xuICAgICAgaWYgc3RhcnRSb3cgPD0gMFxuICAgICAgICBbXVxuICAgICAgZWxzZVxuICAgICAgICBbKHN0YXJ0Um93IC0gMSkuLjBdXG4gICAgd2hlbiAnbmV4dCdcbiAgICAgIHZpbUxhc3RCdWZmZXJSb3cgPSBnZXRWaW1MYXN0QnVmZmVyUm93KGVkaXRvcilcbiAgICAgIGlmIHN0YXJ0Um93ID49IHZpbUxhc3RCdWZmZXJSb3dcbiAgICAgICAgW11cbiAgICAgIGVsc2VcbiAgICAgICAgWyhzdGFydFJvdyArIDEpLi52aW1MYXN0QnVmZmVyUm93XVxuXG5nZXRQYXJhZ3JhcGhCb3VuZGFyeVJvdyA9IChlZGl0b3IsIHN0YXJ0Um93LCBkaXJlY3Rpb24sIGZuKSAtPlxuICB3YXNBdE5vbkJsYW5rUm93ID0gbm90IGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHN0YXJ0Um93KVxuICBmb3Igcm93IGluIGdldEJ1ZmZlclJvd3MoZWRpdG9yLCB7c3RhcnRSb3csIGRpcmVjdGlvbn0pXG4gICAgaXNBdE5vbkJsYW5rUm93ID0gbm90IGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICBpZiB3YXNBdE5vbkJsYW5rUm93IGlzbnQgaXNBdE5vbkJsYW5rUm93XG4gICAgICBpZiBmbj9cbiAgICAgICAgcmV0dXJuIHJvdyBpZiBmbj8oaXNBdE5vbkJsYW5rUm93KVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gcm93XG4gICAgd2FzQXROb25CbGFua1JvdyA9IGlzQXROb25CbGFua1Jvd1xuXG4jIFJldHVybiBWaW0ncyBFT0YgcG9zaXRpb24gcmF0aGVyIHRoYW4gQXRvbSdzIEVPRiBwb3NpdGlvbi5cbiMgVGhpcyBmdW5jdGlvbiBjaGFuZ2UgbWVhbmluZyBvZiBFT0YgZnJvbSBuYXRpdmUgVGV4dEVkaXRvcjo6Z2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuIyBBdG9tIGlzIHNwZWNpYWwoc3RyYW5nZSkgZm9yIGN1cnNvciBjYW4gcGFzdCB2ZXJ5IGxhc3QgbmV3bGluZSBjaGFyYWN0ZXIuXG4jIEJlY2F1c2Ugb2YgdGhpcywgQXRvbSdzIEVPRiBwb3NpdGlvbiBpcyBbYWN0dWFsTGFzdFJvdysxLCAwXSBwcm92aWRlZCBsYXN0LW5vbi1ibGFuay1yb3dcbiMgZW5kcyB3aXRoIG5ld2xpbmUgY2hhci5cbiMgQnV0IGluIFZpbSwgY3Vyb3IgY2FuIE5PVCBwYXN0IGxhc3QgbmV3bGluZS4gRU9GIGlzIG5leHQgcG9zaXRpb24gb2YgdmVyeSBsYXN0IGNoYXJhY3Rlci5cbmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uID0gKGVkaXRvcikgLT5cbiAgZW9mID0gZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgaWYgKGVvZi5yb3cgaXMgMCkgb3IgKGVvZi5jb2x1bW4gPiAwKVxuICAgIGVvZlxuICBlbHNlXG4gICAgZ2V0RW5kT2ZMaW5lRm9yQnVmZmVyUm93KGVkaXRvciwgZW9mLnJvdyAtIDEpXG5cbmdldFZpbUVvZlNjcmVlblBvc2l0aW9uID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oZWRpdG9yKSlcblxucG9pbnRJc0F0VmltRW5kT2ZGaWxlID0gKGVkaXRvciwgcG9pbnQpIC0+XG4gIGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKGVkaXRvcikuaXNFcXVhbChwb2ludClcblxuY3Vyc29ySXNBdFZpbUVuZE9mRmlsZSA9IChjdXJzb3IpIC0+XG4gIHBvaW50SXNBdFZpbUVuZE9mRmlsZShjdXJzb3IuZWRpdG9yLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcblxuaXNFbXB0eVJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdykuaXNFbXB0eSgpXG5cbmN1cnNvcklzQXRFbXB0eVJvdyA9IChjdXJzb3IpIC0+XG4gIGlzRW1wdHlSb3coY3Vyc29yLmVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuXG5jdXJzb3JJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvdyA9IChjdXJzb3IpIC0+XG4gIGN1cnNvci5pc0F0RW5kT2ZMaW5lKCkgYW5kIG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpXG5cbmdldFZpbUxhc3RCdWZmZXJSb3cgPSAoZWRpdG9yKSAtPlxuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbihlZGl0b3IpLnJvd1xuXG5nZXRWaW1MYXN0U2NyZWVuUm93ID0gKGVkaXRvcikgLT5cbiAgZ2V0VmltRW9mU2NyZWVuUG9zaXRpb24oZWRpdG9yKS5yb3dcblxuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93ID0gKGVkaXRvcikgLT5cbiAgZWRpdG9yLmVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcblxuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3cgPSAoZWRpdG9yKSAtPlxuICBlZGl0b3IuZWxlbWVudC5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpXG5cbmdldEZpcnN0Q2hhcmFjdGVyQ29sdW1Gb3JCdWZmZXJSb3cgPSAoZWRpdG9yLCByb3cpIC0+XG4gIHRleHQgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVxuICBpZiAoY29sdW1uID0gdGV4dC5zZWFyY2goL1xcUy8pKSA+PSAwXG4gICAgY29sdW1uXG4gIGVsc2VcbiAgICAwXG5cbnRyaW1SYW5nZSA9IChlZGl0b3IsIHNjYW5SYW5nZSkgLT5cbiAgcGF0dGVybiA9IC9cXFMvXG4gIFtzdGFydCwgZW5kXSA9IFtdXG4gIHNldFN0YXJ0ID0gKHtyYW5nZX0pIC0+IHtzdGFydH0gPSByYW5nZVxuICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UocGF0dGVybiwgc2NhblJhbmdlLCBzZXRTdGFydClcbiAgaWYgc3RhcnQ/XG4gICAgc2V0RW5kID0gKHtyYW5nZX0pIC0+IHtlbmR9ID0gcmFuZ2VcbiAgICBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UocGF0dGVybiwgc2NhblJhbmdlLCBzZXRFbmQpXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG4gIGVsc2VcbiAgICBzY2FuUmFuZ2VcblxuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgZnJvbSA9IFtyb3csIDBdXG4gIGdldEVuZFBvc2l0aW9uRm9yUGF0dGVybihlZGl0b3IsIGZyb20sIC9cXHMqLywgY29udGFpbmVkT25seTogdHJ1ZSkgb3IgZnJvbVxuXG5nZXRGaXJzdENoYXJhY3RlckJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUm93ID0gKGVkaXRvciwgc2NyZWVuUm93KSAtPlxuICBzdGFydCA9IGVkaXRvci5jbGlwU2NyZWVuUG9zaXRpb24oW3NjcmVlblJvdywgMF0sIHNraXBTb2Z0V3JhcEluZGVudGF0aW9uOiB0cnVlKVxuICBlbmQgPSBbc2NyZWVuUm93LCBJbmZpbml0eV1cbiAgc2NhblJhbmdlID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NyZWVuUmFuZ2UoW3N0YXJ0LCBlbmRdKVxuXG4gIHBvaW50ID0gbnVsbFxuICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgL1xcUy8sIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgcG9pbnQgPSByYW5nZS5zdGFydFxuICAgIHN0b3AoKVxuICBwb2ludCA/IHNjYW5SYW5nZS5zdGFydFxuXG5jdXJzb3JJc0F0Rmlyc3RDaGFyYWN0ZXIgPSAoY3Vyc29yKSAtPlxuICB7ZWRpdG9yfSA9IGN1cnNvclxuICBjb2x1bW4gPSBjdXJzb3IuZ2V0QnVmZmVyQ29sdW1uKClcbiAgZmlyc3RDaGFyQ29sdW1uID0gZ2V0Rmlyc3RDaGFyYWN0ZXJDb2x1bUZvckJ1ZmZlclJvdyhlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgY29sdW1uIGlzIGZpcnN0Q2hhckNvbHVtblxuXG4jIEN1cnNvciBtb3Rpb24gd3JhcHBlclxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5tb3ZlQ3Vyc29yID0gKGN1cnNvciwge3ByZXNlcnZlR29hbENvbHVtbn0sIGZuKSAtPlxuICB7Z29hbENvbHVtbn0gPSBjdXJzb3JcbiAgZm4oY3Vyc29yKVxuICBpZiBwcmVzZXJ2ZUdvYWxDb2x1bW4gYW5kIGdvYWxDb2x1bW4/XG4gICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBnb2FsQ29sdW1uXG5cbiMgV29ya2Fyb3VuZCBpc3N1ZSBmb3IgdDltZC92aW0tbW9kZS1wbHVzIzIyNiBhbmQgYXRvbS9hdG9tIzMxNzRcbiMgSSBjYW5ub3QgZGVwZW5kIGN1cnNvcidzIGNvbHVtbiBzaW5jZSBpdHMgY2xhaW0gMCBhbmQgY2xpcHBpbmcgZW1tdWxhdGlvbiBkb24ndFxuIyByZXR1cm4gd3JhcHBlZCBsaW5lLCBidXQgSXQgYWN0dWFsbHkgd3JhcCwgc28gSSBuZWVkIHRvIGRvIHZlcnkgZGlydHkgd29yayB0b1xuIyBwcmVkaWN0IHdyYXAgaHVyaXN0aWNhbGx5Llxuc2hvdWxkUHJldmVudFdyYXBMaW5lID0gKGN1cnNvcikgLT5cbiAge3JvdywgY29sdW1ufSA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gIGlmIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnNvZnRUYWJzJylcbiAgICB0YWJMZW5ndGggPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci50YWJMZW5ndGgnKVxuICAgIGlmIDAgPCBjb2x1bW4gPCB0YWJMZW5ndGhcbiAgICAgIHRleHQgPSBjdXJzb3IuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbcm93LCAwXSwgW3JvdywgdGFiTGVuZ3RoXV0pXG4gICAgICAvXlxccyskLy50ZXN0KHRleHQpXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuIyBvcHRpb25zOlxuIyAgIGFsbG93V3JhcDogdG8gY29udHJvbGwgYWxsb3cgd3JhcFxuIyAgIHByZXNlcnZlR29hbENvbHVtbjogcHJlc2VydmUgb3JpZ2luYWwgZ29hbENvbHVtblxubW92ZUN1cnNvckxlZnQgPSAoY3Vyc29yLCBvcHRpb25zPXt9KSAtPlxuICB7YWxsb3dXcmFwLCBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZX0gPSBvcHRpb25zXG4gIGRlbGV0ZSBvcHRpb25zLmFsbG93V3JhcFxuICBpZiBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZVxuICAgIHJldHVybiBpZiBzaG91bGRQcmV2ZW50V3JhcExpbmUoY3Vyc29yKVxuXG4gIGlmIG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpIG9yIGFsbG93V3JhcFxuICAgIG1vdGlvbiA9IChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlTGVmdCgpXG4gICAgbW92ZUN1cnNvcihjdXJzb3IsIG9wdGlvbnMsIG1vdGlvbilcblxubW92ZUN1cnNvclJpZ2h0ID0gKGN1cnNvciwgb3B0aW9ucz17fSkgLT5cbiAge2FsbG93V3JhcH0gPSBvcHRpb25zXG4gIGRlbGV0ZSBvcHRpb25zLmFsbG93V3JhcFxuICBpZiBub3QgY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSBvciBhbGxvd1dyYXBcbiAgICBtb3Rpb24gPSAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICBtb3ZlQ3Vyc29yKGN1cnNvciwgb3B0aW9ucywgbW90aW9uKVxuXG5tb3ZlQ3Vyc29yVXBTY3JlZW4gPSAoY3Vyc29yLCBvcHRpb25zPXt9KSAtPlxuICB1bmxlc3MgY3Vyc29yLmdldFNjcmVlblJvdygpIGlzIDBcbiAgICBtb3Rpb24gPSAoY3Vyc29yKSAtPiBjdXJzb3IubW92ZVVwKClcbiAgICBtb3ZlQ3Vyc29yKGN1cnNvciwgb3B0aW9ucywgbW90aW9uKVxuXG5tb3ZlQ3Vyc29yRG93blNjcmVlbiA9IChjdXJzb3IsIG9wdGlvbnM9e30pIC0+XG4gIHVubGVzcyBnZXRWaW1MYXN0U2NyZWVuUm93KGN1cnNvci5lZGl0b3IpIGlzIGN1cnNvci5nZXRTY3JlZW5Sb3coKVxuICAgIG1vdGlvbiA9IChjdXJzb3IpIC0+IGN1cnNvci5tb3ZlRG93bigpXG4gICAgbW92ZUN1cnNvcihjdXJzb3IsIG9wdGlvbnMsIG1vdGlvbilcblxuIyBGSVhNRVxubW92ZUN1cnNvckRvd25CdWZmZXIgPSAoY3Vyc29yKSAtPlxuICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gIHVubGVzcyBnZXRWaW1MYXN0QnVmZmVyUm93KGN1cnNvci5lZGl0b3IpIGlzIHBvaW50LnJvd1xuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoWysxLCAwXSkpXG5cbiMgRklYTUVcbm1vdmVDdXJzb3JVcEJ1ZmZlciA9IChjdXJzb3IpIC0+XG4gIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgdW5sZXNzIHBvaW50LnJvdyBpcyAwXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShbLTEsIDBdKSlcblxubW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyA9IChjdXJzb3IsIHJvdykgLT5cbiAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtyb3csIDBdKVxuICBjdXJzb3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG4jIFJldHVybiBtYXJrZXJzXG5oaWdobGlnaHRSYW5nZXMgPSAoZWRpdG9yLCByYW5nZXMsIG9wdGlvbnMpIC0+XG4gIHJhbmdlcyA9IFtyYW5nZXNdIHVubGVzcyBfLmlzQXJyYXkocmFuZ2VzKVxuICByZXR1cm4gbnVsbCB1bmxlc3MgcmFuZ2VzLmxlbmd0aFxuXG4gIGludmFsaWRhdGUgPSBvcHRpb25zLmludmFsaWRhdGUgPyAnbmV2ZXInXG4gIG1hcmtlcnMgPSAoZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwge2ludmFsaWRhdGV9KSBmb3IgcmFuZ2UgaW4gcmFuZ2VzKVxuXG4gIGRlY29yYXRlT3B0aW9ucyA9IHt0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6IG9wdGlvbnMuY2xhc3N9XG4gIGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIGRlY29yYXRlT3B0aW9ucykgZm9yIG1hcmtlciBpbiBtYXJrZXJzXG5cbiAge3RpbWVvdXR9ID0gb3B0aW9uc1xuICBpZiB0aW1lb3V0P1xuICAgIGRlc3Ryb3lNYXJrZXJzID0gLT4gXy5pbnZva2UobWFya2VycywgJ2Rlc3Ryb3knKVxuICAgIHNldFRpbWVvdXQoZGVzdHJveU1hcmtlcnMsIHRpbWVvdXQpXG4gIG1hcmtlcnNcblxuaGlnaGxpZ2h0UmFuZ2UgPSAoZWRpdG9yLCByYW5nZSwgb3B0aW9ucykgLT5cbiAgaGlnaGxpZ2h0UmFuZ2VzKGVkaXRvciwgW3JhbmdlXSwgb3B0aW9ucylbMF1cblxuIyBSZXR1cm4gdmFsaWQgcm93IGZyb20gMCB0byB2aW1MYXN0QnVmZmVyUm93XG5nZXRWYWxpZFZpbUJ1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgdmltTGFzdEJ1ZmZlclJvdyA9IGdldFZpbUxhc3RCdWZmZXJSb3coZWRpdG9yKVxuICBzd2l0Y2hcbiAgICB3aGVuIChyb3cgPCAwKSB0aGVuIDBcbiAgICB3aGVuIChyb3cgPiB2aW1MYXN0QnVmZmVyUm93KSB0aGVuIHZpbUxhc3RCdWZmZXJSb3dcbiAgICBlbHNlIHJvd1xuXG4jIFJldHVybiB2YWxpZCByb3cgZnJvbSAwIHRvIHZpbUxhc3RTY3JlZW5Sb3dcbmdldFZhbGlkVmltU2NyZWVuUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICB2aW1MYXN0U2NyZWVuUm93ID0gZ2V0VmltTGFzdFNjcmVlblJvdyhlZGl0b3IpXG4gIHN3aXRjaFxuICAgIHdoZW4gKHJvdyA8IDApIHRoZW4gMFxuICAgIHdoZW4gKHJvdyA+IHZpbUxhc3RTY3JlZW5Sb3cpIHRoZW4gdmltTGFzdFNjcmVlblJvd1xuICAgIGVsc2Ugcm93XG5cbiMgQnkgZGVmYXVsdCBub3QgaW5jbHVkZSBjb2x1bW5cbmdldFRleHRUb1BvaW50ID0gKGVkaXRvciwge3JvdywgY29sdW1ufSwge2V4Y2x1c2l2ZX09e30pIC0+XG4gIGV4Y2x1c2l2ZSA/PSB0cnVlXG4gIGlmIGV4Y2x1c2l2ZVxuICAgIGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpWzAuLi5jb2x1bW5dXG4gIGVsc2VcbiAgICBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocm93KVswLi5jb2x1bW5dXG5cbmdldEluZGVudExldmVsRm9yQnVmZmVyUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICB0ZXh0ID0gZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgZWRpdG9yLmluZGVudExldmVsRm9yTGluZSh0ZXh0KVxuXG5XaGl0ZVNwYWNlUmVnRXhwID0gL15cXHMqJC9cbmlzQWxsV2hpdGVTcGFjZSA9ICh0ZXh0KSAtPlxuICBXaGl0ZVNwYWNlUmVnRXhwLnRlc3QodGV4dClcblxuZ2V0Q29kZUZvbGRSb3dSYW5nZXMgPSAoZWRpdG9yKSAtPlxuICBbMC4uZWRpdG9yLmdldExhc3RCdWZmZXJSb3coKV1cbiAgICAubWFwIChyb3cpIC0+XG4gICAgICBlZGl0b3IubGFuZ3VhZ2VNb2RlLnJvd1JhbmdlRm9yQ29kZUZvbGRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgLmZpbHRlciAocm93UmFuZ2UpIC0+XG4gICAgICByb3dSYW5nZT8gYW5kIHJvd1JhbmdlWzBdPyBhbmQgcm93UmFuZ2VbMV0/XG5cbiMgKiBgZXhjbHVzaXZlYCB0byBleGNsdWRlIHN0YXJ0Um93IHRvIGRldGVybWluZSBpbmNsdXNpb24uXG5nZXRDb2RlRm9sZFJvd1Jhbmdlc0NvbnRhaW5lc0ZvclJvdyA9IChlZGl0b3IsIGJ1ZmZlclJvdywge2luY2x1ZGVTdGFydFJvd309e30pIC0+XG4gIGluY2x1ZGVTdGFydFJvdyA/PSB0cnVlXG4gIGdldENvZGVGb2xkUm93UmFuZ2VzKGVkaXRvcikuZmlsdGVyIChbc3RhcnRSb3csIGVuZFJvd10pIC0+XG4gICAgaWYgaW5jbHVkZVN0YXJ0Um93XG4gICAgICBzdGFydFJvdyA8PSBidWZmZXJSb3cgPD0gZW5kUm93XG4gICAgZWxzZVxuICAgICAgc3RhcnRSb3cgPCBidWZmZXJSb3cgPD0gZW5kUm93XG5cbmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UgPSAoZWRpdG9yLCByb3dSYW5nZSkgLT5cbiAgW3N0YXJ0UmFuZ2UsIGVuZFJhbmdlXSA9IHJvd1JhbmdlLm1hcCAocm93KSAtPlxuICAgIGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhyb3csIGluY2x1ZGVOZXdsaW5lOiB0cnVlKVxuICBzdGFydFJhbmdlLnVuaW9uKGVuZFJhbmdlKVxuXG5nZXRUb2tlbml6ZWRMaW5lRm9yUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplZExpbmVGb3JSb3cocm93KVxuXG5nZXRTY29wZXNGb3JUb2tlbml6ZWRMaW5lID0gKGxpbmUpIC0+XG4gIGZvciB0YWcgaW4gbGluZS50YWdzIHdoZW4gdGFnIDwgMCBhbmQgKHRhZyAlIDIgaXMgLTEpXG4gICAgYXRvbS5ncmFtbWFycy5zY29wZUZvcklkKHRhZylcblxuc2NhbkZvclNjb3BlU3RhcnQgPSAoZWRpdG9yLCBmcm9tUG9pbnQsIGRpcmVjdGlvbiwgZm4pIC0+XG4gIGZyb21Qb2ludCA9IFBvaW50LmZyb21PYmplY3QoZnJvbVBvaW50KVxuICBzY2FuUm93cyA9IHN3aXRjaCBkaXJlY3Rpb25cbiAgICB3aGVuICdmb3J3YXJkJyB0aGVuIFsoZnJvbVBvaW50LnJvdykuLmVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCldXG4gICAgd2hlbiAnYmFja3dhcmQnIHRoZW4gWyhmcm9tUG9pbnQucm93KS4uMF1cblxuICBjb250aW51ZVNjYW4gPSB0cnVlXG4gIHN0b3AgPSAtPlxuICAgIGNvbnRpbnVlU2NhbiA9IGZhbHNlXG5cbiAgaXNWYWxpZFRva2VuID0gc3dpdGNoIGRpcmVjdGlvblxuICAgIHdoZW4gJ2ZvcndhcmQnIHRoZW4gKHtwb3NpdGlvbn0pIC0+IHBvc2l0aW9uLmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KVxuICAgIHdoZW4gJ2JhY2t3YXJkJyB0aGVuICh7cG9zaXRpb259KSAtPiBwb3NpdGlvbi5pc0xlc3NUaGFuKGZyb21Qb2ludClcblxuICBmb3Igcm93IGluIHNjYW5Sb3dzIHdoZW4gdG9rZW5pemVkTGluZSA9IGdldFRva2VuaXplZExpbmVGb3JSb3coZWRpdG9yLCByb3cpXG4gICAgY29sdW1uID0gMFxuICAgIHJlc3VsdHMgPSBbXVxuXG4gICAgdG9rZW5JdGVyYXRvciA9IHRva2VuaXplZExpbmUuZ2V0VG9rZW5JdGVyYXRvcigpXG4gICAgZm9yIHRhZyBpbiB0b2tlbml6ZWRMaW5lLnRhZ3NcbiAgICAgIHRva2VuSXRlcmF0b3IubmV4dCgpXG4gICAgICBpZiB0YWcgPCAwICMgTmVnYXRpdmU6IHN0YXJ0L3N0b3AgdG9rZW5cbiAgICAgICAgc2NvcGUgPSBhdG9tLmdyYW1tYXJzLnNjb3BlRm9ySWQodGFnKVxuICAgICAgICBpZiAodGFnICUgMikgaXMgMCAjIEV2ZW46IHNjb3BlIHN0b3BcbiAgICAgICAgICBudWxsXG4gICAgICAgIGVsc2UgIyBPZGQ6IHNjb3BlIHN0YXJ0XG4gICAgICAgICAgcG9zaXRpb24gPSBuZXcgUG9pbnQocm93LCBjb2x1bW4pXG4gICAgICAgICAgcmVzdWx0cy5wdXNoIHtzY29wZSwgcG9zaXRpb24sIHN0b3B9XG4gICAgICBlbHNlXG4gICAgICAgIGNvbHVtbiArPSB0YWdcblxuICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihpc1ZhbGlkVG9rZW4pXG4gICAgcmVzdWx0cy5yZXZlcnNlKCkgaWYgZGlyZWN0aW9uIGlzICdiYWNrd2FyZCdcbiAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgIGZuKHJlc3VsdClcbiAgICAgIHJldHVybiB1bmxlc3MgY29udGludWVTY2FuXG4gICAgcmV0dXJuIHVubGVzcyBjb250aW51ZVNjYW5cblxuZGV0ZWN0U2NvcGVTdGFydFBvc2l0aW9uRm9yU2NvcGUgPSAoZWRpdG9yLCBmcm9tUG9pbnQsIGRpcmVjdGlvbiwgc2NvcGUpIC0+XG4gIHBvaW50ID0gbnVsbFxuICBzY2FuRm9yU2NvcGVTdGFydCBlZGl0b3IsIGZyb21Qb2ludCwgZGlyZWN0aW9uLCAoaW5mbykgLT5cbiAgICBpZiBpbmZvLnNjb3BlLnNlYXJjaChzY29wZSkgPj0gMFxuICAgICAgaW5mby5zdG9wKClcbiAgICAgIHBvaW50ID0gaW5mby5wb3NpdGlvblxuICBwb2ludFxuXG5pc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93ID0gKGVkaXRvciwgcm93KSAtPlxuICAjIFtGSVhNRV0gQnVnIG9mIHVwc3RyZWFtP1xuICAjIFNvbWV0aW1lIHRva2VuaXplZExpbmVzIGxlbmd0aCBpcyBsZXNzIHRoYW4gbGFzdCBidWZmZXIgcm93LlxuICAjIFNvIHRva2VuaXplZExpbmUgaXMgbm90IGFjY2Vzc2libGUgZXZlbiBpZiB2YWxpZCByb3cuXG4gICMgSW4gdGhhdCBjYXNlIEkgc2ltcGx5IHJldHVybiBlbXB0eSBBcnJheS5cbiAgaWYgdG9rZW5pemVkTGluZSA9IGdldFRva2VuaXplZExpbmVGb3JSb3coZWRpdG9yLCByb3cpXG4gICAgZ2V0U2NvcGVzRm9yVG9rZW5pemVkTGluZSh0b2tlbml6ZWRMaW5lKS5zb21lIChzY29wZSkgLT5cbiAgICAgIGlzRnVuY3Rpb25TY29wZShlZGl0b3IsIHNjb3BlKVxuICBlbHNlXG4gICAgZmFsc2VcblxuIyBbRklYTUVdIHZlcnkgcm91Z2ggc3RhdGUsIG5lZWQgaW1wcm92ZW1lbnQuXG5pc0Z1bmN0aW9uU2NvcGUgPSAoZWRpdG9yLCBzY29wZSkgLT5cbiAge3Njb3BlTmFtZX0gPSBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gIHN3aXRjaCBzY29wZU5hbWVcbiAgICB3aGVuICdzb3VyY2UuZ28nXG4gICAgICAvXmVudGl0eVxcLm5hbWVcXC5mdW5jdGlvbi8udGVzdChzY29wZSlcbiAgICBlbHNlXG4gICAgICAvXm1ldGFcXC5mdW5jdGlvblxcLi8udGVzdChzY29wZSlcblxuZ2V0U3RhcnRQb3NpdGlvbkZvclBhdHRlcm4gPSAoZWRpdG9yLCBmcm9tLCBwYXR0ZXJuLCBvcHRpb25zPXt9KSAtPlxuICBmcm9tID0gUG9pbnQuZnJvbU9iamVjdChmcm9tKVxuICBjb250YWluZWRPbmx5ID0gb3B0aW9ucy5jb250YWluZWRPbmx5ID8gZmFsc2VcbiAgc2NhblJhbmdlID0gW1tmcm9tLnJvdywgMF0sIGZyb21dXG4gIHBvaW50ID0gbnVsbFxuICBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe3JhbmdlLCBtYXRjaFRleHQsIHN0b3B9KSAtPlxuICAgICMgSWdub3JlICdlbXB0eSBsaW5lJyBtYXRjaGVzIGJldHdlZW4gJ1xccicgYW5kICdcXG4nXG4gICAgcmV0dXJuIGlmIG1hdGNoVGV4dCBpcyAnJyBhbmQgcmFuZ2Uuc3RhcnQuY29sdW1uIGlzbnQgMFxuXG4gICAgaWYgKG5vdCBjb250YWluZWRPbmx5KSBvciByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbk9yRXF1YWwoZnJvbSlcbiAgICAgIHBvaW50ID0gcmFuZ2Uuc3RhcnRcbiAgICAgIHN0b3AoKVxuICBwb2ludFxuXG5nZXRFbmRQb3NpdGlvbkZvclBhdHRlcm4gPSAoZWRpdG9yLCBmcm9tLCBwYXR0ZXJuLCBvcHRpb25zPXt9KSAtPlxuICBmcm9tID0gUG9pbnQuZnJvbU9iamVjdChmcm9tKVxuICBjb250YWluZWRPbmx5ID0gb3B0aW9ucy5jb250YWluZWRPbmx5ID8gZmFsc2VcbiAgc2NhblJhbmdlID0gW2Zyb20sIFtmcm9tLnJvdywgSW5maW5pdHldXVxuICBwb2ludCA9IG51bGxcbiAgZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBzdG9wfSkgLT5cbiAgICAjIElnbm9yZSAnZW1wdHkgbGluZScgbWF0Y2hlcyBiZXR3ZWVuICdcXHInIGFuZCAnXFxuJ1xuICAgIHJldHVybiBpZiBtYXRjaFRleHQgaXMgJycgYW5kIHJhbmdlLnN0YXJ0LmNvbHVtbiBpc250IDBcblxuICAgIGlmIChub3QgY29udGFpbmVkT25seSkgb3IgcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbk9yRXF1YWwoZnJvbSlcbiAgICAgIHBvaW50ID0gcmFuZ2UuZW5kXG4gICAgICBzdG9wKClcbiAgcG9pbnRcblxuZ2V0QnVmZmVyUmFuZ2VGb3JQYXR0ZXJuRnJvbVBvaW50ID0gKGVkaXRvciwgZnJvbVBvaW50LCBwYXR0ZXJuKSAtPlxuICBlbmQgPSBnZXRFbmRQb3NpdGlvbkZvclBhdHRlcm4oZWRpdG9yLCBmcm9tUG9pbnQsIHBhdHRlcm4sIGNvbnRhaW5lZE9ubHk6IHRydWUpXG4gIHN0YXJ0ID0gZ2V0U3RhcnRQb3NpdGlvbkZvclBhdHRlcm4oZWRpdG9yLCBlbmQsIHBhdHRlcm4sIGNvbnRhaW5lZE9ubHk6IHRydWUpIGlmIGVuZD9cbiAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpIGlmIHN0YXJ0P1xuXG5zb3J0Q29tcGFyYWJsZSA9IChjb2xsZWN0aW9uKSAtPlxuICBjb2xsZWN0aW9uLnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuXG4jIFNjcm9sbCB0byBidWZmZXJQb3NpdGlvbiB3aXRoIG1pbmltdW0gYW1vdW50IHRvIGtlZXAgb3JpZ2luYWwgdmlzaWJsZSBhcmVhLlxuIyBJZiB0YXJnZXQgcG9zaXRpb24gd29uJ3QgZml0IHdpdGhpbiBvbmVQYWdlVXAgb3Igb25lUGFnZURvd24sIGl0IGNlbnRlciB0YXJnZXQgcG9pbnQuXG5zbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgZWRpdG9yRWxlbWVudCA9IGVkaXRvci5lbGVtZW50XG4gIGVkaXRvckFyZWFIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAoZWRpdG9yLmdldFJvd3NQZXJQYWdlKCkgLSAxKVxuICBvbmVQYWdlVXAgPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbFRvcCgpIC0gZWRpdG9yQXJlYUhlaWdodCAjIE5vIG5lZWQgdG8gbGltaXQgdG8gbWluPTBcbiAgb25lUGFnZURvd24gPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbEJvdHRvbSgpICsgZWRpdG9yQXJlYUhlaWdodFxuICB0YXJnZXQgPSBlZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihwb2ludCkudG9wXG5cbiAgY2VudGVyID0gKG9uZVBhZ2VEb3duIDwgdGFyZ2V0KSBvciAodGFyZ2V0IDwgb25lUGFnZVVwKVxuICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihwb2ludCwge2NlbnRlcn0pXG5cbm1hdGNoU2NvcGVzID0gKGVkaXRvckVsZW1lbnQsIHNjb3BlcykgLT5cbiAgY2xhc3NlcyA9IHNjb3Blcy5tYXAgKHNjb3BlKSAtPiBzY29wZS5zcGxpdCgnLicpXG5cbiAgZm9yIGNsYXNzTmFtZXMgaW4gY2xhc3Nlc1xuICAgIGNvbnRhaW5zQ291bnQgPSAwXG4gICAgZm9yIGNsYXNzTmFtZSBpbiBjbGFzc05hbWVzXG4gICAgICBjb250YWluc0NvdW50ICs9IDEgaWYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKVxuICAgIHJldHVybiB0cnVlIGlmIGNvbnRhaW5zQ291bnQgaXMgY2xhc3NOYW1lcy5sZW5ndGhcbiAgZmFsc2VcblxuaXNTaW5nbGVMaW5lID0gKHRleHQpIC0+XG4gIHRleHQuc3BsaXQoL1xcbnxcXHJcXG4vKS5sZW5ndGggaXMgMVxuXG4jIFJldHVybiBidWZmZXJSYW5nZSBhbmQga2luZCBbJ3doaXRlLXNwYWNlJywgJ25vbi13b3JkJywgJ3dvcmQnXVxuI1xuIyBUaGlzIGZ1bmN0aW9uIG1vZGlmeSB3b3JkUmVnZXggc28gdGhhdCBpdCBmZWVsIE5BVFVSQUwgaW4gVmltJ3Mgbm9ybWFsIG1vZGUuXG4jIEluIG5vcm1hbC1tb2RlLCBjdXJzb3IgaXMgcmFjdGFuZ2xlKG5vdCBwaXBlKHwpIGNoYXIpLlxuIyBDdXJzb3IgaXMgbGlrZSBPTiB3b3JkIHJhdGhlciB0aGFuIEJFVFdFRU4gd29yZC5cbiMgVGhlIG1vZGlmaWNhdGlvbiBpcyB0YWlsb3JkIGxpa2UgdGhpc1xuIyAgIC0gT04gd2hpdGUtc3BhY2U6IEluY2x1ZHMgb25seSB3aGl0ZS1zcGFjZXMuXG4jICAgLSBPTiBub24td29yZDogSW5jbHVkcyBvbmx5IG5vbiB3b3JkIGNoYXIoPWV4Y2x1ZGVzIG5vcm1hbCB3b3JkIGNoYXIpLlxuI1xuIyBWYWxpZCBvcHRpb25zXG4jICAtIHdvcmRSZWdleDogaW5zdGFuY2Ugb2YgUmVnRXhwXG4jICAtIG5vbldvcmRDaGFyYWN0ZXJzOiBzdHJpbmdcbmdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uID0gKGVkaXRvciwgcG9pbnQsIG9wdGlvbnM9e30pIC0+XG4gIHtzaW5nbGVOb25Xb3JkQ2hhciwgd29yZFJlZ2V4LCBub25Xb3JkQ2hhcmFjdGVycywgY3Vyc29yfSA9IG9wdGlvbnNcbiAgaWYgbm90IHdvcmRSZWdleD8gYW5kIG5vdCBub25Xb3JkQ2hhcmFjdGVycz8gIyBDb21wbGVtZW50IGZyb20gY3Vyc29yXG4gICAgY3Vyc29yID89IGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICB7d29yZFJlZ2V4LCBub25Xb3JkQ2hhcmFjdGVyc30gPSBfLmV4dGVuZChvcHRpb25zLCBidWlsZFdvcmRQYXR0ZXJuQnlDdXJzb3IoY3Vyc29yLCBvcHRpb25zKSlcbiAgc2luZ2xlTm9uV29yZENoYXIgPz0gZmFsc2VcblxuICBjaGFyYWN0ZXJBdFBvaW50ID0gZ2V0Q2hhcmFjdGVyQXRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIHBvaW50KVxuICBub25Xb3JkUmVnZXggPSBuZXcgUmVnRXhwKFwiWyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXCIpXG5cbiAgaWYgL1xccy8udGVzdChjaGFyYWN0ZXJBdFBvaW50KVxuICAgIHNvdXJjZSA9IFwiW1xcdCBdK1wiXG4gICAga2luZCA9ICd3aGl0ZS1zcGFjZSdcbiAgICB3b3JkUmVnZXggPSBuZXcgUmVnRXhwKHNvdXJjZSlcbiAgZWxzZSBpZiBub25Xb3JkUmVnZXgudGVzdChjaGFyYWN0ZXJBdFBvaW50KSBhbmQgbm90IHdvcmRSZWdleC50ZXN0KGNoYXJhY3RlckF0UG9pbnQpXG4gICAga2luZCA9ICdub24td29yZCdcbiAgICBpZiBzaW5nbGVOb25Xb3JkQ2hhclxuICAgICAgc291cmNlID0gXy5lc2NhcGVSZWdFeHAoY2hhcmFjdGVyQXRQb2ludClcbiAgICAgIHdvcmRSZWdleCA9IG5ldyBSZWdFeHAoc291cmNlKVxuICAgIGVsc2VcbiAgICAgIHdvcmRSZWdleCA9IG5vbldvcmRSZWdleFxuICBlbHNlXG4gICAga2luZCA9ICd3b3JkJ1xuXG4gIHJhbmdlID0gZ2V0V29yZEJ1ZmZlclJhbmdlQXRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIHBvaW50LCB7d29yZFJlZ2V4fSlcbiAge2tpbmQsIHJhbmdlfVxuXG5nZXRXb3JkUGF0dGVybkF0QnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCBwb2ludCwgb3B0aW9ucz17fSkgLT5cbiAge3JhbmdlLCBraW5kfSA9IGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgcG9pbnQsIG9wdGlvbnMpXG4gIHBhdHRlcm4gPSBfLmVzY2FwZVJlZ0V4cChlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuICBpZiBraW5kIGlzICd3b3JkJ1xuICAgIHBhdHRlcm4gPSBcIlxcXFxiXCIgKyBwYXR0ZXJuICsgXCJcXFxcYlwiXG4gIG5ldyBSZWdFeHAocGF0dGVybiwgJ2cnKVxuXG4jIFJldHVybiBvcHRpb25zIHVzZWQgZm9yIGdldFdvcmRCdWZmZXJSYW5nZUF0QnVmZmVyUG9zaXRpb25cbmJ1aWxkV29yZFBhdHRlcm5CeUN1cnNvciA9IChjdXJzb3IsIHt3b3JkUmVnZXh9KSAtPlxuICBub25Xb3JkQ2hhcmFjdGVycyA9IGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgd29yZFJlZ2V4ID89IG5ldyBSZWdFeHAoXCJeW1xcdCBdKiR8W15cXFxccyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXCIpXG4gIHt3b3JkUmVnZXgsIG5vbldvcmRDaGFyYWN0ZXJzfVxuXG5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlQW5kS2luZCA9IChjdXJzb3IsIG9wdGlvbnM9e30pIC0+XG4gIGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uKGN1cnNvci5lZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLCBvcHRpb25zKVxuXG5nZXRCZWdpbm5pbmdPZldvcmRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvaW50LCB7d29yZFJlZ2V4fT17fSkgLT5cbiAgc2NhblJhbmdlID0gW1twb2ludC5yb3csIDBdLCBwb2ludF1cblxuICBmb3VuZCA9IG51bGxcbiAgZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHdvcmRSZWdleCwgc2NhblJhbmdlLCAoe3JhbmdlLCBtYXRjaFRleHQsIHN0b3B9KSAtPlxuICAgIHJldHVybiBpZiBtYXRjaFRleHQgaXMgJycgYW5kIHJhbmdlLnN0YXJ0LmNvbHVtbiBpc250IDBcblxuICAgIGlmIHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4ocG9pbnQpXG4gICAgICBpZiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbk9yRXF1YWwocG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2Uuc3RhcnRcbiAgICAgIHN0b3AoKVxuXG4gIGZvdW5kID8gcG9pbnRcblxuZ2V0RW5kT2ZXb3JkQnVmZmVyUG9zaXRpb24gPSAoZWRpdG9yLCBwb2ludCwge3dvcmRSZWdleH09e30pIC0+XG4gIHNjYW5SYW5nZSA9IFtwb2ludCwgW3BvaW50LnJvdywgSW5maW5pdHldXVxuXG4gIGZvdW5kID0gbnVsbFxuICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2Ugd29yZFJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIG1hdGNoVGV4dCwgc3RvcH0pIC0+XG4gICAgcmV0dXJuIGlmIG1hdGNoVGV4dCBpcyAnJyBhbmQgcmFuZ2Uuc3RhcnQuY29sdW1uIGlzbnQgMFxuXG4gICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4ocG9pbnQpXG4gICAgICBpZiByYW5nZS5zdGFydC5pc0xlc3NUaGFuT3JFcXVhbChwb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZS5lbmRcbiAgICAgIHN0b3AoKVxuXG4gIGZvdW5kID8gcG9pbnRcblxuZ2V0V29yZEJ1ZmZlclJhbmdlQXRCdWZmZXJQb3NpdGlvbiA9IChlZGl0b3IsIHBvc2l0aW9uLCBvcHRpb25zPXt9KSAtPlxuICBzdGFydFBvc2l0aW9uID0gZ2V0QmVnaW5uaW5nT2ZXb3JkQnVmZmVyUG9zaXRpb24oZWRpdG9yLCBwb3NpdGlvbiwgb3B0aW9ucylcbiAgZW5kUG9zaXRpb24gPSBnZXRFbmRPZldvcmRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIHN0YXJ0UG9zaXRpb24sIG9wdGlvbnMpXG4gIG5ldyBSYW5nZShzdGFydFBvc2l0aW9uLCBlbmRQb3NpdGlvbilcblxuYWRqdXN0UmFuZ2VUb1Jvd1JhbmdlID0gKHtzdGFydCwgZW5kfSwgb3B0aW9ucz17fSkgLT5cbiAgIyB3aGVuIGxpbmV3aXNlLCBlbmQgcm93IGlzIGF0IGNvbHVtbiAwIG9mIE5FWFQgbGluZVxuICAjIFNvIG5lZWQgYWRqdXN0IHRvIGFjdHVhbGx5IHNlbGVjdGVkIHJvdyBpbiBzYW1lIHdheSBhcyBTZWxlY2l0b246OmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgZW5kUm93ID0gZW5kLnJvd1xuICBpZiBlbmQuY29sdW1uIGlzIDBcbiAgICBlbmRSb3cgPSBNYXRoLm1heChzdGFydC5yb3csIGVuZC5yb3cgLSAxKVxuICBpZiBvcHRpb25zLmVuZE9ubHkgPyBmYWxzZVxuICAgIG5ldyBSYW5nZShzdGFydCwgW2VuZFJvdywgSW5maW5pdHldKVxuICBlbHNlXG4gICAgbmV3IFJhbmdlKFtzdGFydC5yb3csIDBdLCBbZW5kUm93LCBJbmZpbml0eV0pXG5cbiMgV2hlbiByYW5nZSBpcyBsaW5ld2lzZSByYW5nZSwgcmFuZ2UgZW5kIGhhdmUgY29sdW1uIDAgb2YgTkVYVCByb3cuXG4jIFdoaWNoIGlzIHZlcnkgdW5pbnR1aXRpdmUgYW5kIHVud2FudGVkIHJlc3VsdC5cbnNocmlua1JhbmdlRW5kVG9CZWZvcmVOZXdMaW5lID0gKHJhbmdlKSAtPlxuICB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICBpZiBlbmQuY29sdW1uIGlzIDBcbiAgICBlbmRSb3cgPSBNYXRoLm1heChzdGFydC5yb3csIGVuZC5yb3cgLSAxKVxuICAgIG5ldyBSYW5nZShzdGFydCwgW2VuZFJvdywgSW5maW5pdHldKVxuICBlbHNlXG4gICAgcmFuZ2Vcblxuc2NhbkluUmFuZ2VzID0gKGVkaXRvciwgcGF0dGVybiwgc2NhblJhbmdlcywge2luY2x1ZGVJbnRlcnNlY3RzLCBleGNsdXNpdmVJbnRlcnNlY3RzfT17fSkgLT5cbiAgaWYgaW5jbHVkZUludGVyc2VjdHNcbiAgICBvcmlnaW5hbFNjYW5SYW5nZXMgPSBzY2FuUmFuZ2VzLnNsaWNlKClcblxuICAgICMgV2UgbmVlZCB0byBzY2FuIGVhY2ggd2hvbGUgcm93IHRvIGZpbmQgaW50ZXJzZWN0cy5cbiAgICBzY2FuUmFuZ2VzID0gc2NhblJhbmdlcy5tYXAoYWRqdXN0UmFuZ2VUb1Jvd1JhbmdlKVxuICAgIGlzSW50ZXJzZWN0cyA9ICh7cmFuZ2UsIHNjYW5SYW5nZX0pIC0+XG4gICAgICAjIGV4Y2x1c2l2ZUludGVyc2VjdHMgc2V0IHRydWUgaW4gdmlzdWFsLW1vZGVcbiAgICAgIHNjYW5SYW5nZS5pbnRlcnNlY3RzV2l0aChyYW5nZSwgZXhjbHVzaXZlSW50ZXJzZWN0cylcblxuICByYW5nZXMgPSBbXVxuICBmb3Igc2NhblJhbmdlLCBpIGluIHNjYW5SYW5nZXNcbiAgICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe3JhbmdlfSkgLT5cbiAgICAgIGlmIGluY2x1ZGVJbnRlcnNlY3RzXG4gICAgICAgIGlmIGlzSW50ZXJzZWN0cyh7cmFuZ2UsIHNjYW5SYW5nZTogb3JpZ2luYWxTY2FuUmFuZ2VzW2ldfSlcbiAgICAgICAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2VzLnB1c2gocmFuZ2UpXG4gIHJhbmdlc1xuXG5zY2FuRWRpdG9yID0gKGVkaXRvciwgcGF0dGVybikgLT5cbiAgcmFuZ2VzID0gW11cbiAgZWRpdG9yLnNjYW4gcGF0dGVybiwgKHtyYW5nZX0pIC0+XG4gICAgcmFuZ2VzLnB1c2gocmFuZ2UpXG4gIHJhbmdlc1xuXG5pc1JhbmdlQ29udGFpbnNTb21lUG9pbnQgPSAocmFuZ2UsIHBvaW50cywge2V4Y2x1c2l2ZX09e30pIC0+XG4gIGV4Y2x1c2l2ZSA/PSBmYWxzZVxuICBwb2ludHMuc29tZSAocG9pbnQpIC0+XG4gICAgcmFuZ2UuY29udGFpbnNQb2ludChwb2ludCwgZXhjbHVzaXZlKVxuXG5kZXN0cm95Tm9uTGFzdFNlbGVjdGlvbiA9IChlZGl0b3IpIC0+XG4gIGZvciBzZWxlY3Rpb24gaW4gZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIG5vdCBzZWxlY3Rpb24uaXNMYXN0U2VsZWN0aW9uKClcbiAgICBzZWxlY3Rpb24uZGVzdHJveSgpXG5cbmdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvdyA9IChlZGl0b3IsIHJvdykgLT5cbiAgbWFya2VycyA9IGVkaXRvci5kaXNwbGF5TGF5ZXIuZmluZEZvbGRNYXJrZXJzKGludGVyc2VjdHNSb3c6IHJvdylcblxuICBzdGFydFBvaW50ID0gbnVsbFxuICBlbmRQb2ludCA9IG51bGxcblxuICBmb3IgbWFya2VyIGluIG1hcmtlcnMgPyBbXVxuICAgIHtzdGFydCwgZW5kfSA9IG1hcmtlci5nZXRSYW5nZSgpXG4gICAgdW5sZXNzIHN0YXJ0UG9pbnRcbiAgICAgIHN0YXJ0UG9pbnQgPSBzdGFydFxuICAgICAgZW5kUG9pbnQgPSBlbmRcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBpZiBzdGFydC5pc0xlc3NUaGFuKHN0YXJ0UG9pbnQpXG4gICAgICBzdGFydFBvaW50ID0gc3RhcnRcbiAgICAgIGVuZFBvaW50ID0gZW5kXG5cbiAgaWYgc3RhcnRQb2ludD8gYW5kIGVuZFBvaW50P1xuICAgIG5ldyBSYW5nZShzdGFydFBvaW50LCBlbmRQb2ludClcblxudHJhbnNsYXRlUG9pbnRBbmRDbGlwID0gKGVkaXRvciwgcG9pbnQsIGRpcmVjdGlvbiwge3RyYW5zbGF0ZX09e30pIC0+XG4gIHRyYW5zbGF0ZSA/PSB0cnVlXG4gIHBvaW50ID0gUG9pbnQuZnJvbU9iamVjdChwb2ludClcblxuICBkb250Q2xpcCA9IGZhbHNlXG4gIHN3aXRjaCBkaXJlY3Rpb25cbiAgICB3aGVuICdmb3J3YXJkJ1xuICAgICAgcG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsICsxXSkgaWYgdHJhbnNsYXRlXG4gICAgICBlb2wgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocG9pbnQucm93KS5lbmRcblxuICAgICAgaWYgcG9pbnQuaXNFcXVhbChlb2wpXG4gICAgICAgIGRvbnRDbGlwID0gdHJ1ZVxuXG4gICAgICBpZiBwb2ludC5pc0dyZWF0ZXJUaGFuKGVvbClcbiAgICAgICAgcG9pbnQgPSBuZXcgUG9pbnQocG9pbnQucm93ICsgMSwgMClcbiAgICAgICAgZG9udENsaXAgPSB0cnVlXG5cbiAgICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKSlcblxuICAgIHdoZW4gJ2JhY2t3YXJkJ1xuICAgICAgcG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsIC0xXSkgaWYgdHJhbnNsYXRlXG5cbiAgICAgIGlmIHBvaW50LmNvbHVtbiA8IDBcbiAgICAgICAgbmV3Um93ID0gcG9pbnQucm93IC0gMVxuICAgICAgICBlb2wgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cobmV3Um93KS5lbmRcbiAgICAgICAgcG9pbnQgPSBuZXcgUG9pbnQobmV3Um93LCBlb2wuY29sdW1uKVxuXG4gICAgICBwb2ludCA9IFBvaW50Lm1heChwb2ludCwgUG9pbnQuWkVSTylcblxuICBpZiBkb250Q2xpcFxuICAgIHBvaW50XG4gIGVsc2VcbiAgICBzY3JlZW5Qb2ludCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKHBvaW50LCBjbGlwRGlyZWN0aW9uOiBkaXJlY3Rpb24pXG4gICAgZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9pbnQpXG5cbmdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXAgPSAoZWRpdG9yLCByYW5nZSwgd2hpY2gsIGRpcmVjdGlvbiwgb3B0aW9ucykgLT5cbiAgbmV3UG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoZWRpdG9yLCByYW5nZVt3aGljaF0sIGRpcmVjdGlvbiwgb3B0aW9ucylcbiAgc3dpdGNoIHdoaWNoXG4gICAgd2hlbiAnc3RhcnQnXG4gICAgICBuZXcgUmFuZ2UobmV3UG9pbnQsIHJhbmdlLmVuZClcbiAgICB3aGVuICdlbmQnXG4gICAgICBuZXcgUmFuZ2UocmFuZ2Uuc3RhcnQsIG5ld1BvaW50KVxuXG4jIFJlbG9hZGFibGUgcmVnaXN0ZXJFbGVtZW50XG5yZWdpc3RlckVsZW1lbnQgPSAobmFtZSwgb3B0aW9ucykgLT5cbiAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSlcbiAgIyBpZiBjb25zdHJ1Y3RvciBpcyBIVE1MRWxlbWVudCwgd2UgaGF2ZW4ndCByZWdpc3RlcmQgeWV0XG4gIGlmIGVsZW1lbnQuY29uc3RydWN0b3IgaXMgSFRNTEVsZW1lbnRcbiAgICBFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIG9wdGlvbnMpXG4gIGVsc2VcbiAgICBFbGVtZW50ID0gZWxlbWVudC5jb25zdHJ1Y3RvclxuICAgIEVsZW1lbnQucHJvdG90eXBlID0gb3B0aW9ucy5wcm90b3R5cGUgaWYgb3B0aW9ucy5wcm90b3R5cGU/XG4gIEVsZW1lbnRcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldFBhcmVudFxuICBnZXRBbmNlc3RvcnNcbiAgZ2V0S2V5QmluZGluZ0ZvckNvbW1hbmRcbiAgaW5jbHVkZVxuICBkZWJ1Z1xuICBzYXZlRWRpdG9yU3RhdGVcbiAgc2F2ZUN1cnNvclBvc2l0aW9uc1xuICBnZXRLZXlzdHJva2VGb3JFdmVudFxuICBnZXRDaGFyYWN0ZXJGb3JFdmVudFxuICBpc0xpbmV3aXNlUmFuZ2VcbiAgaXNFbmRzV2l0aE5ld0xpbmVGb3JCdWZmZXJSb3dcbiAgaGF2ZVNvbWVOb25FbXB0eVNlbGVjdGlvblxuICBzb3J0UmFuZ2VzXG4gIHNvcnRSYW5nZXNCeUVuZFBvc2l0aW9uXG4gIGdldEluZGV4XG4gIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICB3aXRoVmlzaWJsZUJ1ZmZlclJhbmdlXG4gIGdldFZpc2libGVFZGl0b3JzXG4gIGZpbmRJbmRleEJ5XG4gIG1lcmdlSW50ZXJzZWN0aW5nUmFuZ2VzXG4gIHBvaW50SXNBdEVuZE9mTGluZVxuICBwb2ludElzQXRWaW1FbmRPZkZpbGVcbiAgY3Vyc29ySXNBdFZpbUVuZE9mRmlsZVxuICBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvblxuICBnZXRWaW1Fb2ZTY3JlZW5Qb3NpdGlvblxuICBnZXRWaW1MYXN0QnVmZmVyUm93XG4gIGdldFZpbUxhc3RTY3JlZW5Sb3dcbiAgbW92ZUN1cnNvckxlZnRcbiAgbW92ZUN1cnNvclJpZ2h0XG4gIG1vdmVDdXJzb3JVcFNjcmVlblxuICBtb3ZlQ3Vyc29yRG93blNjcmVlblxuICBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3dcbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93XG4gIGdldExhc3RWaXNpYmxlU2NyZWVuUm93XG4gIGhpZ2hsaWdodFJhbmdlc1xuICBoaWdobGlnaHRSYW5nZVxuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICBnZXRWYWxpZFZpbVNjcmVlblJvd1xuICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93XG4gIGNvdW50Q2hhclxuICBnZXRUZXh0VG9Qb2ludFxuICBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvd1xuICBpc0FsbFdoaXRlU3BhY2VcbiAgZ2V0Q2hhcmFjdGVyQXRDdXJzb3JcbiAgZ2V0VGV4dEluU2NyZWVuUmFuZ2VcbiAgY3Vyc29ySXNPbldoaXRlU3BhY2VcbiAgc2NyZWVuUG9zaXRpb25Jc0F0V2hpdGVTcGFjZVxuICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZVxuICBpc0VtcHR5Um93XG4gIGN1cnNvcklzQXRFbXB0eVJvd1xuICBjdXJzb3JJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvd1xuICBnZXRDb2RlRm9sZFJvd1Jhbmdlc1xuICBnZXRDb2RlRm9sZFJvd1Jhbmdlc0NvbnRhaW5lc0ZvclJvd1xuICBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlXG4gIGdldEZpcnN0Q2hhcmFjdGVyQ29sdW1Gb3JCdWZmZXJSb3dcbiAgdHJpbVJhbmdlXG4gIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3dcbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJCdWZmZXJQb3NpdGlvbkZvclNjcmVlblJvd1xuICBjdXJzb3JJc0F0Rmlyc3RDaGFyYWN0ZXJcbiAgaXNGdW5jdGlvblNjb3BlXG4gIGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuXG4gIGdldEVuZFBvc2l0aW9uRm9yUGF0dGVyblxuICBpc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93XG4gIGdldFRva2VuaXplZExpbmVGb3JSb3dcbiAgZ2V0U2NvcGVzRm9yVG9rZW5pemVkTGluZVxuICBzY2FuRm9yU2NvcGVTdGFydFxuICBkZXRlY3RTY29wZVN0YXJ0UG9zaXRpb25Gb3JTY29wZVxuICBnZXRCdWZmZXJSb3dzXG4gIGdldFBhcmFncmFwaEJvdW5kYXJ5Um93XG4gIHJlZ2lzdGVyRWxlbWVudFxuICBnZXRCdWZmZXJSYW5nZUZvclBhdHRlcm5Gcm9tUG9pbnRcbiAgc29ydENvbXBhcmFibGVcbiAgc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uXG4gIG1hdGNoU2NvcGVzXG4gIG1vdmVDdXJzb3JEb3duQnVmZmVyXG4gIG1vdmVDdXJzb3JVcEJ1ZmZlclxuICBpc1NpbmdsZUxpbmVcbiAgZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRcbiAgYnVpbGRXb3JkUGF0dGVybkJ5Q3Vyc29yXG4gIGdldFdvcmRCdWZmZXJSYW5nZUF0QnVmZmVyUG9zaXRpb25cbiAgZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb25cbiAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uXG4gIGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yXG4gIGFkanVzdFJhbmdlVG9Sb3dSYW5nZVxuICBzaHJpbmtSYW5nZUVuZFRvQmVmb3JlTmV3TGluZVxuICBzY2FuSW5SYW5nZXNcbiAgc2NhbkVkaXRvclxuICBpc1JhbmdlQ29udGFpbnNTb21lUG9pbnRcbiAgZGVzdHJveU5vbkxhc3RTZWxlY3Rpb25cbiAgZ2V0TGFyZ2VzdEZvbGRSYW5nZUNvbnRhaW5zQnVmZmVyUm93XG4gIHRyYW5zbGF0ZVBvaW50QW5kQ2xpcFxuICBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwXG59XG4iXX0=
