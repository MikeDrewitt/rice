(function() {
  var CursorPositionView, Disposable,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  CursorPositionView = (function(superClass) {
    extend(CursorPositionView, superClass);

    function CursorPositionView() {
      return CursorPositionView.__super__.constructor.apply(this, arguments);
    }

    CursorPositionView.prototype.initialize = function() {
      var ref;
      this.viewUpdatePending = false;
      this.classList.add('cursor-position', 'inline-block');
      this.goToLineLink = document.createElement('a');
      this.goToLineLink.classList.add('inline-block');
      this.goToLineLink.href = '#';
      this.appendChild(this.goToLineLink);
      this.formatString = (ref = atom.config.get('status-bar.cursorPositionFormat')) != null ? ref : '%L:%C';
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function(activeItem) {
          return _this.subscribeToActiveTextEditor();
        };
      })(this));
      this.subscribeToConfig();
      this.subscribeToActiveTextEditor();
      this.tooltip = atom.tooltips.add(this, {
        title: function() {
          return "Line " + this.row + ", Column " + this.column;
        }
      });
      return this.handleClick();
    };

    CursorPositionView.prototype.destroy = function() {
      var ref, ref1, ref2;
      this.activeItemSubscription.dispose();
      if ((ref = this.cursorSubscription) != null) {
        ref.dispose();
      }
      this.tooltip.dispose();
      if ((ref1 = this.configSubscription) != null) {
        ref1.dispose();
      }
      this.clickSubscription.dispose();
      return (ref2 = this.updateSubscription) != null ? ref2.dispose() : void 0;
    };

    CursorPositionView.prototype.subscribeToActiveTextEditor = function() {
      var activeEditor, ref;
      if ((ref = this.cursorSubscription) != null) {
        ref.dispose();
      }
      activeEditor = this.getActiveTextEditor();
      this.cursorSubscription = activeEditor != null ? activeEditor.onDidChangeCursorPosition((function(_this) {
        return function(arg) {
          var cursor;
          cursor = arg.cursor;
          if (cursor !== activeEditor.getLastCursor()) {
            return;
          }
          return _this.updatePosition();
        };
      })(this)) : void 0;
      return this.updatePosition();
    };

    CursorPositionView.prototype.subscribeToConfig = function() {
      var ref;
      if ((ref = this.configSubscription) != null) {
        ref.dispose();
      }
      return this.configSubscription = atom.config.observe('status-bar.cursorPositionFormat', (function(_this) {
        return function(value) {
          _this.formatString = value != null ? value : '%L:%C';
          return _this.updatePosition();
        };
      })(this));
    };

    CursorPositionView.prototype.handleClick = function() {
      var clickHandler;
      clickHandler = (function(_this) {
        return function() {
          return atom.commands.dispatch(atom.views.getView(_this.getActiveTextEditor()), 'go-to-line:toggle');
        };
      })(this);
      this.addEventListener('click', clickHandler);
      return this.clickSubscription = new Disposable((function(_this) {
        return function() {
          return _this.removeEventListener('click', clickHandler);
        };
      })(this));
    };

    CursorPositionView.prototype.getActiveTextEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    CursorPositionView.prototype.updatePosition = function() {
      if (this.viewUpdatePending) {
        return;
      }
      this.viewUpdatePending = true;
      return this.updateSubscription = atom.views.updateDocument((function(_this) {
        return function() {
          var position, ref;
          _this.viewUpdatePending = false;
          if (position = (ref = _this.getActiveTextEditor()) != null ? ref.getCursorBufferPosition() : void 0) {
            _this.row = position.row + 1;
            _this.column = position.column + 1;
            _this.goToLineLink.textContent = _this.formatString.replace('%L', _this.row).replace('%C', _this.column);
            return _this.classList.remove('hide');
          } else {
            _this.goToLineLink.textContent = '';
            return _this.classList.add('hide');
          }
        };
      })(this));
    };

    return CursorPositionView;

  })(HTMLElement);

  module.exports = document.registerElement('status-bar-cursor', {
    prototype: CursorPositionView.prototype,
    "extends": 'div'
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdGF0dXMtYmFyL2xpYi9jdXJzb3ItcG9zaXRpb24tdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDhCQUFBO0lBQUE7OztFQUFDLGFBQWMsT0FBQSxDQUFRLE1BQVI7O0VBRVQ7Ozs7Ozs7aUNBQ0osVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLGlCQUFELEdBQXFCO01BRXJCLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLGlCQUFmLEVBQWtDLGNBQWxDO01BQ0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsR0FBdkI7TUFDaEIsSUFBQyxDQUFBLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBeEIsQ0FBNEIsY0FBNUI7TUFDQSxJQUFDLENBQUEsWUFBWSxDQUFDLElBQWQsR0FBcUI7TUFDckIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsWUFBZDtNQUVBLElBQUMsQ0FBQSxZQUFELDhFQUFxRTtNQUNyRSxJQUFDLENBQUEsc0JBQUQsR0FBMEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBZixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsVUFBRDtpQkFDakUsS0FBQyxDQUFBLDJCQUFELENBQUE7UUFEaUU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpDO01BRzFCLElBQUMsQ0FBQSxpQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLDJCQUFELENBQUE7TUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFsQixFQUF3QjtRQUFBLEtBQUEsRUFBTyxTQUFBO2lCQUN4QyxPQUFBLEdBQVEsSUFBQyxD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QyxPQUFkLENBQXNCLElBQXRCLEVBQTRCLEtBQUMsQ0FBQSxHQUE3QixDQUFpQyxDQUFDLE9BQWxDLENBQTBDLElBQTFDLEVBQWdELEtBQUMsQ0FBQSxNQUFqRDttQkFDNUIsS0FBQyxDQUFBLFNBQVMsQ0FBQyxNQUFYLENBQWtCLE1BQWxCLEVBSkY7V0FBQSxNQUFBO1lBTUUsS0FBQyxDQUFBLFlBQVksQ0FBQyxXQUFkLEdBQTRCO21CQUM1QixLQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxNQUFmLEVBUEY7O1FBRjhDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtJQUpSOzs7O0tBcERlOztFQW1FakMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsbUJBQXpCLEVBQThDO0lBQUEsU0FBQSxFQUFXLGtCQUFrQixDQUFDLFNBQTlCO0lBQXlDLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FBbEQ7R0FBOUM7QUFyRWpCIiwic291cmNlc0NvbnRlbnQiOlsie0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuY2xhc3MgQ3Vyc29yUG9zaXRpb25WaWV3IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAdmlld1VwZGF0ZVBlbmRpbmcgPSBmYWxzZVxuXG4gICAgQGNsYXNzTGlzdC5hZGQoJ2N1cnNvci1wb3NpdGlvbicsICdpbmxpbmUtYmxvY2snKVxuICAgIEBnb1RvTGluZUxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICBAZ29Ub0xpbmVMaW5rLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpXG4gICAgQGdvVG9MaW5lTGluay5ocmVmID0gJyMnXG4gICAgQGFwcGVuZENoaWxkKEBnb1RvTGluZUxpbmspXG5cbiAgICBAZm9ybWF0U3RyaW5nID0gYXRvbS5jb25maWcuZ2V0KCdzdGF0dXMtYmFyLmN1cnNvclBvc2l0aW9uRm9ybWF0JykgPyAnJUw6JUMnXG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24gPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtIChhY3RpdmVJdGVtKSA9PlxuICAgICAgQHN1YnNjcmliZVRvQWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICBAc3Vic2NyaWJlVG9Db25maWcoKVxuICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgQHRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCh0aGlzLCB0aXRsZTogLT5cbiAgICAgIFwiTGluZSAje0Byb3d9LCBDb2x1bW4gI3tAY29sdW1ufVwiKVxuXG4gICAgQGhhbmRsZUNsaWNrKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgIEBjdXJzb3JTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEB0b29sdGlwLmRpc3Bvc2UoKVxuICAgIEBjb25maWdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjbGlja1N1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICBAdXBkYXRlU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcblxuICBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgQGN1cnNvclN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgYWN0aXZlRWRpdG9yID0gQGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIEBjdXJzb3JTdWJzY3JpcHRpb24gPSBhY3RpdmVFZGl0b3I/Lm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gKHtjdXJzb3J9KSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBjdXJzb3IgaXMgYWN0aXZlRWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgICAgQHVwZGF0ZVBvc2l0aW9uKClcbiAgICBAdXBkYXRlUG9zaXRpb24oKVxuXG4gIHN1YnNjcmliZVRvQ29uZmlnOiAtPlxuICAgIEBjb25maWdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjb25maWdTdWJzY3JpcHRpb24gPSBhdG9tLmNvbmZpZy5vYnNlcnZlICdzdGF0dXMtYmFyLmN1cnNvclBvc2l0aW9uRm9ybWF0JywgKHZhbHVlKSA9PlxuICAgICAgQGZvcm1hdFN0cmluZyA9IHZhbHVlID8gJyVMOiVDJ1xuICAgICAgQHVwZGF0ZVBvc2l0aW9uKClcblxuICBoYW5kbGVDbGljazogLT5cbiAgICBjbGlja0hhbmRsZXIgPSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhAZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ2dvLXRvLWxpbmU6dG9nZ2xlJylcbiAgICBAYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGlja0hhbmRsZXIpXG4gICAgQGNsaWNrU3Vic2NyaXB0aW9uID0gbmV3IERpc3Bvc2FibGUgPT4gQHJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKVxuXG4gIGdldEFjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgdXBkYXRlUG9zaXRpb246IC0+XG4gICAgcmV0dXJuIGlmIEB2aWV3VXBkYXRlUGVuZGluZ1xuXG4gICAgQHZpZXdVcGRhdGVQZW5kaW5nID0gdHJ1ZVxuICAgIEB1cGRhdGVTdWJzY3JpcHRpb24gPSBhdG9tLnZpZXdzLnVwZGF0ZURvY3VtZW50ID0+XG4gICAgICBAdmlld1VwZGF0ZVBlbmRpbmcgPSBmYWxzZVxuICAgICAgaWYgcG9zaXRpb24gPSBAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIEByb3cgPSBwb3NpdGlvbi5yb3cgKyAxXG4gICAgICAgIEBjb2x1bW4gPSBwb3NpdGlvbi5jb2x1bW4gKyAxXG4gICAgICAgIEBnb1RvTGluZUxpbmsudGV4dENvbnRlbnQgPSBAZm9ybWF0U3RyaW5nLnJlcGxhY2UoJyVMJywgQHJvdykucmVwbGFjZSgnJUMnLCBAY29sdW1uKVxuICAgICAgICBAY2xhc3NMaXN0LnJlbW92ZSgnaGlkZScpXG4gICAgICBlbHNlXG4gICAgICAgIEBnb1RvTGluZUxpbmsudGV4dENvbnRlbnQgPSAnJ1xuICAgICAgICBAY2xhc3NMaXN0LmFkZCgnaGlkZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdzdGF0dXMtYmFyLWN1cnNvcicsIHByb3RvdHlwZTogQ3Vyc29yUG9zaXRpb25WaWV3LnByb3RvdHlwZSwgZXh0ZW5kczogJ2RpdicpXG4iXX0=
