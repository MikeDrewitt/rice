(function() {
  var Grim, buildReporter, buildTerminalReporter, disableFocusMethods, fs, ipcRenderer, path, requireSpecs, setSpecDirectory, setSpecField, setSpecType;

  Grim = require('grim');

  fs = require('fs-plus');

  path = require('path');

  ipcRenderer = require('electron').ipcRenderer;

  module.exports = function(arg) {
    var ApplicationDelegate, TimeReporter, applicationDelegate, buildAtomEnvironment, documentTitle, headless, i, jasmineContent, jasmineEnv, key, len, logFile, promise, ref, resolveWithExitCode, testPath, testPaths, value;
    logFile = arg.logFile, headless = arg.headless, testPaths = arg.testPaths, buildAtomEnvironment = arg.buildAtomEnvironment;
    ref = require('../vendor/jasmine');
    for (key in ref) {
      value = ref[key];
      window[key] = value;
    }
    require('jasmine-tagged');
    documentTitle = null;
    Object.defineProperty(document, 'title', {
      get: function() {
        return documentTitle;
      },
      set: function(title) {
        return documentTitle = title;
      }
    });
    ApplicationDelegate = require('../src/application-delegate');
    applicationDelegate = new ApplicationDelegate();
    applicationDelegate.setRepresentedFilename = function() {};
    applicationDelegate.setWindowDocumentEdited = function() {};
    window.atom = buildAtomEnvironment({
      applicationDelegate: applicationDelegate,
      window: window,
      document: document,
      configDirPath: process.env.ATOM_HOME,
      enablePersistence: false
    });
    require('./spec-helper');
    if (process.env.JANKY_SHA1 || process.env.CI) {
      disableFocusMethods();
    }
    for (i = 0, len = testPaths.length; i < len; i++) {
      testPath = testPaths[i];
      requireSpecs(testPath);
    }
    setSpecType('user');
    resolveWithExitCode = null;
    promise = new Promise(function(resolve, reject) {
      return resolveWithExitCode = resolve;
    });
    jasmineEnv = jasmine.getEnv();
    jasmineEnv.addReporter(buildReporter({
      logFile: logFile,
      headless: headless,
      resolveWithExitCode: resolveWithExitCode
    }));
    TimeReporter = require('./time-reporter');
    jasmineEnv.addReporter(new TimeReporter());
    jasmineEnv.setIncludedTags([process.platform]);
    jasmineContent = document.createElement('div');
    jasmineContent.setAttribute('id', 'jasmine-content');
    document.body.appendChild(jasmineContent);
    jasmineEnv.execute();
    return promise;
  };

  disableFocusMethods = function() {
    return ['fdescribe', 'ffdescribe', 'fffdescribe', 'fit', 'ffit', 'fffit'].forEach(function(methodName) {
      var focusMethod;
      focusMethod = window[methodName];
      return window[methodName] = function(description) {
        var error;
        error = new Error('Focused spec is running on CI');
        return focusMethod(description, function() {
          throw error;
        });
      };
    });
  };

  requireSpecs = function(testPath, specType) {
    var i, len, ref, results, testFilePath;
    if (fs.isDirectorySync(testPath)) {
      ref = fs.listTreeSync(testPath);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        testFilePath = ref[i];
        if (!(/-spec\.(coffee|js)$/.test(testFilePath))) {
          continue;
        }
        require(testFilePath);
        results.push(setSpecDirectory(testPath));
      }
      return results;
    } else {
      require(testPath);
      return setSpecDirectory(path.dirname(testPath));
    }
  };

  setSpecField = function(name, value) {
    var i, index, ref, results, specs;
    specs = jasmine.getEnv().currentRunner().specs();
    if (specs.length === 0) {
      return;
    }
    results = [];
    for (index = i = ref = specs.length - 1; ref <= 0 ? i <= 0 : i >= 0; index = ref <= 0 ? ++i : --i) {
      if (specs[index][name] != null) {
        break;
      }
      results.push(specs[index][name] = value);
    }
    return results;
  };

  setSpecType = function(specType) {
    return setSpecField('specType', specType);
  };

  setSpecDirectory = function(specDirectory) {
    return setSpecField('specDirectory', specDirectory);
  };

  buildReporter = function(arg) {
    var AtomReporter, headless, logFile, reporter, resolveWithExitCode;
    logFile = arg.logFile, headless = arg.headless, resolveWithExitCode = arg.resolveWithExitCode;
    if (headless) {
      return buildTerminalReporter(logFile, resolveWithExitCode);
    } else {
      AtomReporter = require('./atom-reporter');
      return reporter = new AtomReporter();
    }
  };

  buildTerminalReporter = function(logFile, resolveWithExitCode) {
    var TerminalReporter, log, logStream;
    if (logFile != null) {
      logStream = fs.openSync(logFile, 'w');
    }
    log = function(str) {
      if (logStream != null) {
        return fs.writeSync(logStream, str);
      } else {
        return ipcRenderer.send('write-to-stderr', str);
      }
    };
    TerminalReporter = require('jasmine-tagged').TerminalReporter;
    return new TerminalReporter({
      print: function(str) {
        return log(str);
      },
      onComplete: function(runner) {
        if (logStream != null) {
          fs.closeSync(logStream);
        }
        if (Grim.getDeprecationsLength() > 0) {
          Grim.logDeprecations();
          resolveWithExitCode(1);
          return;
        }
        if (runner.results().failedCount > 0) {
          return resolveWithExitCode(1);
        } else {
          return resolveWithExitCode(0);
        }
      }
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvamFzbWluZS10ZXN0LXJ1bm5lci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNOLGNBQWUsT0FBQSxDQUFRLFVBQVI7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsR0FBRDtBQUNmLFFBQUE7SUFEaUIsdUJBQVMseUJBQVUsMkJBQVc7QUFDL0M7QUFBQSxTQUFBLFVBQUE7O01BQUEsTUFBTyxDQUFBLEdBQUEsQ0FBUCxHQUFjO0FBQWQ7SUFDQSxPQUFBLENBQVEsZ0JBQVI7SUFHQSxhQUFBLEdBQWdCO0lBQ2hCLE1BQU0sQ0FBQyxjQUFQLENBQXNCLFFBQXRCLEVBQWdDLE9BQWhDLEVBQ0U7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHO01BQUgsQ0FBTDtNQUNBLEdBQUEsRUFBSyxTQUFDLEtBQUQ7ZUFBVyxhQUFBLEdBQWdCO01BQTNCLENBREw7S0FERjtJQUlBLG1CQUFBLEdBQXNCLE9BQUEsQ0FBUSw2QkFBUjtJQUN0QixtQkFBQSxHQUEwQixJQUFBLG1CQUFBLENBQUE7SUFDMUIsbUJBQW1CLENBQUMsc0JBQXBCLEdBQTZDLFNBQUEsR0FBQTtJQUM3QyxtQkFBbUIsQ0FBQyx1QkFBcEIsR0FBOEMsU0FBQSxHQUFBO0lBQzlDLE1BQU0sQ0FBQyxJQUFQLEdBQWMsb0JBQUEsQ0FBcUI7TUFDakMscUJBQUEsbUJBRGlDO01BQ1osUUFBQSxNQURZO01BQ0osVUFBQSxRQURJO01BRWpDLGFBQUEsRUFBZSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBRk07TUFHakMsaUJBQUEs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ID0gcmVxdWlyZSAnZ3JpbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xue2lwY1JlbmRlcmVyfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5tb2R1bGUuZXhwb3J0cyA9ICh7bG9nRmlsZSwgaGVhZGxlc3MsIHRlc3RQYXRocywgYnVpbGRBdG9tRW52aXJvbm1lbnR9KSAtPlxuICB3aW5kb3dba2V5XSA9IHZhbHVlIGZvciBrZXksIHZhbHVlIG9mIHJlcXVpcmUgJy4uL3ZlbmRvci9qYXNtaW5lJ1xuICByZXF1aXJlICdqYXNtaW5lLXRhZ2dlZCdcblxuICAjIEFsbG93IGRvY3VtZW50LnRpdGxlIHRvIGJlIGFzc2lnbmVkIGluIHNwZWNzIHdpdGhvdXQgc2NyZXdpbmcgdXAgc3BlYyB3aW5kb3cgdGl0bGVcbiAgZG9jdW1lbnRUaXRsZSA9IG51bGxcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IGRvY3VtZW50LCAndGl0bGUnLFxuICAgIGdldDogLT4gZG9jdW1lbnRUaXRsZVxuICAgIHNldDogKHRpdGxlKSAtPiBkb2N1bWVudFRpdGxlID0gdGl0bGVcblxuICBBcHBsaWNhdGlvbkRlbGVnYXRlID0gcmVxdWlyZSAnLi4vc3JjL2FwcGxpY2F0aW9uLWRlbGVnYXRlJ1xuICBhcHBsaWNhdGlvbkRlbGVnYXRlID0gbmV3IEFwcGxpY2F0aW9uRGVsZWdhdGUoKVxuICBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFJlcHJlc2VudGVkRmlsZW5hbWUgPSAtPlxuICBhcHBsaWNhdGlvbkRlbGVnYXRlLnNldFdpbmRvd0RvY3VtZW50RWRpdGVkID0gLT5cbiAgd2luZG93LmF0b20gPSBidWlsZEF0b21FbnZpcm9ubWVudCh7XG4gICAgYXBwbGljYXRpb25EZWxlZ2F0ZSwgd2luZG93LCBkb2N1bWVudCxcbiAgICBjb25maWdEaXJQYXRoOiBwcm9jZXNzLmVudi5BVE9NX0hPTUVcbiAgICBlbmFibGVQZXJzaXN0ZW5jZTogZmFsc2VcbiAgfSlcblxuICByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuICBkaXNhYmxlRm9jdXNNZXRob2RzKCkgaWYgcHJvY2Vzcy5lbnYuSkFOS1lfU0hBMSBvciBwcm9jZXNzLmVudi5DSVxuICByZXF1aXJlU3BlY3ModGVzdFBhdGgpIGZvciB0ZXN0UGF0aCBpbiB0ZXN0UGF0aHNcblxuICBzZXRTcGVjVHlwZSgndXNlcicpXG5cbiAgcmVzb2x2ZVdpdGhFeGl0Q29kZSA9IG51bGxcbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+IHJlc29sdmVXaXRoRXhpdENvZGUgPSByZXNvbHZlXG4gIGphc21pbmVFbnYgPSBqYXNtaW5lLmdldEVudigpXG4gIGphc21pbmVFbnYuYWRkUmVwb3J0ZXIoYnVpbGRSZXBvcnRlcih7bG9nRmlsZSwgaGVhZGxlc3MsIHJlc29sdmVXaXRoRXhpdENvZGV9KSlcbiAgVGltZVJlcG9ydGVyID0gcmVxdWlyZSAnLi90aW1lLXJlcG9ydGVyJ1xuICBqYXNtaW5lRW52LmFkZFJlcG9ydGVyKG5ldyBUaW1lUmVwb3J0ZXIoKSlcbiAgamFzbWluZUVudi5zZXRJbmNsdWRlZFRhZ3MoW3Byb2Nlc3MucGxhdGZvcm1dKVxuXG4gIGphc21pbmVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgamFzbWluZUNvbnRlbnQuc2V0QXR0cmlidXRlKCdpZCcsICdqYXNtaW5lLWNvbnRlbnQnKVxuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoamFzbWluZUNvbnRlbnQpXG5cbiAgamFzbWluZUVudi5leGVjdXRlKClcbiAgcHJvbWlzZVxuXG5kaXNhYmxlRm9jdXNNZXRob2RzID0gLT5cbiAgWydmZGVzY3JpYmUnLCAnZmZkZXNjcmliZScsICdmZmZkZXNjcmliZScsICdmaXQnLCAnZmZpdCcsICdmZmZpdCddLmZvckVhY2ggKG1ldGhvZE5hbWUpIC0+XG4gICAgZm9jdXNNZXRob2QgPSB3aW5kb3dbbWV0aG9kTmFtZV1cbiAgICB3aW5kb3dbbWV0aG9kTmFtZV0gPSAoZGVzY3JpcHRpb24pIC0+XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcignRm9jdXNlZCBzcGVjIGlzIHJ1bm5pbmcgb24gQ0knKVxuICAgICAgZm9jdXNNZXRob2QgZGVzY3JpcHRpb24sIC0+IHRocm93IGVycm9yXG5cbnJlcXVpcmVTcGVjcyA9ICh0ZXN0UGF0aCwgc3BlY1R5cGUpIC0+XG4gIGlmIGZzLmlzRGlyZWN0b3J5U3luYyh0ZXN0UGF0aClcbiAgICBmb3IgdGVzdEZpbGVQYXRoIGluIGZzLmxpc3RUcmVlU3luYyh0ZXN0UGF0aCkgd2hlbiAvLXNwZWNcXC4oY29mZmVlfGpzKSQvLnRlc3QgdGVzdEZpbGVQYXRoXG4gICAgICByZXF1aXJlKHRlc3RGaWxlUGF0aClcbiAgICAgICMgU2V0IHNwZWMgZGlyZWN0b3J5IG9uIHNwZWMgZm9yIHNldHRpbmcgdXAgdGhlIHByb2plY3QgaW4gc3BlYy1oZWxwZXJcbiAgICAgIHNldFNwZWNEaXJlY3RvcnkodGVzdFBhdGgpXG4gIGVsc2VcbiAgICByZXF1aXJlKHRlc3RQYXRoKVxuICAgIHNldFNwZWNEaXJlY3RvcnkocGF0aC5kaXJuYW1lKHRlc3RQYXRoKSlcblxuc2V0U3BlY0ZpZWxkID0gKG5hbWUsIHZhbHVlKSAtPlxuICBzcGVjcyA9IGphc21pbmUuZ2V0RW52KCkuY3VycmVudFJ1bm5lcigpLnNwZWNzKClcbiAgcmV0dXJuIGlmIHNwZWNzLmxlbmd0aCBpcyAwXG4gIGZvciBpbmRleCBpbiBbc3BlY3MubGVuZ3RoLTEuLjBdXG4gICAgYnJlYWsgaWYgc3BlY3NbaW5kZXhdW25hbWVdP1xuICAgIHNwZWNzW2luZGV4XVtuYW1lXSA9IHZhbHVlXG5cbnNldFNwZWNUeXBlID0gKHNwZWNUeXBlKSAtPlxuICBzZXRTcGVjRmllbGQoJ3NwZWNUeXBlJywgc3BlY1R5cGUpXG5cbnNldFNwZWNEaXJlY3RvcnkgPSAoc3BlY0RpcmVjdG9yeSkgLT5cbiAgc2V0U3BlY0ZpZWxkKCdzcGVjRGlyZWN0b3J5Jywgc3BlY0RpcmVjdG9yeSlcblxuYnVpbGRSZXBvcnRlciA9ICh7bG9nRmlsZSwgaGVhZGxlc3MsIHJlc29sdmVXaXRoRXhpdENvZGV9KSAtPlxuICBpZiBoZWFkbGVzc1xuICAgIGJ1aWxkVGVybWluYWxSZXBvcnRlcihsb2dGaWxlLCByZXNvbHZlV2l0aEV4aXRDb2RlKVxuICBlbHNlXG4gICAgQXRvbVJlcG9ydGVyID0gcmVxdWlyZSAnLi9hdG9tLXJlcG9ydGVyJ1xuICAgIHJlcG9ydGVyID0gbmV3IEF0b21SZXBvcnRlcigpXG5cbmJ1aWxkVGVybWluYWxSZXBvcnRlciA9IChsb2dGaWxlLCByZXNvbHZlV2l0aEV4aXRDb2RlKSAtPlxuICBsb2dTdHJlYW0gPSBmcy5vcGVuU3luYyhsb2dGaWxlLCAndycpIGlmIGxvZ0ZpbGU/XG4gIGxvZyA9IChzdHIpIC0+XG4gICAgaWYgbG9nU3RyZWFtP1xuICAgICAgZnMud3JpdGVTeW5jKGxvZ1N0cmVhbSwgc3RyKVxuICAgIGVsc2VcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQgJ3dyaXRlLXRvLXN0ZGVycicsIHN0clxuXG4gIHtUZXJtaW5hbFJlcG9ydGVyfSA9IHJlcXVpcmUgJ2phc21pbmUtdGFnZ2VkJ1xuICBuZXcgVGVybWluYWxSZXBvcnRlclxuICAgIHByaW50OiAoc3RyKSAtPlxuICAgICAgbG9nKHN0cilcbiAgICBvbkNvbXBsZXRlOiAocnVubmVyKSAtPlxuICAgICAgZnMuY2xvc2VTeW5jKGxvZ1N0cmVhbSkgaWYgbG9nU3RyZWFtP1xuICAgICAgaWYgR3JpbS5nZXREZXByZWNhdGlvbnNMZW5ndGgoKSA+IDBcbiAgICAgICAgR3JpbS5sb2dEZXByZWNhdGlvbnMoKVxuICAgICAgICByZXNvbHZlV2l0aEV4aXRDb2RlKDEpXG4gICAgICAgIHJldHVyblxuXG4gICAgICBpZiBydW5uZXIucmVzdWx0cygpLmZhaWxlZENvdW50ID4gMFxuICAgICAgICByZXNvbHZlV2l0aEV4aXRDb2RlKDEpXG4gICAgICBlbHNlXG4gICAgICAgIHJlc29sdmVXaXRoRXhpdENvZGUoMClcbiJdfQ==
