(function() {
  var CompositeDisposable, CursorStyleManager, Disposable, Point, getCursorNode, getOffset, isSpecMode, lineHeight, ref, setStyle, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Point = ref.Point, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  settings = require('./settings');

  swrap = require('./selection-wrapper');

  isSpecMode = atom.inSpecMode();

  lineHeight = null;

  getCursorNode = function(editorElement, cursor) {
    var cursorsComponent;
    cursorsComponent = editorElement.component.linesComponent.cursorsComponent;
    return cursorsComponent.cursorNodesById[cursor.id];
  };

  getOffset = function(submode, cursor, isSoftWrapped) {
    var bufferPoint, editor, endRow, ref1, screenPoint, selection, startRow, traversal;
    selection = cursor.selection, editor = cursor.editor;
    traversal = new Point(0, 0);
    switch (submode) {
      case 'characterwise':
      case 'blockwise':
        if (!selection.isReversed() && !cursor.isAtBeginningOfLine()) {
          traversal.column -= 1;
        }
        break;
      case 'linewise':
        bufferPoint = swrap(selection).getBufferPositionFor('head', {
          fromProperty: true
        });
        ref1 = selection.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
        if (selection.isReversed()) {
          bufferPoint.row = startRow;
        }
        traversal = isSoftWrapped ? (screenPoint = editor.screenPositionForBufferPosition(bufferPoint), screenPoint.traversalFrom(cursor.getScreenPosition())) : bufferPoint.traversalFrom(cursor.getBufferPosition());
    }
    if (!selection.isReversed() && cursor.isAtBeginningOfLine() && submode !== 'blockwise') {
      traversal.row = -1;
    }
    return traversal;
  };

  setStyle = function(style, arg) {
    var column, row;
    row = arg.row, column = arg.column;
    if (row !== 0) {
      style.setProperty('top', (row * lineHeight) + "em");
    }
    if (column !== 0) {
      style.setProperty('left', column + "ch");
    }
    return new Disposable(function() {
      style.removeProperty('top');
      return style.removeProperty('left');
    });
  };

  CursorStyleManager = (function() {
    function CursorStyleManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editorElement = ref1.editorElement, this.editor = ref1.editor;
      this.lineHeightObserver = atom.config.observe('editor.lineHeight', (function(_this) {
        return function(newValue) {
          lineHeight = newValue;
          return _this.refresh();
        };
      })(this));
    }

    CursorStyleManager.prototype.destroy = function() {
      var ref1, ref2;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.lineHeightObserver.dispose();
      return ref2 = {}, this.subscriptions = ref2.subscriptions, this.lineHeightObserver = ref2.lineHeightObserver, ref2;
    };

    CursorStyleManager.prototype.refresh = function() {
      var cursor, cursorNode, cursors, cursorsToShow, i, isSoftWrapped, j, len, len1, ref1, results, submode;
      submode = this.vimState.submode;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.subscriptions = new CompositeDisposable;
      if (!(this.vimState.isMode('visual') && settings.get('showCursorInVisualMode'))) {
        return;
      }
      cursors = cursorsToShow = this.editor.getCursors();
      if (submode === 'blockwise') {
        cursorsToShow = this.vimState.getBlockwiseSelections().map(function(bs) {
          return bs.getHeadSelection().cursor;
        });
      }
      for (i = 0, len = cursors.length; i < len; i++) {
        cursor = cursors[i];
        if (indexOf.call(cursorsToShow, cursor) >= 0) {
          if (!cursor.isVisible()) {
            cursor.setVisible(true);
          }
        } else {
          if (cursor.isVisible()) {
            cursor.setVisible(false);
          }
        }
      }
      if (submode === 'characterwise' || submode === 'blockwise') {
        this.editorElement.component.updateSync();
      }
      if (isSpecMode) {
        return;
      }
      isSoftWrapped = this.editor.isSoftWrapped();
      results = [];
      for (j = 0, len1 = cursorsToShow.length; j < len1; j++) {
        cursor = cursorsToShow[j];
        if (cursorNode = getCursorNode(this.editorElement, cursor)) {
          results.push(this.subscriptions.add(setStyle(cursorNode.style, getOffset(submode, cursor, isSoftWrapped))));
        }
      }
      return results;
    };

    return CursorStyleManager;

  })();

  module.exports = CursorStyleManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbWljaGFlbC8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9jdXJzb3Itc3R5bGUtbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDRJQUFBO0lBQUE7O0VBQUEsTUFBMkMsT0FBQSxDQUFRLE1BQVIsQ0FBM0MsRUFBQyxpQkFBRCxFQUFRLDJCQUFSLEVBQW9COztFQUVwQixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFDUixVQUFBLEdBQWEsSUFBSSxDQUFDLFVBQUwsQ0FBQTs7RUFDYixVQUFBLEdBQWE7O0VBRWIsYUFBQSxHQUFnQixTQUFDLGFBQUQsRUFBZ0IsTUFBaEI7QUFDZCxRQUFBO0lBQUEsZ0JBQUEsR0FBbUIsYUFBYSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7V0FDMUQsZ0JBQWdCLENBQUMsZUFBZ0IsQ0FBQSxNQUFNLENBQUMsRUFBUDtFQUZuQjs7RUFNaEIsU0FBQSxHQUFZLFNBQUMsT0FBRCxFQUFVLE1BQVYsRUFBa0IsYUFBbEI7QUFDVixRQUFBO0lBQUMsNEJBQUQsRUFBWTtJQUNaLFNBQUEsR0FBZ0IsSUFBQSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQVQ7QUFDaEIsWUFBTyxPQUFQO0FBQUEsV0FDTyxlQURQO0FBQUEsV0FDd0IsV0FEeEI7UUFFSSxJQUFHLENBQUksU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFKLElBQStCLENBQUksTUFBTSxDQUFDLG1CQUFQLENBQUEsQ0FBdEM7VUFDRSxTQUFTLENBQUMsTUFBVixJQUFvQixFQUR0Qjs7QUFEb0I7QUFEeEIsV0FJTyxVQUpQO1FBS0ksV0FBQSxHQUFjLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsb0JBQWpCLENBQXNDLE1BQXRDLEVBQThDO1VBQUEsWUFBQSxFQUFjLElBQWQ7U0FBOUM7UUFHZCxP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SUFBQSxDQUErQixNQUFNLENBQUMsU0FBUCxDQUFBLENBQS9CO1lBQUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEIsRUFBQTtXQURGO1NBQUEsTUFBQTtVQUdFLElBQTRCLE1BQU0sQ0FBQyxTQUFQLENBQUEsQ0FBNUI7WUFBQSxNQUFNLENBQUMsVUFBUCxDQUFrQixLQUFsQixFQUFBO1dBSEY7O0FBREY7TUFVQSxJQUF5QyxPQUFBLEtBQVksZUFBWixJQUFBLE9BQUEsS0FBNkIsV0FBdEU7UUFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxVQUF6QixDQUFBLEVBQUE7O01BR0EsSUFBVSxVQUFWO0FBQUEsZUFBQTs7TUFDQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBO0FBQ2hCO1dBQUEsaURBQUE7O1lBQWlDLFVBQUEsR0FBYSxhQUFBLENBQWMsSUFBQyxDQUFBLGFBQWYsRUFBOEIsTUFBOUI7dUJBQzVDLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixRQUFBLENBQVMsVUFBVSxDQUFDLEtBQXBCLEVBQTJCLFNBQUEsQ0FBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCLGFBQTNCLENBQTNCLENBQW5COztBQURGOztJQTFCTzs7Ozs7O0VBNkJYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBdkZqQiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludCwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5pc1NwZWNNb2RlID0gYXRvbS5pblNwZWNNb2RlKClcbmxpbmVIZWlnaHQgPSBudWxsXG5cbmdldEN1cnNvck5vZGUgPSAoZWRpdG9yRWxlbWVudCwgY3Vyc29yKSAtPlxuICBjdXJzb3JzQ29tcG9uZW50ID0gZWRpdG9yRWxlbWVudC5jb21wb25lbnQubGluZXNDb21wb25lbnQuY3Vyc29yc0NvbXBvbmVudFxuICBjdXJzb3JzQ29tcG9uZW50LmN1cnNvck5vZGVzQnlJZFtjdXJzb3IuaWRdXG5cbiMgUmV0dXJuIGN1cnNvciBzdHlsZSBvZmZzZXQodG9wLCBsZWZ0KVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmdldE9mZnNldCA9IChzdWJtb2RlLCBjdXJzb3IsIGlzU29mdFdyYXBwZWQpIC0+XG4gIHtzZWxlY3Rpb24sIGVkaXRvcn0gPSBjdXJzb3JcbiAgdHJhdmVyc2FsID0gbmV3IFBvaW50KDAsIDApXG4gIHN3aXRjaCBzdWJtb2RlXG4gICAgd2hlbiAnY2hhcmFjdGVyd2lzZScsICdibG9ja3dpc2UnXG4gICAgICBpZiBub3Qgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSBhbmQgbm90IGN1cnNvci5pc0F0QmVnaW5uaW5nT2ZMaW5lKClcbiAgICAgICAgdHJhdmVyc2FsLmNvbHVtbiAtPSAxXG4gICAgd2hlbiAnbGluZXdpc2UnXG4gICAgICBidWZmZXJQb2ludCA9IHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnLCBmcm9tUHJvcGVydHk6IHRydWUpXG4gICAgICAjIEZJWE1FIG5lZWQgdG8gdXBkYXRlIG9yaWdpbmFsIHNlbGVjdGlvbiBwcm9wZXJ0eT9cbiAgICAgICMgdG8gcmVmbGVjdCBvdXRlciB2bXAgY29tbWFuZCBtb2RpZnkgbGluZXdpc2Ugc2VsZWN0aW9uP1xuICAgICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgYnVmZmVyUG9pbnQucm93ID0gc3RhcnRSb3dcblxuICAgICAgdHJhdmVyc2FsID0gaWYgaXNTb2Z0V3JhcHBlZFxuICAgICAgICBzY3JlZW5Qb2ludCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvaW50KVxuICAgICAgICBzY3JlZW5Qb2ludC50cmF2ZXJzYWxGcm9tKGN1cnNvci5nZXRTY3JlZW5Qb3NpdGlvbigpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZmZXJQb2ludC50cmF2ZXJzYWxGcm9tKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICBpZiBub3Qgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSBhbmQgY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKSBhbmQgc3VibW9kZSBpc250ICdibG9ja3dpc2UnXG4gICAgdHJhdmVyc2FsLnJvdyA9IC0xXG4gIHRyYXZlcnNhbFxuXG5zZXRTdHlsZSA9IChzdHlsZSwge3JvdywgY29sdW1ufSkgLT5cbiAgc3R5bGUuc2V0UHJvcGVydHkoJ3RvcCcsIFwiI3tyb3cgKiBsaW5lSGVpZ2h0fWVtXCIpIHVubGVzcyByb3cgaXMgMFxuICBzdHlsZS5zZXRQcm9wZXJ0eSgnbGVmdCcsIFwiI3tjb2x1bW59Y2hcIikgdW5sZXNzIGNvbHVtbiBpcyAwXG4gIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RvcCcpXG4gICAgc3R5bGUucmVtb3ZlUHJvcGVydHkoJ2xlZnQnKVxuXG4jIERpc3BsYXkgY3Vyc29yIGluIHZpc3VhbCBtb2RlLlxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDdXJzb3JTdHlsZU1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3JFbGVtZW50LCBAZWRpdG9yfSA9IEB2aW1TdGF0ZVxuICAgIEBsaW5lSGVpZ2h0T2JzZXJ2ZXIgPSBhdG9tLmNvbmZpZy5vYnNlcnZlICdlZGl0b3IubGluZUhlaWdodCcsIChuZXdWYWx1ZSkgPT5cbiAgICAgIGxpbmVIZWlnaHQgPSBuZXdWYWx1ZVxuICAgICAgQHJlZnJlc2goKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBsaW5lSGVpZ2h0T2JzZXJ2ZXIuZGlzcG9zZSgpXG4gICAge0BzdWJzY3JpcHRpb25zLCBAbGluZUhlaWdodE9ic2VydmVyfSA9IHt9XG5cbiAgcmVmcmVzaDogLT5cbiAgICB7c3VibW9kZX0gPSBAdmltU3RhdGVcbiAgICBAc3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHJldHVybiB1bmxlc3MgKEB2aW1TdGF0ZS5pc01vZGUoJ3Zpc3VhbCcpIGFuZCBzZXR0aW5ncy5nZXQoJ3Nob3dDdXJzb3JJblZpc3VhbE1vZGUnKSlcblxuICAgIGN1cnNvcnMgPSBjdXJzb3JzVG9TaG93ID0gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBpZiBzdWJtb2RlIGlzICdibG9ja3dpc2UnXG4gICAgICBjdXJzb3JzVG9TaG93ID0gQHZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKS5tYXAgKGJzKSAtPiBicy5nZXRIZWFkU2VsZWN0aW9uKCkuY3Vyc29yXG5cbiAgICAjIHVwZGF0ZSB2aXNpYmlsaXR5XG4gICAgZm9yIGN1cnNvciBpbiBjdXJzb3JzXG4gICAgICBpZiBjdXJzb3IgaW4gY3Vyc29yc1RvU2hvd1xuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZSh0cnVlKSB1bmxlc3MgY3Vyc29yLmlzVmlzaWJsZSgpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnNvci5zZXRWaXNpYmxlKGZhbHNlKSBpZiBjdXJzb3IuaXNWaXNpYmxlKClcblxuICAgICMgW05PVEVdIEluIEJsb2Nrd2lzZVNlbGVjdCB3ZSBhZGQgc2VsZWN0aW9ucyhhbmQgY29ycmVzcG9uZGluZyBjdXJzb3JzKSBpbiBibHVrLlxuICAgICMgQnV0IGNvcnJlc3BvbmRpbmcgY3Vyc29yc0NvbXBvbmVudChIVE1MIGVsZW1lbnQpIGlzIGFkZGVkIGluIHN5bmMuXG4gICAgIyBTbyB0byBtb2RpZnkgc3R5bGUgb2YgY3Vyc29yc0NvbXBvbmVudCwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgY29ycmVzcG9uZGluZyBjdXJzb3JzQ29tcG9uZW50XG4gICAgIyBpcyBhdmFpbGFibGUgYnkgY29tcG9uZW50IGluIHN5bmMgdG8gbW9kZWwuXG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50LnVwZGF0ZVN5bmMoKSBpZiBzdWJtb2RlIGluIFsnY2hhcmFjdGVyd2lzZScsICdibG9ja3dpc2UnXVxuXG4gICAgIyBbRklYTUVdIEluIHNwZWMgbW9kZSwgd2Ugc2tpcCBoZXJlIHNpbmNlIG5vdCBhbGwgc3BlYyBoYXZlIGRvbSBhdHRhY2hlZC5cbiAgICByZXR1cm4gaWYgaXNTcGVjTW9kZVxuICAgIGlzU29mdFdyYXBwZWQgPSBAZWRpdG9yLmlzU29mdFdyYXBwZWQoKVxuICAgIGZvciBjdXJzb3IgaW4gY3Vyc29yc1RvU2hvdyB3aGVuIGN1cnNvck5vZGUgPSBnZXRDdXJzb3JOb2RlKEBlZGl0b3JFbGVtZW50LCBjdXJzb3IpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgc2V0U3R5bGUoY3Vyc29yTm9kZS5zdHlsZSwgZ2V0T2Zmc2V0KHN1Ym1vZGUsIGN1cnNvciwgaXNTb2Z0V3JhcHBlZCkpXG5cbm1vZHVsZS5leHBvcnRzID0gQ3Vyc29yU3R5bGVNYW5hZ2VyXG4iXX0=
