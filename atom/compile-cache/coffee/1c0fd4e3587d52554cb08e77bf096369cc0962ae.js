(function() {
  var BackgroundTipsElement, CompositeDisposable, Template, Tips, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  Tips = require('./tips');

  Template = "<ul class=\"centered background-message\">\n  <li class=\"message\"></li>\n</ul>";

  module.exports = BackgroundTipsElement = (function(superClass) {
    extend(BackgroundTipsElement, superClass);

    function BackgroundTipsElement() {
      return BackgroundTipsElement.__super__.constructor.apply(this, arguments);
    }

    BackgroundTipsElement.prototype.StartDelay = 1000;

    BackgroundTipsElement.prototype.DisplayDuration = 10000;

    BackgroundTipsElement.prototype.FadeDuration = 300;

    BackgroundTipsElement.prototype.createdCallback = function() {
      this.index = -1;
      this.disposables = new CompositeDisposable;
      this.disposables.add(atom.workspace.onDidAddPane((function(_this) {
        return function() {
          return _this.updateVisibility();
        };
      })(this)));
      this.disposables.add(atom.workspace.onDidDestroyPane((function(_this) {
        return function() {
          return _this.updateVisibility();
        };
      })(this)));
      this.disposables.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.updateVisibility();
        };
      })(this)));
      return this.startTimeout = setTimeout(((function(_this) {
        return function() {
          return _this.start();
        };
      })(this)), this.StartDelay);
    };

    BackgroundTipsElement.prototype.attachedCallback = function() {
      this.innerHTML = Template;
      return this.message = this.querySelector('.message');
    };

    BackgroundTipsElement.prototype.destroy = function() {
      this.stop();
      this.disposables.dispose();
      return this.destroyed = true;
    };

    BackgroundTipsElement.prototype.attach = function() {
      var paneView, ref, ref1, top;
      paneView = atom.views.getView(atom.workspace.getActivePane());
      top = (ref = (ref1 = paneView.querySelector('.item-views')) != null ? ref1.offsetTop : void 0) != null ? ref : 0;
      this.style.top = top + 'px';
      return paneView.appendChild(this);
    };

    BackgroundTipsElement.prototype.detach = function() {
      return this.remove();
    };

    BackgroundTipsElement.prototype.updateVisibility = function() {
      if (this.shouldBeAttached()) {
        return this.start();
      } else {
        return this.stop();
      }
    };

    BackgroundTipsElement.prototype.shouldBeAttached = function() {
      return atom.workspace.getPanes().length === 1 && (atom.workspace.getActivePaneItem() == null);
    };

    BackgroundTipsElement.prototype.start = function() {
      if (!this.shouldBeAttached() || (this.interval != null)) {
        return;
      }
      this.renderTips();
      this.randomizeIndex();
      this.attach();
      this.showNextTip();
      return this.interval = setInterval(((function(_this) {
        return function() {
          return _this.showNextTip();
        };
      })(this)), this.DisplayDuration);
    };

    BackgroundTipsElement.prototype.stop = function() {
      this.remove();
      if (this.interval != null) {
        clearInterval(this.interval);
      }
      clearTimeout(this.startTimeout);
      clearTimeout(this.nextTipTimeout);
      return this.interval = null;
    };

    BackgroundTipsElement.prototype.randomizeIndex = function() {
      var len;
      len = Tips.length;
      return this.index = Math.round(Math.random() * len) % len;
    };

    BackgroundTipsElement.prototype.showNextTip = function() {
      this.index = ++this.index % Tips.length;
      this.message.classList.remove('fade-in');
      return this.nextTipTimeout = setTimeout((function(_this) {
        return function() {
          _this.message.innerHTML = Tips[_this.index];
          return _this.message.classList.add('fade-in');
        };
      })(this), this.FadeDuration);
    };

    BackgroundTipsElement.prototype.renderTips = function() {
      var i, j, len1, tip;
      if (this.tipsRendered) {
        return;
      }
      for (i = j = 0, len1 = Tips.length; j < len1; i = ++j) {
        tip = Tips[i];
        Tips[i] = this.renderTip(tip);
      }
      return this.tipsRendered = true;
    };

    BackgroundTipsElement.prototype.renderTip = function(str) {
      str = str.replace(/\{(.+)\}/g, (function(_this) {
        return function(match, command) {
          var binding, bindings, j, keystrokeLabel, len1, scope, scopeAndCommand;
          scopeAndCommand = command.split('>');
          if (scopeAndCommand.length > 1) {
            scope = scopeAndCommand[0], command = scopeAndCommand[1];
          }
          bindings = atom.keymaps.findKeyBindings({
            command: command.trim()
          });
          if (scope) {
            for (j = 0, len1 = bindings.length; j < len1; j++) {
              binding = bindings[j];
              if (binding.selector === scope) {
                break;
              }
            }
          } else {
            binding = _this.getKeyBindingForCurrentPlatform(bindings);
          }
          if (binding != null ? binding.keystrokes : void 0) {
            keystrokeLabel = _.humanizeKeystroke(binding.keystrokes).replace(/\s+/g, '&nbsp;');
            return "<span class=\"keystroke\">" + keystrokeLabel + "</span>";
          } else {
            return command;
          }
        };
      })(this));
      return str;
    };

    BackgroundTipsElement.prototype.getKeyBindingForCurrentPlatform = function(bindings) {
      var binding, j, len1;
      if (!(bindings != null ? bindings.length : void 0)) {
        return;
      }
      for (j = 0, len1 = bindings.length; j < len1; j++) {
        binding = bindings[j];
        if (binding.selector.indexOf(process.platform) !== -1) {
          return binding;
        }
      }
      return bindings[0];
    };

    return BackgroundTipsElement;

  })(HTMLElement);

  module.exports = document.registerElement('background-tips', {
    prototype: BackgroundTipsElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9iYWNrZ3JvdW5kLXRpcHMvbGliL2JhY2tncm91bmQtdGlwcy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkRBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFUCxRQUFBLEdBQVc7O0VBTVgsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztvQ0FDSixVQUFBLEdBQVk7O29DQUNaLGVBQUEsR0FBaUI7O29DQUNqQixZQUFBLEdBQWM7O29DQUVkLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQztNQUVWLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFmLENBQTRCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QixDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFmLENBQWdDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQyxDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUFmLENBQXlDLENBQUEsU0FB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T0FBTyxDQUFFLG1CQUFaO1lBQ0UsY0FBQSxHQUFpQixDQUFDLENBQUMsaUJBQUYsQ0FBb0IsT0FBTyxDQUFDLFVBQTVCLENBQXVDLENBQUMsT0FBeEMsQ0FBZ0QsTUFBaEQsRUFBd0QsUUFBeEQ7bUJBQ2pCLDRCQUFBLEdBQTZCLGNBQTdCLEdBQTRDLFVBRjlDO1dBQUEsTUFBQTttQkFJRSxRQUpGOztRQVg2QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7YUFnQk47SUFqQlM7O29DQW1CWCwrQkFBQSxHQUFpQyxTQUFDLFFBQUQ7QUFDL0IsVUFBQTtNQUFBLElBQUEscUJBQWMsUUFBUSxDQUFFLGdCQUF4QjtBQUFBLGVBQUE7O0FBQ0EsV0FBQSw0Q0FBQTs7WUFBNEMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFqQixDQUF5QixPQUFPLENBQUMsUUFBakMsQ0FBQSxLQUFnRCxDQUFDO0FBQTdGLGlCQUFPOztBQUFQO0FBQ0EsYUFBTyxRQUFTLENBQUEsQ0FBQTtJQUhlOzs7O0tBOUZDOztFQW1HcEMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsaUJBQXpCLEVBQTRDO0lBQUEsU0FBQSxFQUFXLHFCQUFxQixDQUFDLFNBQWpDO0dBQTVDO0FBOUdqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuVGlwcyA9IHJlcXVpcmUgJy4vdGlwcydcblxuVGVtcGxhdGUgPSBcIlwiXCJcbiAgPHVsIGNsYXNzPVwiY2VudGVyZWQgYmFja2dyb3VuZC1tZXNzYWdlXCI+XG4gICAgPGxpIGNsYXNzPVwibWVzc2FnZVwiPjwvbGk+XG4gIDwvdWw+XG5cIlwiXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQmFja2dyb3VuZFRpcHNFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgU3RhcnREZWxheTogMTAwMFxuICBEaXNwbGF5RHVyYXRpb246IDEwMDAwXG4gIEZhZGVEdXJhdGlvbjogMzAwXG5cbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIEBpbmRleCA9IC0xXG5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS53b3Jrc3BhY2Uub25EaWRBZGRQYW5lID0+IEB1cGRhdGVWaXNpYmlsaXR5KClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkRGVzdHJveVBhbmUgPT4gQHVwZGF0ZVZpc2liaWxpdHkoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSA9PiBAdXBkYXRlVmlzaWJpbGl0eSgpXG5cbiAgICBAc3RhcnRUaW1lb3V0ID0gc2V0VGltZW91dCgoPT4gQHN0YXJ0KCkpLCBAU3RhcnREZWxheSlcblxuICBhdHRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEBpbm5lckhUTUwgPSBUZW1wbGF0ZVxuICAgIEBtZXNzYWdlID0gQHF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlJylcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdG9wKClcbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGRlc3Ryb3llZCA9IHRydWVcblxuICBhdHRhY2g6IC0+XG4gICAgcGFuZVZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpKVxuICAgIHRvcCA9IHBhbmVWaWV3LnF1ZXJ5U2VsZWN0b3IoJy5pdGVtLXZpZXdzJyk/Lm9mZnNldFRvcCA/IDBcbiAgICBAc3R5bGUudG9wID0gdG9wICsgJ3B4J1xuICAgIHBhbmVWaWV3LmFwcGVuZENoaWxkKHRoaXMpXG5cbiAgZGV0YWNoOiAtPlxuICAgIEByZW1vdmUoKVxuXG4gIHVwZGF0ZVZpc2liaWxpdHk6IC0+XG4gICAgaWYgQHNob3VsZEJlQXR0YWNoZWQoKVxuICAgICAgQHN0YXJ0KClcbiAgICBlbHNlXG4gICAgICBAc3RvcCgpXG5cbiAgc2hvdWxkQmVBdHRhY2hlZDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpLmxlbmd0aCBpcyAxIGFuZCBub3QgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKT9cblxuICBzdGFydDogLT5cbiAgICByZXR1cm4gaWYgbm90IEBzaG91bGRCZUF0dGFjaGVkKCkgb3IgQGludGVydmFsP1xuICAgIEByZW5kZXJUaXBzKClcbiAgICBAcmFuZG9taXplSW5kZXgoKVxuICAgIEBhdHRhY2goKVxuICAgIEBzaG93TmV4dFRpcCgpXG4gICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwoKD0+IEBzaG93TmV4dFRpcCgpKSwgQERpc3BsYXlEdXJhdGlvbilcblxuICBzdG9wOiAtPlxuICAgIEByZW1vdmUoKVxuICAgIGNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWw/XG4gICAgY2xlYXJUaW1lb3V0KEBzdGFydFRpbWVvdXQpXG4gICAgY2xlYXJUaW1lb3V0KEBuZXh0VGlwVGltZW91dClcbiAgICBAaW50ZXJ2YWwgPSBudWxsXG5cbiAgcmFuZG9taXplSW5kZXg6IC0+XG4gICAgbGVuID0gVGlwcy5sZW5ndGhcbiAgICBAaW5kZXggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBsZW4pICUgbGVuXG5cbiAgc2hvd05leHRUaXA6IC0+XG4gICAgQGluZGV4ID0gKytAaW5kZXggJSBUaXBzLmxlbmd0aFxuICAgIEBtZXNzYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhZGUtaW4nKVxuICAgIEBuZXh0VGlwVGltZW91dCA9IHNldFRpbWVvdXQgPT5cbiAgICAgIEBtZXNzYWdlLmlubmVySFRNTCA9IFRpcHNbQGluZGV4XVxuICAgICAgQG1lc3NhZ2UuY2xhc3NMaXN0LmFkZCgnZmFkZS1pbicpXG4gICAgLCBARmFkZUR1cmF0aW9uXG5cbiAgcmVuZGVyVGlwczogLT5cbiAgICByZXR1cm4gaWYgQHRpcHNSZW5kZXJlZFxuICAgIGZvciB0aXAsIGkgaW4gVGlwc1xuICAgICAgVGlwc1tpXSA9IEByZW5kZXJUaXAodGlwKVxuICAgIEB0aXBzUmVuZGVyZWQgPSB0cnVlXG5cbiAgcmVuZGVyVGlwOiAoc3RyKSAtPlxuICAgIHN0ciA9IHN0ci5yZXBsYWNlIC9cXHsoLispXFx9L2csIChtYXRjaCwgY29tbWFuZCkgPT5cbiAgICAgIHNjb3BlQW5kQ29tbWFuZCA9IGNvbW1hbmQuc3BsaXQoJz4nKVxuICAgICAgW3Njb3BlLCBjb21tYW5kXSA9IHNjb3BlQW5kQ29tbWFuZCBpZiBzY29wZUFuZENvbW1hbmQubGVuZ3RoID4gMVxuICAgICAgYmluZGluZ3MgPSBhdG9tLmtleW1hcHMuZmluZEtleUJpbmRpbmdzKGNvbW1hbmQ6IGNvbW1hbmQudHJpbSgpKVxuXG4gICAgICBpZiBzY29wZVxuICAgICAgICBmb3IgYmluZGluZyBpbiBiaW5kaW5nc1xuICAgICAgICAgIGJyZWFrIGlmIGJpbmRpbmcuc2VsZWN0b3IgaXMgc2NvcGVcbiAgICAgIGVsc2VcbiAgICAgICAgYmluZGluZyA9IEBnZXRLZXlCaW5kaW5nRm9yQ3VycmVudFBsYXRmb3JtKGJpbmRpbmdzKVxuXG4gICAgICBpZiBiaW5kaW5nPy5rZXlzdHJva2VzXG4gICAgICAgIGtleXN0cm9rZUxhYmVsID0gXy5odW1hbml6ZUtleXN0cm9rZShiaW5kaW5nLmtleXN0cm9rZXMpLnJlcGxhY2UoL1xccysvZywgJyZuYnNwOycpXG4gICAgICAgIFwiPHNwYW4gY2xhc3M9XFxcImtleXN0cm9rZVxcXCI+I3trZXlzdHJva2VMYWJlbH08L3NwYW4+XCJcbiAgICAgIGVsc2VcbiAgICAgICAgY29tbWFuZFxuICAgIHN0clxuXG4gIGdldEtleUJpbmRpbmdGb3JDdXJyZW50UGxhdGZvcm06IChiaW5kaW5ncykgLT5cbiAgICByZXR1cm4gdW5sZXNzIGJpbmRpbmdzPy5sZW5ndGhcbiAgICByZXR1cm4gYmluZGluZyBmb3IgYmluZGluZyBpbiBiaW5kaW5ncyB3aGVuIGJpbmRpbmcuc2VsZWN0b3IuaW5kZXhPZihwcm9jZXNzLnBsYXRmb3JtKSBpc250IC0xXG4gICAgcmV0dXJuIGJpbmRpbmdzWzBdXG5cbm1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50ICdiYWNrZ3JvdW5kLXRpcHMnLCBwcm90b3R5cGU6IEJhY2tncm91bmRUaXBzRWxlbWVudC5wcm90b3R5cGVcbiJdfQ==
