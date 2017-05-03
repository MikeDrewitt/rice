(function() {
  var $$, ExampleSection;

  $$ = require('atom-space-pen-views').$$;

  module.exports = ExampleSection = (function() {
    ExampleSection.prototype.loaded = false;

    ExampleSection.build = function(view, name, title, buildFn) {
      var sectionEl;
      sectionEl = $$(function() {
        return this.section({
          "class": 'bordered collapsed',
          'data-name': name
        }, (function(_this) {
          return function() {
            return _this.h1({
              "class": 'section-heading'
            }, title);
          };
        })(this));
      });
      return new ExampleSection(name, sectionEl, buildFn);
    };

    function ExampleSection(name1, el, buildFn1) {
      this.name = name1;
      this.el = el;
      this.buildFn = buildFn1;
    }

    ExampleSection.prototype.load = function() {
      var self;
      if (this.loaded) {
        return;
      }
      self = this;
      this.el.append($$(function() {
        return self.buildFn.call(this);
      }));
      return this.loaded = true;
    };

    ExampleSection.prototype.toggle = function() {
      if (this.el.hasClass('collapsed')) {
        return this.expand();
      } else {
        return this.collapse();
      }
    };

    ExampleSection.prototype.collapse = function() {
      return this.el.addClass('collapsed');
    };

    ExampleSection.prototype.expand = function() {
      this.load();
      return this.el.removeClass('collapsed');
    };

    return ExampleSection;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdHlsZWd1aWRlL2xpYi9leGFtcGxlLXNlY3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxLQUFNLE9BQUEsQ0FBUSxzQkFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNOzZCQUNKLE1BQUEsR0FBUTs7SUFFUixjQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxLQUFiLEVBQW9CLE9BQXBCO0FBQ04sVUFBQTtNQUFBLFNBQUEsR0FBWSxFQUFBLENBQUcsU0FBQTtlQUNiLElBQUMsQ0FBQSxPQUFELENBQVM7VUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFQO1VBQTZCLFdBQUEsRUFBYSxJQUExQztTQUFULEVBQXlELENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ3ZELEtBQUMsQ0FBQSxFQUFELENBQUk7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGlCQUFQO2FBQUosRUFBOEIsS0FBOUI7VUFEdUQ7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpEO01BRGEsQ0FBSDthQUdSLElBQUEsY0FBQSxDQUFlLElBQWYsRUFBcUIsU0FBckIsRUFBZ0MsT0FBaEM7SUFKRTs7SUFNSyx3QkFBQyxLQUFELEVBQVEsRUFBUixFQUFhLFFBQWI7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxLQUFEO01BQUssSUFBQyxDQUFBLFVBQUQ7SUFBYjs7NkJBRWIsSUFBQSxHQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsSUFBVSxJQUFDLENBQUEsTUFBWDtBQUFBLGVBQUE7O01BQ0EsSUFBQSxHQUFPO01BQ1AsSUFBQyxDQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsRUFBQSxDQUFHLFNBQUE7ZUFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQWIsQ0FBa0IsSUFBbEI7TUFBSCxDQUFILENBQVg7YUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSk47OzZCQU1OLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBRyxJQUFDLENBQUEsRUFBRSxDQUFDLFFBQUosQ0FBYSxXQUFiLENBQUg7ZUFDRSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQUhGOztJQURNOzs2QkFNUixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxFQUFFLENBQUMsUUFBSixDQUFhLFdBQWI7SUFEUTs7NkJBR1YsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEsSUFBRCxDQUFBO2FBQ0EsSUFBQyxDQUFBLEVBQUUsQ0FBQyxXQUFKLENBQWdCLFdBQWhCO0lBRk07Ozs7O0FBN0JWIiwic291cmNlc0NvbnRlbnQiOlsieyQkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBFeGFtcGxlU2VjdGlvblxuICBsb2FkZWQ6IGZhbHNlXG5cbiAgQGJ1aWxkOiAodmlldywgbmFtZSwgdGl0bGUsIGJ1aWxkRm4pIC0+XG4gICAgc2VjdGlvbkVsID0gJCQgLT5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnYm9yZGVyZWQgY29sbGFwc2VkJywgJ2RhdGEtbmFtZSc6IG5hbWUsID0+XG4gICAgICAgIEBoMSBjbGFzczogJ3NlY3Rpb24taGVhZGluZycsIHRpdGxlXG4gICAgbmV3IEV4YW1wbGVTZWN0aW9uKG5hbWUsIHNlY3Rpb25FbCwgYnVpbGRGbilcblxuICBjb25zdHJ1Y3RvcjogKEBuYW1lLCBAZWwsIEBidWlsZEZuKSAtPlxuXG4gIGxvYWQ6IC0+XG4gICAgcmV0dXJuIGlmIEBsb2FkZWRcbiAgICBzZWxmID0gdGhpc1xuICAgIEBlbC5hcHBlbmQoJCQgLT4gc2VsZi5idWlsZEZuLmNhbGwodGhpcykpXG4gICAgQGxvYWRlZCA9IHRydWVcblxuICB0b2dnbGU6IC0+XG4gICAgaWYgQGVsLmhhc0NsYXNzKCdjb2xsYXBzZWQnKVxuICAgICAgQGV4cGFuZCgpXG4gICAgZWxzZVxuICAgICAgQGNvbGxhcHNlKClcblxuICBjb2xsYXBzZTogLT5cbiAgICBAZWwuYWRkQ2xhc3MoJ2NvbGxhcHNlZCcpXG5cbiAgZXhwYW5kOiAtPlxuICAgIEBsb2FkKClcbiAgICBAZWwucmVtb3ZlQ2xhc3MoJ2NvbGxhcHNlZCcpXG4iXX0=
