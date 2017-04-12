(function() {
  var BufferedProcess, Point, TagGenerator, path, ref;

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, Point = ref.Point;

  path = require('path');

  module.exports = TagGenerator = (function() {
    function TagGenerator(path1, scopeName) {
      this.path = path1;
      this.scopeName = scopeName;
    }

    TagGenerator.prototype.getPackageRoot = function() {
      var packageRoot, resourcePath;
      packageRoot = path.resolve(__dirname, '..');
      resourcePath = atom.getLoadSettings().resourcePath;
      if (path.extname(resourcePath) === '.asar') {
        if (packageRoot.indexOf(resourcePath) === 0) {
          packageRoot = path.join(resourcePath + ".unpacked", 'node_modules', 'symbols-view');
        }
      }
      return packageRoot;
    };

    TagGenerator.prototype.parseTagLine = function(line) {
      var sections;
      sections = line.split('\t');
      if (sections.length > 3) {
        return {
          position: new Point(parseInt(sections[2]) - 1),
          name: sections[0]
        };
      } else {
        return null;
      }
    };

    TagGenerator.prototype.getLanguage = function() {
      var ref1;
      if ((ref1 = path.extname(this.path)) === '.cson' || ref1 === '.gyp') {
        return 'Cson';
      }
      switch (this.scopeName) {
        case 'source.c':
          return 'C';
        case 'source.cpp':
          return 'C++';
        case 'source.clojure':
          return 'Lisp';
        case 'source.capnp':
          return 'Capnp';
        case 'source.coffee':
          return 'CoffeeScript';
        case 'source.css':
          return 'Css';
        case 'source.css.less':
          return 'Css';
        case 'source.css.scss':
          return 'Css';
        case 'source.elixir':
          return 'Elixir';
        case 'source.fountain':
          return 'Fountain';
        case 'source.gfm':
          return 'Markdown';
        case 'source.go':
          return 'Go';
        case 'source.java':
          return 'Java';
        case 'source.js':
          return 'JavaScript';
        case 'source.js.jsx':
          return 'JavaScript';
        case 'source.jsx':
          return 'JavaScript';
        case 'source.json':
          return 'Json';
        case 'source.julia':
          return 'Julia';
        case 'source.makefile':
          return 'Make';
        case 'source.objc':
          return 'C';
        case 'source.objcpp':
          return 'C++';
        case 'source.python':
          return 'Python';
        case 'source.ruby':
          return 'Ruby';
        case 'source.sass':
          return 'Sass';
        case 'source.yaml':
          return 'Yaml';
        case 'text.html':
          return 'Html';
        case 'text.html.php':
          return 'Php';
      }
    };

    TagGenerator.prototype.generate = function() {
      var args, command, defaultCtagsFile, language, packageRoot, tags;
      tags = {};
      packageRoot = this.getPackageRoot();
      command = path.join(packageRoot, 'vendor', "ctags-" + process.platform);
      defaultCtagsFile = path.join(packageRoot, 'lib', 'ctags-config');
      args = ["--options=" + defaultCtagsFile, '--fields=+KS'];
      if (atom.config.get('symbols-view.useEditorGrammarAsCtagsLanguage')) {
        if (language = this.getLanguage()) {
          args.push("--language-force=" + language);
        }
      }
      args.push('-nf', '-', this.path);
      return new Promise((function(_this) {
        return function(resolve) {
          return new BufferedProcess({
            command: command,
            args: args,
            stdout: function(lines) {
              var i, len, line, name, ref1, results, tag;
              ref1 = lines.split('\n');
              results = [];
              for (i = 0, len = ref1.length; i < len; i++) {
                line = ref1[i];
                if (tag = _this.parseTagLine(line)) {
                  results.push(tags[name = tag.position.row] != null ? tags[name] : tags[name] = tag);
                } else {
                  results.push(void 0);
                }
              }
              return results;
            },
            stderr: function() {},
            exit: function() {
              var row, tag;
              tags = (function() {
                var results;
                results = [];
                for (row in tags) {
                  tag = tags[row];
                  results.push(tag);
                }
                return results;
              })();
              return resolve(tags);
            }
          });
        };
      })(this));
    };

    return TagGenerator;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3N5bWJvbHMtdmlldy9saWIvdGFnLWdlbmVyYXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQTJCLE9BQUEsQ0FBUSxNQUFSLENBQTNCLEVBQUMscUNBQUQsRUFBa0I7O0VBQ2xCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1Msc0JBQUMsS0FBRCxFQUFRLFNBQVI7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUFPLElBQUMsQ0FBQSxZQUFEO0lBQVI7OzJCQUViLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxXQUFBLEdBQWMsSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiLEVBQXdCLElBQXhCO01BQ2IsZUFBZ0IsSUFBSSxDQUFDLGVBQUwsQ0FBQTtNQUNqQixJQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsWUFBYixDQUFBLEtBQThCLE9BQWpDO1FBQ0UsSUFBRyxXQUFXLENBQUMsT0FBWixDQUFvQixZQUFwQixDQUFBLEtBQXFDLENBQXhDO1VBQ0UsV0FBQSxHQUFjLElBQUksQ0FBQyxJQUFMLENBQWEsWUFBRCxHQUFjLFdBQTFCLEVBQXNDLGNBQXRDLEVBQXNELGNBQXRELEVBRGhCO1NBREY7O2FBR0E7SUFOYzs7MkJBUWhCLFlBQUEsR0FBYyxTQUFDLElBQUQ7QUFDWixVQUFBO01BQUEsUUFBQSxHQUFXLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWDtNQUNYLElBQUcsUUFBUSxDQUFDLE1BQVQsR0FBa0IsQ0FBckI7ZUFDRTtVQUFBLFFBQUEsRUFBYyxJQUFBLEtBQUEsQ0FBTSxRQUFBLENBQVMsUUFBUyxDQUFBLENBQUEsQ0FBbEIsQ0FBQSxHQUF3QixDQUE5QixDQUFkO1VBQ0EsSUFBQSxFQUFNLFFBQVMsQ0FBQSxDQUFBLENBRGY7VUFERjtPQUFBLE1BQUE7ZUFJRSxLQUpGOztJQUZZOzsyQkFRZCxXQUFBLEdBQWEsU0FBQTtBQUNYLFVBQUE7TUFBQSxZQUFpQixJQUFJLENBQUMsT0FBTCxDQUFhLElBQUMsQ0FBQSxJQUFkLEVBQUEsS0FBd0IsT0FBeEIsSUFBQSxJQUFBLEtBQWlDLE1BQWxEO0FBQUEsZUFBTyxPQUFQOztBQUVBLGNBQU8sSUFBQyxDQUFBLFNBQVI7QUFBQSxhQUNPLFVBRFA7aUJBQzhCO0FBRDlCLGFBRU8sWUFGUDtpQkFFOEI7QUFGOUIsYUFHTyxnQkFIUDtpQkFHOEI7QUFIOUIsYUFJTyxjQUpQO2lCQUk4QjtBQUo5QixhQUtPLGVBTFA7aUJBSzhCO0FBTDlCLGFBTU8sWUFOUDtpQkFNOEI7QUFOOUIsYUFPTyxpQkFQUDtpQkFPOEI7QUFQOUIsYUFRTyxpQkFSUDtpQkFROEI7QUFSOUIsYUFTTyxlQVRQO2lCQVM4QjtBQVQ5QixhQVVPLGlCQVZQO2lCQVU4QjtBQVY5QixhQVdPLFlBWFA7aUJBVzhCO0FBWDlCLGFBWU8sV0FaUDtpQkFZOEI7QUFaOUIsYUFhTyxhQWJQO2lCQWE4QjtBQWI5QixhQWNPLFdBZFA7aUJBYzhCO0FBZDlCLGFBZU8sZUFmUDtpQkFlOEI7QUFmOUIsYUFnQk8sWUFoQlA7aUJBZ0I4QjtBQWhCOUIsYUFpQk8sYUFqQlA7aUJBaUI4QjtBQWpCOUIsYUFrQk8sY0FsQlA7aUJBa0I4QjtBQWxCOUIsYUFtQk8saUJBbkJQO2lCQW1COEI7QUFuQjlCLGFBb0JPLGFBcEJQO2lCQW9COEI7QUFwQjlCLGFBcUJPLGVBckJQO2lCQXFCOEI7QUFyQjlCLGFBc0JPLGVBdEJQO2lCQXNCOEI7QUF0QjlCLGFBdUJPLGFBdkJQO2lCQXVCOEI7QUF2QjlCLGFBd0JPLGFBeEJQO2lCQXdCOEI7QUF4QjlCLGFBeUJPLGFBekJQO2lCQXlCOEI7QUF6QjlCLGFBMEJPLFdBMUJQO2lCQTBCOEI7QUExQjlCLGFBMkJPLGVBM0JQO2lCQTJCOEI7QUEzQjlCO0lBSFc7OzJCQWdDYixRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxJQUFBLEdBQU87TUFDUCxXQUFBLEdBQWMsSUFBQyxDQUFBLGNBQUQsQ0FBQTtNQUNkLE9BQUEsR0FBVSxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBdUIsUUFBdkIsRUFBaUMsUUFBQSxHQUFTLE9BQU8sQ0FBQyxRQUFsRDtNQUNWLGdCQUFBLEdBQW1CLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixLQUF2QixFQUE4QixjQUE5QjtNQUNuQixJQUFBLEdBQU8sQ0FBQyxZQUFBLEdBQWEsZ0JBQWQsRUFBa0MsY0FBbEM7TUFFUCxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw4Q0FBaEIsQ0FBSDtRQUNFLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FBZDtVQUNFLElBQUksQ0FBQyxJQUFMLENBQVUsbUJBQUEsR0FBb0IsUUFBOUIsRUFERjtTQURGOztNQUlBLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBVixFQUFpQixHQUFqQixFQUFzQixJQUFDLENBQUEsSUFBdkI7YUFFSSxJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRDtpQkFDTixJQUFBLGVBQUEsQ0FBZ0I7WUFDbEIsT0FBQSxFQUFTLE9BRFM7WUFFbEIsSUFBQSxFQUFNLElBRlk7WUFHbEIsTUFBQSxFQUFRLFNBQUMsS0FBRDtBQUNOLGtCQUFBO0FBQUE7QUFBQTttQkFBQSxzQ0FBQTs7Z0JBQ0UsSUFBRyxHQUFBLEdBQU0sS0FBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLENBQVQ7dUVBQ0UsYUFBQSxhQUEwQixLQUQ1QjtpQkFBQSxNQUFBO3VDQUFBOztBQURGOztZQURNLENBSFU7WUFPbEIsTUFBQSxFQUFRLFNBQUEsR0FBQSxDQVBVO1lBUWxCLElBQUEsRUFBTSxTQUFBO0FBQ0osa0JBQUE7Y0FBQSxJQUFBOztBQUFRO3FCQUFBLFdBQUE7OytCQUFBO0FBQUE7OztxQkFDUixPQUFBLENBQVEsSUFBUjtZQUZJLENBUlk7V0FBaEI7UUFETTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBUjtJQWJJOzs7OztBQXZEWiIsInNvdXJjZXNDb250ZW50IjpbIntCdWZmZXJlZFByb2Nlc3MsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGFnR2VuZXJhdG9yXG4gIGNvbnN0cnVjdG9yOiAoQHBhdGgsIEBzY29wZU5hbWUpIC0+XG5cbiAgZ2V0UGFja2FnZVJvb3Q6IC0+XG4gICAgcGFja2FnZVJvb3QgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nKVxuICAgIHtyZXNvdXJjZVBhdGh9ID0gYXRvbS5nZXRMb2FkU2V0dGluZ3MoKVxuICAgIGlmIHBhdGguZXh0bmFtZShyZXNvdXJjZVBhdGgpIGlzICcuYXNhcidcbiAgICAgIGlmIHBhY2thZ2VSb290LmluZGV4T2YocmVzb3VyY2VQYXRoKSBpcyAwXG4gICAgICAgIHBhY2thZ2VSb290ID0gcGF0aC5qb2luKFwiI3tyZXNvdXJjZVBhdGh9LnVucGFja2VkXCIsICdub2RlX21vZHVsZXMnLCAnc3ltYm9scy12aWV3JylcbiAgICBwYWNrYWdlUm9vdFxuXG4gIHBhcnNlVGFnTGluZTogKGxpbmUpIC0+XG4gICAgc2VjdGlvbnMgPSBsaW5lLnNwbGl0KCdcXHQnKVxuICAgIGlmIHNlY3Rpb25zLmxlbmd0aCA+IDNcbiAgICAgIHBvc2l0aW9uOiBuZXcgUG9pbnQocGFyc2VJbnQoc2VjdGlvbnNbMl0pIC0gMSlcbiAgICAgIG5hbWU6IHNlY3Rpb25zWzBdXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gIGdldExhbmd1YWdlOiAtPlxuICAgIHJldHVybiAnQ3NvbicgaWYgcGF0aC5leHRuYW1lKEBwYXRoKSBpbiBbJy5jc29uJywgJy5neXAnXVxuXG4gICAgc3dpdGNoIEBzY29wZU5hbWVcbiAgICAgIHdoZW4gJ3NvdXJjZS5jJyAgICAgICAgdGhlbiAnQydcbiAgICAgIHdoZW4gJ3NvdXJjZS5jcHAnICAgICAgdGhlbiAnQysrJ1xuICAgICAgd2hlbiAnc291cmNlLmNsb2p1cmUnICB0aGVuICdMaXNwJ1xuICAgICAgd2hlbiAnc291cmNlLmNhcG5wJyAgICB0aGVuICdDYXBucCdcbiAgICAgIHdoZW4gJ3NvdXJjZS5jb2ZmZWUnICAgdGhlbiAnQ29mZmVlU2NyaXB0J1xuICAgICAgd2hlbiAnc291cmNlLmNzcycgICAgICB0aGVuICdDc3MnXG4gICAgICB3aGVuICdzb3VyY2UuY3NzLmxlc3MnIHRoZW4gJ0NzcydcbiAgICAgIHdoZW4gJ3NvdXJjZS5jc3Muc2NzcycgdGhlbiAnQ3NzJ1xuICAgICAgd2hlbiAnc291cmNlLmVsaXhpcicgICB0aGVuICdFbGl4aXInXG4gICAgICB3aGVuICdzb3VyY2UuZm91bnRhaW4nIHRoZW4gJ0ZvdW50YWluJ1xuICAgICAgd2hlbiAnc291cmNlLmdmbScgICAgICB0aGVuICdNYXJrZG93bidcbiAgICAgIHdoZW4gJ3NvdXJjZS5nbycgICAgICAgdGhlbiAnR28nXG4gICAgICB3aGVuICdzb3VyY2UuamF2YScgICAgIHRoZW4gJ0phdmEnXG4gICAgICB3aGVuICdzb3VyY2UuanMnICAgICAgIHRoZW4gJ0phdmFTY3JpcHQnXG4gICAgICB3aGVuICdzb3VyY2UuanMuanN4JyAgIHRoZW4gJ0phdmFTY3JpcHQnXG4gICAgICB3aGVuICdzb3VyY2UuanN4JyAgICAgIHRoZW4gJ0phdmFTY3JpcHQnXG4gICAgICB3aGVuICdzb3VyY2UuanNvbicgICAgIHRoZW4gJ0pzb24nXG4gICAgICB3aGVuICdzb3VyY2UuanVsaWEnICAgIHRoZW4gJ0p1bGlhJ1xuICAgICAgd2hlbiAnc291cmNlLm1ha2VmaWxlJyB0aGVuICdNYWtlJ1xuICAgICAgd2hlbiAnc291cmNlLm9iamMnICAgICB0aGVuICdDJ1xuICAgICAgd2hlbiAnc291cmNlLm9iamNwcCcgICB0aGVuICdDKysnXG4gICAgICB3aGVuICdzb3VyY2UucHl0aG9uJyAgIHRoZW4gJ1B5dGhvbidcbiAgICAgIHdoZW4gJ3NvdXJjZS5ydWJ5JyAgICAgdGhlbiAnUnVieSdcbiAgICAgIHdoZW4gJ3NvdXJjZS5zYXNzJyAgICAgdGhlbiAnU2FzcydcbiAgICAgIHdoZW4gJ3NvdXJjZS55YW1sJyAgICAgdGhlbiAnWWFtbCdcbiAgICAgIHdoZW4gJ3RleHQuaHRtbCcgICAgICAgdGhlbiAnSHRtbCdcbiAgICAgIHdoZW4gJ3RleHQuaHRtbC5waHAnICAgdGhlbiAnUGhwJ1xuXG4gIGdlbmVyYXRlOiAtPlxuICAgIHRhZ3MgPSB7fVxuICAgIHBhY2thZ2VSb290ID0gQGdldFBhY2thZ2VSb290KClcbiAgICBjb21tYW5kID0gcGF0aC5qb2luKHBhY2thZ2VSb290LCAndmVuZG9yJywgXCJjdGFncy0je3Byb2Nlc3MucGxhdGZvcm19XCIpXG4gICAgZGVmYXVsdEN0YWdzRmlsZSA9IHBhdGguam9pbihwYWNrYWdlUm9vdCwgJ2xpYicsICdjdGFncy1jb25maWcnKVxuICAgIGFyZ3MgPSBbXCItLW9wdGlvbnM9I3tkZWZhdWx0Q3RhZ3NGaWxlfVwiLCAnLS1maWVsZHM9K0tTJ11cblxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnc3ltYm9scy12aWV3LnVzZUVkaXRvckdyYW1tYXJBc0N0YWdzTGFuZ3VhZ2UnKVxuICAgICAgaWYgbGFuZ3VhZ2UgPSBAZ2V0TGFuZ3VhZ2UoKVxuICAgICAgICBhcmdzLnB1c2goXCItLWxhbmd1YWdlLWZvcmNlPSN7bGFuZ3VhZ2V9XCIpXG5cbiAgICBhcmdzLnB1c2goJy1uZicsICctJywgQHBhdGgpXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cbiAgICAgIG5ldyBCdWZmZXJlZFByb2Nlc3Moe1xuICAgICAgICBjb21tYW5kOiBjb21tYW5kLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgICAgICBzdGRvdXQ6IChsaW5lcykgPT5cbiAgICAgICAgICBmb3IgbGluZSBpbiBsaW5lcy5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgIGlmIHRhZyA9IEBwYXJzZVRhZ0xpbmUobGluZSlcbiAgICAgICAgICAgICAgdGFnc1t0YWcucG9zaXRpb24ucm93XSA/PSB0YWdcbiAgICAgICAgc3RkZXJyOiAtPlxuICAgICAgICBleGl0OiAtPlxuICAgICAgICAgIHRhZ3MgPSAodGFnIGZvciByb3csIHRhZyBvZiB0YWdzKVxuICAgICAgICAgIHJlc29sdmUodGFncylcbiAgICAgIH0pXG4iXX0=
