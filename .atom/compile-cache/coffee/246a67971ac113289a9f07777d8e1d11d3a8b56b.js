(function() {
  var EditorPanel, ScrollView, SettingsPanel,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ScrollView = require('atom-space-pen-views').ScrollView;

  SettingsPanel = require('./settings-panel');

  module.exports = EditorPanel = (function(superClass) {
    extend(EditorPanel, superClass);

    function EditorPanel() {
      return EditorPanel.__super__.constructor.apply(this, arguments);
    }

    EditorPanel.content = function() {
      return this.div({
        tabindex: 0,
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.form({
            "class": 'general-panel section'
          }, function() {
            return _this.div({
              outlet: "loadingElement",
              "class": 'alert alert-info loading-area icon icon-hourglass'
            }, "Loading settings");
          });
        };
      })(this));
    };

    EditorPanel.prototype.initialize = function() {
      var i, len, ref, subPanel;
      EditorPanel.__super__.initialize.apply(this, arguments);
      this.loadingElement.remove();
      this.subPanels = [
        new SettingsPanel('editor', {
          icon: 'code',
          note: '<div class="text icon icon-question" id="editor-settings-note" tabindex="-1">These settings are related to text editing. Some of these can be overriden on a per-language basis. Check language settings by clicking its package card in the <a class="link packages-open">Packages list</a>.</div>'
        })
      ];
      ref = this.subPanels;
      for (i = 0, len = ref.length; i < len; i++) {
        subPanel = ref[i];
        this.append(subPanel);
      }
      this.on('click', '.packages-open', function() {
        return atom.workspace.open('atom://config/packages');
      });
    };

    EditorPanel.prototype.dispose = function() {
      var i, len, ref, subPanel;
      ref = this.subPanels;
      for (i = 0, len = ref.length; i < len; i++) {
        subPanel = ref[i];
        subPanel.dispose();
      }
    };

    return EditorPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9lZGl0b3ItcGFuZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxzQ0FBQTtJQUFBOzs7RUFBQyxhQUFjLE9BQUEsQ0FBUSxzQkFBUjs7RUFDZixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNKLFdBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxRQUFBLEVBQVUsQ0FBVjtRQUFhLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBcEI7T0FBTCxFQUF3QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3RDLEtBQUMsQ0FBQSxJQUFELENBQU07WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVCQUFQO1dBQU4sRUFBc0MsU0FBQTttQkFDcEMsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLE1BQUEsRUFBUSxnQkFBUjtjQUEwQixDQUFBLEtBQUEsQ0FBQSxFQUFPLG1EQUFqQzthQUFMLEVBQTJGLGtCQUEzRjtVQURvQyxDQUF0QztRQURzQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBeEM7SUFEUTs7MEJBS1YsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsNkNBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsTUFBaEIsQ0FBQTtNQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDUCxJQUFBLGFBQUEsQ0FBYyxRQUFkLEVBQXdCO1VBQUEsSUFBQSxFQUFNLE1BQU47VUFBYyxJQUFBLEVBQU0scVNBQXBCO1NBQXhCLENBRE87O0FBTWI7QUFBQSxXQUFBLHFDQUFBOztRQUNFLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUjtBQURGO01BR0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEsZ0JBQWIsRUFBK0IsU0FBQTtlQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0Isd0JBQXBCO01BRDZCLENBQS9CO0lBYlU7OzBCQWtCWixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7QUFBQTtBQUFBLFdBQUEscUNBQUE7O1FBQ0UsUUFBUSxDQUFDLE9BQVQsQ0FBQTtBQURGO0lBRE87Ozs7S0F4QmU7QUFKMUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7U2Nyb2xsVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblNldHRpbmdzUGFuZWwgPSByZXF1aXJlICcuL3NldHRpbmdzLXBhbmVsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBFZGl0b3JQYW5lbCBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiB0YWJpbmRleDogMCwgY2xhc3M6ICdwYW5lbHMtaXRlbScsID0+XG4gICAgICBAZm9ybSBjbGFzczogJ2dlbmVyYWwtcGFuZWwgc2VjdGlvbicsID0+XG4gICAgICAgIEBkaXYgb3V0bGV0OiBcImxvYWRpbmdFbGVtZW50XCIsIGNsYXNzOiAnYWxlcnQgYWxlcnQtaW5mbyBsb2FkaW5nLWFyZWEgaWNvbiBpY29uLWhvdXJnbGFzcycsIFwiTG9hZGluZyBzZXR0aW5nc1wiXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBsb2FkaW5nRWxlbWVudC5yZW1vdmUoKVxuXG4gICAgQHN1YlBhbmVscyA9IFtcbiAgICAgIG5ldyBTZXR0aW5nc1BhbmVsKCdlZGl0b3InLCBpY29uOiAnY29kZScsIG5vdGU6ICcnJ1xuICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dCBpY29uIGljb24tcXVlc3Rpb25cIiBpZD1cImVkaXRvci1zZXR0aW5ncy1ub3RlXCIgdGFiaW5kZXg9XCItMVwiPlRoZXNlIHNldHRpbmdzIGFyZSByZWxhdGVkIHRvIHRleHQgZWRpdGluZy4gU29tZSBvZiB0aGVzZSBjYW4gYmUgb3ZlcnJpZGVuIG9uIGEgcGVyLWxhbmd1YWdlIGJhc2lzLiBDaGVjayBsYW5ndWFnZSBzZXR0aW5ncyBieSBjbGlja2luZyBpdHMgcGFja2FnZSBjYXJkIGluIHRoZSA8YSBjbGFzcz1cImxpbmsgcGFja2FnZXMtb3BlblwiPlBhY2thZ2VzIGxpc3Q8L2E+LjwvZGl2PlxuICAgICAgJycnKVxuICAgIF1cblxuICAgIGZvciBzdWJQYW5lbCBpbiBAc3ViUGFuZWxzXG4gICAgICBAYXBwZW5kKHN1YlBhbmVsKVxuXG4gICAgQG9uICdjbGljaycsICcucGFja2FnZXMtb3BlbicsIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdhdG9tOi8vY29uZmlnL3BhY2thZ2VzJylcblxuICAgIHJldHVyblxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgZm9yIHN1YlBhbmVsIGluIEBzdWJQYW5lbHNcbiAgICAgIHN1YlBhbmVsLmRpc3Bvc2UoKVxuICAgIHJldHVyblxuIl19
