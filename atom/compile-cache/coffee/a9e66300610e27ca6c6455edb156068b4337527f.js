(function() {
  var _, linkAtPosition, linkForName, linkUnderCursor, openLink, selector, shell, url;

  url = require('url');

  shell = require('electron').shell;

  _ = require('underscore-plus');

  selector = null;

  module.exports = {
    activate: function() {
      return atom.commands.add('atom-workspace', 'link:open', openLink);
    }
  };

  openLink = function() {
    var editor, link, protocol;
    editor = atom.workspace.getActiveTextEditor();
    if (editor == null) {
      return;
    }
    link = linkUnderCursor(editor);
    if (link == null) {
      return;
    }
    if (editor.getGrammar().scopeName === 'source.gfm') {
      link = linkForName(editor.getBuffer(), link);
    }
    protocol = url.parse(link).protocol;
    if (protocol === 'http:' || protocol === 'https:') {
      return shell.openExternal(link);
    }
  };

  linkUnderCursor = function(editor) {
    var cursorPosition, link;
    cursorPosition = editor.getCursorBufferPosition();
    link = linkAtPosition(editor, cursorPosition);
    if (link != null) {
      return link;
    }
    if (cursorPosition.column > 0) {
      return linkAtPosition(editor, cursorPosition.translate([0, -1]));
    }
  };

  linkAtPosition = function(editor, bufferPosition) {
    var ScopeSelector, token;
    if (selector == null) {
      ScopeSelector = require('first-mate').ScopeSelector;
      selector = new ScopeSelector('markup.underline.link');
    }
    if (token = editor.tokenForBufferPosition(bufferPosition)) {
      if (token.value && selector.matches(token.scopes)) {
        return token.value;
      }
    }
  };

  linkForName = function(buffer, linkName) {
    var link, regex;
    link = linkName;
    regex = new RegExp("^\\s*\\[" + (_.escapeRegExp(linkName)) + "\\]\\s*:\\s*(.+)$", 'g');
    buffer.backwardsScanInRange(regex, buffer.getRange(), function(arg) {
      var match, stop;
      match = arg.match, stop = arg.stop;
      link = match[1];
      return stop();
    });
    return link;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9saW5rL2xpYi9saW5rLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxLQUFSOztFQUNMLFFBQVMsT0FBQSxDQUFRLFVBQVI7O0VBQ1YsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixRQUFBLEdBQVc7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxXQUFwQyxFQUFpRCxRQUFqRDtJQURRLENBQVY7OztFQUdGLFFBQUEsR0FBVyxTQUFBO0FBQ1QsUUFBQTtJQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7SUFDVCxJQUFjLGNBQWQ7QUFBQSxhQUFBOztJQUVBLElBQUEsR0FBTyxlQUFBLENBQWdCLE1BQWhCO0lBQ1AsSUFBYyxZQUFkO0FBQUEsYUFBQTs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBbUIsQ0FBQyxTQUFwQixLQUFpQyxZQUFwQztNQUNFLElBQUEsR0FBTyxXQUFBLENBQVksTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUFaLEVBQWdDLElBQWhDLEVBRFQ7O0lBR0MsV0FBWSxHQUFHLENBQUMsS0FBSixDQUFVLElBQVY7SUFDYixJQUFHLFFBQUEsS0FBWSxPQUFaLElBQXVCLFFBQUEsS0FBWSxRQUF0QzthQUNFLEtBQUssQ0FBQyxZQUFOLENBQW1CLElBQW5CLEVBREY7O0VBWFM7O0VBaUJYLGVBQUEsR0FBa0IsU0FBQyxNQUFEO0FBQ2hCLFFBQUE7SUFBQSxjQUFBLEdBQWlCLE1BQU0sQ0FBQyx1QkFBUCxDQUFBO0lBQ2pCLElBQUEsR0FBTyxjQUFBLENBQWUsTUFBZixFQUF1QixjQUF2QjtJQUNQLElBQWUsWUFBZjtBQUFBLGFBQU8sS0FBUDs7SUFHQSxJQUFHLGNBQWMsQ0FBQyxNQUFmLEdBQXdCLENBQTNCO2FBQ0UsY0FBQSxDQUFlLE1BQWYsRUFBdUIsY0FBYyxDQUFDLFNBQWYsQ0FBeUIsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQXpCLENBQXZCLEVBREY7O0VBTmdCOztFQVlsQixjQUFBLEdBQWlCLFNBQUMsTUFBRCxFQUFTLGNBQVQ7QUFDZixRQUFBO0lBQUEsSUFBTyxnQkFBUDtNQUNHLGdCQUFpQixPQUFBLENBQVEsWUFBUjtNQUNsQixRQUFBLEdBQWUsSUFBQSxhQUFBLENBQWMsdUJBQWQsRUFGakI7O0lBSUEsSUFBRyxLQUFBLEdBQVEsTUFBTSxDQUFDLHNCQUFQLENBQThCLGNBQTlCLENBQVg7TUFDRSxJQUFlLEtBQUssQ0FBQyxLQUFOLElBQWdCLFFBQVEsQ0FBQyxPQUFULENBQWlCLEtBQUssQ0FBQyxNQUF2QixDQUEvQjtlQUFBLEtBQUssQ0FBQyxNQUFOO09BREY7O0VBTGU7O0VBbUJqQixXQUFBLEdBQWMsU0FBQyxNQUFELEVBQVMsUUFBVDtBQUNaLFFBQUE7SUFBQSxJQUFBLEdBQU87SUFDUCxLQUFBLEdBQVksSUFBQSxNQUFBLENBQU8sVUFBQSxHQUFVLENBQUMsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxRQUFmLENBQUQsQ0FBVixHQUFvQyxtQkFBM0MsRUFBK0QsR0FBL0Q7SUFDWixNQUFNLENBQUMsb0JBQVAsQ0FBNEIsS0FBNUIsRUFBbUMsTUFBTSxDQUFDLFFBQVAsQ0FBQSxDQUFuQyxFQUFzRCxTQUFDLEdBQUQ7QUFDcEQsVUFBQTtNQURzRCxtQkFBTztNQUM3RCxJQUFBLEdBQU8sS0FBTSxDQUFBLENBQUE7YUFDYixJQUFBLENBQUE7SUFGb0QsQ0FBdEQ7V0FHQTtFQU5ZO0FBMURkIiwic291cmNlc0NvbnRlbnQiOlsidXJsID0gcmVxdWlyZSAndXJsJ1xue3NoZWxsfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuc2VsZWN0b3IgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2xpbms6b3BlbicsIG9wZW5MaW5rKVxuXG5vcGVuTGluayA9IC0+XG4gIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cblxuICBsaW5rID0gbGlua1VuZGVyQ3Vyc29yKGVkaXRvcilcbiAgcmV0dXJuIHVubGVzcyBsaW5rP1xuXG4gIGlmIGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lIGlzICdzb3VyY2UuZ2ZtJ1xuICAgIGxpbmsgPSBsaW5rRm9yTmFtZShlZGl0b3IuZ2V0QnVmZmVyKCksIGxpbmspXG5cbiAge3Byb3RvY29sfSA9IHVybC5wYXJzZShsaW5rKVxuICBpZiBwcm90b2NvbCBpcyAnaHR0cDonIG9yIHByb3RvY29sIGlzICdodHRwczonXG4gICAgc2hlbGwub3BlbkV4dGVybmFsKGxpbmspXG5cbiMgR2V0IHRoZSBsaW5rIHVuZGVyIHRoZSBjdXJzb3IgaW4gdGhlIGVkaXRvclxuI1xuIyBSZXR1cm5zIGEge1N0cmluZ30gbGluayBvciB1bmRlZmluZWQgaWYgbm8gbGluayBmb3VuZC5cbmxpbmtVbmRlckN1cnNvciA9IChlZGl0b3IpIC0+XG4gIGN1cnNvclBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgbGluayA9IGxpbmtBdFBvc2l0aW9uKGVkaXRvciwgY3Vyc29yUG9zaXRpb24pXG4gIHJldHVybiBsaW5rIGlmIGxpbms/XG5cbiAgIyBMb29rIGZvciBhIGxpbmsgdG8gdGhlIGxlZnQgb2YgdGhlIGN1cnNvclxuICBpZiBjdXJzb3JQb3NpdGlvbi5jb2x1bW4gPiAwXG4gICAgbGlua0F0UG9zaXRpb24oZWRpdG9yLCBjdXJzb3JQb3NpdGlvbi50cmFuc2xhdGUoWzAsIC0xXSkpXG5cbiMgR2V0IHRoZSBsaW5rIGF0IHRoZSBidWZmZXIgcG9zaXRpb24gaW4gdGhlIGVkaXRvci5cbiNcbiMgUmV0dXJucyBhIHtTdHJpbmd9IGxpbmsgb3IgdW5kZWZpbmVkIGlmIG5vIGxpbmsgZm91bmQuXG5saW5rQXRQb3NpdGlvbiA9IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSAtPlxuICB1bmxlc3Mgc2VsZWN0b3I/XG4gICAge1Njb3BlU2VsZWN0b3J9ID0gcmVxdWlyZSAnZmlyc3QtbWF0ZSdcbiAgICBzZWxlY3RvciA9IG5ldyBTY29wZVNlbGVjdG9yKCdtYXJrdXAudW5kZXJsaW5lLmxpbmsnKVxuXG4gIGlmIHRva2VuID0gZWRpdG9yLnRva2VuRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pXG4gICAgdG9rZW4udmFsdWUgaWYgdG9rZW4udmFsdWUgYW5kIHNlbGVjdG9yLm1hdGNoZXModG9rZW4uc2NvcGVzKVxuXG4jIEdldCB0aGUgbGluayBmb3IgdGhlIGdpdmVuIG5hbWUuXG4jXG4jIFRoaXMgaXMgZm9yIE1hcmtkb3duIGxpbmtzIG9mIHRoZSBzdHlsZTpcbiNcbiMgYGBgXG4jIFtsYWJlbF1bbmFtZV1cbiNcbiMgW25hbWVdOiBodHRwczovL2dpdGh1Yi5jb21cbiMgYGBgXG4jXG4jIFJldHVybnMgYSB7U3RyaW5nfSBsaW5rXG5saW5rRm9yTmFtZSA9IChidWZmZXIsIGxpbmtOYW1lKSAtPlxuICBsaW5rID0gbGlua05hbWVcbiAgcmVnZXggPSBuZXcgUmVnRXhwKFwiXlxcXFxzKlxcXFxbI3tfLmVzY2FwZVJlZ0V4cChsaW5rTmFtZSl9XFxcXF1cXFxccyo6XFxcXHMqKC4rKSRcIiwgJ2cnKVxuICBidWZmZXIuYmFja3dhcmRzU2NhbkluUmFuZ2UgcmVnZXgsIGJ1ZmZlci5nZXRSYW5nZSgpLCAoe21hdGNoLCBzdG9wfSkgLT5cbiAgICBsaW5rID0gbWF0Y2hbMV1cbiAgICBzdG9wKClcbiAgbGlua1xuIl19
