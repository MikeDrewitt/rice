(function() {
  var CompositeDisposable, Emitter, ItemRegistry, Model, Pane, PaneContainer, find, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  find = require('underscore-plus').find;

  ref = require('event-kit'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  Model = require('./model');

  Pane = require('./pane');

  ItemRegistry = require('./item-registry');

  module.exports = PaneContainer = (function(superClass) {
    extend(PaneContainer, superClass);

    PaneContainer.prototype.serializationVersion = 1;

    PaneContainer.prototype.root = null;

    PaneContainer.prototype.stoppedChangingActivePaneItemDelay = 100;

    PaneContainer.prototype.stoppedChangingActivePaneItemTimeout = null;

    function PaneContainer(params) {
      var applicationDelegate, deserializerManager, notificationManager;
      PaneContainer.__super__.constructor.apply(this, arguments);
      this.config = params.config, applicationDelegate = params.applicationDelegate, notificationManager = params.notificationManager, deserializerManager = params.deserializerManager;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.itemRegistry = new ItemRegistry;
      this.setRoot(new Pane({
        container: this,
        config: this.config,
        applicationDelegate: applicationDelegate,
        notificationManager: notificationManager,
        deserializerManager: deserializerManager
      }));
      this.setActivePane(this.getRoot());
      this.monitorActivePaneItem();
      this.monitorPaneItems();
    }

    PaneContainer.prototype.serialize = function(params) {
      var ref1;
      return {
        deserializer: 'PaneContainer',
        version: this.serializationVersion,
        root: (ref1 = this.root) != null ? ref1.serialize() : void 0,
        activePaneId: this.activePane.id
      };
    };

    PaneContainer.prototype.deserialize = function(state, deserializerManager) {
      var activePane;
      if (state.version !== this.serializationVersion) {
        return;
      }
      this.setRoot(deserializerManager.deserialize(state.root));
      activePane = find(this.getRoot().getPanes(), function(pane) {
        return pane.id === state.activePaneId;
      });
      this.setActivePane(activePane != null ? activePane : this.getPanes()[0]);
      if (this.config.get('core.destroyEmptyPanes')) {
        return this.destroyEmptyPanes();
      }
    };

    PaneContainer.prototype.onDidChangeRoot = function(fn) {
      return this.emitter.on('did-change-root', fn);
    };

    PaneContainer.prototype.observeRoot = function(fn) {
      fn(this.getRoot());
      return this.onDidChangeRoot(fn);
    };

    PaneContainer.prototype.onDidAddPane = function(fn) {
      return this.emitter.on('did-add-pane', fn);
    };

    PaneContainer.prototype.observePanes = function(fn) {
      var i, len, pane, ref1;
      ref1 = this.getPanes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        fn(pane);
      }
      return this.onDidAddPane(function(arg) {
        var pane;
        pane = arg.pane;
        return fn(pane);
      });
    };

    PaneContainer.prototype.onDidDestroyPane = function(fn) {
      return this.emitter.on('did-destroy-pane', fn);
    };

    PaneContainer.prototype.onWillDestroyPane = function(fn) {
      return this.emitter.on('will-destroy-pane', fn);
    };

    PaneContainer.prototype.onDidChangeActivePane = function(fn) {
      return this.emitter.on('did-change-active-pane', fn);
    };

    PaneContainer.prototype.observeActivePane = function(fn) {
      fn(this.getActivePane());
      return this.onDidChangeActivePane(fn);
    };

    PaneContainer.prototype.onDidAddPaneItem = function(fn) {
      return this.emitter.on('did-add-pane-item', fn);
    };

    PaneContainer.prototype.observePaneItems = function(fn) {
      var i, item, len, ref1;
      ref1 = this.getPaneItems();
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        fn(item);
      }
      return this.onDidAddPaneItem(function(arg) {
        var item;
        item = arg.item;
        return fn(item);
      });
    };

    PaneContainer.prototype.onDidChangeActivePaneItem = function(fn) {
      return this.emitter.on('did-change-active-pane-item', fn);
    };

    PaneContainer.prototype.onDidStopChangingActivePaneItem = function(fn) {
      return this.emitter.on('did-stop-changing-active-pane-item', fn);
    };

    PaneContainer.prototype.observeActivePaneItem = function(fn) {
      fn(this.getActivePaneItem());
      return this.onDidChangeActivePaneItem(fn);
    };

    PaneContainer.prototype.onWillDestroyPaneItem = function(fn) {
      return this.emitter.on('will-destroy-pane-item', fn);
    };

    PaneContainer.prototype.onDidDestroyPaneItem = function(fn) {
      return this.emitter.on('did-destroy-pane-item', fn);
    };

    PaneContainer.prototype.getRoot = function() {
      return this.root;
    };

    PaneContainer.prototype.setRoot = function(root) {
      this.root = root;
      this.root.setParent(this);
      this.root.setContainer(this);
      this.emitter.emit('did-change-root', this.root);
      if ((this.getActivePane() == null) && this.root instanceof Pane) {
        return this.setActivePane(this.root);
      }
    };

    PaneContainer.prototype.replaceChild = function(oldChild, newChild) {
      if (oldChild !== this.root) {
        throw new Error("Replacing non-existent child");
      }
      return this.setRoot(newChild);
    };

    PaneContainer.prototype.getPanes = function() {
      if (this.alive) {
        return this.getRoot().getPanes();
      } else {
        return [];
      }
    };

    PaneContainer.prototype.getPaneItems = function() {
      return this.getRoot().getItems();
    };

    PaneContainer.prototype.getActivePane = function() {
      return this.activePane;
    };

    PaneContainer.prototype.setActivePane = function(activePane) {
      if (activePane !== this.activePane) {
        if (indexOf.call(this.getPanes(), activePane) < 0) {
          throw new Error("Setting active pane that is not present in pane container");
        }
        this.activePane = activePane;
        this.emitter.emit('did-change-active-pane', this.activePane);
      }
      return this.activePane;
    };

    PaneContainer.prototype.getActivePaneItem = function() {
      return this.getActivePane().getActiveItem();
    };

    PaneContainer.prototype.paneForURI = function(uri) {
      return find(this.getPanes(), function(pane) {
        return pane.itemForURI(uri) != null;
      });
    };

    PaneContainer.prototype.paneForItem = function(item) {
      return find(this.getPanes(), function(pane) {
        return indexOf.call(pane.getItems(), item) >= 0;
      });
    };

    PaneContainer.prototype.saveAll = function() {
      var i, len, pane, ref1;
      ref1 = this.getPanes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        pane.saveItems();
      }
    };

    PaneContainer.prototype.confirmClose = function(options) {
      var allSaved, i, item, j, len, len1, pane, ref1, ref2;
      allSaved = true;
      ref1 = this.getPanes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        ref2 = pane.getItems();
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          item = ref2[j];
          if (!pane.promptToSaveItem(item, options)) {
            allSaved = false;
            break;
          }
        }
      }
      return allSaved;
    };

    PaneContainer.prototype.activateNextPane = function() {
      var currentIndex, nextIndex, panes;
      panes = this.getPanes();
      if (panes.length > 1) {
        currentIndex = panes.indexOf(this.activePane);
        nextIndex = (currentIndex + 1) % panes.length;
        panes[nextIndex].activate();
        return true;
      } else {
        return false;
      }
    };

    PaneContainer.prototype.activatePreviousPane = function() {
      var currentIndex, panes, previousIndex;
      panes = this.getPanes();
      if (panes.length > 1) {
        currentIndex = panes.indexOf(this.activePane);
        previousIndex = currentIndex - 1;
        if (previousIndex < 0) {
          previousIndex = panes.length - 1;
        }
        panes[previousIndex].activate();
        return true;
      } else {
        return false;
      }
    };

    PaneContainer.prototype.moveActiveItemToPane = function(destPane) {
      var item;
      item = this.activePane.getActiveItem();
      this.activePane.moveItemToPane(item, destPane);
      return destPane.setActiveItem(item);
    };

    PaneContainer.prototype.copyActiveItemToPane = function(destPane) {
      var item;
      item = this.activePane.copyActiveItem();
      return destPane.activateItem(item);
    };

    PaneContainer.prototype.destroyEmptyPanes = function() {
      var i, len, pane, ref1;
      ref1 = this.getPanes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        if (pane.items.length === 0) {
          pane.destroy();
        }
      }
    };

    PaneContainer.prototype.willDestroyPaneItem = function(event) {
      return this.emitter.emit('will-destroy-pane-item', event);
    };

    PaneContainer.prototype.didDestroyPaneItem = function(event) {
      return this.emitter.emit('did-destroy-pane-item', event);
    };

    PaneContainer.prototype.didAddPane = function(event) {
      return this.emitter.emit('did-add-pane', event);
    };

    PaneContainer.prototype.willDestroyPane = function(event) {
      return this.emitter.emit('will-destroy-pane', event);
    };

    PaneContainer.prototype.didDestroyPane = function(event) {
      return this.emitter.emit('did-destroy-pane', event);
    };

    PaneContainer.prototype.destroyed = function() {
      var i, len, pane, ref1;
      this.cancelStoppedChangingActivePaneItemTimeout();
      ref1 = this.getRoot().getPanes();
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        pane.destroy();
      }
      this.subscriptions.dispose();
      return this.emitter.dispose();
    };

    PaneContainer.prototype.cancelStoppedChangingActivePaneItemTimeout = function() {
      if (this.stoppedChangingActivePaneItemTimeout != null) {
        return clearTimeout(this.stoppedChangingActivePaneItemTimeout);
      }
    };

    PaneContainer.prototype.monitorActivePaneItem = function() {
      var childSubscription;
      childSubscription = null;
      return this.subscriptions.add(this.observeActivePane((function(_this) {
        return function(activePane) {
          if (childSubscription != null) {
            _this.subscriptions.remove(childSubscription);
            childSubscription.dispose();
          }
          childSubscription = activePane.observeActiveItem(function(activeItem) {
            var stoppedChangingActivePaneItemCallback;
            _this.emitter.emit('did-change-active-pane-item', activeItem);
            _this.cancelStoppedChangingActivePaneItemTimeout();
            stoppedChangingActivePaneItemCallback = function() {
              _this.stoppedChangingActivePaneItemTimeout = null;
              return _this.emitter.emit('did-stop-changing-active-pane-item', activeItem);
            };
            return _this.stoppedChangingActivePaneItemTimeout = setTimeout(stoppedChangingActivePaneItemCallback, _this.stoppedChangingActivePaneItemDelay);
          });
          return _this.subscriptions.add(childSubscription);
        };
      })(this)));
    };

    PaneContainer.prototype.monitorPaneItems = function() {
      return this.subscriptions.add(this.observePanes((function(_this) {
        return function(pane) {
          var i, index, item, len, ref1;
          ref1 = pane.getItems();
          for (index = i = 0, len = ref1.length; i < len; index = ++i) {
            item = ref1[index];
            _this.addedPaneItem(item, pane, index);
          }
          pane.onDidAddItem(function(arg) {
            var index, item, moved;
            item = arg.item, index = arg.index, moved = arg.moved;
            if (!moved) {
              return _this.addedPaneItem(item, pane, index);
            }
          });
          return pane.onDidRemoveItem(function(arg) {
            var item, moved;
            item = arg.item, moved = arg.moved;
            if (!moved) {
              return _this.removedPaneItem(item);
            }
          });
        };
      })(this)));
    };

    PaneContainer.prototype.addedPaneItem = function(item, pane, index) {
      this.itemRegistry.addItem(item);
      return this.emitter.emit('did-add-pane-item', {
        item: item,
        pane: pane,
        index: index
      });
    };

    PaneContainer.prototype.removedPaneItem = function(item) {
      return this.itemRegistry.removeItem(item);
    };

    return PaneContainer;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLWNvbnRhaW5lci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlGQUFBO0lBQUE7Ozs7RUFBQyxPQUFRLE9BQUEsQ0FBUSxpQkFBUjs7RUFDVCxNQUFpQyxPQUFBLENBQVEsV0FBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1YsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUVmLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs0QkFDSixvQkFBQSxHQUFzQjs7NEJBQ3RCLElBQUEsR0FBTTs7NEJBQ04sa0NBQUEsR0FBb0M7OzRCQUNwQyxvQ0FBQSxHQUFzQzs7SUFFekIsdUJBQUMsTUFBRDtBQUNYLFVBQUE7TUFBQSxnREFBQSxTQUFBO01BRUMsSUFBQyxDQUFBLGdCQUFBLE1BQUYsRUFBVSxnREFBVixFQUErQixnREFBL0IsRUFBb0Q7TUFDcEQsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BQ2YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFJO01BRXBCLElBQUMsQ0FBQSxPQUFELENBQWEsSUFBQSxJQUFBLENBQUs7UUFBQyxTQUFBLEVBQVcsSUFBWjtRQUFtQixRQUFELElBQUMsQ0FBQSxNQUFuQjtRQUEyQixxQkFBQSxtQkFBM0I7UUFBZ0QscUJBQUEsbUJBQWhEO1FBQXFFLHFCQUFBLG1CQUFyRTtPQUFMLENBQWI7TUFDQSxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBZjtNQUNBLElBQUMsQ0FBQSxxQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7SUFYVzs7NEJBYWIsU0FBQSxHQUFXLFNBQUMsTUFBRDtBQUNULFVBQUE7YUFBQTtRQUFBLFlBQUEsRUFBYyxlQUFkO1FBQ0EsT0FBQSxFQUFTLElBQUMsQ0FBQSxvQkFEVjtRQUVBLElBQUEsbUNBQVcsQ0FBRSxTQUFQLENBQUEsVUFGTjtRQUdBLFlBQUEsRUFBYyxJQUFDLENBQUEsVUFBVSxDQUFDLEVBSDFCOztJQURTOzs0QkFNWCxXQUFBLEdBQWEsU0FBQyxLQUFELEVBQVEsbUJBQVI7QUFDWCxVQUFBO01BQUEsSUFBYyxLQUFLLENBQUMsT0FBTixLQUFpQixJQUFDLENBQUEsb0JBQWhDO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFtQixDQUFDLFdBQXBCLENBQWdDLEtBQUssQ0FBQyxJQUF0QyxDQUFUO01BQ0EsVUFBQSxHQUFhLElBQUEsQ0FBSyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxRQUFYLENBQUEsQ0FBTCxFQUE0QixTQUFDLElBQUQ7ZUFBVSxJQUFJLENBQUMsRUFBTCxLQUFXLEtBQUssQ0FBQztNQUEzQixDQUE1QjtNQUNiLElBQUMsQ0FBQSxhQUFELHNCQUFlLGFBQWEsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFZLENBQUEsQ0FBQSxDQUF4QztNQUNBLElBQXdCLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixDQUFZLHdCQUFaLENBQXhCO2VBQUEsSUFBQyxDQUFBLGlCQUFELENBQUEsRUFBQTs7SUFMVzs7NEJBT2IsZUFBQSxHQUFpQixTQUFDLEVBQUQ7YUFDZixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxpQkFBWixFQUErQixFQUEvQjtJQURlOzs0QkFHakIsV0FBQSxHQUFhLFNBQUMsRUFBRDtNQUNYLEVBQUEsQ0FBRyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQUg7YUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixFQUFqQjtJQUZXOzs0QkFJYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQ1osSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksY0FBWixFQUE0QixFQUE1QjtJQURZOzs0QkFHZCxZQUFBLEdBQWMsU0FBQyxFQUFEO0FBQ1osVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxFQUFBLENBQUcsSUFBSDtBQUFBO2FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFDLEdBQUQ7QUFBWSxZQUFBO1FBQVYsT0FBRDtlQUFXLEVBQUEsQ0FBRyxJQUFIO01BQVosQ0FBZDtJQUZZOzs0QkFJZCxnQkFBQSxHQUFrQixTQUFDLEVBQUQ7YUFDaEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksa0JBQVosRUFBZ0MsRUFBaEM7SUFEZ0I7OzRCQUdsQixpQkFBQSxHQUFtQixTQUFDLEVBQUQ7YUFDakIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksbUJBQVosRUFBaUMsRUFBakM7SUFEaUI7OzRCQUduQixxQkFBQSxHQUF1QixTQUFDLEVBQUQ7YUFDckIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksd0JBQVosRUFBc0MsRUFBdEM7SUFEcUI7OzRCQUd2QixpQkFBQSxHQUFtQixTQUFDLEVBQUQ7TUFDakIsRUFBQSxDQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBSDthQUNBLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixFQUF2QjtJQUZpQjs7NEJBSW5CLGdCQUFBLEdBQWtCLFNBQUMsRUFBRDthQUNoQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxtQkFBWixFQUFpQyxFQUFqQztJQURnQjs7NEJBR2xCLGdCQUFBLEdBQWtCLFNBQUMsRUFBRDtBQUNoQixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztRQUFBLEVBQUEsQ0FBRyxJQUFIO0FBQUE7YUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsU0FBQyxHQUFEO0FBQVksWUFBQTtRQUFWLE9BQUQ7ZUFBVyxFQUFBLENBQUcsSUFBSDtNQUFaLENBQWxCO0lBRmdCOzs0QkFJbEIseUJBQUEsR0FBMkIsU0FBQyxFQUFEO2FBQ3pCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLDZCQUFaLEVBQTJDLEVBQTNDO0lBRHlCOzs0QkFHM0IsK0JBQUEsR0FBaUMsU0FBQyxFQUFEO2FBQy9CLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG9DQUFaLEVBQWtELEVBQWxEO0lBRCtCOzs0QkFHakMscUJBQUEsR0FBdUIsU0FBQyxFQUFEO01BQ3JCLEVBQUEsQ0FBRyxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFIO2FBQ0EsSUFBQyxDQUFBLHlCQUFELENBQTJCLEVBQTNCO0lBRnFCOzs0QkFJdkIscUJBQUEsR0FBdUIsU0FBQyxFQUFEO2FBQ3JCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLHdCQUFaLEVBQXNDLEVBQXRDO0lBRHFCOzs0QkFHdkIsb0JBQUEsR0FBc0IsU0FBQyxFQUFEO2FBQ3BCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLHVCQUFaLEVBQXFDLEVBQXJDO0lBRG9COzs0QkFHdEIsT0FBQSxHQUFTLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSjs7NEJBRVQsT0FBQSxHQUFTLFNBQUMsSUFBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQWdCLElBQWhCO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFOLENBQW1CLElBQW5CO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsaUJBQWQsRUFBaUMsSUFBQyxDQUFBLElBQWxDO01BQ0EsSUFBTyw4QkFBSixJQUEwQixJQUFDLENBQUEsSUFBRCxZQUFpQixJQUE5QztlQUNFLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBQyxDQUFBLElBQWhCLEVBREY7O0lBSk87OzRCQU9ULFlBQUEsR0FBYyxTQUFDLFFBQUQsRUFBVyxRQUFYO01BQ1osSUFBbUQsUUFBQSxLQUFjLElBQUMsQ0FBQSxJQUFsRTtBQUFBLGNBQVUsSUFBQSxLQUFBLENBQU0sOEJBQU4sRUFBVjs7YUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLFFBQVQ7SUFGWTs7NEJBSWQsUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFHLElBQUMsQ0FBQSxLQUFKO2VBQ0UsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsUUFBWCxDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsR0FIRjs7SUFEUTs7NEJBTVYsWUFBQSxHQUFjLFNBQUE7YUFDWixJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxRQUFYLENBQUE7SUFEWTs7NEJBR2QsYUFBQSxHQUFlLFNBQUE7YUFDYixJQUFDLENBQUE7SUFEWTs7NEJBR2YsYUFBQSxHQUFlLFNBQUMsVUFBRDtNQUNiLElBQUcsVUFBQSxLQUFnQixJQUFDLENBQUEsVUFBcEI7UUFDRSxJQUFPLGFBQWMsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFkLEVBQUEsVUFBQSxLQUFQO0FBQ0UsZ0JBQVUsSUFBQSxLQUFBLENBQU0sMkRBQU4sRUFEWjs7UUFHQSxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsd0JBQWQsRUFBd0MsSUFBQyxDQUFBLFVBQXpDLEVBTEY7O2FBTUEsSUFBQyxDQUFBO0lBUFk7OzRCQVNmLGlCQUFBLEdBQW1CLFNBQUE7YUFDakIsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFnQixDQUFDLGFBQWpCLENBQUE7SUFEaUI7OzRCQUduQixVQUFBLEdBQVksU0FBQyxHQUFEO2FBQ1YsSUFBQSxDQUFLLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBTCxFQUFrQixTQUFDLElBQUQ7ZUFBVTtNQUFWLENBQWxCO0lBRFU7OzRCQUdaLFdBQUEsR0FBYSxTQUFDLElBQUQ7YUFDWCxJQUFBLENBQUssSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFMLEVBQWtCLFNBQUMsSUFBRDtlQUFVLGFBQVEsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFSLEVBQUEsSUFBQTtNQUFWLENBQWxCO0lBRFc7OzRCQUdiLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxJQUFJLENBQUMsU0FBTCxDQUFBO0FBQUE7SUFETzs7NEJBSVQsWUFBQSxHQUFjLFNBQUMsT0FBRDtBQUNaLFVBQUE7TUFBQSxRQUFBLEdBQVc7QUFFWDtBQUFBLFdBQUEsc0NBQUE7O0FBQ0U7QUFBQSxhQUFBLHdDQUFBOztVQUNFLElBQUEsQ0FBTyxJQUFJLENBQUMsZ0JBQUwsQ0FBc0IsSUFBdEIsRUFBNEIsT0FBNUIsQ0FBUDtZQUNFLFFBQUEsR0FBVztBQUNYLGtCQUZGOztBQURGO0FBREY7YUFNQTtJQVRZOzs0QkFXZCxnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBQTtNQUNSLElBQUcsS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUFsQjtRQUNFLFlBQUEsR0FBZSxLQUFLLENBQUMsT0FBTixDQUFjLElBQUMsQ0FBQSxVQUFmO1FBQ2YsU0FBQSxHQUFZLENBQUMsWUFBQSxHQUFlLENBQWhCLENBQUEsR0FBcUIsS0FBSyxDQUFDO1FBQ3ZDLEtBQU0sQ0FBQSxTQUFBLENBQVUsQ0FBQyxRQUFqQixDQUFBO2VBQ0EsS0FKRjtPQUFBLE1BQUE7ZUFNRSxNQU5GOztJQUZnQjs7NEJBVWxCLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFBO01BQ1IsSUFBRyxLQUFLLENBQUMsTUFBTixHQUFlLENBQWxCO1FBQ0UsWUFBQSxHQUFlLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBQyxDQUFBLFVBQWY7UUFDZixhQUFBLEdBQWdCLFlBQUEsR0FBZTtRQUMvQixJQUFvQyxhQUFBLEdBQWdCLENBQXBEO1VBQUEsYUFBQSxHQUFnQixLQUFLLENBQUMsTUFBTixHQUFlLEVBQS9COztRQUNBLEtBQU0sQ0FBQSxhQUFBLENBQWMsQ0FBQyxRQUFyQixDQUFBO2VBQ0EsS0FMRjtPQUFBLE1BQUE7ZUFPRSxNQVBGOztJQUZvQjs7NEJBV3RCLG9CQUFBLEdBQXNCLFNBQUMsUUFBRDtBQUNwQixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxVQUFVLENBQUMsYUFBWixDQUFBO01BQ1AsSUFBQyxDQUFBLFVBQVUsQ0FBQyxjQUFaLENBQTJCLElBQTNCLEVBQWlDLFFBQWpDO2FBQ0EsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsSUFBdkI7SUFIb0I7OzRCQUt0QixvQkFBQSxHQUFzQixTQUFDLFFBQUQ7QUFDcEIsVUFBQTtNQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsVUFBVSxDQUFDLGNBQVosQ0FBQTthQUNQLFFBQVEsQ0FBQyxZQUFULENBQXNCLElBQXRCO0lBRm9COzs0QkFJdEIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztZQUE0QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQVgsS0FBcUI7VUFBakUsSUFBSSxDQUFDLE9BQUwsQ0FBQTs7QUFBQTtJQURpQjs7NEJBSW5CLG1CQUFBLEdBQXFCLFNBQUMsS0FBRDthQUNuQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyx3QkFBZCxFQUF3QyxLQUF4QztJQURtQjs7NEJBR3JCLGtCQUFBLEdBQW9CLFNBQUMsS0FBRDthQUNsQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyx1QkFBZCxFQUF1QyxLQUF2QztJQURrQjs7NEJBR3BCLFVBQUEsR0FBWSxTQUFDLEtBQUQ7YUFDVixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxjQUFkLEVBQThCLEtBQTlCO0lBRFU7OzRCQUdaLGVBQUEsR0FBaUIsU0FBQyxLQUFEO2FBQ2YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsbUJBQWQsRUFBbUMsS0FBbkM7SUFEZTs7NEJBR2pCLGNBQUEsR0FBZ0IsU0FBQyxLQUFEO2FBQ2QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsa0JBQWQsRUFBa0MsS0FBbEM7SUFEYzs7NEJBSWhCLFNBQUEsR0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLElBQUMsQ0FBQSwwQ0FBRCxDQUFBO0FBQ0E7QUFBQSxXQUFBLHNDQUFBOztRQUFBLElBQUksQ0FBQyxPQUFMLENBQUE7QUFBQTtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO2FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQUE7SUFKUzs7NEJBTVgsMENBQUEsR0FBNEMsU0FBQTtNQUMxQyxJQUFHLGlEQUFIO2VBQ0UsWUFBQSxDQUFhLElBQUMsQ0FBQSxvQ0FBZCxFQURGOztJQUQwQzs7NEJBSTVDLHFCQUFBLEdBQXVCLFNBQUE7QUFDckIsVUFBQTtNQUFBLGlCQUFBLEdBQW9CO2FBRXBCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFVBQUQ7VUFDcEMsSUFBRyx5QkFBSDtZQUNFLEtBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixDQUFzQixpQkFBdEI7WUFDQSxpQkFBaUIsQ0FBQyxPQUFsQixDQUFBLEVBRkY7O1VBSUEsaUJBQUEsR0FBb0IsVUFBVSxDQUFDLGlCQUFYLENBQTZCLFNBQUMsVUFBRDtBQUMvQyxnQkFBQTtZQUFBLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLDZCQUFkLEVBQTZDLFVBQTdDO1lBQ0EsS0FBQyxDQUFBLDBDQUFELENBQUE7WUFDQSxxQ0FBQSxHQUF3QyxTQUFBO2NBQ3RDLEtBQUMsQ0FBQSxvQ0FBRCxHQUF3QztxQkFDeEMsS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0NBQWQsRUFBb0QsVUFBcEQ7WUFGc0M7bUJBR3hDLEtBQUMsQ0FBQSxvQ0FBRCxHQUNFLFVBQUEsQ0FDRSxxQ0FERixFQUVFLEtBQUMsQ0FBQSxrQ0FGSDtVQVA2QyxDQUE3QjtpQkFXcEIsS0FBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLGlCQUFuQjtRQWhCb0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQW5CLENBQW5CO0lBSHFCOzs0QkFxQnZCLGdCQUFBLEdBQWtCLFNBQUE7YUFDaEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLElBQUQ7QUFDL0IsY0FBQTtBQUFBO0FBQUEsZUFBQSxzREFBQTs7WUFDRSxLQUFDLENBQUEsYUFBRCxDQUFlLElBQWYsRUFBcUIsSUFBckIsRUFBMkIsS0FBM0I7QUFERjtVQUdBLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQUMsR0FBRDtBQUNoQixnQkFBQTtZQURrQixpQkFBTSxtQkFBTztZQUMvQixJQUFBLENBQXlDLEtBQXpDO3FCQUFBLEtBQUMsQ0FBQSxhQUFELENBQWUsSUFBZixFQUFxQixJQUFyQixFQUEyQixLQUEzQixFQUFBOztVQURnQixDQUFsQjtpQkFHQSxJQUFJLENBQUMsZUFBTCxDQUFxQixTQUFDLEdBQUQ7QUFDbkIsZ0JBQUE7WUFEcUIsaUJBQU07WUFDM0IsSUFBQSxDQUE4QixLQUE5QjtxQkFBQSxLQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixFQUFBOztVQURtQixDQUFyQjtRQVArQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZCxDQUFuQjtJQURnQjs7NEJBV2xCLGFBQUEsR0FBZSxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsS0FBYjtNQUNiLElBQUMsQ0FBQSxZQUFZLENBQUMsT0FBZCxDQUFzQixJQUF0QjthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkLEVBQW1DO1FBQUMsTUFBQSxJQUFEO1FBQU8sTUFBQSxJQUFQO1FBQWEsT0FBQSxLQUFiO09BQW5DO0lBRmE7OzRCQUlmLGVBQUEsR0FBaUIsU0FBQyxJQUFEO2FBQ2YsSUFBQyxDQUFBLFlBQVksQ0FBQyxVQUFkLENBQXlCLElBQXpCO0lBRGU7Ozs7S0E1T1M7QUFQNUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7ZmluZH0gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5QYW5lID0gcmVxdWlyZSAnLi9wYW5lJ1xuSXRlbVJlZ2lzdHJ5ID0gcmVxdWlyZSAnLi9pdGVtLXJlZ2lzdHJ5J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQYW5lQ29udGFpbmVyIGV4dGVuZHMgTW9kZWxcbiAgc2VyaWFsaXphdGlvblZlcnNpb246IDFcbiAgcm9vdDogbnVsbFxuICBzdG9wcGVkQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbURlbGF5OiAxMDBcbiAgc3RvcHBlZENoYW5naW5nQWN0aXZlUGFuZUl0ZW1UaW1lb3V0OiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChwYXJhbXMpIC0+XG4gICAgc3VwZXJcblxuICAgIHtAY29uZmlnLCBhcHBsaWNhdGlvbkRlbGVnYXRlLCBub3RpZmljYXRpb25NYW5hZ2VyLCBkZXNlcmlhbGl6ZXJNYW5hZ2VyfSA9IHBhcmFtc1xuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGl0ZW1SZWdpc3RyeSA9IG5ldyBJdGVtUmVnaXN0cnlcblxuICAgIEBzZXRSb290KG5ldyBQYW5lKHtjb250YWluZXI6IHRoaXMsIEBjb25maWcsIGFwcGxpY2F0aW9uRGVsZWdhdGUsIG5vdGlmaWNhdGlvbk1hbmFnZXIsIGRlc2VyaWFsaXplck1hbmFnZXJ9KSlcbiAgICBAc2V0QWN0aXZlUGFuZShAZ2V0Um9vdCgpKVxuICAgIEBtb25pdG9yQWN0aXZlUGFuZUl0ZW0oKVxuICAgIEBtb25pdG9yUGFuZUl0ZW1zKClcblxuICBzZXJpYWxpemU6IChwYXJhbXMpIC0+XG4gICAgZGVzZXJpYWxpemVyOiAnUGFuZUNvbnRhaW5lcidcbiAgICB2ZXJzaW9uOiBAc2VyaWFsaXphdGlvblZlcnNpb25cbiAgICByb290OiBAcm9vdD8uc2VyaWFsaXplKClcbiAgICBhY3RpdmVQYW5lSWQ6IEBhY3RpdmVQYW5lLmlkXG5cbiAgZGVzZXJpYWxpemU6IChzdGF0ZSwgZGVzZXJpYWxpemVyTWFuYWdlcikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHN0YXRlLnZlcnNpb24gaXMgQHNlcmlhbGl6YXRpb25WZXJzaW9uXG4gICAgQHNldFJvb3QoZGVzZXJpYWxpemVyTWFuYWdlci5kZXNlcmlhbGl6ZShzdGF0ZS5yb290KSlcbiAgICBhY3RpdmVQYW5lID0gZmluZCBAZ2V0Um9vdCgpLmdldFBhbmVzKCksIChwYW5lKSAtPiBwYW5lLmlkIGlzIHN0YXRlLmFjdGl2ZVBhbmVJZFxuICAgIEBzZXRBY3RpdmVQYW5lKGFjdGl2ZVBhbmUgPyBAZ2V0UGFuZXMoKVswXSlcbiAgICBAZGVzdHJveUVtcHR5UGFuZXMoKSBpZiBAY29uZmlnLmdldCgnY29yZS5kZXN0cm95RW1wdHlQYW5lcycpXG5cbiAgb25EaWRDaGFuZ2VSb290OiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2Utcm9vdCcsIGZuXG5cbiAgb2JzZXJ2ZVJvb3Q6IChmbikgLT5cbiAgICBmbihAZ2V0Um9vdCgpKVxuICAgIEBvbkRpZENoYW5nZVJvb3QoZm4pXG5cbiAgb25EaWRBZGRQYW5lOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1hZGQtcGFuZScsIGZuXG5cbiAgb2JzZXJ2ZVBhbmVzOiAoZm4pIC0+XG4gICAgZm4ocGFuZSkgZm9yIHBhbmUgaW4gQGdldFBhbmVzKClcbiAgICBAb25EaWRBZGRQYW5lICh7cGFuZX0pIC0+IGZuKHBhbmUpXG5cbiAgb25EaWREZXN0cm95UGFuZTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveS1wYW5lJywgZm5cblxuICBvbldpbGxEZXN0cm95UGFuZTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICd3aWxsLWRlc3Ryb3ktcGFuZScsIGZuXG5cbiAgb25EaWRDaGFuZ2VBY3RpdmVQYW5lOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtYWN0aXZlLXBhbmUnLCBmblxuXG4gIG9ic2VydmVBY3RpdmVQYW5lOiAoZm4pIC0+XG4gICAgZm4oQGdldEFjdGl2ZVBhbmUoKSlcbiAgICBAb25EaWRDaGFuZ2VBY3RpdmVQYW5lKGZuKVxuXG4gIG9uRGlkQWRkUGFuZUl0ZW06IChmbikgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWFkZC1wYW5lLWl0ZW0nLCBmblxuXG4gIG9ic2VydmVQYW5lSXRlbXM6IChmbikgLT5cbiAgICBmbihpdGVtKSBmb3IgaXRlbSBpbiBAZ2V0UGFuZUl0ZW1zKClcbiAgICBAb25EaWRBZGRQYW5lSXRlbSAoe2l0ZW19KSAtPiBmbihpdGVtKVxuXG4gIG9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW06IChmbikgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1hY3RpdmUtcGFuZS1pdGVtJywgZm5cblxuICBvbkRpZFN0b3BDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1zdG9wLWNoYW5naW5nLWFjdGl2ZS1wYW5lLWl0ZW0nLCBmblxuXG4gIG9ic2VydmVBY3RpdmVQYW5lSXRlbTogKGZuKSAtPlxuICAgIGZuKEBnZXRBY3RpdmVQYW5lSXRlbSgpKVxuICAgIEBvbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtKGZuKVxuXG4gIG9uV2lsbERlc3Ryb3lQYW5lSXRlbTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICd3aWxsLWRlc3Ryb3ktcGFuZS1pdGVtJywgZm5cblxuICBvbkRpZERlc3Ryb3lQYW5lSXRlbTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveS1wYW5lLWl0ZW0nLCBmblxuXG4gIGdldFJvb3Q6IC0+IEByb290XG5cbiAgc2V0Um9vdDogKEByb290KSAtPlxuICAgIEByb290LnNldFBhcmVudCh0aGlzKVxuICAgIEByb290LnNldENvbnRhaW5lcih0aGlzKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2Utcm9vdCcsIEByb290XG4gICAgaWYgbm90IEBnZXRBY3RpdmVQYW5lKCk/IGFuZCBAcm9vdCBpbnN0YW5jZW9mIFBhbmVcbiAgICAgIEBzZXRBY3RpdmVQYW5lKEByb290KVxuXG4gIHJlcGxhY2VDaGlsZDogKG9sZENoaWxkLCBuZXdDaGlsZCkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBsYWNpbmcgbm9uLWV4aXN0ZW50IGNoaWxkXCIpIGlmIG9sZENoaWxkIGlzbnQgQHJvb3RcbiAgICBAc2V0Um9vdChuZXdDaGlsZClcblxuICBnZXRQYW5lczogLT5cbiAgICBpZiBAYWxpdmVcbiAgICAgIEBnZXRSb290KCkuZ2V0UGFuZXMoKVxuICAgIGVsc2VcbiAgICAgIFtdXG5cbiAgZ2V0UGFuZUl0ZW1zOiAtPlxuICAgIEBnZXRSb290KCkuZ2V0SXRlbXMoKVxuXG4gIGdldEFjdGl2ZVBhbmU6IC0+XG4gICAgQGFjdGl2ZVBhbmVcblxuICBzZXRBY3RpdmVQYW5lOiAoYWN0aXZlUGFuZSkgLT5cbiAgICBpZiBhY3RpdmVQYW5lIGlzbnQgQGFjdGl2ZVBhbmVcbiAgICAgIHVubGVzcyBhY3RpdmVQYW5lIGluIEBnZXRQYW5lcygpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldHRpbmcgYWN0aXZlIHBhbmUgdGhhdCBpcyBub3QgcHJlc2VudCBpbiBwYW5lIGNvbnRhaW5lclwiKVxuXG4gICAgICBAYWN0aXZlUGFuZSA9IGFjdGl2ZVBhbmVcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtYWN0aXZlLXBhbmUnLCBAYWN0aXZlUGFuZVxuICAgIEBhY3RpdmVQYW5lXG5cbiAgZ2V0QWN0aXZlUGFuZUl0ZW06IC0+XG4gICAgQGdldEFjdGl2ZVBhbmUoKS5nZXRBY3RpdmVJdGVtKClcblxuICBwYW5lRm9yVVJJOiAodXJpKSAtPlxuICAgIGZpbmQgQGdldFBhbmVzKCksIChwYW5lKSAtPiBwYW5lLml0ZW1Gb3JVUkkodXJpKT9cblxuICBwYW5lRm9ySXRlbTogKGl0ZW0pIC0+XG4gICAgZmluZCBAZ2V0UGFuZXMoKSwgKHBhbmUpIC0+IGl0ZW0gaW4gcGFuZS5nZXRJdGVtcygpXG5cbiAgc2F2ZUFsbDogLT5cbiAgICBwYW5lLnNhdmVJdGVtcygpIGZvciBwYW5lIGluIEBnZXRQYW5lcygpXG4gICAgcmV0dXJuXG5cbiAgY29uZmlybUNsb3NlOiAob3B0aW9ucykgLT5cbiAgICBhbGxTYXZlZCA9IHRydWVcblxuICAgIGZvciBwYW5lIGluIEBnZXRQYW5lcygpXG4gICAgICBmb3IgaXRlbSBpbiBwYW5lLmdldEl0ZW1zKClcbiAgICAgICAgdW5sZXNzIHBhbmUucHJvbXB0VG9TYXZlSXRlbShpdGVtLCBvcHRpb25zKVxuICAgICAgICAgIGFsbFNhdmVkID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuXG4gICAgYWxsU2F2ZWRcblxuICBhY3RpdmF0ZU5leHRQYW5lOiAtPlxuICAgIHBhbmVzID0gQGdldFBhbmVzKClcbiAgICBpZiBwYW5lcy5sZW5ndGggPiAxXG4gICAgICBjdXJyZW50SW5kZXggPSBwYW5lcy5pbmRleE9mKEBhY3RpdmVQYW5lKVxuICAgICAgbmV4dEluZGV4ID0gKGN1cnJlbnRJbmRleCArIDEpICUgcGFuZXMubGVuZ3RoXG4gICAgICBwYW5lc1tuZXh0SW5kZXhdLmFjdGl2YXRlKClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGFjdGl2YXRlUHJldmlvdXNQYW5lOiAtPlxuICAgIHBhbmVzID0gQGdldFBhbmVzKClcbiAgICBpZiBwYW5lcy5sZW5ndGggPiAxXG4gICAgICBjdXJyZW50SW5kZXggPSBwYW5lcy5pbmRleE9mKEBhY3RpdmVQYW5lKVxuICAgICAgcHJldmlvdXNJbmRleCA9IGN1cnJlbnRJbmRleCAtIDFcbiAgICAgIHByZXZpb3VzSW5kZXggPSBwYW5lcy5sZW5ndGggLSAxIGlmIHByZXZpb3VzSW5kZXggPCAwXG4gICAgICBwYW5lc1twcmV2aW91c0luZGV4XS5hY3RpdmF0ZSgpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuICBtb3ZlQWN0aXZlSXRlbVRvUGFuZTogKGRlc3RQYW5lKSAtPlxuICAgIGl0ZW0gPSBAYWN0aXZlUGFuZS5nZXRBY3RpdmVJdGVtKClcbiAgICBAYWN0aXZlUGFuZS5tb3ZlSXRlbVRvUGFuZShpdGVtLCBkZXN0UGFuZSlcbiAgICBkZXN0UGFuZS5zZXRBY3RpdmVJdGVtKGl0ZW0pXG5cbiAgY29weUFjdGl2ZUl0ZW1Ub1BhbmU6IChkZXN0UGFuZSkgLT5cbiAgICBpdGVtID0gQGFjdGl2ZVBhbmUuY29weUFjdGl2ZUl0ZW0oKVxuICAgIGRlc3RQYW5lLmFjdGl2YXRlSXRlbShpdGVtKVxuXG4gIGRlc3Ryb3lFbXB0eVBhbmVzOiAtPlxuICAgIHBhbmUuZGVzdHJveSgpIGZvciBwYW5lIGluIEBnZXRQYW5lcygpIHdoZW4gcGFuZS5pdGVtcy5sZW5ndGggaXMgMFxuICAgIHJldHVyblxuXG4gIHdpbGxEZXN0cm95UGFuZUl0ZW06IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0ICd3aWxsLWRlc3Ryb3ktcGFuZS1pdGVtJywgZXZlbnRcblxuICBkaWREZXN0cm95UGFuZUl0ZW06IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGVzdHJveS1wYW5lLWl0ZW0nLCBldmVudFxuXG4gIGRpZEFkZFBhbmU6IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLXBhbmUnLCBldmVudFxuXG4gIHdpbGxEZXN0cm95UGFuZTogKGV2ZW50KSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgJ3dpbGwtZGVzdHJveS1wYW5lJywgZXZlbnRcblxuICBkaWREZXN0cm95UGFuZTogKGV2ZW50KSAtPlxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95LXBhbmUnLCBldmVudFxuXG4gICMgQ2FsbGVkIGJ5IE1vZGVsIHN1cGVyY2xhc3Mgd2hlbiBkZXN0cm95ZWRcbiAgZGVzdHJveWVkOiAtPlxuICAgIEBjYW5jZWxTdG9wcGVkQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbVRpbWVvdXQoKVxuICAgIHBhbmUuZGVzdHJveSgpIGZvciBwYW5lIGluIEBnZXRSb290KCkuZ2V0UGFuZXMoKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyLmRpc3Bvc2UoKVxuXG4gIGNhbmNlbFN0b3BwZWRDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtVGltZW91dDogLT5cbiAgICBpZiBAc3RvcHBlZENoYW5naW5nQWN0aXZlUGFuZUl0ZW1UaW1lb3V0P1xuICAgICAgY2xlYXJUaW1lb3V0KEBzdG9wcGVkQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbVRpbWVvdXQpXG5cbiAgbW9uaXRvckFjdGl2ZVBhbmVJdGVtOiAtPlxuICAgIGNoaWxkU3Vic2NyaXB0aW9uID0gbnVsbFxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBvYnNlcnZlQWN0aXZlUGFuZSAoYWN0aXZlUGFuZSkgPT5cbiAgICAgIGlmIGNoaWxkU3Vic2NyaXB0aW9uP1xuICAgICAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUoY2hpbGRTdWJzY3JpcHRpb24pXG4gICAgICAgIGNoaWxkU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuXG4gICAgICBjaGlsZFN1YnNjcmlwdGlvbiA9IGFjdGl2ZVBhbmUub2JzZXJ2ZUFjdGl2ZUl0ZW0gKGFjdGl2ZUl0ZW0pID0+XG4gICAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtYWN0aXZlLXBhbmUtaXRlbScsIGFjdGl2ZUl0ZW1cbiAgICAgICAgQGNhbmNlbFN0b3BwZWRDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtVGltZW91dCgpXG4gICAgICAgIHN0b3BwZWRDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtQ2FsbGJhY2sgPSA9PlxuICAgICAgICAgIEBzdG9wcGVkQ2hhbmdpbmdBY3RpdmVQYW5lSXRlbVRpbWVvdXQgPSBudWxsXG4gICAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXN0b3AtY2hhbmdpbmctYWN0aXZlLXBhbmUtaXRlbScsIGFjdGl2ZUl0ZW1cbiAgICAgICAgQHN0b3BwZWRDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtVGltZW91dCA9XG4gICAgICAgICAgc2V0VGltZW91dChcbiAgICAgICAgICAgIHN0b3BwZWRDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtQ2FsbGJhY2ssXG4gICAgICAgICAgICBAc3RvcHBlZENoYW5naW5nQWN0aXZlUGFuZUl0ZW1EZWxheSlcblxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKGNoaWxkU3Vic2NyaXB0aW9uKVxuXG4gIG1vbml0b3JQYW5lSXRlbXM6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBvYnNlcnZlUGFuZXMgKHBhbmUpID0+XG4gICAgICBmb3IgaXRlbSwgaW5kZXggaW4gcGFuZS5nZXRJdGVtcygpXG4gICAgICAgIEBhZGRlZFBhbmVJdGVtKGl0ZW0sIHBhbmUsIGluZGV4KVxuXG4gICAgICBwYW5lLm9uRGlkQWRkSXRlbSAoe2l0ZW0sIGluZGV4LCBtb3ZlZH0pID0+XG4gICAgICAgIEBhZGRlZFBhbmVJdGVtKGl0ZW0sIHBhbmUsIGluZGV4KSB1bmxlc3MgbW92ZWRcblxuICAgICAgcGFuZS5vbkRpZFJlbW92ZUl0ZW0gKHtpdGVtLCBtb3ZlZH0pID0+XG4gICAgICAgIEByZW1vdmVkUGFuZUl0ZW0oaXRlbSkgdW5sZXNzIG1vdmVkXG5cbiAgYWRkZWRQYW5lSXRlbTogKGl0ZW0sIHBhbmUsIGluZGV4KSAtPlxuICAgIEBpdGVtUmVnaXN0cnkuYWRkSXRlbShpdGVtKVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1hZGQtcGFuZS1pdGVtJywge2l0ZW0sIHBhbmUsIGluZGV4fVxuXG4gIHJlbW92ZWRQYW5lSXRlbTogKGl0ZW0pIC0+XG4gICAgQGl0ZW1SZWdpc3RyeS5yZW1vdmVJdGVtKGl0ZW0pXG4iXX0=
