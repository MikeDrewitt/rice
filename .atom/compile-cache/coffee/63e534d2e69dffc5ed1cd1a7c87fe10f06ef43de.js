(function() {
  var FakeLinesYardstick, Point, isPairedCharacter;

  Point = require('text-buffer').Point;

  isPairedCharacter = require('../src/text-utils').isPairedCharacter;

  module.exports = FakeLinesYardstick = (function() {
    function FakeLinesYardstick(model, lineTopIndex) {
      this.model = model;
      this.lineTopIndex = lineTopIndex;
      this.displayLayer = this.model.displayLayer;
      this.characterWidthsByScope = {};
    }

    FakeLinesYardstick.prototype.getScopedCharacterWidth = function(scopeNames, char) {
      return this.getScopedCharacterWidths(scopeNames)[char];
    };

    FakeLinesYardstick.prototype.getScopedCharacterWidths = function(scopeNames) {
      var i, len, scope, scopeName;
      scope = this.characterWidthsByScope;
      for (i = 0, len = scopeNames.length; i < len; i++) {
        scopeName = scopeNames[i];
        if (scope[scopeName] == null) {
          scope[scopeName] = {};
        }
        scope = scope[scopeName];
      }
      if (scope.characterWidths == null) {
        scope.characterWidths = {};
      }
      return scope.characterWidths;
    };

    FakeLinesYardstick.prototype.setScopedCharacterWidth = function(scopeNames, character, width) {
      return this.getScopedCharacterWidths(scopeNames)[character] = width;
    };

    FakeLinesYardstick.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      var char, charLength, characterWidths, column, i, left, len, lineText, ref, ref1, scopes, startIndex, tagCode, tagCodes, targetColumn, targetRow, text, top, valueIndex;
      screenPosition = Point.fromObject(screenPosition);
      targetRow = screenPosition.row;
      targetColumn = screenPosition.column;
      top = this.lineTopIndex.pixelPositionAfterBlocksForRow(targetRow);
      left = 0;
      column = 0;
      scopes = [];
      startIndex = 0;
      ref = this.model.screenLineForScreenRow(targetRow), tagCodes = ref.tagCodes, lineText = ref.lineText;
      for (i = 0, len = tagCodes.length; i < len; i++) {
        tagCode = tagCodes[i];
        if (this.displayLayer.isOpenTagCode(tagCode)) {
          scopes.push(this.displayLayer.tagForCode(tagCode));
        } else if (this.displayLayer.isCloseTagCode(tagCode)) {
          scopes.splice(scopes.lastIndexOf(this.displayLayer.tagForCode(tagCode)), 1);
        } else {
          text = lineText.substr(startIndex, tagCode);
          startIndex += tagCode;
          characterWidths = this.getScopedCharacterWidths(scopes);
          valueIndex = 0;
          while (valueIndex < text.length) {
            if (isPairedCharacter(text, valueIndex)) {
              char = text.slice(valueIndex, valueIndex + 2);
              charLength = 2;
              valueIndex += 2;
            } else {
              char = text[valueIndex];
              charLength = 1;
              valueIndex++;
            }
            if (column === targetColumn) {
              break;
            }
            if (char !== '\0') {
              left += (ref1 = characterWidths[char]) != null ? ref1 : this.model.getDefaultCharWidth();
            }
            column += charLength;
          }
        }
      }
      return {
        top: top,
        left: left
      };
    };

    return FakeLinesYardstick;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvZmFrZS1saW5lcy15YXJkc3RpY2suY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxhQUFSOztFQUNULG9CQUFxQixPQUFBLENBQVEsbUJBQVI7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyw0QkFBQyxLQUFELEVBQVMsWUFBVDtNQUFDLElBQUMsQ0FBQSxRQUFEO01BQVEsSUFBQyxDQUFBLGVBQUQ7TUFDbkIsSUFBQyxDQUFBLGVBQWdCLElBQUMsQ0FBQSxNQUFqQjtNQUNGLElBQUMsQ0FBQSxzQkFBRCxHQUEwQjtJQUZmOztpQ0FJYix1QkFBQSxHQUF5QixTQUFDLFVBQUQsRUFBYSxJQUFiO2FBQ3ZCLElBQUMsQ0FBQSx3QkFBRCxDQUEwQixVQUExQixDQUFzQyxDQUFBLElBQUE7SUFEZjs7aUNBR3pCLHdCQUFBLEdBQTBCLFNBQUMsVUFBRDtBQUN4QixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQTtBQUNULFdBQUEsNENBQUE7OztVQUNFLEtBQU0sQ0FBQSxTQUFBLElBQWM7O1FBQ3BCLEtBQUEsR0FBUSxLQUFNLENBQUEsU0FBQTtBQUZoQjs7UUFHQSxLQUFLLENBQUMsa0JBQW1COzthQUN6QixLQUFLLENBQUM7SUFOa0I7O2lDQVExQix1QkFBQSxHQUF5QixTQUFDLFVBQUQsRUFBYSxTQUFiLEVBQXdCLEtBQXhCO2FBQ3ZCLElBQUMsQ0FBQSx3QkFBRCxDQUEwQixVQUExQixDQUFzQyxDQUFBLFNBQUEsQ0FBdEMsR0FBbUQ7SUFENUI7O2lDQUd6Qiw4QkFBQSxHQUFnQyxTQUFDLGNBQUQ7QUFDOUIsVUFBQTtNQUFBLGNBQUEsR0FBaUIsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsY0FBakI7TUFFakIsU0FBQSxHQUFZLGNBQWMsQ0FBQztNQUMzQixZQUFBLEdBQWUsY0FBYyxDQUFDO01BRTlCLEdBQUEsR0FBTSxJQUFDLENBQUEsWUFBWSxDQUFDLDhCQUFkLENBQTZDLFNBQTdDO01BQ04sSUFBQSxHQUFPO01BQ1AsTUFBQSxHQUFTO01BRVQsTUFBQSxHQUFTO01BQ1QsVUFBQSxHQUFhO01BQ2IsTUFBdUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxzQkFBUCxDQUE4QixTQUE5QixDQUF2QixFQUFDLHVCQUFELEVBQVc7QUFDWCxXQUFBLDBDQUFBOztRQUNFLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxhQUFkLENBQTRCLE9BQTVCLENBQUg7VUFDRSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxZQUFZLENBQUMsVUFBZCxDQUF5QixPQUF6QixDQUFaLEVBREY7U0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLFlBQVksQ0FBQyxjQUFkLENBQTZCLE9BQTdCLENBQUg7VUFDSCxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxXQUFQLENBQW1CLElBQUMsQ0FBQSxZQUFZLENBQUMsVUFBZCxDQUF5QixPQUF6QixDQUFuQixDQUFkLEVBQXFFLENBQXJFLEVBREc7U0FBQSxNQUFBO1VBR0gsSUFBQSxHQUFPLFFBQVEsQ0FBQyxNQUFULENBQWdCLFVBQWhCLEVBQTRCLE9BQTVCO1VBQ1AsVUFBQSxJQUFjO1VBQ2QsZUFBQSxHQUFrQixJQUFDLENBQUEsd0JBQUQsQ0FBMEIsTUFBMUI7VUFFbEIsVUFBQSxHQUFhO0FBQ2IsaUJBQU0sVUFBQSxHQUFhLElBQUksQ0FBQyxNQUF4QjtZQUNFLElBQUcsaUJBQUEsQ0FBa0IsSUFBbEIsRUFBd0IsVUFBeEIsQ0FBSDtjQUNFLElBQUEsR0FBTyxJQUFLO2NBQ1osVUFBQSxHQUFhO2NBQ2IsVUFBQSxJQUFjLEVBSGhCO2FBQUEsTUFBQTtjQUtFLElBQUEsR0FBTyxJQUFLLENBQUEsVUFBQTtjQUNaLFVBQUEsR0FBYTtjQUNiLFVBQUEsR0FQRjs7WUFTQSxJQUFTLE1BQUEsS0FBVSxZQUFuQjtBQUFBLG9CQUFBOztZQUVBLElBQW9FLElBQUEsS0FBUSxJQUE1RTtjQUFBLElBQUEsb0RBQWdDLElBQUMsQ0FBQSxLQUFLLENBQUMsbUJBQVAsQ0FBQSxFQUFoQzs7WUFDQSxNQUFBLElBQVU7VUFiWixDQVJHOztBQUhQO2FBMEJBO1FBQUMsS0FBQSxHQUFEO1FBQU0sTUFBQSxJQUFOOztJQXZDOEI7Ozs7O0FBdkJsQyIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludH0gPSByZXF1aXJlICd0ZXh0LWJ1ZmZlcidcbntpc1BhaXJlZENoYXJhY3Rlcn0gPSByZXF1aXJlICcuLi9zcmMvdGV4dC11dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRmFrZUxpbmVzWWFyZHN0aWNrXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsLCBAbGluZVRvcEluZGV4KSAtPlxuICAgIHtAZGlzcGxheUxheWVyfSA9IEBtb2RlbFxuICAgIEBjaGFyYWN0ZXJXaWR0aHNCeVNjb3BlID0ge31cblxuICBnZXRTY29wZWRDaGFyYWN0ZXJXaWR0aDogKHNjb3BlTmFtZXMsIGNoYXIpIC0+XG4gICAgQGdldFNjb3BlZENoYXJhY3RlcldpZHRocyhzY29wZU5hbWVzKVtjaGFyXVxuXG4gIGdldFNjb3BlZENoYXJhY3RlcldpZHRoczogKHNjb3BlTmFtZXMpIC0+XG4gICAgc2NvcGUgPSBAY2hhcmFjdGVyV2lkdGhzQnlTY29wZVxuICAgIGZvciBzY29wZU5hbWUgaW4gc2NvcGVOYW1lc1xuICAgICAgc2NvcGVbc2NvcGVOYW1lXSA/PSB7fVxuICAgICAgc2NvcGUgPSBzY29wZVtzY29wZU5hbWVdXG4gICAgc2NvcGUuY2hhcmFjdGVyV2lkdGhzID89IHt9XG4gICAgc2NvcGUuY2hhcmFjdGVyV2lkdGhzXG5cbiAgc2V0U2NvcGVkQ2hhcmFjdGVyV2lkdGg6IChzY29wZU5hbWVzLCBjaGFyYWN0ZXIsIHdpZHRoKSAtPlxuICAgIEBnZXRTY29wZWRDaGFyYWN0ZXJXaWR0aHMoc2NvcGVOYW1lcylbY2hhcmFjdGVyXSA9IHdpZHRoXG5cbiAgcGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uOiAoc2NyZWVuUG9zaXRpb24pIC0+XG4gICAgc2NyZWVuUG9zaXRpb24gPSBQb2ludC5mcm9tT2JqZWN0KHNjcmVlblBvc2l0aW9uKVxuXG4gICAgdGFyZ2V0Um93ID0gc2NyZWVuUG9zaXRpb24ucm93XG4gICAgdGFyZ2V0Q29sdW1uID0gc2NyZWVuUG9zaXRpb24uY29sdW1uXG5cbiAgICB0b3AgPSBAbGluZVRvcEluZGV4LnBpeGVsUG9zaXRpb25BZnRlckJsb2Nrc0ZvclJvdyh0YXJnZXRSb3cpXG4gICAgbGVmdCA9IDBcbiAgICBjb2x1bW4gPSAwXG5cbiAgICBzY29wZXMgPSBbXVxuICAgIHN0YXJ0SW5kZXggPSAwXG4gICAge3RhZ0NvZGVzLCBsaW5lVGV4dH0gPSBAbW9kZWwuc2NyZWVuTGluZUZvclNjcmVlblJvdyh0YXJnZXRSb3cpXG4gICAgZm9yIHRhZ0NvZGUgaW4gdGFnQ29kZXNcbiAgICAgIGlmIEBkaXNwbGF5TGF5ZXIuaXNPcGVuVGFnQ29kZSh0YWdDb2RlKVxuICAgICAgICBzY29wZXMucHVzaChAZGlzcGxheUxheWVyLnRhZ0ZvckNvZGUodGFnQ29kZSkpXG4gICAgICBlbHNlIGlmIEBkaXNwbGF5TGF5ZXIuaXNDbG9zZVRhZ0NvZGUodGFnQ29kZSlcbiAgICAgICAgc2NvcGVzLnNwbGljZShzY29wZXMubGFzdEluZGV4T2YoQGRpc3BsYXlMYXllci50YWdGb3JDb2RlKHRhZ0NvZGUpKSwgMSlcbiAgICAgIGVsc2VcbiAgICAgICAgdGV4dCA9IGxpbmVUZXh0LnN1YnN0cihzdGFydEluZGV4LCB0YWdDb2RlKVxuICAgICAgICBzdGFydEluZGV4ICs9IHRhZ0NvZGVcbiAgICAgICAgY2hhcmFjdGVyV2lkdGhzID0gQGdldFNjb3BlZENoYXJhY3RlcldpZHRocyhzY29wZXMpXG5cbiAgICAgICAgdmFsdWVJbmRleCA9IDBcbiAgICAgICAgd2hpbGUgdmFsdWVJbmRleCA8IHRleHQubGVuZ3RoXG4gICAgICAgICAgaWYgaXNQYWlyZWRDaGFyYWN0ZXIodGV4dCwgdmFsdWVJbmRleClcbiAgICAgICAgICAgIGNoYXIgPSB0ZXh0W3ZhbHVlSW5kZXguLi52YWx1ZUluZGV4ICsgMl1cbiAgICAgICAgICAgIGNoYXJMZW5ndGggPSAyXG4gICAgICAgICAgICB2YWx1ZUluZGV4ICs9IDJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjaGFyID0gdGV4dFt2YWx1ZUluZGV4XVxuICAgICAgICAgICAgY2hhckxlbmd0aCA9IDFcbiAgICAgICAgICAgIHZhbHVlSW5kZXgrK1xuXG4gICAgICAgICAgYnJlYWsgaWYgY29sdW1uIGlzIHRhcmdldENvbHVtblxuXG4gICAgICAgICAgbGVmdCArPSBjaGFyYWN0ZXJXaWR0aHNbY2hhcl0gPyBAbW9kZWwuZ2V0RGVmYXVsdENoYXJXaWR0aCgpIHVubGVzcyBjaGFyIGlzICdcXDAnXG4gICAgICAgICAgY29sdW1uICs9IGNoYXJMZW5ndGhcblxuICAgIHt0b3AsIGxlZnR9XG4iXX0=
