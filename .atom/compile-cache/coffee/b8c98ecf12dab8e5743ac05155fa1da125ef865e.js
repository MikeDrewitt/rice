(function() {
  var Emitter, Panel;

  Emitter = require('event-kit').Emitter;

  module.exports = Panel = (function() {

    /*
    Section: Construction and Destruction
     */
    function Panel(arg) {
      var ref;
      ref = arg != null ? arg : {}, this.item = ref.item, this.visible = ref.visible, this.priority = ref.priority, this.className = ref.className;
      this.emitter = new Emitter;
      if (this.visible == null) {
        this.visible = true;
      }
      if (this.priority == null) {
        this.priority = 100;
      }
    }

    Panel.prototype.destroy = function() {
      this.hide();
      this.emitter.emit('did-destroy', this);
      return this.emitter.dispose();
    };


    /*
    Section: Event Subscription
     */

    Panel.prototype.onDidChangeVisible = function(callback) {
      return this.emitter.on('did-change-visible', callback);
    };

    Panel.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };


    /*
    Section: Panel Details
     */

    Panel.prototype.getItem = function() {
      return this.item;
    };

    Panel.prototype.getPriority = function() {
      return this.priority;
    };

    Panel.prototype.getClassName = function() {
      return this.className;
    };

    Panel.prototype.isVisible = function() {
      return this.visible;
    };

    Panel.prototype.hide = function() {
      var wasVisible;
      wasVisible = this.visible;
      this.visible = false;
      if (wasVisible) {
        return this.emitter.emit('did-change-visible', this.visible);
      }
    };

    Panel.prototype.show = function() {
      var wasVisible;
      wasVisible = this.visible;
      this.visible = true;
      if (!wasVisible) {
        return this.emitter.emit('did-change-visible', this.visible);
      }
    };

    return Panel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFVBQVcsT0FBQSxDQUFRLFdBQVI7O0VBVVosTUFBTSxDQUFDLE9BQVAsR0FDTTs7QUFDSjs7O0lBSWEsZUFBQyxHQUFEO0FBQ1gsVUFBQTswQkFEWSxNQUF5QyxJQUF4QyxJQUFDLENBQUEsV0FBQSxNQUFNLElBQUMsQ0FBQSxjQUFBLFNBQVMsSUFBQyxDQUFBLGVBQUEsVUFBVSxJQUFDLENBQUEsZ0JBQUE7TUFDMUMsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJOztRQUNmLElBQUMsQ0FBQSxVQUFXOzs7UUFDWixJQUFDLENBQUEsV0FBWTs7SUFIRjs7b0JBTWIsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsSUFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZCxFQUE2QixJQUE3QjthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FBVCxDQUFBO0lBSE87OztBQUtUOzs7O29CQVVBLGtCQUFBLEdBQW9CLFNBQUMsUUFBRDthQUNsQixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxvQkFBWixFQUFrQyxRQUFsQztJQURrQjs7b0JBU3BCLFlBQUEsR0FBYyxTQUFDLFFBQUQ7YUFDWixJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCO0lBRFk7OztBQUdkOzs7O29CQUtBLE9BQUEsR0FBUyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O29CQUdULFdBQUEsR0FBYSxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O29CQUViLFlBQUEsR0FBYyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O29CQUdkLFNBQUEsR0FBVyxTQUFBO2FBQUcsSUFBQyxDQUFBO0lBQUo7O29CQUdYLElBQUEsR0FBTSxTQUFBO0FBQ0osVUFBQTtNQUFBLFVBQUEsR0FBYSxJQUFDLENBQUE7TUFDZCxJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBZ0QsVUFBaEQ7ZUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxvQkFBZCxFQUFvQyxJQUFDLENBQUEsT0FBckMsRUFBQTs7SUFISTs7b0JBTU4sSUFBQSxHQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQTtNQUNkLElBQUMsQ0FBQSxPQUFELEdBQVc7TUFDWCxJQUFBLENBQW9ELFVBQXBEO2VBQUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0JBQWQsRUFBb0MsSUFBQyxDQUFBLE9BQXJDLEVBQUE7O0lBSEk7Ozs7O0FBdkVSIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG4jIEV4dGVuZGVkOiBBIGNvbnRhaW5lciByZXByZXNlbnRpbmcgYSBwYW5lbCBvbiB0aGUgZWRnZXMgb2YgdGhlIGVkaXRvciB3aW5kb3cuXG4jIFlvdSBzaG91bGQgbm90IGNyZWF0ZSBhIGBQYW5lbGAgZGlyZWN0bHksIGluc3RlYWQgdXNlIHtXb3Jrc3BhY2U6OmFkZFRvcFBhbmVsfVxuIyBhbmQgZnJpZW5kcyB0byBhZGQgcGFuZWxzLlxuI1xuIyBFeGFtcGxlczogW3RyZWUtdmlld10oaHR0cHM6Ly9naXRodWIuY29tL2F0b20vdHJlZS12aWV3KSxcbiMgW3N0YXR1cy1iYXJdKGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL3N0YXR1cy1iYXIpLFxuIyBhbmQgW2ZpbmQtYW5kLXJlcGxhY2VdKGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2ZpbmQtYW5kLXJlcGxhY2UpIGFsbCB1c2VcbiMgcGFuZWxzLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFuZWxcbiAgIyMjXG4gIFNlY3Rpb246IENvbnN0cnVjdGlvbiBhbmQgRGVzdHJ1Y3Rpb25cbiAgIyMjXG5cbiAgY29uc3RydWN0b3I6ICh7QGl0ZW0sIEB2aXNpYmxlLCBAcHJpb3JpdHksIEBjbGFzc05hbWV9PXt9KSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAdmlzaWJsZSA/PSB0cnVlXG4gICAgQHByaW9yaXR5ID89IDEwMFxuXG4gICMgUHVibGljOiBEZXN0cm95IGFuZCByZW1vdmUgdGhpcyBwYW5lbCBmcm9tIHRoZSBVSS5cbiAgZGVzdHJveTogLT5cbiAgICBAaGlkZSgpXG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWRlc3Ryb3knLCB0aGlzXG4gICAgQGVtaXR0ZXIuZGlzcG9zZSgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IEV2ZW50IFN1YnNjcmlwdGlvblxuICAjIyNcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBwYW5lIGhpZGRlbiBvciBzaG93bi5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgIyAgICogYHZpc2libGVgIHtCb29sZWFufSB0cnVlIHdoZW4gdGhlIHBhbmVsIGhhcyBiZWVuIHNob3duXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICBvbkRpZENoYW5nZVZpc2libGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS12aXNpYmxlJywgY2FsbGJhY2tcblxuICAjIFB1YmxpYzogSW52b2tlIHRoZSBnaXZlbiBjYWxsYmFjayB3aGVuIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwYW5lIGlzIGRlc3Ryb3llZC5cbiAgIyAgICogYHBhbmVsYCB7UGFuZWx9IHRoaXMgcGFuZWxcbiAgI1xuICAjIFJldHVybnMgYSB7RGlzcG9zYWJsZX0gb24gd2hpY2ggYC5kaXNwb3NlKClgIGNhbiBiZSBjYWxsZWQgdG8gdW5zdWJzY3JpYmUuXG4gIG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG5cbiAgIyMjXG4gIFNlY3Rpb246IFBhbmVsIERldGFpbHNcbiAgIyMjXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgdGhlIHBhbmVsJ3MgaXRlbS5cbiAgZ2V0SXRlbTogLT4gQGl0ZW1cblxuICAjIFB1YmxpYzogUmV0dXJucyBhIHtOdW1iZXJ9IGluZGljYXRpbmcgdGhpcyBwYW5lbCdzIHByaW9yaXR5LlxuICBnZXRQcmlvcml0eTogLT4gQHByaW9yaXR5XG5cbiAgZ2V0Q2xhc3NOYW1lOiAtPiBAY2xhc3NOYW1lXG5cbiAgIyBQdWJsaWM6IFJldHVybnMgYSB7Qm9vbGVhbn0gdHJ1ZSB3aGVuIHRoZSBwYW5lbCBpcyB2aXNpYmxlLlxuICBpc1Zpc2libGU6IC0+IEB2aXNpYmxlXG5cbiAgIyBQdWJsaWM6IEhpZGUgdGhpcyBwYW5lbFxuICBoaWRlOiAtPlxuICAgIHdhc1Zpc2libGUgPSBAdmlzaWJsZVxuICAgIEB2aXNpYmxlID0gZmFsc2VcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtY2hhbmdlLXZpc2libGUnLCBAdmlzaWJsZSBpZiB3YXNWaXNpYmxlXG5cbiAgIyBQdWJsaWM6IFNob3cgdGhpcyBwYW5lbFxuICBzaG93OiAtPlxuICAgIHdhc1Zpc2libGUgPSBAdmlzaWJsZVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1jaGFuZ2UtdmlzaWJsZScsIEB2aXNpYmxlIHVubGVzcyB3YXNWaXNpYmxlXG4iXX0=
