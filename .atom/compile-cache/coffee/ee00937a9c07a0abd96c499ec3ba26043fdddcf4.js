(function() {
  var $$, SelectListView, SnippetsAvailable, _, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $$ = ref.$$, SelectListView = ref.SelectListView;

  module.exports = SnippetsAvailable = (function(superClass) {
    extend(SnippetsAvailable, superClass);

    function SnippetsAvailable() {
      return SnippetsAvailable.__super__.constructor.apply(this, arguments);
    }

    SnippetsAvailable.prototype.panel = null;

    SnippetsAvailable.prototype.initialize = function(snippets1) {
      this.snippets = snippets1;
      SnippetsAvailable.__super__.initialize.apply(this, arguments);
      return this.addClass('available-snippets');
    };

    SnippetsAvailable.prototype.getFilterKey = function() {
      return 'searchText';
    };

    SnippetsAvailable.prototype.toggle = function(editor1) {
      this.editor = editor1;
      if (this.panel != null) {
        return this.cancel();
      } else {
        this.populate();
        return this.attach();
      }
    };

    SnippetsAvailable.prototype.cancelled = function() {
      this.editor = null;
      if (this.panel != null) {
        this.panel.destroy();
        return this.panel = null;
      }
    };

    SnippetsAvailable.prototype.populate = function() {
      var i, len, snippet, snippets;
      snippets = _.values(this.snippets.getSnippets(this.editor));
      for (i = 0, len = snippets.length; i < len; i++) {
        snippet = snippets[i];
        snippet.searchText = _.compact([snippet.prefix, snippet.name]).join(' ');
      }
      return this.setItems(snippets);
    };

    SnippetsAvailable.prototype.attach = function() {
      this.storeFocusedElement();
      this.panel = atom.workspace.addModalPanel({
        item: this
      });
      return this.focusFilterEditor();
    };

    SnippetsAvailable.prototype.viewForItem = function(snippet) {
      return $$(function() {
        return this.li({
          "class": 'two-lines'
        }, (function(_this) {
          return function() {
            _this.div({
              "class": 'primary-line'
            }, snippet.prefix);
            return _this.div({
              "class": 'secondary-line'
            }, snippet.name);
          };
        })(this));
      });
    };

    SnippetsAvailable.prototype.confirmed = function(snippet) {
      var cursor, editor, i, len, ref1, results;
      editor = this.editor;
      this.cancel();
      ref1 = editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        results.push(this.snippets.insert(snippet.bodyText, editor, cursor));
      }
      return results;
    };

    return SnippetsAvailable;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zbmlwcGV0cy9saWIvc25pcHBldHMtYXZhaWxhYmxlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkNBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUF1QixPQUFBLENBQVEsc0JBQVIsQ0FBdkIsRUFBQyxXQUFELEVBQUs7O0VBRUwsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztnQ0FDSixLQUFBLEdBQU87O2dDQUtQLFVBQUEsR0FBWSxTQUFDLFNBQUQ7TUFBQyxJQUFDLENBQUEsV0FBRDtNQUNYLG1EQUFBLFNBQUE7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLG9CQUFWO0lBRlU7O2dDQU9aLFlBQUEsR0FBYyxTQUFBO2FBQUc7SUFBSDs7Z0NBRWQsTUFBQSxHQUFRLFNBQUMsT0FBRDtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQ1AsSUFBRyxrQkFBSDtlQUNFLElBQUMsQ0FBQSxNQUFELENBQUEsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUEsUUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUpGOztJQURNOztnQ0FPUixTQUFBLEdBQVcsU0FBQTtNQUNULElBQUMsQ0FBQSxNQUFELEdBQVU7TUFDVixJQUFHLGtCQUFIO1FBQ0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUE7ZUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBRlg7O0lBRlM7O2dDQU1YLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLFFBQUEsR0FBVyxDQUFDLENBQUMsTUFBRixDQUFTLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsTUFBdkIsQ0FBVDtBQUNYLFdBQUEsMENBQUE7O1FBQ0UsT0FBTyxDQUFDLFVBQVIsR0FBcUIsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxDQUFDLE9BQU8sQ0FBQyxNQUFULEVBQWlCLE9BQU8sQ0FBQyxJQUF6QixDQUFWLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsR0FBL0M7QUFEdkI7YUFFQSxJQUFDLENBQUEsUUFBRCxDQUFVLFFBQVY7SUFKUTs7Z0NBTVYsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEsbUJBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1FBQUEsSUFBQSxFQUFNLElBQU47T0FBN0I7YUFDVCxJQUFDLENBQUEsaUJBQUQsQ0FBQTtJQUhNOztnQ0FVUixXQUFBLEdBQWEsU0FBQyxPQUFEO2FBQ1gsRUFBQSxDQUFHLFNBQUE7ZUFDRCxJQUFDLENBQUEsRUFBRCxDQUFJO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUFQO1NBQUosRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUN0QixLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2FBQUwsRUFBNEIsT0FBTyxDQUFDLE1BQXBDO21CQUNBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdCQUFQO2FBQUwsRUFBOEIsT0FBTyxDQUFDLElBQXRDO1VBRnNCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF4QjtNQURDLENBQUg7SUFEVzs7Z0NBV2IsU0FBQSxHQUFXLFNBQUMsT0FBRDtBQUNULFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBO01BQ1YsSUFBQyxDQUFBLE1BQUQsQ0FBQTtBQUNBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQ0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQWlCLE9BQU8sQ0FBQyxRQUF6QixFQUFtQyxNQUFuQyxFQUEyQyxNQUEzQztBQURGOztJQUhTOzs7O0tBdkRtQjtBQUpoQyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57JCQsIFNlbGVjdExpc3RWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTbmlwcGV0c0F2YWlsYWJsZSBleHRlbmRzIFNlbGVjdExpc3RWaWV3XG4gIHBhbmVsOiBudWxsXG5cbiAgIyBQdWJsaWM6IEluaXRpYWxpemUgb2JqZWN0LlxuICAjXG4gICMgUmV0dXJuczogYHVuZGVmaW5lZGBcbiAgaW5pdGlhbGl6ZTogKEBzbmlwcGV0cykgLT5cbiAgICBzdXBlclxuICAgIEBhZGRDbGFzcygnYXZhaWxhYmxlLXNuaXBwZXRzJylcblxuICAjIFB1YmxpYzogRmlsdGVyIHRoZSBmdXp6eS1zZWFyY2ggZm9yIHRoZSBwcmVmaXguXG4gICNcbiAgIyBSZXR1cm5zOiB7U3RyaW5nfVxuICBnZXRGaWx0ZXJLZXk6IC0+ICdzZWFyY2hUZXh0J1xuXG4gIHRvZ2dsZTogKEBlZGl0b3IpIC0+XG4gICAgaWYgQHBhbmVsP1xuICAgICAgQGNhbmNlbCgpXG4gICAgZWxzZVxuICAgICAgQHBvcHVsYXRlKClcbiAgICAgIEBhdHRhY2goKVxuXG4gIGNhbmNlbGxlZDogLT5cbiAgICBAZWRpdG9yID0gbnVsbFxuICAgIGlmIEBwYW5lbD9cbiAgICAgIEBwYW5lbC5kZXN0cm95KClcbiAgICAgIEBwYW5lbCA9IG51bGxcblxuICBwb3B1bGF0ZTogLT5cbiAgICBzbmlwcGV0cyA9IF8udmFsdWVzKEBzbmlwcGV0cy5nZXRTbmlwcGV0cyhAZWRpdG9yKSlcbiAgICBmb3Igc25pcHBldCBpbiBzbmlwcGV0c1xuICAgICAgc25pcHBldC5zZWFyY2hUZXh0ID0gXy5jb21wYWN0KFtzbmlwcGV0LnByZWZpeCwgc25pcHBldC5uYW1lXSkuam9pbignICcpXG4gICAgQHNldEl0ZW1zKHNuaXBwZXRzKVxuXG4gIGF0dGFjaDogLT5cbiAgICBAc3RvcmVGb2N1c2VkRWxlbWVudCgpXG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB0aGlzKVxuICAgIEBmb2N1c0ZpbHRlckVkaXRvcigpXG5cbiAgIyBQdWJsaWM6IEltcGxlbWVudCBTZWxlY3RMaXN0VmlldyBtZXRob2QgdG8gZ2VuZXJhdGUgdGhlIHZpZXcgZm9yIGVhY2ggaXRlbS5cbiAgI1xuICAjIHNuaXBwZXQgLSBUaGUgc25pcHBldCB7T2JqZWN0fSB0byByZW5kZXIgYSB2aWV3IGZvci5cbiAgI1xuICAjIFJldHVybnM6IGB1bmRlZmluZWRgXG4gIHZpZXdGb3JJdGVtOiAoc25pcHBldCkgLT5cbiAgICAkJCAtPlxuICAgICAgQGxpIGNsYXNzOiAndHdvLWxpbmVzJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ3ByaW1hcnktbGluZScsIHNuaXBwZXQucHJlZml4XG4gICAgICAgIEBkaXYgY2xhc3M6ICdzZWNvbmRhcnktbGluZScsIHNuaXBwZXQubmFtZVxuXG4gICMgUHVibGljOiBJbXBsZW1lbnQgU2VsZWN0TGlzdFZpZXcgbWV0aG9kIHRvIHByb2Nlc3MgdGhlIHVzZXIgc2VsZWN0aW9uLlxuICAjXG4gICMgc25pcHBldCAtIFRoZSBzbmlwcGV0IHtPYmplY3R9IHRvIGluc2VydC5cbiAgI1xuICAjIFJldHVybnM6IGB1bmRlZmluZWRgXG4gIGNvbmZpcm1lZDogKHNuaXBwZXQpIC0+XG4gICAgZWRpdG9yID0gQGVkaXRvclxuICAgIEBjYW5jZWwoKVxuICAgIGZvciBjdXJzb3IgaW4gZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgQHNuaXBwZXRzLmluc2VydChzbmlwcGV0LmJvZHlUZXh0LCBlZGl0b3IsIGN1cnNvcilcbiJdfQ==
