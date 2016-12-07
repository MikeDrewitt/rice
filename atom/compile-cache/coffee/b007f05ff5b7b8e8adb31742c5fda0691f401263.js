(function() {
  var CompositeDisposable, ConsentUri, ConsentView, GuideUri, GuideView, Reporter, WelcomeUri, WelcomeView, createConsentView, createGuideView, createWelcomeView;

  CompositeDisposable = require('atom').CompositeDisposable;

  Reporter = null;

  WelcomeView = null;

  GuideView = null;

  ConsentView = null;

  WelcomeUri = 'atom://welcome/welcome';

  GuideUri = 'atom://welcome/guide';

  ConsentUri = 'atom://welcome/consent';

  createWelcomeView = function(state) {
    if (WelcomeView == null) {
      WelcomeView = require('./welcome-view');
    }
    return new WelcomeView(state);
  };

  createGuideView = function(state) {
    if (GuideView == null) {
      GuideView = require('./guide-view');
    }
    return new GuideView(state);
  };

  createConsentView = function(state) {
    if (ConsentView == null) {
      ConsentView = require('./consent-view');
    }
    return new ConsentView(state);
  };

  module.exports = {
    activate: function() {
      this.subscriptions = new CompositeDisposable;
      return process.nextTick((function(_this) {
        return function() {
          _this.subscriptions.add(atom.deserializers.add({
            name: 'WelcomeView',
            deserialize: function(state) {
              return createWelcomeView(state);
            }
          }));
          _this.subscriptions.add(atom.deserializers.add({
            name: 'GuideView',
            deserialize: function(state) {
              return createGuideView(state);
            }
          }));
          _this.subscriptions.add(atom.deserializers.add({
            name: 'ConsentView',
            deserialize: function(state) {
              return createConsentView(state);
            }
          }));
          _this.subscriptions.add(atom.workspace.addOpener(function(filePath) {
            if (filePath === WelcomeUri) {
              return createWelcomeView({
                uri: WelcomeUri
              });
            }
          }));
          _this.subscriptions.add(atom.workspace.addOpener(function(filePath) {
            if (filePath === GuideUri) {
              return createGuideView({
                uri: GuideUri
              });
            }
          }));
          _this.subscriptions.add(atom.workspace.addOpener(function(filePath) {
            if (filePath === ConsentUri) {
              return createConsentView({
                uri: ConsentUri
              });
            }
          }));
          _this.subscriptions.add(atom.commands.add('atom-workspace', 'welcome:show', function() {
            return _this.show();
          }));
          if (atom.config.get('core.telemetryConsent') === 'undecided') {
            atom.workspace.open(ConsentUri);
          }
          if (atom.config.get('welcome.showOnStartup')) {
            _this.show();
            if (Reporter == null) {
              Reporter = require('./reporter');
            }
            return Reporter.sendEvent('show-on-initial-load');
          }
        };
      })(this));
    },
    show: function() {
      atom.workspace.open(WelcomeUri);
      return atom.workspace.open(GuideUri, {
        split: 'right'
      });
    },
    consumeReporter: function(reporter) {
      if (Reporter == null) {
        Reporter = require('./reporter');
      }
      return Reporter.setReporter(reporter);
    },
    deactivate: function() {
      return this.subscriptions.dispose();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93ZWxjb21lL2xpYi93ZWxjb21lLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixRQUFBLEdBQVc7O0VBQ1gsV0FBQSxHQUFjOztFQUNkLFNBQUEsR0FBWTs7RUFDWixXQUFBLEdBQWM7O0VBRWQsVUFBQSxHQUFhOztFQUNiLFFBQUEsR0FBVzs7RUFDWCxVQUFBLEdBQWE7O0VBRWIsaUJBQUEsR0FBb0IsU0FBQyxLQUFEOztNQUNsQixjQUFlLE9BQUEsQ0FBUSxnQkFBUjs7V0FDWCxJQUFBLFdBQUEsQ0FBWSxLQUFaO0VBRmM7O0VBSXBCLGVBQUEsR0FBa0IsU0FBQyxLQUFEOztNQUNoQixZQUFhLE9BQUEsQ0FBUSxjQUFSOztXQUNULElBQUEsU0FBQSxDQUFVLEtBQVY7RUFGWTs7RUFJbEIsaUJBQUEsR0FBb0IsU0FBQyxLQUFEOztNQUNsQixjQUFlLE9BQUEsQ0FBUSxnQkFBUjs7V0FDWCxJQUFBLFdBQUEsQ0FBWSxLQUFaO0VBRmM7O0VBSXBCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7YUFFckIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ2YsS0FBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FDakI7WUFBQSxJQUFBLEVBQU0sYUFBTjtZQUNBLFdBQUEsRUFBYSxTQUFDLEtBQUQ7cUJBQVcsaUJBQUEsQ0FBa0IsS0FBbEI7WUFBWCxDQURiO1dBRGlCLENBQW5CO1VBSUEsS0FBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBbkIsQ0FDakI7WUFBQSxJQUFBLEVBQU0sV0FBTjtZQUNBLFdBQUEsRUFBYSxTQUFDLEtBQUQ7cUJBQVcsZUFBQSxDQUFnQixLQUFoQjtZQUFYLENBRGI7V0FEaUIsQ0FBbkI7VUFJQSxLQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFuQixDQUNqQjtZQUFBLElBQUEsRUFBTSxhQUFOO1lBQ0EsV0FBQSxFQUFhLFNBQUMsS0FBRDtxQkFBVyxpQkFBQSxDQUFrQixLQUFsQjtZQUFYLENBRGI7V0FEaUIsQ0FBbkI7VUFJQSxLQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLFNBQUMsUUFBRDtZQUMxQyxJQUFzQyxRQUFBLEtBQVksVUFBbEQ7cUJBQUEsaUJBQUEsQ0FBa0I7Z0JBQUEsR0FBQSxFQUFLLFVBQUw7ZUFBbEIsRUFBQTs7VUFEMEMsQ0FBekIsQ0FBbkI7VUFFQSxLQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFmLENBQXlCLFNBQUMsUUFBRDtZQUMxQyxJQUFrQyxRQUFBLEtBQVksUUFBOUM7cUJBQUEsZUFBQSxDQUFnQjtnQkFBQSxHQUFBLEVBQUssUUFBTDtlQUFoQixFQUFBOztVQUQwQyxDQUF6QixDQUFuQjtVQUVBLEtBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQWYsQ0FBeUIsU0FBQyxRQUFEO1lBQzFDLElBQXNDLFFBQUEsS0FBWSxVQUFsRDtxQkFBQSxpQkFBQSxDQUFrQjtnQkFBQSxHQUFBLEVBQUssVUFBTDtlQUFsQixFQUFBOztVQUQwQyxDQUF6QixDQUFuQjtVQUVBLEtBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGNBQXBDLEVBQW9ELFNBQUE7bUJBQUcsS0FBQyxDQUFBLElBQUQsQ0FBQTtVQUFILENBQXBELENBQW5CO1VBRUEsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUJBQWhCLENBQUEsS0FBNEMsV0FBL0M7WUFDRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsVUFBcEIsRUFERjs7VUFHQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix1QkFBaEIsQ0FBSDtZQUNFLEtBQUMsQ0FBQSxJQUFELENBQUE7O2NBQ0EsV0FBWSxPQUFBLENBQVEsWUFBUjs7bUJBQ1osUUFBUSxDQUFDLFNBQVQsQ0FBbUIsc0JBQW5CLEVBSEY7O1FBeEJlO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQjtJQUhRLENBQVY7SUFnQ0EsSUFBQSxFQUFNLFNBQUE7TUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsVUFBcEI7YUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsUUFBcEIsRUFBOEI7UUFBQSxLQUFBLEVBQU8sT0FBUDtPQUE5QjtJQUZJLENBaENOO0lBb0NBLGVBQUEsRUFBaUIsU0FBQyxRQUFEOztRQUNmLFdBQVksT0FBQSxDQUFRLFlBQVI7O2FBQ1osUUFBUSxDQUFDLFdBQVQsQ0FBcUIsUUFBckI7SUFGZSxDQXBDakI7SUF3Q0EsVUFBQSxFQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQURVLENBeENaOztBQXZCRiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5SZXBvcnRlciA9IG51bGxcbldlbGNvbWVWaWV3ID0gbnVsbFxuR3VpZGVWaWV3ID0gbnVsbFxuQ29uc2VudFZpZXcgPSBudWxsXG5cbldlbGNvbWVVcmkgPSAnYXRvbTovL3dlbGNvbWUvd2VsY29tZSdcbkd1aWRlVXJpID0gJ2F0b206Ly93ZWxjb21lL2d1aWRlJ1xuQ29uc2VudFVyaSA9ICdhdG9tOi8vd2VsY29tZS9jb25zZW50J1xuXG5jcmVhdGVXZWxjb21lVmlldyA9IChzdGF0ZSkgLT5cbiAgV2VsY29tZVZpZXcgPz0gcmVxdWlyZSAnLi93ZWxjb21lLXZpZXcnXG4gIG5ldyBXZWxjb21lVmlldyhzdGF0ZSlcblxuY3JlYXRlR3VpZGVWaWV3ID0gKHN0YXRlKSAtPlxuICBHdWlkZVZpZXcgPz0gcmVxdWlyZSAnLi9ndWlkZS12aWV3J1xuICBuZXcgR3VpZGVWaWV3KHN0YXRlKVxuXG5jcmVhdGVDb25zZW50VmlldyA9IChzdGF0ZSkgLT5cbiAgQ29uc2VudFZpZXcgPz0gcmVxdWlyZSAnLi9jb25zZW50LXZpZXcnXG4gIG5ldyBDb25zZW50VmlldyhzdGF0ZSlcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZFxuICAgICAgICBuYW1lOiAnV2VsY29tZVZpZXcnXG4gICAgICAgIGRlc2VyaWFsaXplOiAoc3RhdGUpIC0+IGNyZWF0ZVdlbGNvbWVWaWV3KHN0YXRlKVxuXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZFxuICAgICAgICBuYW1lOiAnR3VpZGVWaWV3J1xuICAgICAgICBkZXNlcmlhbGl6ZTogKHN0YXRlKSAtPiBjcmVhdGVHdWlkZVZpZXcoc3RhdGUpXG5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmRlc2VyaWFsaXplcnMuYWRkXG4gICAgICAgIG5hbWU6ICdDb25zZW50VmlldydcbiAgICAgICAgZGVzZXJpYWxpemU6IChzdGF0ZSkgLT4gY3JlYXRlQ29uc2VudFZpZXcoc3RhdGUpXG5cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKGZpbGVQYXRoKSAtPlxuICAgICAgICBjcmVhdGVXZWxjb21lVmlldyh1cmk6IFdlbGNvbWVVcmkpIGlmIGZpbGVQYXRoIGlzIFdlbGNvbWVVcmlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKGZpbGVQYXRoKSAtPlxuICAgICAgICBjcmVhdGVHdWlkZVZpZXcodXJpOiBHdWlkZVVyaSkgaWYgZmlsZVBhdGggaXMgR3VpZGVVcmlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKGZpbGVQYXRoKSAtPlxuICAgICAgICBjcmVhdGVDb25zZW50Vmlldyh1cmk6IENvbnNlbnRVcmkpIGlmIGZpbGVQYXRoIGlzIENvbnNlbnRVcmlcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnd2VsY29tZTpzaG93JywgPT4gQHNob3coKVxuXG4gICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ2NvcmUudGVsZW1ldHJ5Q29uc2VudCcpIGlzICd1bmRlY2lkZWQnXG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oQ29uc2VudFVyaSlcblxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCd3ZWxjb21lLnNob3dPblN0YXJ0dXAnKVxuICAgICAgICBAc2hvdygpXG4gICAgICAgIFJlcG9ydGVyID89IHJlcXVpcmUgJy4vcmVwb3J0ZXInXG4gICAgICAgIFJlcG9ydGVyLnNlbmRFdmVudCgnc2hvdy1vbi1pbml0aWFsLWxvYWQnKVxuXG4gIHNob3c6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihXZWxjb21lVXJpKVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oR3VpZGVVcmksIHNwbGl0OiAncmlnaHQnKVxuXG4gIGNvbnN1bWVSZXBvcnRlcjogKHJlcG9ydGVyKSAtPlxuICAgIFJlcG9ydGVyID89IHJlcXVpcmUgJy4vcmVwb3J0ZXInXG4gICAgUmVwb3J0ZXIuc2V0UmVwb3J0ZXIocmVwb3J0ZXIpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiJdfQ==
