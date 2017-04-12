(function() {
  var GoToView, SymbolsView, TagReader, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  SymbolsView = require('./symbols-view');

  TagReader = require('./tag-reader');

  module.exports = GoToView = (function(superClass) {
    extend(GoToView, superClass);

    function GoToView() {
      return GoToView.__super__.constructor.apply(this, arguments);
    }

    GoToView.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.cancel();
      } else {
        return this.populate();
      }
    };

    GoToView.prototype.detached = function() {
      return typeof this.resolveFindTagPromise === "function" ? this.resolveFindTagPromise([]) : void 0;
    };

    GoToView.prototype.findTag = function(editor) {
      if (typeof this.resolveFindTagPromise === "function") {
        this.resolveFindTagPromise([]);
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          _this.resolveFindTagPromise = resolve;
          return TagReader.find(editor, function(error, matches) {
            if (matches == null) {
              matches = [];
            }
            if (error) {
              return reject(error);
            } else {
              return resolve(matches);
            }
          });
        };
      })(this));
    };

    GoToView.prototype.populate = function() {
      var editor;
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      return this.findTag(editor).then((function(_this) {
        return function(matches) {
          var i, len, match, position, tags;
          tags = [];
          for (i = 0, len = matches.length; i < len; i++) {
            match = matches[i];
            position = _this.getTagLine(match);
            if (!position) {
              continue;
            }
            match.name = path.basename(match.file);
            tags.push(match);
          }
          if (tags.length === 1) {
            return _this.openTag(tags[0]);
          } else if (tags.length > 0) {
            _this.setItems(tags);
            return _this.attach();
          }
        };
      })(this));
    };

    return GoToView;

  })(SymbolsView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL2dvLXRvLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxzQ0FBQTtJQUFBOzs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxTQUFBLEdBQVksT0FBQSxDQUFRLGNBQVI7O0VBRVosTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt1QkFDSixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLENBQUEsQ0FBSDtlQUNFLElBQUMsQ0FBQSxNQUFELENBQUEsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBSEY7O0lBRE07O3VCQU1SLFFBQUEsR0FBVSxTQUFBO2dFQUNSLElBQUMsQ0FBQSxzQkFBdUI7SUFEaEI7O3VCQUdWLE9BQUEsR0FBUyxTQUFDLE1BQUQ7O1FBQ1AsSUFBQyxDQUFBLHNCQUF1Qjs7YUFFcEIsSUFBQSxPQUFBLENBQVEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQsRUFBVSxNQUFWO1VBQ1YsS0FBQyxDQUFBLHFCQUFELEdBQXlCO2lCQUN6QixTQUFTLENBQUMsSUFBVixDQUFlLE1BQWYsRUFBdUIsU0FBQyxLQUFELEVBQVEsT0FBUjs7Y0FBUSxVQUFROztZQUNyQyxJQUFHLEtBQUg7cUJBQ0UsTUFBQSxDQUFPLEtBQVAsRUFERjthQUFBLE1BQUE7cUJBR0UsT0FBQSxDQUFRLE9BQVIsRUFIRjs7VUFEcUIsQ0FBdkI7UUFGVTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUjtJQUhHOzt1QkFXVCxRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO01BQ1QsSUFBYyxjQUFkO0FBQUEsZUFBQTs7YUFFQSxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBZ0IsQ0FBQyxJQUFqQixDQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtBQUNwQixjQUFBO1VBQUEsSUFBQSxHQUFPO0FBQ1AsZUFBQSx5Q0FBQTs7WUFDRSxRQUFBLEdBQVcsS0FBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaO1lBQ1gsSUFBQSxDQUFnQixRQUFoQjtBQUFBLHVCQUFBOztZQUNBLEtBQUssQ0FBQyxJQUFOLEdBQWEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxLQUFLLENBQUMsSUFBcEI7WUFDYixJQUFJLENBQUMsSUFBTCxDQUFVLEtBQVY7QUFKRjtVQU1BLElBQUcsSUFBSSxDQUFDLE1BQUwsS0FBZSxDQUFsQjttQkFDRSxLQUFDLENBQUEsT0FBRCxDQUFTLElBQUssQ0FBQSxDQUFBLENBQWQsRUFERjtXQUFBLE1BRUssSUFBRyxJQUFJLENBQUMsTUFBTCxHQUFjLENBQWpCO1lBQ0gsS0FBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWO21CQUNBLEtBQUMsQ0FBQSxNQUFELENBQUEsRUFGRzs7UUFWZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEI7SUFKUTs7OztLQXJCVztBQUx2QiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuU3ltYm9sc1ZpZXcgPSByZXF1aXJlICcuL3N5bWJvbHMtdmlldydcblRhZ1JlYWRlciA9IHJlcXVpcmUgJy4vdGFnLXJlYWRlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR29Ub1ZpZXcgZXh0ZW5kcyBTeW1ib2xzVmlld1xuICB0b2dnbGU6IC0+XG4gICAgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlXG4gICAgICBAcG9wdWxhdGUoKVxuXG4gIGRldGFjaGVkOiAtPlxuICAgIEByZXNvbHZlRmluZFRhZ1Byb21pc2U/KFtdKVxuXG4gIGZpbmRUYWc6IChlZGl0b3IpIC0+XG4gICAgQHJlc29sdmVGaW5kVGFnUHJvbWlzZT8oW10pXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgQHJlc29sdmVGaW5kVGFnUHJvbWlzZSA9IHJlc29sdmVcbiAgICAgIFRhZ1JlYWRlci5maW5kIGVkaXRvciwgKGVycm9yLCBtYXRjaGVzPVtdKSAtPlxuICAgICAgICBpZiBlcnJvclxuICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlc29sdmUobWF0Y2hlcylcblxuICBwb3B1bGF0ZTogLT5cbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cblxuICAgIEBmaW5kVGFnKGVkaXRvcikudGhlbiAobWF0Y2hlcykgPT5cbiAgICAgIHRhZ3MgPSBbXVxuICAgICAgZm9yIG1hdGNoIGluIG1hdGNoZXNcbiAgICAgICAgcG9zaXRpb24gPSBAZ2V0VGFnTGluZShtYXRjaClcbiAgICAgICAgY29udGludWUgdW5sZXNzIHBvc2l0aW9uXG4gICAgICAgIG1hdGNoLm5hbWUgPSBwYXRoLmJhc2VuYW1lKG1hdGNoLmZpbGUpXG4gICAgICAgIHRhZ3MucHVzaChtYXRjaClcblxuICAgICAgaWYgdGFncy5sZW5ndGggaXMgMVxuICAgICAgICBAb3BlblRhZyh0YWdzWzBdKVxuICAgICAgZWxzZSBpZiB0YWdzLmxlbmd0aCA+IDBcbiAgICAgICAgQHNldEl0ZW1zKHRhZ3MpXG4gICAgICAgIEBhdHRhY2goKVxuIl19
