(function() {
  var CorrectionsView, SelectListView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SelectListView = require('atom-space-pen-views').SelectListView;

  module.exports = CorrectionsView = (function(superClass) {
    extend(CorrectionsView, superClass);

    function CorrectionsView() {
      return CorrectionsView.__super__.constructor.apply(this, arguments);
    }

    CorrectionsView.prototype.initialize = function(editor, corrections, marker, updateTarget, updateCallback) {
      this.editor = editor;
      this.corrections = corrections;
      this.marker = marker;
      this.updateTarget = updateTarget;
      this.updateCallback = updateCallback;
      CorrectionsView.__super__.initialize.apply(this, arguments);
      this.addClass('spell-check-corrections corrections popover-list');
      return this.attach();
    };

    CorrectionsView.prototype.attach = function() {
      this.setItems(this.corrections);
      return this.overlayDecoration = this.editor.decorateMarker(this.marker, {
        type: 'overlay',
        item: this
      });
    };

    CorrectionsView.prototype.attached = function() {
      this.storeFocusedElement();
      return this.focusFilterEditor();
    };

    CorrectionsView.prototype.destroy = function() {
      this.cancel();
      return this.remove();
    };

    CorrectionsView.prototype.confirmed = function(item) {
      this.cancel();
      if (!item) {
        return;
      }
      return this.editor.transact((function(_this) {
        return function() {
          var args, projectPath, ref, ref1, ref2, relativePath;
          if (item.isSuggestion) {
            _this.editor.setSelectedBufferRange(_this.marker.getBufferRange());
            return _this.editor.insertText(item.suggestion);
          } else {
            projectPath = null;
            relativePath = null;
            if ((ref = _this.editor.buffer) != null ? (ref1 = ref.file) != null ? ref1.path : void 0 : void 0) {
              ref2 = atom.project.relativizePath(_this.editor.buffer.file.path), projectPath = ref2[0], relativePath = ref2[1];
            }
            args = {
              id: _this.id,
              projectPath: projectPath,
              relativePath: relativePath
            };
            item.plugin.add(args, item);
            return _this.updateCallback.bind(_this.updateTarget)();
          }
        };
      })(this));
    };

    CorrectionsView.prototype.cancelled = function() {
      this.overlayDecoration.destroy();
      return this.restoreFocus();
    };

    CorrectionsView.prototype.viewForItem = function(item) {
      var element, em;
      element = document.createElement("li");
      if (item.isSuggestion) {
        element.textContent = item.label;
      } else {
        em = document.createElement("em");
        em.textContent = item.label;
        element.appendChild(em);
      }
      return element;
    };

    CorrectionsView.prototype.getFilterKey = function() {
      return "label";
    };

    CorrectionsView.prototype.selectNextItemView = function() {
      CorrectionsView.__super__.selectNextItemView.apply(this, arguments);
      return false;
    };

    CorrectionsView.prototype.selectPreviousItemView = function() {
      CorrectionsView.__super__.selectPreviousItemView.apply(this, arguments);
      return false;
    };

    CorrectionsView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'No corrections';
      } else {
        return CorrectionsView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    return CorrectionsView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvY29ycmVjdGlvbnMtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtCQUFBO0lBQUE7OztFQUFDLGlCQUFrQixPQUFBLENBQVEsc0JBQVI7O0VBRW5CLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7OEJBQ0osVUFBQSxHQUFZLFNBQUMsTUFBRCxFQUFVLFdBQVYsRUFBd0IsTUFBeEIsRUFBaUMsWUFBakMsRUFBZ0QsY0FBaEQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxjQUFEO01BQWMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsZUFBRDtNQUFlLElBQUMsQ0FBQSxpQkFBRDtNQUMxRCxpREFBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrREFBVjthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFIVTs7OEJBS1osTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxXQUFYO2FBQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixJQUFDLENBQUEsTUFBeEIsRUFBZ0M7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUFpQixJQUFBLEVBQU0sSUFBdkI7T0FBaEM7SUFGZjs7OEJBSVIsUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsbUJBQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRlE7OzhCQUlWLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE1BQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFGTzs7OEJBSVQsU0FBQSxHQUFXLFNBQUMsSUFBRDtNQUNULElBQUMsQ0FBQSxNQUFELENBQUE7TUFDQSxJQUFBLENBQWMsSUFBZDtBQUFBLGVBQUE7O2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQWlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNmLGNBQUE7VUFBQSxJQUFHLElBQUksQ0FBQyxZQUFSO1lBRUUsS0FBQyxDQUFBLE1BQU0sQ0FBQyxzQkFBUixDQUErQixLQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQSxDQUEvQjttQkFDQSxLQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBbUIsSUFBSSxDQUFDLFVBQXhCLEVBSEY7V0FBQSxNQUFBO1lBTUUsV0FBQSxHQUFjO1lBQ2QsWUFBQSxHQUFlO1lBQ2YsMEVBQXVCLENBQUUsc0JBQXpCO2NBQ0UsT0FBOEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLEtBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFoRCxDQUE5QixFQUFDLHFCQUFELEVBQWMsdUJBRGhCOztZQUVBLElBQUEsR0FBTztjQUNMLEVBQUEsRUFBSSxLQUFDLENBQUEsRUFEQTtjQUVMLFdBQUEsRUFBYSxXQUZSO2NBR0wsWUFBQSxFQUFjLFlBSFQ7O1lBT1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLElBQWhCLEVBQXNCLElBQXRCO21CQUdBLEtBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBcUIsS0FBQyxDQUFBLFlBQXRCLENBQUEsQ0FBQSxFQXBCRjs7UUFEZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFIUzs7OEJBMEJYLFNBQUEsR0FBVyxTQUFBO01BQ1QsSUFBQyxDQUFBLGlCQUFpQixDQUFDLE9BQW5CLENBQUE7YUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO0lBRlM7OzhCQUlYLFdBQUEsR0FBYSxTQUFDLElBQUQ7QUFDWCxVQUFBO01BQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLElBQXZCO01BQ1YsSUFBRyxJQUFJLENBQUMsWUFBUjtRQUVFLE9BQU8sQ0FBQyxXQUFSLEdBQXNCLElBQUksQ0FBQyxNQUY3QjtPQUFBLE1BQUE7UUFLRSxFQUFBLEdBQUssUUFBUSxDQUFDLGFBQVQsQ0FBdUIsSUFBdkI7UUFDTCxFQUFFLENBQUMsV0FBSCxHQUFpQixJQUFJLENBQUM7UUFDdEIsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsRUFBcEIsRUFQRjs7YUFRQTtJQVZXOzs4QkFZYixZQUFBLEdBQWMsU0FBQTthQUNaO0lBRFk7OzhCQUdkLGtCQUFBLEdBQW9CLFNBQUE7TUFDbEIseURBQUEsU0FBQTthQUNBO0lBRmtCOzs4QkFJcEIsc0JBQUEsR0FBd0IsU0FBQTtNQUN0Qiw2REFBQSxTQUFBO2FBQ0E7SUFGc0I7OzhCQUl4QixlQUFBLEdBQWlCLFNBQUMsU0FBRDtNQUNmLElBQUcsU0FBQSxLQUFhLENBQWhCO2VBQ0UsaUJBREY7T0FBQSxNQUFBO2VBR0Usc0RBQUEsU0FBQSxFQUhGOztJQURlOzs7O0tBdkVXO0FBSDlCIiwic291cmNlc0NvbnRlbnQiOlsie1NlbGVjdExpc3RWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb3JyZWN0aW9uc1ZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICBpbml0aWFsaXplOiAoQGVkaXRvciwgQGNvcnJlY3Rpb25zLCBAbWFya2VyLCBAdXBkYXRlVGFyZ2V0LCBAdXBkYXRlQ2FsbGJhY2spIC0+XG4gICAgc3VwZXJcbiAgICBAYWRkQ2xhc3MoJ3NwZWxsLWNoZWNrLWNvcnJlY3Rpb25zIGNvcnJlY3Rpb25zIHBvcG92ZXItbGlzdCcpXG4gICAgQGF0dGFjaCgpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEBzZXRJdGVtcyhAY29ycmVjdGlvbnMpXG4gICAgQG92ZXJsYXlEZWNvcmF0aW9uID0gQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihAbWFya2VyLCB0eXBlOiAnb3ZlcmxheScsIGl0ZW06IHRoaXMpXG5cbiAgYXR0YWNoZWQ6IC0+XG4gICAgQHN0b3JlRm9jdXNlZEVsZW1lbnQoKVxuICAgIEBmb2N1c0ZpbHRlckVkaXRvcigpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAY2FuY2VsKClcbiAgICBAcmVtb3ZlKClcblxuICBjb25maXJtZWQ6IChpdGVtKSAtPlxuICAgIEBjYW5jZWwoKVxuICAgIHJldHVybiB1bmxlc3MgaXRlbVxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGlmIGl0ZW0uaXNTdWdnZXN0aW9uXG4gICAgICAgICMgVXBkYXRlIHRoZSBidWZmZXIgd2l0aCB0aGUgY29ycmVjdGlvbi5cbiAgICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKEBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcbiAgICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KGl0ZW0uc3VnZ2VzdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBCdWlsZCB1cCB0aGUgYXJndW1lbnRzIG9iamVjdCBmb3IgdGhpcyBidWZmZXIgYW5kIHRleHQuXG4gICAgICAgIHByb2plY3RQYXRoID0gbnVsbFxuICAgICAgICByZWxhdGl2ZVBhdGggPSBudWxsXG4gICAgICAgIGlmIEBlZGl0b3IuYnVmZmVyPy5maWxlPy5wYXRoXG4gICAgICAgICAgW3Byb2plY3RQYXRoLCByZWxhdGl2ZVBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKEBlZGl0b3IuYnVmZmVyLmZpbGUucGF0aClcbiAgICAgICAgYXJncyA9IHtcbiAgICAgICAgICBpZDogQGlkLFxuICAgICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgICByZWxhdGl2ZVBhdGg6IHJlbGF0aXZlUGF0aFxuICAgICAgICB9XG5cbiAgICAgICAgIyBTZW5kIHRoZSBcImFkZFwiIHJlcXVlc3QgdG8gdGhlIHBsdWdpbi5cbiAgICAgICAgaXRlbS5wbHVnaW4uYWRkIGFyZ3MsIGl0ZW1cblxuICAgICAgICAjIFVwZGF0ZSB0aGUgYnVmZmVyIHRvIGhhbmRsZSB0aGUgY29ycmVjdGlvbnMuXG4gICAgICAgIEB1cGRhdGVDYWxsYmFjay5iaW5kKEB1cGRhdGVUYXJnZXQpKClcblxuICBjYW5jZWxsZWQ6IC0+XG4gICAgQG92ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKVxuICAgIEByZXN0b3JlRm9jdXMoKVxuXG4gIHZpZXdGb3JJdGVtOiAoaXRlbSkgLT5cbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBcImxpXCJcbiAgICBpZiBpdGVtLmlzU3VnZ2VzdGlvblxuICAgICAgIyBUaGlzIGlzIGEgd29yZCByZXBsYWNlbWVudCBzdWdnZXN0aW9uLlxuICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGl0ZW0ubGFiZWxcbiAgICBlbHNlXG4gICAgICAjIFRoaXMgaXMgYW4gb3BlcmF0aW9uIHN1Y2ggYXMgYWRkIHdvcmQuXG4gICAgICBlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJlbVwiXG4gICAgICBlbS50ZXh0Q29udGVudCA9IGl0ZW0ubGFiZWxcbiAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQgZW1cbiAgICBlbGVtZW50XG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgIFwibGFiZWxcIlxuXG4gIHNlbGVjdE5leHRJdGVtVmlldzogLT5cbiAgICBzdXBlclxuICAgIGZhbHNlXG5cbiAgc2VsZWN0UHJldmlvdXNJdGVtVmlldzogLT5cbiAgICBzdXBlclxuICAgIGZhbHNlXG5cbiAgZ2V0RW1wdHlNZXNzYWdlOiAoaXRlbUNvdW50KSAtPlxuICAgIGlmIGl0ZW1Db3VudCBpcyAwXG4gICAgICAnTm8gY29ycmVjdGlvbnMnXG4gICAgZWxzZVxuICAgICAgc3VwZXJcbiJdfQ==
