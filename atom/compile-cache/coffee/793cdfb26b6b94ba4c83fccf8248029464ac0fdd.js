(function() {
  var DefaultFileIcons, FileIcons;

  DefaultFileIcons = require('./default-file-icons');

  FileIcons = (function() {
    function FileIcons() {
      this.service = new DefaultFileIcons;
    }

    FileIcons.prototype.getService = function() {
      return this.service;
    };

    FileIcons.prototype.resetService = function() {
      return this.service = new DefaultFileIcons;
    };

    FileIcons.prototype.setService = function(service) {
      this.service = service;
    };

    return FileIcons;

  })();

  module.exports = new FileIcons;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2ZpbGUtaWNvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxnQkFBQSxHQUFtQixPQUFBLENBQVEsc0JBQVI7O0VBRWI7SUFDUyxtQkFBQTtNQUNYLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtJQURKOzt3QkFHYixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQTtJQURTOzt3QkFHWixZQUFBLEdBQWMsU0FBQTthQUNaLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtJQURIOzt3QkFHZCxVQUFBLEdBQVksU0FBQyxPQUFEO01BQUMsSUFBQyxDQUFBLFVBQUQ7SUFBRDs7Ozs7O0VBRWQsTUFBTSxDQUFDLE9BQVAsR0FBaUIsSUFBSTtBQWRyQiIsInNvdXJjZXNDb250ZW50IjpbIkRlZmF1bHRGaWxlSWNvbnMgPSByZXF1aXJlICcuL2RlZmF1bHQtZmlsZS1pY29ucydcblxuY2xhc3MgRmlsZUljb25zXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzZXJ2aWNlID0gbmV3IERlZmF1bHRGaWxlSWNvbnNcblxuICBnZXRTZXJ2aWNlOiAtPlxuICAgIEBzZXJ2aWNlXG5cbiAgcmVzZXRTZXJ2aWNlOiAtPlxuICAgIEBzZXJ2aWNlID0gbmV3IERlZmF1bHRGaWxlSWNvbnNcblxuICBzZXRTZXJ2aWNlOiAoQHNlcnZpY2UpIC0+XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEZpbGVJY29uc1xuIl19
