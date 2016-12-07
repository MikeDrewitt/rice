(function() {
  var CustomEventMixin;

  module.exports = CustomEventMixin = {
    componentWillMount: function() {
      return this.customEventListeners = {};
    },
    componentWillUnmount: function() {
      var i, j, len, len1, listener, listeners, name, ref;
      ref = this.customEventListeners;
      for (listeners = i = 0, len = ref.length; i < len; listeners = ++i) {
        name = ref[listeners];
        for (j = 0, len1 = listeners.length; j < len1; j++) {
          listener = listeners[j];
          this.getDOMNode().removeEventListener(name, listener);
        }
      }
    },
    addCustomEventListeners: function(customEventListeners) {
      var base, listener, name;
      for (name in customEventListeners) {
        listener = customEventListeners[name];
        if ((base = this.customEventListeners)[name] == null) {
          base[name] = [];
        }
        this.customEventListeners[name].push(listener);
        this.getDOMNode().addEventListener(name, listener);
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jdXN0b20tZXZlbnQtbWl4aW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNBLGdCQUFBLEdBQ0U7SUFBQSxrQkFBQSxFQUFvQixTQUFBO2FBQ2xCLElBQUMsQ0FBQSxvQkFBRCxHQUF3QjtJQUROLENBQXBCO0lBR0Esb0JBQUEsRUFBc0IsU0FBQTtBQUNwQixVQUFBO0FBQUE7QUFBQSxXQUFBLDZEQUFBOztBQUNFLGFBQUEsNkNBQUE7O1VBQ0UsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUMsbUJBQWQsQ0FBa0MsSUFBbEMsRUFBd0MsUUFBeEM7QUFERjtBQURGO0lBRG9CLENBSHRCO0lBU0EsdUJBQUEsRUFBeUIsU0FBQyxvQkFBRDtBQUN2QixVQUFBO0FBQUEsV0FBQSw0QkFBQTs7O2NBQ3dCLENBQUEsSUFBQSxJQUFTOztRQUMvQixJQUFDLENBQUEsb0JBQXFCLENBQUEsSUFBQSxDQUFLLENBQUMsSUFBNUIsQ0FBaUMsUUFBakM7UUFDQSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQyxnQkFBZCxDQUErQixJQUEvQixFQUFxQyxRQUFyQztBQUhGO0lBRHVCLENBVHpCOztBQUZGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuQ3VzdG9tRXZlbnRNaXhpbiA9XG4gIGNvbXBvbmVudFdpbGxNb3VudDogLT5cbiAgICBAY3VzdG9tRXZlbnRMaXN0ZW5lcnMgPSB7fVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiAtPlxuICAgIGZvciBuYW1lLCBsaXN0ZW5lcnMgaW4gQGN1c3RvbUV2ZW50TGlzdGVuZXJzXG4gICAgICBmb3IgbGlzdGVuZXIgaW4gbGlzdGVuZXJzXG4gICAgICAgIEBnZXRET01Ob2RlKCkucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcilcbiAgICByZXR1cm5cblxuICBhZGRDdXN0b21FdmVudExpc3RlbmVyczogKGN1c3RvbUV2ZW50TGlzdGVuZXJzKSAtPlxuICAgIGZvciBuYW1lLCBsaXN0ZW5lciBvZiBjdXN0b21FdmVudExpc3RlbmVyc1xuICAgICAgQGN1c3RvbUV2ZW50TGlzdGVuZXJzW25hbWVdID89IFtdXG4gICAgICBAY3VzdG9tRXZlbnRMaXN0ZW5lcnNbbmFtZV0ucHVzaChsaXN0ZW5lcilcbiAgICAgIEBnZXRET01Ob2RlKCkuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lcilcbiAgICByZXR1cm5cbiJdfQ==
