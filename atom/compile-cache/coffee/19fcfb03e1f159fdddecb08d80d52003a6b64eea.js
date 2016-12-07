(function() {
  var $, RootDragAndDropHandler, View, _, ipcRenderer, ref, ref1, remote, url,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  url = require('url');

  ref = require('electron'), ipcRenderer = ref.ipcRenderer, remote = ref.remote;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, View = ref1.View;

  _ = require('underscore-plus');

  module.exports = RootDragAndDropHandler = (function() {
    function RootDragAndDropHandler(treeView) {
      this.treeView = treeView;
      this.onDrop = bind(this.onDrop, this);
      this.onDropOnOtherWindow = bind(this.onDropOnOtherWindow, this);
      this.onDragOver = bind(this.onDragOver, this);
      this.onDragEnd = bind(this.onDragEnd, this);
      this.onDragLeave = bind(this.onDragLeave, this);
      this.onDragStart = bind(this.onDragStart, this);
      ipcRenderer.on('tree-view:project-folder-dropped', this.onDropOnOtherWindow);
      this.handleEvents();
    }

    RootDragAndDropHandler.prototype.dispose = function() {
      return ipcRenderer.removeListener('tree-view:project-folder-dropped', this.onDropOnOtherWindow);
    };

    RootDragAndDropHandler.prototype.handleEvents = function() {
      this.treeView.on('dragenter', '.tree-view', this.onDragEnter);
      this.treeView.on('dragend', '.project-root-header', this.onDragEnd);
      this.treeView.on('dragleave', '.tree-view', this.onDragLeave);
      this.treeView.on('dragover', '.tree-view', this.onDragOver);
      return this.treeView.on('drop', '.tree-view', this.onDrop);
    };

    RootDragAndDropHandler.prototype.onDragStart = function(e) {
      var directory, i, index, len, pathUri, projectRoot, ref2, ref3, root, rootIndex;
      this.prevDropTargetIndex = null;
      e.originalEvent.dataTransfer.setData('atom-tree-view-event', 'true');
      projectRoot = $(e.target).closest('.project-root');
      directory = projectRoot[0].directory;
      e.originalEvent.dataTransfer.setData('project-root-index', projectRoot.index());
      rootIndex = -1;
      ref2 = this.treeView.roots;
      for (index = i = 0, len = ref2.length; i < len; index = ++i) {
        root = ref2[index];
        if (root.directory === directory) {
          rootIndex = index;
          break;
        }
      }
      e.originalEvent.dataTransfer.setData('from-root-index', rootIndex);
      e.originalEvent.dataTransfer.setData('from-root-path', directory.path);
      e.originalEvent.dataTransfer.setData('from-window-id', this.getWindowId());
      e.originalEvent.dataTransfer.setData('text/plain', directory.path);
      if ((ref3 = process.platform) === 'darwin' || ref3 === 'linux') {
        if (!this.uriHasProtocol(directory.path)) {
          pathUri = "file://" + directory.path;
        }
        return e.originalEvent.dataTransfer.setData('text/uri-list', pathUri);
      }
    };

    RootDragAndDropHandler.prototype.uriHasProtocol = function(uri) {
      var error;
      try {
        return url.parse(uri).protocol != null;
      } catch (error1) {
        error = error1;
        return false;
      }
    };

    RootDragAndDropHandler.prototype.onDragEnter = function(e) {
      return e.stopPropagation();
    };

    RootDragAndDropHandler.prototype.onDragLeave = function(e) {
      e.stopPropagation();
      if (e.target === e.currentTarget) {
        return this.removePlaceholder();
      }
    };

    RootDragAndDropHandler.prototype.onDragEnd = function(e) {
      e.stopPropagation();
      return this.clearDropTarget();
    };

    RootDragAndDropHandler.prototype.onDragOver = function(e) {
      var element, entry, newDropTargetIndex, projectRoots;
      if (e.originalEvent.dataTransfer.getData('atom-tree-view-event') !== 'true') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      entry = e.currentTarget;
      if (this.treeView.roots.length === 0) {
        this.getPlaceholder().appendTo(this.treeView.list);
        return;
      }
      newDropTargetIndex = this.getDropTargetIndex(e);
      if (newDropTargetIndex == null) {
        return;
      }
      if (this.prevDropTargetIndex === newDropTargetIndex) {
        return;
      }
      this.prevDropTargetIndex = newDropTargetIndex;
      projectRoots = $(this.treeView.roots);
      if (newDropTargetIndex < projectRoots.length) {
        element = projectRoots.eq(newDropTargetIndex);
        element.addClass('is-drop-target');
        return this.getPlaceholder().insertBefore(element);
      } else {
        element = projectRoots.eq(newDropTargetIndex - 1);
        element.addClass('drop-target-is-after');
        return this.getPlaceholder().insertAfter(element);
      }
    };

    RootDragAndDropHandler.prototype.onDropOnOtherWindow = function(e, fromItemIndex) {
      var paths;
      paths = atom.project.getPaths();
      paths.splice(fromItemIndex, 1);
      atom.project.setPaths(paths);
      return this.clearDropTarget();
    };

    RootDragAndDropHandler.prototype.clearDropTarget = function() {
      var element, ref2;
      element = this.treeView.find(".is-dragging");
      element.removeClass('is-dragging');
      if ((ref2 = element[0]) != null) {
        ref2.updateTooltip();
      }
      return this.removePlaceholder();
    };

    RootDragAndDropHandler.prototype.onDrop = function(e) {
      var browserWindow, dataTransfer, fromIndex, fromRootIndex, fromRootPath, fromWindowId, projectPaths, toIndex;
      e.preventDefault();
      e.stopPropagation();
      dataTransfer = e.originalEvent.dataTransfer;
      if (dataTransfer.getData('atom-tree-view-event') !== 'true') {
        return;
      }
      fromWindowId = parseInt(dataTransfer.getData('from-window-id'));
      fromRootPath = dataTransfer.getData('from-root-path');
      fromIndex = parseInt(dataTransfer.getData('project-root-index'));
      fromRootIndex = parseInt(dataTransfer.getData('from-root-index'));
      toIndex = this.getDropTargetIndex(e);
      this.clearDropTarget();
      if (fromWindowId === this.getWindowId()) {
        if (fromIndex !== toIndex) {
          projectPaths = atom.project.getPaths();
          projectPaths.splice(fromIndex, 1);
          if (toIndex > fromIndex) {
            toIndex -= 1;
          }
          projectPaths.splice(toIndex, 0, fromRootPath);
          return atom.project.setPaths(projectPaths);
        }
      } else {
        projectPaths = atom.project.getPaths();
        projectPaths.splice(toIndex, 0, fromRootPath);
        atom.project.setPaths(projectPaths);
        if (!isNaN(fromWindowId)) {
          browserWindow = remote.BrowserWindow.fromId(fromWindowId);
          return browserWindow != null ? browserWindow.webContents.send('tree-view:project-folder-dropped', fromIndex) : void 0;
        }
      }
    };

    RootDragAndDropHandler.prototype.getDropTargetIndex = function(e) {
      var center, projectRoot, projectRoots, target;
      target = $(e.target);
      if (this.isPlaceholder(target)) {
        return;
      }
      projectRoots = $(this.treeView.roots);
      projectRoot = target.closest('.project-root');
      if (projectRoot.length === 0) {
        projectRoot = projectRoots.last();
      }
      if (!projectRoot.length) {
        return 0;
      }
      center = projectRoot.offset().top + projectRoot.height() / 2;
      if (e.originalEvent.pageY < center) {
        return projectRoots.index(projectRoot);
      } else if (projectRoot.next('.project-root').length > 0) {
        return projectRoots.index(projectRoot.next('.project-root'));
      } else {
        return projectRoots.index(projectRoot) + 1;
      }
    };

    RootDragAndDropHandler.prototype.canDragStart = function(e) {
      return $(e.target).closest('.project-root-header').size() > 0;
    };

    RootDragAndDropHandler.prototype.isDragging = function(e) {
      return Boolean(e.originalEvent.dataTransfer.getData('from-root-path'));
    };

    RootDragAndDropHandler.prototype.getPlaceholder = function() {
      return this.placeholderEl != null ? this.placeholderEl : this.placeholderEl = $('<li/>', {
        "class": 'placeholder'
      });
    };

    RootDragAndDropHandler.prototype.removePlaceholder = function() {
      var ref2;
      if ((ref2 = this.placeholderEl) != null) {
        ref2.remove();
      }
      return this.placeholderEl = null;
    };

    RootDragAndDropHandler.prototype.isPlaceholder = function(element) {
      return element.is('.placeholder');
    };

    RootDragAndDropHandler.prototype.getWindowId = function() {
      return this.processId != null ? this.processId : this.processId = atom.getCurrentWindow().id;
    };

    return RootDragAndDropHandler;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90cmVlLXZpZXcvbGliL3Jvb3QtZHJhZy1hbmQtZHJvcC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVFQUFBO0lBQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxLQUFSOztFQUVOLE1BQXdCLE9BQUEsQ0FBUSxVQUFSLENBQXhCLEVBQUMsNkJBQUQsRUFBYzs7RUFFZCxPQUFZLE9BQUEsQ0FBUSxzQkFBUixDQUFaLEVBQUMsVUFBRCxFQUFJOztFQUNKLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGdDQUFDLFFBQUQ7TUFBQyxJQUFDLENBQUEsV0FBRDs7Ozs7OztNQUNaLFdBQVcsQ0FBQyxFQUFaLENBQWUsa0NBQWYsRUFBbUQsSUFBQyxDQUFBLG1CQUFwRDtNQUNBLElBQUMsQ0FBQSxZQUFELENBQUE7SUFGVzs7cUNBSWIsT0FBQSxHQUFTLFNBQUE7YUFDUCxXQUFXLENBQUMsY0FBWixDQUEyQixrQ0FBM0IsRUFBK0QsSUFBQyxDQUFBLG1CQUFoRTtJQURPOztxQ0FHVCxZQUFBLEdBQWMsU0FBQTtNQUdaLElBQUMsQ0FBQSxRQUFRLENBQUMsRUFBVixDQUFhLFdBQWIsRUFBMEIsWUFBMUIsRUFBd0MsSUFBQyxDQUFBLFdBQXpDO01BQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxFQUFWLENBQWEsU0FBYixFQUF3QixzQkFBeEIsRUFBZ0QsSUFBQyxDQUFBLFNBQWpEO01BQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxFQUFWLENBQWEsV0FBYixFQUEwQixZQUExQixFQUF3QyxJQUFDLENBQUEsV0FBekM7TUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLEVBQVYsQ0FBYSxVQUFiLEVBQXlC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R0FBa0MsRUFIL0I7O0lBZmE7O3FDQW9CcEIsWUFBQSxHQUFjLFNBQUMsQ0FBRDthQUNaLENBQUEsQ0FBRSxDQUFDLENBQUMsTUFBSixDQUFXLENBQUMsT0FBWixDQUFvQixzQkFBcEIsQ0FBMkMsQ0FBQyxJQUE1QyxDQUFBLENBQUEsR0FBcUQ7SUFEekM7O3FDQUdkLFVBQUEsR0FBWSxTQUFDLENBQUQ7YUFDVixPQUFBLENBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBN0IsQ0FBcUMsZ0JBQXJDLENBQVI7SUFEVTs7cUNBR1osY0FBQSxHQUFnQixTQUFBOzBDQUNkLElBQUMsQ0FBQSxnQkFBRCxJQUFDLENBQUEsZ0JBQWlCLENBQUEsQ0FBRSxPQUFGLEVBQVc7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7T0FBWDtJQURKOztxQ0FHaEIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBOztZQUFjLENBQUUsTUFBaEIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQjtJQUZBOztxQ0FJbkIsYUFBQSxHQUFlLFNBQUMsT0FBRDthQUNiLE9BQU8sQ0FBQyxFQUFSLENBQVcsY0FBWDtJQURhOztxQ0FHZixXQUFBLEdBQWEsU0FBQTtzQ0FDWCxJQUFDLENBQUEsWUFBRCxJQUFDLENBQUEsWUFBYSxJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUF1QixDQUFDO0lBRDNCOzs7OztBQWhMZiIsInNvdXJjZXNDb250ZW50IjpbInVybCA9IHJlcXVpcmUgJ3VybCdcblxue2lwY1JlbmRlcmVyLCByZW1vdGV9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbnskLCBWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUm9vdERyYWdBbmREcm9wSGFuZGxlclxuICBjb25zdHJ1Y3RvcjogKEB0cmVlVmlldykgLT5cbiAgICBpcGNSZW5kZXJlci5vbigndHJlZS12aWV3OnByb2plY3QtZm9sZGVyLWRyb3BwZWQnLCBAb25Ecm9wT25PdGhlcldpbmRvdylcbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICBkaXNwb3NlOiAtPlxuICAgIGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKCd0cmVlLXZpZXc6cHJvamVjdC1mb2xkZXItZHJvcHBlZCcsIEBvbkRyb3BPbk90aGVyV2luZG93KVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICAjIG9uRHJhZ1N0YXJ0IGlzIGNhbGxlZCBkaXJlY3RseSBieSBUcmVlVmlldydzIG9uRHJhZ1N0YXJ0XG4gICAgIyB3aWxsIGJlIGNsZWFuZWQgdXAgYnkgdHJlZSB2aWV3LCBzaW5jZSB0aGV5IGFyZSB0cmVlLXZpZXcncyBoYW5kbGVyc1xuICAgIEB0cmVlVmlldy5vbiAnZHJhZ2VudGVyJywgJy50cmVlLXZpZXcnLCBAb25EcmFnRW50ZXJcbiAgICBAdHJlZVZpZXcub24gJ2RyYWdlbmQnLCAnLnByb2plY3Qtcm9vdC1oZWFkZXInLCBAb25EcmFnRW5kXG4gICAgQHRyZWVWaWV3Lm9uICdkcmFnbGVhdmUnLCAnLnRyZWUtdmlldycsIEBvbkRyYWdMZWF2ZVxuICAgIEB0cmVlVmlldy5vbiAnZHJhZ292ZXInLCAnLnRyZWUtdmlldycsIEBvbkRyYWdPdmVyXG4gICAgQHRyZWVWaWV3Lm9uICdkcm9wJywgJy50cmVlLXZpZXcnLCBAb25Ecm9wXG5cbiAgb25EcmFnU3RhcnQ6IChlKSA9PlxuICAgIEBwcmV2RHJvcFRhcmdldEluZGV4ID0gbnVsbFxuICAgIGUub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAnYXRvbS10cmVlLXZpZXctZXZlbnQnLCAndHJ1ZSdcbiAgICBwcm9qZWN0Um9vdCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5wcm9qZWN0LXJvb3QnKVxuICAgIGRpcmVjdG9yeSA9IHByb2plY3RSb290WzBdLmRpcmVjdG9yeVxuXG4gICAgZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdwcm9qZWN0LXJvb3QtaW5kZXgnLCBwcm9qZWN0Um9vdC5pbmRleCgpXG5cbiAgICByb290SW5kZXggPSAtMVxuICAgIChyb290SW5kZXggPSBpbmRleDsgYnJlYWspIGZvciByb290LCBpbmRleCBpbiBAdHJlZVZpZXcucm9vdHMgd2hlbiByb290LmRpcmVjdG9yeSBpcyBkaXJlY3RvcnlcblxuICAgIGUub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAnZnJvbS1yb290LWluZGV4Jywgcm9vdEluZGV4XG4gICAgZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdmcm9tLXJvb3QtcGF0aCcsIGRpcmVjdG9yeS5wYXRoXG4gICAgZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdmcm9tLXdpbmRvdy1pZCcsIEBnZXRXaW5kb3dJZCgpXG5cbiAgICBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEgJ3RleHQvcGxhaW4nLCBkaXJlY3RvcnkucGF0aFxuXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpbiBbJ2RhcndpbicsICdsaW51eCddXG4gICAgICBwYXRoVXJpID0gXCJmaWxlOi8vI3tkaXJlY3RvcnkucGF0aH1cIiB1bmxlc3MgQHVyaUhhc1Byb3RvY29sKGRpcmVjdG9yeS5wYXRoKVxuICAgICAgZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICd0ZXh0L3VyaS1saXN0JywgcGF0aFVyaVxuXG4gIHVyaUhhc1Byb3RvY29sOiAodXJpKSAtPlxuICAgIHRyeVxuICAgICAgdXJsLnBhcnNlKHVyaSkucHJvdG9jb2w/XG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGZhbHNlXG5cbiAgb25EcmFnRW50ZXI6IChlKSAtPlxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICBvbkRyYWdMZWF2ZTogKGUpID0+XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIEByZW1vdmVQbGFjZWhvbGRlcigpIGlmIGUudGFyZ2V0IGlzIGUuY3VycmVudFRhcmdldFxuXG4gIG9uRHJhZ0VuZDogKGUpID0+XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIEBjbGVhckRyb3BUYXJnZXQoKVxuXG4gIG9uRHJhZ092ZXI6IChlKSA9PlxuICAgIHVubGVzcyBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEoJ2F0b20tdHJlZS12aWV3LWV2ZW50JykgaXMgJ3RydWUnXG4gICAgICByZXR1cm5cblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgIGVudHJ5ID0gZS5jdXJyZW50VGFyZ2V0XG5cbiAgICBpZiBAdHJlZVZpZXcucm9vdHMubGVuZ3RoIGlzIDBcbiAgICAgIEBnZXRQbGFjZWhvbGRlcigpLmFwcGVuZFRvKEB0cmVlVmlldy5saXN0KVxuICAgICAgcmV0dXJuXG5cbiAgICBuZXdEcm9wVGFyZ2V0SW5kZXggPSBAZ2V0RHJvcFRhcmdldEluZGV4KGUpXG4gICAgcmV0dXJuIHVubGVzcyBuZXdEcm9wVGFyZ2V0SW5kZXg/XG4gICAgcmV0dXJuIGlmIEBwcmV2RHJvcFRhcmdldEluZGV4IGlzIG5ld0Ryb3BUYXJnZXRJbmRleFxuICAgIEBwcmV2RHJvcFRhcmdldEluZGV4ID0gbmV3RHJvcFRhcmdldEluZGV4XG5cbiAgICBwcm9qZWN0Um9vdHMgPSAkKEB0cmVlVmlldy5yb290cylcblxuICAgIGlmIG5ld0Ryb3BUYXJnZXRJbmRleCA8IHByb2plY3RSb290cy5sZW5ndGhcbiAgICAgIGVsZW1lbnQgPSBwcm9qZWN0Um9vdHMuZXEobmV3RHJvcFRhcmdldEluZGV4KVxuICAgICAgZWxlbWVudC5hZGRDbGFzcyAnaXMtZHJvcC10YXJnZXQnXG4gICAgICBAZ2V0UGxhY2Vob2xkZXIoKS5pbnNlcnRCZWZvcmUoZWxlbWVudClcbiAgICBlbHNlXG4gICAgICBlbGVtZW50ID0gcHJvamVjdFJvb3RzLmVxKG5ld0Ryb3BUYXJnZXRJbmRleCAtIDEpXG4gICAgICBlbGVtZW50LmFkZENsYXNzICdkcm9wLXRhcmdldC1pcy1hZnRlcidcbiAgICAgIEBnZXRQbGFjZWhvbGRlcigpLmluc2VydEFmdGVyKGVsZW1lbnQpXG5cbiAgb25Ecm9wT25PdGhlcldpbmRvdzogKGUsIGZyb21JdGVtSW5kZXgpID0+XG4gICAgcGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuICAgIHBhdGhzLnNwbGljZShmcm9tSXRlbUluZGV4LCAxKVxuICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhwYXRocylcblxuICAgIEBjbGVhckRyb3BUYXJnZXQoKVxuXG4gIGNsZWFyRHJvcFRhcmdldDogLT5cbiAgICBlbGVtZW50ID0gQHRyZWVWaWV3LmZpbmQoXCIuaXMtZHJhZ2dpbmdcIilcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzICdpcy1kcmFnZ2luZydcbiAgICBlbGVtZW50WzBdPy51cGRhdGVUb29sdGlwKClcbiAgICBAcmVtb3ZlUGxhY2Vob2xkZXIoKVxuXG4gIG9uRHJvcDogKGUpID0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAge2RhdGFUcmFuc2Zlcn0gPSBlLm9yaWdpbmFsRXZlbnRcblxuICAgICMgVE9ETzogc3VwcG9ydCBkcmFnZ2luZyBmb2xkZXJzIGZyb20gdGhlIGZpbGVzeXN0ZW0gLS0gZWxlY3Ryb24gbmVlZHMgdG8gYWRkIHN1cHBvcnQgZmlyc3RcbiAgICByZXR1cm4gdW5sZXNzIGRhdGFUcmFuc2Zlci5nZXREYXRhKCdhdG9tLXRyZWUtdmlldy1ldmVudCcpIGlzICd0cnVlJ1xuXG4gICAgZnJvbVdpbmRvd0lkID0gcGFyc2VJbnQoZGF0YVRyYW5zZmVyLmdldERhdGEoJ2Zyb20td2luZG93LWlkJykpXG4gICAgZnJvbVJvb3RQYXRoICA9IGRhdGFUcmFuc2Zlci5nZXREYXRhKCdmcm9tLXJvb3QtcGF0aCcpXG4gICAgZnJvbUluZGV4ICAgICA9IHBhcnNlSW50KGRhdGFUcmFuc2Zlci5nZXREYXRhKCdwcm9qZWN0LXJvb3QtaW5kZXgnKSlcbiAgICBmcm9tUm9vdEluZGV4ID0gcGFyc2VJbnQoZGF0YVRyYW5zZmVyLmdldERhdGEoJ2Zyb20tcm9vdC1pbmRleCcpKVxuXG4gICAgdG9JbmRleCA9IEBnZXREcm9wVGFyZ2V0SW5kZXgoZSlcblxuICAgIEBjbGVhckRyb3BUYXJnZXQoKVxuXG4gICAgaWYgZnJvbVdpbmRvd0lkIGlzIEBnZXRXaW5kb3dJZCgpXG4gICAgICB1bmxlc3MgZnJvbUluZGV4IGlzIHRvSW5kZXhcbiAgICAgICAgcHJvamVjdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgICAgcHJvamVjdFBhdGhzLnNwbGljZShmcm9tSW5kZXgsIDEpXG4gICAgICAgIGlmIHRvSW5kZXggPiBmcm9tSW5kZXggdGhlbiB0b0luZGV4IC09IDFcbiAgICAgICAgcHJvamVjdFBhdGhzLnNwbGljZSh0b0luZGV4LCAwLCBmcm9tUm9vdFBhdGgpXG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhwcm9qZWN0UGF0aHMpXG4gICAgZWxzZVxuICAgICAgcHJvamVjdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgIHByb2plY3RQYXRocy5zcGxpY2UodG9JbmRleCwgMCwgZnJvbVJvb3RQYXRoKVxuICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKHByb2plY3RQYXRocylcblxuICAgICAgaWYgbm90IGlzTmFOKGZyb21XaW5kb3dJZClcbiAgICAgICAgIyBMZXQgdGhlIHdpbmRvdyB3aGVyZSB0aGUgZHJhZyBzdGFydGVkIGtub3cgdGhhdCB0aGUgdGFiIHdhcyBkcm9wcGVkXG4gICAgICAgIGJyb3dzZXJXaW5kb3cgPSByZW1vdGUuQnJvd3NlcldpbmRvdy5mcm9tSWQoZnJvbVdpbmRvd0lkKVxuICAgICAgICBicm93c2VyV2luZG93Py53ZWJDb250ZW50cy5zZW5kKCd0cmVlLXZpZXc6cHJvamVjdC1mb2xkZXItZHJvcHBlZCcsIGZyb21JbmRleClcblxuICBnZXREcm9wVGFyZ2V0SW5kZXg6IChlKSAtPlxuICAgIHRhcmdldCA9ICQoZS50YXJnZXQpXG5cbiAgICByZXR1cm4gaWYgQGlzUGxhY2Vob2xkZXIodGFyZ2V0KVxuXG4gICAgcHJvamVjdFJvb3RzID0gJChAdHJlZVZpZXcucm9vdHMpXG4gICAgcHJvamVjdFJvb3QgPSB0YXJnZXQuY2xvc2VzdCgnLnByb2plY3Qtcm9vdCcpXG4gICAgcHJvamVjdFJvb3QgPSBwcm9qZWN0Um9vdHMubGFzdCgpIGlmIHByb2plY3RSb290Lmxlbmd0aCBpcyAwXG5cbiAgICByZXR1cm4gMCB1bmxlc3MgcHJvamVjdFJvb3QubGVuZ3RoXG5cbiAgICBjZW50ZXIgPSBwcm9qZWN0Um9vdC5vZmZzZXQoKS50b3AgKyBwcm9qZWN0Um9vdC5oZWlnaHQoKSAvIDJcblxuICAgIGlmIGUub3JpZ2luYWxFdmVudC5wYWdlWSA8IGNlbnRlclxuICAgICAgcHJvamVjdFJvb3RzLmluZGV4KHByb2plY3RSb290KVxuICAgIGVsc2UgaWYgcHJvamVjdFJvb3QubmV4dCgnLnByb2plY3Qtcm9vdCcpLmxlbmd0aCA+IDBcbiAgICAgIHByb2plY3RSb290cy5pbmRleChwcm9qZWN0Um9vdC5uZXh0KCcucHJvamVjdC1yb290JykpXG4gICAgZWxzZVxuICAgICAgcHJvamVjdFJvb3RzLmluZGV4KHByb2plY3RSb290KSArIDFcblxuICBjYW5EcmFnU3RhcnQ6IChlKSAtPlxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5wcm9qZWN0LXJvb3QtaGVhZGVyJykuc2l6ZSgpID4gMFxuXG4gIGlzRHJhZ2dpbmc6IChlKSAtPlxuICAgIEJvb2xlYW4gZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhICdmcm9tLXJvb3QtcGF0aCdcblxuICBnZXRQbGFjZWhvbGRlcjogLT5cbiAgICBAcGxhY2Vob2xkZXJFbCA/PSAkKCc8bGkvPicsIGNsYXNzOiAncGxhY2Vob2xkZXInKVxuXG4gIHJlbW92ZVBsYWNlaG9sZGVyOiAtPlxuICAgIEBwbGFjZWhvbGRlckVsPy5yZW1vdmUoKVxuICAgIEBwbGFjZWhvbGRlckVsID0gbnVsbFxuXG4gIGlzUGxhY2Vob2xkZXI6IChlbGVtZW50KSAtPlxuICAgIGVsZW1lbnQuaXMoJy5wbGFjZWhvbGRlcicpXG5cbiAgZ2V0V2luZG93SWQ6IC0+XG4gICAgQHByb2Nlc3NJZCA/PSBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5pZFxuIl19
