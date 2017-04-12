(function() {
  var SpellCheckView, Task, spellCheckViews,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Task = require('atom').Task;

  SpellCheckView = null;

  spellCheckViews = {};

  module.exports = {
    activate: function() {
      var handlerFilename, that;
      handlerFilename = require.resolve('./spell-check-handler');
      if (this.task == null) {
        this.task = new Task(handlerFilename);
      }
      that = this;
      this.task.on("spell-check:settings-changed", function(ignore) {
        return that.updateViews();
      });
      this.globalArgs = {
        locales: atom.config.get('spell-check.locales'),
        localePaths: atom.config.get('spell-check.localePaths'),
        useLocales: atom.config.get('spell-check.useLocales'),
        knownWords: atom.config.get('spell-check.knownWords'),
        addKnownWords: atom.config.get('spell-check.addKnownWords'),
        checkerPaths: []
      };
      this.sendGlobalArgs();
      atom.config.onDidChange('spell-check.locales', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        that.globalArgs.locales = newValue;
        return that.sendGlobalArgs();
      });
      atom.config.onDidChange('spell-check.localePaths', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        that.globalArgs.localePaths = newValue;
        return that.sendGlobalArgs();
      });
      atom.config.onDidChange('spell-check.useLocales', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        that.globalArgs.useLocales = newValue;
        return that.sendGlobalArgs();
      });
      atom.config.onDidChange('spell-check.knownWords', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        that.globalArgs.knownWords = newValue;
        return that.sendGlobalArgs();
      });
      atom.config.onDidChange('spell-check.addKnownWords', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        that.globalArgs.addKnownWords = newValue;
        return that.sendGlobalArgs();
      });
      this.commandSubscription = atom.commands.add('atom-workspace', {
        'spell-check:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this)
      });
      this.viewsByEditor = new WeakMap;
      this.contextMenuEntries = [];
      return this.disposable = atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var editorId, spellCheckView;
          if (SpellCheckView == null) {
            SpellCheckView = require('./spell-check-view');
          }
          spellCheckView = new SpellCheckView(editor, _this.task, _this, function() {
            return _this.getInstance(_this.globalArgs);
          });
          editorId = editor.id;
          spellCheckViews[editorId] = {};
          spellCheckViews[editorId]['view'] = spellCheckView;
          spellCheckViews[editorId]['active'] = true;
          spellCheckViews[editorId]['editor'] = editor;
          return _this.viewsByEditor.set(editor, spellCheckView);
        };
      })(this));
    },
    deactivate: function() {
      var editorId, ref, ref1, view;
      if ((ref = this.instance) != null) {
        ref.deactivate();
      }
      this.instance = null;
      if ((ref1 = this.task) != null) {
        ref1.terminate();
      }
      this.task = null;
      this.commandSubscription.dispose();
      this.commandSubscription = null;
      for (editorId in spellCheckViews) {
        view = spellCheckViews[editorId].view;
        view.destroy();
      }
      spellCheckViews = {};
      this.viewsByEditor = new WeakMap;
      return this.disposable.dispose();
    },
    consumeSpellCheckers: function(checkerPaths) {
      var checkerPath, i, len, ref, ref1, results;
      if (!(checkerPaths instanceof Array)) {
        checkerPaths = [checkerPaths];
      }
      results = [];
      for (i = 0, len = checkerPaths.length; i < len; i++) {
        checkerPath = checkerPaths[i];
        if (indexOf.call(this.globalArgs.checkerPaths, checkerPath) < 0) {
          if ((ref = this.task) != null) {
            ref.send({
              type: "checker",
              checkerPath: checkerPath
            });
          }
          if ((ref1 = this.instance) != null) {
            ref1.addCheckerPath(checkerPath);
          }
          results.push(this.globalArgs.checkerPaths.push(checkerPath));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    misspellingMarkersForEditor: function(editor) {
      return this.viewsByEditor.get(editor).markerLayer.getMarkers();
    },
    updateViews: function() {
      var editorId, results, view;
      results = [];
      for (editorId in spellCheckViews) {
        view = spellCheckViews[editorId];
        if (view['active']) {
          results.push(view['view'].updateMisspellings());
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    sendGlobalArgs: function() {
      return this.task.send({
        type: "global",
        global: this.globalArgs
      });
    },
    getInstance: function(globalArgs) {
      var SpellCheckerManager, checkerPath, i, len, ref;
      if (!this.instance) {
        SpellCheckerManager = require('./spell-check-manager');
        this.instance = SpellCheckerManager;
        this.instance.setGlobalArgs(globalArgs);
        ref = globalArgs.checkerPaths;
        for (i = 0, len = ref.length; i < len; i++) {
          checkerPath = ref[i];
          this.instance.addCheckerPath(checkerPath);
        }
      }
      return this.instance;
    },
    toggle: function() {
      var editorId;
      if (!atom.workspace.getActiveTextEditor()) {
        return;
      }
      editorId = atom.workspace.getActiveTextEditor().id;
      if (spellCheckViews[editorId]['active']) {
        spellCheckViews[editorId]['active'] = false;
        return spellCheckViews[editorId]['view'].unsubscribeFromBuffer();
      } else {
        spellCheckViews[editorId]['active'] = true;
        return spellCheckViews[editorId]['view'].subscribeToBuffer();
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zcGVsbC1jaGVjay9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFDQUFBO0lBQUE7O0VBQUMsT0FBUSxPQUFBLENBQVEsTUFBUjs7RUFFVCxjQUFBLEdBQWlCOztFQUNqQixlQUFBLEdBQWtCOztFQUVsQixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLFNBQUE7QUFHUixVQUFBO01BQUEsZUFBQSxHQUFrQixPQUFPLENBQUMsT0FBUixDQUFnQix1QkFBaEI7O1FBQ2xCLElBQUMsQ0FBQSxPQUFZLElBQUEsSUFBQSxDQUFLLGVBQUw7O01BR2IsSUFBQSxHQUFPO01BQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxFQUFOLENBQVMsOEJBQVQsRUFBeUMsU0FBQyxNQUFEO2VBQ3ZDLElBQUksQ0FBQyxXQUFMLENBQUE7TUFEdUMsQ0FBekM7TUFNQSxJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ1osT0FBQSxFQUFTLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixxQkFBaEIsQ0FERztRQUVaLFdBQUEsRUFBYSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IseUJBQWhCLENBRkQ7UUFHWixVQUFBLEVBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUhBO1FBSVosVUFBQSxFQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix3QkFBaEIsQ0FKQTtRQUtaLGFBQUEsRUFBZSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMkJBQWhCLENBTEg7UUFNWixZQUFBLEVBQWMsRUFORjs7TUFRZCxJQUFDLENBQUEsY0FBRCxDQUFBO01BRUEsSUFBSSxDQUFDLE1BQU0s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LEVBQU0sUUFBUDtRQUFpQixNQUFBLEVBQVEsSUFBQyxDQUFBLFVBQTFCO09BQVg7SUFEYyxDQWxIaEI7SUF1SEEsV0FBQSxFQUFhLFNBQUMsVUFBRDtBQUNYLFVBQUE7TUFBQSxJQUFHLENBQUksSUFBQyxDQUFBLFFBQVI7UUFDRSxtQkFBQSxHQUFzQixPQUFBLENBQVEsdUJBQVI7UUFDdEIsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsYUFBVixDQUF3QixVQUF4QjtBQUVBO0FBQUEsYUFBQSxxQ0FBQTs7VUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLGNBQVYsQ0FBeUIsV0FBekI7QUFERixTQUxGOztBQVFBLGFBQU8sSUFBQyxDQUFBO0lBVEcsQ0F2SGI7SUFtSUEsTUFBQSxFQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsSUFBRyxDQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUFQO0FBQ0UsZUFERjs7TUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQW9DLENBQUM7TUFFaEQsSUFBRyxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLFFBQUEsQ0FBN0I7UUFFRSxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLFFBQUEsQ0FBMUIsR0FBc0M7ZUFDdEMsZUFBZ0IsQ0FBQSxRQUFBLENBQVUsQ0FBQSxNQUFBLENBQU8sQ0FBQyxxQkFBbEMsQ0FBQSxFQUhGO09BQUEsTUFBQTtRQU1FLGVBQWdCLENBQUEsUUFBQSxDQUFVLENBQUEsUUFBQSxDQUExQixHQUFzQztlQUN0QyxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLE1BQUEsQ0FBTyxDQUFDLGlCQUFsQyxDQUFBLEVBUEY7O0lBTE0sQ0FuSVI7O0FBTkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGFza30gPSByZXF1aXJlICdhdG9tJ1xuXG5TcGVsbENoZWNrVmlldyA9IG51bGxcbnNwZWxsQ2hlY2tWaWV3cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgIyBTZXQgdXAgdGhlIHRhc2sgZm9yIGhhbmRsaW5nIHNwZWxsLWNoZWNraW5nIGluIHRoZSBiYWNrZ3JvdW5kLiBUaGlzIGlzXG4gICAgIyB3aGF0IGlzIGFjdHVhbGx5IGluIHRoZSBiYWNrZ3JvdW5kLlxuICAgIGhhbmRsZXJGaWxlbmFtZSA9IHJlcXVpcmUucmVzb2x2ZSAnLi9zcGVsbC1jaGVjay1oYW5kbGVyJ1xuICAgIEB0YXNrID89IG5ldyBUYXNrIGhhbmRsZXJGaWxlbmFtZVxuXG4gICAgIyBTZXQgdXAgb3VyIGNhbGxiYWNrIHRvIHRyYWNrIHdoZW4gc2V0dGluZ3MgY2hhbmdlZC5cbiAgICB0aGF0ID0gdGhpc1xuICAgIEB0YXNrLm9uIFwic3BlbGwtY2hlY2s6c2V0dGluZ3MtY2hhbmdlZFwiLCAoaWdub3JlKSAtPlxuICAgICAgdGhhdC51cGRhdGVWaWV3cygpXG5cbiAgICAjIFNpbmNlIHRoZSBzcGVsbC1jaGVja2luZyBpcyBkb25lIG9uIGFub3RoZXIgcHJvY2Vzcywgd2UgZ2F0aGVyIHVwIGFsbCB0aGVcbiAgICAjIGFyZ3VtZW50cyBhbmQgcGFzcyB0aGVtIGludG8gdGhlIHRhc2suIFdoZW5ldmVyIHRoZXNlIGNoYW5nZSwgd2UnbGwgdXBkYXRlXG4gICAgIyB0aGUgb2JqZWN0IHdpdGggdGhlIHBhcmFtZXRlcnMgYW5kIHJlc2VuZCBpdCB0byB0aGUgdGFzay5cbiAgICBAZ2xvYmFsQXJncyA9IHtcbiAgICAgIGxvY2FsZXM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2subG9jYWxlcycpLFxuICAgICAgbG9jYWxlUGF0aHM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2subG9jYWxlUGF0aHMnKSxcbiAgICAgIHVzZUxvY2FsZXM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2sudXNlTG9jYWxlcycpLFxuICAgICAga25vd25Xb3JkczogYXRvbS5jb25maWcuZ2V0KCdzcGVsbC1jaGVjay5rbm93bldvcmRzJyksXG4gICAgICBhZGRLbm93bldvcmRzOiBhdG9tLmNvbmZpZy5nZXQoJ3NwZWxsLWNoZWNrLmFkZEtub3duV29yZHMnKSxcbiAgICAgIGNoZWNrZXJQYXRoczogW11cbiAgICB9XG4gICAgQHNlbmRHbG9iYWxBcmdzKClcblxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzcGVsbC1jaGVjay5sb2NhbGVzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLmxvY2FsZXMgPSBuZXdWYWx1ZVxuICAgICAgdGhhdC5zZW5kR2xvYmFsQXJncygpXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3NwZWxsLWNoZWNrLmxvY2FsZVBhdGhzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLmxvY2FsZVBhdGhzID0gbmV3VmFsdWVcbiAgICAgIHRoYXQuc2VuZEdsb2JhbEFyZ3MoKVxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzcGVsbC1jaGVjay51c2VMb2NhbGVzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLnVzZUxvY2FsZXMgPSBuZXdWYWx1ZVxuICAgICAgdGhhdC5zZW5kR2xvYmFsQXJncygpXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3NwZWxsLWNoZWNrLmtub3duV29yZHMnLCAoe25ld1ZhbHVlLCBvbGRWYWx1ZX0pIC0+XG4gICAgICB0aGF0Lmdsb2JhbEFyZ3Mua25vd25Xb3JkcyA9IG5ld1ZhbHVlXG4gICAgICB0aGF0LnNlbmRHbG9iYWxBcmdzKClcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BlbGwtY2hlY2suYWRkS25vd25Xb3JkcycsICh7bmV3VmFsdWUsIG9sZFZhbHVlfSkgLT5cbiAgICAgIHRoYXQuZ2xvYmFsQXJncy5hZGRLbm93bldvcmRzID0gbmV3VmFsdWVcbiAgICAgIHRoYXQuc2VuZEdsb2JhbEFyZ3MoKVxuXG4gICAgIyBIb29rIHVwIHRoZSBVSSBhbmQgcHJvY2Vzc2luZy5cbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgICdzcGVsbC1jaGVjazp0b2dnbGUnOiA9PiBAdG9nZ2xlKClcbiAgICBAdmlld3NCeUVkaXRvciA9IG5ldyBXZWFrTWFwXG4gICAgQGNvbnRleHRNZW51RW50cmllcyA9IFtdXG4gICAgQGRpc3Bvc2FibGUgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgIFNwZWxsQ2hlY2tWaWV3ID89IHJlcXVpcmUgJy4vc3BlbGwtY2hlY2stdmlldydcblxuICAgICAgIyBUaGUgU3BlbGxDaGVja1ZpZXcgbmVlZHMgYm90aCBhIGhhbmRsZSBmb3IgdGhlIHRhc2sgdG8gaGFuZGxlIHRoZVxuICAgICAgIyBiYWNrZ3JvdW5kIGNoZWNraW5nIGFuZCBhIGNhY2hlZCB2aWV3IG9mIHRoZSBpbi1wcm9jZXNzIG1hbmFnZXIgZm9yXG4gICAgICAjIGdldHRpbmcgY29ycmVjdGlvbnMuIFdlIHVzZWQgYSBmdW5jdGlvbiB0byBhIGZ1bmN0aW9uIGJlY2F1c2Ugc2NvcGVcbiAgICAgICMgd2Fzbid0IHdvcmtpbmcgcHJvcGVybHkuXG4gICAgICAjIEVhY2ggdmlldyBhbHNvIG5lZWRzIHRoZSBsaXN0IG9mIGFkZGVkIGNvbnRleHQgbWVudSBlbnRyaWVzIHNvIHRoYXRcbiAgICAgICMgdGhleSBjYW4gZGlzcG9zZSBvbGQgY29ycmVjdGlvbnMgd2hpY2ggd2VyZSBub3QgY3JlYXRlZCBieSB0aGUgY3VycmVudFxuICAgICAgIyBhY3RpdmUgZWRpdG9yLiBBIHJlZmVyZW5jZSB0byB0aGlzIGVudGlyZSBtb2R1bGUgaXMgcGFzc2VkIHJpZ2h0IG5vd1xuICAgICAgIyBiZWNhdXNlIGEgZGlyZWN0IHJlZmVyZW5jZSB0byBAY29udGV4dE1lbnVFbnRyaWVzIHdhc24ndCB1cGRhdGluZ1xuICAgICAgIyBwcm9wZXJseSBiZXR3ZWVuIGRpZmZlcmVudCBTcGVsbENoZWNrVmlldydzLlxuICAgICAgc3BlbGxDaGVja1ZpZXcgPSBuZXcgU3BlbGxDaGVja1ZpZXcoZWRpdG9yLCBAdGFzaywgdGhpcywgPT4gQGdldEluc3RhbmNlIEBnbG9iYWxBcmdzKVxuXG4gICAgICAjIHNhdmUgdGhlIHtlZGl0b3J9IGludG8gYSBtYXBcbiAgICAgIGVkaXRvcklkID0gZWRpdG9yLmlkXG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdID0ge31cbiAgICAgIHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF1bJ3ZpZXcnXSA9IHNwZWxsQ2hlY2tWaWV3XG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWydhY3RpdmUnXSA9IHRydWVcbiAgICAgIHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF1bJ2VkaXRvciddID0gZWRpdG9yXG4gICAgICBAdmlld3NCeUVkaXRvci5zZXQgZWRpdG9yLCBzcGVsbENoZWNrVmlld1xuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGluc3RhbmNlPy5kZWFjdGl2YXRlKClcbiAgICBAaW5zdGFuY2UgPSBudWxsXG4gICAgQHRhc2s/LnRlcm1pbmF0ZSgpXG4gICAgQHRhc2sgPSBudWxsXG4gICAgQGNvbW1hbmRTdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgQGNvbW1hbmRTdWJzY3JpcHRpb24gPSBudWxsXG5cbiAgICAjIENsZWFyIG91dCB0aGUga25vd24gdmlld3MuXG4gICAgZm9yIGVkaXRvcklkIG9mIHNwZWxsQ2hlY2tWaWV3c1xuICAgICAge3ZpZXd9ID0gc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVxuICAgICAgdmlldy5kZXN0cm95KClcbiAgICBzcGVsbENoZWNrVmlld3MgPSB7fVxuXG4gICAgIyBXaGlsZSB3ZSBoYXZlIFdlYWtNYXAuY2xlYXIsIGl0IGlzbid0IGEgZnVuY3Rpb24gYXZhaWxhYmxlIGluIEVTNi4gU28sIHdlXG4gICAgIyBqdXN0IHJlcGxhY2UgdGhlIFdlYWtNYXAgZW50aXJlbHkgYW5kIGxldCB0aGUgc3lzdGVtIHJlbGVhc2UgdGhlIG9iamVjdHMuXG4gICAgQHZpZXdzQnlFZGl0b3IgPSBuZXcgV2Vha01hcFxuXG4gICAgIyBGaW5pc2ggdXAgYnkgZGlzcG9zaW5nIGV2ZXJ5dGhpbmcgZWxzZSBhc3NvY2lhdGVkIHdpdGggdGhlIHBsdWdpbi5cbiAgICBAZGlzcG9zYWJsZS5kaXNwb3NlKClcblxuICAjIFJlZ2lzdGVycyBhbnkgQXRvbSBwYWNrYWdlcyB0aGF0IHByb3ZpZGUgb3VyIHNlcnZpY2UuIEJlY2F1c2Ugd2UgdXNlIGEgVGFzayxcbiAgIyB3ZSBoYXZlIHRvIGxvYWQgdGhlIHBsdWdpbidzIGNoZWNrZXIgaW4gYm90aCB0aGF0IHNlcnZpY2UgYW5kIGluIHRoZSBBdG9tXG4gICMgcHJvY2VzcyAoZm9yIGNvbWluZyB1cCB3aXRoIGNvcnJlY3Rpb25zKS4gU2luY2UgZXZlcnl0aGluZyBwYXNzZWQgdG8gdGhlXG4gICMgdGFzayBtdXN0IGJlIEpTT04gc2VyaWFsaXplZCwgd2UgcGFzcyB0aGUgZnVsbCBwYXRoIHRvIHRoZSB0YXNrIGFuZCBsZXQgaXRcbiAgIyByZXF1aXJlIGl0IG9uIHRoYXQgZW5kLlxuICBjb25zdW1lU3BlbGxDaGVja2VyczogKGNoZWNrZXJQYXRocykgLT5cbiAgICAjIE5vcm1hbGl6ZSBpdCBzbyB3ZSBhbHdheXMgaGF2ZSBhbiBhcnJheS5cbiAgICB1bmxlc3MgY2hlY2tlclBhdGhzIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgIGNoZWNrZXJQYXRocyA9IFsgY2hlY2tlclBhdGhzIF1cblxuICAgICMgR28gdGhyb3VnaCBhbmQgYWRkIGFueSBuZXcgcGx1Z2lucyB0byB0aGUgbGlzdC5cbiAgICBmb3IgY2hlY2tlclBhdGggaW4gY2hlY2tlclBhdGhzXG4gICAgICBpZiBjaGVja2VyUGF0aCBub3QgaW4gQGdsb2JhbEFyZ3MuY2hlY2tlclBhdGhzXG4gICAgICAgIEB0YXNrPy5zZW5kIHt0eXBlOiBcImNoZWNrZXJcIiwgY2hlY2tlclBhdGg6IGNoZWNrZXJQYXRofVxuICAgICAgICBAaW5zdGFuY2U/LmFkZENoZWNrZXJQYXRoIGNoZWNrZXJQYXRoXG4gICAgICAgIEBnbG9iYWxBcmdzLmNoZWNrZXJQYXRocy5wdXNoIGNoZWNrZXJQYXRoXG5cbiAgbWlzc3BlbGxpbmdNYXJrZXJzRm9yRWRpdG9yOiAoZWRpdG9yKSAtPlxuICAgIEB2aWV3c0J5RWRpdG9yLmdldChlZGl0b3IpLm1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuXG4gIHVwZGF0ZVZpZXdzOiAtPlxuICAgIGZvciBlZGl0b3JJZCBvZiBzcGVsbENoZWNrVmlld3NcbiAgICAgIHZpZXcgPSBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdXG4gICAgICBpZiB2aWV3WydhY3RpdmUnXVxuICAgICAgICB2aWV3Wyd2aWV3J10udXBkYXRlTWlzc3BlbGxpbmdzKClcblxuICBzZW5kR2xvYmFsQXJnczogLT5cbiAgICBAdGFzay5zZW5kIHt0eXBlOiBcImdsb2JhbFwiLCBnbG9iYWw6IEBnbG9iYWxBcmdzfVxuXG4gICMgUmV0cmlldmVzLCBjcmVhdGluZyBpZiByZXF1aXJlZCwgYSBzcGVsbGluZyBtYW5hZ2VyIGZvciB1c2Ugd2l0aFxuICAjIHN5bmNocm9ub3VzIG9wZXJhdGlvbnMgc3VjaCBhcyByZXRyaWV2aW5nIGNvcnJlY3Rpb25zLlxuICBnZXRJbnN0YW5jZTogKGdsb2JhbEFyZ3MpIC0+XG4gICAgaWYgbm90IEBpbnN0YW5jZVxuICAgICAgU3BlbGxDaGVja2VyTWFuYWdlciA9IHJlcXVpcmUgJy4vc3BlbGwtY2hlY2stbWFuYWdlcidcbiAgICAgIEBpbnN0YW5jZSA9IFNwZWxsQ2hlY2tlck1hbmFnZXJcbiAgICAgIEBpbnN0YW5jZS5zZXRHbG9iYWxBcmdzIGdsb2JhbEFyZ3NcblxuICAgICAgZm9yIGNoZWNrZXJQYXRoIGluIGdsb2JhbEFyZ3MuY2hlY2tlclBhdGhzXG4gICAgICAgIEBpbnN0YW5jZS5hZGRDaGVja2VyUGF0aCBjaGVja2VyUGF0aFxuXG4gICAgcmV0dXJuIEBpbnN0YW5jZVxuXG4gICMgSW50ZXJuYWw6IFRvZ2dsZXMgdGhlIHNwZWxsLWNoZWNrIGFjdGl2YXRpb24gc3RhdGUuXG4gIHRvZ2dsZTogLT5cbiAgICBpZiBub3QgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICByZXR1cm5cbiAgICBlZGl0b3JJZCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5pZFxuXG4gICAgaWYgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsnYWN0aXZlJ11cbiAgICAgICMgZGVhY3RpdmF0ZSBzcGVsbCBjaGVjayBmb3IgdGhpcyB7ZWRpdG9yfVxuICAgICAgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsnYWN0aXZlJ10gPSBmYWxzZVxuICAgICAgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsndmlldyddLnVuc3Vic2NyaWJlRnJvbUJ1ZmZlcigpXG4gICAgZWxzZVxuICAgICAgIyBhY3RpdmF0ZSBzcGVsbCBjaGVjayBmb3IgdGhpcyB7ZWRpdG9yfVxuICAgICAgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsnYWN0aXZlJ10gPSB0cnVlXG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWyd2aWV3J10uc3Vic2NyaWJlVG9CdWZmZXIoKVxuIl19
