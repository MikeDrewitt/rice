(function() {
  var $$, CompositeDisposable, FileView, SymbolsView, TagGenerator, match,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  $$ = require('atom-space-pen-views').$$;

  CompositeDisposable = require('atom').CompositeDisposable;

  SymbolsView = require('./symbols-view');

  TagGenerator = require('./tag-generator');

  match = require('fuzzaldrin').match;

  module.exports = FileView = (function(superClass) {
    extend(FileView, superClass);

    function FileView() {
      return FileView.__super__.constructor.apply(this, arguments);
    }

    FileView.prototype.initialize = function() {
      FileView.__super__.initialize.apply(this, arguments);
      this.cachedTags = {};
      return this.editorsSubscription = atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var editorSubscriptions, removeFromCache;
          removeFromCache = function() {
            return delete _this.cachedTags[editor.getPath()];
          };
          editorSubscriptions = new CompositeDisposable();
          editorSubscriptions.add(editor.onDidChangeGrammar(removeFromCache));
          editorSubscriptions.add(editor.onDidSave(removeFromCache));
          editorSubscriptions.add(editor.onDidChangePath(removeFromCache));
          editorSubscriptions.add(editor.getBuffer().onDidReload(removeFromCache));
          editorSubscriptions.add(editor.getBuffer().onDidDestroy(removeFromCache));
          return editor.onDidDestroy(function() {
            return editorSubscriptions.dispose();
          });
        };
      })(this));
    };

    FileView.prototype.destroy = function() {
      this.editorsSubscription.dispose();
      return FileView.__super__.destroy.apply(this, arguments);
    };

    FileView.prototype.viewForItem = function(arg) {
      var matches, name, position;
      position = arg.position, name = arg.name;
      matches = match(name, this.getFilterQuery());
      return $$(function() {
        return this.li({
          "class": 'two-lines'
        }, (function(_this) {
          return function() {
            _this.div({
              "class": 'primary-line'
            }, function() {
              return FileView.highlightMatches(_this, name, matches);
            });
            return _this.div("Line " + (position.row + 1), {
              "class": 'secondary-line'
            });
          };
        })(this));
      });
    };

    FileView.prototype.selectItemView = function() {
      var item;
      FileView.__super__.selectItemView.apply(this, arguments);
      if (atom.config.get('symbols-view.quickJumpToFileSymbol')) {
        item = this.getSelectedItem();
        if (item != null) {
          return this.openTag(item);
        }
      }
    };

    FileView.prototype.cancelled = function() {
      var editor;
      FileView.__super__.cancelled.apply(this, arguments);
      if ((this.initialState != null) && (editor = this.getEditor())) {
        this.deserializeEditorState(editor, this.initialState);
      }
      return this.initialState = null;
    };

    FileView.prototype.toggle = function() {
      var editor, filePath;
      if (this.panel.isVisible()) {
        return this.cancel();
      } else if (filePath = this.getPath()) {
        if (atom.config.get('symbols-view.quickJumpToFileSymbol') && (editor = this.getEditor())) {
          this.initialState = this.serializeEditorState(editor);
        }
        this.populate(filePath);
        return this.attach();
      }
    };

    FileView.prototype.serializeEditorState = function(editor) {
      var editorElement, scrollTop;
      editorElement = atom.views.getView(editor);
      if (editorElement.logicalDisplayBuffer) {
        scrollTop = editorElement.getScrollTop();
      } else {
        scrollTop = editor.getScrollTop();
      }
      return {
        bufferRanges: editor.getSelectedBufferRanges(),
        scrollTop: scrollTop
      };
    };

    FileView.prototype.deserializeEditorState = function(editor, arg) {
      var bufferRanges, editorElement, scrollTop;
      bufferRanges = arg.bufferRanges, scrollTop = arg.scrollTop;
      editorElement = atom.views.getView(editor);
      editor.setSelectedBufferRanges(bufferRanges);
      if (editorElement.logicalDisplayBuffer) {
        return editorElement.setScrollTop(scrollTop);
      } else {
        return editor.setScrollTop(scrollTop);
      }
    };

    FileView.prototype.getEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    FileView.prototype.getPath = function() {
      var ref;
      return (ref = this.getEditor()) != null ? ref.getPath() : void 0;
    };

    FileView.prototype.getScopeName = function() {
      var ref, ref1;
      return (ref = this.getEditor()) != null ? (ref1 = ref.getGrammar()) != null ? ref1.scopeName : void 0 : void 0;
    };

    FileView.prototype.populate = function(filePath) {
      var tags;
      this.list.empty();
      this.setLoading('Generating symbols\u2026');
      if (tags = this.cachedTags[filePath]) {
        this.setMaxItems(2e308);
        return this.setItems(tags);
      } else {
        return this.generateTags(filePath);
      }
    };

    FileView.prototype.generateTags = function(filePath) {
      return new TagGenerator(filePath, this.getScopeName()).generate().then((function(_this) {
        return function(tags) {
          _this.cachedTags[filePath] = tags;
          _this.setMaxItems(2e308);
          return _this.setItems(tags);
        };
      })(this));
    };

    return FileView;

  })(SymbolsView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL2ZpbGUtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1FQUFBO0lBQUE7OztFQUFDLEtBQU0sT0FBQSxDQUFRLHNCQUFSOztFQUNOLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNkLFFBQVMsT0FBQSxDQUFRLFlBQVI7O0VBSVYsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt1QkFDSixVQUFBLEdBQVksU0FBQTtNQUNWLDBDQUFBLFNBQUE7TUFFQSxJQUFDLENBQUEsVUFBRCxHQUFjO2FBRWQsSUFBQyxDQUFBLG1CQUFELEdBQXVCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBa0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7QUFDdkQsY0FBQTtVQUFBLGVBQUEsR0FBa0IsU0FBQTttQkFBRyxPQUFPLEtBQUMsQ0FBQSxVQUFXLENBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBQSxDQUFBO1VBQXRCO1VBQ2xCLG1CQUFBLEdBQTBCLElBQUEsbUJBQUEsQ0FBQTtVQUMxQixtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixNQUFNLENBQUMsa0JBQVAsQ0FBMEIsZUFBMUIsQ0FBeEI7VUFDQSxtQkFBbUIsQ0FBQyxHQUFwQixDQUF3QixNQUFNLENBQUMsU0FBUCxDQUFpQixlQUFqQixDQUF4QjtVQUNBLG1CQUFtQixDQUFDLEdBQXBCLENBQXdCLE1BQU0sQ0FBQyxlQUFQLENBQXVCLGVBQXZCLENBQXhCO1VBQ0EsbUJBQW1CLENBQUMsR0FBcEIsQ0FBd0IsTUFBTSxDQUFDLFNBQVAs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LElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBdkIsQ0FBdUMsQ0FBQyxRQUF4QyxDQUFBLENBQWtELENBQUMsSUFBbkQsQ0FBd0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLElBQUQ7VUFDMUQsS0FBQyxDQUFBLFVBQVcsQ0FBQSxRQUFBLENBQVosR0FBd0I7VUFDeEIsS0FBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiO2lCQUNBLEtBQUMsQ0FBQSxRQUFELENBQVUsSUFBVjtRQUgwRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEQ7SUFEUTs7OztLQXBGTztBQVR2QiIsInNvdXJjZXNDb250ZW50IjpbInskJH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TeW1ib2xzVmlldyA9IHJlcXVpcmUgJy4vc3ltYm9scy12aWV3J1xuVGFnR2VuZXJhdG9yID0gcmVxdWlyZSAnLi90YWctZ2VuZXJhdG9yJ1xue21hdGNofSA9IHJlcXVpcmUgJ2Z1enphbGRyaW4nXG5cbiMgVE9ETzogcmVtb3ZlIHJlZmVyZW5jZXMgdG8gbG9naWNhbCBkaXNwbGF5IGJ1ZmZlciB3aGVuIGl0IGlzIHJlbGVhc2VkLlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGaWxlVmlldyBleHRlbmRzIFN5bWJvbHNWaWV3XG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcblxuICAgIEBjYWNoZWRUYWdzID0ge31cblxuICAgIEBlZGl0b3JzU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICByZW1vdmVGcm9tQ2FjaGUgPSA9PiBkZWxldGUgQGNhY2hlZFRhZ3NbZWRpdG9yLmdldFBhdGgoKV1cbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKHJlbW92ZUZyb21DYWNoZSkpXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChlZGl0b3Iub25EaWRTYXZlKHJlbW92ZUZyb21DYWNoZSkpXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VQYXRoKHJlbW92ZUZyb21DYWNoZSkpXG4gICAgICBlZGl0b3JTdWJzY3JpcHRpb25zLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRSZWxvYWQocmVtb3ZlRnJvbUNhY2hlKSlcbiAgICAgIGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZERlc3Ryb3kocmVtb3ZlRnJvbUNhY2hlKSlcbiAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3kgLT4gZWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBlZGl0b3JzU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgIHN1cGVyXG5cbiAgdmlld0Zvckl0ZW06ICh7cG9zaXRpb24sIG5hbWV9KSAtPlxuICAgICMgU3R5bGUgbWF0Y2hlZCBjaGFyYWN0ZXJzIGluIHNlYXJjaCByZXN1bHRzXG4gICAgbWF0Y2hlcyA9IG1hdGNoKG5hbWUsIEBnZXRGaWx0ZXJRdWVyeSgpKVxuXG4gICAgJCQgLT5cbiAgICAgIEBsaSBjbGFzczogJ3R3by1saW5lcycsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdwcmltYXJ5LWxpbmUnLCA9PiBGaWxlVmlldy5oaWdobGlnaHRNYXRjaGVzKHRoaXMsIG5hbWUsIG1hdGNoZXMpXG4gICAgICAgIEBkaXYgXCJMaW5lICN7cG9zaXRpb24ucm93ICsgMX1cIiwgY2xhc3M6ICdzZWNvbmRhcnktbGluZSdcblxuICBzZWxlY3RJdGVtVmlldzogLT5cbiAgICBzdXBlclxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnc3ltYm9scy12aWV3LnF1aWNrSnVtcFRvRmlsZVN5bWJvbCcpXG4gICAgICBpdGVtID0gQGdldFNlbGVjdGVkSXRlbSgpXG4gICAgICBAb3BlblRhZyhpdGVtKSBpZiBpdGVtP1xuXG4gIGNhbmNlbGxlZDogLT5cbiAgICBzdXBlclxuICAgIGlmIEBpbml0aWFsU3RhdGU/IGFuZCBlZGl0b3IgPSBAZ2V0RWRpdG9yKClcbiAgICAgIEBkZXNlcmlhbGl6ZUVkaXRvclN0YXRlKGVkaXRvciwgQGluaXRpYWxTdGF0ZSlcbiAgICBAaW5pdGlhbFN0YXRlID0gbnVsbFxuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgIEBjYW5jZWwoKVxuICAgIGVsc2UgaWYgZmlsZVBhdGggPSBAZ2V0UGF0aCgpXG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3N5bWJvbHMtdmlldy5xdWlja0p1bXBUb0ZpbGVTeW1ib2wnKSBhbmQgZWRpdG9yID0gQGdldEVkaXRvcigpXG4gICAgICAgIEBpbml0aWFsU3RhdGUgPSBAc2VyaWFsaXplRWRpdG9yU3RhdGUoZWRpdG9yKVxuICAgICAgQHBvcHVsYXRlKGZpbGVQYXRoKVxuICAgICAgQGF0dGFjaCgpXG5cbiAgc2VyaWFsaXplRWRpdG9yU3RhdGU6IChlZGl0b3IpIC0+XG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpXG4gICAgaWYgZWRpdG9yRWxlbWVudC5sb2dpY2FsRGlzcGxheUJ1ZmZlclxuICAgICAgc2Nyb2xsVG9wID0gZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxUb3AoKVxuICAgIGVsc2VcbiAgICAgIHNjcm9sbFRvcCA9IGVkaXRvci5nZXRTY3JvbGxUb3AoKVxuXG4gICAgYnVmZmVyUmFuZ2VzOiBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKVxuICAgIHNjcm9sbFRvcDogc2Nyb2xsVG9wXG5cbiAgZGVzZXJpYWxpemVFZGl0b3JTdGF0ZTogKGVkaXRvciwge2J1ZmZlclJhbmdlcywgc2Nyb2xsVG9wfSkgLT5cbiAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcblxuICAgIGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhidWZmZXJSYW5nZXMpXG4gICAgaWYgZWRpdG9yRWxlbWVudC5sb2dpY2FsRGlzcGxheUJ1ZmZlclxuICAgICAgZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuICAgIGVsc2VcbiAgICAgIGVkaXRvci5zZXRTY3JvbGxUb3Aoc2Nyb2xsVG9wKVxuXG4gIGdldEVkaXRvcjogLT4gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgZ2V0UGF0aDogLT4gQGdldEVkaXRvcigpPy5nZXRQYXRoKClcblxuICBnZXRTY29wZU5hbWU6IC0+IEBnZXRFZGl0b3IoKT8uZ2V0R3JhbW1hcigpPy5zY29wZU5hbWVcblxuICBwb3B1bGF0ZTogKGZpbGVQYXRoKSAtPlxuICAgIEBsaXN0LmVtcHR5KClcbiAgICBAc2V0TG9hZGluZygnR2VuZXJhdGluZyBzeW1ib2xzXFx1MjAyNicpXG4gICAgaWYgdGFncyA9IEBjYWNoZWRUYWdzW2ZpbGVQYXRoXVxuICAgICAgQHNldE1heEl0ZW1zKEluZmluaXR5KVxuICAgICAgQHNldEl0ZW1zKHRhZ3MpXG4gICAgZWxzZVxuICAgICAgQGdlbmVyYXRlVGFncyhmaWxlUGF0aClcblxuICBnZW5lcmF0ZVRhZ3M6IChmaWxlUGF0aCkgLT5cbiAgICBuZXcgVGFnR2VuZXJhdG9yKGZpbGVQYXRoLCBAZ2V0U2NvcGVOYW1lKCkpLmdlbmVyYXRlKCkudGhlbiAodGFncykgPT5cbiAgICAgIEBjYWNoZWRUYWdzW2ZpbGVQYXRoXSA9IHRhZ3NcbiAgICAgIEBzZXRNYXhJdGVtcyhJbmZpbml0eSlcbiAgICAgIEBzZXRJdGVtcyh0YWdzKVxuIl19
