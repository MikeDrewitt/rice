(function() {
  var Settings;

  Settings = (function() {
    function Settings(scope, config) {
      var i, j, key, len, name, object, ref, ref1;
      this.scope = scope;
      this.config = config;
      ref = Object.keys(this.config);
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        name = ref[i];
        this.config[name].order = i;
      }
      ref1 = this.config;
      for (key in ref1) {
        object = ref1[key];
        object.type = (function() {
          switch (false) {
            case !Number.isInteger(object["default"]):
              return 'integer';
            case typeof object["default"] !== 'boolean':
              return 'boolean';
            case typeof object["default"] !== 'string':
              return 'string';
            case !Array.isArray(object["default"]):
              return 'array';
          }
        })();
      }
    }

    Settings.prototype.get = function(param) {
      if (param === 'defaultRegister') {
        if (this.get('useClipboardAsDefaultRegister')) {
          return '*';
        } else {
          return '"';
        }
      } else {
        return atom.config.get(this.scope + "." + param);
      }
    };

    Settings.prototype.set = function(param, value) {
      return atom.config.set(this.scope + "." + param, value);
    };

    Settings.prototype.toggle = function(param) {
      return this.set(param, !this.get(param));
    };

    Settings.prototype.observe = function(param, fn) {
      return atom.config.observe(this.scope + "." + param, fn);
    };

    return Settings;

  })();

  module.exports = new Settings('vim-mode-plus', {
    setCursorToStartOfChangeOnUndoRedo: {
      "default": true
    },
    groupChangesWhenLeavingInsertMode: {
      "default": true
    },
    useClipboardAsDefaultRegister: {
      "default": false
    },
    startInInsertMode: {
      "default": false
    },
    startInInsertModeScopes: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Start in insert-mode whan editorElement matches scope'
    },
    clearMultipleCursorsOnEscapeInsertMode: {
      "default": false
    },
    autoSelectPersistentSelectionOnOperate: {
      "default": true
    },
    wrapLeftRightMotion: {
      "default": false
    },
    numberRegex: {
      "default": '-?[0-9]+',
      description: 'Used to find number in ctrl-a/ctrl-x. To ignore "-"(minus) char in string like "identifier-1" use "(?:\\B-)?[0-9]+"'
    },
    clearHighlightSearchOnResetNormalMode: {
      "default": false,
      description: 'Clear highlightSearch on `escape` in normal-mode'
    },
    clearPersistentSelectionOnResetNormalMode: {
      "default": false,
      description: 'Clear persistentSelection on `escape` in normal-mode'
    },
    charactersToAddSpaceOnSurround: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Comma separated list of character, which add additional space inside when surround.'
    },
    showCursorInVisualMode: {
      "default": true
    },
    ignoreCaseForSearch: {
      "default": false,
      description: 'For `/` and `?`'
    },
    useSmartcaseForSearch: {
      "default": false,
      description: 'For `/` and `?`. Override `ignoreCaseForSearch`'
    },
    ignoreCaseForSearchCurrentWord: {
      "default": false,
      description: 'For `*` and `#`.'
    },
    useSmartcaseForSearchCurrentWord: {
      "default": false,
      description: 'For `*` and `#`. Override `ignoreCaseForSearchCurrentWord`'
    },
    highlightSearch: {
      "default": false
    },
    highlightSearchExcludeScopes: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Suppress highlightSearch when any of these classes are present in the editor'
    },
    incrementalSearch: {
      "default": false
    },
    incrementalSearchVisitDirection: {
      "default": 'absolute',
      "enum": ['absolute', 'relative'],
      description: "Whether 'visit-next'(tab) and 'visit-prev'(shift-tab) depends on search direction('/' or '?')"
    },
    stayOnTransformString: {
      "default": false,
      description: "Don't move cursor after TransformString e.g Toggle, Surround"
    },
    stayOnYank: {
      "default": false,
      description: "Don't move cursor after Yank"
    },
    stayOnDelete: {
      "default": false,
      description: "Don't move cursor after Delete"
    },
    flashOnUndoRedo: {
      "default": true
    },
    flashOnUndoRedoDuration: {
      "default": 100,
      description: "Duration(msec) for flash"
    },
    flashOnOperate: {
      "default": true
    },
    flashOnOperateDuration: {
      "default": 100,
      description: "Duration(msec) for flash"
    },
    flashOnOperateBlacklist: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'comma separated list of operator class name to disable flash e.g. "Yank, AutoIndent"'
    },
    flashOnSearch: {
      "default": true
    },
    flashOnSearchDuration: {
      "default": 300,
      description: "Duration(msec) for search flash"
    },
    flashScreenOnSearchHasNoMatch: {
      "default": true
    },
    showHoverOnOperate: {
      "default": false,
      description: "Show count, register and optional icon on hover overlay"
    },
    showHoverOnOperateIcon: {
      "default": 'icon',
      "enum": ['none', 'icon', 'emoji']
    },
    showHoverSearchCounter: {
      "default": false
    },
    showHoverSearchCounterDuration: {
      "default": 700,
      description: "Duration(msec) for hover search counter"
    },
    hideTabBarOnMaximizePane: {
      "default": true
    },
    smoothScrollOnFullScrollMotion: {
      "default": false,
      description: "For `ctrl-f` and `ctrl-b`"
    },
    smoothScrollOnFullScrollMotionDuration: {
      "default": 500,
      description: "For `ctrl-f` and `ctrl-b`"
    },
    smoothScrollOnHalfScrollMotion: {
      "default": false,
      description: "For `ctrl-d` and `ctrl-u`"
    },
    smoothScrollOnHalfScrollMotionDuration: {
      "default": 500,
      description: "For `ctrl-d` and `ctrl-u`"
    },
    statusBarModeStringStyle: {
      "default": 'short',
      "enum": ['short', 'long']
    },
    throwErrorOnNonEmptySelectionInNormalMode: {
      "default": false,
      description: "[Dev use] Throw error when non-empty selection was remained in normal-mode at the timing of operation finished"
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZXR0aW5ncy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFNO0lBQ1Msa0JBQUMsS0FBRCxFQUFTLE1BQVQ7QUFFWCxVQUFBO01BRlksSUFBQyxDQUFBLFFBQUQ7TUFBUSxJQUFDLENBQUEsU0FBRDtBQUVwQjtBQUFBLFdBQUEsNkNBQUE7O1FBQ0UsSUFBQyxDQUFBLE1BQU8sQ0FBQSxJQUFBLENBQUssQ0FBQyxLQUFkLEdBQXNCO0FBRHhCO0FBSUE7QUFBQSxXQUFBLFdBQUE7O1FBQ0UsTUFBTSxDQUFDLElBQVA7QUFBYyxrQkFBQSxLQUFBO0FBQUEsa0JBQ1AsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsTUFBTSxFQUFDLE9BQUQsRUFBdkIsQ0FETztxQkFDK0I7QUFEL0IsaUJBRVAsT0FBTyxNQUFNLEVBQUMsT0FBRCxFQUFiLEtBQTBCLFNBRm5CO3FCQUVrQztBQUZsQyxpQkFHUCxPQUFPLE1BQU0sRUFBQyxPQUFELEVBQWIsS0FBMEIsUUFIbkI7cUJBR2lDO0FBSGpDLGtCQUlQLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBTSxFQUFDLE9BQUQsRUFBcEIsQ0FKTztxQkFJNEI7QUFKNUI7O0FBRGhCO0lBTlc7O3VCQWFiLEdBQUEsR0FBSyxTQUFDLEtBQUQ7TUFDSCxJQUFHLEtBQUEsS0FBUyxpQkFBWjtRQUNFLElBQUcsSUFBQyxDQUFBLEdBQUQsQ0FBSywrQkFBTCxDQUFIO2lCQUE4QyxJQUE5QztTQUFBLE1BQUE7aUJBQXVELElBQXZEO1NBREY7T0FBQSxNQUFBO2VBR0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQW1CLElBQUMsQ0FBQSxLQUFGLEdBQVEsR0FBUixHQUFXLEtBQTdCLEVBSEY7O0lBREc7O3VCQU1MLEdBQUEsR0FBSyxTQUFDLEtBQUQsRUFBUSxLQUFSO2FB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QURiO0tBeEZGO0lBMEZBLHNCQUFBLEVBQ0U7TUFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE1BQVQ7TUFDQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsT0FBakIsQ0FETjtLQTNGRjtJQTZGQSxzQkFBQSxFQUNFO01BQUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUFUO0tBOUZGO0lBK0ZBLDhCQUFBLEVBQ0U7TUFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEdBQVQ7TUFDQSxXQUFBLEVBQWEseUNBRGI7S0FoR0Y7SUFrR0Esd0JBQUEsRUFDRTtNQUFBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFBVDtLQW5HRjtJQW9HQSw4QkFBQSxFQUNFO01BQUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUFUO01BQ0EsV0FBQSxFQUFhLDJCQURiO0tBckdGO0lBdUdBLHNDQUFBLEVBQ0U7TUFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEdBQVQ7TUFDQSxXQUFBLEVBQWEsMkJBRGI7S0F4R0Y7SUEwR0EsOEJBQUEsRUFDRTtNQUFBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FBVDtNQUNBLFdBQUEsRUFBYSwyQkFEYjtLQTNHRjtJQTZHQSxzQ0FBQSxFQUNFO01BQUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxHQUFUO01BQ0EsV0FBQSxFQUFhLDJCQURiO0tBOUdGO0lBZ0hBLHdCQUFBLEVBQ0U7TUFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE9BQVQ7TUFDQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsT0FBRCxFQUFVLE1BQVYsQ0FETjtLQWpIRjtJQW1IQSx5Q0FBQSxFQUNFO01BQUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUFUO01BQ0EsV0FBQSxFQUFhLGdIQURiO0tBcEhGO0dBRG1CO0FBN0JyQiIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFNldHRpbmdzXG4gIGNvbnN0cnVjdG9yOiAoQHNjb3BlLCBAY29uZmlnKSAtPlxuICAgICMgSW5qZWN0IG9yZGVyIHByb3BzIHRvIGRpc3BsYXkgb3JkZXJkIGluIHNldHRpbmctdmlld1xuICAgIGZvciBuYW1lLCBpIGluIE9iamVjdC5rZXlzKEBjb25maWcpXG4gICAgICBAY29uZmlnW25hbWVdLm9yZGVyID0gaVxuXG4gICAgIyBBdXRvbWF0aWNhbGx5IGluZmVyIGFuZCBpbmplY3QgYHR5cGVgIG9mIGVhY2ggY29uZmlnIHBhcmFtZXRlci5cbiAgICBmb3Iga2V5LCBvYmplY3Qgb2YgQGNvbmZpZ1xuICAgICAgb2JqZWN0LnR5cGUgPSBzd2l0Y2hcbiAgICAgICAgd2hlbiBOdW1iZXIuaXNJbnRlZ2VyKG9iamVjdC5kZWZhdWx0KSB0aGVuICdpbnRlZ2VyJ1xuICAgICAgICB3aGVuIHR5cGVvZihvYmplY3QuZGVmYXVsdCkgaXMgJ2Jvb2xlYW4nIHRoZW4gJ2Jvb2xlYW4nXG4gICAgICAgIHdoZW4gdHlwZW9mKG9iamVjdC5kZWZhdWx0KSBpcyAnc3RyaW5nJyB0aGVuICdzdHJpbmcnXG4gICAgICAgIHdoZW4gQXJyYXkuaXNBcnJheShvYmplY3QuZGVmYXVsdCkgdGhlbiAnYXJyYXknXG5cbiAgZ2V0OiAocGFyYW0pIC0+XG4gICAgaWYgcGFyYW0gaXMgJ2RlZmF1bHRSZWdpc3RlcidcbiAgICAgIGlmIEBnZXQoJ3VzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyJykgdGhlbiAnKicgZWxzZSAnXCInXG4gICAgZWxzZVxuICAgICAgYXRvbS5jb25maWcuZ2V0IFwiI3tAc2NvcGV9LiN7cGFyYW19XCJcblxuICBzZXQ6IChwYXJhbSwgdmFsdWUpIC0+XG4gICAgYXRvbS5jb25maWcuc2V0IFwiI3tAc2NvcGV9LiN7cGFyYW19XCIsIHZhbHVlXG5cbiAgdG9nZ2xlOiAocGFyYW0pIC0+XG4gICAgQHNldChwYXJhbSwgbm90IEBnZXQocGFyYW0pKVxuXG4gIG9ic2VydmU6IChwYXJhbSwgZm4pIC0+XG4gICAgYXRvbS5jb25maWcub2JzZXJ2ZSBcIiN7QHNjb3BlfS4je3BhcmFtfVwiLCBmblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTZXR0aW5ncyAndmltLW1vZGUtcGx1cycsXG4gIHNldEN1cnNvclRvU3RhcnRPZkNoYW5nZU9uVW5kb1JlZG86XG4gICAgZGVmYXVsdDogdHJ1ZVxuICBncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGU6XG4gICAgZGVmYXVsdDogdHJ1ZVxuICB1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcjpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICBzdGFydEluSW5zZXJ0TW9kZTpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICBzdGFydEluSW5zZXJ0TW9kZVNjb3BlczpcbiAgICBkZWZhdWx0OiBbXVxuICAgIGl0ZW1zOiB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnU3RhcnQgaW4gaW5zZXJ0LW1vZGUgd2hhbiBlZGl0b3JFbGVtZW50IG1hdGNoZXMgc2NvcGUnXG4gIGNsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gIGF1dG9TZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uT25PcGVyYXRlOlxuICAgIGRlZmF1bHQ6IHRydWVcbiAgd3JhcExlZnRSaWdodE1vdGlvbjpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICBudW1iZXJSZWdleDpcbiAgICBkZWZhdWx0OiAnLT9bMC05XSsnXG4gICAgZGVzY3JpcHRpb246ICdVc2VkIHRvIGZpbmQgbnVtYmVyIGluIGN0cmwtYS9jdHJsLXguIFRvIGlnbm9yZSBcIi1cIihtaW51cykgY2hhciBpbiBzdHJpbmcgbGlrZSBcImlkZW50aWZpZXItMVwiIHVzZSBcIig/OlxcXFxCLSk/WzAtOV0rXCInXG4gIGNsZWFySGlnaGxpZ2h0U2VhcmNoT25SZXNldE5vcm1hbE1vZGU6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0NsZWFyIGhpZ2hsaWdodFNlYXJjaCBvbiBgZXNjYXBlYCBpbiBub3JtYWwtbW9kZSdcbiAgY2xlYXJQZXJzaXN0ZW50U2VsZWN0aW9uT25SZXNldE5vcm1hbE1vZGU6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0NsZWFyIHBlcnNpc3RlbnRTZWxlY3Rpb24gb24gYGVzY2FwZWAgaW4gbm9ybWFsLW1vZGUnXG4gIGNoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZDpcbiAgICBkZWZhdWx0OiBbXVxuICAgIGl0ZW1zOiB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwYXJhdGVkIGxpc3Qgb2YgY2hhcmFjdGVyLCB3aGljaCBhZGQgYWRkaXRpb25hbCBzcGFjZSBpbnNpZGUgd2hlbiBzdXJyb3VuZC4nXG4gIHNob3dDdXJzb3JJblZpc3VhbE1vZGU6XG4gICAgZGVmYXVsdDogdHJ1ZVxuICBpZ25vcmVDYXNlRm9yU2VhcmNoOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgZGVzY3JpcHRpb246ICdGb3IgYC9gIGFuZCBgP2AnXG4gIHVzZVNtYXJ0Y2FzZUZvclNlYXJjaDpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiAnRm9yIGAvYCBhbmQgYD9gLiBPdmVycmlkZSBgaWdub3JlQ2FzZUZvclNlYXJjaGAnXG4gIGlnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZDpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiAnRm9yIGAqYCBhbmQgYCNgLidcbiAgdXNlU21hcnRjYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQ6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0ZvciBgKmAgYW5kIGAjYC4gT3ZlcnJpZGUgYGlnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZGAnXG4gIGhpZ2hsaWdodFNlYXJjaDpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICBoaWdobGlnaHRTZWFyY2hFeGNsdWRlU2NvcGVzOlxuICAgIGRlZmF1bHQ6IFtdXG4gICAgaXRlbXM6IHR5cGU6ICdzdHJpbmcnXG4gICAgZGVzY3JpcHRpb246ICdTdXBwcmVzcyBoaWdobGlnaHRTZWFyY2ggd2hlbiBhbnkgb2YgdGhlc2UgY2xhc3NlcyBhcmUgcHJlc2VudCBpbiB0aGUgZWRpdG9yJ1xuICBpbmNyZW1lbnRhbFNlYXJjaDpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICBpbmNyZW1lbnRhbFNlYXJjaFZpc2l0RGlyZWN0aW9uOlxuICAgIGRlZmF1bHQ6ICdhYnNvbHV0ZSdcbiAgICBlbnVtOiBbJ2Fic29sdXRlJywgJ3JlbGF0aXZlJ11cbiAgICBkZXNjcmlwdGlvbjogXCJXaGV0aGVyICd2aXNpdC1uZXh0Jyh0YWIpIGFuZCAndmlzaXQtcHJldicoc2hpZnQtdGFiKSBkZXBlbmRzIG9uIHNlYXJjaCBkaXJlY3Rpb24oJy8nIG9yICc/JylcIlxuICBzdGF5T25UcmFuc2Zvcm1TdHJpbmc6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogXCJEb24ndCBtb3ZlIGN1cnNvciBhZnRlciBUcmFuc2Zvcm1TdHJpbmcgZS5nIFRvZ2dsZSwgU3Vycm91bmRcIlxuICBzdGF5T25ZYW5rOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgZGVzY3JpcHRpb246IFwiRG9uJ3QgbW92ZSBjdXJzb3IgYWZ0ZXIgWWFua1wiXG4gIHN0YXlPbkRlbGV0ZTpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIkRvbid0IG1vdmUgY3Vyc29yIGFmdGVyIERlbGV0ZVwiXG4gIGZsYXNoT25VbmRvUmVkbzpcbiAgICBkZWZhdWx0OiB0cnVlXG4gIGZsYXNoT25VbmRvUmVkb0R1cmF0aW9uOlxuICAgIGRlZmF1bHQ6IDEwMFxuICAgIGRlc2NyaXB0aW9uOiBcIkR1cmF0aW9uKG1zZWMpIGZvciBmbGFzaFwiXG4gIGZsYXNoT25PcGVyYXRlOlxuICAgIGRlZmF1bHQ6IHRydWVcbiAgZmxhc2hPbk9wZXJhdGVEdXJhdGlvbjpcbiAgICBkZWZhdWx0OiAxMDBcbiAgICBkZXNjcmlwdGlvbjogXCJEdXJhdGlvbihtc2VjKSBmb3IgZmxhc2hcIlxuICBmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdDpcbiAgICBkZWZhdWx0OiBbXVxuICAgIGl0ZW1zOiB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnY29tbWEgc2VwYXJhdGVkIGxpc3Qgb2Ygb3BlcmF0b3IgY2xhc3MgbmFtZSB0byBkaXNhYmxlIGZsYXNoIGUuZy4gXCJZYW5rLCBBdXRvSW5kZW50XCInXG4gIGZsYXNoT25TZWFyY2g6XG4gICAgZGVmYXVsdDogdHJ1ZVxuICBmbGFzaE9uU2VhcmNoRHVyYXRpb246XG4gICAgZGVmYXVsdDogMzAwXG4gICAgZGVzY3JpcHRpb246IFwiRHVyYXRpb24obXNlYykgZm9yIHNlYXJjaCBmbGFzaFwiXG4gIGZsYXNoU2NyZWVuT25TZWFyY2hIYXNOb01hdGNoOlxuICAgIGRlZmF1bHQ6IHRydWVcbiAgc2hvd0hvdmVyT25PcGVyYXRlOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgZGVzY3JpcHRpb246IFwiU2hvdyBjb3VudCwgcmVnaXN0ZXIgYW5kIG9wdGlvbmFsIGljb24gb24gaG92ZXIgb3ZlcmxheVwiXG4gIHNob3dIb3Zlck9uT3BlcmF0ZUljb246XG4gICAgZGVmYXVsdDogJ2ljb24nXG4gICAgZW51bTogWydub25lJywgJ2ljb24nLCAnZW1vamknXVxuICBzaG93SG92ZXJTZWFyY2hDb3VudGVyOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gIHNob3dIb3ZlclNlYXJjaENvdW50ZXJEdXJhdGlvbjpcbiAgICBkZWZhdWx0OiA3MDBcbiAgICBkZXNjcmlwdGlvbjogXCJEdXJhdGlvbihtc2VjKSBmb3IgaG92ZXIgc2VhcmNoIGNvdW50ZXJcIlxuICBoaWRlVGFiQmFyT25NYXhpbWl6ZVBhbmU6XG4gICAgZGVmYXVsdDogdHJ1ZVxuICBzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb246XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogXCJGb3IgYGN0cmwtZmAgYW5kIGBjdHJsLWJgXCJcbiAgc21vb3RoU2Nyb2xsT25GdWxsU2Nyb2xsTW90aW9uRHVyYXRpb246XG4gICAgZGVmYXVsdDogNTAwXG4gICAgZGVzY3JpcHRpb246IFwiRm9yIGBjdHJsLWZgIGFuZCBgY3RybC1iYFwiXG4gIHNtb290aFNjcm9sbE9uSGFsZlNjcm9sbE1vdGlvbjpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIkZvciBgY3RybC1kYCBhbmQgYGN0cmwtdWBcIlxuICBzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb25EdXJhdGlvbjpcbiAgICBkZWZhdWx0OiA1MDBcbiAgICBkZXNjcmlwdGlvbjogXCJGb3IgYGN0cmwtZGAgYW5kIGBjdHJsLXVgXCJcbiAgc3RhdHVzQmFyTW9kZVN0cmluZ1N0eWxlOlxuICAgIGRlZmF1bHQ6ICdzaG9ydCdcbiAgICBlbnVtOiBbJ3Nob3J0JywgJ2xvbmcnXVxuICB0aHJvd0Vycm9yT25Ob25FbXB0eVNlbGVjdGlvbkluTm9ybWFsTW9kZTpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIltEZXYgdXNlXSBUaHJvdyBlcnJvciB3aGVuIG5vbi1lbXB0eSBzZWxlY3Rpb24gd2FzIHJlbWFpbmVkIGluIG5vcm1hbC1tb2RlIGF0IHRoZSB0aW1pbmcgb2Ygb3BlcmF0aW9uIGZpbmlzaGVkXCJcbiJdfQ==
