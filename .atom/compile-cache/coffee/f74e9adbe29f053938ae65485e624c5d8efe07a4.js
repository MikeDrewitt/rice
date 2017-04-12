(function() {
  var PaneResizeHandleElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  PaneResizeHandleElement = (function(superClass) {
    extend(PaneResizeHandleElement, superClass);

    function PaneResizeHandleElement() {
      return PaneResizeHandleElement.__super__.constructor.apply(this, arguments);
    }

    PaneResizeHandleElement.prototype.createdCallback = function() {
      this.resizePane = this.resizePane.bind(this);
      this.resizeStopped = this.resizeStopped.bind(this);
      return this.subscribeToDOMEvents();
    };

    PaneResizeHandleElement.prototype.subscribeToDOMEvents = function() {
      this.addEventListener('dblclick', this.resizeToFitContent.bind(this));
      return this.addEventListener('mousedown', this.resizeStarted.bind(this));
    };

    PaneResizeHandleElement.prototype.attachedCallback = function() {
      this.isHorizontal = this.parentElement.classList.contains("horizontal");
      return this.classList.add(this.isHorizontal ? 'horizontal' : 'vertical');
    };

    PaneResizeHandleElement.prototype.detachedCallback = function() {
      return this.resizeStopped();
    };

    PaneResizeHandleElement.prototype.resizeToFitContent = function() {
      var ref, ref1;
      if ((ref = this.previousSibling) != null) {
        ref.model.setFlexScale(1);
      }
      return (ref1 = this.nextSibling) != null ? ref1.model.setFlexScale(1) : void 0;
    };

    PaneResizeHandleElement.prototype.resizeStarted = function(e) {
      e.stopPropagation();
      document.addEventListener('mousemove', this.resizePane);
      return document.addEventListener('mouseup', this.resizeStopped);
    };

    PaneResizeHandleElement.prototype.resizeStopped = function() {
      document.removeEventListener('mousemove', this.resizePane);
      return document.removeEventListener('mouseup', this.resizeStopped);
    };

    PaneResizeHandleElement.prototype.calcRatio = function(ratio1, ratio2, total) {
      var allRatio;
      allRatio = ratio1 + ratio2;
      return [total * ratio1 / allRatio, total * ratio2 / allRatio];
    };

    PaneResizeHandleElement.prototype.setFlexGrow = function(prevSize, nextSize) {
      var flexGrows, totalScale;
      this.prevModel = this.previousSibling.model;
      this.nextModel = this.nextSibling.model;
      totalScale = this.prevModel.getFlexScale() + this.nextModel.getFlexScale();
      flexGrows = this.calcRatio(prevSize, nextSize, totalScale);
      this.prevModel.setFlexScale(flexGrows[0]);
      return this.nextModel.setFlexScale(flexGrows[1]);
    };

    PaneResizeHandleElement.prototype.fixInRange = function(val, minValue, maxValue) {
      return Math.min(Math.max(val, minValue), maxValue);
    };

    PaneResizeHandleElement.prototype.resizePane = function(arg) {
      var bottomHeight, clientX, clientY, leftWidth, rightWidth, topHeight, totalHeight, totalWidth, which;
      clientX = arg.clientX, clientY = arg.clientY, which = arg.which;
      if (which !== 1) {
        return this.resizeStopped();
      }
      if (!((this.previousSibling != null) && (this.nextSibling != null))) {
        return this.resizeStopped();
      }
      if (this.isHorizontal) {
        totalWidth = this.previousSibling.clientWidth + this.nextSibling.clientWidth;
        leftWidth = clientX - this.previousSibling.getBoundingClientRect().left;
        leftWidth = this.fixInRange(leftWidth, 0, totalWidth);
        rightWidth = totalWidth - leftWidth;
        return this.setFlexGrow(leftWidth, rightWidth);
      } else {
        totalHeight = this.previousSibling.clientHeight + this.nextSibling.clientHeight;
        topHeight = clientY - this.previousSibling.getBoundingClientRect().top;
        topHeight = this.fixInRange(topHeight, 0, totalHeight);
        bottomHeight = totalHeight - topHeight;
        return this.setFlexGrow(topHeight, bottomHeight);
      }
    };

    return PaneResizeHandleElement;

  })(HTMLElement);

  module.exports = PaneResizeHandleElement = document.registerElement('atom-pane-resize-handle', {
    prototype: PaneResizeHandleElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lLXJlc2l6ZS1oYW5kbGUtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVCQUFBO0lBQUE7OztFQUFNOzs7Ozs7O3NDQUNKLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLElBQWpCO01BQ2QsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQW9CLElBQXBCO2FBQ2pCLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBSGU7O3NDQUtqQixvQkFBQSxHQUFzQixTQUFBO01BQ3BCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixVQUFsQixFQUE4QixJQUFDLENBQUEsa0JBQWtCLENBQUMsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBOUI7YUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsV0FBbEIsRUFBK0IsSUFBQyxDQUFBLGFBQWEsQ0FBQyxJQUFmLENBQW9CLElBQXBCLENBQS9CO0lBRm9COztzQ0FJdEIsZ0JBQUEsR0FBa0IsU0FBQTtNQUNoQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxRQUF6QixDQUFrQyxZQUFsQzthQUNoQixJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBa0IsSUFBQyxDQUFBLFlBQUosR0FBc0IsWUFBdEIsR0FBd0MsVUFBdkQ7SUFGZ0I7O3NDQUlsQixnQkFBQSxHQUFrQixTQUFBO2FBQ2hCLElBQUMsQ0FBQSxhQUFELENBQUE7SUFEZ0I7O3NDQUdsQixrQkFBQSxHQUFvQixTQUFBO0FBRWxCLFVBQUE7O1dBQWdCLENBQUUsS0FBSyxDQUFDLFlBQXhCLENBQXFD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QUMsQ0FBQSxXQUFELENBQWEsU0FBYixFQUF3QixZQUF4QixFQWRGOztJQUpVOzs7O0tBOUN3Qjs7RUFrRXRDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLHVCQUFBLEdBQ2pCLFFBQVEsQ0FBQyxlQUFULENBQXlCLHlCQUF6QixFQUFvRDtJQUFBLFNBQUEsRUFBVyx1QkFBdUIsQ0FBQyxTQUFuQztHQUFwRDtBQW5FQSIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFBhbmVSZXNpemVIYW5kbGVFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIEByZXNpemVQYW5lID0gQHJlc2l6ZVBhbmUuYmluZCh0aGlzKVxuICAgIEByZXNpemVTdG9wcGVkID0gQHJlc2l6ZVN0b3BwZWQuYmluZCh0aGlzKVxuICAgIEBzdWJzY3JpYmVUb0RPTUV2ZW50cygpXG5cbiAgc3Vic2NyaWJlVG9ET01FdmVudHM6IC0+XG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJywgQHJlc2l6ZVRvRml0Q29udGVudC5iaW5kKHRoaXMpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEByZXNpemVTdGFydGVkLmJpbmQodGhpcylcblxuICBhdHRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEBpc0hvcml6b250YWwgPSBAcGFyZW50RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJob3Jpem9udGFsXCIpXG4gICAgQGNsYXNzTGlzdC5hZGQgaWYgQGlzSG9yaXpvbnRhbCB0aGVuICdob3Jpem9udGFsJyBlbHNlICd2ZXJ0aWNhbCdcblxuICBkZXRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEByZXNpemVTdG9wcGVkKClcblxuICByZXNpemVUb0ZpdENvbnRlbnQ6IC0+XG4gICAgIyBjbGVhciBmbGV4LWdyb3cgY3NzIHN0eWxlIG9mIGJvdGggcGFuZVxuICAgIEBwcmV2aW91c1NpYmxpbmc/Lm1vZGVsLnNldEZsZXhTY2FsZSgxKVxuICAgIEBuZXh0U2libGluZz8ubW9kZWwuc2V0RmxleFNjYWxlKDEpXG5cbiAgcmVzaXplU3RhcnRlZDogKGUpIC0+XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlbW92ZScsIEByZXNpemVQYW5lXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcsIEByZXNpemVTdG9wcGVkXG5cbiAgcmVzaXplU3RvcHBlZDogLT5cbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICdtb3VzZW1vdmUnLCBAcmVzaXplUGFuZVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAcmVzaXplU3RvcHBlZFxuXG4gIGNhbGNSYXRpbzogKHJhdGlvMSwgcmF0aW8yLCB0b3RhbCkgLT5cbiAgICBhbGxSYXRpbyA9IHJhdGlvMSArIHJhdGlvMlxuICAgIFt0b3RhbCAqIHJhdGlvMSAvIGFsbFJhdGlvLCB0b3RhbCAqIHJhdGlvMiAvIGFsbFJhdGlvXVxuXG4gIHNldEZsZXhHcm93OiAocHJldlNpemUsIG5leHRTaXplKSAtPlxuICAgIEBwcmV2TW9kZWwgPSBAcHJldmlvdXNTaWJsaW5nLm1vZGVsXG4gICAgQG5leHRNb2RlbCA9IEBuZXh0U2libGluZy5tb2RlbFxuICAgIHRvdGFsU2NhbGUgPSBAcHJldk1vZGVsLmdldEZsZXhTY2FsZSgpICsgQG5leHRNb2RlbC5nZXRGbGV4U2NhbGUoKVxuICAgIGZsZXhHcm93cyA9IEBjYWxjUmF0aW8ocHJldlNpemUsIG5leHRTaXplLCB0b3RhbFNjYWxlKVxuICAgIEBwcmV2TW9kZWwuc2V0RmxleFNjYWxlIGZsZXhHcm93c1swXVxuICAgIEBuZXh0TW9kZWwuc2V0RmxleFNjYWxlIGZsZXhHcm93c1sxXVxuXG4gIGZpeEluUmFuZ2U6ICh2YWwsIG1pblZhbHVlLCBtYXhWYWx1ZSkgLT5cbiAgICBNYXRoLm1pbihNYXRoLm1heCh2YWwsIG1pblZhbHVlKSwgbWF4VmFsdWUpXG5cbiAgcmVzaXplUGFuZTogKHtjbGllbnRYLCBjbGllbnRZLCB3aGljaH0pIC0+XG4gICAgcmV0dXJuIEByZXNpemVTdG9wcGVkKCkgdW5sZXNzIHdoaWNoIGlzIDFcbiAgICByZXR1cm4gQHJlc2l6ZVN0b3BwZWQoKSB1bmxlc3MgQHByZXZpb3VzU2libGluZz8gYW5kIEBuZXh0U2libGluZz9cblxuICAgIGlmIEBpc0hvcml6b250YWxcbiAgICAgIHRvdGFsV2lkdGggPSBAcHJldmlvdXNTaWJsaW5nLmNsaWVudFdpZHRoICsgQG5leHRTaWJsaW5nLmNsaWVudFdpZHRoXG4gICAgICAjZ2V0IHRoZSBsZWZ0IGFuZCByaWdodCB3aWR0aCBhZnRlciBtb3ZlIHRoZSByZXNpemUgdmlld1xuICAgICAgbGVmdFdpZHRoID0gY2xpZW50WCAtIEBwcmV2aW91c1NpYmxpbmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdFxuICAgICAgbGVmdFdpZHRoID0gQGZpeEluUmFuZ2UobGVmdFdpZHRoLCAwLCB0b3RhbFdpZHRoKVxuICAgICAgcmlnaHRXaWR0aCA9IHRvdGFsV2lkdGggLSBsZWZ0V2lkdGhcbiAgICAgICMgc2V0IHRoZSBmbGV4IGdyb3cgYnkgdGhlIHJhdGlvIG9mIGxlZnQgd2lkdGggYW5kIHJpZ2h0IHdpZHRoXG4gICAgICAjIHRvIGNoYW5nZSBwYW5lIHdpZHRoXG4gICAgICBAc2V0RmxleEdyb3cobGVmdFdpZHRoLCByaWdodFdpZHRoKVxuICAgIGVsc2VcbiAgICAgIHRvdGFsSGVpZ2h0ID0gQHByZXZpb3VzU2libGluZy5jbGllbnRIZWlnaHQgKyBAbmV4dFNpYmxpbmcuY2xpZW50SGVpZ2h0XG4gICAgICB0b3BIZWlnaHQgPSBjbGllbnRZIC0gQHByZXZpb3VzU2libGluZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgIHRvcEhlaWdodCA9IEBmaXhJblJhbmdlKHRvcEhlaWdodCwgMCwgdG90YWxIZWlnaHQpXG4gICAgICBib3R0b21IZWlnaHQgPSB0b3RhbEhlaWdodCAtIHRvcEhlaWdodFxuICAgICAgQHNldEZsZXhHcm93KHRvcEhlaWdodCwgYm90dG9tSGVpZ2h0KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVSZXNpemVIYW5kbGVFbGVtZW50ID1cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCAnYXRvbS1wYW5lLXJlc2l6ZS1oYW5kbGUnLCBwcm90b3R5cGU6IFBhbmVSZXNpemVIYW5kbGVFbGVtZW50LnByb3RvdHlwZVxuIl19
