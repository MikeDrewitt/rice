Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _eventKit = require('event-kit');

// Extended: History manager for remembering which projects have been opened.
//
// An instance of this class is always available as the `atom.history` global.
//
// The project history is used to enable the 'Reopen Project' menu.

var HistoryManager = (function () {
  function HistoryManager(_ref) {
    var _this = this;

    var project = _ref.project;
    var commands = _ref.commands;
    var localStorage = _ref.localStorage;

    _classCallCheck(this, HistoryManager);

    this.localStorage = localStorage;
    commands.add('atom-workspace', { 'application:clear-project-history': this.clearProjects.bind(this) });
    this.emitter = new _eventKit.Emitter();
    this.loadState();
    project.onDidChangePaths(function (projectPaths) {
      return _this.addProject(projectPaths);
    });
  }

  // Public: Obtain a list of previously opened projects.
  //
  // Returns an {Array} of {HistoryProject} objects, most recent first.

  _createClass(HistoryManager, [{
    key: 'getProjects',
    value: function getProjects() {
      return this.projects.map(function (p) {
        return new HistoryProject(p.paths, p.lastOpened);
      });
    }

    // Public: Clear all projects from the history.
    //
    // Note: This is not a privacy function - other traces will still exist,
    // e.g. window state.
  }, {
    key: 'clearProjects',
    value: function clearProjects() {
      this.projects = [];
      this.saveState();
      this.didChangeProjects();
    }

    // Public: Invoke the given callback when the list of projects changes.
    //
    // * `callback` {Function}
    //
    // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  }, {
    key: 'onDidChangeProjects',
    value: function onDidChangeProjects(callback) {
      return this.emitter.on('did-change-projects', callback);
    }
  }, {
    key: 'didChangeProjects',
    value: function didChangeProjects(args) {
      this.emitter.emit('did-change-projects', args || { reloaded: false });
    }
  }, {
    key: 'addProject',
    value: function addProject(paths, lastOpened) {
      var project = this.getProject(paths);
      if (!project) {
        project = new HistoryProject(paths);
        this.projects.push(project);
      }
      project.lastOpened = lastOpened || new Date();
      this.projects.sort(function (a, b) {
        return b.lastOpened - a.lastOpened;
      });

      this.saveState();
      this.didChangeProjects();
    }
  }, {
    key: 'getProject',
    value: function getProject(paths) {
      var pathsString = paths.toString();
      for (var i = 0; i < this.projects.length; i++) {
        if (this.projects[i].paths.toString() === pathsString) {
          return this.projects[i];
        }
      }

      return null;
    }
  }, {
    key: 'loadState',
    value: function loadState() {
      var state = JSON.parse(this.localStorage.getItem('history'));
      if (state && state.projects) {
        this.projects = state.projects.filter(function (p) {
          return Array.isArray(p.paths) && p.paths.length > 0;
        }).map(function (p) {
          return new HistoryProject(p.paths, new Date(p.lastOpened));
        });
        this.didChangeProjects({ reloaded: true });
      } else {
        this.projects = [];
      }
    }
  }, {
    key: 'saveState',
    value: function saveState() {
      var state = JSON.stringify({
        projects: this.projects.map(function (p) {
          return {
            paths: p.paths, lastOpened: p.lastOpened
          };
        })
      });
      this.localStorage.setItem('history', state);
    }
  }, {
    key: 'importProjectHistory',
    value: _asyncToGenerator(function* () {
      for (var project of yield HistoryImporter.getAllProjects()) {
        this.addProject(project.paths, project.lastOpened);
      }
      this.saveState();
      this.didChangeProjects();
    })
  }]);

  return HistoryManager;
})();

exports.HistoryManager = HistoryManager;

var HistoryProject = (function () {
  function HistoryProject(paths, lastOpened) {
    _classCallCheck(this, HistoryProject);

    this.paths = paths;
    this.lastOpened = lastOpened || new Date();
  }

  _createClass(HistoryProject, [{
    key: 'paths',
    set: function set(paths) {
      this._paths = paths;
    },
    get: function get() {
      return this._paths;
    }
  }, {
    key: 'lastOpened',
    set: function set(lastOpened) {
      this._lastOpened = lastOpened;
    },
    get: function get() {
      return this._lastOpened;
    }
  }]);

  return HistoryProject;
})();

exports.HistoryProject = HistoryProject;

var HistoryImporter = (function () {
  function HistoryImporter() {
    _classCallCheck(this, HistoryImporter);
  }

  _createClass(HistoryImporter, null, [{
    key: 'getStateStoreCursor',
    value: _asyncToGenerator(function* () {
      var db = yield atom.stateStore.dbPromise;
      var store = db.transaction(['states']).objectStore('states');
      return store.openCursor();
    })
  }, {
    key: 'getAllProjects',
    value: _asyncToGenerator(function* (stateStore) {
      var request = yield HistoryImporter.getStateStoreCursor();
      return new Promise(function (resolve, reject) {
        var rows = [];
        request.onerror = reject;
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            var project = cursor.value.value.project;
            var storedAt = cursor.value.storedAt;
            if (project && project.paths && storedAt) {
              rows.push(new HistoryProject(project.paths, new Date(Date.parse(storedAt))));
            }
            cursor['continue']();
          } else {
            resolve(rows);
          }
        };
      });
    })
  }]);

  return HistoryImporter;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvaGlzdG9yeS1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozt3QkFFc0IsV0FBVzs7Ozs7Ozs7SUFPcEIsY0FBYztBQUNiLFdBREQsY0FBYyxDQUNaLElBQWlDLEVBQUU7OztRQUFsQyxPQUFPLEdBQVIsSUFBaUMsQ0FBaEMsT0FBTztRQUFFLFFBQVEsR0FBbEIsSUFBaUMsQ0FBdkIsUUFBUTtRQUFFLFlBQVksR0FBaEMsSUFBaUMsQ0FBYixZQUFZOzswQkFEbEMsY0FBYzs7QUFFdkIsUUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7QUFDaEMsWUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQTtBQUNwRyxRQUFJLENBQUMsT0FBTyxHQUFHLHVCQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO0FBQ2hCLFdBQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFDLFlBQVk7YUFBSyxNQUFLLFVBQVUsQ0FBQyxZQUFZLENBQUM7S0FBQSxDQUFDLENBQUE7R0FDMUU7Ozs7OztlQVBVLGNBQWM7O1dBWWIsdUJBQUc7QUFDYixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQztlQUFJLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQztPQUFBLENBQUMsQ0FBQTtLQUN6RTs7Ozs7Ozs7V0FNYSx5QkFBRztBQUNmLFVBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFVBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtBQUNoQixVQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtLQUN6Qjs7Ozs7Ozs7O1dBT21CLDZCQUFDLFFBQVEsRUFBRTtBQUM3QixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxDQUFBO0tBQ3hEOzs7V0FFaUIsMkJBQUMsSUFBSSxFQUFFO0FBQ3ZCLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0tBQ3RFOzs7V0FFVSxvQkFBQyxLQUFLLEVBQUUsVUFBVSxFQUFFO0FBQzdCLFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDcEMsVUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLGVBQU8sR0FBRyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNuQyxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtPQUM1QjtBQUNELGFBQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUE7QUFDN0MsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztlQUFLLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVU7T0FBQSxDQUFDLENBQUE7O0FBRXpELFVBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtBQUNoQixVQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtLQUN6Qjs7O1dBRVUsb0JBQUMsS0FBSyxFQUFFO0FBQ2pCLFVBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtBQUNwQyxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsWUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxXQUFXLEVBQUU7QUFDckQsaUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUN4QjtPQUNGOztBQUVELGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztXQUVTLHFCQUFHO0FBQ1gsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO0FBQzlELFVBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7QUFDM0IsWUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7aUJBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztTQUFBLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDO2lCQUFJLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQUEsQ0FBQyxDQUFBO0FBQ3RKLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO09BQzNDLE1BQU07QUFDTCxZQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtPQUNuQjtLQUNGOzs7V0FFUyxxQkFBRztBQUNYLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsZ0JBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUM7aUJBQUs7QUFDaEMsaUJBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVTtXQUN6QztTQUFDLENBQUM7T0FDSixDQUFDLENBQUE7QUFDRixVQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDNUM7Ozs2QkFFMEIsYUFBRztBQUM1QixXQUFLLElBQUksT0FBTyxJQUFJLE1BQU0sZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFFO0FBQzFELFlBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7T0FDbkQ7QUFDRCxVQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7QUFDaEIsVUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUE7S0FDekI7OztTQXhGVSxjQUFjOzs7OztJQTJGZCxjQUFjO0FBQ2IsV0FERCxjQUFjLENBQ1osS0FBSyxFQUFFLFVBQVUsRUFBRTswQkFEckIsY0FBYzs7QUFFdkIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7QUFDbEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQTtHQUMzQzs7ZUFKVSxjQUFjOztTQU1mLGFBQUMsS0FBSyxFQUFFO0FBQUUsVUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUE7S0FBRTtTQUMvQixlQUFHO0FBQUUsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFBO0tBQUU7OztTQUVwQixhQUFDLFVBQVUsRUFBRTtBQUFFLFVBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFBO0tBQUU7U0FDOUMsZUFBRztBQUFFLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQTtLQUFFOzs7U0FWbEMsY0FBYzs7Ozs7SUFhckIsZUFBZTtXQUFmLGVBQWU7MEJBQWYsZUFBZTs7O2VBQWYsZUFBZTs7NkJBQ2MsYUFBRztBQUNsQyxVQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFBO0FBQzFDLFVBQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUM5RCxhQUFPLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQTtLQUMxQjs7OzZCQUUyQixXQUFDLFVBQVUsRUFBRTtBQUN2QyxVQUFNLE9BQU8sR0FBRyxNQUFNLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0FBQzNELGFBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLFlBQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUNmLGVBQU8sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO0FBQ3hCLGVBQU8sQ0FBQyxTQUFTLEdBQUcsVUFBQSxLQUFLLEVBQUk7QUFDM0IsY0FBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUE7QUFDbEMsY0FBSSxNQUFNLEVBQUU7QUFDVixnQkFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFBO0FBQ3hDLGdCQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQTtBQUNwQyxnQkFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxRQUFRLEVBQUU7QUFDeEMsa0JBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQzdFO0FBQ0Qsa0JBQU0sWUFBUyxFQUFFLENBQUE7V0FDbEIsTUFBTTtBQUNMLG1CQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7V0FDZDtTQUNGLENBQUE7T0FDRixDQUFDLENBQUE7S0FDSDs7O1NBMUJHLGVBQWUiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9oaXN0b3J5LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7RW1pdHRlcn0gZnJvbSAnZXZlbnQta2l0J1xuXG4vLyBFeHRlbmRlZDogSGlzdG9yeSBtYW5hZ2VyIGZvciByZW1lbWJlcmluZyB3aGljaCBwcm9qZWN0cyBoYXZlIGJlZW4gb3BlbmVkLlxuLy9cbi8vIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20uaGlzdG9yeWAgZ2xvYmFsLlxuLy9cbi8vIFRoZSBwcm9qZWN0IGhpc3RvcnkgaXMgdXNlZCB0byBlbmFibGUgdGhlICdSZW9wZW4gUHJvamVjdCcgbWVudS5cbmV4cG9ydCBjbGFzcyBIaXN0b3J5TWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yICh7cHJvamVjdCwgY29tbWFuZHMsIGxvY2FsU3RvcmFnZX0pIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IGxvY2FsU3RvcmFnZVxuICAgIGNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7J2FwcGxpY2F0aW9uOmNsZWFyLXByb2plY3QtaGlzdG9yeSc6IHRoaXMuY2xlYXJQcm9qZWN0cy5iaW5kKHRoaXMpfSlcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5sb2FkU3RhdGUoKVxuICAgIHByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocHJvamVjdFBhdGhzKSA9PiB0aGlzLmFkZFByb2plY3QocHJvamVjdFBhdGhzKSlcbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIGEgbGlzdCBvZiBwcmV2aW91c2x5IG9wZW5lZCBwcm9qZWN0cy5cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtIaXN0b3J5UHJvamVjdH0gb2JqZWN0cywgbW9zdCByZWNlbnQgZmlyc3QuXG4gIGdldFByb2plY3RzICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9qZWN0cy5tYXAocCA9PiBuZXcgSGlzdG9yeVByb2plY3QocC5wYXRocywgcC5sYXN0T3BlbmVkKSlcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ2xlYXIgYWxsIHByb2plY3RzIGZyb20gdGhlIGhpc3RvcnkuXG4gIC8vXG4gIC8vIE5vdGU6IFRoaXMgaXMgbm90IGEgcHJpdmFjeSBmdW5jdGlvbiAtIG90aGVyIHRyYWNlcyB3aWxsIHN0aWxsIGV4aXN0LFxuICAvLyBlLmcuIHdpbmRvdyBzdGF0ZS5cbiAgY2xlYXJQcm9qZWN0cyAoKSB7XG4gICAgdGhpcy5wcm9qZWN0cyA9IFtdXG4gICAgdGhpcy5zYXZlU3RhdGUoKVxuICAgIHRoaXMuZGlkQ2hhbmdlUHJvamVjdHMoKVxuICB9XG5cbiAgLy8gUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIHdoZW4gdGhlIGxpc3Qgb2YgcHJvamVjdHMgY2hhbmdlcy5cbiAgLy9cbiAgLy8gKiBgY2FsbGJhY2tgIHtGdW5jdGlvbn1cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byB1bnN1YnNjcmliZS5cbiAgb25EaWRDaGFuZ2VQcm9qZWN0cyAoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY2hhbmdlLXByb2plY3RzJywgY2FsbGJhY2spXG4gIH1cblxuICBkaWRDaGFuZ2VQcm9qZWN0cyAoYXJncykge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXByb2plY3RzJywgYXJncyB8fCB7IHJlbG9hZGVkOiBmYWxzZSB9KVxuICB9XG5cbiAgYWRkUHJvamVjdCAocGF0aHMsIGxhc3RPcGVuZWQpIHtcbiAgICBsZXQgcHJvamVjdCA9IHRoaXMuZ2V0UHJvamVjdChwYXRocylcbiAgICBpZiAoIXByb2plY3QpIHtcbiAgICAgIHByb2plY3QgPSBuZXcgSGlzdG9yeVByb2plY3QocGF0aHMpXG4gICAgICB0aGlzLnByb2plY3RzLnB1c2gocHJvamVjdClcbiAgICB9XG4gICAgcHJvamVjdC5sYXN0T3BlbmVkID0gbGFzdE9wZW5lZCB8fCBuZXcgRGF0ZSgpXG4gICAgdGhpcy5wcm9qZWN0cy5zb3J0KChhLCBiKSA9PiBiLmxhc3RPcGVuZWQgLSBhLmxhc3RPcGVuZWQpXG5cbiAgICB0aGlzLnNhdmVTdGF0ZSgpXG4gICAgdGhpcy5kaWRDaGFuZ2VQcm9qZWN0cygpXG4gIH1cblxuICBnZXRQcm9qZWN0IChwYXRocykge1xuICAgIGNvbnN0IHBhdGhzU3RyaW5nID0gcGF0aHMudG9TdHJpbmcoKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcm9qZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMucHJvamVjdHNbaV0ucGF0aHMudG9TdHJpbmcoKSA9PT0gcGF0aHNTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvamVjdHNbaV1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgbG9hZFN0YXRlICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UodGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGlzdG9yeScpKVxuICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5wcm9qZWN0cykge1xuICAgICAgdGhpcy5wcm9qZWN0cyA9IHN0YXRlLnByb2plY3RzLmZpbHRlcihwID0+IEFycmF5LmlzQXJyYXkocC5wYXRocykgJiYgcC5wYXRocy5sZW5ndGggPiAwKS5tYXAocCA9PiBuZXcgSGlzdG9yeVByb2plY3QocC5wYXRocywgbmV3IERhdGUocC5sYXN0T3BlbmVkKSkpXG4gICAgICB0aGlzLmRpZENoYW5nZVByb2plY3RzKHsgcmVsb2FkZWQ6IHRydWUgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdXG4gICAgfVxuICB9XG5cbiAgc2F2ZVN0YXRlICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHByb2plY3RzOiB0aGlzLnByb2plY3RzLm1hcChwID0+ICh7XG4gICAgICAgIHBhdGhzOiBwLnBhdGhzLCBsYXN0T3BlbmVkOiBwLmxhc3RPcGVuZWRcbiAgICAgIH0pKVxuICAgIH0pXG4gICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGlzdG9yeScsIHN0YXRlKVxuICB9XG5cbiAgYXN5bmMgaW1wb3J0UHJvamVjdEhpc3RvcnkgKCkge1xuICAgIGZvciAobGV0IHByb2plY3Qgb2YgYXdhaXQgSGlzdG9yeUltcG9ydGVyLmdldEFsbFByb2plY3RzKCkpIHtcbiAgICAgIHRoaXMuYWRkUHJvamVjdChwcm9qZWN0LnBhdGhzLCBwcm9qZWN0Lmxhc3RPcGVuZWQpXG4gICAgfVxuICAgIHRoaXMuc2F2ZVN0YXRlKClcbiAgICB0aGlzLmRpZENoYW5nZVByb2plY3RzKClcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSGlzdG9yeVByb2plY3Qge1xuICBjb25zdHJ1Y3RvciAocGF0aHMsIGxhc3RPcGVuZWQpIHtcbiAgICB0aGlzLnBhdGhzID0gcGF0aHNcbiAgICB0aGlzLmxhc3RPcGVuZWQgPSBsYXN0T3BlbmVkIHx8IG5ldyBEYXRlKClcbiAgfVxuXG4gIHNldCBwYXRocyAocGF0aHMpIHsgdGhpcy5fcGF0aHMgPSBwYXRocyB9XG4gIGdldCBwYXRocyAoKSB7IHJldHVybiB0aGlzLl9wYXRocyB9XG5cbiAgc2V0IGxhc3RPcGVuZWQgKGxhc3RPcGVuZWQpIHsgdGhpcy5fbGFzdE9wZW5lZCA9IGxhc3RPcGVuZWQgfVxuICBnZXQgbGFzdE9wZW5lZCAoKSB7IHJldHVybiB0aGlzLl9sYXN0T3BlbmVkIH1cbn1cblxuY2xhc3MgSGlzdG9yeUltcG9ydGVyIHtcbiAgc3RhdGljIGFzeW5jIGdldFN0YXRlU3RvcmVDdXJzb3IgKCkge1xuICAgIGNvbnN0IGRiID0gYXdhaXQgYXRvbS5zdGF0ZVN0b3JlLmRiUHJvbWlzZVxuICAgIGNvbnN0IHN0b3JlID0gZGIudHJhbnNhY3Rpb24oWydzdGF0ZXMnXSkub2JqZWN0U3RvcmUoJ3N0YXRlcycpXG4gICAgcmV0dXJuIHN0b3JlLm9wZW5DdXJzb3IoKVxuICB9XG5cbiAgc3RhdGljIGFzeW5jIGdldEFsbFByb2plY3RzIChzdGF0ZVN0b3JlKSB7XG4gICAgY29uc3QgcmVxdWVzdCA9IGF3YWl0IEhpc3RvcnlJbXBvcnRlci5nZXRTdGF0ZVN0b3JlQ3Vyc29yKClcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgcm93cyA9IFtdXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSByZWplY3RcbiAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZXZlbnQgPT4ge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0XG4gICAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgICBsZXQgcHJvamVjdCA9IGN1cnNvci52YWx1ZS52YWx1ZS5wcm9qZWN0XG4gICAgICAgICAgbGV0IHN0b3JlZEF0ID0gY3Vyc29yLnZhbHVlLnN0b3JlZEF0XG4gICAgICAgICAgaWYgKHByb2plY3QgJiYgcHJvamVjdC5wYXRocyAmJiBzdG9yZWRBdCkge1xuICAgICAgICAgICAgcm93cy5wdXNoKG5ldyBIaXN0b3J5UHJvamVjdChwcm9qZWN0LnBhdGhzLCBuZXcgRGF0ZShEYXRlLnBhcnNlKHN0b3JlZEF0KSkpKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUocm93cylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiJdfQ==