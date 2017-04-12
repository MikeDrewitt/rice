(function() {
  var SearchViewModel, ViewModel,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ViewModel = require('./view-model').ViewModel;

  module.exports = SearchViewModel = (function(superClass) {
    extend(SearchViewModel, superClass);

    function SearchViewModel(searchMotion) {
      this.searchMotion = searchMotion;
      this.confirm = bind(this.confirm, this);
      this.decreaseHistorySearch = bind(this.decreaseHistorySearch, this);
      this.increaseHistorySearch = bind(this.increaseHistorySearch, this);
      SearchViewModel.__super__.constructor.call(this, this.searchMotion, {
        "class": 'search'
      });
      this.historyIndex = -1;
      atom.commands.add(this.view.editorElement, 'core:move-up', this.increaseHistorySearch);
      atom.commands.add(this.view.editorElement, 'core:move-down', this.decreaseHistorySearch);
    }

    SearchViewModel.prototype.restoreHistory = function(index) {
      return this.view.editorElement.getModel().setText(this.history(index));
    };

    SearchViewModel.prototype.history = function(index) {
      return this.vimState.getSearchHistoryItem(index);
    };

    SearchViewModel.prototype.increaseHistorySearch = function() {
      if (this.history(this.historyIndex + 1) != null) {
        this.historyIndex += 1;
        return this.restoreHistory(this.historyIndex);
      }
    };

    SearchViewModel.prototype.decreaseHistorySearch = function() {
      if (this.historyIndex <= 0) {
        this.historyIndex = -1;
        return this.view.editorElement.getModel().setText('');
      } else {
        this.historyIndex -= 1;
        return this.restoreHistory(this.historyIndex);
      }
    };

    SearchViewModel.prototype.confirm = function(view) {
      var lastSearch, repeatChar;
      repeatChar = this.searchMotion.initiallyReversed ? '?' : '/';
      if (this.view.value === '' || this.view.value === repeatChar) {
        lastSearch = this.history(0);
        if (lastSearch != null) {
          this.view.value = lastSearch;
        } else {
          this.view.value = '';
          atom.beep();
        }
      }
      SearchViewModel.__super__.confirm.call(this, view);
      return this.vimState.pushSearchHistory(this.view.value);
    };

    SearchViewModel.prototype.update = function(reverse) {
      if (reverse) {
        this.view.classList.add('reverse-search-input');
        return this.view.classList.remove('search-input');
      } else {
        this.view.classList.add('search-input');
        return this.view.classList.remove('reverse-search-input');
      }
    };

    return SearchViewModel;

  })(ViewModel);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdmlldy1tb2RlbHMvc2VhcmNoLXZpZXctbW9kZWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwQkFBQTtJQUFBOzs7O0VBQUMsWUFBYSxPQUFBLENBQVEsY0FBUjs7RUFFZCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyx5QkFBQyxZQUFEO01BQUMsSUFBQyxDQUFBLGVBQUQ7Ozs7TUFDWixpREFBTSxJQUFDLENBQUEsWUFBUCxFQUFxQjtRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtPQUFyQjtNQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7TUFFakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBeEIsRUFBdUMsY0FBdkMsRUFBdUQsSUFBQyxDQUFBLHFCQUF4RDtNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsSUFBSSxDQUFDLGFBQXhCLEVBQXVDLGdCQUF2QyxFQUF5RCxJQUFDLENBQUEscUJBQTFEO0lBTFc7OzhCQU9iLGNBQUEsR0FBZ0IsU0FBQyxLQUFEO2FBQ2QsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBcEIsQ0FBQSxDQUE4QixDQUFDLE9BQS9CLENBQXVDLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUF2QztJQURjOzs4QkFHaEIsT0FBQSxHQUFTLFNBQUMsS0FBRDthQUNQLElBQUMsQ0FBQSxRQUFRLENBQUMsb0JBQVYsQ0FBK0IsS0FBL0I7SUFETzs7OEJBR1QscUJBQUEsR0FBdUIsU0FBQTtNQUNyQixJQUFHLDJDQUFIO1FBQ0UsSUFBQyxDQUFBLFlBQUQsSUFBaUI7ZUFDakIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBQyxDQUFBLFlBQWpCLEVBRkY7O0lBRHFCOzs4QkFLdkIscUJBQUEsR0FBdUIsU0FBQTtNQUNyQixJQUFHLElBQUMsQ0FBQSxZQUFELElBQWlCLENBQXBCO1FBRUUsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQztlQUNqQixJQUFDLENBQUEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFwQixDQUFBLENBQThCLENBQUMsT0FBL0IsQ0FBdUMsRUFBdkMsRUFIRjtPQUFBLE1BQUE7UUFLRSxJQUFDLENBQUEsWUFBRCxJQUFpQjtlQUNqQixJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsWUFBakIsRUFORjs7SUFEcUI7OzhCQVN2QixPQUFBLEdBQVMsU0FBQyxJQUFEO0FBQ1AsVUFBQTtNQUFBLFVBQUEsR0FBZ0IsSUFBQyxDQUFBLFlBQVksQ0FBQyxpQkFBakIsR0FBd0MsR0FBeEMsR0FBaUQ7TUFDOUQsSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sS0FBZSxFQUFmLElBQXFCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixLQUFlLFVBQXZDO1FBQ0UsVUFBQSxHQUFhLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBVDtRQUNiLElBQUcsa0JBQUg7VUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sR0FBYyxXQURoQjtTQUFBLE1BQUE7VUFHRSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sR0FBYztVQUNkLElBQUksQ0FBQyxJQUFMLENBQUEsRUFKRjtTQUZGOztNQU9BLDZDQUFNLElBQU47YUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLGlCQUFWLENBQTRCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBbEM7SUFWTzs7OEJBWVQsTUFBQSxHQUFRLFNBQUMsT0FBRDtNQUNOLElBQUcsT0FBSDtRQUNFLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLHNCQUFwQjtlQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQWhCLENBQXVCLGNBQXZCLEVBRkY7T0FBQSxNQUFBO1FBSUUsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBaEIsQ0FBb0IsY0FBcEI7ZUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFoQixDQUF1QixzQkFBdkIsRUFMRjs7SUFETTs7OztLQXhDb0I7QUFIOUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Vmlld01vZGVsfSA9IHJlcXVpcmUgJy4vdmlldy1tb2RlbCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2VhcmNoVmlld01vZGVsIGV4dGVuZHMgVmlld01vZGVsXG4gIGNvbnN0cnVjdG9yOiAoQHNlYXJjaE1vdGlvbikgLT5cbiAgICBzdXBlcihAc2VhcmNoTW90aW9uLCBjbGFzczogJ3NlYXJjaCcpXG4gICAgQGhpc3RvcnlJbmRleCA9IC0xXG5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZChAdmlldy5lZGl0b3JFbGVtZW50LCAnY29yZTptb3ZlLXVwJywgQGluY3JlYXNlSGlzdG9yeVNlYXJjaClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChAdmlldy5lZGl0b3JFbGVtZW50LCAnY29yZTptb3ZlLWRvd24nLCBAZGVjcmVhc2VIaXN0b3J5U2VhcmNoKVxuXG4gIHJlc3RvcmVIaXN0b3J5OiAoaW5kZXgpIC0+XG4gICAgQHZpZXcuZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpLnNldFRleHQoQGhpc3RvcnkoaW5kZXgpKVxuXG4gIGhpc3Rvcnk6IChpbmRleCkgLT5cbiAgICBAdmltU3RhdGUuZ2V0U2VhcmNoSGlzdG9yeUl0ZW0oaW5kZXgpXG5cbiAgaW5jcmVhc2VIaXN0b3J5U2VhcmNoOiA9PlxuICAgIGlmIEBoaXN0b3J5KEBoaXN0b3J5SW5kZXggKyAxKT9cbiAgICAgIEBoaXN0b3J5SW5kZXggKz0gMVxuICAgICAgQHJlc3RvcmVIaXN0b3J5KEBoaXN0b3J5SW5kZXgpXG5cbiAgZGVjcmVhc2VIaXN0b3J5U2VhcmNoOiA9PlxuICAgIGlmIEBoaXN0b3J5SW5kZXggPD0gMFxuICAgICAgIyBnZXQgdXMgYmFjayB0byBhIGNsZWFuIHNsYXRlXG4gICAgICBAaGlzdG9yeUluZGV4ID0gLTFcbiAgICAgIEB2aWV3LmVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKS5zZXRUZXh0KCcnKVxuICAgIGVsc2VcbiAgICAgIEBoaXN0b3J5SW5kZXggLT0gMVxuICAgICAgQHJlc3RvcmVIaXN0b3J5KEBoaXN0b3J5SW5kZXgpXG5cbiAgY29uZmlybTogKHZpZXcpID0+XG4gICAgcmVwZWF0Q2hhciA9IGlmIEBzZWFyY2hNb3Rpb24uaW5pdGlhbGx5UmV2ZXJzZWQgdGhlbiAnPycgZWxzZSAnLydcbiAgICBpZiBAdmlldy52YWx1ZSBpcyAnJyBvciBAdmlldy52YWx1ZSBpcyByZXBlYXRDaGFyXG4gICAgICBsYXN0U2VhcmNoID0gQGhpc3RvcnkoMClcbiAgICAgIGlmIGxhc3RTZWFyY2g/XG4gICAgICAgIEB2aWV3LnZhbHVlID0gbGFzdFNlYXJjaFxuICAgICAgZWxzZVxuICAgICAgICBAdmlldy52YWx1ZSA9ICcnXG4gICAgICAgIGF0b20uYmVlcCgpXG4gICAgc3VwZXIodmlldylcbiAgICBAdmltU3RhdGUucHVzaFNlYXJjaEhpc3RvcnkoQHZpZXcudmFsdWUpXG5cbiAgdXBkYXRlOiAocmV2ZXJzZSkgLT5cbiAgICBpZiByZXZlcnNlXG4gICAgICBAdmlldy5jbGFzc0xpc3QuYWRkKCdyZXZlcnNlLXNlYXJjaC1pbnB1dCcpXG4gICAgICBAdmlldy5jbGFzc0xpc3QucmVtb3ZlKCdzZWFyY2gtaW5wdXQnKVxuICAgIGVsc2VcbiAgICAgIEB2aWV3LmNsYXNzTGlzdC5hZGQoJ3NlYXJjaC1pbnB1dCcpXG4gICAgICBAdmlldy5jbGFzc0xpc3QucmVtb3ZlKCdyZXZlcnNlLXNlYXJjaC1pbnB1dCcpXG4iXX0=
