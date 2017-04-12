(function() {
  var $, $$, ErrorView, PackageCard, ScrollView, UpdatesPanel, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $ = ref.$, $$ = ref.$$, ScrollView = ref.ScrollView;

  ErrorView = require('./error-view');

  PackageCard = require('./package-card');

  module.exports = UpdatesPanel = (function(superClass) {
    extend(UpdatesPanel, superClass);

    function UpdatesPanel() {
      return UpdatesPanel.__super__.constructor.apply(this, arguments);
    }

    UpdatesPanel.content = function() {
      return this.div({
        tabindex: 0,
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.section({
            "class": 'section packages'
          }, function() {
            return _this.div({
              "class": 'section-container updates-container'
            }, function() {
              _this.h1({
                "class": 'section-heading icon icon-cloud-download'
              }, 'Available Updates', function() {
                _this.button({
                  outlet: 'updateAllButton',
                  "class": 'pull-right update-all-button btn btn-primary'
                }, 'Update All');
                return _this.button({
                  outlet: 'checkButton',
                  "class": 'pull-right update-all-button btn btn'
                }, 'Check for Updates');
              });
              _this.div({
                outlet: 'updateErrors'
              });
              _this.div({
                outlet: 'checkingMessage',
                "class": 'alert alert-info icon icon-hourglass'
              }, 'Checking for updates\u2026');
              _this.div({
                outlet: 'noUpdatesMessage',
                "class": 'alert alert-info icon icon-heart'
              }, 'All of your installed packages are up to date!');
              return _this.div({
                outlet: 'updatesContainer',
                "class": 'container package-container'
              });
            });
          });
        };
      })(this));
    };

    UpdatesPanel.prototype.initialize = function(packageManager) {
      this.packageManager = packageManager;
      UpdatesPanel.__super__.initialize.apply(this, arguments);
      this.updateAllButton.on('click', (function(_this) {
        return function() {
          return _this.updateAll();
        };
      })(this));
      this.checkButton.on('click', (function(_this) {
        return function() {
          return _this.checkForUpdates();
        };
      })(this));
      this.checkForUpdates();
      return this.packageManagerSubscription = this.packageManager.on('package-update-failed theme-update-failed', (function(_this) {
        return function(arg) {
          var error, pack;
          pack = arg.pack, error = arg.error;
          return _this.updateErrors.append(new ErrorView(_this.packageManager, error));
        };
      })(this));
    };

    UpdatesPanel.prototype.dispose = function() {
      return this.packageManagerSubscription.dispose();
    };

    UpdatesPanel.prototype.beforeShow = function(opts) {
      if (opts != null ? opts.back : void 0) {
        this.breadcrumb.text(opts.back).on('click', (function(_this) {
          return function() {
            var ref1;
            return (ref1 = _this.parents('.settings-view').view()) != null ? ref1.showPanel(opts.back) : void 0;
          };
        })(this));
      }
      if (opts != null ? opts.updates : void 0) {
        this.availableUpdates = opts.updates;
        return this.addUpdateViews();
      } else {
        this.availableUpdates = [];
        this.updatesContainer.empty();
        return this.checkForUpdates();
      }
    };

    UpdatesPanel.prototype.checkForUpdates = function() {
      this.noUpdatesMessage.hide();
      this.updateAllButton.hide();
      this.checkButton.prop('disabled', true);
      this.checkingMessage.show();
      return this.packageManager.getInstalled().then((function(_this) {
        return function() {
          return _this.packageManager.getOutdated().then(function(availableUpdates) {
            _this.availableUpdates = availableUpdates;
            _this.checkButton.prop('disabled', false);
            return _this.addUpdateViews();
          })["catch"](function(error) {
            _this.checkButton.prop('disabled', false);
            _this.checkingMessage.hide();
            return _this.updateErrors.append(new ErrorView(_this.packageManager, error));
          });
        };
      })(this));
    };

    UpdatesPanel.prototype.addUpdateViews = function() {
      var i, len, pack, ref1, results;
      if (this.availableUpdates.length > 0) {
        this.updateAllButton.show();
        this.updateAllButton.prop('disabled', false);
      }
      this.checkingMessage.hide();
      this.updatesContainer.empty();
      if (this.availableUpdates.length === 0) {
        this.noUpdatesMessage.show();
      }
      ref1 = this.availableUpdates;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pack = ref1[i];
        results.push(this.updatesContainer.append(new PackageCard(pack, this.packageManager, {
          back: 'Updates'
        })));
      }
      return results;
    };

    UpdatesPanel.prototype.updateAll = function() {
      var i, len, notifyIfDone, onUpdateRejected, onUpdateResolved, packageCard, packageCards, remainingPackagesCount, results, successfulUpdatesCount;
      this.updateAllButton.prop('disabled', true);
      packageCards = this.getPackageCards();
      successfulUpdatesCount = 0;
      remainingPackagesCount = packageCards.length;
      notifyIfDone = function() {
        var buttons, message, pluralizedPackages;
        if (remainingPackagesCount === 0 && successfulUpdatesCount > 0) {
          pluralizedPackages = 'package';
          if (successfulUpdatesCount > 1) {
            pluralizedPackages += 's';
          }
          message = "Restart Atom to complete the update of " + successfulUpdatesCount + " " + pluralizedPackages + ".";
          buttons = [];
          if (atom.restartApplication != null) {
            buttons.push({
              text: 'Restart',
              onDidClick: function() {
                return atom.restartApplication();
              }
            });
          }
          return atom.notifications.addSuccess(message, {
            dismissable: true,
            buttons: buttons
          });
        }
      };
      onUpdateResolved = function() {
        remainingPackagesCount--;
        successfulUpdatesCount++;
        return notifyIfDone();
      };
      onUpdateRejected = function() {
        remainingPackagesCount--;
        return notifyIfDone();
      };
      results = [];
      for (i = 0, len = packageCards.length; i < len; i++) {
        packageCard = packageCards[i];
        results.push(packageCard.update().then(onUpdateResolved, onUpdateRejected));
      }
      return results;
    };

    UpdatesPanel.prototype.getPackageCards = function() {
      return this.updatesContainer.find('.package-card').toArray().map(function(element) {
        return $(element).view();
      }).filter(function(view) {
        return view != null;
      });
    };

    return UpdatesPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi91cGRhdGVzLXBhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNERBQUE7SUFBQTs7O0VBQUEsTUFBc0IsT0FBQSxDQUFRLHNCQUFSLENBQXRCLEVBQUMsU0FBRCxFQUFJLFdBQUosRUFBUTs7RUFDUixTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBQ1osV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFFZCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBRUosWUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLFFBQUEsRUFBVSxDQUFWO1FBQWEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFwQjtPQUFMLEVBQXdDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDdEMsS0FBQyxDQUFBLE9BQUQsQ0FBUztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7V0FBVCxFQUFvQyxTQUFBO21CQUNsQyxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxxQ0FBUDthQUFMLEVBQW1ELFNBQUE7Y0FDakQsS0FBQyxDQUFBLEVBQUQsQ0FBSTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDBDQUFQO2VBQUosRUFBdUQsbUJBQXZELEVBQTRFLFNBQUE7Z0JBQzFFLEtBQUMsQ0FBQSxNQUFELENBQVE7a0JBQUEsTUFBQSxFQUFRLGlCQUFSO2tCQUEyQixDQUFBLEtBQUEsQ0FBQSxFQUFPLDhDQUFsQztpQkFBUixFQUEwRixZQUExRjt1QkFDQSxLQUFDLENBQUEsTUFBRCxDQUFRO2tCQUFBLE1BQUEsRUFBUSxhQUFSO2tCQUF1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QUE7O3FCQUNFLFdBQVcsQ0FBQyxNQUFaLENBQUEsQ0FBb0IsQ0FBQyxJQUFyQixDQUEwQixnQkFBMUIsRUFBNEMsZ0JBQTVDO0FBREY7O0lBL0JTOzsyQkFrQ1gsZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLGdCQUFnQixDQUFDLElBQWxCLENBQXVCLGVBQXZCLENBQXVDLENBQUMsT0FBeEMsQ0FBQSxDQUNFLENBQUMsR0FESCxDQUNPLFNBQUMsT0FBRDtlQUFhLENBQUEsQ0FBRSxPQUFGLENBQVUsQ0FBQyxJQUFYLENBQUE7TUFBYixDQURQLENBRUUsQ0FBQyxNQUZILENBRVUsU0FBQyxJQUFEO2VBQVU7TUFBVixDQUZWO0lBRGU7Ozs7S0F4R1E7QUFMM0IiLCJzb3VyY2VzQ29udGVudCI6WyJ7JCwgJCQsIFNjcm9sbFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5FcnJvclZpZXcgPSByZXF1aXJlICcuL2Vycm9yLXZpZXcnXG5QYWNrYWdlQ2FyZCA9IHJlcXVpcmUgJy4vcGFja2FnZS1jYXJkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBVcGRhdGVzUGFuZWwgZXh0ZW5kcyBTY3JvbGxWaWV3XG5cbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiB0YWJpbmRleDogMCwgY2xhc3M6ICdwYW5lbHMtaXRlbScsID0+XG4gICAgICBAc2VjdGlvbiBjbGFzczogJ3NlY3Rpb24gcGFja2FnZXMnLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1jb250YWluZXIgdXBkYXRlcy1jb250YWluZXInLCA9PlxuICAgICAgICAgIEBoMSBjbGFzczogJ3NlY3Rpb24taGVhZGluZyBpY29uIGljb24tY2xvdWQtZG93bmxvYWQnLCAnQXZhaWxhYmxlIFVwZGF0ZXMnLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICd1cGRhdGVBbGxCdXR0b24nLCBjbGFzczogJ3B1bGwtcmlnaHQgdXBkYXRlLWFsbC1idXR0b24gYnRuIGJ0bi1wcmltYXJ5JywgJ1VwZGF0ZSBBbGwnXG4gICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2NoZWNrQnV0dG9uJywgY2xhc3M6ICdwdWxsLXJpZ2h0IHVwZGF0ZS1hbGwtYnV0dG9uIGJ0biBidG4nLCAnQ2hlY2sgZm9yIFVwZGF0ZXMnXG5cbiAgICAgICAgICBAZGl2IG91dGxldDogJ3VwZGF0ZUVycm9ycydcbiAgICAgICAgICBAZGl2IG91dGxldDogJ2NoZWNraW5nTWVzc2FnZScsIGNsYXNzOiAnYWxlcnQgYWxlcnQtaW5mbyBpY29uIGljb24taG91cmdsYXNzJywgJ0NoZWNraW5nIGZvciB1cGRhdGVzXFx1MjAyNidcbiAgICAgICAgICBAZGl2IG91dGxldDogJ25vVXBkYXRlc01lc3NhZ2UnLCBjbGFzczogJ2FsZXJ0IGFsZXJ0LWluZm8gaWNvbiBpY29uLWhlYXJ0JywgJ0FsbCBvZiB5b3VyIGluc3RhbGxlZCBwYWNrYWdlcyBhcmUgdXAgdG8gZGF0ZSEnXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICd1cGRhdGVzQ29udGFpbmVyJywgY2xhc3M6ICdjb250YWluZXIgcGFja2FnZS1jb250YWluZXInXG5cbiAgaW5pdGlhbGl6ZTogKEBwYWNrYWdlTWFuYWdlcikgLT5cbiAgICBzdXBlclxuICAgIEB1cGRhdGVBbGxCdXR0b24ub24gJ2NsaWNrJywgPT4gQHVwZGF0ZUFsbCgpXG4gICAgQGNoZWNrQnV0dG9uLm9uICdjbGljaycsID0+XG4gICAgICBAY2hlY2tGb3JVcGRhdGVzKClcblxuICAgIEBjaGVja0ZvclVwZGF0ZXMoKVxuXG4gICAgQHBhY2thZ2VNYW5hZ2VyU3Vic2NyaXB0aW9uID0gQHBhY2thZ2VNYW5hZ2VyLm9uICdwYWNrYWdlLXVwZGF0ZS1mYWlsZWQgdGhlbWUtdXBkYXRlLWZhaWxlZCcsICh7cGFjaywgZXJyb3J9KSA9PlxuICAgICAgQHVwZGF0ZUVycm9ycy5hcHBlbmQobmV3IEVycm9yVmlldyhAcGFja2FnZU1hbmFnZXIsIGVycm9yKSlcblxuICBkaXNwb3NlOiAtPlxuICAgIEBwYWNrYWdlTWFuYWdlclN1YnNjcmlwdGlvbi5kaXNwb3NlKClcblxuICBiZWZvcmVTaG93OiAob3B0cykgLT5cbiAgICBpZiBvcHRzPy5iYWNrXG4gICAgICBAYnJlYWRjcnVtYi50ZXh0KG9wdHMuYmFjaykub24gJ2NsaWNrJywgPT5cbiAgICAgICAgQHBhcmVudHMoJy5zZXR0aW5ncy12aWV3JykudmlldygpPy5zaG93UGFuZWwob3B0cy5iYWNrKVxuICAgIGlmIG9wdHM/LnVwZGF0ZXNcbiAgICAgIEBhdmFpbGFibGVVcGRhdGVzID0gb3B0cy51cGRhdGVzXG4gICAgICBAYWRkVXBkYXRlVmlld3MoKVxuICAgIGVsc2VcbiAgICAgIEBhdmFpbGFibGVVcGRhdGVzID0gW11cbiAgICAgIEB1cGRhdGVzQ29udGFpbmVyLmVtcHR5KClcbiAgICAgIEBjaGVja0ZvclVwZGF0ZXMoKVxuXG4gICMgQ2hlY2sgZm9yIHVwZGF0ZXMgYW5kIGRpc3BsYXkgdGhlbVxuICBjaGVja0ZvclVwZGF0ZXM6IC0+XG4gICAgQG5vVXBkYXRlc01lc3NhZ2UuaGlkZSgpXG4gICAgQHVwZGF0ZUFsbEJ1dHRvbi5oaWRlKClcbiAgICBAY2hlY2tCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCB0cnVlKVxuXG4gICAgQGNoZWNraW5nTWVzc2FnZS5zaG93KClcblxuICAgIEBwYWNrYWdlTWFuYWdlci5nZXRJbnN0YWxsZWQoKS50aGVuID0+XG4gICAgICBAcGFja2FnZU1hbmFnZXIuZ2V0T3V0ZGF0ZWQoKVxuICAgICAgICAudGhlbiAoQGF2YWlsYWJsZVVwZGF0ZXMpID0+XG4gICAgICAgICAgQGNoZWNrQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpXG4gICAgICAgICAgQGFkZFVwZGF0ZVZpZXdzKClcbiAgICAgICAgLmNhdGNoIChlcnJvcikgPT5cbiAgICAgICAgICBAY2hlY2tCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcbiAgICAgICAgICBAY2hlY2tpbmdNZXNzYWdlLmhpZGUoKVxuICAgICAgICAgIEB1cGRhdGVFcnJvcnMuYXBwZW5kKG5ldyBFcnJvclZpZXcoQHBhY2thZ2VNYW5hZ2VyLCBlcnJvcikpXG5cbiAgYWRkVXBkYXRlVmlld3M6IC0+XG4gICAgaWYgQGF2YWlsYWJsZVVwZGF0ZXMubGVuZ3RoID4gMFxuICAgICAgQHVwZGF0ZUFsbEJ1dHRvbi5zaG93KClcbiAgICAgIEB1cGRhdGVBbGxCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcbiAgICBAY2hlY2tpbmdNZXNzYWdlLmhpZGUoKVxuICAgIEB1cGRhdGVzQ29udGFpbmVyLmVtcHR5KClcbiAgICBAbm9VcGRhdGVzTWVzc2FnZS5zaG93KCkgaWYgQGF2YWlsYWJsZVVwZGF0ZXMubGVuZ3RoIGlzIDBcblxuICAgIGZvciBwYWNrIGluIEBhdmFpbGFibGVVcGRhdGVzXG4gICAgICBAdXBkYXRlc0NvbnRhaW5lci5hcHBlbmQobmV3IFBhY2thZ2VDYXJkKHBhY2ssIEBwYWNrYWdlTWFuYWdlciwge2JhY2s6ICdVcGRhdGVzJ30pKVxuXG4gIHVwZGF0ZUFsbDogLT5cbiAgICBAdXBkYXRlQWxsQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSlcblxuICAgIHBhY2thZ2VDYXJkcyA9IEBnZXRQYWNrYWdlQ2FyZHMoKVxuICAgIHN1Y2Nlc3NmdWxVcGRhdGVzQ291bnQgPSAwXG4gICAgcmVtYWluaW5nUGFja2FnZXNDb3VudCA9IHBhY2thZ2VDYXJkcy5sZW5ndGhcblxuICAgIG5vdGlmeUlmRG9uZSA9IC0+XG4gICAgICBpZiByZW1haW5pbmdQYWNrYWdlc0NvdW50IGlzIDAgYW5kIHN1Y2Nlc3NmdWxVcGRhdGVzQ291bnQgPiAwXG4gICAgICAgIHBsdXJhbGl6ZWRQYWNrYWdlcyA9ICdwYWNrYWdlJ1xuICAgICAgICBwbHVyYWxpemVkUGFja2FnZXMgKz0gJ3MnIGlmIHN1Y2Nlc3NmdWxVcGRhdGVzQ291bnQgPiAxXG4gICAgICAgIG1lc3NhZ2UgPSBcIlJlc3RhcnQgQXRvbSB0byBjb21wbGV0ZSB0aGUgdXBkYXRlIG9mICN7c3VjY2Vzc2Z1bFVwZGF0ZXNDb3VudH0gI3twbHVyYWxpemVkUGFja2FnZXN9LlwiXG5cbiAgICAgICAgYnV0dG9ucyA9IFtdXG4gICAgICAgICMgVE9ETzogUmVtb3ZlIGNvbmRpdGlvbmFsIGFmdGVyIDEuMTIuMCBpcyByZWxlYXNlZCBhcyBzdGFibGVcbiAgICAgICAgaWYgYXRvbS5yZXN0YXJ0QXBwbGljYXRpb24/XG4gICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgIHRleHQ6ICdSZXN0YXJ0JyxcbiAgICAgICAgICAgIG9uRGlkQ2xpY2s6IC0+IGF0b20ucmVzdGFydEFwcGxpY2F0aW9uKClcbiAgICAgICAgICB9KVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyhtZXNzYWdlLCB7ZGlzbWlzc2FibGU6IHRydWUsIGJ1dHRvbnN9KVxuXG4gICAgb25VcGRhdGVSZXNvbHZlZCA9IC0+XG4gICAgICByZW1haW5pbmdQYWNrYWdlc0NvdW50LS1cbiAgICAgIHN1Y2Nlc3NmdWxVcGRhdGVzQ291bnQrK1xuICAgICAgbm90aWZ5SWZEb25lKClcblxuICAgIG9uVXBkYXRlUmVqZWN0ZWQgPSAtPlxuICAgICAgcmVtYWluaW5nUGFja2FnZXNDb3VudC0tXG4gICAgICBub3RpZnlJZkRvbmUoKVxuXG4gICAgZm9yIHBhY2thZ2VDYXJkIGluIHBhY2thZ2VDYXJkc1xuICAgICAgcGFja2FnZUNhcmQudXBkYXRlKCkudGhlbihvblVwZGF0ZVJlc29sdmVkLCBvblVwZGF0ZVJlamVjdGVkKVxuXG4gIGdldFBhY2thZ2VDYXJkczogLT5cbiAgICBAdXBkYXRlc0NvbnRhaW5lci5maW5kKCcucGFja2FnZS1jYXJkJykudG9BcnJheSgpXG4gICAgICAubWFwKChlbGVtZW50KSAtPiAkKGVsZW1lbnQpLnZpZXcoKSlcbiAgICAgIC5maWx0ZXIoKHZpZXcpIC0+IHZpZXc/KVxuIl19
