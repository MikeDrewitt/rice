(function() {
  var root, setFormFocusEffect, setTabSizing, unsetFormFocusEffect, unsetTabSizing;

  root = document.documentElement;

  module.exports = {
    activate: function(state) {
      atom.config.observe('nord-atom-ui.tabSizing', function(noFullWidth) {
        return setTabSizing(noFullWidth);
      });
      return atom.config.observe('nord-atom-ui.darkerFormFocusEffect', function(noSnowLight) {
        return setFormFocusEffect(noSnowLight);
      });
    },
    deactivate: function() {
      unsetTabSizing();
      return unsetFormFocusEffect();
    }
  };

  setFormFocusEffect = function(noSnowLight) {
    if (noSnowLight) {
      return root.setAttribute('theme-nord-atom-ui-form-focus-effect', "nosnowlight");
    } else {
      return unsetFormFocusEffect();
    }
  };

  setTabSizing = function(noFullWidth) {
    if (noFullWidth) {
      return unsetTabSizing();
    } else {
      return root.setAttribute('theme-nord-atom-ui-tabsizing', "nofullwidth");
    }
  };

  unsetFormFocusEffect = function() {
    return root.removeAttribute('theme-nord-atom-ui-form-focus-effect');
  };

  unsetTabSizing = function() {
    return root.removeAttribute('theme-nord-atom-ui-tabsizing');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9ub3JkLWF0b20tdWkvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sUUFBUSxDQUFDOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUMsS0FBRDtNQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix3QkFBcEIsRUFBOEMsU0FBQyxXQUFEO2VBQzVDLFlBQUEsQ0FBYSxXQUFiO01BRDRDLENBQTlDO2FBRUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLG9DQUFwQixFQUEwRCxTQUFDLFdBQUQ7ZUFDeEQsa0JBQUEsQ0FBbUIsV0FBbkI7TUFEd0QsQ0FBMUQ7SUFIUSxDQUFWO0lBTUEsVUFBQSxFQUFZLFNBQUE7TUFDVixjQUFBLENBQUE7YUFDQSxvQkFBQSxDQUFBO0lBRlUsQ0FOWjs7O0VBVUYsa0JBQUEsR0FBcUIsU0FBQyxXQUFEO0lBQ25CLElBQUksV0FBSjthQUNFLElBQUksQ0FBQyxZQUFMLENBQWtCLHNDQUFsQixFQUEwRCxhQUExRCxFQURGO0tBQUEsTUFBQTthQUdFLG9CQUFBLENBQUEsRUFIRjs7RUFEbUI7O0VBTXJCLFlBQUEsR0FBZSxTQUFDLFdBQUQ7SUFDYixJQUFJLFdBQUo7YUFDRSxjQUFBLENBQUEsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFJLENBQUMsWUFBTCxDQUFrQiw4QkFBbEIsRUFBa0QsYUFBbEQsRUFIRjs7RUFEYTs7RUFNZixvQkFBQSxHQUF1QixTQUFBO1dBQ3JCLElBQUksQ0FBQyxlQUFMLENBQXFCLHNDQUFyQjtFQURxQjs7RUFHdkIsY0FBQSxHQUFpQixTQUFBO1dBQ2YsSUFBSSxDQUFDLGVBQUwsQ0FBcUIsOEJBQXJCO0VBRGU7QUE1QmpCIiwic291cmNlc0NvbnRlbnQiOlsicm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ25vcmQtYXRvbS11aS50YWJTaXppbmcnLCAobm9GdWxsV2lkdGgpIC0+XG4gICAgICBzZXRUYWJTaXppbmcobm9GdWxsV2lkdGgpXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnbm9yZC1hdG9tLXVpLmRhcmtlckZvcm1Gb2N1c0VmZmVjdCcsIChub1Nub3dMaWdodCkgLT5cbiAgICAgIHNldEZvcm1Gb2N1c0VmZmVjdChub1Nub3dMaWdodClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIHVuc2V0VGFiU2l6aW5nKClcbiAgICB1bnNldEZvcm1Gb2N1c0VmZmVjdCgpXG5cbnNldEZvcm1Gb2N1c0VmZmVjdCA9IChub1Nub3dMaWdodCkgLT5cbiAgaWYgKG5vU25vd0xpZ2h0KVxuICAgIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1ub3JkLWF0b20tdWktZm9ybS1mb2N1cy1lZmZlY3QnLCBcIm5vc25vd2xpZ2h0XCIpXG4gIGVsc2VcbiAgICB1bnNldEZvcm1Gb2N1c0VmZmVjdCgpXG5cbnNldFRhYlNpemluZyA9IChub0Z1bGxXaWR0aCkgLT5cbiAgaWYgKG5vRnVsbFdpZHRoKVxuICAgIHVuc2V0VGFiU2l6aW5nKClcbiAgZWxzZVxuICAgIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1ub3JkLWF0b20tdWktdGFic2l6aW5nJywgXCJub2Z1bGx3aWR0aFwiKVxuXG51bnNldEZvcm1Gb2N1c0VmZmVjdCA9IC0+XG4gIHJvb3QucmVtb3ZlQXR0cmlidXRlKCd0aGVtZS1ub3JkLWF0b20tdWktZm9ybS1mb2N1cy1lZmZlY3QnKVxuXG51bnNldFRhYlNpemluZyA9IC0+XG4gIHJvb3QucmVtb3ZlQXR0cmlidXRlKCd0aGVtZS1ub3JkLWF0b20tdWktdGFic2l6aW5nJylcbiJdfQ==
