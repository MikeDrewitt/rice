(function() {
  var $, $$$, PackageReadmeView, View, cheerio, fs, ref, roaster,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $ = ref.$, $$$ = ref.$$$, View = ref.View;

  roaster = require('roaster');

  fs = require('fs');

  cheerio = require('cheerio');

  module.exports = PackageReadmeView = (function(superClass) {
    var sanitize;

    extend(PackageReadmeView, superClass);

    function PackageReadmeView() {
      return PackageReadmeView.__super__.constructor.apply(this, arguments);
    }

    PackageReadmeView.content = function() {
      return this.section({
        "class": 'section'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'section-container'
          }, function() {
            _this.div({
              "class": 'section-heading icon icon-book'
            }, 'README');
            return _this.div({
              "class": 'package-readme native-key-bindings',
              tabindex: -1,
              outlet: 'packageReadme'
            });
          });
        };
      })(this));
    };

    PackageReadmeView.prototype.initialize = function(readme) {
      readme = readme || "### No README.";
      return roaster(readme, (function(_this) {
        return function(err, content) {
          if (err) {
            _this.packageReadme.append("<h3>Error parsing README</h3>");
          }
          return _this.packageReadme.append(sanitize(content));
        };
      })(this));
    };

    sanitize = function(html) {
      var attribute, attributesToRemove, i, len, o;
      o = cheerio.load(html);
      o('script').remove();
      attributesToRemove = ['onabort', 'onblur', 'onchange', 'onclick', 'ondbclick', 'onerror', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseover', 'onmouseout', 'onmouseup', 'onreset', 'onresize', 'onscroll', 'onselect', 'onsubmit', 'onunload'];
      for (i = 0, len = attributesToRemove.length; i < len; i++) {
        attribute = attributesToRemove[i];
        o('*').removeAttr(attribute);
      }
      o('input[type="checkbox"]').attr('disabled', true);
      return o.html();
    };

    return PackageReadmeView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLXJlYWRtZS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMERBQUE7SUFBQTs7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLHNCQUFSLENBQWpCLEVBQUMsU0FBRCxFQUFJLGFBQUosRUFBUzs7RUFDVCxPQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0VBQ1YsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7RUFJVixNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ0osUUFBQTs7Ozs7Ozs7SUFBQSxpQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLE9BQUQsQ0FBUztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtPQUFULEVBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDekIsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7V0FBTCxFQUFpQyxTQUFBO1lBQy9CLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdDQUFQO2FBQUwsRUFBOEMsUUFBOUM7bUJBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0NBQVA7Y0FBNkMsUUFBQSxFQUFVLENBQUMsQ0FBeEQ7Y0FBMkQsTUFBQSxFQUFRLGVBQW5FO2FBQUw7VUFGK0IsQ0FBakM7UUFEeUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNCO0lBRFE7O2dDQU1WLFVBQUEsR0FBWSxTQUFDLE1BQUQ7TUFDVixNQUFBLEdBQVMsTUFBQSxJQUFVO2FBQ25CLE9BQUEsQ0FBUSxNQUFSLEVBQWdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFELEVBQU0sT0FBTjtVQUNkLElBQUcsR0FBSDtZQUNFLEtBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixDQUFzQiwrQkFBdEIsRUFERjs7aUJBRUEsS0FBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLENBQXNCLFFBQUEsQ0FBUyxPQUFULENBQXRCO1FBSGM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhCO0lBRlU7O0lBT1osUUFBQSxHQUFXLFNBQUMsSUFBRDtBQUNULFVBQUE7TUFBQSxDQUFBLEdBQUksT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiO01BQ0osQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLE1BQVosQ0FBQTtNQUNBLGtCQUFBLEdBQXFCLENBQ25CLFNBRG1CLEVBRW5CLFFBRm1CLEVBR25CLFVBSG1CLEVBSW5CLFNBSm1CLEVBS25CLFdBTG1CLEVBTW5CLFNBTm1CLEVBT25CLFNBUG1CLEVBUW5CLFdBUm1CLEVBU25CLFlBVG1CLEVBVW5CLFNBVm1CLEVBV25CLFFBWG1CLEVBWW5CLGFBWm1CLEVBYW5CLGFBYm1CLEVBY25CLGFBZG1CLEVBZW5CLFlBZm1CLEVBZ0JuQixXQWhCbUIsRUFpQm5CLFNBakJtQixFQWtCbkIsVUFsQm1CLEVBbUJuQixVQW5CbUIsRUFvQm5CLFVBcEJtQixFQXFCbkIsVUFyQm1CLEVBc0JuQixVQXRCbUI7QUF3QnJCLFdBQUEsb0RBQUE7O1FBQUEsQ0FBQSxDQUFFLEdBQUYsQ0FBTSxDQUFDLFVBQVAsQ0FBa0IsU0FBbEI7QUFBQTtNQUNBLENBQUEsQ0FBRSx3QkFBRixDQUEyQixDQUFDLElBQTVCLENBQWlDLFVBQWpDLEVBQTZDLElBQTdDO2FBQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBQTtJQTdCUzs7OztLQWRtQjtBQVJoQyIsInNvdXJjZXNDb250ZW50IjpbInskLCAkJCQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5yb2FzdGVyID0gcmVxdWlyZSAncm9hc3RlcidcbmZzID0gcmVxdWlyZSAnZnMnXG5jaGVlcmlvID0gcmVxdWlyZSAnY2hlZXJpbydcblxuIyBEaXNwbGF5cyB0aGUgcmVhZG1lIGZvciBhIHBhY2thZ2UsIGlmIGl0IGhhcyBvbmVcbiMgVE9ETyBEZWNpZGUgdG8ga2VlcCB0aGlzIG9yIGN1cnJlbnQgYnV0dG9uLXRvLW5ldy10YWIgdmlld1xubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFja2FnZVJlYWRtZVZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAtPlxuICAgIEBzZWN0aW9uIGNsYXNzOiAnc2VjdGlvbicsID0+XG4gICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1jb250YWluZXInLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAnc2VjdGlvbi1oZWFkaW5nIGljb24gaWNvbi1ib29rJywgJ1JFQURNRSdcbiAgICAgICAgQGRpdiBjbGFzczogJ3BhY2thZ2UtcmVhZG1lIG5hdGl2ZS1rZXktYmluZGluZ3MnLCB0YWJpbmRleDogLTEsIG91dGxldDogJ3BhY2thZ2VSZWFkbWUnXG5cbiAgaW5pdGlhbGl6ZTogKHJlYWRtZSkgLT5cbiAgICByZWFkbWUgPSByZWFkbWUgb3IgXCIjIyMgTm8gUkVBRE1FLlwiXG4gICAgcm9hc3RlciByZWFkbWUsIChlcnIsIGNvbnRlbnQpID0+XG4gICAgICBpZiBlcnJcbiAgICAgICAgQHBhY2thZ2VSZWFkbWUuYXBwZW5kKFwiPGgzPkVycm9yIHBhcnNpbmcgUkVBRE1FPC9oMz5cIilcbiAgICAgIEBwYWNrYWdlUmVhZG1lLmFwcGVuZChzYW5pdGl6ZShjb250ZW50KSlcblxuICBzYW5pdGl6ZSA9IChodG1sKSAtPlxuICAgIG8gPSBjaGVlcmlvLmxvYWQoaHRtbClcbiAgICBvKCdzY3JpcHQnKS5yZW1vdmUoKVxuICAgIGF0dHJpYnV0ZXNUb1JlbW92ZSA9IFtcbiAgICAgICdvbmFib3J0J1xuICAgICAgJ29uYmx1cidcbiAgICAgICdvbmNoYW5nZSdcbiAgICAgICdvbmNsaWNrJ1xuICAgICAgJ29uZGJjbGljaydcbiAgICAgICdvbmVycm9yJ1xuICAgICAgJ29uZm9jdXMnXG4gICAgICAnb25rZXlkb3duJ1xuICAgICAgJ29ua2V5cHJlc3MnXG4gICAgICAnb25rZXl1cCdcbiAgICAgICdvbmxvYWQnXG4gICAgICAnb25tb3VzZWRvd24nXG4gICAgICAnb25tb3VzZW1vdmUnXG4gICAgICAnb25tb3VzZW92ZXInXG4gICAgICAnb25tb3VzZW91dCdcbiAgICAgICdvbm1vdXNldXAnXG4gICAgICAnb25yZXNldCdcbiAgICAgICdvbnJlc2l6ZSdcbiAgICAgICdvbnNjcm9sbCdcbiAgICAgICdvbnNlbGVjdCdcbiAgICAgICdvbnN1Ym1pdCdcbiAgICAgICdvbnVubG9hZCdcbiAgICBdXG4gICAgbygnKicpLnJlbW92ZUF0dHIoYXR0cmlidXRlKSBmb3IgYXR0cmlidXRlIGluIGF0dHJpYnV0ZXNUb1JlbW92ZVxuICAgIG8oJ2lucHV0W3R5cGU9XCJjaGVja2JveFwiXScpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgICBvLmh0bWwoKVxuIl19
