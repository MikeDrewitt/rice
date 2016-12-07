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
            var bookmark = _this.markerLayer.markBufferRange(range, { invalidate: "surround" });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL25vZGVfbW9kdWxlcy9ib29rbWFya3MvbGliL2Jvb2ttYXJrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUVrQyxNQUFNOztJQUVuQixTQUFTO2VBQVQsU0FBUzs7V0FDVCxxQkFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLGFBQU8sSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7S0FDekU7OztBQUVXLFdBTE8sU0FBUyxDQUtmLE1BQU0sRUFBRSxXQUFXLEVBQUU7MEJBTGYsU0FBUzs7QUFNMUIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDcEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtBQUNoRixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsU0FBTyxZQUFZLEVBQUMsQ0FBQyxDQUFBO0FBQ3BILFFBQUksQ0FBQyxXQUFXLEdBQUcsK0JBQXlCLENBQUE7QUFDNUMsUUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3RFLGlDQUEyQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUMzRCx1Q0FBaUMsRUFBRSxJQUFJLENBQUMsa0JB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QUssTUFBTSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFBO0FBQ3hGLGlCQUFLLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFBOztPQUNyQyxNQUFNO0FBQ0wsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO09BQ1o7S0FDRjs7O1dBRXNCLGtDQUFHOzs7QUFDeEIsVUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsRUFBRTs7QUFDekMsY0FBTSxTQUFTLEdBQUcsT0FBSyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxHQUFHLENBQUE7QUFDdEYsY0FBTSxPQUFPLEdBQUcsT0FBSyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7bUJBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7V0FBQSxDQUFDLENBQUE7QUFDMUUsY0FBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQU07bUJBQUssTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsU0FBUztXQUFBLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDNUcsaUJBQUssTUFBTSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFBO0FBQ3hGLGlCQUFLLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFBOztPQUNyQyxNQUFNO0FBQ0wsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO09BQ1o7S0FDRjs7O1NBL0VrQixTQUFTOzs7cUJBQVQsU0FBUyIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItYmV0YS9zcmMvYXRvbS0xLjEzLjAtYmV0YTYvb3V0L2FwcC9ub2RlX21vZHVsZXMvYm9va21hcmtzL2xpYi9ib29rbWFya3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQm9va21hcmtzIHtcbiAgc3RhdGljIGRlc2VyaWFsaXplIChlZGl0b3IsIHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBCb29rbWFya3MoZWRpdG9yLCBlZGl0b3IuZ2V0TWFya2VyTGF5ZXIoc3RhdGUubWFya2VyTGF5ZXJJZCkpXG4gIH1cblxuICBjb25zdHJ1Y3RvciAoZWRpdG9yLCBtYXJrZXJMYXllcikge1xuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yXG4gICAgdGhpcy5tYXJrZXJMYXllciA9IG1hcmtlckxheWVyIHx8IHRoaXMuZWRpdG9yLmFkZE1hcmtlckxheWVyKHtwZXJzaXN0ZW50OiB0cnVlfSlcbiAgICB0aGlzLmRlY29yYXRpb25MYXllciA9IHRoaXMuZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIodGhpcy5tYXJrZXJMYXllciwge3R5cGU6IFwibGluZS1udW1iZXJcIiwgY2xhc3M6IFwiYm9va21hcmtlZFwifSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmVkaXRvciksIHtcbiAgICAgIFwiYm9va21hcmtzOnRvZ2dsZS1ib29rbWFya1wiOiB0aGlzLnRvZ2dsZUJvb2ttYXJrLmJpbmQodGhpcyksXG4gICAgICBcImJvb2ttYXJrczpqdW1wLXRvLW5leHQtYm9va21hcmtcIjogdGhpcy5qdW1wVG9OZXh0Qm9va21hcmsuYmluZCh0aGlzKSxcbiAgICAgIFwiYm9va21hcmtzOmp1bXAtdG8tcHJldmlvdXMtYm9va21hcmtcIjogdGhpcy5qdW1wVG9QcmV2aW91c0Jvb2ttYXJrLmJpbmQodGhpcyksXG4gICAgICBcImJvb2ttYXJrczpjbGVhci1ib29rbWFya3NcIjogdGhpcy5jbGVhckJvb2ttYXJrcy5iaW5kKHRoaXMpXG4gICAgfSkpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQodGhpcy5lZGl0b3Iub25EaWREZXN0cm95KHRoaXMuZGVzdHJveS5iaW5kKHRoaXMpKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZSgpXG4gICAgdGhpcy5tYXJrZXJMYXllci5kZXN0cm95KClcbiAgfVxuXG4gIGRlYWN0aXZhdGUgKCkge1xuICAgIHRoaXMuZGVjb3JhdGlvbkxheWVyLmRlc3Ryb3koKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBzZXJpYWxpemUgKCkge1xuICAgIHJldHVybiB7bWFya2VyTGF5ZXJJZDogdGhpcy5tYXJrZXJMYXllci5pZH1cbiAgfVxuXG4gIHRvZ2dsZUJvb2ttYXJrICgpIHtcbiAgICBmb3IgKGNvbnN0IHJhbmdlIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKCkpIHtcbiAgICAgIGNvbnN0IGJvb2ttYXJrcyA9IHRoaXMubWFya2VyTGF5ZXIuZmluZE1hcmtlcnMoe2ludGVyc2VjdHNSb3dSYW5nZTogW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd119KVxuICAgICAgaWYgKGJvb2ttYXJrcyAmJiBib29rbWFya3MubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IGJvb2ttYXJrIG9mIGJvb2ttYXJrcykge1xuICAgICAgICAgIGJvb2ttYXJrLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBib29rbWFyayA9IHRoaXMubWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKHJhbmdlLCB7aW52YWxpZGF0ZTogXCJzdXJyb3VuZFwifSlcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYm9va21hcmsub25EaWRDaGFuZ2UoKHtpc1ZhbGlkfSkgPT4ge1xuICAgICAgICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgICAgICAgYm9va21hcmsuZGVzdHJveSgpXG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjbGVhckJvb2ttYXJrcyAoKSB7XG4gICAgZm9yIChjb25zdCBib29rbWFyayBvZiB0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlcnMoKSkge1xuICAgICAgYm9va21hcmsuZGVzdHJveSgpXG4gICAgfVxuICB9XG5cbiAganVtcFRvTmV4dEJvb2ttYXJrICgpIHtcbiAgICBpZiAodGhpcy5tYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpID4gMCkge1xuICAgICAgY29uc3QgYnVmZmVyUm93ID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLmdldFN0YXJ0QnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlcnMoKS5zb3J0KChhLCBiKSA9PiBhLmNvbXBhcmUoYikpXG4gICAgICBjb25zdCBib29rbWFya01hcmtlciA9IG1hcmtlcnMuZmluZCgobWFya2VyKSA9PiBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydC5yb3cgPiBidWZmZXJSb3cpIHx8IG1hcmtlcnNbMF1cbiAgICAgIHRoaXMuZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoYm9va21hcmtNYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSwge2F1dG9zY3JvbGw6IGZhbHNlfSlcbiAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuICAgIH0gZWxzZSB7XG4gICAgICBhdG9tLmJlZXAoKVxuICAgIH1cbiAgfVxuXG4gIGp1bXBUb1ByZXZpb3VzQm9va21hcmsgKCkge1xuICAgIGlmICh0aGlzLm1hcmtlckxheWVyLmdldE1hcmtlckNvdW50KCkgPiAwKSB7XG4gICAgICBjb25zdCBidWZmZXJSb3cgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0TWFya2VyKCkuZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMubWFya2VyTGF5ZXIuZ2V0TWFya2VycygpLnNvcnQoKGEsIGIpID0+IGIuY29tcGFyZShhKSlcbiAgICAgIGNvbnN0IGJvb2ttYXJrTWFya2VyID0gbWFya2Vycy5maW5kKChtYXJrZXIpID0+IG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0LnJvdyA8IGJ1ZmZlclJvdykgfHwgbWFya2Vyc1swXVxuICAgICAgdGhpcy5lZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShib29rbWFya01hcmtlci5nZXRCdWZmZXJSYW5nZSgpLCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuICAgICAgdGhpcy5lZGl0b3Iuc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbigpXG4gICAgfSBlbHNlIHtcbiAgICAgIGF0b20uYmVlcCgpXG4gICAgfVxuICB9XG59XG4iXX0=