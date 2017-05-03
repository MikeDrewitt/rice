(function() {
  var Bookmarks, BookmarksView, CompositeDisposable, ReactBookmarks, disposables, editorsBookmarks;

  CompositeDisposable = require('atom').CompositeDisposable;

  Bookmarks = null;

  ReactBookmarks = null;

  BookmarksView = null;

  editorsBookmarks = null;

  disposables = null;

  module.exports = {
    activate: function(bookmarksByEditorId) {
      var bookmarksView;
      editorsBookmarks = [];
      bookmarksView = null;
      disposables = new CompositeDisposable;
      atom.commands.add('atom-workspace', 'bookmarks:view-all', function() {
        if (BookmarksView == null) {
          BookmarksView = require('./bookmarks-view');
        }
        if (bookmarksView == null) {
          bookmarksView = new BookmarksView(editorsBookmarks);
        }
        return bookmarksView.show();
      });
      return atom.workspace.observeTextEditors(function(textEditor) {
        var bookmarks, state;
        if (Bookmarks == null) {
          Bookmarks = require('./bookmarks');
        }
        if (state = bookmarksByEditorId[textEditor.id]) {
          bookmarks = Bookmarks.deserialize(textEditor, state);
        } else {
          bookmarks = new Bookmarks(textEditor);
        }
        editorsBookmarks.push(bookmarks);
        return disposables.add(textEditor.onDidDestroy(function() {
          var index;
          index = editorsBookmarks.indexOf(bookmarks);
          if (index !== -1) {
            editorsBookmarks.splice(index, 1);
          }
          return bookmarks.destroy();
        }));
      });
    },
    deactivate: function() {
      var bookmarks, i, len;
      if (typeof bookmarksView !== "undefined" && bookmarksView !== null) {
        bookmarksView.destroy();
      }
      for (i = 0, len = editorsBookmarks.length; i < len; i++) {
        bookmarks = editorsBookmarks[i];
        bookmarks.deactivate();
      }
      return disposables.dispose();
    },
    serialize: function() {
      var bookmarks, bookmarksByEditorId, i, len;
      bookmarksByEditorId = {};
      for (i = 0, len = editorsBookmarks.length; i < len; i++) {
        bookmarks = editorsBookmarks[i];
        bookmarksByEditorId[bookmarks.editor.id] = bookmarks.serialize();
      }
      return bookmarksByEditorId;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ib29rbWFya3MvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLFNBQUEsR0FBWTs7RUFDWixjQUFBLEdBQWlCOztFQUNqQixhQUFBLEdBQWdCOztFQUNoQixnQkFBQSxHQUFtQjs7RUFDbkIsV0FBQSxHQUFjOztFQUVkLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxtQkFBRDtBQUNSLFVBQUE7TUFBQSxnQkFBQSxHQUFtQjtNQUNuQixhQUFBLEdBQWdCO01BQ2hCLFdBQUEsR0FBYyxJQUFJO01BRWxCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFDRSxvQkFERixFQUN3QixTQUFBOztVQUNwQixnQkFBaUIsT0FBQSxDQUFRLGtCQUFSOzs7VUFDakIsZ0JBQXFCLElBQUEsYUFBQSxDQUFjLGdCQUFkOztlQUNyQixhQUFhLENBQUMsSUFBZCxDQUFBO01BSG9CLENBRHhCO2FBTUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxTQUFDLFVBQUQ7QUFDaEMsWUFBQTs7VUFBQSxZQUFhLE9BQUEsQ0FBUSxhQUFSOztRQUNiLElBQUcsS0FBQSxHQUFRLG1CQUFvQixDQUFBLFVBQVUsQ0FBQyxFQUFYLENBQS9CO1VBQ0UsU0FBQSxHQUFZLFNBQVMsQ0FBQyxXQUFWLENBQXNCLFVBQXRCLEVBQWtDLEtBQWxDLEVBRGQ7U0FBQSxNQUFBO1VBR0UsU0FBQSxHQUFnQixJQUFBLFNBQUEsQ0FBVSxVQUFWLEVBSGxCOztRQUlBLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLFNBQXRCO2VBQ0EsV0FBVyxDQUFDLEdBQVosQ0FBZ0IsVUFBVSxDQUFDLFlBQVgsQ0FBd0IsU0FBQTtBQUN0QyxjQUFBO1VBQUEsS0FBQSxHQUFRLGdCQUFnQixDQUFDLE9BQWpCLENBQXlCLFNBQXpCO1VBQ1IsSUFBcUMsS0FBQSxLQUFXLENBQUMsQ0FBakQ7WUFBQSxnQkFBZ0IsQ0FBQyxNQUFqQixDQUF3QixLQUF4QixFQUErQixDQUEvQixFQUFBOztpQkFDQSxTQUFTLENBQUMsT0FBVixDQUFBO1FBSHNDLENBQXhCLENBQWhCO01BUGdDLENBQWxDO0lBWFEsQ0FBVjtJQXVCQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7O1FBQUEsYUFBYSxDQUFFLE9BQWYsQ0FBQTs7QUFDQSxXQUFBLGtEQUFBOztRQUFBLFNBQVMsQ0FBQyxVQUFWLENBQUE7QUFBQTthQUNBLFdBQVcsQ0FBQyxPQUFaLENBQUE7SUFIVSxDQXZCWjtJQTRCQSxTQUFBLEVBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxtQkFBQSxHQUFzQjtBQUN0QixXQUFBLGtEQUFBOztRQUNFLG1CQUFvQixDQUFBLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBakIsQ0FBcEIsR0FBMkMsU0FBUyxDQUFDLFNBQVYsQ0FBQTtBQUQ3QzthQUVBO0lBSlMsQ0E1Qlg7O0FBVEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5Cb29rbWFya3MgPSBudWxsXG5SZWFjdEJvb2ttYXJrcyA9IG51bGxcbkJvb2ttYXJrc1ZpZXcgPSBudWxsXG5lZGl0b3JzQm9va21hcmtzID0gbnVsbFxuZGlzcG9zYWJsZXMgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IChib29rbWFya3NCeUVkaXRvcklkKSAtPlxuICAgIGVkaXRvcnNCb29rbWFya3MgPSBbXVxuICAgIGJvb2ttYXJrc1ZpZXcgPSBudWxsXG4gICAgZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICdib29rbWFya3M6dmlldy1hbGwnLCAtPlxuICAgICAgICBCb29rbWFya3NWaWV3ID89IHJlcXVpcmUgJy4vYm9va21hcmtzLXZpZXcnXG4gICAgICAgIGJvb2ttYXJrc1ZpZXcgPz0gbmV3IEJvb2ttYXJrc1ZpZXcoZWRpdG9yc0Jvb2ttYXJrcylcbiAgICAgICAgYm9va21hcmtzVmlldy5zaG93KClcblxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAodGV4dEVkaXRvcikgLT5cbiAgICAgIEJvb2ttYXJrcyA/PSByZXF1aXJlICcuL2Jvb2ttYXJrcydcbiAgICAgIGlmIHN0YXRlID0gYm9va21hcmtzQnlFZGl0b3JJZFt0ZXh0RWRpdG9yLmlkXVxuICAgICAgICBib29rbWFya3MgPSBCb29rbWFya3MuZGVzZXJpYWxpemUodGV4dEVkaXRvciwgc3RhdGUpXG4gICAgICBlbHNlXG4gICAgICAgIGJvb2ttYXJrcyA9IG5ldyBCb29rbWFya3ModGV4dEVkaXRvcilcbiAgICAgIGVkaXRvcnNCb29rbWFya3MucHVzaChib29rbWFya3MpXG4gICAgICBkaXNwb3NhYmxlcy5hZGQgdGV4dEVkaXRvci5vbkRpZERlc3Ryb3kgLT5cbiAgICAgICAgaW5kZXggPSBlZGl0b3JzQm9va21hcmtzLmluZGV4T2YoYm9va21hcmtzKVxuICAgICAgICBlZGl0b3JzQm9va21hcmtzLnNwbGljZShpbmRleCwgMSkgaWYgaW5kZXggaXNudCAtMVxuICAgICAgICBib29rbWFya3MuZGVzdHJveSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBib29rbWFya3NWaWV3Py5kZXN0cm95KClcbiAgICBib29rbWFya3MuZGVhY3RpdmF0ZSgpIGZvciBib29rbWFya3MgaW4gZWRpdG9yc0Jvb2ttYXJrc1xuICAgIGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBib29rbWFya3NCeUVkaXRvcklkID0ge31cbiAgICBmb3IgYm9va21hcmtzIGluIGVkaXRvcnNCb29rbWFya3NcbiAgICAgIGJvb2ttYXJrc0J5RWRpdG9ySWRbYm9va21hcmtzLmVkaXRvci5pZF0gPSBib29rbWFya3Muc2VyaWFsaXplKClcbiAgICBib29rbWFya3NCeUVkaXRvcklkXG4iXX0=
