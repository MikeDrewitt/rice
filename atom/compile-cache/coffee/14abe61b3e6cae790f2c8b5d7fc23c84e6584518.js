(function() {
  var CompositeDisposable, Directory, DirectoryElement, DirectoryView, FileView, repoForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  Directory = require('./directory');

  FileView = require('./file-view');

  repoForPath = require('./helpers').repoForPath;

  DirectoryView = (function(superClass) {
    extend(DirectoryView, superClass);

    function DirectoryView() {
      return DirectoryView.__super__.constructor.apply(this, arguments);
    }

    DirectoryView.prototype.initialize = function(directory) {
      var iconClass, ref, squashedDirectoryNameNode;
      this.directory = directory;
      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add(this.directory.onDidDestroy((function(_this) {
        return function() {
          return _this.subscriptions.dispose();
        };
      })(this)));
      this.subscribeToDirectory();
      this.classList.add('directory', 'entry', 'list-nested-item', 'collapsed');
      this.header = document.createElement('div');
      this.header.classList.add('header', 'list-item');
      this.directoryName = document.createElement('span');
      this.directoryName.classList.add('name', 'icon');
      this.entries = document.createElement('ol');
      this.entries.classList.add('entries', 'list-tree');
      if (this.directory.symlink) {
        iconClass = 'icon-file-symlink-directory';
      } else {
        iconClass = 'icon-file-directory';
        if (this.directory.isRoot) {
          if ((ref = repoForPath(this.directory.path)) != null ? ref.isProjectAtRoot() : void 0) {
            iconClass = 'icon-repo';
          }
        } else {
          if (this.directory.submodule) {
            iconClass = 'icon-file-submodule';
          }
        }
      }
      this.directoryName.classList.add(iconClass);
      this.directoryName.dataset.path = this.directory.path;
      if (this.directory.squashedNames != null) {
        this.directoryName.dataset.name = this.directory.squashedNames.join('');
        this.directoryName.title = this.directory.squashedNames.join('');
        squashedDirectoryNameNode = document.createElement('span');
        squashedDirectoryNameNode.classList.add('squashed-dir');
        squashedDirectoryNameNode.textContent = this.directory.squashedNames[0];
        this.directoryName.appendChild(squashedDirectoryNameNode);
        this.directoryName.appendChild(document.createTextNode(this.directory.squashedNames[1]));
      } else {
        this.directoryName.dataset.name = this.directory.name;
        this.directoryName.title = this.directory.name;
        this.directoryName.textContent = this.directory.name;
      }
      this.appendChild(this.header);
      this.header.appendChild(this.directoryName);
      this.appendChild(this.entries);
      if (this.directory.isRoot) {
        this.classList.add('project-root');
        this.header.classList.add('project-root-header');
      } else {
        this.draggable = true;
        this.subscriptions.add(this.directory.onDidStatusChange((function(_this) {
          return function() {
            return _this.updateStatus();
          };
        })(this)));
        this.updateStatus();
      }
      if (this.directory.expansionState.isExpanded) {
        return this.expand();
      }
    };

    DirectoryView.prototype.updateStatus = function() {
      this.classList.remove('status-ignored', 'status-modified', 'status-added');
      if (this.directory.status != null) {
        return this.classList.add("status-" + this.directory.status);
      }
    };

    DirectoryView.prototype.subscribeToDirectory = function() {
      return this.subscriptions.add(this.directory.onDidAddEntries((function(_this) {
        return function(addedEntries) {
          var entry, i, insertionIndex, len, numberOfEntries, results, view;
          if (!_this.isExpanded) {
            return;
          }
          numberOfEntries = _this.entries.children.length;
          results = [];
          for (i = 0, len = addedEntries.length; i < len; i++) {
            entry = addedEntries[i];
            view = _this.createViewForEntry(entry);
            insertionIndex = entry.indexInParentDirectory;
            if (insertionIndex < numberOfEntries) {
              _this.entries.insertBefore(view, _this.entries.children[insertionIndex]);
            } else {
              _this.entries.appendChild(view);
            }
            results.push(numberOfEntries++);
          }
          return results;
        };
      })(this)));
    };

    DirectoryView.prototype.getPath = function() {
      return this.directory.path;
    };

    DirectoryView.prototype.isPathEqual = function(pathToCompare) {
      return this.directory.isPathEqual(pathToCompare);
    };

    DirectoryView.prototype.createViewForEntry = function(entry) {
      var subscription, view;
      if (entry instanceof Directory) {
        view = new DirectoryElement();
      } else {
        view = new FileView();
      }
      view.initialize(entry);
      subscription = this.directory.onDidRemoveEntries(function(removedEntries) {
        var removedEntry, removedName, results;
        results = [];
        for (removedName in removedEntries) {
          removedEntry = removedEntries[removedName];
          if (!(entry === removedEntry)) {
            continue;
          }
          view.remove();
          subscription.dispose();
          break;
        }
        return results;
      });
      this.subscriptions.add(subscription);
      return view;
    };

    DirectoryView.prototype.reload = function() {
      if (this.isExpanded) {
        return this.directory.reload();
      }
    };

    DirectoryView.prototype.toggleExpansion = function(isRecursive) {
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (this.isExpanded) {
        return this.collapse(isRecursive);
      } else {
        return this.expand(isRecursive);
      }
    };

    DirectoryView.prototype.expand = function(isRecursive) {
      var entry, i, len, ref;
      if (isRecursive == null) {
        isRecursive = false;
      }
      if (!this.isExpanded) {
        this.isExpanded = true;
        this.classList.add('expanded');
        this.classList.remove('collapsed');
        this.directory.expand();
      }
      if (isRecursive) {
        ref = this.entries.children;
        for (i = 0, len = ref.length; i < len; i++) {
          entry = ref[i];
          if (entry instanceof DirectoryView) {
            entry.expand(true);
          }
        }
      }
      return false;
    };

    DirectoryView.prototype.collapse = function(isRecursive) {
      var entry, i, len, ref;
      if (isRecursive == null) {
        isRecursive = false;
      }
      this.isExpanded = false;
      if (isRecursive) {
        ref = this.entries.children;
        for (i = 0, len = ref.length; i < len; i++) {
          entry = ref[i];
          if (entry.isExpanded) {
            entry.collapse(true);
          }
        }
      }
      this.classList.remove('expanded');
      this.classList.add('collapsed');
      this.directory.collapse();
      return this.entries.innerHTML = '';
    };

    return DirectoryView;

  })(HTMLElement);

  DirectoryElement = document.registerElement('tree-view-directory', {
    prototype: DirectoryView.prototype,
    "extends": 'li'
  });

  module.exports = DirectoryElement;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL2RpcmVjdG9yeS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsc0ZBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUN4QixTQUFBLEdBQVksT0FBQSxDQUFRLGFBQVI7O0VBQ1osUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNWLGNBQWUsT0FBQSxDQUFRLFdBQVI7O0VBRVY7Ozs7Ozs7NEJBQ0osVUFBQSxHQUFZLFNBQUMsU0FBRDtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsWUFBRDtNQUNYLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsbUJBQUEsQ0FBQTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLFNBQVMsQ0FBQyxZQUFYLENBQXdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QixDQUFuQjtNQUNBLElBQUMsQ0FBQSxvQkFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsV0FBZixFQUE0QixPQUE1QixFQUFzQyxrQkFBdEMsRUFBMkQsV0FBM0Q7TUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsUUFBdEIsRUFBZ0MsV0FBaEM7TUFFQSxJQUFDLENBQUEsYUFBRCxHQUFpQixRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QjtNQUNqQixJQUFDLENBQUEs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QUg7QUFDRTtBQUFBLGFBQUEscUNBQUE7O2NBQW9DLEtBQUEsWUFBaUI7WUFDbkQsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFiOztBQURGLFNBREY7O2FBSUE7SUFYTTs7NEJBYVIsUUFBQSxHQUFVLFNBQUMsV0FBRDtBQUNSLFVBQUE7O1FBRFMsY0FBWTs7TUFDckIsSUFBQyxDQUFBLFVBQUQsR0FBYztNQUVkLElBQUcsV0FBSDtBQUNFO0FBQUEsYUFBQSxxQ0FBQTs7Y0FBb0MsS0FBSyxDQUFDO1lBQ3hDLEtBQUssQ0FBQyxRQUFOLENBQWUsSUFBZjs7QUFERixTQURGOztNQUlBLElBQUMsQ0FBQSxTQUFTLENBQUMsTUFBWCxDQUFrQixVQUFsQjtNQUNBLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLFdBQWY7TUFDQSxJQUFDLENBQUEsU0FBUyxDQUFDLFFBQVgsQ0FBQTthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBVCxHQUFxQjtJQVZiOzs7O0tBckhnQjs7RUFpSTVCLGdCQUFBLEdBQW1CLFFBQVEsQ0FBQyxlQUFULENBQXlCLHFCQUF6QixFQUFnRDtJQUFBLFNBQUEsRUFBVyxhQUFhLENBQUMsU0FBekI7SUFBb0MsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUE3QztHQUFoRDs7RUFDbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF2SWpCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuRGlyZWN0b3J5ID0gcmVxdWlyZSAnLi9kaXJlY3RvcnknXG5GaWxlVmlldyA9IHJlcXVpcmUgJy4vZmlsZS12aWV3J1xue3JlcG9Gb3JQYXRofSA9IHJlcXVpcmUgJy4vaGVscGVycydcblxuY2xhc3MgRGlyZWN0b3J5VmlldyBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGluaXRpYWxpemU6IChAZGlyZWN0b3J5KSAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZGlyZWN0b3J5Lm9uRGlkRGVzdHJveSA9PiBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaWJlVG9EaXJlY3RvcnkoKVxuXG4gICAgQGNsYXNzTGlzdC5hZGQoJ2RpcmVjdG9yeScsICdlbnRyeScsICAnbGlzdC1uZXN0ZWQtaXRlbScsICAnY29sbGFwc2VkJylcblxuICAgIEBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBoZWFkZXIuY2xhc3NMaXN0LmFkZCgnaGVhZGVyJywgJ2xpc3QtaXRlbScpXG5cbiAgICBAZGlyZWN0b3J5TmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgIEBkaXJlY3RvcnlOYW1lLmNsYXNzTGlzdC5hZGQoJ25hbWUnLCAnaWNvbicpXG5cbiAgICBAZW50cmllcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29sJylcbiAgICBAZW50cmllcy5jbGFzc0xpc3QuYWRkKCdlbnRyaWVzJywgJ2xpc3QtdHJlZScpXG5cbiAgICBpZiBAZGlyZWN0b3J5LnN5bWxpbmtcbiAgICAgIGljb25DbGFzcyA9ICdpY29uLWZpbGUtc3ltbGluay1kaXJlY3RvcnknXG4gICAgZWxzZVxuICAgICAgaWNvbkNsYXNzID0gJ2ljb24tZmlsZS1kaXJlY3RvcnknXG4gICAgICBpZiBAZGlyZWN0b3J5LmlzUm9vdFxuICAgICAgICBpY29uQ2xhc3MgPSAnaWNvbi1yZXBvJyBpZiByZXBvRm9yUGF0aChAZGlyZWN0b3J5LnBhdGgpPy5pc1Byb2plY3RBdFJvb3QoKVxuICAgICAgZWxzZVxuICAgICAgICBpY29uQ2xhc3MgPSAnaWNvbi1maWxlLXN1Ym1vZHVsZScgaWYgQGRpcmVjdG9yeS5zdWJtb2R1bGVcbiAgICBAZGlyZWN0b3J5TmFtZS5jbGFzc0xpc3QuYWRkKGljb25DbGFzcylcbiAgICBAZGlyZWN0b3J5TmFtZS5kYXRhc2V0LnBhdGggPSBAZGlyZWN0b3J5LnBhdGhcblxuICAgIGlmIEBkaXJlY3Rvcnkuc3F1YXNoZWROYW1lcz9cbiAgICAgIEBkaXJlY3RvcnlOYW1lLmRhdGFzZXQubmFtZSA9IEBkaXJlY3Rvcnkuc3F1YXNoZWROYW1lcy5qb2luKCcnKVxuICAgICAgQGRpcmVjdG9yeU5hbWUudGl0bGUgPSBAZGlyZWN0b3J5LnNxdWFzaGVkTmFtZXMuam9pbignJylcbiAgICAgIHNxdWFzaGVkRGlyZWN0b3J5TmFtZU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICAgIHNxdWFzaGVkRGlyZWN0b3J5TmFtZU5vZGUuY2xhc3NMaXN0LmFkZCgnc3F1YXNoZWQtZGlyJylcbiAgICAgIHNxdWFzaGVkRGlyZWN0b3J5TmFtZU5vZGUudGV4dENvbnRlbnQgPSBAZGlyZWN0b3J5LnNxdWFzaGVkTmFtZXNbMF1cbiAgICAgIEBkaXJlY3RvcnlOYW1lLmFwcGVuZENoaWxkKHNxdWFzaGVkRGlyZWN0b3J5TmFtZU5vZGUpXG4gICAgICBAZGlyZWN0b3J5TmFtZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShAZGlyZWN0b3J5LnNxdWFzaGVkTmFtZXNbMV0pKVxuICAgIGVsc2VcbiAgICAgIEBkaXJlY3RvcnlOYW1lLmRhdGFzZXQubmFtZSA9IEBkaXJlY3RvcnkubmFtZVxuICAgICAgQGRpcmVjdG9yeU5hbWUudGl0bGUgPSBAZGlyZWN0b3J5Lm5hbWVcbiAgICAgIEBkaXJlY3RvcnlOYW1lLnRleHRDb250ZW50ID0gQGRpcmVjdG9yeS5uYW1lXG5cbiAgICBAYXBwZW5kQ2hpbGQoQGhlYWRlcilcbiAgICBAaGVhZGVyLmFwcGVuZENoaWxkKEBkaXJlY3RvcnlOYW1lKVxuICAgIEBhcHBlbmRDaGlsZChAZW50cmllcylcblxuICAgIGlmIEBkaXJlY3RvcnkuaXNSb290XG4gICAgICBAY2xhc3NMaXN0LmFkZCgncHJvamVjdC1yb290JylcbiAgICAgIEBoZWFkZXIuY2xhc3NMaXN0LmFkZCgncHJvamVjdC1yb290LWhlYWRlcicpXG4gICAgZWxzZVxuICAgICAgQGRyYWdnYWJsZSA9IHRydWVcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZGlyZWN0b3J5Lm9uRGlkU3RhdHVzQ2hhbmdlID0+IEB1cGRhdGVTdGF0dXMoKVxuICAgICAgQHVwZGF0ZVN0YXR1cygpXG5cbiAgICBAZXhwYW5kKCkgaWYgQGRpcmVjdG9yeS5leHBhbnNpb25TdGF0ZS5pc0V4cGFuZGVkXG5cbiAgdXBkYXRlU3RhdHVzOiAtPlxuICAgIEBjbGFzc0xpc3QucmVtb3ZlKCdzdGF0dXMtaWdub3JlZCcsICdzdGF0dXMtbW9kaWZpZWQnLCAnc3RhdHVzLWFkZGVkJylcbiAgICBAY2xhc3NMaXN0LmFkZChcInN0YXR1cy0je0BkaXJlY3Rvcnkuc3RhdHVzfVwiKSBpZiBAZGlyZWN0b3J5LnN0YXR1cz9cblxuICBzdWJzY3JpYmVUb0RpcmVjdG9yeTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGRpcmVjdG9yeS5vbkRpZEFkZEVudHJpZXMgKGFkZGVkRW50cmllcykgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgQGlzRXhwYW5kZWRcblxuICAgICAgbnVtYmVyT2ZFbnRyaWVzID0gQGVudHJpZXMuY2hpbGRyZW4ubGVuZ3RoXG5cbiAgICAgIGZvciBlbnRyeSBpbiBhZGRlZEVudHJpZXNcbiAgICAgICAgdmlldyA9IEBjcmVhdGVWaWV3Rm9yRW50cnkoZW50cnkpXG5cbiAgICAgICAgaW5zZXJ0aW9uSW5kZXggPSBlbnRyeS5pbmRleEluUGFyZW50RGlyZWN0b3J5XG4gICAgICAgIGlmIGluc2VydGlvbkluZGV4IDwgbnVtYmVyT2ZFbnRyaWVzXG4gICAgICAgICAgQGVudHJpZXMuaW5zZXJ0QmVmb3JlKHZpZXcsIEBlbnRyaWVzLmNoaWxkcmVuW2luc2VydGlvbkluZGV4XSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBlbnRyaWVzLmFwcGVuZENoaWxkKHZpZXcpXG5cbiAgICAgICAgbnVtYmVyT2ZFbnRyaWVzKytcblxuICBnZXRQYXRoOiAtPlxuICAgIEBkaXJlY3RvcnkucGF0aFxuXG4gIGlzUGF0aEVxdWFsOiAocGF0aFRvQ29tcGFyZSkgLT5cbiAgICBAZGlyZWN0b3J5LmlzUGF0aEVxdWFsKHBhdGhUb0NvbXBhcmUpXG5cbiAgY3JlYXRlVmlld0ZvckVudHJ5OiAoZW50cnkpIC0+XG4gICAgaWYgZW50cnkgaW5zdGFuY2VvZiBEaXJlY3RvcnlcbiAgICAgIHZpZXcgPSBuZXcgRGlyZWN0b3J5RWxlbWVudCgpXG4gICAgZWxzZVxuICAgICAgdmlldyA9IG5ldyBGaWxlVmlldygpXG4gICAgdmlldy5pbml0aWFsaXplKGVudHJ5KVxuXG4gICAgc3Vic2NyaXB0aW9uID0gQGRpcmVjdG9yeS5vbkRpZFJlbW92ZUVudHJpZXMgKHJlbW92ZWRFbnRyaWVzKSAtPlxuICAgICAgZm9yIHJlbW92ZWROYW1lLCByZW1vdmVkRW50cnkgb2YgcmVtb3ZlZEVudHJpZXMgd2hlbiBlbnRyeSBpcyByZW1vdmVkRW50cnlcbiAgICAgICAgdmlldy5yZW1vdmUoKVxuICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgICAgIGJyZWFrXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKHN1YnNjcmlwdGlvbilcblxuICAgIHZpZXdcblxuICByZWxvYWQ6IC0+XG4gICAgQGRpcmVjdG9yeS5yZWxvYWQoKSBpZiBAaXNFeHBhbmRlZFxuXG4gIHRvZ2dsZUV4cGFuc2lvbjogKGlzUmVjdXJzaXZlPWZhbHNlKSAtPlxuICAgIGlmIEBpc0V4cGFuZGVkIHRoZW4gQGNvbGxhcHNlKGlzUmVjdXJzaXZlKSBlbHNlIEBleHBhbmQoaXNSZWN1cnNpdmUpXG5cbiAgZXhwYW5kOiAoaXNSZWN1cnNpdmU9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIEBpc0V4cGFuZGVkXG4gICAgICBAaXNFeHBhbmRlZCA9IHRydWVcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdleHBhbmRlZCcpXG4gICAgICBAY2xhc3NMaXN0LnJlbW92ZSgnY29sbGFwc2VkJylcbiAgICAgIEBkaXJlY3RvcnkuZXhwYW5kKClcblxuICAgIGlmIGlzUmVjdXJzaXZlXG4gICAgICBmb3IgZW50cnkgaW4gQGVudHJpZXMuY2hpbGRyZW4gd2hlbiBlbnRyeSBpbnN0YW5jZW9mIERpcmVjdG9yeVZpZXdcbiAgICAgICAgZW50cnkuZXhwYW5kKHRydWUpXG5cbiAgICBmYWxzZVxuXG4gIGNvbGxhcHNlOiAoaXNSZWN1cnNpdmU9ZmFsc2UpIC0+XG4gICAgQGlzRXhwYW5kZWQgPSBmYWxzZVxuXG4gICAgaWYgaXNSZWN1cnNpdmVcbiAgICAgIGZvciBlbnRyeSBpbiBAZW50cmllcy5jaGlsZHJlbiB3aGVuIGVudHJ5LmlzRXhwYW5kZWRcbiAgICAgICAgZW50cnkuY29sbGFwc2UodHJ1ZSlcblxuICAgIEBjbGFzc0xpc3QucmVtb3ZlKCdleHBhbmRlZCcpXG4gICAgQGNsYXNzTGlzdC5hZGQoJ2NvbGxhcHNlZCcpXG4gICAgQGRpcmVjdG9yeS5jb2xsYXBzZSgpXG4gICAgQGVudHJpZXMuaW5uZXJIVE1MID0gJydcblxuRGlyZWN0b3J5RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgndHJlZS12aWV3LWRpcmVjdG9yeScsIHByb3RvdHlwZTogRGlyZWN0b3J5Vmlldy5wcm90b3R5cGUsIGV4dGVuZHM6ICdsaScpXG5tb2R1bGUuZXhwb3J0cyA9IERpcmVjdG9yeUVsZW1lbnRcbiJdfQ==
