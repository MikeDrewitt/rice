(function() {
  var scopesByFenceName;

  scopesByFenceName = {
    'sh': 'source.shell',
    'bash': 'source.shell',
    'c': 'source.c',
    'c++': 'source.cpp',
    'cpp': 'source.cpp',
    'coffee': 'source.coffee',
    'coffeescript': 'source.coffee',
    'coffee-script': 'source.coffee',
    'cs': 'source.cs',
    'csharp': 'source.cs',
    'css': 'source.css',
    'scss': 'source.css.scss',
    'sass': 'source.sass',
    'erlang': 'source.erl',
    'go': 'source.go',
    'html': 'text.html.basic',
    'java': 'source.java',
    'js': 'source.js',
    'javascript': 'source.js',
    'json': 'source.json',
    'less': 'source.less',
    'mustache': 'text.html.mustache',
    'objc': 'source.objc',
    'objective-c': 'source.objc',
    'php': 'text.html.php',
    'py': 'source.python',
    'python': 'source.python',
    'rb': 'source.ruby',
    'ruby': 'source.ruby',
    'text': 'text.plain',
    'toml': 'source.toml',
    'xml': 'text.xml',
    'yaml': 'source.yaml',
    'yml': 'source.yaml'
  };

  module.exports = {
    scopeForFenceName: function(fenceName) {
      var ref;
      fenceName = fenceName.toLowerCase();
      return (ref = scopesByFenceName[fenceName]) != null ? ref : "source." + fenceName;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9tYXJrZG93bi1wcmV2aWV3L2xpYi9leHRlbnNpb24taGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsaUJBQUEsR0FDRTtJQUFBLElBQUEsRUFBTSxjQUFOO0lBQ0EsTUFBQSxFQUFRLGNBRFI7SUFFQSxHQUFBLEVBQUssVUFGTDtJQUdBLEtBQUEsRUFBTyxZQUhQO0lBSUEsS0FBQSxFQUFPLFlBSlA7SUFLQSxRQUFBLEVBQVUsZUFMVjtJQU1BLGNBQUEsRUFBZ0IsZUFOaEI7SUFPQSxlQUFBLEVBQWlCLGVBUGpCO0lBUUEsSUFBQSxFQUFNLFdBUk47SUFTQSxRQUFBLEVBQVUsV0FUVjtJQVVBLEtBQUEsRUFBTyxZQVZQO0lBV0EsTUFBQSxFQUFRLGlCQVhSO0lBWUEsTUFBQSxFQUFRLGFBWlI7SUFhQSxRQUFBLEVBQVUsWUFiVjtJQWNBLElBQUEsRUFBTSxXQWROO0lBZUEsTUFBQSxFQUFRLGlCQWZSO0lBZ0JBLE1BQUEsRUFBUSxhQWhCUjtJQWlCQSxJQUFBLEVBQU0sV0FqQk47SUFrQkEsWUFBQSxFQUFjLFdBbEJkO0lBbUJBLE1BQUEsRUFBUSxhQW5CUjtJQW9CQSxNQUFBLEVBQVEsYUFwQlI7SUFxQkEsVUFBQSxFQUFZLG9CQXJCWjtJQXNCQSxNQUFBLEVBQVEsYUF0QlI7SUF1QkEsYUFBQSxFQUFlLGFBdkJmO0lBd0JBLEtBQUEsRUFBTyxlQXhCUDtJQXlCQSxJQUFBLEVBQU0sZUF6Qk47SUEwQkEsUUFBQSxFQUFVLGVBMUJWO0lBMkJBLElBQUEsRUFBTSxhQTNCTjtJQTRCQSxNQUFBLEVBQVEsYUE1QlI7SUE2QkEsTUFBQSxFQUFRLFlBN0JSO0lBOEJBLE1BQUEsRUFBUSxhQTlCUjtJQStCQSxLQUFBLEVBQU8sVUEvQlA7SUFnQ0EsTUFBQSxFQUFRLGFBaENSO0lBaUNBLEtBQUEsRUFBTyxhQWpDUDs7O0VBbUNGLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxpQkFBQSxFQUFtQixTQUFDLFNBQUQ7QUFDakIsVUFBQTtNQUFBLFNBQUEsR0FBWSxTQUFTLENBQUMsV0FBVixDQUFBO2tFQUNtQixTQUFBLEdBQVU7SUFGeEIsQ0FBbkI7O0FBckNGIiwic291cmNlc0NvbnRlbnQiOlsic2NvcGVzQnlGZW5jZU5hbWUgPVxuICAnc2gnOiAnc291cmNlLnNoZWxsJ1xuICAnYmFzaCc6ICdzb3VyY2Uuc2hlbGwnXG4gICdjJzogJ3NvdXJjZS5jJ1xuICAnYysrJzogJ3NvdXJjZS5jcHAnXG4gICdjcHAnOiAnc291cmNlLmNwcCdcbiAgJ2NvZmZlZSc6ICdzb3VyY2UuY29mZmVlJ1xuICAnY29mZmVlc2NyaXB0JzogJ3NvdXJjZS5jb2ZmZWUnXG4gICdjb2ZmZWUtc2NyaXB0JzogJ3NvdXJjZS5jb2ZmZWUnXG4gICdjcyc6ICdzb3VyY2UuY3MnXG4gICdjc2hhcnAnOiAnc291cmNlLmNzJ1xuICAnY3NzJzogJ3NvdXJjZS5jc3MnXG4gICdzY3NzJzogJ3NvdXJjZS5jc3Muc2NzcydcbiAgJ3Nhc3MnOiAnc291cmNlLnNhc3MnXG4gICdlcmxhbmcnOiAnc291cmNlLmVybCdcbiAgJ2dvJzogJ3NvdXJjZS5nbydcbiAgJ2h0bWwnOiAndGV4dC5odG1sLmJhc2ljJ1xuICAnamF2YSc6ICdzb3VyY2UuamF2YSdcbiAgJ2pzJzogJ3NvdXJjZS5qcydcbiAgJ2phdmFzY3JpcHQnOiAnc291cmNlLmpzJ1xuICAnanNvbic6ICdzb3VyY2UuanNvbidcbiAgJ2xlc3MnOiAnc291cmNlLmxlc3MnXG4gICdtdXN0YWNoZSc6ICd0ZXh0Lmh0bWwubXVzdGFjaGUnXG4gICdvYmpjJzogJ3NvdXJjZS5vYmpjJ1xuICAnb2JqZWN0aXZlLWMnOiAnc291cmNlLm9iamMnXG4gICdwaHAnOiAndGV4dC5odG1sLnBocCdcbiAgJ3B5JzogJ3NvdXJjZS5weXRob24nXG4gICdweXRob24nOiAnc291cmNlLnB5dGhvbidcbiAgJ3JiJzogJ3NvdXJjZS5ydWJ5J1xuICAncnVieSc6ICdzb3VyY2UucnVieSdcbiAgJ3RleHQnOiAndGV4dC5wbGFpbidcbiAgJ3RvbWwnOiAnc291cmNlLnRvbWwnXG4gICd4bWwnOiAndGV4dC54bWwnXG4gICd5YW1sJzogJ3NvdXJjZS55YW1sJ1xuICAneW1sJzogJ3NvdXJjZS55YW1sJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHNjb3BlRm9yRmVuY2VOYW1lOiAoZmVuY2VOYW1lKSAtPlxuICAgIGZlbmNlTmFtZSA9IGZlbmNlTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgc2NvcGVzQnlGZW5jZU5hbWVbZmVuY2VOYW1lXSA/IFwic291cmNlLiN7ZmVuY2VOYW1lfVwiXG4iXX0=
