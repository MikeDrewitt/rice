(function() {
  var CharacterPattern, _;

  _ = require('underscore-plus');

  CharacterPattern = /[\w\u0410-\u042F\u0401\u0430-\u044F\u0451]/;

  module.exports = {
    activate: function() {
      return atom.commands.add('atom-text-editor', {
        'autoflow:reflow-selection': (function(_this) {
          return function(event) {
            return _this.reflowSelection(event.currentTarget.getModel());
          };
        })(this)
      });
    },
    reflowSelection: function(editor) {
      var range, reflowOptions, reflowedText;
      range = editor.getSelectedBufferRange();
      if (range.isEmpty()) {
        range = editor.getCurrentParagraphBufferRange();
      }
      if (range == null) {
        return;
      }
      reflowOptions = {
        wrapColumn: this.getPreferredLineLength(editor),
        tabLength: this.getTabLength(editor)
      };
      reflowedText = this.reflow(editor.getTextInRange(range), reflowOptions);
      return editor.getBuffer().setTextInRange(range, reflowedText);
    },
    reflow: function(text, arg) {
      var block, blockLines, currentLine, currentLineLength, escapedLinePrefix, i, j, leadingVerticalSpace, len, len1, linePrefix, linePrefixTabExpanded, lines, paragraphBlocks, paragraphs, ref, segment, tabLength, tabLengthInSpaces, trailingVerticalSpace, wrapColumn;
      wrapColumn = arg.wrapColumn, tabLength = arg.tabLength;
      paragraphs = [];
      text = text.replace(/\r\n?/g, '\n');
      leadingVerticalSpace = text.match(/^\s*\n/);
      if (leadingVerticalSpace) {
        text = text.substr(leadingVerticalSpace.length);
      } else {
        leadingVerticalSpace = '';
      }
      trailingVerticalSpace = text.match(/\n\s*$/);
      if (trailingVerticalSpace) {
        text = text.substr(0, text.length - trailingVerticalSpace.length);
      } else {
        trailingVerticalSpace = '';
      }
      paragraphBlocks = text.split(/\n\s*\n/g);
      if (tabLength) {
        tabLengthInSpaces = Array(tabLength + 1).join(' ');
      } else {
        tabLengthInSpaces = '';
      }
      for (i = 0, len = paragraphBlocks.length; i < len; i++) {
        block = paragraphBlocks[i];
        linePrefix = block.match(/^\s*[\/#*-]*\s*/g)[0];
        linePrefixTabExpanded = linePrefix;
        if (tabLengthInSpaces) {
          linePrefixTabExpanded = linePrefix.replace(/\t/g, tabLengthInSpaces);
        }
        blockLines = block.split('\n');
        if (linePrefix) {
          escapedLinePrefix = _.escapeRegExp(linePrefix);
          blockLines = blockLines.map(function(blockLine) {
            return blockLine.replace(RegExp("^" + escapedLinePrefix), '');
          });
        }
        blockLines = blockLines.map(function(blockLine) {
          return blockLine.replace(/^\s+/, '');
        });
        lines = [];
        currentLine = [];
        currentLineLength = linePrefixTabExpanded.length;
        ref = this.segmentText(blockLines.join(' '));
        for (j = 0, len1 = ref.length; j < len1; j++) {
          segment = ref[j];
          if (this.wrapSegment(segment, currentLineLength, wrapColumn)) {
            lines.push(linePrefix + currentLine.join(''));
            currentLine = [];
            currentLineLength = linePrefixTabExpanded.length;
          }
          currentLine.push(segment);
          currentLineLength += segment.length;
        }
        lines.push(linePrefix + currentLine.join(''));
        paragraphs.push(lines.join('\n').replace(/\s+\n/g, '\n'));
      }
      return leadingVerticalSpace + paragraphs.join('\n\n') + trailingVerticalSpace;
    },
    getTabLength: function(editor) {
      var ref;
      return (ref = atom.config.get('editor.tabLength', {
        scope: editor.getRootScopeDescriptor()
      })) != null ? ref : 2;
    },
    getPreferredLineLength: function(editor) {
      return atom.config.get('editor.preferredLineLength', {
        scope: editor.getRootScopeDescriptor()
      });
    },
    wrapSegment: function(segment, currentLineLength, wrapColumn) {
      return CharacterPattern.test(segment) && (currentLineLength + segment.length > wrapColumn) && (currentLineLength > 0 || segment.length < wrapColumn);
    },
    segmentText: function(text) {
      var match, re, segments;
      segments = [];
      re = /[\s]+|[^\s]+/g;
      while (match = re.exec(text)) {
        segments.push(match[0]);
      }
      return segments;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hdXRvZmxvdy9saWIvYXV0b2Zsb3cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLGdCQUFBLEdBQW1COztFQU9uQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7YUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQ0U7UUFBQSwyQkFBQSxFQUE2QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLEtBQUQ7bUJBQzNCLEtBQUMsQ0FBQSxlQUFELENBQWlCLEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBcEIsQ0FBQSxDQUFqQjtVQUQyQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7T0FERjtJQURRLENBQVY7SUFLQSxlQUFBLEVBQWlCLFNBQUMsTUFBRDtBQUNmLFVBQUE7TUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLHNCQUFQLENBQUE7TUFDUixJQUFtRCxLQUFLLENBQUMsT0FBTixDQUFBLENBQW5EO1FBQUEsS0FBQSxHQUFRLE1BQU0sQ0FBQyw4QkFBUCxDQUFBLEVBQVI7O01BQ0EsSUFBYyxhQUFkO0FBQUEsZUFBQTs7TUFFQSxhQUFBLEdBQ0k7UUFBQSxVQUFBLEVBQVksSUFBQyxDQUFBLHNCQUFELENBQXdCLE1BQXhCLENBQVo7UUFDQSxTQUFBLEVBQVcsSUFBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkLENBRFg7O01BRUosWUFBQSxHQUFlLElBQUMsQ0FBQSxNQUFELENBQVEsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsS0FBdEIsQ0FBUixFQUFzQyxhQUF0QzthQUNmLE1BQU0sQ0FBQyxTQUFQLENBQUEsQ0FBa0Is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bEUsQ0F6RWQ7SUE0RUEsc0JBQUEsRUFBd0IsU0FBQyxNQUFEO2FBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw0QkFBaEIsRUFBOEM7UUFBQSxLQUFBLEVBQU8sTUFBTSxDQUFDLHNCQUFQLENBQUEsQ0FBUDtPQUE5QztJQURzQixDQTVFeEI7SUErRUEsV0FBQSxFQUFhLFNBQUMsT0FBRCxFQUFVLGlCQUFWLEVBQTZCLFVBQTdCO2FBQ1gsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsT0FBdEIsQ0FBQSxJQUNFLENBQUMsaUJBQUEsR0FBb0IsT0FBTyxDQUFDLE1BQTVCLEdBQXFDLFVBQXRDLENBREYsSUFFRSxDQUFDLGlCQUFBLEdBQW9CLENBQXBCLElBQXlCLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLFVBQTNDO0lBSFMsQ0EvRWI7SUFvRkEsV0FBQSxFQUFhLFNBQUMsSUFBRDtBQUNYLFVBQUE7TUFBQSxRQUFBLEdBQVc7TUFDWCxFQUFBLEdBQUs7QUFDbUIsYUFBTSxLQUFBLEdBQVEsRUFBRSxDQUFDLElBQUgsQ0FBUSxJQUFSLENBQWQ7UUFBeEIsUUFBUSxDQUFDLElBQVQsQ0FBYyxLQUFNLENBQUEsQ0FBQSxDQUFwQjtNQUF3QjthQUN4QjtJQUpXLENBcEZiOztBQVZGIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuQ2hhcmFjdGVyUGF0dGVybiA9IC8vL1xuICBbXG4gICAgXFx3ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgRW5nbGlzaFxuICAgIFxcdTA0MTAtXFx1MDQyRlxcdTA0MDFcXHUwNDMwLVxcdTA0NEZcXHUwNDUxICMgQ3lyaWxsaWNcbiAgXVxuLy8vXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ2F1dG9mbG93OnJlZmxvdy1zZWxlY3Rpb24nOiAoZXZlbnQpID0+XG4gICAgICAgIEByZWZsb3dTZWxlY3Rpb24oZXZlbnQuY3VycmVudFRhcmdldC5nZXRNb2RlbCgpKVxuXG4gIHJlZmxvd1NlbGVjdGlvbjogKGVkaXRvcikgLT5cbiAgICByYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICByYW5nZSA9IGVkaXRvci5nZXRDdXJyZW50UGFyYWdyYXBoQnVmZmVyUmFuZ2UoKSBpZiByYW5nZS5pc0VtcHR5KClcbiAgICByZXR1cm4gdW5sZXNzIHJhbmdlP1xuXG4gICAgcmVmbG93T3B0aW9ucyA9XG4gICAgICAgIHdyYXBDb2x1bW46IEBnZXRQcmVmZXJyZWRMaW5lTGVuZ3RoKGVkaXRvcilcbiAgICAgICAgdGFiTGVuZ3RoOiBAZ2V0VGFiTGVuZ3RoKGVkaXRvcilcbiAgICByZWZsb3dlZFRleHQgPSBAcmVmbG93KGVkaXRvci5nZXRUZXh0SW5SYW5nZShyYW5nZSksIHJlZmxvd09wdGlvbnMpXG4gICAgZWRpdG9yLmdldEJ1ZmZlcigpLnNldFRleHRJblJhbmdlKHJhbmdlLCByZWZsb3dlZFRleHQpXG5cbiAgcmVmbG93OiAodGV4dCwge3dyYXBDb2x1bW4sIHRhYkxlbmd0aH0pIC0+XG4gICAgcGFyYWdyYXBocyA9IFtdXG4gICAgIyBDb252ZXJ0IGFsbCBcXHJcXG4gYW5kIFxcciB0byBcXG4uIFRoZSB0ZXh0IGJ1ZmZlciB3aWxsIG5vcm1hbGl6ZSB0aGVtIGxhdGVyXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxyXFxuPy9nLCAnXFxuJylcblxuICAgIGxlYWRpbmdWZXJ0aWNhbFNwYWNlID0gdGV4dC5tYXRjaCgvXlxccypcXG4vKVxuICAgIGlmIGxlYWRpbmdWZXJ0aWNhbFNwYWNlXG4gICAgICB0ZXh0ID0gdGV4dC5zdWJzdHIobGVhZGluZ1ZlcnRpY2FsU3BhY2UubGVuZ3RoKVxuICAgIGVsc2VcbiAgICAgIGxlYWRpbmdWZXJ0aWNhbFNwYWNlID0gJydcblxuICAgIHRyYWlsaW5nVmVydGljYWxTcGFjZSA9IHRleHQubWF0Y2goL1xcblxccyokLylcbiAgICBpZiB0cmFpbGluZ1ZlcnRpY2FsU3BhY2VcbiAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cigwLCB0ZXh0Lmxlbmd0aCAtIHRyYWlsaW5nVmVydGljYWxTcGFjZS5sZW5ndGgpXG4gICAgZWxzZVxuICAgICAgdHJhaWxpbmdWZXJ0aWNhbFNwYWNlID0gJydcblxuICAgIHBhcmFncmFwaEJsb2NrcyA9IHRleHQuc3BsaXQoL1xcblxccypcXG4vZylcbiAgICBpZiB0YWJMZW5ndGhcbiAgICAgIHRhYkxlbmd0aEluU3BhY2VzID0gQXJyYXkodGFiTGVuZ3RoICsgMSkuam9pbignICcpXG4gICAgZWxzZVxuICAgICAgdGFiTGVuZ3RoSW5TcGFjZXMgPSAnJ1xuXG4gICAgZm9yIGJsb2NrIGluIHBhcmFncmFwaEJsb2Nrc1xuXG4gICAgICAjIFRPRE86IHRoaXMgY291bGQgYmUgbW9yZSBsYW5ndWFnZSBzcGVjaWZpYy4gVXNlIHRoZSBhY3R1YWwgY29tbWVudCBjaGFyLlxuICAgICAgbGluZVByZWZpeCA9IGJsb2NrLm1hdGNoKC9eXFxzKltcXC8jKi1dKlxccyovZylbMF1cbiAgICAgIGxpbmVQcmVmaXhUYWJFeHBhbmRlZCA9IGxpbmVQcmVmaXhcbiAgICAgIGlmIHRhYkxlbmd0aEluU3BhY2VzXG4gICAgICAgIGxpbmVQcmVmaXhUYWJFeHBhbmRlZCA9IGxpbmVQcmVmaXgucmVwbGFjZSgvXFx0L2csIHRhYkxlbmd0aEluU3BhY2VzKVxuICAgICAgYmxvY2tMaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKVxuXG4gICAgICBpZiBsaW5lUHJlZml4XG4gICAgICAgIGVzY2FwZWRMaW5lUHJlZml4ID0gXy5lc2NhcGVSZWdFeHAobGluZVByZWZpeClcbiAgICAgICAgYmxvY2tMaW5lcyA9IGJsb2NrTGluZXMubWFwIChibG9ja0xpbmUpIC0+XG4gICAgICAgICAgYmxvY2tMaW5lLnJlcGxhY2UoLy8vXiN7ZXNjYXBlZExpbmVQcmVmaXh9Ly8vLCAnJylcblxuICAgICAgYmxvY2tMaW5lcyA9IGJsb2NrTGluZXMubWFwIChibG9ja0xpbmUpIC0+XG4gICAgICAgIGJsb2NrTGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKVxuXG4gICAgICBsaW5lcyA9IFtdXG4gICAgICBjdXJyZW50TGluZSA9IFtdXG4gICAgICBjdXJyZW50TGluZUxlbmd0aCA9IGxpbmVQcmVmaXhUYWJFeHBhbmRlZC5sZW5ndGhcblxuICAgICAgZm9yIHNlZ21lbnQgaW4gQHNlZ21lbnRUZXh0KGJsb2NrTGluZXMuam9pbignICcpKVxuICAgICAgICBpZiBAd3JhcFNlZ21lbnQoc2VnbWVudCwgY3VycmVudExpbmVMZW5ndGgsIHdyYXBDb2x1bW4pXG4gICAgICAgICAgbGluZXMucHVzaChsaW5lUHJlZml4ICsgY3VycmVudExpbmUuam9pbignJykpXG4gICAgICAgICAgY3VycmVudExpbmUgPSBbXVxuICAgICAgICAgIGN1cnJlbnRMaW5lTGVuZ3RoID0gbGluZVByZWZpeFRhYkV4cGFuZGVkLmxlbmd0aFxuICAgICAgICBjdXJyZW50TGluZS5wdXNoKHNlZ21lbnQpXG4gICAgICAgIGN1cnJlbnRMaW5lTGVuZ3RoICs9IHNlZ21lbnQubGVuZ3RoXG4gICAgICBsaW5lcy5wdXNoKGxpbmVQcmVmaXggKyBjdXJyZW50TGluZS5qb2luKCcnKSlcblxuICAgICAgcGFyYWdyYXBocy5wdXNoKGxpbmVzLmpvaW4oJ1xcbicpLnJlcGxhY2UoL1xccytcXG4vZywgJ1xcbicpKVxuXG4gICAgbGVhZGluZ1ZlcnRpY2FsU3BhY2UgKyBwYXJhZ3JhcGhzLmpvaW4oJ1xcblxcbicpICsgdHJhaWxpbmdWZXJ0aWNhbFNwYWNlXG5cbiAgZ2V0VGFiTGVuZ3RoOiAoZWRpdG9yKSAtPlxuICAgIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnRhYkxlbmd0aCcsIHNjb3BlOiBlZGl0b3IuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpKSA/IDJcblxuICBnZXRQcmVmZXJyZWRMaW5lTGVuZ3RoOiAoZWRpdG9yKSAtPlxuICAgIGF0b20uY29uZmlnLmdldCgnZWRpdG9yLnByZWZlcnJlZExpbmVMZW5ndGgnLCBzY29wZTogZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKSlcblxuICB3cmFwU2VnbWVudDogKHNlZ21lbnQsIGN1cnJlbnRMaW5lTGVuZ3RoLCB3cmFwQ29sdW1uKSAtPlxuICAgIENoYXJhY3RlclBhdHRlcm4udGVzdChzZWdtZW50KSBhbmRcbiAgICAgIChjdXJyZW50TGluZUxlbmd0aCArIHNlZ21lbnQubGVuZ3RoID4gd3JhcENvbHVtbikgYW5kXG4gICAgICAoY3VycmVudExpbmVMZW5ndGggPiAwIG9yIHNlZ21lbnQubGVuZ3RoIDwgd3JhcENvbHVtbilcblxuICBzZWdtZW50VGV4dDogKHRleHQpIC0+XG4gICAgc2VnbWVudHMgPSBbXVxuICAgIHJlID0gL1tcXHNdK3xbXlxcc10rL2dcbiAgICBzZWdtZW50cy5wdXNoKG1hdGNoWzBdKSB3aGlsZSBtYXRjaCA9IHJlLmV4ZWModGV4dClcbiAgICBzZWdtZW50c1xuIl19
