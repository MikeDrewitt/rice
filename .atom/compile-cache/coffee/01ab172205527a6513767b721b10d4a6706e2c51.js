
/*≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡

	CONFIG DIRECTORY

	_Variables
	_DistractionFree

 * ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
 */

(function() {
  module.exports = {
    apply: function() {
      var hideIdleStatus, hideIdleTabs, hideInactiveFiles, hideSpotifiedPackage, root, toggleItemHoverEffect;
      root = document.documentElement;
      hideInactiveFiles = function(boolean) {
        if (boolean) {
          return root.classList.add('hide-tree-items');
        } else {
          return root.classList.remove('hide-tree-items');
        }
      };
      atom.config.onDidChange('genesis-ui.distractionFree.hideFiles', function() {
        return hideInactiveFiles(atom.config.get('genesis-ui.distractionFree.hideFiles'));
      });
      hideInactiveFiles(atom.config.get('genesis-ui.distractionFree.hideFiles'));
      hideIdleTabs = function(boolean) {
        if (boolean) {
          return root.classList.add('hide-idle-tabs');
        } else {
          return root.classList.remove('hide-idle-tabs');
        }
      };
      atom.config.onDidChange('genesis-ui.distractionFree.hideTabs', function() {
        return hideIdleTabs(atom.config.get('genesis-ui.distractionFree.hideTabs'));
      });
      hideIdleTabs(atom.config.get('genesis-ui.distractionFree.hideTabs'));
      hideIdleStatus = function(boolean) {
        if (boolean) {
          return root.classList.add('hide-status-bar');
        } else {
          return root.classList.remove('hide-status-bar');
        }
      };
      atom.config.onDidChange('genesis-ui.distractionFree.hideBottom', function() {
        return hideIdleStatus(atom.config.get('genesis-ui.distractionFree.hideBottom'));
      });
      hideIdleStatus(atom.config.get('genesis-ui.distractionFree.hideBottom'));
      hideSpotifiedPackage = function(boolean) {
        if (boolean) {
          return root.classList.add('hide-spotified');
        } else {
          return root.classList.remove('hide-spotified');
        }
      };
      atom.config.onDidChange('genesis-ui.distractionFree.hideSpotified', function() {
        return hideSpotifiedPackage(atom.config.get('genesis-ui.distractionFree.hideSpotified'));
      });
      hideSpotifiedPackage(atom.config.get('genesis-ui.distractionFree.hideSpotified'));
      toggleItemHoverEffect = function(boolean) {
        if (boolean) {
          return root.classList.add('add-tree-item-hover');
        } else {
          return root.classList.remove('add-tree-item-hover');
        }
      };
      atom.config.onDidChange('genesis-ui.treeView.toggleHovers', function() {
        return toggleItemHoverEffect(atom.config.get('genesis-ui.treeView.toggleHovers'));
      });
      return toggleItemHoverEffect(atom.config.get('genesis-ui.treeView.toggleHovers'));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy9nZW5lc2lzLXVpL2xpYi9jb25maWcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7OztBQUFBO0VBU0EsTUFBTSxDQUFDLE9BQVAsR0FDQztJQUFBLEtBQUEsRUFBTyxTQUFBO0FBTU4sVUFBQTtNQUFBLElBQUEsR0FBTyxRQUFRLENBQUM7TUFZaEIsaUJBQUEsR0FBb0IsU0FBQyxPQUFEO1FBQ25CLElBQUcsT0FBSDtpQkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsaUJBQW5CLEVBREQ7U0FBQSxNQUFBO2lCQUdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixpQkFBdEIsRUFIRDs7TUFEbUI7TUFNcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLHNDQUF4QixFQUFnRSxTQUFBO2VBQy9ELGlCQUFBLENBQWtCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQ0FBaEIsQ0FBbEI7TUFEK0QsQ0FBaEU7TUFHQSxpQkFBQSxDQUFrQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0NBQWhCLENBQWxCO01BR0EsWUFBQSxHQUFlLFNBQUMsT0FBRDtRQUNkLElBQUcsT0FBSDtpQkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsZ0JBQW5CLEVBREQ7U0FBQSxNQUFBO2lCQUdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixnQkFBdEIsRUFIRDs7TUFEYztNQU1mLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixxQ0FBeEIsRUFBK0QsU0FBQTtlQUM5RCxZQUFBLENBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFDQUFoQixDQUFiO01BRDhELENBQS9EO01BR0EsWUFBQSxDQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixxQ0FBaEIsQ0FBYjtNQUdBLGNBQUEsR0FBaUIsU0FBQyxPQUFEO1FBQ2hCLElBQUcsT0FBSDtpQkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsaUJBQW5CLEVBREQ7U0FBQSxNQUFBO2lCQUdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixpQkFBdEIsRUFIRDs7TUFEZ0I7TUFNakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLHVDQUF4QixFQUFpRSxTQUFBO2VBQ2hFLGNBQUEsQ0FBZSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUNBQWhCLENBQWY7TUFEZ0UsQ0FBakU7TUFHQSxjQUFBLENBQWUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHVDQUFoQixDQUFmO01BR0Esb0JBQUEsR0FBdUIsU0FBQyxPQUFEO1FBQ3RCLElBQUcsT0FBSDtpQkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsZ0JBQW5CLEVBREQ7U0FBQSxNQUFBO2lCQUdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixnQkFBdEIsRUFIRDs7TUFEc0I7TUFNdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLDBDQUF4QixFQUFvRSxTQUFBO2VBQ25FLG9CQUFBLENBQXFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQ0FBaEIsQ0FBckI7TUFEbUUsQ0FBcEU7TUFHQSxvQkFBQSxDQUFxQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMENBQWhCLENBQXJCO01BR0EscUJBQUEsR0FBd0IsU0FBQyxPQUFEO1FBQ3ZCLElBQUcsT0FBSDtpQkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIscUJBQW5CLEVBREQ7U0FBQSxNQUFBO2lCQUdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBZixDQUFzQixxQkFBdEIsRUFIRDs7TUFEdUI7TUFNeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLGtDQUF4QixFQUE0RCxTQUFBO2VBQzNELHFCQUFBLENBQXNCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixrQ0FBaEIsQ0FBdEI7TUFEMkQsQ0FBNUQ7YUFHQSxxQkFBQSxDQUFzQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isa0NBQWhCLENBQXRCO0lBM0VNLENBQVA7O0FBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIjIyPiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaHiiaFcblxuXHRDT05GSUcgRElSRUNUT1JZXG5cblx0X1ZhcmlhYmxlc1xuXHRfRGlzdHJhY3Rpb25GcmVlXG5cbiMg4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omh4omhIyMjXG5cbm1vZHVsZS5leHBvcnRzID1cblx0YXBwbHk6IC0+XG5cbiPilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqQjXG4jICAgX1ZhcmlhYmxlc1xuI+KWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpOKWpCNcblxuXHRcdHJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcblx0XHQjIHRyZWUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwidHJlZS12aWV3XCIpWzBdXG5cdFx0IyB0YWJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInRhYi1iYXJcIilbMF1cblx0XHQjIGJvdHRvbSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzdGF0dXMtYmFyXCIpWzBdXG5cblxuXG4j4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pak4pakI1xuIyAgIF9EaXN0cmFjdGlvbkZyZWVcbiPilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqTilqQjXG5cblx0XHQjIFRyZWUgVmlld1xuXHRcdGhpZGVJbmFjdGl2ZUZpbGVzID0gKGJvb2xlYW4pIC0+XG5cdFx0XHRpZiBib29sZWFuXG5cdFx0XHRcdHJvb3QuY2xhc3NMaXN0LmFkZCgnaGlkZS10cmVlLWl0ZW1zJylcblx0XHRcdGVsc2Vcblx0XHRcdFx0cm9vdC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRlLXRyZWUtaXRlbXMnKVxuXG5cdFx0YXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2dlbmVzaXMtdWkuZGlzdHJhY3Rpb25GcmVlLmhpZGVGaWxlcycsIC0+XG5cdFx0XHRoaWRlSW5hY3RpdmVGaWxlcyhhdG9tLmNvbmZpZy5nZXQoJ2dlbmVzaXMtdWkuZGlzdHJhY3Rpb25GcmVlLmhpZGVGaWxlcycpKVxuXG5cdFx0aGlkZUluYWN0aXZlRmlsZXMoYXRvbS5jb25maWcuZ2V0KCdnZW5lc2lzLXVpLmRpc3RyYWN0aW9uRnJlZS5oaWRlRmlsZXMnKSlcblxuXHRcdCMgVGFic1xuXHRcdGhpZGVJZGxlVGFicyA9IChib29sZWFuKSAtPlxuXHRcdFx0aWYgYm9vbGVhblxuXHRcdFx0XHRyb290LmNsYXNzTGlzdC5hZGQoJ2hpZGUtaWRsZS10YWJzJylcblx0XHRcdGVsc2Vcblx0XHRcdFx0cm9vdC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRlLWlkbGUtdGFicycpXG5cblx0XHRhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZ2VuZXNpcy11aS5kaXN0cmFjdGlvbkZyZWUuaGlkZVRhYnMnLCAtPlxuXHRcdFx0aGlkZUlkbGVUYWJzKGF0b20uY29uZmlnLmdldCgnZ2VuZXNpcy11aS5kaXN0cmFjdGlvbkZyZWUuaGlkZVRhYnMnKSlcblxuXHRcdGhpZGVJZGxlVGFicyhhdG9tLmNvbmZpZy5nZXQoJ2dlbmVzaXMtdWkuZGlzdHJhY3Rpb25GcmVlLmhpZGVUYWJzJykpXG5cblx0XHQjIFN0YXR1cyBCYXJcblx0XHRoaWRlSWRsZVN0YXR1cyA9IChib29sZWFuKSAtPlxuXHRcdFx0aWYgYm9vbGVhblxuXHRcdFx0XHRyb290LmNsYXNzTGlzdC5hZGQoJ2hpZGUtc3RhdHVzLWJhcicpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJvb3QuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZS1zdGF0dXMtYmFyJylcblxuXHRcdGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdnZW5lc2lzLXVpLmRpc3RyYWN0aW9uRnJlZS5oaWRlQm90dG9tJywgLT5cblx0XHRcdGhpZGVJZGxlU3RhdHVzKGF0b20uY29uZmlnLmdldCgnZ2VuZXNpcy11aS5kaXN0cmFjdGlvbkZyZWUuaGlkZUJvdHRvbScpKVxuXG5cdFx0aGlkZUlkbGVTdGF0dXMoYXRvbS5jb25maWcuZ2V0KCdnZW5lc2lzLXVpLmRpc3RyYWN0aW9uRnJlZS5oaWRlQm90dG9tJykpXG5cblx0XHQjIFNwb3RpZmllZFxuXHRcdGhpZGVTcG90aWZpZWRQYWNrYWdlID0gKGJvb2xlYW4pIC0+XG5cdFx0XHRpZiBib29sZWFuXG5cdFx0XHRcdHJvb3QuY2xhc3NMaXN0LmFkZCgnaGlkZS1zcG90aWZpZWQnKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyb290LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGUtc3BvdGlmaWVkJylcblxuXHRcdGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdnZW5lc2lzLXVpLmRpc3RyYWN0aW9uRnJlZS5oaWRlU3BvdGlmaWVkJywgLT5cblx0XHRcdGhpZGVTcG90aWZpZWRQYWNrYWdlKGF0b20uY29uZmlnLmdldCgnZ2VuZXNpcy11aS5kaXN0cmFjdGlvbkZyZWUuaGlkZVNwb3RpZmllZCcpKVxuXG5cdFx0aGlkZVNwb3RpZmllZFBhY2thZ2UoYXRvbS5jb25maWcuZ2V0KCdnZW5lc2lzLXVpLmRpc3RyYWN0aW9uRnJlZS5oaWRlU3BvdGlmaWVkJykpXG5cblx0XHQjIFRyZWVWaWV3IEhvdmVyXG5cdFx0dG9nZ2xlSXRlbUhvdmVyRWZmZWN0ID0gKGJvb2xlYW4pIC0+XG5cdFx0XHRpZiBib29sZWFuXG5cdFx0XHRcdHJvb3QuY2xhc3NMaXN0LmFkZCgnYWRkLXRyZWUtaXRlbS1ob3ZlcicpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJvb3QuY2xhc3NMaXN0LnJlbW92ZSgnYWRkLXRyZWUtaXRlbS1ob3ZlcicpXG5cblx0XHRhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZ2VuZXNpcy11aS50cmVlVmlldy50b2dnbGVIb3ZlcnMnLCAtPlxuXHRcdFx0dG9nZ2xlSXRlbUhvdmVyRWZmZWN0KGF0b20uY29uZmlnLmdldCgnZ2VuZXNpcy11aS50cmVlVmlldy50b2dnbGVIb3ZlcnMnKSlcblxuXHRcdHRvZ2dsZUl0ZW1Ib3ZlckVmZmVjdChhdG9tLmNvbmZpZy5nZXQoJ2dlbmVzaXMtdWkudHJlZVZpZXcudG9nZ2xlSG92ZXJzJykpIl19
