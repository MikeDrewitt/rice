(function() {
  var EncodingListView, SelectListView, fs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs');

  SelectListView = require('atom-space-pen-views').SelectListView;

  module.exports = EncodingListView = (function(superClass) {
    extend(EncodingListView, superClass);

    function EncodingListView() {
      return EncodingListView.__super__.constructor.apply(this, arguments);
    }

    EncodingListView.prototype.initialize = function(encodings) {
      this.encodings = encodings;
      EncodingListView.__super__.initialize.apply(this, arguments);
      this.panel = atom.workspace.addModalPanel({
        item: this,
        visible: false
      });
      this.addClass('encoding-selector');
      return this.list.addClass('mark-active');
    };

    EncodingListView.prototype.getFilterKey = function() {
      return 'name';
    };

    EncodingListView.prototype.viewForItem = function(encoding) {
      var element;
      element = document.createElement('li');
      if (encoding.id === this.currentEncoding) {
        element.classList.add('active');
      }
      element.textContent = encoding.name;
      element.dataset.encoding = encoding.id;
      return element;
    };

    EncodingListView.prototype.detectEncoding = function() {
      var filePath, iconv, jschardet;
      filePath = this.editor.getPath();
      if (!fs.existsSync(filePath)) {
        return;
      }
      jschardet = require('jschardet');
      iconv = require('iconv-lite');
      return fs.readFile(filePath, (function(_this) {
        return function(error, buffer) {
          var encoding, ref;
          if (error != null) {
            return;
          }
          encoding = ((ref = jschardet.detect(buffer)) != null ? ref : {}).encoding;
          if (encoding === 'ascii') {
            encoding = 'utf8';
          }
          if (!iconv.encodingExists(encoding)) {
            return;
          }
          encoding = encoding.toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, '');
          return _this.editor.setEncoding(encoding);
        };
      })(this));
    };

    EncodingListView.prototype.toggle = function() {
      if (this.panel.isVisible()) {
        return this.cancel();
      } else if (this.editor = atom.workspace.getActiveTextEditor()) {
        return this.attach();
      }
    };

    EncodingListView.prototype.destroy = function() {
      return this.panel.destroy();
    };

    EncodingListView.prototype.cancelled = function() {
      return this.panel.hide();
    };

    EncodingListView.prototype.confirmed = function(encoding) {
      this.cancel();
      if (encoding.id === 'detect') {
        return this.detectEncoding();
      } else {
        return this.editor.setEncoding(encoding.id);
      }
    };

    EncodingListView.prototype.addEncodings = function() {
      var encodingItems, id, names, ref;
      this.currentEncoding = this.editor.getEncoding();
      encodingItems = [];
      if (fs.existsSync(this.editor.getPath())) {
        encodingItems.push({
          id: 'detect',
          name: 'Auto Detect'
        });
      }
      ref = this.encodings;
      for (id in ref) {
        names = ref[id];
        encodingItems.push({
          id: id,
          name: names.list
        });
      }
      return this.setItems(encodingItems);
    };

    EncodingListView.prototype.attach = function() {
      this.storeFocusedElement();
      this.addEncodings();
      this.panel.show();
      return this.focusFilterEditor();
    };

    return EncodingListView;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9lbmNvZGluZy1zZWxlY3Rvci9saWIvZW5jb2RpbmctbGlzdC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0NBQUE7SUFBQTs7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNKLGlCQUFrQixPQUFBLENBQVEsc0JBQVI7O0VBR25CLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7K0JBQ0osVUFBQSxHQUFZLFNBQUMsU0FBRDtNQUFDLElBQUMsQ0FBQSxZQUFEO01BQ1gsa0RBQUEsU0FBQTtNQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQTZCO1FBQUEsSUFBQSxFQUFNLElBQU47UUFBWSxPQUFBLEVBQVMsS0FBckI7T0FBN0I7TUFDVCxJQUFDLENBQUEsUUFBRCxDQUFVLG1CQUFWO2FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsYUFBZjtJQUxVOzsrQkFPWixZQUFBLEdBQWMsU0FBQTthQUNaO0lBRFk7OytCQUdkLFdBQUEsR0FBYSxTQUFDLFFBQUQ7QUFDWCxVQUFBO01BQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLElBQXZCO01BQ1YsSUFBbUMsUUFBUSxDQUFDLEVBQVQsS0FBZSxJQUFDLENBQUEsZUFBbkQ7UUFBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLFFBQXRCLEVBQUE7O01BQ0EsT0FBTyxDQUFDLFdBQVIsR0FBc0IsUUFBUSxDQUFDO01BQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBaEIsR0FBMkIsUUFBUSxDQUFDO2FBQ3BDO0lBTFc7OytCQU9iLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUE7TUFDWCxJQUFBLENBQWMsRUFBRSxDQUFDLFVBQUgsQ0FBYyxRQUFkLENBQWQ7QUFBQSxlQUFBOztNQUVBLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjtNQUNaLEtBQUEsR0FBUSxPQUFBLENBQVEsWUFBUjthQUNSLEVBQUUsQ0FBQyxRQUFILENBQVksUUFBWixFQUFzQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsS0FBRCxFQUFRLE1BQVI7QUFDcEIsY0FBQTtVQUFBLElBQVUsYUFBVjtBQUFBLG1CQUFBOztVQUVDLDZEQUF3QztVQUN6QyxJQUFxQixRQUFBLEtBQVksT0FBakM7WUFBQSxRQUFBLEdBQVcsT0FBWDs7VUFDQSxJQUFBLENBQWMsS0FBSyxDQUFDLGNBQU4sQ0FBcUIsUUFBckIsQ0FBZDtBQUFBLG1CQUFBOztVQUVBLFFBQUEsR0FBVyxRQUFRLENBQUMsV0FBVCxDQUFBLENBQXNCLENBQUMsT0FBdkIsQ0FBK0Isb0JBQS9CLEVBQXFELEVBQXJEO2lCQUNYLEtBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixRQUFwQjtRQVJvQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEI7SUFOYzs7K0JBZ0JoQixNQUFBLEdBQVEsU0FBQTtNQUNOLElBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLENBQUEsQ0FBSDtlQUNFLElBQUMsQ0FBQSxNQUFELENBQUEsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUFiO2VBQ0gsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQURHOztJQUhDOzsrQkFNUixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBO0lBRE87OytCQUdULFNBQUEsR0FBVyxTQUFBO2FBQ1QsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQUE7SUFEUzs7K0JBR1gsU0FBQSxHQUFXLFNBQUMsUUFBRDtNQUNULElBQUMsQ0FBQSxNQUFELENBQUE7TUFFQSxJQUFHLFFBQVEsQ0FBQyxFQUFULEtBQWUsUUFBbEI7ZUFDRSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLFFBQVEsQ0FBQyxFQUE3QixFQUhGOztJQUhTOzsrQkFRWCxZQUFBLEdBQWMsU0FBQTtBQUNaLFVBQUE7TUFBQSxJQUFDLENBQUEsZUFBRCxHQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBQTtNQUNuQixhQUFBLEdBQWdCO01BRWhCLElBQUcsRUFBRSxDQUFDLFVBQUgsQ0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBQSxDQUFkLENBQUg7UUFDRSxhQUFhLENBQUMsSUFBZCxDQUFtQjtVQUFDLEVBQUEsRUFBSSxRQUFMO1VBQWUsSUFBQSxFQUFNLGFBQXJCO1NBQW5CLEVBREY7O0FBR0E7QUFBQSxXQUFBLFNBQUE7O1FBQ0UsYUFBYSxDQUFDLElBQWQsQ0FBbUI7VUFBQyxJQUFBLEVBQUQ7VUFBSyxJQUFBLEVBQU0sS0FBSyxDQUFDLElBQWpCO1NBQW5CO0FBREY7YUFFQSxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVY7SUFUWTs7K0JBV2QsTUFBQSxHQUFRLFNBQUE7TUFDTixJQUFDLENBQUEsbUJBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxZQUFELENBQUE7TUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBSk07Ozs7S0FqRXFCO0FBTC9CIiwic291cmNlc0NvbnRlbnQiOlsiZnMgPSByZXF1aXJlICdmcydcbntTZWxlY3RMaXN0Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuIyBWaWV3IHRvIGRpc3BsYXkgYSBsaXN0IG9mIGVuY29kaW5ncyB0byB1c2UgaW4gdGhlIGN1cnJlbnQgZWRpdG9yLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRW5jb2RpbmdMaXN0VmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3XG4gIGluaXRpYWxpemU6IChAZW5jb2RpbmdzKSAtPlxuICAgIHN1cGVyXG5cbiAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKGl0ZW06IHRoaXMsIHZpc2libGU6IGZhbHNlKVxuICAgIEBhZGRDbGFzcygnZW5jb2Rpbmctc2VsZWN0b3InKVxuICAgIEBsaXN0LmFkZENsYXNzKCdtYXJrLWFjdGl2ZScpXG5cbiAgZ2V0RmlsdGVyS2V5OiAtPlxuICAgICduYW1lJ1xuXG4gIHZpZXdGb3JJdGVtOiAoZW5jb2RpbmcpIC0+XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpIGlmIGVuY29kaW5nLmlkIGlzIEBjdXJyZW50RW5jb2RpbmdcbiAgICBlbGVtZW50LnRleHRDb250ZW50ID0gZW5jb2RpbmcubmFtZVxuICAgIGVsZW1lbnQuZGF0YXNldC5lbmNvZGluZyA9IGVuY29kaW5nLmlkXG4gICAgZWxlbWVudFxuXG4gIGRldGVjdEVuY29kaW5nOiAtPlxuICAgIGZpbGVQYXRoID0gQGVkaXRvci5nZXRQYXRoKClcbiAgICByZXR1cm4gdW5sZXNzIGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpXG5cbiAgICBqc2NoYXJkZXQgPSByZXF1aXJlICdqc2NoYXJkZXQnXG4gICAgaWNvbnYgPSByZXF1aXJlICdpY29udi1saXRlJ1xuICAgIGZzLnJlYWRGaWxlIGZpbGVQYXRoLCAoZXJyb3IsIGJ1ZmZlcikgPT5cbiAgICAgIHJldHVybiBpZiBlcnJvcj9cblxuICAgICAge2VuY29kaW5nfSA9ICBqc2NoYXJkZXQuZGV0ZWN0KGJ1ZmZlcikgPyB7fVxuICAgICAgZW5jb2RpbmcgPSAndXRmOCcgaWYgZW5jb2RpbmcgaXMgJ2FzY2lpJ1xuICAgICAgcmV0dXJuIHVubGVzcyBpY29udi5lbmNvZGluZ0V4aXN0cyhlbmNvZGluZylcblxuICAgICAgZW5jb2RpbmcgPSBlbmNvZGluZy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teMC05YS16XXw6XFxkezR9JC9nLCAnJylcbiAgICAgIEBlZGl0b3Iuc2V0RW5jb2RpbmcoZW5jb2RpbmcpXG5cbiAgdG9nZ2xlOiAtPlxuICAgIGlmIEBwYW5lbC5pc1Zpc2libGUoKVxuICAgICAgQGNhbmNlbCgpXG4gICAgZWxzZSBpZiBAZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICBAYXR0YWNoKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBwYW5lbC5kZXN0cm95KClcblxuICBjYW5jZWxsZWQ6IC0+XG4gICAgQHBhbmVsLmhpZGUoKVxuXG4gIGNvbmZpcm1lZDogKGVuY29kaW5nKSAtPlxuICAgIEBjYW5jZWwoKVxuXG4gICAgaWYgZW5jb2RpbmcuaWQgaXMgJ2RldGVjdCdcbiAgICAgIEBkZXRlY3RFbmNvZGluZygpXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5zZXRFbmNvZGluZyhlbmNvZGluZy5pZClcblxuICBhZGRFbmNvZGluZ3M6IC0+XG4gICAgQGN1cnJlbnRFbmNvZGluZyA9IEBlZGl0b3IuZ2V0RW5jb2RpbmcoKVxuICAgIGVuY29kaW5nSXRlbXMgPSBbXVxuXG4gICAgaWYgZnMuZXhpc3RzU3luYyhAZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgIGVuY29kaW5nSXRlbXMucHVzaCh7aWQ6ICdkZXRlY3QnLCBuYW1lOiAnQXV0byBEZXRlY3QnfSlcblxuICAgIGZvciBpZCwgbmFtZXMgb2YgQGVuY29kaW5nc1xuICAgICAgZW5jb2RpbmdJdGVtcy5wdXNoKHtpZCwgbmFtZTogbmFtZXMubGlzdH0pXG4gICAgQHNldEl0ZW1zKGVuY29kaW5nSXRlbXMpXG5cbiAgYXR0YWNoOiAtPlxuICAgIEBzdG9yZUZvY3VzZWRFbGVtZW50KClcbiAgICBAYWRkRW5jb2RpbmdzKClcbiAgICBAcGFuZWwuc2hvdygpXG4gICAgQGZvY3VzRmlsdGVyRWRpdG9yKClcbiJdfQ==
