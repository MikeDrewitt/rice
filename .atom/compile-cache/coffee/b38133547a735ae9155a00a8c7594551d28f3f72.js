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
      var count, lineCount, ref, ref1, ref2, title;
      count = (ref = this.getActiveTextEditor()) != null ? ref.getSelectedText().length : void 0;
      lineCount = (ref1 = this.getActiveTextEditor()) != null ? ref1.getSelectedBufferRange().getRowCount() : void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3N0YXR1cy1iYXIvbGliL3NlbGVjdGlvbi1jb3VudC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFRTs7Ozs7OztpQ0FFSixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxpQkFBZixFQUFrQyxjQUFsQztNQUVBLElBQUMsQ0FBQSxZQUFELDhFQUFxRTtNQUNyRSxJQUFDLENBQUEsc0JBQUQsR0FBMEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBZixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ2pFLEtBQUMsQ0FBQSwyQkFBRCxDQUFBO1FBRGlFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QztNQUcxQixJQUFDLENBQUEsaUJBQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSwyQkFBRCxDQUFBO0lBUlU7O2lDQVVaLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxzQkFBc0IsQ0FBQyxPQUF4QixDQUFBOztXQUNzQixDQUFFLE9BQXhCLENBQUE7OzREQUNtQixDQUFFLE9BQXJCLENBQUE7SUFITzs7aUNBS1QsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixVQUFBOztXQUFtQixDQUFFLE9BQXJCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGtCQUFELEdBQXNCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQixpQ0FBcEIsRUFBdUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7VUFDM0UsS0FBQyxDQUFBLFlBQUQsbUJBQWdCLFFBQVE7aUJBQ3hCLEtBQUMsQ0FBQSxXQUFELENBQUE7UUFGMkU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZEO0lBRkw7O2lDQU1uQiwyQkFBQSxHQUE2QixTQUFBO0FBQzNCLFVBQUE7O1dBQXNCLENBQUUsT0FBeEIsQ0FBQTs7TUFDQSxZQUFBLEdBQWUsSUFBQyxDQUFBLG1CQUFELENBQUE7TUFDZixJQUFDLENBQUEscUJBQUQsMEJBQXlCLFlBQVksQ0FBRSx5QkFBZCxDQUF3QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUMvRCxjQUFBO1VBRGlFLFlBQUQ7VUFDaEUsSUFBYyxTQUFBLEtBQWEsWUFBWSxDQUFDLGdCQUFiLENBQUEsQ0FBM0I7QUFBQSxtQkFBQTs7aUJBQ0EsS0FBQyxDQUFBLFdBQUQsQ0FBQTtRQUYrRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEM7YUFHekIsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQU4yQjs7aUNBUTdCLG1CQUFBLEdBQXFCLFNBQUE7YUFDbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO0lBRG1COztpQ0FHckIsV0FBQSxHQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsS0FBQSxtREFBOEIsQ0FBRSxlQUF4QixDQUFBLENBQXlDLENBQUM7TUFDbEQsU0FBQSxxREFBa0MsQ0FBRSxzQkFBeEIsQ0FBQSxDQUFnRCxDQUFDLFdBQWpELENBQUE7TUFDWixJQUFHLEtBQUEsR0FBUSxDQUFYO1FBQ0UsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsWUFBWSxDQUFDLE9BQWQsQ0FBc0IsSUFBdEIsRUFBNEIsU0FBNUIsQ0FBc0MsQ0FBQyxPQUF2QyxDQUErQyxJQUEvQyxFQUFxRCxLQUFyRDtRQUNmLEtBQUEsR0FBVSxDQUFDLENBQUMsQ0FBQyxTQUFGLENBQVksU0FBWixFQUF1QixNQUF2QixDQUFELENBQUEsR0FBZ0MsSUFBaEMsR0FBbUMsQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLEtBQVosRUFBbUIsV0FBbkIsQ0FBRCxDQUFuQyxHQUFvRTs7Y0FDNUQsQ0FBRSxPQUFwQixDQUFBOztlQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBbEIsRUFBd0I7VUFBQSxLQUFBLEVBQU8sS0FBUDtTQUF4QixFQUp2QjtPQUFBLE1BQUE7ZUFNRSxJQUFDLENBQUEsV0FBRCxHQUFlLEdBTmpCOztJQUhXOzs7O0tBbENrQjs7RUE2Q2pDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQVEsQ0FBQyxlQUFULENBQXlCLHNCQUF6QixFQUFpRDtJQUFBLFNBQUEsRUFBVyxrQkFBa0IsQ0FBQyxTQUE5QjtJQUF5QyxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBQWxEO0dBQWpEO0FBL0NqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbmNsYXNzIFNlbGVjdGlvbkNvdW50VmlldyBleHRlbmRzIEhUTUxFbGVtZW50XG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnc2VsZWN0aW9uLWNvdW50JywgJ2lubGluZS1ibG9jaycpXG5cbiAgICBAZm9ybWF0U3RyaW5nID0gYXRvbS5jb25maWcuZ2V0KCdzdGF0dXMtYmFyLnNlbGVjdGlvbkNvdW50Rm9ybWF0JykgPyAnKCVMLCAlQyknXG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+XG4gICAgICBAc3Vic2NyaWJlVG9BY3RpdmVUZXh0RWRpdG9yKClcblxuICAgIEBzdWJzY3JpYmVUb0NvbmZpZygpXG4gICAgQHN1YnNjcmliZVRvQWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICBAc2VsZWN0aW9uU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAY29uZmlnU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcblxuICBzdWJzY3JpYmVUb0NvbmZpZzogLT5cbiAgICBAY29uZmlnU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAY29uZmlnU3Vic2NyaXB0aW9uID0gYXRvbS5jb25maWcub2JzZXJ2ZSAnc3RhdHVzLWJhci5zZWxlY3Rpb25Db3VudEZvcm1hdCcsICh2YWx1ZSkgPT5cbiAgICAgIEBmb3JtYXRTdHJpbmcgPSB2YWx1ZSA/ICcoJUwsICVDKSdcbiAgICAgIEB1cGRhdGVDb3VudCgpXG5cbiAgc3Vic2NyaWJlVG9BY3RpdmVUZXh0RWRpdG9yOiAtPlxuICAgIEBzZWxlY3Rpb25TdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIGFjdGl2ZUVkaXRvciA9IEBnZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBAc2VsZWN0aW9uU3Vic2NyaXB0aW9uID0gYWN0aXZlRWRpdG9yPy5vbkRpZENoYW5nZVNlbGVjdGlvblJhbmdlICh7c2VsZWN0aW9ufSkgPT5cbiAgICAgIHJldHVybiB1bmxlc3Mgc2VsZWN0aW9uIGlzIGFjdGl2ZUVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKClcbiAgICAgIEB1cGRhdGVDb3VudCgpXG4gICAgQHVwZGF0ZUNvdW50KClcblxuICBnZXRBY3RpdmVUZXh0RWRpdG9yOiAtPlxuICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuXG4gIHVwZGF0ZUNvdW50OiAtPlxuICAgIGNvdW50ID0gQGdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0U2VsZWN0ZWRUZXh0KCkubGVuZ3RoXG4gICAgbGluZUNvdW50ID0gQGdldEFjdGl2ZVRleHRFZGl0b3IoKT8uZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpLmdldFJvd0NvdW50KClcbiAgICBpZiBjb3VudCA+IDBcbiAgICAgIEB0ZXh0Q29udGVudCA9IEBmb3JtYXRTdHJpbmcucmVwbGFjZSgnJUwnLCBsaW5lQ291bnQpLnJlcGxhY2UoJyVDJywgY291bnQpXG4gICAgICB0aXRsZSA9IFwiI3tfLnBsdXJhbGl6ZShsaW5lQ291bnQsICdsaW5lJyl9LCAje18ucGx1cmFsaXplKGNvdW50LCAnY2hhcmFjdGVyJyl9IHNlbGVjdGVkXCJcbiAgICAgIEB0b29sVGlwRGlzcG9zYWJsZT8uZGlzcG9zZSgpXG4gICAgICBAdG9vbFRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCB0aGlzLCB0aXRsZTogdGl0bGVcbiAgICBlbHNlXG4gICAgICBAdGV4dENvbnRlbnQgPSAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnc3RhdHVzLWJhci1zZWxlY3Rpb24nLCBwcm90b3R5cGU6IFNlbGVjdGlvbkNvdW50Vmlldy5wcm90b3R5cGUsIGV4dGVuZHM6ICdkaXYnKVxuIl19
