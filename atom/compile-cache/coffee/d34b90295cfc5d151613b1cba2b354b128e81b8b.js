(function() {
  module.exports = {
    provider: null,
    activate: function() {},
    deactivate: function() {
      return this.provider = null;
    },
    provide: function() {
      var SnippetsProvider;
      if (this.provider == null) {
        SnippetsProvider = require('./snippets-provider');
        this.provider = new SnippetsProvider();
        if (this.snippets != null) {
          this.provider.setSnippetsSource(this.snippets);
        }
      }
      return this.provider;
    },
    consumeSnippets: function(snippets) {
      var ref;
      this.snippets = snippets;
      return (ref = this.provider) != null ? ref.setSnippetsSource(this.snippets) : void 0;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvY29tcGxldGUtc25pcHBldHMvbGliL2F1dG9jb21wbGV0ZS1zbmlwcGV0cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFFQSxRQUFBLEVBQVUsU0FBQSxHQUFBLENBRlY7SUFJQSxVQUFBLEVBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFERixDQUpaO0lBT0EsT0FBQSxFQUFTLFNBQUE7QUFDUCxVQUFBO01BQUEsSUFBTyxxQkFBUDtRQUNFLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxxQkFBUjtRQUNuQixJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLGdCQUFBLENBQUE7UUFDaEIsSUFBMEMscUJBQTFDO1VBQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxpQkFBVixDQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQTtTQUhGOzthQUtBLElBQUMsQ0FBQTtJQU5NLENBUFQ7SUFlQSxlQUFBLEVBQWlCLFNBQUMsUUFBRDtBQUNmLFVBQUE7TUFEZ0IsSUFBQyxDQUFBLFdBQUQ7Z0RBQ1AsQ0FBRSxpQkFBWCxDQUE2QixJQUFDLENBQUEsUUFBOUI7SUFEZSxDQWZqQjs7QUFERiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbiAgcHJvdmlkZXI6IG51bGxcblxuICBhY3RpdmF0ZTogLT5cblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBwcm92aWRlciA9IG51bGxcblxuICBwcm92aWRlOiAtPlxuICAgIHVubGVzcyBAcHJvdmlkZXI/XG4gICAgICBTbmlwcGV0c1Byb3ZpZGVyID0gcmVxdWlyZSgnLi9zbmlwcGV0cy1wcm92aWRlcicpXG4gICAgICBAcHJvdmlkZXIgPSBuZXcgU25pcHBldHNQcm92aWRlcigpXG4gICAgICBAcHJvdmlkZXIuc2V0U25pcHBldHNTb3VyY2UoQHNuaXBwZXRzKSBpZiBAc25pcHBldHM/XG5cbiAgICBAcHJvdmlkZXJcblxuICBjb25zdW1lU25pcHBldHM6IChAc25pcHBldHMpIC0+XG4gICAgQHByb3ZpZGVyPy5zZXRTbmlwcGV0c1NvdXJjZShAc25pcHBldHMpXG4iXX0=
