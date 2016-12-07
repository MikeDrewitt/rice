(function() {
  var DirectoryView, FileView, View,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  FileView = require('./file-view');

  module.exports = DirectoryView = (function(superClass) {
    extend(DirectoryView, superClass);

    function DirectoryView() {
      return DirectoryView.__super__.constructor.apply(this, arguments);
    }

    DirectoryView.content = function(archivePath, entry) {
      return this.li({
        "class": 'list-nested-item entry'
      }, (function(_this) {
        return function() {
          _this.span({
            "class": 'list-item'
          }, function() {
            return _this.span(entry.getName(), {
              "class": 'directory icon icon-file-directory'
            });
          });
          return _this.ol({
            "class": 'list-tree',
            outlet: 'entries'
          });
        };
      })(this));
    };

    DirectoryView.prototype.initialize = function(archivePath, entry) {
      var child, i, len, ref, results;
      ref = entry.children;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (child.isDirectory()) {
          results.push(this.entries.append(new DirectoryView(archivePath, child)));
        } else {
          results.push(this.entries.append(new FileView(archivePath, child)));
        }
      }
      return results;
    };

    return DirectoryView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2RpcmVjdG9yeS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQTs7O0VBQUMsT0FBUSxPQUFBLENBQVEsc0JBQVI7O0VBQ1QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixhQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsV0FBRCxFQUFjLEtBQWQ7YUFDUixJQUFDLENBQUEsRUFBRCxDQUFJO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx3QkFBUDtPQUFKLEVBQXFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNuQyxLQUFDLENBQUEsSUFBRCxDQUFNO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUFQO1dBQU4sRUFBMEIsU0FBQTttQkFDeEIsS0FBQyxDQUFBLElBQUQsQ0FBTSxLQUFLLENBQUMsT0FBTixDQUFBLENBQU4sRUFBdUI7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9DQUFQO2FBQXZCO1VBRHdCLENBQTFCO2lCQUVBLEtBQUMsQ0FBQSxFQUFELENBQUk7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFdBQVA7WUFBb0IsTUFBQSxFQUFRLFNBQTVCO1dBQUo7UUFIbUM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDO0lBRFE7OzRCQU1WLFVBQUEsR0FBWSxTQUFDLFdBQUQsRUFBYyxLQUFkO0FBQ1YsVUFBQTtBQUFBO0FBQUE7V0FBQSxxQ0FBQTs7UUFDRSxJQUFHLEtBQUssQ0FBQyxXQUFOLENBQUEsQ0FBSDt1QkFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBb0IsSUFBQSxhQUFBLENBQWMsV0FBZCxFQUEyQixLQUEzQixDQUFwQixHQURGO1NBQUEsTUFBQTt1QkFHRSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBb0IsSUFBQSxRQUFBLENBQVMsV0FBVCxFQUFzQixLQUF0QixDQUFwQixHQUhGOztBQURGOztJQURVOzs7O0tBUGM7QUFKNUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbkZpbGVWaWV3ID0gcmVxdWlyZSAnLi9maWxlLXZpZXcnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERpcmVjdG9yeVZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAoYXJjaGl2ZVBhdGgsIGVudHJ5KSAtPlxuICAgIEBsaSBjbGFzczogJ2xpc3QtbmVzdGVkLWl0ZW0gZW50cnknLCA9PlxuICAgICAgQHNwYW4gY2xhc3M6ICdsaXN0LWl0ZW0nLCA9PlxuICAgICAgICBAc3BhbiBlbnRyeS5nZXROYW1lKCksIGNsYXNzOiAnZGlyZWN0b3J5IGljb24gaWNvbi1maWxlLWRpcmVjdG9yeSdcbiAgICAgIEBvbCBjbGFzczogJ2xpc3QtdHJlZScsIG91dGxldDogJ2VudHJpZXMnXG5cbiAgaW5pdGlhbGl6ZTogKGFyY2hpdmVQYXRoLCBlbnRyeSkgLT5cbiAgICBmb3IgY2hpbGQgaW4gZW50cnkuY2hpbGRyZW5cbiAgICAgIGlmIGNoaWxkLmlzRGlyZWN0b3J5KClcbiAgICAgICAgQGVudHJpZXMuYXBwZW5kKG5ldyBEaXJlY3RvcnlWaWV3KGFyY2hpdmVQYXRoLCBjaGlsZCkpXG4gICAgICBlbHNlXG4gICAgICAgIEBlbnRyaWVzLmFwcGVuZChuZXcgRmlsZVZpZXcoYXJjaGl2ZVBhdGgsIGNoaWxkKSlcbiJdfQ==
