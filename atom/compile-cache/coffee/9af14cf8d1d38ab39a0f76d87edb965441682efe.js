(function() {
  var LinesYardstick, Point, isPairedCharacter;

  Point = require('text-buffer').Point;

  isPairedCharacter = require('./text-utils').isPairedCharacter;

  module.exports = LinesYardstick = (function() {
    function LinesYardstick(model, lineNodesProvider, lineTopIndex) {
      this.model = model;
      this.lineNodesProvider = lineNodesProvider;
      this.lineTopIndex = lineTopIndex;
      this.rangeForMeasurement = document.createRange();
      this.invalidateCache();
    }

    LinesYardstick.prototype.invalidateCache = function() {
      return this.leftPixelPositionCache = {};
    };

    LinesYardstick.prototype.measuredRowForPixelPosition = function(pixelPosition) {
      var row, targetTop;
      targetTop = pixelPosition.top;
      row = Math.floor(targetTop / this.model.getLineHeightInPixels());
      if (0 <= row) {
        return row;
      }
    };

    LinesYardstick.prototype.screenPositionForPixelPosition = function(pixelPosition) {
      var charIndex, characterIndex, high, i, j, lastScreenRow, lineNode, lineOffset, low, mid, nextCharIndex, rangeRect, ref, row, targetLeft, targetTop, textNode, textNodeIndex, textNodeStartColumn, textNodes;
      targetTop = pixelPosition.top;
      row = Math.max(0, this.lineTopIndex.rowForPixelPosition(targetTop));
      lineNode = this.lineNodesProvider.lineNodeForScreenRow(row);
      if (!lineNode) {
        lastScreenRow = this.model.getLastScreenRow();
        if (row > lastScreenRow) {
          return Point(lastScreenRow, this.model.lineLengthForScreenRow(lastScreenRow));
        } else {
          return Point(row, 0);
        }
      }
      targetLeft = pixelPosition.left;
      if (targetTop < 0 || targetLeft < 0) {
        targetLeft = 0;
      }
      textNodes = this.lineNodesProvider.textNodesForScreenRow(row);
      lineOffset = lineNode.getBoundingClientRect().left;
      targetLeft += lineOffset;
      textNodeIndex = 0;
      low = 0;
      high = textNodes.length - 1;
      while (low <= high) {
        mid = low + (high - low >> 1);
        textNode = textNodes[mid];
        rangeRect = this.clientRectForRange(textNode, 0, textNode.length);
        if (targetLeft < rangeRect.left) {
          high = mid - 1;
          textNodeIndex = Math.max(0, mid - 1);
        } else if (targetLeft > rangeRect.right) {
          low = mid + 1;
          textNodeIndex = Math.min(textNodes.length - 1, mid + 1);
        } else {
          textNodeIndex = mid;
          break;
        }
      }
      textNode = textNodes[textNodeIndex];
      characterIndex = 0;
      low = 0;
      high = textNode.textContent.length - 1;
      while (low <= high) {
        charIndex = low + (high - low >> 1);
        if (isPairedCharacter(textNode.textContent, charIndex)) {
          nextCharIndex = charIndex + 2;
        } else {
          nextCharIndex = charIndex + 1;
        }
        rangeRect = this.clientRectForRange(textNode, charIndex, nextCharIndex);
        if (targetLeft < rangeRect.left) {
          high = charIndex - 1;
          characterIndex = Math.max(0, charIndex - 1);
        } else if (targetLeft > rangeRect.right) {
          low = nextCharIndex;
          characterIndex = Math.min(textNode.textContent.length, nextCharIndex);
        } else {
          if (targetLeft <= ((rangeRect.left + rangeRect.right) / 2)) {
            characterIndex = charIndex;
          } else {
            characterIndex = nextCharIndex;
          }
          break;
        }
      }
      textNodeStartColumn = 0;
      for (i = j = 0, ref = textNodeIndex; j < ref; i = j += 1) {
        textNodeStartColumn += textNodes[i].length;
      }
      return Point(row, textNodeStartColumn + characterIndex);
    };

    LinesYardstick.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      var left, targetColumn, targetRow, top;
      targetRow = screenPosition.row;
      targetColumn = screenPosition.column;
      top = this.lineTopIndex.pixelPositionAfterBlocksForRow(targetRow);
      left = this.leftPixelPositionForScreenPosition(targetRow, targetColumn);
      return {
        top: top,
        left: left
      };
    };

    LinesYardstick.prototype.leftPixelPositionForScreenPosition = function(row, column) {
      var base, indexInTextNode, j, leftPixelPosition, len, lineId, lineNode, lineOffset, ref, textNode, textNodeEndColumn, textNodeStartColumn, textNodes;
      lineNode = this.lineNodesProvider.lineNodeForScreenRow(row);
      lineId = this.lineNodesProvider.lineIdForScreenRow(row);
      if (lineNode != null) {
        if (((ref = this.leftPixelPositionCache[lineId]) != null ? ref[column] : void 0) != null) {
          return this.leftPixelPositionCache[lineId][column];
        } else {
          textNodes = this.lineNodesProvider.textNodesForScreenRow(row);
          textNodeStartColumn = 0;
          for (j = 0, len = textNodes.length; j < len; j++) {
            textNode = textNodes[j];
            textNodeEndColumn = textNodeStartColumn + textNode.textContent.length;
            if (textNodeEndColumn > column) {
              indexInTextNode = column - textNodeStartColumn;
              break;
            } else {
              textNodeStartColumn = textNodeEndColumn;
            }
          }
          if (textNode != null) {
            if (indexInTextNode == null) {
              indexInTextNode = textNode.textContent.length;
            }
            lineOffset = lineNode.getBoundingClientRect().left;
            if (indexInTextNode === 0) {
              leftPixelPosition = this.clientRectForRange(textNode, 0, 1).left;
            } else {
              leftPixelPosition = this.clientRectForRange(textNode, 0, indexInTextNode).right;
            }
            leftPixelPosition -= lineOffset;
            if ((base = this.leftPixelPositionCache)[lineId] == null) {
              base[lineId] = {};
            }
            this.leftPixelPositionCache[lineId][column] = leftPixelPosition;
            return leftPixelPosition;
          } else {
            return 0;
          }
        }
      } else {
        return 0;
      }
    };

    LinesYardstick.prototype.clientRectForRange = function(textNode, startIndex, endIndex) {
      var ref;
      this.rangeForMeasurement.setStart(textNode, startIndex);
      this.rangeForMeasurement.setEnd(textNode, endIndex);
      return (ref = this.rangeForMeasurement.getClientRects()[0]) != null ? ref : this.rangeForMeasurement.getBoundingClientRect();
    };

    return LinesYardstick;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9saW5lcy15YXJkc3RpY2suY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxhQUFSOztFQUNULG9CQUFxQixPQUFBLENBQVEsY0FBUjs7RUFFdEIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHdCQUFDLEtBQUQsRUFBUyxpQkFBVCxFQUE2QixZQUE3QjtNQUFDLElBQUMsQ0FBQSxRQUFEO01BQVEsSUFBQyxDQUFBLG9CQUFEO01BQW9CLElBQUMsQ0FBQSxlQUFEO01BQ3hDLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixRQUFRLENBQUMsV0FBVCxDQUFBO01BQ3ZCLElBQUMsQ0FBQSxlQUFELENBQUE7SUFGVzs7NkJBSWIsZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLHNCQUFELEdBQTBCO0lBRFg7OzZCQUdqQiwyQkFBQSxHQUE2QixTQUFDLGFBQUQ7QUFDM0IsVUFBQTtNQUFBLFNBQUEsR0FBWSxhQUFhLENBQUM7TUFDMUIsR0FBQSxHQUFNLElBQUksQ0FBQyxLQUFMLENBQVcsU0FBQSxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMscUJBQVAsQ0FBQSxDQUF2QjtNQUNOLElBQU8sQ0FBQSxJQUFLLEdBQVo7ZUFBQSxJQUFBOztJQUgyQjs7NkJBSzdCLDhCQUFBLEdBQWdDLFNBQUMsYUFBRDtBQUM5QixVQUFBO01BQUEsU0FBQSxHQUFZLGFBQWEsQ0FBQztNQUMxQixHQUFBLEdBQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksSUFBQyxDQUFBLFlBQVksQ0FBQyxtQkFBZCxDQUFrQyxTQUFsQyxDQUFaO01BQ04sUUFBQSxHQUFXLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxvQkFBbkIsQ0FBd0MsR0FBeEM7TUFD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QUFBLE1BQUE7Y0FJRSxtQkFBQSxHQUFzQixrQkFKeEI7O0FBRkY7VUFRQSxJQUFHLGdCQUFIOztjQUNFLGtCQUFtQixRQUFRLENBQUMsV0FBVyxDQUFDOztZQUN4QyxVQUFBLEdBQWEsUUFBUSxDQUFDLHFCQUFULENBQUEsQ0FBZ0MsQ0FBQztZQUM5QyxJQUFHLGVBQUEsS0FBbUIsQ0FBdEI7Y0FDRSxpQkFBQSxHQUFvQixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsUUFBcEIsRUFBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsQ0FBbUMsQ0FBQyxLQUQxRDthQUFBLE1BQUE7Y0FHRSxpQkFBQSxHQUFvQixJQUFDLENBQUEsa0JBQUQsQ0FBb0IsUUFBcEIsRUFBOEIsQ0FBOUIsRUFBaUMsZUFBakMsQ0FBaUQsQ0FBQyxNQUh4RTs7WUFJQSxpQkFBQSxJQUFxQjs7a0JBRUcsQ0FBQSxNQUFBLElBQVc7O1lBQ25DLElBQUMsQ0FBQSxzQkFBdUIsQ0FBQSxNQUFBLENBQVEsQ0FBQSxNQUFBLENBQWhDLEdBQTBDO21CQUMxQyxrQkFYRjtXQUFBLE1BQUE7bUJBYUUsRUFiRjtXQWJGO1NBREY7T0FBQSxNQUFBO2VBNkJFLEVBN0JGOztJQUprQzs7NkJBbUNwQyxrQkFBQSxHQUFvQixTQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCLFFBQXZCO0FBQ2xCLFVBQUE7TUFBQSxJQUFDLENBQUEsbUJBQW1CLENBQUMsUUFBckIsQ0FBOEIsUUFBOUIsRUFBd0MsVUFBeEM7TUFDQSxJQUFDLENBQUEsbUJBQW1CLENBQUMsTUFBckIsQ0FBNEIsUUFBNUIsRUFBc0MsUUFBdEM7a0ZBQzJDLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxxQkFBckIsQ0FBQTtJQUh6Qjs7Ozs7QUE3SHRCIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50fSA9IHJlcXVpcmUgJ3RleHQtYnVmZmVyJ1xue2lzUGFpcmVkQ2hhcmFjdGVyfSA9IHJlcXVpcmUgJy4vdGV4dC11dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgTGluZXNZYXJkc3RpY2tcbiAgY29uc3RydWN0b3I6IChAbW9kZWwsIEBsaW5lTm9kZXNQcm92aWRlciwgQGxpbmVUb3BJbmRleCkgLT5cbiAgICBAcmFuZ2VGb3JNZWFzdXJlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKClcbiAgICBAaW52YWxpZGF0ZUNhY2hlKClcblxuICBpbnZhbGlkYXRlQ2FjaGU6IC0+XG4gICAgQGxlZnRQaXhlbFBvc2l0aW9uQ2FjaGUgPSB7fVxuXG4gIG1lYXN1cmVkUm93Rm9yUGl4ZWxQb3NpdGlvbjogKHBpeGVsUG9zaXRpb24pIC0+XG4gICAgdGFyZ2V0VG9wID0gcGl4ZWxQb3NpdGlvbi50b3BcbiAgICByb3cgPSBNYXRoLmZsb29yKHRhcmdldFRvcCAvIEBtb2RlbC5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSlcbiAgICByb3cgaWYgMCA8PSByb3dcblxuICBzY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb246IChwaXhlbFBvc2l0aW9uKSAtPlxuICAgIHRhcmdldFRvcCA9IHBpeGVsUG9zaXRpb24udG9wXG4gICAgcm93ID0gTWF0aC5tYXgoMCwgQGxpbmVUb3BJbmRleC5yb3dGb3JQaXhlbFBvc2l0aW9uKHRhcmdldFRvcCkpXG4gICAgbGluZU5vZGUgPSBAbGluZU5vZGVzUHJvdmlkZXIubGluZU5vZGVGb3JTY3JlZW5Sb3cocm93KVxuICAgIHVubGVzcyBsaW5lTm9kZVxuICAgICAgbGFzdFNjcmVlblJvdyA9IEBtb2RlbC5nZXRMYXN0U2NyZWVuUm93KClcbiAgICAgIGlmIHJvdyA+IGxhc3RTY3JlZW5Sb3dcbiAgICAgICAgcmV0dXJuIFBvaW50KGxhc3RTY3JlZW5Sb3csIEBtb2RlbC5saW5lTGVuZ3RoRm9yU2NyZWVuUm93KGxhc3RTY3JlZW5Sb3cpKVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gUG9pbnQocm93LCAwKVxuXG4gICAgdGFyZ2V0TGVmdCA9IHBpeGVsUG9zaXRpb24ubGVmdFxuICAgIHRhcmdldExlZnQgPSAwIGlmIHRhcmdldFRvcCA8IDAgb3IgdGFyZ2V0TGVmdCA8IDBcblxuICAgIHRleHROb2RlcyA9IEBsaW5lTm9kZXNQcm92aWRlci50ZXh0Tm9kZXNGb3JTY3JlZW5Sb3cocm93KVxuICAgIGxpbmVPZmZzZXQgPSBsaW5lTm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0XG4gICAgdGFyZ2V0TGVmdCArPSBsaW5lT2Zmc2V0XG5cbiAgICB0ZXh0Tm9kZUluZGV4ID0gMFxuICAgIGxvdyA9IDBcbiAgICBoaWdoID0gdGV4dE5vZGVzLmxlbmd0aCAtIDFcbiAgICB3aGlsZSBsb3cgPD0gaGlnaFxuICAgICAgbWlkID0gbG93ICsgKGhpZ2ggLSBsb3cgPj4gMSlcbiAgICAgIHRleHROb2RlID0gdGV4dE5vZGVzW21pZF1cbiAgICAgIHJhbmdlUmVjdCA9IEBjbGllbnRSZWN0Rm9yUmFuZ2UodGV4dE5vZGUsIDAsIHRleHROb2RlLmxlbmd0aClcbiAgICAgIGlmIHRhcmdldExlZnQgPCByYW5nZVJlY3QubGVmdFxuICAgICAgICBoaWdoID0gbWlkIC0gMVxuICAgICAgICB0ZXh0Tm9kZUluZGV4ID0gTWF0aC5tYXgoMCwgbWlkIC0gMSlcbiAgICAgIGVsc2UgaWYgdGFyZ2V0TGVmdCA+IHJhbmdlUmVjdC5yaWdodFxuICAgICAgICBsb3cgPSBtaWQgKyAxXG4gICAgICAgIHRleHROb2RlSW5kZXggPSBNYXRoLm1pbih0ZXh0Tm9kZXMubGVuZ3RoIC0gMSwgbWlkICsgMSlcbiAgICAgIGVsc2VcbiAgICAgICAgdGV4dE5vZGVJbmRleCA9IG1pZFxuICAgICAgICBicmVha1xuXG4gICAgdGV4dE5vZGUgPSB0ZXh0Tm9kZXNbdGV4dE5vZGVJbmRleF1cbiAgICBjaGFyYWN0ZXJJbmRleCA9IDBcbiAgICBsb3cgPSAwXG4gICAgaGlnaCA9IHRleHROb2RlLnRleHRDb250ZW50Lmxlbmd0aCAtIDFcbiAgICB3aGlsZSBsb3cgPD0gaGlnaFxuICAgICAgY2hhckluZGV4ID0gbG93ICsgKGhpZ2ggLSBsb3cgPj4gMSlcbiAgICAgIGlmIGlzUGFpcmVkQ2hhcmFjdGVyKHRleHROb2RlLnRleHRDb250ZW50LCBjaGFySW5kZXgpXG4gICAgICAgIG5leHRDaGFySW5kZXggPSBjaGFySW5kZXggKyAyXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRDaGFySW5kZXggPSBjaGFySW5kZXggKyAxXG5cbiAgICAgIHJhbmdlUmVjdCA9IEBjbGllbnRSZWN0Rm9yUmFuZ2UodGV4dE5vZGUsIGNoYXJJbmRleCwgbmV4dENoYXJJbmRleClcbiAgICAgIGlmIHRhcmdldExlZnQgPCByYW5nZVJlY3QubGVmdFxuICAgICAgICBoaWdoID0gY2hhckluZGV4IC0gMVxuICAgICAgICBjaGFyYWN0ZXJJbmRleCA9IE1hdGgubWF4KDAsIGNoYXJJbmRleCAtIDEpXG4gICAgICBlbHNlIGlmIHRhcmdldExlZnQgPiByYW5nZVJlY3QucmlnaHRcbiAgICAgICAgbG93ID0gbmV4dENoYXJJbmRleFxuICAgICAgICBjaGFyYWN0ZXJJbmRleCA9IE1hdGgubWluKHRleHROb2RlLnRleHRDb250ZW50Lmxlbmd0aCwgbmV4dENoYXJJbmRleClcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgdGFyZ2V0TGVmdCA8PSAoKHJhbmdlUmVjdC5sZWZ0ICsgcmFuZ2VSZWN0LnJpZ2h0KSAvIDIpXG4gICAgICAgICAgY2hhcmFjdGVySW5kZXggPSBjaGFySW5kZXhcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNoYXJhY3RlckluZGV4ID0gbmV4dENoYXJJbmRleFxuICAgICAgICBicmVha1xuXG4gICAgdGV4dE5vZGVTdGFydENvbHVtbiA9IDBcbiAgICB0ZXh0Tm9kZVN0YXJ0Q29sdW1uICs9IHRleHROb2Rlc1tpXS5sZW5ndGggZm9yIGkgaW4gWzAuLi50ZXh0Tm9kZUluZGV4XSBieSAxXG4gICAgUG9pbnQocm93LCB0ZXh0Tm9kZVN0YXJ0Q29sdW1uICsgY2hhcmFjdGVySW5kZXgpXG5cbiAgcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24pIC0+XG4gICAgdGFyZ2V0Um93ID0gc2NyZWVuUG9zaXRpb24ucm93XG4gICAgdGFyZ2V0Q29sdW1uID0gc2NyZWVuUG9zaXRpb24uY29sdW1uXG5cbiAgICB0b3AgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyh0YXJnZXRSb3cpXG4gICAgbGVmdCA9IEBsZWZ0UGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHRhcmdldFJvdywgdGFyZ2V0Q29sdW1uKVxuXG4gICAge3RvcCwgbGVmdH1cblxuICBsZWZ0UGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAocm93LCBjb2x1bW4pIC0+XG4gICAgbGluZU5vZGUgPSBAbGluZU5vZGVzUHJvdmlkZXIubGluZU5vZGVGb3JTY3JlZW5Sb3cocm93KVxuICAgIGxpbmVJZCA9IEBsaW5lTm9kZXNQcm92aWRlci5saW5lSWRGb3JTY3JlZW5Sb3cocm93KVxuXG4gICAgaWYgbGluZU5vZGU/XG4gICAgICBpZiBAbGVmdFBpeGVsUG9zaXRpb25DYWNoZVtsaW5lSWRdP1tjb2x1bW5dP1xuICAgICAgICBAbGVmdFBpeGVsUG9zaXRpb25DYWNoZVtsaW5lSWRdW2NvbHVtbl1cbiAgICAgIGVsc2VcbiAgICAgICAgdGV4dE5vZGVzID0gQGxpbmVOb2Rlc1Byb3ZpZGVyLnRleHROb2Rlc0ZvclNjcmVlblJvdyhyb3cpXG4gICAgICAgIHRleHROb2RlU3RhcnRDb2x1bW4gPSAwXG4gICAgICAgIGZvciB0ZXh0Tm9kZSBpbiB0ZXh0Tm9kZXNcbiAgICAgICAgICB0ZXh0Tm9kZUVuZENvbHVtbiA9IHRleHROb2RlU3RhcnRDb2x1bW4gKyB0ZXh0Tm9kZS50ZXh0Q29udGVudC5sZW5ndGhcbiAgICAgICAgICBpZiB0ZXh0Tm9kZUVuZENvbHVtbiA+IGNvbHVtblxuICAgICAgICAgICAgaW5kZXhJblRleHROb2RlID0gY29sdW1uIC0gdGV4dE5vZGVTdGFydENvbHVtblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0ZXh0Tm9kZVN0YXJ0Q29sdW1uID0gdGV4dE5vZGVFbmRDb2x1bW5cblxuICAgICAgICBpZiB0ZXh0Tm9kZT9cbiAgICAgICAgICBpbmRleEluVGV4dE5vZGUgPz0gdGV4dE5vZGUudGV4dENvbnRlbnQubGVuZ3RoXG4gICAgICAgICAgbGluZU9mZnNldCA9IGxpbmVOb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnRcbiAgICAgICAgICBpZiBpbmRleEluVGV4dE5vZGUgaXMgMFxuICAgICAgICAgICAgbGVmdFBpeGVsUG9zaXRpb24gPSBAY2xpZW50UmVjdEZvclJhbmdlKHRleHROb2RlLCAwLCAxKS5sZWZ0XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGVmdFBpeGVsUG9zaXRpb24gPSBAY2xpZW50UmVjdEZvclJhbmdlKHRleHROb2RlLCAwLCBpbmRleEluVGV4dE5vZGUpLnJpZ2h0XG4gICAgICAgICAgbGVmdFBpeGVsUG9zaXRpb24gLT0gbGluZU9mZnNldFxuXG4gICAgICAgICAgQGxlZnRQaXhlbFBvc2l0aW9uQ2FjaGVbbGluZUlkXSA/PSB7fVxuICAgICAgICAgIEBsZWZ0UGl4ZWxQb3NpdGlvbkNhY2hlW2xpbmVJZF1bY29sdW1uXSA9IGxlZnRQaXhlbFBvc2l0aW9uXG4gICAgICAgICAgbGVmdFBpeGVsUG9zaXRpb25cbiAgICAgICAgZWxzZVxuICAgICAgICAgIDBcbiAgICBlbHNlXG4gICAgICAwXG5cbiAgY2xpZW50UmVjdEZvclJhbmdlOiAodGV4dE5vZGUsIHN0YXJ0SW5kZXgsIGVuZEluZGV4KSAtPlxuICAgIEByYW5nZUZvck1lYXN1cmVtZW50LnNldFN0YXJ0KHRleHROb2RlLCBzdGFydEluZGV4KVxuICAgIEByYW5nZUZvck1lYXN1cmVtZW50LnNldEVuZCh0ZXh0Tm9kZSwgZW5kSW5kZXgpXG4gICAgQHJhbmdlRm9yTWVhc3VyZW1lbnQuZ2V0Q2xpZW50UmVjdHMoKVswXSA/IEByYW5nZUZvck1lYXN1cmVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4iXX0=
