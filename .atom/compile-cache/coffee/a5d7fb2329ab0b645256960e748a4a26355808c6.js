(function() {
  module.exports = {
    keybindingResolverView: null,
    activate: function(arg) {
      var attached;
      attached = (arg != null ? arg : {}).attached;
      if (attached) {
        this.createView().toggle();
      }
      return atom.commands.add('atom-workspace', {
        'key-binding-resolver:toggle': (function(_this) {
          return function() {
            return _this.createView().toggle();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.createView().detach();
          };
        })(this),
        'core:close': (function(_this) {
          return function() {
            return _this.createView().detach();
          };
        })(this)
      });
    },
    createView: function() {
      var KeyBindingResolverView;
      if (this.keybindingResolverView == null) {
        KeyBindingResolverView = require('./keybinding-resolver-view');
        this.keybindingResolverView = new KeyBindingResolverView();
      }
      return this.keybindingResolverView;
    },
    deactivate: function() {
      var ref;
      return (ref = this.keybindingResolverView) != null ? ref.destroy() : void 0;
    },
    serialize: function() {
      var ref;
      return (ref = this.keybindingResolverView) != null ? ref.serialize() : void 0;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9rZXliaW5kaW5nLXJlc29sdmVyL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxzQkFBQSxFQUF3QixJQUF4QjtJQUVBLFFBQUEsRUFBVSxTQUFDLEdBQUQ7QUFDUixVQUFBO01BRFUsMEJBQUQsTUFBVztNQUNwQixJQUEwQixRQUExQjtRQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYSxDQUFDLE1BQWQsQ0FBQSxFQUFBOzthQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFDRTtRQUFBLDZCQUFBLEVBQStCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsTUFBZCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9CO1FBQ0EsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsTUFBZCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGY7UUFFQSxZQUFBLEVBQWMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxNQUFkLENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGZDtPQURGO0lBRlEsQ0FGVjtJQVNBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLElBQU8sbUNBQVA7UUFDRSxzQkFBQSxHQUF5QixPQUFBLENBQVEsNEJBQVI7UUFDekIsSUFBQyxDQUFBLHNCQUFELEdBQThCLElBQUEsc0JBQUEsQ0FBQSxFQUZoQzs7YUFHQSxJQUFDLENBQUE7SUFKUyxDQVRaO0lBZUEsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBOzhEQUF1QixDQUFFLE9BQXpCLENBQUE7SUFEVSxDQWZaO0lBa0JBLFNBQUEsRUFBVyxTQUFBO0FBQ1QsVUFBQTs4REFBdUIsQ0FBRSxTQUF6QixDQUFBO0lBRFMsQ0FsQlg7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIGtleWJpbmRpbmdSZXNvbHZlclZpZXc6IG51bGxcblxuICBhY3RpdmF0ZTogKHthdHRhY2hlZH09e30pIC0+XG4gICAgQGNyZWF0ZVZpZXcoKS50b2dnbGUoKSBpZiBhdHRhY2hlZFxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAna2V5LWJpbmRpbmctcmVzb2x2ZXI6dG9nZ2xlJzogPT4gQGNyZWF0ZVZpZXcoKS50b2dnbGUoKVxuICAgICAgJ2NvcmU6Y2FuY2VsJzogPT4gQGNyZWF0ZVZpZXcoKS5kZXRhY2goKVxuICAgICAgJ2NvcmU6Y2xvc2UnOiA9PiBAY3JlYXRlVmlldygpLmRldGFjaCgpXG5cbiAgY3JlYXRlVmlldzogLT5cbiAgICB1bmxlc3MgQGtleWJpbmRpbmdSZXNvbHZlclZpZXc/XG4gICAgICBLZXlCaW5kaW5nUmVzb2x2ZXJWaWV3ID0gcmVxdWlyZSAnLi9rZXliaW5kaW5nLXJlc29sdmVyLXZpZXcnXG4gICAgICBAa2V5YmluZGluZ1Jlc29sdmVyVmlldyA9IG5ldyBLZXlCaW5kaW5nUmVzb2x2ZXJWaWV3KClcbiAgICBAa2V5YmluZGluZ1Jlc29sdmVyVmlld1xuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGtleWJpbmRpbmdSZXNvbHZlclZpZXc/LmRlc3Ryb3koKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBAa2V5YmluZGluZ1Jlc29sdmVyVmlldz8uc2VyaWFsaXplKClcbiJdfQ==
