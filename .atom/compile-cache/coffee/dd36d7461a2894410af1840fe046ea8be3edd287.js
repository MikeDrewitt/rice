(function() {
  var ProgressElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ProgressElement = (function(superClass) {
    extend(ProgressElement, superClass);

    function ProgressElement() {
      return ProgressElement.__super__.constructor.apply(this, arguments);
    }

    ProgressElement.prototype.createdCallback = function() {
      return this.tabIndex = -1;
    };

    ProgressElement.prototype.displayLoading = function() {
      return this.innerHTML = "<span class=\"loading loading-spinner-small inline-block\"></span>\n<span>\n  Updating package dependencies\u2026\n</span>";
    };

    ProgressElement.prototype.displaySuccess = function() {
      return this.innerHTML = "<span class=\"text-success\">\n  Package dependencies updated.\n</span>";
    };

    ProgressElement.prototype.displayFailure = function() {
      return this.innerHTML = "<span class=\"text-error\">\n  Failed to update package depencencies.\n</span>";
    };

    return ProgressElement;

  })(HTMLDivElement);

  module.exports = document.registerElement("update-package-dependencies-progress", {
    prototype: ProgressElement.prototype,
    "extends": "div"
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy91cGRhdGUtcGFja2FnZS1kZXBlbmRlbmNpZXMvbGliL3Byb2dyZXNzLWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxlQUFBO0lBQUE7OztFQUFNOzs7Ozs7OzhCQUNKLGVBQUEsR0FBaUIsU0FBQTthQUNmLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBQztJQURFOzs4QkFHakIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQURDOzs4QkFRaEIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQURDOzs4QkFPaEIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQURDOzs7O0tBbkJZOztFQTBCOUIsTUFBTSxDQUFDLE9BQVAsR0FDQSxRQUFRLENBQUMsZUFBVCxDQUF5QixzQ0FBekIsRUFDRTtJQUFBLFNBQUEsRUFBVyxlQUFlLENBQUMsU0FBM0I7SUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7R0FERjtBQTNCQSIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFByb2dyZXNzRWxlbWVudCBleHRlbmRzIEhUTUxEaXZFbGVtZW50XG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAdGFiSW5kZXggPSAtMVxuXG4gIGRpc3BsYXlMb2FkaW5nOiAtPlxuICAgIEBpbm5lckhUTUwgPSBcIlwiXCJcbiAgICAgIDxzcGFuIGNsYXNzPVwibG9hZGluZyBsb2FkaW5nLXNwaW5uZXItc21hbGwgaW5saW5lLWJsb2NrXCI+PC9zcGFuPlxuICAgICAgPHNwYW4+XG4gICAgICAgIFVwZGF0aW5nIHBhY2thZ2UgZGVwZW5kZW5jaWVzXFx1MjAyNlxuICAgICAgPC9zcGFuPlxuICAgIFwiXCJcIlxuXG4gIGRpc3BsYXlTdWNjZXNzOiAtPlxuICAgIEBpbm5lckhUTUwgPSBcIlwiXCJcbiAgICAgIDxzcGFuIGNsYXNzPVwidGV4dC1zdWNjZXNzXCI+XG4gICAgICAgIFBhY2thZ2UgZGVwZW5kZW5jaWVzIHVwZGF0ZWQuXG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbiAgZGlzcGxheUZhaWx1cmU6IC0+XG4gICAgQGlubmVySFRNTCA9IFwiXCJcIlxuICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWVycm9yXCI+XG4gICAgICAgIEZhaWxlZCB0byB1cGRhdGUgcGFja2FnZSBkZXBlbmNlbmNpZXMuXG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbm1vZHVsZS5leHBvcnRzID1cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInVwZGF0ZS1wYWNrYWdlLWRlcGVuZGVuY2llcy1wcm9ncmVzc1wiLFxuICBwcm90b3R5cGU6IFByb2dyZXNzRWxlbWVudC5wcm90b3R5cGVcbiAgZXh0ZW5kczogXCJkaXZcIlxuKVxuIl19
