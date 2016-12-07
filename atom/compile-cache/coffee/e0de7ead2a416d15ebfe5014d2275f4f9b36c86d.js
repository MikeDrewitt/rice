(function() {
  var AtomReporter, SpecResultView, SuiteResultView, _, formatStackTrace, grim, ipcHelpers, listen, marked, path;

  path = require('path');

  _ = require('underscore-plus');

  grim = require('grim');

  marked = require('marked');

  listen = require('../src/delegated-listener');

  ipcHelpers = require('../src/ipc-helpers');

  formatStackTrace = function(spec, message, stackTrace) {
    var errorMatch, firstJasmineLinePattern, i, index, j, jasminePattern, len, len1, line, lines, prefixMatch, ref, ref1, ref2;
    if (message == null) {
      message = '';
    }
    if (!stackTrace) {
      return stackTrace;
    }
    jasminePattern = /^\s*at\s+.*\(?.*[\/\\]jasmine(-[^\/\\]*)?\.js:\d+:\d+\)?\s*$/;
    firstJasmineLinePattern = /^\s*at [\/\\].*[\/\\]jasmine(-[^\/\\]*)?\.js:\d+:\d+\)?\s*$/;
    lines = [];
    ref = stackTrace.split('\n');
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
      if (!jasminePattern.test(line)) {
        lines.push(line);
      }
      if (firstJasmineLinePattern.test(line)) {
        break;
      }
    }
    errorMatch = (ref1 = lines[0]) != null ? ref1.match(/^Error: (.*)/) : void 0;
    if (message.trim() === (errorMatch != null ? (ref2 = errorMatch[1]) != null ? ref2.trim() : void 0 : void 0)) {
      lines.shift();
    }
    for (index = j = 0, len1 = lines.length; j < len1; index = ++j) {
      line = lines[index];
      prefixMatch = line.match(/at \[object Object\]\.<anonymous> \(([^)]+)\)/);
      if (prefixMatch) {
        line = "at " + prefixMatch[1];
      }
      lines[index] = line.replace("at " + spec.specDirectory + path.sep, 'at ');
    }
    lines = lines.map(function(line) {
      return line.trim();
    });
    return lines.join('\n').trim();
  };

  module.exports = AtomReporter = (function() {
    function AtomReporter() {
      var element, i, len, ref;
      this.element = document.createElement('div');
      this.element.classList.add('spec-reporter-container');
      this.element.innerHTML = "<div class=\"spec-reporter\">\n  <div class=\"padded pull-right\">\n    <button outlet=\"reloadButton\" class=\"btn btn-small reload-button\">Reload Specs</button>\n  </div>\n  <div outlet=\"coreArea\" class=\"symbol-area\">\n    <div outlet=\"coreHeader\" class=\"symbol-header\"></div>\n    <ul outlet=\"coreSummary\"class=\"symbol-summary list-unstyled\"></ul>\n  </div>\n  <div outlet=\"bundledArea\" class=\"symbol-area\">\n    <div outlet=\"bundledHeader\" class=\"symbol-header\"></div>\n    <ul outlet=\"bundledSummary\"class=\"symbol-summary list-unstyled\"></ul>\n  </div>\n  <div outlet=\"userArea\" class=\"symbol-area\">\n    <div outlet=\"userHeader\" class=\"symbol-header\"></div>\n    <ul outlet=\"userSummary\"class=\"symbol-summary list-unstyled\"></ul>\n  </div>\n  <div outlet=\"status\" class=\"status alert alert-info\">\n    <div outlet=\"time\" class=\"time\"></div>\n    <div outlet=\"specCount\" class=\"spec-count\"></div>\n    <div outlet=\"message\" class=\"message\"></div>\n  </div>\n  <div outlet=\"results\" class=\"results\"></div>\n  <div outlet=\"deprecations\" class=\"status alert alert-warning\" style=\"display: none\">\n    <span outlet=\"deprecationStatus\">0 deprecations</span>\n    <div class=\"deprecation-toggle\"></div>\n  </div>\n  <div outlet=\"deprecationList\" class=\"deprecation-list\"></div>\n</div>";
      ref = this.element.querySelectorAll('[outlet]');
      for (i = 0, len = ref.length; i < len; i++) {
        element = ref[i];
        this[element.getAttribute('outlet')] = element;
      }
    }

    AtomReporter.prototype.startedAt = null;

    AtomReporter.prototype.runningSpecCount = 0;

    AtomReporter.prototype.completeSpecCount = 0;

    AtomReporter.prototype.passedCount = 0;

    AtomReporter.prototype.failedCount = 0;

    AtomReporter.prototype.skippedCount = 0;

    AtomReporter.prototype.totalSpecCount = 0;

    AtomReporter.prototype.deprecationCount = 0;

    AtomReporter.timeoutId = 0;

    AtomReporter.prototype.reportRunnerStarting = function(runner) {
      var specs;
      this.handleEvents();
      this.startedAt = Date.now();
      specs = runner.specs();
      this.totalSpecCount = specs.length;
      this.addSpecs(specs);
      return document.body.appendChild(this.element);
    };

    AtomReporter.prototype.reportRunnerResults = function(runner) {
      this.updateSpecCounts();
      if (this.failedCount === 0) {
        this.status.classList.add('alert-success');
        this.status.classList.remove('alert-info');
      }
      if (this.failedCount === 1) {
        return this.message.textContent = this.failedCount + " failure";
      } else {
        return this.message.textContent = this.failedCount + " failures";
      }
    };

    AtomReporter.prototype.reportSuiteResults = function(suite) {};

    AtomReporter.prototype.reportSpecResults = function(spec) {
      this.completeSpecCount++;
      spec.endedAt = Date.now();
      this.specComplete(spec);
      return this.updateStatusView(spec);
    };

    AtomReporter.prototype.reportSpecStarting = function(spec) {
      return this.specStarted(spec);
    };

    AtomReporter.prototype.handleEvents = function() {
      listen(document, 'click', '.spec-toggle', function(event) {
        var specFailures;
        specFailures = event.currentTarget.parentElement.querySelector('.spec-failures');
        if (specFailures.style.display === 'none') {
          specFailures.style.display = '';
          event.currentTarget.classList.remove('folded');
        } else {
          specFailures.style.display = 'none';
          event.currentTarget.classList.add('folded');
        }
        return event.preventDefault();
      });
      listen(document, 'click', '.deprecation-list', function(event) {
        var deprecationList;
        deprecationList = event.currentTarget.parentElement.querySelector('.deprecation-list');
        if (deprecationList.style.display === 'none') {
          deprecationList.style.display = '';
          event.currentTarget.classList.remove('folded');
        } else {
          deprecationList.style.display = 'none';
          event.currentTarget.classList.add('folded');
        }
        return event.preventDefault();
      });
      listen(document, 'click', '.stack-trace', function(event) {
        return event.currentTarget.classList.toggle('expanded');
      });
      return this.reloadButton.addEventListener('click', function() {
        return ipcHelpers.call('window-method', 'reload');
      });
    };

    AtomReporter.prototype.updateSpecCounts = function() {
      var specCount;
      if (this.skippedCount) {
        specCount = (this.completeSpecCount - this.skippedCount) + "/" + (this.totalSpecCount - this.skippedCount) + " (" + this.skippedCount + " skipped)";
      } else {
        specCount = this.completeSpecCount + "/" + this.totalSpecCount;
      }
      return this.specCount.textContent = specCount;
    };

    AtomReporter.prototype.updateStatusView = function(spec) {
      var rootSuite, time;
      if (this.failedCount > 0) {
        this.status.classList.add('alert-danger');
        this.status.classList.remove('alert-info');
      }
      this.updateSpecCounts();
      rootSuite = spec.suite;
      while (rootSuite.parentSuite) {
        rootSuite = rootSuite.parentSuite;
      }
      this.message.textContent = rootSuite.description;
      time = "" + (Math.round((spec.endedAt - this.startedAt) / 10));
      if (time.length < 3) {
        time = "0" + time;
      }
      return this.time.textContent = time.slice(0, -2) + "." + time.slice(-2) + "s";
    };

    AtomReporter.prototype.specTitle = function(spec) {
      var desc, i, indent, len, parentDescs, s, suiteString;
      parentDescs = [];
      s = spec.suite;
      while (s) {
        parentDescs.unshift(s.description);
        s = s.parentSuite;
      }
      suiteString = "";
      indent = "";
      for (i = 0, len = parentDescs.length; i < len; i++) {
        desc = parentDescs[i];
        suiteString += indent + desc + "\n";
        indent += "  ";
      }
      return suiteString + " " + indent + " it " + spec.description;
    };

    AtomReporter.prototype.addSpecs = function(specs) {
      var bundledPackageSpecs, coreSpecs, i, len, packageFolderName, packageName, spec, specDirectory, symbol, userPackageSpecs;
      coreSpecs = 0;
      bundledPackageSpecs = 0;
      userPackageSpecs = 0;
      for (i = 0, len = specs.length; i < len; i++) {
        spec = specs[i];
        symbol = document.createElement('li');
        symbol.setAttribute('id', "spec-summary-" + spec.id);
        symbol.setAttribute('title', this.specTitle(spec));
        symbol.className = "spec-summary pending";
        switch (spec.specType) {
          case 'core':
            coreSpecs++;
            this.coreSummary.appendChild(symbol);
            break;
          case 'bundled':
            bundledPackageSpecs++;
            this.bundledSummary.appendChild(symbol);
            break;
          case 'user':
            userPackageSpecs++;
            this.userSummary.appendChild(symbol);
        }
      }
      if (coreSpecs > 0) {
        this.coreHeader.textContent = "Core Specs (" + coreSpecs + ")";
      } else {
        this.coreArea.style.display = 'none';
      }
      if (bundledPackageSpecs > 0) {
        this.bundledHeader.textContent = "Bundled Package Specs (" + bundledPackageSpecs + ")";
      } else {
        this.bundledArea.style.display = 'none';
      }
      if (userPackageSpecs > 0) {
        if (coreSpecs === 0 && bundledPackageSpecs === 0) {
          specDirectory = specs[0].specDirectory;
          packageFolderName = path.basename(path.dirname(specDirectory));
          packageName = _.undasherize(_.uncamelcase(packageFolderName));
          return this.userHeader.textContent = packageName + " Specs";
        } else {
          return this.userHeader.textContent = "User Package Specs (" + userPackageSpecs + ")";
        }
      } else {
        return this.userArea.style.display = 'none';
      }
    };

    AtomReporter.prototype.specStarted = function(spec) {
      return this.runningSpecCount++;
    };

    AtomReporter.prototype.specComplete = function(spec) {
      var results, specSummaryElement, specView;
      specSummaryElement = document.getElementById("spec-summary-" + spec.id);
      specSummaryElement.classList.remove('pending');
      results = spec.results();
      if (results.skipped) {
        specSummaryElement.classList.add("skipped");
        return this.skippedCount++;
      } else if (results.passed()) {
        specSummaryElement.classList.add("passed");
        return this.passedCount++;
      } else {
        specSummaryElement.classList.add("failed");
        specView = new SpecResultView(spec);
        specView.attach();
        return this.failedCount++;
      }
    };

    return AtomReporter;

  })();

  SuiteResultView = (function() {
    function SuiteResultView(suite1) {
      this.suite = suite1;
      this.element = document.createElement('div');
      this.element.className = 'suite';
      this.element.setAttribute('id', "suite-view-" + this.suite.id);
      this.description = document.createElement('div');
      this.description.className = 'description';
      this.description.textContent = this.suite.description;
      this.element.appendChild(this.description);
    }

    SuiteResultView.prototype.attach = function() {
      return (this.parentSuiteView() || document.querySelector('.results')).appendChild(this.element);
    };

    SuiteResultView.prototype.parentSuiteView = function() {
      var suiteView, suiteViewElement;
      if (!this.suite.parentSuite) {
        return;
      }
      if (!(suiteViewElement = document.querySelector("#suite-view-" + this.suite.parentSuite.id))) {
        suiteView = new SuiteResultView(this.suite.parentSuite);
        suiteView.attach();
        suiteViewElement = suiteView.element;
      }
      return suiteViewElement;
    };

    return SuiteResultView;

  })();

  SpecResultView = (function() {
    function SpecResultView(spec1) {
      var description, i, len, ref, result, resultElement, stackTrace, traceElement;
      this.spec = spec1;
      this.element = document.createElement('div');
      this.element.className = 'spec';
      this.element.innerHTML = "<div class='spec-toggle'></div>\n<div outlet='description' class='description'></div>\n<div outlet='specFailures' class='spec-failures'></div>";
      this.description = this.element.querySelector('[outlet="description"]');
      this.specFailures = this.element.querySelector('[outlet="specFailures"]');
      this.element.classList.add("spec-view-" + this.spec.id);
      description = this.spec.description;
      if (description.indexOf('it ') !== 0) {
        description = "it " + description;
      }
      this.description.textContent = description;
      ref = this.spec.results().getItems();
      for (i = 0, len = ref.length; i < len; i++) {
        result = ref[i];
        if (!(!result.passed())) {
          continue;
        }
        stackTrace = formatStackTrace(this.spec, result.message, result.trace.stack);
        resultElement = document.createElement('div');
        resultElement.className = 'result-message fail';
        resultElement.textContent = result.message;
        this.specFailures.appendChild(resultElement);
        if (stackTrace) {
          traceElement = document.createElement('pre');
          traceElement.className = 'stack-trace padded';
          traceElement.textContent = stackTrace;
          this.specFailures.appendChild(traceElement);
        }
      }
    }

    SpecResultView.prototype.attach = function() {
      return this.parentSuiteView().appendChild(this.element);
    };

    SpecResultView.prototype.parentSuiteView = function() {
      var suiteView, suiteViewElement;
      if (!(suiteViewElement = document.querySelector("#suite-view-" + this.spec.suite.id))) {
        suiteView = new SuiteResultView(this.spec.suite);
        suiteView.attach();
        suiteViewElement = suiteView.element;
      }
      return suiteViewElement;
    };

    return SpecResultView;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvYXRvbS1yZXBvcnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBQ1QsTUFBQSxHQUFTLE9BQUEsQ0FBUSwyQkFBUjs7RUFDVCxVQUFBLEdBQWEsT0FBQSxDQUFRLG9CQUFSOztFQUViLGdCQUFBLEdBQW1CLFNBQUMsSUFBRCxFQUFPLE9BQVAsRUFBbUIsVUFBbkI7QUFDakIsUUFBQTs7TUFEd0IsVUFBUTs7SUFDaEMsSUFBQSxDQUF5QixVQUF6QjtBQUFBLGFBQU8sV0FBUDs7SUFFQSxjQUFBLEdBQWlCO0lBQ2pCLHVCQUFBLEdBQTBCO0lBQzFCLEtBQUEsR0FBUTtBQUNSO0FBQUEsU0FBQSxxQ0FBQTs7TUFDRSxJQUFBLENBQXdCLGNBQWMsQ0FBQyxJQUFmLENBQW9CLElBQXBCLENBQXhCO1FBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQUE7O01BQ0EsSUFBUyx1QkFBdUIsQ0FBQyxJQUF4QixDQUE2QixJQUE3QixDQUFUO0FBQUEsY0FBQTs7QUFGRjtJQUtBLFVBQUEsbUNBQXFCLENBQUUsS0FBVixDQUFnQixjQUFoQjtJQUNiLElBQWlCLE9BQU8sQ0FBQyxJQUFSLENBQUEsQ0FBQSxnRUFBZ0MsQ0FBRSxJQUFoQixDQUFBLG9CQUFuQztNQUFBLEtBQUssQ0FBQyxLQUFOLENBQUEsRUFBQTs7QUFFQSxTQUFBLHlEQUFBOztNQUVFLFdBQUEsR0FBYyxJQUFJLENBQUMsS0FBTCxDQUFXLCtDQUFYO01BQ2QsSUFB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QSxHQUFlLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQWxELENBQW5CLENBQVA7UUFDRSxTQUFBLEdBQWdCLElBQUEsZUFBQSxDQUFnQixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQXRCO1FBQ2hCLFNBQVMsQ0FBQyxNQUFWLENBQUE7UUFDQSxnQkFBQSxHQUFtQixTQUFTLENBQUMsUUFIL0I7O2FBS0E7SUFOZTs7Ozs7QUExU25CIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuZ3JpbSA9IHJlcXVpcmUgJ2dyaW0nXG5tYXJrZWQgPSByZXF1aXJlICdtYXJrZWQnXG5saXN0ZW4gPSByZXF1aXJlICcuLi9zcmMvZGVsZWdhdGVkLWxpc3RlbmVyJ1xuaXBjSGVscGVycyA9IHJlcXVpcmUgJy4uL3NyYy9pcGMtaGVscGVycydcblxuZm9ybWF0U3RhY2tUcmFjZSA9IChzcGVjLCBtZXNzYWdlPScnLCBzdGFja1RyYWNlKSAtPlxuICByZXR1cm4gc3RhY2tUcmFjZSB1bmxlc3Mgc3RhY2tUcmFjZVxuXG4gIGphc21pbmVQYXR0ZXJuID0gL15cXHMqYXRcXHMrLipcXCg/LipbL1xcXFxdamFzbWluZSgtW14vXFxcXF0qKT9cXC5qczpcXGQrOlxcZCtcXCk/XFxzKiQvXG4gIGZpcnN0SmFzbWluZUxpbmVQYXR0ZXJuID0gL15cXHMqYXQgWy9cXFxcXS4qWy9cXFxcXWphc21pbmUoLVteL1xcXFxdKik/XFwuanM6XFxkKzpcXGQrXFwpP1xccyokL1xuICBsaW5lcyA9IFtdXG4gIGZvciBsaW5lIGluIHN0YWNrVHJhY2Uuc3BsaXQoJ1xcbicpXG4gICAgbGluZXMucHVzaChsaW5lKSB1bmxlc3MgamFzbWluZVBhdHRlcm4udGVzdChsaW5lKVxuICAgIGJyZWFrIGlmIGZpcnN0SmFzbWluZUxpbmVQYXR0ZXJuLnRlc3QobGluZSlcblxuICAjIFJlbW92ZSBmaXJzdCBsaW5lIG9mIHN0YWNrIHdoZW4gaXQgaXMgdGhlIHNhbWUgYXMgdGhlIGVycm9yIG1lc3NhZ2VcbiAgZXJyb3JNYXRjaCA9IGxpbmVzWzBdPy5tYXRjaCgvXkVycm9yOiAoLiopLylcbiAgbGluZXMuc2hpZnQoKSBpZiBtZXNzYWdlLnRyaW0oKSBpcyBlcnJvck1hdGNoP1sxXT8udHJpbSgpXG5cbiAgZm9yIGxpbmUsIGluZGV4IGluIGxpbmVzXG4gICAgIyBSZW1vdmUgcHJlZml4IG9mIGxpbmVzIG1hdGNoaW5nOiBhdCBbb2JqZWN0IE9iamVjdF0uPGFub255bW91cz4gKHBhdGg6MToyKVxuICAgIHByZWZpeE1hdGNoID0gbGluZS5tYXRjaCgvYXQgXFxbb2JqZWN0IE9iamVjdFxcXVxcLjxhbm9ueW1vdXM+IFxcKChbXildKylcXCkvKVxuICAgIGxpbmUgPSBcImF0ICN7cHJlZml4TWF0Y2hbMV19XCIgaWYgcHJlZml4TWF0Y2hcblxuICAgICMgUmVsYXRpdml6ZSBsb2NhdGlvbnMgdG8gc3BlYyBkaXJlY3RvcnlcbiAgICBsaW5lc1tpbmRleF0gPSBsaW5lLnJlcGxhY2UoXCJhdCAje3NwZWMuc3BlY0RpcmVjdG9yeX0je3BhdGguc2VwfVwiLCAnYXQgJylcblxuICBsaW5lcyA9IGxpbmVzLm1hcCAobGluZSkgLT4gbGluZS50cmltKClcbiAgbGluZXMuam9pbignXFxuJykudHJpbSgpXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEF0b21SZXBvcnRlclxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBAZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzcGVjLXJlcG9ydGVyLWNvbnRhaW5lcicpXG4gICAgQGVsZW1lbnQuaW5uZXJIVE1MID0gXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwic3BlYy1yZXBvcnRlclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGFkZGVkIHB1bGwtcmlnaHRcIj5cbiAgICAgICAgICA8YnV0dG9uIG91dGxldD1cInJlbG9hZEJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1zbWFsbCByZWxvYWQtYnV0dG9uXCI+UmVsb2FkIFNwZWNzPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IG91dGxldD1cImNvcmVBcmVhXCIgY2xhc3M9XCJzeW1ib2wtYXJlYVwiPlxuICAgICAgICAgIDxkaXYgb3V0bGV0PVwiY29yZUhlYWRlclwiIGNsYXNzPVwic3ltYm9sLWhlYWRlclwiPjwvZGl2PlxuICAgICAgICAgIDx1bCBvdXRsZXQ9XCJjb3JlU3VtbWFyeVwiY2xhc3M9XCJzeW1ib2wtc3VtbWFyeSBsaXN0LXVuc3R5bGVkXCI+PC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgb3V0bGV0PVwiYnVuZGxlZEFyZWFcIiBjbGFzcz1cInN5bWJvbC1hcmVhXCI+XG4gICAgICAgICAgPGRpdiBvdXRsZXQ9XCJidW5kbGVkSGVhZGVyXCIgY2xhc3M9XCJzeW1ib2wtaGVhZGVyXCI+PC9kaXY+XG4gICAgICAgICAgPHVsIG91dGxldD1cImJ1bmRsZWRTdW1tYXJ5XCJjbGFzcz1cInN5bWJvbC1zdW1tYXJ5IGxpc3QtdW5zdHlsZWRcIj48L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBvdXRsZXQ9XCJ1c2VyQXJlYVwiIGNsYXNzPVwic3ltYm9sLWFyZWFcIj5cbiAgICAgICAgICA8ZGl2IG91dGxldD1cInVzZXJIZWFkZXJcIiBjbGFzcz1cInN5bWJvbC1oZWFkZXJcIj48L2Rpdj5cbiAgICAgICAgICA8dWwgb3V0bGV0PVwidXNlclN1bW1hcnlcImNsYXNzPVwic3ltYm9sLXN1bW1hcnkgbGlzdC11bnN0eWxlZFwiPjwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IG91dGxldD1cInN0YXR1c1wiIGNsYXNzPVwic3RhdHVzIGFsZXJ0IGFsZXJ0LWluZm9cIj5cbiAgICAgICAgICA8ZGl2IG91dGxldD1cInRpbWVcIiBjbGFzcz1cInRpbWVcIj48L2Rpdj5cbiAgICAgICAgICA8ZGl2IG91dGxldD1cInNwZWNDb3VudFwiIGNsYXNzPVwic3BlYy1jb3VudFwiPjwvZGl2PlxuICAgICAgICAgIDxkaXYgb3V0bGV0PVwibWVzc2FnZVwiIGNsYXNzPVwibWVzc2FnZVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBvdXRsZXQ9XCJyZXN1bHRzXCIgY2xhc3M9XCJyZXN1bHRzXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgb3V0bGV0PVwiZGVwcmVjYXRpb25zXCIgY2xhc3M9XCJzdGF0dXMgYWxlcnQgYWxlcnQtd2FybmluZ1wiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPlxuICAgICAgICAgIDxzcGFuIG91dGxldD1cImRlcHJlY2F0aW9uU3RhdHVzXCI+MCBkZXByZWNhdGlvbnM8L3NwYW4+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImRlcHJlY2F0aW9uLXRvZ2dsZVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBvdXRsZXQ9XCJkZXByZWNhdGlvbkxpc3RcIiBjbGFzcz1cImRlcHJlY2F0aW9uLWxpc3RcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuXG4gICAgZm9yIGVsZW1lbnQgaW4gQGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW291dGxldF0nKVxuICAgICAgdGhpc1tlbGVtZW50LmdldEF0dHJpYnV0ZSgnb3V0bGV0JyldID0gZWxlbWVudFxuXG4gIHN0YXJ0ZWRBdDogbnVsbFxuICBydW5uaW5nU3BlY0NvdW50OiAwXG4gIGNvbXBsZXRlU3BlY0NvdW50OiAwXG4gIHBhc3NlZENvdW50OiAwXG4gIGZhaWxlZENvdW50OiAwXG4gIHNraXBwZWRDb3VudDogMFxuICB0b3RhbFNwZWNDb3VudDogMFxuICBkZXByZWNhdGlvbkNvdW50OiAwXG4gIEB0aW1lb3V0SWQ6IDBcblxuICByZXBvcnRSdW5uZXJTdGFydGluZzogKHJ1bm5lcikgLT5cbiAgICBAaGFuZGxlRXZlbnRzKClcbiAgICBAc3RhcnRlZEF0ID0gRGF0ZS5ub3coKVxuICAgIHNwZWNzID0gcnVubmVyLnNwZWNzKClcbiAgICBAdG90YWxTcGVjQ291bnQgPSBzcGVjcy5sZW5ndGhcbiAgICBAYWRkU3BlY3Moc3BlY3MpXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChAZWxlbWVudClcblxuICByZXBvcnRSdW5uZXJSZXN1bHRzOiAocnVubmVyKSAtPlxuICAgIEB1cGRhdGVTcGVjQ291bnRzKClcbiAgICBpZiBAZmFpbGVkQ291bnQgaXMgMFxuICAgICAgQHN0YXR1cy5jbGFzc0xpc3QuYWRkKCdhbGVydC1zdWNjZXNzJylcbiAgICAgIEBzdGF0dXMuY2xhc3NMaXN0LnJlbW92ZSgnYWxlcnQtaW5mbycpXG5cbiAgICBpZiBAZmFpbGVkQ291bnQgaXMgMVxuICAgICAgQG1lc3NhZ2UudGV4dENvbnRlbnQgPSBcIiN7QGZhaWxlZENvdW50fSBmYWlsdXJlXCJcbiAgICBlbHNlXG4gICAgICBAbWVzc2FnZS50ZXh0Q29udGVudCA9IFwiI3tAZmFpbGVkQ291bnR9IGZhaWx1cmVzXCJcblxuICByZXBvcnRTdWl0ZVJlc3VsdHM6IChzdWl0ZSkgLT5cblxuICByZXBvcnRTcGVjUmVzdWx0czogKHNwZWMpIC0+XG4gICAgQGNvbXBsZXRlU3BlY0NvdW50KytcbiAgICBzcGVjLmVuZGVkQXQgPSBEYXRlLm5vdygpXG4gICAgQHNwZWNDb21wbGV0ZShzcGVjKVxuICAgIEB1cGRhdGVTdGF0dXNWaWV3KHNwZWMpXG5cbiAgcmVwb3J0U3BlY1N0YXJ0aW5nOiAoc3BlYykgLT5cbiAgICBAc3BlY1N0YXJ0ZWQoc3BlYylcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgbGlzdGVuIGRvY3VtZW50LCAnY2xpY2snLCAnLnNwZWMtdG9nZ2xlJywgKGV2ZW50KSAtPlxuICAgICAgc3BlY0ZhaWx1cmVzID0gZXZlbnQuY3VycmVudFRhcmdldC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zcGVjLWZhaWx1cmVzJylcblxuICAgICAgaWYgc3BlY0ZhaWx1cmVzLnN0eWxlLmRpc3BsYXkgaXMgJ25vbmUnXG4gICAgICAgIHNwZWNGYWlsdXJlcy5zdHlsZS5kaXNwbGF5ID0gJydcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdmb2xkZWQnKVxuICAgICAgZWxzZVxuICAgICAgICBzcGVjRmFpbHVyZXMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2ZvbGRlZCcpXG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgIGxpc3RlbiBkb2N1bWVudCwgJ2NsaWNrJywgJy5kZXByZWNhdGlvbi1saXN0JywgKGV2ZW50KSAtPlxuICAgICAgZGVwcmVjYXRpb25MaXN0ID0gZXZlbnQuY3VycmVudFRhcmdldC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZXByZWNhdGlvbi1saXN0JylcblxuICAgICAgaWYgZGVwcmVjYXRpb25MaXN0LnN0eWxlLmRpc3BsYXkgaXMgJ25vbmUnXG4gICAgICAgIGRlcHJlY2F0aW9uTGlzdC5zdHlsZS5kaXNwbGF5ID0gJydcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdmb2xkZWQnKVxuICAgICAgZWxzZVxuICAgICAgICBkZXByZWNhdGlvbkxpc3Quc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2ZvbGRlZCcpXG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgIGxpc3RlbiBkb2N1bWVudCwgJ2NsaWNrJywgJy5zdGFjay10cmFjZScsIChldmVudCkgLT5cbiAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnZXhwYW5kZWQnKVxuXG4gICAgQHJlbG9hZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIC0+IGlwY0hlbHBlcnMuY2FsbCgnd2luZG93LW1ldGhvZCcsICdyZWxvYWQnKSlcblxuICB1cGRhdGVTcGVjQ291bnRzOiAtPlxuICAgIGlmIEBza2lwcGVkQ291bnRcbiAgICAgIHNwZWNDb3VudCA9IFwiI3tAY29tcGxldGVTcGVjQ291bnQgLSBAc2tpcHBlZENvdW50fS8je0B0b3RhbFNwZWNDb3VudCAtIEBza2lwcGVkQ291bnR9ICgje0Bza2lwcGVkQ291bnR9IHNraXBwZWQpXCJcbiAgICBlbHNlXG4gICAgICBzcGVjQ291bnQgPSBcIiN7QGNvbXBsZXRlU3BlY0NvdW50fS8je0B0b3RhbFNwZWNDb3VudH1cIlxuICAgIEBzcGVjQ291bnQudGV4dENvbnRlbnQgPSBzcGVjQ291bnRcblxuICB1cGRhdGVTdGF0dXNWaWV3OiAoc3BlYykgLT5cbiAgICBpZiBAZmFpbGVkQ291bnQgPiAwXG4gICAgICBAc3RhdHVzLmNsYXNzTGlzdC5hZGQoJ2FsZXJ0LWRhbmdlcicpXG4gICAgICBAc3RhdHVzLmNsYXNzTGlzdC5yZW1vdmUoJ2FsZXJ0LWluZm8nKVxuXG4gICAgQHVwZGF0ZVNwZWNDb3VudHMoKVxuXG4gICAgcm9vdFN1aXRlID0gc3BlYy5zdWl0ZVxuICAgIHJvb3RTdWl0ZSA9IHJvb3RTdWl0ZS5wYXJlbnRTdWl0ZSB3aGlsZSByb290U3VpdGUucGFyZW50U3VpdGVcbiAgICBAbWVzc2FnZS50ZXh0Q29udGVudCA9IHJvb3RTdWl0ZS5kZXNjcmlwdGlvblxuXG4gICAgdGltZSA9IFwiI3tNYXRoLnJvdW5kKChzcGVjLmVuZGVkQXQgLSBAc3RhcnRlZEF0KSAvIDEwKX1cIlxuICAgIHRpbWUgPSBcIjAje3RpbWV9XCIgaWYgdGltZS5sZW5ndGggPCAzXG4gICAgQHRpbWUudGV4dENvbnRlbnQgPSBcIiN7dGltZVswLi4uLTJdfS4je3RpbWVbLTIuLl19c1wiXG5cbiAgc3BlY1RpdGxlOiAoc3BlYykgLT5cbiAgICBwYXJlbnREZXNjcyA9IFtdXG4gICAgcyA9IHNwZWMuc3VpdGVcbiAgICB3aGlsZSBzXG4gICAgICBwYXJlbnREZXNjcy51bnNoaWZ0KHMuZGVzY3JpcHRpb24pXG4gICAgICBzID0gcy5wYXJlbnRTdWl0ZVxuXG4gICAgc3VpdGVTdHJpbmcgPSBcIlwiXG4gICAgaW5kZW50ID0gXCJcIlxuICAgIGZvciBkZXNjIGluIHBhcmVudERlc2NzXG4gICAgICBzdWl0ZVN0cmluZyArPSBpbmRlbnQgKyBkZXNjICsgXCJcXG5cIlxuICAgICAgaW5kZW50ICs9IFwiICBcIlxuXG4gICAgXCIje3N1aXRlU3RyaW5nfSAje2luZGVudH0gaXQgI3tzcGVjLmRlc2NyaXB0aW9ufVwiXG5cbiAgYWRkU3BlY3M6IChzcGVjcykgLT5cbiAgICBjb3JlU3BlY3MgPSAwXG4gICAgYnVuZGxlZFBhY2thZ2VTcGVjcyA9IDBcbiAgICB1c2VyUGFja2FnZVNwZWNzID0gMFxuICAgIGZvciBzcGVjIGluIHNwZWNzXG4gICAgICBzeW1ib2wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICBzeW1ib2wuc2V0QXR0cmlidXRlKCdpZCcsIFwic3BlYy1zdW1tYXJ5LSN7c3BlYy5pZH1cIilcbiAgICAgIHN5bWJvbC5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgQHNwZWNUaXRsZShzcGVjKSlcbiAgICAgIHN5bWJvbC5jbGFzc05hbWUgPSBcInNwZWMtc3VtbWFyeSBwZW5kaW5nXCJcbiAgICAgIHN3aXRjaCBzcGVjLnNwZWNUeXBlXG4gICAgICAgIHdoZW4gJ2NvcmUnXG4gICAgICAgICAgY29yZVNwZWNzKytcbiAgICAgICAgICBAY29yZVN1bW1hcnkuYXBwZW5kQ2hpbGQgc3ltYm9sXG4gICAgICAgIHdoZW4gJ2J1bmRsZWQnXG4gICAgICAgICAgYnVuZGxlZFBhY2thZ2VTcGVjcysrXG4gICAgICAgICAgQGJ1bmRsZWRTdW1tYXJ5LmFwcGVuZENoaWxkIHN5bWJvbFxuICAgICAgICB3aGVuICd1c2VyJ1xuICAgICAgICAgIHVzZXJQYWNrYWdlU3BlY3MrK1xuICAgICAgICAgIEB1c2VyU3VtbWFyeS5hcHBlbmRDaGlsZCBzeW1ib2xcblxuICAgIGlmIGNvcmVTcGVjcyA+IDBcbiAgICAgIEBjb3JlSGVhZGVyLnRleHRDb250ZW50ID0gXCJDb3JlIFNwZWNzICgje2NvcmVTcGVjc30pXCJcbiAgICBlbHNlXG4gICAgICBAY29yZUFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIGlmIGJ1bmRsZWRQYWNrYWdlU3BlY3MgPiAwXG4gICAgICBAYnVuZGxlZEhlYWRlci50ZXh0Q29udGVudCA9IFwiQnVuZGxlZCBQYWNrYWdlIFNwZWNzICgje2J1bmRsZWRQYWNrYWdlU3BlY3N9KVwiXG4gICAgZWxzZVxuICAgICAgQGJ1bmRsZWRBcmVhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICBpZiB1c2VyUGFja2FnZVNwZWNzID4gMFxuICAgICAgaWYgY29yZVNwZWNzIGlzIDAgYW5kIGJ1bmRsZWRQYWNrYWdlU3BlY3MgaXMgMFxuICAgICAgICAjIFBhY2thZ2Ugc3BlY3MgYmVpbmcgcnVuLCBzaG93IGEgbW9yZSBkZXNjcmlwdGl2ZSBsYWJlbFxuICAgICAgICB7c3BlY0RpcmVjdG9yeX0gPSBzcGVjc1swXVxuICAgICAgICBwYWNrYWdlRm9sZGVyTmFtZSA9IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHNwZWNEaXJlY3RvcnkpKVxuICAgICAgICBwYWNrYWdlTmFtZSA9IF8udW5kYXNoZXJpemUoXy51bmNhbWVsY2FzZShwYWNrYWdlRm9sZGVyTmFtZSkpXG4gICAgICAgIEB1c2VySGVhZGVyLnRleHRDb250ZW50ID0gXCIje3BhY2thZ2VOYW1lfSBTcGVjc1wiXG4gICAgICBlbHNlXG4gICAgICAgIEB1c2VySGVhZGVyLnRleHRDb250ZW50ID0gXCJVc2VyIFBhY2thZ2UgU3BlY3MgKCN7dXNlclBhY2thZ2VTcGVjc30pXCJcbiAgICBlbHNlXG4gICAgICBAdXNlckFyZWEuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG4gIHNwZWNTdGFydGVkOiAoc3BlYykgLT5cbiAgICBAcnVubmluZ1NwZWNDb3VudCsrXG5cbiAgc3BlY0NvbXBsZXRlOiAoc3BlYykgLT5cbiAgICBzcGVjU3VtbWFyeUVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNwZWMtc3VtbWFyeS0je3NwZWMuaWR9XCIpXG4gICAgc3BlY1N1bW1hcnlFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3BlbmRpbmcnKVxuXG4gICAgcmVzdWx0cyA9IHNwZWMucmVzdWx0cygpXG4gICAgaWYgcmVzdWx0cy5za2lwcGVkXG4gICAgICBzcGVjU3VtbWFyeUVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInNraXBwZWRcIilcbiAgICAgIEBza2lwcGVkQ291bnQrK1xuICAgIGVsc2UgaWYgcmVzdWx0cy5wYXNzZWQoKVxuICAgICAgc3BlY1N1bW1hcnlFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJwYXNzZWRcIilcbiAgICAgIEBwYXNzZWRDb3VudCsrXG4gICAgZWxzZVxuICAgICAgc3BlY1N1bW1hcnlFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmYWlsZWRcIilcblxuICAgICAgc3BlY1ZpZXcgPSBuZXcgU3BlY1Jlc3VsdFZpZXcoc3BlYylcbiAgICAgIHNwZWNWaWV3LmF0dGFjaCgpXG4gICAgICBAZmFpbGVkQ291bnQrK1xuXG5jbGFzcyBTdWl0ZVJlc3VsdFZpZXdcbiAgY29uc3RydWN0b3I6IChAc3VpdGUpIC0+XG4gICAgQGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBlbGVtZW50LmNsYXNzTmFtZSA9ICdzdWl0ZSdcbiAgICBAZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgXCJzdWl0ZS12aWV3LSN7QHN1aXRlLmlkfVwiKVxuICAgIEBkZXNjcmlwdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGRlc2NyaXB0aW9uLmNsYXNzTmFtZSA9ICdkZXNjcmlwdGlvbidcbiAgICBAZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSBAc3VpdGUuZGVzY3JpcHRpb25cbiAgICBAZWxlbWVudC5hcHBlbmRDaGlsZChAZGVzY3JpcHRpb24pXG5cbiAgYXR0YWNoOiAtPlxuICAgIChAcGFyZW50U3VpdGVWaWV3KCkgb3IgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlc3VsdHMnKSkuYXBwZW5kQ2hpbGQoQGVsZW1lbnQpXG5cbiAgcGFyZW50U3VpdGVWaWV3OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHN1aXRlLnBhcmVudFN1aXRlXG5cbiAgICB1bmxlc3Mgc3VpdGVWaWV3RWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3VpdGUtdmlldy0je0BzdWl0ZS5wYXJlbnRTdWl0ZS5pZH1cIilcbiAgICAgIHN1aXRlVmlldyA9IG5ldyBTdWl0ZVJlc3VsdFZpZXcoQHN1aXRlLnBhcmVudFN1aXRlKVxuICAgICAgc3VpdGVWaWV3LmF0dGFjaCgpXG4gICAgICBzdWl0ZVZpZXdFbGVtZW50ID0gc3VpdGVWaWV3LmVsZW1lbnRcblxuICAgIHN1aXRlVmlld0VsZW1lbnRcblxuY2xhc3MgU3BlY1Jlc3VsdFZpZXdcbiAgY29uc3RydWN0b3I6IChAc3BlYykgLT5cbiAgICBAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgQGVsZW1lbnQuY2xhc3NOYW1lID0gJ3NwZWMnXG4gICAgQGVsZW1lbnQuaW5uZXJIVE1MID0gXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPSdzcGVjLXRvZ2dsZSc+PC9kaXY+XG4gICAgICA8ZGl2IG91dGxldD0nZGVzY3JpcHRpb24nIGNsYXNzPSdkZXNjcmlwdGlvbic+PC9kaXY+XG4gICAgICA8ZGl2IG91dGxldD0nc3BlY0ZhaWx1cmVzJyBjbGFzcz0nc3BlYy1mYWlsdXJlcyc+PC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQGRlc2NyaXB0aW9uID0gQGVsZW1lbnQucXVlcnlTZWxlY3RvcignW291dGxldD1cImRlc2NyaXB0aW9uXCJdJylcbiAgICBAc3BlY0ZhaWx1cmVzID0gQGVsZW1lbnQucXVlcnlTZWxlY3RvcignW291dGxldD1cInNwZWNGYWlsdXJlc1wiXScpXG5cbiAgICBAZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwic3BlYy12aWV3LSN7QHNwZWMuaWR9XCIpXG5cbiAgICBkZXNjcmlwdGlvbiA9IEBzcGVjLmRlc2NyaXB0aW9uXG4gICAgZGVzY3JpcHRpb24gPSBcIml0ICN7ZGVzY3JpcHRpb259XCIgaWYgZGVzY3JpcHRpb24uaW5kZXhPZignaXQgJykgaXNudCAwXG4gICAgQGRlc2NyaXB0aW9uLnRleHRDb250ZW50ID0gZGVzY3JpcHRpb25cblxuICAgIGZvciByZXN1bHQgaW4gQHNwZWMucmVzdWx0cygpLmdldEl0ZW1zKCkgd2hlbiBub3QgcmVzdWx0LnBhc3NlZCgpXG4gICAgICBzdGFja1RyYWNlID0gZm9ybWF0U3RhY2tUcmFjZShAc3BlYywgcmVzdWx0Lm1lc3NhZ2UsIHJlc3VsdC50cmFjZS5zdGFjaylcblxuICAgICAgcmVzdWx0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICByZXN1bHRFbGVtZW50LmNsYXNzTmFtZSA9ICdyZXN1bHQtbWVzc2FnZSBmYWlsJ1xuICAgICAgcmVzdWx0RWxlbWVudC50ZXh0Q29udGVudCA9IHJlc3VsdC5tZXNzYWdlXG4gICAgICBAc3BlY0ZhaWx1cmVzLmFwcGVuZENoaWxkKHJlc3VsdEVsZW1lbnQpXG5cbiAgICAgIGlmIHN0YWNrVHJhY2VcbiAgICAgICAgdHJhY2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJylcbiAgICAgICAgdHJhY2VFbGVtZW50LmNsYXNzTmFtZSA9ICdzdGFjay10cmFjZSBwYWRkZWQnXG4gICAgICAgIHRyYWNlRWxlbWVudC50ZXh0Q29udGVudCA9IHN0YWNrVHJhY2VcbiAgICAgICAgQHNwZWNGYWlsdXJlcy5hcHBlbmRDaGlsZCh0cmFjZUVsZW1lbnQpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEBwYXJlbnRTdWl0ZVZpZXcoKS5hcHBlbmRDaGlsZChAZWxlbWVudClcblxuICBwYXJlbnRTdWl0ZVZpZXc6IC0+XG4gICAgdW5sZXNzIHN1aXRlVmlld0VsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N1aXRlLXZpZXctI3tAc3BlYy5zdWl0ZS5pZH1cIilcbiAgICAgIHN1aXRlVmlldyA9IG5ldyBTdWl0ZVJlc3VsdFZpZXcoQHNwZWMuc3VpdGUpXG4gICAgICBzdWl0ZVZpZXcuYXR0YWNoKClcbiAgICAgIHN1aXRlVmlld0VsZW1lbnQgPSBzdWl0ZVZpZXcuZWxlbWVudFxuXG4gICAgc3VpdGVWaWV3RWxlbWVudFxuIl19
