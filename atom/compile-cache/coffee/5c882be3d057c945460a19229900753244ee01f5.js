(function() {
  var Grim, copyPathToClipboard, ipcRenderer, showCursorScope, stopEventPropagation, stopEventPropagationAndGroupUndo;

  ipcRenderer = require('electron').ipcRenderer;

  Grim = require('grim');

  module.exports = function(arg) {
    var clipboard, commandInstaller, commandRegistry, config, notificationManager, project;
    commandRegistry = arg.commandRegistry, commandInstaller = arg.commandInstaller, config = arg.config, notificationManager = arg.notificationManager, project = arg.project, clipboard = arg.clipboard;
    commandRegistry.add('atom-workspace', {
      'pane:show-next-recently-used-item': function() {
        return this.getModel().getActivePane().activateNextRecentlyUsedItem();
      },
      'pane:show-previous-recently-used-item': function() {
        return this.getModel().getActivePane().activatePreviousRecentlyUsedItem();
      },
      'pane:move-active-item-to-top-of-stack': function() {
        return this.getModel().getActivePane().moveActiveItemToTopOfStack();
      },
      'pane:show-next-item': function() {
        return this.getModel().getActivePane().activateNextItem();
      },
      'pane:show-previous-item': function() {
        return this.getModel().getActivePane().activatePreviousItem();
      },
      'pane:show-item-1': function() {
        return this.getModel().getActivePane().activateItemAtIndex(0);
      },
      'pane:show-item-2': function() {
        return this.getModel().getActivePane().activateItemAtIndex(1);
      },
      'pane:show-item-3': function() {
        return this.getModel().getActivePane().activateItemAtIndex(2);
      },
      'pane:show-item-4': function() {
        return this.getModel().getActivePane().activateItemAtIndex(3);
      },
      'pane:show-item-5': function() {
        return this.getModel().getActivePane().activateItemAtIndex(4);
      },
      'pane:show-item-6': function() {
        return this.getModel().getActivePane().activateItemAtIndex(5);
      },
      'pane:show-item-7': function() {
        return this.getModel().getActivePane().activateItemAtIndex(6);
      },
      'pane:show-item-8': function() {
        return this.getModel().getActivePane().activateItemAtIndex(7);
      },
      'pane:show-item-9': function() {
        return this.getModel().getActivePane().activateLastItem();
      },
      'pane:move-item-right': function() {
        return this.getModel().getActivePane().moveItemRight();
      },
      'pane:move-item-left': function() {
        return this.getModel().getActivePane().moveItemLeft();
      },
      'window:increase-font-size': function() {
        return this.getModel().increaseFontSize();
      },
      'window:decrease-font-size': function() {
        return this.getModel().decreaseFontSize();
      },
      'window:reset-font-size': function() {
        return this.getModel().resetFontSize();
      },
      'application:about': function() {
        return ipcRenderer.send('command', 'application:about');
      },
      'application:show-preferences': function() {
        return ipcRenderer.send('command', 'application:show-settings');
      },
      'application:show-settings': function() {
        return ipcRenderer.send('command', 'application:show-settings');
      },
      'application:quit': function() {
        return ipcRenderer.send('command', 'application:quit');
      },
      'application:hide': function() {
        return ipcRenderer.send('command', 'application:hide');
      },
      'application:hide-other-applications': function() {
        return ipcRenderer.send('command', 'application:hide-other-applications');
      },
      'application:install-update': function() {
        return ipcRenderer.send('command', 'application:install-update');
      },
      'application:unhide-all-applications': function() {
        return ipcRenderer.send('command', 'application:unhide-all-applications');
      },
      'application:new-window': function() {
        return ipcRenderer.send('command', 'application:new-window');
      },
      'application:new-file': function() {
        return ipcRenderer.send('command', 'application:new-file');
      },
      'application:open': function() {
        var defaultPath, ref, ref1, ref2;
        defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
        return ipcRenderer.send('open-command', 'application:open', defaultPath);
      },
      'application:open-file': function() {
        var defaultPath, ref, ref1, ref2;
        defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
        return ipcRenderer.send('open-command', 'application:open-file', defaultPath);
      },
      'application:open-folder': function() {
        var defaultPath, ref, ref1, ref2;
        defaultPath = (ref = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0) != null ? ref : (ref2 = atom.project.getPaths()) != null ? ref2[0] : void 0;
        return ipcRenderer.send('open-command', 'application:open-folder', defaultPath);
      },
      'application:open-dev': function() {
        return ipcRenderer.send('command', 'application:open-dev');
      },
      'application:open-safe': function() {
        return ipcRenderer.send('command', 'application:open-safe');
      },
      'application:add-project-folder': function() {
        return atom.addProjectFolder();
      },
      'application:minimize': function() {
        return ipcRenderer.send('command', 'application:minimize');
      },
      'application:zoom': function() {
        return ipcRenderer.send('command', 'application:zoom');
      },
      'application:bring-all-windows-to-front': function() {
        return ipcRenderer.send('command', 'application:bring-all-windows-to-front');
      },
      'application:open-your-config': function() {
        return ipcRenderer.send('command', 'application:open-your-config');
      },
      'application:open-your-init-script': function() {
        return ipcRenderer.send('command', 'application:open-your-init-script');
      },
      'application:open-your-keymap': function() {
        return ipcRenderer.send('command', 'application:open-your-keymap');
      },
      'application:open-your-snippets': function() {
        return ipcRenderer.send('command', 'application:open-your-snippets');
      },
      'application:open-your-stylesheet': function() {
        return ipcRenderer.send('command', 'application:open-your-stylesheet');
      },
      'application:open-license': function() {
        return this.getModel().openLicense();
      },
      'window:run-package-specs': function() {
        return this.runPackageSpecs();
      },
      'window:run-benchmarks': function() {
        return this.runBenchmarks();
      },
      'window:focus-next-pane': function() {
        return this.getModel().activateNextPane();
      },
      'window:focus-previous-pane': function() {
        return this.getModel().activatePreviousPane();
      },
      'window:focus-pane-above': function() {
        return this.focusPaneViewAbove();
      },
      'window:focus-pane-below': function() {
        return this.focusPaneViewBelow();
      },
      'window:focus-pane-on-left': function() {
        return this.focusPaneViewOnLeft();
      },
      'window:focus-pane-on-right': function() {
        return this.focusPaneViewOnRight();
      },
      'window:move-active-item-to-pane-above': function() {
        return this.moveActiveItemToPaneAbove();
      },
      'window:move-active-item-to-pane-below': function() {
        return this.moveActiveItemToPaneBelow();
      },
      'window:move-active-item-to-pane-on-left': function() {
        return this.moveActiveItemToPaneOnLeft();
      },
      'window:move-active-item-to-pane-on-right': function() {
        return this.moveActiveItemToPaneOnRight();
      },
      'window:copy-active-item-to-pane-above': function() {
        return this.moveActiveItemToPaneAbove({
          keepOriginal: true
        });
      },
      'window:copy-active-item-to-pane-below': function() {
        return this.moveActiveItemToPaneBelow({
          keepOriginal: true
        });
      },
      'window:copy-active-item-to-pane-on-left': function() {
        return this.moveActiveItemToPaneOnLeft({
          keepOriginal: true
        });
      },
      'window:copy-active-item-to-pane-on-right': function() {
        return this.moveActiveItemToPaneOnRight({
          keepOriginal: true
        });
      },
      'window:save-all': function() {
        return this.getModel().saveAll();
      },
      'window:toggle-invisibles': function() {
        return config.set("editor.showInvisibles", !config.get("editor.showInvisibles"));
      },
      'window:log-deprecation-warnings': function() {
        return Grim.logDeprecations();
      },
      'window:toggle-auto-indent': function() {
        return config.set("editor.autoIndent", !config.get("editor.autoIndent"));
      },
      'pane:reopen-closed-item': function() {
        return this.getModel().reopenItem();
      },
      'core:close': function() {
        return this.getModel().closeActivePaneItemOrEmptyPaneOrWindow();
      },
      'core:save': function() {
        return this.getModel().saveActivePaneItem();
      },
      'core:save-as': function() {
        return this.getModel().saveActivePaneItemAs();
      }
    });
    if (process.platform === 'darwin') {
      commandRegistry.add('atom-workspace', 'window:install-shell-commands', function() {
        return commandInstaller.installShellCommandsInteractively();
      });
    }
    commandRegistry.add('atom-pane', {
      'pane:save-items': function() {
        return this.getModel().saveItems();
      },
      'pane:split-left': function() {
        return this.getModel().splitLeft();
      },
      'pane:split-right': function() {
        return this.getModel().splitRight();
      },
      'pane:split-up': function() {
        return this.getModel().splitUp();
      },
      'pane:split-down': function() {
        return this.getModel().splitDown();
      },
      'pane:split-left-and-copy-active-item': function() {
        return this.getModel().splitLeft({
          copyActiveItem: true
        });
      },
      'pane:split-right-and-copy-active-item': function() {
        return this.getModel().splitRight({
          copyActiveItem: true
        });
      },
      'pane:split-up-and-copy-active-item': function() {
        return this.getModel().splitUp({
          copyActiveItem: true
        });
      },
      'pane:split-down-and-copy-active-item': function() {
        return this.getModel().splitDown({
          copyActiveItem: true
        });
      },
      'pane:split-left-and-move-active-item': function() {
        return this.getModel().splitLeft({
          moveActiveItem: true
        });
      },
      'pane:split-right-and-move-active-item': function() {
        return this.getModel().splitRight({
          moveActiveItem: true
        });
      },
      'pane:split-up-and-move-active-item': function() {
        return this.getModel().splitUp({
          moveActiveItem: true
        });
      },
      'pane:split-down-and-move-active-item': function() {
        return this.getModel().splitDown({
          moveActiveItem: true
        });
      },
      'pane:close': function() {
        return this.getModel().close();
      },
      'pane:close-other-items': function() {
        return this.getModel().destroyInactiveItems();
      },
      'pane:increase-size': function() {
        return this.getModel().increaseSize();
      },
      'pane:decrease-size': function() {
        return this.getModel().decreaseSize();
      }
    });
    commandRegistry.add('atom-text-editor', stopEventPropagation({
      'core:undo': function() {
        return this.undo();
      },
      'core:redo': function() {
        return this.redo();
      },
      'core:move-left': function() {
        return this.moveLeft();
      },
      'core:move-right': function() {
        return this.moveRight();
      },
      'core:select-left': function() {
        return this.selectLeft();
      },
      'core:select-right': function() {
        return this.selectRight();
      },
      'core:select-up': function() {
        return this.selectUp();
      },
      'core:select-down': function() {
        return this.selectDown();
      },
      'core:select-all': function() {
        return this.selectAll();
      },
      'editor:select-word': function() {
        return this.selectWordsContainingCursors();
      },
      'editor:consolidate-selections': function(event) {
        if (!this.consolidateSelections()) {
          return event.abortKeyBinding();
        }
      },
      'editor:move-to-beginning-of-next-paragraph': function() {
        return this.moveToBeginningOfNextParagraph();
      },
      'editor:move-to-beginning-of-previous-paragraph': function() {
        return this.moveToBeginningOfPreviousParagraph();
      },
      'editor:move-to-beginning-of-screen-line': function() {
        return this.moveToBeginningOfScreenLine();
      },
      'editor:move-to-beginning-of-line': function() {
        return this.moveToBeginningOfLine();
      },
      'editor:move-to-end-of-screen-line': function() {
        return this.moveToEndOfScreenLine();
      },
      'editor:move-to-end-of-line': function() {
        return this.moveToEndOfLine();
      },
      'editor:move-to-first-character-of-line': function() {
        return this.moveToFirstCharacterOfLine();
      },
      'editor:move-to-beginning-of-word': function() {
        return this.moveToBeginningOfWord();
      },
      'editor:move-to-end-of-word': function() {
        return this.moveToEndOfWord();
      },
      'editor:move-to-beginning-of-next-word': function() {
        return this.moveToBeginningOfNextWord();
      },
      'editor:move-to-previous-word-boundary': function() {
        return this.moveToPreviousWordBoundary();
      },
      'editor:move-to-next-word-boundary': function() {
        return this.moveToNextWordBoundary();
      },
      'editor:move-to-previous-subword-boundary': function() {
        return this.moveToPreviousSubwordBoundary();
      },
      'editor:move-to-next-subword-boundary': function() {
        return this.moveToNextSubwordBoundary();
      },
      'editor:select-to-beginning-of-next-paragraph': function() {
        return this.selectToBeginningOfNextParagraph();
      },
      'editor:select-to-beginning-of-previous-paragraph': function() {
        return this.selectToBeginningOfPreviousParagraph();
      },
      'editor:select-to-end-of-line': function() {
        return this.selectToEndOfLine();
      },
      'editor:select-to-beginning-of-line': function() {
        return this.selectToBeginningOfLine();
      },
      'editor:select-to-end-of-word': function() {
        return this.selectToEndOfWord();
      },
      'editor:select-to-beginning-of-word': function() {
        return this.selectToBeginningOfWord();
      },
      'editor:select-to-beginning-of-next-word': function() {
        return this.selectToBeginningOfNextWord();
      },
      'editor:select-to-next-word-boundary': function() {
        return this.selectToNextWordBoundary();
      },
      'editor:select-to-previous-word-boundary': function() {
        return this.selectToPreviousWordBoundary();
      },
      'editor:select-to-next-subword-boundary': function() {
        return this.selectToNextSubwordBoundary();
      },
      'editor:select-to-previous-subword-boundary': function() {
        return this.selectToPreviousSubwordBoundary();
      },
      'editor:select-to-first-character-of-line': function() {
        return this.selectToFirstCharacterOfLine();
      },
      'editor:select-line': function() {
        return this.selectLinesContainingCursors();
      }
    }));
    commandRegistry.add('atom-text-editor', stopEventPropagationAndGroupUndo(config, {
      'core:backspace': function() {
        return this.backspace();
      },
      'core:delete': function() {
        return this["delete"]();
      },
      'core:cut': function() {
        return this.cutSelectedText();
      },
      'core:copy': function() {
        return this.copySelectedText();
      },
      'core:paste': function() {
        return this.pasteText();
      },
      'editor:delete-to-previous-word-boundary': function() {
        return this.deleteToPreviousWordBoundary();
      },
      'editor:delete-to-next-word-boundary': function() {
        return this.deleteToNextWordBoundary();
      },
      'editor:delete-to-beginning-of-word': function() {
        return this.deleteToBeginningOfWord();
      },
      'editor:delete-to-beginning-of-line': function() {
        return this.deleteToBeginningOfLine();
      },
      'editor:delete-to-end-of-line': function() {
        return this.deleteToEndOfLine();
      },
      'editor:delete-to-end-of-word': function() {
        return this.deleteToEndOfWord();
      },
      'editor:delete-to-beginning-of-subword': function() {
        return this.deleteToBeginningOfSubword();
      },
      'editor:delete-to-end-of-subword': function() {
        return this.deleteToEndOfSubword();
      },
      'editor:delete-line': function() {
        return this.deleteLine();
      },
      'editor:cut-to-end-of-line': function() {
        return this.cutToEndOfLine();
      },
      'editor:cut-to-end-of-buffer-line': function() {
        return this.cutToEndOfBufferLine();
      },
      'editor:transpose': function() {
        return this.transpose();
      },
      'editor:upper-case': function() {
        return this.upperCase();
      },
      'editor:lower-case': function() {
        return this.lowerCase();
      },
      'editor:copy-selection': function() {
        return this.copyOnlySelectedText();
      }
    }));
    commandRegistry.add('atom-text-editor:not([mini])', stopEventPropagation({
      'core:move-up': function() {
        return this.moveUp();
      },
      'core:move-down': function() {
        return this.moveDown();
      },
      'core:move-to-top': function() {
        return this.moveToTop();
      },
      'core:move-to-bottom': function() {
        return this.moveToBottom();
      },
      'core:page-up': function() {
        return this.pageUp();
      },
      'core:page-down': function() {
        return this.pageDown();
      },
      'core:select-to-top': function() {
        return this.selectToTop();
      },
      'core:select-to-bottom': function() {
        return this.selectToBottom();
      },
      'core:select-page-up': function() {
        return this.selectPageUp();
      },
      'core:select-page-down': function() {
        return this.selectPageDown();
      },
      'editor:add-selection-below': function() {
        return this.addSelectionBelow();
      },
      'editor:add-selection-above': function() {
        return this.addSelectionAbove();
      },
      'editor:split-selections-into-lines': function() {
        return this.splitSelectionsIntoLines();
      },
      'editor:toggle-soft-tabs': function() {
        return this.toggleSoftTabs();
      },
      'editor:toggle-soft-wrap': function() {
        return this.toggleSoftWrapped();
      },
      'editor:fold-all': function() {
        return this.foldAll();
      },
      'editor:unfold-all': function() {
        return this.unfoldAll();
      },
      'editor:fold-current-row': function() {
        return this.foldCurrentRow();
      },
      'editor:unfold-current-row': function() {
        return this.unfoldCurrentRow();
      },
      'editor:fold-selection': function() {
        return this.foldSelectedLines();
      },
      'editor:fold-at-indent-level-1': function() {
        return this.foldAllAtIndentLevel(0);
      },
      'editor:fold-at-indent-level-2': function() {
        return this.foldAllAtIndentLevel(1);
      },
      'editor:fold-at-indent-level-3': function() {
        return this.foldAllAtIndentLevel(2);
      },
      'editor:fold-at-indent-level-4': function() {
        return this.foldAllAtIndentLevel(3);
      },
      'editor:fold-at-indent-level-5': function() {
        return this.foldAllAtIndentLevel(4);
      },
      'editor:fold-at-indent-level-6': function() {
        return this.foldAllAtIndentLevel(5);
      },
      'editor:fold-at-indent-level-7': function() {
        return this.foldAllAtIndentLevel(6);
      },
      'editor:fold-at-indent-level-8': function() {
        return this.foldAllAtIndentLevel(7);
      },
      'editor:fold-at-indent-level-9': function() {
        return this.foldAllAtIndentLevel(8);
      },
      'editor:log-cursor-scope': function() {
        return showCursorScope(this.getCursorScope(), notificationManager);
      },
      'editor:copy-path': function() {
        return copyPathToClipboard(this, project, clipboard, false);
      },
      'editor:copy-project-path': function() {
        return copyPathToClipboard(this, project, clipboard, true);
      },
      'editor:toggle-indent-guide': function() {
        return config.set('editor.showIndentGuide', !config.get('editor.showIndentGuide'));
      },
      'editor:toggle-line-numbers': function() {
        return config.set('editor.showLineNumbers', !config.get('editor.showLineNumbers'));
      },
      'editor:scroll-to-cursor': function() {
        return this.scrollToCursorPosition();
      }
    }));
    return commandRegistry.add('atom-text-editor:not([mini])', stopEventPropagationAndGroupUndo(config, {
      'editor:indent': function() {
        return this.indent();
      },
      'editor:auto-indent': function() {
        return this.autoIndentSelectedRows();
      },
      'editor:indent-selected-rows': function() {
        return this.indentSelectedRows();
      },
      'editor:outdent-selected-rows': function() {
        return this.outdentSelectedRows();
      },
      'editor:newline': function() {
        return this.insertNewline();
      },
      'editor:newline-below': function() {
        return this.insertNewlineBelow();
      },
      'editor:newline-above': function() {
        return this.insertNewlineAbove();
      },
      'editor:toggle-line-comments': function() {
        return this.toggleLineCommentsInSelection();
      },
      'editor:checkout-head-revision': function() {
        return atom.workspace.checkoutHeadRevision(this);
      },
      'editor:move-line-up': function() {
        return this.moveLineUp();
      },
      'editor:move-line-down': function() {
        return this.moveLineDown();
      },
      'editor:move-selection-left': function() {
        return this.moveSelectionLeft();
      },
      'editor:move-selection-right': function() {
        return this.moveSelectionRight();
      },
      'editor:duplicate-lines': function() {
        return this.duplicateLines();
      },
      'editor:join-lines': function() {
        return this.joinLines();
      }
    }));
  };

  stopEventPropagation = function(commandListeners) {
    var commandListener, commandName, fn, newCommandListeners;
    newCommandListeners = {};
    fn = function(commandListener) {
      return newCommandListeners[commandName] = function(event) {
        event.stopPropagation();
        return commandListener.call(this.getModel(), event);
      };
    };
    for (commandName in commandListeners) {
      commandListener = commandListeners[commandName];
      fn(commandListener);
    }
    return newCommandListeners;
  };

  stopEventPropagationAndGroupUndo = function(config, commandListeners) {
    var commandListener, commandName, fn, newCommandListeners;
    newCommandListeners = {};
    fn = function(commandListener) {
      return newCommandListeners[commandName] = function(event) {
        var model;
        event.stopPropagation();
        model = this.getModel();
        return model.transact(model.getUndoGroupingInterval(), function() {
          return commandListener.call(model, event);
        });
      };
    };
    for (commandName in commandListeners) {
      commandListener = commandListeners[commandName];
      fn(commandListener);
    }
    return newCommandListeners;
  };

  showCursorScope = function(descriptor, notificationManager) {
    var content, list;
    list = descriptor.scopes.toString().split(',');
    list = list.map(function(item) {
      return "* " + item;
    });
    content = "Scopes at Cursor\n" + (list.join('\n'));
    return notificationManager.addInfo(content, {
      dismissable: true
    });
  };

  copyPathToClipboard = function(editor, project, clipboard, relative) {
    var filePath;
    if (filePath = editor.getPath()) {
      if (relative) {
        filePath = project.relativize(filePath);
      }
      return clipboard.write(filePath);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9yZWdpc3Rlci1kZWZhdWx0LWNvbW1hbmRzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsY0FBZSxPQUFBLENBQVEsVUFBUjs7RUFDaEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsR0FBRDtBQUNmLFFBQUE7SUFEaUIsdUNBQWlCLHlDQUFrQixxQkFBUSwrQ0FBcUIsdUJBQVM7SUFDMUYsZUFBZSxDQUFDLEdBQWhCLENBQW9CLGdCQUFwQixFQUNFO01BQUEsbUNBQUEsRUFBcUMsU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBVyxDQUFDLGFBQVosQ0FBQSxDQUEyQixDQUFDLDRCQUE1QixDQUFBO01BQUgsQ0FBckM7TUFDQSx1Q0FBQSxFQUF5QyxTQUFBO2VBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFXLENBQUMsYUFBWixDQUFBLENBQTJCLENBQUMsZ0NBQTVCLENBQUE7TUFBSCxDQUR6QztNQUVBLHVDQUFBLEVBQXlDLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQywwQkFBNUIsQ0FBQTtNQUFILENBRnpDO01BR0EscUJBQUEsRUFBdUIsU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBVyxDQUFDLGFBQVosQ0FBQSxDQUEyQixDQUFDLGdCQUE1QixDQUFBO01BQUgsQ0FIdkI7TUFJQSx5QkFBQSxFQUEyQixTQUFBO2VBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFXLENBQUMsYUFBWixDQUFBLENBQTJCLENBQUMsb0JBQTVCLENBQUE7TUFBSCxDQUozQjtNQUtBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQUxwQjtNQU1BLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQU5wQjtNQU9BLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVBwQjtNQVFBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVJwQjtNQVNBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVRwQjtNQVVBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVZwQjtNQVdBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVhwQjtNQVlBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxhQUFaLENBQUEsQ0FBMkIsQ0FBQyxtQkFBNUIsQ0FBZ0QsQ0FBaEQ7TUFBSCxDQVpwQjtNQWFBLGtCQUFBLEVBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVcsQ0FBQyxh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IjpbIntpcGNSZW5kZXJlcn0gPSByZXF1aXJlICdlbGVjdHJvbidcbkdyaW0gPSByZXF1aXJlICdncmltJ1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh7Y29tbWFuZFJlZ2lzdHJ5LCBjb21tYW5kSW5zdGFsbGVyLCBjb25maWcsIG5vdGlmaWNhdGlvbk1hbmFnZXIsIHByb2plY3QsIGNsaXBib2FyZH0pIC0+XG4gIGNvbW1hbmRSZWdpc3RyeS5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAncGFuZTpzaG93LW5leHQtcmVjZW50bHktdXNlZC1pdGVtJzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlTmV4dFJlY2VudGx5VXNlZEl0ZW0oKVxuICAgICdwYW5lOnNob3ctcHJldmlvdXMtcmVjZW50bHktdXNlZC1pdGVtJzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlUHJldmlvdXNSZWNlbnRseVVzZWRJdGVtKClcbiAgICAncGFuZTptb3ZlLWFjdGl2ZS1pdGVtLXRvLXRvcC1vZi1zdGFjayc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5tb3ZlQWN0aXZlSXRlbVRvVG9wT2ZTdGFjaygpXG4gICAgJ3BhbmU6c2hvdy1uZXh0LWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVOZXh0SXRlbSgpXG4gICAgJ3BhbmU6c2hvdy1wcmV2aW91cy1pdGVtJzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlUHJldmlvdXNJdGVtKClcbiAgICAncGFuZTpzaG93LWl0ZW0tMSc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW1BdEluZGV4KDApXG4gICAgJ3BhbmU6c2hvdy1pdGVtLTInOiAtPiBAZ2V0TW9kZWwoKS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtQXRJbmRleCgxKVxuICAgICdwYW5lOnNob3ctaXRlbS0zJzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlSXRlbUF0SW5kZXgoMilcbiAgICAncGFuZTpzaG93LWl0ZW0tNCc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW1BdEluZGV4KDMpXG4gICAgJ3BhbmU6c2hvdy1pdGVtLTUnOiAtPiBAZ2V0TW9kZWwoKS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtQXRJbmRleCg0KVxuICAgICdwYW5lOnNob3ctaXRlbS02JzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlSXRlbUF0SW5kZXgoNSlcbiAgICAncGFuZTpzaG93LWl0ZW0tNyc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW1BdEluZGV4KDYpXG4gICAgJ3BhbmU6c2hvdy1pdGVtLTgnOiAtPiBAZ2V0TW9kZWwoKS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtQXRJbmRleCg3KVxuICAgICdwYW5lOnNob3ctaXRlbS05JzogLT4gQGdldE1vZGVsKCkuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlTGFzdEl0ZW0oKVxuICAgICdwYW5lOm1vdmUtaXRlbS1yaWdodCc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5tb3ZlSXRlbVJpZ2h0KClcbiAgICAncGFuZTptb3ZlLWl0ZW0tbGVmdCc6IC0+IEBnZXRNb2RlbCgpLmdldEFjdGl2ZVBhbmUoKS5tb3ZlSXRlbUxlZnQoKVxuICAgICd3aW5kb3c6aW5jcmVhc2UtZm9udC1zaXplJzogLT4gQGdldE1vZGVsKCkuaW5jcmVhc2VGb250U2l6ZSgpXG4gICAgJ3dpbmRvdzpkZWNyZWFzZS1mb250LXNpemUnOiAtPiBAZ2V0TW9kZWwoKS5kZWNyZWFzZUZvbnRTaXplKClcbiAgICAnd2luZG93OnJlc2V0LWZvbnQtc2l6ZSc6IC0+IEBnZXRNb2RlbCgpLnJlc2V0Rm9udFNpemUoKVxuICAgICdhcHBsaWNhdGlvbjphYm91dCc6IC0+IGlwY1JlbmRlcmVyLnNlbmQoJ2NvbW1hbmQnLCAnYXBwbGljYXRpb246YWJvdXQnKVxuICAgICdhcHBsaWNhdGlvbjpzaG93LXByZWZlcmVuY2VzJzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpzaG93LXNldHRpbmdzJylcbiAgICAnYXBwbGljYXRpb246c2hvdy1zZXR0aW5ncyc6IC0+IGlwY1JlbmRlcmVyLnNlbmQoJ2NvbW1hbmQnLCAnYXBwbGljYXRpb246c2hvdy1zZXR0aW5ncycpXG4gICAgJ2FwcGxpY2F0aW9uOnF1aXQnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOnF1aXQnKVxuICAgICdhcHBsaWNhdGlvbjpoaWRlJzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpoaWRlJylcbiAgICAnYXBwbGljYXRpb246aGlkZS1vdGhlci1hcHBsaWNhdGlvbnMnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOmhpZGUtb3RoZXItYXBwbGljYXRpb25zJylcbiAgICAnYXBwbGljYXRpb246aW5zdGFsbC11cGRhdGUnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOmluc3RhbGwtdXBkYXRlJylcbiAgICAnYXBwbGljYXRpb246dW5oaWRlLWFsbC1hcHBsaWNhdGlvbnMnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOnVuaGlkZS1hbGwtYXBwbGljYXRpb25zJylcbiAgICAnYXBwbGljYXRpb246bmV3LXdpbmRvdyc6IC0+IGlwY1JlbmRlcmVyLnNlbmQoJ2NvbW1hbmQnLCAnYXBwbGljYXRpb246bmV3LXdpbmRvdycpXG4gICAgJ2FwcGxpY2F0aW9uOm5ldy1maWxlJzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpuZXctZmlsZScpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4nOiAtPlxuICAgICAgZGVmYXVsdFBhdGggPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFBhdGgoKSA/IGF0b20ucHJvamVjdC5nZXRQYXRocygpP1swXVxuICAgICAgaXBjUmVuZGVyZXIuc2VuZCgnb3Blbi1jb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4nLCBkZWZhdWx0UGF0aClcbiAgICAnYXBwbGljYXRpb246b3Blbi1maWxlJzogLT5cbiAgICAgIGRlZmF1bHRQYXRoID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRQYXRoKCkgPyBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKT9bMF1cbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoJ29wZW4tY29tbWFuZCcsICdhcHBsaWNhdGlvbjpvcGVuLWZpbGUnLCBkZWZhdWx0UGF0aClcbiAgICAnYXBwbGljYXRpb246b3Blbi1mb2xkZXInOiAtPlxuICAgICAgZGVmYXVsdFBhdGggPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFBhdGgoKSA/IGF0b20ucHJvamVjdC5nZXRQYXRocygpP1swXVxuICAgICAgaXBjUmVuZGVyZXIuc2VuZCgnb3Blbi1jb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4tZm9sZGVyJywgZGVmYXVsdFBhdGgpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4tZGV2JzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpvcGVuLWRldicpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4tc2FmZSc6IC0+IGlwY1JlbmRlcmVyLnNlbmQoJ2NvbW1hbmQnLCAnYXBwbGljYXRpb246b3Blbi1zYWZlJylcbiAgICAnYXBwbGljYXRpb246YWRkLXByb2plY3QtZm9sZGVyJzogLT4gYXRvbS5hZGRQcm9qZWN0Rm9sZGVyKClcbiAgICAnYXBwbGljYXRpb246bWluaW1pemUnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOm1pbmltaXplJylcbiAgICAnYXBwbGljYXRpb246em9vbSc6IC0+IGlwY1JlbmRlcmVyLnNlbmQoJ2NvbW1hbmQnLCAnYXBwbGljYXRpb246em9vbScpXG4gICAgJ2FwcGxpY2F0aW9uOmJyaW5nLWFsbC13aW5kb3dzLXRvLWZyb250JzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpicmluZy1hbGwtd2luZG93cy10by1mcm9udCcpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1jb25maWcnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1jb25maWcnKVxuICAgICdhcHBsaWNhdGlvbjpvcGVuLXlvdXItaW5pdC1zY3JpcHQnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1pbml0LXNjcmlwdCcpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1rZXltYXAnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1rZXltYXAnKVxuICAgICdhcHBsaWNhdGlvbjpvcGVuLXlvdXItc25pcHBldHMnOiAtPiBpcGNSZW5kZXJlci5zZW5kKCdjb21tYW5kJywgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1zbmlwcGV0cycpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4teW91ci1zdHlsZXNoZWV0JzogLT4gaXBjUmVuZGVyZXIuc2VuZCgnY29tbWFuZCcsICdhcHBsaWNhdGlvbjpvcGVuLXlvdXItc3R5bGVzaGVldCcpXG4gICAgJ2FwcGxpY2F0aW9uOm9wZW4tbGljZW5zZSc6IC0+IEBnZXRNb2RlbCgpLm9wZW5MaWNlbnNlKClcbiAgICAnd2luZG93OnJ1bi1wYWNrYWdlLXNwZWNzJzogLT4gQHJ1blBhY2thZ2VTcGVjcygpXG4gICAgJ3dpbmRvdzpydW4tYmVuY2htYXJrcyc6IC0+IEBydW5CZW5jaG1hcmtzKClcbiAgICAnd2luZG93OmZvY3VzLW5leHQtcGFuZSc6IC0+IEBnZXRNb2RlbCgpLmFjdGl2YXRlTmV4dFBhbmUoKVxuICAgICd3aW5kb3c6Zm9jdXMtcHJldmlvdXMtcGFuZSc6IC0+IEBnZXRNb2RlbCgpLmFjdGl2YXRlUHJldmlvdXNQYW5lKClcbiAgICAnd2luZG93OmZvY3VzLXBhbmUtYWJvdmUnOiAtPiBAZm9jdXNQYW5lVmlld0Fib3ZlKClcbiAgICAnd2luZG93OmZvY3VzLXBhbmUtYmVsb3cnOiAtPiBAZm9jdXNQYW5lVmlld0JlbG93KClcbiAgICAnd2luZG93OmZvY3VzLXBhbmUtb24tbGVmdCc6IC0+IEBmb2N1c1BhbmVWaWV3T25MZWZ0KClcbiAgICAnd2luZG93OmZvY3VzLXBhbmUtb24tcmlnaHQnOiAtPiBAZm9jdXNQYW5lVmlld09uUmlnaHQoKVxuICAgICd3aW5kb3c6bW92ZS1hY3RpdmUtaXRlbS10by1wYW5lLWFib3ZlJzogLT4gQG1vdmVBY3RpdmVJdGVtVG9QYW5lQWJvdmUoKVxuICAgICd3aW5kb3c6bW92ZS1hY3RpdmUtaXRlbS10by1wYW5lLWJlbG93JzogLT4gQG1vdmVBY3RpdmVJdGVtVG9QYW5lQmVsb3coKVxuICAgICd3aW5kb3c6bW92ZS1hY3RpdmUtaXRlbS10by1wYW5lLW9uLWxlZnQnOiAtPiBAbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVPbkxlZnQoKVxuICAgICd3aW5kb3c6bW92ZS1hY3RpdmUtaXRlbS10by1wYW5lLW9uLXJpZ2h0JzogLT4gQG1vdmVBY3RpdmVJdGVtVG9QYW5lT25SaWdodCgpXG4gICAgJ3dpbmRvdzpjb3B5LWFjdGl2ZS1pdGVtLXRvLXBhbmUtYWJvdmUnOiAtPiBAbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVBYm92ZShrZWVwT3JpZ2luYWw6IHRydWUpXG4gICAgJ3dpbmRvdzpjb3B5LWFjdGl2ZS1pdGVtLXRvLXBhbmUtYmVsb3cnOiAtPiBAbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVCZWxvdyhrZWVwT3JpZ2luYWw6IHRydWUpXG4gICAgJ3dpbmRvdzpjb3B5LWFjdGl2ZS1pdGVtLXRvLXBhbmUtb24tbGVmdCc6IC0+IEBtb3ZlQWN0aXZlSXRlbVRvUGFuZU9uTGVmdChrZWVwT3JpZ2luYWw6IHRydWUpXG4gICAgJ3dpbmRvdzpjb3B5LWFjdGl2ZS1pdGVtLXRvLXBhbmUtb24tcmlnaHQnOiAtPiBAbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVPblJpZ2h0KGtlZXBPcmlnaW5hbDogdHJ1ZSlcbiAgICAnd2luZG93OnNhdmUtYWxsJzogLT4gQGdldE1vZGVsKCkuc2F2ZUFsbCgpXG4gICAgJ3dpbmRvdzp0b2dnbGUtaW52aXNpYmxlcyc6IC0+IGNvbmZpZy5zZXQoXCJlZGl0b3Iuc2hvd0ludmlzaWJsZXNcIiwgbm90IGNvbmZpZy5nZXQoXCJlZGl0b3Iuc2hvd0ludmlzaWJsZXNcIikpXG4gICAgJ3dpbmRvdzpsb2ctZGVwcmVjYXRpb24td2FybmluZ3MnOiAtPiBHcmltLmxvZ0RlcHJlY2F0aW9ucygpXG4gICAgJ3dpbmRvdzp0b2dnbGUtYXV0by1pbmRlbnQnOiAtPiBjb25maWcuc2V0KFwiZWRpdG9yLmF1dG9JbmRlbnRcIiwgbm90IGNvbmZpZy5nZXQoXCJlZGl0b3IuYXV0b0luZGVudFwiKSlcbiAgICAncGFuZTpyZW9wZW4tY2xvc2VkLWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5yZW9wZW5JdGVtKClcbiAgICAnY29yZTpjbG9zZSc6IC0+IEBnZXRNb2RlbCgpLmNsb3NlQWN0aXZlUGFuZUl0ZW1PckVtcHR5UGFuZU9yV2luZG93KClcbiAgICAnY29yZTpzYXZlJzogLT4gQGdldE1vZGVsKCkuc2F2ZUFjdGl2ZVBhbmVJdGVtKClcbiAgICAnY29yZTpzYXZlLWFzJzogLT4gQGdldE1vZGVsKCkuc2F2ZUFjdGl2ZVBhbmVJdGVtQXMoKVxuXG4gIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcbiAgICBjb21tYW5kUmVnaXN0cnkuYWRkICdhdG9tLXdvcmtzcGFjZScsICd3aW5kb3c6aW5zdGFsbC1zaGVsbC1jb21tYW5kcycsIC0+XG4gICAgICBjb21tYW5kSW5zdGFsbGVyLmluc3RhbGxTaGVsbENvbW1hbmRzSW50ZXJhY3RpdmVseSgpXG5cbiAgY29tbWFuZFJlZ2lzdHJ5LmFkZCAnYXRvbS1wYW5lJyxcbiAgICAncGFuZTpzYXZlLWl0ZW1zJzogLT4gQGdldE1vZGVsKCkuc2F2ZUl0ZW1zKClcbiAgICAncGFuZTpzcGxpdC1sZWZ0JzogLT4gQGdldE1vZGVsKCkuc3BsaXRMZWZ0KClcbiAgICAncGFuZTpzcGxpdC1yaWdodCc6IC0+IEBnZXRNb2RlbCgpLnNwbGl0UmlnaHQoKVxuICAgICdwYW5lOnNwbGl0LXVwJzogLT4gQGdldE1vZGVsKCkuc3BsaXRVcCgpXG4gICAgJ3BhbmU6c3BsaXQtZG93bic6IC0+IEBnZXRNb2RlbCgpLnNwbGl0RG93bigpXG4gICAgJ3BhbmU6c3BsaXQtbGVmdC1hbmQtY29weS1hY3RpdmUtaXRlbSc6IC0+IEBnZXRNb2RlbCgpLnNwbGl0TGVmdChjb3B5QWN0aXZlSXRlbTogdHJ1ZSlcbiAgICAncGFuZTpzcGxpdC1yaWdodC1hbmQtY29weS1hY3RpdmUtaXRlbSc6IC0+IEBnZXRNb2RlbCgpLnNwbGl0UmlnaHQoY29weUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgJ3BhbmU6c3BsaXQtdXAtYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5zcGxpdFVwKGNvcHlBY3RpdmVJdGVtOiB0cnVlKVxuICAgICdwYW5lOnNwbGl0LWRvd24tYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5zcGxpdERvd24oY29weUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgJ3BhbmU6c3BsaXQtbGVmdC1hbmQtbW92ZS1hY3RpdmUtaXRlbSc6IC0+IEBnZXRNb2RlbCgpLnNwbGl0TGVmdChtb3ZlQWN0aXZlSXRlbTogdHJ1ZSlcbiAgICAncGFuZTpzcGxpdC1yaWdodC1hbmQtbW92ZS1hY3RpdmUtaXRlbSc6IC0+IEBnZXRNb2RlbCgpLnNwbGl0UmlnaHQobW92ZUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgJ3BhbmU6c3BsaXQtdXAtYW5kLW1vdmUtYWN0aXZlLWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5zcGxpdFVwKG1vdmVBY3RpdmVJdGVtOiB0cnVlKVxuICAgICdwYW5lOnNwbGl0LWRvd24tYW5kLW1vdmUtYWN0aXZlLWl0ZW0nOiAtPiBAZ2V0TW9kZWwoKS5zcGxpdERvd24obW92ZUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgJ3BhbmU6Y2xvc2UnOiAtPiBAZ2V0TW9kZWwoKS5jbG9zZSgpXG4gICAgJ3BhbmU6Y2xvc2Utb3RoZXItaXRlbXMnOiAtPiBAZ2V0TW9kZWwoKS5kZXN0cm95SW5hY3RpdmVJdGVtcygpXG4gICAgJ3BhbmU6aW5jcmVhc2Utc2l6ZSc6IC0+IEBnZXRNb2RlbCgpLmluY3JlYXNlU2l6ZSgpXG4gICAgJ3BhbmU6ZGVjcmVhc2Utc2l6ZSc6IC0+IEBnZXRNb2RlbCgpLmRlY3JlYXNlU2l6ZSgpXG5cbiAgY29tbWFuZFJlZ2lzdHJ5LmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsIHN0b3BFdmVudFByb3BhZ2F0aW9uKFxuICAgICdjb3JlOnVuZG8nOiAtPiBAdW5kbygpXG4gICAgJ2NvcmU6cmVkbyc6IC0+IEByZWRvKClcbiAgICAnY29yZTptb3ZlLWxlZnQnOiAtPiBAbW92ZUxlZnQoKVxuICAgICdjb3JlOm1vdmUtcmlnaHQnOiAtPiBAbW92ZVJpZ2h0KClcbiAgICAnY29yZTpzZWxlY3QtbGVmdCc6IC0+IEBzZWxlY3RMZWZ0KClcbiAgICAnY29yZTpzZWxlY3QtcmlnaHQnOiAtPiBAc2VsZWN0UmlnaHQoKVxuICAgICdjb3JlOnNlbGVjdC11cCc6IC0+IEBzZWxlY3RVcCgpXG4gICAgJ2NvcmU6c2VsZWN0LWRvd24nOiAtPiBAc2VsZWN0RG93bigpXG4gICAgJ2NvcmU6c2VsZWN0LWFsbCc6IC0+IEBzZWxlY3RBbGwoKVxuICAgICdlZGl0b3I6c2VsZWN0LXdvcmQnOiAtPiBAc2VsZWN0V29yZHNDb250YWluaW5nQ3Vyc29ycygpXG4gICAgJ2VkaXRvcjpjb25zb2xpZGF0ZS1zZWxlY3Rpb25zJzogKGV2ZW50KSAtPiBldmVudC5hYm9ydEtleUJpbmRpbmcoKSB1bmxlc3MgQGNvbnNvbGlkYXRlU2VsZWN0aW9ucygpXG4gICAgJ2VkaXRvcjptb3ZlLXRvLWJlZ2lubmluZy1vZi1uZXh0LXBhcmFncmFwaCc6IC0+IEBtb3ZlVG9CZWdpbm5pbmdPZk5leHRQYXJhZ3JhcGgoKVxuICAgICdlZGl0b3I6bW92ZS10by1iZWdpbm5pbmctb2YtcHJldmlvdXMtcGFyYWdyYXBoJzogLT4gQG1vdmVUb0JlZ2lubmluZ09mUHJldmlvdXNQYXJhZ3JhcGgoKVxuICAgICdlZGl0b3I6bW92ZS10by1iZWdpbm5pbmctb2Ytc2NyZWVuLWxpbmUnOiAtPiBAbW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tYmVnaW5uaW5nLW9mLWxpbmUnOiAtPiBAbW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tZW5kLW9mLXNjcmVlbi1saW5lJzogLT4gQG1vdmVUb0VuZE9mU2NyZWVuTGluZSgpXG4gICAgJ2VkaXRvcjptb3ZlLXRvLWVuZC1vZi1saW5lJzogLT4gQG1vdmVUb0VuZE9mTGluZSgpXG4gICAgJ2VkaXRvcjptb3ZlLXRvLWZpcnN0LWNoYXJhY3Rlci1vZi1saW5lJzogLT4gQG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tYmVnaW5uaW5nLW9mLXdvcmQnOiAtPiBAbW92ZVRvQmVnaW5uaW5nT2ZXb3JkKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tZW5kLW9mLXdvcmQnOiAtPiBAbW92ZVRvRW5kT2ZXb3JkKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tYmVnaW5uaW5nLW9mLW5leHQtd29yZCc6IC0+IEBtb3ZlVG9CZWdpbm5pbmdPZk5leHRXb3JkKClcbiAgICAnZWRpdG9yOm1vdmUtdG8tcHJldmlvdXMtd29yZC1ib3VuZGFyeSc6IC0+IEBtb3ZlVG9QcmV2aW91c1dvcmRCb3VuZGFyeSgpXG4gICAgJ2VkaXRvcjptb3ZlLXRvLW5leHQtd29yZC1ib3VuZGFyeSc6IC0+IEBtb3ZlVG9OZXh0V29yZEJvdW5kYXJ5KClcbiAgICAnZWRpdG9yOm1vdmUtdG8tcHJldmlvdXMtc3Vid29yZC1ib3VuZGFyeSc6IC0+IEBtb3ZlVG9QcmV2aW91c1N1YndvcmRCb3VuZGFyeSgpXG4gICAgJ2VkaXRvcjptb3ZlLXRvLW5leHQtc3Vid29yZC1ib3VuZGFyeSc6IC0+IEBtb3ZlVG9OZXh0U3Vid29yZEJvdW5kYXJ5KClcbiAgICAnZWRpdG9yOnNlbGVjdC10by1iZWdpbm5pbmctb2YtbmV4dC1wYXJhZ3JhcGgnOiAtPiBAc2VsZWN0VG9CZWdpbm5pbmdPZk5leHRQYXJhZ3JhcGgoKVxuICAgICdlZGl0b3I6c2VsZWN0LXRvLWJlZ2lubmluZy1vZi1wcmV2aW91cy1wYXJhZ3JhcGgnOiAtPiBAc2VsZWN0VG9CZWdpbm5pbmdPZlByZXZpb3VzUGFyYWdyYXBoKClcbiAgICAnZWRpdG9yOnNlbGVjdC10by1lbmQtb2YtbGluZSc6IC0+IEBzZWxlY3RUb0VuZE9mTGluZSgpXG4gICAgJ2VkaXRvcjpzZWxlY3QtdG8tYmVnaW5uaW5nLW9mLWxpbmUnOiAtPiBAc2VsZWN0VG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgICdlZGl0b3I6c2VsZWN0LXRvLWVuZC1vZi13b3JkJzogLT4gQHNlbGVjdFRvRW5kT2ZXb3JkKClcbiAgICAnZWRpdG9yOnNlbGVjdC10by1iZWdpbm5pbmctb2Ytd29yZCc6IC0+IEBzZWxlY3RUb0JlZ2lubmluZ09mV29yZCgpXG4gICAgJ2VkaXRvcjpzZWxlY3QtdG8tYmVnaW5uaW5nLW9mLW5leHQtd29yZCc6IC0+IEBzZWxlY3RUb0JlZ2lubmluZ09mTmV4dFdvcmQoKVxuICAgICdlZGl0b3I6c2VsZWN0LXRvLW5leHQtd29yZC1ib3VuZGFyeSc6IC0+IEBzZWxlY3RUb05leHRXb3JkQm91bmRhcnkoKVxuICAgICdlZGl0b3I6c2VsZWN0LXRvLXByZXZpb3VzLXdvcmQtYm91bmRhcnknOiAtPiBAc2VsZWN0VG9QcmV2aW91c1dvcmRCb3VuZGFyeSgpXG4gICAgJ2VkaXRvcjpzZWxlY3QtdG8tbmV4dC1zdWJ3b3JkLWJvdW5kYXJ5JzogLT4gQHNlbGVjdFRvTmV4dFN1YndvcmRCb3VuZGFyeSgpXG4gICAgJ2VkaXRvcjpzZWxlY3QtdG8tcHJldmlvdXMtc3Vid29yZC1ib3VuZGFyeSc6IC0+IEBzZWxlY3RUb1ByZXZpb3VzU3Vid29yZEJvdW5kYXJ5KClcbiAgICAnZWRpdG9yOnNlbGVjdC10by1maXJzdC1jaGFyYWN0ZXItb2YtbGluZSc6IC0+IEBzZWxlY3RUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICAnZWRpdG9yOnNlbGVjdC1saW5lJzogLT4gQHNlbGVjdExpbmVzQ29udGFpbmluZ0N1cnNvcnMoKVxuICApXG5cbiAgY29tbWFuZFJlZ2lzdHJ5LmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsIHN0b3BFdmVudFByb3BhZ2F0aW9uQW5kR3JvdXBVbmRvKGNvbmZpZyxcbiAgICAnY29yZTpiYWNrc3BhY2UnOiAtPiBAYmFja3NwYWNlKClcbiAgICAnY29yZTpkZWxldGUnOiAtPiBAZGVsZXRlKClcbiAgICAnY29yZTpjdXQnOiAtPiBAY3V0U2VsZWN0ZWRUZXh0KClcbiAgICAnY29yZTpjb3B5JzogLT4gQGNvcHlTZWxlY3RlZFRleHQoKVxuICAgICdjb3JlOnBhc3RlJzogLT4gQHBhc3RlVGV4dCgpXG4gICAgJ2VkaXRvcjpkZWxldGUtdG8tcHJldmlvdXMtd29yZC1ib3VuZGFyeSc6IC0+IEBkZWxldGVUb1ByZXZpb3VzV29yZEJvdW5kYXJ5KClcbiAgICAnZWRpdG9yOmRlbGV0ZS10by1uZXh0LXdvcmQtYm91bmRhcnknOiAtPiBAZGVsZXRlVG9OZXh0V29yZEJvdW5kYXJ5KClcbiAgICAnZWRpdG9yOmRlbGV0ZS10by1iZWdpbm5pbmctb2Ytd29yZCc6IC0+IEBkZWxldGVUb0JlZ2lubmluZ09mV29yZCgpXG4gICAgJ2VkaXRvcjpkZWxldGUtdG8tYmVnaW5uaW5nLW9mLWxpbmUnOiAtPiBAZGVsZXRlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgICdlZGl0b3I6ZGVsZXRlLXRvLWVuZC1vZi1saW5lJzogLT4gQGRlbGV0ZVRvRW5kT2ZMaW5lKClcbiAgICAnZWRpdG9yOmRlbGV0ZS10by1lbmQtb2Ytd29yZCc6IC0+IEBkZWxldGVUb0VuZE9mV29yZCgpXG4gICAgJ2VkaXRvcjpkZWxldGUtdG8tYmVnaW5uaW5nLW9mLXN1YndvcmQnOiAtPiBAZGVsZXRlVG9CZWdpbm5pbmdPZlN1YndvcmQoKVxuICAgICdlZGl0b3I6ZGVsZXRlLXRvLWVuZC1vZi1zdWJ3b3JkJzogLT4gQGRlbGV0ZVRvRW5kT2ZTdWJ3b3JkKClcbiAgICAnZWRpdG9yOmRlbGV0ZS1saW5lJzogLT4gQGRlbGV0ZUxpbmUoKVxuICAgICdlZGl0b3I6Y3V0LXRvLWVuZC1vZi1saW5lJzogLT4gQGN1dFRvRW5kT2ZMaW5lKClcbiAgICAnZWRpdG9yOmN1dC10by1lbmQtb2YtYnVmZmVyLWxpbmUnOiAtPiBAY3V0VG9FbmRPZkJ1ZmZlckxpbmUoKVxuICAgICdlZGl0b3I6dHJhbnNwb3NlJzogLT4gQHRyYW5zcG9zZSgpXG4gICAgJ2VkaXRvcjp1cHBlci1jYXNlJzogLT4gQHVwcGVyQ2FzZSgpXG4gICAgJ2VkaXRvcjpsb3dlci1jYXNlJzogLT4gQGxvd2VyQ2FzZSgpXG4gICAgJ2VkaXRvcjpjb3B5LXNlbGVjdGlvbic6IC0+IEBjb3B5T25seVNlbGVjdGVkVGV4dCgpXG4gIClcblxuICBjb21tYW5kUmVnaXN0cnkuYWRkICdhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pJywgc3RvcEV2ZW50UHJvcGFnYXRpb24oXG4gICAgJ2NvcmU6bW92ZS11cCc6IC0+IEBtb3ZlVXAoKVxuICAgICdjb3JlOm1vdmUtZG93bic6IC0+IEBtb3ZlRG93bigpXG4gICAgJ2NvcmU6bW92ZS10by10b3AnOiAtPiBAbW92ZVRvVG9wKClcbiAgICAnY29yZTptb3ZlLXRvLWJvdHRvbSc6IC0+IEBtb3ZlVG9Cb3R0b20oKVxuICAgICdjb3JlOnBhZ2UtdXAnOiAtPiBAcGFnZVVwKClcbiAgICAnY29yZTpwYWdlLWRvd24nOiAtPiBAcGFnZURvd24oKVxuICAgICdjb3JlOnNlbGVjdC10by10b3AnOiAtPiBAc2VsZWN0VG9Ub3AoKVxuICAgICdjb3JlOnNlbGVjdC10by1ib3R0b20nOiAtPiBAc2VsZWN0VG9Cb3R0b20oKVxuICAgICdjb3JlOnNlbGVjdC1wYWdlLXVwJzogLT4gQHNlbGVjdFBhZ2VVcCgpXG4gICAgJ2NvcmU6c2VsZWN0LXBhZ2UtZG93bic6IC0+IEBzZWxlY3RQYWdlRG93bigpXG4gICAgJ2VkaXRvcjphZGQtc2VsZWN0aW9uLWJlbG93JzogLT4gQGFkZFNlbGVjdGlvbkJlbG93KClcbiAgICAnZWRpdG9yOmFkZC1zZWxlY3Rpb24tYWJvdmUnOiAtPiBAYWRkU2VsZWN0aW9uQWJvdmUoKVxuICAgICdlZGl0b3I6c3BsaXQtc2VsZWN0aW9ucy1pbnRvLWxpbmVzJzogLT4gQHNwbGl0U2VsZWN0aW9uc0ludG9MaW5lcygpXG4gICAgJ2VkaXRvcjp0b2dnbGUtc29mdC10YWJzJzogLT4gQHRvZ2dsZVNvZnRUYWJzKClcbiAgICAnZWRpdG9yOnRvZ2dsZS1zb2Z0LXdyYXAnOiAtPiBAdG9nZ2xlU29mdFdyYXBwZWQoKVxuICAgICdlZGl0b3I6Zm9sZC1hbGwnOiAtPiBAZm9sZEFsbCgpXG4gICAgJ2VkaXRvcjp1bmZvbGQtYWxsJzogLT4gQHVuZm9sZEFsbCgpXG4gICAgJ2VkaXRvcjpmb2xkLWN1cnJlbnQtcm93JzogLT4gQGZvbGRDdXJyZW50Um93KClcbiAgICAnZWRpdG9yOnVuZm9sZC1jdXJyZW50LXJvdyc6IC0+IEB1bmZvbGRDdXJyZW50Um93KClcbiAgICAnZWRpdG9yOmZvbGQtc2VsZWN0aW9uJzogLT4gQGZvbGRTZWxlY3RlZExpbmVzKClcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTEnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoMClcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTInOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoMSlcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTMnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoMilcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTQnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoMylcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTUnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoNClcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTYnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoNSlcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTcnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoNilcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTgnOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoNylcbiAgICAnZWRpdG9yOmZvbGQtYXQtaW5kZW50LWxldmVsLTknOiAtPiBAZm9sZEFsbEF0SW5kZW50TGV2ZWwoOClcbiAgICAnZWRpdG9yOmxvZy1jdXJzb3Itc2NvcGUnOiAtPiBzaG93Q3Vyc29yU2NvcGUoQGdldEN1cnNvclNjb3BlKCksIG5vdGlmaWNhdGlvbk1hbmFnZXIpXG4gICAgJ2VkaXRvcjpjb3B5LXBhdGgnOiAtPiBjb3B5UGF0aFRvQ2xpcGJvYXJkKHRoaXMsIHByb2plY3QsIGNsaXBib2FyZCwgZmFsc2UpXG4gICAgJ2VkaXRvcjpjb3B5LXByb2plY3QtcGF0aCc6IC0+IGNvcHlQYXRoVG9DbGlwYm9hcmQodGhpcywgcHJvamVjdCwgY2xpcGJvYXJkLCB0cnVlKVxuICAgICdlZGl0b3I6dG9nZ2xlLWluZGVudC1ndWlkZSc6IC0+IGNvbmZpZy5zZXQoJ2VkaXRvci5zaG93SW5kZW50R3VpZGUnLCBub3QgY29uZmlnLmdldCgnZWRpdG9yLnNob3dJbmRlbnRHdWlkZScpKVxuICAgICdlZGl0b3I6dG9nZ2xlLWxpbmUtbnVtYmVycyc6IC0+IGNvbmZpZy5zZXQoJ2VkaXRvci5zaG93TGluZU51bWJlcnMnLCBub3QgY29uZmlnLmdldCgnZWRpdG9yLnNob3dMaW5lTnVtYmVycycpKVxuICAgICdlZGl0b3I6c2Nyb2xsLXRvLWN1cnNvcic6IC0+IEBzY3JvbGxUb0N1cnNvclBvc2l0aW9uKClcbiAgKVxuXG4gIGNvbW1hbmRSZWdpc3RyeS5hZGQgJ2F0b20tdGV4dC1lZGl0b3I6bm90KFttaW5pXSknLCBzdG9wRXZlbnRQcm9wYWdhdGlvbkFuZEdyb3VwVW5kbyhjb25maWcsXG4gICAgJ2VkaXRvcjppbmRlbnQnOiAtPiBAaW5kZW50KClcbiAgICAnZWRpdG9yOmF1dG8taW5kZW50JzogLT4gQGF1dG9JbmRlbnRTZWxlY3RlZFJvd3MoKVxuICAgICdlZGl0b3I6aW5kZW50LXNlbGVjdGVkLXJvd3MnOiAtPiBAaW5kZW50U2VsZWN0ZWRSb3dzKClcbiAgICAnZWRpdG9yOm91dGRlbnQtc2VsZWN0ZWQtcm93cyc6IC0+IEBvdXRkZW50U2VsZWN0ZWRSb3dzKClcbiAgICAnZWRpdG9yOm5ld2xpbmUnOiAtPiBAaW5zZXJ0TmV3bGluZSgpXG4gICAgJ2VkaXRvcjpuZXdsaW5lLWJlbG93JzogLT4gQGluc2VydE5ld2xpbmVCZWxvdygpXG4gICAgJ2VkaXRvcjpuZXdsaW5lLWFib3ZlJzogLT4gQGluc2VydE5ld2xpbmVBYm92ZSgpXG4gICAgJ2VkaXRvcjp0b2dnbGUtbGluZS1jb21tZW50cyc6IC0+IEB0b2dnbGVMaW5lQ29tbWVudHNJblNlbGVjdGlvbigpXG4gICAgJ2VkaXRvcjpjaGVja291dC1oZWFkLXJldmlzaW9uJzogLT4gYXRvbS53b3Jrc3BhY2UuY2hlY2tvdXRIZWFkUmV2aXNpb24odGhpcylcbiAgICAnZWRpdG9yOm1vdmUtbGluZS11cCc6IC0+IEBtb3ZlTGluZVVwKClcbiAgICAnZWRpdG9yOm1vdmUtbGluZS1kb3duJzogLT4gQG1vdmVMaW5lRG93bigpXG4gICAgJ2VkaXRvcjptb3ZlLXNlbGVjdGlvbi1sZWZ0JzogLT4gQG1vdmVTZWxlY3Rpb25MZWZ0KClcbiAgICAnZWRpdG9yOm1vdmUtc2VsZWN0aW9uLXJpZ2h0JzogLT4gQG1vdmVTZWxlY3Rpb25SaWdodCgpXG4gICAgJ2VkaXRvcjpkdXBsaWNhdGUtbGluZXMnOiAtPiBAZHVwbGljYXRlTGluZXMoKVxuICAgICdlZGl0b3I6am9pbi1saW5lcyc6IC0+IEBqb2luTGluZXMoKVxuICApXG5cbnN0b3BFdmVudFByb3BhZ2F0aW9uID0gKGNvbW1hbmRMaXN0ZW5lcnMpIC0+XG4gIG5ld0NvbW1hbmRMaXN0ZW5lcnMgPSB7fVxuICBmb3IgY29tbWFuZE5hbWUsIGNvbW1hbmRMaXN0ZW5lciBvZiBjb21tYW5kTGlzdGVuZXJzXG4gICAgZG8gKGNvbW1hbmRMaXN0ZW5lcikgLT5cbiAgICAgIG5ld0NvbW1hbmRMaXN0ZW5lcnNbY29tbWFuZE5hbWVdID0gKGV2ZW50KSAtPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBjb21tYW5kTGlzdGVuZXIuY2FsbChAZ2V0TW9kZWwoKSwgZXZlbnQpXG4gIG5ld0NvbW1hbmRMaXN0ZW5lcnNcblxuc3RvcEV2ZW50UHJvcGFnYXRpb25BbmRHcm91cFVuZG8gPSAoY29uZmlnLCBjb21tYW5kTGlzdGVuZXJzKSAtPlxuICBuZXdDb21tYW5kTGlzdGVuZXJzID0ge31cbiAgZm9yIGNvbW1hbmROYW1lLCBjb21tYW5kTGlzdGVuZXIgb2YgY29tbWFuZExpc3RlbmVyc1xuICAgIGRvIChjb21tYW5kTGlzdGVuZXIpIC0+XG4gICAgICBuZXdDb21tYW5kTGlzdGVuZXJzW2NvbW1hbmROYW1lXSA9IChldmVudCkgLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgbW9kZWwgPSBAZ2V0TW9kZWwoKVxuICAgICAgICBtb2RlbC50cmFuc2FjdCBtb2RlbC5nZXRVbmRvR3JvdXBpbmdJbnRlcnZhbCgpLCAtPlxuICAgICAgICAgIGNvbW1hbmRMaXN0ZW5lci5jYWxsKG1vZGVsLCBldmVudClcbiAgbmV3Q29tbWFuZExpc3RlbmVyc1xuXG5zaG93Q3Vyc29yU2NvcGUgPSAoZGVzY3JpcHRvciwgbm90aWZpY2F0aW9uTWFuYWdlcikgLT5cbiAgbGlzdCA9IGRlc2NyaXB0b3Iuc2NvcGVzLnRvU3RyaW5nKCkuc3BsaXQoJywnKVxuICBsaXN0ID0gbGlzdC5tYXAgKGl0ZW0pIC0+IFwiKiAje2l0ZW19XCJcbiAgY29udGVudCA9IFwiU2NvcGVzIGF0IEN1cnNvclxcbiN7bGlzdC5qb2luKCdcXG4nKX1cIlxuXG4gIG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkSW5mbyhjb250ZW50LCBkaXNtaXNzYWJsZTogdHJ1ZSlcblxuY29weVBhdGhUb0NsaXBib2FyZCA9IChlZGl0b3IsIHByb2plY3QsIGNsaXBib2FyZCwgcmVsYXRpdmUpIC0+XG4gIGlmIGZpbGVQYXRoID0gZWRpdG9yLmdldFBhdGgoKVxuICAgIGZpbGVQYXRoID0gcHJvamVjdC5yZWxhdGl2aXplKGZpbGVQYXRoKSBpZiByZWxhdGl2ZVxuICAgIGNsaXBib2FyZC53cml0ZShmaWxlUGF0aClcbiJdfQ==
