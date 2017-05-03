(function() {
  var $$, BookmarksView, SelectListView, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  ref = require('atom-space-pen-views'), $$ = ref.$$, SelectListView = ref.SelectListView;

  module.exports = BookmarksView = (function(superClass) {
    extend(BookmarksView, superClass);

    function BookmarksView() {
      return BookmarksView.__super__.constructor.apply(this, arguments);
    }

    BookmarksView.prototype.initialize = function(editorsBookmarks) {
      this.editorsBookmarks = editorsBookmarks;
      BookmarksView.__super__.initialize.apply(this, arguments);
      return this.addClass('bookmarks-view');
    };

    BookmarksView.prototype.destroy = function() {
      this.remove();
      return this.panel.destroy();
    };

    BookmarksView.prototype.getFilterKey = function() {
      return 'filterText';
    };

    BookmarksView.prototype.attached = function() {
      return this.focusFilterEditor();
    };

    BookmarksView.prototype.show = function() {
      this.populateBookmarks();
      this.storeFocusedElement();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      return this.focusFilterEditor();
    };

    BookmarksView.prototype.hide = function() {
      return this.panel.hide();
    };

    BookmarksView.prototype.cancelled = function() {
      return this.hide();
    };

    BookmarksView.prototype.getFilterText = function(bookmark) {
      var bookmarkRow, bufferPath, lineText, segments;
      segments = [];
      bookmarkRow = bookmark.marker.getStartBufferPosition().row;
      segments.push(bookmarkRow);
      if (bufferPath = bookmark.editor.getPath()) {
        segments.push(bufferPath);
      }
      if (lineText = this.getLineText(bookmark)) {
        segments.push(lineText);
      }
      return segments.join(' ');
    };

    BookmarksView.prototype.getLineText = function(bookmark) {
      var ref1;
      return (ref1 = bookmark.editor.lineTextForBufferRow(bookmark.marker.getStartBufferPosition().row)) != null ? ref1.trim() : void 0;
    };

    BookmarksView.prototype.populateBookmarks = function() {
      var bookmark, bookmarks, editor, editorBookmarks, i, j, len, len1, marker, ref1, ref2;
      bookmarks = [];
      ref1 = this.editorsBookmarks;
      for (i = 0, len = ref1.length; i < len; i++) {
        editorBookmarks = ref1[i];
        editor = editorBookmarks.editor;
        ref2 = editorBookmarks.markerLayer.getMarkers();
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          marker = ref2[j];
          bookmark = {
            marker: marker,
            editor: editor
          };
          bookmark.filterText = this.getFilterText(bookmark);
          bookmarks.push(bookmark);
        }
      }
      return this.setItems(bookmarks);
    };

    BookmarksView.prototype.viewForItem = function(bookmark) {
      var bookmarkEndRow, bookmarkLocation, bookmarkStartRow, filePath, lineText;
      bookmarkStartRow = bookmark.marker.getStartBufferPosition().row;
      bookmarkEndRow = bookmark.marker.getEndBufferPosition().row;
      if (filePath = bookmark.editor.getPath()) {
        bookmarkLocation = (path.basename(filePath)) + ":" + (bookmarkStartRow + 1);
      } else {
        bookmarkLocation = "untitled:" + (bookmarkStartRow + 1);
      }
      if (bookmarkStartRow !== bookmarkEndRow) {
        bookmarkLocation += "-" + (bookmarkEndRow + 1);
      }
      lineText = this.getLineText(bookmark);
      return $$(function() {
        if (lineText) {
          return this.li({
            "class": 'bookmark two-lines'
          }, (function(_this) {
            return function() {
              _this.div(bookmarkLocation, {
                "class": 'primary-line'
              });
              return _this.div(lineText, {
                "class": 'secondary-line line-text'
              });
            };
          })(this));
        } else {
          return this.li({
            "class": 'bookmark'
          }, (function(_this) {
            return function() {
              return _this.div(bookmarkLocation, {
                "class": 'primary-line'
              });
            };
          })(this));
        }
      });
    };

    BookmarksView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'No bookmarks found';
      } else {
        return BookmarksView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    BookmarksView.prototype.confirmed = function(arg) {
      var editor, marker;
      editor = arg.editor, marker = arg.marker;
      editor.setSelectedBufferRange(marker.getBufferRange(), {
        autoscroll: true
      });
      atom.workspace.paneForItem(editor).activate();
      atom.workspace.paneForItem(editor).activateItem(editor);
      return this.cancel();
    };

    return BookmarksView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ib29rbWFya3MvbGliL2Jvb2ttYXJrcy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNENBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQXVCLE9BQUEsQ0FBUSxzQkFBUixDQUF2QixFQUFDLFdBQUQsRUFBSzs7RUFFTCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzRCQUNKLFVBQUEsR0FBWSxTQUFDLGdCQUFEO01BQUMsSUFBQyxDQUFBLG1CQUFEO01BQ1gsK0NBQUEsU0FBQTthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsZ0JBQVY7SUFGVTs7NEJBSVosT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsTUFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUE7SUFGTzs7NEJBSVQsWUFBQSxHQUFjLFNBQUE7YUFDWjtJQURZOzs0QkFHZCxRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRFE7OzRCQUdWLElBQUEsR0FBTSxTQUFBO01BQ0osSUFBQyxDQUFBLGlCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsbUJBQUQsQ0FBQTs7UUFDQSxJQUFDLENBQUEsUUFBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7VUFBQSxJQUFBLEVBQU0sSUFBTjtTQUE3Qjs7TUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBTEk7OzRCQU9OLElBQUEsR0FBTSxTQUFBO2FBQ0osSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7SUFESTs7NEJBR04sU0FBQSxHQUFXLFNBQUE7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Q0FBSDtJQVhXOzs0QkFvQmIsZUFBQSxHQUFpQixTQUFDLFNBQUQ7TUFDZixJQUFHLFNBQUEsS0FBYSxDQUFoQjtlQUNFLHFCQURGO09BQUEsTUFBQTtlQUdFLG9EQUFBLFNBQUEsRUFIRjs7SUFEZTs7NEJBTWpCLFNBQUEsR0FBVyxTQUFDLEdBQUQ7QUFDVCxVQUFBO01BRFcscUJBQVE7TUFDbkIsTUFBTSxDQUFDLHNCQUFQLENBQThCLE1BQU0sQ0FBQyxjQUFQLENBQUEsQ0FBOUIsRUFBdUQ7UUFBQSxVQUFBLEVBQVksSUFBWjtPQUF2RDtNQUNBLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBZixDQUEyQixNQUEzQixDQUFrQyxDQUFDLFFBQW5DLENBQUE7TUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQWYsQ0FBMkIsTUFBM0IsQ0FBa0MsQ0FBQyxZQUFuQyxDQUFnRCxNQUFoRDthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFKUzs7OztLQTdFZTtBQUw1QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG57JCQsIFNlbGVjdExpc3RWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBCb29rbWFya3NWaWV3IGV4dGVuZHMgU2VsZWN0TGlzdFZpZXdcbiAgaW5pdGlhbGl6ZTogKEBlZGl0b3JzQm9va21hcmtzKSAtPlxuICAgIHN1cGVyXG4gICAgQGFkZENsYXNzKCdib29rbWFya3MtdmlldycpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAcmVtb3ZlKClcbiAgICBAcGFuZWwuZGVzdHJveSgpXG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgICdmaWx0ZXJUZXh0J1xuXG4gIGF0dGFjaGVkOiAtPlxuICAgIEBmb2N1c0ZpbHRlckVkaXRvcigpXG5cbiAgc2hvdzogLT5cbiAgICBAcG9wdWxhdGVCb29rbWFya3MoKVxuICAgIEBzdG9yZUZvY3VzZWRFbGVtZW50KClcbiAgICBAcGFuZWwgPz0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB0aGlzKVxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIGhpZGU6IC0+XG4gICAgQHBhbmVsLmhpZGUoKVxuXG4gIGNhbmNlbGxlZDogLT5cbiAgICBAaGlkZSgpXG5cbiAgZ2V0RmlsdGVyVGV4dDogKGJvb2ttYXJrKSAtPlxuICAgIHNlZ21lbnRzID0gW11cbiAgICBib29rbWFya1JvdyA9IGJvb2ttYXJrLm1hcmtlci5nZXRTdGFydEJ1ZmZlclBvc2l0aW9uKCkucm93XG4gICAgc2VnbWVudHMucHVzaChib29rbWFya1JvdylcbiAgICBpZiBidWZmZXJQYXRoID0gYm9va21hcmsuZWRpdG9yLmdldFBhdGgoKVxuICAgICAgc2VnbWVudHMucHVzaChidWZmZXJQYXRoKVxuICAgIGlmIGxpbmVUZXh0ID0gQGdldExpbmVUZXh0KGJvb2ttYXJrKVxuICAgICAgc2VnbWVudHMucHVzaChsaW5lVGV4dClcbiAgICBzZWdtZW50cy5qb2luKCcgJylcblxuICBnZXRMaW5lVGV4dDogKGJvb2ttYXJrKSAtPlxuICAgIGJvb2ttYXJrLmVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhib29rbWFyay5tYXJrZXIuZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpLnJvdyk/LnRyaW0oKVxuXG4gIHBvcHVsYXRlQm9va21hcmtzOiAtPlxuICAgIGJvb2ttYXJrcyA9IFtdXG4gICAgZm9yIGVkaXRvckJvb2ttYXJrcyBpbiBAZWRpdG9yc0Jvb2ttYXJrc1xuICAgICAgZWRpdG9yID0gZWRpdG9yQm9va21hcmtzLmVkaXRvclxuICAgICAgZm9yIG1hcmtlciBpbiBlZGl0b3JCb29rbWFya3MubWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG4gICAgICAgIGJvb2ttYXJrID0ge21hcmtlciwgZWRpdG9yfVxuICAgICAgICBib29rbWFyay5maWx0ZXJUZXh0ID0gQGdldEZpbHRlclRleHQoYm9va21hcmspXG4gICAgICAgIGJvb2ttYXJrcy5wdXNoKGJvb2ttYXJrKVxuICAgIEBzZXRJdGVtcyhib29rbWFya3MpXG5cbiAgdmlld0Zvckl0ZW06IChib29rbWFyaykgLT5cbiAgICBib29rbWFya1N0YXJ0Um93ID0gYm9va21hcmsubWFya2VyLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICBib29rbWFya0VuZFJvdyA9IGJvb2ttYXJrLm1hcmtlci5nZXRFbmRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgIGlmIGZpbGVQYXRoID0gYm9va21hcmsuZWRpdG9yLmdldFBhdGgoKVxuICAgICAgYm9va21hcmtMb2NhdGlvbiA9IFwiI3twYXRoLmJhc2VuYW1lKGZpbGVQYXRoKX06I3tib29rbWFya1N0YXJ0Um93ICsgMX1cIlxuICAgIGVsc2VcbiAgICAgIGJvb2ttYXJrTG9jYXRpb24gPSBcInVudGl0bGVkOiN7Ym9va21hcmtTdGFydFJvdyArIDF9XCJcbiAgICBpZiBib29rbWFya1N0YXJ0Um93IGlzbnQgYm9va21hcmtFbmRSb3dcbiAgICAgIGJvb2ttYXJrTG9jYXRpb24gKz0gXCItI3tib29rbWFya0VuZFJvdyArIDF9XCJcbiAgICBsaW5lVGV4dCA9IEBnZXRMaW5lVGV4dChib29rbWFyaylcblxuICAgICQkIC0+XG4gICAgICBpZiBsaW5lVGV4dFxuICAgICAgICBAbGkgY2xhc3M6ICdib29rbWFyayB0d28tbGluZXMnLCA9PlxuICAgICAgICAgIEBkaXYgYm9va21hcmtMb2NhdGlvbiwgY2xhc3M6ICdwcmltYXJ5LWxpbmUnXG4gICAgICAgICAgQGRpdiBsaW5lVGV4dCwgY2xhc3M6ICdzZWNvbmRhcnktbGluZSBsaW5lLXRleHQnXG4gICAgICBlbHNlXG4gICAgICAgIEBsaSBjbGFzczogJ2Jvb2ttYXJrJywgPT5cbiAgICAgICAgICBAZGl2IGJvb2ttYXJrTG9jYXRpb24sIGNsYXNzOiAncHJpbWFyeS1saW5lJ1xuXG4gIGdldEVtcHR5TWVzc2FnZTogKGl0ZW1Db3VudCkgLT5cbiAgICBpZiBpdGVtQ291bnQgaXMgMFxuICAgICAgJ05vIGJvb2ttYXJrcyBmb3VuZCdcbiAgICBlbHNlXG4gICAgICBzdXBlclxuXG4gIGNvbmZpcm1lZDogKHtlZGl0b3IsIG1hcmtlcn0pIC0+XG4gICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UobWFya2VyLmdldEJ1ZmZlclJhbmdlKCksIGF1dG9zY3JvbGw6IHRydWUpXG4gICAgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yKS5hY3RpdmF0ZSgpXG4gICAgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oZWRpdG9yKS5hY3RpdmF0ZUl0ZW0oZWRpdG9yKVxuICAgIEBjYW5jZWwoKVxuIl19
