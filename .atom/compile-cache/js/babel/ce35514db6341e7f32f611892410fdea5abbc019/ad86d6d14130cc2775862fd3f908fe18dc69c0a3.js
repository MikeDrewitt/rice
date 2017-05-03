Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _safeClipboard = require('./safe-clipboard');

var _safeClipboard2 = _interopRequireDefault(_safeClipboard);

// Extended: Represents the clipboard used for copying and pasting in Atom.
//
// An instance of this class is always available as the `atom.clipboard` global.
//
// ## Examples
//
// ```coffee
// atom.clipboard.write('hello')
//
// console.log(atom.clipboard.read()) # 'hello'
// ```

var Clipboard = (function () {
  function Clipboard() {
    _classCallCheck(this, Clipboard);

    this.reset();
  }

  _createClass(Clipboard, [{
    key: 'reset',
    value: function reset() {
      this.metadata = null;
      this.signatureForMetadata = null;
    }

    // Creates an `md5` hash of some text.
    //
    // * `text` A {String} to hash.
    //
    // Returns a hashed {String}.
  }, {
    key: 'md5',
    value: function md5(text) {
      return _crypto2['default'].createHash('md5').update(text, 'utf8').digest('hex');
    }

    // Public: Write the given text to the clipboard.
    //
    // The metadata associated with the text is available by calling
    // {::readWithMetadata}.
    //
    // * `text` The {String} to store.
    // * `metadata` (optional) The additional info to associate with the text.
  }, {
    key: 'write',
    value: function write(text, metadata) {
      this.signatureForMetadata = this.md5(text);
      this.metadata = metadata;
      _safeClipboard2['default'].writeText(text);
    }

    // Public: Read the text from the clipboard.
    //
    // Returns a {String}.
  }, {
    key: 'read',
    value: function read() {
      return _safeClipboard2['default'].readText();
    }

    // Public: Read the text from the clipboard and return both the text and the
    // associated metadata.
    //
    // Returns an {Object} with the following keys:
    // * `text` The {String} clipboard text.
    // * `metadata` The metadata stored by an earlier call to {::write}.
  }, {
    key: 'readWithMetadata',
    value: function readWithMetadata() {
      var text = this.read();
      if (this.signatureForMetadata === this.md5(text)) {
        return { text: text, metadata: this.metadata };
      } else {
        return { text: text };
      }
    }
  }]);

  return Clipboard;
})();

exports['default'] = Clipboard;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvY2xpcGJvYXJkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztzQkFFbUIsUUFBUTs7Ozs2QkFDTCxrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7SUFhbkIsU0FBUztBQUNoQixXQURPLFNBQVMsR0FDYjswQkFESSxTQUFTOztBQUUxQixRQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7R0FDYjs7ZUFIa0IsU0FBUzs7V0FLdEIsaUJBQUc7QUFDUCxVQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQTtBQUNwQixVQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFBO0tBQ2pDOzs7Ozs7Ozs7V0FPRyxhQUFDLElBQUksRUFBRTtBQUNULGFBQU8sb0JBQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ25FOzs7Ozs7Ozs7OztXQVNLLGVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNyQixVQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUMxQyxVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtBQUN4QixpQ0FBVSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDMUI7Ozs7Ozs7V0FLSSxnQkFBRztBQUNOLGFBQU8sMkJBQVUsUUFBUSxFQUFFLENBQUE7S0FDNUI7Ozs7Ozs7Ozs7V0FRZ0IsNEJBQUc7QUFDbEIsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3RCLFVBQUksSUFBSSxDQUFDLG9CQUFvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEQsZUFBTyxFQUFDLElBQUksRUFBSixJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUMsQ0FBQTtPQUN2QyxNQUFNO0FBQ0wsZUFBTyxFQUFDLElBQUksRUFBSixJQUFJLEVBQUMsQ0FBQTtPQUNkO0tBQ0Y7OztTQXBEa0IsU0FBUzs7O3FCQUFULFNBQVMiLCJmaWxlIjoiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jbGlwYm9hcmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJ1xuaW1wb3J0IGNsaXBib2FyZCBmcm9tICcuL3NhZmUtY2xpcGJvYXJkJ1xuXG4vLyBFeHRlbmRlZDogUmVwcmVzZW50cyB0aGUgY2xpcGJvYXJkIHVzZWQgZm9yIGNvcHlpbmcgYW5kIHBhc3RpbmcgaW4gQXRvbS5cbi8vXG4vLyBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGFsd2F5cyBhdmFpbGFibGUgYXMgdGhlIGBhdG9tLmNsaXBib2FyZGAgZ2xvYmFsLlxuLy9cbi8vICMjIEV4YW1wbGVzXG4vL1xuLy8gYGBgY29mZmVlXG4vLyBhdG9tLmNsaXBib2FyZC53cml0ZSgnaGVsbG8nKVxuLy9cbi8vIGNvbnNvbGUubG9nKGF0b20uY2xpcGJvYXJkLnJlYWQoKSkgIyAnaGVsbG8nXG4vLyBgYGBcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaXBib2FyZCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLnJlc2V0KClcbiAgfVxuXG4gIHJlc2V0ICgpIHtcbiAgICB0aGlzLm1ldGFkYXRhID0gbnVsbFxuICAgIHRoaXMuc2lnbmF0dXJlRm9yTWV0YWRhdGEgPSBudWxsXG4gIH1cblxuICAvLyBDcmVhdGVzIGFuIGBtZDVgIGhhc2ggb2Ygc29tZSB0ZXh0LlxuICAvL1xuICAvLyAqIGB0ZXh0YCBBIHtTdHJpbmd9IHRvIGhhc2guXG4gIC8vXG4gIC8vIFJldHVybnMgYSBoYXNoZWQge1N0cmluZ30uXG4gIG1kNSAodGV4dCkge1xuICAgIHJldHVybiBjcnlwdG8uY3JlYXRlSGFzaCgnbWQ1JykudXBkYXRlKHRleHQsICd1dGY4JykuZGlnZXN0KCdoZXgnKVxuICB9XG5cbiAgLy8gUHVibGljOiBXcml0ZSB0aGUgZ2l2ZW4gdGV4dCB0byB0aGUgY2xpcGJvYXJkLlxuICAvL1xuICAvLyBUaGUgbWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSB0ZXh0IGlzIGF2YWlsYWJsZSBieSBjYWxsaW5nXG4gIC8vIHs6OnJlYWRXaXRoTWV0YWRhdGF9LlxuICAvL1xuICAvLyAqIGB0ZXh0YCBUaGUge1N0cmluZ30gdG8gc3RvcmUuXG4gIC8vICogYG1ldGFkYXRhYCAob3B0aW9uYWwpIFRoZSBhZGRpdGlvbmFsIGluZm8gdG8gYXNzb2NpYXRlIHdpdGggdGhlIHRleHQuXG4gIHdyaXRlICh0ZXh0LCBtZXRhZGF0YSkge1xuICAgIHRoaXMuc2lnbmF0dXJlRm9yTWV0YWRhdGEgPSB0aGlzLm1kNSh0ZXh0KVxuICAgIHRoaXMubWV0YWRhdGEgPSBtZXRhZGF0YVxuICAgIGNsaXBib2FyZC53cml0ZVRleHQodGV4dClcbiAgfVxuXG4gIC8vIFB1YmxpYzogUmVhZCB0aGUgdGV4dCBmcm9tIHRoZSBjbGlwYm9hcmQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7U3RyaW5nfS5cbiAgcmVhZCAoKSB7XG4gICAgcmV0dXJuIGNsaXBib2FyZC5yZWFkVGV4dCgpXG4gIH1cblxuICAvLyBQdWJsaWM6IFJlYWQgdGhlIHRleHQgZnJvbSB0aGUgY2xpcGJvYXJkIGFuZCByZXR1cm4gYm90aCB0aGUgdGV4dCBhbmQgdGhlXG4gIC8vIGFzc29jaWF0ZWQgbWV0YWRhdGEuXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge09iamVjdH0gd2l0aCB0aGUgZm9sbG93aW5nIGtleXM6XG4gIC8vICogYHRleHRgIFRoZSB7U3RyaW5nfSBjbGlwYm9hcmQgdGV4dC5cbiAgLy8gKiBgbWV0YWRhdGFgIFRoZSBtZXRhZGF0YSBzdG9yZWQgYnkgYW4gZWFybGllciBjYWxsIHRvIHs6OndyaXRlfS5cbiAgcmVhZFdpdGhNZXRhZGF0YSAoKSB7XG4gICAgbGV0IHRleHQgPSB0aGlzLnJlYWQoKVxuICAgIGlmICh0aGlzLnNpZ25hdHVyZUZvck1ldGFkYXRhID09PSB0aGlzLm1kNSh0ZXh0KSkge1xuICAgICAgcmV0dXJuIHt0ZXh0LCBtZXRhZGF0YTogdGhpcy5tZXRhZGF0YX1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHt0ZXh0fVxuICAgIH1cbiAgfVxufVxuIl19