(function() {
  var BufferView, FuzzyFinderView, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  FuzzyFinderView = require('./fuzzy-finder-view');

  module.exports = BufferView = (function(superClass) {
    extend(BufferView, superClass);

    function BufferView() {
      return BufferView.__super__.constructor.apply(this, arguments);
    }

    BufferView.prototype.toggle = function() {
      var ref, ref1;
      if ((ref = this.panel) != null ? ref.isVisible() : void 0) {
        return this.cancel();
      } else {
        this.populate();
        if (((ref1 = this.paths) != null ? ref1.length : void 0) > 0) {
          return this.show();
        }
      }
    };

    BufferView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'No open editors';
      } else {
        return BufferView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    BufferView.prototype.populate = function() {
      var activeEditor, editors;
      editors = atom.workspace.getTextEditors().filter(function(editor) {
        return editor.getPath() != null;
      });
      activeEditor = atom.workspace.getActiveTextEditor();
      editors = _.sortBy(editors, function(editor) {
        if (editor === activeEditor) {
          return 0;
        } else {
          return -(editor.lastOpened || 1);
        }
      });
      this.paths = editors.map(function(editor) {
        return editor.getPath();
      });
      return this.setItems(_.uniq(this.paths));
    };

    return BufferView;

  })(FuzzyFinderView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9mdXp6eS1maW5kZXIvbGliL2J1ZmZlci12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOEJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxxQkFBUjs7RUFFbEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt5QkFDSixNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7TUFBQSxvQ0FBUyxDQUFFLFNBQVIsQ0FBQSxVQUFIO2VBQ0UsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQURGO09BQUEsTUFBQTtRQUdFLElBQUMsQ0FBQSxRQUFELENBQUE7UUFDQSx1Q0FBaUIsQ0FBRSxnQkFBUixHQUFpQixDQUE1QjtpQkFBQSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBQUE7U0FKRjs7SUFETTs7eUJBT1IsZUFBQSxHQUFpQixTQUFDLFNBQUQ7TUFDZixJQUFHLFNBQUEsS0FBYSxDQUFoQjtlQUNFLGtCQURGO09BQUEsTUFBQTtlQUdFLGlEQUFBLFNBQUEsRUFIRjs7SUFEZTs7eUJBTWpCLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWYsQ0FBQSxDQUErQixDQUFDLE1BQWhDLENBQXVDLFNBQUMsTUFBRDtlQUFZO01BQVosQ0FBdkM7TUFDVixZQUFBLEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO01BQ2YsT0FBQSxHQUFVLENBQUMsQ0FBQyxNQUFGLENBQVMsT0FBVCxFQUFrQixTQUFDLE1BQUQ7UUFDMUIsSUFBRyxNQUFBLEtBQVUsWUFBYjtpQkFDRSxFQURGO1NBQUEsTUFBQTtpQkFHRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVAsSUFBcUIsQ0FBdEIsRUFISDs7TUFEMEIsQ0FBbEI7TUFNVixJQUFDLENBQUEsS0FBRCxHQUFTLE9BQU8sQ0FBQyxHQUFSLENBQVksU0FBQyxNQUFEO2VBQVksTUFBTSxDQUFDLE9BQVAsQ0FBQTtNQUFaLENBQVo7YUFDVCxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLEtBQVIsQ0FBVjtJQVZROzs7O0tBZGE7QUFKekIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuRnV6enlGaW5kZXJWaWV3ID0gcmVxdWlyZSAnLi9mdXp6eS1maW5kZXItdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnVmZmVyVmlldyBleHRlbmRzIEZ1enp5RmluZGVyVmlld1xuICB0b2dnbGU6IC0+XG4gICAgaWYgQHBhbmVsPy5pc1Zpc2libGUoKVxuICAgICAgQGNhbmNlbCgpXG4gICAgZWxzZVxuICAgICAgQHBvcHVsYXRlKClcbiAgICAgIEBzaG93KCkgaWYgQHBhdGhzPy5sZW5ndGggPiAwXG5cbiAgZ2V0RW1wdHlNZXNzYWdlOiAoaXRlbUNvdW50KSAtPlxuICAgIGlmIGl0ZW1Db3VudCBpcyAwXG4gICAgICAnTm8gb3BlbiBlZGl0b3JzJ1xuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgcG9wdWxhdGU6IC0+XG4gICAgZWRpdG9ycyA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZmlsdGVyIChlZGl0b3IpIC0+IGVkaXRvci5nZXRQYXRoKCk/XG4gICAgYWN0aXZlRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgZWRpdG9ycyA9IF8uc29ydEJ5IGVkaXRvcnMsIChlZGl0b3IpIC0+XG4gICAgICBpZiBlZGl0b3IgaXMgYWN0aXZlRWRpdG9yXG4gICAgICAgIDBcbiAgICAgIGVsc2VcbiAgICAgICAgLShlZGl0b3IubGFzdE9wZW5lZCBvciAxKVxuXG4gICAgQHBhdGhzID0gZWRpdG9ycy5tYXAgKGVkaXRvcikgLT4gZWRpdG9yLmdldFBhdGgoKVxuICAgIEBzZXRJdGVtcyhfLnVuaXEoQHBhdGhzKSlcbiJdfQ==
