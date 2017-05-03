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
        case 'text.tex.latex':
          return 'Latex';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zeW1ib2xzLXZpZXcvbGliL3RhZy1nZW5lcmF0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUEyQixPQUFBLENBQVEsTUFBUixDQUEzQixFQUFDLHFDQUFELEVBQWtCOztFQUNsQixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHNCQUFDLEtBQUQsRUFBUSxTQUFSO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFBTyxJQUFDLENBQUEsWUFBRDtJQUFSOzsyQkFFYixjQUFBLEdBQWdCLFNBQUE7QUFDZCxVQUFBO01BQUEsV0FBQSxHQUFjLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixFQUF3QixJQUF4QjtNQUNiLGVBQWdCLElBQUksQ0FBQyxlQUFMLENBQUE7TUFDakIsSUFBRyxJQUFJLENBQUMsT0FBTCxDQUFhLFlBQWIsQ0FBQSxLQUE4QixPQUFqQztRQUNFLElBQUcsV0FBVyxDQUFDLE9BQVosQ0FBb0IsWUFBcEIsQ0FBQSxLQUFxQyxDQUF4QztVQUNFLFdBQUEsR0FBYyxJQUFJLENBQUMsSUFBTCxDQUFhLFlBQUQsR0FBYyxXQUExQixFQUFzQyxjQUF0QyxFQUFzRCxjQUF0RCxFQURoQjtTQURGOzthQUdBO0lBTmM7OzJCQVFoQixZQUFBLEdBQWMsU0FBQyxJQUFEO0FBQ1osVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVg7TUFDWCxJQUFHLFFBQVEsQ0FBQyxNQUFULEdBQWtCLENBQXJCO2VBQ0U7VUFBQSxRQUFBLEVBQWMsSUFBQSxLQUFBLENBQU0sUUFBQSxDQUFTLFFBQVMsQ0FBQSxDQUFBLENBQWxCLENBQUEsR0FBd0IsQ0FBOUIs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cUJBQUEsV0FBQTs7K0JBQUE7QUFBQTs7O3FCQUNSLE9BQUEsQ0FBUSxJQUFSO1lBRkksQ0FSWTtXQUFoQjtRQURNO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSO0lBYkk7Ozs7O0FBeERaIiwic291cmNlc0NvbnRlbnQiOlsie0J1ZmZlcmVkUHJvY2VzcywgUG9pbnR9ID0gcmVxdWlyZSAnYXRvbSdcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBUYWdHZW5lcmF0b3JcbiAgY29uc3RydWN0b3I6IChAcGF0aCwgQHNjb3BlTmFtZSkgLT5cblxuICBnZXRQYWNrYWdlUm9vdDogLT5cbiAgICBwYWNrYWdlUm9vdCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicpXG4gICAge3Jlc291cmNlUGF0aH0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG4gICAgaWYgcGF0aC5leHRuYW1lKHJlc291cmNlUGF0aCkgaXMgJy5hc2FyJ1xuICAgICAgaWYgcGFja2FnZVJvb3QuaW5kZXhPZihyZXNvdXJjZVBhdGgpIGlzIDBcbiAgICAgICAgcGFja2FnZVJvb3QgPSBwYXRoLmpvaW4oXCIje3Jlc291cmNlUGF0aH0udW5wYWNrZWRcIiwgJ25vZGVfbW9kdWxlcycsICdzeW1ib2xzLXZpZXcnKVxuICAgIHBhY2thZ2VSb290XG5cbiAgcGFyc2VUYWdMaW5lOiAobGluZSkgLT5cbiAgICBzZWN0aW9ucyA9IGxpbmUuc3BsaXQoJ1xcdCcpXG4gICAgaWYgc2VjdGlvbnMubGVuZ3RoID4gM1xuICAgICAgcG9zaXRpb246IG5ldyBQb2ludChwYXJzZUludChzZWN0aW9uc1syXSkgLSAxKVxuICAgICAgbmFtZTogc2VjdGlvbnNbMF1cbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgZ2V0TGFuZ3VhZ2U6IC0+XG4gICAgcmV0dXJuICdDc29uJyBpZiBwYXRoLmV4dG5hbWUoQHBhdGgpIGluIFsnLmNzb24nLCAnLmd5cCddXG5cbiAgICBzd2l0Y2ggQHNjb3BlTmFtZVxuICAgICAgd2hlbiAnc291cmNlLmMnICAgICAgICB0aGVuICdDJ1xuICAgICAgd2hlbiAnc291cmNlLmNwcCcgICAgICB0aGVuICdDKysnXG4gICAgICB3aGVuICdzb3VyY2UuY2xvanVyZScgIHRoZW4gJ0xpc3AnXG4gICAgICB3aGVuICdzb3VyY2UuY2FwbnAnICAgIHRoZW4gJ0NhcG5wJ1xuICAgICAgd2hlbiAnc291cmNlLmNvZmZlZScgICB0aGVuICdDb2ZmZWVTY3JpcHQnXG4gICAgICB3aGVuICdzb3VyY2UuY3NzJyAgICAgIHRoZW4gJ0NzcydcbiAgICAgIHdoZW4gJ3NvdXJjZS5jc3MubGVzcycgdGhlbiAnQ3NzJ1xuICAgICAgd2hlbiAnc291cmNlLmNzcy5zY3NzJyB0aGVuICdDc3MnXG4gICAgICB3aGVuICdzb3VyY2UuZWxpeGlyJyAgIHRoZW4gJ0VsaXhpcidcbiAgICAgIHdoZW4gJ3NvdXJjZS5mb3VudGFpbicgdGhlbiAnRm91bnRhaW4nXG4gICAgICB3aGVuICdzb3VyY2UuZ2ZtJyAgICAgIHRoZW4gJ01hcmtkb3duJ1xuICAgICAgd2hlbiAnc291cmNlLmdvJyAgICAgICB0aGVuICdHbydcbiAgICAgIHdoZW4gJ3NvdXJjZS5qYXZhJyAgICAgdGhlbiAnSmF2YSdcbiAgICAgIHdoZW4gJ3NvdXJjZS5qcycgICAgICAgdGhlbiAnSmF2YVNjcmlwdCdcbiAgICAgIHdoZW4gJ3NvdXJjZS5qcy5qc3gnICAgdGhlbiAnSmF2YVNjcmlwdCdcbiAgICAgIHdoZW4gJ3NvdXJjZS5qc3gnICAgICAgdGhlbiAnSmF2YVNjcmlwdCdcbiAgICAgIHdoZW4gJ3NvdXJjZS5qc29uJyAgICAgdGhlbiAnSnNvbidcbiAgICAgIHdoZW4gJ3NvdXJjZS5qdWxpYScgICAgdGhlbiAnSnVsaWEnXG4gICAgICB3aGVuICdzb3VyY2UubWFrZWZpbGUnIHRoZW4gJ01ha2UnXG4gICAgICB3aGVuICdzb3VyY2Uub2JqYycgICAgIHRoZW4gJ0MnXG4gICAgICB3aGVuICdzb3VyY2Uub2JqY3BwJyAgIHRoZW4gJ0MrKydcbiAgICAgIHdoZW4gJ3NvdXJjZS5weXRob24nICAgdGhlbiAnUHl0aG9uJ1xuICAgICAgd2hlbiAnc291cmNlLnJ1YnknICAgICB0aGVuICdSdWJ5J1xuICAgICAgd2hlbiAnc291cmNlLnNhc3MnICAgICB0aGVuICdTYXNzJ1xuICAgICAgd2hlbiAnc291cmNlLnlhbWwnICAgICB0aGVuICdZYW1sJ1xuICAgICAgd2hlbiAndGV4dC5odG1sJyAgICAgICB0aGVuICdIdG1sJ1xuICAgICAgd2hlbiAndGV4dC5odG1sLnBocCcgICB0aGVuICdQaHAnXG4gICAgICB3aGVuICd0ZXh0LnRleC5sYXRleCcgIHRoZW4gJ0xhdGV4J1xuXG4gIGdlbmVyYXRlOiAtPlxuICAgIHRhZ3MgPSB7fVxuICAgIHBhY2thZ2VSb290ID0gQGdldFBhY2thZ2VSb290KClcbiAgICBjb21tYW5kID0gcGF0aC5qb2luKHBhY2thZ2VSb290LCAndmVuZG9yJywgXCJjdGFncy0je3Byb2Nlc3MucGxhdGZvcm19XCIpXG4gICAgZGVmYXVsdEN0YWdzRmlsZSA9IHBhdGguam9pbihwYWNrYWdlUm9vdCwgJ2xpYicsICdjdGFncy1jb25maWcnKVxuICAgIGFyZ3MgPSBbXCItLW9wdGlvbnM9I3tkZWZhdWx0Q3RhZ3NGaWxlfVwiLCAnLS1maWVsZHM9K0tTJ11cblxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnc3ltYm9scy12aWV3LnVzZUVkaXRvckdyYW1tYXJBc0N0YWdzTGFuZ3VhZ2UnKVxuICAgICAgaWYgbGFuZ3VhZ2UgPSBAZ2V0TGFuZ3VhZ2UoKVxuICAgICAgICBhcmdzLnB1c2goXCItLWxhbmd1YWdlLWZvcmNlPSN7bGFuZ3VhZ2V9XCIpXG5cbiAgICBhcmdzLnB1c2goJy1uZicsICctJywgQHBhdGgpXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cbiAgICAgIG5ldyBCdWZmZXJlZFByb2Nlc3Moe1xuICAgICAgICBjb21tYW5kOiBjb21tYW5kLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgICAgICBzdGRvdXQ6IChsaW5lcykgPT5cbiAgICAgICAgICBmb3IgbGluZSBpbiBsaW5lcy5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgIGlmIHRhZyA9IEBwYXJzZVRhZ0xpbmUobGluZSlcbiAgICAgICAgICAgICAgdGFnc1t0YWcucG9zaXRpb24ucm93XSA/PSB0YWdcbiAgICAgICAgc3RkZXJyOiAtPlxuICAgICAgICBleGl0OiAtPlxuICAgICAgICAgIHRhZ3MgPSAodGFnIGZvciByb3csIHRhZyBvZiB0YWdzKVxuICAgICAgICAgIHJlc29sdmUodGFncylcbiAgICAgIH0pXG4iXX0=
