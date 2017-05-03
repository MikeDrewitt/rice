(function() {
  var EncodingStatusView,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EncodingStatusView = (function(superClass) {
    extend(EncodingStatusView, superClass);

    function EncodingStatusView() {
      return EncodingStatusView.__super__.constructor.apply(this, arguments);
    }

    EncodingStatusView.prototype.initialize = function(statusBar, encodings) {
      this.statusBar = statusBar;
      this.encodings = encodings;
      this.classList.add('encoding-status', 'inline-block');
      this.encodingLink = document.createElement('a');
      this.encodingLink.classList.add('inline-block');
      this.encodingLink.href = '#';
      this.appendChild(this.encodingLink);
      return this.handleEvents();
    };

    EncodingStatusView.prototype.attach = function() {
      return this.tile = this.statusBar.addRightTile({
        priority: 11,
        item: this
      });
    };

    EncodingStatusView.prototype.handleEvents = function() {
      var clickHandler;
      this.activeItemSubscription = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          return _this.subscribeToActiveTextEditor();
        };
      })(this));
      clickHandler = (function(_this) {
        return function() {
          atom.commands.dispatch(atom.views.getView(_this.getActiveTextEditor()), 'encoding-selector:show');
          return false;
        };
      })(this);
      this.addEventListener('click', clickHandler);
      this.clickSubscription = {
        dispose: (function(_this) {
          return function() {
            return _this.removeEventListener('click', clickHandler);
          };
        })(this)
      };
      return this.subscribeToActiveTextEditor();
    };

    EncodingStatusView.prototype.destroy = function() {
      var ref, ref1, ref2, ref3, ref4;
      if ((ref = this.activeItemSubscription) != null) {
        ref.dispose();
      }
      if ((ref1 = this.encodingSubscription) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.clickSubscription) != null) {
        ref2.dispose();
      }
      if ((ref3 = this.configSubscription) != null) {
        ref3.off();
      }
      return (ref4 = this.tile) != null ? ref4.destroy() : void 0;
    };

    EncodingStatusView.prototype.getActiveTextEditor = function() {
      return atom.workspace.getActiveTextEditor();
    };

    EncodingStatusView.prototype.subscribeToActiveTextEditor = function() {
      var ref, ref1;
      if ((ref = this.encodingSubscription) != null) {
        ref.dispose();
      }
      this.encodingSubscription = (ref1 = this.getActiveTextEditor()) != null ? ref1.onDidChangeEncoding((function(_this) {
        return function() {
          return _this.updateEncodingText();
        };
      })(this)) : void 0;
      return this.updateEncodingText();
    };

    EncodingStatusView.prototype.updateEncodingText = function() {
      var encoding, ref, ref1, ref2;
      encoding = (ref = this.getActiveTextEditor()) != null ? ref.getEncoding() : void 0;
      if (encoding != null) {
        encoding = encoding.toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, '');
        this.encodingLink.textContent = (ref1 = (ref2 = this.encodings[encoding]) != null ? ref2.status : void 0) != null ? ref1 : encoding;
        this.encodingLink.dataset.encoding = encoding;
        return this.style.display = '';
      } else {
        return this.style.display = 'none';
      }
    };

    return EncodingStatusView;

  })(HTMLDivElement);

  module.exports = document.registerElement('encoding-selector-status', {
    prototype: EncodingStatusView.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9lbmNvZGluZy1zZWxlY3Rvci9saWIvZW5jb2Rpbmctc3RhdHVzLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQSxrQkFBQTtJQUFBOzs7RUFBTTs7Ozs7OztpQ0FDSixVQUFBLEdBQVksU0FBQyxTQUFELEVBQWEsU0FBYjtNQUFDLElBQUMsQ0FBQSxZQUFEO01BQVksSUFBQyxDQUFBLFlBQUQ7TUFDdkIsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLENBQWUsaUJBQWYsRUFBa0MsY0FBbEM7TUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQixRQUFRLENBQUMsYUFBVCxDQUF1QixHQUF2QjtNQUNoQixJQUFDLENBQUEsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUF4QixDQUE0QixjQUE1QjtNQUNBLElBQUMsQ0FBQSxZQUFZLENBQUMsSUFBZCxHQUFxQjtNQUNyQixJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxZQUFkO2FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtJQU5VOztpQ0FRWixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxZQUFYLENBQXdCO1FBQUEsUUFBQSxFQUFVLEVBQVY7UUFBYyxJQUFBLEVBQU0sSUFBcEI7T0FBeEI7SUFERjs7aUNBR1IsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsSUFBQyxDQUFBLHNCQUFELEdBQTBCLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNqRSxLQUFDLENBQUEsMkJBQUQsQ0FBQTtRQURpRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7TUFHMUIsWUFBQSxHQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsS0FBQyxDQUFBLG1CQUFELENBQUEsQ0FBbkIsQ0FBdkIsRUFBbUUsd0JBQW5FO2lCQUNBO1FBRmE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BR2YsSUFBQyxDQUFBLGdCQUFELENBQWtCLE9BQWxCLEVBQTJCLFlBQTNCO01BQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCO1FBQUEsT0FBQSxFQUFTLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLG1CQUFELENBQXFCLE9BQXJCLEVBQThCLFlBQTlCO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVQ7O2FBRXJCLElBQUMsQ0FBQSwyQkFBRCxDQUFBO0lBVlk7O2lDQVlkLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTs7V0FBdUIsQ0FBRSxPQUF6QixDQUFBOzs7WUFDcUIsQ0FBRSxPQUF2QixDQUFBOzs7WUFDa0IsQ0FBRSxPQUFwQixDQUFBOzs7WUFDbUIsQ0FBRSxHQUFyQixDQUFBOzs4Q0FDSyxDQUFFLE9BQVAsQ0FBQTtJQUxPOztpQ0FPVCxtQkFBQSxHQUFxQixTQUFBO2FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtJQURtQjs7aUNBR3JCLDJCQUFBLEdBQTZCLFNBQUE7QUFDM0IsVUFBQTs7V0FBcUIsQ0FBRSxPQUF2QixDQUFBOztNQUNBLElBQUMsQ0FBQSxvQkFBRCxxREFBOEMsQ0FBRSxtQkFBeEIsQ0FBNEMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNsRSxLQUFDLENBQUEsa0JBQUQsQ0FBQTtRQURrRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUM7YUFFeEIsSUFBQyxDQUFBLGtCQUFELENBQUE7SUFKMkI7O2lDQU03QixrQkFBQSxHQUFvQixTQUFBO0FBQ2xCLFVBQUE7TUFBQSxRQUFBLG1EQUFpQyxDQUFFLFdBQXhCLENBQUE7TUFDWCxJQUFHLGdCQUFIO1FBQ0UsUUFBQSxHQUFXLFFBQVEsQ0FBQyxXQUFULENBQUEsQ0FBc0IsQ0FBQyxPQUF2QixDQUErQixvQkFBL0IsRUFBcUQsRUFBckQ7UUFDWCxJQUFDLENBQUEsWUFBWSxDQUFDLFdBQWQsOEZBQTJEO1FBQzNELElBQUMsQ0FBQSxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQXRCLEdBQWlDO2VBQ2pDLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxHQUFpQixHQUpuQjtPQUFBLE1BQUE7ZUFNRSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsR0FBaUIsT0FObkI7O0lBRmtCOzs7O0tBeENXOztFQWtEakMsTUFBTSxDQUFDLE9BQVAsR0FBaUIsUUFBUSxDQUFDLGVBQVQsQ0FBeUIsMEJBQXpCLEVBQXFEO0lBQUEsU0FBQSxFQUFXLGtCQUFrQixDQUFDLFNBQTlCO0dBQXJEO0FBbERqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgVmlldyB0byBzaG93IHRoZSBlbmNvZGluZyBuYW1lIGluIHRoZSBzdGF0dXMgYmFyLlxuY2xhc3MgRW5jb2RpbmdTdGF0dXNWaWV3IGV4dGVuZHMgSFRNTERpdkVsZW1lbnRcbiAgaW5pdGlhbGl6ZTogKEBzdGF0dXNCYXIsIEBlbmNvZGluZ3MpIC0+XG4gICAgQGNsYXNzTGlzdC5hZGQoJ2VuY29kaW5nLXN0YXR1cycsICdpbmxpbmUtYmxvY2snKVxuICAgIEBlbmNvZGluZ0xpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICBAZW5jb2RpbmdMaW5rLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpXG4gICAgQGVuY29kaW5nTGluay5ocmVmID0gJyMnXG4gICAgQGFwcGVuZENoaWxkKEBlbmNvZGluZ0xpbmspXG4gICAgQGhhbmRsZUV2ZW50cygpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEB0aWxlID0gQHN0YXR1c0Jhci5hZGRSaWdodFRpbGUocHJpb3JpdHk6IDExLCBpdGVtOiB0aGlzKVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBAYWN0aXZlSXRlbVN1YnNjcmlwdGlvbiA9IGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gPT5cbiAgICAgIEBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgY2xpY2tIYW5kbGVyID0gPT5cbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KEBnZXRBY3RpdmVUZXh0RWRpdG9yKCkpLCAnZW5jb2Rpbmctc2VsZWN0b3I6c2hvdycpXG4gICAgICBmYWxzZVxuICAgIEBhZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcilcbiAgICBAY2xpY2tTdWJzY3JpcHRpb24gPSBkaXNwb3NlOiA9PiBAcmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbGlja0hhbmRsZXIpXG5cbiAgICBAc3Vic2NyaWJlVG9BY3RpdmVUZXh0RWRpdG9yKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBhY3RpdmVJdGVtU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAZW5jb2RpbmdTdWJzY3JpcHRpb24/LmRpc3Bvc2UoKVxuICAgIEBjbGlja1N1YnNjcmlwdGlvbj8uZGlzcG9zZSgpXG4gICAgQGNvbmZpZ1N1YnNjcmlwdGlvbj8ub2ZmKClcbiAgICBAdGlsZT8uZGVzdHJveSgpXG5cbiAgZ2V0QWN0aXZlVGV4dEVkaXRvcjogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICBzdWJzY3JpYmVUb0FjdGl2ZVRleHRFZGl0b3I6IC0+XG4gICAgQGVuY29kaW5nU3Vic2NyaXB0aW9uPy5kaXNwb3NlKClcbiAgICBAZW5jb2RpbmdTdWJzY3JpcHRpb24gPSBAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5vbkRpZENoYW5nZUVuY29kaW5nID0+XG4gICAgICBAdXBkYXRlRW5jb2RpbmdUZXh0KClcbiAgICBAdXBkYXRlRW5jb2RpbmdUZXh0KClcblxuICB1cGRhdGVFbmNvZGluZ1RleHQ6IC0+XG4gICAgZW5jb2RpbmcgPSBAZ2V0QWN0aXZlVGV4dEVkaXRvcigpPy5nZXRFbmNvZGluZygpXG4gICAgaWYgZW5jb2Rpbmc/XG4gICAgICBlbmNvZGluZyA9IGVuY29kaW5nLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW14wLTlhLXpdfDpcXGR7NH0kL2csICcnKVxuICAgICAgQGVuY29kaW5nTGluay50ZXh0Q29udGVudCA9IEBlbmNvZGluZ3NbZW5jb2RpbmddPy5zdGF0dXMgPyBlbmNvZGluZ1xuICAgICAgQGVuY29kaW5nTGluay5kYXRhc2V0LmVuY29kaW5nID0gZW5jb2RpbmdcbiAgICAgIEBzdHlsZS5kaXNwbGF5ID0gJydcbiAgICBlbHNlXG4gICAgICBAc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnZW5jb2Rpbmctc2VsZWN0b3Itc3RhdHVzJywgcHJvdG90eXBlOiBFbmNvZGluZ1N0YXR1c1ZpZXcucHJvdG90eXBlKVxuIl19
