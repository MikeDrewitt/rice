Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/** @babel */

var _atomSpacePenViews = require('atom-space-pen-views');

var ReopenProjectListView = (function (_SelectListView) {
  _inherits(ReopenProjectListView, _SelectListView);

  function ReopenProjectListView() {
    _classCallCheck(this, ReopenProjectListView);

    _get(Object.getPrototypeOf(ReopenProjectListView.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ReopenProjectListView, [{
    key: 'initialize',
    value: function initialize(callback) {
      this.callback = callback;
      _get(Object.getPrototypeOf(ReopenProjectListView.prototype), 'initialize', this).call(this);
      this.addClass('reopen-project');
      this.list.addClass('mark-active');
    }
  }, {
    key: 'getFilterKey',
    value: function getFilterKey() {
      return 'name';
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.cancel();
    }
  }, {
    key: 'viewForItem',
    value: function viewForItem(project) {
      var element = document.createElement('li');
      if (project.name === this.currentProjectName) {
        element.classList.add('active');
      }
      element.textContent = project.name;
      return element;
    }
  }, {
    key: 'cancelled',
    value: function cancelled() {
      if (this.panel != null) {
        this.panel.destroy();
      }
      this.panel = null;
      this.currentProjectName = null;
    }
  }, {
    key: 'confirmed',
    value: function confirmed(project) {
      this.cancel();
      this.callback(project.value);
    }
  }, {
    key: 'attach',
    value: function attach() {
      this.storeFocusedElement();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({ item: this });
      }
      this.focusFilterEditor();
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      var _this = this;

      if (this.panel != null) {
        this.cancel();
      } else {
        this.currentProjectName = atom.project != null ? this.makeName(atom.project.getPaths()) : null;
        this.setItems(atom.history.getProjects().map(function (p) {
          return { name: _this.makeName(p.paths), value: p.paths };
        }));
        this.attach();
      }
    }
  }, {
    key: 'makeName',
    value: function makeName(paths) {
      return paths.join(', ');
    }
  }]);

  return ReopenProjectListView;
})(_atomSpacePenViews.SelectListView);

exports['default'] = ReopenProjectListView;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvcmVvcGVuLXByb2plY3QtbGlzdC12aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O2lDQUUrQixzQkFBc0I7O0lBRWhDLHFCQUFxQjtZQUFyQixxQkFBcUI7O1dBQXJCLHFCQUFxQjswQkFBckIscUJBQXFCOzsrQkFBckIscUJBQXFCOzs7ZUFBckIscUJBQXFCOztXQUM3QixvQkFBQyxRQUFRLEVBQUU7QUFDcEIsVUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7QUFDeEIsaUNBSGlCLHFCQUFxQiw0Q0FHcEI7QUFDbEIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQy9CLFVBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0tBQ2xDOzs7V0FFWSx3QkFBRztBQUNkLGFBQU8sTUFBTSxDQUFBO0tBQ2Q7OztXQUVPLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0tBQ2Q7OztXQUVXLHFCQUFDLE9BQU8sRUFBRTtBQUNwQixVQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzFDLFVBQUksT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDNUMsZUFBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7T0FDaEM7QUFDRCxhQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUE7QUFDbEMsYUFBTyxPQUFPLENBQUE7S0FDZjs7O1dBRVMscUJBQUc7QUFDWCxVQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDckI7QUFDRCxVQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtBQUNqQixVQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFBO0tBQy9COzs7V0FFUyxtQkFBQyxPQUFPLEVBQUU7QUFDbEIsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0FBQ2IsVUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDN0I7OztXQUVNLGtCQUFHO0FBQ1IsVUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7QUFDMUIsVUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRTtBQUN0QixZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7T0FDeEQ7QUFDRCxVQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtLQUN6Qjs7O1dBRU0sa0JBQUc7OztBQUNSLFVBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7QUFDdEIsWUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO09BQ2QsTUFBTTtBQUNMLFlBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUE7QUFDOUYsWUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUM7aUJBQUssRUFBRSxJQUFJLEVBQUUsTUFBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFO1NBQUMsQ0FBQyxDQUFDLENBQUE7QUFDdEcsWUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO09BQ2Q7S0FDRjs7O1dBRVEsa0JBQUMsS0FBSyxFQUFFO0FBQ2YsYUFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ3hCOzs7U0ExRGtCLHFCQUFxQjs7O3FCQUFyQixxQkFBcUIiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9yZW9wZW4tcHJvamVjdC1saXN0LXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7IFNlbGVjdExpc3RWaWV3IH0gZnJvbSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlb3BlblByb2plY3RMaXN0VmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3IHtcbiAgaW5pdGlhbGl6ZSAoY2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2tcbiAgICBzdXBlci5pbml0aWFsaXplKClcbiAgICB0aGlzLmFkZENsYXNzKCdyZW9wZW4tcHJvamVjdCcpXG4gICAgdGhpcy5saXN0LmFkZENsYXNzKCdtYXJrLWFjdGl2ZScpXG4gIH1cblxuICBnZXRGaWx0ZXJLZXkgKCkge1xuICAgIHJldHVybiAnbmFtZSdcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuY2FuY2VsKClcbiAgfVxuXG4gIHZpZXdGb3JJdGVtIChwcm9qZWN0KSB7XG4gICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgaWYgKHByb2plY3QubmFtZSA9PT0gdGhpcy5jdXJyZW50UHJvamVjdE5hbWUpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJylcbiAgICB9XG4gICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHByb2plY3QubmFtZVxuICAgIHJldHVybiBlbGVtZW50XG4gIH1cblxuICBjYW5jZWxsZWQgKCkge1xuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpXG4gICAgfVxuICAgIHRoaXMucGFuZWwgPSBudWxsXG4gICAgdGhpcy5jdXJyZW50UHJvamVjdE5hbWUgPSBudWxsXG4gIH1cblxuICBjb25maXJtZWQgKHByb2plY3QpIHtcbiAgICB0aGlzLmNhbmNlbCgpXG4gICAgdGhpcy5jYWxsYmFjayhwcm9qZWN0LnZhbHVlKVxuICB9XG5cbiAgYXR0YWNoICgpIHtcbiAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKVxuICAgIGlmICh0aGlzLnBhbmVsID09IG51bGwpIHtcbiAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtpdGVtOiB0aGlzfSlcbiAgICB9XG4gICAgdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpXG4gIH1cblxuICB0b2dnbGUgKCkge1xuICAgIGlmICh0aGlzLnBhbmVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMuY2FuY2VsKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jdXJyZW50UHJvamVjdE5hbWUgPSBhdG9tLnByb2plY3QgIT0gbnVsbCA/IHRoaXMubWFrZU5hbWUoYXRvbS5wcm9qZWN0LmdldFBhdGhzKCkpIDogbnVsbFxuICAgICAgdGhpcy5zZXRJdGVtcyhhdG9tLmhpc3RvcnkuZ2V0UHJvamVjdHMoKS5tYXAocCA9PiAoeyBuYW1lOiB0aGlzLm1ha2VOYW1lKHAucGF0aHMpLCB2YWx1ZTogcC5wYXRocyB9KSkpXG4gICAgICB0aGlzLmF0dGFjaCgpXG4gICAgfVxuICB9XG5cbiAgbWFrZU5hbWUgKHBhdGhzKSB7XG4gICAgcmV0dXJuIHBhdGhzLmpvaW4oJywgJylcbiAgfVxufVxuIl19