(function() {
  var CompositeDisposable, Notification, Notifications, StackTraceParser, fs, isCoreOrPackageStackTrace, ref;

  ref = require('atom'), Notification = ref.Notification, CompositeDisposable = ref.CompositeDisposable;

  fs = require('fs-plus');

  StackTraceParser = null;

  Notifications = {
    isInitialized: false,
    subscriptions: null,
    duplicateTimeDelay: 500,
    lastNotification: null,
    activate: function(state) {
      var CommandLogger, i, len, notification, ref1;
      CommandLogger = require('./command-logger');
      CommandLogger.start();
      this.subscriptions = new CompositeDisposable;
      ref1 = atom.notifications.getNotifications();
      for (i = 0, len = ref1.length; i < len; i++) {
        notification = ref1[i];
        this.addNotificationView(notification);
      }
      this.subscriptions.add(atom.notifications.onDidAddNotification((function(_this) {
        return function(notification) {
          return _this.addNotificationView(notification);
        };
      })(this)));
      this.subscriptions.add(atom.onWillThrowError(function(arg) {
        var line, match, message, options, originalError, preventDefault, url;
        message = arg.message, url = arg.url, line = arg.line, originalError = arg.originalError, preventDefault = arg.preventDefault;
        if (originalError.name === 'BufferedProcessError') {
          message = message.replace('Uncaught BufferedProcessError: ', '');
          return atom.notifications.addError(message, {
            dismissable: true
          });
        } else if (originalError.code === 'ENOENT' && !/\/atom/i.test(message) && (match = /spawn (.+) ENOENT/.exec(message))) {
          message = "'" + match[1] + "' could not be spawned.\nIs it installed and on your path?\nIf so please open an issue on the package spawning the process.";
          return atom.notifications.addError(message, {
            dismissable: true
          });
        } else if (!atom.inDevMode() || atom.config.get('notifications.showErrorsInDevMode')) {
          preventDefault();
          if (originalError.stack && !isCoreOrPackageStackTrace(originalError.stack)) {
            return;
          }
          options = {
            detail: url + ":" + line,
            stack: originalError.stack,
            dismissable: true
          };
          return atom.notifications.addFatalError(message, options);
        }
      }));
      return this.subscriptions.add(atom.commands.add('atom-workspace', 'core:cancel', function() {
        var j, len1, ref2, results;
        ref2 = atom.notifications.getNotifications();
        results = [];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          notification = ref2[j];
          results.push(notification.dismiss());
        }
        return results;
      }));
    },
    deactivate: function() {
      var ref1, ref2;
      this.subscriptions.dispose();
      if ((ref1 = this.notificationsElement) != null) {
        ref1.remove();
      }
      if ((ref2 = this.notificationsPanel) != null) {
        ref2.destroy();
      }
      this.subscriptions = null;
      this.notificationsElement = null;
      this.notificationsPanel = null;
      return this.isInitialized = false;
    },
    initializeIfNotInitialized: function() {
      var NotificationElement, NotificationsElement;
      if (this.isInitialized) {
        return;
      }
      NotificationsElement = require('./notifications-element');
      NotificationElement = require('./notification-element');
      this.subscriptions.add(atom.views.addViewProvider(Notification, function(model) {
        return new NotificationElement().initialize(model);
      }));
      this.notificationsElement = new NotificationsElement;
      atom.views.getView(atom.workspace).appendChild(this.notificationsElement);
      return this.isInitialized = true;
    },
    togglePanel: function() {
      var NotificationsPanelView;
      if (this.notificationsPanel != null) {
        if (Notifications.notificationsPanel.isVisible()) {
          return Notifications.notificationsPanel.hide();
        } else {
          return Notifications.notificationsPanel.show();
        }
      } else {
        NotificationsPanelView = require('./notifications-panel-view');
        Notifications.notificationsPanelView = new NotificationsPanelView;
        return Notifications.notificationsPanel = atom.workspace.addBottomPanel({
          item: Notifications.notificationsPanelView.getElement()
        });
      }
    },
    addNotificationView: function(notification) {
      var timeSpan;
      if (notification == null) {
        return;
      }
      this.initializeIfNotInitialized();
      if (notification.wasDisplayed()) {
        return;
      }
      if (this.lastNotification != null) {
        timeSpan = notification.getTimestamp() - this.lastNotification.getTimestamp();
        if (!(timeSpan < this.duplicateTimeDelay && notification.isEqual(this.lastNotification))) {
          this.notificationsElement.appendChild(atom.views.getView(notification));
        }
      } else {
        this.notificationsElement.appendChild(atom.views.getView(notification));
      }
      notification.setDisplayed(true);
      return this.lastNotification = notification;
    }
  };

  isCoreOrPackageStackTrace = function(stack) {
    var file, i, len, ref1;
    if (StackTraceParser == null) {
      StackTraceParser = require('stacktrace-parser');
    }
    ref1 = StackTraceParser.parse(stack);
    for (i = 0, len = ref1.length; i < len; i++) {
      file = ref1[i].file;
      if (fs.isAbsolute(file)) {
        return true;
      }
    }
    return false;
  };

  if (atom.inDevMode()) {
    atom.commands.add('atom-workspace', 'notifications:toggle-dev-panel', function() {
      return Notifications.togglePanel();
    });
    atom.commands.add('atom-workspace', 'notifications:trigger-error', function() {
      var error, options;
      try {
        return abc + 2;
      } catch (error1) {
        error = error1;
        options = {
          detail: error.stack.split('\n')[1],
          stack: error.stack,
          dismissable: true
        };
        return atom.notifications.addFatalError("Uncaught " + (error.stack.split('\n')[0]), options);
      }
    });
  }

  module.exports = Notifications;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBc0MsT0FBQSxDQUFRLE1BQVIsQ0FBdEMsRUFBQywrQkFBRCxFQUFlOztFQUNmLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxnQkFBQSxHQUFtQjs7RUFFbkIsYUFBQSxHQUNFO0lBQUEsYUFBQSxFQUFlLEtBQWY7SUFDQSxhQUFBLEVBQWUsSUFEZjtJQUVBLGtCQUFBLEVBQW9CLEdBRnBCO0lBR0EsZ0JBQUEsRUFBa0IsSUFIbEI7SUFLQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1IsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSO01BQ2hCLGFBQWEsQ0FBQyxLQUFkLENBQUE7TUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO0FBRXJCO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsWUFBckI7QUFBQTtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFuQixDQUF3QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsWUFBRDtpQkFBa0IsS0FBQyxDQUFBLG1CQUFELENBQXFCLFlBQXJCO1FBQWxCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QyxDQUFuQjtNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsZ0JBQUwsQ0FBc0IsU0FBQyxHQUFEO0FBQ3ZDLFlBQUE7UUFEeUMsdUJBQVMsZUFBSyxpQkFBTSxtQ0FBZTtRQUM1RSxJQUFHLGFBQWEsQ0FBQyxJQUFkLEtBQXNCLHNC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QUEsR0FBNEIsU0FBQyxLQUFEO0FBQzFCLFFBQUE7O01BQUEsbUJBQW9CLE9BQUEsQ0FBUSxtQkFBUjs7QUFDcEI7QUFBQSxTQUFBLHNDQUFBO01BQUs7TUFDSCxJQUFlLEVBQUUsQ0FBQyxVQUFILENBQWMsSUFBZCxDQUFmO0FBQUEsZUFBTyxLQUFQOztBQURGO1dBRUE7RUFKMEI7O0VBTTVCLElBQUcsSUFBSSxDQUFDLFNBQUwsQ0FBQSxDQUFIO0lBQ0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxnQ0FBcEMsRUFBc0UsU0FBQTthQUFHLGFBQWEsQ0FBQyxXQUFkLENBQUE7SUFBSCxDQUF0RTtJQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsNkJBQXBDLEVBQW1FLFNBQUE7QUFDakUsVUFBQTtBQUFBO2VBQ0UsR0FBQSxHQUFNLEVBRFI7T0FBQSxjQUFBO1FBRU07UUFDSixPQUFBLEdBQ0U7VUFBQSxNQUFBLEVBQVEsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFaLENBQWtCLElBQWxCLENBQXdCLENBQUEsQ0FBQSxDQUFoQztVQUNBLEtBQUEsRUFBTyxLQUFLLENBQUMsS0FEYjtVQUVBLFdBQUEsRUFBYSxJQUZiOztlQUdGLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBbkIsQ0FBaUMsV0FBQSxHQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFaLENBQWtCLElBQWxCLENBQXdCLENBQUEsQ0FBQSxDQUF6QixDQUE1QyxFQUEyRSxPQUEzRSxFQVBGOztJQURpRSxDQUFuRSxFQUZGOzs7RUFZQSxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXJIakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Tm90aWZpY2F0aW9uLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5TdGFja1RyYWNlUGFyc2VyID0gbnVsbFxuXG5Ob3RpZmljYXRpb25zID1cbiAgaXNJbml0aWFsaXplZDogZmFsc2VcbiAgc3Vic2NyaXB0aW9uczogbnVsbFxuICBkdXBsaWNhdGVUaW1lRGVsYXk6IDUwMFxuICBsYXN0Tm90aWZpY2F0aW9uOiBudWxsXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBDb21tYW5kTG9nZ2VyID0gcmVxdWlyZSAnLi9jb21tYW5kLWxvZ2dlcidcbiAgICBDb21tYW5kTG9nZ2VyLnN0YXJ0KClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBAYWRkTm90aWZpY2F0aW9uVmlldyhub3RpZmljYXRpb24pIGZvciBub3RpZmljYXRpb24gaW4gYXRvbS5ub3RpZmljYXRpb25zLmdldE5vdGlmaWNhdGlvbnMoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLm5vdGlmaWNhdGlvbnMub25EaWRBZGROb3RpZmljYXRpb24gKG5vdGlmaWNhdGlvbikgPT4gQGFkZE5vdGlmaWNhdGlvblZpZXcobm90aWZpY2F0aW9uKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ub25XaWxsVGhyb3dFcnJvciAoe21lc3NhZ2UsIHVybCwgbGluZSwgb3JpZ2luYWxFcnJvciwgcHJldmVudERlZmF1bHR9KSAtPlxuICAgICAgaWYgb3JpZ2luYWxFcnJvci5uYW1lIGlzICdCdWZmZXJlZFByb2Nlc3NFcnJvcidcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgnVW5jYXVnaHQgQnVmZmVyZWRQcm9jZXNzRXJyb3I6ICcsICcnKVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSwgZGlzbWlzc2FibGU6IHRydWUpXG5cbiAgICAgIGVsc2UgaWYgb3JpZ2luYWxFcnJvci5jb2RlIGlzICdFTk9FTlQnIGFuZCBub3QgL1xcL2F0b20vaS50ZXN0KG1lc3NhZ2UpIGFuZCBtYXRjaCA9IC9zcGF3biAoLispIEVOT0VOVC8uZXhlYyhtZXNzYWdlKVxuICAgICAgICBtZXNzYWdlID0gXCJcIlwiXG4gICAgICAgICAgJyN7bWF0Y2hbMV19JyBjb3VsZCBub3QgYmUgc3Bhd25lZC5cbiAgICAgICAgICBJcyBpdCBpbnN0YWxsZWQgYW5kIG9uIHlvdXIgcGF0aD9cbiAgICAgICAgICBJZiBzbyBwbGVhc2Ugb3BlbiBhbiBpc3N1ZSBvbiB0aGUgcGFja2FnZSBzcGF3bmluZyB0aGUgcHJvY2Vzcy5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCBkaXNtaXNzYWJsZTogdHJ1ZSlcblxuICAgICAgZWxzZSBpZiBub3QgYXRvbS5pbkRldk1vZGUoKSBvciBhdG9tLmNvbmZpZy5nZXQoJ25vdGlmaWNhdGlvbnMuc2hvd0Vycm9yc0luRGV2TW9kZScpXG4gICAgICAgIHByZXZlbnREZWZhdWx0KClcblxuICAgICAgICAjIElnbm9yZSBlcnJvcnMgd2l0aCBubyBwYXRocyBpbiB0aGVtIHNpbmNlIHRoZXkgYXJlIGltcG9zc2libGUgdG8gdHJhY2VcbiAgICAgICAgaWYgb3JpZ2luYWxFcnJvci5zdGFjayBhbmQgbm90IGlzQ29yZU9yUGFja2FnZVN0YWNrVHJhY2Uob3JpZ2luYWxFcnJvci5zdGFjaylcbiAgICAgICAgICByZXR1cm5cblxuICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICBkZXRhaWw6IFwiI3t1cmx9OiN7bGluZX1cIlxuICAgICAgICAgIHN0YWNrOiBvcmlnaW5hbEVycm9yLnN0YWNrXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEZhdGFsRXJyb3IobWVzc2FnZSwgb3B0aW9ucylcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnY29yZTpjYW5jZWwnLCAtPlxuICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKSBmb3Igbm90aWZpY2F0aW9uIGluIGF0b20ubm90aWZpY2F0aW9ucy5nZXROb3RpZmljYXRpb25zKClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBub3RpZmljYXRpb25zRWxlbWVudD8ucmVtb3ZlKClcbiAgICBAbm90aWZpY2F0aW9uc1BhbmVsPy5kZXN0cm95KClcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIEBub3RpZmljYXRpb25zRWxlbWVudCA9IG51bGxcbiAgICBAbm90aWZpY2F0aW9uc1BhbmVsID0gbnVsbFxuXG4gICAgQGlzSW5pdGlhbGl6ZWQgPSBmYWxzZVxuXG4gIGluaXRpYWxpemVJZk5vdEluaXRpYWxpemVkOiAtPlxuICAgIHJldHVybiBpZiBAaXNJbml0aWFsaXplZFxuXG4gICAgTm90aWZpY2F0aW9uc0VsZW1lbnQgPSByZXF1aXJlICcuL25vdGlmaWNhdGlvbnMtZWxlbWVudCdcbiAgICBOb3RpZmljYXRpb25FbGVtZW50ID0gcmVxdWlyZSAnLi9ub3RpZmljYXRpb24tZWxlbWVudCdcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnZpZXdzLmFkZFZpZXdQcm92aWRlciBOb3RpZmljYXRpb24sIChtb2RlbCkgLT5cbiAgICAgIG5ldyBOb3RpZmljYXRpb25FbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbClcblxuICAgIEBub3RpZmljYXRpb25zRWxlbWVudCA9IG5ldyBOb3RpZmljYXRpb25zRWxlbWVudFxuICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkuYXBwZW5kQ2hpbGQoQG5vdGlmaWNhdGlvbnNFbGVtZW50KVxuXG4gICAgQGlzSW5pdGlhbGl6ZWQgPSB0cnVlXG5cbiAgdG9nZ2xlUGFuZWw6IC0+XG4gICAgaWYgQG5vdGlmaWNhdGlvbnNQYW5lbD9cbiAgICAgIGlmIE5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1BhbmVsLmlzVmlzaWJsZSgpXG4gICAgICAgIE5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc1BhbmVsLmhpZGUoKVxuICAgICAgZWxzZVxuICAgICAgICBOb3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNQYW5lbC5zaG93KClcbiAgICBlbHNlXG4gICAgICBOb3RpZmljYXRpb25zUGFuZWxWaWV3ID0gcmVxdWlyZSAnLi9ub3RpZmljYXRpb25zLXBhbmVsLXZpZXcnXG4gICAgICBOb3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNQYW5lbFZpZXcgPSBuZXcgTm90aWZpY2F0aW9uc1BhbmVsVmlld1xuICAgICAgTm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbChpdGVtOiBOb3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNQYW5lbFZpZXcuZ2V0RWxlbWVudCgpKVxuXG4gIGFkZE5vdGlmaWNhdGlvblZpZXc6IChub3RpZmljYXRpb24pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBub3RpZmljYXRpb24/XG4gICAgQGluaXRpYWxpemVJZk5vdEluaXRpYWxpemVkKClcbiAgICByZXR1cm4gaWYgbm90aWZpY2F0aW9uLndhc0Rpc3BsYXllZCgpXG5cbiAgICBpZiBAbGFzdE5vdGlmaWNhdGlvbj9cbiAgICAgICMgZG8gbm90IHNob3cgZHVwbGljYXRlcyB1bmxlc3Mgc29tZSBhbW91bnQgb2YgdGltZSBoYXMgcGFzc2VkXG4gICAgICB0aW1lU3BhbiA9IG5vdGlmaWNhdGlvbi5nZXRUaW1lc3RhbXAoKSAtIEBsYXN0Tm90aWZpY2F0aW9uLmdldFRpbWVzdGFtcCgpXG4gICAgICB1bmxlc3MgdGltZVNwYW4gPCBAZHVwbGljYXRlVGltZURlbGF5IGFuZCBub3RpZmljYXRpb24uaXNFcXVhbChAbGFzdE5vdGlmaWNhdGlvbilcbiAgICAgICAgQG5vdGlmaWNhdGlvbnNFbGVtZW50LmFwcGVuZENoaWxkKGF0b20udmlld3MuZ2V0Vmlldyhub3RpZmljYXRpb24pKVxuICAgIGVsc2VcbiAgICAgIEBub3RpZmljYXRpb25zRWxlbWVudC5hcHBlbmRDaGlsZChhdG9tLnZpZXdzLmdldFZpZXcobm90aWZpY2F0aW9uKSlcblxuICAgIG5vdGlmaWNhdGlvbi5zZXREaXNwbGF5ZWQodHJ1ZSlcbiAgICBAbGFzdE5vdGlmaWNhdGlvbiA9IG5vdGlmaWNhdGlvblxuXG5pc0NvcmVPclBhY2thZ2VTdGFja1RyYWNlID0gKHN0YWNrKSAtPlxuICBTdGFja1RyYWNlUGFyc2VyID89IHJlcXVpcmUgJ3N0YWNrdHJhY2UtcGFyc2VyJ1xuICBmb3Ige2ZpbGV9IGluIFN0YWNrVHJhY2VQYXJzZXIucGFyc2Uoc3RhY2spXG4gICAgcmV0dXJuIHRydWUgaWYgZnMuaXNBYnNvbHV0ZShmaWxlKVxuICBmYWxzZVxuXG5pZiBhdG9tLmluRGV2TW9kZSgpXG4gIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdub3RpZmljYXRpb25zOnRvZ2dsZS1kZXYtcGFuZWwnLCAtPiBOb3RpZmljYXRpb25zLnRvZ2dsZVBhbmVsKClcbiAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ25vdGlmaWNhdGlvbnM6dHJpZ2dlci1lcnJvcicsIC0+XG4gICAgdHJ5XG4gICAgICBhYmMgKyAyICMgbm9wZVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBvcHRpb25zID1cbiAgICAgICAgZGV0YWlsOiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJylbMV1cbiAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRmF0YWxFcnJvcihcIlVuY2F1Z2h0ICN7ZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpWzBdfVwiLCBvcHRpb25zKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvbnNcbiJdfQ==
