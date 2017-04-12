(function() {
  var Path, Registry, ShellOption, appName, appPath, contextParts, exeName, fileIconPath, isBeta,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Registry = require('winreg');

  Path = require('path');

  exeName = Path.basename(process.execPath);

  appPath = "\"" + process.execPath + "\"";

  fileIconPath = "\"" + (Path.join(process.execPath, '..', 'resources', 'cli', 'file.ico')) + "\"";

  isBeta = appPath.includes(' Beta');

  appName = exeName.replace('atom', (isBeta ? 'Atom Beta' : 'Atom')).replace('.exe', '');

  ShellOption = (function() {
    function ShellOption(key, parts) {
      this.update = bind(this.update, this);
      this.deregister = bind(this.deregister, this);
      this.register = bind(this.register, this);
      this.isRegistered = bind(this.isRegistered, this);
      this.key = key;
      this.parts = parts;
    }

    ShellOption.prototype.isRegistered = function(callback) {
      return new Registry({
        hive: 'HKCU',
        key: this.key + "\\" + this.parts[0].key
      }).get(this.parts[0].name, (function(_this) {
        return function(err, val) {
          return callback((err == null) && (val != null) && val.value === _this.parts[0].value);
        };
      })(this));
    };

    ShellOption.prototype.register = function(callback) {
      var doneCount;
      doneCount = this.parts.length;
      return this.parts.forEach((function(_this) {
        return function(part) {
          var reg;
          reg = new Registry({
            hive: 'HKCU',
            key: part.key != null ? _this.key + "\\" + part.key : _this.key
          });
          return reg.create(function() {
            return reg.set(part.name, Registry.REG_SZ, part.value, function() {
              if (--doneCount === 0) {
                return callback();
              }
            });
          });
        };
      })(this));
    };

    ShellOption.prototype.deregister = function(callback) {
      return this.isRegistered((function(_this) {
        return function(isRegistered) {
          if (isRegistered) {
            return new Registry({
              hive: 'HKCU',
              key: _this.key
            }).destroy(function() {
              return callback(null, true);
            });
          } else {
            return callback(null, false);
          }
        };
      })(this));
    };

    ShellOption.prototype.update = function(callback) {
      return new Registry({
        hive: 'HKCU',
        key: this.key + "\\" + this.parts[0].key
      }).get(this.parts[0].name, (function(_this) {
        return function(err, val) {
          if ((err != null) || (val == null)) {
            return callback(err);
          } else {
            return _this.register(callback);
          }
        };
      })(this));
    };

    return ShellOption;

  })();

  exports.appName = appName;

  exports.fileHandler = new ShellOption("\\Software\\Classes\\Applications\\" + exeName, [
    {
      key: 'shell\\open\\command',
      name: '',
      value: appPath + " \"%1\""
    }, {
      key: 'shell\\open',
      name: 'FriendlyAppName',
      value: "" + appName
    }, {
      key: 'DefaultIcon',
      name: '',
      value: "" + fileIconPath
    }
  ]);

  contextParts = [
    {
      key: 'command',
      name: '',
      value: appPath + " \"%1\""
    }, {
      name: '',
      value: "Open with " + appName
    }, {
      name: 'Icon',
      value: "" + appPath
    }
  ];

  exports.fileContextMenu = new ShellOption("\\Software\\Classes\\*\\shell\\" + appName, contextParts);

  exports.folderContextMenu = new ShellOption("\\Software\\Classes\\Directory\\shell\\" + appName, contextParts);

  exports.folderBackgroundContextMenu = new ShellOption("\\Software\\Classes\\Directory\\background\\shell\\" + appName, JSON.parse(JSON.stringify(contextParts).replace('%1', '%V')));

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3Mvd2luLXNoZWxsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMEZBQUE7SUFBQTs7RUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVI7O0VBQ1gsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUVQLE9BQUEsR0FBVSxJQUFJLENBQUMsUUFBTCxDQUFjLE9BQU8sQ0FBQyxRQUF0Qjs7RUFDVixPQUFBLEdBQVUsSUFBQSxHQUFLLE9BQU8sQ0FBQyxRQUFiLEdBQXNCOztFQUNoQyxZQUFBLEdBQWUsSUFBQSxHQUFJLENBQUMsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFPLENBQUMsUUFBbEIsRUFBNEIsSUFBNUIsRUFBa0MsV0FBbEMsRUFBK0MsS0FBL0MsRUFBc0QsVUFBdEQsQ0FBRCxDQUFKLEdBQXVFOztFQUN0RixNQUFBLEdBQVMsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsT0FBakI7O0VBQ1QsT0FBQSxHQUFVLE9BQU8sQ0FBQyxPQUFSLENBQWdCLE1BQWhCLEVBQXdCLENBQUksTUFBSCxHQUFlLFdBQWYsR0FBZ0MsTUFBakMsQ0FBeEIsQ0FBa0UsQ0FBQyxPQUFuRSxDQUEyRSxNQUEzRSxFQUFtRixFQUFuRjs7RUFFSjtJQUNTLHFCQUFDLEdBQUQsRUFBTSxLQUFOOzs7OztNQUNYLElBQUMsQ0FBQSxHQUFELEdBQU87TUFDUCxJQUFDLENBQUEsS0FBRCxHQUFTO0lBRkU7OzBCQUliLFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDUixJQUFBLFFBQUEsQ0FBUztRQUFDLElBQUEsRUFBTSxNQUFQO1FBQWUsR0FBQSxFQUFRLElBQUMsQ0FBQSxHQUFGLEdBQU0sSUFBTixHQUFVLElBQUMsQ0FBQSxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMs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O0tBRkYsRUFHRTtNQUFDLEdBQUEsRUFBSyxhQUFOO01BQXFCLElBQUEsRUFBTSxFQUEzQjtNQUErQixLQUFBLEVBQU8sRUFBQSxHQUFHLFlBQXpDO0tBSEY7R0FEd0I7O0VBUTFCLFlBQUEsR0FBZTtJQUNYO01BQUMsR0FBQSxFQUFLLFNBQU47TUFBaUIsSUFBQSxFQUFNLEVBQXZCO01BQTJCLEtBQUEsRUFBVSxPQUFELEdBQVMsU0FBN0M7S0FEVyxFQUVYO01BQUMsSUFBQSxFQUFNLEVBQVA7TUFBVyxLQUFBLEVBQU8sWUFBQSxHQUFhLE9BQS9CO0tBRlcsRUFHWDtNQUFDLElBQUEsRUFBTSxNQUFQO01BQWUsS0FBQSxFQUFPLEVBQUEsR0FBRyxPQUF6QjtLQUhXOzs7RUFNZixPQUFPLENBQUMsZUFBUixHQUE4QixJQUFBLFdBQUEsQ0FBWSxpQ0FBQSxHQUFrQyxPQUE5QyxFQUF5RCxZQUF6RDs7RUFFOUIsT0FBTyxDQUFDLGlCQUFSLEdBQWdDLElBQUEsV0FBQSxDQUFZLHlDQUFBLEdBQTBDLE9BQXRELEVBQWlFLFlBQWpFOztFQUVoQyxPQUFPLENBQUMsMkJBQVIsR0FBMEMsSUFBQSxXQUFBLENBQVkscURBQUEsR0FBc0QsT0FBbEUsRUFDeEMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsU0FBTCxDQUFlLFlBQWYsQ0FBNEIsQ0FBQyxPQUE3QixDQUFxQyxJQUFyQyxFQUEyQyxJQUEzQyxDQUFYLENBRHdDO0FBNUQxQyIsInNvdXJjZXNDb250ZW50IjpbIlJlZ2lzdHJ5ID0gcmVxdWlyZSAnd2lucmVnJ1xuUGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbmV4ZU5hbWUgPSBQYXRoLmJhc2VuYW1lKHByb2Nlc3MuZXhlY1BhdGgpXG5hcHBQYXRoID0gXCJcXFwiI3twcm9jZXNzLmV4ZWNQYXRofVxcXCJcIlxuZmlsZUljb25QYXRoID0gXCJcXFwiI3tQYXRoLmpvaW4ocHJvY2Vzcy5leGVjUGF0aCwgJy4uJywgJ3Jlc291cmNlcycsICdjbGknLCAnZmlsZS5pY28nKX1cXFwiXCJcbmlzQmV0YSA9IGFwcFBhdGguaW5jbHVkZXMoJyBCZXRhJylcbmFwcE5hbWUgPSBleGVOYW1lLnJlcGxhY2UoJ2F0b20nLCAoaWYgaXNCZXRhIHRoZW4gJ0F0b20gQmV0YScgZWxzZSAnQXRvbScgKSkucmVwbGFjZSgnLmV4ZScsICcnKVxuXG5jbGFzcyBTaGVsbE9wdGlvblxuICBjb25zdHJ1Y3RvcjogKGtleSwgcGFydHMpIC0+XG4gICAgQGtleSA9IGtleVxuICAgIEBwYXJ0cyA9IHBhcnRzXG5cbiAgaXNSZWdpc3RlcmVkOiAoY2FsbGJhY2spID0+XG4gICAgbmV3IFJlZ2lzdHJ5KHtoaXZlOiAnSEtDVScsIGtleTogXCIje0BrZXl9XFxcXCN7QHBhcnRzWzBdLmtleX1cIn0pXG4gICAgICAuZ2V0IEBwYXJ0c1swXS5uYW1lLCAoZXJyLCB2YWwpID0+XG4gICAgICAgIGNhbGxiYWNrKG5vdCBlcnI/IGFuZCB2YWw/IGFuZCB2YWwudmFsdWUgaXMgQHBhcnRzWzBdLnZhbHVlKVxuXG4gIHJlZ2lzdGVyOiAoY2FsbGJhY2spID0+XG4gICAgZG9uZUNvdW50ID0gQHBhcnRzLmxlbmd0aFxuICAgIEBwYXJ0cy5mb3JFYWNoIChwYXJ0KSA9PlxuICAgICAgcmVnID0gbmV3IFJlZ2lzdHJ5KHtoaXZlOiAnSEtDVScsIGtleTogaWYgcGFydC5rZXk/IHRoZW4gXCIje0BrZXl9XFxcXCN7cGFydC5rZXl9XCIgZWxzZSBAa2V5fSlcbiAgICAgIHJlZy5jcmVhdGUoIC0+IHJlZy5zZXQgcGFydC5uYW1lLCBSZWdpc3RyeS5SRUdfU1osIHBhcnQudmFsdWUsIC0+IGNhbGxiYWNrKCkgaWYgLS1kb25lQ291bnQgaXMgMClcblxuICBkZXJlZ2lzdGVyOiAoY2FsbGJhY2spID0+XG4gICAgQGlzUmVnaXN0ZXJlZCAoaXNSZWdpc3RlcmVkKSA9PlxuICAgICAgaWYgaXNSZWdpc3RlcmVkXG4gICAgICAgIG5ldyBSZWdpc3RyeSh7aGl2ZTogJ0hLQ1UnLCBrZXk6IEBrZXl9KS5kZXN0cm95IC0+IGNhbGxiYWNrIG51bGwsIHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgY2FsbGJhY2sgbnVsbCwgZmFsc2VcblxuICB1cGRhdGU6IChjYWxsYmFjaykgPT5cbiAgICBuZXcgUmVnaXN0cnkoe2hpdmU6ICdIS0NVJywga2V5OiBcIiN7QGtleX1cXFxcI3tAcGFydHNbMF0ua2V5fVwifSlcbiAgICAgIC5nZXQgQHBhcnRzWzBdLm5hbWUsIChlcnIsIHZhbCkgPT5cbiAgICAgICAgaWYgZXJyPyBvciBub3QgdmFsP1xuICAgICAgICAgIGNhbGxiYWNrKGVycilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEByZWdpc3RlciBjYWxsYmFja1xuXG5leHBvcnRzLmFwcE5hbWUgPSBhcHBOYW1lXG5cbmV4cG9ydHMuZmlsZUhhbmRsZXIgPSBuZXcgU2hlbGxPcHRpb24oXCJcXFxcU29mdHdhcmVcXFxcQ2xhc3Nlc1xcXFxBcHBsaWNhdGlvbnNcXFxcI3tleGVOYW1lfVwiLFxuICBbXG4gICAge2tleTogJ3NoZWxsXFxcXG9wZW5cXFxcY29tbWFuZCcsIG5hbWU6ICcnLCB2YWx1ZTogXCIje2FwcFBhdGh9IFxcXCIlMVxcXCJcIn0sXG4gICAge2tleTogJ3NoZWxsXFxcXG9wZW4nLCBuYW1lOiAnRnJpZW5kbHlBcHBOYW1lJywgdmFsdWU6IFwiI3thcHBOYW1lfVwifSxcbiAgICB7a2V5OiAnRGVmYXVsdEljb24nLCBuYW1lOiAnJywgdmFsdWU6IFwiI3tmaWxlSWNvblBhdGh9XCJ9XG4gIF1cbilcblxuY29udGV4dFBhcnRzID0gW1xuICAgIHtrZXk6ICdjb21tYW5kJywgbmFtZTogJycsIHZhbHVlOiBcIiN7YXBwUGF0aH0gXFxcIiUxXFxcIlwifSxcbiAgICB7bmFtZTogJycsIHZhbHVlOiBcIk9wZW4gd2l0aCAje2FwcE5hbWV9XCJ9LFxuICAgIHtuYW1lOiAnSWNvbicsIHZhbHVlOiBcIiN7YXBwUGF0aH1cIn1cbl1cblxuZXhwb3J0cy5maWxlQ29udGV4dE1lbnUgPSBuZXcgU2hlbGxPcHRpb24oXCJcXFxcU29mdHdhcmVcXFxcQ2xhc3Nlc1xcXFwqXFxcXHNoZWxsXFxcXCN7YXBwTmFtZX1cIiwgY29udGV4dFBhcnRzKVxuXG5leHBvcnRzLmZvbGRlckNvbnRleHRNZW51ID0gbmV3IFNoZWxsT3B0aW9uKFwiXFxcXFNvZnR3YXJlXFxcXENsYXNzZXNcXFxcRGlyZWN0b3J5XFxcXHNoZWxsXFxcXCN7YXBwTmFtZX1cIiwgY29udGV4dFBhcnRzKVxuXG5leHBvcnRzLmZvbGRlckJhY2tncm91bmRDb250ZXh0TWVudSA9IG5ldyBTaGVsbE9wdGlvbihcIlxcXFxTb2Z0d2FyZVxcXFxDbGFzc2VzXFxcXERpcmVjdG9yeVxcXFxiYWNrZ3JvdW5kXFxcXHNoZWxsXFxcXCN7YXBwTmFtZX1cIixcbiAgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb250ZXh0UGFydHMpLnJlcGxhY2UoJyUxJywgJyVWJykpXG4pXG4iXX0=
