Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @jsx etch.dom */

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

'use babel';
var ConsentView = (function () {
  function ConsentView() {
    _classCallCheck(this, ConsentView);

    _etch2['default'].initialize(this);
  }

  _createClass(ConsentView, [{
    key: 'render',
    value: function render() {
      return _etch2['default'].dom(
        'div',
        { className: 'welcome' },
        _etch2['default'].dom(
          'div',
          { className: 'welcome-container' },
          _etch2['default'].dom(
            'div',
            { className: 'header' },
            _etch2['default'].dom(
              'a',
              { title: 'atom.io', href: 'https://atom.io/' },
              _etch2['default'].dom(
                'svg',
                { 'class': 'welcome-logo', width: '330px', height: '68px', viewBox: '0 0 330 68', version: '1.1' },
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
              )
            )
          ),
          _etch2['default'].dom(
            'div',
            { className: 'welcome-consent' },
            _etch2['default'].dom(
              'p',
              null,
              'To help improve Atom, you can anonymously send usage stats to the team. The resulting data plays a key role in deciding what to focus on.'
            ),
            _etch2['default'].dom(
              'p',
              { className: 'welcome-note' },
              'The data we send is minimal. Broadly, we send things like startup time, session time, and exceptions — never code or paths. See the ',
              _etch2['default'].dom(
                'a',
                { onclick: this.openMetricsPackage.bind(this) },
                'atom/metrics package'
              ),
              ' for details on what data is sent.'
            ),
            _etch2['default'].dom(
              'div',
              { className: 'welcome-consent-choices' },
              _etch2['default'].dom(
                'div',
                null,
                _etch2['default'].dom(
                  'button',
                  { className: 'btn', onclick: this.decline.bind(this) },
                  'No, I don\'t want to help'
                ),
                _etch2['default'].dom(
                  'p',
                  { className: 'welcome-note' },
                  'By opting out, your usage patterns will not be taken into account. We only register that you opted-out.'
                )
              ),
              _etch2['default'].dom(
                'div',
                null,
                _etch2['default'].dom(
                  'button',
                  { className: 'btn btn-primary', onclick: this.consent.bind(this) },
                  'Yes, I want to help improve Atom'
                ),
                _etch2['default'].dom(
                  'p',
                  { className: 'welcome-note' },
                  'You are helping us assess Atom\'s performance and understand usage patterns.'
                )
              )
            )
          ),
          _etch2['default'].dom(
            'div',
            { className: 'welcome-footer' },
            _etch2['default'].dom(
              'p',
              { className: 'welcome-love' },
              _etch2['default'].dom('span', { className: 'icon icon-code' }),
              _etch2['default'].dom(
                'span',
                { className: 'inline' },
                ' with '
              ),
              _etch2['default'].dom('span', { className: 'icon icon-heart' }),
              _etch2['default'].dom(
                'span',
                { className: 'inline' },
                ' by '
              ),
              _etch2['default'].dom('a', { className: 'icon icon-logo-github', title: 'GitHub', href: 'https://github.com' })
            )
          )
        )
      );
    }
  }, {
    key: 'update',
    value: function update() {
      return _etch2['default'].update(this);
    }
  }, {
    key: 'consent',
    value: function consent() {
      atom.config.set('core.telemetryConsent', 'limited');
      atom.workspace.closeActivePaneItemOrEmptyPaneOrWindow();
    }
  }, {
    key: 'decline',
    value: function decline() {
      atom.config.set('core.telemetryConsent', 'no');
      atom.workspace.closeActivePaneItemOrEmptyPaneOrWindow();
    }
  }, {
    key: 'openMetricsPackage',
    value: function openMetricsPackage() {
      atom.workspace.open('atom://config/packages/metrics');
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return "Telemetry Consent";
    }
  }, {
    key: 'destroy',
    value: _asyncToGenerator(function* () {
      yield _etch2['default'].destroy(this);
    })
  }]);

  return ConsentView;
})();

exports['default'] = ConsentView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvd2VsY29tZS9saWIvY29uc2VudC12aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O29CQUdpQixNQUFNOzs7O0FBSHZCLFdBQVcsQ0FBQTtJQUtVLFdBQVc7QUFDbEIsV0FETyxXQUFXLEdBQ2Y7MEJBREksV0FBVzs7QUFFNUIsc0JBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQ3RCOztlQUhrQixXQUFXOztXQUt2QixrQkFBRztBQUNSLGFBQ0U7O1VBQUssU0FBUyxFQUFDLFNBQVM7UUFDdEI7O1lBQUssU0FBUyxFQUFDLG1CQUFtQjtVQUNoQzs7Y0FBSyxTQUFTLEVBQUMsUUFBUTtZQUNyQjs7Z0JBQUcsS0FBSyxFQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsa0JBQWtCO2NBQ3hDOztrQkFBSyxTQUFNLGNBQWMsRUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFlBQVksRUFBQyxPQUFPLEVBQUMsS0FBSztnQkFDdEY7O29CQUFHLE1BQU0sRUFBQyxNQUFNLEVBQUMsZ0JBQWEsR0FBRyxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsYUFBVSxTQUFTO2tCQUM3RDs7c0JBQUcsU0FBUyxFQUFDLCtCQUErQjtvQkFDeEM7O3dCQUFHLFNBQVMsRUFBQyxnQ0FBZ0MsRUFBQyxJQUFJLEVBQUMsY0FBYztzQkFDN0QsZ0NBQU0sQ0FBQyxFQUFDLGluQkFBaW5CLEdBQVE7c0JBQ2pvQixnQ0FBTSxDQUFDLEVBQUMsZ2NBQWdjLEdBQVE7c0JBQ2hkLGdDQUFNLENBQUMsRUFBQywwVkFBMFYsR0FBUTtzQkFDMVcsZ0NBQU0sQ0FBQyxFQUFDLGdnQkFBZ2dCLEdBQVE7cUJBQ2hoQjtvQkFDSjs7O3NCQUNJLGdDQUFNLENBQUMsRUFBQyxzTEFBc0wsRUFBQyxJQUFJLEVBQUMsY0FBYyxHQUFRO3NCQUMxTixnQ0FBTSxDQUFDLEVBQUMsd0xBQXdMLEVBQUMsTUFBTSxFQUFDLGNBQWMsRUFBQyxnQkFBYSxNQUFNLEVBQUMsa0JBQWUsT0FBTyxHQUFRO3NCQUN6USxnQ0FBTSxDQUFDLEVBQUMsa0xBQWtMLEVBQUMsTUFBTSxFQUFDLGNBQWMsRUFBQyxnQkFBYSxNQUFNLEVBQUMsa0JBQWUsT0FBTyxHQUFRO3NCQUNuUSxnQ0FBTSxDQUFDLEVBQUMsc0xBQXNMLEVBQUMsTUFBTSxFQUFDLGNBQWMsRUFBQyxnQkFBYSxNQUFNLEVBQUMsa0JBQWUsT0FBTyxHQUFRO3FCQUN2UTttQkFDSjtpQkFDSjtlQUNBO2FBQ0o7V0FDQTtVQUNOOztjQUFLLFNBQVMsRUFBQyxpQkFBaUI7WUFDOUI7Ozs7YUFBZ0o7WUFDaEo7O2dCQUFHLFNBQVMsRUFBQyxjQUFjOztjQUFxSTs7a0JBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2VBQXlCOzthQUFzQztZQUU5UTs7Z0JBQUssU0FBUyxFQUFDLHlCQUF5QjtjQUN0Qzs7O2dCQUNFOztvQkFBUSxTQUFTLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQUFBQzs7aUJBQWtDO2dCQUMzRjs7b0JBQUcsU0FBUyxFQUFDLGNBQWM7O2lCQUE0RztlQUNuSTtjQUVOOzs7Z0JBQ0U7O29CQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2lCQUEwQztnQkFDL0c7O29CQUFHLFNBQVMsRUFBQyxjQUFjOztpQkFBZ0Y7ZUFDdkc7YUFDRjtXQUNGO1VBRU47O2NBQUssU0FBUyxFQUFDLGdCQUFnQjtZQUM3Qjs7Z0JBQUcsU0FBUyxFQUFDLGNBQWM7Y0FDekIsZ0NBQU0sU0FBUyxFQUFDLGdCQUFnQixHQUFRO2NBQ3hDOztrQkFBTSxTQUFTLEVBQUMsUUFBUTs7ZUFBYztjQUN0QyxnQ0FBTSxTQUFTLEVBQUMsaUJBQWlCLEdBQVE7Y0FDekM7O2tCQUFNLFNBQVMsRUFBQyxRQUFROztlQUFZO2NBQ3BDLDZCQUFHLFNBQVMsRUFBQyx1QkFBdUIsRUFBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxvQkFBb0IsR0FBRzthQUM5RTtXQUNBO1NBQ0Y7T0FDRixDQUNQO0tBQ0Y7OztXQUVNLGtCQUFHO0FBQ1IsYUFBTyxrQkFBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDekI7OztXQUVPLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDbkQsVUFBSSxDQUFDLFNBQVMsQ0FBQyxzQ0FBc0MsRUFBRSxDQUFBO0tBQ3hEOzs7V0FFTyxtQkFBRztBQUNULFVBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxDQUFBO0FBQzlDLFVBQUksQ0FBQyxTQUFTLENBQUMsc0NBQXNDLEVBQUUsQ0FBQTtLQUN4RDs7O1dBRWtCLDhCQUFHO0FBQ3BCLFVBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUE7S0FDdEQ7OztXQUVRLG9CQUFHO0FBQ1YsYUFBTyxtQkFBbUIsQ0FBQTtLQUMzQjs7OzZCQUVhLGFBQUc7QUFDZixZQUFNLGtCQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUN6Qjs7O1NBdEZrQixXQUFXOzs7cUJBQVgsV0FBVyIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL3dlbGNvbWUvbGliL2NvbnNlbnQtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuXG5pbXBvcnQgZXRjaCBmcm9tICdldGNoJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25zZW50VmlldyB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBldGNoLmluaXRpYWxpemUodGhpcylcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSd3ZWxjb21lJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J3dlbGNvbWUtY29udGFpbmVyJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0naGVhZGVyJz5cbiAgICAgICAgICAgIDxhIHRpdGxlPSdhdG9tLmlvJyBocmVmPSdodHRwczovL2F0b20uaW8vJz5cbiAgICAgICAgICAgICAgPHN2ZyBjbGFzcz1cIndlbGNvbWUtbG9nb1wiIHdpZHRoPVwiMzMwcHhcIiBoZWlnaHQ9XCI2OHB4XCIgdmlld0JveD1cIjAgMCAzMzAgNjhcIiB2ZXJzaW9uPVwiMS4xXCI+XG4gICAgICAgICAgICAgICAgPGcgc3Ryb2tlPVwibm9uZVwiIHN0cm9rZS13aWR0aD1cIjFcIiBmaWxsPVwibm9uZVwiIGZpbGwtcnVsZT1cImV2ZW5vZGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDIuMDAwMDAwLCAxLjAwMDAwMClcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg5Ni4wMDAwMDAsIDguMDAwMDAwKVwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTE4NS40OTgsMy4zOTkgQzE4NS40OTgsMi40MTcgMTg2LjM0LDEuNTczIDE4Ny4zMjQsMS41NzMgTDE4Ny42NzQsMS41NzMgQzE4OC40NDcsMS41NzMgMTg5LjAxLDEuOTk1IDE4OS41LDIuNjI4IEwyMDguNjc2LDMwLjg2MiBMMjI3Ljg1MiwyLjYyOCBDMjI4LjI3MiwxLjk5NSAyMjguOTA1LDEuNTczIDIyOS42NzYsMS41NzMgTDIzMC4wMjgsMS41NzMgQzIzMS4wMSwxLjU3MyAyMzEuODU0LDIuNDE3IDIzMS44NTQsMy4zOTkgTDIzMS44NTQsNDkuNDAzIEMyMzEuODU0LDUwLjM4NyAyMzEuMDEsNTEuMjMxIDIzMC4wMjgsNTEuMjMxIEMyMjkuMDQ0LDUxLjIzMSAyMjguMjAyLDUwLjM4NyAyMjguMjAyLDQ5LjQwMyBMMjI4LjIwMiw4LjI0NiBMMjEwLjE1MSwzNC41MTUgQzIwOS43MjksMzUuMTQ4IDIwOS4yMzcsMzUuNDI4IDIwOC42MDYsMzUuNDI4IEMyMDcuOTczLDM1LjQyOCAyMDcuNDgxLDM1LjE0OCAyMDcuMDYxLDM0LjUxNSBMMTg5LjAxLDguMjQ2IEwxODkuMDEsNDkuNDc1IEMxODkuMDEsNTAuNDU3IDE4OC4yMzcsNTEuMjMxIDE4Ny4yNTQsNTEuMjMxIEMxODYuMjcsNTEuMjMxIDE4NS40OTgsNTAuNDU4IDE4NS40OTgsNDkuNDc1IEwxODUuNDk4LDMuMzk5IEwxODUuNDk4LDMuMzk5IFpcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMTMuMDg2LDI2LjUwNyBMMTEzLjA4NiwyNi4zNjcgQzExMy4wODYsMTIuOTUyIDEyMi45OSwwLjk0MSAxMzcuODgxLDAuOTQxIEMxNTIuNzcsMC45NDEgMTYyLjUzMywxMi44MTEgMTYyLjUzMywyNi4yMjUgTDE2Mi41MzMsMjYuMzY3IEMxNjIuNTMzLDM5Ljc4MiAxNTIuNjI5LDUxLjc5MiAxMzcuNzQsNTEuNzkyIEMxMjIuODUsNTEuNzkyIDExMy4wODYsMzkuOTIzIDExMy4wODYsMjYuNTA3IE0xNTguNzQsMjYuNTA3IEwxNTguNzQsMjYuMzY3IEMxNTguNzQsMTQuMjE2IDE0OS44OSw0LjI0MiAxMzcuNzQsNC4yNDIgQzEyNS41ODgsNC4yNDIgMTE2Ljg3OSwxNC4wNzUgMTE2Ljg3OSwyNi4yMjUgTDExNi44NzksMjYuMzY3IEMxMTYuODc5LDM4LjUxOCAxMjUuNzI5LDQ4LjQ5MSAxMzcuODgxLDQ4LjQ5MSBDMTUwLjAzMSw0OC40OTEgMTU4Ljc0LDM4LjY1OCAxNTguNzQsMjYuNTA3XCI+PC9wYXRoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNNzYuNzA1LDUuMTU1IEw2MC45NzIsNS4xNTUgQzYwLjA2LDUuMTU1IDU5LjI4Nyw0LjM4NCA1OS4yODcsMy40NjkgQzU5LjI4NywyLjU1NiA2MC4wNTksMS43ODMgNjAuOTcyLDEuNzgzIEw5Ni4wOTIsMS43ODMgQzk3LjAwNCwxLjc4MyA5Ny43NzgsMi41NTUgOTcuNzc4LDMuNDY5IEM5Ny43NzgsNC4zODMgOTcuMDA1LDUuMTU1IDk2LjA5Miw1LjE1NSBMODAuMzU4LDUuMTU1IEw4MC4zNTgsNDkuNDA1IEM4MC4zNTgsNTAuMzg3IDc5LjUxNiw1MS4yMzEgNzguNTMyLDUxLjIzMSBDNzcuNTUsNTEuMjMxIDc2LjcwNiw1MC4zODcgNzYuNzA2LDQ5LjQwNSBMNzYuNzA2LDUuMTU1IEw3Ni43MDUsNS4xNTUgWlwiPjwvcGF0aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTAuMjkxLDQ4LjU2MiBMMjEuMjkxLDMuMDUgQzIxLjc4MywxLjk5NSAyMi40ODUsMS4yOTIgMjMuNzUsMS4yOTIgTDIzLjg5MSwxLjI5MiBDMjUuMTU1LDEuMjkyIDI1Ljg1OCwxLjk5NSAyNi4zNDgsMy4wNSBMNDcuMjc5LDQ4LjQyMSBDNDcuNDksNDguODQzIDQ3LjU2LDQ5LjE5NCA0Ny41Niw0OS41NDYgQzQ3LjU2LDUwLjQ1OCA0Ni43ODgsNTEuMjMxIDQ1LjgwMyw1MS4yMzEgQzQ0Ljk2MSw1MS4yMzEgNDQuMzI5LDUwLjU5OSA0My45NzgsNDkuODI2IEwzOC4yMTksMzcuMTgzIEw5LjIxLDM3LjE4MyBMMy40NSw0OS44OTcgQzMuMDk5LDUwLjczOSAyLjUzOCw1MS4yMzEgMS42OTQsNTEuMjMxIEMwLjc4MSw1MS4yMzEgMC4wMDgsNTAuNTI5IDAuMDA4LDQ5LjY4NSBDMC4wMDksNDkuNDA0IDAuMDgsNDguOTgzIDAuMjkxLDQ4LjU2MiBMMC4yOTEsNDguNTYyIFogTTM2LjY3MywzMy44ODIgTDIzLjc0OSw1LjQzNyBMMTAuNzU1LDMzLjg4MiBMMzYuNjczLDMzLjg4MiBMMzYuNjczLDMzLjg4MiBaXCI+PC9wYXRoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk00MC4zNjMsMzIuMDc1IEM0MC44NzQsMzQuNDQgMzkuMzcxLDM2Ljc3IDM3LjAwNiwzNy4yODIgQzM0LjY0MSwzNy43OTMgMzIuMzExLDM2LjI5IDMxLjc5OSwzMy45MjUgQzMxLjI4OSwzMS41NiAzMi43OTEsMjkuMjMgMzUuMTU2LDI4LjcxOCBDMzcuNTIxLDI4LjIwNyAzOS44NTEsMjkuNzEgNDAuMzYzLDMyLjA3NVwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk00OC41NzgsMjguNjE1IEM1Ni44NTEsNDUuNTg3IDU4LjU1OCw2MS41ODEgNTIuMjg4LDY0Ljc3OCBDNDUuODIyLDY4LjA3NiAzMy4zMjYsNTYuNTIxIDI0LjM3NSwzOC45NjkgQzE1LjQyNCwyMS40MTggMTMuNDA5LDQuNTE4IDE5Ljg3NCwxLjIyMSBDMjIuNjg5LC0wLjIxNiAyNi42NDgsMS4xNjYgMzAuOTU5LDQuNjI5XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMy4wOFwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk03LjY0LDM5LjQ1IEMyLjgwNiwzNi45NCAtMC4wMDksMzMuOTE1IDAuMTU0LDMwLjc5IEMwLjUzMSwyMy41NDIgMTYuNzg3LDE4LjQ5NyAzNi40NjIsMTkuNTIgQzU2LjEzNywyMC41NDQgNzEuNzgxLDI3LjI0OSA3MS40MDQsMzQuNDk3IEM3MS4yNDEsMzcuNjIyIDY4LjEyNyw0MC4zMzggNjMuMDYsNDIuMzMzXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMy4wOFwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0yOC44MjgsNTkuMzU0IEMyMy41NDUsNjMuMTY4IDE4Ljg0Myw2NC41NjEgMTUuOTAyLDYyLjY1MyBDOS44MTQsNTguNzAyIDEzLjU3Miw0Mi4xMDIgMjQuMjk2LDI1LjU3NSBDMzUuMDIsOS4wNDggNDguNjQ5LC0xLjE0OSA1NC43MzYsMi44MDMgQzU3LjU2Niw0LjYzOSA1OC4yNjksOS4yMDggNTcuMTMzLDE1LjIzMlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjMuMDhcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCI+PC9wYXRoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIndlbGNvbWUtY29uc2VudFwiPlxuICAgICAgICAgICAgPHA+VG8gaGVscCBpbXByb3ZlIEF0b20sIHlvdSBjYW4gYW5vbnltb3VzbHkgc2VuZCB1c2FnZSBzdGF0cyB0byB0aGUgdGVhbS4gVGhlIHJlc3VsdGluZyBkYXRhIHBsYXlzIGEga2V5IHJvbGUgaW4gZGVjaWRpbmcgd2hhdCB0byBmb2N1cyBvbi48L3A+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ3ZWxjb21lLW5vdGVcIj5UaGUgZGF0YSB3ZSBzZW5kIGlzIG1pbmltYWwuIEJyb2FkbHksIHdlIHNlbmQgdGhpbmdzIGxpa2Ugc3RhcnR1cCB0aW1lLCBzZXNzaW9uIHRpbWUsIGFuZCBleGNlcHRpb25zIOKAlCBuZXZlciBjb2RlIG9yIHBhdGhzLiBTZWUgdGhlIDxhIG9uY2xpY2s9e3RoaXMub3Blbk1ldHJpY3NQYWNrYWdlLmJpbmQodGhpcyl9PmF0b20vbWV0cmljcyBwYWNrYWdlPC9hPiBmb3IgZGV0YWlscyBvbiB3aGF0IGRhdGEgaXMgc2VudC48L3A+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwid2VsY29tZS1jb25zZW50LWNob2ljZXNcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0blwiIG9uY2xpY2s9e3RoaXMuZGVjbGluZS5iaW5kKHRoaXMpfT5ObywgSSBkb24ndCB3YW50IHRvIGhlbHA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ3ZWxjb21lLW5vdGVcIj5CeSBvcHRpbmcgb3V0LCB5b3VyIHVzYWdlIHBhdHRlcm5zIHdpbGwgbm90IGJlIHRha2VuIGludG8gYWNjb3VudC4gV2Ugb25seSByZWdpc3RlciB0aGF0IHlvdSBvcHRlZC1vdXQuPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25jbGljaz17dGhpcy5jb25zZW50LmJpbmQodGhpcyl9PlllcywgSSB3YW50IHRvIGhlbHAgaW1wcm92ZSBBdG9tPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwid2VsY29tZS1ub3RlXCI+WW91IGFyZSBoZWxwaW5nIHVzIGFzc2VzcyBBdG9tJ3MgcGVyZm9ybWFuY2UgYW5kIHVuZGVyc3RhbmQgdXNhZ2UgcGF0dGVybnMuPC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3ZWxjb21lLWZvb3RlclwiPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwid2VsY29tZS1sb3ZlXCI+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1jb2RlXCI+PC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmVcIj4gd2l0aCA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1oZWFydFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaW5saW5lXCI+IGJ5IDwvc3Bhbj5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiaWNvbiBpY29uLWxvZ28tZ2l0aHViXCIgdGl0bGU9XCJHaXRIdWJcIiBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tXCIgLz5cbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxuICB1cGRhdGUgKCkge1xuICAgIHJldHVybiBldGNoLnVwZGF0ZSh0aGlzKVxuICB9XG5cbiAgY29uc2VudCAoKSB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdjb3JlLnRlbGVtZXRyeUNvbnNlbnQnLCAnbGltaXRlZCcpXG4gICAgYXRvbS53b3Jrc3BhY2UuY2xvc2VBY3RpdmVQYW5lSXRlbU9yRW1wdHlQYW5lT3JXaW5kb3coKVxuICB9XG5cbiAgZGVjbGluZSAoKSB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdjb3JlLnRlbGVtZXRyeUNvbnNlbnQnLCAnbm8nKVxuICAgIGF0b20ud29ya3NwYWNlLmNsb3NlQWN0aXZlUGFuZUl0ZW1PckVtcHR5UGFuZU9yV2luZG93KClcbiAgfVxuXG4gIG9wZW5NZXRyaWNzUGFja2FnZSAoKSB7XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9tZXRyaWNzJylcbiAgfVxuXG4gIGdldFRpdGxlICgpIHtcbiAgICByZXR1cm4gXCJUZWxlbWV0cnkgQ29uc2VudFwiXG4gIH1cblxuICBhc3luYyBkZXN0cm95ICgpIHtcbiAgICBhd2FpdCBldGNoLmRlc3Ryb3kodGhpcylcbiAgfVxufVxuIl19