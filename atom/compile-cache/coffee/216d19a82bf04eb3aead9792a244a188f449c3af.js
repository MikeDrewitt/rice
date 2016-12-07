(function() {
  var CompositeDisposable, DefaultDirectorySearcher, Directory, Disposable, Emitter, Model, PaneContainer, Panel, PanelContainer, Task, TextEditor, Workspace, _, fs, path, ref, url,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  url = require('url');

  path = require('path');

  ref = require('event-kit'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  fs = require('fs-plus');

  Directory = require('pathwatcher').Directory;

  DefaultDirectorySearcher = require('./default-directory-searcher');

  Model = require('./model');

  TextEditor = require('./text-editor');

  PaneContainer = require('./pane-container');

  Panel = require('./panel');

  PanelContainer = require('./panel-container');

  Task = require('./task');

  module.exports = Workspace = (function(superClass) {
    extend(Workspace, superClass);

    function Workspace(params) {
      this.didDestroyPaneItem = bind(this.didDestroyPaneItem, this);
      this.updateDocumentEdited = bind(this.updateDocumentEdited, this);
      this.updateWindowTitle = bind(this.updateWindowTitle, this);
      var realThis;
      Workspace.__super__.constructor.apply(this, arguments);
      this.packageManager = params.packageManager, this.config = params.config, this.project = params.project, this.grammarRegistry = params.grammarRegistry, this.notificationManager = params.notificationManager, this.viewRegistry = params.viewRegistry, this.grammarRegistry = params.grammarRegistry, this.applicationDelegate = params.applicationDelegate, this.assert = params.assert, this.deserializerManager = params.deserializerManager, this.textEditorRegistry = params.textEditorRegistry;
      this.emitter = new Emitter;
      this.openers = [];
      this.destroyedItemURIs = [];
      this.paneContainer = new PaneContainer({
        config: this.config,
        applicationDelegate: this.applicationDelegate,
        notificationManager: this.notificationManager,
        deserializerManager: this.deserializerManager
      });
      this.paneContainer.onDidDestroyPaneItem(this.didDestroyPaneItem);
      this.defaultDirectorySearcher = new DefaultDirectorySearcher();
      this.consumeServices(this.packageManager);
      realThis = this;
      this.buildTextEditor = function() {
        return Workspace.prototype.buildTextEditor.apply(realThis, arguments);
      };
      this.panelContainers = {
        top: new PanelContainer({
          location: 'top'
        }),
        left: new PanelContainer({
          location: 'left'
        }),
        right: new PanelContainer({
          location: 'right'
        }),
        bottom: new PanelContainer({
          location: 'bottom'
        }),
        header: new PanelContainer({
          location: 'header'
        }),
        footer: new PanelContainer({
          location: 'footer'
        }),
        modal: new PanelContainer({
          location: 'modal'
        })
      };
      this.subscribeToEvents();
    }

    Workspace.prototype.reset = function(packageManager) {
      var i, len, panelContainer, ref1;
      this.packageManager = packageManager;
      this.emitter.dispose();
      this.emitter = new Emitter;
      this.paneContainer.destroy();
      ref1 = this.panelContainers;
      for (i = 0, len = ref1.length; i < len; i++) {
        panelContainer = ref1[i];
        panelContainer.destroy();
      }
      this.paneContainer = new PaneContainer({
        config: this.config,
        applicationDelegate: this.applicationDelegate,
        notificationManager: this.notificationManager,
        deserializerManager: this.deserializerManager
      });
      this.paneContainer.onDidDestroyPaneItem(this.didDestroyPaneItem);
      this.panelContainers = {
        top: new PanelContainer({
          location: 'top'
        }),
        left: new PanelContainer({
          location: 'left'
        }),
        right: new PanelContainer({
          location: 'right'
        }),
        bottom: new PanelContainer({
          location: 'bottom'
        }),
        header: new PanelContainer({
          location: 'header'
        }),
        footer: new PanelContainer({
          location: 'footer'
        }),
        modal: new PanelContainer({
          location: 'modal'
        })
      };
      this.originalFontSize = null;
      this.openers = [];
      this.destroyedItemURIs = [];
      return this.consumeServices(this.packageManager);
    };

    Workspace.prototype.subscribeToEvents = function() {
      this.subscribeToActiveItem();
      this.subscribeToFontSize();
      return this.subscribeToAddedItems();
    };

    Workspace.prototype.consumeServices = function(arg) {
      var serviceHub;
      serviceHub = arg.serviceHub;
      this.directorySearchers = [];
      return serviceHub.consume('atom.directory-searcher', '^0.1.0', (function(_this) {
        return function(provider) {
          return _this.directorySearchers.unshift(provider);
        };
      })(this));
    };

    Workspace.prototype.serialize = function() {
      return {
        deserializer: 'Workspace',
        paneContainer: this.paneContainer.serialize(),
        packagesWithActiveGrammars: this.getPackageNamesWithActiveGrammars(),
        destroyedItemURIs: this.destroyedItemURIs.slice()
      };
    };

    Workspace.prototype.deserialize = function(state, deserializerManager) {
      var i, len, packageName, ref1, ref2, ref3;
      ref2 = (ref1 = state.packagesWithActiveGrammars) != null ? ref1 : [];
      for (i = 0, len = ref2.length; i < len; i++) {
        packageName = ref2[i];
        if ((ref3 = this.packageManager.getLoadedPackage(packageName)) != null) {
          ref3.loadGrammarsSync();
        }
      }
      if (state.destroyedItemURIs != null) {
        this.destroyedItemURIs = state.destroyedItemURIs;
      }
      return this.paneContainer.deserialize(state.paneContainer, deserializerManager);
    };

    Workspace.prototype.getPackageNamesWithActiveGrammars = function() {
      var addGrammar, editor, editors, grammar, i, j, len, len1, packageNames, ref1;
      packageNames = [];
      addGrammar = (function(_this) {
        return function(arg) {
          var i, includedGrammarScopes, len, packageName, ref1, ref2, scopeName;
          ref1 = arg != null ? arg : {}, includedGrammarScopes = ref1.includedGrammarScopes, packageName = ref1.packageName;
          if (!packageName) {
            return;
          }
          if (packageNames.indexOf(packageName) !== -1) {
            return;
          }
          packageNames.push(packageName);
          ref2 = includedGrammarScopes != null ? includedGrammarScopes : [];
          for (i = 0, len = ref2.length; i < len; i++) {
            scopeName = ref2[i];
            addGrammar(_this.grammarRegistry.grammarForScopeName(scopeName));
          }
        };
      })(this);
      editors = this.getTextEditors();
      for (i = 0, len = editors.length; i < len; i++) {
        editor = editors[i];
        addGrammar(editor.getGrammar());
      }
      if (editors.length > 0) {
        ref1 = this.grammarRegistry.getGrammars();
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          grammar = ref1[j];
          if (grammar.injectionSelector) {
            addGrammar(grammar);
          }
        }
      }
      return _.uniq(packageNames);
    };

    Workspace.prototype.subscribeToActiveItem = function() {
      this.updateWindowTitle();
      this.updateDocumentEdited();
      this.project.onDidChangePaths(this.updateWindowTitle);
      return this.observeActivePaneItem((function(_this) {
        return function(item) {
          var modifiedSubscription, ref1, titleSubscription;
          _this.updateWindowTitle();
          _this.updateDocumentEdited();
          if ((ref1 = _this.activeItemSubscriptions) != null) {
            ref1.dispose();
          }
          _this.activeItemSubscriptions = new CompositeDisposable;
          if (typeof (item != null ? item.onDidChangeTitle : void 0) === 'function') {
            titleSubscription = item.onDidChangeTitle(_this.updateWindowTitle);
          } else if (typeof (item != null ? item.on : void 0) === 'function') {
            titleSubscription = item.on('title-changed', _this.updateWindowTitle);
            if (typeof (titleSubscription != null ? titleSubscription.dispose : void 0) !== 'function') {
              titleSubscription = new Disposable(function() {
                return item.off('title-changed', _this.updateWindowTitle);
              });
            }
          }
          if (typeof (item != null ? item.onDidChangeModified : void 0) === 'function') {
            modifiedSubscription = item.onDidChangeModified(_this.updateDocumentEdited);
          } else if (typeof ((item != null ? item.on : void 0) != null) === 'function') {
            modifiedSubscription = item.on('modified-status-changed', _this.updateDocumentEdited);
            if (typeof (modifiedSubscription != null ? modifiedSubscription.dispose : void 0) !== 'function') {
              modifiedSubscription = new Disposable(function() {
                return item.off('modified-status-changed', _this.updateDocumentEdited);
              });
            }
          }
          if (titleSubscription != null) {
            _this.activeItemSubscriptions.add(titleSubscription);
          }
          if (modifiedSubscription != null) {
            return _this.activeItemSubscriptions.add(modifiedSubscription);
          }
        };
      })(this));
    };

    Workspace.prototype.subscribeToAddedItems = function() {
      return this.onDidAddPaneItem((function(_this) {
        return function(arg) {
          var index, item, pane, subscriptions;
          item = arg.item, pane = arg.pane, index = arg.index;
          if (item instanceof TextEditor) {
            subscriptions = new CompositeDisposable(_this.textEditorRegistry.add(item), _this.textEditorRegistry.maintainGrammar(item), _this.textEditorRegistry.maintainConfig(item), item.observeGrammar(_this.handleGrammarUsed.bind(_this)));
            item.onDidDestroy(function() {
              return subscriptions.dispose();
            });
            return _this.emitter.emit('did-add-text-editor', {
              textEditor: item,
              pane: pane,
              index: index
            });
          }
        };
      })(this));
    };

    Workspace.prototype.updateWindowTitle = function() {
      var appName, item, itemPath, itemTitle, projectPath, projectPaths, ref1, ref2, representedPath, titleParts;
      appName = 'Atom';
      projectPaths = (ref1 = this.project.getPaths()) != null ? ref1 : [];
      if (item = this.getActivePaneItem()) {
        itemPath = typeof item.getPath === "function" ? item.getPath() : void 0;
        itemTitle = (ref2 = typeof item.getLongTitle === "function" ? item.getLongTitle() : void 0) != null ? ref2 : typeof item.getTitle === "function" ? item.getTitle() : void 0;
        projectPath = _.find(projectPaths, function(projectPath) {
          return itemPath === projectPath || (itemPath != null ? itemPath.startsWith(projectPath + path.sep) : void 0);
        });
      }
      if (itemTitle == null) {
        itemTitle = "untitled";
      }
      if (projectPath == null) {
        projectPath = projectPaths[0];
      }
      if (projectPath != null) {
        projectPath = fs.tildify(projectPath);
      }
      titleParts = [];
      if ((item != null) && (projectPath != null)) {
        titleParts.push(itemTitle, projectPath);
        representedPath = itemPath != null ? itemPath : projectPath;
      } else if (projectPath != null) {
        titleParts.push(projectPath);
        representedPath = projectPath;
      } else {
        titleParts.push(itemTitle);
        representedPath = "";
      }
      if (process.platform !== 'darwin') {
        titleParts.push(appName);
      }
      document.title = titleParts.join(" \u2014 ");
      return this.applicationDelegate.setRepresentedFilename(representedPath);
    };

    Workspace.prototype.updateDocumentEdited = function() {
      var modified, ref1, ref2;
      modified = (ref1 = (ref2 = this.getActivePaneItem()) != null ? typeof ref2.isModified === "function" ? ref2.isModified() : void 0 : void 0) != null ? ref1 : false;
      return this.applicationDelegate.setWindowDocumentEdited(modified);
    };


    /*
    Section: Event Subscription
     */

    Workspace.prototype.observeTextEditors = function(callback) {
      var i, len, ref1, textEditor;
      ref1 = this.getTextEditors();
      for (i = 0, len = ref1.length; i < len; i++) {
        textEditor = ref1[i];
        callback(textEditor);
      }
      return this.onDidAddTextEditor(function(arg) {
        var textEditor;
        textEditor = arg.textEditor;
        return callback(textEditor);
      });
    };

    Workspace.prototype.observePaneItems = function(callback) {
      return this.paneContainer.observePaneItems(callback);
    };

    Workspace.prototype.onDidChangeActivePaneItem = function(callback) {
      return this.paneContainer.onDidChangeActivePaneItem(callback);
    };

    Workspace.prototype.onDidStopChangingActivePaneItem = function(callback) {
      return this.paneContainer.onDidStopChangingActivePaneItem(callback);
    };

    Workspace.prototype.observeActivePaneItem = function(callback) {
      return this.paneContainer.observeActivePaneItem(callback);
    };

    Workspace.prototype.onDidOpen = function(callback) {
      return this.emitter.on('did-open', callback);
    };

    Workspace.prototype.onDidAddPane = function(callback) {
      return this.paneContainer.onDidAddPane(callback);
    };

    Workspace.prototype.onWillDestroyPane = function(callback) {
      return this.paneContainer.onWillDestroyPane(callback);
    };

    Workspace.prototype.onDidDestroyPane = function(callback) {
      return this.paneContainer.onDidDestroyPane(callback);
    };

    Workspace.prototype.observePanes = function(callback) {
      return this.paneContainer.observePanes(callback);
    };

    Workspace.prototype.onDidChangeActivePane = function(callback) {
      return this.paneContainer.onDidChangeActivePane(callback);
    };

    Workspace.prototype.observeActivePane = function(callback) {
      return this.paneContainer.observeActivePane(callback);
    };

    Workspace.prototype.onDidAddPaneItem = function(callback) {
      return this.paneContainer.onDidAddPaneItem(callback);
    };

    Workspace.prototype.onWillDestroyPaneItem = function(callback) {
      return this.paneContainer.onWillDestroyPaneItem(callback);
    };

    Workspace.prototype.onDidDestroyPaneItem = function(callback) {
      return this.paneContainer.onDidDestroyPaneItem(callback);
    };

    Workspace.prototype.onDidAddTextEditor = function(callback) {
      return this.emitter.on('did-add-text-editor', callback);
    };


    /*
    Section: Opening
     */

    Workspace.prototype.open = function(uri, options) {
      var pane, searchAllPanes, split;
      if (options == null) {
        options = {};
      }
      searchAllPanes = options.searchAllPanes;
      split = options.split;
      uri = this.project.resolvePath(uri);
      if (!atom.config.get('core.allowPendingPaneItems')) {
        options.pending = false;
      }
      if ((uri != null) && ((url.parse(uri).protocol == null) || process.platform === 'win32')) {
        this.applicationDelegate.addRecentDocument(uri);
      }
      if (searchAllPanes) {
        pane = this.paneContainer.paneForURI(uri);
      }
      if (pane == null) {
        pane = (function() {
          switch (split) {
            case 'left':
              return this.getActivePane().findLeftmostSibling();
            case 'right':
              return this.getActivePane().findOrCreateRightmostSibling();
            case 'up':
              return this.getActivePane().findTopmostSibling();
            case 'down':
              return this.getActivePane().findOrCreateBottommostSibling();
            default:
              return this.getActivePane();
          }
        }).call(this);
      }
      return this.openURIInPane(uri, pane, options);
    };

    Workspace.prototype.openLicense = function() {
      return this.open(path.join(process.resourcesPath, 'LICENSE.md'));
    };

    Workspace.prototype.openSync = function(uri, options) {
      var activateItem, activatePane, i, initialColumn, initialLine, item, len, opener, ref1, ref2, ref3;
      if (uri == null) {
        uri = '';
      }
      if (options == null) {
        options = {};
      }
      initialLine = options.initialLine, initialColumn = options.initialColumn;
      activatePane = (ref1 = options.activatePane) != null ? ref1 : true;
      activateItem = (ref2 = options.activateItem) != null ? ref2 : true;
      uri = this.project.resolvePath(uri);
      item = this.getActivePane().itemForURI(uri);
      if (uri) {
        ref3 = this.getOpeners();
        for (i = 0, len = ref3.length; i < len; i++) {
          opener = ref3[i];
          if (!item) {
            if (item == null) {
              item = opener(uri, options);
            }
          }
        }
      }
      if (item == null) {
        item = this.project.openSync(uri, {
          initialLine: initialLine,
          initialColumn: initialColumn
        });
      }
      if (activateItem) {
        this.getActivePane().activateItem(item);
      }
      this.itemOpened(item);
      if (activatePane) {
        this.getActivePane().activate();
      }
      return item;
    };

    Workspace.prototype.openURIInPane = function(uri, pane, options) {
      var activateItem, activatePane, error, i, item, len, opener, ref1, ref2, ref3, ref4;
      if (options == null) {
        options = {};
      }
      activatePane = (ref1 = options.activatePane) != null ? ref1 : true;
      activateItem = (ref2 = options.activateItem) != null ? ref2 : true;
      if (uri != null) {
        if (item = pane.itemForURI(uri)) {
          if (!options.pending && pane.getPendingItem() === item) {
            pane.clearPendingItem();
          }
        }
        ref3 = this.getOpeners();
        for (i = 0, len = ref3.length; i < len; i++) {
          opener = ref3[i];
          if (!item) {
            if (item == null) {
              item = opener(uri, options);
            }
          }
        }
      }
      try {
        if (item == null) {
          item = this.openTextFile(uri, options);
        }
      } catch (error1) {
        error = error1;
        switch (error.code) {
          case 'CANCELLED':
            return Promise.resolve();
          case 'EACCES':
            this.notificationManager.addWarning("Permission denied '" + error.path + "'");
            return Promise.resolve();
          case 'EPERM':
          case 'EBUSY':
          case 'ENXIO':
          case 'EIO':
          case 'ENOTCONN':
          case 'UNKNOWN':
          case 'ECONNRESET':
          case 'EINVAL':
          case 'EMFILE':
          case 'ENOTDIR':
          case 'EAGAIN':
            this.notificationManager.addWarning("Unable to open '" + ((ref4 = error.path) != null ? ref4 : uri) + "'", {
              detail: error.message
            });
            return Promise.resolve();
          default:
            throw error;
        }
      }
      return Promise.resolve(item).then((function(_this) {
        return function(item) {
          var index, initialColumn, initialLine;
          if (pane.isDestroyed()) {
            return item;
          }
          _this.itemOpened(item);
          if (activateItem) {
            pane.activateItem(item, {
              pending: options.pending
            });
          }
          if (activatePane) {
            pane.activate();
          }
          initialLine = initialColumn = 0;
          if (!Number.isNaN(options.initialLine)) {
            initialLine = options.initialLine;
          }
          if (!Number.isNaN(options.initialColumn)) {
            initialColumn = options.initialColumn;
          }
          if (initialLine >= 0 || initialColumn >= 0) {
            if (typeof item.setCursorBufferPosition === "function") {
              item.setCursorBufferPosition([initialLine, initialColumn]);
            }
          }
          index = pane.getActiveItemIndex();
          _this.emitter.emit('did-open', {
            uri: uri,
            pane: pane,
            item: item,
            index: index
          });
          return item;
        };
      })(this));
    };

    Workspace.prototype.openTextFile = function(uri, options) {
      var choice, error, filePath, fileSize, largeFileMode;
      filePath = this.project.resolvePath(uri);
      if (filePath != null) {
        try {
          fs.closeSync(fs.openSync(filePath, 'r'));
        } catch (error1) {
          error = error1;
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
      fileSize = fs.getSizeSync(filePath);
      largeFileMode = fileSize >= 2 * 1048576;
      if (fileSize >= this.config.get('core.warnOnLargeFileLimit') * 1048576) {
        choice = this.applicationDelegate.confirm({
          message: 'Atom will be unresponsive during the loading of very large files.',
          detailedMessage: "Do you still want to load this file?",
          buttons: ["Proceed", "Cancel"]
        });
        if (choice === 1) {
          error = new Error;
          error.code = 'CANCELLED';
          throw error;
        }
      }
      return this.project.bufferForPath(filePath, options).then((function(_this) {
        return function(buffer) {
          return _this.textEditorRegistry.build(Object.assign({
            buffer: buffer,
            largeFileMode: largeFileMode,
            autoHeight: false
          }, options));
        };
      })(this));
    };

    Workspace.prototype.handleGrammarUsed = function(grammar) {
      if (grammar == null) {
        return;
      }
      return this.packageManager.triggerActivationHook(grammar.packageName + ":grammar-used");
    };

    Workspace.prototype.isTextEditor = function(object) {
      return object instanceof TextEditor;
    };

    Workspace.prototype.buildTextEditor = function(params) {
      var editor, subscriptions;
      editor = this.textEditorRegistry.build(params);
      subscriptions = new CompositeDisposable(this.textEditorRegistry.maintainGrammar(editor), this.textEditorRegistry.maintainConfig(editor));
      editor.onDidDestroy(function() {
        return subscriptions.dispose();
      });
      return editor;
    };

    Workspace.prototype.reopenItem = function() {
      var uri;
      if (uri = this.destroyedItemURIs.pop()) {
        return this.open(uri);
      } else {
        return Promise.resolve();
      }
    };

    Workspace.prototype.addOpener = function(opener) {
      this.openers.push(opener);
      return new Disposable((function(_this) {
        return function() {
          return _.remove(_this.openers, opener);
        };
      })(this));
    };

    Workspace.prototype.getOpeners = function() {
      return this.openers;
    };


    /*
    Section: Pane Items
     */

    Workspace.prototype.getPaneItems = function() {
      return this.paneContainer.getPaneItems();
    };

    Workspace.prototype.getActivePaneItem = function() {
      return this.paneContainer.getActivePaneItem();
    };

    Workspace.prototype.getTextEditors = function() {
      return this.getPaneItems().filter(function(item) {
        return item instanceof TextEditor;
      });
    };

    Workspace.prototype.getActiveTextEditor = function() {
      var activeItem;
      activeItem = this.getActivePaneItem();
      if (activeItem instanceof TextEditor) {
        return activeItem;
      }
    };

    Workspace.prototype.saveAll = function() {
      return this.paneContainer.saveAll();
    };

    Workspace.prototype.confirmClose = function(options) {
      return this.paneContainer.confirmClose(options);
    };

    Workspace.prototype.saveActivePaneItem = function() {
      return this.getActivePane().saveActiveItem();
    };

    Workspace.prototype.saveActivePaneItemAs = function() {
      return this.getActivePane().saveActiveItemAs();
    };

    Workspace.prototype.destroyActivePaneItem = function() {
      return this.getActivePane().destroyActiveItem();
    };


    /*
    Section: Panes
     */

    Workspace.prototype.getPanes = function() {
      return this.paneContainer.getPanes();
    };

    Workspace.prototype.getActivePane = function() {
      return this.paneContainer.getActivePane();
    };

    Workspace.prototype.activateNextPane = function() {
      return this.paneContainer.activateNextPane();
    };

    Workspace.prototype.activatePreviousPane = function() {
      return this.paneContainer.activatePreviousPane();
    };

    Workspace.prototype.paneForURI = function(uri) {
      return this.paneContainer.paneForURI(uri);
    };

    Workspace.prototype.paneForItem = function(item) {
      return this.paneContainer.paneForItem(item);
    };

    Workspace.prototype.destroyActivePane = function() {
      var ref1;
      return (ref1 = this.getActivePane()) != null ? ref1.destroy() : void 0;
    };

    Workspace.prototype.closeActivePaneItemOrEmptyPaneOrWindow = function() {
      if (this.getActivePaneItem() != null) {
        return this.destroyActivePaneItem();
      } else if (this.getPanes().length > 1) {
        return this.destroyActivePane();
      } else if (this.config.get('core.closeEmptyWindows')) {
        return atom.close();
      }
    };

    Workspace.prototype.increaseFontSize = function() {
      return this.config.set("editor.fontSize", this.config.get("editor.fontSize") + 1);
    };

    Workspace.prototype.decreaseFontSize = function() {
      var fontSize;
      fontSize = this.config.get("editor.fontSize");
      if (fontSize > 1) {
        return this.config.set("editor.fontSize", fontSize - 1);
      }
    };

    Workspace.prototype.resetFontSize = function() {
      if (this.originalFontSize) {
        return this.config.set("editor.fontSize", this.originalFontSize);
      }
    };

    Workspace.prototype.subscribeToFontSize = function() {
      return this.config.onDidChange('editor.fontSize', (function(_this) {
        return function(arg) {
          var oldValue;
          oldValue = arg.oldValue;
          return _this.originalFontSize != null ? _this.originalFontSize : _this.originalFontSize = oldValue;
        };
      })(this));
    };

    Workspace.prototype.itemOpened = function(item) {
      var uri;
      if (typeof item.getURI === 'function') {
        uri = item.getURI();
      } else if (typeof item.getUri === 'function') {
        uri = item.getUri();
      }
      if (uri != null) {
        return _.remove(this.destroyedItemURIs, uri);
      }
    };

    Workspace.prototype.didDestroyPaneItem = function(arg) {
      var item, uri;
      item = arg.item;
      if (typeof item.getURI === 'function') {
        uri = item.getURI();
      } else if (typeof item.getUri === 'function') {
        uri = item.getUri();
      }
      if (uri != null) {
        return this.destroyedItemURIs.push(uri);
      }
    };

    Workspace.prototype.destroyed = function() {
      var ref1;
      this.paneContainer.destroy();
      return (ref1 = this.activeItemSubscriptions) != null ? ref1.dispose() : void 0;
    };


    /*
    Section: Panels
    
    Panels are used to display UI related to an editor window. They are placed at one of the four
    edges of the window: left, right, top or bottom. If there are multiple panels on the same window
    edge they are stacked in order of priority: higher priority is closer to the center, lower
    priority towards the edge.
    
    *Note:* If your panel changes its size throughout its lifetime, consider giving it a higher
    priority, allowing fixed size panels to be closer to the edge. This allows control targets to
    remain more static for easier targeting by users that employ mice or trackpads. (See
    [atom/atom#4834](https://github.com/atom/atom/issues/4834) for discussion.)
     */

    Workspace.prototype.getBottomPanels = function() {
      return this.getPanels('bottom');
    };

    Workspace.prototype.addBottomPanel = function(options) {
      return this.addPanel('bottom', options);
    };

    Workspace.prototype.getLeftPanels = function() {
      return this.getPanels('left');
    };

    Workspace.prototype.addLeftPanel = function(options) {
      return this.addPanel('left', options);
    };

    Workspace.prototype.getRightPanels = function() {
      return this.getPanels('right');
    };

    Workspace.prototype.addRightPanel = function(options) {
      return this.addPanel('right', options);
    };

    Workspace.prototype.getTopPanels = function() {
      return this.getPanels('top');
    };

    Workspace.prototype.addTopPanel = function(options) {
      return this.addPanel('top', options);
    };

    Workspace.prototype.getHeaderPanels = function() {
      return this.getPanels('header');
    };

    Workspace.prototype.addHeaderPanel = function(options) {
      return this.addPanel('header', options);
    };

    Workspace.prototype.getFooterPanels = function() {
      return this.getPanels('footer');
    };

    Workspace.prototype.addFooterPanel = function(options) {
      return this.addPanel('footer', options);
    };

    Workspace.prototype.getModalPanels = function() {
      return this.getPanels('modal');
    };

    Workspace.prototype.addModalPanel = function(options) {
      if (options == null) {
        options = {};
      }
      return this.addPanel('modal', options);
    };

    Workspace.prototype.panelForItem = function(item) {
      var container, location, panel, ref1;
      ref1 = this.panelContainers;
      for (location in ref1) {
        container = ref1[location];
        panel = container.panelForItem(item);
        if (panel != null) {
          return panel;
        }
      }
      return null;
    };

    Workspace.prototype.getPanels = function(location) {
      return this.panelContainers[location].getPanels();
    };

    Workspace.prototype.addPanel = function(location, options) {
      if (options == null) {
        options = {};
      }
      return this.panelContainers[location].addPanel(new Panel(options));
    };


    /*
    Section: Searching and Replacing
     */

    Workspace.prototype.scan = function(regex, options, iterator) {
      var allSearches, buffer, cancellablePromise, directories, directoriesForSearcher, directory, directorySearcher, filePath, i, isCancelled, j, k, len, len1, len2, matches, numberOfPathsSearchedForSearcher, onPathsSearched, onPathsSearchedOption, ref1, ref2, ref3, searchPromise, searcher, totalNumberOfPathsSearched;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        iterator = options;
        options = {};
      }
      directoriesForSearcher = new Map();
      ref1 = this.project.getDirectories();
      for (i = 0, len = ref1.length; i < len; i++) {
        directory = ref1[i];
        searcher = this.defaultDirectorySearcher;
        ref2 = this.directorySearchers;
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          directorySearcher = ref2[j];
          if (directorySearcher.canSearchDirectory(directory)) {
            searcher = directorySearcher;
            break;
          }
        }
        directories = directoriesForSearcher.get(searcher);
        if (!directories) {
          directories = [];
          directoriesForSearcher.set(searcher, directories);
        }
        directories.push(directory);
      }
      if (_.isFunction(options.onPathsSearched)) {
        onPathsSearchedOption = options.onPathsSearched;
        totalNumberOfPathsSearched = 0;
        numberOfPathsSearchedForSearcher = new Map();
        onPathsSearched = function(searcher, numberOfPathsSearched) {
          var oldValue;
          oldValue = numberOfPathsSearchedForSearcher.get(searcher);
          if (oldValue) {
            totalNumberOfPathsSearched -= oldValue;
          }
          numberOfPathsSearchedForSearcher.set(searcher, numberOfPathsSearched);
          totalNumberOfPathsSearched += numberOfPathsSearched;
          return onPathsSearchedOption(totalNumberOfPathsSearched);
        };
      } else {
        onPathsSearched = function() {};
      }
      allSearches = [];
      directoriesForSearcher.forEach((function(_this) {
        return function(directories, searcher) {
          var searchOptions;
          searchOptions = {
            inclusions: options.paths || [],
            includeHidden: true,
            excludeVcsIgnores: _this.config.get('core.excludeVcsIgnoredPaths'),
            exclusions: _this.config.get('core.ignoredNames'),
            follow: _this.config.get('core.followSymlinks'),
            didMatch: function(result) {
              if (!_this.project.isPathModified(result.filePath)) {
                return iterator(result);
              }
            },
            didError: function(error) {
              return iterator(null, error);
            },
            didSearchPaths: function(count) {
              return onPathsSearched(searcher, count);
            }
          };
          directorySearcher = searcher.search(directories, regex, searchOptions);
          return allSearches.push(directorySearcher);
        };
      })(this));
      searchPromise = Promise.all(allSearches);
      ref3 = this.project.getBuffers();
      for (k = 0, len2 = ref3.length; k < len2; k++) {
        buffer = ref3[k];
        if (!(buffer.isModified())) {
          continue;
        }
        filePath = buffer.getPath();
        if (!this.project.contains(filePath)) {
          continue;
        }
        matches = [];
        buffer.scan(regex, function(match) {
          return matches.push(match);
        });
        if (matches.length > 0) {
          iterator({
            filePath: filePath,
            matches: matches
          });
        }
      }
      isCancelled = false;
      cancellablePromise = new Promise(function(resolve, reject) {
        var onFailure, onSuccess;
        onSuccess = function() {
          if (isCancelled) {
            return resolve('cancelled');
          } else {
            return resolve(null);
          }
        };
        onFailure = function() {
          var l, len3, promise;
          for (l = 0, len3 = allSearches.length; l < len3; l++) {
            promise = allSearches[l];
            promise.cancel();
          }
          return reject();
        };
        return searchPromise.then(onSuccess, onFailure);
      });
      cancellablePromise.cancel = function() {
        var l, len3, promise, results;
        isCancelled = true;
        results = [];
        for (l = 0, len3 = allSearches.length; l < len3; l++) {
          promise = allSearches[l];
          results.push(promise.cancel());
        }
        return results;
      };
      cancellablePromise.done = function(onSuccessOrFailure) {
        return cancellablePromise.then(onSuccessOrFailure, onSuccessOrFailure);
      };
      return cancellablePromise;
    };

    Workspace.prototype.replace = function(regex, replacementText, filePaths, iterator) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var buffer, checkFinished, flags, i, inProcessFinished, len, openPaths, outOfProcessFinished, outOfProcessPaths, ref1, ref2, replacements, task;
          openPaths = (function() {
            var i, len, ref1, results;
            ref1 = this.project.getBuffers();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              buffer = ref1[i];
              results.push(buffer.getPath());
            }
            return results;
          }).call(_this);
          outOfProcessPaths = _.difference(filePaths, openPaths);
          inProcessFinished = !openPaths.length;
          outOfProcessFinished = !outOfProcessPaths.length;
          checkFinished = function() {
            if (outOfProcessFinished && inProcessFinished) {
              return resolve();
            }
          };
          if (!outOfProcessFinished.length) {
            flags = 'g';
            if (regex.ignoreCase) {
              flags += 'i';
            }
            task = Task.once(require.resolve('./replace-handler'), outOfProcessPaths, regex.source, flags, replacementText, function() {
              outOfProcessFinished = true;
              return checkFinished();
            });
            task.on('replace:path-replaced', iterator);
            task.on('replace:file-error', function(error) {
              return iterator(null, error);
            });
          }
          ref1 = _this.project.getBuffers();
          for (i = 0, len = ref1.length; i < len; i++) {
            buffer = ref1[i];
            if (ref2 = buffer.getPath(), indexOf.call(filePaths, ref2) < 0) {
              continue;
            }
            replacements = buffer.replace(regex, replacementText, iterator);
            if (replacements) {
              iterator({
                filePath: buffer.getPath(),
                replacements: replacements
              });
            }
          }
          inProcessFinished = true;
          return checkFinished();
        };
      })(this));
    };

    Workspace.prototype.checkoutHeadRevision = function(editor) {
      var checkoutHead;
      if (editor.getPath()) {
        checkoutHead = (function(_this) {
          return function() {
            return _this.project.repositoryForDirectory(new Directory(editor.getDirectoryPath())).then(function(repository) {
              return repository != null ? repository.checkoutHeadForEditor(editor) : void 0;
            });
          };
        })(this);
        if (this.config.get('editor.confirmCheckoutHeadRevision')) {
          return this.applicationDelegate.confirm({
            message: 'Confirm Checkout HEAD Revision',
            detailedMessage: "Are you sure you want to discard all changes to \"" + (editor.getFileName()) + "\" since the last Git commit?",
            buttons: {
              OK: checkoutHead,
              Cancel: null
            }
          });
        } else {
          return checkoutHead();
        }
      } else {
        return Promise.resolve(false);
      }
    };

    return Workspace;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy93b3Jrc3BhY2UuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4S0FBQTtJQUFBOzs7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osR0FBQSxHQUFNLE9BQUEsQ0FBUSxLQUFSOztFQUNOLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUE2QyxPQUFBLENBQVEsV0FBUixDQUE3QyxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0I7O0VBQ3RCLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDSixZQUFhLE9BQUEsQ0FBUSxhQUFSOztFQUNkLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSw4QkFBUjs7RUFDM0IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFDaEIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUNqQixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBV1AsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1MsbUJBQUMsTUFBRDs7OztBQUNYLFVBQUE7TUFBQSw0Q0FBQSxTQUFBO01BR0UsSUFBQyxDQUFBLHdCQUFBLGNBREgsRUFDbUIsSUFBQyxDQUFBLGdCQUFBLE1BRHBCLEVBQzRCLElBQUMsQ0FBQSxpQkFBQSxPQUQ3QixFQUNzQyxJQUFDLENBQUEseUJBQUEsZUFEdkMsRUFDd0QsSUFBQyxDQUFBLDZCQUFBLG1CQUR6RCxFQUVFLElBQUMsQ0FBQSxzQkFBQSxZQUZILEVBRWlCLElBQUMsQ0FBQSx5QkFBQSxlQUZsQixFQUVtQyxJ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PSByZXF1aXJlICd1cmwnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbntFbWl0dGVyLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntEaXJlY3Rvcnl9ID0gcmVxdWlyZSAncGF0aHdhdGNoZXInXG5EZWZhdWx0RGlyZWN0b3J5U2VhcmNoZXIgPSByZXF1aXJlICcuL2RlZmF1bHQtZGlyZWN0b3J5LXNlYXJjaGVyJ1xuTW9kZWwgPSByZXF1aXJlICcuL21vZGVsJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vdGV4dC1lZGl0b3InXG5QYW5lQ29udGFpbmVyID0gcmVxdWlyZSAnLi9wYW5lLWNvbnRhaW5lcidcblBhbmVsID0gcmVxdWlyZSAnLi9wYW5lbCdcblBhbmVsQ29udGFpbmVyID0gcmVxdWlyZSAnLi9wYW5lbC1jb250YWluZXInXG5UYXNrID0gcmVxdWlyZSAnLi90YXNrJ1xuXG4jIEVzc2VudGlhbDogUmVwcmVzZW50cyB0aGUgc3RhdGUgb2YgdGhlIHVzZXIgaW50ZXJmYWNlIGZvciB0aGUgZW50aXJlIHdpbmRvdy5cbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhdmFpbGFibGUgdmlhIHRoZSBgYXRvbS53b3Jrc3BhY2VgIGdsb2JhbC5cbiNcbiMgSW50ZXJhY3Qgd2l0aCB0aGlzIG9iamVjdCB0byBvcGVuIGZpbGVzLCBiZSBub3RpZmllZCBvZiBjdXJyZW50IGFuZCBmdXR1cmVcbiMgZWRpdG9ycywgYW5kIG1hbmlwdWxhdGUgcGFuZXMuIFRvIGFkZCBwYW5lbHMsIHVzZSB7V29ya3NwYWNlOjphZGRUb3BQYW5lbH1cbiMgYW5kIGZyaWVuZHMuXG4jXG4jICogYGVkaXRvcmAge1RleHRFZGl0b3J9IHRoZSBuZXcgZWRpdG9yXG4jXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBXb3Jrc3BhY2UgZXh0ZW5kcyBNb2RlbFxuICBjb25zdHJ1Y3RvcjogKHBhcmFtcykgLT5cbiAgICBzdXBlclxuXG4gICAge1xuICAgICAgQHBhY2thZ2VNYW5hZ2VyLCBAY29uZmlnLCBAcHJvamVjdCwgQGdyYW1tYXJSZWdpc3RyeSwgQG5vdGlmaWNhdGlvbk1hbmFnZXIsXG4gICAgICBAdmlld1JlZ2lzdHJ5LCBAZ3JhbW1hclJlZ2lzdHJ5LCBAYXBwbGljYXRpb25EZWxlZ2F0ZSwgQGFzc2VydCxcbiAgICAgIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyLCBAdGV4dEVkaXRvclJlZ2lzdHJ5XG4gICAgfSA9IHBhcmFtc1xuXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBvcGVuZXJzID0gW11cbiAgICBAZGVzdHJveWVkSXRlbVVSSXMgPSBbXVxuXG4gICAgQHBhbmVDb250YWluZXIgPSBuZXcgUGFuZUNvbnRhaW5lcih7QGNvbmZpZywgQGFwcGxpY2F0aW9uRGVsZWdhdGUsIEBub3RpZmljYXRpb25NYW5hZ2VyLCBAZGVzZXJpYWxpemVyTWFuYWdlcn0pXG4gICAgQHBhbmVDb250YWluZXIub25EaWREZXN0cm95UGFuZUl0ZW0oQGRpZERlc3Ryb3lQYW5lSXRlbSlcblxuICAgIEBkZWZhdWx0RGlyZWN0b3J5U2VhcmNoZXIgPSBuZXcgRGVmYXVsdERpcmVjdG9yeVNlYXJjaGVyKClcbiAgICBAY29uc3VtZVNlcnZpY2VzKEBwYWNrYWdlTWFuYWdlcilcblxuICAgICMgT25lIGNhbm5vdCBzaW1wbHkgLmJpbmQgaGVyZSBzaW5jZSBpdCBjb3VsZCBiZSB1c2VkIGFzIGEgY29tcG9uZW50IHdpdGhcbiAgICAjIEV0Y2gsIGluIHdoaWNoIGNhc2UgaXQnZCBiZSBgbmV3YGQuIEFuZCB3aGVuIGl0J3MgYG5ld2BkLCBgdGhpc2AgaXMgYWx3YXlzXG4gICAgIyB0aGUgbmV3bHkgY3JlYXRlZCBvYmplY3QuXG4gICAgcmVhbFRoaXMgPSB0aGlzXG4gICAgQGJ1aWxkVGV4dEVkaXRvciA9IC0+IFdvcmtzcGFjZS5wcm90b3R5cGUuYnVpbGRUZXh0RWRpdG9yLmFwcGx5KHJlYWxUaGlzLCBhcmd1bWVudHMpXG5cbiAgICBAcGFuZWxDb250YWluZXJzID1cbiAgICAgIHRvcDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ3RvcCd9KVxuICAgICAgbGVmdDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2xlZnQnfSlcbiAgICAgIHJpZ2h0OiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAncmlnaHQnfSlcbiAgICAgIGJvdHRvbTogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2JvdHRvbSd9KVxuICAgICAgaGVhZGVyOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnaGVhZGVyJ30pXG4gICAgICBmb290ZXI6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdmb290ZXInfSlcbiAgICAgIG1vZGFsOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnbW9kYWwnfSlcblxuICAgIEBzdWJzY3JpYmVUb0V2ZW50cygpXG5cbiAgcmVzZXQ6IChAcGFja2FnZU1hbmFnZXIpIC0+XG4gICAgQGVtaXR0ZXIuZGlzcG9zZSgpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQHBhbmVDb250YWluZXIuZGVzdHJveSgpXG4gICAgcGFuZWxDb250YWluZXIuZGVzdHJveSgpIGZvciBwYW5lbENvbnRhaW5lciBpbiBAcGFuZWxDb250YWluZXJzXG5cbiAgICBAcGFuZUNvbnRhaW5lciA9IG5ldyBQYW5lQ29udGFpbmVyKHtAY29uZmlnLCBAYXBwbGljYXRpb25EZWxlZ2F0ZSwgQG5vdGlmaWNhdGlvbk1hbmFnZXIsIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyfSlcbiAgICBAcGFuZUNvbnRhaW5lci5vbkRpZERlc3Ryb3lQYW5lSXRlbShAZGlkRGVzdHJveVBhbmVJdGVtKVxuXG4gICAgQHBhbmVsQ29udGFpbmVycyA9XG4gICAgICB0b3A6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICd0b3AnfSlcbiAgICAgIGxlZnQ6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdsZWZ0J30pXG4gICAgICByaWdodDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ3JpZ2h0J30pXG4gICAgICBib3R0b206IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdib3R0b20nfSlcbiAgICAgIGhlYWRlcjogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2hlYWRlcid9KVxuICAgICAgZm9vdGVyOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnZm9vdGVyJ30pXG4gICAgICBtb2RhbDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ21vZGFsJ30pXG5cbiAgICBAb3JpZ2luYWxGb250U2l6ZSA9IG51bGxcbiAgICBAb3BlbmVycyA9IFtdXG4gICAgQGRlc3Ryb3llZEl0ZW1VUklzID0gW11cbiAgICBAY29uc3VtZVNlcnZpY2VzKEBwYWNrYWdlTWFuYWdlcilcblxuICBzdWJzY3JpYmVUb0V2ZW50czogLT5cbiAgICBAc3Vic2NyaWJlVG9BY3RpdmVJdGVtKClcbiAgICBAc3Vic2NyaWJlVG9Gb250U2l6ZSgpXG4gICAgQHN1YnNjcmliZVRvQWRkZWRJdGVtcygpXG5cbiAgY29uc3VtZVNlcnZpY2VzOiAoe3NlcnZpY2VIdWJ9KSAtPlxuICAgIEBkaXJlY3RvcnlTZWFyY2hlcnMgPSBbXVxuICAgIHNlcnZpY2VIdWIuY29uc3VtZShcbiAgICAgICdhdG9tLmRpcmVjdG9yeS1zZWFyY2hlcicsXG4gICAgICAnXjAuMS4wJyxcbiAgICAgIChwcm92aWRlcikgPT4gQGRpcmVjdG9yeVNlYXJjaGVycy51bnNoaWZ0KHByb3ZpZGVyKSlcblxuICAjIENhbGxlZCBieSB0aGUgU2VyaWFsaXphYmxlIG1peGluIGR1cmluZyBzZXJpYWxpemF0aW9uLlxuICBzZXJpYWxpemU6IC0+XG4gICAgZGVzZXJpYWxpemVyOiAnV29ya3NwYWNlJ1xuICAgIHBhbmVDb250YWluZXI6IEBwYW5lQ29udGFpbmVyLnNlcmlhbGl6ZSgpXG4gICAgcGFja2FnZXNXaXRoQWN0aXZlR3JhbW1hcnM6IEBnZXRQYWNrYWdlTmFtZXNXaXRoQWN0aXZlR3JhbW1hcnMoKVxuICAgIGRlc3Ryb3llZEl0ZW1VUklzOiBAZGVzdHJveWVkSXRlbVVSSXMuc2xpY2UoKVxuXG4gIGRlc2VyaWFsaXplOiAoc3RhdGUsIGRlc2VyaWFsaXplck1hbmFnZXIpIC0+XG4gICAgZm9yIHBhY2thZ2VOYW1lIGluIHN0YXRlLnBhY2thZ2VzV2l0aEFjdGl2ZUdyYW1tYXJzID8gW11cbiAgICAgIEBwYWNrYWdlTWFuYWdlci5nZXRMb2FkZWRQYWNrYWdlKHBhY2thZ2VOYW1lKT8ubG9hZEdyYW1tYXJzU3luYygpXG4gICAgaWYgc3RhdGUuZGVzdHJveWVkSXRlbVVSSXM/XG4gICAgICBAZGVzdHJveWVkSXRlbVVSSXMgPSBzdGF0ZS5kZXN0cm95ZWRJdGVtVVJJc1xuICAgIEBwYW5lQ29udGFpbmVyLmRlc2VyaWFsaXplKHN0YXRlLnBhbmVDb250YWluZXIsIGRlc2VyaWFsaXplck1hbmFnZXIpXG5cbiAgZ2V0UGFja2FnZU5hbWVzV2l0aEFjdGl2ZUdyYW1tYXJzOiAtPlxuICAgIHBhY2thZ2VOYW1lcyA9IFtdXG4gICAgYWRkR3JhbW1hciA9ICh7aW5jbHVkZWRHcmFtbWFyU2NvcGVzLCBwYWNrYWdlTmFtZX09e30pID0+XG4gICAgICByZXR1cm4gdW5sZXNzIHBhY2thZ2VOYW1lXG4gICAgICAjIFByZXZlbnQgY3ljbGVzXG4gICAgICByZXR1cm4gaWYgcGFja2FnZU5hbWVzLmluZGV4T2YocGFja2FnZU5hbWUpIGlzbnQgLTFcblxuICAgICAgcGFja2FnZU5hbWVzLnB1c2gocGFja2FnZU5hbWUpXG4gICAgICBmb3Igc2NvcGVOYW1lIGluIGluY2x1ZGVkR3JhbW1hclNjb3BlcyA/IFtdXG4gICAgICAgIGFkZEdyYW1tYXIoQGdyYW1tYXJSZWdpc3RyeS5ncmFtbWFyRm9yU2NvcGVOYW1lKHNjb3BlTmFtZSkpXG4gICAgICByZXR1cm5cblxuICAgIGVkaXRvcnMgPSBAZ2V0VGV4dEVkaXRvcnMoKVxuICAgIGFkZEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSkgZm9yIGVkaXRvciBpbiBlZGl0b3JzXG5cbiAgICBpZiBlZGl0b3JzLmxlbmd0aCA+IDBcbiAgICAgIGZvciBncmFtbWFyIGluIEBncmFtbWFyUmVnaXN0cnkuZ2V0R3JhbW1hcnMoKSB3aGVuIGdyYW1tYXIuaW5qZWN0aW9uU2VsZWN0b3JcbiAgICAgICAgYWRkR3JhbW1hcihncmFtbWFyKVxuXG4gICAgXy51bmlxKHBhY2thZ2VOYW1lcylcblxuICBzdWJzY3JpYmVUb0FjdGl2ZUl0ZW06IC0+XG4gICAgQHVwZGF0ZVdpbmRvd1RpdGxlKClcbiAgICBAdXBkYXRlRG9jdW1lbnRFZGl0ZWQoKVxuICAgIEBwcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMgQHVwZGF0ZVdpbmRvd1RpdGxlXG5cbiAgICBAb2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtIChpdGVtKSA9PlxuICAgICAgQHVwZGF0ZVdpbmRvd1RpdGxlKClcbiAgICAgIEB1cGRhdGVEb2N1bWVudEVkaXRlZCgpXG5cbiAgICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgICBpZiB0eXBlb2YgaXRlbT8ub25EaWRDaGFuZ2VUaXRsZSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIHRpdGxlU3Vic2NyaXB0aW9uID0gaXRlbS5vbkRpZENoYW5nZVRpdGxlKEB1cGRhdGVXaW5kb3dUaXRsZSlcbiAgICAgIGVsc2UgaWYgdHlwZW9mIGl0ZW0/Lm9uIGlzICdmdW5jdGlvbidcbiAgICAgICAgdGl0bGVTdWJzY3JpcHRpb24gPSBpdGVtLm9uKCd0aXRsZS1jaGFuZ2VkJywgQHVwZGF0ZVdpbmRvd1RpdGxlKVxuICAgICAgICB1bmxlc3MgdHlwZW9mIHRpdGxlU3Vic2NyaXB0aW9uPy5kaXNwb3NlIGlzICdmdW5jdGlvbidcbiAgICAgICAgICB0aXRsZVN1YnNjcmlwdGlvbiA9IG5ldyBEaXNwb3NhYmxlID0+IGl0ZW0ub2ZmKCd0aXRsZS1jaGFuZ2VkJywgQHVwZGF0ZVdpbmRvd1RpdGxlKVxuXG4gICAgICBpZiB0eXBlb2YgaXRlbT8ub25EaWRDaGFuZ2VNb2RpZmllZCBpcyAnZnVuY3Rpb24nXG4gICAgICAgIG1vZGlmaWVkU3Vic2NyaXB0aW9uID0gaXRlbS5vbkRpZENoYW5nZU1vZGlmaWVkKEB1cGRhdGVEb2N1bWVudEVkaXRlZClcbiAgICAgIGVsc2UgaWYgdHlwZW9mIGl0ZW0/Lm9uPyBpcyAnZnVuY3Rpb24nXG4gICAgICAgIG1vZGlmaWVkU3Vic2NyaXB0aW9uID0gaXRlbS5vbignbW9kaWZpZWQtc3RhdHVzLWNoYW5nZWQnLCBAdXBkYXRlRG9jdW1lbnRFZGl0ZWQpXG4gICAgICAgIHVubGVzcyB0eXBlb2YgbW9kaWZpZWRTdWJzY3JpcHRpb24/LmRpc3Bvc2UgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG1vZGlmaWVkU3Vic2NyaXB0aW9uID0gbmV3IERpc3Bvc2FibGUgPT4gaXRlbS5vZmYoJ21vZGlmaWVkLXN0YXR1cy1jaGFuZ2VkJywgQHVwZGF0ZURvY3VtZW50RWRpdGVkKVxuXG4gICAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbnMuYWRkKHRpdGxlU3Vic2NyaXB0aW9uKSBpZiB0aXRsZVN1YnNjcmlwdGlvbj9cbiAgICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9ucy5hZGQobW9kaWZpZWRTdWJzY3JpcHRpb24pIGlmIG1vZGlmaWVkU3Vic2NyaXB0aW9uP1xuXG4gIHN1YnNjcmliZVRvQWRkZWRJdGVtczogLT5cbiAgICBAb25EaWRBZGRQYW5lSXRlbSAoe2l0ZW0sIHBhbmUsIGluZGV4fSkgPT5cbiAgICAgIGlmIGl0ZW0gaW5zdGFuY2VvZiBUZXh0RWRpdG9yXG4gICAgICAgIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZShcbiAgICAgICAgICBAdGV4dEVkaXRvclJlZ2lzdHJ5LmFkZChpdGVtKVxuICAgICAgICAgIEB0ZXh0RWRpdG9yUmVnaXN0cnkubWFpbnRhaW5HcmFtbWFyKGl0ZW0pXG4gICAgICAgICAgQHRleHRFZGl0b3JSZWdpc3RyeS5tYWludGFpbkNvbmZpZyhpdGVtKVxuICAgICAgICAgIGl0ZW0ub2JzZXJ2ZUdyYW1tYXIoQGhhbmRsZUdyYW1tYXJVc2VkLmJpbmQodGhpcykpXG4gICAgICAgIClcbiAgICAgICAgaXRlbS5vbkRpZERlc3Ryb3kgLT4gc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFkZC10ZXh0LWVkaXRvcicsIHt0ZXh0RWRpdG9yOiBpdGVtLCBwYW5lLCBpbmRleH1cblxuICAjIFVwZGF0ZXMgdGhlIGFwcGxpY2F0aW9uJ3MgdGl0bGUgYW5kIHByb3h5IGljb24gYmFzZWQgb24gd2hpY2hldmVyIGZpbGUgaXNcbiAgIyBvcGVuLlxuICB1cGRhdGVXaW5kb3dUaXRsZTogPT5cbiAgICBhcHBOYW1lID0gJ0F0b20nXG4gICAgcHJvamVjdFBhdGhzID0gQHByb2plY3QuZ2V0UGF0aHMoKSA/IFtdXG4gICAgaWYgaXRlbSA9IEBnZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgICBpdGVtUGF0aCA9IGl0ZW0uZ2V0UGF0aD8oKVxuICAgICAgaXRlbVRpdGxlID0gaXRlbS5nZXRMb25nVGl0bGU/KCkgPyBpdGVtLmdldFRpdGxlPygpXG4gICAgICBwcm9qZWN0UGF0aCA9IF8uZmluZCBwcm9qZWN0UGF0aHMsIChwcm9qZWN0UGF0aCkgLT5cbiAgICAgICAgaXRlbVBhdGggaXMgcHJvamVjdFBhdGggb3IgaXRlbVBhdGg/LnN0YXJ0c1dpdGgocHJvamVjdFBhdGggKyBwYXRoLnNlcClcbiAgICBpdGVtVGl0bGUgPz0gXCJ1bnRpdGxlZFwiXG4gICAgcHJvamVjdFBhdGggPz0gcHJvamVjdFBhdGhzWzBdXG4gICAgaWYgcHJvamVjdFBhdGg/XG4gICAgICBwcm9qZWN0UGF0aCA9IGZzLnRpbGRpZnkocHJvamVjdFBhdGgpXG5cbiAgICB0aXRsZVBhcnRzID0gW11cbiAgICBpZiBpdGVtPyBhbmQgcHJvamVjdFBhdGg/XG4gICAgICB0aXRsZVBhcnRzLnB1c2ggaXRlbVRpdGxlLCBwcm9qZWN0UGF0aFxuICAgICAgcmVwcmVzZW50ZWRQYXRoID0gaXRlbVBhdGggPyBwcm9qZWN0UGF0aFxuICAgIGVsc2UgaWYgcHJvamVjdFBhdGg/XG4gICAgICB0aXRsZVBhcnRzLnB1c2ggcHJvamVjdFBhdGhcbiAgICAgIHJlcHJlc2VudGVkUGF0aCA9IHByb2plY3RQYXRoXG4gICAgZWxzZVxuICAgICAgdGl0bGVQYXJ0cy5wdXNoIGl0ZW1UaXRsZVxuICAgICAgcmVwcmVzZW50ZWRQYXRoID0gXCJcIlxuXG4gICAgdW5sZXNzIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcbiAgICAgIHRpdGxlUGFydHMucHVzaCBhcHBOYW1lXG5cbiAgICBkb2N1bWVudC50aXRsZSA9IHRpdGxlUGFydHMuam9pbihcIiBcXHUyMDE0IFwiKVxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFJlcHJlc2VudGVkRmlsZW5hbWUocmVwcmVzZW50ZWRQYXRoKVxuXG4gICMgT24gbWFjT1MsIGZhZGVzIHRoZSBhcHBsaWNhdGlvbiB3aW5kb3cncyBwcm94eSBpY29uIHdoZW4gdGhlIGN1cnJlbnQgZmlsZVxuICAjIGhhcyBiZWVuIG1vZGlmaWVkLlxuICB1cGRhdGVEb2N1bWVudEVkaXRlZDogPT5cbiAgICBtb2RpZmllZCA9IEBnZXRBY3RpdmVQYW5lSXRlbSgpPy5pc01vZGlmaWVkPygpID8gZmFsc2VcbiAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zZXRXaW5kb3dEb2N1bWVudEVkaXRlZChtb2RpZmllZClcblxuICAjIyNcbiAgU2VjdGlvbjogRXZlbnQgU3Vic2NyaXB0aW9uXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggYWxsIGN1cnJlbnQgYW5kIGZ1dHVyZSB0ZXh0XG4gICMgZWRpdG9ycyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggY3VycmVudCBhbmQgZnV0dXJlIHRleHQgZWRpdG9ycy5cbiAgIyAgICogYGVkaXRvcmAgQW4ge1RleHRFZGl0b3J9IHRoYXQgaXMgcHJlc2VudCBpbiB7OjpnZXRUZXh0RWRpdG9yc30gYXQgdGhlIHRpbWVcbiAgIyAgICAgb2Ygc3Vic2NyaXB0aW9uIG9yIHRoYXQgaXMgYWRkZWQgYXQgc29tZSBsYXRlciB0aW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZVRleHRFZGl0b3JzOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sodGV4dEVkaXRvcikgZm9yIHRleHRFZGl0b3IgaW4gQGdldFRleHRFZGl0b3JzKClcbiAgICBAb25EaWRBZGRUZXh0RWRpdG9yICh7dGV4dEVkaXRvcn0pIC0+IGNhbGxiYWNrKHRleHRFZGl0b3IpXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCBhbGwgY3VycmVudCBhbmQgZnV0dXJlIHBhbmVzIGl0ZW1zXG4gICMgaW4gdGhlIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aXRoIGN1cnJlbnQgYW5kIGZ1dHVyZSBwYW5lIGl0ZW1zLlxuICAjICAgKiBgaXRlbWAgQW4gaXRlbSB0aGF0IGlzIHByZXNlbnQgaW4gezo6Z2V0UGFuZUl0ZW1zfSBhdCB0aGUgdGltZSBvZlxuICAjICAgICAgc3Vic2NyaXB0aW9uIG9yIHRoYXQgaXMgYWRkZWQgYXQgc29tZSBsYXRlciB0aW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZVBhbmVJdGVtczogKGNhbGxiYWNrKSAtPiBAcGFuZUNvbnRhaW5lci5vYnNlcnZlUGFuZUl0ZW1zKGNhbGxiYWNrKVxuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGl0ZW0gY2hhbmdlcy5cbiAgI1xuICAjIEJlY2F1c2Ugb2JzZXJ2ZXJzIGFyZSBpbnZva2VkIHN5bmNocm9ub3VzbHksIGl0J3MgaW1wb3J0YW50IG5vdCB0byBwZXJmb3JtXG4gICMgYW55IGV4cGVuc2l2ZSBvcGVyYXRpb25zIHZpYSB0aGlzIG1ldGhvZC4gQ29uc2lkZXJcbiAgIyB7OjpvbkRpZFN0b3BDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtfSB0byBkZWxheSBvcGVyYXRpb25zIHVudGlsIGFmdGVyIGNoYW5nZXNcbiAgIyBzdG9wIG9jY3VycmluZy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBhY3RpdmUgcGFuZSBpdGVtIGNoYW5nZXMuXG4gICMgICAqIGBpdGVtYCBUaGUgYWN0aXZlIHBhbmUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW06IChjYWxsYmFjaykgLT5cbiAgICBAcGFuZUNvbnRhaW5lci5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtKGNhbGxiYWNrKVxuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGl0ZW0gc3RvcHNcbiAgIyBjaGFuZ2luZy5cbiAgI1xuICAjIE9ic2VydmVycyBhcmUgY2FsbGVkIGFzeW5jaHJvbm91c2x5IDEwMG1zIGFmdGVyIHRoZSBsYXN0IGFjdGl2ZSBwYW5lIGl0ZW1cbiAgIyBjaGFuZ2UuIEhhbmRsaW5nIGNoYW5nZXMgaGVyZSByYXRoZXIgdGhhbiBpbiB0aGUgc3luY2hyb25vdXNcbiAgIyB7OjpvbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtfSBwcmV2ZW50cyB1bm5lZWRlZCB3b3JrIGlmIHRoZSB1c2VyIGlzIHF1aWNrbHlcbiAgIyBjaGFuZ2luZyBvciBjbG9zaW5nIHRhYnMgYW5kIGVuc3VyZXMgY3JpdGljYWwgVUkgZmVlZGJhY2ssIGxpa2UgY2hhbmdpbmcgdGhlXG4gICMgaGlnaGxpZ2h0ZWQgdGFiLCBnZXRzIHByaW9yaXR5IG92ZXIgd29yayB0aGF0IGNhbiBiZSBkb25lIGFzeW5jaHJvbm91c2x5LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGl0ZW0gc3RvcHRzXG4gICMgICBjaGFuZ2luZy5cbiAgIyAgICogYGl0ZW1gIFRoZSBhY3RpdmUgcGFuZSBpdGVtLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRTdG9wQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIEBwYW5lQ29udGFpbmVyLm9uRGlkU3RvcENoYW5naW5nQWN0aXZlUGFuZUl0ZW0oY2FsbGJhY2spXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCB0aGUgY3VycmVudCBhY3RpdmUgcGFuZSBpdGVtIGFuZFxuICAjIHdpdGggYWxsIGZ1dHVyZSBhY3RpdmUgcGFuZSBpdGVtcyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGl0ZW0gY2hhbmdlcy5cbiAgIyAgICogYGl0ZW1gIFRoZSBjdXJyZW50IGFjdGl2ZSBwYW5lIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlQWN0aXZlUGFuZUl0ZW06IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKGNhbGxiYWNrKVxuXG4gICMgRXNzZW50aWFsOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW5ldmVyIGFuIGl0ZW0gaXMgb3BlbmVkLiBVbmxpa2VcbiAgIyB7OjpvbkRpZEFkZFBhbmVJdGVtfSwgb2JzZXJ2ZXJzIHdpbGwgYmUgbm90aWZpZWQgZm9yIGl0ZW1zIHRoYXQgYXJlIGFscmVhZHlcbiAgIyBwcmVzZW50IGluIHRoZSB3b3Jrc3BhY2Ugd2hlbiB0aGV5IGFyZSByZW9wZW5lZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuZXZlciBhbiBpdGVtIGlzIG9wZW5lZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgdXJpYCB7U3RyaW5nfSByZXByZXNlbnRpbmcgdGhlIG9wZW5lZCBVUkkuIENvdWxkIGJlIGB1bmRlZmluZWRgLlxuICAjICAgICAqIGBpdGVtYCBUaGUgb3BlbmVkIGl0ZW0uXG4gICMgICAgICogYHBhbmVgIFRoZSBwYW5lIGluIHdoaWNoIHRoZSBpdGVtIHdhcyBvcGVuZWQuXG4gICMgICAgICogYGluZGV4YCBUaGUgaW5kZXggb2YgdGhlIG9wZW5lZCBpdGVtIG9uIGl0cyBwYW5lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRPcGVuOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1vcGVuJywgY2FsbGJhY2tcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYW5lIGlzIGFkZGVkIHRvIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgcGFuZXMgYXJlIGFkZGVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGBwYW5lYCBUaGUgYWRkZWQgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWRkUGFuZTogKGNhbGxiYWNrKSAtPiBAcGFuZUNvbnRhaW5lci5vbkRpZEFkZFBhbmUoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayBiZWZvcmUgYSBwYW5lIGlzIGRlc3Ryb3llZCBpbiB0aGVcbiAgIyB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgYmVmb3JlIHBhbmVzIGFyZSBkZXN0cm95ZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYHBhbmVgIFRoZSBwYW5lIHRvIGJlIGRlc3Ryb3llZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uV2lsbERlc3Ryb3lQYW5lOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uV2lsbERlc3Ryb3lQYW5lKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhbmUgaXMgZGVzdHJveWVkIGluIHRoZVxuICAjIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBwYW5lcyBhcmUgZGVzdHJveWVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGBwYW5lYCBUaGUgZGVzdHJveWVkIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZERlc3Ryb3lQYW5lOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uRGlkRGVzdHJveVBhbmUoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aXRoIGFsbCBjdXJyZW50IGFuZCBmdXR1cmUgcGFuZXMgaW4gdGhlXG4gICMgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggY3VycmVudCBhbmQgZnV0dXJlIHBhbmVzLlxuICAjICAgKiBgcGFuZWAgQSB7UGFuZX0gdGhhdCBpcyBwcmVzZW50IGluIHs6OmdldFBhbmVzfSBhdCB0aGUgdGltZSBvZlxuICAjICAgICAgc3Vic2NyaXB0aW9uIG9yIHRoYXQgaXMgYWRkZWQgYXQgc29tZSBsYXRlciB0aW1lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZVBhbmVzOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9ic2VydmVQYW5lcyhjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGNoYW5nZXMuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYWN0aXZlIHBhbmUgY2hhbmdlcy5cbiAgIyAgICogYHBhbmVgIEEge1BhbmV9IHRoYXQgaXMgdGhlIGN1cnJlbnQgcmV0dXJuIHZhbHVlIG9mIHs6OmdldEFjdGl2ZVBhbmV9LlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VBY3RpdmVQYW5lOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZShjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggdGhlIGN1cnJlbnQgYWN0aXZlIHBhbmUgYW5kIHdoZW5cbiAgIyB0aGUgYWN0aXZlIHBhbmUgY2hhbmdlcy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBjdXJyZW50IGFuZCBmdXR1cmUgYWN0aXZlI1xuICAjICAgcGFuZXMuXG4gICMgICAqIGBwYW5lYCBBIHtQYW5lfSB0aGF0IGlzIHRoZSBjdXJyZW50IHJldHVybiB2YWx1ZSBvZiB7OjpnZXRBY3RpdmVQYW5lfS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVBY3RpdmVQYW5lOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9ic2VydmVBY3RpdmVQYW5lKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhbmUgaXRlbSBpcyBhZGRlZCB0byB0aGVcbiAgIyB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiBwYW5lIGl0ZW1zIGFyZSBhZGRlZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIGFkZGVkIHBhbmUgaXRlbS5cbiAgIyAgICAgKiBgcGFuZWAge1BhbmV9IGNvbnRhaW5pbmcgdGhlIGFkZGVkIGl0ZW0uXG4gICMgICAgICogYGluZGV4YCB7TnVtYmVyfSBpbmRpY2F0aW5nIHRoZSBpbmRleCBvZiB0aGUgYWRkZWQgaXRlbSBpbiBpdHMgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWRkUGFuZUl0ZW06IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25EaWRBZGRQYW5lSXRlbShjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYW5lIGl0ZW0gaXMgYWJvdXQgdG8gYmVcbiAgIyBkZXN0cm95ZWQsIGJlZm9yZSB0aGUgdXNlciBpcyBwcm9tcHRlZCB0byBzYXZlIGl0LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIGJlZm9yZSBwYW5lIGl0ZW1zIGFyZSBkZXN0cm95ZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYGl0ZW1gIFRoZSBpdGVtIHRvIGJlIGRlc3Ryb3llZC5cbiAgIyAgICAgKiBgcGFuZWAge1BhbmV9IGNvbnRhaW5pbmcgdGhlIGl0ZW0gdG8gYmUgZGVzdHJveWVkLlxuICAjICAgICAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB0aGUgaW5kZXggb2YgdGhlIGl0ZW0gdG8gYmUgZGVzdHJveWVkIGluXG4gICMgICAgICAgaXRzIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25XaWxsRGVzdHJveVBhbmVJdGVtOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uV2lsbERlc3Ryb3lQYW5lSXRlbShjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYSBwYW5lIGl0ZW0gaXMgZGVzdHJveWVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gcGFuZSBpdGVtcyBhcmUgZGVzdHJveWVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGBpdGVtYCBUaGUgZGVzdHJveWVkIGl0ZW0uXG4gICMgICAgICogYHBhbmVgIHtQYW5lfSBjb250YWluaW5nIHRoZSBkZXN0cm95ZWQgaXRlbS5cbiAgIyAgICAgKiBgaW5kZXhgIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhlIGluZGV4IG9mIHRoZSBkZXN0cm95ZWQgaXRlbSBpbiBpdHNcbiAgIyAgICAgICBwYW5lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2VgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveVBhbmVJdGVtOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uRGlkRGVzdHJveVBhbmVJdGVtKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHRleHQgZWRpdG9yIGlzIGFkZGVkIHRvIHRoZVxuICAjIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBwYW5lcyBhcmUgYWRkZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYHRleHRFZGl0b3JgIHtUZXh0RWRpdG9yfSB0aGF0IHdhcyBhZGRlZC5cbiAgIyAgICAgKiBgcGFuZWAge1BhbmV9IGNvbnRhaW5pbmcgdGhlIGFkZGVkIHRleHQgZWRpdG9yLlxuICAjICAgICAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB0aGUgaW5kZXggb2YgdGhlIGFkZGVkIHRleHQgZWRpdG9yIGluIGl0c1xuICAjICAgICAgICBwYW5lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBZGRUZXh0RWRpdG9yOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hZGQtdGV4dC1lZGl0b3InLCBjYWxsYmFja1xuXG4gICMjI1xuICBTZWN0aW9uOiBPcGVuaW5nXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBPcGVucyB0aGUgZ2l2ZW4gVVJJIGluIEF0b20gYXN5bmNocm9ub3VzbHkuXG4gICMgSWYgdGhlIFVSSSBpcyBhbHJlYWR5IG9wZW4sIHRoZSBleGlzdGluZyBpdGVtIGZvciB0aGF0IFVSSSB3aWxsIGJlXG4gICMgYWN0aXZhdGVkLiBJZiBubyBVUkkgaXMgZ2l2ZW4sIG9yIG5vIHJlZ2lzdGVyZWQgb3BlbmVyIGNhbiBvcGVuXG4gICMgdGhlIFVSSSwgYSBuZXcgZW1wdHkge1RleHRFZGl0b3J9IHdpbGwgYmUgY3JlYXRlZC5cbiAgI1xuICAjICogYHVyaWAgKG9wdGlvbmFsKSBBIHtTdHJpbmd9IGNvbnRhaW5pbmcgYSBVUkkuXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fVxuICAjICAgKiBgaW5pdGlhbExpbmVgIEEge051bWJlcn0gaW5kaWNhdGluZyB3aGljaCByb3cgdG8gbW92ZSB0aGUgY3Vyc29yIHRvXG4gICMgICAgIGluaXRpYWxseS4gRGVmYXVsdHMgdG8gYDBgLlxuICAjICAgKiBgaW5pdGlhbENvbHVtbmAgQSB7TnVtYmVyfSBpbmRpY2F0aW5nIHdoaWNoIGNvbHVtbiB0byBtb3ZlIHRoZSBjdXJzb3IgdG9cbiAgIyAgICAgaW5pdGlhbGx5LiBEZWZhdWx0cyB0byBgMGAuXG4gICMgICAqIGBzcGxpdGAgRWl0aGVyICdsZWZ0JywgJ3JpZ2h0JywgJ3VwJyBvciAnZG93bicuXG4gICMgICAgIElmICdsZWZ0JywgdGhlIGl0ZW0gd2lsbCBiZSBvcGVuZWQgaW4gbGVmdG1vc3QgcGFuZSBvZiB0aGUgY3VycmVudCBhY3RpdmUgcGFuZSdzIHJvdy5cbiAgIyAgICAgSWYgJ3JpZ2h0JywgdGhlIGl0ZW0gd2lsbCBiZSBvcGVuZWQgaW4gdGhlIHJpZ2h0bW9zdCBwYW5lIG9mIHRoZSBjdXJyZW50IGFjdGl2ZSBwYW5lJ3Mgcm93LiBJZiBvbmx5IG9uZSBwYW5lIGV4aXN0cyBpbiB0aGUgcm93LCBhIG5ldyBwYW5lIHdpbGwgYmUgY3JlYXRlZC5cbiAgIyAgICAgSWYgJ3VwJywgdGhlIGl0ZW0gd2lsbCBiZSBvcGVuZWQgaW4gdG9wbW9zdCBwYW5lIG9mIHRoZSBjdXJyZW50IGFjdGl2ZSBwYW5lJ3MgY29sdW1uLlxuICAjICAgICBJZiAnZG93bicsIHRoZSBpdGVtIHdpbGwgYmUgb3BlbmVkIGluIHRoZSBib3R0b21tb3N0IHBhbmUgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIHBhbmUncyBjb2x1bW4uIElmIG9ubHkgb25lIHBhbmUgZXhpc3RzIGluIHRoZSBjb2x1bW4sIGEgbmV3IHBhbmUgd2lsbCBiZSBjcmVhdGVkLlxuICAjICAgKiBgYWN0aXZhdGVQYW5lYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY2FsbCB7UGFuZTo6YWN0aXZhdGV9IG9uXG4gICMgICAgIGNvbnRhaW5pbmcgcGFuZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAjICAgKiBgYWN0aXZhdGVJdGVtYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY2FsbCB7UGFuZTo6YWN0aXZhdGVJdGVtfVxuICAjICAgICBvbiBjb250YWluaW5nIHBhbmUuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgIyAgICogYHBlbmRpbmdgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciBvciBub3QgdGhlIGl0ZW0gc2hvdWxkIGJlIG9wZW5lZFxuICAjICAgICBpbiBhIHBlbmRpbmcgc3RhdGUuIEV4aXN0aW5nIHBlbmRpbmcgaXRlbXMgaW4gYSBwYW5lIGFyZSByZXBsYWNlZCB3aXRoXG4gICMgICAgIG5ldyBwZW5kaW5nIGl0ZW1zIHdoZW4gdGhleSBhcmUgb3BlbmVkLlxuICAjICAgKiBgc2VhcmNoQWxsUGFuZXNgIEEge0Jvb2xlYW59LiBJZiBgdHJ1ZWAsIHRoZSB3b3Jrc3BhY2Ugd2lsbCBhdHRlbXB0IHRvXG4gICMgICAgIGFjdGl2YXRlIGFuIGV4aXN0aW5nIGl0ZW0gZm9yIHRoZSBnaXZlbiBVUkkgb24gYW55IHBhbmUuXG4gICMgICAgIElmIGBmYWxzZWAsIG9ubHkgdGhlIGFjdGl2ZSBwYW5lIHdpbGwgYmUgc2VhcmNoZWQgZm9yXG4gICMgICAgIGFuIGV4aXN0aW5nIGl0ZW0gZm9yIHRoZSBzYW1lIFVSSS4gRGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAgI1xuICAjIFJldHVybnMgYSB7UHJvbWlzZX0gdGhhdCByZXNvbHZlcyB0byB0aGUge1RleHRFZGl0b3J9IGZvciB0aGUgZmlsZSBVUkkuXG4gIG9wZW46ICh1cmksIG9wdGlvbnM9e30pIC0+XG4gICAgc2VhcmNoQWxsUGFuZXMgPSBvcHRpb25zLnNlYXJjaEFsbFBhbmVzXG4gICAgc3BsaXQgPSBvcHRpb25zLnNwbGl0XG4gICAgdXJpID0gQHByb2plY3QucmVzb2x2ZVBhdGgodXJpKVxuXG4gICAgaWYgbm90IGF0b20uY29uZmlnLmdldCgnY29yZS5hbGxvd1BlbmRpbmdQYW5lSXRlbXMnKVxuICAgICAgb3B0aW9ucy5wZW5kaW5nID0gZmFsc2VcblxuICAgICMgQXZvaWQgYWRkaW5nIFVSTHMgYXMgcmVjZW50IGRvY3VtZW50cyB0byB3b3JrLWFyb3VuZCB0aGlzIFNwb3RsaWdodCBjcmFzaDpcbiAgICAjIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzEwMDcxXG4gICAgaWYgdXJpPyBhbmQgKG5vdCB1cmwucGFyc2UodXJpKS5wcm90b2NvbD8gb3IgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInKVxuICAgICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuYWRkUmVjZW50RG9jdW1lbnQodXJpKVxuXG4gICAgcGFuZSA9IEBwYW5lQ29udGFpbmVyLnBhbmVGb3JVUkkodXJpKSBpZiBzZWFyY2hBbGxQYW5lc1xuICAgIHBhbmUgPz0gc3dpdGNoIHNwbGl0XG4gICAgICB3aGVuICdsZWZ0J1xuICAgICAgICBAZ2V0QWN0aXZlUGFuZSgpLmZpbmRMZWZ0bW9zdFNpYmxpbmcoKVxuICAgICAgd2hlbiAncmlnaHQnXG4gICAgICAgIEBnZXRBY3RpdmVQYW5lKCkuZmluZE9yQ3JlYXRlUmlnaHRtb3N0U2libGluZygpXG4gICAgICB3aGVuICd1cCdcbiAgICAgICAgQGdldEFjdGl2ZVBhbmUoKS5maW5kVG9wbW9zdFNpYmxpbmcoKVxuICAgICAgd2hlbiAnZG93bidcbiAgICAgICAgQGdldEFjdGl2ZVBhbmUoKS5maW5kT3JDcmVhdGVCb3R0b21tb3N0U2libGluZygpXG4gICAgICBlbHNlXG4gICAgICAgIEBnZXRBY3RpdmVQYW5lKClcblxuICAgIEBvcGVuVVJJSW5QYW5lKHVyaSwgcGFuZSwgb3B0aW9ucylcblxuICAjIE9wZW4gQXRvbSdzIGxpY2Vuc2UgaW4gdGhlIGFjdGl2ZSBwYW5lLlxuICBvcGVuTGljZW5zZTogLT5cbiAgICBAb3BlbihwYXRoLmpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCAnTElDRU5TRS5tZCcpKVxuXG4gICMgU3luY2hyb25vdXNseSBvcGVuIHRoZSBnaXZlbiBVUkkgaW4gdGhlIGFjdGl2ZSBwYW5lLiAqKk9ubHkgdXNlIHRoaXMgbWV0aG9kXG4gICMgaW4gc3BlY3MuIENhbGxpbmcgdGhpcyBpbiBwcm9kdWN0aW9uIGNvZGUgd2lsbCBibG9jayB0aGUgVUkgdGhyZWFkIGFuZFxuICAjIGV2ZXJ5b25lIHdpbGwgYmUgbWFkIGF0IHlvdS4qKlxuICAjXG4gICMgKiBgdXJpYCBBIHtTdHJpbmd9IGNvbnRhaW5pbmcgYSBVUkkuXG4gICMgKiBgb3B0aW9uc2AgQW4gb3B0aW9uYWwgb3B0aW9ucyB7T2JqZWN0fVxuICAjICAgKiBgaW5pdGlhbExpbmVgIEEge051bWJlcn0gaW5kaWNhdGluZyB3aGljaCByb3cgdG8gbW92ZSB0aGUgY3Vyc29yIHRvXG4gICMgICAgIGluaXRpYWxseS4gRGVmYXVsdHMgdG8gYDBgLlxuICAjICAgKiBgaW5pdGlhbENvbHVtbmAgQSB7TnVtYmVyfSBpbmRpY2F0aW5nIHdoaWNoIGNvbHVtbiB0byBtb3ZlIHRoZSBjdXJzb3IgdG9cbiAgIyAgICAgaW5pdGlhbGx5LiBEZWZhdWx0cyB0byBgMGAuXG4gICMgICAqIGBhY3RpdmF0ZVBhbmVgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjYWxsIHtQYW5lOjphY3RpdmF0ZX0gb25cbiAgIyAgICAgdGhlIGNvbnRhaW5pbmcgcGFuZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAjICAgKiBgYWN0aXZhdGVJdGVtYCBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gY2FsbCB7UGFuZTo6YWN0aXZhdGVJdGVtfVxuICAjICAgICBvbiBjb250YWluaW5nIHBhbmUuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgb3BlblN5bmM6ICh1cmk9JycsIG9wdGlvbnM9e30pIC0+XG4gICAge2luaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1ufSA9IG9wdGlvbnNcbiAgICBhY3RpdmF0ZVBhbmUgPSBvcHRpb25zLmFjdGl2YXRlUGFuZSA/IHRydWVcbiAgICBhY3RpdmF0ZUl0ZW0gPSBvcHRpb25zLmFjdGl2YXRlSXRlbSA/IHRydWVcblxuICAgIHVyaSA9IEBwcm9qZWN0LnJlc29sdmVQYXRoKHVyaSlcbiAgICBpdGVtID0gQGdldEFjdGl2ZVBhbmUoKS5pdGVtRm9yVVJJKHVyaSlcbiAgICBpZiB1cmlcbiAgICAgIGl0ZW0gPz0gb3BlbmVyKHVyaSwgb3B0aW9ucykgZm9yIG9wZW5lciBpbiBAZ2V0T3BlbmVycygpIHdoZW4gbm90IGl0ZW1cbiAgICBpdGVtID89IEBwcm9qZWN0Lm9wZW5TeW5jKHVyaSwge2luaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1ufSlcblxuICAgIEBnZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGVJdGVtKGl0ZW0pIGlmIGFjdGl2YXRlSXRlbVxuICAgIEBpdGVtT3BlbmVkKGl0ZW0pXG4gICAgQGdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpIGlmIGFjdGl2YXRlUGFuZVxuICAgIGl0ZW1cblxuICBvcGVuVVJJSW5QYW5lOiAodXJpLCBwYW5lLCBvcHRpb25zPXt9KSAtPlxuICAgIGFjdGl2YXRlUGFuZSA9IG9wdGlvbnMuYWN0aXZhdGVQYW5lID8gdHJ1ZVxuICAgIGFjdGl2YXRlSXRlbSA9IG9wdGlvbnMuYWN0aXZhdGVJdGVtID8gdHJ1ZVxuXG4gICAgaWYgdXJpP1xuICAgICAgaWYgaXRlbSA9IHBhbmUuaXRlbUZvclVSSSh1cmkpXG4gICAgICAgIHBhbmUuY2xlYXJQZW5kaW5nSXRlbSgpIGlmIG5vdCBvcHRpb25zLnBlbmRpbmcgYW5kIHBhbmUuZ2V0UGVuZGluZ0l0ZW0oKSBpcyBpdGVtXG4gICAgICBpdGVtID89IG9wZW5lcih1cmksIG9wdGlvbnMpIGZvciBvcGVuZXIgaW4gQGdldE9wZW5lcnMoKSB3aGVuIG5vdCBpdGVtXG5cbiAgICB0cnlcbiAgICAgIGl0ZW0gPz0gQG9wZW5UZXh0RmlsZSh1cmksIG9wdGlvbnMpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIHN3aXRjaCBlcnJvci5jb2RlXG4gICAgICAgIHdoZW4gJ0NBTkNFTExFRCdcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgd2hlbiAnRUFDQ0VTJ1xuICAgICAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZFdhcm5pbmcoXCJQZXJtaXNzaW9uIGRlbmllZCAnI3tlcnJvci5wYXRofSdcIilcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgd2hlbiAnRVBFUk0nLCAnRUJVU1knLCAnRU5YSU8nLCAnRUlPJywgJ0VOT1RDT05OJywgJ1VOS05PV04nLCAnRUNPTk5SRVNFVCcsICdFSU5WQUwnLCAnRU1GSUxFJywgJ0VOT1RESVInLCAnRUFHQUlOJ1xuICAgICAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZFdhcm5pbmcoXCJVbmFibGUgdG8gb3BlbiAnI3tlcnJvci5wYXRoID8gdXJpfSdcIiwgZGV0YWlsOiBlcnJvci5tZXNzYWdlKVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgZXJyb3JcblxuICAgIFByb21pc2UucmVzb2x2ZShpdGVtKVxuICAgICAgLnRoZW4gKGl0ZW0pID0+XG4gICAgICAgIHJldHVybiBpdGVtIGlmIHBhbmUuaXNEZXN0cm95ZWQoKVxuXG4gICAgICAgIEBpdGVtT3BlbmVkKGl0ZW0pXG4gICAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKGl0ZW0sIHtwZW5kaW5nOiBvcHRpb25zLnBlbmRpbmd9KSBpZiBhY3RpdmF0ZUl0ZW1cbiAgICAgICAgcGFuZS5hY3RpdmF0ZSgpIGlmIGFjdGl2YXRlUGFuZVxuXG4gICAgICAgIGluaXRpYWxMaW5lID0gaW5pdGlhbENvbHVtbiA9IDBcbiAgICAgICAgdW5sZXNzIE51bWJlci5pc05hTihvcHRpb25zLmluaXRpYWxMaW5lKVxuICAgICAgICAgIGluaXRpYWxMaW5lID0gb3B0aW9ucy5pbml0aWFsTGluZVxuICAgICAgICB1bmxlc3MgTnVtYmVyLmlzTmFOKG9wdGlvbnMuaW5pdGlhbENvbHVtbilcbiAgICAgICAgICBpbml0aWFsQ29sdW1uID0gb3B0aW9ucy5pbml0aWFsQ29sdW1uXG4gICAgICAgIGlmIGluaXRpYWxMaW5lID49IDAgb3IgaW5pdGlhbENvbHVtbiA+PSAwXG4gICAgICAgICAgaXRlbS5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbj8oW2luaXRpYWxMaW5lLCBpbml0aWFsQ29sdW1uXSlcblxuICAgICAgICBpbmRleCA9IHBhbmUuZ2V0QWN0aXZlSXRlbUluZGV4KClcbiAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLW9wZW4nLCB7dXJpLCBwYW5lLCBpdGVtLCBpbmRleH1cbiAgICAgICAgaXRlbVxuXG4gIG9wZW5UZXh0RmlsZTogKHVyaSwgb3B0aW9ucykgLT5cbiAgICBmaWxlUGF0aCA9IEBwcm9qZWN0LnJlc29sdmVQYXRoKHVyaSlcblxuICAgIGlmIGZpbGVQYXRoP1xuICAgICAgdHJ5XG4gICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhmaWxlUGF0aCwgJ3InKSlcbiAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICMgYWxsb3cgRU5PRU5UIGVycm9ycyB0byBjcmVhdGUgYW4gZWRpdG9yIGZvciBwYXRocyB0aGF0IGRvbnQgZXhpc3RcbiAgICAgICAgdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yLmNvZGUgaXMgJ0VOT0VOVCdcblxuICAgIGZpbGVTaXplID0gZnMuZ2V0U2l6ZVN5bmMoZmlsZVBhdGgpXG5cbiAgICBsYXJnZUZpbGVNb2RlID0gZmlsZVNpemUgPj0gMiAqIDEwNDg1NzYgIyAyTUJcbiAgICBpZiBmaWxlU2l6ZSA+PSBAY29uZmlnLmdldCgnY29yZS53YXJuT25MYXJnZUZpbGVMaW1pdCcpICogMTA0ODU3NiAjIDIwTUIgYnkgZGVmYXVsdFxuICAgICAgY2hvaWNlID0gQGFwcGxpY2F0aW9uRGVsZWdhdGUuY29uZmlybVxuICAgICAgICBtZXNzYWdlOiAnQXRvbSB3aWxsIGJlIHVucmVzcG9uc2l2ZSBkdXJpbmcgdGhlIGxvYWRpbmcgb2YgdmVyeSBsYXJnZSBmaWxlcy4nXG4gICAgICAgIGRldGFpbGVkTWVzc2FnZTogXCJEbyB5b3Ugc3RpbGwgd2FudCB0byBsb2FkIHRoaXMgZmlsZT9cIlxuICAgICAgICBidXR0b25zOiBbXCJQcm9jZWVkXCIsIFwiQ2FuY2VsXCJdXG4gICAgICBpZiBjaG9pY2UgaXMgMVxuICAgICAgICBlcnJvciA9IG5ldyBFcnJvclxuICAgICAgICBlcnJvci5jb2RlID0gJ0NBTkNFTExFRCdcbiAgICAgICAgdGhyb3cgZXJyb3JcblxuICAgIEBwcm9qZWN0LmJ1ZmZlckZvclBhdGgoZmlsZVBhdGgsIG9wdGlvbnMpLnRoZW4gKGJ1ZmZlcikgPT5cbiAgICAgIEB0ZXh0RWRpdG9yUmVnaXN0cnkuYnVpbGQoT2JqZWN0LmFzc2lnbih7YnVmZmVyLCBsYXJnZUZpbGVNb2RlLCBhdXRvSGVpZ2h0OiBmYWxzZX0sIG9wdGlvbnMpKVxuXG4gIGhhbmRsZUdyYW1tYXJVc2VkOiAoZ3JhbW1hcikgLT5cbiAgICByZXR1cm4gdW5sZXNzIGdyYW1tYXI/XG5cbiAgICBAcGFja2FnZU1hbmFnZXIudHJpZ2dlckFjdGl2YXRpb25Ib29rKFwiI3tncmFtbWFyLnBhY2thZ2VOYW1lfTpncmFtbWFyLXVzZWRcIilcblxuICAjIFB1YmxpYzogUmV0dXJucyBhIHtCb29sZWFufSB0aGF0IGlzIGB0cnVlYCBpZiBgb2JqZWN0YCBpcyBhIGBUZXh0RWRpdG9yYC5cbiAgI1xuICAjICogYG9iamVjdGAgQW4ge09iamVjdH0geW91IHdhbnQgdG8gcGVyZm9ybSB0aGUgY2hlY2sgYWdhaW5zdC5cbiAgaXNUZXh0RWRpdG9yOiAob2JqZWN0KSAtPlxuICAgIG9iamVjdCBpbnN0YW5jZW9mIFRleHRFZGl0b3JcblxuICAjIEV4dGVuZGVkOiBDcmVhdGUgYSBuZXcgdGV4dCBlZGl0b3IuXG4gICNcbiAgIyBSZXR1cm5zIGEge1RleHRFZGl0b3J9LlxuICBidWlsZFRleHRFZGl0b3I6IChwYXJhbXMpIC0+XG4gICAgZWRpdG9yID0gQHRleHRFZGl0b3JSZWdpc3RyeS5idWlsZChwYXJhbXMpXG4gICAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKFxuICAgICAgQHRleHRFZGl0b3JSZWdpc3RyeS5tYWludGFpbkdyYW1tYXIoZWRpdG9yKVxuICAgICAgQHRleHRFZGl0b3JSZWdpc3RyeS5tYWludGFpbkNvbmZpZyhlZGl0b3IpLFxuICAgIClcbiAgICBlZGl0b3Iub25EaWREZXN0cm95IC0+IHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgZWRpdG9yXG5cbiAgIyBQdWJsaWM6IEFzeW5jaHJvbm91c2x5IHJlb3BlbnMgdGhlIGxhc3QtY2xvc2VkIGl0ZW0ncyBVUkkgaWYgaXQgaGFzbid0IGFscmVhZHkgYmVlblxuICAjIHJlb3BlbmVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGl0ZW0gaXMgb3BlbmVkXG4gIHJlb3Blbkl0ZW06IC0+XG4gICAgaWYgdXJpID0gQGRlc3Ryb3llZEl0ZW1VUklzLnBvcCgpXG4gICAgICBAb3Blbih1cmkpXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAjIFB1YmxpYzogUmVnaXN0ZXIgYW4gb3BlbmVyIGZvciBhIHVyaS5cbiAgI1xuICAjIFdoZW4gYSBVUkkgaXMgb3BlbmVkIHZpYSB7V29ya3NwYWNlOjpvcGVufSwgQXRvbSBsb29wcyB0aHJvdWdoIGl0cyByZWdpc3RlcmVkXG4gICMgb3BlbmVyIGZ1bmN0aW9ucyB1bnRpbCBvbmUgcmV0dXJucyBhIHZhbHVlIGZvciB0aGUgZ2l2ZW4gdXJpLlxuICAjIE9wZW5lcnMgYXJlIGV4cGVjdGVkIHRvIHJldHVybiBhbiBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIEhUTUxFbGVtZW50IG9yXG4gICMgYSBtb2RlbCB3aGljaCBoYXMgYW4gYXNzb2NpYXRlZCB2aWV3IGluIHRoZSB7Vmlld1JlZ2lzdHJ5fS5cbiAgIyBBIHtUZXh0RWRpdG9yfSB3aWxsIGJlIHVzZWQgaWYgbm8gb3BlbmVyIHJldHVybnMgYSB2YWx1ZS5cbiAgI1xuICAjICMjIEV4YW1wbGVzXG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKHVyaSkgLT5cbiAgIyAgIGlmIHBhdGguZXh0bmFtZSh1cmkpIGlzICcudG9tbCdcbiAgIyAgICAgcmV0dXJuIG5ldyBUb21sRWRpdG9yKHVyaSlcbiAgIyBgYGBcbiAgI1xuICAjICogYG9wZW5lcmAgQSB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIGEgcGF0aCBpcyBiZWluZyBvcGVuZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHJlbW92ZSB0aGVcbiAgIyBvcGVuZXIuXG4gICNcbiAgIyBOb3RlIHRoYXQgdGhlIG9wZW5lciB3aWxsIGJlIGNhbGxlZCBpZiBhbmQgb25seSBpZiB0aGUgVVJJIGlzIG5vdCBhbHJlYWR5IG9wZW5cbiAgIyBpbiB0aGUgY3VycmVudCBwYW5lLiBUaGUgc2VhcmNoQWxsUGFuZXMgZmxhZyBleHBhbmRzIHRoZSBzZWFyY2ggZnJvbSB0aGVcbiAgIyBjdXJyZW50IHBhbmUgdG8gYWxsIHBhbmVzLiBJZiB5b3Ugd2lzaCB0byBvcGVuIGEgdmlldyBvZiBhIGRpZmZlcmVudCB0eXBlIGZvclxuICAjIGEgZmlsZSB0aGF0IGlzIGFscmVhZHkgb3BlbiwgY29uc2lkZXIgY2hhbmdpbmcgdGhlIHByb3RvY29sIG9mIHRoZSBVUkkuIEZvclxuICAjIGV4YW1wbGUsIHBlcmhhcHMgeW91IHdpc2ggdG8gcHJldmlldyBhIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGZpbGUgYC9mb28vYmFyL2Jhei5xdXV4YFxuICAjIHRoYXQgaXMgYWxyZWFkeSBvcGVuIGluIGEgdGV4dCBlZGl0b3Igdmlldy4gWW91IGNvdWxkIHNpZ25hbCB0aGlzIGJ5IGNhbGxpbmdcbiAgIyB7V29ya3NwYWNlOjpvcGVufSBvbiB0aGUgVVJJIGBxdXV4LXByZXZpZXc6Ly9mb28vYmFyL2Jhei5xdXV4YC4gVGhlbiB5b3VyIG9wZW5lclxuICAjIGNhbiBjaGVjayB0aGUgcHJvdG9jb2wgZm9yIHF1dXgtcHJldmlldyBhbmQgb25seSBoYW5kbGUgdGhvc2UgVVJJcyB0aGF0IG1hdGNoLlxuICBhZGRPcGVuZXI6IChvcGVuZXIpIC0+XG4gICAgQG9wZW5lcnMucHVzaChvcGVuZXIpXG4gICAgbmV3IERpc3Bvc2FibGUgPT4gXy5yZW1vdmUoQG9wZW5lcnMsIG9wZW5lcilcblxuICBnZXRPcGVuZXJzOiAtPlxuICAgIEBvcGVuZXJzXG5cbiAgIyMjXG4gIFNlY3Rpb246IFBhbmUgSXRlbXNcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEdldCBhbGwgcGFuZSBpdGVtcyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIGl0ZW1zLlxuICBnZXRQYW5lSXRlbXM6IC0+XG4gICAgQHBhbmVDb250YWluZXIuZ2V0UGFuZUl0ZW1zKClcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBhY3RpdmUge1BhbmV9J3MgYWN0aXZlIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGFuIHBhbmUgaXRlbSB7T2JqZWN0fS5cbiAgZ2V0QWN0aXZlUGFuZUl0ZW06IC0+XG4gICAgQHBhbmVDb250YWluZXIuZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYWxsIHRleHQgZWRpdG9ycyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdG9yfXMuXG4gIGdldFRleHRFZGl0b3JzOiAtPlxuICAgIEBnZXRQYW5lSXRlbXMoKS5maWx0ZXIgKGl0ZW0pIC0+IGl0ZW0gaW5zdGFuY2VvZiBUZXh0RWRpdG9yXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgYWN0aXZlIGl0ZW0gaWYgaXQgaXMgYW4ge1RleHRFZGl0b3J9LlxuICAjXG4gICMgUmV0dXJucyBhbiB7VGV4dEVkaXRvcn0gb3IgYHVuZGVmaW5lZGAgaWYgdGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0gaXMgbm90IGFuXG4gICMge1RleHRFZGl0b3J9LlxuICBnZXRBY3RpdmVUZXh0RWRpdG9yOiAtPlxuICAgIGFjdGl2ZUl0ZW0gPSBAZ2V0QWN0aXZlUGFuZUl0ZW0oKVxuICAgIGFjdGl2ZUl0ZW0gaWYgYWN0aXZlSXRlbSBpbnN0YW5jZW9mIFRleHRFZGl0b3JcblxuICAjIFNhdmUgYWxsIHBhbmUgaXRlbXMuXG4gIHNhdmVBbGw6IC0+XG4gICAgQHBhbmVDb250YWluZXIuc2F2ZUFsbCgpXG5cbiAgY29uZmlybUNsb3NlOiAob3B0aW9ucykgLT5cbiAgICBAcGFuZUNvbnRhaW5lci5jb25maXJtQ2xvc2Uob3B0aW9ucylcblxuICAjIFNhdmUgdGhlIGFjdGl2ZSBwYW5lIGl0ZW0uXG4gICNcbiAgIyBJZiB0aGUgYWN0aXZlIHBhbmUgaXRlbSBjdXJyZW50bHkgaGFzIGEgVVJJIGFjY29yZGluZyB0byB0aGUgaXRlbSdzXG4gICMgYC5nZXRVUklgIG1ldGhvZCwgY2FsbHMgYC5zYXZlYCBvbiB0aGUgaXRlbS4gT3RoZXJ3aXNlXG4gICMgezo6c2F2ZUFjdGl2ZVBhbmVJdGVtQXN9ICMgd2lsbCBiZSBjYWxsZWQgaW5zdGVhZC4gVGhpcyBtZXRob2QgZG9lcyBub3RoaW5nXG4gICMgaWYgdGhlIGFjdGl2ZSBpdGVtIGRvZXMgbm90IGltcGxlbWVudCBhIGAuc2F2ZWAgbWV0aG9kLlxuICBzYXZlQWN0aXZlUGFuZUl0ZW06IC0+XG4gICAgQGdldEFjdGl2ZVBhbmUoKS5zYXZlQWN0aXZlSXRlbSgpXG5cbiAgIyBQcm9tcHQgdGhlIHVzZXIgZm9yIGEgcGF0aCBhbmQgc2F2ZSB0aGUgYWN0aXZlIHBhbmUgaXRlbSB0byBpdC5cbiAgI1xuICAjIE9wZW5zIGEgbmF0aXZlIGRpYWxvZyB3aGVyZSB0aGUgdXNlciBzZWxlY3RzIGEgcGF0aCBvbiBkaXNrLCB0aGVuIGNhbGxzXG4gICMgYC5zYXZlQXNgIG9uIHRoZSBpdGVtIHdpdGggdGhlIHNlbGVjdGVkIHBhdGguIFRoaXMgbWV0aG9kIGRvZXMgbm90aGluZyBpZlxuICAjIHRoZSBhY3RpdmUgaXRlbSBkb2VzIG5vdCBpbXBsZW1lbnQgYSBgLnNhdmVBc2AgbWV0aG9kLlxuICBzYXZlQWN0aXZlUGFuZUl0ZW1BczogLT5cbiAgICBAZ2V0QWN0aXZlUGFuZSgpLnNhdmVBY3RpdmVJdGVtQXMoKVxuXG4gICMgRGVzdHJveSAoY2xvc2UpIHRoZSBhY3RpdmUgcGFuZSBpdGVtLlxuICAjXG4gICMgUmVtb3ZlcyB0aGUgYWN0aXZlIHBhbmUgaXRlbSBhbmQgY2FsbHMgdGhlIGAuZGVzdHJveWAgbWV0aG9kIG9uIGl0IGlmIG9uZSBpc1xuICAjIGRlZmluZWQuXG4gIGRlc3Ryb3lBY3RpdmVQYW5lSXRlbTogLT5cbiAgICBAZ2V0QWN0aXZlUGFuZSgpLmRlc3Ryb3lBY3RpdmVJdGVtKClcblxuICAjIyNcbiAgU2VjdGlvbjogUGFuZXNcbiAgIyMjXG5cbiAgIyBFeHRlbmRlZDogR2V0IGFsbCBwYW5lcyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtQYW5lfXMuXG4gIGdldFBhbmVzOiAtPlxuICAgIEBwYW5lQ29udGFpbmVyLmdldFBhbmVzKClcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIGFjdGl2ZSB7UGFuZX0uXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmV9LlxuICBnZXRBY3RpdmVQYW5lOiAtPlxuICAgIEBwYW5lQ29udGFpbmVyLmdldEFjdGl2ZVBhbmUoKVxuXG4gICMgRXh0ZW5kZWQ6IE1ha2UgdGhlIG5leHQgcGFuZSBhY3RpdmUuXG4gIGFjdGl2YXRlTmV4dFBhbmU6IC0+XG4gICAgQHBhbmVDb250YWluZXIuYWN0aXZhdGVOZXh0UGFuZSgpXG5cbiAgIyBFeHRlbmRlZDogTWFrZSB0aGUgcHJldmlvdXMgcGFuZSBhY3RpdmUuXG4gIGFjdGl2YXRlUHJldmlvdXNQYW5lOiAtPlxuICAgIEBwYW5lQ29udGFpbmVyLmFjdGl2YXRlUHJldmlvdXNQYW5lKClcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIGZpcnN0IHtQYW5lfSB3aXRoIGFuIGl0ZW0gZm9yIHRoZSBnaXZlbiBVUkkuXG4gICNcbiAgIyAqIGB1cmlgIHtTdHJpbmd9IHVyaVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lfSBvciBgdW5kZWZpbmVkYCBpZiBubyBwYW5lIGV4aXN0cyBmb3IgdGhlIGdpdmVuIFVSSS5cbiAgcGFuZUZvclVSSTogKHVyaSkgLT5cbiAgICBAcGFuZUNvbnRhaW5lci5wYW5lRm9yVVJJKHVyaSlcblxuICAjIEV4dGVuZGVkOiBHZXQgdGhlIHtQYW5lfSBjb250YWluaW5nIHRoZSBnaXZlbiBpdGVtLlxuICAjXG4gICMgKiBgaXRlbWAgSXRlbSB0aGUgcmV0dXJuZWQgcGFuZSBjb250YWlucy5cbiAgI1xuICAjIFJldHVybnMgYSB7UGFuZX0gb3IgYHVuZGVmaW5lZGAgaWYgbm8gcGFuZSBleGlzdHMgZm9yIHRoZSBnaXZlbiBpdGVtLlxuICBwYW5lRm9ySXRlbTogKGl0ZW0pIC0+XG4gICAgQHBhbmVDb250YWluZXIucGFuZUZvckl0ZW0oaXRlbSlcblxuICAjIERlc3Ryb3kgKGNsb3NlKSB0aGUgYWN0aXZlIHBhbmUuXG4gIGRlc3Ryb3lBY3RpdmVQYW5lOiAtPlxuICAgIEBnZXRBY3RpdmVQYW5lKCk/LmRlc3Ryb3koKVxuXG4gICMgQ2xvc2UgdGhlIGFjdGl2ZSBwYW5lIGl0ZW0sIG9yIHRoZSBhY3RpdmUgcGFuZSBpZiBpdCBpcyBlbXB0eSxcbiAgIyBvciB0aGUgY3VycmVudCB3aW5kb3cgaWYgdGhlcmUgaXMgb25seSB0aGUgZW1wdHkgcm9vdCBwYW5lLlxuICBjbG9zZUFjdGl2ZVBhbmVJdGVtT3JFbXB0eVBhbmVPcldpbmRvdzogLT5cbiAgICBpZiBAZ2V0QWN0aXZlUGFuZUl0ZW0oKT9cbiAgICAgIEBkZXN0cm95QWN0aXZlUGFuZUl0ZW0oKVxuICAgIGVsc2UgaWYgQGdldFBhbmVzKCkubGVuZ3RoID4gMVxuICAgICAgQGRlc3Ryb3lBY3RpdmVQYW5lKClcbiAgICBlbHNlIGlmIEBjb25maWcuZ2V0KCdjb3JlLmNsb3NlRW1wdHlXaW5kb3dzJylcbiAgICAgIGF0b20uY2xvc2UoKVxuXG4gICMgSW5jcmVhc2UgdGhlIGVkaXRvciBmb250IHNpemUgYnkgMXB4LlxuICBpbmNyZWFzZUZvbnRTaXplOiAtPlxuICAgIEBjb25maWcuc2V0KFwiZWRpdG9yLmZvbnRTaXplXCIsIEBjb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpICsgMSlcblxuICAjIERlY3JlYXNlIHRoZSBlZGl0b3IgZm9udCBzaXplIGJ5IDFweC5cbiAgZGVjcmVhc2VGb250U2l6ZTogLT5cbiAgICBmb250U2l6ZSA9IEBjb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpXG4gICAgQGNvbmZpZy5zZXQoXCJlZGl0b3IuZm9udFNpemVcIiwgZm9udFNpemUgLSAxKSBpZiBmb250U2l6ZSA+IDFcblxuICAjIFJlc3RvcmUgdG8gdGhlIHdpbmRvdydzIG9yaWdpbmFsIGVkaXRvciBmb250IHNpemUuXG4gIHJlc2V0Rm9udFNpemU6IC0+XG4gICAgaWYgQG9yaWdpbmFsRm9udFNpemVcbiAgICAgIEBjb25maWcuc2V0KFwiZWRpdG9yLmZvbnRTaXplXCIsIEBvcmlnaW5hbEZvbnRTaXplKVxuXG4gIHN1YnNjcmliZVRvRm9udFNpemU6IC0+XG4gICAgQGNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRTaXplJywgKHtvbGRWYWx1ZX0pID0+XG4gICAgICBAb3JpZ2luYWxGb250U2l6ZSA/PSBvbGRWYWx1ZVxuXG4gICMgUmVtb3ZlcyB0aGUgaXRlbSdzIHVyaSBmcm9tIHRoZSBsaXN0IG9mIHBvdGVudGlhbCBpdGVtcyB0byByZW9wZW4uXG4gIGl0ZW1PcGVuZWQ6IChpdGVtKSAtPlxuICAgIGlmIHR5cGVvZiBpdGVtLmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICB1cmkgPSBpdGVtLmdldFVSSSgpXG4gICAgZWxzZSBpZiB0eXBlb2YgaXRlbS5nZXRVcmkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdXJpID0gaXRlbS5nZXRVcmkoKVxuXG4gICAgaWYgdXJpP1xuICAgICAgXy5yZW1vdmUoQGRlc3Ryb3llZEl0ZW1VUklzLCB1cmkpXG5cbiAgIyBBZGRzIHRoZSBkZXN0cm95ZWQgaXRlbSdzIHVyaSB0byB0aGUgbGlzdCBvZiBpdGVtcyB0byByZW9wZW4uXG4gIGRpZERlc3Ryb3lQYW5lSXRlbTogKHtpdGVtfSkgPT5cbiAgICBpZiB0eXBlb2YgaXRlbS5nZXRVUkkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdXJpID0gaXRlbS5nZXRVUkkoKVxuICAgIGVsc2UgaWYgdHlwZW9mIGl0ZW0uZ2V0VXJpIGlzICdmdW5jdGlvbidcbiAgICAgIHVyaSA9IGl0ZW0uZ2V0VXJpKClcblxuICAgIGlmIHVyaT9cbiAgICAgIEBkZXN0cm95ZWRJdGVtVVJJcy5wdXNoKHVyaSlcblxuICAjIENhbGxlZCBieSBNb2RlbCBzdXBlcmNsYXNzIHdoZW4gZGVzdHJveWVkXG4gIGRlc3Ryb3llZDogLT5cbiAgICBAcGFuZUNvbnRhaW5lci5kZXN0cm95KClcbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuXG5cbiAgIyMjXG4gIFNlY3Rpb246IFBhbmVsc1xuXG4gIFBhbmVscyBhcmUgdXNlZCB0byBkaXNwbGF5IFVJIHJlbGF0ZWQgdG8gYW4gZWRpdG9yIHdpbmRvdy4gVGhleSBhcmUgcGxhY2VkIGF0IG9uZSBvZiB0aGUgZm91clxuICBlZGdlcyBvZiB0aGUgd2luZG93OiBsZWZ0LCByaWdodCwgdG9wIG9yIGJvdHRvbS4gSWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhbmVscyBvbiB0aGUgc2FtZSB3aW5kb3dcbiAgZWRnZSB0aGV5IGFyZSBzdGFja2VkIGluIG9yZGVyIG9mIHByaW9yaXR5OiBoaWdoZXIgcHJpb3JpdHkgaXMgY2xvc2VyIHRvIHRoZSBjZW50ZXIsIGxvd2VyXG4gIHByaW9yaXR5IHRvd2FyZHMgdGhlIGVkZ2UuXG5cbiAgKk5vdGU6KiBJZiB5b3VyIHBhbmVsIGNoYW5nZXMgaXRzIHNpemUgdGhyb3VnaG91dCBpdHMgbGlmZXRpbWUsIGNvbnNpZGVyIGdpdmluZyBpdCBhIGhpZ2hlclxuICBwcmlvcml0eSwgYWxsb3dpbmcgZml4ZWQgc2l6ZSBwYW5lbHMgdG8gYmUgY2xvc2VyIHRvIHRoZSBlZGdlLiBUaGlzIGFsbG93cyBjb250cm9sIHRhcmdldHMgdG9cbiAgcmVtYWluIG1vcmUgc3RhdGljIGZvciBlYXNpZXIgdGFyZ2V0aW5nIGJ5IHVzZXJzIHRoYXQgZW1wbG95IG1pY2Ugb3IgdHJhY2twYWRzLiAoU2VlXG4gIFthdG9tL2F0b20jNDgzNF0oaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvNDgzNCkgZm9yIGRpc2N1c3Npb24uKVxuICAjIyNcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBlZGl0b3Igd2luZG93LlxuICBnZXRCb3R0b21QYW5lbHM6IC0+XG4gICAgQGdldFBhbmVscygnYm90dG9tJylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIGJvdHRvbSBvZiB0aGUgZWRpdG9yIHdpbmRvdy5cbiAgI1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9XG4gICMgICAqIGBpdGVtYCBZb3VyIHBhbmVsIGNvbnRlbnQuIEl0IGNhbiBiZSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIGxhdHRlci4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkQm90dG9tUGFuZWw6IChvcHRpb25zKSAtPlxuICAgIEBhZGRQYW5lbCgnYm90dG9tJywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyB0byB0aGUgbGVmdCBvZiB0aGUgZWRpdG9yIHdpbmRvdy5cbiAgZ2V0TGVmdFBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCdsZWZ0JylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIGxlZnQgb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4gICNcbiAgIyAqIGBvcHRpb25zYCB7T2JqZWN0fVxuICAjICAgKiBgaXRlbWAgWW91ciBwYW5lbCBjb250ZW50LiBJdCBjYW4gYmUgRE9NIGVsZW1lbnQsIGEgalF1ZXJ5IGVsZW1lbnQsIG9yXG4gICMgICAgIGEgbW9kZWwgd2l0aCBhIHZpZXcgcmVnaXN0ZXJlZCB2aWEge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfS4gV2UgcmVjb21tZW5kIHRoZVxuICAjICAgICBsYXR0ZXIuIFNlZSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAjICAgKiBgdmlzaWJsZWAgKG9wdGlvbmFsKSB7Qm9vbGVhbn0gZmFsc2UgaWYgeW91IHdhbnQgdGhlIHBhbmVsIHRvIGluaXRpYWxseSBiZSBoaWRkZW5cbiAgIyAgICAgKGRlZmF1bHQ6IHRydWUpXG4gICMgICAqIGBwcmlvcml0eWAgKG9wdGlvbmFsKSB7TnVtYmVyfSBEZXRlcm1pbmVzIHN0YWNraW5nIG9yZGVyLiBMb3dlciBwcmlvcml0eSBpdGVtcyBhcmVcbiAgIyAgICAgZm9yY2VkIGNsb3NlciB0byB0aGUgZWRnZXMgb2YgdGhlIHdpbmRvdy4gKGRlZmF1bHQ6IDEwMClcbiAgI1xuICAjIFJldHVybnMgYSB7UGFuZWx9XG4gIGFkZExlZnRQYW5lbDogKG9wdGlvbnMpIC0+XG4gICAgQGFkZFBhbmVsKCdsZWZ0Jywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyB0byB0aGUgcmlnaHQgb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4gIGdldFJpZ2h0UGFuZWxzOiAtPlxuICAgIEBnZXRQYW5lbHMoJ3JpZ2h0JylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIHJpZ2h0IG9mIHRoZSBlZGl0b3Igd2luZG93LlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIERPTSBlbGVtZW50LCBhIGpRdWVyeSBlbGVtZW50LCBvclxuICAjICAgICBhIG1vZGVsIHdpdGggYSB2aWV3IHJlZ2lzdGVyZWQgdmlhIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0uIFdlIHJlY29tbWVuZCB0aGVcbiAgIyAgICAgbGF0dGVyLiBTZWUge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHZpc2libGVgIChvcHRpb25hbCkge0Jvb2xlYW59IGZhbHNlIGlmIHlvdSB3YW50IHRoZSBwYW5lbCB0byBpbml0aWFsbHkgYmUgaGlkZGVuXG4gICMgICAgIChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgcHJpb3JpdHlgIChvcHRpb25hbCkge051bWJlcn0gRGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlci4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlXG4gICMgICAgIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZSB3aW5kb3cuIChkZWZhdWx0OiAxMDApXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmVsfVxuICBhZGRSaWdodFBhbmVsOiAob3B0aW9ucykgLT5cbiAgICBAYWRkUGFuZWwoJ3JpZ2h0Jywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyBhdCB0aGUgdG9wIG9mIHRoZSBlZGl0b3Igd2luZG93LlxuICBnZXRUb3BQYW5lbHM6IC0+XG4gICAgQGdldFBhbmVscygndG9wJylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIHRvcCBvZiB0aGUgZWRpdG9yIHdpbmRvdyBhYm92ZSB0aGUgdGFicy5cbiAgI1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9XG4gICMgICAqIGBpdGVtYCBZb3VyIHBhbmVsIGNvbnRlbnQuIEl0IGNhbiBiZSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIGxhdHRlci4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkVG9wUGFuZWw6IChvcHRpb25zKSAtPlxuICAgIEBhZGRQYW5lbCgndG9wJywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyBpbiB0aGUgaGVhZGVyLlxuICBnZXRIZWFkZXJQYW5lbHM6IC0+XG4gICAgQGdldFBhbmVscygnaGVhZGVyJylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIGhlYWRlci5cbiAgI1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9XG4gICMgICAqIGBpdGVtYCBZb3VyIHBhbmVsIGNvbnRlbnQuIEl0IGNhbiBiZSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIGxhdHRlci4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkSGVhZGVyUGFuZWw6IChvcHRpb25zKSAtPlxuICAgIEBhZGRQYW5lbCgnaGVhZGVyJywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBwYW5lbCBpdGVtcyBpbiB0aGUgZm9vdGVyLlxuICBnZXRGb290ZXJQYW5lbHM6IC0+XG4gICAgQGdldFBhbmVscygnZm9vdGVyJylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gdG8gdGhlIGZvb3Rlci5cbiAgI1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9XG4gICMgICAqIGBpdGVtYCBZb3VyIHBhbmVsIGNvbnRlbnQuIEl0IGNhbiBiZSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIGxhdHRlci4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkRm9vdGVyUGFuZWw6IChvcHRpb25zKSAtPlxuICAgIEBhZGRQYW5lbCgnZm9vdGVyJywgb3B0aW9ucylcblxuICAjIEVzc2VudGlhbDogR2V0IGFuIHtBcnJheX0gb2YgYWxsIHRoZSBtb2RhbCBwYW5lbCBpdGVtc1xuICBnZXRNb2RhbFBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCdtb2RhbCcpXG5cbiAgIyBFc3NlbnRpYWw6IEFkZHMgYSBwYW5lbCBpdGVtIGFzIGEgbW9kYWwgZGlhbG9nLlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIGEgRE9NIGVsZW1lbnQsIGEgalF1ZXJ5IGVsZW1lbnQsIG9yXG4gICMgICAgIGEgbW9kZWwgd2l0aCBhIHZpZXcgcmVnaXN0ZXJlZCB2aWEge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfS4gV2UgcmVjb21tZW5kIHRoZVxuICAjICAgICBtb2RlbCBvcHRpb24uIFNlZSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAjICAgKiBgdmlzaWJsZWAgKG9wdGlvbmFsKSB7Qm9vbGVhbn0gZmFsc2UgaWYgeW91IHdhbnQgdGhlIHBhbmVsIHRvIGluaXRpYWxseSBiZSBoaWRkZW5cbiAgIyAgICAgKGRlZmF1bHQ6IHRydWUpXG4gICMgICAqIGBwcmlvcml0eWAgKG9wdGlvbmFsKSB7TnVtYmVyfSBEZXRlcm1pbmVzIHN0YWNraW5nIG9yZGVyLiBMb3dlciBwcmlvcml0eSBpdGVtcyBhcmVcbiAgIyAgICAgZm9yY2VkIGNsb3NlciB0byB0aGUgZWRnZXMgb2YgdGhlIHdpbmRvdy4gKGRlZmF1bHQ6IDEwMClcbiAgI1xuICAjIFJldHVybnMgYSB7UGFuZWx9XG4gIGFkZE1vZGFsUGFuZWw6IChvcHRpb25zPXt9KSAtPlxuICAgIEBhZGRQYW5lbCgnbW9kYWwnLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBSZXR1cm5zIHRoZSB7UGFuZWx9IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gaXRlbS4gUmV0dXJuc1xuICAjIGBudWxsYCB3aGVuIHRoZSBpdGVtIGhhcyBubyBwYW5lbC5cbiAgI1xuICAjICogYGl0ZW1gIEl0ZW0gdGhlIHBhbmVsIGNvbnRhaW5zXG4gIHBhbmVsRm9ySXRlbTogKGl0ZW0pIC0+XG4gICAgZm9yIGxvY2F0aW9uLCBjb250YWluZXIgb2YgQHBhbmVsQ29udGFpbmVyc1xuICAgICAgcGFuZWwgPSBjb250YWluZXIucGFuZWxGb3JJdGVtKGl0ZW0pXG4gICAgICByZXR1cm4gcGFuZWwgaWYgcGFuZWw/XG4gICAgbnVsbFxuXG4gIGdldFBhbmVsczogKGxvY2F0aW9uKSAtPlxuICAgIEBwYW5lbENvbnRhaW5lcnNbbG9jYXRpb25dLmdldFBhbmVscygpXG5cbiAgYWRkUGFuZWw6IChsb2NhdGlvbiwgb3B0aW9ucykgLT5cbiAgICBvcHRpb25zID89IHt9XG4gICAgQHBhbmVsQ29udGFpbmVyc1tsb2NhdGlvbl0uYWRkUGFuZWwobmV3IFBhbmVsKG9wdGlvbnMpKVxuXG4gICMjI1xuICBTZWN0aW9uOiBTZWFyY2hpbmcgYW5kIFJlcGxhY2luZ1xuICAjIyNcblxuICAjIFB1YmxpYzogUGVyZm9ybXMgYSBzZWFyY2ggYWNyb3NzIGFsbCBmaWxlcyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgcmVnZXhgIHtSZWdFeHB9IHRvIHNlYXJjaCB3aXRoLlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYHBhdGhzYCBBbiB7QXJyYXl9IG9mIGdsb2IgcGF0dGVybnMgdG8gc2VhcmNoIHdpdGhpbi5cbiAgIyAgICogYG9uUGF0aHNTZWFyY2hlZGAgKG9wdGlvbmFsKSB7RnVuY3Rpb259IHRvIGJlIHBlcmlvZGljYWxseSBjYWxsZWRcbiAgIyAgICAgd2l0aCBudW1iZXIgb2YgcGF0aHMgc2VhcmNoZWQuXG4gICMgKiBgaXRlcmF0b3JgIHtGdW5jdGlvbn0gY2FsbGJhY2sgb24gZWFjaCBmaWxlIGZvdW5kLlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB3aXRoIGEgYGNhbmNlbCgpYCBtZXRob2QgdGhhdCB3aWxsIGNhbmNlbCBhbGxcbiAgIyBvZiB0aGUgdW5kZXJseWluZyBzZWFyY2hlcyB0aGF0IHdlcmUgc3RhcnRlZCBhcyBwYXJ0IG9mIHRoaXMgc2Nhbi5cbiAgc2NhbjogKHJlZ2V4LCBvcHRpb25zPXt9LCBpdGVyYXRvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucylcbiAgICAgIGl0ZXJhdG9yID0gb3B0aW9uc1xuICAgICAgb3B0aW9ucyA9IHt9XG5cbiAgICAjIEZpbmQgYSBzZWFyY2hlciBmb3IgZXZlcnkgRGlyZWN0b3J5IGluIHRoZSBwcm9qZWN0LiBFYWNoIHNlYXJjaGVyIHRoYXQgaXMgbWF0Y2hlZFxuICAgICMgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggYW4gQXJyYXkgb2YgRGlyZWN0b3J5IG9iamVjdHMgaW4gdGhlIE1hcC5cbiAgICBkaXJlY3Rvcmllc0ZvclNlYXJjaGVyID0gbmV3IE1hcCgpXG4gICAgZm9yIGRpcmVjdG9yeSBpbiBAcHJvamVjdC5nZXREaXJlY3RvcmllcygpXG4gICAgICBzZWFyY2hlciA9IEBkZWZhdWx0RGlyZWN0b3J5U2VhcmNoZXJcbiAgICAgIGZvciBkaXJlY3RvcnlTZWFyY2hlciBpbiBAZGlyZWN0b3J5U2VhcmNoZXJzXG4gICAgICAgIGlmIGRpcmVjdG9yeVNlYXJjaGVyLmNhblNlYXJjaERpcmVjdG9yeShkaXJlY3RvcnkpXG4gICAgICAgICAgc2VhcmNoZXIgPSBkaXJlY3RvcnlTZWFyY2hlclxuICAgICAgICAgIGJyZWFrXG4gICAgICBkaXJlY3RvcmllcyA9IGRpcmVjdG9yaWVzRm9yU2VhcmNoZXIuZ2V0KHNlYXJjaGVyKVxuICAgICAgdW5sZXNzIGRpcmVjdG9yaWVzXG4gICAgICAgIGRpcmVjdG9yaWVzID0gW11cbiAgICAgICAgZGlyZWN0b3JpZXNGb3JTZWFyY2hlci5zZXQoc2VhcmNoZXIsIGRpcmVjdG9yaWVzKVxuICAgICAgZGlyZWN0b3JpZXMucHVzaChkaXJlY3RvcnkpXG5cbiAgICAjIERlZmluZSB0aGUgb25QYXRoc1NlYXJjaGVkIGNhbGxiYWNrLlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zLm9uUGF0aHNTZWFyY2hlZClcbiAgICAgICMgTWFpbnRhaW4gYSBtYXAgb2YgZGlyZWN0b3JpZXMgdG8gdGhlIG51bWJlciBvZiBzZWFyY2ggcmVzdWx0cy4gV2hlbiBub3RpZmllZCBvZiBhIG5ldyBjb3VudCxcbiAgICAgICMgcmVwbGFjZSB0aGUgZW50cnkgaW4gdGhlIG1hcCBhbmQgdXBkYXRlIHRoZSB0b3RhbC5cbiAgICAgIG9uUGF0aHNTZWFyY2hlZE9wdGlvbiA9IG9wdGlvbnMub25QYXRoc1NlYXJjaGVkXG4gICAgICB0b3RhbE51bWJlck9mUGF0aHNTZWFyY2hlZCA9IDBcbiAgICAgIG51bWJlck9mUGF0aHNTZWFyY2hlZEZvclNlYXJjaGVyID0gbmV3IE1hcCgpXG4gICAgICBvblBhdGhzU2VhcmNoZWQgPSAoc2VhcmNoZXIsIG51bWJlck9mUGF0aHNTZWFyY2hlZCkgLT5cbiAgICAgICAgb2xkVmFsdWUgPSBudW1iZXJPZlBhdGhzU2VhcmNoZWRGb3JTZWFyY2hlci5nZXQoc2VhcmNoZXIpXG4gICAgICAgIGlmIG9sZFZhbHVlXG4gICAgICAgICAgdG90YWxOdW1iZXJPZlBhdGhzU2VhcmNoZWQgLT0gb2xkVmFsdWVcbiAgICAgICAgbnVtYmVyT2ZQYXRoc1NlYXJjaGVkRm9yU2VhcmNoZXIuc2V0KHNlYXJjaGVyLCBudW1iZXJPZlBhdGhzU2VhcmNoZWQpXG4gICAgICAgIHRvdGFsTnVtYmVyT2ZQYXRoc1NlYXJjaGVkICs9IG51bWJlck9mUGF0aHNTZWFyY2hlZFxuICAgICAgICBvblBhdGhzU2VhcmNoZWRPcHRpb24odG90YWxOdW1iZXJPZlBhdGhzU2VhcmNoZWQpXG4gICAgZWxzZVxuICAgICAgb25QYXRoc1NlYXJjaGVkID0gLT5cblxuICAgICMgS2ljayBvZmYgYWxsIG9mIHRoZSBzZWFyY2hlcyBhbmQgdW5pZnkgdGhlbSBpbnRvIG9uZSBQcm9taXNlLlxuICAgIGFsbFNlYXJjaGVzID0gW11cbiAgICBkaXJlY3Rvcmllc0ZvclNlYXJjaGVyLmZvckVhY2ggKGRpcmVjdG9yaWVzLCBzZWFyY2hlcikgPT5cbiAgICAgIHNlYXJjaE9wdGlvbnMgPVxuICAgICAgICBpbmNsdXNpb25zOiBvcHRpb25zLnBhdGhzIG9yIFtdXG4gICAgICAgIGluY2x1ZGVIaWRkZW46IHRydWVcbiAgICAgICAgZXhjbHVkZVZjc0lnbm9yZXM6IEBjb25maWcuZ2V0KCdjb3JlLmV4Y2x1ZGVWY3NJZ25vcmVkUGF0aHMnKVxuICAgICAgICBleGNsdXNpb25zOiBAY29uZmlnLmdldCgnY29yZS5pZ25vcmVkTmFtZXMnKVxuICAgICAgICBmb2xsb3c6IEBjb25maWcuZ2V0KCdjb3JlLmZvbGxvd1N5bWxpbmtzJylcbiAgICAgICAgZGlkTWF0Y2g6IChyZXN1bHQpID0+XG4gICAgICAgICAgaXRlcmF0b3IocmVzdWx0KSB1bmxlc3MgQHByb2plY3QuaXNQYXRoTW9kaWZpZWQocmVzdWx0LmZpbGVQYXRoKVxuICAgICAgICBkaWRFcnJvcjogKGVycm9yKSAtPlxuICAgICAgICAgIGl0ZXJhdG9yKG51bGwsIGVycm9yKVxuICAgICAgICBkaWRTZWFyY2hQYXRoczogKGNvdW50KSAtPiBvblBhdGhzU2VhcmNoZWQoc2VhcmNoZXIsIGNvdW50KVxuICAgICAgZGlyZWN0b3J5U2VhcmNoZXIgPSBzZWFyY2hlci5zZWFyY2goZGlyZWN0b3JpZXMsIHJlZ2V4LCBzZWFyY2hPcHRpb25zKVxuICAgICAgYWxsU2VhcmNoZXMucHVzaChkaXJlY3RvcnlTZWFyY2hlcilcbiAgICBzZWFyY2hQcm9taXNlID0gUHJvbWlzZS5hbGwoYWxsU2VhcmNoZXMpXG5cbiAgICBmb3IgYnVmZmVyIGluIEBwcm9qZWN0LmdldEJ1ZmZlcnMoKSB3aGVuIGJ1ZmZlci5pc01vZGlmaWVkKClcbiAgICAgIGZpbGVQYXRoID0gYnVmZmVyLmdldFBhdGgoKVxuICAgICAgY29udGludWUgdW5sZXNzIEBwcm9qZWN0LmNvbnRhaW5zKGZpbGVQYXRoKVxuICAgICAgbWF0Y2hlcyA9IFtdXG4gICAgICBidWZmZXIuc2NhbiByZWdleCwgKG1hdGNoKSAtPiBtYXRjaGVzLnB1c2ggbWF0Y2hcbiAgICAgIGl0ZXJhdG9yIHtmaWxlUGF0aCwgbWF0Y2hlc30gaWYgbWF0Y2hlcy5sZW5ndGggPiAwXG5cbiAgICAjIE1ha2Ugc3VyZSB0aGUgUHJvbWlzZSB0aGF0IGlzIHJldHVybmVkIHRvIHRoZSBjbGllbnQgaXMgY2FuY2VsYWJsZS4gVG8gYmUgY29uc2lzdGVudFxuICAgICMgd2l0aCB0aGUgZXhpc3RpbmcgYmVoYXZpb3IsIGluc3RlYWQgb2YgY2FuY2VsKCkgcmVqZWN0aW5nIHRoZSBwcm9taXNlLCBpdCBzaG91bGRcbiAgICAjIHJlc29sdmUgaXQgd2l0aCB0aGUgc3BlY2lhbCB2YWx1ZSAnY2FuY2VsbGVkJy4gQXQgbGVhc3QgdGhlIGJ1aWx0LWluIGZpbmQtYW5kLXJlcGxhY2VcbiAgICAjIHBhY2thZ2UgcmVsaWVzIG9uIHRoaXMgYmVoYXZpb3IuXG4gICAgaXNDYW5jZWxsZWQgPSBmYWxzZVxuICAgIGNhbmNlbGxhYmxlUHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICBvblN1Y2Nlc3MgPSAtPlxuICAgICAgICBpZiBpc0NhbmNlbGxlZFxuICAgICAgICAgIHJlc29sdmUoJ2NhbmNlbGxlZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXNvbHZlKG51bGwpXG5cbiAgICAgIG9uRmFpbHVyZSA9IC0+XG4gICAgICAgIHByb21pc2UuY2FuY2VsKCkgZm9yIHByb21pc2UgaW4gYWxsU2VhcmNoZXNcbiAgICAgICAgcmVqZWN0KClcblxuICAgICAgc2VhcmNoUHJvbWlzZS50aGVuKG9uU3VjY2Vzcywgb25GYWlsdXJlKVxuICAgIGNhbmNlbGxhYmxlUHJvbWlzZS5jYW5jZWwgPSAtPlxuICAgICAgaXNDYW5jZWxsZWQgPSB0cnVlXG4gICAgICAjIE5vdGUgdGhhdCBjYW5jZWxsaW5nIGFsbCBvZiB0aGUgbWVtYmVycyBvZiBhbGxTZWFyY2hlcyB3aWxsIGNhdXNlIGFsbCBvZiB0aGUgc2VhcmNoZXNcbiAgICAgICMgdG8gcmVzb2x2ZSwgd2hpY2ggY2F1c2VzIHNlYXJjaFByb21pc2UgdG8gcmVzb2x2ZSwgd2hpY2ggaXMgdWx0aW1hdGVseSB3aGF0IGNhdXNlc1xuICAgICAgIyBjYW5jZWxsYWJsZVByb21pc2UgdG8gcmVzb2x2ZS5cbiAgICAgIHByb21pc2UuY2FuY2VsKCkgZm9yIHByb21pc2UgaW4gYWxsU2VhcmNoZXNcblxuICAgICMgQWx0aG91Z2ggdGhpcyBtZXRob2QgY2xhaW1zIHRvIHJldHVybiBhIGBQcm9taXNlYCwgdGhlIGBSZXN1bHRzUGFuZVZpZXcub25TZWFyY2goKWBcbiAgICAjIG1ldGhvZCBpbiB0aGUgZmluZC1hbmQtcmVwbGFjZSBwYWNrYWdlIGV4cGVjdHMgdGhlIG9iamVjdCByZXR1cm5lZCBieSB0aGlzIG1ldGhvZCB0byBoYXZlIGFcbiAgICAjIGBkb25lKClgIG1ldGhvZC4gSW5jbHVkZSBhIGRvbmUoKSBtZXRob2QgdW50aWwgZmluZC1hbmQtcmVwbGFjZSBjYW4gYmUgdXBkYXRlZC5cbiAgICBjYW5jZWxsYWJsZVByb21pc2UuZG9uZSA9IChvblN1Y2Nlc3NPckZhaWx1cmUpIC0+XG4gICAgICBjYW5jZWxsYWJsZVByb21pc2UudGhlbihvblN1Y2Nlc3NPckZhaWx1cmUsIG9uU3VjY2Vzc09yRmFpbHVyZSlcbiAgICBjYW5jZWxsYWJsZVByb21pc2VcblxuICAjIFB1YmxpYzogUGVyZm9ybXMgYSByZXBsYWNlIGFjcm9zcyBhbGwgdGhlIHNwZWNpZmllZCBmaWxlcyBpbiB0aGUgcHJvamVjdC5cbiAgI1xuICAjICogYHJlZ2V4YCBBIHtSZWdFeHB9IHRvIHNlYXJjaCB3aXRoLlxuICAjICogYHJlcGxhY2VtZW50VGV4dGAge1N0cmluZ30gdG8gcmVwbGFjZSBhbGwgbWF0Y2hlcyBvZiByZWdleCB3aXRoLlxuICAjICogYGZpbGVQYXRoc2AgQW4ge0FycmF5fSBvZiBmaWxlIHBhdGggc3RyaW5ncyB0byBydW4gdGhlIHJlcGxhY2Ugb24uXG4gICMgKiBgaXRlcmF0b3JgIEEge0Z1bmN0aW9ufSBjYWxsYmFjayBvbiBlYWNoIGZpbGUgd2l0aCByZXBsYWNlbWVudHM6XG4gICMgICAqIGBvcHRpb25zYCB7T2JqZWN0fSB3aXRoIGtleXMgYGZpbGVQYXRoYCBhbmQgYHJlcGxhY2VtZW50c2AuXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9LlxuICByZXBsYWNlOiAocmVnZXgsIHJlcGxhY2VtZW50VGV4dCwgZmlsZVBhdGhzLCBpdGVyYXRvcikgLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgb3BlblBhdGhzID0gKGJ1ZmZlci5nZXRQYXRoKCkgZm9yIGJ1ZmZlciBpbiBAcHJvamVjdC5nZXRCdWZmZXJzKCkpXG4gICAgICBvdXRPZlByb2Nlc3NQYXRocyA9IF8uZGlmZmVyZW5jZShmaWxlUGF0aHMsIG9wZW5QYXRocylcblxuICAgICAgaW5Qcm9jZXNzRmluaXNoZWQgPSBub3Qgb3BlblBhdGhzLmxlbmd0aFxuICAgICAgb3V0T2ZQcm9jZXNzRmluaXNoZWQgPSBub3Qgb3V0T2ZQcm9jZXNzUGF0aHMubGVuZ3RoXG4gICAgICBjaGVja0ZpbmlzaGVkID0gLT5cbiAgICAgICAgcmVzb2x2ZSgpIGlmIG91dE9mUHJvY2Vzc0ZpbmlzaGVkIGFuZCBpblByb2Nlc3NGaW5pc2hlZFxuXG4gICAgICB1bmxlc3Mgb3V0T2ZQcm9jZXNzRmluaXNoZWQubGVuZ3RoXG4gICAgICAgIGZsYWdzID0gJ2cnXG4gICAgICAgIGZsYWdzICs9ICdpJyBpZiByZWdleC5pZ25vcmVDYXNlXG5cbiAgICAgICAgdGFzayA9IFRhc2sub25jZSByZXF1aXJlLnJlc29sdmUoJy4vcmVwbGFjZS1oYW5kbGVyJyksIG91dE9mUHJvY2Vzc1BhdGhzLCByZWdleC5zb3VyY2UsIGZsYWdzLCByZXBsYWNlbWVudFRleHQsIC0+XG4gICAgICAgICAgb3V0T2ZQcm9jZXNzRmluaXNoZWQgPSB0cnVlXG4gICAgICAgICAgY2hlY2tGaW5pc2hlZCgpXG5cbiAgICAgICAgdGFzay5vbiAncmVwbGFjZTpwYXRoLXJlcGxhY2VkJywgaXRlcmF0b3JcbiAgICAgICAgdGFzay5vbiAncmVwbGFjZTpmaWxlLWVycm9yJywgKGVycm9yKSAtPiBpdGVyYXRvcihudWxsLCBlcnJvcilcblxuICAgICAgZm9yIGJ1ZmZlciBpbiBAcHJvamVjdC5nZXRCdWZmZXJzKClcbiAgICAgICAgY29udGludWUgdW5sZXNzIGJ1ZmZlci5nZXRQYXRoKCkgaW4gZmlsZVBhdGhzXG4gICAgICAgIHJlcGxhY2VtZW50cyA9IGJ1ZmZlci5yZXBsYWNlKHJlZ2V4LCByZXBsYWNlbWVudFRleHQsIGl0ZXJhdG9yKVxuICAgICAgICBpdGVyYXRvcih7ZmlsZVBhdGg6IGJ1ZmZlci5nZXRQYXRoKCksIHJlcGxhY2VtZW50c30pIGlmIHJlcGxhY2VtZW50c1xuXG4gICAgICBpblByb2Nlc3NGaW5pc2hlZCA9IHRydWVcbiAgICAgIGNoZWNrRmluaXNoZWQoKVxuXG4gIGNoZWNrb3V0SGVhZFJldmlzaW9uOiAoZWRpdG9yKSAtPlxuICAgIGlmIGVkaXRvci5nZXRQYXRoKClcbiAgICAgIGNoZWNrb3V0SGVhZCA9ID0+XG4gICAgICAgIEBwcm9qZWN0LnJlcG9zaXRvcnlGb3JEaXJlY3RvcnkobmV3IERpcmVjdG9yeShlZGl0b3IuZ2V0RGlyZWN0b3J5UGF0aCgpKSlcbiAgICAgICAgICAudGhlbiAocmVwb3NpdG9yeSkgLT5cbiAgICAgICAgICAgIHJlcG9zaXRvcnk/LmNoZWNrb3V0SGVhZEZvckVkaXRvcihlZGl0b3IpXG5cbiAgICAgIGlmIEBjb25maWcuZ2V0KCdlZGl0b3IuY29uZmlybUNoZWNrb3V0SGVhZFJldmlzaW9uJylcbiAgICAgICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuY29uZmlybVxuICAgICAgICAgIG1lc3NhZ2U6ICdDb25maXJtIENoZWNrb3V0IEhFQUQgUmV2aXNpb24nXG4gICAgICAgICAgZGV0YWlsZWRNZXNzYWdlOiBcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkaXNjYXJkIGFsbCBjaGFuZ2VzIHRvIFxcXCIje2VkaXRvci5nZXRGaWxlTmFtZSgpfVxcXCIgc2luY2UgdGhlIGxhc3QgR2l0IGNvbW1pdD9cIlxuICAgICAgICAgIGJ1dHRvbnM6XG4gICAgICAgICAgICBPSzogY2hlY2tvdXRIZWFkXG4gICAgICAgICAgICBDYW5jZWw6IG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgY2hlY2tvdXRIZWFkKClcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoZmFsc2UpXG4iXX0=
