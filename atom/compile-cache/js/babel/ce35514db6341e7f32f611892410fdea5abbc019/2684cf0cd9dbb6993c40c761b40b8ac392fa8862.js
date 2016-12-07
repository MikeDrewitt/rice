Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */
/** @jsx etch.dom */

var _atom = require('atom');

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

var _viewUri = require('./view-uri');

var _viewUri2 = _interopRequireDefault(_viewUri);

var REBUILDING = 'rebuilding';
var REBUILD_FAILED = 'rebuild-failed';
var REBUILD_SUCCEEDED = 'rebuild-succeeded';

var IncompatiblePackagesComponent = (function () {
  function IncompatiblePackagesComponent(packageManager) {
    var _this = this;

    _classCallCheck(this, IncompatiblePackagesComponent);

    this.rebuildStatuses = new Map();
    this.rebuildFailureOutputs = new Map();
    this.rebuildInProgress = false;
    this.rebuiltPackageCount = 0;
    this.packageManager = packageManager;
    this.loaded = false;
    _etch2['default'].createElement(this);

    if (this.packageManager.getActivePackages().length > 0) {
      this.populateIncompatiblePackages();
    } else {
      global.setImmediate(this.populateIncompatiblePackages.bind(this));
    }

    this.element.addEventListener('click', function (event) {
      if (event.target === _this.refs.rebuildButton) {
        _this.rebuildIncompatiblePackages();
      } else if (event.target === _this.refs.reloadButton) {
        atom.reload();
      } else if (event.target.classList.contains('view-settings')) {
        atom.workspace.open('atom://config/packages/' + event.target['package'].name);
      }
    });
  }

  _createClass(IncompatiblePackagesComponent, [{
    key: 'render',
    value: function render() {
      if (!this.loaded) {
        return _etch2['default'].dom(
          'div',
          { className: 'incompatible-packages padded' },
          'Loading...'
        );
      }

      return _etch2['default'].dom(
        'div',
        { className: 'incompatible-packages padded native-key-bindings', tabIndex: '-1' },
        this.renderHeading(),
        this.renderIncompatiblePackageList()
      );
    }
  }, {
    key: 'renderHeading',
    value: function renderHeading() {
      if (this.incompatiblePackages.length > 0) {
        if (this.rebuiltPackageCount > 0) {
          var alertClass = this.rebuiltPackageCount === this.incompatiblePackages.length ? 'alert-success icon-check' : 'alert-warning icon-bug';

          return _etch2['default'].dom(
            'div',
            { className: 'alert icon ' + alertClass },
            this.rebuiltPackageCount,
            ' of ',
            this.incompatiblePackages.length,
            ' packages were rebuilt successfully. Reload Atom to activate them.',
            _etch2['default'].dom(
              'button',
              { ref: 'reloadButton', className: 'btn pull-right' },
              'Reload Atom'
            )
          );
        } else {
          return _etch2['default'].dom(
            'div',
            { className: 'alert alert-danger icon icon-bug' },
            'Some installed packages could not be loaded because they contain native modules that were compiled for an earlier version of Atom.',
            _etch2['default'].dom(
              'button',
              { ref: 'rebuildButton', className: 'btn pull-right', disabled: this.rebuildInProgress },
              'Rebuild Packages'
            )
          );
        }
      } else {
        return _etch2['default'].dom(
          'div',
          { className: 'alert alert-success icon icon-check' },
          'None of your packages contain incompatible native modules.'
        );
      }
    }
  }, {
    key: 'renderIncompatiblePackageList',
    value: function renderIncompatiblePackageList() {
      return _etch2['default'].dom(
        'div',
        null,
        this.incompatiblePackages.map(this.renderIncompatiblePackage.bind(this))
      );
    }
  }, {
    key: 'renderIncompatiblePackage',
    value: function renderIncompatiblePackage(pack) {
      var rebuildStatus = this.rebuildStatuses.get(pack);

      return _etch2['default'].dom(
        'div',
        { className: 'incompatible-package' },
        this.renderRebuildStatusIndicator(rebuildStatus),
        _etch2['default'].dom(
          'button',
          { className: 'btn view-settings icon icon-gear pull-right', 'package': pack },
          'Package Settings'
        ),
        _etch2['default'].dom(
          'h4',
          { className: 'heading' },
          pack.name,
          ' ',
          pack.metadata.version
        ),
        rebuildStatus ? this.renderRebuildOutput(pack) : this.renderIncompatibleModules(pack)
      );
    }
  }, {
    key: 'renderRebuildStatusIndicator',
    value: function renderRebuildStatusIndicator(rebuildStatus) {
      if (rebuildStatus === REBUILDING) {
        return _etch2['default'].dom(
          'div',
          { className: 'badge badge-info pull-right icon icon-gear' },
          'Rebuilding'
        );
      } else if (rebuildStatus === REBUILD_SUCCEEDED) {
        return _etch2['default'].dom(
          'div',
          { className: 'badge badge-success pull-right icon icon-check' },
          'Rebuild Succeeded'
        );
      } else if (rebuildStatus === REBUILD_FAILED) {
        return _etch2['default'].dom(
          'div',
          { className: 'badge badge-error pull-right icon icon-x' },
          'Rebuild Failed'
        );
      }
    }
  }, {
    key: 'renderRebuildOutput',
    value: function renderRebuildOutput(pack) {
      if (this.rebuildStatuses.get(pack) === REBUILD_FAILED) {
        return _etch2['default'].dom(
          'pre',
          null,
          this.rebuildFailureOutputs.get(pack)
        );
      } else {
        return '';
      }
    }
  }, {
    key: 'renderIncompatibleModules',
    value: function renderIncompatibleModules(pack) {
      return _etch2['default'].dom(
        'ul',
        null,
        pack.incompatibleModules.map(function (nativeModule) {
          return _etch2['default'].dom(
            'li',
            null,
            _etch2['default'].dom(
              'div',
              { className: 'icon icon-file-binary' },
              nativeModule.name,
              '@',
              nativeModule.version,
              ' – ',
              _etch2['default'].dom(
                'span',
                { className: 'text-warning' },
                nativeModule.error
              )
            )
          );
        })
      );
    }
  }, {
    key: 'populateIncompatiblePackages',
    value: function populateIncompatiblePackages() {
      this.incompatiblePackages = this.packageManager.getLoadedPackages().filter(function (pack) {
        return !pack.isCompatible();
      });

      for (var pack of this.incompatiblePackages) {
        var buildFailureOutput = pack.getBuildFailureOutput();
        if (buildFailureOutput) {
          this.setPackageStatus(pack, REBUILD_FAILED);
          this.setRebuildFailureOutput(pack, buildFailureOutput);
        }
      }

      this.loaded = true;
      _etch2['default'].updateElement(this);
    }
  }, {
    key: 'rebuildIncompatiblePackages',
    value: _asyncToGenerator(function* () {
      this.rebuildInProgress = true;
      var rebuiltPackageCount = 0;
      for (var pack of this.incompatiblePackages) {
        this.setPackageStatus(pack, REBUILDING);

        var _ref = yield pack.rebuild();

        var code = _ref.code;
        var stderr = _ref.stderr;

        if (code === 0) {
          this.setPackageStatus(pack, REBUILD_SUCCEEDED);
          rebuiltPackageCount++;
        } else {
          this.setRebuildFailureOutput(pack, stderr);
          this.setPackageStatus(pack, REBUILD_FAILED);
        }
      }
      this.rebuildInProgress = false;
      this.rebuiltPackageCount = rebuiltPackageCount;
      _etch2['default'].updateElement(this);
    })
  }, {
    key: 'setPackageStatus',
    value: function setPackageStatus(pack, status) {
      this.rebuildStatuses.set(pack, status);
      _etch2['default'].updateElement(this);
    }
  }, {
    key: 'setRebuildFailureOutput',
    value: function setRebuildFailureOutput(pack, output) {
      this.rebuildFailureOutputs.set(pack, output);
      _etch2['default'].updateElement(this);
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return 'Incompatible Packages';
    }
  }, {
    key: 'getURI',
    value: function getURI() {
      return _viewUri2['default'];
    }
  }, {
    key: 'getIconName',
    value: function getIconName() {
      return 'package';
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return { deserializer: 'IncompatiblePackagesComponent' };
    }
  }]);

  return IncompatiblePackagesComponent;
})();

exports['default'] = IncompatiblePackagesComponent;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvaW5jb21wYXRpYmxlLXBhY2thZ2VzL2xpYi9pbmNvbXBhdGlibGUtcGFja2FnZXMtY29tcG9uZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztvQkFHOEIsTUFBTTs7b0JBQ25CLE1BQU07Ozs7dUJBRUYsWUFBWTs7OztBQUNqQyxJQUFNLFVBQVUsR0FBRyxZQUFZLENBQUE7QUFDL0IsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUE7QUFDdkMsSUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQTs7SUFFeEIsNkJBQTZCO0FBQ3BDLFdBRE8sNkJBQTZCLENBQ25DLGNBQWMsRUFBRTs7OzBCQURWLDZCQUE2Qjs7QUFFOUMsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBQSxDQUFBO0FBQzlCLFFBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBQSxDQUFBO0FBQ3BDLFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUE7QUFDOUIsUUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtBQUM1QixRQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTtBQUNwQyxRQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQTtBQUNuQixzQkFBSyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7O0FBRXhCLFFBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDdEQsVUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUE7S0FDcEMsTUFBTTtBQUNMLFlBQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0tBQ2xFOztBQUVELFFBQUksQ0FBQyxPQUFP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QUFDLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDOUIsVUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3RDLHdCQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUN6Qjs7O1dBRXVCLGlDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDckMsVUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDNUMsd0JBQUssYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ3pCOzs7V0FFUSxvQkFBRztBQUNWLGFBQU8sdUJBQXVCLENBQUE7S0FDL0I7OztXQUVNLGtCQUFHO0FBQ1Isa0NBQWU7S0FDaEI7OztXQUVXLHVCQUFHO0FBQ2IsYUFBTyxTQUFTLENBQUE7S0FDakI7OztXQUVTLHFCQUFHO0FBQ1gsYUFBTyxFQUFDLFlBQVksRUFBRSwrQkFBK0IsRUFBQyxDQUFBO0tBQ3ZEOzs7U0FuTmtCLDZCQUE2Qjs7O3FCQUE3Qiw2QkFBNkIiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9pbmNvbXBhdGlibGUtcGFja2FnZXMvbGliL2luY29tcGF0aWJsZS1wYWNrYWdlcy1jb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG4vKiogQGpzeCBldGNoLmRvbSAqL1xuXG5pbXBvcnQge0J1ZmZlcmVkUHJvY2Vzc30gZnJvbSAnYXRvbSdcbmltcG9ydCBldGNoIGZyb20gJ2V0Y2gnXG5cbmltcG9ydCBWSUVXX1VSSSBmcm9tICcuL3ZpZXctdXJpJ1xuY29uc3QgUkVCVUlMRElORyA9ICdyZWJ1aWxkaW5nJ1xuY29uc3QgUkVCVUlMRF9GQUlMRUQgPSAncmVidWlsZC1mYWlsZWQnXG5jb25zdCBSRUJVSUxEX1NVQ0NFRURFRCA9ICdyZWJ1aWxkLXN1Y2NlZWRlZCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5jb21wYXRpYmxlUGFja2FnZXNDb21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocGFja2FnZU1hbmFnZXIpIHtcbiAgICB0aGlzLnJlYnVpbGRTdGF0dXNlcyA9IG5ldyBNYXBcbiAgICB0aGlzLnJlYnVpbGRGYWlsdXJlT3V0cHV0cyA9IG5ldyBNYXBcbiAgICB0aGlzLnJlYnVpbGRJblByb2dyZXNzID0gZmFsc2VcbiAgICB0aGlzLnJlYnVpbHRQYWNrYWdlQ291bnQgPSAwXG4gICAgdGhpcy5wYWNrYWdlTWFuYWdlciA9IHBhY2thZ2VNYW5hZ2VyXG4gICAgdGhpcy5sb2FkZWQgPSBmYWxzZVxuICAgIGV0Y2guY3JlYXRlRWxlbWVudCh0aGlzKVxuXG4gICAgaWYgKHRoaXMucGFja2FnZU1hbmFnZXIuZ2V0QWN0aXZlUGFja2FnZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnBvcHVsYXRlSW5jb21wYXRpYmxlUGFja2FnZXMoKVxuICAgIH0gZWxzZSB7XG4gICAgICBnbG9iYWwuc2V0SW1tZWRpYXRlKHRoaXMucG9wdWxhdGVJbmNvbXBhdGlibGVQYWNrYWdlcy5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcy5yZWZzLnJlYnVpbGRCdXR0b24pIHtcbiAgICAgICAgdGhpcy5yZWJ1aWxkSW5jb21wYXRpYmxlUGFja2FnZXMoKVxuICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMucmVmcy5yZWxvYWRCdXR0b24pIHtcbiAgICAgICAgYXRvbS5yZWxvYWQoKVxuICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aWV3LXNldHRpbmdzJykpIHtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihgYXRvbTovL2NvbmZpZy9wYWNrYWdlcy8ke2V2ZW50LnRhcmdldC5wYWNrYWdlLm5hbWV9YClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBpZiAoIXRoaXMubG9hZGVkKSB7XG4gICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9J2luY29tcGF0aWJsZS1wYWNrYWdlcyBwYWRkZWQnPkxvYWRpbmcuLi48L2Rpdj5cbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2luY29tcGF0aWJsZS1wYWNrYWdlcyBwYWRkZWQgbmF0aXZlLWtleS1iaW5kaW5ncycgdGFiSW5kZXg9Jy0xJz5cbiAgICAgICAge3RoaXMucmVuZGVySGVhZGluZygpfVxuICAgICAgICB7dGhpcy5yZW5kZXJJbmNvbXBhdGlibGVQYWNrYWdlTGlzdCgpfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgcmVuZGVySGVhZGluZyAoKSB7XG4gICAgaWYgKHRoaXMuaW5jb21wYXRpYmxlUGFja2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHRoaXMucmVidWlsdFBhY2thZ2VDb3VudCA+IDApIHtcbiAgICAgICAgbGV0IGFsZXJ0Q2xhc3MgPVxuICAgICAgICAgICh0aGlzLnJlYnVpbHRQYWNrYWdlQ291bnQgPT09IHRoaXMuaW5jb21wYXRpYmxlUGFja2FnZXMubGVuZ3RoKVxuICAgICAgICAgICAgPyAnYWxlcnQtc3VjY2VzcyBpY29uLWNoZWNrJ1xuICAgICAgICAgICAgOiAnYWxlcnQtd2FybmluZyBpY29uLWJ1ZydcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXsnYWxlcnQgaWNvbiAnICsgYWxlcnRDbGFzc30+XG4gICAgICAgICAgICB7dGhpcy5yZWJ1aWx0UGFja2FnZUNvdW50fSBvZiB7dGhpcy5pbmNvbXBhdGlibGVQYWNrYWdlcy5sZW5ndGh9IHBhY2thZ2VzXG4gICAgICAgICAgICB3ZXJlIHJlYnVpbHQgc3VjY2Vzc2Z1bGx5LiBSZWxvYWQgQXRvbSB0byBhY3RpdmF0ZSB0aGVtLlxuXG4gICAgICAgICAgICA8YnV0dG9uIHJlZj0ncmVsb2FkQnV0dG9uJyBjbGFzc05hbWU9J2J0biBwdWxsLXJpZ2h0Jz5cbiAgICAgICAgICAgICAgUmVsb2FkIEF0b21cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdhbGVydCBhbGVydC1kYW5nZXIgaWNvbiBpY29uLWJ1Zyc+XG4gICAgICAgICAgICBTb21lIGluc3RhbGxlZCBwYWNrYWdlcyBjb3VsZCBub3QgYmUgbG9hZGVkIGJlY2F1c2UgdGhleSBjb250YWluIG5hdGl2ZVxuICAgICAgICAgICAgbW9kdWxlcyB0aGF0IHdlcmUgY29tcGlsZWQgZm9yIGFuIGVhcmxpZXIgdmVyc2lvbiBvZiBBdG9tLlxuXG4gICAgICAgICAgICA8YnV0dG9uIHJlZj0ncmVidWlsZEJ1dHRvbicgY2xhc3NOYW1lPSdidG4gcHVsbC1yaWdodCcgZGlzYWJsZWQ9e3RoaXMucmVidWlsZEluUHJvZ3Jlc3N9PlxuICAgICAgICAgICAgICBSZWJ1aWxkIFBhY2thZ2VzXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYWxlcnQgYWxlcnQtc3VjY2VzcyBpY29uIGljb24tY2hlY2snPlxuICAgICAgICAgIE5vbmUgb2YgeW91ciBwYWNrYWdlcyBjb250YWluIGluY29tcGF0aWJsZSBuYXRpdmUgbW9kdWxlcy5cbiAgICAgICAgPC9kaXY+XG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgcmVuZGVySW5jb21wYXRpYmxlUGFja2FnZUxpc3QgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PntcbiAgICAgICAgdGhpcy5pbmNvbXBhdGlibGVQYWNrYWdlcy5tYXAodGhpcy5yZW5kZXJJbmNvbXBhdGlibGVQYWNrYWdlLmJpbmQodGhpcykpXG4gICAgICB9PC9kaXY+XG4gICAgKVxuICB9XG5cbiAgcmVuZGVySW5jb21wYXRpYmxlUGFja2FnZSAocGFjaykge1xuICAgIGxldCByZWJ1aWxkU3RhdHVzID0gdGhpcy5yZWJ1aWxkU3RhdHVzZXMuZ2V0KHBhY2spXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9eydpbmNvbXBhdGlibGUtcGFja2FnZSd9PlxuICAgICAgICB7dGhpcy5yZW5kZXJSZWJ1aWxkU3RhdHVzSW5kaWNhdG9yKHJlYnVpbGRTdGF0dXMpfVxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIHZpZXctc2V0dGluZ3MgaWNvbiBpY29uLWdlYXIgcHVsbC1yaWdodCcgcGFja2FnZT17cGFja30+UGFja2FnZSBTZXR0aW5nczwvYnV0dG9uPlxuICAgICAgICA8aDQgY2xhc3NOYW1lPSdoZWFkaW5nJz5cbiAgICAgICAgICB7cGFjay5uYW1lfSB7cGFjay5tZXRhZGF0YS52ZXJzaW9ufVxuICAgICAgICA8L2g0PlxuICAgICAgICB7XG4gICAgICAgICAgcmVidWlsZFN0YXR1c1xuICAgICAgICAgID8gdGhpcy5yZW5kZXJSZWJ1aWxkT3V0cHV0KHBhY2spXG4gICAgICAgICAgOiB0aGlzLnJlbmRlckluY29tcGF0aWJsZU1vZHVsZXMocGFjaylcbiAgICAgICAgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgcmVuZGVyUmVidWlsZFN0YXR1c0luZGljYXRvciAocmVidWlsZFN0YXR1cykge1xuICAgIGlmIChyZWJ1aWxkU3RhdHVzID09PSBSRUJVSUxESU5HKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYmFkZ2UgYmFkZ2UtaW5mbyBwdWxsLXJpZ2h0IGljb24gaWNvbi1nZWFyJz5cbiAgICAgICAgICBSZWJ1aWxkaW5nXG4gICAgICAgIDwvZGl2PlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAocmVidWlsZFN0YXR1cyA9PT0gUkVCVUlMRF9TVUNDRUVERUQpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdiYWRnZSBiYWRnZS1zdWNjZXNzIHB1bGwtcmlnaHQgaWNvbiBpY29uLWNoZWNrJz5cbiAgICAgICAgICBSZWJ1aWxkIFN1Y2NlZWRlZFxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHJlYnVpbGRTdGF0dXMgPT09IFJFQlVJTERfRkFJTEVEKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYmFkZ2UgYmFkZ2UtZXJyb3IgcHVsbC1yaWdodCBpY29uIGljb24teCc+XG4gICAgICAgICAgUmVidWlsZCBGYWlsZWRcbiAgICAgICAgPC9kaXY+XG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyUmVidWlsZE91dHB1dCAocGFjaykge1xuICAgIGlmICh0aGlzLnJlYnVpbGRTdGF0dXNlcy5nZXQocGFjaykgPT09IFJFQlVJTERfRkFJTEVEKSB7XG4gICAgICByZXR1cm4gPHByZT57dGhpcy5yZWJ1aWxkRmFpbHVyZU91dHB1dHMuZ2V0KHBhY2spfTwvcHJlPlxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIH1cblxuICByZW5kZXJJbmNvbXBhdGlibGVNb2R1bGVzIChwYWNrKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx1bD57XG4gICAgICAgIHBhY2suaW5jb21wYXRpYmxlTW9kdWxlcy5tYXAoKG5hdGl2ZU1vZHVsZSkgPT5cbiAgICAgICAgICA8bGk+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0naWNvbiBpY29uLWZpbGUtYmluYXJ5Jz5cbiAgICAgICAgICAgICAge25hdGl2ZU1vZHVsZS5uYW1lfUB7bmF0aXZlTW9kdWxlLnZlcnNpb259IOKAkyA8c3BhbiBjbGFzc05hbWU9J3RleHQtd2FybmluZyc+e25hdGl2ZU1vZHVsZS5lcnJvcn08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICApXG4gICAgICB9PC91bD5cbiAgICApXG4gIH1cblxuICBwb3B1bGF0ZUluY29tcGF0aWJsZVBhY2thZ2VzICgpIHtcbiAgICB0aGlzLmluY29tcGF0aWJsZVBhY2thZ2VzID1cbiAgICAgIHRoaXMucGFja2FnZU1hbmFnZXJcbiAgICAgICAgLmdldExvYWRlZFBhY2thZ2VzKClcbiAgICAgICAgLmZpbHRlcihwYWNrID0+ICFwYWNrLmlzQ29tcGF0aWJsZSgpKVxuXG4gICAgZm9yIChsZXQgcGFjayBvZiB0aGlzLmluY29tcGF0aWJsZVBhY2thZ2VzKSB7XG4gICAgICBsZXQgYnVpbGRGYWlsdXJlT3V0cHV0ID0gcGFjay5nZXRCdWlsZEZhaWx1cmVPdXRwdXQoKVxuICAgICAgaWYgKGJ1aWxkRmFpbHVyZU91dHB1dCkge1xuICAgICAgICB0aGlzLnNldFBhY2thZ2VTdGF0dXMocGFjaywgUkVCVUlMRF9GQUlMRUQpXG4gICAgICAgIHRoaXMuc2V0UmVidWlsZEZhaWx1cmVPdXRwdXQocGFjaywgYnVpbGRGYWlsdXJlT3V0cHV0KVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZVxuICAgIGV0Y2gudXBkYXRlRWxlbWVudCh0aGlzKVxuICB9XG5cbiAgYXN5bmMgcmVidWlsZEluY29tcGF0aWJsZVBhY2thZ2VzICgpIHtcbiAgICB0aGlzLnJlYnVpbGRJblByb2dyZXNzID0gdHJ1ZVxuICAgIGxldCByZWJ1aWx0UGFja2FnZUNvdW50ID0gMFxuICAgIGZvciAobGV0IHBhY2sgb2YgdGhpcy5pbmNvbXBhdGlibGVQYWNrYWdlcykge1xuICAgICAgdGhpcy5zZXRQYWNrYWdlU3RhdHVzKHBhY2ssIFJFQlVJTERJTkcpXG4gICAgICBsZXQge2NvZGUsIHN0ZGVycn0gPSBhd2FpdCBwYWNrLnJlYnVpbGQoKVxuICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgdGhpcy5zZXRQYWNrYWdlU3RhdHVzKHBhY2ssIFJFQlVJTERfU1VDQ0VFREVEKVxuICAgICAgICByZWJ1aWx0UGFja2FnZUNvdW50KytcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0UmVidWlsZEZhaWx1cmVPdXRwdXQocGFjaywgc3RkZXJyKVxuICAgICAgICB0aGlzLnNldFBhY2thZ2VTdGF0dXMocGFjaywgUkVCVUlMRF9GQUlMRUQpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVidWlsZEluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIHRoaXMucmVidWlsdFBhY2thZ2VDb3VudCA9IHJlYnVpbHRQYWNrYWdlQ291bnRcbiAgICBldGNoLnVwZGF0ZUVsZW1lbnQodGhpcylcbiAgfVxuXG4gIHNldFBhY2thZ2VTdGF0dXMgKHBhY2ssIHN0YXR1cykge1xuICAgIHRoaXMucmVidWlsZFN0YXR1c2VzLnNldChwYWNrLCBzdGF0dXMpXG4gICAgZXRjaC51cGRhdGVFbGVtZW50KHRoaXMpXG4gIH1cblxuICBzZXRSZWJ1aWxkRmFpbHVyZU91dHB1dCAocGFjaywgb3V0cHV0KSB7XG4gICAgdGhpcy5yZWJ1aWxkRmFpbHVyZU91dHB1dHMuc2V0KHBhY2ssIG91dHB1dClcbiAgICBldGNoLnVwZGF0ZUVsZW1lbnQodGhpcylcbiAgfVxuXG4gIGdldFRpdGxlICgpIHtcbiAgICByZXR1cm4gJ0luY29tcGF0aWJsZSBQYWNrYWdlcydcbiAgfVxuXG4gIGdldFVSSSAoKSB7XG4gICAgcmV0dXJuIFZJRVdfVVJJXG4gIH1cblxuICBnZXRJY29uTmFtZSAoKSB7XG4gICAgcmV0dXJuICdwYWNrYWdlJ1xuICB9XG5cbiAgc2VyaWFsaXplICgpIHtcbiAgICByZXR1cm4ge2Rlc2VyaWFsaXplcjogJ0luY29tcGF0aWJsZVBhY2thZ2VzQ29tcG9uZW50J31cbiAgfVxufVxuIl19