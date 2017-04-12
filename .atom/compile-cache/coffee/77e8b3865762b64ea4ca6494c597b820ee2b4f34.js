(function() {
  var root, setFontSize, setLayoutMode, setTabSizing, unsetFontSize, unsetLayoutMode, unsetTabSizing;

  root = document.documentElement;

  module.exports = {
    activate: function(state) {
      atom.config.observe('one-light-ui.fontSize', function(value) {
        return setFontSize(value);
      });
      atom.config.observe('one-light-ui.layoutMode', function(value) {
        return setLayoutMode(value);
      });
      return atom.config.observe('one-light-ui.tabSizing', function(value) {
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
    return root.setAttribute('theme-one-light-ui-layoutmode', layoutMode.toLowerCase());
  };

  unsetLayoutMode = function() {
    return root.removeAttribute('theme-one-light-ui-layoutmode');
  };

  setTabSizing = function(tabSizing) {
    return root.setAttribute('theme-one-light-ui-tabsizing', tabSizing.toLowerCase());
  };

  unsetTabSizing = function() {
    return root.removeAttribute('theme-one-light-ui-tabsizing');
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9vbmUtbGlnaHQtdWkvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sUUFBUSxDQUFDOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUMsS0FBRDtNQUNSLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix1QkFBcEIsRUFBNkMsU0FBQyxLQUFEO2VBQzNDLFdBQUEsQ0FBWSxLQUFaO01BRDJDLENBQTdDO01BR0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLHlCQUFwQixFQUErQyxTQUFDLEtBQUQ7ZUFDN0MsYUFBQSxDQUFjLEtBQWQ7TUFENkMsQ0FBL0M7YUFHQSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0Isd0JBQXBCLEVBQThDLFNBQUMsS0FBRDtlQUM1QyxZQUFBLENBQWEsS0FBYjtNQUQ0QyxDQUE5QztJQVBRLENBQVY7SUFVQSxVQUFBLEVBQVksU0FBQTtNQUNWLGFBQUEsQ0FBQTtNQUNBLGVBQUEsQ0FBQTthQUNBLGNBQUEsQ0FBQTtJQUhVLENBVlo7OztFQWdCRixXQUFBLEdBQWMsU0FBQyxlQUFEO0lBQ1osSUFBRyxNQUFNLENBQUMsU0FBUCxDQUFpQixlQUFqQixDQUFIO2FBQ0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFYLEdBQXlCLGVBQUQsR0FBaUIsS0FEM0M7S0FBQSxNQUVLLElBQUcsZUFBQSxLQUFtQixNQUF0QjthQUNILGFBQUEsQ0FBQSxFQURHOztFQUhPOztFQU1kLGFBQUEsR0FBZ0IsU0FBQTtXQUNkLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBWCxHQUFzQjtFQURSOztFQUloQixhQUFBLEdBQWdCLFNBQUMsVUFBRDtXQUNkLElBQUksQ0FBQyxZQUFMLENBQWtCLCtCQUFsQixFQUFtRCxVQUFVLENBQUMsV0FBWCxDQUFBLENBQW5EO0VBRGM7O0VBR2hCLGVBQUEsR0FBa0IsU0FBQTtXQUNoQixJQUFJLENBQUMsZUFBTCxDQUFxQiwrQkFBckI7RUFEZ0I7O0VBSWxCLFlBQUEsR0FBZSxTQUFDLFNBQUQ7V0FDYixJQUFJLENBQUMsWUFBTCxDQUFrQiw4QkFBbEIsRUFBa0QsU0FBUyxDQUFDLFdBQVYsQ0FBQSxDQUFsRDtFQURhOztFQUdmLGNBQUEsR0FBaUIsU0FBQTtXQUNmLElBQUksQ0FBQyxlQUFMLENBQXFCLDhCQUFyQjtFQURlO0FBdkNqQiIsInNvdXJjZXNDb250ZW50IjpbInJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIGF0b20uY29uZmlnLm9ic2VydmUgJ29uZS1saWdodC11aS5mb250U2l6ZScsICh2YWx1ZSkgLT5cbiAgICAgIHNldEZvbnRTaXplKHZhbHVlKVxuXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnb25lLWxpZ2h0LXVpLmxheW91dE1vZGUnLCAodmFsdWUpIC0+XG4gICAgICBzZXRMYXlvdXRNb2RlKHZhbHVlKVxuXG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSAnb25lLWxpZ2h0LXVpLnRhYlNpemluZycsICh2YWx1ZSkgLT5cbiAgICAgIHNldFRhYlNpemluZyh2YWx1ZSlcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIHVuc2V0Rm9udFNpemUoKVxuICAgIHVuc2V0TGF5b3V0TW9kZSgpXG4gICAgdW5zZXRUYWJTaXppbmcoKVxuXG4jIEZvbnQgU2l6ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2V0Rm9udFNpemUgPSAoY3VycmVudEZvbnRTaXplKSAtPlxuICBpZiBOdW1iZXIuaXNJbnRlZ2VyKGN1cnJlbnRGb250U2l6ZSlcbiAgICByb290LnN0eWxlLmZvbnRTaXplID0gXCIje2N1cnJlbnRGb250U2l6ZX1weFwiXG4gIGVsc2UgaWYgY3VycmVudEZvbnRTaXplIGlzICdBdXRvJ1xuICAgIHVuc2V0Rm9udFNpemUoKVxuXG51bnNldEZvbnRTaXplID0gLT5cbiAgcm9vdC5zdHlsZS5mb250U2l6ZSA9ICcnXG5cbiMgTGF5b3V0IE1vZGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNldExheW91dE1vZGUgPSAobGF5b3V0TW9kZSkgLT5cbiAgcm9vdC5zZXRBdHRyaWJ1dGUoJ3RoZW1lLW9uZS1saWdodC11aS1sYXlvdXRtb2RlJywgbGF5b3V0TW9kZS50b0xvd2VyQ2FzZSgpKVxuXG51bnNldExheW91dE1vZGUgPSAtPlxuICByb290LnJlbW92ZUF0dHJpYnV0ZSgndGhlbWUtb25lLWxpZ2h0LXVpLWxheW91dG1vZGUnKVxuXG4jIFRhYiBTaXppbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNldFRhYlNpemluZyA9ICh0YWJTaXppbmcpIC0+XG4gIHJvb3Quc2V0QXR0cmlidXRlKCd0aGVtZS1vbmUtbGlnaHQtdWktdGFic2l6aW5nJywgdGFiU2l6aW5nLnRvTG93ZXJDYXNlKCkpXG5cbnVuc2V0VGFiU2l6aW5nID0gLT5cbiAgcm9vdC5yZW1vdmVBdHRyaWJ1dGUoJ3RoZW1lLW9uZS1saWdodC11aS10YWJzaXppbmcnKVxuIl19
