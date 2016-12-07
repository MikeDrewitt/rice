(function() {
  var Disposable, FileIcons, layout;

  Disposable = require('atom').Disposable;

  FileIcons = require('./file-icons');

  layout = require('./layout');

  module.exports = {
    activate: function(state) {
      var TabBarView, _;
      layout.activate();
      this.tabBarViews = [];
      TabBarView = require('./tab-bar-view');
      _ = require('underscore-plus');
      atom.commands.add('atom-workspace', {
        'tabs:close-all-tabs': (function(_this) {
          return function() {
            var i, ref, results, tabBarView;
            ref = _this.tabBarViews;
            results = [];
            for (i = ref.length - 1; i >= 0; i += -1) {
              tabBarView = ref[i];
              results.push(tabBarView.closeAllTabs());
            }
            return results;
          };
        })(this)
      });
      return this.paneSubscription = atom.workspace.observePanes((function(_this) {
        return function(pane) {
          var paneElement, tabBarView;
          tabBarView = new TabBarView;
          tabBarView.initialize(pane);
          paneElement = atom.views.getView(pane);
          paneElement.insertBefore(tabBarView, paneElement.firstChild);
          _this.tabBarViews.push(tabBarView);
          return pane.onDidDestroy(function() {
            return _.remove(_this.tabBarViews, tabBarView);
          });
        };
      })(this));
    },
    deactivate: function() {
      var i, len, ref, ref1, tabBarView;
      layout.deactivate();
      this.paneSubscription.dispose();
      if ((ref = this.fileIconsDisposable) != null) {
        ref.dispose();
      }
      ref1 = this.tabBarViews;
      for (i = 0, len = ref1.length; i < len; i++) {
        tabBarView = ref1[i];
        tabBarView.remove();
      }
    },
    consumeFileIcons: function(service) {
      FileIcons.setService(service);
      this.updateFileIcons();
      return new Disposable((function(_this) {
        return function() {
          FileIcons.resetService();
          return _this.updateFileIcons();
        };
      })(this));
    },
    updateFileIcons: function() {
      var i, len, ref, results, tabBarView, tabView;
      ref = this.tabBarViews;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        tabBarView = ref[i];
        results.push((function() {
          var j, len1, ref1, results1;
          ref1 = tabBarView.getTabs();
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            tabView = ref1[j];
            results1.push(tabView.updateIcon());
          }
          return results1;
        })());
      }
      return results;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy90YWJzL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsYUFBYyxPQUFBLENBQVEsTUFBUjs7RUFDZixTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBQ1osTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLE1BQU0sQ0FBQyxRQUFQLENBQUE7TUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlO01BRWYsVUFBQSxHQUFhLE9BQUEsQ0FBUSxnQkFBUjtNQUNiLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7TUFJSixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQ0U7UUFBQSxxQkFBQSxFQUF1QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO0FBR3JCLGdCQUFBO0FBQUE7QUFBQTtpQkFBQSxtQ0FBQTs7MkJBQ0UsVUFBVSxDQUFDLFlBQVgsQ0FBQTtBQURGOztVQUhxQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkI7T0FERjthQU9BLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQWYsQ0FBNEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLElBQUQ7QUFDOUMsY0FBQTtVQUFBLFVBQUEsR0FBYSxJQUFJO1VBQ2pCLFVBQVUsQ0FBQyxVQUFYLENBQXNCLElBQXRCO1VBRUEsV0FBQSxHQUFjLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFuQjtVQUNkLFdBQVcsQ0FBQyxZQUFaLENBQXlCLFVBQXpCLEVBQXFDLFdBQVcsQ0FBQyxVQUFqRDtVQUVBLEtBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixVQUFsQjtpQkFDQSxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFBO21CQUFHLENBQUMsQ0FBQyxNQUFGLENBQVMsS0FBQyxDQUFBLFdBQVYsRUFBdUIsVUFBdkI7VUFBSCxDQUFsQjtRQVI4QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUI7SUFoQlosQ0FBVjtJQTBCQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxNQUFNLENBQUMsVUFBUCxDQUFBO01BQ0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLE9BQWxCLENBQUE7O1dBQ29CLENBQUUsT0FBdEIsQ0FBQTs7QUFDQTtBQUFBLFdBQUEsc0NBQUE7O1FBQUEsVUFBVSxDQUFDLE1BQVgsQ0FBQTtBQUFBO0lBSlUsQ0ExQlo7SUFpQ0EsZ0JBQUEsRUFBa0IsU0FBQyxPQUFEO01BQ2hCLFNBQVMsQ0FBQyxVQUFWLENBQXFCLE9BQXJCO01BQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTthQUNJLElBQUEsVUFBQSxDQUFXLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNiLFNBQVMsQ0FBQyxZQUFWLENBQUE7aUJBQ0EsS0FBQyxDQUFBLGVBQUQsQ0FBQTtRQUZhO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYO0lBSFksQ0FqQ2xCO0lBd0NBLGVBQUEsRUFBaUIsU0FBQTtBQUNmLFVBQUE7QUFBQTtBQUFBO1dBQUEscUNBQUE7Ozs7QUFDRTtBQUFBO2VBQUEsd0NBQUE7OzBCQUFBLE9BQU8sQ0FBQyxVQUFSLENBQUE7QUFBQTs7O0FBREY7O0lBRGUsQ0F4Q2pCOztBQUxGIiwic291cmNlc0NvbnRlbnQiOlsie0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbkZpbGVJY29ucyA9IHJlcXVpcmUgJy4vZmlsZS1pY29ucydcbmxheW91dCA9IHJlcXVpcmUgJy4vbGF5b3V0J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgbGF5b3V0LmFjdGl2YXRlKClcbiAgICBAdGFiQmFyVmlld3MgPSBbXVxuXG4gICAgVGFiQmFyVmlldyA9IHJlcXVpcmUgJy4vdGFiLWJhci12aWV3J1xuICAgIF8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbiAgICAjIElmIHRoZSBjb21tYW5kIGJ1YmJsZXMgdXAgd2l0aG91dCBiZWluZyBoYW5kbGVkIGJ5IGEgcGFydGljdWxhciBwYW5lLFxuICAgICMgY2xvc2UgYWxsIHRhYnMgaW4gYWxsIHBhbmVzXG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICd0YWJzOmNsb3NlLWFsbC10YWJzJzogPT5cbiAgICAgICAgIyBXZSBsb29wIGJhY2t3YXJkcyBiZWNhdXNlIHRoZSBwYW5lcyBhcmVcbiAgICAgICAgIyByZW1vdmVkIGZyb20gdGhlIGFycmF5IGFzIHdlIGdvXG4gICAgICAgIGZvciB0YWJCYXJWaWV3IGluIEB0YWJCYXJWaWV3cyBieSAtMVxuICAgICAgICAgIHRhYkJhclZpZXcuY2xvc2VBbGxUYWJzKClcblxuICAgIEBwYW5lU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVBhbmVzIChwYW5lKSA9PlxuICAgICAgdGFiQmFyVmlldyA9IG5ldyBUYWJCYXJWaWV3XG4gICAgICB0YWJCYXJWaWV3LmluaXRpYWxpemUocGFuZSlcblxuICAgICAgcGFuZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcocGFuZSlcbiAgICAgIHBhbmVFbGVtZW50Lmluc2VydEJlZm9yZSh0YWJCYXJWaWV3LCBwYW5lRWxlbWVudC5maXJzdENoaWxkKVxuXG4gICAgICBAdGFiQmFyVmlld3MucHVzaCh0YWJCYXJWaWV3KVxuICAgICAgcGFuZS5vbkRpZERlc3Ryb3kgPT4gXy5yZW1vdmUoQHRhYkJhclZpZXdzLCB0YWJCYXJWaWV3KVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgbGF5b3V0LmRlYWN0aXZhdGUoKVxuICAgIEBwYW5lU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKVxuICAgIEBmaWxlSWNvbnNEaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICB0YWJCYXJWaWV3LnJlbW92ZSgpIGZvciB0YWJCYXJWaWV3IGluIEB0YWJCYXJWaWV3c1xuICAgIHJldHVyblxuXG4gIGNvbnN1bWVGaWxlSWNvbnM6IChzZXJ2aWNlKSAtPlxuICAgIEZpbGVJY29ucy5zZXRTZXJ2aWNlKHNlcnZpY2UpXG4gICAgQHVwZGF0ZUZpbGVJY29ucygpXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEZpbGVJY29ucy5yZXNldFNlcnZpY2UoKVxuICAgICAgQHVwZGF0ZUZpbGVJY29ucygpXG5cbiAgdXBkYXRlRmlsZUljb25zOiAtPlxuICAgIGZvciB0YWJCYXJWaWV3IGluIEB0YWJCYXJWaWV3c1xuICAgICAgdGFiVmlldy51cGRhdGVJY29uKCkgZm9yIHRhYlZpZXcgaW4gdGFiQmFyVmlldy5nZXRUYWJzKClcbiJdfQ==
