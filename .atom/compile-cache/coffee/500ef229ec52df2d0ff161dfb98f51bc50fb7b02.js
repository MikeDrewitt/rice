(function() {
  var CompositeDisposable, MARKS, MarkManager, Point, Range, ref,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point, CompositeDisposable = ref.CompositeDisposable;

  MARKS = /(?:[a-z]|[\[\]`'.^(){}<>])/;

  MarkManager = (function() {
    MarkManager.prototype.marks = null;

    function MarkManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
      this.marks = {};
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
    }

    MarkManager.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    MarkManager.prototype.isValid = function(name) {
      return MARKS.test(name);
    };

    MarkManager.prototype.get = function(name) {
      var point, ref1;
      if (!this.isValid(name)) {
        return;
      }
      point = (ref1 = this.marks[name]) != null ? ref1.getStartBufferPosition() : void 0;
      if (indexOf.call("`'", name) >= 0) {
        return point != null ? point : Point.ZERO;
      } else {
        return point;
      }
    };

    MarkManager.prototype.getRange = function(startMark, endMark) {
      var end, start;
      start = this.get(startMark);
      end = this.get(endMark);
      if ((start != null) && (end != null)) {
        return new Range(start, end);
      }
    };

    MarkManager.prototype.setRange = function(startMark, endMark, range) {
      var end, ref1, start;
      ref1 = Range.fromObject(range), start = ref1.start, end = ref1.end;
      this.set(startMark, start);
      return this.set(endMark, end);
    };

    MarkManager.prototype.set = function(name, point) {
      var bufferPosition, event;
      if (!this.isValid(name)) {
        return;
      }
      bufferPosition = this.editor.clipBufferPosition(point);
      this.marks[name] = this.editor.markBufferPosition(bufferPosition);
      event = {
        name: name,
        bufferPosition: bufferPosition,
        editor: this.editor
      };
      return this.vimState.emitter.emit('did-set-mark', event);
    };

    return MarkManager;

  })();

  module.exports = MarkManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tYXJrLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwwREFBQTtJQUFBOztFQUFBLE1BQXNDLE9BQUEsQ0FBUSxNQUFSLENBQXRDLEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlOztFQUVmLEtBQUEsR0FBUTs7RUFLRjswQkFDSixLQUFBLEdBQU87O0lBRU0scUJBQUMsUUFBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsV0FBRDtNQUNaLE9BQTRCLElBQUMsQ0FBQSxRQUE3QixFQUFDLElBQUMsQ0FBQSxjQUFBLE1BQUYsRUFBVSxJQUFDLENBQUEscUJBQUE7TUFDWCxJQUFDLENBQUEsS0FBRCxHQUFTO01BRVQsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkIsQ0FBbkI7SUFMVzs7MEJBT2IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQURPOzswQkFHVCxPQUFBLEdBQVMsU0FBQyxJQUFEO2FBQ1AsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYO0lBRE87OzBCQUdULEdBQUEsR0FBSyxTQUFDLElBQUQ7QUFDSCxVQUFBO01BQUEsSUFBQSxDQUFjLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxDQUFkO0FBQUEsZUFBQTs7TUFDQSxLQUFBLDJDQUFvQixDQUFFLHNCQUFkLENBQUE7TUFDUixJQUFHLGFBQVEsSUFBUixFQUFBLElBQUEsTUFBSDsrQkFDRSxRQUFRLEtBQUssQ0FBQyxLQURoQjtPQUFBLE1BQUE7ZUFHRSxNQUhGOztJQUhHOzswQkFTTCxRQUFBLEdBQVUsU0FBQyxTQUFELEVBQVksT0FBWjtBQUNSLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLEdBQUQsQ0FBSyxTQUFMO01BQ1IsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFELENBQUssT0FBTDtNQUNOLElBQUcsZUFBQSxJQUFXLGFBQWQ7ZUFDTSxJQUFBLEtBQUEsQ0FBTSxLQUFOLEVBQWEsR0FBYixFQUROOztJQUhROzswQkFNVixRQUFBLEdBQVUsU0FBQyxTQUFELEVBQVksT0FBWixFQUFxQixLQUFyQjtBQUNSLFVBQUE7TUFBQSxPQUFlLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQWpCLENBQWYsRUFBQyxrQkFBRCxFQUFRO01BQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSyxTQUFMLEVBQWdCLEtBQWhCO2FBQ0EsSUFBQyxDQUFBLEdBQUQsQ0FBSyxPQUFMLEVBQWMsR0FBZDtJQUhROzswQkFNVixHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sS0FBUDtBQUNILFVBQUE7TUFBQSxJQUFBLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULENBQWQ7QUFBQSxlQUFBOztNQUNBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixLQUEzQjtNQUNqQixJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBMkIsY0FBM0I7TUFDZixLQUFBLEdBQVE7UUFBQyxNQUFBLElBQUQ7UUFBTyxnQkFBQSxjQUFQO1FBQXdCLFFBQUQsSUFBQyxDQUFBLE1BQXhCOzthQUNSLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQWxCLENBQXVCLGNBQXZCLEVBQXVDLEtBQXZDO0lBTEc7Ozs7OztFQU9QLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBbkRqQiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZSwgUG9pbnQsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuTUFSS1MgPSAvLy8gKFxuICA/OiBbYS16XVxuICAgfCBbXFxbXFxdYCcuXigpe308Pl1cbikgLy8vXG5cbmNsYXNzIE1hcmtNYW5hZ2VyXG4gIG1hcmtzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEBtYXJrcyA9IHt9XG5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEB2aW1TdGF0ZS5vbkRpZERlc3Ryb3koQGRlc3Ryb3kuYmluZCh0aGlzKSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIGlzVmFsaWQ6IChuYW1lKSAtPlxuICAgIE1BUktTLnRlc3QobmFtZSlcblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzVmFsaWQobmFtZSlcbiAgICBwb2ludCA9IEBtYXJrc1tuYW1lXT8uZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgbmFtZSBpbiBcImAnXCJcbiAgICAgIHBvaW50ID8gUG9pbnQuWkVST1xuICAgIGVsc2VcbiAgICAgIHBvaW50XG5cbiAgIyBSZXR1cm4gcmFuZ2UgYmV0d2VlbiBtYXJrc1xuICBnZXRSYW5nZTogKHN0YXJ0TWFyaywgZW5kTWFyaykgLT5cbiAgICBzdGFydCA9IEBnZXQoc3RhcnRNYXJrKVxuICAgIGVuZCA9IEBnZXQoZW5kTWFyaylcbiAgICBpZiBzdGFydD8gYW5kIGVuZD9cbiAgICAgIG5ldyBSYW5nZShzdGFydCwgZW5kKVxuXG4gIHNldFJhbmdlOiAoc3RhcnRNYXJrLCBlbmRNYXJrLCByYW5nZSkgLT5cbiAgICB7c3RhcnQsIGVuZH0gPSBSYW5nZS5mcm9tT2JqZWN0KHJhbmdlKVxuICAgIEBzZXQoc3RhcnRNYXJrLCBzdGFydClcbiAgICBAc2V0KGVuZE1hcmssIGVuZClcblxuICAjIFtGSVhNRV0gTmVlZCB0byBzdXBwb3J0IEdsb2JhbCBtYXJrIHdpdGggY2FwaXRhbCBuYW1lIFtBLVpdXG4gIHNldDogKG5hbWUsIHBvaW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzVmFsaWQobmFtZSlcbiAgICBidWZmZXJQb3NpdGlvbiA9IEBlZGl0b3IuY2xpcEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgIEBtYXJrc1tuYW1lXSA9IEBlZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKVxuICAgIGV2ZW50ID0ge25hbWUsIGJ1ZmZlclBvc2l0aW9uLCBAZWRpdG9yfVxuICAgIEB2aW1TdGF0ZS5lbWl0dGVyLmVtaXQoJ2RpZC1zZXQtbWFyaycsIGV2ZW50KVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtNYW5hZ2VyXG4iXX0=
