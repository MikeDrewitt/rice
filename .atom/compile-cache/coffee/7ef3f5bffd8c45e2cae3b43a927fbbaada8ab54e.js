(function() {
  var CompositeDisposable, Emitter, OccurrenceManager, _, ref, ref1, scanEditor, shrinkRangeEndToBeforeNewLine;

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('./utils'), scanEditor = ref1.scanEditor, shrinkRangeEndToBeforeNewLine = ref1.shrinkRangeEndToBeforeNewLine;

  module.exports = OccurrenceManager = (function() {
    OccurrenceManager.prototype.patterns = null;

    function OccurrenceManager(vimState) {
      var options, ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.emitter = new Emitter;
      this.patterns = [];
      this.markerLayer = this.editor.addMarkerLayer();
      options = {
        type: 'highlight',
        "class": 'vim-mode-plus-occurrence-match'
      };
      this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, options);
      this.onDidChangePatterns((function(_this) {
        return function(arg) {
          var i, j, len, len1, marker, newPattern, range, ref3, ref4, results1, results2;
          newPattern = arg.newPattern;
          if (newPattern) {
            ref3 = scanEditor(_this.editor, newPattern);
            results1 = [];
            for (i = 0, len = ref3.length; i < len; i++) {
              range = ref3[i];
              results1.push(_this.markerLayer.markBufferRange(range));
            }
            return results1;
          } else {
            ref4 = _this.markerLayer.getMarkers();
            results2 = [];
            for (j = 0, len1 = ref4.length; j < len1; j++) {
              marker = ref4[j];
              results2.push(marker.destroy());
            }
            return results2;
          }
        };
      })(this));
      this.markerLayer.onDidUpdate((function(_this) {
        return function() {
          return _this.editorElement.classList.toggle("has-occurrence", _this.hasMarkers());
        };
      })(this));
    }

    OccurrenceManager.prototype.onDidChangePatterns = function(fn) {
      return this.emitter.on('did-change-patterns', fn);
    };

    OccurrenceManager.prototype.destroy = function() {
      this.decorationLayer.destroy();
      this.disposables.dispose();
      return this.markerLayer.destroy();
    };

    OccurrenceManager.prototype.getMarkerRangesIntersectsWithRanges = function(ranges, exclusive) {
      if (exclusive == null) {
        exclusive = false;
      }
      return this.getMarkersIntersectsWithRanges(ranges, exclusive).map(function(marker) {
        return marker.getBufferRange();
      });
    };

    OccurrenceManager.prototype.hasPatterns = function() {
      return this.patterns.length > 0;
    };

    OccurrenceManager.prototype.resetPatterns = function() {
      this.patterns = [];
      return this.emitter.emit('did-change-patterns', {});
    };

    OccurrenceManager.prototype.addPattern = function(pattern) {
      if (pattern == null) {
        pattern = null;
      }
      this.patterns.push(pattern);
      return this.emitter.emit('did-change-patterns', {
        newPattern: pattern
      });
    };

    OccurrenceManager.prototype.buildPattern = function() {
      var source;
      source = this.patterns.map(function(pattern) {
        return pattern.source;
      }).join('|');
      return new RegExp(source, 'g');
    };

    OccurrenceManager.prototype.hasMarkers = function() {
      return this.markerLayer.getMarkerCount() > 0;
    };

    OccurrenceManager.prototype.getMarkers = function() {
      return this.markerLayer.getMarkers();
    };

    OccurrenceManager.prototype.getMarkerCount = function() {
      return this.markerLayer.getMarkerCount();
    };

    OccurrenceManager.prototype.getMarkersIntersectsWithRanges = function(ranges, exclusive) {
      var i, len, markers, range, results;
      if (exclusive == null) {
        exclusive = false;
      }
      ranges = ranges.map(function(range) {
        return shrinkRangeEndToBeforeNewLine(range);
      });
      results = [];
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        markers = this.markerLayer.findMarkers({
          intersectsBufferRange: range
        }).filter(function(marker) {
          return range.intersectsWith(marker.getBufferRange(), exclusive);
        });
        results.push.apply(results, markers);
      }
      return results;
    };

    OccurrenceManager.prototype.getMarkerAtPoint = function(point) {
      return this.markerLayer.findMarkers({
        containsBufferPosition: point
      })[0];
    };

    return OccurrenceManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vY2N1cnJlbmNlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMscUJBQUQsRUFBVTs7RUFFVixPQUdJLE9BQUEsQ0FBUSxTQUFSLENBSEosRUFDRSw0QkFERixFQUVFOztFQUdGLE1BQU0sQ0FBQyxPQUFQLEdBQ007Z0NBQ0osUUFBQSxHQUFVOztJQUVHLDJCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixPQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQyxJQUFDLENBQUEsY0FBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLHFCQUFBO01BQ1gsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUF2QixDQUFqQjtNQUNBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxRQUFELEdBQVk7TUFFWixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBO01BQ2YsT0FBQSxHQUFVO1FBQUMsSUFBQSxFQUFNLFdBQVA7UUFBb0IsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBM0I7O01BQ1YsSUFBQyxDQUFBLGVBQUQsR0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxtQkFBUixDQUE0QixJQUFDLENBQUEsV0FBN0IsRUFBMEMsT0FBMUM7TUFLbkIsSUFBQyxDQUFBLG1CQUFELENBQXFCLENBQUEsU0FB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QUFDLE1BQXZELENBQThELFNBQUMsTUFBRDtpQkFDdEUsS0FBSyxDQUFDLGNBQU4sQ0FBcUIsTUFBTSxDQUFDLGNBQVAsQ0FBQSxDQUFyQixFQUE4QyxTQUE5QztRQURzRSxDQUE5RDtRQUVWLE9BQU8sQ0FBQyxJQUFSLGdCQUFhLE9BQWI7QUFIRjthQUlBO0lBWjhCOztnQ0FjaEMsZ0JBQUEsR0FBa0IsU0FBQyxLQUFEO2FBQ2hCLElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixDQUF5QjtRQUFBLHNCQUFBLEVBQXdCLEtBQXhCO09BQXpCLENBQXdELENBQUEsQ0FBQTtJQUR4Qzs7Ozs7QUFqR3BCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbntcbiAgc2NhbkVkaXRvclxuICBzaHJpbmtSYW5nZUVuZFRvQmVmb3JlTmV3TGluZVxufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE9jY3VycmVuY2VNYW5hZ2VyXG4gIHBhdHRlcm5zOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBwYXR0ZXJucyA9IFtdXG5cbiAgICBAbWFya2VyTGF5ZXIgPSBAZWRpdG9yLmFkZE1hcmtlckxheWVyKClcbiAgICBvcHRpb25zID0ge3R5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ3ZpbS1tb2RlLXBsdXMtb2NjdXJyZW5jZS1tYXRjaCd9XG4gICAgQGRlY29yYXRpb25MYXllciA9IEBlZGl0b3IuZGVjb3JhdGVNYXJrZXJMYXllcihAbWFya2VyTGF5ZXIsIG9wdGlvbnMpXG5cbiAgICAjIEBwYXR0ZXJucyBpcyBzaW5nbGUgc291cmNlIG9mIHRydXRoIChTU09UKVxuICAgICMgQWxsIG1ha2VyIGNyZWF0ZS9kZXN0cm95L2Nzcy11cGRhdGUgaXMgZG9uZSBieSByZWFjdGluZyBAcGF0dGVycydzIGNoYW5nZS5cbiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAb25EaWRDaGFuZ2VQYXR0ZXJucyAoe25ld1BhdHRlcm59KSA9PlxuICAgICAgaWYgbmV3UGF0dGVyblxuICAgICAgICBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKHJhbmdlKSBmb3IgcmFuZ2UgaW4gc2NhbkVkaXRvcihAZWRpdG9yLCBuZXdQYXR0ZXJuKVxuICAgICAgZWxzZVxuICAgICAgICAjIFdoZW4gcGF0dGVybnMgd2VyZSBjbGVhcmVkLCBkZXN0cm95IGFsbCBtYXJrZXIuXG4gICAgICAgIG1hcmtlci5kZXN0cm95KCkgZm9yIG1hcmtlciBpbiBAbWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG5cbiAgICAjIFVwZGF0ZSBjc3Mgb24gZXZlcnkgbWFya2VyIHVwZGF0ZS5cbiAgICBAbWFya2VyTGF5ZXIub25EaWRVcGRhdGUgPT5cbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJoYXMtb2NjdXJyZW5jZVwiLCBAaGFzTWFya2VycygpKVxuXG4gICMgQ2FsbGJhY2sgZ2V0IHBhc3NlZCBmb2xsb3dpbmcgb2JqZWN0XG4gICMgLSBuZXdQYXR0ZXJuOiBjYW4gYmUgdW5kZWZpbmVkIG9uIHJlc2V0IGV2ZW50XG4gIG9uRGlkQ2hhbmdlUGF0dGVybnM6IChmbikgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWNoYW5nZS1wYXR0ZXJucycsIGZuKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRlY29yYXRpb25MYXllci5kZXN0cm95KClcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQG1hcmtlckxheWVyLmRlc3Ryb3koKVxuXG4gIGdldE1hcmtlclJhbmdlc0ludGVyc2VjdHNXaXRoUmFuZ2VzOiAocmFuZ2VzLCBleGNsdXNpdmU9ZmFsc2UpIC0+XG4gICAgQGdldE1hcmtlcnNJbnRlcnNlY3RzV2l0aFJhbmdlcyhyYW5nZXMsIGV4Y2x1c2l2ZSkubWFwIChtYXJrZXIpIC0+XG4gICAgICBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuXG4gICMgUGF0dGVybnNcbiAgaGFzUGF0dGVybnM6IC0+XG4gICAgQHBhdHRlcm5zLmxlbmd0aCA+IDBcblxuICByZXNldFBhdHRlcm5zOiAtPlxuICAgIEBwYXR0ZXJucyA9IFtdXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZS1wYXR0ZXJucycsIHt9KVxuXG4gIGFkZFBhdHRlcm46IChwYXR0ZXJuPW51bGwpIC0+XG4gICAgQHBhdHRlcm5zLnB1c2gocGF0dGVybilcbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXBhdHRlcm5zJywge25ld1BhdHRlcm46IHBhdHRlcm59KVxuXG4gICMgUmV0dXJuIHJlZ2V4IHJlcHJlc2VudGluZyBmaW5hbCBwYXR0ZXJuLlxuICAjIFVzZWQgdG8gY2FjaGUgZmluYWwgcGF0dGVybiB0byBlYWNoIGluc3RhbmNlIG9mIG9wZXJhdG9yIHNvIHRoYXQgd2UgY2FuXG4gICMgcmVwZWF0IHJlY29yZGVkIG9wZXJhdGlvbiBieSBgLmAuXG4gICMgUGF0dGVybiBjYW4gYmUgYWRkZWQgaW50ZXJhY3RpdmVseSBvbmUgYnkgb25lLCBidXQgd2Ugc2F2ZSBpdCBhcyB1bmlvbiBwYXR0ZXJuLlxuICBidWlsZFBhdHRlcm46IC0+XG4gICAgc291cmNlID0gQHBhdHRlcm5zLm1hcCgocGF0dGVybikgLT4gcGF0dGVybi5zb3VyY2UpLmpvaW4oJ3wnKVxuICAgIG5ldyBSZWdFeHAoc291cmNlLCAnZycpXG5cbiAgIyBNYXJrZXJzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBoYXNNYXJrZXJzOiAtPlxuICAgIEBtYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpID4gMFxuXG4gIGdldE1hcmtlcnM6IC0+XG4gICAgQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuXG4gIGdldE1hcmtlckNvdW50OiAtPlxuICAgIEBtYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpXG5cbiAgIyBSZXR1cm4gb2NjdXJyZW5jZSBtYXJrZXJzIGludGVyc2VjdGluZyBnaXZlbiByYW5nZXNcbiAgZ2V0TWFya2Vyc0ludGVyc2VjdHNXaXRoUmFuZ2VzOiAocmFuZ2VzLCBleGNsdXNpdmU9ZmFsc2UpIC0+XG4gICAgIyBmaW5kbWFya2VycygpJ3MgaW50ZXJzZWN0c0J1ZmZlclJhbmdlIHBhcmFtIGhhdmUgbm8gZXhjbHVzaXZlIGNvdG50cm9sbFxuICAgICMgU28gSSBuZWVkIGV4dHJhIGNoZWNrIHRvIGZpbHRlciBvdXQgdW53YW50ZWQgbWFya2VyLlxuICAgICMgQnV0IGJhc2ljYWxseSBJIHNob3VsZCBwcmVmZXIgZmluZE1hcmtlciBzaW5jZSBJdCdzIGZhc3QgdGhhbiBpdGVyYXRpbmdcbiAgICAjIHdob2xlIG1hcmtlcnMgbWFudWFsbHkuXG4gICAgcmFuZ2VzID0gcmFuZ2VzLm1hcCAocmFuZ2UpIC0+IHNocmlua1JhbmdlRW5kVG9CZWZvcmVOZXdMaW5lKHJhbmdlKVxuXG4gICAgcmVzdWx0cyA9IFtdXG4gICAgZm9yIHJhbmdlIGluIHJhbmdlc1xuICAgICAgbWFya2VycyA9IEBtYXJrZXJMYXllci5maW5kTWFya2VycyhpbnRlcnNlY3RzQnVmZmVyUmFuZ2U6IHJhbmdlKS5maWx0ZXIgKG1hcmtlcikgLT5cbiAgICAgICAgcmFuZ2UuaW50ZXJzZWN0c1dpdGgobWFya2VyLmdldEJ1ZmZlclJhbmdlKCksIGV4Y2x1c2l2ZSlcbiAgICAgIHJlc3VsdHMucHVzaChtYXJrZXJzLi4uKVxuICAgIHJlc3VsdHNcblxuICBnZXRNYXJrZXJBdFBvaW50OiAocG9pbnQpIC0+XG4gICAgQG1hcmtlckxheWVyLmZpbmRNYXJrZXJzKGNvbnRhaW5zQnVmZmVyUG9zaXRpb246IHBvaW50KVswXVxuIl19
