(function() {
  var Decoration, DecorationManager, Emitter, LayerDecoration, Model,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Emitter = require('event-kit').Emitter;

  Model = require('./model');

  Decoration = require('./decoration');

  LayerDecoration = require('./layer-decoration');

  module.exports = DecorationManager = (function(superClass) {
    extend(DecorationManager, superClass);

    DecorationManager.prototype.didUpdateDecorationsEventScheduled = false;

    DecorationManager.prototype.updatedSynchronously = false;

    function DecorationManager(displayLayer, defaultMarkerLayer) {
      this.displayLayer = displayLayer;
      this.defaultMarkerLayer = defaultMarkerLayer;
      DecorationManager.__super__.constructor.apply(this, arguments);
      this.emitter = new Emitter;
      this.decorationsById = {};
      this.decorationsByMarkerId = {};
      this.overlayDecorationsById = {};
      this.layerDecorationsByMarkerLayerId = {};
      this.decorationCountsByLayerId = {};
      this.layerUpdateDisposablesByLayerId = {};
    }

    DecorationManager.prototype.observeDecorations = function(callback) {
      var decoration, i, len, ref;
      ref = this.getDecorations();
      for (i = 0, len = ref.length; i < len; i++) {
        decoration = ref[i];
        callback(decoration);
      }
      return this.onDidAddDecoration(callback);
    };

    DecorationManager.prototype.onDidAddDecoration = function(callback) {
      return this.emitter.on('did-add-decoration', callback);
    };

    DecorationManager.prototype.onDidRemoveDecoration = function(callback) {
      return this.emitter.on('did-remove-decoration', callback);
    };

    DecorationManager.prototype.onDidUpdateDecorations = function(callback) {
      return this.emitter.on('did-update-decorations', callback);
    };

    DecorationManager.prototype.setUpdatedSynchronously = function(updatedSynchronously) {
      this.updatedSynchronously = updatedSynchronously;
    };

    DecorationManager.prototype.decorationForId = function(id) {
      return this.decorationsById[id];
    };

    DecorationManager.prototype.getDecorations = function(propertyFilter) {
      var allDecorations, decorations, markerId, ref;
      allDecorations = [];
      ref = this.decorationsByMarkerId;
      for (markerId in ref) {
        decorations = ref[markerId];
        if (decorations != null) {
          allDecorations.push.apply(allDecorations, decorations);
        }
      }
      if (propertyFilter != null) {
        allDecorations = allDecorations.filter(function(decoration) {
          var key, value;
          for (key in propertyFilter) {
            value = propertyFilter[key];
            if (decoration.properties[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }
      return allDecorations;
    };

    DecorationManager.prototype.getLineDecorations = function(propertyFilter) {
      return this.getDecorations(propertyFilter).filter(function(decoration) {
        return decoration.isType('line');
      });
    };

    DecorationManager.prototype.getLineNumberDecorations = function(propertyFilter) {
      return this.getDecorations(propertyFilter).filter(function(decoration) {
        return decoration.isType('line-number');
      });
    };

    DecorationManager.prototype.getHighlightDecorations = function(propertyFilter) {
      return this.getDecorations(propertyFilter).filter(function(decoration) {
        return decoration.isType('highlight');
      });
    };

    DecorationManager.prototype.getOverlayDecorations = function(propertyFilter) {
      var decoration, id, ref, result;
      result = [];
      ref = this.overlayDecorationsById;
      for (id in ref) {
        decoration = ref[id];
        result.push(decoration);
      }
      if (propertyFilter != null) {
        return result.filter(function(decoration) {
          var key, value;
          for (key in propertyFilter) {
            value = propertyFilter[key];
            if (decoration.properties[key] !== value) {
              return false;
            }
          }
          return true;
        });
      } else {
        return result;
      }
    };

    DecorationManager.prototype.decorationsForScreenRowRange = function(startScreenRow, endScreenRow) {
      var decorations, decorationsByMarkerId, i, len, marker, ref;
      decorationsByMarkerId = {};
      ref = this.defaultMarkerLayer.findMarkers({
        intersectsScreenRowRange: [startScreenRow, endScreenRow]
      });
      for (i = 0, len = ref.length; i < len; i++) {
        marker = ref[i];
        if (decorations = this.decorationsByMarkerId[marker.id]) {
          decorationsByMarkerId[marker.id] = decorations;
        }
      }
      return decorationsByMarkerId;
    };

    DecorationManager.prototype.decorationsStateForScreenRowRange = function(startScreenRow, endScreenRow) {
      var bufferRange, decoration, decorations, decorationsState, i, j, k, layer, layerDecoration, layerDecorations, layerId, len, len1, len2, marker, rangeIsReversed, ref, ref1, screenRange;
      decorationsState = {};
      for (layerId in this.decorationCountsByLayerId) {
        layer = this.displayLayer.getMarkerLayer(layerId);
        ref = layer.findMarkers({
          intersectsScreenRowRange: [startScreenRow, endScreenRow]
        });
        for (i = 0, len = ref.length; i < len; i++) {
          marker = ref[i];
          if (!(marker.isValid())) {
            continue;
          }
          screenRange = marker.getScreenRange();
          bufferRange = marker.getBufferRange();
          rangeIsReversed = marker.isReversed();
          if (decorations = this.decorationsByMarkerId[marker.id]) {
            for (j = 0, len1 = decorations.length; j < len1; j++) {
              decoration = decorations[j];
              decorationsState[decoration.id] = {
                properties: decoration.properties,
                screenRange: screenRange,
                bufferRange: bufferRange,
                rangeIsReversed: rangeIsReversed
              };
            }
          }
          if (layerDecorations = this.layerDecorationsByMarkerLayerId[layerId]) {
            for (k = 0, len2 = layerDecorations.length; k < len2; k++) {
              layerDecoration = layerDecorations[k];
              decorationsState[layerDecoration.id + "-" + marker.id] = {
                properties: (ref1 = layerDecoration.overridePropertiesByMarkerId[marker.id]) != null ? ref1 : layerDecoration.properties,
                screenRange: screenRange,
                bufferRange: bufferRange,
                rangeIsReversed: rangeIsReversed
              };
            }
          }
        }
      }
      return decorationsState;
    };

    DecorationManager.prototype.decorateMarker = function(marker, decorationParams) {
      var base, decoration, name;
      if (marker.isDestroyed()) {
        throw new Error("Cannot decorate a destroyed marker");
      }
      marker = this.displayLayer.getMarkerLayer(marker.layer.id).getMarker(marker.id);
      decoration = new Decoration(marker, this, decorationParams);
      if ((base = this.decorationsByMarkerId)[name = marker.id] == null) {
        base[name] = [];
      }
      this.decorationsByMarkerId[marker.id].push(decoration);
      if (decoration.isType('overlay')) {
        this.overlayDecorationsById[decoration.id] = decoration;
      }
      this.decorationsById[decoration.id] = decoration;
      this.observeDecoratedLayer(marker.layer);
      this.scheduleUpdateDecorationsEvent();
      this.emitter.emit('did-add-decoration', decoration);
      return decoration;
    };

    DecorationManager.prototype.decorateMarkerLayer = function(markerLayer, decorationParams) {
      var base, decoration, name;
      decoration = new LayerDecoration(markerLayer, this, decorationParams);
      if ((base = this.layerDecorationsByMarkerLayerId)[name = markerLayer.id] == null) {
        base[name] = [];
      }
      this.layerDecorationsByMarkerLayerId[markerLayer.id].push(decoration);
      this.observeDecoratedLayer(markerLayer);
      this.scheduleUpdateDecorationsEvent();
      return decoration;
    };

    DecorationManager.prototype.decorationsForMarkerId = function(markerId) {
      return this.decorationsByMarkerId[markerId];
    };

    DecorationManager.prototype.scheduleUpdateDecorationsEvent = function() {
      if (this.updatedSynchronously) {
        this.emitter.emit('did-update-decorations');
        return;
      }
      if (!this.didUpdateDecorationsEventScheduled) {
        this.didUpdateDecorationsEventScheduled = true;
        return process.nextTick((function(_this) {
          return function() {
            _this.didUpdateDecorationsEventScheduled = false;
            return _this.emitter.emit('did-update-decorations');
          };
        })(this));
      }
    };

    DecorationManager.prototype.decorationDidChangeType = function(decoration) {
      if (decoration.isType('overlay')) {
        return this.overlayDecorationsById[decoration.id] = decoration;
      } else {
        return delete this.overlayDecorationsById[decoration.id];
      }
    };

    DecorationManager.prototype.didDestroyMarkerDecoration = function(decoration) {
      var decorations, index, marker;
      marker = decoration.marker;
      if (!(decorations = this.decorationsByMarkerId[marker.id])) {
        return;
      }
      index = decorations.indexOf(decoration);
      if (index > -1) {
        decorations.splice(index, 1);
        delete this.decorationsById[decoration.id];
        this.emitter.emit('did-remove-decoration', decoration);
        if (decorations.length === 0) {
          delete this.decorationsByMarkerId[marker.id];
        }
        delete this.overlayDecorationsById[decoration.id];
        this.unobserveDecoratedLayer(marker.layer);
      }
      return this.scheduleUpdateDecorationsEvent();
    };

    DecorationManager.prototype.didDestroyLayerDecoration = function(decoration) {
      var decorations, index, markerLayer;
      markerLayer = decoration.markerLayer;
      if (!(decorations = this.layerDecorationsByMarkerLayerId[markerLayer.id])) {
        return;
      }
      index = decorations.indexOf(decoration);
      if (index > -1) {
        decorations.splice(index, 1);
        if (decorations.length === 0) {
          delete this.layerDecorationsByMarkerLayerId[markerLayer.id];
        }
        this.unobserveDecoratedLayer(markerLayer);
      }
      return this.scheduleUpdateDecorationsEvent();
    };

    DecorationManager.prototype.observeDecoratedLayer = function(layer) {
      var base, name;
      if ((base = this.decorationCountsByLayerId)[name = layer.id] == null) {
        base[name] = 0;
      }
      if (++this.decorationCountsByLayerId[layer.id] === 1) {
        return this.layerUpdateDisposablesByLayerId[layer.id] = layer.onDidUpdate(this.scheduleUpdateDecorationsEvent.bind(this));
      }
    };

    DecorationManager.prototype.unobserveDecoratedLayer = function(layer) {
      if (--this.decorationCountsByLayerId[layer.id] === 0) {
        this.layerUpdateDisposablesByLayerId[layer.id].dispose();
        delete this.decorationCountsByLayerId[layer.id];
        return delete this.layerUpdateDisposablesByLayerId[layer.id];
      }
    };

    return DecorationManager;

  })(Model);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL3NyYy9kZWNvcmF0aW9uLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4REFBQTtJQUFBOzs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxXQUFSOztFQUNaLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixVQUFBLEdBQWEsT0FBQSxDQUFRLGNBQVI7O0VBQ2IsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ007OztnQ0FDSixrQ0FBQSxHQUFvQzs7Z0NBQ3BDLG9CQUFBLEdBQXNCOztJQUVULDJCQUFDLFlBQUQsRUFBZ0Isa0JBQWhCO01BQUMsSUFBQyxDQUFBLGVBQUQ7TUFBZSxJQUFDLENBQUEscUJBQUQ7TUFDM0Isb0RBQUEsU0FBQTtNQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxlQUFELEdBQW1CO01BQ25CLElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtNQUN6QixJQUFDLENBQUEsc0JBQUQsR0FBMEI7TUFDMUIsSUFBQyxDQUFBLCtCQUFELEdBQW1DO01BQ25DLElBQUMsQ0FBQSx5QkFBRCxHQUE2QjtNQUM3QixJQUFDLENBQUEsK0JBQUQsR0FBbUM7SUFUeEI7O2dDQVdiLGtCQUFBLEdBQW9CLFNBQUMsUUFBRDtBQUNsQixVQUFBO0FBQUE7QUFBQSxXQUFBLHFDQUFBOztRQUFBLFFBQUEsQ0FBUyxVQUFUO0FBQUE7YUFDQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsUUFBcEI7SUFGa0I7O2dDQUlwQixrQkFBQSxHQUFvQixTQUFDLFFBQUQ7YUFDbEIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksb0JBQVosRUFBa0MsUUFBbEM7SUFEa0I7O2dDQUdwQixxQkFB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SyxDQUFDLEVBQU47ZUFDbEMsT0FBTyxJQUFDLENBQUEsK0JBQWdDLENBQUEsS0FBSyxDQUFDLEVBQU4sRUFIMUM7O0lBRHVCOzs7O0tBMUtLO0FBTmhDIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXJ9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuTW9kZWwgPSByZXF1aXJlICcuL21vZGVsJ1xuRGVjb3JhdGlvbiA9IHJlcXVpcmUgJy4vZGVjb3JhdGlvbidcbkxheWVyRGVjb3JhdGlvbiA9IHJlcXVpcmUgJy4vbGF5ZXItZGVjb3JhdGlvbidcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRGVjb3JhdGlvbk1hbmFnZXIgZXh0ZW5kcyBNb2RlbFxuICBkaWRVcGRhdGVEZWNvcmF0aW9uc0V2ZW50U2NoZWR1bGVkOiBmYWxzZVxuICB1cGRhdGVkU3luY2hyb25vdXNseTogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKEBkaXNwbGF5TGF5ZXIsIEBkZWZhdWx0TWFya2VyTGF5ZXIpIC0+XG4gICAgc3VwZXJcblxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAZGVjb3JhdGlvbnNCeUlkID0ge31cbiAgICBAZGVjb3JhdGlvbnNCeU1hcmtlcklkID0ge31cbiAgICBAb3ZlcmxheURlY29yYXRpb25zQnlJZCA9IHt9XG4gICAgQGxheWVyRGVjb3JhdGlvbnNCeU1hcmtlckxheWVySWQgPSB7fVxuICAgIEBkZWNvcmF0aW9uQ291bnRzQnlMYXllcklkID0ge31cbiAgICBAbGF5ZXJVcGRhdGVEaXNwb3NhYmxlc0J5TGF5ZXJJZCA9IHt9XG5cbiAgb2JzZXJ2ZURlY29yYXRpb25zOiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2soZGVjb3JhdGlvbikgZm9yIGRlY29yYXRpb24gaW4gQGdldERlY29yYXRpb25zKClcbiAgICBAb25EaWRBZGREZWNvcmF0aW9uKGNhbGxiYWNrKVxuXG4gIG9uRGlkQWRkRGVjb3JhdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtYWRkLWRlY29yYXRpb24nLCBjYWxsYmFja1xuXG4gIG9uRGlkUmVtb3ZlRGVjb3JhdGlvbjogKGNhbGxiYWNrKSAtPlxuICAgIEBlbWl0dGVyLm9uICdkaWQtcmVtb3ZlLWRlY29yYXRpb24nLCBjYWxsYmFja1xuXG4gIG9uRGlkVXBkYXRlRGVjb3JhdGlvbnM6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLXVwZGF0ZS1kZWNvcmF0aW9ucycsIGNhbGxiYWNrXG5cbiAgc2V0VXBkYXRlZFN5bmNocm9ub3VzbHk6IChAdXBkYXRlZFN5bmNocm9ub3VzbHkpIC0+XG5cbiAgZGVjb3JhdGlvbkZvcklkOiAoaWQpIC0+XG4gICAgQGRlY29yYXRpb25zQnlJZFtpZF1cblxuICBnZXREZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIGFsbERlY29yYXRpb25zID0gW11cbiAgICBmb3IgbWFya2VySWQsIGRlY29yYXRpb25zIG9mIEBkZWNvcmF0aW9uc0J5TWFya2VySWRcbiAgICAgIGFsbERlY29yYXRpb25zLnB1c2goZGVjb3JhdGlvbnMuLi4pIGlmIGRlY29yYXRpb25zP1xuICAgIGlmIHByb3BlcnR5RmlsdGVyP1xuICAgICAgYWxsRGVjb3JhdGlvbnMgPSBhbGxEZWNvcmF0aW9ucy5maWx0ZXIgKGRlY29yYXRpb24pIC0+XG4gICAgICAgIGZvciBrZXksIHZhbHVlIG9mIHByb3BlcnR5RmlsdGVyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBkZWNvcmF0aW9uLnByb3BlcnRpZXNba2V5XSBpcyB2YWx1ZVxuICAgICAgICB0cnVlXG4gICAgYWxsRGVjb3JhdGlvbnNcblxuICBnZXRMaW5lRGVjb3JhdGlvbnM6IChwcm9wZXJ0eUZpbHRlcikgLT5cbiAgICBAZ2V0RGVjb3JhdGlvbnMocHJvcGVydHlGaWx0ZXIpLmZpbHRlciAoZGVjb3JhdGlvbikgLT4gZGVjb3JhdGlvbi5pc1R5cGUoJ2xpbmUnKVxuXG4gIGdldExpbmVOdW1iZXJEZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIEBnZXREZWNvcmF0aW9ucyhwcm9wZXJ0eUZpbHRlcikuZmlsdGVyIChkZWNvcmF0aW9uKSAtPiBkZWNvcmF0aW9uLmlzVHlwZSgnbGluZS1udW1iZXInKVxuXG4gIGdldEhpZ2hsaWdodERlY29yYXRpb25zOiAocHJvcGVydHlGaWx0ZXIpIC0+XG4gICAgQGdldERlY29yYXRpb25zKHByb3BlcnR5RmlsdGVyKS5maWx0ZXIgKGRlY29yYXRpb24pIC0+IGRlY29yYXRpb24uaXNUeXBlKCdoaWdobGlnaHQnKVxuXG4gIGdldE92ZXJsYXlEZWNvcmF0aW9uczogKHByb3BlcnR5RmlsdGVyKSAtPlxuICAgIHJlc3VsdCA9IFtdXG4gICAgZm9yIGlkLCBkZWNvcmF0aW9uIG9mIEBvdmVybGF5RGVjb3JhdGlvbnNCeUlkXG4gICAgICByZXN1bHQucHVzaChkZWNvcmF0aW9uKVxuICAgIGlmIHByb3BlcnR5RmlsdGVyP1xuICAgICAgcmVzdWx0LmZpbHRlciAoZGVjb3JhdGlvbikgLT5cbiAgICAgICAgZm9yIGtleSwgdmFsdWUgb2YgcHJvcGVydHlGaWx0ZXJcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGRlY29yYXRpb24ucHJvcGVydGllc1trZXldIGlzIHZhbHVlXG4gICAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICByZXN1bHRcblxuICBkZWNvcmF0aW9uc0ZvclNjcmVlblJvd1JhbmdlOiAoc3RhcnRTY3JlZW5Sb3csIGVuZFNjcmVlblJvdykgLT5cbiAgICBkZWNvcmF0aW9uc0J5TWFya2VySWQgPSB7fVxuICAgIGZvciBtYXJrZXIgaW4gQGRlZmF1bHRNYXJrZXJMYXllci5maW5kTWFya2VycyhpbnRlcnNlY3RzU2NyZWVuUm93UmFuZ2U6IFtzdGFydFNjcmVlblJvdywgZW5kU2NyZWVuUm93XSlcbiAgICAgIGlmIGRlY29yYXRpb25zID0gQGRlY29yYXRpb25zQnlNYXJrZXJJZFttYXJrZXIuaWRdXG4gICAgICAgIGRlY29yYXRpb25zQnlNYXJrZXJJZFttYXJrZXIuaWRdID0gZGVjb3JhdGlvbnNcbiAgICBkZWNvcmF0aW9uc0J5TWFya2VySWRcblxuICBkZWNvcmF0aW9uc1N0YXRlRm9yU2NyZWVuUm93UmFuZ2U6IChzdGFydFNjcmVlblJvdywgZW5kU2NyZWVuUm93KSAtPlxuICAgIGRlY29yYXRpb25zU3RhdGUgPSB7fVxuXG4gICAgZm9yIGxheWVySWQgb2YgQGRlY29yYXRpb25Db3VudHNCeUxheWVySWRcbiAgICAgIGxheWVyID0gQGRpc3BsYXlMYXllci5nZXRNYXJrZXJMYXllcihsYXllcklkKVxuXG4gICAgICBmb3IgbWFya2VyIGluIGxheWVyLmZpbmRNYXJrZXJzKGludGVyc2VjdHNTY3JlZW5Sb3dSYW5nZTogW3N0YXJ0U2NyZWVuUm93LCBlbmRTY3JlZW5Sb3ddKSB3aGVuIG1hcmtlci5pc1ZhbGlkKClcbiAgICAgICAgc2NyZWVuUmFuZ2UgPSBtYXJrZXIuZ2V0U2NyZWVuUmFuZ2UoKVxuICAgICAgICBidWZmZXJSYW5nZSA9IG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIHJhbmdlSXNSZXZlcnNlZCA9IG1hcmtlci5pc1JldmVyc2VkKClcblxuICAgICAgICBpZiBkZWNvcmF0aW9ucyA9IEBkZWNvcmF0aW9uc0J5TWFya2VySWRbbWFya2VyLmlkXVxuICAgICAgICAgIGZvciBkZWNvcmF0aW9uIGluIGRlY29yYXRpb25zXG4gICAgICAgICAgICBkZWNvcmF0aW9uc1N0YXRlW2RlY29yYXRpb24uaWRdID0ge1xuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBkZWNvcmF0aW9uLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgc2NyZWVuUmFuZ2UsIGJ1ZmZlclJhbmdlLCByYW5nZUlzUmV2ZXJzZWRcbiAgICAgICAgICAgIH1cblxuICAgICAgICBpZiBsYXllckRlY29yYXRpb25zID0gQGxheWVyRGVjb3JhdGlvbnNCeU1hcmtlckxheWVySWRbbGF5ZXJJZF1cbiAgICAgICAgICBmb3IgbGF5ZXJEZWNvcmF0aW9uIGluIGxheWVyRGVjb3JhdGlvbnNcbiAgICAgICAgICAgIGRlY29yYXRpb25zU3RhdGVbXCIje2xheWVyRGVjb3JhdGlvbi5pZH0tI3ttYXJrZXIuaWR9XCJdID0ge1xuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBsYXllckRlY29yYXRpb24ub3ZlcnJpZGVQcm9wZXJ0aWVzQnlNYXJrZXJJZFttYXJrZXIuaWRdID8gbGF5ZXJEZWNvcmF0aW9uLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgc2NyZWVuUmFuZ2UsIGJ1ZmZlclJhbmdlLCByYW5nZUlzUmV2ZXJzZWRcbiAgICAgICAgICAgIH1cblxuICAgIGRlY29yYXRpb25zU3RhdGVcblxuICBkZWNvcmF0ZU1hcmtlcjogKG1hcmtlciwgZGVjb3JhdGlvblBhcmFtcykgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGVjb3JhdGUgYSBkZXN0cm95ZWQgbWFya2VyXCIpIGlmIG1hcmtlci5pc0Rlc3Ryb3llZCgpXG4gICAgbWFya2VyID0gQGRpc3BsYXlMYXllci5nZXRNYXJrZXJMYXllcihtYXJrZXIubGF5ZXIuaWQpLmdldE1hcmtlcihtYXJrZXIuaWQpXG4gICAgZGVjb3JhdGlvbiA9IG5ldyBEZWNvcmF0aW9uKG1hcmtlciwgdGhpcywgZGVjb3JhdGlvblBhcmFtcylcbiAgICBAZGVjb3JhdGlvbnNCeU1hcmtlcklkW21hcmtlci5pZF0gPz0gW11cbiAgICBAZGVjb3JhdGlvbnNCeU1hcmtlcklkW21hcmtlci5pZF0ucHVzaChkZWNvcmF0aW9uKVxuICAgIEBvdmVybGF5RGVjb3JhdGlvbnNCeUlkW2RlY29yYXRpb24uaWRdID0gZGVjb3JhdGlvbiBpZiBkZWNvcmF0aW9uLmlzVHlwZSgnb3ZlcmxheScpXG4gICAgQGRlY29yYXRpb25zQnlJZFtkZWNvcmF0aW9uLmlkXSA9IGRlY29yYXRpb25cbiAgICBAb2JzZXJ2ZURlY29yYXRlZExheWVyKG1hcmtlci5sYXllcilcbiAgICBAc2NoZWR1bGVVcGRhdGVEZWNvcmF0aW9uc0V2ZW50KClcbiAgICBAZW1pdHRlci5lbWl0ICdkaWQtYWRkLWRlY29yYXRpb24nLCBkZWNvcmF0aW9uXG4gICAgZGVjb3JhdGlvblxuXG4gIGRlY29yYXRlTWFya2VyTGF5ZXI6IChtYXJrZXJMYXllciwgZGVjb3JhdGlvblBhcmFtcykgLT5cbiAgICBkZWNvcmF0aW9uID0gbmV3IExheWVyRGVjb3JhdGlvbihtYXJrZXJMYXllciwgdGhpcywgZGVjb3JhdGlvblBhcmFtcylcbiAgICBAbGF5ZXJEZWNvcmF0aW9uc0J5TWFya2VyTGF5ZXJJZFttYXJrZXJMYXllci5pZF0gPz0gW11cbiAgICBAbGF5ZXJEZWNvcmF0aW9uc0J5TWFya2VyTGF5ZXJJZFttYXJrZXJMYXllci5pZF0ucHVzaChkZWNvcmF0aW9uKVxuICAgIEBvYnNlcnZlRGVjb3JhdGVkTGF5ZXIobWFya2VyTGF5ZXIpXG4gICAgQHNjaGVkdWxlVXBkYXRlRGVjb3JhdGlvbnNFdmVudCgpXG4gICAgZGVjb3JhdGlvblxuXG4gIGRlY29yYXRpb25zRm9yTWFya2VySWQ6IChtYXJrZXJJZCkgLT5cbiAgICBAZGVjb3JhdGlvbnNCeU1hcmtlcklkW21hcmtlcklkXVxuXG4gIHNjaGVkdWxlVXBkYXRlRGVjb3JhdGlvbnNFdmVudDogLT5cbiAgICBpZiBAdXBkYXRlZFN5bmNocm9ub3VzbHlcbiAgICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC11cGRhdGUtZGVjb3JhdGlvbnMnXG4gICAgICByZXR1cm5cblxuICAgIHVubGVzcyBAZGlkVXBkYXRlRGVjb3JhdGlvbnNFdmVudFNjaGVkdWxlZFxuICAgICAgQGRpZFVwZGF0ZURlY29yYXRpb25zRXZlbnRTY2hlZHVsZWQgPSB0cnVlXG4gICAgICBwcm9jZXNzLm5leHRUaWNrID0+XG4gICAgICAgIEBkaWRVcGRhdGVEZWNvcmF0aW9uc0V2ZW50U2NoZWR1bGVkID0gZmFsc2VcbiAgICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXVwZGF0ZS1kZWNvcmF0aW9ucydcblxuICBkZWNvcmF0aW9uRGlkQ2hhbmdlVHlwZTogKGRlY29yYXRpb24pIC0+XG4gICAgaWYgZGVjb3JhdGlvbi5pc1R5cGUoJ292ZXJsYXknKVxuICAgICAgQG92ZXJsYXlEZWNvcmF0aW9uc0J5SWRbZGVjb3JhdGlvbi5pZF0gPSBkZWNvcmF0aW9uXG4gICAgZWxzZVxuICAgICAgZGVsZXRlIEBvdmVybGF5RGVjb3JhdGlvbnNCeUlkW2RlY29yYXRpb24uaWRdXG5cbiAgZGlkRGVzdHJveU1hcmtlckRlY29yYXRpb246IChkZWNvcmF0aW9uKSAtPlxuICAgIHttYXJrZXJ9ID0gZGVjb3JhdGlvblxuICAgIHJldHVybiB1bmxlc3MgZGVjb3JhdGlvbnMgPSBAZGVjb3JhdGlvbnNCeU1hcmtlcklkW21hcmtlci5pZF1cbiAgICBpbmRleCA9IGRlY29yYXRpb25zLmluZGV4T2YoZGVjb3JhdGlvbilcblxuICAgIGlmIGluZGV4ID4gLTFcbiAgICAgIGRlY29yYXRpb25zLnNwbGljZShpbmRleCwgMSlcbiAgICAgIGRlbGV0ZSBAZGVjb3JhdGlvbnNCeUlkW2RlY29yYXRpb24uaWRdXG4gICAgICBAZW1pdHRlci5lbWl0ICdkaWQtcmVtb3ZlLWRlY29yYXRpb24nLCBkZWNvcmF0aW9uXG4gICAgICBkZWxldGUgQGRlY29yYXRpb25zQnlNYXJrZXJJZFttYXJrZXIuaWRdIGlmIGRlY29yYXRpb25zLmxlbmd0aCBpcyAwXG4gICAgICBkZWxldGUgQG92ZXJsYXlEZWNvcmF0aW9uc0J5SWRbZGVjb3JhdGlvbi5pZF1cbiAgICAgIEB1bm9ic2VydmVEZWNvcmF0ZWRMYXllcihtYXJrZXIubGF5ZXIpXG4gICAgQHNjaGVkdWxlVXBkYXRlRGVjb3JhdGlvbnNFdmVudCgpXG5cbiAgZGlkRGVzdHJveUxheWVyRGVjb3JhdGlvbjogKGRlY29yYXRpb24pIC0+XG4gICAge21hcmtlckxheWVyfSA9IGRlY29yYXRpb25cbiAgICByZXR1cm4gdW5sZXNzIGRlY29yYXRpb25zID0gQGxheWVyRGVjb3JhdGlvbnNCeU1hcmtlckxheWVySWRbbWFya2VyTGF5ZXIuaWRdXG4gICAgaW5kZXggPSBkZWNvcmF0aW9ucy5pbmRleE9mKGRlY29yYXRpb24pXG5cbiAgICBpZiBpbmRleCA+IC0xXG4gICAgICBkZWNvcmF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICBkZWxldGUgQGxheWVyRGVjb3JhdGlvbnNCeU1hcmtlckxheWVySWRbbWFya2VyTGF5ZXIuaWRdIGlmIGRlY29yYXRpb25zLmxlbmd0aCBpcyAwXG4gICAgICBAdW5vYnNlcnZlRGVjb3JhdGVkTGF5ZXIobWFya2VyTGF5ZXIpXG4gICAgQHNjaGVkdWxlVXBkYXRlRGVjb3JhdGlvbnNFdmVudCgpXG5cbiAgb2JzZXJ2ZURlY29yYXRlZExheWVyOiAobGF5ZXIpIC0+XG4gICAgQGRlY29yYXRpb25Db3VudHNCeUxheWVySWRbbGF5ZXIuaWRdID89IDBcbiAgICBpZiArK0BkZWNvcmF0aW9uQ291bnRzQnlMYXllcklkW2xheWVyLmlkXSBpcyAxXG4gICAgICBAbGF5ZXJVcGRhdGVEaXNwb3NhYmxlc0J5TGF5ZXJJZFtsYXllci5pZF0gPSBsYXllci5vbkRpZFVwZGF0ZShAc2NoZWR1bGVVcGRhdGVEZWNvcmF0aW9uc0V2ZW50LmJpbmQodGhpcykpXG5cbiAgdW5vYnNlcnZlRGVjb3JhdGVkTGF5ZXI6IChsYXllcikgLT5cbiAgICBpZiAtLUBkZWNvcmF0aW9uQ291bnRzQnlMYXllcklkW2xheWVyLmlkXSBpcyAwXG4gICAgICBAbGF5ZXJVcGRhdGVEaXNwb3NhYmxlc0J5TGF5ZXJJZFtsYXllci5pZF0uZGlzcG9zZSgpXG4gICAgICBkZWxldGUgQGRlY29yYXRpb25Db3VudHNCeUxheWVySWRbbGF5ZXIuaWRdXG4gICAgICBkZWxldGUgQGxheWVyVXBkYXRlRGlzcG9zYWJsZXNCeUxheWVySWRbbGF5ZXIuaWRdXG4iXX0=
