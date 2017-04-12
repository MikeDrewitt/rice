(function() {
  var _, child, filteredEnvironment, fs, path, pty, systemLanguage;

  pty = require('pty.js');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  child = require('child_process');

  systemLanguage = (function() {
    var language;
    language = "en_US.UTF-8";
    return language;
  })();

  filteredEnvironment = (function() {
    var env;
    env = _.omit(process.env, 'ATOM_HOME', 'ATOM_SHELL_INTERNAL_RUN_AS_NODE', 'GOOGLE_API_KEY', 'NODE_ENV', 'NODE_PATH', 'userAgent', 'taskPath');
    if (env.LANG == null) {
      env.LANG = systemLanguage;
    }
    env.TERM_PROGRAM = 'terminal-fusion';
    return env;
  })();

  module.exports = function(pwd, shell, args, options) {
    var callback, emitTitle, ptyProcess, title;
    if (options == null) {
      options = {};
    }
    callback = this.async();
    if (/zsh|bash/.test(shell) && args.indexOf('--login') === -1) {
      args.unshift('--login');
    }
    ptyProcess = pty.fork(shell, args, {
      cwd: pwd,
      env: filteredEnvironment,
      name: 'xterm-256color'
    });
    title = shell = path.basename(shell);
    emitTitle = _.throttle(function() {
      return emit('terminal-fusion:title', ptyProcess.process);
    }, 500, true);
    ptyProcess.on('data', function(data) {
      emit('terminal-fusion:data', data);
      return emitTitle();
    });
    ptyProcess.on('exit', function() {
      emit('terminal-fusion:exit');
      return callback();
    });
    return process.on('message', function(arg) {
      var cols, event, ref, rows, text;
      ref = arg != null ? arg : {}, event = ref.event, cols = ref.cols, rows = ref.rows, text = ref.text;
      switch (event) {
        case 'resize':
          return ptyProcess.resize(cols, rows);
        case 'input':
          return ptyProcess.write(text);
      }
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWJldGEvc3JjL2F0b20tMS4xMy4wLWJldGE2L291dC9hcHAvbm9kZV9tb2R1bGVzL3Rlcm1pbmFsLWZ1c2lvbi9saWIvcHJvY2Vzcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEdBQUEsR0FBUSxPQUFBLENBQVEsUUFBUjs7RUFDUixJQUFBLEdBQVEsT0FBQSxDQUFRLE1BQVI7O0VBQ1IsRUFBQSxHQUFRLE9BQUEsQ0FBUSxJQUFSOztFQUNSLENBQUEsR0FBUSxPQUFBLENBQVEsWUFBUjs7RUFDUixLQUFBLEdBQVEsT0FBQSxDQUFRLGVBQVI7O0VBRVIsY0FBQSxHQUFvQixDQUFBLFNBQUE7QUFDbEIsUUFBQTtJQUFBLFFBQUEsR0FBVztBQUNYLFdBQU87RUFGVyxDQUFBLENBQUgsQ0FBQTs7RUFJakIsbUJBQUEsR0FBeUIsQ0FBQSxTQUFBO0FBQ3ZCLFFBQUE7SUFBQSxHQUFBLEdBQW9CLENBQUMsQ0FBQyxJQUFGLENBQU8sT0FBTyxDQUFDLEdBQWYsRUFBb0IsV0FBcEIsRUFBaUMsaUNBQWpDLEVBQW9FLGdCQUFwRSxFQUFzRixVQUF0RixFQUFrRyxXQUFsRyxFQUErRyxXQUEvRyxFQUE0SCxVQUE1SDs7TUFDcEIsR0FBRyxDQUFDLE9BQWdCOztJQUNwQixHQUFHLENBQUMsWUFBSixHQUFvQjtBQUNwQixXQUFPO0VBSmdCLENBQUEsQ0FBSCxDQUFBOztFQU10QixNQUFNLENBQUMsT0FBUCxHQUFzQixTQUFDLEdBQUQsRUFBTSxLQUFOLEVBQWEsSUFBYixFQUFtQixPQUFuQjtBQUNwQixRQUFBOztNQUR1QyxVQUFROztJQUMvQyxRQUFBLEdBQW9CLElBQUMsQ0FBQSxLQUFELENBQUE7SUFFcEIsSUFBRyxVQUFVLENBQUMsSUFBWCxDQUFnQixLQUFoQixDQUFBLElBQTJCLElBQUksQ0FBQyxPQUFMLENBQWEsU0FBYixDQUFBLEtBQTJCLENBQUMsQ0FBMUQ7TUFDRSxJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsRUFERjs7SUFHQSxVQUFBLEdBQW9CLEdBQUcsQ0FBQyxJQUFKLENBQVMsS0FBVCxFQUFnQixJQUFoQixFQUNsQjtNQUFBLEdBQUEsRUFBa0IsR0FBbEI7TUFDQSxHQUFBLEVBQWtCLG1CQURsQjtNQUVBLElBQUEsRUFBa0IsZ0JBRmxCO0tBRGtCO0lBS3BCLEtBQUEsR0FBb0IsS0FBQSxHQUFRLElBQUksQ0FBQyxRQUFMLENBQWMsS0FBZDtJQUU1QixTQUFBLEdBQW9CLENBQUMsQ0FBQyxRQUFGLENBQVcsU0FBQTthQUM3QixJQUFBLENBQUssdUJBQUwsRUFBOEIsVUFBVSxDQUFDLE9BQXpDO0lBRDZCLENBQVgsRUFFbEIsR0FGa0IsRUFFYixJQUZhO0lBSXBCLFVBQVUsQ0FBQyxFQUFYLENBQWMsTUFBZCxFQUFzQixTQUFDLElBQUQ7TUFDcEIsSUFBQSxDQUFLLHNCQUFMLEVBQTZCLElBQTdCO2FBQ0EsU0FBQSxDQUFBO0lBRm9CLENBQXRCO0lBSUEsVUFBVSxDQUFDLEVBQVgsQ0FBYyxNQUFkLEVBQXNCLFNBQUE7TUFDcEIsSUFBQSxDQUFLLHNCQUFMO2FBQ0EsUUFBQSxDQUFBO0lBRm9CLENBQXRCO1dBSUEsT0FBTyxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQXNCLFNBQUMsR0FBRDtBQUNwQixVQUFBOzBCQURxQixNQUEwQixJQUF6QixtQkFBTyxpQkFBTSxpQkFBTTtBQUN6QyxjQUFPLEtBQVA7QUFBQSxhQUNPLFFBRFA7aUJBQ3FCLFVBQVUsQ0FBQyxNQUFYLENBQWtCLElBQWxCLEVBQXdCLElBQXhCO0FBRHJCLGFBRU8sT0FGUDtpQkFFb0IsVUFBVSxDQUFDLEtBQVgsQ0FBaUIsSUFBakI7QUFGcEI7SUFEb0IsQ0FBdEI7RUF6Qm9CO0FBaEJ0QiIsInNvdXJjZXNDb250ZW50IjpbInB0eSAgID0gcmVxdWlyZSAncHR5LmpzJ1xucGF0aCAgPSByZXF1aXJlICdwYXRoJ1xuZnMgICAgPSByZXF1aXJlICdmcydcbl8gICAgID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbmNoaWxkID0gcmVxdWlyZSAnY2hpbGRfcHJvY2Vzcydcblxuc3lzdGVtTGFuZ3VhZ2UgPSBkbyAtPlxuICBsYW5ndWFnZSA9IFwiZW5fVVMuVVRGLThcIlxuICByZXR1cm4gbGFuZ3VhZ2VcblxuZmlsdGVyZWRFbnZpcm9ubWVudCA9IGRvIC0+XG4gIGVudiAgICAgICAgICAgICAgID0gXy5vbWl0IHByb2Nlc3MuZW52LCAnQVRPTV9IT01FJywgJ0FUT01fU0hFTExfSU5URVJOQUxfUlVOX0FTX05PREUnLCAnR09PR0xFX0FQSV9LRVknLCAnTk9ERV9FTlYnLCAnTk9ERV9QQVRIJywgJ3VzZXJBZ2VudCcsICd0YXNrUGF0aCdcbiAgZW52LkxBTkcgICAgICAgICA/PSBzeXN0ZW1MYW5ndWFnZVxuICBlbnYuVEVSTV9QUk9HUkFNICA9ICd0ZXJtaW5hbC1mdXNpb24nXG4gIHJldHVybiBlbnZcblxubW9kdWxlLmV4cG9ydHMgICAgICA9IChwd2QsIHNoZWxsLCBhcmdzLCBvcHRpb25zPXt9KSAtPlxuICBjYWxsYmFjayAgICAgICAgICA9IEBhc3luYygpXG5cbiAgaWYgL3pzaHxiYXNoLy50ZXN0KHNoZWxsKSBhbmQgYXJncy5pbmRleE9mKCctLWxvZ2luJykgPT0gLTFcbiAgICBhcmdzLnVuc2hpZnQgJy0tbG9naW4nXG5cbiAgcHR5UHJvY2VzcyAgICAgICAgPSBwdHkuZm9yayBzaGVsbCwgYXJncyxcbiAgICBjd2Q6ICAgICAgICAgICAgICBwd2QsXG4gICAgZW52OiAgICAgICAgICAgICAgZmlsdGVyZWRFbnZpcm9ubWVudCxcbiAgICBuYW1lOiAgICAgICAgICAgICAneHRlcm0tMjU2Y29sb3InXG5cbiAgdGl0bGUgICAgICAgICAgICAgPSBzaGVsbCA9IHBhdGguYmFzZW5hbWUgc2hlbGxcblxuICBlbWl0VGl0bGUgICAgICAgICA9IF8udGhyb3R0bGUgLT5cbiAgICBlbWl0KCd0ZXJtaW5hbC1mdXNpb246dGl0bGUnLCBwdHlQcm9jZXNzLnByb2Nlc3MpXG4gICwgNTAwLCB0cnVlXG5cbiAgcHR5UHJvY2Vzcy5vbiAnZGF0YScsIChkYXRhKSAtPlxuICAgIGVtaXQoJ3Rlcm1pbmFsLWZ1c2lvbjpkYXRhJywgZGF0YSlcbiAgICBlbWl0VGl0bGUoKVxuXG4gIHB0eVByb2Nlc3Mub24gJ2V4aXQnLCAtPlxuICAgIGVtaXQoJ3Rlcm1pbmFsLWZ1c2lvbjpleGl0JylcbiAgICBjYWxsYmFjaygpXG5cbiAgcHJvY2Vzcy5vbiAnbWVzc2FnZScsICh7ZXZlbnQsIGNvbHMsIHJvd3MsIHRleHR9PXt9KSAtPlxuICAgIHN3aXRjaCBldmVudFxuICAgICAgd2hlbiAncmVzaXplJyB0aGVuIHB0eVByb2Nlc3MucmVzaXplKGNvbHMsIHJvd3MpXG4gICAgICB3aGVuICdpbnB1dCcgdGhlbiBwdHlQcm9jZXNzLndyaXRlKHRleHQpXG4iXX0=
