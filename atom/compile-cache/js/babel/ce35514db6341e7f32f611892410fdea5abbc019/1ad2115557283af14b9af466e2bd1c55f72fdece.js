Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

// This is loaded by atom-environment.coffee. See
// https://atom.io/docs/api/latest/Config for more information about config
// schemas.
var configSchema = {
  core: {
    type: 'object',
    properties: {
      ignoredNames: {
        type: 'array',
        'default': ['.git', '.hg', '.svn', '.DS_Store', '._*', 'Thumbs.db'],
        items: {
          type: 'string'
        },
        description: 'List of [glob patterns](https://en.wikipedia.org/wiki/Glob_%28programming%29). Files and directories matching these patterns will be ignored by some packages, such as the fuzzy finder and tree view. Individual packages might have additional config settings for ignoring names.'
      },
      excludeVcsIgnoredPaths: {
        type: 'boolean',
        'default': true,
        title: 'Exclude VCS Ignored Paths',
        description: 'Files and directories ignored by the current project\'s VCS system will be ignored by some packages, such as the fuzzy finder and find and replace. For example, projects using Git have these paths defined in the .gitignore file. Individual packages might have additional config settings for ignoring VCS ignored files and folders.'
      },
      followSymlinks: {
        type: 'boolean',
        'default': true,
        description: 'Follow symbolic links when searching files and when opening files with the fuzzy finder.'
      },
      disabledPackages: {
        type: 'array',
        'default': [],

        items: {
          type: 'string'
        },

        description: 'List of names of installed packages which are not loaded at startup.'
      },
      customFileTypes: {
        type: 'object',
        'default': {},
        description: 'Associates scope names (e.g. `"source.js"`) with arrays of file extensions and file names (e.g. `["Somefile", ".js2"]`)',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      themes: {
        type: 'array',
        'default': ['one-dark-ui', 'one-dark-syntax'],
        items: {
          type: 'string'
        },
        description: 'Names of UI and syntax themes which will be used when Atom starts.'
      },
      projectHome: {
        type: 'string',
        'default': _path2['default'].join(_fsPlus2['default'].getHomeDirectory(), 'github'),
        description: 'The directory where projects are assumed to be located. Packages created using the Package Generator will be stored here by default.'
      },
      audioBeep: {
        type: 'boolean',
        'default': true,
        description: 'Trigger the system\'s beep sound when certain actions cannot be executed or there are no results.'
      },
      destroyEmptyPanes: {
        type: 'boolean',
        'default': true,
        title: 'Remove Empty Panes',
        description: 'When the last tab of a pane is closed, remove that pane as well.'
      },
      closeEmptyWindows: {
        type: 'boolean',
        'default': true,
        description: 'When a window with no open tabs or panes is given the \'Close Tab\' command, close that window.'
      },
      fileEncoding: {
        description: 'Default character set encoding to use when reading and writing files.',
        type: 'string',
        'default': 'utf8',
        'enum': ['cp437', 'eucjp', 'euckr', 'gbk', 'iso88591', 'iso885910', 'iso885913', 'iso885914', 'iso885915', 'iso885916', 'iso88592', 'iso88593', 'iso88594', 'iso88595', 'iso88596', 'iso88597', 'iso88597', 'iso88598', 'koi8r', 'koi8u', 'macroman', 'shiftjis', 'utf16be', 'utf16le', 'utf8', 'windows1250', 'windows1251', 'windows1252', 'windows1253', 'windows1254', 'windows1255', 'windows1256', 'windows1257', 'windows1258', 'windows866']
      },
      openEmptyEditorOnStart: {
        description: 'Automatically open an empty editor on startup.',
        type: 'boolean',
        'default': true
      },
      reopenProjectMenuCount: {
        description: 'How many recent projects to show in the Reopen Project menu.',
        type: 'integer',
        'default': 15
      },
      automaticallyUpdate: {
        description: 'Automatically update Atom when a new release is available.',
        type: 'boolean',
        'default': true
      },
      allowPendingPaneItems: {
        description: 'Allow items to be previewed without adding them to a pane permanently, such as when single clicking files in the tree view.',
        type: 'boolean',
        'default': true
      },
      telemetryConsent: {
        description: 'Allow usage statistics and exception reports to be sent to the Atom team to help improve the product.',
        title: 'Send Telemetry to the Atom Team',
        type: 'string',
        'default': 'undecided',
        'enum': [{
          value: 'limited',
          description: 'Allow limited anonymous usage stats, exception and crash reporting'
        }, {
          value: 'no',
          description: 'Do not send any telemetry data'
        }, {
          value: 'undecided',
          description: 'Undecided (Atom will ask again next time it is launched)'
        }]
      },
      warnOnLargeFileLimit: {
        description: 'Warn before opening files larger than this number of megabytes.',
        type: 'number',
        'default': 20
      }
    }
  },
  editor: {
    type: 'object',
    // These settings are used in scoped fashion only. No defaults.
    properties: {
      commentStart: {
        type: ['string', 'null']
      },
      commentEnd: {
        type: ['string', 'null']
      },
      increaseIndentPattern: {
        type: ['string', 'null']
      },
      decreaseIndentPattern: {
        type: ['string', 'null']
      },
      foldEndPattern: {
        type: ['string', 'null']
      },
      // These can be used as globals or scoped, thus defaults.
      fontFamily: {
        type: 'string',
        'default': '',
        description: 'The name of the font family used for editor text.'
      },
      fontSize: {
        type: 'integer',
        'default': 14,
        minimum: 1,
        maximum: 100,
        description: 'Height in pixels of editor text.'
      },
      lineHeight: {
        type: ['string', 'number'],
        'default': 1.5,
        description: 'Height of editor lines, as a multiplier of font size.'
      },
      showInvisibles: {
        type: 'boolean',
        'default': false,
        description: 'Render placeholders for invisible characters, such as tabs, spaces and newlines.'
      },
      showIndentGuide: {
        type: 'boolean',
        'default': false,
        description: 'Show indentation indicators in the editor.'
      },
      showLineNumbers: {
        type: 'boolean',
        'default': true,
        description: 'Show line numbers in the editor\'s gutter.'
      },
      atomicSoftTabs: {
        type: 'boolean',
        'default': true,
        description: 'Skip over tab-length runs of leading whitespace when moving the cursor.'
      },
      autoIndent: {
        type: 'boolean',
        'default': true,
        description: 'Automatically indent the cursor when inserting a newline.'
      },
      autoIndentOnPaste: {
        type: 'boolean',
        'default': true,
        description: 'Automatically indent pasted text based on the indentation of the previous line.'
      },
      nonWordCharacters: {
        type: 'string',
        'default': "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-…",
        description: 'A string of non-word characters to define word boundaries.'
      },
      preferredLineLength: {
        type: 'integer',
        'default': 80,
        minimum: 1,
        description: 'Identifies the length of a line which is used when wrapping text with the `Soft Wrap At Preferred Line Length` setting enabled, in number of characters.'
      },
      tabLength: {
        type: 'integer',
        'default': 2,
        minimum: 1,
        description: 'Number of spaces used to represent a tab.'
      },
      softWrap: {
        type: 'boolean',
        'default': false,
        description: 'Wraps lines that exceed the width of the window. When `Soft Wrap At Preferred Line Length` is set, it will wrap to the number of characters defined by the `Preferred Line Length` setting.'
      },
      softTabs: {
        type: 'boolean',
        'default': true,
        description: 'If the `Tab Type` config setting is set to "auto" and autodetection of tab type from buffer content fails, then this config setting determines whether a soft tab or a hard tab will be inserted when the Tab key is pressed.'
      },
      tabType: {
        type: 'string',
        'default': 'auto',
        'enum': ['auto', 'soft', 'hard'],
        description: 'Determine character inserted when Tab key is pressed. Possible values: "auto", "soft" and "hard". When set to "soft" or "hard", soft tabs (spaces) or hard tabs (tab characters) are used. When set to "auto", the editor auto-detects the tab type based on the contents of the buffer (it uses the first leading whitespace on a non-comment line), or uses the value of the Soft Tabs config setting if auto-detection fails.'
      },
      softWrapAtPreferredLineLength: {
        type: 'boolean',
        'default': false,
        description: 'Instead of wrapping lines to the window\'s width, wrap lines to the number of characters defined by the `Preferred Line Length` setting. This will only take effect when the soft wrap config setting is enabled globally or for the current language. **Note:** If you want to hide the wrap guide (the vertical line) you can disable the `wrap-guide` package.'
      },
      softWrapHangingIndent: {
        type: 'integer',
        'default': 0,
        minimum: 0,
        description: 'When soft wrap is enabled, defines length of additional indentation applied to wrapped lines, in number of characters.'
      },
      scrollSensitivity: {
        type: 'integer',
        'default': 40,
        minimum: 10,
        maximum: 200,
        description: 'Determines how fast the editor scrolls when using a mouse or trackpad.'
      },
      scrollPastEnd: {
        type: 'boolean',
        'default': false,
        description: 'Allow the editor to be scrolled past the end of the last line.'
      },
      undoGroupingInterval: {
        type: 'integer',
        'default': 300,
        minimum: 0,
        description: 'Time interval in milliseconds within which text editing operations will be grouped together in the undo history.'
      },
      confirmCheckoutHeadRevision: {
        type: 'boolean',
        'default': true,
        title: 'Confirm Checkout HEAD Revision',
        description: 'Show confirmation dialog when checking out the HEAD revision and discarding changes to current file since last commit.'
      },
      invisibles: {
        type: 'object',
        description: 'A hash of characters Atom will use to render whitespace characters. Keys are whitespace character types, values are rendered characters (use value false to turn off individual whitespace character types).',
        properties: {
          eol: {
            type: ['boolean', 'string'],
            'default': '¬',
            maximumLength: 1,
            description: 'Character used to render newline characters (\\n) when the `Show Invisibles` setting is enabled. '
          },
          space: {
            type: ['boolean', 'string'],
            'default': '·',
            maximumLength: 1,
            description: 'Character used to render leading and trailing space characters when the `Show Invisibles` setting is enabled.'
          },
          tab: {
            type: ['boolean', 'string'],
            'default': '»',
            maximumLength: 1,
            description: 'Character used to render hard tab characters (\\t) when the `Show Invisibles` setting is enabled.'
          },
          cr: {
            type: ['boolean', 'string'],
            'default': '¤',
            maximumLength: 1,
            description: 'Character used to render carriage return characters (for Microsoft-style line endings) when the `Show Invisibles` setting is enabled.'
          }
        }
      },
      zoomFontWhenCtrlScrolling: {
        type: 'boolean',
        'default': process.platform !== 'darwin',
        description: 'Change the editor font size when pressing the Ctrl key and scrolling the mouse up/down.'
      }
    }
  }
};

if (['win32', 'linux'].includes(process.platform)) {
  configSchema.core.properties.autoHideMenuBar = {
    type: 'boolean',
    'default': false,
    description: 'Automatically hide the menu bar and toggle it by pressing Alt. This is only supported on Windows & Linux.'
  };
}

if (process.platform === 'darwin') {
  configSchema.core.properties.useCustomTitleBar = {
    type: 'boolean',
    'default': false,
    description: 'Use custom, theme-aware title bar.<br>Note: This currently does not include a proxy icon.<br>This setting will require a relaunch of Atom to take effect.'
  };
}

exports['default'] = configSchema;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1iZXRhL3NyYy9hdG9tLTEuMTMuMC1iZXRhNi9vdXQvYXBwL3NyYy9jb25maWctc2NoZW1hLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUVpQixNQUFNOzs7O3NCQUNSLFNBQVM7Ozs7Ozs7QUFLeEIsSUFBTSxZQUFZLEdBQUc7QUFDbkIsTUFBSSxFQUFFO0FBQ0osUUFBSSxFQUFFLFFBQVE7QUFDZCxjQUFVLEVBQUU7QUFDVixrQkFBWSxFQUFFO0FBQ1osWUFBSSxFQUFFLE9BQU87QUFDYixtQkFBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDO0FBQ2pFLGFBQUssRUFBRTtBQUNMLGNBQUksRUFBRSxRQUFRO1NBQ2Y7QUFDRCxtQkFBVyxFQUFFLHNSQUFzUjtPQUNwUztBQUNELDRCQUFzQixFQUFFO0FBQ3RCLFlBQUksRUFBRSxTQUFTO0FBQ2YsbUJBQVMsSUFBSTtBQUNiLGFBQUssRUFBRSwyQkFBMkI7QUFDbEMsbUJBQVcsRUFBRSw0VUFBNFU7T0FDMVY7QUFDRCxvQkFBYyxFQUFFO0FBQ2QsWUFBSSxFQUFFLFNBQVM7QUFDZixtQkFBUyxJQUFJO0FBQ2IsbUJBQVcsRUFBRSwwRkFBMEY7T0FDeEc7QUFDRCxzQkFBZ0IsRUFBRTtBQUNoQixZQUFJLEVBQUUsT0FBTztBQUNiLG1CQUFTLEVBQUU7O0FBRVgsYUFBSyxFQUFFO0FBQ0wsY0FBSSxFQUFFLFFBQVE7U0FDZjs7QUFFRCxtQkFBVyxFQUFFLHNFQUFzRTtPQUNwRjtBQUNELHFCQUFlLEVBQUU7QUFDZixZQUFJLEVBQUUsUUFBUTtBQUNkLG1CQUFTLEVBQUU7QUFDWCxtQkFBVyxFQUFFLHlIQUF5SDtBQUN0SSw0QkFBb0IsRUFBRTtBQUNwQixjQUFJLEVBQUUsT0FBTztBQUNiLGVBQUssRUFBRTtBQUNMLGdCQUFJLEVBQUUsUUFB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QUFFLEVBQUU7QUFDRixnQkFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQztBQUMzQix1QkFBUyxHQUFHO0FBQ1oseUJBQWEsRUFBRSxDQUFDO0FBQ2hCLHVCQUFXLEVBQUUsdUlBQXVJO1dBQ3JKO1NBQ0Y7T0FDRjtBQUNELCtCQUF5QixFQUFFO0FBQ3pCLFlBQUksRUFBRSxTQUFTO0FBQ2YsbUJBQVMsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO0FBQ3RDLG1CQUFXLEVBQUUseUZBQXlGO09BQ3ZHO0tBQ0Y7R0FDRjtDQUNGLENBQUE7O0FBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2pELGNBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsR0FBRztBQUM3QyxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztBQUNkLGVBQVcsRUFBRSwyR0FBMkc7R0FDekgsQ0FBQTtDQUNGOztBQUVELElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDakMsY0FBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEdBQUc7QUFDL0MsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLEtBQUs7QUFDZCxlQUFXLEVBQUUsMkpBQTJKO0dBQ3pLLENBQUE7Q0FDRjs7cUJBRWMsWUFBWSIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItYmV0YS9zcmMvYXRvbS0xLjEzLjAtYmV0YTYvb3V0L2FwcC9zcmMvY29uZmlnLXNjaGVtYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuXG4vLyBUaGlzIGlzIGxvYWRlZCBieSBhdG9tLWVudmlyb25tZW50LmNvZmZlZS4gU2VlXG4vLyBodHRwczovL2F0b20uaW8vZG9jcy9hcGkvbGF0ZXN0L0NvbmZpZyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBjb25maWdcbi8vIHNjaGVtYXMuXG5jb25zdCBjb25maWdTY2hlbWEgPSB7XG4gIGNvcmU6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBpZ25vcmVkTmFtZXM6IHtcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgZGVmYXVsdDogWycuZ2l0JywgJy5oZycsICcuc3ZuJywgJy5EU19TdG9yZScsICcuXyonLCAnVGh1bWJzLmRiJ10sXG4gICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgfSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdMaXN0IG9mIFtnbG9iIHBhdHRlcm5zXShodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9HbG9iXyUyOHByb2dyYW1taW5nJTI5KS4gRmlsZXMgYW5kIGRpcmVjdG9yaWVzIG1hdGNoaW5nIHRoZXNlIHBhdHRlcm5zIHdpbGwgYmUgaWdub3JlZCBieSBzb21lIHBhY2thZ2VzLCBzdWNoIGFzIHRoZSBmdXp6eSBmaW5kZXIgYW5kIHRyZWUgdmlldy4gSW5kaXZpZHVhbCBwYWNrYWdlcyBtaWdodCBoYXZlIGFkZGl0aW9uYWwgY29uZmlnIHNldHRpbmdzIGZvciBpZ25vcmluZyBuYW1lcy4nXG4gICAgICB9LFxuICAgICAgZXhjbHVkZVZjc0lnbm9yZWRQYXRoczoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIHRpdGxlOiAnRXhjbHVkZSBWQ1MgSWdub3JlZCBQYXRocycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRmlsZXMgYW5kIGRpcmVjdG9yaWVzIGlnbm9yZWQgYnkgdGhlIGN1cnJlbnQgcHJvamVjdFxcJ3MgVkNTIHN5c3RlbSB3aWxsIGJlIGlnbm9yZWQgYnkgc29tZSBwYWNrYWdlcywgc3VjaCBhcyB0aGUgZnV6enkgZmluZGVyIGFuZCBmaW5kIGFuZCByZXBsYWNlLiBGb3IgZXhhbXBsZSwgcHJvamVjdHMgdXNpbmcgR2l0IGhhdmUgdGhlc2UgcGF0aHMgZGVmaW5lZCBpbiB0aGUgLmdpdGlnbm9yZSBmaWxlLiBJbmRpdmlkdWFsIHBhY2thZ2VzIG1pZ2h0IGhhdmUgYWRkaXRpb25hbCBjb25maWcgc2V0dGluZ3MgZm9yIGlnbm9yaW5nIFZDUyBpZ25vcmVkIGZpbGVzIGFuZCBmb2xkZXJzLidcbiAgICAgIH0sXG4gICAgICBmb2xsb3dTeW1saW5rczoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRm9sbG93IHN5bWJvbGljIGxpbmtzIHdoZW4gc2VhcmNoaW5nIGZpbGVzIGFuZCB3aGVuIG9wZW5pbmcgZmlsZXMgd2l0aCB0aGUgZnV6enkgZmluZGVyLidcbiAgICAgIH0sXG4gICAgICBkaXNhYmxlZFBhY2thZ2VzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlZmF1bHQ6IFtdLFxuXG4gICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgfSxcblxuICAgICAgICBkZXNjcmlwdGlvbjogJ0xpc3Qgb2YgbmFtZXMgb2YgaW5zdGFsbGVkIHBhY2thZ2VzIHdoaWNoIGFyZSBub3QgbG9hZGVkIGF0IHN0YXJ0dXAuJ1xuICAgICAgfSxcbiAgICAgIGN1c3RvbUZpbGVUeXBlczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgZGVmYXVsdDoge30sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzb2NpYXRlcyBzY29wZSBuYW1lcyAoZS5nLiBgXCJzb3VyY2UuanNcImApIHdpdGggYXJyYXlzIG9mIGZpbGUgZXh0ZW5zaW9ucyBhbmQgZmlsZSBuYW1lcyAoZS5nLiBgW1wiU29tZWZpbGVcIiwgXCIuanMyXCJdYCknLFxuICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczoge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdGhlbWVzOiB7XG4gICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIGRlZmF1bHQ6IFsnb25lLWRhcmstdWknLCAnb25lLWRhcmstc3ludGF4J10sXG4gICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgfSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lcyBvZiBVSSBhbmQgc3ludGF4IHRoZW1lcyB3aGljaCB3aWxsIGJlIHVzZWQgd2hlbiBBdG9tIHN0YXJ0cy4nXG4gICAgICB9LFxuICAgICAgcHJvamVjdEhvbWU6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6IHBhdGguam9pbihmcy5nZXRIb21lRGlyZWN0b3J5KCksICdnaXRodWInKSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgZGlyZWN0b3J5IHdoZXJlIHByb2plY3RzIGFyZSBhc3N1bWVkIHRvIGJlIGxvY2F0ZWQuIFBhY2thZ2VzIGNyZWF0ZWQgdXNpbmcgdGhlIFBhY2thZ2UgR2VuZXJhdG9yIHdpbGwgYmUgc3RvcmVkIGhlcmUgYnkgZGVmYXVsdC4nXG4gICAgICB9LFxuICAgICAgYXVkaW9CZWVwOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUcmlnZ2VyIHRoZSBzeXN0ZW1cXCdzIGJlZXAgc291bmQgd2hlbiBjZXJ0YWluIGFjdGlvbnMgY2Fubm90IGJlIGV4ZWN1dGVkIG9yIHRoZXJlIGFyZSBubyByZXN1bHRzLidcbiAgICAgIH0sXG4gICAgICBkZXN0cm95RW1wdHlQYW5lczoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIHRpdGxlOiAnUmVtb3ZlIEVtcHR5IFBhbmVzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaGVuIHRoZSBsYXN0IHRhYiBvZiBhIHBhbmUgaXMgY2xvc2VkLCByZW1vdmUgdGhhdCBwYW5lIGFzIHdlbGwuJ1xuICAgICAgfSxcbiAgICAgIGNsb3NlRW1wdHlXaW5kb3dzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaGVuIGEgd2luZG93IHdpdGggbm8gb3BlbiB0YWJzIG9yIHBhbmVzIGlzIGdpdmVuIHRoZSBcXCdDbG9zZSBUYWJcXCcgY29tbWFuZCwgY2xvc2UgdGhhdCB3aW5kb3cuJ1xuICAgICAgfSxcbiAgICAgIGZpbGVFbmNvZGluZzoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZmF1bHQgY2hhcmFjdGVyIHNldCBlbmNvZGluZyB0byB1c2Ugd2hlbiByZWFkaW5nIGFuZCB3cml0aW5nIGZpbGVzLicsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAndXRmOCcsXG4gICAgICAgIGVudW06IFtcbiAgICAgICAgICAnY3A0MzcnLFxuICAgICAgICAgICdldWNqcCcsXG4gICAgICAgICAgJ2V1Y2tyJyxcbiAgICAgICAgICAnZ2JrJyxcbiAgICAgICAgICAnaXNvODg1OTEnLFxuICAgICAgICAgICdpc284ODU5MTAnLFxuICAgICAgICAgICdpc284ODU5MTMnLFxuICAgICAgICAgICdpc284ODU5MTQnLFxuICAgICAgICAgICdpc284ODU5MTUnLFxuICAgICAgICAgICdpc284ODU5MTYnLFxuICAgICAgICAgICdpc284ODU5MicsXG4gICAgICAgICAgJ2lzbzg4NTkzJyxcbiAgICAgICAgICAnaXNvODg1OTQnLFxuICAgICAgICAgICdpc284ODU5NScsXG4gICAgICAgICAgJ2lzbzg4NTk2JyxcbiAgICAgICAgICAnaXNvODg1OTcnLFxuICAgICAgICAgICdpc284ODU5NycsXG4gICAgICAgICAgJ2lzbzg4NTk4JyxcbiAgICAgICAgICAna29pOHInLFxuICAgICAgICAgICdrb2k4dScsXG4gICAgICAgICAgJ21hY3JvbWFuJyxcbiAgICAgICAgICAnc2hpZnRqaXMnLFxuICAgICAgICAgICd1dGYxNmJlJyxcbiAgICAgICAgICAndXRmMTZsZScsXG4gICAgICAgICAgJ3V0ZjgnLFxuICAgICAgICAgICd3aW5kb3dzMTI1MCcsXG4gICAgICAgICAgJ3dpbmRvd3MxMjUxJyxcbiAgICAgICAgICAnd2luZG93czEyNTInLFxuICAgICAgICAgICd3aW5kb3dzMTI1MycsXG4gICAgICAgICAgJ3dpbmRvd3MxMjU0JyxcbiAgICAgICAgICAnd2luZG93czEyNTUnLFxuICAgICAgICAgICd3aW5kb3dzMTI1NicsXG4gICAgICAgICAgJ3dpbmRvd3MxMjU3JyxcbiAgICAgICAgICAnd2luZG93czEyNTgnLFxuICAgICAgICAgICd3aW5kb3dzODY2J1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgb3BlbkVtcHR5RWRpdG9yT25TdGFydDoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgb3BlbiBhbiBlbXB0eSBlZGl0b3Igb24gc3RhcnR1cC4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIH0sXG4gICAgICByZW9wZW5Qcm9qZWN0TWVudUNvdW50OiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSG93IG1hbnkgcmVjZW50IHByb2plY3RzIHRvIHNob3cgaW4gdGhlIFJlb3BlbiBQcm9qZWN0IG1lbnUuJyxcbiAgICAgICAgdHlwZTogJ2ludGVnZXInLFxuICAgICAgICBkZWZhdWx0OiAxNVxuICAgICAgfSxcbiAgICAgIGF1dG9tYXRpY2FsbHlVcGRhdGU6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IHVwZGF0ZSBBdG9tIHdoZW4gYSBuZXcgcmVsZWFzZSBpcyBhdmFpbGFibGUuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICB9LFxuICAgICAgYWxsb3dQZW5kaW5nUGFuZUl0ZW1zOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgaXRlbXMgdG8gYmUgcHJldmlld2VkIHdpdGhvdXQgYWRkaW5nIHRoZW0gdG8gYSBwYW5lIHBlcm1hbmVudGx5LCBzdWNoIGFzIHdoZW4gc2luZ2xlIGNsaWNraW5nIGZpbGVzIGluIHRoZSB0cmVlIHZpZXcuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICB9LFxuICAgICAgdGVsZW1ldHJ5Q29uc2VudDoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IHVzYWdlIHN0YXRpc3RpY3MgYW5kIGV4Y2VwdGlvbiByZXBvcnRzIHRvIGJlIHNlbnQgdG8gdGhlIEF0b20gdGVhbSB0byBoZWxwIGltcHJvdmUgdGhlIHByb2R1Y3QuJyxcbiAgICAgICAgdGl0bGU6ICdTZW5kIFRlbGVtZXRyeSB0byB0aGUgQXRvbSBUZWFtJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICd1bmRlY2lkZWQnLFxuICAgICAgICBlbnVtOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6ICdsaW1pdGVkJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgbGltaXRlZCBhbm9ueW1vdXMgdXNhZ2Ugc3RhdHMsIGV4Y2VwdGlvbiBhbmQgY3Jhc2ggcmVwb3J0aW5nJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6ICdubycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RvIG5vdCBzZW5kIGFueSB0ZWxlbWV0cnkgZGF0YSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhbHVlOiAndW5kZWNpZGVkJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVW5kZWNpZGVkIChBdG9tIHdpbGwgYXNrIGFnYWluIG5leHQgdGltZSBpdCBpcyBsYXVuY2hlZCknXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgd2Fybk9uTGFyZ2VGaWxlTGltaXQ6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdXYXJuIGJlZm9yZSBvcGVuaW5nIGZpbGVzIGxhcmdlciB0aGFuIHRoaXMgbnVtYmVyIG9mIG1lZ2FieXRlcy4nLFxuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgZGVmYXVsdDogMjBcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGVkaXRvcjoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIC8vIFRoZXNlIHNldHRpbmdzIGFyZSB1c2VkIGluIHNjb3BlZCBmYXNoaW9uIG9ubHkuIE5vIGRlZmF1bHRzLlxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGNvbW1lbnRTdGFydDoge1xuICAgICAgICB0eXBlOiBbJ3N0cmluZycsICdudWxsJ11cbiAgICAgIH0sXG4gICAgICBjb21tZW50RW5kOiB7XG4gICAgICAgIHR5cGU6IFsnc3RyaW5nJywgJ251bGwnXVxuICAgICAgfSxcbiAgICAgIGluY3JlYXNlSW5kZW50UGF0dGVybjoge1xuICAgICAgICB0eXBlOiBbJ3N0cmluZycsICdudWxsJ11cbiAgICAgIH0sXG4gICAgICBkZWNyZWFzZUluZGVudFBhdHRlcm46IHtcbiAgICAgICAgdHlwZTogWydzdHJpbmcnLCAnbnVsbCddXG4gICAgICB9LFxuICAgICAgZm9sZEVuZFBhdHRlcm46IHtcbiAgICAgICAgdHlwZTogWydzdHJpbmcnLCAnbnVsbCddXG4gICAgICB9LFxuICAgICAgLy8gVGhlc2UgY2FuIGJlIHVzZWQgYXMgZ2xvYmFscyBvciBzY29wZWQsIHRodXMgZGVmYXVsdHMuXG4gICAgICBmb250RmFtaWx5OiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgbmFtZSBvZiB0aGUgZm9udCBmYW1pbHkgdXNlZCBmb3IgZWRpdG9yIHRleHQuJ1xuICAgICAgfSxcbiAgICAgIGZvbnRTaXplOiB7XG4gICAgICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICAgICAgZGVmYXVsdDogMTQsXG4gICAgICAgIG1pbmltdW06IDEsXG4gICAgICAgIG1heGltdW06IDEwMCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdIZWlnaHQgaW4gcGl4ZWxzIG9mIGVkaXRvciB0ZXh0LidcbiAgICAgIH0sXG4gICAgICBsaW5lSGVpZ2h0OiB7XG4gICAgICAgIHR5cGU6IFsnc3RyaW5nJywgJ251bWJlciddLFxuICAgICAgICBkZWZhdWx0OiAxLjUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSGVpZ2h0IG9mIGVkaXRvciBsaW5lcywgYXMgYSBtdWx0aXBsaWVyIG9mIGZvbnQgc2l6ZS4nXG4gICAgICB9LFxuICAgICAgc2hvd0ludmlzaWJsZXM6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSZW5kZXIgcGxhY2Vob2xkZXJzIGZvciBpbnZpc2libGUgY2hhcmFjdGVycywgc3VjaCBhcyB0YWJzLCBzcGFjZXMgYW5kIG5ld2xpbmVzLidcbiAgICAgIH0sXG4gICAgICBzaG93SW5kZW50R3VpZGU6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTaG93IGluZGVudGF0aW9uIGluZGljYXRvcnMgaW4gdGhlIGVkaXRvci4nXG4gICAgICB9LFxuICAgICAgc2hvd0xpbmVOdW1iZXJzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTaG93IGxpbmUgbnVtYmVycyBpbiB0aGUgZWRpdG9yXFwncyBndXR0ZXIuJ1xuICAgICAgfSxcbiAgICAgIGF0b21pY1NvZnRUYWJzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTa2lwIG92ZXIgdGFiLWxlbmd0aCBydW5zIG9mIGxlYWRpbmcgd2hpdGVzcGFjZSB3aGVuIG1vdmluZyB0aGUgY3Vyc29yLidcbiAgICAgIH0sXG4gICAgICBhdXRvSW5kZW50OiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IGluZGVudCB0aGUgY3Vyc29yIHdoZW4gaW5zZXJ0aW5nIGEgbmV3bGluZS4nXG4gICAgICB9LFxuICAgICAgYXV0b0luZGVudE9uUGFzdGU6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgaW5kZW50IHBhc3RlZCB0ZXh0IGJhc2VkIG9uIHRoZSBpbmRlbnRhdGlvbiBvZiB0aGUgcHJldmlvdXMgbGluZS4nXG4gICAgICB9LFxuICAgICAgbm9uV29yZENoYXJhY3RlcnM6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6IFwiL1xcXFwoKVxcXCInOiwuOzw+fiFAIyQlXiYqfCs9W117fWA/LeKAplwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Egc3RyaW5nIG9mIG5vbi13b3JkIGNoYXJhY3RlcnMgdG8gZGVmaW5lIHdvcmQgYm91bmRhcmllcy4nXG4gICAgICB9LFxuICAgICAgcHJlZmVycmVkTGluZUxlbmd0aDoge1xuICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgIGRlZmF1bHQ6IDgwLFxuICAgICAgICBtaW5pbXVtOiAxLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0lkZW50aWZpZXMgdGhlIGxlbmd0aCBvZiBhIGxpbmUgd2hpY2ggaXMgdXNlZCB3aGVuIHdyYXBwaW5nIHRleHQgd2l0aCB0aGUgYFNvZnQgV3JhcCBBdCBQcmVmZXJyZWQgTGluZSBMZW5ndGhgIHNldHRpbmcgZW5hYmxlZCwgaW4gbnVtYmVyIG9mIGNoYXJhY3RlcnMuJ1xuICAgICAgfSxcbiAgICAgIHRhYkxlbmd0aDoge1xuICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgIGRlZmF1bHQ6IDIsXG4gICAgICAgIG1pbmltdW06IDEsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIHNwYWNlcyB1c2VkIHRvIHJlcHJlc2VudCBhIHRhYi4nXG4gICAgICB9LFxuICAgICAgc29mdFdyYXA6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXcmFwcyBsaW5lcyB0aGF0IGV4Y2VlZCB0aGUgd2lkdGggb2YgdGhlIHdpbmRvdy4gV2hlbiBgU29mdCBXcmFwIEF0IFByZWZlcnJlZCBMaW5lIExlbmd0aGAgaXMgc2V0LCBpdCB3aWxsIHdyYXAgdG8gdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIGRlZmluZWQgYnkgdGhlIGBQcmVmZXJyZWQgTGluZSBMZW5ndGhgIHNldHRpbmcuJ1xuICAgICAgfSxcbiAgICAgIHNvZnRUYWJzOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJZiB0aGUgYFRhYiBUeXBlYCBjb25maWcgc2V0dGluZyBpcyBzZXQgdG8gXCJhdXRvXCIgYW5kIGF1dG9kZXRlY3Rpb24gb2YgdGFiIHR5cGUgZnJvbSBidWZmZXIgY29udGVudCBmYWlscywgdGhlbiB0aGlzIGNvbmZpZyBzZXR0aW5nIGRldGVybWluZXMgd2hldGhlciBhIHNvZnQgdGFiIG9yIGEgaGFyZCB0YWIgd2lsbCBiZSBpbnNlcnRlZCB3aGVuIHRoZSBUYWIga2V5IGlzIHByZXNzZWQuJ1xuICAgICAgfSxcbiAgICAgIHRhYlR5cGU6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdhdXRvJyxcbiAgICAgICAgZW51bTogWydhdXRvJywgJ3NvZnQnLCAnaGFyZCddLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RldGVybWluZSBjaGFyYWN0ZXIgaW5zZXJ0ZWQgd2hlbiBUYWIga2V5IGlzIHByZXNzZWQuIFBvc3NpYmxlIHZhbHVlczogXCJhdXRvXCIsIFwic29mdFwiIGFuZCBcImhhcmRcIi4gV2hlbiBzZXQgdG8gXCJzb2Z0XCIgb3IgXCJoYXJkXCIsIHNvZnQgdGFicyAoc3BhY2VzKSBvciBoYXJkIHRhYnMgKHRhYiBjaGFyYWN0ZXJzKSBhcmUgdXNlZC4gV2hlbiBzZXQgdG8gXCJhdXRvXCIsIHRoZSBlZGl0b3IgYXV0by1kZXRlY3RzIHRoZSB0YWIgdHlwZSBiYXNlZCBvbiB0aGUgY29udGVudHMgb2YgdGhlIGJ1ZmZlciAoaXQgdXNlcyB0aGUgZmlyc3QgbGVhZGluZyB3aGl0ZXNwYWNlIG9uIGEgbm9uLWNvbW1lbnQgbGluZSksIG9yIHVzZXMgdGhlIHZhbHVlIG9mIHRoZSBTb2Z0IFRhYnMgY29uZmlnIHNldHRpbmcgaWYgYXV0by1kZXRlY3Rpb24gZmFpbHMuJ1xuICAgICAgfSxcbiAgICAgIHNvZnRXcmFwQXRQcmVmZXJyZWRMaW5lTGVuZ3RoOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5zdGVhZCBvZiB3cmFwcGluZyBsaW5lcyB0byB0aGUgd2luZG93XFwncyB3aWR0aCwgd3JhcCBsaW5lcyB0byB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgZGVmaW5lZCBieSB0aGUgYFByZWZlcnJlZCBMaW5lIExlbmd0aGAgc2V0dGluZy4gVGhpcyB3aWxsIG9ubHkgdGFrZSBlZmZlY3Qgd2hlbiB0aGUgc29mdCB3cmFwIGNvbmZpZyBzZXR0aW5nIGlzIGVuYWJsZWQgZ2xvYmFsbHkgb3IgZm9yIHRoZSBjdXJyZW50IGxhbmd1YWdlLiAqKk5vdGU6KiogSWYgeW91IHdhbnQgdG8gaGlkZSB0aGUgd3JhcCBndWlkZSAodGhlIHZlcnRpY2FsIGxpbmUpIHlvdSBjYW4gZGlzYWJsZSB0aGUgYHdyYXAtZ3VpZGVgIHBhY2thZ2UuJ1xuICAgICAgfSxcbiAgICAgIHNvZnRXcmFwSGFuZ2luZ0luZGVudDoge1xuICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgIG1pbmltdW06IDAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2hlbiBzb2Z0IHdyYXAgaXMgZW5hYmxlZCwgZGVmaW5lcyBsZW5ndGggb2YgYWRkaXRpb25hbCBpbmRlbnRhdGlvbiBhcHBsaWVkIHRvIHdyYXBwZWQgbGluZXMsIGluIG51bWJlciBvZiBjaGFyYWN0ZXJzLidcbiAgICAgIH0sXG4gICAgICBzY3JvbGxTZW5zaXRpdml0eToge1xuICAgICAgICB0eXBlOiAnaW50ZWdlcicsXG4gICAgICAgIGRlZmF1bHQ6IDQwLFxuICAgICAgICBtaW5pbXVtOiAxMCxcbiAgICAgICAgbWF4aW11bTogMjAwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RldGVybWluZXMgaG93IGZhc3QgdGhlIGVkaXRvciBzY3JvbGxzIHdoZW4gdXNpbmcgYSBtb3VzZSBvciB0cmFja3BhZC4nXG4gICAgICB9LFxuICAgICAgc2Nyb2xsUGFzdEVuZDoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IHRoZSBlZGl0b3IgdG8gYmUgc2Nyb2xsZWQgcGFzdCB0aGUgZW5kIG9mIHRoZSBsYXN0IGxpbmUuJ1xuICAgICAgfSxcbiAgICAgIHVuZG9Hcm91cGluZ0ludGVydmFsOiB7XG4gICAgICAgIHR5cGU6ICdpbnRlZ2VyJyxcbiAgICAgICAgZGVmYXVsdDogMzAwLFxuICAgICAgICBtaW5pbXVtOiAwLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RpbWUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHdpdGhpbiB3aGljaCB0ZXh0IGVkaXRpbmcgb3BlcmF0aW9ucyB3aWxsIGJlIGdyb3VwZWQgdG9nZXRoZXIgaW4gdGhlIHVuZG8gaGlzdG9yeS4nXG4gICAgICB9LFxuICAgICAgY29uZmlybUNoZWNrb3V0SGVhZFJldmlzaW9uOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgdGl0bGU6ICdDb25maXJtIENoZWNrb3V0IEhFQUQgUmV2aXNpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgY29uZmlybWF0aW9uIGRpYWxvZyB3aGVuIGNoZWNraW5nIG91dCB0aGUgSEVBRCByZXZpc2lvbiBhbmQgZGlzY2FyZGluZyBjaGFuZ2VzIHRvIGN1cnJlbnQgZmlsZSBzaW5jZSBsYXN0IGNvbW1pdC4nXG4gICAgICB9LFxuICAgICAgaW52aXNpYmxlczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIGhhc2ggb2YgY2hhcmFjdGVycyBBdG9tIHdpbGwgdXNlIHRvIHJlbmRlciB3aGl0ZXNwYWNlIGNoYXJhY3RlcnMuIEtleXMgYXJlIHdoaXRlc3BhY2UgY2hhcmFjdGVyIHR5cGVzLCB2YWx1ZXMgYXJlIHJlbmRlcmVkIGNoYXJhY3RlcnMgKHVzZSB2YWx1ZSBmYWxzZSB0byB0dXJuIG9mZiBpbmRpdmlkdWFsIHdoaXRlc3BhY2UgY2hhcmFjdGVyIHR5cGVzKS4nLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZW9sOiB7XG4gICAgICAgICAgICB0eXBlOiBbJ2Jvb2xlYW4nLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBkZWZhdWx0OiAnwqwnLFxuICAgICAgICAgICAgbWF4aW11bUxlbmd0aDogMSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hhcmFjdGVyIHVzZWQgdG8gcmVuZGVyIG5ld2xpbmUgY2hhcmFjdGVycyAoXFxcXG4pIHdoZW4gdGhlIGBTaG93IEludmlzaWJsZXNgIHNldHRpbmcgaXMgZW5hYmxlZC4gJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3BhY2U6IHtcbiAgICAgICAgICAgIHR5cGU6IFsnYm9vbGVhbicsICdzdHJpbmcnXSxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICfCtycsXG4gICAgICAgICAgICBtYXhpbXVtTGVuZ3RoOiAxLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDaGFyYWN0ZXIgdXNlZCB0byByZW5kZXIgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2UgY2hhcmFjdGVycyB3aGVuIHRoZSBgU2hvdyBJbnZpc2libGVzYCBzZXR0aW5nIGlzIGVuYWJsZWQuJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdGFiOiB7XG4gICAgICAgICAgICB0eXBlOiBbJ2Jvb2xlYW4nLCAnc3RyaW5nJ10sXG4gICAgICAgICAgICBkZWZhdWx0OiAnwrsnLFxuICAgICAgICAgICAgbWF4aW11bUxlbmd0aDogMSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hhcmFjdGVyIHVzZWQgdG8gcmVuZGVyIGhhcmQgdGFiIGNoYXJhY3RlcnMgKFxcXFx0KSB3aGVuIHRoZSBgU2hvdyBJbnZpc2libGVzYCBzZXR0aW5nIGlzIGVuYWJsZWQuJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY3I6IHtcbiAgICAgICAgICAgIHR5cGU6IFsnYm9vbGVhbicsICdzdHJpbmcnXSxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICfCpCcsXG4gICAgICAgICAgICBtYXhpbXVtTGVuZ3RoOiAxLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDaGFyYWN0ZXIgdXNlZCB0byByZW5kZXIgY2FycmlhZ2UgcmV0dXJuIGNoYXJhY3RlcnMgKGZvciBNaWNyb3NvZnQtc3R5bGUgbGluZSBlbmRpbmdzKSB3aGVuIHRoZSBgU2hvdyBJbnZpc2libGVzYCBzZXR0aW5nIGlzIGVuYWJsZWQuJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHpvb21Gb250V2hlbkN0cmxTY3JvbGxpbmc6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBwcm9jZXNzLnBsYXRmb3JtICE9PSAnZGFyd2luJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDaGFuZ2UgdGhlIGVkaXRvciBmb250IHNpemUgd2hlbiBwcmVzc2luZyB0aGUgQ3RybCBrZXkgYW5kIHNjcm9sbGluZyB0aGUgbW91c2UgdXAvZG93bi4nXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmlmIChbJ3dpbjMyJywgJ2xpbnV4J10uaW5jbHVkZXMocHJvY2Vzcy5wbGF0Zm9ybSkpIHtcbiAgY29uZmlnU2NoZW1hLmNvcmUucHJvcGVydGllcy5hdXRvSGlkZU1lbnVCYXIgPSB7XG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0b21hdGljYWxseSBoaWRlIHRoZSBtZW51IGJhciBhbmQgdG9nZ2xlIGl0IGJ5IHByZXNzaW5nIEFsdC4gVGhpcyBpcyBvbmx5IHN1cHBvcnRlZCBvbiBXaW5kb3dzICYgTGludXguJ1xuICB9XG59XG5cbmlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICBjb25maWdTY2hlbWEuY29yZS5wcm9wZXJ0aWVzLnVzZUN1c3RvbVRpdGxlQmFyID0ge1xuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBkZXNjcmlwdGlvbjogJ1VzZSBjdXN0b20sIHRoZW1lLWF3YXJlIHRpdGxlIGJhci48YnI+Tm90ZTogVGhpcyBjdXJyZW50bHkgZG9lcyBub3QgaW5jbHVkZSBhIHByb3h5IGljb24uPGJyPlRoaXMgc2V0dGluZyB3aWxsIHJlcXVpcmUgYSByZWxhdW5jaCBvZiBBdG9tIHRvIHRha2UgZWZmZWN0LidcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjb25maWdTY2hlbWFcbiJdfQ==