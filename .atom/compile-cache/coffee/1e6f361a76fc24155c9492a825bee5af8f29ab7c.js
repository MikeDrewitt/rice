(function() {
  var BufferSearch, CompositeDisposable, Emitter, FindOptions, Patch, Point, Range, ResultsMarkerLayersByEditor, TextBuffer, _, escapeHelper, ref,
    slice = [].slice;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range, Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable, TextBuffer = ref.TextBuffer;

  Patch = TextBuffer.Patch;

  FindOptions = require('./find-options');

  escapeHelper = require('./escape-helper');

  ResultsMarkerLayersByEditor = new WeakMap;

  module.exports = BufferSearch = (function() {
    function BufferSearch(findOptions1) {
      var recreateMarkers;
      this.findOptions = findOptions1;
      this.emitter = new Emitter;
      this.patch = new Patch;
      this.subscriptions = null;
      this.markers = [];
      this.editor = null;
      recreateMarkers = this.recreateMarkers.bind(this);
      this.findOptions.onDidChange((function(_this) {
        return function(changedParams) {
          if (changedParams == null) {
            return;
          }
          if (!((changedParams.findPattern != null) || (changedParams.useRegex != null) || (changedParams.wholeWord != null) || (changedParams.caseSensitive != null) || (changedParams.inCurrentSelection != null))) {
            return;
          }
          return _this.recreateMarkers();
        };
      })(this));
    }

    BufferSearch.prototype.onDidUpdate = function(callback) {
      return this.emitter.on('did-update', callback);
    };

    BufferSearch.prototype.onDidError = function(callback) {
      return this.emitter.on('did-error', callback);
    };

    BufferSearch.prototype.onDidChangeCurrentResult = function(callback) {
      return this.emitter.on('did-change-current-result', callback);
    };

    BufferSearch.prototype.setEditor = function(editor1) {
      var ref1, ref2, ref3;
      this.editor = editor1;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      if (((ref2 = this.editor) != null ? ref2.buffer : void 0) != null) {
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(this.editor.buffer.onDidChange(this.bufferChanged.bind(this)));
        this.subscriptions.add(this.editor.buffer.onDidStopChanging(this.bufferStoppedChanging.bind(this)));
        this.subscriptions.add(this.editor.onDidAddSelection(this.setCurrentMarkerFromSelection.bind(this)));
        this.subscriptions.add(this.editor.onDidChangeSelectionRange(this.setCurrentMarkerFromSelection.bind(this)));
        this.resultsMarkerLayer = this.resultsMarkerLayerForTextEditor(this.editor);
        if ((ref3 = this.resultsLayerDecoration) != null) {
          ref3.destroy();
        }
        this.resultsLayerDecoration = this.editor.decorateMarkerLayer(this.resultsMarkerLayer, {
          type: 'highlight',
          "class": 'find-result'
        });
      }
      return this.recreateMarkers();
    };

    BufferSearch.prototype.getEditor = function() {
      return this.editor;
    };

    BufferSearch.prototype.setFindOptions = function(newParams) {
      return this.findOptions.set(newParams);
    };

    BufferSearch.prototype.getFindOptions = function() {
      return this.findOptions;
    };

    BufferSearch.prototype.resultsMarkerLayerForTextEditor = function(editor) {
      var layer;
      if (!(layer = ResultsMarkerLayersByEditor.get(editor))) {
        layer = editor.addMarkerLayer({
          maintainHistory: false
        });
        ResultsMarkerLayersByEditor.set(editor, layer);
      }
      return layer;
    };

    BufferSearch.prototype.patternMatchesEmptyString = function(findPattern) {
      var e, findOptions;
      findOptions = new FindOptions(this.findOptions.serialize());
      findOptions.set({
        findPattern: findPattern
      });
      try {
        return findOptions.getFindPatternRegex().test('');
      } catch (error1) {
        e = error1;
        this.emitter.emit('did-error', e);
        return false;
      }
    };

    BufferSearch.prototype.search = function(findPattern, otherOptions) {
      var k, options, v;
      options = {
        findPattern: findPattern
      };
      if (otherOptions != null) {
        for (k in otherOptions) {
          v = otherOptions[k];
          options[k] = v;
        }
      }
      return this.findOptions.set(options);
    };

    BufferSearch.prototype.replace = function(markers, replacePattern) {
      if (!((markers != null ? markers.length : void 0) > 0)) {
        return;
      }
      this.findOptions.set({
        replacePattern: replacePattern
      });
      this.editor.transact((function(_this) {
        return function() {
          var bufferRange, i, len, marker, replacementText, results, textToReplace;
          if (_this.findOptions.useRegex) {
            replacePattern = escapeHelper.unescapeEscapeSequence(replacePattern);
          }
          results = [];
          for (i = 0, len = markers.length; i < len; i++) {
            marker = markers[i];
            bufferRange = marker.getBufferRange();
            replacementText = null;
            if (_this.findOptions.useRegex) {
              textToReplace = _this.editor.getTextInBufferRange(bufferRange);
              replacementText = textToReplace.replace(_this.getFindPatternRegex(), replacePattern);
            }
            _this.editor.setTextInBufferRange(bufferRange, replacementText != null ? replacementText : replacePattern);
            marker.destroy();
            results.push(_this.markers.splice(_this.markers.indexOf(marker), 1));
          }
          return results;
        };
      })(this));
      return this.emitter.emit('did-update', this.markers.slice());
    };

    BufferSearch.prototype.destroy = function() {
      var ref1;
      return (ref1 = this.subscriptions) != null ? ref1.dispose() : void 0;
    };


    /*
    Section: Private
     */

    BufferSearch.prototype.recreateMarkers = function() {
      var markers;
      this.markers.forEach(function(marker) {
        return marker.destroy();
      });
      this.markers.length = 0;
      if (markers = this.createMarkers(Point.ZERO, Point.INFINITY)) {
        this.markers = markers;
        return this.emitter.emit("did-update", this.markers.slice());
      }
    };

    BufferSearch.prototype.createMarkers = function(start, end) {
      var error, newMarkers, regex, selectedRange;
      newMarkers = [];
      if (this.findOptions.findPattern && this.editor) {
        if (this.findOptions.inCurrentSelection && !(selectedRange = this.editor.getSelectedBufferRange()).isEmpty()) {
          start = Point.max(start, selectedRange.start);
          end = Point.min(end, selectedRange.end);
        }
        if (regex = this.getFindPatternRegex()) {
          try {
            this.editor.scanInBufferRange(regex, Range(start, end), (function(_this) {
              return function(arg) {
                var range;
                range = arg.range;
                return newMarkers.push(_this.createMarker(range));
              };
            })(this));
          } catch (error1) {
            error = error1;
            if (/RegExp too big$/.test(error.message)) {
              error.message = "Search string is too large";
            }
            this.emitter.emit('did-error', error);
            return false;
          }
        } else {
          return false;
        }
      }
      return newMarkers;
    };

    BufferSearch.prototype.bufferStoppedChanging = function() {
      var change, changeEnd, changeStart, changes, followingMarkerIndex, i, len, marker, markerIndex, newMarkers, next, oldMarker, oldMarkers, precedingMarkerIndex, ref1, scanEnd, scanStart, spliceEnd, spliceStart;
      changes = this.patch.changes();
      scanEnd = Point.ZERO;
      markerIndex = 0;
      while (!(next = changes.next()).done) {
        change = next.value;
        changeStart = change.position;
        changeEnd = changeStart.traverse(change.newExtent);
        if (changeEnd.isLessThan(scanEnd)) {
          continue;
        }
        precedingMarkerIndex = -1;
        while (marker = this.markers[markerIndex]) {
          if (marker.isValid()) {
            if (marker.getBufferRange().end.isGreaterThan(changeStart)) {
              break;
            }
            precedingMarkerIndex = markerIndex;
          } else {
            this.markers[markerIndex] = this.recreateMarker(marker);
          }
          markerIndex++;
        }
        followingMarkerIndex = -1;
        while (marker = this.markers[markerIndex]) {
          if (marker.isValid()) {
            followingMarkerIndex = markerIndex;
            if (marker.getBufferRange().start.isGreaterThanOrEqual(changeEnd)) {
              break;
            }
          } else {
            this.markers[markerIndex] = this.recreateMarker(marker);
          }
          markerIndex++;
        }
        if (precedingMarkerIndex >= 0) {
          spliceStart = precedingMarkerIndex;
          scanStart = this.markers[precedingMarkerIndex].getBufferRange().start;
        } else {
          spliceStart = 0;
          scanStart = Point.ZERO;
        }
        if (followingMarkerIndex >= 0) {
          spliceEnd = followingMarkerIndex;
          scanEnd = this.markers[followingMarkerIndex].getBufferRange().end;
        } else {
          spliceEnd = 2e308;
          scanEnd = Point.INFINITY;
        }
        newMarkers = this.createMarkers(scanStart, scanEnd);
        oldMarkers = (ref1 = this.markers).splice.apply(ref1, [spliceStart, spliceEnd - spliceStart + 1].concat(slice.call(newMarkers)));
        for (i = 0, len = oldMarkers.length; i < len; i++) {
          oldMarker = oldMarkers[i];
          oldMarker.destroy();
        }
        markerIndex += newMarkers.length - oldMarkers.length;
      }
      while (marker = this.markers[++markerIndex]) {
        if (!marker.isValid()) {
          this.markers[markerIndex] = this.recreateMarker(marker);
        }
      }
      this.emitter.emit("did-update", this.markers.slice());
      this.patch.clear();
      this.currentResultMarker = null;
      return this.setCurrentMarkerFromSelection();
    };

    BufferSearch.prototype.setCurrentMarkerFromSelection = function() {
      var marker;
      marker = null;
      if (this.editor != null) {
        marker = this.findMarker(this.editor.getSelectedBufferRange());
      }
      if (marker === this.currentResultMarker) {
        return;
      }
      if (this.currentResultMarker != null) {
        this.resultsLayerDecoration.setPropertiesForMarker(this.currentResultMarker, null);
        this.currentResultMarker = null;
      }
      if (marker && !marker.isDestroyed()) {
        this.resultsLayerDecoration.setPropertiesForMarker(marker, {
          type: 'highlight',
          "class": 'current-result'
        });
        this.currentResultMarker = marker;
      }
      return this.emitter.emit('did-change-current-result', this.currentResultMarker);
    };

    BufferSearch.prototype.findMarker = function(range) {
      var ref1;
      if (((ref1 = this.markers) != null ? ref1.length : void 0) > 0) {
        return this.resultsMarkerLayer.findMarkers({
          startPosition: range.start,
          endPosition: range.end
        })[0];
      }
    };

    BufferSearch.prototype.recreateMarker = function(marker) {
      marker.destroy();
      return this.createMarker(marker.getBufferRange());
    };

    BufferSearch.prototype.createMarker = function(range) {
      var marker;
      marker = this.resultsMarkerLayer.markBufferRange(range, {
        invalidate: 'inside'
      });
      return marker;
    };

    BufferSearch.prototype.bufferChanged = function(arg) {
      var newRange, newText, oldRange;
      oldRange = arg.oldRange, newRange = arg.newRange, newText = arg.newText;
      return this.patch.splice(oldRange.start, oldRange.getExtent(), newRange.getExtent(), newText);
    };

    BufferSearch.prototype.getFindPatternRegex = function() {
      var e;
      try {
        return this.findOptions.getFindPatternRegex();
      } catch (error1) {
        e = error1;
        this.emitter.emit('did-error', e);
        return null;
      }
    };

    return BufferSearch;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9idWZmZXItc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMklBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQTJELE9BQUEsQ0FBUSxNQUFSLENBQTNELEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlLHFCQUFmLEVBQXdCLDZDQUF4QixFQUE2Qzs7RUFDNUMsUUFBUzs7RUFDVixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBRWYsMkJBQUEsR0FBOEIsSUFBSTs7RUFFbEMsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFDLFlBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLGNBQUQ7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsS0FBRCxHQUFTLElBQUk7TUFDYixJQUFDLENBQUEsYUFBRCxHQUFpQjtNQUNqQixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLE1BQUQsR0FBVTtNQUVWLGVBQUEsR0FBa0IsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixJQUF0QjtNQUNsQixJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLGFBQUQ7VUFDdkIsSUFBYyxxQkFBZDtBQUFBLG1CQUFBOztVQUNBLElBQUEsQ0FBQSxDQUFjLG1DQUFBLElBQ1osZ0NBRFksSUFFWixpQ0FGWSxJQUdaLHFDQUhZLElBSVosMENBSkYsQ0FBQTtBQUFBLG1CQUFBOztpQkFLQSxLQUFDLENBQUEsZUFB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QUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsa0JBQWtCLENBQUMsZUFBcEIsQ0FBb0MsS0FBcEMsRUFBMkM7UUFBQyxVQUFBLEVBQVksUUFBYjtPQUEzQzthQUNUO0lBRlk7OzJCQUlkLGFBQUEsR0FBZSxTQUFDLEdBQUQ7QUFDYixVQUFBO01BRGUseUJBQVUseUJBQVU7YUFDbkMsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQ0UsUUFBUSxDQUFDLEtBRFgsRUFFRSxRQUFRLENBQUMsU0FBVCxDQUFBLENBRkYsRUFHRSxRQUFRLENBQUMsU0FBVCxDQUFBLENBSEYsRUFJRSxPQUpGO0lBRGE7OzJCQVFmLG1CQUFBLEdBQXFCLFNBQUE7QUFDbkIsVUFBQTtBQUFBO2VBQ0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxtQkFBYixDQUFBLEVBREY7T0FBQSxjQUFBO1FBRU07UUFDSixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxXQUFkLEVBQTJCLENBQTNCO2VBQ0EsS0FKRjs7SUFEbUI7Ozs7O0FBaE92QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57UG9pbnQsIFJhbmdlLCBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBUZXh0QnVmZmVyfSA9IHJlcXVpcmUgJ2F0b20nXG57UGF0Y2h9ID0gVGV4dEJ1ZmZlclxuRmluZE9wdGlvbnMgPSByZXF1aXJlICcuL2ZpbmQtb3B0aW9ucydcbmVzY2FwZUhlbHBlciA9IHJlcXVpcmUgJy4vZXNjYXBlLWhlbHBlcidcblxuUmVzdWx0c01hcmtlckxheWVyc0J5RWRpdG9yID0gbmV3IFdlYWtNYXBcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnVmZmVyU2VhcmNoXG4gIGNvbnN0cnVjdG9yOiAoQGZpbmRPcHRpb25zKSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAcGF0Y2ggPSBuZXcgUGF0Y2hcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBAbWFya2VycyA9IFtdXG4gICAgQGVkaXRvciA9IG51bGxcblxuICAgIHJlY3JlYXRlTWFya2VycyA9IEByZWNyZWF0ZU1hcmtlcnMuYmluZCh0aGlzKVxuICAgIEBmaW5kT3B0aW9ucy5vbkRpZENoYW5nZSAoY2hhbmdlZFBhcmFtcykgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgY2hhbmdlZFBhcmFtcz9cbiAgICAgIHJldHVybiB1bmxlc3MgY2hhbmdlZFBhcmFtcy5maW5kUGF0dGVybj8gb3JcbiAgICAgICAgY2hhbmdlZFBhcmFtcy51c2VSZWdleD8gb3JcbiAgICAgICAgY2hhbmdlZFBhcmFtcy53aG9sZVdvcmQ/IG9yXG4gICAgICAgIGNoYW5nZWRQYXJhbXMuY2FzZVNlbnNpdGl2ZT8gb3JcbiAgICAgICAgY2hhbmdlZFBhcmFtcy5pbkN1cnJlbnRTZWxlY3Rpb24/XG4gICAgICBAcmVjcmVhdGVNYXJrZXJzKClcblxuICBvbkRpZFVwZGF0ZTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtdXBkYXRlJywgY2FsbGJhY2tcblxuICBvbkRpZEVycm9yOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1lcnJvcicsIGNhbGxiYWNrXG5cbiAgb25EaWRDaGFuZ2VDdXJyZW50UmVzdWx0OiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UtY3VycmVudC1yZXN1bHQnLCBjYWxsYmFja1xuXG4gIHNldEVkaXRvcjogKEBlZGl0b3IpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIGlmIEBlZGl0b3I/LmJ1ZmZlcj9cbiAgICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLmJ1ZmZlci5vbkRpZENoYW5nZShAYnVmZmVyQ2hhbmdlZC5iaW5kKHRoaXMpKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3IuYnVmZmVyLm9uRGlkU3RvcENoYW5naW5nKEBidWZmZXJTdG9wcGVkQ2hhbmdpbmcuYmluZCh0aGlzKSlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkQWRkU2VsZWN0aW9uKEBzZXRDdXJyZW50TWFya2VyRnJvbVNlbGVjdGlvbi5iaW5kKHRoaXMpKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VTZWxlY3Rpb25SYW5nZShAc2V0Q3VycmVudE1hcmtlckZyb21TZWxlY3Rpb24uYmluZCh0aGlzKSlcbiAgICAgIEByZXN1bHRzTWFya2VyTGF5ZXIgPSBAcmVzdWx0c01hcmtlckxheWVyRm9yVGV4dEVkaXRvcihAZWRpdG9yKVxuICAgICAgQHJlc3VsdHNMYXllckRlY29yYXRpb24/LmRlc3Ryb3koKVxuICAgICAgQHJlc3VsdHNMYXllckRlY29yYXRpb24gPSBAZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIoQHJlc3VsdHNNYXJrZXJMYXllciwge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2ZpbmQtcmVzdWx0J30pXG4gICAgQHJlY3JlYXRlTWFya2VycygpXG5cbiAgZ2V0RWRpdG9yOiAtPiBAZWRpdG9yXG5cbiAgc2V0RmluZE9wdGlvbnM6IChuZXdQYXJhbXMpIC0+IEBmaW5kT3B0aW9ucy5zZXQobmV3UGFyYW1zKVxuXG4gIGdldEZpbmRPcHRpb25zOiAtPiBAZmluZE9wdGlvbnNcblxuICByZXN1bHRzTWFya2VyTGF5ZXJGb3JUZXh0RWRpdG9yOiAoZWRpdG9yKSAtPlxuICAgIHVubGVzcyBsYXllciA9IFJlc3VsdHNNYXJrZXJMYXllcnNCeUVkaXRvci5nZXQoZWRpdG9yKVxuICAgICAgbGF5ZXIgPSBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoe21haW50YWluSGlzdG9yeTogZmFsc2V9KVxuICAgICAgUmVzdWx0c01hcmtlckxheWVyc0J5RWRpdG9yLnNldChlZGl0b3IsIGxheWVyKVxuICAgIGxheWVyXG5cbiAgcGF0dGVybk1hdGNoZXNFbXB0eVN0cmluZzogKGZpbmRQYXR0ZXJuKSAtPlxuICAgIGZpbmRPcHRpb25zID0gbmV3IEZpbmRPcHRpb25zKEBmaW5kT3B0aW9ucy5zZXJpYWxpemUoKSlcbiAgICBmaW5kT3B0aW9ucy5zZXQoe2ZpbmRQYXR0ZXJufSlcbiAgICB0cnlcbiAgICAgIGZpbmRPcHRpb25zLmdldEZpbmRQYXR0ZXJuUmVnZXgoKS50ZXN0KCcnKVxuICAgIGNhdGNoIGVcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1lcnJvcicsIGVcbiAgICAgIGZhbHNlXG5cbiAgc2VhcmNoOiAoZmluZFBhdHRlcm4sIG90aGVyT3B0aW9ucykgLT5cbiAgICBvcHRpb25zID0ge2ZpbmRQYXR0ZXJufVxuICAgIGlmIG90aGVyT3B0aW9ucz9cbiAgICAgIGZvciBrLCB2IG9mIG90aGVyT3B0aW9uc1xuICAgICAgICBvcHRpb25zW2tdID0gdlxuICAgIEBmaW5kT3B0aW9ucy5zZXQob3B0aW9ucylcblxuICByZXBsYWNlOiAobWFya2VycywgcmVwbGFjZVBhdHRlcm4pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBtYXJrZXJzPy5sZW5ndGggPiAwXG4gICAgQGZpbmRPcHRpb25zLnNldCh7cmVwbGFjZVBhdHRlcm59KVxuXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgcmVwbGFjZVBhdHRlcm4gPSBlc2NhcGVIZWxwZXIudW5lc2NhcGVFc2NhcGVTZXF1ZW5jZShyZXBsYWNlUGF0dGVybikgaWYgQGZpbmRPcHRpb25zLnVzZVJlZ2V4XG4gICAgICBmb3IgbWFya2VyIGluIG1hcmtlcnNcbiAgICAgICAgYnVmZmVyUmFuZ2UgPSBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICByZXBsYWNlbWVudFRleHQgPSBudWxsXG4gICAgICAgIGlmIEBmaW5kT3B0aW9ucy51c2VSZWdleFxuICAgICAgICAgIHRleHRUb1JlcGxhY2UgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKGJ1ZmZlclJhbmdlKVxuICAgICAgICAgIHJlcGxhY2VtZW50VGV4dCA9IHRleHRUb1JlcGxhY2UucmVwbGFjZShAZ2V0RmluZFBhdHRlcm5SZWdleCgpLCByZXBsYWNlUGF0dGVybilcbiAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShidWZmZXJSYW5nZSwgcmVwbGFjZW1lbnRUZXh0ID8gcmVwbGFjZVBhdHRlcm4pXG5cbiAgICAgICAgbWFya2VyLmRlc3Ryb3koKVxuICAgICAgICBAbWFya2Vycy5zcGxpY2UoQG1hcmtlcnMuaW5kZXhPZihtYXJrZXIpLCAxKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXVwZGF0ZScsIEBtYXJrZXJzLnNsaWNlKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcblxuICAjIyNcbiAgU2VjdGlvbjogUHJpdmF0ZVxuICAjIyNcblxuICByZWNyZWF0ZU1hcmtlcnM6IC0+XG4gICAgQG1hcmtlcnMuZm9yRWFjaCAobWFya2VyKSAtPiBtYXJrZXIuZGVzdHJveSgpXG4gICAgQG1hcmtlcnMubGVuZ3RoID0gMFxuXG4gICAgaWYgbWFya2VycyA9IEBjcmVhdGVNYXJrZXJzKFBvaW50LlpFUk8sIFBvaW50LklORklOSVRZKVxuICAgICAgQG1hcmtlcnMgPSBtYXJrZXJzXG4gICAgICBAZW1pdHRlci5lbWl0IFwiZGlkLXVwZGF0ZVwiLCBAbWFya2Vycy5zbGljZSgpXG5cbiAgY3JlYXRlTWFya2VyczogKHN0YXJ0LCBlbmQpIC0+XG4gICAgbmV3TWFya2VycyA9IFtdXG4gICAgaWYgQGZpbmRPcHRpb25zLmZpbmRQYXR0ZXJuIGFuZCBAZWRpdG9yXG4gICAgICBpZiBAZmluZE9wdGlvbnMuaW5DdXJyZW50U2VsZWN0aW9uIGFuZCBub3QgKHNlbGVjdGVkUmFuZ2UgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKSkuaXNFbXB0eSgpXG4gICAgICAgIHN0YXJ0ID0gUG9pbnQubWF4KHN0YXJ0LCBzZWxlY3RlZFJhbmdlLnN0YXJ0KVxuICAgICAgICBlbmQgPSBQb2ludC5taW4oZW5kLCBzZWxlY3RlZFJhbmdlLmVuZClcblxuICAgICAgaWYgcmVnZXggPSBAZ2V0RmluZFBhdHRlcm5SZWdleCgpXG4gICAgICAgIHRyeVxuICAgICAgICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcmVnZXgsIFJhbmdlKHN0YXJ0LCBlbmQpLCAoe3JhbmdlfSkgPT5cbiAgICAgICAgICAgIG5ld01hcmtlcnMucHVzaChAY3JlYXRlTWFya2VyKHJhbmdlKSlcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICBlcnJvci5tZXNzYWdlID0gXCJTZWFyY2ggc3RyaW5nIGlzIHRvbyBsYXJnZVwiIGlmIC9SZWdFeHAgdG9vIGJpZyQvLnRlc3QoZXJyb3IubWVzc2FnZSlcbiAgICAgICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZXJyb3InLCBlcnJvclxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBuZXdNYXJrZXJzXG5cbiAgYnVmZmVyU3RvcHBlZENoYW5naW5nOiAtPlxuICAgIGNoYW5nZXMgPSBAcGF0Y2guY2hhbmdlcygpXG4gICAgc2NhbkVuZCA9IFBvaW50LlpFUk9cbiAgICBtYXJrZXJJbmRleCA9IDBcblxuICAgIHVudGlsIChuZXh0ID0gY2hhbmdlcy5uZXh0KCkpLmRvbmVcbiAgICAgIGNoYW5nZSA9IG5leHQudmFsdWVcbiAgICAgIGNoYW5nZVN0YXJ0ID0gY2hhbmdlLnBvc2l0aW9uXG4gICAgICBjaGFuZ2VFbmQgPSBjaGFuZ2VTdGFydC50cmF2ZXJzZShjaGFuZ2UubmV3RXh0ZW50KVxuICAgICAgY29udGludWUgaWYgY2hhbmdlRW5kLmlzTGVzc1RoYW4oc2NhbkVuZClcblxuICAgICAgcHJlY2VkaW5nTWFya2VySW5kZXggPSAtMVxuICAgICAgd2hpbGUgbWFya2VyID0gQG1hcmtlcnNbbWFya2VySW5kZXhdXG4gICAgICAgIGlmIG1hcmtlci5pc1ZhbGlkKClcbiAgICAgICAgICBicmVhayBpZiBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5lbmQuaXNHcmVhdGVyVGhhbihjaGFuZ2VTdGFydClcbiAgICAgICAgICBwcmVjZWRpbmdNYXJrZXJJbmRleCA9IG1hcmtlckluZGV4XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAbWFya2Vyc1ttYXJrZXJJbmRleF0gPSBAcmVjcmVhdGVNYXJrZXIobWFya2VyKVxuICAgICAgICBtYXJrZXJJbmRleCsrXG5cbiAgICAgIGZvbGxvd2luZ01hcmtlckluZGV4ID0gLTFcbiAgICAgIHdoaWxlIG1hcmtlciA9IEBtYXJrZXJzW21hcmtlckluZGV4XVxuICAgICAgICBpZiBtYXJrZXIuaXNWYWxpZCgpXG4gICAgICAgICAgZm9sbG93aW5nTWFya2VySW5kZXggPSBtYXJrZXJJbmRleFxuICAgICAgICAgIGJyZWFrIGlmIG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0LmlzR3JlYXRlclRoYW5PckVxdWFsKGNoYW5nZUVuZClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBtYXJrZXJzW21hcmtlckluZGV4XSA9IEByZWNyZWF0ZU1hcmtlcihtYXJrZXIpXG4gICAgICAgIG1hcmtlckluZGV4KytcblxuICAgICAgaWYgcHJlY2VkaW5nTWFya2VySW5kZXggPj0gMFxuICAgICAgICBzcGxpY2VTdGFydCA9IHByZWNlZGluZ01hcmtlckluZGV4XG4gICAgICAgIHNjYW5TdGFydCA9IEBtYXJrZXJzW3ByZWNlZGluZ01hcmtlckluZGV4XS5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgICBlbHNlXG4gICAgICAgIHNwbGljZVN0YXJ0ID0gMFxuICAgICAgICBzY2FuU3RhcnQgPSBQb2ludC5aRVJPXG5cbiAgICAgIGlmIGZvbGxvd2luZ01hcmtlckluZGV4ID49IDBcbiAgICAgICAgc3BsaWNlRW5kID0gZm9sbG93aW5nTWFya2VySW5kZXhcbiAgICAgICAgc2NhbkVuZCA9IEBtYXJrZXJzW2ZvbGxvd2luZ01hcmtlckluZGV4XS5nZXRCdWZmZXJSYW5nZSgpLmVuZFxuICAgICAgZWxzZVxuICAgICAgICBzcGxpY2VFbmQgPSBJbmZpbml0eVxuICAgICAgICBzY2FuRW5kID0gUG9pbnQuSU5GSU5JVFlcblxuICAgICAgbmV3TWFya2VycyA9IEBjcmVhdGVNYXJrZXJzKHNjYW5TdGFydCwgc2NhbkVuZClcbiAgICAgIG9sZE1hcmtlcnMgPSBAbWFya2Vycy5zcGxpY2Uoc3BsaWNlU3RhcnQsIHNwbGljZUVuZCAtIHNwbGljZVN0YXJ0ICsgMSwgbmV3TWFya2Vycy4uLilcbiAgICAgIGZvciBvbGRNYXJrZXIgaW4gb2xkTWFya2Vyc1xuICAgICAgICBvbGRNYXJrZXIuZGVzdHJveSgpXG4gICAgICBtYXJrZXJJbmRleCArPSBuZXdNYXJrZXJzLmxlbmd0aCAtIG9sZE1hcmtlcnMubGVuZ3RoXG5cbiAgICB3aGlsZSBtYXJrZXIgPSBAbWFya2Vyc1srK21hcmtlckluZGV4XVxuICAgICAgdW5sZXNzIG1hcmtlci5pc1ZhbGlkKClcbiAgICAgICAgQG1hcmtlcnNbbWFya2VySW5kZXhdID0gQHJlY3JlYXRlTWFya2VyKG1hcmtlcilcblxuICAgIEBlbWl0dGVyLmVtaXQgXCJkaWQtdXBkYXRlXCIsIEBtYXJrZXJzLnNsaWNlKClcbiAgICBAcGF0Y2guY2xlYXIoKVxuICAgIEBjdXJyZW50UmVzdWx0TWFya2VyID0gbnVsbFxuICAgIEBzZXRDdXJyZW50TWFya2VyRnJvbVNlbGVjdGlvbigpXG5cbiAgc2V0Q3VycmVudE1hcmtlckZyb21TZWxlY3Rpb246IC0+XG4gICAgbWFya2VyID0gbnVsbFxuICAgIG1hcmtlciA9IEBmaW5kTWFya2VyKEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpKSBpZiBAZWRpdG9yP1xuXG4gICAgcmV0dXJuIGlmIG1hcmtlciBpcyBAY3VycmVudFJlc3VsdE1hcmtlclxuXG4gICAgaWYgQGN1cnJlbnRSZXN1bHRNYXJrZXI/XG4gICAgICBAcmVzdWx0c0xheWVyRGVjb3JhdGlvbi5zZXRQcm9wZXJ0aWVzRm9yTWFya2VyKEBjdXJyZW50UmVzdWx0TWFya2VyLCBudWxsKVxuICAgICAgQGN1cnJlbnRSZXN1bHRNYXJrZXIgPSBudWxsXG5cbiAgICBpZiBtYXJrZXIgYW5kIG5vdCBtYXJrZXIuaXNEZXN0cm95ZWQoKVxuICAgICAgQHJlc3VsdHNMYXllckRlY29yYXRpb24uc2V0UHJvcGVydGllc0Zvck1hcmtlcihtYXJrZXIsIHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2N1cnJlbnQtcmVzdWx0JylcbiAgICAgIEBjdXJyZW50UmVzdWx0TWFya2VyID0gbWFya2VyXG5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLWN1cnJlbnQtcmVzdWx0JywgQGN1cnJlbnRSZXN1bHRNYXJrZXJcblxuICBmaW5kTWFya2VyOiAocmFuZ2UpIC0+XG4gICAgaWYgQG1hcmtlcnM/Lmxlbmd0aCA+IDBcbiAgICAgIEByZXN1bHRzTWFya2VyTGF5ZXIuZmluZE1hcmtlcnMoe3N0YXJ0UG9zaXRpb246IHJhbmdlLnN0YXJ0LCBlbmRQb3NpdGlvbjogcmFuZ2UuZW5kfSlbMF1cblxuICByZWNyZWF0ZU1hcmtlcjogKG1hcmtlcikgLT5cbiAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgQGNyZWF0ZU1hcmtlcihtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICBjcmVhdGVNYXJrZXI6IChyYW5nZSkgLT5cbiAgICBtYXJrZXIgPSBAcmVzdWx0c01hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwge2ludmFsaWRhdGU6ICdpbnNpZGUnfSlcbiAgICBtYXJrZXJcblxuICBidWZmZXJDaGFuZ2VkOiAoe29sZFJhbmdlLCBuZXdSYW5nZSwgbmV3VGV4dH0pIC0+XG4gICAgQHBhdGNoLnNwbGljZShcbiAgICAgIG9sZFJhbmdlLnN0YXJ0LFxuICAgICAgb2xkUmFuZ2UuZ2V0RXh0ZW50KCksXG4gICAgICBuZXdSYW5nZS5nZXRFeHRlbnQoKSxcbiAgICAgIG5ld1RleHRcbiAgICApXG5cbiAgZ2V0RmluZFBhdHRlcm5SZWdleDogLT5cbiAgICB0cnlcbiAgICAgIEBmaW5kT3B0aW9ucy5nZXRGaW5kUGF0dGVyblJlZ2V4KClcbiAgICBjYXRjaCBlXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtZXJyb3InLCBlXG4gICAgICBudWxsXG4iXX0=
