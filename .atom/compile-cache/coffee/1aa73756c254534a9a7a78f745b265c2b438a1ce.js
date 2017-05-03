(function() {
  var $, Disposable, GuideView, Reporter, ScrollView, commandPaletteKeybinding, menuName, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Disposable = require('atom').Disposable;

  ref = require('atom-space-pen-views'), $ = ref.$, ScrollView = ref.ScrollView;

  Reporter = require('./reporter');

  if (process.platform === 'darwin') {
    commandPaletteKeybinding = 'cmd-shift-p';
    menuName = 'Atom';
  } else if (process.platform === 'linux') {
    commandPaletteKeybinding = 'ctrl-shift-p';
    menuName = 'Edit';
  } else {
    commandPaletteKeybinding = 'ctrl-shift-p';
    menuName = 'File';
  }

  module.exports = GuideView = (function(superClass) {
    extend(GuideView, superClass);

    function GuideView() {
      return GuideView.__super__.constructor.apply(this, arguments);
    }

    GuideView.content = function() {
      return this.div({
        "class": 'welcome is-guide'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'welcome-container'
          }, function() {
            return _this.section({
              "class": 'welcome-panel'
            }, function() {
              _this.h1({
                "class": 'welcome-title'
              }, 'Get to know Atom!');
              _this.details({
                "class": 'welcome-card',
                'data-section': 'project'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-repo'
                }, function() {
                  return _this.raw('Open a <span class="welcome-highlight">Project</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/project.svg'
                    });
                  });
                  _this.p('In Atom you can open individual files or a whole folder as a\nproject. Opening a folder will add a tree view to the editor\nwhere you can browse all the files.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'projectButton',
                      "class": 'btn btn-primary'
                    }, 'Open a Project');
                  });
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can also open projects from\nthe menu, keyboard shortcut or by dragging a folder onto the\nAtom dock icon.');
                  });
                });
              });
              _this.details({
                "class": 'welcome-card',
                'data-section': 'packages'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-package'
                }, function() {
                  return _this.raw('Install a <span class="welcome-highlight">Package</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/package.svg'
                    });
                  });
                  _this.p('One of the best things about Atom is the package ecosystem.\nInstalling packages adds new features and functionality you\ncan use to make the editor suit your needs. Let\'s install one.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'packagesButton',
                      "class": 'btn btn-primary'
                    }, 'Open Installer');
                  });
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can install new packages from the settings.');
                  });
                });
              });
              _this.details({
                "class": 'welcome-card',
                'data-section': 'themes'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-paintcan'
                }, function() {
                  return _this.raw('Choose a <span class="welcome-highlight">Theme</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/theme.svg'
                    });
                  });
                  _this.p('Atom comes with preinstalled themes. Let\'s try a few.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'themesButton',
                      "class": 'btn btn-primary'
                    }, 'Open the theme picker');
                  });
                  _this.p('You can also install themes created by the Atom community. To\ninstall new themes, click on "+ Install" and switch the toggle\nto "themes".');
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can switch themes from the settings.');
                  });
                });
              });
              _this.details({
                "class": 'welcome-card',
                'data-section': 'styling'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-paintcan'
                }, function() {
                  return _this.raw('Customize the <span class="welcome-highlight">Styling</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/code.svg'
                    });
                  });
                  _this.p('You can customize almost anything by adding your own CSS/LESS.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'stylingButton',
                      "class": 'btn btn-primary'
                    }, 'Open your Stylesheet');
                  });
                  _this.p('Now uncomment some of the examples or try your own.');
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can open your stylesheet from Menu > ' + menuName + '.');
                  });
                });
              });
              _this.details({
                "class": 'welcome-card',
                'data-section': 'init-script'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-code'
                }, function() {
                  return _this.raw('Hack on the <span class="welcome-highlight">Init Script</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/code.svg'
                    });
                  });
                  _this.p('The init script is a bit of JavaScript or CoffeeScript run at\nstartup. You can use it to quickly change the behaviour of\nAtom.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'initScriptButton',
                      "class": 'btn btn-primary'
                    }, 'Open your Init Script');
                  });
                  _this.p('Uncomment some of the examples or try out your own.');
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can open your init script from Menu > ' + menuName + '.');
                  });
                });
              });
              _this.details({
                "class": 'welcome-card',
                'data-section': 'snippets'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-code'
                }, function() {
                  return _this.raw('Add a <span class="welcome-highlight">Snippet</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/code.svg'
                    });
                  });
                  _this.p('Atom snippets allow you to enter a simple prefix in the editor\nand hit tab to expand the prefix into a larger code block with\ntemplated values.');
                  _this.p(function() {
                    return _this.button({
                      outlet: 'snippetsButton',
                      "class": 'btn btn-primary'
                    }, 'Open your Snippets');
                  });
                  _this.p(function() {
                    return _this.raw('In your snippets file, type <code>snip</code> then hit\n<code>tab</code>. The <code>snip</code> snippet will expand\nto create a snippet!');
                  });
                  return _this.p({
                    "class": 'welcome-note'
                  }, function() {
                    return _this.raw('<strong>Next time:</strong> You can open your snippets in Menu > ' + menuName + '.');
                  });
                });
              });
              return _this.details({
                "class": 'welcome-card',
                'data-section': 'shortcuts'
              }, function() {
                _this.summary({
                  "class": 'welcome-summary icon icon-keyboard'
                }, function() {
                  return _this.raw('Learn <span class="welcome-highlight">Keyboard Shortcuts</span>');
                });
                return _this.div({
                  "class": 'welcome-detail'
                }, function() {
                  _this.p(function() {
                    return _this.img({
                      "class": 'welcome-img',
                      src: 'atom://welcome/assets/shortcut.svg'
                    });
                  });
                  _this.p(function() {
                    _this.raw('If you only remember one keyboard shortcut make it ');
                    _this.kbd({
                      "class": 'welcome-key'
                    }, commandPaletteKeybinding);
                    return _this.raw('. This keystroke toggles the command palette, which lists every Atom command. It\'s a good way to learn more shortcuts. Yes, you can try it now!');
                  });
                  return _this.p(function() {
                    _this.raw('If you want to use these guides again use the command palette ');
                    _this.kbd({
                      "class": 'welcome-key'
                    }, commandPaletteKeybinding);
                    _this.raw(' and search for ');
                    _this.span({
                      "class": 'text-highlight'
                    }, 'Welcome');
                    return _this.raw('.');
                  });
                });
              });
            });
          });
        };
      })(this));
    };

    GuideView.prototype.initialize = function(arg) {
      var i, len, openSections, section;
      openSections = arg.openSections;
      if (openSections != null) {
        for (i = 0, len = openSections.length; i < len; i++) {
          section = openSections[i];
          this.openSection(section);
        }
      }
      this.projectButton.on('click', function() {
        Reporter.sendEvent('clicked-project-cta');
        return atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open');
      });
      this.packagesButton.on('click', function() {
        Reporter.sendEvent('clicked-packages-cta');
        return atom.workspace.open('atom://config/install', {
          split: 'left'
        });
      });
      this.themesButton.on('click', function() {
        Reporter.sendEvent('clicked-themes-cta');
        return atom.workspace.open('atom://config/themes', {
          split: 'left'
        });
      });
      this.stylingButton.on('click', function() {
        Reporter.sendEvent('clicked-styling-cta');
        return atom.workspace.open('atom://.atom/stylesheet', {
          split: 'left'
        });
      });
      this.initScriptButton.on('click', function() {
        Reporter.sendEvent('clicked-init-script-cta');
        return atom.workspace.open('atom://.atom/init-script', {
          split: 'left'
        });
      });
      this.snippetsButton.on('click', function() {
        Reporter.sendEvent('clicked-snippets-cta');
        return atom.workspace.open('atom://.atom/snippets', {
          split: 'left'
        });
      });
      return this.on('click', 'summary', function() {
        var action, detail, isOpen, sectionName;
        detail = $(this).parent();
        sectionName = detail.attr('data-section');
        isOpen = !!detail.attr('open');
        action = isOpen ? 'collapse' : 'expand';
        return Reporter.sendEvent(action + "-" + sectionName + "-section");
      });
    };

    GuideView.deserialize = function(options) {
      if (options == null) {
        options = {};
      }
      return new GuideView(options);
    };

    GuideView.prototype.serialize = function() {
      return {
        deserializer: this.constructor.name,
        openSections: this.getOpenSections(),
        uri: this.getURI()
      };
    };

    GuideView.prototype.getURI = function() {
      return this.uri;
    };

    GuideView.prototype.getTitle = function() {
      return "Welcome Guide";
    };

    GuideView.prototype.onDidChangeTitle = function() {
      return new Disposable(function() {});
    };

    GuideView.prototype.onDidChangeModified = function() {
      return new Disposable(function() {});
    };

    GuideView.prototype.isEqual = function(other) {
      return other instanceof GuideView;
    };

    GuideView.prototype.getOpenSections = function() {
      var i, len, openSections, results, section;
      openSections = this.find('details[open]');
      results = [];
      for (i = 0, len = openSections.length; i < len; i++) {
        section = openSections[i];
        results.push(section.getAttribute('data-section'));
      }
      return results;
    };

    GuideView.prototype.openSection = function(section) {
      return this.find("details[data-section=\"" + section + "\"]").attr('open', 'open');
    };

    return GuideView;

  })(ScrollView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy93ZWxjb21lL2xpYi9ndWlkZS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUZBQUE7SUFBQTs7O0VBQUMsYUFBYyxPQUFBLENBQVEsTUFBUjs7RUFDZixNQUFrQixPQUFBLENBQVEsc0JBQVIsQ0FBbEIsRUFBQyxTQUFELEVBQUk7O0VBQ0osUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLElBQUcsT0FBTyxDQUFDLFFBQVIsS0FBb0IsUUFBdkI7SUFDRSx3QkFBQSxHQUEyQjtJQUMzQixRQUFBLEdBQVcsT0FGYjtHQUFBLE1BR0ssSUFBRyxPQUFPLENBQUMsUUFBUixLQUFvQixPQUF2QjtJQUNILHdCQUFBLEdBQTJCO0lBQzNCLFFBQUEsR0FBVyxPQUZSO0dBQUEsTUFBQTtJQUlILHdCQUFBLEdBQTJCO0lBQzNCLFFBQUEsR0FBVyxPQUxSOzs7RUFRTCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osU0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sa0JBQVA7T0FBTCxFQUFnQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzlCLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1dBQUwsRUFBaUMsU0FBQTttQkFDL0IsS0FBQyxDQUFBLE9BQUQsQ0FBUztjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDthQUFULEVBQWlDLFNBQUE7Y0FDL0IsS0FBQyxDQUFBLEVBQUQsQ0FBSTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGVBQVA7ZUFBSixFQUE0QixtQkFBNUI7Y0FHQSxLQUFDLENBQUEsT0FBRCxDQUFTO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsY0FBQSxFQUFnQixTQUF2QztlQUFULEVBQTJELFNBQUE7Z0JBQ3pELEtBQUMsQ0FBQSxPQUFELENBQVM7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtpQkFBVCxFQUFrRCxTQUFBO3lCQUNoRCxLQUFDLENBQUEsR0FBRCxDQUFLLHVEQUFMO2dCQURnRCxDQUFsRDt1QkFFQSxLQUFDLENBQUEsR0FBRCxDQUFLO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7aUJBQUwsRUFBOEIsU0FBQTtrQkFDNUIsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBOzJCQUNELEtBQUMsQ0FBQSxHQUFELENBQUs7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3NCQUFzQixHQUFBLEVBQUssbUNBQTNCO3FCQUFMO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxpS0FBSDtrQkFLQSxLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLE1BQUQsQ0FBUTtzQkFBQSxNQUFBLEVBQVEsZUFBUjtzQkFBeUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBaEM7cUJBQVIsRUFBMkQsZ0JBQTNEO2tCQURDLENBQUg7eUJBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7bUJBQUgsRUFBMEIsU0FBQTsyQkFDeEIsS0FBQyxDQUFBLEdBQUQsQ0FBSyw0SUFBTDtrQkFEd0IsQ0FBMUI7Z0JBVjRCLENBQTlCO2NBSHlELENBQTNEO2NBcUJBLEtBQUMsQ0FBQSxPQUFELENBQVM7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixjQUFBLEVBQWdCLFVBQXZDO2VBQVQsRUFBNEQsU0FBQTtnQkFDMUQsS0FBQyxDQUFBLE9BQUQsQ0FBUztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1DQUFQO2lCQUFULEVBQXFELFNBQUE7eUJBQ25ELEtBQUMsQ0FBQSxHQUFELENBQUssMERBQUw7Z0JBRG1ELENBQXJEO3VCQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtpQkFBTCxFQUE4QixTQUFBO2tCQUM1QixLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLEdBQUQsQ0FBSztzQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7c0JBQXNCLEdBQUEsRUFBSyxtQ0FBM0I7cUJBQUw7a0JBREMsQ0FBSDtrQkFFQSxLQUFDLENBQUEsQ0FBRCxDQUFHLDJMQUFIO2tCQUtBLEtBQUMsQ0FBQSxDQUFELENBQUcsU0FBQTsyQkFDRCxLQUFDLENBQUEsTUFBRCxDQUFRO3NCQUFBLE1BQUEsRUFBUSxnQkFBUjtzQkFBMEIsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBakM7cUJBQVIsRUFBNEQsZ0JBQTVEO2tCQURDLENBQUg7eUJBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7bUJBQUgsRUFBMEIsU0FBQTsyQkFDeEIsS0FBQyxDQUFBLEdBQUQsQ0FBSyw2RUFBTDtrQkFEd0IsQ0FBMUI7Z0JBVjRCLENBQTlCO2NBSDBELENBQTVEO2NBaUJBLEtBQUMsQ0FBQSxPQUFELENBQVM7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixjQUFBLEVBQWdCLFFBQXZDO2VBQVQsRUFBMEQsU0FBQTtnQkFDeEQsS0FBQyxDQUFBLE9BQUQsQ0FBUztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9DQUFQO2lCQUFULEVBQXNELFNBQUE7eUJBQ3BELEtBQUMsQ0FBQSxHQUFELENBQUssdURBQUw7Z0JBRG9ELENBQXREO3VCQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtpQkFBTCxFQUE4QixTQUFBO2tCQUM1QixLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLEdBQUQsQ0FBSztzQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7c0JBQXNCLEdBQUEsRUFBSyxpQ0FBM0I7cUJBQUw7a0JBREMsQ0FBSDtrQkFFQSxLQUFDLENBQUEsQ0FBRCxDQUFHLHdEQUFIO2tCQUNBLEtBQUMsQ0FBQSxDQUFELENBQUcsU0FBQTsyQkFDRCxLQUFDLENBQUEsTUFBRCxDQUFRO3NCQUFBLE1BQUEsRUFBUSxjQUFSO3NCQUF3QixDQUFBLEtBQUEsQ0FBQSxFQUFPLGlCQUEvQjtxQkFBUixFQUEwRCx1QkFBMUQ7a0JBREMsQ0FBSDtrQkFFQSxLQUFDLENBQUEsQ0FBRCxDQUFHLDZJQUFIO3lCQUtBLEtBQUMsQ0FBQSxDQUFELENBQUc7b0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO21CQUFILEVBQTBCLFNBQUE7MkJBQ3hCLEtBQUMsQ0FBQSxHQUFELENBQUssc0VBQUw7a0JBRHdCLENBQTFCO2dCQVg0QixDQUE5QjtjQUh3RCxDQUExRDtjQWtCQSxLQUFDLENBQUEsT0FBRCxDQUFTO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsY0FBQSxFQUFnQixTQUF2QztlQUFULEVBQTJELFNBQUE7Z0JBQ3pELEtBQUMsQ0FBQSxPQUFELENBQVM7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQ0FBUDtpQkFBVCxFQUFzRCxTQUFBO3lCQUNwRCxLQUFDLENBQUEsR0FBRCxDQUFLLDhEQUFMO2dCQURvRCxDQUF0RDt1QkFFQSxLQUFDLENBQUEsR0FBRCxDQUFLO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7aUJBQUwsRUFBOEIsU0FBQTtrQkFDNUIsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBOzJCQUNELEtBQUMsQ0FBQSxHQUFELENBQUs7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3NCQUFzQixHQUFBLEVBQUssZ0NBQTNCO3FCQUFMO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxnRUFBSDtrQkFDQSxLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLE1BQUQsQ0FBUTtzQkFBQSxNQUFBLEVBQVEsZUFBUjtzQkFBeUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBaEM7cUJBQVIsRUFBMkQsc0JBQTNEO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxxREFBSDt5QkFDQSxLQUFDLENBQUEsQ0FBRCxDQUFHO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDttQkFBSCxFQUEwQixTQUFBOzJCQUN4QixLQUFDLENBQUEsR0FBRCxDQUFLLHVFQUFBLEdBQTBFLFFBQTFFLEdBQXFGLEdBQTFGO2tCQUR3QixDQUExQjtnQkFQNEIsQ0FBOUI7Y0FIeUQsQ0FBM0Q7Y0FjQSxLQUFDLENBQUEsT0FBRCxDQUFTO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsY0FBQSxFQUFnQixhQUF2QztlQUFULEVBQStELFNBQUE7Z0JBQzdELEtBQUMsQ0FBQSxPQUFELENBQVM7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtpQkFBVCxFQUFrRCxTQUFBO3lCQUNoRCxLQUFDLENBQUEsR0FBRCxDQUFLLGdFQUFMO2dCQURnRCxDQUFsRDt1QkFFQSxLQUFDLENBQUEsR0FBRCxDQUFLO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7aUJBQUwsRUFBOEIsU0FBQTtrQkFDNUIsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBOzJCQUNELEtBQUMsQ0FBQSxHQUFELENBQUs7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3NCQUFzQixHQUFBLEVBQUssZ0NBQTNCO3FCQUFMO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxrSUFBSDtrQkFLQSxLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLE1BQUQsQ0FBUTtzQkFBQSxNQUFBLEVBQVEsa0JBQVI7c0JBQTRCLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQW5DO3FCQUFSLEVBQThELHVCQUE5RDtrQkFEQyxDQUFIO2tCQUVBLEtBQUMsQ0FBQSxDQUFELENBQUcscURBQUg7eUJBQ0EsS0FBQyxDQUFBLENBQUQsQ0FBRztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGNBQVA7bUJBQUgsRUFBMEIsU0FBQTsyQkFDeEIsS0FBQyxDQUFBLEdBQUQsQ0FBSyx3RUFBQSxHQUEyRSxRQUEzRSxHQUFzRixHQUEzRjtrQkFEd0IsQ0FBMUI7Z0JBWDRCLENBQTlCO2NBSDZELENBQS9EO2NBa0JBLEtBQUMsQ0FBQSxPQUFELENBQVM7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO2dCQUF1QixjQUFBLEVBQWdCLFVBQXZDO2VBQVQsRUFBNEQsU0FBQTtnQkFDMUQsS0FBQyxDQUFBLE9BQUQsQ0FBUztrQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdDQUFQO2lCQUFULEVBQWtELFNBQUE7eUJBQ2hELEtBQUMsQ0FBQSxHQUFELENBQUssc0RBQUw7Z0JBRGdELENBQWxEO3VCQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtpQkFBTCxFQUE4QixTQUFBO2tCQUM1QixLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7MkJBQ0QsS0FBQyxDQUFBLEdBQUQsQ0FBSztzQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7c0JBQXNCLEdBQUEsRUFBSyxnQ0FBM0I7cUJBQUw7a0JBREMsQ0FBSDtrQkFFQSxLQUFDLENBQUEsQ0FBRCxDQUFHLG1KQUFIO2tCQUtBLEtBQUMsQ0FBQSxDQUFELENBQUcsU0FBQTsyQkFDRCxLQUFDLENBQUEsTUFBRCxDQUFRO3NCQUFBLE1BQUEsRUFBUSxnQkFBUjtzQkFBMEIsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBakM7cUJBQVIsRUFBNEQsb0JBQTVEO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBOzJCQUNELEtBQUMsQ0FBQSxHQUFELENBQUssMklBQUw7a0JBREMsQ0FBSDt5QkFNQSxLQUFDLENBQUEsQ0FBRCxDQUFHO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDttQkFBSCxFQUEwQixTQUFBOzJCQUN4QixLQUFDLENBQUEsR0FBRCxDQUFLLG1FQUFBLEdBQXNFLFFBQXRFLEdBQWlGLEdBQXRGO2tCQUR3QixDQUExQjtnQkFoQjRCLENBQTlCO2NBSDBELENBQTVEO3FCQXVCQSxLQUFDLENBQUEsT0FBRCxDQUFTO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtnQkFBdUIsY0FBQSxFQUFnQixXQUF2QztlQUFULEVBQTZELFNBQUE7Z0JBQzNELEtBQUMsQ0FBQSxPQUFELENBQVM7a0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQ0FBUDtpQkFBVCxFQUFzRCxTQUFBO3lCQUNwRCxLQUFDLENBQUEsR0FBRCxDQUFLLGlFQUFMO2dCQURvRCxDQUF0RDt1QkFFQSxLQUFDLENBQUEsR0FBRCxDQUFLO2tCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7aUJBQUwsRUFBOEIsU0FBQTtrQkFDNUIsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBOzJCQUNELEtBQUMsQ0FBQSxHQUFELENBQUs7c0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUFQO3NCQUFzQixHQUFBLEVBQUssb0NBQTNCO3FCQUFMO2tCQURDLENBQUg7a0JBRUEsS0FBQyxDQUFBLENBQUQsQ0FBRyxTQUFBO29CQUNELEtBQUMsQ0FBQSxHQUFELENBQUsscURBQUw7b0JBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztzQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7cUJBQUwsRUFBMkIsd0JBQTNCOzJCQUNBLEtBQUMsQ0FBQSxHQUFELENBQUssa0pBQUw7a0JBSEMsQ0FBSDt5QkFJQSxLQUFDLENBQUEsQ0FBRCxDQUFHLFNBQUE7b0JBQ0QsS0FBQyxDQUFBLEdBQUQsQ0FBSyxnRUFBTDtvQkFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtxQkFBTCxFQUEyQix3QkFBM0I7b0JBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSyxrQkFBTDtvQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNO3NCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0JBQVA7cUJBQU4sRUFBK0IsU0FBL0I7MkJBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSyxHQUFMO2tCQUxDLENBQUg7Z0JBUDRCLENBQTlCO2NBSDJELENBQTdEO1lBbkgrQixDQUFqQztVQUQrQixDQUFqQztRQUQ4QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEM7SUFEUTs7d0JBdUlWLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBO01BRFksZUFBRDtNQUNYLElBQXVELG9CQUF2RDtBQUFDLGFBQUEsOENBQUE7O1VBQUEsSUFBQyxDQUFBLFdBQUQsQ0FBYSxPQUFiO0FBQUEsU0FBRDs7TUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLEVBQWYsQ0FBa0IsT0FBbEIsRUFBMkIsU0FBQTtRQUN6QixRQUFRLENBQUMsU0FBVCxDQUFtQixxQkFBbkI7ZUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQWQsQ0FBdUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUksQ0FBQyxTQUF4QixDQUF2QixFQUEyRCxrQkFBM0Q7TUFGeUIsQ0FBM0I7TUFHQSxJQUFDLENBQUEsY0FBYyxDQUFDLEVBQWhCLENBQW1CLE9BQW5CLEVBQTRCLFNBQUE7UUFDMUIsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsc0JBQW5CO2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHVCQUFwQixFQUE2QztVQUFBLEtBQUEsRUFBTyxNQUFQO1NBQTdDO01BRjBCLENBQTVCO01BR0EsSUFBQyxDQUFBLFlBQVksQ0FBQyxFQUFkLENBQWlCLE9BQWpCLEVBQTBCLFNBQUE7UUFDeEIsUUFBUSxDQUFDLFNBQVQsQ0FBbUIsb0JBQW5CO2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHNCQUFwQixFQUE0QztVQUFBLEtBQUEsRUFBTyxNQUFQO1NBQTVDO01BRndCLENBQTFCO01BR0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxFQUFmLENBQWtCLE9BQWxCLEVBQTJCLFNBQUE7UUFDekIsUUFBUSxDQUFDLFNBQVQsQ0FBbUIscUJBQW5CO2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLHlCQUFwQixFQUErQztVQUFBLEtBQUEsRUFBTyxNQUFQO1NBQS9DO01BRnlCLENBQTNCO01BR0EsSUFBQyxDQUFBLGdCQUFnQixDQUFDLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFNBQUE7UUFDNUIsUUFBUSxDQUFDLFNBQVQsQ0FBbUIseUJBQW5CO2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLDBCQUFwQixFQUFnRDtVQUFBLEtBQUEsRUFBTyxNQUFQO1NBQWhEO01BRjRCLENBQTlCO01BR0EsSUFBQyxDQUFBLGNBQWMsQ0FBQyxFQUFoQixDQUFtQixPQUFuQixFQUE0QixTQUFBO1FBQzFCLFFBQVEsQ0FBQyxTQUFULENBQW1CLHNCQUFuQjtlQUNBLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQix1QkFBcEIsRUFBNkM7VUFBQSxLQUFBLEVBQU8sTUFBUDtTQUE3QztNQUYwQixDQUE1QjthQUlBLElBQUMsQ0FBQSxFQUFELENBQUksT0FBSixFQUFhLFNBQWIsRUFBd0IsU0FBQTtBQUN0QixZQUFBO1FBQUEsTUFBQSxHQUFTLENBQUEsQ0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFSLENBQUE7UUFDVCxXQUFBLEdBQWMsTUFBTSxDQUFDLElBQVAsQ0FBWSxjQUFaO1FBQ2QsTUFBQSxHQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVo7UUFDWCxNQUFBLEdBQVksTUFBSCxHQUFlLFVBQWYsR0FBK0I7ZUFDeEMsUUFBUSxDQUFDLFNBQVQsQ0FBc0IsTUFBRCxHQUFRLEdBQVIsR0FBVyxXQUFYLEdBQXVCLFVBQTVDO01BTHNCLENBQXhCO0lBdEJVOztJQTZCWixTQUFDLENBQUEsV0FBRCxHQUFjLFNBQUMsT0FBRDs7UUFBQyxVQUFROzthQUNqQixJQUFBLFNBQUEsQ0FBVSxPQUFWO0lBRFE7O3dCQUdkLFNBQUEsR0FBVyxTQUFBO2FBQ1Q7UUFBQSxZQUFBLEVBQWMsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUEzQjtRQUNBLFlBQUEsRUFBYyxJQUFDLENBQUEsZUFBRCxDQUFBLENBRGQ7UUFFQSxHQUFBLEVBQUssSUFBQyxDQUFBLE1BQUQsQ0FBQSxDQUZMOztJQURTOzt3QkFLWCxNQUFBLEdBQVEsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKOzt3QkFFUixRQUFBLEdBQVUsU0FBQTthQUFHO0lBQUg7O3dCQUVWLGdCQUFBLEdBQWtCLFNBQUE7YUFBTyxJQUFBLFVBQUEsQ0FBVyxTQUFBLEdBQUEsQ0FBWDtJQUFQOzt3QkFDbEIsbUJBQUEsR0FBcUIsU0FBQTthQUFPLElBQUEsVUFBQSxDQUFXLFNBQUEsR0FBQSxDQUFYO0lBQVA7O3dCQUVyQixPQUFBLEdBQVMsU0FBQyxLQUFEO2FBQ1AsS0FBQSxZQUFpQjtJQURWOzt3QkFHVCxlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsWUFBQSxHQUFlLElBQUMsQ0FBQSxJQUFELENBQU0sZUFBTjtBQUNmO1dBQUEsOENBQUE7O3FCQUNFLE9BQU8sQ0FBQyxZQUFSLENBQXFCLGNBQXJCO0FBREY7O0lBRmU7O3dCQUtqQixXQUFBLEdBQWEsU0FBQyxPQUFEO2FBQ1gsSUFBQyxDQUFBLElBQUQsQ0FBTSx5QkFBQSxHQUEwQixPQUExQixHQUFrQyxLQUF4QyxDQUE2QyxDQUFDLElBQTlDLENBQW1ELE1BQW5ELEVBQTJELE1BQTNEO0lBRFc7Ozs7S0E1TFM7QUFoQnhCIiwic291cmNlc0NvbnRlbnQiOlsie0Rpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskLCBTY3JvbGxWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuUmVwb3J0ZXIgPSByZXF1aXJlICcuL3JlcG9ydGVyJ1xuXG5pZiBwcm9jZXNzLnBsYXRmb3JtIGlzICdkYXJ3aW4nXG4gIGNvbW1hbmRQYWxldHRlS2V5YmluZGluZyA9ICdjbWQtc2hpZnQtcCdcbiAgbWVudU5hbWUgPSAnQXRvbSdcbmVsc2UgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnbGludXgnXG4gIGNvbW1hbmRQYWxldHRlS2V5YmluZGluZyA9ICdjdHJsLXNoaWZ0LXAnXG4gIG1lbnVOYW1lID0gJ0VkaXQnXG5lbHNlXG4gIGNvbW1hbmRQYWxldHRlS2V5YmluZGluZyA9ICdjdHJsLXNoaWZ0LXAnXG4gIG1lbnVOYW1lID0gJ0ZpbGUnXG5cblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR3VpZGVWaWV3IGV4dGVuZHMgU2Nyb2xsVmlld1xuICBAY29udGVudDogLT5cbiAgICBAZGl2IGNsYXNzOiAnd2VsY29tZSBpcy1ndWlkZScsID0+XG4gICAgICBAZGl2IGNsYXNzOiAnd2VsY29tZS1jb250YWluZXInLCA9PlxuICAgICAgICBAc2VjdGlvbiBjbGFzczogJ3dlbGNvbWUtcGFuZWwnLCA9PlxuICAgICAgICAgIEBoMSBjbGFzczogJ3dlbGNvbWUtdGl0bGUnLCAnR2V0IHRvIGtub3cgQXRvbSEnXG5cbiAgICAgICAgICAjIFByb2plY3RcbiAgICAgICAgICBAZGV0YWlscyBjbGFzczogJ3dlbGNvbWUtY2FyZCcsICdkYXRhLXNlY3Rpb24nOiAncHJvamVjdCcsID0+XG4gICAgICAgICAgICBAc3VtbWFyeSBjbGFzczogJ3dlbGNvbWUtc3VtbWFyeSBpY29uIGljb24tcmVwbycsID0+XG4gICAgICAgICAgICAgIEByYXcgJ09wZW4gYSA8c3BhbiBjbGFzcz1cIndlbGNvbWUtaGlnaGxpZ2h0XCI+UHJvamVjdDwvc3Bhbj4nXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnd2VsY29tZS1kZXRhaWwnLCA9PlxuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEBpbWcgY2xhc3M6ICd3ZWxjb21lLWltZycsIHNyYzogJ2F0b206Ly93ZWxjb21lL2Fzc2V0cy9wcm9qZWN0LnN2ZydcbiAgICAgICAgICAgICAgQHAgJycnXG4gICAgICAgICAgICAgICAgICBJbiBBdG9tIHlvdSBjYW4gb3BlbiBpbmRpdmlkdWFsIGZpbGVzIG9yIGEgd2hvbGUgZm9sZGVyIGFzIGFcbiAgICAgICAgICAgICAgICAgIHByb2plY3QuIE9wZW5pbmcgYSBmb2xkZXIgd2lsbCBhZGQgYSB0cmVlIHZpZXcgdG8gdGhlIGVkaXRvclxuICAgICAgICAgICAgICAgICAgd2hlcmUgeW91IGNhbiBicm93c2UgYWxsIHRoZSBmaWxlcy5cbiAgICAgICAgICAgICAgICAnJydcbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3Byb2plY3RCdXR0b24nLCBjbGFzczogJ2J0biBidG4tcHJpbWFyeScsICdPcGVuIGEgUHJvamVjdCdcbiAgICAgICAgICAgICAgQHAgY2xhc3M6ICd3ZWxjb21lLW5vdGUnLCA9PlxuICAgICAgICAgICAgICAgIEByYXcgJycnXG4gICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+TmV4dCB0aW1lOjwvc3Ryb25nPiBZb3UgY2FuIGFsc28gb3BlbiBwcm9qZWN0cyBmcm9tXG4gICAgICAgICAgICAgICAgICAgIHRoZSBtZW51LCBrZXlib2FyZCBzaG9ydGN1dCBvciBieSBkcmFnZ2luZyBhIGZvbGRlciBvbnRvIHRoZVxuICAgICAgICAgICAgICAgICAgICBBdG9tIGRvY2sgaWNvbi5cbiAgICAgICAgICAgICAgICAgICcnJ1xuXG4gICAgICAgICAgIyBQYWNrYWdlc1xuICAgICAgICAgIEBkZXRhaWxzIGNsYXNzOiAnd2VsY29tZS1jYXJkJywgJ2RhdGEtc2VjdGlvbic6ICdwYWNrYWdlcycsID0+XG4gICAgICAgICAgICBAc3VtbWFyeSBjbGFzczogJ3dlbGNvbWUtc3VtbWFyeSBpY29uIGljb24tcGFja2FnZScsID0+XG4gICAgICAgICAgICAgIEByYXcgJ0luc3RhbGwgYSA8c3BhbiBjbGFzcz1cIndlbGNvbWUtaGlnaGxpZ2h0XCI+UGFja2FnZTwvc3Bhbj4nXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnd2VsY29tZS1kZXRhaWwnLCA9PlxuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEBpbWcgY2xhc3M6ICd3ZWxjb21lLWltZycsIHNyYzogJ2F0b206Ly93ZWxjb21lL2Fzc2V0cy9wYWNrYWdlLnN2ZydcbiAgICAgICAgICAgICAgQHAgJycnXG4gICAgICAgICAgICAgICAgICBPbmUgb2YgdGhlIGJlc3QgdGhpbmdzIGFib3V0IEF0b20gaXMgdGhlIHBhY2thZ2UgZWNvc3lzdGVtLlxuICAgICAgICAgICAgICAgICAgSW5zdGFsbGluZyBwYWNrYWdlcyBhZGRzIG5ldyBmZWF0dXJlcyBhbmQgZnVuY3Rpb25hbGl0eSB5b3VcbiAgICAgICAgICAgICAgICAgIGNhbiB1c2UgdG8gbWFrZSB0aGUgZWRpdG9yIHN1aXQgeW91ciBuZWVkcy4gTGV0J3MgaW5zdGFsbCBvbmUuXG4gICAgICAgICAgICAgICAgJycnXG4gICAgICAgICAgICAgIEBwID0+XG4gICAgICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdwYWNrYWdlc0J1dHRvbicsIGNsYXNzOiAnYnRuIGJ0bi1wcmltYXJ5JywgJ09wZW4gSW5zdGFsbGVyJ1xuICAgICAgICAgICAgICBAcCBjbGFzczogJ3dlbGNvbWUtbm90ZScsID0+XG4gICAgICAgICAgICAgICAgQHJhdyAnPHN0cm9uZz5OZXh0IHRpbWU6PC9zdHJvbmc+IFlvdSBjYW4gaW5zdGFsbCBuZXcgcGFja2FnZXMgZnJvbSB0aGUgc2V0dGluZ3MuJ1xuXG4gICAgICAgICAgIyBUaGVtZXNcbiAgICAgICAgICBAZGV0YWlscyBjbGFzczogJ3dlbGNvbWUtY2FyZCcsICdkYXRhLXNlY3Rpb24nOiAndGhlbWVzJywgPT5cbiAgICAgICAgICAgIEBzdW1tYXJ5IGNsYXNzOiAnd2VsY29tZS1zdW1tYXJ5IGljb24gaWNvbi1wYWludGNhbicsID0+XG4gICAgICAgICAgICAgIEByYXcgJ0Nob29zZSBhIDxzcGFuIGNsYXNzPVwid2VsY29tZS1oaWdobGlnaHRcIj5UaGVtZTwvc3Bhbj4nXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnd2VsY29tZS1kZXRhaWwnLCA9PlxuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEBpbWcgY2xhc3M6ICd3ZWxjb21lLWltZycsIHNyYzogJ2F0b206Ly93ZWxjb21lL2Fzc2V0cy90aGVtZS5zdmcnXG4gICAgICAgICAgICAgIEBwICcnJ0F0b20gY29tZXMgd2l0aCBwcmVpbnN0YWxsZWQgdGhlbWVzLiBMZXQncyB0cnkgYSBmZXcuJycnXG4gICAgICAgICAgICAgIEBwID0+XG4gICAgICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICd0aGVtZXNCdXR0b24nLCBjbGFzczogJ2J0biBidG4tcHJpbWFyeScsICdPcGVuIHRoZSB0aGVtZSBwaWNrZXInXG4gICAgICAgICAgICAgIEBwICcnJ1xuICAgICAgICAgICAgICAgICAgWW91IGNhbiBhbHNvIGluc3RhbGwgdGhlbWVzIGNyZWF0ZWQgYnkgdGhlIEF0b20gY29tbXVuaXR5LiBUb1xuICAgICAgICAgICAgICAgICAgaW5zdGFsbCBuZXcgdGhlbWVzLCBjbGljayBvbiBcIisgSW5zdGFsbFwiIGFuZCBzd2l0Y2ggdGhlIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgdG8gXCJ0aGVtZXNcIi5cbiAgICAgICAgICAgICAgICAnJydcbiAgICAgICAgICAgICAgQHAgY2xhc3M6ICd3ZWxjb21lLW5vdGUnLCA9PlxuICAgICAgICAgICAgICAgIEByYXcgJzxzdHJvbmc+TmV4dCB0aW1lOjwvc3Ryb25nPiBZb3UgY2FuIHN3aXRjaCB0aGVtZXMgZnJvbSB0aGUgc2V0dGluZ3MuJ1xuXG4gICAgICAgICAgIyBTdHlsaW5nXG4gICAgICAgICAgQGRldGFpbHMgY2xhc3M6ICd3ZWxjb21lLWNhcmQnLCAnZGF0YS1zZWN0aW9uJzogJ3N0eWxpbmcnLCA9PlxuICAgICAgICAgICAgQHN1bW1hcnkgY2xhc3M6ICd3ZWxjb21lLXN1bW1hcnkgaWNvbiBpY29uLXBhaW50Y2FuJywgPT5cbiAgICAgICAgICAgICAgQHJhdyAnQ3VzdG9taXplIHRoZSA8c3BhbiBjbGFzcz1cIndlbGNvbWUtaGlnaGxpZ2h0XCI+U3R5bGluZzwvc3Bhbj4nXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnd2VsY29tZS1kZXRhaWwnLCA9PlxuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEBpbWcgY2xhc3M6ICd3ZWxjb21lLWltZycsIHNyYzogJ2F0b206Ly93ZWxjb21lL2Fzc2V0cy9jb2RlLnN2ZydcbiAgICAgICAgICAgICAgQHAgJycnWW91IGNhbiBjdXN0b21pemUgYWxtb3N0IGFueXRoaW5nIGJ5IGFkZGluZyB5b3VyIG93biBDU1MvTEVTUy4nJydcbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3N0eWxpbmdCdXR0b24nLCBjbGFzczogJ2J0biBidG4tcHJpbWFyeScsICdPcGVuIHlvdXIgU3R5bGVzaGVldCdcbiAgICAgICAgICAgICAgQHAgJycnTm93IHVuY29tbWVudCBzb21lIG9mIHRoZSBleGFtcGxlcyBvciB0cnkgeW91ciBvd24uJycnXG4gICAgICAgICAgICAgIEBwIGNsYXNzOiAnd2VsY29tZS1ub3RlJywgPT5cbiAgICAgICAgICAgICAgICBAcmF3ICc8c3Ryb25nPk5leHQgdGltZTo8L3N0cm9uZz4gWW91IGNhbiBvcGVuIHlvdXIgc3R5bGVzaGVldCBmcm9tIE1lbnUgPiAnICsgbWVudU5hbWUgKyAnLidcblxuICAgICAgICAgICMgSW5pdCBTY3JpcHRcbiAgICAgICAgICBAZGV0YWlscyBjbGFzczogJ3dlbGNvbWUtY2FyZCcsICdkYXRhLXNlY3Rpb24nOiAnaW5pdC1zY3JpcHQnLCA9PlxuICAgICAgICAgICAgQHN1bW1hcnkgY2xhc3M6ICd3ZWxjb21lLXN1bW1hcnkgaWNvbiBpY29uLWNvZGUnLCA9PlxuICAgICAgICAgICAgICBAcmF3ICdIYWNrIG9uIHRoZSA8c3BhbiBjbGFzcz1cIndlbGNvbWUtaGlnaGxpZ2h0XCI+SW5pdCBTY3JpcHQ8L3NwYW4+J1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3dlbGNvbWUtZGV0YWlsJywgPT5cbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAaW1nIGNsYXNzOiAnd2VsY29tZS1pbWcnLCBzcmM6ICdhdG9tOi8vd2VsY29tZS9hc3NldHMvY29kZS5zdmcnXG4gICAgICAgICAgICAgIEBwICcnJ1xuICAgICAgICAgICAgICAgICAgVGhlIGluaXQgc2NyaXB0IGlzIGEgYml0IG9mIEphdmFTY3JpcHQgb3IgQ29mZmVlU2NyaXB0IHJ1biBhdFxuICAgICAgICAgICAgICAgICAgc3RhcnR1cC4gWW91IGNhbiB1c2UgaXQgdG8gcXVpY2tseSBjaGFuZ2UgdGhlIGJlaGF2aW91ciBvZlxuICAgICAgICAgICAgICAgICAgQXRvbS5cbiAgICAgICAgICAgICAgICAnJydcbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ2luaXRTY3JpcHRCdXR0b24nLCBjbGFzczogJ2J0biBidG4tcHJpbWFyeScsICdPcGVuIHlvdXIgSW5pdCBTY3JpcHQnXG4gICAgICAgICAgICAgIEBwICcnJ1VuY29tbWVudCBzb21lIG9mIHRoZSBleGFtcGxlcyBvciB0cnkgb3V0IHlvdXIgb3duLicnJ1xuICAgICAgICAgICAgICBAcCBjbGFzczogJ3dlbGNvbWUtbm90ZScsID0+XG4gICAgICAgICAgICAgICAgQHJhdyAnPHN0cm9uZz5OZXh0IHRpbWU6PC9zdHJvbmc+IFlvdSBjYW4gb3BlbiB5b3VyIGluaXQgc2NyaXB0IGZyb20gTWVudSA+ICcgKyBtZW51TmFtZSArICcuJ1xuXG4gICAgICAgICAgIyBTbmlwcGV0c1xuICAgICAgICAgIEBkZXRhaWxzIGNsYXNzOiAnd2VsY29tZS1jYXJkJywgJ2RhdGEtc2VjdGlvbic6ICdzbmlwcGV0cycsID0+XG4gICAgICAgICAgICBAc3VtbWFyeSBjbGFzczogJ3dlbGNvbWUtc3VtbWFyeSBpY29uIGljb24tY29kZScsID0+XG4gICAgICAgICAgICAgIEByYXcgJ0FkZCBhIDxzcGFuIGNsYXNzPVwid2VsY29tZS1oaWdobGlnaHRcIj5TbmlwcGV0PC9zcGFuPidcbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICd3ZWxjb21lLWRldGFpbCcsID0+XG4gICAgICAgICAgICAgIEBwID0+XG4gICAgICAgICAgICAgICAgQGltZyBjbGFzczogJ3dlbGNvbWUtaW1nJywgc3JjOiAnYXRvbTovL3dlbGNvbWUvYXNzZXRzL2NvZGUuc3ZnJ1xuICAgICAgICAgICAgICBAcCAnJydcbiAgICAgICAgICAgICAgICAgIEF0b20gc25pcHBldHMgYWxsb3cgeW91IHRvIGVudGVyIGEgc2ltcGxlIHByZWZpeCBpbiB0aGUgZWRpdG9yXG4gICAgICAgICAgICAgICAgICBhbmQgaGl0IHRhYiB0byBleHBhbmQgdGhlIHByZWZpeCBpbnRvIGEgbGFyZ2VyIGNvZGUgYmxvY2sgd2l0aFxuICAgICAgICAgICAgICAgICAgdGVtcGxhdGVkIHZhbHVlcy5cbiAgICAgICAgICAgICAgICAnJydcbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uIG91dGxldDogJ3NuaXBwZXRzQnV0dG9uJywgY2xhc3M6ICdidG4gYnRuLXByaW1hcnknLCAnT3BlbiB5b3VyIFNuaXBwZXRzJ1xuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEByYXcgJycnXG4gICAgICAgICAgICAgICAgICAgIEluIHlvdXIgc25pcHBldHMgZmlsZSwgdHlwZSA8Y29kZT5zbmlwPC9jb2RlPiB0aGVuIGhpdFxuICAgICAgICAgICAgICAgICAgICA8Y29kZT50YWI8L2NvZGU+LiBUaGUgPGNvZGU+c25pcDwvY29kZT4gc25pcHBldCB3aWxsIGV4cGFuZFxuICAgICAgICAgICAgICAgICAgICB0byBjcmVhdGUgYSBzbmlwcGV0IVxuICAgICAgICAgICAgICAgICAgJycnXG4gICAgICAgICAgICAgIEBwIGNsYXNzOiAnd2VsY29tZS1ub3RlJywgPT5cbiAgICAgICAgICAgICAgICBAcmF3ICc8c3Ryb25nPk5leHQgdGltZTo8L3N0cm9uZz4gWW91IGNhbiBvcGVuIHlvdXIgc25pcHBldHMgaW4gTWVudSA+ICcgKyBtZW51TmFtZSArICcuJ1xuXG4gICAgICAgICAgIyBTaG9ydGN1dHNcbiAgICAgICAgICBAZGV0YWlscyBjbGFzczogJ3dlbGNvbWUtY2FyZCcsICdkYXRhLXNlY3Rpb24nOiAnc2hvcnRjdXRzJywgPT5cbiAgICAgICAgICAgIEBzdW1tYXJ5IGNsYXNzOiAnd2VsY29tZS1zdW1tYXJ5IGljb24gaWNvbi1rZXlib2FyZCcsID0+XG4gICAgICAgICAgICAgIEByYXcgJ0xlYXJuIDxzcGFuIGNsYXNzPVwid2VsY29tZS1oaWdobGlnaHRcIj5LZXlib2FyZCBTaG9ydGN1dHM8L3NwYW4+J1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ3dlbGNvbWUtZGV0YWlsJywgPT5cbiAgICAgICAgICAgICAgQHAgPT5cbiAgICAgICAgICAgICAgICBAaW1nIGNsYXNzOiAnd2VsY29tZS1pbWcnLCBzcmM6ICdhdG9tOi8vd2VsY29tZS9hc3NldHMvc2hvcnRjdXQuc3ZnJ1xuICAgICAgICAgICAgICBAcCA9PlxuICAgICAgICAgICAgICAgIEByYXcgJ0lmIHlvdSBvbmx5IHJlbWVtYmVyIG9uZSBrZXlib2FyZCBzaG9ydGN1dCBtYWtlIGl0ICdcbiAgICAgICAgICAgICAgICBAa2JkIGNsYXNzOiAnd2VsY29tZS1rZXknLCBjb21tYW5kUGFsZXR0ZUtleWJpbmRpbmdcbiAgICAgICAgICAgICAgICBAcmF3ICcnJy4gVGhpcyBrZXlzdHJva2UgdG9nZ2xlcyB0aGUgY29tbWFuZCBwYWxldHRlLCB3aGljaCBsaXN0cyBldmVyeSBBdG9tIGNvbW1hbmQuIEl0J3MgYSBnb29kIHdheSB0byBsZWFybiBtb3JlIHNob3J0Y3V0cy4gWWVzLCB5b3UgY2FuIHRyeSBpdCBub3chJycnXG4gICAgICAgICAgICAgIEBwID0+XG4gICAgICAgICAgICAgICAgQHJhdyAnSWYgeW91IHdhbnQgdG8gdXNlIHRoZXNlIGd1aWRlcyBhZ2FpbiB1c2UgdGhlIGNvbW1hbmQgcGFsZXR0ZSAnXG4gICAgICAgICAgICAgICAgQGtiZCBjbGFzczogJ3dlbGNvbWUta2V5JywgY29tbWFuZFBhbGV0dGVLZXliaW5kaW5nXG4gICAgICAgICAgICAgICAgQHJhdyAnIGFuZCBzZWFyY2ggZm9yICdcbiAgICAgICAgICAgICAgICBAc3BhbiBjbGFzczogJ3RleHQtaGlnaGxpZ2h0JywgJ1dlbGNvbWUnXG4gICAgICAgICAgICAgICAgQHJhdyAnLidcblxuICBpbml0aWFsaXplOiAoe29wZW5TZWN0aW9uc30pIC0+XG4gICAgKEBvcGVuU2VjdGlvbihzZWN0aW9uKSBmb3Igc2VjdGlvbiBpbiBvcGVuU2VjdGlvbnMpIGlmIG9wZW5TZWN0aW9ucz9cblxuICAgIEBwcm9qZWN0QnV0dG9uLm9uICdjbGljaycsIC0+XG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoJ2NsaWNrZWQtcHJvamVjdC1jdGEnKVxuICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCAnYXBwbGljYXRpb246b3BlbicpXG4gICAgQHBhY2thZ2VzQnV0dG9uLm9uICdjbGljaycsIC0+XG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoJ2NsaWNrZWQtcGFja2FnZXMtY3RhJylcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ2F0b206Ly9jb25maWcvaW5zdGFsbCcsIHNwbGl0OiAnbGVmdCcpXG4gICAgQHRoZW1lc0J1dHRvbi5vbiAnY2xpY2snLCAtPlxuICAgICAgUmVwb3J0ZXIuc2VuZEV2ZW50KCdjbGlja2VkLXRoZW1lcy1jdGEnKVxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovL2NvbmZpZy90aGVtZXMnLCBzcGxpdDogJ2xlZnQnKVxuICAgIEBzdHlsaW5nQnV0dG9uLm9uICdjbGljaycsIC0+XG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoJ2NsaWNrZWQtc3R5bGluZy1jdGEnKVxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovLy5hdG9tL3N0eWxlc2hlZXQnLCBzcGxpdDogJ2xlZnQnKVxuICAgIEBpbml0U2NyaXB0QnV0dG9uLm9uICdjbGljaycsIC0+XG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoJ2NsaWNrZWQtaW5pdC1zY3JpcHQtY3RhJylcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ2F0b206Ly8uYXRvbS9pbml0LXNjcmlwdCcsIHNwbGl0OiAnbGVmdCcpXG4gICAgQHNuaXBwZXRzQnV0dG9uLm9uICdjbGljaycsIC0+XG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoJ2NsaWNrZWQtc25pcHBldHMtY3RhJylcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ2F0b206Ly8uYXRvbS9zbmlwcGV0cycsIHNwbGl0OiAnbGVmdCcpXG5cbiAgICBAb24gJ2NsaWNrJywgJ3N1bW1hcnknLCAtPlxuICAgICAgZGV0YWlsID0gJCh0aGlzKS5wYXJlbnQoKVxuICAgICAgc2VjdGlvbk5hbWUgPSBkZXRhaWwuYXR0cignZGF0YS1zZWN0aW9uJylcbiAgICAgIGlzT3BlbiA9ICEhZGV0YWlsLmF0dHIoJ29wZW4nKVxuICAgICAgYWN0aW9uID0gaWYgaXNPcGVuIHRoZW4gJ2NvbGxhcHNlJyBlbHNlICdleHBhbmQnXG4gICAgICBSZXBvcnRlci5zZW5kRXZlbnQoXCIje2FjdGlvbn0tI3tzZWN0aW9uTmFtZX0tc2VjdGlvblwiKVxuXG4gIEBkZXNlcmlhbGl6ZTogKG9wdGlvbnM9e30pIC0+XG4gICAgbmV3IEd1aWRlVmlldyhvcHRpb25zKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBkZXNlcmlhbGl6ZXI6IEBjb25zdHJ1Y3Rvci5uYW1lXG4gICAgb3BlblNlY3Rpb25zOiBAZ2V0T3BlblNlY3Rpb25zKClcbiAgICB1cmk6IEBnZXRVUkkoKVxuXG4gIGdldFVSSTogLT4gQHVyaVxuXG4gIGdldFRpdGxlOiAtPiBcIldlbGNvbWUgR3VpZGVcIlxuXG4gIG9uRGlkQ2hhbmdlVGl0bGU6IC0+IG5ldyBEaXNwb3NhYmxlIC0+XG4gIG9uRGlkQ2hhbmdlTW9kaWZpZWQ6IC0+IG5ldyBEaXNwb3NhYmxlIC0+XG5cbiAgaXNFcXVhbDogKG90aGVyKSAtPlxuICAgIG90aGVyIGluc3RhbmNlb2YgR3VpZGVWaWV3XG5cbiAgZ2V0T3BlblNlY3Rpb25zOiAtPlxuICAgIG9wZW5TZWN0aW9ucyA9IEBmaW5kKCdkZXRhaWxzW29wZW5dJylcbiAgICBmb3Igc2VjdGlvbiBpbiBvcGVuU2VjdGlvbnNcbiAgICAgIHNlY3Rpb24uZ2V0QXR0cmlidXRlKCdkYXRhLXNlY3Rpb24nKVxuXG4gIG9wZW5TZWN0aW9uOiAoc2VjdGlvbikgLT5cbiAgICBAZmluZChcImRldGFpbHNbZGF0YS1zZWN0aW9uPVxcXCIje3NlY3Rpb259XFxcIl1cIikuYXR0cignb3BlbicsICdvcGVuJylcbiJdfQ==
