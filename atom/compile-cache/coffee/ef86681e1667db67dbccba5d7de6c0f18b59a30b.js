(function() {
  var CompositeDisposable, Disposable, FileIcons, TabView, layout, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  path = require('path');

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  FileIcons = require('./file-icons');

  layout = require('./layout');

  module.exports = TabView = (function(superClass) {
    extend(TabView, superClass);

    function TabView() {
      return TabView.__super__.constructor.apply(this, arguments);
    }

    TabView.prototype.initialize = function(item1, pane) {
      var closeIcon;
      this.item = item1;
      this.pane = pane;
      if (typeof this.item.getPath === 'function') {
        this.path = this.item.getPath();
      }
      if (['TextEditor', 'TestView'].indexOf(this.item.constructor.name) > -1) {
        this.classList.add('texteditor');
      }
      this.classList.add('tab', 'sortable');
      this.itemTitle = document.createElement('div');
      this.itemTitle.classList.add('title');
      this.appendChild(this.itemTitle);
      closeIcon = document.createElement('div');
      closeIcon.classList.add('close-icon');
      this.appendChild(closeIcon);
      this.subscriptions = new CompositeDisposable();
      this.handleEvents();
      this.updateDataAttributes();
      this.updateTitle();
      this.updateIcon();
      this.updateModifiedStatus();
      this.setupTooltip();
      if (this.isItemPending()) {
        this.itemTitle.classList.add('temp');
        this.classList.add('pending-tab');
      }
      this.ondrag = function(e) {
        return layout.drag(e);
      };
      return this.ondragend = function(e) {
        return layout.end(e);
      };
    };

    TabView.prototype.handleEvents = function() {
      var base, iconChangedHandler, modifiedHandler, onDidChangeIconDisposable, onDidChangeModifiedDisposable, onDidChangePathDisposable, onDidChangeTitleDisposable, onDidSaveDisposable, onDidTerminatePendingStateDisposable, pathChangedHandler, titleChangedHandler;
      titleChangedHandler = (function(_this) {
        return function() {
          return _this.updateTitle();
        };
      })(this);
      this.subscriptions.add(this.pane.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
      if (typeof this.pane.onItemDidTerminatePendingState === 'function') {
        this.subscriptions.add(this.pane.onItemDidTerminatePendingState((function(_this) {
          return function(item) {
            if (item === _this.item) {
              return _this.clearPending();
            }
          };
        })(this)));
      } else if (typeof this.item.onDidTerminatePendingState === 'function') {
        onDidTerminatePendingStateDisposable = this.item.onDidTerminatePendingState((function(_this) {
          return function() {
            return _this.clearPending();
          };
        })(this));
        if (Disposable.isDisposable(onDidTerminatePendingStateDisposable)) {
          this.subscriptions.add(onDidTerminatePendingStateDisposable);
        } else {
          console.warn("::onDidTerminatePendingState does not return a valid Disposable!", this.item);
        }
      }
      if (typeof this.item.onDidChangeTitle === 'function') {
        onDidChangeTitleDisposable = this.item.onDidChangeTitle(titleChangedHandler);
        if (Disposable.isDisposable(onDidChangeTitleDisposable)) {
          this.subscriptions.add(onDidChangeTitleDisposable);
        } else {
          console.warn("::onDidChangeTitle does not return a valid Disposable!", this.item);
        }
      } else if (typeof this.item.on === 'function') {
        this.item.on('title-changed', titleChangedHandler);
        this.subscriptions.add({
          dispose: (function(_this) {
            return function() {
              var base;
              return typeof (base = _this.item).off === "function" ? base.off('title-changed', titleChangedHandler) : void 0;
            };
          })(this)
        });
      }
      pathChangedHandler = (function(_this) {
        return function(path1) {
          _this.path = path1;
          _this.updateDataAttributes();
          _this.updateTitle();
          return _this.updateTooltip();
        };
      })(this);
      if (typeof this.item.onDidChangePath === 'function') {
        onDidChangePathDisposable = this.item.onDidChangePath(pathChangedHandler);
        if (Disposable.isDisposable(onDidChangePathDisposable)) {
          this.subscriptions.add(onDidChangePathDisposable);
        } else {
          console.warn("::onDidChangePath does not return a valid Disposable!", this.item);
        }
      } else if (typeof this.item.on === 'function') {
        this.item.on('path-changed', pathChangedHandler);
        this.subscriptions.add({
          dispose: (function(_this) {
            return function() {
              var base;
              return typeof (base = _this.item).off === "function" ? base.off('path-changed', pathChangedHandler) : void 0;
            };
          })(this)
        });
      }
      iconChangedHandler = (function(_this) {
        return function() {
          return _this.updateIcon();
        };
      })(this);
      if (typeof this.item.onDidChangeIcon === 'function') {
        onDidChangeIconDisposable = typeof (base = this.item).onDidChangeIcon === "function" ? base.onDidChangeIcon((function(_this) {
          return function() {
            return _this.updateIcon();
          };
        })(this)) : void 0;
        if (Disposable.isDisposable(onDidChangeIconDisposable)) {
          this.subscriptions.add(onDidChangeIconDisposable);
        } else {
          console.warn("::onDidChangeIcon does not return a valid Disposable!", this.item);
        }
      } else if (typeof this.item.on === 'function') {
        this.item.on('icon-changed', iconChangedHandler);
        this.subscriptions.add({
          dispose: (function(_this) {
            return function() {
              var base1;
              return typeof (base1 = _this.item).off === "function" ? base1.off('icon-changed', iconChangedHandler) : void 0;
            };
          })(this)
        });
      }
      modifiedHandler = (function(_this) {
        return function() {
          return _this.updateModifiedStatus();
        };
      })(this);
      if (typeof this.item.onDidChangeModified === 'function') {
        onDidChangeModifiedDisposable = this.item.onDidChangeModified(modifiedHandler);
        if (Disposable.isDisposable(onDidChangeModifiedDisposable)) {
          this.subscriptions.add(onDidChangeModifiedDisposable);
        } else {
          console.warn("::onDidChangeModified does not return a valid Disposable!", this.item);
        }
      } else if (typeof this.item.on === 'function') {
        this.item.on('modified-status-changed', modifiedHandler);
        this.subscriptions.add({
          dispose: (function(_this) {
            return function() {
              var base1;
              return typeof (base1 = _this.item).off === "function" ? base1.off('modified-status-changed', modifiedHandler) : void 0;
            };
          })(this)
        });
      }
      if (typeof this.item.onDidSave === 'function') {
        onDidSaveDisposable = this.item.onDidSave((function(_this) {
          return function(event) {
            _this.terminatePendingState();
            if (event.path !== _this.path) {
              _this.path = event.path;
              if (atom.config.get('tabs.enableVcsColoring')) {
                return _this.setupVcsStatus();
              }
            }
          };
        })(this));
        if (Disposable.isDisposable(onDidSaveDisposable)) {
          this.subscriptions.add(onDidSaveDisposable);
        } else {
          console.warn("::onDidSave does not return a valid Disposable!", this.item);
        }
      }
      this.subscriptions.add(atom.config.observe('tabs.showIcons', (function(_this) {
        return function() {
          return _this.updateIconVisibility();
        };
      })(this)));
      return this.subscriptions.add(atom.config.observe('tabs.enableVcsColoring', (function(_this) {
        return function(isEnabled) {
          if (isEnabled && (_this.path != null)) {
            return _this.setupVcsStatus();
          } else {
            return _this.unsetVcsStatus();
          }
        };
      })(this)));
    };

    TabView.prototype.setupTooltip = function() {
      var onMouseEnter;
      onMouseEnter = (function(_this) {
        return function() {
          _this.mouseEnterSubscription.dispose();
          _this.hasBeenMousedOver = true;
          _this.updateTooltip();
          return _this.dispatchEvent(new CustomEvent('mouseenter', {
            bubbles: true
          }));
        };
      })(this);
      this.mouseEnterSubscription = {
        dispose: (function(_this) {
          return function() {
            _this.removeEventListener('mouseenter', onMouseEnter);
            return _this.mouseEnterSubscription = null;
          };
        })(this)
      };
      return this.addEventListener('mouseenter', onMouseEnter);
    };

    TabView.prototype.updateTooltip = function() {
      if (!this.hasBeenMousedOver) {
        return;
      }
      this.destroyTooltip();
      if (this.path) {
        return this.tooltip = atom.tooltips.add(this, {
          title: this.path,
          html: false,
          delay: {
            show: 1000,
            hide: 100
          },
          placement: 'bottom'
        });
      }
    };

    TabView.prototype.destroyTooltip = function() {
      var ref1;
      if (!this.hasBeenMousedOver) {
        return;
      }
      return (ref1 = this.tooltip) != null ? ref1.dispose() : void 0;
    };

    TabView.prototype.destroy = function() {
      var ref1, ref2, ref3;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.mouseEnterSubscription) != null) {
        ref2.dispose();
      }
      if ((ref3 = this.repoSubscriptions) != null) {
        ref3.dispose();
      }
      this.destroyTooltip();
      return this.remove();
    };

    TabView.prototype.updateDataAttributes = function() {
      var itemClass, ref1;
      if (this.path) {
        this.itemTitle.dataset.name = path.basename(this.path);
        this.itemTitle.dataset.path = this.path;
      } else {
        delete this.itemTitle.dataset.name;
        delete this.itemTitle.dataset.path;
      }
      if (itemClass = (ref1 = this.item.constructor) != null ? ref1.name : void 0) {
        return this.dataset.type = itemClass;
      } else {
        return delete this.dataset.type;
      }
    };

    TabView.prototype.updateTitle = function(arg) {
      var base, base1, i, len, ref1, ref2, ref3, ref4, tab, title, updateSiblings, useLongTitle;
      ref1 = arg != null ? arg : {}, updateSiblings = ref1.updateSiblings, useLongTitle = ref1.useLongTitle;
      if (this.updatingTitle) {
        return;
      }
      this.updatingTitle = true;
      if (updateSiblings === false) {
        title = this.item.getTitle();
        if (useLongTitle) {
          title = (ref2 = typeof (base = this.item).getLongTitle === "function" ? base.getLongTitle() : void 0) != null ? ref2 : title;
        }
        this.itemTitle.textContent = title;
      } else {
        title = this.item.getTitle();
        useLongTitle = false;
        ref3 = this.getTabs();
        for (i = 0, len = ref3.length; i < len; i++) {
          tab = ref3[i];
          if (tab !== this) {
            if (tab.item.getTitle() === title) {
              tab.updateTitle({
                updateSiblings: false,
                useLongTitle: true
              });
              useLongTitle = true;
            }
          }
        }
        if (useLongTitle) {
          title = (ref4 = typeof (base1 = this.item).getLongTitle === "function" ? base1.getLongTitle() : void 0) != null ? ref4 : title;
        }
        this.itemTitle.textContent = title;
      }
      return this.updatingTitle = false;
    };

    TabView.prototype.updateIcon = function() {
      var base, names, ref1, ref2;
      if (this.iconName) {
        names = !Array.isArray(this.iconName) ? this.iconName.split(/\s+/g) : this.iconName;
        (ref1 = this.itemTitle.classList).remove.apply(ref1, ['icon', "icon-" + names[0]].concat(slice.call(names)));
      }
      if (this.iconName = typeof (base = this.item).getIconName === "function" ? base.getIconName() : void 0) {
        return this.itemTitle.classList.add('icon', "icon-" + this.iconName);
      } else if ((this.path != null) && (this.iconName = FileIcons.getService().iconClassForPath(this.path, "tabs"))) {
        if (!Array.isArray(names = this.iconName)) {
          names = names.toString().split(/\s+/g);
        }
        return (ref2 = this.itemTitle.classList).add.apply(ref2, ['icon'].concat(slice.call(names)));
      }
    };

    TabView.prototype.getTabs = function() {
      var ref1, ref2;
      return (ref1 = (ref2 = this.parentElement) != null ? ref2.querySelectorAll('.tab') : void 0) != null ? ref1 : [];
    };

    TabView.prototype.isItemPending = function() {
      if (this.pane.getPendingItem != null) {
        return this.pane.getPendingItem() === this.item;
      } else if (this.item.isPending != null) {
        return this.item.isPending();
      }
    };

    TabView.prototype.terminatePendingState = function() {
      if (this.pane.clearPendingItem != null) {
        if (this.pane.getPendingItem() === this.item) {
          return this.pane.clearPendingItem();
        }
      } else if (this.item.terminatePendingState != null) {
        return this.item.terminatePendingState();
      }
    };

    TabView.prototype.clearPending = function() {
      this.itemTitle.classList.remove('temp');
      return this.classList.remove('pending-tab');
    };

    TabView.prototype.updateIconVisibility = function() {
      if (atom.config.get('tabs.showIcons')) {
        return this.itemTitle.classList.remove('hide-icon');
      } else {
        return this.itemTitle.classList.add('hide-icon');
      }
    };

    TabView.prototype.updateModifiedStatus = function() {
      var base;
      if (typeof (base = this.item).isModified === "function" ? base.isModified() : void 0) {
        if (!this.isModified) {
          this.classList.add('modified');
        }
        return this.isModified = true;
      } else {
        if (this.isModified) {
          this.classList.remove('modified');
        }
        return this.isModified = false;
      }
    };

    TabView.prototype.setupVcsStatus = function() {
      if (this.path == null) {
        return;
      }
      return this.repoForPath(this.path).then((function(_this) {
        return function(repo) {
          _this.subscribeToRepo(repo);
          return _this.updateVcsStatus(repo);
        };
      })(this));
    };

    TabView.prototype.subscribeToRepo = function(repo) {
      var ref1;
      if (repo == null) {
        return;
      }
      if ((ref1 = this.repoSubscriptions) != null) {
        ref1.dispose();
      }
      this.repoSubscriptions = new CompositeDisposable();
      this.repoSubscriptions.add(repo.onDidChangeStatus((function(_this) {
        return function(event) {
          if (event.path === _this.path) {
            return _this.updateVcsStatus(repo, event.pathStatus);
          }
        };
      })(this)));
      return this.repoSubscriptions.add(repo.onDidChangeStatuses((function(_this) {
        return function() {
          return _this.updateVcsStatus(repo);
        };
      })(this)));
    };

    TabView.prototype.repoForPath = function() {
      var dir, i, len, ref1;
      ref1 = atom.project.getDirectories();
      for (i = 0, len = ref1.length; i < len; i++) {
        dir = ref1[i];
        if (dir.contains(this.path)) {
          return atom.project.repositoryForDirectory(dir);
        }
      }
      return Promise.resolve(null);
    };

    TabView.prototype.updateVcsStatus = function(repo, status) {
      var newStatus;
      if (repo == null) {
        return;
      }
      newStatus = null;
      if (repo.isPathIgnored(this.path)) {
        newStatus = 'ignored';
      } else {
        if (status == null) {
          status = repo.getCachedPathStatus(this.path);
        }
        if (repo.isStatusModified(status)) {
          newStatus = 'modified';
        } else if (repo.isStatusNew(status)) {
          newStatus = 'added';
        }
      }
      if (newStatus !== this.status) {
        this.status = newStatus;
        return this.updateVcsColoring();
      }
    };

    TabView.prototype.updateVcsColoring = function() {
      this.itemTitle.classList.remove('status-ignored', 'status-modified', 'status-added');
      if (this.status && atom.config.get('tabs.enableVcsColoring')) {
        return this.itemTitle.classList.add("status-" + this.status);
      }
    };

    TabView.prototype.unsetVcsStatus = function() {
      var ref1;
      if ((ref1 = this.repoSubscriptions) != null) {
        ref1.dispose();
      }
      delete this.status;
      return this.updateVcsColoring();
    };

    return TabView;

  })(HTMLElement);

  module.exports = document.registerElement('tabs-tab', {
    prototype: TabView.prototype,
    "extends": 'li'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90YWJzL2xpYi90YWItdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHNFQUFBO0lBQUE7Ozs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0VBRVQsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztzQkFDSixVQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsSUFBUjtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxPQUFEO01BQ2xCLElBQUcsT0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQWIsS0FBd0IsVUFBM0I7UUFDRSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBLEVBRFY7O01BR0EsSUFBRyxDQUFDLFlBQUQsRUFBZSxVQUFmLENBQTBCLENBQUMsT0FBM0IsQ0FBbUMsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBckQsQ0FBQSxHQUE2RCxDQUFDLENBQWpFO1FBQ0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsWUFBZixFQURGOztNQUVBLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLEtBQWYsRUFBc0IsVUFBdEI7TUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ2IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBckIsQ0FBeUIsT0FBekI7TUFDQSxJQUFD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QUNBLElBQUcsSUFBQyxDQUFBLE1BQUQsSUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isd0JBQWhCLENBQWY7ZUFDRSxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFyQixDQUF5QixTQUFBLEdBQVUsSUFBQyxDQUFBLE1BQXBDLEVBREY7O0lBRmlCOztzQkFLbkIsY0FBQSxHQUFnQixTQUFBO0FBQ2QsVUFBQTs7WUFBa0IsQ0FBRSxPQUFwQixDQUFBOztNQUNBLE9BQU8sSUFBQyxDQUFBO2FBQ1IsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFIYzs7OztLQXZTSTs7RUE0U3RCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQVEsQ0FBQyxlQUFULENBQXlCLFVBQXpCLEVBQXFDO0lBQUEsU0FBQSxFQUFXLE9BQU8sQ0FBQyxTQUFuQjtJQUE4QixDQUFBLE9BQUEsQ0FBQSxFQUFTLElBQXZDO0dBQXJDO0FBblRqQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xue0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbkZpbGVJY29ucyA9IHJlcXVpcmUgJy4vZmlsZS1pY29ucydcblxubGF5b3V0ID0gcmVxdWlyZSAnLi9sYXlvdXQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRhYlZpZXcgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBpbml0aWFsaXplOiAoQGl0ZW0sIEBwYW5lKSAtPlxuICAgIGlmIHR5cGVvZiBAaXRlbS5nZXRQYXRoIGlzICdmdW5jdGlvbidcbiAgICAgIEBwYXRoID0gQGl0ZW0uZ2V0UGF0aCgpXG5cbiAgICBpZiBbJ1RleHRFZGl0b3InLCAnVGVzdFZpZXcnXS5pbmRleE9mKEBpdGVtLmNvbnN0cnVjdG9yLm5hbWUpID4gLTFcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCd0ZXh0ZWRpdG9yJylcbiAgICBAY2xhc3NMaXN0LmFkZCgndGFiJywgJ3NvcnRhYmxlJylcblxuICAgIEBpdGVtVGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBpdGVtVGl0bGUuY2xhc3NMaXN0LmFkZCgndGl0bGUnKVxuICAgIEBhcHBlbmRDaGlsZChAaXRlbVRpdGxlKVxuXG4gICAgY2xvc2VJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBjbG9zZUljb24uY2xhc3NMaXN0LmFkZCgnY2xvc2UtaWNvbicpXG4gICAgQGFwcGVuZENoaWxkKGNsb3NlSWNvbilcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgQGhhbmRsZUV2ZW50cygpXG4gICAgQHVwZGF0ZURhdGFBdHRyaWJ1dGVzKClcbiAgICBAdXBkYXRlVGl0bGUoKVxuICAgIEB1cGRhdGVJY29uKClcbiAgICBAdXBkYXRlTW9kaWZpZWRTdGF0dXMoKVxuICAgIEBzZXR1cFRvb2x0aXAoKVxuXG4gICAgaWYgQGlzSXRlbVBlbmRpbmcoKVxuICAgICAgQGl0ZW1UaXRsZS5jbGFzc0xpc3QuYWRkKCd0ZW1wJylcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdwZW5kaW5nLXRhYicpXG5cbiAgICBAb25kcmFnID0gKGUpIC0+IGxheW91dC5kcmFnIGVcbiAgICBAb25kcmFnZW5kID0gKGUpIC0+IGxheW91dC5lbmQgZVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICB0aXRsZUNoYW5nZWRIYW5kbGVyID0gPT5cbiAgICAgIEB1cGRhdGVUaXRsZSgpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHBhbmUub25EaWREZXN0cm95ID0+IEBkZXN0cm95KClcblxuICAgICMgVE9ETzogcmVtb3ZlIGVsc2UgY29uZGl0aW9uIG9uY2UgcGVuZGluZyBBUEkgaXMgb24gc3RhYmxlIFtNS1RdXG4gICAgaWYgdHlwZW9mIEBwYW5lLm9uSXRlbURpZFRlcm1pbmF0ZVBlbmRpbmdTdGF0ZSBpcyAnZnVuY3Rpb24nXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHBhbmUub25JdGVtRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlIChpdGVtKSA9PlxuICAgICAgICBAY2xlYXJQZW5kaW5nKCkgaWYgaXRlbSBpcyBAaXRlbVxuICAgIGVsc2UgaWYgdHlwZW9mIEBpdGVtLm9uRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlIGlzICdmdW5jdGlvbidcbiAgICAgIG9uRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlRGlzcG9zYWJsZSA9IEBpdGVtLm9uRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlID0+IEBjbGVhclBlbmRpbmcoKVxuICAgICAgaWYgRGlzcG9zYWJsZS5pc0Rpc3Bvc2FibGUob25EaWRUZXJtaW5hdGVQZW5kaW5nU3RhdGVEaXNwb3NhYmxlKVxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQob25EaWRUZXJtaW5hdGVQZW5kaW5nU3RhdGVEaXNwb3NhYmxlKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLndhcm4gXCI6Om9uRGlkVGVybWluYXRlUGVuZGluZ1N0YXRlIGRvZXMgbm90IHJldHVybiBhIHZhbGlkIERpc3Bvc2FibGUhXCIsIEBpdGVtXG5cbiAgICBpZiB0eXBlb2YgQGl0ZW0ub25EaWRDaGFuZ2VUaXRsZSBpcyAnZnVuY3Rpb24nXG4gICAgICBvbkRpZENoYW5nZVRpdGxlRGlzcG9zYWJsZSA9IEBpdGVtLm9uRGlkQ2hhbmdlVGl0bGUodGl0bGVDaGFuZ2VkSGFuZGxlcilcbiAgICAgIGlmIERpc3Bvc2FibGUuaXNEaXNwb3NhYmxlKG9uRGlkQ2hhbmdlVGl0bGVEaXNwb3NhYmxlKVxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQob25EaWRDaGFuZ2VUaXRsZURpc3Bvc2FibGUpXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUud2FybiBcIjo6b25EaWRDaGFuZ2VUaXRsZSBkb2VzIG5vdCByZXR1cm4gYSB2YWxpZCBEaXNwb3NhYmxlIVwiLCBAaXRlbVxuICAgIGVsc2UgaWYgdHlwZW9mIEBpdGVtLm9uIGlzICdmdW5jdGlvbidcbiAgICAgICNUT0RPIFJlbW92ZSBvbmNlIG9sZCBldmVudHMgYXJlIG5vIGxvbmdlciBzdXBwb3J0ZWRcbiAgICAgIEBpdGVtLm9uKCd0aXRsZS1jaGFuZ2VkJywgdGl0bGVDaGFuZ2VkSGFuZGxlcilcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBkaXNwb3NlOiA9PlxuICAgICAgICBAaXRlbS5vZmY/KCd0aXRsZS1jaGFuZ2VkJywgdGl0bGVDaGFuZ2VkSGFuZGxlcilcblxuICAgIHBhdGhDaGFuZ2VkSGFuZGxlciA9IChAcGF0aCkgPT5cbiAgICAgIEB1cGRhdGVEYXRhQXR0cmlidXRlcygpXG4gICAgICBAdXBkYXRlVGl0bGUoKVxuICAgICAgQHVwZGF0ZVRvb2x0aXAoKVxuXG4gICAgaWYgdHlwZW9mIEBpdGVtLm9uRGlkQ2hhbmdlUGF0aCBpcyAnZnVuY3Rpb24nXG4gICAgICBvbkRpZENoYW5nZVBhdGhEaXNwb3NhYmxlID0gQGl0ZW0ub25EaWRDaGFuZ2VQYXRoKHBhdGhDaGFuZ2VkSGFuZGxlcilcbiAgICAgIGlmIERpc3Bvc2FibGUuaXNEaXNwb3NhYmxlKG9uRGlkQ2hhbmdlUGF0aERpc3Bvc2FibGUpXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChvbkRpZENoYW5nZVBhdGhEaXNwb3NhYmxlKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLndhcm4gXCI6Om9uRGlkQ2hhbmdlUGF0aCBkb2VzIG5vdCByZXR1cm4gYSB2YWxpZCBEaXNwb3NhYmxlIVwiLCBAaXRlbVxuICAgIGVsc2UgaWYgdHlwZW9mIEBpdGVtLm9uIGlzICdmdW5jdGlvbidcbiAgICAgICNUT0RPIFJlbW92ZSBvbmNlIG9sZCBldmVudHMgYXJlIG5vIGxvbmdlciBzdXBwb3J0ZWRcbiAgICAgIEBpdGVtLm9uKCdwYXRoLWNoYW5nZWQnLCBwYXRoQ2hhbmdlZEhhbmRsZXIpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgZGlzcG9zZTogPT5cbiAgICAgICAgQGl0ZW0ub2ZmPygncGF0aC1jaGFuZ2VkJywgcGF0aENoYW5nZWRIYW5kbGVyKVxuXG4gICAgaWNvbkNoYW5nZWRIYW5kbGVyID0gPT5cbiAgICAgIEB1cGRhdGVJY29uKClcblxuICAgIGlmIHR5cGVvZiBAaXRlbS5vbkRpZENoYW5nZUljb24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgb25EaWRDaGFuZ2VJY29uRGlzcG9zYWJsZSA9IEBpdGVtLm9uRGlkQ2hhbmdlSWNvbj8gPT5cbiAgICAgICAgQHVwZGF0ZUljb24oKVxuICAgICAgaWYgRGlzcG9zYWJsZS5pc0Rpc3Bvc2FibGUob25EaWRDaGFuZ2VJY29uRGlzcG9zYWJsZSlcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKG9uRGlkQ2hhbmdlSWNvbkRpc3Bvc2FibGUpXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUud2FybiBcIjo6b25EaWRDaGFuZ2VJY29uIGRvZXMgbm90IHJldHVybiBhIHZhbGlkIERpc3Bvc2FibGUhXCIsIEBpdGVtXG4gICAgZWxzZSBpZiB0eXBlb2YgQGl0ZW0ub24gaXMgJ2Z1bmN0aW9uJ1xuICAgICAgI1RPRE8gUmVtb3ZlIG9uY2Ugb2xkIGV2ZW50cyBhcmUgbm8gbG9uZ2VyIHN1cHBvcnRlZFxuICAgICAgQGl0ZW0ub24oJ2ljb24tY2hhbmdlZCcsIGljb25DaGFuZ2VkSGFuZGxlcilcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBkaXNwb3NlOiA9PlxuICAgICAgICBAaXRlbS5vZmY/KCdpY29uLWNoYW5nZWQnLCBpY29uQ2hhbmdlZEhhbmRsZXIpXG5cbiAgICBtb2RpZmllZEhhbmRsZXIgPSA9PlxuICAgICAgQHVwZGF0ZU1vZGlmaWVkU3RhdHVzKClcblxuICAgIGlmIHR5cGVvZiBAaXRlbS5vbkRpZENoYW5nZU1vZGlmaWVkIGlzICdmdW5jdGlvbidcbiAgICAgIG9uRGlkQ2hhbmdlTW9kaWZpZWREaXNwb3NhYmxlID0gQGl0ZW0ub25EaWRDaGFuZ2VNb2RpZmllZChtb2RpZmllZEhhbmRsZXIpXG4gICAgICBpZiBEaXNwb3NhYmxlLmlzRGlzcG9zYWJsZShvbkRpZENoYW5nZU1vZGlmaWVkRGlzcG9zYWJsZSlcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkKG9uRGlkQ2hhbmdlTW9kaWZpZWREaXNwb3NhYmxlKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLndhcm4gXCI6Om9uRGlkQ2hhbmdlTW9kaWZpZWQgZG9lcyBub3QgcmV0dXJuIGEgdmFsaWQgRGlzcG9zYWJsZSFcIiwgQGl0ZW1cbiAgICBlbHNlIGlmIHR5cGVvZiBAaXRlbS5vbiBpcyAnZnVuY3Rpb24nXG4gICAgICAjVE9ETyBSZW1vdmUgb25jZSBvbGQgZXZlbnRzIGFyZSBubyBsb25nZXIgc3VwcG9ydGVkXG4gICAgICBAaXRlbS5vbignbW9kaWZpZWQtc3RhdHVzLWNoYW5nZWQnLCBtb2RpZmllZEhhbmRsZXIpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgZGlzcG9zZTogPT5cbiAgICAgICAgQGl0ZW0ub2ZmPygnbW9kaWZpZWQtc3RhdHVzLWNoYW5nZWQnLCBtb2RpZmllZEhhbmRsZXIpXG5cbiAgICBpZiB0eXBlb2YgQGl0ZW0ub25EaWRTYXZlIGlzICdmdW5jdGlvbidcbiAgICAgIG9uRGlkU2F2ZURpc3Bvc2FibGUgPSBAaXRlbS5vbkRpZFNhdmUgKGV2ZW50KSA9PlxuICAgICAgICBAdGVybWluYXRlUGVuZGluZ1N0YXRlKClcbiAgICAgICAgaWYgZXZlbnQucGF0aCBpc250IEBwYXRoXG4gICAgICAgICAgQHBhdGggPSBldmVudC5wYXRoXG4gICAgICAgICAgQHNldHVwVmNzU3RhdHVzKCkgaWYgYXRvbS5jb25maWcuZ2V0ICd0YWJzLmVuYWJsZVZjc0NvbG9yaW5nJ1xuXG4gICAgICBpZiBEaXNwb3NhYmxlLmlzRGlzcG9zYWJsZShvbkRpZFNhdmVEaXNwb3NhYmxlKVxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQob25EaWRTYXZlRGlzcG9zYWJsZSlcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS53YXJuIFwiOjpvbkRpZFNhdmUgZG9lcyBub3QgcmV0dXJuIGEgdmFsaWQgRGlzcG9zYWJsZSFcIiwgQGl0ZW1cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZSAndGFicy5zaG93SWNvbnMnLCA9PlxuICAgICAgQHVwZGF0ZUljb25WaXNpYmlsaXR5KClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICd0YWJzLmVuYWJsZVZjc0NvbG9yaW5nJywgKGlzRW5hYmxlZCkgPT5cbiAgICAgIGlmIGlzRW5hYmxlZCBhbmQgQHBhdGg/IHRoZW4gQHNldHVwVmNzU3RhdHVzKCkgZWxzZSBAdW5zZXRWY3NTdGF0dXMoKVxuXG4gIHNldHVwVG9vbHRpcDogLT5cbiAgICAjIERlZmVyIGNyZWF0aW5nIHRoZSB0b29sdGlwIHVudGlsIHRoZSB0YWIgaXMgbW91c2VkIG92ZXJcbiAgICBvbk1vdXNlRW50ZXIgPSA9PlxuICAgICAgQG1vdXNlRW50ZXJTdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgICBAaGFzQmVlbk1vdXNlZE92ZXIgPSB0cnVlXG4gICAgICBAdXBkYXRlVG9vbHRpcCgpXG5cbiAgICAgICMgVHJpZ2dlciBhZ2FpbiBzbyB0aGUgdG9vbHRpcCBzaG93c1xuICAgICAgQGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdtb3VzZWVudGVyJywgYnViYmxlczogdHJ1ZSkpXG5cbiAgICBAbW91c2VFbnRlclN1YnNjcmlwdGlvbiA9IGRpc3Bvc2U6ID0+XG4gICAgICBAcmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIG9uTW91c2VFbnRlcilcbiAgICAgIEBtb3VzZUVudGVyU3Vic2NyaXB0aW9uID0gbnVsbFxuXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBvbk1vdXNlRW50ZXIpXG5cbiAgdXBkYXRlVG9vbHRpcDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBoYXNCZWVuTW91c2VkT3ZlclxuXG4gICAgQGRlc3Ryb3lUb29sdGlwKClcblxuICAgIGlmIEBwYXRoXG4gICAgICBAdG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkIHRoaXMsXG4gICAgICAgIHRpdGxlOiBAcGF0aFxuICAgICAgICBodG1sOiBmYWxzZVxuICAgICAgICBkZWxheTpcbiAgICAgICAgICBzaG93OiAxMDAwXG4gICAgICAgICAgaGlkZTogMTAwXG4gICAgICAgIHBsYWNlbWVudDogJ2JvdHRvbSdcblxuICBkZXN0cm95VG9vbHRpcDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBoYXNCZWVuTW91c2VkT3ZlclxuICAgIEB0b29sdGlwPy5kaXNwb3NlKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAbW91c2VFbnRlclN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHJlcG9TdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAZGVzdHJveVRvb2x0aXAoKVxuICAgIEByZW1vdmUoKVxuXG4gIHVwZGF0ZURhdGFBdHRyaWJ1dGVzOiAtPlxuICAgIGlmIEBwYXRoXG4gICAgICBAaXRlbVRpdGxlLmRhdGFzZXQubmFtZSA9IHBhdGguYmFzZW5hbWUoQHBhdGgpXG4gICAgICBAaXRlbVRpdGxlLmRhdGFzZXQucGF0aCA9IEBwYXRoXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIEBpdGVtVGl0bGUuZGF0YXNldC5uYW1lXG4gICAgICBkZWxldGUgQGl0ZW1UaXRsZS5kYXRhc2V0LnBhdGhcblxuICAgIGlmIGl0ZW1DbGFzcyA9IEBpdGVtLmNvbnN0cnVjdG9yPy5uYW1lXG4gICAgICBAZGF0YXNldC50eXBlID0gaXRlbUNsYXNzXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIEBkYXRhc2V0LnR5cGVcblxuICB1cGRhdGVUaXRsZTogKHt1cGRhdGVTaWJsaW5ncywgdXNlTG9uZ1RpdGxlfT17fSkgLT5cbiAgICByZXR1cm4gaWYgQHVwZGF0aW5nVGl0bGVcbiAgICBAdXBkYXRpbmdUaXRsZSA9IHRydWVcblxuICAgIGlmIHVwZGF0ZVNpYmxpbmdzIGlzIGZhbHNlXG4gICAgICB0aXRsZSA9IEBpdGVtLmdldFRpdGxlKClcbiAgICAgIHRpdGxlID0gQGl0ZW0uZ2V0TG9uZ1RpdGxlPygpID8gdGl0bGUgaWYgdXNlTG9uZ1RpdGxlXG4gICAgICBAaXRlbVRpdGxlLnRleHRDb250ZW50ID0gdGl0bGVcbiAgICBlbHNlXG4gICAgICB0aXRsZSA9IEBpdGVtLmdldFRpdGxlKClcbiAgICAgIHVzZUxvbmdUaXRsZSA9IGZhbHNlXG4gICAgICBmb3IgdGFiIGluIEBnZXRUYWJzKCkgd2hlbiB0YWIgaXNudCB0aGlzXG4gICAgICAgIGlmIHRhYi5pdGVtLmdldFRpdGxlKCkgaXMgdGl0bGVcbiAgICAgICAgICB0YWIudXBkYXRlVGl0bGUodXBkYXRlU2libGluZ3M6IGZhbHNlLCB1c2VMb25nVGl0bGU6IHRydWUpXG4gICAgICAgICAgdXNlTG9uZ1RpdGxlID0gdHJ1ZVxuICAgICAgdGl0bGUgPSBAaXRlbS5nZXRMb25nVGl0bGU/KCkgPyB0aXRsZSBpZiB1c2VMb25nVGl0bGVcblxuICAgICAgQGl0ZW1UaXRsZS50ZXh0Q29udGVudCA9IHRpdGxlXG5cbiAgICBAdXBkYXRpbmdUaXRsZSA9IGZhbHNlXG5cbiAgdXBkYXRlSWNvbjogLT5cbiAgICBpZiBAaWNvbk5hbWVcbiAgICAgIG5hbWVzID0gdW5sZXNzIEFycmF5LmlzQXJyYXkoQGljb25OYW1lKSB0aGVuIEBpY29uTmFtZS5zcGxpdCgvXFxzKy9nKSBlbHNlIEBpY29uTmFtZVxuICAgICAgQGl0ZW1UaXRsZS5jbGFzc0xpc3QucmVtb3ZlKCdpY29uJywgXCJpY29uLSN7bmFtZXNbMF19XCIsIG5hbWVzLi4uKVxuXG4gICAgaWYgQGljb25OYW1lID0gQGl0ZW0uZ2V0SWNvbk5hbWU/KClcbiAgICAgIEBpdGVtVGl0bGUuY2xhc3NMaXN0LmFkZCgnaWNvbicsIFwiaWNvbi0je0BpY29uTmFtZX1cIilcbiAgICBlbHNlIGlmIEBwYXRoPyBhbmQgQGljb25OYW1lID0gRmlsZUljb25zLmdldFNlcnZpY2UoKS5pY29uQ2xhc3NGb3JQYXRoKEBwYXRoLCBcInRhYnNcIilcbiAgICAgIHVubGVzcyBBcnJheS5pc0FycmF5IG5hbWVzID0gQGljb25OYW1lXG4gICAgICAgIG5hbWVzID0gbmFtZXMudG9TdHJpbmcoKS5zcGxpdCAvXFxzKy9nXG5cbiAgICAgIEBpdGVtVGl0bGUuY2xhc3NMaXN0LmFkZCgnaWNvbicsIG5hbWVzLi4uKVxuXG4gIGdldFRhYnM6IC0+XG4gICAgQHBhcmVudEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3JBbGwoJy50YWInKSA/IFtdXG5cbiAgaXNJdGVtUGVuZGluZzogLT5cbiAgICBpZiBAcGFuZS5nZXRQZW5kaW5nSXRlbT9cbiAgICAgIEBwYW5lLmdldFBlbmRpbmdJdGVtKCkgaXMgQGl0ZW1cbiAgICBlbHNlIGlmIEBpdGVtLmlzUGVuZGluZz9cbiAgICAgIEBpdGVtLmlzUGVuZGluZygpXG5cbiAgdGVybWluYXRlUGVuZGluZ1N0YXRlOiAtPlxuICAgIGlmIEBwYW5lLmNsZWFyUGVuZGluZ0l0ZW0/XG4gICAgICBAcGFuZS5jbGVhclBlbmRpbmdJdGVtKCkgaWYgQHBhbmUuZ2V0UGVuZGluZ0l0ZW0oKSBpcyBAaXRlbVxuICAgIGVsc2UgaWYgQGl0ZW0udGVybWluYXRlUGVuZGluZ1N0YXRlP1xuICAgICAgQGl0ZW0udGVybWluYXRlUGVuZGluZ1N0YXRlKClcblxuICBjbGVhclBlbmRpbmc6IC0+XG4gICAgQGl0ZW1UaXRsZS5jbGFzc0xpc3QucmVtb3ZlKCd0ZW1wJylcbiAgICBAY2xhc3NMaXN0LnJlbW92ZSgncGVuZGluZy10YWInKVxuXG4gIHVwZGF0ZUljb25WaXNpYmlsaXR5OiAtPlxuICAgIGlmIGF0b20uY29uZmlnLmdldCAndGFicy5zaG93SWNvbnMnXG4gICAgICBAaXRlbVRpdGxlLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUtaWNvbicpXG4gICAgZWxzZVxuICAgICAgQGl0ZW1UaXRsZS5jbGFzc0xpc3QuYWRkKCdoaWRlLWljb24nKVxuXG4gIHVwZGF0ZU1vZGlmaWVkU3RhdHVzOiAtPlxuICAgIGlmIEBpdGVtLmlzTW9kaWZpZWQ/KClcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdtb2RpZmllZCcpIHVubGVzcyBAaXNNb2RpZmllZFxuICAgICAgQGlzTW9kaWZpZWQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNsYXNzTGlzdC5yZW1vdmUoJ21vZGlmaWVkJykgaWYgQGlzTW9kaWZpZWRcbiAgICAgIEBpc01vZGlmaWVkID0gZmFsc2VcblxuICBzZXR1cFZjc1N0YXR1czogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwYXRoP1xuICAgIEByZXBvRm9yUGF0aChAcGF0aCkudGhlbiAocmVwbykgPT5cbiAgICAgIEBzdWJzY3JpYmVUb1JlcG8ocmVwbylcbiAgICAgIEB1cGRhdGVWY3NTdGF0dXMocmVwbylcblxuICAjIFN1YnNjcmliZSB0byB0aGUgcHJvamVjdCdzIHJlcG8gZm9yIGNoYW5nZXMgdG8gdGhlIFZDUyBzdGF0dXMgb2YgdGhlIGZpbGUuXG4gIHN1YnNjcmliZVRvUmVwbzogKHJlcG8pIC0+XG4gICAgcmV0dXJuIHVubGVzcyByZXBvP1xuXG4gICAgIyBSZW1vdmUgcHJldmlvdXMgcmVwbyBzdWJzY3JpcHRpb25zLlxuICAgIEByZXBvU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHJlcG9TdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgQHJlcG9TdWJzY3JpcHRpb25zLmFkZCByZXBvLm9uRGlkQ2hhbmdlU3RhdHVzIChldmVudCkgPT5cbiAgICAgIEB1cGRhdGVWY3NTdGF0dXMocmVwbywgZXZlbnQucGF0aFN0YXR1cykgaWYgZXZlbnQucGF0aCBpcyBAcGF0aFxuICAgIEByZXBvU3Vic2NyaXB0aW9ucy5hZGQgcmVwby5vbkRpZENoYW5nZVN0YXR1c2VzID0+XG4gICAgICBAdXBkYXRlVmNzU3RhdHVzKHJlcG8pXG5cbiAgcmVwb0ZvclBhdGg6IC0+XG4gICAgZm9yIGRpciBpbiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKVxuICAgICAgcmV0dXJuIGF0b20ucHJvamVjdC5yZXBvc2l0b3J5Rm9yRGlyZWN0b3J5KGRpcikgaWYgZGlyLmNvbnRhaW5zIEBwYXRoXG4gICAgUHJvbWlzZS5yZXNvbHZlKG51bGwpXG5cbiAgIyBVcGRhdGUgdGhlIFZDUyBzdGF0dXMgcHJvcGVydHkgb2YgdGhpcyB0YWIgdXNpbmcgdGhlIHJlcG8uXG4gIHVwZGF0ZVZjc1N0YXR1czogKHJlcG8sIHN0YXR1cykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJlcG8/XG5cbiAgICBuZXdTdGF0dXMgPSBudWxsXG4gICAgaWYgcmVwby5pc1BhdGhJZ25vcmVkKEBwYXRoKVxuICAgICAgbmV3U3RhdHVzID0gJ2lnbm9yZWQnXG4gICAgZWxzZVxuICAgICAgc3RhdHVzID0gcmVwby5nZXRDYWNoZWRQYXRoU3RhdHVzKEBwYXRoKSB1bmxlc3Mgc3RhdHVzP1xuICAgICAgaWYgcmVwby5pc1N0YXR1c01vZGlmaWVkKHN0YXR1cylcbiAgICAgICAgbmV3U3RhdHVzID0gJ21vZGlmaWVkJ1xuICAgICAgZWxzZSBpZiByZXBvLmlzU3RhdHVzTmV3KHN0YXR1cylcbiAgICAgICAgbmV3U3RhdHVzID0gJ2FkZGVkJ1xuXG4gICAgaWYgbmV3U3RhdHVzIGlzbnQgQHN0YXR1c1xuICAgICAgQHN0YXR1cyA9IG5ld1N0YXR1c1xuICAgICAgQHVwZGF0ZVZjc0NvbG9yaW5nKClcblxuICB1cGRhdGVWY3NDb2xvcmluZzogLT5cbiAgICBAaXRlbVRpdGxlLmNsYXNzTGlzdC5yZW1vdmUoJ3N0YXR1cy1pZ25vcmVkJywgJ3N0YXR1cy1tb2RpZmllZCcsICAnc3RhdHVzLWFkZGVkJylcbiAgICBpZiBAc3RhdHVzIGFuZCBhdG9tLmNvbmZpZy5nZXQgJ3RhYnMuZW5hYmxlVmNzQ29sb3JpbmcnXG4gICAgICBAaXRlbVRpdGxlLmNsYXNzTGlzdC5hZGQoXCJzdGF0dXMtI3tAc3RhdHVzfVwiKVxuXG4gIHVuc2V0VmNzU3RhdHVzOiAtPlxuICAgIEByZXBvU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgZGVsZXRlIEBzdGF0dXNcbiAgICBAdXBkYXRlVmNzQ29sb3JpbmcoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgndGFicy10YWInLCBwcm90b3R5cGU6IFRhYlZpZXcucHJvdG90eXBlLCBleHRlbmRzOiAnbGknKVxuIl19