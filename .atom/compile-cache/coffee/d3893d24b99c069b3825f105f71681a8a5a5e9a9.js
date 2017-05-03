(function() {
  var GoBackView, SymbolsView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SymbolsView = require('./symbols-view');

  module.exports = GoBackView = (function(superClass) {
    extend(GoBackView, superClass);

    function GoBackView() {
      return GoBackView.__super__.constructor.apply(this, arguments);
    }

    GoBackView.prototype.toggle = function() {
      var pane, previousEditor, previousTag, restorePosition;
      previousTag = this.stack.pop();
      if (previousTag == null) {
        return;
      }
      restorePosition = (function(_this) {
        return function() {
          if (previousTag.position) {
            return _this.moveToPosition(previousTag.position, false);
          }
        };
      })(this);
      previousEditor = atom.workspace.getTextEditors().find(function(e) {
        return e.id === previousTag.editorId;
      });
      if (previousEditor) {
        pane = atom.workspace.paneForItem(previousEditor);
        pane.setActiveItem(previousEditor);
        return restorePosition();
      } else if (previousTag.file) {
        return atom.workspace.open(previousTag.file).then(restorePosition);
      }
    };

    return GoBackView;

  })(SymbolsView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL2dvLWJhY2stdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVCQUFBO0lBQUE7OztFQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBRWQsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt5QkFDSixNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7TUFBQSxXQUFBLEdBQWMsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQUE7TUFDZCxJQUFjLG1CQUFkO0FBQUEsZUFBQTs7TUFFQSxlQUFBLEdBQWtCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNoQixJQUFnRCxXQUFXLENBQUMsUUFBNUQ7bUJBQUEsS0FBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBVyxDQUFDLFFBQTVCLEVBQXNDLEtBQXRDLEVBQUE7O1FBRGdCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUdsQixjQUFBLEdBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBZixDQUFBLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsU0FBQyxDQUFEO2VBQU8sQ0FBQyxDQUFDLEVBQUYsS0FBUSxXQUFXLENBQUM7TUFBM0IsQ0FBckM7TUFFakIsSUFBRyxjQUFIO1FBQ0UsSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBZixDQUEyQixjQUEzQjtRQUNQLElBQUksQ0FBQyxhQUFMLENBQW1CLGNBQW5CO2VBQ0EsZUFBQSxDQUFBLEVBSEY7T0FBQSxNQUlLLElBQUcsV0FBVyxDQUFDLElBQWY7ZUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsV0FBVyxDQUFDLElBQWhDLENBQXFDLENBQUMsSUFBdEMsQ0FBMkMsZUFBM0MsRUFERzs7SUFiQzs7OztLQURlO0FBSHpCIiwic291cmNlc0NvbnRlbnQiOlsiU3ltYm9sc1ZpZXcgPSByZXF1aXJlICcuL3N5bWJvbHMtdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR29CYWNrVmlldyBleHRlbmRzIFN5bWJvbHNWaWV3XG4gIHRvZ2dsZTogLT5cbiAgICBwcmV2aW91c1RhZyA9IEBzdGFjay5wb3AoKVxuICAgIHJldHVybiB1bmxlc3MgcHJldmlvdXNUYWc/XG5cbiAgICByZXN0b3JlUG9zaXRpb24gPSA9PlxuICAgICAgQG1vdmVUb1Bvc2l0aW9uKHByZXZpb3VzVGFnLnBvc2l0aW9uLCBmYWxzZSkgaWYgcHJldmlvdXNUYWcucG9zaXRpb25cblxuICAgIHByZXZpb3VzRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5maW5kIChlKSAtPiBlLmlkIGlzIHByZXZpb3VzVGFnLmVkaXRvcklkXG5cbiAgICBpZiBwcmV2aW91c0VkaXRvclxuICAgICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKHByZXZpb3VzRWRpdG9yKVxuICAgICAgcGFuZS5zZXRBY3RpdmVJdGVtKHByZXZpb3VzRWRpdG9yKVxuICAgICAgcmVzdG9yZVBvc2l0aW9uKClcbiAgICBlbHNlIGlmIHByZXZpb3VzVGFnLmZpbGVcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4ocHJldmlvdXNUYWcuZmlsZSkudGhlbiByZXN0b3JlUG9zaXRpb25cbiJdfQ==
