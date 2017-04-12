(function() {
  var CompositeDisposable, Emitter, Grim, Model, Pane, PaneAxis, TextEditor, compact, extend, find, last, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Grim = require('grim');

  ref = require('underscore-plus'), find = ref.find, compact = ref.compact, extend = ref.extend, last = ref.last;

  ref1 = require('event-kit'), CompositeDisposable = ref1.CompositeDisposable, Emitter = ref1.Emitter;

  Model = require('./model');

  PaneAxis = require('./pane-axis');

  TextEditor = require('./text-editor');

  module.exports = Pane = (function(superClass) {
    extend1(Pane, superClass);

    Pane.prototype.container = void 0;

    Pane.prototype.activeItem = void 0;

    Pane.prototype.focused = false;

    Pane.deserialize = function(state, arg) {
      var activeItemIndex, activeItemURI, activeItemUri, applicationDelegate, config, deserializers, items, notifications;
      deserializers = arg.deserializers, applicationDelegate = arg.applicationDelegate, config = arg.config, notifications = arg.notifications;
      items = state.items, activeItemIndex = state.activeItemIndex, activeItemURI = state.activeItemURI, activeItemUri = state.activeItemUri;
      if (activeItemURI == null) {
        activeItemURI = activeItemUri;
      }
      items = items.map(function(itemState) {
        return deserializers.deserialize(itemState);
      });
      state.activeItem = items[activeItemIndex];
      state.items = compact(items);
      if (activeItemURI != null) {
        if (state.activeItem == null) {
          state.activeItem = find(state.items, function(item) {
            var itemURI;
            if (typeof item.getURI === 'function') {
              itemURI = item.getURI();
            }
            return itemURI === activeItemURI;
          });
        }
      }
      return new Pane(extend(state, {
        deserializerManager: deserializers,
        notificationManager: notifications,
        config: config,
        applicationDelegate: applicationDelegate
      }));
    };

    function Pane(params) {
      this.saveItemAs = bind(this.saveItemAs, this);
      this.saveItem = bind(this.saveItem, this);
      this.onItemDidTerminatePendingState = bind(this.onItemDidTerminatePendingState, this);
      this.clearPendingItem = bind(this.clearPendingItem, this);
      this.getPendingItem = bind(this.getPendingItem, this);
      this.setPendingItem = bind(this.setPendingItem, this);
      var ref2, ref3, ref4;
      Pane.__super__.constructor.apply(this, arguments);
      this.activeItem = params.activeItem, this.focused = params.focused, this.applicationDelegate = params.applicationDelegate, this.notificationManager = params.notificationManager, this.config = params.config, this.deserializerManager = params.deserializerManager;
      this.emitter = new Emitter;
      this.subscriptionsPerItem = new WeakMap;
      this.items = [];
      this.itemStack = [];
      this.addItems(compact((ref2 = params != null ? params.items : void 0) != null ? ref2 : []));
      if (this.getActiveItem() == null) {
        this.setActiveItem(this.items[0]);
      }
      this.addItemsToStack((ref3 = params != null ? params.itemStackIndices : void 0) != null ? ref3 : []);
      this.setFlexScale((ref4 = params != null ? params.flexScale : void 0) != null ? ref4 : 1);
    }

    Pane.prototype.serialize = function() {
      var activeItemIndex, item, itemStackIndices, itemsToBeSerialized;
      itemsToBeSerialized = compact(this.items.map(function(item) {
        if (typeof item.serialize === 'function') {
          return item;
        }
      }));
      itemStackIndices = (function() {
        var j, len, ref2, results;
        ref2 = this.itemStack;
        results = [];
        for (j = 0, len = ref2.length; j < len; j++) {
          item = ref2[j];
          if (typeof item.serialize === 'function') {
            results.push(itemsToBeSerialized.indexOf(item));
          }
        }
        return results;
      }).call(this);
      activeItemIndex = itemsToBeSerialized.indexOf(this.activeItem);
      return {
        deserializer: 'Pane',
        id: this.id,
        items: itemsToBeSerialized.map(function(item) {
          return item.serialize();
        }),
        itemStackIndices: itemStackIndices,
        activeItemIndex: activeItemIndex,
        focused: this.focused,
        flexScale: this.flexScale
      };
    };

    Pane.prototype.getParent = function() {
      return this.parent;
    };

    Pane.prototype.setParent = function(parent) {
      this.parent = parent;
      return this.parent;
    };

    Pane.prototype.getContainer = function() {
      return this.container;
    };

    Pane.prototype.setContainer = function(container) {
      if (container && container !== this.container) {
        this.container = container;
        return container.didAddPane({
          pane: this
        });
      }
    };

    Pane.prototype.setFlexScale = function(flexScale) {
      this.flexScale = flexScale;
      this.emitter.emit('did-change-flex-scale', this.flexScale);
      return this.flexScale;
    };

    Pane.prototype.getFlexScale = function() {
      return this.flexScale;
    };

    Pane.prototype.increaseSize = function() {
      return this.setFlexScale(this.getFlexScale() * 1.1);
    };

    Pane.prototype.decreaseSize = function() {
      return this.setFlexScale(this.getFlexScale() / 1.1);
    };


    /*
    Section: Event Subscription
     */

    Pane.prototype.onDidChangeFlexScale = function(callback) {
      return this.emitter.on('did-change-flex-scale', callback);
    };

    Pane.prototype.observeFlexScale = function(callback) {
      callback(this.flexScale);
      return this.onDidChangeFlexScale(callback);
    };

    Pane.prototype.onDidActivate = function(callback) {
      return this.emitter.on('did-activate', callback);
    };

    Pane.prototype.onWillDestroy = function(callback) {
      return this.emitter.on('will-destroy', callback);
    };

    Pane.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    Pane.prototype.onDidChangeActive = function(callback) {
      return this.container.onDidChangeActivePane((function(_this) {
        return function(activePane) {
          return callback(_this === activePane);
        };
      })(this));
    };

    Pane.prototype.observeActive = function(callback) {
      callback(this.isActive());
      return this.onDidChangeActive(callback);
    };

    Pane.prototype.onDidAddItem = function(callback) {
      return this.emitter.on('did-add-item', callback);
    };

    Pane.prototype.onDidRemoveItem = function(callback) {
      return this.emitter.on('did-remove-item', callback);
    };

    Pane.prototype.onWillRemoveItem = function(callback) {
      return this.emitter.on('will-remove-item', callback);
    };

    Pane.prototype.onDidMoveItem = function(callback) {
      return this.emitter.on('did-move-item', callback);
    };

    Pane.prototype.observeItems = function(callback) {
      var item, j, len, ref2;
      ref2 = this.getItems();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        callback(item);
      }
      return this.onDidAddItem(function(arg) {
        var item;
        item = arg.item;
        return callback(item);
      });
    };

    Pane.prototype.onDidChangeActiveItem = function(callback) {
      return this.emitter.on('did-change-active-item', callback);
    };

    Pane.prototype.observeActiveItem = function(callback) {
      callback(this.getActiveItem());
      return this.onDidChangeActiveItem(callback);
    };

    Pane.prototype.onWillDestroyItem = function(callback) {
      return this.emitter.on('will-destroy-item', callback);
    };

    Pane.prototype.focus = function() {
      this.focused = true;
      if (!this.isActive()) {
        return this.activate();
      }
    };

    Pane.prototype.blur = function() {
      this.focused = false;
      return true;
    };

    Pane.prototype.isFocused = function() {
      return this.focused;
    };

    Pane.prototype.getPanes = function() {
      return [this];
    };

    Pane.prototype.unsubscribeFromItem = function(item) {
      var ref2;
      if ((ref2 = this.subscriptionsPerItem.get(item)) != null) {
        ref2.dispose();
      }
      return this.subscriptionsPerItem["delete"](item);
    };


    /*
    Section: Items
     */

    Pane.prototype.getItems = function() {
      return this.items.slice();
    };

    Pane.prototype.getActiveItem = function() {
      return this.activeItem;
    };

    Pane.prototype.setActiveItem = function(activeItem, options) {
      var modifyStack;
      if (options != null) {
        modifyStack = options.modifyStack;
      }
      if (activeItem !== this.activeItem) {
        if (modifyStack !== false) {
          this.addItemToStack(activeItem);
        }
        this.activeItem = activeItem;
        this.emitter.emit('did-change-active-item', this.activeItem);
      }
      return this.activeItem;
    };

    Pane.prototype.addItemsToStack = function(itemStackIndices) {
      var i, itemIndex, j, len;
      if (this.items.length > 0) {
        if (itemStackIndices.length === 0 || itemStackIndices.length !== this.items.length || itemStackIndices.indexOf(-1) >= 0) {
          itemStackIndices = (function() {
            var j, ref2, results;
            results = [];
            for (i = j = 0, ref2 = this.items.length - 1; 0 <= ref2 ? j <= ref2 : j >= ref2; i = 0 <= ref2 ? ++j : --j) {
              results.push(i);
            }
            return results;
          }).call(this);
        }
        for (j = 0, len = itemStackIndices.length; j < len; j++) {
          itemIndex = itemStackIndices[j];
          this.addItemToStack(this.items[itemIndex]);
        }
      }
    };

    Pane.prototype.addItemToStack = function(newItem) {
      var index;
      if (newItem == null) {
        return;
      }
      index = this.itemStack.indexOf(newItem);
      if (index !== -1) {
        this.itemStack.splice(index, 1);
      }
      return this.itemStack.push(newItem);
    };

    Pane.prototype.getActiveEditor = function() {
      if (this.activeItem instanceof TextEditor) {
        return this.activeItem;
      }
    };

    Pane.prototype.itemAtIndex = function(index) {
      return this.items[index];
    };

    Pane.prototype.activateNextRecentlyUsedItem = function() {
      var nextRecentlyUsedItem;
      if (this.items.length > 1) {
        if (this.itemStackIndex == null) {
          this.itemStackIndex = this.itemStack.length - 1;
        }
        if (this.itemStackIndex === 0) {
          this.itemStackIndex = this.itemStack.length;
        }
        this.itemStackIndex = this.itemStackIndex - 1;
        nextRecentlyUsedItem = this.itemStack[this.itemStackIndex];
        return this.setActiveItem(nextRecentlyUsedItem, {
          modifyStack: false
        });
      }
    };

    Pane.prototype.activatePreviousRecentlyUsedItem = function() {
      var previousRecentlyUsedItem;
      if (this.items.length > 1) {
        if (this.itemStackIndex + 1 === this.itemStack.length || (this.itemStackIndex == null)) {
          this.itemStackIndex = -1;
        }
        this.itemStackIndex = this.itemStackIndex + 1;
        previousRecentlyUsedItem = this.itemStack[this.itemStackIndex];
        return this.setActiveItem(previousRecentlyUsedItem, {
          modifyStack: false
        });
      }
    };

    Pane.prototype.moveActiveItemToTopOfStack = function() {
      delete this.itemStackIndex;
      return this.addItemToStack(this.activeItem);
    };

    Pane.prototype.activateNextItem = function() {
      var index;
      index = this.getActiveItemIndex();
      if (index < this.items.length - 1) {
        return this.activateItemAtIndex(index + 1);
      } else {
        return this.activateItemAtIndex(0);
      }
    };

    Pane.prototype.activatePreviousItem = function() {
      var index;
      index = this.getActiveItemIndex();
      if (index > 0) {
        return this.activateItemAtIndex(index - 1);
      } else {
        return this.activateItemAtIndex(this.items.length - 1);
      }
    };

    Pane.prototype.activateLastItem = function() {
      return this.activateItemAtIndex(this.items.length - 1);
    };

    Pane.prototype.moveItemRight = function() {
      var index, rightItemIndex;
      index = this.getActiveItemIndex();
      rightItemIndex = index + 1;
      if (!(rightItemIndex > this.items.length - 1)) {
        return this.moveItem(this.getActiveItem(), rightItemIndex);
      }
    };

    Pane.prototype.moveItemLeft = function() {
      var index, leftItemIndex;
      index = this.getActiveItemIndex();
      leftItemIndex = index - 1;
      if (!(leftItemIndex < 0)) {
        return this.moveItem(this.getActiveItem(), leftItemIndex);
      }
    };

    Pane.prototype.getActiveItemIndex = function() {
      return this.items.indexOf(this.activeItem);
    };

    Pane.prototype.activateItemAtIndex = function(index) {
      var item;
      item = this.itemAtIndex(index) || this.getActiveItem();
      return this.setActiveItem(item);
    };

    Pane.prototype.activateItem = function(item, options) {
      var index;
      if (options == null) {
        options = {};
      }
      if (item != null) {
        if (this.getPendingItem() === this.activeItem) {
          index = this.getActiveItemIndex();
        } else {
          index = this.getActiveItemIndex() + 1;
        }
        this.addItem(item, extend({}, options, {
          index: index
        }));
        return this.setActiveItem(item);
      }
    };

    Pane.prototype.addItem = function(item, options) {
      var index, itemSubscriptions, lastPendingItem, moved, pending, ref2, ref3, ref4, replacingPendingItem;
      if (options == null) {
        options = {};
      }
      if (typeof options === "number") {
        Grim.deprecate("Pane::addItem(item, " + options + ") is deprecated in favor of Pane::addItem(item, {index: " + options + "})");
        options = {
          index: options
        };
      }
      index = (ref2 = options.index) != null ? ref2 : this.getActiveItemIndex() + 1;
      moved = (ref3 = options.moved) != null ? ref3 : false;
      pending = (ref4 = options.pending) != null ? ref4 : false;
      if (!((item != null) && typeof item === 'object')) {
        throw new Error("Pane items must be objects. Attempted to add item " + item + ".");
      }
      if (typeof item.isDestroyed === "function" ? item.isDestroyed() : void 0) {
        throw new Error("Adding a pane item with URI '" + (typeof item.getURI === "function" ? item.getURI() : void 0) + "' that has already been destroyed");
      }
      if (indexOf.call(this.items, item) >= 0) {
        return;
      }
      if (typeof item.onDidDestroy === 'function') {
        itemSubscriptions = new CompositeDisposable;
        itemSubscriptions.add(item.onDidDestroy((function(_this) {
          return function() {
            return _this.removeItem(item, false);
          };
        })(this)));
        if (typeof item.onDidTerminatePendingState === "function") {
          itemSubscriptions.add(item.onDidTerminatePendingState((function(_this) {
            return function() {
              if (_this.getPendingItem() === item) {
                return _this.clearPendingItem();
              }
            };
          })(this)));
        }
        this.subscriptionsPerItem.set(item, itemSubscriptions);
      }
      this.items.splice(index, 0, item);
      lastPendingItem = this.getPendingItem();
      replacingPendingItem = (lastPendingItem != null) && !moved;
      if (replacingPendingItem) {
        this.pendingItem = null;
      }
      if (pending) {
        this.setPendingItem(item);
      }
      this.emitter.emit('did-add-item', {
        item: item,
        index: index,
        moved: moved
      });
      if (replacingPendingItem) {
        this.destroyItem(lastPendingItem);
      }
      if (this.getActiveItem() == null) {
        this.setActiveItem(item);
      }
      return item;
    };

    Pane.prototype.setPendingItem = function(item) {
      var mostRecentPendingItem;
      if (this.pendingItem !== item) {
        mostRecentPendingItem = this.pendingItem;
        this.pendingItem = item;
        if (mostRecentPendingItem != null) {
          return this.emitter.emit('item-did-terminate-pending-state', mostRecentPendingItem);
        }
      }
    };

    Pane.prototype.getPendingItem = function() {
      return this.pendingItem || null;
    };

    Pane.prototype.clearPendingItem = function() {
      return this.setPendingItem(null);
    };

    Pane.prototype.onItemDidTerminatePendingState = function(callback) {
      return this.emitter.on('item-did-terminate-pending-state', callback);
    };

    Pane.prototype.addItems = function(items, index) {
      var i, item, j, len;
      if (index == null) {
        index = this.getActiveItemIndex() + 1;
      }
      items = items.filter((function(_this) {
        return function(item) {
          return !(indexOf.call(_this.items, item) >= 0);
        };
      })(this));
      for (i = j = 0, len = items.length; j < len; i = ++j) {
        item = items[i];
        this.addItem(item, {
          index: index + i
        });
      }
      return items;
    };

    Pane.prototype.removeItem = function(item, moved) {
      var index, ref2;
      index = this.items.indexOf(item);
      if (index === -1) {
        return;
      }
      if (this.getPendingItem() === item) {
        this.pendingItem = null;
      }
      this.removeItemFromStack(item);
      this.emitter.emit('will-remove-item', {
        item: item,
        index: index,
        destroyed: !moved,
        moved: moved
      });
      this.unsubscribeFromItem(item);
      if (item === this.activeItem) {
        if (this.items.length === 1) {
          this.setActiveItem(void 0);
        } else if (index === 0) {
          this.activateNextItem();
        } else {
          this.activatePreviousItem();
        }
      }
      this.items.splice(index, 1);
      this.emitter.emit('did-remove-item', {
        item: item,
        index: index,
        destroyed: !moved,
        moved: moved
      });
      if (!moved) {
        if ((ref2 = this.container) != null) {
          ref2.didDestroyPaneItem({
            item: item,
            index: index,
            pane: this
          });
        }
      }
      if (this.items.length === 0 && this.config.get('core.destroyEmptyPanes')) {
        return this.destroy();
      }
    };

    Pane.prototype.removeItemFromStack = function(item) {
      var index;
      index = this.itemStack.indexOf(item);
      if (index !== -1) {
        return this.itemStack.splice(index, 1);
      }
    };

    Pane.prototype.moveItem = function(item, newIndex) {
      var oldIndex;
      oldIndex = this.items.indexOf(item);
      this.items.splice(oldIndex, 1);
      this.items.splice(newIndex, 0, item);
      return this.emitter.emit('did-move-item', {
        item: item,
        oldIndex: oldIndex,
        newIndex: newIndex
      });
    };

    Pane.prototype.moveItemToPane = function(item, pane, index) {
      this.removeItem(item, true);
      return pane.addItem(item, {
        index: index,
        moved: true
      });
    };

    Pane.prototype.destroyActiveItem = function() {
      this.destroyItem(this.activeItem);
      return false;
    };

    Pane.prototype.destroyItem = function(item) {
      var index, ref2;
      index = this.items.indexOf(item);
      if (index !== -1) {
        this.emitter.emit('will-destroy-item', {
          item: item,
          index: index
        });
        if ((ref2 = this.container) != null) {
          ref2.willDestroyPaneItem({
            item: item,
            index: index,
            pane: this
          });
        }
        if (this.promptToSaveItem(item)) {
          this.removeItem(item, false);
          if (typeof item.destroy === "function") {
            item.destroy();
          }
          return true;
        } else {
          return false;
        }
      }
    };

    Pane.prototype.destroyItems = function() {
      var item, j, len, ref2;
      ref2 = this.getItems();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        this.destroyItem(item);
      }
    };

    Pane.prototype.destroyInactiveItems = function() {
      var item, j, len, ref2;
      ref2 = this.getItems();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        if (item !== this.activeItem) {
          this.destroyItem(item);
        }
      }
    };

    Pane.prototype.promptToSaveItem = function(item, options) {
      var ref2, saveDialog, saveError, uri;
      if (options == null) {
        options = {};
      }
      if (!(typeof item.shouldPromptToSave === "function" ? item.shouldPromptToSave(options) : void 0)) {
        return true;
      }
      if (typeof item.getURI === 'function') {
        uri = item.getURI();
      } else if (typeof item.getUri === 'function') {
        uri = item.getUri();
      } else {
        return true;
      }
      saveDialog = (function(_this) {
        return function(saveButtonText, saveFn, message) {
          var chosen;
          chosen = _this.applicationDelegate.confirm({
            message: message,
            detailedMessage: "Your changes will be lost if you close this item without saving.",
            buttons: [saveButtonText, "Cancel", "Don't Save"]
          });
          switch (chosen) {
            case 0:
              return saveFn(item, saveError);
            case 1:
              return false;
            case 2:
              return true;
          }
        };
      })(this);
      saveError = (function(_this) {
        return function(error) {
          var ref2;
          if (error) {
            return saveDialog("Save as", _this.saveItemAs, "'" + ((ref2 = typeof item.getTitle === "function" ? item.getTitle() : void 0) != null ? ref2 : uri) + "' could not be saved.\nError: " + (_this.getMessageForErrorCode(error.code)));
          } else {
            return true;
          }
        };
      })(this);
      return saveDialog("Save", this.saveItem, "'" + ((ref2 = typeof item.getTitle === "function" ? item.getTitle() : void 0) != null ? ref2 : uri) + "' has changes, do you want to save them?");
    };

    Pane.prototype.saveActiveItem = function(nextAction) {
      return this.saveItem(this.getActiveItem(), nextAction);
    };

    Pane.prototype.saveActiveItemAs = function(nextAction) {
      return this.saveItemAs(this.getActiveItem(), nextAction);
    };

    Pane.prototype.saveItem = function(item, nextAction) {
      var error, itemURI;
      if (typeof (item != null ? item.getURI : void 0) === 'function') {
        itemURI = item.getURI();
      } else if (typeof (item != null ? item.getUri : void 0) === 'function') {
        itemURI = item.getUri();
      }
      if (itemURI != null) {
        try {
          if (typeof item.save === "function") {
            item.save();
          }
          return typeof nextAction === "function" ? nextAction() : void 0;
        } catch (error1) {
          error = error1;
          if (nextAction) {
            return nextAction(error);
          } else {
            return this.handleSaveError(error, item);
          }
        }
      } else {
        return this.saveItemAs(item, nextAction);
      }
    };

    Pane.prototype.saveItemAs = function(item, nextAction) {
      var error, newItemPath, ref2, saveOptions;
      if ((item != null ? item.saveAs : void 0) == null) {
        return;
      }
      saveOptions = (ref2 = typeof item.getSaveDialogOptions === "function" ? item.getSaveDialogOptions() : void 0) != null ? ref2 : {};
      if (saveOptions.defaultPath == null) {
        saveOptions.defaultPath = item.getPath();
      }
      newItemPath = this.applicationDelegate.showSaveDialog(saveOptions);
      if (newItemPath) {
        try {
          item.saveAs(newItemPath);
          return typeof nextAction === "function" ? nextAction() : void 0;
        } catch (error1) {
          error = error1;
          if (nextAction) {
            return nextAction(error);
          } else {
            return this.handleSaveError(error, item);
          }
        }
      }
    };

    Pane.prototype.saveItems = function() {
      var item, j, len, ref2;
      ref2 = this.getItems();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        if (typeof item.isModified === "function" ? item.isModified() : void 0) {
          this.saveItem(item);
        }
      }
    };

    Pane.prototype.itemForURI = function(uri) {
      return find(this.items, function(item) {
        var itemUri;
        if (typeof item.getURI === 'function') {
          itemUri = item.getURI();
        } else if (typeof item.getUri === 'function') {
          itemUri = item.getUri();
        }
        return itemUri === uri;
      });
    };

    Pane.prototype.activateItemForURI = function(uri) {
      var item;
      if (item = this.itemForURI(uri)) {
        this.activateItem(item);
        return true;
      } else {
        return false;
      }
    };

    Pane.prototype.copyActiveItem = function() {
      var base, ref2;
      if (this.activeItem != null) {
        return (ref2 = typeof (base = this.activeItem).copy === "function" ? base.copy() : void 0) != null ? ref2 : this.deserializerManager.deserialize(this.activeItem.serialize());
      }
    };


    /*
    Section: Lifecycle
     */

    Pane.prototype.isActive = function() {
      var ref2;
      return ((ref2 = this.container) != null ? ref2.getActivePane() : void 0) === this;
    };

    Pane.prototype.activate = function() {
      var ref2;
      if (this.isDestroyed()) {
        throw new Error("Pane has been destroyed");
      }
      if ((ref2 = this.container) != null) {
        ref2.setActivePane(this);
      }
      return this.emitter.emit('did-activate');
    };

    Pane.prototype.destroy = function() {
      var ref2, ref3;
      if (((ref2 = this.container) != null ? ref2.isAlive() : void 0) && this.container.getPanes().length === 1) {
        return this.destroyItems();
      } else {
        this.emitter.emit('will-destroy');
        if ((ref3 = this.container) != null) {
          ref3.willDestroyPane({
            pane: this
          });
        }
        return Pane.__super__.destroy.apply(this, arguments);
      }
    };

    Pane.prototype.destroyed = function() {
      var item, j, len, ref2, ref3;
      if (this.isActive()) {
        this.container.activateNextPane();
      }
      this.emitter.emit('did-destroy');
      this.emitter.dispose();
      ref2 = this.items.slice();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        if (typeof item.destroy === "function") {
          item.destroy();
        }
      }
      return (ref3 = this.container) != null ? ref3.didDestroyPane({
        pane: this
      }) : void 0;
    };


    /*
    Section: Splitting
     */

    Pane.prototype.splitLeft = function(params) {
      return this.split('horizontal', 'before', params);
    };

    Pane.prototype.splitRight = function(params) {
      return this.split('horizontal', 'after', params);
    };

    Pane.prototype.splitUp = function(params) {
      return this.split('vertical', 'before', params);
    };

    Pane.prototype.splitDown = function(params) {
      return this.split('vertical', 'after', params);
    };

    Pane.prototype.split = function(orientation, side, params) {
      var newPane;
      if (params != null ? params.copyActiveItem : void 0) {
        if (params.items == null) {
          params.items = [];
        }
        params.items.push(this.copyActiveItem());
      }
      if (this.parent.orientation !== orientation) {
        this.parent.replaceChild(this, new PaneAxis({
          container: this.container,
          orientation: orientation,
          children: [this],
          flexScale: this.flexScale
        }));
        this.setFlexScale(1);
      }
      newPane = new Pane(extend({
        applicationDelegate: this.applicationDelegate,
        notificationManager: this.notificationManager,
        deserializerManager: this.deserializerManager,
        config: this.config
      }, params));
      switch (side) {
        case 'before':
          this.parent.insertChildBefore(this, newPane);
          break;
        case 'after':
          this.parent.insertChildAfter(this, newPane);
      }
      if (params != null ? params.moveActiveItem : void 0) {
        this.moveItemToPane(this.activeItem, newPane);
      }
      newPane.activate();
      return newPane;
    };

    Pane.prototype.findLeftmostSibling = function() {
      var leftmostSibling;
      if (this.parent.orientation === 'horizontal') {
        leftmostSibling = this.parent.children[0];
        if (leftmostSibling instanceof PaneAxis) {
          return this;
        } else {
          return leftmostSibling;
        }
      } else {
        return this;
      }
    };

    Pane.prototype.findOrCreateRightmostSibling = function() {
      var rightmostSibling;
      if (this.parent.orientation === 'horizontal') {
        rightmostSibling = last(this.parent.children);
        if (rightmostSibling instanceof PaneAxis) {
          return this.splitRight();
        } else {
          return rightmostSibling;
        }
      } else {
        return this.splitRight();
      }
    };

    Pane.prototype.findTopmostSibling = function() {
      var topmostSibling;
      if (this.parent.orientation === 'vertical') {
        topmostSibling = this.parent.children[0];
        if (topmostSibling instanceof PaneAxis) {
          return this;
        } else {
          return topmostSibling;
        }
      } else {
        return this;
      }
    };

    Pane.prototype.findOrCreateBottommostSibling = function() {
      var bottommostSibling;
      if (this.parent.orientation === 'vertical') {
        bottommostSibling = last(this.parent.children);
        if (bottommostSibling instanceof PaneAxis) {
          return this.splitDown();
        } else {
          return bottommostSibling;
        }
      } else {
        return this.splitDown();
      }
    };

    Pane.prototype.close = function() {
      if (this.confirmClose()) {
        return this.destroy();
      }
    };

    Pane.prototype.confirmClose = function() {
      var item, j, len, ref2;
      ref2 = this.getItems();
      for (j = 0, len = ref2.length; j < len; j++) {
        item = ref2[j];
        if (!this.promptToSaveItem(item)) {
          return false;
        }
      }
      return true;
    };

    Pane.prototype.handleSaveError = function(error, item) {
      var addWarningWithPath, customMessage, errorMatch, fileName, itemPath, ref2, ref3, ref4;
      itemPath = (ref2 = error.path) != null ? ref2 : item != null ? typeof item.getPath === "function" ? item.getPath() : void 0 : void 0;
      addWarningWithPath = (function(_this) {
        return function(message, options) {
          if (itemPath) {
            message = message + " '" + itemPath + "'";
          }
          return _this.notificationManager.addWarning(message, options);
        };
      })(this);
      customMessage = this.getMessageForErrorCode(error.code);
      if (customMessage != null) {
        return addWarningWithPath("Unable to save file: " + customMessage);
      } else if (error.code === 'EISDIR' || ((ref3 = error.message) != null ? typeof ref3.endsWith === "function" ? ref3.endsWith('is a directory') : void 0 : void 0)) {
        return this.notificationManager.addWarning("Unable to save file: " + error.message);
      } else if ((ref4 = error.code) === 'EPERM' || ref4 === 'EBUSY' || ref4 === 'UNKNOWN' || ref4 === 'EEXIST' || ref4 === 'ELOOP' || ref4 === 'EAGAIN') {
        return addWarningWithPath('Unable to save file', {
          detail: error.message
        });
      } else if (errorMatch = /ENOTDIR, not a directory '([^']+)'/.exec(error.message)) {
        fileName = errorMatch[1];
        return this.notificationManager.addWarning("Unable to save file: A directory in the path '" + fileName + "' could not be written to");
      } else {
        throw error;
      }
    };

    Pane.prototype.getMessageForErrorCode = function(errorCode) {
      switch (errorCode) {
        case 'EACCES':
          return 'Permission denied';
        case 'ECONNRESET':
          return 'Connection reset';
        case 'EINTR':
          return 'Interrupted system call';
        case 'EIO':
          return 'I/O error writing file';
        case 'ENOSPC':
          return 'No space left on device';
        case 'ENOTSUP':
          return 'Operation not supported on socket';
        case 'ENXIO':
          return 'No such device or address';
        case 'EROFS':
          return 'Read-only file system';
        case 'ESPIPE':
          return 'Invalid seek';
        case 'ETIMEDOUT':
          return 'Connection timed out';
      }
    };

    return Pane;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvc3JjL3BhbmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2R0FBQTtJQUFBOzs7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFnQyxPQUFBLENBQVEsaUJBQVIsQ0FBaEMsRUFBQyxlQUFELEVBQU8scUJBQVAsRUFBZ0IsbUJBQWhCLEVBQXdCOztFQUN4QixPQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLDhDQUFELEVBQXNCOztFQUN0QixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFXYixNQUFNLENBQUMsT0FBUCxHQUNNOzs7bUJBQ0osU0FBQSxHQUFXOzttQkFDWCxVQUFBLEdBQVk7O21CQUNaLE9BQUEsR0FBUzs7SUFFVCxJQUFDLENBQUEsV0FBRCxHQUFjLFNBQUMsS0FBRCxFQUFRLEdBQVI7QUFDWixVQUFBO01BRHFCLG1DQUFlLCtDQUFxQixxQkFBUTtNQUNoRSxtQkFBRCxFQUFRLHVDQUFSLEVBQXlCLG1DQUF6QixFQUF3Qzs7UUFDeEMsZ0JBQWlCOztNQUNqQixLQUFBLEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFDLFNBQUQ7ZUFBZSxhQUFhLENBQUMsV0FBZCxDQUEwQixTQUExQjtNQUFmLENBQVY7TUFDUixLQUFLLENBQUMsVUFBTixHQUFtQixLQUFNLENBQUEsZUFBQTtNQUN6QixLQUFLLENBQUMsS0FBTixHQUFjLE9BQUEsQ0FBUSxLQUFSO01BQ2QsSUFBRyxxQkFBSDs7VUFDRSxLQUFLLENBQUMsYUFBYyxJQUFBLENBQUssS0FBSyxDQUFDLEtBQVgsRUFBa0Is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UnBCLGFBU08sUUFUUDtpQkFTcUI7QUFUckIsYUFVTyxXQVZQO2lCQVV3QjtBQVZ4QjtJQURzQjs7OztLQXAxQlA7QUFqQm5CIiwic291cmNlc0NvbnRlbnQiOlsiR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG57ZmluZCwgY29tcGFjdCwgZXh0ZW5kLCBsYXN0fSA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbk1vZGVsID0gcmVxdWlyZSAnLi9tb2RlbCdcblBhbmVBeGlzID0gcmVxdWlyZSAnLi9wYW5lLWF4aXMnXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi90ZXh0LWVkaXRvcidcblxuIyBFeHRlbmRlZDogQSBjb250YWluZXIgZm9yIHByZXNlbnRpbmcgY29udGVudCBpbiB0aGUgY2VudGVyIG9mIHRoZSB3b3Jrc3BhY2UuXG4jIFBhbmVzIGNhbiBjb250YWluIG11bHRpcGxlIGl0ZW1zLCBvbmUgb2Ygd2hpY2ggaXMgKmFjdGl2ZSogYXQgYSBnaXZlbiB0aW1lLlxuIyBUaGUgdmlldyBjb3JyZXNwb25kaW5nIHRvIHRoZSBhY3RpdmUgaXRlbSBpcyBkaXNwbGF5ZWQgaW4gdGhlIGludGVyZmFjZS4gSW5cbiMgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiwgdGFicyBhcmUgYWxzbyBkaXNwbGF5ZWQgZm9yIGVhY2ggaXRlbS5cbiNcbiMgRWFjaCBwYW5lIG1heSBhbHNvIGNvbnRhaW4gb25lICpwZW5kaW5nKiBpdGVtLiBXaGVuIGEgcGVuZGluZyBpdGVtIGlzIGFkZGVkXG4jIHRvIGEgcGFuZSwgaXQgd2lsbCByZXBsYWNlIHRoZSBjdXJyZW50bHkgcGVuZGluZyBpdGVtLCBpZiBhbnksIGluc3RlYWQgb2ZcbiMgc2ltcGx5IGJlaW5nIGFkZGVkLiBJbiB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uLCB0aGUgdGV4dCBpbiB0aGUgdGFiIGZvclxuIyBwZW5kaW5nIGl0ZW1zIGlzIHNob3duIGluIGl0YWxpY3MuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYW5lIGV4dGVuZHMgTW9kZWxcbiAgY29udGFpbmVyOiB1bmRlZmluZWRcbiAgYWN0aXZlSXRlbTogdW5kZWZpbmVkXG4gIGZvY3VzZWQ6IGZhbHNlXG5cbiAgQGRlc2VyaWFsaXplOiAoc3RhdGUsIHtkZXNlcmlhbGl6ZXJzLCBhcHBsaWNhdGlvbkRlbGVnYXRlLCBjb25maWcsIG5vdGlmaWNhdGlvbnN9KSAtPlxuICAgIHtpdGVtcywgYWN0aXZlSXRlbUluZGV4LCBhY3RpdmVJdGVtVVJJLCBhY3RpdmVJdGVtVXJpfSA9IHN0YXRlXG4gICAgYWN0aXZlSXRlbVVSSSA/PSBhY3RpdmVJdGVtVXJpXG4gICAgaXRlbXMgPSBpdGVtcy5tYXAgKGl0ZW1TdGF0ZSkgLT4gZGVzZXJpYWxpemVycy5kZXNlcmlhbGl6ZShpdGVtU3RhdGUpXG4gICAgc3RhdGUuYWN0aXZlSXRlbSA9IGl0ZW1zW2FjdGl2ZUl0ZW1JbmRleF1cbiAgICBzdGF0ZS5pdGVtcyA9IGNvbXBhY3QoaXRlbXMpXG4gICAgaWYgYWN0aXZlSXRlbVVSST9cbiAgICAgIHN0YXRlLmFjdGl2ZUl0ZW0gPz0gZmluZCBzdGF0ZS5pdGVtcywgKGl0ZW0pIC0+XG4gICAgICAgIGlmIHR5cGVvZiBpdGVtLmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICAgICAgaXRlbVVSSSA9IGl0ZW0uZ2V0VVJJKClcbiAgICAgICAgaXRlbVVSSSBpcyBhY3RpdmVJdGVtVVJJXG4gICAgbmV3IFBhbmUoZXh0ZW5kKHN0YXRlLCB7XG4gICAgICBkZXNlcmlhbGl6ZXJNYW5hZ2VyOiBkZXNlcmlhbGl6ZXJzLFxuICAgICAgbm90aWZpY2F0aW9uTWFuYWdlcjogbm90aWZpY2F0aW9ucyxcbiAgICAgIGNvbmZpZywgYXBwbGljYXRpb25EZWxlZ2F0ZVxuICAgIH0pKVxuXG4gIGNvbnN0cnVjdG9yOiAocGFyYW1zKSAtPlxuICAgIHN1cGVyXG5cbiAgICB7XG4gICAgICBAYWN0aXZlSXRlbSwgQGZvY3VzZWQsIEBhcHBsaWNhdGlvbkRlbGVnYXRlLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGNvbmZpZyxcbiAgICAgIEBkZXNlcmlhbGl6ZXJNYW5hZ2VyXG4gICAgfSA9IHBhcmFtc1xuXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdWJzY3JpcHRpb25zUGVySXRlbSA9IG5ldyBXZWFrTWFwXG4gICAgQGl0ZW1zID0gW11cbiAgICBAaXRlbVN0YWNrID0gW11cblxuICAgIEBhZGRJdGVtcyhjb21wYWN0KHBhcmFtcz8uaXRlbXMgPyBbXSkpXG4gICAgQHNldEFjdGl2ZUl0ZW0oQGl0ZW1zWzBdKSB1bmxlc3MgQGdldEFjdGl2ZUl0ZW0oKT9cbiAgICBAYWRkSXRlbXNUb1N0YWNrKHBhcmFtcz8uaXRlbVN0YWNrSW5kaWNlcyA/IFtdKVxuICAgIEBzZXRGbGV4U2NhbGUocGFyYW1zPy5mbGV4U2NhbGUgPyAxKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBpdGVtc1RvQmVTZXJpYWxpemVkID0gY29tcGFjdChAaXRlbXMubWFwKChpdGVtKSAtPiBpdGVtIGlmIHR5cGVvZiBpdGVtLnNlcmlhbGl6ZSBpcyAnZnVuY3Rpb24nKSlcbiAgICBpdGVtU3RhY2tJbmRpY2VzID0gKGl0ZW1zVG9CZVNlcmlhbGl6ZWQuaW5kZXhPZihpdGVtKSBmb3IgaXRlbSBpbiBAaXRlbVN0YWNrIHdoZW4gdHlwZW9mIGl0ZW0uc2VyaWFsaXplIGlzICdmdW5jdGlvbicpXG4gICAgYWN0aXZlSXRlbUluZGV4ID0gaXRlbXNUb0JlU2VyaWFsaXplZC5pbmRleE9mKEBhY3RpdmVJdGVtKVxuXG4gICAgZGVzZXJpYWxpemVyOiAnUGFuZSdcbiAgICBpZDogQGlkXG4gICAgaXRlbXM6IGl0ZW1zVG9CZVNlcmlhbGl6ZWQubWFwKChpdGVtKSAtPiBpdGVtLnNlcmlhbGl6ZSgpKVxuICAgIGl0ZW1TdGFja0luZGljZXM6IGl0ZW1TdGFja0luZGljZXNcbiAgICBhY3RpdmVJdGVtSW5kZXg6IGFjdGl2ZUl0ZW1JbmRleFxuICAgIGZvY3VzZWQ6IEBmb2N1c2VkXG4gICAgZmxleFNjYWxlOiBAZmxleFNjYWxlXG5cbiAgZ2V0UGFyZW50OiAtPiBAcGFyZW50XG5cbiAgc2V0UGFyZW50OiAoQHBhcmVudCkgLT4gQHBhcmVudFxuXG4gIGdldENvbnRhaW5lcjogLT4gQGNvbnRhaW5lclxuXG4gIHNldENvbnRhaW5lcjogKGNvbnRhaW5lcikgLT5cbiAgICBpZiBjb250YWluZXIgYW5kIGNvbnRhaW5lciBpc250IEBjb250YWluZXJcbiAgICAgIEBjb250YWluZXIgPSBjb250YWluZXJcbiAgICAgIGNvbnRhaW5lci5kaWRBZGRQYW5lKHtwYW5lOiB0aGlzfSlcblxuICBzZXRGbGV4U2NhbGU6IChAZmxleFNjYWxlKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtZmxleC1zY2FsZScsIEBmbGV4U2NhbGVcbiAgICBAZmxleFNjYWxlXG5cbiAgZ2V0RmxleFNjYWxlOiAtPiBAZmxleFNjYWxlXG5cbiAgaW5jcmVhc2VTaXplOiAtPiBAc2V0RmxleFNjYWxlKEBnZXRGbGV4U2NhbGUoKSAqIDEuMSlcblxuICBkZWNyZWFzZVNpemU6IC0+IEBzZXRGbGV4U2NhbGUoQGdldEZsZXhTY2FsZSgpIC8gMS4xKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFdmVudCBTdWJzY3JpcHRpb25cbiAgIyMjXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgcGFuZSByZXNpemVzXG4gICNcbiAgIyBUaGUgY2FsbGJhY2sgd2lsbCBiZSBpbnZva2VkIHdoZW4gcGFuZSdzIGZsZXhTY2FsZSBwcm9wZXJ0eSBjaGFuZ2VzLlxuICAjIFVzZSB7OjpnZXRGbGV4U2NhbGV9IHRvIGdldCB0aGUgY3VycmVudCB2YWx1ZS5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwYW5lIGlzIHJlc2l6ZWRcbiAgIyAgICogYGZsZXhTY2FsZWAge051bWJlcn0gcmVwcmVzZW50aW5nIHRoZSBwYW5lcyBgZmxleC1ncm93YDsgYWJpbGl0eSBmb3IgYVxuICAjICAgICBmbGV4IGl0ZW0gdG8gZ3JvdyBpZiBuZWNlc3NhcnkuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoICcuZGlzcG9zZSgpJyBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZUZsZXhTY2FsZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWZsZXgtc2NhbGUnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSB2YWx1ZXMgb2ZcbiAgIyB7OjpnZXRGbGV4U2NhbGV9LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSB2YWx1ZXMgb2ZcbiAgIyAgIHRoZSB7OjpnZXRGbGV4U2NhbGV9IHByb3BlcnR5LlxuICAjICAgKiBgZmxleFNjYWxlYCB7TnVtYmVyfSByZXByZXNlbnRpbmcgdGhlIHBhbmVzIGBmbGV4LWdyb3dgOyBhYmlsaXR5IGZvciBhXG4gICMgICAgIGZsZXggaXRlbSB0byBncm93IGlmIG5lY2Vzc2FyeS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9ic2VydmVGbGV4U2NhbGU6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhAZmxleFNjYWxlKVxuICAgIEBvbkRpZENoYW5nZUZsZXhTY2FsZShjYWxsYmFjaylcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBwYW5lIGlzIGFjdGl2YXRlZC5cbiAgI1xuICAjIFRoZSBnaXZlbiBjYWxsYmFjayB3aWxsIGJlIGludm9rZWQgd2hlbmV2ZXIgezo6YWN0aXZhdGV9IGlzIGNhbGxlZCBvbiB0aGVcbiAgIyBwYW5lLCBldmVuIGlmIGl0IGlzIGFscmVhZHkgYWN0aXZlIGF0IHRoZSB0aW1lLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBhbmUgaXMgYWN0aXZhdGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRBY3RpdmF0ZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWN0aXZhdGUnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIGJlZm9yZSB0aGUgcGFuZSBpcyBkZXN0cm95ZWQuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgYmVmb3JlIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uV2lsbERlc3Ryb3k6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnd2lsbC1kZXN0cm95JywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2hlbiB0aGUgdmFsdWUgb2YgdGhlIHs6OmlzQWN0aXZlfVxuICAjIHByb3BlcnR5IGNoYW5nZXMuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2hlbiB0aGUgdmFsdWUgb2YgdGhlIHs6OmlzQWN0aXZlfVxuICAjICAgcHJvcGVydHkgY2hhbmdlcy5cbiAgIyAgICogYGFjdGl2ZWAge0Jvb2xlYW59IGluZGljYXRpbmcgd2hldGhlciB0aGUgcGFuZSBpcyBhY3RpdmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZUFjdGl2ZTogKGNhbGxiYWNrKSAtPlxuICAgIEBjb250YWluZXIub25EaWRDaGFuZ2VBY3RpdmVQYW5lIChhY3RpdmVQYW5lKSA9PlxuICAgICAgY2FsbGJhY2sodGhpcyBpcyBhY3RpdmVQYW5lKVxuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSB2YWx1ZXMgb2YgdGhlXG4gICMgezo6aXNBY3RpdmV9IHByb3BlcnR5LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSB2YWx1ZXMgb2ZcbiAgIyAgIHRoZSB7Ojppc0FjdGl2ZX0gcHJvcGVydHkuXG4gICMgICAqIGBhY3RpdmVgIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHBhbmUgaXMgYWN0aXZlLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb2JzZXJ2ZUFjdGl2ZTogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKEBpc0FjdGl2ZSgpKVxuICAgIEBvbkRpZENoYW5nZUFjdGl2ZShjYWxsYmFjaylcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIGFuIGl0ZW0gaXMgYWRkZWQgdG8gdGhlIHBhbmUuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCB3aGVuIGl0ZW1zIGFyZSBhZGRlZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIGFkZGVkIHBhbmUgaXRlbS5cbiAgIyAgICAgKiBgaW5kZXhgIHtOdW1iZXJ9IGluZGljYXRpbmcgd2hlcmUgdGhlIGl0ZW0gaXMgbG9jYXRlZC5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkQWRkSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLWl0ZW0nLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYW4gaXRlbSBpcyByZW1vdmVkIGZyb20gdGhlIHBhbmUuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCB3aGVuIGl0ZW1zIGFyZSByZW1vdmVkLlxuICAjICAgKiBgZXZlbnRgIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgICAqIGBpdGVtYCBUaGUgcmVtb3ZlZCBwYW5lIGl0ZW0uXG4gICMgICAgICogYGluZGV4YCB7TnVtYmVyfSBpbmRpY2F0aW5nIHdoZXJlIHRoZSBpdGVtIHdhcyBsb2NhdGVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRSZW1vdmVJdGVtOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1yZW1vdmUtaXRlbScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgYmVmb3JlIGFuIGl0ZW0gaXMgcmVtb3ZlZCBmcm9tIHRoZSBwYW5lLlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggd2hlbiBpdGVtcyBhcmUgcmVtb3ZlZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIHBhbmUgaXRlbSB0byBiZSByZW1vdmVkLlxuICAjICAgICAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB3aGVyZSB0aGUgaXRlbSBpcyBsb2NhdGVkLlxuICBvbldpbGxSZW1vdmVJdGVtOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ3dpbGwtcmVtb3ZlLWl0ZW0nLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gYW4gaXRlbSBpcyBtb3ZlZCB3aXRoaW4gdGhlIHBhbmUuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCB3aGVuIGl0ZW1zIGFyZSBtb3ZlZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIHJlbW92ZWQgcGFuZSBpdGVtLlxuICAjICAgICAqIGBvbGRJbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB3aGVyZSB0aGUgaXRlbSB3YXMgbG9jYXRlZC5cbiAgIyAgICAgKiBgbmV3SW5kZXhgIHtOdW1iZXJ9IGluZGljYXRpbmcgd2hlcmUgdGhlIGl0ZW0gaXMgbm93IGxvY2F0ZWQuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZE1vdmVJdGVtOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1tb3ZlLWl0ZW0nLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdpdGggYWxsIGN1cnJlbnQgYW5kIGZ1dHVyZSBpdGVtcy5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aXRoIGN1cnJlbnQgYW5kIGZ1dHVyZSBpdGVtcy5cbiAgIyAgICogYGl0ZW1gIEFuIGl0ZW0gdGhhdCBpcyBwcmVzZW50IGluIHs6OmdldEl0ZW1zfSBhdCB0aGUgdGltZSBvZlxuICAjICAgICBzdWJzY3JpcHRpb24gb3IgdGhhdCBpcyBhZGRlZCBhdCBzb21lIGxhdGVyIHRpbWUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlSXRlbXM6IChjYWxsYmFjaykgLT5cbiAgICBjYWxsYmFjayhpdGVtKSBmb3IgaXRlbSBpbiBAZ2V0SXRlbXMoKVxuICAgIEBvbkRpZEFkZEl0ZW0gKHtpdGVtfSkgLT4gY2FsbGJhY2soaXRlbSlcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSB2YWx1ZSBvZiB7OjpnZXRBY3RpdmVJdGVtfVxuICAjIGNoYW5nZXMuXG4gICNcbiAgIyAqIGBjYWxsYmFja2Age0Z1bmN0aW9ufSB0byBiZSBjYWxsZWQgd2l0aCB3aGVuIHRoZSBhY3RpdmUgaXRlbSBjaGFuZ2VzLlxuICAjICAgKiBgYWN0aXZlSXRlbWAgVGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZUFjdGl2ZUl0ZW06IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1hY3RpdmUtaXRlbScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgd2l0aCB0aGUgY3VycmVudCBhbmQgZnV0dXJlIHZhbHVlcyBvZlxuICAjIHs6OmdldEFjdGl2ZUl0ZW19LlxuICAjXG4gICMgKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn0gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgYW5kIGZ1dHVyZSBhY3RpdmVcbiAgIyAgIGl0ZW1zLlxuICAjICAgKiBgYWN0aXZlSXRlbWAgVGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvYnNlcnZlQWN0aXZlSXRlbTogKGNhbGxiYWNrKSAtPlxuICAgIGNhbGxiYWNrKEBnZXRBY3RpdmVJdGVtKCkpXG4gICAgQG9uRGlkQ2hhbmdlQWN0aXZlSXRlbShjYWxsYmFjaylcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayBiZWZvcmUgaXRlbXMgYXJlIGRlc3Ryb3llZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBiZWZvcmUgaXRlbXMgYXJlIGRlc3Ryb3llZC5cbiAgIyAgICogYGV2ZW50YCB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICAgKiBgaXRlbWAgVGhlIGl0ZW0gdGhhdCB3aWxsIGJlIGRlc3Ryb3llZC5cbiAgIyAgICAgKiBgaW5kZXhgIFRoZSBsb2NhdGlvbiBvZiB0aGUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG9cbiAgIyB1bnN1YnNjcmliZS5cbiAgb25XaWxsRGVzdHJveUl0ZW06IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnd2lsbC1kZXN0cm95LWl0ZW0nLCBjYWxsYmFja1xuXG4gICMgQ2FsbGVkIGJ5IHRoZSB2aWV3IGxheWVyIHRvIGluZGljYXRlIHRoYXQgdGhlIHBhbmUgaGFzIGdhaW5lZCBmb2N1cy5cbiAgZm9jdXM6IC0+XG4gICAgQGZvY3VzZWQgPSB0cnVlXG4gICAgQGFjdGl2YXRlKCkgdW5sZXNzIEBpc0FjdGl2ZSgpXG5cbiAgIyBDYWxsZWQgYnkgdGhlIHZpZXcgbGF5ZXIgdG8gaW5kaWNhdGUgdGhhdCB0aGUgcGFuZSBoYXMgbG9zdCBmb2N1cy5cbiAgYmx1cjogLT5cbiAgICBAZm9jdXNlZCA9IGZhbHNlXG4gICAgdHJ1ZSAjIGlmIHRoaXMgaXMgY2FsbGVkIGZyb20gYW4gZXZlbnQgaGFuZGxlciwgZG9uJ3QgY2FuY2VsIGl0XG5cbiAgaXNGb2N1c2VkOiAtPiBAZm9jdXNlZFxuXG4gIGdldFBhbmVzOiAtPiBbdGhpc11cblxuICB1bnN1YnNjcmliZUZyb21JdGVtOiAoaXRlbSkgLT5cbiAgICBAc3Vic2NyaXB0aW9uc1Blckl0ZW0uZ2V0KGl0ZW0pPy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9uc1Blckl0ZW0uZGVsZXRlKGl0ZW0pXG5cbiAgIyMjXG4gIFNlY3Rpb246IEl0ZW1zXG4gICMjI1xuXG4gICMgUHVibGljOiBHZXQgdGhlIGl0ZW1zIGluIHRoaXMgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiBpdGVtcy5cbiAgZ2V0SXRlbXM6IC0+XG4gICAgQGl0ZW1zLnNsaWNlKClcblxuICAjIFB1YmxpYzogR2V0IHRoZSBhY3RpdmUgcGFuZSBpdGVtIGluIHRoaXMgcGFuZS5cbiAgI1xuICAjIFJldHVybnMgYSBwYW5lIGl0ZW0uXG4gIGdldEFjdGl2ZUl0ZW06IC0+IEBhY3RpdmVJdGVtXG5cbiAgc2V0QWN0aXZlSXRlbTogKGFjdGl2ZUl0ZW0sIG9wdGlvbnMpIC0+XG4gICAge21vZGlmeVN0YWNrfSA9IG9wdGlvbnMgaWYgb3B0aW9ucz9cbiAgICB1bmxlc3MgYWN0aXZlSXRlbSBpcyBAYWN0aXZlSXRlbVxuICAgICAgQGFkZEl0ZW1Ub1N0YWNrKGFjdGl2ZUl0ZW0pIHVubGVzcyBtb2RpZnlTdGFjayBpcyBmYWxzZVxuICAgICAgQGFjdGl2ZUl0ZW0gPSBhY3RpdmVJdGVtXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLWFjdGl2ZS1pdGVtJywgQGFjdGl2ZUl0ZW1cbiAgICBAYWN0aXZlSXRlbVxuXG4gICMgQnVpbGQgdGhlIGl0ZW1TdGFjayBhZnRlciBkZXNlcmlhbGl6aW5nXG4gIGFkZEl0ZW1zVG9TdGFjazogKGl0ZW1TdGFja0luZGljZXMpIC0+XG4gICAgaWYgQGl0ZW1zLmxlbmd0aCA+IDBcbiAgICAgIGlmIGl0ZW1TdGFja0luZGljZXMubGVuZ3RoIGlzIDAgb3IgaXRlbVN0YWNrSW5kaWNlcy5sZW5ndGggaXNudCBAaXRlbXMubGVuZ3RoIG9yIGl0ZW1TdGFja0luZGljZXMuaW5kZXhPZigtMSkgPj0gMFxuICAgICAgICBpdGVtU3RhY2tJbmRpY2VzID0gKGkgZm9yIGkgaW4gWzAuLkBpdGVtcy5sZW5ndGgtMV0pXG4gICAgICBmb3IgaXRlbUluZGV4IGluIGl0ZW1TdGFja0luZGljZXNcbiAgICAgICAgQGFkZEl0ZW1Ub1N0YWNrKEBpdGVtc1tpdGVtSW5kZXhdKVxuICAgICAgcmV0dXJuXG5cbiAgIyBBZGQgaXRlbSAob3IgbW92ZSBpdGVtKSB0byB0aGUgZW5kIG9mIHRoZSBpdGVtU3RhY2tcbiAgYWRkSXRlbVRvU3RhY2s6IChuZXdJdGVtKSAtPlxuICAgIHJldHVybiB1bmxlc3MgbmV3SXRlbT9cbiAgICBpbmRleCA9IEBpdGVtU3RhY2suaW5kZXhPZihuZXdJdGVtKVxuICAgIEBpdGVtU3RhY2suc3BsaWNlKGluZGV4LCAxKSB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICBAaXRlbVN0YWNrLnB1c2gobmV3SXRlbSlcblxuICAjIFJldHVybiBhbiB7VGV4dEVkaXRvcn0gaWYgdGhlIHBhbmUgaXRlbSBpcyBhbiB7VGV4dEVkaXRvcn0sIG9yIG51bGwgb3RoZXJ3aXNlLlxuICBnZXRBY3RpdmVFZGl0b3I6IC0+XG4gICAgQGFjdGl2ZUl0ZW0gaWYgQGFjdGl2ZUl0ZW0gaW5zdGFuY2VvZiBUZXh0RWRpdG9yXG5cbiAgIyBQdWJsaWM6IFJldHVybiB0aGUgaXRlbSBhdCB0aGUgZ2l2ZW4gaW5kZXguXG4gICNcbiAgIyAqIGBpbmRleGAge051bWJlcn1cbiAgI1xuICAjIFJldHVybnMgYW4gaXRlbSBvciBgbnVsbGAgaWYgbm8gaXRlbSBleGlzdHMgYXQgdGhlIGdpdmVuIGluZGV4LlxuICBpdGVtQXRJbmRleDogKGluZGV4KSAtPlxuICAgIEBpdGVtc1tpbmRleF1cblxuICAjIE1ha2VzIHRoZSBuZXh0IGl0ZW0gaW4gdGhlIGl0ZW1TdGFjayBhY3RpdmUuXG4gIGFjdGl2YXRlTmV4dFJlY2VudGx5VXNlZEl0ZW06IC0+XG4gICAgaWYgQGl0ZW1zLmxlbmd0aCA+IDFcbiAgICAgIEBpdGVtU3RhY2tJbmRleCA9IEBpdGVtU3RhY2subGVuZ3RoIC0gMSB1bmxlc3MgQGl0ZW1TdGFja0luZGV4P1xuICAgICAgQGl0ZW1TdGFja0luZGV4ID0gQGl0ZW1TdGFjay5sZW5ndGggaWYgQGl0ZW1TdGFja0luZGV4IGlzIDBcbiAgICAgIEBpdGVtU3RhY2tJbmRleCA9IEBpdGVtU3RhY2tJbmRleCAtIDFcbiAgICAgIG5leHRSZWNlbnRseVVzZWRJdGVtID0gQGl0ZW1TdGFja1tAaXRlbVN0YWNrSW5kZXhdXG4gICAgICBAc2V0QWN0aXZlSXRlbShuZXh0UmVjZW50bHlVc2VkSXRlbSwgbW9kaWZ5U3RhY2s6IGZhbHNlKVxuXG4gICMgTWFrZXMgdGhlIHByZXZpb3VzIGl0ZW0gaW4gdGhlIGl0ZW1TdGFjayBhY3RpdmUuXG4gIGFjdGl2YXRlUHJldmlvdXNSZWNlbnRseVVzZWRJdGVtOiAtPlxuICAgIGlmIEBpdGVtcy5sZW5ndGggPiAxXG4gICAgICBpZiBAaXRlbVN0YWNrSW5kZXggKyAxIGlzIEBpdGVtU3RhY2subGVuZ3RoIG9yIG5vdCBAaXRlbVN0YWNrSW5kZXg/XG4gICAgICAgIEBpdGVtU3RhY2tJbmRleCA9IC0xXG4gICAgICBAaXRlbVN0YWNrSW5kZXggPSBAaXRlbVN0YWNrSW5kZXggKyAxXG4gICAgICBwcmV2aW91c1JlY2VudGx5VXNlZEl0ZW0gPSBAaXRlbVN0YWNrW0BpdGVtU3RhY2tJbmRleF1cbiAgICAgIEBzZXRBY3RpdmVJdGVtKHByZXZpb3VzUmVjZW50bHlVc2VkSXRlbSwgbW9kaWZ5U3RhY2s6IGZhbHNlKVxuXG4gICMgTW92ZXMgdGhlIGFjdGl2ZSBpdGVtIHRvIHRoZSBlbmQgb2YgdGhlIGl0ZW1TdGFjayBvbmNlIHRoZSBjdHJsIGtleSBpcyBsaWZ0ZWRcbiAgbW92ZUFjdGl2ZUl0ZW1Ub1RvcE9mU3RhY2s6IC0+XG4gICAgZGVsZXRlIEBpdGVtU3RhY2tJbmRleFxuICAgIEBhZGRJdGVtVG9TdGFjayhAYWN0aXZlSXRlbSlcblxuICAjIFB1YmxpYzogTWFrZXMgdGhlIG5leHQgaXRlbSBhY3RpdmUuXG4gIGFjdGl2YXRlTmV4dEl0ZW06IC0+XG4gICAgaW5kZXggPSBAZ2V0QWN0aXZlSXRlbUluZGV4KClcbiAgICBpZiBpbmRleCA8IEBpdGVtcy5sZW5ndGggLSAxXG4gICAgICBAYWN0aXZhdGVJdGVtQXRJbmRleChpbmRleCArIDEpXG4gICAgZWxzZVxuICAgICAgQGFjdGl2YXRlSXRlbUF0SW5kZXgoMClcblxuICAjIFB1YmxpYzogTWFrZXMgdGhlIHByZXZpb3VzIGl0ZW0gYWN0aXZlLlxuICBhY3RpdmF0ZVByZXZpb3VzSXRlbTogLT5cbiAgICBpbmRleCA9IEBnZXRBY3RpdmVJdGVtSW5kZXgoKVxuICAgIGlmIGluZGV4ID4gMFxuICAgICAgQGFjdGl2YXRlSXRlbUF0SW5kZXgoaW5kZXggLSAxKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0ZUl0ZW1BdEluZGV4KEBpdGVtcy5sZW5ndGggLSAxKVxuXG4gIGFjdGl2YXRlTGFzdEl0ZW06IC0+XG4gICAgQGFjdGl2YXRlSXRlbUF0SW5kZXgoQGl0ZW1zLmxlbmd0aCAtIDEpXG5cbiAgIyBQdWJsaWM6IE1vdmUgdGhlIGFjdGl2ZSB0YWIgdG8gdGhlIHJpZ2h0LlxuICBtb3ZlSXRlbVJpZ2h0OiAtPlxuICAgIGluZGV4ID0gQGdldEFjdGl2ZUl0ZW1JbmRleCgpXG4gICAgcmlnaHRJdGVtSW5kZXggPSBpbmRleCArIDFcbiAgICBAbW92ZUl0ZW0oQGdldEFjdGl2ZUl0ZW0oKSwgcmlnaHRJdGVtSW5kZXgpIHVubGVzcyByaWdodEl0ZW1JbmRleCA+IEBpdGVtcy5sZW5ndGggLSAxXG5cbiAgIyBQdWJsaWM6IE1vdmUgdGhlIGFjdGl2ZSB0YWIgdG8gdGhlIGxlZnRcbiAgbW92ZUl0ZW1MZWZ0OiAtPlxuICAgIGluZGV4ID0gQGdldEFjdGl2ZUl0ZW1JbmRleCgpXG4gICAgbGVmdEl0ZW1JbmRleCA9IGluZGV4IC0gMVxuICAgIEBtb3ZlSXRlbShAZ2V0QWN0aXZlSXRlbSgpLCBsZWZ0SXRlbUluZGV4KSB1bmxlc3MgbGVmdEl0ZW1JbmRleCA8IDBcblxuICAjIFB1YmxpYzogR2V0IHRoZSBpbmRleCBvZiB0aGUgYWN0aXZlIGl0ZW0uXG4gICNcbiAgIyBSZXR1cm5zIGEge051bWJlcn0uXG4gIGdldEFjdGl2ZUl0ZW1JbmRleDogLT5cbiAgICBAaXRlbXMuaW5kZXhPZihAYWN0aXZlSXRlbSlcblxuICAjIFB1YmxpYzogQWN0aXZhdGUgdGhlIGl0ZW0gYXQgdGhlIGdpdmVuIGluZGV4LlxuICAjXG4gICMgKiBgaW5kZXhgIHtOdW1iZXJ9XG4gIGFjdGl2YXRlSXRlbUF0SW5kZXg6IChpbmRleCkgLT5cbiAgICBpdGVtID0gQGl0ZW1BdEluZGV4KGluZGV4KSBvciBAZ2V0QWN0aXZlSXRlbSgpXG4gICAgQHNldEFjdGl2ZUl0ZW0oaXRlbSlcblxuICAjIFB1YmxpYzogTWFrZSB0aGUgZ2l2ZW4gaXRlbSAqYWN0aXZlKiwgY2F1c2luZyBpdCB0byBiZSBkaXNwbGF5ZWQgYnlcbiAgIyB0aGUgcGFuZSdzIHZpZXcuXG4gICNcbiAgIyAqIGBvcHRpb25zYCAob3B0aW9uYWwpIHtPYmplY3R9XG4gICMgICAqIGBwZW5kaW5nYCAob3B0aW9uYWwpIHtCb29sZWFufSBpbmRpY2F0aW5nIHRoYXQgdGhlIGl0ZW0gc2hvdWxkIGJlIGFkZGVkXG4gICMgICAgIGluIGEgcGVuZGluZyBzdGF0ZSBpZiBpdCBkb2VzIG5vdCB5ZXQgZXhpc3QgaW4gdGhlIHBhbmUuIEV4aXN0aW5nIHBlbmRpbmdcbiAgIyAgICAgaXRlbXMgaW4gYSBwYW5lIGFyZSByZXBsYWNlZCB3aXRoIG5ldyBwZW5kaW5nIGl0ZW1zIHdoZW4gdGhleSBhcmUgb3BlbmVkLlxuICBhY3RpdmF0ZUl0ZW06IChpdGVtLCBvcHRpb25zPXt9KSAtPlxuICAgIGlmIGl0ZW0/XG4gICAgICBpZiBAZ2V0UGVuZGluZ0l0ZW0oKSBpcyBAYWN0aXZlSXRlbVxuICAgICAgICBpbmRleCA9IEBnZXRBY3RpdmVJdGVtSW5kZXgoKVxuICAgICAgZWxzZVxuICAgICAgICBpbmRleCA9IEBnZXRBY3RpdmVJdGVtSW5kZXgoKSArIDFcbiAgICAgIEBhZGRJdGVtKGl0ZW0sIGV4dGVuZCh7fSwgb3B0aW9ucywge2luZGV4OiBpbmRleH0pKVxuICAgICAgQHNldEFjdGl2ZUl0ZW0oaXRlbSlcblxuICAjIFB1YmxpYzogQWRkIHRoZSBnaXZlbiBpdGVtIHRvIHRoZSBwYW5lLlxuICAjXG4gICMgKiBgaXRlbWAgVGhlIGl0ZW0gdG8gYWRkLiBJdCBjYW4gYmUgYSBtb2RlbCB3aXRoIGFuIGFzc29jaWF0ZWQgdmlldyBvciBhXG4gICMgICB2aWV3LlxuICAjICogYG9wdGlvbnNgIChvcHRpb25hbCkge09iamVjdH1cbiAgIyAgICogYGluZGV4YCAob3B0aW9uYWwpIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhlIGluZGV4IGF0IHdoaWNoIHRvIGFkZCB0aGUgaXRlbS5cbiAgIyAgICAgSWYgb21pdHRlZCwgdGhlIGl0ZW0gaXMgYWRkZWQgYWZ0ZXIgdGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0uXG4gICMgICAqIGBwZW5kaW5nYCAob3B0aW9uYWwpIHtCb29sZWFufSBpbmRpY2F0aW5nIHRoYXQgdGhlIGl0ZW0gc2hvdWxkIGJlXG4gICMgICAgIGFkZGVkIGluIGEgcGVuZGluZyBzdGF0ZS4gRXhpc3RpbmcgcGVuZGluZyBpdGVtcyBpbiBhIHBhbmUgYXJlIHJlcGxhY2VkIHdpdGhcbiAgIyAgICAgbmV3IHBlbmRpbmcgaXRlbXMgd2hlbiB0aGV5IGFyZSBvcGVuZWQuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSBhZGRlZCBpdGVtLlxuICBhZGRJdGVtOiAoaXRlbSwgb3B0aW9ucz17fSkgLT5cbiAgICAjIEJhY2t3YXJkIGNvbXBhdCB3aXRoIG9sZCBBUEk6XG4gICAgIyAgIGFkZEl0ZW0oaXRlbSwgaW5kZXg9QGdldEFjdGl2ZUl0ZW1JbmRleCgpICsgMSlcbiAgICBpZiB0eXBlb2Ygb3B0aW9ucyBpcyBcIm51bWJlclwiXG4gICAgICBHcmltLmRlcHJlY2F0ZShcIlBhbmU6OmFkZEl0ZW0oaXRlbSwgI3tvcHRpb25zfSkgaXMgZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBQYW5lOjphZGRJdGVtKGl0ZW0sIHtpbmRleDogI3tvcHRpb25zfX0pXCIpXG4gICAgICBvcHRpb25zID0gaW5kZXg6IG9wdGlvbnNcblxuICAgIGluZGV4ID0gb3B0aW9ucy5pbmRleCA/IEBnZXRBY3RpdmVJdGVtSW5kZXgoKSArIDFcbiAgICBtb3ZlZCA9IG9wdGlvbnMubW92ZWQgPyBmYWxzZVxuICAgIHBlbmRpbmcgPSBvcHRpb25zLnBlbmRpbmcgPyBmYWxzZVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUGFuZSBpdGVtcyBtdXN0IGJlIG9iamVjdHMuIEF0dGVtcHRlZCB0byBhZGQgaXRlbSAje2l0ZW19LlwiKSB1bmxlc3MgaXRlbT8gYW5kIHR5cGVvZiBpdGVtIGlzICdvYmplY3QnXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWRkaW5nIGEgcGFuZSBpdGVtIHdpdGggVVJJICcje2l0ZW0uZ2V0VVJJPygpfScgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZFwiKSBpZiBpdGVtLmlzRGVzdHJveWVkPygpXG5cbiAgICByZXR1cm4gaWYgaXRlbSBpbiBAaXRlbXNcblxuICAgIGlmIHR5cGVvZiBpdGVtLm9uRGlkRGVzdHJveSBpcyAnZnVuY3Rpb24nXG4gICAgICBpdGVtU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICBpdGVtU3Vic2NyaXB0aW9ucy5hZGQgaXRlbS5vbkRpZERlc3Ryb3kgPT4gQHJlbW92ZUl0ZW0oaXRlbSwgZmFsc2UpXG4gICAgICBpZiB0eXBlb2YgaXRlbS5vbkRpZFRlcm1pbmF0ZVBlbmRpbmdTdGF0ZSBpcyBcImZ1bmN0aW9uXCJcbiAgICAgICAgaXRlbVN1YnNjcmlwdGlvbnMuYWRkIGl0ZW0ub25EaWRUZXJtaW5hdGVQZW5kaW5nU3RhdGUgPT5cbiAgICAgICAgICBAY2xlYXJQZW5kaW5nSXRlbSgpIGlmIEBnZXRQZW5kaW5nSXRlbSgpIGlzIGl0ZW1cbiAgICAgIEBzdWJzY3JpcHRpb25zUGVySXRlbS5zZXQgaXRlbSwgaXRlbVN1YnNjcmlwdGlvbnNcblxuICAgIEBpdGVtcy5zcGxpY2UoaW5kZXgsIDAsIGl0ZW0pXG4gICAgbGFzdFBlbmRpbmdJdGVtID0gQGdldFBlbmRpbmdJdGVtKClcbiAgICByZXBsYWNpbmdQZW5kaW5nSXRlbSA9IGxhc3RQZW5kaW5nSXRlbT8gYW5kIG5vdCBtb3ZlZFxuICAgIEBwZW5kaW5nSXRlbSA9IG51bGwgaWYgcmVwbGFjaW5nUGVuZGluZ0l0ZW1cbiAgICBAc2V0UGVuZGluZ0l0ZW0oaXRlbSkgaWYgcGVuZGluZ1xuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFkZC1pdGVtJywge2l0ZW0sIGluZGV4LCBtb3ZlZH1cbiAgICBAZGVzdHJveUl0ZW0obGFzdFBlbmRpbmdJdGVtKSBpZiByZXBsYWNpbmdQZW5kaW5nSXRlbVxuICAgIEBzZXRBY3RpdmVJdGVtKGl0ZW0pIHVubGVzcyBAZ2V0QWN0aXZlSXRlbSgpP1xuICAgIGl0ZW1cblxuICBzZXRQZW5kaW5nSXRlbTogKGl0ZW0pID0+XG4gICAgaWYgQHBlbmRpbmdJdGVtIGlzbnQgaXRlbVxuICAgICAgbW9zdFJlY2VudFBlbmRpbmdJdGVtID0gQHBlbmRpbmdJdGVtXG4gICAgICBAcGVuZGluZ0l0ZW0gPSBpdGVtXG4gICAgICBpZiBtb3N0UmVjZW50UGVuZGluZ0l0ZW0/XG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2l0ZW0tZGlkLXRlcm1pbmF0ZS1wZW5kaW5nLXN0YXRlJywgbW9zdFJlY2VudFBlbmRpbmdJdGVtXG5cbiAgZ2V0UGVuZGluZ0l0ZW06ID0+XG4gICAgQHBlbmRpbmdJdGVtIG9yIG51bGxcblxuICBjbGVhclBlbmRpbmdJdGVtOiA9PlxuICAgIEBzZXRQZW5kaW5nSXRlbShudWxsKVxuXG4gIG9uSXRlbURpZFRlcm1pbmF0ZVBlbmRpbmdTdGF0ZTogKGNhbGxiYWNrKSA9PlxuICAgIEBlbWl0dGVyLm9uICdpdGVtLWRpZC10ZXJtaW5hdGUtcGVuZGluZy1zdGF0ZScsIGNhbGxiYWNrXG5cbiAgIyBQdWJsaWM6IEFkZCB0aGUgZ2l2ZW4gaXRlbXMgdG8gdGhlIHBhbmUuXG4gICNcbiAgIyAqIGBpdGVtc2AgQW4ge0FycmF5fSBvZiBpdGVtcyB0byBhZGQuIEl0ZW1zIGNhbiBiZSB2aWV3cyBvciBtb2RlbHMgd2l0aFxuICAjICAgYXNzb2NpYXRlZCB2aWV3cy4gQW55IG9iamVjdHMgdGhhdCBhcmUgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBwYW5lJ3NcbiAgIyAgIGN1cnJlbnQgaXRlbXMgd2lsbCBub3QgYmUgYWRkZWQgYWdhaW4uXG4gICMgKiBgaW5kZXhgIChvcHRpb25hbCkge051bWJlcn0gaW5kZXggYXQgd2hpY2ggdG8gYWRkIHRoZSBpdGVtcy4gSWYgb21pdHRlZCxcbiAgIyAgIHRoZSBpdGVtIGlzICMgICBhZGRlZCBhZnRlciB0aGUgY3VycmVudCBhY3RpdmUgaXRlbS5cbiAgI1xuICAjIFJldHVybnMgYW4ge0FycmF5fSBvZiBhZGRlZCBpdGVtcy5cbiAgYWRkSXRlbXM6IChpdGVtcywgaW5kZXg9QGdldEFjdGl2ZUl0ZW1JbmRleCgpICsgMSkgLT5cbiAgICBpdGVtcyA9IGl0ZW1zLmZpbHRlciAoaXRlbSkgPT4gbm90IChpdGVtIGluIEBpdGVtcylcbiAgICBAYWRkSXRlbShpdGVtLCB7aW5kZXg6IGluZGV4ICsgaX0pIGZvciBpdGVtLCBpIGluIGl0ZW1zXG4gICAgaXRlbXNcblxuICByZW1vdmVJdGVtOiAoaXRlbSwgbW92ZWQpIC0+XG4gICAgaW5kZXggPSBAaXRlbXMuaW5kZXhPZihpdGVtKVxuICAgIHJldHVybiBpZiBpbmRleCBpcyAtMVxuICAgIEBwZW5kaW5nSXRlbSA9IG51bGwgaWYgQGdldFBlbmRpbmdJdGVtKCkgaXMgaXRlbVxuICAgIEByZW1vdmVJdGVtRnJvbVN0YWNrKGl0ZW0pXG4gICAgQGVtaXR0ZXIuZW1pdCAnd2lsbC1yZW1vdmUtaXRlbScsIHtpdGVtLCBpbmRleCwgZGVzdHJveWVkOiBub3QgbW92ZWQsIG1vdmVkfVxuICAgIEB1bnN1YnNjcmliZUZyb21JdGVtKGl0ZW0pXG5cbiAgICBpZiBpdGVtIGlzIEBhY3RpdmVJdGVtXG4gICAgICBpZiBAaXRlbXMubGVuZ3RoIGlzIDFcbiAgICAgICAgQHNldEFjdGl2ZUl0ZW0odW5kZWZpbmVkKVxuICAgICAgZWxzZSBpZiBpbmRleCBpcyAwXG4gICAgICAgIEBhY3RpdmF0ZU5leHRJdGVtKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGFjdGl2YXRlUHJldmlvdXNJdGVtKClcbiAgICBAaXRlbXMuc3BsaWNlKGluZGV4LCAxKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1yZW1vdmUtaXRlbScsIHtpdGVtLCBpbmRleCwgZGVzdHJveWVkOiBub3QgbW92ZWQsIG1vdmVkfVxuICAgIEBjb250YWluZXI/LmRpZERlc3Ryb3lQYW5lSXRlbSh7aXRlbSwgaW5kZXgsIHBhbmU6IHRoaXN9KSB1bmxlc3MgbW92ZWRcbiAgICBAZGVzdHJveSgpIGlmIEBpdGVtcy5sZW5ndGggaXMgMCBhbmQgQGNvbmZpZy5nZXQoJ2NvcmUuZGVzdHJveUVtcHR5UGFuZXMnKVxuXG4gICMgUmVtb3ZlIHRoZSBnaXZlbiBpdGVtIGZyb20gdGhlIGl0ZW1TdGFjay5cbiAgI1xuICAjICogYGl0ZW1gIFRoZSBpdGVtIHRvIHJlbW92ZS5cbiAgIyAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB0aGUgaW5kZXggdG8gd2hpY2ggdG8gcmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIGl0ZW1TdGFjay5cbiAgcmVtb3ZlSXRlbUZyb21TdGFjazogKGl0ZW0pIC0+XG4gICAgaW5kZXggPSBAaXRlbVN0YWNrLmluZGV4T2YoaXRlbSlcbiAgICBAaXRlbVN0YWNrLnNwbGljZShpbmRleCwgMSkgdW5sZXNzIGluZGV4IGlzIC0xXG5cbiAgIyBQdWJsaWM6IE1vdmUgdGhlIGdpdmVuIGl0ZW0gdG8gdGhlIGdpdmVuIGluZGV4LlxuICAjXG4gICMgKiBgaXRlbWAgVGhlIGl0ZW0gdG8gbW92ZS5cbiAgIyAqIGBpbmRleGAge051bWJlcn0gaW5kaWNhdGluZyB0aGUgaW5kZXggdG8gd2hpY2ggdG8gbW92ZSB0aGUgaXRlbS5cbiAgbW92ZUl0ZW06IChpdGVtLCBuZXdJbmRleCkgLT5cbiAgICBvbGRJbmRleCA9IEBpdGVtcy5pbmRleE9mKGl0ZW0pXG4gICAgQGl0ZW1zLnNwbGljZShvbGRJbmRleCwgMSlcbiAgICBAaXRlbXMuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1tb3ZlLWl0ZW0nLCB7aXRlbSwgb2xkSW5kZXgsIG5ld0luZGV4fVxuXG4gICMgUHVibGljOiBNb3ZlIHRoZSBnaXZlbiBpdGVtIHRvIHRoZSBnaXZlbiBpbmRleCBvbiBhbm90aGVyIHBhbmUuXG4gICNcbiAgIyAqIGBpdGVtYCBUaGUgaXRlbSB0byBtb3ZlLlxuICAjICogYHBhbmVgIHtQYW5lfSB0byB3aGljaCB0byBtb3ZlIHRoZSBpdGVtLlxuICAjICogYGluZGV4YCB7TnVtYmVyfSBpbmRpY2F0aW5nIHRoZSBpbmRleCB0byB3aGljaCB0byBtb3ZlIHRoZSBpdGVtIGluIHRoZVxuICAjICAgZ2l2ZW4gcGFuZS5cbiAgbW92ZUl0ZW1Ub1BhbmU6IChpdGVtLCBwYW5lLCBpbmRleCkgLT5cbiAgICBAcmVtb3ZlSXRlbShpdGVtLCB0cnVlKVxuICAgIHBhbmUuYWRkSXRlbShpdGVtLCB7aW5kZXg6IGluZGV4LCBtb3ZlZDogdHJ1ZX0pXG5cbiAgIyBQdWJsaWM6IERlc3Ryb3kgdGhlIGFjdGl2ZSBpdGVtIGFuZCBhY3RpdmF0ZSB0aGUgbmV4dCBpdGVtLlxuICBkZXN0cm95QWN0aXZlSXRlbTogLT5cbiAgICBAZGVzdHJveUl0ZW0oQGFjdGl2ZUl0ZW0pXG4gICAgZmFsc2VcblxuICAjIFB1YmxpYzogRGVzdHJveSB0aGUgZ2l2ZW4gaXRlbS5cbiAgI1xuICAjIElmIHRoZSBpdGVtIGlzIGFjdGl2ZSwgdGhlIG5leHQgaXRlbSB3aWxsIGJlIGFjdGl2YXRlZC4gSWYgdGhlIGl0ZW0gaXMgdGhlXG4gICMgbGFzdCBpdGVtLCB0aGUgcGFuZSB3aWxsIGJlIGRlc3Ryb3llZCBpZiB0aGUgYGNvcmUuZGVzdHJveUVtcHR5UGFuZXNgIGNvbmZpZ1xuICAjIHNldHRpbmcgaXMgYHRydWVgLlxuICAjXG4gICMgKiBgaXRlbWAgSXRlbSB0byBkZXN0cm95XG4gIGRlc3Ryb3lJdGVtOiAoaXRlbSkgLT5cbiAgICBpbmRleCA9IEBpdGVtcy5pbmRleE9mKGl0ZW0pXG4gICAgaWYgaW5kZXggaXNudCAtMVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnd2lsbC1kZXN0cm95LWl0ZW0nLCB7aXRlbSwgaW5kZXh9XG4gICAgICBAY29udGFpbmVyPy53aWxsRGVzdHJveVBhbmVJdGVtKHtpdGVtLCBpbmRleCwgcGFuZTogdGhpc30pXG4gICAgICBpZiBAcHJvbXB0VG9TYXZlSXRlbShpdGVtKVxuICAgICAgICBAcmVtb3ZlSXRlbShpdGVtLCBmYWxzZSlcbiAgICAgICAgaXRlbS5kZXN0cm95PygpXG4gICAgICAgIHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgZmFsc2VcblxuICAjIFB1YmxpYzogRGVzdHJveSBhbGwgaXRlbXMuXG4gIGRlc3Ryb3lJdGVtczogLT5cbiAgICBAZGVzdHJveUl0ZW0oaXRlbSkgZm9yIGl0ZW0gaW4gQGdldEl0ZW1zKClcbiAgICByZXR1cm5cblxuICAjIFB1YmxpYzogRGVzdHJveSBhbGwgaXRlbXMgZXhjZXB0IGZvciB0aGUgYWN0aXZlIGl0ZW0uXG4gIGRlc3Ryb3lJbmFjdGl2ZUl0ZW1zOiAtPlxuICAgIEBkZXN0cm95SXRlbShpdGVtKSBmb3IgaXRlbSBpbiBAZ2V0SXRlbXMoKSB3aGVuIGl0ZW0gaXNudCBAYWN0aXZlSXRlbVxuICAgIHJldHVyblxuXG4gIHByb21wdFRvU2F2ZUl0ZW06IChpdGVtLCBvcHRpb25zPXt9KSAtPlxuICAgIHJldHVybiB0cnVlIHVubGVzcyBpdGVtLnNob3VsZFByb21wdFRvU2F2ZT8ob3B0aW9ucylcblxuICAgIGlmIHR5cGVvZiBpdGVtLmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICB1cmkgPSBpdGVtLmdldFVSSSgpXG4gICAgZWxzZSBpZiB0eXBlb2YgaXRlbS5nZXRVcmkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgdXJpID0gaXRlbS5nZXRVcmkoKVxuICAgIGVsc2VcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBzYXZlRGlhbG9nID0gKHNhdmVCdXR0b25UZXh0LCBzYXZlRm4sIG1lc3NhZ2UpID0+XG4gICAgICBjaG9zZW4gPSBAYXBwbGljYXRpb25EZWxlZ2F0ZS5jb25maXJtXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgZGV0YWlsZWRNZXNzYWdlOiBcIllvdXIgY2hhbmdlcyB3aWxsIGJlIGxvc3QgaWYgeW91IGNsb3NlIHRoaXMgaXRlbSB3aXRob3V0IHNhdmluZy5cIlxuICAgICAgICBidXR0b25zOiBbc2F2ZUJ1dHRvblRleHQsIFwiQ2FuY2VsXCIsIFwiRG9uJ3QgU2F2ZVwiXVxuICAgICAgc3dpdGNoIGNob3NlblxuICAgICAgICB3aGVuIDAgdGhlbiBzYXZlRm4oaXRlbSwgc2F2ZUVycm9yKVxuICAgICAgICB3aGVuIDEgdGhlbiBmYWxzZVxuICAgICAgICB3aGVuIDIgdGhlbiB0cnVlXG5cbiAgICBzYXZlRXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBzYXZlRGlhbG9nKFwiU2F2ZSBhc1wiLCBAc2F2ZUl0ZW1BcywgXCInI3tpdGVtLmdldFRpdGxlPygpID8gdXJpfScgY291bGQgbm90IGJlIHNhdmVkLlxcbkVycm9yOiAje0BnZXRNZXNzYWdlRm9yRXJyb3JDb2RlKGVycm9yLmNvZGUpfVwiKVxuICAgICAgZWxzZVxuICAgICAgICB0cnVlXG5cbiAgICBzYXZlRGlhbG9nKFwiU2F2ZVwiLCBAc2F2ZUl0ZW0sIFwiJyN7aXRlbS5nZXRUaXRsZT8oKSA/IHVyaX0nIGhhcyBjaGFuZ2VzLCBkbyB5b3Ugd2FudCB0byBzYXZlIHRoZW0/XCIpXG5cbiAgIyBQdWJsaWM6IFNhdmUgdGhlIGFjdGl2ZSBpdGVtLlxuICBzYXZlQWN0aXZlSXRlbTogKG5leHRBY3Rpb24pIC0+XG4gICAgQHNhdmVJdGVtKEBnZXRBY3RpdmVJdGVtKCksIG5leHRBY3Rpb24pXG5cbiAgIyBQdWJsaWM6IFByb21wdCB0aGUgdXNlciBmb3IgYSBsb2NhdGlvbiBhbmQgc2F2ZSB0aGUgYWN0aXZlIGl0ZW0gd2l0aCB0aGVcbiAgIyBwYXRoIHRoZXkgc2VsZWN0LlxuICAjXG4gICMgKiBgbmV4dEFjdGlvbmAgKG9wdGlvbmFsKSB7RnVuY3Rpb259IHdoaWNoIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBpdGVtIGlzXG4gICMgICBzdWNjZXNzZnVsbHkgc2F2ZWQuXG4gIHNhdmVBY3RpdmVJdGVtQXM6IChuZXh0QWN0aW9uKSAtPlxuICAgIEBzYXZlSXRlbUFzKEBnZXRBY3RpdmVJdGVtKCksIG5leHRBY3Rpb24pXG5cbiAgIyBQdWJsaWM6IFNhdmUgdGhlIGdpdmVuIGl0ZW0uXG4gICNcbiAgIyAqIGBpdGVtYCBUaGUgaXRlbSB0byBzYXZlLlxuICAjICogYG5leHRBY3Rpb25gIChvcHRpb25hbCkge0Z1bmN0aW9ufSB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aXRoIG5vIGFyZ3VtZW50XG4gICMgICBhZnRlciB0aGUgaXRlbSBpcyBzdWNjZXNzZnVsbHkgc2F2ZWQsIG9yIHdpdGggdGhlIGVycm9yIGlmIGl0IGZhaWxlZC5cbiAgIyAgIFRoZSByZXR1cm4gdmFsdWUgd2lsbCBiZSB0aGF0IG9mIGBuZXh0QWN0aW9uYCBvciBgdW5kZWZpbmVkYCBpZiBpdCB3YXMgbm90XG4gICMgICBwcm92aWRlZFxuICBzYXZlSXRlbTogKGl0ZW0sIG5leHRBY3Rpb24pID0+XG4gICAgaWYgdHlwZW9mIGl0ZW0/LmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICBpdGVtVVJJID0gaXRlbS5nZXRVUkkoKVxuICAgIGVsc2UgaWYgdHlwZW9mIGl0ZW0/LmdldFVyaSBpcyAnZnVuY3Rpb24nXG4gICAgICBpdGVtVVJJID0gaXRlbS5nZXRVcmkoKVxuXG4gICAgaWYgaXRlbVVSST9cbiAgICAgIHRyeVxuICAgICAgICBpdGVtLnNhdmU/KClcbiAgICAgICAgbmV4dEFjdGlvbj8oKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgaWYgbmV4dEFjdGlvblxuICAgICAgICAgIG5leHRBY3Rpb24oZXJyb3IpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaGFuZGxlU2F2ZUVycm9yKGVycm9yLCBpdGVtKVxuICAgIGVsc2VcbiAgICAgIEBzYXZlSXRlbUFzKGl0ZW0sIG5leHRBY3Rpb24pXG5cbiAgIyBQdWJsaWM6IFByb21wdCB0aGUgdXNlciBmb3IgYSBsb2NhdGlvbiBhbmQgc2F2ZSB0aGUgYWN0aXZlIGl0ZW0gd2l0aCB0aGVcbiAgIyBwYXRoIHRoZXkgc2VsZWN0LlxuICAjXG4gICMgKiBgaXRlbWAgVGhlIGl0ZW0gdG8gc2F2ZS5cbiAgIyAqIGBuZXh0QWN0aW9uYCAob3B0aW9uYWwpIHtGdW5jdGlvbn0gd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2l0aCBubyBhcmd1bWVudFxuICAjICAgYWZ0ZXIgdGhlIGl0ZW0gaXMgc3VjY2Vzc2Z1bGx5IHNhdmVkLCBvciB3aXRoIHRoZSBlcnJvciBpZiBpdCBmYWlsZWQuXG4gICMgICBUaGUgcmV0dXJuIHZhbHVlIHdpbGwgYmUgdGhhdCBvZiBgbmV4dEFjdGlvbmAgb3IgYHVuZGVmaW5lZGAgaWYgaXQgd2FzIG5vdFxuICAjICAgcHJvdmlkZWRcbiAgc2F2ZUl0ZW1BczogKGl0ZW0sIG5leHRBY3Rpb24pID0+XG4gICAgcmV0dXJuIHVubGVzcyBpdGVtPy5zYXZlQXM/XG5cbiAgICBzYXZlT3B0aW9ucyA9IGl0ZW0uZ2V0U2F2ZURpYWxvZ09wdGlvbnM/KCkgPyB7fVxuICAgIHNhdmVPcHRpb25zLmRlZmF1bHRQYXRoID89IGl0ZW0uZ2V0UGF0aCgpXG4gICAgbmV3SXRlbVBhdGggPSBAYXBwbGljYXRpb25EZWxlZ2F0ZS5zaG93U2F2ZURpYWxvZyhzYXZlT3B0aW9ucylcbiAgICBpZiBuZXdJdGVtUGF0aFxuICAgICAgdHJ5XG4gICAgICAgIGl0ZW0uc2F2ZUFzKG5ld0l0ZW1QYXRoKVxuICAgICAgICBuZXh0QWN0aW9uPygpXG4gICAgICBjYXRjaCBlcnJvclxuICAgICAgICBpZiBuZXh0QWN0aW9uXG4gICAgICAgICAgbmV4dEFjdGlvbihlcnJvcilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBoYW5kbGVTYXZlRXJyb3IoZXJyb3IsIGl0ZW0pXG5cbiAgIyBQdWJsaWM6IFNhdmUgYWxsIGl0ZW1zLlxuICBzYXZlSXRlbXM6IC0+XG4gICAgZm9yIGl0ZW0gaW4gQGdldEl0ZW1zKClcbiAgICAgIEBzYXZlSXRlbShpdGVtKSBpZiBpdGVtLmlzTW9kaWZpZWQ/KClcbiAgICByZXR1cm5cblxuICAjIFB1YmxpYzogUmV0dXJuIHRoZSBmaXJzdCBpdGVtIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gVVJJIG9yIHVuZGVmaW5lZCBpZlxuICAjIG5vbmUgZXhpc3RzLlxuICAjXG4gICMgKiBgdXJpYCB7U3RyaW5nfSBjb250YWluaW5nIGEgVVJJLlxuICBpdGVtRm9yVVJJOiAodXJpKSAtPlxuICAgIGZpbmQgQGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGlmIHR5cGVvZiBpdGVtLmdldFVSSSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIGl0ZW1VcmkgPSBpdGVtLmdldFVSSSgpXG4gICAgICBlbHNlIGlmIHR5cGVvZiBpdGVtLmdldFVyaSBpcyAnZnVuY3Rpb24nXG4gICAgICAgIGl0ZW1VcmkgPSBpdGVtLmdldFVyaSgpXG5cbiAgICAgIGl0ZW1VcmkgaXMgdXJpXG5cbiAgIyBQdWJsaWM6IEFjdGl2YXRlIHRoZSBmaXJzdCBpdGVtIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gVVJJLlxuICAjXG4gICMgKiBgdXJpYCB7U3RyaW5nfSBjb250YWluaW5nIGEgVVJJLlxuICAjXG4gICMgUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgYW4gaXRlbSBtYXRjaGluZyB0aGUgVVJJIHdhcyBmb3VuZC5cbiAgYWN0aXZhdGVJdGVtRm9yVVJJOiAodXJpKSAtPlxuICAgIGlmIGl0ZW0gPSBAaXRlbUZvclVSSSh1cmkpXG4gICAgICBAYWN0aXZhdGVJdGVtKGl0ZW0pXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBjb3B5QWN0aXZlSXRlbTogLT5cbiAgICBpZiBAYWN0aXZlSXRlbT9cbiAgICAgIEBhY3RpdmVJdGVtLmNvcHk/KCkgPyBAZGVzZXJpYWxpemVyTWFuYWdlci5kZXNlcmlhbGl6ZShAYWN0aXZlSXRlbS5zZXJpYWxpemUoKSlcblxuICAjIyNcbiAgU2VjdGlvbjogTGlmZWN5Y2xlXG4gICMjI1xuXG4gICMgUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGUgcGFuZSBpcyBhY3RpdmUuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LlxuICBpc0FjdGl2ZTogLT5cbiAgICBAY29udGFpbmVyPy5nZXRBY3RpdmVQYW5lKCkgaXMgdGhpc1xuXG4gICMgUHVibGljOiBNYWtlcyB0aGlzIHBhbmUgdGhlICphY3RpdmUqIHBhbmUsIGNhdXNpbmcgaXQgdG8gZ2FpbiBmb2N1cy5cbiAgYWN0aXZhdGU6IC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUGFuZSBoYXMgYmVlbiBkZXN0cm95ZWRcIikgaWYgQGlzRGVzdHJveWVkKClcbiAgICBAY29udGFpbmVyPy5zZXRBY3RpdmVQYW5lKHRoaXMpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWFjdGl2YXRlJ1xuXG4gICMgUHVibGljOiBDbG9zZSB0aGUgcGFuZSBhbmQgZGVzdHJveSBhbGwgaXRzIGl0ZW1zLlxuICAjXG4gICMgSWYgdGhpcyBpcyB0aGUgbGFzdCBwYW5lLCBhbGwgdGhlIGl0ZW1zIHdpbGwgYmUgZGVzdHJveWVkIGJ1dCB0aGUgcGFuZVxuICAjIGl0c2VsZiB3aWxsIG5vdCBiZSBkZXN0cm95ZWQuXG4gIGRlc3Ryb3k6IC0+XG4gICAgaWYgQGNvbnRhaW5lcj8uaXNBbGl2ZSgpIGFuZCBAY29udGFpbmVyLmdldFBhbmVzKCkubGVuZ3RoIGlzIDFcbiAgICAgIEBkZXN0cm95SXRlbXMoKVxuICAgIGVsc2VcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ3dpbGwtZGVzdHJveSdcbiAgICAgIEBjb250YWluZXI/LndpbGxEZXN0cm95UGFuZShwYW5lOiB0aGlzKVxuICAgICAgc3VwZXJcblxuICAjIENhbGxlZCBieSBtb2RlbCBzdXBlcmNsYXNzLlxuICBkZXN0cm95ZWQ6IC0+XG4gICAgQGNvbnRhaW5lci5hY3RpdmF0ZU5leHRQYW5lKCkgaWYgQGlzQWN0aXZlKClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveSdcbiAgICBAZW1pdHRlci5kaXNwb3NlKClcbiAgICBpdGVtLmRlc3Ryb3k/KCkgZm9yIGl0ZW0gaW4gQGl0ZW1zLnNsaWNlKClcbiAgICBAY29udGFpbmVyPy5kaWREZXN0cm95UGFuZShwYW5lOiB0aGlzKVxuXG4gICMjI1xuICBTZWN0aW9uOiBTcGxpdHRpbmdcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IENyZWF0ZSBhIG5ldyBwYW5lIHRvIHRoZSBsZWZ0IG9mIHRoaXMgcGFuZS5cbiAgI1xuICAjICogYHBhcmFtc2AgKG9wdGlvbmFsKSB7T2JqZWN0fSB3aXRoIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgICogYGl0ZW1zYCAob3B0aW9uYWwpIHtBcnJheX0gb2YgaXRlbXMgdG8gYWRkIHRvIHRoZSBuZXcgcGFuZS5cbiAgIyAgICogYGNvcHlBY3RpdmVJdGVtYCAob3B0aW9uYWwpIHtCb29sZWFufSB0cnVlIHdpbGwgY29weSB0aGUgYWN0aXZlIGl0ZW0gaW50byB0aGUgbmV3IHNwbGl0IHBhbmVcbiAgI1xuICAjIFJldHVybnMgdGhlIG5ldyB7UGFuZX0uXG4gIHNwbGl0TGVmdDogKHBhcmFtcykgLT5cbiAgICBAc3BsaXQoJ2hvcml6b250YWwnLCAnYmVmb3JlJywgcGFyYW1zKVxuXG4gICMgUHVibGljOiBDcmVhdGUgYSBuZXcgcGFuZSB0byB0aGUgcmlnaHQgb2YgdGhpcyBwYW5lLlxuICAjXG4gICMgKiBgcGFyYW1zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgaXRlbXNgIChvcHRpb25hbCkge0FycmF5fSBvZiBpdGVtcyB0byBhZGQgdG8gdGhlIG5ldyBwYW5lLlxuICAjICAgKiBgY29weUFjdGl2ZUl0ZW1gIChvcHRpb25hbCkge0Jvb2xlYW59IHRydWUgd2lsbCBjb3B5IHRoZSBhY3RpdmUgaXRlbSBpbnRvIHRoZSBuZXcgc3BsaXQgcGFuZVxuICAjXG4gICMgUmV0dXJucyB0aGUgbmV3IHtQYW5lfS5cbiAgc3BsaXRSaWdodDogKHBhcmFtcykgLT5cbiAgICBAc3BsaXQoJ2hvcml6b250YWwnLCAnYWZ0ZXInLCBwYXJhbXMpXG5cbiAgIyBQdWJsaWM6IENyZWF0ZXMgYSBuZXcgcGFuZSBhYm92ZSB0aGUgcmVjZWl2ZXIuXG4gICNcbiAgIyAqIGBwYXJhbXNgIChvcHRpb25hbCkge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gICMgICAqIGBpdGVtc2AgKG9wdGlvbmFsKSB7QXJyYXl9IG9mIGl0ZW1zIHRvIGFkZCB0byB0aGUgbmV3IHBhbmUuXG4gICMgICAqIGBjb3B5QWN0aXZlSXRlbWAgKG9wdGlvbmFsKSB7Qm9vbGVhbn0gdHJ1ZSB3aWxsIGNvcHkgdGhlIGFjdGl2ZSBpdGVtIGludG8gdGhlIG5ldyBzcGxpdCBwYW5lXG4gICNcbiAgIyBSZXR1cm5zIHRoZSBuZXcge1BhbmV9LlxuICBzcGxpdFVwOiAocGFyYW1zKSAtPlxuICAgIEBzcGxpdCgndmVydGljYWwnLCAnYmVmb3JlJywgcGFyYW1zKVxuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgbmV3IHBhbmUgYmVsb3cgdGhlIHJlY2VpdmVyLlxuICAjXG4gICMgKiBgcGFyYW1zYCAob3B0aW9uYWwpIHtPYmplY3R9IHdpdGggdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgaXRlbXNgIChvcHRpb25hbCkge0FycmF5fSBvZiBpdGVtcyB0byBhZGQgdG8gdGhlIG5ldyBwYW5lLlxuICAjICAgKiBgY29weUFjdGl2ZUl0ZW1gIChvcHRpb25hbCkge0Jvb2xlYW59IHRydWUgd2lsbCBjb3B5IHRoZSBhY3RpdmUgaXRlbSBpbnRvIHRoZSBuZXcgc3BsaXQgcGFuZVxuICAjXG4gICMgUmV0dXJucyB0aGUgbmV3IHtQYW5lfS5cbiAgc3BsaXREb3duOiAocGFyYW1zKSAtPlxuICAgIEBzcGxpdCgndmVydGljYWwnLCAnYWZ0ZXInLCBwYXJhbXMpXG5cbiAgc3BsaXQ6IChvcmllbnRhdGlvbiwgc2lkZSwgcGFyYW1zKSAtPlxuICAgIGlmIHBhcmFtcz8uY29weUFjdGl2ZUl0ZW1cbiAgICAgIHBhcmFtcy5pdGVtcyA/PSBbXVxuICAgICAgcGFyYW1zLml0ZW1zLnB1c2goQGNvcHlBY3RpdmVJdGVtKCkpXG5cbiAgICBpZiBAcGFyZW50Lm9yaWVudGF0aW9uIGlzbnQgb3JpZW50YXRpb25cbiAgICAgIEBwYXJlbnQucmVwbGFjZUNoaWxkKHRoaXMsIG5ldyBQYW5lQXhpcyh7QGNvbnRhaW5lciwgb3JpZW50YXRpb24sIGNoaWxkcmVuOiBbdGhpc10sIEBmbGV4U2NhbGV9KSlcbiAgICAgIEBzZXRGbGV4U2NhbGUoMSlcblxuICAgIG5ld1BhbmUgPSBuZXcgUGFuZShleHRlbmQoe0BhcHBsaWNhdGlvbkRlbGVnYXRlLCBAbm90aWZpY2F0aW9uTWFuYWdlciwgQGRlc2VyaWFsaXplck1hbmFnZXIsIEBjb25maWd9LCBwYXJhbXMpKVxuICAgIHN3aXRjaCBzaWRlXG4gICAgICB3aGVuICdiZWZvcmUnIHRoZW4gQHBhcmVudC5pbnNlcnRDaGlsZEJlZm9yZSh0aGlzLCBuZXdQYW5lKVxuICAgICAgd2hlbiAnYWZ0ZXInIHRoZW4gQHBhcmVudC5pbnNlcnRDaGlsZEFmdGVyKHRoaXMsIG5ld1BhbmUpXG5cbiAgICBAbW92ZUl0ZW1Ub1BhbmUoQGFjdGl2ZUl0ZW0sIG5ld1BhbmUpIGlmIHBhcmFtcz8ubW92ZUFjdGl2ZUl0ZW1cblxuICAgIG5ld1BhbmUuYWN0aXZhdGUoKVxuICAgIG5ld1BhbmVcblxuICAjIElmIHRoZSBwYXJlbnQgaXMgYSBob3Jpem9udGFsIGF4aXMsIHJldHVybnMgaXRzIGZpcnN0IGNoaWxkIGlmIGl0IGlzIGEgcGFuZTtcbiAgIyBvdGhlcndpc2UgcmV0dXJucyB0aGlzIHBhbmUuXG4gIGZpbmRMZWZ0bW9zdFNpYmxpbmc6IC0+XG4gICAgaWYgQHBhcmVudC5vcmllbnRhdGlvbiBpcyAnaG9yaXpvbnRhbCdcbiAgICAgIFtsZWZ0bW9zdFNpYmxpbmddID0gQHBhcmVudC5jaGlsZHJlblxuICAgICAgaWYgbGVmdG1vc3RTaWJsaW5nIGluc3RhbmNlb2YgUGFuZUF4aXNcbiAgICAgICAgdGhpc1xuICAgICAgZWxzZVxuICAgICAgICBsZWZ0bW9zdFNpYmxpbmdcbiAgICBlbHNlXG4gICAgICB0aGlzXG5cbiAgIyBJZiB0aGUgcGFyZW50IGlzIGEgaG9yaXpvbnRhbCBheGlzLCByZXR1cm5zIGl0cyBsYXN0IGNoaWxkIGlmIGl0IGlzIGEgcGFuZTtcbiAgIyBvdGhlcndpc2UgcmV0dXJucyBhIG5ldyBwYW5lIGNyZWF0ZWQgYnkgc3BsaXR0aW5nIHRoaXMgcGFuZSByaWdodHdhcmQuXG4gIGZpbmRPckNyZWF0ZVJpZ2h0bW9zdFNpYmxpbmc6IC0+XG4gICAgaWYgQHBhcmVudC5vcmllbnRhdGlvbiBpcyAnaG9yaXpvbnRhbCdcbiAgICAgIHJpZ2h0bW9zdFNpYmxpbmcgPSBsYXN0KEBwYXJlbnQuY2hpbGRyZW4pXG4gICAgICBpZiByaWdodG1vc3RTaWJsaW5nIGluc3RhbmNlb2YgUGFuZUF4aXNcbiAgICAgICAgQHNwbGl0UmlnaHQoKVxuICAgICAgZWxzZVxuICAgICAgICByaWdodG1vc3RTaWJsaW5nXG4gICAgZWxzZVxuICAgICAgQHNwbGl0UmlnaHQoKVxuXG4gICMgSWYgdGhlIHBhcmVudCBpcyBhIHZlcnRpY2FsIGF4aXMsIHJldHVybnMgaXRzIGZpcnN0IGNoaWxkIGlmIGl0IGlzIGEgcGFuZTtcbiAgIyBvdGhlcndpc2UgcmV0dXJucyB0aGlzIHBhbmUuXG4gIGZpbmRUb3Btb3N0U2libGluZzogLT5cbiAgICBpZiBAcGFyZW50Lm9yaWVudGF0aW9uIGlzICd2ZXJ0aWNhbCdcbiAgICAgIFt0b3Btb3N0U2libGluZ10gPSBAcGFyZW50LmNoaWxkcmVuXG4gICAgICBpZiB0b3Btb3N0U2libGluZyBpbnN0YW5jZW9mIFBhbmVBeGlzXG4gICAgICAgIHRoaXNcbiAgICAgIGVsc2VcbiAgICAgICAgdG9wbW9zdFNpYmxpbmdcbiAgICBlbHNlXG4gICAgICB0aGlzXG5cbiAgIyBJZiB0aGUgcGFyZW50IGlzIGEgdmVydGljYWwgYXhpcywgcmV0dXJucyBpdHMgbGFzdCBjaGlsZCBpZiBpdCBpcyBhIHBhbmU7XG4gICMgb3RoZXJ3aXNlIHJldHVybnMgYSBuZXcgcGFuZSBjcmVhdGVkIGJ5IHNwbGl0dGluZyB0aGlzIHBhbmUgYm90dG9td2FyZC5cbiAgZmluZE9yQ3JlYXRlQm90dG9tbW9zdFNpYmxpbmc6IC0+XG4gICAgaWYgQHBhcmVudC5vcmllbnRhdGlvbiBpcyAndmVydGljYWwnXG4gICAgICBib3R0b21tb3N0U2libGluZyA9IGxhc3QoQHBhcmVudC5jaGlsZHJlbilcbiAgICAgIGlmIGJvdHRvbW1vc3RTaWJsaW5nIGluc3RhbmNlb2YgUGFuZUF4aXNcbiAgICAgICAgQHNwbGl0RG93bigpXG4gICAgICBlbHNlXG4gICAgICAgIGJvdHRvbW1vc3RTaWJsaW5nXG4gICAgZWxzZVxuICAgICAgQHNwbGl0RG93bigpXG5cbiAgY2xvc2U6IC0+XG4gICAgQGRlc3Ryb3koKSBpZiBAY29uZmlybUNsb3NlKClcblxuICBjb25maXJtQ2xvc2U6IC0+XG4gICAgZm9yIGl0ZW0gaW4gQGdldEl0ZW1zKClcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHByb21wdFRvU2F2ZUl0ZW0oaXRlbSlcbiAgICB0cnVlXG5cbiAgaGFuZGxlU2F2ZUVycm9yOiAoZXJyb3IsIGl0ZW0pIC0+XG4gICAgaXRlbVBhdGggPSBlcnJvci5wYXRoID8gaXRlbT8uZ2V0UGF0aD8oKVxuICAgIGFkZFdhcm5pbmdXaXRoUGF0aCA9IChtZXNzYWdlLCBvcHRpb25zKSA9PlxuICAgICAgbWVzc2FnZSA9IFwiI3ttZXNzYWdlfSAnI3tpdGVtUGF0aH0nXCIgaWYgaXRlbVBhdGhcbiAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZFdhcm5pbmcobWVzc2FnZSwgb3B0aW9ucylcblxuICAgIGN1c3RvbU1lc3NhZ2UgPSBAZ2V0TWVzc2FnZUZvckVycm9yQ29kZShlcnJvci5jb2RlKVxuICAgIGlmIGN1c3RvbU1lc3NhZ2U/XG4gICAgICBhZGRXYXJuaW5nV2l0aFBhdGgoXCJVbmFibGUgdG8gc2F2ZSBmaWxlOiAje2N1c3RvbU1lc3NhZ2V9XCIpXG4gICAgZWxzZSBpZiBlcnJvci5jb2RlIGlzICdFSVNESVInIG9yIGVycm9yLm1lc3NhZ2U/LmVuZHNXaXRoPygnaXMgYSBkaXJlY3RvcnknKVxuICAgICAgQG5vdGlmaWNhdGlvbk1hbmFnZXIuYWRkV2FybmluZyhcIlVuYWJsZSB0byBzYXZlIGZpbGU6ICN7ZXJyb3IubWVzc2FnZX1cIilcbiAgICBlbHNlIGlmIGVycm9yLmNvZGUgaW4gWydFUEVSTScsICdFQlVTWScsICdVTktOT1dOJywgJ0VFWElTVCcsICdFTE9PUCcsICdFQUdBSU4nXVxuICAgICAgYWRkV2FybmluZ1dpdGhQYXRoKCdVbmFibGUgdG8gc2F2ZSBmaWxlJywgZGV0YWlsOiBlcnJvci5tZXNzYWdlKVxuICAgIGVsc2UgaWYgZXJyb3JNYXRjaCA9IC9FTk9URElSLCBub3QgYSBkaXJlY3RvcnkgJyhbXiddKyknLy5leGVjKGVycm9yLm1lc3NhZ2UpXG4gICAgICBmaWxlTmFtZSA9IGVycm9yTWF0Y2hbMV1cbiAgICAgIEBub3RpZmljYXRpb25NYW5hZ2VyLmFkZFdhcm5pbmcoXCJVbmFibGUgdG8gc2F2ZSBmaWxlOiBBIGRpcmVjdG9yeSBpbiB0aGUgcGF0aCAnI3tmaWxlTmFtZX0nIGNvdWxkIG5vdCBiZSB3cml0dGVuIHRvXCIpXG4gICAgZWxzZVxuICAgICAgdGhyb3cgZXJyb3JcblxuICBnZXRNZXNzYWdlRm9yRXJyb3JDb2RlOiAoZXJyb3JDb2RlKSAtPlxuICAgIHN3aXRjaCBlcnJvckNvZGVcbiAgICAgIHdoZW4gJ0VBQ0NFUycgdGhlbiAnUGVybWlzc2lvbiBkZW5pZWQnXG4gICAgICB3aGVuICdFQ09OTlJFU0VUJyB0aGVuICdDb25uZWN0aW9uIHJlc2V0J1xuICAgICAgd2hlbiAnRUlOVFInIHRoZW4gJ0ludGVycnVwdGVkIHN5c3RlbSBjYWxsJ1xuICAgICAgd2hlbiAnRUlPJyB0aGVuICdJL08gZXJyb3Igd3JpdGluZyBmaWxlJ1xuICAgICAgd2hlbiAnRU5PU1BDJyB0aGVuICdObyBzcGFjZSBsZWZ0IG9uIGRldmljZSdcbiAgICAgIHdoZW4gJ0VOT1RTVVAnIHRoZW4gJ09wZXJhdGlvbiBub3Qgc3VwcG9ydGVkIG9uIHNvY2tldCdcbiAgICAgIHdoZW4gJ0VOWElPJyB0aGVuICdObyBzdWNoIGRldmljZSBvciBhZGRyZXNzJ1xuICAgICAgd2hlbiAnRVJPRlMnIHRoZW4gJ1JlYWQtb25seSBmaWxlIHN5c3RlbSdcbiAgICAgIHdoZW4gJ0VTUElQRScgdGhlbiAnSW52YWxpZCBzZWVrJ1xuICAgICAgd2hlbiAnRVRJTUVET1VUJyB0aGVuICdDb25uZWN0aW9uIHRpbWVkIG91dCdcbiJdfQ==
