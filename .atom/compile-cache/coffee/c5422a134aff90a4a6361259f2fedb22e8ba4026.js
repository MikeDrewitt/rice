(function() {
  var _;

  _ = require('underscore-plus');

  module.exports = {
    escapeHtml: function(str) {
      if (this.escapeNode == null) {
        this.escapeNode = document.createElement('div');
      }
      this.escapeNode.innerText = str;
      return this.escapeNode.innerHTML;
    },
    escapeRegex: function(str) {
      return str.replace(/[.?*+^$[\]\\(){}|-]/g, function(match) {
        return "\\" + match;
      });
    },
    sanitizePattern: function(pattern) {
      pattern = this.escapeHtml(pattern);
      return pattern.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    },
    getReplacementResultsMessage: function(arg) {
      var findPattern, replacePattern, replacedPathCount, replacementCount;
      findPattern = arg.findPattern, replacePattern = arg.replacePattern, replacedPathCount = arg.replacedPathCount, replacementCount = arg.replacementCount;
      if (replacedPathCount) {
        return "<span class=\"text-highlight\">Replaced <span class=\"highlight-error\">" + (this.sanitizePattern(findPattern)) + "</span> with <span class=\"highlight-success\">" + (this.sanitizePattern(replacePattern)) + "</span> " + (_.pluralize(replacementCount, 'time')) + " in " + (_.pluralize(replacedPathCount, 'file')) + "</span>";
      } else {
        return "<span class=\"text-highlight\">Nothing replaced</span>";
      }
    },
    getSearchResultsMessage: function(arg) {
      var findPattern, matchCount, pathCount, replacedPathCount;
      findPattern = arg.findPattern, matchCount = arg.matchCount, pathCount = arg.pathCount, replacedPathCount = arg.replacedPathCount;
      if (matchCount) {
        return (_.pluralize(matchCount, 'result')) + " found in " + (_.pluralize(pathCount, 'file')) + " for <span class=\"highlight-info\">" + (this.sanitizePattern(findPattern)) + "</span>";
      } else {
        return "No " + (replacedPathCount != null ? 'more' : '') + " results found for '" + (this.sanitizePattern(findPattern)) + "'";
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L3V0aWwuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxVQUFBLEVBQVksU0FBQyxHQUFEOztRQUNWLElBQUMsQ0FBQSxhQUFjLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCOztNQUNmLElBQUMsQ0FBQSxVQUFVLENBQUMsU0FBWixHQUF3QjthQUN4QixJQUFDLENBQUEsVUFBVSxDQUFDO0lBSEYsQ0FBWjtJQUtBLFdBQUEsRUFBYSxTQUFDLEdBQUQ7YUFDWCxHQUFHLENBQUMsT0FBSixDQUFZLHNCQUFaLEVBQW9DLFNBQUMsS0FBRDtlQUNsQyxJQUFBLEdBQU87TUFEMkIsQ0FBcEM7SUFEVyxDQUxiO0lBU0EsZUFBQSxFQUFpQixTQUFDLE9BQUQ7TUFDZixPQUFBLEdBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaO2FBQ1YsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsS0FBaEIsRUFBdUIsS0FBdkIsQ0FBNkIsQ0FBQyxPQUE5QixDQUFzQyxLQUF0QyxFQUE2QyxLQUE3QztJQUZlLENBVGpCO0lBYUEsNEJBQUEsRUFBOEIsU0FBQyxHQUFEO0FBQzVCLFVBQUE7TUFEOEIsK0JBQWEscUNBQWdCLDJDQUFtQjtNQUM5RSxJQUFHLGlCQUFIO2VBQ0UsMEVBQUEsR0FBMEUsQ0FBQyxJQUFDLENBQUEsZUFBRCxDQUFpQixXQUFqQixDQUFELENBQTFFLEdBQXlHLGlEQUF6RyxHQUF5SixDQUFDLElBQUMsQ0FBQSxlQUFELENBQWlCLGNBQWpCLENBQUQsQ0FBekosR0FBMkwsVUFBM0wsR0FBb00sQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLGdCQUFaLEVBQThCLE1BQTlCLENBQUQsQ0FBcE0sR0FBMk8sTUFBM08sR0FBZ1AsQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLGlCQUFaLEVBQStCLE1BQS9CLENBQUQsQ0FBaFAsR0FBd1IsVUFEMVI7T0FBQSxNQUFBO2VBR0UseURBSEY7O0lBRDRCLENBYjlCO0lBbUJBLHVCQUFBLEVBQXlCLFNBQUMsR0FBRDtBQUN2QixVQUFBO01BRHlCLCtCQUFhLDZCQUFZLDJCQUFXO01BQzdELElBQUcsVUFBSDtlQUNJLENBQUMsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxVQUFaLEVBQXdCLFFBQXhCLENBQUQsQ0FBQSxHQUFtQyxZQUFuQyxHQUE4QyxDQUFDLENBQUMsQ0FBQyxTQUFGLENBQVksU0FBWixFQUF1QixNQUF2QixDQUFELENBQTlDLEdBQThFLHNDQUE5RSxHQUFtSCxDQUFDLElBQUMsQ0FBQSxlQUFELENBQWlCLFdBQWpCLENBQUQsQ0FBbkgsR0FBa0osVUFEdEo7T0FBQSxNQUFBO2VBR0UsS0FBQSxHQUFLLENBQUkseUJBQUgsR0FBMkIsTUFBM0IsR0FBdUMsRUFBeEMsQ0FBTCxHQUFnRCxzQkFBaEQsR0FBcUUsQ0FBQyxJQUFDLENBQUEsZUFBRCxDQUFpQixXQUFqQixDQUFELENBQXJFLEdBQW9HLElBSHRHOztJQUR1QixDQW5CekI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGVzY2FwZUh0bWw6IChzdHIpIC0+XG4gICAgQGVzY2FwZU5vZGUgPz0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZXNjYXBlTm9kZS5pbm5lclRleHQgPSBzdHJcbiAgICBAZXNjYXBlTm9kZS5pbm5lckhUTUxcblxuICBlc2NhcGVSZWdleDogKHN0cikgLT5cbiAgICBzdHIucmVwbGFjZSAvWy4/KiteJFtcXF1cXFxcKCl7fXwtXS9nLCAobWF0Y2gpIC0+XG4gICAgICBcIlxcXFxcIiArIG1hdGNoXG5cbiAgc2FuaXRpemVQYXR0ZXJuOiAocGF0dGVybikgLT5cbiAgICBwYXR0ZXJuID0gQGVzY2FwZUh0bWwocGF0dGVybilcbiAgICBwYXR0ZXJuLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKS5yZXBsYWNlKC9cXHQvZywgJ1xcXFx0JylcblxuICBnZXRSZXBsYWNlbWVudFJlc3VsdHNNZXNzYWdlOiAoe2ZpbmRQYXR0ZXJuLCByZXBsYWNlUGF0dGVybiwgcmVwbGFjZWRQYXRoQ291bnQsIHJlcGxhY2VtZW50Q291bnR9KSAtPlxuICAgIGlmIHJlcGxhY2VkUGF0aENvdW50XG4gICAgICBcIjxzcGFuIGNsYXNzPVxcXCJ0ZXh0LWhpZ2hsaWdodFxcXCI+UmVwbGFjZWQgPHNwYW4gY2xhc3M9XFxcImhpZ2hsaWdodC1lcnJvclxcXCI+I3tAc2FuaXRpemVQYXR0ZXJuKGZpbmRQYXR0ZXJuKX08L3NwYW4+IHdpdGggPHNwYW4gY2xhc3M9XFxcImhpZ2hsaWdodC1zdWNjZXNzXFxcIj4je0BzYW5pdGl6ZVBhdHRlcm4ocmVwbGFjZVBhdHRlcm4pfTwvc3Bhbj4gI3tfLnBsdXJhbGl6ZShyZXBsYWNlbWVudENvdW50LCAndGltZScpfSBpbiAje18ucGx1cmFsaXplKHJlcGxhY2VkUGF0aENvdW50LCAnZmlsZScpfTwvc3Bhbj5cIlxuICAgIGVsc2VcbiAgICAgIFwiPHNwYW4gY2xhc3M9XFxcInRleHQtaGlnaGxpZ2h0XFxcIj5Ob3RoaW5nIHJlcGxhY2VkPC9zcGFuPlwiXG5cbiAgZ2V0U2VhcmNoUmVzdWx0c01lc3NhZ2U6ICh7ZmluZFBhdHRlcm4sIG1hdGNoQ291bnQsIHBhdGhDb3VudCwgcmVwbGFjZWRQYXRoQ291bnR9KSAtPlxuICAgIGlmIG1hdGNoQ291bnRcbiAgICAgIFwiI3tfLnBsdXJhbGl6ZShtYXRjaENvdW50LCAncmVzdWx0Jyl9IGZvdW5kIGluICN7Xy5wbHVyYWxpemUocGF0aENvdW50LCAnZmlsZScpfSBmb3IgPHNwYW4gY2xhc3M9XFxcImhpZ2hsaWdodC1pbmZvXFxcIj4je0BzYW5pdGl6ZVBhdHRlcm4oZmluZFBhdHRlcm4pfTwvc3Bhbj5cIlxuICAgIGVsc2VcbiAgICAgIFwiTm8gI3tpZiByZXBsYWNlZFBhdGhDb3VudD8gdGhlbiAnbW9yZScgZWxzZSAnJ30gcmVzdWx0cyBmb3VuZCBmb3IgJyN7QHNhbml0aXplUGF0dGVybihmaW5kUGF0dGVybil9J1wiXG4iXX0=
