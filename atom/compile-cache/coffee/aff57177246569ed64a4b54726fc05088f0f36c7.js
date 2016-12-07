(function() {
  var $, FileIcons, FileView, View, archive, fs, path, ref, temp,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  ref = require('atom-space-pen-views'), $ = ref.$, View = ref.View;

  fs = require('fs-plus');

  temp = require('temp');

  archive = require('ls-archive');

  FileIcons = require('./file-icons');

  module.exports = FileView = (function(superClass) {
    extend(FileView, superClass);

    function FileView() {
      return FileView.__super__.constructor.apply(this, arguments);
    }

    FileView.content = function(archivePath, entry) {
      return this.li({
        "class": 'list-item entry',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.span(entry.getName(), {
            "class": 'file icon',
            outlet: 'name'
          });
        };
      })(this));
    };

    FileView.prototype.initialize = function(archivePath1, entry1) {
      var typeClass;
      this.archivePath = archivePath1;
      this.entry = entry1;
      typeClass = FileIcons.getService().iconClassForPath(this.entry.path, "archive-view") || [];
      if (!Array.isArray(typeClass)) {
        typeClass = typeClass != null ? typeClass.toString().split(/\s+/g) : void 0;
      }
      this.name.addClass(typeClass.join(" "));
      this.on('click', (function(_this) {
        return function() {
          _this.select();
          return _this.openFile();
        };
      })(this));
      return atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            if (_this.isSelected()) {
              return _this.openFile();
            }
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            var files, ref1;
            if (_this.isSelected()) {
              files = _this.closest('.archive-editor').find('.file');
              return (ref1 = $(files[files.index(_this.name) + 1]).view()) != null ? ref1.select() : void 0;
            }
          };
        })(this),
        'core:move-up': (function(_this) {
          return function() {
            var files, ref1;
            if (_this.isSelected()) {
              files = _this.closest('.archive-editor').find('.file');
              return (ref1 = $(files[files.index(_this.name) - 1]).view()) != null ? ref1.select() : void 0;
            }
          };
        })(this)
      });
    };

    FileView.prototype.isSelected = function() {
      return this.hasClass('selected');
    };

    FileView.prototype.logError = function(message, error) {
      var ref1;
      return console.error(message, (ref1 = error.stack) != null ? ref1 : error);
    };

    FileView.prototype.openFile = function() {
      return archive.readFile(this.archivePath, this.entry.getPath(), (function(_this) {
        return function(error, contents) {
          if (error != null) {
            return _this.logError("Error reading: " + (_this.entry.getPath()) + " from " + _this.archivePath, error);
          } else {
            return temp.mkdir('atom-', function(error, tempDirPath) {
              var tempFilePath;
              if (error != null) {
                return _this.logError("Error creating temp directory: " + tempDirPath, error);
              } else {
                tempFilePath = path.join(tempDirPath, path.basename(_this.archivePath), _this.entry.getName());
                return fs.writeFile(tempFilePath, contents, function(error) {
                  if (error != null) {
                    return _this.logError("Error writing to " + tempFilePath, error);
                  } else {
                    return atom.workspace.open(tempFilePath);
                  }
                });
              }
            });
          }
        };
      })(this));
    };

    FileView.prototype.select = function() {
      this.closest('.archive-editor').find('.selected').toggleClass('selected');
      this.addClass('selected');
      return this.focus();
    };

    return FileView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9hcmNoaXZlLXZpZXcvbGliL2ZpbGUtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDBEQUFBO0lBQUE7OztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFZLE9BQUEsQ0FBUSxzQkFBUixDQUFaLEVBQUMsU0FBRCxFQUFJOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsT0FBQSxHQUFVLE9BQUEsQ0FBUSxZQUFSOztFQUVWLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFFWixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osUUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLFdBQUQsRUFBYyxLQUFkO2FBQ1IsSUFBQyxDQUFBLEVBQUQsQ0FBSTtRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7UUFBMEIsUUFBQSxFQUFVLENBQUMsQ0FBckM7T0FBSixFQUE0QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzFDLEtBQUMsQ0FBQSxJQUFELENBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBQSxDQUFOLEVBQXVCO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUFQO1lBQW9CLE1BQUEsRUFBUSxNQUE1QjtXQUF2QjtRQUQwQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUM7SUFEUTs7dUJBSVYsVUFBQSxHQUFZLFNBQUMsWUFBRCxFQUFlLE1BQWY7QUFDVixVQUFBO01BRFcsSUFBQyxDQUFBLGNBQUQ7TUFBYyxJQUFDLENBQUEsUUFBRDtNQUN6QixTQUFBLEdBQVksU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFzQixDQUFD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cEQ7dUJBQ2YsRUFBRSxDQUFDLFNBQUgsQ0FBYSxZQUFiLEVBQTJCLFFBQTNCLEVBQXFDLFNBQUMsS0FBRDtrQkFDbkMsSUFBRyxhQUFIOzJCQUNFLEtBQUMsQ0FBQSxRQUFELENBQVUsbUJBQUEsR0FBb0IsWUFBOUIsRUFBOEMsS0FBOUMsRUFERjttQkFBQSxNQUFBOzJCQUdFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixZQUFwQixFQUhGOztnQkFEbUMsQ0FBckMsRUFKRjs7WUFEa0IsQ0FBcEIsRUFIRjs7UUFEK0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpEO0lBRFE7O3VCQWdCVixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUMsQ0FBQSxPQUFELENBQVMsaUJBQVQsQ0FBMkIsQ0FBQyxJQUE1QixDQUFpQyxXQUFqQyxDQUE2QyxDQUFDLFdBQTlDLENBQTBELFVBQTFEO01BQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxVQUFWO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUhNOzs7O0tBbkRhO0FBVHZCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG57JCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnRlbXAgPSByZXF1aXJlICd0ZW1wJ1xuYXJjaGl2ZSA9IHJlcXVpcmUgJ2xzLWFyY2hpdmUnXG5cbkZpbGVJY29ucyA9IHJlcXVpcmUgJy4vZmlsZS1pY29ucydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRmlsZVZpZXcgZXh0ZW5kcyBWaWV3XG4gIEBjb250ZW50OiAoYXJjaGl2ZVBhdGgsIGVudHJ5KSAtPlxuICAgIEBsaSBjbGFzczogJ2xpc3QtaXRlbSBlbnRyeScsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgIEBzcGFuIGVudHJ5LmdldE5hbWUoKSwgY2xhc3M6ICdmaWxlIGljb24nLCBvdXRsZXQ6ICduYW1lJ1xuXG4gIGluaXRpYWxpemU6IChAYXJjaGl2ZVBhdGgsIEBlbnRyeSkgLT5cbiAgICB0eXBlQ2xhc3MgPSBGaWxlSWNvbnMuZ2V0U2VydmljZSgpLmljb25DbGFzc0ZvclBhdGgoQGVudHJ5LnBhdGgsIFwiYXJjaGl2ZS12aWV3XCIpIG9yIFtdXG4gICAgdW5sZXNzIEFycmF5LmlzQXJyYXkgdHlwZUNsYXNzXG4gICAgICB0eXBlQ2xhc3MgPSB0eXBlQ2xhc3M/LnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICBcbiAgICBAbmFtZS5hZGRDbGFzcyh0eXBlQ2xhc3Muam9pbihcIiBcIikpXG5cbiAgICBAb24gJ2NsaWNrJywgPT5cbiAgICAgIEBzZWxlY3QoKVxuICAgICAgQG9wZW5GaWxlKClcblxuICAgIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+XG4gICAgICAgIEBvcGVuRmlsZSgpIGlmIEBpc1NlbGVjdGVkKClcblxuICAgICAgJ2NvcmU6bW92ZS1kb3duJzogPT5cbiAgICAgICAgaWYgQGlzU2VsZWN0ZWQoKVxuICAgICAgICAgIGZpbGVzID0gQGNsb3Nlc3QoJy5hcmNoaXZlLWVkaXRvcicpLmZpbmQoJy5maWxlJylcbiAgICAgICAgICAkKGZpbGVzW2ZpbGVzLmluZGV4KEBuYW1lKSArIDFdKS52aWV3KCk/LnNlbGVjdCgpXG5cbiAgICAgICdjb3JlOm1vdmUtdXAnOiA9PlxuICAgICAgICBpZiBAaXNTZWxlY3RlZCgpXG4gICAgICAgICAgZmlsZXMgPSBAY2xvc2VzdCgnLmFyY2hpdmUtZWRpdG9yJykuZmluZCgnLmZpbGUnKVxuICAgICAgICAgICQoZmlsZXNbZmlsZXMuaW5kZXgoQG5hbWUpIC0gMV0pLnZpZXcoKT8uc2VsZWN0KClcblxuICBpc1NlbGVjdGVkOiAtPiBAaGFzQ2xhc3MoJ3NlbGVjdGVkJylcblxuICBsb2dFcnJvcjogKG1lc3NhZ2UsIGVycm9yKSAtPlxuICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSwgZXJyb3Iuc3RhY2sgPyBlcnJvcilcblxuICBvcGVuRmlsZTogLT5cbiAgICBhcmNoaXZlLnJlYWRGaWxlIEBhcmNoaXZlUGF0aCwgQGVudHJ5LmdldFBhdGgoKSwgKGVycm9yLCBjb250ZW50cykgPT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBAbG9nRXJyb3IoXCJFcnJvciByZWFkaW5nOiAje0BlbnRyeS5nZXRQYXRoKCl9IGZyb20gI3tAYXJjaGl2ZVBhdGh9XCIsIGVycm9yKVxuICAgICAgZWxzZVxuICAgICAgICB0ZW1wLm1rZGlyICdhdG9tLScsIChlcnJvciwgdGVtcERpclBhdGgpID0+XG4gICAgICAgICAgaWYgZXJyb3I/XG4gICAgICAgICAgICBAbG9nRXJyb3IoXCJFcnJvciBjcmVhdGluZyB0ZW1wIGRpcmVjdG9yeTogI3t0ZW1wRGlyUGF0aH1cIiwgZXJyb3IpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGVtcEZpbGVQYXRoID0gcGF0aC5qb2luKHRlbXBEaXJQYXRoLCBwYXRoLmJhc2VuYW1lKEBhcmNoaXZlUGF0aCksIEBlbnRyeS5nZXROYW1lKCkpXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgdGVtcEZpbGVQYXRoLCBjb250ZW50cywgKGVycm9yKSA9PlxuICAgICAgICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICAgICAgICBAbG9nRXJyb3IoXCJFcnJvciB3cml0aW5nIHRvICN7dGVtcEZpbGVQYXRofVwiLCBlcnJvcilcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4odGVtcEZpbGVQYXRoKVxuXG4gIHNlbGVjdDogLT5cbiAgICBAY2xvc2VzdCgnLmFyY2hpdmUtZWRpdG9yJykuZmluZCgnLnNlbGVjdGVkJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcbiAgICBAYWRkQ2xhc3MoJ3NlbGVjdGVkJylcbiAgICBAZm9jdXMoKVxuIl19
