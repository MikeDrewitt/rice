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
      if ((uri != null) && (url.parse(uri).protocol == null)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3dvcmtzcGFjZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDhLQUFBO0lBQUE7Ozs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixHQUFBLEdBQU0sT0FBQSxDQUFRLEtBQVI7O0VBQ04sSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQTZDLE9BQUEsQ0FBUSxXQUFSLENBQTdDLEVBQUMscUJBQUQsRUFBVSwyQkFBVixFQUFzQjs7RUFDdEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLFlBQWEsT0FBQSxDQUFRLGFBQVI7O0VBQ2Qsd0JBQUEsR0FBMkIsT0FBQSxDQUFRLDhCQUFSOztFQUMzQixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxlQUFSOztFQUNiLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFXUCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxtQkFBQyxNQUFEOzs7O0FBQ1gsVUFBQTtNQUFBLDRDQUFBLFNBQUE7TUFHRSxJQUFDLENBQUEsd0JBQUEsY0FESCxFQUNtQixJQUFDLENBQUEsZ0JBQUEsTUFEcEIsRUFDNEIsSUFBQyxDQUFBLGlCQUFBLE9BRDdCLEVBQ3NDLElBQUMsQ0FBQSx5QkFBQSxlQUR2QyxFQUN3RCxJQUFDLENBQUEsNkJBQUEsbUJBRHpELEVBRUUsSUFBQyxDQUFBLHNCQUFBLFlBRkgsRUFFaUIsSUFBQyxDQUFBLHlCQUFB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UUFBQSxFQUFVLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBWDtnQkFBNkIsY0FBQSxZQUE3QjtlQUFULEVBQUE7O0FBSEY7VUFLQSxpQkFBQSxHQUFvQjtpQkFDcEIsYUFBQSxDQUFBO1FBMUJVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSO0lBREc7O3dCQTZCVCxvQkFBQSxHQUFzQixTQUFDLE1BQUQ7QUFDcEIsVUFBQTtNQUFBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUFIO1FBQ0UsWUFBQSxHQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ2IsS0FBQyxDQUFBLE9BQU8sQ0FBQyxzQkFBVCxDQUFvQyxJQUFBLFNBQUEsQ0FBVSxNQUFNLENBQUMsZ0JBQVAsQ0FBQSxDQUFWLENBQXBDLENBQ0UsQ0FBQyxJQURILENBQ1EsU0FBQyxVQUFEOzBDQUNKLFVBQVUsQ0FBRSxxQkFBWixDQUFrQyxNQUFsQztZQURJLENBRFI7VUFEYTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFLZixJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFZLG9DQUFaLENBQUg7aUJBQ0UsSUFBQyxDQUFBLG1CQUFtQixDQUFDLE9BQXJCLENBQ0U7WUFBQSxPQUFBLEVBQVMsZ0NBQVQ7WUFDQSxlQUFBLEVBQWlCLG9EQUFBLEdBQW9ELENBQUMsTUFBTSxDQUFDLFdBQVAsQ0FBQSxDQUFELENBQXBELEdBQTBFLCtCQUQzRjtZQUVBLE9BQUEsRUFDRTtjQUFBLEVBQUEsRUFBSSxZQUFKO2NBQ0EsTUFBQSxFQUFRLElBRFI7YUFIRjtXQURGLEVBREY7U0FBQSxNQUFBO2lCQVFFLFlBQUEsQ0FBQSxFQVJGO1NBTkY7T0FBQSxNQUFBO2VBZ0JFLE9BQU8sQ0FBQyxPQUFSLENBQWdCLEtBQWhCLEVBaEJGOztJQURvQjs7OztLQXZqQ0E7QUF4QnhCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbnVybCA9IHJlcXVpcmUgJ3VybCdcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xue0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xue0RpcmVjdG9yeX0gPSByZXF1aXJlICdwYXRod2F0Y2hlcidcbkRlZmF1bHREaXJlY3RvcnlTZWFyY2hlciA9IHJlcXVpcmUgJy4vZGVmYXVsdC1kaXJlY3Rvcnktc2VhcmNoZXInXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi90ZXh0LWVkaXRvcidcblBhbmVDb250YWluZXIgPSByZXF1aXJlICcuL3BhbmUtY29udGFpbmVyJ1xuUGFuZWwgPSByZXF1aXJlICcuL3BhbmVsJ1xuUGFuZWxDb250YWluZXIgPSByZXF1aXJlICcuL3BhbmVsLWNvbnRhaW5lcidcblRhc2sgPSByZXF1aXJlICcuL3Rhc2snXG5cbiMgRXNzZW50aWFsOiBSZXByZXNlbnRzIHRoZSBzdGF0ZSBvZiB0aGUgdXNlciBpbnRlcmZhY2UgZm9yIHRoZSBlbnRpcmUgd2luZG93LlxuIyBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGF2YWlsYWJsZSB2aWEgdGhlIGBhdG9tLndvcmtzcGFjZWAgZ2xvYmFsLlxuI1xuIyBJbnRlcmFjdCB3aXRoIHRoaXMgb2JqZWN0IHRvIG9wZW4gZmlsZXMsIGJlIG5vdGlmaWVkIG9mIGN1cnJlbnQgYW5kIGZ1dHVyZVxuIyBlZGl0b3JzLCBhbmQgbWFuaXB1bGF0ZSBwYW5lcy4gVG8gYWRkIHBhbmVscywgdXNlIHtXb3Jrc3BhY2U6OmFkZFRvcFBhbmVsfVxuIyBhbmQgZnJpZW5kcy5cbiNcbiMgKiBgZWRpdG9yYCB7VGV4dEVkaXRvcn0gdGhlIG5ldyBlZGl0b3JcbiNcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFdvcmtzcGFjZSBleHRlbmRzIE1vZGVsXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHN1cGVyXG5cbiAgICB7XG4gICAgICBAcGFja2FnZU1hbmFnZXIsIEBjb25maWcsIEBwcm9qZWN0LCBAZ3JhbW1hclJlZ2lzdHJ5LCBAbm90aWZpY2F0aW9uTWFuYWdlcixcbiAgICAgIEB2aWV3UmVnaXN0cnksIEBncmFtbWFyUmVnaXN0cnksIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCBAYXNzZXJ0LFxuICAgICAgQGRlc2VyaWFsaXplck1hbmFnZXIsIEB0ZXh0RWRpdG9yUmVnaXN0cnlcbiAgICB9ID0gcGFyYW1zXG5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQG9wZW5lcnMgPSBbXVxuICAgIEBkZXN0cm95ZWRJdGVtVVJJcyA9IFtdXG5cbiAgICBAcGFuZUNvbnRhaW5lciA9IG5ldyBQYW5lQ29udGFpbmVyKHtAY29uZmlnLCBAYXBwbGljYXRpb25EZWxlZ2F0ZSwgQG5vdGlmaWNhdGlvbk1hbmFnZXIsIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyfSlcbiAgICBAcGFuZUNvbnRhaW5lci5vbkRpZERlc3Ryb3lQYW5lSXRlbShAZGlkRGVzdHJveVBhbmVJdGVtKVxuXG4gICAgQGRlZmF1bHREaXJlY3RvcnlTZWFyY2hlciA9IG5ldyBEZWZhdWx0RGlyZWN0b3J5U2VhcmNoZXIoKVxuICAgIEBjb25zdW1lU2VydmljZXMoQHBhY2thZ2VNYW5hZ2VyKVxuXG4gICAgIyBPbmUgY2Fubm90IHNpbXBseSAuYmluZCBoZXJlIHNpbmNlIGl0IGNvdWxkIGJlIHVzZWQgYXMgYSBjb21wb25lbnQgd2l0aFxuICAgICMgRXRjaCwgaW4gd2hpY2ggY2FzZSBpdCdkIGJlIGBuZXdgZC4gQW5kIHdoZW4gaXQncyBgbmV3YGQsIGB0aGlzYCBpcyBhbHdheXNcbiAgICAjIHRoZSBuZXdseSBjcmVhdGVkIG9iamVjdC5cbiAgICByZWFsVGhpcyA9IHRoaXNcbiAgICBAYnVpbGRUZXh0RWRpdG9yID0gLT4gV29ya3NwYWNlLnByb3RvdHlwZS5idWlsZFRleHRFZGl0b3IuYXBwbHkocmVhbFRoaXMsIGFyZ3VtZW50cylcblxuICAgIEBwYW5lbENvbnRhaW5lcnMgPVxuICAgICAgdG9wOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAndG9wJ30pXG4gICAgICBsZWZ0OiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnbGVmdCd9KVxuICAgICAgcmlnaHQ6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdyaWdodCd9KVxuICAgICAgYm90dG9tOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnYm90dG9tJ30pXG4gICAgICBoZWFkZXI6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdoZWFkZXInfSlcbiAgICAgIGZvb3RlcjogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2Zvb3Rlcid9KVxuICAgICAgbW9kYWw6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdtb2RhbCd9KVxuXG4gICAgQHN1YnNjcmliZVRvRXZlbnRzKClcblxuICByZXNldDogKEBwYWNrYWdlTWFuYWdlcikgLT5cbiAgICBAZW1pdHRlci5kaXNwb3NlKClcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICBAcGFuZUNvbnRhaW5lci5kZXN0cm95KClcbiAgICBwYW5lbENvbnRhaW5lci5kZXN0cm95KCkgZm9yIHBhbmVsQ29udGFpbmVyIGluIEBwYW5lbENvbnRhaW5lcnNcblxuICAgIEBwYW5lQ29udGFpbmVyID0gbmV3IFBhbmVDb250YWluZXIoe0Bjb25maWcsIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGRlc2VyaWFsaXplck1hbmFnZXJ9KVxuICAgIEBwYW5lQ29udGFpbmVyLm9uRGlkRGVzdHJveVBhbmVJdGVtKEBkaWREZXN0cm95UGFuZUl0ZW0pXG5cbiAgICBAcGFuZWxDb250YWluZXJzID1cbiAgICAgIHRvcDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ3RvcCd9KVxuICAgICAgbGVmdDogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2xlZnQnfSlcbiAgICAgIHJpZ2h0OiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAncmlnaHQnfSlcbiAgICAgIGJvdHRvbTogbmV3IFBhbmVsQ29udGFpbmVyKHtsb2NhdGlvbjogJ2JvdHRvbSd9KVxuICAgICAgaGVhZGVyOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnaGVhZGVyJ30pXG4gICAgICBmb290ZXI6IG5ldyBQYW5lbENvbnRhaW5lcih7bG9jYXRpb246ICdmb290ZXInfSlcbiAgICAgIG1vZGFsOiBuZXcgUGFuZWxDb250YWluZXIoe2xvY2F0aW9uOiAnbW9kYWwnfSlcblxuICAgIEBvcmlnaW5hbEZvbnRTaXplID0gbnVsbFxuICAgIEBvcGVuZXJzID0gW11cbiAgICBAZGVzdHJveWVkSXRlbVVSSXMgPSBbXVxuICAgIEBjb25zdW1lU2VydmljZXMoQHBhY2thZ2VNYW5hZ2VyKVxuXG4gIHN1YnNjcmliZVRvRXZlbnRzOiAtPlxuICAgIEBzdWJzY3JpYmVUb0FjdGl2ZUl0ZW0oKVxuICAgIEBzdWJzY3JpYmVUb0ZvbnRTaXplKClcbiAgICBAc3Vic2NyaWJlVG9BZGRlZEl0ZW1zKClcblxuICBjb25zdW1lU2VydmljZXM6ICh7c2VydmljZUh1Yn0pIC0+XG4gICAgQGRpcmVjdG9yeVNlYXJjaGVycyA9IFtdXG4gICAgc2VydmljZUh1Yi5jb25zdW1lKFxuICAgICAgJ2F0b20uZGlyZWN0b3J5LXNlYXJjaGVyJyxcbiAgICAgICdeMC4xLjAnLFxuICAgICAgKHByb3ZpZGVyKSA9PiBAZGlyZWN0b3J5U2VhcmNoZXJzLnVuc2hpZnQocHJvdmlkZXIpKVxuXG4gICMgQ2FsbGVkIGJ5IHRoZSBTZXJpYWxpemFibGUgbWl4aW4gZHVyaW5nIHNlcmlhbGl6YXRpb24uXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkZXNlcmlhbGl6ZXI6ICdXb3Jrc3BhY2UnXG4gICAgcGFuZUNvbnRhaW5lcjogQHBhbmVDb250YWluZXIuc2VyaWFsaXplKClcbiAgICBwYWNrYWdlc1dpdGhBY3RpdmVHcmFtbWFyczogQGdldFBhY2thZ2VOYW1lc1dpdGhBY3RpdmVHcmFtbWFycygpXG4gICAgZGVzdHJveWVkSXRlbVVSSXM6IEBkZXN0cm95ZWRJdGVtVVJJcy5zbGljZSgpXG5cbiAgZGVzZXJpYWxpemU6IChzdGF0ZSwgZGVzZXJpYWxpemVyTWFuYWdlcikgLT5cbiAgICBmb3IgcGFja2FnZU5hbWUgaW4gc3RhdGUucGFja2FnZXNXaXRoQWN0aXZlR3JhbW1hcnMgPyBbXVxuICAgICAgQHBhY2thZ2VNYW5hZ2VyLmdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5sb2FkR3JhbW1hcnNTeW5jKClcbiAgICBpZiBzdGF0ZS5kZXN0cm95ZWRJdGVtVVJJcz9cbiAgICAgIEBkZXN0cm95ZWRJdGVtVVJJcyA9IHN0YXRlLmRlc3Ryb3llZEl0ZW1VUklzXG4gICAgQHBhbmVDb250YWluZXIuZGVzZXJpYWxpemUoc3RhdGUucGFuZUNvbnRhaW5lciwgZGVzZXJpYWxpemVyTWFuYWdlcilcblxuICBnZXRQYWNrYWdlTmFtZXNXaXRoQWN0aXZlR3JhbW1hcnM6IC0+XG4gICAgcGFja2FnZU5hbWVzID0gW11cbiAgICBhZGRHcmFtbWFyID0gKHtpbmNsdWRlZEdyYW1tYXJTY29wZXMsIHBhY2thZ2VOYW1lfT17fSkgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgcGFja2FnZU5hbWVcbiAgICAgICMgUHJldmVudCBjeWNsZXNcbiAgICAgIHJldHVybiBpZiBwYWNrYWdlTmFtZXMuaW5kZXhPZihwYWNrYWdlTmFtZSkgaXNudCAtMVxuXG4gICAgICBwYWNrYWdlTmFtZXMucHVzaChwYWNrYWdlTmFtZSlcbiAgICAgIGZvciBzY29wZU5hbWUgaW4gaW5jbHVkZWRHcmFtbWFyU2NvcGVzID8gW11cbiAgICAgICAgYWRkR3JhbW1hcihAZ3JhbW1hclJlZ2lzdHJ5LmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGVOYW1lKSlcbiAgICAgIHJldHVyblxuXG4gICAgZWRpdG9ycyA9IEBnZXRUZXh0RWRpdG9ycygpXG4gICAgYWRkR3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKSBmb3IgZWRpdG9yIGluIGVkaXRvcnNcblxuICAgIGlmIGVkaXRvcnMubGVuZ3RoID4gMFxuICAgICAgZm9yIGdyYW1tYXIgaW4gQGdyYW1tYXJSZWdpc3RyeS5nZXRHcmFtbWFycygpIHdoZW4gZ3JhbW1hci5pbmplY3Rpb25TZWxlY3RvclxuICAgICAgICBhZGRHcmFtbWFyKGdyYW1tYXIpXG5cbiAgICBfLnVuaXEocGFja2FnZU5hbWVzKVxuXG4gIHN1YnNjcmliZVRvQWN0aXZlSXRlbTogLT5cbiAgICBAdXBkYXRlV2luZG93VGl0bGUoKVxuICAgIEB1cGRhdGVEb2N1bWVudEVkaXRlZCgpXG4gICAgQHByb2plY3Qub25EaWRDaGFuZ2VQYXRocyBAdXBkYXRlV2luZG93VGl0bGVcblxuICAgIEBvYnNlcnZlQWN0aXZlUGFuZUl0ZW0gKGl0ZW0pID0+XG4gICAgICBAdXBkYXRlV2luZG93VGl0bGUoKVxuICAgICAgQHVwZGF0ZURvY3VtZW50RWRpdGVkKClcblxuICAgICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICAgIGlmIHR5cGVvZiBpdGVtPy5vbkRpZENoYW5nZVRpdGxlIGlzICdmdW5jdGlvbidcbiAgICAgICAgdGl0bGVTdWJzY3JpcHRpb24gPSBpdGVtLm9uRGlkQ2hhbmdlVGl0bGUoQHVwZGF0ZVdpbmRvd1RpdGxlKVxuICAgICAgZWxzZSBpZiB0eXBlb2YgaXRlbT8ub24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICB0aXRsZVN1YnNjcmlwdGlvbiA9IGl0ZW0ub24oJ3RpdGxlLWNoYW5nZWQnLCBAdXBkYXRlV2luZG93VGl0bGUpXG4gICAgICAgIHVubGVzcyB0eXBlb2YgdGl0bGVTdWJzY3JpcHRpb24/LmRpc3Bvc2UgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHRpdGxlU3Vic2NyaXB0aW9uID0gbmV3IERpc3Bvc2FibGUgPT4gaXRlbS5vZmYoJ3RpdGxlLWNoYW5nZWQnLCBAdXBkYXRlV2luZG93VGl0bGUpXG5cbiAgICAgIGlmIHR5cGVvZiBpdGVtPy5vbkRpZENoYW5nZU1vZGlmaWVkIGlzICdmdW5jdGlvbidcbiAgICAgICAgbW9kaWZpZWRTdWJzY3JpcHRpb24gPSBpdGVtLm9uRGlkQ2hhbmdlTW9kaWZpZWQoQHVwZGF0ZURvY3VtZW50RWRpdGVkKVxuICAgICAgZWxzZSBpZiB0eXBlb2YgaXRlbT8ub24/IGlzICdmdW5jdGlvbidcbiAgICAgICAgbW9kaWZpZWRTdWJzY3JpcHRpb24gPSBpdGVtLm9uKCdtb2RpZmllZC1zdGF0dXMtY2hhbmdlZCcsIEB1cGRhdGVEb2N1bWVudEVkaXRlZClcbiAgICAgICAgdW5sZXNzIHR5cGVvZiBtb2RpZmllZFN1YnNjcmlwdGlvbj8uZGlzcG9zZSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgbW9kaWZpZWRTdWJzY3JpcHRpb24gPSBuZXcgRGlzcG9zYWJsZSA9PiBpdGVtLm9mZignbW9kaWZpZWQtc3RhdHVzLWNoYW5nZWQnLCBAdXBkYXRlRG9jdW1lbnRFZGl0ZWQpXG5cbiAgICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9ucy5hZGQodGl0bGVTdWJzY3JpcHRpb24pIGlmIHRpdGxlU3Vic2NyaXB0aW9uP1xuICAgICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb25zLmFkZChtb2RpZmllZFN1YnNjcmlwdGlvbikgaWYgbW9kaWZpZWRTdWJzY3JpcHRpb24/XG5cbiAgc3Vic2NyaWJlVG9BZGRlZEl0ZW1zOiAtPlxuICAgIEBvbkRpZEFkZFBhbmVJdGVtICh7aXRlbSwgcGFuZSwgaW5kZXh9KSA9PlxuICAgICAgaWYgaXRlbSBpbnN0YW5jZW9mIFRleHRFZGl0b3JcbiAgICAgICAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKFxuICAgICAgICAgIEB0ZXh0RWRpdG9yUmVnaXN0cnkuYWRkKGl0ZW0pXG4gICAgICAgICAgQHRleHRFZGl0b3JSZWdpc3RyeS5tYWludGFpbkdyYW1tYXIoaXRlbSlcbiAgICAgICAgICBAdGV4dEVkaXRvclJlZ2lzdHJ5Lm1haW50YWluQ29uZmlnKGl0ZW0pXG4gICAgICAgICAgaXRlbS5vYnNlcnZlR3JhbW1hcihAaGFuZGxlR3JhbW1hclVzZWQuYmluZCh0aGlzKSlcbiAgICAgICAgKVxuICAgICAgICBpdGVtLm9uRGlkRGVzdHJveSAtPiBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLXRleHQtZWRpdG9yJywge3RleHRFZGl0b3I6IGl0ZW0sIHBhbmUsIGluZGV4fVxuXG4gICMgVXBkYXRlcyB0aGUgYXBwbGljYXRpb24ncyB0aXRsZSBhbmQgcHJveHkgaWNvbiBiYXNlZCBvbiB3aGljaGV2ZXIgZmlsZSBpc1xuICAjIG9wZW4uXG4gIHVwZGF0ZVdpbmRvd1RpdGxlOiA9PlxuICAgIGFwcE5hbWUgPSAnQXRvbSdcbiAgICBwcm9qZWN0UGF0aHMgPSBAcHJvamVjdC5nZXRQYXRocygpID8gW11cbiAgICBpZiBpdGVtID0gQGdldEFjdGl2ZVBhbmVJdGVtKClcbiAgICAgIGl0ZW1QYXRoID0gaXRlbS5nZXRQYXRoPygpXG4gICAgICBpdGVtVGl0bGUgPSBpdGVtLmdldExvbmdUaXRsZT8oKSA/IGl0ZW0uZ2V0VGl0bGU/KClcbiAgICAgIHByb2plY3RQYXRoID0gXy5maW5kIHByb2plY3RQYXRocywgKHByb2plY3RQYXRoKSAtPlxuICAgICAgICBpdGVtUGF0aCBpcyBwcm9qZWN0UGF0aCBvciBpdGVtUGF0aD8uc3RhcnRzV2l0aChwcm9qZWN0UGF0aCArIHBhdGguc2VwKVxuICAgIGl0ZW1UaXRsZSA/PSBcInVudGl0bGVkXCJcbiAgICBwcm9qZWN0UGF0aCA/PSBwcm9qZWN0UGF0aHNbMF1cbiAgICBpZiBwcm9qZWN0UGF0aD9cbiAgICAgIHByb2plY3RQYXRoID0gZnMudGlsZGlmeShwcm9qZWN0UGF0aClcblxuICAgIHRpdGxlUGFydHMgPSBbXVxuICAgIGlmIGl0ZW0/IGFuZCBwcm9qZWN0UGF0aD9cbiAgICAgIHRpdGxlUGFydHMucHVzaCBpdGVtVGl0bGUsIHByb2plY3RQYXRoXG4gICAgICByZXByZXNlbnRlZFBhdGggPSBpdGVtUGF0aCA/IHByb2plY3RQYXRoXG4gICAgZWxzZSBpZiBwcm9qZWN0UGF0aD9cbiAgICAgIHRpdGxlUGFydHMucHVzaCBwcm9qZWN0UGF0aFxuICAgICAgcmVwcmVzZW50ZWRQYXRoID0gcHJvamVjdFBhdGhcbiAgICBlbHNlXG4gICAgICB0aXRsZVBhcnRzLnB1c2ggaXRlbVRpdGxlXG4gICAgICByZXByZXNlbnRlZFBhdGggPSBcIlwiXG5cbiAgICB1bmxlc3MgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuICAgICAgdGl0bGVQYXJ0cy5wdXNoIGFwcE5hbWVcblxuICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGVQYXJ0cy5qb2luKFwiIFxcdTIwMTQgXCIpXG4gICAgQGFwcGxpY2F0aW9uRGVsZWdhdGUuc2V0UmVwcmVzZW50ZWRGaWxlbmFtZShyZXByZXNlbnRlZFBhdGgpXG5cbiAgIyBPbiBtYWNPUywgZmFkZXMgdGhlIGFwcGxpY2F0aW9uIHdpbmRvdydzIHByb3h5IGljb24gd2hlbiB0aGUgY3VycmVudCBmaWxlXG4gICMgaGFzIGJlZW4gbW9kaWZpZWQuXG4gIHVwZGF0ZURvY3VtZW50RWRpdGVkOiA9PlxuICAgIG1vZGlmaWVkID0gQGdldEFjdGl2ZVBhbmVJdGVtKCk/LmlzTW9kaWZpZWQ/KCkgPyBmYWxzZVxuICAgIEBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd0RvY3VtZW50RWRpdGVkKG1vZGlmaWVkKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCBhbGwgY3VycmVudCBhbmQgZnV0dXJlIHRleHRcbiAgIyBlZGl0b3JzIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCBjdXJyZW50IGFuZCBmdXR1cmUgdGV4dCBlZGl0b3JzLlxuICAjICAgKiBgZWRpdG9yYCBBbiB7VGV4dEVkaXRvcn0gdGhhdCBpcyBwcmVzZW50IGluIHs6OmdldFRleHRFZGl0b3JzfSBhdCB0aGUgdGltZVxuICAjICAgICBvZiBzdWJzY3JpcHRpb24gb3IgdGhhdCBpcyBhZGRlZCBhdCBzb21lIGxhdGVyIHRpbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlVGV4dEVkaXRvcnM6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayh0ZXh0RWRpdG9yKSBmb3IgdGV4dEVkaXRvciBpbiBAZ2V0VGV4dEVkaXRvcnMoKVxuICAgIEBvbkRpZEFkZFRleHRFZGl0b3IgKHt0ZXh0RWRpdG9yfSkgLT4gY2FsbGJhY2sodGV4dEVkaXRvcilcblxuICAjIEVzc2VudGlhbDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aXRoIGFsbCBjdXJyZW50IGFuZCBmdXR1cmUgcGFuZXMgaXRlbXNcbiAgIyBpbiB0aGUgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggY3VycmVudCBhbmQgZnV0dXJlIHBhbmUgaXRlbXMuXG4gICMgICAqIGBpdGVtYCBBbiBpdGVtIHRoYXQgaXMgcHJlc2VudCBpbiB7OjpnZXRQYW5lSXRlbXN9IGF0IHRoZSB0aW1lIG9mXG4gICMgICAgICBzdWJzY3JpcHRpb24gb3IgdGhhdCBpcyBhZGRlZCBhdCBzb21lIGxhdGVyIHRpbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlUGFuZUl0ZW1zOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9ic2VydmVQYW5lSXRlbXMoY2FsbGJhY2spXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgYWN0aXZlIHBhbmUgaXRlbSBjaGFuZ2VzLlxuICAjXG4gICMgQmVjYXVzZSBvYnNlcnZlcnMgYXJlIGludm9rZWQgc3luY2hyb25vdXNseSwgaXQncyBpbXBvcnRhbnQgbm90IHRvIHBlcmZvcm1cbiAgIyBhbnkgZXhwZW5zaXZlIG9wZXJhdGlvbnMgdmlhIHRoaXMgbWV0aG9kLiBDb25zaWRlclxuICAjIHs6Om9uRGlkU3RvcENoYW5naW5nQWN0aXZlUGFuZUl0ZW19IHRvIGRlbGF5IG9wZXJhdGlvbnMgdW50aWwgYWZ0ZXIgY2hhbmdlc1xuICAjIHN0b3Agb2NjdXJyaW5nLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGFjdGl2ZSBwYW5lIGl0ZW0gY2hhbmdlcy5cbiAgIyAgICogYGl0ZW1gIFRoZSBhY3RpdmUgcGFuZSBpdGVtLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIEBwYW5lQ29udGFpbmVyLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0oY2FsbGJhY2spXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgYWN0aXZlIHBhbmUgaXRlbSBzdG9wc1xuICAjIGNoYW5naW5nLlxuICAjXG4gICMgT2JzZXJ2ZXJzIGFyZSBjYWxsZWQgYXN5bmNocm9ub3VzbHkgMTAwbXMgYWZ0ZXIgdGhlIGxhc3QgYWN0aXZlIHBhbmUgaXRlbVxuICAjIGNoYW5nZS4gSGFuZGxpbmcgY2hhbmdlcyBoZXJlIHJhdGhlciB0aGFuIGluIHRoZSBzeW5jaHJvbm91c1xuICAjIHs6Om9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW19IHByZXZlbnRzIHVubmVlZGVkIHdvcmsgaWYgdGhlIHVzZXIgaXMgcXVpY2tseVxuICAjIGNoYW5naW5nIG9yIGNsb3NpbmcgdGFicyBhbmQgZW5zdXJlcyBjcml0aWNhbCBVSSBmZWVkYmFjaywgbGlrZSBjaGFuZ2luZyB0aGVcbiAgIyBoaWdobGlnaHRlZCB0YWIsIGdldHMgcHJpb3JpdHkgb3ZlciB3b3JrIHRoYXQgY2FuIGJlIGRvbmUgYXN5bmNocm9ub3VzbHkuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYWN0aXZlIHBhbmUgaXRlbSBzdG9wdHNcbiAgIyAgIGNoYW5naW5nLlxuICAjICAgKiBgaXRlbWAgVGhlIGFjdGl2ZSBwYW5lIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZFN0b3BDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtOiAoY2FsbGJhY2spIC0+XG4gICAgQHBhbmVDb250YWluZXIub25EaWRTdG9wQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbShjYWxsYmFjaylcblxuICAjIEVzc2VudGlhbDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aXRoIHRoZSBjdXJyZW50IGFjdGl2ZSBwYW5lIGl0ZW0gYW5kXG4gICMgd2l0aCBhbGwgZnV0dXJlIGFjdGl2ZSBwYW5lIGl0ZW1zIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYWN0aXZlIHBhbmUgaXRlbSBjaGFuZ2VzLlxuICAjICAgKiBgaXRlbWAgVGhlIGN1cnJlbnQgYWN0aXZlIHBhbmUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVBY3RpdmVQYW5lSXRlbTogKGNhbGxiYWNrKSAtPiBAcGFuZUNvbnRhaW5lci5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oY2FsbGJhY2spXG5cbiAgIyBFc3NlbnRpYWw6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbmV2ZXIgYW4gaXRlbSBpcyBvcGVuZWQuIFVubGlrZVxuICAjIHs6Om9uRGlkQWRkUGFuZUl0ZW19LCBvYnNlcnZlcnMgd2lsbCBiZSBub3RpZmllZCBmb3IgaXRlbXMgdGhhdCBhcmUgYWxyZWFkeVxuICAjIHByZXNlbnQgaW4gdGhlIHdvcmtzcGFjZSB3aGVuIHRoZXkgYXJlIHJlb3BlbmVkLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW5ldmVyIGFuIGl0ZW0gaXMgb3BlbmVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGB1cmlgIHtTdHJpbmd9IHJlcHJlc2VudGluZyB0aGUgb3BlbmVkIFVSSS4gQ291bGQgYmUgYHVuZGVmaW5lZGAuXG4gICMgICAgICogYGl0ZW1gIFRoZSBvcGVuZWQgaXRlbS5cbiAgIyAgICAgKiBgcGFuZWAgVGhlIHBhbmUgaW4gd2hpY2ggdGhlIGl0ZW0gd2FzIG9wZW5lZC5cbiAgIyAgICAgKiBgaW5kZXhgIFRoZSBpbmRleCBvZiB0aGUgb3BlbmVkIGl0ZW0gb24gaXRzIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZE9wZW46IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLW9wZW4nLCBjYWxsYmFja1xuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhbmUgaXMgYWRkZWQgdG8gdGhlIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBwYW5lcyBhcmUgYWRkZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYHBhbmVgIFRoZSBhZGRlZCBwYW5lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBZGRQYW5lOiAoY2FsbGJhY2spIC0+IEBwYW5lQ29udGFpbmVyLm9uRGlkQWRkUGFuZShjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIGJlZm9yZSBhIHBhbmUgaXMgZGVzdHJveWVkIGluIHRoZVxuICAjIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBiZWZvcmUgcGFuZXMgYXJlIGRlc3Ryb3llZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgcGFuZWAgVGhlIHBhbmUgdG8gYmUgZGVzdHJveWVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25XaWxsRGVzdHJveVBhbmU6IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25XaWxsRGVzdHJveVBhbmUoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgcGFuZSBpcyBkZXN0cm95ZWQgaW4gdGhlXG4gICMgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHBhbmVzIGFyZSBkZXN0cm95ZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYHBhbmVgIFRoZSBkZXN0cm95ZWQgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveVBhbmU6IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25EaWREZXN0cm95UGFuZShjYWxsYmFjaylcblxuICAjIEV4dGVuZGVkOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggYWxsIGN1cnJlbnQgYW5kIGZ1dHVyZSBwYW5lcyBpbiB0aGVcbiAgIyB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCBjdXJyZW50IGFuZCBmdXR1cmUgcGFuZXMuXG4gICMgICAqIGBwYW5lYCBBIHtQYW5lfSB0aGF0IGlzIHByZXNlbnQgaW4gezo6Z2V0UGFuZXN9IGF0IHRoZSB0aW1lIG9mXG4gICMgICAgICBzdWJzY3JpcHRpb24gb3IgdGhhdCBpcyBhZGRlZCBhdCBzb21lIGxhdGVyIHRpbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlUGFuZXM6IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub2JzZXJ2ZVBhbmVzKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgYWN0aXZlIHBhbmUgY2hhbmdlcy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBhY3RpdmUgcGFuZSBjaGFuZ2VzLlxuICAjICAgKiBgcGFuZWAgQSB7UGFuZX0gdGhhdCBpcyB0aGUgY3VycmVudCByZXR1cm4gdmFsdWUgb2Ygezo6Z2V0QWN0aXZlUGFuZX0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZUFjdGl2ZVBhbmU6IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25EaWRDaGFuZ2VBY3RpdmVQYW5lKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCB0aGUgY3VycmVudCBhY3RpdmUgcGFuZSBhbmQgd2hlblxuICAjIHRoZSBhY3RpdmUgcGFuZSBjaGFuZ2VzLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSBhY3RpdmUjXG4gICMgICBwYW5lcy5cbiAgIyAgICogYHBhbmVgIEEge1BhbmV9IHRoYXQgaXMgdGhlIGN1cnJlbnQgcmV0dXJuIHZhbHVlIG9mIHs6OmdldEFjdGl2ZVBhbmV9LlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZUFjdGl2ZVBhbmU6IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub2JzZXJ2ZUFjdGl2ZVBhbmUoY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgcGFuZSBpdGVtIGlzIGFkZGVkIHRvIHRoZVxuICAjIHdvcmtzcGFjZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHBhbmUgaXRlbXMgYXJlIGFkZGVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGBpdGVtYCBUaGUgYWRkZWQgcGFuZSBpdGVtLlxuICAjICAgICAqIGBwYW5lYCB7UGFuZX0gY29udGFpbmluZyB0aGUgYWRkZWQgaXRlbS5cbiAgIyAgICAgKiBgaW5kZXhgIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhlIGluZGV4IG9mIHRoZSBhZGRlZCBpdGVtIGluIGl0cyBwYW5lLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBZGRQYW5lSXRlbTogKGNhbGxiYWNrKSAtPiBAcGFuZUNvbnRhaW5lci5vbkRpZEFkZFBhbmVJdGVtKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhbmUgaXRlbSBpcyBhYm91dCB0byBiZVxuICAjIGRlc3Ryb3llZCwgYmVmb3JlIHRoZSB1c2VyIGlzIHByb21wdGVkIHRvIHNhdmUgaXQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgYmVmb3JlIHBhbmUgaXRlbXMgYXJlIGRlc3Ryb3llZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIGl0ZW0gdG8gYmUgZGVzdHJveWVkLlxuICAjICAgICAqIGBwYW5lYCB7UGFuZX0gY29udGFpbmluZyB0aGUgaXRlbSB0byBiZSBkZXN0cm95ZWQuXG4gICMgICAgICogYGluZGV4YCB7TnVtYmVyfSBpbmRpY2F0aW5nIHRoZSBpbmRleCBvZiB0aGUgaXRlbSB0byBiZSBkZXN0cm95ZWQgaW5cbiAgIyAgICAgICBpdHMgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbldpbGxEZXN0cm95UGFuZUl0ZW06IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25XaWxsRGVzdHJveVBhbmVJdGVtKGNhbGxiYWNrKVxuXG4gICMgRXh0ZW5kZWQ6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiBhIHBhbmUgaXRlbSBpcyBkZXN0cm95ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiBwYW5lIGl0ZW1zIGFyZSBkZXN0cm95ZWQuXG4gICMgICAqIGBldmVudGAge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAgICogYGl0ZW1gIFRoZSBkZXN0cm95ZWQgaXRlbS5cbiAgIyAgICAgKiBgcGFuZWAge1BhbmV9IGNvbnRhaW5pbmcgdGhlIGRlc3Ryb3llZCBpdGVtLlxuICAjICAgICAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB0aGUgaW5kZXggb2YgdGhlIGRlc3Ryb3llZCBpdGVtIGluIGl0c1xuICAjICAgICAgIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWREZXN0cm95UGFuZUl0ZW06IChjYWxsYmFjaykgLT4gQHBhbmVDb250YWluZXIub25EaWREZXN0cm95UGFuZUl0ZW0oY2FsbGJhY2spXG5cbiAgIyBFeHRlbmRlZDogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGEgdGV4dCBlZGl0b3IgaXMgYWRkZWQgdG8gdGhlXG4gICMgd29ya3NwYWNlLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHBhbmVzIGFyZSBhZGRlZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgdGV4dEVkaXRvcmAge1RleHRFZGl0b3J9IHRoYXQgd2FzIGFkZGVkLlxuICAjICAgICAqIGBwYW5lYCB7UGFuZX0gY29udGFpbmluZyB0aGUgYWRkZWQgdGV4dCBlZGl0b3IuXG4gICMgICAgICogYGluZGV4YCB7TnVtYmVyfSBpbmRpY2F0aW5nIHRoZSBpbmRleCBvZiB0aGUgYWRkZWQgdGV4dCBlZGl0b3IgaW4gaXRzXG4gICMgICAgICAgIHBhbmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZEFkZFRleHRFZGl0b3I6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC10ZXh0LWVkaXRvcicsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IE9wZW5pbmdcbiAgIyMjXG5cbiAgIyBFc3NlbnRpYWw6IE9wZW5zIHRoZSBnaXZlbiBVUkkgaW4gQXRvbSBhc3luY2hyb25vdXNseS5cbiAgIyBJZiB0aGUgVVJJIGlzIGFscmVhZHkgb3BlbiwgdGhlIGV4aXN0aW5nIGl0ZW0gZm9yIHRoYXQgVVJJIHdpbGwgYmVcbiAgIyBhY3RpdmF0ZWQuIElmIG5vIFVSSSBpcyBnaXZlbiwgb3Igbm8gcmVnaXN0ZXJlZCBvcGVuZXIgY2FuIG9wZW5cbiAgIyB0aGUgVVJJLCBhIG5ldyBlbXB0eSB7VGV4dEVkaXRvcn0gd2lsbCBiZSBjcmVhdGVkLlxuICAjXG4gICMgKiBgdXJpYCAob3B0aW9uYWwpIEEge1N0cmluZ30gY29udGFpbmluZyBhIFVSSS5cbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBpbml0aWFsTGluZWAgQSB7TnVtYmVyfSBpbmRpY2F0aW5nIHdoaWNoIHJvdyB0byBtb3ZlIHRoZSBjdXJzb3IgdG9cbiAgIyAgICAgaW5pdGlhbGx5LiBEZWZhdWx0cyB0byBgMGAuXG4gICMgICAqIGBpbml0aWFsQ29sdW1uYCBBIHtOdW1iZXJ9IGluZGljYXRpbmcgd2hpY2ggY29sdW1uIHRvIG1vdmUgdGhlIGN1cnNvciB0b1xuICAjICAgICBpbml0aWFsbHkuIERlZmF1bHRzIHRvIGAwYC5cbiAgIyAgICogYHNwbGl0YCBFaXRoZXIgJ2xlZnQnLCAncmlnaHQnLCAndXAnIG9yICdkb3duJy5cbiAgIyAgICAgSWYgJ2xlZnQnLCB0aGUgaXRlbSB3aWxsIGJlIG9wZW5lZCBpbiBsZWZ0bW9zdCBwYW5lIG9mIHRoZSBjdXJyZW50IGFjdGl2ZSBwYW5lJ3Mgcm93LlxuICAjICAgICBJZiAncmlnaHQnLCB0aGUgaXRlbSB3aWxsIGJlIG9wZW5lZCBpbiB0aGUgcmlnaHRtb3N0IHBhbmUgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIHBhbmUncyByb3cuIElmIG9ubHkgb25lIHBhbmUgZXhpc3RzIGluIHRoZSByb3csIGEgbmV3IHBhbmUgd2lsbCBiZSBjcmVhdGVkLlxuICAjICAgICBJZiAndXAnLCB0aGUgaXRlbSB3aWxsIGJlIG9wZW5lZCBpbiB0b3Btb3N0IHBhbmUgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIHBhbmUncyBjb2x1bW4uXG4gICMgICAgIElmICdkb3duJywgdGhlIGl0ZW0gd2lsbCBiZSBvcGVuZWQgaW4gdGhlIGJvdHRvbW1vc3QgcGFuZSBvZiB0aGUgY3VycmVudCBhY3RpdmUgcGFuZSdzIGNvbHVtbi4gSWYgb25seSBvbmUgcGFuZSBleGlzdHMgaW4gdGhlIGNvbHVtbiwgYSBuZXcgcGFuZSB3aWxsIGJlIGNyZWF0ZWQuXG4gICMgICAqIGBhY3RpdmF0ZVBhbmVgIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjYWxsIHtQYW5lOjphY3RpdmF0ZX0gb25cbiAgIyAgICAgY29udGFpbmluZyBwYW5lLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICMgICAqIGBhY3RpdmF0ZUl0ZW1gIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjYWxsIHtQYW5lOjphY3RpdmF0ZUl0ZW19XG4gICMgICAgIG9uIGNvbnRhaW5pbmcgcGFuZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAjICAgKiBgcGVuZGluZ2AgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIG9yIG5vdCB0aGUgaXRlbSBzaG91bGQgYmUgb3BlbmVkXG4gICMgICAgIGluIGEgcGVuZGluZyBzdGF0ZS4gRXhpc3RpbmcgcGVuZGluZyBpdGVtcyBpbiBhIHBhbmUgYXJlIHJlcGxhY2VkIHdpdGhcbiAgIyAgICAgbmV3IHBlbmRpbmcgaXRlbXMgd2hlbiB0aGV5IGFyZSBvcGVuZWQuXG4gICMgICAqIGBzZWFyY2hBbGxQYW5lc2AgQSB7Qm9vbGVhbn0uIElmIGB0cnVlYCwgdGhlIHdvcmtzcGFjZSB3aWxsIGF0dGVtcHQgdG9cbiAgIyAgICAgYWN0aXZhdGUgYW4gZXhpc3RpbmcgaXRlbSBmb3IgdGhlIGdpdmVuIFVSSSBvbiBhbnkgcGFuZS5cbiAgIyAgICAgSWYgYGZhbHNlYCwgb25seSB0aGUgYWN0aXZlIHBhbmUgd2lsbCBiZSBzZWFyY2hlZCBmb3JcbiAgIyAgICAgYW4gZXhpc3RpbmcgaXRlbSBmb3IgdGhlIHNhbWUgVVJJLiBEZWZhdWx0cyB0byBgZmFsc2VgLlxuICAjXG4gICMgUmV0dXJucyBhIHtQcm9taXNlfSB0aGF0IHJlc29sdmVzIHRvIHRoZSB7VGV4dEVkaXRvcn0gZm9yIHRoZSBmaWxlIFVSSS5cbiAgb3BlbjogKHVyaSwgb3B0aW9ucz17fSkgLT5cbiAgICBzZWFyY2hBbGxQYW5lcyA9IG9wdGlvbnMuc2VhcmNoQWxsUGFuZXNcbiAgICBzcGxpdCA9IG9wdGlvbnMuc3BsaXRcbiAgICB1cmkgPSBAcHJvamVjdC5yZXNvbHZlUGF0aCh1cmkpXG5cbiAgICBpZiBub3QgYXRvbS5jb25maWcuZ2V0KCdjb3JlLmFsbG93UGVuZGluZ1BhbmVJdGVtcycpXG4gICAgICBvcHRpb25zLnBlbmRpbmcgPSBmYWxzZVxuXG4gICAgIyBBdm9pZCBhZGRpbmcgVVJMcyBhcyByZWNlbnQgZG9jdW1lbnRzIHRvIHdvcmstYXJvdW5kIHRoaXMgU3BvdGxpZ2h0IGNyYXNoOlxuICAgICMgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvMTAwNzFcbiAgICBpZiB1cmk/IGFuZCBub3QgdXJsLnBhcnNlKHVyaSkucHJvdG9jb2w/XG4gICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5hZGRSZWNlbnREb2N1bWVudCh1cmkpXG5cbiAgICBwYW5lID0gQHBhbmVDb250YWluZXIucGFuZUZvclVSSSh1cmkpIGlmIHNlYXJjaEFsbFBhbmVzXG4gICAgcGFuZSA/PSBzd2l0Y2ggc3BsaXRcbiAgICAgIHdoZW4gJ2xlZnQnXG4gICAgICAgIEBnZXRBY3RpdmVQYW5lKCkuZmluZExlZnRtb3N0U2libGluZygpXG4gICAgICB3aGVuICdyaWdodCdcbiAgICAgICAgQGdldEFjdGl2ZVBhbmUoKS5maW5kT3JDcmVhdGVSaWdodG1vc3RTaWJsaW5nKClcbiAgICAgIHdoZW4gJ3VwJ1xuICAgICAgICBAZ2V0QWN0aXZlUGFuZSgpLmZpbmRUb3Btb3N0U2libGluZygpXG4gICAgICB3aGVuICdkb3duJ1xuICAgICAgICBAZ2V0QWN0aXZlUGFuZSgpLmZpbmRPckNyZWF0ZUJvdHRvbW1vc3RTaWJsaW5nKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGdldEFjdGl2ZVBhbmUoKVxuXG4gICAgQG9wZW5VUklJblBhbmUodXJpLCBwYW5lLCBvcHRpb25zKVxuXG4gICMgT3BlbiBBdG9tJ3MgbGljZW5zZSBpbiB0aGUgYWN0aXZlIHBhbmUuXG4gIG9wZW5MaWNlbnNlOiAtPlxuICAgIEBvcGVuKHBhdGguam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsICdMSUNFTlNFLm1kJykpXG5cbiAgIyBTeW5jaHJvbm91c2x5IG9wZW4gdGhlIGdpdmVuIFVSSSBpbiB0aGUgYWN0aXZlIHBhbmUuICoqT25seSB1c2UgdGhpcyBtZXRob2RcbiAgIyBpbiBzcGVjcy4gQ2FsbGluZyB0aGlzIGluIHByb2R1Y3Rpb24gY29kZSB3aWxsIGJsb2NrIHRoZSBVSSB0aHJlYWQgYW5kXG4gICMgZXZlcnlvbmUgd2lsbCBiZSBtYWQgYXQgeW91LioqXG4gICNcbiAgIyAqIGB1cmlgIEEge1N0cmluZ30gY29udGFpbmluZyBhIFVSSS5cbiAgIyAqIGBvcHRpb25zYCBBbiBvcHRpb25hbCBvcHRpb25zIHtPYmplY3R9XG4gICMgICAqIGBpbml0aWFsTGluZWAgQSB7TnVtYmVyfSBpbmRpY2F0aW5nIHdoaWNoIHJvdyB0byBtb3ZlIHRoZSBjdXJzb3IgdG9cbiAgIyAgICAgaW5pdGlhbGx5LiBEZWZhdWx0cyB0byBgMGAuXG4gICMgICAqIGBpbml0aWFsQ29sdW1uYCBBIHtOdW1iZXJ9IGluZGljYXRpbmcgd2hpY2ggY29sdW1uIHRvIG1vdmUgdGhlIGN1cnNvciB0b1xuICAjICAgICBpbml0aWFsbHkuIERlZmF1bHRzIHRvIGAwYC5cbiAgIyAgICogYGFjdGl2YXRlUGFuZWAgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGNhbGwge1BhbmU6OmFjdGl2YXRlfSBvblxuICAjICAgICB0aGUgY29udGFpbmluZyBwYW5lLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICMgICAqIGBhY3RpdmF0ZUl0ZW1gIEEge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0byBjYWxsIHtQYW5lOjphY3RpdmF0ZUl0ZW19XG4gICMgICAgIG9uIGNvbnRhaW5pbmcgcGFuZS4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICBvcGVuU3luYzogKHVyaT0nJywgb3B0aW9ucz17fSkgLT5cbiAgICB7aW5pdGlhbExpbmUsIGluaXRpYWxDb2x1bW59ID0gb3B0aW9uc1xuICAgIGFjdGl2YXRlUGFuZSA9IG9wdGlvbnMuYWN0aXZhdGVQYW5lID8gdHJ1ZVxuICAgIGFjdGl2YXRlSXRlbSA9IG9wdGlvbnMuYWN0aXZhdGVJdGVtID8gdHJ1ZVxuXG4gICAgdXJpID0gQHByb2plY3QucmVzb2x2ZVBhdGgodXJpKVxuICAgIGl0ZW0gPSBAZ2V0QWN0aXZlUGFuZSgpLml0ZW1Gb3JVUkkodXJpKVxuICAgIGlmIHVyaVxuICAgICAgaXRlbSA/PSBvcGVuZXIodXJpLCBvcHRpb25zKSBmb3Igb3BlbmVyIGluIEBnZXRPcGVuZXJzKCkgd2hlbiBub3QgaXRlbVxuICAgIGl0ZW0gPz0gQHByb2plY3Qub3BlblN5bmModXJpLCB7aW5pdGlhbExpbmUsIGluaXRpYWxDb2x1bW59KVxuXG4gICAgQGdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW0oaXRlbSkgaWYgYWN0aXZhdGVJdGVtXG4gICAgQGl0ZW1PcGVuZWQoaXRlbSlcbiAgICBAZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKCkgaWYgYWN0aXZhdGVQYW5lXG4gICAgaXRlbVxuXG4gIG9wZW5VUklJblBhbmU6ICh1cmksIHBhbmUsIG9wdGlvbnM9e30pIC0+XG4gICAgYWN0aXZhdGVQYW5lID0gb3B0aW9ucy5hY3RpdmF0ZVBhbmUgPyB0cnVlXG4gICAgYWN0aXZhdGVJdGVtID0gb3B0aW9ucy5hY3RpdmF0ZUl0ZW0gPyB0cnVlXG5cbiAgICBpZiB1cmk/XG4gICAgICBpZiBpdGVtID0gcGFuZS5pdGVtRm9yVVJJKHVyaSlcbiAgICAgICAgcGFuZS5jbGVhclBlbmRpbmdJdGVtKCkgaWYgbm90IG9wdGlvbnMucGVuZGluZyBhbmQgcGFuZS5nZXRQZW5kaW5nSXRlbSgpIGlzIGl0ZW1cbiAgICAgIGl0ZW0gPz0gb3BlbmVyKHVyaSwgb3B0aW9ucykgZm9yIG9wZW5lciBpbiBAZ2V0T3BlbmVycygpIHdoZW4gbm90IGl0ZW1cblxuICAgIHRyeVxuICAgICAgaXRlbSA/PSBAb3BlblRleHRGaWxlKHVyaSwgb3B0aW9ucylcbiAgICBjYXRjaCBlcnJvclxuICAgICAgc3dpdGNoIGVycm9yLmNvZGVcbiAgICAgICAgd2hlbiAnQ0FOQ0VMTEVEJ1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB3aGVuICdFQUNDRVMnXG4gICAgICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkV2FybmluZyhcIlBlcm1pc3Npb24gZGVuaWVkICcje2Vycm9yLnBhdGh9J1wiKVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB3aGVuICdFUEVSTScsICdFQlVTWScsICdFTlhJTycsICdFSU8nLCAnRU5PVENPTk4nLCAnVU5LTk9XTicsICdFQ09OTlJFU0VUJywgJ0VJTlZBTCcsICdFTUZJTEUnLCAnRU5PVERJUicsICdFQUdBSU4nXG4gICAgICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkV2FybmluZyhcIlVuYWJsZSB0byBvcGVuICcje2Vycm9yLnBhdGggPyB1cml9J1wiLCBkZXRhaWw6IGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBlcnJvclxuXG4gICAgUHJvbWlzZS5yZXNvbHZlKGl0ZW0pXG4gICAgICAudGhlbiAoaXRlbSkgPT5cbiAgICAgICAgcmV0dXJuIGl0ZW0gaWYgcGFuZS5pc0Rlc3Ryb3llZCgpXG5cbiAgICAgICAgQGl0ZW1PcGVuZWQoaXRlbSlcbiAgICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW0oaXRlbSwge3BlbmRpbmc6IG9wdGlvbnMucGVuZGluZ30pIGlmIGFjdGl2YXRlSXRlbVxuICAgICAgICBwYW5lLmFjdGl2YXRlKCkgaWYgYWN0aXZhdGVQYW5lXG5cbiAgICAgICAgaW5pdGlhbExpbmUgPSBpbml0aWFsQ29sdW1uID0gMFxuICAgICAgICB1bmxlc3MgTnVtYmVyLmlzTmFOKG9wdGlvbnMuaW5pdGlhbExpbmUpXG4gICAgICAgICAgaW5pdGlhbExpbmUgPSBvcHRpb25zLmluaXRpYWxMaW5lXG4gICAgICAgIHVubGVzcyBOdW1iZXIuaXNOYU4ob3B0aW9ucy5pbml0aWFsQ29sdW1uKVxuICAgICAgICAgIGluaXRpYWxDb2x1bW4gPSBvcHRpb25zLmluaXRpYWxDb2x1bW5cbiAgICAgICAgaWYgaW5pdGlhbExpbmUgPj0gMCBvciBpbml0aWFsQ29sdW1uID49IDBcbiAgICAgICAgICBpdGVtLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uPyhbaW5pdGlhbExpbmUsIGluaXRpYWxDb2x1bW5dKVxuXG4gICAgICAgIGluZGV4ID0gcGFuZS5nZXRBY3RpdmVJdGVtSW5kZXgoKVxuICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtb3BlbicsIHt1cmksIHBhbmUsIGl0ZW0sIGluZGV4fVxuICAgICAgICBpdGVtXG5cbiAgb3BlblRleHRGaWxlOiAodXJpLCBvcHRpb25zKSAtPlxuICAgIGZpbGVQYXRoID0gQHByb2plY3QucmVzb2x2ZVBhdGgodXJpKVxuXG4gICAgaWYgZmlsZVBhdGg/XG4gICAgICB0cnlcbiAgICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGZpbGVQYXRoLCAncicpKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgIyBhbGxvdyBFTk9FTlQgZXJyb3JzIHRvIGNyZWF0ZSBhbiBlZGl0b3IgZm9yIHBhdGhzIHRoYXQgZG9udCBleGlzdFxuICAgICAgICB0aHJvdyBlcnJvciB1bmxlc3MgZXJyb3IuY29kZSBpcyAnRU5PRU5UJ1xuXG4gICAgZmlsZVNpemUgPSBmcy5nZXRTaXplU3luYyhmaWxlUGF0aClcblxuICAgIGxhcmdlRmlsZU1vZGUgPSBmaWxlU2l6ZSA+PSAyICogMTA0ODU3NiAjIDJNQlxuICAgIGlmIGZpbGVTaXplID49IEBjb25maWcuZ2V0KCdjb3JlLndhcm5PbkxhcmdlRmlsZUxpbWl0JykgKiAxMDQ4NTc2ICMgMjBNQiBieSBkZWZhdWx0XG4gICAgICBjaG9pY2UgPSBAYXBwbGljYXRpb25EZWxlZ2F0ZS5jb25maXJtXG4gICAgICAgIG1lc3NhZ2U6ICdBdG9tIHdpbGwgYmUgdW5yZXNwb25zaXZlIGR1cmluZyB0aGUgbG9hZGluZyBvZiB2ZXJ5IGxhcmdlIGZpbGVzLidcbiAgICAgICAgZGV0YWlsZWRNZXNzYWdlOiBcIkRvIHlvdSBzdGlsbCB3YW50IHRvIGxvYWQgdGhpcyBmaWxlP1wiXG4gICAgICAgIGJ1dHRvbnM6IFtcIlByb2NlZWRcIiwgXCJDYW5jZWxcIl1cbiAgICAgIGlmIGNob2ljZSBpcyAxXG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yXG4gICAgICAgIGVycm9yLmNvZGUgPSAnQ0FOQ0VMTEVEJ1xuICAgICAgICB0aHJvdyBlcnJvclxuXG4gICAgQHByb2plY3QuYnVmZmVyRm9yUGF0aChmaWxlUGF0aCwgb3B0aW9ucykudGhlbiAoYnVmZmVyKSA9PlxuICAgICAgQHRleHRFZGl0b3JSZWdpc3RyeS5idWlsZChPYmplY3QuYXNzaWduKHtidWZmZXIsIGxhcmdlRmlsZU1vZGUsIGF1dG9IZWlnaHQ6IGZhbHNlfSwgb3B0aW9ucykpXG5cbiAgaGFuZGxlR3JhbW1hclVzZWQ6IChncmFtbWFyKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZ3JhbW1hcj9cblxuICAgIEBwYWNrYWdlTWFuYWdlci50cmlnZ2VyQWN0aXZhdGlvbkhvb2soXCIje2dyYW1tYXIucGFja2FnZU5hbWV9OmdyYW1tYXItdXNlZFwiKVxuXG4gICMgUHVibGljOiBSZXR1cm5zIGEge0Jvb2xlYW59IHRoYXQgaXMgYHRydWVgIGlmIGBvYmplY3RgIGlzIGEgYFRleHRFZGl0b3JgLlxuICAjXG4gICMgKiBgb2JqZWN0YCBBbiB7T2JqZWN0fSB5b3Ugd2FudCB0byBwZXJmb3JtIHRoZSBjaGVjayBhZ2FpbnN0LlxuICBpc1RleHRFZGl0b3I6IChvYmplY3QpIC0+XG4gICAgb2JqZWN0IGluc3RhbmNlb2YgVGV4dEVkaXRvclxuXG4gICMgRXh0ZW5kZWQ6IENyZWF0ZSBhIG5ldyB0ZXh0IGVkaXRvci5cbiAgI1xuICAjIFJldHVybnMgYSB7VGV4dEVkaXRvcn0uXG4gIGJ1aWxkVGV4dEVkaXRvcjogKHBhcmFtcykgLT5cbiAgICBlZGl0b3IgPSBAdGV4dEVkaXRvclJlZ2lzdHJ5LmJ1aWxkKHBhcmFtcylcbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoXG4gICAgICBAdGV4dEVkaXRvclJlZ2lzdHJ5Lm1haW50YWluR3JhbW1hcihlZGl0b3IpXG4gICAgICBAdGV4dEVkaXRvclJlZ2lzdHJ5Lm1haW50YWluQ29uZmlnKGVkaXRvciksXG4gICAgKVxuICAgIGVkaXRvci5vbkRpZERlc3Ryb3kgLT4gc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBlZGl0b3JcblxuICAjIFB1YmxpYzogQXN5bmNocm9ub3VzbHkgcmVvcGVucyB0aGUgbGFzdC1jbG9zZWQgaXRlbSdzIFVSSSBpZiBpdCBoYXNuJ3QgYWxyZWFkeSBiZWVuXG4gICMgcmVvcGVuZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiB0aGUgaXRlbSBpcyBvcGVuZWRcbiAgcmVvcGVuSXRlbTogLT5cbiAgICBpZiB1cmkgPSBAZGVzdHJveWVkSXRlbVVSSXMucG9wKClcbiAgICAgIEBvcGVuKHVyaSlcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICMgUHVibGljOiBSZWdpc3RlciBhbiBvcGVuZXIgZm9yIGEgdXJpLlxuICAjXG4gICMgV2hlbiBhIFVSSSBpcyBvcGVuZWQgdmlhIHtXb3Jrc3BhY2U6Om9wZW59LCBBdG9tIGxvb3BzIHRocm91Z2ggaXRzIHJlZ2lzdGVyZWRcbiAgIyBvcGVuZXIgZnVuY3Rpb25zIHVudGlsIG9uZSByZXR1cm5zIGEgdmFsdWUgZm9yIHRoZSBnaXZlbiB1cmkuXG4gICMgT3BlbmVycyBhcmUgZXhwZWN0ZWQgdG8gcmV0dXJuIGFuIG9iamVjdCB0aGF0IGluaGVyaXRzIGZyb20gSFRNTEVsZW1lbnQgb3JcbiAgIyBhIG1vZGVsIHdoaWNoIGhhcyBhbiBhc3NvY2lhdGVkIHZpZXcgaW4gdGhlIHtWaWV3UmVnaXN0cnl9LlxuICAjIEEge1RleHRFZGl0b3J9IHdpbGwgYmUgdXNlZCBpZiBubyBvcGVuZXIgcmV0dXJucyBhIHZhbHVlLlxuICAjXG4gICMgIyMgRXhhbXBsZXNcbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lciAodXJpKSAtPlxuICAjICAgaWYgcGF0aC5leHRuYW1lKHVyaSkgaXMgJy50b21sJ1xuICAjICAgICByZXR1cm4gbmV3IFRvbWxFZGl0b3IodXJpKVxuICAjIGBgYFxuICAjXG4gICMgKiBgb3BlbmVyYCBBIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gYSBwYXRoIGlzIGJlaW5nIG9wZW5lZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gcmVtb3ZlIHRoZVxuICAjIG9wZW5lci5cbiAgI1xuICAjIE5vdGUgdGhhdCB0aGUgb3BlbmVyIHdpbGwgYmUgY2FsbGVkIGlmIGFuZCBvbmx5IGlmIHRoZSBVUkkgaXMgbm90IGFscmVhZHkgb3BlblxuICAjIGluIHRoZSBjdXJyZW50IHBhbmUuIFRoZSBzZWFyY2hBbGxQYW5lcyBmbGFnIGV4cGFuZHMgdGhlIHNlYXJjaCBmcm9tIHRoZVxuICAjIGN1cnJlbnQgcGFuZSB0byBhbGwgcGFuZXMuIElmIHlvdSB3aXNoIHRvIG9wZW4gYSB2aWV3IG9mIGEgZGlmZmVyZW50IHR5cGUgZm9yXG4gICMgYSBmaWxlIHRoYXQgaXMgYWxyZWFkeSBvcGVuLCBjb25zaWRlciBjaGFuZ2luZyB0aGUgcHJvdG9jb2wgb2YgdGhlIFVSSS4gRm9yXG4gICMgZXhhbXBsZSwgcGVyaGFwcyB5b3Ugd2lzaCB0byBwcmV2aWV3IGEgcmVuZGVyZWQgdmVyc2lvbiBvZiB0aGUgZmlsZSBgL2Zvby9iYXIvYmF6LnF1dXhgXG4gICMgdGhhdCBpcyBhbHJlYWR5IG9wZW4gaW4gYSB0ZXh0IGVkaXRvciB2aWV3LiBZb3UgY291bGQgc2lnbmFsIHRoaXMgYnkgY2FsbGluZ1xuICAjIHtXb3Jrc3BhY2U6Om9wZW59IG9uIHRoZSBVUkkgYHF1dXgtcHJldmlldzovL2Zvby9iYXIvYmF6LnF1dXhgLiBUaGVuIHlvdXIgb3BlbmVyXG4gICMgY2FuIGNoZWNrIHRoZSBwcm90b2NvbCBmb3IgcXV1eC1wcmV2aWV3IGFuZCBvbmx5IGhhbmRsZSB0aG9zZSBVUklzIHRoYXQgbWF0Y2guXG4gIGFkZE9wZW5lcjogKG9wZW5lcikgLT5cbiAgICBAb3BlbmVycy5wdXNoKG9wZW5lcilcbiAgICBuZXcgRGlzcG9zYWJsZSA9PiBfLnJlbW92ZShAb3BlbmVycywgb3BlbmVyKVxuXG4gIGdldE9wZW5lcnM6IC0+XG4gICAgQG9wZW5lcnNcblxuICAjIyNcbiAgU2VjdGlvbjogUGFuZSBJdGVtc1xuICAjIyNcblxuICAjIEVzc2VudGlhbDogR2V0IGFsbCBwYW5lIGl0ZW1zIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2YgaXRlbXMuXG4gIGdldFBhbmVJdGVtczogLT5cbiAgICBAcGFuZUNvbnRhaW5lci5nZXRQYW5lSXRlbXMoKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgdGhlIGFjdGl2ZSB7UGFuZX0ncyBhY3RpdmUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYW4gcGFuZSBpdGVtIHtPYmplY3R9LlxuICBnZXRBY3RpdmVQYW5lSXRlbTogLT5cbiAgICBAcGFuZUNvbnRhaW5lci5nZXRBY3RpdmVQYW5lSXRlbSgpXG5cbiAgIyBFc3NlbnRpYWw6IEdldCBhbGwgdGV4dCBlZGl0b3JzIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1RleHRFZGl0b3J9cy5cbiAgZ2V0VGV4dEVkaXRvcnM6IC0+XG4gICAgQGdldFBhbmVJdGVtcygpLmZpbHRlciAoaXRlbSkgLT4gaXRlbSBpbnN0YW5jZW9mIFRleHRFZGl0b3JcblxuICAjIEVzc2VudGlhbDogR2V0IHRoZSBhY3RpdmUgaXRlbSBpZiBpdCBpcyBhbiB7VGV4dEVkaXRvcn0uXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtUZXh0RWRpdG9yfSBvciBgdW5kZWZpbmVkYCBpZiB0aGUgY3VycmVudCBhY3RpdmUgaXRlbSBpcyBub3QgYW5cbiAgIyB7VGV4dEVkaXRvcn0uXG4gIGdldEFjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgYWN0aXZlSXRlbSA9IEBnZXRBY3RpdmVQYW5lSXRlbSgpXG4gICAgYWN0aXZlSXRlbSBpZiBhY3RpdmVJdGVtIGluc3RhbmNlb2YgVGV4dEVkaXRvclxuXG4gICMgU2F2ZSBhbGwgcGFuZSBpdGVtcy5cbiAgc2F2ZUFsbDogLT5cbiAgICBAcGFuZUNvbnRhaW5lci5zYXZlQWxsKClcblxuICBjb25maXJtQ2xvc2U6IChvcHRpb25zKSAtPlxuICAgIEBwYW5lQ29udGFpbmVyLmNvbmZpcm1DbG9zZShvcHRpb25zKVxuXG4gICMgU2F2ZSB0aGUgYWN0aXZlIHBhbmUgaXRlbS5cbiAgI1xuICAjIElmIHRoZSBhY3RpdmUgcGFuZSBpdGVtIGN1cnJlbnRseSBoYXMgYSBVUkkgYWNjb3JkaW5nIHRvIHRoZSBpdGVtJ3NcbiAgIyBgLmdldFVSSWAgbWV0aG9kLCBjYWxscyBgLnNhdmVgIG9uIHRoZSBpdGVtLiBPdGhlcndpc2VcbiAgIyB7OjpzYXZlQWN0aXZlUGFuZUl0ZW1Bc30gIyB3aWxsIGJlIGNhbGxlZCBpbnN0ZWFkLiBUaGlzIG1ldGhvZCBkb2VzIG5vdGhpbmdcbiAgIyBpZiB0aGUgYWN0aXZlIGl0ZW0gZG9lcyBub3QgaW1wbGVtZW50IGEgYC5zYXZlYCBtZXRob2QuXG4gIHNhdmVBY3RpdmVQYW5lSXRlbTogLT5cbiAgICBAZ2V0QWN0aXZlUGFuZSgpLnNhdmVBY3RpdmVJdGVtKClcblxuICAjIFByb21wdCB0aGUgdXNlciBmb3IgYSBwYXRoIGFuZCBzYXZlIHRoZSBhY3RpdmUgcGFuZSBpdGVtIHRvIGl0LlxuICAjXG4gICMgT3BlbnMgYSBuYXRpdmUgZGlhbG9nIHdoZXJlIHRoZSB1c2VyIHNlbGVjdHMgYSBwYXRoIG9uIGRpc2ssIHRoZW4gY2FsbHNcbiAgIyBgLnNhdmVBc2Agb24gdGhlIGl0ZW0gd2l0aCB0aGUgc2VsZWN0ZWQgcGF0aC4gVGhpcyBtZXRob2QgZG9lcyBub3RoaW5nIGlmXG4gICMgdGhlIGFjdGl2ZSBpdGVtIGRvZXMgbm90IGltcGxlbWVudCBhIGAuc2F2ZUFzYCBtZXRob2QuXG4gIHNhdmVBY3RpdmVQYW5lSXRlbUFzOiAtPlxuICAgIEBnZXRBY3RpdmVQYW5lKCkuc2F2ZUFjdGl2ZUl0ZW1BcygpXG5cbiAgIyBEZXN0cm95IChjbG9zZSkgdGhlIGFjdGl2ZSBwYW5lIGl0ZW0uXG4gICNcbiAgIyBSZW1vdmVzIHRoZSBhY3RpdmUgcGFuZSBpdGVtIGFuZCBjYWxscyB0aGUgYC5kZXN0cm95YCBtZXRob2Qgb24gaXQgaWYgb25lIGlzXG4gICMgZGVmaW5lZC5cbiAgZGVzdHJveUFjdGl2ZVBhbmVJdGVtOiAtPlxuICAgIEBnZXRBY3RpdmVQYW5lKCkuZGVzdHJveUFjdGl2ZUl0ZW0oKVxuXG4gICMjI1xuICBTZWN0aW9uOiBQYW5lc1xuICAjIyNcblxuICAjIEV4dGVuZGVkOiBHZXQgYWxsIHBhbmVzIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1BhbmV9cy5cbiAgZ2V0UGFuZXM6IC0+XG4gICAgQHBhbmVDb250YWluZXIuZ2V0UGFuZXMoKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUgYWN0aXZlIHtQYW5lfS5cbiAgI1xuICAjIFJldHVybnMgYSB7UGFuZX0uXG4gIGdldEFjdGl2ZVBhbmU6IC0+XG4gICAgQHBhbmVDb250YWluZXIuZ2V0QWN0aXZlUGFuZSgpXG5cbiAgIyBFeHRlbmRlZDogTWFrZSB0aGUgbmV4dCBwYW5lIGFjdGl2ZS5cbiAgYWN0aXZhdGVOZXh0UGFuZTogLT5cbiAgICBAcGFuZUNvbnRhaW5lci5hY3RpdmF0ZU5leHRQYW5lKClcblxuICAjIEV4dGVuZGVkOiBNYWtlIHRoZSBwcmV2aW91cyBwYW5lIGFjdGl2ZS5cbiAgYWN0aXZhdGVQcmV2aW91c1BhbmU6IC0+XG4gICAgQHBhbmVDb250YWluZXIuYWN0aXZhdGVQcmV2aW91c1BhbmUoKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUgZmlyc3Qge1BhbmV9IHdpdGggYW4gaXRlbSBmb3IgdGhlIGdpdmVuIFVSSS5cbiAgI1xuICAjICogYHVyaWAge1N0cmluZ30gdXJpXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmV9IG9yIGB1bmRlZmluZWRgIGlmIG5vIHBhbmUgZXhpc3RzIGZvciB0aGUgZ2l2ZW4gVVJJLlxuICBwYW5lRm9yVVJJOiAodXJpKSAtPlxuICAgIEBwYW5lQ29udGFpbmVyLnBhbmVGb3JVUkkodXJpKVxuXG4gICMgRXh0ZW5kZWQ6IEdldCB0aGUge1BhbmV9IGNvbnRhaW5pbmcgdGhlIGdpdmVuIGl0ZW0uXG4gICNcbiAgIyAqIGBpdGVtYCBJdGVtIHRoZSByZXR1cm5lZCBwYW5lIGNvbnRhaW5zLlxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lfSBvciBgdW5kZWZpbmVkYCBpZiBubyBwYW5lIGV4aXN0cyBmb3IgdGhlIGdpdmVuIGl0ZW0uXG4gIHBhbmVGb3JJdGVtOiAoaXRlbSkgLT5cbiAgICBAcGFuZUNvbnRhaW5lci5wYW5lRm9ySXRlbShpdGVtKVxuXG4gICMgRGVzdHJveSAoY2xvc2UpIHRoZSBhY3RpdmUgcGFuZS5cbiAgZGVzdHJveUFjdGl2ZVBhbmU6IC0+XG4gICAgQGdldEFjdGl2ZVBhbmUoKT8uZGVzdHJveSgpXG5cbiAgIyBDbG9zZSB0aGUgYWN0aXZlIHBhbmUgaXRlbSwgb3IgdGhlIGFjdGl2ZSBwYW5lIGlmIGl0IGlzIGVtcHR5LFxuICAjIG9yIHRoZSBjdXJyZW50IHdpbmRvdyBpZiB0aGVyZSBpcyBvbmx5IHRoZSBlbXB0eSByb290IHBhbmUuXG4gIGNsb3NlQWN0aXZlUGFuZUl0ZW1PckVtcHR5UGFuZU9yV2luZG93OiAtPlxuICAgIGlmIEBnZXRBY3RpdmVQYW5lSXRlbSgpP1xuICAgICAgQGRlc3Ryb3lBY3RpdmVQYW5lSXRlbSgpXG4gICAgZWxzZSBpZiBAZ2V0UGFuZXMoKS5sZW5ndGggPiAxXG4gICAgICBAZGVzdHJveUFjdGl2ZVBhbmUoKVxuICAgIGVsc2UgaWYgQGNvbmZpZy5nZXQoJ2NvcmUuY2xvc2VFbXB0eVdpbmRvd3MnKVxuICAgICAgYXRvbS5jbG9zZSgpXG5cbiAgIyBJbmNyZWFzZSB0aGUgZWRpdG9yIGZvbnQgc2l6ZSBieSAxcHguXG4gIGluY3JlYXNlRm9udFNpemU6IC0+XG4gICAgQGNvbmZpZy5zZXQoXCJlZGl0b3IuZm9udFNpemVcIiwgQGNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIikgKyAxKVxuXG4gICMgRGVjcmVhc2UgdGhlIGVkaXRvciBmb250IHNpemUgYnkgMXB4LlxuICBkZWNyZWFzZUZvbnRTaXplOiAtPlxuICAgIGZvbnRTaXplID0gQGNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIilcbiAgICBAY29uZmlnLnNldChcImVkaXRvci5mb250U2l6ZVwiLCBmb250U2l6ZSAtIDEpIGlmIGZvbnRTaXplID4gMVxuXG4gICMgUmVzdG9yZSB0byB0aGUgd2luZG93J3Mgb3JpZ2luYWwgZWRpdG9yIGZvbnQgc2l6ZS5cbiAgcmVzZXRGb250U2l6ZTogLT5cbiAgICBpZiBAb3JpZ2luYWxGb250U2l6ZVxuICAgICAgQGNvbmZpZy5zZXQoXCJlZGl0b3IuZm9udFNpemVcIiwgQG9yaWdpbmFsRm9udFNpemUpXG5cbiAgc3Vic2NyaWJlVG9Gb250U2l6ZTogLT5cbiAgICBAY29uZmlnLm9uRGlkQ2hhbmdlICdlZGl0b3IuZm9udFNpemUnLCAoe29sZFZhbHVlfSkgPT5cbiAgICAgIEBvcmlnaW5hbEZvbnRTaXplID89IG9sZFZhbHVlXG5cbiAgIyBSZW1vdmVzIHRoZSBpdGVtJ3MgdXJpIGZyb20gdGhlIGxpc3Qgb2YgcG90ZW50aWFsIGl0ZW1zIHRvIHJlb3Blbi5cbiAgaXRlbU9wZW5lZDogKGl0ZW0pIC0+XG4gICAgaWYgdHlwZW9mIGl0ZW0uZ2V0VVJJIGlzICdmdW5jdGlvbidcbiAgICAgIHVyaSA9IGl0ZW0uZ2V0VVJJKClcbiAgICBlbHNlIGlmIHR5cGVvZiBpdGVtLmdldFVyaSBpcyAnZnVuY3Rpb24nXG4gICAgICB1cmkgPSBpdGVtLmdldFVyaSgpXG5cbiAgICBpZiB1cmk/XG4gICAgICBfLnJlbW92ZShAZGVzdHJveWVkSXRlbVVSSXMsIHVyaSlcblxuICAjIEFkZHMgdGhlIGRlc3Ryb3llZCBpdGVtJ3MgdXJpIHRvIHRoZSBsaXN0IG9mIGl0ZW1zIHRvIHJlb3Blbi5cbiAgZGlkRGVzdHJveVBhbmVJdGVtOiAoe2l0ZW19KSA9PlxuICAgIGlmIHR5cGVvZiBpdGVtLmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICB1cmkgPSBpdGVtLmdldFVSSSgpXG4gICAgZWxzZSBpZiB0eXBlb2YgaXRlbS5nZXRVcmkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdXJpID0gaXRlbS5nZXRVcmkoKVxuXG4gICAgaWYgdXJpP1xuICAgICAgQGRlc3Ryb3llZEl0ZW1VUklzLnB1c2godXJpKVxuXG4gICMgQ2FsbGVkIGJ5IE1vZGVsIHN1cGVyY2xhc3Mgd2hlbiBkZXN0cm95ZWRcbiAgZGVzdHJveWVkOiAtPlxuICAgIEBwYW5lQ29udGFpbmVyLmRlc3Ryb3koKVxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG5cblxuICAjIyNcbiAgU2VjdGlvbjogUGFuZWxzXG5cbiAgUGFuZWxzIGFyZSB1c2VkIHRvIGRpc3BsYXkgVUkgcmVsYXRlZCB0byBhbiBlZGl0b3Igd2luZG93LiBUaGV5IGFyZSBwbGFjZWQgYXQgb25lIG9mIHRoZSBmb3VyXG4gIGVkZ2VzIG9mIHRoZSB3aW5kb3c6IGxlZnQsIHJpZ2h0LCB0b3Agb3IgYm90dG9tLiBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgcGFuZWxzIG9uIHRoZSBzYW1lIHdpbmRvd1xuICBlZGdlIHRoZXkgYXJlIHN0YWNrZWQgaW4gb3JkZXIgb2YgcHJpb3JpdHk6IGhpZ2hlciBwcmlvcml0eSBpcyBjbG9zZXIgdG8gdGhlIGNlbnRlciwgbG93ZXJcbiAgcHJpb3JpdHkgdG93YXJkcyB0aGUgZWRnZS5cblxuICAqTm90ZToqIElmIHlvdXIgcGFuZWwgY2hhbmdlcyBpdHMgc2l6ZSB0aHJvdWdob3V0IGl0cyBsaWZldGltZSwgY29uc2lkZXIgZ2l2aW5nIGl0IGEgaGlnaGVyXG4gIHByaW9yaXR5LCBhbGxvd2luZyBmaXhlZCBzaXplIHBhbmVscyB0byBiZSBjbG9zZXIgdG8gdGhlIGVkZ2UuIFRoaXMgYWxsb3dzIGNvbnRyb2wgdGFyZ2V0cyB0b1xuICByZW1haW4gbW9yZSBzdGF0aWMgZm9yIGVhc2llciB0YXJnZXRpbmcgYnkgdXNlcnMgdGhhdCBlbXBsb3kgbWljZSBvciB0cmFja3BhZHMuIChTZWVcbiAgW2F0b20vYXRvbSM0ODM0XShodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2lzc3Vlcy80ODM0KSBmb3IgZGlzY3Vzc2lvbi4pXG4gICMjI1xuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIGF0IHRoZSBib3R0b20gb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4gIGdldEJvdHRvbVBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCdib3R0b20nKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgYm90dG9tIG9mIHRoZSBlZGl0b3Igd2luZG93LlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIERPTSBlbGVtZW50LCBhIGpRdWVyeSBlbGVtZW50LCBvclxuICAjICAgICBhIG1vZGVsIHdpdGggYSB2aWV3IHJlZ2lzdGVyZWQgdmlhIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0uIFdlIHJlY29tbWVuZCB0aGVcbiAgIyAgICAgbGF0dGVyLiBTZWUge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHZpc2libGVgIChvcHRpb25hbCkge0Jvb2xlYW59IGZhbHNlIGlmIHlvdSB3YW50IHRoZSBwYW5lbCB0byBpbml0aWFsbHkgYmUgaGlkZGVuXG4gICMgICAgIChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgcHJpb3JpdHlgIChvcHRpb25hbCkge051bWJlcn0gRGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlci4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlXG4gICMgICAgIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZSB3aW5kb3cuIChkZWZhdWx0OiAxMDApXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmVsfVxuICBhZGRCb3R0b21QYW5lbDogKG9wdGlvbnMpIC0+XG4gICAgQGFkZFBhbmVsKCdib3R0b20nLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIHRvIHRoZSBsZWZ0IG9mIHRoZSBlZGl0b3Igd2luZG93LlxuICBnZXRMZWZ0UGFuZWxzOiAtPlxuICAgIEBnZXRQYW5lbHMoJ2xlZnQnKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgbGVmdCBvZiB0aGUgZWRpdG9yIHdpbmRvdy5cbiAgI1xuICAjICogYG9wdGlvbnNgIHtPYmplY3R9XG4gICMgICAqIGBpdGVtYCBZb3VyIHBhbmVsIGNvbnRlbnQuIEl0IGNhbiBiZSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIGxhdHRlci4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkTGVmdFBhbmVsOiAob3B0aW9ucykgLT5cbiAgICBAYWRkUGFuZWwoJ2xlZnQnLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIHRvIHRoZSByaWdodCBvZiB0aGUgZWRpdG9yIHdpbmRvdy5cbiAgZ2V0UmlnaHRQYW5lbHM6IC0+XG4gICAgQGdldFBhbmVscygncmlnaHQnKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgcmlnaHQgb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4gICNcbiAgIyAqIGBvcHRpb25zYCB7T2JqZWN0fVxuICAjICAgKiBgaXRlbWAgWW91ciBwYW5lbCBjb250ZW50LiBJdCBjYW4gYmUgRE9NIGVsZW1lbnQsIGEgalF1ZXJ5IGVsZW1lbnQsIG9yXG4gICMgICAgIGEgbW9kZWwgd2l0aCBhIHZpZXcgcmVnaXN0ZXJlZCB2aWEge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfS4gV2UgcmVjb21tZW5kIHRoZVxuICAjICAgICBsYXR0ZXIuIFNlZSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAjICAgKiBgdmlzaWJsZWAgKG9wdGlvbmFsKSB7Qm9vbGVhbn0gZmFsc2UgaWYgeW91IHdhbnQgdGhlIHBhbmVsIHRvIGluaXRpYWxseSBiZSBoaWRkZW5cbiAgIyAgICAgKGRlZmF1bHQ6IHRydWUpXG4gICMgICAqIGBwcmlvcml0eWAgKG9wdGlvbmFsKSB7TnVtYmVyfSBEZXRlcm1pbmVzIHN0YWNraW5nIG9yZGVyLiBMb3dlciBwcmlvcml0eSBpdGVtcyBhcmVcbiAgIyAgICAgZm9yY2VkIGNsb3NlciB0byB0aGUgZWRnZXMgb2YgdGhlIHdpbmRvdy4gKGRlZmF1bHQ6IDEwMClcbiAgI1xuICAjIFJldHVybnMgYSB7UGFuZWx9XG4gIGFkZFJpZ2h0UGFuZWw6IChvcHRpb25zKSAtPlxuICAgIEBhZGRQYW5lbCgncmlnaHQnLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIGF0IHRoZSB0b3Agb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4gIGdldFRvcFBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCd0b3AnKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgdG9wIG9mIHRoZSBlZGl0b3Igd2luZG93IGFib3ZlIHRoZSB0YWJzLlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIERPTSBlbGVtZW50LCBhIGpRdWVyeSBlbGVtZW50LCBvclxuICAjICAgICBhIG1vZGVsIHdpdGggYSB2aWV3IHJlZ2lzdGVyZWQgdmlhIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0uIFdlIHJlY29tbWVuZCB0aGVcbiAgIyAgICAgbGF0dGVyLiBTZWUge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHZpc2libGVgIChvcHRpb25hbCkge0Jvb2xlYW59IGZhbHNlIGlmIHlvdSB3YW50IHRoZSBwYW5lbCB0byBpbml0aWFsbHkgYmUgaGlkZGVuXG4gICMgICAgIChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgcHJpb3JpdHlgIChvcHRpb25hbCkge051bWJlcn0gRGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlci4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlXG4gICMgICAgIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZSB3aW5kb3cuIChkZWZhdWx0OiAxMDApXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmVsfVxuICBhZGRUb3BQYW5lbDogKG9wdGlvbnMpIC0+XG4gICAgQGFkZFBhbmVsKCd0b3AnLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIGluIHRoZSBoZWFkZXIuXG4gIGdldEhlYWRlclBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCdoZWFkZXInKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgaGVhZGVyLlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIERPTSBlbGVtZW50LCBhIGpRdWVyeSBlbGVtZW50LCBvclxuICAjICAgICBhIG1vZGVsIHdpdGggYSB2aWV3IHJlZ2lzdGVyZWQgdmlhIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0uIFdlIHJlY29tbWVuZCB0aGVcbiAgIyAgICAgbGF0dGVyLiBTZWUge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHZpc2libGVgIChvcHRpb25hbCkge0Jvb2xlYW59IGZhbHNlIGlmIHlvdSB3YW50IHRoZSBwYW5lbCB0byBpbml0aWFsbHkgYmUgaGlkZGVuXG4gICMgICAgIChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgcHJpb3JpdHlgIChvcHRpb25hbCkge051bWJlcn0gRGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlci4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlXG4gICMgICAgIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZSB3aW5kb3cuIChkZWZhdWx0OiAxMDApXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmVsfVxuICBhZGRIZWFkZXJQYW5lbDogKG9wdGlvbnMpIC0+XG4gICAgQGFkZFBhbmVsKCdoZWFkZXInLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIHBhbmVsIGl0ZW1zIGluIHRoZSBmb290ZXIuXG4gIGdldEZvb3RlclBhbmVsczogLT5cbiAgICBAZ2V0UGFuZWxzKCdmb290ZXInKVxuXG4gICMgRXNzZW50aWFsOiBBZGRzIGEgcGFuZWwgaXRlbSB0byB0aGUgZm9vdGVyLlxuICAjXG4gICMgKiBgb3B0aW9uc2Age09iamVjdH1cbiAgIyAgICogYGl0ZW1gIFlvdXIgcGFuZWwgY29udGVudC4gSXQgY2FuIGJlIERPTSBlbGVtZW50LCBhIGpRdWVyeSBlbGVtZW50LCBvclxuICAjICAgICBhIG1vZGVsIHdpdGggYSB2aWV3IHJlZ2lzdGVyZWQgdmlhIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0uIFdlIHJlY29tbWVuZCB0aGVcbiAgIyAgICAgbGF0dGVyLiBTZWUge1ZpZXdSZWdpc3RyeTo6YWRkVmlld1Byb3ZpZGVyfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgIyAgICogYHZpc2libGVgIChvcHRpb25hbCkge0Jvb2xlYW59IGZhbHNlIGlmIHlvdSB3YW50IHRoZSBwYW5lbCB0byBpbml0aWFsbHkgYmUgaGlkZGVuXG4gICMgICAgIChkZWZhdWx0OiB0cnVlKVxuICAjICAgKiBgcHJpb3JpdHlgIChvcHRpb25hbCkge051bWJlcn0gRGV0ZXJtaW5lcyBzdGFja2luZyBvcmRlci4gTG93ZXIgcHJpb3JpdHkgaXRlbXMgYXJlXG4gICMgICAgIGZvcmNlZCBjbG9zZXIgdG8gdGhlIGVkZ2VzIG9mIHRoZSB3aW5kb3cuIChkZWZhdWx0OiAxMDApXG4gICNcbiAgIyBSZXR1cm5zIGEge1BhbmVsfVxuICBhZGRGb290ZXJQYW5lbDogKG9wdGlvbnMpIC0+XG4gICAgQGFkZFBhbmVsKCdmb290ZXInLCBvcHRpb25zKVxuXG4gICMgRXNzZW50aWFsOiBHZXQgYW4ge0FycmF5fSBvZiBhbGwgdGhlIG1vZGFsIHBhbmVsIGl0ZW1zXG4gIGdldE1vZGFsUGFuZWxzOiAtPlxuICAgIEBnZXRQYW5lbHMoJ21vZGFsJylcblxuICAjIEVzc2VudGlhbDogQWRkcyBhIHBhbmVsIGl0ZW0gYXMgYSBtb2RhbCBkaWFsb2cuXG4gICNcbiAgIyAqIGBvcHRpb25zYCB7T2JqZWN0fVxuICAjICAgKiBgaXRlbWAgWW91ciBwYW5lbCBjb250ZW50LiBJdCBjYW4gYmUgYSBET00gZWxlbWVudCwgYSBqUXVlcnkgZWxlbWVudCwgb3JcbiAgIyAgICAgYSBtb2RlbCB3aXRoIGEgdmlldyByZWdpc3RlcmVkIHZpYSB7Vmlld1JlZ2lzdHJ5OjphZGRWaWV3UHJvdmlkZXJ9LiBXZSByZWNvbW1lbmQgdGhlXG4gICMgICAgIG1vZGVsIG9wdGlvbi4gU2VlIHtWaWV3UmVnaXN0cnk6OmFkZFZpZXdQcm92aWRlcn0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICMgICAqIGB2aXNpYmxlYCAob3B0aW9uYWwpIHtCb29sZWFufSBmYWxzZSBpZiB5b3Ugd2FudCB0aGUgcGFuZWwgdG8gaW5pdGlhbGx5IGJlIGhpZGRlblxuICAjICAgICAoZGVmYXVsdDogdHJ1ZSlcbiAgIyAgICogYHByaW9yaXR5YCAob3B0aW9uYWwpIHtOdW1iZXJ9IERldGVybWluZXMgc3RhY2tpbmcgb3JkZXIuIExvd2VyIHByaW9yaXR5IGl0ZW1zIGFyZVxuICAjICAgICBmb3JjZWQgY2xvc2VyIHRvIHRoZSBlZGdlcyBvZiB0aGUgd2luZG93LiAoZGVmYXVsdDogMTAwKVxuICAjXG4gICMgUmV0dXJucyBhIHtQYW5lbH1cbiAgYWRkTW9kYWxQYW5lbDogKG9wdGlvbnM9e30pIC0+XG4gICAgQGFkZFBhbmVsKCdtb2RhbCcsIG9wdGlvbnMpXG5cbiAgIyBFc3NlbnRpYWw6IFJldHVybnMgdGhlIHtQYW5lbH0gYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBpdGVtLiBSZXR1cm5zXG4gICMgYG51bGxgIHdoZW4gdGhlIGl0ZW0gaGFzIG5vIHBhbmVsLlxuICAjXG4gICMgKiBgaXRlbWAgSXRlbSB0aGUgcGFuZWwgY29udGFpbnNcbiAgcGFuZWxGb3JJdGVtOiAoaXRlbSkgLT5cbiAgICBmb3IgbG9jYXRpb24sIGNvbnRhaW5lciBvZiBAcGFuZWxDb250YWluZXJzXG4gICAgICBwYW5lbCA9IGNvbnRhaW5lci5wYW5lbEZvckl0ZW0oaXRlbSlcbiAgICAgIHJldHVybiBwYW5lbCBpZiBwYW5lbD9cbiAgICBudWxsXG5cbiAgZ2V0UGFuZWxzOiAobG9jYXRpb24pIC0+XG4gICAgQHBhbmVsQ29udGFpbmVyc1tsb2NhdGlvbl0uZ2V0UGFuZWxzKClcblxuICBhZGRQYW5lbDogKGxvY2F0aW9uLCBvcHRpb25zKSAtPlxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBAcGFuZWxDb250YWluZXJzW2xvY2F0aW9uXS5hZGRQYW5lbChuZXcgUGFuZWwob3B0aW9ucykpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFNlYXJjaGluZyBhbmQgUmVwbGFjaW5nXG4gICMjI1xuXG4gICMgUHVibGljOiBQZXJmb3JtcyBhIHNlYXJjaCBhY3Jvc3MgYWxsIGZpbGVzIGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyAqIGByZWdleGAge1JlZ0V4cH0gdG8gc2VhcmNoIHdpdGguXG4gICMgKiBgb3B0aW9uc2AgKG9wdGlvbmFsKSB7T2JqZWN0fVxuICAjICAgKiBgcGF0aHNgIEFuIHtBcnJheX0gb2YgZ2xvYiBwYXR0ZXJucyB0byBzZWFyY2ggd2l0aGluLlxuICAjICAgKiBgb25QYXRoc1NlYXJjaGVkYCAob3B0aW9uYWwpIHtGdW5jdGlvbn0gdG8gYmUgcGVyaW9kaWNhbGx5IGNhbGxlZFxuICAjICAgICB3aXRoIG51bWJlciBvZiBwYXRocyBzZWFyY2hlZC5cbiAgIyAqIGBpdGVyYXRvcmAge0Z1bmN0aW9ufSBjYWxsYmFjayBvbiBlYWNoIGZpbGUgZm91bmQuXG4gICNcbiAgIyBSZXR1cm5zIGEge1Byb21pc2V9IHdpdGggYSBgY2FuY2VsKClgIG1ldGhvZCB0aGF0IHdpbGwgY2FuY2VsIGFsbFxuICAjIG9mIHRoZSB1bmRlcmx5aW5nIHNlYXJjaGVzIHRoYXQgd2VyZSBzdGFydGVkIGFzIHBhcnQgb2YgdGhpcyBzY2FuLlxuICBzY2FuOiAocmVnZXgsIG9wdGlvbnM9e30sIGl0ZXJhdG9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKVxuICAgICAgaXRlcmF0b3IgPSBvcHRpb25zXG4gICAgICBvcHRpb25zID0ge31cblxuICAgICMgRmluZCBhIHNlYXJjaGVyIGZvciBldmVyeSBEaXJlY3RvcnkgaW4gdGhlIHByb2plY3QuIEVhY2ggc2VhcmNoZXIgdGhhdCBpcyBtYXRjaGVkXG4gICAgIyB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCBhbiBBcnJheSBvZiBEaXJlY3Rvcnkgb2JqZWN0cyBpbiB0aGUgTWFwLlxuICAgIGRpcmVjdG9yaWVzRm9yU2VhcmNoZXIgPSBuZXcgTWFwKClcbiAgICBmb3IgZGlyZWN0b3J5IGluIEBwcm9qZWN0LmdldERpcmVjdG9yaWVzKClcbiAgICAgIHNlYXJjaGVyID0gQGRlZmF1bHREaXJlY3RvcnlTZWFyY2hlclxuICAgICAgZm9yIGRpcmVjdG9yeVNlYXJjaGVyIGluIEBkaXJlY3RvcnlTZWFyY2hlcnNcbiAgICAgICAgaWYgZGlyZWN0b3J5U2VhcmNoZXIuY2FuU2VhcmNoRGlyZWN0b3J5KGRpcmVjdG9yeSlcbiAgICAgICAgICBzZWFyY2hlciA9IGRpcmVjdG9yeVNlYXJjaGVyXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGRpcmVjdG9yaWVzID0gZGlyZWN0b3JpZXNGb3JTZWFyY2hlci5nZXQoc2VhcmNoZXIpXG4gICAgICB1bmxlc3MgZGlyZWN0b3JpZXNcbiAgICAgICAgZGlyZWN0b3JpZXMgPSBbXVxuICAgICAgICBkaXJlY3Rvcmllc0ZvclNlYXJjaGVyLnNldChzZWFyY2hlciwgZGlyZWN0b3JpZXMpXG4gICAgICBkaXJlY3Rvcmllcy5wdXNoKGRpcmVjdG9yeSlcblxuICAgICMgRGVmaW5lIHRoZSBvblBhdGhzU2VhcmNoZWQgY2FsbGJhY2suXG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMub25QYXRoc1NlYXJjaGVkKVxuICAgICAgIyBNYWludGFpbiBhIG1hcCBvZiBkaXJlY3RvcmllcyB0byB0aGUgbnVtYmVyIG9mIHNlYXJjaCByZXN1bHRzLiBXaGVuIG5vdGlmaWVkIG9mIGEgbmV3IGNvdW50LFxuICAgICAgIyByZXBsYWNlIHRoZSBlbnRyeSBpbiB0aGUgbWFwIGFuZCB1cGRhdGUgdGhlIHRvdGFsLlxuICAgICAgb25QYXRoc1NlYXJjaGVkT3B0aW9uID0gb3B0aW9ucy5vblBhdGhzU2VhcmNoZWRcbiAgICAgIHRvdGFsTnVtYmVyT2ZQYXRoc1NlYXJjaGVkID0gMFxuICAgICAgbnVtYmVyT2ZQYXRoc1NlYXJjaGVkRm9yU2VhcmNoZXIgPSBuZXcgTWFwKClcbiAgICAgIG9uUGF0aHNTZWFyY2hlZCA9IChzZWFyY2hlciwgbnVtYmVyT2ZQYXRoc1NlYXJjaGVkKSAtPlxuICAgICAgICBvbGRWYWx1ZSA9IG51bWJlck9mUGF0aHNTZWFyY2hlZEZvclNlYXJjaGVyLmdldChzZWFyY2hlcilcbiAgICAgICAgaWYgb2xkVmFsdWVcbiAgICAgICAgICB0b3RhbE51bWJlck9mUGF0aHNTZWFyY2hlZCAtPSBvbGRWYWx1ZVxuICAgICAgICBudW1iZXJPZlBhdGhzU2VhcmNoZWRGb3JTZWFyY2hlci5zZXQoc2VhcmNoZXIsIG51bWJlck9mUGF0aHNTZWFyY2hlZClcbiAgICAgICAgdG90YWxOdW1iZXJPZlBhdGhzU2VhcmNoZWQgKz0gbnVtYmVyT2ZQYXRoc1NlYXJjaGVkXG4gICAgICAgIG9uUGF0aHNTZWFyY2hlZE9wdGlvbih0b3RhbE51bWJlck9mUGF0aHNTZWFyY2hlZClcbiAgICBlbHNlXG4gICAgICBvblBhdGhzU2VhcmNoZWQgPSAtPlxuXG4gICAgIyBLaWNrIG9mZiBhbGwgb2YgdGhlIHNlYXJjaGVzIGFuZCB1bmlmeSB0aGVtIGludG8gb25lIFByb21pc2UuXG4gICAgYWxsU2VhcmNoZXMgPSBbXVxuICAgIGRpcmVjdG9yaWVzRm9yU2VhcmNoZXIuZm9yRWFjaCAoZGlyZWN0b3JpZXMsIHNlYXJjaGVyKSA9PlxuICAgICAgc2VhcmNoT3B0aW9ucyA9XG4gICAgICAgIGluY2x1c2lvbnM6IG9wdGlvbnMucGF0aHMgb3IgW11cbiAgICAgICAgaW5jbHVkZUhpZGRlbjogdHJ1ZVxuICAgICAgICBleGNsdWRlVmNzSWdub3JlczogQGNvbmZpZy5nZXQoJ2NvcmUuZXhjbHVkZVZjc0lnbm9yZWRQYXRocycpXG4gICAgICAgIGV4Y2x1c2lvbnM6IEBjb25maWcuZ2V0KCdjb3JlLmlnbm9yZWROYW1lcycpXG4gICAgICAgIGZvbGxvdzogQGNvbmZpZy5nZXQoJ2NvcmUuZm9sbG93U3ltbGlua3MnKVxuICAgICAgICBkaWRNYXRjaDogKHJlc3VsdCkgPT5cbiAgICAgICAgICBpdGVyYXRvcihyZXN1bHQpIHVubGVzcyBAcHJvamVjdC5pc1BhdGhNb2RpZmllZChyZXN1bHQuZmlsZVBhdGgpXG4gICAgICAgIGRpZEVycm9yOiAoZXJyb3IpIC0+XG4gICAgICAgICAgaXRlcmF0b3IobnVsbCwgZXJyb3IpXG4gICAgICAgIGRpZFNlYXJjaFBhdGhzOiAoY291bnQpIC0+IG9uUGF0aHNTZWFyY2hlZChzZWFyY2hlciwgY291bnQpXG4gICAgICBkaXJlY3RvcnlTZWFyY2hlciA9IHNlYXJjaGVyLnNlYXJjaChkaXJlY3RvcmllcywgcmVnZXgsIHNlYXJjaE9wdGlvbnMpXG4gICAgICBhbGxTZWFyY2hlcy5wdXNoKGRpcmVjdG9yeVNlYXJjaGVyKVxuICAgIHNlYXJjaFByb21pc2UgPSBQcm9taXNlLmFsbChhbGxTZWFyY2hlcylcblxuICAgIGZvciBidWZmZXIgaW4gQHByb2plY3QuZ2V0QnVmZmVycygpIHdoZW4gYnVmZmVyLmlzTW9kaWZpZWQoKVxuICAgICAgZmlsZVBhdGggPSBidWZmZXIuZ2V0UGF0aCgpXG4gICAgICBjb250aW51ZSB1bmxlc3MgQHByb2plY3QuY29udGFpbnMoZmlsZVBhdGgpXG4gICAgICBtYXRjaGVzID0gW11cbiAgICAgIGJ1ZmZlci5zY2FuIHJlZ2V4LCAobWF0Y2gpIC0+IG1hdGNoZXMucHVzaCBtYXRjaFxuICAgICAgaXRlcmF0b3Ige2ZpbGVQYXRoLCBtYXRjaGVzfSBpZiBtYXRjaGVzLmxlbmd0aCA+IDBcblxuICAgICMgTWFrZSBzdXJlIHRoZSBQcm9taXNlIHRoYXQgaXMgcmV0dXJuZWQgdG8gdGhlIGNsaWVudCBpcyBjYW5jZWxhYmxlLiBUbyBiZSBjb25zaXN0ZW50XG4gICAgIyB3aXRoIHRoZSBleGlzdGluZyBiZWhhdmlvciwgaW5zdGVhZCBvZiBjYW5jZWwoKSByZWplY3RpbmcgdGhlIHByb21pc2UsIGl0IHNob3VsZFxuICAgICMgcmVzb2x2ZSBpdCB3aXRoIHRoZSBzcGVjaWFsIHZhbHVlICdjYW5jZWxsZWQnLiBBdCBsZWFzdCB0aGUgYnVpbHQtaW4gZmluZC1hbmQtcmVwbGFjZVxuICAgICMgcGFja2FnZSByZWxpZXMgb24gdGhpcyBiZWhhdmlvci5cbiAgICBpc0NhbmNlbGxlZCA9IGZhbHNlXG4gICAgY2FuY2VsbGFibGVQcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIG9uU3VjY2VzcyA9IC0+XG4gICAgICAgIGlmIGlzQ2FuY2VsbGVkXG4gICAgICAgICAgcmVzb2x2ZSgnY2FuY2VsbGVkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlc29sdmUobnVsbClcblxuICAgICAgb25GYWlsdXJlID0gLT5cbiAgICAgICAgcHJvbWlzZS5jYW5jZWwoKSBmb3IgcHJvbWlzZSBpbiBhbGxTZWFyY2hlc1xuICAgICAgICByZWplY3QoKVxuXG4gICAgICBzZWFyY2hQcm9taXNlLnRoZW4ob25TdWNjZXNzLCBvbkZhaWx1cmUpXG4gICAgY2FuY2VsbGFibGVQcm9taXNlLmNhbmNlbCA9IC0+XG4gICAgICBpc0NhbmNlbGxlZCA9IHRydWVcbiAgICAgICMgTm90ZSB0aGF0IGNhbmNlbGxpbmcgYWxsIG9mIHRoZSBtZW1iZXJzIG9mIGFsbFNlYXJjaGVzIHdpbGwgY2F1c2UgYWxsIG9mIHRoZSBzZWFyY2hlc1xuICAgICAgIyB0byByZXNvbHZlLCB3aGljaCBjYXVzZXMgc2VhcmNoUHJvbWlzZSB0byByZXNvbHZlLCB3aGljaCBpcyB1bHRpbWF0ZWx5IHdoYXQgY2F1c2VzXG4gICAgICAjIGNhbmNlbGxhYmxlUHJvbWlzZSB0byByZXNvbHZlLlxuICAgICAgcHJvbWlzZS5jYW5jZWwoKSBmb3IgcHJvbWlzZSBpbiBhbGxTZWFyY2hlc1xuXG4gICAgIyBBbHRob3VnaCB0aGlzIG1ldGhvZCBjbGFpbXMgdG8gcmV0dXJuIGEgYFByb21pc2VgLCB0aGUgYFJlc3VsdHNQYW5lVmlldy5vblNlYXJjaCgpYFxuICAgICMgbWV0aG9kIGluIHRoZSBmaW5kLWFuZC1yZXBsYWNlIHBhY2thZ2UgZXhwZWN0cyB0aGUgb2JqZWN0IHJldHVybmVkIGJ5IHRoaXMgbWV0aG9kIHRvIGhhdmUgYVxuICAgICMgYGRvbmUoKWAgbWV0aG9kLiBJbmNsdWRlIGEgZG9uZSgpIG1ldGhvZCB1bnRpbCBmaW5kLWFuZC1yZXBsYWNlIGNhbiBiZSB1cGRhdGVkLlxuICAgIGNhbmNlbGxhYmxlUHJvbWlzZS5kb25lID0gKG9uU3VjY2Vzc09yRmFpbHVyZSkgLT5cbiAgICAgIGNhbmNlbGxhYmxlUHJvbWlzZS50aGVuKG9uU3VjY2Vzc09yRmFpbHVyZSwgb25TdWNjZXNzT3JGYWlsdXJlKVxuICAgIGNhbmNlbGxhYmxlUHJvbWlzZVxuXG4gICMgUHVibGljOiBQZXJmb3JtcyBhIHJlcGxhY2UgYWNyb3NzIGFsbCB0aGUgc3BlY2lmaWVkIGZpbGVzIGluIHRoZSBwcm9qZWN0LlxuICAjXG4gICMgKiBgcmVnZXhgIEEge1JlZ0V4cH0gdG8gc2VhcmNoIHdpdGguXG4gICMgKiBgcmVwbGFjZW1lbnRUZXh0YCB7U3RyaW5nfSB0byByZXBsYWNlIGFsbCBtYXRjaGVzIG9mIHJlZ2V4IHdpdGguXG4gICMgKiBgZmlsZVBhdGhzYCBBbiB7QXJyYXl9IG9mIGZpbGUgcGF0aCBzdHJpbmdzIHRvIHJ1biB0aGUgcmVwbGFjZSBvbi5cbiAgIyAqIGBpdGVyYXRvcmAgQSB7RnVuY3Rpb259IGNhbGxiYWNrIG9uIGVhY2ggZmlsZSB3aXRoIHJlcGxhY2VtZW50czpcbiAgIyAgICogYG9wdGlvbnNgIHtPYmplY3R9IHdpdGgga2V5cyBgZmlsZVBhdGhgIGFuZCBgcmVwbGFjZW1lbnRzYC5cbiAgI1xuICAjIFJldHVybnMgYSB7UHJvbWlzZX0uXG4gIHJlcGxhY2U6IChyZWdleCwgcmVwbGFjZW1lbnRUZXh0LCBmaWxlUGF0aHMsIGl0ZXJhdG9yKSAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICBvcGVuUGF0aHMgPSAoYnVmZmVyLmdldFBhdGgoKSBmb3IgYnVmZmVyIGluIEBwcm9qZWN0LmdldEJ1ZmZlcnMoKSlcbiAgICAgIG91dE9mUHJvY2Vzc1BhdGhzID0gXy5kaWZmZXJlbmNlKGZpbGVQYXRocywgb3BlblBhdGhzKVxuXG4gICAgICBpblByb2Nlc3NGaW5pc2hlZCA9IG5vdCBvcGVuUGF0aHMubGVuZ3RoXG4gICAgICBvdXRPZlByb2Nlc3NGaW5pc2hlZCA9IG5vdCBvdXRPZlByb2Nlc3NQYXRocy5sZW5ndGhcbiAgICAgIGNoZWNrRmluaXNoZWQgPSAtPlxuICAgICAgICByZXNvbHZlKCkgaWYgb3V0T2ZQcm9jZXNzRmluaXNoZWQgYW5kIGluUHJvY2Vzc0ZpbmlzaGVkXG5cbiAgICAgIHVubGVzcyBvdXRPZlByb2Nlc3NGaW5pc2hlZC5sZW5ndGhcbiAgICAgICAgZmxhZ3MgPSAnZydcbiAgICAgICAgZmxhZ3MgKz0gJ2knIGlmIHJlZ2V4Lmlnbm9yZUNhc2VcblxuICAgICAgICB0YXNrID0gVGFzay5vbmNlIHJlcXVpcmUucmVzb2x2ZSgnLi9yZXBsYWNlLWhhbmRsZXInKSwgb3V0T2ZQcm9jZXNzUGF0aHMsIHJlZ2V4LnNvdXJjZSwgZmxhZ3MsIHJlcGxhY2VtZW50VGV4dCwgLT5cbiAgICAgICAgICBvdXRPZlByb2Nlc3NGaW5pc2hlZCA9IHRydWVcbiAgICAgICAgICBjaGVja0ZpbmlzaGVkKClcblxuICAgICAgICB0YXNrLm9uICdyZXBsYWNlOnBhdGgtcmVwbGFjZWQnLCBpdGVyYXRvclxuICAgICAgICB0YXNrLm9uICdyZXBsYWNlOmZpbGUtZXJyb3InLCAoZXJyb3IpIC0+IGl0ZXJhdG9yKG51bGwsIGVycm9yKVxuXG4gICAgICBmb3IgYnVmZmVyIGluIEBwcm9qZWN0LmdldEJ1ZmZlcnMoKVxuICAgICAgICBjb250aW51ZSB1bmxlc3MgYnVmZmVyLmdldFBhdGgoKSBpbiBmaWxlUGF0aHNcbiAgICAgICAgcmVwbGFjZW1lbnRzID0gYnVmZmVyLnJlcGxhY2UocmVnZXgsIHJlcGxhY2VtZW50VGV4dCwgaXRlcmF0b3IpXG4gICAgICAgIGl0ZXJhdG9yKHtmaWxlUGF0aDogYnVmZmVyLmdldFBhdGgoKSwgcmVwbGFjZW1lbnRzfSkgaWYgcmVwbGFjZW1lbnRzXG5cbiAgICAgIGluUHJvY2Vzc0ZpbmlzaGVkID0gdHJ1ZVxuICAgICAgY2hlY2tGaW5pc2hlZCgpXG5cbiAgY2hlY2tvdXRIZWFkUmV2aXNpb246IChlZGl0b3IpIC0+XG4gICAgaWYgZWRpdG9yLmdldFBhdGgoKVxuICAgICAgY2hlY2tvdXRIZWFkID0gPT5cbiAgICAgICAgQHByb2plY3QucmVwb3NpdG9yeUZvckRpcmVjdG9yeShuZXcgRGlyZWN0b3J5KGVkaXRvci5nZXREaXJlY3RvcnlQYXRoKCkpKVxuICAgICAgICAgIC50aGVuIChyZXBvc2l0b3J5KSAtPlxuICAgICAgICAgICAgcmVwb3NpdG9yeT8uY2hlY2tvdXRIZWFkRm9yRWRpdG9yKGVkaXRvcilcblxuICAgICAgaWYgQGNvbmZpZy5nZXQoJ2VkaXRvci5jb25maXJtQ2hlY2tvdXRIZWFkUmV2aXNpb24nKVxuICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5jb25maXJtXG4gICAgICAgICAgbWVzc2FnZTogJ0NvbmZpcm0gQ2hlY2tvdXQgSEVBRCBSZXZpc2lvbidcbiAgICAgICAgICBkZXRhaWxlZE1lc3NhZ2U6IFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRpc2NhcmQgYWxsIGNoYW5nZXMgdG8gXFxcIiN7ZWRpdG9yLmdldEZpbGVOYW1lKCl9XFxcIiBzaW5jZSB0aGUgbGFzdCBHaXQgY29tbWl0P1wiXG4gICAgICAgICAgYnV0dG9uczpcbiAgICAgICAgICAgIE9LOiBjaGVja291dEhlYWRcbiAgICAgICAgICAgIENhbmNlbDogbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBjaGVja291dEhlYWQoKVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVzb2x2ZShmYWxzZSlcbiJdfQ==
