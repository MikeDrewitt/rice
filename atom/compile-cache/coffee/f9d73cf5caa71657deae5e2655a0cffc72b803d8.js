(function() {
  module.exports = {
    create: function(htmlString) {
      var template;
      template = document.createElement('template');
      template.innerHTML = htmlString;
      document.body.appendChild(template);
      return template;
    },
    render: function(template) {
      return document.importNode(template.content, true);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi90ZW1wbGF0ZS1oZWxwZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFBUSxTQUFDLFVBQUQ7QUFDTixVQUFBO01BQUEsUUFBQSxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLFVBQXZCO01BQ1gsUUFBUSxDQUFDLFNBQVQsR0FBcUI7TUFDckIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFkLENBQTBCLFFBQTFCO2FBQ0E7SUFKTSxDQUFSO0lBTUEsTUFBQSxFQUFRLFNBQUMsUUFBRDthQUNOLFFBQVEsQ0FBQyxVQUFULENBQW9CLFFBQVEsQ0FBQyxPQUE3QixFQUFzQyxJQUF0QztJQURNLENBTlI7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIGNyZWF0ZTogKGh0bWxTdHJpbmcpIC0+XG4gICAgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpXG4gICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gaHRtbFN0cmluZ1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGVtcGxhdGUpXG4gICAgdGVtcGxhdGVcblxuICByZW5kZXI6ICh0ZW1wbGF0ZSkgLT5cbiAgICBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpXG4iXX0=
