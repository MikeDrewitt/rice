(function() {
  var $, BufferSearch, CompositeDisposable, Disposable, FileIcons, FindOptions, FindView, History, HistoryCycler, ProjectFindView, ResultsModel, ResultsPaneView, SelectNext, TextBuffer, ref, ref1;

  $ = require('atom-space-pen-views').$;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable, TextBuffer = ref.TextBuffer;

  SelectNext = require('./select-next');

  ref1 = require('./history'), History = ref1.History, HistoryCycler = ref1.HistoryCycler;

  FindOptions = require('./find-options');

  BufferSearch = require('./buffer-search');

  FileIcons = require('./file-icons');

  FindView = require('./find-view');

  ProjectFindView = require('./project-find-view');

  ResultsModel = require('./project/results-model');

  ResultsPaneView = require('./project/results-pane');

  module.exports = {
    activate: function(arg) {
      var findHistory, findOptions, handleEditorCancel, pathsHistory, ref2, replaceHistory, selectNextObjectForEditorElement, showPanel, togglePanel;
      ref2 = arg != null ? arg : {}, findOptions = ref2.findOptions, findHistory = ref2.findHistory, replaceHistory = ref2.replaceHistory, pathsHistory = ref2.pathsHistory;
      atom.workspace.addOpener(function(filePath) {
        if (filePath === ResultsPaneView.URI) {
          return new ResultsPaneView();
        }
      });
      this.subscriptions = new CompositeDisposable;
      this.findHistory = new History(findHistory);
      this.replaceHistory = new History(replaceHistory);
      this.pathsHistory = new History(pathsHistory);
      this.findOptions = new FindOptions(findOptions);
      this.findModel = new BufferSearch(this.findOptions);
      this.resultsModel = new ResultsModel(this.findOptions);
      this.subscriptions.add(atom.workspace.observeActivePaneItem((function(_this) {
        return function(paneItem) {
          if (paneItem != null ? typeof paneItem.getBuffer === "function" ? paneItem.getBuffer() : void 0 : void 0) {
            return _this.findModel.setEditor(paneItem);
          } else {
            return _this.findModel.setEditor(null);
          }
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('.find-and-replace, .project-find', 'window:focus-next-pane', function() {
        return atom.views.getView(atom.workspace).focus();
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:show', (function(_this) {
        return function() {
          _this.createViews();
          return showPanel(_this.projectFindPanel, _this.findPanel, function() {
            return _this.projectFindView.focusFindElement();
          });
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:toggle', (function(_this) {
        return function() {
          _this.createViews();
          return togglePanel(_this.projectFindPanel, _this.findPanel, function() {
            return _this.projectFindView.focusFindElement();
          });
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'project-find:show-in-current-directory', (function(_this) {
        return function(arg1) {
          var target;
          target = arg1.target;
          _this.createViews();
          _this.findPanel.hide();
          _this.projectFindPanel.show();
          _this.projectFindView.focusFindElement();
          return _this.projectFindView.findInCurrentlySelectedDirectory(target);
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:use-selection-as-find-pattern', (function(_this) {
        return function() {
          var ref3, ref4;
          if (((ref3 = _this.projectFindPanel) != null ? ref3.isVisible() : void 0) || ((ref4 = _this.findPanel) != null ? ref4.isVisible() : void 0)) {
            return;
          }
          return _this.createViews();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:toggle', (function(_this) {
        return function() {
          _this.createViews();
          return togglePanel(_this.findPanel, _this.projectFindPanel, function() {
            return _this.findView.focusFindEditor();
          });
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:show', (function(_this) {
        return function() {
          _this.createViews();
          return showPanel(_this.findPanel, _this.projectFindPanel, function() {
            return _this.findView.focusFindEditor();
          });
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:show-replace', (function(_this) {
        return function() {
          _this.createViews();
          return showPanel(_this.findPanel, _this.projectFindPanel, function() {
            return _this.findView.focusReplaceEditor();
          });
        };
      })(this)));
      this.subscriptions.add(atom.commands.add('atom-workspace', 'find-and-replace:clear-history', (function(_this) {
        return function() {
          _this.findHistory.clear();
          return _this.replaceHistory.clear();
        };
      })(this)));
      handleEditorCancel = (function(_this) {
        return function(arg1) {
          var isMiniEditor, ref3, ref4, target;
          target = arg1.target;
          isMiniEditor = target.tagName === 'ATOM-TEXT-EDITOR' && target.hasAttribute('mini');
          if (!isMiniEditor) {
            if ((ref3 = _this.findPanel) != null) {
              ref3.hide();
            }
            return (ref4 = _this.projectFindPanel) != null ? ref4.hide() : void 0;
          }
        };
      })(this);
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'core:cancel': handleEditorCancel,
        'core:close': handleEditorCancel
      }));
      selectNextObjectForEditorElement = (function(_this) {
        return function(editorElement) {
          var editor, selectNext;
          if (_this.selectNextObjects == null) {
            _this.selectNextObjects = new WeakMap();
          }
          editor = editorElement.getModel();
          selectNext = _this.selectNextObjects.get(editor);
          if (selectNext == null) {
            selectNext = new SelectNext(editor);
            _this.selectNextObjects.set(editor, selectNext);
          }
          return selectNext;
        };
      })(this);
      showPanel = function(panelToShow, panelToHide, postShowAction) {
        panelToHide.hide();
        panelToShow.show();
        return typeof postShowAction === "function" ? postShowAction() : void 0;
      };
      togglePanel = function(panelToToggle, panelToHide, postToggleAction) {
        panelToHide.hide();
        if (panelToToggle.isVisible()) {
          return panelToToggle.hide();
        } else {
          panelToToggle.show();
          return typeof postToggleAction === "function" ? postToggleAction() : void 0;
        }
      };
      return atom.commands.add('.editor:not(.mini)', {
        'find-and-replace:select-next': function(event) {
          return selectNextObjectForEditorElement(this).findAndSelectNext();
        },
        'find-and-replace:select-all': function(event) {
          return selectNextObjectForEditorElement(this).findAndSelectAll();
        },
        'find-and-replace:select-undo': function(event) {
          return selectNextObjectForEditorElement(this).undoLastSelection();
        },
        'find-and-replace:select-skip': function(event) {
          return selectNextObjectForEditorElement(this).skipCurrentSelection();
        }
      });
    },
    consumeFileIcons: function(service) {
      FileIcons.setService(service);
      return new Disposable(function() {
        return FileIcons.resetService();
      });
    },
    provideService: function() {
      return {
        resultsMarkerLayerForTextEditor: this.findModel.resultsMarkerLayerForTextEditor.bind(this.findModel)
      };
    },
    createViews: function() {
      var findBuffer, findHistoryCycler, options, pathsBuffer, pathsHistoryCycler, replaceBuffer, replaceHistoryCycler;
      if (this.findView != null) {
        return;
      }
      findBuffer = new TextBuffer;
      replaceBuffer = new TextBuffer;
      pathsBuffer = new TextBuffer;
      findHistoryCycler = new HistoryCycler(findBuffer, this.findHistory);
      replaceHistoryCycler = new HistoryCycler(replaceBuffer, this.replaceHistory);
      pathsHistoryCycler = new HistoryCycler(pathsBuffer, this.pathsHistory);
      options = {
        findBuffer: findBuffer,
        replaceBuffer: replaceBuffer,
        pathsBuffer: pathsBuffer,
        findHistoryCycler: findHistoryCycler,
        replaceHistoryCycler: replaceHistoryCycler,
        pathsHistoryCycler: pathsHistoryCycler
      };
      this.findView = new FindView(this.findModel, options);
      this.projectFindView = new ProjectFindView(this.resultsModel, options);
      this.findPanel = atom.workspace.addBottomPanel({
        item: this.findView,
        visible: false,
        className: 'tool-panel panel-bottom'
      });
      this.projectFindPanel = atom.workspace.addBottomPanel({
        item: this.projectFindView,
        visible: false,
        className: 'tool-panel panel-bottom'
      });
      this.findView.setPanel(this.findPanel);
      this.projectFindView.setPanel(this.projectFindPanel);
      return ResultsPaneView.model = this.resultsModel;
    },
    deactivate: function() {
      var ref2, ref3, ref4, ref5, ref6, ref7;
      if ((ref2 = this.findPanel) != null) {
        ref2.destroy();
      }
      this.findPanel = null;
      if ((ref3 = this.findView) != null) {
        ref3.destroy();
      }
      this.findView = null;
      if ((ref4 = this.findModel) != null) {
        ref4.destroy();
      }
      this.findModel = null;
      if ((ref5 = this.projectFindPanel) != null) {
        ref5.destroy();
      }
      this.projectFindPanel = null;
      if ((ref6 = this.projectFindView) != null) {
        ref6.destroy();
      }
      this.projectFindView = null;
      ResultsPaneView.model = null;
      this.resultsModel = null;
      if ((ref7 = this.subscriptions) != null) {
        ref7.dispose();
      }
      return this.subscriptions = null;
    },
    serialize: function() {
      return {
        findOptions: this.findOptions.serialize(),
        findHistory: this.findHistory.serialize(),
        replaceHistory: this.replaceHistory.serialize(),
        pathsHistory: this.pathsHistory.serialize()
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9maW5kLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsSUFBSyxPQUFBLENBQVEsc0JBQVI7O0VBQ04sTUFBZ0QsT0FBQSxDQUFRLE1BQVIsQ0FBaEQsRUFBQyw2Q0FBRCxFQUFzQiwyQkFBdEIsRUFBa0M7O0VBRWxDLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFDYixPQUEyQixPQUFBLENBQVEsV0FBUixDQUEzQixFQUFDLHNCQUFELEVBQVU7O0VBQ1YsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxZQUFBLEdBQWUsT0FBQSxDQUFRLGlCQUFSOztFQUNmLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFDWixRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBQ2xCLFlBQUEsR0FBZSxPQUFBLENBQVEseUJBQVI7O0VBQ2YsZUFBQSxHQUFrQixPQUFBLENBQVEsd0JBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTsyQkFEUyxNQUF5RCxJQUF4RCxnQ0FBYSxnQ0FBYSxzQ0FBZ0I7TUFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLFNBQUMsUUFBRDtRQUN2QixJQUF5QixRQUFBLEtBQVksZUFBZSxDQUFDLEdBQXJEO2lCQUFJLElBQUEsZUFBQSxDQUFBLEVBQUo7O01BRHVCLENBQXpCO01BR0EsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsV0FBRCxHQUFtQixJQUFBLE9BQUEsQ0FBUSxXQUFSO01BQ25C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LGNBQUEsRUFBZ0IsSUFBQyxDQUFBLGNBQWMsQ0FBQyxTQUFoQixDQUFBLENBRmhCO1FBR0EsWUFBQSxFQUFjLElBQUMsQ0FBQSxZQUFZLENBQUMsU0FBZCxDQUFBLENBSGQ7O0lBRFMsQ0FuS1g7O0FBZEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7JH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBUZXh0QnVmZmVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cblNlbGVjdE5leHQgPSByZXF1aXJlICcuL3NlbGVjdC1uZXh0J1xue0hpc3RvcnksIEhpc3RvcnlDeWNsZXJ9ID0gcmVxdWlyZSAnLi9oaXN0b3J5J1xuRmluZE9wdGlvbnMgPSByZXF1aXJlICcuL2ZpbmQtb3B0aW9ucydcbkJ1ZmZlclNlYXJjaCA9IHJlcXVpcmUgJy4vYnVmZmVyLXNlYXJjaCdcbkZpbGVJY29ucyA9IHJlcXVpcmUgJy4vZmlsZS1pY29ucydcbkZpbmRWaWV3ID0gcmVxdWlyZSAnLi9maW5kLXZpZXcnXG5Qcm9qZWN0RmluZFZpZXcgPSByZXF1aXJlICcuL3Byb2plY3QtZmluZC12aWV3J1xuUmVzdWx0c01vZGVsID0gcmVxdWlyZSAnLi9wcm9qZWN0L3Jlc3VsdHMtbW9kZWwnXG5SZXN1bHRzUGFuZVZpZXcgPSByZXF1aXJlICcuL3Byb2plY3QvcmVzdWx0cy1wYW5lJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoe2ZpbmRPcHRpb25zLCBmaW5kSGlzdG9yeSwgcmVwbGFjZUhpc3RvcnksIHBhdGhzSGlzdG9yeX09e30pIC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyIChmaWxlUGF0aCkgLT5cbiAgICAgIG5ldyBSZXN1bHRzUGFuZVZpZXcoKSBpZiBmaWxlUGF0aCBpcyBSZXN1bHRzUGFuZVZpZXcuVVJJXG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGZpbmRIaXN0b3J5ID0gbmV3IEhpc3RvcnkoZmluZEhpc3RvcnkpXG4gICAgQHJlcGxhY2VIaXN0b3J5ID0gbmV3IEhpc3RvcnkocmVwbGFjZUhpc3RvcnkpXG4gICAgQHBhdGhzSGlzdG9yeSA9IG5ldyBIaXN0b3J5KHBhdGhzSGlzdG9yeSlcblxuICAgIEBmaW5kT3B0aW9ucyA9IG5ldyBGaW5kT3B0aW9ucyhmaW5kT3B0aW9ucylcbiAgICBAZmluZE1vZGVsID0gbmV3IEJ1ZmZlclNlYXJjaChAZmluZE9wdGlvbnMpXG4gICAgQHJlc3VsdHNNb2RlbCA9IG5ldyBSZXN1bHRzTW9kZWwoQGZpbmRPcHRpb25zKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSAocGFuZUl0ZW0pID0+XG4gICAgICBpZiBwYW5lSXRlbT8uZ2V0QnVmZmVyPygpXG4gICAgICAgIEBmaW5kTW9kZWwuc2V0RWRpdG9yKHBhbmVJdGVtKVxuICAgICAgZWxzZVxuICAgICAgICBAZmluZE1vZGVsLnNldEVkaXRvcihudWxsKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcuZmluZC1hbmQtcmVwbGFjZSwgLnByb2plY3QtZmluZCcsICd3aW5kb3c6Zm9jdXMtbmV4dC1wYW5lJywgLT5cbiAgICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuZm9jdXMoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdwcm9qZWN0LWZpbmQ6c2hvdycsID0+XG4gICAgICBAY3JlYXRlVmlld3MoKVxuICAgICAgc2hvd1BhbmVsIEBwcm9qZWN0RmluZFBhbmVsLCBAZmluZFBhbmVsLCA9PiBAcHJvamVjdEZpbmRWaWV3LmZvY3VzRmluZEVsZW1lbnQoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdwcm9qZWN0LWZpbmQ6dG9nZ2xlJywgPT5cbiAgICAgIEBjcmVhdGVWaWV3cygpXG4gICAgICB0b2dnbGVQYW5lbCBAcHJvamVjdEZpbmRQYW5lbCwgQGZpbmRQYW5lbCwgPT4gQHByb2plY3RGaW5kVmlldy5mb2N1c0ZpbmRFbGVtZW50KClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAncHJvamVjdC1maW5kOnNob3ctaW4tY3VycmVudC1kaXJlY3RvcnknLCAoe3RhcmdldH0pID0+XG4gICAgICBAY3JlYXRlVmlld3MoKVxuICAgICAgQGZpbmRQYW5lbC5oaWRlKClcbiAgICAgIEBwcm9qZWN0RmluZFBhbmVsLnNob3coKVxuICAgICAgQHByb2plY3RGaW5kVmlldy5mb2N1c0ZpbmRFbGVtZW50KClcbiAgICAgIEBwcm9qZWN0RmluZFZpZXcuZmluZEluQ3VycmVudGx5U2VsZWN0ZWREaXJlY3RvcnkodGFyZ2V0KVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdmaW5kLWFuZC1yZXBsYWNlOnVzZS1zZWxlY3Rpb24tYXMtZmluZC1wYXR0ZXJuJywgPT5cbiAgICAgIHJldHVybiBpZiBAcHJvamVjdEZpbmRQYW5lbD8uaXNWaXNpYmxlKCkgb3IgQGZpbmRQYW5lbD8uaXNWaXNpYmxlKClcbiAgICAgIEBjcmVhdGVWaWV3cygpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2ZpbmQtYW5kLXJlcGxhY2U6dG9nZ2xlJywgPT5cbiAgICAgIEBjcmVhdGVWaWV3cygpXG4gICAgICB0b2dnbGVQYW5lbCBAZmluZFBhbmVsLCBAcHJvamVjdEZpbmRQYW5lbCwgPT4gQGZpbmRWaWV3LmZvY3VzRmluZEVkaXRvcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2ZpbmQtYW5kLXJlcGxhY2U6c2hvdycsID0+XG4gICAgICBAY3JlYXRlVmlld3MoKVxuICAgICAgc2hvd1BhbmVsIEBmaW5kUGFuZWwsIEBwcm9qZWN0RmluZFBhbmVsLCA9PiBAZmluZFZpZXcuZm9jdXNGaW5kRWRpdG9yKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZmluZC1hbmQtcmVwbGFjZTpzaG93LXJlcGxhY2UnLCA9PlxuICAgICAgQGNyZWF0ZVZpZXdzKClcbiAgICAgIHNob3dQYW5lbCBAZmluZFBhbmVsLCBAcHJvamVjdEZpbmRQYW5lbCwgPT4gQGZpbmRWaWV3LmZvY3VzUmVwbGFjZUVkaXRvcigpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2ZpbmQtYW5kLXJlcGxhY2U6Y2xlYXItaGlzdG9yeScsID0+XG4gICAgICBAZmluZEhpc3RvcnkuY2xlYXIoKVxuICAgICAgQHJlcGxhY2VIaXN0b3J5LmNsZWFyKClcblxuICAgICMgSGFuZGxpbmcgY2FuY2VsIGluIHRoZSB3b3Jrc3BhY2UgKyBjb2RlIGVkaXRvcnNcbiAgICBoYW5kbGVFZGl0b3JDYW5jZWwgPSAoe3RhcmdldH0pID0+XG4gICAgICBpc01pbmlFZGl0b3IgPSB0YXJnZXQudGFnTmFtZSBpcyAnQVRPTS1URVhULUVESVRPUicgYW5kIHRhcmdldC5oYXNBdHRyaWJ1dGUoJ21pbmknKVxuICAgICAgdW5sZXNzIGlzTWluaUVkaXRvclxuICAgICAgICBAZmluZFBhbmVsPy5oaWRlKClcbiAgICAgICAgQHByb2plY3RGaW5kUGFuZWw/LmhpZGUoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAnY29yZTpjYW5jZWwnOiBoYW5kbGVFZGl0b3JDYW5jZWxcbiAgICAgICdjb3JlOmNsb3NlJzogaGFuZGxlRWRpdG9yQ2FuY2VsXG5cbiAgICBzZWxlY3ROZXh0T2JqZWN0Rm9yRWRpdG9yRWxlbWVudCA9IChlZGl0b3JFbGVtZW50KSA9PlxuICAgICAgQHNlbGVjdE5leHRPYmplY3RzID89IG5ldyBXZWFrTWFwKClcbiAgICAgIGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgICAgc2VsZWN0TmV4dCA9IEBzZWxlY3ROZXh0T2JqZWN0cy5nZXQoZWRpdG9yKVxuICAgICAgdW5sZXNzIHNlbGVjdE5leHQ/XG4gICAgICAgIHNlbGVjdE5leHQgPSBuZXcgU2VsZWN0TmV4dChlZGl0b3IpXG4gICAgICAgIEBzZWxlY3ROZXh0T2JqZWN0cy5zZXQoZWRpdG9yLCBzZWxlY3ROZXh0KVxuICAgICAgc2VsZWN0TmV4dFxuXG4gICAgc2hvd1BhbmVsID0gKHBhbmVsVG9TaG93LCBwYW5lbFRvSGlkZSwgcG9zdFNob3dBY3Rpb24pIC0+XG4gICAgICBwYW5lbFRvSGlkZS5oaWRlKClcbiAgICAgIHBhbmVsVG9TaG93LnNob3coKVxuICAgICAgcG9zdFNob3dBY3Rpb24/KClcblxuICAgIHRvZ2dsZVBhbmVsID0gKHBhbmVsVG9Ub2dnbGUsIHBhbmVsVG9IaWRlLCBwb3N0VG9nZ2xlQWN0aW9uKSAtPlxuICAgICAgcGFuZWxUb0hpZGUuaGlkZSgpXG5cbiAgICAgIGlmIHBhbmVsVG9Ub2dnbGUuaXNWaXNpYmxlKClcbiAgICAgICAgcGFuZWxUb1RvZ2dsZS5oaWRlKClcbiAgICAgIGVsc2VcbiAgICAgICAgcGFuZWxUb1RvZ2dsZS5zaG93KClcbiAgICAgICAgcG9zdFRvZ2dsZUFjdGlvbj8oKVxuXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJy5lZGl0b3I6bm90KC5taW5pKScsXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpzZWxlY3QtbmV4dCc6IChldmVudCkgLT5cbiAgICAgICAgc2VsZWN0TmV4dE9iamVjdEZvckVkaXRvckVsZW1lbnQodGhpcykuZmluZEFuZFNlbGVjdE5leHQoKVxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6c2VsZWN0LWFsbCc6IChldmVudCkgLT5cbiAgICAgICAgc2VsZWN0TmV4dE9iamVjdEZvckVkaXRvckVsZW1lbnQodGhpcykuZmluZEFuZFNlbGVjdEFsbCgpXG4gICAgICAnZmluZC1hbmQtcmVwbGFjZTpzZWxlY3QtdW5kbyc6IChldmVudCkgLT5cbiAgICAgICAgc2VsZWN0TmV4dE9iamVjdEZvckVkaXRvckVsZW1lbnQodGhpcykudW5kb0xhc3RTZWxlY3Rpb24oKVxuICAgICAgJ2ZpbmQtYW5kLXJlcGxhY2U6c2VsZWN0LXNraXAnOiAoZXZlbnQpIC0+XG4gICAgICAgIHNlbGVjdE5leHRPYmplY3RGb3JFZGl0b3JFbGVtZW50KHRoaXMpLnNraXBDdXJyZW50U2VsZWN0aW9uKClcblxuICBjb25zdW1lRmlsZUljb25zOiAoc2VydmljZSkgLT5cbiAgICBGaWxlSWNvbnMuc2V0U2VydmljZSBzZXJ2aWNlXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuXG4gIHByb3ZpZGVTZXJ2aWNlOiAtPlxuICAgIHJlc3VsdHNNYXJrZXJMYXllckZvclRleHRFZGl0b3I6IEBmaW5kTW9kZWwucmVzdWx0c01hcmtlckxheWVyRm9yVGV4dEVkaXRvci5iaW5kKEBmaW5kTW9kZWwpXG5cbiAgY3JlYXRlVmlld3M6IC0+XG4gICAgcmV0dXJuIGlmIEBmaW5kVmlldz9cblxuICAgIGZpbmRCdWZmZXIgPSBuZXcgVGV4dEJ1ZmZlclxuICAgIHJlcGxhY2VCdWZmZXIgPSBuZXcgVGV4dEJ1ZmZlclxuICAgIHBhdGhzQnVmZmVyID0gbmV3IFRleHRCdWZmZXJcblxuICAgIGZpbmRIaXN0b3J5Q3ljbGVyID0gbmV3IEhpc3RvcnlDeWNsZXIoZmluZEJ1ZmZlciwgQGZpbmRIaXN0b3J5KVxuICAgIHJlcGxhY2VIaXN0b3J5Q3ljbGVyID0gbmV3IEhpc3RvcnlDeWNsZXIocmVwbGFjZUJ1ZmZlciwgQHJlcGxhY2VIaXN0b3J5KVxuICAgIHBhdGhzSGlzdG9yeUN5Y2xlciA9IG5ldyBIaXN0b3J5Q3ljbGVyKHBhdGhzQnVmZmVyLCBAcGF0aHNIaXN0b3J5KVxuXG4gICAgb3B0aW9ucyA9IHtmaW5kQnVmZmVyLCByZXBsYWNlQnVmZmVyLCBwYXRoc0J1ZmZlciwgZmluZEhpc3RvcnlDeWNsZXIsIHJlcGxhY2VIaXN0b3J5Q3ljbGVyLCBwYXRoc0hpc3RvcnlDeWNsZXJ9XG5cbiAgICBAZmluZFZpZXcgPSBuZXcgRmluZFZpZXcoQGZpbmRNb2RlbCwgb3B0aW9ucylcbiAgICBAcHJvamVjdEZpbmRWaWV3ID0gbmV3IFByb2plY3RGaW5kVmlldyhAcmVzdWx0c01vZGVsLCBvcHRpb25zKVxuXG4gICAgQGZpbmRQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IEBmaW5kVmlldywgdmlzaWJsZTogZmFsc2UsIGNsYXNzTmFtZTogJ3Rvb2wtcGFuZWwgcGFuZWwtYm90dG9tJylcbiAgICBAcHJvamVjdEZpbmRQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IEBwcm9qZWN0RmluZFZpZXcsIHZpc2libGU6IGZhbHNlLCBjbGFzc05hbWU6ICd0b29sLXBhbmVsIHBhbmVsLWJvdHRvbScpXG5cbiAgICBAZmluZFZpZXcuc2V0UGFuZWwoQGZpbmRQYW5lbClcbiAgICBAcHJvamVjdEZpbmRWaWV3LnNldFBhbmVsKEBwcm9qZWN0RmluZFBhbmVsKVxuXG4gICAgIyBIQUNLOiBTb29vbywgd2UgbmVlZCB0byBnZXQgdGhlIG1vZGVsIHRvIHRoZSBwYW5lIHZpZXcgd2hlbmV2ZXIgaXQgaXNcbiAgICAjIGNyZWF0ZWQuIENyZWF0aW9uIGNvdWxkIGNvbWUgZnJvbSB0aGUgb3BlbmVyIGJlbG93LCBvciwgbW9yZSBwcm9ibGVtYXRpYyxcbiAgICAjIGZyb20gYSBkZXNlcmlhbGl6ZSBjYWxsIHdoZW4gc3BsaXR0aW5nIHBhbmVzLiBGb3Igbm93LCBhbGwgcGFuZSB2aWV3cyB3aWxsXG4gICAgIyB1c2UgdGhpcyBzYW1lIG1vZGVsLiBUaGlzIG5lZWRzIHRvIGJlIGltcHJvdmVkISBJIGRvbnQga25vdyB0aGUgYmVzdCB3YXlcbiAgICAjIHRvIGRlYWwgd2l0aCB0aGlzOlxuICAgICMgMS4gSG93IHNob3VsZCBzZXJpYWxpemF0aW9uIHdvcmsgaW4gdGhlIGNhc2Ugb2YgYSBzaGFyZWQgbW9kZWwuXG4gICAgIyAyLiBPciBtYXliZSB3ZSBjcmVhdGUgdGhlIG1vZGVsIGVhY2ggdGltZSBhIG5ldyBwYW5lIGlzIGNyZWF0ZWQ/IFRoZW5cbiAgICAjICAgIFByb2plY3RGaW5kVmlldyBuZWVkcyB0byBrbm93IGFib3V0IGVhY2ggbW9kZWwgc28gaXQgY2FuIGludm9rZSBhIHNlYXJjaC5cbiAgICAjICAgIEFuZCBvbiBlYWNoIG5ldyBtb2RlbCwgaXQgd2lsbCBydW4gdGhlIHNlYXJjaCBhZ2Fpbi5cbiAgICAjXG4gICAgIyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vZmluZC1hbmQtcmVwbGFjZS9pc3N1ZXMvNjNcbiAgICBSZXN1bHRzUGFuZVZpZXcubW9kZWwgPSBAcmVzdWx0c01vZGVsXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZmluZFBhbmVsPy5kZXN0cm95KClcbiAgICBAZmluZFBhbmVsID0gbnVsbFxuICAgIEBmaW5kVmlldz8uZGVzdHJveSgpXG4gICAgQGZpbmRWaWV3ID0gbnVsbFxuICAgIEBmaW5kTW9kZWw/LmRlc3Ryb3koKVxuICAgIEBmaW5kTW9kZWwgPSBudWxsXG5cbiAgICBAcHJvamVjdEZpbmRQYW5lbD8uZGVzdHJveSgpXG4gICAgQHByb2plY3RGaW5kUGFuZWwgPSBudWxsXG4gICAgQHByb2plY3RGaW5kVmlldz8uZGVzdHJveSgpXG4gICAgQHByb2plY3RGaW5kVmlldyA9IG51bGxcblxuICAgIFJlc3VsdHNQYW5lVmlldy5tb2RlbCA9IG51bGxcbiAgICBAcmVzdWx0c01vZGVsID0gbnVsbFxuXG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBmaW5kT3B0aW9uczogQGZpbmRPcHRpb25zLnNlcmlhbGl6ZSgpXG4gICAgZmluZEhpc3Rvcnk6IEBmaW5kSGlzdG9yeS5zZXJpYWxpemUoKVxuICAgIHJlcGxhY2VIaXN0b3J5OiBAcmVwbGFjZUhpc3Rvcnkuc2VyaWFsaXplKClcbiAgICBwYXRoc0hpc3Rvcnk6IEBwYXRoc0hpc3Rvcnkuc2VyaWFsaXplKClcbiJdfQ==
