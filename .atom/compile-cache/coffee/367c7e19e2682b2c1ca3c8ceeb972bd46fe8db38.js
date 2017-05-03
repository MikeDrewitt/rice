(function() {
  var CompositeDisposable, CorrectionsView, SpellCheckTask, SpellCheckView, _;

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  SpellCheckTask = require('./spell-check-task');

  CorrectionsView = null;

  module.exports = SpellCheckView = (function() {
    SpellCheckView.content = function() {
      return this.div({
        "class": 'spell-check'
      });
    };

    function SpellCheckView(editor, task, getInstance) {
      this.editor = editor;
      this.task = task;
      this.getInstance = getInstance;
      this.disposables = new CompositeDisposable;
      this.initializeMarkerLayer();
      this.taskWrapper = new SpellCheckTask(this.task);
      this.correctMisspellingCommand = atom.commands.add(atom.views.getView(this.editor), 'spell-check:correct-misspelling', (function(_this) {
        return function() {
          var marker, ref;
          if (marker = _this.markerLayer.findMarkers({
            containsBufferPosition: _this.editor.getCursorBufferPosition()
          })[0]) {
            if (CorrectionsView == null) {
              CorrectionsView = require('./corrections-view');
            }
            if ((ref = _this.correctionsView) != null) {
              ref.destroy();
            }
            return _this.correctionsView = new CorrectionsView(_this.editor, _this.getCorrections(marker), marker, _this, _this.updateMisspellings);
          }
        };
      })(this));
      this.taskWrapper.onDidSpellCheck((function(_this) {
        return function(misspellings) {
          _this.destroyMarkers();
          if (_this.buffer != null) {
            return _this.addMarkers(misspellings);
          }
        };
      })(this));
      this.disposables.add(this.editor.onDidChangePath((function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(this.editor.onDidChangeGrammar((function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('editor.fontSize', (function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('spell-check.grammars', (function(_this) {
        return function() {
          return _this.subscribeToBuffer();
        };
      })(this)));
      this.subscribeToBuffer();
      this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)));
    }

    SpellCheckView.prototype.initializeMarkerLayer = function() {
      this.markerLayer = this.editor.addMarkerLayer({
        maintainHistory: false
      });
      return this.markerLayerDecoration = this.editor.decorateMarkerLayer(this.markerLayer, {
        type: 'highlight',
        "class": 'spell-check-misspelling',
        deprecatedRegionClass: 'misspelling'
      });
    };

    SpellCheckView.prototype.destroy = function() {
      var ref;
      this.unsubscribeFromBuffer();
      this.disposables.dispose();
      this.taskWrapper.terminate();
      this.markerLayer.destroy();
      this.markerLayerDecoration.destroy();
      this.correctMisspellingCommand.dispose();
      return (ref = this.correctionsView) != null ? ref.remove() : void 0;
    };

    SpellCheckView.prototype.unsubscribeFromBuffer = function() {
      this.destroyMarkers();
      if (this.buffer != null) {
        this.bufferDisposable.dispose();
        return this.buffer = null;
      }
    };

    SpellCheckView.prototype.subscribeToBuffer = function() {
      this.unsubscribeFromBuffer();
      if (this.spellCheckCurrentGrammar()) {
        this.buffer = this.editor.getBuffer();
        this.bufferDisposable = this.buffer.onDidStopChanging((function(_this) {
          return function() {
            return _this.updateMisspellings();
          };
        })(this));
        return this.updateMisspellings();
      }
    };

    SpellCheckView.prototype.spellCheckCurrentGrammar = function() {
      var grammar;
      grammar = this.editor.getGrammar().scopeName;
      return _.contains(atom.config.get('spell-check.grammars'), grammar);
    };

    SpellCheckView.prototype.destroyMarkers = function() {
      this.markerLayer.destroy();
      this.markerLayerDecoration.destroy();
      return this.initializeMarkerLayer();
    };

    SpellCheckView.prototype.addMarkers = function(misspellings) {
      var i, len, misspelling, results;
      results = [];
      for (i = 0, len = misspellings.length; i < len; i++) {
        misspelling = misspellings[i];
        results.push(this.markerLayer.markBufferRange(misspelling, {
          invalidate: 'touch'
        }));
      }
      return results;
    };

    SpellCheckView.prototype.updateMisspellings = function() {
      var error, ref;
      try {
        return this.taskWrapper.start(this.editor.buffer);
      } catch (error1) {
        error = error1;
        return console.warn('Error starting spell check task', (ref = error.stack) != null ? ref : error);
      }
    };

    SpellCheckView.prototype.getCorrections = function(marker) {
      var args, instance, misspelling, projectPath, ref, ref1, ref2, relativePath;
      projectPath = null;
      relativePath = null;
      if ((ref = this.buffer) != null ? (ref1 = ref.file) != null ? ref1.path : void 0 : void 0) {
        ref2 = atom.project.relativizePath(this.buffer.file.path), projectPath = ref2[0], relativePath = ref2[1];
      }
      args = {
        projectPath: projectPath,
        relativePath: relativePath
      };
      instance = this.getInstance();
      misspelling = this.editor.getTextInBufferRange(marker.getBufferRange());
      return instance.suggest(args, misspelling);
    };

    return SpellCheckView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3NwZWxsLWNoZWNrL2xpYi9zcGVsbC1jaGVjay12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG9CQUFSOztFQUVqQixlQUFBLEdBQWtCOztFQUVsQixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ0osY0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtPQUFMO0lBRFE7O0lBR0csd0JBQUMsTUFBRCxFQUFVLElBQVYsRUFBaUIsV0FBakI7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxPQUFEO01BQU8sSUFBQyxDQUFBLGNBQUQ7TUFDNUIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxxQkFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBbUIsSUFBQSxjQUFBLENBQWUsSUFBQyxDQUFBLElBQWhCO01BRW5CLElBQUMsQ0FBQSx5QkFBRCxHQUE2QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFwQixDQUFsQixFQUErQyxpQ0FBL0MsRUFBa0YsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQzdHLGNBQUE7VUFBQSxJQUFHLE1BQUEsR0FBUyxLQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBeUI7WUFBQyxzQkFBQSxFQUF3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OztxQkFDRSxJQUFDLENBQUEsV0FBVyxDQUFDLGVBQWIsQ0FBNkIsV0FBN0IsRUFBMEM7VUFBQyxVQUFBLEVBQVksT0FBYjtTQUExQztBQURGOztJQURVOzs2QkFJWixrQkFBQSxHQUFvQixTQUFBO0FBRWxCLFVBQUE7QUFBQTtlQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBYixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQTNCLEVBREY7T0FBQSxjQUFBO1FBRU07ZUFDSixPQUFPLENBQUMsSUFBUixDQUFhLGlDQUFiLHNDQUE4RCxLQUE5RCxFQUhGOztJQUZrQjs7NkJBT3BCLGNBQUEsR0FBZ0IsU0FBQyxNQUFEO0FBRWQsVUFBQTtNQUFBLFdBQUEsR0FBYztNQUNkLFlBQUEsR0FBZTtNQUNmLGtFQUFnQixDQUFFLHNCQUFsQjtRQUNFLE9BQThCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYixDQUE0QixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUF6QyxDQUE5QixFQUFDLHFCQUFELEVBQWMsdUJBRGhCOztNQUVBLElBQUEsR0FBTztRQUNMLFdBQUEsRUFBYSxXQURSO1FBRUwsWUFBQSxFQUFjLFlBRlQ7O01BTVAsUUFBQSxHQUFXLElBQUMsQ0FBQSxXQUFELENBQUE7TUFDWCxXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixNQUFNLENBQUMsY0FBUCxDQUFBLENBQTdCO2FBQ2QsUUFBUSxDQUFDLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUIsV0FBdkI7SUFkYzs7Ozs7QUE5RmxCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TcGVsbENoZWNrVGFzayA9IHJlcXVpcmUgJy4vc3BlbGwtY2hlY2stdGFzaydcblxuQ29ycmVjdGlvbnNWaWV3ID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTcGVsbENoZWNrVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAnc3BlbGwtY2hlY2snXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAdGFzaywgQGdldEluc3RhbmNlKSAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGluaXRpYWxpemVNYXJrZXJMYXllcigpXG4gICAgQHRhc2tXcmFwcGVyID0gbmV3IFNwZWxsQ2hlY2tUYXNrIEB0YXNrXG5cbiAgICBAY29ycmVjdE1pc3NwZWxsaW5nQ29tbWFuZCA9IGF0b20uY29tbWFuZHMuYWRkIGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKSwgJ3NwZWxsLWNoZWNrOmNvcnJlY3QtbWlzc3BlbGxpbmcnLCA9PlxuICAgICAgaWYgbWFya2VyID0gQG1hcmtlckxheWVyLmZpbmRNYXJrZXJzKHtjb250YWluc0J1ZmZlclBvc2l0aW9uOiBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCl9KVswXVxuICAgICAgICBDb3JyZWN0aW9uc1ZpZXcgPz0gcmVxdWlyZSAnLi9jb3JyZWN0aW9ucy12aWV3J1xuICAgICAgICBAY29ycmVjdGlvbnNWaWV3Py5kZXN0cm95KClcbiAgICAgICAgQGNvcnJlY3Rpb25zVmlldyA9IG5ldyBDb3JyZWN0aW9uc1ZpZXcoQGVkaXRvciwgQGdldENvcnJlY3Rpb25zKG1hcmtlciksIG1hcmtlciwgdGhpcywgQHVwZGF0ZU1pc3NwZWxsaW5ncylcblxuICAgIEB0YXNrV3JhcHBlci5vbkRpZFNwZWxsQ2hlY2sgKG1pc3NwZWxsaW5ncykgPT5cbiAgICAgIEBkZXN0cm95TWFya2VycygpXG4gICAgICBAYWRkTWFya2VycyhtaXNzcGVsbGluZ3MpIGlmIEBidWZmZXI/XG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VQYXRoID0+XG4gICAgICBAc3Vic2NyaWJlVG9CdWZmZXIoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hciA9PlxuICAgICAgQHN1YnNjcmliZVRvQnVmZmVyKClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2VkaXRvci5mb250U2l6ZScsID0+XG4gICAgICBAc3Vic2NyaWJlVG9CdWZmZXIoKVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnc3BlbGwtY2hlY2suZ3JhbW1hcnMnLCA9PlxuICAgICAgQHN1YnNjcmliZVRvQnVmZmVyKClcblxuICAgIEBzdWJzY3JpYmVUb0J1ZmZlcigpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgaW5pdGlhbGl6ZU1hcmtlckxheWVyOiAtPlxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoe21haW50YWluSGlzdG9yeTogZmFsc2V9KVxuICAgIEBtYXJrZXJMYXllckRlY29yYXRpb24gPSBAZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIoQG1hcmtlckxheWVyLCB7XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0JyxcbiAgICAgIGNsYXNzOiAnc3BlbGwtY2hlY2stbWlzc3BlbGxpbmcnLFxuICAgICAgZGVwcmVjYXRlZFJlZ2lvbkNsYXNzOiAnbWlzc3BlbGxpbmcnXG4gICAgfSlcblxuICBkZXN0cm95OiAtPlxuICAgIEB1bnN1YnNjcmliZUZyb21CdWZmZXIoKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAdGFza1dyYXBwZXIudGVybWluYXRlKClcbiAgICBAbWFya2VyTGF5ZXIuZGVzdHJveSgpXG4gICAgQG1hcmtlckxheWVyRGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICBAY29ycmVjdE1pc3NwZWxsaW5nQ29tbWFuZC5kaXNwb3NlKClcbiAgICBAY29ycmVjdGlvbnNWaWV3Py5yZW1vdmUoKVxuXG4gIHVuc3Vic2NyaWJlRnJvbUJ1ZmZlcjogLT5cbiAgICBAZGVzdHJveU1hcmtlcnMoKVxuXG4gICAgaWYgQGJ1ZmZlcj9cbiAgICAgIEBidWZmZXJEaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgQGJ1ZmZlciA9IG51bGxcblxuICBzdWJzY3JpYmVUb0J1ZmZlcjogLT5cbiAgICBAdW5zdWJzY3JpYmVGcm9tQnVmZmVyKClcblxuICAgIGlmIEBzcGVsbENoZWNrQ3VycmVudEdyYW1tYXIoKVxuICAgICAgQGJ1ZmZlciA9IEBlZGl0b3IuZ2V0QnVmZmVyKClcbiAgICAgIEBidWZmZXJEaXNwb3NhYmxlID0gQGJ1ZmZlci5vbkRpZFN0b3BDaGFuZ2luZyA9PiBAdXBkYXRlTWlzc3BlbGxpbmdzKClcbiAgICAgIEB1cGRhdGVNaXNzcGVsbGluZ3MoKVxuXG4gIHNwZWxsQ2hlY2tDdXJyZW50R3JhbW1hcjogLT5cbiAgICBncmFtbWFyID0gQGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lXG4gICAgXy5jb250YWlucyhhdG9tLmNvbmZpZy5nZXQoJ3NwZWxsLWNoZWNrLmdyYW1tYXJzJyksIGdyYW1tYXIpXG5cbiAgZGVzdHJveU1hcmtlcnM6IC0+XG4gICAgQG1hcmtlckxheWVyLmRlc3Ryb3koKVxuICAgIEBtYXJrZXJMYXllckRlY29yYXRpb24uZGVzdHJveSgpXG4gICAgQGluaXRpYWxpemVNYXJrZXJMYXllcigpXG5cbiAgYWRkTWFya2VyczogKG1pc3NwZWxsaW5ncykgLT5cbiAgICBmb3IgbWlzc3BlbGxpbmcgaW4gbWlzc3BlbGxpbmdzXG4gICAgICBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKG1pc3NwZWxsaW5nLCB7aW52YWxpZGF0ZTogJ3RvdWNoJ30pXG5cbiAgdXBkYXRlTWlzc3BlbGxpbmdzOiAtPlxuICAgICMgVGFzazo6c3RhcnQgY2FuIHRocm93IGVycm9ycyBhdG9tL2F0b20jMzMyNlxuICAgIHRyeVxuICAgICAgQHRhc2tXcmFwcGVyLnN0YXJ0IEBlZGl0b3IuYnVmZmVyXG4gICAgY2F0Y2ggZXJyb3JcbiAgICAgIGNvbnNvbGUud2FybignRXJyb3Igc3RhcnRpbmcgc3BlbGwgY2hlY2sgdGFzaycsIGVycm9yLnN0YWNrID8gZXJyb3IpXG5cbiAgZ2V0Q29ycmVjdGlvbnM6IChtYXJrZXIpIC0+XG4gICAgIyBCdWlsZCB1cCB0aGUgYXJndW1lbnRzIG9iamVjdCBmb3IgdGhpcyBidWZmZXIgYW5kIHRleHQuXG4gICAgcHJvamVjdFBhdGggPSBudWxsXG4gICAgcmVsYXRpdmVQYXRoID0gbnVsbFxuICAgIGlmIEBidWZmZXI/LmZpbGU/LnBhdGhcbiAgICAgIFtwcm9qZWN0UGF0aCwgcmVsYXRpdmVQYXRoXSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChAYnVmZmVyLmZpbGUucGF0aClcbiAgICBhcmdzID0ge1xuICAgICAgcHJvamVjdFBhdGg6IHByb2plY3RQYXRoLFxuICAgICAgcmVsYXRpdmVQYXRoOiByZWxhdGl2ZVBhdGhcbiAgICB9XG5cbiAgICAjIEdldCB0aGUgbWlzc3BlbGxlZCB3b3JkIGFuZCB0aGVuIHJlcXVlc3QgY29ycmVjdGlvbnMuXG4gICAgaW5zdGFuY2UgPSBAZ2V0SW5zdGFuY2UoKVxuICAgIG1pc3NwZWxsaW5nID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGluc3RhbmNlLnN1Z2dlc3QgYXJncywgbWlzc3BlbGxpbmdcbiJdfQ==
