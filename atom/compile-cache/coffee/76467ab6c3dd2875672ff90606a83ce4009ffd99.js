(function() {
  var CSON, Disposable, MenuHelpers, MenuManager, _, fs, ipcRenderer, path, platformMenu, ref, ref1;

  path = require('path');

  _ = require('underscore-plus');

  ipcRenderer = require('electron').ipcRenderer;

  CSON = require('season');

  fs = require('fs-plus');

  Disposable = require('event-kit').Disposable;

  MenuHelpers = require('./menu-helpers');

  platformMenu = (ref = require('../package.json')) != null ? (ref1 = ref._atomMenu) != null ? ref1.menu : void 0 : void 0;

  module.exports = MenuManager = (function() {
    function MenuManager(arg) {
      this.resourcePath = arg.resourcePath, this.keymapManager = arg.keymapManager, this.packageManager = arg.packageManager;
      this.pendingUpdateOperation = null;
      this.template = [];
      this.keymapManager.onDidLoadBundledKeymaps((function(_this) {
        return function() {
          return _this.loadPlatformItems();
        };
      })(this));
      this.keymapManager.onDidReloadKeymap((function(_this) {
        return function() {
          return _this.update();
        };
      })(this));
      this.packageManager.onDidActivateInitialPackages((function(_this) {
        return function() {
          return _this.sortPackagesMenu();
        };
      })(this));
    }

    MenuManager.prototype.add = function(items) {
      var i, item, len;
      items = _.deepClone(items);
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        this.merge(this.template, item);
      }
      this.update();
      return new Disposable((function(_this) {
        return function() {
          return _this.remove(items);
        };
      })(this));
    };

    MenuManager.prototype.remove = function(items) {
      var i, item, len;
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        this.unmerge(this.template, item);
      }
      return this.update();
    };

    MenuManager.prototype.clear = function() {
      this.template = [];
      return this.update();
    };

    MenuManager.prototype.includeSelector = function(selector) {
      var element, error, ref2, ref3, testBody, testDocument, testWorkspace, workspaceClasses;
      try {
        if (document.body.webkitMatchesSelector(selector)) {
          return true;
        }
      } catch (error1) {
        error = error1;
        return false;
      }
      if (this.testEditor == null) {
        testDocument = document.implementation.createDocument(document.namespaceURI, 'html');
        testBody = testDocument.createElement('body');
        (ref2 = testBody.classList).add.apply(ref2, this.classesForElement(document.body));
        testWorkspace = testDocument.createElement('atom-workspace');
        workspaceClasses = this.classesForElement(document.body.querySelector('atom-workspace'));
        if (workspaceClasses.length === 0) {
          workspaceClasses = ['workspace'];
        }
        (ref3 = testWorkspace.classList).add.apply(ref3, workspaceClasses);
        testBody.appendChild(testWorkspace);
        this.testEditor = testDocument.createElement('atom-text-editor');
        this.testEditor.classList.add('editor');
        testWorkspace.appendChild(this.testEditor);
      }
      element = this.testEditor;
      while (element) {
        if (element.webkitMatchesSelector(selector)) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    MenuManager.prototype.update = function() {
      if (this.pendingUpdateOperation != null) {
        clearImmediate(this.pendingUpdateOperation);
      }
      return this.pendingUpdateOperation = setImmediate((function(_this) {
        return function() {
          var binding, i, j, keystrokesByCommand, len, len1, name, ref2, ref3, unsetKeystrokes;
          unsetKeystrokes = new Set;
          ref2 = _this.keymapManager.getKeyBindings();
          for (i = 0, len = ref2.length; i < len; i++) {
            binding = ref2[i];
            if (binding.command === 'unset!') {
              unsetKeystrokes.add(binding.keystrokes);
            }
          }
          keystrokesByCommand = {};
          ref3 = _this.keymapManager.getKeyBindings();
          for (j = 0, len1 = ref3.length; j < len1; j++) {
            binding = ref3[j];
            if (!_this.includeSelector(binding.selector)) {
              continue;
            }
            if (unsetKeystrokes.has(binding.keystrokes)) {
              continue;
            }
            if (binding.keystrokes.includes(' ')) {
              continue;
            }
            if (process.platform === 'darwin' && /^alt-(shift-)?.$/.test(binding.keystrokes)) {
              continue;
            }
            if (process.platform === 'win32' && /^ctrl-alt-(shift-)?.$/.test(binding.keystrokes)) {
              continue;
            }
            if (keystrokesByCommand[name = binding.command] == null) {
              keystrokesByCommand[name] = [];
            }
            keystrokesByCommand[binding.command].unshift(binding.keystrokes);
          }
          return _this.sendToBrowserProcess(_this.template, keystrokesByCommand);
        };
      })(this));
    };

    MenuManager.prototype.loadPlatformItems = function() {
      var menu, menusDirPath, platformMenuPath;
      if (platformMenu != null) {
        return this.add(platformMenu);
      } else {
        menusDirPath = path.join(this.resourcePath, 'menus');
        platformMenuPath = fs.resolve(menusDirPath, process.platform, ['cson', 'json']);
        menu = CSON.readFileSync(platformMenuPath).menu;
        return this.add(menu);
      }
    };

    MenuManager.prototype.merge = function(menu, item) {
      return MenuHelpers.merge(menu, item);
    };

    MenuManager.prototype.unmerge = function(menu, item) {
      return MenuHelpers.unmerge(menu, item);
    };

    MenuManager.prototype.sendToBrowserProcess = function(template, keystrokesByCommand) {
      return ipcRenderer.send('update-application-menu', template, keystrokesByCommand);
    };

    MenuManager.prototype.classesForElement = function(element) {
      var classList;
      if (classList = element != null ? element.classList : void 0) {
        return Array.prototype.slice.apply(classList);
      } else {
        return [];
      }
    };

    MenuManager.prototype.sortPackagesMenu = function() {
      var packagesMenu;
      packagesMenu = _.find(this.template, function(arg) {
        var label;
        label = arg.label;
        return MenuHelpers.normalizeLabel(label) === 'Packages';
      });
      if ((packagesMenu != null ? packagesMenu.submenu : void 0) == null) {
        return;
      }
      packagesMenu.submenu.sort(function(item1, item2) {
        if (item1.label && item2.label) {
          return MenuHelpers.normalizeLabel(item1.label).localeCompare(MenuHelpers.normalizeLabel(item2.label));
        } else {
          return 0;
        }
      });
      return this.update();
    };

    return MenuManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tZW51LW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxjQUFlLE9BQUEsQ0FBUSxVQUFSOztFQUNoQixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNKLGFBQWMsT0FBQSxDQUFRLFdBQVI7O0VBRWYsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFFZCxZQUFBLHFGQUFvRCxDQUFFOztFQWlEdEQsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHFCQUFDLEdBQUQ7TUFBRSxJQUFDLENBQUEsbUJBQUEsY0FBYyxJQUFDLENBQUEsb0JBQUEsZUFBZSxJQUFDLENBQUEscUJBQUE7TUFDN0MsSUFBQyxDQUFBLHNCQUFELEdBQTBCO01BQzFCLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFDWixJQUFDLENBQUEsYUFBYSxDQUFDLHVCQUFmLENBQXVDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsaUJBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QztNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsaUJBQWYsQ0FBaUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxNQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakM7TUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLDRCQUFoQixDQUE2QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGdC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VyxDQUFDLGNBQVosQ0FBMkIsS0FBSyxDQUFDLEtBQWpDLENBQXRELEVBREY7U0FBQSxNQUFBO2lCQUdFLEVBSEY7O01BRHdCLENBQTFCO2FBS0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQVRnQjs7Ozs7QUEvTHBCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57aXBjUmVuZGVyZXJ9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5DU09OID0gcmVxdWlyZSAnc2Vhc29uJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xue0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5NZW51SGVscGVycyA9IHJlcXVpcmUgJy4vbWVudS1oZWxwZXJzJ1xuXG5wbGF0Zm9ybU1lbnUgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKT8uX2F0b21NZW51Py5tZW51XG5cbiMgRXh0ZW5kZWQ6IFByb3ZpZGVzIGEgcmVnaXN0cnkgZm9yIG1lbnUgaXRlbXMgdGhhdCB5b3UnZCBsaWtlIHRvIGFwcGVhciBpbiB0aGVcbiMgYXBwbGljYXRpb24gbWVudS5cbiNcbiMgQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS5tZW51YCBnbG9iYWwuXG4jXG4jICMjIE1lbnUgQ1NPTiBGb3JtYXRcbiNcbiMgSGVyZSBpcyBhbiBleGFtcGxlIGZyb20gdGhlIFt0cmVlLXZpZXddKGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL3RyZWUtdmlldy9ibG9iL21hc3Rlci9tZW51cy90cmVlLXZpZXcuY3Nvbik6XG4jXG4jIGBgYGNvZmZlZVxuIyBbXG4jICAge1xuIyAgICAgJ2xhYmVsJzogJ1ZpZXcnXG4jICAgICAnc3VibWVudSc6IFtcbiMgICAgICAgeyAnbGFiZWwnOiAnVG9nZ2xlIFRyZWUgVmlldycsICdjb21tYW5kJzogJ3RyZWUtdmlldzp0b2dnbGUnIH1cbiMgICAgIF1cbiMgICB9XG4jICAge1xuIyAgICAgJ2xhYmVsJzogJ1BhY2thZ2VzJ1xuIyAgICAgJ3N1Ym1lbnUnOiBbXG4jICAgICAgICdsYWJlbCc6ICdUcmVlIFZpZXcnXG4jICAgICAgICdzdWJtZW51JzogW1xuIyAgICAgICAgIHsgJ2xhYmVsJzogJ0ZvY3VzJywgJ2NvbW1hbmQnOiAndHJlZS12aWV3OnRvZ2dsZS1mb2N1cycgfVxuIyAgICAgICAgIHsgJ2xhYmVsJzogJ1RvZ2dsZScsICdjb21tYW5kJzogJ3RyZWUtdmlldzp0b2dnbGUnIH1cbiMgICAgICAgICB7ICdsYWJlbCc6ICdSZXZlYWwgQWN0aXZlIEZpbGUnLCAnY29tbWFuZCc6ICd0cmVlLXZpZXc6cmV2ZWFsLWFjdGl2ZS1maWxlJyB9XG4jICAgICAgICAgeyAnbGFiZWwnOiAnVG9nZ2xlIFRyZWUgU2lkZScsICdjb21tYW5kJzogJ3RyZWUtdmlldzp0b2dnbGUtc2lkZScgfVxuIyAgICAgICBdXG4jICAgICBdXG4jICAgfVxuIyBdXG4jIGBgYFxuI1xuIyBVc2UgaW4geW91ciBwYWNrYWdlJ3MgbWVudSBgLmNzb25gIGZpbGUgcmVxdWlyZXMgdGhhdCB5b3UgcGxhY2UgeW91ciBtZW51XG4jIHN0cnVjdHVyZSB1bmRlciBhIGBtZW51YCBrZXkuXG4jXG4jIGBgYGNvZmZlZVxuIyAnbWVudSc6IFtcbiMgICB7XG4jICAgICAnbGFiZWwnOiAnVmlldydcbiMgICAgICdzdWJtZW51JzogW1xuIyAgICAgICB7ICdsYWJlbCc6ICdUb2dnbGUgVHJlZSBWaWV3JywgJ2NvbW1hbmQnOiAndHJlZS12aWV3OnRvZ2dsZScgfVxuIyAgICAgXVxuIyAgIH1cbiMgXVxuIyBgYGBcbiNcbiMgU2VlIHs6OmFkZH0gZm9yIG1vcmUgaW5mbyBhYm91dCBhZGRpbmcgbWVudSdzIGRpcmVjdGx5LlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgTWVudU1hbmFnZXJcbiAgY29uc3RydWN0b3I6ICh7QHJlc291cmNlUGF0aCwgQGtleW1hcE1hbmFnZXIsIEBwYWNrYWdlTWFuYWdlcn0pIC0+XG4gICAgQHBlbmRpbmdVcGRhdGVPcGVyYXRpb24gPSBudWxsXG4gICAgQHRlbXBsYXRlID0gW11cbiAgICBAa2V5bWFwTWFuYWdlci5vbkRpZExvYWRCdW5kbGVkS2V5bWFwcyA9PiBAbG9hZFBsYXRmb3JtSXRlbXMoKVxuICAgIEBrZXltYXBNYW5hZ2VyLm9uRGlkUmVsb2FkS2V5bWFwID0+IEB1cGRhdGUoKVxuICAgIEBwYWNrYWdlTWFuYWdlci5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzID0+IEBzb3J0UGFja2FnZXNNZW51KClcblxuICAjIFB1YmxpYzogQWRkcyB0aGUgZ2l2ZW4gaXRlbXMgdG8gdGhlIGFwcGxpY2F0aW9uIG1lbnUuXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjIGBgYGNvZmZlZVxuICAjICAgYXRvbS5tZW51LmFkZCBbXG4gICMgICAgIHtcbiAgIyAgICAgICBsYWJlbDogJ0hlbGxvJ1xuICAjICAgICAgIHN1Ym1lbnUgOiBbe2xhYmVsOiAnV29ybGQhJywgY29tbWFuZDogJ2hlbGxvOndvcmxkJ31dXG4gICMgICAgIH1cbiAgIyAgIF1cbiAgIyBgYGBcbiAgI1xuICAjICogYGl0ZW1zYCBBbiB7QXJyYXl9IG9mIG1lbnUgaXRlbSB7T2JqZWN0fXMgY29udGFpbmluZyB0aGUga2V5czpcbiAgIyAgICogYGxhYmVsYCBUaGUge1N0cmluZ30gbWVudSBsYWJlbC5cbiAgIyAgICogYHN1Ym1lbnVgIEFuIG9wdGlvbmFsIHtBcnJheX0gb2Ygc3ViIG1lbnUgaXRlbXMuXG4gICMgICAqIGBjb21tYW5kYCBBbiBvcHRpb25hbCB7U3RyaW5nfSBjb21tYW5kIHRvIHRyaWdnZXIgd2hlbiB0aGUgaXRlbSBpc1xuICAjICAgICBjbGlja2VkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byByZW1vdmUgdGhlXG4gICMgYWRkZWQgbWVudSBpdGVtcy5cbiAgYWRkOiAoaXRlbXMpIC0+XG4gICAgaXRlbXMgPSBfLmRlZXBDbG9uZShpdGVtcylcbiAgICBAbWVyZ2UoQHRlbXBsYXRlLCBpdGVtKSBmb3IgaXRlbSBpbiBpdGVtc1xuICAgIEB1cGRhdGUoKVxuICAgIG5ldyBEaXNwb3NhYmxlID0+IEByZW1vdmUoaXRlbXMpXG5cbiAgcmVtb3ZlOiAoaXRlbXMpIC0+XG4gICAgQHVubWVyZ2UoQHRlbXBsYXRlLCBpdGVtKSBmb3IgaXRlbSBpbiBpdGVtc1xuICAgIEB1cGRhdGUoKVxuXG4gIGNsZWFyOiAtPlxuICAgIEB0ZW1wbGF0ZSA9IFtdXG4gICAgQHVwZGF0ZSgpXG5cbiAgIyBTaG91bGQgdGhlIGJpbmRpbmcgZm9yIHRoZSBnaXZlbiBzZWxlY3RvciBiZSBpbmNsdWRlZCBpbiB0aGUgbWVudVxuICAjIGNvbW1hbmRzLlxuICAjXG4gICMgKiBgc2VsZWN0b3JgIEEge1N0cmluZ30gc2VsZWN0b3IgdG8gY2hlY2suXG4gICNcbiAgIyBSZXR1cm5zIGEge0Jvb2xlYW59LCB0cnVlIHRvIGluY2x1ZGUgdGhlIHNlbGVjdG9yLCBmYWxzZSBvdGhlcndpc2UuXG4gIGluY2x1ZGVTZWxlY3RvcjogKHNlbGVjdG9yKSAtPlxuICAgIHRyeVxuICAgICAgcmV0dXJuIHRydWUgaWYgZG9jdW1lbnQuYm9keS53ZWJraXRNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgICMgU2VsZWN0b3IgaXNuJ3QgdmFsaWRcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgIyBTaW11bGF0ZSBhbiBhdG9tLXRleHQtZWRpdG9yIGVsZW1lbnQgYXR0YWNoZWQgdG8gYSBhdG9tLXdvcmtzcGFjZSBlbGVtZW50IGF0dGFjaGVkXG4gICAgIyB0byBhIGJvZHkgZWxlbWVudCB0aGF0IGhhcyB0aGUgc2FtZSBjbGFzc2VzIGFzIHRoZSBjdXJyZW50IGJvZHkgZWxlbWVudC5cbiAgICB1bmxlc3MgQHRlc3RFZGl0b3I/XG4gICAgICAjIFVzZSBuZXcgZG9jdW1lbnQgc28gdGhhdCBjdXN0b20gZWxlbWVudHMgZG9uJ3QgYWN0dWFsbHkgZ2V0IGNyZWF0ZWRcbiAgICAgIHRlc3REb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KGRvY3VtZW50Lm5hbWVzcGFjZVVSSSwgJ2h0bWwnKVxuXG4gICAgICB0ZXN0Qm9keSA9IHRlc3REb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5JylcbiAgICAgIHRlc3RCb2R5LmNsYXNzTGlzdC5hZGQoQGNsYXNzZXNGb3JFbGVtZW50KGRvY3VtZW50LmJvZHkpLi4uKVxuXG4gICAgICB0ZXN0V29ya3NwYWNlID0gdGVzdERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20td29ya3NwYWNlJylcbiAgICAgIHdvcmtzcGFjZUNsYXNzZXMgPSBAY2xhc3Nlc0ZvckVsZW1lbnQoZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCdhdG9tLXdvcmtzcGFjZScpKVxuICAgICAgd29ya3NwYWNlQ2xhc3NlcyA9IFsnd29ya3NwYWNlJ10gaWYgd29ya3NwYWNlQ2xhc3Nlcy5sZW5ndGggaXMgMFxuICAgICAgdGVzdFdvcmtzcGFjZS5jbGFzc0xpc3QuYWRkKHdvcmtzcGFjZUNsYXNzZXMuLi4pXG5cbiAgICAgIHRlc3RCb2R5LmFwcGVuZENoaWxkKHRlc3RXb3Jrc3BhY2UpXG5cbiAgICAgIEB0ZXN0RWRpdG9yID0gdGVzdERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20tdGV4dC1lZGl0b3InKVxuICAgICAgQHRlc3RFZGl0b3IuY2xhc3NMaXN0LmFkZCgnZWRpdG9yJylcbiAgICAgIHRlc3RXb3Jrc3BhY2UuYXBwZW5kQ2hpbGQoQHRlc3RFZGl0b3IpXG5cbiAgICBlbGVtZW50ID0gQHRlc3RFZGl0b3JcbiAgICB3aGlsZSBlbGVtZW50XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBlbGVtZW50LndlYmtpdE1hdGNoZXNTZWxlY3RvcihzZWxlY3RvcilcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnRcblxuICAgIGZhbHNlXG5cbiAgIyBQdWJsaWM6IFJlZnJlc2hlcyB0aGUgY3VycmVudGx5IHZpc2libGUgbWVudS5cbiAgdXBkYXRlOiAtPlxuICAgIGNsZWFySW1tZWRpYXRlKEBwZW5kaW5nVXBkYXRlT3BlcmF0aW9uKSBpZiBAcGVuZGluZ1VwZGF0ZU9wZXJhdGlvbj9cblxuICAgIEBwZW5kaW5nVXBkYXRlT3BlcmF0aW9uID0gc2V0SW1tZWRpYXRlID0+XG4gICAgICB1bnNldEtleXN0cm9rZXMgPSBuZXcgU2V0XG4gICAgICBmb3IgYmluZGluZyBpbiBAa2V5bWFwTWFuYWdlci5nZXRLZXlCaW5kaW5ncygpXG4gICAgICAgIGlmIGJpbmRpbmcuY29tbWFuZCBpcyAndW5zZXQhJ1xuICAgICAgICAgIHVuc2V0S2V5c3Ryb2tlcy5hZGQoYmluZGluZy5rZXlzdHJva2VzKVxuXG4gICAgICBrZXlzdHJva2VzQnlDb21tYW5kID0ge31cbiAgICAgIGZvciBiaW5kaW5nIGluIEBrZXltYXBNYW5hZ2VyLmdldEtleUJpbmRpbmdzKClcbiAgICAgICAgY29udGludWUgdW5sZXNzIEBpbmNsdWRlU2VsZWN0b3IoYmluZGluZy5zZWxlY3RvcilcbiAgICAgICAgY29udGludWUgaWYgdW5zZXRLZXlzdHJva2VzLmhhcyhiaW5kaW5nLmtleXN0cm9rZXMpXG4gICAgICAgIGNvbnRpbnVlIGlmIGJpbmRpbmcua2V5c3Ryb2tlcy5pbmNsdWRlcygnICcpXG4gICAgICAgIGNvbnRpbnVlIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbicgYW5kIC9eYWx0LShzaGlmdC0pPy4kLy50ZXN0KGJpbmRpbmcua2V5c3Ryb2tlcylcbiAgICAgICAgY29udGludWUgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInIGFuZCAvXmN0cmwtYWx0LShzaGlmdC0pPy4kLy50ZXN0KGJpbmRpbmcua2V5c3Ryb2tlcylcbiAgICAgICAga2V5c3Ryb2tlc0J5Q29tbWFuZFtiaW5kaW5nLmNvbW1hbmRdID89IFtdXG4gICAgICAgIGtleXN0cm9rZXNCeUNvbW1hbmRbYmluZGluZy5jb21tYW5kXS51bnNoaWZ0IGJpbmRpbmcua2V5c3Ryb2tlc1xuXG4gICAgICBAc2VuZFRvQnJvd3NlclByb2Nlc3MoQHRlbXBsYXRlLCBrZXlzdHJva2VzQnlDb21tYW5kKVxuXG4gIGxvYWRQbGF0Zm9ybUl0ZW1zOiAtPlxuICAgIGlmIHBsYXRmb3JtTWVudT9cbiAgICAgIEBhZGQocGxhdGZvcm1NZW51KVxuICAgIGVsc2VcbiAgICAgIG1lbnVzRGlyUGF0aCA9IHBhdGguam9pbihAcmVzb3VyY2VQYXRoLCAnbWVudXMnKVxuICAgICAgcGxhdGZvcm1NZW51UGF0aCA9IGZzLnJlc29sdmUobWVudXNEaXJQYXRoLCBwcm9jZXNzLnBsYXRmb3JtLCBbJ2Nzb24nLCAnanNvbiddKVxuICAgICAge21lbnV9ID0gQ1NPTi5yZWFkRmlsZVN5bmMocGxhdGZvcm1NZW51UGF0aClcbiAgICAgIEBhZGQobWVudSlcblxuICAjIE1lcmdlcyBhbiBpdGVtIGluIGEgc3VibWVudSBhd2FyZSB3YXkgc3VjaCB0aGF0IG5ldyBpdGVtcyBhcmUgYWx3YXlzXG4gICMgYXBwZW5kZWQgdG8gdGhlIGJvdHRvbSBvZiBleGlzdGluZyBtZW51cyB3aGVyZSBwb3NzaWJsZS5cbiAgbWVyZ2U6IChtZW51LCBpdGVtKSAtPlxuICAgIE1lbnVIZWxwZXJzLm1lcmdlKG1lbnUsIGl0ZW0pXG5cbiAgdW5tZXJnZTogKG1lbnUsIGl0ZW0pIC0+XG4gICAgTWVudUhlbHBlcnMudW5tZXJnZShtZW51LCBpdGVtKVxuXG4gIHNlbmRUb0Jyb3dzZXJQcm9jZXNzOiAodGVtcGxhdGUsIGtleXN0cm9rZXNCeUNvbW1hbmQpIC0+XG4gICAgaXBjUmVuZGVyZXIuc2VuZCAndXBkYXRlLWFwcGxpY2F0aW9uLW1lbnUnLCB0ZW1wbGF0ZSwga2V5c3Ryb2tlc0J5Q29tbWFuZFxuXG4gICMgR2V0IGFuIHtBcnJheX0gb2Yge1N0cmluZ30gY2xhc3NlcyBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gIGNsYXNzZXNGb3JFbGVtZW50OiAoZWxlbWVudCkgLT5cbiAgICBpZiBjbGFzc0xpc3QgPSBlbGVtZW50Py5jbGFzc0xpc3RcbiAgICAgIEFycmF5OjpzbGljZS5hcHBseShjbGFzc0xpc3QpXG4gICAgZWxzZVxuICAgICAgW11cblxuICBzb3J0UGFja2FnZXNNZW51OiAtPlxuICAgIHBhY2thZ2VzTWVudSA9IF8uZmluZCBAdGVtcGxhdGUsICh7bGFiZWx9KSAtPiBNZW51SGVscGVycy5ub3JtYWxpemVMYWJlbChsYWJlbCkgaXMgJ1BhY2thZ2VzJ1xuICAgIHJldHVybiB1bmxlc3MgcGFja2FnZXNNZW51Py5zdWJtZW51P1xuXG4gICAgcGFja2FnZXNNZW51LnN1Ym1lbnUuc29ydCAoaXRlbTEsIGl0ZW0yKSAtPlxuICAgICAgaWYgaXRlbTEubGFiZWwgYW5kIGl0ZW0yLmxhYmVsXG4gICAgICAgIE1lbnVIZWxwZXJzLm5vcm1hbGl6ZUxhYmVsKGl0ZW0xLmxhYmVsKS5sb2NhbGVDb21wYXJlKE1lbnVIZWxwZXJzLm5vcm1hbGl6ZUxhYmVsKGl0ZW0yLmxhYmVsKSlcbiAgICAgIGVsc2VcbiAgICAgICAgMFxuICAgIEB1cGRhdGUoKVxuIl19
