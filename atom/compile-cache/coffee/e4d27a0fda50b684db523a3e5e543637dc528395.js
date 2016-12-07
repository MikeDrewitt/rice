(function() {
  var CompositeDisposable, WorkspaceElement, fs, ipcRenderer, path, scrollbarStyle,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ipcRenderer = require('electron').ipcRenderer;

  path = require('path');

  fs = require('fs-plus');

  CompositeDisposable = require('event-kit').CompositeDisposable;

  scrollbarStyle = require('scrollbar-style');

  module.exports = WorkspaceElement = (function(superClass) {
    extend(WorkspaceElement, superClass);

    function WorkspaceElement() {
      return WorkspaceElement.__super__.constructor.apply(this, arguments);
    }

    WorkspaceElement.prototype.globalTextEditorStyleSheet = null;

    WorkspaceElement.prototype.attachedCallback = function() {
      return this.focus();
    };

    WorkspaceElement.prototype.detachedCallback = function() {
      return this.subscriptions.dispose();
    };

    WorkspaceElement.prototype.initializeContent = function() {
      this.classList.add('workspace');
      this.setAttribute('tabindex', -1);
      this.verticalAxis = document.createElement('atom-workspace-axis');
      this.verticalAxis.classList.add('vertical');
      this.horizontalAxis = document.createElement('atom-workspace-axis');
      this.horizontalAxis.classList.add('horizontal');
      this.horizontalAxis.appendChild(this.verticalAxis);
      return this.appendChild(this.horizontalAxis);
    };

    WorkspaceElement.prototype.observeScrollbarStyle = function() {
      return this.subscriptions.add(scrollbarStyle.observePreferredScrollbarStyle((function(_this) {
        return function(style) {
          switch (style) {
            case 'legacy':
              _this.classList.remove('scrollbars-visible-when-scrolling');
              return _this.classList.add("scrollbars-visible-always");
            case 'overlay':
              _this.classList.remove('scrollbars-visible-always');
              return _this.classList.add("scrollbars-visible-when-scrolling");
          }
        };
      })(this)));
    };

    WorkspaceElement.prototype.observeTextEditorFontConfig = function() {
      this.updateGlobalTextEditorStyleSheet();
      this.subscriptions.add(this.config.onDidChange('editor.fontSize', this.updateGlobalTextEditorStyleSheet.bind(this)));
      this.subscriptions.add(this.config.onDidChange('editor.fontFamily', this.updateGlobalTextEditorStyleSheet.bind(this)));
      return this.subscriptions.add(this.config.onDidChange('editor.lineHeight', this.updateGlobalTextEditorStyleSheet.bind(this)));
    };

    WorkspaceElement.prototype.updateGlobalTextEditorStyleSheet = function() {
      var fontFamily, styleSheetSource;
      fontFamily = this.config.get('editor.fontFamily');
      if (process.platform === 'darwin') {
        fontFamily += ', "Apple Color Emoji"';
      }
      styleSheetSource = "atom-text-editor {\n  font-size: " + (this.config.get('editor.fontSize')) + "px;\n  font-family: " + fontFamily + ";\n  line-height: " + (this.config.get('editor.lineHeight')) + ";\n}";
      this.styles.addStyleSheet(styleSheetSource, {
        sourcePath: 'global-text-editor-styles'
      });
      return this.views.performDocumentPoll();
    };

    WorkspaceElement.prototype.initialize = function(model, arg) {
      this.model = model;
      this.views = arg.views, this.workspace = arg.workspace, this.project = arg.project, this.config = arg.config, this.styles = arg.styles;
      if (this.views == null) {
        throw new Error("Must pass a views parameter when initializing WorskpaceElements");
      }
      if (this.workspace == null) {
        throw new Error("Must pass a workspace parameter when initializing WorskpaceElements");
      }
      if (this.project == null) {
        throw new Error("Must pass a project parameter when initializing WorskpaceElements");
      }
      if (this.config == null) {
        throw new Error("Must pass a config parameter when initializing WorskpaceElements");
      }
      if (this.styles == null) {
        throw new Error("Must pass a styles parameter when initializing WorskpaceElements");
      }
      this.subscriptions = new CompositeDisposable;
      this.initializeContent();
      this.observeScrollbarStyle();
      this.observeTextEditorFontConfig();
      this.paneContainer = this.views.getView(this.model.paneContainer);
      this.verticalAxis.appendChild(this.paneContainer);
      this.addEventListener('focus', this.handleFocus.bind(this));
      this.addEventListener('mousewheel', this.handleMousewheel.bind(this), true);
      this.panelContainers = {
        top: this.views.getView(this.model.panelContainers.top),
        left: this.views.getView(this.model.panelContainers.left),
        right: this.views.getView(this.model.panelContainers.right),
        bottom: this.views.getView(this.model.panelContainers.bottom),
        header: this.views.getView(this.model.panelContainers.header),
        footer: this.views.getView(this.model.panelContainers.footer),
        modal: this.views.getView(this.model.panelContainers.modal)
      };
      this.horizontalAxis.insertBefore(this.panelContainers.left, this.verticalAxis);
      this.horizontalAxis.appendChild(this.panelContainers.right);
      this.verticalAxis.insertBefore(this.panelContainers.top, this.paneContainer);
      this.verticalAxis.appendChild(this.panelContainers.bottom);
      this.insertBefore(this.panelContainers.header, this.horizontalAxis);
      this.appendChild(this.panelContainers.footer);
      this.appendChild(this.panelContainers.modal);
      return this;
    };

    WorkspaceElement.prototype.getModel = function() {
      return this.model;
    };

    WorkspaceElement.prototype.handleMousewheel = function(event) {
      if (event.ctrlKey && this.config.get('editor.zoomFontWhenCtrlScrolling') && event.target.matches('atom-text-editor')) {
        if (event.wheelDeltaY > 0) {
          this.model.increaseFontSize();
        } else if (event.wheelDeltaY < 0) {
          this.model.decreaseFontSize();
        }
        event.preventDefault();
        return event.stopPropagation();
      }
    };

    WorkspaceElement.prototype.handleFocus = function(event) {
      return this.model.getActivePane().activate();
    };

    WorkspaceElement.prototype.focusPaneViewAbove = function() {
      return this.paneContainer.focusPaneViewAbove();
    };

    WorkspaceElement.prototype.focusPaneViewBelow = function() {
      return this.paneContainer.focusPaneViewBelow();
    };

    WorkspaceElement.prototype.focusPaneViewOnLeft = function() {
      return this.paneContainer.focusPaneViewOnLeft();
    };

    WorkspaceElement.prototype.focusPaneViewOnRight = function() {
      return this.paneContainer.focusPaneViewOnRight();
    };

    WorkspaceElement.prototype.moveActiveItemToPaneAbove = function(params) {
      return this.paneContainer.moveActiveItemToPaneAbove(params);
    };

    WorkspaceElement.prototype.moveActiveItemToPaneBelow = function(params) {
      return this.paneContainer.moveActiveItemToPaneBelow(params);
    };

    WorkspaceElement.prototype.moveActiveItemToPaneOnLeft = function(params) {
      return this.paneContainer.moveActiveItemToPaneOnLeft(params);
    };

    WorkspaceElement.prototype.moveActiveItemToPaneOnRight = function(params) {
      return this.paneContainer.moveActiveItemToPaneOnRight(params);
    };

    WorkspaceElement.prototype.runPackageSpecs = function() {
      var activePath, projectPath, ref, specPath, testPath;
      if (activePath = (ref = this.workspace.getActivePaneItem()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0) {
        projectPath = this.project.relativizePath(activePath)[0];
      } else {
        projectPath = this.project.getPaths()[0];
      }
      if (projectPath) {
        specPath = path.join(projectPath, 'spec');
        testPath = path.join(projectPath, 'test');
        if (!fs.existsSync(specPath) && fs.existsSync(testPath)) {
          specPath = testPath;
        }
        return ipcRenderer.send('run-package-specs', specPath);
      }
    };

    WorkspaceElement.prototype.runBenchmarks = function() {
      var activePath, projectPath, ref;
      if (activePath = (ref = this.workspace.getActivePaneItem()) != null ? typeof ref.getPath === "function" ? ref.getPath() : void 0 : void 0) {
        projectPath = this.project.relativizePath(activePath)[0];
      } else {
        projectPath = this.project.getPaths()[0];
      }
      if (projectPath) {
        return ipcRenderer.send('run-benchmarks', path.join(projectPath, 'benchmarks'));
      }
    };

    return WorkspaceElement;

  })(HTMLElement);

  module.exports = WorkspaceElement = document.registerElement('atom-workspace', {
    prototype: WorkspaceElement.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy93b3Jrc3BhY2UtZWxlbWVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDRFQUFBO0lBQUE7OztFQUFDLGNBQWUsT0FBQSxDQUFRLFVBQVI7O0VBQ2hCLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0osc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUN4QixjQUFBLEdBQWlCLE9BQUEsQ0FBUSxpQkFBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OzsrQkFDSiwwQkFBQSxHQUE0Qjs7K0JBRTVCLGdCQUFBLEdBQWtCLFNBQUE7YUFDaEIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQURnQjs7K0JBR2xCLGdCQUFBLEdBQWtCLFNBQUE7YUFDaEIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7SUFEZ0I7OytCQUdsQixpQkFBQSxHQUFtQixTQUFBO01BQ2pCLElBQUMsQ0FBQSxTQUFTLENBQUMsR0FBWCxDQUFlLFdBQWY7TUFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLFVBQWQsRUFBMEIsQ0FBQyxDQUEzQjtNQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCLFFBQVEsQ0FBQyxhQUFULENBQXVCLHFCQUF2QjtNQUNoQixJQUFDLENBQUEsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUF4QixDQUE0QixVQUE1QjtNQUVBLElBQUMsQ0FBQSxjQUFELEdBQWtCLFFBQVEsQ0FBQyxhQUFULENBQXVCLHFCQUF2QjtNQUNsQixJQUFDLENBQUEsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUExQixDQUE4QixZQUE5QjtNQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsV0FBaEIsQ0FBNEIsSUFBQyxDQUFBLFlBQTdC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bEI7T0FBQSxNQUFBO1FBR0csY0FBZSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBQSxLQUhsQjs7TUFJQSxJQUFHLFdBQUg7UUFDRSxRQUFBLEdBQVcsSUFBSSxDQUFDLElBQUwsQ0FBVSxXQUFWLEVBQXVCLE1BQXZCO1FBQ1gsUUFBQSxHQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsV0FBVixFQUF1QixNQUF2QjtRQUNYLElBQUcsQ0FBSSxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBSixJQUFnQyxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsQ0FBbkM7VUFDRSxRQUFBLEdBQVcsU0FEYjs7ZUFHQSxXQUFXLENBQUMsSUFBWixDQUFpQixtQkFBakIsRUFBc0MsUUFBdEMsRUFORjs7SUFMZTs7K0JBYWpCLGFBQUEsR0FBZSxTQUFBO0FBQ2IsVUFBQTtNQUFBLElBQUcsVUFBQSwrRkFBMkMsQ0FBRSwyQkFBaEQ7UUFDRyxjQUFlLElBQUMsQ0FBQSxPQUFPLENBQUMsY0FBVCxDQUF3QixVQUF4QixLQURsQjtPQUFBLE1BQUE7UUFHRyxjQUFlLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBVCxDQUFBLEtBSGxCOztNQUtBLElBQUcsV0FBSDtlQUNFLFdBQVcsQ0FBQyxJQUFaLENBQWlCLGdCQUFqQixFQUFtQyxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBdUIsWUFBdkIsQ0FBbkMsRUFERjs7SUFOYTs7OztLQXpJYzs7RUFrSi9CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLGdCQUFBLEdBQW1CLFFBQVEsQ0FBQyxlQUFULENBQXlCLGdCQUF6QixFQUEyQztJQUFBLFNBQUEsRUFBVyxnQkFBZ0IsQ0FBQyxTQUE1QjtHQUEzQztBQXpKcEMiLCJzb3VyY2VzQ29udGVudCI6WyJ7aXBjUmVuZGVyZXJ9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbnNjcm9sbGJhclN0eWxlID0gcmVxdWlyZSAnc2Nyb2xsYmFyLXN0eWxlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBXb3Jrc3BhY2VFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgZ2xvYmFsVGV4dEVkaXRvclN0eWxlU2hlZXQ6IG51bGxcblxuICBhdHRhY2hlZENhbGxiYWNrOiAtPlxuICAgIEBmb2N1cygpXG5cbiAgZGV0YWNoZWRDYWxsYmFjazogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBpbml0aWFsaXplQ29udGVudDogLT5cbiAgICBAY2xhc3NMaXN0LmFkZCAnd29ya3NwYWNlJ1xuICAgIEBzZXRBdHRyaWJ1dGUgJ3RhYmluZGV4JywgLTFcblxuICAgIEB2ZXJ0aWNhbEF4aXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdG9tLXdvcmtzcGFjZS1heGlzJylcbiAgICBAdmVydGljYWxBeGlzLmNsYXNzTGlzdC5hZGQoJ3ZlcnRpY2FsJylcblxuICAgIEBob3Jpem9udGFsQXhpcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F0b20td29ya3NwYWNlLWF4aXMnKVxuICAgIEBob3Jpem9udGFsQXhpcy5jbGFzc0xpc3QuYWRkKCdob3Jpem9udGFsJylcbiAgICBAaG9yaXpvbnRhbEF4aXMuYXBwZW5kQ2hpbGQoQHZlcnRpY2FsQXhpcylcblxuICAgIEBhcHBlbmRDaGlsZChAaG9yaXpvbnRhbEF4aXMpXG5cbiAgb2JzZXJ2ZVNjcm9sbGJhclN0eWxlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBzY3JvbGxiYXJTdHlsZS5vYnNlcnZlUHJlZmVycmVkU2Nyb2xsYmFyU3R5bGUgKHN0eWxlKSA9PlxuICAgICAgc3dpdGNoIHN0eWxlXG4gICAgICAgIHdoZW4gJ2xlZ2FjeSdcbiAgICAgICAgICBAY2xhc3NMaXN0LnJlbW92ZSgnc2Nyb2xsYmFycy12aXNpYmxlLXdoZW4tc2Nyb2xsaW5nJylcbiAgICAgICAgICBAY2xhc3NMaXN0LmFkZChcInNjcm9sbGJhcnMtdmlzaWJsZS1hbHdheXNcIilcbiAgICAgICAgd2hlbiAnb3ZlcmxheSdcbiAgICAgICAgICBAY2xhc3NMaXN0LnJlbW92ZSgnc2Nyb2xsYmFycy12aXNpYmxlLWFsd2F5cycpXG4gICAgICAgICAgQGNsYXNzTGlzdC5hZGQoXCJzY3JvbGxiYXJzLXZpc2libGUtd2hlbi1zY3JvbGxpbmdcIilcblxuICBvYnNlcnZlVGV4dEVkaXRvckZvbnRDb25maWc6IC0+XG4gICAgQHVwZGF0ZUdsb2JhbFRleHRFZGl0b3JTdHlsZVNoZWV0KClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRTaXplJywgQHVwZGF0ZUdsb2JhbFRleHRFZGl0b3JTdHlsZVNoZWV0LmJpbmQodGhpcylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRGYW1pbHknLCBAdXBkYXRlR2xvYmFsVGV4dEVkaXRvclN0eWxlU2hlZXQuYmluZCh0aGlzKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAY29uZmlnLm9uRGlkQ2hhbmdlICdlZGl0b3IubGluZUhlaWdodCcsIEB1cGRhdGVHbG9iYWxUZXh0RWRpdG9yU3R5bGVTaGVldC5iaW5kKHRoaXMpXG5cbiAgdXBkYXRlR2xvYmFsVGV4dEVkaXRvclN0eWxlU2hlZXQ6IC0+XG4gICAgZm9udEZhbWlseSA9IEBjb25maWcuZ2V0KCdlZGl0b3IuZm9udEZhbWlseScpXG4gICAgIyBUT0RPOiBUaGVyZSBpcyBhIGJ1ZyBpbiBob3cgc29tZSBlbW9qaXMgKGUuZy4g4p2k77iPKSBhcmUgcmVuZGVyZWQgb24gbWFjT1MuXG4gICAgIyBUaGlzIHdvcmthcm91bmQgc2hvdWxkIGJlIHJlbW92ZWQgb25jZSB3ZSB1cGRhdGUgdG8gQ2hyb21pdW0gNTEsIHdoZXJlIHRoZVxuICAgICMgcHJvYmxlbSB3YXMgZml4ZWQuXG4gICAgZm9udEZhbWlseSArPSAnLCBcIkFwcGxlIENvbG9yIEVtb2ppXCInIGlmIHByb2Nlc3MucGxhdGZvcm0gaXMgJ2RhcndpbidcbiAgICBzdHlsZVNoZWV0U291cmNlID0gXCJcIlwiXG4gICAgICBhdG9tLXRleHQtZWRpdG9yIHtcbiAgICAgICAgZm9udC1zaXplOiAje0Bjb25maWcuZ2V0KCdlZGl0b3IuZm9udFNpemUnKX1weDtcbiAgICAgICAgZm9udC1mYW1pbHk6ICN7Zm9udEZhbWlseX07XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAje0Bjb25maWcuZ2V0KCdlZGl0b3IubGluZUhlaWdodCcpfTtcbiAgICAgIH1cbiAgICBcIlwiXCJcbiAgICBAc3R5bGVzLmFkZFN0eWxlU2hlZXQoc3R5bGVTaGVldFNvdXJjZSwgc291cmNlUGF0aDogJ2dsb2JhbC10ZXh0LWVkaXRvci1zdHlsZXMnKVxuICAgIEB2aWV3cy5wZXJmb3JtRG9jdW1lbnRQb2xsKClcblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCB7QHZpZXdzLCBAd29ya3NwYWNlLCBAcHJvamVjdCwgQGNvbmZpZywgQHN0eWxlc30pIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgdmlld3MgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFdvcnNrcGFjZUVsZW1lbnRzXCIpIHVubGVzcyBAdmlld3M/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgd29ya3NwYWNlIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBXb3Jza3BhY2VFbGVtZW50c1wiKSB1bmxlc3MgQHdvcmtzcGFjZT9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSBwcm9qZWN0IHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBXb3Jza3BhY2VFbGVtZW50c1wiKSB1bmxlc3MgQHByb2plY3Q/XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgY29uZmlnIHBhcmFtZXRlciB3aGVuIGluaXRpYWxpemluZyBXb3Jza3BhY2VFbGVtZW50c1wiKSB1bmxlc3MgQGNvbmZpZz9cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHBhc3MgYSBzdHlsZXMgcGFyYW1ldGVyIHdoZW4gaW5pdGlhbGl6aW5nIFdvcnNrcGFjZUVsZW1lbnRzXCIpIHVubGVzcyBAc3R5bGVzP1xuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBpbml0aWFsaXplQ29udGVudCgpXG4gICAgQG9ic2VydmVTY3JvbGxiYXJTdHlsZSgpXG4gICAgQG9ic2VydmVUZXh0RWRpdG9yRm9udENvbmZpZygpXG5cbiAgICBAcGFuZUNvbnRhaW5lciA9IEB2aWV3cy5nZXRWaWV3KEBtb2RlbC5wYW5lQ29udGFpbmVyKVxuICAgIEB2ZXJ0aWNhbEF4aXMuYXBwZW5kQ2hpbGQoQHBhbmVDb250YWluZXIpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJywgQGhhbmRsZUZvY3VzLmJpbmQodGhpcylcblxuICAgIEBhZGRFdmVudExpc3RlbmVyICdtb3VzZXdoZWVsJywgQGhhbmRsZU1vdXNld2hlZWwuYmluZCh0aGlzKSwgdHJ1ZVxuXG4gICAgQHBhbmVsQ29udGFpbmVycyA9XG4gICAgICB0b3A6IEB2aWV3cy5nZXRWaWV3KEBtb2RlbC5wYW5lbENvbnRhaW5lcnMudG9wKVxuICAgICAgbGVmdDogQHZpZXdzLmdldFZpZXcoQG1vZGVsLnBhbmVsQ29udGFpbmVycy5sZWZ0KVxuICAgICAgcmlnaHQ6IEB2aWV3cy5nZXRWaWV3KEBtb2RlbC5wYW5lbENvbnRhaW5lcnMucmlnaHQpXG4gICAgICBib3R0b206IEB2aWV3cy5nZXRWaWV3KEBtb2RlbC5wYW5lbENvbnRhaW5lcnMuYm90dG9tKVxuICAgICAgaGVhZGVyOiBAdmlld3MuZ2V0VmlldyhAbW9kZWwucGFuZWxDb250YWluZXJzLmhlYWRlcilcbiAgICAgIGZvb3RlcjogQHZpZXdzLmdldFZpZXcoQG1vZGVsLnBhbmVsQ29udGFpbmVycy5mb290ZXIpXG4gICAgICBtb2RhbDogQHZpZXdzLmdldFZpZXcoQG1vZGVsLnBhbmVsQ29udGFpbmVycy5tb2RhbClcblxuICAgIEBob3Jpem9udGFsQXhpcy5pbnNlcnRCZWZvcmUoQHBhbmVsQ29udGFpbmVycy5sZWZ0LCBAdmVydGljYWxBeGlzKVxuICAgIEBob3Jpem9udGFsQXhpcy5hcHBlbmRDaGlsZChAcGFuZWxDb250YWluZXJzLnJpZ2h0KVxuXG4gICAgQHZlcnRpY2FsQXhpcy5pbnNlcnRCZWZvcmUoQHBhbmVsQ29udGFpbmVycy50b3AsIEBwYW5lQ29udGFpbmVyKVxuICAgIEB2ZXJ0aWNhbEF4aXMuYXBwZW5kQ2hpbGQoQHBhbmVsQ29udGFpbmVycy5ib3R0b20pXG5cbiAgICBAaW5zZXJ0QmVmb3JlKEBwYW5lbENvbnRhaW5lcnMuaGVhZGVyLCBAaG9yaXpvbnRhbEF4aXMpXG4gICAgQGFwcGVuZENoaWxkKEBwYW5lbENvbnRhaW5lcnMuZm9vdGVyKVxuXG4gICAgQGFwcGVuZENoaWxkKEBwYW5lbENvbnRhaW5lcnMubW9kYWwpXG5cbiAgICB0aGlzXG5cbiAgZ2V0TW9kZWw6IC0+IEBtb2RlbFxuXG4gIGhhbmRsZU1vdXNld2hlZWw6IChldmVudCkgLT5cbiAgICBpZiBldmVudC5jdHJsS2V5IGFuZCBAY29uZmlnLmdldCgnZWRpdG9yLnpvb21Gb250V2hlbkN0cmxTY3JvbGxpbmcnKSBhbmQgZXZlbnQudGFyZ2V0Lm1hdGNoZXMoJ2F0b20tdGV4dC1lZGl0b3InKVxuICAgICAgaWYgZXZlbnQud2hlZWxEZWx0YVkgPiAwXG4gICAgICAgIEBtb2RlbC5pbmNyZWFzZUZvbnRTaXplKClcbiAgICAgIGVsc2UgaWYgZXZlbnQud2hlZWxEZWx0YVkgPCAwXG4gICAgICAgIEBtb2RlbC5kZWNyZWFzZUZvbnRTaXplKClcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgaGFuZGxlRm9jdXM6IChldmVudCkgLT5cbiAgICBAbW9kZWwuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKClcblxuICBmb2N1c1BhbmVWaWV3QWJvdmU6IC0+IEBwYW5lQ29udGFpbmVyLmZvY3VzUGFuZVZpZXdBYm92ZSgpXG5cbiAgZm9jdXNQYW5lVmlld0JlbG93OiAtPiBAcGFuZUNvbnRhaW5lci5mb2N1c1BhbmVWaWV3QmVsb3coKVxuXG4gIGZvY3VzUGFuZVZpZXdPbkxlZnQ6IC0+IEBwYW5lQ29udGFpbmVyLmZvY3VzUGFuZVZpZXdPbkxlZnQoKVxuXG4gIGZvY3VzUGFuZVZpZXdPblJpZ2h0OiAtPiBAcGFuZUNvbnRhaW5lci5mb2N1c1BhbmVWaWV3T25SaWdodCgpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVBYm92ZTogKHBhcmFtcykgLT4gQHBhbmVDb250YWluZXIubW92ZUFjdGl2ZUl0ZW1Ub1BhbmVBYm92ZShwYXJhbXMpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVCZWxvdzogKHBhcmFtcykgLT4gQHBhbmVDb250YWluZXIubW92ZUFjdGl2ZUl0ZW1Ub1BhbmVCZWxvdyhwYXJhbXMpXG5cbiAgbW92ZUFjdGl2ZUl0ZW1Ub1BhbmVPbkxlZnQ6IChwYXJhbXMpIC0+IEBwYW5lQ29udGFpbmVyLm1vdmVBY3RpdmVJdGVtVG9QYW5lT25MZWZ0KHBhcmFtcylcblxuICBtb3ZlQWN0aXZlSXRlbVRvUGFuZU9uUmlnaHQ6IChwYXJhbXMpIC0+IEBwYW5lQ29udGFpbmVyLm1vdmVBY3RpdmVJdGVtVG9QYW5lT25SaWdodChwYXJhbXMpXG5cbiAgcnVuUGFja2FnZVNwZWNzOiAtPlxuICAgIGlmIGFjdGl2ZVBhdGggPSBAd29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk/LmdldFBhdGg/KClcbiAgICAgIFtwcm9qZWN0UGF0aF0gPSBAcHJvamVjdC5yZWxhdGl2aXplUGF0aChhY3RpdmVQYXRoKVxuICAgIGVsc2VcbiAgICAgIFtwcm9qZWN0UGF0aF0gPSBAcHJvamVjdC5nZXRQYXRocygpXG4gICAgaWYgcHJvamVjdFBhdGhcbiAgICAgIHNwZWNQYXRoID0gcGF0aC5qb2luKHByb2plY3RQYXRoLCAnc3BlYycpXG4gICAgICB0ZXN0UGF0aCA9IHBhdGguam9pbihwcm9qZWN0UGF0aCwgJ3Rlc3QnKVxuICAgICAgaWYgbm90IGZzLmV4aXN0c1N5bmMoc3BlY1BhdGgpIGFuZCBmcy5leGlzdHNTeW5jKHRlc3RQYXRoKVxuICAgICAgICBzcGVjUGF0aCA9IHRlc3RQYXRoXG5cbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoJ3J1bi1wYWNrYWdlLXNwZWNzJywgc3BlY1BhdGgpXG5cbiAgcnVuQmVuY2htYXJrczogLT5cbiAgICBpZiBhY3RpdmVQYXRoID0gQHdvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpPy5nZXRQYXRoPygpXG4gICAgICBbcHJvamVjdFBhdGhdID0gQHByb2plY3QucmVsYXRpdml6ZVBhdGgoYWN0aXZlUGF0aClcbiAgICBlbHNlXG4gICAgICBbcHJvamVjdFBhdGhdID0gQHByb2plY3QuZ2V0UGF0aHMoKVxuXG4gICAgaWYgcHJvamVjdFBhdGhcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoJ3J1bi1iZW5jaG1hcmtzJywgcGF0aC5qb2luKHByb2plY3RQYXRoLCAnYmVuY2htYXJrcycpKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtzcGFjZUVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQgJ2F0b20td29ya3NwYWNlJywgcHJvdG90eXBlOiBXb3Jrc3BhY2VFbGVtZW50LnByb3RvdHlwZVxuIl19
