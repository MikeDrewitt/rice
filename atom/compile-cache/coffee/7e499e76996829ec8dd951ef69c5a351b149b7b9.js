(function() {
  var CompositeDisposable, Disposable, ResultsPaneView, ResultsView, ScrollView, Util, _, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ScrollView = require('atom-space-pen-views').ScrollView;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ResultsView = require('./results-view');

  Util = require('./util');

  module.exports = ResultsPaneView = (function(superClass) {
    extend(ResultsPaneView, superClass);

    function ResultsPaneView() {
      this.expandAllResults = bind(this.expandAllResults, this);
      this.collapseAllResults = bind(this.collapseAllResults, this);
      this.onCleared = bind(this.onCleared, this);
      this.onReplacementStateCleared = bind(this.onReplacementStateCleared, this);
      this.onFinishedSearching = bind(this.onFinishedSearching, this);
      this.onPathsSearched = bind(this.onPathsSearched, this);
      this.onSearch = bind(this.onSearch, this);
      this.focused = bind(this.focused, this);
      return ResultsPaneView.__super__.constructor.apply(this, arguments);
    }

    ResultsPaneView.URI = "atom://find-and-replace/project-results";

    ResultsPaneView.content = function() {
      return this.div({
        "class": 'preview-pane pane-item',
        tabindex: -1
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'preview-header'
          }, function() {
            _this.span({
              outlet: 'previewCount',
              "class": 'preview-count inline-block'
            });
            _this.div({
              outlet: 'previewControls',
              "class": 'preview-controls'
            }, function() {
              return _this.div({
                "class": 'btn-group'
              }, function() {
                _this.button({
                  outlet: 'collapseAll',
                  "class": 'btn'
                });
                return _this.button({
                  outlet: 'expandAll',
                  "class": 'btn'
                });
              });
            });
            return _this.div({
              outlet: 'loadingMessage',
              "class": 'inline-block'
            }, function() {
              _this.div({
                "class": 'loading loading-spinner-tiny inline-block'
              });
              return _this.div({
                outlet: 'searchedCountBlock',
                "class": 'inline-block'
              }, function() {
                _this.span({
                  outlet: 'searchedCount',
                  "class": 'searched-count'
                });
                return _this.span(' paths searched');
              });
            });
          });
          _this.ul({
            outlet: 'errorList',
            "class": 'error-list list-group padded'
          });
          _this.subview('resultsView', new ResultsView(_this.model));
          return _this.ul({
            "class": 'centered background-message no-results-overlay'
          }, function() {
            return _this.li('No Results');
          });
        };
      })(this));
    };

    ResultsPaneView.prototype.initialize = function() {
      ResultsPaneView.__super__.initialize.apply(this, arguments);
      this.loadingMessage.hide();
      this.model = this.constructor.model;
      this.onFinishedSearching(this.model.getResultsSummary());
      this.on('focus', this.focused);
      this.previewControls.hide();
      this.collapseAll.text('Collapse All').click(this.collapseAllResults);
      return this.expandAll.text('Expand All').click(this.expandAllResults);
    };

    ResultsPaneView.prototype.attached = function() {
      this.model.setActive(true);
      this.subscriptions = new CompositeDisposable;
      return this.handleEvents();
    };

    ResultsPaneView.prototype.detached = function() {
      this.model.setActive(false);
      return this.subscriptions.dispose();
    };

    ResultsPaneView.prototype.copy = function() {
      return new ResultsPaneView();
    };

    ResultsPaneView.prototype.getPaneView = function() {
      return this.parents('.pane').view();
    };

    ResultsPaneView.prototype.getTitle = function() {
      return "Project Find Results";
    };

    ResultsPaneView.prototype.onDidChangeTitle = function() {
      return new Disposable();
    };

    ResultsPaneView.prototype.onDidChangeModified = function() {
      return new Disposable();
    };

    ResultsPaneView.prototype.getIconName = function() {
      return "search";
    };

    ResultsPaneView.prototype.getURI = function() {
      return this.constructor.URI;
    };

    ResultsPaneView.prototype.focused = function() {
      return this.resultsView.focus();
    };

    ResultsPaneView.prototype.handleEvents = function() {
      this.subscriptions.add(this.model.onDidStartSearching(this.onSearch));
      this.subscriptions.add(this.model.onDidFinishSearching(this.onFinishedSearching));
      this.subscriptions.add(this.model.onDidClear(this.onCleared));
      this.subscriptions.add(this.model.onDidClearReplacementState(this.onReplacementStateCleared));
      this.subscriptions.add(this.model.onDidSearchPaths(this.onPathsSearched));
      return this.subscriptions.add(this.model.onDidErrorForPath((function(_this) {
        return function(error) {
          return _this.appendError(error.message);
        };
      })(this)));
    };

    ResultsPaneView.prototype.setErrors = function(messages) {
      var i, len, message;
      if ((messages != null) && messages.length) {
        this.errorList.html('');
        for (i = 0, len = messages.length; i < len; i++) {
          message = messages[i];
          this.appendError(message);
        }
      } else {
        this.clearErrors();
      }
    };

    ResultsPaneView.prototype.appendError = function(message) {
      this.errorList.append("<li class=\"text-error\">" + (Util.escapeHtml(message)) + "</li>");
      return this.errorList.show();
    };

    ResultsPaneView.prototype.clearErrors = function() {
      return this.errorList.html('').hide();
    };

    ResultsPaneView.prototype.onSearch = function(deferred) {
      var hideLoadingMessage, timeout;
      this.loadingMessage.show();
      this.previewCount.text('Searching...');
      this.searchedCount.text('0');
      this.searchedCountBlock.hide();
      this.removeClass('no-results');
      this.previewCount.show();
      this.showSearchedCountBlock = false;
      timeout = setTimeout((function(_this) {
        return function() {
          _this.searchedCountBlock.show();
          return _this.showSearchedCountBlock = true;
        };
      })(this), 500);
      hideLoadingMessage = (function(_this) {
        return function() {
          return _this.loadingMessage.hide();
        };
      })(this);
      return deferred.then(hideLoadingMessage)["catch"](hideLoadingMessage);
    };

    ResultsPaneView.prototype.onPathsSearched = function(numberOfPathsSearched) {
      if (this.showSearchedCountBlock) {
        return this.searchedCount.text(numberOfPathsSearched);
      }
    };

    ResultsPaneView.prototype.onFinishedSearching = function(results) {
      var errors;
      this.hideOrShowNoResults(results);
      this.previewCount.html(Util.getSearchResultsMessage(results));
      if ((results.searchErrors != null) || (results.replacementErrors != null)) {
        errors = _.pluck(results.replacementErrors, 'message');
        errors = errors.concat(_.pluck(results.searchErrors, 'message'));
        return this.setErrors(errors);
      } else {
        return this.clearErrors();
      }
    };

    ResultsPaneView.prototype.onReplacementStateCleared = function(results) {
      this.hideOrShowNoResults(results);
      this.previewCount.html(Util.getSearchResultsMessage(results));
      return this.clearErrors();
    };

    ResultsPaneView.prototype.onCleared = function() {
      this.addClass('no-results');
      this.previewCount.text('Find in project results');
      this.loadingMessage.hide();
      return this.searchedCountBlock.hide();
    };

    ResultsPaneView.prototype.hideOrShowNoResults = function(results) {
      if (results.pathCount) {
        this.previewControls.show();
        return this.removeClass('no-results');
      } else {
        this.previewControls.hide();
        return this.addClass('no-results');
      }
    };

    ResultsPaneView.prototype.collapseAllResults = function() {
      this.resultsView.collapseAllResults();
      return this.resultsView.focus();
    };

    ResultsPaneView.prototype.expandAllResults = function() {
      this.resultsView.expandAllResults();
      return this.resultsView.focus();
    };

    return ResultsPaneView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L3Jlc3VsdHMtcGFuZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILGFBQWMsT0FBQSxDQUFRLHNCQUFSOztFQUNmLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7Ozs7Ozs7Ozs7SUFDSixlQUFDLENBQUEsR0FBRCxHQUFNOztJQUVOLGVBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHdCQUFQO1FBQWlDLFFBQUEsRUFBVSxDQUFDLENBQTVDO09BQUwsRUFBb0QsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ2xELEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdCQUFQO1dBQUwsRUFBOEIsU0FBQTtZQUM1QixLQUFDLENBQUEsSUFBRCxDQUFNO2NBQUEsTUFBQSxFQUFRLGNBQVI7Y0FBd0IsQ0FBQSxLQUFBLENBQUEsRUFBTyw0QkFBL0I7YUFBTjtZQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxNQUFBLEVBQVEsaUJBQVI7Y0FBMkIsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQkFBbEM7YUFBTCxFQUEyRCxTQUFBO3FCQUN6RCxLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENB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O01BQ1QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxZQUFWO01BQ0EsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLHlCQUFuQjtNQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsSUFBaEIsQ0FBQTthQUNBLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxJQUFwQixDQUFBO0lBSlM7OzhCQU1YLG1CQUFBLEdBQXFCLFNBQUMsT0FBRDtNQUNuQixJQUFHLE9BQU8sQ0FBQyxTQUFYO1FBQ0UsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFBO2VBQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBYSxZQUFiLEVBRkY7T0FBQSxNQUFBO1FBSUUsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFBO2VBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxZQUFWLEVBTEY7O0lBRG1COzs4QkFRckIsa0JBQUEsR0FBb0IsU0FBQTtNQUNsQixJQUFDLENBQUEsV0FBVyxDQUFDLGtCQUFiLENBQUE7YUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLEtBQWIsQ0FBQTtJQUZrQjs7OEJBSXBCLGdCQUFBLEdBQWtCLFNBQUE7TUFDaEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxnQkFBYixDQUFBO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFiLENBQUE7SUFGZ0I7Ozs7S0F4SlU7QUFQOUIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue1Njcm9sbFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuUmVzdWx0c1ZpZXcgPSByZXF1aXJlICcuL3Jlc3VsdHMtdmlldydcblV0aWwgPSByZXF1aXJlICcuL3V0aWwnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFJlc3VsdHNQYW5lVmlldyBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQFVSSTogXCJhdG9tOi8vZmluZC1hbmQtcmVwbGFjZS9wcm9qZWN0LXJlc3VsdHNcIlxuXG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdwcmV2aWV3LXBhbmUgcGFuZS1pdGVtJywgdGFiaW5kZXg6IC0xLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3ByZXZpZXctaGVhZGVyJywgPT5cbiAgICAgICAgQHNwYW4gb3V0bGV0OiAncHJldmlld0NvdW50JywgY2xhc3M6ICdwcmV2aWV3LWNvdW50IGlubGluZS1ibG9jaydcbiAgICAgICAgQGRpdiBvdXRsZXQ6ICdwcmV2aWV3Q29udHJvbHMnLCBjbGFzczogJ3ByZXZpZXctY29udHJvbHMnLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tZ3JvdXAnLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdjb2xsYXBzZUFsbCcsIGNsYXNzOiAnYnRuJ1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdleHBhbmRBbGwnLCBjbGFzczogJ2J0bidcbiAgICAgICAgQGRpdiBvdXRsZXQ6ICdsb2FkaW5nTWVzc2FnZScsIGNsYXNzOiAnaW5saW5lLWJsb2NrJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnbG9hZGluZyBsb2FkaW5nLXNwaW5uZXItdGlueSBpbmxpbmUtYmxvY2snXG4gICAgICAgICAgQGRpdiBvdXRsZXQ6ICdzZWFyY2hlZENvdW50QmxvY2snLCBjbGFzczogJ2lubGluZS1ibG9jaycsID0+XG4gICAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdzZWFyY2hlZENvdW50JywgY2xhc3M6ICdzZWFyY2hlZC1jb3VudCdcbiAgICAgICAgICAgIEBzcGFuICcgcGF0aHMgc2VhcmNoZWQnXG5cbiAgICAgIEB1bCBvdXRsZXQ6ICdlcnJvckxpc3QnLCBjbGFzczogJ2Vycm9yLWxpc3QgbGlzdC1ncm91cCBwYWRkZWQnXG5cbiAgICAgIEBzdWJ2aWV3ICdyZXN1bHRzVmlldycsIG5ldyBSZXN1bHRzVmlldyhAbW9kZWwpXG4gICAgICBAdWwgY2xhc3M6ICdjZW50ZXJlZCBiYWNrZ3JvdW5kLW1lc3NhZ2Ugbm8tcmVzdWx0cy1vdmVybGF5JywgPT5cbiAgICAgICAgQGxpICdObyBSZXN1bHRzJ1xuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAbG9hZGluZ01lc3NhZ2UuaGlkZSgpXG4gICAgQG1vZGVsID0gQGNvbnN0cnVjdG9yLm1vZGVsXG4gICAgQG9uRmluaXNoZWRTZWFyY2hpbmcoQG1vZGVsLmdldFJlc3VsdHNTdW1tYXJ5KCkpXG4gICAgQG9uICdmb2N1cycsIEBmb2N1c2VkXG5cbiAgICBAcHJldmlld0NvbnRyb2xzLmhpZGUoKVxuICAgIEBjb2xsYXBzZUFsbFxuICAgICAgLnRleHQoJ0NvbGxhcHNlIEFsbCcpXG4gICAgICAuY2xpY2soQGNvbGxhcHNlQWxsUmVzdWx0cylcbiAgICBAZXhwYW5kQWxsXG4gICAgICAudGV4dCgnRXhwYW5kIEFsbCcpXG4gICAgICAuY2xpY2soQGV4cGFuZEFsbFJlc3VsdHMpXG5cbiAgYXR0YWNoZWQ6IC0+XG4gICAgQG1vZGVsLnNldEFjdGl2ZSh0cnVlKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAaGFuZGxlRXZlbnRzKClcblxuICBkZXRhY2hlZDogLT5cbiAgICBAbW9kZWwuc2V0QWN0aXZlKGZhbHNlKVxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIGNvcHk6IC0+XG4gICAgbmV3IFJlc3VsdHNQYW5lVmlldygpXG5cbiAgZ2V0UGFuZVZpZXc6IC0+XG4gICAgQHBhcmVudHMoJy5wYW5lJykudmlldygpXG5cbiAgZ2V0VGl0bGU6IC0+XG4gICAgXCJQcm9qZWN0IEZpbmQgUmVzdWx0c1wiXG5cbiAgIyBOT1AgdG8gcmVtb3ZlIGRlcHJlY2F0aW9uLiBUaGlzIGtpbmQgb2Ygc3Vja3NcbiAgb25EaWRDaGFuZ2VUaXRsZTogLT5cbiAgICBuZXcgRGlzcG9zYWJsZSgpXG4gIG9uRGlkQ2hhbmdlTW9kaWZpZWQ6IC0+XG4gICAgbmV3IERpc3Bvc2FibGUoKVxuXG4gIGdldEljb25OYW1lOiAtPlxuICAgIFwic2VhcmNoXCJcblxuICBnZXRVUkk6IC0+XG4gICAgQGNvbnN0cnVjdG9yLlVSSVxuXG4gIGZvY3VzZWQ6ID0+XG4gICAgQHJlc3VsdHNWaWV3LmZvY3VzKClcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZFN0YXJ0U2VhcmNoaW5nIEBvblNlYXJjaFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRGaW5pc2hTZWFyY2hpbmcgQG9uRmluaXNoZWRTZWFyY2hpbmdcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkQ2xlYXIgQG9uQ2xlYXJlZFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRDbGVhclJlcGxhY2VtZW50U3RhdGUgQG9uUmVwbGFjZW1lbnRTdGF0ZUNsZWFyZWRcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1vZGVsLm9uRGlkU2VhcmNoUGF0aHMgQG9uUGF0aHNTZWFyY2hlZFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwub25EaWRFcnJvckZvclBhdGggKGVycm9yKSA9PiBAYXBwZW5kRXJyb3IoZXJyb3IubWVzc2FnZSlcblxuICBzZXRFcnJvcnM6IChtZXNzYWdlcykgLT5cbiAgICBpZiBtZXNzYWdlcz8gYW5kIG1lc3NhZ2VzLmxlbmd0aFxuICAgICAgQGVycm9yTGlzdC5odG1sKCcnKVxuICAgICAgQGFwcGVuZEVycm9yKG1lc3NhZ2UpIGZvciBtZXNzYWdlIGluIG1lc3NhZ2VzXG4gICAgZWxzZVxuICAgICAgQGNsZWFyRXJyb3JzKClcbiAgICByZXR1cm5cblxuICBhcHBlbmRFcnJvcjogKG1lc3NhZ2UpIC0+XG4gICAgQGVycm9yTGlzdC5hcHBlbmQoXCI8bGkgY2xhc3M9XFxcInRleHQtZXJyb3JcXFwiPiN7VXRpbC5lc2NhcGVIdG1sKG1lc3NhZ2UpfTwvbGk+XCIpXG4gICAgQGVycm9yTGlzdC5zaG93KClcblxuICBjbGVhckVycm9yczogLT5cbiAgICBAZXJyb3JMaXN0Lmh0bWwoJycpLmhpZGUoKVxuICBvblNlYXJjaDogKGRlZmVycmVkKSA9PlxuICAgIEBsb2FkaW5nTWVzc2FnZS5zaG93KClcblxuICAgIEBwcmV2aWV3Q291bnQudGV4dCgnU2VhcmNoaW5nLi4uJylcbiAgICBAc2VhcmNoZWRDb3VudC50ZXh0KCcwJylcbiAgICBAc2VhcmNoZWRDb3VudEJsb2NrLmhpZGUoKVxuICAgIEByZW1vdmVDbGFzcygnbm8tcmVzdWx0cycpXG5cbiAgICBAcHJldmlld0NvdW50LnNob3coKVxuXG4gICAgIyBXZSdsbCBvbmx5IHNob3cgdGhlIHBhdGhzIHNlYXJjaGVkIG1lc3NhZ2UgYWZ0ZXIgNTAwbXMuIEl0J3MgdG9vIGZhc3QgdG9cbiAgICAjIHNlZSBvbiBzaG9ydCBzZWFyY2hlcywgYW5kIHNsb3dzIHRoZW0gZG93bi5cbiAgICBAc2hvd1NlYXJjaGVkQ291bnRCbG9jayA9IGZhbHNlXG4gICAgdGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIEBzZWFyY2hlZENvdW50QmxvY2suc2hvdygpXG4gICAgICBAc2hvd1NlYXJjaGVkQ291bnRCbG9jayA9IHRydWVcbiAgICAsIDUwMFxuXG4gICAgaGlkZUxvYWRpbmdNZXNzYWdlID0gPT4gQGxvYWRpbmdNZXNzYWdlLmhpZGUoKVxuXG4gICAgZGVmZXJyZWQudGhlbihoaWRlTG9hZGluZ01lc3NhZ2UpLmNhdGNoKGhpZGVMb2FkaW5nTWVzc2FnZSlcblxuICBvblBhdGhzU2VhcmNoZWQ6IChudW1iZXJPZlBhdGhzU2VhcmNoZWQpID0+XG4gICAgaWYgQHNob3dTZWFyY2hlZENvdW50QmxvY2tcbiAgICAgIEBzZWFyY2hlZENvdW50LnRleHQobnVtYmVyT2ZQYXRoc1NlYXJjaGVkKVxuXG4gIG9uRmluaXNoZWRTZWFyY2hpbmc6IChyZXN1bHRzKSA9PlxuICAgIEBoaWRlT3JTaG93Tm9SZXN1bHRzKHJlc3VsdHMpXG4gICAgQHByZXZpZXdDb3VudC5odG1sKFV0aWwuZ2V0U2VhcmNoUmVzdWx0c01lc3NhZ2UocmVzdWx0cykpXG4gICAgaWYgcmVzdWx0cy5zZWFyY2hFcnJvcnM/IG9yIHJlc3VsdHMucmVwbGFjZW1lbnRFcnJvcnM/XG4gICAgICBlcnJvcnMgPSBfLnBsdWNrKHJlc3VsdHMucmVwbGFjZW1lbnRFcnJvcnMsICdtZXNzYWdlJylcbiAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQgXy5wbHVjayhyZXN1bHRzLnNlYXJjaEVycm9ycywgJ21lc3NhZ2UnKVxuICAgICAgQHNldEVycm9ycyhlcnJvcnMpXG4gICAgZWxzZVxuICAgICAgQGNsZWFyRXJyb3JzKClcblxuICBvblJlcGxhY2VtZW50U3RhdGVDbGVhcmVkOiAocmVzdWx0cykgPT5cbiAgICBAaGlkZU9yU2hvd05vUmVzdWx0cyhyZXN1bHRzKVxuICAgIEBwcmV2aWV3Q291bnQuaHRtbChVdGlsLmdldFNlYXJjaFJlc3VsdHNNZXNzYWdlKHJlc3VsdHMpKVxuICAgIEBjbGVhckVycm9ycygpXG5cbiAgb25DbGVhcmVkOiA9PlxuICAgIEBhZGRDbGFzcygnbm8tcmVzdWx0cycpXG4gICAgQHByZXZpZXdDb3VudC50ZXh0KCdGaW5kIGluIHByb2plY3QgcmVzdWx0cycpXG4gICAgQGxvYWRpbmdNZXNzYWdlLmhpZGUoKVxuICAgIEBzZWFyY2hlZENvdW50QmxvY2suaGlkZSgpXG5cbiAgaGlkZU9yU2hvd05vUmVzdWx0czogKHJlc3VsdHMpIC0+XG4gICAgaWYgcmVzdWx0cy5wYXRoQ291bnRcbiAgICAgIEBwcmV2aWV3Q29udHJvbHMuc2hvdygpXG4gICAgICBAcmVtb3ZlQ2xhc3MoJ25vLXJlc3VsdHMnKVxuICAgIGVsc2VcbiAgICAgIEBwcmV2aWV3Q29udHJvbHMuaGlkZSgpXG4gICAgICBAYWRkQ2xhc3MoJ25vLXJlc3VsdHMnKVxuXG4gIGNvbGxhcHNlQWxsUmVzdWx0czogPT5cbiAgICBAcmVzdWx0c1ZpZXcuY29sbGFwc2VBbGxSZXN1bHRzKClcbiAgICBAcmVzdWx0c1ZpZXcuZm9jdXMoKVxuXG4gIGV4cGFuZEFsbFJlc3VsdHM6ID0+XG4gICAgQHJlc3VsdHNWaWV3LmV4cGFuZEFsbFJlc3VsdHMoKVxuICAgIEByZXN1bHRzVmlldy5mb2N1cygpXG4iXX0=
