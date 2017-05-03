(function() {
  module.exports = {
    config: {
      colourlessIcons: {
        type: 'boolean',
        "default": true,
        description: "Tick to force colourless tab icons"
      }
    },
    activate: function(state) {
      var self, varKey;
      varKey = 'predawn-ui.colourlessIcons';
      self = this;
      atom.config.onDidChange(varKey, function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        return self.setColoured(newValue);
      });
      return this.setColoured(atom.config.get(varKey));
    },
    setColoured: function(enable) {
      var tabBar;
      tabBar = document.querySelector('.tab-bar');
      if (!enable) {
        return tabBar.className = tabBar.className.replace(/\scolourless-icons/, '');
      } else {
        return tabBar.className = tabBar.className + " " + 'colourless-icons';
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9wcmVkYXduLXVpL2luZGV4LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxNQUFBLEVBQ0U7TUFBQSxlQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFEVDtRQUVBLFdBQUEsRUFBYSxvQ0FGYjtPQURGO0tBREY7SUFLQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLE1BQUEsR0FBUztNQUNULElBQUEsR0FBTztNQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixNQUF4QixFQUFnQyxTQUFDLEdBQUQ7QUFDOUIsWUFBQTtRQURnQyx5QkFBVTtlQUMxQyxJQUFJLENBQUMsV0FBTCxDQUFpQixRQUFqQjtNQUQ4QixDQUFoQzthQUVBLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLE1BQWhCLENBQWI7SUFMUSxDQUxWO0lBV0EsV0FBQSxFQUFhLFNBQUMsTUFBRDtBQUNYLFVBQUE7TUFBQSxNQUFBLEdBQVMsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsVUFBdkI7TUFDVCxJQUFHLENBQUMsTUFBSjtlQUNFLE1BQU0sQ0FBQyxTQUFQLEdBQW1CLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBakIsQ0FBeUIsb0JBQXpCLEVBQStDLEVBQS9DLEVBRHJCO09BQUEsTUFBQTtlQUdFLE1BQU0sQ0FBQyxTQUFQLEdBQW1CLE1BQU0sQ0FBQyxTQUFQLEdBQW1CLEdBQW5CLEdBQXlCLG1CQUg5Qzs7SUFGVyxDQVhiOztBQURGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICBjb25maWc6XG4gICAgY29sb3VybGVzc0ljb25zOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBkZXNjcmlwdGlvbjogXCJUaWNrIHRvIGZvcmNlIGNvbG91cmxlc3MgdGFiIGljb25zXCJcbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICB2YXJLZXkgPSAncHJlZGF3bi11aS5jb2xvdXJsZXNzSWNvbnMnXG4gICAgc2VsZiA9IEBcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSB2YXJLZXksICh7bmV3VmFsdWUsIG9sZFZhbHVlfSkgLT5cbiAgICAgIHNlbGYuc2V0Q29sb3VyZWQobmV3VmFsdWUpXG4gICAgQHNldENvbG91cmVkKGF0b20uY29uZmlnLmdldCh2YXJLZXkpKVxuICBzZXRDb2xvdXJlZDogKGVuYWJsZSkgLT5cbiAgICB0YWJCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudGFiLWJhcicpXG4gICAgaWYgIWVuYWJsZVxuICAgICAgdGFiQmFyLmNsYXNzTmFtZSA9IHRhYkJhci5jbGFzc05hbWUucmVwbGFjZSgvXFxzY29sb3VybGVzcy1pY29ucy8sICcnKVxuICAgIGVsc2VcbiAgICAgIHRhYkJhci5jbGFzc05hbWUgPSB0YWJCYXIuY2xhc3NOYW1lICsgXCIgXCIgKyAnY29sb3VybGVzcy1pY29ucydcbiJdfQ==
