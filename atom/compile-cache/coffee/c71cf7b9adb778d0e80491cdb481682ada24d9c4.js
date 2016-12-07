(function() {
  var CompositeDisposable, Disposable, WindowEventHandler, listen, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('event-kit'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  listen = require('./delegated-listener');

  module.exports = WindowEventHandler = (function() {
    function WindowEventHandler(arg) {
      var browserWindow, ref1;
      this.atomEnvironment = arg.atomEnvironment, this.applicationDelegate = arg.applicationDelegate, this.window = arg.window, this.document = arg.document;
      this.handleDocumentContextmenu = bind(this.handleDocumentContextmenu, this);
      this.handleLinkClick = bind(this.handleLinkClick, this);
      this.handleWindowToggleMenuBar = bind(this.handleWindowToggleMenuBar, this);
      this.handleWindowToggleDevTools = bind(this.handleWindowToggleDevTools, this);
      this.handleWindowReload = bind(this.handleWindowReload, this);
      this.handleWindowClose = bind(this.handleWindowClose, this);
      this.handleWindowToggleFullScreen = bind(this.handleWindowToggleFullScreen, this);
      this.handleWindowBeforeunload = bind(this.handleWindowBeforeunload, this);
      this.handleLeaveFullScreen = bind(this.handleLeaveFullScreen, this);
      this.handleEnterFullScreen = bind(this.handleEnterFullScreen, this);
      this.handleWindowBlur = bind(this.handleWindowBlur, this);
      this.handleFocusPrevious = bind(this.handleFocusPrevious, this);
      this.handleFocusNext = bind(this.handleFocusNext, this);
      this.handleDocumentKeyEvent = bind(this.handleDocumentKeyEvent, this);
      this.reloadRequested = false;
      this.subscriptions = new CompositeDisposable;
      this.addEventListener(this.window, 'beforeunload', this.handleWindowBeforeunload);
      this.addEventListener(this.window, 'focus', this.handleWindowFocus);
      this.addEventListener(this.window, 'blur', this.handleWindowBlur);
      this.addEventListener(this.document, 'keyup', this.handleDocumentKeyEvent);
      this.addEventListener(this.document, 'keydown', this.handleDocumentKeyEvent);
      this.addEventListener(this.document, 'drop', this.handleDocumentDrop);
      this.addEventListener(this.document, 'dragover', this.handleDocumentDragover);
      this.addEventListener(this.document, 'contextmenu', this.handleDocumentContextmenu);
      this.subscriptions.add(listen(this.document, 'click', 'a', this.handleLinkClick));
      this.subscriptions.add(listen(this.document, 'submit', 'form', this.handleFormSubmit));
      browserWindow = this.applicationDelegate.getCurrentWindow();
      browserWindow.on('enter-full-screen', this.handleEnterFullScreen);
      this.subscriptions.add(new Disposable((function(_this) {
        return function() {
          return browserWindow.removeListener('enter-full-screen', _this.handleEnterFullScreen);
        };
      })(this)));
      browserWindow.on('leave-full-screen', this.handleLeaveFullScreen);
      this.subscriptions.add(new Disposable((function(_this) {
        return function() {
          return browserWindow.removeListener('leave-full-screen', _this.handleLeaveFullScreen);
        };
      })(this)));
      this.subscriptions.add(this.atomEnvironment.commands.add(this.window, {
        'window:toggle-full-screen': this.handleWindowToggleFullScreen,
        'window:close': this.handleWindowClose,
        'window:reload': this.handleWindowReload,
        'window:toggle-dev-tools': this.handleWindowToggleDevTools
      }));
      if ((ref1 = process.platform) === 'win32' || ref1 === 'linux') {
        this.subscriptions.add(this.atomEnvironment.commands.add(this.window, {
          'window:toggle-menu-bar': this.handleWindowToggleMenuBar
        }));
      }
      this.subscriptions.add(this.atomEnvironment.commands.add(this.document, {
        'core:focus-next': this.handleFocusNext,
        'core:focus-previous': this.handleFocusPrevious
      }));
      this.handleNativeKeybindings();
    }

    WindowEventHandler.prototype.handleNativeKeybindings = function() {
      var bindCommandToAction;
      bindCommandToAction = (function(_this) {
        return function(command, action) {
          return _this.subscriptions.add(_this.atomEnvironment.commands.add('.native-key-bindings', command, function(event) {
            return _this.applicationDelegate.getCurrentWindow().webContents[action]();
          }));
        };
      })(this);
      bindCommandToAction('core:copy', 'copy');
      bindCommandToAction('core:paste', 'paste');
      bindCommandToAction('core:undo', 'undo');
      bindCommandToAction('core:redo', 'redo');
      bindCommandToAction('core:select-all', 'selectAll');
      return bindCommandToAction('core:cut', 'cut');
    };

    WindowEventHandler.prototype.unsubscribe = function() {
      return this.subscriptions.dispose();
    };

    WindowEventHandler.prototype.on = function(target, eventName, handler) {
      target.on(eventName, handler);
      return this.subscriptions.add(new Disposable(function() {
        return target.removeListener(eventName, handler);
      }));
    };

    WindowEventHandler.prototype.addEventListener = function(target, eventName, handler) {
      target.addEventListener(eventName, handler);
      return this.subscriptions.add(new Disposable(function() {
        return target.removeEventListener(eventName, handler);
      }));
    };

    WindowEventHandler.prototype.handleDocumentKeyEvent = function(event) {
      this.atomEnvironment.keymaps.handleKeyboardEvent(event);
      return event.stopImmediatePropagation();
    };

    WindowEventHandler.prototype.handleDrop = function(event) {
      event.preventDefault();
      return event.stopPropagation();
    };

    WindowEventHandler.prototype.handleDragover = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return event.dataTransfer.dropEffect = 'none';
    };

    WindowEventHandler.prototype.eachTabIndexedElement = function(callback) {
      var element, i, len, ref1;
      ref1 = this.document.querySelectorAll('[tabindex]');
      for (i = 0, len = ref1.length; i < len; i++) {
        element = ref1[i];
        if (element.disabled) {
          continue;
        }
        if (!(element.tabIndex >= 0)) {
          continue;
        }
        callback(element, element.tabIndex);
      }
    };

    WindowEventHandler.prototype.handleFocusNext = function() {
      var focusedTabIndex, lowestElement, lowestTabIndex, nextElement, nextTabIndex, ref1;
      focusedTabIndex = (ref1 = this.document.activeElement.tabIndex) != null ? ref1 : -2e308;
      nextElement = null;
      nextTabIndex = 2e308;
      lowestElement = null;
      lowestTabIndex = 2e308;
      this.eachTabIndexedElement(function(element, tabIndex) {
        if (tabIndex < lowestTabIndex) {
          lowestTabIndex = tabIndex;
          lowestElement = element;
        }
        if ((focusedTabIndex < tabIndex && tabIndex < nextTabIndex)) {
          nextTabIndex = tabIndex;
          return nextElement = element;
        }
      });
      if (nextElement != null) {
        return nextElement.focus();
      } else if (lowestElement != null) {
        return lowestElement.focus();
      }
    };

    WindowEventHandler.prototype.handleFocusPrevious = function() {
      var focusedTabIndex, highestElement, highestTabIndex, previousElement, previousTabIndex, ref1;
      focusedTabIndex = (ref1 = this.document.activeElement.tabIndex) != null ? ref1 : 2e308;
      previousElement = null;
      previousTabIndex = -2e308;
      highestElement = null;
      highestTabIndex = -2e308;
      this.eachTabIndexedElement(function(element, tabIndex) {
        if (tabIndex > highestTabIndex) {
          highestTabIndex = tabIndex;
          highestElement = element;
        }
        if ((focusedTabIndex > tabIndex && tabIndex > previousTabIndex)) {
          previousTabIndex = tabIndex;
          return previousElement = element;
        }
      });
      if (previousElement != null) {
        return previousElement.focus();
      } else if (highestElement != null) {
        return highestElement.focus();
      }
    };

    WindowEventHandler.prototype.handleWindowFocus = function() {
      return this.document.body.classList.remove('is-blurred');
    };

    WindowEventHandler.prototype.handleWindowBlur = function() {
      this.document.body.classList.add('is-blurred');
      return this.atomEnvironment.storeWindowDimensions();
    };

    WindowEventHandler.prototype.handleEnterFullScreen = function() {
      return this.document.body.classList.add("fullscreen");
    };

    WindowEventHandler.prototype.handleLeaveFullScreen = function() {
      return this.document.body.classList.remove("fullscreen");
    };

    WindowEventHandler.prototype.handleWindowBeforeunload = function(event) {
      var confirmed, projectHasPaths, ref1;
      projectHasPaths = this.atomEnvironment.project.getPaths().length > 0;
      confirmed = (ref1 = this.atomEnvironment.workspace) != null ? ref1.confirmClose({
        windowCloseRequested: true,
        projectHasPaths: projectHasPaths
      }) : void 0;
      if (confirmed && !this.reloadRequested && !this.atomEnvironment.inSpecMode() && this.atomEnvironment.getCurrentWindow().isWebViewFocused()) {
        this.atomEnvironment.hide();
      }
      this.reloadRequested = false;
      this.atomEnvironment.storeWindowDimensions();
      if (confirmed) {
        this.atomEnvironment.unloadEditorWindow();
        return this.atomEnvironment.destroy();
      } else {
        this.applicationDelegate.didCancelWindowUnload();
        return event.returnValue = false;
      }
    };

    WindowEventHandler.prototype.handleWindowToggleFullScreen = function() {
      return this.atomEnvironment.toggleFullScreen();
    };

    WindowEventHandler.prototype.handleWindowClose = function() {
      return this.atomEnvironment.close();
    };

    WindowEventHandler.prototype.handleWindowReload = function() {
      this.reloadRequested = true;
      return this.atomEnvironment.reload();
    };

    WindowEventHandler.prototype.handleWindowToggleDevTools = function() {
      return this.atomEnvironment.toggleDevTools();
    };

    WindowEventHandler.prototype.handleWindowToggleMenuBar = function() {
      var detail;
      this.atomEnvironment.config.set('core.autoHideMenuBar', !this.atomEnvironment.config.get('core.autoHideMenuBar'));
      if (this.atomEnvironment.config.get('core.autoHideMenuBar')) {
        detail = "To toggle, press the Alt key or execute the window:toggle-menu-bar command";
        return this.atomEnvironment.notifications.addInfo('Menu bar hidden', {
          detail: detail
        });
      }
    };

    WindowEventHandler.prototype.handleLinkClick = function(event) {
      var ref1, uri;
      event.preventDefault();
      uri = (ref1 = event.currentTarget) != null ? ref1.getAttribute('href') : void 0;
      if (uri && uri[0] !== '#' && /^https?:\/\//.test(uri)) {
        return this.applicationDelegate.openExternal(uri);
      }
    };

    WindowEventHandler.prototype.handleFormSubmit = function(event) {
      return event.preventDefault();
    };

    WindowEventHandler.prototype.handleDocumentContextmenu = function(event) {
      event.preventDefault();
      return this.atomEnvironment.contextMenu.showForEvent(event);
    };

    return WindowEventHandler;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy93aW5kb3ctZXZlbnQtaGFuZGxlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdFQUFBO0lBQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLFdBQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLE1BQUEsR0FBUyxPQUFBLENBQVEsc0JBQVI7O0VBR1QsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLDRCQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsSUFBQyxDQUFBLHNCQUFBLGlCQUFpQixJQUFDLENBQUEsMEJBQUEscUJBQXFCLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLGVBQUE7Ozs7Ozs7Ozs7Ozs7OztNQUMvRCxJQUFDLENBQUEsZUFBRCxHQUFtQjtNQUNuQixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BRXJCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsTUFBbkIsRUFBMkIsY0FBM0IsRUFBMkMsSUFBQyxDQUFBLHdCQUE1QztNQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsTUFBbkIsRUFBMkIsT0FBM0IsRUFBb0MsSUFBQyxDQUFBLGlCQUFyQztNQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsTUFBbkIsRUFBMkIsTUFBM0IsRUFBbUMsSUFBQyxDQUFBLGdCQUFwQztNQUVBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsUUFBbkIsRUFBNkIsT0FBN0IsRUFBc0MsSUFBQyxDQUFBLHNCQUF2QztNQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsUUFBbkIsRUFBNkIsU0FBN0IsRUFBd0MsSUFBQyxDQUFBLHNCQUF6QztNQUNBLElBQUMsQ0FBQSxnQkFBRCxD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cG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5saXN0ZW4gPSByZXF1aXJlICcuL2RlbGVnYXRlZC1saXN0ZW5lcidcblxuIyBIYW5kbGVzIGxvdy1sZXZlbCBldmVudHMgcmVsYXRlZCB0byB0aGUgQHdpbmRvdy5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFdpbmRvd0V2ZW50SGFuZGxlclxuICBjb25zdHJ1Y3RvcjogKHtAYXRvbUVudmlyb25tZW50LCBAYXBwbGljYXRpb25EZWxlZ2F0ZSwgQHdpbmRvdywgQGRvY3VtZW50fSkgLT5cbiAgICBAcmVsb2FkUmVxdWVzdGVkID0gZmFsc2VcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgICBAYWRkRXZlbnRMaXN0ZW5lcihAd2luZG93LCAnYmVmb3JldW5sb2FkJywgQGhhbmRsZVdpbmRvd0JlZm9yZXVubG9hZClcbiAgICBAYWRkRXZlbnRMaXN0ZW5lcihAd2luZG93LCAnZm9jdXMnLCBAaGFuZGxlV2luZG93Rm9jdXMpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIoQHdpbmRvdywgJ2JsdXInLCBAaGFuZGxlV2luZG93Qmx1cilcblxuICAgIEBhZGRFdmVudExpc3RlbmVyKEBkb2N1bWVudCwgJ2tleXVwJywgQGhhbmRsZURvY3VtZW50S2V5RXZlbnQpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIoQGRvY3VtZW50LCAna2V5ZG93bicsIEBoYW5kbGVEb2N1bWVudEtleUV2ZW50KVxuICAgIEBhZGRFdmVudExpc3RlbmVyKEBkb2N1bWVudCwgJ2Ryb3AnLCBAaGFuZGxlRG9jdW1lbnREcm9wKVxuICAgIEBhZGRFdmVudExpc3RlbmVyKEBkb2N1bWVudCwgJ2RyYWdvdmVyJywgQGhhbmRsZURvY3VtZW50RHJhZ292ZXIpXG4gICAgQGFkZEV2ZW50TGlzdGVuZXIoQGRvY3VtZW50LCAnY29udGV4dG1lbnUnLCBAaGFuZGxlRG9jdW1lbnRDb250ZXh0bWVudSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgbGlzdGVuKEBkb2N1bWVudCwgJ2NsaWNrJywgJ2EnLCBAaGFuZGxlTGlua0NsaWNrKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBsaXN0ZW4oQGRvY3VtZW50LCAnc3VibWl0JywgJ2Zvcm0nLCBAaGFuZGxlRm9ybVN1Ym1pdClcblxuICAgIGJyb3dzZXJXaW5kb3cgPSBAYXBwbGljYXRpb25EZWxlZ2F0ZS5nZXRDdXJyZW50V2luZG93KClcbiAgICBicm93c2VyV2luZG93Lm9uICdlbnRlci1mdWxsLXNjcmVlbicsIEBoYW5kbGVFbnRlckZ1bGxTY3JlZW5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIGJyb3dzZXJXaW5kb3cucmVtb3ZlTGlzdGVuZXIoJ2VudGVyLWZ1bGwtc2NyZWVuJywgQGhhbmRsZUVudGVyRnVsbFNjcmVlbilcblxuICAgIGJyb3dzZXJXaW5kb3cub24gJ2xlYXZlLWZ1bGwtc2NyZWVuJywgQGhhbmRsZUxlYXZlRnVsbFNjcmVlblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgYnJvd3NlcldpbmRvdy5yZW1vdmVMaXN0ZW5lcignbGVhdmUtZnVsbC1zY3JlZW4nLCBAaGFuZGxlTGVhdmVGdWxsU2NyZWVuKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBhdG9tRW52aXJvbm1lbnQuY29tbWFuZHMuYWRkIEB3aW5kb3csXG4gICAgICAnd2luZG93OnRvZ2dsZS1mdWxsLXNjcmVlbic6IEBoYW5kbGVXaW5kb3dUb2dnbGVGdWxsU2NyZWVuXG4gICAgICAnd2luZG93OmNsb3NlJzogQGhhbmRsZVdpbmRvd0Nsb3NlXG4gICAgICAnd2luZG93OnJlbG9hZCc6IEBoYW5kbGVXaW5kb3dSZWxvYWRcbiAgICAgICd3aW5kb3c6dG9nZ2xlLWRldi10b29scyc6IEBoYW5kbGVXaW5kb3dUb2dnbGVEZXZUb29sc1xuXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpbiBbJ3dpbjMyJywgJ2xpbnV4J11cbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAYXRvbUVudmlyb25tZW50LmNvbW1hbmRzLmFkZCBAd2luZG93LFxuICAgICAgICAnd2luZG93OnRvZ2dsZS1tZW51LWJhcic6IEBoYW5kbGVXaW5kb3dUb2dnbGVNZW51QmFyXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGF0b21FbnZpcm9ubWVudC5jb21tYW5kcy5hZGQgQGRvY3VtZW50LFxuICAgICAgJ2NvcmU6Zm9jdXMtbmV4dCc6IEBoYW5kbGVGb2N1c05leHRcbiAgICAgICdjb3JlOmZvY3VzLXByZXZpb3VzJzogQGhhbmRsZUZvY3VzUHJldmlvdXNcblxuICAgIEBoYW5kbGVOYXRpdmVLZXliaW5kaW5ncygpXG5cbiAgIyBXaXJlIGNvbW1hbmRzIHRoYXQgc2hvdWxkIGJlIGhhbmRsZWQgYnkgQ2hyb21pdW0gZm9yIGVsZW1lbnRzIHdpdGggdGhlXG4gICMgYC5uYXRpdmUta2V5LWJpbmRpbmdzYCBjbGFzcy5cbiAgaGFuZGxlTmF0aXZlS2V5YmluZGluZ3M6IC0+XG4gICAgYmluZENvbW1hbmRUb0FjdGlvbiA9IChjb21tYW5kLCBhY3Rpb24pID0+XG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGF0b21FbnZpcm9ubWVudC5jb21tYW5kcy5hZGQgJy5uYXRpdmUta2V5LWJpbmRpbmdzJywgY29tbWFuZCwgKGV2ZW50KSA9PlxuICAgICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5nZXRDdXJyZW50V2luZG93KCkud2ViQ29udGVudHNbYWN0aW9uXSgpXG5cbiAgICBiaW5kQ29tbWFuZFRvQWN0aW9uKCdjb3JlOmNvcHknLCAnY29weScpXG4gICAgYmluZENvbW1hbmRUb0FjdGlvbignY29yZTpwYXN0ZScsICdwYXN0ZScpXG4gICAgYmluZENvbW1hbmRUb0FjdGlvbignY29yZTp1bmRvJywgJ3VuZG8nKVxuICAgIGJpbmRDb21tYW5kVG9BY3Rpb24oJ2NvcmU6cmVkbycsICdyZWRvJylcbiAgICBiaW5kQ29tbWFuZFRvQWN0aW9uKCdjb3JlOnNlbGVjdC1hbGwnLCAnc2VsZWN0QWxsJylcbiAgICBiaW5kQ29tbWFuZFRvQWN0aW9uKCdjb3JlOmN1dCcsICdjdXQnKVxuXG4gIHVuc3Vic2NyaWJlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG4gIG9uOiAodGFyZ2V0LCBldmVudE5hbWUsIGhhbmRsZXIpIC0+XG4gICAgdGFyZ2V0Lm9uKGV2ZW50TmFtZSwgaGFuZGxlcilcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIHRhcmdldC5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIpXG4gICAgKVxuXG4gIGFkZEV2ZW50TGlzdGVuZXI6ICh0YXJnZXQsIGV2ZW50TmFtZSwgaGFuZGxlcikgLT5cbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKC0+IHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlcikpKVxuXG4gIGhhbmRsZURvY3VtZW50S2V5RXZlbnQ6IChldmVudCkgPT5cbiAgICBAYXRvbUVudmlyb25tZW50LmtleW1hcHMuaGFuZGxlS2V5Ym9hcmRFdmVudChldmVudClcbiAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuXG4gIGhhbmRsZURyb3A6IChldmVudCkgLT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICBoYW5kbGVEcmFnb3ZlcjogKGV2ZW50KSAtPlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ25vbmUnXG5cbiAgZWFjaFRhYkluZGV4ZWRFbGVtZW50OiAoY2FsbGJhY2spIC0+XG4gICAgZm9yIGVsZW1lbnQgaW4gQGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0YWJpbmRleF0nKVxuICAgICAgY29udGludWUgaWYgZWxlbWVudC5kaXNhYmxlZFxuICAgICAgY29udGludWUgdW5sZXNzIGVsZW1lbnQudGFiSW5kZXggPj0gMFxuICAgICAgY2FsbGJhY2soZWxlbWVudCwgZWxlbWVudC50YWJJbmRleClcbiAgICByZXR1cm5cblxuICBoYW5kbGVGb2N1c05leHQ6ID0+XG4gICAgZm9jdXNlZFRhYkluZGV4ID0gQGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFiSW5kZXggPyAtSW5maW5pdHlcblxuICAgIG5leHRFbGVtZW50ID0gbnVsbFxuICAgIG5leHRUYWJJbmRleCA9IEluZmluaXR5XG4gICAgbG93ZXN0RWxlbWVudCA9IG51bGxcbiAgICBsb3dlc3RUYWJJbmRleCA9IEluZmluaXR5XG4gICAgQGVhY2hUYWJJbmRleGVkRWxlbWVudCAoZWxlbWVudCwgdGFiSW5kZXgpIC0+XG4gICAgICBpZiB0YWJJbmRleCA8IGxvd2VzdFRhYkluZGV4XG4gICAgICAgIGxvd2VzdFRhYkluZGV4ID0gdGFiSW5kZXhcbiAgICAgICAgbG93ZXN0RWxlbWVudCA9IGVsZW1lbnRcblxuICAgICAgaWYgZm9jdXNlZFRhYkluZGV4IDwgdGFiSW5kZXggPCBuZXh0VGFiSW5kZXhcbiAgICAgICAgbmV4dFRhYkluZGV4ID0gdGFiSW5kZXhcbiAgICAgICAgbmV4dEVsZW1lbnQgPSBlbGVtZW50XG5cbiAgICBpZiBuZXh0RWxlbWVudD9cbiAgICAgIG5leHRFbGVtZW50LmZvY3VzKClcbiAgICBlbHNlIGlmIGxvd2VzdEVsZW1lbnQ/XG4gICAgICBsb3dlc3RFbGVtZW50LmZvY3VzKClcblxuICBoYW5kbGVGb2N1c1ByZXZpb3VzOiA9PlxuICAgIGZvY3VzZWRUYWJJbmRleCA9IEBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhYkluZGV4ID8gSW5maW5pdHlcblxuICAgIHByZXZpb3VzRWxlbWVudCA9IG51bGxcbiAgICBwcmV2aW91c1RhYkluZGV4ID0gLUluZmluaXR5XG4gICAgaGlnaGVzdEVsZW1lbnQgPSBudWxsXG4gICAgaGlnaGVzdFRhYkluZGV4ID0gLUluZmluaXR5XG4gICAgQGVhY2hUYWJJbmRleGVkRWxlbWVudCAoZWxlbWVudCwgdGFiSW5kZXgpIC0+XG4gICAgICBpZiB0YWJJbmRleCA+IGhpZ2hlc3RUYWJJbmRleFxuICAgICAgICBoaWdoZXN0VGFiSW5kZXggPSB0YWJJbmRleFxuICAgICAgICBoaWdoZXN0RWxlbWVudCA9IGVsZW1lbnRcblxuICAgICAgaWYgZm9jdXNlZFRhYkluZGV4ID4gdGFiSW5kZXggPiBwcmV2aW91c1RhYkluZGV4XG4gICAgICAgIHByZXZpb3VzVGFiSW5kZXggPSB0YWJJbmRleFxuICAgICAgICBwcmV2aW91c0VsZW1lbnQgPSBlbGVtZW50XG5cbiAgICBpZiBwcmV2aW91c0VsZW1lbnQ/XG4gICAgICBwcmV2aW91c0VsZW1lbnQuZm9jdXMoKVxuICAgIGVsc2UgaWYgaGlnaGVzdEVsZW1lbnQ/XG4gICAgICBoaWdoZXN0RWxlbWVudC5mb2N1cygpXG5cbiAgaGFuZGxlV2luZG93Rm9jdXM6IC0+XG4gICAgQGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnaXMtYmx1cnJlZCcpXG5cbiAgaGFuZGxlV2luZG93Qmx1cjogPT5cbiAgICBAZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdpcy1ibHVycmVkJylcbiAgICBAYXRvbUVudmlyb25tZW50LnN0b3JlV2luZG93RGltZW5zaW9ucygpXG5cbiAgaGFuZGxlRW50ZXJGdWxsU2NyZWVuOiA9PlxuICAgIEBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJmdWxsc2NyZWVuXCIpXG5cbiAgaGFuZGxlTGVhdmVGdWxsU2NyZWVuOiA9PlxuICAgIEBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJmdWxsc2NyZWVuXCIpXG5cbiAgaGFuZGxlV2luZG93QmVmb3JldW5sb2FkOiAoZXZlbnQpID0+XG4gICAgcHJvamVjdEhhc1BhdGhzID0gQGF0b21FbnZpcm9ubWVudC5wcm9qZWN0LmdldFBhdGhzKCkubGVuZ3RoID4gMFxuICAgIGNvbmZpcm1lZCA9IEBhdG9tRW52aXJvbm1lbnQud29ya3NwYWNlPy5jb25maXJtQ2xvc2Uod2luZG93Q2xvc2VSZXF1ZXN0ZWQ6IHRydWUsIHByb2plY3RIYXNQYXRoczogcHJvamVjdEhhc1BhdGhzKVxuICAgIGlmIGNvbmZpcm1lZCBhbmQgbm90IEByZWxvYWRSZXF1ZXN0ZWQgYW5kIG5vdCBAYXRvbUVudmlyb25tZW50LmluU3BlY01vZGUoKSBhbmQgQGF0b21FbnZpcm9ubWVudC5nZXRDdXJyZW50V2luZG93KCkuaXNXZWJWaWV3Rm9jdXNlZCgpXG4gICAgICBAYXRvbUVudmlyb25tZW50LmhpZGUoKVxuICAgIEByZWxvYWRSZXF1ZXN0ZWQgPSBmYWxzZVxuXG4gICAgQGF0b21FbnZpcm9ubWVudC5zdG9yZVdpbmRvd0RpbWVuc2lvbnMoKVxuICAgIGlmIGNvbmZpcm1lZFxuICAgICAgQGF0b21FbnZpcm9ubWVudC51bmxvYWRFZGl0b3JXaW5kb3coKVxuICAgICAgQGF0b21FbnZpcm9ubWVudC5kZXN0cm95KClcbiAgICBlbHNlXG4gICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5kaWRDYW5jZWxXaW5kb3dVbmxvYWQoKVxuICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZVxuXG4gIGhhbmRsZVdpbmRvd1RvZ2dsZUZ1bGxTY3JlZW46ID0+XG4gICAgQGF0b21FbnZpcm9ubWVudC50b2dnbGVGdWxsU2NyZWVuKClcblxuICBoYW5kbGVXaW5kb3dDbG9zZTogPT5cbiAgICBAYXRvbUVudmlyb25tZW50LmNsb3NlKClcblxuICBoYW5kbGVXaW5kb3dSZWxvYWQ6ID0+XG4gICAgQHJlbG9hZFJlcXVlc3RlZCA9IHRydWVcbiAgICBAYXRvbUVudmlyb25tZW50LnJlbG9hZCgpXG5cbiAgaGFuZGxlV2luZG93VG9nZ2xlRGV2VG9vbHM6ID0+XG4gICAgQGF0b21FbnZpcm9ubWVudC50b2dnbGVEZXZUb29scygpXG5cbiAgaGFuZGxlV2luZG93VG9nZ2xlTWVudUJhcjogPT5cbiAgICBAYXRvbUVudmlyb25tZW50LmNvbmZpZy5zZXQoJ2NvcmUuYXV0b0hpZGVNZW51QmFyJywgbm90IEBhdG9tRW52aXJvbm1lbnQuY29uZmlnLmdldCgnY29yZS5hdXRvSGlkZU1lbnVCYXInKSlcblxuICAgIGlmIEBhdG9tRW52aXJvbm1lbnQuY29uZmlnLmdldCgnY29yZS5hdXRvSGlkZU1lbnVCYXInKVxuICAgICAgZGV0YWlsID0gXCJUbyB0b2dnbGUsIHByZXNzIHRoZSBBbHQga2V5IG9yIGV4ZWN1dGUgdGhlIHdpbmRvdzp0b2dnbGUtbWVudS1iYXIgY29tbWFuZFwiXG4gICAgICBAYXRvbUVudmlyb25tZW50Lm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnTWVudSBiYXIgaGlkZGVuJywge2RldGFpbH0pXG5cbiAgaGFuZGxlTGlua0NsaWNrOiAoZXZlbnQpID0+XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIHVyaSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ/LmdldEF0dHJpYnV0ZSgnaHJlZicpXG4gICAgaWYgdXJpIGFuZCB1cmlbMF0gaXNudCAnIycgYW5kIC9eaHR0cHM/OlxcL1xcLy8udGVzdCh1cmkpXG4gICAgICBAYXBwbGljYXRpb25EZWxlZ2F0ZS5vcGVuRXh0ZXJuYWwodXJpKVxuXG4gIGhhbmRsZUZvcm1TdWJtaXQ6IChldmVudCkgLT5cbiAgICAjIFByZXZlbnQgZm9ybSBzdWJtaXRzIGZyb20gY2hhbmdpbmcgdGhlIGN1cnJlbnQgd2luZG93J3MgVVJMXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gIGhhbmRsZURvY3VtZW50Q29udGV4dG1lbnU6IChldmVudCkgPT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgQGF0b21FbnZpcm9ubWVudC5jb250ZXh0TWVudS5zaG93Rm9yRXZlbnQoZXZlbnQpXG4iXX0=
