(function() {
  var $, GoToLineView, Point, TextEditorView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Point = require('atom').Point;

  ref = require('atom-space-pen-views'), $ = ref.$, TextEditorView = ref.TextEditorView, View = ref.View;

  module.exports = GoToLineView = (function(superClass) {
    extend(GoToLineView, superClass);

    function GoToLineView() {
      return GoToLineView.__super__.constructor.apply(this, arguments);
    }

    GoToLineView.activate = function() {
      return new GoToLineView;
    };

    GoToLineView.content = function() {
      return this.div({
        "class": 'go-to-line'
      }, (function(_this) {
        return function() {
          _this.subview('miniEditor', new TextEditorView({
            mini: true
          }));
          return _this.div({
            "class": 'message',
            outlet: 'message'
          });
        };
      })(this));
    };

    GoToLineView.prototype.initialize = function() {
      this.panel = atom.workspace.addModalPanel({
        item: this,
        visible: false
      });
      atom.commands.add('atom-text-editor', 'go-to-line:toggle', (function(_this) {
        return function() {
          _this.toggle();
          return false;
        };
      })(this));
      this.miniEditor.on('blur', (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
      atom.commands.add(this.miniEditor.element, 'core:confirm', (function(_this) {
        return function() {
          return _this.confirm();
        };
      })(this));
      atom.commands.add(this.miniEditor.element, 'core:cancel', (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
      return this.miniEditor.getModel().onWillInsertText(function(arg) {
        var cancel, text;
        cancel = arg.cancel, text = arg.text;
        if (text.match(/[^0-9:]/)) {
          return cancel();
        }
      });
    };

    GoToLineView.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.close();
      } else {
        return this.open();
      }
    };

    GoToLineView.prototype.close = function() {
      var miniEditorFocused;
      if (!this.panel.isVisible()) {
        return;
      }
      miniEditorFocused = this.miniEditor.hasFocus();
      this.miniEditor.setText('');
      this.panel.hide();
      if (miniEditorFocused) {
        return this.restoreFocus();
      }
    };

    GoToLineView.prototype.confirm = function() {
      var column, currentRow, editor, lineNumber, position, ref1, row;
      lineNumber = this.miniEditor.getText();
      editor = atom.workspace.getActiveTextEditor();
      this.close();
      if (!((editor != null) && lineNumber.length)) {
        return;
      }
      currentRow = editor.getCursorBufferPosition().row;
      ref1 = lineNumber.split(/:+/), row = ref1[0], column = ref1[1];
      if ((row != null ? row.length : void 0) > 0) {
        row = parseInt(row) - 1;
      } else {
        row = currentRow;
      }
      if ((column != null ? column.length : void 0) > 0) {
        column = parseInt(column) - 1;
      } else {
        column = -1;
      }
      position = new Point(row, column);
      editor.setCursorBufferPosition(position);
      editor.unfoldBufferRow(row);
      if (column < 0) {
        editor.moveToFirstCharacterOfLine();
      }
      return editor.scrollToBufferPosition(position, {
        center: true
      });
    };

    GoToLineView.prototype.storeFocusedElement = function() {
      return this.previouslyFocusedElement = $(':focus');
    };

    GoToLineView.prototype.restoreFocus = function() {
      var ref1;
      if ((ref1 = this.previouslyFocusedElement) != null ? ref1.isOnDom() : void 0) {
        return this.previouslyFocusedElement.focus();
      } else {
        return atom.views.getView(atom.workspace).focus();
      }
    };

    GoToLineView.prototype.open = function() {
      if (this.panel.isVisible()) {
        return;
      }
      if (atom.workspace.getActiveTextEditor()) {
        this.storeFocusedElement();
        this.panel.show();
        this.message.text("Enter a <row> or <row>:<column> to go there. Examples: \"3\" for row 3 or \"2:7\" for row 2 and column 7");
        return this.miniEditor.focus();
      }
    };

    return GoToLineView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9nby10by1saW5lL2xpYi9nby10by1saW5lLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpREFBQTtJQUFBOzs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUNWLE1BQTZCLE9BQUEsQ0FBUSxzQkFBUixDQUE3QixFQUFDLFNBQUQsRUFBSSxtQ0FBSixFQUFvQjs7RUFFcEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNKLFlBQUMsQ0FBQSxRQUFELEdBQVcsU0FBQTthQUFHLElBQUk7SUFBUDs7SUFFWCxZQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO09BQUwsRUFBMEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3hCLEtBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxFQUEyQixJQUFBLGNBQUEsQ0FBZTtZQUFBLElBQUEsRUFBTSxJQUFOO1dBQWYsQ0FBM0I7aUJBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtZQUFrQixNQUFBLEVBQVEsU0FBMUI7V0FBTDtRQUZ3QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUI7SUFEUTs7MkJBS1YsVUFBQSxHQUFZLFNBQUE7TUFDVixJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUE2QjtRQUFBLElBQUEsRUFBTSxJQUFOO1FBQVksT0FBQSxFQUFTLEtBQXJCO09BQTdCO01BRVQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUFzQyxtQkFBdEMsRUFBMkQsQ0FB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QUF1QixHQUF2QjtNQUNBLElBQUcsTUFBQSxHQUFTLENBQVo7UUFDRSxNQUFNLENBQUMsMEJBQVAsQ0FBQSxFQURGOzthQUVBLE1BQU0sQ0FBQyxzQkFBUCxDQUE4QixRQUE5QixFQUF3QztRQUFBLE1BQUEsRUFBUSxJQUFSO09BQXhDO0lBaENPOzsyQkFrQ1QsbUJBQUEsR0FBcUIsU0FBQTthQUNuQixJQUFDLENBQUEsd0JBQUQsR0FBNEIsQ0FBQSxDQUFFLFFBQUY7SUFEVDs7MkJBR3JCLFlBQUEsR0FBYyxTQUFBO0FBQ1osVUFBQTtNQUFBLHlEQUE0QixDQUFFLE9BQTNCLENBQUEsVUFBSDtlQUNFLElBQUMsQ0FBQSx3QkFBd0IsQ0FBQyxLQUExQixDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUksQ0FBQyxTQUF4QixDQUFrQyxDQUFDLEtBQW5DLENBQUEsRUFIRjs7SUFEWTs7MkJBTWQsSUFBQSxHQUFNLFNBQUE7TUFDSixJQUFVLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFBLENBQVY7QUFBQSxlQUFBOztNQUVBLElBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQUg7UUFDRSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsMEdBQWQ7ZUFDQSxJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBQSxFQUpGOztJQUhJOzs7O0tBL0VtQjtBQUozQiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xueyQsIFRleHRFZGl0b3JWaWV3LCBWaWV3fSAgPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR29Ub0xpbmVWaWV3IGV4dGVuZHMgVmlld1xuICBAYWN0aXZhdGU6IC0+IG5ldyBHb1RvTGluZVZpZXdcblxuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAnZ28tdG8tbGluZScsID0+XG4gICAgICBAc3VidmlldyAnbWluaUVkaXRvcicsIG5ldyBUZXh0RWRpdG9yVmlldyhtaW5pOiB0cnVlKVxuICAgICAgQGRpdiBjbGFzczogJ21lc3NhZ2UnLCBvdXRsZXQ6ICdtZXNzYWdlJ1xuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbChpdGVtOiB0aGlzLCB2aXNpYmxlOiBmYWxzZSlcblxuICAgIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJywgJ2dvLXRvLWxpbmU6dG9nZ2xlJywgPT5cbiAgICAgIEB0b2dnbGUoKVxuICAgICAgZmFsc2VcblxuICAgIEBtaW5pRWRpdG9yLm9uICdibHVyJywgPT4gQGNsb3NlKClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAbWluaUVkaXRvci5lbGVtZW50LCAnY29yZTpjb25maXJtJywgPT4gQGNvbmZpcm0oKVxuICAgIGF0b20uY29tbWFuZHMuYWRkIEBtaW5pRWRpdG9yLmVsZW1lbnQsICdjb3JlOmNhbmNlbCcsID0+IEBjbG9zZSgpXG5cbiAgICBAbWluaUVkaXRvci5nZXRNb2RlbCgpLm9uV2lsbEluc2VydFRleHQgKHtjYW5jZWwsIHRleHR9KSAtPlxuICAgICAgY2FuY2VsKCkgaWYgdGV4dC5tYXRjaCgvW14wLTk6XS8pXG5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIEBwYW5lbC5pc1Zpc2libGUoKVxuICAgICAgQGNsb3NlKClcbiAgICBlbHNlXG4gICAgICBAb3BlbigpXG5cbiAgY2xvc2U6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGFuZWwuaXNWaXNpYmxlKClcblxuICAgIG1pbmlFZGl0b3JGb2N1c2VkID0gQG1pbmlFZGl0b3IuaGFzRm9jdXMoKVxuICAgIEBtaW5pRWRpdG9yLnNldFRleHQoJycpXG4gICAgQHBhbmVsLmhpZGUoKVxuICAgIEByZXN0b3JlRm9jdXMoKSBpZiBtaW5pRWRpdG9yRm9jdXNlZFxuXG4gIGNvbmZpcm06IC0+XG4gICAgbGluZU51bWJlciA9IEBtaW5pRWRpdG9yLmdldFRleHQoKVxuICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgQGNsb3NlKClcblxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yPyBhbmQgbGluZU51bWJlci5sZW5ndGhcblxuICAgIGN1cnJlbnRSb3cgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICBbcm93LCBjb2x1bW5dID0gbGluZU51bWJlci5zcGxpdCgvOisvKVxuICAgIGlmIHJvdz8ubGVuZ3RoID4gMFxuICAgICAgIyBMaW5lIG51bWJlciB3YXMgc3BlY2lmaWVkXG4gICAgICByb3cgPSBwYXJzZUludChyb3cpIC0gMVxuICAgIGVsc2VcbiAgICAgICMgTGluZSBudW1iZXIgd2FzIG5vdCBzcGVjaWZpZWQsIHNvIGFzc3VtZSB3ZSB3aWxsIGJlIGF0IHRoZSBzYW1lIGxpbmVcbiAgICAgICMgYXMgd2hlcmUgdGhlIGN1cnNvciBjdXJyZW50bHkgaXMgKG5vIGNoYW5nZSlcbiAgICAgIHJvdyA9IGN1cnJlbnRSb3dcblxuICAgIGlmIGNvbHVtbj8ubGVuZ3RoID4gMFxuICAgICAgIyBDb2x1bW4gbnVtYmVyIHdhcyBzcGVjaWZpZWRcbiAgICAgIGNvbHVtbiA9IHBhcnNlSW50KGNvbHVtbikgLSAxXG4gICAgZWxzZVxuICAgICAgIyBDb2x1bW4gbnVtYmVyIHdhcyBub3Qgc3BlY2lmaWVkLCBzbyBpZiB0aGUgbGluZSBudW1iZXIgd2FzIHNwZWNpZmllZCxcbiAgICAgICMgdGhlbiB3ZSBzaG91bGQgYXNzdW1lIHRoYXQgd2UncmUgbmF2aWdhdGluZyB0byB0aGUgZmlyc3QgY2hhcmFjdGVyXG4gICAgICAjIG9mIHRoZSBzcGVjaWZpZWQgbGluZS5cbiAgICAgIGNvbHVtbiA9IC0xXG5cbiAgICBwb3NpdGlvbiA9IG5ldyBQb2ludChyb3csIGNvbHVtbilcbiAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pXG4gICAgZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhyb3cpXG4gICAgaWYgY29sdW1uIDwgMFxuICAgICAgZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihwb3NpdGlvbiwgY2VudGVyOiB0cnVlKVxuXG4gIHN0b3JlRm9jdXNlZEVsZW1lbnQ6IC0+XG4gICAgQHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudCA9ICQoJzpmb2N1cycpXG5cbiAgcmVzdG9yZUZvY3VzOiAtPlxuICAgIGlmIEBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnQ/LmlzT25Eb20oKVxuICAgICAgQHByZXZpb3VzbHlGb2N1c2VkRWxlbWVudC5mb2N1cygpXG4gICAgZWxzZVxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5mb2N1cygpXG5cbiAgb3BlbjogLT5cbiAgICByZXR1cm4gaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG5cbiAgICBpZiBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIEBzdG9yZUZvY3VzZWRFbGVtZW50KClcbiAgICAgIEBwYW5lbC5zaG93KClcbiAgICAgIEBtZXNzYWdlLnRleHQoXCJFbnRlciBhIDxyb3c+IG9yIDxyb3c+Ojxjb2x1bW4+IHRvIGdvIHRoZXJlLiBFeGFtcGxlczogXFxcIjNcXFwiIGZvciByb3cgMyBvciBcXFwiMjo3XFxcIiBmb3Igcm93IDIgYW5kIGNvbHVtbiA3XCIpXG4gICAgICBAbWluaUVkaXRvci5mb2N1cygpXG4iXX0=
