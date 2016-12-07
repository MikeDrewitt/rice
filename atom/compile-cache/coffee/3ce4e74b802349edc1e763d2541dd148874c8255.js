(function() {
  var GrammarListView, SelectListView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SelectListView = require('atom-space-pen-views').SelectListView;

  module.exports = GrammarListView = (function(superClass) {
    extend(GrammarListView, superClass);

    function GrammarListView() {
      return GrammarListView.__super__.constructor.apply(this, arguments);
    }

    GrammarListView.prototype.initialize = function() {
      GrammarListView.__super__.initialize.apply(this, arguments);
      this.addClass('grammar-selector');
      this.list.addClass('mark-active');
      return this.autoDetect = {
        name: 'Auto Detect'
      };
    };

    GrammarListView.prototype.getFilterKey = function() {
      return 'name';
    };

    GrammarListView.prototype.destroy = function() {
      return this.cancel();
    };

    GrammarListView.prototype.viewForItem = function(grammar) {
      var element, grammarName, ref;
      element = document.createElement('li');
      if (grammar === this.currentGrammar) {
        element.classList.add('active');
      }
      grammarName = (ref = grammar.name) != null ? ref : grammar.scopeName;
      element.textContent = grammarName;
      element.dataset.grammar = grammarName;
      return element;
    };

    GrammarListView.prototype.cancelled = function() {
      var ref;
      if ((ref = this.panel) != null) {
        ref.destroy();
      }
      this.panel = null;
      this.editor = null;
      return this.currentGrammar = null;
    };

    GrammarListView.prototype.confirmed = function(grammar) {
      if (atom.textEditors.setGrammarOverride != null) {
        if (grammar === this.autoDetect) {
          atom.textEditors.clearGrammarOverride(this.editor);
        } else {
          atom.textEditors.setGrammarOverride(this.editor, grammar.scopeName);
        }
      } else {
        if (grammar === this.autoDetect) {
          atom.grammars.clearGrammarOverrideForPath(this.editor.getPath());
          this.editor.reloadGrammar();
        } else {
          atom.grammars.setGrammarOverrideForPath(this.editor.getPath(), grammar.scopeName);
          this.editor.setGrammar(grammar);
        }
      }
      return this.cancel();
    };

    GrammarListView.prototype.attach = function() {
      this.storeFocusedElement();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      return this.focusFilterEditor();
    };

    GrammarListView.prototype.toggle = function() {
      if (this.panel != null) {
        return this.cancel();
      } else if (this.editor = atom.workspace.getActiveTextEditor()) {
        this.currentGrammar = this.editor.getGrammar();
        if (this.currentGrammar === atom.grammars.nullGrammar) {
          this.currentGrammar = this.autoDetect;
        }
        this.setItems(this.getGrammars());
        return this.attach();
      }
    };

    GrammarListView.prototype.getGrammars = function() {
      var grammars;
      grammars = atom.grammars.getGrammars().filter(function(grammar) {
        return grammar !== atom.grammars.nullGrammar;
      });
      grammars.sort(function(grammarA, grammarB) {
        var ref, ref1, ref2, ref3;
        if (grammarA.scopeName === 'text.plain') {
          return -1;
        } else if (grammarB.scopeName === 'text.plain') {
          return 1;
        } else {
          return (ref = (ref1 = (ref2 = grammarA.name) != null ? typeof ref2.localeCompare === "function" ? ref2.localeCompare(grammarB.name) : void 0 : void 0) != null ? ref1 : (ref3 = grammarA.scopeName) != null ? typeof ref3.localeCompare === "function" ? ref3.localeCompare(grammarB.name) : void 0 : void 0) != null ? ref : 1;
        }
      });
      grammars.unshift(this.autoDetect);
      return grammars;
    };

    return GrammarListView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ncmFtbWFyLXNlbGVjdG9yL2xpYi9ncmFtbWFyLWxpc3Qtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtCQUFBO0lBQUE7OztFQUFDLGlCQUFrQixPQUFBLENBQVEsc0JBQVI7O0VBR25CLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7OEJBQ0osVUFBQSxHQUFZLFNBQUE7TUFDVixpREFBQSxTQUFBO01BRUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrQkFBVjtNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBTixDQUFlLGFBQWY7YUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQUEsSUFBQSxFQUFNLGFBQU47O0lBTEo7OzhCQU9aLFlBQUEsR0FBYyxTQUFBO2FBQ1o7SUFEWTs7OEJBR2QsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsTUFBRCxDQUFBO0lBRE87OzhCQUdULFdBQUEsR0FBYSxTQUFDLE9BQUQ7QUFDWCxVQUFBO01BQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLElBQXZCO01BQ1YsSUFBbUMsT0FBQSxLQUFXLElBQUMsQ0FBQSxjQUEvQztRQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsUUFBdEIsRUFBQTs7TUFDQSxXQUFBLHdDQUE2QixPQUFPLENBQUM7TUFDckMsT0FBTyxDQUFDLFdBQVIsR0FBc0I7TUFDdEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFoQixHQUEwQjthQUMxQjtJQU5XOzs4QkFRYixTQUFBLEdBQVcsU0FBQTtBQUNULFVBQUE7O1dBQU0sQ0FBRSxPQUFSLENBQUE7O01BQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxNQUFELEdBQVU7YUFDVixJQUFDLENBQUEsY0FBRCxHQUFrQjtJQUpUOzs4QkFNWCxTQUFBLEdBQVcsU0FBQyxPQUFEO01BRVQsSUFBRywyQ0FBSDtRQUNFLElBQUcsT0FBQSxLQUFXLElBQUMsQ0FBQSxVQUFmO1VBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBakIsQ0FBc0MsSUFBQyxDQUFBLE1BQXZDLEVBREY7U0FBQSxNQUFBO1VBR0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBakIsQ0FBb0MsSUFBQyxDQUFBLE1BQXJDLEVBQTZDLE9BQU8sQ0FBQyxTQUFyRCxFQUhGO1NBREY7T0FBQSxNQUFBO1FBTUUsSUFBRyxPQUFBLEtBQVcsSUFBQyxDQUFBLFVBQWY7VUFDRSxJQUFJLENBQUMsUUFBUSxDQUFDLDJCQUFkLENBQTBDLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBLENBQTFDO1VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsRUFGRjtTQUFBLE1BQUE7VUFJRSxJQUFJLENBQUMsUUFBUSxDQUFDLHlCQUFkLENBQXdDLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBLENBQXhDLEVBQTJELE9BQU8sQ0FBQyxTQUFuRTtVQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFtQixPQUFuQixFQUxGO1NBTkY7O2FBWUEsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQWRTOzs4QkFnQlgsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEsbUJBQUQsQ0FBQTs7UUFDQSxJQUFDLENBQUEsUUFBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7VUFBQSxJQUFBLEVBQU0sSUFBTjtTQUE3Qjs7YUFDVixJQUFDLENBQUEsaUJBQUQsQ0FBQTtJQUhNOzs4QkFLUixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUcsa0JBQUg7ZUFDRSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBREY7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBYjtRQUNILElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBO1FBQ2xCLElBQWlDLElBQUMsQ0FBQSxjQUFELEtBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBbEU7VUFBQSxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFDLENBQUEsV0FBbkI7O1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQVY7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBSkc7O0lBSEM7OzhCQVNSLFdBQUEsR0FBYSxTQUFBO0FBQ1gsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWQsQ0FBQSxDQUEyQixDQUFDLE1BQTVCLENBQW1DLFNBQUMsT0FBRDtlQUM1QyxPQUFBLEtBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQztNQURpQixDQUFuQztNQUdYLFFBQVEsQ0FBQyxJQUFULENBQWMsU0FBQyxRQUFELEVBQVcsUUFBWDtBQUNaLFlBQUE7UUFBQSxJQUFHLFFBQVEsQ0FBQyxTQUFULEtBQXNCLFlBQXpCO2lCQUNFLENBQUMsRUFESDtTQUFBLE1BRUssSUFBRyxRQUFRLENBQUMsU0FBVCxLQUFzQixZQUF6QjtpQkFDSCxFQURHO1NBQUEsTUFBQTt3VUFHZ0csRUFIaEc7O01BSE8sQ0FBZDtNQVFBLFFBQVEsQ0FBQyxPQUFULENBQWlCLElBQUMsQ0FBQSxVQUFsQjthQUNBO0lBYlc7Ozs7S0ExRGU7QUFKOUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7U2VsZWN0TGlzdFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbiMgVmlldyB0byBkaXNwbGF5IGEgbGlzdCBvZiBncmFtbWFycyB0byBhcHBseSB0byB0aGUgY3VycmVudCBlZGl0b3IuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHcmFtbWFyTGlzdFZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0Vmlld1xuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG5cbiAgICBAYWRkQ2xhc3MoJ2dyYW1tYXItc2VsZWN0b3InKVxuICAgIEBsaXN0LmFkZENsYXNzKCdtYXJrLWFjdGl2ZScpXG4gICAgQGF1dG9EZXRlY3QgPSBuYW1lOiAnQXV0byBEZXRlY3QnXG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgICduYW1lJ1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGNhbmNlbCgpXG5cbiAgdmlld0Zvckl0ZW06IChncmFtbWFyKSAtPlxuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKSBpZiBncmFtbWFyIGlzIEBjdXJyZW50R3JhbW1hclxuICAgIGdyYW1tYXJOYW1lID0gZ3JhbW1hci5uYW1lID8gZ3JhbW1hci5zY29wZU5hbWVcbiAgICBlbGVtZW50LnRleHRDb250ZW50ID0gZ3JhbW1hck5hbWVcbiAgICBlbGVtZW50LmRhdGFzZXQuZ3JhbW1hciA9IGdyYW1tYXJOYW1lXG4gICAgZWxlbWVudFxuXG4gIGNhbmNlbGxlZDogLT5cbiAgICBAcGFuZWw/LmRlc3Ryb3koKVxuICAgIEBwYW5lbCA9IG51bGxcbiAgICBAZWRpdG9yID0gbnVsbFxuICAgIEBjdXJyZW50R3JhbW1hciA9IG51bGxcblxuICBjb25maXJtZWQ6IChncmFtbWFyKSAtPlxuICAgICMgVE9ETzogcmVtb3ZlIHRoaXMgY29uZGl0aW9uYWwgb25jZSBBdG9tIHYxLjExLjAgaGFzIGJlZW4gb3V0IGZvciBhIHdoaWxlLlxuICAgIGlmIGF0b20udGV4dEVkaXRvcnMuc2V0R3JhbW1hck92ZXJyaWRlP1xuICAgICAgaWYgZ3JhbW1hciBpcyBAYXV0b0RldGVjdFxuICAgICAgICBhdG9tLnRleHRFZGl0b3JzLmNsZWFyR3JhbW1hck92ZXJyaWRlKEBlZGl0b3IpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20udGV4dEVkaXRvcnMuc2V0R3JhbW1hck92ZXJyaWRlKEBlZGl0b3IsIGdyYW1tYXIuc2NvcGVOYW1lKVxuICAgIGVsc2VcbiAgICAgIGlmIGdyYW1tYXIgaXMgQGF1dG9EZXRlY3RcbiAgICAgICAgYXRvbS5ncmFtbWFycy5jbGVhckdyYW1tYXJPdmVycmlkZUZvclBhdGgoQGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgIEBlZGl0b3IucmVsb2FkR3JhbW1hcigpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20uZ3JhbW1hcnMuc2V0R3JhbW1hck92ZXJyaWRlRm9yUGF0aChAZWRpdG9yLmdldFBhdGgoKSwgZ3JhbW1hci5zY29wZU5hbWUpXG4gICAgICAgIEBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuICAgIEBjYW5jZWwoKVxuXG4gIGF0dGFjaDogLT5cbiAgICBAc3RvcmVGb2N1c2VkRWxlbWVudCgpXG4gICAgQHBhbmVsID89IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcylcbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAcGFuZWw/XG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlIGlmIEBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIEBjdXJyZW50R3JhbW1hciA9IEBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICBAY3VycmVudEdyYW1tYXIgPSBAYXV0b0RldGVjdCBpZiBAY3VycmVudEdyYW1tYXIgaXMgYXRvbS5ncmFtbWFycy5udWxsR3JhbW1hclxuICAgICAgQHNldEl0ZW1zKEBnZXRHcmFtbWFycygpKVxuICAgICAgQGF0dGFjaCgpXG5cbiAgZ2V0R3JhbW1hcnM6IC0+XG4gICAgZ3JhbW1hcnMgPSBhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCkuZmlsdGVyIChncmFtbWFyKSAtPlxuICAgICAgZ3JhbW1hciBpc250IGF0b20uZ3JhbW1hcnMubnVsbEdyYW1tYXJcblxuICAgIGdyYW1tYXJzLnNvcnQgKGdyYW1tYXJBLCBncmFtbWFyQikgLT5cbiAgICAgIGlmIGdyYW1tYXJBLnNjb3BlTmFtZSBpcyAndGV4dC5wbGFpbidcbiAgICAgICAgLTFcbiAgICAgIGVsc2UgaWYgZ3JhbW1hckIuc2NvcGVOYW1lIGlzICd0ZXh0LnBsYWluJ1xuICAgICAgICAxXG4gICAgICBlbHNlXG4gICAgICAgIGdyYW1tYXJBLm5hbWU/LmxvY2FsZUNvbXBhcmU/KGdyYW1tYXJCLm5hbWUpID8gZ3JhbW1hckEuc2NvcGVOYW1lPy5sb2NhbGVDb21wYXJlPyhncmFtbWFyQi5uYW1lKSA/IDFcblxuICAgIGdyYW1tYXJzLnVuc2hpZnQoQGF1dG9EZXRlY3QpXG4gICAgZ3JhbW1hcnNcbiJdfQ==
