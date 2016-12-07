(function() {
  var ItemSpecificities, _, cloneMenuItem, findMatchingItemIndex, merge, normalizeLabel, unmerge;

  _ = require('underscore-plus');

  ItemSpecificities = new WeakMap;

  merge = function(menu, item, itemSpecificity) {
    var i, len, matchingItem, matchingItemIndex, ref, ref1, submenuItem;
    if (itemSpecificity == null) {
      itemSpecificity = 2e308;
    }
    item = cloneMenuItem(item);
    if (itemSpecificity) {
      ItemSpecificities.set(item, itemSpecificity);
    }
    matchingItemIndex = findMatchingItemIndex(menu, item);
    if (matchingItemIndex !== -1) {
      matchingItem = menu[matchingItemIndex];
    }
    if (matchingItem != null) {
      if (item.submenu != null) {
        ref = item.submenu;
        for (i = 0, len = ref.length; i < len; i++) {
          submenuItem = ref[i];
          merge(matchingItem.submenu, submenuItem, itemSpecificity);
        }
      } else if (itemSpecificity) {
        if (!(itemSpecificity < ItemSpecificities.get(matchingItem))) {
          menu[matchingItemIndex] = item;
        }
      }
    } else if (!(item.type === 'separator' && ((ref1 = _.last(menu)) != null ? ref1.type : void 0) === 'separator')) {
      menu.push(item);
    }
  };

  unmerge = function(menu, item) {
    var i, len, matchingItem, matchingItemIndex, ref, ref1, submenuItem;
    matchingItemIndex = findMatchingItemIndex(menu, item);
    if (matchingItemIndex !== -1) {
      matchingItem = menu[matchingItemIndex];
    }
    if (matchingItem != null) {
      if (item.submenu != null) {
        ref = item.submenu;
        for (i = 0, len = ref.length; i < len; i++) {
          submenuItem = ref[i];
          unmerge(matchingItem.submenu, submenuItem);
        }
      }
      if (!(((ref1 = matchingItem.submenu) != null ? ref1.length : void 0) > 0)) {
        return menu.splice(matchingItemIndex, 1);
      }
    }
  };

  findMatchingItemIndex = function(menu, arg) {
    var i, index, item, label, len, submenu, type;
    type = arg.type, label = arg.label, submenu = arg.submenu;
    if (type === 'separator') {
      return -1;
    }
    for (index = i = 0, len = menu.length; i < len; index = ++i) {
      item = menu[index];
      if (normalizeLabel(item.label) === normalizeLabel(label) && (item.submenu != null) === (submenu != null)) {
        return index;
      }
    }
    return -1;
  };

  normalizeLabel = function(label) {
    if (label == null) {
      return void 0;
    }
    if (process.platform === 'darwin') {
      return label;
    } else {
      return label.replace(/\&/g, '');
    }
  };

  cloneMenuItem = function(item) {
    item = _.pick(item, 'type', 'label', 'enabled', 'visible', 'command', 'submenu', 'commandDetail', 'role');
    if (item.submenu != null) {
      item.submenu = item.submenu.map(function(submenuItem) {
        return cloneMenuItem(submenuItem);
      });
    }
    return item;
  };

  module.exports = {
    merge: merge,
    unmerge: unmerge,
    normalizeLabel: normalizeLabel,
    cloneMenuItem: cloneMenuItem
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tZW51LWhlbHBlcnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLGlCQUFBLEdBQW9CLElBQUk7O0VBRXhCLEtBQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsZUFBYjtBQUNOLFFBQUE7O01BRG1CLGtCQUFnQjs7SUFDbkMsSUFBQSxHQUFPLGFBQUEsQ0FBYyxJQUFkO0lBQ1AsSUFBZ0QsZUFBaEQ7TUFBQSxpQkFBaUIsQ0FBQyxHQUFsQixDQUFzQixJQUF0QixFQUE0QixlQUE1QixFQUFBOztJQUNBLGlCQUFBLEdBQW9CLHFCQUFBLENBQXNCLElBQXRCLEVBQTRCLElBQTVCO0lBQ3BCLElBQThDLGlCQUFBLEtBQXFCLENBQUUsQ0FBckU7TUFBQSxZQUFBLEdBQWUsSUFBSyxDQUFBLGlCQUFBLEVBQXBCOztJQUVBLElBQUcsb0JBQUg7TUFDRSxJQUFHLG9CQUFIO0FBQ0U7QUFBQSxhQUFBLHFDQUFBOztVQUFBLEtBQUEsQ0FBTSxZQUFZLENBQUMsT0FBbkIsRUFBNEIsV0FBNUIsRUFBeUMsZUFBekM7QUFBQSxTQURGO09BQUEsTUFFSyxJQUFHLGVBQUg7UUFDSCxJQUFBLENBQUEsQ0FBTyxlQUFBLEdBQWtCLGlCQUFpQixDQUFDLEdBQWxCLENBQXNCLFlBQXRCLENBQXpCLENBQUE7VUFDRSxJQUFLLENBQUEsaUJBQUEsQ0FBTCxHQUEwQixLQUQ1QjtTQURHO09BSFA7S0FBQSxNQU1LLElBQUEsQ0FBQSxDQUFPLElBQUksQ0FBQyxJQUFMLEtBQWEsV0FBYix5Q0FBeUMsQ0FBRSxjQUFkLEtBQXNCLFdBQTFELENBQUE7TUFDSCxJQUFJLENBQUMsSUFBTCxDQUFVLElBQVYsRUFERzs7RUFaQzs7RUFpQlIsT0FBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFDUixRQUFBO0lBQUEsaUJBQUEsR0FBb0IscUJBQUEsQ0FBc0IsSUFBdEIsRUFBNEIsSUFBNUI7SUFDcEIsSUFBOEMsaUJBQUEsS0FBcUIsQ0FBRSxDQUFyRTtNQUFBLFlBQUEsR0FBZSxJQUFLLENBQUEsaUJBQUEsRUFBcEI7O0lBRUEsSUFBRyxvQkFBSDtNQUNFLElBQUcsb0JBQUg7QUFDRTtBQUFBLGFBQUEscUNBQUE7O1VBQUEsT0FBQSxDQUFRLFlBQVksQ0FBQyxPQUFyQixFQUE4QixXQUE5QjtBQUFBLFNBREY7O01BR0EsSUFBQSxDQUFBLDhDQUEyQixDQUFFLGdCQUF0QixHQUErQixDQUF0QyxDQUFBO2VBQ0UsSUFBSSxDQUFDLE1BQUwsQ0FBWSxpQkFBWixFQUErQixDQUEvQixFQURGO09BSkY7O0VBSlE7O0VBV1YscUJBQUEsR0FBd0IsU0FBQyxJQUFELEVBQU8sR0FBUDtBQUN0QixRQUFBO0lBRDhCLGlCQUFNLG1CQUFPO0lBQzNDLElBQWEsSUFBQSxLQUFRLFdBQXJCO0FBQUEsYUFBTyxDQUFDLEVBQVI7O0FBQ0EsU0FBQSxzREFBQTs7TUFDRSxJQUFHLGNBQUEsQ0FBZSxJQUFJLENBQUMsS0FBcEIsQ0FBQSxLQUE4QixjQUFBLENBQWUsS0FBZixDQUE5QixJQUF3RCxzQkFBQSxLQUFpQixpQkFBNUU7QUFDRSxlQUFPLE1BRFQ7O0FBREY7V0FHQSxDQUFDO0VBTHFCOztFQU94QixjQUFBLEdBQWlCLFNBQUMsS0FBRDtJQUNmLElBQXdCLGFBQXhCO0FBQUEsYUFBTyxPQUFQOztJQUVBLElBQUcsT0FBTyxDQUFDLFFBQVIsS0FBb0IsUUFBdkI7YUFDRSxNQURGO0tBQUEsTUFBQTthQUdFLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBZCxFQUFxQixFQUFyQixFQUhGOztFQUhlOztFQVFqQixhQUFBLEdBQWdCLFNBQUMsSUFBRDtJQUNkLElBQUEsR0FBTyxDQUFDLENBQUMsSUFBRixDQUFPLElBQVAsRUFBYSxNQUFiLEVBQXFCLE9BQXJCLEVBQThCLFNBQTlCLEVBQXlDLFNBQXpDLEVBQW9ELFNBQXBELEVBQStELFNBQS9ELEVBQTBFLGVBQTFFLEVBQTJGLE1BQTNGO0lBQ1AsSUFBRyxvQkFBSDtNQUNFLElBQUksQ0FBQyxPQUFMLEdBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLFNBQUMsV0FBRDtlQUFpQixhQUFBLENBQWMsV0FBZDtNQUFqQixDQUFqQixFQURqQjs7V0FFQTtFQUpjOztFQU1oQixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLE9BQUEsS0FBRDtJQUFRLFNBQUEsT0FBUjtJQUFpQixnQkFBQSxjQUFqQjtJQUFpQyxlQUFBLGFBQWpDOztBQXJEakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5JdGVtU3BlY2lmaWNpdGllcyA9IG5ldyBXZWFrTWFwXG5cbm1lcmdlID0gKG1lbnUsIGl0ZW0sIGl0ZW1TcGVjaWZpY2l0eT1JbmZpbml0eSkgLT5cbiAgaXRlbSA9IGNsb25lTWVudUl0ZW0oaXRlbSlcbiAgSXRlbVNwZWNpZmljaXRpZXMuc2V0KGl0ZW0sIGl0ZW1TcGVjaWZpY2l0eSkgaWYgaXRlbVNwZWNpZmljaXR5XG4gIG1hdGNoaW5nSXRlbUluZGV4ID0gZmluZE1hdGNoaW5nSXRlbUluZGV4KG1lbnUsIGl0ZW0pXG4gIG1hdGNoaW5nSXRlbSA9IG1lbnVbbWF0Y2hpbmdJdGVtSW5kZXhdIHVubGVzcyBtYXRjaGluZ0l0ZW1JbmRleCBpcyAtIDFcblxuICBpZiBtYXRjaGluZ0l0ZW0/XG4gICAgaWYgaXRlbS5zdWJtZW51P1xuICAgICAgbWVyZ2UobWF0Y2hpbmdJdGVtLnN1Ym1lbnUsIHN1Ym1lbnVJdGVtLCBpdGVtU3BlY2lmaWNpdHkpIGZvciBzdWJtZW51SXRlbSBpbiBpdGVtLnN1Ym1lbnVcbiAgICBlbHNlIGlmIGl0ZW1TcGVjaWZpY2l0eVxuICAgICAgdW5sZXNzIGl0ZW1TcGVjaWZpY2l0eSA8IEl0ZW1TcGVjaWZpY2l0aWVzLmdldChtYXRjaGluZ0l0ZW0pXG4gICAgICAgIG1lbnVbbWF0Y2hpbmdJdGVtSW5kZXhdID0gaXRlbVxuICBlbHNlIHVubGVzcyBpdGVtLnR5cGUgaXMgJ3NlcGFyYXRvcicgYW5kIF8ubGFzdChtZW51KT8udHlwZSBpcyAnc2VwYXJhdG9yJ1xuICAgIG1lbnUucHVzaChpdGVtKVxuXG4gIHJldHVyblxuXG51bm1lcmdlID0gKG1lbnUsIGl0ZW0pIC0+XG4gIG1hdGNoaW5nSXRlbUluZGV4ID0gZmluZE1hdGNoaW5nSXRlbUluZGV4KG1lbnUsIGl0ZW0pXG4gIG1hdGNoaW5nSXRlbSA9IG1lbnVbbWF0Y2hpbmdJdGVtSW5kZXhdIHVubGVzcyBtYXRjaGluZ0l0ZW1JbmRleCBpcyAtIDFcblxuICBpZiBtYXRjaGluZ0l0ZW0/XG4gICAgaWYgaXRlbS5zdWJtZW51P1xuICAgICAgdW5tZXJnZShtYXRjaGluZ0l0ZW0uc3VibWVudSwgc3VibWVudUl0ZW0pIGZvciBzdWJtZW51SXRlbSBpbiBpdGVtLnN1Ym1lbnVcblxuICAgIHVubGVzcyBtYXRjaGluZ0l0ZW0uc3VibWVudT8ubGVuZ3RoID4gMFxuICAgICAgbWVudS5zcGxpY2UobWF0Y2hpbmdJdGVtSW5kZXgsIDEpXG5cbmZpbmRNYXRjaGluZ0l0ZW1JbmRleCA9IChtZW51LCB7dHlwZSwgbGFiZWwsIHN1Ym1lbnV9KSAtPlxuICByZXR1cm4gLTEgaWYgdHlwZSBpcyAnc2VwYXJhdG9yJ1xuICBmb3IgaXRlbSwgaW5kZXggaW4gbWVudVxuICAgIGlmIG5vcm1hbGl6ZUxhYmVsKGl0ZW0ubGFiZWwpIGlzIG5vcm1hbGl6ZUxhYmVsKGxhYmVsKSBhbmQgaXRlbS5zdWJtZW51PyBpcyBzdWJtZW51P1xuICAgICAgcmV0dXJuIGluZGV4XG4gIC0xXG5cbm5vcm1hbGl6ZUxhYmVsID0gKGxhYmVsKSAtPlxuICByZXR1cm4gdW5kZWZpbmVkIHVubGVzcyBsYWJlbD9cblxuICBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICdkYXJ3aW4nXG4gICAgbGFiZWxcbiAgZWxzZVxuICAgIGxhYmVsLnJlcGxhY2UoL1xcJi9nLCAnJylcblxuY2xvbmVNZW51SXRlbSA9IChpdGVtKSAtPlxuICBpdGVtID0gXy5waWNrKGl0ZW0sICd0eXBlJywgJ2xhYmVsJywgJ2VuYWJsZWQnLCAndmlzaWJsZScsICdjb21tYW5kJywgJ3N1Ym1lbnUnLCAnY29tbWFuZERldGFpbCcsICdyb2xlJylcbiAgaWYgaXRlbS5zdWJtZW51P1xuICAgIGl0ZW0uc3VibWVudSA9IGl0ZW0uc3VibWVudS5tYXAgKHN1Ym1lbnVJdGVtKSAtPiBjbG9uZU1lbnVJdGVtKHN1Ym1lbnVJdGVtKVxuICBpdGVtXG5cbm1vZHVsZS5leHBvcnRzID0ge21lcmdlLCB1bm1lcmdlLCBub3JtYWxpemVMYWJlbCwgY2xvbmVNZW51SXRlbX1cbiJdfQ==
