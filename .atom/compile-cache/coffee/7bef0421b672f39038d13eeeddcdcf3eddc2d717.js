(function() {
  var StatusBarManager, _, createDiv, settings;

  _ = require('underscore-plus');

  settings = require('./settings');

  createDiv = function(arg) {
    var classList, div, id, ref;
    id = arg.id, classList = arg.classList;
    div = document.createElement('div');
    if (id != null) {
      div.id = id;
    }
    if (classList != null) {
      (ref = div.classList).add.apply(ref, classList);
    }
    return div;
  };

  module.exports = StatusBarManager = (function() {
    StatusBarManager.prototype.prefix = 'status-bar-vim-mode-plus';

    function StatusBarManager() {
      this.container = createDiv({
        id: this.prefix + "-container",
        classList: ['inline-block']
      });
      this.container.appendChild(this.element = createDiv({
        id: this.prefix
      }));
    }

    StatusBarManager.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
    };

    StatusBarManager.prototype.update = function(mode, submode) {
      var modeString;
      this.element.className = this.prefix + "-" + mode;
      modeString = (function() {
        switch (settings.get('statusBarModeStringStyle')) {
          case 'short':
            return this.getShortModeString(mode, submode);
          case 'long':
            return this.getLongModeString(mode, submode);
        }
      }).call(this);
      return this.element.textContent = modeString;
    };

    StatusBarManager.prototype.getShortModeString = function(mode, submode) {
      return (mode[0] + (submode != null ? submode[0] : '')).toUpperCase();
    };

    StatusBarManager.prototype.getLongModeString = function(mode, submode) {
      var modeString;
      modeString = _.humanizeEventName(mode);
      if (submode != null) {
        modeString += " " + _.humanizeEventName(submode);
      }
      return modeString;
    };

    StatusBarManager.prototype.attach = function() {
      return this.tile = this.statusBar.addRightTile({
        item: this.container,
        priority: 20
      });
    };

    StatusBarManager.prototype.detach = function() {
      return this.tile.destroy();
    };

    return StatusBarManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zdGF0dXMtYmFyLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFFWCxTQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1YsUUFBQTtJQURZLGFBQUk7SUFDaEIsR0FBQSxHQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO0lBQ04sSUFBZSxVQUFmO01BQUEsR0FBRyxDQUFDLEVBQUosR0FBUyxHQUFUOztJQUNBLElBQW1DLGlCQUFuQztNQUFBLE9BQUEsR0FBRyxDQUFDLFNBQUosQ0FBYSxDQUFDLEdBQWQsWUFBa0IsU0FBbEIsRUFBQTs7V0FDQTtFQUpVOztFQU1aLE1BQU0sQ0FBQyxPQUFQLEdBQ007K0JBQ0osTUFBQSxHQUFROztJQUVLLDBCQUFBO01BQ1gsSUFBQyxDQUFBLFNBQUQsR0FBYSxTQUFBLENBQVU7UUFBQSxFQUFBLEVBQU8sSUFBQyxDQUFBLE1BQUYsR0FBUyxZQUFmO1FBQTRCLFNBQUEsRUFBVyxDQUFDLGNBQUQsQ0FBdkM7T0FBVjtNQUNiLElBQUMsQ0FBQSxTQUFTLENBQUMsV0FBWCxDQUF1QixJQUFDLENBQUEsT0FBRCxHQUFXLFNBQUEsQ0FBVTtRQUFBLEVBQUEsRUFBSSxJQUFDLENBQUEsTUFBTDtPQUFWLENBQWxDO0lBRlc7OytCQUliLFVBQUEsR0FBWSxTQUFDLFNBQUQ7TUFBQyxJQUFDLENBQUEsWUFBRDtJQUFEOzsrQkFFWixNQUFBLEdBQVEsU0FBQyxJQUFELEVBQU8sT0FBUDtBQUNOLFVBQUE7TUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVQsR0FBd0IsSUFBQyxDQUFBLE1BQUYsR0FBUyxHQUFULEdBQVk7TUFDbkMsVUFBQTtBQUFhLGdCQUFPLFFBQVEsQ0FBQyxHQUFULENBQWEsMEJBQWIsQ0FBUDtBQUFBLGVBQ04sT0FETTttQkFDTyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsSUFBcEIsRUFBMEIsT0FBMUI7QUFEUCxlQUVOLE1BRk07bUJBRU0sSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQW5CLEVBQXlCLE9BQXpCO0FBRk47O2FBR2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULEdBQXVCO0lBTGpCOzsrQkFPUixrQkFBQSxHQUFvQixTQUFDLElBQUQsRUFBTyxPQUFQO2FBQ2xCLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBTCxHQUFVLENBQUksZUFBSCxHQUFpQixPQUFRLENBQUEsQ0FBQSxDQUF6QixHQUFpQyxFQUFsQyxDQUFYLENBQWlELENBQUMsV0FBbEQsQ0FBQTtJQURrQjs7K0JBR3BCLGlCQUFBLEdBQW1CLFNBQUMsSUFBRCxFQUFPLE9BQVA7QUFDakIsVUFBQTtNQUFBLFVBQUEsR0FBYSxDQUFDLENBQUMsaUJBQUYsQ0FBb0IsSUFBcEI7TUFDYixJQUFvRCxlQUFwRDtRQUFBLFVBQUEsSUFBYyxHQUFBLEdBQU0sQ0FBQyxDQUFDLGlCQUFGLENBQW9CLE9BQXBCLEVBQXBCOzthQUNBO0lBSGlCOzsrQkFLbkIsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxTQUFTLENBQUMsWUFBWCxDQUF3QjtRQUFBLElBQUEsRUFBTSxJQUFDLENBQUEsU0FBUDtRQUFrQixRQUFBLEVBQVUsRUFBNUI7T0FBeEI7SUFERjs7K0JBR1IsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBQTtJQURNOzs7OztBQXJDViIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5cbmNyZWF0ZURpdiA9ICh7aWQsIGNsYXNzTGlzdH0pIC0+XG4gIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIGRpdi5pZCA9IGlkIGlmIGlkP1xuICBkaXYuY2xhc3NMaXN0LmFkZChjbGFzc0xpc3QuLi4pIGlmIGNsYXNzTGlzdD9cbiAgZGl2XG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFN0YXR1c0Jhck1hbmFnZXJcbiAgcHJlZml4OiAnc3RhdHVzLWJhci12aW0tbW9kZS1wbHVzJ1xuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjb250YWluZXIgPSBjcmVhdGVEaXYoaWQ6IFwiI3tAcHJlZml4fS1jb250YWluZXJcIiwgY2xhc3NMaXN0OiBbJ2lubGluZS1ibG9jayddKVxuICAgIEBjb250YWluZXIuYXBwZW5kQ2hpbGQoQGVsZW1lbnQgPSBjcmVhdGVEaXYoaWQ6IEBwcmVmaXgpKVxuXG4gIGluaXRpYWxpemU6IChAc3RhdHVzQmFyKSAtPlxuXG4gIHVwZGF0ZTogKG1vZGUsIHN1Ym1vZGUpIC0+XG4gICAgQGVsZW1lbnQuY2xhc3NOYW1lID0gXCIje0BwcmVmaXh9LSN7bW9kZX1cIlxuICAgIG1vZGVTdHJpbmcgPSBzd2l0Y2ggc2V0dGluZ3MuZ2V0KCdzdGF0dXNCYXJNb2RlU3RyaW5nU3R5bGUnKVxuICAgICAgd2hlbiAnc2hvcnQnIHRoZW4gQGdldFNob3J0TW9kZVN0cmluZyhtb2RlLCBzdWJtb2RlKVxuICAgICAgd2hlbiAnbG9uZycgdGhlbiBAZ2V0TG9uZ01vZGVTdHJpbmcobW9kZSwgc3VibW9kZSlcbiAgICBAZWxlbWVudC50ZXh0Q29udGVudCA9IG1vZGVTdHJpbmdcblxuICBnZXRTaG9ydE1vZGVTdHJpbmc6IChtb2RlLCBzdWJtb2RlKSAtPlxuICAgIChtb2RlWzBdICsgKGlmIHN1Ym1vZGU/IHRoZW4gc3VibW9kZVswXSBlbHNlICcnKSkudG9VcHBlckNhc2UoKVxuXG4gIGdldExvbmdNb2RlU3RyaW5nOiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICBtb2RlU3RyaW5nID0gXy5odW1hbml6ZUV2ZW50TmFtZShtb2RlKVxuICAgIG1vZGVTdHJpbmcgKz0gXCIgXCIgKyBfLmh1bWFuaXplRXZlbnROYW1lKHN1Ym1vZGUpIGlmIHN1Ym1vZGU/XG4gICAgbW9kZVN0cmluZ1xuXG4gIGF0dGFjaDogLT5cbiAgICBAdGlsZSA9IEBzdGF0dXNCYXIuYWRkUmlnaHRUaWxlKGl0ZW06IEBjb250YWluZXIsIHByaW9yaXR5OiAyMClcblxuICBkZXRhY2g6IC0+XG4gICAgQHRpbGUuZGVzdHJveSgpXG4iXX0=
