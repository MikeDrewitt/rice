(function() {
  var $, FileIcons, MatchView, ResultView, View, _, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, View = ref.View;

  FileIcons = require('../file-icons');

  MatchView = require('./match-view');

  path = require('path');

  module.exports = ResultView = (function(superClass) {
    extend(ResultView, superClass);

    function ResultView() {
      return ResultView.__super__.constructor.apply(this, arguments);
    }

    ResultView.content = function(model, filePath, result) {
      var fileBasename, iconClass, ref1, relativePath, rootPath;
      iconClass = FileIcons.getService().iconClassForPath(filePath, "find-and-replace") || [];
      if (!Array.isArray(iconClass)) {
        iconClass = iconClass != null ? iconClass.toString().split(/\s+/g) : void 0;
      }
      fileBasename = path.basename(filePath);
      if (atom.project != null) {
        ref1 = atom.project.relativizePath(filePath), rootPath = ref1[0], relativePath = ref1[1];
        if ((rootPath != null) && atom.project.getDirectories().length > 1) {
          relativePath = path.join(path.basename(rootPath), relativePath);
        }
      } else {
        relativePath = filePath;
      }
      return this.li({
        "class": 'path list-nested-item',
        'data-path': _.escapeAttribute(filePath)
      }, (function(_this) {
        return function() {
          _this.div({
            outlet: 'pathDetails',
            "class": 'path-details list-item'
          }, function() {
            _this.span({
              "class": 'disclosure-arrow'
            });
            _this.span({
              "class": iconClass.join(' ') + ' icon',
              'data-name': fileBasename
            });
            _this.span({
              "class": 'path-name bright'
            }, relativePath);
            return _this.span({
              outlet: 'description',
              "class": 'path-match-number'
            });
          });
          return _this.ul({
            outlet: 'matches',
            "class": 'matches list-tree'
          });
        };
      })(this));
    };

    ResultView.prototype.initialize = function(model1, filePath1, result) {
      this.model = model1;
      this.filePath = filePath1;
      this.isExpanded = true;
      return this.renderResult(result);
    };

    ResultView.prototype.renderResult = function(result) {
      var i, len, match, matches, selectedIndex;
      matches = result != null ? result.matches : void 0;
      selectedIndex = this.matches.find('.selected').index();
      this.matches.empty();
      if (result) {
        this.description.show().text("(" + (matches != null ? matches.length : void 0) + ")");
      } else {
        this.description.hide();
      }
      if (!matches || matches.length === 0) {
        this.hide();
      } else {
        this.show();
        for (i = 0, len = matches.length; i < len; i++) {
          match = matches[i];
          this.matches.append(new MatchView(this.model, {
            filePath: this.filePath,
            match: match
          }));
        }
      }
      if (selectedIndex > -1) {
        return this.matches.children().eq(selectedIndex).addClass('selected');
      }
    };

    ResultView.prototype.expand = function(expanded) {
      var firstResult, resultView, selected, selectedItem;
      if (expanded) {
        this.removeClass('collapsed');
        if (this.hasClass('selected')) {
          this.removeClass('selected');
          firstResult = this.find('.search-result:first').view();
          firstResult.addClass('selected');
          resultView = firstResult.closest('.results-view').view();
          resultView.scrollTo(firstResult);
        }
      } else {
        this.addClass('collapsed');
        selected = this.find('.selected').view();
        if (selected != null) {
          selected.removeClass('selected');
          this.addClass('selected');
          resultView = this.closest('.results-view').view();
          resultView.scrollTo(this);
        }
        selectedItem = this.find('.selected').view();
      }
      return this.isExpanded = expanded;
    };

    ResultView.prototype.confirm = function() {
      this.expand(!this.isExpanded);
      return null;
    };

    return ResultView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L3Jlc3VsdC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdURBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFZLE9BQUEsQ0FBUSxzQkFBUixDQUFaLEVBQUMsU0FBRCxFQUFJOztFQUNKLFNBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjs7RUFDWixTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBQ1osSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixVQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsS0FBRCxFQUFRLFFBQVIsRUFBa0IsTUFBbEI7QUFDUixVQUFBO01BQUEsU0FBQSxHQUFZLFNBQVMsQ0FBQyxVQUFWLENBQUEsQ0FBc0IsQ0FBQyxnQkFBdkIsQ0FBd0MsUUFBeEMsRUFBa0Qsa0JBQWxELENBQUEsSUFBeUU7TUFDckYsSUFBQSxDQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBZCxDQUFQO1FBQ0UsU0FBQSx1QkFBWSxTQUFTLENBQUUsUUFBWCxDQUFBLENBQXFCLENBQUMsS0FBdEIsQ0FBNEIsTUFBNUIsV0FEZDs7TUFFQSxZQUFBLEdBQWUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxRQUFkO01BRWYsSUFBRyxvQkFBSDtRQUNFLE9BQTJCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYixDQUE0QixRQUE1QixDQUEzQixFQUFDLGtCQUFELEVBQVc7UUFDWCxJQUFHLGtCQUFBLElBQWMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQUEsQ0FBNkIsQ0FBQyxNQUE5QixHQUF1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O1FBQ0UsSUFBQyxDQUFBLFdBQUQsQ0FBYSxXQUFiO1FBRUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLFVBQVYsQ0FBSDtVQUNFLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYjtVQUNBLFdBQUEsR0FBYyxJQUFDLENBQUEsSUFBRCxDQUFNLHNCQUFOLENBQTZCLENBQUMsSUFBOUIsQ0FBQTtVQUNkLFdBQVcsQ0FBQyxRQUFaLENBQXFCLFVBQXJCO1VBR0EsVUFBQSxHQUFhLFdBQVcsQ0FBQyxPQUFaLENBQW9CLGVBQXBCLENBQW9DLENBQUMsSUFBckMsQ0FBQTtVQUNiLFVBQVUsQ0FBQyxRQUFYLENBQW9CLFdBQXBCLEVBUEY7U0FIRjtPQUFBLE1BQUE7UUFhRSxJQUFDLENBQUEsUUFBRCxDQUFVLFdBQVY7UUFFQSxRQUFBLEdBQVcsSUFBQyxDQUFBLElBQUQsQ0FBTSxXQUFOLENBQWtCLENBQUMsSUFBbkIsQ0FBQTtRQUNYLElBQUcsZ0JBQUg7VUFDRSxRQUFRLENBQUMsV0FBVCxDQUFxQixVQUFyQjtVQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsVUFBVjtVQUVBLFVBQUEsR0FBYSxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBeUIsQ0FBQyxJQUExQixDQUFBO1VBQ2IsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsSUFBcEIsRUFMRjs7UUFPQSxZQUFBLEdBQWUsSUFBQyxDQUFBLElBQUQsQ0FBTSxXQUFOLENBQWtCLENBQUMsSUFBbkIsQ0FBQSxFQXZCakI7O2FBeUJBLElBQUMsQ0FBQSxVQUFELEdBQWM7SUEzQlI7O3lCQTZCUixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBSSxJQUFDLENBQUEsVUFBYjthQUNBO0lBRk87Ozs7S0EzRWM7QUFQekIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xueyQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5GaWxlSWNvbnMgPSByZXF1aXJlICcuLi9maWxlLWljb25zJ1xuTWF0Y2hWaWV3ID0gcmVxdWlyZSAnLi9tYXRjaC12aWV3J1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFJlc3VsdFZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAobW9kZWwsIGZpbGVQYXRoLCByZXN1bHQpIC0+XG4gICAgaWNvbkNsYXNzID0gRmlsZUljb25zLmdldFNlcnZpY2UoKS5pY29uQ2xhc3NGb3JQYXRoKGZpbGVQYXRoLCBcImZpbmQtYW5kLXJlcGxhY2VcIikgb3IgW11cbiAgICB1bmxlc3MgQXJyYXkuaXNBcnJheSBpY29uQ2xhc3NcbiAgICAgIGljb25DbGFzcyA9IGljb25DbGFzcz8udG9TdHJpbmcoKS5zcGxpdCgvXFxzKy9nKVxuICAgIGZpbGVCYXNlbmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpXG5cbiAgICBpZiBhdG9tLnByb2plY3Q/XG4gICAgICBbcm9vdFBhdGgsIHJlbGF0aXZlUGF0aF0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZVBhdGgpXG4gICAgICBpZiByb290UGF0aD8gYW5kIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLmxlbmd0aCA+IDFcbiAgICAgICAgcmVsYXRpdmVQYXRoID0gcGF0aC5qb2luKHBhdGguYmFzZW5hbWUocm9vdFBhdGgpLCByZWxhdGl2ZVBhdGgpXG4gICAgZWxzZVxuICAgICAgcmVsYXRpdmVQYXRoID0gZmlsZVBhdGhcblxuICAgIEBsaSBjbGFzczogJ3BhdGggbGlzdC1uZXN0ZWQtaXRlbScsICdkYXRhLXBhdGgnOiBfLmVzY2FwZUF0dHJpYnV0ZShmaWxlUGF0aCksID0+XG4gICAgICBAZGl2IG91dGxldDogJ3BhdGhEZXRhaWxzJywgY2xhc3M6ICdwYXRoLWRldGFpbHMgbGlzdC1pdGVtJywgPT5cbiAgICAgICAgQHNwYW4gY2xhc3M6ICdkaXNjbG9zdXJlLWFycm93J1xuICAgICAgICBAc3BhbiBjbGFzczogaWNvbkNsYXNzLmpvaW4oJyAnKSArICcgaWNvbicsICdkYXRhLW5hbWUnOiBmaWxlQmFzZW5hbWVcbiAgICAgICAgQHNwYW4gY2xhc3M6ICdwYXRoLW5hbWUgYnJpZ2h0JywgcmVsYXRpdmVQYXRoXG4gICAgICAgIEBzcGFuIG91dGxldDogJ2Rlc2NyaXB0aW9uJywgY2xhc3M6ICdwYXRoLW1hdGNoLW51bWJlcidcbiAgICAgIEB1bCBvdXRsZXQ6ICdtYXRjaGVzJywgY2xhc3M6ICdtYXRjaGVzIGxpc3QtdHJlZSdcblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAZmlsZVBhdGgsIHJlc3VsdCkgLT5cbiAgICBAaXNFeHBhbmRlZCA9IHRydWVcbiAgICBAcmVuZGVyUmVzdWx0KHJlc3VsdClcblxuICByZW5kZXJSZXN1bHQ6IChyZXN1bHQpIC0+XG4gICAgbWF0Y2hlcyA9IHJlc3VsdD8ubWF0Y2hlc1xuICAgIHNlbGVjdGVkSW5kZXggPSBAbWF0Y2hlcy5maW5kKCcuc2VsZWN0ZWQnKS5pbmRleCgpXG5cbiAgICBAbWF0Y2hlcy5lbXB0eSgpXG5cbiAgICBpZiByZXN1bHRcbiAgICAgIEBkZXNjcmlwdGlvbi5zaG93KCkudGV4dChcIigje21hdGNoZXM/Lmxlbmd0aH0pXCIpXG4gICAgZWxzZVxuICAgICAgQGRlc2NyaXB0aW9uLmhpZGUoKVxuXG4gICAgaWYgbm90IG1hdGNoZXMgb3IgbWF0Y2hlcy5sZW5ndGggaXMgMFxuICAgICAgQGhpZGUoKVxuICAgIGVsc2VcbiAgICAgIEBzaG93KClcbiAgICAgIGZvciBtYXRjaCBpbiBtYXRjaGVzXG4gICAgICAgIEBtYXRjaGVzLmFwcGVuZChuZXcgTWF0Y2hWaWV3KEBtb2RlbCwge0BmaWxlUGF0aCwgbWF0Y2h9KSlcblxuICAgIEBtYXRjaGVzLmNoaWxkcmVuKCkuZXEoc2VsZWN0ZWRJbmRleCkuYWRkQ2xhc3MoJ3NlbGVjdGVkJykgaWYgc2VsZWN0ZWRJbmRleCA+IC0xXG5cbiAgZXhwYW5kOiAoZXhwYW5kZWQpIC0+XG4gICAgIyBleHBhbmQgb3IgY29sbGFwc2UgdGhlIGxpc3RcbiAgICBpZiBleHBhbmRlZFxuICAgICAgQHJlbW92ZUNsYXNzKCdjb2xsYXBzZWQnKVxuXG4gICAgICBpZiBAaGFzQ2xhc3MoJ3NlbGVjdGVkJylcbiAgICAgICAgQHJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXG4gICAgICAgIGZpcnN0UmVzdWx0ID0gQGZpbmQoJy5zZWFyY2gtcmVzdWx0OmZpcnN0JykudmlldygpXG4gICAgICAgIGZpcnN0UmVzdWx0LmFkZENsYXNzKCdzZWxlY3RlZCcpXG5cbiAgICAgICAgIyBzY3JvbGwgdG8gdGhlIHByb3BlciBwbGFjZVxuICAgICAgICByZXN1bHRWaWV3ID0gZmlyc3RSZXN1bHQuY2xvc2VzdCgnLnJlc3VsdHMtdmlldycpLnZpZXcoKVxuICAgICAgICByZXN1bHRWaWV3LnNjcm9sbFRvKGZpcnN0UmVzdWx0KVxuXG4gICAgZWxzZVxuICAgICAgQGFkZENsYXNzKCdjb2xsYXBzZWQnKVxuXG4gICAgICBzZWxlY3RlZCA9IEBmaW5kKCcuc2VsZWN0ZWQnKS52aWV3KClcbiAgICAgIGlmIHNlbGVjdGVkP1xuICAgICAgICBzZWxlY3RlZC5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgICBAYWRkQ2xhc3MoJ3NlbGVjdGVkJylcblxuICAgICAgICByZXN1bHRWaWV3ID0gQGNsb3Nlc3QoJy5yZXN1bHRzLXZpZXcnKS52aWV3KClcbiAgICAgICAgcmVzdWx0Vmlldy5zY3JvbGxUbyh0aGlzKVxuXG4gICAgICBzZWxlY3RlZEl0ZW0gPSBAZmluZCgnLnNlbGVjdGVkJykudmlldygpXG5cbiAgICBAaXNFeHBhbmRlZCA9IGV4cGFuZGVkXG5cbiAgY29uZmlybTogLT5cbiAgICBAZXhwYW5kKG5vdCBAaXNFeHBhbmRlZClcbiAgICBudWxsXG4iXX0=
