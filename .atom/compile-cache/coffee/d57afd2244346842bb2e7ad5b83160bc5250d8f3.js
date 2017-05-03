(function() {
  var CompositeDisposable, SnippetExpansion;

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = SnippetExpansion = (function() {
    SnippetExpansion.prototype.settingTabStop = false;

    function SnippetExpansion(snippet1, editor, cursor, snippets) {
      var startPosition;
      this.snippet = snippet1;
      this.editor = editor;
      this.cursor = cursor;
      this.snippets = snippets;
      this.subscriptions = new CompositeDisposable;
      this.tabStopMarkers = [];
      this.selections = [this.cursor.selection];
      startPosition = this.cursor.selection.getBufferRange().start;
      this.editor.transact((function(_this) {
        return function() {
          var newRange;
          newRange = _this.editor.transact(function() {
            return _this.cursor.selection.insertText(_this.snippet.body, {
              autoIndent: false
            });
          });
          if (_this.snippet.tabStops.length > 0) {
            _this.subscriptions.add(_this.cursor.onDidChangePosition(function(event) {
              return _this.cursorMoved(event);
            }));
            _this.subscriptions.add(_this.cursor.onDidDestroy(function() {
              return _this.cursorDestroyed();
            }));
            _this.placeTabStopMarkers(startPosition, _this.snippet.tabStops);
            _this.snippets.addExpansion(_this.editor, _this);
            _this.editor.normalizeTabsInBufferRange(newRange);
          }
          if (_this.snippet.lineCount > 1) {
            return _this.indentSubsequentLines(startPosition.row, _this.snippet);
          }
        };
      })(this));
    }

    SnippetExpansion.prototype.cursorMoved = function(arg) {
      var newBufferPosition, oldBufferPosition, textChanged;
      oldBufferPosition = arg.oldBufferPosition, newBufferPosition = arg.newBufferPosition, textChanged = arg.textChanged;
      if (this.settingTabStop || textChanged) {
        return;
      }
      if (!this.tabStopMarkers[this.tabStopIndex].some(function(marker) {
        return marker.getBufferRange().containsPoint(newBufferPosition);
      })) {
        return this.destroy();
      }
    };

    SnippetExpansion.prototype.cursorDestroyed = function() {
      if (!this.settingTabStop) {
        return this.destroy();
      }
    };

    SnippetExpansion.prototype.placeTabStopMarkers = function(startPosition, tabStopRanges) {
      var j, len, ranges;
      for (j = 0, len = tabStopRanges.length; j < len; j++) {
        ranges = tabStopRanges[j];
        this.tabStopMarkers.push(ranges.map((function(_this) {
          return function(arg) {
            var end, start;
            start = arg.start, end = arg.end;
            return _this.editor.markBufferRange([startPosition.traverse(start), startPosition.traverse(end)]);
          };
        })(this)));
      }
      return this.setTabStopIndex(0);
    };

    SnippetExpansion.prototype.indentSubsequentLines = function(startRow, snippet) {
      var initialIndent, j, ref, ref1, results, row;
      initialIndent = this.editor.lineTextForBufferRow(startRow).match(/^\s*/)[0];
      results = [];
      for (row = j = ref = startRow + 1, ref1 = startRow + snippet.lineCount; ref <= ref1 ? j < ref1 : j > ref1; row = ref <= ref1 ? ++j : --j) {
        results.push(this.editor.buffer.insert([row, 0], initialIndent));
      }
      return results;
    };

    SnippetExpansion.prototype.goToNextTabStop = function() {
      var nextIndex;
      nextIndex = this.tabStopIndex + 1;
      if (nextIndex < this.tabStopMarkers.length) {
        if (this.setTabStopIndex(nextIndex)) {
          return true;
        } else {
          return this.goToNextTabStop();
        }
      } else {
        this.destroy();
        return false;
      }
    };

    SnippetExpansion.prototype.goToPreviousTabStop = function() {
      if (this.tabStopIndex > 0) {
        return this.setTabStopIndex(this.tabStopIndex - 1);
      }
    };

    SnippetExpansion.prototype.setTabStopIndex = function(tabStopIndex) {
      var i, j, k, l, len, len1, len2, marker, markerSelected, newSelection, range, ranges, ref, ref1, selection;
      this.tabStopIndex = tabStopIndex;
      this.settingTabStop = true;
      markerSelected = false;
      ranges = [];
      ref = this.tabStopMarkers[this.tabStopIndex];
      for (j = 0, len = ref.length; j < len; j++) {
        marker = ref[j];
        if (marker.isValid()) {
          ranges.push(marker.getBufferRange());
        }
      }
      if (ranges.length > 0) {
        ref1 = this.selections.slice(ranges.length);
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          selection = ref1[k];
          selection.destroy();
        }
        this.selections = this.selections.slice(0, ranges.length);
        for (i = l = 0, len2 = ranges.length; l < len2; i = ++l) {
          range = ranges[i];
          if (this.selections[i]) {
            this.selections[i].setBufferRange(range);
          } else {
            newSelection = this.editor.addSelectionForBufferRange(range);
            this.subscriptions.add(newSelection.cursor.onDidChangePosition((function(_this) {
              return function(event) {
                return _this.cursorMoved(event);
              };
            })(this)));
            this.subscriptions.add(newSelection.cursor.onDidDestroy((function(_this) {
              return function() {
                return _this.cursorDestroyed();
              };
            })(this)));
            this.selections.push(newSelection);
          }
        }
        markerSelected = true;
      }
      this.settingTabStop = false;
      return markerSelected;
    };

    SnippetExpansion.prototype.destroy = function() {
      var j, k, len, len1, marker, markers, ref;
      this.subscriptions.dispose();
      ref = this.tabStopMarkers;
      for (j = 0, len = ref.length; j < len; j++) {
        markers = ref[j];
        for (k = 0, len1 = markers.length; k < len1; k++) {
          marker = markers[k];
          marker.destroy();
        }
      }
      this.tabStopMarkers = [];
      return this.snippets.clearExpansions(this.editor);
    };

    SnippetExpansion.prototype.restore = function(editor) {
      this.editor = editor;
      return this.snippets.addExpansion(this.editor, this);
    };

    return SnippetExpansion;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zbmlwcGV0cy9saWIvc25pcHBldC1leHBhbnNpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007K0JBQ0osY0FBQSxHQUFnQjs7SUFFSCwwQkFBQyxRQUFELEVBQVcsTUFBWCxFQUFvQixNQUFwQixFQUE2QixRQUE3QjtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsVUFBRDtNQUFVLElBQUMsQ0FBQSxTQUFEO01BQVMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsV0FBRDtNQUN4QyxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxjQUFELEdBQWtCO01BQ2xCLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVQ7TUFFZCxhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWxCLENBQUEsQ0FBa0MsQ0FBQztNQUVuRCxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2YsY0FBQTtVQUFBLFFBQUEsR0FBVyxLQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsU0FBQTttQkFDMUIsS0FBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBbEIsQ0FBNkIsS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUF0QyxFQUE0QztjQUFBLFVBQUEsRUFBWSxLQUFaO2FBQTVDO1VBRDBCLENBQWpCO1VBRVgsSUFBRyxLQUFDLENBQUEsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFsQixHQUEyQixDQUE5QjtZ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QUFBLENBQUEsSUFBQSxDQUF4QyxDQUFuQjtZQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixZQUFZLENBQUMsTUFBTSxDQUFDLFlBQXBCLENBQWlDLENBQUEsU0FBQSxLQUFBO3FCQUFBLFNBQUE7dUJBQUcsS0FBQyxDQUFBLGVBQUQsQ0FBQTtjQUFIO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQyxDQUFuQjtZQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixZQUFqQixFQU5GOztBQURGO1FBUUEsY0FBQSxHQUFpQixLQVhuQjs7TUFhQSxJQUFDLENBQUEsY0FBRCxHQUFrQjthQUNsQjtJQXRCZTs7K0JBd0JqQixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtBQUNBO0FBQUEsV0FBQSxxQ0FBQTs7QUFDRSxhQUFBLDJDQUFBOztVQUFBLE1BQU0sQ0FBQyxPQUFQLENBQUE7QUFBQTtBQURGO01BRUEsSUFBQyxDQUFBLGNBQUQsR0FBa0I7YUFDbEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxlQUFWLENBQTBCLElBQUMsQ0FBQSxNQUEzQjtJQUxPOzsrQkFPVCxPQUFBLEdBQVMsU0FBQyxNQUFEO01BQUMsSUFBQyxDQUFBLFNBQUQ7YUFDUixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE1BQXhCLEVBQWdDLElBQWhDO0lBRE87Ozs7O0FBdkZYIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU25pcHBldEV4cGFuc2lvblxuICBzZXR0aW5nVGFiU3RvcDogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKEBzbmlwcGV0LCBAZWRpdG9yLCBAY3Vyc29yLCBAc25pcHBldHMpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEB0YWJTdG9wTWFya2VycyA9IFtdXG4gICAgQHNlbGVjdGlvbnMgPSBbQGN1cnNvci5zZWxlY3Rpb25dXG5cbiAgICBzdGFydFBvc2l0aW9uID0gQGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgbmV3UmFuZ2UgPSBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmluc2VydFRleHQoQHNuaXBwZXQuYm9keSwgYXV0b0luZGVudDogZmFsc2UpXG4gICAgICBpZiBAc25pcHBldC50YWJTdG9wcy5sZW5ndGggPiAwXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY3Vyc29yLm9uRGlkQ2hhbmdlUG9zaXRpb24gKGV2ZW50KSA9PiBAY3Vyc29yTW92ZWQoZXZlbnQpXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY3Vyc29yLm9uRGlkRGVzdHJveSA9PiBAY3Vyc29yRGVzdHJveWVkKClcbiAgICAgICAgQHBsYWNlVGFiU3RvcE1hcmtlcnMoc3RhcnRQb3NpdGlvbiwgQHNuaXBwZXQudGFiU3RvcHMpXG4gICAgICAgIEBzbmlwcGV0cy5hZGRFeHBhbnNpb24oQGVkaXRvciwgdGhpcylcbiAgICAgICAgQGVkaXRvci5ub3JtYWxpemVUYWJzSW5CdWZmZXJSYW5nZShuZXdSYW5nZSlcbiAgICAgIEBpbmRlbnRTdWJzZXF1ZW50TGluZXMoc3RhcnRQb3NpdGlvbi5yb3csIEBzbmlwcGV0KSBpZiBAc25pcHBldC5saW5lQ291bnQgPiAxXG5cbiAgY3Vyc29yTW92ZWQ6ICh7b2xkQnVmZmVyUG9zaXRpb24sIG5ld0J1ZmZlclBvc2l0aW9uLCB0ZXh0Q2hhbmdlZH0pIC0+XG4gICAgcmV0dXJuIGlmIEBzZXR0aW5nVGFiU3RvcCBvciB0ZXh0Q2hhbmdlZFxuICAgIEBkZXN0cm95KCkgdW5sZXNzIEB0YWJTdG9wTWFya2Vyc1tAdGFiU3RvcEluZGV4XS5zb21lIChtYXJrZXIpIC0+XG4gICAgICBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5jb250YWluc1BvaW50KG5ld0J1ZmZlclBvc2l0aW9uKVxuXG4gIGN1cnNvckRlc3Ryb3llZDogLT4gQGRlc3Ryb3koKSB1bmxlc3MgQHNldHRpbmdUYWJTdG9wXG5cbiAgcGxhY2VUYWJTdG9wTWFya2VyczogKHN0YXJ0UG9zaXRpb24sIHRhYlN0b3BSYW5nZXMpIC0+XG4gICAgZm9yIHJhbmdlcyBpbiB0YWJTdG9wUmFuZ2VzXG4gICAgICBAdGFiU3RvcE1hcmtlcnMucHVzaCByYW5nZXMubWFwICh7c3RhcnQsIGVuZH0pID0+XG4gICAgICAgIEBlZGl0b3IubWFya0J1ZmZlclJhbmdlKFtzdGFydFBvc2l0aW9uLnRyYXZlcnNlKHN0YXJ0KSwgc3RhcnRQb3NpdGlvbi50cmF2ZXJzZShlbmQpXSlcbiAgICBAc2V0VGFiU3RvcEluZGV4KDApXG5cbiAgaW5kZW50U3Vic2VxdWVudExpbmVzOiAoc3RhcnRSb3csIHNuaXBwZXQpIC0+XG4gICAgaW5pdGlhbEluZGVudCA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coc3RhcnRSb3cpLm1hdGNoKC9eXFxzKi8pWzBdXG4gICAgZm9yIHJvdyBpbiBbc3RhcnRSb3cgKyAxLi4uc3RhcnRSb3cgKyBzbmlwcGV0LmxpbmVDb3VudF1cbiAgICAgIEBlZGl0b3IuYnVmZmVyLmluc2VydChbcm93LCAwXSwgaW5pdGlhbEluZGVudClcblxuICBnb1RvTmV4dFRhYlN0b3A6IC0+XG4gICAgbmV4dEluZGV4ID0gQHRhYlN0b3BJbmRleCArIDFcbiAgICBpZiBuZXh0SW5kZXggPCBAdGFiU3RvcE1hcmtlcnMubGVuZ3RoXG4gICAgICBpZiBAc2V0VGFiU3RvcEluZGV4KG5leHRJbmRleClcbiAgICAgICAgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBAZ29Ub05leHRUYWJTdG9wKClcbiAgICBlbHNlXG4gICAgICBAZGVzdHJveSgpXG4gICAgICBmYWxzZVxuXG4gIGdvVG9QcmV2aW91c1RhYlN0b3A6IC0+XG4gICAgQHNldFRhYlN0b3BJbmRleChAdGFiU3RvcEluZGV4IC0gMSkgaWYgQHRhYlN0b3BJbmRleCA+IDBcblxuICBzZXRUYWJTdG9wSW5kZXg6IChAdGFiU3RvcEluZGV4KSAtPlxuICAgIEBzZXR0aW5nVGFiU3RvcCA9IHRydWVcbiAgICBtYXJrZXJTZWxlY3RlZCA9IGZhbHNlXG5cbiAgICByYW5nZXMgPSBbXVxuICAgIGZvciBtYXJrZXIgaW4gQHRhYlN0b3BNYXJrZXJzW0B0YWJTdG9wSW5kZXhdIHdoZW4gbWFya2VyLmlzVmFsaWQoKVxuICAgICAgcmFuZ2VzLnB1c2gobWFya2VyLmdldEJ1ZmZlclJhbmdlKCkpXG5cbiAgICBpZiByYW5nZXMubGVuZ3RoID4gMFxuICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKSBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zW3Jhbmdlcy5sZW5ndGguLi5dXG4gICAgICBAc2VsZWN0aW9ucyA9IEBzZWxlY3Rpb25zWy4uLnJhbmdlcy5sZW5ndGhdXG4gICAgICBmb3IgcmFuZ2UsIGkgaW4gcmFuZ2VzXG4gICAgICAgIGlmIEBzZWxlY3Rpb25zW2ldXG4gICAgICAgICAgQHNlbGVjdGlvbnNbaV0uc2V0QnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBuZXdTZWxlY3Rpb24gPSBAZWRpdG9yLmFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXdTZWxlY3Rpb24uY3Vyc29yLm9uRGlkQ2hhbmdlUG9zaXRpb24gKGV2ZW50KSA9PiBAY3Vyc29yTW92ZWQoZXZlbnQpXG4gICAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIG5ld1NlbGVjdGlvbi5jdXJzb3Iub25EaWREZXN0cm95ID0+IEBjdXJzb3JEZXN0cm95ZWQoKVxuICAgICAgICAgIEBzZWxlY3Rpb25zLnB1c2ggbmV3U2VsZWN0aW9uXG4gICAgICBtYXJrZXJTZWxlY3RlZCA9IHRydWVcblxuICAgIEBzZXR0aW5nVGFiU3RvcCA9IGZhbHNlXG4gICAgbWFya2VyU2VsZWN0ZWRcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIGZvciBtYXJrZXJzIGluIEB0YWJTdG9wTWFya2Vyc1xuICAgICAgbWFya2VyLmRlc3Ryb3koKSBmb3IgbWFya2VyIGluIG1hcmtlcnNcbiAgICBAdGFiU3RvcE1hcmtlcnMgPSBbXVxuICAgIEBzbmlwcGV0cy5jbGVhckV4cGFuc2lvbnMoQGVkaXRvcilcblxuICByZXN0b3JlOiAoQGVkaXRvcikgLT5cbiAgICBAc25pcHBldHMuYWRkRXhwYW5zaW9uKEBlZGl0b3IsIHRoaXMpXG4iXX0=
