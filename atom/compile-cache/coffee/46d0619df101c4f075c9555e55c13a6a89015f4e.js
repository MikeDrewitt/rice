(function() {
  var $, Highlights, _, cheerio, convertCodeBlocksToAtomEditors, fs, highlighter, packagePath, path, render, resolveImagePaths, resourcePath, roaster, sanitize, scopeForFenceName, tokenizeCodeBlocks;

  path = require('path');

  _ = require('underscore-plus');

  cheerio = require('cheerio');

  fs = require('fs-plus');

  Highlights = require('highlights');

  $ = require('atom-space-pen-views').$;

  roaster = null;

  scopeForFenceName = require('./extension-helper').scopeForFenceName;

  highlighter = null;

  resourcePath = atom.getLoadSettings().resourcePath;

  packagePath = path.dirname(__dirname);

  exports.toDOMFragment = function(text, filePath, grammar, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, function(error, html) {
      var defaultCodeLanguage, domFragment, template;
      if (error != null) {
        return callback(error);
      }
      template = document.createElement('template');
      template.innerHTML = html;
      domFragment = template.content.cloneNode(true);
      if ((grammar != null ? grammar.scopeName : void 0) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
      }
      convertCodeBlocksToAtomEditors(domFragment, defaultCodeLanguage);
      return callback(null, domFragment);
    });
  };

  exports.toHTML = function(text, filePath, grammar, callback) {
    if (text == null) {
      text = '';
    }
    return render(text, filePath, function(error, html) {
      var defaultCodeLanguage;
      if (error != null) {
        return callback(error);
      }
      if ((grammar != null ? grammar.scopeName : void 0) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
      }
      html = tokenizeCodeBlocks(html, defaultCodeLanguage);
      return callback(null, html);
    });
  };

  render = function(text, filePath, callback) {
    var options;
    if (roaster == null) {
      roaster = require('roaster');
    }
    options = {
      sanitize: false,
      breaks: atom.config.get('markdown-preview.breakOnSingleNewline')
    };
    text = text.replace(/^\s*<!doctype(\s+.*)?>\s*/i, '');
    return roaster(text, options, function(error, html) {
      if (error != null) {
        return callback(error);
      }
      html = sanitize(html);
      html = resolveImagePaths(html, filePath);
      return callback(null, html.trim());
    });
  };

  sanitize = function(html) {
    var attribute, attributesToRemove, i, len, o;
    o = cheerio.load(html);
    o('script').remove();
    attributesToRemove = ['onabort', 'onblur', 'onchange', 'onclick', 'ondbclick', 'onerror', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseover', 'onmouseout', 'onmouseup', 'onreset', 'onresize', 'onscroll', 'onselect', 'onsubmit', 'onunload'];
    for (i = 0, len = attributesToRemove.length; i < len; i++) {
      attribute = attributesToRemove[i];
      o('*').removeAttr(attribute);
    }
    return o.html();
  };

  resolveImagePaths = function(html, filePath) {
    var i, img, imgElement, len, o, ref, rootDirectory, src;
    rootDirectory = atom.project.relativizePath(filePath)[0];
    o = cheerio.load(html);
    ref = o('img');
    for (i = 0, len = ref.length; i < len; i++) {
      imgElement = ref[i];
      img = o(imgElement);
      if (src = img.attr('src')) {
        if (src.match(/^(https?|atom):\/\//)) {
          continue;
        }
        if (src.startsWith(process.resourcesPath)) {
          continue;
        }
        if (src.startsWith(resourcePath)) {
          continue;
        }
        if (src.startsWith(packagePath)) {
          continue;
        }
        if (src[0] === '/') {
          if (!fs.isFileSync(src)) {
            if (rootDirectory) {
              img.attr('src', path.join(rootDirectory, src.substring(1)));
            }
          }
        } else {
          img.attr('src', path.resolve(path.dirname(filePath), src));
        }
      }
    }
    return o.html();
  };

  convertCodeBlocksToAtomEditors = function(domFragment, defaultLanguage) {
    var codeBlock, codeElement, editor, editorElement, fenceName, fontFamily, grammar, i, j, len, len1, preElement, ref, ref1, ref2, ref3, ref4;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      ref = domFragment.querySelectorAll('code');
      for (i = 0, len = ref.length; i < len; i++) {
        codeElement = ref[i];
        codeElement.style.fontFamily = fontFamily;
      }
    }
    ref1 = domFragment.querySelectorAll('pre');
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      preElement = ref1[j];
      codeBlock = (ref2 = preElement.firstElementChild) != null ? ref2 : preElement;
      fenceName = (ref3 = (ref4 = codeBlock.getAttribute('class')) != null ? ref4.replace(/^lang-/, '') : void 0) != null ? ref3 : defaultLanguage;
      editorElement = document.createElement('atom-text-editor');
      editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
      editorElement.removeAttribute('tabindex');
      preElement.parentNode.insertBefore(editorElement, preElement);
      preElement.remove();
      editor = editorElement.getModel();
      editor.getDecorations({
        "class": 'cursor-line',
        type: 'line'
      })[0].destroy();
      editor.setText(codeBlock.textContent);
      if (grammar = atom.grammars.grammarForScopeName(scopeForFenceName(fenceName))) {
        editor.setGrammar(grammar);
      }
    }
    return domFragment;
  };

  tokenizeCodeBlocks = function(html, defaultLanguage) {
    var codeBlock, fenceName, fontFamily, highlightedBlock, highlightedHtml, i, len, o, preElement, ref, ref1, ref2;
    if (defaultLanguage == null) {
      defaultLanguage = 'text';
    }
    o = cheerio.load(html);
    if (fontFamily = atom.config.get('editor.fontFamily')) {
      o('code').css('font-family', fontFamily);
    }
    ref = o("pre");
    for (i = 0, len = ref.length; i < len; i++) {
      preElement = ref[i];
      codeBlock = o(preElement).children().first();
      fenceName = (ref1 = (ref2 = codeBlock.attr('class')) != null ? ref2.replace(/^lang-/, '') : void 0) != null ? ref1 : defaultLanguage;
      if (highlighter == null) {
        highlighter = new Highlights({
          registry: atom.grammars
        });
      }
      highlightedHtml = highlighter.highlightSync({
        fileContents: codeBlock.text(),
        scopeName: scopeForFenceName(fenceName)
      });
      highlightedBlock = o(highlightedHtml);
      highlightedBlock.removeClass('editor').addClass("lang-" + fenceName);
      o(preElement).replaceWith(highlightedBlock);
    }
    return o.html();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9tYXJrZG93bi1wcmV2aWV3L2xpYi9yZW5kZXJlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE9BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7RUFDVixFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsVUFBQSxHQUFhLE9BQUEsQ0FBUSxZQUFSOztFQUNaLElBQUssT0FBQSxDQUFRLHNCQUFSOztFQUNOLE9BQUEsR0FBVTs7RUFDVCxvQkFBcUIsT0FBQSxDQUFRLG9CQUFSOztFQUV0QixXQUFBLEdBQWM7O0VBQ2IsZUFBZ0IsSUFBSSxDQUFDLGVBQUwsQ0FBQTs7RUFDakIsV0FBQSxHQUFjLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYjs7RUFFZCxPQUFPLENBQUMsYUFBUixHQUF3QixTQUFDLElBQUQsRUFBVSxRQUFWLEVBQW9CLE9BQXBCLEVBQTZCLFFBQTdCOztNQUFDLE9BQUs7O1dBQzVCLE1BQUEsQ0FBTyxJQUFQLEVBQWEsUUFBYixFQUF1QixTQUFDLEtBQUQsRUFBUSxJQUFSO0FBQ3JCLFVBQUE7TUFBQSxJQUEwQixhQUExQjtBQUFBLGVBQU8sUUFBQSxDQUFTLEtBQVQsRUFBUDs7TUFFQSxRQUFBLEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsVUFBdkI7TUFDWCxRQUFRLENBQUMsU0FBVCxHQUFxQjtNQUNyQixXQUFBLEdBQWMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFqQixDQUEyQixJQUEzQjtNQUdkLHVCQUFrQyxPQUFPLENBQUUsbUJBQVQsS0FBc0Isa0JBQXhEO1FBQUEsbUJBQUEsR0FBc0IsU0FBdEI7O01BQ0EsOEJBQUEsQ0FBK0IsV0FBL0IsRUFBNEMsbUJBQTVDO2FBQ0EsUUFBQSxDQUFTLElBQVQsRUFBZSxXQUFmO0lBVnFCLENBQXZCO0VBRHNCOztFQWF4QixPQUFPLENBQUMsTUFBUixHQUFpQixTQUFDLElBQUQsRUFBVSxRQUFWLEVBQW9CLE9BQXBCLEVBQTZCLFFBQTdCOztNQUFDLE9BQUs7O1dBQ3JCLE1BQUEsQ0FBTyxJQUFQLEVBQWEsUUFBYixFQUF1QixTQUFDLEtBQUQsRUFBUSxJQUFSO0FBQ3JCLFVBQUE7TUFBQSxJQUEwQixhQUExQjtBQUFBLGVBQU8sUUFBQSxDQUFTLEtBQVQsRUFBUDs7TUFFQSx1QkFBa0MsT0FBTyxDQUFFLG1CQUFULEtBQXNCLGtCQUF4RDtRQUFBLG1CQUFBLEdBQXNCLFNBQXRCOztNQUNBLElBQUEsR0FBTyxrQkFBQSxDQUFtQixJQUFuQixFQUF5QixtQkFBekI7YUFDUCxRQUFBLENBQVMsSUFBVCxFQUFlLElBQWY7SUFMcUIsQ0FBdkI7RUFEZTs7RUFRakIsTUFBQSxHQUFTLFNBQUMsSUFBRCxFQUFPLFFBQVAsRUFBaUIsUUFBakI7QUFDUCxRQUFBOztNQUFBLFVBQVcsT0FBQSxDQUFRLFNBQVI7O0lBQ1gsT0FBQSxHQUNFO01BQUEsUUFBQSxFQUFVLEtBQVY7TUFDQSxNQUFBLEVBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHVDQUFoQixDQURSOztJQUtGLElBQUEsR0FBTyxJQUFJLENBQUMsT0FBTCxDQUFhLDRCQUFiLEVBQTJDLEVBQTNDO1dBRVAsT0FBQSxDQUFRLElBQVIsRUFBYyxPQUFkLEVBQXVCLFNBQUMsS0FBRCxFQUFRLElBQVI7TUFDckIsSUFBMEIsYUFBMUI7QUFBQSxlQUFPLFFBQUEsQ0FBUyxLQUFULEVBQVA7O01BRUEsSUFBQSxHQUFPLFFBQUEsQ0FBUyxJQUFUO01BQ1AsSUFBQSxHQUFPLGlCQUFBLENBQWtCLElBQWxCLEVBQXdCLFFBQXhCO2FBQ1AsUUFBQSxDQUFTLElBQVQsRUFBZSxJQUFJLENBQUMsSUFBTCxDQUFBLENBQWY7SUFMcUIsQ0FBdkI7RUFWTzs7RUFpQlQsUUFBQSxHQUFXLFNBQUMsSUFBRDtBQUNULFFBQUE7SUFBQSxDQUFBLEdBQUksT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiO0lBQ0osQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLE1BQVosQ0FBQTtJQUNBLGtCQUFBLEdBQXFCLENBQ25CLFNBRG1CLEVBRW5CLFFBRm1CLEVBR25CLFVBSG1CLEVBSW5CLFNBSm1CLEVBS25CLFdBTG1CLEVBTW5CLFNBTm1CLEVBT25CLFNBUG1CLEVBUW5CLFdBUm1CLEVBU25CLFlBVG1CLEVBVW5CLFNBVm1CLEVBV25CLFFBWG1CLEVBWW5CLGFBWm1CLEVBYW5CLGFBYm1CLEVBY25CLGFBZG1CLEVBZW5CLFlBZm1CLEVBZ0JuQixXQWhCbUIsRUFpQm5CLFNBakJtQixFQWtCbkIsVUFsQm1CLEVBbUJuQixVQW5CbUIsRUFvQm5CLFVBcEJtQixFQXFCbkIsVUFyQm1CLEVBc0JuQixVQXRCbUI7QUF3QnJCLFNBQUEsb0RBQUE7O01BQUEsQ0FBQSxDQUFFLEdBQUYsQ0FBTSxDQUFDLFVBQVAsQ0FBa0IsU0FBbEI7QUFBQTtXQUNBLENBQUMsQ0FBQyxJQUFGLENBQUE7RUE1QlM7O0VBOEJYLGlCQUFBLEdBQW9CLFNBQUMsSUFBRCxFQUFPLFFBQVA7QUFDbEIsUUFBQTtJQUFDLGdCQUFpQixJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWIsQ0FBNEIsUUFBNUI7SUFDbEIsQ0FBQSxHQUFJLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBYjtBQUNKO0FBQUEsU0FBQSxxQ0FBQTs7TUFDRSxHQUFBLEdBQU0sQ0FBQSxDQUFFLFVBQUY7TUFDTixJQUFHLEdBQUEsR0FBTSxHQUFHLENBQUMsSUFBSixDQUFTLEtBQVQsQ0FBVDtRQUNFLElBQVksR0FBRyxDQUFDLEtBQUosQ0FBVSxxQkFBVixDQUFaO0FBQUEsbUJBQUE7O1FBQ0EsSUFBWSxHQUFHLENBQUMsVUFBSixDQUFlLE9BQU8sQ0FBQyxhQUF2QixDQUFaO0FBQUEsbUJBQUE7O1FBQ0EsSUFBWSxHQUFHLENBQUMsVUFBSixDQUFlLFlBQWYsQ0FBWjtBQUFBLG1CQUFBOztRQUNBLElBQVksR0FBRyxDQUFDLFVBQUosQ0FBZSxXQUFmLENBQVo7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLEdBQUksQ0FBQSxDQUFBLENBQUosS0FBVSxHQUFiO1VBQ0UsSUFBQSxDQUFPLEVBQUUsQ0FBQyxVQUFILENBQWMsR0FBZCxDQUFQO1lBQ0UsSUFBRyxhQUFIO2NBQ0UsR0FBRyxDQUFDLElBQUosQ0FBUyxLQUFULEVBQWdCLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVixFQUF5QixHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsQ0FBekIsQ0FBaEIsRUFERjthQURGO1dBREY7U0FBQSxNQUFBO1VBS0UsR0FBRyxDQUFDLElBQUosQ0FBUyxLQUFULEVBQWdCLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBQWIsRUFBcUMsR0FBckMsQ0FBaEIsRUFMRjtTQU5GOztBQUZGO1dBZUEsQ0FBQyxDQUFDLElBQUYsQ0FBQTtFQWxCa0I7O0VBb0JwQiw4QkFBQSxHQUFpQyxTQUFDLFdBQUQsRUFBYyxlQUFkO0FBQy9CLFFBQUE7O01BRDZDLGtCQUFnQjs7SUFDN0QsSUFBRyxVQUFBLEdBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLG1CQUFoQixDQUFoQjtBQUVFO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQWxCLEdBQStCO0FBRGpDLE9BRkY7O0FBS0E7QUFBQSxTQUFBLHdDQUFBOztNQUNFLFNBQUEsMERBQTJDO01BQzNDLFNBQUEsb0hBQXFFO01BRXJFLGFBQUEsR0FBZ0IsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsa0JBQXZCO01BQ2hCLGFBQWEsQ0FBQyxnQkFBZCxDQUErQixRQUFRLENBQUMsZUFBVCxDQUF5QixlQUF6QixDQUEvQjtNQUNBLGFBQWEsQ0FBQyxlQUFkLENBQThCLFVBQTlCO01BRUEsVUFBVSxDQUFDLFVBQVUsQ0FBQyxZQUF0QixDQUFtQyxhQUFuQyxFQUFrRCxVQUFsRDtNQUNBLFVBQVUsQ0FBQyxNQUFYLENBQUE7TUFFQSxNQUFBLEdBQVMsYUFBYSxDQUFDLFFBQWQsQ0FBQTtNQUVULE1BQU0sQ0FBQyxjQUFQLENBQXNCO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO1FBQXNCLElBQUEsRUFBTSxNQUE1QjtPQUF0QixDQUEwRCxDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQTdELENBQUE7TUFDQSxNQUFNLENBQUMsT0FBUCxDQUFlLFNBQVMsQ0FBQyxXQUF6QjtNQUNBLElBQUcsT0FBQSxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsaUJBQUEsQ0FBa0IsU0FBbEIsQ0FBbEMsQ0FBYjtRQUNFLE1BQU0sQ0FBQyxVQUFQLENBQWtCLE9BQWxCLEVBREY7O0FBZkY7V0FrQkE7RUF4QitCOztFQTBCakMsa0JBQUEsR0FBcUIsU0FBQyxJQUFELEVBQU8sZUFBUDtBQUNuQixRQUFBOztNQUQwQixrQkFBZ0I7O0lBQzFDLENBQUEsR0FBSSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWI7SUFFSixJQUFHLFVBQUEsR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsbUJBQWhCLENBQWhCO01BQ0UsQ0FBQSxDQUFFLE1BQUYsQ0FBUyxDQUFDLEdBQVYsQ0FBYyxhQUFkLEVBQTZCLFVBQTdCLEVBREY7O0FBR0E7QUFBQSxTQUFBLHFDQUFBOztNQUNFLFNBQUEsR0FBWSxDQUFBLENBQUUsVUFBRixDQUFhLENBQUMsUUFBZCxDQUFBLENBQXdCLENBQUMsS0FBekIsQ0FBQTtNQUNaLFNBQUEsNEdBQTZEOztRQUU3RCxjQUFtQixJQUFBLFVBQUEsQ0FBVztVQUFBLFFBQUEsRUFBVSxJQUFJLENBQUMsUUFBZjtTQUFYOztNQUNuQixlQUFBLEdBQWtCLFdBQVcsQ0FBQyxhQUFaLENBQ2hCO1FBQUEsWUFBQSxFQUFjLFNBQVMsQ0FBQyxJQUFWLENBQUEsQ0FBZDtRQUNBLFNBQUEsRUFBVyxpQkFBQSxDQUFrQixTQUFsQixDQURYO09BRGdCO01BSWxCLGdCQUFBLEdBQW1CLENBQUEsQ0FBRSxlQUFGO01BRW5CLGdCQUFnQixDQUFDLFdBQWpCLENBQTZCLFFBQTdCLENBQXNDLENBQUMsUUFBdkMsQ0FBZ0QsT0FBQSxHQUFRLFNBQXhEO01BRUEsQ0FBQSxDQUFFLFVBQUYsQ0FBYSxDQUFDLFdBQWQsQ0FBMEIsZ0JBQTFCO0FBYkY7V0FlQSxDQUFDLENBQUMsSUFBRixDQUFBO0VBckJtQjtBQS9IckIiLCJzb3VyY2VzQ29udGVudCI6WyJwYXRoID0gcmVxdWlyZSAncGF0aCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5jaGVlcmlvID0gcmVxdWlyZSAnY2hlZXJpbydcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbkhpZ2hsaWdodHMgPSByZXF1aXJlICdoaWdobGlnaHRzJ1xueyR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5yb2FzdGVyID0gbnVsbCAjIERlZmVyIHVudGlsIHVzZWRcbntzY29wZUZvckZlbmNlTmFtZX0gPSByZXF1aXJlICcuL2V4dGVuc2lvbi1oZWxwZXInXG5cbmhpZ2hsaWdodGVyID0gbnVsbFxue3Jlc291cmNlUGF0aH0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG5wYWNrYWdlUGF0aCA9IHBhdGguZGlybmFtZShfX2Rpcm5hbWUpXG5cbmV4cG9ydHMudG9ET01GcmFnbWVudCA9ICh0ZXh0PScnLCBmaWxlUGF0aCwgZ3JhbW1hciwgY2FsbGJhY2spIC0+XG4gIHJlbmRlciB0ZXh0LCBmaWxlUGF0aCwgKGVycm9yLCBodG1sKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayhlcnJvcikgaWYgZXJyb3I/XG5cbiAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJylcbiAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBodG1sXG4gICAgZG9tRnJhZ21lbnQgPSB0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKVxuXG4gICAgIyBEZWZhdWx0IGNvZGUgYmxvY2tzIHRvIGJlIGNvZmZlZSBpbiBMaXRlcmF0ZSBDb2ZmZWVTY3JpcHQgZmlsZXNcbiAgICBkZWZhdWx0Q29kZUxhbmd1YWdlID0gJ2NvZmZlZScgaWYgZ3JhbW1hcj8uc2NvcGVOYW1lIGlzICdzb3VyY2UubGl0Y29mZmVlJ1xuICAgIGNvbnZlcnRDb2RlQmxvY2tzVG9BdG9tRWRpdG9ycyhkb21GcmFnbWVudCwgZGVmYXVsdENvZGVMYW5ndWFnZSlcbiAgICBjYWxsYmFjayhudWxsLCBkb21GcmFnbWVudClcblxuZXhwb3J0cy50b0hUTUwgPSAodGV4dD0nJywgZmlsZVBhdGgsIGdyYW1tYXIsIGNhbGxiYWNrKSAtPlxuICByZW5kZXIgdGV4dCwgZmlsZVBhdGgsIChlcnJvciwgaHRtbCkgLT5cbiAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpIGlmIGVycm9yP1xuICAgICMgRGVmYXVsdCBjb2RlIGJsb2NrcyB0byBiZSBjb2ZmZWUgaW4gTGl0ZXJhdGUgQ29mZmVlU2NyaXB0IGZpbGVzXG4gICAgZGVmYXVsdENvZGVMYW5ndWFnZSA9ICdjb2ZmZWUnIGlmIGdyYW1tYXI/LnNjb3BlTmFtZSBpcyAnc291cmNlLmxpdGNvZmZlZSdcbiAgICBodG1sID0gdG9rZW5pemVDb2RlQmxvY2tzKGh0bWwsIGRlZmF1bHRDb2RlTGFuZ3VhZ2UpXG4gICAgY2FsbGJhY2sobnVsbCwgaHRtbClcblxucmVuZGVyID0gKHRleHQsIGZpbGVQYXRoLCBjYWxsYmFjaykgLT5cbiAgcm9hc3RlciA/PSByZXF1aXJlICdyb2FzdGVyJ1xuICBvcHRpb25zID1cbiAgICBzYW5pdGl6ZTogZmFsc2VcbiAgICBicmVha3M6IGF0b20uY29uZmlnLmdldCgnbWFya2Rvd24tcHJldmlldy5icmVha09uU2luZ2xlTmV3bGluZScpXG5cbiAgIyBSZW1vdmUgdGhlIDwhZG9jdHlwZT4gc2luY2Ugb3RoZXJ3aXNlIG1hcmtlZCB3aWxsIGVzY2FwZSBpdFxuICAjIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGpqL21hcmtlZC9pc3N1ZXMvMzU0XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15cXHMqPCFkb2N0eXBlKFxccysuKik/PlxccyovaSwgJycpXG5cbiAgcm9hc3RlciB0ZXh0LCBvcHRpb25zLCAoZXJyb3IsIGh0bWwpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKSBpZiBlcnJvcj9cblxuICAgIGh0bWwgPSBzYW5pdGl6ZShodG1sKVxuICAgIGh0bWwgPSByZXNvbHZlSW1hZ2VQYXRocyhodG1sLCBmaWxlUGF0aClcbiAgICBjYWxsYmFjayhudWxsLCBodG1sLnRyaW0oKSlcblxuc2FuaXRpemUgPSAoaHRtbCkgLT5cbiAgbyA9IGNoZWVyaW8ubG9hZChodG1sKVxuICBvKCdzY3JpcHQnKS5yZW1vdmUoKVxuICBhdHRyaWJ1dGVzVG9SZW1vdmUgPSBbXG4gICAgJ29uYWJvcnQnXG4gICAgJ29uYmx1cidcbiAgICAnb25jaGFuZ2UnXG4gICAgJ29uY2xpY2snXG4gICAgJ29uZGJjbGljaydcbiAgICAnb25lcnJvcidcbiAgICAnb25mb2N1cydcbiAgICAnb25rZXlkb3duJ1xuICAgICdvbmtleXByZXNzJ1xuICAgICdvbmtleXVwJ1xuICAgICdvbmxvYWQnXG4gICAgJ29ubW91c2Vkb3duJ1xuICAgICdvbm1vdXNlbW92ZSdcbiAgICAnb25tb3VzZW92ZXInXG4gICAgJ29ubW91c2VvdXQnXG4gICAgJ29ubW91c2V1cCdcbiAgICAnb25yZXNldCdcbiAgICAnb25yZXNpemUnXG4gICAgJ29uc2Nyb2xsJ1xuICAgICdvbnNlbGVjdCdcbiAgICAnb25zdWJtaXQnXG4gICAgJ29udW5sb2FkJ1xuICBdXG4gIG8oJyonKS5yZW1vdmVBdHRyKGF0dHJpYnV0ZSkgZm9yIGF0dHJpYnV0ZSBpbiBhdHRyaWJ1dGVzVG9SZW1vdmVcbiAgby5odG1sKClcblxucmVzb2x2ZUltYWdlUGF0aHMgPSAoaHRtbCwgZmlsZVBhdGgpIC0+XG4gIFtyb290RGlyZWN0b3J5XSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChmaWxlUGF0aClcbiAgbyA9IGNoZWVyaW8ubG9hZChodG1sKVxuICBmb3IgaW1nRWxlbWVudCBpbiBvKCdpbWcnKVxuICAgIGltZyA9IG8oaW1nRWxlbWVudClcbiAgICBpZiBzcmMgPSBpbWcuYXR0cignc3JjJylcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5tYXRjaCgvXihodHRwcz98YXRvbSk6XFwvXFwvLylcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHByb2Nlc3MucmVzb3VyY2VzUGF0aClcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHJlc291cmNlUGF0aClcbiAgICAgIGNvbnRpbnVlIGlmIHNyYy5zdGFydHNXaXRoKHBhY2thZ2VQYXRoKVxuXG4gICAgICBpZiBzcmNbMF0gaXMgJy8nXG4gICAgICAgIHVubGVzcyBmcy5pc0ZpbGVTeW5jKHNyYylcbiAgICAgICAgICBpZiByb290RGlyZWN0b3J5XG4gICAgICAgICAgICBpbWcuYXR0cignc3JjJywgcGF0aC5qb2luKHJvb3REaXJlY3RvcnksIHNyYy5zdWJzdHJpbmcoMSkpKVxuICAgICAgZWxzZVxuICAgICAgICBpbWcuYXR0cignc3JjJywgcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYykpXG5cbiAgby5odG1sKClcblxuY29udmVydENvZGVCbG9ja3NUb0F0b21FZGl0b3JzID0gKGRvbUZyYWdtZW50LCBkZWZhdWx0TGFuZ3VhZ2U9J3RleHQnKSAtPlxuICBpZiBmb250RmFtaWx5ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG5cbiAgICBmb3IgY29kZUVsZW1lbnQgaW4gZG9tRnJhZ21lbnQucXVlcnlTZWxlY3RvckFsbCgnY29kZScpXG4gICAgICBjb2RlRWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gZm9udEZhbWlseVxuXG4gIGZvciBwcmVFbGVtZW50IGluIGRvbUZyYWdtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3ByZScpXG4gICAgY29kZUJsb2NrID0gcHJlRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCA/IHByZUVsZW1lbnRcbiAgICBmZW5jZU5hbWUgPSBjb2RlQmxvY2suZ2V0QXR0cmlidXRlKCdjbGFzcycpPy5yZXBsYWNlKC9ebGFuZy0vLCAnJykgPyBkZWZhdWx0TGFuZ3VhZ2VcblxuICAgIGVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdG9tLXRleHQtZWRpdG9yJylcbiAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKCdndXR0ZXItaGlkZGVuJykpXG4gICAgZWRpdG9yRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4JykgIyBtYWtlIHJlYWQtb25seVxuXG4gICAgcHJlRWxlbWVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlZGl0b3JFbGVtZW50LCBwcmVFbGVtZW50KVxuICAgIHByZUVsZW1lbnQucmVtb3ZlKClcblxuICAgIGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKVxuICAgICMgcmVtb3ZlIHRoZSBkZWZhdWx0IHNlbGVjdGlvbiBvZiBhIGxpbmUgaW4gZWFjaCBlZGl0b3JcbiAgICBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoY2xhc3M6ICdjdXJzb3ItbGluZScsIHR5cGU6ICdsaW5lJylbMF0uZGVzdHJveSgpXG4gICAgZWRpdG9yLnNldFRleHQoY29kZUJsb2NrLnRleHRDb250ZW50KVxuICAgIGlmIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGVGb3JGZW5jZU5hbWUoZmVuY2VOYW1lKSlcbiAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpXG5cbiAgZG9tRnJhZ21lbnRcblxudG9rZW5pemVDb2RlQmxvY2tzID0gKGh0bWwsIGRlZmF1bHRMYW5ndWFnZT0ndGV4dCcpIC0+XG4gIG8gPSBjaGVlcmlvLmxvYWQoaHRtbClcblxuICBpZiBmb250RmFtaWx5ID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgbygnY29kZScpLmNzcygnZm9udC1mYW1pbHknLCBmb250RmFtaWx5KVxuXG4gIGZvciBwcmVFbGVtZW50IGluIG8oXCJwcmVcIilcbiAgICBjb2RlQmxvY2sgPSBvKHByZUVsZW1lbnQpLmNoaWxkcmVuKCkuZmlyc3QoKVxuICAgIGZlbmNlTmFtZSA9IGNvZGVCbG9jay5hdHRyKCdjbGFzcycpPy5yZXBsYWNlKC9ebGFuZy0vLCAnJykgPyBkZWZhdWx0TGFuZ3VhZ2VcblxuICAgIGhpZ2hsaWdodGVyID89IG5ldyBIaWdobGlnaHRzKHJlZ2lzdHJ5OiBhdG9tLmdyYW1tYXJzKVxuICAgIGhpZ2hsaWdodGVkSHRtbCA9IGhpZ2hsaWdodGVyLmhpZ2hsaWdodFN5bmNcbiAgICAgIGZpbGVDb250ZW50czogY29kZUJsb2NrLnRleHQoKVxuICAgICAgc2NvcGVOYW1lOiBzY29wZUZvckZlbmNlTmFtZShmZW5jZU5hbWUpXG5cbiAgICBoaWdobGlnaHRlZEJsb2NrID0gbyhoaWdobGlnaHRlZEh0bWwpXG4gICAgIyBUaGUgYGVkaXRvcmAgY2xhc3MgbWVzc2VzIHRoaW5ncyB1cCBhcyBgLmVkaXRvcmAgaGFzIGFic29sdXRlbHkgcG9zaXRpb25lZCBsaW5lc1xuICAgIGhpZ2hsaWdodGVkQmxvY2sucmVtb3ZlQ2xhc3MoJ2VkaXRvcicpLmFkZENsYXNzKFwibGFuZy0je2ZlbmNlTmFtZX1cIilcblxuICAgIG8ocHJlRWxlbWVudCkucmVwbGFjZVdpdGgoaGlnaGxpZ2h0ZWRCbG9jaylcblxuICBvLmh0bWwoKVxuIl19
