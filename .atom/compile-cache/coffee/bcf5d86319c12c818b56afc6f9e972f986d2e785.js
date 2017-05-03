(function() {
  var CSON, CompositeDisposable, Disposable, Emitter, File, ScopedPropertyStore, Snippet, SnippetExpansion, _, async, fs, path, ref,
    slice = [].slice;

  path = require('path');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable, File = ref.File;

  _ = require('underscore-plus');

  async = require('async');

  CSON = require('season');

  fs = require('fs-plus');

  ScopedPropertyStore = require('scoped-property-store');

  Snippet = require('./snippet');

  SnippetExpansion = require('./snippet-expansion');

  module.exports = {
    loaded: false,
    activate: function() {
      var snippets;
      this.userSnippetsPath = null;
      this.snippetIdCounter = 0;
      this.parsedSnippetsById = new Map;
      this.scopedPropertyStore = new ScopedPropertyStore;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.workspace.addOpener((function(_this) {
        return function(uri) {
          if (uri === 'atom://.atom/snippets') {
            return atom.workspace.open(_this.getUserSnippetsPath());
          }
        };
      })(this)));
      this.loadAll();
      this.watchUserSnippets((function(_this) {
        return function(watchDisposable) {
          return _this.subscriptions.add(watchDisposable);
        };
      })(this));
      snippets = this;
      this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'snippets:expand': function(event) {
          var editor;
          editor = this.getModel();
          if (snippets.snippetToExpandUnderCursor(editor)) {
            snippets.clearExpansions(editor);
            return snippets.expandSnippetsUnderCursors(editor);
          } else {
            return event.abortKeyBinding();
          }
        },
        'snippets:next-tab-stop': function(event) {
          var editor;
          editor = this.getModel();
          if (!snippets.goToNextTabStop(editor)) {
            return event.abortKeyBinding();
          }
        },
        'snippets:previous-tab-stop': function(event) {
          var editor;
          editor = this.getModel();
          if (!snippets.goToPreviousTabStop(editor)) {
            return event.abortKeyBinding();
          }
        },
        'snippets:available': function(event) {
          var SnippetsAvailable, editor;
          editor = this.getModel();
          SnippetsAvailable = require('./snippets-available');
          if (snippets.availableSnippetsView == null) {
            snippets.availableSnippetsView = new SnippetsAvailable(snippets);
          }
          return snippets.availableSnippetsView.toggle(editor);
        }
      }));
      return this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.clearExpansions(editor);
        };
      })(this)));
    },
    deactivate: function() {
      var ref1;
      if ((ref1 = this.emitter) != null) {
        ref1.dispose();
      }
      this.emitter = null;
      this.editorSnippetExpansions = null;
      return atom.config.transact((function(_this) {
        return function() {
          return _this.subscriptions.dispose();
        };
      })(this));
    },
    getUserSnippetsPath: function() {
      if (this.userSnippetsPath != null) {
        return this.userSnippetsPath;
      }
      this.userSnippetsPath = CSON.resolve(path.join(atom.getConfigDirPath(), 'snippets'));
      if (this.userSnippetsPath == null) {
        this.userSnippetsPath = path.join(atom.getConfigDirPath(), 'snippets.cson');
      }
      return this.userSnippetsPath;
    },
    loadAll: function(callback) {
      return this.loadBundledSnippets((function(_this) {
        return function(bundledSnippets) {
          return _this.loadPackageSnippets(function(packageSnippets) {
            return _this.loadUserSnippets(function(userSnippets) {
              atom.config.transact(function() {
                var filepath, i, len, ref1, results1, snippetSet, snippetsBySelector;
                ref1 = [bundledSnippets, packageSnippets, userSnippets];
                results1 = [];
                for (i = 0, len = ref1.length; i < len; i++) {
                  snippetSet = ref1[i];
                  results1.push((function() {
                    var results2;
                    results2 = [];
                    for (filepath in snippetSet) {
                      snippetsBySelector = snippetSet[filepath];
                      results2.push(this.add(filepath, snippetsBySelector));
                    }
                    return results2;
                  }).call(_this));
                }
                return results1;
              });
              return _this.doneLoading();
            });
          });
        };
      })(this));
    },
    loadBundledSnippets: function(callback) {
      var bundledSnippetsPath;
      bundledSnippetsPath = CSON.resolve(path.join(__dirname, 'snippets'));
      return this.loadSnippetsFile(bundledSnippetsPath, function(snippets) {
        var snippetsByPath;
        snippetsByPath = {};
        snippetsByPath[bundledSnippetsPath] = snippets;
        return callback(snippetsByPath);
      });
    },
    loadUserSnippets: function(callback) {
      var userSnippetsPath;
      userSnippetsPath = this.getUserSnippetsPath();
      return fs.stat(userSnippetsPath, (function(_this) {
        return function(error, stat) {
          if (stat != null ? stat.isFile() : void 0) {
            return _this.loadSnippetsFile(userSnippetsPath, function(snippets) {
              var result;
              result = {};
              result[userSnippetsPath] = snippets;
              return callback(result);
            });
          } else {
            return callback({});
          }
        };
      })(this));
    },
    watchUserSnippets: function(callback) {
      var userSnippetsPath;
      userSnippetsPath = this.getUserSnippetsPath();
      return fs.stat(userSnippetsPath, (function(_this) {
        return function(error, stat) {
          var e, message, userSnippetsFile, userSnippetsFileDisposable;
          if (stat != null ? stat.isFile() : void 0) {
            userSnippetsFileDisposable = new CompositeDisposable();
            userSnippetsFile = new File(userSnippetsPath);
            try {
              userSnippetsFileDisposable.add(userSnippetsFile.onDidChange(function() {
                return _this.handleUserSnippetsDidChange();
              }));
              userSnippetsFileDisposable.add(userSnippetsFile.onDidDelete(function() {
                return _this.handleUserSnippetsDidChange();
              }));
              userSnippetsFileDisposable.add(userSnippetsFile.onDidRename(function() {
                return _this.handleUserSnippetsDidChange();
              }));
            } catch (error1) {
              e = error1;
              message = "Unable to watch path: `snippets.cson`. Make sure you have permissions\nto the `~/.atom` directory and `" + userSnippetsPath + "`.\n\nOn linux there are currently problems with watch sizes. See\n[this document][watches] for more info.\n[watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path";
              atom.notifications.addError(message, {
                dismissable: true
              });
            }
            return callback(userSnippetsFileDisposable);
          } else {
            return callback(new Disposable(function() {}));
          }
        };
      })(this));
    },
    handleUserSnippetsDidChange: function() {
      var userSnippetsPath;
      userSnippetsPath = this.getUserSnippetsPath();
      return atom.config.transact((function(_this) {
        return function() {
          _this.clearSnippetsForPath(userSnippetsPath);
          return _this.loadSnippetsFile(userSnippetsPath, function(result) {
            return _this.add(userSnippetsPath, result);
          });
        };
      })(this));
    },
    loadPackageSnippets: function(callback) {
      var pack, packages, snippetsDirPaths;
      packages = atom.packages.getLoadedPackages();
      snippetsDirPaths = ((function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = packages.length; i < len; i++) {
          pack = packages[i];
          results1.push(path.join(pack.path, 'snippets'));
        }
        return results1;
      })()).sort(function(a, b) {
        if (/\/app\.asar\/node_modules\//.test(a)) {
          return -1;
        } else {
          return 1;
        }
      });
      return async.map(snippetsDirPaths, this.loadSnippetsDirectory.bind(this), function(error, results) {
        return callback(_.extend.apply(_, [{}].concat(slice.call(results))));
      });
    },
    doneLoading: function() {
      this.loaded = true;
      return this.getEmitter().emit('did-load-snippets');
    },
    onDidLoadSnippets: function(callback) {
      return this.getEmitter().on('did-load-snippets', callback);
    },
    getEmitter: function() {
      return this.emitter != null ? this.emitter : this.emitter = new Emitter;
    },
    loadSnippetsDirectory: function(snippetsDirPath, callback) {
      return fs.isDirectory(snippetsDirPath, (function(_this) {
        return function(isDirectory) {
          if (!isDirectory) {
            return callback(null, {});
          }
          return fs.readdir(snippetsDirPath, function(error, entries) {
            if (error) {
              console.warn("Error reading snippets directory " + snippetsDirPath, error);
              return callback(null, {});
            }
            return async.map(entries, function(entry, done) {
              var filePath;
              filePath = path.join(snippetsDirPath, entry);
              return _this.loadSnippetsFile(filePath, function(snippets) {
                return done(null, {
                  filePath: filePath,
                  snippets: snippets
                });
              });
            }, function(error, results) {
              var filePath, i, len, ref1, snippets, snippetsByPath;
              snippetsByPath = {};
              for (i = 0, len = results.length; i < len; i++) {
                ref1 = results[i], filePath = ref1.filePath, snippets = ref1.snippets;
                snippetsByPath[filePath] = snippets;
              }
              return callback(null, snippetsByPath);
            });
          });
        };
      })(this));
    },
    loadSnippetsFile: function(filePath, callback) {
      if (!CSON.isObjectPath(filePath)) {
        return callback({});
      }
      return CSON.readFile(filePath, function(error, object) {
        var ref1, ref2;
        if (object == null) {
          object = {};
        }
        if (error != null) {
          console.warn("Error reading snippets file '" + filePath + "': " + ((ref1 = error.stack) != null ? ref1 : error));
          if ((ref2 = atom.notifications) != null) {
            ref2.addError("Failed to load snippets from '" + filePath + "'", {
              detail: error.message,
              dismissable: true
            });
          }
        }
        return callback(object);
      });
    },
    add: function(filePath, snippetsBySelector) {
      var attributes, body, name, prefix, selector, snippetsByName, unparsedSnippetsByPrefix;
      for (selector in snippetsBySelector) {
        snippetsByName = snippetsBySelector[selector];
        unparsedSnippetsByPrefix = {};
        for (name in snippetsByName) {
          attributes = snippetsByName[name];
          prefix = attributes.prefix, body = attributes.body;
          attributes.name = name;
          attributes.id = this.snippetIdCounter++;
          if (typeof body === 'string') {
            unparsedSnippetsByPrefix[prefix] = attributes;
          } else if (body == null) {
            unparsedSnippetsByPrefix[prefix] = null;
          }
        }
        this.storeUnparsedSnippets(unparsedSnippetsByPrefix, filePath, selector);
      }
    },
    getScopeChain: function(object) {
      var scopesArray;
      scopesArray = object != null ? typeof object.getScopesArray === "function" ? object.getScopesArray() : void 0 : void 0;
      if (scopesArray == null) {
        scopesArray = object;
      }
      return scopesArray.map(function(scope) {
        if (scope[0] !== '.') {
          scope = "." + scope;
        }
        return scope;
      }).join(' ');
    },
    storeUnparsedSnippets: function(value, path, selector) {
      var unparsedSnippets;
      unparsedSnippets = {};
      unparsedSnippets[selector] = {
        "snippets": value
      };
      return this.scopedPropertyStore.addProperties(path, unparsedSnippets, {
        priority: this.priorityForSource(path)
      });
    },
    clearSnippetsForPath: function(path) {
      var attributes, prefix, ref1, results1, scopeSelector;
      results1 = [];
      for (scopeSelector in this.scopedPropertyStore.propertiesForSource(path)) {
        ref1 = this.scopedPropertyStore.propertiesForSourceAndSelector(path, scopeSelector);
        for (prefix in ref1) {
          attributes = ref1[prefix];
          this.parsedSnippetsById["delete"](attributes.id);
        }
        results1.push(this.scopedPropertyStore.removePropertiesForSourceAndSelector(path, scopeSelector));
      }
      return results1;
    },
    parsedSnippetsForScopes: function(scopeDescriptor) {
      var attributes, body, bodyTree, description, descriptionMoreURL, id, leftLabel, leftLabelHTML, name, prefix, rightLabelHTML, snippet, snippets, unparsedSnippetsByPrefix;
      unparsedSnippetsByPrefix = this.scopedPropertyStore.getPropertyValue(this.getScopeChain(scopeDescriptor), "snippets");
      if (unparsedSnippetsByPrefix == null) {
        unparsedSnippetsByPrefix = {};
      }
      snippets = {};
      for (prefix in unparsedSnippetsByPrefix) {
        attributes = unparsedSnippetsByPrefix[prefix];
        if (typeof (attributes != null ? attributes.body : void 0) !== 'string') {
          continue;
        }
        id = attributes.id, name = attributes.name, body = attributes.body, bodyTree = attributes.bodyTree, description = attributes.description, descriptionMoreURL = attributes.descriptionMoreURL, rightLabelHTML = attributes.rightLabelHTML, leftLabel = attributes.leftLabel, leftLabelHTML = attributes.leftLabelHTML;
        if (!this.parsedSnippetsById.has(id)) {
          if (bodyTree == null) {
            bodyTree = this.getBodyParser().parse(body);
          }
          snippet = new Snippet({
            id: id,
            name: name,
            prefix: prefix,
            bodyTree: bodyTree,
            description: description,
            descriptionMoreURL: descriptionMoreURL,
            rightLabelHTML: rightLabelHTML,
            leftLabel: leftLabel,
            leftLabelHTML: leftLabelHTML,
            bodyText: body
          });
          this.parsedSnippetsById.set(id, snippet);
        }
        snippets[prefix] = this.parsedSnippetsById.get(id);
      }
      return snippets;
    },
    priorityForSource: function(source) {
      if (source === this.getUserSnippetsPath()) {
        return 1000;
      } else {
        return 0;
      }
    },
    getBodyParser: function() {
      return this.bodyParser != null ? this.bodyParser : this.bodyParser = require('./snippet-body-parser');
    },
    getPrefixText: function(snippets, editor) {
      var cursor, cursorSnippetPrefix, cursorWordPrefix, i, len, position, prefixStart, ref1, ref2, snippetPrefix, wordPrefix, wordRegex, wordStart;
      wordRegex = this.wordRegexForSnippets(snippets);
      ref1 = [], snippetPrefix = ref1[0], wordPrefix = ref1[1];
      ref2 = editor.getCursors();
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        position = cursor.getBufferPosition();
        prefixStart = cursor.getBeginningOfCurrentWordBufferPosition({
          wordRegex: wordRegex
        });
        cursorSnippetPrefix = editor.getTextInRange([prefixStart, position]);
        if ((snippetPrefix != null) && cursorSnippetPrefix !== snippetPrefix) {
          return null;
        }
        snippetPrefix = cursorSnippetPrefix;
        wordStart = cursor.getBeginningOfCurrentWordBufferPosition();
        cursorWordPrefix = editor.getTextInRange([wordStart, position]);
        if ((wordPrefix != null) && cursorWordPrefix !== wordPrefix) {
          return null;
        }
        wordPrefix = cursorWordPrefix;
      }
      return {
        snippetPrefix: snippetPrefix,
        wordPrefix: wordPrefix
      };
    },
    wordRegexForSnippets: function(snippets) {
      var character, i, len, prefix, prefixCharacters, prefixes;
      prefixes = {};
      for (prefix in snippets) {
        for (i = 0, len = prefix.length; i < len; i++) {
          character = prefix[i];
          prefixes[character] = true;
        }
      }
      prefixCharacters = Object.keys(prefixes).join('');
      return new RegExp("[" + (_.escapeRegExp(prefixCharacters)) + "]+");
    },
    snippetForPrefix: function(snippets, prefix, wordPrefix) {
      var longestPrefixMatch, snippet, snippetPrefix;
      longestPrefixMatch = null;
      for (snippetPrefix in snippets) {
        snippet = snippets[snippetPrefix];
        if (_.endsWith(prefix, snippetPrefix) && wordPrefix.length <= snippetPrefix.length) {
          if ((longestPrefixMatch == null) || snippetPrefix.length > longestPrefixMatch.prefix.length) {
            longestPrefixMatch = snippet;
          }
        }
      }
      return longestPrefixMatch;
    },
    getSnippets: function(editor) {
      return this.parsedSnippetsForScopes(editor.getLastCursor().getScopeDescriptor());
    },
    snippetToExpandUnderCursor: function(editor) {
      var prefixData, snippets;
      if (!editor.getLastSelection().isEmpty()) {
        return false;
      }
      snippets = this.getSnippets(editor);
      if (_.isEmpty(snippets)) {
        return false;
      }
      if (prefixData = this.getPrefixText(snippets, editor)) {
        return this.snippetForPrefix(snippets, prefixData.snippetPrefix, prefixData.wordPrefix);
      }
    },
    expandSnippetsUnderCursors: function(editor) {
      var snippet;
      if (!(snippet = this.snippetToExpandUnderCursor(editor))) {
        return false;
      }
      editor.transact((function(_this) {
        return function() {
          var cursor, cursorPosition, cursors, i, len, results1, startPoint;
          cursors = editor.getCursors();
          results1 = [];
          for (i = 0, len = cursors.length; i < len; i++) {
            cursor = cursors[i];
            cursorPosition = cursor.getBufferPosition();
            startPoint = cursorPosition.translate([0, -snippet.prefix.length], [0, 0]);
            cursor.selection.setBufferRange([startPoint, cursorPosition]);
            results1.push(_this.insert(snippet, editor, cursor));
          }
          return results1;
        };
      })(this));
      return true;
    },
    goToNextTabStop: function(editor) {
      var expansion, i, len, nextTabStopVisited, ref1;
      nextTabStopVisited = false;
      ref1 = this.getExpansions(editor);
      for (i = 0, len = ref1.length; i < len; i++) {
        expansion = ref1[i];
        if (expansion != null ? expansion.goToNextTabStop() : void 0) {
          nextTabStopVisited = true;
        }
      }
      return nextTabStopVisited;
    },
    goToPreviousTabStop: function(editor) {
      var expansion, i, len, previousTabStopVisited, ref1;
      previousTabStopVisited = false;
      ref1 = this.getExpansions(editor);
      for (i = 0, len = ref1.length; i < len; i++) {
        expansion = ref1[i];
        if (expansion != null ? expansion.goToPreviousTabStop() : void 0) {
          previousTabStopVisited = true;
        }
      }
      return previousTabStopVisited;
    },
    getExpansions: function(editor) {
      var ref1, ref2;
      return (ref1 = (ref2 = this.editorSnippetExpansions) != null ? ref2.get(editor) : void 0) != null ? ref1 : [];
    },
    clearExpansions: function(editor) {
      if (this.editorSnippetExpansions == null) {
        this.editorSnippetExpansions = new WeakMap();
      }
      return this.editorSnippetExpansions.set(editor, []);
    },
    addExpansion: function(editor, snippetExpansion) {
      return this.getExpansions(editor).push(snippetExpansion);
    },
    insert: function(snippet, editor, cursor) {
      var bodyTree;
      if (editor == null) {
        editor = atom.workspace.getActiveTextEditor();
      }
      if (cursor == null) {
        cursor = editor.getLastCursor();
      }
      if (typeof snippet === 'string') {
        bodyTree = this.getBodyParser().parse(snippet);
        snippet = new Snippet({
          name: '__anonymous',
          prefix: '',
          bodyTree: bodyTree,
          bodyText: snippet
        });
      }
      return new SnippetExpansion(snippet, editor, cursor, this);
    },
    getUnparsedSnippets: function() {
      return _.deepClone(this.scopedPropertyStore.propertySets);
    },
    provideSnippets: function() {
      return {
        bundledSnippetsLoaded: (function(_this) {
          return function() {
            return _this.loaded;
          };
        })(this),
        insertSnippet: this.insert.bind(this),
        snippetsForScopes: this.parsedSnippetsForScopes.bind(this),
        getUnparsedSnippets: this.getUnparsedSnippets.bind(this)
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zbmlwcGV0cy9saWIvc25pcHBldHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2SEFBQTtJQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFtRCxPQUFBLENBQVEsTUFBUixDQUFuRCxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0IsNkNBQXRCLEVBQTJDOztFQUMzQyxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7RUFDUixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSx1QkFBUjs7RUFFdEIsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztFQUNWLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxxQkFBUjs7RUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFBUSxLQUFSO0lBRUEsUUFBQSxFQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBQyxDQUFBLGdCQUFELEdBQW9CO01BQ3BCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjtNQUNwQixJQUFDLENBQUEsa0JBQUQsR0FBc0IsSUFBSTtNQUMxQixJQUFDLENBQUEsbUJBQUQsR0FBdUIsSUFBSTtNQUMzQixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQWYsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7VUFDMUMsSUFBRyxHQUFBLEtBQU8sdUJBQVY7bUJBQ0UsSUFB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VUFBNEMsUUFBQSxFQUFVLE9BQXREO1NBQVIsRUFGaEI7O2FBR0ksSUFBQSxnQkFBQSxDQUFpQixPQUFqQixFQUEwQixNQUExQixFQUFrQyxNQUFsQyxFQUEwQyxJQUExQztJQUpFLENBOVRSO0lBb1VBLG1CQUFBLEVBQXFCLFNBQUE7YUFDbkIsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxJQUFDLENBQUEsbUJBQW1CLENBQUMsWUFBakM7SUFEbUIsQ0FwVXJCO0lBdVVBLGVBQUEsRUFBaUIsU0FBQTthQUNmO1FBQUEscUJBQUEsRUFBdUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUE7VUFBSjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkI7UUFDQSxhQUFBLEVBQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsSUFBYixDQURmO1FBRUEsaUJBQUEsRUFBbUIsSUFBQyxDQUFBLHVCQUF1QixDQUFDLElBQXpCLENBQThCLElBQTlCLENBRm5CO1FBR0EsbUJBQUEsRUFBcUIsSUFBQyxDQUFBLG1CQUFtQixDQUFDLElBQXJCLENBQTBCLElBQTFCLENBSHJCOztJQURlLENBdlVqQjs7QUFaRiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xue0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIEZpbGV9ID0gcmVxdWlyZSAnYXRvbSdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5hc3luYyA9IHJlcXVpcmUgJ2FzeW5jJ1xuQ1NPTiA9IHJlcXVpcmUgJ3NlYXNvbidcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcblNjb3BlZFByb3BlcnR5U3RvcmUgPSByZXF1aXJlICdzY29wZWQtcHJvcGVydHktc3RvcmUnXG5cblNuaXBwZXQgPSByZXF1aXJlICcuL3NuaXBwZXQnXG5TbmlwcGV0RXhwYW5zaW9uID0gcmVxdWlyZSAnLi9zbmlwcGV0LWV4cGFuc2lvbidcblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2FkZWQ6IGZhbHNlXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHVzZXJTbmlwcGV0c1BhdGggPSBudWxsXG4gICAgQHNuaXBwZXRJZENvdW50ZXIgPSAwXG4gICAgQHBhcnNlZFNuaXBwZXRzQnlJZCA9IG5ldyBNYXBcbiAgICBAc2NvcGVkUHJvcGVydHlTdG9yZSA9IG5ldyBTY29wZWRQcm9wZXJ0eVN0b3JlXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKHVyaSkgPT5cbiAgICAgIGlmIHVyaSBpcyAnYXRvbTovLy5hdG9tL3NuaXBwZXRzJ1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKEBnZXRVc2VyU25pcHBldHNQYXRoKCkpXG5cbiAgICBAbG9hZEFsbCgpXG4gICAgQHdhdGNoVXNlclNuaXBwZXRzICh3YXRjaERpc3Bvc2FibGUpID0+XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQod2F0Y2hEaXNwb3NhYmxlKVxuXG4gICAgc25pcHBldHMgPSB0aGlzXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ3NuaXBwZXRzOmV4cGFuZCc6IChldmVudCkgLT5cbiAgICAgICAgZWRpdG9yID0gQGdldE1vZGVsKClcbiAgICAgICAgaWYgc25pcHBldHMuc25pcHBldFRvRXhwYW5kVW5kZXJDdXJzb3IoZWRpdG9yKVxuICAgICAgICAgIHNuaXBwZXRzLmNsZWFyRXhwYW5zaW9ucyhlZGl0b3IpXG4gICAgICAgICAgc25pcHBldHMuZXhwYW5kU25pcHBldHNVbmRlckN1cnNvcnMoZWRpdG9yKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXZlbnQuYWJvcnRLZXlCaW5kaW5nKClcblxuICAgICAgJ3NuaXBwZXRzOm5leHQtdGFiLXN0b3AnOiAoZXZlbnQpIC0+XG4gICAgICAgIGVkaXRvciA9IEBnZXRNb2RlbCgpXG4gICAgICAgIGV2ZW50LmFib3J0S2V5QmluZGluZygpIHVubGVzcyBzbmlwcGV0cy5nb1RvTmV4dFRhYlN0b3AoZWRpdG9yKVxuXG4gICAgICAnc25pcHBldHM6cHJldmlvdXMtdGFiLXN0b3AnOiAoZXZlbnQpIC0+XG4gICAgICAgIGVkaXRvciA9IEBnZXRNb2RlbCgpXG4gICAgICAgIGV2ZW50LmFib3J0S2V5QmluZGluZygpIHVubGVzcyBzbmlwcGV0cy5nb1RvUHJldmlvdXNUYWJTdG9wKGVkaXRvcilcblxuICAgICAgJ3NuaXBwZXRzOmF2YWlsYWJsZSc6IChldmVudCkgLT5cbiAgICAgICAgZWRpdG9yID0gQGdldE1vZGVsKClcbiAgICAgICAgU25pcHBldHNBdmFpbGFibGUgPSByZXF1aXJlICcuL3NuaXBwZXRzLWF2YWlsYWJsZSdcbiAgICAgICAgc25pcHBldHMuYXZhaWxhYmxlU25pcHBldHNWaWV3ID89IG5ldyBTbmlwcGV0c0F2YWlsYWJsZShzbmlwcGV0cylcbiAgICAgICAgc25pcHBldHMuYXZhaWxhYmxlU25pcHBldHNWaWV3LnRvZ2dsZShlZGl0b3IpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICBAY2xlYXJFeHBhbnNpb25zKGVkaXRvcilcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBlbWl0dGVyPy5kaXNwb3NlKClcbiAgICBAZW1pdHRlciA9IG51bGxcbiAgICBAZWRpdG9yU25pcHBldEV4cGFuc2lvbnMgPSBudWxsXG4gICAgYXRvbS5jb25maWcudHJhbnNhY3QgPT4gQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgZ2V0VXNlclNuaXBwZXRzUGF0aDogLT5cbiAgICByZXR1cm4gQHVzZXJTbmlwcGV0c1BhdGggaWYgQHVzZXJTbmlwcGV0c1BhdGg/XG5cbiAgICBAdXNlclNuaXBwZXRzUGF0aCA9IENTT04ucmVzb2x2ZShwYXRoLmpvaW4oYXRvbS5nZXRDb25maWdEaXJQYXRoKCksICdzbmlwcGV0cycpKVxuICAgIEB1c2VyU25pcHBldHNQYXRoID89IHBhdGguam9pbihhdG9tLmdldENvbmZpZ0RpclBhdGgoKSwgJ3NuaXBwZXRzLmNzb24nKVxuICAgIEB1c2VyU25pcHBldHNQYXRoXG5cbiAgbG9hZEFsbDogKGNhbGxiYWNrKSAtPlxuICAgIEBsb2FkQnVuZGxlZFNuaXBwZXRzIChidW5kbGVkU25pcHBldHMpID0+XG4gICAgICBAbG9hZFBhY2thZ2VTbmlwcGV0cyAocGFja2FnZVNuaXBwZXRzKSA9PlxuICAgICAgICBAbG9hZFVzZXJTbmlwcGV0cyAodXNlclNuaXBwZXRzKSA9PlxuICAgICAgICAgIGF0b20uY29uZmlnLnRyYW5zYWN0ID0+XG4gICAgICAgICAgICBmb3Igc25pcHBldFNldCBpbiBbYnVuZGxlZFNuaXBwZXRzLCBwYWNrYWdlU25pcHBldHMsIHVzZXJTbmlwcGV0c11cbiAgICAgICAgICAgICAgZm9yIGZpbGVwYXRoLCBzbmlwcGV0c0J5U2VsZWN0b3Igb2Ygc25pcHBldFNldFxuICAgICAgICAgICAgICAgIEBhZGQoZmlsZXBhdGgsIHNuaXBwZXRzQnlTZWxlY3RvcilcbiAgICAgICAgICBAZG9uZUxvYWRpbmcoKVxuXG4gIGxvYWRCdW5kbGVkU25pcHBldHM6IChjYWxsYmFjaykgLT5cbiAgICBidW5kbGVkU25pcHBldHNQYXRoID0gQ1NPTi5yZXNvbHZlKHBhdGguam9pbihfX2Rpcm5hbWUsICdzbmlwcGV0cycpKVxuICAgIEBsb2FkU25pcHBldHNGaWxlIGJ1bmRsZWRTbmlwcGV0c1BhdGgsIChzbmlwcGV0cykgLT5cbiAgICAgIHNuaXBwZXRzQnlQYXRoID0ge31cbiAgICAgIHNuaXBwZXRzQnlQYXRoW2J1bmRsZWRTbmlwcGV0c1BhdGhdID0gc25pcHBldHNcbiAgICAgIGNhbGxiYWNrKHNuaXBwZXRzQnlQYXRoKVxuXG4gIGxvYWRVc2VyU25pcHBldHM6IChjYWxsYmFjaykgLT5cbiAgICB1c2VyU25pcHBldHNQYXRoID0gQGdldFVzZXJTbmlwcGV0c1BhdGgoKVxuICAgIGZzLnN0YXQgdXNlclNuaXBwZXRzUGF0aCwgKGVycm9yLCBzdGF0KSA9PlxuICAgICAgaWYgc3RhdD8uaXNGaWxlKClcbiAgICAgICAgQGxvYWRTbmlwcGV0c0ZpbGUgdXNlclNuaXBwZXRzUGF0aCwgKHNuaXBwZXRzKSAtPlxuICAgICAgICAgIHJlc3VsdCA9IHt9XG4gICAgICAgICAgcmVzdWx0W3VzZXJTbmlwcGV0c1BhdGhdID0gc25pcHBldHNcbiAgICAgICAgICBjYWxsYmFjayhyZXN1bHQpXG4gICAgICBlbHNlXG4gICAgICAgIGNhbGxiYWNrKHt9KVxuXG4gIHdhdGNoVXNlclNuaXBwZXRzOiAoY2FsbGJhY2spIC0+XG4gICAgdXNlclNuaXBwZXRzUGF0aCA9IEBnZXRVc2VyU25pcHBldHNQYXRoKClcbiAgICBmcy5zdGF0IHVzZXJTbmlwcGV0c1BhdGgsIChlcnJvciwgc3RhdCkgPT5cbiAgICAgIGlmIHN0YXQ/LmlzRmlsZSgpXG4gICAgICAgIHVzZXJTbmlwcGV0c0ZpbGVEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgICAgICB1c2VyU25pcHBldHNGaWxlID0gbmV3IEZpbGUodXNlclNuaXBwZXRzUGF0aClcbiAgICAgICAgdHJ5XG4gICAgICAgICAgdXNlclNuaXBwZXRzRmlsZURpc3Bvc2FibGUuYWRkIHVzZXJTbmlwcGV0c0ZpbGUub25EaWRDaGFuZ2UgPT4gQGhhbmRsZVVzZXJTbmlwcGV0c0RpZENoYW5nZSgpXG4gICAgICAgICAgdXNlclNuaXBwZXRzRmlsZURpc3Bvc2FibGUuYWRkIHVzZXJTbmlwcGV0c0ZpbGUub25EaWREZWxldGUgPT4gQGhhbmRsZVVzZXJTbmlwcGV0c0RpZENoYW5nZSgpXG4gICAgICAgICAgdXNlclNuaXBwZXRzRmlsZURpc3Bvc2FibGUuYWRkIHVzZXJTbmlwcGV0c0ZpbGUub25EaWRSZW5hbWUgPT4gQGhhbmRsZVVzZXJTbmlwcGV0c0RpZENoYW5nZSgpXG4gICAgICAgIGNhdGNoIGVcbiAgICAgICAgICBtZXNzYWdlID0gXCJcIlwiXG4gICAgICAgICAgICBVbmFibGUgdG8gd2F0Y2ggcGF0aDogYHNuaXBwZXRzLmNzb25gLiBNYWtlIHN1cmUgeW91IGhhdmUgcGVybWlzc2lvbnNcbiAgICAgICAgICAgIHRvIHRoZSBgfi8uYXRvbWAgZGlyZWN0b3J5IGFuZCBgI3t1c2VyU25pcHBldHNQYXRofWAuXG5cbiAgICAgICAgICAgIE9uIGxpbnV4IHRoZXJlIGFyZSBjdXJyZW50bHkgcHJvYmxlbXMgd2l0aCB3YXRjaCBzaXplcy4gU2VlXG4gICAgICAgICAgICBbdGhpcyBkb2N1bWVudF1bd2F0Y2hlc10gZm9yIG1vcmUgaW5mby5cbiAgICAgICAgICAgIFt3YXRjaGVzXTpodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2Jsb2IvbWFzdGVyL2RvY3MvYnVpbGQtaW5zdHJ1Y3Rpb25zL2xpbnV4Lm1kI3R5cGVlcnJvci11bmFibGUtdG8td2F0Y2gtcGF0aFxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCB7ZGlzbWlzc2FibGU6IHRydWV9KVxuXG4gICAgICAgIGNhbGxiYWNrKHVzZXJTbmlwcGV0c0ZpbGVEaXNwb3NhYmxlKVxuICAgICAgZWxzZVxuICAgICAgICBjYWxsYmFjayhuZXcgRGlzcG9zYWJsZSAtPiApXG5cbiAgaGFuZGxlVXNlclNuaXBwZXRzRGlkQ2hhbmdlOiAtPlxuICAgIHVzZXJTbmlwcGV0c1BhdGggPSBAZ2V0VXNlclNuaXBwZXRzUGF0aCgpXG4gICAgYXRvbS5jb25maWcudHJhbnNhY3QgPT5cbiAgICAgIEBjbGVhclNuaXBwZXRzRm9yUGF0aCh1c2VyU25pcHBldHNQYXRoKVxuICAgICAgQGxvYWRTbmlwcGV0c0ZpbGUgdXNlclNuaXBwZXRzUGF0aCwgKHJlc3VsdCkgPT5cbiAgICAgICAgQGFkZCh1c2VyU25pcHBldHNQYXRoLCByZXN1bHQpXG5cbiAgbG9hZFBhY2thZ2VTbmlwcGV0czogKGNhbGxiYWNrKSAtPlxuICAgIHBhY2thZ2VzID0gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlcygpXG4gICAgc25pcHBldHNEaXJQYXRocyA9IChwYXRoLmpvaW4ocGFjay5wYXRoLCAnc25pcHBldHMnKSBmb3IgcGFjayBpbiBwYWNrYWdlcykuc29ydCAoYSwgYikgLT5cbiAgICAgIGlmIC9cXC9hcHBcXC5hc2FyXFwvbm9kZV9tb2R1bGVzXFwvLy50ZXN0KGEpIHRoZW4gLTEgZWxzZSAxXG4gICAgYXN5bmMubWFwIHNuaXBwZXRzRGlyUGF0aHMsIEBsb2FkU25pcHBldHNEaXJlY3RvcnkuYmluZCh0aGlzKSwgKGVycm9yLCByZXN1bHRzKSAtPlxuICAgICAgY2FsbGJhY2soXy5leHRlbmQoe30sIHJlc3VsdHMuLi4pKVxuXG4gIGRvbmVMb2FkaW5nOiAtPlxuICAgIEBsb2FkZWQgPSB0cnVlXG4gICAgQGdldEVtaXR0ZXIoKS5lbWl0ICdkaWQtbG9hZC1zbmlwcGV0cydcblxuICBvbkRpZExvYWRTbmlwcGV0czogKGNhbGxiYWNrKSAtPlxuICAgIEBnZXRFbWl0dGVyKCkub24gJ2RpZC1sb2FkLXNuaXBwZXRzJywgY2FsbGJhY2tcblxuICBnZXRFbWl0dGVyOiAtPlxuICAgIEBlbWl0dGVyID89IG5ldyBFbWl0dGVyXG5cbiAgbG9hZFNuaXBwZXRzRGlyZWN0b3J5OiAoc25pcHBldHNEaXJQYXRoLCBjYWxsYmFjaykgLT5cbiAgICBmcy5pc0RpcmVjdG9yeSBzbmlwcGV0c0RpclBhdGgsIChpc0RpcmVjdG9yeSkgPT5cbiAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSkgdW5sZXNzIGlzRGlyZWN0b3J5XG5cbiAgICAgIGZzLnJlYWRkaXIgc25pcHBldHNEaXJQYXRoLCAoZXJyb3IsIGVudHJpZXMpID0+XG4gICAgICAgIGlmIGVycm9yXG4gICAgICAgICAgY29uc29sZS53YXJuKFwiRXJyb3IgcmVhZGluZyBzbmlwcGV0cyBkaXJlY3RvcnkgI3tzbmlwcGV0c0RpclBhdGh9XCIsIGVycm9yKVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSlcblxuICAgICAgICBhc3luYy5tYXAoXG4gICAgICAgICAgZW50cmllcyxcbiAgICAgICAgICAoZW50cnksIGRvbmUpICA9PlxuICAgICAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4oc25pcHBldHNEaXJQYXRoLCBlbnRyeSlcbiAgICAgICAgICAgIEBsb2FkU25pcHBldHNGaWxlIGZpbGVQYXRoLCAoc25pcHBldHMpIC0+XG4gICAgICAgICAgICAgIGRvbmUobnVsbCwge2ZpbGVQYXRoLCBzbmlwcGV0c30pXG4gICAgICAgICAgKGVycm9yLCByZXN1bHRzKSAtPlxuICAgICAgICAgICAgc25pcHBldHNCeVBhdGggPSB7fVxuICAgICAgICAgICAgZm9yIHtmaWxlUGF0aCwgc25pcHBldHN9IGluIHJlc3VsdHNcbiAgICAgICAgICAgICAgc25pcHBldHNCeVBhdGhbZmlsZVBhdGhdID0gc25pcHBldHNcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHNuaXBwZXRzQnlQYXRoKVxuICAgICAgICApXG5cbiAgbG9hZFNuaXBwZXRzRmlsZTogKGZpbGVQYXRoLCBjYWxsYmFjaykgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soe30pIHVubGVzcyBDU09OLmlzT2JqZWN0UGF0aChmaWxlUGF0aClcbiAgICBDU09OLnJlYWRGaWxlIGZpbGVQYXRoLCAoZXJyb3IsIG9iamVjdD17fSkgLT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBjb25zb2xlLndhcm4gXCJFcnJvciByZWFkaW5nIHNuaXBwZXRzIGZpbGUgJyN7ZmlsZVBhdGh9JzogI3tlcnJvci5zdGFjayA/IGVycm9yfVwiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucz8uYWRkRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCBzbmlwcGV0cyBmcm9tICcje2ZpbGVQYXRofSdcIiwge2RldGFpbDogZXJyb3IubWVzc2FnZSwgZGlzbWlzc2FibGU6IHRydWV9KVxuICAgICAgY2FsbGJhY2sob2JqZWN0KVxuXG4gIGFkZDogKGZpbGVQYXRoLCBzbmlwcGV0c0J5U2VsZWN0b3IpIC0+XG4gICAgZm9yIHNlbGVjdG9yLCBzbmlwcGV0c0J5TmFtZSBvZiBzbmlwcGV0c0J5U2VsZWN0b3JcbiAgICAgIHVucGFyc2VkU25pcHBldHNCeVByZWZpeCA9IHt9XG4gICAgICBmb3IgbmFtZSwgYXR0cmlidXRlcyBvZiBzbmlwcGV0c0J5TmFtZVxuICAgICAgICB7cHJlZml4LCBib2R5fSA9IGF0dHJpYnV0ZXNcbiAgICAgICAgYXR0cmlidXRlcy5uYW1lID0gbmFtZVxuICAgICAgICBhdHRyaWJ1dGVzLmlkID0gQHNuaXBwZXRJZENvdW50ZXIrK1xuICAgICAgICBpZiB0eXBlb2YgYm9keSBpcyAnc3RyaW5nJ1xuICAgICAgICAgIHVucGFyc2VkU25pcHBldHNCeVByZWZpeFtwcmVmaXhdID0gYXR0cmlidXRlc1xuICAgICAgICBlbHNlIGlmIG5vdCBib2R5P1xuICAgICAgICAgIHVucGFyc2VkU25pcHBldHNCeVByZWZpeFtwcmVmaXhdID0gbnVsbFxuXG4gICAgICBAc3RvcmVVbnBhcnNlZFNuaXBwZXRzKHVucGFyc2VkU25pcHBldHNCeVByZWZpeCwgZmlsZVBhdGgsIHNlbGVjdG9yKVxuICAgIHJldHVyblxuXG4gIGdldFNjb3BlQ2hhaW46IChvYmplY3QpIC0+XG4gICAgc2NvcGVzQXJyYXkgPSBvYmplY3Q/LmdldFNjb3Blc0FycmF5PygpXG4gICAgc2NvcGVzQXJyYXkgPz0gb2JqZWN0XG4gICAgc2NvcGVzQXJyYXlcbiAgICAgIC5tYXAgKHNjb3BlKSAtPlxuICAgICAgICBzY29wZSA9IFwiLiN7c2NvcGV9XCIgdW5sZXNzIHNjb3BlWzBdIGlzICcuJ1xuICAgICAgICBzY29wZVxuICAgICAgLmpvaW4oJyAnKVxuXG4gIHN0b3JlVW5wYXJzZWRTbmlwcGV0czogKHZhbHVlLCBwYXRoLCBzZWxlY3RvcikgLT5cbiAgICB1bnBhcnNlZFNuaXBwZXRzID0ge31cbiAgICB1bnBhcnNlZFNuaXBwZXRzW3NlbGVjdG9yXSA9IHtcInNuaXBwZXRzXCI6IHZhbHVlfVxuICAgIEBzY29wZWRQcm9wZXJ0eVN0b3JlLmFkZFByb3BlcnRpZXMocGF0aCwgdW5wYXJzZWRTbmlwcGV0cywgcHJpb3JpdHk6IEBwcmlvcml0eUZvclNvdXJjZShwYXRoKSlcblxuICBjbGVhclNuaXBwZXRzRm9yUGF0aDogKHBhdGgpIC0+XG4gICAgZm9yIHNjb3BlU2VsZWN0b3Igb2YgQHNjb3BlZFByb3BlcnR5U3RvcmUucHJvcGVydGllc0ZvclNvdXJjZShwYXRoKVxuICAgICAgZm9yIHByZWZpeCwgYXR0cmlidXRlcyBvZiBAc2NvcGVkUHJvcGVydHlTdG9yZS5wcm9wZXJ0aWVzRm9yU291cmNlQW5kU2VsZWN0b3IocGF0aCwgc2NvcGVTZWxlY3RvcilcbiAgICAgICAgQHBhcnNlZFNuaXBwZXRzQnlJZC5kZWxldGUoYXR0cmlidXRlcy5pZClcblxuICAgICAgQHNjb3BlZFByb3BlcnR5U3RvcmUucmVtb3ZlUHJvcGVydGllc0ZvclNvdXJjZUFuZFNlbGVjdG9yKHBhdGgsIHNjb3BlU2VsZWN0b3IpXG5cbiAgcGFyc2VkU25pcHBldHNGb3JTY29wZXM6IChzY29wZURlc2NyaXB0b3IpIC0+XG4gICAgdW5wYXJzZWRTbmlwcGV0c0J5UHJlZml4ID0gQHNjb3BlZFByb3BlcnR5U3RvcmUuZ2V0UHJvcGVydHlWYWx1ZShAZ2V0U2NvcGVDaGFpbihzY29wZURlc2NyaXB0b3IpLCBcInNuaXBwZXRzXCIpXG4gICAgdW5wYXJzZWRTbmlwcGV0c0J5UHJlZml4ID89IHt9XG4gICAgc25pcHBldHMgPSB7fVxuICAgIGZvciBwcmVmaXgsIGF0dHJpYnV0ZXMgb2YgdW5wYXJzZWRTbmlwcGV0c0J5UHJlZml4XG4gICAgICBjb250aW51ZSBpZiB0eXBlb2YgYXR0cmlidXRlcz8uYm9keSBpc250ICdzdHJpbmcnXG5cbiAgICAgIHtpZCwgbmFtZSwgYm9keSwgYm9keVRyZWUsIGRlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbk1vcmVVUkwsIHJpZ2h0TGFiZWxIVE1MLCBsZWZ0TGFiZWwsIGxlZnRMYWJlbEhUTUx9ID0gYXR0cmlidXRlc1xuXG4gICAgICB1bmxlc3MgQHBhcnNlZFNuaXBwZXRzQnlJZC5oYXMoaWQpXG4gICAgICAgIGJvZHlUcmVlID89IEBnZXRCb2R5UGFyc2VyKCkucGFyc2UoYm9keSlcbiAgICAgICAgc25pcHBldCA9IG5ldyBTbmlwcGV0KHtpZCwgbmFtZSwgcHJlZml4LCBib2R5VHJlZSwgZGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uTW9yZVVSTCwgcmlnaHRMYWJlbEhUTUwsIGxlZnRMYWJlbCwgbGVmdExhYmVsSFRNTCwgYm9keVRleHQ6IGJvZHl9KVxuICAgICAgICBAcGFyc2VkU25pcHBldHNCeUlkLnNldChpZCwgc25pcHBldClcblxuICAgICAgc25pcHBldHNbcHJlZml4XSA9IEBwYXJzZWRTbmlwcGV0c0J5SWQuZ2V0KGlkKVxuICAgIHNuaXBwZXRzXG5cbiAgcHJpb3JpdHlGb3JTb3VyY2U6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlIGlzIEBnZXRVc2VyU25pcHBldHNQYXRoKClcbiAgICAgIDEwMDBcbiAgICBlbHNlXG4gICAgICAwXG5cbiAgZ2V0Qm9keVBhcnNlcjogLT5cbiAgICBAYm9keVBhcnNlciA/PSByZXF1aXJlICcuL3NuaXBwZXQtYm9keS1wYXJzZXInXG5cbiAgIyBHZXQgYW4ge09iamVjdH0gd2l0aCB0aGVzZSBrZXlzOlxuICAjICogYHNuaXBwZXRQcmVmaXhgOiB0aGUgcG9zc2libGUgc25pcHBldCBwcmVmaXggdGV4dCBwcmVjZWRpbmcgdGhlIGN1cnNvclxuICAjICogYHdvcmRQcmVmaXhgOiB0aGUgd29yZCBwcmVjZWRpbmcgdGhlIGN1cnNvclxuICAjXG4gICMgUmV0dXJucyBgbnVsbGAgaWYgdGhlIHZhbHVlcyBhcmVuJ3QgdGhlIHNhbWUgZm9yIGFsbCBjdXJzb3JzXG4gIGdldFByZWZpeFRleHQ6IChzbmlwcGV0cywgZWRpdG9yKSAtPlxuICAgIHdvcmRSZWdleCA9IEB3b3JkUmVnZXhGb3JTbmlwcGV0cyhzbmlwcGV0cylcbiAgICBbc25pcHBldFByZWZpeCwgd29yZFByZWZpeF0gPSBbXVxuXG4gICAgZm9yIGN1cnNvciBpbiBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICBwb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIHByZWZpeFN0YXJ0ID0gY3Vyc29yLmdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7d29yZFJlZ2V4fSlcbiAgICAgIGN1cnNvclNuaXBwZXRQcmVmaXggPSBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW3ByZWZpeFN0YXJ0LCBwb3NpdGlvbl0pXG4gICAgICByZXR1cm4gbnVsbCBpZiBzbmlwcGV0UHJlZml4PyBhbmQgY3Vyc29yU25pcHBldFByZWZpeCBpc250IHNuaXBwZXRQcmVmaXhcbiAgICAgIHNuaXBwZXRQcmVmaXggPSBjdXJzb3JTbmlwcGV0UHJlZml4XG5cbiAgICAgIHdvcmRTdGFydCA9IGN1cnNvci5nZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oKVxuICAgICAgY3Vyc29yV29yZFByZWZpeCA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbd29yZFN0YXJ0LCBwb3NpdGlvbl0pXG4gICAgICByZXR1cm4gbnVsbCBpZiB3b3JkUHJlZml4PyBhbmQgY3Vyc29yV29yZFByZWZpeCBpc250IHdvcmRQcmVmaXhcbiAgICAgIHdvcmRQcmVmaXggPSBjdXJzb3JXb3JkUHJlZml4XG5cbiAgICB7c25pcHBldFByZWZpeCwgd29yZFByZWZpeH1cblxuICAjIEdldCBhIFJlZ0V4cCBvZiBhbGwgdGhlIGNoYXJhY3RlcnMgdXNlZCBpbiB0aGUgc25pcHBldCBwcmVmaXhlc1xuICB3b3JkUmVnZXhGb3JTbmlwcGV0czogKHNuaXBwZXRzKSAtPlxuICAgIHByZWZpeGVzID0ge31cblxuICAgIGZvciBwcmVmaXggb2Ygc25pcHBldHNcbiAgICAgIHByZWZpeGVzW2NoYXJhY3Rlcl0gPSB0cnVlIGZvciBjaGFyYWN0ZXIgaW4gcHJlZml4XG4gICAgcHJlZml4Q2hhcmFjdGVycyA9IE9iamVjdC5rZXlzKHByZWZpeGVzKS5qb2luKCcnKVxuICAgIG5ldyBSZWdFeHAoXCJbI3tfLmVzY2FwZVJlZ0V4cChwcmVmaXhDaGFyYWN0ZXJzKX1dK1wiKVxuXG4gICMgR2V0IHRoZSBiZXN0IG1hdGNoIHNuaXBwZXQgZm9yIHRoZSBnaXZlbiBwcmVmaXggdGV4dC4gIFRoaXMgd2lsbCByZXR1cm5cbiAgIyB0aGUgbG9uZ2VzdCBtYXRjaCB3aGVyZSB0aGVyZSBpcyBubyBleGFjdCBtYXRjaCB0byB0aGUgcHJlZml4IHRleHQuXG4gIHNuaXBwZXRGb3JQcmVmaXg6IChzbmlwcGV0cywgcHJlZml4LCB3b3JkUHJlZml4KSAtPlxuICAgIGxvbmdlc3RQcmVmaXhNYXRjaCA9IG51bGxcblxuICAgIGZvciBzbmlwcGV0UHJlZml4LCBzbmlwcGV0IG9mIHNuaXBwZXRzXG4gICAgICBpZiBfLmVuZHNXaXRoKHByZWZpeCwgc25pcHBldFByZWZpeCkgYW5kIHdvcmRQcmVmaXgubGVuZ3RoIDw9IHNuaXBwZXRQcmVmaXgubGVuZ3RoXG4gICAgICAgIGlmIG5vdCBsb25nZXN0UHJlZml4TWF0Y2g/IG9yIHNuaXBwZXRQcmVmaXgubGVuZ3RoID4gbG9uZ2VzdFByZWZpeE1hdGNoLnByZWZpeC5sZW5ndGhcbiAgICAgICAgICBsb25nZXN0UHJlZml4TWF0Y2ggPSBzbmlwcGV0XG5cbiAgICBsb25nZXN0UHJlZml4TWF0Y2hcblxuICBnZXRTbmlwcGV0czogKGVkaXRvcikgLT5cbiAgICBAcGFyc2VkU25pcHBldHNGb3JTY29wZXMoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRTY29wZURlc2NyaXB0b3IoKSlcblxuICBzbmlwcGV0VG9FeHBhbmRVbmRlckN1cnNvcjogKGVkaXRvcikgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkuaXNFbXB0eSgpXG4gICAgc25pcHBldHMgPSBAZ2V0U25pcHBldHMoZWRpdG9yKVxuICAgIHJldHVybiBmYWxzZSBpZiBfLmlzRW1wdHkoc25pcHBldHMpXG5cbiAgICBpZiBwcmVmaXhEYXRhID0gQGdldFByZWZpeFRleHQoc25pcHBldHMsIGVkaXRvcilcbiAgICAgIEBzbmlwcGV0Rm9yUHJlZml4KHNuaXBwZXRzLCBwcmVmaXhEYXRhLnNuaXBwZXRQcmVmaXgsIHByZWZpeERhdGEud29yZFByZWZpeClcblxuICBleHBhbmRTbmlwcGV0c1VuZGVyQ3Vyc29yczogKGVkaXRvcikgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHNuaXBwZXQgPSBAc25pcHBldFRvRXhwYW5kVW5kZXJDdXJzb3IoZWRpdG9yKVxuXG4gICAgZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBjdXJzb3JzID0gZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgZm9yIGN1cnNvciBpbiBjdXJzb3JzXG4gICAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgc3RhcnRQb2ludCA9IGN1cnNvclBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgLXNuaXBwZXQucHJlZml4Lmxlbmd0aF0sIFswLCAwXSlcbiAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbc3RhcnRQb2ludCwgY3Vyc29yUG9zaXRpb25dKVxuICAgICAgICBAaW5zZXJ0KHNuaXBwZXQsIGVkaXRvciwgY3Vyc29yKVxuICAgIHRydWVcblxuICBnb1RvTmV4dFRhYlN0b3A6IChlZGl0b3IpIC0+XG4gICAgbmV4dFRhYlN0b3BWaXNpdGVkID0gZmFsc2VcbiAgICBmb3IgZXhwYW5zaW9uIGluIEBnZXRFeHBhbnNpb25zKGVkaXRvcilcbiAgICAgIGlmIGV4cGFuc2lvbj8uZ29Ub05leHRUYWJTdG9wKClcbiAgICAgICAgbmV4dFRhYlN0b3BWaXNpdGVkID0gdHJ1ZVxuICAgIG5leHRUYWJTdG9wVmlzaXRlZFxuXG4gIGdvVG9QcmV2aW91c1RhYlN0b3A6IChlZGl0b3IpIC0+XG4gICAgcHJldmlvdXNUYWJTdG9wVmlzaXRlZCA9IGZhbHNlXG4gICAgZm9yIGV4cGFuc2lvbiBpbiBAZ2V0RXhwYW5zaW9ucyhlZGl0b3IpXG4gICAgICBpZiBleHBhbnNpb24/LmdvVG9QcmV2aW91c1RhYlN0b3AoKVxuICAgICAgICBwcmV2aW91c1RhYlN0b3BWaXNpdGVkID0gdHJ1ZVxuICAgIHByZXZpb3VzVGFiU3RvcFZpc2l0ZWRcblxuICBnZXRFeHBhbnNpb25zOiAoZWRpdG9yKSAtPlxuICAgIEBlZGl0b3JTbmlwcGV0RXhwYW5zaW9ucz8uZ2V0KGVkaXRvcikgPyBbXVxuXG4gIGNsZWFyRXhwYW5zaW9uczogKGVkaXRvcikgLT5cbiAgICBAZWRpdG9yU25pcHBldEV4cGFuc2lvbnMgPz0gbmV3IFdlYWtNYXAoKVxuICAgIEBlZGl0b3JTbmlwcGV0RXhwYW5zaW9ucy5zZXQoZWRpdG9yLCBbXSlcblxuICBhZGRFeHBhbnNpb246IChlZGl0b3IsIHNuaXBwZXRFeHBhbnNpb24pIC0+XG4gICAgQGdldEV4cGFuc2lvbnMoZWRpdG9yKS5wdXNoKHNuaXBwZXRFeHBhbnNpb24pXG5cbiAgaW5zZXJ0OiAoc25pcHBldCwgZWRpdG9yPWF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSwgY3Vyc29yPWVkaXRvci5nZXRMYXN0Q3Vyc29yKCkpIC0+XG4gICAgaWYgdHlwZW9mIHNuaXBwZXQgaXMgJ3N0cmluZydcbiAgICAgIGJvZHlUcmVlID0gQGdldEJvZHlQYXJzZXIoKS5wYXJzZShzbmlwcGV0KVxuICAgICAgc25pcHBldCA9IG5ldyBTbmlwcGV0KHtuYW1lOiAnX19hbm9ueW1vdXMnLCBwcmVmaXg6ICcnLCBib2R5VHJlZSwgYm9keVRleHQ6IHNuaXBwZXR9KVxuICAgIG5ldyBTbmlwcGV0RXhwYW5zaW9uKHNuaXBwZXQsIGVkaXRvciwgY3Vyc29yLCB0aGlzKVxuXG4gIGdldFVucGFyc2VkU25pcHBldHM6IC0+XG4gICAgXy5kZWVwQ2xvbmUoQHNjb3BlZFByb3BlcnR5U3RvcmUucHJvcGVydHlTZXRzKVxuXG4gIHByb3ZpZGVTbmlwcGV0czogLT5cbiAgICBidW5kbGVkU25pcHBldHNMb2FkZWQ6ID0+IEBsb2FkZWRcbiAgICBpbnNlcnRTbmlwcGV0OiBAaW5zZXJ0LmJpbmQodGhpcylcbiAgICBzbmlwcGV0c0ZvclNjb3BlczogQHBhcnNlZFNuaXBwZXRzRm9yU2NvcGVzLmJpbmQodGhpcylcbiAgICBnZXRVbnBhcnNlZFNuaXBwZXRzOiBAZ2V0VW5wYXJzZWRTbmlwcGV0cy5iaW5kKHRoaXMpXG4iXX0=
