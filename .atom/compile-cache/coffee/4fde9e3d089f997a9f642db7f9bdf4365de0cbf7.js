(function() {
  var SelectionCountView, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  SelectionCountView = (function(superClass) {
    extend(SelectionCountView, superClass);

    function SelectionCountView() {
      return SelectionCountView.__super__.constructor.apply(this, arguments);
    }

    SelectionCountView.prototype.initialize = function() {
      var ref;
      this.classList.add('selection-count', 'inline-block');
      this.formatString = (ref = atom.config.get('status-bar.selectionCountFormat')) != null ? ref : '(%L, %C)';
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.subscribeToActiveTextEditor();
        };
      })(this));
      this.subscribeToConfig();
      return this.subscribeToActiveTextEditor();
    };

    SelectionCountView.prototype.destroy = function() {
      var ref, ref1;
      this.activeItemSubscription.dispose();
      if ((ref = this.selectionSubscription) != null) {
        ref.dispose();
      }
      return (ref1 = this.configSubscription) != null ? ref1.dispose() : void 0;
    };

    SelectionCountView.prototype.subscribeToConfig = function() {
      var ref;
      if ((ref = this.configSubscription) != null) {
        ref.dispose();
      }
      return this.configSubscription = atom.config.observe('status-bar.selectionCountFormat', (function(_this) {
        return function(value) {
          _this.formatString = value != null ? value : '(%L, %C)';
          return _this.updateCount();
        };
      })(this));
    };

    SelectionCountView.prototype.subscribeToActiveTextEditor = function() {
      var activeEditor, ref;
      if ((ref = this.selectionSubscription) != null) {
        ref.dispose();
      }
      activeEditor = this.getActiveTextEditor();
      this.selectionSubscription = activeEditor != null ? activeEditor.onDidChangeSelectionRange((function(_this) {
        return function(arg) {
          var selection;
          selection = arg.selection;
          if (selection !== activeEditor.getLastSelection()) {
            return;
          }
          return _this.updateCount();
        };
      })(this)) : void 0;
      return this.updateCount();
    };

    SelectionCountView.prototype.getActiveTextEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    SelectionCountView.prototype.updateCount = function() {
      var count, lineCount, range, ref, ref1, ref2, title;
      count = (ref = this.getActiveTextEditor()) != null ? ref.getSelectedText().length : void 0;
      range = (ref1 = this.getActiveTextEditor()) != null ? ref1.getSelectedBufferRange() : void 0;
      lineCount = range != null ? range.getRowCount() : void 0;
      if ((range != null ? range.end.column : void 0) === 0) {
        lineCount -= 1;
      }
      if (count > 0) {
        this.textContent = this.formatString.replace('%L', lineCount).replace('%C', count);
        title = (_.pluralize(lineCount, 'line')) + ", " + (_.pluralize(count, 'character')) + " selected";
        if ((ref2 = this.toolTipDisposable) != null) {
          ref2.dispose();
        }
        return this.toolTipDisposable = atom.tooltips.add(this, {
          title: title
        });
      } else {
        return this.textContent = '';
      }
    };

    return SelectionCountView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar-selection', {
    prototype: SelectionCountView.prototype,
    "extends": 'div'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9zZWxlY3Rpb24tY291bnQtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFCQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUU7Ozs7Ozs7aUNBRUosVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsaUJBQWYsRUFBa0MsY0FBbEM7TUFFQSxJQUFDLENBQUEsWUFBRCw4RUFBcUU7TUFDckUsSUFBQyxDQUFBLHNCQUFELEdBQTBCLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNqRSxLQUFDLENBQUEsMkJBQUQsQ0FBQTtRQURpRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7TUFHMUIsSUFBQyxDQUFBLGlCQUFELENBQUE7YUFDQSxJQUFDLENBQUEsMkJBQUQsQ0FBQTtJQVJVOztpQ0FVWixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsc0JBQXNCLENBQUMsT0FBeEIsQ0FBQTs7V0FDc0IsQ0FBRSxPQUF4QixDQUFBOzs0REFDbUIsQ0FBRSxPQUFyQixDQUFBO0lBSE87O2lDQUtULGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsVUFBQTs7V0FBbUIsQ0FBRSxPQUFyQixDQUFBOzthQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsaUNBQXBCLEVBQXVELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO1VBQzNFLEtBQUMsQ0FBQSxZQUFELG1CQUFnQixRQUFRO2lCQUN4QixLQUFDLENBQUEsV0FBRCxDQUFBO1FBRjJFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2RDtJQUZMOztpQ0FNbkIsMkJBQUEsR0FBNkIsU0FBQTtBQUMzQixVQUFBOztXQUFzQixDQUFFLE9BQXhCLENBQUE7O01BQ0EsWUFBQSxHQUFlLElBQUMsQ0FBQSxtQkFBRCxDQUFBO01BQ2YsSUFBQyxDQUFBLHFCQUFELDBCQUF5QixZQUFZLENBQUUseUJBQWQsQ0FBd0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDL0QsY0FBQTtVQURpRSxZQUFEO1VBQ2hFLElBQWMsU0FBQSxLQUFhLFlBQVksQ0FBQyxnQkFBYixDQUFBLENBQTNCO0FBQUEsbUJBQUE7O2lCQUNBLEtBQUMsQ0FBQSxXQUFELENBQUE7UUFGK0Q7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhDO2FBR3pCLElBQUMsQ0FBQSxXQUFELENBQUE7SUFOMkI7O2lDQVE3QixtQkFBQSxHQUFxQixTQUFBO2FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtJQURtQjs7aUNBR3JCLFdBQUEsR0FBYSxTQUFBO0FBQ1gsVUFBQTtNQUFBLEtBQUEsbURBQThCLENBQUUsZUFBeEIsQ0FBQSxDQUF5QyxDQUFDO01BQ2xELEtBQUEscURBQThCLENBQUUsc0JBQXhCLENBQUE7TUFDUixTQUFBLG1CQUFZLEtBQUssQ0FBRSxXQUFQLENBQUE7TUFDWixxQkFBa0IsS0FBSyxDQUFFLEdBQUcsQ0FBQyxnQkFBWCxLQUFxQixDQUF2QztRQUFBLFNBQUEsSUFBYSxFQUFiOztNQUNBLElBQUcsS0FBQSxHQUFRLENBQVg7UUFDRSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxZQUFZLENBQUMsT0FBZCxDQUFzQixJQUF0QixFQUE0QixTQUE1QixDQUFzQyxDQUFDLE9BQXZDLENBQStDLElBQS9DLEVBQXFELEtBQXJEO1FBQ2YsS0FBQSxHQUFVLENBQUMsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxTQUFaLEVBQXVCLE1BQXZCLENBQUQsQ0FBQSxHQUFnQyxJQUFoQyxHQUFtQyxDQUFDLENBQUMsQ0FBQyxTQUFGLENBQVksS0FBWixFQUFtQixXQUFuQixDQUFELENBQW5DLEdBQW9FOztjQUM1RCxDQUFFLE9BQXBCLENBQUE7O2VBQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFsQixFQUF3QjtVQUFBLEtBQUEsRUFBTyxLQUFQO1NBQXhCLEVBSnZCO09BQUEsTUFBQTtlQU1FLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FOakI7O0lBTFc7Ozs7S0FsQ2tCOztFQStDakMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsc0JBQXpCLEVBQWlEO0lBQUEsU0FBQSxFQUFXLGtCQUFrQixDQUFDLFNBQTlCO0lBQXlDLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FBbEQ7R0FBakQ7QUFqRGpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuY2xhc3MgU2VsZWN0aW9uQ291bnRWaWV3IGV4dGVuZHMgSFRNTEVsZW1lbnRcblxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjbGFzc0xpc3QuYWRkKCdzZWxlY3Rpb24tY291bnQnLCAnaW5saW5lLWJsb2NrJylcblxuICAgIEBmb3JtYXRTdHJpbmcgPSBhdG9tLmNvbmZpZy5nZXQoJ3N0YXR1cy1iYXIuc2VsZWN0aW9uQ291bnRGb3JtYXQnKSA/ICcoJUwsICVDKSdcbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbiA9IGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgQHN1YnNjcmliZVRvQ29uZmlnKClcbiAgICBAc3Vic2NyaWJlVG9BY3RpdmVUZXh0RWRpdG9yKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgIEBzZWxlY3Rpb25TdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjb25maWdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuXG4gIHN1YnNjcmliZVRvQ29uZmlnOiAtPlxuICAgIEBjb25maWdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjb25maWdTdWJzY3JpcHRpb24gPSBhdG9tLmNvbmZpZy5vYnNlcnZlICdzdGF0dXMtYmFyLnNlbGVjdGlvbkNvdW50Rm9ybWF0JywgKHZhbHVlKSA9PlxuICAgICAgQGZvcm1hdFN0cmluZyA9IHZhbHVlID8gJyglTCwgJUMpJ1xuICAgICAgQHVwZGF0ZUNvdW50KClcblxuICBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgQHNlbGVjdGlvblN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgYWN0aXZlRWRpdG9yID0gQGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIEBzZWxlY3Rpb25TdWJzY3JpcHRpb24gPSBhY3RpdmVFZGl0b3I/Lm9uRGlkQ2hhbmdlU2VsZWN0aW9uUmFuZ2UgKHtzZWxlY3Rpb259KSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBzZWxlY3Rpb24gaXMgYWN0aXZlRWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgICAgQHVwZGF0ZUNvdW50KClcbiAgICBAdXBkYXRlQ291bnQoKVxuXG4gIGdldEFjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgdXBkYXRlQ291bnQ6IC0+XG4gICAgY291bnQgPSBAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRTZWxlY3RlZFRleHQoKS5sZW5ndGhcbiAgICByYW5nZSA9IEBnZXRBY3RpdmVUZXh0RWRpdG9yKCk/LmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKVxuICAgIGxpbmVDb3VudCA9IHJhbmdlPy5nZXRSb3dDb3VudCgpXG4gICAgbGluZUNvdW50IC09IDEgaWYgcmFuZ2U/LmVuZC5jb2x1bW4gaXMgMFxuICAgIGlmIGNvdW50ID4gMFxuICAgICAgQHRleHRDb250ZW50ID0gQGZvcm1hdFN0cmluZy5yZXBsYWNlKCclTCcsIGxpbmVDb3VudCkucmVwbGFjZSgnJUMnLCBjb3VudClcbiAgICAgIHRpdGxlID0gXCIje18ucGx1cmFsaXplKGxpbmVDb3VudCwgJ2xpbmUnKX0sICN7Xy5wbHVyYWxpemUoY291bnQsICdjaGFyYWN0ZXInKX0gc2VsZWN0ZWRcIlxuICAgICAgQHRvb2xUaXBEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICAgIEB0b29sVGlwRGlzcG9zYWJsZSA9IGF0b20udG9vbHRpcHMuYWRkIHRoaXMsIHRpdGxlOiB0aXRsZVxuICAgIGVsc2VcbiAgICAgIEB0ZXh0Q29udGVudCA9ICcnXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdzdGF0dXMtYmFyLXNlbGVjdGlvbicsIHByb3RvdHlwZTogU2VsZWN0aW9uQ291bnRWaWV3LnByb3RvdHlwZSwgZXh0ZW5kczogJ2RpdicpXG4iXX0=
