(function() {
  var Range, Snippet, _;

  _ = require('underscore-plus');

  Range = require('atom').Range;

  module.exports = Snippet = (function() {
    function Snippet(arg) {
      var bodyTree;
      this.name = arg.name, this.prefix = arg.prefix, this.bodyText = arg.bodyText, this.description = arg.description, this.descriptionMoreURL = arg.descriptionMoreURL, this.rightLabelHTML = arg.rightLabelHTML, this.leftLabel = arg.leftLabel, this.leftLabelHTML = arg.leftLabelHTML, bodyTree = arg.bodyTree;
      this.body = this.extractTabStops(bodyTree);
    }

    Snippet.prototype.extractTabStops = function(bodyTree) {
      var bodyText, column, extractTabStops, i, index, len, ref, ref1, row, tabStopsByIndex;
      tabStopsByIndex = {};
      bodyText = [];
      ref = [0, 0], row = ref[0], column = ref[1];
      extractTabStops = function(bodyTree) {
        var content, i, index, len, nextLine, results, segment, segmentLines, start;
        results = [];
        for (i = 0, len = bodyTree.length; i < len; i++) {
          segment = bodyTree[i];
          if (segment.index != null) {
            index = segment.index, content = segment.content;
            if (index === 0) {
              index = 2e308;
            }
            start = [row, column];
            extractTabStops(content);
            if (tabStopsByIndex[index] == null) {
              tabStopsByIndex[index] = [];
            }
            results.push(tabStopsByIndex[index].push(new Range(start, [row, column])));
          } else if (_.isString(segment)) {
            bodyText.push(segment);
            segmentLines = segment.split('\n');
            column += segmentLines.shift().length;
            results.push((function() {
              var results1;
              results1 = [];
              while ((nextLine = segmentLines.shift()) != null) {
                row += 1;
                results1.push(column = nextLine.length);
              }
              return results1;
            })());
          } else {
            results.push(void 0);
          }
        }
        return results;
      };
      extractTabStops(bodyTree);
      this.lineCount = row + 1;
      this.tabStops = [];
      ref1 = _.keys(tabStopsByIndex).sort((function(arg1, arg2) {
        return arg1 - arg2;
      }));
      for (i = 0, len = ref1.length; i < len; i++) {
        index = ref1[i];
        this.tabStops.push(tabStopsByIndex[index]);
      }
      return bodyText.join('');
    };

    return Snippet;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zbmlwcGV0cy9saWIvc25pcHBldC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0gsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsaUJBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSxJQUFDLENBQUEsV0FBQSxNQUFNLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLGVBQUEsVUFBVSxJQUFDLENBQUEsa0JBQUEsYUFBYSxJQUFDLENBQUEseUJBQUEsb0JBQW9CLElBQUMsQ0FBQSxxQkFBQSxnQkFBZ0IsSUFBQyxDQUFBLGdCQUFBLFdBQVcsSUFBQyxDQUFBLG9CQUFBLGVBQWU7TUFDeEgsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsZUFBRCxDQUFpQixRQUFqQjtJQURHOztzQkFHYixlQUFBLEdBQWlCLFNBQUMsUUFBRDtBQUNmLFVBQUE7TUFBQSxlQUFBLEdBQWtCO01BQ2xCLFFBQUEsR0FBVztNQUNYLE1BQWdCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBaEIsRUFBQyxZQUFELEVBQU07TUFHTixlQUFBLEdBQWtCLFNBQUMsUUFBRDtBQUNoQixZQUFBO0FBQUE7YUFBQSwwQ0FBQTs7VUFDRSxJQUFHLHFCQUFIO1lBQ0cscUJBQUQsRUFBUTtZQUNSLElBQW9CLEtBQUEsS0FBUyxDQUE3QjtjQUFBLEtBQUEsR0FBUSxNQUFSOztZQUNBLEtBQUEsR0FBUSxDQUFDLEdBQUQsRUFBTSxNQUFOO1lBQ1IsZUFBQSxDQUFnQixPQUFoQjs7Y0FDQSxlQUFnQixDQUFBLEtBQUEsSUFBVTs7eUJBQzFCLGVBQWdCLENBQUEsS0FBQSxDQUFNLENBQUMsSUFBdkIsQ0FBZ0MsSUFBQSxLQUFBLENBQU0sS0FBTixFQUFhLENBQUMsR0FBRCxFQUFNLE1BQU4sQ0FBYixDQUFoQyxHQU5GO1dBQUEsTUFPSyxJQUFHLENBQUMsQ0FBQyxRQUFGLENBQVcsT0FBWCxDQUFIO1lBQ0gsUUFBUSxDQUFDLElBQVQsQ0FBYyxPQUFkO1lBQ0EsWUFBQSxHQUFlLE9BQU8sQ0FBQyxLQUFSLENBQWMsSUFBZDtZQUNmLE1BQUEsSUFBVSxZQUFZLENBQUMsS0FBYixDQUFBLENBQW9CLENBQUM7OztBQUMvQjtxQkFBTSx5Q0FBTjtnQkFDRSxHQUFBLElBQU87OEJBQ1AsTUFBQSxHQUFTLFFBQVEsQ0FBQztjQUZwQixDQUFBOztrQkFKRztXQUFBLE1BQUE7aUNBQUE7O0FBUlA7O01BRGdCO01BaUJsQixlQUFBLENBQWdCLFFBQWhCO01BQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYSxHQUFBLEdBQU07TUFDbkIsSUFBQyxDQUFBLFFBQUQsR0FBWTtBQUNaOzs7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLGVBQWdCLENBQUEsS0FBQSxDQUEvQjtBQURGO2FBR0EsUUFBUSxDQUFDLElBQVQsQ0FBYyxFQUFkO0lBN0JlOzs7OztBQVJuQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57UmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU25pcHBldFxuICBjb25zdHJ1Y3RvcjogKHtAbmFtZSwgQHByZWZpeCwgQGJvZHlUZXh0LCBAZGVzY3JpcHRpb24sIEBkZXNjcmlwdGlvbk1vcmVVUkwsIEByaWdodExhYmVsSFRNTCwgQGxlZnRMYWJlbCwgQGxlZnRMYWJlbEhUTUwsIGJvZHlUcmVlfSkgLT5cbiAgICBAYm9keSA9IEBleHRyYWN0VGFiU3RvcHMoYm9keVRyZWUpXG5cbiAgZXh0cmFjdFRhYlN0b3BzOiAoYm9keVRyZWUpIC0+XG4gICAgdGFiU3RvcHNCeUluZGV4ID0ge31cbiAgICBib2R5VGV4dCA9IFtdXG4gICAgW3JvdywgY29sdW1uXSA9IFswLCAwXVxuXG4gICAgIyByZWN1cnNpdmUgaGVscGVyIGZ1bmN0aW9uOyBtdXRhdGVzIHZhcnMgYWJvdmVcbiAgICBleHRyYWN0VGFiU3RvcHMgPSAoYm9keVRyZWUpIC0+XG4gICAgICBmb3Igc2VnbWVudCBpbiBib2R5VHJlZVxuICAgICAgICBpZiBzZWdtZW50LmluZGV4P1xuICAgICAgICAgIHtpbmRleCwgY29udGVudH0gPSBzZWdtZW50XG4gICAgICAgICAgaW5kZXggPSBJbmZpbml0eSBpZiBpbmRleCBpcyAwXG4gICAgICAgICAgc3RhcnQgPSBbcm93LCBjb2x1bW5dXG4gICAgICAgICAgZXh0cmFjdFRhYlN0b3BzKGNvbnRlbnQpXG4gICAgICAgICAgdGFiU3RvcHNCeUluZGV4W2luZGV4XSA/PSBbXVxuICAgICAgICAgIHRhYlN0b3BzQnlJbmRleFtpbmRleF0ucHVzaCBuZXcgUmFuZ2Uoc3RhcnQsIFtyb3csIGNvbHVtbl0pXG4gICAgICAgIGVsc2UgaWYgXy5pc1N0cmluZyhzZWdtZW50KVxuICAgICAgICAgIGJvZHlUZXh0LnB1c2goc2VnbWVudClcbiAgICAgICAgICBzZWdtZW50TGluZXMgPSBzZWdtZW50LnNwbGl0KCdcXG4nKVxuICAgICAgICAgIGNvbHVtbiArPSBzZWdtZW50TGluZXMuc2hpZnQoKS5sZW5ndGhcbiAgICAgICAgICB3aGlsZSAobmV4dExpbmUgPSBzZWdtZW50TGluZXMuc2hpZnQoKSk/XG4gICAgICAgICAgICByb3cgKz0gMVxuICAgICAgICAgICAgY29sdW1uID0gbmV4dExpbmUubGVuZ3RoXG5cbiAgICBleHRyYWN0VGFiU3RvcHMoYm9keVRyZWUpXG4gICAgQGxpbmVDb3VudCA9IHJvdyArIDFcbiAgICBAdGFiU3RvcHMgPSBbXVxuICAgIGZvciBpbmRleCBpbiBfLmtleXModGFiU3RvcHNCeUluZGV4KS5zb3J0KCgoYXJnMSwgYXJnMikgLT4gYXJnMS1hcmcyKSlcbiAgICAgIEB0YWJTdG9wcy5wdXNoIHRhYlN0b3BzQnlJbmRleFtpbmRleF1cblxuICAgIGJvZHlUZXh0LmpvaW4oJycpXG4iXX0=
