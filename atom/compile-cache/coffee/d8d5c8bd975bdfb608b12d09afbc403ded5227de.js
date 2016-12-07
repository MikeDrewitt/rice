(function() {
  var handleEvents, handler, ref, setupDeprecations, setupGlobals, taskPath, userAgent,
    slice = [].slice;

  ref = process.env, userAgent = ref.userAgent, taskPath = ref.taskPath;

  handler = null;

  setupGlobals = function() {
    var console;
    global.attachEvent = function() {};
    console = {
      warn: function() {
        return emit.apply(null, ['task:warn'].concat(slice.call(arguments)));
      },
      log: function() {
        return emit.apply(null, ['task:log'].concat(slice.call(arguments)));
      },
      error: function() {
        return emit.apply(null, ['task:error'].concat(slice.call(arguments)));
      },
      trace: function() {}
    };
    global.__defineGetter__('console', function() {
      return console;
    });
    global.document = {
      createElement: function() {
        return {
          setAttribute: function() {},
          getElementsByTagName: function() {
            return [];
          },
          appendChild: function() {}
        };
      },
      documentElement: {
        insertBefore: function() {},
        removeChild: function() {}
      },
      getElementById: function() {
        return {};
      },
      createComment: function() {
        return {};
      },
      createDocumentFragment: function() {
        return {};
      }
    };
    global.emit = function() {
      var args, event;
      event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return process.send({
        event: event,
        args: args
      });
    };
    global.navigator = {
      userAgent: userAgent
    };
    return global.window = global;
  };

  handleEvents = function() {
    process.on('uncaughtException', function(error) {
      return console.error(error.message, error.stack);
    });
    return process.on('message', function(arg) {
      var args, async, event, isAsync, ref1, result;
      ref1 = arg != null ? arg : {}, event = ref1.event, args = ref1.args;
      if (event !== 'start') {
        return;
      }
      isAsync = false;
      async = function() {
        isAsync = true;
        return function(result) {
          return emit('task:completed', result);
        };
      };
      result = handler.bind({
        async: async
      }).apply(null, args);
      if (!isAsync) {
        return emit('task:completed', result);
      }
    });
  };

  setupDeprecations = function() {
    var Grim;
    Grim = require('grim');
    return Grim.on('updated', function() {
      var deprecations;
      deprecations = Grim.getDeprecations().map(function(deprecation) {
        return deprecation.serialize();
      });
      Grim.clearDeprecations();
      return emit('task:deprecations', deprecations);
    });
  };

  setupGlobals();

  handleEvents();

  setupDeprecations();

  handler = require(taskPath);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90YXNrLWJvb3RzdHJhcC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGdGQUFBO0lBQUE7O0VBQUEsTUFBd0IsT0FBTyxDQUFDLEdBQWhDLEVBQUMseUJBQUQsRUFBWTs7RUFDWixPQUFBLEdBQVU7O0VBRVYsWUFBQSxHQUFlLFNBQUE7QUFDYixRQUFBO0lBQUEsTUFBTSxDQUFDLFdBQVAsR0FBcUIsU0FBQSxHQUFBO0lBQ3JCLE9BQUEsR0FDRTtNQUFBLElBQUEsRUFBTSxTQUFBO2VBQUcsSUFBQSxhQUFLLENBQUEsV0FBYSxTQUFBLFdBQUEsU0FBQSxDQUFBLENBQWxCO01BQUgsQ0FBTjtNQUNBLEdBQUEsRUFBSyxTQUFBO2VBQUcsSUFBQSxhQUFLLENBQUEsVUFBWSxTQUFBLFdBQUEsU0FBQSxDQUFBLENBQWpCO01BQUgsQ0FETDtNQUVBLEtBQUEsRUFBTyxTQUFBO2VBQUcsSUFBQSxhQUFLLENBQUEsWUFBYyxTQUFBLFdBQUEsU0FBQSxDQUFBLENBQW5CO01BQUgsQ0FGUDtNQUdBLEtBQUEsRUFBTyxTQUFBLEdBQUEsQ0FIUDs7SUFJRixNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsU0FBQTthQUFHO0lBQUgsQ0FBbkM7SUFFQSxNQUFNLENBQUMsUUFBUCxHQUNFO01BQUEsYUFBQSxFQUFlLFNBQUE7ZUFDYjtVQUFBLFlBQUEsRUFBYyxTQUFBLEdBQUEsQ0FBZDtVQUNBLG9CQUFBLEVBQXNCLFNBQUE7bUJBQUc7VUFBSCxDQUR0QjtVQUVBLFdBQUEsRUFBYSxTQUFBLEdBQUEsQ0FGYjs7TUFEYSxDQUFmO01BSUEsZUFBQSxFQUNFO1FBQUEsWUFBQSxFQUFjLFNBQUEsR0FBQSxDQUFkO1FBQ0EsV0FBQSxFQUFhLFNBQUEsR0FBQSxDQURiO09BTEY7TUFPQSxjQUFBLEVBQWdCLFNBQUE7ZUFBRztNQUFILENBUGhCO01BUUEsYUFBQSxFQUFlLFNBQUE7ZUFBRztNQUFILENBUmY7TUFTQSxzQkFBQSxFQUF3QixTQUFBO2VBQUc7TUFBSCxDQVR4Qjs7SUFXRixNQUFNLENBQUMsSUFBUCxHQUFjLFNBQUE7QUFDWixVQUFBO01BRGEsc0JBQU87YUFDcEIsT0FBTyxDQUFDLElBQVIsQ0FBYTtRQUFDLE9BQUEsS0FBRDtRQUFRLE1BQUEsSUFBUjtPQUFiO0lBRFk7SUFFZCxNQUFNLENBQUMsU0FBUCxHQUFtQjtNQUFDLFdBQUEsU0FBRDs7V0FDbkIsTUFBTSxDQUFDLE1BQVAsR0FBZ0I7RUF4Qkg7O0VBMEJmLFlBQUEsR0FBZSxTQUFBO0lBQ2IsT0FBTyxDQUFDLEVBQVIsQ0FBVyxtQkFBWCxFQUFnQyxTQUFDLEtBQUQ7YUFDOUIsT0FBTyxDQUFDLEtBQVIsQ0FBYyxLQUFLLENBQUMsT0FBcEIsRUFBNkIsS0FBSyxDQUFDLEtBQW5DO0lBRDhCLENBQWhDO1dBRUEsT0FBTyxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQXNCLFNBQUMsR0FBRDtBQUNwQixVQUFBOzJCQURxQixNQUFjLElBQWIsb0JBQU87TUFDN0IsSUFBYyxLQUFBLEtBQVMsT0FBdkI7QUFBQSxlQUFBOztNQUVBLE9BQUEsR0FBVTtNQUNWLEtBQUEsR0FBUSxTQUFBO1FBQ04sT0FBQSxHQUFVO2VBQ1YsU0FBQyxNQUFEO2lCQUNFLElBQUEsQ0FBSyxnQkFBTCxFQUF1QixNQUF2QjtRQURGO01BRk07TUFJUixNQUFBLEdBQVMsT0FBTyxDQUFDLElBQVIsQ0FBYTtRQUFDLE9BQUEsS0FBRDtPQUFiLENBQUEsYUFBc0IsSUFBdEI7TUFDVCxJQUFBLENBQXNDLE9BQXRDO2VBQUEsSUFBQSxDQUFLLGdCQUFMLEVBQXVCLE1BQXZCLEVBQUE7O0lBVG9CLENBQXRCO0VBSGE7O0VBY2YsaUJBQUEsR0FBb0IsU0FBQTtBQUNsQixRQUFBO0lBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSO1dBQ1AsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLFlBQUEsR0FBZSxJQUFJLENBQUMsZUFBTCxDQUFBLENBQXNCLENBQUMsR0FBdkIsQ0FBMkIsU0FBQyxXQUFEO2VBQWlCLFdBQVcsQ0FBQyxTQUFaLENBQUE7TUFBakIsQ0FBM0I7TUFDZixJQUFJLENBQUMsaUJBQUwsQ0FBQTthQUNBLElBQUEsQ0FBSyxtQkFBTCxFQUEwQixZQUExQjtJQUhpQixDQUFuQjtFQUZrQjs7RUFPcEIsWUFBQSxDQUFBOztFQUNBLFlBQUEsQ0FBQTs7RUFDQSxpQkFBQSxDQUFBOztFQUNBLE9BQUEsR0FBVSxPQUFBLENBQVEsUUFBUjtBQXJEViIsInNvdXJjZXNDb250ZW50IjpbInt1c2VyQWdlbnQsIHRhc2tQYXRofSA9IHByb2Nlc3MuZW52XG5oYW5kbGVyID0gbnVsbFxuXG5zZXR1cEdsb2JhbHMgPSAtPlxuICBnbG9iYWwuYXR0YWNoRXZlbnQgPSAtPlxuICBjb25zb2xlID1cbiAgICB3YXJuOiAtPiBlbWl0ICd0YXNrOndhcm4nLCBhcmd1bWVudHMuLi5cbiAgICBsb2c6IC0+IGVtaXQgJ3Rhc2s6bG9nJywgYXJndW1lbnRzLi4uXG4gICAgZXJyb3I6IC0+IGVtaXQgJ3Rhc2s6ZXJyb3InLCBhcmd1bWVudHMuLi5cbiAgICB0cmFjZTogLT5cbiAgZ2xvYmFsLl9fZGVmaW5lR2V0dGVyX18gJ2NvbnNvbGUnLCAtPiBjb25zb2xlXG5cbiAgZ2xvYmFsLmRvY3VtZW50ID1cbiAgICBjcmVhdGVFbGVtZW50OiAtPlxuICAgICAgc2V0QXR0cmlidXRlOiAtPlxuICAgICAgZ2V0RWxlbWVudHNCeVRhZ05hbWU6IC0+IFtdXG4gICAgICBhcHBlbmRDaGlsZDogLT5cbiAgICBkb2N1bWVudEVsZW1lbnQ6XG4gICAgICBpbnNlcnRCZWZvcmU6IC0+XG4gICAgICByZW1vdmVDaGlsZDogLT5cbiAgICBnZXRFbGVtZW50QnlJZDogLT4ge31cbiAgICBjcmVhdGVDb21tZW50OiAtPiB7fVxuICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQ6IC0+IHt9XG5cbiAgZ2xvYmFsLmVtaXQgPSAoZXZlbnQsIGFyZ3MuLi4pIC0+XG4gICAgcHJvY2Vzcy5zZW5kKHtldmVudCwgYXJnc30pXG4gIGdsb2JhbC5uYXZpZ2F0b3IgPSB7dXNlckFnZW50fVxuICBnbG9iYWwud2luZG93ID0gZ2xvYmFsXG5cbmhhbmRsZUV2ZW50cyA9IC0+XG4gIHByb2Nlc3Mub24gJ3VuY2F1Z2h0RXhjZXB0aW9uJywgKGVycm9yKSAtPlxuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IubWVzc2FnZSwgZXJyb3Iuc3RhY2spXG4gIHByb2Nlc3Mub24gJ21lc3NhZ2UnLCAoe2V2ZW50LCBhcmdzfT17fSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGV2ZW50IGlzICdzdGFydCdcblxuICAgIGlzQXN5bmMgPSBmYWxzZVxuICAgIGFzeW5jID0gLT5cbiAgICAgIGlzQXN5bmMgPSB0cnVlXG4gICAgICAocmVzdWx0KSAtPlxuICAgICAgICBlbWl0KCd0YXNrOmNvbXBsZXRlZCcsIHJlc3VsdClcbiAgICByZXN1bHQgPSBoYW5kbGVyLmJpbmQoe2FzeW5jfSkoYXJncy4uLilcbiAgICBlbWl0KCd0YXNrOmNvbXBsZXRlZCcsIHJlc3VsdCkgdW5sZXNzIGlzQXN5bmNcblxuc2V0dXBEZXByZWNhdGlvbnMgPSAtPlxuICBHcmltID0gcmVxdWlyZSAnZ3JpbSdcbiAgR3JpbS5vbiAndXBkYXRlZCcsIC0+XG4gICAgZGVwcmVjYXRpb25zID0gR3JpbS5nZXREZXByZWNhdGlvbnMoKS5tYXAgKGRlcHJlY2F0aW9uKSAtPiBkZXByZWNhdGlvbi5zZXJpYWxpemUoKVxuICAgIEdyaW0uY2xlYXJEZXByZWNhdGlvbnMoKVxuICAgIGVtaXQoJ3Rhc2s6ZGVwcmVjYXRpb25zJywgZGVwcmVjYXRpb25zKVxuXG5zZXR1cEdsb2JhbHMoKVxuaGFuZGxlRXZlbnRzKClcbnNldHVwRGVwcmVjYXRpb25zKClcbmhhbmRsZXIgPSByZXF1aXJlKHRhc2tQYXRoKVxuIl19
