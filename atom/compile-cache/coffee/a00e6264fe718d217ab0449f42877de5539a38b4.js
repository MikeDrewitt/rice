(function() {
  var Dialog, RenameDialog,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Dialog = require("./dialog");

  module.exports = RenameDialog = (function(superClass) {
    extend(RenameDialog, superClass);

    function RenameDialog(statusIcon) {
      this.statusIcon = statusIcon;
      RenameDialog.__super__.constructor.call(this, {
        prompt: "Rename",
        iconClass: "icon-pencil",
        placeholderText: this.statusIcon.getName()
      });
    }

    RenameDialog.prototype.onConfirm = function(newTitle) {
      this.statusIcon.updateName(newTitle.trim());
      return this.cancel();
    };

    return RenameDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3Rlcm1pbmFsLWZ1c2lvbi9saWIvcmVuYW1lLWRpYWxvZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9CQUFBO0lBQUE7OztFQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7RUFFVCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxzQkFBQyxVQUFEO01BQUMsSUFBQyxDQUFBLGFBQUQ7TUFDWiw4Q0FDRTtRQUFBLE1BQUEsRUFBUSxRQUFSO1FBQ0EsU0FBQSxFQUFXLGFBRFg7UUFFQSxlQUFBLEVBQWlCLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFBLENBRmpCO09BREY7SUFEVzs7MkJBTWIsU0FBQSxHQUFXLFNBQUMsUUFBRDtNQUNULElBQUMsQ0FBQSxVQUFVLENBQUMsVUFBWixDQUF1QixRQUFRLENBQUMsSUFBVCxDQUFBLENBQXZCO2FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUZTOzs7O0tBUGM7QUFIM0IiLCJzb3VyY2VzQ29udGVudCI6WyJEaWFsb2cgPSByZXF1aXJlIFwiLi9kaWFsb2dcIlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBSZW5hbWVEaWFsb2cgZXh0ZW5kcyBEaWFsb2dcbiAgY29uc3RydWN0b3I6IChAc3RhdHVzSWNvbikgLT5cbiAgICBzdXBlclxuICAgICAgcHJvbXB0OiBcIlJlbmFtZVwiXG4gICAgICBpY29uQ2xhc3M6IFwiaWNvbi1wZW5jaWxcIlxuICAgICAgcGxhY2Vob2xkZXJUZXh0OiBAc3RhdHVzSWNvbi5nZXROYW1lKClcblxuICBvbkNvbmZpcm06IChuZXdUaXRsZSkgLT5cbiAgICBAc3RhdHVzSWNvbi51cGRhdGVOYW1lIG5ld1RpdGxlLnRyaW0oKVxuICAgIEBjYW5jZWwoKVxuIl19
