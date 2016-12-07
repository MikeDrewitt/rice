(function() {
  var $, $$, CommandPaletteView, SelectListView, _, fuzzaldrinPlus, match, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), SelectListView = ref.SelectListView, $ = ref.$, $$ = ref.$$;

  match = require('fuzzaldrin').match;

  fuzzaldrinPlus = require('fuzzaldrin-plus');

  module.exports = CommandPaletteView = (function(superClass) {
    extend(CommandPaletteView, superClass);

    function CommandPaletteView() {
      return CommandPaletteView.__super__.constructor.apply(this, arguments);
    }

    CommandPaletteView.config = {
      useAlternateScoring: {
        type: 'boolean',
        "default": true,
        description: 'Use an alternative scoring approach which prefers run of consecutive characters, acronyms and start of words.'
      },
      preserveLastSearch: {
        type: 'boolean',
        "default": false,
        description: 'Preserve the last search when reopening the command palette.'
      }
    };

    CommandPaletteView.activate = function() {
      var view;
      view = new CommandPaletteView;
      return this.disposable = atom.commands.add('atom-workspace', 'command-palette:toggle', function() {
        return view.toggle();
      });
    };

    CommandPaletteView.deactivate = function() {
      var ref1, ref2;
      this.disposable.dispose();
      if ((ref1 = this.scoreSubscription) != null) {
        ref1.dispose();
      }
      return (ref2 = this.preserveLastSearchSubscription) != null ? ref2.dispose() : void 0;
    };

    CommandPaletteView.prototype.keyBindings = null;

    CommandPaletteView.prototype.initialize = function() {
      var preserveLastSearchSubscription;
      CommandPaletteView.__super__.initialize.apply(this, arguments);
      this.addClass('command-palette');
      this.alternateScoring = atom.config.get('command-palette.useAlternateScoring');
      this.scoreSubscription = atom.config.onDidChange('command-palette.useAlternateScoring', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          return _this.alternateScoring = newValue;
        };
      })(this));
      this.preserveLastSearch = atom.config.get('command-palette.preserveLastSearch');
      preserveLastSearchSubscription = atom.config.onDidChange('command-palette.preserveLastSearch', (function(_this) {
        return function(arg) {
          var newValue;
          newValue = arg.newValue;
          return _this.preserveLastSearch = newValue;
        };
      })(this));
      return this.lastSearch = '';
    };

    CommandPaletteView.prototype.getFilterKey = function() {
      return 'displayName';
    };

    CommandPaletteView.prototype.cancel = function() {
      this.lastSearch = this.getFilterQuery();
      return CommandPaletteView.__super__.cancel.apply(this, arguments);
    };

    CommandPaletteView.prototype.cancelled = function() {
      return this.hide();
    };

    CommandPaletteView.prototype.toggle = function() {
      var ref1;
      if ((ref1 = this.panel) != null ? ref1.isVisible() : void 0) {
        return this.cancel();
      } else {
        return this.show();
      }
    };

    CommandPaletteView.prototype.show = function() {
      var commands;
      if (this.preserveLastSearch) {
        this.filterEditorView.setText(this.lastSearch);
        this.filterEditorView.getModel().selectAll();
      }
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      this.storeFocusedElement();
      if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
        this.eventElement = this.previouslyFocusedElement[0];
      } else {
        this.eventElement = atom.views.getView(atom.workspace);
      }
      this.keyBindings = atom.keymaps.findKeyBindings({
        target: this.eventElement
      });
      commands = atom.commands.findCommands({
        target: this.eventElement
      });
      commands = _.sortBy(commands, 'displayName');
      this.setItems(commands);
      return this.focusFilterEditor();
    };

    CommandPaletteView.prototype.hide = function() {
      var ref1;
      return (ref1 = this.panel) != null ? ref1.hide() : void 0;
    };

    CommandPaletteView.prototype.viewForItem = function(arg) {
      var displayName, eventDescription, filterQuery, keyBindings, matches, name;
      name = arg.name, displayName = arg.displayName, eventDescription = arg.eventDescription;
      keyBindings = this.keyBindings;
      filterQuery = this.getFilterQuery();
      if (this.alternateScoring) {
        matches = fuzzaldrinPlus.match(displayName, filterQuery);
      } else {
        matches = match(displayName, filterQuery);
      }
      return $$(function() {
        var highlighter;
        highlighter = (function(_this) {
          return function(command, matches, offsetIndex) {
            var j, lastIndex, len, matchIndex, matchedChars, unmatched;
            lastIndex = 0;
            matchedChars = [];
            for (j = 0, len = matches.length; j < len; j++) {
              matchIndex = matches[j];
              matchIndex -= offsetIndex;
              if (matchIndex < 0) {
                continue;
              }
              unmatched = command.substring(lastIndex, matchIndex);
              if (unmatched) {
                if (matchedChars.length) {
                  _this.span(matchedChars.join(''), {
                    "class": 'character-match'
                  });
                }
                matchedChars = [];
                _this.text(unmatched);
              }
              matchedChars.push(command[matchIndex]);
              lastIndex = matchIndex + 1;
            }
            if (matchedChars.length) {
              _this.span(matchedChars.join(''), {
                "class": 'character-match'
              });
            }
            return _this.text(command.substring(lastIndex));
          };
        })(this);
        return this.li({
          "class": 'event',
          'data-event-name': name
        }, (function(_this) {
          return function() {
            _this.div({
              "class": 'pull-right'
            }, function() {
              var binding, j, len, results;
              results = [];
              for (j = 0, len = keyBindings.length; j < len; j++) {
                binding = keyBindings[j];
                if (binding.command === name) {
                  results.push(_this.kbd(_.humanizeKeystroke(binding.keystrokes), {
                    "class": 'key-binding'
                  }));
                }
              }
              return results;
            });
            return _this.span({
              title: name
            }, function() {
              return highlighter(displayName, matches, 0);
            });
          };
        })(this));
      });
    };

    CommandPaletteView.prototype.confirmed = function(arg) {
      var name;
      name = arg.name;
      this.cancel();
      return this.eventElement.dispatchEvent(new CustomEvent(name, {
        bubbles: true,
        cancelable: true
      }));
    };

    CommandPaletteView.prototype.populateList = function() {
      if (this.alternateScoring) {
        return this.populateAlternateList();
      } else {
        return CommandPaletteView.__super__.populateList.apply(this, arguments);
      }
    };

    CommandPaletteView.prototype.populateAlternateList = function() {
      var filterQuery, filteredItems, i, item, itemView, j, ref1;
      if (this.items == null) {
        return;
      }
      filterQuery = this.getFilterQuery();
      if (filterQuery.length) {
        filteredItems = fuzzaldrinPlus.filter(this.items, filterQuery, {
          key: this.getFilterKey()
        });
      } else {
        filteredItems = this.items;
      }
      this.list.empty();
      if (filteredItems.length) {
        this.setError(null);
        for (i = j = 0, ref1 = Math.min(filteredItems.length, this.maxItems); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
          item = filteredItems[i];
          itemView = $(this.viewForItem(item));
          itemView.data('select-list-item', item);
          this.list.append(itemView);
        }
        return this.selectItemView(this.list.find('li:first'));
      } else {
        return this.setError(this.getEmptyMessage(this.items.length, filteredItems.length));
      }
    };

    return CommandPaletteView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9jb21tYW5kLXBhbGV0dGUvbGliL2NvbW1hbmQtcGFsZXR0ZS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0VBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUEwQixPQUFBLENBQVEsc0JBQVIsQ0FBMUIsRUFBQyxtQ0FBRCxFQUFpQixTQUFqQixFQUFvQjs7RUFDbkIsUUFBUyxPQUFBLENBQVEsWUFBUjs7RUFDVixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxpQkFBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUVKLGtCQUFDLENBQUEsTUFBRCxHQUNFO01BQUEsbUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsV0FBQSxFQUFhLCtHQUZiO09BREY7TUFJQSxrQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7UUFFQSxXQUFBLEVBQWEsOERBRmI7T0FMRjs7O0lBU0Ysa0JBQUMsQ0FBQSxRQUFELEdBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxJQUFBLEdBQU8sSUFBSTthQUNYLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyx3QkFBcEMsRUFBOEQsU0FBQTtlQUFHLElBQUksQ0FBQyxNQUFMLENBQUE7TUFBSCxDQUE5RDtJQUZMOztJQUlYLGtCQUFDLENBQUEsVUFBRCxHQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxPQUFaLENBQUE7O1lBQ2tCLENB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QyxNQUF4QixFQUFnQyxhQUFhLENBQUMsTUFBOUMsQ0FBVixFQVhGOztJQVhxQjs7OztLQTNIUTtBQU5qQyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57U2VsZWN0TGlzdFZpZXcsICQsICQkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue21hdGNofSA9IHJlcXVpcmUgJ2Z1enphbGRyaW4nXG5mdXp6YWxkcmluUGx1cyA9IHJlcXVpcmUgJ2Z1enphbGRyaW4tcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ29tbWFuZFBhbGV0dGVWaWV3IGV4dGVuZHMgU2VsZWN0TGlzdFZpZXdcblxuICBAY29uZmlnOlxuICAgIHVzZUFsdGVybmF0ZVNjb3Jpbmc6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlIGFuIGFsdGVybmF0aXZlIHNjb3JpbmcgYXBwcm9hY2ggd2hpY2ggcHJlZmVycyBydW4gb2YgY29uc2VjdXRpdmUgY2hhcmFjdGVycywgYWNyb255bXMgYW5kIHN0YXJ0IG9mIHdvcmRzLidcbiAgICBwcmVzZXJ2ZUxhc3RTZWFyY2g6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBkZXNjcmlwdGlvbjogJ1ByZXNlcnZlIHRoZSBsYXN0IHNlYXJjaCB3aGVuIHJlb3BlbmluZyB0aGUgY29tbWFuZCBwYWxldHRlLidcblxuICBAYWN0aXZhdGU6IC0+XG4gICAgdmlldyA9IG5ldyBDb21tYW5kUGFsZXR0ZVZpZXdcbiAgICBAZGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdjb21tYW5kLXBhbGV0dGU6dG9nZ2xlJywgLT4gdmlldy50b2dnbGUoKVxuXG4gIEBkZWFjdGl2YXRlOiAtPlxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIEBzY29yZVN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQHByZXNlcnZlTGFzdFNlYXJjaFN1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG5cbiAga2V5QmluZGluZ3M6IG51bGxcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG5cbiAgICBAYWRkQ2xhc3MoJ2NvbW1hbmQtcGFsZXR0ZScpXG5cbiAgICBAYWx0ZXJuYXRlU2NvcmluZyA9IGF0b20uY29uZmlnLmdldCAnY29tbWFuZC1wYWxldHRlLnVzZUFsdGVybmF0ZVNjb3JpbmcnXG4gICAgQHNjb3JlU3Vic2NyaXB0aW9uID0gYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2NvbW1hbmQtcGFsZXR0ZS51c2VBbHRlcm5hdGVTY29yaW5nJywgKHtuZXdWYWx1ZX0pID0+IEBhbHRlcm5hdGVTY29yaW5nID0gbmV3VmFsdWVcblxuICAgIEBwcmVzZXJ2ZUxhc3RTZWFyY2ggPSBhdG9tLmNvbmZpZy5nZXQgJ2NvbW1hbmQtcGFsZXR0ZS5wcmVzZXJ2ZUxhc3RTZWFyY2gnXG4gICAgcHJlc2VydmVMYXN0U2VhcmNoU3Vic2NyaXB0aW9uID0gYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2NvbW1hbmQtcGFsZXR0ZS5wcmVzZXJ2ZUxhc3RTZWFyY2gnLCAoe25ld1ZhbHVlfSkgPT4gQHByZXNlcnZlTGFzdFNlYXJjaCA9IG5ld1ZhbHVlXG4gICAgQGxhc3RTZWFyY2ggPSAnJ1xuXG4gIGdldEZpbHRlcktleTogLT5cbiAgICAnZGlzcGxheU5hbWUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEBsYXN0U2VhcmNoID0gQGdldEZpbHRlclF1ZXJ5KClcbiAgICBzdXBlclxuXG4gIGNhbmNlbGxlZDogLT4gQGhpZGUoKVxuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBAcGFuZWw/LmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlXG4gICAgICBAc2hvdygpXG5cbiAgc2hvdzogLT5cbiAgICBpZiBAcHJlc2VydmVMYXN0U2VhcmNoXG4gICAgICBAZmlsdGVyRWRpdG9yVmlldy5zZXRUZXh0KEBsYXN0U2VhcmNoKVxuICAgICAgQGZpbHRlckVkaXRvclZpZXcuZ2V0TW9kZWwoKS5zZWxlY3RBbGwoKVxuXG4gICAgQHBhbmVsID89IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcylcbiAgICBAcGFuZWwuc2hvdygpXG5cbiAgICBAc3RvcmVGb2N1c2VkRWxlbWVudCgpXG5cbiAgICBpZiBAcHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdIGFuZCBAcHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdIGlzbnQgZG9jdW1lbnQuYm9keVxuICAgICAgQGV2ZW50RWxlbWVudCA9IEBwcmV2aW91c2x5Rm9jdXNlZEVsZW1lbnRbMF1cbiAgICBlbHNlXG4gICAgICBAZXZlbnRFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAgIEBrZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3ModGFyZ2V0OiBAZXZlbnRFbGVtZW50KVxuXG4gICAgY29tbWFuZHMgPSBhdG9tLmNvbW1hbmRzLmZpbmRDb21tYW5kcyh0YXJnZXQ6IEBldmVudEVsZW1lbnQpXG4gICAgY29tbWFuZHMgPSBfLnNvcnRCeShjb21tYW5kcywgJ2Rpc3BsYXlOYW1lJylcbiAgICBAc2V0SXRlbXMoY29tbWFuZHMpXG5cbiAgICBAZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gIGhpZGU6IC0+XG4gICAgQHBhbmVsPy5oaWRlKClcblxuICB2aWV3Rm9ySXRlbTogKHtuYW1lLCBkaXNwbGF5TmFtZSwgZXZlbnREZXNjcmlwdGlvbn0pIC0+XG4gICAga2V5QmluZGluZ3MgPSBAa2V5QmluZGluZ3NcbiAgICAjIFN0eWxlIG1hdGNoZWQgY2hhcmFjdGVycyBpbiBzZWFyY2ggcmVzdWx0c1xuICAgIGZpbHRlclF1ZXJ5ID0gQGdldEZpbHRlclF1ZXJ5KClcbiAgICBpZiBAYWx0ZXJuYXRlU2NvcmluZ1xuICAgICAgbWF0Y2hlcyA9IGZ1enphbGRyaW5QbHVzLm1hdGNoKGRpc3BsYXlOYW1lLCBmaWx0ZXJRdWVyeSlcbiAgICBlbHNlXG4gICAgICBtYXRjaGVzID0gbWF0Y2goZGlzcGxheU5hbWUsIGZpbHRlclF1ZXJ5KVxuXG4gICAgJCQgLT5cbiAgICAgIGhpZ2hsaWdodGVyID0gKGNvbW1hbmQsIG1hdGNoZXMsIG9mZnNldEluZGV4KSA9PlxuICAgICAgICBsYXN0SW5kZXggPSAwXG4gICAgICAgIG1hdGNoZWRDaGFycyA9IFtdICMgQnVpbGQgdXAgYSBzZXQgb2YgbWF0Y2hlZCBjaGFycyB0byBiZSBtb3JlIHNlbWFudGljXG5cbiAgICAgICAgZm9yIG1hdGNoSW5kZXggaW4gbWF0Y2hlc1xuICAgICAgICAgIG1hdGNoSW5kZXggLT0gb2Zmc2V0SW5kZXhcbiAgICAgICAgICBjb250aW51ZSBpZiBtYXRjaEluZGV4IDwgMCAjIElmIG1hcmtpbmcgdXAgdGhlIGJhc2VuYW1lLCBvbWl0IGNvbW1hbmQgbWF0Y2hlc1xuICAgICAgICAgIHVubWF0Y2hlZCA9IGNvbW1hbmQuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2hJbmRleClcbiAgICAgICAgICBpZiB1bm1hdGNoZWRcbiAgICAgICAgICAgIEBzcGFuIG1hdGNoZWRDaGFycy5qb2luKCcnKSwgY2xhc3M6ICdjaGFyYWN0ZXItbWF0Y2gnIGlmIG1hdGNoZWRDaGFycy5sZW5ndGhcbiAgICAgICAgICAgIG1hdGNoZWRDaGFycyA9IFtdXG4gICAgICAgICAgICBAdGV4dCB1bm1hdGNoZWRcbiAgICAgICAgICBtYXRjaGVkQ2hhcnMucHVzaChjb21tYW5kW21hdGNoSW5kZXhdKVxuICAgICAgICAgIGxhc3RJbmRleCA9IG1hdGNoSW5kZXggKyAxXG5cbiAgICAgICAgQHNwYW4gbWF0Y2hlZENoYXJzLmpvaW4oJycpLCBjbGFzczogJ2NoYXJhY3Rlci1tYXRjaCcgaWYgbWF0Y2hlZENoYXJzLmxlbmd0aFxuXG4gICAgICAgICMgUmVtYWluaW5nIGNoYXJhY3RlcnMgYXJlIHBsYWluIHRleHRcbiAgICAgICAgQHRleHQgY29tbWFuZC5zdWJzdHJpbmcobGFzdEluZGV4KVxuXG4gICAgICBAbGkgY2xhc3M6ICdldmVudCcsICdkYXRhLWV2ZW50LW5hbWUnOiBuYW1lLCA9PlxuICAgICAgICBAZGl2IGNsYXNzOiAncHVsbC1yaWdodCcsID0+XG4gICAgICAgICAgZm9yIGJpbmRpbmcgaW4ga2V5QmluZGluZ3Mgd2hlbiBiaW5kaW5nLmNvbW1hbmQgaXMgbmFtZVxuICAgICAgICAgICAgQGtiZCBfLmh1bWFuaXplS2V5c3Ryb2tlKGJpbmRpbmcua2V5c3Ryb2tlcyksIGNsYXNzOiAna2V5LWJpbmRpbmcnXG4gICAgICAgIEBzcGFuIHRpdGxlOiBuYW1lLCAtPiBoaWdobGlnaHRlcihkaXNwbGF5TmFtZSwgbWF0Y2hlcywgMClcblxuICBjb25maXJtZWQ6ICh7bmFtZX0pIC0+XG4gICAgQGNhbmNlbCgpXG4gICAgQGV2ZW50RWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlKSlcblxuICBwb3B1bGF0ZUxpc3Q6IC0+XG4gICAgaWYgQGFsdGVybmF0ZVNjb3JpbmdcbiAgICAgIEBwb3B1bGF0ZUFsdGVybmF0ZUxpc3QoKVxuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgIyBUaGlzIGlzIG1vZGlmaWVkIGNvcHkvcGFzdGUgZnJvbSBTZWxlY3RMaXN0VmlldyNwb3B1bGF0ZUxpc3QsIHJlcXVpcmUgalF1ZXJ5IVxuICAjIFNob3VsZCBiZSB0ZW1wb3JhcnlcbiAgcG9wdWxhdGVBbHRlcm5hdGVMaXN0OiAtPlxuXG4gICAgcmV0dXJuIHVubGVzcyBAaXRlbXM/XG5cbiAgICBmaWx0ZXJRdWVyeSA9IEBnZXRGaWx0ZXJRdWVyeSgpXG4gICAgaWYgZmlsdGVyUXVlcnkubGVuZ3RoXG4gICAgICBmaWx0ZXJlZEl0ZW1zID0gZnV6emFsZHJpblBsdXMuZmlsdGVyKEBpdGVtcywgZmlsdGVyUXVlcnksIGtleTogQGdldEZpbHRlcktleSgpKVxuICAgIGVsc2VcbiAgICAgIGZpbHRlcmVkSXRlbXMgPSBAaXRlbXNcblxuICAgIEBsaXN0LmVtcHR5KClcbiAgICBpZiBmaWx0ZXJlZEl0ZW1zLmxlbmd0aFxuICAgICAgQHNldEVycm9yKG51bGwpXG5cbiAgICAgIGZvciBpIGluIFswLi4uTWF0aC5taW4oZmlsdGVyZWRJdGVtcy5sZW5ndGgsIEBtYXhJdGVtcyldXG4gICAgICAgIGl0ZW0gPSBmaWx0ZXJlZEl0ZW1zW2ldXG4gICAgICAgIGl0ZW1WaWV3ID0gJChAdmlld0Zvckl0ZW0oaXRlbSkpXG4gICAgICAgIGl0ZW1WaWV3LmRhdGEoJ3NlbGVjdC1saXN0LWl0ZW0nLCBpdGVtKVxuICAgICAgICBAbGlzdC5hcHBlbmQoaXRlbVZpZXcpXG5cbiAgICAgIEBzZWxlY3RJdGVtVmlldyhAbGlzdC5maW5kKCdsaTpmaXJzdCcpKVxuICAgIGVsc2VcbiAgICAgIEBzZXRFcnJvcihAZ2V0RW1wdHlNZXNzYWdlKEBpdGVtcy5sZW5ndGgsIGZpbHRlcmVkSXRlbXMubGVuZ3RoKSlcbiJdfQ==
