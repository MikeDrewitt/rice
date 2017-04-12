(function() {
  var Dialog, InputDialog, os,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Dialog = require("./dialog");

  os = require("os");

  module.exports = InputDialog = (function(superClass) {
    extend(InputDialog, superClass);

    function InputDialog(terminalView) {
      this.terminalView = terminalView;
      InputDialog.__super__.constructor.call(this, {
        prompt: "Insert Text",
        iconClass: "icon-keyboard",
        stayOpen: true
      });
    }

    InputDialog.prototype.onConfirm = function(input) {
      var data, eol;
      if (atom.config.get('terminal-fusion.toggles.runInsertedText')) {
        eol = os.EOL;
      } else {
        eol = '';
      }
      data = "" + input + eol;
      this.terminalView.input(data);
      return this.cancel();
    };

    return InputDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3Rlcm1pbmFsLWZ1c2lvbi9saWIvaW5wdXQtZGlhbG9nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULEVBQUEsR0FBUyxPQUFBLENBQVEsSUFBUjs7RUFFVCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxxQkFBQyxZQUFEO01BQUMsSUFBQyxDQUFBLGVBQUQ7TUFDWiw2Q0FDRTtRQUFBLE1BQUEsRUFBUSxhQUFSO1FBQ0EsU0FBQSxFQUFXLGVBRFg7UUFFQSxRQUFBLEVBQVUsSUFGVjtPQURGO0lBRFc7OzBCQU1iLFNBQUEsR0FBVyxTQUFDLEtBQUQ7QUFDVCxVQUFBO01BQUEsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IseUNBQWhCLENBQUg7UUFDRSxHQUFBLEdBQU0sRUFBRSxDQUFDLElBRFg7T0FBQSxNQUFBO1FBR0UsR0FBQSxHQUFNLEdBSFI7O01BS0EsSUFBQSxHQUFPLEVBQUEsR0FBRyxLQUFILEdBQVc7TUFDbEIsSUFBQyxDQUFBLFlBQVksQ0FBQyxLQUFkLENBQW9CLElBQXBCO2FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQVJTOzs7O0tBUGE7QUFKMUIiLCJzb3VyY2VzQ29udGVudCI6WyJEaWFsb2cgPSByZXF1aXJlIFwiLi9kaWFsb2dcIlxub3MgICAgID0gcmVxdWlyZSBcIm9zXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSW5wdXREaWFsb2cgZXh0ZW5kcyBEaWFsb2dcbiAgY29uc3RydWN0b3I6IChAdGVybWluYWxWaWV3KSAtPlxuICAgIHN1cGVyXG4gICAgICBwcm9tcHQ6IFwiSW5zZXJ0IFRleHRcIlxuICAgICAgaWNvbkNsYXNzOiBcImljb24ta2V5Ym9hcmRcIlxuICAgICAgc3RheU9wZW46IHRydWVcblxuICBvbkNvbmZpcm06IChpbnB1dCkgLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3Rlcm1pbmFsLWZ1c2lvbi50b2dnbGVzLnJ1bkluc2VydGVkVGV4dCcpXG4gICAgICBlb2wgPSBvcy5FT0xcbiAgICBlbHNlXG4gICAgICBlb2wgPSAnJ1xuXG4gICAgZGF0YSA9IFwiI3tpbnB1dH0je2VvbH1cIlxuICAgIEB0ZXJtaW5hbFZpZXcuaW5wdXQgZGF0YVxuICAgIEBjYW5jZWwoKVxuIl19
