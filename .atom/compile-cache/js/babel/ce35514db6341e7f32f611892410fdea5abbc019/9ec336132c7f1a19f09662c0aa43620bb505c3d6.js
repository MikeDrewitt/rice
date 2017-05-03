Object.defineProperty(exports, '__esModule', {
  value: true
});
/** @babel */

var _eventKit = require('event-kit');

exports['default'] = {
  name: 'Null Grammar',
  scopeName: 'text.plain.null-grammar',
  scopeForId: function scopeForId(id) {
    if (id === -1 || id === -2) {
      return this.scopeName;
    } else {
      return null;
    }
  },
  startIdForScope: function startIdForScope(scopeName) {
    if (scopeName === this.scopeName) {
      return -1;
    } else {
      return null;
    }
  },
  endIdForScope: function endIdForScope(scopeName) {
    if (scopeName === this.scopeName) {
      return -2;
    } else {
      return null;
    }
  },
  tokenizeLine: function tokenizeLine(text) {
    return {
      tags: [this.startIdForScope(this.scopeName), text.length, this.endIdForScope(this.scopeName)],
      ruleStack: null
    };
  },
  onDidUpdate: function onDidUpdate(callback) {
    return new _eventKit.Disposable(noop);
  }
};

function noop() {}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvbnVsbC1ncmFtbWFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O3dCQUV5QixXQUFXOztxQkFFckI7QUFDYixNQUFJLEVBQUUsY0FBYztBQUNwQixXQUFTLEVBQUUseUJBQXlCO0FBQ3BDLFlBQVUsRUFBQyxvQkFBQyxFQUFFLEVBQUU7QUFDZCxRQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDMUIsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFBO0tBQ3RCLE1BQU07QUFDTCxhQUFPLElBQUksQ0FBQTtLQUNaO0dBQ0Y7QUFDRCxpQkFBZSxFQUFDLHlCQUFDLFNBQVMsRUFBRTtBQUMxQixRQUFJLFNBQVMsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2hDLGFBQU8sQ0FBQyxDQUFDLENBQUE7S0FDVixNQUFNO0FBQ0wsYUFBTyxJQUFJLENBQUE7S0FDWjtHQUNGO0FBQ0QsZUFBYSxFQUFDLHVCQUFDLFNBQVMsRUFBRTtBQUN4QixRQUFJLFNBQVMsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2hDLGFBQU8sQ0FBQyxDQUFDLENBQUE7S0FDVixNQUFNO0FBQ0wsYUFBTyxJQUFJLENBQUE7S0FDWjtHQUNGO0FBQ0QsY0FBWSxFQUFDLHNCQUFDLElBQUksRUFBRTtBQUNsQixXQUFPO0FBQ0wsVUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RixlQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFBO0dBQ0Y7QUFDRCxhQUFXLEVBQUMscUJBQUMsUUFBUSxFQUFFO0FBQ3JCLFdBQU8seUJBQWUsSUFBSSxDQUFDLENBQUE7R0FDNUI7Q0FDRjs7QUFFRCxTQUFTLElBQUksR0FBSSxFQUFFIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvbnVsbC1ncmFtbWFyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQge0Rpc3Bvc2FibGV9IGZyb20gJ2V2ZW50LWtpdCdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBuYW1lOiAnTnVsbCBHcmFtbWFyJyxcbiAgc2NvcGVOYW1lOiAndGV4dC5wbGFpbi5udWxsLWdyYW1tYXInLFxuICBzY29wZUZvcklkIChpZCkge1xuICAgIGlmIChpZCA9PT0gLTEgfHwgaWQgPT09IC0yKSB7XG4gICAgICByZXR1cm4gdGhpcy5zY29wZU5hbWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH0sXG4gIHN0YXJ0SWRGb3JTY29wZSAoc2NvcGVOYW1lKSB7XG4gICAgaWYgKHNjb3BlTmFtZSA9PT0gdGhpcy5zY29wZU5hbWUpIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfSxcbiAgZW5kSWRGb3JTY29wZSAoc2NvcGVOYW1lKSB7XG4gICAgaWYgKHNjb3BlTmFtZSA9PT0gdGhpcy5zY29wZU5hbWUpIHtcbiAgICAgIHJldHVybiAtMlxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfSxcbiAgdG9rZW5pemVMaW5lICh0ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhZ3M6IFt0aGlzLnN0YXJ0SWRGb3JTY29wZSh0aGlzLnNjb3BlTmFtZSksIHRleHQubGVuZ3RoLCB0aGlzLmVuZElkRm9yU2NvcGUodGhpcy5zY29wZU5hbWUpXSxcbiAgICAgIHJ1bGVTdGFjazogbnVsbFxuICAgIH1cbiAgfSxcbiAgb25EaWRVcGRhdGUgKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKG5vb3ApXG4gIH1cbn1cblxuZnVuY3Rpb24gbm9vcCAoKSB7fVxuIl19