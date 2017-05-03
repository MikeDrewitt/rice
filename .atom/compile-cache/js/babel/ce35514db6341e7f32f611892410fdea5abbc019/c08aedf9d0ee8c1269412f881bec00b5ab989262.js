Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/** @babel */

var _chartJs = require('chart.js');

var _chartJs2 = _interopRequireDefault(_chartJs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

exports['default'] = _asyncToGenerator(function* (_ref) {
  var test = _ref.test;
  var benchmarkPaths = _ref.benchmarkPaths;

  document.body.style.backgroundColor = '#ffffff';
  document.body.style.overflow = 'auto';

  var paths = [];
  for (var benchmarkPath of benchmarkPaths) {
    if (_fsPlus2['default'].isDirectorySync(benchmarkPath)) {
      paths = paths.concat(_glob2['default'].sync(_path2['default'].join(benchmarkPath, '**', '*.bench.js')));
    } else {
      paths.push(benchmarkPath);
    }
  }

  while (paths.length > 0) {
    var benchmark = require(paths.shift())({ test: test });
    var results = undefined;
    if (benchmark instanceof Promise) {
      results = yield benchmark;
    } else {
      results = benchmark;
    }

    var dataByBenchmarkName = {};
    for (var _ref22 of results) {
      var _name = _ref22.name;
      var duration = _ref22.duration;
      var x = _ref22.x;

      dataByBenchmarkName[_name] = dataByBenchmarkName[_name] || { points: [] };
      dataByBenchmarkName[_name].points.push({ x: x, y: duration });
    }

    var benchmarkContainer = document.createElement('div');
    document.body.appendChild(benchmarkContainer);
    for (var key in dataByBenchmarkName) {
      var data = dataByBenchmarkName[key];
      if (data.points.length > 1) {
        var canvas = document.createElement('canvas');
        benchmarkContainer.appendChild(canvas);
        var chart = new _chartJs2['default'](canvas, {
          type: 'line',
          data: {
            datasets: [{ label: key, fill: false, data: data.points }]
          },
          options: {
            showLines: false,
            scales: { xAxes: [{ type: 'linear', position: 'bottom' }] }
          }
        });

        var textualOutput = key + ':\n\n' + data.points.map(function (p) {
          return p.x + '\t' + p.y;
        }).join('\n');
        console.log(textualOutput);
      } else {
        var title = document.createElement('h2');
        title.textContent = key;
        benchmarkContainer.appendChild(title);
        var duration = document.createElement('p');
        duration.textContent = data.points[0].y + 'ms';
        benchmarkContainer.appendChild(duration);

        var textualOutput = key + ': ' + data.points[0].y;
        console.log(textualOutput);
      }

      global.atom.reset();
    }
  }

  return 0;
});
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9iZW5jaG1hcmtzL2JlbmNobWFyay1ydW5uZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt1QkFFa0IsVUFBVTs7OztvQkFDWCxNQUFNOzs7O3NCQUNSLFNBQVM7Ozs7b0JBQ1AsTUFBTTs7Ozt1Q0FFUixXQUFnQixJQUFzQixFQUFFO01BQXZCLElBQUksR0FBTCxJQUFzQixDQUFyQixJQUFJO01BQUUsY0FBYyxHQUFyQixJQUFzQixDQUFmLGNBQWM7O0FBQ2xELFVBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7QUFDL0MsVUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQTs7QUFFckMsTUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFBO0FBQ2QsT0FBSyxJQUFNLGFBQWEsSUFBSSxjQUFjLEVBQUU7QUFDMUMsUUFBSSxvQkFBRyxlQUFlLENBQUMsYUFBYSxDQUFDLEVBQUU7QUFDckMsV0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsa0JBQUssSUFBSSxDQUFDLGtCQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUM5RSxNQUFNO0FBQ0wsV0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtLQUMxQjtHQUNGOztBQUVELFNBQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDdkIsUUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFKLElBQUksRUFBQyxDQUFDLENBQUE7QUFDaEQsUUFBSSxPQUFPLFlBQUEsQ0FBQTtBQUNYLFFBQUksU0FBUyxZQUFZLE9BQU8sRUFBRTtBQUNoQyxhQUFPLEdB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YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL2JlbmNobWFya3MvYmVuY2htYXJrLXJ1bm5lci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IENoYXJ0IGZyb20gJ2NoYXJ0LmpzJ1xuaW1wb3J0IGdsb2IgZnJvbSAnZ2xvYidcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKHt0ZXN0LCBiZW5jaG1hcmtQYXRoc30pIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2ZmZmZmZidcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJ1xuXG4gIGxldCBwYXRocyA9IFtdXG4gIGZvciAoY29uc3QgYmVuY2htYXJrUGF0aCBvZiBiZW5jaG1hcmtQYXRocykge1xuICAgIGlmIChmcy5pc0RpcmVjdG9yeVN5bmMoYmVuY2htYXJrUGF0aCkpIHtcbiAgICAgIHBhdGhzID0gcGF0aHMuY29uY2F0KGdsb2Iuc3luYyhwYXRoLmpvaW4oYmVuY2htYXJrUGF0aCwgJyoqJywgJyouYmVuY2guanMnKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGhzLnB1c2goYmVuY2htYXJrUGF0aClcbiAgICB9XG4gIH1cblxuICB3aGlsZSAocGF0aHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGJlbmNobWFyayA9IHJlcXVpcmUocGF0aHMuc2hpZnQoKSkoe3Rlc3R9KVxuICAgIGxldCByZXN1bHRzXG4gICAgaWYgKGJlbmNobWFyayBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCBiZW5jaG1hcmtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0cyA9IGJlbmNobWFya1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGFCeUJlbmNobWFya05hbWUgPSB7fVxuICAgIGZvciAoY29uc3Qge25hbWUsIGR1cmF0aW9uLCB4fSBvZiByZXN1bHRzKSB7XG4gICAgICBkYXRhQnlCZW5jaG1hcmtOYW1lW25hbWVdID0gZGF0YUJ5QmVuY2htYXJrTmFtZVtuYW1lXSB8fCB7cG9pbnRzOiBbXX1cbiAgICAgIGRhdGFCeUJlbmNobWFya05hbWVbbmFtZV0ucG9pbnRzLnB1c2goe3gsIHk6IGR1cmF0aW9ufSlcbiAgICB9XG5cbiAgICBjb25zdCBiZW5jaG1hcmtDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYmVuY2htYXJrQ29udGFpbmVyKVxuICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGFCeUJlbmNobWFya05hbWUpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBkYXRhQnlCZW5jaG1hcmtOYW1lW2tleV1cbiAgICAgIGlmIChkYXRhLnBvaW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXG4gICAgICAgIGJlbmNobWFya0NvbnRhaW5lci5hcHBlbmRDaGlsZChjYW52YXMpXG4gICAgICAgIGNvbnN0IGNoYXJ0ID0gbmV3IENoYXJ0KGNhbnZhcywge1xuICAgICAgICAgIHR5cGU6ICdsaW5lJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkYXRhc2V0czogW3tsYWJlbDoga2V5LCBmaWxsOiBmYWxzZSwgZGF0YTogZGF0YS5wb2ludHN9XVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc2hvd0xpbmVzOiBmYWxzZSxcbiAgICAgICAgICAgIHNjYWxlczoge3hBeGVzOiBbe3R5cGU6ICdsaW5lYXInLCBwb3NpdGlvbjogJ2JvdHRvbSd9XX1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3QgdGV4dHVhbE91dHB1dCA9IGAke2tleX06XFxuXFxuYCArIGRhdGEucG9pbnRzLm1hcCgocCkgPT4gYCR7cC54fVxcdCR7cC55fWApLmpvaW4oJ1xcbicpXG4gICAgICAgIGNvbnNvbGUubG9nKHRleHR1YWxPdXRwdXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJylcbiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSBrZXlcbiAgICAgICAgYmVuY2htYXJrQ29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKVxuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKVxuICAgICAgICBkdXJhdGlvbi50ZXh0Q29udGVudCA9IGAke2RhdGEucG9pbnRzWzBdLnl9bXNgXG4gICAgICAgIGJlbmNobWFya0NvbnRhaW5lci5hcHBlbmRDaGlsZChkdXJhdGlvbilcblxuICAgICAgICBjb25zdCB0ZXh0dWFsT3V0cHV0ID0gYCR7a2V5fTogJHtkYXRhLnBvaW50c1swXS55fWBcbiAgICAgICAgY29uc29sZS5sb2codGV4dHVhbE91dHB1dClcbiAgICAgIH1cblxuICAgICAgZ2xvYmFsLmF0b20ucmVzZXQoKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwXG59XG4iXX0=