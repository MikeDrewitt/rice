(function() {
  var SearchHistoryManager, _, settings;

  _ = require('underscore-plus');

  settings = require('./settings');

  module.exports = SearchHistoryManager = (function() {
    SearchHistoryManager.prototype.idx = null;

    function SearchHistoryManager(vimState) {
      this.vimState = vimState;
      this.globalState = this.vimState.globalState;
      this.idx = -1;
    }

    SearchHistoryManager.prototype.get = function(direction) {
      var ref;
      switch (direction) {
        case 'prev':
          if ((this.idx + 1) !== this.getSize()) {
            this.idx += 1;
          }
          break;
        case 'next':
          if (!(this.idx === -1)) {
            this.idx -= 1;
          }
      }
      return (ref = this.globalState.get('searchHistory')[this.idx]) != null ? ref : '';
    };

    SearchHistoryManager.prototype.save = function(entry) {
      if (_.isEmpty(entry)) {
        return;
      }
      this.replaceEntries(_.uniq([entry].concat(this.getEntries())));
      if (this.getSize() > settings.get('historySize')) {
        return this.getEntries().splice(settings.get('historySize'));
      }
    };

    SearchHistoryManager.prototype.reset = function() {
      return this.idx = -1;
    };

    SearchHistoryManager.prototype.clear = function() {
      return this.replaceEntries([]);
    };

    SearchHistoryManager.prototype.getSize = function() {
      return this.getEntries().length;
    };

    SearchHistoryManager.prototype.getEntries = function() {
      return this.globalState.get('searchHistory');
    };

    SearchHistoryManager.prototype.replaceEntries = function(entries) {
      return this.globalState.set('searchHistory', entries);
    };

    SearchHistoryManager.prototype.destroy = function() {
      return this.idx = null;
    };

    return SearchHistoryManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWFyY2gtaGlzdG9yeS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDTTttQ0FDSixHQUFBLEdBQUs7O0lBRVEsOEJBQUMsUUFBRDtNQUFDLElBQUMsQ0FBQSxXQUFEO01BQ1gsSUFBQyxDQUFBLGNBQWUsSUFBQyxDQUFBLFNBQWhCO01BQ0YsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFDO0lBRkc7O21DQUliLEdBQUEsR0FBSyxTQUFDLFNBQUQ7QUFDSCxVQUFBO0FBQUEsY0FBTyxTQUFQO0FBQUEsYUFDTyxNQURQO1VBQ21CLElBQWlCLENBQUMsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFSLENBQUEsS0FBYyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQS9CO1lBQUEsSUFBQyxDQUFBLEdBQUQsSUFBUSxFQUFSOztBQUFaO0FBRFAsYUFFTyxNQUZQO1VBRW1CLElBQUEsQ0FBaUIsQ0FBQyxJQUFDLENBQUEsR0FBRCxLQUFRLENBQUMsQ0FBVixDQUFqQjtZQUFBLElBQUMsQ0FBQSxHQUFELElBQVEsRUFBUjs7QUFGbkI7cUZBRzBDO0lBSnZDOzttQ0FNTCxJQUFBLEdBQU0sU0FBQyxLQUFEO01BQ0osSUFBVSxDQUFDLENBQUMsT0FBRixDQUFVLEtBQVYsQ0FBVjtBQUFBLGVBQUE7O01BQ0EsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxDQUFDLEtBQUQsQ0FBTyxDQUFDLE1BQVIsQ0FBZSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWYsQ0FBUCxDQUFoQjtNQUNBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFBLEdBQWEsUUFBUSxDQUFDLEdBQVQsQ0FBYSxhQUFiLENBQWhCO2VBQ0UsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsTUFBZCxDQUFxQixRQUFRLENBQUMsR0FBVCxDQUFhLGFBQWIsQ0FBckIsRUFERjs7SUFISTs7bUNBTU4sS0FBQSxHQUFPLFNBQUE7YUFDTCxJQUFDLENBQUEsR0FBRCxHQUFPLENBQUM7SUFESDs7bUNBR1AsS0FBQSxHQUFPLFNBQUE7YUFDTCxJQUFDLENBQUEsY0FBRCxDQUFnQixFQUFoQjtJQURLOzttQ0FHUCxPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYSxDQUFDO0lBRFA7O21DQUdULFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLGVBQWpCO0lBRFU7O21DQUdaLGNBQUEsR0FBZ0IsU0FBQyxPQUFEO2FBQ2QsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWtDLE9BQWxDO0lBRGM7O21DQUdoQixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxHQUFELEdBQU87SUFEQTs7Ozs7QUF0Q1giLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWFyY2hIaXN0b3J5TWFuYWdlclxuICBpZHg6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGdsb2JhbFN0YXRlfSA9IEB2aW1TdGF0ZVxuICAgIEBpZHggPSAtMVxuXG4gIGdldDogKGRpcmVjdGlvbikgLT5cbiAgICBzd2l0Y2ggZGlyZWN0aW9uXG4gICAgICB3aGVuICdwcmV2JyB0aGVuIEBpZHggKz0gMSB1bmxlc3MgKEBpZHggKyAxKSBpcyBAZ2V0U2l6ZSgpXG4gICAgICB3aGVuICduZXh0JyB0aGVuIEBpZHggLT0gMSB1bmxlc3MgKEBpZHggaXMgLTEpXG4gICAgQGdsb2JhbFN0YXRlLmdldCgnc2VhcmNoSGlzdG9yeScpW0BpZHhdID8gJydcblxuICBzYXZlOiAoZW50cnkpIC0+XG4gICAgcmV0dXJuIGlmIF8uaXNFbXB0eShlbnRyeSlcbiAgICBAcmVwbGFjZUVudHJpZXMgXy51bmlxKFtlbnRyeV0uY29uY2F0IEBnZXRFbnRyaWVzKCkpXG4gICAgaWYgQGdldFNpemUoKSA+IHNldHRpbmdzLmdldCgnaGlzdG9yeVNpemUnKVxuICAgICAgQGdldEVudHJpZXMoKS5zcGxpY2Ugc2V0dGluZ3MuZ2V0KCdoaXN0b3J5U2l6ZScpXG5cbiAgcmVzZXQ6IC0+XG4gICAgQGlkeCA9IC0xXG5cbiAgY2xlYXI6IC0+XG4gICAgQHJlcGxhY2VFbnRyaWVzIFtdXG5cbiAgZ2V0U2l6ZTogLT5cbiAgICBAZ2V0RW50cmllcygpLmxlbmd0aFxuXG4gIGdldEVudHJpZXM6IC0+XG4gICAgQGdsb2JhbFN0YXRlLmdldCgnc2VhcmNoSGlzdG9yeScpXG5cbiAgcmVwbGFjZUVudHJpZXM6IChlbnRyaWVzKSAtPlxuICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ3NlYXJjaEhpc3RvcnknLCBlbnRyaWVzKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGlkeCA9IG51bGxcbiJdfQ==
