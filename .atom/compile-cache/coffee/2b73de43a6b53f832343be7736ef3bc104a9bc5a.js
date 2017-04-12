(function() {
  var Hover, HoverElement, emoji, emojiFolder, registerElement, settings, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  emoji = require('emoji-images');

  emojiFolder = 'atom://vim-mode-plus/node_modules/emoji-images/pngs';

  registerElement = require('./utils').registerElement;

  settings = require('./settings');

  swrap = require('./selection-wrapper');

  Hover = (function(superClass) {
    extend(Hover, superClass);

    function Hover() {
      return Hover.__super__.constructor.apply(this, arguments);
    }

    Hover.prototype.createdCallback = function() {
      this.className = 'vim-mode-plus-hover';
      this.text = [];
      return this;
    };

    Hover.prototype.initialize = function(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement;
      return this;
    };

    Hover.prototype.getPoint = function() {
      var ref;
      if (this.vimState.isMode('visual', 'blockwise')) {
        return (ref = this.vimState.getLastBlockwiseSelection()) != null ? ref.getHeadSelection().getHeadBufferPosition() : void 0;
      } else {
        return swrap(this.editor.getLastSelection()).getBufferPositionFor('head', {
          fromProperty: true,
          allowFallback: true
        });
      }
    };

    Hover.prototype.add = function(text, point) {
      if (point == null) {
        point = this.getPoint();
      }
      this.text.push(text);
      return this.show(point);
    };

    Hover.prototype.replaceLastSection = function(text, point) {
      this.text.pop();
      return this.add(text);
    };

    Hover.prototype.convertText = function(text, lineHeight) {
      text = String(text);
      if (settings.get('showHoverOnOperateIcon') === 'emoji') {
        return emoji(text, emojiFolder, lineHeight);
      } else {
        return text.replace(/:(.*?):/g, function(s, m) {
          return "<span class='icon icon-" + m + "'></span>";
        });
      }
    };

    Hover.prototype.show = function(point) {
      if (this.marker == null) {
        this.marker = this.createOverlay(point);
        this.lineHeight = this.editor.getLineHeightInPixels();
        this.setIconSize(this.lineHeight);
        this.style.marginTop = (this.lineHeight * -2.2) + 'px';
      }
      if (this.text.length) {
        return this.innerHTML = this.text.map((function(_this) {
          return function(text) {
            return _this.convertText(text, _this.lineHeight);
          };
        })(this)).join('');
      }
    };

    Hover.prototype.withTimeout = function(point, options) {
      var ref;
      this.reset();
      if (options.classList.length) {
        (ref = this.classList).add.apply(ref, options.classList);
      }
      this.add(options.text, point);
      if (options.timeout != null) {
        return this.timeoutID = setTimeout((function(_this) {
          return function() {
            return _this.reset();
          };
        })(this), options.timeout);
      }
    };

    Hover.prototype.createOverlay = function(point) {
      var decoration, marker;
      marker = this.editor.markBufferPosition(point);
      decoration = this.editor.decorateMarker(marker, {
        type: 'overlay',
        item: this
      });
      return marker;
    };

    Hover.prototype.setIconSize = function(size) {
      var ref, selector, style;
      if ((ref = this.styleElement) != null) {
        ref.remove();
      }
      this.styleElement = document.createElement('style');
      document.head.appendChild(this.styleElement);
      selector = '.vim-mode-plus-hover .icon::before';
      size = (size * 0.8) + "px";
      style = "font-size: " + size + "; width: " + size + "; hegith: " + size + ";";
      return this.styleElement.sheet.addRule(selector, style);
    };

    Hover.prototype.isVisible = function() {
      return this.marker != null;
    };

    Hover.prototype.reset = function() {
      var ref, ref1, ref2;
      this.text = [];
      clearTimeout(this.timeoutID);
      this.className = 'vim-mode-plus-hover';
      this.textContent = '';
      if ((ref = this.marker) != null) {
        ref.destroy();
      }
      if ((ref1 = this.styleElement) != null) {
        ref1.remove();
      }
      return ref2 = {}, this.marker = ref2.marker, this.lineHeight = ref2.lineHeight, this.timeoutID = ref2.timeoutID, this.styleElement = ref2.styleElement, ref2;
    };

    Hover.prototype.destroy = function() {
      var ref;
      this.reset();
      ref = {}, this.vimState = ref.vimState, this.lineHeight = ref.lineHeight;
      return this.remove();
    };

    return Hover;

  })(HTMLElement);

  HoverElement = registerElement("vim-mode-plus-hover", {
    prototype: Hover.prototype
  });

  module.exports = {
    HoverElement: HoverElement
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9ob3Zlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHlFQUFBO0lBQUE7OztFQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsY0FBUjs7RUFFUixXQUFBLEdBQWM7O0VBQ2Isa0JBQW1CLE9BQUEsQ0FBUSxTQUFSOztFQUNwQixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFFRjs7Ozs7OztvQkFDSixlQUFBLEdBQWlCLFNBQUE7TUFDZixJQUFDLENBQUEsU0FBRCxHQUFhO01BQ2IsSUFBQyxDQUFBLElBQUQsR0FBUTthQUNSO0lBSGU7O29CQUtqQixVQUFBLEdBQVksU0FBQyxRQUFEO0FBQ1YsVUFBQTtNQURXLElBQUMsQ0FBQSxXQUFEO01BQ1gsTUFBNEIsSUFBQyxDQUFBLFFBQTdCLEVBQUMsSUFBQyxDQUFBLGFBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxvQkFBQTthQUNYO0lBRlU7O29CQUlaLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQWlCLFFBQWpCLEVBQTJCLFdBQTNCLENBQUg7OEVBRXVDLENBQUUsZ0JBQXZDLENBQUEsQ0FBeUQsQ0FBQyxxQkFBMUQsQ0FBQSxXQUZGO09BQUEsTUFBQTtlQUlFLEtBQUEsQ0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBTixDQUFpQyxDQUFDLG9CQUFsQyxDQUF1RCxNQUF2RCxFQUErRDtVQUFBLFlBQUEsRUFBYyxJQUFkO1VBQW9CLGFBQUEsRUFBZSxJQUFuQztTQUEvRCxFQUpGOztJQURROztvQkFPVixHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sS0FBUDs7UUFBTyxRQUFNLElBQUMsQ0FBQSxR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R0FBUyxDQUFDLElBQUEsR0FBSyxHQUFOLENBQUEsR0FBVTtNQUNuQixLQUFBLEdBQVEsYUFBQSxHQUFjLElBQWQsR0FBbUIsV0FBbkIsR0FBOEIsSUFBOUIsR0FBbUMsWUFBbkMsR0FBK0MsSUFBL0MsR0FBb0Q7YUFDNUQsSUFBQyxDQUFBLFlBQVksQ0FBQyxLQUFLLENBQUMsT0FBcEIsQ0FBNEIsUUFBNUIsRUFBc0MsS0FBdEM7SUFQVzs7b0JBU2IsU0FBQSxHQUFXLFNBQUE7YUFDVDtJQURTOztvQkFHWCxLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRO01BQ1IsWUFBQSxDQUFhLElBQUMsQ0FBQSxTQUFkO01BQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxXQUFELEdBQWU7O1dBQ1IsQ0FBRSxPQUFULENBQUE7OztZQUNhLENBQUUsTUFBZixDQUFBOzthQUNBLE9BR0ksRUFISixFQUNFLElBQUMsQ0FBQSxjQUFBLE1BREgsRUFDVyxJQUFDLENBQUEsa0JBQUEsVUFEWixFQUVFLElBQUMsQ0FBQSxpQkFBQSxTQUZILEVBRWMsSUFBQyxDQUFBLG9CQUFBLFlBRmYsRUFBQTtJQVBLOztvQkFZUCxPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBO01BQ0EsTUFBMkIsRUFBM0IsRUFBQyxJQUFDLENBQUEsZUFBQSxRQUFGLEVBQVksSUFBQyxDQUFBLGlCQUFBO2FBQ2IsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUhPOzs7O0tBdEZTOztFQTJGcEIsWUFBQSxHQUFlLGVBQUEsQ0FBZ0IscUJBQWhCLEVBQ2I7SUFBQSxTQUFBLEVBQVcsS0FBSyxDQUFDLFNBQWpCO0dBRGE7O0VBR2YsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFDZixjQUFBLFlBRGU7O0FBckdqQiIsInNvdXJjZXNDb250ZW50IjpbImVtb2ppID0gcmVxdWlyZSAnZW1vamktaW1hZ2VzJ1xuXG5lbW9qaUZvbGRlciA9ICdhdG9tOi8vdmltLW1vZGUtcGx1cy9ub2RlX21vZHVsZXMvZW1vamktaW1hZ2VzL3BuZ3MnXG57cmVnaXN0ZXJFbGVtZW50fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbmNsYXNzIEhvdmVyIGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIEBjbGFzc05hbWUgPSAndmltLW1vZGUtcGx1cy1ob3ZlcidcbiAgICBAdGV4dCA9IFtdXG4gICAgdGhpc1xuXG4gIGluaXRpYWxpemU6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIHRoaXNcblxuICBnZXRQb2ludDogLT5cbiAgICBpZiBAdmltU3RhdGUuaXNNb2RlKCd2aXN1YWwnLCAnYmxvY2t3aXNlJylcbiAgICAgICMgRklYTUUgIzE3OVxuICAgICAgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKT8uZ2V0SGVhZFNlbGVjdGlvbigpLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgZWxzZVxuICAgICAgc3dyYXAoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlLCBhbGxvd0ZhbGxiYWNrOiB0cnVlKVxuXG4gIGFkZDogKHRleHQsIHBvaW50PUBnZXRQb2ludCgpKSAtPlxuICAgIEB0ZXh0LnB1c2godGV4dClcbiAgICBAc2hvdyhwb2ludClcblxuICByZXBsYWNlTGFzdFNlY3Rpb246ICh0ZXh0LCBwb2ludCkgLT5cbiAgICBAdGV4dC5wb3AoKVxuICAgIEBhZGQodGV4dClcblxuICBjb252ZXJ0VGV4dDogKHRleHQsIGxpbmVIZWlnaHQpIC0+XG4gICAgdGV4dCA9IFN0cmluZyh0ZXh0KVxuICAgIGlmIHNldHRpbmdzLmdldCgnc2hvd0hvdmVyT25PcGVyYXRlSWNvbicpIGlzICdlbW9qaSdcbiAgICAgIGVtb2ppKHRleHQsIGVtb2ppRm9sZGVyLCBsaW5lSGVpZ2h0KVxuICAgIGVsc2VcbiAgICAgIHRleHQucmVwbGFjZSAvOiguKj8pOi9nLCAocywgbSkgLT5cbiAgICAgICAgXCI8c3BhbiBjbGFzcz0naWNvbiBpY29uLSN7bX0nPjwvc3Bhbj5cIlxuXG4gIHNob3c6IChwb2ludCkgLT5cbiAgICB1bmxlc3MgQG1hcmtlcj9cbiAgICAgIEBtYXJrZXIgPSBAY3JlYXRlT3ZlcmxheShwb2ludClcbiAgICAgIEBsaW5lSGVpZ2h0ID0gQGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKVxuICAgICAgQHNldEljb25TaXplKEBsaW5lSGVpZ2h0KVxuICAgICAgQHN0eWxlLm1hcmdpblRvcCA9IChAbGluZUhlaWdodCAqIC0yLjIpICsgJ3B4J1xuXG4gICAgaWYgQHRleHQubGVuZ3RoXG4gICAgICBAaW5uZXJIVE1MID0gQHRleHQubWFwICh0ZXh0KSA9PlxuICAgICAgICBAY29udmVydFRleHQodGV4dCwgQGxpbmVIZWlnaHQpXG4gICAgICAuam9pbignJylcblxuICB3aXRoVGltZW91dDogKHBvaW50LCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG4gICAgaWYgb3B0aW9ucy5jbGFzc0xpc3QubGVuZ3RoXG4gICAgICBAY2xhc3NMaXN0LmFkZChvcHRpb25zLmNsYXNzTGlzdC4uLilcbiAgICBAYWRkKG9wdGlvbnMudGV4dCwgcG9pbnQpXG4gICAgaWYgb3B0aW9ucy50aW1lb3V0P1xuICAgICAgQHRpbWVvdXRJRCA9IHNldFRpbWVvdXQgID0+XG4gICAgICAgIEByZXNldCgpXG4gICAgICAsIG9wdGlvbnMudGltZW91dFxuXG4gIGNyZWF0ZU92ZXJsYXk6IChwb2ludCkgLT5cbiAgICBtYXJrZXIgPSBAZWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICBkZWNvcmF0aW9uID0gQGVkaXRvci5kZWNvcmF0ZU1hcmtlciBtYXJrZXIsXG4gICAgICB0eXBlOiAnb3ZlcmxheSdcbiAgICAgIGl0ZW06IHRoaXNcbiAgICBtYXJrZXJcblxuICBzZXRJY29uU2l6ZTogKHNpemUpIC0+XG4gICAgQHN0eWxlRWxlbWVudD8ucmVtb3ZlKClcbiAgICBAc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3R5bGUnXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChAc3R5bGVFbGVtZW50KVxuICAgIHNlbGVjdG9yID0gJy52aW0tbW9kZS1wbHVzLWhvdmVyIC5pY29uOjpiZWZvcmUnXG4gICAgc2l6ZSA9IFwiI3tzaXplKjAuOH1weFwiXG4gICAgc3R5bGUgPSBcImZvbnQtc2l6ZTogI3tzaXplfTsgd2lkdGg6ICN7c2l6ZX07IGhlZ2l0aDogI3tzaXplfTtcIlxuICAgIEBzdHlsZUVsZW1lbnQuc2hlZXQuYWRkUnVsZShzZWxlY3Rvciwgc3R5bGUpXG5cbiAgaXNWaXNpYmxlOiAtPlxuICAgIEBtYXJrZXI/XG5cbiAgcmVzZXQ6IC0+XG4gICAgQHRleHQgPSBbXVxuICAgIGNsZWFyVGltZW91dCBAdGltZW91dElEXG4gICAgQGNsYXNzTmFtZSA9ICd2aW0tbW9kZS1wbHVzLWhvdmVyJ1xuICAgIEB0ZXh0Q29udGVudCA9ICcnXG4gICAgQG1hcmtlcj8uZGVzdHJveSgpXG4gICAgQHN0eWxlRWxlbWVudD8ucmVtb3ZlKClcbiAgICB7XG4gICAgICBAbWFya2VyLCBAbGluZUhlaWdodFxuICAgICAgQHRpbWVvdXRJRCwgQHN0eWxlRWxlbWVudFxuICAgIH0gPSB7fVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHJlc2V0KClcbiAgICB7QHZpbVN0YXRlLCBAbGluZUhlaWdodH0gPSB7fVxuICAgIEByZW1vdmUoKVxuXG5Ib3ZlckVsZW1lbnQgPSByZWdpc3RlckVsZW1lbnQgXCJ2aW0tbW9kZS1wbHVzLWhvdmVyXCIsXG4gIHByb3RvdHlwZTogSG92ZXIucHJvdG90eXBlXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBIb3ZlckVsZW1lbnRcbn1cbiJdfQ==
