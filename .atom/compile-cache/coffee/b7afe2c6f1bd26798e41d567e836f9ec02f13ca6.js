(function() {
  var ArchiveEditorView, CompositeDisposable, DirectoryView, FileView, ScrollView, archive, fs, humanize,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ScrollView = require('atom-space-pen-views').ScrollView;

  fs = require('fs-plus');

  humanize = require('humanize-plus');

  archive = require('ls-archive');

  CompositeDisposable = require('atom').CompositeDisposable;

  FileView = require('./file-view');

  DirectoryView = require('./directory-view');

  module.exports = ArchiveEditorView = (function(superClass) {
    extend(ArchiveEditorView, superClass);

    function ArchiveEditorView() {
      return ArchiveEditorView.__super__.constructor.apply(this, arguments);
    }

    ArchiveEditorView.content = function() {
      return this.div({
        "class": 'archive-editor',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'archive-container'
          }, function() {
            _this.div({
              outlet: 'loadingMessage',
              "class": 'padded icon icon-hourglass text-info'
            }, 'Loading archive\u2026');
            _this.div({
              outlet: 'errorMessage',
              "class": 'padded icon icon-alert text-error'
            });
            return _this.div({
              "class": 'inset-panel'
            }, function() {
              _this.div({
                outlet: 'summary',
                "class": 'panel-heading'
              });
              return _this.ol({
                outlet: 'tree',
                "class": 'archive-tree padded list-tree has-collapsable-children'
              });
            });
          });
        };
      })(this));
    };

    ArchiveEditorView.prototype.initialize = function(editor) {
      var commandDisposable;
      commandDisposable = ArchiveEditorView.__super__.initialize.call(this);
      commandDisposable.dispose();
      this.setModel(editor);
      return this.on('focus', (function(_this) {
        return function() {
          _this.focusSelectedFile();
          return false;
        };
      })(this));
    };

    ArchiveEditorView.prototype.setPath = function(path) {
      if (path && this.path !== path) {
        this.path = path;
        return this.refresh();
      }
    };

    ArchiveEditorView.prototype.refresh = function() {
      var originalPath;
      this.summary.hide();
      this.tree.hide();
      this.loadingMessage.show();
      this.errorMessage.hide();
      originalPath = this.path;
      return archive.list(this.path, {
        tree: true
      }, (function(_this) {
        return function(error, entries) {
          var message;
          if (originalPath !== _this.path) {
            return;
          }
          _this.loadingMessage.hide();
          if (error != null) {
            message = 'Reading the archive file failed';
            if (error.message) {
              message += ": " + error.message;
            }
            return _this.errorMessage.show().text(message);
          } else {
            _this.createTreeEntries(entries);
            return _this.updateSummary();
          }
        };
      })(this));
    };

    ArchiveEditorView.prototype.createTreeEntries = function(entries) {
      var entry, i, len, ref;
      this.tree.empty();
      for (i = 0, len = entries.length; i < len; i++) {
        entry = entries[i];
        if (entry.isDirectory()) {
          this.tree.append(new DirectoryView(this.path, entry));
        } else {
          this.tree.append(new FileView(this.path, entry));
        }
      }
      this.tree.show();
      return (ref = this.tree.find('.file').view()) != null ? ref.select() : void 0;
    };

    ArchiveEditorView.prototype.updateSummary = function() {
      var directoryCount, directoryLabel, fileCount, fileLabel;
      fileCount = this.tree.find('.file').length;
      fileLabel = fileCount === 1 ? "1 file" : (humanize.intComma(fileCount)) + " files";
      directoryCount = this.tree.find('.directory').length;
      directoryLabel = directoryCount === 1 ? "1 folder" : (humanize.intComma(directoryCount)) + " folders";
      return this.summary.text((humanize.fileSize(fs.getSizeSync(this.path))) + " with " + fileLabel + " and " + directoryLabel).show();
    };

    ArchiveEditorView.prototype.focusSelectedFile = function() {
      var ref;
      return (ref = this.tree.find('.selected').view()) != null ? ref.focus() : void 0;
    };

    ArchiveEditorView.prototype.focus = function() {
      return this.focusSelectedFile();
    };

    ArchiveEditorView.prototype.setModel = function(editor) {
      var ref;
      if ((ref = this.editorSubscriptions) != null) {
        ref.dispose();
      }
      this.editorSubscriptions = null;
      if (editor != null) {
        this.editorSubscriptions = new CompositeDisposable();
        this.editor = editor;
        this.setPath(editor.getPath());
        this.editorSubscriptions.add(editor.file.onDidChange((function(_this) {
          return function() {
            return _this.refresh();
          };
        })(this)));
        this.editorSubscriptions.add(editor.file.onDidDelete((function(_this) {
          return function() {
            var ref1;
            return (ref1 = atom.workspace.paneForItem(_this.editor)) != null ? ref1.destroyItem(_this.editor) : void 0;
          };
        })(this)));
        return this.editorSubscriptions.add(editor.onDidDestroy((function(_this) {
          return function() {
            var ref1;
            if ((ref1 = _this.editorSubscriptions) != null) {
              ref1.dispose();
            }
            return _this.editorSubscriptions = null;
          };
        })(this)));
      }
    };

    return ArchiveEditorView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2FyY2hpdmUtZWRpdG9yLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxrR0FBQTtJQUFBOzs7RUFBQyxhQUFjLE9BQUEsQ0FBUSxzQkFBUjs7RUFDZixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsUUFBQSxHQUFXLE9BQUEsQ0FBUSxlQUFSOztFQUNYLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7RUFDVCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNKLGlCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtRQUF5QixRQUFBLEVBQVUsQ0FBQyxDQUFwQztPQUFMLEVBQTRDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDMUMsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7V0FBTCxFQUFpQyxTQUFBO1lBQy9CLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxNQUFBLEVBQVEsZ0JBQVI7Y0FBMEIsQ0FBQSxLQUFBLENBQUEsRUFBTyxzQ0FBakM7YUFBTCxFQUE4RSx1QkFBOUU7WUFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsTUFBQSxFQUFRLGNBQVI7Y0FBd0IsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQ0FBL0I7YUFBTDttQkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO2FBQUwsRUFBMkIsU0FBQTtjQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLE1BQUEsRUFBUSxTQUFSO2dCQUFtQixDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQTFCO2VBQUw7cUJBQ0EsS0FBQyxDQUFBLEVBQUQsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsTUFBUjtnQkFBZ0IsQ0FBQSxLQUFBLENBQUEsRUFBTyx3REFBdkI7ZUFBSjtZQUZ5QixDQUEzQjtVQUgrQixDQUFqQztRQUQwQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUM7SUFEUTs7Z0NBU1YsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxpQkFBQSxHQUFvQixnREFBQTtNQUNwQixpQkFBaUIsQ0FBQyxPQUFsQixDQUFBO01BRUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWO2FBRUEsSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ1gsS0FBQyxDQUFBLGlCQUFELENBQUE7aUJBQ0E7UUFGVztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBYjtJQU5VOztnQ0FVWixPQUFBLEdBQVMsU0FBQyxJQUFEO01BQ1AsSUFBRyxJQUFBLElBQVMsSUFBQyxDQUFBLElBQUQsS0FBVyxJQUF2QjtRQUNFLElBQUMsQ0FBQSxJQUFELEdBQVE7ZUFDUixJQUFDLENBQUEsT0FBRCxDQUFBLEVBRkY7O0lBRE87O2dDQUtULE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFBO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQUE7TUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQUE7TUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQTtNQUVBLFlBQUEsR0FBZSxJQUFDLENBQUE7YUFDaEIsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFDLENBQUEsSUFBZCxFQUFvQjtRQUFBLElBQUEsRUFBTSxJQUFOO09BQXBCLEVBQWdDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFELEVBQVEsT0FBUjtBQUM5QixjQUFBO1VBQUEsSUFBYyxZQUFBLEtBQWdCLEtBQUMsQ0FBQSxJQUEvQjtBQUFBLG1CQUFBOztVQUVBLEtBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQTtVQUNBLElBQUcsYUFBSDtZQUNFLE9BQUEsR0FBVTtZQUNWLElBQW1DLEtBQUssQ0FBQyxPQUF6QztjQUFBLE9BQUEsSUFBVyxJQUFBLEdBQUssS0FBSyxDQUFDLFFBQXRCOzttQkFDQSxLQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsQ0FBQSxDQUFvQixDQUFDLElBQXJCLENBQTBCLE9BQTFCLEVBSEY7V0FBQSxNQUFBO1lBS0UsS0FBQyxDQUFBLGlCQUFELENBQW1CLE9BQW5CO21CQUNBLEtBQUMsQ0FBQSxhQUFELENBQUEsRUFORjs7UUFKOEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhDO0lBUE87O2dDQW1CVCxpQkFBQSxHQUFtQixTQUFDLE9BQUQ7QUFDakIsVUFBQTtNQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO0FBRUEsV0FBQSx5Q0FBQTs7UUFDRSxJQUFHLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FBSDtVQUNFLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFpQixJQUFBLGFBQUEsQ0FBYyxJQUFDLENBQUEsSUFBZixFQUFxQixLQUFyQixDQUFqQixFQURGO1NBQUEsTUFBQTtVQUdFLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFpQixJQUFBLFFBQUEsQ0FBUyxJQUFDLENBQUEsSUFBVixFQUFnQixLQUFoQixDQUFqQixFQUhGOztBQURGO01BTUEsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQUE7aUVBQzBCLENBQUUsTUFBNUIsQ0FBQTtJQVZpQjs7Z0NBWW5CLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxPQUFYLENBQW1CLENBQUM7TUFDaEMsU0FBQSxHQUFlLFNBQUEsS0FBYSxDQUFoQixHQUF1QixRQUF2QixHQUF1QyxDQUFDLFFBQVEsQ0FBQyxRQUFULENBQWtCLFNBQWxCLENBQUQsQ0FBQSxHQUE4QjtNQUVqRixjQUFBLEdBQWlCLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLFlBQVgsQ0FBd0IsQ0FBQztNQUMxQyxjQUFBLEdBQW9CLGNBQUEsS0FBa0IsQ0FBckIsR0FBNEIsVUFBNUIsR0FBOEMsQ0FBQyxRQUFRLENBQUMsUUFBVCxDQUFrQixjQUFsQixDQUFELENBQUEsR0FBbUM7YUFFbEcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVQsQ0FBa0IsRUFBRSxDQUFDLFdBQUgsQ0FBZSxJQUFDLENBQUEsSUFBaEIsQ0FBbEIsQ0FBRCxDQUFBLEdBQTBDLFFBQTFDLEdBQWtELFNBQWxELEdBQTRELE9BQTVELEdBQW1FLGNBQW5GLENBQW9HLENBQUMsSUFBckcsQ0FBQTtJQVBhOztnQ0FTZixpQkFBQSxHQUFtQixTQUFBO0FBQ2pCLFVBQUE7cUVBQThCLENBQUUsS0FBaEMsQ0FBQTtJQURpQjs7Z0NBR25CLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFESzs7Z0NBR1AsUUFBQSxHQUFVLFNBQUMsTUFBRDtBQUNSLFVBQUE7O1dBQW9CLENBQUUsT0FBdEIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsbUJBQUQsR0FBdUI7TUFFdkIsSUFBRyxjQUFIO1FBQ0UsSUFBQyxDQUFBLG1CQUFELEdBQTJCLElBQUEsbUJBQUEsQ0FBQTtRQUMzQixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFNLENBQUMsT0FBUCxDQUFBLENBQVQ7UUFDQSxJQUFDLENBQUEsbUJBQW1CLENBQUMsR0FBckIsQ0FBeUIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFaLENBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQy9DLEtBQUMsQ0FBQSxPQUFELENBQUE7VUFEK0M7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhCLENBQXpCO1FBRUEsSUFBQyxDQUFBLG1CQUFtQixDQUFDLEdBQXJCLENBQXlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBWixDQUF3QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO0FBQy9DLGdCQUFBO21GQUFtQyxDQUFFLFdBQXJDLENBQWlELEtBQUMsQ0FBQSxNQUFsRDtVQUQrQztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEIsQ0FBekI7ZUFFQSxJQUFDLENBQUEsbUJBQW1CLENBQUMsR0FBckIsQ0FBeUIsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtBQUMzQyxnQkFBQTs7a0JBQW9CLENBQUUsT0FBdEIsQ0FBQTs7bUJBQ0EsS0FBQyxDQUFBLG1CQUFELEdBQXVCO1VBRm9CO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFwQixDQUF6QixFQVJGOztJQUpROzs7O0tBdkVvQjtBQVZoQyIsInNvdXJjZXNDb250ZW50IjpbIntTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuaHVtYW5pemUgPSByZXF1aXJlICdodW1hbml6ZS1wbHVzJ1xuYXJjaGl2ZSA9IHJlcXVpcmUgJ2xzLWFyY2hpdmUnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5GaWxlVmlldyA9IHJlcXVpcmUgJy4vZmlsZS12aWV3J1xuRGlyZWN0b3J5VmlldyA9IHJlcXVpcmUgJy4vZGlyZWN0b3J5LXZpZXcnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEFyY2hpdmVFZGl0b3JWaWV3IGV4dGVuZHMgU2Nyb2xsVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAnYXJjaGl2ZS1lZGl0b3InLCB0YWJpbmRleDogLTEsID0+XG4gICAgICBAZGl2IGNsYXNzOiAnYXJjaGl2ZS1jb250YWluZXInLCA9PlxuICAgICAgICBAZGl2IG91dGxldDogJ2xvYWRpbmdNZXNzYWdlJywgY2xhc3M6ICdwYWRkZWQgaWNvbiBpY29uLWhvdXJnbGFzcyB0ZXh0LWluZm8nLCAnTG9hZGluZyBhcmNoaXZlXFx1MjAyNidcbiAgICAgICAgQGRpdiBvdXRsZXQ6ICdlcnJvck1lc3NhZ2UnLCBjbGFzczogJ3BhZGRlZCBpY29uIGljb24tYWxlcnQgdGV4dC1lcnJvcidcbiAgICAgICAgQGRpdiBjbGFzczogJ2luc2V0LXBhbmVsJywgPT5cbiAgICAgICAgICBAZGl2IG91dGxldDogJ3N1bW1hcnknLCBjbGFzczogJ3BhbmVsLWhlYWRpbmcnXG4gICAgICAgICAgQG9sIG91dGxldDogJ3RyZWUnLCBjbGFzczogJ2FyY2hpdmUtdHJlZSBwYWRkZWQgbGlzdC10cmVlIGhhcy1jb2xsYXBzYWJsZS1jaGlsZHJlbidcblxuICBpbml0aWFsaXplOiAoZWRpdG9yKSAtPlxuICAgIGNvbW1hbmREaXNwb3NhYmxlID0gc3VwZXIoKVxuICAgIGNvbW1hbmREaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gICAgQHNldE1vZGVsKGVkaXRvcilcblxuICAgIEBvbiAnZm9jdXMnLCA9PlxuICAgICAgQGZvY3VzU2VsZWN0ZWRGaWxlKClcbiAgICAgIGZhbHNlXG5cbiAgc2V0UGF0aDogKHBhdGgpIC0+XG4gICAgaWYgcGF0aCBhbmQgQHBhdGggaXNudCBwYXRoXG4gICAgICBAcGF0aCA9IHBhdGhcbiAgICAgIEByZWZyZXNoKClcblxuICByZWZyZXNoOiAtPlxuICAgIEBzdW1tYXJ5LmhpZGUoKVxuICAgIEB0cmVlLmhpZGUoKVxuICAgIEBsb2FkaW5nTWVzc2FnZS5zaG93KClcbiAgICBAZXJyb3JNZXNzYWdlLmhpZGUoKVxuXG4gICAgb3JpZ2luYWxQYXRoID0gQHBhdGhcbiAgICBhcmNoaXZlLmxpc3QgQHBhdGgsIHRyZWU6IHRydWUsIChlcnJvciwgZW50cmllcykgPT5cbiAgICAgIHJldHVybiB1bmxlc3Mgb3JpZ2luYWxQYXRoIGlzIEBwYXRoXG5cbiAgICAgIEBsb2FkaW5nTWVzc2FnZS5oaWRlKClcbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBtZXNzYWdlID0gJ1JlYWRpbmcgdGhlIGFyY2hpdmUgZmlsZSBmYWlsZWQnXG4gICAgICAgIG1lc3NhZ2UgKz0gXCI6ICN7ZXJyb3IubWVzc2FnZX1cIiBpZiBlcnJvci5tZXNzYWdlXG4gICAgICAgIEBlcnJvck1lc3NhZ2Uuc2hvdygpLnRleHQobWVzc2FnZSlcbiAgICAgIGVsc2VcbiAgICAgICAgQGNyZWF0ZVRyZWVFbnRyaWVzKGVudHJpZXMpXG4gICAgICAgIEB1cGRhdGVTdW1tYXJ5KClcblxuICBjcmVhdGVUcmVlRW50cmllczogKGVudHJpZXMpIC0+XG4gICAgQHRyZWUuZW1wdHkoKVxuXG4gICAgZm9yIGVudHJ5IGluIGVudHJpZXNcbiAgICAgIGlmIGVudHJ5LmlzRGlyZWN0b3J5KClcbiAgICAgICAgQHRyZWUuYXBwZW5kKG5ldyBEaXJlY3RvcnlWaWV3KEBwYXRoLCBlbnRyeSkpXG4gICAgICBlbHNlXG4gICAgICAgIEB0cmVlLmFwcGVuZChuZXcgRmlsZVZpZXcoQHBhdGgsIGVudHJ5KSlcblxuICAgIEB0cmVlLnNob3coKVxuICAgIEB0cmVlLmZpbmQoJy5maWxlJykudmlldygpPy5zZWxlY3QoKVxuXG4gIHVwZGF0ZVN1bW1hcnk6IC0+XG4gICAgZmlsZUNvdW50ID0gQHRyZWUuZmluZCgnLmZpbGUnKS5sZW5ndGhcbiAgICBmaWxlTGFiZWwgPSBpZiBmaWxlQ291bnQgaXMgMSB0aGVuIFwiMSBmaWxlXCIgZWxzZSBcIiN7aHVtYW5pemUuaW50Q29tbWEoZmlsZUNvdW50KX0gZmlsZXNcIlxuXG4gICAgZGlyZWN0b3J5Q291bnQgPSBAdHJlZS5maW5kKCcuZGlyZWN0b3J5JykubGVuZ3RoXG4gICAgZGlyZWN0b3J5TGFiZWwgPSBpZiBkaXJlY3RvcnlDb3VudCBpcyAxIHRoZW4gXCIxIGZvbGRlclwiIGVsc2UgXCIje2h1bWFuaXplLmludENvbW1hKGRpcmVjdG9yeUNvdW50KX0gZm9sZGVyc1wiXG5cbiAgICBAc3VtbWFyeS50ZXh0KFwiI3todW1hbml6ZS5maWxlU2l6ZShmcy5nZXRTaXplU3luYyhAcGF0aCkpfSB3aXRoICN7ZmlsZUxhYmVsfSBhbmQgI3tkaXJlY3RvcnlMYWJlbH1cIikuc2hvdygpXG5cbiAgZm9jdXNTZWxlY3RlZEZpbGU6IC0+XG4gICAgQHRyZWUuZmluZCgnLnNlbGVjdGVkJykudmlldygpPy5mb2N1cygpXG5cbiAgZm9jdXM6IC0+XG4gICAgQGZvY3VzU2VsZWN0ZWRGaWxlKClcblxuICBzZXRNb2RlbDogKGVkaXRvcikgLT5cbiAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICBpZiBlZGl0b3I/XG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICAgIEBlZGl0b3IgPSBlZGl0b3JcbiAgICAgIEBzZXRQYXRoKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQgZWRpdG9yLmZpbGUub25EaWRDaGFuZ2UgPT5cbiAgICAgICAgQHJlZnJlc2goKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvci5maWxlLm9uRGlkRGVsZXRlID0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKEBlZGl0b3IpPy5kZXN0cm95SXRlbShAZWRpdG9yKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvci5vbkRpZERlc3Ryb3kgPT5cbiAgICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgICAgICBAZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcbiJdfQ==
