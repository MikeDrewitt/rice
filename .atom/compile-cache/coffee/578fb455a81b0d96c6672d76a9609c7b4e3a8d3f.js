(function() {
  var async, ctags, getTagsFile;

  async = require('async');

  ctags = require('ctags');

  getTagsFile = require('./get-tags-file');

  module.exports = function(directoryPaths) {
    return async.each(directoryPaths, function(directoryPath, done) {
      var stream, tagsFilePath;
      tagsFilePath = getTagsFile(directoryPath);
      if (!tagsFilePath) {
        return done();
      }
      stream = ctags.createReadStream(tagsFilePath);
      stream.on('data', function(tags) {
        var i, len, tag;
        for (i = 0, len = tags.length; i < len; i++) {
          tag = tags[i];
          tag.directory = directoryPath;
        }
        return emit('tags', tags);
      });
      stream.on('end', done);
      return stream.on('error', done);
    }, this.async());
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL2xvYWQtdGFncy1oYW5kbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSOztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFDUixXQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztFQUVkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsY0FBRDtXQUNmLEtBQUssQ0FBQyxJQUFOLENBQ0UsY0FERixFQUVFLFNBQUMsYUFBRCxFQUFnQixJQUFoQjtBQUNFLFVBQUE7TUFBQSxZQUFBLEdBQWUsV0FBQSxDQUFZLGFBQVo7TUFDZixJQUFBLENBQXFCLFlBQXJCO0FBQUEsZUFBTyxJQUFBLENBQUEsRUFBUDs7TUFFQSxNQUFBLEdBQVMsS0FBSyxDQUFDLGdCQUFOLENBQXVCLFlBQXZCO01BQ1QsTUFBTSxDQUFDLEVBQVAsQ0FBVSxNQUFWLEVBQWtCLFNBQUMsSUFBRDtBQUNoQixZQUFBO0FBQUEsYUFBQSxzQ0FBQTs7VUFBQSxHQUFHLENBQUMsU0FBSixHQUFnQjtBQUFoQjtlQUNBLElBQUEsQ0FBSyxNQUFMLEVBQWEsSUFBYjtNQUZnQixDQUFsQjtNQUdBLE1BQU0sQ0FBQyxFQUFQLENBQVUsS0FBVixFQUFpQixJQUFqQjthQUNBLE1BQU0sQ0FBQyxFQUFQLENBQVUsT0FBVixFQUFtQixJQUFuQjtJQVRGLENBRkYsRUFZSSxJQUFDLENBQUEsS0FBRCxDQUFBLENBWko7RUFEZTtBQUpqQiIsInNvdXJjZXNDb250ZW50IjpbImFzeW5jID0gcmVxdWlyZSAnYXN5bmMnXG5jdGFncyA9IHJlcXVpcmUgJ2N0YWdzJ1xuZ2V0VGFnc0ZpbGUgPSByZXF1aXJlICcuL2dldC10YWdzLWZpbGUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGRpcmVjdG9yeVBhdGhzKSAtPlxuICBhc3luYy5lYWNoKFxuICAgIGRpcmVjdG9yeVBhdGhzLFxuICAgIChkaXJlY3RvcnlQYXRoLCBkb25lKSAtPlxuICAgICAgdGFnc0ZpbGVQYXRoID0gZ2V0VGFnc0ZpbGUoZGlyZWN0b3J5UGF0aClcbiAgICAgIHJldHVybiBkb25lKCkgdW5sZXNzIHRhZ3NGaWxlUGF0aFxuXG4gICAgICBzdHJlYW0gPSBjdGFncy5jcmVhdGVSZWFkU3RyZWFtKHRhZ3NGaWxlUGF0aClcbiAgICAgIHN0cmVhbS5vbiAnZGF0YScsICh0YWdzKSAtPlxuICAgICAgICB0YWcuZGlyZWN0b3J5ID0gZGlyZWN0b3J5UGF0aCBmb3IgdGFnIGluIHRhZ3NcbiAgICAgICAgZW1pdCgndGFncycsIHRhZ3MpXG4gICAgICBzdHJlYW0ub24oJ2VuZCcsIGRvbmUpXG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgZG9uZSlcbiAgICAsIEBhc3luYygpXG4gIClcbiJdfQ==
