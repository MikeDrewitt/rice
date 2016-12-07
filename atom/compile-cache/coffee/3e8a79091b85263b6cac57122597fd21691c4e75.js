(function() {
  var DOMElementPool;

  module.exports = DOMElementPool = (function() {
    function DOMElementPool() {
      this.freeElementsByTagName = {};
      this.freedElements = new Set;
    }

    DOMElementPool.prototype.clear = function() {
      var freeElements, ref, tagName;
      this.freedElements.clear();
      ref = this.freeElementsByTagName;
      for (tagName in ref) {
        freeElements = ref[tagName];
        freeElements.length = 0;
      }
    };

    DOMElementPool.prototype.build = function(tagName, factory, reset) {
      var element, ref;
      element = (ref = this.freeElementsByTagName[tagName]) != null ? ref.pop() : void 0;
      if (element == null) {
        element = factory();
      }
      reset(element);
      this.freedElements["delete"](element);
      return element;
    };

    DOMElementPool.prototype.buildElement = function(tagName, className) {
      var factory, reset;
      factory = function() {
        return document.createElement(tagName);
      };
      reset = function(element) {
        var dataId;
        for (dataId in element.dataset) {
          delete element.dataset[dataId];
        }
        element.removeAttribute("style");
        if (className != null) {
          return element.className = className;
        } else {
          return element.removeAttribute("class");
        }
      };
      return this.build(tagName, factory, reset);
    };

    DOMElementPool.prototype.buildText = function(textContent) {
      var factory, reset;
      factory = function() {
        return document.createTextNode(textContent);
      };
      reset = function(element) {
        return element.textContent = textContent;
      };
      return this.build("#text", factory, reset);
    };

    DOMElementPool.prototype.freeElementAndDescendants = function(element) {
      this.free(element);
      return this.freeDescendants(element);
    };

    DOMElementPool.prototype.freeDescendants = function(element) {
      var descendant, i, ref;
      ref = element.childNodes;
      for (i = ref.length - 1; i >= 0; i += -1) {
        descendant = ref[i];
        this.free(descendant);
        this.freeDescendants(descendant);
      }
    };

    DOMElementPool.prototype.free = function(element) {
      var base, tagName;
      if (element == null) {
        throw new Error("The element cannot be null or undefined.");
      }
      if (this.freedElements.has(element)) {
        throw new Error("The element has already been freed!");
      }
      tagName = element.nodeName.toLowerCase();
      if ((base = this.freeElementsByTagName)[tagName] == null) {
        base[tagName] = [];
      }
      this.freeElementsByTagName[tagName].push(element);
      this.freedElements.add(element);
      return element.remove();
    };

    return DOMElementPool;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9kb20tZWxlbWVudC1wb29sLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHdCQUFBO01BQ1gsSUFBQyxDQUFBLHFCQUFELEdBQXlCO01BQ3pCLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7SUFGVjs7NkJBSWIsS0FBQSxHQUFPLFNBQUE7QUFDTCxVQUFBO01BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxLQUFmLENBQUE7QUFDQTtBQUFBLFdBQUEsY0FBQTs7UUFDRSxZQUFZLENBQUMsTUFBYixHQUFzQjtBQUR4QjtJQUZLOzs2QkFNUCxLQUFBLEdBQU8sU0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixLQUFuQjtBQUNMLFVBQUE7TUFBQSxPQUFBLDREQUF5QyxDQUFFLEdBQWpDLENBQUE7O1FBQ1YsVUFBVyxPQUFBLENBQUE7O01BQ1gsS0FBQSxDQUFNLE9BQU47TUFDQSxJQUFDLENBQUEsYUFBYSxFQUFDLE1BQUQsRUFBZCxDQUFzQixPQUF0QjthQUNBO0lBTEs7OzZCQU9QLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxTQUFWO0FBQ1osVUFBQTtNQUFBLE9BQUEsR0FBVSxTQUFBO2VBQUcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsT0FBdkI7TUFBSDtNQUNWLEtBQUEsR0FBUSxTQUFDLE9BQUQ7QUFDTixZQUFBO0FBQUEsYUFBQSx5QkFBQTtVQUFBLE9BQU8sT0FBTyxDQUFDLE9BQVEsQ0FBQSxNQUFBO0FBQXZCO1FBQ0EsT0FBTyxDQUFDLGVBQVIsQ0FBd0IsT0FBeEI7UUFDQSxJQUFHLGlCQUFIO2lCQUNFLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLFVBRHRCO1NBQUEsTUFBQTtpQkFHRSxPQUFPLENBQUMsZUFBUixDQUF3QixPQUF4QixFQUhGOztNQUhNO2FBT1IsSUFBQyxDQUFBLEtBQUQsQ0FBTyxPQUFQLEVBQWdCLE9BQWhCLEVBQXlCLEtBQXpCO0lBVFk7OzZCQVdkLFNBQUEsR0FBVyxTQUFDLFdBQUQ7QUFDVCxVQUFBO01BQUEsT0FBQSxHQUFVLFNBQUE7ZUFBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixXQUF4QjtNQUFIO01BQ1YsS0FBQSxHQUFRLFNBQUMsT0FBRDtlQUFhLE9BQU8sQ0FBQyxXQUFSLEdBQXNCO01BQW5DO2FBQ1IsSUFBQyxDQUFBLEtBQUQsQ0FBTyxPQUFQLEVBQWdCLE9BQWhCLEVBQXlCLEtBQXpCO0lBSFM7OzZCQUtYLHlCQUFBLEdBQTJCLFNBQUMsT0FBRDtNQUN6QixJQUFDLENBQUEsSUFBRCxDQUFNLE9BQU47YUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixPQUFqQjtJQUZ5Qjs7NkJBSTNCLGVBQUEsR0FBaUIsU0FBQyxPQUFEO0FBQ2YsVUFBQTtBQUFBO0FBQUEsV0FBQSxtQ0FBQTs7UUFDRSxJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU47UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixVQUFqQjtBQUZGO0lBRGU7OzZCQU1qQixJQUFBLEdBQU0sU0FBQyxPQUFEO0FBQ0osVUFBQTtNQUFBLElBQW1FLGVBQW5FO0FBQUEsY0FBVSxJQUFBLEtBQUEsQ0FBTSwwQ0FBTixFQUFWOztNQUNBLElBQTBELElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixPQUFuQixDQUExRDtBQUFBLGNBQVUsSUFBQSxLQUFBLENBQU0scUNBQU4sRUFBVjs7TUFFQSxPQUFBLEdBQVUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFqQixDQUFBOztZQUNhLENBQUEsT0FBQSxJQUFZOztNQUNuQyxJQUFDLENBQUEscUJBQXNCLENBQUEsT0FBQSxDQUFRLENBQUMsSUFBaEMsQ0FBcUMsT0FBckM7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsT0FBbkI7YUFFQSxPQUFPLENBQUMsTUFBUixDQUFBO0lBVEk7Ozs7O0FBN0NSIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRE9NRWxlbWVudFBvb2xcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGZyZWVFbGVtZW50c0J5VGFnTmFtZSA9IHt9XG4gICAgQGZyZWVkRWxlbWVudHMgPSBuZXcgU2V0XG5cbiAgY2xlYXI6IC0+XG4gICAgQGZyZWVkRWxlbWVudHMuY2xlYXIoKVxuICAgIGZvciB0YWdOYW1lLCBmcmVlRWxlbWVudHMgb2YgQGZyZWVFbGVtZW50c0J5VGFnTmFtZVxuICAgICAgZnJlZUVsZW1lbnRzLmxlbmd0aCA9IDBcbiAgICByZXR1cm5cblxuICBidWlsZDogKHRhZ05hbWUsIGZhY3RvcnksIHJlc2V0KSAtPlxuICAgIGVsZW1lbnQgPSBAZnJlZUVsZW1lbnRzQnlUYWdOYW1lW3RhZ05hbWVdPy5wb3AoKVxuICAgIGVsZW1lbnQgPz0gZmFjdG9yeSgpXG4gICAgcmVzZXQoZWxlbWVudClcbiAgICBAZnJlZWRFbGVtZW50cy5kZWxldGUoZWxlbWVudClcbiAgICBlbGVtZW50XG5cbiAgYnVpbGRFbGVtZW50OiAodGFnTmFtZSwgY2xhc3NOYW1lKSAtPlxuICAgIGZhY3RvcnkgPSAtPiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpXG4gICAgcmVzZXQgPSAoZWxlbWVudCkgLT5cbiAgICAgIGRlbGV0ZSBlbGVtZW50LmRhdGFzZXRbZGF0YUlkXSBmb3IgZGF0YUlkIG9mIGVsZW1lbnQuZGF0YXNldFxuICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJzdHlsZVwiKVxuICAgICAgaWYgY2xhc3NOYW1lP1xuICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZVxuICAgICAgZWxzZVxuICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImNsYXNzXCIpXG4gICAgQGJ1aWxkKHRhZ05hbWUsIGZhY3RvcnksIHJlc2V0KVxuXG4gIGJ1aWxkVGV4dDogKHRleHRDb250ZW50KSAtPlxuICAgIGZhY3RvcnkgPSAtPiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0Q29udGVudClcbiAgICByZXNldCA9IChlbGVtZW50KSAtPiBlbGVtZW50LnRleHRDb250ZW50ID0gdGV4dENvbnRlbnRcbiAgICBAYnVpbGQoXCIjdGV4dFwiLCBmYWN0b3J5LCByZXNldClcblxuICBmcmVlRWxlbWVudEFuZERlc2NlbmRhbnRzOiAoZWxlbWVudCkgLT5cbiAgICBAZnJlZShlbGVtZW50KVxuICAgIEBmcmVlRGVzY2VuZGFudHMoZWxlbWVudClcblxuICBmcmVlRGVzY2VuZGFudHM6IChlbGVtZW50KSAtPlxuICAgIGZvciBkZXNjZW5kYW50IGluIGVsZW1lbnQuY2hpbGROb2RlcyBieSAtMVxuICAgICAgQGZyZWUoZGVzY2VuZGFudClcbiAgICAgIEBmcmVlRGVzY2VuZGFudHMoZGVzY2VuZGFudClcbiAgICByZXR1cm5cblxuICBmcmVlOiAoZWxlbWVudCkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZWxlbWVudCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuXCIpIHVubGVzcyBlbGVtZW50P1xuICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBlbGVtZW50IGhhcyBhbHJlYWR5IGJlZW4gZnJlZWQhXCIpIGlmIEBmcmVlZEVsZW1lbnRzLmhhcyhlbGVtZW50KVxuXG4gICAgdGFnTmFtZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuICAgIEBmcmVlRWxlbWVudHNCeVRhZ05hbWVbdGFnTmFtZV0gPz0gW11cbiAgICBAZnJlZUVsZW1lbnRzQnlUYWdOYW1lW3RhZ05hbWVdLnB1c2goZWxlbWVudClcbiAgICBAZnJlZWRFbGVtZW50cy5hZGQoZWxlbWVudClcblxuICAgIGVsZW1lbnQucmVtb3ZlKClcbiJdfQ==
