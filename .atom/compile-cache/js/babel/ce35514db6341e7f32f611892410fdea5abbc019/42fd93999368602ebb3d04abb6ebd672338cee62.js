Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _atom = require('atom');

var ViewURI = 'atom://deprecation-cop';
var DeprecationCopView = undefined;

var DeprecationCopPackage = (function () {
  function DeprecationCopPackage() {
    _classCallCheck(this, DeprecationCopPackage);
  }

  _createClass(DeprecationCopPackage, [{
    key: 'activate',
    value: function activate() {
      var _this = this;

      this.disposables = new _atom.CompositeDisposable();
      this.disposables.add(atom.workspace.addOpener(function (uri) {
        if (uri === ViewURI) {
          return _this.deserializeDeprecationCopView({ uri: uri });
        }
      }));
      this.disposables.add(atom.commands.add('atom-workspace', 'deprecation-cop:view', function () {
        atom.workspace.open(ViewURI);
      }));
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {
      this.disposables.dispose();
      var pane = atom.workspace.paneForURI(ViewURI);
      if (pane) {
        pane.destroyItem(pane.itemForURI(ViewURI));
      }
    }
  }, {
    key: 'deserializeDeprecationCopView',
    value: function deserializeDeprecationCopView(state) {
      if (!DeprecationCopView) {
        DeprecationCopView = require('./deprecation-cop-view');
      }
      return new DeprecationCopView(state);
    }
  }, {
    key: 'consumeStatusBar',
    value: function consumeStatusBar(statusBar) {
      var DeprecationCopStatusBarView = require('./deprecation-cop-status-bar-view');
      var statusBarView = new DeprecationCopStatusBarView();
      var statusBarTile = statusBar.addRightTile({ item: statusBarView, priority: 150 });
      this.disposables.add(new _atom.Disposable(function () {
        statusBarView.destroy();
      }));
      this.disposables.add(new _atom.Disposable(function () {
        statusBarTile.destroy();
      }));
    }
  }]);

  return DeprecationCopPackage;
})();

var instance = new DeprecationCopPackage();
exports['default'] = instance;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvZGVwcmVjYXRpb24tY29wL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRThDLE1BQU07O0FBRXBELElBQU0sT0FBTyxHQUFHLHdCQUF3QixDQUFBO0FBQ3hDLElBQUksa0JBQWtCLFlBQUEsQ0FBQTs7SUFFaEIscUJBQXFCO1dBQXJCLHFCQUFxQjswQkFBckIscUJBQXFCOzs7ZUFBckIscUJBQXFCOztXQUNoQixvQkFBRzs7O0FBQ1YsVUFBSSxDQUFDLFdBQVcsR0FBRywrQkFBeUIsQ0FBQTtBQUM1QyxVQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUNyRCxZQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUU7QUFDbkIsaUJBQU8sTUFBSyw2QkFBNkIsQ0FBQyxFQUFDLEdBQUcsRUFBSCxHQUFHLEVBQUMsQ0FBQyxDQUFBO1NBQ2pEO09BQ0YsQ0FBQyxDQUFDLENBQUE7QUFDSCxVQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBRSxZQUFNO0FBQ3JGLFlBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO09BQzdCLENBQUMsQ0FBQyxDQUFBO0tBQ0o7OztXQUVVLHNCQUFHO0FBQ1osVUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUMxQixVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUMvQyxVQUFJLElBQUksRUFBRTtBQUNSLFlBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO09BQzNDO0tBQ0Y7OztXQUU2Qix1Q0FBQyxLQUFLLEVBQUU7QUFDcEMsVUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQ3ZCLDBCQUFrQixHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFBO09BQ3ZEO0FBQ0QsYUFBTyxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ3JDOzs7V0FFZ0IsMEJBQUMsU0FBUyxFQUFFO0FBQzNCLFVBQU0sMkJBQTJCLEdBQUcsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUE7QUFDaEYsVUFBTSxhQUFhLEdBQUcsSUFBSSwyQkFBMkIsRUFBRSxDQUFBO0FBQ3ZELFVBQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFBO0FBQ2xGLFVBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLHFCQUFlLFlBQU07QUFBRSxxQkFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQUUsQ0FBQyxDQUFDLENBQUE7QUFDdkUsVUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMscUJBQWUsWUFBTTtBQUFFLHFCQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7T0FBRSxDQUFDLENBQUMsQ0FBQTtLQUN4RTs7O1NBbENHLHFCQUFxQjs7O0FBcUMzQixJQUFNLFFBQVEsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUE7cUJBQzdCLFFBQVEiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXByZWNhdGlvbi1jb3AvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCB7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSdcblxuY29uc3QgVmlld1VSSSA9ICdhdG9tOi8vZGVwcmVjYXRpb24tY29wJ1xubGV0IERlcHJlY2F0aW9uQ29wVmlld1xuXG5jbGFzcyBEZXByZWNhdGlvbkNvcFBhY2thZ2Uge1xuICBhY3RpdmF0ZSAoKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xuICAgICAgaWYgKHVyaSA9PT0gVmlld1VSSSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXNlcmlhbGl6ZURlcHJlY2F0aW9uQ29wVmlldyh7dXJpfSlcbiAgICAgIH1cbiAgICB9KSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnZGVwcmVjYXRpb24tY29wOnZpZXcnLCAoKSA9PiB7XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFZpZXdVUkkpXG4gICAgfSkpXG4gIH1cblxuICBkZWFjdGl2YXRlICgpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIGNvbnN0IHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJKFZpZXdVUkkpXG4gICAgaWYgKHBhbmUpIHtcbiAgICAgIHBhbmUuZGVzdHJveUl0ZW0ocGFuZS5pdGVtRm9yVVJJKFZpZXdVUkkpKVxuICAgIH1cbiAgfVxuXG4gIGRlc2VyaWFsaXplRGVwcmVjYXRpb25Db3BWaWV3IChzdGF0ZSkge1xuICAgIGlmICghRGVwcmVjYXRpb25Db3BWaWV3KSB7XG4gICAgICBEZXByZWNhdGlvbkNvcFZpZXcgPSByZXF1aXJlKCcuL2RlcHJlY2F0aW9uLWNvcC12aWV3JylcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEZXByZWNhdGlvbkNvcFZpZXcoc3RhdGUpXG4gIH1cblxuICBjb25zdW1lU3RhdHVzQmFyIChzdGF0dXNCYXIpIHtcbiAgICBjb25zdCBEZXByZWNhdGlvbkNvcFN0YXR1c0JhclZpZXcgPSByZXF1aXJlKCcuL2RlcHJlY2F0aW9uLWNvcC1zdGF0dXMtYmFyLXZpZXcnKVxuICAgIGNvbnN0IHN0YXR1c0JhclZpZXcgPSBuZXcgRGVwcmVjYXRpb25Db3BTdGF0dXNCYXJWaWV3KClcbiAgICBjb25zdCBzdGF0dXNCYXJUaWxlID0gc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7aXRlbTogc3RhdHVzQmFyVmlldywgcHJpb3JpdHk6IDE1MH0pXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4geyBzdGF0dXNCYXJWaWV3LmRlc3Ryb3koKSB9KSlcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7IHN0YXR1c0JhclRpbGUuZGVzdHJveSgpIH0pKVxuICB9XG59XG5cbmNvbnN0IGluc3RhbmNlID0gbmV3IERlcHJlY2F0aW9uQ29wUGFja2FnZSgpXG5leHBvcnQgZGVmYXVsdCBpbnN0YW5jZVxuIl19