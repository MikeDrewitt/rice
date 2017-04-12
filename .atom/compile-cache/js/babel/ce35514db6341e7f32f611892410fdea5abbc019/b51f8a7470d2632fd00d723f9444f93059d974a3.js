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

var _updateManager = require('../update-manager');

var _updateManager2 = _interopRequireDefault(_updateManager);

var UpdateView = (function (_EtchComponent) {
  _inherits(UpdateView, _EtchComponent);

  function UpdateView(props) {
    _classCallCheck(this, UpdateView);

    _get(Object.getPrototypeOf(UpdateView.prototype), 'constructor', this).call(this, props);

    if (this.props.updateManager.getAutoUpdatesEnabled() && this.props.updateManager.getState() === _updateManager2['default'].State.Idle) {
      this.props.updateManager.checkForUpdate();
    }
  }

  _createClass(UpdateView, [{
    key: 'handleAutoUpdateCheckbox',
    value: function handleAutoUpdateCheckbox(e) {
      atom.config.set('core.automaticallyUpdate', e.target.checked);
    }
  }, {
    key: 'shouldUpdateActionButtonBeDisabled',
    value: function shouldUpdateActionButtonBeDisabled() {
      var state = this.props.updateManager.state;

      return state === _updateManager2['default'].State.CheckingForUpdate || state === _updateManager2['default'].State.DownloadingUpdate;
    }
  }, {
    key: 'executeUpdateAction',
    value: function executeUpdateAction() {
      if (this.props.updateManager.state === _updateManager2['default'].State.UpdateAvailableToInstall) {
        this.props.updateManager.restartAndInstallUpdate();
      } else {
        this.props.updateManager.checkForUpdate();
      }
    }
  }, {
    key: 'renderUpdateStatus',
    value: function renderUpdateStatus() {
      var updateStatus = null;

      switch (this.props.updateManager.state) {
        case _updateManager2['default'].State.Idle:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item is-shown about-default-update-message' },
            this.props.updateManager.getAutoUpdatesEnabled() ? 'Atom will check for updates automatically' : 'Automatic updates are disabled please check manually'
          );
          break;
        case _updateManager2['default'].State.CheckingForUpdate:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item app-checking-for-updates' },
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-label icon icon-search' },
              'Checking for updates...'
            )
          );
          break;
        case _updateManager2['default'].State.DownloadingUpdate:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item app-downloading-update' },
            _etch2['default'].dom('span', { className: 'loading loading-spinner-tiny inline-block' }),
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-label' },
              'Downloading update'
            )
          );
          break;
        case _updateManager2['default'].State.UpdateAvailableToInstall:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item app-update-available-to-install' },
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-label icon icon-squirrel' },
              'New update'
            ),
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-version' },
              this.props.availableVersion
            ),
            _etch2['default'].dom(
              'a',
              { className: 'about-updates-release-notes', onclick: this.props.viewUpdateReleaseNotes },
              'Release Notes'
            )
          );
          break;
        case _updateManager2['default'].State.UpToDate:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item app-up-to-date' },
            _etch2['default'].dom('span', { className: 'icon icon-check' }),
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-label is-strong' },
              'Atom is up to date!'
            )
          );
          break;
        case _updateManager2['default'].State.Error:
          updateStatus = _etch2['default'].dom(
            'div',
            { className: 'about-updates-item app-update-error' },
            _etch2['default'].dom('span', { className: 'icon icon-x' }),
            _etch2['default'].dom(
              'span',
              { className: 'about-updates-label app-error-message is-strong' },
              this.props.updateManager.getErrorMessage()
            )
          );
          break;
      }

      return updateStatus;
    }
  }, {
    key: 'render',
    value: function render() {
      return _etch2['default'].dom(
        'div',
        { className: 'about-updates group-start', style: {
            display: this.props.updateManager.state === _updateManager2['default'].State.Unsupported ? 'none' : 'block'
          } },
        _etch2['default'].dom(
          'div',
          { className: 'about-updates-box' },
          _etch2['default'].dom(
            'div',
            { className: 'about-updates-status' },
            this.renderUpdateStatus()
          ),
          _etch2['default'].dom(
            'button',
            { className: 'btn about-update-action-button', disabled: this.shouldUpdateActionButtonBeDisabled(), onclick: this.executeUpdateAction.bind(this) },
            this.props.updateManager.state === 'update-available' ? 'Restart and install' : 'Check now'
          )
        ),
        _etch2['default'].dom(
          'div',
          { className: 'about-auto-updates' },
          _etch2['default'].dom(
            'label',
            null,
            _etch2['default'].dom('input', { className: 'input-checkbox', type: 'checkbox', checked: this.props.updateManager.getAutoUpdatesEnabled(), onchange: this.handleAutoUpdateCheckbox.bind(this) }),
            _etch2['default'].dom(
              'span',
              null,
              'Automatically download updates'
            )
          )
        )
      );
    }
  }]);

  return UpdateView;
})(_etchComponent2['default']);

exports['default'] = UpdateView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2NvbXBvbmVudHMvdXBkYXRlLXZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQUlpQixNQUFNOzs7OzZCQUNHLG1CQUFtQjs7Ozs2QkFDbkIsbUJBQW1COzs7O0lBRXhCLFVBQVU7WUFBVixVQUFVOztBQUNqQixXQURPLFVBQVUsQ0FDaEIsS0FBSyxFQUFFOzBCQURELFVBQVU7O0FBRTNCLCtCQUZpQixVQUFVLDZDQUVyQixLQUFLLEVBQUM7O0FBRVosUUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLDJCQUFjLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDeEgsVUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUE7S0FDMUM7R0FDRjs7ZUFQa0IsVUFBVTs7V0FTSixrQ0FBQyxDQUFDLEVBQUU7QUFDM0IsVUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtLQUM5RDs7O1dBRWtDLDhDQUFHO1VBQy9CLEtBQUssR0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBakMsS0FBSzs7QUFDVixhQUFPLEtBQUssS0FBSywyQkFBYyxLQUFLLENBQUMsaUJBQWlCLElBQUksS0FBSyxLQUFLLDJCQUFjLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQTtLQUMxRzs7O1dBRW1CLCtCQUFHO0FBQ3JCLFVBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxLQUFLLDJCQUFjLEtBQUssQ0FBQyx3QkFBd0IsRUFBRTtBQUNuRixZ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SSxDQUFDLEFBQUM7WUFDbEosSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxLQUFLLGtCQUFrQixHQUFHLHFCQUFxQixHQUFHLFdBQVc7V0FDckY7U0FDTDtRQUVOOztZQUFLLFNBQVMsRUFBQyxvQkFBb0I7VUFDakM7OztZQUNFLGlDQUFPLFNBQVMsRUFBQyxnQkFBZ0IsRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxBQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUMsR0FBRTtZQUNsSzs7OzthQUEyQztXQUNyQztTQUNKO09BRUYsQ0FDUDtLQUNGOzs7U0E1R2tCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2NvbXBvbmVudHMvdXBkYXRlLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVhY3Qvbm8tdW5rbm93bi1wcm9wZXJ0eSAqL1xuXG5pbXBvcnQgZXRjaCBmcm9tICdldGNoJ1xuaW1wb3J0IEV0Y2hDb21wb25lbnQgZnJvbSAnLi4vZXRjaC1jb21wb25lbnQnXG5pbXBvcnQgVXBkYXRlTWFuYWdlciBmcm9tICcuLi91cGRhdGUtbWFuYWdlcidcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBkYXRlVmlldyBleHRlbmRzIEV0Y2hDb21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIGlmICh0aGlzLnByb3BzLnVwZGF0ZU1hbmFnZXIuZ2V0QXV0b1VwZGF0ZXNFbmFibGVkKCkgJiYgdGhpcy5wcm9wcy51cGRhdGVNYW5hZ2VyLmdldFN0YXRlKCkgPT09IFVwZGF0ZU1hbmFnZXIuU3RhdGUuSWRsZSkge1xuICAgICAgdGhpcy5wcm9wcy51cGRhdGVNYW5hZ2VyLmNoZWNrRm9yVXBkYXRlKClcbiAgICB9XG4gIH1cblxuICBoYW5kbGVBdXRvVXBkYXRlQ2hlY2tib3ggKGUpIHtcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ2NvcmUuYXV0b21hdGljYWxseVVwZGF0ZScsIGUudGFyZ2V0LmNoZWNrZWQpXG4gIH1cblxuICBzaG91bGRVcGRhdGVBY3Rpb25CdXR0b25CZURpc2FibGVkICgpIHtcbiAgICBsZXQge3N0YXRlfSA9IHRoaXMucHJvcHMudXBkYXRlTWFuYWdlclxuICAgIHJldHVybiBzdGF0ZSA9PT0gVXBkYXRlTWFuYWdlci5TdGF0ZS5DaGVja2luZ0ZvclVwZGF0ZSB8fCBzdGF0ZSA9PT0gVXBkYXRlTWFuYWdlci5TdGF0ZS5Eb3dubG9hZGluZ1VwZGF0ZVxuICB9XG5cbiAgZXhlY3V0ZVVwZGF0ZUFjdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMudXBkYXRlTWFuYWdlci5zdGF0ZSA9PT0gVXBkYXRlTWFuYWdlci5TdGF0ZS5VcGRhdGVBdmFpbGFibGVUb0luc3RhbGwpIHtcbiAgICAgIHRoaXMucHJvcHMudXBkYXRlTWFuYWdlci5yZXN0YXJ0QW5kSW5zdGFsbFVwZGF0ZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvcHMudXBkYXRlTWFuYWdlci5jaGVja0ZvclVwZGF0ZSgpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyVXBkYXRlU3RhdHVzICgpIHtcbiAgICBsZXQgdXBkYXRlU3RhdHVzID0gbnVsbFxuXG4gICAgc3dpdGNoICh0aGlzLnByb3BzLnVwZGF0ZU1hbmFnZXIuc3RhdGUpIHtcbiAgICAgIGNhc2UgVXBkYXRlTWFuYWdlci5TdGF0ZS5JZGxlOlxuICAgICAgICB1cGRhdGVTdGF0dXMgPSAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2Fib3V0LXVwZGF0ZXMtaXRlbSBpcy1zaG93biBhYm91dC1kZWZhdWx0LXVwZGF0ZS1tZXNzYWdlJz5cbiAgICAgICAgICAgIHt0aGlzLnByb3BzLnVwZGF0ZU1hbmFnZXIuZ2V0QXV0b1VwZGF0ZXNFbmFibGVkKCkgPyAnQXRvbSB3aWxsIGNoZWNrIGZvciB1cGRhdGVzIGF1dG9tYXRpY2FsbHknIDogJ0F1dG9tYXRpYyB1cGRhdGVzIGFyZSBkaXNhYmxlZCBwbGVhc2UgY2hlY2sgbWFudWFsbHknfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIFVwZGF0ZU1hbmFnZXIuU3RhdGUuQ2hlY2tpbmdGb3JVcGRhdGU6XG4gICAgICAgIHVwZGF0ZVN0YXR1cyA9IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1pdGVtIGFwcC1jaGVja2luZy1mb3ItdXBkYXRlcyc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2Fib3V0LXVwZGF0ZXMtbGFiZWwgaWNvbiBpY29uLXNlYXJjaCc+Q2hlY2tpbmcgZm9yIHVwZGF0ZXMuLi48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgVXBkYXRlTWFuYWdlci5TdGF0ZS5Eb3dubG9hZGluZ1VwZGF0ZTpcbiAgICAgICAgdXBkYXRlU3RhdHVzID0gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC11cGRhdGVzLWl0ZW0gYXBwLWRvd25sb2FkaW5nLXVwZGF0ZSc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xvYWRpbmcgbG9hZGluZy1zcGlubmVyLXRpbnkgaW5saW5lLWJsb2NrJyAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdhYm91dC11cGRhdGVzLWxhYmVsJz5Eb3dubG9hZGluZyB1cGRhdGU8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgVXBkYXRlTWFuYWdlci5TdGF0ZS5VcGRhdGVBdmFpbGFibGVUb0luc3RhbGw6XG4gICAgICAgIHVwZGF0ZVN0YXR1cyA9IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1pdGVtIGFwcC11cGRhdGUtYXZhaWxhYmxlLXRvLWluc3RhbGwnPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdhYm91dC11cGRhdGVzLWxhYmVsIGljb24gaWNvbi1zcXVpcnJlbCc+TmV3IHVwZGF0ZTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy12ZXJzaW9uJz57dGhpcy5wcm9wcy5hdmFpbGFibGVWZXJzaW9ufTwvc3Bhbj5cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1yZWxlYXNlLW5vdGVzJyBvbmNsaWNrPXt0aGlzLnByb3BzLnZpZXdVcGRhdGVSZWxlYXNlTm90ZXN9PlJlbGVhc2UgTm90ZXM8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgVXBkYXRlTWFuYWdlci5TdGF0ZS5VcFRvRGF0ZTpcbiAgICAgICAgdXBkYXRlU3RhdHVzID0gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC11cGRhdGVzLWl0ZW0gYXBwLXVwLXRvLWRhdGUnPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpY29uIGljb24tY2hlY2snIC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2Fib3V0LXVwZGF0ZXMtbGFiZWwgaXMtc3Ryb25nJz5BdG9tIGlzIHVwIHRvIGRhdGUhPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIFVwZGF0ZU1hbmFnZXIuU3RhdGUuRXJyb3I6XG4gICAgICAgIHVwZGF0ZVN0YXR1cyA9IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1pdGVtIGFwcC11cGRhdGUtZXJyb3InPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdpY29uIGljb24teCcgLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1sYWJlbCBhcHAtZXJyb3ItbWVzc2FnZSBpcy1zdHJvbmcnPlxuICAgICAgICAgICAgICB7dGhpcy5wcm9wcy51cGRhdGVNYW5hZ2VyLmdldEVycm9yTWVzc2FnZSgpfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcmV0dXJuIHVwZGF0ZVN0YXR1c1xuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2Fib3V0LXVwZGF0ZXMgZ3JvdXAtc3RhcnQnIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6IHRoaXMucHJvcHMudXBkYXRlTWFuYWdlci5zdGF0ZSA9PT0gVXBkYXRlTWFuYWdlci5TdGF0ZS5VbnN1cHBvcnRlZCA/ICdub25lJyA6ICdibG9jaydcbiAgICAgIH19PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWJvdXQtdXBkYXRlcy1ib3gnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC11cGRhdGVzLXN0YXR1cyc+XG4gICAgICAgICAgICB7dGhpcy5yZW5kZXJVcGRhdGVTdGF0dXMoKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gYWJvdXQtdXBkYXRlLWFjdGlvbi1idXR0b24nIGRpc2FibGVkPXt0aGlzLnNob3VsZFVwZGF0ZUFjdGlvbkJ1dHRvbkJlRGlzYWJsZWQoKX0gb25jbGljaz17dGhpcy5leGVjdXRlVXBkYXRlQWN0aW9uLmJpbmQodGhpcyl9PlxuICAgICAgICAgICAge3RoaXMucHJvcHMudXBkYXRlTWFuYWdlci5zdGF0ZSA9PT0gJ3VwZGF0ZS1hdmFpbGFibGUnID8gJ1Jlc3RhcnQgYW5kIGluc3RhbGwnIDogJ0NoZWNrIG5vdyd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhYm91dC1hdXRvLXVwZGF0ZXMnPlxuICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2lucHV0LWNoZWNrYm94JyB0eXBlPSdjaGVja2JveCcgY2hlY2tlZD17dGhpcy5wcm9wcy51cGRhdGVNYW5hZ2VyLmdldEF1dG9VcGRhdGVzRW5hYmxlZCgpfSBvbmNoYW5nZT17dGhpcy5oYW5kbGVBdXRvVXBkYXRlQ2hlY2tib3guYmluZCh0aGlzKX0vPlxuICAgICAgICAgICAgPHNwYW4+QXV0b21hdGljYWxseSBkb3dubG9hZCB1cGRhdGVzPC9zcGFuPlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cbiJdfQ==