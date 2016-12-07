(function() {
  var ButtonListTemplate, ButtonTemplate, FatalMetaNotificationTemplate, MetaNotificationTemplate, NotificationElement, NotificationIssue, NotificationTemplate, TemplateHelper, UserUtilities, addSplitLinesToContainer, fs, marked, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs-plus');

  path = require('path');

  marked = require('marked');

  NotificationIssue = require('./notification-issue');

  TemplateHelper = require('./template-helper');

  UserUtilities = require('./user-utilities');

  NotificationTemplate = "<div class=\"content\">\n  <div class=\"message item\"></div>\n  <div class=\"detail item\">\n    <div class=\"detail-content\"></div>\n    <a href=\"#\" class=\"stack-toggle\"></a>\n    <div class=\"stack-container\"></div>\n  </div>\n  <div class=\"meta item\"></div>\n</div>\n<div class=\"close icon icon-x\"></div>\n<div class=\"close-all btn btn-error\">Close All</div>";

  FatalMetaNotificationTemplate = "<div class=\"description fatal-notification\"></div>\n<div class=\"btn-toolbar\">\n  <a href=\"#\" class=\"btn-issue btn btn-error\"></a>\n  <a href=\"#\" class=\"btn-copy-report icon icon-clippy\" title=\"Copy error report to clipboard\"></a>\n</div>";

  MetaNotificationTemplate = "<div class=\"description\"></div>";

  ButtonListTemplate = "<div class=\"btn-toolbar\"></div>";

  ButtonTemplate = "<a href=\"#\" class=\"btn\"></a>";

  NotificationElement = (function(superClass) {
    extend(NotificationElement, superClass);

    NotificationElement.prototype.animationDuration = 360;

    NotificationElement.prototype.visibilityDuration = 5000;

    NotificationElement.prototype.fatalTemplate = TemplateHelper.create(FatalMetaNotificationTemplate);

    NotificationElement.prototype.metaTemplate = TemplateHelper.create(MetaNotificationTemplate);

    NotificationElement.prototype.buttonListTemplate = TemplateHelper.create(ButtonListTemplate);

    NotificationElement.prototype.buttonTemplate = TemplateHelper.create(ButtonTemplate);

    function NotificationElement() {}

    NotificationElement.prototype.initialize = function(model) {
      this.model = model;
      if (this.model.getType() === 'fatal') {
        this.issue = new NotificationIssue(this.model);
      }
      this.renderPromise = this.render()["catch"](function(e) {
        console.error(e.message);
        return console.error(e.stack);
      });
      if (this.model.isDismissable()) {
        this.model.onDidDismiss((function(_this) {
          return function() {
            return _this.removeNotification();
          };
        })(this));
      } else {
        this.autohide();
      }
      return this;
    };

    NotificationElement.prototype.getModel = function() {
      return this.model;
    };

    NotificationElement.prototype.getRenderPromise = function() {
      return this.renderPromise;
    };

    NotificationElement.prototype.render = function() {
      var buttonClass, closeAllButton, closeButton, description, detail, metaContainer, metaContent, notificationContainer, options, stack, stackContainer, stackToggle, toolbar;
      this.classList.add("" + (this.model.getType()));
      this.classList.add("icon", "icon-" + (this.model.getIcon()), "native-key-bindings");
      if (detail = this.model.getDetail()) {
        this.classList.add('has-detail');
      }
      if (this.model.isDismissable()) {
        this.classList.add('has-close');
      }
      if (this.model.getOptions().stack != null) {
        this.classList.add('has-stack');
      }
      this.setAttribute('tabindex', '-1');
      this.innerHTML = NotificationTemplate;
      options = this.model.getOptions();
      notificationContainer = this.querySelector('.message');
      notificationContainer.innerHTML = marked(this.model.getMessage());
      if (detail = this.model.getDetail()) {
        addSplitLinesToContainer(this.querySelector('.detail-content'), detail);
        if (stack = options.stack) {
          stackToggle = this.querySelector('.stack-toggle');
          stackContainer = this.querySelector('.stack-container');
          addSplitLinesToContainer(stackContainer, stack);
          stackToggle.addEventListener('click', (function(_this) {
            return function(e) {
              return _this.handleStackTraceToggleClick(e, stackContainer);
            };
          })(this));
          this.handleStackTraceToggleClick({
            currentTarget: stackToggle
          }, stackContainer);
        }
      }
      if (metaContent = options.description) {
        this.classList.add('has-description');
        metaContainer = this.querySelector('.meta');
        metaContainer.appendChild(TemplateHelper.render(this.metaTemplate));
        description = this.querySelector('.description');
        description.innerHTML = marked(metaContent);
      }
      if (options.buttons && options.buttons.length > 0) {
        this.classList.add('has-buttons');
        metaContainer = this.querySelector('.meta');
        metaContainer.appendChild(TemplateHelper.render(this.buttonListTemplate));
        toolbar = this.querySelector('.btn-toolbar');
        buttonClass = this.model.getType();
        if (buttonClass === 'fatal') {
          buttonClass = 'error';
        }
        buttonClass = "btn-" + buttonClass;
        options.buttons.forEach((function(_this) {
          return function(button) {
            var buttonEl;
            toolbar.appendChild(TemplateHelper.render(_this.buttonTemplate));
            buttonEl = toolbar.childNodes[toolbar.childNodes.length - 1];
            buttonEl.textContent = button.text;
            buttonEl.classList.add(buttonClass);
            if (button.className != null) {
              buttonEl.classList.add.apply(buttonEl.classList, button.className.split(' '));
            }
            if (button.onDidClick != null) {
              return buttonEl.addEventListener('click', function(e) {
                return button.onDidClick.call(this, e);
              });
            }
          };
        })(this));
      }
      if (this.model.isDismissable()) {
        closeButton = this.querySelector('.close');
        closeButton.addEventListener('click', (function(_this) {
          return function() {
            return _this.handleRemoveNotificationClick();
          };
        })(this));
        closeAllButton = this.querySelector('.close-all');
        closeAllButton.classList.add(this.getButtonClass());
        closeAllButton.addEventListener('click', (function(_this) {
          return function() {
            return _this.handleRemoveAllNotificationsClick();
          };
        })(this));
      }
      if (this.model.getType() === 'fatal') {
        return this.renderFatalError();
      } else {
        return Promise.resolve();
      }
    };

    NotificationElement.prototype.renderFatalError = function() {
      var copyReportButton, fatalContainer, fatalNotification, issueButton, packageName, promises, repoUrl;
      repoUrl = this.issue.getRepoUrl();
      packageName = this.issue.getPackageName();
      fatalContainer = this.querySelector('.meta');
      fatalContainer.appendChild(TemplateHelper.render(this.fatalTemplate));
      fatalNotification = this.querySelector('.fatal-notification');
      issueButton = fatalContainer.querySelector('.btn-issue');
      copyReportButton = fatalContainer.querySelector('.btn-copy-report');
      atom.tooltips.add(copyReportButton, {
        title: copyReportButton.getAttribute('title')
      });
      copyReportButton.addEventListener('click', (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.issue.getIssueBody().then(function(issueBody) {
            return atom.clipboard.write(issueBody);
          });
        };
      })(this));
      if ((packageName != null) && (repoUrl != null)) {
        fatalNotification.innerHTML = "The error was thrown from the <a href=\"" + repoUrl + "\">" + packageName + " package</a>. ";
      } else if (packageName != null) {
        issueButton.remove();
        fatalNotification.textContent = "The error was thrown from the " + packageName + " package. ";
      } else {
        fatalNotification.textContent = "This is likely a bug in Atom. ";
      }
      if (issueButton.parentNode != null) {
        if ((packageName != null) && (repoUrl != null)) {
          issueButton.textContent = "Create issue on the " + packageName + " package";
        } else {
          issueButton.textContent = "Create issue on atom/atom";
        }
        promises = [];
        promises.push(this.issue.findSimilarIssues());
        promises.push(this.issue.getIssueUrlForSystem());
        promises.push(UserUtilities.checkAtomUpToDate());
        if (packageName != null) {
          promises.push(UserUtilities.checkPackageUpToDate(packageName));
        }
        return Promise.all(promises).then(function(allData) {
          var atomCheck, issue, issues, newIssueUrl, packageCheck, packagePath, ref;
          issues = allData[0], newIssueUrl = allData[1], atomCheck = allData[2], packageCheck = allData[3];
          if ((issues != null ? issues.open : void 0) || (issues != null ? issues.closed : void 0)) {
            issue = issues.open || issues.closed;
            issueButton.setAttribute('href', issue.html_url);
            issueButton.textContent = "View Issue";
            fatalNotification.innerHTML += " This issue has already been reported.";
          } else if ((packageCheck != null) && !packageCheck.upToDate && !packageCheck.isCore) {
            issueButton.setAttribute('href', '#');
            issueButton.textContent = "Check for package updates";
            issueButton.addEventListener('click', function(e) {
              var command;
              e.preventDefault();
              command = 'settings-view:check-for-package-updates';
              return atom.commands.dispatch(atom.views.getView(atom.workspace), command);
            });
            fatalNotification.innerHTML += "<code>" + packageName + "</code> is out of date: " + packageCheck.installedVersion + " installed;\n" + packageCheck.latestVersion + " latest.\nUpgrading to the latest version may fix this issue.";
          } else if ((packageCheck != null) && !packageCheck.upToDate && packageCheck.isCore) {
            issueButton.remove();
            fatalNotification.innerHTML += "<br><br>\nLocally installed core Atom package <code>" + packageName + "</code> is out of date: " + packageCheck.installedVersion + " installed locally;\n" + packageCheck.versionShippedWithAtom + " included with the version of Atom you're running.\nRemoving the locally installed version may fix this issue.";
            packagePath = (ref = atom.packages.getLoadedPackage(packageName)) != null ? ref.path : void 0;
            if (fs.isSymbolicLinkSync(packagePath)) {
              fatalNotification.innerHTML += "<br><br>\nUse: <code>apm unlink " + packagePath + "</code>";
            }
          } else if ((atomCheck != null) && !atomCheck.upToDate) {
            issueButton.remove();
            fatalNotification.innerHTML += "Atom is out of date: " + atomCheck.installedVersion + " installed;\n" + atomCheck.latestVersion + " latest.\nUpgrading to the <a href='https://github.com/atom/atom/releases/tag/v" + atomCheck.latestVersion + "'>latest version</a> may fix this issue.";
          } else {
            if (newIssueUrl != null) {
              issueButton.setAttribute('href', newIssueUrl);
            }
            fatalNotification.innerHTML += " You can help by creating an issue. Please explain what actions triggered this error.";
          }
        });
      } else {
        return Promise.resolve();
      }
    };

    NotificationElement.prototype.removeNotification = function() {
      this.classList.add('remove');
      return this.removeNotificationAfterTimeout();
    };

    NotificationElement.prototype.handleRemoveNotificationClick = function() {
      return this.model.dismiss();
    };

    NotificationElement.prototype.handleRemoveAllNotificationsClick = function() {
      var i, len, notification, notifications;
      notifications = atom.notifications.getNotifications();
      for (i = 0, len = notifications.length; i < len; i++) {
        notification = notifications[i];
        if (notification.isDismissable() && !notification.isDismissed()) {
          notification.dismiss();
        }
      }
    };

    NotificationElement.prototype.handleStackTraceToggleClick = function(e, container) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      if (container.style.display === 'none') {
        e.currentTarget.innerHTML = '<span class="icon icon-dash"></span>Hide Stack Trace';
        return container.style.display = 'block';
      } else {
        e.currentTarget.innerHTML = '<span class="icon icon-plus"></span>Show Stack Trace';
        return container.style.display = 'none';
      }
    };

    NotificationElement.prototype.autohide = function() {
      return setTimeout((function(_this) {
        return function() {
          _this.classList.add('remove');
          return _this.removeNotificationAfterTimeout();
        };
      })(this), this.visibilityDuration);
    };

    NotificationElement.prototype.removeNotificationAfterTimeout = function() {
      if (this === document.activeElement) {
        atom.workspace.getActivePane().activate();
      }
      return setTimeout((function(_this) {
        return function() {
          return _this.remove();
        };
      })(this), this.animationDuration);
    };

    NotificationElement.prototype.getButtonClass = function() {
      var type;
      type = "btn-" + (this.model.getType());
      if (type === 'btn-fatal') {
        return 'btn-error';
      } else {
        return type;
      }
    };

    return NotificationElement;

  })(HTMLElement);

  addSplitLinesToContainer = function(container, content) {
    var div, i, len, line, ref;
    if (typeof content !== 'string') {
      content = content.toString();
    }
    ref = content.split('\n');
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
      div = document.createElement('div');
      div.classList.add('line');
      div.textContent = line;
      container.appendChild(div);
    }
  };

  module.exports = NotificationElement = document.registerElement('atom-notification', {
    prototype: NotificationElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi9ub3RpZmljYXRpb24tZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9PQUFBO0lBQUE7OztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUVULGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUjs7RUFDcEIsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUVoQixvQkFBQSxHQUF1Qjs7RUFjdkIsNkJBQUEsR0FBZ0M7O0VBUWhDLHdCQUFBLEdBQTJCOztFQUkzQixrQkFBQSxHQUFxQjs7RUFJckIsY0FBQSxHQUFpQjs7RUFJWDs7O2tDQUNKLGlCQUFBLEdBQW1COztrQ0FDbkIsa0JBQUEsR0FBb0I7O2tDQUNwQixhQUFBLEdBQWUsY0FBYyxDQUFDLE1BQWYsQ0FBc0IsNkJBQXRCOztrQ0FDZixZQUFBLEdBQWMsY0FBYyxDQUFDLE1BQWYsQ0FBc0Isd0JBQXRCOztrQ0FDZCxrQkFBQSxHQUFvQixjQUFjLENBQUMsTUFBZixDQUFzQixrQkFBdEI7O2tDQUNwQixjQUFBLEdBQWdCLGNBQWMsQ0FBQyxNQUFmLENBQXNCLGNBQXRCOztJQUVILDZCQUFBLEdBQUE7O2tDQUViLFVBQUEsR0FBWSxTQUFDLEtBQUQ7TUFBQyxJQUFDLENBQUEsUUFBRDtNQUNYLElBQTBDLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBLENBQUEsS0FBb0IsT0FBOUQ7UUFBQSxJQUFDLENBQUEsS0FBRCxHQUFhLElBQUEsaUJBQUEs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QUcsQ0FBQyxXQUFKLEdBQWtCO01BQ2xCLFNBQVMsQ0FBQyxXQUFWLENBQXNCLEdBQXRCO0FBSkY7RUFGeUI7O0VBUzNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLG1CQUFBLEdBQXNCLFFBQVEsQ0FBQyxlQUFULENBQXlCLG1CQUF6QixFQUE4QztJQUFBLFNBQUEsRUFBVyxtQkFBbUIsQ0FBQyxTQUEvQjtHQUE5QztBQW5SdkMiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbm1hcmtlZCA9IHJlcXVpcmUgJ21hcmtlZCdcblxuTm90aWZpY2F0aW9uSXNzdWUgPSByZXF1aXJlICcuL25vdGlmaWNhdGlvbi1pc3N1ZSdcblRlbXBsYXRlSGVscGVyID0gcmVxdWlyZSAnLi90ZW1wbGF0ZS1oZWxwZXInXG5Vc2VyVXRpbGl0aWVzID0gcmVxdWlyZSAnLi91c2VyLXV0aWxpdGllcydcblxuTm90aWZpY2F0aW9uVGVtcGxhdGUgPSBcIlwiXCJcbiAgPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICA8ZGl2IGNsYXNzPVwibWVzc2FnZSBpdGVtXCI+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImRldGFpbCBpdGVtXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZGV0YWlsLWNvbnRlbnRcIj48L2Rpdj5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJzdGFjay10b2dnbGVcIj48L2E+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhY2stY29udGFpbmVyXCI+PC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cIm1ldGEgaXRlbVwiPjwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNsb3NlIGljb24gaWNvbi14XCI+PC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJjbG9zZS1hbGwgYnRuIGJ0bi1lcnJvclwiPkNsb3NlIEFsbDwvZGl2PlxuXCJcIlwiXG5cbkZhdGFsTWV0YU5vdGlmaWNhdGlvblRlbXBsYXRlID0gXCJcIlwiXG4gIDxkaXYgY2xhc3M9XCJkZXNjcmlwdGlvbiBmYXRhbC1ub3RpZmljYXRpb25cIj48L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImJ0bi10b29sYmFyXCI+XG4gICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ0bi1pc3N1ZSBidG4gYnRuLWVycm9yXCI+PC9hPlxuICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidG4tY29weS1yZXBvcnQgaWNvbiBpY29uLWNsaXBweVwiIHRpdGxlPVwiQ29weSBlcnJvciByZXBvcnQgdG8gY2xpcGJvYXJkXCI+PC9hPlxuICA8L2Rpdj5cblwiXCJcIlxuXG5NZXRhTm90aWZpY2F0aW9uVGVtcGxhdGUgPSBcIlwiXCJcbiAgPGRpdiBjbGFzcz1cImRlc2NyaXB0aW9uXCI+PC9kaXY+XG5cIlwiXCJcblxuQnV0dG9uTGlzdFRlbXBsYXRlID0gXCJcIlwiXG4gIDxkaXYgY2xhc3M9XCJidG4tdG9vbGJhclwiPjwvZGl2PlxuXCJcIlwiXG5cbkJ1dHRvblRlbXBsYXRlID0gXCJcIlwiXG4gIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidG5cIj48L2E+XG5cIlwiXCJcblxuY2xhc3MgTm90aWZpY2F0aW9uRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGFuaW1hdGlvbkR1cmF0aW9uOiAzNjBcbiAgdmlzaWJpbGl0eUR1cmF0aW9uOiA1MDAwXG4gIGZhdGFsVGVtcGxhdGU6IFRlbXBsYXRlSGVscGVyLmNyZWF0ZShGYXRhbE1ldGFOb3RpZmljYXRpb25UZW1wbGF0ZSlcbiAgbWV0YVRlbXBsYXRlOiBUZW1wbGF0ZUhlbHBlci5jcmVhdGUoTWV0YU5vdGlmaWNhdGlvblRlbXBsYXRlKVxuICBidXR0b25MaXN0VGVtcGxhdGU6IFRlbXBsYXRlSGVscGVyLmNyZWF0ZShCdXR0b25MaXN0VGVtcGxhdGUpXG4gIGJ1dHRvblRlbXBsYXRlOiBUZW1wbGF0ZUhlbHBlci5jcmVhdGUoQnV0dG9uVGVtcGxhdGUpXG5cbiAgY29uc3RydWN0b3I6IC0+XG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCkgLT5cbiAgICBAaXNzdWUgPSBuZXcgTm90aWZpY2F0aW9uSXNzdWUoQG1vZGVsKSBpZiBAbW9kZWwuZ2V0VHlwZSgpIGlzICdmYXRhbCdcbiAgICBAcmVuZGVyUHJvbWlzZSA9IEByZW5kZXIoKS5jYXRjaCAoZSkgLT5cbiAgICAgIGNvbnNvbGUuZXJyb3IgZS5tZXNzYWdlXG4gICAgICBjb25zb2xlLmVycm9yIGUuc3RhY2tcblxuICAgIGlmIEBtb2RlbC5pc0Rpc21pc3NhYmxlKClcbiAgICAgIEBtb2RlbC5vbkRpZERpc21pc3MgPT4gQHJlbW92ZU5vdGlmaWNhdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGF1dG9oaWRlKClcbiAgICB0aGlzXG5cbiAgZ2V0TW9kZWw6IC0+IEBtb2RlbFxuXG4gIGdldFJlbmRlclByb21pc2U6IC0+IEByZW5kZXJQcm9taXNlXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBjbGFzc0xpc3QuYWRkIFwiI3tAbW9kZWwuZ2V0VHlwZSgpfVwiXG4gICAgQGNsYXNzTGlzdC5hZGQgXCJpY29uXCIsIFwiaWNvbi0je0Btb2RlbC5nZXRJY29uKCl9XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiXG5cbiAgICBAY2xhc3NMaXN0LmFkZCgnaGFzLWRldGFpbCcpIGlmIGRldGFpbCA9IEBtb2RlbC5nZXREZXRhaWwoKVxuICAgIEBjbGFzc0xpc3QuYWRkKCdoYXMtY2xvc2UnKSBpZiBAbW9kZWwuaXNEaXNtaXNzYWJsZSgpXG4gICAgQGNsYXNzTGlzdC5hZGQoJ2hhcy1zdGFjaycpIGlmIEBtb2RlbC5nZXRPcHRpb25zKCkuc3RhY2s/XG5cbiAgICBAc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpXG5cbiAgICBAaW5uZXJIVE1MID0gTm90aWZpY2F0aW9uVGVtcGxhdGVcblxuICAgIG9wdGlvbnMgPSBAbW9kZWwuZ2V0T3B0aW9ucygpXG5cbiAgICBub3RpZmljYXRpb25Db250YWluZXIgPSBAcXVlcnlTZWxlY3RvcignLm1lc3NhZ2UnKVxuICAgIG5vdGlmaWNhdGlvbkNvbnRhaW5lci5pbm5lckhUTUwgPSBtYXJrZWQoQG1vZGVsLmdldE1lc3NhZ2UoKSlcblxuICAgIGlmIGRldGFpbCA9IEBtb2RlbC5nZXREZXRhaWwoKVxuICAgICAgYWRkU3BsaXRMaW5lc1RvQ29udGFpbmVyKEBxdWVyeVNlbGVjdG9yKCcuZGV0YWlsLWNvbnRlbnQnKSwgZGV0YWlsKVxuXG4gICAgICBpZiBzdGFjayA9IG9wdGlvbnMuc3RhY2tcbiAgICAgICAgc3RhY2tUb2dnbGUgPSBAcXVlcnlTZWxlY3RvcignLnN0YWNrLXRvZ2dsZScpXG4gICAgICAgIHN0YWNrQ29udGFpbmVyID0gQHF1ZXJ5U2VsZWN0b3IoJy5zdGFjay1jb250YWluZXInKVxuXG4gICAgICAgIGFkZFNwbGl0TGluZXNUb0NvbnRhaW5lcihzdGFja0NvbnRhaW5lciwgc3RhY2spXG5cbiAgICAgICAgc3RhY2tUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAoZSkgPT4gQGhhbmRsZVN0YWNrVHJhY2VUb2dnbGVDbGljayhlLCBzdGFja0NvbnRhaW5lcilcbiAgICAgICAgQGhhbmRsZVN0YWNrVHJhY2VUb2dnbGVDbGljayh7Y3VycmVudFRhcmdldDogc3RhY2tUb2dnbGV9LCBzdGFja0NvbnRhaW5lcilcblxuICAgIGlmIG1ldGFDb250ZW50ID0gb3B0aW9ucy5kZXNjcmlwdGlvblxuICAgICAgQGNsYXNzTGlzdC5hZGQoJ2hhcy1kZXNjcmlwdGlvbicpXG4gICAgICBtZXRhQ29udGFpbmVyID0gQHF1ZXJ5U2VsZWN0b3IoJy5tZXRhJylcbiAgICAgIG1ldGFDb250YWluZXIuYXBwZW5kQ2hpbGQoVGVtcGxhdGVIZWxwZXIucmVuZGVyKEBtZXRhVGVtcGxhdGUpKVxuICAgICAgZGVzY3JpcHRpb24gPSBAcXVlcnlTZWxlY3RvcignLmRlc2NyaXB0aW9uJylcbiAgICAgIGRlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcmtlZChtZXRhQ29udGVudClcblxuICAgIGlmIG9wdGlvbnMuYnV0dG9ucyBhbmQgb3B0aW9ucy5idXR0b25zLmxlbmd0aCA+IDBcbiAgICAgIEBjbGFzc0xpc3QuYWRkKCdoYXMtYnV0dG9ucycpXG4gICAgICBtZXRhQ29udGFpbmVyID0gQHF1ZXJ5U2VsZWN0b3IoJy5tZXRhJylcbiAgICAgIG1ldGFDb250YWluZXIuYXBwZW5kQ2hpbGQoVGVtcGxhdGVIZWxwZXIucmVuZGVyKEBidXR0b25MaXN0VGVtcGxhdGUpKVxuICAgICAgdG9vbGJhciA9IEBxdWVyeVNlbGVjdG9yKCcuYnRuLXRvb2xiYXInKVxuICAgICAgYnV0dG9uQ2xhc3MgPSBAbW9kZWwuZ2V0VHlwZSgpXG4gICAgICBidXR0b25DbGFzcyA9ICdlcnJvcicgaWYgYnV0dG9uQ2xhc3MgaXMgJ2ZhdGFsJ1xuICAgICAgYnV0dG9uQ2xhc3MgPSBcImJ0bi0je2J1dHRvbkNsYXNzfVwiXG4gICAgICBvcHRpb25zLmJ1dHRvbnMuZm9yRWFjaCAoYnV0dG9uKSA9PlxuICAgICAgICB0b29sYmFyLmFwcGVuZENoaWxkKFRlbXBsYXRlSGVscGVyLnJlbmRlcihAYnV0dG9uVGVtcGxhdGUpKVxuICAgICAgICBidXR0b25FbCA9IHRvb2xiYXIuY2hpbGROb2Rlc1t0b29sYmFyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV1cbiAgICAgICAgYnV0dG9uRWwudGV4dENvbnRlbnQgPSBidXR0b24udGV4dFxuICAgICAgICBidXR0b25FbC5jbGFzc0xpc3QuYWRkKGJ1dHRvbkNsYXNzKVxuICAgICAgICBpZiBidXR0b24uY2xhc3NOYW1lP1xuICAgICAgICAgIGJ1dHRvbkVsLmNsYXNzTGlzdC5hZGQuYXBwbHkoYnV0dG9uRWwuY2xhc3NMaXN0LCBidXR0b24uY2xhc3NOYW1lLnNwbGl0KCcgJykpXG4gICAgICAgIGlmIGJ1dHRvbi5vbkRpZENsaWNrP1xuICAgICAgICAgIGJ1dHRvbkVsLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgKGUpIC0+XG4gICAgICAgICAgICBidXR0b24ub25EaWRDbGljay5jYWxsKHRoaXMsIGUpXG5cbiAgICBpZiBAbW9kZWwuaXNEaXNtaXNzYWJsZSgpXG4gICAgICBjbG9zZUJ1dHRvbiA9IEBxdWVyeVNlbGVjdG9yKCcuY2xvc2UnKVxuICAgICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCA9PiBAaGFuZGxlUmVtb3ZlTm90aWZpY2F0aW9uQ2xpY2soKVxuXG4gICAgICBjbG9zZUFsbEJ1dHRvbiA9IEBxdWVyeVNlbGVjdG9yKCcuY2xvc2UtYWxsJylcbiAgICAgIGNsb3NlQWxsQnV0dG9uLmNsYXNzTGlzdC5hZGQgQGdldEJ1dHRvbkNsYXNzKClcbiAgICAgIGNsb3NlQWxsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQGhhbmRsZVJlbW92ZUFsbE5vdGlmaWNhdGlvbnNDbGljaygpXG5cbiAgICBpZiBAbW9kZWwuZ2V0VHlwZSgpIGlzICdmYXRhbCdcbiAgICAgIEByZW5kZXJGYXRhbEVycm9yKClcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gIHJlbmRlckZhdGFsRXJyb3I6IC0+XG4gICAgcmVwb1VybCA9IEBpc3N1ZS5nZXRSZXBvVXJsKClcbiAgICBwYWNrYWdlTmFtZSA9IEBpc3N1ZS5nZXRQYWNrYWdlTmFtZSgpXG5cbiAgICBmYXRhbENvbnRhaW5lciA9IEBxdWVyeVNlbGVjdG9yKCcubWV0YScpXG4gICAgZmF0YWxDb250YWluZXIuYXBwZW5kQ2hpbGQoVGVtcGxhdGVIZWxwZXIucmVuZGVyKEBmYXRhbFRlbXBsYXRlKSlcbiAgICBmYXRhbE5vdGlmaWNhdGlvbiA9IEBxdWVyeVNlbGVjdG9yKCcuZmF0YWwtbm90aWZpY2F0aW9uJylcblxuICAgIGlzc3VlQnV0dG9uID0gZmF0YWxDb250YWluZXIucXVlcnlTZWxlY3RvcignLmJ0bi1pc3N1ZScpXG5cbiAgICBjb3B5UmVwb3J0QnV0dG9uID0gZmF0YWxDb250YWluZXIucXVlcnlTZWxlY3RvcignLmJ0bi1jb3B5LXJlcG9ydCcpXG4gICAgYXRvbS50b29sdGlwcy5hZGQoY29weVJlcG9ydEJ1dHRvbiwgdGl0bGU6IGNvcHlSZXBvcnRCdXR0b24uZ2V0QXR0cmlidXRlKCd0aXRsZScpKVxuICAgIGNvcHlSZXBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQGlzc3VlLmdldElzc3VlQm9keSgpLnRoZW4gKGlzc3VlQm9keSkgLT5cbiAgICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoaXNzdWVCb2R5KVxuXG4gICAgaWYgcGFja2FnZU5hbWU/IGFuZCByZXBvVXJsP1xuICAgICAgZmF0YWxOb3RpZmljYXRpb24uaW5uZXJIVE1MID0gXCJUaGUgZXJyb3Igd2FzIHRocm93biBmcm9tIHRoZSA8YSBocmVmPVxcXCIje3JlcG9Vcmx9XFxcIj4je3BhY2thZ2VOYW1lfSBwYWNrYWdlPC9hPi4gXCJcbiAgICBlbHNlIGlmIHBhY2thZ2VOYW1lP1xuICAgICAgaXNzdWVCdXR0b24ucmVtb3ZlKClcbiAgICAgIGZhdGFsTm90aWZpY2F0aW9uLnRleHRDb250ZW50ID0gXCJUaGUgZXJyb3Igd2FzIHRocm93biBmcm9tIHRoZSAje3BhY2thZ2VOYW1lfSBwYWNrYWdlLiBcIlxuICAgIGVsc2VcbiAgICAgIGZhdGFsTm90aWZpY2F0aW9uLnRleHRDb250ZW50ID0gXCJUaGlzIGlzIGxpa2VseSBhIGJ1ZyBpbiBBdG9tLiBcIlxuXG4gICAgIyBXZSBvbmx5IHNob3cgdGhlIGNyZWF0ZSBpc3N1ZSBidXR0b24gaWYgaXQncyBjbGVhcmx5IGluIGF0b20gY29yZSBvciBpbiBhIHBhY2thZ2Ugd2l0aCBhIHJlcG8gdXJsXG4gICAgaWYgaXNzdWVCdXR0b24ucGFyZW50Tm9kZT9cbiAgICAgIGlmIHBhY2thZ2VOYW1lPyBhbmQgcmVwb1VybD9cbiAgICAgICAgaXNzdWVCdXR0b24udGV4dENvbnRlbnQgPSBcIkNyZWF0ZSBpc3N1ZSBvbiB0aGUgI3twYWNrYWdlTmFtZX0gcGFja2FnZVwiXG4gICAgICBlbHNlXG4gICAgICAgIGlzc3VlQnV0dG9uLnRleHRDb250ZW50ID0gXCJDcmVhdGUgaXNzdWUgb24gYXRvbS9hdG9tXCJcblxuICAgICAgcHJvbWlzZXMgPSBbXVxuICAgICAgcHJvbWlzZXMucHVzaCBAaXNzdWUuZmluZFNpbWlsYXJJc3N1ZXMoKVxuICAgICAgcHJvbWlzZXMucHVzaCBAaXNzdWUuZ2V0SXNzdWVVcmxGb3JTeXN0ZW0oKVxuICAgICAgcHJvbWlzZXMucHVzaCBVc2VyVXRpbGl0aWVzLmNoZWNrQXRvbVVwVG9EYXRlKClcbiAgICAgIHByb21pc2VzLnB1c2ggVXNlclV0aWxpdGllcy5jaGVja1BhY2thZ2VVcFRvRGF0ZShwYWNrYWdlTmFtZSkgaWYgcGFja2FnZU5hbWU/XG5cbiAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuIChhbGxEYXRhKSAtPlxuICAgICAgICBbaXNzdWVzLCBuZXdJc3N1ZVVybCwgYXRvbUNoZWNrLCBwYWNrYWdlQ2hlY2tdID0gYWxsRGF0YVxuXG4gICAgICAgIGlmIGlzc3Vlcz8ub3BlbiBvciBpc3N1ZXM/LmNsb3NlZFxuICAgICAgICAgIGlzc3VlID0gaXNzdWVzLm9wZW4gb3IgaXNzdWVzLmNsb3NlZFxuICAgICAgICAgIGlzc3VlQnV0dG9uLnNldEF0dHJpYnV0ZSgnaHJlZicsIGlzc3VlLmh0bWxfdXJsKVxuICAgICAgICAgIGlzc3VlQnV0dG9uLnRleHRDb250ZW50ID0gXCJWaWV3IElzc3VlXCJcbiAgICAgICAgICBmYXRhbE5vdGlmaWNhdGlvbi5pbm5lckhUTUwgKz0gXCIgVGhpcyBpc3N1ZSBoYXMgYWxyZWFkeSBiZWVuIHJlcG9ydGVkLlwiXG4gICAgICAgIGVsc2UgaWYgcGFja2FnZUNoZWNrPyBhbmQgbm90IHBhY2thZ2VDaGVjay51cFRvRGF0ZSBhbmQgbm90IHBhY2thZ2VDaGVjay5pc0NvcmVcbiAgICAgICAgICBpc3N1ZUJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycpXG4gICAgICAgICAgaXNzdWVCdXR0b24udGV4dENvbnRlbnQgPSBcIkNoZWNrIGZvciBwYWNrYWdlIHVwZGF0ZXNcIlxuICAgICAgICAgIGlzc3VlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgKGUpIC0+XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGNvbW1hbmQgPSAnc2V0dGluZ3MtdmlldzpjaGVjay1mb3ItcGFja2FnZS11cGRhdGVzJ1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBjb21tYW5kKVxuXG4gICAgICAgICAgZmF0YWxOb3RpZmljYXRpb24uaW5uZXJIVE1MICs9IFwiXCJcIlxuICAgICAgICAgICAgPGNvZGU+I3twYWNrYWdlTmFtZX08L2NvZGU+IGlzIG91dCBvZiBkYXRlOiAje3BhY2thZ2VDaGVjay5pbnN0YWxsZWRWZXJzaW9ufSBpbnN0YWxsZWQ7XG4gICAgICAgICAgICAje3BhY2thZ2VDaGVjay5sYXRlc3RWZXJzaW9ufSBsYXRlc3QuXG4gICAgICAgICAgICBVcGdyYWRpbmcgdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG1heSBmaXggdGhpcyBpc3N1ZS5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZWxzZSBpZiBwYWNrYWdlQ2hlY2s/IGFuZCBub3QgcGFja2FnZUNoZWNrLnVwVG9EYXRlIGFuZCBwYWNrYWdlQ2hlY2suaXNDb3JlXG4gICAgICAgICAgaXNzdWVCdXR0b24ucmVtb3ZlKClcblxuICAgICAgICAgIGZhdGFsTm90aWZpY2F0aW9uLmlubmVySFRNTCArPSBcIlwiXCJcbiAgICAgICAgICAgIDxicj48YnI+XG4gICAgICAgICAgICBMb2NhbGx5IGluc3RhbGxlZCBjb3JlIEF0b20gcGFja2FnZSA8Y29kZT4je3BhY2thZ2VOYW1lfTwvY29kZT4gaXMgb3V0IG9mIGRhdGU6ICN7cGFja2FnZUNoZWNrLmluc3RhbGxlZFZlcnNpb259IGluc3RhbGxlZCBsb2NhbGx5O1xuICAgICAgICAgICAgI3twYWNrYWdlQ2hlY2sudmVyc2lvblNoaXBwZWRXaXRoQXRvbX0gaW5jbHVkZWQgd2l0aCB0aGUgdmVyc2lvbiBvZiBBdG9tIHlvdSdyZSBydW5uaW5nLlxuICAgICAgICAgICAgUmVtb3ZpbmcgdGhlIGxvY2FsbHkgaW5zdGFsbGVkIHZlcnNpb24gbWF5IGZpeCB0aGlzIGlzc3VlLlxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgcGFja2FnZVBhdGggPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5wYXRoXG4gICAgICAgICAgaWYgZnMuaXNTeW1ib2xpY0xpbmtTeW5jKHBhY2thZ2VQYXRoKVxuICAgICAgICAgICAgZmF0YWxOb3RpZmljYXRpb24uaW5uZXJIVE1MICs9IFwiXCJcIlxuICAgICAgICAgICAgPGJyPjxicj5cbiAgICAgICAgICAgIFVzZTogPGNvZGU+YXBtIHVubGluayAje3BhY2thZ2VQYXRofTwvY29kZT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZWxzZSBpZiBhdG9tQ2hlY2s/IGFuZCBub3QgYXRvbUNoZWNrLnVwVG9EYXRlXG4gICAgICAgICAgaXNzdWVCdXR0b24ucmVtb3ZlKClcblxuICAgICAgICAgIGZhdGFsTm90aWZpY2F0aW9uLmlubmVySFRNTCArPSBcIlwiXCJcbiAgICAgICAgICAgIEF0b20gaXMgb3V0IG9mIGRhdGU6ICN7YXRvbUNoZWNrLmluc3RhbGxlZFZlcnNpb259IGluc3RhbGxlZDtcbiAgICAgICAgICAgICN7YXRvbUNoZWNrLmxhdGVzdFZlcnNpb259IGxhdGVzdC5cbiAgICAgICAgICAgIFVwZ3JhZGluZyB0byB0aGUgPGEgaHJlZj0naHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9yZWxlYXNlcy90YWcvdiN7YXRvbUNoZWNrLmxhdGVzdFZlcnNpb259Jz5sYXRlc3QgdmVyc2lvbjwvYT4gbWF5IGZpeCB0aGlzIGlzc3VlLlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgaXNzdWVCdXR0b24uc2V0QXR0cmlidXRlKCdocmVmJywgbmV3SXNzdWVVcmwpIGlmIG5ld0lzc3VlVXJsP1xuICAgICAgICAgIGZhdGFsTm90aWZpY2F0aW9uLmlubmVySFRNTCArPSBcIiBZb3UgY2FuIGhlbHAgYnkgY3JlYXRpbmcgYW4gaXNzdWUuIFBsZWFzZSBleHBsYWluIHdoYXQgYWN0aW9ucyB0cmlnZ2VyZWQgdGhpcyBlcnJvci5cIlxuICAgICAgICByZXR1cm5cbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gIHJlbW92ZU5vdGlmaWNhdGlvbjogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgncmVtb3ZlJylcbiAgICBAcmVtb3ZlTm90aWZpY2F0aW9uQWZ0ZXJUaW1lb3V0KClcblxuICBoYW5kbGVSZW1vdmVOb3RpZmljYXRpb25DbGljazogLT5cbiAgICBAbW9kZWwuZGlzbWlzcygpXG5cbiAgaGFuZGxlUmVtb3ZlQWxsTm90aWZpY2F0aW9uc0NsaWNrOiAtPlxuICAgIG5vdGlmaWNhdGlvbnMgPSBhdG9tLm5vdGlmaWNhdGlvbnMuZ2V0Tm90aWZpY2F0aW9ucygpXG4gICAgZm9yIG5vdGlmaWNhdGlvbiBpbiBub3RpZmljYXRpb25zXG4gICAgICBpZiBub3RpZmljYXRpb24uaXNEaXNtaXNzYWJsZSgpIGFuZCBub3Qgbm90aWZpY2F0aW9uLmlzRGlzbWlzc2VkKClcbiAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKVxuICAgIHJldHVyblxuXG4gIGhhbmRsZVN0YWNrVHJhY2VUb2dnbGVDbGljazogKGUsIGNvbnRhaW5lcikgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0PygpXG4gICAgaWYgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgaXMgJ25vbmUnXG4gICAgICBlLmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLWRhc2hcIj48L3NwYW4+SGlkZSBTdGFjayBUcmFjZSdcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIGVsc2VcbiAgICAgIGUuY3VycmVudFRhcmdldC5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJpY29uIGljb24tcGx1c1wiPjwvc3Bhbj5TaG93IFN0YWNrIFRyYWNlJ1xuICAgICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxuICBhdXRvaGlkZTogLT5cbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAY2xhc3NMaXN0LmFkZCgncmVtb3ZlJylcbiAgICAgIEByZW1vdmVOb3RpZmljYXRpb25BZnRlclRpbWVvdXQoKVxuICAgICwgQHZpc2liaWxpdHlEdXJhdGlvblxuXG4gIHJlbW92ZU5vdGlmaWNhdGlvbkFmdGVyVGltZW91dDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKSBpZiB0aGlzIGlzIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcblxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZW1vdmUoKVxuICAgICwgQGFuaW1hdGlvbkR1cmF0aW9uICMga2VlcCBpbiBzeW5jIHdpdGggQ1NTIGFuaW1hdGlvblxuXG4gIGdldEJ1dHRvbkNsYXNzOiAtPlxuICAgIHR5cGUgPSBcImJ0bi0je0Btb2RlbC5nZXRUeXBlKCl9XCJcbiAgICBpZiB0eXBlIGlzICdidG4tZmF0YWwnIHRoZW4gJ2J0bi1lcnJvcicgZWxzZSB0eXBlXG5cbmFkZFNwbGl0TGluZXNUb0NvbnRhaW5lciA9IChjb250YWluZXIsIGNvbnRlbnQpIC0+XG4gIGNvbnRlbnQgPSBjb250ZW50LnRvU3RyaW5nKCkgaWYgdHlwZW9mIGNvbnRlbnQgaXNudCAnc3RyaW5nJ1xuICBmb3IgbGluZSBpbiBjb250ZW50LnNwbGl0KCdcXG4nKVxuICAgIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgZGl2LmNsYXNzTGlzdC5hZGQgJ2xpbmUnXG4gICAgZGl2LnRleHRDb250ZW50ID0gbGluZVxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkaXYpXG4gIHJldHVyblxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvbkVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20tbm90aWZpY2F0aW9uJywgcHJvdG90eXBlOiBOb3RpZmljYXRpb25FbGVtZW50LnByb3RvdHlwZVxuIl19
