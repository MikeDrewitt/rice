(function() {
  var AtomProtocolHandler, fs, path, protocol;

  protocol = require('electron').protocol;

  fs = require('fs');

  path = require('path');

  module.exports = AtomProtocolHandler = (function() {
    function AtomProtocolHandler(resourcePath, safeMode) {
      this.loadPaths = [];
      if (!safeMode) {
        this.loadPaths.push(path.join(process.env.ATOM_HOME, 'dev', 'packages'));
      }
      this.loadPaths.push(path.join(process.env.ATOM_HOME, 'packages'));
      this.loadPaths.push(path.join(resourcePath, 'node_modules'));
      this.registerAtomProtocol();
    }

    AtomProtocolHandler.prototype.registerAtomProtocol = function() {
      return protocol.registerFileProtocol('atom', (function(_this) {
        return function(request, callback) {
          var assetsPath, base, base1, filePath, i, len, loadPath, ref, relativePath;
          relativePath = path.normalize(request.url.substr(7));
          if (relativePath.indexOf('assets/') === 0) {
            assetsPath = path.join(process.env.ATOM_HOME, relativePath);
            if (typeof (base = fs.statSyncNoException(assetsPath)).isFile === "function" ? base.isFile() : void 0) {
              filePath = assetsPath;
            }
          }
          if (!filePath) {
            ref = _this.loadPaths;
            for (i = 0, len = ref.length; i < len; i++) {
              loadPath = ref[i];
              filePath = path.join(loadPath, relativePath);
              if (typeof (base1 = fs.statSyncNoException(filePath)).isFile === "function" ? base1.isFile() : void 0) {
                break;
              }
            }
          }
          return callback(filePath);
        };
      })(this));
    };

    return AtomProtocolHandler;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9tYWluLXByb2Nlc3MvYXRvbS1wcm90b2NvbC1oYW5kbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsV0FBWSxPQUFBLENBQVEsVUFBUjs7RUFDYixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQWFQLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyw2QkFBQyxZQUFELEVBQWUsUUFBZjtNQUNYLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFFYixJQUFBLENBQU8sUUFBUDtRQUNFLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsSUFBTCxDQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBdEIsRUFBaUMsS0FBakMsRUFBd0MsVUFBeEMsQ0FBaEIsRUFERjs7TUFHQSxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQXRCLEVBQWlDLFVBQWpDLENBQWhCO01BQ0EsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUFYLENBQWdCLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF3QixjQUF4QixDQUFoQjtNQUVBLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBVFc7O2tDQVliLG9CQUFBLEdBQXNCLFNBQUE7YUFDcEIsUUFBUSxDQUFDLG9CQUFULENBQThCLE1BQTlCLEVBQXNDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxPQUFELEVBQVUsUUFBVjtBQUNwQyxjQUFBO1VBQUEsWUFBQSxHQUFlLElBQUksQ0FBQyxTQUFMLENBQWUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFaLENBQW1CLENBQW5CLENBQWY7VUFFZixJQUFHLFlBQVksQ0FBQyxPQUFiLENBQXFCLFNBQXJCLENBQUEsS0FBbUMsQ0FBdEM7WUFDRSxVQUFBLEdBQWEsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQXRCLEVBQWlDLFlBQWpDO1lBQ2IsbUZBQTJELENBQUMsaUJBQTVEO2NBQUEsUUFBQSxHQUFXLFdBQVg7YUFGRjs7VUFJQSxJQUFBLENBQU8sUUFBUDtBQUNFO0FBQUEsaUJBQUEscUNBQUE7O2NBQ0UsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsUUFBVixFQUFvQixZQUFwQjtjQUNYLG1GQUF5QyxDQUFDLGlCQUExQztBQUFBLHNCQUFBOztBQUZGLGFBREY7O2lCQUtBLFFBQUEsQ0FBUyxRQUFUO1FBWm9DO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QztJQURvQjs7Ozs7QUE3QnhCIiwic291cmNlc0NvbnRlbnQiOlsie3Byb3RvY29sfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG4jIEhhbmRsZXMgcmVxdWVzdHMgd2l0aCAnYXRvbScgcHJvdG9jb2wuXG4jXG4jIEl0J3MgY3JlYXRlZCBieSB7QXRvbUFwcGxpY2F0aW9ufSB1cG9uIGluc3RhbnRpYXRpb24gYW5kIGlzIHVzZWQgdG8gY3JlYXRlIGFcbiMgY3VzdG9tIHJlc291cmNlIGxvYWRlciBmb3IgJ2F0b206Ly8nIFVSTHMuXG4jXG4jIFRoZSBmb2xsb3dpbmcgZGlyZWN0b3JpZXMgYXJlIHNlYXJjaGVkIGluIG9yZGVyOlxuIyAgICogfi8uYXRvbS9hc3NldHNcbiMgICAqIH4vLmF0b20vZGV2L3BhY2thZ2VzICh1bmxlc3MgaW4gc2FmZSBtb2RlKVxuIyAgICogfi8uYXRvbS9wYWNrYWdlc1xuIyAgICogUkVTT1VSQ0VfUEFUSC9ub2RlX21vZHVsZXNcbiNcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEF0b21Qcm90b2NvbEhhbmRsZXJcbiAgY29uc3RydWN0b3I6IChyZXNvdXJjZVBhdGgsIHNhZmVNb2RlKSAtPlxuICAgIEBsb2FkUGF0aHMgPSBbXVxuXG4gICAgdW5sZXNzIHNhZmVNb2RlXG4gICAgICBAbG9hZFBhdGhzLnB1c2gocGF0aC5qb2luKHByb2Nlc3MuZW52LkFUT01fSE9NRSwgJ2RldicsICdwYWNrYWdlcycpKVxuXG4gICAgQGxvYWRQYXRocy5wdXNoKHBhdGguam9pbihwcm9jZXNzLmVudi5BVE9NX0hPTUUsICdwYWNrYWdlcycpKVxuICAgIEBsb2FkUGF0aHMucHVzaChwYXRoLmpvaW4ocmVzb3VyY2VQYXRoLCAnbm9kZV9tb2R1bGVzJykpXG5cbiAgICBAcmVnaXN0ZXJBdG9tUHJvdG9jb2woKVxuXG4gICMgQ3JlYXRlcyB0aGUgJ2F0b20nIGN1c3RvbSBwcm90b2NvbCBoYW5kbGVyLlxuICByZWdpc3RlckF0b21Qcm90b2NvbDogLT5cbiAgICBwcm90b2NvbC5yZWdpc3RlckZpbGVQcm90b2NvbCAnYXRvbScsIChyZXF1ZXN0LCBjYWxsYmFjaykgPT5cbiAgICAgIHJlbGF0aXZlUGF0aCA9IHBhdGgubm9ybWFsaXplKHJlcXVlc3QudXJsLnN1YnN0cig3KSlcblxuICAgICAgaWYgcmVsYXRpdmVQYXRoLmluZGV4T2YoJ2Fzc2V0cy8nKSBpcyAwXG4gICAgICAgIGFzc2V0c1BhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuQVRPTV9IT01FLCByZWxhdGl2ZVBhdGgpXG4gICAgICAgIGZpbGVQYXRoID0gYXNzZXRzUGF0aCBpZiBmcy5zdGF0U3luY05vRXhjZXB0aW9uKGFzc2V0c1BhdGgpLmlzRmlsZT8oKVxuXG4gICAgICB1bmxlc3MgZmlsZVBhdGhcbiAgICAgICAgZm9yIGxvYWRQYXRoIGluIEBsb2FkUGF0aHNcbiAgICAgICAgICBmaWxlUGF0aCA9IHBhdGguam9pbihsb2FkUGF0aCwgcmVsYXRpdmVQYXRoKVxuICAgICAgICAgIGJyZWFrIGlmIGZzLnN0YXRTeW5jTm9FeGNlcHRpb24oZmlsZVBhdGgpLmlzRmlsZT8oKVxuXG4gICAgICBjYWxsYmFjayhmaWxlUGF0aClcbiJdfQ==
