(function() {
  var $, CompositeDisposable, ResultView, ResultsView, ScrollView, _, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, ScrollView = ref.ScrollView;

  ResultView = require('./result-view');

  module.exports = ResultsView = (function(superClass) {
    extend(ResultsView, superClass);

    function ResultsView() {
      this.clear = bind(this.clear, this);
      this.removeResult = bind(this.removeResult, this);
      this.addResult = bind(this.addResult, this);
      return ResultsView.__super__.constructor.apply(this, arguments);
    }

    ResultsView.content = function() {
      return this.ol({
        "class": 'results-view list-tree focusable-panel has-collapsable-children',
        tabindex: -1
      });
    };

    ResultsView.prototype.initialize = function(model) {
      var commandsDisposable;
      this.model = model;
      commandsDisposable = ResultsView.__super__.initialize.call(this);
      commandsDisposable.dispose();
      this.pixelOverdraw = 100;
      this.lastRenderedResultIndex = 0;
      this.on('mousedown', '.path', (function(_this) {
        return function(e) {
          var ref1, ref2, view;
          _this.find('.selected').removeClass('selected');
          view = $(e.target).view();
          view.addClass('selected');
          if (!e.ctrlKey) {
            if (((ref1 = e.originalEvent) != null ? ref1.detail : void 0) === 1) {
              view.confirm({
                pending: true
              });
            } else if (((ref2 = e.originalEvent) != null ? ref2.detail : void 0) === 2) {
              if (!(view instanceof ResultView)) {
                view.confirm();
              }
            }
            e.preventDefault();
          }
          return _this.renderResults();
        };
      })(this));
      this.on('scroll', (function(_this) {
        return function() {
          return _this.renderResults();
        };
      })(this));
      return this.on('resize', (function(_this) {
        return function() {
          return _this.renderResults();
        };
      })(this));
    };

    ResultsView.prototype.attached = function() {
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add(this.element, {
        'core:move-down': (function(_this) {
          return function() {
            _this.userMovedSelection = true;
            return _this.selectNextResult();
          };
        })(this),
        'core:move-up': (function(_this) {
          return function() {
            _this.userMovedSelection = true;
            return _this.selectPreviousResult();
          };
        })(this),
        'core:move-left': (function(_this) {
          return function() {
            return _this.collapseResult();
          };
        })(this),
        'core:move-right': (function(_this) {
          return function() {
            return _this.expandResult();
          };
        })(this),
        'core:page-up': (function(_this) {
          return function() {
            return _this.selectPreviousPage();
          };
        })(this),
        'core:page-down': (function(_this) {
          return function() {
            return _this.selectNextPage();
          };
        })(this),
        'core:move-to-top': (function(_this) {
          return function() {
            return _this.selectFirstResult();
          };
        })(this),
        'core:move-to-bottom': (function(_this) {
          return function() {
            _this.renderResults({
              renderAll: true
            });
            return _this.selectLastResult();
          };
        })(this),
        'core:confirm': (function(_this) {
          return function() {
            var ref1;
            if ((ref1 = _this.find('.selected').view()) != null) {
              if (typeof ref1.confirm === "function") {
                ref1.confirm();
              }
            }
            return false;
          };
        })(this),
        'core:copy': (function(_this) {
          return function() {
            var ref1;
            if ((ref1 = _this.find('.selected').view()) != null) {
              if (typeof ref1.copy === "function") {
                ref1.copy();
              }
            }
            return false;
          };
        })(this)
      }));
      this.subscriptions.add(this.model.onDidAddResult(this.addResult));
      this.subscriptions.add(this.model.onDidRemoveResult(this.removeResult));
      this.subscriptions.add(this.model.onDidClearSearchState(this.clear));
      return this.renderResults();
    };

    ResultsView.prototype.detached = function() {
      this.clear();
      return this.subscriptions.dispose();
    };

    ResultsView.prototype.hasResults = function() {
      return this.model.getResultCount() > 0;
    };

    ResultsView.prototype.addResult = function(arg) {
      var children, filePath, filePathInsertedIndex, result, resultView;
      filePath = arg.filePath, result = arg.result, filePathInsertedIndex = arg.filePathInsertedIndex;
      resultView = this.getResultView(filePath);
      if (resultView) {
        return resultView.renderResult(result);
      }
      if ((filePathInsertedIndex != null) && (filePathInsertedIndex < this.lastRenderedResultIndex || this.shouldRenderMoreResults())) {
        children = this.children();
        resultView = new ResultView(this.model, filePath, result);
        if (children.length === 0 || filePathInsertedIndex === children.length) {
          this.append(resultView);
        } else if (filePathInsertedIndex === 0) {
          this.prepend(resultView);
        } else {
          this.element.insertBefore(resultView.element, children[filePathInsertedIndex]);
        }
        this.lastRenderedResultIndex++;
      }
      if (!this.userMovedSelection || this.getPathCount() === 1) {
        return this.selectFirstResult();
      }
    };

    ResultsView.prototype.removeResult = function(arg) {
      var filePath, ref1;
      filePath = arg.filePath;
      return (ref1 = this.getResultView(filePath)) != null ? ref1.remove() : void 0;
    };

    ResultsView.prototype.renderResults = function(arg) {
      var filePath, i, initialIndex, len, paths, ref1, ref2, renderAll, renderNext, result, resultView;
      ref1 = arg != null ? arg : {}, renderAll = ref1.renderAll, renderNext = ref1.renderNext;
      if (!(renderAll || renderNext || this.shouldRenderMoreResults())) {
        return;
      }
      initialIndex = this.lastRenderedResultIndex;
      paths = this.model.getPaths();
      ref2 = paths.slice(this.lastRenderedResultIndex);
      for (i = 0, len = ref2.length; i < len; i++) {
        filePath = ref2[i];
        result = this.model.getResult(filePath);
        if (!renderAll && !renderNext && !this.shouldRenderMoreResults()) {
          break;
        } else if (renderNext === this.lastRenderedResultIndex - this.lastRenderedResultIndex) {
          break;
        }
        resultView = new ResultView(this.model, filePath, result);
        this.append(resultView);
        this.lastRenderedResultIndex++;
      }
      return null;
    };

    ResultsView.prototype.shouldRenderMoreResults = function() {
      return this.prop('scrollHeight') <= this.height() + this.pixelOverdraw || this.prop('scrollHeight') <= this.scrollBottom() + this.pixelOverdraw;
    };

    ResultsView.prototype.selectFirstResult = function() {
      this.selectResult(this.find('.search-result:first'));
      return this.scrollToTop();
    };

    ResultsView.prototype.selectLastResult = function() {
      this.selectResult(this.find('.search-result:last'));
      return this.scrollToBottom();
    };

    ResultsView.prototype.selectPreviousPage = function() {
      var index, itemHeight, pageHeight, previousIndex, previousView, resultsPerPage, selectedView, visibleItems;
      selectedView = this.find('.selected').view();
      if (!selectedView) {
        return this.selectFirstResult();
      }
      if (selectedView.hasClass('path')) {
        itemHeight = selectedView.find('.path-details').outerHeight();
      } else {
        itemHeight = selectedView.outerHeight();
      }
      pageHeight = this.innerHeight();
      resultsPerPage = Math.round(pageHeight / itemHeight);
      pageHeight = resultsPerPage * itemHeight;
      visibleItems = this.find('li:visible');
      index = visibleItems.index(selectedView);
      previousIndex = Math.max(index - resultsPerPage, 0);
      previousView = $(visibleItems[previousIndex]);
      this.selectResult(previousView);
      this.scrollTop(this.scrollTop() - pageHeight);
      return this.scrollTo(previousView);
    };

    ResultsView.prototype.selectNextPage = function() {
      var index, itemHeight, nextIndex, nextView, pageHeight, resultsPerPage, selectedView, visibleItems;
      selectedView = this.find('.selected').view();
      if (!selectedView) {
        return this.selectFirstResult();
      }
      if (selectedView.hasClass('path')) {
        itemHeight = selectedView.find('.path-details').outerHeight();
      } else {
        itemHeight = selectedView.outerHeight();
      }
      pageHeight = this.innerHeight();
      resultsPerPage = Math.round(pageHeight / itemHeight);
      pageHeight = resultsPerPage * itemHeight;
      this.renderResults({
        renderNext: resultsPerPage + 1
      });
      visibleItems = this.find('li:visible');
      index = visibleItems.index(selectedView);
      nextIndex = Math.min(index + resultsPerPage, visibleItems.length - 1);
      nextView = $(visibleItems[nextIndex]);
      this.selectResult(nextView);
      this.scrollTop(this.scrollTop() + pageHeight);
      return this.scrollTo(nextView);
    };

    ResultsView.prototype.selectNextResult = function() {
      var nextView, selectedView;
      selectedView = this.find('.selected').view();
      if (!selectedView) {
        return this.selectFirstResult();
      }
      nextView = this.getNextVisible(selectedView);
      this.selectResult(nextView);
      return this.scrollTo(nextView);
    };

    ResultsView.prototype.selectPreviousResult = function() {
      var prevView, selectedView;
      selectedView = this.find('.selected').view();
      if (!selectedView) {
        return this.selectFirstResult();
      }
      prevView = this.getPreviousVisible(selectedView);
      this.selectResult(prevView);
      return this.scrollTo(prevView);
    };

    ResultsView.prototype.getNextVisible = function(element) {
      var itemIndex, visibleItems;
      if (!(element != null ? element.length : void 0)) {
        return;
      }
      visibleItems = this.find('li:visible');
      itemIndex = visibleItems.index(element);
      return $(visibleItems[Math.min(itemIndex + 1, visibleItems.length - 1)]);
    };

    ResultsView.prototype.getPreviousVisible = function(element) {
      var itemIndex, visibleItems;
      if (!(element != null ? element.length : void 0)) {
        return;
      }
      visibleItems = this.find('li:visible');
      itemIndex = visibleItems.index(element);
      return $(visibleItems[Math.max(itemIndex - 1, 0)]);
    };

    ResultsView.prototype.selectResult = function(resultView) {
      var parentView;
      if (!(resultView != null ? resultView.length : void 0)) {
        return;
      }
      this.find('.selected').removeClass('selected');
      if (!resultView.hasClass('path')) {
        parentView = resultView.closest('.path');
        if (parentView.hasClass('collapsed')) {
          resultView = parentView;
        }
      }
      return resultView.addClass('selected');
    };

    ResultsView.prototype.collapseResult = function() {
      var parent;
      parent = this.find('.selected').closest('.path').view();
      if (parent instanceof ResultView) {
        parent.expand(false);
      }
      return this.renderResults();
    };

    ResultsView.prototype.collapseAllResults = function() {
      this.renderResults({
        renderAll: true
      });
      return this.find('.path').views().forEach(function(view) {
        return view.expand(false);
      });
    };

    ResultsView.prototype.expandResult = function() {
      var selectedView;
      selectedView = this.find('.selected').view();
      if (selectedView instanceof ResultView) {
        selectedView.expand(true);
      }
      return this.renderResults();
    };

    ResultsView.prototype.expandAllResults = function() {
      this.renderResults({
        renderAll: true
      });
      return this.find('.path').views().forEach(function(view) {
        return view.expand(true);
      });
    };

    ResultsView.prototype.getPathCount = function() {
      return this.model.getPathCount();
    };

    ResultsView.prototype.getMatchCount = function() {
      return this.model.getMatchCount();
    };

    ResultsView.prototype.clear = function() {
      this.userMovedSelection = false;
      this.lastRenderedResultIndex = 0;
      return this.empty();
    };

    ResultsView.prototype.scrollTo = function(element) {
      var bottom, top;
      if (!(element != null ? element.length : void 0)) {
        return;
      }
      top = this.scrollTop() + element.offset().top - this.offset().top;
      bottom = top + element.outerHeight();
      if (bottom > this.scrollBottom()) {
        this.scrollBottom(bottom);
      }
      if (top < this.scrollTop()) {
        return this.scrollTop(top);
      }
    };

    ResultsView.prototype.scrollToBottom = function() {
      this.renderResults({
        renderAll: true
      });
      return ResultsView.__super__.scrollToBottom.call(this);
    };

    ResultsView.prototype.scrollToTop = function() {
      return ResultsView.__super__.scrollToTop.call(this);
    };

    ResultsView.prototype.getResultView = function(filePath) {
      var el;
      el = this.find("[data-path=\"" + (_.escapeAttribute(filePath)) + "\"]");
      if (el.length) {
        return el.view();
      } else {
        return null;
      }
    };

    return ResultsView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L3Jlc3VsdHMtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1FQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsTUFBa0IsT0FBQSxDQUFRLHNCQUFSLENBQWxCLEVBQUMsU0FBRCxFQUFJOztFQUNKLFVBQUEsR0FBYSxPQUFBLENBQVEsZUFBUjs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7Ozs7O0lBQ0osV0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEVBQUQsQ0FBSTtRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUVBQVA7UUFBMEUsUUFBQSxFQUFVLENBQUMsQ0FBckY7T0FBSjtJQURROzswQkFHVixVQUFBLEdBQVksU0FBQyxLQUFEO0FBQ1YsVUFBQTtNQURXLElBQUMsQ0FBQSxRQUFEO01BQ1gsa0JBQUEsR0FBcUIsMENBQUE7TUFDckIsa0JBQWtCLENBQUMsT0FBbkIsQ0FBQTtNQUVBLElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSx1QkFBRCxHQUEyQjtNQUUzQixJQUFDLENBQUEsRUFBRCxDQUFJLFdBQUosRUFBaUIsT0FBakIsRUFBMEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7QUFDeEIsY0FBQTtVQUFBLEtBQUMsQ0FBQSxJQUFELENBQU0sV0FBTixDQUFrQixDQUFDLFdBQW5CLENBQStCLFVBQS9CO1VBQ0EsSUFBQSxHQUFPLENBQUEsQ0FBRSxDQUFDLENBQUMsTUFBSixDQUFXLENBQUMsSUFBWixDQUFBO1VB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LENBQUMsTUFBTjtlQUFrQixFQUFFLENBQUMsSUFBSCxDQUFBLEVBQWxCO09BQUEsTUFBQTtlQUFpQyxLQUFqQzs7SUFGYTs7OztLQXpQUztBQU4xQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsIFNjcm9sbFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5SZXN1bHRWaWV3ID0gcmVxdWlyZSAnLi9yZXN1bHQtdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUmVzdWx0c1ZpZXcgZXh0ZW5kcyBTY3JvbGxWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBvbCBjbGFzczogJ3Jlc3VsdHMtdmlldyBsaXN0LXRyZWUgZm9jdXNhYmxlLXBhbmVsIGhhcy1jb2xsYXBzYWJsZS1jaGlsZHJlbicsIHRhYmluZGV4OiAtMVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwpIC0+XG4gICAgY29tbWFuZHNEaXNwb3NhYmxlID0gc3VwZXIoKVxuICAgIGNvbW1hbmRzRGlzcG9zYWJsZS5kaXNwb3NlKCkgIyB0dXJuIG9mZiBkZWZhdWx0IHNjcm9sbGluZyBiZWhhdmlvciBmcm9tIFNjcm9sbFZpZXdcblxuICAgIEBwaXhlbE92ZXJkcmF3ID0gMTAwXG4gICAgQGxhc3RSZW5kZXJlZFJlc3VsdEluZGV4ID0gMFxuXG4gICAgQG9uICdtb3VzZWRvd24nLCAnLnBhdGgnLCAoZSkgPT5cbiAgICAgIEBmaW5kKCcuc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgdmlldyA9ICQoZS50YXJnZXQpLnZpZXcoKVxuICAgICAgdmlldy5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgaWYgbm90IGUuY3RybEtleVxuICAgICAgICBpZiBlLm9yaWdpbmFsRXZlbnQ/LmRldGFpbCBpcyAxXG4gICAgICAgICAgdmlldy5jb25maXJtKHBlbmRpbmc6IHRydWUpXG4gICAgICAgIGVsc2UgaWYgZS5vcmlnaW5hbEV2ZW50Py5kZXRhaWwgaXMgMlxuICAgICAgICAgIHZpZXcuY29uZmlybSgpIHVubGVzcyB2aWV3IGluc3RhbmNlb2YgUmVzdWx0Vmlld1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEByZW5kZXJSZXN1bHRzKClcblxuICAgIEBvbiAnc2Nyb2xsJywgPT4gQHJlbmRlclJlc3VsdHMoKVxuICAgIEBvbiAncmVzaXplJywgPT4gQHJlbmRlclJlc3VsdHMoKVxuXG4gIGF0dGFjaGVkOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVsZW1lbnQsXG4gICAgICAnY29yZTptb3ZlLWRvd24nOiA9PlxuICAgICAgICBAdXNlck1vdmVkU2VsZWN0aW9uID0gdHJ1ZVxuICAgICAgICBAc2VsZWN0TmV4dFJlc3VsdCgpXG4gICAgICAnY29yZTptb3ZlLXVwJzogPT5cbiAgICAgICAgQHVzZXJNb3ZlZFNlbGVjdGlvbiA9IHRydWVcbiAgICAgICAgQHNlbGVjdFByZXZpb3VzUmVzdWx0KClcbiAgICAgICdjb3JlOm1vdmUtbGVmdCc6ID0+IEBjb2xsYXBzZVJlc3VsdCgpXG4gICAgICAnY29yZTptb3ZlLXJpZ2h0JzogPT4gQGV4cGFuZFJlc3VsdCgpXG4gICAgICAnY29yZTpwYWdlLXVwJzogPT4gQHNlbGVjdFByZXZpb3VzUGFnZSgpXG4gICAgICAnY29yZTpwYWdlLWRvd24nOiA9PiBAc2VsZWN0TmV4dFBhZ2UoKVxuICAgICAgJ2NvcmU6bW92ZS10by10b3AnOiA9PlxuICAgICAgICBAc2VsZWN0Rmlyc3RSZXN1bHQoKVxuICAgICAgJ2NvcmU6bW92ZS10by1ib3R0b20nOiA9PlxuICAgICAgICBAcmVuZGVyUmVzdWx0cyhyZW5kZXJBbGw6IHRydWUpXG4gICAgICAgIEBzZWxlY3RMYXN0UmVzdWx0KClcbiAgICAgICdjb3JlOmNvbmZpcm0nOiA9PlxuICAgICAgICBAZmluZCgnLnNlbGVjdGVkJykudmlldygpPy5jb25maXJtPygpXG4gICAgICAgIGZhbHNlXG4gICAgICAnY29yZTpjb3B5JzogPT5cbiAgICAgICAgQGZpbmQoJy5zZWxlY3RlZCcpLnZpZXcoKT8uY29weT8oKVxuICAgICAgICBmYWxzZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZEFkZFJlc3VsdCBAYWRkUmVzdWx0XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZFJlbW92ZVJlc3VsdCBAcmVtb3ZlUmVzdWx0XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtb2RlbC5vbkRpZENsZWFyU2VhcmNoU3RhdGUgQGNsZWFyXG5cbiAgICBAcmVuZGVyUmVzdWx0cygpXG5cbiAgZGV0YWNoZWQ6IC0+XG4gICAgQGNsZWFyKClcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBoYXNSZXN1bHRzOiAtPlxuICAgIEBtb2RlbC5nZXRSZXN1bHRDb3VudCgpID4gMFxuXG4gIGFkZFJlc3VsdDogKHtmaWxlUGF0aCwgcmVzdWx0LCBmaWxlUGF0aEluc2VydGVkSW5kZXh9KSA9PlxuICAgIHJlc3VsdFZpZXcgPSBAZ2V0UmVzdWx0VmlldyhmaWxlUGF0aClcbiAgICByZXR1cm4gcmVzdWx0Vmlldy5yZW5kZXJSZXN1bHQocmVzdWx0KSBpZiByZXN1bHRWaWV3XG5cbiAgICBpZiBmaWxlUGF0aEluc2VydGVkSW5kZXg/IGFuZCAoZmlsZVBhdGhJbnNlcnRlZEluZGV4IDwgQGxhc3RSZW5kZXJlZFJlc3VsdEluZGV4IG9yIEBzaG91bGRSZW5kZXJNb3JlUmVzdWx0cygpKVxuICAgICAgY2hpbGRyZW4gPSBAY2hpbGRyZW4oKVxuICAgICAgcmVzdWx0VmlldyA9IG5ldyBSZXN1bHRWaWV3KEBtb2RlbCwgZmlsZVBhdGgsIHJlc3VsdClcblxuICAgICAgaWYgY2hpbGRyZW4ubGVuZ3RoIGlzIDAgb3IgZmlsZVBhdGhJbnNlcnRlZEluZGV4IGlzIGNoaWxkcmVuLmxlbmd0aFxuICAgICAgICBAYXBwZW5kKHJlc3VsdFZpZXcpXG4gICAgICBlbHNlIGlmIGZpbGVQYXRoSW5zZXJ0ZWRJbmRleCBpcyAwXG4gICAgICAgIEBwcmVwZW5kKHJlc3VsdFZpZXcpXG4gICAgICBlbHNlXG4gICAgICAgIEBlbGVtZW50Lmluc2VydEJlZm9yZShyZXN1bHRWaWV3LmVsZW1lbnQsIGNoaWxkcmVuW2ZpbGVQYXRoSW5zZXJ0ZWRJbmRleF0pXG5cbiAgICAgIEBsYXN0UmVuZGVyZWRSZXN1bHRJbmRleCsrXG5cbiAgICBAc2VsZWN0Rmlyc3RSZXN1bHQoKSBpZiBub3QgQHVzZXJNb3ZlZFNlbGVjdGlvbiBvciBAZ2V0UGF0aENvdW50KCkgaXMgMVxuXG4gIHJlbW92ZVJlc3VsdDogKHtmaWxlUGF0aH0pID0+XG4gICAgQGdldFJlc3VsdFZpZXcoZmlsZVBhdGgpPy5yZW1vdmUoKVxuXG4gIHJlbmRlclJlc3VsdHM6ICh7cmVuZGVyQWxsLCByZW5kZXJOZXh0fT17fSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJlbmRlckFsbCBvciByZW5kZXJOZXh0IG9yIEBzaG91bGRSZW5kZXJNb3JlUmVzdWx0cygpXG5cbiAgICBpbml0aWFsSW5kZXggPSBAbGFzdFJlbmRlcmVkUmVzdWx0SW5kZXhcblxuICAgIHBhdGhzID0gQG1vZGVsLmdldFBhdGhzKClcbiAgICBmb3IgZmlsZVBhdGggaW4gcGF0aHNbQGxhc3RSZW5kZXJlZFJlc3VsdEluZGV4Li5dXG4gICAgICByZXN1bHQgPSBAbW9kZWwuZ2V0UmVzdWx0KGZpbGVQYXRoKVxuICAgICAgaWYgbm90IHJlbmRlckFsbCBhbmQgbm90IHJlbmRlck5leHQgYW5kIG5vdCBAc2hvdWxkUmVuZGVyTW9yZVJlc3VsdHMoKVxuICAgICAgICBicmVha1xuICAgICAgZWxzZSBpZiByZW5kZXJOZXh0IGlzIEBsYXN0UmVuZGVyZWRSZXN1bHRJbmRleCAtIEBsYXN0UmVuZGVyZWRSZXN1bHRJbmRleFxuICAgICAgICBicmVha1xuICAgICAgcmVzdWx0VmlldyA9IG5ldyBSZXN1bHRWaWV3KEBtb2RlbCwgZmlsZVBhdGgsIHJlc3VsdClcbiAgICAgIEBhcHBlbmQocmVzdWx0VmlldylcbiAgICAgIEBsYXN0UmVuZGVyZWRSZXN1bHRJbmRleCsrXG5cbiAgICBudWxsICMgZG9udCByZXR1cm4gYW4gYXJyYXlcblxuICBzaG91bGRSZW5kZXJNb3JlUmVzdWx0czogLT5cbiAgICBAcHJvcCgnc2Nyb2xsSGVpZ2h0JykgPD0gQGhlaWdodCgpICsgQHBpeGVsT3ZlcmRyYXcgb3IgQHByb3AoJ3Njcm9sbEhlaWdodCcpIDw9IEBzY3JvbGxCb3R0b20oKSArIEBwaXhlbE92ZXJkcmF3XG5cbiAgc2VsZWN0Rmlyc3RSZXN1bHQ6IC0+XG4gICAgQHNlbGVjdFJlc3VsdChAZmluZCgnLnNlYXJjaC1yZXN1bHQ6Zmlyc3QnKSlcbiAgICBAc2Nyb2xsVG9Ub3AoKVxuXG4gIHNlbGVjdExhc3RSZXN1bHQ6IC0+XG4gICAgQHNlbGVjdFJlc3VsdChAZmluZCgnLnNlYXJjaC1yZXN1bHQ6bGFzdCcpKVxuICAgIEBzY3JvbGxUb0JvdHRvbSgpXG5cbiAgc2VsZWN0UHJldmlvdXNQYWdlOiAtPlxuICAgIHNlbGVjdGVkVmlldyA9IEBmaW5kKCcuc2VsZWN0ZWQnKS52aWV3KClcbiAgICByZXR1cm4gQHNlbGVjdEZpcnN0UmVzdWx0KCkgdW5sZXNzIHNlbGVjdGVkVmlld1xuXG4gICAgaWYgc2VsZWN0ZWRWaWV3Lmhhc0NsYXNzKCdwYXRoJylcbiAgICAgIGl0ZW1IZWlnaHQgPSBzZWxlY3RlZFZpZXcuZmluZCgnLnBhdGgtZGV0YWlscycpLm91dGVySGVpZ2h0KClcbiAgICBlbHNlXG4gICAgICBpdGVtSGVpZ2h0ID0gc2VsZWN0ZWRWaWV3Lm91dGVySGVpZ2h0KClcbiAgICBwYWdlSGVpZ2h0ID0gQGlubmVySGVpZ2h0KClcbiAgICByZXN1bHRzUGVyUGFnZSA9IE1hdGgucm91bmQocGFnZUhlaWdodCAvIGl0ZW1IZWlnaHQpXG4gICAgcGFnZUhlaWdodCA9IHJlc3VsdHNQZXJQYWdlICogaXRlbUhlaWdodCAjIHNvIGl0J3MgZGl2aXNpYmxlIGJ5IHRoZSBudW1iZXIgb2YgaXRlbXNcblxuICAgIHZpc2libGVJdGVtcyA9IEBmaW5kKCdsaTp2aXNpYmxlJylcbiAgICBpbmRleCA9IHZpc2libGVJdGVtcy5pbmRleChzZWxlY3RlZFZpZXcpXG5cbiAgICBwcmV2aW91c0luZGV4ID0gTWF0aC5tYXgoaW5kZXggLSByZXN1bHRzUGVyUGFnZSAsIDApXG4gICAgcHJldmlvdXNWaWV3ID0gJCh2aXNpYmxlSXRlbXNbcHJldmlvdXNJbmRleF0pXG5cbiAgICBAc2VsZWN0UmVzdWx0KHByZXZpb3VzVmlldylcbiAgICBAc2Nyb2xsVG9wKEBzY3JvbGxUb3AoKSAtIHBhZ2VIZWlnaHQpXG4gICAgQHNjcm9sbFRvKHByZXZpb3VzVmlldykgIyBqdXN0IGluIGNhc2UgdGhlIHNjcm9sbHRvcCBtaXNzZXMgdGhlIG1hcmtcblxuICBzZWxlY3ROZXh0UGFnZTogLT5cbiAgICBzZWxlY3RlZFZpZXcgPSBAZmluZCgnLnNlbGVjdGVkJykudmlldygpXG4gICAgcmV0dXJuIEBzZWxlY3RGaXJzdFJlc3VsdCgpIHVubGVzcyBzZWxlY3RlZFZpZXdcblxuICAgIGlmIHNlbGVjdGVkVmlldy5oYXNDbGFzcygncGF0aCcpXG4gICAgICBpdGVtSGVpZ2h0ID0gc2VsZWN0ZWRWaWV3LmZpbmQoJy5wYXRoLWRldGFpbHMnKS5vdXRlckhlaWdodCgpXG4gICAgZWxzZVxuICAgICAgaXRlbUhlaWdodCA9IHNlbGVjdGVkVmlldy5vdXRlckhlaWdodCgpXG4gICAgcGFnZUhlaWdodCA9IEBpbm5lckhlaWdodCgpXG4gICAgcmVzdWx0c1BlclBhZ2UgPSBNYXRoLnJvdW5kKHBhZ2VIZWlnaHQgLyBpdGVtSGVpZ2h0KVxuICAgIHBhZ2VIZWlnaHQgPSByZXN1bHRzUGVyUGFnZSAqIGl0ZW1IZWlnaHQgIyBzbyBpdCdzIGRpdmlzaWJsZSBieSB0aGUgbnVtYmVyIG9mIGl0ZW1zXG5cbiAgICBAcmVuZGVyUmVzdWx0cyhyZW5kZXJOZXh0OiByZXN1bHRzUGVyUGFnZSArIDEpXG5cbiAgICB2aXNpYmxlSXRlbXMgPSBAZmluZCgnbGk6dmlzaWJsZScpXG4gICAgaW5kZXggPSB2aXNpYmxlSXRlbXMuaW5kZXgoc2VsZWN0ZWRWaWV3KVxuXG4gICAgbmV4dEluZGV4ID0gTWF0aC5taW4oaW5kZXggKyByZXN1bHRzUGVyUGFnZSwgdmlzaWJsZUl0ZW1zLmxlbmd0aCAtIDEpXG4gICAgbmV4dFZpZXcgPSAkKHZpc2libGVJdGVtc1tuZXh0SW5kZXhdKVxuXG4gICAgQHNlbGVjdFJlc3VsdChuZXh0VmlldylcbiAgICBAc2Nyb2xsVG9wKEBzY3JvbGxUb3AoKSArIHBhZ2VIZWlnaHQpXG4gICAgQHNjcm9sbFRvKG5leHRWaWV3KSAjIGp1c3QgaW4gY2FzZSB0aGUgc2Nyb2xsdG9wIG1pc3NlcyB0aGUgbWFya1xuXG4gIHNlbGVjdE5leHRSZXN1bHQ6IC0+XG4gICAgc2VsZWN0ZWRWaWV3ID0gQGZpbmQoJy5zZWxlY3RlZCcpLnZpZXcoKVxuICAgIHJldHVybiBAc2VsZWN0Rmlyc3RSZXN1bHQoKSB1bmxlc3Mgc2VsZWN0ZWRWaWV3XG5cbiAgICBuZXh0VmlldyA9IEBnZXROZXh0VmlzaWJsZShzZWxlY3RlZFZpZXcpXG5cbiAgICBAc2VsZWN0UmVzdWx0KG5leHRWaWV3KVxuICAgIEBzY3JvbGxUbyhuZXh0VmlldylcblxuICBzZWxlY3RQcmV2aW91c1Jlc3VsdDogLT5cbiAgICBzZWxlY3RlZFZpZXcgPSBAZmluZCgnLnNlbGVjdGVkJykudmlldygpXG4gICAgcmV0dXJuIEBzZWxlY3RGaXJzdFJlc3VsdCgpIHVubGVzcyBzZWxlY3RlZFZpZXdcblxuICAgIHByZXZWaWV3ID0gQGdldFByZXZpb3VzVmlzaWJsZShzZWxlY3RlZFZpZXcpXG5cbiAgICBAc2VsZWN0UmVzdWx0KHByZXZWaWV3KVxuICAgIEBzY3JvbGxUbyhwcmV2VmlldylcblxuICBnZXROZXh0VmlzaWJsZTogKGVsZW1lbnQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlbGVtZW50Py5sZW5ndGhcbiAgICB2aXNpYmxlSXRlbXMgPSBAZmluZCgnbGk6dmlzaWJsZScpXG4gICAgaXRlbUluZGV4ID0gdmlzaWJsZUl0ZW1zLmluZGV4KGVsZW1lbnQpXG4gICAgJCh2aXNpYmxlSXRlbXNbTWF0aC5taW4oaXRlbUluZGV4ICsgMSwgdmlzaWJsZUl0ZW1zLmxlbmd0aCAtIDEpXSlcblxuICBnZXRQcmV2aW91c1Zpc2libGU6IChlbGVtZW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxlbWVudD8ubGVuZ3RoXG4gICAgdmlzaWJsZUl0ZW1zID0gQGZpbmQoJ2xpOnZpc2libGUnKVxuICAgIGl0ZW1JbmRleCA9IHZpc2libGVJdGVtcy5pbmRleChlbGVtZW50KVxuICAgICQodmlzaWJsZUl0ZW1zW01hdGgubWF4KGl0ZW1JbmRleCAtIDEsIDApXSlcblxuICBzZWxlY3RSZXN1bHQ6IChyZXN1bHRWaWV3KSAtPlxuICAgIHJldHVybiB1bmxlc3MgcmVzdWx0Vmlldz8ubGVuZ3RoXG4gICAgQGZpbmQoJy5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXG5cbiAgICB1bmxlc3MgcmVzdWx0Vmlldy5oYXNDbGFzcygncGF0aCcpXG4gICAgICBwYXJlbnRWaWV3ID0gcmVzdWx0Vmlldy5jbG9zZXN0KCcucGF0aCcpXG4gICAgICByZXN1bHRWaWV3ID0gcGFyZW50VmlldyBpZiBwYXJlbnRWaWV3Lmhhc0NsYXNzKCdjb2xsYXBzZWQnKVxuXG4gICAgcmVzdWx0Vmlldy5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuXG4gIGNvbGxhcHNlUmVzdWx0OiAtPlxuICAgIHBhcmVudCA9IEBmaW5kKCcuc2VsZWN0ZWQnKS5jbG9zZXN0KCcucGF0aCcpLnZpZXcoKVxuICAgIHBhcmVudC5leHBhbmQoZmFsc2UpIGlmIHBhcmVudCBpbnN0YW5jZW9mIFJlc3VsdFZpZXdcbiAgICBAcmVuZGVyUmVzdWx0cygpXG5cbiAgY29sbGFwc2VBbGxSZXN1bHRzOiAtPlxuICAgIEByZW5kZXJSZXN1bHRzKHJlbmRlckFsbDogdHJ1ZSkgIyB3aXRob3V0IHRoaXMsIG5vdCBhbGwgdmlld3Mgd2lsbCBiZSBhZmZlY3RlZFxuICAgIEBmaW5kKCcucGF0aCcpLnZpZXdzKCkuZm9yRWFjaChcbiAgICAgICh2aWV3KSAtPiB2aWV3LmV4cGFuZChmYWxzZSlcbiAgICApXG5cbiAgZXhwYW5kUmVzdWx0OiAtPlxuICAgIHNlbGVjdGVkVmlldyA9IEBmaW5kKCcuc2VsZWN0ZWQnKS52aWV3KClcbiAgICBzZWxlY3RlZFZpZXcuZXhwYW5kKHRydWUpIGlmIHNlbGVjdGVkVmlldyBpbnN0YW5jZW9mIFJlc3VsdFZpZXdcbiAgICBAcmVuZGVyUmVzdWx0cygpXG5cbiAgZXhwYW5kQWxsUmVzdWx0czogLT5cbiAgICBAcmVuZGVyUmVzdWx0cyhyZW5kZXJBbGw6IHRydWUpICMgd2l0aG91dCB0aGlzLCBub3QgYWxsIHZpZXdzIHdpbGwgYmUgYWZmZWN0ZWRcbiAgICBAZmluZCgnLnBhdGgnKS52aWV3cygpLmZvckVhY2goXG4gICAgICAodmlldykgLT4gdmlldy5leHBhbmQodHJ1ZSlcbiAgICApXG5cbiAgZ2V0UGF0aENvdW50OiAtPlxuICAgIEBtb2RlbC5nZXRQYXRoQ291bnQoKVxuXG4gIGdldE1hdGNoQ291bnQ6IC0+XG4gICAgQG1vZGVsLmdldE1hdGNoQ291bnQoKVxuXG4gIGNsZWFyOiA9PlxuICAgIEB1c2VyTW92ZWRTZWxlY3Rpb24gPSBmYWxzZVxuICAgIEBsYXN0UmVuZGVyZWRSZXN1bHRJbmRleCA9IDBcbiAgICBAZW1wdHkoKVxuXG4gIHNjcm9sbFRvOiAoZWxlbWVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsZW1lbnQ/Lmxlbmd0aFxuICAgIHRvcCA9IEBzY3JvbGxUb3AoKSArIGVsZW1lbnQub2Zmc2V0KCkudG9wIC0gQG9mZnNldCgpLnRvcFxuICAgIGJvdHRvbSA9IHRvcCArIGVsZW1lbnQub3V0ZXJIZWlnaHQoKVxuXG4gICAgQHNjcm9sbEJvdHRvbShib3R0b20pIGlmIGJvdHRvbSA+IEBzY3JvbGxCb3R0b20oKVxuICAgIEBzY3JvbGxUb3AodG9wKSBpZiB0b3AgPCBAc2Nyb2xsVG9wKClcblxuICBzY3JvbGxUb0JvdHRvbTogLT5cbiAgICBAcmVuZGVyUmVzdWx0cyhyZW5kZXJBbGw6IHRydWUpXG4gICAgc3VwZXIoKVxuXG4gIHNjcm9sbFRvVG9wOiAtPlxuICAgIHN1cGVyKClcblxuICBnZXRSZXN1bHRWaWV3OiAoZmlsZVBhdGgpIC0+XG4gICAgZWwgPSBAZmluZChcIltkYXRhLXBhdGg9XFxcIiN7Xy5lc2NhcGVBdHRyaWJ1dGUoZmlsZVBhdGgpfVxcXCJdXCIpXG4gICAgaWYgZWwubGVuZ3RoIHRoZW4gZWwudmlldygpIGVsc2UgbnVsbFxuIl19
