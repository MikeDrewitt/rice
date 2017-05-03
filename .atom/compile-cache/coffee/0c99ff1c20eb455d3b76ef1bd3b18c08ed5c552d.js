(function() {
  var Emitter, GlobalState;

  Emitter = require('atom').Emitter;

  GlobalState = (function() {
    function GlobalState(state) {
      this.state = state;
      this.emitter = new Emitter;
      this.onDidChange((function(_this) {
        return function(arg) {
          var name, newValue;
          name = arg.name, newValue = arg.newValue;
          if (name === 'lastSearchPattern') {
            return _this.set('highlightSearchPattern', newValue);
          }
        };
      })(this));
    }

    GlobalState.prototype.get = function(name) {
      return this.state[name];
    };

    GlobalState.prototype.set = function(name, newValue) {
      var oldValue;
      oldValue = this.get(name);
      this.state[name] = newValue;
      return this.emitDidChange({
        name: name,
        oldValue: oldValue,
        newValue: newValue
      });
    };

    GlobalState.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    GlobalState.prototype.emitDidChange = function(event) {
      return this.emitter.emit('did-change', event);
    };

    return GlobalState;

  })();

  module.exports = new GlobalState({
    searchHistory: [],
    currentSearch: null,
    lastSearchPattern: null,
    highlightSearchPattern: null,
    currentFind: null,
    register: {}
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9nbG9iYWwtc3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVOO0lBQ1MscUJBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxRQUFEO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUVYLGNBQUE7VUFGYSxpQkFBTTtVQUVuQixJQUFHLElBQUEsS0FBUSxtQkFBWDttQkFDRSxLQUFDLENBQUEsR0FBRCxDQUFLLHdCQUFMLEVBQStCLFFBQS9CLEVBREY7O1FBRlc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWI7SUFIVzs7MEJBUWIsR0FBQSxHQUFLLFNBQUMsSUFBRDthQUNILElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQTtJQURKOzswQkFHTCxHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sUUFBUDtBQUNILFVBQUE7TUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMO01BQ1gsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQVAsR0FBZTthQUNmLElBQUMsQ0FBQSxhQUFELENBQWU7UUFBQyxNQUFBLElBQUQ7UUFBTyxVQUFBLFFBQVA7UUFBaUIsVUFBQSxRQUFqQjtPQUFmO0lBSEc7OzBCQUtMLFdBQUEsR0FBYSxTQUFDLEVBQUQ7YUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLEVBQTFCO0lBRFc7OzBCQUdiLGFBQUEsR0FBZSxTQUFDLEtBQUQ7YUFDYixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxZQUFkLEVBQTRCLEtBQTVCO0lBRGE7Ozs7OztFQUdqQixNQUFNLENBQUMsT0FBUCxHQUFxQixJQUFBLFdBQUEsQ0FDbkI7SUFBQSxhQUFBLEVBQWUsRUFBZjtJQUNBLGFBQUEsRUFBZSxJQURmO0lBRUEsaUJBQUEsRUFBbUIsSUFGbkI7SUFHQSxzQkFBQSxFQUF3QixJQUh4QjtJQUlBLFdBQUEsRUFBYSxJQUpiO0lBS0EsUUFBQSxFQUFVLEVBTFY7R0FEbUI7QUF6QnJCIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXJ9ID0gcmVxdWlyZSAnYXRvbSdcblxuY2xhc3MgR2xvYmFsU3RhdGVcbiAgY29uc3RydWN0b3I6IChAc3RhdGUpIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQG9uRGlkQ2hhbmdlICh7bmFtZSwgbmV3VmFsdWV9KSA9PlxuICAgICAgIyBhdXRvIHN5bmMgdmFsdWUsIGJ1dCBoaWdobGlnaHRTZWFyY2hQYXR0ZXJuIGlzIHNvbGVseSBjbGVhcmVkIHRvIGNsZWFyIGhsc2VhcmNoLlxuICAgICAgaWYgbmFtZSBpcyAnbGFzdFNlYXJjaFBhdHRlcm4nXG4gICAgICAgIEBzZXQoJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nLCBuZXdWYWx1ZSlcblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIEBzdGF0ZVtuYW1lXVxuXG4gIHNldDogKG5hbWUsIG5ld1ZhbHVlKSAtPlxuICAgIG9sZFZhbHVlID0gQGdldChuYW1lKVxuICAgIEBzdGF0ZVtuYW1lXSA9IG5ld1ZhbHVlXG4gICAgQGVtaXREaWRDaGFuZ2Uoe25hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZX0pXG5cbiAgb25EaWRDaGFuZ2U6IChmbikgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWNoYW5nZScsIGZuKVxuXG4gIGVtaXREaWRDaGFuZ2U6IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJywgZXZlbnQpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEdsb2JhbFN0YXRlXG4gIHNlYXJjaEhpc3Rvcnk6IFtdXG4gIGN1cnJlbnRTZWFyY2g6IG51bGxcbiAgbGFzdFNlYXJjaFBhdHRlcm46IG51bGxcbiAgaGlnaGxpZ2h0U2VhcmNoUGF0dGVybjogbnVsbFxuICBjdXJyZW50RmluZDogbnVsbFxuICByZWdpc3Rlcjoge31cbiJdfQ==
