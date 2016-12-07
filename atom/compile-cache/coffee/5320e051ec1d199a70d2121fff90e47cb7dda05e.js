(function() {
  var CompositeDisposable, Disposable, Tooltip, TooltipManager, _, getKeystroke, humanizeKeystrokes, ref;

  _ = require('underscore-plus');

  ref = require('event-kit'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  Tooltip = null;

  module.exports = TooltipManager = (function() {
    TooltipManager.prototype.defaults = {
      trigger: 'hover',
      container: 'body',
      html: true,
      placement: 'auto top',
      viewportPadding: 2
    };

    TooltipManager.prototype.hoverDefaults = {
      delay: {
        show: 1000,
        hide: 100
      }
    };

    function TooltipManager(arg) {
      this.keymapManager = arg.keymapManager, this.viewRegistry = arg.viewRegistry;
    }

    TooltipManager.prototype.add = function(target, options) {
      var bindings, disposable, element, hideTooltip, i, keyBindingCommand, keyBindingTarget, keystroke, len, tooltip;
      if (target.jquery) {
        disposable = new CompositeDisposable;
        for (i = 0, len = target.length; i < len; i++) {
          element = target[i];
          disposable.add(this.add(element, options));
        }
        return disposable;
      }
      if (Tooltip == null) {
        Tooltip = require('./tooltip');
      }
      keyBindingCommand = options.keyBindingCommand, keyBindingTarget = options.keyBindingTarget;
      if (keyBindingCommand != null) {
        bindings = this.keymapManager.findKeyBindings({
          command: keyBindingCommand,
          target: keyBindingTarget
        });
        keystroke = getKeystroke(bindings);
        if ((options.title != null) && (keystroke != null)) {
          options.title += " " + getKeystroke(bindings);
        } else if (keystroke != null) {
          options.title = getKeystroke(bindings);
        }
      }
      delete options.selector;
      options = _.defaults(options, this.defaults);
      if (options.trigger === 'hover') {
        options = _.defaults(options, this.hoverDefaults);
      }
      tooltip = new Tooltip(target, options, this.viewRegistry);
      hideTooltip = function() {
        tooltip.leave({
          currentTarget: target
        });
        return tooltip.hide();
      };
      window.addEventListener('resize', hideTooltip);
      disposable = new Disposable(function() {
        window.removeEventListener('resize', hideTooltip);
        hideTooltip();
        return tooltip.destroy();
      });
      return disposable;
    };

    return TooltipManager;

  })();

  humanizeKeystrokes = function(keystroke) {
    var keystrokes, stroke;
    keystrokes = keystroke.split(' ');
    keystrokes = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = keystrokes.length; i < len; i++) {
        stroke = keystrokes[i];
        results.push(_.humanizeKeystroke(stroke));
      }
      return results;
    })();
    return keystrokes.join(' ');
  };

  getKeystroke = function(bindings) {
    if (bindings != null ? bindings.length : void 0) {
      return "<span class=\"keystroke\">" + (humanizeKeystrokes(bindings[0].keystrokes)) + "</span>";
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy90b29sdGlwLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQW9DLE9BQUEsQ0FBUSxXQUFSLENBQXBDLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixPQUFBLEdBQVU7O0VBMkNWLE1BQU0sQ0FBQyxPQUFQLEdBQ007NkJBQ0osUUFBQSxHQUNFO01BQUEsT0FBQSxFQUFTLE9BQVQ7TUFDQSxTQUFBLEVBQVcsTUFEWDtNQUVBLElBQUEsRUFBTSxJQUZOO01BR0EsU0FBQSxFQUFXLFVBSFg7TUFJQSxlQUFBLEVBQWlCLENBSmpCOzs7NkJBTUYsYUFBQSxHQUNFO01BQUMsS0FBQSxFQUFPO1FBQUMsSUFBQSxFQUFNLElBQVA7UUFBYSxJQUFBLEVBQU0sR0FBbkI7T0FBUjs7O0lBRVcsd0JBQUMsR0FBRDtNQUFFLElBQUMsQ0FBQSxvQkFBQSxlQUFlLElBQUMsQ0FBQSxtQkFBQTtJQUFuQjs7NkJBaURiLEdBQUEsR0FBSyxTQUFDLE1BQUQsRUFBUyxPQUFUO0FBQ0gsVUFBQTtNQUFBLElBQUcsTUFBTSxDQUFDLE1BQVY7UUFDRSxVQUFBLEdBQWEsSUFBSTtBQUNqQixhQUFBLHdDQUFBOztVQUFBLFVBQVUsQ0FBQyxHQUFYLENBQWUsSUFBQyxDQUFBLEdBQUQsQ0FBSyxPQUFMLEVBQWMsT0FBZCxDQUFmO0FBQUE7QUFDQSxlQUFPLFdBSFQ7OztRQUtBLFVBQVcsT0FBQSxDQUFRLFdBQVI7O01BRVYsNkNBQUQsRUFBb0I7TUFFcEIsSUFBRyx5QkFBSDtRQUNFLFFBQUEsR0FBVyxJQUFDLENBQUEsYUFBYSxDQUFDLGVBQWYsQ0FBK0I7VUFBQSxPQUFBLEVBQVMsaUJBQVQ7VUFBNEIsTUFBQSxFQUFRLGdCQUFwQztTQUEvQjtRQUNYLFNBQUEsR0FBWSxZQUFBLENBQWEsUUFBYjtRQUNaLElBQUcsdUJBQUEsSUFBbUIsbUJBQXRCO1VBQ0UsT0FBTyxDQUFDLEtBQVIsSUFBaUIsR0FBQSxHQUFNLFlBQUEsQ0FBYSxRQUFiLEVBRHpCO1NBQUEsTUFFSyxJQUFHLGlCQUFIO1VBQ0gsT0FBTyxDQUFDLEtBQVIsR0FBZ0IsWUFBQSxDQUFhLFFBQWIsRUFEYjtTQUxQOztNQVFBLE9BQU8sT0FBTyxDQUFDO01BQ2YsT0FBQSxHQUFVLENBQUMsQ0FBQyxRQUFGLENBQVcsT0FBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7TUFDVixJQUFHLE9BQU8sQ0FBQyxPQUFSLEtBQW1CLE9BQXRCO1FBQ0UsT0FBQSxHQUFVLENBQUMsQ0FBQyxRQUFGLENBQVcsT0FBWCxFQUFvQixJQUFDLENBQUEsYUFBckIsRUFEWjs7TUFHQSxPQUFBLEdBQWMsSUFBQSxPQUFBLENBQVEsTUFBUixFQUFnQixPQUFoQixFQUF5QixJQUFDLENBQUEsWUFBMUI7TUFFZCxXQUFBLEdBQWMsU0FBQTtRQUNaLE9BQU8sQ0FBQyxLQUFSLENBQWM7VUFBQSxhQUFBLEVBQWUsTUFBZjtTQUFkO2VBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBQTtNQUZZO01BSWQsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLFdBQWxDO01BRUEsVUFBQSxHQUFpQixJQUFBLFVBQUEsQ0FBVyxTQUFBO1FBQzFCLE1BQU0sQ0FBQyxtQkFBUCxDQUEyQixRQUEzQixFQUFxQyxXQUFyQztRQUNBLFdBQUEsQ0FBQTtlQUNBLE9BQU8sQ0FBQyxPQUFSLENBQUE7TUFIMEIsQ0FBWDthQUtqQjtJQXBDRzs7Ozs7O0VBc0NQLGtCQUFBLEdBQXFCLFNBQUMsU0FBRDtBQUNuQixRQUFBO0lBQUEsVUFBQSxHQUFhLFNBQVMsQ0FBQyxLQUFWLENBQWdCLEdBQWhCO0lBQ2IsVUFBQTs7QUFBYztXQUFBLDRDQUFBOztxQkFBQSxDQUFDLENBQUMsaUJBQUYsQ0FBb0IsTUFBcEI7QUFBQTs7O1dBQ2QsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsR0FBaEI7RUFIbUI7O0VBS3JCLFlBQUEsR0FBZSxTQUFDLFFBQUQ7SUFDYix1QkFBRyxRQUFRLENBQUUsZUFBYjthQUNFLDRCQUFBLEdBQTRCLENBQUMsa0JBQUEsQ0FBbUIsUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLFVBQS9CLENBQUQsQ0FBNUIsR0FBd0UsVUFEMUU7O0VBRGE7QUFySmYiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0Rpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuVG9vbHRpcCA9IG51bGxcblxuIyBFc3NlbnRpYWw6IEFzc29jaWF0ZXMgdG9vbHRpcHMgd2l0aCBIVE1MIGVsZW1lbnRzLlxuI1xuIyBZb3UgY2FuIGdldCB0aGUgYFRvb2x0aXBNYW5hZ2VyYCB2aWEgYGF0b20udG9vbHRpcHNgLlxuI1xuIyAjIyBFeGFtcGxlc1xuI1xuIyBUaGUgZXNzZW5jZSBvZiBkaXNwbGF5aW5nIGEgdG9vbHRpcFxuI1xuIyBgYGBjb2ZmZWVcbiMgIyBkaXNwbGF5IGl0XG4jIGRpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZChkaXYsIHt0aXRsZTogJ1RoaXMgaXMgYSB0b29sdGlwJ30pXG4jXG4jICMgcmVtb3ZlIGl0XG4jIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4jIGBgYFxuI1xuIyBJbiBwcmFjdGljZSB0aGVyZSBhcmUgdXN1YWxseSBtdWx0aXBsZSB0b29sdGlwcy4gU28gd2UgYWRkIHRoZW0gdG8gYVxuIyBDb21wb3NpdGVEaXNwb3NhYmxlXG4jXG4jIGBgYGNvZmZlZVxuIyB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuIyBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiNcbiMgZGl2MSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4jIGRpdjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuIyBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZChkaXYxLCB7dGl0bGU6ICdUaGlzIGlzIGEgdG9vbHRpcCd9KVxuIyBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZChkaXYyLCB7dGl0bGU6ICdBbm90aGVyIHRvb2x0aXAnfSlcbiNcbiMgIyByZW1vdmUgdGhlbSBhbGxcbiMgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiMgYGBgXG4jXG4jIFlvdSBjYW4gZGlzcGxheSBhIGtleSBiaW5kaW5nIGluIHRoZSB0b29sdGlwIGFzIHdlbGwgd2l0aCB0aGVcbiMgYGtleUJpbmRpbmdDb21tYW5kYCBvcHRpb24uXG4jXG4jIGBgYGNvZmZlZVxuIyBkaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQgQGNhc2VPcHRpb25CdXR0b24sXG4jICAgdGl0bGU6IFwiTWF0Y2ggQ2FzZVwiXG4jICAga2V5QmluZGluZ0NvbW1hbmQ6ICdmaW5kLWFuZC1yZXBsYWNlOnRvZ2dsZS1jYXNlLW9wdGlvbidcbiMgICBrZXlCaW5kaW5nVGFyZ2V0OiBAZmluZEVkaXRvci5lbGVtZW50XG4jIGBgYFxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVG9vbHRpcE1hbmFnZXJcbiAgZGVmYXVsdHM6XG4gICAgdHJpZ2dlcjogJ2hvdmVyJ1xuICAgIGNvbnRhaW5lcjogJ2JvZHknXG4gICAgaHRtbDogdHJ1ZVxuICAgIHBsYWNlbWVudDogJ2F1dG8gdG9wJ1xuICAgIHZpZXdwb3J0UGFkZGluZzogMlxuXG4gIGhvdmVyRGVmYXVsdHM6XG4gICAge2RlbGF5OiB7c2hvdzogMTAwMCwgaGlkZTogMTAwfX1cblxuICBjb25zdHJ1Y3RvcjogKHtAa2V5bWFwTWFuYWdlciwgQHZpZXdSZWdpc3RyeX0pIC0+XG5cbiAgIyBFc3NlbnRpYWw6IEFkZCBhIHRvb2x0aXAgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gICNcbiAgIyAqIGB0YXJnZXRgIEFuIGBIVE1MRWxlbWVudGBcbiAgIyAqIGBvcHRpb25zYCBBbiBvYmplY3Qgd2l0aCBvbmUgb3IgbW9yZSBvZiB0aGUgZm9sbG93aW5nIG9wdGlvbnM6XG4gICMgICAqIGB0aXRsZWAgQSB7U3RyaW5nfSBvciB7RnVuY3Rpb259IHRvIHVzZSBmb3IgdGhlIHRleHQgaW4gdGhlIHRpcC4gSWZcbiAgIyAgICAgYSBmdW5jdGlvbiBpcyBwYXNzZWQsIGB0aGlzYCB3aWxsIGJlIHNldCB0byB0aGUgYHRhcmdldGAgZWxlbWVudC4gVGhpc1xuICAjICAgICBvcHRpb24gaXMgbXV0dWFsbHkgZXhjbHVzaXZlIHdpdGggdGhlIGBpdGVtYCBvcHRpb24uXG4gICMgICAqIGBodG1sYCBBIHtCb29sZWFufSBhZmZlY3RpbmcgdGhlIGludGVycGV0YXRpb24gb2YgdGhlIGB0aXRsZWAgb3B0aW9uLlxuICAjICAgICBJZiBgdHJ1ZWAgKHRoZSBkZWZhdWx0KSwgdGhlIGB0aXRsZWAgc3RyaW5nIHdpbGwgYmUgaW50ZXJwcmV0ZWQgYXMgSFRNTC5cbiAgIyAgICAgT3RoZXJ3aXNlIGl0IHdpbGwgYmUgaW50ZXJwcmV0ZWQgYXMgcGxhaW4gdGV4dC5cbiAgIyAgICogYGl0ZW1gIEEgdmlldyAob2JqZWN0IHdpdGggYW4gYC5lbGVtZW50YCBwcm9wZXJ0eSkgb3IgYSBET00gZWxlbWVudFxuICAjICAgICBjb250YWluaW5nIGN1c3RvbSBjb250ZW50IGZvciB0aGUgdG9vbHRpcC4gVGhpcyBvcHRpb24gaXMgbXV0dWFsbHlcbiAgIyAgICAgZXhjbHVzaXZlIHdpdGggdGhlIGB0aXRsZWAgb3B0aW9uLlxuICAjICAgKiBgY2xhc3NgIEEge1N0cmluZ30gd2l0aCBhIGNsYXNzIHRvIGFwcGx5IHRvIHRoZSB0b29sdGlwIGVsZW1lbnQgdG9cbiAgIyAgICAgZW5hYmxlIGN1c3RvbSBzdHlsaW5nLlxuICAjICAgKiBgcGxhY2VtZW50YCBBIHtTdHJpbmd9IG9yIHtGdW5jdGlvbn0gcmV0dXJuaW5nIGEgc3RyaW5nIHRvIGluZGljYXRlXG4gICMgICAgIHRoZSBwb3NpdGlvbiBvZiB0aGUgdG9vbHRpcCByZWxhdGl2ZSB0byBgZWxlbWVudGAuIENhbiBiZSBgJ3RvcCdgLFxuICAjICAgICBgJ2JvdHRvbSdgLCBgJ2xlZnQnYCwgYCdyaWdodCdgLCBvciBgJ2F1dG8nYC4gV2hlbiBgJ2F1dG8nYCBpc1xuICAjICAgICBzcGVjaWZpZWQsIGl0IHdpbGwgZHluYW1pY2FsbHkgcmVvcmllbnQgdGhlIHRvb2x0aXAuIEZvciBleGFtcGxlLCBpZlxuICAjICAgICBwbGFjZW1lbnQgaXMgYCdhdXRvIGxlZnQnYCwgdGhlIHRvb2x0aXAgd2lsbCBkaXNwbGF5IHRvIHRoZSBsZWZ0IHdoZW5cbiAgIyAgICAgcG9zc2libGUsIG90aGVyd2lzZSBpdCB3aWxsIGRpc3BsYXkgcmlnaHQuXG4gICMgICAgIFdoZW4gYSBmdW5jdGlvbiBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgcGxhY2VtZW50LCBpdCBpcyBjYWxsZWQgd2l0aFxuICAjICAgICB0aGUgdG9vbHRpcCBET00gbm9kZSBhcyBpdHMgZmlyc3QgYXJndW1lbnQgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnRcbiAgIyAgICAgRE9NIG5vZGUgYXMgaXRzIHNlY29uZC4gVGhlIGB0aGlzYCBjb250ZXh0IGlzIHNldCB0byB0aGUgdG9vbHRpcFxuICAjICAgICBpbnN0YW5jZS5cbiAgIyAgICogYHRyaWdnZXJgIEEge1N0cmluZ30gaW5kaWNhdGluZyBob3cgdGhlIHRvb2x0aXAgc2hvdWxkIGJlIGRpc3BsYXllZC5cbiAgIyAgICAgQ2hvb3NlIGZyb20gb25lIG9mIHRoZSBmb2xsb3dpbmcgb3B0aW9uczpcbiAgIyAgICAgICAqIGAnaG92ZXInYCBTaG93IHRoZSB0b29sdGlwIHdoZW4gdGhlIG1vdXNlIGhvdmVycyBvdmVyIHRoZSBlbGVtZW50LlxuICAjICAgICAgICAgVGhpcyBpcyB0aGUgZGVmYXVsdC5cbiAgIyAgICAgICAqIGAnY2xpY2snYCBTaG93IHRoZSB0b29sdGlwIHdoZW4gdGhlIGVsZW1lbnQgaXMgY2xpY2tlZC4gVGhlIHRvb2x0aXBcbiAgIyAgICAgICAgIHdpbGwgYmUgaGlkZGVuIGFmdGVyIGNsaWNraW5nIHRoZSBlbGVtZW50IGFnYWluIG9yIGFueXdoZXJlIGVsc2VcbiAgIyAgICAgICAgIG91dHNpZGUgb2YgdGhlIHRvb2x0aXAgaXRzZWxmLlxuICAjICAgICAgICogYCdmb2N1cydgIFNob3cgdGhlIHRvb2x0aXAgd2hlbiB0aGUgZWxlbWVudCBpcyBmb2N1c2VkLlxuICAjICAgICAgICogYCdtYW51YWwnYCBTaG93IHRoZSB0b29sdGlwIGltbWVkaWF0ZWx5IGFuZCBvbmx5IGhpZGUgaXQgd2hlbiB0aGVcbiAgIyAgICAgICAgIHJldHVybmVkIGRpc3Bvc2FibGUgaXMgZGlzcG9zZWQuXG4gICMgICAqIGBkZWxheWAgQW4gb2JqZWN0IHNwZWNpZnlpbmcgdGhlIHNob3cgYW5kIGhpZGUgZGVsYXkgaW4gbWlsbGlzZWNvbmRzLlxuICAjICAgICBEZWZhdWx0cyB0byBge3Nob3c6IDEwMDAsIGhpZGU6IDEwMH1gIGlmIHRoZSBgdHJpZ2dlcmAgaXMgYGhvdmVyYCBhbmRcbiAgIyAgICAgb3RoZXJ3aXNlIGRlZmF1bHRzIHRvIGAwYCBmb3IgYm90aCB2YWx1ZXMuXG4gICMgICAqIGBrZXlCaW5kaW5nQ29tbWFuZGAgQSB7U3RyaW5nfSBjb250YWluaW5nIGEgY29tbWFuZCBuYW1lLiBJZiB5b3Ugc3BlY2lmeVxuICAjICAgICB0aGlzIG9wdGlvbiBhbmQgYSBrZXkgYmluZGluZyBleGlzdHMgdGhhdCBtYXRjaGVzIHRoZSBjb21tYW5kLCBpdCB3aWxsXG4gICMgICAgIGJlIGFwcGVuZGVkIHRvIHRoZSB0aXRsZSBvciByZW5kZXJlZCBhbG9uZSBpZiBubyB0aXRsZSBpcyBzcGVjaWZpZWQuXG4gICMgICAqIGBrZXlCaW5kaW5nVGFyZ2V0YCBBbiBgSFRNTEVsZW1lbnRgIG9uIHdoaWNoIHRvIGxvb2sgdXAgdGhlIGtleSBiaW5kaW5nLlxuICAjICAgICBJZiB0aGlzIG9wdGlvbiBpcyBub3Qgc3VwcGxpZWQsIHRoZSBmaXJzdCBvZiBhbGwgbWF0Y2hpbmcga2V5IGJpbmRpbmdzXG4gICMgICAgIGZvciB0aGUgZ2l2ZW4gY29tbWFuZCB3aWxsIGJlIHJlbmRlcmVkLlxuICAjXG4gICMgUmV0dXJucyBhIHtEaXNwb3NhYmxlfSBvbiB3aGljaCBgLmRpc3Bvc2UoKWAgY2FuIGJlIGNhbGxlZCB0byByZW1vdmUgdGhlXG4gICMgdG9vbHRpcC5cbiAgYWRkOiAodGFyZ2V0LCBvcHRpb25zKSAtPlxuICAgIGlmIHRhcmdldC5qcXVlcnlcbiAgICAgIGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgICAgZGlzcG9zYWJsZS5hZGQgQGFkZChlbGVtZW50LCBvcHRpb25zKSBmb3IgZWxlbWVudCBpbiB0YXJnZXRcbiAgICAgIHJldHVybiBkaXNwb3NhYmxlXG5cbiAgICBUb29sdGlwID89IHJlcXVpcmUgJy4vdG9vbHRpcCdcblxuICAgIHtrZXlCaW5kaW5nQ29tbWFuZCwga2V5QmluZGluZ1RhcmdldH0gPSBvcHRpb25zXG5cbiAgICBpZiBrZXlCaW5kaW5nQ29tbWFuZD9cbiAgICAgIGJpbmRpbmdzID0gQGtleW1hcE1hbmFnZXIuZmluZEtleUJpbmRpbmdzKGNvbW1hbmQ6IGtleUJpbmRpbmdDb21tYW5kLCB0YXJnZXQ6IGtleUJpbmRpbmdUYXJnZXQpXG4gICAgICBrZXlzdHJva2UgPSBnZXRLZXlzdHJva2UoYmluZGluZ3MpXG4gICAgICBpZiBvcHRpb25zLnRpdGxlPyBhbmQga2V5c3Ryb2tlP1xuICAgICAgICBvcHRpb25zLnRpdGxlICs9IFwiIFwiICsgZ2V0S2V5c3Ryb2tlKGJpbmRpbmdzKVxuICAgICAgZWxzZSBpZiBrZXlzdHJva2U/XG4gICAgICAgIG9wdGlvbnMudGl0bGUgPSBnZXRLZXlzdHJva2UoYmluZGluZ3MpXG5cbiAgICBkZWxldGUgb3B0aW9ucy5zZWxlY3RvclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIEBkZWZhdWx0cylcbiAgICBpZiBvcHRpb25zLnRyaWdnZXIgaXMgJ2hvdmVyJ1xuICAgICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywgQGhvdmVyRGVmYXVsdHMpXG5cbiAgICB0b29sdGlwID0gbmV3IFRvb2x0aXAodGFyZ2V0LCBvcHRpb25zLCBAdmlld1JlZ2lzdHJ5KVxuXG4gICAgaGlkZVRvb2x0aXAgPSAtPlxuICAgICAgdG9vbHRpcC5sZWF2ZShjdXJyZW50VGFyZ2V0OiB0YXJnZXQpXG4gICAgICB0b29sdGlwLmhpZGUoKVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGhpZGVUb29sdGlwKVxuXG4gICAgZGlzcG9zYWJsZSA9IG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgaGlkZVRvb2x0aXApXG4gICAgICBoaWRlVG9vbHRpcCgpXG4gICAgICB0b29sdGlwLmRlc3Ryb3koKVxuXG4gICAgZGlzcG9zYWJsZVxuXG5odW1hbml6ZUtleXN0cm9rZXMgPSAoa2V5c3Ryb2tlKSAtPlxuICBrZXlzdHJva2VzID0ga2V5c3Ryb2tlLnNwbGl0KCcgJylcbiAga2V5c3Ryb2tlcyA9IChfLmh1bWFuaXplS2V5c3Ryb2tlKHN0cm9rZSkgZm9yIHN0cm9rZSBpbiBrZXlzdHJva2VzKVxuICBrZXlzdHJva2VzLmpvaW4oJyAnKVxuXG5nZXRLZXlzdHJva2UgPSAoYmluZGluZ3MpIC0+XG4gIGlmIGJpbmRpbmdzPy5sZW5ndGhcbiAgICBcIjxzcGFuIGNsYXNzPVxcXCJrZXlzdHJva2VcXFwiPiN7aHVtYW5pemVLZXlzdHJva2VzKGJpbmRpbmdzWzBdLmtleXN0cm9rZXMpfTwvc3Bhbj5cIlxuIl19