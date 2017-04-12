(function() {
  var settings;

  settings = {
    config: {
      startInInsertMode: {
        type: 'boolean',
        "default": false
      },
      useSmartcaseForSearch: {
        type: 'boolean',
        "default": false
      },
      wrapLeftRightMotion: {
        type: 'boolean',
        "default": false
      },
      useClipboardAsDefaultRegister: {
        type: 'boolean',
        "default": true
      },
      numberRegex: {
        type: 'string',
        "default": '-?[0-9]+',
        description: 'Use this to control how Ctrl-A/Ctrl-X finds numbers; use "(?:\\B-)?[0-9]+" to treat numbers as positive if the minus is preceded by a character, e.g. in "identifier-1".'
      }
    }
  };

  Object.keys(settings.config).forEach(function(k) {
    return settings[k] = function() {
      return atom.config.get('vim-mode.' + k);
    };
  });

  settings.defaultRegister = function() {
    if (settings.useClipboardAsDefaultRegister()) {
      return '*';
    } else {
      return '"';
    }
  };

  module.exports = settings;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvc2V0dGluZ3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQTs7RUFBQSxRQUFBLEdBQ0U7SUFBQSxNQUFBLEVBQ0U7TUFBQSxpQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRFQ7T0FERjtNQUdBLHFCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtPQUpGO01BTUEsbUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO09BUEY7TUFTQSw2QkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7T0FWRjtNQVlBLFdBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxVQURUO1FBRUEsV0FBQSxFQUFhLDBLQUZiO09BYkY7S0FERjs7O0VBa0JGLE1BQU0sQ0FBQyxJQUFQLENBQVksUUFBUSxDQUFDLE1BQXJCLENBQTRCLENBQUMsT0FBN0IsQ0FBcUMsU0FBQyxDQUFEO1dBQ25DLFFBQVMsQ0FBQSxDQUFBLENBQVQsR0FBYyxTQUFBO2FBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLFdBQUEsR0FBWSxDQUE1QjtJQURZO0VBRHFCLENBQXJDOztFQUlBLFFBQVEsQ0FBQyxlQUFULEdBQTJCLFNBQUE7SUFDekIsSUFBRyxRQUFRLENBQUMsNkJBQVQsQ0FBQSxDQUFIO2FBQWlELElBQWpEO0tBQUEsTUFBQTthQUEwRCxJQUExRDs7RUFEeUI7O0VBRzNCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBMUJqQiIsInNvdXJjZXNDb250ZW50IjpbIlxuc2V0dGluZ3MgPVxuICBjb25maWc6XG4gICAgc3RhcnRJbkluc2VydE1vZGU6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgdXNlU21hcnRjYXNlRm9yU2VhcmNoOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgIHdyYXBMZWZ0UmlnaHRNb3Rpb246XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgdXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXI6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICBudW1iZXJSZWdleDpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnLT9bMC05XSsnXG4gICAgICBkZXNjcmlwdGlvbjogJ1VzZSB0aGlzIHRvIGNvbnRyb2wgaG93IEN0cmwtQS9DdHJsLVggZmluZHMgbnVtYmVyczsgdXNlIFwiKD86XFxcXEItKT9bMC05XStcIiB0byB0cmVhdCBudW1iZXJzIGFzIHBvc2l0aXZlIGlmIHRoZSBtaW51cyBpcyBwcmVjZWRlZCBieSBhIGNoYXJhY3RlciwgZS5nLiBpbiBcImlkZW50aWZpZXItMVwiLidcblxuT2JqZWN0LmtleXMoc2V0dGluZ3MuY29uZmlnKS5mb3JFYWNoIChrKSAtPlxuICBzZXR0aW5nc1trXSA9IC0+XG4gICAgYXRvbS5jb25maWcuZ2V0KCd2aW0tbW9kZS4nK2spXG5cbnNldHRpbmdzLmRlZmF1bHRSZWdpc3RlciA9IC0+XG4gIGlmIHNldHRpbmdzLnVzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyKCkgdGhlbiAnKicgZWxzZSAnXCInXG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3NcbiJdfQ==
