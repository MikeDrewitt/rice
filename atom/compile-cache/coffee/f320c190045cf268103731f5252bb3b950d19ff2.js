(function() {
  var fs, path;

  path = require('path');

  fs = require('fs-plus');

  module.exports = function(directoryPath) {
    var tagsFile;
    if (directoryPath == null) {
      return;
    }
    tagsFile = path.join(directoryPath, "tags");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
    tagsFile = path.join(directoryPath, "TAGS");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
    tagsFile = path.join(directoryPath, ".tags");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
    tagsFile = path.join(directoryPath, ".TAGS");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3N5bWJvbHMtdmlldy9saWIvZ2V0LXRhZ3MtZmlsZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBRUwsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxhQUFEO0FBQ2YsUUFBQTtJQUFBLElBQWMscUJBQWQ7QUFBQSxhQUFBOztJQUVBLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBeUIsTUFBekI7SUFDWCxJQUFtQixFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBbkI7QUFBQSxhQUFPLFNBQVA7O0lBRUEsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixNQUF6QjtJQUNYLElBQW1CLEVBQUUsQ0FBQyxVQUFILENBQWMsUUFBZCxDQUFuQjtBQUFBLGFBQU8sU0FBUDs7SUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLE9BQXpCO0lBQ1gsSUFBbUIsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQW5CO0FBQUEsYUFBTyxTQUFQOztJQUVBLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBeUIsT0FBekI7SUFDWCxJQUFtQixFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBbkI7QUFBQSxhQUFPLFNBQVA7O0VBYmU7QUFIakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPSAoZGlyZWN0b3J5UGF0aCkgLT5cbiAgcmV0dXJuIHVubGVzcyBkaXJlY3RvcnlQYXRoP1xuXG4gIHRhZ3NGaWxlID0gcGF0aC5qb2luKGRpcmVjdG9yeVBhdGgsIFwidGFnc1wiKVxuICByZXR1cm4gdGFnc0ZpbGUgaWYgZnMuaXNGaWxlU3luYyh0YWdzRmlsZSlcblxuICB0YWdzRmlsZSA9IHBhdGguam9pbihkaXJlY3RvcnlQYXRoLCBcIlRBR1NcIilcbiAgcmV0dXJuIHRhZ3NGaWxlIGlmIGZzLmlzRmlsZVN5bmModGFnc0ZpbGUpXG5cbiAgdGFnc0ZpbGUgPSBwYXRoLmpvaW4oZGlyZWN0b3J5UGF0aCwgXCIudGFnc1wiKVxuICByZXR1cm4gdGFnc0ZpbGUgaWYgZnMuaXNGaWxlU3luYyh0YWdzRmlsZSlcblxuICB0YWdzRmlsZSA9IHBhdGguam9pbihkaXJlY3RvcnlQYXRoLCBcIi5UQUdTXCIpXG4gIHJldHVybiB0YWdzRmlsZSBpZiBmcy5pc0ZpbGVTeW5jKHRhZ3NGaWxlKVxuIl19
