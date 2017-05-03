(function() {
  var BrowserWindow, CompositeDisposable, TabBarView, TabView, _, closest, indexOf, ipcRenderer, matches, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BrowserWindow = null;

  ipcRenderer = require('electron').ipcRenderer;

  ref = require('./html-helpers'), matches = ref.matches, closest = ref.closest, indexOf = ref.indexOf;

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  TabView = require('./tab-view');

  TabBarView = (function(superClass) {
    extend(TabBarView, superClass);

    function TabBarView() {
      return TabBarView.__super__.constructor.apply(this, arguments);
    }

    TabBarView.prototype.createdCallback = function() {
      this.classList.add("list-inline");
      this.classList.add("tab-bar");
      this.classList.add("inset-panel");
      return this.setAttribute("tabindex", -1);
    };

    TabBarView.prototype.initialize = function(pane1) {
      var addElementCommands, item, j, len, ref1;
      this.pane = pane1;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add(atom.views.getView(this.pane), {
        'tabs:keep-pending-tab': (function(_this) {
          return function() {
            return _this.terminatePendingStates();
          };
        })(this),
        'tabs:close-tab': (function(_this) {
          return function() {
            return _this.closeTab(_this.getActiveTab());
          };
        })(this),
        'tabs:close-other-tabs': (function(_this) {
          return function() {
            return _this.closeOtherTabs(_this.getActiveTab());
          };
        })(this),
        'tabs:close-tabs-to-right': (function(_this) {
          return function() {
            return _this.closeTabsToRight(_this.getActiveTab());
          };
        })(this),
        'tabs:close-tabs-to-left': (function(_this) {
          return function() {
            return _this.closeTabsToLeft(_this.getActiveTab());
          };
        })(this),
        'tabs:close-saved-tabs': (function(_this) {
          return function() {
            return _this.closeSavedTabs();
          };
        })(this),
        'tabs:close-all-tabs': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.closeAllTabs();
          };
        })(this),
        'tabs:open-in-new-window': (function(_this) {
          return function() {
            return _this.openInNewWindow();
          };
        })(this)
      }));
      addElementCommands = (function(_this) {
        return function(commands) {
          var commandsWithPropagationStopped;
          commandsWithPropagationStopped = {};
          Object.keys(commands).forEach(function(name) {
            return commandsWithPropagationStopped[name] = function(event) {
              event.stopPropagation();
              return commands[name]();
            };
          });
          return _this.subscriptions.add(atom.commands.add(_this, commandsWithPropagationStopped));
        };
      })(this);
      addElementCommands({
        'tabs:close-tab': (function(_this) {
          return function() {
            return _this.closeTab();
          };
        })(this),
        'tabs:close-other-tabs': (function(_this) {
          return function() {
            return _this.closeOtherTabs();
          };
        })(this),
        'tabs:close-tabs-to-right': (function(_this) {
          return function() {
            return _this.closeTabsToRight();
          };
        })(this),
        'tabs:close-tabs-to-left': (function(_this) {
          return function() {
            return _this.closeTabsToLeft();
          };
        })(this),
        'tabs:close-saved-tabs': (function(_this) {
          return function() {
            return _this.closeSavedTabs();
          };
        })(this),
        'tabs:close-all-tabs': (function(_this) {
          return function() {
            return _this.closeAllTabs();
          };
        })(this),
        'tabs:split-up': (function(_this) {
          return function() {
            return _this.splitTab('splitUp');
          };
        })(this),
        'tabs:split-down': (function(_this) {
          return function() {
            return _this.splitTab('splitDown');
          };
        })(this),
        'tabs:split-left': (function(_this) {
          return function() {
            return _this.splitTab('splitLeft');
          };
        })(this),
        'tabs:split-right': (function(_this) {
          return function() {
            return _this.splitTab('splitRight');
          };
        })(this)
      });
      this.addEventListener("mouseenter", this.onMouseEnter);
      this.addEventListener("mouseleave", this.onMouseLeave);
      this.addEventListener("dragstart", this.onDragStart);
      this.addEventListener("dragend", this.onDragEnd);
      this.addEventListener("dragleave", this.onDragLeave);
      this.addEventListener("dragover", this.onDragOver);
      this.addEventListener("drop", this.onDrop);
      this.paneContainer = this.pane.getContainer();
      ref1 = this.pane.getItems();
      for (j = 0, len = ref1.length; j < len; j++) {
        item = ref1[j];
        this.addTabForItem(item);
      }
      this.subscriptions.add(this.pane.onDidDestroy((function(_this) {
        return function() {
          return _this.unsubscribe();
        };
      })(this)));
      this.subscriptions.add(this.pane.onDidAddItem((function(_this) {
        return function(arg) {
          var index, item;
          item = arg.item, index = arg.index;
          return _this.addTabForItem(item, index);
        };
      })(this)));
      this.subscriptions.add(this.pane.onDidMoveItem((function(_this) {
        return function(arg) {
          var item, newIndex;
          item = arg.item, newIndex = arg.newIndex;
          return _this.moveItemTabToIndex(item, newIndex);
        };
      })(this)));
      this.subscriptions.add(this.pane.onDidRemoveItem((function(_this) {
        return function(arg) {
          var item;
          item = arg.item;
          return _this.removeTabForItem(item);
        };
      })(this)));
      this.subscriptions.add(this.pane.onDidChangeActiveItem((function(_this) {
        return function(item) {
          return _this.updateActiveTab();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('tabs.tabScrolling', this.updateTabScrolling.bind(this)));
      this.subscriptions.add(atom.config.observe('tabs.tabScrollingThreshold', (function(_this) {
        return function() {
          return _this.updateTabScrollingThreshold();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('tabs.alwaysShowTabBar', (function(_this) {
        return function() {
          return _this.updateTabBarVisibility();
        };
      })(this)));
      this.updateActiveTab();
      this.addEventListener("mousedown", this.onMouseDown);
      this.addEventListener("dblclick", this.onDoubleClick);
      this.addEventListener("click", this.onClick);
      this.onDropOnOtherWindow = this.onDropOnOtherWindow.bind(this);
      return ipcRenderer.on('tab:dropped', this.onDropOnOtherWindow);
    };

    TabBarView.prototype.unsubscribe = function() {
      ipcRenderer.removeListener('tab:dropped', this.onDropOnOtherWindow);
      return this.subscriptions.dispose();
    };

    TabBarView.prototype.terminatePendingStates = function() {
      var j, len, ref1, tab;
      ref1 = this.getTabs();
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        if (typeof tab.terminatePendingState === "function") {
          tab.terminatePendingState();
        }
      }
    };

    TabBarView.prototype.addTabForItem = function(item, index) {
      var tabView;
      tabView = new TabView();
      tabView.initialize(item, this.pane);
      if (this.isItemMovingBetweenPanes) {
        tabView.terminatePendingState();
      }
      this.insertTabAtIndex(tabView, index);
      if (atom.config.get('tabs.addNewTabsAtEnd')) {
        if (!this.isItemMovingBetweenPanes) {
          return this.pane.moveItem(item, this.pane.getItems().length - 1);
        }
      }
    };

    TabBarView.prototype.moveItemTabToIndex = function(item, index) {
      var tab;
      if (tab = this.tabForItem(item)) {
        tab.remove();
        return this.insertTabAtIndex(tab, index);
      }
    };

    TabBarView.prototype.insertTabAtIndex = function(tab, index) {
      var followingTab;
      if (index != null) {
        followingTab = this.tabAtIndex(index);
      }
      if (followingTab) {
        this.insertBefore(tab, followingTab);
      } else {
        this.appendChild(tab);
      }
      tab.updateTitle();
      return this.updateTabBarVisibility();
    };

    TabBarView.prototype.removeTabForItem = function(item) {
      var j, len, ref1, ref2, tab;
      if ((ref1 = this.tabForItem(item)) != null) {
        ref1.destroy();
      }
      ref2 = this.getTabs();
      for (j = 0, len = ref2.length; j < len; j++) {
        tab = ref2[j];
        tab.updateTitle();
      }
      return this.updateTabBarVisibility();
    };

    TabBarView.prototype.scrollToTab = function(tab) {
      var tabBarRightEdge, tabRightEdge;
      tabRightEdge = tab.offsetLeft + tab.clientWidth;
      tabBarRightEdge = this.scrollLeft + this.clientWidth;
      if (tabRightEdge > tabBarRightEdge) {
        return this.scrollLeft = tabRightEdge - this.clientWidth;
      } else if (this.scrollLeft > tab.offsetLeft) {
        return this.scrollLeft = tab.offsetLeft;
      }
    };

    TabBarView.prototype.updateTabBarVisibility = function() {
      if (!atom.config.get('tabs.alwaysShowTabBar') && !this.shouldAllowDrag()) {
        return this.classList.add('hidden');
      } else {
        return this.classList.remove('hidden');
      }
    };

    TabBarView.prototype.getTabs = function() {
      var j, len, ref1, results, tab;
      ref1 = this.querySelectorAll(".tab");
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        results.push(tab);
      }
      return results;
    };

    TabBarView.prototype.tabAtIndex = function(index) {
      return this.querySelectorAll(".tab")[index];
    };

    TabBarView.prototype.tabForItem = function(item) {
      return _.detect(this.getTabs(), function(tab) {
        return tab.item === item;
      });
    };

    TabBarView.prototype.setActiveTab = function(tabView) {
      var ref1;
      if ((tabView != null) && !tabView.classList.contains('active')) {
        if ((ref1 = this.querySelector('.tab.active')) != null) {
          ref1.classList.remove('active');
        }
        tabView.classList.add('active');
        return this.scrollToTab(tabView);
      }
    };

    TabBarView.prototype.getActiveTab = function() {
      return this.tabForItem(this.pane.getActiveItem());
    };

    TabBarView.prototype.updateActiveTab = function() {
      return this.setActiveTab(this.tabForItem(this.pane.getActiveItem()));
    };

    TabBarView.prototype.closeTab = function(tab) {
      if (tab == null) {
        tab = this.querySelector('.right-clicked');
      }
      if (tab != null) {
        return this.pane.destroyItem(tab.item);
      }
    };

    TabBarView.prototype.openInNewWindow = function(tab) {
      var item, itemURI, pathsToOpen;
      if (tab == null) {
        tab = this.querySelector('.right-clicked');
      }
      item = tab != null ? tab.item : void 0;
      if (item == null) {
        return;
      }
      if (typeof item.getURI === 'function') {
        itemURI = item.getURI();
      } else if (typeof item.getPath === 'function') {
        itemURI = item.getPath();
      } else if (typeof item.getUri === 'function') {
        itemURI = item.getUri();
      }
      if (itemURI == null) {
        return;
      }
      this.closeTab(tab);
      pathsToOpen = [atom.project.getPaths(), itemURI].reduce((function(a, b) {
        return a.concat(b);
      }), []);
      return atom.open({
        pathsToOpen: pathsToOpen,
        newWindow: true,
        devMode: atom.devMode,
        safeMode: atom.safeMode
      });
    };

    TabBarView.prototype.splitTab = function(fn) {
      var copiedItem, item, ref1;
      if (item = (ref1 = this.querySelector('.right-clicked')) != null ? ref1.item : void 0) {
        if (copiedItem = this.copyItem(item)) {
          return this.pane[fn]({
            items: [copiedItem]
          });
        }
      }
    };

    TabBarView.prototype.copyItem = function(item) {
      var ref1;
      return (ref1 = typeof item.copy === "function" ? item.copy() : void 0) != null ? ref1 : atom.deserializers.deserialize(item.serialize());
    };

    TabBarView.prototype.closeOtherTabs = function(active) {
      var j, len, results, tab, tabs;
      tabs = this.getTabs();
      if (active == null) {
        active = this.querySelector('.right-clicked');
      }
      if (active == null) {
        return;
      }
      results = [];
      for (j = 0, len = tabs.length; j < len; j++) {
        tab = tabs[j];
        if (tab !== active) {
          results.push(this.closeTab(tab));
        }
      }
      return results;
    };

    TabBarView.prototype.closeTabsToRight = function(active) {
      var i, index, j, len, results, tab, tabs;
      tabs = this.getTabs();
      if (active == null) {
        active = this.querySelector('.right-clicked');
      }
      index = tabs.indexOf(active);
      if (index === -1) {
        return;
      }
      results = [];
      for (i = j = 0, len = tabs.length; j < len; i = ++j) {
        tab = tabs[i];
        if (i > index) {
          results.push(this.closeTab(tab));
        }
      }
      return results;
    };

    TabBarView.prototype.closeTabsToLeft = function(active) {
      var i, index, j, len, results, tab, tabs;
      tabs = this.getTabs();
      if (active == null) {
        active = this.querySelector('.right-clicked');
      }
      index = tabs.indexOf(active);
      if (index === -1) {
        return;
      }
      results = [];
      for (i = j = 0, len = tabs.length; j < len; i = ++j) {
        tab = tabs[i];
        if (i < index) {
          results.push(this.closeTab(tab));
        }
      }
      return results;
    };

    TabBarView.prototype.closeSavedTabs = function() {
      var base, j, len, ref1, results, tab;
      ref1 = this.getTabs();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        if (!(typeof (base = tab.item).isModified === "function" ? base.isModified() : void 0)) {
          results.push(this.closeTab(tab));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    TabBarView.prototype.closeAllTabs = function() {
      var j, len, ref1, results, tab;
      ref1 = this.getTabs();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        results.push(this.closeTab(tab));
      }
      return results;
    };

    TabBarView.prototype.getWindowId = function() {
      return this.windowId != null ? this.windowId : this.windowId = atom.getCurrentWindow().id;
    };

    TabBarView.prototype.shouldAllowDrag = function() {
      return (this.paneContainer.getPanes().length > 1) || (this.pane.getItems().length > 1);
    };

    TabBarView.prototype.onDragStart = function(event) {
      var element, item, itemURI, paneIndex, ref1, ref2, ref3;
      if (!matches(event.target, '.sortable')) {
        return;
      }
      event.dataTransfer.setData('atom-event', 'true');
      element = closest(event.target, '.sortable');
      element.classList.add('is-dragging');
      element.destroyTooltip();
      event.dataTransfer.setData('sortable-index', indexOf(element));
      paneIndex = this.paneContainer.getPanes().indexOf(this.pane);
      event.dataTransfer.setData('from-pane-index', paneIndex);
      event.dataTransfer.setData('from-pane-id', this.pane.id);
      event.dataTransfer.setData('from-window-id', this.getWindowId());
      item = this.pane.getItems()[indexOf(element)];
      if (item == null) {
        return;
      }
      if (typeof item.getURI === 'function') {
        itemURI = (ref1 = item.getURI()) != null ? ref1 : '';
      } else if (typeof item.getPath === 'function') {
        itemURI = (ref2 = item.getPath()) != null ? ref2 : '';
      } else if (typeof item.getUri === 'function') {
        itemURI = (ref3 = item.getUri()) != null ? ref3 : '';
      }
      if (itemURI != null) {
        event.dataTransfer.setData('text/plain', itemURI);
        if (process.platform === 'darwin') {
          if (!this.uriHasProtocol(itemURI)) {
            itemURI = "file://" + itemURI;
          }
          event.dataTransfer.setData('text/uri-list', itemURI);
        }
        if ((typeof item.isModified === "function" ? item.isModified() : void 0) && (item.getText != null)) {
          event.dataTransfer.setData('has-unsaved-changes', 'true');
          return event.dataTransfer.setData('modified-text', item.getText());
        }
      }
    };

    TabBarView.prototype.uriHasProtocol = function(uri) {
      var error;
      try {
        return require('url').parse(uri).protocol != null;
      } catch (error1) {
        error = error1;
        return false;
      }
    };

    TabBarView.prototype.onDragLeave = function(event) {
      return this.removePlaceholder();
    };

    TabBarView.prototype.onDragEnd = function(event) {
      if (!matches(event.target, '.sortable')) {
        return;
      }
      return this.clearDropTarget();
    };

    TabBarView.prototype.onDragOver = function(event) {
      var element, newDropTargetIndex, placeholder, sibling, sortableObjects, tabBar;
      if (event.dataTransfer.getData('atom-event') !== 'true') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      newDropTargetIndex = this.getDropTargetIndex(event);
      if (newDropTargetIndex == null) {
        return;
      }
      this.removeDropTargetClasses();
      tabBar = this.getTabBar(event.target);
      sortableObjects = tabBar.querySelectorAll(".sortable");
      placeholder = this.getPlaceholder();
      if (placeholder == null) {
        return;
      }
      if (newDropTargetIndex < sortableObjects.length) {
        element = sortableObjects[newDropTargetIndex];
        element.classList.add('is-drop-target');
        return element.parentElement.insertBefore(placeholder, element);
      } else {
        if (element = sortableObjects[newDropTargetIndex - 1]) {
          element.classList.add('drop-target-is-after');
          if (sibling = element.nextSibling) {
            return element.parentElement.insertBefore(placeholder, sibling);
          } else {
            return element.parentElement.appendChild(placeholder);
          }
        }
      }
    };

    TabBarView.prototype.onDropOnOtherWindow = function(fromPaneId, fromItemIndex) {
      var itemToRemove;
      if (this.pane.id === fromPaneId) {
        if (itemToRemove = this.pane.getItems()[fromItemIndex]) {
          this.pane.destroyItem(itemToRemove);
        }
      }
      return this.clearDropTarget();
    };

    TabBarView.prototype.clearDropTarget = function() {
      var element;
      element = this.querySelector(".is-dragging");
      if (element != null) {
        element.classList.remove('is-dragging');
      }
      if (element != null) {
        element.updateTooltip();
      }
      this.removeDropTargetClasses();
      return this.removePlaceholder();
    };

    TabBarView.prototype.onDrop = function(event) {
      var droppedURI, fromIndex, fromPane, fromPaneId, fromPaneIndex, fromWindowId, hasUnsavedChanges, item, modifiedText, toIndex, toPane;
      event.preventDefault();
      if (event.dataTransfer.getData('atom-event') !== 'true') {
        return;
      }
      fromWindowId = parseInt(event.dataTransfer.getData('from-window-id'));
      fromPaneId = parseInt(event.dataTransfer.getData('from-pane-id'));
      fromIndex = parseInt(event.dataTransfer.getData('sortable-index'));
      fromPaneIndex = parseInt(event.dataTransfer.getData('from-pane-index'));
      hasUnsavedChanges = event.dataTransfer.getData('has-unsaved-changes') === 'true';
      modifiedText = event.dataTransfer.getData('modified-text');
      toIndex = this.getDropTargetIndex(event);
      toPane = this.pane;
      this.clearDropTarget();
      if (fromWindowId === this.getWindowId()) {
        fromPane = this.paneContainer.getPanes()[fromPaneIndex];
        if ((fromPane != null ? fromPane.id : void 0) !== fromPaneId) {
          fromPane = Array.from(document.querySelectorAll('atom-pane')).map(function(paneEl) {
            return paneEl.model;
          }).find(function(pane) {
            return pane.id === fromPaneId;
          });
        }
        item = fromPane.getItems()[fromIndex];
        if (item != null) {
          return this.moveItemBetweenPanes(fromPane, fromIndex, toPane, toIndex, item);
        }
      } else {
        droppedURI = event.dataTransfer.getData('text/plain');
        atom.workspace.open(droppedURI).then((function(_this) {
          return function(item) {
            var activeItemIndex, activePane, browserWindow;
            activePane = atom.workspace.getActivePane();
            activeItemIndex = activePane.getItems().indexOf(item);
            _this.moveItemBetweenPanes(activePane, activeItemIndex, toPane, toIndex, item);
            if (hasUnsavedChanges) {
              if (typeof item.setText === "function") {
                item.setText(modifiedText);
              }
            }
            if (!isNaN(fromWindowId)) {
              browserWindow = _this.browserWindowForId(fromWindowId);
              return browserWindow != null ? browserWindow.webContents.send('tab:dropped', fromPaneId, fromIndex) : void 0;
            }
          };
        })(this));
        return atom.focus();
      }
    };

    TabBarView.prototype.onMouseWheel = function(event) {
      if (event.shiftKey) {
        return;
      }
      if (this.wheelDelta == null) {
        this.wheelDelta = 0;
      }
      this.wheelDelta += event.wheelDeltaY;
      if (this.wheelDelta <= -this.tabScrollingThreshold) {
        this.wheelDelta = 0;
        return this.pane.activateNextItem();
      } else if (this.wheelDelta >= this.tabScrollingThreshold) {
        this.wheelDelta = 0;
        return this.pane.activatePreviousItem();
      }
    };

    TabBarView.prototype.onMouseDown = function(event) {
      var ref1, tab;
      if (!matches(event.target, ".tab")) {
        return;
      }
      tab = closest(event.target, '.tab');
      if (event.which === 3 || (event.which === 1 && event.ctrlKey === true)) {
        if ((ref1 = this.querySelector('.right-clicked')) != null) {
          ref1.classList.remove('right-clicked');
        }
        tab.classList.add('right-clicked');
        return event.preventDefault();
      } else if (event.which === 1 && !event.target.classList.contains('close-icon')) {
        this.pane.activateItem(tab.item);
        return setImmediate((function(_this) {
          return function() {
            if (!_this.pane.isDestroyed()) {
              return _this.pane.activate();
            }
          };
        })(this));
      } else if (event.which === 2) {
        this.pane.destroyItem(tab.item);
        return event.preventDefault();
      }
    };

    TabBarView.prototype.onDoubleClick = function(event) {
      var base, tab;
      if (tab = closest(event.target, '.tab')) {
        return typeof (base = tab.item).terminatePendingState === "function" ? base.terminatePendingState() : void 0;
      } else if (event.target === this) {
        atom.commands.dispatch(this, 'application:new-file');
        return event.preventDefault();
      }
    };

    TabBarView.prototype.onClick = function(event) {
      var tab;
      if (!matches(event.target, ".tab .close-icon")) {
        return;
      }
      tab = closest(event.target, '.tab');
      this.pane.destroyItem(tab.item);
      return false;
    };

    TabBarView.prototype.updateTabScrollingThreshold = function() {
      return this.tabScrollingThreshold = atom.config.get('tabs.tabScrollingThreshold');
    };

    TabBarView.prototype.updateTabScrolling = function(value) {
      if (value === 'platform') {
        this.tabScrolling = process.platform === 'linux';
      } else {
        this.tabScrolling = value;
      }
      this.tabScrollingThreshold = atom.config.get('tabs.tabScrollingThreshold');
      if (this.tabScrolling) {
        return this.addEventListener('mousewheel', this.onMouseWheel);
      } else {
        return this.removeEventListener('mousewheel', this.onMouseWheel);
      }
    };

    TabBarView.prototype.browserWindowForId = function(id) {
      if (BrowserWindow == null) {
        BrowserWindow = require('electron').remote.BrowserWindow;
      }
      return BrowserWindow.fromId(id);
    };

    TabBarView.prototype.moveItemBetweenPanes = function(fromPane, fromIndex, toPane, toIndex, item) {
      try {
        if (toPane === fromPane) {
          if (fromIndex < toIndex) {
            toIndex--;
          }
          toPane.moveItem(item, toIndex);
        } else {
          this.isItemMovingBetweenPanes = true;
          fromPane.moveItemToPane(item, toPane, toIndex--);
        }
        toPane.activateItem(item);
        return toPane.activate();
      } finally {
        this.isItemMovingBetweenPanes = false;
      }
    };

    TabBarView.prototype.removeDropTargetClasses = function() {
      var dropTarget, j, k, len, len1, ref1, ref2, results, workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      ref1 = workspaceElement.querySelectorAll('.tab-bar .is-drop-target');
      for (j = 0, len = ref1.length; j < len; j++) {
        dropTarget = ref1[j];
        dropTarget.classList.remove('is-drop-target');
      }
      ref2 = workspaceElement.querySelectorAll('.tab-bar .drop-target-is-after');
      results = [];
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        dropTarget = ref2[k];
        results.push(dropTarget.classList.remove('drop-target-is-after'));
      }
      return results;
    };

    TabBarView.prototype.getDropTargetIndex = function(event) {
      var element, elementCenter, elementIndex, left, ref1, sortables, tabBar, target, width;
      target = event.target;
      tabBar = this.getTabBar(target);
      if (this.isPlaceholder(target)) {
        return;
      }
      sortables = tabBar.querySelectorAll(".sortable");
      element = closest(target, '.sortable');
      if (element == null) {
        element = sortables[sortables.length - 1];
      }
      if (element == null) {
        return 0;
      }
      ref1 = element.getBoundingClientRect(), left = ref1.left, width = ref1.width;
      elementCenter = left + width / 2;
      elementIndex = indexOf(element, sortables);
      if (event.pageX < elementCenter) {
        return elementIndex;
      } else {
        return elementIndex + 1;
      }
    };

    TabBarView.prototype.getPlaceholder = function() {
      if (this.placeholderEl != null) {
        return this.placeholderEl;
      }
      this.placeholderEl = document.createElement("li");
      this.placeholderEl.classList.add("placeholder");
      return this.placeholderEl;
    };

    TabBarView.prototype.removePlaceholder = function() {
      var ref1;
      if ((ref1 = this.placeholderEl) != null) {
        ref1.remove();
      }
      return this.placeholderEl = null;
    };

    TabBarView.prototype.isPlaceholder = function(element) {
      return element.classList.contains('placeholder');
    };

    TabBarView.prototype.getTabBar = function(target) {
      if (target.classList.contains('tab-bar')) {
        return target;
      } else {
        return closest(target, '.tab-bar');
      }
    };

    TabBarView.prototype.onMouseEnter = function() {
      var j, len, ref1, tab, width;
      ref1 = this.getTabs();
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        width = tab.getBoundingClientRect().width;
        tab.style.maxWidth = width.toFixed(2) + 'px';
      }
    };

    TabBarView.prototype.onMouseLeave = function() {
      var j, len, ref1, tab;
      ref1 = this.getTabs();
      for (j = 0, len = ref1.length; j < len; j++) {
        tab = ref1[j];
        tab.style.maxWidth = '';
      }
    };

    return TabBarView;

  })(HTMLElement);

  module.exports = document.registerElement("atom-tabs", {
    prototype: TabBarView.prototype,
    "extends": "ul"
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90YWJzL2xpYi90YWItYmFyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1R0FBQTtJQUFBOzs7RUFBQSxhQUFBLEdBQWdCOztFQUNmLGNBQWUsT0FBQSxDQUFRLFVBQVI7O0VBRWhCLE1BQThCLE9BQUEsQ0FBUSxnQkFBUixDQUE5QixFQUFDLHFCQUFELEVBQVUscUJBQVYsRUFBbUI7O0VBQ2xCLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixPQUFBLEdBQVUsT0FBQSxDQUFRLFlBQVI7O0VBRUo7Ozs7Ozs7eUJBQ0osZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsYUFBZjtNQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLFNBQWY7TUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxhQUFmO2FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxVQUFkLEVBQTBCLENBQUMsQ0FBM0I7SUFKZTs7eUJBTWpCLFVBQUEsR0FBWSxTQUFDLEtBQUQ7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLE9BQUQ7TUFDWCxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BRXJCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxJQUFwQixDQUFsQixFQUNqQjtRQUFBLHVCQUFBLEVBQXlCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLHNCQUFELENBQUE7VUFB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aWwgYWN0dWFsbHkgdXNlZFxue2lwY1JlbmRlcmVyfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG57bWF0Y2hlcywgY2xvc2VzdCwgaW5kZXhPZn0gPSByZXF1aXJlICcuL2h0bWwtaGVscGVycydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuVGFiVmlldyA9IHJlcXVpcmUgJy4vdGFiLXZpZXcnXG5cbmNsYXNzIFRhYkJhclZpZXcgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgQGNsYXNzTGlzdC5hZGQoXCJsaXN0LWlubGluZVwiKVxuICAgIEBjbGFzc0xpc3QuYWRkKFwidGFiLWJhclwiKVxuICAgIEBjbGFzc0xpc3QuYWRkKFwiaW5zZXQtcGFuZWxcIilcbiAgICBAc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgLTEpXG5cbiAgaW5pdGlhbGl6ZTogKEBwYW5lKSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBhdG9tLnZpZXdzLmdldFZpZXcoQHBhbmUpLFxuICAgICAgJ3RhYnM6a2VlcC1wZW5kaW5nLXRhYic6ID0+IEB0ZXJtaW5hdGVQZW5kaW5nU3RhdGVzKClcbiAgICAgICd0YWJzOmNsb3NlLXRhYic6ID0+IEBjbG9zZVRhYihAZ2V0QWN0aXZlVGFiKCkpXG4gICAgICAndGFiczpjbG9zZS1vdGhlci10YWJzJzogPT4gQGNsb3NlT3RoZXJUYWJzKEBnZXRBY3RpdmVUYWIoKSlcbiAgICAgICd0YWJzOmNsb3NlLXRhYnMtdG8tcmlnaHQnOiA9PiBAY2xvc2VUYWJzVG9SaWdodChAZ2V0QWN0aXZlVGFiKCkpXG4gICAgICAndGFiczpjbG9zZS10YWJzLXRvLWxlZnQnOiA9PiBAY2xvc2VUYWJzVG9MZWZ0KEBnZXRBY3RpdmVUYWIoKSlcbiAgICAgICd0YWJzOmNsb3NlLXNhdmVkLXRhYnMnOiA9PiBAY2xvc2VTYXZlZFRhYnMoKVxuICAgICAgJ3RhYnM6Y2xvc2UtYWxsLXRhYnMnOiAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIEBjbG9zZUFsbFRhYnMoKVxuICAgICAgJ3RhYnM6b3Blbi1pbi1uZXctd2luZG93JzogPT4gQG9wZW5Jbk5ld1dpbmRvdygpXG5cbiAgICBhZGRFbGVtZW50Q29tbWFuZHMgPSAoY29tbWFuZHMpID0+XG4gICAgICBjb21tYW5kc1dpdGhQcm9wYWdhdGlvblN0b3BwZWQgPSB7fVxuICAgICAgT2JqZWN0LmtleXMoY29tbWFuZHMpLmZvckVhY2ggKG5hbWUpIC0+XG4gICAgICAgIGNvbW1hbmRzV2l0aFByb3BhZ2F0aW9uU3RvcHBlZFtuYW1lXSA9IChldmVudCkgLT5cbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgIGNvbW1hbmRzW25hbWVdKClcblxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKHRoaXMsIGNvbW1hbmRzV2l0aFByb3BhZ2F0aW9uU3RvcHBlZCkpXG5cbiAgICBhZGRFbGVtZW50Q29tbWFuZHNcbiAgICAgICd0YWJzOmNsb3NlLXRhYic6ID0+IEBjbG9zZVRhYigpXG4gICAgICAndGFiczpjbG9zZS1vdGhlci10YWJzJzogPT4gQGNsb3NlT3RoZXJUYWJzKClcbiAgICAgICd0YWJzOmNsb3NlLXRhYnMtdG8tcmlnaHQnOiA9PiBAY2xvc2VUYWJzVG9SaWdodCgpXG4gICAgICAndGFiczpjbG9zZS10YWJzLXRvLWxlZnQnOiA9PiBAY2xvc2VUYWJzVG9MZWZ0KClcbiAgICAgICd0YWJzOmNsb3NlLXNhdmVkLXRhYnMnOiA9PiBAY2xvc2VTYXZlZFRhYnMoKVxuICAgICAgJ3RhYnM6Y2xvc2UtYWxsLXRhYnMnOiA9PiBAY2xvc2VBbGxUYWJzKClcbiAgICAgICd0YWJzOnNwbGl0LXVwJzogPT4gQHNwbGl0VGFiKCdzcGxpdFVwJylcbiAgICAgICd0YWJzOnNwbGl0LWRvd24nOiA9PiBAc3BsaXRUYWIoJ3NwbGl0RG93bicpXG4gICAgICAndGFiczpzcGxpdC1sZWZ0JzogPT4gQHNwbGl0VGFiKCdzcGxpdExlZnQnKVxuICAgICAgJ3RhYnM6c3BsaXQtcmlnaHQnOiA9PiBAc3BsaXRUYWIoJ3NwbGl0UmlnaHQnKVxuXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgXCJtb3VzZWVudGVyXCIsIEBvbk1vdXNlRW50ZXJcbiAgICBAYWRkRXZlbnRMaXN0ZW5lciBcIm1vdXNlbGVhdmVcIiwgQG9uTW91c2VMZWF2ZVxuICAgIEBhZGRFdmVudExpc3RlbmVyIFwiZHJhZ3N0YXJ0XCIsIEBvbkRyYWdTdGFydFxuICAgIEBhZGRFdmVudExpc3RlbmVyIFwiZHJhZ2VuZFwiLCBAb25EcmFnRW5kXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgXCJkcmFnbGVhdmVcIiwgQG9uRHJhZ0xlYXZlXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgXCJkcmFnb3ZlclwiLCBAb25EcmFnT3ZlclxuICAgIEBhZGRFdmVudExpc3RlbmVyIFwiZHJvcFwiLCBAb25Ecm9wXG5cbiAgICBAcGFuZUNvbnRhaW5lciA9IEBwYW5lLmdldENvbnRhaW5lcigpXG4gICAgQGFkZFRhYkZvckl0ZW0oaXRlbSkgZm9yIGl0ZW0gaW4gQHBhbmUuZ2V0SXRlbXMoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBwYW5lLm9uRGlkRGVzdHJveSA9PlxuICAgICAgQHVuc3Vic2NyaWJlKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAcGFuZS5vbkRpZEFkZEl0ZW0gKHtpdGVtLCBpbmRleH0pID0+XG4gICAgICBAYWRkVGFiRm9ySXRlbShpdGVtLCBpbmRleClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAcGFuZS5vbkRpZE1vdmVJdGVtICh7aXRlbSwgbmV3SW5kZXh9KSA9PlxuICAgICAgQG1vdmVJdGVtVGFiVG9JbmRleChpdGVtLCBuZXdJbmRleClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAcGFuZS5vbkRpZFJlbW92ZUl0ZW0gKHtpdGVtfSkgPT5cbiAgICAgIEByZW1vdmVUYWJGb3JJdGVtKGl0ZW0pXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHBhbmUub25EaWRDaGFuZ2VBY3RpdmVJdGVtIChpdGVtKSA9PlxuICAgICAgQHVwZGF0ZUFjdGl2ZVRhYigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAndGFicy50YWJTY3JvbGxpbmcnLCBAdXBkYXRlVGFiU2Nyb2xsaW5nLmJpbmQodGhpcylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAndGFicy50YWJTY3JvbGxpbmdUaHJlc2hvbGQnLCA9PiBAdXBkYXRlVGFiU2Nyb2xsaW5nVGhyZXNob2xkKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAndGFicy5hbHdheXNTaG93VGFiQmFyJywgPT4gQHVwZGF0ZVRhYkJhclZpc2liaWxpdHkoKVxuXG4gICAgQHVwZGF0ZUFjdGl2ZVRhYigpXG5cbiAgICBAYWRkRXZlbnRMaXN0ZW5lciBcIm1vdXNlZG93blwiLCBAb25Nb3VzZURvd25cbiAgICBAYWRkRXZlbnRMaXN0ZW5lciBcImRibGNsaWNrXCIsIEBvbkRvdWJsZUNsaWNrXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgXCJjbGlja1wiLCBAb25DbGlja1xuXG4gICAgQG9uRHJvcE9uT3RoZXJXaW5kb3cgPSBAb25Ecm9wT25PdGhlcldpbmRvdy5iaW5kKHRoaXMpXG4gICAgaXBjUmVuZGVyZXIub24oJ3RhYjpkcm9wcGVkJywgIEBvbkRyb3BPbk90aGVyV2luZG93KVxuXG4gIHVuc3Vic2NyaWJlOiAtPlxuICAgIGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKCd0YWI6ZHJvcHBlZCcsIEBvbkRyb3BPbk90aGVyV2luZG93KVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIHRlcm1pbmF0ZVBlbmRpbmdTdGF0ZXM6IC0+XG4gICAgdGFiLnRlcm1pbmF0ZVBlbmRpbmdTdGF0ZT8oKSBmb3IgdGFiIGluIEBnZXRUYWJzKClcbiAgICByZXR1cm5cblxuICBhZGRUYWJGb3JJdGVtOiAoaXRlbSwgaW5kZXgpIC0+XG4gICAgdGFiVmlldyA9IG5ldyBUYWJWaWV3KClcbiAgICB0YWJWaWV3LmluaXRpYWxpemUoaXRlbSwgQHBhbmUpXG4gICAgdGFiVmlldy50ZXJtaW5hdGVQZW5kaW5nU3RhdGUoKSBpZiBAaXNJdGVtTW92aW5nQmV0d2VlblBhbmVzXG4gICAgQGluc2VydFRhYkF0SW5kZXgodGFiVmlldywgaW5kZXgpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCd0YWJzLmFkZE5ld1RhYnNBdEVuZCcpXG4gICAgICBAcGFuZS5tb3ZlSXRlbShpdGVtLCBAcGFuZS5nZXRJdGVtcygpLmxlbmd0aCAtIDEpIHVubGVzcyBAaXNJdGVtTW92aW5nQmV0d2VlblBhbmVzXG5cbiAgbW92ZUl0ZW1UYWJUb0luZGV4OiAoaXRlbSwgaW5kZXgpIC0+XG4gICAgaWYgdGFiID0gQHRhYkZvckl0ZW0oaXRlbSlcbiAgICAgIHRhYi5yZW1vdmUoKVxuICAgICAgQGluc2VydFRhYkF0SW5kZXgodGFiLCBpbmRleClcblxuICBpbnNlcnRUYWJBdEluZGV4OiAodGFiLCBpbmRleCkgLT5cbiAgICBmb2xsb3dpbmdUYWIgPSBAdGFiQXRJbmRleChpbmRleCkgaWYgaW5kZXg/XG4gICAgaWYgZm9sbG93aW5nVGFiXG4gICAgICBAaW5zZXJ0QmVmb3JlKHRhYiwgZm9sbG93aW5nVGFiKVxuICAgIGVsc2VcbiAgICAgIEBhcHBlbmRDaGlsZCh0YWIpXG5cbiAgICB0YWIudXBkYXRlVGl0bGUoKVxuICAgIEB1cGRhdGVUYWJCYXJWaXNpYmlsaXR5KClcblxuICByZW1vdmVUYWJGb3JJdGVtOiAoaXRlbSkgLT5cbiAgICBAdGFiRm9ySXRlbShpdGVtKT8uZGVzdHJveSgpXG4gICAgdGFiLnVwZGF0ZVRpdGxlKCkgZm9yIHRhYiBpbiBAZ2V0VGFicygpXG4gICAgQHVwZGF0ZVRhYkJhclZpc2liaWxpdHkoKVxuXG4gIHNjcm9sbFRvVGFiOiAodGFiKSAtPlxuICAgIHRhYlJpZ2h0RWRnZSA9IHRhYi5vZmZzZXRMZWZ0ICsgdGFiLmNsaWVudFdpZHRoXG4gICAgdGFiQmFyUmlnaHRFZGdlID0gdGhpcy5zY3JvbGxMZWZ0ICsgdGhpcy5jbGllbnRXaWR0aFxuXG4gICAgaWYgdGFiUmlnaHRFZGdlID4gdGFiQmFyUmlnaHRFZGdlXG4gICAgICB0aGlzLnNjcm9sbExlZnQgPSB0YWJSaWdodEVkZ2UgLSB0aGlzLmNsaWVudFdpZHRoXG4gICAgZWxzZSBpZiB0aGlzLnNjcm9sbExlZnQgPiB0YWIub2Zmc2V0TGVmdFxuICAgICAgdGhpcy5zY3JvbGxMZWZ0ID0gdGFiLm9mZnNldExlZnRcblxuICB1cGRhdGVUYWJCYXJWaXNpYmlsaXR5OiAtPlxuICAgIGlmIG5vdCBhdG9tLmNvbmZpZy5nZXQoJ3RhYnMuYWx3YXlzU2hvd1RhYkJhcicpIGFuZCBub3QgQHNob3VsZEFsbG93RHJhZygpXG4gICAgICBAY2xhc3NMaXN0LmFkZCgnaGlkZGVuJylcbiAgICBlbHNlXG4gICAgICBAY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJylcblxuICBnZXRUYWJzOiAtPlxuICAgIHRhYiBmb3IgdGFiIGluIEBxdWVyeVNlbGVjdG9yQWxsKFwiLnRhYlwiKVxuXG4gIHRhYkF0SW5kZXg6IChpbmRleCkgLT5cbiAgICBAcXVlcnlTZWxlY3RvckFsbChcIi50YWJcIilbaW5kZXhdXG5cbiAgdGFiRm9ySXRlbTogKGl0ZW0pIC0+XG4gICAgXy5kZXRlY3QgQGdldFRhYnMoKSwgKHRhYikgLT4gdGFiLml0ZW0gaXMgaXRlbVxuXG4gIHNldEFjdGl2ZVRhYjogKHRhYlZpZXcpIC0+XG4gICAgaWYgdGFiVmlldz8gYW5kIG5vdCB0YWJWaWV3LmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJylcbiAgICAgIEBxdWVyeVNlbGVjdG9yKCcudGFiLmFjdGl2ZScpPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuICAgICAgdGFiVmlldy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICAgICAgQHNjcm9sbFRvVGFiKHRhYlZpZXcpXG5cbiAgZ2V0QWN0aXZlVGFiOiAtPlxuICAgIEB0YWJGb3JJdGVtKEBwYW5lLmdldEFjdGl2ZUl0ZW0oKSlcblxuICB1cGRhdGVBY3RpdmVUYWI6IC0+XG4gICAgQHNldEFjdGl2ZVRhYihAdGFiRm9ySXRlbShAcGFuZS5nZXRBY3RpdmVJdGVtKCkpKVxuXG4gIGNsb3NlVGFiOiAodGFiKSAtPlxuICAgIHRhYiA/PSBAcXVlcnlTZWxlY3RvcignLnJpZ2h0LWNsaWNrZWQnKVxuICAgIEBwYW5lLmRlc3Ryb3lJdGVtKHRhYi5pdGVtKSBpZiB0YWI/XG5cbiAgb3BlbkluTmV3V2luZG93OiAodGFiKSAtPlxuICAgIHRhYiA/PSBAcXVlcnlTZWxlY3RvcignLnJpZ2h0LWNsaWNrZWQnKVxuICAgIGl0ZW0gPSB0YWI/Lml0ZW1cbiAgICByZXR1cm4gdW5sZXNzIGl0ZW0/XG4gICAgaWYgdHlwZW9mIGl0ZW0uZ2V0VVJJIGlzICdmdW5jdGlvbidcbiAgICAgIGl0ZW1VUkkgPSBpdGVtLmdldFVSSSgpXG4gICAgZWxzZSBpZiB0eXBlb2YgaXRlbS5nZXRQYXRoIGlzICdmdW5jdGlvbidcbiAgICAgIGl0ZW1VUkkgPSBpdGVtLmdldFBhdGgoKVxuICAgIGVsc2UgaWYgdHlwZW9mIGl0ZW0uZ2V0VXJpIGlzICdmdW5jdGlvbidcbiAgICAgIGl0ZW1VUkkgPSBpdGVtLmdldFVyaSgpXG4gICAgcmV0dXJuIHVubGVzcyBpdGVtVVJJP1xuICAgIEBjbG9zZVRhYih0YWIpXG4gICAgcGF0aHNUb09wZW4gPSBbYXRvbS5wcm9qZWN0LmdldFBhdGhzKCksIGl0ZW1VUkldLnJlZHVjZSAoKGEsIGIpIC0+IGEuY29uY2F0KGIpKSwgW11cbiAgICBhdG9tLm9wZW4oe3BhdGhzVG9PcGVuOiBwYXRoc1RvT3BlbiwgbmV3V2luZG93OiB0cnVlLCBkZXZNb2RlOiBhdG9tLmRldk1vZGUsIHNhZmVNb2RlOiBhdG9tLnNhZmVNb2RlfSlcblxuICBzcGxpdFRhYjogKGZuKSAtPlxuICAgIGlmIGl0ZW0gPSBAcXVlcnlTZWxlY3RvcignLnJpZ2h0LWNsaWNrZWQnKT8uaXRlbVxuICAgICAgaWYgY29waWVkSXRlbSA9IEBjb3B5SXRlbShpdGVtKVxuICAgICAgICBAcGFuZVtmbl0oaXRlbXM6IFtjb3BpZWRJdGVtXSlcblxuICBjb3B5SXRlbTogKGl0ZW0pIC0+XG4gICAgaXRlbS5jb3B5PygpID8gYXRvbS5kZXNlcmlhbGl6ZXJzLmRlc2VyaWFsaXplKGl0ZW0uc2VyaWFsaXplKCkpXG5cbiAgY2xvc2VPdGhlclRhYnM6IChhY3RpdmUpIC0+XG4gICAgdGFicyA9IEBnZXRUYWJzKClcbiAgICBhY3RpdmUgPz0gQHF1ZXJ5U2VsZWN0b3IoJy5yaWdodC1jbGlja2VkJylcbiAgICByZXR1cm4gdW5sZXNzIGFjdGl2ZT9cbiAgICBAY2xvc2VUYWIgdGFiIGZvciB0YWIgaW4gdGFicyB3aGVuIHRhYiBpc250IGFjdGl2ZVxuXG4gIGNsb3NlVGFic1RvUmlnaHQ6IChhY3RpdmUpIC0+XG4gICAgdGFicyA9IEBnZXRUYWJzKClcbiAgICBhY3RpdmUgPz0gQHF1ZXJ5U2VsZWN0b3IoJy5yaWdodC1jbGlja2VkJylcbiAgICBpbmRleCA9IHRhYnMuaW5kZXhPZihhY3RpdmUpXG4gICAgcmV0dXJuIGlmIGluZGV4IGlzIC0xXG4gICAgQGNsb3NlVGFiIHRhYiBmb3IgdGFiLCBpIGluIHRhYnMgd2hlbiBpID4gaW5kZXhcblxuICBjbG9zZVRhYnNUb0xlZnQ6IChhY3RpdmUpIC0+XG4gICAgdGFicyA9IEBnZXRUYWJzKClcbiAgICBhY3RpdmUgPz0gQHF1ZXJ5U2VsZWN0b3IoJy5yaWdodC1jbGlja2VkJylcbiAgICBpbmRleCA9IHRhYnMuaW5kZXhPZihhY3RpdmUpXG4gICAgcmV0dXJuIGlmIGluZGV4IGlzIC0xXG4gICAgQGNsb3NlVGFiIHRhYiBmb3IgdGFiLCBpIGluIHRhYnMgd2hlbiBpIDwgaW5kZXhcblxuICBjbG9zZVNhdmVkVGFiczogLT5cbiAgICBmb3IgdGFiIGluIEBnZXRUYWJzKClcbiAgICAgIEBjbG9zZVRhYih0YWIpIHVubGVzcyB0YWIuaXRlbS5pc01vZGlmaWVkPygpXG5cbiAgY2xvc2VBbGxUYWJzOiAtPlxuICAgIEBjbG9zZVRhYih0YWIpIGZvciB0YWIgaW4gQGdldFRhYnMoKVxuXG4gIGdldFdpbmRvd0lkOiAtPlxuICAgIEB3aW5kb3dJZCA/PSBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5pZFxuXG4gIHNob3VsZEFsbG93RHJhZzogLT5cbiAgICAoQHBhbmVDb250YWluZXIuZ2V0UGFuZXMoKS5sZW5ndGggPiAxKSBvciAoQHBhbmUuZ2V0SXRlbXMoKS5sZW5ndGggPiAxKVxuXG4gIG9uRHJhZ1N0YXJ0OiAoZXZlbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBtYXRjaGVzKGV2ZW50LnRhcmdldCwgJy5zb3J0YWJsZScpXG5cbiAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAnYXRvbS1ldmVudCcsICd0cnVlJ1xuXG4gICAgZWxlbWVudCA9IGNsb3Nlc3QoZXZlbnQudGFyZ2V0LCAnLnNvcnRhYmxlJylcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2lzLWRyYWdnaW5nJylcbiAgICBlbGVtZW50LmRlc3Ryb3lUb29sdGlwKClcblxuICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdzb3J0YWJsZS1pbmRleCcsIGluZGV4T2YoZWxlbWVudClcblxuICAgIHBhbmVJbmRleCA9IEBwYW5lQ29udGFpbmVyLmdldFBhbmVzKCkuaW5kZXhPZihAcGFuZSlcbiAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAnZnJvbS1wYW5lLWluZGV4JywgcGFuZUluZGV4XG4gICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEgJ2Zyb20tcGFuZS1pZCcsIEBwYW5lLmlkXG4gICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEgJ2Zyb20td2luZG93LWlkJywgQGdldFdpbmRvd0lkKClcblxuICAgIGl0ZW0gPSBAcGFuZS5nZXRJdGVtcygpW2luZGV4T2YoZWxlbWVudCldXG4gICAgcmV0dXJuIHVubGVzcyBpdGVtP1xuXG4gICAgaWYgdHlwZW9mIGl0ZW0uZ2V0VVJJIGlzICdmdW5jdGlvbidcbiAgICAgIGl0ZW1VUkkgPSBpdGVtLmdldFVSSSgpID8gJydcbiAgICBlbHNlIGlmIHR5cGVvZiBpdGVtLmdldFBhdGggaXMgJ2Z1bmN0aW9uJ1xuICAgICAgaXRlbVVSSSA9IGl0ZW0uZ2V0UGF0aCgpID8gJydcbiAgICBlbHNlIGlmIHR5cGVvZiBpdGVtLmdldFVyaSBpcyAnZnVuY3Rpb24nXG4gICAgICBpdGVtVVJJID0gaXRlbS5nZXRVcmkoKSA/ICcnXG5cbiAgICBpZiBpdGVtVVJJP1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEgJ3RleHQvcGxhaW4nLCBpdGVtVVJJXG5cbiAgICAgIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbicgIyBzZWUgIzY5XG4gICAgICAgIGl0ZW1VUkkgPSBcImZpbGU6Ly8je2l0ZW1VUkl9XCIgdW5sZXNzIEB1cmlIYXNQcm90b2NvbChpdGVtVVJJKVxuICAgICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAndGV4dC91cmktbGlzdCcsIGl0ZW1VUklcblxuICAgICAgaWYgaXRlbS5pc01vZGlmaWVkPygpIGFuZCBpdGVtLmdldFRleHQ/XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdoYXMtdW5zYXZlZC1jaGFuZ2VzJywgJ3RydWUnXG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdtb2RpZmllZC10ZXh0JywgaXRlbS5nZXRUZXh0KClcblxuICB1cmlIYXNQcm90b2NvbDogKHVyaSkgLT5cbiAgICB0cnlcbiAgICAgIHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVyaSkucHJvdG9jb2w/XG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGZhbHNlXG5cbiAgb25EcmFnTGVhdmU6IChldmVudCkgLT5cbiAgICBAcmVtb3ZlUGxhY2Vob2xkZXIoKVxuXG4gIG9uRHJhZ0VuZDogKGV2ZW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgbWF0Y2hlcyhldmVudC50YXJnZXQsICcuc29ydGFibGUnKVxuXG4gICAgQGNsZWFyRHJvcFRhcmdldCgpXG5cbiAgb25EcmFnT3ZlcjogKGV2ZW50KSAtPlxuICAgIHVubGVzcyBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgnYXRvbS1ldmVudCcpIGlzICd0cnVlJ1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIHJldHVyblxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIG5ld0Ryb3BUYXJnZXRJbmRleCA9IEBnZXREcm9wVGFyZ2V0SW5kZXgoZXZlbnQpXG4gICAgcmV0dXJuIHVubGVzcyBuZXdEcm9wVGFyZ2V0SW5kZXg/XG5cbiAgICBAcmVtb3ZlRHJvcFRhcmdldENsYXNzZXMoKVxuXG4gICAgdGFiQmFyID0gQGdldFRhYkJhcihldmVudC50YXJnZXQpXG4gICAgc29ydGFibGVPYmplY3RzID0gdGFiQmFyLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuc29ydGFibGVcIilcbiAgICBwbGFjZWhvbGRlciA9IEBnZXRQbGFjZWhvbGRlcigpXG4gICAgcmV0dXJuIHVubGVzcyBwbGFjZWhvbGRlcj9cblxuICAgIGlmIG5ld0Ryb3BUYXJnZXRJbmRleCA8IHNvcnRhYmxlT2JqZWN0cy5sZW5ndGhcbiAgICAgIGVsZW1lbnQgPSBzb3J0YWJsZU9iamVjdHNbbmV3RHJvcFRhcmdldEluZGV4XVxuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICdpcy1kcm9wLXRhcmdldCdcbiAgICAgIGVsZW1lbnQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGVsZW1lbnQpXG4gICAgZWxzZVxuICAgICAgaWYgZWxlbWVudCA9IHNvcnRhYmxlT2JqZWN0c1tuZXdEcm9wVGFyZ2V0SW5kZXggLSAxXVxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgJ2Ryb3AtdGFyZ2V0LWlzLWFmdGVyJ1xuICAgICAgICBpZiBzaWJsaW5nID0gZWxlbWVudC5uZXh0U2libGluZ1xuICAgICAgICAgIGVsZW1lbnQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIHNpYmxpbmcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlbGVtZW50LnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpXG5cbiAgb25Ecm9wT25PdGhlcldpbmRvdzogKGZyb21QYW5lSWQsIGZyb21JdGVtSW5kZXgpIC0+XG4gICAgaWYgQHBhbmUuaWQgaXMgZnJvbVBhbmVJZFxuICAgICAgaWYgaXRlbVRvUmVtb3ZlID0gQHBhbmUuZ2V0SXRlbXMoKVtmcm9tSXRlbUluZGV4XVxuICAgICAgICBAcGFuZS5kZXN0cm95SXRlbShpdGVtVG9SZW1vdmUpXG5cbiAgICBAY2xlYXJEcm9wVGFyZ2V0KClcblxuICBjbGVhckRyb3BUYXJnZXQ6IC0+XG4gICAgZWxlbWVudCA9IEBxdWVyeVNlbGVjdG9yKFwiLmlzLWRyYWdnaW5nXCIpXG4gICAgZWxlbWVudD8uY2xhc3NMaXN0LnJlbW92ZSgnaXMtZHJhZ2dpbmcnKVxuICAgIGVsZW1lbnQ/LnVwZGF0ZVRvb2x0aXAoKVxuICAgIEByZW1vdmVEcm9wVGFyZ2V0Q2xhc3NlcygpXG4gICAgQHJlbW92ZVBsYWNlaG9sZGVyKClcblxuICBvbkRyb3A6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICByZXR1cm4gdW5sZXNzIGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCdhdG9tLWV2ZW50JykgaXMgJ3RydWUnXG5cbiAgICBmcm9tV2luZG93SWQgID0gcGFyc2VJbnQoZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEoJ2Zyb20td2luZG93LWlkJykpXG4gICAgZnJvbVBhbmVJZCAgICA9IHBhcnNlSW50KGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCdmcm9tLXBhbmUtaWQnKSlcbiAgICBmcm9tSW5kZXggICAgID0gcGFyc2VJbnQoZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEoJ3NvcnRhYmxlLWluZGV4JykpXG4gICAgZnJvbVBhbmVJbmRleCA9IHBhcnNlSW50KGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCdmcm9tLXBhbmUtaW5kZXgnKSlcblxuICAgIGhhc1Vuc2F2ZWRDaGFuZ2VzID0gZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEoJ2hhcy11bnNhdmVkLWNoYW5nZXMnKSBpcyAndHJ1ZSdcbiAgICBtb2RpZmllZFRleHQgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgnbW9kaWZpZWQtdGV4dCcpXG5cbiAgICB0b0luZGV4ID0gQGdldERyb3BUYXJnZXRJbmRleChldmVudClcbiAgICB0b1BhbmUgPSBAcGFuZVxuXG4gICAgQGNsZWFyRHJvcFRhcmdldCgpXG5cbiAgICBpZiBmcm9tV2luZG93SWQgaXMgQGdldFdpbmRvd0lkKClcbiAgICAgIGZyb21QYW5lID0gQHBhbmVDb250YWluZXIuZ2V0UGFuZXMoKVtmcm9tUGFuZUluZGV4XVxuICAgICAgaWYgZnJvbVBhbmU/LmlkIGlzbnQgZnJvbVBhbmVJZFxuICAgICAgICAjIElmIGRyYWdnaW5nIGZyb20gYSBkaWZmZXJlbnQgcGFuZSBjb250YWluZXIsIHdlIGhhdmUgdG8gYmUgbW9yZVxuICAgICAgICAjIGV4aGF1c3RpdmUgaW4gb3VyIHNlYXJjaC5cbiAgICAgICAgZnJvbVBhbmUgPSBBcnJheS5mcm9tIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2F0b20tcGFuZScpXG4gICAgICAgICAgLm1hcCAocGFuZUVsKSAtPiBwYW5lRWwubW9kZWxcbiAgICAgICAgICAuZmluZCAocGFuZSkgLT4gcGFuZS5pZCBpcyBmcm9tUGFuZUlkXG4gICAgICBpdGVtID0gZnJvbVBhbmUuZ2V0SXRlbXMoKVtmcm9tSW5kZXhdXG4gICAgICBAbW92ZUl0ZW1CZXR3ZWVuUGFuZXMoZnJvbVBhbmUsIGZyb21JbmRleCwgdG9QYW5lLCB0b0luZGV4LCBpdGVtKSBpZiBpdGVtP1xuICAgIGVsc2VcbiAgICAgIGRyb3BwZWRVUkkgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dC9wbGFpbicpXG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGRyb3BwZWRVUkkpLnRoZW4gKGl0ZW0pID0+XG4gICAgICAgICMgTW92ZSB0aGUgaXRlbSBmcm9tIHRoZSBwYW5lIGl0IHdhcyBvcGVuZWQgb24gdG8gdGhlIHRhcmdldCBwYW5lXG4gICAgICAgICMgd2hlcmUgaXQgd2FzIGRyb3BwZWQgb250b1xuICAgICAgICBhY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgICAgIGFjdGl2ZUl0ZW1JbmRleCA9IGFjdGl2ZVBhbmUuZ2V0SXRlbXMoKS5pbmRleE9mKGl0ZW0pXG4gICAgICAgIEBtb3ZlSXRlbUJldHdlZW5QYW5lcyhhY3RpdmVQYW5lLCBhY3RpdmVJdGVtSW5kZXgsIHRvUGFuZSwgdG9JbmRleCwgaXRlbSlcbiAgICAgICAgaXRlbS5zZXRUZXh0Pyhtb2RpZmllZFRleHQpIGlmIGhhc1Vuc2F2ZWRDaGFuZ2VzXG5cbiAgICAgICAgaWYgbm90IGlzTmFOKGZyb21XaW5kb3dJZClcbiAgICAgICAgICAjIExldCB0aGUgd2luZG93IHdoZXJlIHRoZSBkcmFnIHN0YXJ0ZWQga25vdyB0aGF0IHRoZSB0YWIgd2FzIGRyb3BwZWRcbiAgICAgICAgICBicm93c2VyV2luZG93ID0gQGJyb3dzZXJXaW5kb3dGb3JJZChmcm9tV2luZG93SWQpXG4gICAgICAgICAgYnJvd3NlcldpbmRvdz8ud2ViQ29udGVudHMuc2VuZCgndGFiOmRyb3BwZWQnLCBmcm9tUGFuZUlkLCBmcm9tSW5kZXgpXG5cbiAgICAgIGF0b20uZm9jdXMoKVxuXG4gIG9uTW91c2VXaGVlbDogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBldmVudC5zaGlmdEtleVxuXG4gICAgQHdoZWVsRGVsdGEgPz0gMFxuICAgIEB3aGVlbERlbHRhICs9IGV2ZW50LndoZWVsRGVsdGFZXG5cbiAgICBpZiBAd2hlZWxEZWx0YSA8PSAtQHRhYlNjcm9sbGluZ1RocmVzaG9sZFxuICAgICAgQHdoZWVsRGVsdGEgPSAwXG4gICAgICBAcGFuZS5hY3RpdmF0ZU5leHRJdGVtKClcbiAgICBlbHNlIGlmIEB3aGVlbERlbHRhID49IEB0YWJTY3JvbGxpbmdUaHJlc2hvbGRcbiAgICAgIEB3aGVlbERlbHRhID0gMFxuICAgICAgQHBhbmUuYWN0aXZhdGVQcmV2aW91c0l0ZW0oKVxuXG4gIG9uTW91c2VEb3duOiAoZXZlbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBtYXRjaGVzKGV2ZW50LnRhcmdldCwgXCIudGFiXCIpXG5cbiAgICB0YWIgPSBjbG9zZXN0KGV2ZW50LnRhcmdldCwgJy50YWInKVxuICAgIGlmIGV2ZW50LndoaWNoIGlzIDMgb3IgKGV2ZW50LndoaWNoIGlzIDEgYW5kIGV2ZW50LmN0cmxLZXkgaXMgdHJ1ZSlcbiAgICAgIEBxdWVyeVNlbGVjdG9yKCcucmlnaHQtY2xpY2tlZCcpPy5jbGFzc0xpc3QucmVtb3ZlKCdyaWdodC1jbGlja2VkJylcbiAgICAgIHRhYi5jbGFzc0xpc3QuYWRkKCdyaWdodC1jbGlja2VkJylcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBlbHNlIGlmIGV2ZW50LndoaWNoIGlzIDEgYW5kIG5vdCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdjbG9zZS1pY29uJylcbiAgICAgIEBwYW5lLmFjdGl2YXRlSXRlbSh0YWIuaXRlbSlcbiAgICAgIHNldEltbWVkaWF0ZSA9PiBAcGFuZS5hY3RpdmF0ZSgpIHVubGVzcyBAcGFuZS5pc0Rlc3Ryb3llZCgpXG4gICAgZWxzZSBpZiBldmVudC53aGljaCBpcyAyXG4gICAgICBAcGFuZS5kZXN0cm95SXRlbSh0YWIuaXRlbSlcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICBvbkRvdWJsZUNsaWNrOiAoZXZlbnQpIC0+XG4gICAgaWYgdGFiID0gY2xvc2VzdChldmVudC50YXJnZXQsICcudGFiJylcbiAgICAgIHRhYi5pdGVtLnRlcm1pbmF0ZVBlbmRpbmdTdGF0ZT8oKVxuXG4gICAgZWxzZSBpZiBldmVudC50YXJnZXQgaXMgdGhpc1xuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCh0aGlzLCAnYXBwbGljYXRpb246bmV3LWZpbGUnKVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gIG9uQ2xpY2s6IChldmVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIG1hdGNoZXMoZXZlbnQudGFyZ2V0LCBcIi50YWIgLmNsb3NlLWljb25cIilcblxuICAgIHRhYiA9IGNsb3Nlc3QoZXZlbnQudGFyZ2V0LCAnLnRhYicpXG4gICAgQHBhbmUuZGVzdHJveUl0ZW0odGFiLml0ZW0pXG4gICAgZmFsc2VcblxuICB1cGRhdGVUYWJTY3JvbGxpbmdUaHJlc2hvbGQ6IC0+XG4gICAgQHRhYlNjcm9sbGluZ1RocmVzaG9sZCA9IGF0b20uY29uZmlnLmdldCgndGFicy50YWJTY3JvbGxpbmdUaHJlc2hvbGQnKVxuXG4gIHVwZGF0ZVRhYlNjcm9sbGluZzogKHZhbHVlKSAtPlxuICAgIGlmIHZhbHVlIGlzICdwbGF0Zm9ybSdcbiAgICAgIEB0YWJTY3JvbGxpbmcgPSAocHJvY2Vzcy5wbGF0Zm9ybSBpcyAnbGludXgnKVxuICAgIGVsc2VcbiAgICAgIEB0YWJTY3JvbGxpbmcgPSB2YWx1ZVxuICAgIEB0YWJTY3JvbGxpbmdUaHJlc2hvbGQgPSBhdG9tLmNvbmZpZy5nZXQoJ3RhYnMudGFiU2Nyb2xsaW5nVGhyZXNob2xkJylcblxuICAgIGlmIEB0YWJTY3JvbGxpbmdcbiAgICAgIEBhZGRFdmVudExpc3RlbmVyICdtb3VzZXdoZWVsJywgQG9uTW91c2VXaGVlbFxuICAgIGVsc2VcbiAgICAgIEByZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZXdoZWVsJywgQG9uTW91c2VXaGVlbFxuXG4gIGJyb3dzZXJXaW5kb3dGb3JJZDogKGlkKSAtPlxuICAgIEJyb3dzZXJXaW5kb3cgPz0gcmVxdWlyZSgnZWxlY3Ryb24nKS5yZW1vdGUuQnJvd3NlcldpbmRvd1xuXG4gICAgQnJvd3NlcldpbmRvdy5mcm9tSWQgaWRcblxuICBtb3ZlSXRlbUJldHdlZW5QYW5lczogKGZyb21QYW5lLCBmcm9tSW5kZXgsIHRvUGFuZSwgdG9JbmRleCwgaXRlbSkgLT5cbiAgICB0cnlcbiAgICAgIGlmIHRvUGFuZSBpcyBmcm9tUGFuZVxuICAgICAgICB0b0luZGV4LS0gaWYgZnJvbUluZGV4IDwgdG9JbmRleFxuICAgICAgICB0b1BhbmUubW92ZUl0ZW0oaXRlbSwgdG9JbmRleClcbiAgICAgIGVsc2VcbiAgICAgICAgQGlzSXRlbU1vdmluZ0JldHdlZW5QYW5lcyA9IHRydWVcbiAgICAgICAgZnJvbVBhbmUubW92ZUl0ZW1Ub1BhbmUoaXRlbSwgdG9QYW5lLCB0b0luZGV4LS0pXG4gICAgICB0b1BhbmUuYWN0aXZhdGVJdGVtKGl0ZW0pXG4gICAgICB0b1BhbmUuYWN0aXZhdGUoKVxuICAgIGZpbmFsbHlcbiAgICAgIEBpc0l0ZW1Nb3ZpbmdCZXR3ZWVuUGFuZXMgPSBmYWxzZVxuXG4gIHJlbW92ZURyb3BUYXJnZXRDbGFzc2VzOiAtPlxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgZm9yIGRyb3BUYXJnZXQgaW4gd29ya3NwYWNlRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGFiLWJhciAuaXMtZHJvcC10YXJnZXQnKVxuICAgICAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1kcm9wLXRhcmdldCcpXG5cbiAgICBmb3IgZHJvcFRhcmdldCBpbiB3b3Jrc3BhY2VFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWItYmFyIC5kcm9wLXRhcmdldC1pcy1hZnRlcicpXG4gICAgICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2Ryb3AtdGFyZ2V0LWlzLWFmdGVyJylcblxuICBnZXREcm9wVGFyZ2V0SW5kZXg6IChldmVudCkgLT5cbiAgICB0YXJnZXQgPSBldmVudC50YXJnZXRcbiAgICB0YWJCYXIgPSBAZ2V0VGFiQmFyKHRhcmdldClcblxuICAgIHJldHVybiBpZiBAaXNQbGFjZWhvbGRlcih0YXJnZXQpXG5cbiAgICBzb3J0YWJsZXMgPSB0YWJCYXIucXVlcnlTZWxlY3RvckFsbChcIi5zb3J0YWJsZVwiKVxuICAgIGVsZW1lbnQgPSBjbG9zZXN0KHRhcmdldCwgJy5zb3J0YWJsZScpXG4gICAgZWxlbWVudCA/PSBzb3J0YWJsZXNbc29ydGFibGVzLmxlbmd0aCAtIDFdXG5cbiAgICByZXR1cm4gMCB1bmxlc3MgZWxlbWVudD9cblxuICAgIHtsZWZ0LCB3aWR0aH0gPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgZWxlbWVudENlbnRlciA9IGxlZnQgKyB3aWR0aCAvIDJcbiAgICBlbGVtZW50SW5kZXggPSBpbmRleE9mKGVsZW1lbnQsIHNvcnRhYmxlcylcblxuICAgIGlmIGV2ZW50LnBhZ2VYIDwgZWxlbWVudENlbnRlclxuICAgICAgZWxlbWVudEluZGV4XG4gICAgZWxzZVxuICAgICAgZWxlbWVudEluZGV4ICsgMVxuXG4gIGdldFBsYWNlaG9sZGVyOiAtPlxuICAgIHJldHVybiBAcGxhY2Vob2xkZXJFbCBpZiBAcGxhY2Vob2xkZXJFbD9cblxuICAgIEBwbGFjZWhvbGRlckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgQHBsYWNlaG9sZGVyRWwuY2xhc3NMaXN0LmFkZChcInBsYWNlaG9sZGVyXCIpXG4gICAgQHBsYWNlaG9sZGVyRWxcblxuICByZW1vdmVQbGFjZWhvbGRlcjogLT5cbiAgICBAcGxhY2Vob2xkZXJFbD8ucmVtb3ZlKClcbiAgICBAcGxhY2Vob2xkZXJFbCA9IG51bGxcblxuICBpc1BsYWNlaG9sZGVyOiAoZWxlbWVudCkgLT5cbiAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygncGxhY2Vob2xkZXInKVxuXG4gIGdldFRhYkJhcjogKHRhcmdldCkgLT5cbiAgICBpZiB0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0YWItYmFyJylcbiAgICAgIHRhcmdldFxuICAgIGVsc2VcbiAgICAgIGNsb3Nlc3QodGFyZ2V0LCAnLnRhYi1iYXInKVxuXG4gIG9uTW91c2VFbnRlcjogLT5cbiAgICBmb3IgdGFiIGluIEBnZXRUYWJzKClcbiAgICAgIHt3aWR0aH0gPSB0YWIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIHRhYi5zdHlsZS5tYXhXaWR0aCA9IHdpZHRoLnRvRml4ZWQoMikgKyAncHgnXG4gICAgcmV0dXJuXG5cbiAgb25Nb3VzZUxlYXZlOiAtPlxuICAgIHRhYi5zdHlsZS5tYXhXaWR0aCA9ICcnIGZvciB0YWIgaW4gQGdldFRhYnMoKVxuICAgIHJldHVyblxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcImF0b20tdGFic1wiLCBwcm90b3R5cGU6IFRhYkJhclZpZXcucHJvdG90eXBlLCBleHRlbmRzOiBcInVsXCIpXG4iXX0=
