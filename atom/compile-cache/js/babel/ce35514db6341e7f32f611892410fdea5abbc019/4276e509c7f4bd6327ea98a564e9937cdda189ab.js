Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _eventKit = require('event-kit');

// Extended: Manages the deserializers used for serialized state
//
// An instance of this class is always available as the `atom.deserializers`
// global.
//
// ## Examples
//
// ```coffee
// class MyPackageView extends View
//   atom.deserializers.add(this)
//
//   @deserialize: (state) ->
//     new MyPackageView(state)
//
//   constructor: (@state) ->
//
//   serialize: ->
//     @state
// ```

var DeserializerManager = (function () {
  function DeserializerManager(atomEnvironment) {
    _classCallCheck(this, DeserializerManager);

    this.atomEnvironment = atomEnvironment;
    this.deserializers = {};
  }

  // Public: Register the given class(es) as deserializers.
  //
  // * `deserializers` One or more deserializers to register. A deserializer can
  //   be any object with a `.name` property and a `.deserialize()` method. A
  //   common approach is to register a *constructor* as the deserializer for its
  //   instances by adding a `.deserialize()` class method. When your method is
  //   called, it will be passed serialized state as the first argument and the
  //   {Atom} environment object as the second argument, which is useful if you
  //   wish to avoid referencing the `atom` global.

  _createClass(DeserializerManager, [{
    key: 'add',
    value: function add() {
      var _this = this;

      for (var _len = arguments.length, deserializers = Array(_len), _key = 0; _key < _len; _key++) {
        deserializers[_key] = arguments[_key];
      }

      for (var i = 0; i < deserializers.length; i++) {
        var deserializer = deserializers[i];
        this.deserializers[deserializer.name] = deserializer;
      }

      return new _eventKit.Disposable(function () {
        for (var j = 0; j < deserializers.length; j++) {
          var deserializer = deserializers[j];
          delete _this.deserializers[deserializer.name];
        }
      });
    }
  }, {
    key: 'getDeserializerCount',
    value: function getDeserializerCount() {
      return Object.keys(this.deserializers).length;
    }

    // Public: Deserialize the state and params.
    //
    // * `state` The state {Object} to deserialize.
  }, {
    key: 'deserialize',
    value: function deserialize(state) {
      if (state == null) {
        return;
      }

      var deserializer = this.get(state);
      if (deserializer) {
        var stateVersion = typeof state.get === 'function' && state.get('version') || state.version;

        if (deserializer.version != null && deserializer.version !== stateVersion) {
          return;
        }
        return deserializer.deserialize(state, this.atomEnvironment);
      } else {
        return console.warn('No deserializer found for', state);
      }
    }

    // Get the deserializer for the state.
    //
    // * `state` The state {Object} being deserialized.
  }, {
    key: 'get',
    value: function get(state) {
      if (state == null) {
        return;
      }

      var stateDeserializer = typeof state.get === 'function' && state.get('deserializer') || state.deserializer;

      return this.deserializers[stateDeserializer];
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.deserializers = {};
    }
  }]);

  return DeserializerManager;
})();

exports['default'] = DeserializerManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvZGVzZXJpYWxpemVyLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt3QkFFeUIsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXFCZixtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsQ0FDekIsZUFBZSxFQUFFOzBCQURYLG1CQUFtQjs7QUFFcEMsUUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUE7QUFDdEMsUUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUE7R0FDeEI7Ozs7Ozs7Ozs7OztlQUprQixtQkFBbUI7O1dBZWxDLGVBQW1COzs7d0NBQWYsYUFBYTtBQUFiLHFCQUFhOzs7QUFDbkIsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsWUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ25DLFlBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQTtPQUNyRDs7QUFFRCxhQUFPLHlCQUFlLFlBQU07QUFDMUIsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsY0FBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ25DLGlCQUFPLE1BQUssYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUM3QztPQUNGLENBQUMsQ0FBQTtLQUNIOzs7V0FFb0IsZ0NBQUc7QUFDdEIsYUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLENBQUE7S0FDOUM7Ozs7Ozs7V0FLVyxxQkFBQyxLQUFLLEVBQUU7QUFDbEIsVUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ2pCLGVBQU07T0FDUDs7QUFFRCxVQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3BDLFVBQUksWUFBWSxFQUFFO0FBQ2hCLFlBQUksWUFBWSxHQUNkLEFBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxLQUFLLFVBQVUsSUFBSyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUN6RCxLQUFLLENBQUMsT0FBTyxBQUNkLENBQUE7O0FBRUQsWUFBSSxBQUFDLFlBQVksQ0FBQyxPQUFPLElBQUksSUFBSSxJQUFLLFlBQVksQ0FBQyxPQUFPLEtBQUssWUFBWSxFQUFFO0FBQzNFLGlCQUFNO1NBQ1A7QUFDRCxlQUFPLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtPQUM3RCxNQUFNO0FBQ0wsZUFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFBO09BQ3hEO0tBQ0Y7Ozs7Ozs7V0FLRyxhQUFDLEtBQUssRUFBRTtBQUNWLFVBQUksS0FBSyxJQUFJLElBQUksRUFBRTtBQUNqQixlQUFNO09BQ1A7O0FBRUQsVUFBSSxpQkFBaUIsR0FDbkIsQUFBQyxPQUFPLEtBQUssQ0FBQyxHQUFHLEtBQUssVUFBVSxJQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQzlELEtBQUssQ0FBQyxZQUFZLEFBQ25CLENBQUE7O0FBRUQsYUFBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUE7S0FDN0M7OztXQUVLLGlCQUFHO0FBQ1AsVUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUE7S0FDeEI7OztTQTNFa0IsbUJBQW1COzs7cUJBQW5CLG1CQUFtQiIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvc3JjL2Rlc2VyaWFsaXplci1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQge0Rpc3Bvc2FibGV9IGZyb20gJ2V2ZW50LWtpdCdcblxuLy8gRXh0ZW5kZWQ6IE1hbmFnZXMgdGhlIGRlc2VyaWFsaXplcnMgdXNlZCBmb3Igc2VyaWFsaXplZCBzdGF0ZVxuLy9cbi8vIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgYWx3YXlzIGF2YWlsYWJsZSBhcyB0aGUgYGF0b20uZGVzZXJpYWxpemVyc2Bcbi8vIGdsb2JhbC5cbi8vXG4vLyAjIyBFeGFtcGxlc1xuLy9cbi8vIGBgYGNvZmZlZVxuLy8gY2xhc3MgTXlQYWNrYWdlVmlldyBleHRlbmRzIFZpZXdcbi8vICAgYXRvbS5kZXNlcmlhbGl6ZXJzLmFkZCh0aGlzKVxuLy9cbi8vICAgQGRlc2VyaWFsaXplOiAoc3RhdGUpIC0+XG4vLyAgICAgbmV3IE15UGFja2FnZVZpZXcoc3RhdGUpXG4vL1xuLy8gICBjb25zdHJ1Y3RvcjogKEBzdGF0ZSkgLT5cbi8vXG4vLyAgIHNlcmlhbGl6ZTogLT5cbi8vICAgICBAc3RhdGVcbi8vIGBgYFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVzZXJpYWxpemVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yIChhdG9tRW52aXJvbm1lbnQpIHtcbiAgICB0aGlzLmF0b21FbnZpcm9ubWVudCA9IGF0b21FbnZpcm9ubWVudFxuICAgIHRoaXMuZGVzZXJpYWxpemVycyA9IHt9XG4gIH1cblxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIHRoZSBnaXZlbiBjbGFzcyhlcykgYXMgZGVzZXJpYWxpemVycy5cbiAgLy9cbiAgLy8gKiBgZGVzZXJpYWxpemVyc2AgT25lIG9yIG1vcmUgZGVzZXJpYWxpemVycyB0byByZWdpc3Rlci4gQSBkZXNlcmlhbGl6ZXIgY2FuXG4gIC8vICAgYmUgYW55IG9iamVjdCB3aXRoIGEgYC5uYW1lYCBwcm9wZXJ0eSBhbmQgYSBgLmRlc2VyaWFsaXplKClgIG1ldGhvZC4gQVxuICAvLyAgIGNvbW1vbiBhcHByb2FjaCBpcyB0byByZWdpc3RlciBhICpjb25zdHJ1Y3RvciogYXMgdGhlIGRlc2VyaWFsaXplciBmb3IgaXRzXG4gIC8vICAgaW5zdGFuY2VzIGJ5IGFkZGluZyBhIGAuZGVzZXJpYWxpemUoKWAgY2xhc3MgbWV0aG9kLiBXaGVuIHlvdXIgbWV0aG9kIGlzXG4gIC8vICAgY2FsbGVkLCBpdCB3aWxsIGJlIHBhc3NlZCBzZXJpYWxpemVkIHN0YXRlIGFzIHRoZSBmaXJzdCBhcmd1bWVudCBhbmQgdGhlXG4gIC8vICAge0F0b219IGVudmlyb25tZW50IG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LCB3aGljaCBpcyB1c2VmdWwgaWYgeW91XG4gIC8vICAgd2lzaCB0byBhdm9pZCByZWZlcmVuY2luZyB0aGUgYGF0b21gIGdsb2JhbC5cbiAgYWRkICguLi5kZXNlcmlhbGl6ZXJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNlcmlhbGl6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZGVzZXJpYWxpemVyID0gZGVzZXJpYWxpemVyc1tpXVxuICAgICAgdGhpcy5kZXNlcmlhbGl6ZXJzW2Rlc2VyaWFsaXplci5uYW1lXSA9IGRlc2VyaWFsaXplclxuICAgIH1cblxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRlc2VyaWFsaXplcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IGRlc2VyaWFsaXplciA9IGRlc2VyaWFsaXplcnNbal1cbiAgICAgICAgZGVsZXRlIHRoaXMuZGVzZXJpYWxpemVyc1tkZXNlcmlhbGl6ZXIubmFtZV1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZ2V0RGVzZXJpYWxpemVyQ291bnQgKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRlc2VyaWFsaXplcnMpLmxlbmd0aFxuICB9XG5cbiAgLy8gUHVibGljOiBEZXNlcmlhbGl6ZSB0aGUgc3RhdGUgYW5kIHBhcmFtcy5cbiAgLy9cbiAgLy8gKiBgc3RhdGVgIFRoZSBzdGF0ZSB7T2JqZWN0fSB0byBkZXNlcmlhbGl6ZS5cbiAgZGVzZXJpYWxpemUgKHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlID09IG51bGwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGRlc2VyaWFsaXplciA9IHRoaXMuZ2V0KHN0YXRlKVxuICAgIGlmIChkZXNlcmlhbGl6ZXIpIHtcbiAgICAgIGxldCBzdGF0ZVZlcnNpb24gPSAoXG4gICAgICAgICh0eXBlb2Ygc3RhdGUuZ2V0ID09PSAnZnVuY3Rpb24nKSAmJiBzdGF0ZS5nZXQoJ3ZlcnNpb24nKSB8fFxuICAgICAgICBzdGF0ZS52ZXJzaW9uXG4gICAgICApXG5cbiAgICAgIGlmICgoZGVzZXJpYWxpemVyLnZlcnNpb24gIT0gbnVsbCkgJiYgZGVzZXJpYWxpemVyLnZlcnNpb24gIT09IHN0YXRlVmVyc2lvbikge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXNlcmlhbGl6ZXIuZGVzZXJpYWxpemUoc3RhdGUsIHRoaXMuYXRvbUVudmlyb25tZW50KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29uc29sZS53YXJuKCdObyBkZXNlcmlhbGl6ZXIgZm91bmQgZm9yJywgc3RhdGUpXG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IHRoZSBkZXNlcmlhbGl6ZXIgZm9yIHRoZSBzdGF0ZS5cbiAgLy9cbiAgLy8gKiBgc3RhdGVgIFRoZSBzdGF0ZSB7T2JqZWN0fSBiZWluZyBkZXNlcmlhbGl6ZWQuXG4gIGdldCAoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgbGV0IHN0YXRlRGVzZXJpYWxpemVyID0gKFxuICAgICAgKHR5cGVvZiBzdGF0ZS5nZXQgPT09ICdmdW5jdGlvbicpICYmIHN0YXRlLmdldCgnZGVzZXJpYWxpemVyJykgfHxcbiAgICAgIHN0YXRlLmRlc2VyaWFsaXplclxuICAgIClcblxuICAgIHJldHVybiB0aGlzLmRlc2VyaWFsaXplcnNbc3RhdGVEZXNlcmlhbGl6ZXJdXG4gIH1cblxuICBjbGVhciAoKSB7XG4gICAgdGhpcy5kZXNlcmlhbGl6ZXJzID0ge31cbiAgfVxufVxuIl19