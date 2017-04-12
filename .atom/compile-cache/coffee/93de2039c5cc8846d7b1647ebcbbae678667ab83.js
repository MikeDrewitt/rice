(function() {
  module.exports = {
    unescapeEscapeSequence: function(string) {
      return string.replace(/\\(.)/gm, function(match, char) {
        if (char === 't') {
          return '\t';
        } else if (char === 'n') {
          return '\n';
        } else if (char === 'r') {
          return '\r';
        } else if (char === '\\') {
          return '\\';
        } else {
          return match;
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9lc2NhcGUtaGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxzQkFBQSxFQUF3QixTQUFDLE1BQUQ7YUFDdEIsTUFBTSxDQUFDLE9BQVAsQ0FBZSxTQUFmLEVBQTBCLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDeEIsSUFBRyxJQUFBLEtBQVEsR0FBWDtpQkFDRSxLQURGO1NBQUEsTUFFSyxJQUFHLElBQUEsS0FBUSxHQUFYO2lCQUNILEtBREc7U0FBQSxNQUVBLElBQUcsSUFBQSxLQUFRLEdBQVg7aUJBQ0gsS0FERztTQUFBLE1BRUEsSUFBRyxJQUFBLEtBQVEsSUFBWDtpQkFDSCxLQURHO1NBQUEsTUFBQTtpQkFHSCxNQUhHOztNQVBtQixDQUExQjtJQURzQixDQUF4Qjs7QUFERiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbiAgdW5lc2NhcGVFc2NhcGVTZXF1ZW5jZTogKHN0cmluZykgLT5cbiAgICBzdHJpbmcucmVwbGFjZSAvXFxcXCguKS9nbSwgKG1hdGNoLCBjaGFyKSAtPlxuICAgICAgaWYgY2hhciBpcyAndCdcbiAgICAgICAgJ1xcdCdcbiAgICAgIGVsc2UgaWYgY2hhciBpcyAnbidcbiAgICAgICAgJ1xcbidcbiAgICAgIGVsc2UgaWYgY2hhciBpcyAncidcbiAgICAgICAgJ1xccidcbiAgICAgIGVsc2UgaWYgY2hhciBpcyAnXFxcXCdcbiAgICAgICAgJ1xcXFwnXG4gICAgICBlbHNlXG4gICAgICAgIG1hdGNoXG4iXX0=
