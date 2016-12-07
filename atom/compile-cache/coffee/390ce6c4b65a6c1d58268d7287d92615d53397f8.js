(function() {
  var $, CompositeDisposable, StatusBar, StatusIcon, TerminalFusionView, View, os, path, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, View = ref.View;

  TerminalFusionView = require('./view');

  StatusIcon = require('./status-icon');

  os = require('os');

  path = require('path');

  module.exports = StatusBar = (function(superClass) {
    extend(StatusBar, superClass);

    function StatusBar() {
      this.moveTerminalView = bind(this.moveTerminalView, this);
      this.onDropTabBar = bind(this.onDropTabBar, this);
      this.onDrop = bind(this.onDrop, this);
      this.onDragOver = bind(this.onDragOver, this);
      this.onDragEnd = bind(this.onDragEnd, this);
      this.onDragLeave = bind(this.onDragLeave, this);
      this.onDragStart = bind(this.onDragStart, this);
      this.closeAll = bind(this.closeAll, this);
      return StatusBar.__super__.constructor.apply(this, arguments);
    }

    StatusBar.prototype.terminalViews = [];

    StatusBar.prototype.activeTerminal = null;

    StatusBar.prototype.returnFocus = null;

    StatusBar.content = function() {
      return this.div({
        "class": 'terminal-fusion status-bar',
        tabindex: -1
      }, (function(_this) {
        return function() {
          _this.i({
            "class": "icon icon-plus",
            click: 'newTerminalView',
            outlet: 'plusBtn'
          });
          _this.ul({
            "class": "list-inline status-container",
            tabindex: '-1',
            outlet: 'statusContainer',
            is: 'space-pen-ul'
          });
          return _this.i({
            "class": "icon icon-x",
            click: 'closeAll',
            outlet: 'closeBtn'
          });
        };
      })(this));
    };

    StatusBar.prototype.initialize = function(statusBarProvider) {
      var handleBlur, handleFocus;
      this.statusBarProvider = statusBarProvider;
      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'terminal-fusion:new': (function(_this) {
          return function() {
            return _this.newTerminalView();
          };
        })(this),
        'terminal-fusion:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this),
        'terminal-fusion:next': (function(_this) {
          return function() {
            if (!_this.activeTerminal) {
              return;
            }
            if (_this.activeTerminal.isAnimating()) {
              return;
            }
            if (_this.activeNextTerminalView()) {
              return _this.activeTerminal.open();
            }
          };
        })(this),
        'terminal-fusion:prev': (function(_this) {
          return function() {
            if (!_this.activeTerminal) {
              return;
            }
            if (_this.activeTerminal.isAnimating()) {
              return;
            }
            if (_this.activePrevTerminalView()) {
              return _this.activeTerminal.open();
            }
          };
        })(this),
        'terminal-fusion:close': (function(_this) {
          return function() {
            return _this.destroyActiveTerm();
          };
        })(this),
        'terminal-fusion:close-all': (function(_this) {
          return function() {
            return _this.closeAll();
          };
        })(this),
        'terminal-fusion:rename': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.rename();
            });
          };
        })(this),
        'terminal-fusion:insert-selected-text': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection('$S');
            });
          };
        })(this),
        'terminal-fusion:insert-text': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.inputDialog();
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-1': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText1'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-2': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText2'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-3': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText3'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-4': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText4'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-5': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText5'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-6': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText6'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-7': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText7'));
            });
          };
        })(this),
        'terminal-fusion:insert-custom-text-8': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.insertSelection(atom.config.get('terminal-fusion.customTexts.customText8'));
            });
          };
        })(this),
        'terminal-fusion:fullscreen': (function(_this) {
          return function() {
            return _this.activeTerminal.maximize();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.xterm', {
        'terminal-fusion:paste': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.paste();
            });
          };
        })(this),
        'terminal-fusion:copy': (function(_this) {
          return function() {
            return _this.runInActiveView(function(i) {
              return i.copy();
            });
          };
        })(this)
      }));
      this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function(item) {
          var mapping, nextTerminal, prevTerminal;
          if (item == null) {
            return;
          }
          if (item.constructor.name === "TerminalFusionView") {
            return setTimeout(item.focus, 100);
          } else if (item.constructor.name === "TextEditor") {
            mapping = atom.config.get('terminal-fusion.core.mapTerminalsTo');
            if (mapping === 'None') {
              return;
            }
            switch (mapping) {
              case 'File':
                nextTerminal = _this.getTerminalById(item.getPath(), function(view) {
                  return view.getId().filePath;
                });
                break;
              case 'Folder':
                nextTerminal = _this.getTerminalById(path.dirname(item.getPath()), function(view) {
                  return view.getId().folderPath;
                });
            }
            prevTerminal = _this.getActiveTerminalView();
            if (prevTerminal !== nextTerminal) {
              if (nextTerminal == null) {
                if (item.getTitle() !== 'untitled') {
                  if (atom.config.get('terminal-fusion.core.mapTerminalsToAutoOpen')) {
                    return nextTerminal = _this.createTerminalView();
                  }
                }
              } else {
                _this.setActiveTerminalView(nextTerminal);
                if (prevTerminal != null ? prevTerminal.panel.isVisible() : void 0) {
                  return nextTerminal.toggle();
                }
              }
            }
          }
        };
      })(this)));
      this.registerContextMenu();
      this.subscriptions.add(atom.tooltips.add(this.plusBtn, {
        title: 'New Terminal'
      }));
      this.subscriptions.add(atom.tooltips.add(this.closeBtn, {
        title: 'Close All'
      }));
      this.statusContainer.on('dblclick', (function(_this) {
        return function(event) {
          if (event.target === event.delegateTarget) {
            return _this.newTerminalView();
          }
        };
      })(this));
      this.statusContainer.on('dragstart', '.fusion-terminal-status-icon', this.onDragStart);
      this.statusContainer.on('dragend', '.fusion-terminal-status-icon', this.onDragEnd);
      this.statusContainer.on('dragleave', this.onDragLeave);
      this.statusContainer.on('dragover', this.onDragOver);
      this.statusContainer.on('drop', this.onDrop);
      handleBlur = (function(_this) {
        return function() {
          var terminal;
          if (terminal = TerminalFusionView.getFocusedTerminal()) {
            _this.returnFocus = _this.terminalViewForTerminal(terminal);
            return terminal.blur();
          }
        };
      })(this);
      handleFocus = (function(_this) {
        return function() {
          if (_this.returnFocus) {
            return setTimeout(function() {
              var tempFocus;
              if (_this.returnFocus) {
                tempFocus = _this.returnFocus;
                _this.returnFocus = null;
                if (tempFocus) {
                  return tempFocus.focus();
                }
              }
            }, 100);
          }
        };
      })(this);
      window.addEventListener('blur', handleBlur);
      this.subscriptions.add({
        dispose: function() {
          return window.removeEventListener('blur', handleBlur);
        }
      });
      window.addEventListener('focus', handleFocus);
      this.subscriptions.add({
        dispose: function() {
          return window.removeEventListener('focus', handleFocus);
        }
      });
      return this.attach();
    };

    StatusBar.prototype.registerContextMenu = function() {
      return this.subscriptions.add(atom.commands.add('.terminal-fusion.status-bar', {
        'terminal-fusion:status-red': this.setStatusColor,
        'terminal-fusion:status-orange': this.setStatusColor,
        'terminal-fusion:status-yellow': this.setStatusColor,
        'terminal-fusion:status-green': this.setStatusColor,
        'terminal-fusion:status-blue': this.setStatusColor,
        'terminal-fusion:status-purple': this.setStatusColor,
        'terminal-fusion:status-pink': this.setStatusColor,
        'terminal-fusion:status-cyan': this.setStatusColor,
        'terminal-fusion:status-magenta': this.setStatusColor,
        'terminal-fusion:status-default': this.clearStatusColor,
        'terminal-fusion:context-close': function(event) {
          return $(event.target).closest('.fusion-terminal-status-icon')[0].terminalView.destroy();
        },
        'terminal-fusion:context-hide': function(event) {
          var statusIcon;
          statusIcon = $(event.target).closest('.fusion-terminal-status-icon')[0];
          if (statusIcon.isActive()) {
            return statusIcon.terminalView.hide();
          }
        },
        'terminal-fusion:context-rename': function(event) {
          return $(event.target).closest('.fusion-terminal-status-icon')[0].rename();
        }
      }));
    };

    StatusBar.prototype.registerPaneSubscription = function() {
      return this.subscriptions.add(this.paneSubscription = atom.workspace.observePanes((function(_this) {
        return function(pane) {
          var paneElement, tabBar;
          paneElement = $(atom.views.getView(pane));
          tabBar = paneElement.find('ul');
          tabBar.on('drop', function(event) {
            return _this.onDropTabBar(event, pane);
          });
          tabBar.on('dragstart', function(event) {
            var ref1;
            if (((ref1 = event.target.item) != null ? ref1.constructor.name : void 0) !== 'TerminalFusionView') {
              return;
            }
            return event.originalEvent.dataTransfer.setData('terminal-fusion-tab', 'true');
          });
          return pane.onDidDestroy(function() {
            return tabBar.off('drop', this.onDropTabBar);
          });
        };
      })(this)));
    };

    StatusBar.prototype.createTerminalView = function(autoRun) {
      var args, directory, editorFolder, editorPath, home, id, j, len, projectFolder, pwd, ref1, ref2, shell, shellArguments, statusIcon, terminalPlusView;
      if (this.paneSubscription == null) {
        this.registerPaneSubscription();
      }
      projectFolder = atom.project.getPaths()[0];
      editorPath = (ref1 = atom.workspace.getActiveTextEditor()) != null ? ref1.getPath() : void 0;
      if (editorPath != null) {
        editorFolder = path.dirname(editorPath);
        ref2 = atom.project.getPaths();
        for (j = 0, len = ref2.length; j < len; j++) {
          directory = ref2[j];
          if (editorPath.indexOf(directory) >= 0) {
            projectFolder = directory;
          }
        }
      }
      if ((projectFolder != null ? projectFolder.indexOf('atom://') : void 0) >= 0) {
        projectFolder = void 0;
      }
      home = process.platform === 'win32' ? process.env.HOMEPATH : process.env.HOME;
      switch (atom.config.get('terminal-fusion.core.workingDirectory')) {
        case 'Project':
          pwd = projectFolder || editorFolder || home;
          break;
        case 'Active File':
          pwd = editorFolder || projectFolder || home;
          break;
        default:
          pwd = home;
      }
      id = editorPath || projectFolder || home;
      id = {
        filePath: id,
        folderPath: path.dirname(id)
      };
      shell = atom.config.get('terminal-fusion.core.shell');
      shellArguments = atom.config.get('terminal-fusion.core.shellArguments');
      args = shellArguments.split(/\s+/g).filter(function(arg) {
        return arg;
      });
      statusIcon = new StatusIcon();
      terminalPlusView = new TerminalFusionView(id, pwd, statusIcon, this, shell, args, autoRun);
      statusIcon.initialize(terminalPlusView);
      terminalPlusView.attach();
      this.terminalViews.push(terminalPlusView);
      this.statusContainer.append(statusIcon);
      return terminalPlusView;
    };

    StatusBar.prototype.activeNextTerminalView = function() {
      var index;
      index = this.indexOf(this.activeTerminal);
      if (index < 0) {
        return false;
      }
      return this.activeTerminalView(index + 1);
    };

    StatusBar.prototype.activePrevTerminalView = function() {
      var index;
      index = this.indexOf(this.activeTerminal);
      if (index < 0) {
        return false;
      }
      return this.activeTerminalView(index - 1);
    };

    StatusBar.prototype.indexOf = function(view) {
      return this.terminalViews.indexOf(view);
    };

    StatusBar.prototype.activeTerminalView = function(index) {
      if (this.terminalViews.length < 2) {
        return false;
      }
      if (index >= this.terminalViews.length) {
        index = 0;
      }
      if (index < 0) {
        index = this.terminalViews.length - 1;
      }
      this.activeTerminal = this.terminalViews[index];
      return true;
    };

    StatusBar.prototype.getActiveTerminalView = function() {
      return this.activeTerminal;
    };

    StatusBar.prototype.getTerminalById = function(target, selector) {
      var index, j, ref1, terminal;
      if (selector == null) {
        selector = function(terminal) {
          return terminal.id;
        };
      }
      for (index = j = 0, ref1 = this.terminalViews.length; 0 <= ref1 ? j <= ref1 : j >= ref1; index = 0 <= ref1 ? ++j : --j) {
        terminal = this.terminalViews[index];
        if (terminal != null) {
          if (selector(terminal) === target) {
            return terminal;
          }
        }
      }
      return null;
    };

    StatusBar.prototype.terminalViewForTerminal = function(terminal) {
      var index, j, ref1, terminalView;
      for (index = j = 0, ref1 = this.terminalViews.length; 0 <= ref1 ? j <= ref1 : j >= ref1; index = 0 <= ref1 ? ++j : --j) {
        terminalView = this.terminalViews[index];
        if (terminalView != null) {
          if (terminalView.getTerminal() === terminal) {
            return terminalView;
          }
        }
      }
      return null;
    };

    StatusBar.prototype.runInActiveView = function(callback) {
      var view;
      view = this.getActiveTerminalView();
      if (view != null) {
        return callback(view);
      }
      return null;
    };

    StatusBar.prototype.runCommandInNewTerminal = function(commands) {
      this.activeTerminal = this.createTerminalView(commands);
      return this.activeTerminal.toggle();
    };

    StatusBar.prototype.runInOpenView = function(callback) {
      var view;
      view = this.getActiveTerminalView();
      if ((view != null) && view.panel.isVisible()) {
        return callback(view);
      }
      return null;
    };

    StatusBar.prototype.setActiveTerminalView = function(view) {
      return this.activeTerminal = view;
    };

    StatusBar.prototype.removeTerminalView = function(view) {
      var index;
      index = this.indexOf(view);
      if (index < 0) {
        return;
      }
      this.terminalViews.splice(index, 1);
      return this.activateAdjacentTerminal(index);
    };

    StatusBar.prototype.activateAdjacentTerminal = function(index) {
      if (index == null) {
        index = 0;
      }
      if (!(this.terminalViews.length > 0)) {
        return false;
      }
      index = Math.max(0, index - 1);
      this.activeTerminal = this.terminalViews[index];
      return true;
    };

    StatusBar.prototype.newTerminalView = function() {
      var ref1;
      if ((ref1 = this.activeTerminal) != null ? ref1.animating : void 0) {
        return;
      }
      this.activeTerminal = this.createTerminalView();
      return this.activeTerminal.toggle();
    };

    StatusBar.prototype.attach = function() {
      return this.statusBarProvider.addLeftTile({
        item: this,
        priority: 100
      });
    };

    StatusBar.prototype.destroyActiveTerm = function() {
      var index;
      if (this.activeTerminal == null) {
        return;
      }
      index = this.indexOf(this.activeTerminal);
      this.activeTerminal.destroy();
      this.activeTerminal = null;
      return this.activateAdjacentTerminal(index);
    };

    StatusBar.prototype.closeAll = function() {
      var index, j, ref1, view;
      for (index = j = ref1 = this.terminalViews.length; ref1 <= 0 ? j <= 0 : j >= 0; index = ref1 <= 0 ? ++j : --j) {
        view = this.terminalViews[index];
        if (view != null) {
          view.destroy();
        }
      }
      return this.activeTerminal = null;
    };

    StatusBar.prototype.destroy = function() {
      var j, len, ref1, view;
      this.subscriptions.dispose();
      ref1 = this.terminalViews;
      for (j = 0, len = ref1.length; j < len; j++) {
        view = ref1[j];
        view.ptyProcess.terminate();
        view.terminal.destroy();
      }
      return this.detach();
    };

    StatusBar.prototype.toggle = function() {
      if (this.terminalViews.length === 0) {
        this.activeTerminal = this.createTerminalView();
      } else if (this.activeTerminal === null) {
        this.activeTerminal = this.terminalViews[0];
      }
      return this.activeTerminal.toggle();
    };

    StatusBar.prototype.setStatusColor = function(event) {
      var color;
      color = event.type.match(/\w+$/)[0];
      color = atom.config.get("terminal-fusion.iconColors." + color).toRGBAString();
      return $(event.target).closest('.fusion-terminal-status-icon').css('color', color);
    };

    StatusBar.prototype.clearStatusColor = function(event) {
      return $(event.target).closest('.fusion-terminal-status-icon').css('color', '');
    };

    StatusBar.prototype.onDragStart = function(event) {
      var element;
      event.originalEvent.dataTransfer.setData('terminal-fusion-panel', 'true');
      element = $(event.target).closest('.fusion-terminal-status-icon');
      element.addClass('is-dragging');
      return event.originalEvent.dataTransfer.setData('from-index', element.index());
    };

    StatusBar.prototype.onDragLeave = function(event) {
      return this.removePlaceholder();
    };

    StatusBar.prototype.onDragEnd = function(event) {
      return this.clearDropTarget();
    };

    StatusBar.prototype.onDragOver = function(event) {
      var element, newDropTargetIndex, statusIcons;
      event.preventDefault();
      event.stopPropagation();
      if (event.originalEvent.dataTransfer.getData('terminal-fusion') !== 'true') {
        return;
      }
      newDropTargetIndex = this.getDropTargetIndex(event);
      if (newDropTargetIndex == null) {
        return;
      }
      this.removeDropTargetClasses();
      statusIcons = this.statusContainer.children('.fusion-terminal-status-icon');
      if (newDropTargetIndex < statusIcons.length) {
        element = statusIcons.eq(newDropTargetIndex).addClass('is-drop-target');
        return this.getPlaceholder().insertBefore(element);
      } else {
        element = statusIcons.eq(newDropTargetIndex - 1).addClass('drop-target-is-after');
        return this.getPlaceholder().insertAfter(element);
      }
    };

    StatusBar.prototype.onDrop = function(event) {
      var dataTransfer, fromIndex, pane, paneIndex, panelEvent, tabEvent, toIndex, view;
      dataTransfer = event.originalEvent.dataTransfer;
      panelEvent = dataTransfer.getData('terminal-fusion-panel') === 'true';
      tabEvent = dataTransfer.getData('terminal-fusion-tab') === 'true';
      if (!(panelEvent || tabEvent)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toIndex = this.getDropTargetIndex(event);
      this.clearDropTarget();
      if (tabEvent) {
        fromIndex = parseInt(dataTransfer.getData('sortable-index'));
        paneIndex = parseInt(dataTransfer.getData('from-pane-index'));
        pane = atom.workspace.getPanes()[paneIndex];
        view = pane.itemAtIndex(fromIndex);
        pane.removeItem(view, false);
        view.show();
        view.toggleTabView();
        this.terminalViews.push(view);
        if (view.statusIcon.isActive()) {
          view.open();
        }
        this.statusContainer.append(view.statusIcon);
        fromIndex = this.terminalViews.length - 1;
      } else {
        fromIndex = parseInt(dataTransfer.getData('from-index'));
      }
      return this.updateOrder(fromIndex, toIndex);
    };

    StatusBar.prototype.onDropTabBar = function(event, pane) {
      var dataTransfer, fromIndex, tabBar, view;
      dataTransfer = event.originalEvent.dataTransfer;
      if (dataTransfer.getData('terminal-fusion-panel') !== 'true') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.clearDropTarget();
      fromIndex = parseInt(dataTransfer.getData('from-index'));
      view = this.terminalViews[fromIndex];
      view.css("height", "");
      view.terminal.element.style.height = "";
      tabBar = $(event.target).closest('.tab-bar');
      view.toggleTabView();
      this.removeTerminalView(view);
      this.statusContainer.children().eq(fromIndex).detach();
      view.statusIcon.removeTooltip();
      pane.addItem(view, pane.getItems().length);
      pane.activateItem(view);
      return view.focus();
    };

    StatusBar.prototype.clearDropTarget = function() {
      var element;
      element = this.find('.is-dragging');
      element.removeClass('is-dragging');
      this.removeDropTargetClasses();
      return this.removePlaceholder();
    };

    StatusBar.prototype.removeDropTargetClasses = function() {
      this.statusContainer.find('.is-drop-target').removeClass('is-drop-target');
      return this.statusContainer.find('.drop-target-is-after').removeClass('drop-target-is-after');
    };

    StatusBar.prototype.getDropTargetIndex = function(event) {
      var element, elementCenter, statusIcons, target;
      target = $(event.target);
      if (this.isPlaceholder(target)) {
        return;
      }
      statusIcons = this.statusContainer.children('.fusion-terminal-status-icon');
      element = target.closest('.fusion-terminal-status-icon');
      if (element.length === 0) {
        element = statusIcons.last();
      }
      if (!element.length) {
        return 0;
      }
      elementCenter = element.offset().left + element.width() / 2;
      if (event.originalEvent.pageX < elementCenter) {
        return statusIcons.index(element);
      } else if (element.next('.fusion-terminal-status-icon').length > 0) {
        return statusIcons.index(element.next('.fusion-terminal-status-icon'));
      } else {
        return statusIcons.index(element) + 1;
      }
    };

    StatusBar.prototype.getPlaceholder = function() {
      return this.placeholderEl != null ? this.placeholderEl : this.placeholderEl = $('<li class="placeholder"></li>');
    };

    StatusBar.prototype.removePlaceholder = function() {
      var ref1;
      if ((ref1 = this.placeholderEl) != null) {
        ref1.remove();
      }
      return this.placeholderEl = null;
    };

    StatusBar.prototype.isPlaceholder = function(element) {
      return element.is('.placeholder');
    };

    StatusBar.prototype.iconAtIndex = function(index) {
      return this.getStatusIcons().eq(index);
    };

    StatusBar.prototype.getStatusIcons = function() {
      return this.statusContainer.children('.fusion-terminal-status-icon');
    };

    StatusBar.prototype.moveIconToIndex = function(icon, toIndex) {
      var container, followingIcon;
      followingIcon = this.getStatusIcons()[toIndex];
      container = this.statusContainer[0];
      if (followingIcon != null) {
        return container.insertBefore(icon, followingIcon);
      } else {
        return container.appendChild(icon);
      }
    };

    StatusBar.prototype.moveTerminalView = function(fromIndex, toIndex) {
      var activeTerminal, view;
      activeTerminal = this.getActiveTerminalView();
      view = this.terminalViews.splice(fromIndex, 1)[0];
      this.terminalViews.splice(toIndex, 0, view);
      return this.setActiveTerminalView(activeTerminal);
    };

    StatusBar.prototype.updateOrder = function(fromIndex, toIndex) {
      var icon;
      if (fromIndex === toIndex) {
        return;
      }
      if (fromIndex < toIndex) {
        toIndex--;
      }
      icon = this.getStatusIcons().eq(fromIndex).detach();
      this.moveIconToIndex(icon.get(0), toIndex);
      this.moveTerminalView(fromIndex, toIndex);
      icon.addClass('inserted');
      return icon.one('webkitAnimationEnd', function() {
        return icon.removeClass('inserted');
      });
    };

    return StatusBar;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3Rlcm1pbmFsLWZ1c2lvbi9saWIvc3RhdHVzLWJhci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHNGQUFBO0lBQUE7Ozs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQXdCLE9BQUEsQ0FBUSxzQkFBUixDQUF4QixFQUFDLFNBQUQsRUFBSTs7RUFDSixrQkFBQSxHQUF3QixPQUFBLENBQVEsUUFBUjs7RUFDeEIsVUFBQSxHQUF3QixPQUFBLENBQVEsZUFBUjs7RUFDeEIsRUFBQSxHQUF3QixPQUFBLENBQVEsSUFBUjs7RUFDeEIsSUFBQSxHQUF3QixPQUFBLENBQVEsTUFBUjs7RUFFeEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozs7Ozs7Ozs7O3dCQUNKLGFBQUEsR0FBZTs7d0JBQ2YsY0FBQSxHQUFnQjs7d0JBQ2hCLFdBQUEsR0FBYTs7SUFFYixTQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyw0QkFBUDtRQUFxQyxRQUFBLEVBQVUsQ0FBQyxDQUFoRDtPQUFMLEVBQXdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUN0RCxLQUFDLENBQUEsQ0FBRCxDQUFHO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtZQUF5QixLQUFBLEVBQU8saUJBQWhDO1lBQW1ELE1BQUEsRUFBUSxTQUEzRDtXQUFIO1VBQ0EsS0FBQyxDQUFBLEVBQUQsQ0FBSTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sOEJBQVA7WUFBdUMsUUFBQSxFQUFVLElBQWpEO1lBQXVELE1BQUEsRUFBUSxpQkFBL0Q7WUFBa0YsRUFB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SUFBdkIsRUFBNkIsYUFBN0IsRUFERjtPQUFBLE1BQUE7ZUFHRSxTQUFTLENBQUMsV0FBVixDQUFzQixJQUF0QixFQUhGOztJQUhlOzt3QkFRakIsZ0JBQUEsR0FBa0IsU0FBQyxTQUFELEVBQVksT0FBWjtBQUNoQixVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFDLENBQUEscUJBQUQsQ0FBQTtNQUNqQixJQUFBLEdBQU8sSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLENBQXNCLFNBQXRCLEVBQWlDLENBQWpDLENBQW9DLENBQUEsQ0FBQTtNQUMzQyxJQUFDLENBQUEsYUFBYSxDQUFDLE1BQWYsQ0FBc0IsT0FBdEIsRUFBK0IsQ0FBL0IsRUFBa0MsSUFBbEM7YUFDQSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsY0FBdkI7SUFKZ0I7O3dCQU1sQixXQUFBLEdBQWEsU0FBQyxTQUFELEVBQVksT0FBWjtBQUNYLFVBQUE7TUFBQSxJQUFVLFNBQUEsS0FBYSxPQUF2QjtBQUFBLGVBQUE7O01BQ0EsSUFBYSxTQUFBLEdBQVksT0FBekI7UUFBQSxPQUFBLEdBQUE7O01BRUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBaUIsQ0FBQyxFQUFsQixDQUFxQixTQUFyQixDQUErQixDQUFDLE1BQWhDLENBQUE7TUFDUCxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsQ0FBakIsRUFBOEIsT0FBOUI7TUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsU0FBbEIsRUFBNkIsT0FBN0I7TUFDQSxJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQ7YUFDQSxJQUFJLENBQUMsR0FBTCxDQUFTLG9CQUFULEVBQStCLFNBQUE7ZUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixVQUFqQjtNQUFILENBQS9CO0lBUlc7Ozs7S0E3YlM7QUFSeEIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xueyQsIFZpZXd9ICAgICAgICAgICAgID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5UZXJtaW5hbEZ1c2lvblZpZXcgICAgPSByZXF1aXJlICcuL3ZpZXcnXG5TdGF0dXNJY29uICAgICAgICAgICAgPSByZXF1aXJlICcuL3N0YXR1cy1pY29uJ1xub3MgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnb3MnXG5wYXRoICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdwYXRoJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTdGF0dXNCYXIgZXh0ZW5kcyBWaWV3XG4gIHRlcm1pbmFsVmlld3M6IFtdXG4gIGFjdGl2ZVRlcm1pbmFsOiBudWxsXG4gIHJldHVybkZvY3VzOiBudWxsXG5cbiAgQGNvbnRlbnQ6IC0+XG4gICAgQGRpdiBjbGFzczogJ3Rlcm1pbmFsLWZ1c2lvbiBzdGF0dXMtYmFyJywgdGFiaW5kZXg6IC0xLCA9PlxuICAgICAgQGkgY2xhc3M6IFwiaWNvbiBpY29uLXBsdXNcIiwgY2xpY2s6ICduZXdUZXJtaW5hbFZpZXcnLCBvdXRsZXQ6ICdwbHVzQnRuJ1xuICAgICAgQHVsIGNsYXNzOiBcImxpc3QtaW5saW5lIHN0YXR1cy1jb250YWluZXJcIiwgdGFiaW5kZXg6ICctMScsIG91dGxldDogJ3N0YXR1c0NvbnRhaW5lcicsIGlzOiAnc3BhY2UtcGVuLXVsJ1xuICAgICAgQGkgY2xhc3M6IFwiaWNvbiBpY29uLXhcIiwgY2xpY2s6ICdjbG9zZUFsbCcsIG91dGxldDogJ2Nsb3NlQnRuJ1xuXG4gIGluaXRpYWxpemU6IChAc3RhdHVzQmFyUHJvdmlkZXIpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246bmV3JzogPT4gQG5ld1Rlcm1pbmFsVmlldygpXG4gICAgICAndGVybWluYWwtZnVzaW9uOnRvZ2dsZSc6ID0+IEB0b2dnbGUoKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpuZXh0JzogPT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBAYWN0aXZlVGVybWluYWxcbiAgICAgICAgcmV0dXJuIGlmIEBhY3RpdmVUZXJtaW5hbC5pc0FuaW1hdGluZygpXG4gICAgICAgIEBhY3RpdmVUZXJtaW5hbC5vcGVuKCkgaWYgQGFjdGl2ZU5leHRUZXJtaW5hbFZpZXcoKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpwcmV2JzogPT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBAYWN0aXZlVGVybWluYWxcbiAgICAgICAgcmV0dXJuIGlmIEBhY3RpdmVUZXJtaW5hbC5pc0FuaW1hdGluZygpXG4gICAgICAgIEBhY3RpdmVUZXJtaW5hbC5vcGVuKCkgaWYgQGFjdGl2ZVByZXZUZXJtaW5hbFZpZXcoKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpjbG9zZSc6ID0+IEBkZXN0cm95QWN0aXZlVGVybSgpXG4gICAgICAndGVybWluYWwtZnVzaW9uOmNsb3NlLWFsbCc6ID0+IEBjbG9zZUFsbCgpXG4gICAgICAndGVybWluYWwtZnVzaW9uOnJlbmFtZSc6ID0+IEBydW5JbkFjdGl2ZVZpZXcgKGkpIC0+IGkucmVuYW1lKClcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246aW5zZXJ0LXNlbGVjdGVkLXRleHQnOiA9PiBAcnVuSW5BY3RpdmVWaWV3IChpKSAtPiBpLmluc2VydFNlbGVjdGlvbignJFMnKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjppbnNlcnQtdGV4dCc6ID0+IEBydW5JbkFjdGl2ZVZpZXcgKGkpIC0+IGkuaW5wdXREaWFsb2coKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjppbnNlcnQtY3VzdG9tLXRleHQtMSc6ID0+IEBydW5JbkFjdGl2ZVZpZXcgKGkpIC0+IGkuaW5zZXJ0U2VsZWN0aW9uKGF0b20uY29uZmlnLmdldCgndGVybWluYWwtZnVzaW9uLmN1c3RvbVRleHRzLmN1c3RvbVRleHQxJykpXG4gICAgICAndGVybWluYWwtZnVzaW9uOmluc2VydC1jdXN0b20tdGV4dC0yJzogPT4gQHJ1bkluQWN0aXZlVmlldyAoaSkgLT4gaS5pbnNlcnRTZWxlY3Rpb24oYXRvbS5jb25maWcuZ2V0KCd0ZXJtaW5hbC1mdXNpb24uY3VzdG9tVGV4dHMuY3VzdG9tVGV4dDInKSlcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246aW5zZXJ0LWN1c3RvbS10ZXh0LTMnOiA9PiBAcnVuSW5BY3RpdmVWaWV3IChpKSAtPiBpLmluc2VydFNlbGVjdGlvbihhdG9tLmNvbmZpZy5nZXQoJ3Rlcm1pbmFsLWZ1c2lvbi5jdXN0b21UZXh0cy5jdXN0b21UZXh0MycpKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjppbnNlcnQtY3VzdG9tLXRleHQtNCc6ID0+IEBydW5JbkFjdGl2ZVZpZXcgKGkpIC0+IGkuaW5zZXJ0U2VsZWN0aW9uKGF0b20uY29uZmlnLmdldCgndGVybWluYWwtZnVzaW9uLmN1c3RvbVRleHRzLmN1c3RvbVRleHQ0JykpXG4gICAgICAndGVybWluYWwtZnVzaW9uOmluc2VydC1jdXN0b20tdGV4dC01JzogPT4gQHJ1bkluQWN0aXZlVmlldyAoaSkgLT4gaS5pbnNlcnRTZWxlY3Rpb24oYXRvbS5jb25maWcuZ2V0KCd0ZXJtaW5hbC1mdXNpb24uY3VzdG9tVGV4dHMuY3VzdG9tVGV4dDUnKSlcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246aW5zZXJ0LWN1c3RvbS10ZXh0LTYnOiA9PiBAcnVuSW5BY3RpdmVWaWV3IChpKSAtPiBpLmluc2VydFNlbGVjdGlvbihhdG9tLmNvbmZpZy5nZXQoJ3Rlcm1pbmFsLWZ1c2lvbi5jdXN0b21UZXh0cy5jdXN0b21UZXh0NicpKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjppbnNlcnQtY3VzdG9tLXRleHQtNyc6ID0+IEBydW5JbkFjdGl2ZVZpZXcgKGkpIC0+IGkuaW5zZXJ0U2VsZWN0aW9uKGF0b20uY29uZmlnLmdldCgndGVybWluYWwtZnVzaW9uLmN1c3RvbVRleHRzLmN1c3RvbVRleHQ3JykpXG4gICAgICAndGVybWluYWwtZnVzaW9uOmluc2VydC1jdXN0b20tdGV4dC04JzogPT4gQHJ1bkluQWN0aXZlVmlldyAoaSkgLT4gaS5pbnNlcnRTZWxlY3Rpb24oYXRvbS5jb25maWcuZ2V0KCd0ZXJtaW5hbC1mdXNpb24uY3VzdG9tVGV4dHMuY3VzdG9tVGV4dDgnKSlcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246ZnVsbHNjcmVlbic6ID0+IEBhY3RpdmVUZXJtaW5hbC5tYXhpbWl6ZSgpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy54dGVybScsXG4gICAgICAndGVybWluYWwtZnVzaW9uOnBhc3RlJzogPT4gQHJ1bkluQWN0aXZlVmlldyAoaSkgLT4gaS5wYXN0ZSgpXG4gICAgICAndGVybWluYWwtZnVzaW9uOmNvcHknOiA9PiBAcnVuSW5BY3RpdmVWaWV3IChpKSAtPiBpLmNvcHkoKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gKGl0ZW0pID0+XG4gICAgICByZXR1cm4gdW5sZXNzIGl0ZW0/XG5cbiAgICAgIGlmIGl0ZW0uY29uc3RydWN0b3IubmFtZSBpcyBcIlRlcm1pbmFsRnVzaW9uVmlld1wiXG4gICAgICAgIHNldFRpbWVvdXQgaXRlbS5mb2N1cywgMTAwXG4gICAgICBlbHNlIGlmIGl0ZW0uY29uc3RydWN0b3IubmFtZSBpcyBcIlRleHRFZGl0b3JcIlxuICAgICAgICBtYXBwaW5nID0gYXRvbS5jb25maWcuZ2V0KCd0ZXJtaW5hbC1mdXNpb24uY29yZS5tYXBUZXJtaW5hbHNUbycpXG4gICAgICAgIHJldHVybiBpZiBtYXBwaW5nIGlzICdOb25lJ1xuXG4gICAgICAgIHN3aXRjaCBtYXBwaW5nXG4gICAgICAgICAgd2hlbiAnRmlsZSdcbiAgICAgICAgICAgIG5leHRUZXJtaW5hbCA9IEBnZXRUZXJtaW5hbEJ5SWQgaXRlbS5nZXRQYXRoKCksICh2aWV3KSAtPiB2aWV3LmdldElkKCkuZmlsZVBhdGhcbiAgICAgICAgICB3aGVuICdGb2xkZXInXG4gICAgICAgICAgICBuZXh0VGVybWluYWwgPSBAZ2V0VGVybWluYWxCeUlkIHBhdGguZGlybmFtZShpdGVtLmdldFBhdGgoKSksICh2aWV3KSAtPiB2aWV3LmdldElkKCkuZm9sZGVyUGF0aFxuXG4gICAgICAgIHByZXZUZXJtaW5hbCA9IEBnZXRBY3RpdmVUZXJtaW5hbFZpZXcoKVxuICAgICAgICBpZiBwcmV2VGVybWluYWwgIT0gbmV4dFRlcm1pbmFsXG4gICAgICAgICAgaWYgbm90IG5leHRUZXJtaW5hbD9cbiAgICAgICAgICAgIGlmIGl0ZW0uZ2V0VGl0bGUoKSBpc250ICd1bnRpdGxlZCdcbiAgICAgICAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCd0ZXJtaW5hbC1mdXNpb24uY29yZS5tYXBUZXJtaW5hbHNUb0F1dG9PcGVuJylcbiAgICAgICAgICAgICAgICBuZXh0VGVybWluYWwgPSBAY3JlYXRlVGVybWluYWxWaWV3KClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2V0QWN0aXZlVGVybWluYWxWaWV3KG5leHRUZXJtaW5hbClcbiAgICAgICAgICAgIG5leHRUZXJtaW5hbC50b2dnbGUoKSBpZiBwcmV2VGVybWluYWw/LnBhbmVsLmlzVmlzaWJsZSgpXG5cbiAgICBAcmVnaXN0ZXJDb250ZXh0TWVudSgpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHBsdXNCdG4sIHRpdGxlOiAnTmV3IFRlcm1pbmFsJ1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAY2xvc2VCdG4sIHRpdGxlOiAnQ2xvc2UgQWxsJ1xuXG4gICAgQHN0YXR1c0NvbnRhaW5lci5vbiAnZGJsY2xpY2snLCAoZXZlbnQpID0+XG4gICAgICBAbmV3VGVybWluYWxWaWV3KCkgdW5sZXNzIGV2ZW50LnRhcmdldCAhPSBldmVudC5kZWxlZ2F0ZVRhcmdldFxuXG4gICAgQHN0YXR1c0NvbnRhaW5lci5vbiAnZHJhZ3N0YXJ0JywgJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nLCBAb25EcmFnU3RhcnRcbiAgICBAc3RhdHVzQ29udGFpbmVyLm9uICdkcmFnZW5kJywgJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nLCBAb25EcmFnRW5kXG4gICAgQHN0YXR1c0NvbnRhaW5lci5vbiAnZHJhZ2xlYXZlJywgQG9uRHJhZ0xlYXZlXG4gICAgQHN0YXR1c0NvbnRhaW5lci5vbiAnZHJhZ292ZXInLCBAb25EcmFnT3ZlclxuICAgIEBzdGF0dXNDb250YWluZXIub24gJ2Ryb3AnLCBAb25Ecm9wXG5cbiAgICBoYW5kbGVCbHVyID0gPT5cbiAgICAgIGlmIHRlcm1pbmFsID0gVGVybWluYWxGdXNpb25WaWV3LmdldEZvY3VzZWRUZXJtaW5hbCgpXG4gICAgICAgIEByZXR1cm5Gb2N1cyA9IEB0ZXJtaW5hbFZpZXdGb3JUZXJtaW5hbCh0ZXJtaW5hbClcbiAgICAgICAgdGVybWluYWwuYmx1cigpXG5cbiAgICBoYW5kbGVGb2N1cyA9ID0+XG4gICAgICBpZiBAcmV0dXJuRm9jdXNcbiAgICAgICAgc2V0VGltZW91dCA9PlxuICAgICAgICAgIGlmIEByZXR1cm5Gb2N1c1xuICAgICAgICAgICAgICB0ZW1wRm9jdXMgPSBAcmV0dXJuRm9jdXNcbiAgICAgICAgICAgICAgQHJldHVybkZvY3VzID0gbnVsbFxuICAgICAgICAgICAgICB0ZW1wRm9jdXMuZm9jdXMoKSBpZiB0ZW1wRm9jdXNcbiAgICAgICAgLCAxMDBcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdibHVyJywgaGFuZGxlQmx1clxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBkaXNwb3NlOiAtPlxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInLCBoYW5kbGVCbHVyXG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnLCBoYW5kbGVGb2N1c1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBkaXNwb3NlOiAtPlxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3VzJywgaGFuZGxlRm9jdXNcblxuICAgIEBhdHRhY2goKVxuXG4gIHJlZ2lzdGVyQ29udGV4dE1lbnU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcudGVybWluYWwtZnVzaW9uLnN0YXR1cy1iYXInLFxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtcmVkJzogQHNldFN0YXR1c0NvbG9yXG4gICAgICAndGVybWluYWwtZnVzaW9uOnN0YXR1cy1vcmFuZ2UnOiBAc2V0U3RhdHVzQ29sb3JcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246c3RhdHVzLXllbGxvdyc6IEBzZXRTdGF0dXNDb2xvclxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtZ3JlZW4nOiBAc2V0U3RhdHVzQ29sb3JcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246c3RhdHVzLWJsdWUnOiBAc2V0U3RhdHVzQ29sb3JcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246c3RhdHVzLXB1cnBsZSc6IEBzZXRTdGF0dXNDb2xvclxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtcGluayc6IEBzZXRTdGF0dXNDb2xvclxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtY3lhbic6IEBzZXRTdGF0dXNDb2xvclxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtbWFnZW50YSc6IEBzZXRTdGF0dXNDb2xvclxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpzdGF0dXMtZGVmYXVsdCc6IEBjbGVhclN0YXR1c0NvbG9yXG4gICAgICAndGVybWluYWwtZnVzaW9uOmNvbnRleHQtY2xvc2UnOiAoZXZlbnQpIC0+XG4gICAgICAgICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJylbMF0udGVybWluYWxWaWV3LmRlc3Ryb3koKVxuICAgICAgJ3Rlcm1pbmFsLWZ1c2lvbjpjb250ZXh0LWhpZGUnOiAoZXZlbnQpIC0+XG4gICAgICAgIHN0YXR1c0ljb24gPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmZ1c2lvbi10ZXJtaW5hbC1zdGF0dXMtaWNvbicpWzBdXG4gICAgICAgIHN0YXR1c0ljb24udGVybWluYWxWaWV3LmhpZGUoKSBpZiBzdGF0dXNJY29uLmlzQWN0aXZlKClcbiAgICAgICd0ZXJtaW5hbC1mdXNpb246Y29udGV4dC1yZW5hbWUnOiAoZXZlbnQpIC0+XG4gICAgICAgICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJylbMF0ucmVuYW1lKClcblxuICByZWdpc3RlclBhbmVTdWJzY3JpcHRpb246IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBwYW5lU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVBhbmVzIChwYW5lKSA9PlxuICAgICAgcGFuZUVsZW1lbnQgPSAkKGF0b20udmlld3MuZ2V0VmlldyhwYW5lKSlcbiAgICAgIHRhYkJhciA9IHBhbmVFbGVtZW50LmZpbmQoJ3VsJylcblxuICAgICAgdGFiQmFyLm9uICdkcm9wJywgKGV2ZW50KSA9PiBAb25Ecm9wVGFiQmFyKGV2ZW50LCBwYW5lKVxuICAgICAgdGFiQmFyLm9uICdkcmFnc3RhcnQnLCAoZXZlbnQpIC0+XG4gICAgICAgIHJldHVybiB1bmxlc3MgZXZlbnQudGFyZ2V0Lml0ZW0/LmNvbnN0cnVjdG9yLm5hbWUgaXMgJ1Rlcm1pbmFsRnVzaW9uVmlldydcbiAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSAndGVybWluYWwtZnVzaW9uLXRhYicsICd0cnVlJ1xuICAgICAgcGFuZS5vbkRpZERlc3Ryb3kgLT4gdGFiQmFyLm9mZiAnZHJvcCcsIEBvbkRyb3BUYWJCYXJcblxuICBjcmVhdGVUZXJtaW5hbFZpZXc6IChhdXRvUnVuKSAtPlxuICAgIEByZWdpc3RlclBhbmVTdWJzY3JpcHRpb24oKSB1bmxlc3MgQHBhbmVTdWJzY3JpcHRpb24/XG5cbiAgICBwcm9qZWN0Rm9sZGVyID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgICBlZGl0b3JQYXRoID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRQYXRoKClcblxuICAgIGlmIGVkaXRvclBhdGg/XG4gICAgICBlZGl0b3JGb2xkZXIgPSBwYXRoLmRpcm5hbWUoZWRpdG9yUGF0aClcbiAgICAgIGZvciBkaXJlY3RvcnkgaW4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcbiAgICAgICAgaWYgZWRpdG9yUGF0aC5pbmRleE9mKGRpcmVjdG9yeSkgPj0gMFxuICAgICAgICAgIHByb2plY3RGb2xkZXIgPSBkaXJlY3RvcnlcblxuICAgIHByb2plY3RGb2xkZXIgPSB1bmRlZmluZWQgaWYgcHJvamVjdEZvbGRlcj8uaW5kZXhPZignYXRvbTovLycpID49IDBcblxuICAgIGhvbWUgPSBpZiBwcm9jZXNzLnBsYXRmb3JtIGlzICd3aW4zMicgdGhlbiBwcm9jZXNzLmVudi5IT01FUEFUSCBlbHNlIHByb2Nlc3MuZW52LkhPTUVcblxuICAgIHN3aXRjaCBhdG9tLmNvbmZpZy5nZXQoJ3Rlcm1pbmFsLWZ1c2lvbi5jb3JlLndvcmtpbmdEaXJlY3RvcnknKVxuICAgICAgd2hlbiAnUHJvamVjdCcgdGhlbiBwd2QgPSBwcm9qZWN0Rm9sZGVyIG9yIGVkaXRvckZvbGRlciBvciBob21lXG4gICAgICB3aGVuICdBY3RpdmUgRmlsZScgdGhlbiBwd2QgPSBlZGl0b3JGb2xkZXIgb3IgcHJvamVjdEZvbGRlciBvciBob21lXG4gICAgICBlbHNlIHB3ZCA9IGhvbWVcblxuICAgIGlkID0gZWRpdG9yUGF0aCBvciBwcm9qZWN0Rm9sZGVyIG9yIGhvbWVcbiAgICBpZCA9IGZpbGVQYXRoOiBpZCwgZm9sZGVyUGF0aDogcGF0aC5kaXJuYW1lKGlkKVxuXG4gICAgc2hlbGwgPSBhdG9tLmNvbmZpZy5nZXQgJ3Rlcm1pbmFsLWZ1c2lvbi5jb3JlLnNoZWxsJ1xuICAgIHNoZWxsQXJndW1lbnRzID0gYXRvbS5jb25maWcuZ2V0ICd0ZXJtaW5hbC1mdXNpb24uY29yZS5zaGVsbEFyZ3VtZW50cydcbiAgICBhcmdzID0gc2hlbGxBcmd1bWVudHMuc3BsaXQoL1xccysvZykuZmlsdGVyIChhcmcpIC0+IGFyZ1xuXG4gICAgc3RhdHVzSWNvbiA9IG5ldyBTdGF0dXNJY29uKClcbiAgICB0ZXJtaW5hbFBsdXNWaWV3ID0gbmV3IFRlcm1pbmFsRnVzaW9uVmlldyhpZCwgcHdkLCBzdGF0dXNJY29uLCB0aGlzLCBzaGVsbCwgYXJncywgYXV0b1J1bilcbiAgICBzdGF0dXNJY29uLmluaXRpYWxpemUodGVybWluYWxQbHVzVmlldylcblxuICAgIHRlcm1pbmFsUGx1c1ZpZXcuYXR0YWNoKClcblxuICAgIEB0ZXJtaW5hbFZpZXdzLnB1c2ggdGVybWluYWxQbHVzVmlld1xuICAgIEBzdGF0dXNDb250YWluZXIuYXBwZW5kIHN0YXR1c0ljb25cbiAgICByZXR1cm4gdGVybWluYWxQbHVzVmlld1xuXG4gIGFjdGl2ZU5leHRUZXJtaW5hbFZpZXc6IC0+XG4gICAgaW5kZXggPSBAaW5kZXhPZihAYWN0aXZlVGVybWluYWwpXG4gICAgcmV0dXJuIGZhbHNlIGlmIGluZGV4IDwgMFxuICAgIEBhY3RpdmVUZXJtaW5hbFZpZXcgaW5kZXggKyAxXG5cbiAgYWN0aXZlUHJldlRlcm1pbmFsVmlldzogLT5cbiAgICBpbmRleCA9IEBpbmRleE9mKEBhY3RpdmVUZXJtaW5hbClcbiAgICByZXR1cm4gZmFsc2UgaWYgaW5kZXggPCAwXG4gICAgQGFjdGl2ZVRlcm1pbmFsVmlldyBpbmRleCAtIDFcblxuICBpbmRleE9mOiAodmlldykgLT5cbiAgICBAdGVybWluYWxWaWV3cy5pbmRleE9mKHZpZXcpXG5cbiAgYWN0aXZlVGVybWluYWxWaWV3OiAoaW5kZXgpIC0+XG4gICAgcmV0dXJuIGZhbHNlIGlmIEB0ZXJtaW5hbFZpZXdzLmxlbmd0aCA8IDJcblxuICAgIGlmIGluZGV4ID49IEB0ZXJtaW5hbFZpZXdzLmxlbmd0aFxuICAgICAgaW5kZXggPSAwXG4gICAgaWYgaW5kZXggPCAwXG4gICAgICBpbmRleCA9IEB0ZXJtaW5hbFZpZXdzLmxlbmd0aCAtIDFcblxuICAgIEBhY3RpdmVUZXJtaW5hbCA9IEB0ZXJtaW5hbFZpZXdzW2luZGV4XVxuICAgIHJldHVybiB0cnVlXG5cbiAgZ2V0QWN0aXZlVGVybWluYWxWaWV3OiAtPlxuICAgIHJldHVybiBAYWN0aXZlVGVybWluYWxcblxuICBnZXRUZXJtaW5hbEJ5SWQ6ICh0YXJnZXQsIHNlbGVjdG9yKSAtPlxuICAgIHNlbGVjdG9yID89ICh0ZXJtaW5hbCkgLT4gdGVybWluYWwuaWRcblxuICAgIGZvciBpbmRleCBpbiBbMCAuLiBAdGVybWluYWxWaWV3cy5sZW5ndGhdXG4gICAgICB0ZXJtaW5hbCA9IEB0ZXJtaW5hbFZpZXdzW2luZGV4XVxuICAgICAgaWYgdGVybWluYWw/XG4gICAgICAgIHJldHVybiB0ZXJtaW5hbCBpZiBzZWxlY3Rvcih0ZXJtaW5hbCkgPT0gdGFyZ2V0XG5cbiAgICByZXR1cm4gbnVsbFxuXG4gIHRlcm1pbmFsVmlld0ZvclRlcm1pbmFsOiAodGVybWluYWwpIC0+XG4gICAgZm9yIGluZGV4IGluIFswIC4uIEB0ZXJtaW5hbFZpZXdzLmxlbmd0aF1cbiAgICAgIHRlcm1pbmFsVmlldyA9IEB0ZXJtaW5hbFZpZXdzW2luZGV4XVxuICAgICAgaWYgdGVybWluYWxWaWV3P1xuICAgICAgICByZXR1cm4gdGVybWluYWxWaWV3IGlmIHRlcm1pbmFsVmlldy5nZXRUZXJtaW5hbCgpID09IHRlcm1pbmFsXG5cbiAgICByZXR1cm4gbnVsbFxuXG4gIHJ1bkluQWN0aXZlVmlldzogKGNhbGxiYWNrKSAtPlxuICAgIHZpZXcgPSBAZ2V0QWN0aXZlVGVybWluYWxWaWV3KClcbiAgICBpZiB2aWV3P1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHZpZXcpXG4gICAgcmV0dXJuIG51bGxcblxuICBydW5Db21tYW5kSW5OZXdUZXJtaW5hbDogKGNvbW1hbmRzKSAtPlxuICAgIEBhY3RpdmVUZXJtaW5hbCA9IEBjcmVhdGVUZXJtaW5hbFZpZXcoY29tbWFuZHMpXG4gICAgQGFjdGl2ZVRlcm1pbmFsLnRvZ2dsZSgpXG5cbiAgcnVuSW5PcGVuVmlldzogKGNhbGxiYWNrKSAtPlxuICAgIHZpZXcgPSBAZ2V0QWN0aXZlVGVybWluYWxWaWV3KClcbiAgICBpZiB2aWV3PyBhbmQgdmlldy5wYW5lbC5pc1Zpc2libGUoKVxuICAgICAgcmV0dXJuIGNhbGxiYWNrKHZpZXcpXG4gICAgcmV0dXJuIG51bGxcblxuICBzZXRBY3RpdmVUZXJtaW5hbFZpZXc6ICh2aWV3KSAtPlxuICAgIEBhY3RpdmVUZXJtaW5hbCA9IHZpZXdcblxuICByZW1vdmVUZXJtaW5hbFZpZXc6ICh2aWV3KSAtPlxuICAgIGluZGV4ID0gQGluZGV4T2Ygdmlld1xuICAgIHJldHVybiBpZiBpbmRleCA8IDBcbiAgICBAdGVybWluYWxWaWV3cy5zcGxpY2UgaW5kZXgsIDFcblxuICAgIEBhY3RpdmF0ZUFkamFjZW50VGVybWluYWwgaW5kZXhcblxuICBhY3RpdmF0ZUFkamFjZW50VGVybWluYWw6IChpbmRleD0wKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHRlcm1pbmFsVmlld3MubGVuZ3RoID4gMFxuXG4gICAgaW5kZXggPSBNYXRoLm1heCgwLCBpbmRleCAtIDEpXG4gICAgQGFjdGl2ZVRlcm1pbmFsID0gQHRlcm1pbmFsVmlld3NbaW5kZXhdXG5cbiAgICByZXR1cm4gdHJ1ZVxuXG4gIG5ld1Rlcm1pbmFsVmlldzogLT5cbiAgICByZXR1cm4gaWYgQGFjdGl2ZVRlcm1pbmFsPy5hbmltYXRpbmdcblxuICAgIEBhY3RpdmVUZXJtaW5hbCA9IEBjcmVhdGVUZXJtaW5hbFZpZXcoKVxuICAgIEBhY3RpdmVUZXJtaW5hbC50b2dnbGUoKVxuXG4gIGF0dGFjaDogLT5cbiAgICBAc3RhdHVzQmFyUHJvdmlkZXIuYWRkTGVmdFRpbGUoaXRlbTogdGhpcywgcHJpb3JpdHk6IDEwMClcblxuICBkZXN0cm95QWN0aXZlVGVybTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBhY3RpdmVUZXJtaW5hbD9cblxuICAgIGluZGV4ID0gQGluZGV4T2YoQGFjdGl2ZVRlcm1pbmFsKVxuICAgIEBhY3RpdmVUZXJtaW5hbC5kZXN0cm95KClcbiAgICBAYWN0aXZlVGVybWluYWwgPSBudWxsXG5cbiAgICBAYWN0aXZhdGVBZGphY2VudFRlcm1pbmFsIGluZGV4XG5cbiAgY2xvc2VBbGw6ID0+XG4gICAgZm9yIGluZGV4IGluIFtAdGVybWluYWxWaWV3cy5sZW5ndGggLi4gMF1cbiAgICAgIHZpZXcgPSBAdGVybWluYWxWaWV3c1tpbmRleF1cbiAgICAgIGlmIHZpZXc/XG4gICAgICAgIHZpZXcuZGVzdHJveSgpXG4gICAgQGFjdGl2ZVRlcm1pbmFsID0gbnVsbFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgZm9yIHZpZXcgaW4gQHRlcm1pbmFsVmlld3NcbiAgICAgIHZpZXcucHR5UHJvY2Vzcy50ZXJtaW5hdGUoKVxuICAgICAgdmlldy50ZXJtaW5hbC5kZXN0cm95KClcbiAgICBAZGV0YWNoKClcblxuICB0b2dnbGU6IC0+XG4gICAgaWYgQHRlcm1pbmFsVmlld3MubGVuZ3RoID09IDBcbiAgICAgIEBhY3RpdmVUZXJtaW5hbCA9IEBjcmVhdGVUZXJtaW5hbFZpZXcoKVxuICAgIGVsc2UgaWYgQGFjdGl2ZVRlcm1pbmFsID09IG51bGxcbiAgICAgIEBhY3RpdmVUZXJtaW5hbCA9IEB0ZXJtaW5hbFZpZXdzWzBdXG4gICAgQGFjdGl2ZVRlcm1pbmFsLnRvZ2dsZSgpXG5cbiAgc2V0U3RhdHVzQ29sb3I6IChldmVudCkgLT5cbiAgICBjb2xvciA9IGV2ZW50LnR5cGUubWF0Y2goL1xcdyskLylbMF1cbiAgICBjb2xvciA9IGF0b20uY29uZmlnLmdldChcInRlcm1pbmFsLWZ1c2lvbi5pY29uQ29sb3JzLiN7Y29sb3J9XCIpLnRvUkdCQVN0cmluZygpXG4gICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nKS5jc3MgJ2NvbG9yJywgY29sb3JcblxuICBjbGVhclN0YXR1c0NvbG9yOiAoZXZlbnQpIC0+XG4gICAgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nKS5jc3MgJ2NvbG9yJywgJydcblxuICBvbkRyYWdTdGFydDogKGV2ZW50KSA9PlxuICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEgJ3Rlcm1pbmFsLWZ1c2lvbi1wYW5lbCcsICd0cnVlJ1xuXG4gICAgZWxlbWVudCA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJylcbiAgICBlbGVtZW50LmFkZENsYXNzICdpcy1kcmFnZ2luZydcbiAgICBldmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhICdmcm9tLWluZGV4JywgZWxlbWVudC5pbmRleCgpXG5cbiAgb25EcmFnTGVhdmU6IChldmVudCkgPT5cbiAgICBAcmVtb3ZlUGxhY2Vob2xkZXIoKVxuXG4gIG9uRHJhZ0VuZDogKGV2ZW50KSA9PlxuICAgIEBjbGVhckRyb3BUYXJnZXQoKVxuXG4gIG9uRHJhZ092ZXI6IChldmVudCkgPT5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICB1bmxlc3MgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGVybWluYWwtZnVzaW9uJykgaXMgJ3RydWUnXG4gICAgICByZXR1cm5cblxuICAgIG5ld0Ryb3BUYXJnZXRJbmRleCA9IEBnZXREcm9wVGFyZ2V0SW5kZXgoZXZlbnQpXG4gICAgcmV0dXJuIHVubGVzcyBuZXdEcm9wVGFyZ2V0SW5kZXg/XG4gICAgQHJlbW92ZURyb3BUYXJnZXRDbGFzc2VzKClcbiAgICBzdGF0dXNJY29ucyA9IEBzdGF0dXNDb250YWluZXIuY2hpbGRyZW4gJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nXG5cbiAgICBpZiBuZXdEcm9wVGFyZ2V0SW5kZXggPCBzdGF0dXNJY29ucy5sZW5ndGhcbiAgICAgIGVsZW1lbnQgPSBzdGF0dXNJY29ucy5lcShuZXdEcm9wVGFyZ2V0SW5kZXgpLmFkZENsYXNzICdpcy1kcm9wLXRhcmdldCdcbiAgICAgIEBnZXRQbGFjZWhvbGRlcigpLmluc2VydEJlZm9yZShlbGVtZW50KVxuICAgIGVsc2VcbiAgICAgIGVsZW1lbnQgPSBzdGF0dXNJY29ucy5lcShuZXdEcm9wVGFyZ2V0SW5kZXggLSAxKS5hZGRDbGFzcyAnZHJvcC10YXJnZXQtaXMtYWZ0ZXInXG4gICAgICBAZ2V0UGxhY2Vob2xkZXIoKS5pbnNlcnRBZnRlcihlbGVtZW50KVxuXG4gIG9uRHJvcDogKGV2ZW50KSA9PlxuICAgIHtkYXRhVHJhbnNmZXJ9ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuICAgIHBhbmVsRXZlbnQgPSBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGVybWluYWwtZnVzaW9uLXBhbmVsJykgaXMgJ3RydWUnXG4gICAgdGFiRXZlbnQgPSBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGVybWluYWwtZnVzaW9uLXRhYicpIGlzICd0cnVlJ1xuICAgIHJldHVybiB1bmxlc3MgcGFuZWxFdmVudCBvciB0YWJFdmVudFxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICB0b0luZGV4ID0gQGdldERyb3BUYXJnZXRJbmRleChldmVudClcbiAgICBAY2xlYXJEcm9wVGFyZ2V0KClcblxuICAgIGlmIHRhYkV2ZW50XG4gICAgICBmcm9tSW5kZXggPSBwYXJzZUludChkYXRhVHJhbnNmZXIuZ2V0RGF0YSgnc29ydGFibGUtaW5kZXgnKSlcbiAgICAgIHBhbmVJbmRleCA9IHBhcnNlSW50KGRhdGFUcmFuc2Zlci5nZXREYXRhKCdmcm9tLXBhbmUtaW5kZXgnKSlcbiAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpW3BhbmVJbmRleF1cbiAgICAgIHZpZXcgPSBwYW5lLml0ZW1BdEluZGV4KGZyb21JbmRleClcbiAgICAgIHBhbmUucmVtb3ZlSXRlbSh2aWV3LCBmYWxzZSlcbiAgICAgIHZpZXcuc2hvdygpXG5cbiAgICAgIHZpZXcudG9nZ2xlVGFiVmlldygpXG4gICAgICBAdGVybWluYWxWaWV3cy5wdXNoIHZpZXdcbiAgICAgIHZpZXcub3BlbigpIGlmIHZpZXcuc3RhdHVzSWNvbi5pc0FjdGl2ZSgpXG4gICAgICBAc3RhdHVzQ29udGFpbmVyLmFwcGVuZCB2aWV3LnN0YXR1c0ljb25cbiAgICAgIGZyb21JbmRleCA9IEB0ZXJtaW5hbFZpZXdzLmxlbmd0aCAtIDFcbiAgICBlbHNlXG4gICAgICBmcm9tSW5kZXggPSBwYXJzZUludChkYXRhVHJhbnNmZXIuZ2V0RGF0YSgnZnJvbS1pbmRleCcpKVxuICAgIEB1cGRhdGVPcmRlcihmcm9tSW5kZXgsIHRvSW5kZXgpXG5cbiAgb25Ecm9wVGFiQmFyOiAoZXZlbnQsIHBhbmUpID0+XG4gICAge2RhdGFUcmFuc2Zlcn0gPSBldmVudC5vcmlnaW5hbEV2ZW50XG4gICAgcmV0dXJuIHVubGVzcyBkYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGVybWluYWwtZnVzaW9uLXBhbmVsJykgaXMgJ3RydWUnXG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBAY2xlYXJEcm9wVGFyZ2V0KClcblxuICAgIGZyb21JbmRleCA9IHBhcnNlSW50KGRhdGFUcmFuc2Zlci5nZXREYXRhKCdmcm9tLWluZGV4JykpXG4gICAgdmlldyA9IEB0ZXJtaW5hbFZpZXdzW2Zyb21JbmRleF1cbiAgICB2aWV3LmNzcyBcImhlaWdodFwiLCBcIlwiXG4gICAgdmlldy50ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiXCJcbiAgICB0YWJCYXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLnRhYi1iYXInKVxuXG4gICAgdmlldy50b2dnbGVUYWJWaWV3KClcbiAgICBAcmVtb3ZlVGVybWluYWxWaWV3IHZpZXdcbiAgICBAc3RhdHVzQ29udGFpbmVyLmNoaWxkcmVuKCkuZXEoZnJvbUluZGV4KS5kZXRhY2goKVxuICAgIHZpZXcuc3RhdHVzSWNvbi5yZW1vdmVUb29sdGlwKClcblxuICAgIHBhbmUuYWRkSXRlbSB2aWV3LCBwYW5lLmdldEl0ZW1zKCkubGVuZ3RoXG4gICAgcGFuZS5hY3RpdmF0ZUl0ZW0gdmlld1xuXG4gICAgdmlldy5mb2N1cygpXG5cbiAgY2xlYXJEcm9wVGFyZ2V0OiAtPlxuICAgIGVsZW1lbnQgPSBAZmluZCgnLmlzLWRyYWdnaW5nJylcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzICdpcy1kcmFnZ2luZydcbiAgICBAcmVtb3ZlRHJvcFRhcmdldENsYXNzZXMoKVxuICAgIEByZW1vdmVQbGFjZWhvbGRlcigpXG5cbiAgcmVtb3ZlRHJvcFRhcmdldENsYXNzZXM6IC0+XG4gICAgQHN0YXR1c0NvbnRhaW5lci5maW5kKCcuaXMtZHJvcC10YXJnZXQnKS5yZW1vdmVDbGFzcyAnaXMtZHJvcC10YXJnZXQnXG4gICAgQHN0YXR1c0NvbnRhaW5lci5maW5kKCcuZHJvcC10YXJnZXQtaXMtYWZ0ZXInKS5yZW1vdmVDbGFzcyAnZHJvcC10YXJnZXQtaXMtYWZ0ZXInXG5cbiAgZ2V0RHJvcFRhcmdldEluZGV4OiAoZXZlbnQpIC0+XG4gICAgdGFyZ2V0ID0gJChldmVudC50YXJnZXQpXG4gICAgcmV0dXJuIGlmIEBpc1BsYWNlaG9sZGVyKHRhcmdldClcblxuICAgIHN0YXR1c0ljb25zID0gQHN0YXR1c0NvbnRhaW5lci5jaGlsZHJlbignLmZ1c2lvbi10ZXJtaW5hbC1zdGF0dXMtaWNvbicpXG4gICAgZWxlbWVudCA9IHRhcmdldC5jbG9zZXN0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJylcbiAgICBlbGVtZW50ID0gc3RhdHVzSWNvbnMubGFzdCgpIGlmIGVsZW1lbnQubGVuZ3RoIGlzIDBcblxuICAgIHJldHVybiAwIHVubGVzcyBlbGVtZW50Lmxlbmd0aFxuXG4gICAgZWxlbWVudENlbnRlciA9IGVsZW1lbnQub2Zmc2V0KCkubGVmdCArIGVsZW1lbnQud2lkdGgoKSAvIDJcblxuICAgIGlmIGV2ZW50Lm9yaWdpbmFsRXZlbnQucGFnZVggPCBlbGVtZW50Q2VudGVyXG4gICAgICBzdGF0dXNJY29ucy5pbmRleChlbGVtZW50KVxuICAgIGVsc2UgaWYgZWxlbWVudC5uZXh0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJykubGVuZ3RoID4gMFxuICAgICAgc3RhdHVzSWNvbnMuaW5kZXgoZWxlbWVudC5uZXh0KCcuZnVzaW9uLXRlcm1pbmFsLXN0YXR1cy1pY29uJykpXG4gICAgZWxzZVxuICAgICAgc3RhdHVzSWNvbnMuaW5kZXgoZWxlbWVudCkgKyAxXG5cbiAgZ2V0UGxhY2Vob2xkZXI6IC0+XG4gICAgQHBsYWNlaG9sZGVyRWwgPz0gJCgnPGxpIGNsYXNzPVwicGxhY2Vob2xkZXJcIj48L2xpPicpXG5cbiAgcmVtb3ZlUGxhY2Vob2xkZXI6IC0+XG4gICAgQHBsYWNlaG9sZGVyRWw/LnJlbW92ZSgpXG4gICAgQHBsYWNlaG9sZGVyRWwgPSBudWxsXG5cbiAgaXNQbGFjZWhvbGRlcjogKGVsZW1lbnQpIC0+XG4gICAgZWxlbWVudC5pcygnLnBsYWNlaG9sZGVyJylcblxuICBpY29uQXRJbmRleDogKGluZGV4KSAtPlxuICAgIEBnZXRTdGF0dXNJY29ucygpLmVxKGluZGV4KVxuXG4gIGdldFN0YXR1c0ljb25zOiAtPlxuICAgIEBzdGF0dXNDb250YWluZXIuY2hpbGRyZW4oJy5mdXNpb24tdGVybWluYWwtc3RhdHVzLWljb24nKVxuXG4gIG1vdmVJY29uVG9JbmRleDogKGljb24sIHRvSW5kZXgpIC0+XG4gICAgZm9sbG93aW5nSWNvbiA9IEBnZXRTdGF0dXNJY29ucygpW3RvSW5kZXhdXG4gICAgY29udGFpbmVyID0gQHN0YXR1c0NvbnRhaW5lclswXVxuICAgIGlmIGZvbGxvd2luZ0ljb24/XG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGljb24sIGZvbGxvd2luZ0ljb24pXG4gICAgZWxzZVxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGljb24pXG5cbiAgbW92ZVRlcm1pbmFsVmlldzogKGZyb21JbmRleCwgdG9JbmRleCkgPT5cbiAgICBhY3RpdmVUZXJtaW5hbCA9IEBnZXRBY3RpdmVUZXJtaW5hbFZpZXcoKVxuICAgIHZpZXcgPSBAdGVybWluYWxWaWV3cy5zcGxpY2UoZnJvbUluZGV4LCAxKVswXVxuICAgIEB0ZXJtaW5hbFZpZXdzLnNwbGljZSB0b0luZGV4LCAwLCB2aWV3XG4gICAgQHNldEFjdGl2ZVRlcm1pbmFsVmlldyBhY3RpdmVUZXJtaW5hbFxuXG4gIHVwZGF0ZU9yZGVyOiAoZnJvbUluZGV4LCB0b0luZGV4KSAtPlxuICAgIHJldHVybiBpZiBmcm9tSW5kZXggaXMgdG9JbmRleFxuICAgIHRvSW5kZXgtLSBpZiBmcm9tSW5kZXggPCB0b0luZGV4XG5cbiAgICBpY29uID0gQGdldFN0YXR1c0ljb25zKCkuZXEoZnJvbUluZGV4KS5kZXRhY2goKVxuICAgIEBtb3ZlSWNvblRvSW5kZXggaWNvbi5nZXQoMCksIHRvSW5kZXhcbiAgICBAbW92ZVRlcm1pbmFsVmlldyBmcm9tSW5kZXgsIHRvSW5kZXhcbiAgICBpY29uLmFkZENsYXNzICdpbnNlcnRlZCdcbiAgICBpY29uLm9uZSAnd2Via2l0QW5pbWF0aW9uRW5kJywgLT4gaWNvbi5yZW1vdmVDbGFzcygnaW5zZXJ0ZWQnKVxuIl19
