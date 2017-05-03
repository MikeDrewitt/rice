Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */
/** @jsx etch.dom */

var _etch = require('etch');

var _etch2 = _interopRequireDefault(_etch);

/*
  Public: Abstract class for handling the initialization
  boilerplate of an Etch component.
*/

var EtchComponent = (function () {
  function EtchComponent(props) {
    _classCallCheck(this, EtchComponent);

    this.props = props;

    _etch2['default'].initialize(this);
    EtchComponent.setScheduler(atom.views);
  }

  /*
    Public: Gets the scheduler Etch uses for coordinating DOM updates.
     Returns a {Scheduler}
  */

  _createClass(EtchComponent, [{
    key: 'update',

    /*
      Public: Updates the component's properties and re-renders it. Only the
      properties you specify in this object will update – any other properties
      the component stores will be unaffected.
       * `props` an {Object} representing the properties you want to update
    */
    value: function update(props) {
      var oldProps = this.props;
      this.props = Object.assign({}, oldProps, props);
      return _etch2['default'].update(this);
    }

    /*
      Public: Destroys the component, removing it from the DOM.
    */
  }, {
    key: 'destroy',
    value: function destroy() {
      _etch2['default'].destroy(this);
    }
  }, {
    key: 'render',
    value: function render() {
      throw new Error('Etch components must implement a `render` method');
    }
  }], [{
    key: 'getScheduler',
    value: function getScheduler() {
      return _etch2['default'].getScheduler();
    }

    /*
      Public: Sets the scheduler Etch uses for coordinating DOM updates.
       * `scheduler` {Scheduler}
    */
  }, {
    key: 'setScheduler',
    value: function setScheduler(scheduler) {
      _etch2['default'].setScheduler(scheduler);
    }
  }]);

  return EtchComponent;
})();

exports['default'] = EtchComponent;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9ub2RlX21vZHVsZXMvYWJvdXQvbGliL2V0Y2gtY29tcG9uZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7b0JBR2lCLE1BQU07Ozs7Ozs7OztJQU1GLGFBQWE7QUFDcEIsV0FETyxhQUFhLENBQ25CLEtBQUssRUFBRTswQkFERCxhQUFhOztBQUU5QixRQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTs7QUFFbEIsc0JBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3JCLGlCQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtHQUN2Qzs7Ozs7OztlQU5rQixhQUFhOzs7Ozs7Ozs7V0FpQ3pCLGdCQUFDLEtBQUssRUFBRTtBQUNiLFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7QUFDekIsVUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDL0MsYUFBTyxrQkFBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDekI7Ozs7Ozs7V0FLTyxtQkFBRztBQUNULHdCQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNuQjs7O1dBRU0sa0JBQUc7QUFDUixZQUFNLElBQUksS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7S0FDcEU7OztXQW5DbUIsd0JBQUc7QUFDckIsYUFBTyxrQkFBSyxZQUFZLEVBQUUsQ0FBQTtLQUMzQjs7Ozs7Ozs7V0FPbUIsc0JBQUMsU0FBUyxFQUFFO0FBQzlCLHdCQUFLLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQTtLQUM3Qjs7O1NBeEJrQixhQUFhOzs7cUJBQWIsYUFBYSIsImZpbGUiOiIvdG1wL3lhb3VydC10bXAtbWljaGFlbC9hdXItYXRvbS1lZGl0b3ItZ2l0L3NyYy9hdG9tL291dC9hcHAvbm9kZV9tb2R1bGVzL2Fib3V0L2xpYi9ldGNoLWNvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cbi8qKiBAanN4IGV0Y2guZG9tICovXG5cbmltcG9ydCBldGNoIGZyb20gJ2V0Y2gnXG5cbi8qXG4gIFB1YmxpYzogQWJzdHJhY3QgY2xhc3MgZm9yIGhhbmRsaW5nIHRoZSBpbml0aWFsaXphdGlvblxuICBib2lsZXJwbGF0ZSBvZiBhbiBFdGNoIGNvbXBvbmVudC5cbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdGNoQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzXG5cbiAgICBldGNoLmluaXRpYWxpemUodGhpcylcbiAgICBFdGNoQ29tcG9uZW50LnNldFNjaGVkdWxlcihhdG9tLnZpZXdzKVxuICB9XG5cbiAgLypcbiAgICBQdWJsaWM6IEdldHMgdGhlIHNjaGVkdWxlciBFdGNoIHVzZXMgZm9yIGNvb3JkaW5hdGluZyBET00gdXBkYXRlcy5cblxuICAgIFJldHVybnMgYSB7U2NoZWR1bGVyfVxuICAqL1xuICBzdGF0aWMgZ2V0U2NoZWR1bGVyICgpIHtcbiAgICByZXR1cm4gZXRjaC5nZXRTY2hlZHVsZXIoKVxuICB9XG5cbiAgLypcbiAgICBQdWJsaWM6IFNldHMgdGhlIHNjaGVkdWxlciBFdGNoIHVzZXMgZm9yIGNvb3JkaW5hdGluZyBET00gdXBkYXRlcy5cblxuICAgICogYHNjaGVkdWxlcmAge1NjaGVkdWxlcn1cbiAgKi9cbiAgc3RhdGljIHNldFNjaGVkdWxlciAoc2NoZWR1bGVyKSB7XG4gICAgZXRjaC5zZXRTY2hlZHVsZXIoc2NoZWR1bGVyKVxuICB9XG5cbiAgLypcbiAgICBQdWJsaWM6IFVwZGF0ZXMgdGhlIGNvbXBvbmVudCdzIHByb3BlcnRpZXMgYW5kIHJlLXJlbmRlcnMgaXQuIE9ubHkgdGhlXG4gICAgcHJvcGVydGllcyB5b3Ugc3BlY2lmeSBpbiB0aGlzIG9iamVjdCB3aWxsIHVwZGF0ZSDigJMgYW55IG90aGVyIHByb3BlcnRpZXNcbiAgICB0aGUgY29tcG9uZW50IHN0b3JlcyB3aWxsIGJlIHVuYWZmZWN0ZWQuXG5cbiAgICAqIGBwcm9wc2AgYW4ge09iamVjdH0gcmVwcmVzZW50aW5nIHRoZSBwcm9wZXJ0aWVzIHlvdSB3YW50IHRvIHVwZGF0ZVxuICAqL1xuICB1cGRhdGUgKHByb3BzKSB7XG4gICAgbGV0IG9sZFByb3BzID0gdGhpcy5wcm9wc1xuICAgIHRoaXMucHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBvbGRQcm9wcywgcHJvcHMpXG4gICAgcmV0dXJuIGV0Y2gudXBkYXRlKHRoaXMpXG4gIH1cblxuICAvKlxuICAgIFB1YmxpYzogRGVzdHJveXMgdGhlIGNvbXBvbmVudCwgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgRE9NLlxuICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICBldGNoLmRlc3Ryb3kodGhpcylcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFdGNoIGNvbXBvbmVudHMgbXVzdCBpbXBsZW1lbnQgYSBgcmVuZGVyYCBtZXRob2QnKVxuICB9XG59XG4iXX0=