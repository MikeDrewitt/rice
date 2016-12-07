(function() {
  var ownerFromRepository, packageComparatorAscending;

  ownerFromRepository = function(repository) {
    var loginRegex, ref, ref1, repo, repoName;
    if (!repository) {
      return '';
    }
    loginRegex = /github\.com\/([\w-]+)\/.+/;
    if (typeof repository === "string") {
      repo = repository;
    } else {
      repo = repository.url;
      if (repo.match('git@github')) {
        repoName = repo.split(':')[1];
        repo = "https://github.com/" + repoName;
      }
    }
    if (!repo.match("github.com/")) {
      repo = "https://github.com/" + repo;
    }
    return (ref = (ref1 = repo.match(loginRegex)) != null ? ref1[1] : void 0) != null ? ref : '';
  };

  packageComparatorAscending = function(left, right) {
    var leftStatus, rightStatus;
    leftStatus = atom.packages.isPackageDisabled(left.name);
    rightStatus = atom.packages.isPackageDisabled(right.name);
    if (leftStatus === rightStatus) {
      if (left.name > right.name) {
        return -1;
      } else if (left.name < right.name) {
        return 1;
      } else {
        return 0;
      }
    } else if (leftStatus > rightStatus) {
      return -1;
    } else {
      return 1;
    }
  };

  module.exports = {
    ownerFromRepository: ownerFromRepository,
    packageComparatorAscending: packageComparatorAscending
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi91dGlscy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLG1CQUFBLEdBQXNCLFNBQUMsVUFBRDtBQUNwQixRQUFBO0lBQUEsSUFBQSxDQUFpQixVQUFqQjtBQUFBLGFBQU8sR0FBUDs7SUFDQSxVQUFBLEdBQWE7SUFDYixJQUFHLE9BQU8sVUFBUCxLQUFzQixRQUF6QjtNQUNFLElBQUEsR0FBTyxXQURUO0tBQUEsTUFBQTtNQUdFLElBQUEsR0FBTyxVQUFVLENBQUM7TUFDbEIsSUFBRyxJQUFJLENBQUMsS0FBTCxDQUFXLFlBQVgsQ0FBSDtRQUNFLFFBQUEsR0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBZ0IsQ0FBQSxDQUFBO1FBQzNCLElBQUEsR0FBTyxxQkFBQSxHQUFzQixTQUYvQjtPQUpGOztJQVFBLElBQUEsQ0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLGFBQVgsQ0FBUDtNQUNFLElBQUEsR0FBTyxxQkFBQSxHQUFzQixLQUQvQjs7OEZBRzZCO0VBZFQ7O0VBZ0J0QiwwQkFBQSxHQUE2QixTQUFDLElBQUQsRUFBTyxLQUFQO0FBQzNCLFFBQUE7SUFBQSxVQUFBLEdBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBZCxDQUFnQyxJQUFJLENBQUMsSUFBckM7SUFDYixXQUFBLEdBQWMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBZCxDQUFnQyxLQUFLLENBQUMsSUFBdEM7SUFDZCxJQUFHLFVBQUEsS0FBYyxXQUFqQjtNQUNFLElBQUcsSUFBSSxDQUFDLElBQUwsR0FBWSxLQUFLLENBQUMsSUFBckI7ZUFDRSxDQUFDLEVBREg7T0FBQSxNQUVLLElBQUcsSUFBSSxDQUFDLElBQUwsR0FBWSxLQUFLLENBQUMsSUFBckI7ZUFDSCxFQURHO09BQUEsTUFBQTtlQUdILEVBSEc7T0FIUDtLQUFBLE1BT0ssSUFBRyxVQUFBLEdBQWEsV0FBaEI7YUFDSCxDQUFDLEVBREU7S0FBQSxNQUFBO2FBR0gsRUFIRzs7RUFWc0I7O0VBZTdCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUMscUJBQUEsbUJBQUQ7SUFBc0IsNEJBQUEsMEJBQXRCOztBQS9CakIiLCJzb3VyY2VzQ29udGVudCI6WyJvd25lckZyb21SZXBvc2l0b3J5ID0gKHJlcG9zaXRvcnkpIC0+XG4gIHJldHVybiAnJyB1bmxlc3MgcmVwb3NpdG9yeVxuICBsb2dpblJlZ2V4ID0gL2dpdGh1YlxcLmNvbVxcLyhbXFx3LV0rKVxcLy4rL1xuICBpZiB0eXBlb2YocmVwb3NpdG9yeSkgaXMgXCJzdHJpbmdcIlxuICAgIHJlcG8gPSByZXBvc2l0b3J5XG4gIGVsc2VcbiAgICByZXBvID0gcmVwb3NpdG9yeS51cmxcbiAgICBpZiByZXBvLm1hdGNoICdnaXRAZ2l0aHViJ1xuICAgICAgcmVwb05hbWUgPSByZXBvLnNwbGl0KCc6JylbMV1cbiAgICAgIHJlcG8gPSBcImh0dHBzOi8vZ2l0aHViLmNvbS8je3JlcG9OYW1lfVwiXG5cbiAgdW5sZXNzIHJlcG8ubWF0Y2goXCJnaXRodWIuY29tL1wiKVxuICAgIHJlcG8gPSBcImh0dHBzOi8vZ2l0aHViLmNvbS8je3JlcG99XCJcblxuICByZXBvLm1hdGNoKGxvZ2luUmVnZXgpP1sxXSA/ICcnXG5cbnBhY2thZ2VDb21wYXJhdG9yQXNjZW5kaW5nID0gKGxlZnQsIHJpZ2h0KSAtPlxuICBsZWZ0U3RhdHVzID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VEaXNhYmxlZChsZWZ0Lm5hbWUpXG4gIHJpZ2h0U3RhdHVzID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VEaXNhYmxlZChyaWdodC5uYW1lKVxuICBpZiBsZWZ0U3RhdHVzIGlzIHJpZ2h0U3RhdHVzXG4gICAgaWYgbGVmdC5uYW1lID4gcmlnaHQubmFtZVxuICAgICAgLTFcbiAgICBlbHNlIGlmIGxlZnQubmFtZSA8IHJpZ2h0Lm5hbWVcbiAgICAgIDFcbiAgICBlbHNlXG4gICAgICAwXG4gIGVsc2UgaWYgbGVmdFN0YXR1cyA+IHJpZ2h0U3RhdHVzXG4gICAgLTFcbiAgZWxzZVxuICAgIDFcblxubW9kdWxlLmV4cG9ydHMgPSB7b3duZXJGcm9tUmVwb3NpdG9yeSwgcGFja2FnZUNvbXBhcmF0b3JBc2NlbmRpbmd9XG4iXX0=
