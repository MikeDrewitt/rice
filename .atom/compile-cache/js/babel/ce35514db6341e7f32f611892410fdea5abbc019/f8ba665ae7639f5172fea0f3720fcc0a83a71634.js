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

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

var _etchComponent = require('../etch-component');

var _etchComponent2 = _interopRequireDefault(_etchComponent);

var AtomLogo = (function (_EtchComponent) {
  _inherits(AtomLogo, _EtchComponent);

  function AtomLogo() {
    _classCallCheck(this, AtomLogo);

    _get(Object.getPrototypeOf(AtomLogo.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(AtomLogo, [{
    key: 'render',
    value: function render() {
      return _etch2['default'].dom(
        'svg',
        { className: 'about-logo', width: '330px', height: '68px', viewBox: '0 0 330 68' },
        _etch2['default'].dom(
          'g',
          { stroke: 'none', 'stroke-width': '1', fill: 'none', 'fill-rule': 'evenodd' },
          _etch2['default'].dom(
            'g',
            { transform: 'translate(2.000000, 1.000000)' },
            _etch2['default'].dom(
              'g',
              { transform: 'translate(96.000000, 8.000000)', fill: 'currentColor' },
              _etch2['default'].dom('path', { d: 'M185.498,3.399 C185.498,2.417 186.34,1.573 187.324,1.573 L187.674,1.573 C188.447,1.573 189.01,1.995 189.5,2.628 L208.676,30.862 L227.852,2.628 C228.272,1.995 228.905,1.573 229.676,1.573 L230.028,1.573 C231.01,1.573 231.854,2.417 231.854,3.399 L231.854,49.403 C231.854,50.387 231.01,51.231 230.028,51.231 C229.044,51.231 228.202,50.387 228.202,49.403 L228.202,8.246 L210.151,34.515 C209.729,35.148 209.237,35.428 208.606,35.428 C207.973,35.428 207.481,35.148 207.061,34.515 L189.01,8.246 L189.01,49.475 C189.01,50.457 188.237,51.231 187.254,51.231 C186.27,51.231 185.498,50.458 185.498,49.475 L185.498,3.399 L185.498,3.399 Z' }),
              _etch2['default'].dom('path', { d: 'M113.086,26.507 L113.086,26.367 C113.086,12.952 122.99,0.941 137.881,0.941 C152.77,0.941 162.533,12.811 162.533,26.225 L162.533,26.367 C162.533,39.782 152.629,51.792 137.74,51.792 C122.85,51.792 113.086,39.923 113.086,26.507 M158.74,26.507 L158.74,26.367 C158.74,14.216 149.89,4.242 137.74,4.242 C125.588,4.242 116.879,14.075 116.879,26.225 L116.879,26.367 C116.879,38.518 125.729,48.491 137.881,48.491 C150.031,48.491 158.74,38.658 158.74,26.507' }),
              _etch2['default'].dom('path', { d: 'M76.705,5.155 L60.972,5.155 C60.06,5.155 59.287,4.384 59.287,3.469 C59.287,2.556 60.059,1.783 60.972,1.783 L96.092,1.783 C97.004,1.783 97.778,2.555 97.778,3.469 C97.778,4.383 97.005,5.155 96.092,5.155 L80.358,5.155 L80.358,49.405 C80.358,50.387 79.516,51.231 78.532,51.231 C77.55,51.231 76.706,50.387 76.706,49.405 L76.706,5.155 L76.705,5.155 Z' }),
              _etch2['default'].dom('path', { d: 'M0.291,48.562 L21.291,3.05 C21.783,1.995 22.485,1.292 23.75,1.292 L23.891,1.292 C25.155,1.292 25.858,1.995 26.348,3.05 L47.279,48.421 C47.49,48.843 47.56,49.194 47.56,49.546 C47.56,50.458 46.788,51.231 45.803,51.231 C44.961,51.231 44.329,50.599 43.978,49.826 L38.219,37.183 L9.21,37.183 L3.45,49.897 C3.099,50.739 2.538,51.231 1.694,51.231 C0.781,51.231 0.008,50.529 0.008,49.685 C0.009,49.404 0.08,48.983 0.291,48.562 L0.291,48.562 Z M36.673,33.882 L23.749,5.437 L10.755,33.882 L36.673,33.882 L36.673,33.882 Z' })
            ),
            _etch2['default'].dom(
              'g',
              null,
              _etch2['default'].dom('path', { d: 'M40.363,32.075 C40.874,34.44 39.371,36.77 37.006,37.282 C34.641,37.793 32.311,36.29 31.799,33.925 C31.289,31.56 32.791,29.23 35.156,28.718 C37.521,28.207 39.851,29.71 40.363,32.075', fill: 'currentColor' }),
              _etch2['default'].dom('path', { d: 'M48.578,28.615 C56.851,45.587 58.558,61.581 52.288,64.778 C45.822,68.076 33.326,56.521 24.375,38.969 C15.424,21.418 13.409,4.518 19.874,1.221 C22.689,-0.216 26.648,1.166 30.959,4.629', stroke: 'currentColor', 'stroke-width': '3.08', 'stroke-linecap': 'round' }),
              _etch2['default'].dom('path', { d: 'M7.64,39.45 C2.806,36.94 -0.009,33.915 0.154,30.79 C0.531,23.542 16.787,18.497 36.462,19.52 C56.137,20.544 71.781,27.249 71.404,34.497 C71.241,37.622 68.127,40.338 63.06,42.333', stroke: 'currentColor', 'stroke-width': '3.08', 'stroke-linecap': 'round' }),
              _etch2['default'].dom('path', { d: 'M28.828,59.354 C23.545,63.168 18.843,64.561 15.902,62.653 C9.814,58.702 13.572,42.102 24.296,25.575 C35.02,9.048 48.649,-1.149 54.736,2.803 C57.566,4.639 58.269,9.208 57.133,15.232', stroke: 'currentColor', 'stroke-width': '3.08', 'stroke-linecap': 'round' })
            )
          )
        )
      );
    }
  }]);

  return AtomLogo;
})(_etchComponent2['default']);

exports['default'] = AtomLogo;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2NvbXBvbmVudHMvYXRvbS1sb2dvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFJaUIsTUFBTTs7Ozs2QkFDRyxtQkFBbUI7Ozs7SUFFeEIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROzs7ZUFBUixRQUFROztXQUNwQixrQkFBRztBQUNSLGFBQ0U7O1VBQUssU0FBUyxFQUFDLFlBQVksRUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFlBQVk7UUFDMUU7O1lBQUcsTUFBTSxFQUFDLE1BQU0sRUFBQyxnQkFBYSxHQUFHLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBQyxhQUFVLFNBQVM7VUFDL0Q7O2NBQUcsU0FBUyxFQUFDLCtCQUErQjtZQUMxQzs7Z0JBQUcsU0FBUyxFQUFDLGdDQUFnQyxFQUFDLElBQUksRUFBQyxjQUFjO2NBQy9ELGdDQUFNLENBQUMsRUFBQyxpbkJBQWluQixHQUFRO2NBQ2pvQixnQ0FBTSxDQUFDLEVBQUMsZ2NBQWdjLEdBQVE7Y0FDaGQsZ0NBQU0sQ0FBQyxFQUFDLDBWQUEwVixHQUFRO2NBQzFXLGdDQUFNLENBQUMsRUFBQyxnZ0JBQWdnQixHQUFRO2FBQzlnQjtZQUNKOzs7Y0FDRSxnQ0FBTSxDQUFDLEVBQUMsc0xBQXNMLEVBQUMsSUFBSSxFQUFDLGNBQWMsR0FBUTtjQUMxTixnQ0FBTSxDQUFDLEVBQUMsd0xBQXdMLEVBQUMsTUFBTSxFQUFDLGNBQWMsRUFBQyxnQkFBYSxNQUFNLEVBQUMsa0JBQWUsT0FBTyxHQUFRO2NBQ3pRLGdDQUFNLENBQUMsRUFBQyxrTEFBa0wsRUFBQyxNQUFNLEVBQUMsY0FBYyxFQUFDLGdCQUFhLE1BQU0sRUFBQyxrQkFBZSxPQUFPLEdBQVE7Y0FDblEsZ0NBQU0sQ0FBQyxFQUFDLHNMQUFzTCxFQUFDLE1BQU0sRUFBQyxjQUFjLEVBQUMsZ0JBQWEsTUFBTSxFQUFDLGtCQUFlLE9BQU8sR0FBUTthQUNyUTtXQUNGO1NBQ0Y7T0FDQSxDQUNQO0tBQ0Y7OztTQXRCa0IsUUFBUTs7O3FCQUFSLFFBQVEiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hYm91dC9saWIvY29tcG9uZW50cy9hdG9tLWxvZ28uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVhY3Qvbm8tdW5rbm93bi1wcm9wZXJ0eSAqL1xuXG5pbXBvcnQgZXRjaCBmcm9tICdldGNoJ1xuaW1wb3J0IEV0Y2hDb21wb25lbnQgZnJvbSAnLi4vZXRjaC1jb21wb25lbnQnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF0b21Mb2dvIGV4dGVuZHMgRXRjaENvbXBvbmVudCB7XG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxzdmcgY2xhc3NOYW1lPSdhYm91dC1sb2dvJyB3aWR0aD0nMzMwcHgnIGhlaWdodD0nNjhweCcgdmlld0JveD0nMCAwIDMzMCA2OCc+XG4gICAgICAgIDxnIHN0cm9rZT0nbm9uZScgc3Ryb2tlLXdpZHRoPScxJyBmaWxsPSdub25lJyBmaWxsLXJ1bGU9J2V2ZW5vZGQnPlxuICAgICAgICAgIDxnIHRyYW5zZm9ybT0ndHJhbnNsYXRlKDIuMDAwMDAwLCAxLjAwMDAwMCknPlxuICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSd0cmFuc2xhdGUoOTYuMDAwMDAwLCA4LjAwMDAwMCknIGZpbGw9J2N1cnJlbnRDb2xvcic+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J00xODUuNDk4LDMuMzk5IEMxODUuNDk4LDIuNDE3IDE4Ni4zNCwxLjU3MyAxODcuMzI0LDEuNTczIEwxODcuNjc0LDEuNTczIEMxODguNDQ3LDEuNTczIDE4OS4wMSwxLjk5NSAxODkuNSwyLjYyOCBMMjA4LjY3NiwzMC44NjIgTDIyNy44NTIsMi42MjggQzIyOC4yNzIsMS45OTUgMjI4LjkwNSwxLjU3MyAyMjkuNjc2LDEuNTczIEwyMzAuMDI4LDEuNTczIEMyMzEuMDEsMS41NzMgMjMxLjg1NCwyLjQxNyAyMzEuODU0LDMuMzk5IEwyMzEuODU0LDQ5LjQwMyBDMjMxLjg1NCw1MC4zODcgMjMxLjAxLDUxLjIzMSAyMzAuMDI4LDUxLjIzMSBDMjI5LjA0NCw1MS4yMzEgMjI4LjIwMiw1MC4zODcgMjI4LjIwMiw0OS40MDMgTDIyOC4yMDIsOC4yNDYgTDIxMC4xNTEsMzQuNTE1IEMyMDkuNzI5LDM1LjE0OCAyMDkuMjM3LDM1LjQyOCAyMDguNjA2LDM1LjQyOCBDMjA3Ljk3MywzNS40MjggMjA3LjQ4MSwzNS4xNDggMjA3LjA2MSwzNC41MTUgTDE4OS4wMSw4LjI0NiBMMTg5LjAxLDQ5LjQ3NSBDMTg5LjAxLDUwLjQ1NyAxODguMjM3LDUxLjIzMSAxODcuMjU0LDUxLjIzMSBDMTg2LjI3LDUxLjIzMSAxODUuNDk4LDUwLjQ1OCAxODUuNDk4LDQ5LjQ3NSBMMTg1LjQ5OCwzLjM5OSBMMTg1LjQ5OCwzLjM5OSBaJz48L3BhdGg+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J00xMTMuMDg2LDI2LjUwNyBMMTEzLjA4NiwyNi4zNjcgQzExMy4wODYsMTIuOTUyIDEyMi45OSwwLjk0MSAxMzcuODgxLDAuOTQxIEMxNTIuNzcsMC45NDEgMTYyLjUzMywxMi44MTEgMTYyLjUzMywyNi4yMjUgTDE2Mi41MzMsMjYuMzY3IEMxNjIuNTMzLDM5Ljc4MiAxNTIuNjI5LDUxLjc5MiAxMzcuNzQsNTEuNzkyIEMxMjIuODUsNTEuNzkyIDExMy4wODYsMzkuOTIzIDExMy4wODYsMjYuNTA3IE0xNTguNzQsMjYuNTA3IEwxNTguNzQsMjYuMzY3IEMxNTguNzQsMTQuMjE2IDE0OS44OSw0LjI0MiAxMzcuNzQsNC4yNDIgQzEyNS41ODgsNC4yNDIgMTE2Ljg3OSwxNC4wNzUgMTE2Ljg3OSwyNi4yMjUgTDExNi44NzksMjYuMzY3IEMxMTYuODc5LDM4LjUxOCAxMjUuNzI5LDQ4LjQ5MSAxMzcuODgxLDQ4LjQ5MSBDMTUwLjAzMSw0OC40OTEgMTU4Ljc0LDM4LjY1OCAxNTguNzQsMjYuNTA3Jz48L3BhdGg+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J003Ni43MDUsNS4xNTUgTDYwLjk3Miw1LjE1NSBDNjAuMDYsNS4xNTUgNTkuMjg3LDQuMzg0IDU5LjI4NywzLjQ2OSBDNTkuMjg3LDIuNTU2IDYwLjA1OSwxLjc4MyA2MC45NzIsMS43ODMgTDk2LjA5MiwxLjc4MyBDOTcuMDA0LDEuNzgzIDk3Ljc3OCwyLjU1NSA5Ny43NzgsMy40NjkgQzk3Ljc3OCw0LjM4MyA5Ny4wMDUsNS4xNTUgOTYuMDkyLDUuMTU1IEw4MC4zNTgsNS4xNTUgTDgwLjM1OCw0OS40MDUgQzgwLjM1OCw1MC4zODcgNzkuNTE2LDUxLjIzMSA3OC41MzIsNTEuMjMxIEM3Ny41NSw1MS4yMzEgNzYuNzA2LDUwLjM4NyA3Ni43MDYsNDkuNDA1IEw3Ni43MDYsNS4xNTUgTDc2LjcwNSw1LjE1NSBaJz48L3BhdGg+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J00wLjI5MSw0OC41NjIgTDIxLjI5MSwzLjA1IEMyMS43ODMsMS45OTUgMjIuNDg1LDEuMjkyIDIzLjc1LDEuMjkyIEwyMy44OTEsMS4yOTIgQzI1LjE1NSwxLjI5MiAyNS44NTgsMS45OTUgMjYuMzQ4LDMuMDUgTDQ3LjI3OSw0OC40MjEgQzQ3LjQ5LDQ4Ljg0MyA0Ny41Niw0OS4xOTQgNDcuNTYsNDkuNTQ2IEM0Ny41Niw1MC40NTggNDYuNzg4LDUxLjIzMSA0NS44MDMsNTEuMjMxIEM0NC45NjEsNTEuMjMxIDQ0LjMyOSw1MC41OTkgNDMuOTc4LDQ5LjgyNiBMMzguMjE5LDM3LjE4MyBMOS4yMSwzNy4xODMgTDMuNDUsNDkuODk3IEMzLjA5OSw1MC43MzkgMi41MzgsNTEuMjMxIDEuNjk0LDUxLjIzMSBDMC43ODEsNTEuMjMxIDAuMDA4LDUwLjUyOSAwLjAwOCw0OS42ODUgQzAuMDA5LDQ5LjQwNCAwLjA4LDQ4Ljk4MyAwLjI5MSw0OC41NjIgTDAuMjkxLDQ4LjU2MiBaIE0zNi42NzMsMzMuODgyIEwyMy43NDksNS40MzcgTDEwLjc1NSwzMy44ODIgTDM2LjY3MywzMy44ODIgTDM2LjY3MywzMy44ODIgWic+PC9wYXRoPlxuICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgPGc+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J000MC4zNjMsMzIuMDc1IEM0MC44NzQsMzQuNDQgMzkuMzcxLDM2Ljc3IDM3LjAwNiwzNy4yODIgQzM0LjY0MSwzNy43OTMgMzIuMzExLDM2LjI5IDMxLjc5OSwzMy45MjUgQzMxLjI4OSwzMS41NiAzMi43OTEsMjkuMjMgMzUuMTU2LDI4LjcxOCBDMzcuNTIxLDI4LjIwNyAzOS44NTEsMjkuNzEgNDAuMzYzLDMyLjA3NScgZmlsbD0nY3VycmVudENvbG9yJz48L3BhdGg+XG4gICAgICAgICAgICAgIDxwYXRoIGQ9J000OC41NzgsMjguNjE1IEM1Ni44NTEsNDUuNTg3IDU4LjU1OCw2MS41ODEgNTIuMjg4LDY0Ljc3OCBDNDUuODIyLDY4LjA3NiAzMy4zMjYsNTYuNTIxIDI0LjM3NSwzOC45NjkgQzE1LjQyNCwyMS40MTggMTMuNDA5LDQuNTE4IDE5Ljg3NCwxLjIyMSBDMjIuNjg5LC0wLjIxNiAyNi42NDgsMS4xNjYgMzAuOTU5LDQuNjI5JyBzdHJva2U9J2N1cnJlbnRDb2xvcicgc3Ryb2tlLXdpZHRoPSczLjA4JyBzdHJva2UtbGluZWNhcD0ncm91bmQnPjwvcGF0aD5cbiAgICAgICAgICAgICAgPHBhdGggZD0nTTcuNjQsMzkuNDUgQzIuODA2LDM2Ljk0IC0wLjAwOSwzMy45MTUgMC4xNTQsMzAuNzkgQzAuNTMxLDIzLjU0MiAxNi43ODcsMTguNDk3IDM2LjQ2MiwxOS41MiBDNTYuMTM3LDIwLjU0NCA3MS43ODEsMjcuMjQ5IDcxLjQwNCwzNC40OTcgQzcxLjI0MSwzNy42MjIgNjguMTI3LDQwLjMzOCA2My4wNiw0Mi4zMzMnIHN0cm9rZT0nY3VycmVudENvbG9yJyBzdHJva2Utd2lkdGg9JzMuMDgnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCc+PC9wYXRoPlxuICAgICAgICAgICAgICA8cGF0aCBkPSdNMjguODI4LDU5LjM1NCBDMjMuNTQ1LDYzLjE2OCAxOC44NDMsNjQuNTYxIDE1LjkwMiw2Mi42NTMgQzkuODE0LDU4LjcwMiAxMy41NzIsNDIuMTAyIDI0LjI5NiwyNS41NzUgQzM1LjAyLDkuMDQ4IDQ4LjY0OSwtMS4xNDkgNTQuNzM2LDIuODAzIEM1Ny41NjYsNC42MzkgNTguMjY5LDkuMjA4IDU3LjEzMywxNS4yMzInIHN0cm9rZT0nY3VycmVudENvbG9yJyBzdHJva2Utd2lkdGg9JzMuMDgnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCc+PC9wYXRoPlxuICAgICAgICAgICAgPC9nPlxuICAgICAgICAgIDwvZz5cbiAgICAgICAgPC9nPlxuICAgICAgPC9zdmc+XG4gICAgKVxuICB9XG59XG4iXX0=