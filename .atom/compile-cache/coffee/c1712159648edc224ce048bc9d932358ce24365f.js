(function() {
  var AdjustIndentation, Autoindent, Indent, Operator, Outdent, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  Operator = require('./general-operators').Operator;

  AdjustIndentation = (function(superClass) {
    extend(AdjustIndentation, superClass);

    function AdjustIndentation() {
      return AdjustIndentation.__super__.constructor.apply(this, arguments);
    }

    AdjustIndentation.prototype.execute = function(count) {
      var i, len, mode, originalRanges, range;
      mode = this.vimState.mode;
      this.motion.select(count);
      originalRanges = this.editor.getSelectedBufferRanges();
      if (mode === 'visual') {
        this.editor.transact((function(_this) {
          return function() {
            return _.times(count != null ? count : 1, function() {
              return _this.indent();
            });
          };
        })(this));
      } else {
        this.indent();
      }
      this.editor.clearSelections();
      this.editor.getLastCursor().setBufferPosition([originalRanges.shift().start.row, 0]);
      for (i = 0, len = originalRanges.length; i < len; i++) {
        range = originalRanges[i];
        this.editor.addCursorAtBufferPosition([range.start.row, 0]);
      }
      this.editor.moveToFirstCharacterOfLine();
      return this.vimState.activateNormalMode();
    };

    return AdjustIndentation;

  })(Operator);

  Indent = (function(superClass) {
    extend(Indent, superClass);

    function Indent() {
      return Indent.__super__.constructor.apply(this, arguments);
    }

    Indent.prototype.indent = function() {
      return this.editor.indentSelectedRows();
    };

    return Indent;

  })(AdjustIndentation);

  Outdent = (function(superClass) {
    extend(Outdent, superClass);

    function Outdent() {
      return Outdent.__super__.constructor.apply(this, arguments);
    }

    Outdent.prototype.indent = function() {
      return this.editor.outdentSelectedRows();
    };

    return Outdent;

  })(AdjustIndentation);

  Autoindent = (function(superClass) {
    extend(Autoindent, superClass);

    function Autoindent() {
      return Autoindent.__super__.constructor.apply(this, arguments);
    }

    Autoindent.prototype.indent = function() {
      return this.editor.autoIndentSelectedRows();
    };

    return Autoindent;

  })(AdjustIndentation);

  module.exports = {
    Indent: Indent,
    Outdent: Outdent,
    Autoindent: Autoindent
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvb3BlcmF0b3JzL2luZGVudC1vcGVyYXRvcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyREFBQTtJQUFBOzs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILFdBQVksT0FBQSxDQUFRLHFCQUFSOztFQUVQOzs7Ozs7O2dDQUNKLE9BQUEsR0FBUyxTQUFDLEtBQUQ7QUFDUCxVQUFBO01BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFRLENBQUM7TUFDakIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQWUsS0FBZjtNQUNBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBO01BRWpCLElBQUcsSUFBQSxLQUFRLFFBQVg7UUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDZixDQUFDLENBQUMsS0FBRixpQkFBUSxRQUFRLENBQWhCLEVBQW1CLFNBQUE7cUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBQTtZQUFILENBQW5CO1VBRGU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLEVBREY7T0FBQSxNQUFBO1FBSUUsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQUpGOztNQU1BLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUFBO01BQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBdUIsQ0FBQyxpQkFBeEIsQ0FBMEMsQ0FBQyxjQUFjLENBQUMsS0FBZixDQUFBLENBQXNCLENBQUMsS0FBSyxDQUFDLEdBQTlCLEVBQW1DLENBQW5DLENBQTFDO0FBQ0EsV0FBQSxnREFBQTs7UUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLHlCQUFSLENBQWtDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFiLEVBQWtCLENBQWxCLENBQWxDO0FBREY7TUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFWLENBQUE7SUFoQk87Ozs7S0FEcUI7O0VBbUIxQjs7Ozs7OztxQkFDSixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBQTtJQURNOzs7O0tBRFc7O0VBSWY7Ozs7Ozs7c0JBQ0osTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLENBQUE7SUFETTs7OztLQURZOztFQUloQjs7Ozs7Ozt5QkFDSixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsc0JBQVIsQ0FBQTtJQURNOzs7O0tBRGU7O0VBSXpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQUMsUUFBQSxNQUFEO0lBQVMsU0FBQSxPQUFUO0lBQWtCLFlBQUEsVUFBbEI7O0FBbENqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57T3BlcmF0b3J9ID0gcmVxdWlyZSAnLi9nZW5lcmFsLW9wZXJhdG9ycydcblxuY2xhc3MgQWRqdXN0SW5kZW50YXRpb24gZXh0ZW5kcyBPcGVyYXRvclxuICBleGVjdXRlOiAoY291bnQpIC0+XG4gICAgbW9kZSA9IEB2aW1TdGF0ZS5tb2RlXG4gICAgQG1vdGlvbi5zZWxlY3QoY291bnQpXG4gICAgb3JpZ2luYWxSYW5nZXMgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcblxuICAgIGlmIG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgICAgXy50aW1lcyhjb3VudCA/IDEsID0+IEBpbmRlbnQoKSlcbiAgICBlbHNlXG4gICAgICBAaW5kZW50KClcblxuICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcbiAgICBAZWRpdG9yLmdldExhc3RDdXJzb3IoKS5zZXRCdWZmZXJQb3NpdGlvbihbb3JpZ2luYWxSYW5nZXMuc2hpZnQoKS5zdGFydC5yb3csIDBdKVxuICAgIGZvciByYW5nZSBpbiBvcmlnaW5hbFJhbmdlc1xuICAgICAgQGVkaXRvci5hZGRDdXJzb3JBdEJ1ZmZlclBvc2l0aW9uKFtyYW5nZS5zdGFydC5yb3csIDBdKVxuICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZU5vcm1hbE1vZGUoKVxuXG5jbGFzcyBJbmRlbnQgZXh0ZW5kcyBBZGp1c3RJbmRlbnRhdGlvblxuICBpbmRlbnQ6IC0+XG4gICAgQGVkaXRvci5pbmRlbnRTZWxlY3RlZFJvd3MoKVxuXG5jbGFzcyBPdXRkZW50IGV4dGVuZHMgQWRqdXN0SW5kZW50YXRpb25cbiAgaW5kZW50OiAtPlxuICAgIEBlZGl0b3Iub3V0ZGVudFNlbGVjdGVkUm93cygpXG5cbmNsYXNzIEF1dG9pbmRlbnQgZXh0ZW5kcyBBZGp1c3RJbmRlbnRhdGlvblxuICBpbmRlbnQ6IC0+XG4gICAgQGVkaXRvci5hdXRvSW5kZW50U2VsZWN0ZWRSb3dzKClcblxubW9kdWxlLmV4cG9ydHMgPSB7SW5kZW50LCBPdXRkZW50LCBBdXRvaW5kZW50fVxuIl19
