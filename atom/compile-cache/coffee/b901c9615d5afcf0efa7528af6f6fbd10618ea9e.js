(function() {
  var ScopeDescriptor;

  module.exports = ScopeDescriptor = (function() {
    ScopeDescriptor.fromObject = function(scopes) {
      if (scopes instanceof ScopeDescriptor) {
        return scopes;
      } else {
        return new ScopeDescriptor({
          scopes: scopes
        });
      }
    };


    /*
    Section: Construction and Destruction
     */

    function ScopeDescriptor(arg) {
      this.scopes = arg.scopes;
    }

    ScopeDescriptor.prototype.getScopesArray = function() {
      return this.scopes;
    };

    ScopeDescriptor.prototype.getScopeChain = function() {
      return this.scopes.map(function(scope) {
        if (scope[0] !== '.') {
          scope = "." + scope;
        }
        return scope;
      }).join(' ');
    };

    ScopeDescriptor.prototype.toString = function() {
      return this.getScopeChain();
    };

    ScopeDescriptor.prototype.isEqual = function(other) {
      var i, j, len, ref, scope;
      if (this.scopes.length !== other.scopes.length) {
        return false;
      }
      ref = this.scopes;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        scope = ref[i];
        if (scope !== other.scopes[i]) {
          return false;
        }
      }
      return true;
    };

    return ScopeDescriptor;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9zY29wZS1kZXNjcmlwdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtQkE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixlQUFDLENBQUEsVUFBRCxHQUFhLFNBQUMsTUFBRDtNQUNYLElBQUcsTUFBQSxZQUFrQixlQUFyQjtlQUNFLE9BREY7T0FBQSxNQUFBO2VBR00sSUFBQSxlQUFBLENBQWdCO1VBQUMsUUFBQSxNQUFEO1NBQWhCLEVBSE47O0lBRFc7OztBQU1iOzs7O0lBUWEseUJBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxTQUFGLElBQUU7SUFBSDs7OEJBR2IsY0FBQSxHQUFnQixTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7OzhCQUVoQixhQUFBLEdBQWUsU0FBQTthQUNiLElBQUMsQ0FBQSxNQUNDLENBQUMsR0FESCxDQUNPLFNBQUMsS0FBRDtRQUNILElBQTJCLEtBQU0sQ0FBQSxDQUFBLENBQU4sS0FBWSxHQUF2QztVQUFBLEtBQUEsR0FBUSxHQUFBLEdBQUksTUFBWjs7ZUFDQTtNQUZHLENBRFAsQ0FJRSxDQUFDLElBSkgsQ0FJUSxHQUpSO0lBRGE7OzhCQU9mLFFBQUEsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQURROzs4QkFHVixPQUFBLEdBQVMsU0FBQyxLQUFEO0FBQ1AsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLEtBQW9CLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBcEM7QUFDRSxlQUFPLE1BRFQ7O0FBRUE7QUFBQSxXQUFBLDZDQUFBOztRQUNFLElBQUcsS0FBQSxLQUFXLEtBQUssQ0FBQyxNQUFPLENBQUEsQ0FBQSxDQUEzQjtBQUNFLGlCQUFPLE1BRFQ7O0FBREY7YUFHQTtJQU5POzs7OztBQS9CWCIsInNvdXJjZXNDb250ZW50IjpbIiMgRXh0ZW5kZWQ6IFdyYXBzIGFuIHtBcnJheX0gb2YgYFN0cmluZ2BzLiBUaGUgQXJyYXkgZGVzY3JpYmVzIGEgcGF0aCBmcm9tIHRoZVxuIyByb290IG9mIHRoZSBzeW50YXggdHJlZSB0byBhIHRva2VuIGluY2x1ZGluZyBfYWxsXyBzY29wZSBuYW1lcyBmb3IgdGhlIGVudGlyZVxuIyBwYXRoLlxuI1xuIyBNZXRob2RzIHRoYXQgdGFrZSBhIGBTY29wZURlc2NyaXB0b3JgIHdpbGwgYWxzbyBhY2NlcHQgYW4ge0FycmF5fSBvZiB7U3RyaW5nc31cbiMgc2NvcGUgbmFtZXMgZS5nLiBgWycuc291cmNlLmpzJ11gLlxuI1xuIyBZb3UgY2FuIHVzZSBgU2NvcGVEZXNjcmlwdG9yYHMgdG8gZ2V0IGxhbmd1YWdlLXNwZWNpZmljIGNvbmZpZyBzZXR0aW5ncyB2aWFcbiMge0NvbmZpZzo6Z2V0fS5cbiNcbiMgWW91IHNob3VsZCBub3QgbmVlZCB0byBjcmVhdGUgYSBgU2NvcGVEZXNjcmlwdG9yYCBkaXJlY3RseS5cbiNcbiMgKiB7RWRpdG9yOjpnZXRSb290U2NvcGVEZXNjcmlwdG9yfSB0byBnZXQgdGhlIGxhbmd1YWdlJ3MgZGVzY3JpcHRvci5cbiMgKiB7RWRpdG9yOjpzY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbn0gdG8gZ2V0IHRoZSBkZXNjcmlwdG9yIGF0IGFcbiMgICBzcGVjaWZpYyBwb3NpdGlvbiBpbiB0aGUgYnVmZmVyLlxuIyAqIHtDdXJzb3I6OmdldFNjb3BlRGVzY3JpcHRvcn0gdG8gZ2V0IGEgY3Vyc29yJ3MgZGVzY3JpcHRvciBiYXNlZCBvbiBwb3NpdGlvbi5cbiNcbiMgU2VlIHRoZSBbc2NvcGVzIGFuZCBzY29wZSBkZXNjcmlwdG9yIGd1aWRlXShodHRwOi8vZmxpZ2h0LW1hbnVhbC5hdG9tLmlvL2JlaGluZC1hdG9tL3NlY3Rpb25zL3Njb3BlZC1zZXR0aW5ncy1zY29wZXMtYW5kLXNjb3BlLWRlc2NyaXB0b3JzLylcbiMgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTY29wZURlc2NyaXB0b3JcbiAgQGZyb21PYmplY3Q6IChzY29wZXMpIC0+XG4gICAgaWYgc2NvcGVzIGluc3RhbmNlb2YgU2NvcGVEZXNjcmlwdG9yXG4gICAgICBzY29wZXNcbiAgICBlbHNlXG4gICAgICBuZXcgU2NvcGVEZXNjcmlwdG9yKHtzY29wZXN9KVxuXG4gICMjI1xuICBTZWN0aW9uOiBDb25zdHJ1Y3Rpb24gYW5kIERlc3RydWN0aW9uXG4gICMjI1xuXG4gICMgUHVibGljOiBDcmVhdGUgYSB7U2NvcGVEZXNjcmlwdG9yfSBvYmplY3QuXG4gICNcbiAgIyAqIGBvYmplY3RgIHtPYmplY3R9XG4gICMgICAqIGBzY29wZXNgIHtBcnJheX0gb2Yge1N0cmluZ31zXG4gIGNvbnN0cnVjdG9yOiAoe0BzY29wZXN9KSAtPlxuXG4gICMgUHVibGljOiBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge1N0cmluZ31zXG4gIGdldFNjb3Blc0FycmF5OiAtPiBAc2NvcGVzXG5cbiAgZ2V0U2NvcGVDaGFpbjogLT5cbiAgICBAc2NvcGVzXG4gICAgICAubWFwIChzY29wZSkgLT5cbiAgICAgICAgc2NvcGUgPSBcIi4je3Njb3BlfVwiIHVubGVzcyBzY29wZVswXSBpcyAnLidcbiAgICAgICAgc2NvcGVcbiAgICAgIC5qb2luKCcgJylcblxuICB0b1N0cmluZzogLT5cbiAgICBAZ2V0U2NvcGVDaGFpbigpXG5cbiAgaXNFcXVhbDogKG90aGVyKSAtPlxuICAgIGlmIEBzY29wZXMubGVuZ3RoIGlzbnQgb3RoZXIuc2NvcGVzLmxlbmd0aFxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgZm9yIHNjb3BlLCBpIGluIEBzY29wZXNcbiAgICAgIGlmIHNjb3BlIGlzbnQgb3RoZXIuc2NvcGVzW2ldXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIHRydWVcbiJdfQ==
