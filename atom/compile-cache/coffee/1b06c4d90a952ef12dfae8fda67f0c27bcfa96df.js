(function() {
  var CommandRegistry, CompositeDisposable, Disposable, Emitter, InlineListener, SelectorBasedListener, SequenceCount, _, calculateSpecificity, ref, ref1, validateSelector,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('event-kit'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('clear-cut'), calculateSpecificity = ref1.calculateSpecificity, validateSelector = ref1.validateSelector;

  _ = require('underscore-plus');

  SequenceCount = 0;

  module.exports = CommandRegistry = (function() {
    function CommandRegistry() {
      this.handleCommandEvent = bind(this.handleCommandEvent, this);
      this.rootNode = null;
      this.clear();
    }

    CommandRegistry.prototype.clear = function() {
      this.registeredCommands = {};
      this.selectorBasedListenersByCommandName = {};
      this.inlineListenersByCommandName = {};
      return this.emitter = new Emitter;
    };

    CommandRegistry.prototype.attach = function(rootNode) {
      var command, results;
      this.rootNode = rootNode;
      for (command in this.selectorBasedListenersByCommandName) {
        this.commandRegistered(command);
      }
      results = [];
      for (command in this.inlineListenersByCommandName) {
        results.push(this.commandRegistered(command));
      }
      return results;
    };

    CommandRegistry.prototype.destroy = function() {
      var commandName;
      for (commandName in this.registeredCommands) {
        this.rootNode.removeEventListener(commandName, this.handleCommandEvent, true);
      }
    };

    CommandRegistry.prototype.add = function(target, commandName, callback) {
      var commands, disposable;
      if (typeof commandName === 'object') {
        commands = commandName;
        disposable = new CompositeDisposable;
        for (commandName in commands) {
          callback = commands[commandName];
          disposable.add(this.add(target, commandName, callback));
        }
        return disposable;
      }
      if (typeof callback !== 'function') {
        throw new Error("Can't register a command with non-function callback.");
      }
      if (typeof target === 'string') {
        validateSelector(target);
        return this.addSelectorBasedListener(target, commandName, callback);
      } else {
        return this.addInlineListener(target, commandName, callback);
      }
    };

    CommandRegistry.prototype.addSelectorBasedListener = function(selector, commandName, callback) {
      var base, listener, listenersForCommand;
      if ((base = this.selectorBasedListenersByCommandName)[commandName] == null) {
        base[commandName] = [];
      }
      listenersForCommand = this.selectorBasedListenersByCommandName[commandName];
      listener = new SelectorBasedListener(selector, callback);
      listenersForCommand.push(listener);
      this.commandRegistered(commandName);
      return new Disposable((function(_this) {
        return function() {
          listenersForCommand.splice(listenersForCommand.indexOf(listener), 1);
          if (listenersForCommand.length === 0) {
            return delete _this.selectorBasedListenersByCommandName[commandName];
          }
        };
      })(this));
    };

    CommandRegistry.prototype.addInlineListener = function(element, commandName, callback) {
      var base, listener, listenersForCommand, listenersForElement;
      if ((base = this.inlineListenersByCommandName)[commandName] == null) {
        base[commandName] = new WeakMap;
      }
      listenersForCommand = this.inlineListenersByCommandName[commandName];
      if (!(listenersForElement = listenersForCommand.get(element))) {
        listenersForElement = [];
        listenersForCommand.set(element, listenersForElement);
      }
      listener = new InlineListener(callback);
      listenersForElement.push(listener);
      this.commandRegistered(commandName);
      return new Disposable(function() {
        listenersForElement.splice(listenersForElement.indexOf(listener), 1);
        if (listenersForElement.length === 0) {
          return listenersForCommand["delete"](element);
        }
      });
    };

    CommandRegistry.prototype.findCommands = function(arg) {
      var commandName, commandNames, commands, currentTarget, i, len, listener, listeners, name, ref2, ref3, ref4, target;
      target = arg.target;
      commandNames = new Set;
      commands = [];
      currentTarget = target;
      while (true) {
        ref2 = this.inlineListenersByCommandName;
        for (name in ref2) {
          listeners = ref2[name];
          if (listeners.has(currentTarget) && !commandNames.has(name)) {
            commandNames.add(name);
            commands.push({
              name: name,
              displayName: _.humanizeEventName(name)
            });
          }
        }
        ref3 = this.selectorBasedListenersByCommandName;
        for (commandName in ref3) {
          listeners = ref3[commandName];
          for (i = 0, len = listeners.length; i < len; i++) {
            listener = listeners[i];
            if (typeof currentTarget.webkitMatchesSelector === "function" ? currentTarget.webkitMatchesSelector(listener.selector) : void 0) {
              if (!commandNames.has(commandName)) {
                commandNames.add(commandName);
                commands.push({
                  name: commandName,
                  displayName: _.humanizeEventName(commandName)
                });
              }
            }
          }
        }
        if (currentTarget === window) {
          break;
        }
        currentTarget = (ref4 = currentTarget.parentNode) != null ? ref4 : window;
      }
      return commands;
    };

    CommandRegistry.prototype.dispatch = function(target, commandName, detail) {
      var event;
      event = new CustomEvent(commandName, {
        bubbles: true,
        detail: detail
      });
      Object.defineProperty(event, 'target', {
        value: target
      });
      return this.handleCommandEvent(event);
    };

    CommandRegistry.prototype.onWillDispatch = function(callback) {
      return this.emitter.on('will-dispatch', callback);
    };

    CommandRegistry.prototype.onDidDispatch = function(callback) {
      return this.emitter.on('did-dispatch', callback);
    };

    CommandRegistry.prototype.getSnapshot = function() {
      var commandName, listeners, ref2, snapshot;
      snapshot = {};
      ref2 = this.selectorBasedListenersByCommandName;
      for (commandName in ref2) {
        listeners = ref2[commandName];
        snapshot[commandName] = listeners.slice();
      }
      return snapshot;
    };

    CommandRegistry.prototype.restoreSnapshot = function(snapshot) {
      var commandName, listeners;
      this.selectorBasedListenersByCommandName = {};
      for (commandName in snapshot) {
        listeners = snapshot[commandName];
        this.selectorBasedListenersByCommandName[commandName] = listeners.slice();
      }
    };

    CommandRegistry.prototype.handleCommandEvent = function(event) {
      var currentTarget, dispatchedEvent, i, immediatePropagationStopped, j, key, len, listener, listeners, matched, propagationStopped, ref2, ref3, ref4, ref5, ref6, selectorBasedListeners;
      propagationStopped = false;
      immediatePropagationStopped = false;
      matched = false;
      currentTarget = event.target;
      dispatchedEvent = new CustomEvent(event.type, {
        bubbles: true,
        detail: event.detail
      });
      Object.defineProperty(dispatchedEvent, 'eventPhase', {
        value: Event.BUBBLING_PHASE
      });
      Object.defineProperty(dispatchedEvent, 'currentTarget', {
        get: function() {
          return currentTarget;
        }
      });
      Object.defineProperty(dispatchedEvent, 'target', {
        value: currentTarget
      });
      Object.defineProperty(dispatchedEvent, 'preventDefault', {
        value: function() {
          return event.preventDefault();
        }
      });
      Object.defineProperty(dispatchedEvent, 'stopPropagation', {
        value: function() {
          event.stopPropagation();
          return propagationStopped = true;
        }
      });
      Object.defineProperty(dispatchedEvent, 'stopImmediatePropagation', {
        value: function() {
          event.stopImmediatePropagation();
          propagationStopped = true;
          return immediatePropagationStopped = true;
        }
      });
      Object.defineProperty(dispatchedEvent, 'abortKeyBinding', {
        value: function() {
          return typeof event.abortKeyBinding === "function" ? event.abortKeyBinding() : void 0;
        }
      });
      ref2 = Object.keys(event);
      for (i = 0, len = ref2.length; i < len; i++) {
        key = ref2[i];
        dispatchedEvent[key] = event[key];
      }
      this.emitter.emit('will-dispatch', dispatchedEvent);
      while (true) {
        listeners = (ref3 = (ref4 = this.inlineListenersByCommandName[event.type]) != null ? ref4.get(currentTarget) : void 0) != null ? ref3 : [];
        if (currentTarget.webkitMatchesSelector != null) {
          selectorBasedListeners = ((ref5 = this.selectorBasedListenersByCommandName[event.type]) != null ? ref5 : []).filter(function(listener) {
            return currentTarget.webkitMatchesSelector(listener.selector);
          }).sort(function(a, b) {
            return a.compare(b);
          });
          listeners = selectorBasedListeners.concat(listeners);
        }
        if (listeners.length > 0) {
          matched = true;
        }
        for (j = listeners.length - 1; j >= 0; j += -1) {
          listener = listeners[j];
          if (immediatePropagationStopped) {
            break;
          }
          listener.callback.call(currentTarget, dispatchedEvent);
        }
        if (currentTarget === window) {
          break;
        }
        if (propagationStopped) {
          break;
        }
        currentTarget = (ref6 = currentTarget.parentNode) != null ? ref6 : window;
      }
      this.emitter.emit('did-dispatch', dispatchedEvent);
      return matched;
    };

    CommandRegistry.prototype.commandRegistered = function(commandName) {
      if ((this.rootNode != null) && !this.registeredCommands[commandName]) {
        this.rootNode.addEventListener(commandName, this.handleCommandEvent, true);
        return this.registeredCommands[commandName] = true;
      }
    };

    return CommandRegistry;

  })();

  SelectorBasedListener = (function() {
    function SelectorBasedListener(selector1, callback1) {
      this.selector = selector1;
      this.callback = callback1;
      this.specificity = calculateSpecificity(this.selector);
      this.sequenceNumber = SequenceCount++;
    }

    SelectorBasedListener.prototype.compare = function(other) {
      return this.specificity - other.specificity || this.sequenceNumber - other.sequenceNumber;
    };

    return SelectorBasedListener;

  })();

  InlineListener = (function() {
    function InlineListener(callback1) {
      this.callback = callback1;
    }

    return InlineListener;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9jb21tYW5kLXJlZ2lzdHJ5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEscUtBQUE7SUFBQTs7RUFBQSxNQUE2QyxPQUFBLENBQVEsV0FBUixDQUE3QyxFQUFDLHFCQUFELEVBQVUsMkJBQVYsRUFBc0I7O0VBQ3RCLE9BQTJDLE9BQUEsQ0FBUSxXQUFSLENBQTNDLEVBQUMsZ0RBQUQsRUFBdUI7O0VBQ3ZCLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosYUFBQSxHQUFnQjs7RUF3Q2hCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx5QkFBQTs7TUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZO01BQ1osSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUZXOzs4QkFJYixLQUFBLEdBQU8sU0FBQTtNQUNMLElBQUMsQ0FBQSxrQkFBRCxHQUFzQjtNQUN0QixJQUFDLENBQUEsbUNBQUQsR0FBdUM7TUFDdkMsSUFBQyxDQUFBLDRCQUFELEdBQWdDO2FBQ2hDLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtJQUpWOzs4QkFNUCxNQUFBLEdBQVEsU0FBQyxRQUFEO0FBQ04sVUFBQTtNQURPLElBQUMsQ0FBQSxXQUFEO0FBQ1AsV0FBQSxtREFBQTtRQUFBLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixPQUFuQjtBQUFBO0FBQ0E7V0FBQSw0Q0FBQTtxQkFBQSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsT0FBbkI7QUFBQTs7SUFGTTs7OEJBSVIsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO0FBQUEsV0FBQSxzQ0FBQTtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsbUJBQVYsQ0FBOEIsV0FBOUIsRUFBMkMsSUFBQyxDQUFBLGtCQUE1QyxFQUFnRSxJQUFoRTtBQURGO0lBRE87OzhC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aXJlICdldmVudC1raXQnXG57Y2FsY3VsYXRlU3BlY2lmaWNpdHksIHZhbGlkYXRlU2VsZWN0b3J9ID0gcmVxdWlyZSAnY2xlYXItY3V0J1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuU2VxdWVuY2VDb3VudCA9IDBcblxuIyBQdWJsaWM6IEFzc29jaWF0ZXMgbGlzdGVuZXIgZnVuY3Rpb25zIHdpdGggY29tbWFuZHMgaW4gYVxuIyBjb250ZXh0LXNlbnNpdGl2ZSB3YXkgdXNpbmcgQ1NTIHNlbGVjdG9ycy4gWW91IGNhbiBhY2Nlc3MgYSBnbG9iYWwgaW5zdGFuY2Ugb2ZcbiMgdGhpcyBjbGFzcyB2aWEgYGF0b20uY29tbWFuZHNgLCBhbmQgY29tbWFuZHMgcmVnaXN0ZXJlZCB0aGVyZSB3aWxsIGJlXG4jIHByZXNlbnRlZCBpbiB0aGUgY29tbWFuZCBwYWxldHRlLlxuI1xuIyBUaGUgZ2xvYmFsIGNvbW1hbmQgcmVnaXN0cnkgZmFjaWxpdGF0ZXMgYSBzdHlsZSBvZiBldmVudCBoYW5kbGluZyBrbm93biBhc1xuIyAqZXZlbnQgZGVsZWdhdGlvbiogdGhhdCB3YXMgcG9wdWxhcml6ZWQgYnkgalF1ZXJ5LiBBdG9tIGNvbW1hbmRzIGFyZSBleHByZXNzZWRcbiMgYXMgY3VzdG9tIERPTSBldmVudHMgdGhhdCBjYW4gYmUgaW52b2tlZCBvbiB0aGUgY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudCB2aWFcbiMgYSBrZXkgYmluZGluZyBvciBtYW51YWxseSB2aWEgdGhlIGNvbW1hbmQgcGFsZXR0ZS4gUmF0aGVyIHRoYW4gYmluZGluZ1xuIyBsaXN0ZW5lcnMgZm9yIGNvbW1hbmQgZXZlbnRzIGRpcmVjdGx5IHRvIERPTSBub2RlcywgeW91IGluc3RlYWQgcmVnaXN0ZXJcbiMgY29tbWFuZCBldmVudCBsaXN0ZW5lcnMgZ2xvYmFsbHkgb24gYGF0b20uY29tbWFuZHNgIGFuZCBjb25zdHJhaW4gdGhlbSB0b1xuIyBzcGVjaWZpYyBraW5kcyBvZiBlbGVtZW50cyB3aXRoIENTUyBzZWxlY3RvcnMuXG4jXG4jIENvbW1hbmQgbmFtZXMgbXVzdCBmb2xsb3cgdGhlIGBuYW1lc3BhY2U6YWN0aW9uYCBwYXR0ZXJuLCB3aGVyZSBgbmFtZXNwYWNlYFxuIyB3aWxsIHR5cGljYWxseSBiZSB0aGUgbmFtZSBvZiB5b3VyIHBhY2thZ2UsIGFuZCBgYWN0aW9uYCBkZXNjcmliZXMgdGhlXG4jIGJlaGF2aW9yIG9mIHlvdXIgY29tbWFuZC4gSWYgZWl0aGVyIHBhcnQgY29uc2lzdHMgb2YgbXVsdGlwbGUgd29yZHMsIHRoZXNlXG4jIG11c3QgYmUgc2VwYXJhdGVkIGJ5IGh5cGhlbnMuIEUuZy4gYGF3ZXNvbWUtcGFja2FnZTp0dXJuLWl0LXVwLXRvLWVsZXZlbmAuXG4jIEFsbCB3b3JkcyBzaG91bGQgYmUgbG93ZXJjYXNlZC5cbiNcbiMgQXMgdGhlIGV2ZW50IGJ1YmJsZXMgdXB3YXJkIHRocm91Z2ggdGhlIERPTSwgYWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzXG4jIHdpdGggbWF0Y2hpbmcgc2VsZWN0b3JzIGFyZSBpbnZva2VkIGluIG9yZGVyIG9mIHNwZWNpZmljaXR5LiBJbiB0aGUgZXZlbnQgb2YgYVxuIyBzcGVjaWZpY2l0eSB0aWUsIHRoZSBtb3N0IHJlY2VudGx5IHJlZ2lzdGVyZWQgbGlzdGVuZXIgaXMgaW52b2tlZCBmaXJzdC4gVGhpc1xuIyBtaXJyb3JzIHRoZSBcImNhc2NhZGVcIiBzZW1hbnRpY3Mgb2YgQ1NTLiBFdmVudCBsaXN0ZW5lcnMgYXJlIGludm9rZWQgaW4gdGhlXG4jIGNvbnRleHQgb2YgdGhlIGN1cnJlbnQgRE9NIG5vZGUsIG1lYW5pbmcgYHRoaXNgIGFsd2F5cyBwb2ludHMgYXRcbiMgYGV2ZW50LmN1cnJlbnRUYXJnZXRgLiBBcyBpcyBub3JtYWxseSB0aGUgY2FzZSB3aXRoIERPTSBldmVudHMsXG4jIGBzdG9wUHJvcGFnYXRpb25gIGFuZCBgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uYCBjYW4gYmUgdXNlZCB0byB0ZXJtaW5hdGUgdGhlXG4jIGJ1YmJsaW5nIHByb2Nlc3MgYW5kIHByZXZlbnQgaW52b2NhdGlvbiBvZiBhZGRpdGlvbmFsIGxpc3RlbmVycy5cbiNcbiMgIyMgRXhhbXBsZVxuI1xuIyBIZXJlIGlzIGEgY29tbWFuZCB0aGF0IGluc2VydHMgdGhlIGN1cnJlbnQgZGF0ZSBpbiBhbiBlZGl0b3I6XG4jXG4jIGBgYGNvZmZlZVxuIyBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4jICAgJ3VzZXI6aW5zZXJ0LWRhdGUnOiAoZXZlbnQpIC0+XG4jICAgICBlZGl0b3IgPSBAZ2V0TW9kZWwoKVxuIyAgICAgZWRpdG9yLmluc2VydFRleHQobmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpKVxuIyBgYGBcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvbW1hbmRSZWdpc3RyeVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAcm9vdE5vZGUgPSBudWxsXG4gICAgQGNsZWFyKClcblxuICBjbGVhcjogLT5cbiAgICBAcmVnaXN0ZXJlZENvbW1hbmRzID0ge31cbiAgICBAc2VsZWN0b3JCYXNlZExpc3RlbmVyc0J5Q29tbWFuZE5hbWUgPSB7fVxuICAgIEBpbmxpbmVMaXN0ZW5lcnNCeUNvbW1hbmROYW1lID0ge31cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgYXR0YWNoOiAoQHJvb3ROb2RlKSAtPlxuICAgIEBjb21tYW5kUmVnaXN0ZXJlZChjb21tYW5kKSBmb3IgY29tbWFuZCBvZiBAc2VsZWN0b3JCYXNlZExpc3RlbmVyc0J5Q29tbWFuZE5hbWVcbiAgICBAY29tbWFuZFJlZ2lzdGVyZWQoY29tbWFuZCkgZm9yIGNvbW1hbmQgb2YgQGlubGluZUxpc3RlbmVyc0J5Q29tbWFuZE5hbWVcblxuICBkZXN0cm95OiAtPlxuICAgIGZvciBjb21tYW5kTmFtZSBvZiBAcmVnaXN0ZXJlZENvbW1hbmRzXG4gICAgICBAcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjb21tYW5kTmFtZSwgQGhhbmRsZUNvbW1hbmRFdmVudCwgdHJ1ZSlcbiAgICByZXR1cm5cblxuICAjIFB1YmxpYzogQWRkIG9uZSBvciBtb3JlIGNvbW1hbmQgbGlzdGVuZXJzIGFzc29jaWF0ZWQgd2l0aCBhIHNlbGVjdG9yLlxuICAjXG4gICMgIyMgQXJndW1lbnRzOiBSZWdpc3RlcmluZyBPbmUgQ29tbWFuZFxuICAjXG4gICMgKiBgdGFyZ2V0YCBBIHtTdHJpbmd9IGNvbnRhaW5pbmcgYSBDU1Mgc2VsZWN0b3Igb3IgYSBET00gZWxlbWVudC4gSWYgeW91XG4gICMgICBwYXNzIGEgc2VsZWN0b3IsIHRoZSBjb21tYW5kIHdpbGwgYmUgZ2xvYmFsbHkgYXNzb2NpYXRlZCB3aXRoIGFsbCBtYXRjaGluZ1xuICAjICAgZWxlbWVudHMuIFRoZSBgLGAgY29tYmluYXRvciBpcyBub3QgY3VycmVudGx5IHN1cHBvcnRlZC4gSWYgeW91IHBhc3MgYVxuICAjICAgRE9NIGVsZW1lbnQsIHRoZSBjb21tYW5kIHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIGp1c3QgdGhhdCBlbGVtZW50LlxuICAjICogYGNvbW1hbmROYW1lYCBBIHtTdHJpbmd9IGNvbnRhaW5pbmcgdGhlIG5hbWUgb2YgYSBjb21tYW5kIHlvdSB3YW50IHRvXG4gICMgICBoYW5kbGUgc3VjaCBhcyBgdXNlcjppbnNlcnQtZGF0ZWAuXG4gICMgKiBgY2FsbGJhY2tgIEEge0Z1bmN0aW9ufSB0byBjYWxsIHdoZW4gdGhlIGdpdmVuIGNvbW1hbmQgaXMgaW52b2tlZCBvbiBhblxuICAjICAgZWxlbWVudCBtYXRjaGluZyB0aGUgc2VsZWN0b3IuIEl0IHdpbGwgYmUgY2FsbGVkIHdpdGggYHRoaXNgIHJlZmVyZW5jaW5nXG4gICMgICB0aGUgbWF0Y2hpbmcgRE9NIG5vZGUuXG4gICMgICAqIGBldmVudGAgQSBzdGFuZGFyZCBET00gZXZlbnQgaW5zdGFuY2UuIENhbGwgYHN0b3BQcm9wYWdhdGlvbmAgb3JcbiAgIyAgICAgYHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbmAgdG8gdGVybWluYXRlIGJ1YmJsaW5nIGVhcmx5LlxuICAjXG4gICMgIyMgQXJndW1lbnRzOiBSZWdpc3RlcmluZyBNdWx0aXBsZSBDb21tYW5kc1xuICAjXG4gICMgKiBgdGFyZ2V0YCBBIHtTdHJpbmd9IGNvbnRhaW5pbmcgYSBDU1Mgc2VsZWN0b3Igb3IgYSBET00gZWxlbWVudC4gSWYgeW91XG4gICMgICBwYXNzIGEgc2VsZWN0b3IsIHRoZSBjb21tYW5kcyB3aWxsIGJlIGdsb2JhbGx5IGFzc29jaWF0ZWQgd2l0aCBhbGxcbiAgIyAgIG1hdGNoaW5nIGVsZW1lbnRzLiBUaGUgYCxgIGNvbWJpbmF0b3IgaXMgbm90IGN1cnJlbnRseSBzdXBwb3J0ZWQuXG4gICMgICBJZiB5b3UgcGFzcyBhIERPTSBlbGVtZW50LCB0aGUgY29tbWFuZCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCBqdXN0IHRoYXRcbiAgIyAgIGVsZW1lbnQuXG4gICMgKiBgY29tbWFuZHNgIEFuIHtPYmplY3R9IG1hcHBpbmcgY29tbWFuZCBuYW1lcyBsaWtlIGB1c2VyOmluc2VydC1kYXRlYCB0b1xuICAjICAgbGlzdGVuZXIge0Z1bmN0aW9ufXMuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHJlbW92ZSB0aGVcbiAgIyBhZGRlZCBjb21tYW5kIGhhbmRsZXIocykuXG4gIGFkZDogKHRhcmdldCwgY29tbWFuZE5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHR5cGVvZiBjb21tYW5kTmFtZSBpcyAnb2JqZWN0J1xuICAgICAgY29tbWFuZHMgPSBjb21tYW5kTmFtZVxuICAgICAgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICBmb3IgY29tbWFuZE5hbWUsIGNhbGxiYWNrIG9mIGNvbW1hbmRzXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkIEBhZGQodGFyZ2V0LCBjb21tYW5kTmFtZSwgY2FsbGJhY2spXG4gICAgICByZXR1cm4gZGlzcG9zYWJsZVxuXG4gICAgaWYgdHlwZW9mIGNhbGxiYWNrIGlzbnQgJ2Z1bmN0aW9uJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcmVnaXN0ZXIgYSBjb21tYW5kIHdpdGggbm9uLWZ1bmN0aW9uIGNhbGxiYWNrLlwiKVxuXG4gICAgaWYgdHlwZW9mIHRhcmdldCBpcyAnc3RyaW5nJ1xuICAgICAgdmFsaWRhdGVTZWxlY3Rvcih0YXJnZXQpXG4gICAgICBAYWRkU2VsZWN0b3JCYXNlZExpc3RlbmVyKHRhcmdldCwgY29tbWFuZE5hbWUsIGNhbGxiYWNrKVxuICAgIGVsc2VcbiAgICAgIEBhZGRJbmxpbmVMaXN0ZW5lcih0YXJnZXQsIGNvbW1hbmROYW1lLCBjYWxsYmFjaylcblxuICBhZGRTZWxlY3RvckJhc2VkTGlzdGVuZXI6IChzZWxlY3RvciwgY29tbWFuZE5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIEBzZWxlY3RvckJhc2VkTGlzdGVuZXJzQnlDb21tYW5kTmFtZVtjb21tYW5kTmFtZV0gPz0gW11cbiAgICBsaXN0ZW5lcnNGb3JDb21tYW5kID0gQHNlbGVjdG9yQmFzZWRMaXN0ZW5lcnNCeUNvbW1hbmROYW1lW2NvbW1hbmROYW1lXVxuICAgIGxpc3RlbmVyID0gbmV3IFNlbGVjdG9yQmFzZWRMaXN0ZW5lcihzZWxlY3RvciwgY2FsbGJhY2spXG4gICAgbGlzdGVuZXJzRm9yQ29tbWFuZC5wdXNoKGxpc3RlbmVyKVxuXG4gICAgQGNvbW1hbmRSZWdpc3RlcmVkKGNvbW1hbmROYW1lKVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIGxpc3RlbmVyc0ZvckNvbW1hbmQuc3BsaWNlKGxpc3RlbmVyc0ZvckNvbW1hbmQuaW5kZXhPZihsaXN0ZW5lciksIDEpXG4gICAgICBkZWxldGUgQHNlbGVjdG9yQmFzZWRMaXN0ZW5lcnNCeUNvbW1hbmROYW1lW2NvbW1hbmROYW1lXSBpZiBsaXN0ZW5lcnNGb3JDb21tYW5kLmxlbmd0aCBpcyAwXG5cbiAgYWRkSW5saW5lTGlzdGVuZXI6IChlbGVtZW50LCBjb21tYW5kTmFtZSwgY2FsbGJhY2spIC0+XG4gICAgQGlubGluZUxpc3RlbmVyc0J5Q29tbWFuZE5hbWVbY29tbWFuZE5hbWVdID89IG5ldyBXZWFrTWFwXG5cbiAgICBsaXN0ZW5lcnNGb3JDb21tYW5kID0gQGlubGluZUxpc3RlbmVyc0J5Q29tbWFuZE5hbWVbY29tbWFuZE5hbWVdXG4gICAgdW5sZXNzIGxpc3RlbmVyc0ZvckVsZW1lbnQgPSBsaXN0ZW5lcnNGb3JDb21tYW5kLmdldChlbGVtZW50KVxuICAgICAgbGlzdGVuZXJzRm9yRWxlbWVudCA9IFtdXG4gICAgICBsaXN0ZW5lcnNGb3JDb21tYW5kLnNldChlbGVtZW50LCBsaXN0ZW5lcnNGb3JFbGVtZW50KVxuICAgIGxpc3RlbmVyID0gbmV3IElubGluZUxpc3RlbmVyKGNhbGxiYWNrKVxuICAgIGxpc3RlbmVyc0ZvckVsZW1lbnQucHVzaChsaXN0ZW5lcilcblxuICAgIEBjb21tYW5kUmVnaXN0ZXJlZChjb21tYW5kTmFtZSlcblxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBsaXN0ZW5lcnNGb3JFbGVtZW50LnNwbGljZShsaXN0ZW5lcnNGb3JFbGVtZW50LmluZGV4T2YobGlzdGVuZXIpLCAxKVxuICAgICAgbGlzdGVuZXJzRm9yQ29tbWFuZC5kZWxldGUoZWxlbWVudCkgaWYgbGlzdGVuZXJzRm9yRWxlbWVudC5sZW5ndGggaXMgMFxuXG4gICMgUHVibGljOiBGaW5kIGFsbCByZWdpc3RlcmVkIGNvbW1hbmRzIG1hdGNoaW5nIGEgcXVlcnkuXG4gICNcbiAgIyAqIGBwYXJhbXNgIEFuIHtPYmplY3R9IGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgb2YgdGhlIGZvbGxvd2luZyBrZXlzOlxuICAjICAgKiBgdGFyZ2V0YCBBIERPTSBub2RlIHRoYXQgaXMgdGhlIGh5cG90aGV0aWNhbCB0YXJnZXQgb2YgYSBnaXZlbiBjb21tYW5kLlxuICAjXG4gICMgUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtPYmplY3R9cyBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcga2V5czpcbiAgIyAgKiBgbmFtZWAgVGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQuIEZvciBleGFtcGxlLCBgdXNlcjppbnNlcnQtZGF0ZWAuXG4gICMgICogYGRpc3BsYXlOYW1lYCBUaGUgZGlzcGxheSBuYW1lIG9mIHRoZSBjb21tYW5kLiBGb3IgZXhhbXBsZSxcbiAgIyAgICBgVXNlcjogSW5zZXJ0IERhdGVgLlxuICBmaW5kQ29tbWFuZHM6ICh7dGFyZ2V0fSkgLT5cbiAgICBjb21tYW5kTmFtZXMgPSBuZXcgU2V0XG4gICAgY29tbWFuZHMgPSBbXVxuICAgIGN1cnJlbnRUYXJnZXQgPSB0YXJnZXRcbiAgICBsb29wXG4gICAgICBmb3IgbmFtZSwgbGlzdGVuZXJzIG9mIEBpbmxpbmVMaXN0ZW5lcnNCeUNvbW1hbmROYW1lXG4gICAgICAgIGlmIGxpc3RlbmVycy5oYXMoY3VycmVudFRhcmdldCkgYW5kIG5vdCBjb21tYW5kTmFtZXMuaGFzKG5hbWUpXG4gICAgICAgICAgY29tbWFuZE5hbWVzLmFkZChuYW1lKVxuICAgICAgICAgIGNvbW1hbmRzLnB1c2goe25hbWUsIGRpc3BsYXlOYW1lOiBfLmh1bWFuaXplRXZlbnROYW1lKG5hbWUpfSlcblxuICAgICAgZm9yIGNvbW1hbmROYW1lLCBsaXN0ZW5lcnMgb2YgQHNlbGVjdG9yQmFzZWRMaXN0ZW5lcnNCeUNvbW1hbmROYW1lXG4gICAgICAgIGZvciBsaXN0ZW5lciBpbiBsaXN0ZW5lcnNcbiAgICAgICAgICBpZiBjdXJyZW50VGFyZ2V0LndlYmtpdE1hdGNoZXNTZWxlY3Rvcj8obGlzdGVuZXIuc2VsZWN0b3IpXG4gICAgICAgICAgICB1bmxlc3MgY29tbWFuZE5hbWVzLmhhcyhjb21tYW5kTmFtZSlcbiAgICAgICAgICAgICAgY29tbWFuZE5hbWVzLmFkZChjb21tYW5kTmFtZSlcbiAgICAgICAgICAgICAgY29tbWFuZHMucHVzaFxuICAgICAgICAgICAgICAgIG5hbWU6IGNvbW1hbmROYW1lXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IF8uaHVtYW5pemVFdmVudE5hbWUoY29tbWFuZE5hbWUpXG5cbiAgICAgIGJyZWFrIGlmIGN1cnJlbnRUYXJnZXQgaXMgd2luZG93XG4gICAgICBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlID8gd2luZG93XG5cbiAgICBjb21tYW5kc1xuXG4gICMgUHVibGljOiBTaW11bGF0ZSB0aGUgZGlzcGF0Y2ggb2YgYSBjb21tYW5kIG9uIGEgRE9NIG5vZGUuXG4gICNcbiAgIyBUaGlzIGNhbiBiZSB1c2VmdWwgZm9yIHRlc3Rpbmcgd2hlbiB5b3Ugd2FudCB0byBzaW11bGF0ZSB0aGUgaW52b2NhdGlvbiBvZiBhXG4gICMgY29tbWFuZCBvbiBhIGRldGFjaGVkIERPTSBub2RlLiBPdGhlcndpc2UsIHRoZSBET00gbm9kZSBpbiBxdWVzdGlvbiBuZWVkcyB0b1xuICAjIGJlIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBzbyB0aGUgZXZlbnQgYnViYmxlcyB1cCB0byB0aGUgcm9vdCBub2RlIHRvIGJlXG4gICMgcHJvY2Vzc2VkLlxuICAjXG4gICMgKiBgdGFyZ2V0YCBUaGUgRE9NIG5vZGUgYXQgd2hpY2ggdG8gc3RhcnQgYnViYmxpbmcgdGhlIGNvbW1hbmQgZXZlbnQuXG4gICMgKiBgY29tbWFuZE5hbWVgIHtTdHJpbmd9IGluZGljYXRpbmcgdGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQgdG8gZGlzcGF0Y2guXG4gIGRpc3BhdGNoOiAodGFyZ2V0LCBjb21tYW5kTmFtZSwgZGV0YWlsKSAtPlxuICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGNvbW1hbmROYW1lLCB7YnViYmxlczogdHJ1ZSwgZGV0YWlsfSlcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICd0YXJnZXQnLCB2YWx1ZTogdGFyZ2V0KVxuICAgIEBoYW5kbGVDb21tYW5kRXZlbnQoZXZlbnQpXG5cbiAgIyBQdWJsaWM6IEludm9rZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgYmVmb3JlIGRpc3BhdGNoaW5nIGEgY29tbWFuZCBldmVudC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBiZWZvcmUgZGlzcGF0Y2hpbmcgZWFjaCBjb21tYW5kXG4gICMgICAqIGBldmVudGAgVGhlIEV2ZW50IHRoYXQgd2lsbCBiZSBkaXNwYXRjaGVkXG4gIG9uV2lsbERpc3BhdGNoOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ3dpbGwtZGlzcGF0Y2gnLCBjYWxsYmFja1xuXG4gICMgUHVibGljOiBJbnZva2UgdGhlIGdpdmVuIGNhbGxiYWNrIGFmdGVyIGRpc3BhdGNoaW5nIGEgY29tbWFuZCBldmVudC5cbiAgI1xuICAjICogYGNhbGxiYWNrYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCBhZnRlciBkaXNwYXRjaGluZyBlYWNoIGNvbW1hbmRcbiAgIyAgICogYGV2ZW50YCBUaGUgRXZlbnQgdGhhdCB3YXMgZGlzcGF0Y2hlZFxuICBvbkRpZERpc3BhdGNoOiAoY2FsbGJhY2spIC0+XG4gICAgQGVtaXR0ZXIub24gJ2RpZC1kaXNwYXRjaCcsIGNhbGxiYWNrXG5cbiAgZ2V0U25hcHNob3Q6IC0+XG4gICAgc25hcHNob3QgPSB7fVxuICAgIGZvciBjb21tYW5kTmFtZSwgbGlzdGVuZXJzIG9mIEBzZWxlY3RvckJhc2VkTGlzdGVuZXJzQnlDb21tYW5kTmFtZVxuICAgICAgc25hcHNob3RbY29tbWFuZE5hbWVdID0gbGlzdGVuZXJzLnNsaWNlKClcbiAgICBzbmFwc2hvdFxuXG4gIHJlc3RvcmVTbmFwc2hvdDogKHNuYXBzaG90KSAtPlxuICAgIEBzZWxlY3RvckJhc2VkTGlzdGVuZXJzQnlDb21tYW5kTmFtZSA9IHt9XG4gICAgZm9yIGNvbW1hbmROYW1lLCBsaXN0ZW5lcnMgb2Ygc25hcHNob3RcbiAgICAgIEBzZWxlY3RvckJhc2VkTGlzdGVuZXJzQnlDb21tYW5kTmFtZVtjb21tYW5kTmFtZV0gPSBsaXN0ZW5lcnMuc2xpY2UoKVxuICAgIHJldHVyblxuXG4gIGhhbmRsZUNvbW1hbmRFdmVudDogKGV2ZW50KSA9PlxuICAgIHByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlXG4gICAgaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gZmFsc2VcbiAgICBtYXRjaGVkID0gZmFsc2VcbiAgICBjdXJyZW50VGFyZ2V0ID0gZXZlbnQudGFyZ2V0XG5cbiAgICBkaXNwYXRjaGVkRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnQudHlwZSwge2J1YmJsZXM6IHRydWUsIGRldGFpbDogZXZlbnQuZGV0YWlsfSlcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlzcGF0Y2hlZEV2ZW50LCAnZXZlbnRQaGFzZScsIHZhbHVlOiBFdmVudC5CVUJCTElOR19QSEFTRVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBkaXNwYXRjaGVkRXZlbnQsICdjdXJyZW50VGFyZ2V0JywgZ2V0OiAtPiBjdXJyZW50VGFyZ2V0XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5IGRpc3BhdGNoZWRFdmVudCwgJ3RhcmdldCcsIHZhbHVlOiBjdXJyZW50VGFyZ2V0XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5IGRpc3BhdGNoZWRFdmVudCwgJ3ByZXZlbnREZWZhdWx0JywgdmFsdWU6IC0+XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5IGRpc3BhdGNoZWRFdmVudCwgJ3N0b3BQcm9wYWdhdGlvbicsIHZhbHVlOiAtPlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIHByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWVcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkgZGlzcGF0Y2hlZEV2ZW50LCAnc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uJywgdmFsdWU6IC0+XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgcHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZVxuICAgICAgaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBkaXNwYXRjaGVkRXZlbnQsICdhYm9ydEtleUJpbmRpbmcnLCB2YWx1ZTogLT5cbiAgICAgIGV2ZW50LmFib3J0S2V5QmluZGluZz8oKVxuXG4gICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyhldmVudClcbiAgICAgIGRpc3BhdGNoZWRFdmVudFtrZXldID0gZXZlbnRba2V5XVxuXG4gICAgQGVtaXR0ZXIuZW1pdCAnd2lsbC1kaXNwYXRjaCcsIGRpc3BhdGNoZWRFdmVudFxuXG4gICAgbG9vcFxuICAgICAgbGlzdGVuZXJzID0gQGlubGluZUxpc3RlbmVyc0J5Q29tbWFuZE5hbWVbZXZlbnQudHlwZV0/LmdldChjdXJyZW50VGFyZ2V0KSA/IFtdXG4gICAgICBpZiBjdXJyZW50VGFyZ2V0LndlYmtpdE1hdGNoZXNTZWxlY3Rvcj9cbiAgICAgICAgc2VsZWN0b3JCYXNlZExpc3RlbmVycyA9XG4gICAgICAgICAgKEBzZWxlY3RvckJhc2VkTGlzdGVuZXJzQnlDb21tYW5kTmFtZVtldmVudC50eXBlXSA/IFtdKVxuICAgICAgICAgICAgLmZpbHRlciAobGlzdGVuZXIpIC0+IGN1cnJlbnRUYXJnZXQud2Via2l0TWF0Y2hlc1NlbGVjdG9yKGxpc3RlbmVyLnNlbGVjdG9yKVxuICAgICAgICAgICAgLnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuICAgICAgICBsaXN0ZW5lcnMgPSBzZWxlY3RvckJhc2VkTGlzdGVuZXJzLmNvbmNhdChsaXN0ZW5lcnMpXG5cbiAgICAgIG1hdGNoZWQgPSB0cnVlIGlmIGxpc3RlbmVycy5sZW5ndGggPiAwXG5cbiAgICAgICMgQ2FsbCBpbmxpbmUgbGlzdGVuZXJzIGZpcnN0IGluIHJldmVyc2UgcmVnaXN0cmF0aW9uIG9yZGVyLFxuICAgICAgIyBhbmQgc2VsZWN0b3ItYmFzZWQgbGlzdGVuZXJzIGJ5IHNwZWNpZmljaXR5IGFuZCByZXZlcnNlXG4gICAgICAjIHJlZ2lzdHJhdGlvbiBvcmRlci5cbiAgICAgIGZvciBsaXN0ZW5lciBpbiBsaXN0ZW5lcnMgYnkgLTFcbiAgICAgICAgYnJlYWsgaWYgaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkXG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrLmNhbGwoY3VycmVudFRhcmdldCwgZGlzcGF0Y2hlZEV2ZW50KVxuXG4gICAgICBicmVhayBpZiBjdXJyZW50VGFyZ2V0IGlzIHdpbmRvd1xuICAgICAgYnJlYWsgaWYgcHJvcGFnYXRpb25TdG9wcGVkXG4gICAgICBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlID8gd2luZG93XG5cbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtZGlzcGF0Y2gnLCBkaXNwYXRjaGVkRXZlbnRcblxuICAgIG1hdGNoZWRcblxuICBjb21tYW5kUmVnaXN0ZXJlZDogKGNvbW1hbmROYW1lKSAtPlxuICAgIGlmIEByb290Tm9kZT8gYW5kIG5vdCBAcmVnaXN0ZXJlZENvbW1hbmRzW2NvbW1hbmROYW1lXVxuICAgICAgQHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoY29tbWFuZE5hbWUsIEBoYW5kbGVDb21tYW5kRXZlbnQsIHRydWUpXG4gICAgICBAcmVnaXN0ZXJlZENvbW1hbmRzW2NvbW1hbmROYW1lXSA9IHRydWVcblxuY2xhc3MgU2VsZWN0b3JCYXNlZExpc3RlbmVyXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdG9yLCBAY2FsbGJhY2spIC0+XG4gICAgQHNwZWNpZmljaXR5ID0gY2FsY3VsYXRlU3BlY2lmaWNpdHkoQHNlbGVjdG9yKVxuICAgIEBzZXF1ZW5jZU51bWJlciA9IFNlcXVlbmNlQ291bnQrK1xuXG4gIGNvbXBhcmU6IChvdGhlcikgLT5cbiAgICBAc3BlY2lmaWNpdHkgLSBvdGhlci5zcGVjaWZpY2l0eSBvclxuICAgICAgQHNlcXVlbmNlTnVtYmVyIC0gb3RoZXIuc2VxdWVuY2VOdW1iZXJcblxuY2xhc3MgSW5saW5lTGlzdGVuZXJcbiAgY29uc3RydWN0b3I6IChAY2FsbGJhY2spIC0+XG4iXX0=
