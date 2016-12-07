(function() {
  var FindParentDir, Grim, TextEditor, TextEditorElement, TokenizedBuffer, _, addCustomMatchers, clipboard, emitObject, ensureNoDeprecatedFunctionCalls, ensureNoDeprecatedStylesheets, fixturePackagesPath, fs, grimDeprecationsSnapshot, jasmineStyle, packageMetadata, path, pathwatcher, specDirectory, specPackageName, specPackagePath, specProjectPath, stylesDeprecationsSnapshot, testPaths, warnIfLeakingPathSubscriptions,
    slice = [].slice;

  require('jasmine-json');

  require('../src/window');

  require('../vendor/jasmine-jquery');

  path = require('path');

  _ = require('underscore-plus');

  fs = require('fs-plus');

  Grim = require('grim');

  pathwatcher = require('pathwatcher');

  FindParentDir = require('find-parent-dir');

  TextEditor = require('../src/text-editor');

  TextEditorElement = require('../src/text-editor-element');

  TokenizedBuffer = require('../src/tokenized-buffer');

  clipboard = require('../src/safe-clipboard');

  jasmineStyle = document.createElement('style');

  jasmineStyle.textContent = atom.themes.loadStylesheet(atom.themes.resolveStylesheet('../static/jasmine'));

  document.head.appendChild(jasmineStyle);

  fixturePackagesPath = path.resolve(__dirname, './fixtures/packages');

  atom.packages.packageDirPaths.unshift(fixturePackagesPath);

  document.querySelector('html').style.overflow = 'auto';

  document.body.style.overflow = 'auto';

  Set.prototype.jasmineToString = function() {
    var first, result;
    result = "Set {";
    first = true;
    this.forEach(function(element) {
      if (!first) {
        result += ", ";
      }
      return result += element.toString();
    });
    first = false;
    return result + "}";
  };

  Set.prototype.isEqual = function(other) {
    var next, values;
    if (other instanceof Set) {
      if (this.size !== other.size) {
        return false;
      }
      values = this.values();
      while (!(next = values.next()).done) {
        if (!other.has(next.value)) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  };

  jasmine.getEnv().addEqualityTester(_.isEqual);

  if (process.env.CI) {
    jasmine.getEnv().defaultTimeoutInterval = 60000;
  } else {
    jasmine.getEnv().defaultTimeoutInterval = 5000;
  }

  testPaths = atom.getLoadSettings().testPaths;

  if (specPackagePath = FindParentDir.sync(testPaths[0], 'package.json')) {
    packageMetadata = require(path.join(specPackagePath, 'package.json'));
    specPackageName = packageMetadata.name;
  }

  if (specDirectory = FindParentDir.sync(testPaths[0], 'fixtures')) {
    specProjectPath = path.join(specDirectory, 'fixtures');
  } else {
    specProjectPath = path.join(__dirname, 'fixtures');
  }

  beforeEach(function() {
    var clipboardContent, resolvePackagePath, spy;
    atom.project.setPaths([specProjectPath]);
    window.resetTimeouts();
    spyOn(_._, "now").andCallFake(function() {
      return window.now;
    });
    spyOn(window, "setTimeout").andCallFake(window.fakeSetTimeout);
    spyOn(window, "clearTimeout").andCallFake(window.fakeClearTimeout);
    spy = spyOn(atom.packages, 'resolvePackagePath').andCallFake(function(packageName) {
      if (specPackageName && packageName === specPackageName) {
        return resolvePackagePath(specPackagePath);
      } else {
        return resolvePackagePath(packageName);
      }
    });
    resolvePackagePath = _.bind(spy.originalValue, atom.packages);
    spyOn(atom.menu, 'sendToBrowserProcess');
    atom.config.set("core.destroyEmptyPanes", false);
    atom.config.set("editor.fontFamily", "Courier");
    atom.config.set("editor.fontSize", 16);
    atom.config.set("editor.autoIndent", false);
    atom.config.set("core.disabledPackages", ["package-that-throws-an-exception", "package-with-broken-package-json", "package-with-broken-keymap"]);
    advanceClock(1000);
    window.setTimeout.reset();
    TextEditorElement.prototype.setUpdatedSynchronously(true);
    spyOn(pathwatcher.File.prototype, "detectResurrectionAfterDelay").andCallFake(function() {
      return this.detectResurrection();
    });
    spyOn(TextEditor.prototype, "shouldPromptToSave").andReturn(false);
    TokenizedBuffer.prototype.chunkSize = 2e308;
    spyOn(TokenizedBuffer.prototype, "tokenizeInBackground").andCallFake(function() {
      return this.tokenizeNextChunk();
    });
    clipboardContent = 'initial clipboard content';
    spyOn(clipboard, 'writeText').andCallFake(function(text) {
      return clipboardContent = text;
    });
    spyOn(clipboard, 'readText').andCallFake(function() {
      return clipboardContent;
    });
    return addCustomMatchers(this);
  });

  afterEach(function() {
    ensureNoDeprecatedFunctionCalls();
    ensureNoDeprecatedStylesheets();
    atom.reset();
    if (!window.debugContent) {
      document.getElementById('jasmine-content').innerHTML = '';
    }
    warnIfLeakingPathSubscriptions();
    return waits(0);
  });

  warnIfLeakingPathSubscriptions = function() {
    var watchedPaths;
    watchedPaths = pathwatcher.getWatchedPaths();
    if (watchedPaths.length > 0) {
      console.error("WARNING: Leaking subscriptions for paths: " + watchedPaths.join(", "));
    }
    return pathwatcher.closeAllWatchers();
  };

  ensureNoDeprecatedFunctionCalls = function() {
    var deprecations, error, originalPrepareStackTrace;
    deprecations = _.clone(Grim.getDeprecations());
    Grim.clearDeprecations();
    if (deprecations.length > 0) {
      originalPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = function(error, stack) {
        var deprecation, functionName, i, j, k, len, len1, len2, location, output, ref, ref1;
        output = [];
        for (i = 0, len = deprecations.length; i < len; i++) {
          deprecation = deprecations[i];
          output.push(deprecation.originName + " is deprecated. " + deprecation.message);
          output.push(_.multiplyString("-", output[output.length - 1].length));
          ref = deprecation.getStacks();
          for (j = 0, len1 = ref.length; j < len1; j++) {
            stack = ref[j];
            for (k = 0, len2 = stack.length; k < len2; k++) {
              ref1 = stack[k], functionName = ref1.functionName, location = ref1.location;
              output.push(functionName + " -- " + location);
            }
          }
          output.push("");
        }
        return output.join("\n");
      };
      error = new Error("Deprecated function(s) " + (deprecations.map(function(arg) {
        var originName;
        originName = arg.originName;
        return originName;
      }).join(', ')) + ") were called.");
      error.stack;
      Error.prepareStackTrace = originalPrepareStackTrace;
      throw error;
    }
  };

  ensureNoDeprecatedStylesheets = function() {
    var deprecation, deprecations, results, sourcePath, title;
    deprecations = _.clone(atom.styles.getDeprecations());
    atom.styles.clearDeprecations();
    results = [];
    for (sourcePath in deprecations) {
      deprecation = deprecations[sourcePath];
      title = sourcePath !== 'undefined' ? "Deprecated stylesheet at '" + sourcePath + "':" : "Deprecated stylesheet:";
      throw new Error(title + "\n" + deprecation.message);
    }
    return results;
  };

  emitObject = jasmine.StringPrettyPrinter.prototype.emitObject;

  jasmine.StringPrettyPrinter.prototype.emitObject = function(obj) {
    if (obj.inspect) {
      return this.append(obj.inspect());
    } else {
      return emitObject.call(this, obj);
    }
  };

  jasmine.unspy = function(object, methodName) {
    if (!object[methodName].hasOwnProperty('originalValue')) {
      throw new Error("Not a spy");
    }
    return object[methodName] = object[methodName].originalValue;
  };

  jasmine.attachToDOM = function(element) {
    var jasmineContent;
    jasmineContent = document.querySelector('#jasmine-content');
    if (!jasmineContent.contains(element)) {
      return jasmineContent.appendChild(element);
    }
  };

  grimDeprecationsSnapshot = null;

  stylesDeprecationsSnapshot = null;

  jasmine.snapshotDeprecations = function() {
    grimDeprecationsSnapshot = _.clone(Grim.deprecations);
    return stylesDeprecationsSnapshot = _.clone(atom.styles.deprecationsBySourcePath);
  };

  jasmine.restoreDeprecationsSnapshot = function() {
    Grim.deprecations = grimDeprecationsSnapshot;
    return atom.styles.deprecationsBySourcePath = stylesDeprecationsSnapshot;
  };

  jasmine.useRealClock = function() {
    jasmine.unspy(window, 'setTimeout');
    jasmine.unspy(window, 'clearTimeout');
    return jasmine.unspy(_._, 'now');
  };

  jasmine.useMockClock = function() {
    spyOn(window, 'setInterval').andCallFake(fakeSetInterval);
    return spyOn(window, 'clearInterval').andCallFake(fakeClearInterval);
  };

  addCustomMatchers = function(spec) {
    return spec.addMatchers({
      toBeInstanceOf: function(expected) {
        var beOrNotBe;
        beOrNotBe = this.isNot ? "not be" : "be";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to " + beOrNotBe + " instance of " + expected.name + " class";
          };
        })(this);
        return this.actual instanceof expected;
      },
      toHaveLength: function(expected) {
        var haveOrNotHave;
        if (this.actual == null) {
          this.message = (function(_this) {
            return function() {
              return "Expected object " + _this.actual + " has no length method";
            };
          })(this);
          return false;
        } else {
          haveOrNotHave = this.isNot ? "not have" : "have";
          this.message = (function(_this) {
            return function() {
              return "Expected object with length " + _this.actual.length + " to " + haveOrNotHave + " length " + expected;
            };
          })(this);
          return this.actual.length === expected;
        }
      },
      toExistOnDisk: function(expected) {
        var toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        this.message = function() {
          return "Expected path '" + this.actual + "' " + toOrNotTo + " exist.";
        };
        return fs.existsSync(this.actual);
      },
      toHaveFocus: function() {
        var element, toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        if (!document.hasFocus()) {
          console.error("Specs will fail because the Dev Tools have focus. To fix this close the Dev Tools or click the spec runner.");
        }
        this.message = function() {
          return "Expected element '" + this.actual + "' or its descendants " + toOrNotTo + " have focus.";
        };
        element = this.actual;
        if (element.jquery) {
          element = element.get(0);
        }
        return element === document.activeElement || element.contains(document.activeElement);
      },
      toShow: function() {
        var element, ref, toOrNotTo;
        toOrNotTo = this.isNot && "not to" || "to";
        element = this.actual;
        if (element.jquery) {
          element = element.get(0);
        }
        this.message = function() {
          return "Expected element '" + element + "' or its descendants " + toOrNotTo + " show.";
        };
        return (ref = element.style.display) === 'block' || ref === 'inline-block' || ref === 'static' || ref === 'fixed';
      },
      toEqualPath: function(expected) {
        var actualPath, expectedPath;
        actualPath = path.normalize(this.actual);
        expectedPath = path.normalize(expected);
        this.message = function() {
          return "Expected path '" + actualPath + "' to be equal to '" + expectedPath + "'.";
        };
        return actualPath === expectedPath;
      }
    });
  };

  window.waitsForPromise = function() {
    var args, fn, label, ref, shouldReject, timeout;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    label = null;
    if (args.length > 1) {
      ref = args[0], shouldReject = ref.shouldReject, timeout = ref.timeout, label = ref.label;
    } else {
      shouldReject = false;
    }
    if (label == null) {
      label = 'promise to be resolved or rejected';
    }
    fn = _.last(args);
    return window.waitsFor(label, timeout, function(moveOn) {
      var promise;
      promise = fn();
      if (shouldReject) {
        promise["catch"].call(promise, moveOn);
        return promise.then(function() {
          jasmine.getEnv().currentSpec.fail("Expected promise to be rejected, but it was resolved");
          return moveOn();
        });
      } else {
        promise.then(moveOn);
        return promise["catch"].call(promise, function(error) {
          jasmine.getEnv().currentSpec.fail("Expected promise to be resolved, but it was rejected with: " + (error != null ? error.message : void 0) + " " + (jasmine.pp(error)));
          return moveOn();
        });
      }
    });
  };

  window.resetTimeouts = function() {
    window.now = 0;
    window.timeoutCount = 0;
    window.intervalCount = 0;
    window.timeouts = [];
    return window.intervalTimeouts = {};
  };

  window.fakeSetTimeout = function(callback, ms) {
    var id;
    if (ms == null) {
      ms = 0;
    }
    id = ++window.timeoutCount;
    window.timeouts.push([id, window.now + ms, callback]);
    return id;
  };

  window.fakeClearTimeout = function(idToClear) {
    return window.timeouts = window.timeouts.filter(function(arg) {
      var id;
      id = arg[0];
      return id !== idToClear;
    });
  };

  window.fakeSetInterval = function(callback, ms) {
    var action, id;
    id = ++window.intervalCount;
    action = function() {
      callback();
      return window.intervalTimeouts[id] = window.fakeSetTimeout(action, ms);
    };
    window.intervalTimeouts[id] = window.fakeSetTimeout(action, ms);
    return id;
  };

  window.fakeClearInterval = function(idToClear) {
    return window.fakeClearTimeout(this.intervalTimeouts[idToClear]);
  };

  window.advanceClock = function(delta) {
    var callback, callbacks, i, len, results;
    if (delta == null) {
      delta = 1;
    }
    window.now += delta;
    callbacks = [];
    window.timeouts = window.timeouts.filter(function(arg) {
      var callback, id, strikeTime;
      id = arg[0], strikeTime = arg[1], callback = arg[2];
      if (strikeTime <= window.now) {
        callbacks.push(callback);
        return false;
      } else {
        return true;
      }
    });
    results = [];
    for (i = 0, len = callbacks.length; i < len; i++) {
      callback = callbacks[i];
      results.push(callback());
    }
    return results;
  };

  exports.mockLocalStorage = function() {
    var items;
    items = {};
    spyOn(global.localStorage, 'setItem').andCallFake(function(key, item) {
      items[key] = item.toString();
      return void 0;
    });
    spyOn(global.localStorage, 'getItem').andCallFake(function(key) {
      var ref;
      return (ref = items[key]) != null ? ref : null;
    });
    return spyOn(global.localStorage, 'removeItem').andCallFake(function(key) {
      delete items[key];
      return void 0;
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvc3BlYy1oZWxwZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4WkFBQTtJQUFBOztFQUFBLE9BQUEsQ0FBUSxjQUFSOztFQUNBLE9BQUEsQ0FBUSxlQUFSOztFQUNBLE9BQUEsQ0FBUSwwQkFBUjs7RUFDQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFdBQUEsR0FBYyxPQUFBLENBQVEsYUFBUjs7RUFDZCxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxpQkFBUjs7RUFFaEIsVUFBQSxHQUFhLE9BQUEsQ0FBUSxvQkFBUjs7RUFDYixpQkFBQSxHQUFvQixPQUFBLENBQVEsNEJBQVI7O0VBQ3BCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHlCQUFSOztFQUNsQixTQUFBLEdBQVksT0FBQSxDQUFRLHVCQUFSOztFQUVaLFlBQUEsR0FBZSxRQUFRLENBQUMsYUFBVCxDQUF1QixPQUF2Qjs7RUFDZixZQUFZLENBQUMsV0FBYixHQUEyQixJQUFJLENBQUMsTUFBTSxDQUFDLGNBQVosQ0FBMkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBWixDQUE4QixtQkFBOUIsQ0FBM0I7O0VBQzNCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBZCxDQUEwQixZQUExQjs7RUFFQSxtQkFBQSxHQUFzQixJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsRUFBd0IscUJBQXhCOztFQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUE5QixDQUFzQyxtQkFBdEM7O0VBRUEsUUFBUSxDQUFDLGFBQVQsQ0FB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QTFDO0VBRHlCOztFQUczQixNQUFNLENBQUMsWUFBUCxHQUFzQixTQUFDLEtBQUQ7QUFDcEIsUUFBQTs7TUFEcUIsUUFBTTs7SUFDM0IsTUFBTSxDQUFDLEdBQVAsSUFBYztJQUNkLFNBQUEsR0FBWTtJQUVaLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBaEIsQ0FBdUIsU0FBQyxHQUFEO0FBQ3ZDLFVBQUE7TUFEeUMsYUFBSSxxQkFBWTtNQUN6RCxJQUFHLFVBQUEsSUFBYyxNQUFNLENBQUMsR0FBeEI7UUFDRSxTQUFTLENBQUMsSUFBVixDQUFlLFFBQWY7ZUFDQSxNQUZGO09BQUEsTUFBQTtlQUlFLEtBSkY7O0lBRHVDLENBQXZCO0FBT2xCO1NBQUEsMkNBQUE7O21CQUFBLFFBQUEsQ0FBQTtBQUFBOztFQVhvQjs7RUFhdEIsT0FBTyxDQUFDLGdCQUFSLEdBQTJCLFNBQUE7QUFDekIsUUFBQTtJQUFBLEtBQUEsR0FBUTtJQUNSLEtBQUEsQ0FBTSxNQUFNLENBQUMsWUFBYixFQUEyQixTQUEzQixDQUFxQyxDQUFDLFdBQXRDLENBQWtELFNBQUMsR0FBRCxFQUFNLElBQU47TUFBZSxLQUFNLENBQUEsR0FBQSxDQUFOLEdBQWEsSUFBSSxDQUFDLFFBQUwsQ0FBQTthQUFpQjtJQUE3QyxDQUFsRDtJQUNBLEtBQUEsQ0FBTSxNQUFNLENBQUMsWUFBYixFQUEyQixTQUEzQixDQUFxQyxDQUFDLFdBQXRDLENBQWtELFNBQUMsR0FBRDtBQUFTLFVBQUE7Z0RBQWE7SUFBdEIsQ0FBbEQ7V0FDQSxLQUFBLENBQU0sTUFBTSxDQUFDLFlBQWIsRUFBMkIsWUFBM0IsQ0FBd0MsQ0FBQyxXQUF6QyxDQUFxRCxTQUFDLEdBQUQ7TUFBUyxPQUFPLEtBQU0sQ0FBQSxHQUFBO2FBQU07SUFBNUIsQ0FBckQ7RUFKeUI7QUF0UzNCIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSAnamFzbWluZS1qc29uJ1xucmVxdWlyZSAnLi4vc3JjL3dpbmRvdydcbnJlcXVpcmUgJy4uL3ZlbmRvci9qYXNtaW5lLWpxdWVyeSdcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbkdyaW0gPSByZXF1aXJlICdncmltJ1xucGF0aHdhdGNoZXIgPSByZXF1aXJlICdwYXRod2F0Y2hlcidcbkZpbmRQYXJlbnREaXIgPSByZXF1aXJlICdmaW5kLXBhcmVudC1kaXInXG5cblRleHRFZGl0b3IgPSByZXF1aXJlICcuLi9zcmMvdGV4dC1lZGl0b3InXG5UZXh0RWRpdG9yRWxlbWVudCA9IHJlcXVpcmUgJy4uL3NyYy90ZXh0LWVkaXRvci1lbGVtZW50J1xuVG9rZW5pemVkQnVmZmVyID0gcmVxdWlyZSAnLi4vc3JjL3Rva2VuaXplZC1idWZmZXInXG5jbGlwYm9hcmQgPSByZXF1aXJlICcuLi9zcmMvc2FmZS1jbGlwYm9hcmQnXG5cbmphc21pbmVTdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbmphc21pbmVTdHlsZS50ZXh0Q29udGVudCA9IGF0b20udGhlbWVzLmxvYWRTdHlsZXNoZWV0KGF0b20udGhlbWVzLnJlc29sdmVTdHlsZXNoZWV0KCcuLi9zdGF0aWMvamFzbWluZScpKVxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChqYXNtaW5lU3R5bGUpXG5cbmZpeHR1cmVQYWNrYWdlc1BhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9maXh0dXJlcy9wYWNrYWdlcycpXG5hdG9tLnBhY2thZ2VzLnBhY2thZ2VEaXJQYXRocy51bnNoaWZ0KGZpeHR1cmVQYWNrYWdlc1BhdGgpXG5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2h0bWwnKS5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJ1xuZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJ1xuXG5TZXQucHJvdG90eXBlLmphc21pbmVUb1N0cmluZyA9IC0+XG4gIHJlc3VsdCA9IFwiU2V0IHtcIlxuICBmaXJzdCA9IHRydWVcbiAgQGZvckVhY2ggKGVsZW1lbnQpIC0+XG4gICAgcmVzdWx0ICs9IFwiLCBcIiB1bmxlc3MgZmlyc3RcbiAgICByZXN1bHQgKz0gZWxlbWVudC50b1N0cmluZygpXG4gIGZpcnN0ID0gZmFsc2VcbiAgcmVzdWx0ICsgXCJ9XCJcblxuU2V0LnByb3RvdHlwZS5pc0VxdWFsID0gKG90aGVyKSAtPlxuICBpZiBvdGhlciBpbnN0YW5jZW9mIFNldFxuICAgIHJldHVybiBmYWxzZSBpZiBAc2l6ZSBpc250IG90aGVyLnNpemVcbiAgICB2YWx1ZXMgPSBAdmFsdWVzKClcbiAgICB1bnRpbCAobmV4dCA9IHZhbHVlcy5uZXh0KCkpLmRvbmVcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgb3RoZXIuaGFzKG5leHQudmFsdWUpXG4gICAgdHJ1ZVxuICBlbHNlXG4gICAgZmFsc2VcblxuamFzbWluZS5nZXRFbnYoKS5hZGRFcXVhbGl0eVRlc3RlcihfLmlzRXF1YWwpICMgVXNlIHVuZGVyc2NvcmUncyBkZWZpbml0aW9uIG9mIGVxdWFsaXR5IGZvciB0b0VxdWFsIGFzc2VydGlvbnNcblxuaWYgcHJvY2Vzcy5lbnYuQ0lcbiAgamFzbWluZS5nZXRFbnYoKS5kZWZhdWx0VGltZW91dEludGVydmFsID0gNjAwMDBcbmVsc2VcbiAgamFzbWluZS5nZXRFbnYoKS5kZWZhdWx0VGltZW91dEludGVydmFsID0gNTAwMFxuXG57dGVzdFBhdGhzfSA9IGF0b20uZ2V0TG9hZFNldHRpbmdzKClcblxuaWYgc3BlY1BhY2thZ2VQYXRoID0gRmluZFBhcmVudERpci5zeW5jKHRlc3RQYXRoc1swXSwgJ3BhY2thZ2UuanNvbicpXG4gIHBhY2thZ2VNZXRhZGF0YSA9IHJlcXVpcmUocGF0aC5qb2luKHNwZWNQYWNrYWdlUGF0aCwgJ3BhY2thZ2UuanNvbicpKVxuICBzcGVjUGFja2FnZU5hbWUgPSBwYWNrYWdlTWV0YWRhdGEubmFtZVxuXG5pZiBzcGVjRGlyZWN0b3J5ID0gRmluZFBhcmVudERpci5zeW5jKHRlc3RQYXRoc1swXSwgJ2ZpeHR1cmVzJylcbiAgc3BlY1Byb2plY3RQYXRoID0gcGF0aC5qb2luKHNwZWNEaXJlY3RvcnksICdmaXh0dXJlcycpXG5lbHNlXG4gIHNwZWNQcm9qZWN0UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycpXG5cbmJlZm9yZUVhY2ggLT5cbiAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtzcGVjUHJvamVjdFBhdGhdKVxuXG4gIHdpbmRvdy5yZXNldFRpbWVvdXRzKClcbiAgc3B5T24oXy5fLCBcIm5vd1wiKS5hbmRDYWxsRmFrZSAtPiB3aW5kb3cubm93XG4gIHNweU9uKHdpbmRvdywgXCJzZXRUaW1lb3V0XCIpLmFuZENhbGxGYWtlIHdpbmRvdy5mYWtlU2V0VGltZW91dFxuICBzcHlPbih3aW5kb3csIFwiY2xlYXJUaW1lb3V0XCIpLmFuZENhbGxGYWtlIHdpbmRvdy5mYWtlQ2xlYXJUaW1lb3V0XG5cbiAgc3B5ID0gc3B5T24oYXRvbS5wYWNrYWdlcywgJ3Jlc29sdmVQYWNrYWdlUGF0aCcpLmFuZENhbGxGYWtlIChwYWNrYWdlTmFtZSkgLT5cbiAgICBpZiBzcGVjUGFja2FnZU5hbWUgYW5kIHBhY2thZ2VOYW1lIGlzIHNwZWNQYWNrYWdlTmFtZVxuICAgICAgcmVzb2x2ZVBhY2thZ2VQYXRoKHNwZWNQYWNrYWdlUGF0aClcbiAgICBlbHNlXG4gICAgICByZXNvbHZlUGFja2FnZVBhdGgocGFja2FnZU5hbWUpXG4gIHJlc29sdmVQYWNrYWdlUGF0aCA9IF8uYmluZChzcHkub3JpZ2luYWxWYWx1ZSwgYXRvbS5wYWNrYWdlcylcblxuICAjIHByZXZlbnQgc3BlY3MgZnJvbSBtb2RpZnlpbmcgQXRvbSdzIG1lbnVzXG4gIHNweU9uKGF0b20ubWVudSwgJ3NlbmRUb0Jyb3dzZXJQcm9jZXNzJylcblxuICAjIHJlc2V0IGNvbmZpZyBiZWZvcmUgZWFjaCBzcGVjXG4gIGF0b20uY29uZmlnLnNldCBcImNvcmUuZGVzdHJveUVtcHR5UGFuZXNcIiwgZmFsc2VcbiAgYXRvbS5jb25maWcuc2V0IFwiZWRpdG9yLmZvbnRGYW1pbHlcIiwgXCJDb3VyaWVyXCJcbiAgYXRvbS5jb25maWcuc2V0IFwiZWRpdG9yLmZvbnRTaXplXCIsIDE2XG4gIGF0b20uY29uZmlnLnNldCBcImVkaXRvci5hdXRvSW5kZW50XCIsIGZhbHNlXG4gIGF0b20uY29uZmlnLnNldCBcImNvcmUuZGlzYWJsZWRQYWNrYWdlc1wiLCBbXCJwYWNrYWdlLXRoYXQtdGhyb3dzLWFuLWV4Y2VwdGlvblwiLFxuICAgIFwicGFja2FnZS13aXRoLWJyb2tlbi1wYWNrYWdlLWpzb25cIiwgXCJwYWNrYWdlLXdpdGgtYnJva2VuLWtleW1hcFwiXVxuICBhZHZhbmNlQ2xvY2soMTAwMClcbiAgd2luZG93LnNldFRpbWVvdXQucmVzZXQoKVxuXG4gICMgbWFrZSBlZGl0b3IgZGlzcGxheSB1cGRhdGVzIHN5bmNocm9ub3VzXG4gIFRleHRFZGl0b3JFbGVtZW50OjpzZXRVcGRhdGVkU3luY2hyb25vdXNseSh0cnVlKVxuXG4gIHNweU9uKHBhdGh3YXRjaGVyLkZpbGUucHJvdG90eXBlLCBcImRldGVjdFJlc3VycmVjdGlvbkFmdGVyRGVsYXlcIikuYW5kQ2FsbEZha2UgLT4gQGRldGVjdFJlc3VycmVjdGlvbigpXG4gIHNweU9uKFRleHRFZGl0b3IucHJvdG90eXBlLCBcInNob3VsZFByb21wdFRvU2F2ZVwiKS5hbmRSZXR1cm4gZmFsc2VcblxuICAjIG1ha2UgdG9rZW5pemF0aW9uIHN5bmNocm9ub3VzXG4gIFRva2VuaXplZEJ1ZmZlci5wcm90b3R5cGUuY2h1bmtTaXplID0gSW5maW5pdHlcbiAgc3B5T24oVG9rZW5pemVkQnVmZmVyLnByb3RvdHlwZSwgXCJ0b2tlbml6ZUluQmFja2dyb3VuZFwiKS5hbmRDYWxsRmFrZSAtPiBAdG9rZW5pemVOZXh0Q2h1bmsoKVxuXG4gIGNsaXBib2FyZENvbnRlbnQgPSAnaW5pdGlhbCBjbGlwYm9hcmQgY29udGVudCdcbiAgc3B5T24oY2xpcGJvYXJkLCAnd3JpdGVUZXh0JykuYW5kQ2FsbEZha2UgKHRleHQpIC0+IGNsaXBib2FyZENvbnRlbnQgPSB0ZXh0XG4gIHNweU9uKGNsaXBib2FyZCwgJ3JlYWRUZXh0JykuYW5kQ2FsbEZha2UgLT4gY2xpcGJvYXJkQ29udGVudFxuXG4gIGFkZEN1c3RvbU1hdGNoZXJzKHRoaXMpXG5cbmFmdGVyRWFjaCAtPlxuICBlbnN1cmVOb0RlcHJlY2F0ZWRGdW5jdGlvbkNhbGxzKClcbiAgZW5zdXJlTm9EZXByZWNhdGVkU3R5bGVzaGVldHMoKVxuICBhdG9tLnJlc2V0KClcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2phc21pbmUtY29udGVudCcpLmlubmVySFRNTCA9ICcnIHVubGVzcyB3aW5kb3cuZGVidWdDb250ZW50XG4gIHdhcm5JZkxlYWtpbmdQYXRoU3Vic2NyaXB0aW9ucygpXG4gIHdhaXRzKDApICMgeWllbGQgdG8gdWkgdGhyZWFkIHRvIG1ha2Ugc2NyZWVuIHVwZGF0ZSBtb3JlIGZyZXF1ZW50bHlcblxud2FybklmTGVha2luZ1BhdGhTdWJzY3JpcHRpb25zID0gLT5cbiAgd2F0Y2hlZFBhdGhzID0gcGF0aHdhdGNoZXIuZ2V0V2F0Y2hlZFBhdGhzKClcbiAgaWYgd2F0Y2hlZFBhdGhzLmxlbmd0aCA+IDBcbiAgICBjb25zb2xlLmVycm9yKFwiV0FSTklORzogTGVha2luZyBzdWJzY3JpcHRpb25zIGZvciBwYXRoczogXCIgKyB3YXRjaGVkUGF0aHMuam9pbihcIiwgXCIpKVxuICBwYXRod2F0Y2hlci5jbG9zZUFsbFdhdGNoZXJzKClcblxuZW5zdXJlTm9EZXByZWNhdGVkRnVuY3Rpb25DYWxscyA9IC0+XG4gIGRlcHJlY2F0aW9ucyA9IF8uY2xvbmUoR3JpbS5nZXREZXByZWNhdGlvbnMoKSlcbiAgR3JpbS5jbGVhckRlcHJlY2F0aW9ucygpXG4gIGlmIGRlcHJlY2F0aW9ucy5sZW5ndGggPiAwXG4gICAgb3JpZ2luYWxQcmVwYXJlU3RhY2tUcmFjZSA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlXG4gICAgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyb3IsIHN0YWNrKSAtPlxuICAgICAgb3V0cHV0ID0gW11cbiAgICAgIGZvciBkZXByZWNhdGlvbiBpbiBkZXByZWNhdGlvbnNcbiAgICAgICAgb3V0cHV0LnB1c2ggXCIje2RlcHJlY2F0aW9uLm9yaWdpbk5hbWV9IGlzIGRlcHJlY2F0ZWQuICN7ZGVwcmVjYXRpb24ubWVzc2FnZX1cIlxuICAgICAgICBvdXRwdXQucHVzaCBfLm11bHRpcGx5U3RyaW5nKFwiLVwiLCBvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdLmxlbmd0aClcbiAgICAgICAgZm9yIHN0YWNrIGluIGRlcHJlY2F0aW9uLmdldFN0YWNrcygpXG4gICAgICAgICAgZm9yIHtmdW5jdGlvbk5hbWUsIGxvY2F0aW9ufSBpbiBzdGFja1xuICAgICAgICAgICAgb3V0cHV0LnB1c2ggXCIje2Z1bmN0aW9uTmFtZX0gLS0gI3tsb2NhdGlvbn1cIlxuICAgICAgICBvdXRwdXQucHVzaCBcIlwiXG4gICAgICBvdXRwdXQuam9pbihcIlxcblwiKVxuXG4gICAgZXJyb3IgPSBuZXcgRXJyb3IoXCJEZXByZWNhdGVkIGZ1bmN0aW9uKHMpICN7ZGVwcmVjYXRpb25zLm1hcCgoe29yaWdpbk5hbWV9KSAtPiBvcmlnaW5OYW1lKS5qb2luICcsICd9KSB3ZXJlIGNhbGxlZC5cIilcbiAgICBlcnJvci5zdGFja1xuICAgIEVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gb3JpZ2luYWxQcmVwYXJlU3RhY2tUcmFjZVxuICAgIHRocm93IGVycm9yXG5cbmVuc3VyZU5vRGVwcmVjYXRlZFN0eWxlc2hlZXRzID0gLT5cbiAgZGVwcmVjYXRpb25zID0gXy5jbG9uZShhdG9tLnN0eWxlcy5nZXREZXByZWNhdGlvbnMoKSlcbiAgYXRvbS5zdHlsZXMuY2xlYXJEZXByZWNhdGlvbnMoKVxuICBmb3Igc291cmNlUGF0aCwgZGVwcmVjYXRpb24gb2YgZGVwcmVjYXRpb25zXG4gICAgdGl0bGUgPVxuICAgICAgaWYgc291cmNlUGF0aCBpc250ICd1bmRlZmluZWQnXG4gICAgICAgIFwiRGVwcmVjYXRlZCBzdHlsZXNoZWV0IGF0ICcje3NvdXJjZVBhdGh9JzpcIlxuICAgICAgZWxzZVxuICAgICAgICBcIkRlcHJlY2F0ZWQgc3R5bGVzaGVldDpcIlxuICAgIHRocm93IG5ldyBFcnJvcihcIiN7dGl0bGV9XFxuI3tkZXByZWNhdGlvbi5tZXNzYWdlfVwiKVxuXG5lbWl0T2JqZWN0ID0gamFzbWluZS5TdHJpbmdQcmV0dHlQcmludGVyLnByb3RvdHlwZS5lbWl0T2JqZWN0XG5qYXNtaW5lLlN0cmluZ1ByZXR0eVByaW50ZXIucHJvdG90eXBlLmVtaXRPYmplY3QgPSAob2JqKSAtPlxuICBpZiBvYmouaW5zcGVjdFxuICAgIEBhcHBlbmQgb2JqLmluc3BlY3QoKVxuICBlbHNlXG4gICAgZW1pdE9iamVjdC5jYWxsKHRoaXMsIG9iailcblxuamFzbWluZS51bnNweSA9IChvYmplY3QsIG1ldGhvZE5hbWUpIC0+XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIHNweVwiKSB1bmxlc3Mgb2JqZWN0W21ldGhvZE5hbWVdLmhhc093blByb3BlcnR5KCdvcmlnaW5hbFZhbHVlJylcbiAgb2JqZWN0W21ldGhvZE5hbWVdID0gb2JqZWN0W21ldGhvZE5hbWVdLm9yaWdpbmFsVmFsdWVcblxuamFzbWluZS5hdHRhY2hUb0RPTSA9IChlbGVtZW50KSAtPlxuICBqYXNtaW5lQ29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNqYXNtaW5lLWNvbnRlbnQnKVxuICBqYXNtaW5lQ29udGVudC5hcHBlbmRDaGlsZChlbGVtZW50KSB1bmxlc3MgamFzbWluZUNvbnRlbnQuY29udGFpbnMoZWxlbWVudClcblxuZ3JpbURlcHJlY2F0aW9uc1NuYXBzaG90ID0gbnVsbFxuc3R5bGVzRGVwcmVjYXRpb25zU25hcHNob3QgPSBudWxsXG5qYXNtaW5lLnNuYXBzaG90RGVwcmVjYXRpb25zID0gLT5cbiAgZ3JpbURlcHJlY2F0aW9uc1NuYXBzaG90ID0gXy5jbG9uZShHcmltLmRlcHJlY2F0aW9ucylcbiAgc3R5bGVzRGVwcmVjYXRpb25zU25hcHNob3QgPSBfLmNsb25lKGF0b20uc3R5bGVzLmRlcHJlY2F0aW9uc0J5U291cmNlUGF0aClcblxuamFzbWluZS5yZXN0b3JlRGVwcmVjYXRpb25zU25hcHNob3QgPSAtPlxuICBHcmltLmRlcHJlY2F0aW9ucyA9IGdyaW1EZXByZWNhdGlvbnNTbmFwc2hvdFxuICBhdG9tLnN0eWxlcy5kZXByZWNhdGlvbnNCeVNvdXJjZVBhdGggPSBzdHlsZXNEZXByZWNhdGlvbnNTbmFwc2hvdFxuXG5qYXNtaW5lLnVzZVJlYWxDbG9jayA9IC0+XG4gIGphc21pbmUudW5zcHkod2luZG93LCAnc2V0VGltZW91dCcpXG4gIGphc21pbmUudW5zcHkod2luZG93LCAnY2xlYXJUaW1lb3V0JylcbiAgamFzbWluZS51bnNweShfLl8sICdub3cnKVxuXG4jIFRoZSBjbG9jayBpcyBoYWxmd2F5IG1vY2tlZCBub3cgaW4gYSBzYWQgYW5kIHRlcnJpYmxlIHdheS4uLiBvbmx5IHNldFRpbWVvdXRcbiMgYW5kIGNsZWFyVGltZW91dCBhcmUgaW5jbHVkZWQuIFRoaXMgbWV0aG9kIHdpbGwgYWxzbyBpbmNsdWRlIHNldEludGVydmFsLiBXZVxuIyB3b3VsZCBkbyB0aGlzIGV2ZXJ5d2hlcmUgaWYgZGlkbid0IGNhdXNlIHVzIHRvIGJyZWFrIGEgYnVuY2ggb2YgcGFja2FnZSB0ZXN0cy5cbmphc21pbmUudXNlTW9ja0Nsb2NrID0gLT5cbiAgc3B5T24od2luZG93LCAnc2V0SW50ZXJ2YWwnKS5hbmRDYWxsRmFrZShmYWtlU2V0SW50ZXJ2YWwpXG4gIHNweU9uKHdpbmRvdywgJ2NsZWFySW50ZXJ2YWwnKS5hbmRDYWxsRmFrZShmYWtlQ2xlYXJJbnRlcnZhbClcblxuYWRkQ3VzdG9tTWF0Y2hlcnMgPSAoc3BlYykgLT5cbiAgc3BlYy5hZGRNYXRjaGVyc1xuICAgIHRvQmVJbnN0YW5jZU9mOiAoZXhwZWN0ZWQpIC0+XG4gICAgICBiZU9yTm90QmUgPSBpZiBAaXNOb3QgdGhlbiBcIm5vdCBiZVwiIGVsc2UgXCJiZVwiXG4gICAgICB0aGlzLm1lc3NhZ2UgPSA9PiBcIkV4cGVjdGVkICN7amFzbWluZS5wcChAYWN0dWFsKX0gdG8gI3tiZU9yTm90QmV9IGluc3RhbmNlIG9mICN7ZXhwZWN0ZWQubmFtZX0gY2xhc3NcIlxuICAgICAgQGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkXG5cbiAgICB0b0hhdmVMZW5ndGg6IChleHBlY3RlZCkgLT5cbiAgICAgIGlmIG5vdCBAYWN0dWFsP1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSA9PiBcIkV4cGVjdGVkIG9iamVjdCAje0BhY3R1YWx9IGhhcyBubyBsZW5ndGggbWV0aG9kXCJcbiAgICAgICAgZmFsc2VcbiAgICAgIGVsc2VcbiAgICAgICAgaGF2ZU9yTm90SGF2ZSA9IGlmIEBpc05vdCB0aGVuIFwibm90IGhhdmVcIiBlbHNlIFwiaGF2ZVwiXG4gICAgICAgIHRoaXMubWVzc2FnZSA9ID0+IFwiRXhwZWN0ZWQgb2JqZWN0IHdpdGggbGVuZ3RoICN7QGFjdHVhbC5sZW5ndGh9IHRvICN7aGF2ZU9yTm90SGF2ZX0gbGVuZ3RoICN7ZXhwZWN0ZWR9XCJcbiAgICAgICAgQGFjdHVhbC5sZW5ndGggaXMgZXhwZWN0ZWRcblxuICAgIHRvRXhpc3RPbkRpc2s6IChleHBlY3RlZCkgLT5cbiAgICAgIHRvT3JOb3RUbyA9IHRoaXMuaXNOb3QgYW5kIFwibm90IHRvXCIgb3IgXCJ0b1wiXG4gICAgICBAbWVzc2FnZSA9IC0+IHJldHVybiBcIkV4cGVjdGVkIHBhdGggJyN7QGFjdHVhbH0nICN7dG9Pck5vdFRvfSBleGlzdC5cIlxuICAgICAgZnMuZXhpc3RzU3luYyhAYWN0dWFsKVxuXG4gICAgdG9IYXZlRm9jdXM6IC0+XG4gICAgICB0b09yTm90VG8gPSB0aGlzLmlzTm90IGFuZCBcIm5vdCB0b1wiIG9yIFwidG9cIlxuICAgICAgaWYgbm90IGRvY3VtZW50Lmhhc0ZvY3VzKClcbiAgICAgICAgY29uc29sZS5lcnJvciBcIlNwZWNzIHdpbGwgZmFpbCBiZWNhdXNlIHRoZSBEZXYgVG9vbHMgaGF2ZSBmb2N1cy4gVG8gZml4IHRoaXMgY2xvc2UgdGhlIERldiBUb29scyBvciBjbGljayB0aGUgc3BlYyBydW5uZXIuXCJcblxuICAgICAgQG1lc3NhZ2UgPSAtPiByZXR1cm4gXCJFeHBlY3RlZCBlbGVtZW50ICcje0BhY3R1YWx9JyBvciBpdHMgZGVzY2VuZGFudHMgI3t0b09yTm90VG99IGhhdmUgZm9jdXMuXCJcbiAgICAgIGVsZW1lbnQgPSBAYWN0dWFsXG4gICAgICBlbGVtZW50ID0gZWxlbWVudC5nZXQoMCkgaWYgZWxlbWVudC5qcXVlcnlcbiAgICAgIGVsZW1lbnQgaXMgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBvciBlbGVtZW50LmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG5cbiAgICB0b1Nob3c6IC0+XG4gICAgICB0b09yTm90VG8gPSB0aGlzLmlzTm90IGFuZCBcIm5vdCB0b1wiIG9yIFwidG9cIlxuICAgICAgZWxlbWVudCA9IEBhY3R1YWxcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50LmdldCgwKSBpZiBlbGVtZW50LmpxdWVyeVxuICAgICAgQG1lc3NhZ2UgPSAtPiByZXR1cm4gXCJFeHBlY3RlZCBlbGVtZW50ICcje2VsZW1lbnR9JyBvciBpdHMgZGVzY2VuZGFudHMgI3t0b09yTm90VG99IHNob3cuXCJcbiAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSBpbiBbJ2Jsb2NrJywgJ2lubGluZS1ibG9jaycsICdzdGF0aWMnLCAnZml4ZWQnXVxuXG4gICAgdG9FcXVhbFBhdGg6IChleHBlY3RlZCkgLT5cbiAgICAgIGFjdHVhbFBhdGggPSBwYXRoLm5vcm1hbGl6ZShAYWN0dWFsKVxuICAgICAgZXhwZWN0ZWRQYXRoID0gcGF0aC5ub3JtYWxpemUoZXhwZWN0ZWQpXG4gICAgICBAbWVzc2FnZSA9IC0+IHJldHVybiBcIkV4cGVjdGVkIHBhdGggJyN7YWN0dWFsUGF0aH0nIHRvIGJlIGVxdWFsIHRvICcje2V4cGVjdGVkUGF0aH0nLlwiXG4gICAgICBhY3R1YWxQYXRoIGlzIGV4cGVjdGVkUGF0aFxuXG53aW5kb3cud2FpdHNGb3JQcm9taXNlID0gKGFyZ3MuLi4pIC0+XG4gIGxhYmVsID0gbnVsbFxuICBpZiBhcmdzLmxlbmd0aCA+IDFcbiAgICB7c2hvdWxkUmVqZWN0LCB0aW1lb3V0LCBsYWJlbH0gPSBhcmdzWzBdXG4gIGVsc2VcbiAgICBzaG91bGRSZWplY3QgPSBmYWxzZVxuICBsYWJlbCA/PSAncHJvbWlzZSB0byBiZSByZXNvbHZlZCBvciByZWplY3RlZCdcbiAgZm4gPSBfLmxhc3QoYXJncylcblxuICB3aW5kb3cud2FpdHNGb3IgbGFiZWwsIHRpbWVvdXQsIChtb3ZlT24pIC0+XG4gICAgcHJvbWlzZSA9IGZuKClcbiAgICBpZiBzaG91bGRSZWplY3RcbiAgICAgIHByb21pc2UuY2F0Y2guY2FsbChwcm9taXNlLCBtb3ZlT24pXG4gICAgICBwcm9taXNlLnRoZW4gLT5cbiAgICAgICAgamFzbWluZS5nZXRFbnYoKS5jdXJyZW50U3BlYy5mYWlsKFwiRXhwZWN0ZWQgcHJvbWlzZSB0byBiZSByZWplY3RlZCwgYnV0IGl0IHdhcyByZXNvbHZlZFwiKVxuICAgICAgICBtb3ZlT24oKVxuICAgIGVsc2VcbiAgICAgIHByb21pc2UudGhlbihtb3ZlT24pXG4gICAgICBwcm9taXNlLmNhdGNoLmNhbGwgcHJvbWlzZSwgKGVycm9yKSAtPlxuICAgICAgICBqYXNtaW5lLmdldEVudigpLmN1cnJlbnRTcGVjLmZhaWwoXCJFeHBlY3RlZCBwcm9taXNlIHRvIGJlIHJlc29sdmVkLCBidXQgaXQgd2FzIHJlamVjdGVkIHdpdGg6ICN7ZXJyb3I/Lm1lc3NhZ2V9ICN7amFzbWluZS5wcChlcnJvcil9XCIpXG4gICAgICAgIG1vdmVPbigpXG5cbndpbmRvdy5yZXNldFRpbWVvdXRzID0gLT5cbiAgd2luZG93Lm5vdyA9IDBcbiAgd2luZG93LnRpbWVvdXRDb3VudCA9IDBcbiAgd2luZG93LmludGVydmFsQ291bnQgPSAwXG4gIHdpbmRvdy50aW1lb3V0cyA9IFtdXG4gIHdpbmRvdy5pbnRlcnZhbFRpbWVvdXRzID0ge31cblxud2luZG93LmZha2VTZXRUaW1lb3V0ID0gKGNhbGxiYWNrLCBtcz0wKSAtPlxuICBpZCA9ICsrd2luZG93LnRpbWVvdXRDb3VudFxuICB3aW5kb3cudGltZW91dHMucHVzaChbaWQsIHdpbmRvdy5ub3cgKyBtcywgY2FsbGJhY2tdKVxuICBpZFxuXG53aW5kb3cuZmFrZUNsZWFyVGltZW91dCA9IChpZFRvQ2xlYXIpIC0+XG4gIHdpbmRvdy50aW1lb3V0cyA9IHdpbmRvdy50aW1lb3V0cy5maWx0ZXIgKFtpZF0pIC0+IGlkIGlzbnQgaWRUb0NsZWFyXG5cbndpbmRvdy5mYWtlU2V0SW50ZXJ2YWwgPSAoY2FsbGJhY2ssIG1zKSAtPlxuICBpZCA9ICsrd2luZG93LmludGVydmFsQ291bnRcbiAgYWN0aW9uID0gLT5cbiAgICBjYWxsYmFjaygpXG4gICAgd2luZG93LmludGVydmFsVGltZW91dHNbaWRdID0gd2luZG93LmZha2VTZXRUaW1lb3V0KGFjdGlvbiwgbXMpXG4gIHdpbmRvdy5pbnRlcnZhbFRpbWVvdXRzW2lkXSA9IHdpbmRvdy5mYWtlU2V0VGltZW91dChhY3Rpb24sIG1zKVxuICBpZFxuXG53aW5kb3cuZmFrZUNsZWFySW50ZXJ2YWwgPSAoaWRUb0NsZWFyKSAtPlxuICB3aW5kb3cuZmFrZUNsZWFyVGltZW91dChAaW50ZXJ2YWxUaW1lb3V0c1tpZFRvQ2xlYXJdKVxuXG53aW5kb3cuYWR2YW5jZUNsb2NrID0gKGRlbHRhPTEpIC0+XG4gIHdpbmRvdy5ub3cgKz0gZGVsdGFcbiAgY2FsbGJhY2tzID0gW11cblxuICB3aW5kb3cudGltZW91dHMgPSB3aW5kb3cudGltZW91dHMuZmlsdGVyIChbaWQsIHN0cmlrZVRpbWUsIGNhbGxiYWNrXSkgLT5cbiAgICBpZiBzdHJpa2VUaW1lIDw9IHdpbmRvdy5ub3dcbiAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICB0cnVlXG5cbiAgY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gY2FsbGJhY2tzXG5cbmV4cG9ydHMubW9ja0xvY2FsU3RvcmFnZSA9IC0+XG4gIGl0ZW1zID0ge31cbiAgc3B5T24oZ2xvYmFsLmxvY2FsU3RvcmFnZSwgJ3NldEl0ZW0nKS5hbmRDYWxsRmFrZSAoa2V5LCBpdGVtKSAtPiBpdGVtc1trZXldID0gaXRlbS50b1N0cmluZygpOyB1bmRlZmluZWRcbiAgc3B5T24oZ2xvYmFsLmxvY2FsU3RvcmFnZSwgJ2dldEl0ZW0nKS5hbmRDYWxsRmFrZSAoa2V5KSAtPiBpdGVtc1trZXldID8gbnVsbFxuICBzcHlPbihnbG9iYWwubG9jYWxTdG9yYWdlLCAncmVtb3ZlSXRlbScpLmFuZENhbGxGYWtlIChrZXkpIC0+IGRlbGV0ZSBpdGVtc1trZXldOyB1bmRlZmluZWRcbiJdfQ==
