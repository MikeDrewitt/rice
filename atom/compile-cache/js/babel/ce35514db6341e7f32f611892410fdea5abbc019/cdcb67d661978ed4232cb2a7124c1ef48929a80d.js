Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.consumeStatusBar = consumeStatusBar;
exports.deserializeIncompatiblePackagesComponent = deserializeIncompatiblePackagesComponent;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _atom = require('atom');

var _viewUri = require('./view-uri');

var _viewUri2 = _interopRequireDefault(_viewUri);

var disposables = null;

function activate() {
  disposables = new _atom.CompositeDisposable();

  disposables.add(atom.workspace.addOpener(function (uri) {
    if (uri === _viewUri2['default']) {
      return deserializeIncompatiblePackagesComponent();
    }
  }));

  disposables.add(atom.commands.add('atom-workspace', {
    'incompatible-packages:view': function incompatiblePackagesView() {
      atom.workspace.open(_viewUri2['default']);
    }
  }));
}

function deactivate() {
  disposables.dispose();
}

function consumeStatusBar(statusBar) {
  var incompatibleCount = 0;
  for (var pack of atom.packages.getLoadedPackages()) {
    if (!pack.isCompatible()) incompatibleCount++;
  }

  if (incompatibleCount > 0) {
    (function () {
      var icon = createIcon(incompatibleCount);
      var tile = statusBar.addRightTile({ item: icon, priority: 200 });
      icon.element.addEventListener('click', function () {
        atom.commands.dispatch(icon.element, 'incompatible-packages:view');
      });
      disposables.add(new _atom.Disposable(function () {
        return tile.destroy();
      }));
    })();
  }
}

function deserializeIncompatiblePackagesComponent() {
  var IncompatiblePackagesComponent = require('./incompatible-packages-component');
  return new IncompatiblePackagesComponent(atom.packages);
}

function createIcon(count) {
  var StatusIconComponent = require('./status-icon-component');
  return new StatusIconComponent({ count: count });
}

if (parseFloat(atom.getVersion()) < 1.7) {
  atom.deserializers.add({
    name: 'IncompatiblePackagesComponent',
    deserialize: deserializeIncompatiblePackagesComponent
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvaW5jb21wYXRpYmxlLXBhY2thZ2VzL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztvQkFFOEMsTUFBTTs7dUJBQy9CLFlBQVk7Ozs7QUFFakMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFBOztBQUVmLFNBQVMsUUFBUSxHQUFJO0FBQzFCLGFBQVcsR0FBRywrQkFBeUIsQ0FBQTs7QUFFdkMsYUFBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUNoRCxRQUFJLEdBQUcseUJBQWEsRUFBRTtBQUNwQixhQUFPLHdDQUF3QyxFQUFFLENBQUE7S0FDbEQ7R0FDRixDQUFDLENBQUMsQ0FBQTs7QUFFSCxhQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFO0FBQ2xELGdDQUE0QixFQUFFLG9DQUFNO0FBQ2xDLFVBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxzQkFBVSxDQUFBO0tBQzlCO0dBQ0YsQ0FBQyxDQUFDLENBQUE7Q0FDSjs7QUFFTSxTQUFTLFVBQVUsR0FBSTtBQUM1QixhQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7Q0FDdEI7O0FBRU0sU0FBUyxnQkFBZ0IsQ0FBRSxTQUFTLEVBQUU7QUFDM0MsTUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUE7QUFDekIsT0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7QUFDbEQsUUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxDQUFBO0dBQzlDOztBQUVELE1BQUksaUJBQWlCLEdBQUcsQ0FBQyxFQUFFOztBQUN6QixVQUFJLElBQUksR0FBRyxVQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUN4QyxVQUFJLElBQUksR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQTtBQUM5RCxVQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxZQUFNO0FBQzNDLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsNEJBQTRCLENBQUMsQ0FBQTtPQUNuRSxDQUFDLENBQUE7QUFDRixpQkFBVyxDQUFDLEdBQUcsQ0FBQyxxQkFBZTtlQUFNLElBQUksQ0FBQyxPQUFPLEVBQUU7T0FBQSxDQUFDLENBQUMsQ0FBQTs7R0FDdEQ7Q0FDRjs7QUFFTSxTQUFTLHdDQUF3QyxHQUFJO0FBQzFELE1BQU0sNkJBQTZCLEdBQUcsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUE7QUFDbEYsU0FBTyxJQUFJLDZCQUE2QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtDQUN4RDs7QUFFRCxTQUFTLFVBQVUsQ0FBRSxLQUFLLEVBQUU7QUFDMUIsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQTtBQUM5RCxTQUFPLElBQUksbUJBQW1CLENBQUMsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFDLENBQUMsQ0FBQTtDQUN4Qzs7QUFFRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUU7QUFDdkMsTUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUM7QUFDckIsUUFBSSxFQUFFLCtCQUErQjtBQUNyQyxlQUFXLEVBQUUsd0NBQXdDO0dBQ3RELENBQUMsQ0FBQTtDQUNIIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvaW5jb21wYXRpYmxlLXBhY2thZ2VzL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQge0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nXG5pbXBvcnQgVklFV19VUkkgZnJvbSAnLi92aWV3LXVyaSdcblxubGV0IGRpc3Bvc2FibGVzID0gbnVsbFxuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUgKCkge1xuICBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICBkaXNwb3NhYmxlcy5hZGQoYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKCh1cmkpID0+IHtcbiAgICBpZiAodXJpID09PSBWSUVXX1VSSSkge1xuICAgICAgcmV0dXJuIGRlc2VyaWFsaXplSW5jb21wYXRpYmxlUGFja2FnZXNDb21wb25lbnQoKVxuICAgIH1cbiAgfSkpXG5cbiAgZGlzcG9zYWJsZXMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHtcbiAgICAnaW5jb21wYXRpYmxlLXBhY2thZ2VzOnZpZXcnOiAoKSA9PiB7XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFZJRVdfVVJJKVxuICAgIH1cbiAgfSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlICgpIHtcbiAgZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lU3RhdHVzQmFyIChzdGF0dXNCYXIpIHtcbiAgbGV0IGluY29tcGF0aWJsZUNvdW50ID0gMFxuICBmb3IgKGxldCBwYWNrIG9mIGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZXMoKSkge1xuICAgIGlmICghcGFjay5pc0NvbXBhdGlibGUoKSkgaW5jb21wYXRpYmxlQ291bnQrK1xuICB9XG5cbiAgaWYgKGluY29tcGF0aWJsZUNvdW50ID4gMCkge1xuICAgIGxldCBpY29uID0gY3JlYXRlSWNvbihpbmNvbXBhdGlibGVDb3VudClcbiAgICBsZXQgdGlsZSA9IHN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe2l0ZW06IGljb24sIHByaW9yaXR5OiAyMDB9KVxuICAgIGljb24uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goaWNvbi5lbGVtZW50LCAnaW5jb21wYXRpYmxlLXBhY2thZ2VzOnZpZXcnKVxuICAgIH0pXG4gICAgZGlzcG9zYWJsZXMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHRpbGUuZGVzdHJveSgpKSlcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzZXJpYWxpemVJbmNvbXBhdGlibGVQYWNrYWdlc0NvbXBvbmVudCAoKSB7XG4gIGNvbnN0IEluY29tcGF0aWJsZVBhY2thZ2VzQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9pbmNvbXBhdGlibGUtcGFja2FnZXMtY29tcG9uZW50JylcbiAgcmV0dXJuIG5ldyBJbmNvbXBhdGlibGVQYWNrYWdlc0NvbXBvbmVudChhdG9tLnBhY2thZ2VzKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVJY29uIChjb3VudCkge1xuICBjb25zdCBTdGF0dXNJY29uQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9zdGF0dXMtaWNvbi1jb21wb25lbnQnKVxuICByZXR1cm4gbmV3IFN0YXR1c0ljb25Db21wb25lbnQoe2NvdW50fSlcbn1cblxuaWYgKHBhcnNlRmxvYXQoYXRvbS5nZXRWZXJzaW9uKCkpIDwgMS43KSB7XG4gIGF0b20uZGVzZXJpYWxpemVycy5hZGQoe1xuICAgIG5hbWU6ICdJbmNvbXBhdGlibGVQYWNrYWdlc0NvbXBvbmVudCcsXG4gICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplSW5jb21wYXRpYmxlUGFja2FnZXNDb21wb25lbnRcbiAgfSlcbn1cbiJdfQ==