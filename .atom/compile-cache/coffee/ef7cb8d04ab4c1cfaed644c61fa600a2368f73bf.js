(function() {
  var $, $$, $$$, ExampleSelectListView, Highlights, View, _, beautifyHtml, coffee, highlighter, ref;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, $$ = ref.$$, $$$ = ref.$$$, View = ref.View;

  coffee = require('coffee-script');

  beautifyHtml = require('js-beautify').html;

  Highlights = require('highlights');

  ExampleSelectListView = require('./example-select-list-view');

  highlighter = null;

  _.extend(View, {
    exampleHtml: function(html) {
      return this.div({
        "class": 'example'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'example-rendered'
          }, function() {
            return _this.raw(html);
          });
          return _this.div({
            "class": 'example-code show-example-html'
          }, function() {
            return _this.colorizedCodeBlock('example-html', 'text.xml', beautifyHtml(html));
          });
        };
      })(this));
    },
    exampleOverlaySelectList: function() {
      var coffeeScript, selectList;
      selectList = new ExampleSelectListView(['one', 'two', 'three']);
      coffeeScript = "{SelectListView, $$} = require 'atom-space-pen-views'\n\nmodule.exports =\nclass ExampleSelectListView extends SelectListView\n  initialize: (@listOfItems) ->\n    super\n    @setItems(@listOfItems)\n\n  viewForItem: (item) ->\n    $$ -> @li(item)\n\n  cancel: ->\n    console.log(\"cancelled\")\n\n  confirmed: (item) ->\n    console.log(\"confirmed\", item)";
      return this.div({
        "class": 'example'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'example-rendered'
          }, function() {
            return _this.tag('atom-panel', {
              "class": 'modal'
            }, function() {
              return _this.subview('__', selectList);
            });
          });
          return _this.div({
            "class": 'example-code show-example-space-pen'
          }, function() {
            return _this.colorizedCodeBlock('example-space-pen', 'source.coffee', coffeeScript);
          });
        };
      })(this));
    },
    colorizedCodeBlock: function(cssClass, grammarScopeName, code) {
      var fontFamily, highlightedBlock, highlightedHtml;
      if (highlighter == null) {
        highlighter = new Highlights({
          registry: atom.grammars
        });
      }
      highlightedHtml = highlighter.highlightSync({
        fileContents: code,
        scopeName: grammarScopeName
      });
      highlightedBlock = $(highlightedHtml);
      highlightedBlock.removeClass('editor');
      highlightedBlock.addClass(cssClass);
      if (fontFamily = atom.config.get('editor.fontFamily')) {
        highlightedBlock.css('font-family', fontFamily);
      }
      return this.subview('__', highlightedBlock);
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zdHlsZWd1aWRlL2xpYi9zcGFjZS1wZW4tZXh0ZW5zaW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBcUIsT0FBQSxDQUFRLHNCQUFSLENBQXJCLEVBQUMsU0FBRCxFQUFJLFdBQUosRUFBUSxhQUFSLEVBQWE7O0VBQ2IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSOztFQUNULFlBQUEsR0FBZSxPQUFBLENBQVEsYUFBUixDQUFzQixDQUFDOztFQUN0QyxVQUFBLEdBQWEsT0FBQSxDQUFRLFlBQVI7O0VBQ2IscUJBQUEsR0FBd0IsT0FBQSxDQUFRLDRCQUFSOztFQUV4QixXQUFBLEdBQWM7O0VBRWQsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQ0U7SUFBQSxXQUFBLEVBQWEsU0FBQyxJQUFEO2FBQ1gsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtPQUFMLEVBQXVCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNyQixLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQkFBUDtXQUFMLEVBQWdDLFNBQUE7bUJBQzlCLEtBQUMsQ0FBQSxHQUFELENBQUssSUFBTDtVQUQ4QixDQUFoQztpQkFHQSxLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtXQUFMLEVBQThDLFNBQUE7bUJBQzVDLEtBQUMsQ0FBQSxrQkFBRCxDQUFvQixjQUFwQixFQUFvQyxVQUFwQyxFQUFnRCxZQUFBLENBQWEsSUFBYixDQUFoRDtVQUQ0QyxDQUE5QztRQUpxQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkI7SUFEVyxDQUFiO0lBUUEsd0JBQUEsRUFBMEIsU0FBQTtBQUN4QixVQUFBO01BQUEsVUFBQSxHQUFpQixJQUFBLHFCQUFBLENBQXNCLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxPQUFmLENBQXRCO01BQ2pCLFlBQUEsR0FBZTthQW1CZixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO09BQUwsRUFBdUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3JCLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1dBQUwsRUFBZ0MsU0FBQTttQkFDOUIsS0FBQyxDQUFBLEdBQUQsQ0FBSyxZQUFMLEVBQW1CO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxPQUFQO2FBQW5CLEVBQW1DLFNBQUE7cUJBQ2pDLEtBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUFlLFVBQWY7WUFEaUMsQ0FBbkM7VUFEOEIsQ0FBaEM7aUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8scUNBQVA7V0FBTCxFQUFtRCxTQUFBO21CQUNqRCxLQUFDLENBQUEsa0JBQUQsQ0FBb0IsbUJBQXBCLEVBQXlDLGVBQXpDLEVBQTBELFlBQTFEO1VBRGlELENBQW5EO1FBSnFCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QjtJQXJCd0IsQ0FSMUI7SUFvQ0Esa0JBQUEsRUFBb0IsU0FBQyxRQUFELEVBQVcsZ0JBQVgsRUFBNkIsSUFBN0I7QUFDbEIsVUFBQTs7UUFBQSxjQUFtQixJQUFBLFVBQUEsQ0FBVztVQUFBLFFBQUEsRUFBVSxJQUFJLENBQUMsUUFBZjtTQUFYOztNQUNuQixlQUFBLEdBQWtCLFdBQVcsQ0FBQyxhQUFaLENBQ2hCO1FBQUEsWUFBQSxFQUFjLElBQWQ7UUFDQSxTQUFBLEVBQVcsZ0JBRFg7T0FEZ0I7TUFJbEIsZ0JBQUEsR0FBbUIsQ0FBQSxDQUFFLGVBQUY7TUFFbkIsZ0JBQWdCLENBQUMsV0FBakIsQ0FBNkIsUUFBN0I7TUFDQSxnQkFBZ0IsQ0FBQyxRQUFqQixDQUEwQixRQUExQjtNQUNBLElBQUcsVUFBQSxHQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixtQkFBaEIsQ0FBaEI7UUFDRSxnQkFBZ0IsQ0FBQyxHQUFqQixDQUFxQixhQUFyQixFQUFvQyxVQUFwQyxFQURGOzthQUdBLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQUFlLGdCQUFmO0lBYmtCLENBcENwQjtHQURGO0FBVEEiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xueyQsICQkLCAkJCQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5jb2ZmZWUgPSByZXF1aXJlICdjb2ZmZWUtc2NyaXB0J1xuYmVhdXRpZnlIdG1sID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5odG1sXG5IaWdobGlnaHRzID0gcmVxdWlyZSAnaGlnaGxpZ2h0cydcbkV4YW1wbGVTZWxlY3RMaXN0VmlldyA9IHJlcXVpcmUgJy4vZXhhbXBsZS1zZWxlY3QtbGlzdC12aWV3J1xuXG5oaWdobGlnaHRlciA9IG51bGxcblxuXy5leHRlbmQgVmlldyxcbiAgZXhhbXBsZUh0bWw6IChodG1sKSAtPlxuICAgIEBkaXYgY2xhc3M6ICdleGFtcGxlJywgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdleGFtcGxlLXJlbmRlcmVkJywgPT5cbiAgICAgICAgQHJhdyBodG1sXG5cbiAgICAgIEBkaXYgY2xhc3M6ICdleGFtcGxlLWNvZGUgc2hvdy1leGFtcGxlLWh0bWwnLCA9PlxuICAgICAgICBAY29sb3JpemVkQ29kZUJsb2NrICdleGFtcGxlLWh0bWwnLCAndGV4dC54bWwnLCBiZWF1dGlmeUh0bWwoaHRtbClcblxuICBleGFtcGxlT3ZlcmxheVNlbGVjdExpc3Q6IC0+XG4gICAgc2VsZWN0TGlzdCA9IG5ldyBFeGFtcGxlU2VsZWN0TGlzdFZpZXcoWydvbmUnLCAndHdvJywgJ3RocmVlJ10pXG4gICAgY29mZmVlU2NyaXB0ID0gXCJcIlwiXG4gICAgICB7U2VsZWN0TGlzdFZpZXcsICQkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG4gICAgICBtb2R1bGUuZXhwb3J0cyA9XG4gICAgICBjbGFzcyBFeGFtcGxlU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICAgICAgICBpbml0aWFsaXplOiAoQGxpc3RPZkl0ZW1zKSAtPlxuICAgICAgICAgIHN1cGVyXG4gICAgICAgICAgQHNldEl0ZW1zKEBsaXN0T2ZJdGVtcylcblxuICAgICAgICB2aWV3Rm9ySXRlbTogKGl0ZW0pIC0+XG4gICAgICAgICAgJCQgLT4gQGxpKGl0ZW0pXG5cbiAgICAgICAgY2FuY2VsOiAtPlxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2FuY2VsbGVkXCIpXG5cbiAgICAgICAgY29uZmlybWVkOiAoaXRlbSkgLT5cbiAgICAgICAgICBjb25zb2xlLmxvZyhcImNvbmZpcm1lZFwiLCBpdGVtKVxuICAgIFwiXCJcIlxuXG4gICAgQGRpdiBjbGFzczogJ2V4YW1wbGUnLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ2V4YW1wbGUtcmVuZGVyZWQnLCA9PlxuICAgICAgICBAdGFnICdhdG9tLXBhbmVsJywgY2xhc3M6ICdtb2RhbCcsID0+XG4gICAgICAgICAgQHN1YnZpZXcgJ19fJywgc2VsZWN0TGlzdFxuICAgICAgQGRpdiBjbGFzczogJ2V4YW1wbGUtY29kZSBzaG93LWV4YW1wbGUtc3BhY2UtcGVuJywgPT5cbiAgICAgICAgQGNvbG9yaXplZENvZGVCbG9jayAnZXhhbXBsZS1zcGFjZS1wZW4nLCAnc291cmNlLmNvZmZlZScsIGNvZmZlZVNjcmlwdFxuXG4gIGNvbG9yaXplZENvZGVCbG9jazogKGNzc0NsYXNzLCBncmFtbWFyU2NvcGVOYW1lLCBjb2RlKSAtPlxuICAgIGhpZ2hsaWdodGVyID89IG5ldyBIaWdobGlnaHRzKHJlZ2lzdHJ5OiBhdG9tLmdyYW1tYXJzKVxuICAgIGhpZ2hsaWdodGVkSHRtbCA9IGhpZ2hsaWdodGVyLmhpZ2hsaWdodFN5bmNcbiAgICAgIGZpbGVDb250ZW50czogY29kZVxuICAgICAgc2NvcGVOYW1lOiBncmFtbWFyU2NvcGVOYW1lXG5cbiAgICBoaWdobGlnaHRlZEJsb2NrID0gJChoaWdobGlnaHRlZEh0bWwpXG4gICAgIyBUaGUgYGVkaXRvcmAgY2xhc3MgbWVzc2VzIHRoaW5ncyB1cCBhcyBgLmVkaXRvcmAgaGFzIGFic29sdXRlbHkgcG9zaXRpb25lZCBsaW5lc1xuICAgIGhpZ2hsaWdodGVkQmxvY2sucmVtb3ZlQ2xhc3MoJ2VkaXRvcicpXG4gICAgaGlnaGxpZ2h0ZWRCbG9jay5hZGRDbGFzcyhjc3NDbGFzcylcbiAgICBpZiBmb250RmFtaWx5ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgICBoaWdobGlnaHRlZEJsb2NrLmNzcygnZm9udC1mYW1pbHknLCBmb250RmFtaWx5KVxuXG4gICAgQHN1YnZpZXcgJ19fJywgaGlnaGxpZ2h0ZWRCbG9ja1xuIl19
