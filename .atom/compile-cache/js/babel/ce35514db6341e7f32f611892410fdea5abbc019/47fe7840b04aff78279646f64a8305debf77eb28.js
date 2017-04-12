'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var StatusBarItem = (function () {
  function StatusBarItem() {
    _classCallCheck(this, StatusBarItem);

    this.element = document.createElement('a');
    this.element.className = 'line-ending-tile inline-block';
    this.setLineEndings(new Set());
  }

  _createClass(StatusBarItem, [{
    key: 'setLineEndings',
    value: function setLineEndings(lineEndings) {
      this.lineEndings = lineEndings;
      this.element.textContent = lineEndingName(lineEndings);
    }
  }, {
    key: 'hasLineEnding',
    value: function hasLineEnding(lineEnding) {
      return this.lineEndings.has(lineEnding);
    }
  }, {
    key: 'onClick',
    value: function onClick(callback) {
      this.element.addEventListener('click', callback);
    }
  }]);

  return StatusBarItem;
})();

exports['default'] = StatusBarItem;

function lineEndingName(lineEndings) {
  if (lineEndings.size > 1) {
    return 'Mixed';
  } else if (lineEndings.has('\n')) {
    return 'LF';
  } else if (lineEndings.has('\r\n')) {
    return 'CRLF';
  } else if (lineEndings.has('\r')) {
    return 'CR';
  } else {
    return '';
  }
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvbGluZS1lbmRpbmctc2VsZWN0b3IvbGliL3N0YXR1cy1iYXItaXRlbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7Ozs7SUFFVSxhQUFhO0FBQ3BCLFdBRE8sYUFBYSxHQUNqQjswQkFESSxhQUFhOztBQUU5QixRQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDMUMsUUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsK0JBQStCLENBQUE7QUFDeEQsUUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUE7R0FDL0I7O2VBTGtCLGFBQWE7O1dBT2pCLHdCQUFDLFdBQVcsRUFBRTtBQUMzQixVQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTtBQUM5QixVQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUE7S0FDdkQ7OztXQUVhLHVCQUFDLFVBQVUsRUFBRTtBQUN6QixhQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0tBQ3hDOzs7V0FFTyxpQkFBQyxRQUFRLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDakQ7OztTQWxCa0IsYUFBYTs7O3FCQUFiLGFBQWE7O0FBcUJsQyxTQUFTLGNBQWMsQ0FBRSxXQUFXLEVBQUU7QUFDcEMsTUFBSSxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtBQUN4QixXQUFPLE9BQU8sQ0FBQTtHQUNmLE1BQU0sSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2hDLFdBQU8sSUFBSSxDQUFBO0dBQ1osTUFBTSxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbEMsV0FBTyxNQUFNLENBQUE7R0FDZCxNQUFNLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNoQyxXQUFPLElBQUksQ0FBQTtHQUNaLE1BQU07QUFDTCxXQUFPLEVBQUUsQ0FBQTtHQUNWO0NBQ0YiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9saW5lLWVuZGluZy1zZWxlY3Rvci9saWIvc3RhdHVzLWJhci1pdGVtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhdHVzQmFySXRlbSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2xpbmUtZW5kaW5nLXRpbGUgaW5saW5lLWJsb2NrJ1xuICAgIHRoaXMuc2V0TGluZUVuZGluZ3MobmV3IFNldCgpKVxuICB9XG5cbiAgc2V0TGluZUVuZGluZ3MgKGxpbmVFbmRpbmdzKSB7XG4gICAgdGhpcy5saW5lRW5kaW5ncyA9IGxpbmVFbmRpbmdzXG4gICAgdGhpcy5lbGVtZW50LnRleHRDb250ZW50ID0gbGluZUVuZGluZ05hbWUobGluZUVuZGluZ3MpXG4gIH1cblxuICBoYXNMaW5lRW5kaW5nIChsaW5lRW5kaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubGluZUVuZGluZ3MuaGFzKGxpbmVFbmRpbmcpXG4gIH1cblxuICBvbkNsaWNrIChjYWxsYmFjaykge1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNhbGxiYWNrKVxuICB9XG59XG5cbmZ1bmN0aW9uIGxpbmVFbmRpbmdOYW1lIChsaW5lRW5kaW5ncykge1xuICBpZiAobGluZUVuZGluZ3Muc2l6ZSA+IDEpIHtcbiAgICByZXR1cm4gJ01peGVkJ1xuICB9IGVsc2UgaWYgKGxpbmVFbmRpbmdzLmhhcygnXFxuJykpIHtcbiAgICByZXR1cm4gJ0xGJ1xuICB9IGVsc2UgaWYgKGxpbmVFbmRpbmdzLmhhcygnXFxyXFxuJykpIHtcbiAgICByZXR1cm4gJ0NSTEYnXG4gIH0gZWxzZSBpZiAobGluZUVuZGluZ3MuaGFzKCdcXHInKSkge1xuICAgIHJldHVybiAnQ1InXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbn1cbiJdfQ==