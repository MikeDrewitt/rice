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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL3NyYy9yZW9wZW4tcHJvamVjdC1tZW51LW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O3dCQUVrQyxXQUFXOztvQkFDNUIsTUFBTTs7OztJQUVGLHdCQUF3QjtBQUMvQixXQURPLHdCQUF3QixDQUM5QixJQUF1QyxFQUFFOzs7UUFBeEMsSUFBSSxHQUFMLElBQXVDLENBQXRDLElBQUk7UUFBRSxRQUFRLEdBQWYsSUFBdUMsQ0FBaEMsUUFBUTtRQUFFLE9BQU8sR0FBeEIsSUFBdUMsQ0FBdEIsT0FBTztRQUFFLE1BQU0sR0FBaEMsSUFBdUMsQ0FBYixNQUFNO1FBQUUsSUFBSSxHQUF0QyxJQUF1QyxDQUFMLElBQUk7OzBCQURoQyx3QkFBd0I7O0FBRXpDLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFBO0FBQ3ZCLFFBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFBO0FBQzdCLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0FBQ3BCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBOztBQUVsQixRQUFJLENBQUMsYUFBYSxHQUFHLG1DQUF5QixDQUFBO0FBQzlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyw2QkFBNkIsRUFBRSxVQUFDLEtBQW9CLEVBQUs7VUFBeEIsUUFBUSxHQUFULEtBQW9CLENBQW5CLFFBQVE7VUFBRSxRQUFRLEdBQW5CLEtBQW9CLENBQVQsUUFBUTs7QUFDcEUsWUFBSyxNQUFNLEVBQUUsQ0FBQTtLQUNkLENBQUMsRUFDRixRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQ3ZHLENBQUE7R0FDRjs7ZUFoQmtCLHdCQUF3Qjs7V0FrQnRCLDhCQUFDLENBQUMsRUFBRTtBQUN2QixVQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtBQUM5QyxZQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUMvQyxNQUFNO0FBQ0wsWUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUE7T0FDbkM7S0FDRjs7O1dBRTJCLHVDQUFHOzs7QUFDN0IsVUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxFQUFFO0FBQ3RDLFlBQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUE7QUFDbkUsWUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUkscUJBQXFCLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDOUQsY0FBSSxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ2pCLG1CQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtXQUNqQjtTQUNGLENBQUMsQ0FBQTtPQUNIO0FBQ0QsVUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFBO0tBQ3BDOzs7V0FFTSxrQkFBRztBQUNSLFVBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0FBQ3pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQTtBQUMxRyxVQUFNLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDMUUsVUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7S0FDdkQ7OztXQUVPLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QixVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtBQUN6QixVQUFJLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLEVBQUU7QUFDdEMsWUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3JDO0tBQ0Y7OztXQUVrQiw4QkFBRztBQUNwQixVQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7QUFDeEIsWUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM5QixZQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtPQUM1QjtLQUNGOzs7V0FFeUIsNEJBQUMsUUFBUSxFQUFFOzs7QUFDbkMsYUFBTztBQUNMLGFBQUssRUFBRSxNQUFNO0FBQ2IsZUFBTyxFQUFFLENBQ1A7QUFDRSxlQUFLLEVBQUUsZ0JBQWdCO0FBQ3ZCLGlCQUFPLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFDLE9BQU8sRUFBRSxLQUFLO21CQUFNO0FBQ3pDLG1CQUFLLEVBQUUsT0FBSyxXQUFXLENBQUMsT0FBTyxDQUFDO0FBQ2hDLHFCQUFPLEVBQUUsNEJBQTRCO0FBQ3JDLDJCQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDO2FBQzlCO1dBQUMsQ0FBQztTQUNKLENBQ0Y7T0FDRixDQUFBO0tBQ0Y7OztXQUVrQixxQkFBQyxPQUFPLEVBQUU7QUFDM0IsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDdEQ7OztXQUVxQix3QkFBQyxTQUFTLEVBQUU7O0FBRWhDLFVBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtBQUNqRCxhQUFPLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLGtCQUFLLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTtLQUMxRDs7O1NBdEZrQix3QkFBd0I7OztxQkFBeEIsd0JBQXdCIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL3NyYy9yZW9wZW4tcHJvamVjdC1tZW51LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnZXZlbnQta2l0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVvcGVuUHJvamVjdE1lbnVNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IgKHttZW51LCBjb21tYW5kcywgaGlzdG9yeSwgY29uZmlnLCBvcGVufSkge1xuICAgIHRoaXMubWVudU1hbmFnZXIgPSBtZW51XG4gICAgdGhpcy5oaXN0b3J5TWFuYWdlciA9IGhpc3RvcnlcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIHRoaXMub3BlbiA9IG9wZW5cbiAgICB0aGlzLnByb2plY3RzID0gW11cblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgaGlzdG9yeS5vbkRpZENoYW5nZVByb2plY3RzKHRoaXMudXBkYXRlLmJpbmQodGhpcykpLFxuICAgICAgY29uZmlnLm9uRGlkQ2hhbmdlKCdjb3JlLnJlb3BlblByb2plY3RNZW51Q291bnQnLCAoe29sZFZhbHVlLCBuZXdWYWx1ZX0pID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGUoKVxuICAgICAgfSksXG4gICAgICBjb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgeyAnYXBwbGljYXRpb246cmVvcGVuLXByb2plY3QnOiB0aGlzLnJlb3BlblByb2plY3RDb21tYW5kLmJpbmQodGhpcykgfSlcbiAgICApXG4gIH1cblxuICByZW9wZW5Qcm9qZWN0Q29tbWFuZCAoZSkge1xuICAgIGlmIChlLmRldGFpbCAhPSBudWxsICYmIGUuZGV0YWlsLmluZGV4ICE9IG51bGwpIHtcbiAgICAgIHRoaXMub3Blbih0aGlzLnByb2plY3RzW2UuZGV0YWlsLmluZGV4XS5wYXRocylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jcmVhdGVSZW9wZW5Qcm9qZWN0TGlzdFZpZXcoKVxuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZVJlb3BlblByb2plY3RMaXN0VmlldyAoKSB7XG4gICAgaWYgKHRoaXMucmVvcGVuUHJvamVjdExpc3RWaWV3ID09IG51bGwpIHtcbiAgICAgIGNvbnN0IFJlb3BlblByb2plY3RMaXN0VmlldyA9IHJlcXVpcmUoJy4vcmVvcGVuLXByb2plY3QtbGlzdC12aWV3JylcbiAgICAgIHRoaXMucmVvcGVuUHJvamVjdExpc3RWaWV3ID0gbmV3IFJlb3BlblByb2plY3RMaXN0VmlldyhwYXRocyA9PiB7XG4gICAgICAgIGlmIChwYXRocyAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5vcGVuKHBhdGhzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLnJlb3BlblByb2plY3RMaXN0Vmlldy50b2dnbGUoKVxuICB9XG5cbiAgdXBkYXRlICgpIHtcbiAgICB0aGlzLmRpc3Bvc2VQcm9qZWN0TWVudSgpXG4gICAgdGhpcy5wcm9qZWN0cyA9IHRoaXMuaGlzdG9yeU1hbmFnZXIuZ2V0UHJvamVjdHMoKS5zbGljZSgwLCB0aGlzLmNvbmZpZy5nZXQoJ2NvcmUucmVvcGVuUHJvamVjdE1lbnVDb3VudCcpKVxuICAgIGNvbnN0IG5ld01lbnUgPSBSZW9wZW5Qcm9qZWN0TWVudU1hbmFnZXIuY3JlYXRlUHJvamVjdHNNZW51KHRoaXMucHJvamVjdHMpXG4gICAgdGhpcy5sYXN0UHJvamVjdE1lbnUgPSB0aGlzLm1lbnVNYW5hZ2VyLmFkZChbbmV3TWVudV0pXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgdGhpcy5kaXNwb3NlUHJvamVjdE1lbnUoKVxuICAgIGlmICh0aGlzLnJlb3BlblByb2plY3RMaXN0VmlldyAhPSBudWxsKSB7XG4gICAgICB0aGlzLnJlb3BlblByb2plY3RMaXN0Vmlldy5kaXNwb3NlKClcbiAgICB9XG4gIH1cblxuICBkaXNwb3NlUHJvamVjdE1lbnUgKCkge1xuICAgIGlmICh0aGlzLmxhc3RQcm9qZWN0TWVudSkge1xuICAgICAgdGhpcy5sYXN0UHJvamVjdE1lbnUuZGlzcG9zZSgpXG4gICAgICB0aGlzLmxhc3RQcm9qZWN0TWVudSA9IG51bGxcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlUHJvamVjdHNNZW51IChwcm9qZWN0cykge1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbDogJ0ZpbGUnLFxuICAgICAgc3VibWVudTogW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6ICdSZW9wZW4gUHJvamVjdCcsXG4gICAgICAgICAgc3VibWVudTogcHJvamVjdHMubWFwKChwcm9qZWN0LCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgIGxhYmVsOiB0aGlzLmNyZWF0ZUxhYmVsKHByb2plY3QpLFxuICAgICAgICAgICAgY29tbWFuZDogJ2FwcGxpY2F0aW9uOnJlb3Blbi1wcm9qZWN0JyxcbiAgICAgICAgICAgIGNvbW1hbmREZXRhaWw6IHtpbmRleDogaW5kZXh9XG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlTGFiZWwgKHByb2plY3QpIHtcbiAgICByZXR1cm4gcHJvamVjdC5wYXRocy5sZW5ndGggPT09IDFcbiAgICAgID8gcHJvamVjdC5wYXRoc1swXVxuICAgICAgOiBwcm9qZWN0LnBhdGhzLm1hcCh0aGlzLmJldHRlckJhc2VOYW1lKS5qb2luKCcsICcpXG4gIH1cblxuICBzdGF0aWMgYmV0dGVyQmFzZU5hbWUgKGRpcmVjdG9yeSkge1xuICAgIC8vIEhhbmRsZXMgV2luZG93cyByb290cyBiZXR0ZXIgdGhhbiBwYXRoLmJhc2VuYW1lIHdoaWNoIHJldHVybnMgJycgZm9yICdkOicgYW5kICdkOlxcJ1xuICAgIGNvbnN0IG1hdGNoID0gZGlyZWN0b3J5Lm1hdGNoKC9eKFthLXpdOilbXFxcXF0/JC9pKVxuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdICsgJ1xcXFwnIDogcGF0aC5iYXNlbmFtZShkaXJlY3RvcnkpXG4gIH1cbn1cbiJdfQ==