(function() {
  var $, $$$, KeybindingsPanel, PackageKeymapView, View, _, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), $ = ref.$, $$$ = ref.$$$, View = ref.View;

  KeybindingsPanel = require('./keybindings-panel');

  module.exports = PackageKeymapView = (function(superClass) {
    extend(PackageKeymapView, superClass);

    function PackageKeymapView() {
      return PackageKeymapView.__super__.constructor.apply(this, arguments);
    }

    PackageKeymapView.content = function() {
      return this.section({
        "class": 'section'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'section-heading icon icon-keyboard'
          }, 'Keybindings');
          _this.div({
            "class": 'checkbox'
          }, function() {
            _this.label({
              "for": 'toggleKeybindings'
            }, function() {
              _this.input({
                id: 'toggleKeybindings',
                type: 'checkbox',
                outlet: 'keybindingToggle'
              });
              return _this.div({
                "class": 'setting-title'
              }, 'Enable');
            });
            return _this.div({
              "class": 'setting-description'
            }, 'Disable this if you want to bind your own keystrokes for this package\'s commands in your keymap.');
          });
          return _this.table({
            "class": 'package-keymap-table table native-key-bindings text',
            tabindex: -1
          }, function() {
            _this.thead(function() {
              return _this.tr(function() {
                _this.th('Keystroke');
                _this.th('Command');
                _this.th('Selector');
                return _this.th('Source');
              });
            });
            return _this.tbody({
              outlet: 'keybindingItems'
            });
          });
        };
      })(this));
    };

    PackageKeymapView.prototype.initialize = function(pack) {
      var hasKeymaps, i, len, map, packageKeymapsPath, ref1, ref2, ref3;
      this.pack = pack;
      this.otherPlatformPattern = new RegExp("\\.platform-(?!" + (_.escapeRegExp(process.platform)) + "\\b)");
      this.namespace = this.pack.name;
      this.keybindingToggle.prop('checked', !_.include((ref1 = atom.config.get('core.packagesWithKeymapsDisabled')) != null ? ref1 : [], this.namespace));
      this.keybindingToggle.on('change', (function(_this) {
        return function(event) {
          var value;
          event.stopPropagation();
          value = !!_this.keybindingToggle.prop('checked');
          if (value) {
            atom.config.removeAtKeyPath('core.packagesWithKeymapsDisabled', _this.namespace);
          } else {
            atom.config.pushAtKeyPath('core.packagesWithKeymapsDisabled', _this.namespace);
          }
          return _this.updateKeyBindingView();
        };
      })(this));
      this.updateKeyBindingView();
      hasKeymaps = false;
      ref2 = atom.packages.getLoadedPackage(this.namespace).keymaps;
      for (i = 0, len = ref2.length; i < len; i++) {
        ref3 = ref2[i], packageKeymapsPath = ref3[0], map = ref3[1];
        if (map.length > 0) {
          hasKeymaps = true;
          break;
        }
      }
      if (!(this.keybindingItems.children().length > 0 || hasKeymaps)) {
        return this.hide();
      }
    };

    PackageKeymapView.prototype.updateKeyBindingView = function() {
      var command, i, keyBinding, keyBindingView, keystrokes, len, ref1, selector, source;
      this.keybindingItems.empty();
      ref1 = atom.keymaps.getKeyBindings();
      for (i = 0, len = ref1.length; i < len; i++) {
        keyBinding = ref1[i];
        command = keyBinding.command, keystrokes = keyBinding.keystrokes, selector = keyBinding.selector, source = keyBinding.source;
        if ((command != null ? typeof command.indexOf === "function" ? command.indexOf(this.namespace + ":") : void 0 : void 0) !== 0) {
          continue;
        }
        if (this.otherPlatformPattern.test(selector)) {
          continue;
        }
        keyBindingView = $$$(function() {
          return this.tr((function(_this) {
            return function() {
              _this.td(function() {
                _this.span({
                  "class": 'icon icon-clippy copy-icon'
                });
                return _this.span(keystrokes);
              });
              _this.td(command);
              _this.td(selector);
              return _this.td(KeybindingsPanel.determineSource(source));
            };
          })(this));
        });
        keyBindingView = $(keyBindingView);
        keyBindingView.data('keyBinding', keyBinding);
        this.keybindingItems.append(keyBindingView);
      }
      return this.on('click', '.copy-icon', (function(_this) {
        return function(arg) {
          var target;
          target = arg.target;
          keyBinding = $(target).closest('tr').data('keyBinding');
          return _this.writeKeyBindingToClipboard(keyBinding);
        };
      })(this));
    };

    PackageKeymapView.prototype.writeKeyBindingToClipboard = function(arg) {
      var command, content, keymapExtension, keystrokes, selector;
      selector = arg.selector, keystrokes = arg.keystrokes, command = arg.command;
      keymapExtension = path.extname(atom.keymaps.getUserKeymapPath());
      if (keymapExtension === '.cson') {
        content = "'" + selector + "':\n  '" + keystrokes + "': '" + command + "'";
      } else {
        content = "\"" + selector + "\": {\n  \"" + keystrokes + "\": \"" + command + "\"\n}";
      }
      return atom.clipboard.write(content);
    };

    return PackageKeymapView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLWtleW1hcC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsK0RBQUE7SUFBQTs7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBaUIsT0FBQSxDQUFRLHNCQUFSLENBQWpCLEVBQUMsU0FBRCxFQUFJLGFBQUosRUFBUzs7RUFDVCxnQkFBQSxHQUFtQixPQUFBLENBQVEscUJBQVI7O0VBR25CLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLE9BQUQsQ0FBUztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtPQUFULEVBQTJCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN6QixLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQ0FBUDtXQUFMLEVBQWtELGFBQWxEO1VBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sVUFBUDtXQUFMLEVBQXdCLFNBQUE7WUFDdEIsS0FBQyxDQUFBLEtBQUQsQ0FBTztjQUFBLENBQUEsR0FBQSxDQUFBLEVBQUssbUJBQUw7YUFBUCxFQUFpQyxTQUFBO2NBQy9CLEtBQUMsQ0FBQSxLQUFELENBQU87Z0JBQUEsRUFBQSxFQUFJLG1CQUFKO2dCQUF5QixJQUFBLEVBQU0sVUFBL0I7Z0JBQTJDLE1BQUEsRUFBUSxrQkFBbkQ7ZUFBUDtxQkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVB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Q0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBYixDQUFBLENBQWI7TUFDbEIsSUFBRyxlQUFBLEtBQW1CLE9BQXRCO1FBQ0UsT0FBQSxHQUFVLEdBQUEsR0FDTCxRQURLLEdBQ0ksU0FESixHQUVILFVBRkcsR0FFUSxNQUZSLEdBRWMsT0FGZCxHQUVzQixJQUhsQztPQUFBLE1BQUE7UUFNRSxPQUFBLEdBQVUsSUFBQSxHQUNMLFFBREssR0FDSSxhQURKLEdBRUgsVUFGRyxHQUVRLFFBRlIsR0FFYyxPQUZkLEdBRXNCLFFBUmxDOzthQVdBLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixPQUFyQjtJQWIwQjs7OztLQXJFRTtBQVBoQyIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbnskLCAkJCQsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5LZXliaW5kaW5nc1BhbmVsID0gcmVxdWlyZSAnLi9rZXliaW5kaW5ncy1wYW5lbCdcblxuIyBEaXNwbGF5cyB0aGUga2V5YmluZGluZ3MgZm9yIGEgcGFja2FnZSBuYW1lc3BhY2Vcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VLZXltYXBWaWV3IGV4dGVuZHMgVmlld1xuICBAY29udGVudDogLT5cbiAgICBAc2VjdGlvbiBjbGFzczogJ3NlY3Rpb24nLCA9PlxuICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24taGVhZGluZyBpY29uIGljb24ta2V5Ym9hcmQnLCAnS2V5YmluZGluZ3MnXG4gICAgICBAZGl2IGNsYXNzOiAnY2hlY2tib3gnLCA9PlxuICAgICAgICBAbGFiZWwgZm9yOiAndG9nZ2xlS2V5YmluZGluZ3MnLCA9PlxuICAgICAgICAgIEBpbnB1dCBpZDogJ3RvZ2dsZUtleWJpbmRpbmdzJywgdHlwZTogJ2NoZWNrYm94Jywgb3V0bGV0OiAna2V5YmluZGluZ1RvZ2dsZSdcbiAgICAgICAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy10aXRsZScsICdFbmFibGUnXG4gICAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLWRlc2NyaXB0aW9uJywgJ0Rpc2FibGUgdGhpcyBpZiB5b3Ugd2FudCB0byBiaW5kIHlvdXIgb3duIGtleXN0cm9rZXMgZm9yIHRoaXMgcGFja2FnZVxcJ3MgY29tbWFuZHMgaW4geW91ciBrZXltYXAuJ1xuICAgICAgQHRhYmxlIGNsYXNzOiAncGFja2FnZS1rZXltYXAtdGFibGUgdGFibGUgbmF0aXZlLWtleS1iaW5kaW5ncyB0ZXh0JywgdGFiaW5kZXg6IC0xLCA9PlxuICAgICAgICBAdGhlYWQgPT5cbiAgICAgICAgICBAdHIgPT5cbiAgICAgICAgICAgIEB0aCAnS2V5c3Ryb2tlJ1xuICAgICAgICAgICAgQHRoICdDb21tYW5kJ1xuICAgICAgICAgICAgQHRoICdTZWxlY3RvcidcbiAgICAgICAgICAgIEB0aCAnU291cmNlJ1xuICAgICAgICBAdGJvZHkgb3V0bGV0OiAna2V5YmluZGluZ0l0ZW1zJ1xuXG4gIGluaXRpYWxpemU6IChAcGFjaykgLT5cbiAgICBAb3RoZXJQbGF0Zm9ybVBhdHRlcm4gPSBuZXcgUmVnRXhwKFwiXFxcXC5wbGF0Zm9ybS0oPyEje18uZXNjYXBlUmVnRXhwKHByb2Nlc3MucGxhdGZvcm0pfVxcXFxiKVwiKVxuICAgIEBuYW1lc3BhY2UgPSBAcGFjay5uYW1lXG5cbiAgICBAa2V5YmluZGluZ1RvZ2dsZS5wcm9wKCdjaGVja2VkJywgbm90IF8uaW5jbHVkZShhdG9tLmNvbmZpZy5nZXQoJ2NvcmUucGFja2FnZXNXaXRoS2V5bWFwc0Rpc2FibGVkJykgPyBbXSwgQG5hbWVzcGFjZSkpXG5cbiAgICBAa2V5YmluZGluZ1RvZ2dsZS5vbiAnY2hhbmdlJywgKGV2ZW50KSA9PlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIHZhbHVlID0gISFAa2V5YmluZGluZ1RvZ2dsZS5wcm9wKCdjaGVja2VkJylcbiAgICAgIGlmIHZhbHVlXG4gICAgICAgIGF0b20uY29uZmlnLnJlbW92ZUF0S2V5UGF0aCgnY29yZS5wYWNrYWdlc1dpdGhLZXltYXBzRGlzYWJsZWQnLCBAbmFtZXNwYWNlKVxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLmNvbmZpZy5wdXNoQXRLZXlQYXRoKCdjb3JlLnBhY2thZ2VzV2l0aEtleW1hcHNEaXNhYmxlZCcsIEBuYW1lc3BhY2UpXG5cbiAgICAgIEB1cGRhdGVLZXlCaW5kaW5nVmlldygpXG5cbiAgICBAdXBkYXRlS2V5QmluZGluZ1ZpZXcoKVxuXG4gICAgaGFzS2V5bWFwcyA9IGZhbHNlXG4gICAgZm9yIFtwYWNrYWdlS2V5bWFwc1BhdGgsIG1hcF0gaW4gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlKEBuYW1lc3BhY2UpLmtleW1hcHNcbiAgICAgIGlmIG1hcC5sZW5ndGggPiAwXG4gICAgICAgIGhhc0tleW1hcHMgPSB0cnVlXG4gICAgICAgIGJyZWFrXG5cbiAgICBAaGlkZSgpIHVubGVzcyBAa2V5YmluZGluZ0l0ZW1zLmNoaWxkcmVuKCkubGVuZ3RoID4gMCBvciBoYXNLZXltYXBzXG5cbiAgdXBkYXRlS2V5QmluZGluZ1ZpZXc6IC0+XG4gICAgQGtleWJpbmRpbmdJdGVtcy5lbXB0eSgpXG5cbiAgICBmb3Iga2V5QmluZGluZyBpbiBhdG9tLmtleW1hcHMuZ2V0S2V5QmluZGluZ3MoKVxuICAgICAge2NvbW1hbmQsIGtleXN0cm9rZXMsIHNlbGVjdG9yLCBzb3VyY2V9ID0ga2V5QmluZGluZ1xuICAgICAgY29udGludWUgdW5sZXNzIGNvbW1hbmQ/LmluZGV4T2Y/KFwiI3tAbmFtZXNwYWNlfTpcIikgaXMgMFxuICAgICAgY29udGludWUgaWYgQG90aGVyUGxhdGZvcm1QYXR0ZXJuLnRlc3Qoc2VsZWN0b3IpXG5cbiAgICAgIGtleUJpbmRpbmdWaWV3ID0gJCQkIC0+XG4gICAgICAgIEB0ciA9PlxuICAgICAgICAgIEB0ZCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdpY29uIGljb24tY2xpcHB5IGNvcHktaWNvbidcbiAgICAgICAgICAgIEBzcGFuIGtleXN0cm9rZXNcbiAgICAgICAgICBAdGQgY29tbWFuZFxuICAgICAgICAgIEB0ZCBzZWxlY3RvclxuICAgICAgICAgIEB0ZCBLZXliaW5kaW5nc1BhbmVsLmRldGVybWluZVNvdXJjZShzb3VyY2UpXG4gICAgICBrZXlCaW5kaW5nVmlldyA9ICQoa2V5QmluZGluZ1ZpZXcpXG4gICAgICBrZXlCaW5kaW5nVmlldy5kYXRhKCdrZXlCaW5kaW5nJywga2V5QmluZGluZylcblxuICAgICAgQGtleWJpbmRpbmdJdGVtcy5hcHBlbmQoa2V5QmluZGluZ1ZpZXcpXG5cbiAgICBAb24gJ2NsaWNrJywgJy5jb3B5LWljb24nLCAoe3RhcmdldH0pID0+XG4gICAgICBrZXlCaW5kaW5nID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ3RyJykuZGF0YSgna2V5QmluZGluZycpXG4gICAgICBAd3JpdGVLZXlCaW5kaW5nVG9DbGlwYm9hcmQoa2V5QmluZGluZylcblxuICB3cml0ZUtleUJpbmRpbmdUb0NsaXBib2FyZDogKHtzZWxlY3Rvciwga2V5c3Ryb2tlcywgY29tbWFuZH0pIC0+XG4gICAga2V5bWFwRXh0ZW5zaW9uID0gcGF0aC5leHRuYW1lKGF0b20ua2V5bWFwcy5nZXRVc2VyS2V5bWFwUGF0aCgpKVxuICAgIGlmIGtleW1hcEV4dGVuc2lvbiBpcyAnLmNzb24nXG4gICAgICBjb250ZW50ID0gXCJcIlwiXG4gICAgICAgICcje3NlbGVjdG9yfSc6XG4gICAgICAgICAgJyN7a2V5c3Ryb2tlc30nOiAnI3tjb21tYW5kfSdcbiAgICAgIFwiXCJcIlxuICAgIGVsc2VcbiAgICAgIGNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgXCIje3NlbGVjdG9yfVwiOiB7XG4gICAgICAgICAgXCIje2tleXN0cm9rZXN9XCI6IFwiI3tjb21tYW5kfVwiXG4gICAgICAgIH1cbiAgICAgIFwiXCJcIlxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGNvbnRlbnQpXG4iXX0=
