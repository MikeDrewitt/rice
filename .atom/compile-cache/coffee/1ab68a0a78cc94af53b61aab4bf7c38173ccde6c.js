(function() {
  var $$, ExampleSelectListView, SelectListView, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), SelectListView = ref.SelectListView, $$ = ref.$$;

  module.exports = ExampleSelectListView = (function(superClass) {
    extend(ExampleSelectListView, superClass);

    function ExampleSelectListView() {
      return ExampleSelectListView.__super__.constructor.apply(this, arguments);
    }

    ExampleSelectListView.prototype.initialize = function(listOfItems) {
      this.listOfItems = listOfItems;
      ExampleSelectListView.__super__.initialize.apply(this, arguments);
      return this.setItems(this.listOfItems);
    };

    ExampleSelectListView.prototype.viewForItem = function(item) {
      return $$(function() {
        return this.li(item);
      });
    };

    ExampleSelectListView.prototype.cancel = function() {
      return console.log("cancelled");
    };

    ExampleSelectListView.prototype.confirmed = function(item) {
      return console.log("confirmed", item);
    };

    return ExampleSelectListView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdHlsZWd1aWRlL2xpYi9leGFtcGxlLXNlbGVjdC1saXN0LXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4Q0FBQTtJQUFBOzs7RUFBQSxNQUF1QixPQUFBLENBQVEsc0JBQVIsQ0FBdkIsRUFBQyxtQ0FBRCxFQUFpQjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztvQ0FDSixVQUFBLEdBQVksU0FBQyxXQUFEO01BQUMsSUFBQyxDQUFBLGNBQUQ7TUFDWCx1REFBQSxTQUFBO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsV0FBWDtJQUZVOztvQ0FJWixXQUFBLEdBQWEsU0FBQyxJQUFEO2FBQ1gsRUFBQSxDQUFHLFNBQUE7ZUFBRyxJQUFDLENBQUEsRUFBRCxDQUFJLElBQUo7TUFBSCxDQUFIO0lBRFc7O29DQUdiLE1BQUEsR0FBUSxTQUFBO2FBQ04sT0FBTyxDQUFDLEdBQVIsQ0FBWSxXQUFaO0lBRE07O29DQUdSLFNBQUEsR0FBVyxTQUFDLElBQUQ7YUFDVCxPQUFPLENBQUMsR0FBUixDQUFZLFdBQVosRUFBeUIsSUFBekI7SUFEUzs7OztLQVh1QjtBQUhwQyIsInNvdXJjZXNDb250ZW50IjpbIntTZWxlY3RMaXN0VmlldywgJCR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEV4YW1wbGVTZWxlY3RMaXN0VmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3XG4gIGluaXRpYWxpemU6IChAbGlzdE9mSXRlbXMpIC0+XG4gICAgc3VwZXJcbiAgICBAc2V0SXRlbXMoQGxpc3RPZkl0ZW1zKVxuXG4gIHZpZXdGb3JJdGVtOiAoaXRlbSkgLT5cbiAgICAkJCAtPiBAbGkoaXRlbSlcblxuICBjYW5jZWw6IC0+XG4gICAgY29uc29sZS5sb2coXCJjYW5jZWxsZWRcIilcblxuICBjb25maXJtZWQ6IChpdGVtKSAtPlxuICAgIGNvbnNvbGUubG9nKFwiY29uZmlybWVkXCIsIGl0ZW0pXG4iXX0=
