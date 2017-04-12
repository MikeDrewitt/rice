(function() {
  var DefaultFileIcons, fs, path;

  fs = require('fs-plus');

  path = require('path');

  DefaultFileIcons = (function() {
    function DefaultFileIcons() {}

    DefaultFileIcons.prototype.iconClassForPath = function(filePath) {
      var extension;
      extension = path.extname(filePath);
      if (fs.isSymbolicLinkSync(filePath)) {
        return 'icon-file-symlink-file';
      } else if (fs.isReadmePath(filePath)) {
        return 'icon-book';
      } else if (fs.isCompressedExtension(extension)) {
        return 'icon-file-zip';
      } else if (fs.isImageExtension(extension)) {
        return 'icon-file-media';
      } else if (fs.isPdfExtension(extension)) {
        return 'icon-file-pdf';
      } else if (fs.isBinaryExtension(extension)) {
        return 'icon-file-binary';
      } else {
        return 'icon-file-text';
      }
    };

    return DefaultFileIcons;

  })();

  module.exports = DefaultFileIcons;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2RlZmF1bHQtZmlsZS1pY29ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRUQ7OzsrQkFDSixnQkFBQSxHQUFrQixTQUFDLFFBQUQ7QUFDaEIsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsT0FBTCxDQUFhLFFBQWI7TUFFWixJQUFHLEVBQUUsQ0FBQyxrQkFBSCxDQUFzQixRQUF0QixDQUFIO2VBQ0UseUJBREY7T0FBQSxNQUVLLElBQUcsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsUUFBaEIsQ0FBSDtlQUNILFlBREc7T0FBQSxNQUVBLElBQUcsRUFBRSxDQUFDLHFCQUFILENBQXlCLFNBQXpCLENBQUg7ZUFDSCxnQkFERztPQUFBLE1BRUEsSUFBRyxFQUFFLENBQUMsZ0JBQUgsQ0FBb0IsU0FBcEIsQ0FBSDtlQUNILGtCQURHO09BQUEsTUFFQSxJQUFHLEVBQUUsQ0FBQyxjQUFILENBQWtCLFNBQWxCLENBQUg7ZUFDSCxnQkFERztPQUFBLE1BRUEsSUFBRyxFQUFFLENBQUMsaUJBQUgsQ0FBcUIsU0FBckIsQ0FBSDtlQUNILG1CQURHO09BQUEsTUFBQTtlQUdILGlCQUhHOztJQWJXOzs7Ozs7RUFrQnBCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBdEJqQiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5jbGFzcyBEZWZhdWx0RmlsZUljb25zXG4gIGljb25DbGFzc0ZvclBhdGg6IChmaWxlUGF0aCkgLT5cbiAgICBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpXG5cbiAgICBpZiBmcy5pc1N5bWJvbGljTGlua1N5bmMoZmlsZVBhdGgpXG4gICAgICAnaWNvbi1maWxlLXN5bWxpbmstZmlsZSdcbiAgICBlbHNlIGlmIGZzLmlzUmVhZG1lUGF0aChmaWxlUGF0aClcbiAgICAgICdpY29uLWJvb2snXG4gICAgZWxzZSBpZiBmcy5pc0NvbXByZXNzZWRFeHRlbnNpb24oZXh0ZW5zaW9uKVxuICAgICAgJ2ljb24tZmlsZS16aXAnXG4gICAgZWxzZSBpZiBmcy5pc0ltYWdlRXh0ZW5zaW9uKGV4dGVuc2lvbilcbiAgICAgICdpY29uLWZpbGUtbWVkaWEnXG4gICAgZWxzZSBpZiBmcy5pc1BkZkV4dGVuc2lvbihleHRlbnNpb24pXG4gICAgICAnaWNvbi1maWxlLXBkZidcbiAgICBlbHNlIGlmIGZzLmlzQmluYXJ5RXh0ZW5zaW9uKGV4dGVuc2lvbilcbiAgICAgICdpY29uLWZpbGUtYmluYXJ5J1xuICAgIGVsc2VcbiAgICAgICdpY29uLWZpbGUtdGV4dCdcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0RmlsZUljb25zXG4iXX0=
