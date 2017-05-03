(function() {
  var CompositeDisposable, Emitter, Mutation, MutationManager, Point, ref, swrap;

  ref = require('atom'), Point = ref.Point, Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  swrap = require('./selection-wrapper');

  module.exports = MutationManager = (function() {
    function MutationManager(vimState) {
      this.vimState = vimState;
      this.editor = this.vimState.editor;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.emitter = new Emitter;
      this.markerLayer = this.editor.addMarkerLayer();
      this.mutationsBySelection = new Map;
    }

    MutationManager.prototype.destroy = function() {
      var ref1;
      this.reset();
      return ref1 = {}, this.mutationsBySelection = ref1.mutationsBySelection, this.editor = ref1.editor, this.vimState = ref1.vimState, ref1;
    };

    MutationManager.prototype.init = function(options1) {
      this.options = options1;
      return this.reset();
    };

    MutationManager.prototype.reset = function() {
      var j, len, marker, ref1;
      ref1 = this.markerLayer.getMarkers();
      for (j = 0, len = ref1.length; j < len; j++) {
        marker = ref1[j];
        marker.destroy();
      }
      return this.mutationsBySelection.clear();
    };

    MutationManager.prototype.saveInitialPointForSelection = function(selection) {
      var point;
      if (this.vimState.isMode('visual')) {
        point = swrap(selection).getBufferPositionFor('head', {
          fromProperty: true,
          allowFallback: true
        });
      } else {
        if (!this.options.isSelect) {
          point = swrap(selection).getBufferPositionFor('head');
        }
      }
      if (this.options.useMarker) {
        point = this.markerLayer.markBufferPosition(point, {
          invalidate: 'never'
        });
      }
      return point;
    };

    MutationManager.prototype.getInitialPointForSelection = function(selection) {
      var ref1;
      return (ref1 = this.mutationsBySelection.get(selection)) != null ? ref1.initialPoint : void 0;
    };

    MutationManager.prototype.setCheckPoint = function(checkPoint) {
      var createdAt, initialPoint, j, len, mutation, options, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        selection = ref1[j];
        if (!this.mutationsBySelection.has(selection)) {
          createdAt = checkPoint;
          initialPoint = this.saveInitialPointForSelection(selection);
          options = {
            selection: selection,
            initialPoint: initialPoint,
            createdAt: createdAt,
            markerLayer: this.markerLayer
          };
          this.mutationsBySelection.set(selection, new Mutation(options));
        }
        mutation = this.mutationsBySelection.get(selection);
        results.push(mutation.update(checkPoint));
      }
      return results;
    };

    MutationManager.prototype.getMutationForSelection = function(selection) {
      return this.mutationsBySelection.get(selection);
    };

    MutationManager.prototype.getMarkerBufferRanges = function() {
      var ranges;
      ranges = [];
      this.mutationsBySelection.forEach(function(mutation, selection) {
        var range, ref1;
        if (range = (ref1 = mutation.marker) != null ? ref1.getBufferRange() : void 0) {
          return ranges.push(range);
        }
      });
      return ranges;
    };

    MutationManager.prototype.restoreInitialPositions = function() {
      var j, len, point, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        selection = ref1[j];
        if (point = this.getInitialPointForSelection(selection)) {
          results.push(selection.cursor.setBufferPosition(point));
        }
      }
      return results;
    };

    MutationManager.prototype.restoreCursorPositions = function(options) {
      var clipToMutationEnd, i, isBlockwise, j, k, len, len1, mutation, mutationEnd, point, points, ref1, ref2, ref3, results, results1, selection, stay, strict;
      stay = options.stay, strict = options.strict, clipToMutationEnd = options.clipToMutationEnd, isBlockwise = options.isBlockwise, mutationEnd = options.mutationEnd;
      if (isBlockwise) {
        points = [];
        this.mutationsBySelection.forEach(function(mutation, selection) {
          var ref1;
          return points.push((ref1 = mutation.checkPoint['will-select']) != null ? ref1.start : void 0);
        });
        points = points.sort(function(a, b) {
          return a.compare(b);
        });
        points = points.filter(function(point) {
          return point != null;
        });
        if (this.vimState.isMode('visual', 'blockwise')) {
          if (point = points[0]) {
            return (ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.setHeadBufferPosition(point) : void 0;
          }
        } else {
          if (point = points[0]) {
            return this.editor.setCursorBufferPosition(point);
          } else {
            ref2 = this.editor.getSelections();
            results = [];
            for (j = 0, len = ref2.length; j < len; j++) {
              selection = ref2[j];
              if (!selection.isLastSelection()) {
                results.push(selection.destroy());
              } else {
                results.push(void 0);
              }
            }
            return results;
          }
        }
      } else {
        ref3 = this.editor.getSelections();
        results1 = [];
        for (i = k = 0, len1 = ref3.length; k < len1; i = ++k) {
          selection = ref3[i];
          if (!(mutation = this.mutationsBySelection.get(selection))) {
            continue;
          }
          if (strict && mutation.createdAt !== 'will-select') {
            selection.destroy();
            continue;
          }
          if (point = mutation.getRestorePoint({
            stay: stay,
            clipToMutationEnd: clipToMutationEnd,
            mutationEnd: mutationEnd
          })) {
            results1.push(selection.cursor.setBufferPosition(point));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    };

    return MutationManager;

  })();

  Mutation = (function() {
    function Mutation(options) {
      this.selection = options.selection, this.initialPoint = options.initialPoint, this.createdAt = options.createdAt, this.markerLayer = options.markerLayer;
      this.checkPoint = {};
      this.marker = null;
    }

    Mutation.prototype.update = function(checkPoint) {
      var ref1;
      if (!this.selection.getBufferRange().isEmpty()) {
        if ((ref1 = this.marker) != null) {
          ref1.destroy();
        }
        this.marker = null;
      }
      if (this.marker == null) {
        this.marker = this.markerLayer.markBufferRange(this.selection.getBufferRange(), {
          invalidate: 'never'
        });
      }
      return this.checkPoint[checkPoint] = this.marker.getBufferRange();
    };

    Mutation.prototype.getMutationEnd = function() {
      var range;
      range = this.marker.getBufferRange();
      if (range.isEmpty()) {
        return range.end;
      } else {
        return range.end.translate([0, -1]);
      }
    };

    Mutation.prototype.getRestorePoint = function(options) {
      var clipToMutationEnd, mutationEnd, point, ref1, stay;
      if (options == null) {
        options = {};
      }
      stay = options.stay, clipToMutationEnd = options.clipToMutationEnd, mutationEnd = options.mutationEnd;
      if (stay) {
        if (this.initialPoint instanceof Point) {
          point = this.initialPoint;
        } else {
          point = this.initialPoint.getHeadBufferPosition();
        }
        if (clipToMutationEnd) {
          return Point.min(this.getMutationEnd(), point);
        } else {
          return point;
        }
      } else {
        if (mutationEnd) {
          return this.getMutationEnd();
        } else {
          return (ref1 = this.checkPoint['did-select']) != null ? ref1.start : void 0;
        }
      }
    };

    return Mutation;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tdXRhdGlvbi1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBd0MsT0FBQSxDQUFRLE1BQVIsQ0FBeEMsRUFBQyxpQkFBRCxFQUFRLHFCQUFSLEVBQWlCOztFQUNqQixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQWFSLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx5QkFBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFdBQUQ7TUFDWCxJQUFDLENBQUEsU0FBVSxJQUFDLENBQUEsU0FBWDtNQUVGLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkIsQ0FBakI7TUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFFZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBO01BQ2YsSUFBQyxDQUFBLG9CQUFELEdBQXdCLElBQUk7SUFSakI7OzhCQVViLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7YUFDQSxPQUE4QyxFQUE5QyxFQUFDLElBQUMsQ0FBQSw0QkFBQSxvQkFBRixFQUF3QixJQUFDLENBQUEsY0FBQSxNQUF6QixFQUFpQyxJQUFDLENBQUEsZ0JBQUEsUUFBbEMsRUFBQTtJQUZPOzs4QkFJVCxJQUFBLEdBQU0sU0FBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFVBQUQ7YUFDTCxJQUFDLENBQUEsS0FBRCxDQUFBO0lBREk7OzhCQUdOLEtBQUEsR0FBTyxTQUFBO0FBQ0wsVUFBQTtBQUFB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QUEsR0FBUSxJQUFDLENBQUEsYUFEWDtTQUFBLE1BQUE7VUFHRSxLQUFBLEdBQVEsSUFBQyxDQUFBLFlBQVksQ0FBQyxxQkFBZCxDQUFBLEVBSFY7O1FBS0EsSUFBRyxpQkFBSDtpQkFDRSxLQUFLLENBQUMsR0FBTixDQUFVLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBVixFQUE2QixLQUE3QixFQURGO1NBQUEsTUFBQTtpQkFHRSxNQUhGO1NBTkY7T0FBQSxNQUFBO1FBV0UsSUFBRyxXQUFIO2lCQUNFLElBQUMsQ0FBQSxjQUFELENBQUEsRUFERjtTQUFBLE1BQUE7c0VBRzJCLENBQUUsZUFIN0I7U0FYRjs7SUFGZTs7Ozs7QUFsSW5CIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50LCBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbiMga2VlcCBtdXRhdGlvbiBzbmFwc2hvdCBuZWNlc3NhcnkgZm9yIE9wZXJhdG9yIHByb2Nlc3NpbmcuXG4jIG11dGF0aW9uIHN0b3JlZCBieSBlYWNoIFNlbGVjdGlvbiBoYXZlIGZvbGxvd2luZyBmaWVsZFxuIyAgbWFya2VyOlxuIyAgICBtYXJrZXIgdG8gdHJhY2sgbXV0YXRpb24uIG1hcmtlciBpcyBjcmVhdGVkIHdoZW4gYHNldENoZWNrUG9pbnRgXG4jICBjcmVhdGVkQXQ6XG4jICAgICdzdHJpbmcnIHJlcHJlc2VudGluZyB3aGVuIG1hcmtlciB3YXMgY3JlYXRlZC5cbiMgIGNoZWNrUG9pbnQ6IHt9XG4jICAgIGtleSBpcyBbJ3dpbGwtc2VsZWN0JywgJ2RpZC1zZWxlY3QnLCAnd2lsbC1tdXRhdGUnLCAnZGlkLW11dGF0ZSddXG4jICAgIGtleSBpcyBjaGVja3BvaW50LCB2YWx1ZSBpcyBidWZmZXJSYW5nZSBmb3IgbWFya2VyIGF0IHRoYXQgY2hlY2twb2ludFxuIyAgc2VsZWN0aW9uOlxuIyAgICBTZWxlY3Rpb24gYmVlaW5nIHRyYWNrZWRcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE11dGF0aW9uTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvcn0gPSBAdmltU3RhdGVcblxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQG1hcmtlckxheWVyID0gQGVkaXRvci5hZGRNYXJrZXJMYXllcigpXG4gICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uID0gbmV3IE1hcFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHJlc2V0KClcbiAgICB7QG11dGF0aW9uc0J5U2VsZWN0aW9uLCBAZWRpdG9yLCBAdmltU3RhdGV9ID0ge31cblxuICBpbml0OiAoQG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcblxuICByZXNldDogLT5cbiAgICBtYXJrZXIuZGVzdHJveSgpIGZvciBtYXJrZXIgaW4gQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5jbGVhcigpXG5cbiAgc2F2ZUluaXRpYWxQb2ludEZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBpZiBAdmltU3RhdGUuaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgcG9pbnQgPSBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlLCBhbGxvd0ZhbGxiYWNrOiB0cnVlKVxuICAgIGVsc2VcbiAgICAgIHBvaW50ID0gc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignaGVhZCcpIHVubGVzcyBAb3B0aW9ucy5pc1NlbGVjdFxuICAgIGlmIEBvcHRpb25zLnVzZU1hcmtlclxuICAgICAgcG9pbnQgPSBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclBvc2l0aW9uKHBvaW50LCBpbnZhbGlkYXRlOiAnbmV2ZXInKVxuICAgIHBvaW50XG5cbiAgZ2V0SW5pdGlhbFBvaW50Rm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKT8uaW5pdGlhbFBvaW50XG5cbiAgc2V0Q2hlY2tQb2ludDogKGNoZWNrUG9pbnQpIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgdW5sZXNzIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5oYXMoc2VsZWN0aW9uKVxuICAgICAgICBjcmVhdGVkQXQgPSBjaGVja1BvaW50XG4gICAgICAgIGluaXRpYWxQb2ludCA9IEBzYXZlSW5pdGlhbFBvaW50Rm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgICAgb3B0aW9ucyA9IHtzZWxlY3Rpb24sIGluaXRpYWxQb2ludCwgY3JlYXRlZEF0LCBAbWFya2VyTGF5ZXJ9XG4gICAgICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLCBuZXcgTXV0YXRpb24ob3B0aW9ucykpXG4gICAgICBtdXRhdGlvbiA9IEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKVxuICAgICAgbXV0YXRpb24udXBkYXRlKGNoZWNrUG9pbnQpXG5cbiAgZ2V0TXV0YXRpb25Gb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG5cbiAgZ2V0TWFya2VyQnVmZmVyUmFuZ2VzOiAtPlxuICAgIHJhbmdlcyA9IFtdXG4gICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLmZvckVhY2ggKG11dGF0aW9uLCBzZWxlY3Rpb24pIC0+XG4gICAgICBpZiByYW5nZSA9IG11dGF0aW9uLm1hcmtlcj8uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgICByYW5nZXNcblxuICByZXN0b3JlSW5pdGlhbFBvc2l0aW9uczogLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpIHdoZW4gcG9pbnQgPSBAZ2V0SW5pdGlhbFBvaW50Rm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgIHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgcmVzdG9yZUN1cnNvclBvc2l0aW9uczogKG9wdGlvbnMpIC0+XG4gICAge3N0YXksIHN0cmljdCwgY2xpcFRvTXV0YXRpb25FbmQsIGlzQmxvY2t3aXNlLCBtdXRhdGlvbkVuZH0gPSBvcHRpb25zXG4gICAgaWYgaXNCbG9ja3dpc2VcbiAgICAgICMgW0ZJWE1FXSB3aHkgSSBuZWVkIHRoaXMgZGlyZWN0IG1hbnVwaWxhdGlvbj9cbiAgICAgICMgQmVjYXVzZSB0aGVyZSdzIGJ1ZyB0aGF0IGJsb2Nrd2lzZSBzZWxlY2N0aW9uIGlzIG5vdCBhZGRlcyB0byBlYWNoXG4gICAgICAjIGJzSW5zdGFuY2Uuc2VsZWN0aW9uLiBOZWVkIGludmVzdGlnYXRpb24uXG4gICAgICBwb2ludHMgPSBbXVxuICAgICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLmZvckVhY2ggKG11dGF0aW9uLCBzZWxlY3Rpb24pIC0+XG4gICAgICAgIHBvaW50cy5wdXNoKG11dGF0aW9uLmNoZWNrUG9pbnRbJ3dpbGwtc2VsZWN0J10/LnN0YXJ0KVxuICAgICAgcG9pbnRzID0gcG9pbnRzLnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuICAgICAgcG9pbnRzID0gcG9pbnRzLmZpbHRlciAocG9pbnQpIC0+IHBvaW50P1xuICAgICAgaWYgQHZpbVN0YXRlLmlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICAgIGlmIHBvaW50ID0gcG9pbnRzWzBdXG4gICAgICAgICAgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKT8uc2V0SGVhZEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgZWxzZVxuICAgICAgICBpZiBwb2ludCA9IHBvaW50c1swXVxuICAgICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgICBzZWxlY3Rpb24uZGVzdHJveSgpIHVubGVzcyBzZWxlY3Rpb24uaXNMYXN0U2VsZWN0aW9uKClcbiAgICBlbHNlXG4gICAgICBmb3Igc2VsZWN0aW9uLCBpIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpIHdoZW4gbXV0YXRpb24gPSBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcbiAgICAgICAgaWYgc3RyaWN0IGFuZCBtdXRhdGlvbi5jcmVhdGVkQXQgaXNudCAnd2lsbC1zZWxlY3QnXG4gICAgICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgaWYgcG9pbnQgPSBtdXRhdGlvbi5nZXRSZXN0b3JlUG9pbnQoe3N0YXksIGNsaXBUb011dGF0aW9uRW5kLCBtdXRhdGlvbkVuZH0pXG4gICAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuIyBtdXRhdGlvbiBpbmZvcm1hdGlvbiBpcyBjcmVhdGVkIGV2ZW4gaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuIyBTbyB0aGF0IHdlIGNhbiBmaWx0ZXIgc2VsZWN0aW9uIGJ5IHdoZW4gaXQgd2FzIGNyZWF0ZWQuXG4jIGUuZy4gc29tZSBzZWxlY3Rpb24gaXMgY3JlYXRlZCBhdCAnd2lsbC1zZWxlY3QnIGNoZWNrcG9pbnQsIG90aGVycyBhdCAnZGlkLXNlbGVjdCdcbiMgVGhpcyBpcyBpbXBvcnRhbnQgc2luY2Ugd2hlbiBvY2N1cnJlbmNlIG1vZGlmaWVyIGlzIHVzZWQsIHNlbGVjdGlvbiBpcyBjcmVhdGVkIGF0IHRhcmdldC5zZWxlY3QoKVxuIyBJbiB0aGF0IGNhc2Ugc29tZSBzZWxlY3Rpb24gaGF2ZSBjcmVhdGVkQXQgPSBgZGlkLXNlbGVjdGAsIGFuZCBvdGhlcnMgaXMgY3JlYXRlZEF0ID0gYHdpbGwtc2VsZWN0YFxuY2xhc3MgTXV0YXRpb25cbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHtAc2VsZWN0aW9uLCBAaW5pdGlhbFBvaW50LCBAY3JlYXRlZEF0LCBAbWFya2VyTGF5ZXJ9ID0gb3B0aW9uc1xuICAgIEBjaGVja1BvaW50ID0ge31cbiAgICBAbWFya2VyID0gbnVsbFxuXG4gIHVwZGF0ZTogKGNoZWNrUG9pbnQpIC0+XG4gICAgIyBDdXJyZW50IG5vbi1lbXB0eSBzZWxlY3Rpb24gaXMgcHJpb3JpdGl6ZWQgb3ZlciBtYXJrZXIncyByYW5nZS5cbiAgICAjIFdlIGl2YWxpZGF0ZSBvbGQgbWFya2VyIHRvIHJlLXRyYWNrIGZyb20gY3VycmVudCBzZWxlY3Rpb24uXG4gICAgdW5sZXNzIEBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5pc0VtcHR5KClcbiAgICAgIEBtYXJrZXI/LmRlc3Ryb3koKVxuICAgICAgQG1hcmtlciA9IG51bGxcblxuICAgIEBtYXJrZXIgPz0gQG1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShAc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCksIGludmFsaWRhdGU6ICduZXZlcicpXG4gICAgQGNoZWNrUG9pbnRbY2hlY2tQb2ludF0gPSBAbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICBnZXRNdXRhdGlvbkVuZDogLT5cbiAgICByYW5nZSA9IEBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGlmIHJhbmdlLmlzRW1wdHkoKVxuICAgICAgcmFuZ2UuZW5kXG4gICAgZWxzZVxuICAgICAgcmFuZ2UuZW5kLnRyYW5zbGF0ZShbMCwgLTFdKVxuXG4gIGdldFJlc3RvcmVQb2ludDogKG9wdGlvbnM9e30pIC0+XG4gICAge3N0YXksIGNsaXBUb011dGF0aW9uRW5kLCBtdXRhdGlvbkVuZH0gPSBvcHRpb25zXG4gICAgaWYgc3RheVxuICAgICAgaWYgQGluaXRpYWxQb2ludCBpbnN0YW5jZW9mIFBvaW50XG4gICAgICAgIHBvaW50ID0gQGluaXRpYWxQb2ludFxuICAgICAgZWxzZVxuICAgICAgICBwb2ludCA9IEBpbml0aWFsUG9pbnQuZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcblxuICAgICAgaWYgY2xpcFRvTXV0YXRpb25FbmRcbiAgICAgICAgUG9pbnQubWluKEBnZXRNdXRhdGlvbkVuZCgpLCBwb2ludClcbiAgICAgIGVsc2VcbiAgICAgICAgcG9pbnRcbiAgICBlbHNlXG4gICAgICBpZiBtdXRhdGlvbkVuZFxuICAgICAgICBAZ2V0TXV0YXRpb25FbmQoKVxuICAgICAgZWxzZVxuICAgICAgICBAY2hlY2tQb2ludFsnZGlkLXNlbGVjdCddPy5zdGFydFxuIl19
