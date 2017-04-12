(function() {
  var Package, ThemePackage,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Package = require('./package');

  module.exports = ThemePackage = (function(superClass) {
    extend(ThemePackage, superClass);

    function ThemePackage() {
      return ThemePackage.__super__.constructor.apply(this, arguments);
    }

    ThemePackage.prototype.getType = function() {
      return 'theme';
    };

    ThemePackage.prototype.getStyleSheetPriority = function() {
      return 1;
    };

    ThemePackage.prototype.enable = function() {
      return this.config.unshiftAtKeyPath('core.themes', this.name);
    };

    ThemePackage.prototype.disable = function() {
      return this.config.removeAtKeyPath('core.themes', this.name);
    };

    ThemePackage.prototype.load = function() {
      this.loadTime = 0;
      this.configSchemaRegisteredOnLoad = this.registerConfigSchemaFromMetadata();
      return this;
    };

    ThemePackage.prototype.activate = function() {
      return this.activationPromise != null ? this.activationPromise : this.activationPromise = new Promise((function(_this) {
        return function(resolve, reject) {
          _this.resolveActivationPromise = resolve;
          _this.rejectActivationPromise = reject;
          return _this.measure('activateTime', function() {
            var error;
            try {
              _this.loadStylesheets();
              return _this.activateNow();
            } catch (error1) {
              error = error1;
              return _this.handleError("Failed to activate the " + _this.name + " theme", error);
            }
          });
        };
      })(this));
    };

    return ThemePackage;

  })(Package);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90aGVtZS1wYWNrYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUJBQUE7SUFBQTs7O0VBQUEsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7MkJBQ0osT0FBQSxHQUFTLFNBQUE7YUFBRztJQUFIOzsyQkFFVCxxQkFBQSxHQUF1QixTQUFBO2FBQUc7SUFBSDs7MkJBRXZCLE1BQUEsR0FBUSxTQUFBO2FBQ04sSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixhQUF6QixFQUF3QyxJQUFDLENBQUEsSUFBekM7SUFETTs7MkJBR1IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsYUFBeEIsRUFBdUMsSUFBQyxDQUFBLElBQXhDO0lBRE87OzJCQUdULElBQUEsR0FBTSxTQUFBO01BQ0osSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUNaLElBQUMsQ0FBQSw0QkFBRCxHQUFnQyxJQUFDLENBQUEsZ0NBQUQsQ0FBQTthQUNoQztJQUhJOzsyQkFLTixRQUFBLEdBQVUsU0FBQTs4Q0FDUixJQUFDLENBQUEsb0JBQUQsSUFBQyxDQUFBLG9CQUF5QixJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsT0FBRCxFQUFVLE1BQVY7VUFDaEMsS0FBQyxDQUFBLHdCQUFELEdBQTRCO1VBQzVCLEtBQUMsQ0FBQSx1QkFBRCxHQUEyQjtpQkFDM0IsS0FBQyxDQUFBLE9BQUQsQ0FBUyxjQUFULEVBQXlCLFNBQUE7QUFDdkIsZ0JBQUE7QUFBQTtjQUNFLEtBQUMsQ0FBQSxlQUFELENBQUE7cUJBQ0EsS0FBQyxDQUFBLFdBQUQsQ0FBQSxFQUZGO2FBQUEsY0FBQTtjQUdNO3FCQUNKLEtBQUMsQ0FBQSxXQUFELENBQWEseUJBQUEsR0FBMEIsS0FBQyxDQUFBLElBQTNCLEdBQWdDLFFBQTdDLEVBQXNELEtBQXRELEVBSkY7O1VBRHVCLENBQXpCO1FBSGdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSO0lBRGxCOzs7O0tBaEJlO0FBSDNCIiwic291cmNlc0NvbnRlbnQiOlsiUGFja2FnZSA9IHJlcXVpcmUgJy4vcGFja2FnZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVGhlbWVQYWNrYWdlIGV4dGVuZHMgUGFja2FnZVxuICBnZXRUeXBlOiAtPiAndGhlbWUnXG5cbiAgZ2V0U3R5bGVTaGVldFByaW9yaXR5OiAtPiAxXG5cbiAgZW5hYmxlOiAtPlxuICAgIEBjb25maWcudW5zaGlmdEF0S2V5UGF0aCgnY29yZS50aGVtZXMnLCBAbmFtZSlcblxuICBkaXNhYmxlOiAtPlxuICAgIEBjb25maWcucmVtb3ZlQXRLZXlQYXRoKCdjb3JlLnRoZW1lcycsIEBuYW1lKVxuXG4gIGxvYWQ6IC0+XG4gICAgQGxvYWRUaW1lID0gMFxuICAgIEBjb25maWdTY2hlbWFSZWdpc3RlcmVkT25Mb2FkID0gQHJlZ2lzdGVyQ29uZmlnU2NoZW1hRnJvbU1ldGFkYXRhKClcbiAgICB0aGlzXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGFjdGl2YXRpb25Qcm9taXNlID89IG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICBAcmVzb2x2ZUFjdGl2YXRpb25Qcm9taXNlID0gcmVzb2x2ZVxuICAgICAgQHJlamVjdEFjdGl2YXRpb25Qcm9taXNlID0gcmVqZWN0XG4gICAgICBAbWVhc3VyZSAnYWN0aXZhdGVUaW1lJywgPT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgQGxvYWRTdHlsZXNoZWV0cygpXG4gICAgICAgICAgQGFjdGl2YXRlTm93KClcbiAgICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgICBAaGFuZGxlRXJyb3IoXCJGYWlsZWQgdG8gYWN0aXZhdGUgdGhlICN7QG5hbWV9IHRoZW1lXCIsIGVycm9yKVxuIl19
