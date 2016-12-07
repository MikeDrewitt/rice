(function() {
  var $, $$, CompositeDisposable, FileIcons, FuzzyFinderView, Point, SelectListView, fs, fuzzaldrin, fuzzaldrinPlus, path, ref, ref1, repositoryForPath,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  ref = require('atom'), Point = ref.Point, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, $$ = ref1.$$, SelectListView = ref1.SelectListView;

  repositoryForPath = require('./helpers').repositoryForPath;

  fs = require('fs-plus');

  fuzzaldrin = require('fuzzaldrin');

  fuzzaldrinPlus = require('fuzzaldrin-plus');

  FileIcons = require('./file-icons');

  module.exports = FuzzyFinderView = (function(superClass) {
    extend(FuzzyFinderView, superClass);

    function FuzzyFinderView() {
      return FuzzyFinderView.__super__.constructor.apply(this, arguments);
    }

    FuzzyFinderView.prototype.filePaths = null;

    FuzzyFinderView.prototype.projectRelativePaths = null;

    FuzzyFinderView.prototype.subscriptions = null;

    FuzzyFinderView.prototype.alternateScoring = false;

    FuzzyFinderView.prototype.initialize = function() {
      var splitDown, splitLeft, splitRight, splitUp;
      FuzzyFinderView.__super__.initialize.apply(this, arguments);
      this.addClass('fuzzy-finder');
      this.setMaxItems(10);
      this.subscriptions = new CompositeDisposable;
      splitLeft = (function(_this) {
        return function() {
          return _this.splitOpenPath(function(pane) {
            return pane.splitLeft.bind(pane);
          });
        };
      })(this);
      splitRight = (function(_this) {
        return function() {
          return _this.splitOpenPath(function(pane) {
            return pane.splitRight.bind(pane);
          });
        };
      })(this);
      splitUp = (function(_this) {
        return function() {
          return _this.splitOpenPath(function(pane) {
            return pane.splitUp.bind(pane);
          });
        };
      })(this);
      splitDown = (function(_this) {
        return function() {
          return _this.splitOpenPath(function(pane) {
            return pane.splitDown.bind(pane);
          });
        };
      })(this);
      atom.commands.add(this.element, {
        'pane:split-left': splitLeft,
        'pane:split-left-and-copy-active-item': splitLeft,
        'pane:split-left-and-move-active-item': splitLeft,
        'pane:split-right': splitRight,
        'pane:split-right-and-copy-active-item': splitRight,
        'pane:split-right-and-move-active-item': splitRight,
        'pane:split-up': splitUp,
        'pane:split-up-and-copy-active-item': splitUp,
        'pane:split-up-and-move-active-item': splitUp,
        'pane:split-down': splitDown,
        'pane:split-down-and-copy-active-item': splitDown,
        'pane:split-down-and-move-active-item': splitDown,
        'fuzzy-finder:invert-confirm': (function(_this) {
          return function() {
            return _this.confirmInvertedSelection();
          };
        })(this)
      });
      this.alternateScoring = atom.config.get('fuzzy-finder.useAlternateScoring');
      return this.subscriptions.add(atom.config.onDidChange('fuzzy-finder.useAlternateScoring', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          return _this.alternateScoring = newValue;
        };
      })(this)));
    };

    FuzzyFinderView.prototype.getFilterKey = function() {
      return 'projectRelativePath';
    };

    FuzzyFinderView.prototype.cancel = function() {
      var lastSearch;
      if (atom.config.get('fuzzy-finder.preserveLastSearch')) {
        lastSearch = this.getFilterQuery();
        FuzzyFinderView.__super__.cancel.apply(this, arguments);
        this.filterEditorView.setText(lastSearch);
        return this.filterEditorView.getModel().selectAll();
      } else {
        return FuzzyFinderView.__super__.cancel.apply(this, arguments);
      }
    };

    FuzzyFinderView.prototype.destroy = function() {
      var ref2, ref3;
      this.cancel();
      if ((ref2 = this.panel) != null) {
        ref2.destroy();
      }
      if ((ref3 = this.subscriptions) != null) {
        ref3.dispose();
      }
      return this.subscriptions = null;
    };

    FuzzyFinderView.prototype.viewForItem = function(arg) {
      var filePath, filterQuery, matches, projectRelativePath;
      filePath = arg.filePath, projectRelativePath = arg.projectRelativePath;
      filterQuery = this.getFilterQuery();
      if (this.alternateScoring) {
        matches = fuzzaldrinPlus.match(projectRelativePath, filterQuery);
      } else {
        matches = fuzzaldrin.match(projectRelativePath, filterQuery);
      }
      return $$(function() {
        var highlighter;
        highlighter = (function(_this) {
          return function(path, matches, offsetIndex) {
            var j, lastIndex, len, matchIndex, matchedChars, unmatched;
            lastIndex = 0;
            matchedChars = [];
            for (j = 0, len = matches.length; j < len; j++) {
              matchIndex = matches[j];
              matchIndex -= offsetIndex;
              if (matchIndex < 0) {
                continue;
              }
              unmatched = path.substring(lastIndex, matchIndex);
              if (unmatched) {
                if (matchedChars.length) {
                  _this.span(matchedChars.join(''), {
                    "class": 'character-match'
                  });
                }
                matchedChars = [];
                _this.text(unmatched);
              }
              matchedChars.push(path[matchIndex]);
              lastIndex = matchIndex + 1;
            }
            if (matchedChars.length) {
              _this.span(matchedChars.join(''), {
                "class": 'character-match'
              });
            }
            return _this.text(path.substring(lastIndex));
          };
        })(this);
        return this.li({
          "class": 'two-lines'
        }, (function(_this) {
          return function() {
            var baseOffset, fileBasename, repo, status, typeClass;
            if ((repo = repositoryForPath(filePath)) != null) {
              status = repo.getCachedPathStatus(filePath);
              if (repo.isStatusNew(status)) {
                _this.div({
                  "class": 'status status-added icon icon-diff-added'
                });
              } else if (repo.isStatusModified(status)) {
                _this.div({
                  "class": 'status status-modified icon icon-diff-modified'
                });
              }
            }
            typeClass = FileIcons.getService().iconClassForPath(filePath, 'fuzzy-finder') || [];
            if (!Array.isArray(typeClass)) {
              typeClass = typeClass != null ? typeClass.toString().split(/\s+/g) : void 0;
            }
            fileBasename = path.basename(filePath);
            baseOffset = projectRelativePath.length - fileBasename.length;
            _this.div({
              "class": "primary-line file icon " + (typeClass.join(' ')),
              'data-name': fileBasename,
              'data-path': projectRelativePath
            }, function() {
              return highlighter(fileBasename, matches, baseOffset);
            });
            return _this.div({
              "class": 'secondary-line path no-icon'
            }, function() {
              return highlighter(projectRelativePath, matches, 0);
            });
          };
        })(this));
      });
    };

    FuzzyFinderView.prototype.openPath = function(filePath, lineNumber, openOptions) {
      if (filePath) {
        return atom.workspace.open(filePath, openOptions).then((function(_this) {
          return function() {
            return _this.moveToLine(lineNumber);
          };
        })(this));
      }
    };

    FuzzyFinderView.prototype.moveToLine = function(lineNumber) {
      var position, textEditor;
      if (lineNumber == null) {
        lineNumber = -1;
      }
      if (!(lineNumber >= 0)) {
        return;
      }
      if (textEditor = atom.workspace.getActiveTextEditor()) {
        position = new Point(lineNumber);
        textEditor.scrollToBufferPosition(position, {
          center: true
        });
        textEditor.setCursorBufferPosition(position);
        return textEditor.moveToFirstCharacterOfLine();
      }
    };

    FuzzyFinderView.prototype.splitOpenPath = function(splitFn) {
      var editor, filePath, lineNumber, pane, ref2;
      filePath = ((ref2 = this.getSelectedItem()) != null ? ref2 : {}).filePath;
      lineNumber = this.getLineNumber();
      if (this.isQueryALineJump() && (editor = atom.workspace.getActiveTextEditor())) {
        pane = atom.workspace.getActivePane();
        splitFn(pane)({
          copyActiveItem: true
        });
        return this.moveToLine(lineNumber);
      } else if (!filePath) {

      } else if (pane = atom.workspace.getActivePane()) {
        splitFn(pane)();
        return this.openPath(filePath, lineNumber);
      } else {
        return this.openPath(filePath, lineNumber);
      }
    };

    FuzzyFinderView.prototype.populateList = function() {
      if (this.isQueryALineJump()) {
        this.list.empty();
        return this.setError('Jump to line in active editor');
      } else if (this.alternateScoring) {
        return this.populateAlternateList();
      } else {
        return FuzzyFinderView.__super__.populateList.apply(this, arguments);
      }
    };

    FuzzyFinderView.prototype.populateAlternateList = function() {
      var filterQuery, filteredItems, i, item, itemView, j, ref2;
      if (this.items == null) {
        return;
      }
      filterQuery = this.getFilterQuery();
      if (filterQuery.length) {
        filteredItems = fuzzaldrinPlus.filter(this.items, filterQuery, {
          key: this.getFilterKey()
        });
      } else {
        filteredItems = this.items;
      }
      this.list.empty();
      if (filteredItems.length) {
        this.setError(null);
        for (i = j = 0, ref2 = Math.min(filteredItems.length, this.maxItems); 0 <= ref2 ? j < ref2 : j > ref2; i = 0 <= ref2 ? ++j : --j) {
          item = filteredItems[i];
          itemView = $(this.viewForItem(item));
          itemView.data('select-list-item', item);
          this.list.append(itemView);
        }
        return this.selectItemView(this.list.find('li:first'));
      } else {
        return this.setError(this.getEmptyMessage(this.items.length, filteredItems.length));
      }
    };

    FuzzyFinderView.prototype.confirmSelection = function() {
      var item;
      item = this.getSelectedItem();
      return this.confirmed(item, {
        searchAllPanes: atom.config.get('fuzzy-finder.searchAllPanes')
      });
    };

    FuzzyFinderView.prototype.confirmInvertedSelection = function() {
      var item;
      item = this.getSelectedItem();
      return this.confirmed(item, {
        searchAllPanes: !atom.config.get('fuzzy-finder.searchAllPanes')
      });
    };

    FuzzyFinderView.prototype.confirmed = function(arg, openOptions) {
      var filePath, lineNumber;
      filePath = (arg != null ? arg : {}).filePath;
      if (atom.workspace.getActiveTextEditor() && this.isQueryALineJump()) {
        lineNumber = this.getLineNumber();
        this.cancel();
        return this.moveToLine(lineNumber);
      } else if (!filePath) {
        return this.cancel();
      } else if (fs.isDirectorySync(filePath)) {
        this.setError('Selected path is a directory');
        return setTimeout(((function(_this) {
          return function() {
            return _this.setError();
          };
        })(this)), 2000);
      } else {
        lineNumber = this.getLineNumber();
        this.cancel();
        return this.openPath(filePath, lineNumber, openOptions);
      }
    };

    FuzzyFinderView.prototype.isQueryALineJump = function() {
      var colon, query, trimmedPath;
      query = this.filterEditorView.getModel().getText();
      colon = query.indexOf(':');
      trimmedPath = this.getFilterQuery().trim();
      return trimmedPath === '' && colon !== -1;
    };

    FuzzyFinderView.prototype.getFilterQuery = function() {
      var colon, query;
      query = FuzzyFinderView.__super__.getFilterQuery.apply(this, arguments);
      colon = query.indexOf(':');
      if (colon !== -1) {
        query = query.slice(0, colon);
      }
      if (process.platform === 'win32') {
        query = query.replace(/\//g, '\\');
      }
      return query;
    };

    FuzzyFinderView.prototype.getLineNumber = function() {
      var colon, query;
      query = this.filterEditorView.getText();
      colon = query.indexOf(':');
      if (colon === -1) {
        return -1;
      } else {
        return parseInt(query.slice(colon + 1)) - 1;
      }
    };

    FuzzyFinderView.prototype.setItems = function(filePaths) {
      return FuzzyFinderView.__super__.setItems.call(this, this.projectRelativePathsForFilePaths(filePaths));
    };

    FuzzyFinderView.prototype.projectRelativePathsForFilePaths = function(filePaths) {
      var projectHasMultipleDirectories;
      if (filePaths !== this.filePaths) {
        projectHasMultipleDirectories = atom.project.getDirectories().length > 1;
        this.filePaths = filePaths;
        this.projectRelativePaths = this.filePaths.map(function(filePath) {
          var projectRelativePath, ref2, rootPath;
          ref2 = atom.project.relativizePath(filePath), rootPath = ref2[0], projectRelativePath = ref2[1];
          if (rootPath && projectHasMultipleDirectories) {
            projectRelativePath = path.join(path.basename(rootPath), projectRelativePath);
          }
          return {
            filePath: filePath,
            projectRelativePath: projectRelativePath
          };
        });
      }
      return this.projectRelativePaths;
    };

    FuzzyFinderView.prototype.show = function() {
      this.storeFocusedElement();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      return this.focusFilterEditor();
    };

    FuzzyFinderView.prototype.hide = function() {
      var ref2;
      return (ref2 = this.panel) != null ? ref2.hide() : void 0;
    };

    FuzzyFinderView.prototype.cancelled = function() {
      return this.hide();
    };

    return FuzzyFinderView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL2Z1enp5LWZpbmRlci12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaUpBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQStCLE9BQUEsQ0FBUSxNQUFSLENBQS9CLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixPQUEwQixPQUFBLENBQVEsc0JBQVIsQ0FBMUIsRUFBQyxVQUFELEVBQUksWUFBSixFQUFROztFQUNQLG9CQUFxQixPQUFBLENBQVEsV0FBUjs7RUFDdEIsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFVBQUEsR0FBYSxPQUFBLENBQVEsWUFBUjs7RUFDYixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxpQkFBUjs7RUFDakIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxjQUFSOztFQUVaLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7OEJBQ0osU0FBQSxHQUFXOzs4QkFDWCxvQkFBQSxHQUFzQjs7OEJBQ3RCLGFBQUEsR0FBZTs7OEJBQ2YsZ0JBQUEsR0FBa0I7OzhCQUVsQixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxpREFBQSxTQUFBO01BRUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxjQUFWO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxFQUFiO01BQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUVyQixTQUFBLEdBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxhQUFELENBQWUsU0FBQyxJQUFEO21CQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixJQUFwQjtVQUFWLENBQWY7UUFBSDtNQUFBLENB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QUMsUUFBTCxDQUFjLFFBQWQsQ0FBVixFQUFtQyxtQkFBbkMsRUFEeEI7O2lCQUVBO1lBQUMsVUFBQSxRQUFEO1lBQVcscUJBQUEsbUJBQVg7O1FBSnFDLENBQWYsRUFKMUI7O2FBVUEsSUFBQyxDQUFBO0lBWitCOzs4QkFjbEMsSUFBQSxHQUFNLFNBQUE7TUFDSixJQUFDLENBQUEsbUJBQUQsQ0FBQTs7UUFDQSxJQUFDLENBQUEsUUFBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7VUFBQSxJQUFBLEVBQU0sSUFBTjtTQUE3Qjs7TUFDVixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBSkk7OzhCQU1OLElBQUEsR0FBTSxTQUFBO0FBQ0osVUFBQTsrQ0FBTSxDQUFFLElBQVIsQ0FBQTtJQURJOzs4QkFHTixTQUFBLEdBQVcsU0FBQTthQUNULElBQUMsQ0FBQSxJQUFELENBQUE7SUFEUzs7OztLQTVQaUI7QUFWOUIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbntQb2ludCwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsICQkLCBTZWxlY3RMaXN0Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntyZXBvc2l0b3J5Rm9yUGF0aH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5mdXp6YWxkcmluID0gcmVxdWlyZSAnZnV6emFsZHJpbidcbmZ1enphbGRyaW5QbHVzID0gcmVxdWlyZSAnZnV6emFsZHJpbi1wbHVzJ1xuRmlsZUljb25zID0gcmVxdWlyZSAnLi9maWxlLWljb25zJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBGdXp6eUZpbmRlclZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICBmaWxlUGF0aHM6IG51bGxcbiAgcHJvamVjdFJlbGF0aXZlUGF0aHM6IG51bGxcbiAgc3Vic2NyaXB0aW9uczogbnVsbFxuICBhbHRlcm5hdGVTY29yaW5nOiBmYWxzZVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcblxuICAgIEBhZGRDbGFzcygnZnV6enktZmluZGVyJylcbiAgICBAc2V0TWF4SXRlbXMoMTApXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgc3BsaXRMZWZ0ID0gPT4gQHNwbGl0T3BlblBhdGggKHBhbmUpIC0+IHBhbmUuc3BsaXRMZWZ0LmJpbmQocGFuZSlcbiAgICBzcGxpdFJpZ2h0ID0gPT4gQHNwbGl0T3BlblBhdGggKHBhbmUpIC0+IHBhbmUuc3BsaXRSaWdodC5iaW5kKHBhbmUpXG4gICAgc3BsaXRVcCA9ID0+IEBzcGxpdE9wZW5QYXRoIChwYW5lKSAtPiBwYW5lLnNwbGl0VXAuYmluZChwYW5lKVxuICAgIHNwbGl0RG93biA9ID0+IEBzcGxpdE9wZW5QYXRoIChwYW5lKSAtPiBwYW5lLnNwbGl0RG93bi5iaW5kKHBhbmUpXG5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZWxlbWVudCxcbiAgICAgICdwYW5lOnNwbGl0LWxlZnQnOiBzcGxpdExlZnRcbiAgICAgICdwYW5lOnNwbGl0LWxlZnQtYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiBzcGxpdExlZnRcbiAgICAgICdwYW5lOnNwbGl0LWxlZnQtYW5kLW1vdmUtYWN0aXZlLWl0ZW0nOiBzcGxpdExlZnRcbiAgICAgICdwYW5lOnNwbGl0LXJpZ2h0Jzogc3BsaXRSaWdodFxuICAgICAgJ3BhbmU6c3BsaXQtcmlnaHQtYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiBzcGxpdFJpZ2h0XG4gICAgICAncGFuZTpzcGxpdC1yaWdodC1hbmQtbW92ZS1hY3RpdmUtaXRlbSc6IHNwbGl0UmlnaHRcbiAgICAgICdwYW5lOnNwbGl0LXVwJzogc3BsaXRVcFxuICAgICAgJ3BhbmU6c3BsaXQtdXAtYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiBzcGxpdFVwXG4gICAgICAncGFuZTpzcGxpdC11cC1hbmQtbW92ZS1hY3RpdmUtaXRlbSc6IHNwbGl0VXBcbiAgICAgICdwYW5lOnNwbGl0LWRvd24nOiBzcGxpdERvd25cbiAgICAgICdwYW5lOnNwbGl0LWRvd24tYW5kLWNvcHktYWN0aXZlLWl0ZW0nOiBzcGxpdERvd25cbiAgICAgICdwYW5lOnNwbGl0LWRvd24tYW5kLW1vdmUtYWN0aXZlLWl0ZW0nOiBzcGxpdERvd25cbiAgICAgICdmdXp6eS1maW5kZXI6aW52ZXJ0LWNvbmZpcm0nOiA9PlxuICAgICAgICBAY29uZmlybUludmVydGVkU2VsZWN0aW9uKClcblxuICAgIEBhbHRlcm5hdGVTY29yaW5nID0gYXRvbS5jb25maWcuZ2V0ICdmdXp6eS1maW5kZXIudXNlQWx0ZXJuYXRlU2NvcmluZydcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2Z1enp5LWZpbmRlci51c2VBbHRlcm5hdGVTY29yaW5nJywgKHtuZXdWYWx1ZX0pID0+IEBhbHRlcm5hdGVTY29yaW5nID0gbmV3VmFsdWVcblxuXG4gIGdldEZpbHRlcktleTogLT5cbiAgICAncHJvamVjdFJlbGF0aXZlUGF0aCdcblxuICBjYW5jZWw6IC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdmdXp6eS1maW5kZXIucHJlc2VydmVMYXN0U2VhcmNoJylcbiAgICAgIGxhc3RTZWFyY2ggPSBAZ2V0RmlsdGVyUXVlcnkoKVxuICAgICAgc3VwZXJcblxuICAgICAgQGZpbHRlckVkaXRvclZpZXcuc2V0VGV4dChsYXN0U2VhcmNoKVxuICAgICAgQGZpbHRlckVkaXRvclZpZXcuZ2V0TW9kZWwoKS5zZWxlY3RBbGwoKVxuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgZGVzdHJveTogLT5cbiAgICBAY2FuY2VsKClcbiAgICBAcGFuZWw/LmRlc3Ryb3koKVxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICB2aWV3Rm9ySXRlbTogKHtmaWxlUGF0aCwgcHJvamVjdFJlbGF0aXZlUGF0aH0pIC0+XG4gICAgIyBTdHlsZSBtYXRjaGVkIGNoYXJhY3RlcnMgaW4gc2VhcmNoIHJlc3VsdHNcbiAgICBmaWx0ZXJRdWVyeSA9IEBnZXRGaWx0ZXJRdWVyeSgpXG5cbiAgICBpZiBAYWx0ZXJuYXRlU2NvcmluZ1xuICAgICAgbWF0Y2hlcyA9IGZ1enphbGRyaW5QbHVzLm1hdGNoKHByb2plY3RSZWxhdGl2ZVBhdGgsIGZpbHRlclF1ZXJ5KVxuICAgIGVsc2VcbiAgICAgIG1hdGNoZXMgPSBmdXp6YWxkcmluLm1hdGNoKHByb2plY3RSZWxhdGl2ZVBhdGgsIGZpbHRlclF1ZXJ5KVxuXG4gICAgJCQgLT5cblxuICAgICAgaGlnaGxpZ2h0ZXIgPSAocGF0aCwgbWF0Y2hlcywgb2Zmc2V0SW5kZXgpID0+XG4gICAgICAgIGxhc3RJbmRleCA9IDBcbiAgICAgICAgbWF0Y2hlZENoYXJzID0gW10gIyBCdWlsZCB1cCBhIHNldCBvZiBtYXRjaGVkIGNoYXJzIHRvIGJlIG1vcmUgc2VtYW50aWNcblxuICAgICAgICBmb3IgbWF0Y2hJbmRleCBpbiBtYXRjaGVzXG4gICAgICAgICAgbWF0Y2hJbmRleCAtPSBvZmZzZXRJbmRleFxuICAgICAgICAgIGNvbnRpbnVlIGlmIG1hdGNoSW5kZXggPCAwICMgSWYgbWFya2luZyB1cCB0aGUgYmFzZW5hbWUsIG9taXQgcGF0aCBtYXRjaGVzXG4gICAgICAgICAgdW5tYXRjaGVkID0gcGF0aC5zdWJzdHJpbmcobGFzdEluZGV4LCBtYXRjaEluZGV4KVxuICAgICAgICAgIGlmIHVubWF0Y2hlZFxuICAgICAgICAgICAgQHNwYW4gbWF0Y2hlZENoYXJzLmpvaW4oJycpLCBjbGFzczogJ2NoYXJhY3Rlci1tYXRjaCcgaWYgbWF0Y2hlZENoYXJzLmxlbmd0aFxuICAgICAgICAgICAgbWF0Y2hlZENoYXJzID0gW11cbiAgICAgICAgICAgIEB0ZXh0IHVubWF0Y2hlZFxuICAgICAgICAgIG1hdGNoZWRDaGFycy5wdXNoKHBhdGhbbWF0Y2hJbmRleF0pXG4gICAgICAgICAgbGFzdEluZGV4ID0gbWF0Y2hJbmRleCArIDFcblxuICAgICAgICBAc3BhbiBtYXRjaGVkQ2hhcnMuam9pbignJyksIGNsYXNzOiAnY2hhcmFjdGVyLW1hdGNoJyBpZiBtYXRjaGVkQ2hhcnMubGVuZ3RoXG5cbiAgICAgICAgIyBSZW1haW5pbmcgY2hhcmFjdGVycyBhcmUgcGxhaW4gdGV4dFxuICAgICAgICBAdGV4dCBwYXRoLnN1YnN0cmluZyhsYXN0SW5kZXgpXG5cblxuICAgICAgQGxpIGNsYXNzOiAndHdvLWxpbmVzJywgPT5cbiAgICAgICAgaWYgKHJlcG8gPSByZXBvc2l0b3J5Rm9yUGF0aChmaWxlUGF0aCkpP1xuICAgICAgICAgIHN0YXR1cyA9IHJlcG8uZ2V0Q2FjaGVkUGF0aFN0YXR1cyhmaWxlUGF0aClcbiAgICAgICAgICBpZiByZXBvLmlzU3RhdHVzTmV3KHN0YXR1cylcbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzdGF0dXMgc3RhdHVzLWFkZGVkIGljb24gaWNvbi1kaWZmLWFkZGVkJ1xuICAgICAgICAgIGVsc2UgaWYgcmVwby5pc1N0YXR1c01vZGlmaWVkKHN0YXR1cylcbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzdGF0dXMgc3RhdHVzLW1vZGlmaWVkIGljb24gaWNvbi1kaWZmLW1vZGlmaWVkJ1xuXG4gICAgICAgIHR5cGVDbGFzcyA9IEZpbGVJY29ucy5nZXRTZXJ2aWNlKCkuaWNvbkNsYXNzRm9yUGF0aChmaWxlUGF0aCwgJ2Z1enp5LWZpbmRlcicpIG9yIFtdXG4gICAgICAgIHVubGVzcyBBcnJheS5pc0FycmF5IHR5cGVDbGFzc1xuICAgICAgICAgIHR5cGVDbGFzcyA9IHR5cGVDbGFzcz8udG9TdHJpbmcoKS5zcGxpdCgvXFxzKy9nKVxuXG4gICAgICAgIGZpbGVCYXNlbmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpXG4gICAgICAgIGJhc2VPZmZzZXQgPSBwcm9qZWN0UmVsYXRpdmVQYXRoLmxlbmd0aCAtIGZpbGVCYXNlbmFtZS5sZW5ndGhcblxuICAgICAgICBAZGl2IGNsYXNzOiBcInByaW1hcnktbGluZSBmaWxlIGljb24gI3t0eXBlQ2xhc3Muam9pbignICcpfVwiLCAnZGF0YS1uYW1lJzogZmlsZUJhc2VuYW1lLCAnZGF0YS1wYXRoJzogcHJvamVjdFJlbGF0aXZlUGF0aCwgLT4gaGlnaGxpZ2h0ZXIoZmlsZUJhc2VuYW1lLCBtYXRjaGVzLCBiYXNlT2Zmc2V0KVxuICAgICAgICBAZGl2IGNsYXNzOiAnc2Vjb25kYXJ5LWxpbmUgcGF0aCBuby1pY29uJywgLT4gaGlnaGxpZ2h0ZXIocHJvamVjdFJlbGF0aXZlUGF0aCwgbWF0Y2hlcywgMClcblxuICBvcGVuUGF0aDogKGZpbGVQYXRoLCBsaW5lTnVtYmVyLCBvcGVuT3B0aW9ucykgLT5cbiAgICBpZiBmaWxlUGF0aFxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlUGF0aCwgb3Blbk9wdGlvbnMpLnRoZW4gPT4gQG1vdmVUb0xpbmUobGluZU51bWJlcilcblxuICBtb3ZlVG9MaW5lOiAobGluZU51bWJlcj0tMSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGxpbmVOdW1iZXIgPj0gMFxuXG4gICAgaWYgdGV4dEVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgcG9zaXRpb24gPSBuZXcgUG9pbnQobGluZU51bWJlcilcbiAgICAgIHRleHRFZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihwb3NpdGlvbiwgY2VudGVyOiB0cnVlKVxuICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihwb3NpdGlvbilcbiAgICAgIHRleHRFZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuXG4gIHNwbGl0T3BlblBhdGg6IChzcGxpdEZuKSAtPlxuICAgIHtmaWxlUGF0aH0gPSBAZ2V0U2VsZWN0ZWRJdGVtKCkgPyB7fVxuICAgIGxpbmVOdW1iZXIgPSBAZ2V0TGluZU51bWJlcigpXG5cbiAgICBpZiBAaXNRdWVyeUFMaW5lSnVtcCgpIGFuZCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgIHNwbGl0Rm4ocGFuZSkoY29weUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgICBAbW92ZVRvTGluZShsaW5lTnVtYmVyKVxuICAgIGVsc2UgaWYgbm90IGZpbGVQYXRoXG4gICAgICByZXR1cm5cbiAgICBlbHNlIGlmIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgIHNwbGl0Rm4ocGFuZSkoKVxuICAgICAgQG9wZW5QYXRoKGZpbGVQYXRoLCBsaW5lTnVtYmVyKVxuICAgIGVsc2VcbiAgICAgIEBvcGVuUGF0aChmaWxlUGF0aCwgbGluZU51bWJlcilcblxuICBwb3B1bGF0ZUxpc3Q6IC0+XG4gICAgaWYgQGlzUXVlcnlBTGluZUp1bXAoKVxuICAgICAgQGxpc3QuZW1wdHkoKVxuICAgICAgQHNldEVycm9yKCdKdW1wIHRvIGxpbmUgaW4gYWN0aXZlIGVkaXRvcicpXG4gICAgZWxzZSBpZiBAYWx0ZXJuYXRlU2NvcmluZ1xuICAgICAgQHBvcHVsYXRlQWx0ZXJuYXRlTGlzdCgpXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuXG4gICMgVW5mb3J0dW5hdGVseSAgU2VsZWN0TGlzdFZpZXcgZG8gbm90IGFsbG93IGluaGVyaXRvciB0byBoYW5kbGUgdGhlaXIgb3duIGZpbHRlcmluZy5cbiAgIyBUaGF0IHdvdWxkIGJlIHJlcXVpcmVkIHRvIHVzZSBleHRlcm5hbCBrbm93bGVkZ2UsIGZvciBleGFtcGxlOiBnaXZlIGEgYm9udXMgdG8gcmVjZW50IGZpbGVzLlxuICAjXG4gICMgT3IsIGluIHRoaXMgY2FzZTogdGVzdCBhbiBhbHRlcm5hdGUgc2NvcmluZyBhbGdvcml0aG0uXG4gICNcbiAgIyBUaGlzIGlzIG1vZGlmaWVkIGNvcHkvcGFzdGUgZnJvbSBTZWxlY3RMaXN0VmlldyNwb3B1bGF0ZUxpc3QsIHJlcXVpcmUgalF1ZXJ5IVxuICAjIFNob3VsZCBiZSB0ZW1wb3JhcnlcblxuICBwb3B1bGF0ZUFsdGVybmF0ZUxpc3Q6IC0+XG5cbiAgICByZXR1cm4gdW5sZXNzIEBpdGVtcz9cblxuICAgIGZpbHRlclF1ZXJ5ID0gQGdldEZpbHRlclF1ZXJ5KClcbiAgICBpZiBmaWx0ZXJRdWVyeS5sZW5ndGhcbiAgICAgIGZpbHRlcmVkSXRlbXMgPSBmdXp6YWxkcmluUGx1cy5maWx0ZXIoQGl0ZW1zLCBmaWx0ZXJRdWVyeSwga2V5OiBAZ2V0RmlsdGVyS2V5KCkpXG4gICAgZWxzZVxuICAgICAgZmlsdGVyZWRJdGVtcyA9IEBpdGVtc1xuXG4gICAgQGxpc3QuZW1wdHkoKVxuICAgIGlmIGZpbHRlcmVkSXRlbXMubGVuZ3RoXG4gICAgICBAc2V0RXJyb3IobnVsbClcblxuICAgICAgZm9yIGkgaW4gWzAuLi5NYXRoLm1pbihmaWx0ZXJlZEl0ZW1zLmxlbmd0aCwgQG1heEl0ZW1zKV1cbiAgICAgICAgaXRlbSA9IGZpbHRlcmVkSXRlbXNbaV1cbiAgICAgICAgaXRlbVZpZXcgPSAkKEB2aWV3Rm9ySXRlbShpdGVtKSlcbiAgICAgICAgaXRlbVZpZXcuZGF0YSgnc2VsZWN0LWxpc3QtaXRlbScsIGl0ZW0pXG4gICAgICAgIEBsaXN0LmFwcGVuZChpdGVtVmlldylcblxuICAgICAgQHNlbGVjdEl0ZW1WaWV3KEBsaXN0LmZpbmQoJ2xpOmZpcnN0JykpXG4gICAgZWxzZVxuICAgICAgQHNldEVycm9yKEBnZXRFbXB0eU1lc3NhZ2UoQGl0ZW1zLmxlbmd0aCwgZmlsdGVyZWRJdGVtcy5sZW5ndGgpKVxuXG5cblxuICBjb25maXJtU2VsZWN0aW9uOiAtPlxuICAgIGl0ZW0gPSBAZ2V0U2VsZWN0ZWRJdGVtKClcbiAgICBAY29uZmlybWVkKGl0ZW0sIHNlYXJjaEFsbFBhbmVzOiBhdG9tLmNvbmZpZy5nZXQoJ2Z1enp5LWZpbmRlci5zZWFyY2hBbGxQYW5lcycpKVxuXG4gIGNvbmZpcm1JbnZlcnRlZFNlbGVjdGlvbjogLT5cbiAgICBpdGVtID0gQGdldFNlbGVjdGVkSXRlbSgpXG4gICAgQGNvbmZpcm1lZChpdGVtLCBzZWFyY2hBbGxQYW5lczogbm90IGF0b20uY29uZmlnLmdldCgnZnV6enktZmluZGVyLnNlYXJjaEFsbFBhbmVzJykpXG5cbiAgY29uZmlybWVkOiAoe2ZpbGVQYXRofT17fSwgb3Blbk9wdGlvbnMpIC0+XG4gICAgaWYgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpIGFuZCBAaXNRdWVyeUFMaW5lSnVtcCgpXG4gICAgICBsaW5lTnVtYmVyID0gQGdldExpbmVOdW1iZXIoKVxuICAgICAgQGNhbmNlbCgpXG4gICAgICBAbW92ZVRvTGluZShsaW5lTnVtYmVyKVxuICAgIGVsc2UgaWYgbm90IGZpbGVQYXRoXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlIGlmIGZzLmlzRGlyZWN0b3J5U3luYyhmaWxlUGF0aClcbiAgICAgIEBzZXRFcnJvcignU2VsZWN0ZWQgcGF0aCBpcyBhIGRpcmVjdG9yeScpXG4gICAgICBzZXRUaW1lb3V0KCg9PiBAc2V0RXJyb3IoKSksIDIwMDApXG4gICAgZWxzZVxuICAgICAgbGluZU51bWJlciA9IEBnZXRMaW5lTnVtYmVyKClcbiAgICAgIEBjYW5jZWwoKVxuICAgICAgQG9wZW5QYXRoKGZpbGVQYXRoLCBsaW5lTnVtYmVyLCBvcGVuT3B0aW9ucylcblxuICBpc1F1ZXJ5QUxpbmVKdW1wOiAtPlxuICAgIHF1ZXJ5ID0gQGZpbHRlckVkaXRvclZpZXcuZ2V0TW9kZWwoKS5nZXRUZXh0KClcbiAgICBjb2xvbiA9IHF1ZXJ5LmluZGV4T2YoJzonKVxuICAgIHRyaW1tZWRQYXRoID0gQGdldEZpbHRlclF1ZXJ5KCkudHJpbSgpXG5cbiAgICB0cmltbWVkUGF0aCBpcyAnJyBhbmQgY29sb24gaXNudCAtMVxuXG4gIGdldEZpbHRlclF1ZXJ5OiAtPlxuICAgIHF1ZXJ5ID0gc3VwZXJcbiAgICBjb2xvbiA9IHF1ZXJ5LmluZGV4T2YoJzonKVxuICAgIHF1ZXJ5ID0gcXVlcnlbMC4uLmNvbG9uXSBpZiBjb2xvbiBpc250IC0xXG4gICAgIyBOb3JtYWxpemUgdG8gYmFja3NsYXNoZXMgb24gV2luZG93c1xuICAgIHF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvXFwvL2csICdcXFxcJykgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG4gICAgcXVlcnlcblxuICBnZXRMaW5lTnVtYmVyOiAtPlxuICAgIHF1ZXJ5ID0gQGZpbHRlckVkaXRvclZpZXcuZ2V0VGV4dCgpXG4gICAgY29sb24gPSBxdWVyeS5pbmRleE9mKCc6JylcbiAgICBpZiBjb2xvbiBpcyAtMVxuICAgICAgLTFcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChxdWVyeVtjb2xvbisxLi5dKSAtIDFcblxuICBzZXRJdGVtczogKGZpbGVQYXRocykgLT5cbiAgICBzdXBlcihAcHJvamVjdFJlbGF0aXZlUGF0aHNGb3JGaWxlUGF0aHMoZmlsZVBhdGhzKSlcblxuICBwcm9qZWN0UmVsYXRpdmVQYXRoc0ZvckZpbGVQYXRoczogKGZpbGVQYXRocykgLT5cbiAgICAjIERvbid0IHJlZ2VuZXJhdGUgcHJvamVjdCByZWxhdGl2ZSBwYXRocyB1bmxlc3MgdGhlIGZpbGUgcGF0aHMgaGF2ZSBjaGFuZ2VkXG4gICAgaWYgZmlsZVBhdGhzIGlzbnQgQGZpbGVQYXRoc1xuICAgICAgcHJvamVjdEhhc011bHRpcGxlRGlyZWN0b3JpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5sZW5ndGggPiAxXG5cbiAgICAgIEBmaWxlUGF0aHMgPSBmaWxlUGF0aHNcbiAgICAgIEBwcm9qZWN0UmVsYXRpdmVQYXRocyA9IEBmaWxlUGF0aHMubWFwIChmaWxlUGF0aCkgLT5cbiAgICAgICAgW3Jvb3RQYXRoLCBwcm9qZWN0UmVsYXRpdmVQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlUGF0aClcbiAgICAgICAgaWYgcm9vdFBhdGggYW5kIHByb2plY3RIYXNNdWx0aXBsZURpcmVjdG9yaWVzXG4gICAgICAgICAgcHJvamVjdFJlbGF0aXZlUGF0aCA9IHBhdGguam9pbihwYXRoLmJhc2VuYW1lKHJvb3RQYXRoKSwgcHJvamVjdFJlbGF0aXZlUGF0aClcbiAgICAgICAge2ZpbGVQYXRoLCBwcm9qZWN0UmVsYXRpdmVQYXRofVxuXG4gICAgQHByb2plY3RSZWxhdGl2ZVBhdGhzXG5cbiAgc2hvdzogLT5cbiAgICBAc3RvcmVGb2N1c2VkRWxlbWVudCgpXG4gICAgQHBhbmVsID89IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcylcbiAgICBAcGFuZWwuc2hvdygpXG4gICAgQGZvY3VzRmlsdGVyRWRpdG9yKClcblxuICBoaWRlOiAtPlxuICAgIEBwYW5lbD8uaGlkZSgpXG5cbiAgY2FuY2VsbGVkOiAtPlxuICAgIEBoaWRlKClcbiJdfQ==
