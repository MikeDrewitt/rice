(function() {
  var root, setFontSize, setLayoutMode, setTabSizing, unsetFontSize, unsetLayoutMode, unsetTabSizing;

  root = document.documentElement;

  module.exports = {
    activate: function(state) {
      atom.config.observe('one-dark-ui.fontSize', function(value) {
        return setFontSize(value);
      });
      atom.config.observe('one-dark-ui.layoutMode', function(value) {
        return setLayoutMode(value);
      });
      return atom.config.observe('one-dark-ui.tabSizing', function(value) {
        return setTabSizing(value);
      });
    },
    deactivate: function() {
      unsetFontSize();
      unsetLayoutMode();
      return unsetTabSizing();
    }
  };

  setFontSize = function(currentFontSize) {
    if (Number.isInteger(currentFontSize)) {
      return root.style.fontSize = currentFontSize + "px";
    } else if (currentFontSize === 'Auto') {
      return unsetFontSize();
    }
  };

  unsetFontSize = function() {
    return root.style.fontSize = '';
  };

  setLayoutMode = function(layoutMode) {
    return root.setAttribute('theme-one-dark-ui-layoutmode', layoutMode.toLowerCase());
  };

  unsetLayoutMode = function() {
    return root.removeAttribute('theme-one-dark-ui-layoutmode');
  };

  setTabSizing = function(tabSizing) {
    return root.setAttribute('theme-one-dark-ui-tabsizing', tabSizing.toLowerCase());
  };

  unsetTabSizing = function() {
    return root.removeAttribute('theme-one-dark-ui-tabsizing');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9vbmUtZGFyay11aS9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxRQUFRLENBQUM7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxLQUFEO01BQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLHNCQUFwQixFQUE0QyxTQUFDLEtBQUQ7ZUFDMUMsV0FBQSxDQUFZLEtBQVo7TUFEMEMsQ0FBNUM7TUFHQSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0Isd0JBQXBCLEVBQThDLFNBQUMsS0FBRDtlQUM1QyxhQUFBLENBQWMsS0FBZDtNQUQ0QyxDQUE5QzthQUdBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix1QkFBcEIsRUFBNkMsU0FBQyxLQUFEO2VBQzNDLFlBQUEsQ0FBYSxLQUFiO01BRDJDLENBQTdDO0lBUFEsQ0FBVjtJQVVBLFVBQUEsRUFBWSxTQUFBO01BQ1YsYUFBQSxDQUFBO01BQ0EsZUFBQSxDQUFBO2FBQ0EsY0FBQSxDQUFBO0lBSFUsQ0FWWjs7O0VBZ0JGLFdBQUEsR0FBYyxTQUFDLGVBQUQ7SUFDWixJQUFHLE1BQU0sQ0FBQyxTQUFQLENBQWlCLGVBQWpCLENBQUg7YUFDRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVgsR0FBeUIsZUFBRCxHQUFpQixLQUQzQztLQUFBLE1BRUssSUFBRyxlQUFBLEtBQW1CLE1BQXRCO2FBQ0gsYUFBQSxDQUFBLEVBREc7O0VBSE87O0VBTWQsYUFBQSxHQUFnQixTQUFBO1dBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFYLEdBQXNCO0VBRFI7O0VBSWhCLGFBQUEsR0FBZ0IsU0FBQyxVQUFEO1dBQ2QsSUFBSSxDQUFDLFlBQUwsQ0FBa0IsOEJBQWxCLEVBQWtELFVBQVUsQ0FBQyxXQUFYLENBQUEsQ0FBbEQ7RUFEYzs7RUFHaEIsZUFBQSxHQUFrQixTQUFBO1dBQ2hCLElBQUksQ0FBQyxlQUFMLENBQXFCLDhCQUFyQjtFQURnQjs7RUFJbEIsWUFBQSxHQUFlLFNBQUMsU0FBRDtXQUNiLElBQUksQ0FBQyxZQUFMLENBQWtCLDZCQUFsQixFQUFpRCxTQUFTLENBQUMsV0FBVixDQUFBLENBQWpEO0VBRGE7O0VBR2YsY0FBQSxHQUFpQixTQUFBO1dBQ2YsSUFBSSxDQUFDLGVBQUwsQ0FBcUIsNkJBQXJCO0VBRGU7QUF2Q2pCIiwic291cmNlc0NvbnRlbnQiOlsicm9vdCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnb25lLWRhcmstdWkuZm9udFNpemUnLCAodmFsdWUpIC0+XG4gICAgICBzZXRGb250U2l6ZSh2YWx1ZSlcblxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ29uZS1kYXJrLXVpLmxheW91dE1vZGUnLCAodmFsdWUpIC0+XG4gICAgICBzZXRMYXlvdXRNb2RlKHZhbHVlKVxuXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnb25lLWRhcmstdWkudGFiU2l6aW5nJywgKHZhbHVlKSAtPlxuICAgICAgc2V0VGFiU2l6aW5nKHZhbHVlKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgdW5zZXRGb250U2l6ZSgpXG4gICAgdW5zZXRMYXlvdXRNb2RlKClcbiAgICB1bnNldFRhYlNpemluZygpXG5cbiMgRm9udCBTaXplIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5zZXRGb250U2l6ZSA9IChjdXJyZW50Rm9udFNpemUpIC0+XG4gIGlmIE51bWJlci5pc0ludGVnZXIoY3VycmVudEZvbnRTaXplKVxuICAgIHJvb3Quc3R5bGUuZm9udFNpemUgPSBcIiN7Y3VycmVudEZvbnRTaXplfXB4XCJcbiAgZWxzZSBpZiBjdXJyZW50Rm9udFNpemUgaXMgJ0F1dG8nXG4gICAgdW5zZXRGb250U2l6ZSgpXG5cbnVuc2V0Rm9udFNpemUgPSAtPlxuICByb290LnN0eWxlLmZvbnRTaXplID0gJydcblxuIyBMYXlvdXQgTW9kZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2V0TGF5b3V0TW9kZSA9IChsYXlvdXRNb2RlKSAtPlxuICByb290LnNldEF0dHJpYnV0ZSgndGhlbWUtb25lLWRhcmstdWktbGF5b3V0bW9kZScsIGxheW91dE1vZGUudG9Mb3dlckNhc2UoKSlcblxudW5zZXRMYXlvdXRNb2RlID0gLT5cbiAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ3RoZW1lLW9uZS1kYXJrLXVpLWxheW91dG1vZGUnKVxuXG4jIFRhYiBTaXppbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNldFRhYlNpemluZyA9ICh0YWJTaXppbmcpIC0+XG4gIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1vbmUtZGFyay11aS10YWJzaXppbmcnLCB0YWJTaXppbmcudG9Mb3dlckNhc2UoKSlcblxudW5zZXRUYWJTaXppbmcgPSAtPlxuICByb290LnJlbW92ZUF0dHJpYnV0ZSgndGhlbWUtb25lLWRhcmstdWktdGFic2l6aW5nJylcbiJdfQ==
