(function() {
  var TimeReporter, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  module.exports = TimeReporter = (function(superClass) {
    extend(TimeReporter, superClass);

    function TimeReporter() {
      window.timedSpecs = [];
      window.timedSuites = {};
      window.logLongestSpec = (function(_this) {
        return function() {
          return _this.logLongestSpecs(1);
        };
      })(this);
      window.logLongestSpecs = (function(_this) {
        return function(number) {
          return _this.logLongestSpecs(number);
        };
      })(this);
      window.logLongestSuite = (function(_this) {
        return function() {
          return _this.logLongestSuites(1);
        };
      })(this);
      window.logLongestSuites = (function(_this) {
        return function(number) {
          return _this.logLongestSuites(number);
        };
      })(this);
    }

    TimeReporter.prototype.logLongestSuites = function(number, log) {
      var i, len, ref, suite, suites, time;
      if (number == null) {
        number = 10;
      }
      if (!(window.timedSuites.length > 0)) {
        return;
      }
      if (log == null) {
        log = function(line) {
          return console.log(line);
        };
      }
      log("Longest running suites:");
      suites = _.map(window.timedSuites, function(key, value) {
        return [value, key];
      });
      ref = _.sortBy(suites, function(suite) {
        return -suite[1];
      }).slice(0, number);
      for (i = 0, len = ref.length; i < len; i++) {
        suite = ref[i];
        time = Math.round(suite[1] / 100) / 10;
        log("  " + suite[0] + " (" + time + "s)");
      }
      return void 0;
    };

    TimeReporter.prototype.logLongestSpecs = function(number, log) {
      var i, len, ref, spec, time;
      if (number == null) {
        number = 10;
      }
      if (!(window.timedSpecs.length > 0)) {
        return;
      }
      if (log == null) {
        log = function(line) {
          return console.log(line);
        };
      }
      log("Longest running specs:");
      ref = _.sortBy(window.timedSpecs, function(spec) {
        return -spec.time;
      }).slice(0, number);
      for (i = 0, len = ref.length; i < len; i++) {
        spec = ref[i];
        time = Math.round(spec.time / 100) / 10;
        log(spec.description + " (" + time + "s)");
      }
      return void 0;
    };

    TimeReporter.prototype.reportSpecStarting = function(spec) {
      var reducer, stack, suite;
      stack = [spec.description];
      suite = spec.suite;
      while (suite) {
        stack.unshift(suite.description);
        this.suite = suite.description;
        suite = suite.parentSuite;
      }
      reducer = function(memo, description, index) {
        if (index === 0) {
          return "" + description;
        } else {
          return memo + "\n" + (_.multiplyString('  ', index)) + description;
        }
      };
      this.description = _.reduce(stack, reducer, '');
      return this.time = Date.now();
    };

    TimeReporter.prototype.reportSpecResults = function(spec) {
      var duration;
      if (!((this.time != null) && (this.description != null))) {
        return;
      }
      duration = Date.now() - this.time;
      if (duration > 0) {
        window.timedSpecs.push({
          description: this.description,
          time: duration,
          fullName: spec.getFullName()
        });
        if (window.timedSuites[this.suite]) {
          window.timedSuites[this.suite] += duration;
        } else {
          window.timedSuites[this.suite] = duration;
        }
      }
      this.time = null;
      return this.description = null;
    };

    return TimeReporter;

  })(jasmine.Reporter);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NwZWMvdGltZS1yZXBvcnRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGVBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFFUyxzQkFBQTtNQUNYLE1BQU0sQ0FBQyxVQUFQLEdBQW9CO01BQ3BCLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO01BRXJCLE1BQU0sQ0FBQyxjQUFQLEdBQXdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsZUFBRCxDQUFpQixDQUFqQjtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUN4QixNQUFNLENBQUMsZUFBUCxHQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFBWSxLQUFDLENBQUEsZUFBRCxDQUFpQixNQUFqQjtRQUFaO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUN6QixNQUFNLENBQUMsZUFBUCxHQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLGdCQUFELENBQWtCLENBQWxCO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BQ3pCLE1BQU0sQ0FBQyxnQkFBUCxHQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFBWSxLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEI7UUFBWjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7SUFQZjs7MkJBU2IsZ0JBQUEsR0FBa0IsU0FBQyxNQUFELEVBQVksR0FBWjtBQUNoQixVQUFBOztRQURpQixTQUFPOztNQUN4QixJQUFBLENBQUEsQ0FBYyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQW5C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QUMsV0FBWSxDQUFBLElBQUMsQ0FBQSxLQUFELENBQW5CLEdBQTZCLFNBSC9CO1NBTkY7O01BV0EsSUFBQyxDQUFBLElBQUQsR0FBUTthQUNSLElBQUMsQ0FBQSxXQUFELEdBQWU7SUFqQkU7Ozs7S0FoRE0sT0FBTyxDQUFDO0FBSG5DIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGltZVJlcG9ydGVyIGV4dGVuZHMgamFzbWluZS5SZXBvcnRlclxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIHdpbmRvdy50aW1lZFNwZWNzID0gW11cbiAgICB3aW5kb3cudGltZWRTdWl0ZXMgPSB7fVxuXG4gICAgd2luZG93LmxvZ0xvbmdlc3RTcGVjID0gPT4gQGxvZ0xvbmdlc3RTcGVjcygxKVxuICAgIHdpbmRvdy5sb2dMb25nZXN0U3BlY3MgPSAobnVtYmVyKSA9PiBAbG9nTG9uZ2VzdFNwZWNzKG51bWJlcilcbiAgICB3aW5kb3cubG9nTG9uZ2VzdFN1aXRlID0gPT4gQGxvZ0xvbmdlc3RTdWl0ZXMoMSlcbiAgICB3aW5kb3cubG9nTG9uZ2VzdFN1aXRlcyA9IChudW1iZXIpID0+IEBsb2dMb25nZXN0U3VpdGVzKG51bWJlcilcblxuICBsb2dMb25nZXN0U3VpdGVzOiAobnVtYmVyPTEwLCBsb2cpIC0+XG4gICAgcmV0dXJuIHVubGVzcyB3aW5kb3cudGltZWRTdWl0ZXMubGVuZ3RoID4gMFxuXG4gICAgbG9nID89IChsaW5lKSAtPiBjb25zb2xlLmxvZyhsaW5lKVxuICAgIGxvZyBcIkxvbmdlc3QgcnVubmluZyBzdWl0ZXM6XCJcbiAgICBzdWl0ZXMgPSBfLm1hcCh3aW5kb3cudGltZWRTdWl0ZXMsIChrZXksIHZhbHVlKSAtPiBbdmFsdWUsIGtleV0pXG4gICAgZm9yIHN1aXRlIGluIF8uc29ydEJ5KHN1aXRlcywgKHN1aXRlKSAtPiAtc3VpdGVbMV0pWzAuLi5udW1iZXJdXG4gICAgICB0aW1lID0gTWF0aC5yb3VuZChzdWl0ZVsxXSAvIDEwMCkgLyAxMFxuICAgICAgbG9nIFwiICAje3N1aXRlWzBdfSAoI3t0aW1lfXMpXCJcbiAgICB1bmRlZmluZWRcblxuICBsb2dMb25nZXN0U3BlY3M6IChudW1iZXI9MTAsIGxvZykgLT5cbiAgICByZXR1cm4gdW5sZXNzIHdpbmRvdy50aW1lZFNwZWNzLmxlbmd0aCA+IDBcblxuICAgIGxvZyA/PSAobGluZSkgLT4gY29uc29sZS5sb2cobGluZSlcbiAgICBsb2cgXCJMb25nZXN0IHJ1bm5pbmcgc3BlY3M6XCJcbiAgICBmb3Igc3BlYyBpbiBfLnNvcnRCeSh3aW5kb3cudGltZWRTcGVjcywgKHNwZWMpIC0+IC1zcGVjLnRpbWUpWzAuLi5udW1iZXJdXG4gICAgICB0aW1lID0gTWF0aC5yb3VuZChzcGVjLnRpbWUgLyAxMDApIC8gMTBcbiAgICAgIGxvZyBcIiN7c3BlYy5kZXNjcmlwdGlvbn0gKCN7dGltZX1zKVwiXG4gICAgdW5kZWZpbmVkXG5cbiAgcmVwb3J0U3BlY1N0YXJ0aW5nOiAoc3BlYykgLT5cbiAgICBzdGFjayA9IFtzcGVjLmRlc2NyaXB0aW9uXVxuICAgIHN1aXRlID0gc3BlYy5zdWl0ZVxuICAgIHdoaWxlIHN1aXRlXG4gICAgICBzdGFjay51bnNoaWZ0IHN1aXRlLmRlc2NyaXB0aW9uXG4gICAgICBAc3VpdGUgPSBzdWl0ZS5kZXNjcmlwdGlvblxuICAgICAgc3VpdGUgPSBzdWl0ZS5wYXJlbnRTdWl0ZVxuXG4gICAgcmVkdWNlciA9IChtZW1vLCBkZXNjcmlwdGlvbiwgaW5kZXgpIC0+XG4gICAgICBpZiBpbmRleCBpcyAwXG4gICAgICAgIFwiI3tkZXNjcmlwdGlvbn1cIlxuICAgICAgZWxzZVxuICAgICAgICBcIiN7bWVtb31cXG4je18ubXVsdGlwbHlTdHJpbmcoJyAgJywgaW5kZXgpfSN7ZGVzY3JpcHRpb259XCJcbiAgICBAZGVzY3JpcHRpb24gPSBfLnJlZHVjZShzdGFjaywgcmVkdWNlciwgJycpXG4gICAgQHRpbWUgPSBEYXRlLm5vdygpXG5cbiAgcmVwb3J0U3BlY1Jlc3VsdHM6IChzcGVjKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQHRpbWU/IGFuZCBAZGVzY3JpcHRpb24/XG5cbiAgICBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBAdGltZVxuXG4gICAgaWYgZHVyYXRpb24gPiAwXG4gICAgICB3aW5kb3cudGltZWRTcGVjcy5wdXNoXG4gICAgICAgIGRlc2NyaXB0aW9uOiBAZGVzY3JpcHRpb25cbiAgICAgICAgdGltZTogZHVyYXRpb25cbiAgICAgICAgZnVsbE5hbWU6IHNwZWMuZ2V0RnVsbE5hbWUoKVxuXG4gICAgICBpZiB3aW5kb3cudGltZWRTdWl0ZXNbQHN1aXRlXVxuICAgICAgICB3aW5kb3cudGltZWRTdWl0ZXNbQHN1aXRlXSArPSBkdXJhdGlvblxuICAgICAgZWxzZVxuICAgICAgICB3aW5kb3cudGltZWRTdWl0ZXNbQHN1aXRlXSA9IGR1cmF0aW9uXG5cbiAgICBAdGltZSA9IG51bGxcbiAgICBAZGVzY3JpcHRpb24gPSBudWxsXG4iXX0=
