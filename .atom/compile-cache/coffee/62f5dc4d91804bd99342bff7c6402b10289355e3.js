(function() {
  var CSON, ContextMenuItemSet, ContextMenuManager, Disposable, MenuHelpers, calculateSpecificity, fs, path, platformContextMenu, ref, ref1, ref2, remote, validateSelector;

  path = require('path');

  CSON = require('season');

  fs = require('fs-plus');

  ref = require('clear-cut'), calculateSpecificity = ref.calculateSpecificity, validateSelector = ref.validateSelector;

  Disposable = require('event-kit').Disposable;

  remote = require('electron').remote;

  MenuHelpers = require('./menu-helpers');

  platformContextMenu = (ref1 = require('../package.json')) != null ? (ref2 = ref1._atomMenu) != null ? ref2['context-menu'] : void 0 : void 0;

  module.exports = ContextMenuManager = (function() {
    function ContextMenuManager(arg) {
      this.resourcePath = arg.resourcePath, this.devMode = arg.devMode, this.keymapManager = arg.keymapManager;
      this.definitions = {
        '.overlayer': []
      };
      this.clear();
      this.keymapManager.onDidLoadBundledKeymaps((function(_this) {
        return function() {
          return _this.loadPlatformItems();
        };
      })(this));
    }

    ContextMenuManager.prototype.loadPlatformItems = function() {
      var map, menusDirPath, platformMenuPath;
      if (platformContextMenu != null) {
        return this.add(platformContextMenu);
      } else {
        menusDirPath = path.join(this.resourcePath, 'menus');
        platformMenuPath = fs.resolve(menusDirPath, process.platform, ['cson', 'json']);
        map = CSON.readFileSync(platformMenuPath);
        return this.add(map['context-menu']);
      }
    };

    ContextMenuManager.prototype.add = function(itemsBySelector) {
      var addedItemSets, itemSet, items, selector;
      addedItemSets = [];
      for (selector in itemsBySelector) {
        items = itemsBySelector[selector];
        validateSelector(selector);
        itemSet = new ContextMenuItemSet(selector, items);
        addedItemSets.push(itemSet);
        this.itemSets.push(itemSet);
      }
      return new Disposable((function(_this) {
        return function() {
          var i, len;
          for (i = 0, len = addedItemSets.length; i < len; i++) {
            itemSet = addedItemSets[i];
            _this.itemSets.splice(_this.itemSets.indexOf(itemSet), 1);
          }
        };
      })(this));
    };

    ContextMenuManager.prototype.templateForElement = function(target) {
      return this.templateForEvent({
        target: target
      });
    };

    ContextMenuManager.prototype.templateForEvent = function(event) {
      var currentTarget, currentTargetItems, i, item, itemForEvent, itemSet, j, k, len, len1, len2, matchingItemSets, ref3, template;
      template = [];
      currentTarget = event.target;
      while (currentTarget != null) {
        currentTargetItems = [];
        matchingItemSets = this.itemSets.filter(function(itemSet) {
          return currentTarget.webkitMatchesSelector(itemSet.selector);
        });
        for (i = 0, len = matchingItemSets.length; i < len; i++) {
          itemSet = matchingItemSets[i];
          ref3 = itemSet.items;
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            item = ref3[j];
            itemForEvent = this.cloneItemForEvent(item, event);
            if (itemForEvent) {
              MenuHelpers.merge(currentTargetItems, itemForEvent, itemSet.specificity);
            }
          }
        }
        for (k = 0, len2 = currentTargetItems.length; k < len2; k++) {
          item = currentTargetItems[k];
          MenuHelpers.merge(template, item, false);
        }
        currentTarget = currentTarget.parentElement;
      }
      this.pruneRedundantSeparators(template);
      return template;
    };

    ContextMenuManager.prototype.pruneRedundantSeparators = function(menu) {
      var index, keepNextItemIfSeparator, results;
      keepNextItemIfSeparator = false;
      index = 0;
      results = [];
      while (index < menu.length) {
        if (menu[index].type === 'separator') {
          if (!keepNextItemIfSeparator || index === menu.length - 1) {
            results.push(menu.splice(index, 1));
          } else {
            results.push(index++);
          }
        } else {
          keepNextItemIfSeparator = true;
          results.push(index++);
        }
      }
      return results;
    };

    ContextMenuManager.prototype.cloneItemForEvent = function(item, event) {
      if (item.devMode && !this.devMode) {
        return null;
      }
      item = Object.create(item);
      if (typeof item.shouldDisplay === 'function') {
        if (!item.shouldDisplay(event)) {
          return null;
        }
      }
      if (typeof item.created === "function") {
        item.created(event);
      }
      if (Array.isArray(item.submenu)) {
        item.submenu = item.submenu.map((function(_this) {
          return function(submenuItem) {
            return _this.cloneItemForEvent(submenuItem, event);
          };
        })(this)).filter(function(submenuItem) {
          return submenuItem !== null;
        });
      }
      return item;
    };

    ContextMenuManager.prototype.convertLegacyItemsBySelector = function(legacyItemsBySelector, devMode) {
      var commandsByLabel, itemsBySelector, selector;
      itemsBySelector = {};
      for (selector in legacyItemsBySelector) {
        commandsByLabel = legacyItemsBySelector[selector];
        itemsBySelector[selector] = this.convertLegacyItems(commandsByLabel, devMode);
      }
      return itemsBySelector;
    };

    ContextMenuManager.prototype.convertLegacyItems = function(legacyItems, devMode) {
      var commandOrSubmenu, items, label;
      items = [];
      for (label in legacyItems) {
        commandOrSubmenu = legacyItems[label];
        if (typeof commandOrSubmenu === 'object') {
          items.push({
            label: label,
            submenu: this.convertLegacyItems(commandOrSubmenu, devMode),
            devMode: devMode
          });
        } else if (commandOrSubmenu === '-') {
          items.push({
            type: 'separator'
          });
        } else {
          items.push({
            label: label,
            command: commandOrSubmenu,
            devMode: devMode
          });
        }
      }
      return items;
    };

    ContextMenuManager.prototype.showForEvent = function(event) {
      var menuTemplate;
      this.activeElement = event.target;
      menuTemplate = this.templateForEvent(event);
      if (!((menuTemplate != null ? menuTemplate.length : void 0) > 0)) {
        return;
      }
      remote.getCurrentWindow().emit('context-menu', menuTemplate);
    };

    ContextMenuManager.prototype.clear = function() {
      this.activeElement = null;
      this.itemSets = [];
      return this.add({
        'atom-workspace': [
          {
            label: 'Inspect Element',
            command: 'application:inspect',
            devMode: true,
            created: function(event) {
              var pageX, pageY;
              pageX = event.pageX, pageY = event.pageY;
              return this.commandDetail = {
                x: pageX,
                y: pageY
              };
            }
          }
        ]
      });
    };

    return ContextMenuManager;

  })();

  ContextMenuItemSet = (function() {
    function ContextMenuItemSet(selector1, items1) {
      this.selector = selector1;
      this.items = items1;
      this.specificity = calculateSpecificity(this.selector);
    }

    return ContextMenuItemSet;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jb250ZXh0LW1lbnUtbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQTJDLE9BQUEsQ0FBUSxXQUFSLENBQTNDLEVBQUMsK0NBQUQsRUFBdUI7O0VBQ3RCLGFBQWMsT0FBQSxDQUFRLFdBQVI7O0VBQ2QsU0FBVSxPQUFBLENBQVEsVUFBUjs7RUFDWCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUVkLG1CQUFBLHVGQUE2RCxDQUFBLGNBQUE7O0VBZ0M3RCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsNEJBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxtQkFBQSxjQUFjLElBQUMsQ0FBQSxjQUFBLFNBQVMsSUFBQyxDQUFBLG9CQUFBO01BQ3ZDLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFBQyxZQUFBLEVBQWMsRUFBZjs7TUFDZixJQUFDLENBQUEsS0FBRCxDQUFBO01BRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyx1QkFBZixDQUF1QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGlCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkM7SUFKVzs7aUNBTWIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsSUFBRywyQkFBSDtlQUNFLElBQUMsQ0FBQSxHQUFELENBQUssbUJBQUwsRUFERjtPQUFBLE1BQUE7UUFHRSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsWUFBWCxFQUF5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QjtJQURKOzs7OztBQTFOZiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuQ1NPTiA9IHJlcXVpcmUgJ3NlYXNvbidcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntjYWxjdWxhdGVTcGVjaWZpY2l0eSwgdmFsaWRhdGVTZWxlY3Rvcn0gPSByZXF1aXJlICdjbGVhci1jdXQnXG57RGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG57cmVtb3RlfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuTWVudUhlbHBlcnMgPSByZXF1aXJlICcuL21lbnUtaGVscGVycydcblxucGxhdGZvcm1Db250ZXh0TWVudSA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpPy5fYXRvbU1lbnU/Wydjb250ZXh0LW1lbnUnXVxuXG4jIEV4dGVuZGVkOiBQcm92aWRlcyBhIHJlZ2lzdHJ5IGZvciBjb21tYW5kcyB0aGF0IHlvdSdkIGxpa2UgdG8gYXBwZWFyIGluIHRoZVxuIyBjb250ZXh0IG1lbnUuXG4jXG4jIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20uY29udGV4dE1lbnVgXG4jIGdsb2JhbC5cbiNcbiMgIyMgQ29udGV4dCBNZW51IENTT04gRm9ybWF0XG4jXG4jIGBgYGNvZmZlZVxuIyAnYXRvbS13b3Jrc3BhY2UnOiBbe2xhYmVsOiAnSGVscCcsIGNvbW1hbmQ6ICdhcHBsaWNhdGlvbjpvcGVuLWRvY3VtZW50YXRpb24nfV1cbiMgJ2F0b20tdGV4dC1lZGl0b3InOiBbe1xuIyAgIGxhYmVsOiAnSGlzdG9yeScsXG4jICAgc3VibWVudTogW1xuIyAgICAge2xhYmVsOiAnVW5kbycsIGNvbW1hbmQ6J2NvcmU6dW5kbyd9XG4jICAgICB7bGFiZWw6ICdSZWRvJywgY29tbWFuZDonY29yZTpyZWRvJ31cbiMgICBdXG4jIH1dXG4jIGBgYFxuI1xuIyBJbiB5b3VyIHBhY2thZ2UncyBtZW51IGAuY3NvbmAgZmlsZSB5b3UgbmVlZCB0byBzcGVjaWZ5IGl0IHVuZGVyIGFcbiMgYGNvbnRleHQtbWVudWAga2V5OlxuI1xuIyBgYGBjb2ZmZWVcbiMgJ2NvbnRleHQtbWVudSc6XG4jICAgJ2F0b20td29ya3NwYWNlJzogW3tsYWJlbDogJ0hlbHAnLCBjb21tYW5kOiAnYXBwbGljYXRpb246b3Blbi1kb2N1bWVudGF0aW9uJ31dXG4jICAgLi4uXG4jIGBgYFxuI1xuIyBUaGUgZm9ybWF0IGZvciB1c2UgaW4gezo6YWRkfSBpcyB0aGUgc2FtZSBtaW51cyB0aGUgYGNvbnRleHQtbWVudWAga2V5LiBTZWVcbiMgezo6YWRkfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvbnRleHRNZW51TWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKHtAcmVzb3VyY2VQYXRoLCBAZGV2TW9kZSwgQGtleW1hcE1hbmFnZXJ9KSAtPlxuICAgIEBkZWZpbml0aW9ucyA9IHsnLm92ZXJsYXllcic6IFtdfSAjIFRPRE86IFJlbW92ZSBvbmNlIGNvbG9yIHBpY2tlciBwYWNrYWdlIHN0b3BzIHRvdWNoaW5nIHByaXZhdGUgZGF0YVxuICAgIEBjbGVhcigpXG5cbiAgICBAa2V5bWFwTWFuYWdlci5vbkRpZExvYWRCdW5kbGVkS2V5bWFwcyA9PiBAbG9hZFBsYXRmb3JtSXRlbXMoKVxuXG4gIGxvYWRQbGF0Zm9ybUl0ZW1zOiAtPlxuICAgIGlmIHBsYXRmb3JtQ29udGV4dE1lbnU/XG4gICAgICBAYWRkKHBsYXRmb3JtQ29udGV4dE1lbnUpXG4gICAgZWxzZVxuICAgICAgbWVudXNEaXJQYXRoID0gcGF0aC5qb2luKEByZXNvdXJjZVBhdGgsICdtZW51cycpXG4gICAgICBwbGF0Zm9ybU1lbnVQYXRoID0gZnMucmVzb2x2ZShtZW51c0RpclBhdGgsIHByb2Nlc3MucGxhdGZvcm0sIFsnY3NvbicsICdqc29uJ10pXG4gICAgICBtYXAgPSBDU09OLnJlYWRGaWxlU3luYyhwbGF0Zm9ybU1lbnVQYXRoKVxuICAgICAgQGFkZChtYXBbJ2NvbnRleHQtbWVudSddKVxuXG4gICMgUHVibGljOiBBZGQgY29udGV4dCBtZW51IGl0ZW1zIHNjb3BlZCBieSBDU1Mgc2VsZWN0b3JzLlxuICAjXG4gICMgIyMgRXhhbXBsZXNcbiAgI1xuICAjIFRvIGFkZCBhIGNvbnRleHQgbWVudSwgcGFzcyBhIHNlbGVjdG9yIG1hdGNoaW5nIHRoZSBlbGVtZW50cyB0byB3aGljaCB5b3VcbiAgIyB3YW50IHRoZSBtZW51IHRvIGFwcGx5IGFzIHRoZSB0b3AgbGV2ZWwga2V5LCBmb2xsb3dlZCBieSBhIG1lbnUgZGVzY3JpcHRvci5cbiAgIyBUaGUgaW52b2NhdGlvbiBiZWxvdyBhZGRzIGEgZ2xvYmFsICdIZWxwJyBjb250ZXh0IG1lbnUgaXRlbSBhbmQgYSAnSGlzdG9yeSdcbiAgIyBzdWJtZW51IG9uIHRoZSBlZGl0b3Igc3VwcG9ydGluZyB1bmRvL3JlZG8uIFRoaXMgaXMganVzdCBmb3IgZXhhbXBsZVxuICAjIHB1cnBvc2VzIGFuZCBub3QgdGhlIHdheSB0aGUgbWVudSBpcyBhY3R1YWxseSBjb25maWd1cmVkIGluIEF0b20gYnkgZGVmYXVsdC5cbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIGF0b20uY29udGV4dE1lbnUuYWRkIHtcbiAgIyAgICdhdG9tLXdvcmtzcGFjZSc6IFt7bGFiZWw6ICdIZWxwJywgY29tbWFuZDogJ2FwcGxpY2F0aW9uOm9wZW4tZG9jdW1lbnRhdGlvbid9XVxuICAjICAgJ2F0b20tdGV4dC1lZGl0b3InOiBbe1xuICAjICAgICBsYWJlbDogJ0hpc3RvcnknLFxuICAjICAgICBzdWJtZW51OiBbXG4gICMgICAgICAge2xhYmVsOiAnVW5kbycsIGNvbW1hbmQ6J2NvcmU6dW5kbyd9XG4gICMgICAgICAge2xhYmVsOiAnUmVkbycsIGNvbW1hbmQ6J2NvcmU6cmVkbyd9XG4gICMgICAgIF1cbiAgIyAgIH1dXG4gICMgfVxuICAjIGBgYFxuICAjXG4gICMgIyMgQXJndW1lbnRzXG4gICNcbiAgIyAqIGBpdGVtc0J5U2VsZWN0b3JgIEFuIHtPYmplY3R9IHdob3NlIGtleXMgYXJlIENTUyBzZWxlY3RvcnMgYW5kIHdob3NlXG4gICMgICB2YWx1ZXMgYXJlIHtBcnJheX1zIG9mIGl0ZW0ge09iamVjdH1zIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgbGFiZWxgIChvcHRpb25hbCkgQSB7U3RyaW5nfSBjb250YWluaW5nIHRoZSBtZW51IGl0ZW0ncyBsYWJlbC5cbiAgIyAgICogYGNvbW1hbmRgIChvcHRpb25hbCkgQSB7U3RyaW5nfSBjb250YWluaW5nIHRoZSBjb21tYW5kIHRvIGludm9rZSBvbiB0aGVcbiAgIyAgICAgdGFyZ2V0IG9mIHRoZSByaWdodCBjbGljayB0aGF0IGludm9rZWQgdGhlIGNvbnRleHQgbWVudS5cbiAgIyAgICogYGVuYWJsZWRgIChvcHRpb25hbCkgQSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBtZW51IGl0ZW1cbiAgIyAgICAgc2hvdWxkIGJlIGNsaWNrYWJsZS4gRGlzYWJsZWQgbWVudSBpdGVtcyB0eXBpY2FsbHkgYXBwZWFyIGdyYXllZCBvdXQuXG4gICMgICAgIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgIyAgICogYHN1Ym1lbnVgIChvcHRpb25hbCkgQW4ge0FycmF5fSBvZiBhZGRpdGlvbmFsIGl0ZW1zLlxuICAjICAgKiBgdHlwZWAgKG9wdGlvbmFsKSBJZiB5b3Ugd2FudCB0byBjcmVhdGUgYSBzZXBhcmF0b3IsIHByb3ZpZGUgYW4gaXRlbVxuICAjICAgICAgd2l0aCBgdHlwZTogJ3NlcGFyYXRvcidgIGFuZCBubyBvdGhlciBrZXlzLlxuICAjICAgKiBgdmlzaWJsZWAgKG9wdGlvbmFsKSBBIHtCb29sZWFufSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIG1lbnUgaXRlbVxuICAjICAgICBzaG91bGQgYXBwZWFyIGluIHRoZSBtZW51LiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICMgICAqIGBjcmVhdGVkYCAob3B0aW9uYWwpIEEge0Z1bmN0aW9ufSB0aGF0IGlzIGNhbGxlZCBvbiB0aGUgaXRlbSBlYWNoIHRpbWUgYVxuICAjICAgICBjb250ZXh0IG1lbnUgaXMgY3JlYXRlZCB2aWEgYSByaWdodCBjbGljay4gWW91IGNhbiBhc3NpZ24gcHJvcGVydGllcyB0b1xuICAjICAgIGB0aGlzYCB0byBkeW5hbWljYWxseSBjb21wdXRlIHRoZSBjb21tYW5kLCBsYWJlbCwgZXRjLiBUaGlzIG1ldGhvZCBpc1xuICAjICAgIGFjdHVhbGx5IGNhbGxlZCBvbiBhIGNsb25lIG9mIHRoZSBvcmlnaW5hbCBpdGVtIHRlbXBsYXRlIHRvIHByZXZlbnQgc3RhdGVcbiAgIyAgICBmcm9tIGxlYWtpbmcgYWNyb3NzIGNvbnRleHQgbWVudSBkZXBsb3ltZW50cy4gQ2FsbGVkIHdpdGggdGhlIGZvbGxvd2luZ1xuICAjICAgIGFyZ3VtZW50OlxuICAjICAgICAqIGBldmVudGAgVGhlIGNsaWNrIGV2ZW50IHRoYXQgZGVwbG95ZWQgdGhlIGNvbnRleHQgbWVudS5cbiAgIyAgICogYHNob3VsZERpc3BsYXlgIChvcHRpb25hbCkgQSB7RnVuY3Rpb259IHRoYXQgaXMgY2FsbGVkIHRvIGRldGVybWluZVxuICAjICAgICB3aGV0aGVyIHRvIGRpc3BsYXkgdGhpcyBpdGVtIG9uIGEgZ2l2ZW4gY29udGV4dCBtZW51IGRlcGxveW1lbnQuIENhbGxlZFxuICAjICAgICB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnQ6XG4gICMgICAgICogYGV2ZW50YCBUaGUgY2xpY2sgZXZlbnQgdGhhdCBkZXBsb3llZCB0aGUgY29udGV4dCBtZW51LlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byByZW1vdmUgdGhlXG4gICMgYWRkZWQgbWVudSBpdGVtcy5cbiAgYWRkOiAoaXRlbXNCeVNlbGVjdG9yKSAtPlxuICAgIGFkZGVkSXRlbVNldHMgPSBbXVxuXG4gICAgZm9yIHNlbGVjdG9yLCBpdGVtcyBvZiBpdGVtc0J5U2VsZWN0b3JcbiAgICAgIHZhbGlkYXRlU2VsZWN0b3Ioc2VsZWN0b3IpXG4gICAgICBpdGVtU2V0ID0gbmV3IENvbnRleHRNZW51SXRlbVNldChzZWxlY3RvciwgaXRlbXMpXG4gICAgICBhZGRlZEl0ZW1TZXRzLnB1c2goaXRlbVNldClcbiAgICAgIEBpdGVtU2V0cy5wdXNoKGl0ZW1TZXQpXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgZm9yIGl0ZW1TZXQgaW4gYWRkZWRJdGVtU2V0c1xuICAgICAgICBAaXRlbVNldHMuc3BsaWNlKEBpdGVtU2V0cy5pbmRleE9mKGl0ZW1TZXQpLCAxKVxuICAgICAgcmV0dXJuXG5cbiAgdGVtcGxhdGVGb3JFbGVtZW50OiAodGFyZ2V0KSAtPlxuICAgIEB0ZW1wbGF0ZUZvckV2ZW50KHt0YXJnZXR9KVxuXG4gIHRlbXBsYXRlRm9yRXZlbnQ6IChldmVudCkgLT5cbiAgICB0ZW1wbGF0ZSA9IFtdXG4gICAgY3VycmVudFRhcmdldCA9IGV2ZW50LnRhcmdldFxuXG4gICAgd2hpbGUgY3VycmVudFRhcmdldD9cbiAgICAgIGN1cnJlbnRUYXJnZXRJdGVtcyA9IFtdXG4gICAgICBtYXRjaGluZ0l0ZW1TZXRzID1cbiAgICAgICAgQGl0ZW1TZXRzLmZpbHRlciAoaXRlbVNldCkgLT4gY3VycmVudFRhcmdldC53ZWJraXRNYXRjaGVzU2VsZWN0b3IoaXRlbVNldC5zZWxlY3RvcilcblxuICAgICAgZm9yIGl0ZW1TZXQgaW4gbWF0Y2hpbmdJdGVtU2V0c1xuICAgICAgICBmb3IgaXRlbSBpbiBpdGVtU2V0Lml0ZW1zXG4gICAgICAgICAgaXRlbUZvckV2ZW50ID0gQGNsb25lSXRlbUZvckV2ZW50KGl0ZW0sIGV2ZW50KVxuICAgICAgICAgIGlmIGl0ZW1Gb3JFdmVudFxuICAgICAgICAgICAgTWVudUhlbHBlcnMubWVyZ2UoY3VycmVudFRhcmdldEl0ZW1zLCBpdGVtRm9yRXZlbnQsIGl0ZW1TZXQuc3BlY2lmaWNpdHkpXG5cbiAgICAgIGZvciBpdGVtIGluIGN1cnJlbnRUYXJnZXRJdGVtc1xuICAgICAgICBNZW51SGVscGVycy5tZXJnZSh0ZW1wbGF0ZSwgaXRlbSwgZmFsc2UpXG5cbiAgICAgIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LnBhcmVudEVsZW1lbnRcblxuICAgIEBwcnVuZVJlZHVuZGFudFNlcGFyYXRvcnModGVtcGxhdGUpXG5cbiAgICB0ZW1wbGF0ZVxuXG4gIHBydW5lUmVkdW5kYW50U2VwYXJhdG9yczogKG1lbnUpIC0+XG4gICAga2VlcE5leHRJdGVtSWZTZXBhcmF0b3IgPSBmYWxzZVxuICAgIGluZGV4ID0gMFxuICAgIHdoaWxlIGluZGV4IDwgbWVudS5sZW5ndGhcbiAgICAgIGlmIG1lbnVbaW5kZXhdLnR5cGUgaXMgJ3NlcGFyYXRvcidcbiAgICAgICAgaWYgbm90IGtlZXBOZXh0SXRlbUlmU2VwYXJhdG9yIG9yIGluZGV4IGlzIG1lbnUubGVuZ3RoIC0gMVxuICAgICAgICAgIG1lbnUuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaW5kZXgrK1xuICAgICAgZWxzZVxuICAgICAgICBrZWVwTmV4dEl0ZW1JZlNlcGFyYXRvciA9IHRydWVcbiAgICAgICAgaW5kZXgrK1xuXG4gICMgUmV0dXJucyBhbiBvYmplY3QgY29tcGF0aWJsZSB3aXRoIGA6OmFkZCgpYCBvciBgbnVsbGAuXG4gIGNsb25lSXRlbUZvckV2ZW50OiAoaXRlbSwgZXZlbnQpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgaXRlbS5kZXZNb2RlIGFuZCBub3QgQGRldk1vZGVcbiAgICBpdGVtID0gT2JqZWN0LmNyZWF0ZShpdGVtKVxuICAgIGlmIHR5cGVvZiBpdGVtLnNob3VsZERpc3BsYXkgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgcmV0dXJuIG51bGwgdW5sZXNzIGl0ZW0uc2hvdWxkRGlzcGxheShldmVudClcbiAgICBpdGVtLmNyZWF0ZWQ/KGV2ZW50KVxuICAgIGlmIEFycmF5LmlzQXJyYXkoaXRlbS5zdWJtZW51KVxuICAgICAgaXRlbS5zdWJtZW51ID0gaXRlbS5zdWJtZW51XG4gICAgICAgIC5tYXAoKHN1Ym1lbnVJdGVtKSA9PiBAY2xvbmVJdGVtRm9yRXZlbnQoc3VibWVudUl0ZW0sIGV2ZW50KSlcbiAgICAgICAgLmZpbHRlcigoc3VibWVudUl0ZW0pIC0+IHN1Ym1lbnVJdGVtIGlzbnQgbnVsbClcbiAgICByZXR1cm4gaXRlbVxuXG4gIGNvbnZlcnRMZWdhY3lJdGVtc0J5U2VsZWN0b3I6IChsZWdhY3lJdGVtc0J5U2VsZWN0b3IsIGRldk1vZGUpIC0+XG4gICAgaXRlbXNCeVNlbGVjdG9yID0ge31cblxuICAgIGZvciBzZWxlY3RvciwgY29tbWFuZHNCeUxhYmVsIG9mIGxlZ2FjeUl0ZW1zQnlTZWxlY3RvclxuICAgICAgaXRlbXNCeVNlbGVjdG9yW3NlbGVjdG9yXSA9IEBjb252ZXJ0TGVnYWN5SXRlbXMoY29tbWFuZHNCeUxhYmVsLCBkZXZNb2RlKVxuXG4gICAgaXRlbXNCeVNlbGVjdG9yXG5cbiAgY29udmVydExlZ2FjeUl0ZW1zOiAobGVnYWN5SXRlbXMsIGRldk1vZGUpIC0+XG4gICAgaXRlbXMgPSBbXVxuXG4gICAgZm9yIGxhYmVsLCBjb21tYW5kT3JTdWJtZW51IG9mIGxlZ2FjeUl0ZW1zXG4gICAgICBpZiB0eXBlb2YgY29tbWFuZE9yU3VibWVudSBpcyAnb2JqZWN0J1xuICAgICAgICBpdGVtcy5wdXNoKHtsYWJlbCwgc3VibWVudTogQGNvbnZlcnRMZWdhY3lJdGVtcyhjb21tYW5kT3JTdWJtZW51LCBkZXZNb2RlKSwgZGV2TW9kZX0pXG4gICAgICBlbHNlIGlmIGNvbW1hbmRPclN1Ym1lbnUgaXMgJy0nXG4gICAgICAgIGl0ZW1zLnB1c2goe3R5cGU6ICdzZXBhcmF0b3InfSlcbiAgICAgIGVsc2VcbiAgICAgICAgaXRlbXMucHVzaCh7bGFiZWwsIGNvbW1hbmQ6IGNvbW1hbmRPclN1Ym1lbnUsIGRldk1vZGV9KVxuXG4gICAgaXRlbXNcblxuICBzaG93Rm9yRXZlbnQ6IChldmVudCkgLT5cbiAgICBAYWN0aXZlRWxlbWVudCA9IGV2ZW50LnRhcmdldFxuICAgIG1lbnVUZW1wbGF0ZSA9IEB0ZW1wbGF0ZUZvckV2ZW50KGV2ZW50KVxuXG4gICAgcmV0dXJuIHVubGVzcyBtZW51VGVtcGxhdGU/Lmxlbmd0aCA+IDBcbiAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLmVtaXQoJ2NvbnRleHQtbWVudScsIG1lbnVUZW1wbGF0ZSlcbiAgICByZXR1cm5cblxuICBjbGVhcjogLT5cbiAgICBAYWN0aXZlRWxlbWVudCA9IG51bGxcbiAgICBAaXRlbVNldHMgPSBbXVxuICAgIEBhZGQgJ2F0b20td29ya3NwYWNlJzogW3tcbiAgICAgIGxhYmVsOiAnSW5zcGVjdCBFbGVtZW50J1xuICAgICAgY29tbWFuZDogJ2FwcGxpY2F0aW9uOmluc3BlY3QnXG4gICAgICBkZXZNb2RlOiB0cnVlXG4gICAgICBjcmVhdGVkOiAoZXZlbnQpIC0+XG4gICAgICAgIHtwYWdlWCwgcGFnZVl9ID0gZXZlbnRcbiAgICAgICAgQGNvbW1hbmREZXRhaWwgPSB7eDogcGFnZVgsIHk6IHBhZ2VZfVxuICAgIH1dXG5cbmNsYXNzIENvbnRleHRNZW51SXRlbVNldFxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3RvciwgQGl0ZW1zKSAtPlxuICAgIEBzcGVjaWZpY2l0eSA9IGNhbGN1bGF0ZVNwZWNpZmljaXR5KEBzZWxlY3RvcilcbiJdfQ==
