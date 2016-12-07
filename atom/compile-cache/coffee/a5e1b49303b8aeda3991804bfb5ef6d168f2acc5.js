(function() {
  module.exports = {
    statusBar: null,
    activate: function() {},
    deactivate: function() {
      var ref;
      if ((ref = this.statusBarTile) != null) {
        ref.destroy();
      }
      return this.statusBarTile = null;
    },
    provideRunInTerminal: function() {
      return {
        run: (function(_this) {
          return function(command) {
            return _this.statusBarTile.runCommandInNewTerminal(command);
          };
        })(this),
        getTerminalViews: (function(_this) {
          return function() {
            return _this.statusBarTile.terminalViews;
          };
        })(this)
      };
    },
    consumeStatusBar: function(statusBarProvider) {
      return this.statusBarTile = new (require('./status-bar'))(statusBarProvider);
    },
    config: {
      toggles: {
        type: 'object',
        order: 1,
        properties: {
          autoClose: {
            title: 'Close Terminal on Exit',
            description: 'Should the terminal close if the shell exits?',
            type: 'boolean',
            "default": false
          },
          cursorBlink: {
            title: 'Cursor Blink',
            description: 'Should the cursor blink when the terminal is active?',
            type: 'boolean',
            "default": true
          },
          runInsertedText: {
            title: 'Run Inserted Text',
            description: 'Run text inserted via `terminal-fusion:insert-text` as a command? **This will append an end-of-line character to input.**',
            type: 'boolean',
            "default": true
          }
        }
      },
      core: {
        type: 'object',
        order: 2,
        properties: {
          autoRunCommand: {
            title: 'Auto Run Command',
            description: 'Command to run on terminal initialization.',
            type: 'string',
            "default": ''
          },
          mapTerminalsTo: {
            title: 'Map Terminals To',
            description: 'Map terminals to each file or folder. Default is no action or mapping at all. **Restart required.**',
            type: 'string',
            "default": 'None',
            "enum": ['None', 'File', 'Folder']
          },
          mapTerminalsToAutoOpen: {
            title: 'Auto Open a New Terminal (For Terminal Mapping)',
            description: 'Should a new terminal be opened for new items? **Note:** This works in conjunction with `Map Terminals To` above.',
            type: 'boolean',
            "default": false
          },
          scrollback: {
            title: 'Scroll Back',
            description: 'How many lines of history should be kept?',
            type: 'integer',
            "default": 1000
          },
          shell: {
            title: 'Shell Override',
            description: 'Override the default shell instance to launch.',
            type: 'string',
            "default": (function() {
              var path;
              if (process.platform === 'win32') {
                path = require('path');
                return path.resolve(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
              } else {
                return process.env.SHELL;
              }
            })()
          },
          shellArguments: {
            title: 'Shell Arguments',
            description: 'Specify some arguments to use when launching the shell.',
            type: 'string',
            "default": ''
          },
          workingDirectory: {
            title: 'Working Directory',
            description: 'Which directory should be the present working directory when a new terminal is made?',
            type: 'string',
            "default": 'Active File',
            "enum": ['Home', 'Project', 'Active File']
          }
        }
      },
      style: {
        type: 'object',
        order: 3,
        properties: {
          animationSpeed: {
            title: 'Animation Speed',
            description: 'How fast should the window animate?',
            type: 'number',
            "default": '1',
            minimum: '0',
            maximum: '100'
          },
          fontFamily: {
            title: 'Font Family',
            description: 'Override the terminal\'s default font family. **You must use a [monospaced font](https://en.wikipedia.org/wiki/List_of_typefaces#Monospace)!**',
            type: 'string',
            "default": ''
          },
          fontSize: {
            title: 'Font Size',
            description: 'Override the terminal\'s default font size.',
            type: 'string',
            "default": ''
          },
          defaultPanelHeight: {
            title: 'Default Panel Height',
            description: 'Default height of a terminal panel. **You may enter a value in px, em, or %.**',
            type: 'string',
            "default": '300px'
          },
          theme: {
            title: 'Theme',
            description: 'Select a theme for the terminal.',
            type: 'string',
            "default": 'linux',
            "enum": ['standard', 'inverse', 'linux', 'grass', 'homebrew', 'man-page', 'novel', 'ocean', 'pro', 'red', 'red-sands', 'silver-aerogel', 'solarized-dark', 'solid-colors', 'dracula']
          }
        }
      },
      ansiColors: {
        type: 'object',
        order: 4,
        properties: {
          normal: {
            type: 'object',
            order: 1,
            properties: {
              black: {
                title: 'Black',
                description: 'Black color used for terminal ANSI color set.',
                type: 'color',
                "default": '#000000'
              },
              red: {
                title: 'Red',
                description: 'Red color used for terminal ANSI color set.',
                type: 'color',
                "default": '#CD0000'
              },
              green: {
                title: 'Green',
                description: 'Green color used for terminal ANSI color set.',
                type: 'color',
                "default": '#00CD00'
              },
              yellow: {
                title: 'Yellow',
                description: 'Yellow color used for terminal ANSI color set.',
                type: 'color',
                "default": '#CDCD00'
              },
              blue: {
                title: 'Blue',
                description: 'Blue color used for terminal ANSI color set.',
                type: 'color',
                "default": '#0000CD'
              },
              magenta: {
                title: 'Magenta',
                description: 'Magenta color used for terminal ANSI color set.',
                type: 'color',
                "default": '#CD00CD'
              },
              cyan: {
                title: 'Cyan',
                description: 'Cyan color used for terminal ANSI color set.',
                type: 'color',
                "default": '#00CDCD'
              },
              white: {
                title: 'White',
                description: 'White color used for terminal ANSI color set.',
                type: 'color',
                "default": '#E5E5E5'
              }
            }
          },
          zBright: {
            type: 'object',
            order: 2,
            properties: {
              brightBlack: {
                title: 'Bright Black',
                description: 'Bright black color used for terminal ANSI color set.',
                type: 'color',
                "default": '#7F7F7F'
              },
              brightRed: {
                title: 'Bright Red',
                description: 'Bright red color used for terminal ANSI color set.',
                type: 'color',
                "default": '#FF0000'
              },
              brightGreen: {
                title: 'Bright Green',
                description: 'Bright green color used for terminal ANSI color set.',
                type: 'color',
                "default": '#00FF00'
              },
              brightYellow: {
                title: 'Bright Yellow',
                description: 'Bright yellow color used for terminal ANSI color set.',
                type: 'color',
                "default": '#FFFF00'
              },
              brightBlue: {
                title: 'Bright Blue',
                description: 'Bright blue color used for terminal ANSI color set.',
                type: 'color',
                "default": '#0000FF'
              },
              brightMagenta: {
                title: 'Bright Magenta',
                description: 'Bright magenta color used for terminal ANSI color set.',
                type: 'color',
                "default": '#FF00FF'
              },
              brightCyan: {
                title: 'Bright Cyan',
                description: 'Bright cyan color used for terminal ANSI color set.',
                type: 'color',
                "default": '#00FFFF'
              },
              brightWhite: {
                title: 'Bright White',
                description: 'Bright white color used for terminal ANSI color set.',
                type: 'color',
                "default": '#FFFFFF'
              }
            }
          }
        }
      },
      iconColors: {
        type: 'object',
        order: 5,
        properties: {
          red: {
            title: 'Status Icon Red',
            description: 'Red color used for status icon.',
            type: 'color',
            "default": 'red'
          },
          orange: {
            title: 'Status Icon Orange',
            description: 'Orange color used for status icon.',
            type: 'color',
            "default": 'orange'
          },
          yellow: {
            title: 'Status Icon Yellow',
            description: 'Yellow color used for status icon.',
            type: 'color',
            "default": 'yellow'
          },
          green: {
            title: 'Status Icon Green',
            description: 'Green color used for status icon.',
            type: 'color',
            "default": 'green'
          },
          blue: {
            title: 'Status Icon Blue',
            description: 'Blue color used for status icon.',
            type: 'color',
            "default": 'blue'
          },
          purple: {
            title: 'Status Icon Purple',
            description: 'Purple color used for status icon.',
            type: 'color',
            "default": 'purple'
          },
          pink: {
            title: 'Status Icon Pink',
            description: 'Pink color used for status icon.',
            type: 'color',
            "default": 'hotpink'
          },
          cyan: {
            title: 'Status Icon Cyan',
            description: 'Cyan color used for status icon.',
            type: 'color',
            "default": 'cyan'
          },
          magenta: {
            title: 'Status Icon Magenta',
            description: 'Magenta color used for status icon.',
            type: 'color',
            "default": 'magenta'
          }
        }
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3Rlcm1pbmFsLWZ1c2lvbi9saWIvdGVybWluYWwtZnVzaW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxTQUFBLEVBQVcsSUFBWDtJQUVBLFFBQUEsRUFBVSxTQUFBLEdBQUEsQ0FGVjtJQUlBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTs7V0FBYyxDQUFFLE9BQWhCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGFBQUQsR0FBaUI7SUFGUCxDQUpaO0lBUUEsb0JBQUEsRUFBc0IsU0FBQTthQUNwQjtRQUFBLEdBQUEsRUFBSyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLE9BQUQ7bUJBQ0gsS0FBQyxDQUFBLGFBQWEsQ0FBQyx1QkFBZixDQUF1QyxPQUF2QztVQURHO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFMO1FBRUEsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDaEIsS0FBQyxDQUFBLGFBQWEsQ0FBQztVQURDO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZsQjs7SUFEb0IsQ0FSdEI7SUFjQSxnQkFBQSxFQUFrQixTQUFDLGlCQUFEO2FBQ2hCLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsQ0FBQyxPQUFBLENBQVEsY0FBUixDQUFELENBQUEsQ0FBeUIsaUJBQXpCO0lBREwsQ0FkbEI7SUFpQkEsTUFBQSxFQUNFO01BQUEsT0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxLQUFBLEVBQU8sQ0FEUDtRQUVBLFVBQUEsRUFDRTtVQUFBLFNBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyx3QkFBUDtZQUNBLFdBQUEsRUFBYSwrQ0FEYjtZQUVBLElBQUEsRUFBTSxTQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUhUO1dBREY7VUFLQSxXQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sY0FBUDtZQUNBLFdBQUEsRUFBYSxzREFEYjtZQUVBLElBQUEsRUFBTSxTQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQUhUO1dBTkY7VUFVQSxlQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sbUJBQVA7WUFDQSxXQUFBLEVBQWEsMkhBRGI7WUFFQSxJQUFBLEVBQU0sU0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFIVDtXQVhGO1NBSEY7T0FERjtNQW1CQSxJQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLEtBQUEsRUFBTyxDQURQO1FBRUEsVUFBQSxFQUNFO1VBQUEsY0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLGtCQUFQO1lBQ0EsV0FBQSxFQUFhLDRDQURiO1lBRUEsSUFBQSxFQUFNLFFBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBSFQ7V0FERjtVQUtBLGNBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxrQkFBUDtZQUNBLFdBQUEsRUFBYSxxR0FEYjtZQUVBLElBQUEsRUFBTSxRQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxNQUhUO1lBSUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLFFBQWpCLENBSk47V0FORjtVQVdBLHNCQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8saURBQVA7WUFDQSxXQUFBLEVBQWEsbUhBRGI7WUFFQSxJQUFBLEVBQU0sU0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FIVDtXQVpGO1VBZ0JBLFVBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxhQUFQO1lBQ0EsV0FBQSxFQUFhLDJDQURiO1lBRUEsSUFBQSxFQUFNLFNBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBSFQ7V0FqQkY7VUFxQkEsS0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLGdCQUFQO1lBQ0EsV0FBQSxFQUFhLGdEQURiO1lBRUEsSUFBQSxFQUFNLFFBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFZLENBQUEsU0FBQTtBQUNWLGtCQUFBO2NBQUEsSUFBRyxPQUFPLENBQUMsUUFBUixLQUFvQixPQUF2QjtnQkFDRSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7dUJBQ1AsSUFBSSxDQUFDLE9BQUwsQ0FBYSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQXpCLEVBQXFDLFVBQXJDLEVBQWlELG1CQUFqRCxFQUFzRSxNQUF0RSxFQUE4RSxnQkFBOUUsRUFGRjtlQUFBLE1BQUE7dUJBSUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUpkOztZQURVLENBQUEsQ0FBSCxDQUFBLENBSFQ7V0F0QkY7VUErQkEsY0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLGlCQUFQO1lBQ0EsV0FBQSxFQUFhLHlEQURiO1lBRUEsSUFBQSxFQUFNLFFBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBSFQ7V0FoQ0Y7VUFvQ0EsZ0JBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxtQkFBUDtZQUNBLFdBQUEsRUFBYSxzRkFEYjtZQUVBLElBQUEsRUFBTSxRQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxhQUhUO1lBSUEsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLE1BQUQsRUFBUyxTQUFULEVBQW9CLGFBQXBCLENBSk47V0FyQ0Y7U0FIRjtPQXBCRjtNQWlFQSxLQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLEtBQUEsRUFBTyxDQURQO1FBRUEsVUFBQSxFQUNFO1VBQUEsY0FBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLGlCQUFQO1lBQ0EsV0FBQSxFQUFhLHFDQURiO1lBRUEsSUFBQSxFQUFNLFFBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEdBSFQ7WUFJQSxPQUFBLEVBQVMsR0FKVDtZQUtBLE9BQUEsRUFBUyxLQUxUO1dBREY7VUFPQSxVQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sYUFBUDtZQUNBLFdBQUEsRUFBYSxnSkFEYjtZQUVBLElBQUEsRUFBTSxRQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUhUO1dBUkY7VUFZQSxRQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sV0FBUDtZQUNBLFdBQUEsRUFBYSw2Q0FEYjtZQUVBLElBQUEsRUFBTSxRQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUhUO1dBYkY7VUFpQkEsa0JBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxzQkFBUDtZQUNBLFdBQUEsRUFBYSxnRkFEYjtZQUVBLElBQUEsRUFBTSxRQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxPQUhUO1dBbEJGO1VBc0JBLEtBQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxPQUFQO1lBQ0EsV0FBQSxFQUFhLGtDQURiO1lBRUEsSUFBQSxFQUFNLFFBRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE9BSFQ7WUFJQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQ0osVUFESSxFQUVKLFNBRkksRUFHSixPQUhJLEVBSUosT0FKSSxFQUtKLFVBTEksRUFNSixVQU5JLEVBT0osT0FQSSxFQVFKLE9BUkksRUFTSixLQVRJLEVBVUosS0FWSSxFQVdKLFdBWEksRUFZSixnQkFaSSxFQWFKLGdCQWJJLEVBY0osY0FkSSxFQWVKLFNBZkksQ0FKTjtXQXZCRjtTQUhGO09BbEVGO01BaUhBLFVBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsS0FBQSxFQUFPLENBRFA7UUFFQSxVQUFBLEVBQ0U7VUFBQSxNQUFBLEVBQ0U7WUFBQSxJQUFBLEVBQU0sUUFBTjtZQUNBLEtBQUEsRUFBTyxDQURQO1lBRUEsVUFBQSxFQUNFO2NBQUEsS0FBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxPQUFQO2dCQUNBLFdBQUEsRUFBYSwrQ0FEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFERjtjQUtBLEdBQUEsRUFDRTtnQkFBQSxLQUFBLEVBQU8sS0FBUDtnQkFDQSxXQUFBLEVBQWEsNkNBRGI7Z0JBRUEsSUFBQSxFQUFNLE9BRk47Z0JBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxTQUhUO2VBTkY7Y0FVQSxLQUFBLEVBQ0U7Z0JBQUEsS0FBQSxFQUFPLE9BQVA7Z0JBQ0EsV0FBQSxFQUFhLCtDQURiO2dCQUVBLElBQUEsRUFBTSxPQUZOO2dCQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtlQVhGO2NBZUEsTUFBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxRQUFQO2dCQUNBLFdBQUEsRUFBYSxnREFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFoQkY7Y0FvQkEsSUFBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxNQUFQO2dCQUNBLFdBQUEsRUFBYSw4Q0FEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFyQkY7Y0F5QkEsT0FBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxTQUFQO2dCQUNBLFdBQUEsRUFBYSxpREFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUExQkY7Y0E4QkEsSUFBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxNQUFQO2dCQUNBLFdBQUEsRUFBYSw4Q0FEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUEvQkY7Y0FtQ0EsS0FBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxPQUFQO2dCQUNBLFdBQUEsRUFBYSwrQ0FEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFwQ0Y7YUFIRjtXQURGO1VBNENBLE9BQUEsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFOO1lBQ0EsS0FBQSxFQUFPLENBRFA7WUFFQSxVQUFBLEVBQ0U7Y0FBQSxXQUFBLEVBQ0U7Z0JBQUEsS0FBQSxFQUFPLGNBQVA7Z0JBQ0EsV0FBQSxFQUFhLHNEQURiO2dCQUVBLElBQUEsRUFBTSxPQUZOO2dCQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtlQURGO2NBS0EsU0FBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxZQUFQO2dCQUNBLFdBQUEsRUFBYSxvREFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFORjtjQVVBLFdBQUEsRUFDRTtnQkFBQSxLQUFBLEVBQU8sY0FBUDtnQkFDQSxXQUFBLEVBQWEsc0RBRGI7Z0JBRUEsSUFBQSxFQUFNLE9BRk47Z0JBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxTQUhUO2VBWEY7Y0FlQSxZQUFBLEVBQ0U7Z0JBQUEsS0FBQSxFQUFPLGVBQVA7Z0JBQ0EsV0FBQSxFQUFhLHVEQURiO2dCQUVBLElBQUEsRUFBTSxPQUZOO2dCQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtlQWhCRjtjQW9CQSxVQUFBLEVBQ0U7Z0JBQUEsS0FBQSxFQUFPLGFBQVA7Z0JBQ0EsV0FBQSxFQUFhLHFEQURiO2dCQUVBLElBQUEsRUFBTSxPQUZOO2dCQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtlQXJCRjtjQXlCQSxhQUFBLEVBQ0U7Z0JBQUEsS0FBQSxFQUFPLGdCQUFQO2dCQUNBLFdBQUEsRUFBYSx3REFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUExQkY7Y0E4QkEsVUFBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxhQUFQO2dCQUNBLFdBQUEsRUFBYSxxREFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUEvQkY7Y0FtQ0EsV0FBQSxFQUNFO2dCQUFBLEtBQUEsRUFBTyxjQUFQO2dCQUNBLFdBQUEsRUFBYSxzREFEYjtnQkFFQSxJQUFBLEVBQU0sT0FGTjtnQkFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFNBSFQ7ZUFwQ0Y7YUFIRjtXQTdDRjtTQUhGO09BbEhGO01BNk1BLFVBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsS0FBQSxFQUFPLENBRFA7UUFFQSxVQUFBLEVBQ0U7VUFBQSxHQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8saUJBQVA7WUFDQSxXQUFBLEVBQWEsaUNBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FIVDtXQURGO1VBS0EsTUFBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLG9CQUFQO1lBQ0EsV0FBQSxFQUFhLG9DQURiO1lBRUEsSUFBQSxFQUFNLE9BRk47WUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLFFBSFQ7V0FORjtVQVVBLE1BQUEsRUFDRTtZQUFBLEtBQUEsRUFBTyxvQkFBUDtZQUNBLFdBQUEsRUFBYSxvQ0FEYjtZQUVBLElBQUEsRUFBTSxPQUZOO1lBR0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxRQUhUO1dBWEY7VUFlQSxLQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sbUJBQVA7WUFDQSxXQUFBLEVBQWEsbUNBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsT0FIVDtXQWhCRjtVQW9CQSxJQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sa0JBQVA7WUFDQSxXQUFBLEVBQWEsa0NBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsTUFIVDtXQXJCRjtVQXlCQSxNQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sb0JBQVA7WUFDQSxXQUFBLEVBQWEsb0NBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsUUFIVDtXQTFCRjtVQThCQSxJQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sa0JBQVA7WUFDQSxXQUFBLEVBQWEsa0NBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtXQS9CRjtVQW1DQSxJQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8sa0JBQVA7WUFDQSxXQUFBLEVBQWEsa0NBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsTUFIVDtXQXBDRjtVQXdDQSxPQUFBLEVBQ0U7WUFBQSxLQUFBLEVBQU8scUJBQVA7WUFDQSxXQUFBLEVBQWEscUNBRGI7WUFFQSxJQUFBLEVBQU0sT0FGTjtZQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsU0FIVDtXQXpDRjtTQUhGO09BOU1GO0tBbEJGOztBQURGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICBzdGF0dXNCYXI6IG51bGxcblxuICBhY3RpdmF0ZTogLT5cblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBzdGF0dXNCYXJUaWxlPy5kZXN0cm95KClcbiAgICBAc3RhdHVzQmFyVGlsZSA9IG51bGxcblxuICBwcm92aWRlUnVuSW5UZXJtaW5hbDogLT5cbiAgICBydW46IChjb21tYW5kKSA9PlxuICAgICAgQHN0YXR1c0JhclRpbGUucnVuQ29tbWFuZEluTmV3VGVybWluYWwgY29tbWFuZFxuICAgIGdldFRlcm1pbmFsVmlld3M6ICgpID0+XG4gICAgICBAc3RhdHVzQmFyVGlsZS50ZXJtaW5hbFZpZXdzXG5cbiAgY29uc3VtZVN0YXR1c0JhcjogKHN0YXR1c0JhclByb3ZpZGVyKSAtPlxuICAgIEBzdGF0dXNCYXJUaWxlID0gbmV3IChyZXF1aXJlICcuL3N0YXR1cy1iYXInKShzdGF0dXNCYXJQcm92aWRlcilcblxuICBjb25maWc6XG4gICAgdG9nZ2xlczpcbiAgICAgIHR5cGU6ICdvYmplY3QnXG4gICAgICBvcmRlcjogMVxuICAgICAgcHJvcGVydGllczpcbiAgICAgICAgYXV0b0Nsb3NlOlxuICAgICAgICAgIHRpdGxlOiAnQ2xvc2UgVGVybWluYWwgb24gRXhpdCdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3VsZCB0aGUgdGVybWluYWwgY2xvc2UgaWYgdGhlIHNoZWxsIGV4aXRzPydcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICBjdXJzb3JCbGluazpcbiAgICAgICAgICB0aXRsZTogJ0N1cnNvciBCbGluaydcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3VsZCB0aGUgY3Vyc29yIGJsaW5rIHdoZW4gdGhlIHRlcm1pbmFsIGlzIGFjdGl2ZT8nXG4gICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICBydW5JbnNlcnRlZFRleHQ6XG4gICAgICAgICAgdGl0bGU6ICdSdW4gSW5zZXJ0ZWQgVGV4dCdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1biB0ZXh0IGluc2VydGVkIHZpYSBgdGVybWluYWwtZnVzaW9uOmluc2VydC10ZXh0YCBhcyBhIGNvbW1hbmQ/ICoqVGhpcyB3aWxsIGFwcGVuZCBhbiBlbmQtb2YtbGluZSBjaGFyYWN0ZXIgdG8gaW5wdXQuKionXG4gICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIGNvcmU6XG4gICAgICB0eXBlOiAnb2JqZWN0J1xuICAgICAgb3JkZXI6IDJcbiAgICAgIHByb3BlcnRpZXM6XG4gICAgICAgIGF1dG9SdW5Db21tYW5kOlxuICAgICAgICAgIHRpdGxlOiAnQXV0byBSdW4gQ29tbWFuZCdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hbmQgdG8gcnVuIG9uIHRlcm1pbmFsIGluaXRpYWxpemF0aW9uLidcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIG1hcFRlcm1pbmFsc1RvOlxuICAgICAgICAgIHRpdGxlOiAnTWFwIFRlcm1pbmFscyBUbydcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ01hcCB0ZXJtaW5hbHMgdG8gZWFjaCBmaWxlIG9yIGZvbGRlci4gRGVmYXVsdCBpcyBubyBhY3Rpb24gb3IgbWFwcGluZyBhdCBhbGwuICoqUmVzdGFydCByZXF1aXJlZC4qKidcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdOb25lJ1xuICAgICAgICAgIGVudW06IFsnTm9uZScsICdGaWxlJywgJ0ZvbGRlciddXG4gICAgICAgIG1hcFRlcm1pbmFsc1RvQXV0b09wZW46XG4gICAgICAgICAgdGl0bGU6ICdBdXRvIE9wZW4gYSBOZXcgVGVybWluYWwgKEZvciBUZXJtaW5hbCBNYXBwaW5nKSdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3VsZCBhIG5ldyB0ZXJtaW5hbCBiZSBvcGVuZWQgZm9yIG5ldyBpdGVtcz8gKipOb3RlOioqIFRoaXMgd29ya3MgaW4gY29uanVuY3Rpb24gd2l0aCBgTWFwIFRlcm1pbmFscyBUb2AgYWJvdmUuJ1xuICAgICAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgIHNjcm9sbGJhY2s6XG4gICAgICAgICAgdGl0bGU6ICdTY3JvbGwgQmFjaydcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hvdyBtYW55IGxpbmVzIG9mIGhpc3Rvcnkgc2hvdWxkIGJlIGtlcHQ/J1xuICAgICAgICAgIHR5cGU6ICdpbnRlZ2VyJ1xuICAgICAgICAgIGRlZmF1bHQ6IDEwMDBcbiAgICAgICAgc2hlbGw6XG4gICAgICAgICAgdGl0bGU6ICdTaGVsbCBPdmVycmlkZSdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ092ZXJyaWRlIHRoZSBkZWZhdWx0IHNoZWxsIGluc3RhbmNlIHRvIGxhdW5jaC4nXG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICBkZWZhdWx0OiBkbyAtPlxuICAgICAgICAgICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnd2luMzInXG4gICAgICAgICAgICAgIHBhdGggPSByZXF1aXJlICdwYXRoJ1xuICAgICAgICAgICAgICBwYXRoLnJlc29sdmUocHJvY2Vzcy5lbnYuU3lzdGVtUm9vdCwgJ1N5c3RlbTMyJywgJ1dpbmRvd3NQb3dlclNoZWxsJywgJ3YxLjAnLCAncG93ZXJzaGVsbC5leGUnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBwcm9jZXNzLmVudi5TSEVMTFxuICAgICAgICBzaGVsbEFyZ3VtZW50czpcbiAgICAgICAgICB0aXRsZTogJ1NoZWxsIEFyZ3VtZW50cydcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NwZWNpZnkgc29tZSBhcmd1bWVudHMgdG8gdXNlIHdoZW4gbGF1bmNoaW5nIHRoZSBzaGVsbC4nXG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB3b3JraW5nRGlyZWN0b3J5OlxuICAgICAgICAgIHRpdGxlOiAnV29ya2luZyBEaXJlY3RvcnknXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdXaGljaCBkaXJlY3Rvcnkgc2hvdWxkIGJlIHRoZSBwcmVzZW50IHdvcmtpbmcgZGlyZWN0b3J5IHdoZW4gYSBuZXcgdGVybWluYWwgaXMgbWFkZT8nXG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICBkZWZhdWx0OiAnQWN0aXZlIEZpbGUnXG4gICAgICAgICAgZW51bTogWydIb21lJywgJ1Byb2plY3QnLCAnQWN0aXZlIEZpbGUnXVxuICAgIHN0eWxlOlxuICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgIG9yZGVyOiAzXG4gICAgICBwcm9wZXJ0aWVzOlxuICAgICAgICBhbmltYXRpb25TcGVlZDpcbiAgICAgICAgICB0aXRsZTogJ0FuaW1hdGlvbiBTcGVlZCdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hvdyBmYXN0IHNob3VsZCB0aGUgd2luZG93IGFuaW1hdGU/J1xuICAgICAgICAgIHR5cGU6ICdudW1iZXInXG4gICAgICAgICAgZGVmYXVsdDogJzEnXG4gICAgICAgICAgbWluaW11bTogJzAnXG4gICAgICAgICAgbWF4aW11bTogJzEwMCdcbiAgICAgICAgZm9udEZhbWlseTpcbiAgICAgICAgICB0aXRsZTogJ0ZvbnQgRmFtaWx5J1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3ZlcnJpZGUgdGhlIHRlcm1pbmFsXFwncyBkZWZhdWx0IGZvbnQgZmFtaWx5LiAqKllvdSBtdXN0IHVzZSBhIFttb25vc3BhY2VkIGZvbnRdKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xpc3Rfb2ZfdHlwZWZhY2VzI01vbm9zcGFjZSkhKionXG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICBmb250U2l6ZTpcbiAgICAgICAgICB0aXRsZTogJ0ZvbnQgU2l6ZSdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ092ZXJyaWRlIHRoZSB0ZXJtaW5hbFxcJ3MgZGVmYXVsdCBmb250IHNpemUuJ1xuICAgICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICAgICAgZGVmYXVsdDogJydcbiAgICAgICAgZGVmYXVsdFBhbmVsSGVpZ2h0OlxuICAgICAgICAgIHRpdGxlOiAnRGVmYXVsdCBQYW5lbCBIZWlnaHQnXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdEZWZhdWx0IGhlaWdodCBvZiBhIHRlcm1pbmFsIHBhbmVsLiAqKllvdSBtYXkgZW50ZXIgYSB2YWx1ZSBpbiBweCwgZW0sIG9yICUuKionXG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICBkZWZhdWx0OiAnMzAwcHgnXG4gICAgICAgIHRoZW1lOlxuICAgICAgICAgIHRpdGxlOiAnVGhlbWUnXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgYSB0aGVtZSBmb3IgdGhlIHRlcm1pbmFsLidcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdsaW51eCdcbiAgICAgICAgICBlbnVtOiBbXG4gICAgICAgICAgICAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgJ2ludmVyc2UnLFxuICAgICAgICAgICAgJ2xpbnV4JyxcbiAgICAgICAgICAgICdncmFzcycsXG4gICAgICAgICAgICAnaG9tZWJyZXcnLFxuICAgICAgICAgICAgJ21hbi1wYWdlJyxcbiAgICAgICAgICAgICdub3ZlbCcsXG4gICAgICAgICAgICAnb2NlYW4nLFxuICAgICAgICAgICAgJ3BybycsXG4gICAgICAgICAgICAncmVkJyxcbiAgICAgICAgICAgICdyZWQtc2FuZHMnLFxuICAgICAgICAgICAgJ3NpbHZlci1hZXJvZ2VsJyxcbiAgICAgICAgICAgICdzb2xhcml6ZWQtZGFyaycsXG4gICAgICAgICAgICAnc29saWQtY29sb3JzJyxcbiAgICAgICAgICAgICdkcmFjdWxhJ1xuICAgICAgICAgIF1cbiAgICBhbnNpQ29sb3JzOlxuICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgIG9yZGVyOiA0XG4gICAgICBwcm9wZXJ0aWVzOlxuICAgICAgICBub3JtYWw6XG4gICAgICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgICAgICBvcmRlcjogMVxuICAgICAgICAgIHByb3BlcnRpZXM6XG4gICAgICAgICAgICBibGFjazpcbiAgICAgICAgICAgICAgdGl0bGU6ICdCbGFjaydcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCbGFjayBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyMwMDAwMDAnXG4gICAgICAgICAgICByZWQ6XG4gICAgICAgICAgICAgIHRpdGxlOiAnUmVkJ1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JlZCBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyNDRDAwMDAnXG4gICAgICAgICAgICBncmVlbjpcbiAgICAgICAgICAgICAgdGl0bGU6ICdHcmVlbidcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHcmVlbiBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyMwMENEMDAnXG4gICAgICAgICAgICB5ZWxsb3c6XG4gICAgICAgICAgICAgIHRpdGxlOiAnWWVsbG93J1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1llbGxvdyBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyNDRENEMDAnXG4gICAgICAgICAgICBibHVlOlxuICAgICAgICAgICAgICB0aXRsZTogJ0JsdWUnXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmx1ZSBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyMwMDAwQ0QnXG4gICAgICAgICAgICBtYWdlbnRhOlxuICAgICAgICAgICAgICB0aXRsZTogJ01hZ2VudGEnXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWFnZW50YSBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyNDRDAwQ0QnXG4gICAgICAgICAgICBjeWFuOlxuICAgICAgICAgICAgICB0aXRsZTogJ0N5YW4nXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3lhbiBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyMwMENEQ0QnXG4gICAgICAgICAgICB3aGl0ZTpcbiAgICAgICAgICAgICAgdGl0bGU6ICdXaGl0ZSdcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGl0ZSBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyNFNUU1RTUnXG4gICAgICAgIHpCcmlnaHQ6XG4gICAgICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgICAgICBvcmRlcjogMlxuICAgICAgICAgIHByb3BlcnRpZXM6XG4gICAgICAgICAgICBicmlnaHRCbGFjazpcbiAgICAgICAgICAgICAgdGl0bGU6ICdCcmlnaHQgQmxhY2snXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJpZ2h0IGJsYWNrIGNvbG9yIHVzZWQgZm9yIHRlcm1pbmFsIEFOU0kgY29sb3Igc2V0LidcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgICAgICBkZWZhdWx0OiAnIzdGN0Y3RidcbiAgICAgICAgICAgIGJyaWdodFJlZDpcbiAgICAgICAgICAgICAgdGl0bGU6ICdCcmlnaHQgUmVkJ1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0JyaWdodCByZWQgY29sb3IgdXNlZCBmb3IgdGVybWluYWwgQU5TSSBjb2xvciBzZXQuJ1xuICAgICAgICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgICAgICAgIGRlZmF1bHQ6ICcjRkYwMDAwJ1xuICAgICAgICAgICAgYnJpZ2h0R3JlZW46XG4gICAgICAgICAgICAgIHRpdGxlOiAnQnJpZ2h0IEdyZWVuJ1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0JyaWdodCBncmVlbiBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyMwMEZGMDAnXG4gICAgICAgICAgICBicmlnaHRZZWxsb3c6XG4gICAgICAgICAgICAgIHRpdGxlOiAnQnJpZ2h0IFllbGxvdydcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCcmlnaHQgeWVsbG93IGNvbG9yIHVzZWQgZm9yIHRlcm1pbmFsIEFOU0kgY29sb3Igc2V0LidcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgICAgICBkZWZhdWx0OiAnI0ZGRkYwMCdcbiAgICAgICAgICAgIGJyaWdodEJsdWU6XG4gICAgICAgICAgICAgIHRpdGxlOiAnQnJpZ2h0IEJsdWUnXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJpZ2h0IGJsdWUgY29sb3IgdXNlZCBmb3IgdGVybWluYWwgQU5TSSBjb2xvciBzZXQuJ1xuICAgICAgICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgICAgICAgIGRlZmF1bHQ6ICcjMDAwMEZGJ1xuICAgICAgICAgICAgYnJpZ2h0TWFnZW50YTpcbiAgICAgICAgICAgICAgdGl0bGU6ICdCcmlnaHQgTWFnZW50YSdcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCcmlnaHQgbWFnZW50YSBjb2xvciB1c2VkIGZvciB0ZXJtaW5hbCBBTlNJIGNvbG9yIHNldC4nXG4gICAgICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICAgICAgZGVmYXVsdDogJyNGRjAwRkYnXG4gICAgICAgICAgICBicmlnaHRDeWFuOlxuICAgICAgICAgICAgICB0aXRsZTogJ0JyaWdodCBDeWFuJ1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0JyaWdodCBjeWFuIGNvbG9yIHVzZWQgZm9yIHRlcm1pbmFsIEFOU0kgY29sb3Igc2V0LidcbiAgICAgICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgICAgICBkZWZhdWx0OiAnIzAwRkZGRidcbiAgICAgICAgICAgIGJyaWdodFdoaXRlOlxuICAgICAgICAgICAgICB0aXRsZTogJ0JyaWdodCBXaGl0ZSdcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCcmlnaHQgd2hpdGUgY29sb3IgdXNlZCBmb3IgdGVybWluYWwgQU5TSSBjb2xvciBzZXQuJ1xuICAgICAgICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgICAgICAgIGRlZmF1bHQ6ICcjRkZGRkZGJ1xuICAgIGljb25Db2xvcnM6XG4gICAgICB0eXBlOiAnb2JqZWN0J1xuICAgICAgb3JkZXI6IDVcbiAgICAgIHByb3BlcnRpZXM6XG4gICAgICAgIHJlZDpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIFJlZCdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JlZCBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdyZWQnXG4gICAgICAgIG9yYW5nZTpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIE9yYW5nZSdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ09yYW5nZSBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdvcmFuZ2UnXG4gICAgICAgIHllbGxvdzpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIFllbGxvdydcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1llbGxvdyBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICd5ZWxsb3cnXG4gICAgICAgIGdyZWVuOlxuICAgICAgICAgIHRpdGxlOiAnU3RhdHVzIEljb24gR3JlZW4nXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdHcmVlbiBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdncmVlbidcbiAgICAgICAgYmx1ZTpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIEJsdWUnXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdCbHVlIGNvbG9yIHVzZWQgZm9yIHN0YXR1cyBpY29uLidcbiAgICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgICAgZGVmYXVsdDogJ2JsdWUnXG4gICAgICAgIHB1cnBsZTpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIFB1cnBsZSdcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1B1cnBsZSBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdwdXJwbGUnXG4gICAgICAgIHBpbms6XG4gICAgICAgICAgdGl0bGU6ICdTdGF0dXMgSWNvbiBQaW5rJ1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUGluayBjb2xvciB1c2VkIGZvciBzdGF0dXMgaWNvbi4nXG4gICAgICAgICAgdHlwZTogJ2NvbG9yJ1xuICAgICAgICAgIGRlZmF1bHQ6ICdob3RwaW5rJ1xuICAgICAgICBjeWFuOlxuICAgICAgICAgIHRpdGxlOiAnU3RhdHVzIEljb24gQ3lhbidcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N5YW4gY29sb3IgdXNlZCBmb3Igc3RhdHVzIGljb24uJ1xuICAgICAgICAgIHR5cGU6ICdjb2xvcidcbiAgICAgICAgICBkZWZhdWx0OiAnY3lhbidcbiAgICAgICAgbWFnZW50YTpcbiAgICAgICAgICB0aXRsZTogJ1N0YXR1cyBJY29uIE1hZ2VudGEnXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNYWdlbnRhIGNvbG9yIHVzZWQgZm9yIHN0YXR1cyBpY29uLidcbiAgICAgICAgICB0eXBlOiAnY29sb3InXG4gICAgICAgICAgZGVmYXVsdDogJ21hZ2VudGEnXG4iXX0=
