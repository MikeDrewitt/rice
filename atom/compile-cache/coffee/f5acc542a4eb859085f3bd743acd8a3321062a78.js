(function() {
  var PEG, allowUnsafeEval, fs, grammarSrc, parser;

  try {
    parser = require('./snippet-body');
  } catch (error) {
    allowUnsafeEval = require('loophole').allowUnsafeEval;
    fs = require('fs-plus');
    PEG = require('pegjs');
    grammarSrc = fs.readFileSync(require.resolve('./snippet-body.pegjs'), 'utf8');
    parser = null;
    allowUnsafeEval(function() {
      return parser = PEG.buildParser(grammarSrc);
    });
  }

  module.exports = parser;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zbmlwcGV0cy9saWIvc25pcHBldC1ib2R5LXBhcnNlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztBQUFBO0lBQ0UsTUFBQSxHQUFTLE9BQUEsQ0FBUSxnQkFBUixFQURYO0dBQUEsYUFBQTtJQUdHLGtCQUFtQixPQUFBLENBQVEsVUFBUjtJQUNwQixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7SUFDTCxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVI7SUFFTixVQUFBLEdBQWEsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0Isc0JBQWhCLENBQWhCLEVBQXlELE1BQXpEO0lBQ2IsTUFBQSxHQUFTO0lBQ1QsZUFBQSxDQUFnQixTQUFBO2FBQUcsTUFBQSxHQUFTLEdBQUcsQ0FBQyxXQUFKLENBQWdCLFVBQWhCO0lBQVosQ0FBaEIsRUFURjs7O0VBV0EsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFYakIiLCJzb3VyY2VzQ29udGVudCI6WyJ0cnlcbiAgcGFyc2VyID0gcmVxdWlyZSAnLi9zbmlwcGV0LWJvZHknXG5jYXRjaFxuICB7YWxsb3dVbnNhZmVFdmFsfSA9IHJlcXVpcmUgJ2xvb3Bob2xlJ1xuICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gIFBFRyA9IHJlcXVpcmUgJ3BlZ2pzJ1xuXG4gIGdyYW1tYXJTcmMgPSBmcy5yZWFkRmlsZVN5bmMocmVxdWlyZS5yZXNvbHZlKCcuL3NuaXBwZXQtYm9keS5wZWdqcycpLCAndXRmOCcpXG4gIHBhcnNlciA9IG51bGxcbiAgYWxsb3dVbnNhZmVFdmFsIC0+IHBhcnNlciA9IFBFRy5idWlsZFBhcnNlcihncmFtbWFyU3JjKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlclxuIl19
