(function() {
  var Input, ViewModel, VimNormalModeInputElement;

  VimNormalModeInputElement = require('./vim-normal-mode-input-element');

  ViewModel = (function() {
    function ViewModel(operation, opts) {
      var ref;
      this.operation = operation;
      if (opts == null) {
        opts = {};
      }
      ref = this.operation, this.editor = ref.editor, this.vimState = ref.vimState;
      this.view = new VimNormalModeInputElement().initialize(this, atom.views.getView(this.editor), opts);
      this.editor.normalModeInputView = this.view;
      this.vimState.onDidFailToCompose((function(_this) {
        return function() {
          return _this.view.remove();
        };
      })(this));
    }

    ViewModel.prototype.confirm = function(view) {
      return this.vimState.pushOperations(new Input(this.view.value));
    };

    ViewModel.prototype.cancel = function(view) {
      if (this.vimState.isOperatorPending()) {
        this.vimState.pushOperations(new Input(''));
      }
      return delete this.editor.normalModeInputView;
    };

    return ViewModel;

  })();

  Input = (function() {
    function Input(characters) {
      this.characters = characters;
    }

    Input.prototype.isComplete = function() {
      return true;
    };

    Input.prototype.isRecordable = function() {
      return true;
    };

    return Input;

  })();

  module.exports = {
    ViewModel: ViewModel,
    Input: Input
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS9saWIvdmlldy1tb2RlbHMvdmlldy1tb2RlbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLHlCQUFBLEdBQTRCLE9BQUEsQ0FBUSxpQ0FBUjs7RUFFdEI7SUFDUyxtQkFBQyxTQUFELEVBQWEsSUFBYjtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsWUFBRDs7UUFBWSxPQUFLOztNQUM3QixNQUF1QixJQUFDLENBQUEsU0FBeEIsRUFBQyxJQUFDLENBQUEsYUFBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLGVBQUE7TUFDWCxJQUFDLENBQUEsSUFBRCxHQUFZLElBQUEseUJBQUEsQ0FBQSxDQUEyQixDQUFDLFVBQTVCLENBQXVDLElBQXZDLEVBQTZDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsTUFBcEIsQ0FBN0MsRUFBMEUsSUFBMUU7TUFDWixJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLEdBQThCLElBQUMsQ0FBQTtNQUMvQixJQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFWLENBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QjtJQUpXOzt3QkFNYixPQUFBLEdBQVMsU0FBQyxJQUFEO2FBQ1AsSUFBQyxDQUFBLFFBQVEsQ0FBQyxjQUFWLENBQTZCLElBQUEsS0FBQSxDQUFNLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBWixDQUE3QjtJQURPOzt3QkFHVCxNQUFBLEdBQVEsU0FBQyxJQUFEO01BQ04sSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLGlCQUFWLENBQUEsQ0FBSDtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsY0FBVixDQUE2QixJQUFBLEtBQUEsQ0FBTSxFQUFOLENBQTdCLEVBREY7O2FBRUEsT0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDO0lBSFQ7Ozs7OztFQUtKO0lBQ1MsZUFBQyxVQUFEO01BQUMsSUFBQyxDQUFBLGFBQUQ7SUFBRDs7b0JBQ2IsVUFBQSxHQUFZLFNBQUE7YUFBRztJQUFIOztvQkFDWixZQUFBLEdBQWMsU0FBQTthQUFHO0lBQUg7Ozs7OztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLFdBQUEsU0FEZTtJQUNKLE9BQUEsS0FESTs7QUF0QmpCIiwic291cmNlc0NvbnRlbnQiOlsiVmltTm9ybWFsTW9kZUlucHV0RWxlbWVudCA9IHJlcXVpcmUgJy4vdmltLW5vcm1hbC1tb2RlLWlucHV0LWVsZW1lbnQnXG5cbmNsYXNzIFZpZXdNb2RlbFxuICBjb25zdHJ1Y3RvcjogKEBvcGVyYXRpb24sIG9wdHM9e30pIC0+XG4gICAge0BlZGl0b3IsIEB2aW1TdGF0ZX0gPSBAb3BlcmF0aW9uXG4gICAgQHZpZXcgPSBuZXcgVmltTm9ybWFsTW9kZUlucHV0RWxlbWVudCgpLmluaXRpYWxpemUodGhpcywgYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpLCBvcHRzKVxuICAgIEBlZGl0b3Iubm9ybWFsTW9kZUlucHV0VmlldyA9IEB2aWV3XG4gICAgQHZpbVN0YXRlLm9uRGlkRmFpbFRvQ29tcG9zZSA9PiBAdmlldy5yZW1vdmUoKVxuXG4gIGNvbmZpcm06ICh2aWV3KSAtPlxuICAgIEB2aW1TdGF0ZS5wdXNoT3BlcmF0aW9ucyhuZXcgSW5wdXQoQHZpZXcudmFsdWUpKVxuXG4gIGNhbmNlbDogKHZpZXcpIC0+XG4gICAgaWYgQHZpbVN0YXRlLmlzT3BlcmF0b3JQZW5kaW5nKClcbiAgICAgIEB2aW1TdGF0ZS5wdXNoT3BlcmF0aW9ucyhuZXcgSW5wdXQoJycpKVxuICAgIGRlbGV0ZSBAZWRpdG9yLm5vcm1hbE1vZGVJbnB1dFZpZXdcblxuY2xhc3MgSW5wdXRcbiAgY29uc3RydWN0b3I6IChAY2hhcmFjdGVycykgLT5cbiAgaXNDb21wbGV0ZTogLT4gdHJ1ZVxuICBpc1JlY29yZGFibGU6IC0+IHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFZpZXdNb2RlbCwgSW5wdXRcbn1cbiJdfQ==
