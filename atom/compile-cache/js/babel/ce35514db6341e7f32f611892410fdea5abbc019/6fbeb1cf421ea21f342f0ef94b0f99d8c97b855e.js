Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atomSpacePenViews = require('atom-space-pen-views');

'use babel';

var LineEndingListView = (function (_SelectListView) {
  _inherits(LineEndingListView, _SelectListView);

  function LineEndingListView() {
    _classCallCheck(this, LineEndingListView);

    _get(Object.getPrototypeOf(LineEndingListView.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(LineEndingListView, [{
    key: 'initialize',
    value: function initialize(callback) {
      this.callback = callback;
      _get(Object.getPrototypeOf(LineEndingListView.prototype), 'initialize', this).call(this);
      this.addClass('line-ending');
      this.setItems([{ name: 'LF', value: '\n' }, { name: 'CRLF', value: '\r\n' }]);
    }
  }, {
    key: 'getFilterKey',
    value: function getFilterKey() {
      return 'name';
    }
  }, {
    key: 'viewForItem',
    value: function viewForItem(ending) {
      var element = document.createElement('li');
      element.textContent = ending.name;
      return element;
    }
  }, {
    key: 'cancelled',
    value: function cancelled() {
      this.callback();
    }
  }, {
    key: 'confirmed',
    value: function confirmed(ending) {
      this.cancel();
      this.callback(ending.value);
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.filterEditorView.focus();
      this.populateList();
    }
  }]);

  return LineEndingListView;
})(_atomSpacePenViews.SelectListView);

exports['default'] = LineEndingListView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvbGluZS1lbmRpbmctc2VsZWN0b3IvbGliL2xpbmUtZW5kaW5nLWxpc3Qtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7aUNBRStCLHNCQUFzQjs7QUFGckQsV0FBVyxDQUFBOztJQUlVLGtCQUFrQjtZQUFsQixrQkFBa0I7O1dBQWxCLGtCQUFrQjswQkFBbEIsa0JBQWtCOzsrQkFBbEIsa0JBQWtCOzs7ZUFBbEIsa0JBQWtCOztXQUMxQixvQkFBQyxRQUFRLEVBQUU7QUFDcEIsVUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7QUFDeEIsaUNBSGlCLGtCQUFrQiw0Q0FHakI7QUFDbEIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUM1QixVQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUMsQ0FBQTtLQUMxRTs7O1dBRVksd0JBQUc7QUFDZCxhQUFPLE1BQU0sQ0FBQTtLQUNkOzs7V0FFVyxxQkFBQyxNQUFNLEVBQUU7QUFDbkIsVUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUMxQyxhQUFPLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUE7QUFDakMsYUFBTyxPQUFPLENBQUE7S0FDZjs7O1dBRVMscUJBQUc7QUFDWCxVQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7S0FDaEI7OztXQUVTLG1CQUFDLE1BQU0sRUFBRTtBQUNqQixVQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDYixVQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUM1Qjs7O1dBRUssaUJBQUc7QUFDUCxVQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDN0IsVUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO0tBQ3BCOzs7U0E5QmtCLGtCQUFrQjs7O3FCQUFsQixrQkFBa0IiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9saW5lLWVuZGluZy1zZWxlY3Rvci9saWIvbGluZS1lbmRpbmctbGlzdC12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgU2VsZWN0TGlzdFZpZXcgfSBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZUVuZGluZ0xpc3RWaWV3IGV4dGVuZHMgU2VsZWN0TGlzdFZpZXcge1xuICBpbml0aWFsaXplIChjYWxsYmFjaykge1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFja1xuICAgIHN1cGVyLmluaXRpYWxpemUoKVxuICAgIHRoaXMuYWRkQ2xhc3MoJ2xpbmUtZW5kaW5nJylcbiAgICB0aGlzLnNldEl0ZW1zKFt7bmFtZTogJ0xGJywgdmFsdWU6ICdcXG4nfSwge25hbWU6ICdDUkxGJywgdmFsdWU6ICdcXHJcXG4nfV0pXG4gIH1cblxuICBnZXRGaWx0ZXJLZXkgKCkge1xuICAgIHJldHVybiAnbmFtZSdcbiAgfVxuXG4gIHZpZXdGb3JJdGVtIChlbmRpbmcpIHtcbiAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICBlbGVtZW50LnRleHRDb250ZW50ID0gZW5kaW5nLm5hbWVcbiAgICByZXR1cm4gZWxlbWVudFxuICB9XG5cbiAgY2FuY2VsbGVkICgpIHtcbiAgICB0aGlzLmNhbGxiYWNrKClcbiAgfVxuXG4gIGNvbmZpcm1lZCAoZW5kaW5nKSB7XG4gICAgdGhpcy5jYW5jZWwoKVxuICAgIHRoaXMuY2FsbGJhY2soZW5kaW5nLnZhbHVlKVxuICB9XG5cbiAgcmVzZXQgKCkge1xuICAgIHRoaXMuZmlsdGVyRWRpdG9yVmlldy5mb2N1cygpXG4gICAgdGhpcy5wb3B1bGF0ZUxpc3QoKVxuICB9XG59XG4iXX0=