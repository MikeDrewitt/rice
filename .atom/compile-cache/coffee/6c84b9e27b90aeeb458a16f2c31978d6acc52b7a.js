(function() {
  var AnyConstructor, Disposable, Grim, ViewRegistry, _,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Grim = require('grim');

  Disposable = require('event-kit').Disposable;

  _ = require('underscore-plus');

  AnyConstructor = Symbol('any-constructor');

  module.exports = ViewRegistry = (function() {
    ViewRegistry.prototype.animationFrameRequest = null;

    ViewRegistry.prototype.documentReadInProgress = false;

    ViewRegistry.prototype.performDocumentPollAfterUpdate = false;

    ViewRegistry.prototype.debouncedPerformDocumentPoll = null;

    ViewRegistry.prototype.minimumPollInterval = 200;

    function ViewRegistry(atomEnvironment) {
      this.atomEnvironment = atomEnvironment;
      this.requestDocumentPoll = bind(this.requestDocumentPoll, this);
      this.performDocumentUpdate = bind(this.performDocumentUpdate, this);
      this.observer = new MutationObserver(this.requestDocumentPoll);
      this.clear();
    }

    ViewRegistry.prototype.clear = function() {
      this.views = new WeakMap;
      this.providers = [];
      this.debouncedPerformDocumentPoll = _.throttle(this.performDocumentPoll, this.minimumPollInterval).bind(this);
      return this.clearDocumentRequests();
    };

    ViewRegistry.prototype.addViewProvider = function(modelConstructor, createView) {
      var provider;
      if (arguments.length === 1) {
        switch (typeof modelConstructor) {
          case 'function':
            provider = {
              createView: modelConstructor,
              modelConstructor: AnyConstructor
            };
            break;
          case 'object':
            Grim.deprecate("atom.views.addViewProvider now takes 2 arguments: a model constructor and a createView function. See docs for details.");
            provider = modelConstructor;
            break;
          default:
            throw new TypeError("Arguments to addViewProvider must be functions");
        }
      } else {
        provider = {
          modelConstructor: modelConstructor,
          createView: createView
        };
      }
      this.providers.push(provider);
      return new Disposable((function(_this) {
        return function() {
          return _this.providers = _this.providers.filter(function(p) {
            return p !== provider;
          });
        };
      })(this));
    };

    ViewRegistry.prototype.getViewProviderCount = function() {
      return this.providers.length;
    };

    ViewRegistry.prototype.getView = function(object) {
      var view;
      if (object == null) {
        return;
      }
      if (view = this.views.get(object)) {
        return view;
      } else {
        view = this.createView(object);
        this.views.set(object, view);
        return view;
      }
    };

    ViewRegistry.prototype.createView = function(object) {
      var element, i, len, provider, ref, ref1, view, viewConstructor;
      if (object instanceof HTMLElement) {
        return object;
      }
      if (typeof (object != null ? object.getElement : void 0) === 'function') {
        element = object.getElement();
        if (element instanceof HTMLElement) {
          return element;
        }
      }
      if ((object != null ? object.element : void 0) instanceof HTMLElement) {
        return object.element;
      }
      if (object != null ? object.jquery : void 0) {
        return object[0];
      }
      ref = this.providers;
      for (i = 0, len = ref.length; i < len; i++) {
        provider = ref[i];
        if (provider.modelConstructor === AnyConstructor) {
          if (element = provider.createView(object, this.atomEnvironment)) {
            return element;
          }
          continue;
        }
        if (object instanceof provider.modelConstructor) {
          if (element = typeof provider.createView === "function" ? provider.createView(object, this.atomEnvironment) : void 0) {
            return element;
          }
          if (viewConstructor = provider.viewConstructor) {
            element = new viewConstructor;
                        if ((ref1 = typeof element.initialize === "function" ? element.initialize(object) : void 0) != null) {
              ref1;
            } else {
              if (typeof element.setModel === "function") {
                element.setModel(object);
              }
            };
            return element;
          }
        }
      }
      if (viewConstructor = object != null ? typeof object.getViewClass === "function" ? object.getViewClass() : void 0 : void 0) {
        view = new viewConstructor(object);
        return view[0];
      }
      throw new Error("Can't create a view for " + object.constructor.name + " instance. Please register a view provider.");
    };

    ViewRegistry.prototype.updateDocument = function(fn) {
      this.documentWriters.push(fn);
      if (!this.documentReadInProgress) {
        this.requestDocumentUpdate();
      }
      return new Disposable((function(_this) {
        return function() {
          return _this.documentWriters = _this.documentWriters.filter(function(writer) {
            return writer !== fn;
          });
        };
      })(this));
    };

    ViewRegistry.prototype.readDocument = function(fn) {
      this.documentReaders.push(fn);
      this.requestDocumentUpdate();
      return new Disposable((function(_this) {
        return function() {
          return _this.documentReaders = _this.documentReaders.filter(function(reader) {
            return reader !== fn;
          });
        };
      })(this));
    };

    ViewRegistry.prototype.pollDocument = function(fn) {
      if (this.documentPollers.length === 0) {
        this.startPollingDocument();
      }
      this.documentPollers.push(fn);
      return new Disposable((function(_this) {
        return function() {
          _this.documentPollers = _this.documentPollers.filter(function(poller) {
            return poller !== fn;
          });
          if (_this.documentPollers.length === 0) {
            return _this.stopPollingDocument();
          }
        };
      })(this));
    };

    ViewRegistry.prototype.pollAfterNextUpdate = function() {
      return this.performDocumentPollAfterUpdate = true;
    };

    ViewRegistry.prototype.getNextUpdatePromise = function() {
      return this.nextUpdatePromise != null ? this.nextUpdatePromise : this.nextUpdatePromise = new Promise((function(_this) {
        return function(resolve) {
          return _this.resolveNextUpdatePromise = resolve;
        };
      })(this));
    };

    ViewRegistry.prototype.clearDocumentRequests = function() {
      this.documentReaders = [];
      this.documentWriters = [];
      this.documentPollers = [];
      this.nextUpdatePromise = null;
      this.resolveNextUpdatePromise = null;
      if (this.animationFrameRequest != null) {
        cancelAnimationFrame(this.animationFrameRequest);
        this.animationFrameRequest = null;
      }
      return this.stopPollingDocument();
    };

    ViewRegistry.prototype.requestDocumentUpdate = function() {
      return this.animationFrameRequest != null ? this.animationFrameRequest : this.animationFrameRequest = requestAnimationFrame(this.performDocumentUpdate);
    };

    ViewRegistry.prototype.performDocumentUpdate = function() {
      var reader, resolveNextUpdatePromise, writer;
      resolveNextUpdatePromise = this.resolveNextUpdatePromise;
      this.animationFrameRequest = null;
      this.nextUpdatePromise = null;
      this.resolveNextUpdatePromise = null;
      while (writer = this.documentWriters.shift()) {
        writer();
      }
      this.documentReadInProgress = true;
      while (reader = this.documentReaders.shift()) {
        reader();
      }
      if (this.performDocumentPollAfterUpdate) {
        this.performDocumentPoll();
      }
      this.performDocumentPollAfterUpdate = false;
      this.documentReadInProgress = false;
      while (writer = this.documentWriters.shift()) {
        writer();
      }
      return typeof resolveNextUpdatePromise === "function" ? resolveNextUpdatePromise() : void 0;
    };

    ViewRegistry.prototype.startPollingDocument = function() {
      window.addEventListener('resize', this.requestDocumentPoll);
      return this.observer.observe(document, {
        subtree: true,
        childList: true,
        attributes: true
      });
    };

    ViewRegistry.prototype.stopPollingDocument = function() {
      window.removeEventListener('resize', this.requestDocumentPoll);
      return this.observer.disconnect();
    };

    ViewRegistry.prototype.requestDocumentPoll = function() {
      if (this.animationFrameRequest != null) {
        return this.performDocumentPollAfterUpdate = true;
      } else {
        return this.debouncedPerformDocumentPoll();
      }
    };

    ViewRegistry.prototype.performDocumentPoll = function() {
      var i, len, poller, ref;
      ref = this.documentPollers;
      for (i = 0, len = ref.length; i < len; i++) {
        poller = ref[i];
        poller();
      }
    };

    return ViewRegistry;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy92aWV3LXJlZ2lzdHJ5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaURBQUE7SUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ04sYUFBYyxPQUFBLENBQVEsV0FBUjs7RUFDZixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLGNBQUEsR0FBaUIsTUFBQSxDQUFPLGlCQUFQOztFQTJDakIsTUFBTSxDQUFDLE9BQVAsR0FDTTsyQkFDSixxQkFBQSxHQUF1Qjs7MkJBQ3ZCLHNCQUFBLEdBQXdCOzsyQkFDeEIsOEJBQUEsR0FBZ0M7OzJCQUNoQyw0QkFBQSxHQUE4Qjs7MkJBQzlCLG1CQUFBLEdBQXFCOztJQUVSLHNCQUFDLGVBQUQ7TUFBQyxJQUFDLENBQUEsa0JBQUQ7OztNQUNaLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsZ0JBQUEsQ0FBaUIsSUFBQyxDQUFBLG1CQUFsQjtNQUNoQixJQUFDLENBQUEsS0FBRCxDQUFBO0lBRlc7OzJCQUliLEtBQUEsR0FBTyxTQUFBO01BQ0wsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJO01BQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSw0QkFBRCxHQUFnQyxDQUFDLENBQUMsUUFBRixDQUFXLElBQUMsQ0FBQSxtQkFBWixFQUFpQyxJQUFDLENBQUEsbUJBQWxDLENBQXNELENBQUMsSUFBdkQsQ0FBNEQsSUFBNUQ7YUFDaEMsSUFBQyxDQUFBLHFCQUFELENBQUE7SUFKSzs7MkJBa0NQLGVBQUEsR0FBaUIsU0FBQyxnQkFBRCxFQUFtQixVQUFuQjtBQUNmLFVBQUE7TUFBQSxJQUFHLFNBQVMsQ0FBQyxNQUFWLEtBQW9CLENBQXZCO0FBQ0UsZ0JBQU8sT0FBTyxnQkFB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LElBQUMsQ0FBQSxlQUFlLENBQUMsS0FBakIsQ0FBQSxDQUFmO1FBQVQsTUFBQSxDQUFBO01BQVM7TUFDVCxJQUEwQixJQUFDLENBQUEsOEJBQTNCO1FBQUEsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFBQTs7TUFDQSxJQUFDLENBQUEsOEJBQUQsR0FBa0M7TUFDbEMsSUFBQyxDQUFBLHNCQUFELEdBQTBCO0FBR2pCLGFBQU0sTUFBQSxHQUFTLElBQUMsQ0FBQSxlQUFlLENBQUMsS0FBakIsQ0FBQSxDQUFmO1FBQVQsTUFBQSxDQUFBO01BQVM7OERBRVQ7SUFqQnFCOzsyQkFtQnZCLG9CQUFBLEdBQXNCLFNBQUE7TUFDcEIsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLElBQUMsQ0FBQSxtQkFBbkM7YUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsQ0FBa0IsUUFBbEIsRUFBNEI7UUFBQyxPQUFBLEVBQVMsSUFBVjtRQUFnQixTQUFBLEVBQVcsSUFBM0I7UUFBaUMsVUFBQSxFQUFZLElBQTdDO09BQTVCO0lBRm9COzsyQkFJdEIsbUJBQUEsR0FBcUIsU0FBQTtNQUNuQixNQUFNLENBQUMsbUJBQVAsQ0FBMkIsUUFBM0IsRUFBcUMsSUFBQyxDQUFBLG1CQUF0QzthQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBVixDQUFBO0lBRm1COzsyQkFJckIsbUJBQUEsR0FBcUIsU0FBQTtNQUNuQixJQUFHLGtDQUFIO2VBQ0UsSUFBQyxDQUFBLDhCQUFELEdBQWtDLEtBRHBDO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSw0QkFBRCxDQUFBLEVBSEY7O0lBRG1COzsyQkFNckIsbUJBQUEsR0FBcUIsU0FBQTtBQUNuQixVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUFBLE1BQUEsQ0FBQTtBQUFBO0lBRG1COzs7OztBQXhSdkIiLCJzb3VyY2VzQ29udGVudCI6WyJHcmltID0gcmVxdWlyZSAnZ3JpbSdcbntEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2V2ZW50LWtpdCdcbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbkFueUNvbnN0cnVjdG9yID0gU3ltYm9sKCdhbnktY29uc3RydWN0b3InKVxuXG4jIEVzc2VudGlhbDogYFZpZXdSZWdpc3RyeWAgaGFuZGxlcyB0aGUgYXNzb2NpYXRpb24gYmV0d2VlbiBtb2RlbCBhbmQgdmlld1xuIyB0eXBlcyBpbiBBdG9tLiBXZSBjYWxsIHRoaXMgYXNzb2NpYXRpb24gYSBWaWV3IFByb3ZpZGVyLiBBcyBpbiwgZm9yIGEgZ2l2ZW5cbiMgbW9kZWwsIHRoaXMgY2xhc3MgY2FuIHByb3ZpZGUgYSB2aWV3IHZpYSB7OjpnZXRWaWV3fSwgYXMgbG9uZyBhcyB0aGVcbiMgbW9kZWwvdmlldyBhc3NvY2lhdGlvbiB3YXMgcmVnaXN0ZXJlZCB2aWEgezo6YWRkVmlld1Byb3ZpZGVyfVxuI1xuIyBJZiB5b3UncmUgYWRkaW5nIHlvdXIgb3duIGtpbmQgb2YgcGFuZSBpdGVtLCBhIGdvb2Qgc3RyYXRlZ3kgZm9yIGFsbCBidXQgdGhlXG4jIHNpbXBsZXN0IGl0ZW1zIGlzIHRvIHNlcGFyYXRlIHRoZSBtb2RlbCBhbmQgdGhlIHZpZXcuIFRoZSBtb2RlbCBoYW5kbGVzXG4jIGFwcGxpY2F0aW9uIGxvZ2ljIGFuZCBpcyB0aGUgcHJpbWFyeSBwb2ludCBvZiBBUEkgaW50ZXJhY3Rpb24uIFRoZSB2aWV3XG4jIGp1c3QgaGFuZGxlcyBwcmVzZW50YXRpb24uXG4jXG4jIE5vdGU6IE1vZGVscyBjYW4gYmUgYW55IG9iamVjdCwgYnV0IG11c3QgaW1wbGVtZW50IGEgYGdldFRpdGxlKClgIGZ1bmN0aW9uXG4jIGlmIHRoZXkgYXJlIHRvIGJlIGRpc3BsYXllZCBpbiBhIHtQYW5lfVxuI1xuIyBWaWV3IHByb3ZpZGVycyBpbmZvcm0gdGhlIHdvcmtzcGFjZSBob3cgeW91ciBtb2RlbCBvYmplY3RzIHNob3VsZCBiZVxuIyBwcmVzZW50ZWQgaW4gdGhlIERPTS4gQSB2aWV3IHByb3ZpZGVyIG11c3QgYWx3YXlzIHJldHVybiBhIERPTSBub2RlLCB3aGljaFxuIyBtYWtlcyBbSFRNTCA1IGN1c3RvbSBlbGVtZW50c10oaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvd2ViY29tcG9uZW50cy9jdXN0b21lbGVtZW50cy8pXG4jIGFuIGlkZWFsIHRvb2wgZm9yIGltcGxlbWVudGluZyB2aWV3cyBpbiBBdG9tLlxuI1xuIyBZb3UgY2FuIGFjY2VzcyB0aGUgYFZpZXdSZWdpc3RyeWAgb2JqZWN0IHZpYSBgYXRvbS52aWV3c2AuXG4jXG4jICMjIEV4YW1wbGVzXG4jXG4jICMjIyBHZXR0aW5nIHRoZSB3b3Jrc3BhY2UgZWxlbWVudFxuI1xuIyBgYGBjb2ZmZWVcbiMgd29ya3NwYWNlRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSlcbiMgYGBgXG4jXG4jICMjIyBHZXR0aW5nIEFuIEVkaXRvciBFbGVtZW50XG4jXG4jIGBgYGNvZmZlZVxuIyB0ZXh0RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4jIHRleHRFZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpXG4jIGBgYFxuI1xuIyAjIyMgR2V0dGluZyBBIFBhbmUgRWxlbWVudFxuI1xuIyBgYGBjb2ZmZWVcbiMgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuIyBwYW5lRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhwYW5lKVxuIyBgYGBcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFZpZXdSZWdpc3RyeVxuICBhbmltYXRpb25GcmFtZVJlcXVlc3Q6IG51bGxcbiAgZG9jdW1lbnRSZWFkSW5Qcm9ncmVzczogZmFsc2VcbiAgcGVyZm9ybURvY3VtZW50UG9sbEFmdGVyVXBkYXRlOiBmYWxzZVxuICBkZWJvdW5jZWRQZXJmb3JtRG9jdW1lbnRQb2xsOiBudWxsXG4gIG1pbmltdW1Qb2xsSW50ZXJ2YWw6IDIwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQGF0b21FbnZpcm9ubWVudCkgLT5cbiAgICBAb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihAcmVxdWVzdERvY3VtZW50UG9sbClcbiAgICBAY2xlYXIoKVxuXG4gIGNsZWFyOiAtPlxuICAgIEB2aWV3cyA9IG5ldyBXZWFrTWFwXG4gICAgQHByb3ZpZGVycyA9IFtdXG4gICAgQGRlYm91bmNlZFBlcmZvcm1Eb2N1bWVudFBvbGwgPSBfLnRocm90dGxlKEBwZXJmb3JtRG9jdW1lbnRQb2xsLCBAbWluaW11bVBvbGxJbnRlcnZhbCkuYmluZCh0aGlzKVxuICAgIEBjbGVhckRvY3VtZW50UmVxdWVzdHMoKVxuXG4gICMgRXNzZW50aWFsOiBBZGQgYSBwcm92aWRlciB0aGF0IHdpbGwgYmUgdXNlZCB0byBjb25zdHJ1Y3Qgdmlld3MgaW4gdGhlXG4gICMgd29ya3NwYWNlJ3MgdmlldyBsYXllciBiYXNlZCBvbiBtb2RlbCBvYmplY3RzIGluIGl0cyBtb2RlbCBsYXllci5cbiAgI1xuICAjICMjIEV4YW1wbGVzXG4gICNcbiAgIyBUZXh0IGVkaXRvcnMgYXJlIGRpdmlkZWQgaW50byBhIG1vZGVsIGFuZCBhIHZpZXcgbGF5ZXIsIHNvIHdoZW4geW91IGludGVyYWN0XG4gICMgd2l0aCBtZXRob2RzIGxpa2UgYGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKWAgeW91J3JlIG9ubHkgZ29pbmdcbiAgIyB0byBnZXQgdGhlIG1vZGVsIG9iamVjdC4gV2UgZGlzcGxheSB0ZXh0IGVkaXRvcnMgb24gc2NyZWVuIGJ5IHRlYWNoaW5nIHRoZVxuICAjIHdvcmtzcGFjZSB3aGF0IHZpZXcgY29uc3RydWN0b3IgaXQgc2hvdWxkIHVzZSB0byByZXByZXNlbnQgdGhlbTpcbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIGF0b20udmlld3MuYWRkVmlld1Byb3ZpZGVyIFRleHRFZGl0b3IsICh0ZXh0RWRpdG9yKSAtPlxuICAjICAgdGV4dEVkaXRvckVsZW1lbnQgPSBuZXcgVGV4dEVkaXRvckVsZW1lbnRcbiAgIyAgIHRleHRFZGl0b3JFbGVtZW50LmluaXRpYWxpemUodGV4dEVkaXRvcilcbiAgIyAgIHRleHRFZGl0b3JFbGVtZW50XG4gICMgYGBgXG4gICNcbiAgIyAqIGBtb2RlbENvbnN0cnVjdG9yYCAob3B0aW9uYWwpIENvbnN0cnVjdG9yIHtGdW5jdGlvbn0gZm9yIHlvdXIgbW9kZWwuIElmXG4gICMgICBhIGNvbnN0cnVjdG9yIGlzIGdpdmVuLCB0aGUgYGNyZWF0ZVZpZXdgIGZ1bmN0aW9uIHdpbGwgb25seSBiZSB1c2VkXG4gICMgICBmb3IgbW9kZWwgb2JqZWN0cyBpbmhlcml0aW5nIGZyb20gdGhhdCBjb25zdHJ1Y3Rvci4gT3RoZXJ3aXNlLCBpdCB3aWxsXG4gICMgICB3aWxsIGJlIGNhbGxlZCBmb3IgYW55IG9iamVjdC5cbiAgIyAqIGBjcmVhdGVWaWV3YCBGYWN0b3J5IHtGdW5jdGlvbn0gdGhhdCBpcyBwYXNzZWQgYW4gaW5zdGFuY2Ugb2YgeW91ciBtb2RlbFxuICAjICAgYW5kIG11c3QgcmV0dXJuIGEgc3ViY2xhc3Mgb2YgYEhUTUxFbGVtZW50YCBvciBgdW5kZWZpbmVkYC4gSWYgaXQgcmV0dXJuc1xuICAjICAgYHVuZGVmaW5lZGAsIHRoZW4gdGhlIHJlZ2lzdHJ5IHdpbGwgY29udGludWUgdG8gc2VhcmNoIGZvciBvdGhlciB2aWV3XG4gICMgICBwcm92aWRlcnMuXG4gICNcbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHJlbW92ZSB0aGVcbiAgIyBhZGRlZCBwcm92aWRlci5cbiAgYWRkVmlld1Byb3ZpZGVyOiAobW9kZWxDb25zdHJ1Y3RvciwgY3JlYXRlVmlldykgLT5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoIGlzIDFcbiAgICAgIHN3aXRjaCB0eXBlb2YgbW9kZWxDb25zdHJ1Y3RvclxuICAgICAgICB3aGVuICdmdW5jdGlvbidcbiAgICAgICAgICBwcm92aWRlciA9IHtjcmVhdGVWaWV3OiBtb2RlbENvbnN0cnVjdG9yLCBtb2RlbENvbnN0cnVjdG9yOiBBbnlDb25zdHJ1Y3Rvcn1cbiAgICAgICAgd2hlbiAnb2JqZWN0J1xuICAgICAgICAgIEdyaW0uZGVwcmVjYXRlKFwiYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIgbm93IHRha2VzIDIgYXJndW1lbnRzOiBhIG1vZGVsIGNvbnN0cnVjdG9yIGFuZCBhIGNyZWF0ZVZpZXcgZnVuY3Rpb24uIFNlZSBkb2NzIGZvciBkZXRhaWxzLlwiKVxuICAgICAgICAgIHByb3ZpZGVyID0gbW9kZWxDb25zdHJ1Y3RvclxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFyZ3VtZW50cyB0byBhZGRWaWV3UHJvdmlkZXIgbXVzdCBiZSBmdW5jdGlvbnNcIilcbiAgICBlbHNlXG4gICAgICBwcm92aWRlciA9IHttb2RlbENvbnN0cnVjdG9yLCBjcmVhdGVWaWV3fVxuXG4gICAgQHByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKVxuICAgIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICBAcHJvdmlkZXJzID0gQHByb3ZpZGVycy5maWx0ZXIgKHApIC0+IHAgaXNudCBwcm92aWRlclxuXG4gIGdldFZpZXdQcm92aWRlckNvdW50OiAtPlxuICAgIEBwcm92aWRlcnMubGVuZ3RoXG5cbiAgIyBFc3NlbnRpYWw6IEdldCB0aGUgdmlldyBhc3NvY2lhdGVkIHdpdGggYW4gb2JqZWN0IGluIHRoZSB3b3Jrc3BhY2UuXG4gICNcbiAgIyBJZiB5b3UncmUganVzdCAqdXNpbmcqIHRoZSB3b3Jrc3BhY2UsIHlvdSBzaG91bGRuJ3QgbmVlZCB0byBhY2Nlc3MgdGhlIHZpZXdcbiAgIyBsYXllciwgYnV0IHZpZXcgbGF5ZXIgYWNjZXNzIG1heSBiZSBuZWNlc3NhcnkgaWYgeW91IHdhbnQgdG8gcGVyZm9ybSBET01cbiAgIyBtYW5pcHVsYXRpb24gdGhhdCBpc24ndCBzdXBwb3J0ZWQgdmlhIHRoZSBtb2RlbCBBUEkuXG4gICNcbiAgIyAjIyBFeGFtcGxlc1xuICAjXG4gICMgIyMjIEdldHRpbmcgQW4gRWRpdG9yIEVsZW1lbnRcbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgIyB0ZXh0RWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyh0ZXh0RWRpdG9yKVxuICAjIGBgYFxuICAjXG4gICMgIyMjIEdldHRpbmcgQSBQYW5lIEVsZW1lbnRcbiAgI1xuICAjIGBgYGNvZmZlZVxuICAjIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgIyBwYW5lRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhwYW5lKVxuICAjIGBgYFxuICAjXG4gICMgIyMjIEdldHRpbmcgVGhlIFdvcmtzcGFjZSBFbGVtZW50XG4gICNcbiAgIyBgYGBjb2ZmZWVcbiAgIyB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKVxuICAjIGBgYFxuICAjXG4gICMgKiBgb2JqZWN0YCBUaGUgb2JqZWN0IGZvciB3aGljaCB5b3Ugd2FudCB0byByZXRyaWV2ZSBhIHZpZXcuIFRoaXMgY2FuIGJlIGFcbiAgIyAgIHBhbmUgaXRlbSwgYSBwYW5lLCBvciB0aGUgd29ya3NwYWNlIGl0c2VsZi5cbiAgI1xuICAjICMjIFZpZXcgUmVzb2x1dGlvbiBBbGdvcml0aG1cbiAgI1xuICAjIFRoZSB2aWV3IGFzc29jaWF0ZWQgd2l0aCB0aGUgb2JqZWN0IGlzIHJlc29sdmVkIHVzaW5nIHRoZSBmb2xsb3dpbmdcbiAgIyBzZXF1ZW5jZVxuICAjXG4gICMgIDEuIElzIHRoZSBvYmplY3QgYW4gaW5zdGFuY2Ugb2YgYEhUTUxFbGVtZW50YD8gSWYgdHJ1ZSwgcmV0dXJuIHRoZSBvYmplY3QuXG4gICMgIDIuIERvZXMgdGhlIG9iamVjdCBoYXZlIGEgcHJvcGVydHkgbmFtZWQgYGVsZW1lbnRgIHdpdGggYSB2YWx1ZSB3aGljaCBpc1xuICAjICAgICBhbiBpbnN0YW5jZSBvZiBgSFRNTEVsZW1lbnRgPyBJZiB0cnVlLCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlLlxuICAjICAzLiBJcyB0aGUgb2JqZWN0IGEgalF1ZXJ5IG9iamVjdCwgaW5kaWNhdGVkIGJ5IHRoZSBwcmVzZW5jZSBvZiBhIGBqcXVlcnlgXG4gICMgICAgIHByb3BlcnR5PyBJZiB0cnVlLCByZXR1cm4gdGhlIHJvb3QgRE9NIGVsZW1lbnQgKGkuZS4gYG9iamVjdFswXWApLlxuICAjICA0LiBIYXMgYSB2aWV3IHByb3ZpZGVyIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhlIG9iamVjdD8gSWYgdHJ1ZSwgdXNlIHRoZVxuICAjICAgICBwcm92aWRlciB0byBjcmVhdGUgYSB2aWV3IGFzc29jaWF0ZWQgd2l0aCB0aGUgb2JqZWN0LCBhbmQgcmV0dXJuIHRoZVxuICAjICAgICB2aWV3LlxuICAjXG4gICMgSWYgbm8gYXNzb2NpYXRlZCB2aWV3IGlzIHJldHVybmVkIGJ5IHRoZSBzZXF1ZW5jZSBhbiBlcnJvciBpcyB0aHJvd24uXG4gICNcbiAgIyBSZXR1cm5zIGEgRE9NIGVsZW1lbnQuXG4gIGdldFZpZXc6IChvYmplY3QpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBvYmplY3Q/XG5cbiAgICBpZiB2aWV3ID0gQHZpZXdzLmdldChvYmplY3QpXG4gICAgICB2aWV3XG4gICAgZWxzZVxuICAgICAgdmlldyA9IEBjcmVhdGVWaWV3KG9iamVjdClcbiAgICAgIEB2aWV3cy5zZXQob2JqZWN0LCB2aWV3KVxuICAgICAgdmlld1xuXG4gIGNyZWF0ZVZpZXc6IChvYmplY3QpIC0+XG4gICAgaWYgb2JqZWN0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnRcbiAgICAgIHJldHVybiBvYmplY3RcblxuICAgIGlmIHR5cGVvZiBvYmplY3Q/LmdldEVsZW1lbnQgaXMgJ2Z1bmN0aW9uJ1xuICAgICAgZWxlbWVudCA9IG9iamVjdC5nZXRFbGVtZW50KClcbiAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudFxuICAgICAgICByZXR1cm4gZWxlbWVudFxuXG4gICAgaWYgb2JqZWN0Py5lbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnRcbiAgICAgIHJldHVybiBvYmplY3QuZWxlbWVudFxuXG4gICAgaWYgb2JqZWN0Py5qcXVlcnlcbiAgICAgIHJldHVybiBvYmplY3RbMF1cblxuICAgIGZvciBwcm92aWRlciBpbiBAcHJvdmlkZXJzXG4gICAgICBpZiBwcm92aWRlci5tb2RlbENvbnN0cnVjdG9yIGlzIEFueUNvbnN0cnVjdG9yXG4gICAgICAgIGlmIGVsZW1lbnQgPSBwcm92aWRlci5jcmVhdGVWaWV3KG9iamVjdCwgQGF0b21FbnZpcm9ubWVudClcbiAgICAgICAgICByZXR1cm4gZWxlbWVudFxuICAgICAgICBjb250aW51ZVxuXG4gICAgICBpZiBvYmplY3QgaW5zdGFuY2VvZiBwcm92aWRlci5tb2RlbENvbnN0cnVjdG9yXG4gICAgICAgIGlmIGVsZW1lbnQgPSBwcm92aWRlci5jcmVhdGVWaWV3PyhvYmplY3QsIEBhdG9tRW52aXJvbm1lbnQpXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRcblxuICAgICAgICBpZiB2aWV3Q29uc3RydWN0b3IgPSBwcm92aWRlci52aWV3Q29uc3RydWN0b3JcbiAgICAgICAgICBlbGVtZW50ID0gbmV3IHZpZXdDb25zdHJ1Y3RvclxuICAgICAgICAgIGVsZW1lbnQuaW5pdGlhbGl6ZT8ob2JqZWN0KSA/IGVsZW1lbnQuc2V0TW9kZWw/KG9iamVjdClcbiAgICAgICAgICByZXR1cm4gZWxlbWVudFxuXG4gICAgaWYgdmlld0NvbnN0cnVjdG9yID0gb2JqZWN0Py5nZXRWaWV3Q2xhc3M/KClcbiAgICAgIHZpZXcgPSBuZXcgdmlld0NvbnN0cnVjdG9yKG9iamVjdClcbiAgICAgIHJldHVybiB2aWV3WzBdXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBjcmVhdGUgYSB2aWV3IGZvciAje29iamVjdC5jb25zdHJ1Y3Rvci5uYW1lfSBpbnN0YW5jZS4gUGxlYXNlIHJlZ2lzdGVyIGEgdmlldyBwcm92aWRlci5cIilcblxuICB1cGRhdGVEb2N1bWVudDogKGZuKSAtPlxuICAgIEBkb2N1bWVudFdyaXRlcnMucHVzaChmbilcbiAgICBAcmVxdWVzdERvY3VtZW50VXBkYXRlKCkgdW5sZXNzIEBkb2N1bWVudFJlYWRJblByb2dyZXNzXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBkb2N1bWVudFdyaXRlcnMgPSBAZG9jdW1lbnRXcml0ZXJzLmZpbHRlciAod3JpdGVyKSAtPiB3cml0ZXIgaXNudCBmblxuXG4gIHJlYWREb2N1bWVudDogKGZuKSAtPlxuICAgIEBkb2N1bWVudFJlYWRlcnMucHVzaChmbilcbiAgICBAcmVxdWVzdERvY3VtZW50VXBkYXRlKClcbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGRvY3VtZW50UmVhZGVycyA9IEBkb2N1bWVudFJlYWRlcnMuZmlsdGVyIChyZWFkZXIpIC0+IHJlYWRlciBpc250IGZuXG5cbiAgcG9sbERvY3VtZW50OiAoZm4pIC0+XG4gICAgQHN0YXJ0UG9sbGluZ0RvY3VtZW50KCkgaWYgQGRvY3VtZW50UG9sbGVycy5sZW5ndGggaXMgMFxuICAgIEBkb2N1bWVudFBvbGxlcnMucHVzaChmbilcbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGRvY3VtZW50UG9sbGVycyA9IEBkb2N1bWVudFBvbGxlcnMuZmlsdGVyIChwb2xsZXIpIC0+IHBvbGxlciBpc250IGZuXG4gICAgICBAc3RvcFBvbGxpbmdEb2N1bWVudCgpIGlmIEBkb2N1bWVudFBvbGxlcnMubGVuZ3RoIGlzIDBcblxuICBwb2xsQWZ0ZXJOZXh0VXBkYXRlOiAtPlxuICAgIEBwZXJmb3JtRG9jdW1lbnRQb2xsQWZ0ZXJVcGRhdGUgPSB0cnVlXG5cbiAgZ2V0TmV4dFVwZGF0ZVByb21pc2U6IC0+XG4gICAgQG5leHRVcGRhdGVQcm9taXNlID89IG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgQHJlc29sdmVOZXh0VXBkYXRlUHJvbWlzZSA9IHJlc29sdmVcblxuICBjbGVhckRvY3VtZW50UmVxdWVzdHM6IC0+XG4gICAgQGRvY3VtZW50UmVhZGVycyA9IFtdXG4gICAgQGRvY3VtZW50V3JpdGVycyA9IFtdXG4gICAgQGRvY3VtZW50UG9sbGVycyA9IFtdXG4gICAgQG5leHRVcGRhdGVQcm9taXNlID0gbnVsbFxuICAgIEByZXNvbHZlTmV4dFVwZGF0ZVByb21pc2UgPSBudWxsXG4gICAgaWYgQGFuaW1hdGlvbkZyYW1lUmVxdWVzdD9cbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKEBhbmltYXRpb25GcmFtZVJlcXVlc3QpXG4gICAgICBAYW5pbWF0aW9uRnJhbWVSZXF1ZXN0ID0gbnVsbFxuICAgIEBzdG9wUG9sbGluZ0RvY3VtZW50KClcblxuICByZXF1ZXN0RG9jdW1lbnRVcGRhdGU6IC0+XG4gICAgQGFuaW1hdGlvbkZyYW1lUmVxdWVzdCA/PSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoQHBlcmZvcm1Eb2N1bWVudFVwZGF0ZSlcblxuICBwZXJmb3JtRG9jdW1lbnRVcGRhdGU6ID0+XG4gICAgcmVzb2x2ZU5leHRVcGRhdGVQcm9taXNlID0gQHJlc29sdmVOZXh0VXBkYXRlUHJvbWlzZVxuICAgIEBhbmltYXRpb25GcmFtZVJlcXVlc3QgPSBudWxsXG4gICAgQG5leHRVcGRhdGVQcm9taXNlID0gbnVsbFxuICAgIEByZXNvbHZlTmV4dFVwZGF0ZVByb21pc2UgPSBudWxsXG5cbiAgICB3cml0ZXIoKSB3aGlsZSB3cml0ZXIgPSBAZG9jdW1lbnRXcml0ZXJzLnNoaWZ0KClcblxuICAgIEBkb2N1bWVudFJlYWRJblByb2dyZXNzID0gdHJ1ZVxuICAgIHJlYWRlcigpIHdoaWxlIHJlYWRlciA9IEBkb2N1bWVudFJlYWRlcnMuc2hpZnQoKVxuICAgIEBwZXJmb3JtRG9jdW1lbnRQb2xsKCkgaWYgQHBlcmZvcm1Eb2N1bWVudFBvbGxBZnRlclVwZGF0ZVxuICAgIEBwZXJmb3JtRG9jdW1lbnRQb2xsQWZ0ZXJVcGRhdGUgPSBmYWxzZVxuICAgIEBkb2N1bWVudFJlYWRJblByb2dyZXNzID0gZmFsc2VcblxuICAgICMgcHJvY2VzcyB1cGRhdGVzIHJlcXVlc3RlZCBhcyBhIHJlc3VsdCBvZiByZWFkc1xuICAgIHdyaXRlcigpIHdoaWxlIHdyaXRlciA9IEBkb2N1bWVudFdyaXRlcnMuc2hpZnQoKVxuXG4gICAgcmVzb2x2ZU5leHRVcGRhdGVQcm9taXNlPygpXG5cbiAgc3RhcnRQb2xsaW5nRG9jdW1lbnQ6IC0+XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIEByZXF1ZXN0RG9jdW1lbnRQb2xsKVxuICAgIEBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7c3VidHJlZTogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBhdHRyaWJ1dGVzOiB0cnVlfSlcblxuICBzdG9wUG9sbGluZ0RvY3VtZW50OiAtPlxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBAcmVxdWVzdERvY3VtZW50UG9sbClcbiAgICBAb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG5cbiAgcmVxdWVzdERvY3VtZW50UG9sbDogPT5cbiAgICBpZiBAYW5pbWF0aW9uRnJhbWVSZXF1ZXN0P1xuICAgICAgQHBlcmZvcm1Eb2N1bWVudFBvbGxBZnRlclVwZGF0ZSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBAZGVib3VuY2VkUGVyZm9ybURvY3VtZW50UG9sbCgpXG5cbiAgcGVyZm9ybURvY3VtZW50UG9sbDogLT5cbiAgICBwb2xsZXIoKSBmb3IgcG9sbGVyIGluIEBkb2N1bWVudFBvbGxlcnNcbiAgICByZXR1cm5cbiJdfQ==
