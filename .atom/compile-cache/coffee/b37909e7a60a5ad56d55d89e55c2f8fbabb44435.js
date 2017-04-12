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
      return this.disposable = atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var editorId, spellCheckView;
          if (SpellCheckView == null) {
            SpellCheckView = require('./spell-check-view');
          }
          spellCheckView = new SpellCheckView(editor, _this.task, function() {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3NwZWxsLWNoZWNrL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUNBQUE7SUFBQTs7RUFBQyxPQUFRLE9BQUEsQ0FBUSxNQUFSOztFQUVULGNBQUEsR0FBaUI7O0VBQ2pCLGVBQUEsR0FBa0I7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtBQUdSLFVBQUE7TUFBQSxlQUFBLEdBQWtCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLHVCQUFoQjs7UUFDbEIsSUFBQyxDQUFBLE9BQVksSUFBQSxJQUFBLENBQUssZUFBTDs7TUFHYixJQUFBLEdBQU87TUFDUCxJQUFDLENBQUEsSUFBSSxDQUFDLEVBQU4sQ0FBUyw4QkFBVCxFQUF5QyxTQUFDLE1BQUQ7ZUFDdkMsSUFBSSxDQUFDLFdBQUwsQ0FBQTtNQUR1QyxDQUF6QztNQU1BLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDWixPQUFBLEVBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFCQUFoQixDQURHO1FBRVosV0FBQSxFQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix5QkFBaEIsQ0FGRDtRQUdaLFVBQUEsRUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isd0JBQWhCLENBSEE7UUFJWixVQUFBLEVBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHdCQUFoQixDQUpBO1FBS1osYUFBQSxFQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwyQkFBaEIsQ0FMSDtRQU1aLFlBQUEsRUFBYyxFQU5GOztNQVFkLElBQUMsQ0FBQSxjQUFELENBQUE7TUFFQSxJ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SUFBQyxDQUFBLFVBQTFCO09BQVg7SUFEYyxDQTVHaEI7SUFpSEEsV0FBQSxFQUFhLFNBQUMsVUFBRDtBQUNYLFVBQUE7TUFBQSxJQUFHLENBQUksSUFBQyxDQUFBLFFBQVI7UUFDRSxtQkFBQSxHQUFzQixPQUFBLENBQVEsdUJBQVI7UUFDdEIsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsYUFBVixDQUF3QixVQUF4QjtBQUVBO0FBQUEsYUFBQSxxQ0FBQTs7VUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLGNBQVYsQ0FBeUIsV0FBekI7QUFERixTQUxGOztBQVFBLGFBQU8sSUFBQyxDQUFBO0lBVEcsQ0FqSGI7SUE2SEEsTUFBQSxFQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsSUFBRyxDQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUFQO0FBQ0UsZUFERjs7TUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQW9DLENBQUM7TUFFaEQsSUFBRyxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLFFBQUEsQ0FBN0I7UUFFRSxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLFFBQUEsQ0FBMUIsR0FBc0M7ZUFDdEMsZUFBZ0IsQ0FBQSxRQUFBLENBQVUsQ0FBQSxNQUFBLENBQU8sQ0FBQyxxQkFBbEMsQ0FBQSxFQUhGO09BQUEsTUFBQTtRQU1FLGVBQWdCLENBQUEsUUFBQSxDQUFVLENBQUEsUUFBQSxDQUExQixHQUFzQztlQUN0QyxlQUFnQixDQUFBLFFBQUEsQ0FBVSxDQUFBLE1BQUEsQ0FBTyxDQUFDLGlCQUFsQyxDQUFBLEVBUEY7O0lBTE0sQ0E3SFI7O0FBTkYiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGFza30gPSByZXF1aXJlICdhdG9tJ1xuXG5TcGVsbENoZWNrVmlldyA9IG51bGxcbnNwZWxsQ2hlY2tWaWV3cyA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgIyBTZXQgdXAgdGhlIHRhc2sgZm9yIGhhbmRsaW5nIHNwZWxsLWNoZWNraW5nIGluIHRoZSBiYWNrZ3JvdW5kLiBUaGlzIGlzXG4gICAgIyB3aGF0IGlzIGFjdHVhbGx5IGluIHRoZSBiYWNrZ3JvdW5kLlxuICAgIGhhbmRsZXJGaWxlbmFtZSA9IHJlcXVpcmUucmVzb2x2ZSAnLi9zcGVsbC1jaGVjay1oYW5kbGVyJ1xuICAgIEB0YXNrID89IG5ldyBUYXNrIGhhbmRsZXJGaWxlbmFtZVxuXG4gICAgIyBTZXQgdXAgb3VyIGNhbGxiYWNrIHRvIHRyYWNrIHdoZW4gc2V0dGluZ3MgY2hhbmdlZC5cbiAgICB0aGF0ID0gdGhpc1xuICAgIEB0YXNrLm9uIFwic3BlbGwtY2hlY2s6c2V0dGluZ3MtY2hhbmdlZFwiLCAoaWdub3JlKSAtPlxuICAgICAgdGhhdC51cGRhdGVWaWV3cygpXG5cbiAgICAjIFNpbmNlIHRoZSBzcGVsbC1jaGVja2luZyBpcyBkb25lIG9uIGFub3RoZXIgcHJvY2Vzcywgd2UgZ2F0aGVyIHVwIGFsbCB0aGVcbiAgICAjIGFyZ3VtZW50cyBhbmQgcGFzcyB0aGVtIGludG8gdGhlIHRhc2suIFdoZW5ldmVyIHRoZXNlIGNoYW5nZSwgd2UnbGwgdXBkYXRlXG4gICAgIyB0aGUgb2JqZWN0IHdpdGggdGhlIHBhcmFtZXRlcnMgYW5kIHJlc2VuZCBpdCB0byB0aGUgdGFzay5cbiAgICBAZ2xvYmFsQXJncyA9IHtcbiAgICAgIGxvY2FsZXM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2subG9jYWxlcycpLFxuICAgICAgbG9jYWxlUGF0aHM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2subG9jYWxlUGF0aHMnKSxcbiAgICAgIHVzZUxvY2FsZXM6IGF0b20uY29uZmlnLmdldCgnc3BlbGwtY2hlY2sudXNlTG9jYWxlcycpLFxuICAgICAga25vd25Xb3JkczogYXRvbS5jb25maWcuZ2V0KCdzcGVsbC1jaGVjay5rbm93bldvcmRzJyksXG4gICAgICBhZGRLbm93bldvcmRzOiBhdG9tLmNvbmZpZy5nZXQoJ3NwZWxsLWNoZWNrLmFkZEtub3duV29yZHMnKSxcbiAgICAgIGNoZWNrZXJQYXRoczogW11cbiAgICB9XG4gICAgQHNlbmRHbG9iYWxBcmdzKClcblxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzcGVsbC1jaGVjay5sb2NhbGVzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLmxvY2FsZXMgPSBuZXdWYWx1ZVxuICAgICAgdGhhdC5zZW5kR2xvYmFsQXJncygpXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3NwZWxsLWNoZWNrLmxvY2FsZVBhdGhzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLmxvY2FsZVBhdGhzID0gbmV3VmFsdWVcbiAgICAgIHRoYXQuc2VuZEdsb2JhbEFyZ3MoKVxuICAgIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdzcGVsbC1jaGVjay51c2VMb2NhbGVzJywgKHtuZXdWYWx1ZSwgb2xkVmFsdWV9KSAtPlxuICAgICAgdGhhdC5nbG9iYWxBcmdzLnVzZUxvY2FsZXMgPSBuZXdWYWx1ZVxuICAgICAgdGhhdC5zZW5kR2xvYmFsQXJncygpXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3NwZWxsLWNoZWNrLmtub3duV29yZHMnLCAoe25ld1ZhbHVlLCBvbGRWYWx1ZX0pIC0+XG4gICAgICB0aGF0Lmdsb2JhbEFyZ3Mua25vd25Xb3JkcyA9IG5ld1ZhbHVlXG4gICAgICB0aGF0LnNlbmRHbG9iYWxBcmdzKClcbiAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BlbGwtY2hlY2suYWRkS25vd25Xb3JkcycsICh7bmV3VmFsdWUsIG9sZFZhbHVlfSkgLT5cbiAgICAgIHRoYXQuZ2xvYmFsQXJncy5hZGRLbm93bldvcmRzID0gbmV3VmFsdWVcbiAgICAgIHRoYXQuc2VuZEdsb2JhbEFyZ3MoKVxuXG4gICAgIyBIb29rIHVwIHRoZSBVSSBhbmQgcHJvY2Vzc2luZy5cbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgICdzcGVsbC1jaGVjazp0b2dnbGUnOiA9PiBAdG9nZ2xlKClcbiAgICBAdmlld3NCeUVkaXRvciA9IG5ldyBXZWFrTWFwXG4gICAgQGRpc3Bvc2FibGUgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgIFNwZWxsQ2hlY2tWaWV3ID89IHJlcXVpcmUgJy4vc3BlbGwtY2hlY2stdmlldydcblxuICAgICAgIyBUaGUgU3BlbGxDaGVja1ZpZXcgbmVlZHMgYm90aCBhIGhhbmRsZSBmb3IgdGhlIHRhc2sgdG8gaGFuZGxlIHRoZVxuICAgICAgIyBiYWNrZ3JvdW5kIGNoZWNraW5nIGFuZCBhIGNhY2hlZCB2aWV3IG9mIHRoZSBpbi1wcm9jZXNzIG1hbmFnZXIgZm9yXG4gICAgICAjIGdldHRpbmcgY29ycmVjdGlvbnMuIFdlIHVzZWQgYSBmdW5jdGlvbiB0byBhIGZ1bmN0aW9uIGJlY2F1c2Ugc2NvcGVcbiAgICAgICMgd2Fzbid0IHdvcmtpbmcgcHJvcGVybHkuXG4gICAgICBzcGVsbENoZWNrVmlldyA9IG5ldyBTcGVsbENoZWNrVmlldyhlZGl0b3IsIEB0YXNrLCA9PiBAZ2V0SW5zdGFuY2UgQGdsb2JhbEFyZ3MpXG5cbiAgICAgICMgc2F2ZSB0aGUge2VkaXRvcn0gaW50byBhIG1hcFxuICAgICAgZWRpdG9ySWQgPSBlZGl0b3IuaWRcbiAgICAgIHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF0gPSB7fVxuICAgICAgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsndmlldyddID0gc3BlbGxDaGVja1ZpZXdcbiAgICAgIHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF1bJ2FjdGl2ZSddID0gdHJ1ZVxuICAgICAgc3BlbGxDaGVja1ZpZXdzW2VkaXRvcklkXVsnZWRpdG9yJ10gPSBlZGl0b3JcbiAgICAgIEB2aWV3c0J5RWRpdG9yLnNldCBlZGl0b3IsIHNwZWxsQ2hlY2tWaWV3XG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAaW5zdGFuY2U/LmRlYWN0aXZhdGUoKVxuICAgIEBpbnN0YW5jZSA9IG51bGxcbiAgICBAdGFzaz8udGVybWluYXRlKClcbiAgICBAdGFzayA9IG51bGxcbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICBAY29tbWFuZFN1YnNjcmlwdGlvbiA9IG51bGxcblxuICAgICMgQ2xlYXIgb3V0IHRoZSBrbm93biB2aWV3cy5cbiAgICBmb3IgZWRpdG9ySWQgb2Ygc3BlbGxDaGVja1ZpZXdzXG4gICAgICB7dmlld30gPSBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdXG4gICAgICB2aWV3LmRlc3Ryb3koKVxuICAgIHNwZWxsQ2hlY2tWaWV3cyA9IHt9XG5cbiAgICAjIFdoaWxlIHdlIGhhdmUgV2Vha01hcC5jbGVhciwgaXQgaXNuJ3QgYSBmdW5jdGlvbiBhdmFpbGFibGUgaW4gRVM2LiBTbywgd2VcbiAgICAjIGp1c3QgcmVwbGFjZSB0aGUgV2Vha01hcCBlbnRpcmVseSBhbmQgbGV0IHRoZSBzeXN0ZW0gcmVsZWFzZSB0aGUgb2JqZWN0cy5cbiAgICBAdmlld3NCeUVkaXRvciA9IG5ldyBXZWFrTWFwXG5cbiAgICAjIEZpbmlzaCB1cCBieSBkaXNwb3NpbmcgZXZlcnl0aGluZyBlbHNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgcGx1Z2luLlxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gICMgUmVnaXN0ZXJzIGFueSBBdG9tIHBhY2thZ2VzIHRoYXQgcHJvdmlkZSBvdXIgc2VydmljZS4gQmVjYXVzZSB3ZSB1c2UgYSBUYXNrLFxuICAjIHdlIGhhdmUgdG8gbG9hZCB0aGUgcGx1Z2luJ3MgY2hlY2tlciBpbiBib3RoIHRoYXQgc2VydmljZSBhbmQgaW4gdGhlIEF0b21cbiAgIyBwcm9jZXNzIChmb3IgY29taW5nIHVwIHdpdGggY29ycmVjdGlvbnMpLiBTaW5jZSBldmVyeXRoaW5nIHBhc3NlZCB0byB0aGVcbiAgIyB0YXNrIG11c3QgYmUgSlNPTiBzZXJpYWxpemVkLCB3ZSBwYXNzIHRoZSBmdWxsIHBhdGggdG8gdGhlIHRhc2sgYW5kIGxldCBpdFxuICAjIHJlcXVpcmUgaXQgb24gdGhhdCBlbmQuXG4gIGNvbnN1bWVTcGVsbENoZWNrZXJzOiAoY2hlY2tlclBhdGhzKSAtPlxuICAgICMgTm9ybWFsaXplIGl0IHNvIHdlIGFsd2F5cyBoYXZlIGFuIGFycmF5LlxuICAgIHVubGVzcyBjaGVja2VyUGF0aHMgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgY2hlY2tlclBhdGhzID0gWyBjaGVja2VyUGF0aHMgXVxuXG4gICAgIyBHbyB0aHJvdWdoIGFuZCBhZGQgYW55IG5ldyBwbHVnaW5zIHRvIHRoZSBsaXN0LlxuICAgIGZvciBjaGVja2VyUGF0aCBpbiBjaGVja2VyUGF0aHNcbiAgICAgIGlmIGNoZWNrZXJQYXRoIG5vdCBpbiBAZ2xvYmFsQXJncy5jaGVja2VyUGF0aHNcbiAgICAgICAgQHRhc2s/LnNlbmQge3R5cGU6IFwiY2hlY2tlclwiLCBjaGVja2VyUGF0aDogY2hlY2tlclBhdGh9XG4gICAgICAgIEBpbnN0YW5jZT8uYWRkQ2hlY2tlclBhdGggY2hlY2tlclBhdGhcbiAgICAgICAgQGdsb2JhbEFyZ3MuY2hlY2tlclBhdGhzLnB1c2ggY2hlY2tlclBhdGhcblxuICBtaXNzcGVsbGluZ01hcmtlcnNGb3JFZGl0b3I6IChlZGl0b3IpIC0+XG4gICAgQHZpZXdzQnlFZGl0b3IuZ2V0KGVkaXRvcikubWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG5cbiAgdXBkYXRlVmlld3M6IC0+XG4gICAgZm9yIGVkaXRvcklkIG9mIHNwZWxsQ2hlY2tWaWV3c1xuICAgICAgdmlldyA9IHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF1cbiAgICAgIGlmIHZpZXdbJ2FjdGl2ZSddXG4gICAgICAgIHZpZXdbJ3ZpZXcnXS51cGRhdGVNaXNzcGVsbGluZ3MoKVxuXG4gIHNlbmRHbG9iYWxBcmdzOiAtPlxuICAgIEB0YXNrLnNlbmQge3R5cGU6IFwiZ2xvYmFsXCIsIGdsb2JhbDogQGdsb2JhbEFyZ3N9XG5cbiAgIyBSZXRyaWV2ZXMsIGNyZWF0aW5nIGlmIHJlcXVpcmVkLCBhIHNwZWxsaW5nIG1hbmFnZXIgZm9yIHVzZSB3aXRoXG4gICMgc3luY2hyb25vdXMgb3BlcmF0aW9ucyBzdWNoIGFzIHJldHJpZXZpbmcgY29ycmVjdGlvbnMuXG4gIGdldEluc3RhbmNlOiAoZ2xvYmFsQXJncykgLT5cbiAgICBpZiBub3QgQGluc3RhbmNlXG4gICAgICBTcGVsbENoZWNrZXJNYW5hZ2VyID0gcmVxdWlyZSAnLi9zcGVsbC1jaGVjay1tYW5hZ2VyJ1xuICAgICAgQGluc3RhbmNlID0gU3BlbGxDaGVja2VyTWFuYWdlclxuICAgICAgQGluc3RhbmNlLnNldEdsb2JhbEFyZ3MgZ2xvYmFsQXJnc1xuXG4gICAgICBmb3IgY2hlY2tlclBhdGggaW4gZ2xvYmFsQXJncy5jaGVja2VyUGF0aHNcbiAgICAgICAgQGluc3RhbmNlLmFkZENoZWNrZXJQYXRoIGNoZWNrZXJQYXRoXG5cbiAgICByZXR1cm4gQGluc3RhbmNlXG5cbiAgIyBJbnRlcm5hbDogVG9nZ2xlcyB0aGUgc3BlbGwtY2hlY2sgYWN0aXZhdGlvbiBzdGF0ZS5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIG5vdCBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIHJldHVyblxuICAgIGVkaXRvcklkID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLmlkXG5cbiAgICBpZiBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWydhY3RpdmUnXVxuICAgICAgIyBkZWFjdGl2YXRlIHNwZWxsIGNoZWNrIGZvciB0aGlzIHtlZGl0b3J9XG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWydhY3RpdmUnXSA9IGZhbHNlXG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWyd2aWV3J10udW5zdWJzY3JpYmVGcm9tQnVmZmVyKClcbiAgICBlbHNlXG4gICAgICAjIGFjdGl2YXRlIHNwZWxsIGNoZWNrIGZvciB0aGlzIHtlZGl0b3J9XG4gICAgICBzcGVsbENoZWNrVmlld3NbZWRpdG9ySWRdWydhY3RpdmUnXSA9IHRydWVcbiAgICAgIHNwZWxsQ2hlY2tWaWV3c1tlZGl0b3JJZF1bJ3ZpZXcnXS5zdWJzY3JpYmVUb0J1ZmZlcigpXG4iXX0=
