(function() {
  var $, $$$, CompositeDisposable, KeybindingsPanel, ScrollView, TextEditorView, _, path, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, $$$ = ref.$$$, TextEditorView = ref.TextEditorView, ScrollView = ref.ScrollView;

  _ = require('underscore-plus');

  path = require('path');

  module.exports = KeybindingsPanel = (function(superClass) {
    extend(KeybindingsPanel, superClass);

    function KeybindingsPanel() {
      return KeybindingsPanel.__super__.constructor.apply(this, arguments);
    }

    KeybindingsPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          return _this.section({
            "class": 'keybinding-panel section'
          }, function() {
            _this.div({
              "class": 'section-heading icon icon-keyboard'
            }, 'Keybindings');
            _this.div({
              "class": 'text native-key-bindings',
              tabindex: -1
            }, function() {
              _this.span({
                "class": 'icon icon-question'
              });
              _this.span('You can override these keybindings by copying ');
              _this.span({
                "class": 'icon icon-clippy'
              });
              _this.span('and pasting them into ');
              return _this.a({
                "class": 'link',
                outlet: 'openUserKeymap'
              }, 'your keymap file');
            });
            _this.div({
              "class": 'editor-container'
            }, function() {
              return _this.subview('searchEditorView', new TextEditorView({
                mini: true
              }));
            });
            return _this.table({
              "class": 'native-key-bindings table text',
              tabindex: -1
            }, function() {
              _this.col({
                "class": 'keystroke'
              });
              _this.col({
                "class": 'command'
              });
              _this.col({
                "class": 'source'
              });
              _this.col({
                "class": 'selector'
              });
              _this.thead(function() {
                return _this.tr(function() {
                  _this.th({
                    "class": 'keystroke'
                  }, 'Keystroke');
                  _this.th({
                    "class": 'command'
                  }, 'Command');
                  _this.th({
                    "class": 'source'
                  }, 'Source');
                  return _this.th({
                    "class": 'selector'
                  }, 'Selector');
                });
              });
              return _this.tbody({
                outlet: 'keybindingRows'
              });
            });
          });
        };
      })(this));
    };

    KeybindingsPanel.prototype.initialize = function() {
      KeybindingsPanel.__super__.initialize.apply(this, arguments);
      this.disposables = new CompositeDisposable();
      this.otherPlatformPattern = new RegExp("\\.platform-(?!" + (_.escapeRegExp(process.platform)) + "\\b)");
      this.platformPattern = new RegExp("\\.platform-" + (_.escapeRegExp(process.platform)) + "\\b");
      this.openUserKeymap.on('click', function() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open-your-keymap');
        return false;
      });
      this.searchEditorView.getModel().setPlaceholderText('Search keybindings');
      this.searchEditorView.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.filterKeyBindings(_this.keyBindings, _this.searchEditorView.getText());
        };
      })(this));
      this.on('click', '.copy-icon', (function(_this) {
        return function(arg) {
          var keyBinding, target;
          target = arg.target;
          keyBinding = $(target).closest('tr').data('keyBinding');
          return _this.writeKeyBindingToClipboard(keyBinding);
        };
      })(this));
      this.disposables.add(atom.keymaps.onDidReloadKeymap((function(_this) {
        return function() {
          return _this.loadKeyBindings();
        };
      })(this)));
      this.disposables.add(atom.keymaps.onDidUnloadKeymap((function(_this) {
        return function() {
          return _this.loadKeyBindings();
        };
      })(this)));
      return this.loadKeyBindings();
    };

    KeybindingsPanel.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    KeybindingsPanel.prototype.loadKeyBindings = function() {
      this.keybindingRows.empty();
      this.keyBindings = _.sortBy(atom.keymaps.getKeyBindings(), 'keystrokes');
      this.appendKeyBindings(this.keyBindings);
      return this.filterKeyBindings(this.keyBindings, this.searchEditorView.getText());
    };

    KeybindingsPanel.prototype.focus = function() {
      return this.searchEditorView.focus();
    };

    KeybindingsPanel.prototype.filterKeyBindings = function(keyBindings, filterString) {
      var command, i, keyBinding, keystrokes, keywords, len, results, searchString, selector, source;
      this.keybindingRows.empty();
      results = [];
      for (i = 0, len = keyBindings.length; i < len; i++) {
        keyBinding = keyBindings[i];
        selector = keyBinding.selector, keystrokes = keyBinding.keystrokes, command = keyBinding.command, source = keyBinding.source;
        source = KeybindingsPanel.determineSource(source);
        searchString = ("" + selector + keystrokes + command + source).toLowerCase();
        if (!searchString) {
          continue;
        }
        keywords = filterString.trim().toLowerCase().split(' ');
        if (keywords.every(function(keyword) {
          return searchString.indexOf(keyword) !== -1;
        })) {
          results.push(this.appendKeyBinding(keyBinding));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    KeybindingsPanel.prototype.appendKeyBindings = function(keyBindings) {
      var i, keyBinding, len, results;
      results = [];
      for (i = 0, len = keyBindings.length; i < len; i++) {
        keyBinding = keyBindings[i];
        results.push(this.appendKeyBinding(keyBinding));
      }
      return results;
    };

    KeybindingsPanel.prototype.appendKeyBinding = function(keyBinding) {
      var view;
      if (!this.showSelector(keyBinding.selector)) {
        return;
      }
      view = $(this.elementForKeyBinding(keyBinding));
      view.data('keyBinding', keyBinding);
      return this.keybindingRows.append(view);
    };

    KeybindingsPanel.prototype.showSelector = function(selector) {
      var i, len, ref1, segment, segments;
      segments = (ref1 = selector != null ? selector.split(',') : void 0) != null ? ref1 : [];
      if (!segments) {
        return true;
      }
      for (i = 0, len = segments.length; i < len; i++) {
        segment = segments[i];
        if (this.platformPattern.test(segment)) {
          return true;
        }
        if (!this.otherPlatformPattern.test(segment)) {
          return true;
        }
      }
      return false;
    };

    KeybindingsPanel.prototype.elementForKeyBinding = function(keyBinding) {
      var command, keystrokes, selector, source;
      selector = keyBinding.selector, keystrokes = keyBinding.keystrokes, command = keyBinding.command, source = keyBinding.source;
      source = KeybindingsPanel.determineSource(source);
      return $$$(function() {
        var rowClasses;
        rowClasses = source === 'User' ? 'is-user' : '';
        return this.tr({
          "class": rowClasses
        }, (function(_this) {
          return function() {
            _this.td({
              "class": 'keystroke'
            }, function() {
              _this.span({
                "class": 'icon icon-clippy copy-icon'
              });
              return _this.span(keystrokes);
            });
            _this.td({
              "class": 'command'
            }, command);
            _this.td({
              "class": 'source'
            }, source);
            return _this.td({
              "class": 'selector'
            }, selector);
          };
        })(this));
      });
    };

    KeybindingsPanel.prototype.writeKeyBindingToClipboard = function(arg) {
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

    KeybindingsPanel.determineSource = function(filePath) {
      var packageName, packageNameIndex, pathParts, ref1;
      if (!filePath) {
        return 'Unknown';
      }
      if (filePath.indexOf(path.join(atom.getLoadSettings().resourcePath, 'keymaps')) === 0) {
        return 'Core';
      } else if (filePath === atom.keymaps.getUserKeymapPath()) {
        return 'User';
      } else {
        pathParts = filePath.split(path.sep);
        packageNameIndex = pathParts.length - 3;
        packageName = (ref1 = pathParts[packageNameIndex]) != null ? ref1 : '';
        return _.undasherize(_.uncamelcase(packageName));
      }
    };

    return KeybindingsPanel;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9rZXliaW5kaW5ncy1wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVGQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsTUFBdUMsT0FBQSxDQUFRLHNCQUFSLENBQXZDLEVBQUMsU0FBRCxFQUFJLGFBQUosRUFBUyxtQ0FBVCxFQUF5Qjs7RUFDekIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNKLGdCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO09BQUwsRUFBMkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN6QixLQUFDLENBQUEsT0FBRCxDQUFTO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTywwQkFBUDtXQUFULEVBQTRDLFNBQUE7WUFDMUMsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0NBQVA7YUFBTCxFQUFrRCxhQUFsRDtZQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDBCQUFQO2NBQW1DLFFBQUEsRUFBVSxDQUFDLENBQTlDO2FBQUwsRUFBc0QsU0FBQTtjQUNwRCxLQUFDLENBQUEsSUFBRCxDQUFNO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0JBQVA7ZUFBTjtjQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sZ0RBQU47Y0FDQSxLQUFDLENBQUEsSUFBRCxD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d0IsUUFBeEI7QUFBQSxlQUFPLFVBQVA7O01BRUEsSUFBRyxRQUFRLENBQUMsT0FBVCxDQUFpQixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUksQ0FBQyxlQUFMLENBQUEsQ0FBc0IsQ0FBQyxZQUFqQyxFQUErQyxTQUEvQyxDQUFqQixDQUFBLEtBQStFLENBQWxGO2VBQ0UsT0FERjtPQUFBLE1BRUssSUFBRyxRQUFBLEtBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBYixDQUFBLENBQWY7ZUFDSCxPQURHO09BQUEsTUFBQTtRQUdILFNBQUEsR0FBWSxRQUFRLENBQUMsS0FBVCxDQUFlLElBQUksQ0FBQyxHQUFwQjtRQUNaLGdCQUFBLEdBQW1CLFNBQVMsQ0FBQyxNQUFWLEdBQW1CO1FBQ3RDLFdBQUEseURBQTRDO2VBQzVDLENBQUMsQ0FBQyxXQUFGLENBQWMsQ0FBQyxDQUFDLFdBQUYsQ0FBYyxXQUFkLENBQWQsRUFORzs7SUFMVzs7OztLQXhJVztBQU4vQiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57JCwgJCQkLCBUZXh0RWRpdG9yVmlldywgU2Nyb2xsVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgS2V5YmluZGluZ3NQYW5lbCBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3BhbmVscy1pdGVtJywgPT5cbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAna2V5YmluZGluZy1wYW5lbCBzZWN0aW9uJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24taGVhZGluZyBpY29uIGljb24ta2V5Ym9hcmQnLCAnS2V5YmluZGluZ3MnXG5cbiAgICAgICAgQGRpdiBjbGFzczogJ3RleHQgbmF0aXZlLWtleS1iaW5kaW5ncycsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1xdWVzdGlvbidcbiAgICAgICAgICBAc3BhbiAnWW91IGNhbiBvdmVycmlkZSB0aGVzZSBrZXliaW5kaW5ncyBieSBjb3B5aW5nICdcbiAgICAgICAgICBAc3BhbiBjbGFzczogJ2ljb24gaWNvbi1jbGlwcHknXG4gICAgICAgICAgQHNwYW4gJ2FuZCBwYXN0aW5nIHRoZW0gaW50byAnXG4gICAgICAgICAgQGEgY2xhc3M6ICdsaW5rJywgb3V0bGV0OiAnb3BlblVzZXJLZXltYXAnLCAneW91ciBrZXltYXAgZmlsZSdcblxuICAgICAgICBAZGl2IGNsYXNzOiAnZWRpdG9yLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgQHN1YnZpZXcgJ3NlYXJjaEVkaXRvclZpZXcnLCBuZXcgVGV4dEVkaXRvclZpZXcobWluaTogdHJ1ZSlcblxuICAgICAgICBAdGFibGUgY2xhc3M6ICduYXRpdmUta2V5LWJpbmRpbmdzIHRhYmxlIHRleHQnLCB0YWJpbmRleDogLTEsID0+XG4gICAgICAgICAgQGNvbCBjbGFzczogJ2tleXN0cm9rZSdcbiAgICAgICAgICBAY29sIGNsYXNzOiAnY29tbWFuZCdcbiAgICAgICAgICBAY29sIGNsYXNzOiAnc291cmNlJ1xuICAgICAgICAgIEBjb2wgY2xhc3M6ICdzZWxlY3RvcidcbiAgICAgICAgICBAdGhlYWQgPT5cbiAgICAgICAgICAgIEB0ciA9PlxuICAgICAgICAgICAgICBAdGggY2xhc3M6ICdrZXlzdHJva2UnLCAnS2V5c3Ryb2tlJ1xuICAgICAgICAgICAgICBAdGggY2xhc3M6ICdjb21tYW5kJywgJ0NvbW1hbmQnXG4gICAgICAgICAgICAgIEB0aCBjbGFzczogJ3NvdXJjZScsICdTb3VyY2UnXG4gICAgICAgICAgICAgIEB0aCBjbGFzczogJ3NlbGVjdG9yJywgJ1NlbGVjdG9yJ1xuICAgICAgICAgIEB0Ym9keSBvdXRsZXQ6ICdrZXliaW5kaW5nUm93cydcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIEBvdGhlclBsYXRmb3JtUGF0dGVybiA9IG5ldyBSZWdFeHAoXCJcXFxcLnBsYXRmb3JtLSg/ISN7Xy5lc2NhcGVSZWdFeHAocHJvY2Vzcy5wbGF0Zm9ybSl9XFxcXGIpXCIpXG4gICAgQHBsYXRmb3JtUGF0dGVybiA9IG5ldyBSZWdFeHAoXCJcXFxcLnBsYXRmb3JtLSN7Xy5lc2NhcGVSZWdFeHAocHJvY2Vzcy5wbGF0Zm9ybSl9XFxcXGJcIilcblxuICAgIEBvcGVuVXNlcktleW1hcC5vbiAnY2xpY2snLCAtPlxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnYXBwbGljYXRpb246b3Blbi15b3VyLWtleW1hcCcpXG4gICAgICBmYWxzZVxuXG4gICAgQHNlYXJjaEVkaXRvclZpZXcuZ2V0TW9kZWwoKS5zZXRQbGFjZWhvbGRlclRleHQoJ1NlYXJjaCBrZXliaW5kaW5ncycpXG5cbiAgICBAc2VhcmNoRWRpdG9yVmlldy5nZXRNb2RlbCgpLm9uRGlkU3RvcENoYW5naW5nID0+XG4gICAgICBAZmlsdGVyS2V5QmluZGluZ3MoQGtleUJpbmRpbmdzLCBAc2VhcmNoRWRpdG9yVmlldy5nZXRUZXh0KCkpXG5cbiAgICBAb24gJ2NsaWNrJywgJy5jb3B5LWljb24nLCAoe3RhcmdldH0pID0+XG4gICAgICBrZXlCaW5kaW5nID0gJCh0YXJnZXQpLmNsb3Nlc3QoJ3RyJykuZGF0YSgna2V5QmluZGluZycpXG4gICAgICBAd3JpdGVLZXlCaW5kaW5nVG9DbGlwYm9hcmQoa2V5QmluZGluZylcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5rZXltYXBzLm9uRGlkUmVsb2FkS2V5bWFwID0+IEBsb2FkS2V5QmluZGluZ3MoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5rZXltYXBzLm9uRGlkVW5sb2FkS2V5bWFwID0+IEBsb2FkS2V5QmluZGluZ3MoKVxuXG4gICAgQGxvYWRLZXlCaW5kaW5ncygpXG5cbiAgZGlzcG9zZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgbG9hZEtleUJpbmRpbmdzOiAtPlxuICAgIEBrZXliaW5kaW5nUm93cy5lbXB0eSgpXG4gICAgQGtleUJpbmRpbmdzID0gXy5zb3J0QnkoYXRvbS5rZXltYXBzLmdldEtleUJpbmRpbmdzKCksICdrZXlzdHJva2VzJylcbiAgICBAYXBwZW5kS2V5QmluZGluZ3MoQGtleUJpbmRpbmdzKVxuICAgIEBmaWx0ZXJLZXlCaW5kaW5ncyhAa2V5QmluZGluZ3MsIEBzZWFyY2hFZGl0b3JWaWV3LmdldFRleHQoKSlcblxuICBmb2N1czogLT5cbiAgICBAc2VhcmNoRWRpdG9yVmlldy5mb2N1cygpXG5cbiAgZmlsdGVyS2V5QmluZGluZ3M6IChrZXlCaW5kaW5ncywgZmlsdGVyU3RyaW5nKSAtPlxuICAgIEBrZXliaW5kaW5nUm93cy5lbXB0eSgpXG4gICAgZm9yIGtleUJpbmRpbmcgaW4ga2V5QmluZGluZ3NcbiAgICAgIHtzZWxlY3Rvciwga2V5c3Ryb2tlcywgY29tbWFuZCwgc291cmNlfSA9IGtleUJpbmRpbmdcbiAgICAgIHNvdXJjZSA9IEtleWJpbmRpbmdzUGFuZWwuZGV0ZXJtaW5lU291cmNlKHNvdXJjZSlcbiAgICAgIHNlYXJjaFN0cmluZyA9IFwiI3tzZWxlY3Rvcn0je2tleXN0cm9rZXN9I3tjb21tYW5kfSN7c291cmNlfVwiLnRvTG93ZXJDYXNlKClcbiAgICAgIGNvbnRpbnVlIHVubGVzcyBzZWFyY2hTdHJpbmdcblxuICAgICAga2V5d29yZHMgPSBmaWx0ZXJTdHJpbmcudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKVxuICAgICAgaWYga2V5d29yZHMuZXZlcnkoKGtleXdvcmQpIC0+IHNlYXJjaFN0cmluZy5pbmRleE9mKGtleXdvcmQpIGlzbnQgLTEpXG4gICAgICAgIEBhcHBlbmRLZXlCaW5kaW5nKGtleUJpbmRpbmcpXG5cbiAgYXBwZW5kS2V5QmluZGluZ3M6IChrZXlCaW5kaW5ncykgLT5cbiAgICBAYXBwZW5kS2V5QmluZGluZyhrZXlCaW5kaW5nKSBmb3Iga2V5QmluZGluZyBpbiBrZXlCaW5kaW5nc1xuXG4gIGFwcGVuZEtleUJpbmRpbmc6IChrZXlCaW5kaW5nKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHNob3dTZWxlY3RvcihrZXlCaW5kaW5nLnNlbGVjdG9yKVxuXG4gICAgdmlldyA9ICQoQGVsZW1lbnRGb3JLZXlCaW5kaW5nKGtleUJpbmRpbmcpKVxuICAgIHZpZXcuZGF0YSgna2V5QmluZGluZycsIGtleUJpbmRpbmcpXG4gICAgQGtleWJpbmRpbmdSb3dzLmFwcGVuZCh2aWV3KVxuXG4gIHNob3dTZWxlY3RvcjogKHNlbGVjdG9yKSAtPlxuICAgIHNlZ21lbnRzID0gc2VsZWN0b3I/LnNwbGl0KCcsJykgPyBbXVxuICAgIHJldHVybiB0cnVlIHVubGVzcyBzZWdtZW50c1xuXG4gICAgZm9yIHNlZ21lbnQgaW4gc2VnbWVudHNcbiAgICAgIHJldHVybiB0cnVlIGlmIEBwbGF0Zm9ybVBhdHRlcm4udGVzdChzZWdtZW50KVxuICAgICAgcmV0dXJuIHRydWUgdW5sZXNzIEBvdGhlclBsYXRmb3JtUGF0dGVybi50ZXN0KHNlZ21lbnQpXG5cbiAgICBmYWxzZVxuXG4gIGVsZW1lbnRGb3JLZXlCaW5kaW5nOiAoa2V5QmluZGluZykgLT5cbiAgICB7c2VsZWN0b3IsIGtleXN0cm9rZXMsIGNvbW1hbmQsIHNvdXJjZX0gPSBrZXlCaW5kaW5nXG4gICAgc291cmNlID0gS2V5YmluZGluZ3NQYW5lbC5kZXRlcm1pbmVTb3VyY2Uoc291cmNlKVxuICAgICQkJCAtPlxuICAgICAgcm93Q2xhc3NlcyA9IGlmIHNvdXJjZSBpcyAnVXNlcicgdGhlbiAnaXMtdXNlcicgZWxzZSAnJ1xuICAgICAgQHRyIGNsYXNzOiByb3dDbGFzc2VzLCA9PlxuICAgICAgICBAdGQgY2xhc3M6ICdrZXlzdHJva2UnLCA9PlxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnaWNvbiBpY29uLWNsaXBweSBjb3B5LWljb24nXG4gICAgICAgICAgQHNwYW4ga2V5c3Ryb2tlc1xuICAgICAgICBAdGQgY2xhc3M6ICdjb21tYW5kJywgY29tbWFuZFxuICAgICAgICBAdGQgY2xhc3M6ICdzb3VyY2UnLCBzb3VyY2VcbiAgICAgICAgQHRkIGNsYXNzOiAnc2VsZWN0b3InLCBzZWxlY3RvclxuXG4gIHdyaXRlS2V5QmluZGluZ1RvQ2xpcGJvYXJkOiAoe3NlbGVjdG9yLCBrZXlzdHJva2VzLCBjb21tYW5kfSkgLT5cbiAgICBrZXltYXBFeHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoYXRvbS5rZXltYXBzLmdldFVzZXJLZXltYXBQYXRoKCkpXG4gICAgaWYga2V5bWFwRXh0ZW5zaW9uIGlzICcuY3NvbidcbiAgICAgIGNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgJyN7c2VsZWN0b3J9JzpcbiAgICAgICAgICAnI3trZXlzdHJva2VzfSc6ICcje2NvbW1hbmR9J1xuICAgICAgXCJcIlwiXG4gICAgZWxzZVxuICAgICAgY29udGVudCA9IFwiXCJcIlxuICAgICAgICBcIiN7c2VsZWN0b3J9XCI6IHtcbiAgICAgICAgICBcIiN7a2V5c3Ryb2tlc31cIjogXCIje2NvbW1hbmR9XCJcbiAgICAgICAgfVxuICAgICAgXCJcIlwiXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoY29udGVudClcblxuICAjIFByaXZhdGU6IFJldHVybnMgYSB1c2VyIGZyaWVuZGx5IGRlc2NyaXB0aW9uIG9mIHdoZXJlIGEga2V5YmluZGluZyB3YXNcbiAgIyBsb2FkZWQgZnJvbS5cbiAgI1xuICAjICogZmlsZVBhdGg6XG4gICMgICBUaGUgYWJzb2x1dGUgcGF0aCBmcm9tIHdoaWNoIHRoZSBrZXltYXAgd2FzIGxvYWRlZFxuICAjXG4gICMgUmV0dXJucyBvbmUgb2Y6XG4gICMgKiBgQ29yZWAgaW5kaWNhdGVzIGl0IGNvbWVzIGZyb20gYSBidW5kbGVkIHBhY2thZ2UuXG4gICMgKiBgVXNlcmAgaW5kaWNhdGVzIHRoYXQgaXQgd2FzIGRlZmluZWQgYnkgYSB1c2VyLlxuICAjICogYDxwYWNrYWdlLW5hbWU+YCB0aGUgcGFja2FnZSB3aGljaCBkZWZpbmVkIGl0LlxuICAjICogYFVua25vd25gIGlmIGFuIGludmFsaWQgcGF0aCB3YXMgcGFzc2VkIGluLlxuICBAZGV0ZXJtaW5lU291cmNlOiAoZmlsZVBhdGgpIC0+XG4gICAgcmV0dXJuICdVbmtub3duJyB1bmxlc3MgZmlsZVBhdGhcblxuICAgIGlmIGZpbGVQYXRoLmluZGV4T2YocGF0aC5qb2luKGF0b20uZ2V0TG9hZFNldHRpbmdzKCkucmVzb3VyY2VQYXRoLCAna2V5bWFwcycpKSBpcyAwXG4gICAgICAnQ29yZSdcbiAgICBlbHNlIGlmIGZpbGVQYXRoIGlzIGF0b20ua2V5bWFwcy5nZXRVc2VyS2V5bWFwUGF0aCgpXG4gICAgICAnVXNlcidcbiAgICBlbHNlXG4gICAgICBwYXRoUGFydHMgPSBmaWxlUGF0aC5zcGxpdChwYXRoLnNlcClcbiAgICAgIHBhY2thZ2VOYW1lSW5kZXggPSBwYXRoUGFydHMubGVuZ3RoIC0gM1xuICAgICAgcGFja2FnZU5hbWUgPSBwYXRoUGFydHNbcGFja2FnZU5hbWVJbmRleF0gPyAnJ1xuICAgICAgXy51bmRhc2hlcml6ZShfLnVuY2FtZWxjYXNlKHBhY2thZ2VOYW1lKSlcbiJdfQ==
