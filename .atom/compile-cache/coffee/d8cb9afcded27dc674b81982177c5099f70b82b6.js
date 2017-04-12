(function() {
  var CompositeDisposable, File, ProjectView, SymbolsView, TagReader, getTagsFile, humanize, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, File = ref.File;

  humanize = require('humanize-plus');

  SymbolsView = require('./symbols-view');

  TagReader = require('./tag-reader');

  getTagsFile = require('./get-tags-file');

  module.exports = ProjectView = (function(superClass) {
    extend(ProjectView, superClass);

    function ProjectView() {
      return ProjectView.__super__.constructor.apply(this, arguments);
    }

    ProjectView.prototype.initialize = function() {
      ProjectView.__super__.initialize.apply(this, arguments);
      this.reloadTags = true;
      return this.setMaxItems(10);
    };

    ProjectView.prototype.destroy = function() {
      this.stopTask();
      this.unwatchTagsFiles();
      return ProjectView.__super__.destroy.apply(this, arguments);
    };

    ProjectView.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.cancel();
      } else {
        this.populate();
        return this.attach();
      }
    };

    ProjectView.prototype.getEmptyMessage = function(itemCount) {
      if (itemCount === 0) {
        return 'Project has no tags file or it is empty';
      } else {
        return ProjectView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    ProjectView.prototype.populate = function() {
      var tagsRead;
      if (this.tags) {
        this.setItems(this.tags);
      }
      if (this.reloadTags) {
        this.reloadTags = false;
        this.startTask();
        if (this.tags) {
          return this.setLoading("Reloading project symbols\u2026");
        } else {
          this.setLoading('Loading project symbols\u2026');
          this.loadingBadge.text('0');
          tagsRead = 0;
          return this.loadTagsTask.on('tags', (function(_this) {
            return function(tags) {
              tagsRead += tags.length;
              return _this.loadingBadge.text(humanize.intComma(tagsRead));
            };
          })(this));
        }
      }
    };

    ProjectView.prototype.stopTask = function() {
      var ref1;
      return (ref1 = this.loadTagsTask) != null ? ref1.terminate() : void 0;
    };

    ProjectView.prototype.startTask = function() {
      this.stopTask();
      this.loadTagsTask = TagReader.getAllTags((function(_this) {
        return function(tags1) {
          _this.tags = tags1;
          _this.reloadTags = _this.tags.length === 0;
          return _this.setItems(_this.tags);
        };
      })(this));
      return this.watchTagsFiles();
    };

    ProjectView.prototype.watchTagsFiles = function() {
      var i, len, projectPath, ref1, reloadTags, tagsFile, tagsFilePath;
      this.unwatchTagsFiles();
      this.tagsFileSubscriptions = new CompositeDisposable();
      reloadTags = (function(_this) {
        return function() {
          _this.reloadTags = true;
          return _this.watchTagsFiles();
        };
      })(this);
      ref1 = atom.project.getPaths();
      for (i = 0, len = ref1.length; i < len; i++) {
        projectPath = ref1[i];
        if (tagsFilePath = getTagsFile(projectPath)) {
          tagsFile = new File(tagsFilePath);
          this.tagsFileSubscriptions.add(tagsFile.onDidChange(reloadTags));
          this.tagsFileSubscriptions.add(tagsFile.onDidDelete(reloadTags));
          this.tagsFileSubscriptions.add(tagsFile.onDidRename(reloadTags));
        }
      }
    };

    ProjectView.prototype.unwatchTagsFiles = function() {
      var ref1;
      if ((ref1 = this.tagsFileSubscriptions) != null) {
        ref1.dispose();
      }
      return this.tagsFileSubscriptions = null;
    };

    return ProjectView;

  })(SymbolsView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL3Byb2plY3Qtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBGQUFBO0lBQUE7OztFQUFBLE1BQThCLE9BQUEsQ0FBUSxNQUFSLENBQTlCLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLFFBQUEsR0FBVyxPQUFBLENBQVEsZUFBUjs7RUFDWCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFDWixXQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztFQUVkLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7MEJBQ0osVUFBQSxHQUFZLFNBQUE7TUFDViw2Q0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYzthQUNkLElBQUMsQ0FBQSxXQUFELENBQWEsRUFBYjtJQUhVOzswQkFLWixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUMsQ0FBQSxRQUFELENBQUE7TUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTthQUNBLDBDQUFBLFNBQUE7SUFITzs7MEJBS1QsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFHLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFBLENBQUg7ZUFDRSxJQUFDLENBQUEsTUFBRCxDQUFBLEVBREY7T0FBQSxNQUFBO1FBR0UsSUFBQyxDQUFBLFFBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxNQUFELENBQUEsRUFKRjs7SUFETTs7MEJBT1IsZUFBQSxHQUFpQixTQUFDLFNBQUQ7TUFDZixJQUFHLFNBQUEsS0FBYSxDQUFoQjtlQUNFLDBDQURGO09BQUEsTUFBQTtlQUdFLGtEQUFBLFNBQUEsRUFIRjs7SUFEZTs7MEJBTWpCLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLElBQUo7UUFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxJQUFYLEVBREY7O01BR0EsSUFBRyxJQUFDLENBQUEsVUFBSjtRQUNFLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsU0FBRCxDQUFBO1FBRUEsSUFBRyxJQUFDLENBQUEsSUFBSjtpQkFDRSxJQUFDLENBQUEsVUFBRCxDQUFZLGlDQUFaLEVBREY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLFVBQUQsQ0FBWSwrQkFBWjtVQUNBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFtQixHQUFuQjtVQUNBLFFBQUEsR0FBVztpQkFDWCxJQUFDLENBQUEsWUFBWSxDQUFDLEVBQWQsQ0FBaUIsTUFBakIsRUFBeUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxJQUFEO2NBQ3ZCLFFBQUEsSUFBWSxJQUFJLENBQUM7cUJBQ2pCLEtBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxDQUFtQixRQUFRLENBQUMsUUFBVCxDQUFrQixRQUFsQixDQUFuQjtZQUZ1QjtVQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekIsRUFORjtTQUpGOztJQUpROzswQkFrQlYsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO3NEQUFhLENBQUUsU0FBZixDQUFBO0lBRFE7OzBCQUdWLFNBQUEsR0FBVyxTQUFBO01BQ1QsSUFBQyxDQUFBLFFBQUQsQ0FBQTtNQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLFNBQVMsQ0FBQyxVQUFWLENBQXFCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO1VBQUMsS0FBQyxDQUFBLE9BQUQ7VUFDcEMsS0FBQyxDQUFBLFVBQUQsR0FBYyxLQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sS0FBZ0I7aUJBQzlCLEtBQUMsQ0FBQSxRQUFELENBQVUsS0FBQyxDQUFBLElBQVg7UUFGbUM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCO2FBSWhCLElBQUMsQ0FBQSxjQUFELENBQUE7SUFQUzs7MEJBU1gsY0FBQSxHQUFnQixTQUFBO0FBQ2QsVUFBQTtNQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO01BRUEsSUFBQyxDQUFBLHFCQUFELEdBQTZCLElBQUEsbUJBQUEsQ0FBQTtNQUM3QixVQUFBLEdBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ1gsS0FBQyxDQUFBLFVBQUQsR0FBYztpQkFDZCxLQUFDLENBQUEsY0FBRCxDQUFBO1FBRlc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0FBSWI7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUcsWUFBQSxHQUFlLFdBQUEsQ0FBWSxXQUFaLENBQWxCO1VBQ0UsUUFBQSxHQUFlLElBQUEsSUFBQSxDQUFLLFlBQUw7VUFDZixJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsVUFBckIsQ0FBM0I7VUFDQSxJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsVUFBckIsQ0FBM0I7VUFDQSxJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsUUFBUSxDQUFDLFdBQVQsQ0FBcUIsVUFBckIsQ0FBM0IsRUFKRjs7QUFERjtJQVJjOzswQkFpQmhCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTs7WUFBc0IsQ0FBRSxPQUF4QixDQUFBOzthQUNBLElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtJQUZUOzs7O0tBdkVNO0FBUDFCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIEZpbGV9ID0gcmVxdWlyZSAnYXRvbSdcbmh1bWFuaXplID0gcmVxdWlyZSAnaHVtYW5pemUtcGx1cydcblN5bWJvbHNWaWV3ID0gcmVxdWlyZSAnLi9zeW1ib2xzLXZpZXcnXG5UYWdSZWFkZXIgPSByZXF1aXJlICcuL3RhZy1yZWFkZXInXG5nZXRUYWdzRmlsZSA9IHJlcXVpcmUgJy4vZ2V0LXRhZ3MtZmlsZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUHJvamVjdFZpZXcgZXh0ZW5kcyBTeW1ib2xzVmlld1xuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHJlbG9hZFRhZ3MgPSB0cnVlXG4gICAgQHNldE1heEl0ZW1zKDEwKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN0b3BUYXNrKClcbiAgICBAdW53YXRjaFRhZ3NGaWxlcygpXG4gICAgc3VwZXJcblxuICB0b2dnbGU6IC0+XG4gICAgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlXG4gICAgICBAcG9wdWxhdGUoKVxuICAgICAgQGF0dGFjaCgpXG5cbiAgZ2V0RW1wdHlNZXNzYWdlOiAoaXRlbUNvdW50KSAtPlxuICAgIGlmIGl0ZW1Db3VudCBpcyAwXG4gICAgICAnUHJvamVjdCBoYXMgbm8gdGFncyBmaWxlIG9yIGl0IGlzIGVtcHR5J1xuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiAgcG9wdWxhdGU6IC0+XG4gICAgaWYgQHRhZ3NcbiAgICAgIEBzZXRJdGVtcyhAdGFncylcblxuICAgIGlmIEByZWxvYWRUYWdzXG4gICAgICBAcmVsb2FkVGFncyA9IGZhbHNlXG4gICAgICBAc3RhcnRUYXNrKClcblxuICAgICAgaWYgQHRhZ3NcbiAgICAgICAgQHNldExvYWRpbmcoXCJSZWxvYWRpbmcgcHJvamVjdCBzeW1ib2xzXFx1MjAyNlwiKVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0TG9hZGluZygnTG9hZGluZyBwcm9qZWN0IHN5bWJvbHNcXHUyMDI2JylcbiAgICAgICAgQGxvYWRpbmdCYWRnZS50ZXh0KCcwJylcbiAgICAgICAgdGFnc1JlYWQgPSAwXG4gICAgICAgIEBsb2FkVGFnc1Rhc2sub24gJ3RhZ3MnLCAodGFncykgPT5cbiAgICAgICAgICB0YWdzUmVhZCArPSB0YWdzLmxlbmd0aFxuICAgICAgICAgIEBsb2FkaW5nQmFkZ2UudGV4dChodW1hbml6ZS5pbnRDb21tYSh0YWdzUmVhZCkpXG5cbiAgc3RvcFRhc2s6IC0+XG4gICAgQGxvYWRUYWdzVGFzaz8udGVybWluYXRlKClcblxuICBzdGFydFRhc2s6IC0+XG4gICAgQHN0b3BUYXNrKClcblxuICAgIEBsb2FkVGFnc1Rhc2sgPSBUYWdSZWFkZXIuZ2V0QWxsVGFncyAoQHRhZ3MpID0+XG4gICAgICBAcmVsb2FkVGFncyA9IEB0YWdzLmxlbmd0aCBpcyAwXG4gICAgICBAc2V0SXRlbXMoQHRhZ3MpXG5cbiAgICBAd2F0Y2hUYWdzRmlsZXMoKVxuXG4gIHdhdGNoVGFnc0ZpbGVzOiAtPlxuICAgIEB1bndhdGNoVGFnc0ZpbGVzKClcblxuICAgIEB0YWdzRmlsZVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgcmVsb2FkVGFncyA9ID0+XG4gICAgICBAcmVsb2FkVGFncyA9IHRydWVcbiAgICAgIEB3YXRjaFRhZ3NGaWxlcygpXG5cbiAgICBmb3IgcHJvamVjdFBhdGggaW4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgIGlmIHRhZ3NGaWxlUGF0aCA9IGdldFRhZ3NGaWxlKHByb2plY3RQYXRoKVxuICAgICAgICB0YWdzRmlsZSA9IG5ldyBGaWxlKHRhZ3NGaWxlUGF0aClcbiAgICAgICAgQHRhZ3NGaWxlU3Vic2NyaXB0aW9ucy5hZGQodGFnc0ZpbGUub25EaWRDaGFuZ2UocmVsb2FkVGFncykpXG4gICAgICAgIEB0YWdzRmlsZVN1YnNjcmlwdGlvbnMuYWRkKHRhZ3NGaWxlLm9uRGlkRGVsZXRlKHJlbG9hZFRhZ3MpKVxuICAgICAgICBAdGFnc0ZpbGVTdWJzY3JpcHRpb25zLmFkZCh0YWdzRmlsZS5vbkRpZFJlbmFtZShyZWxvYWRUYWdzKSlcblxuICAgIHJldHVyblxuXG4gIHVud2F0Y2hUYWdzRmlsZXM6IC0+XG4gICAgQHRhZ3NGaWxlU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHRhZ3NGaWxlU3Vic2NyaXB0aW9ucyA9IG51bGxcbiJdfQ==
