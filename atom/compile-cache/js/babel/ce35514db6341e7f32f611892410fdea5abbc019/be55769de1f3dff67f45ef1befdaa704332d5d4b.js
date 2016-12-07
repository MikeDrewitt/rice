Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */
/** @jsx etch.dom */
/* eslint-disable react/no-unknown-property */

var _atom = require('atom');

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

var _etchComponent = require('../etch-component');

var _etchComponent2 = _interopRequireDefault(_etchComponent);

var AboutStatusBar = (function (_EtchComponent) {
  _inherits(AboutStatusBar, _EtchComponent);

  function AboutStatusBar() {
    _classCallCheck(this, AboutStatusBar);

    _get(Object.getPrototypeOf(AboutStatusBar.prototype), 'constructor', this).call(this);
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(atom.tooltips.add(this.element, { title: 'An update will be installed the next time Atom is relaunched.<br/><br/>Click the squirrel icon for more information.' }));
  }

  _createClass(AboutStatusBar, [{
    key: 'handleClick',
    value: function handleClick() {
      atom.workspace.open('atom://about');
    }
  }, {
    key: 'render',
    value: function render() {
      return _etch2['default'].dom('span', { type: 'button', className: 'about-release-notes icon icon-squirrel inline-block', onclick: this.handleClick.bind(this) });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      _get(Object.getPrototypeOf(AboutStatusBar.prototype), 'destroy', this).call(this);
      this.subscriptions.dispose();
    }
  }]);

  return AboutStatusBar;
})(_etchComponent2['default']);

exports['default'] = AboutStatusBar;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2NvbXBvbmVudHMvYWJvdXQtc3RhdHVzLWJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBSWtDLE1BQU07O29CQUN2QixNQUFNOzs7OzZCQUNHLG1CQUFtQjs7OztJQUV4QixjQUFjO1lBQWQsY0FBYzs7QUFDckIsV0FETyxjQUFjLEdBQ2xCOzBCQURJLGNBQWM7O0FBRS9CLCtCQUZpQixjQUFjLDZDQUV4QjtBQUNQLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsc0hBQXNILEVBQUMsQ0FBQyxDQUFDLENBQUE7R0FDekw7O2VBTmtCLGNBQWM7O1dBUXJCLHVCQUFHO0FBQ2IsVUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7S0FDcEM7OztXQUVNLGtCQUFHO0FBQ1IsYUFDRSxnQ0FBTSxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyxxREFBcUQsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUMsR0FBRyxDQUM3SDtLQUNGOzs7V0FFTyxtQkFBRztBQUNULGlDQW5CaUIsY0FBYyx5Q0FtQmhCO0FBQ2YsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM3Qjs7O1NBckJrQixjQUFjOzs7cUJBQWQsY0FBYyIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2Fib3V0L2xpYi9jb21wb25lbnRzL2Fib3V0LXN0YXR1cy1iYXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVhY3Qvbm8tdW5rbm93bi1wcm9wZXJ0eSAqL1xuXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5pbXBvcnQgZXRjaCBmcm9tICdldGNoJ1xuaW1wb3J0IEV0Y2hDb21wb25lbnQgZnJvbSAnLi4vZXRjaC1jb21wb25lbnQnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFib3V0U3RhdHVzQmFyIGV4dGVuZHMgRXRjaENvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnRvb2x0aXBzLmFkZCh0aGlzLmVsZW1lbnQsIHt0aXRsZTogJ0FuIHVwZGF0ZSB3aWxsIGJlIGluc3RhbGxlZCB0aGUgbmV4dCB0aW1lIEF0b20gaXMgcmVsYXVuY2hlZC48YnIvPjxici8+Q2xpY2sgdGhlIHNxdWlycmVsIGljb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uJ30pKVxuICB9XG5cbiAgaGFuZGxlQ2xpY2sgKCkge1xuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ2F0b206Ly9hYm91dCcpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiB0eXBlPSdidXR0b24nIGNsYXNzTmFtZT0nYWJvdXQtcmVsZWFzZS1ub3RlcyBpY29uIGljb24tc3F1aXJyZWwgaW5saW5lLWJsb2NrJyBvbmNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcyl9IC8+XG4gICAgKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgc3VwZXIuZGVzdHJveSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICB9XG59XG4iXX0=