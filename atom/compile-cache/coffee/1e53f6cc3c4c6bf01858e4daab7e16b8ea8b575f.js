(function() {
  var StartDotRegex, Token, _;

  _ = require('underscore-plus');

  StartDotRegex = /^\.?/;

  module.exports = Token = (function() {
    Token.prototype.value = null;

    Token.prototype.scopes = null;

    function Token(properties) {
      this.value = properties.value, this.scopes = properties.scopes;
    }

    Token.prototype.isEqual = function(other) {
      return this.value === other.value && _.isEqual(this.scopes, other.scopes);
    };

    Token.prototype.isBracket = function() {
      return /^meta\.brace\b/.test(_.last(this.scopes));
    };

    Token.prototype.matchesScopeSelector = function(selector) {
      var targetClasses;
      targetClasses = selector.replace(StartDotRegex, '').split('.');
      return _.any(this.scopes, function(scope) {
        var scopeClasses;
        scopeClasses = scope.split('.');
        return _.isSubset(targetClasses, scopeClasses);
      });
    };

    return Token;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90b2tlbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosYUFBQSxHQUFnQjs7RUFHaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtvQkFDSixLQUFBLEdBQU87O29CQUNQLE1BQUEsR0FBUTs7SUFFSyxlQUFDLFVBQUQ7TUFDVixJQUFDLENBQUEsbUJBQUEsS0FBRixFQUFTLElBQUMsQ0FBQSxvQkFBQTtJQURDOztvQkFHYixPQUFBLEdBQVMsU0FBQyxLQUFEO2FBRVAsSUFBQyxDQUFBLEtBQUQsS0FBVSxLQUFLLENBQUMsS0FBaEIsSUFBMEIsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFDLENBQUEsTUFBWCxFQUFtQixLQUFLLENBQUMsTUFBekI7SUFGbkI7O29CQUlULFNBQUEsR0FBVyxTQUFBO2FBQ1QsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsTUFBUixDQUF0QjtJQURTOztvQkFHWCxvQkFBQSxHQUFzQixTQUFDLFFBQUQ7QUFDcEIsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsYUFBakIsRUFBZ0MsRUFBaEMsQ0FBbUMsQ0FBQyxLQUFwQyxDQUEwQyxHQUExQzthQUNoQixDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsU0FBQyxLQUFEO0FBQ2IsWUFBQTtRQUFBLFlBQUEsR0FBZSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVo7ZUFDZixDQUFDLENBQUMsUUFBRixDQUFXLGFBQVgsRUFBMEIsWUFBMUI7TUFGYSxDQUFmO0lBRm9COzs7OztBQXBCeEIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5TdGFydERvdFJlZ2V4ID0gL15cXC4/L1xuXG4jIFJlcHJlc2VudHMgYSBzaW5nbGUgdW5pdCBvZiB0ZXh0IGFzIHNlbGVjdGVkIGJ5IGEgZ3JhbW1hci5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRva2VuXG4gIHZhbHVlOiBudWxsXG4gIHNjb3BlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAocHJvcGVydGllcykgLT5cbiAgICB7QHZhbHVlLCBAc2NvcGVzfSA9IHByb3BlcnRpZXNcblxuICBpc0VxdWFsOiAob3RoZXIpIC0+XG4gICAgIyBUT0RPOiBzY29wZXMgaXMgZGVwcmVjYXRlZC4gVGhpcyBpcyBoZXJlIGZvciB0aGUgc2FrZSBvZiBsYW5nIHBhY2thZ2UgdGVzdHNcbiAgICBAdmFsdWUgaXMgb3RoZXIudmFsdWUgYW5kIF8uaXNFcXVhbChAc2NvcGVzLCBvdGhlci5zY29wZXMpXG5cbiAgaXNCcmFja2V0OiAtPlxuICAgIC9ebWV0YVxcLmJyYWNlXFxiLy50ZXN0KF8ubGFzdChAc2NvcGVzKSlcblxuICBtYXRjaGVzU2NvcGVTZWxlY3RvcjogKHNlbGVjdG9yKSAtPlxuICAgIHRhcmdldENsYXNzZXMgPSBzZWxlY3Rvci5yZXBsYWNlKFN0YXJ0RG90UmVnZXgsICcnKS5zcGxpdCgnLicpXG4gICAgXy5hbnkgQHNjb3BlcywgKHNjb3BlKSAtPlxuICAgICAgc2NvcGVDbGFzc2VzID0gc2NvcGUuc3BsaXQoJy4nKVxuICAgICAgXy5pc1N1YnNldCh0YXJnZXRDbGFzc2VzLCBzY29wZUNsYXNzZXMpXG4iXX0=
