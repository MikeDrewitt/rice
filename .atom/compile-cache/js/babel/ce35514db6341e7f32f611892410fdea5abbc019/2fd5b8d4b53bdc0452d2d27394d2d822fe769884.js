Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var ParsedColor = null;

// Essential: A simple color class returned from {Config::get} when the value
// at the key path is of type 'color'.

var Color = (function () {
  _createClass(Color, null, [{
    key: 'parse',

    // Essential: Parse a {String} or {Object} into a {Color}.
    //
    // * `value` A {String} such as `'white'`, `#ff00ff`, or
    //   `'rgba(255, 15, 60, .75)'` or an {Object} with `red`, `green`, `blue`,
    //   and `alpha` properties.
    //
    // Returns a {Color} or `null` if it cannot be parsed.
    value: function parse(value) {
      switch (typeof value) {
        case 'string':
          break;
        case 'object':
          if (Array.isArray(value)) {
            return null;
          }
          break;
        default:
          return null;
      }

      if (!ParsedColor) {
        ParsedColor = require('color');
      }

      try {
        var parsedColor = new ParsedColor(value);
      } catch (error) {
        return null;
      }

      return new Color(parsedColor.red(), parsedColor.green(), parsedColor.blue(), parsedColor.alpha());
    }
  }]);

  function Color(red, green, blue, alpha) {
    _classCallCheck(this, Color);

    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  _createClass(Color, [{
    key: 'toHexString',

    // Essential: Returns a {String} in the form `'#abcdef'`.
    value: function toHexString() {
      return '#' + numberToHexString(this.red) + numberToHexString(this.green) + numberToHexString(this.blue);
    }

    // Essential: Returns a {String} in the form `'rgba(25, 50, 75, .9)'`.
  }, {
    key: 'toRGBAString',
    value: function toRGBAString() {
      return 'rgba(' + this.red + ', ' + this.green + ', ' + this.blue + ', ' + this.alpha + ')';
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.alpha === 1 ? this.toHexString() : this.toRGBAString();
    }
  }, {
    key: 'isEqual',
    value: function isEqual(color) {
      if (this === color) {
        return true;
      }

      if (!(color instanceof Color)) {
        color = Color.parse(color);
      }

      if (color == null) {
        return false;
      }

      return color.red === this.red && color.blue === this.blue && color.green === this.green && color.alpha === this.alpha;
    }
  }, {
    key: 'clone',
    value: function clone() {
      return new Color(this.red, this.green, this.blue, this.alpha);
    }
  }, {
    key: 'red',
    set: function set(red) {
      this._red = parseColor(red);
    },
    get: function get() {
      return this._red;
    }
  }, {
    key: 'green',
    set: function set(green) {
      this._green = parseColor(green);
    },
    get: function get() {
      return this._green;
    }
  }, {
    key: 'blue',
    set: function set(blue) {
      this._blue = parseColor(blue);
    },
    get: function get() {
      return this._blue;
    }
  }, {
    key: 'alpha',
    set: function set(alpha) {
      this._alpha = parseAlpha(alpha);
    },
    get: function get() {
      return this._alpha;
    }
  }]);

  return Color;
})();

exports['default'] = Color;

function parseColor(colorString) {
  var color = parseInt(colorString, 10);
  if (isNaN(color)) {
    return 0;
  } else {
    return Math.min(Math.max(color, 0), 255);
  }
}

function parseAlpha(alphaString) {
  var alpha = parseFloat(alphaString);
  if (isNaN(alpha)) {
    return 1;
  } else {
    return Math.min(Math.max(alpha, 0), 1);
  }
}

function numberToHexString(number) {
  var hex = number.toString(16);
  if (number < 16) {
    return '0' + hex;
  } else {
    return hex;
  }
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvY29sb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVBLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQTs7Ozs7SUFJRCxLQUFLO2VBQUwsS0FBSzs7Ozs7Ozs7OztXQVFYLGVBQUMsS0FBSyxFQUFFO0FBQ25CLGNBQVEsT0FBTyxLQUFLO0FBQ2xCLGFBQUssUUFBUTtBQUNYLGdCQUFLO0FBQUEsQUFDUCxhQUFLLFFBQVE7QUFDWCxjQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFBRSxtQkFBTyxJQUFJLENBQUE7V0FBRTtBQUN6QyxnQkFBSztBQUFBLEFBQ1A7QUFDRSxpQkFBTyxJQUFJLENBQUE7QUFBQSxPQUNkOztBQUVELFVBQUksQ0FBQyxXQUFXLEVBQUU7QUFDaEIsbUJBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7T0FDL0I7O0FBRUQsVUFBSTtBQUNGLFlBQUksV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO09BQ3pDLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDZCxlQUFPLElBQUksQ0FBQTtPQUNaOztBQUVELGFBQU8sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUE7S0FDbEc7OztBQUVXLFdBaENPLEtBQUssQ0FnQ1gsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFOzBCQWhDbkIsS0FBSzs7QUFpQ3RCLFFBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO0FBQ2QsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7QUFDbEIsUUFBSSxDQUFDLElB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QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDckMsTUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDaEIsV0FBTyxDQUFDLENBQUE7R0FDVCxNQUFNO0FBQ0wsV0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0dBQ3ZDO0NBQ0Y7O0FBRUQsU0FBUyxpQkFBaUIsQ0FBRSxNQUFNLEVBQUU7QUFDbEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMvQixNQUFJLE1BQU0sR0FBRyxFQUFFLEVBQUU7QUFDZixpQkFBVyxHQUFHLENBQUU7R0FDakIsTUFBTTtBQUNMLFdBQU8sR0FBRyxDQUFBO0dBQ1g7Q0FDRiIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvc3JjL2NvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5sZXQgUGFyc2VkQ29sb3IgPSBudWxsXG5cbi8vIEVzc2VudGlhbDogQSBzaW1wbGUgY29sb3IgY2xhc3MgcmV0dXJuZWQgZnJvbSB7Q29uZmlnOjpnZXR9IHdoZW4gdGhlIHZhbHVlXG4vLyBhdCB0aGUga2V5IHBhdGggaXMgb2YgdHlwZSAnY29sb3InLlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29sb3Ige1xuICAvLyBFc3NlbnRpYWw6IFBhcnNlIGEge1N0cmluZ30gb3Ige09iamVjdH0gaW50byBhIHtDb2xvcn0uXG4gIC8vXG4gIC8vICogYHZhbHVlYCBBIHtTdHJpbmd9IHN1Y2ggYXMgYCd3aGl0ZSdgLCBgI2ZmMDBmZmAsIG9yXG4gIC8vICAgYCdyZ2JhKDI1NSwgMTUsIDYwLCAuNzUpJ2Agb3IgYW4ge09iamVjdH0gd2l0aCBgcmVkYCwgYGdyZWVuYCwgYGJsdWVgLFxuICAvLyAgIGFuZCBgYWxwaGFgIHByb3BlcnRpZXMuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7Q29sb3J9IG9yIGBudWxsYCBpZiBpdCBjYW5ub3QgYmUgcGFyc2VkLlxuICBzdGF0aWMgcGFyc2UgKHZhbHVlKSB7XG4gICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHsgcmV0dXJuIG51bGwgfVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBpZiAoIVBhcnNlZENvbG9yKSB7XG4gICAgICBQYXJzZWRDb2xvciA9IHJlcXVpcmUoJ2NvbG9yJylcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZENvbG9yID0gbmV3IFBhcnNlZENvbG9yKHZhbHVlKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIHJldHVybiBuZXcgQ29sb3IocGFyc2VkQ29sb3IucmVkKCksIHBhcnNlZENvbG9yLmdyZWVuKCksIHBhcnNlZENvbG9yLmJsdWUoKSwgcGFyc2VkQ29sb3IuYWxwaGEoKSlcbiAgfVxuXG4gIGNvbnN0cnVjdG9yIChyZWQsIGdyZWVuLCBibHVlLCBhbHBoYSkge1xuICAgIHRoaXMucmVkID0gcmVkXG4gICAgdGhpcy5ncmVlbiA9IGdyZWVuXG4gICAgdGhpcy5ibHVlID0gYmx1ZVxuICAgIHRoaXMuYWxwaGEgPSBhbHBoYVxuICB9XG5cbiAgc2V0IHJlZCAocmVkKSB7XG4gICAgdGhpcy5fcmVkID0gcGFyc2VDb2xvcihyZWQpXG4gIH1cblxuICBzZXQgZ3JlZW4gKGdyZWVuKSB7XG4gICAgdGhpcy5fZ3JlZW4gPSBwYXJzZUNvbG9yKGdyZWVuKVxuICB9XG5cbiAgc2V0IGJsdWUgKGJsdWUpIHtcbiAgICB0aGlzLl9ibHVlID0gcGFyc2VDb2xvcihibHVlKVxuICB9XG5cbiAgc2V0IGFscGhhIChhbHBoYSkge1xuICAgIHRoaXMuX2FscGhhID0gcGFyc2VBbHBoYShhbHBoYSlcbiAgfVxuXG4gIGdldCByZWQgKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWRcbiAgfVxuXG4gIGdldCBncmVlbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dyZWVuXG4gIH1cblxuICBnZXQgYmx1ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JsdWVcbiAgfVxuXG4gIGdldCBhbHBoYSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FscGhhXG4gIH1cblxuICAvLyBFc3NlbnRpYWw6IFJldHVybnMgYSB7U3RyaW5nfSBpbiB0aGUgZm9ybSBgJyNhYmNkZWYnYC5cbiAgdG9IZXhTdHJpbmcgKCkge1xuICAgIHJldHVybiBgIyR7bnVtYmVyVG9IZXhTdHJpbmcodGhpcy5yZWQpfSR7bnVtYmVyVG9IZXhTdHJpbmcodGhpcy5ncmVlbil9JHtudW1iZXJUb0hleFN0cmluZyh0aGlzLmJsdWUpfWBcbiAgfVxuXG4gIC8vIEVzc2VudGlhbDogUmV0dXJucyBhIHtTdHJpbmd9IGluIHRoZSBmb3JtIGAncmdiYSgyNSwgNTAsIDc1LCAuOSknYC5cbiAgdG9SR0JBU3RyaW5nICgpIHtcbiAgICByZXR1cm4gYHJnYmEoJHt0aGlzLnJlZH0sICR7dGhpcy5ncmVlbn0sICR7dGhpcy5ibHVlfSwgJHt0aGlzLmFscGhhfSlgXG4gIH1cblxuICB0b0pTT04gKCkge1xuICAgIHJldHVybiB0aGlzLmFscGhhID09PSAxID8gdGhpcy50b0hleFN0cmluZygpIDogdGhpcy50b1JHQkFTdHJpbmcoKVxuICB9XG5cbiAgaXNFcXVhbCAoY29sb3IpIHtcbiAgICBpZiAodGhpcyA9PT0gY29sb3IpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgaWYgKCEoY29sb3IgaW5zdGFuY2VvZiBDb2xvcikpIHtcbiAgICAgIGNvbG9yID0gQ29sb3IucGFyc2UoY29sb3IpXG4gICAgfVxuXG4gICAgaWYgKGNvbG9yID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBjb2xvci5yZWQgPT09IHRoaXMucmVkICYmIGNvbG9yLmJsdWUgPT09IHRoaXMuYmx1ZSAmJiBjb2xvci5ncmVlbiA9PT0gdGhpcy5ncmVlbiAmJiBjb2xvci5hbHBoYSA9PT0gdGhpcy5hbHBoYVxuICB9XG5cbiAgY2xvbmUgKCkge1xuICAgIHJldHVybiBuZXcgQ29sb3IodGhpcy5yZWQsIHRoaXMuZ3JlZW4sIHRoaXMuYmx1ZSwgdGhpcy5hbHBoYSlcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUNvbG9yIChjb2xvclN0cmluZykge1xuICBjb25zdCBjb2xvciA9IHBhcnNlSW50KGNvbG9yU3RyaW5nLCAxMClcbiAgaWYgKGlzTmFOKGNvbG9yKSkge1xuICAgIHJldHVybiAwXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KGNvbG9yLCAwKSwgMjU1KVxuICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlQWxwaGEgKGFscGhhU3RyaW5nKSB7XG4gIGNvbnN0IGFscGhhID0gcGFyc2VGbG9hdChhbHBoYVN0cmluZylcbiAgaWYgKGlzTmFOKGFscGhhKSkge1xuICAgIHJldHVybiAxXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KGFscGhhLCAwKSwgMSlcbiAgfVxufVxuXG5mdW5jdGlvbiBudW1iZXJUb0hleFN0cmluZyAobnVtYmVyKSB7XG4gIGNvbnN0IGhleCA9IG51bWJlci50b1N0cmluZygxNilcbiAgaWYgKG51bWJlciA8IDE2KSB7XG4gICAgcmV0dXJuIGAwJHtoZXh9YFxuICB9IGVsc2Uge1xuICAgIHJldHVybiBoZXhcbiAgfVxufVxuIl19