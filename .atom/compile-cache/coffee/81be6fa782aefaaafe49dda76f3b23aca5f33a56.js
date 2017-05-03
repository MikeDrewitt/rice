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
    tagsFile = path.join(directoryPath, ".git", "tags");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
    tagsFile = path.join(directoryPath, ".git", "TAGS");
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL2dldC10YWdzLWZpbGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUVMLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsYUFBRDtBQUNmLFFBQUE7SUFBQSxJQUFjLHFCQUFkO0FBQUEsYUFBQTs7SUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLE1BQXpCO0lBQ1gsSUFBbUIsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQW5CO0FBQUEsYUFBTyxTQUFQOztJQUVBLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBeUIsTUFBekI7SUFDWCxJQUFtQixFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBbkI7QUFBQSxhQUFPLFNBQVA7O0lBRUEsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixPQUF6QjtJQUNYLElBQW1CLEVBQUUsQ0FBQyxVQUFILENBQWMsUUFBZCxDQUFuQjtBQUFBLGFBQU8sU0FBUDs7SUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXlCLE9BQXpCO0lBQ1gsSUFBbUIsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQW5CO0FBQUEsYUFBTyxTQUFQOztJQUVBLFFBQUEsR0FBVyxJQUFJLENBQUMsSUFBTCxDQUFVLGFBQVYsRUFBeUIsTUFBekIsRUFBaUMsTUFBakM7SUFDWCxJQUFtQixFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBbkI7QUFBQSxhQUFPLFNBQVA7O0lBRUEsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixNQUF6QixFQUFpQyxNQUFqQztJQUNYLElBQW1CLEVBQUUsQ0FBQyxVQUFILENBQWMsUUFBZCxDQUFuQjtBQUFBLGFBQU8sU0FBUDs7RUFuQmU7QUFIakIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPSAoZGlyZWN0b3J5UGF0aCkgLT5cbiAgcmV0dXJuIHVubGVzcyBkaXJlY3RvcnlQYXRoP1xuXG4gIHRhZ3NGaWxlID0gcGF0aC5qb2luKGRpcmVjdG9yeVBhdGgsIFwidGFnc1wiKVxuICByZXR1cm4gdGFnc0ZpbGUgaWYgZnMuaXNGaWxlU3luYyh0YWdzRmlsZSlcblxuICB0YWdzRmlsZSA9IHBhdGguam9pbihkaXJlY3RvcnlQYXRoLCBcIlRBR1NcIilcbiAgcmV0dXJuIHRhZ3NGaWxlIGlmIGZzLmlzRmlsZVN5bmModGFnc0ZpbGUpXG5cbiAgdGFnc0ZpbGUgPSBwYXRoLmpvaW4oZGlyZWN0b3J5UGF0aCwgXCIudGFnc1wiKVxuICByZXR1cm4gdGFnc0ZpbGUgaWYgZnMuaXNGaWxlU3luYyh0YWdzRmlsZSlcblxuICB0YWdzRmlsZSA9IHBhdGguam9pbihkaXJlY3RvcnlQYXRoLCBcIi5UQUdTXCIpXG4gIHJldHVybiB0YWdzRmlsZSBpZiBmcy5pc0ZpbGVTeW5jKHRhZ3NGaWxlKVxuXG4gIHRhZ3NGaWxlID0gcGF0aC5qb2luKGRpcmVjdG9yeVBhdGgsIFwiLmdpdFwiLCBcInRhZ3NcIilcbiAgcmV0dXJuIHRhZ3NGaWxlIGlmIGZzLmlzRmlsZVN5bmModGFnc0ZpbGUpXG5cbiAgdGFnc0ZpbGUgPSBwYXRoLmpvaW4oZGlyZWN0b3J5UGF0aCwgXCIuZ2l0XCIsIFwiVEFHU1wiKVxuICByZXR1cm4gdGFnc0ZpbGUgaWYgZnMuaXNGaWxlU3luYyh0YWdzRmlsZSlcbiJdfQ==
