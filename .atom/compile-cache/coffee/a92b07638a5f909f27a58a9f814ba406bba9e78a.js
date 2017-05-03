(function() {
  var $, $$, CompositeDisposable, DeprecationCopView, Disposable, Grim, ScrollView, _, fs, marked, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, $$ = ref1.$$, ScrollView = ref1.ScrollView;

  path = require('path');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Grim = require('grim');

  marked = require('marked');

  module.exports = DeprecationCopView = (function(superClass) {
    extend(DeprecationCopView, superClass);

    function DeprecationCopView() {
      this.handleGrimUpdated = bind(this.handleGrimUpdated, this);
      return DeprecationCopView.__super__.constructor.apply(this, arguments);
    }

    DeprecationCopView.content = function() {
      return this.div({
        "class": 'deprecation-cop pane-item native-key-bindings',
        tabindex: -1
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'panel'
          }, function() {
            _this.div({
              "class": 'padded deprecation-overview'
            }, function() {
              return _this.div({
                "class": 'pull-right btn-group'
              }, function() {
                return _this.button({
                  "class": 'btn btn-primary check-for-update'
                }, 'Check for Updates');
              });
            });
            _this.div({
              "class": 'panel-heading'
            }, function() {
              return _this.span("Deprecated calls");
            });
            _this.ul({
              outlet: 'list',
              "class": 'list-tree has-collapsable-children'
            });
            _this.div({
              "class": 'panel-heading'
            }, function() {
              return _this.span("Deprecated selectors");
            });
            return _this.ul({
              outlet: 'selectorList',
              "class": 'selectors list-tree has-collapsable-children'
            });
          });
        };
      })(this));
    };

    DeprecationCopView.prototype.initialize = function(arg) {
      this.uri = arg.uri;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(Grim.on('updated', this.handleGrimUpdated));
      if (atom.styles.onDidUpdateDeprecations != null) {
        this.subscriptions.add(atom.styles.onDidUpdateDeprecations((function(_this) {
          return function() {
            return _this.updateSelectors();
          };
        })(this)));
      }
      return this.debouncedUpdateCalls = _.debounce(this.updateCalls, 1000);
    };

    DeprecationCopView.prototype.attached = function() {
      this.updateCalls();
      this.updateSelectors();
      return this.subscribeToEvents();
    };

    DeprecationCopView.prototype.subscribeToEvents = function() {
      var self;
      if (this.subscribedToEvents) {
        return;
      }
      self = this;
      this.on('click', '.deprecation-info', function() {
        return $(this).parent().toggleClass('collapsed');
      });
      this.on('click', '.check-for-update', function() {
        atom.workspace.open('atom://config/updates');
        return false;
      });
      this.on('click', '.disable-package', function() {
        if (this.dataset.packageName) {
          atom.packages.disablePackage(this.dataset.packageName);
        }
        return false;
      });
      this.on('click', '.stack-line-location, .source-url', function() {
        var pathToOpen;
        pathToOpen = this.href.replace('file://', '');
        if (process.platform === 'win32') {
          pathToOpen = pathToOpen.replace(/^\//, '');
        }
        return atom.open({
          pathsToOpen: [pathToOpen]
        });
      });
      this.on('click', '.issue-url', function() {
        self.openIssueUrl(this.dataset.repoUrl, this.dataset.issueUrl, this.dataset.issueTitle);
        return false;
      });
      return this.subscribedToEvents = true;
    };

    DeprecationCopView.prototype.findSimilarIssues = function(repoUrl, issueTitle) {
      var query, repo, url;
      url = "https://api.github.com/search/issues";
      repo = repoUrl.replace(/http(s)?:\/\/(\d+\.)?github.com\//gi, '');
      query = issueTitle + " repo:" + repo;
      return new Promise(function(resolve, reject) {
        return $.ajax(url + "?q=" + (encodeURI(query)) + "&sort=created", {
          accept: 'application/vnd.github.v3+json',
          contentType: 'application/json',
          success: function(data) {
            var issue, issues, j, len, ref2;
            if (data.items != null) {
              issues = {};
              ref2 = data.items;
              for (j = 0, len = ref2.length; j < len; j++) {
                issue = ref2[j];
                if (issue.title.indexOf(issueTitle) > -1 && (issues[issue.state] == null)) {
                  issues[issue.state] = issue;
                }
              }
              if ((issues.open != null) || (issues.closed != null)) {
                return resolve(issues);
              }
            }
            return resolve(null);
          },
          error: function() {
            return resolve(null);
          }
        });
      });
    };

    DeprecationCopView.prototype.openIssueUrl = function(repoUrl, issueUrl, issueTitle) {
      var openExternally;
      openExternally = function(urlToOpen) {
        return require('shell').openExternal(urlToOpen);
      };
      return this.findSimilarIssues(repoUrl, issueTitle).then(function(issues) {
        var issue;
        if ((issues != null ? issues.open : void 0) || (issues != null ? issues.closed : void 0)) {
          issue = issues.open || issues.closed;
          return openExternally(issue.html_url);
        } else if (process.platform === 'win32') {
          return $.ajax('http://git.io', {
            type: 'POST',
            data: {
              url: issueUrl
            },
            success: function(data, status, xhr) {
              return openExternally(xhr.getResponseHeader('Location'));
            },
            error: function() {
              return openExternally(issueUrl);
            }
          });
        } else {
          return openExternally(issueUrl);
        }
      });
    };

    DeprecationCopView.prototype.destroy = function() {
      this.subscriptions.dispose();
      return this.detach();
    };

    DeprecationCopView.prototype.serialize = function() {
      return {
        deserializer: this.constructor.name,
        uri: this.getURI(),
        version: 1
      };
    };

    DeprecationCopView.prototype.handleGrimUpdated = function() {
      return this.debouncedUpdateCalls();
    };

    DeprecationCopView.prototype.getURI = function() {
      return this.uri;
    };

    DeprecationCopView.prototype.getTitle = function() {
      return 'Deprecation Cop';
    };

    DeprecationCopView.prototype.getIconName = function() {
      return 'alert';
    };

    DeprecationCopView.prototype.onDidChangeTitle = function() {
      return new Disposable;
    };

    DeprecationCopView.prototype.onDidChangeModified = function() {
      return new Disposable;
    };

    DeprecationCopView.prototype.getPackagePathsByPackageName = function() {
      var j, len, pack, ref2;
      if (this.packagePathsByPackageName != null) {
        return this.packagePathsByPackageName;
      }
      this.packagePathsByPackageName = {};
      ref2 = atom.packages.getLoadedPackages();
      for (j = 0, len = ref2.length; j < len; j++) {
        pack = ref2[j];
        this.packagePathsByPackageName[pack.name] = pack.path;
      }
      return this.packagePathsByPackageName;
    };

    DeprecationCopView.prototype.getPackageName = function(stack) {
      var fileName, i, j, packageName, packagePath, packagePaths, ref2, relativePath;
      packagePaths = this.getPackagePathsByPackageName();
      for (packageName in packagePaths) {
        packagePath = packagePaths[packageName];
        if (packagePath.indexOf('.atom/dev/packages') > -1 || packagePath.indexOf('.atom/packages') > -1) {
          packagePaths[packageName] = fs.absolute(packagePath);
        }
      }
      for (i = j = 1, ref2 = stack.length; 1 <= ref2 ? j < ref2 : j > ref2; i = 1 <= ref2 ? ++j : --j) {
        fileName = stack[i].fileName;
        if (!fileName) {
          return;
        }
        if (fileName.includes(path.sep + "node_modules" + path.sep)) {
          continue;
        }
        for (packageName in packagePaths) {
          packagePath = packagePaths[packageName];
          relativePath = path.relative(packagePath, fileName);
          if (!/^\.\./.test(relativePath)) {
            return packageName;
          }
        }
        if (atom.getUserInitScriptPath() === fileName) {
          return "Your local " + (path.basename(fileName)) + " file";
        }
      }
    };

    DeprecationCopView.prototype.getRepoUrl = function(packageName) {
      var ref2, ref3, ref4, repo, repoUrl;
      if (!(repo = (ref2 = atom.packages.getLoadedPackage(packageName)) != null ? (ref3 = ref2.metadata) != null ? ref3.repository : void 0 : void 0)) {
        return;
      }
      repoUrl = (ref4 = repo.url) != null ? ref4 : repo;
      return repoUrl.replace(/\.git$/, '');
    };

    DeprecationCopView.prototype.createIssueUrl = function(packageName, deprecation, stack) {
      var body, repoUrl, stacktrace, title;
      repoUrl = this.getRepoUrl(packageName);
      if (!repoUrl) {
        return;
      }
      title = (deprecation.getOriginName()) + " is deprecated.";
      stacktrace = stack.map(function(arg) {
        var functionName, location;
        functionName = arg.functionName, location = arg.location;
        return functionName + " (" + location + ")";
      }).join("\n");
      body = (deprecation.getMessage()) + "\n```\n" + stacktrace + "\n```";
      return repoUrl + "/issues/new?title=" + (encodeURI(title)) + "&body=" + (encodeURI(body));
    };

    DeprecationCopView.prototype.createSelectorIssueUrl = function(packageName, title, body) {
      var repoUrl;
      repoUrl = this.getRepoUrl(packageName);
      if (repoUrl) {
        return repoUrl + "/issues/new?title=" + (encodeURI(title)) + "&body=" + (encodeURI(body));
      } else {
        return null;
      }
    };

    DeprecationCopView.prototype.updateCalls = function() {
      var deprecation, deprecations, j, k, l, len, len1, len2, packageDeprecations, packageName, packageNames, ref2, ref3, results, self, stack, stacks;
      deprecations = Grim.getDeprecations();
      deprecations.sort(function(a, b) {
        return b.getCallCount() - a.getCallCount();
      });
      this.list.empty();
      packageDeprecations = {};
      for (j = 0, len = deprecations.length; j < len; j++) {
        deprecation = deprecations[j];
        stacks = deprecation.getStacks();
        stacks.sort(function(a, b) {
          return b.callCount - a.callCount;
        });
        for (k = 0, len1 = stacks.length; k < len1; k++) {
          stack = stacks[k];
          packageName = (ref2 = (ref3 = stack.metadata) != null ? ref3.packageName : void 0) != null ? ref2 : (this.getPackageName(stack) || '').toLowerCase();
          if (packageDeprecations[packageName] == null) {
            packageDeprecations[packageName] = [];
          }
          packageDeprecations[packageName].push({
            deprecation: deprecation,
            stack: stack
          });
        }
      }
      if (deprecations.length === 0) {
        return this.list.append($$(function() {
          return this.li({
            "class": 'list-item'
          }, "No deprecated calls");
        }));
      } else {
        self = this;
        packageNames = _.keys(packageDeprecations);
        packageNames.sort();
        results = [];
        for (l = 0, len2 = packageNames.length; l < len2; l++) {
          packageName = packageNames[l];
          results.push(this.list.append($$(function() {
            return this.li({
              "class": 'deprecation list-nested-item collapsed'
            }, (function(_this) {
              return function() {
                _this.div({
                  "class": 'deprecation-info list-item'
                }, function() {
                  _this.span({
                    "class": 'text-highlight'
                  }, packageName || 'atom core');
                  return _this.span(" (" + (_.pluralize(packageDeprecations[packageName].length, 'deprecation')) + ")");
                });
                return _this.ul({
                  "class": 'list'
                }, function() {
                  var len3, m, ref4, ref5, results1;
                  if (packageName && atom.packages.getLoadedPackage(packageName)) {
                    _this.div({
                      "class": 'padded'
                    }, function() {
                      return _this.div({
                        "class": 'btn-group'
                      }, function() {
                        _this.button({
                          "class": 'btn check-for-update'
                        }, 'Check for Update');
                        return _this.button({
                          "class": 'btn disable-package',
                          'data-package-name': packageName
                        }, 'Disable Package');
                      });
                    });
                  }
                  ref4 = packageDeprecations[packageName];
                  results1 = [];
                  for (m = 0, len3 = ref4.length; m < len3; m++) {
                    ref5 = ref4[m], deprecation = ref5.deprecation, stack = ref5.stack;
                    results1.push(_this.li({
                      "class": 'list-item deprecation-detail'
                    }, function() {
                      var issueTitle, issueUrl, repoUrl;
                      _this.span({
                        "class": 'text-warning icon icon-alert'
                      });
                      _this.div({
                        "class": 'list-item deprecation-message'
                      }, function() {
                        return _this.raw(marked(deprecation.getMessage()));
                      });
                      if (packageName && (issueUrl = self.createIssueUrl(packageName, deprecation, stack))) {
                        repoUrl = self.getRepoUrl(packageName);
                        issueTitle = (deprecation.getOriginName()) + " is deprecated.";
                        _this.div({
                          "class": 'btn-toolbar'
                        }, function() {
                          return _this.button({
                            "class": 'btn issue-url',
                            'data-issue-title': issueTitle,
                            'data-repo-url': repoUrl,
                            'data-issue-url': issueUrl
                          }, 'Report Issue');
                        });
                      }
                      return _this.div({
                        "class": 'stack-trace'
                      }, function() {
                        var functionName, len4, location, n, ref6, results2;
                        results2 = [];
                        for (n = 0, len4 = stack.length; n < len4; n++) {
                          ref6 = stack[n], functionName = ref6.functionName, location = ref6.location;
                          results2.push(_this.div({
                            "class": 'stack-line'
                          }, function() {
                            _this.span(functionName);
                            _this.span(" - ");
                            return _this.a({
                              "class": 'stack-line-location',
                              href: location
                            }, location);
                          }));
                        }
                        return results2;
                      });
                    }));
                  }
                  return results1;
                });
              };
            })(this));
          })));
        }
        return results;
      }
    };

    DeprecationCopView.prototype.updateSelectors = function() {
      var deprecationsByPackageName, packageDeprecations, packageName, results, self;
      this.selectorList.empty();
      self = this;
      deprecationsByPackageName = this.getSelectorDeprecationsByPackageName();
      if (deprecationsByPackageName.size === 0) {
        this.selectorList.append($$(function() {
          return this.li({
            "class": 'list-item'
          }, "No deprecated selectors");
        }));
        return;
      }
      results = [];
      for (packageName in deprecationsByPackageName) {
        packageDeprecations = deprecationsByPackageName[packageName];
        results.push(this.selectorList.append($$(function() {
          return this.li({
            "class": 'deprecation list-nested-item collapsed'
          }, (function(_this) {
            return function() {
              _this.div({
                "class": 'deprecation-info list-item'
              }, function() {
                return _this.span({
                  "class": 'text-highlight'
                }, packageName);
              });
              return _this.ul({
                "class": 'list'
              }, function() {
                var deprecation, j, len, packagePath, ref2, relativeSourcePath, results1, sourcePath;
                if (packageName && atom.packages.getLoadedPackage(packageName)) {
                  _this.div({
                    "class": 'padded'
                  }, function() {
                    return _this.div({
                      "class": 'btn-group'
                    }, function() {
                      _this.button({
                        "class": 'btn check-for-update'
                      }, 'Check for Update');
                      return _this.button({
                        "class": 'btn disable-package',
                        'data-package-name': packageName
                      }, 'Disable Package');
                    });
                  });
                }
                results1 = [];
                for (j = 0, len = packageDeprecations.length; j < len; j++) {
                  ref2 = packageDeprecations[j], packagePath = ref2.packagePath, sourcePath = ref2.sourcePath, deprecation = ref2.deprecation;
                  relativeSourcePath = path.relative(packagePath, sourcePath);
                  results1.push(_this.li({
                    "class": 'list-item source-file'
                  }, function() {
                    _this.a({
                      "class": 'source-url',
                      href: sourcePath
                    }, relativeSourcePath);
                    return _this.ul({
                      "class": 'list'
                    }, function() {
                      return _this.li({
                        "class": 'list-item deprecation-detail'
                      }, function() {
                        var issueBody, issueTitle, issueUrl, repoUrl;
                        _this.span({
                          "class": 'text-warning icon icon-alert'
                        });
                        _this.div({
                          "class": 'list-item deprecation-message'
                        }, function() {
                          return _this.raw(marked(deprecation.message));
                        });
                        issueTitle = "Deprecated selector in `" + relativeSourcePath + "`";
                        issueBody = "In `" + relativeSourcePath + "`: \n\n" + deprecation.message;
                        if (issueUrl = self.createSelectorIssueUrl(packageName, issueTitle, issueBody)) {
                          repoUrl = self.getRepoUrl(packageName);
                          return _this.div({
                            "class": 'btn-toolbar'
                          }, function() {
                            return _this.button({
                              "class": 'btn issue-url',
                              'data-issue-title': issueTitle,
                              'data-repo-url': repoUrl,
                              'data-issue-url': issueUrl
                            }, 'Report Issue');
                          });
                        }
                      });
                    });
                  }));
                }
                return results1;
              });
            };
          })(this));
        })));
      }
      return results;
    };

    DeprecationCopView.prototype.getSelectorDeprecationsByPackageName = function() {
      var components, deprecation, deprecationsByPackageName, packageName, packagePath, packagesComponentIndex, ref2, sourcePath;
      if (atom.styles.getDeprecations != null) {
        deprecationsByPackageName = {};
        ref2 = atom.styles.getDeprecations();
        for (sourcePath in ref2) {
          deprecation = ref2[sourcePath];
          components = sourcePath.split(path.sep);
          packagesComponentIndex = components.indexOf('packages');
          if (packagesComponentIndex !== -1) {
            packageName = components[packagesComponentIndex + 1];
            packagePath = components.slice(0, packagesComponentIndex + 1).join(path.sep);
          } else {
            packageName = 'Other';
            packagePath = '';
          }
          if (deprecationsByPackageName[packageName] == null) {
            deprecationsByPackageName[packageName] = [];
          }
          deprecationsByPackageName[packageName].push({
            packagePath: packagePath,
            sourcePath: sourcePath,
            deprecation: deprecation
          });
        }
        return deprecationsByPackageName;
      } else {
        return {};
      }
    };

    return DeprecationCopView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9kZXByZWNhdGlvbi1jb3AvbGliL2RlcHJlY2F0aW9uLWNvcC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNEdBQUE7SUFBQTs7OztFQUFBLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixPQUFzQixPQUFBLENBQVEsc0JBQVIsQ0FBdEIsRUFBQyxVQUFELEVBQUksWUFBSixFQUFROztFQUNSLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUVULE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLCtDQUFQO1FBQXdELFFBQUEsRUFBVSxDQUFDLENBQW5FO09BQUwsRUFBMkUsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN6RSxLQUFDLENBQUEsR0FBRCxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxPQUFQO1dBQUwsRUFBcUIsU0FBQTtZQUNuQixLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw2QkFBUDthQUFMLEVBQTJDLFNBQUE7cUJBQ3pDLEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxzQkFBUDtlQUFMLEVBQW9DLFNBQUE7dUJBQ2xDLEtBQUMsQ0FBQSxNQUFELENBQVE7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQ0FBUDtpQkFBUixFQUFtRCxtQkFBbkQ7Y0FEa0MsQ0FBcEM7WUFEeUMsQ0FBM0M7WUFJQSxLQUFDLENBQUEsR0FBRCxDQUFLO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQO2FBQUwsRUFBNkIsU0FBQTtxQkFDM0IsS0FBQyxDQUFBLElBQUQsQ0FBTSxrQkFBTjtZQUQyQixDQUE3QjtZQUVBLEtBQUMsQ0FBQSxFQUFELENBQUk7Y0FBQSxNQUFBLEVBQVEsTUFBUjtjQUFnQixDQUFBLEtBQUEsQ0FBQSxFQUFPLG9DQUF2QjthQUFKO1lBRUEsS0FBQyxDQUFBLEdBQUQsQ0FBSztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDthQUFMLEVBQTZCLFNBQUE7cUJBQzNCLEtBQUMsQ0FBQSxJQUFELENBQU0sc0JBQU47WUFEMkIsQ0FBN0I7bUJBRUEsS0FBQyxDQUFBLEVBQUQsQ0FBSTtjQUFBLE1BQUEsRUFBUSxjQUFSO2NBQXdCLENBQUEsS0FBQSxDQUFBLEVBQU8sOENBQS9CO2FBQUo7VUFYbUIsQ0FBckI7UUFEeUU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTNFO0lBRFE7O2lDQWVWLFVBQUEsR0FBWSxTQUFDLEdBQUQ7TUFBRSxJQUFDLENBQUEsTUFBRixJQUFFO01BQ2IsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQW1CLElBQUMsQ0FBQSxpQkFBcEIsQ0FBbkI7TUFFQSxJQUFHLDJDQUFIO1FBQ0UsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQVosQ0FBb0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsZUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBDLENBQW5CLEVBREY7O2FBRUEsSUFBQyxDQUFBLG9CQUFELEdBQXdCLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBQyxDQUFBLFdBQVosRUFBeUIsSUFBekI7SUFOZDs7aUNBUVosUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsV0FBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBSFE7O2lDQUtWLGlCQUFBLEdBQW1CLFNBQUE7QUFFakIsVUFBQTtNQUFBLElBQVUsSUFBQyxDQUFBLGtCQUFYO0FBQUEsZUFBQTs7TUFFQSxJQUFBLEdBQU87TUFFUCxJQUFDLENBQUEsRUFBRCxDQUFJLE9BQUosRUFBYSxtQkFBYixFQUFrQyxTQUFBO2VBQ2hDLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFSLENBQUEsQ0FBZ0IsQ0FBQyxXQUFqQixDQUE2QixXQUE3QjtNQURnQyxDQUFsQztNQUdBLElBQUMsQ0FBQSxFQUFELENBQUksT0FBSixFQUFhLG1CQUFiLEVBQWtDLFNBQUE7UUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHVCQUFwQjtlQUNBO01BRmdDLENBQWxDO01BSUEsSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEsa0JBQWIsRUFBaUMsU0FBQTtRQUMvQixJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBWjtVQUNFLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBZCxDQUE2QixJQUFDLENBQUEsT0FBTyxDQUFDLFdBQXRDLEVBREY7O2VBRUE7TUFIK0IsQ0FBakM7TUFLQSxJQUFDLENBQUEsRUFBRCxDQUFJLE9BQUosRUFBYSxtQ0FBYixFQUFrRCxTQUFBO0FBQ2hELFlBQUE7UUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsU0FBZCxFQUF5QixFQUF6QjtRQUNiLElBQThDLE9BQU8sQ0FBQyxRQUFSLEtBQW9CLE9BQWxFO1VBQUEsVUFBQSxHQUFhLFVBQVUsQ0FBQyxPQUFYLENBQW1CLEtBQW5CLEVBQTBCLEVBQTFCLEVBQWI7O2VBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVTtVQUFBLFdBQUEsRUFBYSxDQUFDLFVBQUQsQ0FBYjtTQUFWO01BSGdELENBQWxEO01BS0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxPQUFKLEVBQWEsWUFBYixFQUEyQixTQUFBO1FBQ3pCLElBQUksQ0FBQyxZQUFMLENBQWtCLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBM0IsRUFBb0MsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUE3QyxFQUF1RCxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQWhFO2VBQ0E7TUFGeUIsQ0FBM0I7YUFJQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7SUEzQkw7O2lDQTZCbkIsaUJBQUEsR0FBbUIsU0FBQyxPQUFELEVBQVUsVUFBVjtBQUNqQixVQUFBO01BQUEsR0FBQSxHQUFNO01BQ04sSUFBQSxHQUFPLE9BQU8sQ0FBQyxPQUFSLENBQWdCLHFDQUFoQixFQUF1RCxFQUF2RDtNQUNQLEtBQUEsR0FBVyxVQUFELEdBQVksUUFBWixHQUFvQjthQUUxQixJQUFBLE9BQUEsQ0FBUSxTQUFDLE9BQUQsRUFBVSxNQUFWO2VBQ1YsQ0FBQyxDQUFDLElBQUYsQ0FBVSxHQUFELEdBQUssS0FBTCxHQUFTLENBQUMsU0FBQSxDQUFVLEtBQVYsQ0FBRCxDQUFULEdBQTJCLGVBQXBDLEVBQ0U7VUFBQSxNQUFBLEVBQVEsZ0NBQVI7VUFDQSxXQUFBLEVBQWEsa0JBRGI7VUFFQSxPQUFBLEVBQVMsU0FBQyxJQUFEO0FBQ1AsZ0JBQUE7WUFBQSxJQUFHLGtCQUFIO2NBQ0UsTUFBQSxHQUFTO0FBQ1Q7QUFBQSxtQkFBQSxzQ0FBQTs7Z0JBQ0UsSUFBK0IsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFaLENBQW9CLFVBQXBCLENBQUEsR0FBa0MsQ0FBQyxDQUFuQyxJQUE2Qyw2QkFBNUU7a0JBQUEsTUFBTyxDQUFBLEtBQUssQ0FBQyxLQUFOLENBQVAsR0FBc0IsTUFBdEI7O0FBREY7Y0FFQSxJQUEwQixxQkFBQSxJQUFnQix1QkFBMUM7QUFBQSx1QkFBTyxPQUFBLENBQVEsTUFBUixFQUFQO2VBSkY7O21CQUtBLE9BQUEsQ0FBUSxJQUFSO1VBTk8sQ0FGVDtVQVNBLEtBQUEsRUFBTyxTQUFBO21CQUNMLE9BQUEsQ0FBUSxJQUFSO1VBREssQ0FUUDtTQURGO01BRFUsQ0FBUjtJQUxhOztpQ0FtQm5CLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxRQUFWLEVBQW9CLFVBQXBCO0FBQ1osVUFBQTtNQUFBLGNBQUEsR0FBaUIsU0FBQyxTQUFEO2VBQ2YsT0FBQSxDQUFRLE9BQVIsQ0FBZ0IsQ0FBQyxZQUFqQixDQUE4QixTQUE5QjtNQURlO2FBR2pCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixPQUFuQixFQUE0QixVQUE1QixDQUF1QyxDQUFDLElBQXhDLENBQTZDLFNBQUMsTUFBRDtBQUMzQyxZQUFBO1FBQUEsc0JBQUcsTUFBTSxDQUFFLGNBQVIsc0JBQWdCLE1BQU0sQ0FBRSxnQkFBM0I7VUFDRSxLQUFBLEdBQVEsTUFBTSxDQUFDLElBQVAsSUFBZSxNQUFNLENBQUM7aUJBQzlCLGNBQUEsQ0FBZSxLQUFLLENBQUMsUUFBckIsRUFGRjtTQUFBLE1BR0ssSUFBRyxPQUFPLENBQUMsUUFBUixLQUFvQixPQUF2QjtpQkFDSCxDQUFDLENBQUMsSUFBRixDQUFPLGVBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxNQUFOO1lBQ0EsSUFBQSxFQUFNO2NBQUEsR0FBQSxFQUFLLFFBQUw7YUFETjtZQUVBLE9BQUEsRUFBUyxTQUFDLElBQUQsRUFBTyxNQUFQLEVBQWUsR0FBZjtxQkFDUCxjQUFBLENBQWUsR0FBRyxDQUFDLGlCQUFKLENBQXNCLFVBQXRCLENBQWY7WUFETyxDQUZUO1lBSUEsS0FBQSxFQUFPLFNBQUE7cUJBQ0wsY0FBQSxDQUFlLFFBQWY7WUFESyxDQUpQO1dBREYsRUFERztTQUFBLE1BQUE7aUJBU0gsY0FBQSxDQUFlLFFBQWYsRUFURzs7TUFKc0MsQ0FBN0M7SUFKWTs7aUNBbUJkLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7YUFDQSxJQUFDLENBQUEsTUFBRCxDQUFBO0lBRk87O2lDQUlULFNBQUEsR0FBVyxTQUFBO2FBQ1Q7UUFBQSxZQUFBLEVBQWMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUEzQjtRQUNBLEdBQUEsRUFBSyxJQUFDLENBQUEsTUFBRCxDQUFBLENBREw7UUFFQSxPQUFBLEVBQVMsQ0FGVDs7SUFEUzs7aUNBS1gsaUJBQUEsR0FBbUIsU0FBQTthQUNqQixJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQURpQjs7aUNBR25CLE1BQUEsR0FBUSxTQUFBO2FBQ04sSUFBQyxDQUFBO0lBREs7O2lDQUdSLFFBQUEsR0FBVSxTQUFBO2FBQ1I7SUFEUTs7aUNBR1YsV0FBQSxHQUFhLFNBQUE7YUFDWDtJQURXOztpQ0FJYixnQkFBQSxHQUFrQixTQUFBO2FBQUcsSUFBSTtJQUFQOztpQ0FDbEIsbUJBQUEsR0FBcUIsU0FBQTthQUFHLElBQUk7SUFBUDs7aUNBRXJCLDRCQUFBLEdBQThCLFNBQUE7QUFDNUIsVUFBQTtNQUFBLElBQXFDLHNDQUFyQztBQUFBLGVBQU8sSUFBQyxDQUFBLDBCQUFSOztNQUVBLElBQUMsQ0FBQSx5QkFBRCxHQUE2QjtBQUM3QjtBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBQyxDQUFBLHlCQUEwQixDQUFBLElBQUksQ0FBQyxJQUFMLENBQTNCLEdBQXdDLElBQUksQ0FBQztBQUQvQzthQUdBLElBQUMsQ0FBQTtJQVAyQjs7aUNBUzlCLGNBQUEsR0FBZ0IsU0FBQyxLQUFEO0FBQ2QsVUFBQTtNQUFBLFlBQUEsR0FBZSxJQUFDLENBQUEsNEJBQUQsQ0FBQTtBQUNmLFdBQUEsMkJBQUE7O1FBQ0UsSUFBRyxXQUFXLENBQUMsT0FBWixDQUFvQixvQkFBcEIsQ0FBQSxHQUE0QyxDQUFDLENBQTdDLElBQWtELFdBQVcsQ0FBQyxPQUFaLENBQW9CLGdCQUFwQixDQUFBLEdBQXdDLENBQUMsQ0FBOUY7VUFDRSxZQUFhLENBQUEsV0FBQSxDQUFiLEdBQTRCLEVBQUUsQ0FBQyxRQUFILENBQVksV0FBWixFQUQ5Qjs7QUFERjtBQUlBLFdBQVMsMEZBQVQ7UUFDRyxXQUFZLEtBQU0sQ0FBQSxDQUFBO1FBR25CLElBQUEsQ0FBYyxRQUFkO0FBQUEsaUJBQUE7O1FBR0EsSUFBWSxRQUFRLENBQUMsUUFBVCxDQUFxQixJQUFJLENBQUMsR0FBTixHQUFVLGNBQVYsR0FBd0IsSUFBSSxDQUFDLEdBQWpELENBQVo7QUFBQSxtQkFBQTs7QUFFQSxhQUFBLDJCQUFBOztVQUNFLFlBQUEsR0FBZSxJQUFJLENBQUMsUUFBTCxDQUFjLFdBQWQsRUFBMkIsUUFBM0I7VUFDZixJQUFBLENBQTBCLE9BQU8sQ0FBQyxJQUFSLENBQWEsWUFBYixDQUExQjtBQUFBLG1CQUFPLFlBQVA7O0FBRkY7UUFJQSxJQUF1RCxJQUFJLENBQUMscUJBQUwsQ0FBQSxDQUFBLEtBQWdDLFFBQXZGO0FBQUEsaUJBQU8sYUFBQSxHQUFhLENBQUMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxRQUFkLENBQUQsQ0FBYixHQUFzQyxRQUE3Qzs7QUFiRjtJQU5jOztpQ0F1QmhCLFVBQUEsR0FBWSxTQUFDLFdBQUQ7QUFDVixVQUFBO01BQUEsSUFBQSxDQUFjLENBQUEsSUFBQSx1R0FBNEQsQ0FBRSw0QkFBOUQsQ0FBZDtBQUFBLGVBQUE7O01BQ0EsT0FBQSxzQ0FBcUI7YUFDckIsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsUUFBaEIsRUFBMEIsRUFBMUI7SUFIVTs7aUNBS1osY0FBQSxHQUFnQixTQUFDLFdBQUQsRUFBYyxXQUFkLEVBQTJCLEtBQTNCO0FBQ2QsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsVUFBRCxDQUFZLFdBQVo7TUFDVixJQUFBLENBQWMsT0FBZDtBQUFBLGVBQUE7O01BRUEsS0FBQSxHQUFVLENBQUMsV0FBVyxDQUFDLGFBQVosQ0FBQSxDQUFELENBQUEsR0FBNkI7TUFDdkMsVUFBQSxHQUFhLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxHQUFEO0FBQThCLFlBQUE7UUFBNUIsaUNBQWM7ZUFBaUIsWUFBRCxHQUFjLElBQWQsR0FBa0IsUUFBbEIsR0FBMkI7TUFBM0QsQ0FBVixDQUF3RSxDQUFDLElBQXpFLENBQThFLElBQTlFO01BQ2IsSUFBQSxHQUFTLENBQUMsV0FBVyxDQUFDLFVBQVosQ0FBQSxDQUFELENBQUEsR0FBMEIsU0FBMUIsR0FBbUMsVUFBbkMsR0FBOEM7YUFDcEQsT0FBRCxHQUFTLG9CQUFULEdBQTRCLENBQUMsU0FBQSxDQUFVLEtBQVYsQ0FBRCxDQUE1QixHQUE4QyxRQUE5QyxHQUFxRCxDQUFDLFNBQUEsQ0FBVSxJQUFWLENBQUQ7SUFQekM7O2lDQVNoQixzQkFBQSxHQUF3QixTQUFDLFdBQUQsRUFBYyxLQUFkLEVBQXFCLElBQXJCO0FBQ3RCLFVBQUE7TUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBWSxXQUFaO01BQ1YsSUFBRyxPQUFIO2VBQ0ssT0FBRCxHQUFTLG9CQUFULEdBQTRCLENBQUMsU0FBQSxDQUFVLEtBQVYsQ0FBRCxDQUE1QixHQUE4QyxRQUE5QyxHQUFxRCxDQUFDLFNBQUEsQ0FBVSxJQUFWLENBQUQsRUFEekQ7T0FBQSxNQUFBO2VBR0UsS0FIRjs7SUFGc0I7O2lDQU94QixXQUFBLEdBQWEsU0FBQTtBQUNYLFVBQUE7TUFBQSxZQUFBLEdBQWUsSUFBSSxDQUFDLGVBQUwsQ0FBQTtNQUNmLFlBQVksQ0FBQyxJQUFiLENBQWtCLFNBQUMsQ0FBRCxFQUFJLENBQUo7ZUFBVSxDQUFDLENBQUMsWUFBRixDQUFBLENBQUEsR0FBbUIsQ0FBQyxDQUFDLFlBQUYsQ0FBQTtNQUE3QixDQUFsQjtNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO01BRUEsbUJBQUEsR0FBc0I7QUFDdEIsV0FBQSw4Q0FBQTs7UUFDRSxNQUFBLEdBQVMsV0FBVyxDQUFDLFNBQVosQ0FBQTtRQUNULE1BQU0sQ0FBQyxJQUFQLENBQVksU0FBQyxDQUFELEVBQUksQ0FBSjtpQkFBVSxDQUFDLENBQUMsU0FBRixHQUFjLENBQUMsQ0FBQztRQUExQixDQUFaO0FBQ0EsYUFBQSwwQ0FBQTs7VUFDRSxXQUFBLHlGQUE0QyxDQUFDLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLENBQUEsSUFBMEIsRUFBM0IsQ0FBOEIsQ0FBQyxXQUEvQixDQUFBOztZQUM1QyxtQkFBb0IsQ0FBQSxXQUFBLElBQWdCOztVQUNwQyxtQkFBb0IsQ0FBQSxXQUFBLENBQVksQ0FBQyxJQUFqQyxDQUFzQztZQUFDLGFBQUEsV0FBRDtZQUFjLE9BQUEsS0FBZDtXQUF0QztBQUhGO0FBSEY7TUFTQSxJQUFHLFlBQVksQ0FBQyxNQUFiLEtBQXVCLENBQTFCO2VBQ0UsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsRUFBQSxDQUFHLFNBQUE7aUJBQ2QsSUFBQyxDQUFBLEVBQUQsQ0FBSTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtXQUFKLEVBQXdCLHFCQUF4QjtRQURjLENBQUgsQ0FBYixFQURGO09BQUEsTUFBQTtRQUlFLElBQUEsR0FBTztRQUNQLFlBQUEsR0FBZSxDQUFDLENBQUMsSUFBRixDQUFPLG1CQUFQO1FBQ2YsWUFBWSxDQUFDLElBQWIsQ0FBQTtBQUNBO2FBQUEsZ0RBQUE7O3VCQUNFLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLEVBQUEsQ0FBRyxTQUFBO21CQUNkLElBQUMsQ0FBQSxFQUFELENBQUk7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHdDQUFQO2FBQUosRUFBcUQsQ0FBQSxTQUFBLEtBQUE7cUJBQUEsU0FBQTtnQkFDbkQsS0FBQyxDQUFBLEdBQUQsQ0FBSztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDRCQUFQO2lCQUFMLEVBQTBDLFNBQUE7a0JBQ3hDLEtBQUMsQ0FBQSxJQUFELENBQU07b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDttQkFBTixFQUErQixXQUFBLElBQWUsV0FBOUM7eUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxJQUFBLEdBQUksQ0FBQyxDQUFDLENBQUMsU0FBRixDQUFZLG1CQUFvQixDQUFBLFdBQUEsQ0FBWSxDQUFDLE1BQTdDLEVBQXFELGFBQXJELENBQUQsQ0FBSixHQUF5RSxHQUEvRTtnQkFGd0MsQ0FBMUM7dUJBSUEsS0FBQyxDQUFBLEVBQUQsQ0FBSTtrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLE1BQVA7aUJBQUosRUFBbUIsU0FBQTtBQUVqQixzQkFBQTtrQkFBQSxJQUFHLFdBQUEsSUFBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZCxDQUErQixXQUEvQixDQUFuQjtvQkFDRSxLQUFDLENBQUEsR0FBRCxDQUFLO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtxQkFBTCxFQUFzQixTQUFBOzZCQUNwQixLQUFDLENBQUEsR0FBRCxDQUFLO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDt1QkFBTCxFQUF5QixTQUFBO3dCQUN2QixLQUFDLENBQUEsTUFBRCxDQUFROzBCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sc0JBQVA7eUJBQVIsRUFBdUMsa0JBQXZDOytCQUNBLEtBQUMsQ0FBQSxNQUFELENBQVE7MEJBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxxQkFBUDswQkFBOEIsbUJBQUEsRUFBcUIsV0FBbkQ7eUJBQVIsRUFBd0UsaUJBQXhFO3NCQUZ1QixDQUF6QjtvQkFEb0IsQ0FBdEIsRUFERjs7QUFNQTtBQUFBO3VCQUFBLHdDQUFBO29DQUFLLGdDQUFhO2tDQUNoQixLQUFDLENBQUEsRUFBRCxDQUFJO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sOEJBQVA7cUJBQUosRUFBMkMsU0FBQTtBQUN6QywwQkFBQTtzQkFBQSxLQUFDLENBQUEsSUFBRCxDQUFNO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sOEJBQVA7dUJBQU47c0JBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSzt3QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLCtCQUFQO3VCQUFMLEVBQTZDLFNBQUE7K0JBQzNDLEtBQUMsQ0FBQSxHQUFELENBQUssTUFBQSxDQUFPLFdBQVcsQ0FBQyxVQUFaLENBQUEsQ0FBUCxDQUFMO3NCQUQyQyxDQUE3QztzQkFHQSxJQUFHLFdBQUEsSUFBZ0IsQ0FBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsV0FBcEIsRUFBaUMsV0FBakMsRUFBOEMsS0FBOUMsQ0FBWCxDQUFuQjt3QkFDRSxPQUFBLEdBQVUsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsV0FBaEI7d0JBQ1YsVUFBQSxHQUFlLENBQUMsV0FBVyxDQUFDLGFBQVosQ0FBQSxDQUFELENBQUEsR0FBNkI7d0JBQzVDLEtBQUMsQ0FBQSxHQUFELENBQUs7MEJBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3lCQUFMLEVBQTJCLFNBQUE7aUNBQ3pCLEtBQUMsQ0FBQSxNQUFELENBQVE7NEJBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxlQUFQOzRCQUF3QixrQkFBQSxFQUFvQixVQUE1Qzs0QkFBd0QsZUFBQSxFQUFpQixPQUF6RTs0QkFBa0YsZ0JBQUEsRUFBa0IsUUFBcEc7MkJBQVIsRUFBc0gsY0FBdEg7d0JBRHlCLENBQTNCLEVBSEY7OzZCQU1BLEtBQUMsQ0FBQSxHQUFELENBQUs7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3VCQUFMLEVBQTJCLFNBQUE7QUFDekIsNEJBQUE7QUFBQTs2QkFBQSx5Q0FBQTsyQ0FBSyxrQ0FBYzt3Q0FDakIsS0FBQyxDQUFBLEdBQUQsQ0FBSzs0QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFlBQVA7MkJBQUwsRUFBMEIsU0FBQTs0QkFDeEIsS0FBQyxDQUFBLElBQUQsQ0FBTSxZQUFOOzRCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sS0FBTjttQ0FDQSxLQUFDLENBQUEsQ0FBRCxDQUFHOzhCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8scUJBQVA7OEJBQThCLElBQUEsRUFBTSxRQUFwQzs2QkFBSCxFQUFpRCxRQUFqRDswQkFId0IsQ0FBMUI7QUFERjs7c0JBRHlCLENBQTNCO29CQVh5QyxDQUEzQztBQURGOztnQkFSaUIsQ0FBbkI7Y0FMbUQ7WUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJEO1VBRGMsQ0FBSCxDQUFiO0FBREY7dUJBUEY7O0lBZlc7O2lDQXdEYixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsSUFBQyxDQUFBLFlBQVksQ0FBQyxLQUFkLENBQUE7TUFDQSxJQUFBLEdBQU87TUFFUCx5QkFBQSxHQUE0QixJQUFDLENBQUEsb0NBQUQsQ0FBQTtNQUM1QixJQUFHLHlCQUF5QixDQUFDLElBQTFCLEtBQWtDLENBQXJDO1FBQ0UsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUFkLENBQXFCLEVBQUEsQ0FBRyxTQUFBO2lCQUN0QixJQUFDLENBQUEsRUFBRCxDQUFJO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUFQO1dBQUosRUFBd0IseUJBQXhCO1FBRHNCLENBQUgsQ0FBckI7QUFFQSxlQUhGOztBQUtBO1dBQUEsd0NBQUE7O3FCQUNFLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBZCxDQUFxQixFQUFBLENBQUcsU0FBQTtpQkFDdEIsSUFBQyxDQUFBLEVBQUQsQ0FBSTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sd0NBQVA7V0FBSixFQUFxRCxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO2NBQ25ELEtBQUMsQ0FBQSxHQUFELENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw0QkFBUDtlQUFMLEVBQTBDLFNBQUE7dUJBQ3hDLEtBQUMsQ0FBQSxJQUFELENBQU07a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtpQkFBTixFQUErQixXQUEvQjtjQUR3QyxDQUExQztxQkFHQSxLQUFDLENBQUEsRUFBRCxDQUFJO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sTUFBUDtlQUFKLEVBQW1CLFNBQUE7QUFDakIsb0JBQUE7Z0JBQUEsSUFBRyxXQUFBLElBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsV0FBL0IsQ0FBbkI7a0JBQ0UsS0FBQyxDQUFBLEdBQUQsQ0FBSztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQVA7bUJBQUwsRUFBc0IsU0FBQTsyQkFDcEIsS0FBQyxDQUFBLEdBQUQsQ0FBSztzQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFdBQVA7cUJBQUwsRUFBeUIsU0FBQTtzQkFDdkIsS0FBQyxDQUFBLE1BQUQsQ0FBUTt3QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHNCQUFQO3VCQUFSLEVBQXVDLGtCQUF2Qzs2QkFDQSxLQUFDLENBQUEsTUFBRCxDQUFRO3dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8scUJBQVA7d0JBQThCLG1CQUFBLEVBQXFCLFdBQW5EO3VCQUFSLEVBQXdFLGlCQUF4RTtvQkFGdUIsQ0FBekI7a0JBRG9CLENBQXRCLEVBREY7O0FBTUE7cUJBQUEscURBQUE7aURBQUssZ0NBQWEsOEJBQVk7a0JBQzVCLGtCQUFBLEdBQXFCLElBQUksQ0FBQyxRQUFMLENBQWMsV0FBZCxFQUEyQixVQUEzQjtnQ0FDckIsS0FBQyxDQUFBLEVBQUQsQ0FBSTtvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHVCQUFQO21CQUFKLEVBQW9DLFNBQUE7b0JBQ2xDLEtBQUMsQ0FBQSxDQUFELENBQUc7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxZQUFQO3NCQUFxQixJQUFBLEVBQU0sVUFBM0I7cUJBQUgsRUFBMEMsa0JBQTFDOzJCQUNBLEtBQUMsQ0FBQSxFQUFELENBQUk7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxNQUFQO3FCQUFKLEVBQW1CLFNBQUE7NkJBQ2pCLEtBQUMsQ0FBQSxFQUFELENBQUk7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw4QkFBUDt1QkFBSixFQUEyQyxTQUFBO0FBQ3pDLDRCQUFBO3dCQUFBLEtBQUMsQ0FBQSxJQUFELENBQU07MEJBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw4QkFBUDt5QkFBTjt3QkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLOzBCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sK0JBQVA7eUJBQUwsRUFBNkMsU0FBQTtpQ0FDM0MsS0FBQyxDQUFBLEdBQUQsQ0FBSyxNQUFBLENBQU8sV0FBVyxDQUFDLE9BQW5CLENBQUw7d0JBRDJDLENBQTdDO3dCQUdBLFVBQUEsR0FBYSwwQkFBQSxHQUEyQixrQkFBM0IsR0FBOEM7d0JBQzNELFNBQUEsR0FBWSxNQUFBLEdBQU8sa0JBQVAsR0FBMEIsU0FBMUIsR0FBbUMsV0FBVyxDQUFDO3dCQUMzRCxJQUFHLFFBQUEsR0FBVyxJQUFJLENBQUMsc0JBQUwsQ0FBNEIsV0FBNUIsRUFBeUMsVUFBekMsRUFBcUQsU0FBckQsQ0FBZDswQkFDRSxPQUFBLEdBQVUsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsV0FBaEI7aUNBQ1YsS0FBQyxDQUFBLEdBQUQsQ0FBSzs0QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7MkJBQUwsRUFBMkIsU0FBQTttQ0FDekIsS0FBQyxDQUFBLE1BQUQsQ0FBUTs4QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7OEJBQXdCLGtCQUFBLEVBQW9CLFVBQTVDOzhCQUF3RCxlQUFBLEVBQWlCLE9BQXpFOzhCQUFrRixnQkFBQSxFQUFrQixRQUFwRzs2QkFBUixFQUFzSCxjQUF0SDswQkFEeUIsQ0FBM0IsRUFGRjs7c0JBUHlDLENBQTNDO29CQURpQixDQUFuQjtrQkFGa0MsQ0FBcEM7QUFGRjs7Y0FQaUIsQ0FBbkI7WUFKbUQ7VUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJEO1FBRHNCLENBQUgsQ0FBckI7QUFERjs7SUFWZTs7aUNBd0NqQixvQ0FBQSxHQUFzQyxTQUFBO0FBRXBDLFVBQUE7TUFBQSxJQUFHLG1DQUFIO1FBQ0UseUJBQUEsR0FBNEI7QUFDNUI7QUFBQSxhQUFBLGtCQUFBOztVQUNFLFVBQUEsR0FBYSxVQUFVLENBQUMsS0FBWCxDQUFpQixJQUFJLENBQUMsR0FBdEI7VUFDYixzQkFBQSxHQUF5QixVQUFVLENBQUMsT0FBWCxDQUFtQixVQUFuQjtVQUN6QixJQUFHLHNCQUFBLEtBQTRCLENBQUMsQ0FBaEM7WUFDRSxXQUFBLEdBQWMsVUFBVyxDQUFBLHNCQUFBLEdBQXlCLENBQXpCO1lBQ3pCLFdBQUEsR0FBYyxVQUFVLENBQUMsS0FBWCxDQUFpQixDQUFqQixFQUFvQixzQkFBQSxHQUF5QixDQUE3QyxDQUErQyxDQUFDLElBQWhELENBQXFELElBQUksQ0FBQyxHQUExRCxFQUZoQjtXQUFBLE1BQUE7WUFJRSxXQUFBLEdBQWM7WUFDZCxXQUFBLEdBQWMsR0FMaEI7OztZQU9BLHlCQUEwQixDQUFBLFdBQUEsSUFBZ0I7O1VBQzFDLHlCQUEwQixDQUFBLFdBQUEsQ0FBWSxDQUFDLElBQXZDLENBQTRDO1lBQUMsYUFBQSxXQUFEO1lBQWMsWUFBQSxVQUFkO1lBQTBCLGFBQUEsV0FBMUI7V0FBNUM7QUFYRjtlQVlBLDBCQWRGO09BQUEsTUFBQTtlQWdCRSxHQWhCRjs7SUFGb0M7Ozs7S0E5UVA7QUFUakMiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsICQkLCBTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuR3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG5tYXJrZWQgPSByZXF1aXJlICdtYXJrZWQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERlcHJlY2F0aW9uQ29wVmlldyBleHRlbmRzIFNjcm9sbFZpZXdcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ2RlcHJlY2F0aW9uLWNvcCBwYW5lLWl0ZW0gbmF0aXZlLWtleS1iaW5kaW5ncycsIHRhYmluZGV4OiAtMSwgPT5cbiAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbCcsID0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdwYWRkZWQgZGVwcmVjYXRpb24tb3ZlcnZpZXcnLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdwdWxsLXJpZ2h0IGJ0bi1ncm91cCcsID0+XG4gICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGJ0bi1wcmltYXJ5IGNoZWNrLWZvci11cGRhdGUnLCAnQ2hlY2sgZm9yIFVwZGF0ZXMnXG5cbiAgICAgICAgQGRpdiBjbGFzczogJ3BhbmVsLWhlYWRpbmcnLCA9PlxuICAgICAgICAgIEBzcGFuIFwiRGVwcmVjYXRlZCBjYWxsc1wiXG4gICAgICAgIEB1bCBvdXRsZXQ6ICdsaXN0JywgY2xhc3M6ICdsaXN0LXRyZWUgaGFzLWNvbGxhcHNhYmxlLWNoaWxkcmVuJ1xuXG4gICAgICAgIEBkaXYgY2xhc3M6ICdwYW5lbC1oZWFkaW5nJywgPT5cbiAgICAgICAgICBAc3BhbiBcIkRlcHJlY2F0ZWQgc2VsZWN0b3JzXCJcbiAgICAgICAgQHVsIG91dGxldDogJ3NlbGVjdG9yTGlzdCcsIGNsYXNzOiAnc2VsZWN0b3JzIGxpc3QtdHJlZSBoYXMtY29sbGFwc2FibGUtY2hpbGRyZW4nXG5cbiAgaW5pdGlhbGl6ZTogKHtAdXJpfSkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKEdyaW0ub24oJ3VwZGF0ZWQnLCBAaGFuZGxlR3JpbVVwZGF0ZWQpKVxuICAgICMgVE9ETzogUmVtb3ZlIGNvbmRpdGlvbmFsIHdoZW4gdGhlIG5ldyBTdHlsZU1hbmFnZXIgZGVwcmVjYXRpb24gQVBJcyByZWFjaCBzdGFibGUuXG4gICAgaWYgYXRvbS5zdHlsZXMub25EaWRVcGRhdGVEZXByZWNhdGlvbnM/XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5zdHlsZXMub25EaWRVcGRhdGVEZXByZWNhdGlvbnMoPT4gQHVwZGF0ZVNlbGVjdG9ycygpKSlcbiAgICBAZGVib3VuY2VkVXBkYXRlQ2FsbHMgPSBfLmRlYm91bmNlKEB1cGRhdGVDYWxscywgMTAwMClcblxuICBhdHRhY2hlZDogLT5cbiAgICBAdXBkYXRlQ2FsbHMoKVxuICAgIEB1cGRhdGVTZWxlY3RvcnMoKVxuICAgIEBzdWJzY3JpYmVUb0V2ZW50cygpXG5cbiAgc3Vic2NyaWJlVG9FdmVudHM6IC0+XG4gICAgIyBhZnRlckF0dGFjaCBpcyBjYWxsZWQgMnggd2hlbiBkZXAgY29wIGlzIHRoZSBhY3RpdmUgcGFuZSBpdGVtIG9uIHJlbG9hZC5cbiAgICByZXR1cm4gaWYgQHN1YnNjcmliZWRUb0V2ZW50c1xuXG4gICAgc2VsZiA9IHRoaXNcblxuICAgIEBvbiAnY2xpY2snLCAnLmRlcHJlY2F0aW9uLWluZm8nLCAtPlxuICAgICAgJCh0aGlzKS5wYXJlbnQoKS50b2dnbGVDbGFzcygnY29sbGFwc2VkJylcblxuICAgIEBvbiAnY2xpY2snLCAnLmNoZWNrLWZvci11cGRhdGUnLCAtPlxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovL2NvbmZpZy91cGRhdGVzJylcbiAgICAgIGZhbHNlXG5cbiAgICBAb24gJ2NsaWNrJywgJy5kaXNhYmxlLXBhY2thZ2UnLCAtPlxuICAgICAgaWYgQGRhdGFzZXQucGFja2FnZU5hbWVcbiAgICAgICAgYXRvbS5wYWNrYWdlcy5kaXNhYmxlUGFja2FnZShAZGF0YXNldC5wYWNrYWdlTmFtZSlcbiAgICAgIGZhbHNlXG5cbiAgICBAb24gJ2NsaWNrJywgJy5zdGFjay1saW5lLWxvY2F0aW9uLCAuc291cmNlLXVybCcsIC0+XG4gICAgICBwYXRoVG9PcGVuID0gQGhyZWYucmVwbGFjZSgnZmlsZTovLycsICcnKVxuICAgICAgcGF0aFRvT3BlbiA9IHBhdGhUb09wZW4ucmVwbGFjZSgvXlxcLy8sICcnKSBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMidcbiAgICAgIGF0b20ub3BlbihwYXRoc1RvT3BlbjogW3BhdGhUb09wZW5dKVxuXG4gICAgQG9uICdjbGljaycsICcuaXNzdWUtdXJsJywgLT5cbiAgICAgIHNlbGYub3Blbklzc3VlVXJsKEBkYXRhc2V0LnJlcG9VcmwsIEBkYXRhc2V0Lmlzc3VlVXJsLCBAZGF0YXNldC5pc3N1ZVRpdGxlKVxuICAgICAgZmFsc2VcblxuICAgIEBzdWJzY3JpYmVkVG9FdmVudHMgPSB0cnVlXG5cbiAgZmluZFNpbWlsYXJJc3N1ZXM6IChyZXBvVXJsLCBpc3N1ZVRpdGxlKSAtPlxuICAgIHVybCA9IFwiaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9zZWFyY2gvaXNzdWVzXCJcbiAgICByZXBvID0gcmVwb1VybC5yZXBsYWNlIC9odHRwKHMpPzpcXC9cXC8oXFxkK1xcLik/Z2l0aHViLmNvbVxcLy9naSwgJydcbiAgICBxdWVyeSA9IFwiI3tpc3N1ZVRpdGxlfSByZXBvOiN7cmVwb31cIlxuXG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICQuYWpheCBcIiN7dXJsfT9xPSN7ZW5jb2RlVVJJKHF1ZXJ5KX0mc29ydD1jcmVhdGVkXCIsXG4gICAgICAgIGFjY2VwdDogJ2FwcGxpY2F0aW9uL3ZuZC5naXRodWIudjMranNvbidcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgICAgICBpZiBkYXRhLml0ZW1zP1xuICAgICAgICAgICAgaXNzdWVzID0ge31cbiAgICAgICAgICAgIGZvciBpc3N1ZSBpbiBkYXRhLml0ZW1zXG4gICAgICAgICAgICAgIGlzc3Vlc1tpc3N1ZS5zdGF0ZV0gPSBpc3N1ZSBpZiBpc3N1ZS50aXRsZS5pbmRleE9mKGlzc3VlVGl0bGUpID4gLTEgYW5kIG5vdCBpc3N1ZXNbaXNzdWUuc3RhdGVdP1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoaXNzdWVzKSBpZiBpc3N1ZXMub3Blbj8gb3IgaXNzdWVzLmNsb3NlZD9cbiAgICAgICAgICByZXNvbHZlKG51bGwpXG4gICAgICAgIGVycm9yOiAtPlxuICAgICAgICAgIHJlc29sdmUobnVsbClcblxuICBvcGVuSXNzdWVVcmw6IChyZXBvVXJsLCBpc3N1ZVVybCwgaXNzdWVUaXRsZSkgLT5cbiAgICBvcGVuRXh0ZXJuYWxseSA9ICh1cmxUb09wZW4pIC0+XG4gICAgICByZXF1aXJlKCdzaGVsbCcpLm9wZW5FeHRlcm5hbCh1cmxUb09wZW4pXG5cbiAgICBAZmluZFNpbWlsYXJJc3N1ZXMocmVwb1VybCwgaXNzdWVUaXRsZSkudGhlbiAoaXNzdWVzKSAtPlxuICAgICAgaWYgaXNzdWVzPy5vcGVuIG9yIGlzc3Vlcz8uY2xvc2VkXG4gICAgICAgIGlzc3VlID0gaXNzdWVzLm9wZW4gb3IgaXNzdWVzLmNsb3NlZFxuICAgICAgICBvcGVuRXh0ZXJuYWxseShpc3N1ZS5odG1sX3VybClcbiAgICAgIGVsc2UgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG4gICAgICAgICQuYWpheCAnaHR0cDovL2dpdC5pbycsXG4gICAgICAgICAgdHlwZTogJ1BPU1QnXG4gICAgICAgICAgZGF0YTogdXJsOiBpc3N1ZVVybFxuICAgICAgICAgIHN1Y2Nlc3M6IChkYXRhLCBzdGF0dXMsIHhocikgLT5cbiAgICAgICAgICAgIG9wZW5FeHRlcm5hbGx5KHhoci5nZXRSZXNwb25zZUhlYWRlcignTG9jYXRpb24nKSlcbiAgICAgICAgICBlcnJvcjogLT5cbiAgICAgICAgICAgIG9wZW5FeHRlcm5hbGx5KGlzc3VlVXJsKVxuICAgICAgZWxzZVxuICAgICAgICBvcGVuRXh0ZXJuYWxseShpc3N1ZVVybClcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBkZXRhY2goKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkZXNlcmlhbGl6ZXI6IEBjb25zdHJ1Y3Rvci5uYW1lXG4gICAgdXJpOiBAZ2V0VVJJKClcbiAgICB2ZXJzaW9uOiAxXG5cbiAgaGFuZGxlR3JpbVVwZGF0ZWQ6ID0+XG4gICAgQGRlYm91bmNlZFVwZGF0ZUNhbGxzKClcblxuICBnZXRVUkk6IC0+XG4gICAgQHVyaVxuXG4gIGdldFRpdGxlOiAtPlxuICAgICdEZXByZWNhdGlvbiBDb3AnXG5cbiAgZ2V0SWNvbk5hbWU6IC0+XG4gICAgJ2FsZXJ0J1xuXG4gICMgVE9ETzogcmVtb3ZlIHRoZXNlIGFmdGVyIHJlbW92aW5nIGFsbCBkZXByZWNhdGlvbnMgZnJvbSBjb3JlLiBUaGV5IGFyZSBOT1BzXG4gIG9uRGlkQ2hhbmdlVGl0bGU6IC0+IG5ldyBEaXNwb3NhYmxlXG4gIG9uRGlkQ2hhbmdlTW9kaWZpZWQ6IC0+IG5ldyBEaXNwb3NhYmxlXG5cbiAgZ2V0UGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZTogLT5cbiAgICByZXR1cm4gQHBhY2thZ2VQYXRoc0J5UGFja2FnZU5hbWUgaWYgQHBhY2thZ2VQYXRoc0J5UGFja2FnZU5hbWU/XG5cbiAgICBAcGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZSA9IHt9XG4gICAgZm9yIHBhY2sgaW4gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlcygpXG4gICAgICBAcGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZVtwYWNrLm5hbWVdID0gcGFjay5wYXRoXG5cbiAgICBAcGFja2FnZVBhdGhzQnlQYWNrYWdlTmFtZVxuXG4gIGdldFBhY2thZ2VOYW1lOiAoc3RhY2spIC0+XG4gICAgcGFja2FnZVBhdGhzID0gQGdldFBhY2thZ2VQYXRoc0J5UGFja2FnZU5hbWUoKVxuICAgIGZvciBwYWNrYWdlTmFtZSwgcGFja2FnZVBhdGggb2YgcGFja2FnZVBhdGhzXG4gICAgICBpZiBwYWNrYWdlUGF0aC5pbmRleE9mKCcuYXRvbS9kZXYvcGFja2FnZXMnKSA+IC0xIG9yIHBhY2thZ2VQYXRoLmluZGV4T2YoJy5hdG9tL3BhY2thZ2VzJykgPiAtMVxuICAgICAgICBwYWNrYWdlUGF0aHNbcGFja2FnZU5hbWVdID0gZnMuYWJzb2x1dGUocGFja2FnZVBhdGgpXG5cbiAgICBmb3IgaSBpbiBbMS4uLnN0YWNrLmxlbmd0aF1cbiAgICAgIHtmaWxlTmFtZX0gPSBzdGFja1tpXVxuXG4gICAgICAjIEVtcHR5IHdoZW4gaXQgd2FzIHJ1biBmcm9tIHRoZSBkZXYgY29uc29sZVxuICAgICAgcmV0dXJuIHVubGVzcyBmaWxlTmFtZVxuXG4gICAgICAjIENvbnRpbnVlIHRvIG5leHQgc3RhY2sgZW50cnkgaWYgY2FsbCBpcyBpbiBub2RlX21vZHVsZXNcbiAgICAgIGNvbnRpbnVlIGlmIGZpbGVOYW1lLmluY2x1ZGVzKFwiI3twYXRoLnNlcH1ub2RlX21vZHVsZXMje3BhdGguc2VwfVwiKVxuXG4gICAgICBmb3IgcGFja2FnZU5hbWUsIHBhY2thZ2VQYXRoIG9mIHBhY2thZ2VQYXRoc1xuICAgICAgICByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKHBhY2thZ2VQYXRoLCBmaWxlTmFtZSlcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VOYW1lIHVubGVzcyAvXlxcLlxcLi8udGVzdChyZWxhdGl2ZVBhdGgpXG5cbiAgICAgIHJldHVybiBcIllvdXIgbG9jYWwgI3twYXRoLmJhc2VuYW1lKGZpbGVOYW1lKX0gZmlsZVwiIGlmIGF0b20uZ2V0VXNlckluaXRTY3JpcHRQYXRoKCkgaXMgZmlsZU5hbWVcblxuICAgIHJldHVyblxuXG4gIGdldFJlcG9Vcmw6IChwYWNrYWdlTmFtZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJlcG8gPSBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpPy5tZXRhZGF0YT8ucmVwb3NpdG9yeVxuICAgIHJlcG9VcmwgPSByZXBvLnVybCA/IHJlcG9cbiAgICByZXBvVXJsLnJlcGxhY2UoL1xcLmdpdCQvLCAnJylcblxuICBjcmVhdGVJc3N1ZVVybDogKHBhY2thZ2VOYW1lLCBkZXByZWNhdGlvbiwgc3RhY2spIC0+XG4gICAgcmVwb1VybCA9IEBnZXRSZXBvVXJsKHBhY2thZ2VOYW1lKVxuICAgIHJldHVybiB1bmxlc3MgcmVwb1VybFxuXG4gICAgdGl0bGUgPSBcIiN7ZGVwcmVjYXRpb24uZ2V0T3JpZ2luTmFtZSgpfSBpcyBkZXByZWNhdGVkLlwiXG4gICAgc3RhY2t0cmFjZSA9IHN0YWNrLm1hcCgoe2Z1bmN0aW9uTmFtZSwgbG9jYXRpb259KSAtPiBcIiN7ZnVuY3Rpb25OYW1lfSAoI3tsb2NhdGlvbn0pXCIpLmpvaW4oXCJcXG5cIilcbiAgICBib2R5ID0gXCIje2RlcHJlY2F0aW9uLmdldE1lc3NhZ2UoKX1cXG5gYGBcXG4je3N0YWNrdHJhY2V9XFxuYGBgXCJcbiAgICBcIiN7cmVwb1VybH0vaXNzdWVzL25ldz90aXRsZT0je2VuY29kZVVSSSh0aXRsZSl9JmJvZHk9I3tlbmNvZGVVUkkoYm9keSl9XCJcblxuICBjcmVhdGVTZWxlY3Rvcklzc3VlVXJsOiAocGFja2FnZU5hbWUsIHRpdGxlLCBib2R5KSAtPlxuICAgIHJlcG9VcmwgPSBAZ2V0UmVwb1VybChwYWNrYWdlTmFtZSlcbiAgICBpZiByZXBvVXJsXG4gICAgICBcIiN7cmVwb1VybH0vaXNzdWVzL25ldz90aXRsZT0je2VuY29kZVVSSSh0aXRsZSl9JmJvZHk9I3tlbmNvZGVVUkkoYm9keSl9XCJcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgdXBkYXRlQ2FsbHM6IC0+XG4gICAgZGVwcmVjYXRpb25zID0gR3JpbS5nZXREZXByZWNhdGlvbnMoKVxuICAgIGRlcHJlY2F0aW9ucy5zb3J0IChhLCBiKSAtPiBiLmdldENhbGxDb3VudCgpIC0gYS5nZXRDYWxsQ291bnQoKVxuICAgIEBsaXN0LmVtcHR5KClcblxuICAgIHBhY2thZ2VEZXByZWNhdGlvbnMgPSB7fVxuICAgIGZvciBkZXByZWNhdGlvbiBpbiBkZXByZWNhdGlvbnNcbiAgICAgIHN0YWNrcyA9IGRlcHJlY2F0aW9uLmdldFN0YWNrcygpXG4gICAgICBzdGFja3Muc29ydCAoYSwgYikgLT4gYi5jYWxsQ291bnQgLSBhLmNhbGxDb3VudFxuICAgICAgZm9yIHN0YWNrIGluIHN0YWNrc1xuICAgICAgICBwYWNrYWdlTmFtZSA9IHN0YWNrLm1ldGFkYXRhPy5wYWNrYWdlTmFtZSA/IChAZ2V0UGFja2FnZU5hbWUoc3RhY2spIG9yICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHBhY2thZ2VEZXByZWNhdGlvbnNbcGFja2FnZU5hbWVdID89IFtdXG4gICAgICAgIHBhY2thZ2VEZXByZWNhdGlvbnNbcGFja2FnZU5hbWVdLnB1c2gge2RlcHJlY2F0aW9uLCBzdGFja31cblxuICAgICMgSSBmZWVsIGd1aWx0eSBhYm91dCB0aGlzIG5lc3RlZCBjb2RlIGNhdGFzdHJvcGhlXG4gICAgaWYgZGVwcmVjYXRpb25zLmxlbmd0aCBpcyAwXG4gICAgICBAbGlzdC5hcHBlbmQgJCQgLT5cbiAgICAgICAgQGxpIGNsYXNzOiAnbGlzdC1pdGVtJywgXCJObyBkZXByZWNhdGVkIGNhbGxzXCJcbiAgICBlbHNlXG4gICAgICBzZWxmID0gdGhpc1xuICAgICAgcGFja2FnZU5hbWVzID0gXy5rZXlzKHBhY2thZ2VEZXByZWNhdGlvbnMpXG4gICAgICBwYWNrYWdlTmFtZXMuc29ydCgpXG4gICAgICBmb3IgcGFja2FnZU5hbWUgaW4gcGFja2FnZU5hbWVzXG4gICAgICAgIEBsaXN0LmFwcGVuZCAkJCAtPlxuICAgICAgICAgIEBsaSBjbGFzczogJ2RlcHJlY2F0aW9uIGxpc3QtbmVzdGVkLWl0ZW0gY29sbGFwc2VkJywgPT5cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdkZXByZWNhdGlvbi1pbmZvIGxpc3QtaXRlbScsID0+XG4gICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAndGV4dC1oaWdobGlnaHQnLCBwYWNrYWdlTmFtZSBvciAnYXRvbSBjb3JlJ1xuICAgICAgICAgICAgICBAc3BhbiBcIiAoI3tfLnBsdXJhbGl6ZShwYWNrYWdlRGVwcmVjYXRpb25zW3BhY2thZ2VOYW1lXS5sZW5ndGgsICdkZXByZWNhdGlvbicpfSlcIlxuXG4gICAgICAgICAgICBAdWwgY2xhc3M6ICdsaXN0JywgPT5cblxuICAgICAgICAgICAgICBpZiBwYWNrYWdlTmFtZSBhbmQgYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdwYWRkZWQnLCA9PlxuICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2J0bi1ncm91cCcsID0+XG4gICAgICAgICAgICAgICAgICAgIEBidXR0b24gY2xhc3M6ICdidG4gY2hlY2stZm9yLXVwZGF0ZScsICdDaGVjayBmb3IgVXBkYXRlJ1xuICAgICAgICAgICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGRpc2FibGUtcGFja2FnZScsICdkYXRhLXBhY2thZ2UtbmFtZSc6IHBhY2thZ2VOYW1lLCAnRGlzYWJsZSBQYWNrYWdlJ1xuXG4gICAgICAgICAgICAgIGZvciB7ZGVwcmVjYXRpb24sIHN0YWNrfSBpbiBwYWNrYWdlRGVwcmVjYXRpb25zW3BhY2thZ2VOYW1lXVxuICAgICAgICAgICAgICAgIEBsaSBjbGFzczogJ2xpc3QtaXRlbSBkZXByZWNhdGlvbi1kZXRhaWwnLCA9PlxuICAgICAgICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICd0ZXh0LXdhcm5pbmcgaWNvbiBpY29uLWFsZXJ0J1xuICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2xpc3QtaXRlbSBkZXByZWNhdGlvbi1tZXNzYWdlJywgPT5cbiAgICAgICAgICAgICAgICAgICAgQHJhdyBtYXJrZWQoZGVwcmVjYXRpb24uZ2V0TWVzc2FnZSgpKVxuXG4gICAgICAgICAgICAgICAgICBpZiBwYWNrYWdlTmFtZSBhbmQgaXNzdWVVcmwgPSBzZWxmLmNyZWF0ZUlzc3VlVXJsKHBhY2thZ2VOYW1lLCBkZXByZWNhdGlvbiwgc3RhY2spXG4gICAgICAgICAgICAgICAgICAgIHJlcG9VcmwgPSBzZWxmLmdldFJlcG9VcmwocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAgICAgICAgIGlzc3VlVGl0bGUgPSBcIiN7ZGVwcmVjYXRpb24uZ2V0T3JpZ2luTmFtZSgpfSBpcyBkZXByZWNhdGVkLlwiXG4gICAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tdG9vbGJhcicsID0+XG4gICAgICAgICAgICAgICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0biBpc3N1ZS11cmwnLCAnZGF0YS1pc3N1ZS10aXRsZSc6IGlzc3VlVGl0bGUsICdkYXRhLXJlcG8tdXJsJzogcmVwb1VybCwgJ2RhdGEtaXNzdWUtdXJsJzogaXNzdWVVcmwsICdSZXBvcnQgSXNzdWUnXG5cbiAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzdGFjay10cmFjZScsID0+XG4gICAgICAgICAgICAgICAgICAgIGZvciB7ZnVuY3Rpb25OYW1lLCBsb2NhdGlvbn0gaW4gc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnc3RhY2stbGluZScsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAc3BhbiBmdW5jdGlvbk5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzcGFuIFwiIC0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBhIGNsYXNzOiAnc3RhY2stbGluZS1sb2NhdGlvbicsIGhyZWY6IGxvY2F0aW9uLCBsb2NhdGlvblxuXG4gIHVwZGF0ZVNlbGVjdG9yczogLT5cbiAgICBAc2VsZWN0b3JMaXN0LmVtcHR5KClcbiAgICBzZWxmID0gdGhpc1xuXG4gICAgZGVwcmVjYXRpb25zQnlQYWNrYWdlTmFtZSA9IEBnZXRTZWxlY3RvckRlcHJlY2F0aW9uc0J5UGFja2FnZU5hbWUoKVxuICAgIGlmIGRlcHJlY2F0aW9uc0J5UGFja2FnZU5hbWUuc2l6ZSBpcyAwXG4gICAgICBAc2VsZWN0b3JMaXN0LmFwcGVuZCAkJCAtPlxuICAgICAgICBAbGkgY2xhc3M6ICdsaXN0LWl0ZW0nLCBcIk5vIGRlcHJlY2F0ZWQgc2VsZWN0b3JzXCJcbiAgICAgIHJldHVyblxuXG4gICAgZm9yIHBhY2thZ2VOYW1lLCBwYWNrYWdlRGVwcmVjYXRpb25zIG9mIGRlcHJlY2F0aW9uc0J5UGFja2FnZU5hbWVcbiAgICAgIEBzZWxlY3Rvckxpc3QuYXBwZW5kICQkIC0+XG4gICAgICAgIEBsaSBjbGFzczogJ2RlcHJlY2F0aW9uIGxpc3QtbmVzdGVkLWl0ZW0gY29sbGFwc2VkJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnZGVwcmVjYXRpb24taW5mbyBsaXN0LWl0ZW0nLCA9PlxuICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICd0ZXh0LWhpZ2hsaWdodCcsIHBhY2thZ2VOYW1lXG5cbiAgICAgICAgICBAdWwgY2xhc3M6ICdsaXN0JywgPT5cbiAgICAgICAgICAgIGlmIHBhY2thZ2VOYW1lIGFuZCBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2UocGFja2FnZU5hbWUpXG4gICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdwYWRkZWQnLCA9PlxuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tZ3JvdXAnLCA9PlxuICAgICAgICAgICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0biBjaGVjay1mb3ItdXBkYXRlJywgJ0NoZWNrIGZvciBVcGRhdGUnXG4gICAgICAgICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGRpc2FibGUtcGFja2FnZScsICdkYXRhLXBhY2thZ2UtbmFtZSc6IHBhY2thZ2VOYW1lLCAnRGlzYWJsZSBQYWNrYWdlJ1xuXG4gICAgICAgICAgICBmb3Ige3BhY2thZ2VQYXRoLCBzb3VyY2VQYXRoLCBkZXByZWNhdGlvbn0gaW4gcGFja2FnZURlcHJlY2F0aW9uc1xuICAgICAgICAgICAgICByZWxhdGl2ZVNvdXJjZVBhdGggPSBwYXRoLnJlbGF0aXZlKHBhY2thZ2VQYXRoLCBzb3VyY2VQYXRoKVxuICAgICAgICAgICAgICBAbGkgY2xhc3M6ICdsaXN0LWl0ZW0gc291cmNlLWZpbGUnLCA9PlxuICAgICAgICAgICAgICAgIEBhIGNsYXNzOiAnc291cmNlLXVybCcsIGhyZWY6IHNvdXJjZVBhdGgsIHJlbGF0aXZlU291cmNlUGF0aFxuICAgICAgICAgICAgICAgIEB1bCBjbGFzczogJ2xpc3QnLCA9PlxuICAgICAgICAgICAgICAgICAgQGxpIGNsYXNzOiAnbGlzdC1pdGVtIGRlcHJlY2F0aW9uLWRldGFpbCcsID0+XG4gICAgICAgICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAndGV4dC13YXJuaW5nIGljb24gaWNvbi1hbGVydCdcbiAgICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2xpc3QtaXRlbSBkZXByZWNhdGlvbi1tZXNzYWdlJywgPT5cbiAgICAgICAgICAgICAgICAgICAgICBAcmF3IG1hcmtlZChkZXByZWNhdGlvbi5tZXNzYWdlKVxuXG4gICAgICAgICAgICAgICAgICAgIGlzc3VlVGl0bGUgPSBcIkRlcHJlY2F0ZWQgc2VsZWN0b3IgaW4gYCN7cmVsYXRpdmVTb3VyY2VQYXRofWBcIlxuICAgICAgICAgICAgICAgICAgICBpc3N1ZUJvZHkgPSBcIkluIGAje3JlbGF0aXZlU291cmNlUGF0aH1gOiBcXG5cXG4je2RlcHJlY2F0aW9uLm1lc3NhZ2V9XCJcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNzdWVVcmwgPSBzZWxmLmNyZWF0ZVNlbGVjdG9ySXNzdWVVcmwocGFja2FnZU5hbWUsIGlzc3VlVGl0bGUsIGlzc3VlQm9keSlcbiAgICAgICAgICAgICAgICAgICAgICByZXBvVXJsID0gc2VsZi5nZXRSZXBvVXJsKHBhY2thZ2VOYW1lKVxuICAgICAgICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tdG9vbGJhcicsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGlzc3VlLXVybCcsICdkYXRhLWlzc3VlLXRpdGxlJzogaXNzdWVUaXRsZSwgJ2RhdGEtcmVwby11cmwnOiByZXBvVXJsLCAnZGF0YS1pc3N1ZS11cmwnOiBpc3N1ZVVybCwgJ1JlcG9ydCBJc3N1ZSdcblxuICBnZXRTZWxlY3RvckRlcHJlY2F0aW9uc0J5UGFja2FnZU5hbWU6IC0+XG4gICAgIyBUT0RPOiBSZW1vdmUgY29uZGl0aW9uYWwgd2hlbiB0aGUgbmV3IFN0eWxlTWFuYWdlciBkZXByZWNhdGlvbiBBUElzIHJlYWNoIHN0YWJsZS5cbiAgICBpZiBhdG9tLnN0eWxlcy5nZXREZXByZWNhdGlvbnM/XG4gICAgICBkZXByZWNhdGlvbnNCeVBhY2thZ2VOYW1lID0ge31cbiAgICAgIGZvciBzb3VyY2VQYXRoLCBkZXByZWNhdGlvbiBvZiBhdG9tLnN0eWxlcy5nZXREZXByZWNhdGlvbnMoKVxuICAgICAgICBjb21wb25lbnRzID0gc291cmNlUGF0aC5zcGxpdChwYXRoLnNlcClcbiAgICAgICAgcGFja2FnZXNDb21wb25lbnRJbmRleCA9IGNvbXBvbmVudHMuaW5kZXhPZigncGFja2FnZXMnKVxuICAgICAgICBpZiBwYWNrYWdlc0NvbXBvbmVudEluZGV4IGlzbnQgLTFcbiAgICAgICAgICBwYWNrYWdlTmFtZSA9IGNvbXBvbmVudHNbcGFja2FnZXNDb21wb25lbnRJbmRleCArIDFdXG4gICAgICAgICAgcGFja2FnZVBhdGggPSBjb21wb25lbnRzLnNsaWNlKDAsIHBhY2thZ2VzQ29tcG9uZW50SW5kZXggKyAxKS5qb2luKHBhdGguc2VwKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGFja2FnZU5hbWUgPSAnT3RoZXInICMgY291bGQgYmUgQXRvbSBDb3JlIG9yIHRoZSBwZXJzb25hbCBzdHlsZSBzaGVldFxuICAgICAgICAgIHBhY2thZ2VQYXRoID0gJydcblxuICAgICAgICBkZXByZWNhdGlvbnNCeVBhY2thZ2VOYW1lW3BhY2thZ2VOYW1lXSA/PSBbXVxuICAgICAgICBkZXByZWNhdGlvbnNCeVBhY2thZ2VOYW1lW3BhY2thZ2VOYW1lXS5wdXNoKHtwYWNrYWdlUGF0aCwgc291cmNlUGF0aCwgZGVwcmVjYXRpb259KVxuICAgICAgZGVwcmVjYXRpb25zQnlQYWNrYWdlTmFtZVxuICAgIGVsc2VcbiAgICAgIHt9XG4iXX0=
