(function() {
  var FuzzyFinderView, GitStatusView, fs, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  fs = require('fs-plus');

  FuzzyFinderView = require('./fuzzy-finder-view');

  module.exports = GitStatusView = (function(superClass) {
    extend(GitStatusView, superClass);

    function GitStatusView() {
      return GitStatusView.__super__.constructor.apply(this, arguments);
    }

    GitStatusView.prototype.toggle = function() {
      var ref;
      if ((ref = this.panel) != null ? ref.isVisible() : void 0) {
        return this.cancel();
      } else if (atom.project.getRepositories().some(function(repo) {
        return repo != null;
      })) {
        this.populate();
        return this.show();
      }
    };

    GitStatusView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'Nothing to commit, working directory clean';
      } else {
        return GitStatusView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    GitStatusView.prototype.populate = function() {
      var filePath, i, len, paths, ref, repo, workingDirectory;
      paths = [];
      ref = atom.project.getRepositories();
      for (i = 0, len = ref.length; i < len; i++) {
        repo = ref[i];
        if (!(repo != null)) {
          continue;
        }
        workingDirectory = repo.getWorkingDirectory();
        for (filePath in repo.statuses) {
          filePath = path.join(workingDirectory, filePath);
          if (fs.isFileSync(filePath)) {
            paths.push(filePath);
          }
        }
      }
      return this.setItems(paths);
    };

    return GitStatusView;

  })(FuzzyFinderView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL2dpdC1zdGF0dXMtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdDQUFBO0lBQUE7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7NEJBQ0osTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsb0NBQVMsQ0FBRSxTQUFSLENBQUEsVUFBSDtlQUNFLElBQUMsQ0FBQSxNQUFELENBQUEsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWIsQ0FBQSxDQUE4QixDQUFDLElBQS9CLENBQW9DLFNBQUMsSUFBRDtlQUFVO01BQVYsQ0FBcEMsQ0FBSDtRQUNILElBQUMsQ0FBQSxRQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBRkc7O0lBSEM7OzRCQU9SLGVBQUEsR0FBaUIsU0FBQyxTQUFEO01BQ2YsSUFBRyxTQUFBLEtBQWEsQ0FBaEI7ZUFDRSw2Q0FERjtPQUFBLE1BQUE7ZUFHRSxvREFBQSxTQUFBLEVBSEY7O0lBRGU7OzRCQU1qQixRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxLQUFBLEdBQVE7QUFDUjtBQUFBLFdBQUEscUNBQUE7O2NBQWdEOzs7UUFDOUMsZ0JBQUEsR0FBbUIsSUFBSSxDQUFDLG1CQUFMLENBQUE7QUFDbkIsYUFBQSx5QkFBQTtVQUNFLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLGdCQUFWLEVBQTRCLFFBQTVCO1VBQ1gsSUFBd0IsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQXhCO1lBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBQUE7O0FBRkY7QUFGRjthQUtBLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVjtJQVBROzs7O0tBZGdCO0FBTDVCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5GdXp6eUZpbmRlclZpZXcgPSByZXF1aXJlICcuL2Z1enp5LWZpbmRlci12aWV3J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBHaXRTdGF0dXNWaWV3IGV4dGVuZHMgRnV6enlGaW5kZXJWaWV3XG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAcGFuZWw/LmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlIGlmIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKS5zb21lKChyZXBvKSAtPiByZXBvPylcbiAgICAgIEBwb3B1bGF0ZSgpXG4gICAgICBAc2hvdygpXG5cbiAgZ2V0RW1wdHlNZXNzYWdlOiAoaXRlbUNvdW50KSAtPlxuICAgIGlmIGl0ZW1Db3VudCBpcyAwXG4gICAgICAnTm90aGluZyB0byBjb21taXQsIHdvcmtpbmcgZGlyZWN0b3J5IGNsZWFuJ1xuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgcG9wdWxhdGU6IC0+XG4gICAgcGF0aHMgPSBbXVxuICAgIGZvciByZXBvIGluIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB3aGVuIHJlcG8/XG4gICAgICB3b3JraW5nRGlyZWN0b3J5ID0gcmVwby5nZXRXb3JraW5nRGlyZWN0b3J5KClcbiAgICAgIGZvciBmaWxlUGF0aCBvZiByZXBvLnN0YXR1c2VzXG4gICAgICAgIGZpbGVQYXRoID0gcGF0aC5qb2luKHdvcmtpbmdEaXJlY3RvcnksIGZpbGVQYXRoKVxuICAgICAgICBwYXRocy5wdXNoKGZpbGVQYXRoKSBpZiBmcy5pc0ZpbGVTeW5jKGZpbGVQYXRoKVxuICAgIEBzZXRJdGVtcyhwYXRocylcbiJdfQ==
