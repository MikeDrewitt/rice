(function() {
  var CompositeDisposable, CorrectionsView, SpellCheckTask, SpellCheckView, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  SpellCheckTask = require('./spell-check-task');

  CorrectionsView = null;

  module.exports = SpellCheckView = (function() {
    SpellCheckView.content = function() {
      return this.div({
        "class": 'spell-check'
      });
    };

    function SpellCheckView(editor, task, spellCheckModule, getInstance) {
      this.editor = editor;
      this.task = task;
      this.spellCheckModule = spellCheckModule;
      this.getInstance = getInstance;
      this.makeCorrection = bind(this.makeCorrection, this);
      this.addContextMenuEntries = bind(this.addContextMenuEntries, this);
      this.disposables = new CompositeDisposable;
      this.initializeMarkerLayer();
      this.taskWrapper = new SpellCheckTask(this.task);
      this.correctMisspellingCommand = atom.commands.add(atom.views.getView(this.editor), 'spell-check:correct-misspelling', (function(_this) {
        return function() {
          var marker, ref;
          if (marker = _this.markerLayer.findMarkers({
            containsBufferPosition: _this.editor.getCursorBufferPosition()
          })[0]) {
            if (CorrectionsView == null) {
              CorrectionsView = require('./corrections-view');
            }
            if ((ref = _this.correctionsView) != null) {
              ref.destroy();
            }
            return _this.correctionsView = new CorrectionsView(_this.editor, _this.getCorrections(marker), marker, _this, _this.updateMisspellings);
          }
        };
      })(this));
      atom.views.getView(this.editor).addEventListener('contextmenu', this.addContextMenuEntries);
      this.taskWrapper.onDidSpellCheck((function(_this) {
        return function(misspellings) {
          _this.destroyMarkers();
          if (_this.buffer != null) {
            return _this.addMarkers(misspellings);
          }
        };
      })(this));
      this.disposables.add(this.editor.onDidChangePath((function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(this.editor.onDidChangeGrammar((function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('editor.fontSize', (function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('spell-check.grammars', (function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.subscribeToBuffer();
      this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)));
    }

    SpellCheckView.prototype.initializeMarkerLayer = function() {
      this.markerLayer = this.editor.addMarkerLayer({
        maintainHistory: false
      });
      return this.markerLayerDecoration = this.editor.decorateMarkerLayer(this.markerLayer, {
        type: 'highlight',
        "class": 'spell-check-misspelling',
        deprecatedRegionClass: 'misspelling'
      });
    };

    SpellCheckView.prototype.destroy = function() {
      var ref;
      this.unsubscribeFromBuffer();
      this.disposables.dispose();
      this.taskWrapper.terminate();
      this.markerLayer.destroy();
      this.markerLayerDecoration.destroy();
      this.correctMisspellingCommand.dispose();
      if ((ref = this.correctionsView) != null) {
        ref.remove();
      }
      return this.clearContextMenuEntries();
    };

    SpellCheckView.prototype.unsubscribeFromBuffer = function() {
      this.destroyMarkers();
      if (this.buffer != null) {
        this.bufferDisposable.dispose();
        return this.buffer = null;
      }
    };

    SpellCheckView.prototype.subscribeToBuffer = function() {
      this.unsubscribeFromBuffer();
      if (this.spellCheckCurrentGrammar()) {
        this.buffer = this.editor.getBuffer();
        this.bufferDisposable = this.buffer.onDidStopChanging((function(_this) {
          return function() {
            return _this.updateMisspellings();
          };
        })(this));
        return this.updateMisspellings();
      }
    };

    SpellCheckView.prototype.spellCheckCurrentGrammar = function() {
      var grammar;
      grammar = this.editor.getGrammar().scopeName;
      return _.contains(atom.config.get('spell-check.grammars'), grammar);
    };

    SpellCheckView.prototype.destroyMarkers = function() {
      this.markerLayer.destroy();
      this.markerLayerDecoration.destroy();
      return this.initializeMarkerLayer();
    };

    SpellCheckView.prototype.addMarkers = function(misspellings) {
      var i, len, misspelling, results;
      results = [];
      for (i = 0, len = misspellings.length; i < len; i++) {
        misspelling = misspellings[i];
        results.push(this.markerLayer.markBufferRange(misspelling, {
          invalidate: 'touch'
        }));
      }
      return results;
    };

    SpellCheckView.prototype.updateMisspellings = function() {
      var error, ref;
      try {
        return this.taskWrapper.start(this.editor.buffer);
      } catch (error1) {
        error = error1;
        return console.warn('Error starting spell check task', (ref = error.stack) != null ? ref : error);
      }
    };

    SpellCheckView.prototype.getCorrections = function(marker) {
      var args, instance, misspelling, projectPath, ref, ref1, ref2, relativePath;
      projectPath = null;
      relativePath = null;
      if ((ref = this.buffer) != null ? (ref1 = ref.file) != null ? ref1.path : void 0 : void 0) {
        ref2 = atom.project.relativizePath(this.buffer.file.path), projectPath = ref2[0], relativePath = ref2[1];
      }
      args = {
        projectPath: projectPath,
        relativePath: relativePath
      };
      instance = this.getInstance();
      misspelling = this.editor.getTextInBufferRange(marker.getBufferRange());
      return instance.suggest(args, misspelling);
    };

    SpellCheckView.prototype.addContextMenuEntries = function(mouseEvent) {
      var commandName, contextMenuEntry, correction, correctionIndex, corrections, currentBufferPosition, currentScreenPosition, i, len, marker;
      this.clearContextMenuEntries();
      currentScreenPosition = atom.views.getView(this.editor).component.screenPositionForMouseEvent(mouseEvent);
      currentBufferPosition = this.editor.bufferPositionForScreenPosition(currentScreenPosition);
      if (marker = this.markerLayer.findMarkers({
        containsBufferPosition: currentBufferPosition
      })[0]) {
        corrections = this.getCorrections(marker);
        if (corrections.length > 0) {
          this.spellCheckModule.contextMenuEntries.push({
            menuItem: atom.contextMenu.add({
              'atom-text-editor': [
                {
                  type: 'separator'
                }
              ]
            })
          });
          correctionIndex = 0;
          for (i = 0, len = corrections.length; i < len; i++) {
            correction = corrections[i];
            contextMenuEntry = {};
            commandName = 'spell-check:correct-misspelling-' + correctionIndex;
            contextMenuEntry.command = (function(_this) {
              return function(correction, contextMenuEntry) {
                return atom.commands.add(atom.views.getView(_this.editor), commandName, function() {
                  _this.makeCorrection(correction, marker);
                  return _this.clearContextMenuEntries();
                });
              };
            })(this)(correction, contextMenuEntry);
            contextMenuEntry.menuItem = atom.contextMenu.add({
              'atom-text-editor': [
                {
                  label: correction.label,
                  command: commandName
                }
              ]
            });
            this.spellCheckModule.contextMenuEntries.push(contextMenuEntry);
            correctionIndex++;
          }
          return this.spellCheckModule.contextMenuEntries.push({
            menuItem: atom.contextMenu.add({
              'atom-text-editor': [
                {
                  type: 'separator'
                }
              ]
            })
          });
        }
      }
    };

    SpellCheckView.prototype.makeCorrection = function(correction, marker) {
      var args, projectPath, ref, ref1, ref2, relativePath;
      if (correction.isSuggestion) {
        this.editor.setSelectedBufferRange(marker.getBufferRange());
        return this.editor.insertText(correction.suggestion);
      } else {
        projectPath = null;
        relativePath = null;
        if ((ref = this.editor.buffer) != null ? (ref1 = ref.file) != null ? ref1.path : void 0 : void 0) {
          ref2 = atom.project.relativizePath(this.editor.buffer.file.path), projectPath = ref2[0], relativePath = ref2[1];
        }
        args = {
          id: this.id,
          projectPath: projectPath,
          relativePath: relativePath
        };
        correction.plugin.add(args, correction);
        return this.updateMisspellings.bind(this)();
      }
    };

    SpellCheckView.prototype.clearContextMenuEntries = function() {
      var entry, i, len, ref, ref1, ref2;
      ref = this.spellCheckModule.contextMenuEntries;
      for (i = 0, len = ref.length; i < len; i++) {
        entry = ref[i];
        if ((ref1 = entry.command) != null) {
          ref1.dispose();
        }
        if ((ref2 = entry.menuItem) != null) {
          ref2.dispose();
        }
      }
      return this.spellCheckModule.contextMenuEntries = [];
    };

    return SpellCheckView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvc3BlbGwtY2hlY2stdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVFQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG9CQUFSOztFQUVqQixlQUFBLEdBQWtCOztFQUVsQixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osY0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtPQUFMO0lBRFE7O0lBR0csd0JBQUMsTUFBRCxFQUFVLElBQVYsRUFBaUIsZ0JBQWpCLEVBQW9DLFdBQXBDO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxtQkFBRDtNQUFtQixJQUFDLENBQUEsY0FBRDs7O01BQy9DLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEscUJBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxXQUFELEdBQW1CLElBQUEsY0FBQSxDQUFlLElBQUMsQ0FBQSxJQUFoQjtNQUVuQixJQUFDLENBQUEseUJBQUQsR0FBNkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsTUFBcEIsQ0FBbEIsRUFBK0MsaUNBQS9DLEVBQWtGLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUM3RyxjQUFBO1VBQUEsSUFBRyxNQUFBLEdBQVMsS0FBQyxDQUFBLFdB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QUFhLFdBRlI7VUFHTCxZQUFBLEVBQWMsWUFIVDs7UUFPUCxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQWxCLENBQXNCLElBQXRCLEVBQTRCLFVBQTVCO2VBR0EsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLElBQXpCLENBQUEsQ0FBQSxFQXBCRjs7SUFEYzs7NkJBdUJoQix1QkFBQSxHQUF5QixTQUFBO0FBQ3ZCLFVBQUE7QUFBQTtBQUFBLFdBQUEscUNBQUE7OztjQUNlLENBQUUsT0FBZixDQUFBOzs7Y0FDYyxDQUFFLE9BQWhCLENBQUE7O0FBRkY7YUFJQSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsa0JBQWxCLEdBQXVDO0lBTGhCOzs7OztBQTdLM0IiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblNwZWxsQ2hlY2tUYXNrID0gcmVxdWlyZSAnLi9zcGVsbC1jaGVjay10YXNrJ1xuXG5Db3JyZWN0aW9uc1ZpZXcgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFNwZWxsQ2hlY2tWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdzcGVsbC1jaGVjaydcblxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEB0YXNrLCBAc3BlbGxDaGVja01vZHVsZSwgQGdldEluc3RhbmNlKSAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGluaXRpYWxpemVNYXJrZXJMYXllcigpXG4gICAgQHRhc2tXcmFwcGVyID0gbmV3IFNwZWxsQ2hlY2tUYXNrIEB0YXNrXG5cbiAgICBAY29ycmVjdE1pc3NwZWxsaW5nQ29tbWFuZCA9IGF0b20uY29tbWFuZHMuYWRkIGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKSwgJ3NwZWxsLWNoZWNrOmNvcnJlY3QtbWlzc3BlbGxpbmcnLCA9PlxuICAgICAgaWYgbWFya2VyID0gQG1hcmtlckxheWVyLmZpbmRNYXJrZXJzKHtjb250YWluc0J1ZmZlclBvc2l0aW9uOiBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCl9KVswXVxuICAgICAgICBDb3JyZWN0aW9uc1ZpZXcgPz0gcmVxdWlyZSAnLi9jb3JyZWN0aW9ucy12aWV3J1xuICAgICAgICBAY29ycmVjdGlvbnNWaWV3Py5kZXN0cm95KClcbiAgICAgICAgQGNvcnJlY3Rpb25zVmlldyA9IG5ldyBDb3JyZWN0aW9uc1ZpZXcoQGVkaXRvciwgQGdldENvcnJlY3Rpb25zKG1hcmtlciksIG1hcmtlciwgdGhpcywgQHVwZGF0ZU1pc3NwZWxsaW5ncylcblxuICAgIGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKS5hZGRFdmVudExpc3RlbmVyICdjb250ZXh0bWVudScsIEBhZGRDb250ZXh0TWVudUVudHJpZXNcblxuICAgIEB0YXNrV3JhcHBlci5vbkRpZFNwZWxsQ2hlY2sgKG1pc3NwZWxsaW5ncykgPT5cbiAgICAgIEBkZXN0cm95TWFya2VycygpXG4gICAgICBAYWRkTWFya2VycyhtaXNzcGVsbGluZ3MpIGlmIEBidWZmZXI/XG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VQYXRoID0+XG4gICAgICBAc3Vic2NyaWJlVG9CdWZmZXIoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hciA9PlxuICAgICAgQHN1YnNjcmliZVRvQnVmZmVyKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2VkaXRvci5mb250U2l6ZScsID0+XG4gICAgICBAc3Vic2NyaWJlVG9CdWZmZXIoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BlbGwtY2hlY2suZ3JhbW1hcnMnLCA9PlxuICAgICAgQHN1YnNjcmliZVRvQnVmZmVyKClcblxuICAgIEBzdWJzY3JpYmVUb0J1ZmZlcigpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgaW5pdGlhbGl6ZU1hcmtlckxheWVyOiAtPlxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoe21haW50YWluSGlzdG9yeTogZmFsc2V9KVxuICAgIEBtYXJrZXJMYXllckRlY29yYXRpb24gPSBAZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIoQG1hcmtlckxheWVyLCB7XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0JyxcbiAgICAgIGNsYXNzOiAnc3BlbGwtY2hlY2stbWlzc3BlbGxpbmcnLFxuICAgICAgZGVwcmVjYXRlZFJlZ2lvbkNsYXNzOiAnbWlzc3BlbGxpbmcnXG4gICAgfSlcblxuICBkZXN0cm95OiAtPlxuICAgIEB1bnN1YnNjcmliZUZyb21CdWZmZXIoKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAdGFza1dyYXBwZXIudGVybWluYXRlKClcbiAgICBAbWFya2VyTGF5ZXIuZGVzdHJveSgpXG4gICAgQG1hcmtlckxheWVyRGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICBAY29ycmVjdE1pc3NwZWxsaW5nQ29tbWFuZC5kaXNwb3NlKClcbiAgICBAY29ycmVjdGlvbnNWaWV3Py5yZW1vdmUoKVxuICAgIEBjbGVhckNvbnRleHRNZW51RW50cmllcygpXG5cbiAgdW5zdWJzY3JpYmVGcm9tQnVmZmVyOiAtPlxuICAgIEBkZXN0cm95TWFya2VycygpXG5cbiAgICBpZiBAYnVmZmVyP1xuICAgICAgQGJ1ZmZlckRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgICBAYnVmZmVyID0gbnVsbFxuXG4gIHN1YnNjcmliZVRvQnVmZmVyOiAtPlxuICAgIEB1bnN1YnNjcmliZUZyb21CdWZmZXIoKVxuXG4gICAgaWYgQHNwZWxsQ2hlY2tDdXJyZW50R3JhbW1hcigpXG4gICAgICBAYnVmZmVyID0gQGVkaXRvci5nZXRCdWZmZXIoKVxuICAgICAgQGJ1ZmZlckRpc3Bvc2FibGUgPSBAYnVmZmVyLm9uRGlkU3RvcENoYW5naW5nID0+IEB1cGRhdGVNaXNzcGVsbGluZ3MoKVxuICAgICAgQHVwZGF0ZU1pc3NwZWxsaW5ncygpXG5cbiAgc3BlbGxDaGVja0N1cnJlbnRHcmFtbWFyOiAtPlxuICAgIGdyYW1tYXIgPSBAZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWVcbiAgICBfLmNvbnRhaW5zKGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2suZ3JhbW1hcnMnKSwgZ3JhbW1hcilcblxuICBkZXN0cm95TWFya2VyczogLT5cbiAgICBAbWFya2VyTGF5ZXIuZGVzdHJveSgpXG4gICAgQG1hcmtlckxheWVyRGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICBAaW5pdGlhbGl6ZU1hcmtlckxheWVyKClcblxuICBhZGRNYXJrZXJzOiAobWlzc3BlbGxpbmdzKSAtPlxuICAgIGZvciBtaXNzcGVsbGluZyBpbiBtaXNzcGVsbGluZ3NcbiAgICAgIEBtYXJrZXJMYXllci5tYXJrQnVmZmVyUmFuZ2UobWlzc3BlbGxpbmcsIHtpbnZhbGlkYXRlOiAndG91Y2gnfSlcblxuICB1cGRhdGVNaXNzcGVsbGluZ3M6IC0+XG4gICAgIyBUYXNrOjpzdGFydCBjYW4gdGhyb3cgZXJyb3JzIGF0b20vYXRvbSMzMzI2XG4gICAgdHJ5XG4gICAgICBAdGFza1dyYXBwZXIuc3RhcnQgQGVkaXRvci5idWZmZXJcbiAgICBjYXRjaCBlcnJvclxuICAgICAgY29uc29sZS53YXJuKCdFcnJvciBzdGFydGluZyBzcGVsbCBjaGVjayB0YXNrJywgZXJyb3Iuc3RhY2sgPyBlcnJvcilcblxuICBnZXRDb3JyZWN0aW9uczogKG1hcmtlcikgLT5cbiAgICAjIEJ1aWxkIHVwIHRoZSBhcmd1bWVudHMgb2JqZWN0IGZvciB0aGlzIGJ1ZmZlciBhbmQgdGV4dC5cbiAgICBwcm9qZWN0UGF0aCA9IG51bGxcbiAgICByZWxhdGl2ZVBhdGggPSBudWxsXG4gICAgaWYgQGJ1ZmZlcj8uZmlsZT8ucGF0aFxuICAgICAgW3Byb2plY3RQYXRoLCByZWxhdGl2ZVBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKEBidWZmZXIuZmlsZS5wYXRoKVxuICAgIGFyZ3MgPSB7XG4gICAgICBwcm9qZWN0UGF0aDogcHJvamVjdFBhdGgsXG4gICAgICByZWxhdGl2ZVBhdGg6IHJlbGF0aXZlUGF0aFxuICAgIH1cblxuICAgICMgR2V0IHRoZSBtaXNzcGVsbGVkIHdvcmQgYW5kIHRoZW4gcmVxdWVzdCBjb3JyZWN0aW9ucy5cbiAgICBpbnN0YW5jZSA9IEBnZXRJbnN0YW5jZSgpXG4gICAgbWlzc3BlbGxpbmcgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlIG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaW5zdGFuY2Uuc3VnZ2VzdCBhcmdzLCBtaXNzcGVsbGluZ1xuXG4gIGFkZENvbnRleHRNZW51RW50cmllczogKG1vdXNlRXZlbnQpID0+XG4gICAgQGNsZWFyQ29udGV4dE1lbnVFbnRyaWVzKClcbiAgICAjIEdldCBidWZmZXIgcG9zaXRpb24gb2YgdGhlIHJpZ2h0IGNsaWNrIGV2ZW50LiBJZiB0aGUgY2xpY2sgaGFwcGVucyBvdXRzaWRlXG4gICAgIyB0aGUgYm91bmRhcmllcyBvZiBhbnkgdGV4dCwgdGhlIG1ldGhvZCBkZWZhdWx0cyB0byB0aGUgYnVmZmVyIHBvc2l0aW9uIG9mXG4gICAgIyB0aGUgbGFzdCBjaGFyYWN0ZXIgaW4gdGhlIGVkaXRvci5cbiAgICBjdXJyZW50U2NyZWVuUG9zaXRpb24gPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcikuY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudCBtb3VzZUV2ZW50XG4gICAgY3VycmVudEJ1ZmZlclBvc2l0aW9uID0gQGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKGN1cnJlbnRTY3JlZW5Qb3NpdGlvbilcblxuICAgICMgQ2hlY2sgdG8gc2VlIGlmIHRoZSBzZWxlY3RlZCB3b3JkIGlzIGluY29ycmVjdC5cbiAgICBpZiBtYXJrZXIgPSBAbWFya2VyTGF5ZXIuZmluZE1hcmtlcnMoe2NvbnRhaW5zQnVmZmVyUG9zaXRpb246IGN1cnJlbnRCdWZmZXJQb3NpdGlvbn0pWzBdXG4gICAgICBjb3JyZWN0aW9ucyA9IEBnZXRDb3JyZWN0aW9ucyhtYXJrZXIpXG4gICAgICBpZiBjb3JyZWN0aW9ucy5sZW5ndGggPiAwXG4gICAgICAgIEBzcGVsbENoZWNrTW9kdWxlLmNvbnRleHRNZW51RW50cmllcy5wdXNoKHtcbiAgICAgICAgICBtZW51SXRlbTogYXRvbS5jb250ZXh0TWVudS5hZGQoeydhdG9tLXRleHQtZWRpdG9yJzogW3t0eXBlOiAnc2VwYXJhdG9yJ31dfSlcbiAgICAgICAgfSlcblxuICAgICAgICBjb3JyZWN0aW9uSW5kZXggPSAwXG4gICAgICAgIGZvciBjb3JyZWN0aW9uIGluIGNvcnJlY3Rpb25zXG4gICAgICAgICAgY29udGV4dE1lbnVFbnRyeSA9IHt9XG4gICAgICAgICAgIyBSZWdpc3RlciBuZXcgY29tbWFuZCBmb3IgY29ycmVjdGlvbi5cbiAgICAgICAgICBjb21tYW5kTmFtZSA9ICdzcGVsbC1jaGVjazpjb3JyZWN0LW1pc3NwZWxsaW5nLScgKyBjb3JyZWN0aW9uSW5kZXhcbiAgICAgICAgICBjb250ZXh0TWVudUVudHJ5LmNvbW1hbmQgPSBkbyAoY29ycmVjdGlvbiwgY29udGV4dE1lbnVFbnRyeSkgPT5cbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuYWRkIGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKSwgY29tbWFuZE5hbWUsID0+XG4gICAgICAgICAgICAgIEBtYWtlQ29ycmVjdGlvbihjb3JyZWN0aW9uLCBtYXJrZXIpXG4gICAgICAgICAgICAgIEBjbGVhckNvbnRleHRNZW51RW50cmllcygpXG5cbiAgICAgICAgICAjIEFkZCBuZXcgbWVudSBpdGVtIGZvciBjb3JyZWN0aW9uLlxuICAgICAgICAgIGNvbnRleHRNZW51RW50cnkubWVudUl0ZW0gPSBhdG9tLmNvbnRleHRNZW51LmFkZCh7XG4gICAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvcic6IFt7bGFiZWw6IGNvcnJlY3Rpb24ubGFiZWwsIGNvbW1hbmQ6IGNvbW1hbmROYW1lfV1cbiAgICAgICAgICB9KVxuICAgICAgICAgIEBzcGVsbENoZWNrTW9kdWxlLmNvbnRleHRNZW51RW50cmllcy5wdXNoIGNvbnRleHRNZW51RW50cnlcbiAgICAgICAgICBjb3JyZWN0aW9uSW5kZXgrK1xuXG4gICAgICAgIEBzcGVsbENoZWNrTW9kdWxlLmNvbnRleHRNZW51RW50cmllcy5wdXNoKHtcbiAgICAgICAgICBtZW51SXRlbTogYXRvbS5jb250ZXh0TWVudS5hZGQoeydhdG9tLXRleHQtZWRpdG9yJzogW3t0eXBlOiAnc2VwYXJhdG9yJ31dfSlcbiAgICAgICAgfSlcblxuICBtYWtlQ29ycmVjdGlvbjogKGNvcnJlY3Rpb24sIG1hcmtlcikgPT5cbiAgICBpZiBjb3JyZWN0aW9uLmlzU3VnZ2VzdGlvblxuICAgICAgIyBVcGRhdGUgdGhlIGJ1ZmZlciB3aXRoIHRoZSBjb3JyZWN0aW9uLlxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpKVxuICAgICAgQGVkaXRvci5pbnNlcnRUZXh0KGNvcnJlY3Rpb24uc3VnZ2VzdGlvbilcbiAgICBlbHNlXG4gICAgICAjIEJ1aWxkIHVwIHRoZSBhcmd1bWVudHMgb2JqZWN0IGZvciB0aGlzIGJ1ZmZlciBhbmQgdGV4dC5cbiAgICAgIHByb2plY3RQYXRoID0gbnVsbFxuICAgICAgcmVsYXRpdmVQYXRoID0gbnVsbFxuICAgICAgaWYgQGVkaXRvci5idWZmZXI/LmZpbGU/LnBhdGhcbiAgICAgICAgW3Byb2plY3RQYXRoLCByZWxhdGl2ZVBhdGhdID0gYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKEBlZGl0b3IuYnVmZmVyLmZpbGUucGF0aClcbiAgICAgIGFyZ3MgPSB7XG4gICAgICAgIGlkOiBAaWQsXG4gICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgcmVsYXRpdmVQYXRoOiByZWxhdGl2ZVBhdGhcbiAgICAgIH1cblxuICAgICAgIyBTZW5kIHRoZSBcImFkZFwiIHJlcXVlc3QgdG8gdGhlIHBsdWdpbi5cbiAgICAgIGNvcnJlY3Rpb24ucGx1Z2luLmFkZCBhcmdzLCBjb3JyZWN0aW9uXG5cbiAgICAgICMgVXBkYXRlIHRoZSBidWZmZXIgdG8gaGFuZGxlIHRoZSBjb3JyZWN0aW9ucy5cbiAgICAgIEB1cGRhdGVNaXNzcGVsbGluZ3MuYmluZCh0aGlzKSgpXG5cbiAgY2xlYXJDb250ZXh0TWVudUVudHJpZXM6IC0+XG4gICAgZm9yIGVudHJ5IGluIEBzcGVsbENoZWNrTW9kdWxlLmNvbnRleHRNZW51RW50cmllc1xuICAgICAgZW50cnkuY29tbWFuZD8uZGlzcG9zZSgpXG4gICAgICBlbnRyeS5tZW51SXRlbT8uZGlzcG9zZSgpXG5cbiAgICBAc3BlbGxDaGVja01vZHVsZS5jb250ZXh0TWVudUVudHJpZXMgPSBbXVxuIl19
