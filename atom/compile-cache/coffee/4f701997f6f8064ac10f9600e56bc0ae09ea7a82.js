(function() {
  var Grim, WrapGuideElement;

  Grim = require('grim');

  WrapGuideElement = require('./wrap-guide-element');

  module.exports = {
    activate: function() {
      this.updateConfiguration();
      return atom.workspace.observeTextEditors(function(editor) {
        var editorElement, wrapGuideElement;
        editorElement = atom.views.getView(editor);
        return wrapGuideElement = new WrapGuideElement().initialize(editor, editorElement);
      });
    },
    updateConfiguration: function() {
      var column, customColumn, customColumns, i, len, newColumns, pattern, scope;
      customColumns = atom.config.get('wrap-guide.columns');
      if (!customColumns) {
        return;
      }
      newColumns = [];
      for (i = 0, len = customColumns.length; i < len; i++) {
        customColumn = customColumns[i];
        if (!(typeof customColumn === 'object')) {
          continue;
        }
        pattern = customColumn.pattern, scope = customColumn.scope, column = customColumn.column;
        if (Grim.includeDeprecatedAPIs && pattern) {
          Grim.deprecate("The Wrap Guide package uses Atom's new language-specific configuration.\nUse of file name matching patterns for Wrap Guide configuration is deprecated.\nSee the README for details: https://github.com/atom/wrap-guide.");
          newColumns.push(customColumn);
        } else if (scope) {
          if (column === -1) {
            atom.config.set('wrap-guide.enabled', false, {
              scopeSelector: "." + scope
            });
          } else {
            atom.config.set('editor.preferredLineLength', column, {
              scopeSelector: "." + scope
            });
          }
        }
      }
      if (newColumns.length === 0) {
        newColumns = void 0;
      }
      return atom.config.set('wrap-guide.columns', newColumns);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93cmFwLWd1aWRlL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxzQkFBUjs7RUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLG1CQUFELENBQUE7YUFFQSxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLFNBQUMsTUFBRDtBQUNoQyxZQUFBO1FBQUEsYUFBQSxHQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsTUFBbkI7ZUFDaEIsZ0JBQUEsR0FBdUIsSUFBQSxnQkFBQSxDQUFBLENBQWtCLENBQUMsVUFBbkIsQ0FBOEIsTUFBOUIsRUFBc0MsYUFBdEM7TUFGUyxDQUFsQztJQUhRLENBQVY7SUFPQSxtQkFBQSxFQUFxQixTQUFBO0FBQ25CLFVBQUE7TUFBQSxhQUFBLEdBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixvQkFBaEI7TUFDaEIsSUFBQSxDQUFjLGFBQWQ7QUFBQSxlQUFBOztNQUVBLFVBQUEsR0FBYTtBQUNiLFdBQUEsK0NBQUE7O2NBQXVDLE9BQU8sWUFBUCxLQUF1Qjs7O1FBQzNELDhCQUFELEVBQVUsMEJBQVYsRUFBaUI7UUFDakIsSUFBRyxJQUFJLENBQUMscUJBQUwsSUFBK0IsT0FBbEM7VUFDRSxJQUFJLENBQUMsU0FBTCxDQUFlLDBOQUFmO1VBS0EsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsWUFBaEIsRUFORjtTQUFBLE1BT0ssSUFBRyxLQUFIO1VBQ0gsSUFBRyxNQUFBLEtBQVUsQ0FBQyxDQUFkO1lBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLG9CQUFoQixFQUFzQyxLQUF0QyxFQUE2QztjQUFBLGFBQUEsRUFBZSxHQUFBLEdBQUksS0FBbkI7YUFBN0MsRUFERjtXQUFBLE1BQUE7WUFHRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNEJBQWhCLEVBQThDLE1BQTlDLEVBQXNEO2NBQUEsYUFBQSxFQUFlLEdBQUEsR0FBSSxLQUFuQjthQUF0RCxFQUhGO1dBREc7O0FBVFA7TUFlQSxJQUEwQixVQUFVLENBQUMsTUFBWCxLQUFxQixDQUEvQztRQUFBLFVBQUEsR0FBYSxPQUFiOzthQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixvQkFBaEIsRUFBc0MsVUFBdEM7SUFyQm1CLENBUHJCOztBQUxGIiwic291cmNlc0NvbnRlbnQiOlsiR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG5cbldyYXBHdWlkZUVsZW1lbnQgPSByZXF1aXJlICcuL3dyYXAtZ3VpZGUtZWxlbWVudCdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAdXBkYXRlQ29uZmlndXJhdGlvbigpXG5cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgd3JhcEd1aWRlRWxlbWVudCA9IG5ldyBXcmFwR3VpZGVFbGVtZW50KCkuaW5pdGlhbGl6ZShlZGl0b3IsIGVkaXRvckVsZW1lbnQpXG5cbiAgdXBkYXRlQ29uZmlndXJhdGlvbjogLT5cbiAgICBjdXN0b21Db2x1bW5zID0gYXRvbS5jb25maWcuZ2V0KCd3cmFwLWd1aWRlLmNvbHVtbnMnKVxuICAgIHJldHVybiB1bmxlc3MgY3VzdG9tQ29sdW1uc1xuXG4gICAgbmV3Q29sdW1ucyA9IFtdXG4gICAgZm9yIGN1c3RvbUNvbHVtbiBpbiBjdXN0b21Db2x1bW5zIHdoZW4gdHlwZW9mIGN1c3RvbUNvbHVtbiBpcyAnb2JqZWN0J1xuICAgICAge3BhdHRlcm4sIHNjb3BlLCBjb2x1bW59ID0gY3VzdG9tQ29sdW1uXG4gICAgICBpZiBHcmltLmluY2x1ZGVEZXByZWNhdGVkQVBJcyBhbmQgcGF0dGVyblxuICAgICAgICBHcmltLmRlcHJlY2F0ZSBcIlwiXCJcbiAgICAgICAgICBUaGUgV3JhcCBHdWlkZSBwYWNrYWdlIHVzZXMgQXRvbSdzIG5ldyBsYW5ndWFnZS1zcGVjaWZpYyBjb25maWd1cmF0aW9uLlxuICAgICAgICAgIFVzZSBvZiBmaWxlIG5hbWUgbWF0Y2hpbmcgcGF0dGVybnMgZm9yIFdyYXAgR3VpZGUgY29uZmlndXJhdGlvbiBpcyBkZXByZWNhdGVkLlxuICAgICAgICAgIFNlZSB0aGUgUkVBRE1FIGZvciBkZXRhaWxzOiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS93cmFwLWd1aWRlLlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgbmV3Q29sdW1ucy5wdXNoKGN1c3RvbUNvbHVtbilcbiAgICAgIGVsc2UgaWYgc2NvcGVcbiAgICAgICAgaWYgY29sdW1uIGlzIC0xXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCd3cmFwLWd1aWRlLmVuYWJsZWQnLCBmYWxzZSwgc2NvcGVTZWxlY3RvcjogXCIuI3tzY29wZX1cIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnZWRpdG9yLnByZWZlcnJlZExpbmVMZW5ndGgnLCBjb2x1bW4sIHNjb3BlU2VsZWN0b3I6IFwiLiN7c2NvcGV9XCIpXG5cbiAgICBuZXdDb2x1bW5zID0gdW5kZWZpbmVkIGlmIG5ld0NvbHVtbnMubGVuZ3RoIGlzIDBcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ3dyYXAtZ3VpZGUuY29sdW1ucycsIG5ld0NvbHVtbnMpXG4iXX0=
