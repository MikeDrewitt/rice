Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */
/** @jsx etch.dom */

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

var StatusIconComponent = (function () {
  function StatusIconComponent(_ref) {
    var count = _ref.count;

    _classCallCheck(this, StatusIconComponent);

    this.count = count;
    _etch2['default'].createElement(this);
  }

  _createClass(StatusIconComponent, [{
    key: 'render',
    value: function render() {
      return _etch2['default'].dom(
        'div',
        { className: 'incompatible-packages-status inline-block text text-error' },
        _etch2['default'].dom('span', { className: 'icon icon-bug' }),
        _etch2['default'].dom(
          'span',
          { className: 'incompatible-packages-count' },
          this.count
        )
      );
    }
  }]);

  return StatusIconComponent;
})();

exports['default'] = StatusIconComponent;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvaW5jb21wYXRpYmxlLXBhY2thZ2VzL2xpYi9zdGF0dXMtaWNvbi1jb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztvQkFHaUIsTUFBTTs7OztJQUVGLG1CQUFtQjtBQUMxQixXQURPLG1CQUFtQixDQUN6QixJQUFPLEVBQUU7UUFBUixLQUFLLEdBQU4sSUFBTyxDQUFOLEtBQUs7OzBCQURBLG1CQUFtQjs7QUFFcEMsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7QUFDbEIsc0JBQUssYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQ3pCOztlQUprQixtQkFBbUI7O1dBTS9CLGtCQUFHO0FBQ1IsYUFDRTs7VUFBSyxTQUFTLEVBQUMsMkRBQTJEO1FBQ3hFLGdDQUFNLFNBQVMsRUFBQyxlQUFlLEdBQVE7UUFDdkM7O1lBQU0sU0FBUyxFQUFDLDZCQUE2QjtVQUFFLElBQUksQ0FBQyxLQUFLO1NBQVE7T0FDN0QsQ0FDUDtLQUNGOzs7U0Fia0IsbUJBQW1COzs7cUJBQW5CLG1CQUFtQiIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2luY29tcGF0aWJsZS1wYWNrYWdlcy9saWIvc3RhdHVzLWljb24tY29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuLyoqIEBqc3ggZXRjaC5kb20gKi9cblxuaW1wb3J0IGV0Y2ggZnJvbSAnZXRjaCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhdHVzSWNvbkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yICh7Y291bnR9KSB7XG4gICAgdGhpcy5jb3VudCA9IGNvdW50XG4gICAgZXRjaC5jcmVhdGVFbGVtZW50KHRoaXMpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0naW5jb21wYXRpYmxlLXBhY2thZ2VzLXN0YXR1cyBpbmxpbmUtYmxvY2sgdGV4dCB0ZXh0LWVycm9yJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpY29uIGljb24tYnVnJz48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0naW5jb21wYXRpYmxlLXBhY2thZ2VzLWNvdW50Jz57dGhpcy5jb3VudH08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cbiJdfQ==