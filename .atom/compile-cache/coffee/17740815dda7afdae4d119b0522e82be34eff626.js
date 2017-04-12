(function() {
  var CompositeDisposable, Emitter, SearchModel, getIndex, getVisibleBufferRange, highlightRange, ref, ref1, scanInRanges, settings, smartScrollToBufferPosition;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('./utils'), highlightRange = ref1.highlightRange, scanInRanges = ref1.scanInRanges, getVisibleBufferRange = ref1.getVisibleBufferRange, smartScrollToBufferPosition = ref1.smartScrollToBufferPosition, getIndex = ref1.getIndex;

  settings = require('./settings');

  module.exports = SearchModel = (function() {
    var flashMarker;

    SearchModel.prototype.relativeIndex = 0;

    SearchModel.prototype.onDidChangeCurrentMatch = function(fn) {
      return this.emitter.on('did-change-current-match', fn);
    };

    function SearchModel(vimState, options1) {
      var ref2;
      this.vimState = vimState;
      this.options = options1;
      this.emitter = new Emitter;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.editorElement.onDidChangeScrollTop(this.updateView.bind(this)));
      this.disposables.add(this.editorElement.onDidChangeScrollLeft(this.updateView.bind(this)));
      this.markerLayer = this.editor.addMarkerLayer();
      this.onDidChangeCurrentMatch((function(_this) {
        return function() {
          var hoverOptions;
          if (_this.options.incrementalSearch) {
            _this.updateView();
          }
          _this.vimState.hoverSearchCounter.reset();
          if (_this.currentMatch == null) {
            if (settings.get('flashScreenOnSearchHasNoMatch')) {
              _this.flashScreen();
            }
            return;
          }
          if (settings.get('showHoverSearchCounter')) {
            hoverOptions = {
              text: (_this.currentMatchIndex + 1) + "/" + _this.matches.length,
              classList: _this.classNamesForRange(_this.currentMatch)
            };
            if (!_this.options.incrementalSearch) {
              hoverOptions.timeout = settings.get('showHoverSearchCounterDuration');
            }
            _this.vimState.hoverSearchCounter.withTimeout(_this.currentMatch.start, hoverOptions);
          }
          _this.editor.unfoldBufferRow(_this.currentMatch.start.row);
          smartScrollToBufferPosition(_this.editor, _this.currentMatch.start);
          if (settings.get('flashOnSearch')) {
            return _this.flashRange(_this.currentMatch);
          }
        };
      })(this));
    }

    flashMarker = null;

    SearchModel.prototype.flashRange = function(range) {
      if (flashMarker != null) {
        flashMarker.destroy();
      }
      return flashMarker = highlightRange(this.editor, range, {
        "class": 'vim-mode-plus-flash',
        timeout: settings.get('flashOnSearchDuration')
      });
    };

    SearchModel.prototype.destroy = function() {
      this.markerLayer.destroy();
      return this.disposables.dispose();
    };

    SearchModel.prototype.clearMarkers = function() {
      var i, len, marker, ref2, results;
      ref2 = this.markerLayer.getMarkers();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        marker = ref2[i];
        results.push(marker.destroy());
      }
      return results;
    };

    SearchModel.prototype.classNamesForRange = function(range) {
      var classNames;
      classNames = [];
      if (range === this.firstMatch) {
        classNames.push('first');
      } else if (range === this.lastMatch) {
        classNames.push('last');
      }
      if (range === this.currentMatch) {
        classNames.push('current');
      }
      return classNames;
    };

    SearchModel.prototype.updateView = function() {
      var i, len, range, ref2, results;
      this.clearMarkers();
      ref2 = this.getVisibleMatchRanges();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        range = ref2[i];
        results.push(this.decorateRange(range));
      }
      return results;
    };

    SearchModel.prototype.getVisibleMatchRanges = function() {
      var visibleMatchRanges, visibleRange;
      visibleRange = getVisibleBufferRange(this.editor);
      return visibleMatchRanges = this.matches.filter(function(range) {
        return range.intersectsWith(visibleRange);
      });
    };

    SearchModel.prototype.decorateRange = function(range) {
      var classNames, ref2;
      classNames = this.classNamesForRange(range);
      classNames = (ref2 = ['vim-mode-plus-search-match']).concat.apply(ref2, classNames);
      return this.editor.decorateMarker(this.markerLayer.markBufferRange(range), {
        type: 'highlight',
        "class": classNames.join(' ')
      });
    };

    SearchModel.prototype.search = function(fromPoint, pattern, relativeIndex) {
      var currentMatch, i, j, len, range, ref2, ref3, ref4;
      this.pattern = pattern;
      this.matches = [];
      this.editor.scan(this.pattern, (function(_this) {
        return function(arg) {
          var range;
          range = arg.range;
          return _this.matches.push(range);
        };
      })(this));
      ref2 = this.matches, this.firstMatch = ref2[0], this.lastMatch = ref2[ref2.length - 1];
      currentMatch = null;
      if (relativeIndex >= 0) {
        ref3 = this.matches;
        for (i = 0, len = ref3.length; i < len; i++) {
          range = ref3[i];
          if (!(range.start.isGreaterThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.firstMatch;
        }
        relativeIndex--;
      } else {
        ref4 = this.matches;
        for (j = ref4.length - 1; j >= 0; j += -1) {
          range = ref4[j];
          if (!(range.start.isLessThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.lastMatch;
        }
        relativeIndex++;
      }
      this.currentMatchIndex = this.matches.indexOf(currentMatch);
      this.updateCurrentMatch(relativeIndex);
      this.initialCurrentMatchIndex = this.currentMatchIndex;
      return this.currentMatch;
    };

    SearchModel.prototype.updateCurrentMatch = function(relativeIndex) {
      this.currentMatchIndex = getIndex(this.currentMatchIndex + relativeIndex, this.matches);
      this.currentMatch = this.matches[this.currentMatchIndex];
      return this.emitter.emit('did-change-current-match');
    };

    SearchModel.prototype.getRelativeIndex = function() {
      return this.currentMatchIndex - this.initialCurrentMatchIndex;
    };

    SearchModel.prototype.flashScreen = function() {
      var options;
      options = {
        "class": 'vim-mode-plus-flash',
        timeout: 100
      };
      highlightRange(this.editor, getVisibleBufferRange(this.editor), options);
      return atom.beep();
    };

    return SearchModel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWFyY2gtbW9kZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1YsT0FNSSxPQUFBLENBQVEsU0FBUixDQU5KLEVBQ0Usb0NBREYsRUFFRSxnQ0FGRixFQUdFLGtEQUhGLEVBSUUsOERBSkYsRUFLRTs7RUFFRixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNKLFFBQUE7OzBCQUFBLGFBQUEsR0FBZTs7MEJBQ2YsdUJBQUEsR0FBeUIsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksMEJBQVosRUFBd0MsRUFBeEM7SUFBUjs7SUFFWixxQkFBQyxRQUFELEVBQVksUUFBWjtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsV0FBRDtNQUFXLElBQUMsQ0FBQSxVQUFEO01BQ3ZCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUVmLE9BQTRCLElBQUMsQ0FBQSxRQUE3QixFQUFDLElBQUMsQ0FBQSxjQUFBLE1BQUYsRUFBVSxJQUFDLENBQUEscUJBQUE7TUFDWCxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxhQUFhLENBQUMsb0JBQWYsQ0FBb0MsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBQXBDLENBQWpCO01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxhQUFhLENBQUMscUJBQWYsQ0FBcUMsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLElBQWpCLENBQXJDLENBQWpCO01BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUVmLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDdkIsY0FBQTtVQUFBLElBQWlCLEtBQUMsQ0FBQSxPQUFPLENBQUMsaUJBQTFCO1lBQUEsS0FBQyxDQUFBLFVBQUQsQ0FBQSxFQUFBOztVQUVBLEtBQUMsQ0FBQSxRQUFRLENBQUMsa0JBQWtCLENBQUMsS0FBN0IsQ0FBQTtVQUNBLElBQU8sMEJBQVA7WUFDRSxJQUFrQixRQUFRLENBQUMsR0FBVCxDQUFhLCtCQUFiLENBQWxCO2NBQUEsS0FBQyxDQUFBLFdBQUQsQ0FBQSxFQUFBOztBQUNBLG1CQUZGOztVQUlBLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSx3QkFBYixDQUFIO1lBQ0UsWUFBQSxHQUNFO2NBQUEsSUFBQSxFQUFRLENBQUMsS0FBQyxDQUFBLGlCQUFELEdBQXFCLENBQXRCLENBQUEsR0FBd0IsR0FBeEIsR0FBMkIsS0FBQyxDQUFBLE9BQU8sQ0FBQyxNQUE1QztjQUNBLFNBQUEsRUFBVyxLQUFDLENBQUEsa0JBQUQsQ0FBb0IsS0FBQyxDQUFBLFlBQXJCLENBRFg7O1lBR0YsSUFBQSxDQUFPLEtBQUMsQ0FBQSxPQUFPLENBQUMsaUJBQWhCO2NBQ0UsWUFBWSxDQUFDLE9BQWIsR0FBdUIsUUFBUSxDQUFDLEdBQVQsQ0FBYSxnQ0FBYixFQUR6Qjs7WUFHQSxLQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFrQixDQUFDLFdBQTdCLENBQXlDLEtBQUMsQ0FBQSxZQUFZLENBQUMsS0FBdkQsRUFBOEQsWUFBOUQsRUFSRjs7VUFVQSxLQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsS0FBQyxDQUFBLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBNUM7VUFDQSwyQkFBQSxDQUE0QixLQUFDLENBQUEsTUFBN0IsRUFBcUMsS0FBQyxDQUFBLFlBQVksQ0FBQyxLQUFuRDtVQUVBLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSxlQUFiLENBQUg7bUJBQ0UsS0FBQyxDQUFBLFVBQUQsQ0FBWSxLQUFDLENBQUEsWUFBYixFQURGOztRQXJCdUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCO0lBVFc7O0lBaUNiLFdBQUEsR0FBYzs7MEJBQ2QsVUFBQSxHQUFZLFNBQUMsS0FBRDs7UUFDVixXQUFXLENBQUUsT0FBYixDQUFBOzthQUNBLFdBQUEsR0FBYyxjQUFBLENBQWUsSUFBQyxDQUFBLE1BQWhCLEVBQXdCLEtBQXhCLEVBQ1o7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHFCQUFQO1FBQ0EsT0FBQSxFQUFTLFFBQVEsQ0FBQyxHQUFULENBQWEsdUJBQWIsQ0FEVDtPQURZO0lBRko7OzBCQU1aLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7YUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtJQUZPOzswQkFJVCxZQUFBLEdBQWMsU0FBQTtBQUNaLFVBQUE7QUFBQTtBQUFBO1dBQUEsc0NBQUE7O3FCQUNFLE1BQU0sQ0FBQyxPQUFQLENBQUE7QUFERjs7SUFEWTs7MEJBSWQsa0JBQUEsR0FBb0IsU0FBQyxLQUFEO0FBQ2xCLFVBQUE7TUFBQSxVQUFBLEdBQWE7TUFDYixJQUFHLEtBQUEsS0FBUyxJQUFDLENBQUEsVUFBYjtRQUNFLFVBQVUsQ0FBQyxJQUFYLENBQWdCLE9BQWhCLEVBREY7T0FBQSxNQUVLLElBQUcsS0FBQSxLQUFTLElBQUMsQ0FBQSxTQUFiO1FBQ0gsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsTUFBaEIsRUFERzs7TUFHTCxJQUFHLEtBQUEsS0FBUyxJQUFDLENBQUEsWUFBYjtRQUNFLFVBQVUsQ0FBQyxJQUFYLENBQWdCLFNBQWhCLEVBREY7O2FBR0E7SUFWa0I7OzBCQVlwQixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsWUFBRCxDQUFBO0FBQ0E7QUFBQTtXQUFBLHNDQUFBOztxQkFBQSxJQUFDLENBQUEsYUFBRCxDQUFlLEtBQWY7QUFBQTs7SUFGVTs7MEJBSVoscUJBQUEsR0FBdUIsU0FBQTtBQUNyQixVQUFBO01BQUEsWUFBQSxHQUFlLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxNQUF2QjthQUNmLGtCQUFBLEdBQXFCLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixTQUFDLEtBQUQ7ZUFDbkMsS0FBSyxDQUFDLGNBQU4sQ0FBcUIsWUFBckI7TUFEbUMsQ0FBaEI7SUFGQTs7MEJBS3ZCLGFBQUEsR0FBZSxTQUFDLEtBQUQ7QUFDYixVQUFBO01BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixLQUFwQjtNQUNiLFVBQUEsR0FBYSxRQUFBLENBQUMsNEJBQUQsQ0FBQSxDQUE4QixDQUFDLE1BQS9CLGFBQXNDLFVBQXRDO2FBQ2IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLElBQUMsQ0FBQSxXQUFXLENBQUMsZUFBYixDQUE2QixLQUE3QixDQUF2QixFQUNFO1FBQUEsSUFBQSxFQUFNLFdBQU47UUFDQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFVBQVUsQ0FBQyxJQUFYLENBQWdCLEdBQWhCLENBRFA7T0FERjtJQUhhOzswQkFPZixNQUFBLEdBQVEsU0FBQyxTQUFELEVBQVksT0FBWixFQUFzQixhQUF0QjtBQUNOLFVBQUE7TUFEa0IsSUFBQyxDQUFBLFVBQUQ7TUFDbEIsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLElBQUMsQ0FBQSxPQUFkLEVBQXVCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ3JCLGNBQUE7VUFEdUIsUUFBRDtpQkFDdEIsS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsS0FBZDtRQURxQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkI7TUFHQSxPQUFpQyxJQUFDLENBQUEsT0FBbEMsRUFBQyxJQUFDLENBQUEsb0JBQUYsRUFBbUIsSUFBQyxDQUFBO01BRXBCLFlBQUEsR0FBZTtNQUNmLElBQUcsYUFBQSxJQUFpQixDQUFwQjtBQUNFO0FBQUEsYUFBQSxzQ0FBQTs7Z0JBQTJCLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBWixDQUEwQixTQUExQjs7O1VBQ3pCLFlBQUEsR0FBZTtBQUNmO0FBRkY7O1VBR0EsZUFBZ0IsSUFBQyxDQUFBOztRQUNqQixhQUFBLEdBTEY7T0FBQSxNQUFBO0FBT0U7QUFBQSxhQUFBLG9DQUFBOztnQkFBaUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFaLENBQXVCLFNBQXZCOzs7VUFDL0IsWUFBQSxHQUFlO0FBQ2Y7QUFGRjs7VUFHQSxlQUFnQixJQUFDLENBQUE7O1FBQ2pCLGFBQUEsR0FYRjs7TUFhQSxJQUFDLENBQUEsaUJBQUQsR0FBcUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLFlBQWpCO01BQ3JCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQjtNQUNBLElBQUMsQ0FBQSx3QkFBRCxHQUE0QixJQUFDLENBQUE7YUFDN0IsSUFBQyxDQUFBO0lBeEJLOzswQkEwQlIsa0JBQUEsR0FBb0IsU0FBQyxhQUFEO01BQ2xCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixRQUFBLENBQVMsSUFBQyxDQUFBLGlCQUFELEdBQXFCLGFBQTlCLEVBQTZDLElBQUMsQ0FBQSxPQUE5QztNQUNyQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsT0FBUSxDQUFBLElBQUMsQ0FBQSxpQkFBRDthQUN6QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYywwQkFBZDtJQUhrQjs7MEJBS3BCLGdCQUFBLEdBQWtCLFNBQUE7YUFDaEIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUMsQ0FBQTtJQUROOzswQkFHbEIsV0FBQSxHQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsT0FBQSxHQUFVO1FBQUMsQ0FBQSxLQUFBLENBQUEsRUFBTyxxQkFBUjtRQUErQixPQUFBLEVBQVMsR0FBeEM7O01BQ1YsY0FBQSxDQUFlLElBQUMsQ0FBQSxNQUFoQixFQUF3QixxQkFBQSxDQUFzQixJQUFDLENBQUEsTUFBdkIsQ0FBeEIsRUFBd0QsT0FBeEQ7YUFDQSxJQUFJLENBQUMsSUFBTCxDQUFBO0lBSFc7Ozs7O0FBN0hmIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntcbiAgaGlnaGxpZ2h0UmFuZ2VcbiAgc2NhbkluUmFuZ2VzXG4gIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICBzbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb25cbiAgZ2V0SW5kZXhcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWFyY2hNb2RlbFxuICByZWxhdGl2ZUluZGV4OiAwXG4gIG9uRGlkQ2hhbmdlQ3VycmVudE1hdGNoOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlLWN1cnJlbnQtbWF0Y2gnLCBmblxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlLCBAb3B0aW9ucykgLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnR9ID0gQHZpbVN0YXRlXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZXMuYWRkKEBlZGl0b3JFbGVtZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKEB1cGRhdGVWaWV3LmJpbmQodGhpcykpKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQoQGVkaXRvckVsZW1lbnQub25EaWRDaGFuZ2VTY3JvbGxMZWZ0KEB1cGRhdGVWaWV3LmJpbmQodGhpcykpKVxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoKVxuXG4gICAgQG9uRGlkQ2hhbmdlQ3VycmVudE1hdGNoID0+XG4gICAgICBAdXBkYXRlVmlldygpIGlmIEBvcHRpb25zLmluY3JlbWVudGFsU2VhcmNoXG5cbiAgICAgIEB2aW1TdGF0ZS5ob3ZlclNlYXJjaENvdW50ZXIucmVzZXQoKVxuICAgICAgdW5sZXNzIEBjdXJyZW50TWF0Y2g/XG4gICAgICAgIEBmbGFzaFNjcmVlbigpIGlmIHNldHRpbmdzLmdldCgnZmxhc2hTY3JlZW5PblNlYXJjaEhhc05vTWF0Y2gnKVxuICAgICAgICByZXR1cm5cblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdzaG93SG92ZXJTZWFyY2hDb3VudGVyJylcbiAgICAgICAgaG92ZXJPcHRpb25zID1cbiAgICAgICAgICB0ZXh0OiBcIiN7QGN1cnJlbnRNYXRjaEluZGV4ICsgMX0vI3tAbWF0Y2hlcy5sZW5ndGh9XCJcbiAgICAgICAgICBjbGFzc0xpc3Q6IEBjbGFzc05hbWVzRm9yUmFuZ2UoQGN1cnJlbnRNYXRjaClcblxuICAgICAgICB1bmxlc3MgQG9wdGlvbnMuaW5jcmVtZW50YWxTZWFyY2hcbiAgICAgICAgICBob3Zlck9wdGlvbnMudGltZW91dCA9IHNldHRpbmdzLmdldCgnc2hvd0hvdmVyU2VhcmNoQ291bnRlckR1cmF0aW9uJylcblxuICAgICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLndpdGhUaW1lb3V0KEBjdXJyZW50TWF0Y2guc3RhcnQsIGhvdmVyT3B0aW9ucylcblxuICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3coQGN1cnJlbnRNYXRjaC5zdGFydC5yb3cpXG4gICAgICBzbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb24oQGVkaXRvciwgQGN1cnJlbnRNYXRjaC5zdGFydClcblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdmbGFzaE9uU2VhcmNoJylcbiAgICAgICAgQGZsYXNoUmFuZ2UoQGN1cnJlbnRNYXRjaClcblxuICBmbGFzaE1hcmtlciA9IG51bGxcbiAgZmxhc2hSYW5nZTogKHJhbmdlKSAtPlxuICAgIGZsYXNoTWFya2VyPy5kZXN0cm95KClcbiAgICBmbGFzaE1hcmtlciA9IGhpZ2hsaWdodFJhbmdlIEBlZGl0b3IsIHJhbmdlLFxuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoJ1xuICAgICAgdGltZW91dDogc2V0dGluZ3MuZ2V0KCdmbGFzaE9uU2VhcmNoRHVyYXRpb24nKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQG1hcmtlckxheWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcblxuICBjbGVhck1hcmtlcnM6IC0+XG4gICAgZm9yIG1hcmtlciBpbiBAbWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG4gICAgICBtYXJrZXIuZGVzdHJveSgpXG5cbiAgY2xhc3NOYW1lc0ZvclJhbmdlOiAocmFuZ2UpIC0+XG4gICAgY2xhc3NOYW1lcyA9IFtdXG4gICAgaWYgcmFuZ2UgaXMgQGZpcnN0TWF0Y2hcbiAgICAgIGNsYXNzTmFtZXMucHVzaCgnZmlyc3QnKVxuICAgIGVsc2UgaWYgcmFuZ2UgaXMgQGxhc3RNYXRjaFxuICAgICAgY2xhc3NOYW1lcy5wdXNoKCdsYXN0JylcblxuICAgIGlmIHJhbmdlIGlzIEBjdXJyZW50TWF0Y2hcbiAgICAgIGNsYXNzTmFtZXMucHVzaCgnY3VycmVudCcpXG5cbiAgICBjbGFzc05hbWVzXG5cbiAgdXBkYXRlVmlldzogLT5cbiAgICBAY2xlYXJNYXJrZXJzKClcbiAgICBAZGVjb3JhdGVSYW5nZShyYW5nZSkgZm9yIHJhbmdlIGluIEBnZXRWaXNpYmxlTWF0Y2hSYW5nZXMoKVxuXG4gIGdldFZpc2libGVNYXRjaFJhbmdlczogLT5cbiAgICB2aXNpYmxlUmFuZ2UgPSBnZXRWaXNpYmxlQnVmZmVyUmFuZ2UoQGVkaXRvcilcbiAgICB2aXNpYmxlTWF0Y2hSYW5nZXMgPSBAbWF0Y2hlcy5maWx0ZXIgKHJhbmdlKSAtPlxuICAgICAgcmFuZ2UuaW50ZXJzZWN0c1dpdGgodmlzaWJsZVJhbmdlKVxuXG4gIGRlY29yYXRlUmFuZ2U6IChyYW5nZSkgLT5cbiAgICBjbGFzc05hbWVzID0gQGNsYXNzTmFtZXNGb3JSYW5nZShyYW5nZSlcbiAgICBjbGFzc05hbWVzID0gWyd2aW0tbW9kZS1wbHVzLXNlYXJjaC1tYXRjaCddLmNvbmNhdChjbGFzc05hbWVzLi4uKVxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgQG1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShyYW5nZSksXG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6IGNsYXNzTmFtZXMuam9pbignICcpXG5cbiAgc2VhcmNoOiAoZnJvbVBvaW50LCBAcGF0dGVybiwgcmVsYXRpdmVJbmRleCkgLT5cbiAgICBAbWF0Y2hlcyA9IFtdXG4gICAgQGVkaXRvci5zY2FuIEBwYXR0ZXJuLCAoe3JhbmdlfSkgPT5cbiAgICAgIEBtYXRjaGVzLnB1c2gocmFuZ2UpXG5cbiAgICBbQGZpcnN0TWF0Y2gsIC4uLiwgQGxhc3RNYXRjaF0gPSBAbWF0Y2hlc1xuXG4gICAgY3VycmVudE1hdGNoID0gbnVsbFxuICAgIGlmIHJlbGF0aXZlSW5kZXggPj0gMFxuICAgICAgZm9yIHJhbmdlIGluIEBtYXRjaGVzIHdoZW4gcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihmcm9tUG9pbnQpXG4gICAgICAgIGN1cnJlbnRNYXRjaCA9IHJhbmdlXG4gICAgICAgIGJyZWFrXG4gICAgICBjdXJyZW50TWF0Y2ggPz0gQGZpcnN0TWF0Y2hcbiAgICAgIHJlbGF0aXZlSW5kZXgtLVxuICAgIGVsc2VcbiAgICAgIGZvciByYW5nZSBpbiBAbWF0Y2hlcyBieSAtMSB3aGVuIHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbVBvaW50KVxuICAgICAgICBjdXJyZW50TWF0Y2ggPSByYW5nZVxuICAgICAgICBicmVha1xuICAgICAgY3VycmVudE1hdGNoID89IEBsYXN0TWF0Y2hcbiAgICAgIHJlbGF0aXZlSW5kZXgrK1xuXG4gICAgQGN1cnJlbnRNYXRjaEluZGV4ID0gQG1hdGNoZXMuaW5kZXhPZihjdXJyZW50TWF0Y2gpXG4gICAgQHVwZGF0ZUN1cnJlbnRNYXRjaChyZWxhdGl2ZUluZGV4KVxuICAgIEBpbml0aWFsQ3VycmVudE1hdGNoSW5kZXggPSBAY3VycmVudE1hdGNoSW5kZXhcbiAgICBAY3VycmVudE1hdGNoXG5cbiAgdXBkYXRlQ3VycmVudE1hdGNoOiAocmVsYXRpdmVJbmRleCkgLT5cbiAgICBAY3VycmVudE1hdGNoSW5kZXggPSBnZXRJbmRleChAY3VycmVudE1hdGNoSW5kZXggKyByZWxhdGl2ZUluZGV4LCBAbWF0Y2hlcylcbiAgICBAY3VycmVudE1hdGNoID0gQG1hdGNoZXNbQGN1cnJlbnRNYXRjaEluZGV4XVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtY3VycmVudC1tYXRjaCcpXG5cbiAgZ2V0UmVsYXRpdmVJbmRleDogLT5cbiAgICBAY3VycmVudE1hdGNoSW5kZXggLSBAaW5pdGlhbEN1cnJlbnRNYXRjaEluZGV4XG5cbiAgZmxhc2hTY3JlZW46IC0+XG4gICAgb3B0aW9ucyA9IHtjbGFzczogJ3ZpbS1tb2RlLXBsdXMtZmxhc2gnLCB0aW1lb3V0OiAxMDB9XG4gICAgaGlnaGxpZ2h0UmFuZ2UoQGVkaXRvciwgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlKEBlZGl0b3IpLCBvcHRpb25zKVxuICAgIGF0b20uYmVlcCgpXG4iXX0=
