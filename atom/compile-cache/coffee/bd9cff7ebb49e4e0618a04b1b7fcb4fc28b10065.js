(function() {
  var Range, SelectorCache, SelfClosingTags, TagFinder, _;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  SelectorCache = require('./selector-cache');

  SelfClosingTags = require('./self-closing-tags');

  module.exports = TagFinder = (function() {
    function TagFinder(editor) {
      this.editor = editor;
      this.tagPattern = /(<(\/?))([^\s>]+)([\s>]|$)/;
      this.wordRegex = /[^>\r\n]*/;
      this.tagSelector = SelectorCache.get('meta.tag | punctuation.definition.tag');
      this.commentSelector = SelectorCache.get('comment.*');
    }

    TagFinder.prototype.patternForTagName = function(tagName) {
      tagName = _.escapeRegExp(tagName);
      return new RegExp("(<" + tagName + "([\\s>]|$))|(</" + tagName + ">)", 'gi');
    };

    TagFinder.prototype.isRangeCommented = function(range) {
      var scopes;
      scopes = this.editor.scopeDescriptorForBufferPosition(range.start).getScopesArray();
      return this.commentSelector.matches(scopes);
    };

    TagFinder.prototype.isTagRange = function(range) {
      var scopes;
      scopes = this.editor.scopeDescriptorForBufferPosition(range.start).getScopesArray();
      return this.tagSelector.matches(scopes);
    };

    TagFinder.prototype.isCursorOnTag = function() {
      return this.tagSelector.matches(this.editor.getLastCursor().getScopeDescriptor().getScopesArray());
    };

    TagFinder.prototype.findStartTag = function(tagName, endPosition) {
      var pattern, scanRange, startRange, unpairedCount;
      scanRange = new Range([0, 0], endPosition);
      pattern = this.patternForTagName(tagName);
      startRange = null;
      unpairedCount = 0;
      this.editor.backwardsScanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var match, range, stop;
          match = arg.match, range = arg.range, stop = arg.stop;
          if (_this.isRangeCommented(range)) {
            return;
          }
          if (match[1]) {
            unpairedCount--;
            if (unpairedCount < 0) {
              startRange = range.translate([0, 1], [0, -match[2].length]);
              return stop();
            }
          } else {
            return unpairedCount++;
          }
        };
      })(this));
      return startRange;
    };

    TagFinder.prototype.findEndTag = function(tagName, startPosition) {
      var endRange, pattern, scanRange, unpairedCount;
      scanRange = new Range(startPosition, this.editor.buffer.getEndPosition());
      pattern = this.patternForTagName(tagName);
      endRange = null;
      unpairedCount = 0;
      this.editor.scanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var match, range, stop;
          match = arg.match, range = arg.range, stop = arg.stop;
          if (_this.isRangeCommented(range)) {
            return;
          }
          if (match[1]) {
            return unpairedCount++;
          } else {
            unpairedCount--;
            if (unpairedCount < 0) {
              endRange = range.translate([0, 2], [0, -1]);
              return stop();
            }
          }
        };
      })(this));
      return endRange;
    };

    TagFinder.prototype.findStartEndTags = function() {
      var endPosition, ranges;
      ranges = null;
      endPosition = this.editor.getLastCursor().getCurrentWordBufferRange({
        wordRegex: this.wordRegex
      }).end;
      this.editor.backwardsScanInBufferRange(this.tagPattern, [[0, 0], endPosition], (function(_this) {
        return function(arg) {
          var endRange, entireMatch, isClosingTag, match, prefix, range, startRange, stop, suffix, tagName;
          match = arg.match, range = arg.range, stop = arg.stop;
          stop();
          entireMatch = match[0], prefix = match[1], isClosingTag = match[2], tagName = match[3], suffix = match[4];
          if (range.start.row === range.end.row) {
            startRange = range.translate([0, prefix.length], [0, -suffix.length]);
          } else {
            startRange = Range.fromObject([range.start.translate([0, prefix.length]), [range.start.row, 2e308]]);
          }
          if (isClosingTag) {
            endRange = _this.findStartTag(tagName, startRange.start);
          } else {
            endRange = _this.findEndTag(tagName, startRange.end);
          }
          if ((startRange != null) && (endRange != null)) {
            return ranges = {
              startRange: startRange,
              endRange: endRange
            };
          }
        };
      })(this));
      return ranges;
    };

    TagFinder.prototype.findEnclosingTags = function() {
      var ranges;
      if (ranges = this.findStartEndTags()) {
        if (this.isTagRange(ranges.startRange) && this.isTagRange(ranges.endRange)) {
          return ranges;
        }
      }
      return null;
    };

    TagFinder.prototype.findMatchingTags = function() {
      if (this.isCursorOnTag()) {
        return this.findStartEndTags();
      }
    };

    TagFinder.prototype.parseFragment = function(fragment, stack, matchExpr, cond) {
      var match, topElem;
      match = fragment.match(matchExpr);
      while (match && cond(stack)) {
        if (SelfClosingTags.indexOf(match[1]) === -1) {
          topElem = stack[stack.length - 1];
          if (match[2] && topElem === match[2]) {
            stack.pop();
          } else if (match[1]) {
            stack.push(match[1]);
          }
        }
        fragment = fragment.substr(match.index + match[0].length);
        match = fragment.match(matchExpr);
      }
      return stack;
    };

    TagFinder.prototype.tagsNotClosedInFragment = function(fragment) {
      return this.parseFragment(fragment, [], /<(\w[-\w]*(?:\:\w[-\w]*)?)|<\/(\w[-\w]*(?:\:\w[-\w]*)?)/, function() {
        return true;
      });
    };

    TagFinder.prototype.tagDoesNotCloseInFragment = function(tags, fragment) {
      var escapedTag, matchExpr, stack, stackLength, tag;
      if (tags.length === 0) {
        return false;
      }
      stack = tags;
      stackLength = stack.length;
      tag = tags[tags.length - 1];
      escapedTag = _.escapeRegExp(tag);
      matchExpr = new RegExp("<(" + escapedTag + ")|<\/(" + escapedTag + ")");
      stack = this.parseFragment(fragment, stack, matchExpr, function(s) {
        return s.length >= stackLength || s[s.length - 1] === tag;
      });
      return stack.length > 0 && stack[stack.length - 1] === tag;
    };

    TagFinder.prototype.closingTagForFragments = function(preFragment, postFragment) {
      var tag, tags;
      tags = this.tagsNotClosedInFragment(preFragment);
      tag = tags[tags.length - 1];
      if (this.tagDoesNotCloseInFragment(tags, postFragment)) {
        return tag;
      } else {
        return null;
      }
    };

    return TagFinder;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9icmFja2V0LW1hdGNoZXIvbGliL3RhZy1maW5kZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUNWLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBQ2hCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHFCQUFSOztFQUlsQixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsbUJBQUMsTUFBRDtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQ1osSUFBQyxDQUFBLFVBQUQsR0FBYztNQUNkLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsV0FBRCxHQUFlLGFBQWEsQ0FBQyxHQUFkLENBQWtCLHVDQUFsQjtNQUNmLElBQUMsQ0FBQSxlQUFELEdBQW1CLGFBQWEsQ0FBQyxHQUFkLENBQWtCLFdBQWxCO0lBSlI7O3dCQU1iLGlCQUFBLEdBQW1CLFNBQUMsT0FBRDtNQUNqQixPQUFBLEdBQVUsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxPQUFmO2FBQ04sSUFBQSxNQUFBLENBQU8sSUFBQSxHQUFLLE9BQUwsR0FBYSxpQkFBYixHQUE4QixPQUE5QixHQUFzQyxJQUE3QyxFQUFrRCxJQUFsRDtJQUZhOzt3QkFJbkIsZ0JBQUEsR0FBa0IsU0FBQyxLQUFEO0FBQ2hCLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQ0FBUixDQUF5QyxLQUFLLENBQUMsS0FBL0MsQ0FBcUQsQ0FBQyxjQUF0RCxDQUFBO2FBQ1QsSUFBQyxDQUFBLGVBQWUsQ0FBQyxPQUFqQixDQUF5QixNQUF6QjtJQUZnQjs7d0JBSWxCLFVBQUEsR0FB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WUFBakMsQ0FBSDtlQUNFLElBREY7T0FBQSxNQUFBO2VBR0UsS0FIRjs7SUFIc0I7Ozs7O0FBN0oxQiIsInNvdXJjZXNDb250ZW50IjpbIntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblNlbGVjdG9yQ2FjaGUgPSByZXF1aXJlICcuL3NlbGVjdG9yLWNhY2hlJ1xuU2VsZkNsb3NpbmdUYWdzID0gcmVxdWlyZSAnLi9zZWxmLWNsb3NpbmctdGFncydcblxuIyBIZWxwZXIgdG8gZmluZCB0aGUgbWF0Y2hpbmcgc3RhcnQvZW5kIHRhZyBmb3IgdGhlIHN0YXJ0L2VuZCB0YWcgdW5kZXIgdGhlXG4jIGN1cnNvciBpbiBYTUwsIEhUTUwsIGV0Yy4gZWRpdG9ycy5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRhZ0ZpbmRlclxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgQHRhZ1BhdHRlcm4gPSAvKDwoXFwvPykpKFteXFxzPl0rKShbXFxzPl18JCkvXG4gICAgQHdvcmRSZWdleCA9IC9bXj5cXHJcXG5dKi9cbiAgICBAdGFnU2VsZWN0b3IgPSBTZWxlY3RvckNhY2hlLmdldCgnbWV0YS50YWcgfCBwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnRhZycpXG4gICAgQGNvbW1lbnRTZWxlY3RvciA9IFNlbGVjdG9yQ2FjaGUuZ2V0KCdjb21tZW50LionKVxuXG4gIHBhdHRlcm5Gb3JUYWdOYW1lOiAodGFnTmFtZSkgLT5cbiAgICB0YWdOYW1lID0gXy5lc2NhcGVSZWdFeHAodGFnTmFtZSlcbiAgICBuZXcgUmVnRXhwKFwiKDwje3RhZ05hbWV9KFtcXFxccz5dfCQpKXwoPC8je3RhZ05hbWV9PilcIiwgJ2dpJylcblxuICBpc1JhbmdlQ29tbWVudGVkOiAocmFuZ2UpIC0+XG4gICAgc2NvcGVzID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihyYW5nZS5zdGFydCkuZ2V0U2NvcGVzQXJyYXkoKVxuICAgIEBjb21tZW50U2VsZWN0b3IubWF0Y2hlcyhzY29wZXMpXG5cbiAgaXNUYWdSYW5nZTogKHJhbmdlKSAtPlxuICAgIHNjb3BlcyA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24ocmFuZ2Uuc3RhcnQpLmdldFNjb3Blc0FycmF5KClcbiAgICBAdGFnU2VsZWN0b3IubWF0Y2hlcyhzY29wZXMpXG5cbiAgaXNDdXJzb3JPblRhZzogLT5cbiAgICBAdGFnU2VsZWN0b3IubWF0Y2hlcyhAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRTY29wZURlc2NyaXB0b3IoKS5nZXRTY29wZXNBcnJheSgpKVxuXG4gIGZpbmRTdGFydFRhZzogKHRhZ05hbWUsIGVuZFBvc2l0aW9uKSAtPlxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShbMCwgMF0sIGVuZFBvc2l0aW9uKVxuICAgIHBhdHRlcm4gPSBAcGF0dGVybkZvclRhZ05hbWUodGFnTmFtZSlcbiAgICBzdGFydFJhbmdlID0gbnVsbFxuICAgIHVucGFpcmVkQ291bnQgPSAwXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7bWF0Y2gsIHJhbmdlLCBzdG9wfSkgPT5cbiAgICAgIHJldHVybiBpZiBAaXNSYW5nZUNvbW1lbnRlZChyYW5nZSlcblxuICAgICAgaWYgbWF0Y2hbMV1cbiAgICAgICAgdW5wYWlyZWRDb3VudC0tXG4gICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgc3RhcnRSYW5nZSA9IHJhbmdlLnRyYW5zbGF0ZShbMCwgMV0sIFswLCAtbWF0Y2hbMl0ubGVuZ3RoXSkgIyBTdWJ0cmFjdCA8IGFuZCB0YWcgbmFtZSBzdWZmaXggZnJvbSByYW5nZVxuICAgICAgICAgIHN0b3AoKVxuICAgICAgZWxzZVxuICAgICAgICB1bnBhaXJlZENvdW50KytcblxuICAgIHN0YXJ0UmFuZ2VcblxuICBmaW5kRW5kVGFnOiAodGFnTmFtZSwgc3RhcnRQb3NpdGlvbikgLT5cbiAgICBzY2FuUmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnRQb3NpdGlvbiwgQGVkaXRvci5idWZmZXIuZ2V0RW5kUG9zaXRpb24oKSlcbiAgICBwYXR0ZXJuID0gQHBhdHRlcm5Gb3JUYWdOYW1lKHRhZ05hbWUpXG4gICAgZW5kUmFuZ2UgPSBudWxsXG4gICAgdW5wYWlyZWRDb3VudCA9IDBcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHttYXRjaCwgcmFuZ2UsIHN0b3B9KSA9PlxuICAgICAgcmV0dXJuIGlmIEBpc1JhbmdlQ29tbWVudGVkKHJhbmdlKVxuXG4gICAgICBpZiBtYXRjaFsxXVxuICAgICAgICB1bnBhaXJlZENvdW50KytcbiAgICAgIGVsc2VcbiAgICAgICAgdW5wYWlyZWRDb3VudC0tXG4gICAgICAgIGlmIHVucGFpcmVkQ291bnQgPCAwXG4gICAgICAgICAgZW5kUmFuZ2UgPSByYW5nZS50cmFuc2xhdGUoWzAsIDJdLCBbMCwgLTFdKSAjIFN1YnRyYWN0IDwvIGFuZCA+IGZyb20gcmFuZ2VcbiAgICAgICAgICBzdG9wKClcblxuICAgIGVuZFJhbmdlXG5cbiAgZmluZFN0YXJ0RW5kVGFnczogLT5cbiAgICByYW5nZXMgPSBudWxsXG4gICAgZW5kUG9zaXRpb24gPSBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKHtAd29yZFJlZ2V4fSkuZW5kXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBAdGFnUGF0dGVybiwgW1swLCAwXSwgZW5kUG9zaXRpb25dLCAoe21hdGNoLCByYW5nZSwgc3RvcH0pID0+XG4gICAgICBzdG9wKClcblxuICAgICAgW2VudGlyZU1hdGNoLCBwcmVmaXgsIGlzQ2xvc2luZ1RhZywgdGFnTmFtZSwgc3VmZml4XSA9IG1hdGNoXG5cbiAgICAgIGlmIHJhbmdlLnN0YXJ0LnJvdyBpcyByYW5nZS5lbmQucm93XG4gICAgICAgIHN0YXJ0UmFuZ2UgPSByYW5nZS50cmFuc2xhdGUoWzAsIHByZWZpeC5sZW5ndGhdLCBbMCwgLXN1ZmZpeC5sZW5ndGhdKVxuICAgICAgZWxzZVxuICAgICAgICBzdGFydFJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChbcmFuZ2Uuc3RhcnQudHJhbnNsYXRlKFswLCBwcmVmaXgubGVuZ3RoXSksIFtyYW5nZS5zdGFydC5yb3csIEluZmluaXR5XV0pXG5cbiAgICAgIGlmIGlzQ2xvc2luZ1RhZ1xuICAgICAgICBlbmRSYW5nZSA9IEBmaW5kU3RhcnRUYWcodGFnTmFtZSwgc3RhcnRSYW5nZS5zdGFydClcbiAgICAgIGVsc2VcbiAgICAgICAgZW5kUmFuZ2UgPSBAZmluZEVuZFRhZyh0YWdOYW1lLCBzdGFydFJhbmdlLmVuZClcblxuICAgICAgcmFuZ2VzID0ge3N0YXJ0UmFuZ2UsIGVuZFJhbmdlfSBpZiBzdGFydFJhbmdlPyBhbmQgZW5kUmFuZ2U/XG4gICAgcmFuZ2VzXG5cbiAgZmluZEVuY2xvc2luZ1RhZ3M6IC0+XG4gICAgaWYgcmFuZ2VzID0gQGZpbmRTdGFydEVuZFRhZ3MoKVxuICAgICAgaWYgQGlzVGFnUmFuZ2UocmFuZ2VzLnN0YXJ0UmFuZ2UpIGFuZCBAaXNUYWdSYW5nZShyYW5nZXMuZW5kUmFuZ2UpXG4gICAgICAgIHJldHVybiByYW5nZXNcblxuICAgIG51bGxcblxuICBmaW5kTWF0Y2hpbmdUYWdzOiAtPlxuICAgIEBmaW5kU3RhcnRFbmRUYWdzKCkgaWYgQGlzQ3Vyc29yT25UYWcoKVxuXG4gICMgUGFyc2VzIGEgZnJhZ21lbnQgb2YgaHRtbCByZXR1cm5pbmcgdGhlIHN0YWNrIChpLmUuLCBhbiBhcnJheSkgb2Ygb3BlbiB0YWdzXG4gICNcbiAgIyBmcmFnbWVudCAgLSB0aGUgZnJhZ21lbnQgb2YgaHRtbCB0byBiZSBhbmFseXNlZFxuICAjIHN0YWNrICAgICAtIGFuIGFycmF5IHRvIGJlIHBvcHVsYXRlZCAoY2FuIGJlIG5vbi1lbXB0eSlcbiAgIyBtYXRjaEV4cHIgLSBhIFJlZ0V4cCBkZXNjcmliaW5nIGhvdyB0byBtYXRjaCBvcGVuaW5nL2Nsb3NpbmcgdGFnc1xuICAjICAgICAgICAgICAgIHRoZSBvcGVuaW5nL2Nsb3NpbmcgZGVzY3JpcHRpb25zIG11c3QgYmUgY2FwdHVyZWQgc3ViZXhwcmVzc2lvbnNcbiAgIyAgICAgICAgICAgICBzbyB0aGF0IHRoZSBjb2RlIGNhbiByZWZlciB0byBtYXRjaFsxXSB0byBjaGVjayBpZiBhbiBvcGVuaW5nXG4gICMgICAgICAgICAgICAgdGFnIGhhcyBiZWVuIGZvdW5kLCBhbmQgdG8gbWF0Y2hbMl0gdG8gY2hlY2sgaWYgYSBjbG9zaW5nIHRhZ1xuICAjICAgICAgICAgICAgIGhhcyBiZWVuIGZvdW5kXG4gICMgY29uZCAgICAgIC0gYSBjb25kaXRpb24gdG8gYmUgY2hlY2tlZCBhdCBlYWNoIGl0ZXJhdGlvbi4gSWYgdGhlIGZ1bmN0aW9uXG4gICMgICAgICAgICAgICAgcmV0dXJucyBmYWxzZSB0aGUgcHJvY2Vzc2luZyBpcyBpbW1lZGlhdGVseSBpbnRlcnJ1cHRlZC4gV2hlblxuICAjICAgICAgICAgICAgIGNhbGxlZCB0aGUgY3VycmVudCBzdGFjayBpcyBwcm92aWRlZCB0byB0aGUgZnVuY3Rpb24uXG4gICNcbiAgIyBSZXR1cm5zIGFuIGFycmF5IG9mIHN0cmluZ3MuIEVhY2ggc3RyaW5nIGlzIGEgdGFnIHRoYXQgaXMgc3RpbGwgdG8gYmUgY2xvc2VkXG4gICMgKHRoZSBtb3N0IHJlY2VudCBub24gY2xvc2VkIHRhZyBpcyBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheSkuXG4gIHBhcnNlRnJhZ21lbnQ6IChmcmFnbWVudCwgc3RhY2ssIG1hdGNoRXhwciwgY29uZCkgLT5cbiAgICBtYXRjaCA9IGZyYWdtZW50Lm1hdGNoKG1hdGNoRXhwcilcbiAgICB3aGlsZSBtYXRjaCBhbmQgY29uZChzdGFjaylcbiAgICAgIGlmIFNlbGZDbG9zaW5nVGFncy5pbmRleE9mKG1hdGNoWzFdKSBpcyAtMVxuICAgICAgICB0b3BFbGVtID0gc3RhY2tbc3RhY2subGVuZ3RoLTFdXG5cbiAgICAgICAgaWYgbWF0Y2hbMl0gYW5kIHRvcEVsZW0gaXMgbWF0Y2hbMl1cbiAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICBlbHNlIGlmIG1hdGNoWzFdXG4gICAgICAgICAgc3RhY2sucHVzaCBtYXRjaFsxXVxuXG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnN1YnN0cihtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aClcbiAgICAgIG1hdGNoID0gZnJhZ21lbnQubWF0Y2gobWF0Y2hFeHByKVxuXG4gICAgc3RhY2tcblxuICAjIFBhcnNlcyB0aGUgZ2l2ZW4gZnJhZ21lbnQgb2YgaHRtbCBjb2RlIHJldHVybmluZyB0aGUgbGFzdCB1bmNsb3NlZCB0YWcuXG4gICNcbiAgIyBmcmFnbWVudCAtIGEgc3RyaW5nIGNvbnRhaW5pbmcgYSBmcmFnbWVudCBvZiBodG1sIGNvZGUuXG4gICNcbiAgIyBSZXR1cm5zIGEgc3RyaW5nIHdpdGggdGhlIG5hbWUgb2YgdGhlIG1vc3QgcmVjZW50IHVuY2xvc2VkIHRhZy5cbiAgdGFnc05vdENsb3NlZEluRnJhZ21lbnQ6IChmcmFnbWVudCkgLT5cbiAgICBAcGFyc2VGcmFnbWVudCBmcmFnbWVudCwgW10sIC88KFxcd1stXFx3XSooPzpcXDpcXHdbLVxcd10qKT8pfDxcXC8oXFx3Wy1cXHddKig/OlxcOlxcd1stXFx3XSopPykvLCAtPiB0cnVlXG5cbiAgIyBQYXJzZXMgdGhlIGdpdmVuIGZyYWdtZW50IG9mIGh0bWwgY29kZSBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiB0YWdcbiAgIyBoYXMgYSBtYXRjaGluZyBjbG9zaW5nIHRhZyBpbiBpdC4gSWYgdGFnIGlzIHJlb3BlbmVkIGFuZCByZWNsb3NlZCBpbiB0aGVcbiAgIyBnaXZlbiBmcmFnbWVudCB0aGVuIHRoZSBlbmQgcG9pbnQgb2YgdGhhdCBwYWlyIGRvZXMgbm90IGNvdW50IGFzIGEgbWF0Y2hpbmdcbiAgIyBjbG9zaW5nIHRhZy5cbiAgdGFnRG9lc05vdENsb3NlSW5GcmFnbWVudDogKHRhZ3MsIGZyYWdtZW50KSAtPlxuICAgIHJldHVybiBmYWxzZSBpZiB0YWdzLmxlbmd0aCBpcyAwXG5cbiAgICBzdGFjayA9IHRhZ3NcbiAgICBzdGFja0xlbmd0aCA9IHN0YWNrLmxlbmd0aFxuICAgIHRhZyA9IHRhZ3NbdGFncy5sZW5ndGgtMV1cbiAgICBlc2NhcGVkVGFnID0gXy5lc2NhcGVSZWdFeHAodGFnKVxuICAgIG1hdGNoRXhwciA9IG5ldyBSZWdFeHAoXCI8KCN7ZXNjYXBlZFRhZ30pfDxcXC8oI3tlc2NhcGVkVGFnfSlcIilcbiAgICBzdGFjayA9IEBwYXJzZUZyYWdtZW50IGZyYWdtZW50LCBzdGFjaywgbWF0Y2hFeHByLCAocykgLT5cbiAgICAgIHMubGVuZ3RoID49IHN0YWNrTGVuZ3RoIG9yIHNbcy5sZW5ndGgtMV0gaXMgdGFnXG5cbiAgICBzdGFjay5sZW5ndGggPiAwIGFuZCBzdGFja1tzdGFjay5sZW5ndGgtMV0gaXMgdGFnXG5cbiAgIyBQYXJzZXMgcHJlRnJhZ21lbnQgYW5kIHBvc3RGcmFnbWVudCByZXR1cm5pbmcgdGhlIGxhc3Qgb3BlbiB0YWcgaW5cbiAgIyBwcmVGcmFnbWVudCB0aGF0IGlzIG5vdCBjbG9zZWQgaW4gcG9zdEZyYWdtZW50LlxuICAjXG4gICMgUmV0dXJucyBhIHRhZyBuYW1lIG9yIG51bGwgaWYgaXQgY2FuJ3QgZmluZCBpdC5cbiAgY2xvc2luZ1RhZ0ZvckZyYWdtZW50czogKHByZUZyYWdtZW50LCBwb3N0RnJhZ21lbnQpIC0+XG4gICAgdGFncyA9IEB0YWdzTm90Q2xvc2VkSW5GcmFnbWVudChwcmVGcmFnbWVudClcbiAgICB0YWcgPSB0YWdzW3RhZ3MubGVuZ3RoLTFdXG4gICAgaWYgQHRhZ0RvZXNOb3RDbG9zZUluRnJhZ21lbnQodGFncywgcG9zdEZyYWdtZW50KVxuICAgICAgdGFnXG4gICAgZWxzZVxuICAgICAgbnVsbFxuIl19
