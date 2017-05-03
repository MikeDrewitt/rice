Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** @babel */

var _atom = require('atom');

var Bookmarks = (function () {
  _createClass(Bookmarks, null, [{
    key: "deserialize",
    value: function deserialize(editor, state) {
      return new Bookmarks(editor, editor.getMarkerLayer(state.markerLayerId));
    }
  }]);

  function Bookmarks(editor, markerLayer) {
    _classCallCheck(this, Bookmarks);

    this.editor = editor;
    this.markerLayer = markerLayer || this.editor.addMarkerLayer({ persistent: true });
    this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, { type: "line-number", "class": "bookmarked" });
    this.disposables = new _atom.CompositeDisposable();
    this.disposables.add(atom.commands.add(atom.views.getView(this.editor), {
      "bookmarks:toggle-bookmark": this.toggleBookmark.bind(this),
      "bookmarks:jump-to-next-bookmark": this.jumpToNextBookmark.bind(this),
      "bookmarks:jump-to-previous-bookmark": this.jumpToPreviousBookmark.bind(this),
      "bookmarks:clear-bookmarks": this.clearBookmarks.bind(this)
    }));
    this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)));
  }

  _createClass(Bookmarks, [{
    key: "destroy",
    value: function destroy() {
      this.deactivate();
      this.markerLayer.destroy();
    }
  }, {
    key: "deactivate",
    value: function deactivate() {
      this.decorationLayer.destroy();
      this.disposables.dispose();
    }
  }, {
    key: "serialize",
    value: function serialize() {
      return { markerLayerId: this.markerLayer.id };
    }
  }, {
    key: "toggleBookmark",
    value: function toggleBookmark() {
      var _this = this;

      for (var range of this.editor.getSelectedBufferRanges()) {
        var bookmarks = this.markerLayer.findMarkers({ intersectsRowRange: [range.start.row, range.end.row] });
        if (bookmarks && bookmarks.length > 0) {
          for (var bookmark of bookmarks) {
            bookmark.destroy();
          }
        } else {
          (function () {
            var bookmark = _this.markerLayer.markBufferRange(range, { invalidate: "surround", exclusive: true });
            _this.disposables.add(bookmark.onDidChange(function (_ref) {
              var isValid = _ref.isValid;

              if (!isValid) {
                bookmark.destroy();
              }
            }));
          })();
        }
      }
    }
  }, {
    key: "clearBookmarks",
    value: function clearBookmarks() {
      for (var bookmark of this.markerLayer.getMarkers()) {
        bookmark.destroy();
      }
    }
  }, {
    key: "jumpToNextBookmark",
    value: function jumpToNextBookmark() {
      var _this2 = this;

      if (this.markerLayer.getMarkerCount() > 0) {
        (function () {
          var bufferRow = _this2.editor.getLastCursor().getMarker().getStartBufferPosition().row;
          var markers = _this2.markerLayer.getMarkers().sort(function (a, b) {
            return a.compare(b);
          });
          var bookmarkMarker = markers.find(function (marker) {
            return marker.getBufferRange().start.row > bufferRow;
          }) || markers[0];
          _this2.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), { autoscroll: false });
          _this2.editor.scrollToCursorPosition();
        })();
      } else {
        atom.beep();
      }
    }
  }, {
    key: "jumpToPreviousBookmark",
    value: function jumpToPreviousBookmark() {
      var _this3 = this;

      if (this.markerLayer.getMarkerCount() > 0) {
        (function () {
          var bufferRow = _this3.editor.getLastCursor().getMarker().getStartBufferPosition().row;
          var markers = _this3.markerLayer.getMarkers().sort(function (a, b) {
            return b.compare(a);
          });
          var bookmarkMarker = markers.find(function (marker) {
            return marker.getBufferRange().start.row < bufferRow;
          }) || markers[0];
          _this3.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), { autoscroll: false });
          _this3.editor.scrollToCursorPosition();
        })();
      } else {
        atom.beep();
      }
    }
  }]);

  return Bookmarks;
})();

exports["default"] = Bookmarks;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYm9va21hcmtzL2xpYi9ib29rbWFya3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFa0MsTUFBTTs7SUFFbkIsU0FBUztlQUFULFNBQVM7O1dBQ1QscUJBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUNqQyxhQUFPLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFBO0tBQ3pFOzs7QUFFVyxXQUxPLFNBQVMsQ0FLZixNQUFNLEVBQUUsV0FBVyxFQUFFOzBCQUxmLFNBQVM7O0FBTTFCLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0FBQ3BCLFFBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7QUFDaEYsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLFNBQU8sWUFBWSxFQUFDLENBQUMsQ0FBQTtBQUNwSCxRQUFJLENBQUMsV0FBVyxHQUFHLCtCQUF5QixDQUFBO0FBQzVDLFFBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN0RSxpQ0FBMkIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDM0QsdUNBQWlDLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUks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L291dC9hcHAvbm9kZV9tb2R1bGVzL2Jvb2ttYXJrcy9saWIvYm9va21hcmtzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJvb2ttYXJrcyB7XG4gIHN0YXRpYyBkZXNlcmlhbGl6ZSAoZWRpdG9yLCBzdGF0ZSkge1xuICAgIHJldHVybiBuZXcgQm9va21hcmtzKGVkaXRvciwgZWRpdG9yLmdldE1hcmtlckxheWVyKHN0YXRlLm1hcmtlckxheWVySWQpKVxuICB9XG5cbiAgY29uc3RydWN0b3IgKGVkaXRvciwgbWFya2VyTGF5ZXIpIHtcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvclxuICAgIHRoaXMubWFya2VyTGF5ZXIgPSBtYXJrZXJMYXllciB8fCB0aGlzLmVkaXRvci5hZGRNYXJrZXJMYXllcih7cGVyc2lzdGVudDogdHJ1ZX0pXG4gICAgdGhpcy5kZWNvcmF0aW9uTGF5ZXIgPSB0aGlzLmVkaXRvci5kZWNvcmF0ZU1hcmtlckxheWVyKHRoaXMubWFya2VyTGF5ZXIsIHt0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcImJvb2ttYXJrZWRcIn0pXG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZChhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5lZGl0b3IpLCB7XG4gICAgICBcImJvb2ttYXJrczp0b2dnbGUtYm9va21hcmtcIjogdGhpcy50b2dnbGVCb29rbWFyay5iaW5kKHRoaXMpLFxuICAgICAgXCJib29rbWFya3M6anVtcC10by1uZXh0LWJvb2ttYXJrXCI6IHRoaXMuanVtcFRvTmV4dEJvb2ttYXJrLmJpbmQodGhpcyksXG4gICAgICBcImJvb2ttYXJrczpqdW1wLXRvLXByZXZpb3VzLWJvb2ttYXJrXCI6IHRoaXMuanVtcFRvUHJldmlvdXNCb29rbWFyay5iaW5kKHRoaXMpLFxuICAgICAgXCJib29rbWFya3M6Y2xlYXItYm9va21hcmtzXCI6IHRoaXMuY2xlYXJCb29rbWFya3MuYmluZCh0aGlzKVxuICAgIH0pKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMuZWRpdG9yLm9uRGlkRGVzdHJveSh0aGlzLmRlc3Ryb3kuYmluZCh0aGlzKSkpXG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLmRlYWN0aXZhdGUoKVxuICAgIHRoaXMubWFya2VyTGF5ZXIuZGVzdHJveSgpXG4gIH1cblxuICBkZWFjdGl2YXRlICgpIHtcbiAgICB0aGlzLmRlY29yYXRpb25MYXllci5kZXN0cm95KClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICB9XG5cbiAgc2VyaWFsaXplICgpIHtcbiAgICByZXR1cm4ge21hcmtlckxheWVySWQ6IHRoaXMubWFya2VyTGF5ZXIuaWR9XG4gIH1cblxuICB0b2dnbGVCb29rbWFyayAoKSB7XG4gICAgZm9yIChjb25zdCByYW5nZSBvZiB0aGlzLmVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcygpKSB7XG4gICAgICBjb25zdCBib29rbWFya3MgPSB0aGlzLm1hcmtlckxheWVyLmZpbmRNYXJrZXJzKHtpbnRlcnNlY3RzUm93UmFuZ2U6IFtyYW5nZS5zdGFydC5yb3csIHJhbmdlLmVuZC5yb3ddfSlcbiAgICAgIGlmIChib29rbWFya3MgJiYgYm9va21hcmtzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCBib29rbWFyayBvZiBib29rbWFya3MpIHtcbiAgICAgICAgICBib29rbWFyay5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYm9va21hcmsgPSB0aGlzLm1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwge2ludmFsaWRhdGU6IFwic3Vycm91bmRcIiwgZXhjbHVzaXZlOiB0cnVlfSlcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYm9va21hcmsub25EaWRDaGFuZ2UoKHtpc1ZhbGlkfSkgPT4ge1xuICAgICAgICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgICAgICAgYm9va21hcmsuZGVzdHJveSgpXG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjbGVhckJvb2ttYXJrcyAoKSB7XG4gICAgZm9yIChjb25zdCBib29rbWFyayBvZiB0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlcnMoKSkge1xuICAgICAgYm9va21hcmsuZGVzdHJveSgpXG4gICAgfVxuICB9XG5cbiAganVtcFRvTmV4dEJvb2ttYXJrICgpIHtcbiAgICBpZiAodGhpcy5tYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpID4gMCkge1xuICAgICAgY29uc3QgYnVmZmVyUm93ID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlcnMoKS5zb3J0KChhLCBiKSA9PiBhLmNvbXBhcmUoYikpXG4gICAgICBjb25zdCBib29rbWFya01hcmtlciA9IG1hcmtlcnMuZmluZCgobWFya2VyKSA9PiBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydC5yb3cgPiBidWZmZXJSb3cpIHx8IG1hcmtlcnNbMF1cbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoYm9va21hcmtNYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSwge2F1dG9zY3JvbGw6IGZhbHNlfSlcbiAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuICAgIH0gZWxzZSB7XG4gICAgICBhdG9tLmJlZXAoKVxuICAgIH1cbiAgfVxuXG4gIGp1bXBUb1ByZXZpb3VzQm9va21hcmsgKCkge1xuICAgIGlmICh0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlckNvdW50KCkgPiAwKSB7XG4gICAgICBjb25zdCBidWZmZXJSb3cgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCkuZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMubWFya2VyTGF5ZXIuZ2V0TWFya2VycygpLnNvcnQoKGEsIGIpID0+IGIuY29tcGFyZShhKSlcbiAgICAgIGNvbnN0IGJvb2ttYXJrTWFya2VyID0gbWFya2Vycy5maW5kKChtYXJrZXIpID0+IG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0LnJvdyA8IGJ1ZmZlclJvdykgfHwgbWFya2Vyc1swXVxuICAgICAgdGhpcy5lZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShib29rbWFya01hcmtlci5nZXRCdWZmZXJSYW5nZSgpLCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuICAgICAgdGhpcy5lZGl0b3Iuc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbigpXG4gICAgfSBlbHNlIHtcbiAgICAgIGF0b20uYmVlcCgpXG4gICAgfVxuICB9XG59XG4iXX0=