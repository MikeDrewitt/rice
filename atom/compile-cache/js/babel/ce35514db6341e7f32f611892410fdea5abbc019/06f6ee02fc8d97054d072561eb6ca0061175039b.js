Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _eventKit = require('event-kit');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var ReopenProjectMenuManager = (function () {
  function ReopenProjectMenuManager(_ref) {
    var _this = this;

    var menu = _ref.menu;
    var commands = _ref.commands;
    var history = _ref.history;
    var config = _ref.config;
    var open = _ref.open;

    _classCallCheck(this, ReopenProjectMenuManager);

    this.menuManager = menu;
    this.historyManager = history;
    this.config = config;
    this.open = open;
    this.projects = [];

    this.subscriptions = new _eventKit.CompositeDisposable();
    this.subscriptions.add(history.onDidChangeProjects(this.update.bind(this)), config.onDidChange('core.reopenProjectMenuCount', function (_ref2) {
      var oldValue = _ref2.oldValue;
      var newValue = _ref2.newValue;

      _this.update();
    }), commands.add('atom-workspace', { 'application:reopen-project': this.reopenProjectCommand.bind(this) }));
  }

  _createClass(ReopenProjectMenuManager, [{
    key: 'reopenProjectCommand',
    value: function reopenProjectCommand(e) {
      if (e.detail != null && e.detail.index != null) {
        this.open(this.projects[e.detail.index].paths);
      } else {
        this.createReopenProjectListView();
      }
    }
  }, {
    key: 'createReopenProjectListView',
    value: function createReopenProjectListView() {
      var _this2 = this;

      if (this.reopenProjectListView == null) {
        var ReopenProjectListView = require('./reopen-project-list-view');
        this.reopenProjectListView = new ReopenProjectListView(function (paths) {
          if (paths != null) {
            _this2.open(paths);
          }
        });
      }
      this.reopenProjectListView.toggle();
    }
  }, {
    key: 'update',
    value: function update() {
      this.disposeProjectMenu();
      this.projects = this.historyManager.getProjects().slice(0, this.config.get('core.reopenProjectMenuCount'));
      var newMenu = ReopenProjectMenuManager.createProjectsMenu(this.projects);
      this.lastProjectMenu = this.menuManager.add([newMenu]);
      this.updateWindowsJumpList();
    }
  }, {
    key: 'updateWindowsJumpList',
    value: function updateWindowsJumpList() {
      if (process.platform !== 'win32') return;

      if (this.app === undefined) {
        this.app = require('remote').app;
      }

      this.app.setJumpList([{
        type: 'custom',
        name: 'Recent Projects',
        items: this.projects.map(function (p) {
          return {
            type: 'task',
            title: ReopenProjectMenuManager.createLabel(p),
            program: process.execPath,
            args: p.paths.map(function (path) {
              return '"' + path + '"';
            }).join(' ') };
        })
      }, { type: 'recent' }, { items: [{ type: 'task', title: 'New Window', program: process.execPath, args: '--new-window', description: 'Opens a new Atom window' }] }]);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      this.disposeProjectMenu();
      if (this.reopenProjectListView != null) {
        this.reopenProjectListView.dispose();
      }
    }
  }, {
    key: 'disposeProjectMenu',
    value: function disposeProjectMenu() {
      if (this.lastProjectMenu) {
        this.lastProjectMenu.dispose();
        this.lastProjectMenu = null;
      }
    }
  }], [{
    key: 'createProjectsMenu',
    value: function createProjectsMenu(projects) {
      var _this3 = this;

      return {
        label: 'File',
        submenu: [{
          label: 'Reopen Project',
          submenu: projects.map(function (project, index) {
            return {
              label: _this3.createLabel(project),
              command: 'application:reopen-project',
              commandDetail: { index: index }
            };
          })
        }]
      };
    }
  }, {
    key: 'createLabel',
    value: function createLabel(project) {
      return project.paths.length === 1 ? project.paths[0] : project.paths.map(this.betterBaseName).join(', ');
    }
  }, {
    key: 'betterBaseName',
    value: function betterBaseName(directory) {
      // Handles Windows roots better than path.basename which returns '' for 'd:' and 'd:\'
      var match = directory.match(/^([a-z]:)[\\]?$/i);
      return match ? match[1] + '\\' : _path2['default'].basename(directory);
    }
  }]);

  return ReopenProjectMenuManager;
})();

exports['default'] = ReopenProjectMenuManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvcmVvcGVuLXByb2plY3QtbWVudS1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozt3QkFFa0MsV0FBVzs7b0JBQzVCLE1BQU07Ozs7SUFFRix3QkFBd0I7QUFDL0IsV0FETyx3QkFBd0IsQ0FDOUIsSUFBdUMsRUFBRTs7O1FBQXhDLElBQUksR0FBTCxJQUF1QyxDQUF0QyxJQUFJO1FBQUUsUUFBUSxHQUFmLElBQXVDLENBQWhDLFFBQVE7UUFBRSxPQUFPLEdBQXhCLElBQXVDLENBQXRCLE9BQU87UUFBRSxNQUFNLEdBQWhDLElBQXVDLENBQWIsTUFBTTtRQUFFLElBQUksR0FBdEMsSUFBdUMsQ0FBTCxJQUFJOzswQkFEaEMsd0JBQXdCOztBQUV6QyxRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQTtBQUN2QixRQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQTtBQUM3QixRQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtBQUNoQixRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTs7QUFFbEIsUUFBSSxDQUFDLGFBQWEsR0FBRyxtQ0FBeUIsQ0FBQTtBQUM5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsNkJBQTZCLEVBQUUsVUFBQyxLQUFvQixFQUFLO1VBQXhCLFFBQVEsR0FBVCxLQUFvQixDQUFuQixRQUFRO1VBQUUsUUFBUSxHQUFuQixLQUFvQixDQUFULFFBQVE7O0FBQ3BFLFlBQUssTUFBTSxFQUFFLENBQUE7S0FDZCxDQUFDLEVBQ0YsUUFB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QkFBa0IsQ0FBQyxDQUFBO0FBQ2pELGFBQU8sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsa0JBQUssUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0tBQzFEOzs7U0EvR2tCLHdCQUF3Qjs7O3FCQUF4Qix3QkFBd0IiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9yZW9wZW4tcHJvamVjdC1tZW51LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnZXZlbnQta2l0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVvcGVuUHJvamVjdE1lbnVNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IgKHttZW51LCBjb21tYW5kcywgaGlzdG9yeSwgY29uZmlnLCBvcGVufSkge1xuICAgIHRoaXMubWVudU1hbmFnZXIgPSBtZW51XG4gICAgdGhpcy5oaXN0b3J5TWFuYWdlciA9IGhpc3RvcnlcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIHRoaXMub3BlbiA9IG9wZW5cbiAgICB0aGlzLnByb2plY3RzID0gW11cblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgaGlzdG9yeS5vbkRpZENoYW5nZVByb2plY3RzKHRoaXMudXBkYXRlLmJpbmQodGhpcykpLFxuICAgICAgY29uZmlnLm9uRGlkQ2hhbmdlKCdjb3JlLnJlb3BlblByb2plY3RNZW51Q291bnQnLCAoe29sZFZhbHVlLCBuZXdWYWx1ZX0pID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGUoKVxuICAgICAgfSksXG4gICAgICBjb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgeyAnYXBwbGljYXRpb246cmVvcGVuLXByb2plY3QnOiB0aGlzLnJlb3BlblByb2plY3RDb21tYW5kLmJpbmQodGhpcykgfSlcbiAgICApXG4gIH1cblxuICByZW9wZW5Qcm9qZWN0Q29tbWFuZCAoZSkge1xuICAgIGlmIChlLmRldGFpbCAhPSBudWxsICYmIGUuZGV0YWlsLmluZGV4ICE9IG51bGwpIHtcbiAgICAgIHRoaXMub3Blbih0aGlzLnByb2plY3RzW2UuZGV0YWlsLmluZGV4XS5wYXRocylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jcmVhdGVSZW9wZW5Qcm9qZWN0TGlzdFZpZXcoKVxuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZVJlb3BlblByb2plY3RMaXN0VmlldyAoKSB7XG4gICAgaWYgKHRoaXMucmVvcGVuUHJvamVjdExpc3RWaWV3ID09IG51bGwpIHtcbiAgICAgIGNvbnN0IFJlb3BlblByb2plY3RMaXN0VmlldyA9IHJlcXVpcmUoJy4vcmVvcGVuLXByb2plY3QtbGlzdC12aWV3JylcbiAgICAgIHRoaXMucmVvcGVuUHJvamVjdExpc3RWaWV3ID0gbmV3IFJlb3BlblByb2plY3RMaXN0VmlldyhwYXRocyA9PiB7XG4gICAgICAgIGlmIChwYXRocyAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5vcGVuKHBhdGhzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLnJlb3BlblByb2plY3RMaXN0Vmlldy50b2dnbGUoKVxuICB9XG5cbiAgdXBkYXRlICgpIHtcbiAgICB0aGlzLmRpc3Bvc2VQcm9qZWN0TWVudSgpXG4gICAgdGhpcy5wcm9qZWN0cyA9IHRoaXMuaGlzdG9yeU1hbmFnZXIuZ2V0UHJvamVjdHMoKS5zbGljZSgwLCB0aGlzLmNvbmZpZy5nZXQoJ2NvcmUucmVvcGVuUHJvamVjdE1lbnVDb3VudCcpKVxuICAgIGNvbnN0IG5ld01lbnUgPSBSZW9wZW5Qcm9qZWN0TWVudU1hbmFnZXIuY3JlYXRlUHJvamVjdHNNZW51KHRoaXMucHJvamVjdHMpXG4gICAgdGhpcy5sYXN0UHJvamVjdE1lbnUgPSB0aGlzLm1lbnVNYW5hZ2VyLmFkZChbbmV3TWVudV0pXG4gICAgdGhpcy51cGRhdGVXaW5kb3dzSnVtcExpc3QoKVxuICB9XG5cbiAgdXBkYXRlV2luZG93c0p1bXBMaXN0ICgpIHtcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuXG5cbiAgICBpZiAodGhpcy5hcHAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5hcHAgPSByZXF1aXJlKCdyZW1vdGUnKS5hcHBcbiAgICB9XG5cbiAgICB0aGlzLmFwcC5zZXRKdW1wTGlzdChbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdjdXN0b20nLFxuICAgICAgICBuYW1lOiAnUmVjZW50IFByb2plY3RzJyxcbiAgICAgICAgaXRlbXM6IHRoaXMucHJvamVjdHMubWFwKHAgPT4gKHtcbiAgICAgICAgICB0eXBlOiAndGFzaycsXG4gICAgICAgICAgdGl0bGU6IFJlb3BlblByb2plY3RNZW51TWFuYWdlci5jcmVhdGVMYWJlbChwKSxcbiAgICAgICAgICBwcm9ncmFtOiBwcm9jZXNzLmV4ZWNQYXRoLFxuICAgICAgICAgIGFyZ3M6IHAucGF0aHMubWFwKHBhdGggPT4gYFwiJHtwYXRofVwiYCkuam9pbignICcpIH0pKVxuICAgICAgfSxcbiAgICAgIHsgdHlwZTogJ3JlY2VudCcgfSxcbiAgICAgIHsgaXRlbXM6IFtcbiAgICAgICAgICB7dHlwZTogJ3Rhc2snLCB0aXRsZTogJ05ldyBXaW5kb3cnLCBwcm9ncmFtOiBwcm9jZXNzLmV4ZWNQYXRoLCBhcmdzOiAnLS1uZXctd2luZG93JywgZGVzY3JpcHRpb246ICdPcGVucyBhIG5ldyBBdG9tIHdpbmRvdyd9XG4gICAgICBdfVxuICAgIF0pXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgdGhpcy5kaXNwb3NlUHJvamVjdE1lbnUoKVxuICAgIGlmICh0aGlzLnJlb3BlblByb2plY3RMaXN0VmlldyAhPSBudWxsKSB7XG4gICAgICB0aGlzLnJlb3BlblByb2plY3RMaXN0Vmlldy5kaXNwb3NlKClcbiAgICB9XG4gIH1cblxuICBkaXNwb3NlUHJvamVjdE1lbnUgKCkge1xuICAgIGlmICh0aGlzLmxhc3RQcm9qZWN0TWVudSkge1xuICAgICAgdGhpcy5sYXN0UHJvamVjdE1lbnUuZGlzcG9zZSgpXG4gICAgICB0aGlzLmxhc3RQcm9qZWN0TWVudSA9IG51bGxcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlUHJvamVjdHNNZW51IChwcm9qZWN0cykge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogJ0ZpbGUnLFxuICAgICAgc3VibWVudTogW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6ICdSZW9wZW4gUHJvamVjdCcsXG4gICAgICAgICAgc3VibWVudTogcHJvamVjdHMubWFwKChwcm9qZWN0LCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgIGxhYmVsOiB0aGlzLmNyZWF0ZUxhYmVsKHByb2plY3QpLFxuICAgICAgICAgICAgY29tbWFuZDogJ2FwcGxpY2F0aW9uOnJlb3Blbi1wcm9qZWN0JyxcbiAgICAgICAgICAgIGNvbW1hbmREZXRhaWw6IHtpbmRleDogaW5kZXh9XG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlTGFiZWwgKHByb2plY3QpIHtcbiAgICByZXR1cm4gcHJvamVjdC5wYXRocy5sZW5ndGggPT09IDFcbiAgICAgID8gcHJvamVjdC5wYXRoc1swXVxuICAgICAgOiBwcm9qZWN0LnBhdGhzLm1hcCh0aGlzLmJldHRlckJhc2VOYW1lKS5qb2luKCcsICcpXG4gIH1cblxuICBzdGF0aWMgYmV0dGVyQmFzZU5hbWUgKGRpcmVjdG9yeSkge1xuICAgIC8vIEhhbmRsZXMgV2luZG93cyByb290cyBiZXR0ZXIgdGhhbiBwYXRoLmJhc2VuYW1lIHdoaWNoIHJldHVybnMgJycgZm9yICdkOicgYW5kICdkOlxcJ1xuICAgIGNvbnN0IG1hdGNoID0gZGlyZWN0b3J5Lm1hdGNoKC9eKFthLXpdOilbXFxcXF0/JC9pKVxuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdICsgJ1xcXFwnIDogcGF0aC5iYXNlbmFtZShkaXJlY3RvcnkpXG4gIH1cbn1cbiJdfQ==