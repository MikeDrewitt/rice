(function() {
  var $$, CollapsibleSectionPanel, ScrollView, TextEditorView, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $$ = ref.$$, TextEditorView = ref.TextEditorView, ScrollView = ref.ScrollView;

  module.exports = CollapsibleSectionPanel = (function(superClass) {
    extend(CollapsibleSectionPanel, superClass);

    function CollapsibleSectionPanel() {
      return CollapsibleSectionPanel.__super__.constructor.apply(this, arguments);
    }

    CollapsibleSectionPanel.prototype.notHiddenCardsLength = function(sectionElement) {
      return sectionElement.find('.package-card:not(.hidden)').length;
    };

    CollapsibleSectionPanel.prototype.updateSectionCount = function(headerElement, countElement, packageCount, totalCount) {
      if (totalCount === void 0) {
        countElement.text(packageCount);
      } else {
        countElement.text(packageCount + "/" + totalCount);
      }
      if (packageCount > 0) {
        return headerElement.addClass("has-items");
      }
    };

    CollapsibleSectionPanel.prototype.updateSectionCounts = function() {
      var filterText;
      this.resetSectionHasItems();
      filterText = this.filterEditor.getModel().getText();
      if (filterText === '') {
        return this.updateUnfilteredSectionCounts();
      } else {
        return this.updateFilteredSectionCounts();
      }
    };

    CollapsibleSectionPanel.prototype.handleEvents = function() {
      return this.on('click', '.sub-section .has-items', function(e) {
        return e.currentTarget.parentNode.classList.toggle('collapsed');
      });
    };

    CollapsibleSectionPanel.prototype.resetCollapsibleSections = function(headerSections) {
      var headerSection, i, len, results;
      results = [];
      for (i = 0, len = headerSections.length; i < len; i++) {
        headerSection = headerSections[i];
        results.push(this.resetCollapsibleSection(headerSection));
      }
      return results;
    };

    CollapsibleSectionPanel.prototype.resetCollapsibleSection = function(headerSection) {
      return headerSection.removeClass('has-items');
    };

    return CollapsibleSectionPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9jb2xsYXBzaWJsZS1zZWN0aW9uLXBhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNERBQUE7SUFBQTs7O0VBQUEsTUFBbUMsT0FBQSxDQUFRLHNCQUFSLENBQW5DLEVBQUMsV0FBRCxFQUFLLG1DQUFMLEVBQXFCOztFQUVyQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O3NDQUNKLG9CQUFBLEdBQXNCLFNBQUMsY0FBRDthQUNwQixjQUFjLENBQUMsSUFBZixDQUFvQiw0QkFBcEIsQ0FBaUQsQ0FBQztJQUQ5Qjs7c0NBR3RCLGtCQUFBLEdBQW9CLFNBQUMsYUFBRCxFQUFnQixZQUFoQixFQUE4QixZQUE5QixFQUE0QyxVQUE1QztNQUNsQixJQUFHLFVBQUEsS0FBYyxNQUFqQjtRQUNFLFlBQVksQ0FBQyxJQUFiLENBQWtCLFlBQWxCLEVBREY7T0FBQSxNQUFBO1FBR0UsWUFBWSxDQUFDLElBQWIsQ0FBcUIsWUFBRCxHQUFjLEdBQWQsR0FBaUIsVUFBckMsRUFIRjs7TUFLQSxJQUF1QyxZQUFBLEdBQWUsQ0FBdEQ7ZUFBQSxhQUFhLENBQUMsUUFBZCxDQUF1QixXQUF2QixFQUFBOztJQU5rQjs7c0NBUXBCLG1CQUFBLEdBQXFCLFNBQUE7QUFDbkIsVUFBQTtNQUFBLElBQUMsQ0FBQSxvQkFBRCxDQUFBO01BRUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxZQUFZLENBQUMsUUFBZCxDQUFBLENBQXdCLENBQUMsT0FBekIsQ0FBQTtNQUNiLElBQUcsVUFBQSxLQUFjLEVBQWpCO2VBQ0UsSUFBQyxDQUFBLDZCQUFELENBQUEsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsMkJBQUQsQ0FBQSxFQUhGOztJQUptQjs7c0NBU3JCLFlBQUEsR0FBYyxTQUFBO2FBQ1osSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEseUJBQWIsRUFBd0MsU0FBQyxDQUFEO2VBQ3RDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFyQyxDQUE0QyxXQUE1QztNQURzQyxDQUF4QztJQURZOztzQ0FJZCx3QkFBQSxHQUEwQixTQUFDLGNBQUQ7QUFDeEIsVUFBQTtBQUFBO1dBQUEsZ0RBQUE7O3FCQUFBLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixhQUF6QjtBQUFBOztJQUR3Qjs7c0NBRzFCLHVCQUFBLEdBQXlCLFNBQUMsYUFBRDthQUN2QixhQUFhLENBQUMsV0FBZCxDQUEwQixXQUExQjtJQUR1Qjs7OztLQTVCVztBQUh0QyIsInNvdXJjZXNDb250ZW50IjpbInskJCwgVGV4dEVkaXRvclZpZXcsIFNjcm9sbFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvbGxhcHNpYmxlU2VjdGlvblBhbmVsIGV4dGVuZHMgU2Nyb2xsVmlld1xuICBub3RIaWRkZW5DYXJkc0xlbmd0aDogKHNlY3Rpb25FbGVtZW50KSAtPlxuICAgIHNlY3Rpb25FbGVtZW50LmZpbmQoJy5wYWNrYWdlLWNhcmQ6bm90KC5oaWRkZW4pJykubGVuZ3RoXG5cbiAgdXBkYXRlU2VjdGlvbkNvdW50OiAoaGVhZGVyRWxlbWVudCwgY291bnRFbGVtZW50LCBwYWNrYWdlQ291bnQsIHRvdGFsQ291bnQpIC0+XG4gICAgaWYgdG90YWxDb3VudCBpcyB1bmRlZmluZWRcbiAgICAgIGNvdW50RWxlbWVudC50ZXh0IHBhY2thZ2VDb3VudFxuICAgIGVsc2VcbiAgICAgIGNvdW50RWxlbWVudC50ZXh0IFwiI3twYWNrYWdlQ291bnR9LyN7dG90YWxDb3VudH1cIlxuXG4gICAgaGVhZGVyRWxlbWVudC5hZGRDbGFzcyhcImhhcy1pdGVtc1wiKSBpZiBwYWNrYWdlQ291bnQgPiAwXG5cbiAgdXBkYXRlU2VjdGlvbkNvdW50czogLT5cbiAgICBAcmVzZXRTZWN0aW9uSGFzSXRlbXMoKVxuXG4gICAgZmlsdGVyVGV4dCA9IEBmaWx0ZXJFZGl0b3IuZ2V0TW9kZWwoKS5nZXRUZXh0KClcbiAgICBpZiBmaWx0ZXJUZXh0IGlzICcnXG4gICAgICBAdXBkYXRlVW5maWx0ZXJlZFNlY3Rpb25Db3VudHMoKVxuICAgIGVsc2VcbiAgICAgIEB1cGRhdGVGaWx0ZXJlZFNlY3Rpb25Db3VudHMoKVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBAb24gJ2NsaWNrJywgJy5zdWItc2VjdGlvbiAuaGFzLWl0ZW1zJywgKGUpIC0+XG4gICAgICBlLmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZS5jbGFzc0xpc3QudG9nZ2xlKCdjb2xsYXBzZWQnKVxuXG4gIHJlc2V0Q29sbGFwc2libGVTZWN0aW9uczogKGhlYWRlclNlY3Rpb25zKSAtPlxuICAgIEByZXNldENvbGxhcHNpYmxlU2VjdGlvbiBoZWFkZXJTZWN0aW9uIGZvciBoZWFkZXJTZWN0aW9uIGluIGhlYWRlclNlY3Rpb25zXG5cbiAgcmVzZXRDb2xsYXBzaWJsZVNlY3Rpb246IChoZWFkZXJTZWN0aW9uKSAtPlxuICAgIGhlYWRlclNlY3Rpb24ucmVtb3ZlQ2xhc3MoJ2hhcy1pdGVtcycpXG4iXX0=
