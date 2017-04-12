'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var SnippetParser = (function () {
  function SnippetParser() {
    _classCallCheck(this, SnippetParser);
  }

  _createClass(SnippetParser, [{
    key: 'reset',
    value: function reset() {
      this.inSnippet = false;
      this.inSnippetBody = false;
      this.snippetStart = -1;
      this.snippetEnd = -1;
      this.bodyStart = -1;
      this.bodyEnd = -1;
      this.escapedBraceIndices = null;
    }
  }, {
    key: 'findSnippets',
    value: function findSnippets(text) {
      if (text.length <= 0 || text.indexOf('$') === -1) {
        return;
      } // No snippets
      this.reset();
      var snippets = [];

      // We're not using a regex because escaped right braces cannot be tracked without lookbehind,
      // which doesn't exist yet for javascript; consequently we need to iterate through each character.
      // This might feel ugly, but it's necessary.
      for (var index = 0; index < text.length; index++) {
        if (this.inSnippet && this.snippetEnd === index) {
          var body = text.slice(this.bodyStart, this.bodyEnd + 1);
          body = this.removeBraceEscaping(body, this.bodyStart, this.escapedBraceIndices);
          snippets.push({ snippetStart: this.snippetStart, snippetEnd: this.snippetEnd, bodyStart: this.bodyStart, bodyEnd: this.bodyEnd, body: body });
          this.reset();
          continue;
        }

        if (this.inSnippet && index >= this.bodyStart && index <= this.bodyEnd) {
          this.inBody = true;
        }
        if (this.inSnippet && (index > this.bodyEnd || index < this.bodyStart)) {
          this.inBody = false;
        }
        if (this.bodyStart === -1 || this.bodyEnd === -1) {
          this.inBody = false;
        }
        if (this.inSnippet && !this.inBody) {
          continue;
        }
        if (this.inSnippet && this.inBody) {
          continue;
        }

        // Determine if we've found a new snippet
        if (!this.inSnippet && text.indexOf('${', index) === index) {
          // Find index of colon
          var colonIndex = text.indexOf(':', index + 3);
          if (colonIndex !== -1) {
            // Disqualify snippet unless the text between '${' and ':' are digits
            var groupStart = index + 2;
            var groupEnd = colonIndex - 1;
            if (groupEnd >= groupStart) {
              for (var i = groupStart; i < groupEnd; i++) {
                if (isNaN(parseInt(text.charAt(i)))) {
                  colonIndex = -1;
                }
              }
            } else {
              colonIndex = -1;
            }
          }

          // Find index of '}'
          var rightBraceIndex = -1;
          if (colonIndex !== -1) {
            var i = index + 4;
            while (true) {
              rightBraceIndex = text.indexOf('}', i);
              if (rightBraceIndex === -1) {
                break;
              }
              if (text.charAt(rightBraceIndex - 1) === '\\') {
                if (this.escapedBraceIndices == null) {
                  this.escapedBraceIndices = [];
                }
                this.escapedBraceIndices.push(rightBraceIndex - 1);
              } else {
                break;
              }
              i = rightBraceIndex + 1;
            }
          }

          if (colonIndex !== -1 && rightBraceIndex !== -1 && colonIndex < rightBraceIndex) {
            this.inSnippet = true;
            this.inBody = false;
            this.snippetStart = index;
            this.snippetEnd = rightBraceIndex;
            this.bodyStart = colonIndex + 1;
            this.bodyEnd = rightBraceIndex - 1;
            continue;
          } else {
            this.reset();
          }
        }
      }

      return snippets;
    }
  }, {
    key: 'removeBraceEscaping',
    value: function removeBraceEscaping(body, bodyStart, escapedBraceIndices) {
      if (escapedBraceIndices != null) {
        for (var i = 0; i < escapedBraceIndices.length; i++) {
          var bodyIndex = escapedBraceIndices[i];
          body = removeCharFromString(body, bodyIndex - bodyStart - i);
        }
      }
      return body;
    }
  }]);

  return SnippetParser;
})();

exports['default'] = SnippetParser;
;

var removeCharFromString = function removeCharFromString(str, index) {
  return str.slice(0, index) + str.slice(index + 1);
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3NuaXBwZXQtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7OztJQUVVLGFBQWE7V0FBYixhQUFhOzBCQUFiLGFBQWE7OztlQUFiLGFBQWE7O1dBQzFCLGlCQUFHO0FBQ1AsVUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUE7QUFDdEIsVUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7QUFDMUIsVUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUN0QixVQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDbkIsVUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNqQixVQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFBO0tBQ2hDOzs7V0FFWSxzQkFBQyxJQUFJLEVBQUU7QUFDbEIsVUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQUUsZUFBTTtPQUFFO0FBQzVELFVBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUNaLFVBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTs7Ozs7QUFLbkIsV0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDaEQsWUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssS0FBSyxFQUFFO0FBQy9DLGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMs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UyxHQUFHLENBQUMsQ0FBQyxDQUFBO1NBQzdEO09BQ0Y7QUFDRCxhQUFPLElBQUksQ0FBQTtLQUNaOzs7U0E3RmtCLGFBQWE7OztxQkFBYixhQUFhO0FBOEZqQyxDQUFDOztBQUVGLElBQU0sb0JBQW9CLEdBQUcsU0FBdkIsb0JBQW9CLENBQUksR0FBRyxFQUFFLEtBQUs7U0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7Q0FBQSxDQUFBIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3NuaXBwZXQtcGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU25pcHBldFBhcnNlciB7XG4gIHJlc2V0ICgpIHtcbiAgICB0aGlzLmluU25pcHBldCA9IGZhbHNlXG4gICAgdGhpcy5pblNuaXBwZXRCb2R5ID0gZmFsc2VcbiAgICB0aGlzLnNuaXBwZXRTdGFydCA9IC0xXG4gICAgdGhpcy5zbmlwcGV0RW5kID0gLTFcbiAgICB0aGlzLmJvZHlTdGFydCA9IC0xXG4gICAgdGhpcy5ib2R5RW5kID0gLTFcbiAgICB0aGlzLmVzY2FwZWRCcmFjZUluZGljZXMgPSBudWxsXG4gIH1cblxuICBmaW5kU25pcHBldHMgKHRleHQpIHtcbiAgICBpZiAodGV4dC5sZW5ndGggPD0gMCB8fCB0ZXh0LmluZGV4T2YoJyQnKSA9PT0gLTEpIHsgcmV0dXJuIH0gLy8gTm8gc25pcHBldHNcbiAgICB0aGlzLnJlc2V0KClcbiAgICBjb25zdCBzbmlwcGV0cyA9IFtdXG5cbiAgICAvLyBXZSdyZSBub3QgdXNpbmcgYSByZWdleCBiZWNhdXNlIGVzY2FwZWQgcmlnaHQgYnJhY2VzIGNhbm5vdCBiZSB0cmFja2VkIHdpdGhvdXQgbG9va2JlaGluZCxcbiAgICAvLyB3aGljaCBkb2Vzbid0IGV4aXN0IHlldCBmb3IgamF2YXNjcmlwdDsgY29uc2VxdWVudGx5IHdlIG5lZWQgdG8gaXRlcmF0ZSB0aHJvdWdoIGVhY2ggY2hhcmFjdGVyLlxuICAgIC8vIFRoaXMgbWlnaHQgZmVlbCB1Z2x5LCBidXQgaXQncyBuZWNlc3NhcnkuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRleHQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAodGhpcy5pblNuaXBwZXQgJiYgdGhpcy5zbmlwcGV0RW5kID09PSBpbmRleCkge1xuICAgICAgICBsZXQgYm9keSA9IHRleHQuc2xpY2UodGhpcy5ib2R5U3RhcnQsIHRoaXMuYm9keUVuZCArIDEpXG4gICAgICAgIGJvZHkgPSB0aGlzLnJlbW92ZUJyYWNlRXNjYXBpbmcoYm9keSwgdGhpcy5ib2R5U3RhcnQsIHRoaXMuZXNjYXBlZEJyYWNlSW5kaWNlcylcbiAgICAgICAgc25pcHBldHMucHVzaCh7c25pcHBldFN0YXJ0OiB0aGlzLnNuaXBwZXRTdGFydCwgc25pcHBldEVuZDogdGhpcy5zbmlwcGV0RW5kLCBib2R5U3RhcnQ6IHRoaXMuYm9keVN0YXJ0LCBib2R5RW5kOiB0aGlzLmJvZHlFbmQsIGJvZHl9KVxuICAgICAgICB0aGlzLnJlc2V0KClcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaW5TbmlwcGV0ICYmIGluZGV4ID49IHRoaXMuYm9keVN0YXJ0ICYmIGluZGV4IDw9IHRoaXMuYm9keUVuZCkgeyB0aGlzLmluQm9keSA9IHRydWUgfVxuICAgICAgaWYgKHRoaXMuaW5TbmlwcGV0ICYmIChpbmRleCA+IHRoaXMuYm9keUVuZCB8fCBpbmRleCA8IHRoaXMuYm9keVN0YXJ0KSkgeyB0aGlzLmluQm9keSA9IGZhbHNlIH1cbiAgICAgIGlmICh0aGlzLmJvZHlTdGFydCA9PT0gLTEgfHwgdGhpcy5ib2R5RW5kID09PSAtMSkgeyB0aGlzLmluQm9keSA9IGZhbHNlIH1cbiAgICAgIGlmICh0aGlzLmluU25pcHBldCAmJiAhdGhpcy5pbkJvZHkpIHsgY29udGludWUgfVxuICAgICAgaWYgKHRoaXMuaW5TbmlwcGV0ICYmIHRoaXMuaW5Cb2R5KSB7IGNvbnRpbnVlIH1cblxuICAgICAgLy8gRGV0ZXJtaW5lIGlmIHdlJ3ZlIGZvdW5kIGEgbmV3IHNuaXBwZXRcbiAgICAgIGlmICghdGhpcy5pblNuaXBwZXQgJiYgdGV4dC5pbmRleE9mKCckeycsIGluZGV4KSA9PT0gaW5kZXgpIHtcbiAgICAgICAgLy8gRmluZCBpbmRleCBvZiBjb2xvblxuICAgICAgICBsZXQgY29sb25JbmRleCA9IHRleHQuaW5kZXhPZignOicsIGluZGV4ICsgMylcbiAgICAgICAgaWYgKGNvbG9uSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgLy8gRGlzcXVhbGlmeSBzbmlwcGV0IHVubGVzcyB0aGUgdGV4dCBiZXR3ZWVuICckeycgYW5kICc6JyBhcmUgZGlnaXRzXG4gICAgICAgICAgY29uc3QgZ3JvdXBTdGFydCA9IGluZGV4ICsgMlxuICAgICAgICAgIGNvbnN0IGdyb3VwRW5kID0gY29sb25JbmRleCAtIDFcbiAgICAgICAgICBpZiAoZ3JvdXBFbmQgPj0gZ3JvdXBTdGFydCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGdyb3VwU3RhcnQ7IGkgPCBncm91cEVuZDsgaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChpc05hTihwYXJzZUludCh0ZXh0LmNoYXJBdChpKSkpKSB7IGNvbG9uSW5kZXggPSAtMSB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbG9uSW5kZXggPSAtMVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpbmQgaW5kZXggb2YgJ30nXG4gICAgICAgIGxldCByaWdodEJyYWNlSW5kZXggPSAtMVxuICAgICAgICBpZiAoY29sb25JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBsZXQgaSA9IGluZGV4ICsgNFxuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICByaWdodEJyYWNlSW5kZXggPSB0ZXh0LmluZGV4T2YoJ30nLCBpKVxuICAgICAgICAgICAgaWYgKHJpZ2h0QnJhY2VJbmRleCA9PT0gLTEpIHsgYnJlYWsgfVxuICAgICAgICAgICAgaWYgKHRleHQuY2hhckF0KHJpZ2h0QnJhY2VJbmRleCAtIDEpID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuZXNjYXBlZEJyYWNlSW5kaWNlcyA9PSBudWxsKSB7IHRoaXMuZXNjYXBlZEJyYWNlSW5kaWNlcyA9IFtdIH1cbiAgICAgICAgICAgICAgdGhpcy5lc2NhcGVkQnJhY2VJbmRpY2VzLnB1c2gocmlnaHRCcmFjZUluZGV4IC0gMSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gcmlnaHRCcmFjZUluZGV4ICsgMVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2xvbkluZGV4ICE9PSAtMSAmJiByaWdodEJyYWNlSW5kZXggIT09IC0xICYmIGNvbG9uSW5kZXggPCByaWdodEJyYWNlSW5kZXgpIHtcbiAgICAgICAgICB0aGlzLmluU25pcHBldCA9IHRydWVcbiAgICAgICAgICB0aGlzLmluQm9keSA9IGZhbHNlXG4gICAgICAgICAgdGhpcy5zbmlwcGV0U3RhcnQgPSBpbmRleFxuICAgICAgICAgIHRoaXMuc25pcHBldEVuZCA9IHJpZ2h0QnJhY2VJbmRleFxuICAgICAgICAgIHRoaXMuYm9keVN0YXJ0ID0gY29sb25JbmRleCArIDFcbiAgICAgICAgICB0aGlzLmJvZHlFbmQgPSByaWdodEJyYWNlSW5kZXggLSAxXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnJlc2V0KClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzbmlwcGV0c1xuICB9XG5cbiAgcmVtb3ZlQnJhY2VFc2NhcGluZyAoYm9keSwgYm9keVN0YXJ0LCBlc2NhcGVkQnJhY2VJbmRpY2VzKSB7XG4gICAgaWYgKGVzY2FwZWRCcmFjZUluZGljZXMgIT0gbnVsbCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlc2NhcGVkQnJhY2VJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJvZHlJbmRleCA9IGVzY2FwZWRCcmFjZUluZGljZXNbaV1cbiAgICAgICAgYm9keSA9IHJlbW92ZUNoYXJGcm9tU3RyaW5nKGJvZHksIGJvZHlJbmRleCAtIGJvZHlTdGFydCAtIGkpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBib2R5XG4gIH1cbn07XG5cbmNvbnN0IHJlbW92ZUNoYXJGcm9tU3RyaW5nID0gKHN0ciwgaW5kZXgpID0+IHN0ci5zbGljZSgwLCBpbmRleCkgKyBzdHIuc2xpY2UoaW5kZXggKyAxKVxuIl19