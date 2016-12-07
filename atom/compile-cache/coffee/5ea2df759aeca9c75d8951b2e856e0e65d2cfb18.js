(function() {
  var Model, nextInstanceId;

  nextInstanceId = 1;

  module.exports = Model = (function() {
    Model.resetNextInstanceId = function() {
      return nextInstanceId = 1;
    };

    Model.prototype.alive = true;

    function Model(params) {
      this.assignId(params != null ? params.id : void 0);
    }

    Model.prototype.assignId = function(id) {
      if (this.id == null) {
        this.id = id != null ? id : nextInstanceId++;
      }
      if (id >= nextInstanceId) {
        return nextInstanceId = id + 1;
      }
    };

    Model.prototype.destroy = function() {
      if (!this.isAlive()) {
        return;
      }
      this.alive = false;
      return typeof this.destroyed === "function" ? this.destroyed() : void 0;
    };

    Model.prototype.isAlive = function() {
      return this.alive;
    };

    Model.prototype.isDestroyed = function() {
      return !this.isAlive();
    };

    return Model;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tb2RlbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGNBQUEsR0FBaUI7O0VBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixLQUFDLENBQUEsbUJBQUQsR0FBc0IsU0FBQTthQUFHLGNBQUEsR0FBaUI7SUFBcEI7O29CQUV0QixLQUFBLEdBQU87O0lBRU0sZUFBQyxNQUFEO01BQ1gsSUFBQyxDQUFBLFFBQUQsa0JBQVUsTUFBTSxDQUFFLFdBQWxCO0lBRFc7O29CQUdiLFFBQUEsR0FBVSxTQUFDLEVBQUQ7O1FBQ1IsSUFBQyxDQUFBLGtCQUFNLEtBQUssY0FBQTs7TUFDWixJQUEyQixFQUFBLElBQU0sY0FBakM7ZUFBQSxjQUFBLEdBQWlCLEVBQUEsR0FBSyxFQUF0Qjs7SUFGUTs7b0JBSVYsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFBLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTO29EQUNULElBQUMsQ0FBQTtJQUhNOztvQkFLVCxPQUFBLEdBQVMsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOztvQkFFVCxXQUFBLEdBQWEsU0FBQTthQUFHLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUFQOzs7OztBQXRCZiIsInNvdXJjZXNDb250ZW50IjpbIm5leHRJbnN0YW5jZUlkID0gMVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBNb2RlbFxuICBAcmVzZXROZXh0SW5zdGFuY2VJZDogLT4gbmV4dEluc3RhbmNlSWQgPSAxXG5cbiAgYWxpdmU6IHRydWVcblxuICBjb25zdHJ1Y3RvcjogKHBhcmFtcykgLT5cbiAgICBAYXNzaWduSWQocGFyYW1zPy5pZClcblxuICBhc3NpZ25JZDogKGlkKSAtPlxuICAgIEBpZCA/PSBpZCA/IG5leHRJbnN0YW5jZUlkKytcbiAgICBuZXh0SW5zdGFuY2VJZCA9IGlkICsgMSBpZiBpZCA+PSBuZXh0SW5zdGFuY2VJZFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAaXNBbGl2ZSgpXG4gICAgQGFsaXZlID0gZmFsc2VcbiAgICBAZGVzdHJveWVkPygpXG5cbiAgaXNBbGl2ZTogLT4gQGFsaXZlXG5cbiAgaXNEZXN0cm95ZWQ6IC0+IG5vdCBAaXNBbGl2ZSgpXG4iXX0=
