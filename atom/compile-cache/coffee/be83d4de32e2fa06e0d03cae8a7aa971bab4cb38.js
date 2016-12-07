(function() {
  var CompositeDisposable, LeadingWhitespace, MatchView, Range, View, ref, removeLeadingWhitespace,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  ref = require('atom'), Range = ref.Range, CompositeDisposable = ref.CompositeDisposable;

  LeadingWhitespace = /^\s+/;

  removeLeadingWhitespace = function(string) {
    return string.replace(LeadingWhitespace, '');
  };

  module.exports = MatchView = (function(superClass) {
    extend(MatchView, superClass);

    function MatchView() {
      this.render = bind(this.render, this);
      return MatchView.__super__.constructor.apply(this, arguments);
    }

    MatchView.content = function(model, arg) {
      var filePath, match, matchEnd, matchStart, prefix, range, suffix;
      filePath = arg.filePath, match = arg.match;
      range = Range.fromObject(match.range);
      matchStart = range.start.column - match.lineTextOffset;
      matchEnd = range.end.column - match.lineTextOffset;
      prefix = removeLeadingWhitespace(match.lineText.slice(0, matchStart));
      suffix = match.lineText.slice(matchEnd);
      return this.li({
        "class": 'search-result list-item'
      }, (function(_this) {
        return function() {
          _this.span(range.start.row + 1, {
            "class": 'line-number text-subtle'
          });
          return _this.span({
            "class": 'preview',
            outlet: 'preview'
          }, function() {
            _this.span(prefix);
            _this.span(match.matchText, {
              "class": 'match highlight-info',
              outlet: 'matchText'
            });
            _this.span(match.matchText, {
              "class": 'replacement highlight-success',
              outlet: 'replacementText'
            });
            return _this.span(suffix);
          });
        };
      })(this));
    };

    MatchView.prototype.initialize = function(model1, arg) {
      var fontFamily;
      this.model = model1;
      this.filePath = arg.filePath, this.match = arg.match;
      this.render();
      if (fontFamily = atom.config.get('editor.fontFamily')) {
        return this.preview.css('font-family', fontFamily);
      }
    };

    MatchView.prototype.attached = function() {
      this.subscriptions = new CompositeDisposable;
      return this.subscriptions.add(this.model.getFindOptions().onDidChangeReplacePattern(this.render));
    };

    MatchView.prototype.detached = function() {
      return this.subscriptions.dispose();
    };

    MatchView.prototype.render = function() {
      var replacementText;
      if (this.model.getFindOptions().replacePattern && this.model.regex && (this.model.replacedPathCount == null)) {
        replacementText = this.match.matchText.replace(this.model.regex, this.model.getFindOptions().replacePattern);
        this.replacementText.text(replacementText);
        this.replacementText.show();
        return this.matchText.removeClass('highlight-info').addClass('highlight-error');
      } else {
        this.replacementText.text('').hide();
        return this.matchText.removeClass('highlight-error').addClass('highlight-info');
      }
    };

    MatchView.prototype.confirm = function(options) {
      var editorPromise, openInRightPane;
      if (options == null) {
        options = {};
      }
      openInRightPane = atom.config.get('find-and-replace.openProjectFindResultsInRightPane');
      if (openInRightPane) {
        options.split = 'left';
      }
      editorPromise = atom.workspace.open(this.filePath, options);
      editorPromise.then((function(_this) {
        return function(editor) {
          return editor.setSelectedBufferRange(_this.match.range, {
            autoscroll: true
          });
        };
      })(this));
      return editorPromise;
    };

    MatchView.prototype.copy = function() {
      return atom.clipboard.write(this.match.lineText);
    };

    return MatchView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9maW5kLWFuZC1yZXBsYWNlL2xpYi9wcm9qZWN0L21hdGNoLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0RkFBQTtJQUFBOzs7O0VBQUMsT0FBUSxPQUFBLENBQVEsc0JBQVI7O0VBQ1QsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxpQkFBRCxFQUFROztFQUVSLGlCQUFBLEdBQW9COztFQUNwQix1QkFBQSxHQUEwQixTQUFDLE1BQUQ7V0FBWSxNQUFNLENBQUMsT0FBUCxDQUFlLGlCQUFmLEVBQWtDLEVBQWxDO0VBQVo7O0VBRTFCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7O0lBQ0osU0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEtBQUQsRUFBUSxHQUFSO0FBQ1IsVUFBQTtNQURpQix5QkFBVTtNQUMzQixLQUFBLEdBQVEsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsS0FBSyxDQUFDLEtBQXZCO01BQ1IsVUFBQSxHQUFhLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBWixHQUFxQixLQUFLLENBQUM7TUFDeEMsUUFBQSxHQUFXLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBVixHQUFtQixLQUFLLENBQUM7TUFDcEMsTUFBQSxHQUFTLHVCQUFBLENBQXdCLEtBQUssQ0FBQyxRQUFTLHFCQUF2QztNQUNULE1BQUEsR0FBUyxLQUFLLENBQUMsUUFBUzthQUV4QixJQUFDLENBQUEsRUFBRCxDQUFJO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx5QkFBUDtPQUFKLEVBQXNDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNwQyxLQUFDLENBQUEsSUFBRCxDQUFNLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBWixHQUFrQixDQUF4QixF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LENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUNqQixNQUFNLENBQUMsc0JBQVAsQ0FBOEIsS0FBQyxDQUFBLEtBQUssQ0FBQyxLQUFyQyxFQUE0QztZQUFBLFVBQUEsRUFBWSxJQUFaO1dBQTVDO1FBRGlCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFuQjthQUVBO0lBTk87O3dCQVFULElBQUEsR0FBTSxTQUFBO2FBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFmLENBQXFCLElBQUMsQ0FBQSxLQUFLLENBQUMsUUFBNUI7SUFESTs7OztLQTdDZ0I7QUFQeEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5MZWFkaW5nV2hpdGVzcGFjZSA9IC9eXFxzKy9cbnJlbW92ZUxlYWRpbmdXaGl0ZXNwYWNlID0gKHN0cmluZykgLT4gc3RyaW5nLnJlcGxhY2UoTGVhZGluZ1doaXRlc3BhY2UsICcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBNYXRjaFZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAobW9kZWwsIHtmaWxlUGF0aCwgbWF0Y2h9KSAtPlxuICAgIHJhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChtYXRjaC5yYW5nZSlcbiAgICBtYXRjaFN0YXJ0ID0gcmFuZ2Uuc3RhcnQuY29sdW1uIC0gbWF0Y2gubGluZVRleHRPZmZzZXRcbiAgICBtYXRjaEVuZCA9IHJhbmdlLmVuZC5jb2x1bW4gLSBtYXRjaC5saW5lVGV4dE9mZnNldFxuICAgIHByZWZpeCA9IHJlbW92ZUxlYWRpbmdXaGl0ZXNwYWNlKG1hdGNoLmxpbmVUZXh0WzAuLi5tYXRjaFN0YXJ0XSlcbiAgICBzdWZmaXggPSBtYXRjaC5saW5lVGV4dFttYXRjaEVuZC4uXVxuXG4gICAgQGxpIGNsYXNzOiAnc2VhcmNoLXJlc3VsdCBsaXN0LWl0ZW0nLCA9PlxuICAgICAgQHNwYW4gcmFuZ2Uuc3RhcnQucm93ICsgMSwgY2xhc3M6ICdsaW5lLW51bWJlciB0ZXh0LXN1YnRsZSdcbiAgICAgIEBzcGFuIGNsYXNzOiAncHJldmlldycsIG91dGxldDogJ3ByZXZpZXcnLCA9PlxuICAgICAgICBAc3BhbiBwcmVmaXhcbiAgICAgICAgQHNwYW4gbWF0Y2gubWF0Y2hUZXh0LCBjbGFzczogJ21hdGNoIGhpZ2hsaWdodC1pbmZvJywgb3V0bGV0OiAnbWF0Y2hUZXh0J1xuICAgICAgICBAc3BhbiBtYXRjaC5tYXRjaFRleHQsIGNsYXNzOiAncmVwbGFjZW1lbnQgaGlnaGxpZ2h0LXN1Y2Nlc3MnLCBvdXRsZXQ6ICdyZXBsYWNlbWVudFRleHQnXG4gICAgICAgIEBzcGFuIHN1ZmZpeFxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIHtAZmlsZVBhdGgsIEBtYXRjaH0pIC0+XG4gICAgQHJlbmRlcigpXG4gICAgaWYgZm9udEZhbWlseSA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLmZvbnRGYW1pbHknKVxuICAgICAgQHByZXZpZXcuY3NzKCdmb250LWZhbWlseScsIGZvbnRGYW1pbHkpXG5cbiAgYXR0YWNoZWQ6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS5vbkRpZENoYW5nZVJlcGxhY2VQYXR0ZXJuIEByZW5kZXJcblxuICBkZXRhY2hlZDogLT4gQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgcmVuZGVyOiA9PlxuICAgIGlmIEBtb2RlbC5nZXRGaW5kT3B0aW9ucygpLnJlcGxhY2VQYXR0ZXJuIGFuZCBAbW9kZWwucmVnZXggYW5kIG5vdCBAbW9kZWwucmVwbGFjZWRQYXRoQ291bnQ/XG4gICAgICByZXBsYWNlbWVudFRleHQgPSBAbWF0Y2gubWF0Y2hUZXh0LnJlcGxhY2UoQG1vZGVsLnJlZ2V4LCBAbW9kZWwuZ2V0RmluZE9wdGlvbnMoKS5yZXBsYWNlUGF0dGVybilcbiAgICAgIEByZXBsYWNlbWVudFRleHQudGV4dChyZXBsYWNlbWVudFRleHQpXG4gICAgICBAcmVwbGFjZW1lbnRUZXh0LnNob3coKVxuICAgICAgQG1hdGNoVGV4dC5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0LWluZm8nKS5hZGRDbGFzcygnaGlnaGxpZ2h0LWVycm9yJylcbiAgICBlbHNlXG4gICAgICBAcmVwbGFjZW1lbnRUZXh0LnRleHQoJycpLmhpZGUoKVxuICAgICAgQG1hdGNoVGV4dC5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0LWVycm9yJykuYWRkQ2xhc3MoJ2hpZ2hsaWdodC1pbmZvJylcblxuICBjb25maXJtOiAob3B0aW9ucyA9IHt9KSAtPlxuICAgIG9wZW5JblJpZ2h0UGFuZSA9IGF0b20uY29uZmlnLmdldCgnZmluZC1hbmQtcmVwbGFjZS5vcGVuUHJvamVjdEZpbmRSZXN1bHRzSW5SaWdodFBhbmUnKVxuICAgIG9wdGlvbnMuc3BsaXQgPSAnbGVmdCcgaWYgb3BlbkluUmlnaHRQYW5lXG4gICAgZWRpdG9yUHJvbWlzZSA9IGF0b20ud29ya3NwYWNlLm9wZW4oQGZpbGVQYXRoLCBvcHRpb25zKVxuICAgIGVkaXRvclByb21pc2UudGhlbiAoZWRpdG9yKSA9PlxuICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoQG1hdGNoLnJhbmdlLCBhdXRvc2Nyb2xsOiB0cnVlKVxuICAgIGVkaXRvclByb21pc2VcblxuICBjb3B5OiAtPlxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKEBtYXRjaC5saW5lVGV4dClcbiJdfQ==
