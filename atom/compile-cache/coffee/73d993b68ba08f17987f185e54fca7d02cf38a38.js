(function() {
  var fs, path;

  path = require('path');

  fs = require('fs-plus');

  module.exports = {
    isWindows: function() {
      return !!process.platform.match(/^win/);
    },
    generateEvilFiles: function() {
      var evilFilesPath, filename, filenames, i, len, results;
      evilFilesPath = path.join(__dirname, 'fixtures', 'evil-files');
      if (fs.existsSync(evilFilesPath)) {
        fs.removeSync(evilFilesPath);
      }
      fs.mkdirSync(evilFilesPath);
      if (this.isWindows()) {
        filenames = ["a_file_with_utf8.txt", "file with spaces.txt", "utfa\u0306.md"];
      } else {
        filenames = ["a_file_with_utf8.txt", "file with spaces.txt", "goddam\nnewlines", "quote\".txt", "utfa\u0306.md"];
      }
      results = [];
      for (i = 0, len = filenames.length; i < len; i++) {
        filename = filenames[i];
        results.push(fs.writeFileSync(path.join(evilFilesPath, filename), 'evil file!', {
          flag: 'w'
        }));
      }
      return results;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvc3BlYy1oZWxwZXItcGxhdGZvcm0uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUdMLE1BQU0sQ0FBQyxPQUFQLEdBRUU7SUFBQSxTQUFBLEVBQVcsU0FBQTthQUNULENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQWpCLENBQXVCLE1BQXZCO0lBRE8sQ0FBWDtJQU9BLGlCQUFBLEVBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLFVBQXJCLEVBQWlDLFlBQWpDO01BQ2hCLElBQWdDLEVBQUUsQ0FBQyxVQUFILENBQWMsYUFBZCxDQUFoQztRQUFBLEVBQUUsQ0FBQyxVQUFILENBQWMsYUFBZCxFQUFBOztNQUNBLEVBQUUsQ0FBQyxTQUFILENBQWEsYUFBYjtNQUVBLElBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFIO1FBQ0UsU0FBQSxHQUFZLENBQ1Ysc0JBRFUsRUFFVixzQkFGVSxFQUdWLGVBSFUsRUFEZDtPQUFBLE1BQUE7UUFPRSxTQUFBLEdBQVksQ0FDVixzQkFEVSxFQUVWLHNCQUZVLEVBR1Ysa0JBSFUsRUFJVixhQUpVLEVBS1YsZUFMVSxFQVBkOztBQWVBO1dBQUEsMkNBQUE7O3FCQUNFLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixRQUF6QixDQUFqQixFQUFxRCxZQUFyRCxFQUFtRTtVQUFBLElBQUEsRUFBTSxHQUFOO1NBQW5FO0FBREY7O0lBcEJpQixDQVBuQjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuXG4jIyBQbGF0Zm9ybSBzcGVjaWZpYyBoZWxwZXJzXG5tb2R1bGUuZXhwb3J0cyA9XG4gICMgUHVibGljOiBSZXR1cm5zIHRydWUgaWYgYmVpbmcgcnVuIGZyb20gd2l0aGluIFdpbmRvd3NcbiAgaXNXaW5kb3dzOiAtPlxuICAgICEhcHJvY2Vzcy5wbGF0Zm9ybS5tYXRjaCAvXndpbi9cblxuICAjIFB1YmxpYzogU29tZSBmaWxlcyBjYW4gbm90IGV4aXN0IG9uIFdpbmRvd3MgZmlsZXN5c3RlbXMsIHNvIHdlIGhhdmUgdG9cbiAgIyBzZWxlY3RpdmVseSBnZW5lcmF0ZSBvdXIgZml4dHVyZXMuXG4gICNcbiAgIyBSZXR1cm5zIG5vdGhpbmcuXG4gIGdlbmVyYXRlRXZpbEZpbGVzOiAtPlxuICAgIGV2aWxGaWxlc1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAnZXZpbC1maWxlcycpXG4gICAgZnMucmVtb3ZlU3luYyhldmlsRmlsZXNQYXRoKSBpZiBmcy5leGlzdHNTeW5jKGV2aWxGaWxlc1BhdGgpXG4gICAgZnMubWtkaXJTeW5jKGV2aWxGaWxlc1BhdGgpXG5cbiAgICBpZiBAaXNXaW5kb3dzKClcbiAgICAgIGZpbGVuYW1lcyA9IFtcbiAgICAgICAgXCJhX2ZpbGVfd2l0aF91dGY4LnR4dFwiXG4gICAgICAgIFwiZmlsZSB3aXRoIHNwYWNlcy50eHRcIlxuICAgICAgICBcInV0ZmFcXHUwMzA2Lm1kXCJcbiAgICAgIF1cbiAgICBlbHNlXG4gICAgICBmaWxlbmFtZXMgPSBbXG4gICAgICAgIFwiYV9maWxlX3dpdGhfdXRmOC50eHRcIlxuICAgICAgICBcImZpbGUgd2l0aCBzcGFjZXMudHh0XCJcbiAgICAgICAgXCJnb2RkYW1cXG5uZXdsaW5lc1wiXG4gICAgICAgIFwicXVvdGVcXFwiLnR4dFwiXG4gICAgICAgIFwidXRmYVxcdTAzMDYubWRcIlxuICAgICAgXVxuXG4gICAgZm9yIGZpbGVuYW1lIGluIGZpbGVuYW1lc1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4oZXZpbEZpbGVzUGF0aCwgZmlsZW5hbWUpLCAnZXZpbCBmaWxlIScsIGZsYWc6ICd3JylcbiJdfQ==
