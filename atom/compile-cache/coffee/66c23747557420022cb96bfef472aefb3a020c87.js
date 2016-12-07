(function() {
  var $$, CompositeDisposable, Disposable, KeyBindingResolverView, View, path, ref, ref1,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('atom-space-pen-views'), $$ = ref1.$$, View = ref1.View;

  path = require('path');

  module.exports = KeyBindingResolverView = (function(superClass) {
    extend(KeyBindingResolverView, superClass);

    function KeyBindingResolverView() {
      return KeyBindingResolverView.__super__.constructor.apply(this, arguments);
    }

    KeyBindingResolverView.content = function() {
      return this.div({
        "class": 'key-binding-resolver'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'panel-heading padded'
          }, function() {
            _this.span('Key Binding Resolver: ');
            return _this.span({
              outlet: 'keystroke'
            }, 'Press any key');
          });
          return _this.div({
            outlet: 'commands',
            "class": 'panel-body padded'
          });
        };
      })(this));
    };

    KeyBindingResolverView.prototype.initialize = function() {
      return this.on('click', '.source', (function(_this) {
        return function(arg) {
          var target;
          target = arg.target;
          return _this.openKeybindingFile(target.innerText);
        };
      })(this));
    };

    KeyBindingResolverView.prototype.serialize = function() {
      var ref2;
      return {
        attached: (ref2 = this.panel) != null ? ref2.isVisible() : void 0
      };
    };

    KeyBindingResolverView.prototype.destroy = function() {
      return this.detach();
    };

    KeyBindingResolverView.prototype.toggle = function() {
      var ref2;
      if ((ref2 = this.panel) != null ? ref2.isVisible() : void 0) {
        return this.detach();
      } else {
        return this.attach();
      }
    };

    KeyBindingResolverView.prototype.attach = function() {
      this.disposables = new CompositeDisposable;
      this.panel = atom.workspace.addBottomPanel({
        item: this
      });
      this.disposables.add(new Disposable((function(_this) {
        return function() {
          _this.panel.destroy();
          return _this.panel = null;
        };
      })(this)));
      this.disposables.add(atom.keymaps.onDidMatchBinding((function(_this) {
        return function(arg) {
          var binding, eventType, keyboardEventTarget, keystrokes;
          keystrokes = arg.keystrokes, binding = arg.binding, keyboardEventTarget = arg.keyboardEventTarget, eventType = arg.eventType;
          return _this.update(keystrokes, binding, keyboardEventTarget, eventType);
        };
      })(this)));
      this.disposables.add(atom.keymaps.onDidPartiallyMatchBindings((function(_this) {
        return function(arg) {
          var eventType, keyboardEventTarget, keystrokes, partiallyMatchedBindings;
          keystrokes = arg.keystrokes, partiallyMatchedBindings = arg.partiallyMatchedBindings, keyboardEventTarget = arg.keyboardEventTarget, eventType = arg.eventType;
          return _this.updatePartial(keystrokes, partiallyMatchedBindings);
        };
      })(this)));
      return this.disposables.add(atom.keymaps.onDidFailToMatchBinding((function(_this) {
        return function(arg) {
          var eventType, keyboardEventTarget, keystrokes;
          keystrokes = arg.keystrokes, keyboardEventTarget = arg.keyboardEventTarget, eventType = arg.eventType;
          return _this.update(keystrokes, null, keyboardEventTarget, eventType);
        };
      })(this)));
    };

    KeyBindingResolverView.prototype.detach = function() {
      var ref2;
      return (ref2 = this.disposables) != null ? ref2.dispose() : void 0;
    };

    KeyBindingResolverView.prototype.update = function(keystrokes, keyBinding, keyboardEventTarget, eventType) {
      var unmatchedKeyBindings, unusedKeyBindings;
      if (eventType === 'keyup' && keyBinding === null) {
        return;
      }
      this.keystroke.html($$(function() {
        return this.span({
          "class": 'keystroke'
        }, keystrokes);
      }));
      unusedKeyBindings = atom.keymaps.findKeyBindings({
        keystrokes: keystrokes,
        target: keyboardEventTarget
      }).filter(function(binding) {
        return binding !== keyBinding;
      });
      unmatchedKeyBindings = atom.keymaps.findKeyBindings({
        keystrokes: keystrokes
      }).filter(function(binding) {
        return binding !== keyBinding && indexOf.call(unusedKeyBindings, binding) < 0;
      });
      return this.commands.html($$(function() {
        return this.table({
          "class": 'table-condensed'
        }, (function(_this) {
          return function() {
            var binding, i, j, len, len1, results;
            if (keyBinding) {
              _this.tr({
                "class": 'used'
              }, function() {
                _this.td({
                  "class": 'command'
                }, keyBinding.command);
                _this.td({
                  "class": 'selector'
                }, keyBinding.selector);
                return _this.td({
                  "class": 'source'
                }, keyBinding.source);
              });
            }
            for (i = 0, len = unusedKeyBindings.length; i < len; i++) {
              binding = unusedKeyBindings[i];
              _this.tr({
                "class": 'unused'
              }, function() {
                _this.td({
                  "class": 'command'
                }, binding.command);
                _this.td({
                  "class": 'selector'
                }, binding.selector);
                return _this.td({
                  "class": 'source'
                }, binding.source);
              });
            }
            results = [];
            for (j = 0, len1 = unmatchedKeyBindings.length; j < len1; j++) {
              binding = unmatchedKeyBindings[j];
              results.push(_this.tr({
                "class": 'unmatched'
              }, function() {
                _this.td({
                  "class": 'command'
                }, binding.command);
                _this.td({
                  "class": 'selector'
                }, binding.selector);
                return _this.td({
                  "class": 'source'
                }, binding.source);
              }));
            }
            return results;
          };
        })(this));
      }));
    };

    KeyBindingResolverView.prototype.updatePartial = function(keystrokes, keyBindings) {
      this.keystroke.html($$(function() {
        return this.span({
          "class": 'keystroke'
        }, keystrokes + " (partial)");
      }));
      return this.commands.html($$(function() {
        return this.table({
          "class": 'table-condensed'
        }, (function(_this) {
          return function() {
            var binding, i, len, results;
            results = [];
            for (i = 0, len = keyBindings.length; i < len; i++) {
              binding = keyBindings[i];
              results.push(_this.tr({
                "class": 'unused'
              }, function() {
                _this.td({
                  "class": 'command'
                }, binding.command);
                _this.td({
                  "class": 'keystrokes'
                }, binding.keystrokes);
                _this.td({
                  "class": 'selector'
                }, binding.selector);
                return _this.td({
                  "class": 'source'
                }, binding.source);
              }));
            }
            return results;
          };
        })(this));
      }));
    };

    KeyBindingResolverView.prototype.isInAsarArchive = function(pathToCheck) {
      var resourcePath;
      resourcePath = atom.getLoadSettings().resourcePath;
      return pathToCheck.startsWith("" + resourcePath + path.sep) && path.extname(resourcePath) === '.asar';
    };

    KeyBindingResolverView.prototype.extractBundledKeymap = function(keymapPath) {
      var bundledKeymaps, keymap, keymapName, ref2, ref3;
      bundledKeymaps = (ref2 = require(path.join(atom.getLoadSettings().resourcePath, 'package.json'))) != null ? ref2._atomKeymaps : void 0;
      keymapName = path.basename(keymapPath);
      keymapPath = path.join(require('temp').mkdirSync('atom-bundled-keymap-'), keymapName);
      keymap = (ref3 = bundledKeymaps != null ? bundledKeymaps[keymapName] : void 0) != null ? ref3 : {};
      require('fs-plus').writeFileSync(keymapPath, JSON.stringify(keymap, null, 2));
      return keymapPath;
    };

    KeyBindingResolverView.prototype.openKeybindingFile = function(keymapPath) {
      if (this.isInAsarArchive(keymapPath)) {
        keymapPath = this.extractBundledKeymap(keymapPath);
      }
      return atom.workspace.open(keymapPath);
    };

    return KeyBindingResolverView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9rZXliaW5kaW5nLXJlc29sdmVyL2xpYi9rZXliaW5kaW5nLXJlc29sdmVyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxrRkFBQTtJQUFBOzs7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLE9BQWEsT0FBQSxDQUFRLHNCQUFSLENBQWIsRUFBQyxZQUFELEVBQUs7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixzQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sc0JBQVA7T0FBTCxFQUFvQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDbEMsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sc0JBQVA7V0FBTCxFQUFvQyxTQUFBO1lBQ2xDLEtBQUMsQ0FBQSxJQUFELENBQU0sd0JBQU47bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTTtjQUFBLE1BQUEsRUFBUSxXQUFSO2FBQU4sRUFBMkIsZUFBM0I7VUFGa0MsQ0FBcEM7aUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLE1BQUEsRUFBUSxVQUFSO1lBQW9CLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQTNCO1dBQUw7UUFKa0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBDO0lBRFE7O3FDQU9WLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEsU0FBYixFQUF3QixDQUFBLFNBQUEs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QyxRQUFMLENBQWMsVUFBZDtNQUNiLFVBQUEsR0FBYSxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQUEsQ0FBUSxNQUFSLENBQWUsQ0FBQyxTQUFoQixDQUEwQixzQkFBMUIsQ0FBVixFQUE2RCxVQUE3RDtNQUNiLE1BQUEsMEZBQXVDO01BQ3ZDLE9BQUEsQ0FBUSxTQUFSLENBQWtCLENBQUMsYUFBbkIsQ0FBaUMsVUFBakMsRUFBNkMsSUFBSSxDQUFDLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLElBQXZCLEVBQTZCLENBQTdCLENBQTdDO2FBQ0E7SUFOb0I7O3FDQVF0QixrQkFBQSxHQUFvQixTQUFDLFVBQUQ7TUFDbEIsSUFBa0QsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsVUFBakIsQ0FBbEQ7UUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLG9CQUFELENBQXNCLFVBQXRCLEVBQWI7O2FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLFVBQXBCO0lBRmtCOzs7O0tBcEdlO0FBTHJDIiwic291cmNlc0NvbnRlbnQiOlsie0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskJCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBLZXlCaW5kaW5nUmVzb2x2ZXJWaWV3IGV4dGVuZHMgVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAna2V5LWJpbmRpbmctcmVzb2x2ZXInLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWhlYWRpbmcgcGFkZGVkJywgPT5cbiAgICAgICAgQHNwYW4gJ0tleSBCaW5kaW5nIFJlc29sdmVyOiAnXG4gICAgICAgIEBzcGFuIG91dGxldDogJ2tleXN0cm9rZScsICdQcmVzcyBhbnkga2V5J1xuICAgICAgQGRpdiBvdXRsZXQ6ICdjb21tYW5kcycsIGNsYXNzOiAncGFuZWwtYm9keSBwYWRkZWQnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAb24gJ2NsaWNrJywgJy5zb3VyY2UnLCAoe3RhcmdldH0pID0+IEBvcGVuS2V5YmluZGluZ0ZpbGUodGFyZ2V0LmlubmVyVGV4dClcblxuICBzZXJpYWxpemU6IC0+XG4gICAgYXR0YWNoZWQ6IEBwYW5lbD8uaXNWaXNpYmxlKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBkZXRhY2goKVxuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAcGFuZWw/LmlzVmlzaWJsZSgpXG4gICAgICBAZGV0YWNoKClcbiAgICBlbHNlXG4gICAgICBAYXR0YWNoKClcblxuICBhdHRhY2g6IC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IHRoaXMpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgICAgQHBhbmVsID0gbnVsbFxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmtleW1hcHMub25EaWRNYXRjaEJpbmRpbmcgKHtrZXlzdHJva2VzLCBiaW5kaW5nLCBrZXlib2FyZEV2ZW50VGFyZ2V0LCBldmVudFR5cGV9KSA9PlxuICAgICAgQHVwZGF0ZShrZXlzdHJva2VzLCBiaW5kaW5nLCBrZXlib2FyZEV2ZW50VGFyZ2V0LCBldmVudFR5cGUpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ua2V5bWFwcy5vbkRpZFBhcnRpYWxseU1hdGNoQmluZGluZ3MgKHtrZXlzdHJva2VzLCBwYXJ0aWFsbHlNYXRjaGVkQmluZGluZ3MsIGtleWJvYXJkRXZlbnRUYXJnZXQsIGV2ZW50VHlwZX0pID0+XG4gICAgICBAdXBkYXRlUGFydGlhbChrZXlzdHJva2VzLCBwYXJ0aWFsbHlNYXRjaGVkQmluZGluZ3MpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20ua2V5bWFwcy5vbkRpZEZhaWxUb01hdGNoQmluZGluZyAoe2tleXN0cm9rZXMsIGtleWJvYXJkRXZlbnRUYXJnZXQsIGV2ZW50VHlwZX0pID0+XG4gICAgICBAdXBkYXRlKGtleXN0cm9rZXMsIG51bGwsIGtleWJvYXJkRXZlbnRUYXJnZXQsIGV2ZW50VHlwZSlcblxuICBkZXRhY2g6IC0+XG4gICAgQGRpc3Bvc2FibGVzPy5kaXNwb3NlKClcblxuICB1cGRhdGU6IChrZXlzdHJva2VzLCBrZXlCaW5kaW5nLCBrZXlib2FyZEV2ZW50VGFyZ2V0LCBldmVudFR5cGUpIC0+XG4gICAgcmV0dXJuIGlmIGV2ZW50VHlwZSBpcyAna2V5dXAnIGFuZCBrZXlCaW5kaW5nIGlzIG51bGxcblxuICAgIEBrZXlzdHJva2UuaHRtbCAkJCAtPlxuICAgICAgQHNwYW4gY2xhc3M6ICdrZXlzdHJva2UnLCBrZXlzdHJva2VzXG5cbiAgICB1bnVzZWRLZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3Moe2tleXN0cm9rZXMsIHRhcmdldDoga2V5Ym9hcmRFdmVudFRhcmdldH0pLmZpbHRlciAoYmluZGluZykgLT5cbiAgICAgIGJpbmRpbmcgaXNudCBrZXlCaW5kaW5nXG5cbiAgICB1bm1hdGNoZWRLZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3Moe2tleXN0cm9rZXN9KS5maWx0ZXIgKGJpbmRpbmcpIC0+XG4gICAgICBiaW5kaW5nIGlzbnQga2V5QmluZGluZyBhbmQgYmluZGluZyBub3QgaW4gdW51c2VkS2V5QmluZGluZ3NcblxuICAgIEBjb21tYW5kcy5odG1sICQkIC0+XG4gICAgICBAdGFibGUgY2xhc3M6ICd0YWJsZS1jb25kZW5zZWQnLCA9PlxuICAgICAgICBpZiBrZXlCaW5kaW5nXG4gICAgICAgICAgQHRyIGNsYXNzOiAndXNlZCcsID0+XG4gICAgICAgICAgICBAdGQgY2xhc3M6ICdjb21tYW5kJywga2V5QmluZGluZy5jb21tYW5kXG4gICAgICAgICAgICBAdGQgY2xhc3M6ICdzZWxlY3RvcicsIGtleUJpbmRpbmcuc2VsZWN0b3JcbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ3NvdXJjZScsIGtleUJpbmRpbmcuc291cmNlXG5cbiAgICAgICAgZm9yIGJpbmRpbmcgaW4gdW51c2VkS2V5QmluZGluZ3NcbiAgICAgICAgICBAdHIgY2xhc3M6ICd1bnVzZWQnLCA9PlxuICAgICAgICAgICAgQHRkIGNsYXNzOiAnY29tbWFuZCcsIGJpbmRpbmcuY29tbWFuZFxuICAgICAgICAgICAgQHRkIGNsYXNzOiAnc2VsZWN0b3InLCBiaW5kaW5nLnNlbGVjdG9yXG4gICAgICAgICAgICBAdGQgY2xhc3M6ICdzb3VyY2UnLCBiaW5kaW5nLnNvdXJjZVxuXG4gICAgICAgIGZvciBiaW5kaW5nIGluIHVubWF0Y2hlZEtleUJpbmRpbmdzXG4gICAgICAgICAgQHRyIGNsYXNzOiAndW5tYXRjaGVkJywgPT5cbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ2NvbW1hbmQnLCBiaW5kaW5nLmNvbW1hbmRcbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ3NlbGVjdG9yJywgYmluZGluZy5zZWxlY3RvclxuICAgICAgICAgICAgQHRkIGNsYXNzOiAnc291cmNlJywgYmluZGluZy5zb3VyY2VcblxuICB1cGRhdGVQYXJ0aWFsOiAoa2V5c3Ryb2tlcywga2V5QmluZGluZ3MpIC0+XG4gICAgQGtleXN0cm9rZS5odG1sICQkIC0+XG4gICAgICBAc3BhbiBjbGFzczogJ2tleXN0cm9rZScsIFwiI3trZXlzdHJva2VzfSAocGFydGlhbClcIlxuXG4gICAgQGNvbW1hbmRzLmh0bWwgJCQgLT5cbiAgICAgIEB0YWJsZSBjbGFzczogJ3RhYmxlLWNvbmRlbnNlZCcsID0+XG4gICAgICAgIGZvciBiaW5kaW5nIGluIGtleUJpbmRpbmdzXG4gICAgICAgICAgQHRyIGNsYXNzOiAndW51c2VkJywgPT5cbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ2NvbW1hbmQnLCBiaW5kaW5nLmNvbW1hbmRcbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ2tleXN0cm9rZXMnLCBiaW5kaW5nLmtleXN0cm9rZXNcbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ3NlbGVjdG9yJywgYmluZGluZy5zZWxlY3RvclxuICAgICAgICAgICAgQHRkIGNsYXNzOiAnc291cmNlJywgYmluZGluZy5zb3VyY2VcblxuICBpc0luQXNhckFyY2hpdmU6IChwYXRoVG9DaGVjaykgLT5cbiAgICB7cmVzb3VyY2VQYXRofSA9IGF0b20uZ2V0TG9hZFNldHRpbmdzKClcbiAgICBwYXRoVG9DaGVjay5zdGFydHNXaXRoKFwiI3tyZXNvdXJjZVBhdGh9I3twYXRoLnNlcH1cIikgYW5kIHBhdGguZXh0bmFtZShyZXNvdXJjZVBhdGgpIGlzICcuYXNhcidcblxuICBleHRyYWN0QnVuZGxlZEtleW1hcDogKGtleW1hcFBhdGgpIC0+XG4gICAgYnVuZGxlZEtleW1hcHMgPSByZXF1aXJlKHBhdGguam9pbihhdG9tLmdldExvYWRTZXR0aW5ncygpLnJlc291cmNlUGF0aCwgJ3BhY2thZ2UuanNvbicpKT8uX2F0b21LZXltYXBzXG4gICAga2V5bWFwTmFtZSA9IHBhdGguYmFzZW5hbWUoa2V5bWFwUGF0aClcbiAgICBrZXltYXBQYXRoID0gcGF0aC5qb2luKHJlcXVpcmUoJ3RlbXAnKS5ta2RpclN5bmMoJ2F0b20tYnVuZGxlZC1rZXltYXAtJyksIGtleW1hcE5hbWUpXG4gICAga2V5bWFwID0gYnVuZGxlZEtleW1hcHM/W2tleW1hcE5hbWVdID8ge31cbiAgICByZXF1aXJlKCdmcy1wbHVzJykud3JpdGVGaWxlU3luYyhrZXltYXBQYXRoLCBKU09OLnN0cmluZ2lmeShrZXltYXAsIG51bGwsIDIpKVxuICAgIGtleW1hcFBhdGhcblxuICBvcGVuS2V5YmluZGluZ0ZpbGU6IChrZXltYXBQYXRoKSAtPlxuICAgIGtleW1hcFBhdGggPSBAZXh0cmFjdEJ1bmRsZWRLZXltYXAoa2V5bWFwUGF0aCkgaWYgQGlzSW5Bc2FyQXJjaGl2ZShrZXltYXBQYXRoKVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oa2V5bWFwUGF0aClcbiJdfQ==
