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

var _shell = require('shell');

var _shell2 = _interopRequireDefault(_shell);

var _atomLogo = require('./atom-logo');

var _atomLogo2 = _interopRequireDefault(_atomLogo);

var _etchComponent = require('../etch-component');

var _etchComponent2 = _interopRequireDefault(_etchComponent);

var _updateView = require('./update-view');

var _updateView2 = _interopRequireDefault(_updateView);

var AboutView = (function (_EtchComponent) {
  _inherits(AboutView, _EtchComponent);

  function AboutView() {
    _classCallCheck(this, AboutView);

    _get(Object.getPrototypeOf(AboutView.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(AboutView, [{
    key: 'handleVersionClick',
    value: function handleVersionClick(e) {
      e.preventDefault();
      atom.clipboard.write(this.props.currentVersion);
    }
  }, {
    key: 'handleReleaseNotesClick',
    value: function handleReleaseNotesClick(e) {
      e.preventDefault();
      _shell2['default'].openExternal(this.props.updateManager.getReleaseNotesURLForAvailableVersion());
    }
  }, {
    key: 'handleLicenseClick',
    value: function handleLicenseClick(e) {
      e.preventDefault();
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open-license');
    }
  }, {
    key: 'handleTermsOfUseClick',
    value: function handleTermsOfUseClick(e) {
      e.preventDefault();
      _shell2['default'].openExternal('https://help.github.com/articles/github-terms-of-service');
    }
  }, {
    key: 'render',
    value: function render() {
      return _etch2['default'].dom(
        'div',
        { className: 'pane-item native-key-bindings about' },
        _etch2['default'].dom(
          'div',
          { className: 'about-container' },
          _etch2['default'].dom(
            'header',
            { className: 'about-header' },
            _etch2['default'].dom(
              'a',
              { className: 'about-atom-io', href: 'https://atom.io/' },
              _etch2['default'].dom(_atomLogo2['default'], null)
            ),
            _etch2['default'].dom(
              'div',
              { className: 'about-header-info' },
              _etch2['default'].dom(
                'span',
                { className: 'about-version-container inline-block', onclick: this.handleVersionClick.bind(this) },
                _etch2['default'].dom(
                  'span',
                  { className: 'about-version' },
                  this.props.currentVersion,
                  ' ',
                  process.arch
                ),
                _etch2['default'].dom('span', { className: 'icon icon-clippy about-copy-version' })
              ),
              _etch2['default'].dom(
                'a',
                { className: 'about-header-release-notes', onclick: this.handleReleaseNotesClick.bind(this) },
                'Release Notes'
              )
            )
          ),
          _etch2['default'].dom(_updateView2['default'], { updateManager: this.props.updateManager, availableVersion: this.props.availableVersion, viewUpdateReleaseNotes: this.handleReleaseNotesClick.bind(this) }),
          _etch2['default'].dom(
            'div',
            { className: 'about-actions group-item' },
            _etch2['default'].dom(
              'div',
              { className: 'btn-group' },
              _etch2['default'].dom(
                'button',
                { className: 'btn view-license', onclick: this.handleLicenseClick.bind(this) },
                'License'
              ),
              _etch2['default'].dom(
                'button',
                { className: 'btn terms-of-use', onclick: this.handleTermsOfUseClick.bind(this) },
                'Terms of Use'
              )
            )
          ),
          _etch2['default'].dom(
            'div',
            { className: 'about-love group-start' },
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
            _etch2['default'].dom('a', { className: 'icon icon-logo-github', href: 'https://github.com' })
          ),
          _etch2['default'].dom(
            'div',
            { className: 'about-credits group-item' },
            _etch2['default'].dom(
              'span',
              { className: 'inline' },
              'And the awesome '
            ),
            _etch2['default'].dom(
              'a',
              { href: 'https://github.com/atom/atom/contributors' },
              'Atom Community'
            )
          )
        )
      );
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return {
        deserializer: this.constructor.name,
        uri: this.props.uri
      };
    }
  }, {
    key: 'onDidChangeTitle',
    value: function onDidChangeTitle() {
      return new _atom.Disposable();
    }
  }, {
    key: 'onDidChangeModified',
    value: function onDidChangeModified() {
      return new _atom.Disposable();
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return 'About';
    }
  }, {
    key: 'getIconName',
    value: function getIconName() {
      return 'info';
    }
  }]);

  return AboutView;
})(_etchComponent2['default']);

exports['default'] = AboutView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2NvbXBvbmVudHMvYWJvdXQtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7b0JBSXlCLE1BQU07O29CQUNkLE1BQU07Ozs7cUJBQ0wsT0FBTzs7Ozt3QkFDSixhQUFhOzs7OzZCQUNSLG1CQUFtQjs7OzswQkFDdEIsZUFBZTs7OztJQUVqQixTQUFTO1lBQVQsU0FBUzs7V0FBVCxTQUFTOzBCQUFULFNBQVM7OytCQUFULFNBQVM7OztlQUFULFNBQVM7O1dBQ1QsNEJBQUMsQ0FBQyxFQUFFO0FBQ3JCLE9BQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNsQixVQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0tBQ2hEOzs7V0FFdUIsaUNBQUMsQ0FBQyxFQUFFO0FBQzFCLE9BQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNsQix5QkFBTSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFBO0tBQ3JGOzs7V0FFa0IsNEJBQUMsQ0FBQyxFQUFFO0FBQ3JCLE9BQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNsQixVQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQTtLQUN2Rjs7O1dBRXFCLCtCQUFDLENBQUMsRUFBRTtBQUN4QixPQUFDLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDbEIseUJBQU0sWUFBWSxDQUFDLDBEQUEwRCxDQUFDLENBQUE7S0FDL0U7OztXQUVNLGtCQUFHO0FBQ1IsYUFDRTs7VUFBSyxTQUFTLEVBQUMscUNBQXFDO1FBQ2xEOztZQUFLLFNBQVMsRUFBQyxpQkFBaUI7VUFDOUI7O2NBQVEsU0FBUyxFQUFDLGNBQWM7WUFDOUI7O2dCQUFHLFNBQVMsRUFBQyxlQUFlLEVBQUMsSUFBSSxFQUFDLGtCQUFrQjtjQUNsRCxrREFBWTthQUNWO1lBQ0o7O2dCQUFLLFNBQVMsRUFBQyxtQkFBbUI7Y0FDaEM7O2tCQUFNLFNBQVMsRUFBQyxzQ0FBc0MsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQUFBQztnQkFDakc7O29CQUFNLFNBQVMsRUFBQyxlQUFlO2tCQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYzs7a0JBQUcsT0FBTyxDQUFDLElBQUk7aUJBQVE7Z0JBQ2pGLGdDQUFNLFNBQVMsRUFBQyxxQ0FBcUMsR0FBUTtlQUN4RDtjQUNQOztrQkFBRyxTQUFTLEVBQUMsNEJBQTRCLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2VBQWtCO2FBQ3pHO1dBQ0M7VUFFVCxpREFBWSxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEFBQUMsRUFBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixBQUFDLEVBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQUFBQyxHQUFFO1VBRXRLOztjQUFLLFNBQVMsRUFBQywwQkFBMEI7WUFDdkM7O2dCQUFLLFNBQVMsRUFBQyxXQUFXO2NBQ3hCOztrQkFBUSxTQUFTLEVBQUMsa0JBQWtCLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2VBQWlCO2NBQ2xHOztrQkFBUSxTQUFTLEVBQUMsa0JBQWtCLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2VBQXNCO2FBQ3RHO1dBQ0Y7VUFFTjs7Y0FBSyxTQUFTLEVBQUMsd0JBQXdCO1lBQ3JDLGdDQUFNLFNBQVMsRUFBQyxnQkFBZ0IsR0FBRTtZQUNsQzs7Z0JBQU0sU0FBUyxFQUFDLFFBQVE7O2FBQWM7WUFDdEMsZ0NBQU0sU0FBUyxFQUFDLGlCQUFpQixHQUFFO1lBQ25DOztnQkFBTSxTQUFTLEVBQUMsUUFBUTs7YUFBWTtZQUNwQyw2QkFBRyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsSUFBSSxFQUFDLG9CQUFvQixHQUFLO1dBQy9EO1VBRU47O2NBQUssU0FBUyxFQUFDLDBCQUEwQjtZQUN2Qzs7Z0JBQU0sU0FBUyxFQUFDLFFBQVE7O2FBQXdCO1lBQ2hEOztnQkFBRyxJQUFJLEVBQUMsMkNBQTJDOzthQUFtQjtXQUNsRTtTQUNGO09BQ0YsQ0FDUDtLQUNGOzs7V0FFUyxxQkFBRztBQUNYLGFBQU87QUFDTCxvQkFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSTtBQUNuQyxXQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHO09BQ3BCLENBQUE7S0FDRjs7O1dBRWdCLDRCQUFHO0FBQ2xCLGFBQU8sc0JBQWdCLENBQUE7S0FDeEI7OztXQUVtQiwrQkFBRztBQUNyQixhQUFPLHNCQUFnQixDQUFBO0tBQ3hCOzs7V0FFUSxvQkFBRztBQUNWLGFBQU8sT0FBTyxDQUFBO0tBQ2Y7OztXQUVXLHVCQUFHO0FBQ2IsYUFBTyxNQUFNLENBQUE7S0FDZDs7O1NBckZrQixTQUFTOzs7cUJBQVQsU0FBUyIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2Fib3V0L2xpYi9jb21wb25lbnRzL2Fib3V0LXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVhY3Qvbm8tdW5rbm93bi1wcm9wZXJ0eSAqL1xuXG5pbXBvcnQge0Rpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5pbXBvcnQgZXRjaCBmcm9tICdldGNoJ1xuaW1wb3J0IHNoZWxsIGZyb20gJ3NoZWxsJ1xuaW1wb3J0IEF0b21Mb2dvIGZyb20gJy4vYXRvbS1sb2dvJ1xuaW1wb3J0IEV0Y2hDb21wb25lbnQgZnJvbSAnLi4vZXRjaC1jb21wb25lbnQnXG5pbXBvcnQgVXBkYXRlVmlldyBmcm9tICcuL3VwZGF0ZS12aWV3J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBYm91dFZpZXcgZXh0ZW5kcyBFdGNoQ29tcG9uZW50IHtcbiAgaGFuZGxlVmVyc2lvbkNsaWNrIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUodGhpcy5wcm9wcy5jdXJyZW50VmVyc2lvbilcbiAgfVxuXG4gIGhhbmRsZVJlbGVhc2VOb3Rlc0NsaWNrIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc2hlbGwub3BlbkV4dGVybmFsKHRoaXMucHJvcHMudXBkYXRlTWFuYWdlci5nZXRSZWxlYXNlTm90ZXNVUkxGb3JBdmFpbGFibGVWZXJzaW9uKCkpXG4gIH1cblxuICBoYW5kbGVMaWNlbnNlQ2xpY2sgKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdhcHBsaWNhdGlvbjpvcGVuLWxpY2Vuc2UnKVxuICB9XG5cbiAgaGFuZGxlVGVybXNPZlVzZUNsaWNrIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc2hlbGwub3BlbkV4dGVybmFsKCdodHRwczovL2hlbHAuZ2l0aHViLmNvbS9hcnRpY2xlcy9naXRodWItdGVybXMtb2Ytc2VydmljZScpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZS1pdGVtIG5hdGl2ZS1rZXktYmluZGluZ3MgYWJvdXQnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWJvdXQtY29udGFpbmVyJz5cbiAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT0nYWJvdXQtaGVhZGVyJz5cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nYWJvdXQtYXRvbS1pbycgaHJlZj0naHR0cHM6Ly9hdG9tLmlvLyc+XG4gICAgICAgICAgICAgIDxBdG9tTG9nbyAvPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2Fib3V0LWhlYWRlci1pbmZvJz5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdhYm91dC12ZXJzaW9uLWNvbnRhaW5lciBpbmxpbmUtYmxvY2snIG9uY2xpY2s9e3RoaXMuaGFuZGxlVmVyc2lvbkNsaWNrLmJpbmQodGhpcyl9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYWJvdXQtdmVyc2lvbic+e3RoaXMucHJvcHMuY3VycmVudFZlcnNpb259IHtwcm9jZXNzLmFyY2h9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0naWNvbiBpY29uLWNsaXBweSBhYm91dC1jb3B5LXZlcnNpb24nPjwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2Fib3V0LWhlYWRlci1yZWxlYXNlLW5vdGVzJyBvbmNsaWNrPXt0aGlzLmhhbmRsZVJlbGVhc2VOb3Rlc0NsaWNrLmJpbmQodGhpcyl9PlJlbGVhc2UgTm90ZXM8L2E+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2hlYWRlcj5cblxuICAgICAgICAgIDxVcGRhdGVWaWV3IHVwZGF0ZU1hbmFnZXI9e3RoaXMucHJvcHMudXBkYXRlTWFuYWdlcn0gYXZhaWxhYmxlVmVyc2lvbj17dGhpcy5wcm9wcy5hdmFpbGFibGVWZXJzaW9ufSB2aWV3VXBkYXRlUmVsZWFzZU5vdGVzPXt0aGlzLmhhbmRsZVJlbGVhc2VOb3Rlc0NsaWNrLmJpbmQodGhpcyl9Lz5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC1hY3Rpb25zIGdyb3VwLWl0ZW0nPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2J0bi1ncm91cCc+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gdmlldy1saWNlbnNlJyBvbmNsaWNrPXt0aGlzLmhhbmRsZUxpY2Vuc2VDbGljay5iaW5kKHRoaXMpfT5MaWNlbnNlPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gdGVybXMtb2YtdXNlJyBvbmNsaWNrPXt0aGlzLmhhbmRsZVRlcm1zT2ZVc2VDbGljay5iaW5kKHRoaXMpfT5UZXJtcyBvZiBVc2U8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2Fib3V0LWxvdmUgZ3JvdXAtc3RhcnQnPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpY29uIGljb24tY29kZScvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpbmxpbmUnPiB3aXRoIDwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0naWNvbiBpY29uLWhlYXJ0Jy8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2lubGluZSc+IGJ5IDwvc3Bhbj5cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0naWNvbiBpY29uLWxvZ28tZ2l0aHViJyBocmVmPSdodHRwczovL2dpdGh1Yi5jb20nPjwvYT5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC1jcmVkaXRzIGdyb3VwLWl0ZW0nPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpbmxpbmUnPkFuZCB0aGUgYXdlc29tZSA8L3NwYW4+XG4gICAgICAgICAgICA8YSBocmVmPSdodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2NvbnRyaWJ1dG9ycyc+QXRvbSBDb21tdW5pdHk8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgc2VyaWFsaXplICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGVzZXJpYWxpemVyOiB0aGlzLmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICB1cmk6IHRoaXMucHJvcHMudXJpXG4gICAgfVxuICB9XG5cbiAgb25EaWRDaGFuZ2VUaXRsZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKClcbiAgfVxuXG4gIG9uRGlkQ2hhbmdlTW9kaWZpZWQgKCkge1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgpXG4gIH1cblxuICBnZXRUaXRsZSAoKSB7XG4gICAgcmV0dXJuICdBYm91dCdcbiAgfVxuXG4gIGdldEljb25OYW1lICgpIHtcbiAgICByZXR1cm4gJ2luZm8nXG4gIH1cbn1cbiJdfQ==