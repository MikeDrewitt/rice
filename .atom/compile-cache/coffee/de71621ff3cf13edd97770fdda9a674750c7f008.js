(function() {
  var CompositeDisposable, GitDiffView, repositoryForPath,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  repositoryForPath = require('./helpers').repositoryForPath;

  module.exports = GitDiffView = (function() {
    function GitDiffView(editor) {
      var editorElement, editorView;
      this.editor = editor;
      this.updateDiffs = bind(this.updateDiffs, this);
      this.subscriptions = new CompositeDisposable();
      this.decorations = {};
      this.markers = [];
      this.subscriptions.add(this.editor.onDidStopChanging(this.updateDiffs));
      this.subscriptions.add(this.editor.onDidChangePath(this.updateDiffs));
      this.subscribeToRepository();
      this.subscriptions.add(atom.project.onDidChangePaths((function(_this) {
        return function() {
          return _this.subscribeToRepository();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          _this.cancelUpdate();
          _this.removeDecorations();
          return _this.subscriptions.dispose();
        };
      })(this)));
      editorView = atom.views.getView(this.editor);
      this.subscriptions.add(atom.commands.add(editorView, 'git-diff:move-to-next-diff', (function(_this) {
        return function() {
          return _this.moveToNextDiff();
        };
      })(this)));
      this.subscriptions.add(atom.commands.add(editorView, 'git-diff:move-to-previous-diff', (function(_this) {
        return function() {
          return _this.moveToPreviousDiff();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('git-diff.showIconsInEditorGutter', (function(_this) {
        return function() {
          return _this.updateIconDecoration();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('editor.showLineNumbers', (function(_this) {
        return function() {
          return _this.updateIconDecoration();
        };
      })(this)));
      editorElement = atom.views.getView(this.editor);
      this.subscriptions.add(editorElement.onDidAttach((function(_this) {
        return function() {
          return _this.updateIconDecoration();
        };
      })(this)));
      this.updateIconDecoration();
      this.scheduleUpdate();
    }

    GitDiffView.prototype.moveToNextDiff = function() {
      var cursorLineNumber, firstDiffLineNumber, i, len, newStart, nextDiffLineNumber, ref, ref1;
      cursorLineNumber = this.editor.getCursorBufferPosition().row + 1;
      nextDiffLineNumber = null;
      firstDiffLineNumber = null;
      ref1 = (ref = this.diffs) != null ? ref : [];
      for (i = 0, len = ref1.length; i < len; i++) {
        newStart = ref1[i].newStart;
        if (newStart > cursorLineNumber) {
          if (nextDiffLineNumber == null) {
            nextDiffLineNumber = newStart - 1;
          }
          nextDiffLineNumber = Math.min(newStart - 1, nextDiffLineNumber);
        }
        if (firstDiffLineNumber == null) {
          firstDiffLineNumber = newStart - 1;
        }
        firstDiffLineNumber = Math.min(newStart - 1, firstDiffLineNumber);
      }
      if (nextDiffLineNumber == null) {
        nextDiffLineNumber = firstDiffLineNumber;
      }
      return this.moveToLineNumber(nextDiffLineNumber);
    };

    GitDiffView.prototype.updateIconDecoration = function() {
      var gutter, ref;
      gutter = (ref = atom.views.getView(this.editor).rootElement) != null ? ref.querySelector('.gutter') : void 0;
      if (atom.config.get('editor.showLineNumbers') && atom.config.get('git-diff.showIconsInEditorGutter')) {
        return gutter != null ? gutter.classList.add('git-diff-icon') : void 0;
      } else {
        return gutter != null ? gutter.classList.remove('git-diff-icon') : void 0;
      }
    };

    GitDiffView.prototype.moveToPreviousDiff = function() {
      var cursorLineNumber, i, lastDiffLineNumber, len, newStart, previousDiffLineNumber, ref, ref1;
      cursorLineNumber = this.editor.getCursorBufferPosition().row + 1;
      previousDiffLineNumber = -1;
      lastDiffLineNumber = -1;
      ref1 = (ref = this.diffs) != null ? ref : [];
      for (i = 0, len = ref1.length; i < len; i++) {
        newStart = ref1[i].newStart;
        if (newStart < cursorLineNumber) {
          previousDiffLineNumber = Math.max(newStart - 1, previousDiffLineNumber);
        }
        lastDiffLineNumber = Math.max(newStart - 1, lastDiffLineNumber);
      }
      if (previousDiffLineNumber === -1) {
        previousDiffLineNumber = lastDiffLineNumber;
      }
      return this.moveToLineNumber(previousDiffLineNumber);
    };

    GitDiffView.prototype.moveToLineNumber = function(lineNumber) {
      if (lineNumber == null) {
        lineNumber = -1;
      }
      if (lineNumber >= 0) {
        this.editor.setCursorBufferPosition([lineNumber, 0]);
        return this.editor.moveToFirstCharacterOfLine();
      }
    };

    GitDiffView.prototype.subscribeToRepository = function() {
      if (this.repository = repositoryForPath(this.editor.getPath())) {
        this.subscriptions.add(this.repository.onDidChangeStatuses((function(_this) {
          return function() {
            return _this.scheduleUpdate();
          };
        })(this)));
        return this.subscriptions.add(this.repository.onDidChangeStatus((function(_this) {
          return function(changedPath) {
            if (changedPath === _this.editor.getPath()) {
              return _this.scheduleUpdate();
            }
          };
        })(this)));
      }
    };

    GitDiffView.prototype.cancelUpdate = function() {
      return clearImmediate(this.immediateId);
    };

    GitDiffView.prototype.scheduleUpdate = function() {
      this.cancelUpdate();
      return this.immediateId = setImmediate(this.updateDiffs);
    };

    GitDiffView.prototype.updateDiffs = function() {
      var path, ref, ref1;
      if (this.editor.isDestroyed()) {
        return;
      }
      this.removeDecorations();
      if (path = (ref = this.editor) != null ? ref.getPath() : void 0) {
        if (this.diffs = (ref1 = this.repository) != null ? ref1.getLineDiffs(path, this.editor.getText()) : void 0) {
          return this.addDecorations(this.diffs);
        }
      }
    };

    GitDiffView.prototype.addDecorations = function(diffs) {
      var endRow, i, len, newLines, newStart, oldLines, ref, startRow;
      for (i = 0, len = diffs.length; i < len; i++) {
        ref = diffs[i], newStart = ref.newStart, oldLines = ref.oldLines, newLines = ref.newLines;
        startRow = newStart - 1;
        endRow = newStart + newLines - 1;
        if (oldLines === 0 && newLines > 0) {
          this.markRange(startRow, endRow, 'git-line-added');
        } else if (newLines === 0 && oldLines > 0) {
          this.markRange(startRow, startRow, 'git-line-removed');
        } else {
          this.markRange(startRow, endRow, 'git-line-modified');
        }
      }
    };

    GitDiffView.prototype.removeDecorations = function() {
      var i, len, marker, ref;
      ref = this.markers;
      for (i = 0, len = ref.length; i < len; i++) {
        marker = ref[i];
        marker.destroy();
      }
      return this.markers = [];
    };

    GitDiffView.prototype.markRange = function(startRow, endRow, klass) {
      var marker;
      marker = this.editor.markBufferRange([[startRow, 0], [endRow, 0]], {
        invalidate: 'never'
      });
      this.editor.decorateMarker(marker, {
        type: 'line-number',
        "class": klass
      });
      return this.markers.push(marker);
    };

    return GitDiffView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9naXQtZGlmZi9saWIvZ2l0LWRpZmYtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1EQUFBO0lBQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN2QixvQkFBcUIsT0FBQSxDQUFRLFdBQVI7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxxQkFBQyxNQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxTQUFEOztNQUNaLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsbUJBQUEsQ0FBQTtNQUNyQixJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUVYLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLElBQUMsQ0FBQSxXQUEzQixDQUFuQjtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsSUFBQyxDQUFBLFdBQXpCLENBQW5CO01BRUEsSUFBQyxDQUFBLHFCQUFELENBQUE7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBYixDQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLHFCQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUIsQ0FBbkI7TUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN0QyxL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QTFIYiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57cmVwb3NpdG9yeUZvclBhdGh9ID0gcmVxdWlyZSAnLi9oZWxwZXJzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHaXREaWZmVmlld1xuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGRlY29yYXRpb25zID0ge31cbiAgICBAbWFya2VycyA9IFtdXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoQGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhAdXBkYXRlRGlmZnMpKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aChAdXBkYXRlRGlmZnMpKVxuXG4gICAgQHN1YnNjcmliZVRvUmVwb3NpdG9yeSgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzID0+IEBzdWJzY3JpYmVUb1JlcG9zaXRvcnkoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWREZXN0cm95ID0+XG4gICAgICBAY2FuY2VsVXBkYXRlKClcbiAgICAgIEByZW1vdmVEZWNvcmF0aW9ucygpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICAgIGVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBlZGl0b3JWaWV3LCAnZ2l0LWRpZmY6bW92ZS10by1uZXh0LWRpZmYnLCA9PlxuICAgICAgQG1vdmVUb05leHREaWZmKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgZWRpdG9yVmlldywgJ2dpdC1kaWZmOm1vdmUtdG8tcHJldmlvdXMtZGlmZicsID0+XG4gICAgICBAbW92ZVRvUHJldmlvdXNEaWZmKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZ2l0LWRpZmYuc2hvd0ljb25zSW5FZGl0b3JHdXR0ZXInLCA9PlxuICAgICAgQHVwZGF0ZUljb25EZWNvcmF0aW9uKClcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLnNob3dMaW5lTnVtYmVycycsID0+XG4gICAgICBAdXBkYXRlSWNvbkRlY29yYXRpb24oKVxuXG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JFbGVtZW50Lm9uRGlkQXR0YWNoID0+XG4gICAgICBAdXBkYXRlSWNvbkRlY29yYXRpb24oKVxuXG4gICAgQHVwZGF0ZUljb25EZWNvcmF0aW9uKClcbiAgICBAc2NoZWR1bGVVcGRhdGUoKVxuXG4gIG1vdmVUb05leHREaWZmOiAtPlxuICAgIGN1cnNvckxpbmVOdW1iZXIgPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ICsgMVxuICAgIG5leHREaWZmTGluZU51bWJlciA9IG51bGxcbiAgICBmaXJzdERpZmZMaW5lTnVtYmVyID0gbnVsbFxuICAgIGZvciB7bmV3U3RhcnR9IGluIEBkaWZmcyA/IFtdXG4gICAgICBpZiBuZXdTdGFydCA+IGN1cnNvckxpbmVOdW1iZXJcbiAgICAgICAgbmV4dERpZmZMaW5lTnVtYmVyID89IG5ld1N0YXJ0IC0gMVxuICAgICAgICBuZXh0RGlmZkxpbmVOdW1iZXIgPSBNYXRoLm1pbihuZXdTdGFydCAtIDEsIG5leHREaWZmTGluZU51bWJlcilcblxuICAgICAgZmlyc3REaWZmTGluZU51bWJlciA/PSBuZXdTdGFydCAtIDFcbiAgICAgIGZpcnN0RGlmZkxpbmVOdW1iZXIgPSBNYXRoLm1pbihuZXdTdGFydCAtIDEsIGZpcnN0RGlmZkxpbmVOdW1iZXIpXG5cbiAgICAjIFdyYXAgYXJvdW5kIHRvIHRoZSBmaXJzdCBkaWZmIGluIHRoZSBmaWxlXG4gICAgbmV4dERpZmZMaW5lTnVtYmVyID0gZmlyc3REaWZmTGluZU51bWJlciB1bmxlc3MgbmV4dERpZmZMaW5lTnVtYmVyP1xuXG4gICAgQG1vdmVUb0xpbmVOdW1iZXIobmV4dERpZmZMaW5lTnVtYmVyKVxuXG4gIHVwZGF0ZUljb25EZWNvcmF0aW9uOiAtPlxuICAgIGd1dHRlciA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKS5yb290RWxlbWVudD8ucXVlcnlTZWxlY3RvcignLmd1dHRlcicpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iuc2hvd0xpbmVOdW1iZXJzJykgYW5kIGF0b20uY29uZmlnLmdldCgnZ2l0LWRpZmYuc2hvd0ljb25zSW5FZGl0b3JHdXR0ZXInKVxuICAgICAgZ3V0dGVyPy5jbGFzc0xpc3QuYWRkKCdnaXQtZGlmZi1pY29uJylcbiAgICBlbHNlXG4gICAgICBndXR0ZXI/LmNsYXNzTGlzdC5yZW1vdmUoJ2dpdC1kaWZmLWljb24nKVxuXG4gIG1vdmVUb1ByZXZpb3VzRGlmZjogLT5cbiAgICBjdXJzb3JMaW5lTnVtYmVyID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyArIDFcbiAgICBwcmV2aW91c0RpZmZMaW5lTnVtYmVyID0gLTFcbiAgICBsYXN0RGlmZkxpbmVOdW1iZXIgPSAtMVxuICAgIGZvciB7bmV3U3RhcnR9IGluIEBkaWZmcyA/IFtdXG4gICAgICBpZiBuZXdTdGFydCA8IGN1cnNvckxpbmVOdW1iZXJcbiAgICAgICAgcHJldmlvdXNEaWZmTGluZU51bWJlciA9IE1hdGgubWF4KG5ld1N0YXJ0IC0gMSwgcHJldmlvdXNEaWZmTGluZU51bWJlcilcbiAgICAgIGxhc3REaWZmTGluZU51bWJlciA9IE1hdGgubWF4KG5ld1N0YXJ0IC0gMSwgbGFzdERpZmZMaW5lTnVtYmVyKVxuXG4gICAgIyBXcmFwIGFyb3VuZCB0byB0aGUgbGFzdCBkaWZmIGluIHRoZSBmaWxlXG4gICAgcHJldmlvdXNEaWZmTGluZU51bWJlciA9IGxhc3REaWZmTGluZU51bWJlciBpZiBwcmV2aW91c0RpZmZMaW5lTnVtYmVyIGlzIC0xXG5cbiAgICBAbW92ZVRvTGluZU51bWJlcihwcmV2aW91c0RpZmZMaW5lTnVtYmVyKVxuXG4gIG1vdmVUb0xpbmVOdW1iZXI6IChsaW5lTnVtYmVyPS0xKSAtPlxuICAgIGlmIGxpbmVOdW1iZXIgPj0gMFxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbbGluZU51bWJlciwgMF0pXG4gICAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcblxuICBzdWJzY3JpYmVUb1JlcG9zaXRvcnk6IC0+XG4gICAgaWYgQHJlcG9zaXRvcnkgPSByZXBvc2l0b3J5Rm9yUGF0aChAZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAcmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzID0+XG4gICAgICAgIEBzY2hlZHVsZVVwZGF0ZSgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHJlcG9zaXRvcnkub25EaWRDaGFuZ2VTdGF0dXMgKGNoYW5nZWRQYXRoKSA9PlxuICAgICAgICBAc2NoZWR1bGVVcGRhdGUoKSBpZiBjaGFuZ2VkUGF0aCBpcyBAZWRpdG9yLmdldFBhdGgoKVxuXG4gIGNhbmNlbFVwZGF0ZTogLT5cbiAgICBjbGVhckltbWVkaWF0ZShAaW1tZWRpYXRlSWQpXG5cbiAgc2NoZWR1bGVVcGRhdGU6IC0+XG4gICAgQGNhbmNlbFVwZGF0ZSgpXG4gICAgQGltbWVkaWF0ZUlkID0gc2V0SW1tZWRpYXRlKEB1cGRhdGVEaWZmcylcblxuICB1cGRhdGVEaWZmczogPT5cbiAgICByZXR1cm4gaWYgQGVkaXRvci5pc0Rlc3Ryb3llZCgpXG5cbiAgICBAcmVtb3ZlRGVjb3JhdGlvbnMoKVxuICAgIGlmIHBhdGggPSBAZWRpdG9yPy5nZXRQYXRoKClcbiAgICAgIGlmIEBkaWZmcyA9IEByZXBvc2l0b3J5Py5nZXRMaW5lRGlmZnMocGF0aCwgQGVkaXRvci5nZXRUZXh0KCkpXG4gICAgICAgIEBhZGREZWNvcmF0aW9ucyhAZGlmZnMpXG5cbiAgYWRkRGVjb3JhdGlvbnM6IChkaWZmcykgLT5cbiAgICBmb3Ige25ld1N0YXJ0LCBvbGRMaW5lcywgbmV3TGluZXN9IGluIGRpZmZzXG4gICAgICBzdGFydFJvdyA9IG5ld1N0YXJ0IC0gMVxuICAgICAgZW5kUm93ID0gbmV3U3RhcnQgKyBuZXdMaW5lcyAtIDFcbiAgICAgIGlmIG9sZExpbmVzIGlzIDAgYW5kIG5ld0xpbmVzID4gMFxuICAgICAgICBAbWFya1JhbmdlKHN0YXJ0Um93LCBlbmRSb3csICdnaXQtbGluZS1hZGRlZCcpXG4gICAgICBlbHNlIGlmIG5ld0xpbmVzIGlzIDAgYW5kIG9sZExpbmVzID4gMFxuICAgICAgICBAbWFya1JhbmdlKHN0YXJ0Um93LCBzdGFydFJvdywgJ2dpdC1saW5lLXJlbW92ZWQnKVxuICAgICAgZWxzZVxuICAgICAgICBAbWFya1JhbmdlKHN0YXJ0Um93LCBlbmRSb3csICdnaXQtbGluZS1tb2RpZmllZCcpXG4gICAgcmV0dXJuXG5cbiAgcmVtb3ZlRGVjb3JhdGlvbnM6IC0+XG4gICAgbWFya2VyLmRlc3Ryb3koKSBmb3IgbWFya2VyIGluIEBtYXJrZXJzXG4gICAgQG1hcmtlcnMgPSBbXVxuXG4gIG1hcmtSYW5nZTogKHN0YXJ0Um93LCBlbmRSb3csIGtsYXNzKSAtPlxuICAgIG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlKFtbc3RhcnRSb3csIDBdLCBbZW5kUm93LCAwXV0sIGludmFsaWRhdGU6ICduZXZlcicpXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHR5cGU6ICdsaW5lLW51bWJlcicsIGNsYXNzOiBrbGFzcylcbiAgICBAbWFya2Vycy5wdXNoKG1hcmtlcilcbiJdfQ==
