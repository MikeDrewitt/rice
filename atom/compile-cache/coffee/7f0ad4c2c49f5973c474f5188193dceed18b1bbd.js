(function() {
  var CompositeDisposable, WrapGuideElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  WrapGuideElement = (function(superClass) {
    extend(WrapGuideElement, superClass);

    function WrapGuideElement() {
      return WrapGuideElement.__super__.constructor.apply(this, arguments);
    }

    WrapGuideElement.prototype.initialize = function(editor, editorElement) {
      this.editor = editor;
      this.editorElement = editorElement;
      this.classList.add('wrap-guide');
      this.attachToLines();
      this.handleEvents();
      this.updateGuide();
      return this;
    };

    WrapGuideElement.prototype.attachToLines = function() {
      var lines, ref;
      lines = (ref = this.editorElement.rootElement) != null ? typeof ref.querySelector === "function" ? ref.querySelector('.lines') : void 0 : void 0;
      return lines != null ? lines.appendChild(this) : void 0;
    };

    WrapGuideElement.prototype.handleEvents = function() {
      var configSubscriptions, subscriptions, updateGuideCallback;
      updateGuideCallback = (function(_this) {
        return function() {
          return _this.updateGuide();
        };
      })(this);
      subscriptions = new CompositeDisposable;
      configSubscriptions = this.handleConfigEvents();
      subscriptions.add(atom.config.onDidChange('wrap-guide.columns', updateGuideCallback));
      subscriptions.add(atom.config.onDidChange('editor.fontSize', function() {
        return setTimeout(updateGuideCallback, 0);
      }));
      if (this.editorElement.logicalDisplayBuffer) {
        subscriptions.add(this.editorElement.onDidChangeScrollLeft(updateGuideCallback));
      } else {
        subscriptions.add(this.editor.onDidChangeScrollLeft(updateGuideCallback));
      }
      subscriptions.add(this.editor.onDidChangePath(updateGuideCallback));
      subscriptions.add(this.editor.onDidChangeGrammar((function(_this) {
        return function() {
          configSubscriptions.dispose();
          configSubscriptions = _this.handleConfigEvents();
          return updateGuideCallback();
        };
      })(this)));
      subscriptions.add(this.editor.onDidDestroy(function() {
        subscriptions.dispose();
        return configSubscriptions.dispose();
      }));
      return subscriptions.add(this.editorElement.onDidAttach((function(_this) {
        return function() {
          _this.attachToLines();
          return updateGuideCallback();
        };
      })(this)));
    };

    WrapGuideElement.prototype.handleConfigEvents = function() {
      var subscriptions, updateGuideCallback;
      updateGuideCallback = (function(_this) {
        return function() {
          return _this.updateGuide();
        };
      })(this);
      subscriptions = new CompositeDisposable;
      subscriptions.add(atom.config.onDidChange('editor.preferredLineLength', {
        scope: this.editor.getRootScopeDescriptor()
      }, updateGuideCallback));
      subscriptions.add(atom.config.onDidChange('wrap-guide.enabled', {
        scope: this.editor.getRootScopeDescriptor()
      }, updateGuideCallback));
      return subscriptions;
    };

    WrapGuideElement.prototype.getDefaultColumn = function() {
      return atom.config.get('editor.preferredLineLength', {
        scope: this.editor.getRootScopeDescriptor()
      });
    };

    WrapGuideElement.prototype.getGuideColumn = function(path, scopeName) {
      var column, customColumn, customColumns, i, len, pattern, regex, scope;
      customColumns = atom.config.get('wrap-guide.columns');
      if (!Array.isArray(customColumns)) {
        return this.getDefaultColumn();
      }
      for (i = 0, len = customColumns.length; i < len; i++) {
        customColumn = customColumns[i];
        if (!(typeof customColumn === 'object')) {
          continue;
        }
        pattern = customColumn.pattern, scope = customColumn.scope, column = customColumn.column;
        if (pattern) {
          try {
            regex = new RegExp(pattern);
          } catch (error) {
            continue;
          }
          if (regex.test(path)) {
            return parseInt(column);
          }
        } else if (scope) {
          if (scope === scopeName) {
            return parseInt(column);
          }
        }
      }
      return this.getDefaultColumn();
    };

    WrapGuideElement.prototype.isEnabled = function() {
      var ref;
      return (ref = atom.config.get('wrap-guide.enabled', {
        scope: this.editor.getRootScopeDescriptor()
      })) != null ? ref : true;
    };

    WrapGuideElement.prototype.updateGuide = function() {
      var column, columnWidth;
      column = this.getGuideColumn(this.editor.getPath(), this.editor.getGrammar().scopeName);
      if (column > 0 && this.isEnabled()) {
        columnWidth = this.editorElement.getDefaultCharacterWidth() * column;
        if (this.editorElement.logicalDisplayBuffer) {
          columnWidth -= this.editorElement.getScrollLeft();
        } else {
          columnWidth -= this.editor.getScrollLeft();
        }
        this.style.left = (Math.round(columnWidth)) + "px";
        return this.style.display = 'block';
      } else {
        return this.style.display = 'none';
      }
    };

    return WrapGuideElement;

  })(HTMLDivElement);

  module.exports = document.registerElement('wrap-guide', {
    "extends": 'div',
    prototype: WrapGuideElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93cmFwLWd1aWRlL2xpYi93cmFwLWd1aWRlLWVsZW1lbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxQ0FBQTtJQUFBOzs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBSWxCOzs7Ozs7OytCQUNKLFVBQUEsR0FBWSxTQUFDLE1BQUQsRUFBVSxhQUFWO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsZ0JBQUQ7TUFDcEIsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsWUFBZjtNQUNBLElBQUMsQ0FBQSxhQUFELENBQUE7TUFDQSxJQUFDLENBQUEsWUFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLFdBQUQsQ0FBQTthQUVBO0lBTlU7OytCQVFaLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLEtBQUEsaUdBQWtDLENBQUUsY0FBZTs2QkFDbkQsS0FBSyxDQUFFLFdBQVAsQ0FBbUIsSUFBbkI7SUFGYTs7K0JBSWYsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsbUJBQUEsR0FBc0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxXQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7TUFFdEIsYUFBQSxHQUFnQixJQUFJO01BQ3BCLG1CQUFBLEdBQXNCLElBQUMsQ0FBQSxrQkFBRCxDQUFBO01BQ3RCLGFBQWEsQ0FBQyxHQUFkLENBQWtCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBWixDQUF3QixvQkFBeEIsRUFBOEMsbUJBQTlDLENBQWxCO01BQ0EsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFaLENBQXdCLGlCQUF4QixF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WUFBekIsRUFDRTtJQUFBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FBVDtJQUNBLFNBQUEsRUFBVyxnQkFBZ0IsQ0FBQyxTQUQ1QjtHQURGO0FBakdBIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuIyBUT0RPOiByZW1vdmUgcmVmZXJlbmNlcyB0byBsb2dpY2FsIGRpc3BsYXkgYnVmZmVyIHdoZW4gaXQgaXMgcmVsZWFzZWQuXG5cbmNsYXNzIFdyYXBHdWlkZUVsZW1lbnQgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudFxuICBpbml0aWFsaXplOiAoQGVkaXRvciwgQGVkaXRvckVsZW1lbnQpIC0+XG4gICAgQGNsYXNzTGlzdC5hZGQoJ3dyYXAtZ3VpZGUnKVxuICAgIEBhdHRhY2hUb0xpbmVzKClcbiAgICBAaGFuZGxlRXZlbnRzKClcbiAgICBAdXBkYXRlR3VpZGUoKVxuXG4gICAgdGhpc1xuXG4gIGF0dGFjaFRvTGluZXM6IC0+XG4gICAgbGluZXMgPSBAZWRpdG9yRWxlbWVudC5yb290RWxlbWVudD8ucXVlcnlTZWxlY3Rvcj8oJy5saW5lcycpXG4gICAgbGluZXM/LmFwcGVuZENoaWxkKHRoaXMpXG5cbiAgaGFuZGxlRXZlbnRzOiAtPlxuICAgIHVwZGF0ZUd1aWRlQ2FsbGJhY2sgPSA9PiBAdXBkYXRlR3VpZGUoKVxuXG4gICAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgY29uZmlnU3Vic2NyaXB0aW9ucyA9IEBoYW5kbGVDb25maWdFdmVudHMoKVxuICAgIHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKCd3cmFwLWd1aWRlLmNvbHVtbnMnLCB1cGRhdGVHdWlkZUNhbGxiYWNrKVxuICAgIHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdlZGl0b3IuZm9udFNpemUnLCAtPlxuICAgICAgIyBzZXRUaW1lb3V0IGJlY2F1c2Ugd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgZWRpdG9yIG1lYXN1cmVtZW50IHRvIGhhcHBlblxuICAgICAgc2V0VGltZW91dCh1cGRhdGVHdWlkZUNhbGxiYWNrLCAwKVxuXG4gICAgaWYgQGVkaXRvckVsZW1lbnQubG9naWNhbERpc3BsYXlCdWZmZXJcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3JFbGVtZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsTGVmdCh1cGRhdGVHdWlkZUNhbGxiYWNrKVxuICAgIGVsc2VcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VTY3JvbGxMZWZ0KHVwZGF0ZUd1aWRlQ2FsbGJhY2spXG5cbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCh1cGRhdGVHdWlkZUNhbGxiYWNrKVxuICAgIHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyID0+XG4gICAgICBjb25maWdTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgY29uZmlnU3Vic2NyaXB0aW9ucyA9IEBoYW5kbGVDb25maWdFdmVudHMoKVxuICAgICAgdXBkYXRlR3VpZGVDYWxsYmFjaygpXG5cbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkRGVzdHJveSAtPlxuICAgICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIGNvbmZpZ1N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgICBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yRWxlbWVudC5vbkRpZEF0dGFjaCA9PlxuICAgICAgQGF0dGFjaFRvTGluZXMoKVxuICAgICAgdXBkYXRlR3VpZGVDYWxsYmFjaygpXG5cbiAgaGFuZGxlQ29uZmlnRXZlbnRzOiAtPlxuICAgIHVwZGF0ZUd1aWRlQ2FsbGJhY2sgPSA9PiBAdXBkYXRlR3VpZGUoKVxuICAgIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKFxuICAgICAgJ2VkaXRvci5wcmVmZXJyZWRMaW5lTGVuZ3RoJyxcbiAgICAgIHNjb3BlOiBAZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKSxcbiAgICAgIHVwZGF0ZUd1aWRlQ2FsbGJhY2tcbiAgICApXG4gICAgc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UoXG4gICAgICAnd3JhcC1ndWlkZS5lbmFibGVkJyxcbiAgICAgIHNjb3BlOiBAZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKSxcbiAgICAgIHVwZGF0ZUd1aWRlQ2FsbGJhY2tcbiAgICApXG4gICAgc3Vic2NyaXB0aW9uc1xuXG4gIGdldERlZmF1bHRDb2x1bW46IC0+XG4gICAgYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IucHJlZmVycmVkTGluZUxlbmd0aCcsIHNjb3BlOiBAZWRpdG9yLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKSlcblxuICBnZXRHdWlkZUNvbHVtbjogKHBhdGgsIHNjb3BlTmFtZSkgLT5cbiAgICBjdXN0b21Db2x1bW5zID0gYXRvbS5jb25maWcuZ2V0KCd3cmFwLWd1aWRlLmNvbHVtbnMnKVxuICAgIHJldHVybiBAZ2V0RGVmYXVsdENvbHVtbigpIHVubGVzcyBBcnJheS5pc0FycmF5KGN1c3RvbUNvbHVtbnMpXG5cbiAgICBmb3IgY3VzdG9tQ29sdW1uIGluIGN1c3RvbUNvbHVtbnMgd2hlbiB0eXBlb2YgY3VzdG9tQ29sdW1uIGlzICdvYmplY3QnXG4gICAgICB7cGF0dGVybiwgc2NvcGUsIGNvbHVtbn0gPSBjdXN0b21Db2x1bW5cbiAgICAgIGlmIHBhdHRlcm5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4pXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGNvbHVtbikgaWYgcmVnZXgudGVzdChwYXRoKVxuICAgICAgZWxzZSBpZiBzY29wZVxuICAgICAgICByZXR1cm4gcGFyc2VJbnQoY29sdW1uKSBpZiBzY29wZSBpcyBzY29wZU5hbWVcbiAgICBAZ2V0RGVmYXVsdENvbHVtbigpXG5cbiAgaXNFbmFibGVkOiAtPlxuICAgIGF0b20uY29uZmlnLmdldCgnd3JhcC1ndWlkZS5lbmFibGVkJywgc2NvcGU6IEBlZGl0b3IuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpKSA/IHRydWVcblxuICB1cGRhdGVHdWlkZTogLT5cbiAgICBjb2x1bW4gPSBAZ2V0R3VpZGVDb2x1bW4oQGVkaXRvci5nZXRQYXRoKCksIEBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSlcbiAgICBpZiBjb2x1bW4gPiAwIGFuZCBAaXNFbmFibGVkKClcbiAgICAgIGNvbHVtbldpZHRoID0gQGVkaXRvckVsZW1lbnQuZ2V0RGVmYXVsdENoYXJhY3RlcldpZHRoKCkgKiBjb2x1bW5cbiAgICAgIGlmIEBlZGl0b3JFbGVtZW50LmxvZ2ljYWxEaXNwbGF5QnVmZmVyXG4gICAgICAgIGNvbHVtbldpZHRoIC09IEBlZGl0b3JFbGVtZW50LmdldFNjcm9sbExlZnQoKVxuICAgICAgZWxzZVxuICAgICAgICBjb2x1bW5XaWR0aCAtPSBAZWRpdG9yLmdldFNjcm9sbExlZnQoKVxuICAgICAgQHN0eWxlLmxlZnQgPSBcIiN7TWF0aC5yb3VuZChjb2x1bW5XaWR0aCl9cHhcIlxuICAgICAgQHN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgZWxzZVxuICAgICAgQHN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCd3cmFwLWd1aWRlJyxcbiAgZXh0ZW5kczogJ2RpdidcbiAgcHJvdG90eXBlOiBXcmFwR3VpZGVFbGVtZW50LnByb3RvdHlwZVxuKVxuIl19
