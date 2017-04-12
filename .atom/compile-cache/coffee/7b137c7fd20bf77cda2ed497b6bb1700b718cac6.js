(function() {
  var $, AddDialog, BufferedProcess, CompositeDisposable, CopyDialog, Directory, DirectoryView, FileView, LocalStorage, Minimatch, MoveDialog, RootDragAndDrop, TreeView, View, _, fs, getFullExtension, getStyleObject, path, ref, ref1, ref2, repoForPath, shell, toggleConfig,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  shell = require('electron').shell;

  _ = require('underscore-plus');

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require("./helpers"), repoForPath = ref1.repoForPath, getStyleObject = ref1.getStyleObject, getFullExtension = ref1.getFullExtension;

  ref2 = require('atom-space-pen-views'), $ = ref2.$, View = ref2.View;

  fs = require('fs-plus');

  AddDialog = null;

  MoveDialog = null;

  CopyDialog = null;

  Minimatch = null;

  Directory = require('./directory');

  DirectoryView = require('./directory-view');

  FileView = require('./file-view');

  RootDragAndDrop = require('./root-drag-and-drop');

  LocalStorage = window.localStorage;

  toggleConfig = function(keyPath) {
    return atom.config.set(keyPath, !atom.config.get(keyPath));
  };

  module.exports = TreeView = (function(superClass) {
    extend(TreeView, superClass);

    function TreeView() {
      this.onDragLeave = bind(this.onDragLeave, this);
      this.onDragEnter = bind(this.onDragEnter, this);
      this.onStylesheetsChanged = bind(this.onStylesheetsChanged, this);
      this.resizeTreeView = bind(this.resizeTreeView, this);
      this.resizeStopped = bind(this.resizeStopped, this);
      this.resizeStarted = bind(this.resizeStarted, this);
      return TreeView.__super__.constructor.apply(this, arguments);
    }

    TreeView.prototype.panel = null;

    TreeView.content = function() {
      return this.div({
        "class": 'tree-view-resizer tool-panel',
        'data-show-on-right-side': atom.config.get('tree-view.showOnRightSide')
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'tree-view-scroller order--center',
            outlet: 'scroller'
          }, function() {
            return _this.ol({
              "class": 'tree-view full-menu list-tree has-collapsable-children focusable-panel',
              tabindex: -1,
              outlet: 'list'
            });
          });
          return _this.div({
            "class": 'tree-view-resize-handle',
            outlet: 'resizeHandle'
          });
        };
      })(this));
    };

    TreeView.prototype.initialize = function(state) {
      this.disposables = new CompositeDisposable;
      this.focusAfterAttach = false;
      this.roots = [];
      this.scrollLeftAfterAttach = -1;
      this.scrollTopAfterAttach = -1;
      this.selectedPath = null;
      this.ignoredPatterns = [];
      this.useSyncFS = false;
      this.currentlyOpening = new Map;
      this.dragEventCounts = new WeakMap;
      this.rootDragAndDrop = new RootDragAndDrop(this);
      this.handleEvents();
      process.nextTick((function(_this) {
        return function() {
          var onStylesheetsChanged;
          _this.onStylesheetsChanged();
          onStylesheetsChanged = _.debounce(_this.onStylesheetsChanged, 100);
          _this.disposables.add(atom.styles.onDidAddStyleElement(onStylesheetsChanged));
          _this.disposables.add(atom.styles.onDidRemoveStyleElement(onStylesheetsChanged));
          return _this.disposables.add(atom.styles.onDidUpdateStyleElement(onStylesheetsChanged));
        };
      })(this));
      this.updateRoots(state.directoryExpansionStates);
      this.selectEntry(this.roots[0]);
      if (state.selectedPath) {
        this.selectEntryForPath(state.selectedPath);
      }
      this.focusAfterAttach = state.hasFocus;
      if (state.scrollTop) {
        this.scrollTopAfterAttach = state.scrollTop;
      }
      if (state.scrollLeft) {
        this.scrollLeftAfterAttach = state.scrollLeft;
      }
      this.attachAfterProjectPathSet = state.attached && _.isEmpty(atom.project.getPaths());
      if (state.width > 0) {
        this.width(state.width);
      }
      if (state.attached) {
        return this.attach();
      }
    };

    TreeView.prototype.attached = function() {
      if (this.focusAfterAttach) {
        this.focus();
      }
      if (this.scrollLeftAfterAttach > 0) {
        this.scroller.scrollLeft(this.scrollLeftAfterAttach);
      }
      if (this.scrollTopAfterAttach > 0) {
        return this.scrollTop(this.scrollTopAfterAttach);
      }
    };

    TreeView.prototype.detached = function() {
      return this.resizeStopped();
    };

    TreeView.prototype.serialize = function() {
      var ref3;
      return {
        directoryExpansionStates: new (function(roots) {
          var j, len, root;
          for (j = 0, len = roots.length; j < len; j++) {
            root = roots[j];
            this[root.directory.path] = root.directory.serializeExpansionState();
          }
          return this;
        })(this.roots),
        selectedPath: (ref3 = this.selectedEntry()) != null ? ref3.getPath() : void 0,
        hasFocus: this.hasFocus(),
        attached: this.panel != null,
        scrollLeft: this.scroller.scrollLeft(),
        scrollTop: this.scrollTop(),
        width: this.width()
      };
    };

    TreeView.prototype.deactivate = function() {
      var j, len, ref3, root;
      ref3 = this.roots;
      for (j = 0, len = ref3.length; j < len; j++) {
        root = ref3[j];
        root.directory.destroy();
      }
      this.disposables.dispose();
      this.rootDragAndDrop.dispose();
      if (this.panel != null) {
        return this.detach();
      }
    };

    TreeView.prototype.handleEvents = function() {
      this.on('dblclick', '.tree-view-resize-handle', (function(_this) {
        return function() {
          return _this.resizeToFitContent();
        };
      })(this));
      this.on('click', '.entry', (function(_this) {
        return function(e) {
          if (e.target.classList.contains('entries')) {
            return;
          }
          if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
            return _this.entryClicked(e);
          }
        };
      })(this));
      this.on('mousedown', '.entry', (function(_this) {
        return function(e) {
          return _this.onMouseDown(e);
        };
      })(this));
      this.on('mousedown', '.tree-view-resize-handle', (function(_this) {
        return function(e) {
          return _this.resizeStarted(e);
        };
      })(this));
      this.on('dragstart', '.entry', (function(_this) {
        return function(e) {
          return _this.onDragStart(e);
        };
      })(this));
      this.on('dragenter', '.entry.directory > .header', (function(_this) {
        return function(e) {
          return _this.onDragEnter(e);
        };
      })(this));
      this.on('dragleave', '.entry.directory > .header', (function(_this) {
        return function(e) {
          return _this.onDragLeave(e);
        };
      })(this));
      this.on('dragover', '.entry', (function(_this) {
        return function(e) {
          return _this.onDragOver(e);
        };
      })(this));
      this.on('drop', '.entry', (function(_this) {
        return function(e) {
          return _this.onDrop(e);
        };
      })(this));
      atom.commands.add(this.element, {
        'core:move-up': this.moveUp.bind(this),
        'core:move-down': this.moveDown.bind(this),
        'core:page-up': (function(_this) {
          return function() {
            return _this.pageUp();
          };
        })(this),
        'core:page-down': (function(_this) {
          return function() {
            return _this.pageDown();
          };
        })(this),
        'core:move-to-top': (function(_this) {
          return function() {
            return _this.scrollToTop();
          };
        })(this),
        'core:move-to-bottom': (function(_this) {
          return function() {
            return _this.scrollToBottom();
          };
        })(this),
        'tree-view:expand-item': (function(_this) {
          return function() {
            return _this.openSelectedEntry({
              pending: true
            }, true);
          };
        })(this),
        'tree-view:recursive-expand-directory': (function(_this) {
          return function() {
            return _this.expandDirectory(true);
          };
        })(this),
        'tree-view:collapse-directory': (function(_this) {
          return function() {
            return _this.collapseDirectory();
          };
        })(this),
        'tree-view:recursive-collapse-directory': (function(_this) {
          return function() {
            return _this.collapseDirectory(true);
          };
        })(this),
        'tree-view:open-selected-entry': (function(_this) {
          return function() {
            return _this.openSelectedEntry();
          };
        })(this),
        'tree-view:open-selected-entry-right': (function(_this) {
          return function() {
            return _this.openSelectedEntryRight();
          };
        })(this),
        'tree-view:open-selected-entry-left': (function(_this) {
          return function() {
            return _this.openSelectedEntryLeft();
          };
        })(this),
        'tree-view:open-selected-entry-up': (function(_this) {
          return function() {
            return _this.openSelectedEntryUp();
          };
        })(this),
        'tree-view:open-selected-entry-down': (function(_this) {
          return function() {
            return _this.openSelectedEntryDown();
          };
        })(this),
        'tree-view:move': (function(_this) {
          return function() {
            return _this.moveSelectedEntry();
          };
        })(this),
        'tree-view:copy': (function(_this) {
          return function() {
            return _this.copySelectedEntries();
          };
        })(this),
        'tree-view:cut': (function(_this) {
          return function() {
            return _this.cutSelectedEntries();
          };
        })(this),
        'tree-view:paste': (function(_this) {
          return function() {
            return _this.pasteEntries();
          };
        })(this),
        'tree-view:copy-full-path': (function(_this) {
          return function() {
            return _this.copySelectedEntryPath(false);
          };
        })(this),
        'tree-view:show-in-file-manager': (function(_this) {
          return function() {
            return _this.showSelectedEntryInFileManager();
          };
        })(this),
        'tree-view:open-in-new-window': (function(_this) {
          return function() {
            return _this.openSelectedEntryInNewWindow();
          };
        })(this),
        'tree-view:copy-project-path': (function(_this) {
          return function() {
            return _this.copySelectedEntryPath(true);
          };
        })(this),
        'tool-panel:unfocus': (function(_this) {
          return function() {
            return _this.unfocus();
          };
        })(this),
        'tree-view:toggle-vcs-ignored-files': function() {
          return toggleConfig('tree-view.hideVcsIgnoredFiles');
        },
        'tree-view:toggle-ignored-names': function() {
          return toggleConfig('tree-view.hideIgnoredNames');
        },
        'tree-view:remove-project-folder': (function(_this) {
          return function(e) {
            return _this.removeProjectFolder(e);
          };
        })(this)
      });
      [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach((function(_this) {
        return function(index) {
          return atom.commands.add(_this.element, "tree-view:open-selected-entry-in-pane-" + (index + 1), function() {
            return _this.openSelectedEntryInPane(index);
          });
        };
      })(this));
      this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          _this.selectActiveFile();
          if (atom.config.get('tree-view.autoReveal')) {
            return _this.revealActiveFile();
          }
        };
      })(this)));
      this.disposables.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.updateRoots();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('tree-view.hideVcsIgnoredFiles', (function(_this) {
        return function() {
          return _this.updateRoots();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('tree-view.hideIgnoredNames', (function(_this) {
        return function() {
          return _this.updateRoots();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('core.ignoredNames', (function(_this) {
        return function() {
          if (atom.config.get('tree-view.hideIgnoredNames')) {
            return _this.updateRoots();
          }
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('tree-view.showOnRightSide', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          return _this.onSideToggled(newValue);
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('tree-view.sortFoldersBeforeFiles', (function(_this) {
        return function() {
          return _this.updateRoots();
        };
      })(this)));
      return this.disposables.add(atom.config.onDidChange('tree-view.squashDirectoryNames', (function(_this) {
        return function() {
          return _this.updateRoots();
        };
      })(this)));
    };

    TreeView.prototype.toggle = function() {
      if (this.isVisible()) {
        return this.detach();
      } else {
        return this.show();
      }
    };

    TreeView.prototype.show = function() {
      this.attach();
      return this.focus();
    };

    TreeView.prototype.attach = function() {
      if (_.isEmpty(atom.project.getPaths())) {
        return;
      }
      return this.panel != null ? this.panel : this.panel = atom.config.get('tree-view.showOnRightSide') ? atom.workspace.addRightPanel({
        item: this
      }) : atom.workspace.addLeftPanel({
        item: this
      });
    };

    TreeView.prototype.detach = function() {
      this.scrollLeftAfterAttach = this.scroller.scrollLeft();
      this.scrollTopAfterAttach = this.scrollTop();
      LocalStorage['tree-view:cutPath'] = null;
      LocalStorage['tree-view:copyPath'] = null;
      this.panel.destroy();
      this.panel = null;
      return this.unfocus();
    };

    TreeView.prototype.focus = function() {
      return this.list.focus();
    };

    TreeView.prototype.unfocus = function() {
      return atom.workspace.getActivePane().activate();
    };

    TreeView.prototype.hasFocus = function() {
      return this.list.is(':focus') || document.activeElement === this.list[0];
    };

    TreeView.prototype.toggleFocus = function() {
      if (this.hasFocus()) {
        return this.unfocus();
      } else {
        return this.show();
      }
    };

    TreeView.prototype.entryClicked = function(e) {
      var entry, isRecursive;
      entry = e.currentTarget;
      isRecursive = e.altKey || false;
      this.selectEntry(entry);
      if (entry instanceof DirectoryView) {
        entry.toggleExpansion(isRecursive);
      } else if (entry instanceof FileView) {
        this.fileViewEntryClicked(e);
      }
      return false;
    };

    TreeView.prototype.fileViewEntryClicked = function(e) {
      var alwaysOpenExisting, detail, filePath, openPromise, ref3, ref4;
      filePath = e.currentTarget.getPath();
      detail = (ref3 = (ref4 = e.originalEvent) != null ? ref4.detail : void 0) != null ? ref3 : 1;
      alwaysOpenExisting = atom.config.get('tree-view.alwaysOpenExisting');
      if (detail === 1) {
        if (atom.config.get('core.allowPendingPaneItems')) {
          openPromise = atom.workspace.open(filePath, {
            pending: true,
            activatePane: false,
            searchAllPanes: alwaysOpenExisting
          });
          this.currentlyOpening.set(filePath, openPromise);
          return openPromise.then((function(_this) {
            return function() {
              return _this.currentlyOpening["delete"](filePath);
            };
          })(this));
        }
      } else if (detail === 2) {
        return this.openAfterPromise(filePath, {
          searchAllPanes: alwaysOpenExisting
        });
      }
    };

    TreeView.prototype.openAfterPromise = function(uri, options) {
      var promise;
      if (promise = this.currentlyOpening.get(uri)) {
        return promise.then(function() {
          return atom.workspace.open(uri, options);
        });
      } else {
        return atom.workspace.open(uri, options);
      }
    };

    TreeView.prototype.resizeStarted = function() {
      $(document).on('mousemove', this.resizeTreeView);
      return $(document).on('mouseup', this.resizeStopped);
    };

    TreeView.prototype.resizeStopped = function() {
      $(document).off('mousemove', this.resizeTreeView);
      return $(document).off('mouseup', this.resizeStopped);
    };

    TreeView.prototype.resizeTreeView = function(arg) {
      var pageX, which, width;
      pageX = arg.pageX, which = arg.which;
      if (which !== 1) {
        return this.resizeStopped();
      }
      if (atom.config.get('tree-view.showOnRightSide')) {
        width = this.outerWidth() + this.offset().left - pageX;
      } else {
        width = pageX - this.offset().left;
      }
      return this.width(width);
    };

    TreeView.prototype.resizeToFitContent = function() {
      this.width(1);
      return this.width(this.list.outerWidth());
    };

    TreeView.prototype.loadIgnoredPatterns = function() {
      var error, ignoredName, ignoredNames, j, len, ref3, results;
      this.ignoredPatterns.length = 0;
      if (!atom.config.get('tree-view.hideIgnoredNames')) {
        return;
      }
      if (Minimatch == null) {
        Minimatch = require('minimatch').Minimatch;
      }
      ignoredNames = (ref3 = atom.config.get('core.ignoredNames')) != null ? ref3 : [];
      if (typeof ignoredNames === 'string') {
        ignoredNames = [ignoredNames];
      }
      results = [];
      for (j = 0, len = ignoredNames.length; j < len; j++) {
        ignoredName = ignoredNames[j];
        if (ignoredName) {
          try {
            results.push(this.ignoredPatterns.push(new Minimatch(ignoredName, {
              matchBase: true,
              dot: true
            })));
          } catch (error1) {
            error = error1;
            results.push(atom.notifications.addWarning("Error parsing ignore pattern (" + ignoredName + ")", {
              detail: error.message
            }));
          }
        }
      }
      return results;
    };

    TreeView.prototype.updateRoots = function(expansionStates) {
      var directory, j, key, len, oldExpansionStates, projectPath, ref3, root, stats;
      if (expansionStates == null) {
        expansionStates = {};
      }
      oldExpansionStates = {};
      ref3 = this.roots;
      for (j = 0, len = ref3.length; j < len; j++) {
        root = ref3[j];
        oldExpansionStates[root.directory.path] = root.directory.serializeExpansionState();
        root.directory.destroy();
        root.remove();
      }
      this.loadIgnoredPatterns();
      this.roots = (function() {
        var k, l, len1, len2, ref4, ref5, ref6, ref7, results;
        ref4 = atom.project.getPaths();
        results = [];
        for (k = 0, len1 = ref4.length; k < len1; k++) {
          projectPath = ref4[k];
          if (!(stats = fs.lstatSyncNoException(projectPath))) {
            continue;
          }
          stats = _.pick.apply(_, [stats].concat(slice.call(_.keys(stats))));
          ref5 = ["atime", "birthtime", "ctime", "mtime"];
          for (l = 0, len2 = ref5.length; l < len2; l++) {
            key = ref5[l];
            stats[key] = stats[key].getTime();
          }
          directory = new Directory({
            name: path.basename(projectPath),
            fullPath: projectPath,
            symlink: false,
            isRoot: true,
            expansionState: (ref6 = (ref7 = expansionStates[projectPath]) != null ? ref7 : oldExpansionStates[projectPath]) != null ? ref6 : {
              isExpanded: true
            },
            ignoredPatterns: this.ignoredPatterns,
            useSyncFS: this.useSyncFS,
            stats: stats
          });
          root = new DirectoryView();
          root.initialize(directory);
          this.list[0].appendChild(root);
          results.push(root);
        }
        return results;
      }).call(this);
      if (this.attachAfterProjectPathSet) {
        this.attach();
        return this.attachAfterProjectPathSet = false;
      }
    };

    TreeView.prototype.getActivePath = function() {
      var ref3;
      return (ref3 = atom.workspace.getActivePaneItem()) != null ? typeof ref3.getPath === "function" ? ref3.getPath() : void 0 : void 0;
    };

    TreeView.prototype.selectActiveFile = function() {
      var activeFilePath;
      if (activeFilePath = this.getActivePath()) {
        return this.selectEntryForPath(activeFilePath);
      } else {
        return this.deselect();
      }
    };

    TreeView.prototype.revealActiveFile = function() {
      var activeFilePath, activePathComponents, currentPath, entry, j, len, pathComponent, ref3, relativePath, results, rootPath;
      if (_.isEmpty(atom.project.getPaths())) {
        return;
      }
      this.attach();
      if (atom.config.get('tree-view.focusOnReveal')) {
        this.focus();
      }
      if (!(activeFilePath = this.getActivePath())) {
        return;
      }
      ref3 = atom.project.relativizePath(activeFilePath), rootPath = ref3[0], relativePath = ref3[1];
      if (rootPath == null) {
        return;
      }
      activePathComponents = relativePath.split(path.sep);
      currentPath = rootPath;
      results = [];
      for (j = 0, len = activePathComponents.length; j < len; j++) {
        pathComponent = activePathComponents[j];
        currentPath += path.sep + pathComponent;
        entry = this.entryForPath(currentPath);
        if (entry instanceof DirectoryView) {
          results.push(entry.expand());
        } else {
          this.selectEntry(entry);
          results.push(this.scrollToEntry(entry));
        }
      }
      return results;
    };

    TreeView.prototype.copySelectedEntryPath = function(relativePath) {
      var pathToCopy;
      if (relativePath == null) {
        relativePath = false;
      }
      if (pathToCopy = this.selectedPath) {
        if (relativePath) {
          pathToCopy = atom.project.relativize(pathToCopy);
        }
        return atom.clipboard.write(pathToCopy);
      }
    };

    TreeView.prototype.entryForPath = function(entryPath) {
      var bestMatchEntry, bestMatchLength, entry, entryLength, j, len, ref3, ref4;
      bestMatchEntry = null;
      bestMatchLength = 0;
      ref3 = this.list[0].querySelectorAll('.entry');
      for (j = 0, len = ref3.length; j < len; j++) {
        entry = ref3[j];
        if (entry.isPathEqual(entryPath)) {
          return entry;
        }
        entryLength = entry.getPath().length;
        if (((ref4 = entry.directory) != null ? ref4.contains(entryPath) : void 0) && entryLength > bestMatchLength) {
          bestMatchEntry = entry;
          bestMatchLength = entryLength;
        }
      }
      return bestMatchEntry;
    };

    TreeView.prototype.selectEntryForPath = function(entryPath) {
      return this.selectEntry(this.entryForPath(entryPath));
    };

    TreeView.prototype.moveDown = function(event) {
      var selectedEntry;
      if (event != null) {
        event.stopImmediatePropagation();
      }
      selectedEntry = this.selectedEntry();
      if (selectedEntry != null) {
        if (selectedEntry instanceof DirectoryView) {
          if (this.selectEntry(selectedEntry.entries.children[0])) {
            this.scrollToEntry(this.selectedEntry());
            return;
          }
        }
        selectedEntry = $(selectedEntry);
        while (!this.selectEntry(selectedEntry.next('.entry')[0])) {
          selectedEntry = selectedEntry.parents('.entry:first');
          if (!selectedEntry.length) {
            break;
          }
        }
      } else {
        this.selectEntry(this.roots[0]);
      }
      return this.scrollToEntry(this.selectedEntry());
    };

    TreeView.prototype.moveUp = function(event) {
      var previousEntry, ref3, ref4, selectedEntry;
      event.stopImmediatePropagation();
      selectedEntry = this.selectedEntry();
      if (selectedEntry != null) {
        selectedEntry = $(selectedEntry);
        if (previousEntry = this.selectEntry(selectedEntry.prev('.entry')[0])) {
          if (previousEntry instanceof DirectoryView) {
            this.selectEntry(_.last(previousEntry.entries.children));
          }
        } else {
          this.selectEntry((ref3 = selectedEntry.parents('.directory').first()) != null ? ref3[0] : void 0);
        }
      } else {
        this.selectEntry((ref4 = this.list.find('.entry').last()) != null ? ref4[0] : void 0);
      }
      return this.scrollToEntry(this.selectedEntry());
    };

    TreeView.prototype.expandDirectory = function(isRecursive) {
      var selectedEntry;
      if (isRecursive == null) {
        isRecursive = false;
      }
      selectedEntry = this.selectedEntry();
      if (isRecursive === false && selectedEntry.isExpanded) {
        if (selectedEntry.directory.getEntries().length > 0) {
          return this.moveDown();
        }
      } else {
        return selectedEntry.expand(isRecursive);
      }
    };

    TreeView.prototype.collapseDirectory = function(isRecursive) {
      var directory, selectedEntry;
      if (isRecursive == null) {
        isRecursive = false;
      }
      selectedEntry = this.selectedEntry();
      if (selectedEntry == null) {
        return;
      }
      if (directory = $(selectedEntry).closest('.expanded.directory')[0]) {
        directory.collapse(isRecursive);
        return this.selectEntry(directory);
      }
    };

    TreeView.prototype.openSelectedEntry = function(options, expandDirectory) {
      var selectedEntry;
      if (options == null) {
        options = {};
      }
      if (expandDirectory == null) {
        expandDirectory = false;
      }
      selectedEntry = this.selectedEntry();
      if (selectedEntry instanceof DirectoryView) {
        if (expandDirectory) {
          return this.expandDirectory(false);
        } else {
          return selectedEntry.toggleExpansion();
        }
      } else if (selectedEntry instanceof FileView) {
        if (atom.config.get('tree-view.alwaysOpenExisting')) {
          options = Object.assign({
            searchAllPanes: true
          }, options);
        }
        return this.openAfterPromise(selectedEntry.getPath(), options);
      }
    };

    TreeView.prototype.openSelectedEntrySplit = function(orientation, side) {
      var pane, selectedEntry, split;
      selectedEntry = this.selectedEntry();
      pane = atom.workspace.getActivePane();
      if (pane && selectedEntry instanceof FileView) {
        if (atom.workspace.getActivePaneItem()) {
          split = pane.split(orientation, side);
          return atom.workspace.openURIInPane(selectedEntry.getPath(), split);
        } else {
          return this.openSelectedEntry(true);
        }
      }
    };

    TreeView.prototype.openSelectedEntryRight = function() {
      return this.openSelectedEntrySplit('horizontal', 'after');
    };

    TreeView.prototype.openSelectedEntryLeft = function() {
      return this.openSelectedEntrySplit('horizontal', 'before');
    };

    TreeView.prototype.openSelectedEntryUp = function() {
      return this.openSelectedEntrySplit('vertical', 'before');
    };

    TreeView.prototype.openSelectedEntryDown = function() {
      return this.openSelectedEntrySplit('vertical', 'after');
    };

    TreeView.prototype.openSelectedEntryInPane = function(index) {
      var pane, selectedEntry;
      selectedEntry = this.selectedEntry();
      pane = atom.workspace.getPanes()[index];
      if (pane && selectedEntry instanceof FileView) {
        return atom.workspace.openURIInPane(selectedEntry.getPath(), pane);
      }
    };

    TreeView.prototype.moveSelectedEntry = function() {
      var dialog, entry, oldPath;
      if (this.hasFocus()) {
        entry = this.selectedEntry();
        if ((entry == null) || indexOf.call(this.roots, entry) >= 0) {
          return;
        }
        oldPath = entry.getPath();
      } else {
        oldPath = this.getActivePath();
      }
      if (oldPath) {
        if (MoveDialog == null) {
          MoveDialog = require('./move-dialog');
        }
        dialog = new MoveDialog(oldPath);
        return dialog.attach();
      }
    };

    TreeView.prototype.fileManagerCommandForPath = function(pathToOpen, isFile) {
      var args, command;
      switch (process.platform) {
        case 'darwin':
          return {
            command: 'open',
            label: 'Finder',
            args: ['-R', pathToOpen]
          };
        case 'win32':
          args = ["/select,\"" + pathToOpen + "\""];
          if (process.env.SystemRoot) {
            command = path.join(process.env.SystemRoot, 'explorer.exe');
          } else {
            command = 'explorer.exe';
          }
          return {
            command: command,
            label: 'Explorer',
            args: args
          };
        default:
          if (isFile) {
            pathToOpen = path.dirname(pathToOpen);
          }
          return {
            command: 'xdg-open',
            label: 'File Manager',
            args: [pathToOpen]
          };
      }
    };

    TreeView.prototype.openInFileManager = function(command, args, label, isFile) {
      var errorLines, exit, handleError, showProcess, stderr;
      handleError = function(errorMessage) {
        return atom.notifications.addError("Opening " + (isFile ? 'file' : 'folder') + " in " + label + " failed", {
          detail: errorMessage,
          dismissable: true
        });
      };
      errorLines = [];
      stderr = function(lines) {
        return errorLines.push(lines);
      };
      exit = function(code) {
        var errorMessage, failed;
        failed = code !== 0;
        errorMessage = errorLines.join('\n');
        if (process.platform === 'win32' && code === 1 && !errorMessage) {
          failed = false;
        }
        if (failed) {
          return handleError(errorMessage);
        }
      };
      showProcess = new BufferedProcess({
        command: command,
        args: args,
        stderr: stderr,
        exit: exit
      });
      showProcess.onWillThrowError(function(arg) {
        var error, handle;
        error = arg.error, handle = arg.handle;
        handle();
        return handleError(error != null ? error.message : void 0);
      });
      return showProcess;
    };

    TreeView.prototype.showSelectedEntryInFileManager = function() {
      var args, command, entry, isFile, label, ref3;
      if (!(entry = this.selectedEntry())) {
        return;
      }
      isFile = entry instanceof FileView;
      ref3 = this.fileManagerCommandForPath(entry.getPath(), isFile), command = ref3.command, args = ref3.args, label = ref3.label;
      return this.openInFileManager(command, args, label, isFile);
    };

    TreeView.prototype.showCurrentFileInFileManager = function() {
      var args, command, editor, label, ref3;
      if (!(editor = atom.workspace.getActiveTextEditor())) {
        return;
      }
      if (!editor.getPath()) {
        return;
      }
      ref3 = this.fileManagerCommandForPath(editor.getPath(), true), command = ref3.command, args = ref3.args, label = ref3.label;
      return this.openInFileManager(command, args, label, true);
    };

    TreeView.prototype.openSelectedEntryInNewWindow = function() {
      var pathToOpen, ref3;
      if (pathToOpen = (ref3 = this.selectedEntry()) != null ? ref3.getPath() : void 0) {
        return atom.open({
          pathsToOpen: [pathToOpen],
          newWindow: true
        });
      }
    };

    TreeView.prototype.copySelectedEntry = function() {
      var dialog, entry, oldPath;
      if (this.hasFocus()) {
        entry = this.selectedEntry();
        if (indexOf.call(this.roots, entry) >= 0) {
          return;
        }
        oldPath = entry != null ? entry.getPath() : void 0;
      } else {
        oldPath = this.getActivePath();
      }
      if (!oldPath) {
        return;
      }
      if (CopyDialog == null) {
        CopyDialog = require('./copy-dialog');
      }
      dialog = new CopyDialog(oldPath);
      return dialog.attach();
    };

    TreeView.prototype.removeSelectedEntries = function() {
      var activePath, j, len, ref3, ref4, root, selectedPaths;
      if (this.hasFocus()) {
        selectedPaths = this.selectedPaths();
      } else if (activePath = this.getActivePath()) {
        selectedPaths = [activePath];
      }
      if (!(selectedPaths && selectedPaths.length > 0)) {
        return;
      }
      ref3 = this.roots;
      for (j = 0, len = ref3.length; j < len; j++) {
        root = ref3[j];
        if (ref4 = root.getPath(), indexOf.call(selectedPaths, ref4) >= 0) {
          atom.confirm({
            message: "The root directory '" + root.directory.name + "' can't be removed.",
            buttons: ['OK']
          });
          return;
        }
      }
      return atom.confirm({
        message: "Are you sure you want to delete the selected " + (selectedPaths.length > 1 ? 'items' : 'item') + "?",
        detailedMessage: "You are deleting:\n" + (selectedPaths.join('\n')),
        buttons: {
          "Move to Trash": function() {
            var failedDeletions, k, len1, repo, selectedPath;
            failedDeletions = [];
            for (k = 0, len1 = selectedPaths.length; k < len1; k++) {
              selectedPath = selectedPaths[k];
              if (!shell.moveItemToTrash(selectedPath)) {
                failedDeletions.push("" + selectedPath);
              }
              if (repo = repoForPath(selectedPath)) {
                repo.getPathStatus(selectedPath);
              }
            }
            if (failedDeletions.length > 0) {
              return atom.notifications.addError("The following " + (failedDeletions.length > 1 ? 'files' : 'file') + " couldn't be moved to trash" + (process.platform === 'linux' ? " (is `gvfs-trash` installed?)" : ""), {
                detail: "" + (failedDeletions.join('\n')),
                dismissable: true
              });
            }
          },
          "Cancel": null
        }
      });
    };

    TreeView.prototype.copySelectedEntries = function() {
      var selectedPaths;
      selectedPaths = this.selectedPaths();
      if (!(selectedPaths && selectedPaths.length > 0)) {
        return;
      }
      LocalStorage.removeItem('tree-view:cutPath');
      return LocalStorage['tree-view:copyPath'] = JSON.stringify(selectedPaths);
    };

    TreeView.prototype.cutSelectedEntries = function() {
      var selectedPaths;
      selectedPaths = this.selectedPaths();
      if (!(selectedPaths && selectedPaths.length > 0)) {
        return;
      }
      LocalStorage.removeItem('tree-view:copyPath');
      return LocalStorage['tree-view:cutPath'] = JSON.stringify(selectedPaths);
    };

    TreeView.prototype.pasteEntries = function() {
      var basePath, catchAndShowFileErrors, copiedPaths, cutPaths, extension, fileCounter, filePath, initialPath, initialPathIsDirectory, initialPaths, j, len, newPath, originalNewPath, ref3, results, selectedEntry;
      selectedEntry = this.selectedEntry();
      cutPaths = LocalStorage['tree-view:cutPath'] ? JSON.parse(LocalStorage['tree-view:cutPath']) : null;
      copiedPaths = LocalStorage['tree-view:copyPath'] ? JSON.parse(LocalStorage['tree-view:copyPath']) : null;
      initialPaths = copiedPaths || cutPaths;
      catchAndShowFileErrors = function(operation) {
        var error;
        try {
          return operation();
        } catch (error1) {
          error = error1;
          return atom.notifications.addWarning("Unable to paste paths: " + initialPaths, {
            detail: error.message
          });
        }
      };
      ref3 = initialPaths != null ? initialPaths : [];
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        initialPath = ref3[j];
        initialPathIsDirectory = fs.isDirectorySync(initialPath);
        if (selectedEntry && initialPath && fs.existsSync(initialPath)) {
          basePath = selectedEntry.getPath();
          if (selectedEntry instanceof FileView) {
            basePath = path.dirname(basePath);
          }
          newPath = path.join(basePath, path.basename(initialPath));
          if (copiedPaths) {
            fileCounter = 0;
            originalNewPath = newPath;
            while (fs.existsSync(newPath)) {
              if (initialPathIsDirectory) {
                newPath = "" + originalNewPath + fileCounter;
              } else {
                extension = getFullExtension(originalNewPath);
                filePath = path.join(path.dirname(originalNewPath), path.basename(originalNewPath, extension));
                newPath = "" + filePath + fileCounter + extension;
              }
              fileCounter += 1;
            }
            if (fs.isDirectorySync(initialPath)) {
              results.push(catchAndShowFileErrors(function() {
                return fs.copySync(initialPath, newPath);
              }));
            } else {
              results.push(catchAndShowFileErrors(function() {
                return fs.writeFileSync(newPath, fs.readFileSync(initialPath));
              }));
            }
          } else if (cutPaths) {
            if (!(fs.existsSync(newPath) || newPath.startsWith(initialPath))) {
              results.push(catchAndShowFileErrors(function() {
                return fs.moveSync(initialPath, newPath);
              }));
            } else {
              results.push(void 0);
            }
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    TreeView.prototype.add = function(isCreatingFile) {
      var dialog, ref3, ref4, selectedEntry, selectedPath;
      selectedEntry = (ref3 = this.selectedEntry()) != null ? ref3 : this.roots[0];
      selectedPath = (ref4 = selectedEntry != null ? selectedEntry.getPath() : void 0) != null ? ref4 : '';
      if (AddDialog == null) {
        AddDialog = require('./add-dialog');
      }
      dialog = new AddDialog(selectedPath, isCreatingFile);
      dialog.on('directory-created', (function(_this) {
        return function(event, createdPath) {
          var ref5;
          if ((ref5 = _this.entryForPath(createdPath)) != null) {
            ref5.reload();
          }
          _this.selectEntryForPath(createdPath);
          return false;
        };
      })(this));
      dialog.on('file-created', function(event, createdPath) {
        atom.workspace.open(createdPath);
        return false;
      });
      return dialog.attach();
    };

    TreeView.prototype.removeProjectFolder = function(e) {
      var pathToRemove;
      pathToRemove = $(e.target).closest(".project-root > .header").find(".name").data("path");
      if (atom.project.removePath != null) {
        if (pathToRemove != null) {
          return atom.project.removePath(pathToRemove);
        }
      }
    };

    TreeView.prototype.selectedEntry = function() {
      return this.list[0].querySelector('.selected');
    };

    TreeView.prototype.selectEntry = function(entry) {
      var selectedEntries;
      if (entry == null) {
        return;
      }
      this.selectedPath = entry.getPath();
      selectedEntries = this.getSelectedEntries();
      if (selectedEntries.length > 1 || selectedEntries[0] !== entry) {
        this.deselect(selectedEntries);
        entry.classList.add('selected');
      }
      return entry;
    };

    TreeView.prototype.getSelectedEntries = function() {
      return this.list[0].querySelectorAll('.selected');
    };

    TreeView.prototype.deselect = function(elementsToDeselect) {
      var j, len, selected;
      if (elementsToDeselect == null) {
        elementsToDeselect = this.getSelectedEntries();
      }
      for (j = 0, len = elementsToDeselect.length; j < len; j++) {
        selected = elementsToDeselect[j];
        selected.classList.remove('selected');
      }
      return void 0;
    };

    TreeView.prototype.scrollTop = function(top) {
      if (top != null) {
        return this.scroller.scrollTop(top);
      } else {
        return this.scroller.scrollTop();
      }
    };

    TreeView.prototype.scrollBottom = function(bottom) {
      if (bottom != null) {
        return this.scroller.scrollBottom(bottom);
      } else {
        return this.scroller.scrollBottom();
      }
    };

    TreeView.prototype.scrollToEntry = function(entry) {
      var element;
      element = entry instanceof DirectoryView ? entry.header : entry;
      return element != null ? element.scrollIntoViewIfNeeded(true) : void 0;
    };

    TreeView.prototype.scrollToBottom = function() {
      var lastEntry;
      if (lastEntry = _.last(this.list[0].querySelectorAll('.entry'))) {
        this.selectEntry(lastEntry);
        return this.scrollToEntry(lastEntry);
      }
    };

    TreeView.prototype.scrollToTop = function() {
      if (this.roots[0] != null) {
        this.selectEntry(this.roots[0]);
      }
      return this.scrollTop(0);
    };

    TreeView.prototype.toggleSide = function() {
      return toggleConfig('tree-view.showOnRightSide');
    };

    TreeView.prototype.moveEntry = function(initialPath, newDirectoryPath) {
      var entryName, error, newPath, repo;
      if (initialPath === newDirectoryPath) {
        return;
      }
      entryName = path.basename(initialPath);
      newPath = (newDirectoryPath + "/" + entryName).replace(/\s+$/, '');
      try {
        if (!fs.existsSync(newDirectoryPath)) {
          fs.makeTreeSync(newDirectoryPath);
        }
        fs.moveSync(initialPath, newPath);
        if (repo = repoForPath(newPath)) {
          repo.getPathStatus(initialPath);
          return repo.getPathStatus(newPath);
        }
      } catch (error1) {
        error = error1;
        return atom.notifications.addWarning("Failed to move entry " + initialPath + " to " + newDirectoryPath, {
          detail: error.message
        });
      }
    };

    TreeView.prototype.onStylesheetsChanged = function() {
      if (!this.isVisible()) {
        return;
      }
      this.element.style.display = 'none';
      this.element.offsetWidth;
      return this.element.style.display = '';
    };

    TreeView.prototype.onMouseDown = function(e) {
      var entryToSelect;
      e.stopPropagation();
      if (this.multiSelectEnabled() && e.currentTarget.classList.contains('selected') && (e.button === 2 || e.ctrlKey && process.platform === 'darwin')) {
        return;
      }
      entryToSelect = e.currentTarget;
      if (e.shiftKey) {
        this.selectContinuousEntries(entryToSelect);
        return this.showMultiSelectMenu();
      } else if (e.metaKey || (e.ctrlKey && process.platform !== 'darwin')) {
        this.selectMultipleEntries(entryToSelect);
        if (this.selectedPaths().length > 1) {
          return this.showMultiSelectMenu();
        }
      } else {
        this.selectEntry(entryToSelect);
        return this.showFullMenu();
      }
    };

    TreeView.prototype.onSideToggled = function(newValue) {
      this.element.dataset.showOnRightSide = newValue;
      if (this.isVisible()) {
        this.detach();
        return this.attach();
      }
    };

    TreeView.prototype.selectedPaths = function() {
      var entry, j, len, ref3, results;
      ref3 = this.getSelectedEntries();
      results = [];
      for (j = 0, len = ref3.length; j < len; j++) {
        entry = ref3[j];
        results.push(entry.getPath());
      }
      return results;
    };

    TreeView.prototype.selectContinuousEntries = function(entry) {
      var currentSelectedEntry, element, elements, entries, entryIndex, i, j, len, parentContainer, selectedIndex;
      currentSelectedEntry = this.selectedEntry();
      parentContainer = $(entry).parent();
      if ($.contains(parentContainer[0], currentSelectedEntry)) {
        entries = parentContainer.find('.entry').toArray();
        entryIndex = entries.indexOf(entry);
        selectedIndex = entries.indexOf(currentSelectedEntry);
        elements = (function() {
          var j, ref3, ref4, results;
          results = [];
          for (i = j = ref3 = entryIndex, ref4 = selectedIndex; ref3 <= ref4 ? j <= ref4 : j >= ref4; i = ref3 <= ref4 ? ++j : --j) {
            results.push(entries[i]);
          }
          return results;
        })();
        this.deselect();
        for (j = 0, len = elements.length; j < len; j++) {
          element = elements[j];
          element.classList.add('selected');
        }
      }
      return elements;
    };

    TreeView.prototype.selectMultipleEntries = function(entry) {
      if (entry != null) {
        entry.classList.toggle('selected');
      }
      return entry;
    };

    TreeView.prototype.showFullMenu = function() {
      this.list[0].classList.remove('multi-select');
      return this.list[0].classList.add('full-menu');
    };

    TreeView.prototype.showMultiSelectMenu = function() {
      this.list[0].classList.remove('full-menu');
      return this.list[0].classList.add('multi-select');
    };

    TreeView.prototype.multiSelectEnabled = function() {
      return this.list[0].classList.contains('multi-select');
    };

    TreeView.prototype.onDragEnter = function(e) {
      var entry;
      if (this.rootDragAndDrop.isDragging(e)) {
        return;
      }
      e.stopPropagation();
      entry = e.currentTarget.parentNode;
      if (!this.dragEventCounts.get(entry)) {
        this.dragEventCounts.set(entry, 0);
      }
      if (this.dragEventCounts.get(entry) === 0) {
        entry.classList.add('selected');
      }
      return this.dragEventCounts.set(entry, this.dragEventCounts.get(entry) + 1);
    };

    TreeView.prototype.onDragLeave = function(e) {
      var entry;
      if (this.rootDragAndDrop.isDragging(e)) {
        return;
      }
      e.stopPropagation();
      entry = e.currentTarget.parentNode;
      this.dragEventCounts.set(entry, this.dragEventCounts.get(entry) - 1);
      if (this.dragEventCounts.get(entry) === 0) {
        return entry.classList.remove('selected');
      }
    };

    TreeView.prototype.onDragStart = function(e) {
      var fileNameElement, initialPath, style, target;
      e.stopPropagation();
      if (this.rootDragAndDrop.canDragStart(e)) {
        return this.rootDragAndDrop.onDragStart(e);
      }
      target = $(e.currentTarget).find(".name");
      initialPath = target.data("path");
      style = getStyleObject(target[0]);
      fileNameElement = target.clone().css(style).css({
        position: 'absolute',
        top: 0,
        left: 0
      });
      fileNameElement.appendTo(document.body);
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setDragImage(fileNameElement[0], 0, 0);
      e.originalEvent.dataTransfer.setData("initialPath", initialPath);
      return window.requestAnimationFrame(function() {
        return fileNameElement.remove();
      });
    };

    TreeView.prototype.onDragOver = function(e) {
      var entry;
      if (this.rootDragAndDrop.isDragging(e)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      entry = e.currentTarget;
      if (this.dragEventCounts.get(entry) > 0 && !entry.classList.contains('selected')) {
        return entry.classList.add('selected');
      }
    };

    TreeView.prototype.onDrop = function(e) {
      var entry, file, initialPath, j, len, newDirectoryPath, ref3, results;
      if (this.rootDragAndDrop.isDragging(e)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      entry = e.currentTarget;
      entry.classList.remove('selected');
      if (!(entry instanceof DirectoryView)) {
        return;
      }
      newDirectoryPath = $(entry).find(".name").data("path");
      if (!newDirectoryPath) {
        return false;
      }
      initialPath = e.originalEvent.dataTransfer.getData("initialPath");
      if (initialPath) {
        return this.moveEntry(initialPath, newDirectoryPath);
      } else {
        ref3 = e.originalEvent.dataTransfer.files;
        results = [];
        for (j = 0, len = ref3.length; j < len; j++) {
          file = ref3[j];
          results.push(this.moveEntry(file.path, newDirectoryPath));
        }
        return results;
      }
    };

    return TreeView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL3RyZWUtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBRQUFBO0lBQUE7Ozs7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDTixRQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUVWLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBeUMsT0FBQSxDQUFRLE1BQVIsQ0FBekMsRUFBQyxxQ0FBRCxFQUFrQjs7RUFDbEIsT0FBa0QsT0FBQSxDQUFRLFdBQVIsQ0FBbEQsRUFBQyw4QkFBRCxFQUFjLG9DQUFkLEVBQThCOztFQUM5QixPQUFZLE9BQUEsQ0FBUSxzQkFBUixDQUFaLEVBQUMsVUFBRCxFQUFJOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFFTCxTQUFBLEdBQVk7O0VBQ1osVUFBQSxHQUFhOztFQUNiLFVBQUEsR0FBYTs7RUFDYixTQUFBLEdBQVk7O0VBRVosU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztFQUNaLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsZUFBQSxHQUFrQixPQUFBLENBQVEsc0JBQVI7O0VBQ2xCLFlBQUEsR0FBZSxNQUFNLENBQUM7O0VBRXRCLFlBQUEsR0FBZSxTQUFDLE9BQUQ7V0FDYixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsT0FBaEIsRUFBeUIsQ0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsT0FBaEIsQ0FBN0I7RUFEYTs7RUFHZixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7Ozs7Ozs7O3VCQUNKLEtBQUEsR0FBTzs7SUFFUCxRQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw4QkFBUDtRQUF1Qyx5QkFBQSxFQUEyQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMkJBQWhCLENBQWxFO09BQUwsRUFBcUgsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ25ILEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtDQUFQO1lBQTJDLE1BQUEsRUFBUSxVQUFuRDtXQUFMLEVBQW9FLFNBQUE7bUJBQ2xFLEtBQUMsQ0FBQSxFQUFELENBQUk7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHdFQUFQO2NBQWlGLFFBQUEsRUFBVSxDQUFDLENBQTVGO2NBQStGLE1BQUEsRUFBUSxNQUF2RzthQUFKO1VBRGtFLENBQXBFO2lCQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHlCQUFQO1lBQWtDLE1BQUEsRUFBUSxjQUExQztXQUFMO1FBSG1IO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFySDtJQURROzt1QkFNVixVQUFBLEdBQVksU0FBQyxLQUFEO01BQ1YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjtNQUNwQixJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLHFCQUFELEdBQXlCLENBQUM7TUFDMUIsSUFBQyxDQUFBLG9CQUFELEdBQXdCLENBQUM7TUFDekIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFDbkIsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFJO01BRXhCLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUk7TUFDdkIsSUFBQyxDQUFBLGVBQUQsR0FBdUIsSUFBQSxlQUFBLENBQWdCLElBQWhCO01BRXZCLElBQUMsQ0FBQSxZQUFELENBQUE7TUFFQSxPQUFPLENBQUMsUUFBUixDQUFpQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDZixjQUFBO1VBQUEsS0FBQyxDQUFBLG9CQUFELENBQUE7VUFDQSxvQkFBQSxHQUF1QixDQUFDLENBQUMsUUFBRixDQUFXLEtBQUMsQ0FBQSxvQkFBWixFQUFrQyxHQUFsQztVQUN2QixLQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBWixDQUFpQyxvQkFBakMsQ0FBakI7VUFDQSxLQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBWixDQUFvQyxvQkFBcEMsQ0FBakI7aUJBQ0EsS0FBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQVosQ0FBb0Msb0JBQXBDLENBQWpCO1FBTGU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO01BT0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxLQUFLLENBQUMsd0JBQW5CO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBcEI7TUFFQSxJQUEyQyxLQUFLLENBQUMsWUFBakQ7UUFBQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsS0FBSyxDQUFDLFlBQTFCLEVBQUE7O01BQ0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLEtBQUssQ0FBQztNQUMxQixJQUEyQyxLQUFLLENBQUMsU0FBakQ7UUFBQSxJQUFDLENBQUEsb0JBQUQsR0FBd0IsS0FBSyxDQUFDLFVBQTlCOztNQUNBLElBQTZDLEtBQUssQ0FBQyxVQUFuRDtRQUFBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixLQUFLLENBQUMsV0FBL0I7O01BQ0EsSUFBQyxDQUFBLHlCQUFELEdBQTZCLEtBQUssQ0FBQyxRQUFOLElBQW1CLENBQUMsQ0FBQyxPQUFGLENBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUEsQ0FBVjtNQUNoRCxJQUF1QixLQUFLLENBQUMsS0FBTixHQUFjLENBQXJDO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFLLENBQUMsS0FBYixFQUFBOztNQUNBLElBQWEsS0FBSyxDQUFDLFFBQW5CO2VBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUFBOztJQWhDVTs7dUJBa0NaLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBWSxJQUFDLENBQUEsZ0JBQWI7UUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBQUE7O01BQ0EsSUFBZ0QsSUFBQyxDQUFBLHFCQUFELEdBQXlCLENBQXpFO1FBQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLElBQUMsQ0FBQSxxQkFBdEIsRUFBQTs7TUFDQSxJQUFxQyxJQUFDLENBQUEsb0JBQUQsR0FBd0IsQ0FBN0Q7ZUFBQSxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUMsQ0FBQSxvQkFBWixFQUFBOztJQUhROzt1QkFLVixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxhQUFELENBQUE7SUFEUTs7dUJBR1YsU0FBQSxHQUFXLFNBQUE7QUFDVCxVQUFBO2FBQUE7UUFBQSx3QkFBQSxFQUE4QixJQUFBLENBQUMsU0FBQyxLQUFEO0FBQzdCLGNBQUE7QUFBQSxlQUFBLHVDQUFBOztZQUFBLElBQUUsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBRixHQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUFmLENBQUE7QUFBekI7aUJBQ0E7UUFGNkIsQ0FBRCxDQUFBLENBRXRCLElBQUMsQ0FBQSxLQUZxQixDQUE5QjtRQUdBLFlBQUEsOENBQThCLENBQUUsT0FBbEIsQ0FBQSxVQUhkO1FBSUEsUUFBQSxFQUFVLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FKVjtRQUtBLFFBQUEsRUFBVSxrQkFMVjtRQU1BLFVBQUEsRUFBWSxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQVYsQ0FBQSxDQU5aO1FBT0EsU0FBQSxFQUFXLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FQWDtRQVFBLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBRCxDQUFBLENBUlA7O0lBRFM7O3VCQVdYLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQWYsQ0FBQTtBQUFBO01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7TUFDQSxJQUFDLENBQUEsZUFBZSxDQUFDLE9BQWpCLENBQUE7TUFDQSxJQUFhLGtCQUFiO2VBQUEsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUFBOztJQUpVOzt1QkFNWixZQUFBLEdBQWMsU0FBQTtNQUNaLElBQUMsQ0FBQSxFQUFELENBQUksVUFBSixFQUFnQiwwQkFBaEIsRUFBNEMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUMxQyxLQUFDLENBQUEsa0JBQUQsQ0FBQTtRQUQwQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUM7TUFFQSxJQUFDLENBQUEsRUFBRCxDQUFJLE9BQUosRUFBYSxRQUFiLEVBQXVCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO1VBRXJCLElBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBbkIsQ0FBNEIsU0FBNUIsQ0FBVjtBQUFBLG1CQUFBOztVQUVBLElBQUEsQ0FBQSxDQUF3QixDQUFDLENBQUMsUUFBRixJQUFjLENBQUMsQ0FBQyxPQUFoQixJQUEyQixDQUFDLENBQUMsT0FBckQsQ0FBQTttQkFBQSxLQUFDLENBQUEsWUFBRCxDQUFjLENBQWQsRUFBQTs7UUFKcUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZCO01BS0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxXQUFKLEVBQWlCLFFBQWpCLEVBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO2lCQUN6QixLQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7UUFEeUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCO01BRUEsSUFBQyxDQUFBLEVBQUQsQ0FBSSxXQUFKLEVBQWlCLDBCQUFqQixFQUE2QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtpQkFBTyxLQUFDLENBQUEsYUFBRCxDQUFlLENBQWY7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0M7TUFDQSxJQUFDLENBQUEsRUFBRCxDQUFJLFdBQUosRUFBaUIsUUFBakIsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7aUJBQU8sS0FBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO1FBQVA7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCO01BQ0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxXQUFKLEVBQWlCLDRCQUFqQixFQUErQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtpQkFBTyxLQUFDLENBQUEsV0FBRCxDQUFhLENBQWI7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0M7TUFDQSxJQUFDLENBQUEsRUFBRCxDQUFJLFdBQUosRUFBaUIsNEJBQWpCLEVBQStDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO2lCQUFPLEtBQUMsQ0FBQSxXQUFELENBQWEsQ0FBYjtRQUFQO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEvQztNQUNBLElBQUMsQ0FBQSxFQUFELENBQUksVUFBSixFQUFnQixRQUFoQixFQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtpQkFBTyxLQUFDLENBQUEsVUFBRCxDQUFZLENBQVo7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7TUFDQSxJQUFDLENBQUEsRUFBRCxDQUFJLE1BQUosRUFBWSxRQUFaLEVBQXNCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO2lCQUFPLEtBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtRQUFQO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtNQUVBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsT0FBbkIsRUFDQztRQUFBLGNBQUEsRUFBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsSUFBYixDQUFoQjtRQUNBLGdCQUFBLEVBQWtCLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLElBQWYsQ0FEbEI7UUFFQSxjQUFBLEVBQWdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZoQjtRQUdBLGdCQUFBLEVBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFFBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUhsQjtRQUlBLGtCQUFBLEVBQW9CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUpwQjtRQUtBLHFCQUFBLEVBQXVCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGNBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUx2QjtRQU1BLHVCQUFBLEVBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGlCQUFELENBQW1CO2NBQUEsT0FBQSxFQUFTLElBQVQ7YUFBbkIsRUFBa0MsSUFBbEM7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FOekI7UUFPQSxzQ0FBQSxFQUF3QyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxlQUFELENBQWlCLElBQWpCO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBUHhDO1FBUUEsOEJBQUEsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsaUJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVJoQztRQVNBLHdDQUFBLEVBQTBDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBVDFDO1FBVUEsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsaUJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVZqQztRQVdBLHFDQUFBLEVBQXVDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLHNCQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FYdkM7UUFZQSxvQ0FBQSxFQUFzQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxxQkFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBWnRDO1FBYUEsa0NBQUEsRUFBb0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsbUJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWJwQztRQWNBLG9DQUFBLEVBQXNDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLHFCQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FkdEM7UUFlQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxpQkFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBZmxCO1FBZ0JBLGdCQUFBLEVBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLG1CQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FoQmxCO1FBaUJBLGVBQUEsRUFBaUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsa0JBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWpCakI7UUFrQkEsaUJBQUEsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsWUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBbEJuQjtRQW1CQSwwQkFBQSxFQUE0QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxxQkFBRCxDQUF1QixLQUF2QjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQW5CNUI7UUFvQkEsZ0NBQUEsRUFBa0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsOEJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXBCbEM7UUFxQkEsOEJBQUEsRUFBZ0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsNEJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXJCaEM7UUFzQkEsNkJBQUEsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEscUJBQUQsQ0FBdUIsSUFBdkI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0F0Qi9CO1FBdUJBLG9CQUFBLEVBQXNCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE9BQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQXZCdEI7UUF3QkEsb0NBQUEsRUFBc0MsU0FBQTtpQkFBRyxZQUFBLENBQWEsK0JBQWI7UUFBSCxDQXhCdEM7UUF5QkEsZ0NBQUEsRUFBa0MsU0FBQTtpQkFBRyxZQUFBLENBQWEsNEJBQWI7UUFBSCxDQXpCbEM7UUEwQkEsaUNBQUEsRUFBbUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxDQUFEO21CQUFPLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFyQjtVQUFQO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQTFCbkM7T0FERDtNQTZCQSwyQkFBTSxDQUFDLE9BQVAsQ0FBZSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRDtpQkFDYixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsS0FBQyxDQUFBLE9BQW5CLEVBQTRCLHdDQUFBLEdBQXdDLENBQUMsS0FBQSxHQUFRLENBQVQsQ0FBcEUsRUFBa0YsU0FBQTttQkFDaEYsS0FBQyxDQUFBLHVCQUFELENBQXlCLEtBQXpCO1VBRGdGLENBQWxGO1FBRGE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7TUFJQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBZixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDeEQsS0FBQyxDQUFBLGdCQUFELENBQUE7VUFDQSxJQUF1QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0JBQWhCLENBQXZCO21CQUFBLEtBQUMsQ0FBQSxnQkFBRCxDQUFBLEVBQUE7O1FBRndEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QyxDQUFqQjtNQUdBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFiLENBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0MsS0FBQyxDQUFBLFdBQUQsQ0FBQTtRQUQ2QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUIsQ0FBakI7TUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLCtCQUF4QixFQUF5RCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3hFLEtBQUMsQ0FBQSxXQUFELENBQUE7UUFEd0U7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpELENBQWpCO01BRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3Qiw0QkFBeEIsRUFBc0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNyRSxLQUFDLENBQUEsV0FBRCxDQUFBO1FBRHFFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0RCxDQUFqQjtNQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVosQ0FBd0IsbUJBQXhCLEVBQTZDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUM1RCxJQUFrQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCLENBQWxCO21CQUFBLEtBQUMsQ0FBQSxXQUFELENBQUEsRUFBQTs7UUFENEQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdDLENBQWpCO01BRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QiwyQkFBeEIsRUFBcUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDcEUsY0FBQTtVQURzRSxXQUFEO2lCQUNyRSxLQUFDLENBQUEsYUFBRCxDQUFlLFFBQWY7UUFEb0U7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJELENBQWpCO01BRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixrQ0FBeEIsRUFBNEQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUMzRSxLQUFDLENBQUEsV0FBRCxDQUFBO1FBRDJFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1RCxDQUFqQjthQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVosQ0FBd0IsZ0NBQXhCLEVBQTBELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDekUsS0FBQyxDQUFBLFdBQUQsQ0FBQTtRQUR5RTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUQsQ0FBakI7SUFqRVk7O3VCQW9FZCxNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFIO2VBQ0UsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxJQUFELENBQUEsRUFIRjs7SUFETTs7dUJBTVIsSUFBQSxHQUFNLFNBQUE7TUFDSixJQUFDLENBQUEsTUFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUZJOzt1QkFJTixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQVUsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWIsQ0FBQSxDQUFWLENBQVY7QUFBQSxlQUFBOztrQ0FFQSxJQUFDLENBQUEsUUFBRCxJQUFDLENBQUEsUUFDSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMkJBQWhCLENBQUgsR0FDRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7UUFBQSxJQUFBLEVBQU0sSUFBTjtPQUE3QixDQURGLEdBR0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFmLENBQTRCO1FBQUEsSUFBQSxFQUFNLElBQU47T0FBNUI7SUFQRTs7dUJBU1IsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEscUJBQUQsR0FBeUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQUE7TUFDekIsSUFBQyxDQUFBLG9CQUFELEdBQXdCLElBQUMsQ0FBQSxTQUFELENBQUE7TUFHeEIsWUFBYSxDQUFBLG1CQUFBLENBQWIsR0FBb0M7TUFDcEMsWUFBYSxDQUFBLG9CQUFBLENBQWIsR0FBcUM7TUFFckMsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUE7TUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTO2FBQ1QsSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQVZNOzt1QkFZUixLQUFBLEdBQU8sU0FBQTthQUNMLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO0lBREs7O3VCQUdQLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUEsQ0FBOEIsQ0FBQyxRQUEvQixDQUFBO0lBRE87O3VCQUdULFFBQUEsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxFQUFOLENBQVMsUUFBVCxDQUFBLElBQXNCLFFBQVEsQ0FBQyxhQUFULEtBQTBCLElBQUMsQ0FBQSxJQUFLLENBQUEsQ0FBQTtJQUQ5Qzs7dUJBR1YsV0FBQSxHQUFhLFNBQUE7TUFDWCxJQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBSDtlQUNFLElBQUMsQ0FBQSxPQUFELENBQUEsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBSEY7O0lBRFc7O3VCQU1iLFlBQUEsR0FBYyxTQUFDLENBQUQ7QUFDWixVQUFBO01BQUEsS0FBQSxHQUFRLENBQUMsQ0FBQztNQUNWLFdBQUEsR0FBYyxDQUFDLENBQUMsTUFBRixJQUFZO01BQzFCLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjtNQUNBLElBQUcsS0FBQSxZQUFpQixhQUFwQjtRQUNFLEtBQUssQ0FBQyxlQUFOLENBQXNCLFdBQXRCLEVBREY7T0FBQSxNQUVLLElBQUcsS0FBQSxZQUFpQixRQUFwQjtRQUNILElBQUMsQ0FBQSxvQkFBRCxDQUFzQixDQUF0QixFQURHOzthQUdMO0lBVFk7O3VCQVdkLG9CQUFBLEdBQXNCLFNBQUMsQ0FBRDtBQUNwQixVQUFBO01BQUEsUUFBQSxHQUFXLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBaEIsQ0FBQTtNQUNYLE1BQUEscUZBQW1DO01BQ25DLGtCQUFBLEdBQXFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw4QkFBaEI7TUFDckIsSUFBRyxNQUFBLEtBQVUsQ0FBYjtRQUNFLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDRCQUFoQixDQUFIO1VBQ0UsV0FBQSxHQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixRQUFwQixFQUE4QjtZQUFBLE9BQUEsRUFBUyxJQUFUO1lBQWUsWUFBQSxFQUFjLEtBQTdCO1lBQW9DLGNBQUEsRUFBZ0Isa0JBQXBEO1dBQTlCO1VBQ2QsSUFBQyxDQUFBLGdCQUFnQixDQUFDLEdBQWxCLENBQXNCLFFBQXRCLEVBQWdDLFdBQWhDO2lCQUNBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7cUJBQUcsS0FBQyxDQUFBLGdCQUFnQixFQUFDLE1BQUQsRUFBakIsQ0FBeUIsUUFBekI7WUFBSDtVQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFIRjtTQURGO09BQUEsTUFLSyxJQUFHLE1BQUEsS0FBVSxDQUFiO2VBQ0gsSUFBQyxDQUFBLGdCQUFELENBQWtCLFFBQWxCLEVBQTRCO1VBQUEsY0FBQSxFQUFnQixrQkFBaEI7U0FBNUIsRUFERzs7SUFUZTs7dUJBWXRCLGdCQUFBLEdBQWtCLFNBQUMsR0FBRCxFQUFNLE9BQU47QUFDaEIsVUFBQTtNQUFBLElBQUcsT0FBQSxHQUFVLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxHQUFsQixDQUFzQixHQUF0QixDQUFiO2VBQ0UsT0FBTyxDQUFDLElBQVIsQ0FBYSxTQUFBO2lCQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixHQUFwQixFQUF5QixPQUF6QjtRQUFILENBQWIsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsR0FBcEIsRUFBeUIsT0FBekIsRUFIRjs7SUFEZ0I7O3VCQU1sQixhQUFBLEdBQWUsU0FBQTtNQUNiLENBQUEsQ0FBRSxRQUFGLENBQVcsQ0FBQyxFQUFaLENBQWUsV0FBZixFQUE0QixJQUFDLENBQUEsY0FBN0I7YUFDQSxDQUFBLENBQUUsUUFBRixDQUFXLENBQUMsRUFBWixDQUFlLFNBQWYsRUFBMEIsSUFBQyxDQUFBLGFBQTNCO0lBRmE7O3VCQUlmLGFBQUEsR0FBZSxTQUFBO01BQ2IsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEdBQVosQ0FBZ0IsV0FBaEIsRUFBNkIsSUFBQyxDQUFBLGNBQTlCO2FBQ0EsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEdBQVosQ0FBZ0IsU0FBaEIsRUFBMkIsSUFBQyxDQUFBLGFBQTVCO0lBRmE7O3VCQUlmLGNBQUEsR0FBZ0IsU0FBQyxHQUFEO0FBQ2QsVUFBQTtNQURnQixtQkFBTztNQUN2QixJQUErQixLQUFBLEtBQVMsQ0FBeEM7QUFBQSxlQUFPLElBQUMsQ0FBQSxhQUFELENBQUEsRUFBUDs7TUFFQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwyQkFBaEIsQ0FBSDtRQUNFLEtBQUEsR0FBUSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsR0FBZ0IsSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUFTLENBQUMsSUFBMUIsR0FBaUMsTUFEM0M7T0FBQSxNQUFBO1FBR0UsS0FBQSxHQUFRLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBRCxDQUFBLENBQVMsQ0FBQyxLQUg1Qjs7YUFJQSxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVA7SUFQYzs7dUJBU2hCLGtCQUFBLEdBQW9CLFNBQUE7TUFDbEIsSUFBQyxDQUFBLEtBQUQsQ0FBTyxDQUFQO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sQ0FBQSxDQUFQO0lBRmtCOzt1QkFJcEIsbUJBQUEsR0FBcUIsU0FBQTtBQUNuQixVQUFBO01BQUEsSUFBQyxDQUFBLGVBQWUsQ0FBQyxNQUFqQixHQUEwQjtNQUMxQixJQUFBLENBQWMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDRCQUFoQixDQUFkO0FBQUEsZUFBQTs7O1FBRUEsWUFBYSxPQUFBLENBQVEsV0FBUixDQUFvQixDQUFDOztNQUVsQyxZQUFBLGtFQUFzRDtNQUN0RCxJQUFpQyxPQUFPLFlBQVAsS0FBdUIsUUFBeEQ7UUFBQSxZQUFBLEdBQWUsQ0FBQyxZQUFELEVBQWY7O0FBQ0E7V0FBQSw4Q0FBQTs7WUFBcUM7QUFDbkM7eUJBQ0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUEwQixJQUFBLFNBQUEsQ0FBVSxXQUFWLEVBQXVCO2NBQUEsU0FBQSxFQUFXLElBQVg7Y0FBaUIsR0FBQSxFQUFLLElBQXRCO2FBQXZCLENBQTFCLEdBREY7V0FBQSxjQUFBO1lBRU07eUJBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4QixnQ0FBQSxHQUFpQyxXQUFqQyxHQUE2QyxHQUEzRSxFQUErRTtjQUFBLE1BQUEsRUFBUSxLQUFLLENBQUMsT0FBZDthQUEvRSxHQUhGOzs7QUFERjs7SUFSbUI7O3VCQWNyQixXQUFBLEdBQWEsU0FBQyxlQUFEO0FBQ1gsVUFBQTs7UUFEWSxrQkFBZ0I7O01BQzVCLGtCQUFBLEdBQXFCO0FBQ3JCO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxrQkFBbUIsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBbkIsR0FBMEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBZixDQUFBO1FBQzFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBZixDQUFBO1FBQ0EsSUFBSSxDQUFDLE1BQUwsQ0FBQTtBQUhGO01BS0EsSUFBQyxDQUFBLG1CQUFELENBQUE7TUFFQSxJQUFDLENBQUEsS0FBRDs7QUFBUztBQUFBO2FBQUEsd0NBQUE7O1VBQ1AsSUFBQSxDQUFnQixDQUFBLEtBQUEsR0FBUSxFQUFFLENBQUMsb0JBQUgsQ0FBd0IsV0FBeEIsQ0FBUixDQUFoQjtBQUFBLHFCQUFBOztVQUNBLEtBQUEsR0FBUSxDQUFDLENBQUMsSUFBRixVQUFPLENBQUEsS0FBTyxTQUFBLFdBQUEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQLENBQUEsQ0FBQSxDQUFkO0FBQ1I7QUFBQSxlQUFBLHdDQUFBOztZQUNFLEtBQU0sQ0FBQSxHQUFBLENBQU4sR0FBYSxLQUFNLENBQUEsR0FBQSxDQUFJLENBQUMsT0FBWCxDQUFBO0FBRGY7VUFHQSxTQUFBLEdBQWdCLElBQUEsU0FBQSxDQUFVO1lBQ3hCLElBQUEsRUFBTSxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQsQ0FEa0I7WUFFeEIsUUFBQSxFQUFVLFdBRmM7WUFHeEIsT0FBQSxFQUFTLEtBSGU7WUFJeEIsTUFBQSxFQUFRLElBSmdCO1lBS3hCLGNBQUEsbUhBRWdCO2NBQUMsVUFBQSxFQUFZLElBQWI7YUFQUTtZQVF2QixpQkFBRCxJQUFDLENBQUEsZUFSdUI7WUFTdkIsV0FBRCxJQUFDLENBQUEsU0FUdUI7WUFVeEIsT0FBQSxLQVZ3QjtXQUFWO1VBWWhCLElBQUEsR0FBVyxJQUFBLGFBQUEsQ0FBQTtVQUNYLElBQUksQ0FBQyxVQUFMLENBQWdCLFNBQWhCO1VBQ0EsSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxXQUFULENBQXFCLElBQXJCO3VCQUNBO0FBckJPOzs7TUF1QlQsSUFBRyxJQUFDLENBQUEseUJBQUo7UUFDRSxJQUFDLENBQUEsTUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLHlCQUFELEdBQTZCLE1BRi9COztJQWhDVzs7dUJBb0NiLGFBQUEsR0FBZSxTQUFBO0FBQUcsVUFBQTs0R0FBa0MsQ0FBRTtJQUF2Qzs7dUJBRWYsZ0JBQUEsR0FBa0IsU0FBQTtBQUNoQixVQUFBO01BQUEsSUFBRyxjQUFBLEdBQWlCLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBcEI7ZUFDRSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsY0FBcEIsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBSEY7O0lBRGdCOzt1QkFNbEIsZ0JBQUEsR0FBa0IsU0FBQTtBQUNoQixVQUFBO01BQUEsSUFBVSxDQUFDLENBQUMsT0FBRixDQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBYixDQUFBLENBQVYsQ0FBVjtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLE1BQUQsQ0FBQTtNQUNBLElBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHlCQUFoQixDQUFaO1FBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQUFBOztNQUVBLElBQUEsQ0FBYyxDQUFBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFqQixDQUFkO0FBQUEsZUFBQTs7TUFFQSxPQUEyQixJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsY0FBNUIsQ0FBM0IsRUFBQyxrQkFBRCxFQUFXO01BQ1gsSUFBYyxnQkFBZDtBQUFBLGVBQUE7O01BRUEsb0JBQUEsR0FBdUIsWUFBWSxDQUFDLEtBQWIsQ0FBbUIsSUFBSSxDQUFDLEdBQXhCO01BQ3ZCLFdBQUEsR0FBYztBQUNkO1dBQUEsc0RBQUE7O1FBQ0UsV0FBQSxJQUFlLElBQUksQ0FBQyxHQUFMLEdBQVc7UUFDMUIsS0FBQSxHQUFRLElBQUMsQ0FBQSxZQUFELENBQWMsV0FBZDtRQUNSLElBQUcsS0FBQSxZQUFpQixhQUFwQjt1QkFDRSxLQUFLLENBQUMsTUFBTixDQUFBLEdBREY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiO3VCQUNBLElBQUMsQ0FBQSxhQUFELENBQWUsS0FBZixHQUpGOztBQUhGOztJQWJnQjs7dUJBc0JsQixxQkFBQSxHQUF1QixTQUFDLFlBQUQ7QUFDckIsVUFBQTs7UUFEc0IsZUFBZTs7TUFDckMsSUFBRyxVQUFBLEdBQWEsSUFBQyxDQUFBLFlBQWpCO1FBQ0UsSUFBb0QsWUFBcEQ7VUFBQSxVQUFBLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFiLENBQXdCLFVBQXhCLEVBQWI7O2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFmLENBQXFCLFVBQXJCLEVBRkY7O0lBRHFCOzt1QkFLdkIsWUFBQSxHQUFjLFNBQUMsU0FBRDtBQUNaLFVBQUE7TUFBQSxjQUFBLEdBQWlCO01BQ2pCLGVBQUEsR0FBa0I7QUFFbEI7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUcsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsU0FBbEIsQ0FBSDtBQUNFLGlCQUFPLE1BRFQ7O1FBR0EsV0FBQSxHQUFjLEtBQUssQ0FBQyxPQUFOLENBQUEsQ0FBZSxDQUFDO1FBQzlCLDRDQUFrQixDQUFFLFFBQWpCLENBQTBCLFNBQTFCLFdBQUEsSUFBeUMsV0FBQSxHQUFjLGVBQTFEO1VBQ0UsY0FBQSxHQUFpQjtVQUNqQixlQUFBLEdBQWtCLFlBRnBCOztBQUxGO2FBU0E7SUFiWTs7dUJBZWQsa0JBQUEsR0FBb0IsU0FBQyxTQUFEO2FBQ2xCLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLENBQWI7SUFEa0I7O3VCQUdwQixRQUFBLEdBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTs7UUFBQSxLQUFLLENBQUUsd0JBQVAsQ0FBQTs7TUFDQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxhQUFELENBQUE7TUFDaEIsSUFBRyxxQkFBSDtRQUNFLElBQUcsYUFBQSxZQUF5QixhQUE1QjtVQUNFLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxhQUFhLENBQUMsT0FBTyxDQUFDLFFBQVMsQ0FBQSxDQUFBLENBQTVDLENBQUg7WUFDRSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBZjtBQUNBLG1CQUZGO1dBREY7O1FBS0EsYUFBQSxHQUFnQixDQUFBLENBQUUsYUFBRjtBQUNoQixlQUFBLENBQU0sSUFBQyxDQUFBLFdBQUQsQ0FBYSxhQUFhLENBQUMsSUFBZCxDQUFtQixRQUFuQixDQUE2QixDQUFBLENBQUEsQ0FBMUMsQ0FBTjtVQUNFLGFBQUEsR0FBZ0IsYUFBYSxDQUFDLE9BQWQsQ0FBc0IsY0FBdEI7VUFDaEIsSUFBQSxDQUFhLGFBQWEsQ0FBQyxNQUEzQjtBQUFBLGtCQUFBOztRQUZGLENBUEY7T0FBQSxNQUFBO1FBV0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsS0FBTSxDQUFBLENBQUEsQ0FBcEIsRUFYRjs7YUFhQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBZjtJQWhCUTs7dUJBa0JWLE1BQUEsR0FBUSxTQUFDLEtBQUQ7QUFDTixVQUFBO01BQUEsS0FBSyxDQUFDLHdCQUFOLENBQUE7TUFDQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxhQUFELENBQUE7TUFDaEIsSUFBRyxxQkFBSDtRQUNFLGFBQUEsR0FBZ0IsQ0FBQSxDQUFFLGFBQUY7UUFDaEIsSUFBRyxhQUFBLEdBQWdCLElBQUMsQ0FBQSxXQUFELENBQWEsYUFBYSxDQUFDLElBQWQsQ0FBbUIsUUFBbkIsQ0FBNkIsQ0FBQSxDQUFBLENBQTFDLENBQW5CO1VBQ0UsSUFBRyxhQUFBLFlBQXlCLGFBQTVCO1lBQ0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFDLENBQUMsSUFBRixDQUFPLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBN0IsQ0FBYixFQURGO1dBREY7U0FBQSxNQUFBO1VBSUUsSUFBQyxDQUFBLFdBQUQsb0VBQTBELENBQUEsQ0FBQSxVQUExRCxFQUpGO1NBRkY7T0FBQSxNQUFBO1FBUUUsSUFBQyxDQUFBLFdBQUQsd0RBQTBDLENBQUEsQ0FBQSxVQUExQyxFQVJGOzthQVVBLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFmO0lBYk07O3VCQWVSLGVBQUEsR0FBaUIsU0FBQyxXQUFEO0FBQ2YsVUFBQTs7UUFEZ0IsY0FBWTs7TUFDNUIsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBO01BQ2hCLElBQUcsV0FBQSxLQUFlLEtBQWYsSUFBeUIsYUFBYSxDQUFDLFVBQTFDO1FBQ0UsSUFBZSxhQUFhLENBQUMsU0FBUyxDQUFDLFVBQXhCLENBQUEsQ0FBb0MsQ0FBQyxNQUFyQyxHQUE4QyxDQUE3RDtpQkFBQSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBQUE7U0FERjtPQUFBLE1BQUE7ZUFHRSxhQUFhLENBQUMsTUFBZCxDQUFxQixXQUFyQixFQUhGOztJQUZlOzt1QkFPakIsaUJBQUEsR0FBbUIsU0FBQyxXQUFEO0FBQ2pCLFVBQUE7O1FBRGtCLGNBQVk7O01BQzlCLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGFBQUQsQ0FBQTtNQUNoQixJQUFjLHFCQUFkO0FBQUEsZUFBQTs7TUFFQSxJQUFHLFNBQUEsR0FBWSxDQUFBLENBQUUsYUFBRixDQUFnQixDQUFDLE9BQWpCLENBQXlCLHFCQUF6QixDQUFnRCxDQUFBLENBQUEsQ0FBL0Q7UUFDRSxTQUFTLENBQUMsUUFBVixDQUFtQixXQUFuQjtlQUNBLElBQUMsQ0FBQSxXQUFELENBQWEsU0FBYixFQUZGOztJQUppQjs7dUJBUW5CLGlCQUFBLEdBQW1CLFNBQUMsT0FBRCxFQUFhLGVBQWI7QUFDakIsVUFBQTs7UUFEa0IsVUFBUTs7O1FBQUksa0JBQWdCOztNQUM5QyxhQUFBLEdBQWdCLElBQUMsQ0FBQSxhQUFELENBQUE7TUFDaEIsSUFBRyxhQUFBLFlBQXlCLGFBQTVCO1FBQ0UsSUFBRyxlQUFIO2lCQUNFLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBREY7U0FBQSxNQUFBO2lCQUdFLGFBQWEsQ0FBQyxlQUFkLENBQUEsRUFIRjtTQURGO09BQUEsTUFLSyxJQUFHLGFBQUEsWUFBeUIsUUFBNUI7UUFDSCxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw4QkFBaEIsQ0FBSDtVQUNFLE9BQUEsR0FBVSxNQUFNLENBQUMsTUFBUCxDQUFjO1lBQUEsY0FBQSxFQUFnQixJQUFoQjtXQUFkLEVBQW9DLE9BQXBDLEVBRFo7O2VBRUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLGFBQWEsQ0FBQyxPQUFkLENBQUEsQ0FBbEIsRUFBMkMsT0FBM0MsRUFIRzs7SUFQWTs7dUJBWW5CLHNCQUFBLEdBQXdCLFNBQUMsV0FBRCxFQUFjLElBQWQ7QUFDdEIsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGFBQUQsQ0FBQTtNQUNoQixJQUFBLEdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUE7TUFDUCxJQUFHLElBQUEsSUFBUyxhQUFBLFlBQXlCLFFBQXJDO1FBQ0UsSUFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFmLENBQUEsQ0FBSDtVQUNFLEtBQUEsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLFdBQVgsRUFBd0IsSUFBeEI7aUJBQ1IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCLGFBQWEsQ0FBQyxPQUFkLENBQUEsQ0FBN0IsRUFBc0QsS0FBdEQsRUFGRjtTQUFBLE1BQUE7aUJBSUUsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLEVBSkY7U0FERjs7SUFIc0I7O3VCQVV4QixzQkFBQSxHQUF3QixTQUFBO2FBQ3RCLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixZQUF4QixFQUFzQyxPQUF0QztJQURzQjs7dUJBR3hCLHFCQUFBLEdBQXVCLFNBQUE7YUFDckIsSUFBQyxDQUFBLHNCQUFELENBQXdCLFlBQXhCLEVBQXNDLFFBQXRDO0lBRHFCOzt1QkFHdkIsbUJBQUEsR0FBcUIsU0FBQTthQUNuQixJQUFDLENBQUEsc0JBQUQsQ0FBd0IsVUFBeEIsRUFBb0MsUUFBcEM7SUFEbUI7O3VCQUdyQixxQkFBQSxHQUF1QixTQUFBO2FBQ3JCLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixVQUF4QixFQUFvQyxPQUFwQztJQURxQjs7dUJBR3ZCLHVCQUFBLEdBQXlCLFNBQUMsS0FBRDtBQUN2QixVQUFBO01BQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBO01BQ2hCLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBQSxDQUEwQixDQUFBLEtBQUE7TUFDakMsSUFBRyxJQUFBLElBQVMsYUFBQSxZQUF5QixRQUFyQztlQUNFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUE2QixhQUFhLENBQUMsT0FBZCxDQUFBLENBQTdCLEVBQXNELElBQXRELEVBREY7O0lBSHVCOzt1QkFNekIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUg7UUFDRSxLQUFBLEdBQVEsSUFBQyxDQUFBLGFBQUQsQ0FBQTtRQUNSLElBQWMsZUFBSixJQUFjLGFBQVMsSUFBQyxDQUFBLEtBQVYsRUFBQSxLQUFBLE1BQXhCO0FBQUEsaUJBQUE7O1FBQ0EsT0FBQSxHQUFVLEtBQUssQ0FBQyxPQUFOLENBQUEsRUFIWjtPQUFBLE1BQUE7UUFLRSxPQUFBLEdBQVUsSUFBQyxDQUFBLGFBQUQsQ0FBQSxFQUxaOztNQU9BLElBQUcsT0FBSDs7VUFDRSxhQUFjLE9BQUEsQ0FBUSxlQUFSOztRQUNkLE1BQUEsR0FBYSxJQUFBLFVBQUEsQ0FBVyxPQUFYO2VBQ2IsTUFBTSxDQUFDLE1BQVAsQ0FBQSxFQUhGOztJQVJpQjs7dUJBb0JuQix5QkFBQSxHQUEyQixTQUFDLFVBQUQsRUFBYSxNQUFiO0FBQ3pCLFVBQUE7QUFBQSxjQUFPLE9BQU8sQ0FBQyxRQUFmO0FBQUEsYUFDTyxRQURQO2lCQUVJO1lBQUEsT0FBQSxFQUFTLE1BQVQ7WUFDQSxLQUFBLEVBQU8sUUFEUDtZQUVBLElBQUEsRUFBTSxDQUFDLElBQUQsRUFBTyxVQUFQLENBRk47O0FBRkosYUFLTyxPQUxQO1VBTUksSUFBQSxHQUFPLENBQUMsWUFBQSxHQUFhLFVBQWIsR0FBd0IsSUFBekI7VUFFUCxJQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBZjtZQUNFLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBdEIsRUFBa0MsY0FBbEMsRUFEWjtXQUFBLE1BQUE7WUFHRSxPQUFBLEdBQVUsZUFIWjs7aUJBS0E7WUFBQSxPQUFBLEVBQVMsT0FBVDtZQUNBLEtBQUEsRUFBTyxVQURQO1lBRUEsSUFBQSxFQUFNLElBRk47O0FBYko7VUFvQkksSUFBMEMsTUFBMUM7WUFBQSxVQUFBLEdBQWMsSUFBSSxDQUFDLE9BQUwsQ0FBYSxVQUFiLEVBQWQ7O2lCQUVBO1lBQUEsT0FBQSxFQUFTLFVBQVQ7WUFDQSxLQUFBLEVBQU8sY0FEUDtZQUVBLElBQUEsRUFBTSxDQUFDLFVBQUQsQ0FGTjs7QUF0Qko7SUFEeUI7O3VCQTJCM0IsaUJBQUEsR0FBbUIsU0FBQyxPQUFELEVBQVUsSUFBVixFQUFnQixLQUFoQixFQUF1QixNQUF2QjtBQUNqQixVQUFBO01BQUEsV0FBQSxHQUFjLFNBQUMsWUFBRDtlQUNaLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsVUFBQSxHQUFVLENBQUksTUFBSCxHQUFlLE1BQWYsR0FBMkIsUUFBNUIsQ0FBVixHQUErQyxNQUEvQyxHQUFxRCxLQUFyRCxHQUEyRCxTQUF2RixFQUNFO1VBQUEsTUFBQSxFQUFRLFlBQVI7VUFDQSxXQUFBLEVBQWEsSUFEYjtTQURGO01BRFk7TUFLZCxVQUFBLEdBQWE7TUFDYixNQUFBLEdBQVMsU0FBQyxLQUFEO2VBQVcsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsS0FBaEI7TUFBWDtNQUNULElBQUEsR0FBTyxTQUFDLElBQUQ7QUFDTCxZQUFBO1FBQUEsTUFBQSxHQUFTLElBQUEsS0FBVTtRQUNuQixZQUFBLEdBQWUsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsSUFBaEI7UUFHZixJQUFHLE9BQU8sQ0FBQyxRQUFSLEtBQW9CLE9BQXBCLElBQWdDLElBQUEsS0FBUSxDQUF4QyxJQUE4QyxDQUFJLFlBQXJEO1VBQ0UsTUFBQSxHQUFTLE1BRFg7O1FBR0EsSUFBNkIsTUFBN0I7aUJBQUEsV0FBQSxDQUFZLFlBQVosRUFBQTs7TUFSSztNQVVQLFdBQUEsR0FBa0IsSUFBQSxlQUFBLENBQWdCO1FBQUMsU0FBQSxPQUFEO1FBQVUsTUFBQSxJQUFWO1FBQWdCLFFBQUEsTUFBaEI7UUFBd0IsTUFBQSxJQUF4QjtPQUFoQjtNQUNsQixXQUFXLENBQUMsZ0JBQVosQ0FBNkIsU0FBQyxHQUFEO0FBQzNCLFlBQUE7UUFENkIsbUJBQU87UUFDcEMsTUFBQSxDQUFBO2VBQ0EsV0FBQSxpQkFBWSxLQUFLLENBQUUsZ0JBQW5CO01BRjJCLENBQTdCO2FBR0E7SUF0QmlCOzt1QkF3Qm5CLDhCQUFBLEdBQWdDLFNBQUE7QUFDOUIsVUFBQTtNQUFBLElBQUEsQ0FBYyxDQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQVIsQ0FBZDtBQUFBLGVBQUE7O01BRUEsTUFBQSxHQUFTLEtBQUEsWUFBaUI7TUFDMUIsT0FBeUIsSUFBQyxDQUFBLHlCQUFELENBQTJCLEtBQUssQ0FBQyxPQUFOLENBQUEsQ0FBM0IsRUFBNEMsTUFBNUMsQ0FBekIsRUFBQyxzQkFBRCxFQUFVLGdCQUFWLEVBQWdCO2FBQ2hCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixPQUFuQixFQUE0QixJQUE1QixFQUFrQyxLQUFsQyxFQUF5QyxNQUF6QztJQUw4Qjs7dUJBT2hDLDRCQUFBLEdBQThCLFNBQUE7QUFDNUIsVUFBQTtNQUFBLElBQUEsQ0FBYyxDQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBVCxDQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFBLENBQWMsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUFkO0FBQUEsZUFBQTs7TUFDQSxPQUF5QixJQUFDLENBQUEseUJBQUQsQ0FBMkIsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUEzQixFQUE2QyxJQUE3QyxDQUF6QixFQUFDLHNCQUFELEVBQVUsZ0JBQVYsRUFBZ0I7YUFDaEIsSUFBQyxDQUFBLGlCQUFELENBQW1CLE9BQW5CLEVBQTRCLElBQTVCLEVBQWtDLEtBQWxDLEVBQXlDLElBQXpDO0lBSjRCOzt1QkFNOUIsNEJBQUEsR0FBOEIsU0FBQTtBQUM1QixVQUFBO01BQUEsSUFBRyxVQUFBLCtDQUE2QixDQUFFLE9BQWxCLENBQUEsVUFBaEI7ZUFDRSxJQUFJLENBQUMsSUFBTCxDQUFVO1VBQUMsV0FBQSxFQUFhLENBQUMsVUFBRCxDQUFkO1VBQTRCLFNBQUEsRUFBVyxJQUF2QztTQUFWLEVBREY7O0lBRDRCOzt1QkFJOUIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUg7UUFDRSxLQUFBLEdBQVEsSUFBQyxDQUFBLGFBQUQsQ0FBQTtRQUNSLElBQVUsYUFBUyxJQUFDLENBQUEsS0FBVixFQUFBLEtBQUEsTUFBVjtBQUFBLGlCQUFBOztRQUNBLE9BQUEsbUJBQVUsS0FBSyxDQUFFLE9BQVAsQ0FBQSxXQUhaO09BQUEsTUFBQTtRQUtFLE9BQUEsR0FBVSxJQUFDLENBQUEsYUFBRCxDQUFBLEVBTFo7O01BTUEsSUFBQSxDQUFjLE9BQWQ7QUFBQSxlQUFBOzs7UUFFQSxhQUFjLE9BQUEsQ0FBUSxlQUFSOztNQUNkLE1BQUEsR0FBYSxJQUFBLFVBQUEsQ0FBVyxPQUFYO2FBQ2IsTUFBTSxDQUFDLE1BQVAsQ0FBQTtJQVhpQjs7dUJBYW5CLHFCQUFBLEdBQXVCLFNBQUE7QUFDckIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFIO1FBQ0UsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBLEVBRGxCO09BQUEsTUFFSyxJQUFHLFVBQUEsR0FBYSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQWhCO1FBQ0gsYUFBQSxHQUFnQixDQUFDLFVBQUQsRUFEYjs7TUFHTCxJQUFBLENBQUEsQ0FBYyxhQUFBLElBQWtCLGFBQWEsQ0FBQyxNQUFkLEdBQXVCLENBQXZELENBQUE7QUFBQSxlQUFBOztBQUVBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxXQUFHLElBQUksQ0FBQyxPQUFMLENBQUEsQ0FBQSxFQUFBLGFBQWtCLGFBQWxCLEVBQUEsSUFBQSxNQUFIO1VBQ0UsSUFBSSxDQUFDLE9BQUwsQ0FDRTtZQUFBLE9BQUEsRUFBUyxzQkFBQSxHQUF1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQXRDLEdBQTJDLHFCQUFwRDtZQUNBLE9BQUEsRUFBUyxDQUFDLElBQUQsQ0FEVDtXQURGO0FBR0EsaUJBSkY7O0FBREY7YUFPQSxJQUFJLENBQUMsT0FBTCxDQUNFO1FBQUEsT0FBQSxFQUFTLCtDQUFBLEdBQStDLENBQUksYUFBYSxDQUFDLE1BQWQsR0FBdUIsQ0FBMUIsR0FBaUMsT0FBakMsR0FBOEMsTUFBL0MsQ0FBL0MsR0FBcUcsR0FBOUc7UUFDQSxlQUFBLEVBQWlCLHFCQUFBLEdBQXFCLENBQUMsYUFBYSxDQUFDLElBQWQsQ0FBbUIsSUFBbkIsQ0FBRCxDQUR0QztRQUVBLE9BQUEsRUFDRTtVQUFBLGVBQUEsRUFBaUIsU0FBQTtBQUNmLGdCQUFBO1lBQUEsZUFBQSxHQUFrQjtBQUNsQixpQkFBQSxpREFBQTs7Y0FDRSxJQUFHLENBQUksS0FBSyxDQUFDLGVBQU4sQ0FBc0IsWUFBdEIsQ0FBUDtnQkFDRSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsRUFBQSxHQUFHLFlBQXhCLEVBREY7O2NBRUEsSUFBRyxJQUFBLEdBQU8sV0FBQSxDQUFZLFlBQVosQ0FBVjtnQkFDRSxJQUFJLENBQUMsYUFBTCxDQUFtQixZQUFuQixFQURGOztBQUhGO1lBS0EsSUFBRyxlQUFlLENBQUMsTUFBaEIsR0FBeUIsQ0FBNUI7cUJBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixnQkFBQSxHQUFnQixDQUFJLGVBQWUsQ0FBQyxNQUFoQixHQUF5QixDQUE1QixHQUFtQyxPQUFuQyxHQUFnRCxNQUFqRCxDQUFoQixHQUF3RSw2QkFBeEUsR0FBb0csQ0FBSSxPQUFPLENBQUMsUUFBUixLQUFvQixPQUF2QixHQUFvQywrQkFBcEMsR0FBeUUsRUFBMUUsQ0FBaEksRUFDRTtnQkFBQSxNQUFBLEVBQVEsRUFBQSxHQUFFLENBQUMsZUFBZSxDQUFDLElBQWhCLENBQXFCLElBQXJCLENBQUQsQ0FBVjtnQkFDQSxXQUFBLEVBQWEsSUFEYjtlQURGLEVBREY7O1VBUGUsQ0FBakI7VUFXQSxRQUFBLEVBQVUsSUFYVjtTQUhGO09BREY7SUFmcUI7O3VCQXNDdkIsbUJBQUEsR0FBcUIsU0FBQTtBQUNuQixVQUFBO01BQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBO01BQ2hCLElBQUEsQ0FBQSxDQUFjLGFBQUEsSUFBa0IsYUFBYSxDQUFDLE1BQWQsR0FBdUIsQ0FBdkQsQ0FBQTtBQUFBLGVBQUE7O01BRUEsWUFBWSxDQUFDLFVBQWIsQ0FBd0IsbUJBQXhCO2FBQ0EsWUFBYSxDQUFBLG9CQUFBLENBQWIsR0FBcUMsSUFBSSxDQUFDLFNBQUwsQ0FBZSxhQUFmO0lBTGxCOzt1QkFhckIsa0JBQUEsR0FBb0IsU0FBQTtBQUNsQixVQUFBO01BQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBO01BQ2hCLElBQUEsQ0FBQSxDQUFjLGFBQUEsSUFBa0IsYUFBYSxDQUFDLE1BQWQsR0FBdUIsQ0FBdkQsQ0FBQTtBQUFBLGVBQUE7O01BRUEsWUFBWSxDQUFDLFVBQWIsQ0FBd0Isb0JBQXhCO2FBQ0EsWUFBYSxDQUFBLG1CQUFBLENBQWIsR0FBb0MsSUFBSSxDQUFDLFNBQUwsQ0FBZSxhQUFmO0lBTGxCOzt1QkFhcEIsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsYUFBQSxHQUFnQixJQUFDLENBQUEsYUFBRCxDQUFBO01BQ2hCLFFBQUEsR0FBYyxZQUFhLENBQUEsbUJBQUEsQ0FBaEIsR0FBMEMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFhLENBQUEsbUJBQUEsQ0FBeEIsQ0FBMUMsR0FBNkY7TUFDeEcsV0FBQSxHQUFpQixZQUFhLENBQUEsb0JBQUEsQ0FBaEIsR0FBMkMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFhLENBQUEsb0JBQUEsQ0FBeEIsQ0FBM0MsR0FBK0Y7TUFDN0csWUFBQSxHQUFlLFdBQUEsSUFBZTtNQUU5QixzQkFBQSxHQUF5QixTQUFDLFNBQUQ7QUFDdkIsWUFBQTtBQUFBO2lCQUNFLFNBQUEsQ0FBQSxFQURGO1NBQUEsY0FBQTtVQUVNO2lCQUNKLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBbkIsQ0FBOEIseUJBQUEsR0FBMEIsWUFBeEQsRUFBd0U7WUFBQSxNQUFBLEVBQVEsS0FBSyxDQUFDLE9BQWQ7V0FBeEUsRUFIRjs7TUFEdUI7QUFNekI7QUFBQTtXQUFBLHNDQUFBOztRQUNFLHNCQUFBLEdBQXlCLEVBQUUsQ0FBQyxlQUFILENBQW1CLFdBQW5CO1FBQ3pCLElBQUcsYUFBQSxJQUFrQixXQUFsQixJQUFrQyxFQUFFLENBQUMsVUFBSCxDQUFjLFdBQWQsQ0FBckM7VUFDRSxRQUFBLEdBQVcsYUFBYSxDQUFDLE9BQWQsQ0FBQTtVQUNYLElBQXFDLGFBQUEsWUFBeUIsUUFBOUQ7WUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLEVBQVg7O1VBQ0EsT0FBQSxHQUFVLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQsQ0FBcEI7VUFFVixJQUFHLFdBQUg7WUFFRSxXQUFBLEdBQWM7WUFDZCxlQUFBLEdBQWtCO0FBQ2xCLG1CQUFNLEVBQUUsQ0FBQyxVQUFILENBQWMsT0FBZCxDQUFOO2NBQ0UsSUFBRyxzQkFBSDtnQkFDRSxPQUFBLEdBQVUsRUFBQSxHQUFHLGVBQUgsR0FBcUIsWUFEakM7ZUFBQSxNQUFBO2dCQUdFLFNBQUEsR0FBWSxnQkFBQSxDQUFpQixlQUFqQjtnQkFDWixRQUFBLEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFJLENBQUMsT0FBTCxDQUFhLGVBQWIsQ0FBVixFQUF5QyxJQUFJLENBQUMsUUFBTCxDQUFjLGVBQWQsRUFBK0IsU0FBL0IsQ0FBekM7Z0JBQ1gsT0FBQSxHQUFVLEVBQUEsR0FBRyxRQUFILEdBQWMsV0FBZCxHQUE0QixVQUx4Qzs7Y0FNQSxXQUFBLElBQWU7WUFQakI7WUFTQSxJQUFHLEVBQUUsQ0FBQyxlQUFILENBQW1CLFdBQW5CLENBQUg7MkJBRUUsc0JBQUEsQ0FBdUIsU0FBQTt1QkFBRyxFQUFFLENBQUMsUUFBSCxDQUFZLFdBQVosRUFBeUIsT0FBekI7Y0FBSCxDQUF2QixHQUZGO2FBQUEsTUFBQTsyQkFLRSxzQkFBQSxDQUF1QixTQUFBO3VCQUFHLEVBQUUsQ0FBQyxhQUFILENBQWlCLE9BQWpCLEVBQTBCLEVBQUUsQ0FBQyxZQUFILENBQWdCLFdBQWhCLENBQTFCO2NBQUgsQ0FBdkIsR0FMRjthQWJGO1dBQUEsTUFtQkssSUFBRyxRQUFIO1lBR0gsSUFBQSxDQUFBLENBQU8sRUFBRSxDQUFDLFVBQUgsQ0FBYyxPQUFkLENBQUEsSUFBMEIsT0FBTyxDQUFDLFVBQVIsQ0FBbUIsV0FBbkIsQ0FBakMsQ0FBQTsyQkFDRSxzQkFBQSxDQUF1QixTQUFBO3VCQUFHLEVBQUUsQ0FBQyxRQUFILENBQVksV0FBWixFQUF5QixPQUF6QjtjQUFILENBQXZCLEdBREY7YUFBQSxNQUFBO21DQUFBO2FBSEc7V0FBQSxNQUFBO2lDQUFBO1dBeEJQO1NBQUEsTUFBQTsrQkFBQTs7QUFGRjs7SUFaWTs7dUJBNENkLEdBQUEsR0FBSyxTQUFDLGNBQUQ7QUFDSCxVQUFBO01BQUEsYUFBQSxrREFBbUMsSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBO01BQzFDLFlBQUEsc0ZBQTBDOztRQUUxQyxZQUFhLE9BQUEsQ0FBUSxjQUFSOztNQUNiLE1BQUEsR0FBYSxJQUFBLFNBQUEsQ0FBVSxZQUFWLEVBQXdCLGNBQXhCO01BQ2IsTUFBTSxDQUFDLEVBQVAsQ0FBVSxtQkFBVixFQUErQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRCxFQUFRLFdBQVI7QUFDN0IsY0FBQTs7Z0JBQTBCLENBQUUsTUFBNUIsQ0FBQTs7VUFDQSxLQUFDLENBQUEsa0JBQUQsQ0FBb0IsV0FBcEI7aUJBQ0E7UUFINkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9CO01BSUEsTUFBTSxDQUFDLEVBQVAsQ0FBVSxjQUFWLEVBQTBCLFNBQUMsS0FBRCxFQUFRLFdBQVI7UUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLFdBQXBCO2VBQ0E7TUFGd0IsQ0FBMUI7YUFHQSxNQUFNLENBQUMsTUFBUCxDQUFBO0lBYkc7O3VCQWVMLG1CQUFBLEdBQXFCLFNBQUMsQ0FBRDtBQUNuQixVQUFBO01BQUEsWUFBQSxHQUFlLENBQUEsQ0FBRSxDQUFDLENBQUMsTUFBSixDQUFXLENBQUMsT0FBWixDQUFvQix5QkFBcEIsQ0FBOEMsQ0FBQyxJQUEvQyxDQUFvRCxPQUFwRCxDQUE0RCxDQUFDLElBQTdELENBQWtFLE1BQWxFO01BSWYsSUFBRywrQkFBSDtRQUNFLElBQXlDLG9CQUF6QztpQkFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQWIsQ0FBd0IsWUFBeEIsRUFBQTtTQURGOztJQUxtQjs7dUJBUXJCLGFBQUEsR0FBZSxTQUFBO2FBQ2IsSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxhQUFULENBQXVCLFdBQXZCO0lBRGE7O3VCQUdmLFdBQUEsR0FBYSxTQUFDLEtBQUQ7QUFDWCxVQUFBO01BQUEsSUFBYyxhQUFkO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQixLQUFLLENBQUMsT0FBTixDQUFBO01BRWhCLGVBQUEsR0FBa0IsSUFBQyxDQUFBLGtCQUFELENBQUE7TUFDbEIsSUFBRyxlQUFlLENBQUMsTUFBaEIsR0FBeUIsQ0FBekIsSUFBOEIsZUFBZ0IsQ0FBQSxDQUFBLENBQWhCLEtBQXdCLEtBQXpEO1FBQ0UsSUFBQyxDQUFBLFFBQUQsQ0FBVSxlQUFWO1FBQ0EsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFoQixDQUFvQixVQUFwQixFQUZGOzthQUdBO0lBVFc7O3VCQVdiLGtCQUFBLEdBQW9CLFNBQUE7YUFDbEIsSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxnQkFBVCxDQUEwQixXQUExQjtJQURrQjs7dUJBR3BCLFFBQUEsR0FBVSxTQUFDLGtCQUFEO0FBQ1IsVUFBQTs7UUFEUyxxQkFBbUIsSUFBQyxDQUFBLGtCQUFELENBQUE7O0FBQzVCLFdBQUEsb0RBQUE7O1FBQUEsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFuQixDQUEwQixVQUExQjtBQUFBO2FBQ0E7SUFGUTs7dUJBSVYsU0FBQSxHQUFXLFNBQUMsR0FBRDtNQUNULElBQUcsV0FBSDtlQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFvQixHQUFwQixFQURGO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFBLEVBSEY7O0lBRFM7O3VCQU1YLFlBQUEsR0FBYyxTQUFDLE1BQUQ7TUFDWixJQUFHLGNBQUg7ZUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsTUFBdkIsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBQSxFQUhGOztJQURZOzt1QkFNZCxhQUFBLEdBQWUsU0FBQyxLQUFEO0FBQ2IsVUFBQTtNQUFBLE9BQUEsR0FBYSxLQUFBLFlBQWlCLGFBQXBCLEdBQXVDLEtBQUssQ0FBQyxNQUE3QyxHQUF5RDsrQkFDbkUsT0FBTyxDQUFFLHNCQUFULENBQWdDLElBQWhDO0lBRmE7O3VCQUlmLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxJQUFHLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsZ0JBQVQsQ0FBMEIsUUFBMUIsQ0FBUCxDQUFmO1FBQ0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxTQUFiO2VBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBZSxTQUFmLEVBRkY7O0lBRGM7O3VCQUtoQixXQUFBLEdBQWEsU0FBQTtNQUNYLElBQTJCLHFCQUEzQjtRQUFBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLEtBQU0sQ0FBQSxDQUFBLENBQXBCLEVBQUE7O2FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxDQUFYO0lBRlc7O3VCQUliLFVBQUEsR0FBWSxTQUFBO2FBQ1YsWUFBQSxDQUFhLDJCQUFiO0lBRFU7O3VCQUdaLFNBQUEsR0FBVyxTQUFDLFdBQUQsRUFBYyxnQkFBZDtBQUNULFVBQUE7TUFBQSxJQUFHLFdBQUEsS0FBZSxnQkFBbEI7QUFDRSxlQURGOztNQUdBLFNBQUEsR0FBWSxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQ7TUFDWixPQUFBLEdBQVUsQ0FBRyxnQkFBRCxHQUFrQixHQUFsQixHQUFxQixTQUF2QixDQUFrQyxDQUFDLE9BQW5DLENBQTJDLE1BQTNDLEVBQW1ELEVBQW5EO0FBRVY7UUFDRSxJQUFBLENBQXlDLEVBQUUsQ0FBQyxVQUFILENBQWMsZ0JBQWQsQ0FBekM7VUFBQSxFQUFFLENBQUMsWUFBSCxDQUFnQixnQkFBaEIsRUFBQTs7UUFDQSxFQUFFLENBQUMsUUFBSCxDQUFZLFdBQVosRUFBeUIsT0FBekI7UUFFQSxJQUFHLElBQUEsR0FBTyxXQUFBLENBQVksT0FBWixDQUFWO1VBQ0UsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsV0FBbkI7aUJBQ0EsSUFBSSxDQUFDLGFBQUwsQ0FBbUIsT0FBbkIsRUFGRjtTQUpGO09BQUEsY0FBQTtRQVFNO2VBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4Qix1QkFBQSxHQUF3QixXQUF4QixHQUFvQyxNQUFwQyxHQUEwQyxnQkFBeEUsRUFBNEY7VUFBQSxNQUFBLEVBQVEsS0FBSyxDQUFDLE9BQWQ7U0FBNUYsRUFURjs7SUFQUzs7dUJBa0JYLG9CQUFBLEdBQXNCLFNBQUE7TUFDcEIsSUFBQSxDQUFjLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBZDtBQUFBLGVBQUE7O01BR0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZixHQUF5QjtNQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDO2FBQ1QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBZixHQUF5QjtJQU5MOzt1QkFRdEIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNYLFVBQUE7TUFBQSxDQUFDLENBQUMsZUFBRixDQUFBO01BR0EsSUFBRyxJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFBLElBQ0EsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsUUFBMUIsQ0FBbUMsVUFBbkMsQ0FEQSxJQUdBLENBQUMsQ0FBQyxDQUFDLE1BQUYsS0FBWSxDQUFaLElBQWlCLENBQUMsQ0FBQyxPQUFuQixJQUErQixPQUFPLENBQUMsUUFBUixLQUFvQixRQUFwRCxDQUhIO0FBSUUsZUFKRjs7TUFNQSxhQUFBLEdBQWdCLENBQUMsQ0FBQztNQUVsQixJQUFHLENBQUMsQ0FBQyxRQUFMO1FBQ0UsSUFBQyxDQUFBLHVCQUFELENBQXlCLGFBQXpCO2VBQ0EsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFGRjtPQUFBLE1BSUssSUFBRyxDQUFDLENBQUMsT0FBRixJQUFhLENBQUMsQ0FBQyxDQUFDLE9BQUYsSUFBYyxPQUFPLENBQUMsUUFBUixLQUFzQixRQUFyQyxDQUFoQjtRQUNILElBQUMsQ0FBQSxxQkFBRCxDQUF1QixhQUF2QjtRQUdBLElBQTBCLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBZ0IsQ0FBQyxNQUFqQixHQUEwQixDQUFwRDtpQkFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBQSxFQUFBO1NBSkc7T0FBQSxNQUFBO1FBTUgsSUFBQyxDQUFBLFdBQUQsQ0FBYSxhQUFiO2VBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQSxFQVBHOztJQWhCTTs7dUJBeUJiLGFBQUEsR0FBZSxTQUFDLFFBQUQ7TUFDYixJQUFDLENBQUEsT0FBTyxDQUFDLE9BQU8sQ0FBQyxlQUFqQixHQUFtQztNQUNuQyxJQUFHLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBSDtRQUNFLElBQUMsQ0FBQSxNQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBRkY7O0lBRmE7O3VCQVdmLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQUEsS0FBSyxDQUFDLE9BQU4sQ0FBQTtBQUFBOztJQURhOzt1QkFPZix1QkFBQSxHQUF5QixTQUFDLEtBQUQ7QUFDdkIsVUFBQTtNQUFBLG9CQUFBLEdBQXVCLElBQUMsQ0FBQSxhQUFELENBQUE7TUFDdkIsZUFBQSxHQUFrQixDQUFBLENBQUUsS0FBRixDQUFRLENBQUMsTUFBVCxDQUFBO01BQ2xCLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxlQUFnQixDQUFBLENBQUEsQ0FBM0IsRUFBK0Isb0JBQS9CLENBQUg7UUFDRSxPQUFBLEdBQVUsZUFBZSxDQUFDLElBQWhCLENBQXFCLFFBQXJCLENBQThCLENBQUMsT0FBL0IsQ0FBQTtRQUNWLFVBQUEsR0FBYSxPQUFPLENBQUMsT0FBUixDQUFnQixLQUFoQjtRQUNiLGFBQUEsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0Isb0JBQWhCO1FBQ2hCLFFBQUE7O0FBQVk7ZUFBb0IsbUhBQXBCO3lCQUFBLE9BQVEsQ0FBQSxDQUFBO0FBQVI7OztRQUVaLElBQUMsQ0FBQSxRQUFELENBQUE7QUFDQSxhQUFBLDBDQUFBOztVQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsVUFBdEI7QUFBQSxTQVBGOzthQVNBO0lBWnVCOzt1QkFrQnpCLHFCQUFBLEdBQXVCLFNBQUMsS0FBRDs7UUFDckIsS0FBSyxDQUFFLFNBQVMsQ0FBQyxNQUFqQixDQUF3QixVQUF4Qjs7YUFDQTtJQUZxQjs7dUJBTXZCLFlBQUEsR0FBYyxTQUFBO01BQ1osSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxTQUFTLENBQUMsTUFBbkIsQ0FBMEIsY0FBMUI7YUFDQSxJQUFDLENBQUEsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLFNBQVMsQ0FBQyxHQUFuQixDQUF1QixXQUF2QjtJQUZZOzt1QkFNZCxtQkFBQSxHQUFxQixTQUFBO01BQ25CLElBQUMsQ0FBQSxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBUyxDQUFDLE1BQW5CLENBQTBCLFdBQTFCO2FBQ0EsSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsY0FBdkI7SUFGbUI7O3VCQU9yQixrQkFBQSxHQUFvQixTQUFBO2FBQ2xCLElBQUMsQ0FBQSxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBUyxDQUFDLFFBQW5CLENBQTRCLGNBQTVCO0lBRGtCOzt1QkFHcEIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNYLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxlQUFlLENBQUMsVUFBakIsQ0FBNEIsQ0FBNUIsQ0FBVjtBQUFBLGVBQUE7O01BRUEsQ0FBQyxDQUFDLGVBQUYsQ0FBQTtNQUVBLEtBQUEsR0FBUSxDQUFDLENBQUMsYUFBYSxDQUFDO01BQ3hCLElBQUEsQ0FBc0MsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixLQUFyQixDQUF0QztRQUFBLElBQUMsQ0FBQSxlQUFlLENBQUMsR0FBakIsQ0FBcUIsS0FBckIsRUFBNEIsQ0FBNUIsRUFBQTs7TUFDQSxJQUFtQyxJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLEtBQXJCLENBQUEsS0FBK0IsQ0FBbEU7UUFBQSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLFVBQXBCLEVBQUE7O2FBQ0EsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixLQUFyQixFQUE0QixJQUFDLENBQUEsZUFBZSxDQUFDLEdBQWpCLENBQXFCLEtBQXJCLENBQUEsR0FBOEIsQ0FBMUQ7SUFSVzs7dUJBVWIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNYLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxlQUFlLENBQUMsVUFBakIsQ0FBNEIsQ0FBNUIsQ0FBVjtBQUFBLGVBQUE7O01BRUEsQ0FBQyxDQUFDLGVBQUYsQ0FBQTtNQUVBLEtBQUEsR0FBUSxDQUFDLENBQUMsYUFBYSxDQUFDO01BQ3hCLElBQUMsQ0FBQSxlQUFlLENBQUMsR0FBakIsQ0FBcUIsS0FBckIsRUFBNEIsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixLQUFyQixDQUFBLEdBQThCLENBQTFEO01BQ0EsSUFBc0MsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixLQUFyQixDQUFBLEtBQStCLENBQXJFO2VBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFoQixDQUF1QixVQUF2QixFQUFBOztJQVBXOzt1QkFVYixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1gsVUFBQTtNQUFBLENBQUMsQ0FBQyxlQUFGLENBQUE7TUFFQSxJQUFHLElBQUMsQ0FBQSxlQUFlLENBQUMsWUFBakIsQ0FBOEIsQ0FBOUIsQ0FBSDtBQUNFLGVBQU8sSUFBQyxDQUFBLGVBQWUsQ0FBQyxXQUFqQixDQUE2QixDQUE3QixFQURUOztNQUdBLE1BQUEsR0FBUyxDQUFBLENBQUUsQ0FBQyxDQUFDLGFBQUosQ0FBa0IsQ0FBQyxJQUFuQixDQUF3QixPQUF4QjtNQUNULFdBQUEsR0FBYyxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVo7TUFFZCxLQUFBLEdBQVEsY0FBQSxDQUFlLE1BQU8sQ0FBQSxDQUFBLENBQXRCO01BRVIsZUFBQSxHQUFrQixNQUFNLENBQUMsS0FBUCxDQUFBLENBQ2hCLENBQUMsR0FEZSxDQUNYLEtBRFcsQ0FFaEIsQ0FBQyxHQUZlLENBR2Q7UUFBQSxRQUFBLEVBQVUsVUFBVjtRQUNBLEdBQUEsRUFBSyxDQURMO1FBRUEsSUFBQSxFQUFNLENBRk47T0FIYztNQU9sQixlQUFlLENBQUMsUUFBaEIsQ0FBeUIsUUFBUSxDQUFDLElBQWxDO01BRUEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsYUFBN0IsR0FBNkM7TUFDN0MsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsWUFBN0IsQ0FBMEMsZUFBZ0IsQ0FBQSxDQUFBLENBQTFELEVBQThELENBQTlELEVBQWlFLENBQWpFO01BQ0EsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBN0IsQ0FBcUMsYUFBckMsRUFBb0QsV0FBcEQ7YUFFQSxNQUFNLENBQUMscUJBQVAsQ0FBNkIsU0FBQTtlQUMzQixlQUFlLENBQUMsTUFBaEIsQ0FBQTtNQUQyQixDQUE3QjtJQXhCVzs7dUJBNEJiLFVBQUEsR0FBWSxTQUFDLENBQUQ7QUFDVixVQUFBO01BQUEsSUFBVSxJQUFDLENBQUEsZUFBZSxDQUFDLFVBQWpCLENBQTRCLENBQTVCLENBQVY7QUFBQSxlQUFBOztNQUVBLENBQUMsQ0FBQyxjQUFGLENBQUE7TUFDQSxDQUFDLENBQUMsZUFBRixDQUFBO01BRUEsS0FBQSxHQUFRLENBQUMsQ0FBQztNQUNWLElBQUcsSUFBQyxDQUFBLGVBQWUsQ0FBQyxHQUFqQixDQUFxQixLQUFyQixDQUFBLEdBQThCLENBQTlCLElBQW9DLENBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFoQixDQUF5QixVQUF6QixDQUEzQztlQUNFLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBaEIsQ0FBb0IsVUFBcEIsRUFERjs7SUFQVTs7dUJBV1osTUFBQSxHQUFRLFNBQUMsQ0FBRDtBQUNOLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxlQUFlLENBQUMsVUFBakIsQ0FBNEIsQ0FBNUIsQ0FBVjtBQUFBLGVBQUE7O01BRUEsQ0FBQyxDQUFDLGNBQUYsQ0FBQTtNQUNBLENBQUMsQ0FBQyxlQUFGLENBQUE7TUFFQSxLQUFBLEdBQVEsQ0FBQyxDQUFDO01BQ1YsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFoQixDQUF1QixVQUF2QjtNQUVBLElBQUEsQ0FBQSxDQUFjLEtBQUEsWUFBaUIsYUFBL0IsQ0FBQTtBQUFBLGVBQUE7O01BRUEsZ0JBQUEsR0FBbUIsQ0FBQSxDQUFFLEtBQUYsQ0FBUSxDQUFDLElBQVQsQ0FBYyxPQUFkLENBQXNCLENBQUMsSUFBdkIsQ0FBNEIsTUFBNUI7TUFDbkIsSUFBQSxDQUFvQixnQkFBcEI7QUFBQSxlQUFPLE1BQVA7O01BRUEsV0FBQSxHQUFjLENBQUMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQTdCLENBQXFDLGFBQXJDO01BRWQsSUFBRyxXQUFIO2VBRUUsSUFBQyxDQUFBLFNBQUQsQ0FBVyxXQUFYLEVBQXdCLGdCQUF4QixFQUZGO09BQUEsTUFBQTtBQUtFO0FBQUE7YUFBQSxzQ0FBQTs7dUJBQ0UsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsSUFBaEIsRUFBc0IsZ0JBQXRCO0FBREY7dUJBTEY7O0lBaEJNOzs7O0tBeDJCYTtBQXhCdkIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbntzaGVsbH0gPSByZXF1aXJlICdlbGVjdHJvbidcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntCdWZmZXJlZFByb2Nlc3MsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntyZXBvRm9yUGF0aCwgZ2V0U3R5bGVPYmplY3QsIGdldEZ1bGxFeHRlbnNpb259ID0gcmVxdWlyZSBcIi4vaGVscGVyc1wiXG57JCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxuQWRkRGlhbG9nID0gbnVsbCAgIyBEZWZlciByZXF1aXJpbmcgdW50aWwgYWN0dWFsbHkgbmVlZGVkXG5Nb3ZlRGlhbG9nID0gbnVsbCAjIERlZmVyIHJlcXVpcmluZyB1bnRpbCBhY3R1YWxseSBuZWVkZWRcbkNvcHlEaWFsb2cgPSBudWxsICMgRGVmZXIgcmVxdWlyaW5nIHVudGlsIGFjdHVhbGx5IG5lZWRlZFxuTWluaW1hdGNoID0gbnVsbCAgIyBEZWZlciByZXF1aXJpbmcgdW50aWwgYWN0dWFsbHkgbmVlZGVkXG5cbkRpcmVjdG9yeSA9IHJlcXVpcmUgJy4vZGlyZWN0b3J5J1xuRGlyZWN0b3J5VmlldyA9IHJlcXVpcmUgJy4vZGlyZWN0b3J5LXZpZXcnXG5GaWxlVmlldyA9IHJlcXVpcmUgJy4vZmlsZS12aWV3J1xuUm9vdERyYWdBbmREcm9wID0gcmVxdWlyZSAnLi9yb290LWRyYWctYW5kLWRyb3AnXG5Mb2NhbFN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlXG5cbnRvZ2dsZUNvbmZpZyA9IChrZXlQYXRoKSAtPlxuICBhdG9tLmNvbmZpZy5zZXQoa2V5UGF0aCwgbm90IGF0b20uY29uZmlnLmdldChrZXlQYXRoKSlcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVHJlZVZpZXcgZXh0ZW5kcyBWaWV3XG4gIHBhbmVsOiBudWxsXG5cbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3RyZWUtdmlldy1yZXNpemVyIHRvb2wtcGFuZWwnLCAnZGF0YS1zaG93LW9uLXJpZ2h0LXNpZGUnOiBhdG9tLmNvbmZpZy5nZXQoJ3RyZWUtdmlldy5zaG93T25SaWdodFNpZGUnKSwgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICd0cmVlLXZpZXctc2Nyb2xsZXIgb3JkZXItLWNlbnRlcicsIG91dGxldDogJ3Njcm9sbGVyJywgPT5cbiAgICAgICAgQG9sIGNsYXNzOiAndHJlZS12aWV3IGZ1bGwtbWVudSBsaXN0LXRyZWUgaGFzLWNvbGxhcHNhYmxlLWNoaWxkcmVuIGZvY3VzYWJsZS1wYW5lbCcsIHRhYmluZGV4OiAtMSwgb3V0bGV0OiAnbGlzdCdcbiAgICAgIEBkaXYgY2xhc3M6ICd0cmVlLXZpZXctcmVzaXplLWhhbmRsZScsIG91dGxldDogJ3Jlc2l6ZUhhbmRsZSdcblxuICBpbml0aWFsaXplOiAoc3RhdGUpIC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZm9jdXNBZnRlckF0dGFjaCA9IGZhbHNlXG4gICAgQHJvb3RzID0gW11cbiAgICBAc2Nyb2xsTGVmdEFmdGVyQXR0YWNoID0gLTFcbiAgICBAc2Nyb2xsVG9wQWZ0ZXJBdHRhY2ggPSAtMVxuICAgIEBzZWxlY3RlZFBhdGggPSBudWxsXG4gICAgQGlnbm9yZWRQYXR0ZXJucyA9IFtdXG4gICAgQHVzZVN5bmNGUyA9IGZhbHNlXG4gICAgQGN1cnJlbnRseU9wZW5pbmcgPSBuZXcgTWFwXG5cbiAgICBAZHJhZ0V2ZW50Q291bnRzID0gbmV3IFdlYWtNYXBcbiAgICBAcm9vdERyYWdBbmREcm9wID0gbmV3IFJvb3REcmFnQW5kRHJvcCh0aGlzKVxuXG4gICAgQGhhbmRsZUV2ZW50cygpXG5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+XG4gICAgICBAb25TdHlsZXNoZWV0c0NoYW5nZWQoKVxuICAgICAgb25TdHlsZXNoZWV0c0NoYW5nZWQgPSBfLmRlYm91bmNlKEBvblN0eWxlc2hlZXRzQ2hhbmdlZCwgMTAwKVxuICAgICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnN0eWxlcy5vbkRpZEFkZFN0eWxlRWxlbWVudChvblN0eWxlc2hlZXRzQ2hhbmdlZClcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5zdHlsZXMub25EaWRSZW1vdmVTdHlsZUVsZW1lbnQob25TdHlsZXNoZWV0c0NoYW5nZWQpXG4gICAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uc3R5bGVzLm9uRGlkVXBkYXRlU3R5bGVFbGVtZW50KG9uU3R5bGVzaGVldHNDaGFuZ2VkKVxuXG4gICAgQHVwZGF0ZVJvb3RzKHN0YXRlLmRpcmVjdG9yeUV4cGFuc2lvblN0YXRlcylcbiAgICBAc2VsZWN0RW50cnkoQHJvb3RzWzBdKVxuXG4gICAgQHNlbGVjdEVudHJ5Rm9yUGF0aChzdGF0ZS5zZWxlY3RlZFBhdGgpIGlmIHN0YXRlLnNlbGVjdGVkUGF0aFxuICAgIEBmb2N1c0FmdGVyQXR0YWNoID0gc3RhdGUuaGFzRm9jdXNcbiAgICBAc2Nyb2xsVG9wQWZ0ZXJBdHRhY2ggPSBzdGF0ZS5zY3JvbGxUb3AgaWYgc3RhdGUuc2Nyb2xsVG9wXG4gICAgQHNjcm9sbExlZnRBZnRlckF0dGFjaCA9IHN0YXRlLnNjcm9sbExlZnQgaWYgc3RhdGUuc2Nyb2xsTGVmdFxuICAgIEBhdHRhY2hBZnRlclByb2plY3RQYXRoU2V0ID0gc3RhdGUuYXR0YWNoZWQgYW5kIF8uaXNFbXB0eShhdG9tLnByb2plY3QuZ2V0UGF0aHMoKSlcbiAgICBAd2lkdGgoc3RhdGUud2lkdGgpIGlmIHN0YXRlLndpZHRoID4gMFxuICAgIEBhdHRhY2goKSBpZiBzdGF0ZS5hdHRhY2hlZFxuXG4gIGF0dGFjaGVkOiAtPlxuICAgIEBmb2N1cygpIGlmIEBmb2N1c0FmdGVyQXR0YWNoXG4gICAgQHNjcm9sbGVyLnNjcm9sbExlZnQoQHNjcm9sbExlZnRBZnRlckF0dGFjaCkgaWYgQHNjcm9sbExlZnRBZnRlckF0dGFjaCA+IDBcbiAgICBAc2Nyb2xsVG9wKEBzY3JvbGxUb3BBZnRlckF0dGFjaCkgaWYgQHNjcm9sbFRvcEFmdGVyQXR0YWNoID4gMFxuXG4gIGRldGFjaGVkOiAtPlxuICAgIEByZXNpemVTdG9wcGVkKClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgZGlyZWN0b3J5RXhwYW5zaW9uU3RhdGVzOiBuZXcgKChyb290cykgLT5cbiAgICAgIEBbcm9vdC5kaXJlY3RvcnkucGF0aF0gPSByb290LmRpcmVjdG9yeS5zZXJpYWxpemVFeHBhbnNpb25TdGF0ZSgpIGZvciByb290IGluIHJvb3RzXG4gICAgICB0aGlzKShAcm9vdHMpXG4gICAgc2VsZWN0ZWRQYXRoOiBAc2VsZWN0ZWRFbnRyeSgpPy5nZXRQYXRoKClcbiAgICBoYXNGb2N1czogQGhhc0ZvY3VzKClcbiAgICBhdHRhY2hlZDogQHBhbmVsP1xuICAgIHNjcm9sbExlZnQ6IEBzY3JvbGxlci5zY3JvbGxMZWZ0KClcbiAgICBzY3JvbGxUb3A6IEBzY3JvbGxUb3AoKVxuICAgIHdpZHRoOiBAd2lkdGgoKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgcm9vdC5kaXJlY3RvcnkuZGVzdHJveSgpIGZvciByb290IGluIEByb290c1xuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAcm9vdERyYWdBbmREcm9wLmRpc3Bvc2UoKVxuICAgIEBkZXRhY2goKSBpZiBAcGFuZWw/XG5cbiAgaGFuZGxlRXZlbnRzOiAtPlxuICAgIEBvbiAnZGJsY2xpY2snLCAnLnRyZWUtdmlldy1yZXNpemUtaGFuZGxlJywgPT5cbiAgICAgIEByZXNpemVUb0ZpdENvbnRlbnQoKVxuICAgIEBvbiAnY2xpY2snLCAnLmVudHJ5JywgKGUpID0+XG4gICAgICAjIFRoaXMgcHJldmVudHMgYWNjaWRlbnRhbCBjb2xsYXBzaW5nIHdoZW4gYSAuZW50cmllcyBlbGVtZW50IGlzIHRoZSBldmVudCB0YXJnZXRcbiAgICAgIHJldHVybiBpZiBlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2VudHJpZXMnKVxuXG4gICAgICBAZW50cnlDbGlja2VkKGUpIHVubGVzcyBlLnNoaWZ0S2V5IG9yIGUubWV0YUtleSBvciBlLmN0cmxLZXlcbiAgICBAb24gJ21vdXNlZG93bicsICcuZW50cnknLCAoZSkgPT5cbiAgICAgIEBvbk1vdXNlRG93bihlKVxuICAgIEBvbiAnbW91c2Vkb3duJywgJy50cmVlLXZpZXctcmVzaXplLWhhbmRsZScsIChlKSA9PiBAcmVzaXplU3RhcnRlZChlKVxuICAgIEBvbiAnZHJhZ3N0YXJ0JywgJy5lbnRyeScsIChlKSA9PiBAb25EcmFnU3RhcnQoZSlcbiAgICBAb24gJ2RyYWdlbnRlcicsICcuZW50cnkuZGlyZWN0b3J5ID4gLmhlYWRlcicsIChlKSA9PiBAb25EcmFnRW50ZXIoZSlcbiAgICBAb24gJ2RyYWdsZWF2ZScsICcuZW50cnkuZGlyZWN0b3J5ID4gLmhlYWRlcicsIChlKSA9PiBAb25EcmFnTGVhdmUoZSlcbiAgICBAb24gJ2RyYWdvdmVyJywgJy5lbnRyeScsIChlKSA9PiBAb25EcmFnT3ZlcihlKVxuICAgIEBvbiAnZHJvcCcsICcuZW50cnknLCAoZSkgPT4gQG9uRHJvcChlKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsXG4gICAgICdjb3JlOm1vdmUtdXAnOiBAbW92ZVVwLmJpbmQodGhpcylcbiAgICAgJ2NvcmU6bW92ZS1kb3duJzogQG1vdmVEb3duLmJpbmQodGhpcylcbiAgICAgJ2NvcmU6cGFnZS11cCc6ID0+IEBwYWdlVXAoKVxuICAgICAnY29yZTpwYWdlLWRvd24nOiA9PiBAcGFnZURvd24oKVxuICAgICAnY29yZTptb3ZlLXRvLXRvcCc6ID0+IEBzY3JvbGxUb1RvcCgpXG4gICAgICdjb3JlOm1vdmUtdG8tYm90dG9tJzogPT4gQHNjcm9sbFRvQm90dG9tKClcbiAgICAgJ3RyZWUtdmlldzpleHBhbmQtaXRlbSc6ID0+IEBvcGVuU2VsZWN0ZWRFbnRyeShwZW5kaW5nOiB0cnVlLCB0cnVlKVxuICAgICAndHJlZS12aWV3OnJlY3Vyc2l2ZS1leHBhbmQtZGlyZWN0b3J5JzogPT4gQGV4cGFuZERpcmVjdG9yeSh0cnVlKVxuICAgICAndHJlZS12aWV3OmNvbGxhcHNlLWRpcmVjdG9yeSc6ID0+IEBjb2xsYXBzZURpcmVjdG9yeSgpXG4gICAgICd0cmVlLXZpZXc6cmVjdXJzaXZlLWNvbGxhcHNlLWRpcmVjdG9yeSc6ID0+IEBjb2xsYXBzZURpcmVjdG9yeSh0cnVlKVxuICAgICAndHJlZS12aWV3Om9wZW4tc2VsZWN0ZWQtZW50cnknOiA9PiBAb3BlblNlbGVjdGVkRW50cnkoKVxuICAgICAndHJlZS12aWV3Om9wZW4tc2VsZWN0ZWQtZW50cnktcmlnaHQnOiA9PiBAb3BlblNlbGVjdGVkRW50cnlSaWdodCgpXG4gICAgICd0cmVlLXZpZXc6b3Blbi1zZWxlY3RlZC1lbnRyeS1sZWZ0JzogPT4gQG9wZW5TZWxlY3RlZEVudHJ5TGVmdCgpXG4gICAgICd0cmVlLXZpZXc6b3Blbi1zZWxlY3RlZC1lbnRyeS11cCc6ID0+IEBvcGVuU2VsZWN0ZWRFbnRyeVVwKClcbiAgICAgJ3RyZWUtdmlldzpvcGVuLXNlbGVjdGVkLWVudHJ5LWRvd24nOiA9PiBAb3BlblNlbGVjdGVkRW50cnlEb3duKClcbiAgICAgJ3RyZWUtdmlldzptb3ZlJzogPT4gQG1vdmVTZWxlY3RlZEVudHJ5KClcbiAgICAgJ3RyZWUtdmlldzpjb3B5JzogPT4gQGNvcHlTZWxlY3RlZEVudHJpZXMoKVxuICAgICAndHJlZS12aWV3OmN1dCc6ID0+IEBjdXRTZWxlY3RlZEVudHJpZXMoKVxuICAgICAndHJlZS12aWV3OnBhc3RlJzogPT4gQHBhc3RlRW50cmllcygpXG4gICAgICd0cmVlLXZpZXc6Y29weS1mdWxsLXBhdGgnOiA9PiBAY29weVNlbGVjdGVkRW50cnlQYXRoKGZhbHNlKVxuICAgICAndHJlZS12aWV3OnNob3ctaW4tZmlsZS1tYW5hZ2VyJzogPT4gQHNob3dTZWxlY3RlZEVudHJ5SW5GaWxlTWFuYWdlcigpXG4gICAgICd0cmVlLXZpZXc6b3Blbi1pbi1uZXctd2luZG93JzogPT4gQG9wZW5TZWxlY3RlZEVudHJ5SW5OZXdXaW5kb3coKVxuICAgICAndHJlZS12aWV3OmNvcHktcHJvamVjdC1wYXRoJzogPT4gQGNvcHlTZWxlY3RlZEVudHJ5UGF0aCh0cnVlKVxuICAgICAndG9vbC1wYW5lbDp1bmZvY3VzJzogPT4gQHVuZm9jdXMoKVxuICAgICAndHJlZS12aWV3OnRvZ2dsZS12Y3MtaWdub3JlZC1maWxlcyc6IC0+IHRvZ2dsZUNvbmZpZyAndHJlZS12aWV3LmhpZGVWY3NJZ25vcmVkRmlsZXMnXG4gICAgICd0cmVlLXZpZXc6dG9nZ2xlLWlnbm9yZWQtbmFtZXMnOiAtPiB0b2dnbGVDb25maWcgJ3RyZWUtdmlldy5oaWRlSWdub3JlZE5hbWVzJ1xuICAgICAndHJlZS12aWV3OnJlbW92ZS1wcm9qZWN0LWZvbGRlcic6IChlKSA9PiBAcmVtb3ZlUHJvamVjdEZvbGRlcihlKVxuXG4gICAgWzAuLjhdLmZvckVhY2ggKGluZGV4KSA9PlxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsIFwidHJlZS12aWV3Om9wZW4tc2VsZWN0ZWQtZW50cnktaW4tcGFuZS0je2luZGV4ICsgMX1cIiwgPT5cbiAgICAgICAgQG9wZW5TZWxlY3RlZEVudHJ5SW5QYW5lIGluZGV4XG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEBzZWxlY3RBY3RpdmVGaWxlKClcbiAgICAgIEByZXZlYWxBY3RpdmVGaWxlKCkgaWYgYXRvbS5jb25maWcuZ2V0KCd0cmVlLXZpZXcuYXV0b1JldmVhbCcpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyA9PlxuICAgICAgQHVwZGF0ZVJvb3RzKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICd0cmVlLXZpZXcuaGlkZVZjc0lnbm9yZWRGaWxlcycsID0+XG4gICAgICBAdXBkYXRlUm9vdHMoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3RyZWUtdmlldy5oaWRlSWdub3JlZE5hbWVzJywgPT5cbiAgICAgIEB1cGRhdGVSb290cygpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnY29yZS5pZ25vcmVkTmFtZXMnLCA9PlxuICAgICAgQHVwZGF0ZVJvb3RzKCkgaWYgYXRvbS5jb25maWcuZ2V0KCd0cmVlLXZpZXcuaGlkZUlnbm9yZWROYW1lcycpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAndHJlZS12aWV3LnNob3dPblJpZ2h0U2lkZScsICh7bmV3VmFsdWV9KSA9PlxuICAgICAgQG9uU2lkZVRvZ2dsZWQobmV3VmFsdWUpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAndHJlZS12aWV3LnNvcnRGb2xkZXJzQmVmb3JlRmlsZXMnLCA9PlxuICAgICAgQHVwZGF0ZVJvb3RzKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICd0cmVlLXZpZXcuc3F1YXNoRGlyZWN0b3J5TmFtZXMnLCA9PlxuICAgICAgQHVwZGF0ZVJvb3RzKClcblxuICB0b2dnbGU6IC0+XG4gICAgaWYgQGlzVmlzaWJsZSgpXG4gICAgICBAZGV0YWNoKClcbiAgICBlbHNlXG4gICAgICBAc2hvdygpXG5cbiAgc2hvdzogLT5cbiAgICBAYXR0YWNoKClcbiAgICBAZm9jdXMoKVxuXG4gIGF0dGFjaDogLT5cbiAgICByZXR1cm4gaWYgXy5pc0VtcHR5KGF0b20ucHJvamVjdC5nZXRQYXRocygpKVxuXG4gICAgQHBhbmVsID89XG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3RyZWUtdmlldy5zaG93T25SaWdodFNpZGUnKVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5hZGRSaWdodFBhbmVsKGl0ZW06IHRoaXMpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmFkZExlZnRQYW5lbChpdGVtOiB0aGlzKVxuXG4gIGRldGFjaDogLT5cbiAgICBAc2Nyb2xsTGVmdEFmdGVyQXR0YWNoID0gQHNjcm9sbGVyLnNjcm9sbExlZnQoKVxuICAgIEBzY3JvbGxUb3BBZnRlckF0dGFjaCA9IEBzY3JvbGxUb3AoKVxuXG4gICAgIyBDbGVhbiB1cCBjb3B5IGFuZCBjdXQgbG9jYWxTdG9yYWdlIFZhcmlhYmxlc1xuICAgIExvY2FsU3RvcmFnZVsndHJlZS12aWV3OmN1dFBhdGgnXSA9IG51bGxcbiAgICBMb2NhbFN0b3JhZ2VbJ3RyZWUtdmlldzpjb3B5UGF0aCddID0gbnVsbFxuXG4gICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgIEBwYW5lbCA9IG51bGxcbiAgICBAdW5mb2N1cygpXG5cbiAgZm9jdXM6IC0+XG4gICAgQGxpc3QuZm9jdXMoKVxuXG4gIHVuZm9jdXM6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKClcblxuICBoYXNGb2N1czogLT5cbiAgICBAbGlzdC5pcygnOmZvY3VzJykgb3IgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpcyBAbGlzdFswXVxuXG4gIHRvZ2dsZUZvY3VzOiAtPlxuICAgIGlmIEBoYXNGb2N1cygpXG4gICAgICBAdW5mb2N1cygpXG4gICAgZWxzZVxuICAgICAgQHNob3coKVxuXG4gIGVudHJ5Q2xpY2tlZDogKGUpIC0+XG4gICAgZW50cnkgPSBlLmN1cnJlbnRUYXJnZXRcbiAgICBpc1JlY3Vyc2l2ZSA9IGUuYWx0S2V5IG9yIGZhbHNlXG4gICAgQHNlbGVjdEVudHJ5KGVudHJ5KVxuICAgIGlmIGVudHJ5IGluc3RhbmNlb2YgRGlyZWN0b3J5Vmlld1xuICAgICAgZW50cnkudG9nZ2xlRXhwYW5zaW9uKGlzUmVjdXJzaXZlKVxuICAgIGVsc2UgaWYgZW50cnkgaW5zdGFuY2VvZiBGaWxlVmlld1xuICAgICAgQGZpbGVWaWV3RW50cnlDbGlja2VkKGUpXG5cbiAgICBmYWxzZVxuXG4gIGZpbGVWaWV3RW50cnlDbGlja2VkOiAoZSkgLT5cbiAgICBmaWxlUGF0aCA9IGUuY3VycmVudFRhcmdldC5nZXRQYXRoKClcbiAgICBkZXRhaWwgPSBlLm9yaWdpbmFsRXZlbnQ/LmRldGFpbCA/IDFcbiAgICBhbHdheXNPcGVuRXhpc3RpbmcgPSBhdG9tLmNvbmZpZy5nZXQoJ3RyZWUtdmlldy5hbHdheXNPcGVuRXhpc3RpbmcnKVxuICAgIGlmIGRldGFpbCBpcyAxXG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUuYWxsb3dQZW5kaW5nUGFuZUl0ZW1zJylcbiAgICAgICAgb3BlblByb21pc2UgPSBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoLCBwZW5kaW5nOiB0cnVlLCBhY3RpdmF0ZVBhbmU6IGZhbHNlLCBzZWFyY2hBbGxQYW5lczogYWx3YXlzT3BlbkV4aXN0aW5nKVxuICAgICAgICBAY3VycmVudGx5T3BlbmluZy5zZXQoZmlsZVBhdGgsIG9wZW5Qcm9taXNlKVxuICAgICAgICBvcGVuUHJvbWlzZS50aGVuID0+IEBjdXJyZW50bHlPcGVuaW5nLmRlbGV0ZShmaWxlUGF0aClcbiAgICBlbHNlIGlmIGRldGFpbCBpcyAyXG4gICAgICBAb3BlbkFmdGVyUHJvbWlzZShmaWxlUGF0aCwgc2VhcmNoQWxsUGFuZXM6IGFsd2F5c09wZW5FeGlzdGluZylcblxuICBvcGVuQWZ0ZXJQcm9taXNlOiAodXJpLCBvcHRpb25zKSAtPlxuICAgIGlmIHByb21pc2UgPSBAY3VycmVudGx5T3BlbmluZy5nZXQodXJpKVxuICAgICAgcHJvbWlzZS50aGVuIC0+IGF0b20ud29ya3NwYWNlLm9wZW4odXJpLCBvcHRpb25zKVxuICAgIGVsc2VcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4odXJpLCBvcHRpb25zKVxuXG4gIHJlc2l6ZVN0YXJ0ZWQ6ID0+XG4gICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsIEByZXNpemVUcmVlVmlldylcbiAgICAkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIEByZXNpemVTdG9wcGVkKVxuXG4gIHJlc2l6ZVN0b3BwZWQ6ID0+XG4gICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCBAcmVzaXplVHJlZVZpZXcpXG4gICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgQHJlc2l6ZVN0b3BwZWQpXG5cbiAgcmVzaXplVHJlZVZpZXc6ICh7cGFnZVgsIHdoaWNofSkgPT5cbiAgICByZXR1cm4gQHJlc2l6ZVN0b3BwZWQoKSB1bmxlc3Mgd2hpY2ggaXMgMVxuXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCd0cmVlLXZpZXcuc2hvd09uUmlnaHRTaWRlJylcbiAgICAgIHdpZHRoID0gQG91dGVyV2lkdGgoKSArIEBvZmZzZXQoKS5sZWZ0IC0gcGFnZVhcbiAgICBlbHNlXG4gICAgICB3aWR0aCA9IHBhZ2VYIC0gQG9mZnNldCgpLmxlZnRcbiAgICBAd2lkdGgod2lkdGgpXG5cbiAgcmVzaXplVG9GaXRDb250ZW50OiAtPlxuICAgIEB3aWR0aCgxKSAjIFNocmluayB0byBtZWFzdXJlIHRoZSBtaW5pbXVtIHdpZHRoIG9mIGxpc3RcbiAgICBAd2lkdGgoQGxpc3Qub3V0ZXJXaWR0aCgpKVxuXG4gIGxvYWRJZ25vcmVkUGF0dGVybnM6IC0+XG4gICAgQGlnbm9yZWRQYXR0ZXJucy5sZW5ndGggPSAwXG4gICAgcmV0dXJuIHVubGVzcyBhdG9tLmNvbmZpZy5nZXQoJ3RyZWUtdmlldy5oaWRlSWdub3JlZE5hbWVzJylcblxuICAgIE1pbmltYXRjaCA/PSByZXF1aXJlKCdtaW5pbWF0Y2gnKS5NaW5pbWF0Y2hcblxuICAgIGlnbm9yZWROYW1lcyA9IGF0b20uY29uZmlnLmdldCgnY29yZS5pZ25vcmVkTmFtZXMnKSA/IFtdXG4gICAgaWdub3JlZE5hbWVzID0gW2lnbm9yZWROYW1lc10gaWYgdHlwZW9mIGlnbm9yZWROYW1lcyBpcyAnc3RyaW5nJ1xuICAgIGZvciBpZ25vcmVkTmFtZSBpbiBpZ25vcmVkTmFtZXMgd2hlbiBpZ25vcmVkTmFtZVxuICAgICAgdHJ5XG4gICAgICAgIEBpZ25vcmVkUGF0dGVybnMucHVzaChuZXcgTWluaW1hdGNoKGlnbm9yZWROYW1lLCBtYXRjaEJhc2U6IHRydWUsIGRvdDogdHJ1ZSkpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkVycm9yIHBhcnNpbmcgaWdub3JlIHBhdHRlcm4gKCN7aWdub3JlZE5hbWV9KVwiLCBkZXRhaWw6IGVycm9yLm1lc3NhZ2UpXG5cbiAgdXBkYXRlUm9vdHM6IChleHBhbnNpb25TdGF0ZXM9e30pIC0+XG4gICAgb2xkRXhwYW5zaW9uU3RhdGVzID0ge31cbiAgICBmb3Igcm9vdCBpbiBAcm9vdHNcbiAgICAgIG9sZEV4cGFuc2lvblN0YXRlc1tyb290LmRpcmVjdG9yeS5wYXRoXSA9IHJvb3QuZGlyZWN0b3J5LnNlcmlhbGl6ZUV4cGFuc2lvblN0YXRlKClcbiAgICAgIHJvb3QuZGlyZWN0b3J5LmRlc3Ryb3koKVxuICAgICAgcm9vdC5yZW1vdmUoKVxuXG4gICAgQGxvYWRJZ25vcmVkUGF0dGVybnMoKVxuXG4gICAgQHJvb3RzID0gZm9yIHByb2plY3RQYXRoIGluIGF0b20ucHJvamVjdC5nZXRQYXRocygpXG4gICAgICBjb250aW51ZSB1bmxlc3Mgc3RhdHMgPSBmcy5sc3RhdFN5bmNOb0V4Y2VwdGlvbihwcm9qZWN0UGF0aClcbiAgICAgIHN0YXRzID0gXy5waWNrIHN0YXRzLCBfLmtleXMoc3RhdHMpLi4uXG4gICAgICBmb3Iga2V5IGluIFtcImF0aW1lXCIsIFwiYmlydGh0aW1lXCIsIFwiY3RpbWVcIiwgXCJtdGltZVwiXVxuICAgICAgICBzdGF0c1trZXldID0gc3RhdHNba2V5XS5nZXRUaW1lKClcblxuICAgICAgZGlyZWN0b3J5ID0gbmV3IERpcmVjdG9yeSh7XG4gICAgICAgIG5hbWU6IHBhdGguYmFzZW5hbWUocHJvamVjdFBhdGgpXG4gICAgICAgIGZ1bGxQYXRoOiBwcm9qZWN0UGF0aFxuICAgICAgICBzeW1saW5rOiBmYWxzZVxuICAgICAgICBpc1Jvb3Q6IHRydWVcbiAgICAgICAgZXhwYW5zaW9uU3RhdGU6IGV4cGFuc2lvblN0YXRlc1twcm9qZWN0UGF0aF0gP1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkRXhwYW5zaW9uU3RhdGVzW3Byb2plY3RQYXRoXSA/XG4gICAgICAgICAgICAgICAgICAgICAgICB7aXNFeHBhbmRlZDogdHJ1ZX1cbiAgICAgICAgQGlnbm9yZWRQYXR0ZXJuc1xuICAgICAgICBAdXNlU3luY0ZTXG4gICAgICAgIHN0YXRzXG4gICAgICB9KVxuICAgICAgcm9vdCA9IG5ldyBEaXJlY3RvcnlWaWV3KClcbiAgICAgIHJvb3QuaW5pdGlhbGl6ZShkaXJlY3RvcnkpXG4gICAgICBAbGlzdFswXS5hcHBlbmRDaGlsZChyb290KVxuICAgICAgcm9vdFxuXG4gICAgaWYgQGF0dGFjaEFmdGVyUHJvamVjdFBhdGhTZXRcbiAgICAgIEBhdHRhY2goKVxuICAgICAgQGF0dGFjaEFmdGVyUHJvamVjdFBhdGhTZXQgPSBmYWxzZVxuXG4gIGdldEFjdGl2ZVBhdGg6IC0+IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk/LmdldFBhdGg/KClcblxuICBzZWxlY3RBY3RpdmVGaWxlOiAtPlxuICAgIGlmIGFjdGl2ZUZpbGVQYXRoID0gQGdldEFjdGl2ZVBhdGgoKVxuICAgICAgQHNlbGVjdEVudHJ5Rm9yUGF0aChhY3RpdmVGaWxlUGF0aClcbiAgICBlbHNlXG4gICAgICBAZGVzZWxlY3QoKVxuXG4gIHJldmVhbEFjdGl2ZUZpbGU6IC0+XG4gICAgcmV0dXJuIGlmIF8uaXNFbXB0eShhdG9tLnByb2plY3QuZ2V0UGF0aHMoKSlcblxuICAgIEBhdHRhY2goKVxuICAgIEBmb2N1cygpIGlmIGF0b20uY29uZmlnLmdldCgndHJlZS12aWV3LmZvY3VzT25SZXZlYWwnKVxuXG4gICAgcmV0dXJuIHVubGVzcyBhY3RpdmVGaWxlUGF0aCA9IEBnZXRBY3RpdmVQYXRoKClcblxuICAgIFtyb290UGF0aCwgcmVsYXRpdmVQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChhY3RpdmVGaWxlUGF0aClcbiAgICByZXR1cm4gdW5sZXNzIHJvb3RQYXRoP1xuXG4gICAgYWN0aXZlUGF0aENvbXBvbmVudHMgPSByZWxhdGl2ZVBhdGguc3BsaXQocGF0aC5zZXApXG4gICAgY3VycmVudFBhdGggPSByb290UGF0aFxuICAgIGZvciBwYXRoQ29tcG9uZW50IGluIGFjdGl2ZVBhdGhDb21wb25lbnRzXG4gICAgICBjdXJyZW50UGF0aCArPSBwYXRoLnNlcCArIHBhdGhDb21wb25lbnRcbiAgICAgIGVudHJ5ID0gQGVudHJ5Rm9yUGF0aChjdXJyZW50UGF0aClcbiAgICAgIGlmIGVudHJ5IGluc3RhbmNlb2YgRGlyZWN0b3J5Vmlld1xuICAgICAgICBlbnRyeS5leHBhbmQoKVxuICAgICAgZWxzZVxuICAgICAgICBAc2VsZWN0RW50cnkoZW50cnkpXG4gICAgICAgIEBzY3JvbGxUb0VudHJ5KGVudHJ5KVxuXG4gIGNvcHlTZWxlY3RlZEVudHJ5UGF0aDogKHJlbGF0aXZlUGF0aCA9IGZhbHNlKSAtPlxuICAgIGlmIHBhdGhUb0NvcHkgPSBAc2VsZWN0ZWRQYXRoXG4gICAgICBwYXRoVG9Db3B5ID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemUocGF0aFRvQ29weSkgaWYgcmVsYXRpdmVQYXRoXG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZShwYXRoVG9Db3B5KVxuXG4gIGVudHJ5Rm9yUGF0aDogKGVudHJ5UGF0aCkgLT5cbiAgICBiZXN0TWF0Y2hFbnRyeSA9IG51bGxcbiAgICBiZXN0TWF0Y2hMZW5ndGggPSAwXG5cbiAgICBmb3IgZW50cnkgaW4gQGxpc3RbMF0ucXVlcnlTZWxlY3RvckFsbCgnLmVudHJ5JylcbiAgICAgIGlmIGVudHJ5LmlzUGF0aEVxdWFsKGVudHJ5UGF0aClcbiAgICAgICAgcmV0dXJuIGVudHJ5XG5cbiAgICAgIGVudHJ5TGVuZ3RoID0gZW50cnkuZ2V0UGF0aCgpLmxlbmd0aFxuICAgICAgaWYgZW50cnkuZGlyZWN0b3J5Py5jb250YWlucyhlbnRyeVBhdGgpIGFuZCBlbnRyeUxlbmd0aCA+IGJlc3RNYXRjaExlbmd0aFxuICAgICAgICBiZXN0TWF0Y2hFbnRyeSA9IGVudHJ5XG4gICAgICAgIGJlc3RNYXRjaExlbmd0aCA9IGVudHJ5TGVuZ3RoXG5cbiAgICBiZXN0TWF0Y2hFbnRyeVxuXG4gIHNlbGVjdEVudHJ5Rm9yUGF0aDogKGVudHJ5UGF0aCkgLT5cbiAgICBAc2VsZWN0RW50cnkoQGVudHJ5Rm9yUGF0aChlbnRyeVBhdGgpKVxuXG4gIG1vdmVEb3duOiAoZXZlbnQpIC0+XG4gICAgZXZlbnQ/LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgc2VsZWN0ZWRFbnRyeSA9IEBzZWxlY3RlZEVudHJ5KClcbiAgICBpZiBzZWxlY3RlZEVudHJ5P1xuICAgICAgaWYgc2VsZWN0ZWRFbnRyeSBpbnN0YW5jZW9mIERpcmVjdG9yeVZpZXdcbiAgICAgICAgaWYgQHNlbGVjdEVudHJ5KHNlbGVjdGVkRW50cnkuZW50cmllcy5jaGlsZHJlblswXSlcbiAgICAgICAgICBAc2Nyb2xsVG9FbnRyeShAc2VsZWN0ZWRFbnRyeSgpKVxuICAgICAgICAgIHJldHVyblxuXG4gICAgICBzZWxlY3RlZEVudHJ5ID0gJChzZWxlY3RlZEVudHJ5KVxuICAgICAgdW50aWwgQHNlbGVjdEVudHJ5KHNlbGVjdGVkRW50cnkubmV4dCgnLmVudHJ5JylbMF0pXG4gICAgICAgIHNlbGVjdGVkRW50cnkgPSBzZWxlY3RlZEVudHJ5LnBhcmVudHMoJy5lbnRyeTpmaXJzdCcpXG4gICAgICAgIGJyZWFrIHVubGVzcyBzZWxlY3RlZEVudHJ5Lmxlbmd0aFxuICAgIGVsc2VcbiAgICAgIEBzZWxlY3RFbnRyeShAcm9vdHNbMF0pXG5cbiAgICBAc2Nyb2xsVG9FbnRyeShAc2VsZWN0ZWRFbnRyeSgpKVxuXG4gIG1vdmVVcDogKGV2ZW50KSAtPlxuICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgc2VsZWN0ZWRFbnRyeSA9IEBzZWxlY3RlZEVudHJ5KClcbiAgICBpZiBzZWxlY3RlZEVudHJ5P1xuICAgICAgc2VsZWN0ZWRFbnRyeSA9ICQoc2VsZWN0ZWRFbnRyeSlcbiAgICAgIGlmIHByZXZpb3VzRW50cnkgPSBAc2VsZWN0RW50cnkoc2VsZWN0ZWRFbnRyeS5wcmV2KCcuZW50cnknKVswXSlcbiAgICAgICAgaWYgcHJldmlvdXNFbnRyeSBpbnN0YW5jZW9mIERpcmVjdG9yeVZpZXdcbiAgICAgICAgICBAc2VsZWN0RW50cnkoXy5sYXN0KHByZXZpb3VzRW50cnkuZW50cmllcy5jaGlsZHJlbikpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZWxlY3RFbnRyeShzZWxlY3RlZEVudHJ5LnBhcmVudHMoJy5kaXJlY3RvcnknKS5maXJzdCgpP1swXSlcbiAgICBlbHNlXG4gICAgICBAc2VsZWN0RW50cnkoQGxpc3QuZmluZCgnLmVudHJ5JykubGFzdCgpP1swXSlcblxuICAgIEBzY3JvbGxUb0VudHJ5KEBzZWxlY3RlZEVudHJ5KCkpXG5cbiAgZXhwYW5kRGlyZWN0b3J5OiAoaXNSZWN1cnNpdmU9ZmFsc2UpIC0+XG4gICAgc2VsZWN0ZWRFbnRyeSA9IEBzZWxlY3RlZEVudHJ5KClcbiAgICBpZiBpc1JlY3Vyc2l2ZSBpcyBmYWxzZSBhbmQgc2VsZWN0ZWRFbnRyeS5pc0V4cGFuZGVkXG4gICAgICBAbW92ZURvd24oKSBpZiBzZWxlY3RlZEVudHJ5LmRpcmVjdG9yeS5nZXRFbnRyaWVzKCkubGVuZ3RoID4gMFxuICAgIGVsc2VcbiAgICAgIHNlbGVjdGVkRW50cnkuZXhwYW5kKGlzUmVjdXJzaXZlKVxuXG4gIGNvbGxhcHNlRGlyZWN0b3J5OiAoaXNSZWN1cnNpdmU9ZmFsc2UpIC0+XG4gICAgc2VsZWN0ZWRFbnRyeSA9IEBzZWxlY3RlZEVudHJ5KClcbiAgICByZXR1cm4gdW5sZXNzIHNlbGVjdGVkRW50cnk/XG5cbiAgICBpZiBkaXJlY3RvcnkgPSAkKHNlbGVjdGVkRW50cnkpLmNsb3Nlc3QoJy5leHBhbmRlZC5kaXJlY3RvcnknKVswXVxuICAgICAgZGlyZWN0b3J5LmNvbGxhcHNlKGlzUmVjdXJzaXZlKVxuICAgICAgQHNlbGVjdEVudHJ5KGRpcmVjdG9yeSlcblxuICBvcGVuU2VsZWN0ZWRFbnRyeTogKG9wdGlvbnM9e30sIGV4cGFuZERpcmVjdG9yeT1mYWxzZSkgLT5cbiAgICBzZWxlY3RlZEVudHJ5ID0gQHNlbGVjdGVkRW50cnkoKVxuICAgIGlmIHNlbGVjdGVkRW50cnkgaW5zdGFuY2VvZiBEaXJlY3RvcnlWaWV3XG4gICAgICBpZiBleHBhbmREaXJlY3RvcnlcbiAgICAgICAgQGV4cGFuZERpcmVjdG9yeShmYWxzZSlcbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0ZWRFbnRyeS50b2dnbGVFeHBhbnNpb24oKVxuICAgIGVsc2UgaWYgc2VsZWN0ZWRFbnRyeSBpbnN0YW5jZW9mIEZpbGVWaWV3XG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3RyZWUtdmlldy5hbHdheXNPcGVuRXhpc3RpbmcnKVxuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbiBzZWFyY2hBbGxQYW5lczogdHJ1ZSwgb3B0aW9uc1xuICAgICAgQG9wZW5BZnRlclByb21pc2Uoc2VsZWN0ZWRFbnRyeS5nZXRQYXRoKCksIG9wdGlvbnMpXG5cbiAgb3BlblNlbGVjdGVkRW50cnlTcGxpdDogKG9yaWVudGF0aW9uLCBzaWRlKSAtPlxuICAgIHNlbGVjdGVkRW50cnkgPSBAc2VsZWN0ZWRFbnRyeSgpXG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIGlmIHBhbmUgYW5kIHNlbGVjdGVkRW50cnkgaW5zdGFuY2VvZiBGaWxlVmlld1xuICAgICAgaWYgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuICAgICAgICBzcGxpdCA9IHBhbmUuc3BsaXQgb3JpZW50YXRpb24sIHNpZGVcbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSBzZWxlY3RlZEVudHJ5LmdldFBhdGgoKSwgc3BsaXRcbiAgICAgIGVsc2VcbiAgICAgICAgQG9wZW5TZWxlY3RlZEVudHJ5IHllc1xuXG4gIG9wZW5TZWxlY3RlZEVudHJ5UmlnaHQ6IC0+XG4gICAgQG9wZW5TZWxlY3RlZEVudHJ5U3BsaXQgJ2hvcml6b250YWwnLCAnYWZ0ZXInXG5cbiAgb3BlblNlbGVjdGVkRW50cnlMZWZ0OiAtPlxuICAgIEBvcGVuU2VsZWN0ZWRFbnRyeVNwbGl0ICdob3Jpem9udGFsJywgJ2JlZm9yZSdcblxuICBvcGVuU2VsZWN0ZWRFbnRyeVVwOiAtPlxuICAgIEBvcGVuU2VsZWN0ZWRFbnRyeVNwbGl0ICd2ZXJ0aWNhbCcsICdiZWZvcmUnXG5cbiAgb3BlblNlbGVjdGVkRW50cnlEb3duOiAtPlxuICAgIEBvcGVuU2VsZWN0ZWRFbnRyeVNwbGl0ICd2ZXJ0aWNhbCcsICdhZnRlcidcblxuICBvcGVuU2VsZWN0ZWRFbnRyeUluUGFuZTogKGluZGV4KSAtPlxuICAgIHNlbGVjdGVkRW50cnkgPSBAc2VsZWN0ZWRFbnRyeSgpXG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClbaW5kZXhdXG4gICAgaWYgcGFuZSBhbmQgc2VsZWN0ZWRFbnRyeSBpbnN0YW5jZW9mIEZpbGVWaWV3XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lIHNlbGVjdGVkRW50cnkuZ2V0UGF0aCgpLCBwYW5lXG5cbiAgbW92ZVNlbGVjdGVkRW50cnk6IC0+XG4gICAgaWYgQGhhc0ZvY3VzKClcbiAgICAgIGVudHJ5ID0gQHNlbGVjdGVkRW50cnkoKVxuICAgICAgcmV0dXJuIGlmIG5vdCBlbnRyeT8gb3IgZW50cnkgaW4gQHJvb3RzXG4gICAgICBvbGRQYXRoID0gZW50cnkuZ2V0UGF0aCgpXG4gICAgZWxzZVxuICAgICAgb2xkUGF0aCA9IEBnZXRBY3RpdmVQYXRoKClcblxuICAgIGlmIG9sZFBhdGhcbiAgICAgIE1vdmVEaWFsb2cgPz0gcmVxdWlyZSAnLi9tb3ZlLWRpYWxvZydcbiAgICAgIGRpYWxvZyA9IG5ldyBNb3ZlRGlhbG9nKG9sZFBhdGgpXG4gICAgICBkaWFsb2cuYXR0YWNoKClcblxuICAjIEdldCB0aGUgb3V0bGluZSBvZiBhIHN5c3RlbSBjYWxsIHRvIHRoZSBjdXJyZW50IHBsYXRmb3JtJ3MgZmlsZSBtYW5hZ2VyLlxuICAjXG4gICMgcGF0aFRvT3BlbiAgLSBQYXRoIHRvIGEgZmlsZSBvciBkaXJlY3RvcnkuXG4gICMgaXNGaWxlICAgICAgLSBUcnVlIGlmIHRoZSBwYXRoIGlzIGEgZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAjXG4gICMgUmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyBhIGNvbW1hbmQsIGEgaHVtYW4tcmVhZGFibGUgbGFiZWwsIGFuZCB0aGVcbiAgIyBhcmd1bWVudHMuXG4gIGZpbGVNYW5hZ2VyQ29tbWFuZEZvclBhdGg6IChwYXRoVG9PcGVuLCBpc0ZpbGUpIC0+XG4gICAgc3dpdGNoIHByb2Nlc3MucGxhdGZvcm1cbiAgICAgIHdoZW4gJ2RhcndpbidcbiAgICAgICAgY29tbWFuZDogJ29wZW4nXG4gICAgICAgIGxhYmVsOiAnRmluZGVyJ1xuICAgICAgICBhcmdzOiBbJy1SJywgcGF0aFRvT3Blbl1cbiAgICAgIHdoZW4gJ3dpbjMyJ1xuICAgICAgICBhcmdzID0gW1wiL3NlbGVjdCxcXFwiI3twYXRoVG9PcGVufVxcXCJcIl1cblxuICAgICAgICBpZiBwcm9jZXNzLmVudi5TeXN0ZW1Sb290XG4gICAgICAgICAgY29tbWFuZCA9IHBhdGguam9pbihwcm9jZXNzLmVudi5TeXN0ZW1Sb290LCAnZXhwbG9yZXIuZXhlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbW1hbmQgPSAnZXhwbG9yZXIuZXhlJ1xuXG4gICAgICAgIGNvbW1hbmQ6IGNvbW1hbmRcbiAgICAgICAgbGFiZWw6ICdFeHBsb3JlcidcbiAgICAgICAgYXJnczogYXJnc1xuICAgICAgZWxzZVxuICAgICAgICAjIFN0cmlwIHRoZSBmaWxlbmFtZSBmcm9tIHRoZSBwYXRoIHRvIG1ha2Ugc3VyZSB3ZSBwYXNzIGEgZGlyZWN0b3J5XG4gICAgICAgICMgcGF0aC4gSWYgd2UgcGFzcyB4ZGctb3BlbiBhIGZpbGUgcGF0aCwgaXQgd2lsbCBvcGVuIHRoYXQgZmlsZSBpbiB0aGVcbiAgICAgICAgIyBtb3N0IHN1aXRhYmxlIGFwcGxpY2F0aW9uIGluc3RlYWQsIHdoaWNoIGlzIG5vdCB3aGF0IHdlIHdhbnQuXG4gICAgICAgIHBhdGhUb09wZW4gPSAgcGF0aC5kaXJuYW1lKHBhdGhUb09wZW4pIGlmIGlzRmlsZVxuXG4gICAgICAgIGNvbW1hbmQ6ICd4ZGctb3BlbidcbiAgICAgICAgbGFiZWw6ICdGaWxlIE1hbmFnZXInXG4gICAgICAgIGFyZ3M6IFtwYXRoVG9PcGVuXVxuXG4gIG9wZW5JbkZpbGVNYW5hZ2VyOiAoY29tbWFuZCwgYXJncywgbGFiZWwsIGlzRmlsZSkgLT5cbiAgICBoYW5kbGVFcnJvciA9IChlcnJvck1lc3NhZ2UpIC0+XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJPcGVuaW5nICN7aWYgaXNGaWxlIHRoZW4gJ2ZpbGUnIGVsc2UgJ2ZvbGRlcid9IGluICN7bGFiZWx9IGZhaWxlZFwiLFxuICAgICAgICBkZXRhaWw6IGVycm9yTWVzc2FnZVxuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuXG4gICAgZXJyb3JMaW5lcyA9IFtdXG4gICAgc3RkZXJyID0gKGxpbmVzKSAtPiBlcnJvckxpbmVzLnB1c2gobGluZXMpXG4gICAgZXhpdCA9IChjb2RlKSAtPlxuICAgICAgZmFpbGVkID0gY29kZSBpc250IDBcbiAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yTGluZXMuam9pbignXFxuJylcblxuICAgICAgIyBXaW5kb3dzIDggc2VlbXMgdG8gcmV0dXJuIGEgMSB3aXRoIG5vIGVycm9yIG91dHB1dCBldmVuIG9uIHN1Y2Nlc3NcbiAgICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ3dpbjMyJyBhbmQgY29kZSBpcyAxIGFuZCBub3QgZXJyb3JNZXNzYWdlXG4gICAgICAgIGZhaWxlZCA9IGZhbHNlXG5cbiAgICAgIGhhbmRsZUVycm9yKGVycm9yTWVzc2FnZSkgaWYgZmFpbGVkXG5cbiAgICBzaG93UHJvY2VzcyA9IG5ldyBCdWZmZXJlZFByb2Nlc3Moe2NvbW1hbmQsIGFyZ3MsIHN0ZGVyciwgZXhpdH0pXG4gICAgc2hvd1Byb2Nlc3Mub25XaWxsVGhyb3dFcnJvciAoe2Vycm9yLCBoYW5kbGV9KSAtPlxuICAgICAgaGFuZGxlKClcbiAgICAgIGhhbmRsZUVycm9yKGVycm9yPy5tZXNzYWdlKVxuICAgIHNob3dQcm9jZXNzXG5cbiAgc2hvd1NlbGVjdGVkRW50cnlJbkZpbGVNYW5hZ2VyOiAtPlxuICAgIHJldHVybiB1bmxlc3MgZW50cnkgPSBAc2VsZWN0ZWRFbnRyeSgpXG5cbiAgICBpc0ZpbGUgPSBlbnRyeSBpbnN0YW5jZW9mIEZpbGVWaWV3XG4gICAge2NvbW1hbmQsIGFyZ3MsIGxhYmVsfSA9IEBmaWxlTWFuYWdlckNvbW1hbmRGb3JQYXRoKGVudHJ5LmdldFBhdGgoKSwgaXNGaWxlKVxuICAgIEBvcGVuSW5GaWxlTWFuYWdlcihjb21tYW5kLCBhcmdzLCBsYWJlbCwgaXNGaWxlKVxuXG4gIHNob3dDdXJyZW50RmlsZUluRmlsZU1hbmFnZXI6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvci5nZXRQYXRoKClcbiAgICB7Y29tbWFuZCwgYXJncywgbGFiZWx9ID0gQGZpbGVNYW5hZ2VyQ29tbWFuZEZvclBhdGgoZWRpdG9yLmdldFBhdGgoKSwgdHJ1ZSlcbiAgICBAb3BlbkluRmlsZU1hbmFnZXIoY29tbWFuZCwgYXJncywgbGFiZWwsIHRydWUpXG5cbiAgb3BlblNlbGVjdGVkRW50cnlJbk5ld1dpbmRvdzogLT5cbiAgICBpZiBwYXRoVG9PcGVuID0gQHNlbGVjdGVkRW50cnkoKT8uZ2V0UGF0aCgpXG4gICAgICBhdG9tLm9wZW4oe3BhdGhzVG9PcGVuOiBbcGF0aFRvT3Blbl0sIG5ld1dpbmRvdzogdHJ1ZX0pXG5cbiAgY29weVNlbGVjdGVkRW50cnk6IC0+XG4gICAgaWYgQGhhc0ZvY3VzKClcbiAgICAgIGVudHJ5ID0gQHNlbGVjdGVkRW50cnkoKVxuICAgICAgcmV0dXJuIGlmIGVudHJ5IGluIEByb290c1xuICAgICAgb2xkUGF0aCA9IGVudHJ5Py5nZXRQYXRoKClcbiAgICBlbHNlXG4gICAgICBvbGRQYXRoID0gQGdldEFjdGl2ZVBhdGgoKVxuICAgIHJldHVybiB1bmxlc3Mgb2xkUGF0aFxuXG4gICAgQ29weURpYWxvZyA/PSByZXF1aXJlICcuL2NvcHktZGlhbG9nJ1xuICAgIGRpYWxvZyA9IG5ldyBDb3B5RGlhbG9nKG9sZFBhdGgpXG4gICAgZGlhbG9nLmF0dGFjaCgpXG5cbiAgcmVtb3ZlU2VsZWN0ZWRFbnRyaWVzOiAtPlxuICAgIGlmIEBoYXNGb2N1cygpXG4gICAgICBzZWxlY3RlZFBhdGhzID0gQHNlbGVjdGVkUGF0aHMoKVxuICAgIGVsc2UgaWYgYWN0aXZlUGF0aCA9IEBnZXRBY3RpdmVQYXRoKClcbiAgICAgIHNlbGVjdGVkUGF0aHMgPSBbYWN0aXZlUGF0aF1cblxuICAgIHJldHVybiB1bmxlc3Mgc2VsZWN0ZWRQYXRocyBhbmQgc2VsZWN0ZWRQYXRocy5sZW5ndGggPiAwXG5cbiAgICBmb3Igcm9vdCBpbiBAcm9vdHNcbiAgICAgIGlmIHJvb3QuZ2V0UGF0aCgpIGluIHNlbGVjdGVkUGF0aHNcbiAgICAgICAgYXRvbS5jb25maXJtXG4gICAgICAgICAgbWVzc2FnZTogXCJUaGUgcm9vdCBkaXJlY3RvcnkgJyN7cm9vdC5kaXJlY3RvcnkubmFtZX0nIGNhbid0IGJlIHJlbW92ZWQuXCJcbiAgICAgICAgICBidXR0b25zOiBbJ09LJ11cbiAgICAgICAgcmV0dXJuXG5cbiAgICBhdG9tLmNvbmZpcm1cbiAgICAgIG1lc3NhZ2U6IFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgI3tpZiBzZWxlY3RlZFBhdGhzLmxlbmd0aCA+IDEgdGhlbiAnaXRlbXMnIGVsc2UgJ2l0ZW0nfT9cIlxuICAgICAgZGV0YWlsZWRNZXNzYWdlOiBcIllvdSBhcmUgZGVsZXRpbmc6XFxuI3tzZWxlY3RlZFBhdGhzLmpvaW4oJ1xcbicpfVwiXG4gICAgICBidXR0b25zOlxuICAgICAgICBcIk1vdmUgdG8gVHJhc2hcIjogLT5cbiAgICAgICAgICBmYWlsZWREZWxldGlvbnMgPSBbXVxuICAgICAgICAgIGZvciBzZWxlY3RlZFBhdGggaW4gc2VsZWN0ZWRQYXRoc1xuICAgICAgICAgICAgaWYgbm90IHNoZWxsLm1vdmVJdGVtVG9UcmFzaChzZWxlY3RlZFBhdGgpXG4gICAgICAgICAgICAgIGZhaWxlZERlbGV0aW9ucy5wdXNoIFwiI3tzZWxlY3RlZFBhdGh9XCJcbiAgICAgICAgICAgIGlmIHJlcG8gPSByZXBvRm9yUGF0aChzZWxlY3RlZFBhdGgpXG4gICAgICAgICAgICAgIHJlcG8uZ2V0UGF0aFN0YXR1cyhzZWxlY3RlZFBhdGgpXG4gICAgICAgICAgaWYgZmFpbGVkRGVsZXRpb25zLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBcIlRoZSBmb2xsb3dpbmcgI3tpZiBmYWlsZWREZWxldGlvbnMubGVuZ3RoID4gMSB0aGVuICdmaWxlcycgZWxzZSAnZmlsZSd9IGNvdWxkbid0IGJlIG1vdmVkIHRvIHRyYXNoI3tpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICdsaW51eCcgdGhlbiBcIiAoaXMgYGd2ZnMtdHJhc2hgIGluc3RhbGxlZD8pXCIgZWxzZSBcIlwifVwiLFxuICAgICAgICAgICAgICBkZXRhaWw6IFwiI3tmYWlsZWREZWxldGlvbnMuam9pbignXFxuJyl9XCJcbiAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgXCJDYW5jZWxcIjogbnVsbFxuXG4gICMgUHVibGljOiBDb3B5IHRoZSBwYXRoIG9mIHRoZSBzZWxlY3RlZCBlbnRyeSBlbGVtZW50LlxuICAjICAgICAgICAgU2F2ZSB0aGUgcGF0aCBpbiBsb2NhbFN0b3JhZ2UsIHNvIHRoYXQgY29weWluZyBmcm9tIDIgZGlmZmVyZW50XG4gICMgICAgICAgICBpbnN0YW5jZXMgb2YgYXRvbSB3b3JrcyBhcyBpbnRlbmRlZFxuICAjXG4gICNcbiAgIyBSZXR1cm5zIGBjb3B5UGF0aGAuXG4gIGNvcHlTZWxlY3RlZEVudHJpZXM6IC0+XG4gICAgc2VsZWN0ZWRQYXRocyA9IEBzZWxlY3RlZFBhdGhzKClcbiAgICByZXR1cm4gdW5sZXNzIHNlbGVjdGVkUGF0aHMgYW5kIHNlbGVjdGVkUGF0aHMubGVuZ3RoID4gMFxuICAgICMgc2F2ZSB0byBsb2NhbFN0b3JhZ2Ugc28gd2UgY2FuIHBhc3RlIGFjcm9zcyBtdWx0aXBsZSBvcGVuIGFwcHNcbiAgICBMb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndHJlZS12aWV3OmN1dFBhdGgnKVxuICAgIExvY2FsU3RvcmFnZVsndHJlZS12aWV3OmNvcHlQYXRoJ10gPSBKU09OLnN0cmluZ2lmeShzZWxlY3RlZFBhdGhzKVxuXG4gICMgUHVibGljOiBDb3B5IHRoZSBwYXRoIG9mIHRoZSBzZWxlY3RlZCBlbnRyeSBlbGVtZW50LlxuICAjICAgICAgICAgU2F2ZSB0aGUgcGF0aCBpbiBsb2NhbFN0b3JhZ2UsIHNvIHRoYXQgY3V0dGluZyBmcm9tIDIgZGlmZmVyZW50XG4gICMgICAgICAgICBpbnN0YW5jZXMgb2YgYXRvbSB3b3JrcyBhcyBpbnRlbmRlZFxuICAjXG4gICNcbiAgIyBSZXR1cm5zIGBjdXRQYXRoYFxuICBjdXRTZWxlY3RlZEVudHJpZXM6IC0+XG4gICAgc2VsZWN0ZWRQYXRocyA9IEBzZWxlY3RlZFBhdGhzKClcbiAgICByZXR1cm4gdW5sZXNzIHNlbGVjdGVkUGF0aHMgYW5kIHNlbGVjdGVkUGF0aHMubGVuZ3RoID4gMFxuICAgICMgc2F2ZSB0byBsb2NhbFN0b3JhZ2Ugc28gd2UgY2FuIHBhc3RlIGFjcm9zcyBtdWx0aXBsZSBvcGVuIGFwcHNcbiAgICBMb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndHJlZS12aWV3OmNvcHlQYXRoJylcbiAgICBMb2NhbFN0b3JhZ2VbJ3RyZWUtdmlldzpjdXRQYXRoJ10gPSBKU09OLnN0cmluZ2lmeShzZWxlY3RlZFBhdGhzKVxuXG4gICMgUHVibGljOiBQYXN0ZSBhIGNvcGllZCBvciBjdXQgaXRlbS5cbiAgIyAgICAgICAgIElmIGEgZmlsZSBpcyBzZWxlY3RlZCwgdGhlIGZpbGUncyBwYXJlbnQgZGlyZWN0b3J5IGlzIHVzZWQgYXMgdGhlXG4gICMgICAgICAgICBwYXN0ZSBkZXN0aW5hdGlvbi5cbiAgI1xuICAjXG4gICMgUmV0dXJucyBgZGVzdGluYXRpb24gbmV3UGF0aGAuXG4gIHBhc3RlRW50cmllczogLT5cbiAgICBzZWxlY3RlZEVudHJ5ID0gQHNlbGVjdGVkRW50cnkoKVxuICAgIGN1dFBhdGhzID0gaWYgTG9jYWxTdG9yYWdlWyd0cmVlLXZpZXc6Y3V0UGF0aCddIHRoZW4gSlNPTi5wYXJzZShMb2NhbFN0b3JhZ2VbJ3RyZWUtdmlldzpjdXRQYXRoJ10pIGVsc2UgbnVsbFxuICAgIGNvcGllZFBhdGhzID0gaWYgTG9jYWxTdG9yYWdlWyd0cmVlLXZpZXc6Y29weVBhdGgnXSB0aGVuIEpTT04ucGFyc2UoTG9jYWxTdG9yYWdlWyd0cmVlLXZpZXc6Y29weVBhdGgnXSkgZWxzZSBudWxsXG4gICAgaW5pdGlhbFBhdGhzID0gY29waWVkUGF0aHMgb3IgY3V0UGF0aHNcblxuICAgIGNhdGNoQW5kU2hvd0ZpbGVFcnJvcnMgPSAob3BlcmF0aW9uKSAtPlxuICAgICAgdHJ5XG4gICAgICAgIG9wZXJhdGlvbigpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIlVuYWJsZSB0byBwYXN0ZSBwYXRoczogI3tpbml0aWFsUGF0aHN9XCIsIGRldGFpbDogZXJyb3IubWVzc2FnZSlcblxuICAgIGZvciBpbml0aWFsUGF0aCBpbiBpbml0aWFsUGF0aHMgPyBbXVxuICAgICAgaW5pdGlhbFBhdGhJc0RpcmVjdG9yeSA9IGZzLmlzRGlyZWN0b3J5U3luYyhpbml0aWFsUGF0aClcbiAgICAgIGlmIHNlbGVjdGVkRW50cnkgYW5kIGluaXRpYWxQYXRoIGFuZCBmcy5leGlzdHNTeW5jKGluaXRpYWxQYXRoKVxuICAgICAgICBiYXNlUGF0aCA9IHNlbGVjdGVkRW50cnkuZ2V0UGF0aCgpXG4gICAgICAgIGJhc2VQYXRoID0gcGF0aC5kaXJuYW1lKGJhc2VQYXRoKSBpZiBzZWxlY3RlZEVudHJ5IGluc3RhbmNlb2YgRmlsZVZpZXdcbiAgICAgICAgbmV3UGF0aCA9IHBhdGguam9pbihiYXNlUGF0aCwgcGF0aC5iYXNlbmFtZShpbml0aWFsUGF0aCkpXG5cbiAgICAgICAgaWYgY29waWVkUGF0aHNcbiAgICAgICAgICAjIGFwcGVuZCBhIG51bWJlciB0byB0aGUgZmlsZSBpZiBhbiBpdGVtIHdpdGggdGhlIHNhbWUgbmFtZSBleGlzdHNcbiAgICAgICAgICBmaWxlQ291bnRlciA9IDBcbiAgICAgICAgICBvcmlnaW5hbE5ld1BhdGggPSBuZXdQYXRoXG4gICAgICAgICAgd2hpbGUgZnMuZXhpc3RzU3luYyhuZXdQYXRoKVxuICAgICAgICAgICAgaWYgaW5pdGlhbFBhdGhJc0RpcmVjdG9yeVxuICAgICAgICAgICAgICBuZXdQYXRoID0gXCIje29yaWdpbmFsTmV3UGF0aH0je2ZpbGVDb3VudGVyfVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIGV4dGVuc2lvbiA9IGdldEZ1bGxFeHRlbnNpb24ob3JpZ2luYWxOZXdQYXRoKVxuICAgICAgICAgICAgICBmaWxlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUob3JpZ2luYWxOZXdQYXRoKSwgcGF0aC5iYXNlbmFtZShvcmlnaW5hbE5ld1BhdGgsIGV4dGVuc2lvbikpXG4gICAgICAgICAgICAgIG5ld1BhdGggPSBcIiN7ZmlsZVBhdGh9I3tmaWxlQ291bnRlcn0je2V4dGVuc2lvbn1cIlxuICAgICAgICAgICAgZmlsZUNvdW50ZXIgKz0gMVxuXG4gICAgICAgICAgaWYgZnMuaXNEaXJlY3RvcnlTeW5jKGluaXRpYWxQYXRoKVxuICAgICAgICAgICAgIyB1c2UgZnMuY29weSB0byBjb3B5IGRpcmVjdG9yaWVzIHNpbmNlIHJlYWQvd3JpdGUgd2lsbCBmYWlsIGZvciBkaXJlY3Rvcmllc1xuICAgICAgICAgICAgY2F0Y2hBbmRTaG93RmlsZUVycm9ycyAtPiBmcy5jb3B5U3luYyhpbml0aWFsUGF0aCwgbmV3UGF0aClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIHJlYWQgdGhlIG9sZCBmaWxlIGFuZCB3cml0ZSBhIG5ldyBvbmUgYXQgdGFyZ2V0IGxvY2F0aW9uXG4gICAgICAgICAgICBjYXRjaEFuZFNob3dGaWxlRXJyb3JzIC0+IGZzLndyaXRlRmlsZVN5bmMobmV3UGF0aCwgZnMucmVhZEZpbGVTeW5jKGluaXRpYWxQYXRoKSlcbiAgICAgICAgZWxzZSBpZiBjdXRQYXRoc1xuICAgICAgICAgICMgT25seSBtb3ZlIHRoZSB0YXJnZXQgaWYgdGhlIGN1dCB0YXJnZXQgZG9lc24ndCBleGlzdHMgYW5kIGlmIHRoZSBuZXdQYXRoXG4gICAgICAgICAgIyBpcyBub3Qgd2l0aGluIHRoZSBpbml0aWFsIHBhdGhcbiAgICAgICAgICB1bmxlc3MgZnMuZXhpc3RzU3luYyhuZXdQYXRoKSBvciBuZXdQYXRoLnN0YXJ0c1dpdGgoaW5pdGlhbFBhdGgpXG4gICAgICAgICAgICBjYXRjaEFuZFNob3dGaWxlRXJyb3JzIC0+IGZzLm1vdmVTeW5jKGluaXRpYWxQYXRoLCBuZXdQYXRoKVxuXG4gIGFkZDogKGlzQ3JlYXRpbmdGaWxlKSAtPlxuICAgIHNlbGVjdGVkRW50cnkgPSBAc2VsZWN0ZWRFbnRyeSgpID8gQHJvb3RzWzBdXG4gICAgc2VsZWN0ZWRQYXRoID0gc2VsZWN0ZWRFbnRyeT8uZ2V0UGF0aCgpID8gJydcblxuICAgIEFkZERpYWxvZyA/PSByZXF1aXJlICcuL2FkZC1kaWFsb2cnXG4gICAgZGlhbG9nID0gbmV3IEFkZERpYWxvZyhzZWxlY3RlZFBhdGgsIGlzQ3JlYXRpbmdGaWxlKVxuICAgIGRpYWxvZy5vbiAnZGlyZWN0b3J5LWNyZWF0ZWQnLCAoZXZlbnQsIGNyZWF0ZWRQYXRoKSA9PlxuICAgICAgQGVudHJ5Rm9yUGF0aChjcmVhdGVkUGF0aCk/LnJlbG9hZCgpXG4gICAgICBAc2VsZWN0RW50cnlGb3JQYXRoKGNyZWF0ZWRQYXRoKVxuICAgICAgZmFsc2VcbiAgICBkaWFsb2cub24gJ2ZpbGUtY3JlYXRlZCcsIChldmVudCwgY3JlYXRlZFBhdGgpIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGNyZWF0ZWRQYXRoKVxuICAgICAgZmFsc2VcbiAgICBkaWFsb2cuYXR0YWNoKClcblxuICByZW1vdmVQcm9qZWN0Rm9sZGVyOiAoZSkgLT5cbiAgICBwYXRoVG9SZW1vdmUgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KFwiLnByb2plY3Qtcm9vdCA+IC5oZWFkZXJcIikuZmluZChcIi5uYW1lXCIpLmRhdGEoXCJwYXRoXCIpXG5cbiAgICAjIFRPRE86IHJlbW92ZSB0aGlzIGNvbmRpdGlvbmFsIG9uY2UgdGhlIGFkZGl0aW9uIG9mIFByb2plY3Q6OnJlbW92ZVBhdGhcbiAgICAjIGlzIHJlbGVhc2VkLlxuICAgIGlmIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoP1xuICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgocGF0aFRvUmVtb3ZlKSBpZiBwYXRoVG9SZW1vdmU/XG5cbiAgc2VsZWN0ZWRFbnRyeTogLT5cbiAgICBAbGlzdFswXS5xdWVyeVNlbGVjdG9yKCcuc2VsZWN0ZWQnKVxuXG4gIHNlbGVjdEVudHJ5OiAoZW50cnkpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbnRyeT9cblxuICAgIEBzZWxlY3RlZFBhdGggPSBlbnRyeS5nZXRQYXRoKClcblxuICAgIHNlbGVjdGVkRW50cmllcyA9IEBnZXRTZWxlY3RlZEVudHJpZXMoKVxuICAgIGlmIHNlbGVjdGVkRW50cmllcy5sZW5ndGggPiAxIG9yIHNlbGVjdGVkRW50cmllc1swXSBpc250IGVudHJ5XG4gICAgICBAZGVzZWxlY3Qoc2VsZWN0ZWRFbnRyaWVzKVxuICAgICAgZW50cnkuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKVxuICAgIGVudHJ5XG5cbiAgZ2V0U2VsZWN0ZWRFbnRyaWVzOiAtPlxuICAgIEBsaXN0WzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zZWxlY3RlZCcpXG5cbiAgZGVzZWxlY3Q6IChlbGVtZW50c1RvRGVzZWxlY3Q9QGdldFNlbGVjdGVkRW50cmllcygpKSAtPlxuICAgIHNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJykgZm9yIHNlbGVjdGVkIGluIGVsZW1lbnRzVG9EZXNlbGVjdFxuICAgIHVuZGVmaW5lZFxuXG4gIHNjcm9sbFRvcDogKHRvcCkgLT5cbiAgICBpZiB0b3A/XG4gICAgICBAc2Nyb2xsZXIuc2Nyb2xsVG9wKHRvcClcbiAgICBlbHNlXG4gICAgICBAc2Nyb2xsZXIuc2Nyb2xsVG9wKClcblxuICBzY3JvbGxCb3R0b206IChib3R0b20pIC0+XG4gICAgaWYgYm90dG9tP1xuICAgICAgQHNjcm9sbGVyLnNjcm9sbEJvdHRvbShib3R0b20pXG4gICAgZWxzZVxuICAgICAgQHNjcm9sbGVyLnNjcm9sbEJvdHRvbSgpXG5cbiAgc2Nyb2xsVG9FbnRyeTogKGVudHJ5KSAtPlxuICAgIGVsZW1lbnQgPSBpZiBlbnRyeSBpbnN0YW5jZW9mIERpcmVjdG9yeVZpZXcgdGhlbiBlbnRyeS5oZWFkZXIgZWxzZSBlbnRyeVxuICAgIGVsZW1lbnQ/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQodHJ1ZSkgIyB0cnVlID0gY2VudGVyIGFyb3VuZCBpdGVtIGlmIHBvc3NpYmxlXG5cbiAgc2Nyb2xsVG9Cb3R0b206IC0+XG4gICAgaWYgbGFzdEVudHJ5ID0gXy5sYXN0KEBsaXN0WzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJy5lbnRyeScpKVxuICAgICAgQHNlbGVjdEVudHJ5KGxhc3RFbnRyeSlcbiAgICAgIEBzY3JvbGxUb0VudHJ5KGxhc3RFbnRyeSlcblxuICBzY3JvbGxUb1RvcDogLT5cbiAgICBAc2VsZWN0RW50cnkoQHJvb3RzWzBdKSBpZiBAcm9vdHNbMF0/XG4gICAgQHNjcm9sbFRvcCgwKVxuXG4gIHRvZ2dsZVNpZGU6IC0+XG4gICAgdG9nZ2xlQ29uZmlnKCd0cmVlLXZpZXcuc2hvd09uUmlnaHRTaWRlJylcblxuICBtb3ZlRW50cnk6IChpbml0aWFsUGF0aCwgbmV3RGlyZWN0b3J5UGF0aCkgLT5cbiAgICBpZiBpbml0aWFsUGF0aCBpcyBuZXdEaXJlY3RvcnlQYXRoXG4gICAgICByZXR1cm5cblxuICAgIGVudHJ5TmFtZSA9IHBhdGguYmFzZW5hbWUoaW5pdGlhbFBhdGgpXG4gICAgbmV3UGF0aCA9IFwiI3tuZXdEaXJlY3RvcnlQYXRofS8je2VudHJ5TmFtZX1cIi5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gICAgdHJ5XG4gICAgICBmcy5tYWtlVHJlZVN5bmMobmV3RGlyZWN0b3J5UGF0aCkgdW5sZXNzIGZzLmV4aXN0c1N5bmMobmV3RGlyZWN0b3J5UGF0aClcbiAgICAgIGZzLm1vdmVTeW5jKGluaXRpYWxQYXRoLCBuZXdQYXRoKVxuXG4gICAgICBpZiByZXBvID0gcmVwb0ZvclBhdGgobmV3UGF0aClcbiAgICAgICAgcmVwby5nZXRQYXRoU3RhdHVzKGluaXRpYWxQYXRoKVxuICAgICAgICByZXBvLmdldFBhdGhTdGF0dXMobmV3UGF0aClcblxuICAgIGNhdGNoIGVycm9yXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIkZhaWxlZCB0byBtb3ZlIGVudHJ5ICN7aW5pdGlhbFBhdGh9IHRvICN7bmV3RGlyZWN0b3J5UGF0aH1cIiwgZGV0YWlsOiBlcnJvci5tZXNzYWdlKVxuXG4gIG9uU3R5bGVzaGVldHNDaGFuZ2VkOiA9PlxuICAgIHJldHVybiB1bmxlc3MgQGlzVmlzaWJsZSgpXG5cbiAgICAjIEZvcmNlIGEgcmVkcmF3IHNvIHRoZSBzY3JvbGxiYXJzIGFyZSBzdHlsZWQgY29ycmVjdGx5IGJhc2VkIG9uIHRoZSB0aGVtZVxuICAgIEBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICBAZWxlbWVudC5vZmZzZXRXaWR0aFxuICAgIEBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnJ1xuXG4gIG9uTW91c2VEb3duOiAoZSkgLT5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAjIHJldHVybiBlYXJseSBpZiB3ZSdyZSBvcGVuaW5nIGEgY29udGV4dHVhbCBtZW51IChyaWdodCBjbGljaykgZHVyaW5nIG11bHRpLXNlbGVjdCBtb2RlXG4gICAgaWYgQG11bHRpU2VsZWN0RW5hYmxlZCgpIGFuZFxuICAgICAgIGUuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJykgYW5kXG4gICAgICAgIyBtb3VzZSByaWdodCBjbGljayBvciBjdHJsIGNsaWNrIGFzIHJpZ2h0IGNsaWNrIG9uIGRhcndpbiBwbGF0Zm9ybXNcbiAgICAgICAoZS5idXR0b24gaXMgMiBvciBlLmN0cmxLZXkgYW5kIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbicpXG4gICAgICByZXR1cm5cblxuICAgIGVudHJ5VG9TZWxlY3QgPSBlLmN1cnJlbnRUYXJnZXRcblxuICAgIGlmIGUuc2hpZnRLZXlcbiAgICAgIEBzZWxlY3RDb250aW51b3VzRW50cmllcyhlbnRyeVRvU2VsZWN0KVxuICAgICAgQHNob3dNdWx0aVNlbGVjdE1lbnUoKVxuICAgICMgb25seSBhbGxvdyBjdHJsIGNsaWNrIGZvciBtdWx0aSBzZWxlY3Rpb24gb24gbm9uIGRhcndpbiBzeXN0ZW1zXG4gICAgZWxzZSBpZiBlLm1ldGFLZXkgb3IgKGUuY3RybEtleSBhbmQgcHJvY2Vzcy5wbGF0Zm9ybSBpc250ICdkYXJ3aW4nKVxuICAgICAgQHNlbGVjdE11bHRpcGxlRW50cmllcyhlbnRyeVRvU2VsZWN0KVxuXG4gICAgICAjIG9ubHkgc2hvdyB0aGUgbXVsdGkgc2VsZWN0IG1lbnUgaWYgbW9yZSB0aGVuIG9uZSBmaWxlL2RpcmVjdG9yeSBpcyBzZWxlY3RlZFxuICAgICAgQHNob3dNdWx0aVNlbGVjdE1lbnUoKSBpZiBAc2VsZWN0ZWRQYXRocygpLmxlbmd0aCA+IDFcbiAgICBlbHNlXG4gICAgICBAc2VsZWN0RW50cnkoZW50cnlUb1NlbGVjdClcbiAgICAgIEBzaG93RnVsbE1lbnUoKVxuXG4gIG9uU2lkZVRvZ2dsZWQ6IChuZXdWYWx1ZSkgLT5cbiAgICBAZWxlbWVudC5kYXRhc2V0LnNob3dPblJpZ2h0U2lkZSA9IG5ld1ZhbHVlXG4gICAgaWYgQGlzVmlzaWJsZSgpXG4gICAgICBAZGV0YWNoKClcbiAgICAgIEBhdHRhY2goKVxuXG4gICMgUHVibGljOiBSZXR1cm4gYW4gYXJyYXkgb2YgcGF0aHMgZnJvbSBhbGwgc2VsZWN0ZWQgaXRlbXNcbiAgI1xuICAjIEV4YW1wbGU6IEBzZWxlY3RlZFBhdGhzKClcbiAgIyA9PiBbJ3NlbGVjdGVkL3BhdGgvb25lJywgJ3NlbGVjdGVkL3BhdGgvdHdvJywgJ3NlbGVjdGVkL3BhdGgvdGhyZWUnXVxuICAjIFJldHVybnMgQXJyYXkgb2Ygc2VsZWN0ZWQgaXRlbSBwYXRoc1xuICBzZWxlY3RlZFBhdGhzOiAtPlxuICAgIGVudHJ5LmdldFBhdGgoKSBmb3IgZW50cnkgaW4gQGdldFNlbGVjdGVkRW50cmllcygpXG5cbiAgIyBQdWJsaWM6IFNlbGVjdHMgaXRlbXMgd2l0aGluIGEgcmFuZ2UgZGVmaW5lZCBieSBhIGN1cnJlbnRseSBzZWxlY3RlZCBlbnRyeSBhbmRcbiAgIyAgICAgICAgIGEgbmV3IGdpdmVuIGVudHJ5LiBUaGlzIGlzIHNoaWZ0K2NsaWNrIGZ1bmN0aW9uYWxpdHlcbiAgI1xuICAjIFJldHVybnMgYXJyYXkgb2Ygc2VsZWN0ZWQgZWxlbWVudHNcbiAgc2VsZWN0Q29udGludW91c0VudHJpZXM6IChlbnRyeSkgLT5cbiAgICBjdXJyZW50U2VsZWN0ZWRFbnRyeSA9IEBzZWxlY3RlZEVudHJ5KClcbiAgICBwYXJlbnRDb250YWluZXIgPSAkKGVudHJ5KS5wYXJlbnQoKVxuICAgIGlmICQuY29udGFpbnMocGFyZW50Q29udGFpbmVyWzBdLCBjdXJyZW50U2VsZWN0ZWRFbnRyeSlcbiAgICAgIGVudHJpZXMgPSBwYXJlbnRDb250YWluZXIuZmluZCgnLmVudHJ5JykudG9BcnJheSgpXG4gICAgICBlbnRyeUluZGV4ID0gZW50cmllcy5pbmRleE9mKGVudHJ5KVxuICAgICAgc2VsZWN0ZWRJbmRleCA9IGVudHJpZXMuaW5kZXhPZihjdXJyZW50U2VsZWN0ZWRFbnRyeSlcbiAgICAgIGVsZW1lbnRzID0gKGVudHJpZXNbaV0gZm9yIGkgaW4gW2VudHJ5SW5kZXguLnNlbGVjdGVkSW5kZXhdKVxuXG4gICAgICBAZGVzZWxlY3QoKVxuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpIGZvciBlbGVtZW50IGluIGVsZW1lbnRzXG5cbiAgICBlbGVtZW50c1xuXG4gICMgUHVibGljOiBTZWxlY3RzIGNvbnNlY3V0aXZlIGdpdmVuIGVudHJpZXMgd2l0aG91dCBjbGVhcmluZyBwcmV2aW91c2x5IHNlbGVjdGVkXG4gICMgICAgICAgICBpdGVtcy4gVGhpcyBpcyBjbWQrY2xpY2sgZnVuY3Rpb25hbGl0eVxuICAjXG4gICMgUmV0dXJucyBnaXZlbiBlbnRyeVxuICBzZWxlY3RNdWx0aXBsZUVudHJpZXM6IChlbnRyeSkgLT5cbiAgICBlbnRyeT8uY2xhc3NMaXN0LnRvZ2dsZSgnc2VsZWN0ZWQnKVxuICAgIGVudHJ5XG5cbiAgIyBQdWJsaWM6IFRvZ2dsZSBmdWxsLW1lbnUgY2xhc3Mgb24gdGhlIG1haW4gbGlzdCBlbGVtZW50IHRvIGRpc3BsYXkgdGhlIGZ1bGwgY29udGV4dFxuICAjICAgICAgICAgbWVudS5cbiAgc2hvd0Z1bGxNZW51OiAtPlxuICAgIEBsaXN0WzBdLmNsYXNzTGlzdC5yZW1vdmUoJ211bHRpLXNlbGVjdCcpXG4gICAgQGxpc3RbMF0uY2xhc3NMaXN0LmFkZCgnZnVsbC1tZW51JylcblxuICAjIFB1YmxpYzogVG9nZ2xlIG11bHRpLXNlbGVjdCBjbGFzcyBvbiB0aGUgbWFpbiBsaXN0IGVsZW1lbnQgdG8gZGlzcGxheSB0aGUgdGhlXG4gICMgICAgICAgICBtZW51IHdpdGggb25seSBpdGVtcyB0aGF0IG1ha2Ugc2Vuc2UgZm9yIG11bHRpIHNlbGVjdCBmdW5jdGlvbmFsaXR5XG4gIHNob3dNdWx0aVNlbGVjdE1lbnU6IC0+XG4gICAgQGxpc3RbMF0uY2xhc3NMaXN0LnJlbW92ZSgnZnVsbC1tZW51JylcbiAgICBAbGlzdFswXS5jbGFzc0xpc3QuYWRkKCdtdWx0aS1zZWxlY3QnKVxuXG4gICMgUHVibGljOiBDaGVjayBmb3IgbXVsdGktc2VsZWN0IGNsYXNzIG9uIHRoZSBtYWluIGxpc3RcbiAgI1xuICAjIFJldHVybnMgYm9vbGVhblxuICBtdWx0aVNlbGVjdEVuYWJsZWQ6IC0+XG4gICAgQGxpc3RbMF0uY2xhc3NMaXN0LmNvbnRhaW5zKCdtdWx0aS1zZWxlY3QnKVxuXG4gIG9uRHJhZ0VudGVyOiAoZSkgPT5cbiAgICByZXR1cm4gaWYgQHJvb3REcmFnQW5kRHJvcC5pc0RyYWdnaW5nKGUpXG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBlbnRyeSA9IGUuY3VycmVudFRhcmdldC5wYXJlbnROb2RlXG4gICAgQGRyYWdFdmVudENvdW50cy5zZXQoZW50cnksIDApIHVubGVzcyBAZHJhZ0V2ZW50Q291bnRzLmdldChlbnRyeSlcbiAgICBlbnRyeS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpIGlmIEBkcmFnRXZlbnRDb3VudHMuZ2V0KGVudHJ5KSBpcyAwXG4gICAgQGRyYWdFdmVudENvdW50cy5zZXQoZW50cnksIEBkcmFnRXZlbnRDb3VudHMuZ2V0KGVudHJ5KSArIDEpXG5cbiAgb25EcmFnTGVhdmU6IChlKSA9PlxuICAgIHJldHVybiBpZiBAcm9vdERyYWdBbmREcm9wLmlzRHJhZ2dpbmcoZSlcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGVudHJ5ID0gZS5jdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcbiAgICBAZHJhZ0V2ZW50Q291bnRzLnNldChlbnRyeSwgQGRyYWdFdmVudENvdW50cy5nZXQoZW50cnkpIC0gMSlcbiAgICBlbnRyeS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpIGlmIEBkcmFnRXZlbnRDb3VudHMuZ2V0KGVudHJ5KSBpcyAwXG5cbiAgIyBIYW5kbGUgZW50cnkgbmFtZSBvYmplY3QgZHJhZ3N0YXJ0IGV2ZW50XG4gIG9uRHJhZ1N0YXJ0OiAoZSkgLT5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBpZiBAcm9vdERyYWdBbmREcm9wLmNhbkRyYWdTdGFydChlKVxuICAgICAgcmV0dXJuIEByb290RHJhZ0FuZERyb3Aub25EcmFnU3RhcnQoZSlcblxuICAgIHRhcmdldCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5maW5kKFwiLm5hbWVcIilcbiAgICBpbml0aWFsUGF0aCA9IHRhcmdldC5kYXRhKFwicGF0aFwiKVxuXG4gICAgc3R5bGUgPSBnZXRTdHlsZU9iamVjdCh0YXJnZXRbMF0pXG5cbiAgICBmaWxlTmFtZUVsZW1lbnQgPSB0YXJnZXQuY2xvbmUoKVxuICAgICAgLmNzcyhzdHlsZSlcbiAgICAgIC5jc3MoXG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgIHRvcDogMFxuICAgICAgICBsZWZ0OiAwXG4gICAgICApXG4gICAgZmlsZU5hbWVFbGVtZW50LmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpXG5cbiAgICBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIlxuICAgIGUub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuc2V0RHJhZ0ltYWdlKGZpbGVOYW1lRWxlbWVudFswXSwgMCwgMClcbiAgICBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJpbml0aWFsUGF0aFwiLCBpbml0aWFsUGF0aClcblxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLT5cbiAgICAgIGZpbGVOYW1lRWxlbWVudC5yZW1vdmUoKVxuXG4gICMgSGFuZGxlIGVudHJ5IGRyYWdvdmVyIGV2ZW50OyByZXNldCBkZWZhdWx0IGRyYWdvdmVyIGFjdGlvbnNcbiAgb25EcmFnT3ZlcjogKGUpIC0+XG4gICAgcmV0dXJuIGlmIEByb290RHJhZ0FuZERyb3AuaXNEcmFnZ2luZyhlKVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgZW50cnkgPSBlLmN1cnJlbnRUYXJnZXRcbiAgICBpZiBAZHJhZ0V2ZW50Q291bnRzLmdldChlbnRyeSkgPiAwIGFuZCBub3QgZW50cnkuY2xhc3NMaXN0LmNvbnRhaW5zKCdzZWxlY3RlZCcpXG4gICAgICBlbnRyeS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpXG5cbiAgIyBIYW5kbGUgZW50cnkgZHJvcCBldmVudFxuICBvbkRyb3A6IChlKSAtPlxuICAgIHJldHVybiBpZiBAcm9vdERyYWdBbmREcm9wLmlzRHJhZ2dpbmcoZSlcblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGVudHJ5ID0gZS5jdXJyZW50VGFyZ2V0XG4gICAgZW50cnkuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKVxuXG4gICAgcmV0dXJuIHVubGVzcyBlbnRyeSBpbnN0YW5jZW9mIERpcmVjdG9yeVZpZXdcblxuICAgIG5ld0RpcmVjdG9yeVBhdGggPSAkKGVudHJ5KS5maW5kKFwiLm5hbWVcIikuZGF0YShcInBhdGhcIilcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIG5ld0RpcmVjdG9yeVBhdGhcblxuICAgIGluaXRpYWxQYXRoID0gZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwiaW5pdGlhbFBhdGhcIilcblxuICAgIGlmIGluaXRpYWxQYXRoXG4gICAgICAjIERyb3AgZXZlbnQgZnJvbSBBdG9tXG4gICAgICBAbW92ZUVudHJ5KGluaXRpYWxQYXRoLCBuZXdEaXJlY3RvcnlQYXRoKVxuICAgIGVsc2VcbiAgICAgICMgRHJvcCBldmVudCBmcm9tIE9TXG4gICAgICBmb3IgZmlsZSBpbiBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzXG4gICAgICAgIEBtb3ZlRW50cnkoZmlsZS5wYXRoLCBuZXdEaXJlY3RvcnlQYXRoKVxuIl19
