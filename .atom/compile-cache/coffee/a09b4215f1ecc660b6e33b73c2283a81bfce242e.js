(function() {
  var CustomGutterComponent, GutterContainerComponent, LineNumberGutterComponent, _;

  _ = require('underscore-plus');

  CustomGutterComponent = require('./custom-gutter-component');

  LineNumberGutterComponent = require('./line-number-gutter-component');

  module.exports = GutterContainerComponent = (function() {
    function GutterContainerComponent(arg) {
      this.onLineNumberGutterMouseDown = arg.onLineNumberGutterMouseDown, this.editor = arg.editor, this.domElementPool = arg.domElementPool, this.views = arg.views;
      this.gutterComponents = [];
      this.gutterComponentsByGutterName = {};
      this.lineNumberGutterComponent = null;
      this.domNode = document.createElement('div');
      this.domNode.classList.add('gutter-container');
      this.domNode.style.display = 'flex';
    }

    GutterContainerComponent.prototype.destroy = function() {
      var component, i, len, ref;
      ref = this.gutterComponents;
      for (i = 0, len = ref.length; i < len; i++) {
        component = ref[i].component;
        if (typeof component.destroy === "function") {
          component.destroy();
        }
      }
    };

    GutterContainerComponent.prototype.getDomNode = function() {
      return this.domNode;
    };

    GutterContainerComponent.prototype.getLineNumberGutterComponent = function() {
      return this.lineNumberGutterComponent;
    };

    GutterContainerComponent.prototype.updateSync = function(state) {
      var content, gutter, gutterComponent, gutterSubstate, i, len, newGutterComponents, newGutterComponentsByGutterName, newState, ref, styles, visible;
      newState = state.gutters;
      newGutterComponents = [];
      newGutterComponentsByGutterName = {};
      for (i = 0, len = newState.length; i < len; i++) {
        ref = newState[i], gutter = ref.gutter, visible = ref.visible, styles = ref.styles, content = ref.content;
        gutterComponent = this.gutterComponentsByGutterName[gutter.name];
        if (!gutterComponent) {
          if (gutter.name === 'line-number') {
            gutterComponent = new LineNumberGutterComponent({
              onMouseDown: this.onLineNumberGutterMouseDown,
              editor: this.editor,
              gutter: gutter,
              domElementPool: this.domElementPool,
              views: this.views
            });
            this.lineNumberGutterComponent = gutterComponent;
          } else {
            gutterComponent = new CustomGutterComponent({
              gutter: gutter,
              views: this.views
            });
          }
        }
        if (visible) {
          gutterComponent.showNode();
        } else {
          gutterComponent.hideNode();
        }
        if (gutter.name === 'line-number') {
          gutterSubstate = _.clone(content);
          gutterSubstate.styles = styles;
        } else {
          gutterSubstate = {
            content: content,
            styles: styles
          };
        }
        gutterComponent.updateSync(gutterSubstate);
        newGutterComponents.push({
          name: gutter.name,
          component: gutterComponent
        });
        newGutterComponentsByGutterName[gutter.name] = gutterComponent;
      }
      this.reorderGutters(newGutterComponents, newGutterComponentsByGutterName);
      this.gutterComponents = newGutterComponents;
      return this.gutterComponentsByGutterName = newGutterComponentsByGutterName;
    };


    /*
    Section: Private Methods
     */

    GutterContainerComponent.prototype.reorderGutters = function(newGutterComponents, newGutterComponentsByGutterName) {
      var existingGutterComponent, existingGutterComponentDescription, gutterComponent, gutterComponentDescription, gutterName, i, indexInOldGutters, j, len, len1, matchingGutterFound, oldGuttersLength, ref, results;
      indexInOldGutters = 0;
      oldGuttersLength = this.gutterComponents.length;
      for (i = 0, len = newGutterComponents.length; i < len; i++) {
        gutterComponentDescription = newGutterComponents[i];
        gutterComponent = gutterComponentDescription.component;
        gutterName = gutterComponentDescription.name;
        if (this.gutterComponentsByGutterName[gutterName]) {
          matchingGutterFound = false;
          while (indexInOldGutters < oldGuttersLength) {
            existingGutterComponentDescription = this.gutterComponents[indexInOldGutters];
            existingGutterComponent = existingGutterComponentDescription.component;
            indexInOldGutters++;
            if (existingGutterComponent === gutterComponent) {
              matchingGutterFound = true;
              break;
            }
          }
          if (!matchingGutterFound) {
            gutterComponent.getDomNode().remove();
            this.domNode.appendChild(gutterComponent.getDomNode());
          }
        } else {
          if (indexInOldGutters === oldGuttersLength) {
            this.domNode.appendChild(gutterComponent.getDomNode());
          } else {
            this.domNode.insertBefore(gutterComponent.getDomNode(), this.domNode.children[indexInOldGutters]);
          }
        }
      }
      ref = this.gutterComponents;
      results = [];
      for (j = 0, len1 = ref.length; j < len1; j++) {
        gutterComponentDescription = ref[j];
        if (!newGutterComponentsByGutterName[gutterComponentDescription.name]) {
          gutterComponent = gutterComponentDescription.component;
          results.push(gutterComponent.getDomNode().remove());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return GutterContainerComponent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9ndXR0ZXItY29udGFpbmVyLWNvbXBvbmVudC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0oscUJBQUEsR0FBd0IsT0FBQSxDQUFRLDJCQUFSOztFQUN4Qix5QkFBQSxHQUE0QixPQUFBLENBQVEsZ0NBQVI7O0VBSzVCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxrQ0FBQyxHQUFEO01BQUUsSUFBQyxDQUFBLGtDQUFBLDZCQUE2QixJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSxxQkFBQSxnQkFBZ0IsSUFBQyxDQUFBLFlBQUE7TUFFdEUsSUFBQyxDQUFBLGdCQUFELEdBQW9CO01BQ3BCLElBQUMsQ0FBQSw0QkFBRCxHQUFnQztNQUNoQyxJQUFDLENBQUEseUJBQUQsR0FBNkI7TUFFN0IsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLGtCQUF2QjtNQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQWYsR0FBeUI7SUFSZDs7dUNBVWIsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBO1FBQUs7O1VBQ0gsU0FBUyxDQUFDOztBQURaO0lBRE87O3VDQUtULFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBO0lBRFM7O3VDQUdaLDRCQUFBLEdBQThCLFNBQUE7YUFDNUIsSUFBQyxDQUFBO0lBRDJCOzt1Q0FHOUIsVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUdWLFVBQUE7TUFBQSxRQUFBLEdBQVcsS0FBSyxDQUFDO01BRWpCLG1CQUFBLEdBQXNCO01BQ3RCLCtCQUFBLEdBQWtDO0FBQ2xDLFdBQUEsMENBQUE7MkJBQUsscUJBQVEsdUJBQVMscUJBQVE7UUFDNUIsZUFBQSxHQUFrQixJQUFDLENBQUEsNEJBQTZCLENBQUEsTUFBTSxDQUFDLElBQVA7UUFDaEQsSUFBRyxDQUFJLGVBQVA7VUFDRSxJQUFHLE1BQU0sQ0FBQyxJQUFQLEtBQWUsYUFBbEI7WUFDRSxlQUFBLEdBQXNCLElBQUEseUJBQUEsQ0FBMEI7Y0FBQyxXQUFBLEVBQWEsSUFBQyxDQUFBLDJCQUFmO2NBQTZDLFFBQUQsSUFBQyxDQUFBLE1BQTdDO2NBQXFELFFBQUEsTUFBckQ7Y0FBOEQsZ0JBQUQsSUFBQyxDQUFBLGNBQTlEO2NBQStFLE9BQUQsSUFBQyxDQUFBLEtBQS9FO2FBQTFCO1lBQ3RCLElBQUMsQ0FBQSx5QkFBRCxHQUE2QixnQkFGL0I7V0FBQSxNQUFBO1lBSUUsZUFBQSxHQUFzQixJQUFBLHFCQUFBLENBQXNCO2NBQUMsUUFBQSxNQUFEO2NBQVUsT0FBRCxJQUFDLENBQUEsS0FBVjthQUF0QixFQUp4QjtXQURGOztRQU9BLElBQUcsT0FBSDtVQUFnQixlQUFlLENBQUMsUUFBaEIsQ0FBQSxFQUFoQjtTQUFBLE1BQUE7VUFBZ0QsZUFBZSxDQUFDLFFBQWhCLENBQUEsRUFBaEQ7O1FBRUEsSUFBRyxNQUFNLENBQUMsSUFBUCxLQUFlLGFBQWxCO1VBR0UsY0FBQSxHQUFpQixDQUFDLENBQUMsS0FBRixDQUFRLE9BQVI7VUFDakIsY0FBYyxDQUFDLE1BQWYsR0FBd0IsT0FKMUI7U0FBQSxNQUFBO1VBUUUsY0FBQSxHQUFpQjtZQUFDLFNBQUEsT0FBRDtZQUFVLFFBQUEsTUFBVjtZQVJuQjs7UUFTQSxlQUFlLENBQUMsVUFBaEIsQ0FBMkIsY0FBM0I7UUFFQSxtQkFBbUIsQ0FBQyxJQUFwQixDQUF5QjtVQUN2QixJQUFBLEVBQU0sTUFBTSxDQUFDLElBRFU7VUFFdkIsU0FBQSxFQUFXLGVBRlk7U0FBekI7UUFJQSwrQkFBZ0MsQ0FBQSxNQUFNLENBQUMsSUFBUCxDQUFoQyxHQUErQztBQTFCakQ7TUE0QkEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsbUJBQWhCLEVBQXFDLCtCQUFyQztNQUVBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjthQUNwQixJQUFDLENBQUEsNEJBQUQsR0FBZ0M7SUF0Q3RCOzs7QUF3Q1o7Ozs7dUNBSUEsY0FBQSxHQUFnQixTQUFDLG1CQUFELEVBQXNCLCtCQUF0QjtBQUVkLFVBQUE7TUFBQSxpQkFBQSxHQUFvQjtNQUNwQixnQkFBQSxHQUFtQixJQUFDLENBQUEsZ0JBQWdCLENBQUM7QUFFckMsV0FBQSxxREFBQTs7UUFDRSxlQUFBLEdBQWtCLDBCQUEwQixDQUFDO1FBQzdDLFVBQUEsR0FBYSwwQkFBMEIsQ0FBQztRQUV4QyxJQUFHLElBQUMsQ0FBQSw0QkFBNkIsQ0FBQSxVQUFBLENBQWpDO1VBR0UsbUJBQUEsR0FBc0I7QUFDdEIsaUJBQU0saUJBQUEsR0FBb0IsZ0JBQTFCO1lBQ0Usa0NBQUEsR0FBcUMsSUFBQyxDQUFBLGdCQUFpQixDQUFBLGlCQUFBO1lBQ3ZELHVCQUFBLEdBQTBCLGtDQUFrQyxDQUFDO1lBQzdELGlCQUFBO1lBQ0EsSUFBRyx1QkFBQSxLQUEyQixlQUE5QjtjQUNFLG1CQUFBLEdBQXNCO0FBQ3RCLG9CQUZGOztVQUpGO1VBT0EsSUFBRyxDQUFJLG1CQUFQO1lBR0UsZUFBZSxDQUFDLFVBQWhCLENBQUEsQ0FBNEIsQ0FBQyxNQUE3QixDQUFBO1lBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULENBQXFCLGVBQWUsQ0FBQyxVQUFoQixDQUFBLENBQXJCLEVBSkY7V0FYRjtTQUFBLE1BQUE7VUFrQkUsSUFBRyxpQkFBQSxLQUFxQixnQkFBeEI7WUFDRSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsZUFBZSxDQUFDLFVBQWhCLENBQUEsQ0FBckIsRUFERjtXQUFBLE1BQUE7WUFHRSxJQUFDLENBQUEsT0FBTyxDQUFDLFlBQVQsQ0FBc0IsZUFBZSxDQUFDLFVBQWhCLENBQUEsQ0FBdEIsRUFBb0QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFTLENBQUEsaUJBQUEsQ0FBdEUsRUFIRjtXQWxCRjs7QUFKRjtBQTRCQTtBQUFBO1dBQUEsdUNBQUE7O1FBQ0UsSUFBRyxDQUFJLCtCQUFnQyxDQUFBLDBCQUEwQixDQUFDLElBQTNCLENBQXZDO1VBQ0UsZUFBQSxHQUFrQiwwQkFBMEIsQ0FBQzt1QkFDN0MsZUFBZSxDQUFDLFVBQWhCLENBQUEsQ0FBNEIsQ0FBQyxNQUE3QixDQUFBLEdBRkY7U0FBQSxNQUFBOytCQUFBOztBQURGOztJQWpDYzs7Ozs7QUExRWxCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbkN1c3RvbUd1dHRlckNvbXBvbmVudCA9IHJlcXVpcmUgJy4vY3VzdG9tLWd1dHRlci1jb21wb25lbnQnXG5MaW5lTnVtYmVyR3V0dGVyQ29tcG9uZW50ID0gcmVxdWlyZSAnLi9saW5lLW51bWJlci1ndXR0ZXItY29tcG9uZW50J1xuXG4jIFRoZSBHdXR0ZXJDb250YWluZXJDb21wb25lbnQgbWFuYWdlcyB0aGUgR3V0dGVyQ29tcG9uZW50cyBvZiBhIHBhcnRpY3VsYXJcbiMgVGV4dEVkaXRvckNvbXBvbmVudC5cblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR3V0dGVyQ29udGFpbmVyQ29tcG9uZW50XG4gIGNvbnN0cnVjdG9yOiAoe0BvbkxpbmVOdW1iZXJHdXR0ZXJNb3VzZURvd24sIEBlZGl0b3IsIEBkb21FbGVtZW50UG9vbCwgQHZpZXdzfSkgLT5cbiAgICAjIEFuIGFycmF5IG9mIG9iamVjdHMgb2YgdGhlIGZvcm06IHtuYW1lOiB7U3RyaW5nfSwgY29tcG9uZW50OiB7T2JqZWN0fX1cbiAgICBAZ3V0dGVyQ29tcG9uZW50cyA9IFtdXG4gICAgQGd1dHRlckNvbXBvbmVudHNCeUd1dHRlck5hbWUgPSB7fVxuICAgIEBsaW5lTnVtYmVyR3V0dGVyQ29tcG9uZW50ID0gbnVsbFxuXG4gICAgQGRvbU5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIEBkb21Ob2RlLmNsYXNzTGlzdC5hZGQoJ2d1dHRlci1jb250YWluZXInKVxuICAgIEBkb21Ob2RlLnN0eWxlLmRpc3BsYXkgPSAnZmxleCdcblxuICBkZXN0cm95OiAtPlxuICAgIGZvciB7Y29tcG9uZW50fSBpbiBAZ3V0dGVyQ29tcG9uZW50c1xuICAgICAgY29tcG9uZW50LmRlc3Ryb3k/KClcbiAgICByZXR1cm5cblxuICBnZXREb21Ob2RlOiAtPlxuICAgIEBkb21Ob2RlXG5cbiAgZ2V0TGluZU51bWJlckd1dHRlckNvbXBvbmVudDogLT5cbiAgICBAbGluZU51bWJlckd1dHRlckNvbXBvbmVudFxuXG4gIHVwZGF0ZVN5bmM6IChzdGF0ZSkgLT5cbiAgICAjIFRoZSBHdXR0ZXJDb250YWluZXJDb21wb25lbnQgZXhwZWN0cyB0aGUgZ3V0dGVycyB0byBiZSBzb3J0ZWQgaW4gdGhlIG9yZGVyXG4gICAgIyB0aGV5IHNob3VsZCBhcHBlYXIuXG4gICAgbmV3U3RhdGUgPSBzdGF0ZS5ndXR0ZXJzXG5cbiAgICBuZXdHdXR0ZXJDb21wb25lbnRzID0gW11cbiAgICBuZXdHdXR0ZXJDb21wb25lbnRzQnlHdXR0ZXJOYW1lID0ge31cbiAgICBmb3Ige2d1dHRlciwgdmlzaWJsZSwgc3R5bGVzLCBjb250ZW50fSBpbiBuZXdTdGF0ZVxuICAgICAgZ3V0dGVyQ29tcG9uZW50ID0gQGd1dHRlckNvbXBvbmVudHNCeUd1dHRlck5hbWVbZ3V0dGVyLm5hbWVdXG4gICAgICBpZiBub3QgZ3V0dGVyQ29tcG9uZW50XG4gICAgICAgIGlmIGd1dHRlci5uYW1lIGlzICdsaW5lLW51bWJlcidcbiAgICAgICAgICBndXR0ZXJDb21wb25lbnQgPSBuZXcgTGluZU51bWJlckd1dHRlckNvbXBvbmVudCh7b25Nb3VzZURvd246IEBvbkxpbmVOdW1iZXJHdXR0ZXJNb3VzZURvd24sIEBlZGl0b3IsIGd1dHRlciwgQGRvbUVsZW1lbnRQb29sLCBAdmlld3N9KVxuICAgICAgICAgIEBsaW5lTnVtYmVyR3V0dGVyQ29tcG9uZW50ID0gZ3V0dGVyQ29tcG9uZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBndXR0ZXJDb21wb25lbnQgPSBuZXcgQ3VzdG9tR3V0dGVyQ29tcG9uZW50KHtndXR0ZXIsIEB2aWV3c30pXG5cbiAgICAgIGlmIHZpc2libGUgdGhlbiBndXR0ZXJDb21wb25lbnQuc2hvd05vZGUoKSBlbHNlIGd1dHRlckNvbXBvbmVudC5oaWRlTm9kZSgpXG4gICAgICAjIFBhc3MgdGhlIGd1dHRlciBvbmx5IHRoZSBzdGF0ZSB0aGF0IGl0IG5lZWRzLlxuICAgICAgaWYgZ3V0dGVyLm5hbWUgaXMgJ2xpbmUtbnVtYmVyJ1xuICAgICAgICAjIEZvciBlYXNlIG9mIHVzZSBpbiB0aGUgbGluZSBudW1iZXIgZ3V0dGVyIGNvbXBvbmVudCwgc2V0IHRoZSBzaGFyZWRcbiAgICAgICAgIyAnc3R5bGVzJyBhcyBhIGZpZWxkIHVuZGVyIHRoZSAnY29udGVudCcuXG4gICAgICAgIGd1dHRlclN1YnN0YXRlID0gXy5jbG9uZShjb250ZW50KVxuICAgICAgICBndXR0ZXJTdWJzdGF0ZS5zdHlsZXMgPSBzdHlsZXNcbiAgICAgIGVsc2VcbiAgICAgICAgIyBDdXN0b20gZ3V0dGVyICdjb250ZW50JyBpcyBrZXllZCBvbiBndXR0ZXIgbmFtZSwgc28gd2UgY2Fubm90IHNldFxuICAgICAgICAjICdzdHlsZXMnIGFzIGEgc3ViZmllbGQgZGlyZWN0bHkgdW5kZXIgaXQuXG4gICAgICAgIGd1dHRlclN1YnN0YXRlID0ge2NvbnRlbnQsIHN0eWxlc31cbiAgICAgIGd1dHRlckNvbXBvbmVudC51cGRhdGVTeW5jKGd1dHRlclN1YnN0YXRlKVxuXG4gICAgICBuZXdHdXR0ZXJDb21wb25lbnRzLnB1c2goe1xuICAgICAgICBuYW1lOiBndXR0ZXIubmFtZSxcbiAgICAgICAgY29tcG9uZW50OiBndXR0ZXJDb21wb25lbnQsXG4gICAgICB9KVxuICAgICAgbmV3R3V0dGVyQ29tcG9uZW50c0J5R3V0dGVyTmFtZVtndXR0ZXIubmFtZV0gPSBndXR0ZXJDb21wb25lbnRcblxuICAgIEByZW9yZGVyR3V0dGVycyhuZXdHdXR0ZXJDb21wb25lbnRzLCBuZXdHdXR0ZXJDb21wb25lbnRzQnlHdXR0ZXJOYW1lKVxuXG4gICAgQGd1dHRlckNvbXBvbmVudHMgPSBuZXdHdXR0ZXJDb21wb25lbnRzXG4gICAgQGd1dHRlckNvbXBvbmVudHNCeUd1dHRlck5hbWUgPSBuZXdHdXR0ZXJDb21wb25lbnRzQnlHdXR0ZXJOYW1lXG5cbiAgIyMjXG4gIFNlY3Rpb246IFByaXZhdGUgTWV0aG9kc1xuICAjIyNcblxuICByZW9yZGVyR3V0dGVyczogKG5ld0d1dHRlckNvbXBvbmVudHMsIG5ld0d1dHRlckNvbXBvbmVudHNCeUd1dHRlck5hbWUpIC0+XG4gICAgIyBGaXJzdCwgaW5zZXJ0IG5ldyBndXR0ZXJzIGludG8gdGhlIERPTS5cbiAgICBpbmRleEluT2xkR3V0dGVycyA9IDBcbiAgICBvbGRHdXR0ZXJzTGVuZ3RoID0gQGd1dHRlckNvbXBvbmVudHMubGVuZ3RoXG5cbiAgICBmb3IgZ3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24gaW4gbmV3R3V0dGVyQ29tcG9uZW50c1xuICAgICAgZ3V0dGVyQ29tcG9uZW50ID0gZ3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24uY29tcG9uZW50XG4gICAgICBndXR0ZXJOYW1lID0gZ3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24ubmFtZVxuXG4gICAgICBpZiBAZ3V0dGVyQ29tcG9uZW50c0J5R3V0dGVyTmFtZVtndXR0ZXJOYW1lXVxuICAgICAgICAjIElmIHRoZSBndXR0ZXIgZXhpc3RlZCBwcmV2aW91c2x5LCB3ZSBmaXJzdCB0cnkgdG8gbW92ZSB0aGUgY3Vyc29yIHRvXG4gICAgICAgICMgdGhlIHBvaW50IGF0IHdoaWNoIGl0IG9jY3VycyBpbiB0aGUgcHJldmlvdXMgZ3V0dGVycy5cbiAgICAgICAgbWF0Y2hpbmdHdXR0ZXJGb3VuZCA9IGZhbHNlXG4gICAgICAgIHdoaWxlIGluZGV4SW5PbGRHdXR0ZXJzIDwgb2xkR3V0dGVyc0xlbmd0aFxuICAgICAgICAgIGV4aXN0aW5nR3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24gPSBAZ3V0dGVyQ29tcG9uZW50c1tpbmRleEluT2xkR3V0dGVyc11cbiAgICAgICAgICBleGlzdGluZ0d1dHRlckNvbXBvbmVudCA9IGV4aXN0aW5nR3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24uY29tcG9uZW50XG4gICAgICAgICAgaW5kZXhJbk9sZEd1dHRlcnMrK1xuICAgICAgICAgIGlmIGV4aXN0aW5nR3V0dGVyQ29tcG9uZW50IGlzIGd1dHRlckNvbXBvbmVudFxuICAgICAgICAgICAgbWF0Y2hpbmdHdXR0ZXJGb3VuZCA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGlmIG5vdCBtYXRjaGluZ0d1dHRlckZvdW5kXG4gICAgICAgICAgIyBJZiB3ZSd2ZSByZWFjaGVkIHRoaXMgcG9pbnQsIHRoZSBndXR0ZXIgcHJldmlvdXNseSBleGlzdGVkLCBidXQgaXRzXG4gICAgICAgICAgIyBwb3NpdGlvbiBoYXMgbW92ZWQuIFJlbW92ZSBpdCBmcm9tIHRoZSBET00gYW5kIHJlLWluc2VydCBpdC5cbiAgICAgICAgICBndXR0ZXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpLnJlbW92ZSgpXG4gICAgICAgICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoZ3V0dGVyQ29tcG9uZW50LmdldERvbU5vZGUoKSlcblxuICAgICAgZWxzZVxuICAgICAgICBpZiBpbmRleEluT2xkR3V0dGVycyBpcyBvbGRHdXR0ZXJzTGVuZ3RoXG4gICAgICAgICAgQGRvbU5vZGUuYXBwZW5kQ2hpbGQoZ3V0dGVyQ29tcG9uZW50LmdldERvbU5vZGUoKSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBkb21Ob2RlLmluc2VydEJlZm9yZShndXR0ZXJDb21wb25lbnQuZ2V0RG9tTm9kZSgpLCBAZG9tTm9kZS5jaGlsZHJlbltpbmRleEluT2xkR3V0dGVyc10pXG5cbiAgICAjIFJlbW92ZSBhbnkgZ3V0dGVycyB0aGF0IHdlcmUgbm90IHByZXNlbnQgaW4gdGhlIG5ldyBndXR0ZXJzIHN0YXRlLlxuICAgIGZvciBndXR0ZXJDb21wb25lbnREZXNjcmlwdGlvbiBpbiBAZ3V0dGVyQ29tcG9uZW50c1xuICAgICAgaWYgbm90IG5ld0d1dHRlckNvbXBvbmVudHNCeUd1dHRlck5hbWVbZ3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24ubmFtZV1cbiAgICAgICAgZ3V0dGVyQ29tcG9uZW50ID0gZ3V0dGVyQ29tcG9uZW50RGVzY3JpcHRpb24uY29tcG9uZW50XG4gICAgICAgIGd1dHRlckNvbXBvbmVudC5nZXREb21Ob2RlKCkucmVtb3ZlKClcbiJdfQ==
