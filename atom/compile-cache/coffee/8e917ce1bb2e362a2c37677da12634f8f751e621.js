(function() {
  var CommandLogger, ignoredCommands, tenMinutes;

  ignoredCommands = {
    'show.bs.tooltip': true,
    'shown.bs.tooltip': true,
    'hide.bs.tooltip': true,
    'hidden.bs.tooltip': true,
    'editor:display-updated': true,
    'mousewheel': true
  };

  tenMinutes = 10 * 60 * 1000;

  module.exports = CommandLogger = (function() {
    CommandLogger.instance = function() {
      return this._instance != null ? this._instance : this._instance = new CommandLogger;
    };

    CommandLogger.start = function() {
      return this.instance().start();
    };

    CommandLogger.prototype.logSize = 16;

    function CommandLogger() {
      this.initLog();
    }

    CommandLogger.prototype.start = function() {
      return atom.commands.onWillDispatch((function(_this) {
        return function(event) {
          return _this.logCommand(event);
        };
      })(this));
    };

    CommandLogger.prototype.getText = function(externalData) {
      var lastTime, lines;
      lines = [];
      lastTime = Date.now();
      this.eachEvent((function(_this) {
        return function(event) {
          if (event.time > lastTime) {
            return;
          }
          if (!event.name || lastTime - event.time >= tenMinutes) {
            return;
          }
          return lines.push(_this.formatEvent(event, lastTime));
        };
      })(this));
      if (externalData) {
        lines.push("     " + (this.formatTime(0)) + " " + externalData.title);
      }
      lines.unshift('```');
      lines.push('```');
      return lines.join("\n");
    };

    CommandLogger.prototype.latestEvent = function() {
      return this.eventLog[this.logIndex];
    };

    CommandLogger.prototype.logCommand = function(command) {
      var event, name, ref, target, time;
      name = command.type, target = command.target, time = command.time;
      if ((ref = command.detail) != null ? ref.jQueryTrigger : void 0) {
        return;
      }
      if (name in ignoredCommands) {
        return;
      }
      event = this.latestEvent();
      if (event.name === name) {
        return event.count++;
      } else {
        this.logIndex = (this.logIndex + 1) % this.logSize;
        event = this.latestEvent();
        event.name = name;
        event.targetNodeName = target.nodeName;
        event.targetClassName = target.className;
        event.targetId = target.id;
        event.count = 1;
        return event.time = time != null ? time : Date.now();
      }
    };

    CommandLogger.prototype.calculateLastEventTime = function(data) {
      var lastTime;
      if (data) {
        return data.time;
      }
      lastTime = null;
      this.eachEvent(function(event) {
        return lastTime = event.time;
      });
      return lastTime;
    };

    CommandLogger.prototype.eachEvent = function(fn) {
      var j, offset, ref;
      for (offset = j = 1, ref = this.logSize; 1 <= ref ? j <= ref : j >= ref; offset = 1 <= ref ? ++j : --j) {
        fn(this.eventLog[(this.logIndex + offset) % this.logSize]);
      }
    };

    CommandLogger.prototype.formatCount = function(count) {
      switch (false) {
        case !(count < 2):
          return '    ';
        case !(count < 10):
          return "  " + count + "x";
        case !(count < 100):
          return " " + count + "x";
      }
    };

    CommandLogger.prototype.formatEvent = function(event, lastTime) {
      var classText, count, idText, j, klass, len, name, nodeText, ref, targetClassName, targetId, targetNodeName, time;
      count = event.count, time = event.time, name = event.name, targetNodeName = event.targetNodeName, targetClassName = event.targetClassName, targetId = event.targetId;
      nodeText = targetNodeName.toLowerCase();
      idText = targetId ? "#" + targetId : '';
      classText = '';
      if (targetClassName != null) {
        ref = targetClassName.split(" ");
        for (j = 0, len = ref.length; j < len; j++) {
          klass = ref[j];
          classText += "." + klass;
        }
      }
      return (this.formatCount(count)) + " " + (this.formatTime(lastTime - time)) + " " + name + " (" + nodeText + idText + classText + ")";
    };

    CommandLogger.prototype.formatTime = function(time) {
      var minutes, seconds;
      minutes = Math.floor(time / 60000);
      seconds = Math.floor(((time % 60000) / 1000) * 10) / 10;
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      if (Math.floor(seconds) !== seconds) {
        seconds = seconds + ".0";
      }
      return "-" + minutes + ":" + seconds;
    };

    CommandLogger.prototype.initLog = function() {
      var i;
      this.logIndex = 0;
      return this.eventLog = (function() {
        var j, ref, results;
        results = [];
        for (i = j = 0, ref = this.logSize; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          results.push({
            name: null,
            count: 0,
            targetNodeName: null,
            targetClassName: null,
            targetId: null,
            time: null
          });
        }
        return results;
      }).call(this);
    };

    return CommandLogger;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9ub3RpZmljYXRpb25zL2xpYi9jb21tYW5kLWxvZ2dlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0E7QUFBQSxNQUFBOztFQUFBLGVBQUEsR0FDRTtJQUFBLGlCQUFBLEVBQW1CLElBQW5CO0lBQ0Esa0JBQUEsRUFBb0IsSUFEcEI7SUFFQSxpQkFBQSxFQUFtQixJQUZuQjtJQUdBLG1CQUFBLEVBQXFCLElBSHJCO0lBSUEsd0JBQUEsRUFBMEIsSUFKMUI7SUFLQSxZQUFBLEVBQWMsSUFMZDs7O0VBUUYsVUFBQSxHQUFhLEVBQUEsR0FBSyxFQUFMLEdBQVU7O0VBS3ZCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixhQUFDLENBQUEsUUFBRCxHQUFXLFNBQUE7c0NBQ1QsSUFBQyxDQUFBLFlBQUQsSUFBQyxDQUFBLFlBQWEsSUFBSTtJQURUOztJQUdYLGFBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBVyxDQUFDLEtBQVosQ0FBQTtJQURNOzs0QkFJUixPQUFBLEdBQVM7O0lBR0ksdUJBQUE7TUFDWCxJQUFDLENBQUEsT0FBRCxDQUFBO0lBRFc7OzRCQUdiLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFkLENBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO2lCQUMzQixLQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7UUFEMkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdCO0lBREs7OzRCQVNQLE9BQUEsR0FBUyxTQUFDLFlBQUQ7QUFDUCxVQUFBO01BQUEsS0FBQSxHQUFRO01BQ1IsUUFBQSxHQUFXLElBQUksQ0FBQyxHQUFMLENBQUE7TUFFWCxJQUFDLENBQUEs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QUEsRUFBZ0IsSUFGaEI7WUFHQSxlQUFBLEVBQWlCLElBSGpCO1lBSUEsUUFBQSxFQUFVLElBSlY7WUFLQSxJQUFBLEVBQU0sSUFMTjs7QUFEVTs7O0lBRkw7Ozs7O0FBekpYIiwic291cmNlc0NvbnRlbnQiOlsiIyBPcmlnaW5hbGx5IGZyb20gbGVlLWRvaG0vYnVnLXJlcG9ydFxuIyBodHRwczovL2dpdGh1Yi5jb20vbGVlLWRvaG0vYnVnLXJlcG9ydC9ibG9iL21hc3Rlci9saWIvY29tbWFuZC1sb2dnZXIuY29mZmVlXG5cbiMgQ29tbWFuZCBuYW1lcyB0aGF0IGFyZSBpZ25vcmVkIGFuZCBub3QgaW5jbHVkZWQgaW4gdGhlIGxvZy4gVGhpcyB1c2VzIGFuIE9iamVjdCB0byBwcm92aWRlIGZhc3RcbiMgc3RyaW5nIG1hdGNoaW5nLlxuaWdub3JlZENvbW1hbmRzID1cbiAgJ3Nob3cuYnMudG9vbHRpcCc6IHllc1xuICAnc2hvd24uYnMudG9vbHRpcCc6IHllc1xuICAnaGlkZS5icy50b29sdGlwJzogeWVzXG4gICdoaWRkZW4uYnMudG9vbHRpcCc6IHllc1xuICAnZWRpdG9yOmRpc3BsYXktdXBkYXRlZCc6IHllc1xuICAnbW91c2V3aGVlbCc6IHllc1xuXG4jIFRlbiBtaW51dGVzIGluIG1pbGxpc2Vjb25kcy5cbnRlbk1pbnV0ZXMgPSAxMCAqIDYwICogMTAwMFxuXG4jIFB1YmxpYzogSGFuZGxlcyBsb2dnaW5nIGFsbCBvZiB0aGUgQXRvbSBjb21tYW5kcyBmb3IgdGhlIGF1dG9tYXRpYyByZXBybyBzdGVwcyBmZWF0dXJlLlxuI1xuIyBJdCB1c2VzIGFuIGFycmF5IGFzIGEgY2lyY3VsYXIgZGF0YSBzdHJ1Y3R1cmUgdG8gbG9nIG9ubHkgdGhlIG1vc3QgcmVjZW50IGNvbW1hbmRzLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ29tbWFuZExvZ2dlclxuICBAaW5zdGFuY2U6IC0+XG4gICAgQF9pbnN0YW5jZSA/PSBuZXcgQ29tbWFuZExvZ2dlclxuXG4gIEBzdGFydDogLT5cbiAgICBAaW5zdGFuY2UoKS5zdGFydCgpXG5cbiAgIyBQdWJsaWM6IE1heGltdW0gc2l6ZSBvZiB0aGUgbG9nLlxuICBsb2dTaXplOiAxNlxuXG4gICMgUHVibGljOiBDcmVhdGVzIGEgbmV3IGxvZ2dlci5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGluaXRMb2coKVxuXG4gIHN0YXJ0OiAtPlxuICAgIGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2ggKGV2ZW50KSA9PlxuICAgICAgQGxvZ0NvbW1hbmQoZXZlbnQpXG5cbiAgIyBQdWJsaWM6IEZvcm1hdHMgdGhlIGNvbW1hbmQgbG9nIGZvciB0aGUgYnVnIHJlcG9ydC5cbiAgI1xuICAjICogYGV4dGVybmFsRGF0YWAgQW4ge09iamVjdH0gY29udGFpbmluZyBvdGhlciBpbmZvcm1hdGlvbiB0byBpbmNsdWRlIGluIHRoZSBsb2cuXG4gICNcbiAgIyBSZXR1cm5zIGEge1N0cmluZ30gb2YgdGhlIE1hcmtkb3duIGZvciB0aGUgcmVwb3J0LlxuICBnZXRUZXh0OiAoZXh0ZXJuYWxEYXRhKSAtPlxuICAgIGxpbmVzID0gW11cbiAgICBsYXN0VGltZSA9IERhdGUubm93KClcblxuICAgIEBlYWNoRXZlbnQgKGV2ZW50KSA9PlxuICAgICAgcmV0dXJuIGlmIGV2ZW50LnRpbWUgPiBsYXN0VGltZVxuICAgICAgcmV0dXJuIGlmIG5vdCBldmVudC5uYW1lIG9yIGxhc3RUaW1lIC0gZXZlbnQudGltZSA+PSB0ZW5NaW51dGVzXG4gICAgICBsaW5lcy5wdXNoKEBmb3JtYXRFdmVudChldmVudCwgbGFzdFRpbWUpKVxuXG4gICAgaWYgZXh0ZXJuYWxEYXRhXG4gICAgICBsaW5lcy5wdXNoKFwiICAgICAje0Bmb3JtYXRUaW1lKDApfSAje2V4dGVybmFsRGF0YS50aXRsZX1cIilcblxuICAgIGxpbmVzLnVuc2hpZnQoJ2BgYCcpXG4gICAgbGluZXMucHVzaCgnYGBgJylcbiAgICBsaW5lcy5qb2luKFwiXFxuXCIpXG5cbiAgIyBQdWJsaWM6IEdldHMgdGhlIGxhdGVzdCBldmVudCBmcm9tIHRoZSBsb2cuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSBldmVudCB7T2JqZWN0fS5cbiAgbGF0ZXN0RXZlbnQ6IC0+XG4gICAgQGV2ZW50TG9nW0Bsb2dJbmRleF1cblxuICAjIFB1YmxpYzogTG9ncyB0aGUgY29tbWFuZC5cbiAgI1xuICAjICogYGNvbW1hbmRgIENvbW1hbmQge09iamVjdH0gdG8gYmUgbG9nZ2VkXG4gICMgICAqIGB0eXBlYCBOYW1lIHtTdHJpbmd9IG9mIHRoZSBjb21tYW5kXG4gICMgICAqIGB0YXJnZXRgIHtTdHJpbmd9IGRlc2NyaWJpbmcgd2hlcmUgdGhlIGNvbW1hbmQgd2FzIHRyaWdnZXJlZFxuICBsb2dDb21tYW5kOiAoY29tbWFuZCkgLT5cbiAgICB7dHlwZTogbmFtZSwgdGFyZ2V0LCB0aW1lfSA9IGNvbW1hbmRcbiAgICByZXR1cm4gaWYgY29tbWFuZC5kZXRhaWw/LmpRdWVyeVRyaWdnZXJcbiAgICByZXR1cm4gaWYgbmFtZSBvZiBpZ25vcmVkQ29tbWFuZHNcblxuICAgIGV2ZW50ID0gQGxhdGVzdEV2ZW50KClcblxuICAgIGlmIGV2ZW50Lm5hbWUgaXMgbmFtZVxuICAgICAgZXZlbnQuY291bnQrK1xuICAgIGVsc2VcbiAgICAgIEBsb2dJbmRleCA9IChAbG9nSW5kZXggKyAxKSAlIEBsb2dTaXplXG4gICAgICBldmVudCA9IEBsYXRlc3RFdmVudCgpXG4gICAgICBldmVudC5uYW1lID0gbmFtZVxuICAgICAgZXZlbnQudGFyZ2V0Tm9kZU5hbWUgPSB0YXJnZXQubm9kZU5hbWVcbiAgICAgIGV2ZW50LnRhcmdldENsYXNzTmFtZSA9IHRhcmdldC5jbGFzc05hbWVcbiAgICAgIGV2ZW50LnRhcmdldElkID0gdGFyZ2V0LmlkXG4gICAgICBldmVudC5jb3VudCA9IDFcbiAgICAgIGV2ZW50LnRpbWUgPSB0aW1lID8gRGF0ZS5ub3coKVxuXG4gICMgUHJpdmF0ZTogQ2FsY3VsYXRlcyB0aGUgdGltZSBvZiB0aGUgbGFzdCBldmVudCB0byBiZSByZXBvcnRlZC5cbiAgI1xuICAjICogYGRhdGFgIERhdGEgZnJvbSBhbiBleHRlcm5hbCBidWcgcGFzc2VkIGluIGZyb20gYW5vdGhlciBwYWNrYWdlLlxuICAjXG4gICMgUmV0dXJucyB0aGUge0RhdGV9IG9mIHRoZSBsYXN0IGV2ZW50IHRoYXQgc2hvdWxkIGJlIHJlcG9ydGVkLlxuICBjYWxjdWxhdGVMYXN0RXZlbnRUaW1lOiAoZGF0YSkgLT5cbiAgICByZXR1cm4gZGF0YS50aW1lIGlmIGRhdGFcblxuICAgIGxhc3RUaW1lID0gbnVsbFxuICAgIEBlYWNoRXZlbnQgKGV2ZW50KSAtPiBsYXN0VGltZSA9IGV2ZW50LnRpbWVcbiAgICBsYXN0VGltZVxuXG4gICMgUHJpdmF0ZTogRXhlY3V0ZXMgYSBmdW5jdGlvbiBvbiBlYWNoIGV2ZW50IGluIGNocm9ub2xvZ2ljYWwgb3JkZXIuXG4gICNcbiAgIyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW5zdGVhZCBvZiBzaW1pbGFyIHVuZGVyc2NvcmUgZnVuY3Rpb25zIGJlY2F1c2UgdGhlIGxvZyBpcyBoZWxkIGluIGFcbiAgIyBjaXJjdWxhciBidWZmZXIuXG4gICNcbiAgIyAqIGBmbmAge0Z1bmN0aW9ufSB0byBleGVjdXRlIGZvciBlYWNoIGV2ZW50IGluIHRoZSBsb2cuXG4gICMgICAqIGBldmVudGAgQW4ge09iamVjdH0gZGVzY3JpYmluZyB0aGUgZXZlbnQgcGFzc2VkIHRvIHlvdXIgZnVuY3Rpb24uXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjXG4gICMgVGhpcyBjb2RlIHdvdWxkIG91dHB1dCB0aGUgbmFtZSBvZiBlYWNoIGV2ZW50IHRvIHRoZSBjb25zb2xlLlxuICAjXG4gICMgYGBgY29mZmVlXG4gICMgbG9nZ2VyLmVhY2hFdmVudCAoZXZlbnQpIC0+XG4gICMgICBjb25zb2xlLmxvZyBldmVudC5uYW1lXG4gICMgYGBgXG4gIGVhY2hFdmVudDogKGZuKSAtPlxuICAgIGZvciBvZmZzZXQgaW4gWzEuLkBsb2dTaXplXVxuICAgICAgZm4oQGV2ZW50TG9nWyhAbG9nSW5kZXggKyBvZmZzZXQpICUgQGxvZ1NpemVdKVxuICAgIHJldHVyblxuXG4gICMgUHJpdmF0ZTogRm9ybWF0IHRoZSBjb21tYW5kIGNvdW50IGZvciByZXBvcnRpbmcuXG4gICNcbiAgIyBSZXR1cm5zIHRoZSB7U3RyaW5nfSBmb3JtYXQgb2YgdGhlIGNvbW1hbmQgY291bnQuXG4gIGZvcm1hdENvdW50OiAoY291bnQpIC0+XG4gICAgc3dpdGNoXG4gICAgICB3aGVuIGNvdW50IDwgMiB0aGVuICcgICAgJ1xuICAgICAgd2hlbiBjb3VudCA8IDEwIHRoZW4gXCIgICN7Y291bnR9eFwiXG4gICAgICB3aGVuIGNvdW50IDwgMTAwIHRoZW4gXCIgI3tjb3VudH14XCJcblxuICAjIFByaXZhdGU6IEZvcm1hdHMgYSBjb21tYW5kIGV2ZW50IGZvciByZXBvcnRpbmcuXG4gICNcbiAgIyAqIGBldmVudGAgRXZlbnQge09iamVjdH0gdG8gYmUgZm9ybWF0dGVkLlxuICAjICogYGxhc3RUaW1lYCB7RGF0ZX0gb2YgdGhlIGxhc3QgZXZlbnQgdG8gcmVwb3J0LlxuICAjXG4gICMgUmV0dXJucyB0aGUge1N0cmluZ30gZm9ybWF0IG9mIHRoZSBjb21tYW5kIGV2ZW50LlxuICBmb3JtYXRFdmVudDogKGV2ZW50LCBsYXN0VGltZSkgLT5cbiAgICB7Y291bnQsIHRpbWUsIG5hbWUsIHRhcmdldE5vZGVOYW1lLCB0YXJnZXRDbGFzc05hbWUsIHRhcmdldElkfSA9IGV2ZW50XG4gICAgbm9kZVRleHQgPSB0YXJnZXROb2RlTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgaWRUZXh0ID0gaWYgdGFyZ2V0SWQgdGhlbiBcIiMje3RhcmdldElkfVwiIGVsc2UgJydcbiAgICBjbGFzc1RleHQgPSAnJ1xuICAgIGNsYXNzVGV4dCArPSBcIi4je2tsYXNzfVwiIGZvciBrbGFzcyBpbiB0YXJnZXRDbGFzc05hbWUuc3BsaXQoXCIgXCIpIGlmIHRhcmdldENsYXNzTmFtZT9cbiAgICBcIiN7QGZvcm1hdENvdW50KGNvdW50KX0gI3tAZm9ybWF0VGltZShsYXN0VGltZSAtIHRpbWUpfSAje25hbWV9ICgje25vZGVUZXh0fSN7aWRUZXh0fSN7Y2xhc3NUZXh0fSlcIlxuXG4gICMgUHJpdmF0ZTogRm9ybWF0IHRoZSBjb21tYW5kIHRpbWUgZm9yIHJlcG9ydGluZy5cbiAgI1xuICAjICogYHRpbWVgIHtEYXRlfSB0byBmb3JtYXRcbiAgI1xuICAjIFJldHVybnMgdGhlIHtTdHJpbmd9IGZvcm1hdCBvZiB0aGUgY29tbWFuZCB0aW1lLlxuICBmb3JtYXRUaW1lOiAodGltZSkgLT5cbiAgICBtaW51dGVzID0gTWF0aC5mbG9vcih0aW1lIC8gNjAwMDApXG4gICAgc2Vjb25kcyA9IE1hdGguZmxvb3IoKCh0aW1lICUgNjAwMDApIC8gMTAwMCkgKiAxMCkgLyAxMFxuICAgIHNlY29uZHMgPSBcIjAje3NlY29uZHN9XCIgaWYgc2Vjb25kcyA8IDEwXG4gICAgc2Vjb25kcyA9IFwiI3tzZWNvbmRzfS4wXCIgaWYgTWF0aC5mbG9vcihzZWNvbmRzKSBpc250IHNlY29uZHNcbiAgICBcIi0je21pbnV0ZXN9OiN7c2Vjb25kc31cIlxuXG4gICMgUHJpdmF0ZTogSW5pdGlhbGl6ZXMgdGhlIGxvZyBzdHJ1Y3R1cmUgZm9yIHNwZWVkLlxuICBpbml0TG9nOiAtPlxuICAgIEBsb2dJbmRleCA9IDBcbiAgICBAZXZlbnRMb2cgPSBmb3IgaSBpbiBbMC4uLkBsb2dTaXplXVxuICAgICAgbmFtZTogbnVsbFxuICAgICAgY291bnQ6IDBcbiAgICAgIHRhcmdldE5vZGVOYW1lOiBudWxsXG4gICAgICB0YXJnZXRDbGFzc05hbWU6IG51bGxcbiAgICAgIHRhcmdldElkOiBudWxsXG4gICAgICB0aW1lOiBudWxsXG4iXX0=
