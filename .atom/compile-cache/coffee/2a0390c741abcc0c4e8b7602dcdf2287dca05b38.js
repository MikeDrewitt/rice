(function() {
  module.exports = {
    activate: function() {
      this.stack = [];
      this.workspaceSubscription = atom.commands.add('atom-workspace', {
        'symbols-view:toggle-project-symbols': (function(_this) {
          return function() {
            return _this.createProjectView().toggle();
          };
        })(this)
      });
      return this.editorSubscription = atom.commands.add('atom-text-editor', {
        'symbols-view:toggle-file-symbols': (function(_this) {
          return function() {
            return _this.createFileView().toggle();
          };
        })(this),
        'symbols-view:go-to-declaration': (function(_this) {
          return function() {
            return _this.createGoToView().toggle();
          };
        })(this),
        'symbols-view:return-from-declaration': (function(_this) {
          return function() {
            return _this.createGoBackView().toggle();
          };
        })(this)
      });
    },
    deactivate: function() {
      if (this.fileView != null) {
        this.fileView.destroy();
        this.fileView = null;
      }
      if (this.projectView != null) {
        this.projectView.destroy();
        this.projectView = null;
      }
      if (this.goToView != null) {
        this.goToView.destroy();
        this.goToView = null;
      }
      if (this.goBackView != null) {
        this.goBackView.destroy();
        this.goBackView = null;
      }
      if (this.workspaceSubscription != null) {
        this.workspaceSubscription.dispose();
        this.workspaceSubscription = null;
      }
      if (this.editorSubscription != null) {
        this.editorSubscription.dispose();
        return this.editorSubscription = null;
      }
    },
    createFileView: function() {
      var FileView;
      if (this.fileView == null) {
        FileView = require('./file-view');
        this.fileView = new FileView(this.stack);
      }
      return this.fileView;
    },
    createProjectView: function() {
      var ProjectView;
      if (this.projectView == null) {
        ProjectView = require('./project-view');
        this.projectView = new ProjectView(this.stack);
      }
      return this.projectView;
    },
    createGoToView: function() {
      var GoToView;
      if (this.goToView == null) {
        GoToView = require('./go-to-view');
        this.goToView = new GoToView(this.stack);
      }
      return this.goToView;
    },
    createGoBackView: function() {
      var GoBackView;
      if (this.goBackView == null) {
        GoBackView = require('./go-back-view');
        this.goBackView = new GoBackView(this.stack);
      }
      return this.goBackView;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUVULElBQUMsQ0FBQSxxQkFBRCxHQUF5QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQ3ZCO1FBQUEscUNBQUEsRUFBdUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFvQixDQUFDLE1BQXJCLENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkM7T0FEdUI7YUFHekIsSUFBQyxDQUFBLGtCQUFELEdBQXNCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixrQkFBbEIsRUFDcEI7UUFBQSxrQ0FBQSxFQUFvQyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaUIsQ0FBQyxNQUFsQixDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBDO1FBQ0EsZ0NBQUEsRUFBa0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsY0FBRCxDQUFBLENBQWlCLENBQUMsTUFBbEIsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURsQztRQUVBLHNDQUFBLEVBQXdDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGdCQUFELENBQUEsQ0FBbUIsQ0FBQyxNQUFwQixDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRnhDO09BRG9CO0lBTmQsQ0FBVjtJQVdBLFVBQUEsRUFBWSxTQUFBO01BQ1YsSUFBRyxxQkFBSDtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFBO1FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUZkOztNQUlBLElBQUcsd0JBQUg7UUFDRSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtRQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsS0FGakI7O01BSUEsSUFBRyxxQkFBSDtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFBO1FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxLQUZkOztNQUlBLElBQUcsdUJBQUg7UUFDRSxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELEdBQWMsS0FGaEI7O01BSUEsSUFBRyxrQ0FBSDtRQUNFLElBQUMsQ0FBQSxxQkFBcUIsQ0FBQyxPQUF2QixDQUFBO1FBQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCLEtBRjNCOztNQUlBLElBQUcsK0JBQUg7UUFDRSxJQUFDLENBQUEsa0JBQWtCLENBQUMsT0FBcEIsQ0FBQTtlQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixLQUZ4Qjs7SUFyQlUsQ0FYWjtJQW9DQSxjQUFBLEVBQWdCLFNBQUE7QUFDZCxVQUFBO01BQUEsSUFBTyxxQkFBUDtRQUNFLFFBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsUUFBQSxDQUFTLElBQUMsQ0FBQSxLQUFWLEVBRmxCOzthQUdBLElBQUMsQ0FBQTtJQUphLENBcENoQjtJQTBDQSxpQkFBQSxFQUFtQixTQUFBO0FBQ2pCLFVBQUE7TUFBQSxJQUFPLHdCQUFQO1FBQ0UsV0FBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjtRQUNmLElBQUMsQ0FBQSxXQUFELEdBQW1CLElBQUEsV0FBQSxDQUFZLElBQUMsQ0FBQSxLQUFiLEVBRnJCOzthQUdBLElBQUMsQ0FBQTtJQUpnQixDQTFDbkI7SUFnREEsY0FBQSxFQUFnQixTQUFBO0FBQ2QsVUFBQTtNQUFBLElBQU8scUJBQVA7UUFDRSxRQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLFFBQUEsQ0FBUyxJQUFDLENBQUEsS0FBVixFQUZsQjs7YUFHQSxJQUFDLENBQUE7SUFKYSxDQWhEaEI7SUFzREEsZ0JBQUEsRUFBa0IsU0FBQTtBQUNoQixVQUFBO01BQUEsSUFBTyx1QkFBUDtRQUNFLFVBQUEsR0FBYSxPQUFBLENBQVEsZ0JBQVI7UUFDYixJQUFDLENBQUEsVUFBRCxHQUFrQixJQUFBLFVBQUEsQ0FBVyxJQUFDLENBQUEsS0FBWixFQUZwQjs7YUFHQSxJQUFDLENBQUE7SUFKZSxDQXREbEI7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzdGFjayA9IFtdXG5cbiAgICBAd29ya3NwYWNlU3Vic2NyaXB0aW9uID0gYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICdzeW1ib2xzLXZpZXc6dG9nZ2xlLXByb2plY3Qtc3ltYm9scyc6ID0+IEBjcmVhdGVQcm9qZWN0VmlldygpLnRvZ2dsZSgpXG5cbiAgICBAZWRpdG9yU3Vic2NyaXB0aW9uID0gYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ3N5bWJvbHMtdmlldzp0b2dnbGUtZmlsZS1zeW1ib2xzJzogPT4gQGNyZWF0ZUZpbGVWaWV3KCkudG9nZ2xlKClcbiAgICAgICdzeW1ib2xzLXZpZXc6Z28tdG8tZGVjbGFyYXRpb24nOiA9PiBAY3JlYXRlR29Ub1ZpZXcoKS50b2dnbGUoKVxuICAgICAgJ3N5bWJvbHMtdmlldzpyZXR1cm4tZnJvbS1kZWNsYXJhdGlvbic6ID0+IEBjcmVhdGVHb0JhY2tWaWV3KCkudG9nZ2xlKClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIGlmIEBmaWxlVmlldz9cbiAgICAgIEBmaWxlVmlldy5kZXN0cm95KClcbiAgICAgIEBmaWxlVmlldyA9IG51bGxcblxuICAgIGlmIEBwcm9qZWN0Vmlldz9cbiAgICAgIEBwcm9qZWN0Vmlldy5kZXN0cm95KClcbiAgICAgIEBwcm9qZWN0VmlldyA9IG51bGxcblxuICAgIGlmIEBnb1RvVmlldz9cbiAgICAgIEBnb1RvVmlldy5kZXN0cm95KClcbiAgICAgIEBnb1RvVmlldyA9IG51bGxcblxuICAgIGlmIEBnb0JhY2tWaWV3P1xuICAgICAgQGdvQmFja1ZpZXcuZGVzdHJveSgpXG4gICAgICBAZ29CYWNrVmlldyA9IG51bGxcblxuICAgIGlmIEB3b3Jrc3BhY2VTdWJzY3JpcHRpb24/XG4gICAgICBAd29ya3NwYWNlU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgQHdvcmtzcGFjZVN1YnNjcmlwdGlvbiA9IG51bGxcblxuICAgIGlmIEBlZGl0b3JTdWJzY3JpcHRpb24/XG4gICAgICBAZWRpdG9yU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgICAgQGVkaXRvclN1YnNjcmlwdGlvbiA9IG51bGxcblxuICBjcmVhdGVGaWxlVmlldzogLT5cbiAgICB1bmxlc3MgQGZpbGVWaWV3P1xuICAgICAgRmlsZVZpZXcgID0gcmVxdWlyZSAnLi9maWxlLXZpZXcnXG4gICAgICBAZmlsZVZpZXcgPSBuZXcgRmlsZVZpZXcoQHN0YWNrKVxuICAgIEBmaWxlVmlld1xuXG4gIGNyZWF0ZVByb2plY3RWaWV3OiAtPlxuICAgIHVubGVzcyBAcHJvamVjdFZpZXc/XG4gICAgICBQcm9qZWN0VmlldyAgPSByZXF1aXJlICcuL3Byb2plY3QtdmlldydcbiAgICAgIEBwcm9qZWN0VmlldyA9IG5ldyBQcm9qZWN0VmlldyhAc3RhY2spXG4gICAgQHByb2plY3RWaWV3XG5cbiAgY3JlYXRlR29Ub1ZpZXc6IC0+XG4gICAgdW5sZXNzIEBnb1RvVmlldz9cbiAgICAgIEdvVG9WaWV3ID0gcmVxdWlyZSAnLi9nby10by12aWV3J1xuICAgICAgQGdvVG9WaWV3ID0gbmV3IEdvVG9WaWV3KEBzdGFjaylcbiAgICBAZ29Ub1ZpZXdcblxuICBjcmVhdGVHb0JhY2tWaWV3OiAtPlxuICAgIHVubGVzcyBAZ29CYWNrVmlldz9cbiAgICAgIEdvQmFja1ZpZXcgPSByZXF1aXJlICcuL2dvLWJhY2stdmlldydcbiAgICAgIEBnb0JhY2tWaWV3ID0gbmV3IEdvQmFja1ZpZXcoQHN0YWNrKVxuICAgIEBnb0JhY2tWaWV3XG4iXX0=
