(function() {
  var Disposable, GrammarStatusView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  GrammarStatusView = (function(superClass) {
    extend(GrammarStatusView, superClass);

    function GrammarStatusView() {
      return GrammarStatusView.__super__.constructor.apply(this, arguments);
    }

    GrammarStatusView.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
      this.classList.add('grammar-status', 'inline-block');
      this.grammarLink = document.createElement('a');
      this.grammarLink.classList.add('inline-block');
      this.grammarLink.href = '#';
      this.appendChild(this.grammarLink);
      this.handleEvents();
      return this;
    };

    GrammarStatusView.prototype.attach = function() {
      var ref;
      if ((ref = this.statusBarTile) != null) {
        ref.destroy();
      }
      return this.statusBarTile = atom.config.get('grammar-selector.showOnRightSideOfStatusBar') ? this.statusBar.addRightTile({
        item: this,
        priority: 10
      }) : this.statusBar.addLeftTile({
        item: this,
        priority: 10
      });
    };

    GrammarStatusView.prototype.handleEvents = function() {
      var clickHandler;
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.subscribeToActiveTextEditor();
        };
      })(this));
      this.configSubscription = atom.config.observe('grammar-selector.showOnRightSideOfStatusBar', (function(_this) {
        return function() {
          return _this.attach();
        };
      })(this));
      clickHandler = (function(_this) {
        return function() {
          return atom.commands.dispatch(atom.views.getView(_this.getActiveTextEditor()), 'grammar-selector:show');
        };
      })(this);
      this.addEventListener('click', clickHandler);
      this.clickSubscription = new Disposable((function(_this) {
        return function() {
          return _this.removeEventListener('click', clickHandler);
        };
      })(this));
      return this.subscribeToActiveTextEditor();
    };

    GrammarStatusView.prototype.destroy = function() {
      var ref, ref1, ref2, ref3;
      if ((ref = this.activeItemSubscription) != null) {
        ref.dispose();
      }
      if ((ref1 = this.grammarSubscription) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.clickSubscription) != null) {
        ref2.dispose();
      }
      if ((ref3 = this.configSubscription) != null) {
        ref3.dispose();
      }
      return this.statusBarTile.destroy();
    };

    GrammarStatusView.prototype.getActiveTextEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    GrammarStatusView.prototype.subscribeToActiveTextEditor = function() {
      var ref, ref1;
      if ((ref = this.grammarSubscription) != null) {
        ref.dispose();
      }
      this.grammarSubscription = (ref1 = this.getActiveTextEditor()) != null ? ref1.onDidChangeGrammar((function(_this) {
        return function() {
          return _this.updateGrammarText();
        };
      })(this)) : void 0;
      return this.updateGrammarText();
    };

    GrammarStatusView.prototype.updateGrammarText = function() {
      var grammar, grammarName, ref, ref1;
      grammar = (ref = this.getActiveTextEditor()) != null ? typeof ref.getGrammar === "function" ? ref.getGrammar() : void 0 : void 0;
      if (grammar != null) {
        if (grammar === atom.grammars.nullGrammar) {
          grammarName = 'Plain Text';
        } else {
          grammarName = (ref1 = grammar.name) != null ? ref1 : grammar.scopeName;
        }
        this.grammarLink.textContent = grammarName;
        this.grammarLink.dataset.grammar = grammarName;
        return this.style.display = '';
      } else {
        return this.style.display = 'none';
      }
    };

    return GrammarStatusView;

  })(HTMLDivElement);

  module.exports = document.registerElement('grammar-selector-status', {
    prototype: GrammarStatusView.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ncmFtbWFyLXNlbGVjdG9yL2xpYi9ncmFtbWFyLXN0YXR1cy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQTs7O0VBQUMsYUFBYyxPQUFBLENBQVEsTUFBUjs7RUFHVDs7Ozs7OztnQ0FDSixVQUFBLEdBQVksU0FBQyxTQUFEO01BQUMsSUFBQyxDQUFBLFlBQUQ7TUFDWCxJQUFDLENBQUEsU0FBUyxDQUFDLEdBQVgsQ0FBZSxnQkFBZixFQUFpQyxjQUFqQztNQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsR0FBdkI7TUFDZixJQUFDLENBQUEsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUF2QixDQUEyQixjQUEzQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixHQUFvQjtNQUNwQixJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxXQUFkO01BQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTthQUNBO0lBUFU7O2dDQVNaLE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTs7V0FBYyxDQUFFLE9BQWhCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FDSyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkNBQWhCLENBQUgsR0FDRSxJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVgsQ0FBd0I7UUFBQSxJQUFBLEVBQU0sSUFBTjtRQUFZLFFBQUEsRUFBVSxFQUF0QjtPQUF4QixDQURGLEdBR0UsSUFBQyxDQUFBLFNBQVMsQ0FBQyxXQUFYLENBQXVCO1FBQUEsSUFBQSxFQUFNLElBQU47UUFBWSxRQUFBLEVBQVUsRUFBdEI7T0FBdkI7SUFORTs7Z0NBUVIsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsSUFBQyxDQUFBLHNCQUFELEdBQTBCLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNqRSxLQUFDLENBQUEsMkJBQUQsQ0FBQTtRQURpRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7TUFHMUIsSUFBQyxDQUFBLGtCQUFELEdBQXNCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQiw2Q0FBcEIsRUFBbUUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN2RixLQUFDLENBQUEsTUFBRCxDQUFBO1FBRHVGO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuRTtNQUd0QixZQUFBLEdBQWUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsS0FBQyxDQUFBLG1CQUFELENBQUEsQ0FBbkIsQ0FBdkIsRUFBbUUsdUJBQW5FO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BQ2YsSUFBQyxDQUFBLGdCQUFELENBQWtCLE9BQWxCLEVBQTJCLFlBQTNCO01BQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXlCLElBQUEsVUFBQSxDQUFXLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsbUJBQUQsQ0FBcUIsT0FBckIsRUFBOEIsWUFBOUI7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWDthQUV6QixJQUFDLENBQUEsMkJBQUQsQ0FBQTtJQVhZOztnQ0FhZCxPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7O1dBQXVCLENBQUUsT0FBekIsQ0FBQTs7O1lBQ29CLENBQUUsT0FBdEIsQ0FBQTs7O1lBQ2tCLENBQUUsT0FBcEIsQ0FBQTs7O1lBQ21CLENBQUUsT0FBckIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQUxPOztnQ0FPVCxtQkFBQSxHQUFxQixTQUFBO2FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtJQURtQjs7Z0NBR3JCLDJCQUFBLEdBQTZCLFNBQUE7QUFDM0IsVUFBQTs7V0FBb0IsQ0FBRSxPQUF0QixDQUFBOztNQUNBLElBQUMsQ0FBQSxtQkFBRCxxREFBNkMsQ0FBRSxrQkFBeEIsQ0FBMkMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNoRSxLQUFDLENBQUEsaUJBQUQsQ0FBQTtRQURnRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0M7YUFFdkIsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFKMkI7O2dDQU03QixpQkFBQSxHQUFtQixTQUFBO0FBQ2pCLFVBQUE7TUFBQSxPQUFBLDBGQUFnQyxDQUFFO01BQ2xDLElBQUcsZUFBSDtRQUNFLElBQUcsT0FBQSxLQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBNUI7VUFDRSxXQUFBLEdBQWMsYUFEaEI7U0FBQSxNQUFBO1VBR0UsV0FBQSwwQ0FBNkIsT0FBTyxDQUFDLFVBSHZDOztRQUlBLElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixHQUEyQjtRQUMzQixJQUFDLENBQUEsV0FBVyxDQUFDLE9BQU8sQ0FBQyxPQUFyQixHQUErQjtlQUMvQixJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsR0FBaUIsR0FQbkI7T0FBQSxNQUFBO2VBU0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLEdBQWlCLE9BVG5COztJQUZpQjs7OztLQS9DVzs7RUE0RGhDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQVEsQ0FBQyxlQUFULENBQXlCLHlCQUF6QixFQUFvRDtJQUFBLFNBQUEsRUFBVyxpQkFBaUIsQ0FBQyxTQUE3QjtHQUFwRDtBQS9EakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG4jIFZpZXcgdG8gc2hvdyB0aGUgZ3JhbW1hciBuYW1lIGluIHRoZSBzdGF0dXMgYmFyLlxuY2xhc3MgR3JhbW1hclN0YXR1c1ZpZXcgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudFxuICBpbml0aWFsaXplOiAoQHN0YXR1c0JhcikgLT5cbiAgICBAY2xhc3NMaXN0LmFkZCgnZ3JhbW1hci1zdGF0dXMnLCAnaW5saW5lLWJsb2NrJylcbiAgICBAZ3JhbW1hckxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICBAZ3JhbW1hckxpbmsuY2xhc3NMaXN0LmFkZCgnaW5saW5lLWJsb2NrJylcbiAgICBAZ3JhbW1hckxpbmsuaHJlZiA9ICcjJ1xuICAgIEBhcHBlbmRDaGlsZChAZ3JhbW1hckxpbmspXG4gICAgQGhhbmRsZUV2ZW50cygpXG4gICAgdGhpc1xuXG4gIGF0dGFjaDogLT5cbiAgICBAc3RhdHVzQmFyVGlsZT8uZGVzdHJveSgpXG4gICAgQHN0YXR1c0JhclRpbGUgPVxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0ICdncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyJ1xuICAgICAgICBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZShpdGVtOiB0aGlzLCBwcmlvcml0eTogMTApXG4gICAgICBlbHNlXG4gICAgICAgIEBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoaXRlbTogdGhpcywgcHJpb3JpdHk6IDEwKVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbiA9IGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgQGNvbmZpZ1N1YnNjcmlwdGlvbiA9IGF0b20uY29uZmlnLm9ic2VydmUgJ2dyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXInLCA9PlxuICAgICAgQGF0dGFjaCgpXG5cbiAgICBjbGlja0hhbmRsZXIgPSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhAZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ2dyYW1tYXItc2VsZWN0b3I6c2hvdycpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKVxuICAgIEBjbGlja1N1YnNjcmlwdGlvbiA9IG5ldyBEaXNwb3NhYmxlID0+IEByZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcilcblxuICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGFjdGl2ZUl0ZW1TdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBncmFtbWFyU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAY2xpY2tTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjb25maWdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBzdGF0dXNCYXJUaWxlLmRlc3Ryb3koKVxuXG4gIGdldEFjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgc3Vic2NyaWJlVG9BY3RpdmVUZXh0RWRpdG9yOiAtPlxuICAgIEBncmFtbWFyU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAZ3JhbW1hclN1YnNjcmlwdGlvbiA9IEBnZXRBY3RpdmVUZXh0RWRpdG9yKCk/Lm9uRGlkQ2hhbmdlR3JhbW1hciA9PlxuICAgICAgQHVwZGF0ZUdyYW1tYXJUZXh0KClcbiAgICBAdXBkYXRlR3JhbW1hclRleHQoKVxuXG4gIHVwZGF0ZUdyYW1tYXJUZXh0OiAtPlxuICAgIGdyYW1tYXIgPSBAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRHcmFtbWFyPygpXG4gICAgaWYgZ3JhbW1hcj9cbiAgICAgIGlmIGdyYW1tYXIgaXMgYXRvbS5ncmFtbWFycy5udWxsR3JhbW1hclxuICAgICAgICBncmFtbWFyTmFtZSA9ICdQbGFpbiBUZXh0J1xuICAgICAgZWxzZVxuICAgICAgICBncmFtbWFyTmFtZSA9IGdyYW1tYXIubmFtZSA/IGdyYW1tYXIuc2NvcGVOYW1lXG4gICAgICBAZ3JhbW1hckxpbmsudGV4dENvbnRlbnQgPSBncmFtbWFyTmFtZVxuICAgICAgQGdyYW1tYXJMaW5rLmRhdGFzZXQuZ3JhbW1hciA9IGdyYW1tYXJOYW1lXG4gICAgICBAc3R5bGUuZGlzcGxheSA9ICcnXG4gICAgZWxzZVxuICAgICAgQHN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxubW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ2dyYW1tYXItc2VsZWN0b3Itc3RhdHVzJywgcHJvdG90eXBlOiBHcmFtbWFyU3RhdHVzVmlldy5wcm90b3R5cGUpXG4iXX0=
