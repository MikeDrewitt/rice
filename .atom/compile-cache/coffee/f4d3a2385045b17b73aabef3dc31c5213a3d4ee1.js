(function() {
  var $, $$, CollapsibleSectionPanel, CompositeDisposable, SettingsPanel, TextEditorView, View, _, appendArray, appendCheckbox, appendColor, appendEditor, appendObject, appendOptions, appendSetting, getSettingDescription, getSettingTitle, isEditableArray, ref, sortSettings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('atom-space-pen-views'), $ = ref.$, $$ = ref.$$, TextEditorView = ref.TextEditorView, View = ref.View;

  _ = require('underscore-plus');

  CollapsibleSectionPanel = require('./collapsible-section-panel');

  getSettingDescription = require('./rich-description').getSettingDescription;

  module.exports = SettingsPanel = (function(superClass) {
    extend(SettingsPanel, superClass);

    function SettingsPanel() {
      return SettingsPanel.__super__.constructor.apply(this, arguments);
    }

    SettingsPanel.content = function() {
      return this.section({
        "class": 'section settings-panel'
      });
    };

    SettingsPanel.prototype.initialize = function(namespace, options1) {
      var i, len, name, scopedSettings, settings;
      this.options = options1 != null ? options1 : {};
      this.disposables = new CompositeDisposable();
      if (this.options.scopeName) {
        namespace = 'editor';
        scopedSettings = ['autoIndent', 'autoIndentOnPaste', 'invisibles', 'nonWordCharacters', 'normalizeIndentOnPaste', 'preferredLineLength', 'scrollPastEnd', 'showIndentGuide', 'showInvisibles', 'softWrap', 'softWrapAtPreferredLineLength', 'softWrapHangingIndent', 'tabLength'];
        settings = {};
        for (i = 0, len = scopedSettings.length; i < len; i++) {
          name = scopedSettings[i];
          settings[name] = atom.config.get(name, {
            scope: [this.options.scopeName]
          });
        }
      } else {
        settings = atom.config.get(namespace);
      }
      this.appendSettings(namespace, settings);
      this.bindInputFields();
      this.bindSelectFields();
      this.bindEditors();
      return this.handleEvents();
    };

    SettingsPanel.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    SettingsPanel.prototype.appendSettings = function(namespace, settings) {
      var icon, includeTitle, note, ref1, ref2, sortedSettings, title;
      if (_.isEmpty(settings)) {
        return;
      }
      title = this.options.title;
      includeTitle = (ref1 = this.options.includeTitle) != null ? ref1 : true;
      if (includeTitle) {
        if (title == null) {
          title = (_.undasherize(_.uncamelcase(namespace))) + " Settings";
        }
      } else {
        if (title == null) {
          title = "Settings";
        }
      }
      icon = (ref2 = this.options.icon) != null ? ref2 : 'gear';
      note = this.options.note;
      sortedSettings = this.sortSettings(namespace, settings);
      return this.append($$(function() {
        return this.div({
          "class": 'section-container'
        }, (function(_this) {
          return function() {
            _this.div({
              "class": "block section-heading icon icon-" + icon
            }, title);
            if (note) {
              _this.raw(note);
            }
            return _this.div({
              "class": 'section-body'
            }, function() {
              var i, len, name, results;
              results = [];
              for (i = 0, len = sortedSettings.length; i < len; i++) {
                name = sortedSettings[i];
                results.push(appendSetting.call(_this, namespace, name, settings[name]));
              }
              return results;
            });
          };
        })(this));
      }));
    };

    SettingsPanel.prototype.sortSettings = function(namespace, settings) {
      return sortSettings(namespace, settings);
    };

    SettingsPanel.prototype.bindInputFields = function() {
      return this.find('input[id]').toArray().forEach((function(_this) {
        return function(input) {
          var name, type;
          input = $(input);
          name = input.attr('id');
          type = input.attr('type');
          _this.observe(name, function(value) {
            var ref1;
            if (type === 'checkbox') {
              return input.prop('checked', value);
            } else {
              if (type === 'color') {
                value = (ref1 = value != null ? typeof value.toHexString === "function" ? value.toHexString() : void 0 : void 0) != null ? ref1 : value;
              }
              if (value) {
                return input.val(value);
              }
            }
          });
          return input.on('change', function() {
            var setNewValue, value;
            value = input.val();
            if (type === 'checkbox') {
              value = !!input.prop('checked');
            } else {
              value = _this.parseValue(type, value);
            }
            setNewValue = function() {
              return _this.set(name, value);
            };
            if (type === 'color') {
              clearTimeout(_this.colorDebounceTimeout);
              return _this.colorDebounceTimeout = setTimeout(setNewValue, 100);
            } else {
              return setNewValue();
            }
          });
        };
      })(this));
    };

    SettingsPanel.prototype.observe = function(name, callback) {
      var params;
      params = {
        sources: [atom.config.getUserConfigPath()]
      };
      if (this.options.scopeName != null) {
        params.scope = [this.options.scopeName];
      }
      return this.disposables.add(atom.config.observe(name, params, callback));
    };

    SettingsPanel.prototype.isDefault = function(name) {
      var defaultValue, params, value;
      params = {
        sources: [atom.config.getUserConfigPath()]
      };
      if (this.options.scopeName != null) {
        params.scope = [this.options.scopeName];
      }
      defaultValue = this.getDefault(name);
      value = atom.config.get(name, params);
      return (value == null) || defaultValue === value;
    };

    SettingsPanel.prototype.getDefault = function(name) {
      var params;
      if (this.options.scopeName != null) {
        return atom.config.get(name);
      } else {
        params = {
          excludeSources: [atom.config.getUserConfigPath()]
        };
        if (this.options.scopeName != null) {
          params.scope = [this.options.scopeName];
        }
        return atom.config.get(name, params);
      }
    };

    SettingsPanel.prototype.set = function(name, value) {
      if (this.options.scopeName) {
        if (value === void 0) {
          return atom.config.unset(name, {
            scopeSelector: this.options.scopeName
          });
        } else {
          return atom.config.set(name, value, {
            scopeSelector: this.options.scopeName
          });
        }
      } else {
        return atom.config.set(name, value);
      }
    };

    SettingsPanel.prototype.bindSelectFields = function() {
      return this.find('select[id]').toArray().forEach((function(_this) {
        return function(select) {
          var name;
          select = $(select);
          name = select.attr('id');
          _this.observe(name, function(value) {
            return select.val(value);
          });
          return select.change(function() {
            return _this.set(name, select.val());
          });
        };
      })(this));
    };

    SettingsPanel.prototype.bindEditors = function() {
      return this.find('atom-text-editor[id]').views().forEach((function(_this) {
        return function(editorView) {
          var defaultValue, editor, editorElement, name, type;
          editor = editorView.getModel();
          editorElement = $(editorView.element);
          name = editorView.attr('id');
          type = editorView.attr('type');
          if (defaultValue = _this.valueToString(_this.getDefault(name))) {
            if (_this.options.scopeName != null) {
              editor.setPlaceholderText("Unscoped value: " + defaultValue);
            } else {
              editor.setPlaceholderText("Default: " + defaultValue);
            }
          }
          editorElement.on('focus', function() {
            var ref1;
            if (_this.isDefault(name)) {
              return editorView.setText((ref1 = _this.valueToString(_this.getDefault(name))) != null ? ref1 : '');
            }
          });
          editorElement.on('blur', function() {
            if (_this.isDefault(name)) {
              return editorView.setText('');
            }
          });
          _this.observe(name, function(value) {
            var ref1, stringValue;
            if (_this.isDefault(name)) {
              stringValue = '';
            } else {
              stringValue = (ref1 = _this.valueToString(value)) != null ? ref1 : '';
            }
            if (stringValue === editor.getText()) {
              return;
            }
            if (_.isEqual(value, _this.parseValue(type, editor.getText()))) {
              return;
            }
            return editorView.setText(stringValue);
          });
          return editor.onDidStopChanging(function() {
            return _this.set(name, _this.parseValue(type, editor.getText()));
          });
        };
      })(this));
    };

    SettingsPanel.prototype.valueToString = function(value) {
      if (_.isArray(value)) {
        return value.join(', ');
      } else {
        return value != null ? value.toString() : void 0;
      }
    };

    SettingsPanel.prototype.parseValue = function(type, value) {
      var arrayValue, floatValue, val;
      if (value === '') {
        value = void 0;
      } else if (type === 'number') {
        floatValue = parseFloat(value);
        if (!isNaN(floatValue)) {
          value = floatValue;
        }
      } else if (type === 'array') {
        arrayValue = (value || '').split(',');
        value = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = arrayValue.length; i < len; i++) {
            val = arrayValue[i];
            if (val) {
              results.push(val.trim());
            }
          }
          return results;
        })();
      }
      return value;
    };

    return SettingsPanel;

  })(CollapsibleSectionPanel);


  /*
   * Space Pen Helpers
   */

  isEditableArray = function(array) {
    var i, item, len;
    for (i = 0, len = array.length; i < len; i++) {
      item = array[i];
      if (!_.isString(item)) {
        return false;
      }
    }
    return true;
  };

  sortSettings = function(namespace, settings) {
    return _.chain(settings).keys().sortBy(function(name) {
      return name;
    }).sortBy(function(name) {
      var ref1;
      return (ref1 = atom.config.getSchema(namespace + "." + name)) != null ? ref1.order : void 0;
    }).value();
  };

  appendSetting = function(namespace, name, value) {
    if (namespace === 'core') {
      if (name === 'themes') {
        return;
      }
      if (name === 'disabledPackages') {
        return;
      }
      if (name === 'customFileTypes') {
        return;
      }
    }
    if (namespace === 'editor') {
      if (name === 'commentStart' || name === 'commentEnd' || name === 'increaseIndentPattern' || name === 'decreaseIndentPattern' || name === 'foldEndPattern') {
        return;
      }
    }
    return this.div({
      "class": 'control-group'
    }, (function(_this) {
      return function() {
        return _this.div({
          "class": 'controls'
        }, function() {
          var schema;
          schema = atom.config.getSchema(namespace + "." + name);
          if (schema != null ? schema["enum"] : void 0) {
            return appendOptions.call(_this, namespace, name, value);
          } else if ((schema != null ? schema.type : void 0) === 'color') {
            return appendColor.call(_this, namespace, name, value);
          } else if (_.isBoolean(value) || (schema != null ? schema.type : void 0) === 'boolean') {
            return appendCheckbox.call(_this, namespace, name, value);
          } else if (_.isArray(value) || (schema != null ? schema.type : void 0) === 'array') {
            if (isEditableArray(value)) {
              return appendArray.call(_this, namespace, name, value);
            }
          } else if (_.isObject(value) || (schema != null ? schema.type : void 0) === 'object') {
            return appendObject.call(_this, namespace, name, value);
          } else {
            return appendEditor.call(_this, namespace, name, value);
          }
        });
      };
    })(this));
  };

  getSettingTitle = function(keyPath, name) {
    var ref1, title;
    if (name == null) {
      name = '';
    }
    title = (ref1 = atom.config.getSchema(keyPath)) != null ? ref1.title : void 0;
    return title || _.uncamelcase(name).split('.').map(_.capitalize).join(' ');
  };

  appendOptions = function(namespace, name, value) {
    var description, keyPath, options, ref1, ref2, title;
    keyPath = namespace + "." + name;
    title = getSettingTitle(keyPath, name);
    description = getSettingDescription(keyPath);
    options = (ref1 = (ref2 = atom.config.getSchema(keyPath)) != null ? ref2["enum"] : void 0) != null ? ref1 : [];
    this.label({
      "class": 'control-label'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'setting-title'
        }, title);
        return _this.div({
          "class": 'setting-description'
        }, function() {
          return _this.raw(description);
        });
      };
    })(this));
    return this.select({
      id: keyPath,
      "class": 'form-control'
    }, (function(_this) {
      return function() {
        var i, len, option, results;
        results = [];
        for (i = 0, len = options.length; i < len; i++) {
          option = options[i];
          if (option.hasOwnProperty('value')) {
            results.push(_this.option({
              value: option.value
            }, option.description));
          } else {
            results.push(_this.option({
              value: option
            }, option));
          }
        }
        return results;
      };
    })(this));
  };

  appendCheckbox = function(namespace, name, value) {
    var description, keyPath, title;
    keyPath = namespace + "." + name;
    title = getSettingTitle(keyPath, name);
    description = getSettingDescription(keyPath);
    return this.div({
      "class": 'checkbox'
    }, (function(_this) {
      return function() {
        _this.label({
          "for": keyPath
        }, function() {
          _this.input({
            id: keyPath,
            type: 'checkbox'
          });
          return _this.div({
            "class": 'setting-title'
          }, title);
        });
        return _this.div({
          "class": 'setting-description'
        }, function() {
          return _this.raw(description);
        });
      };
    })(this));
  };

  appendColor = function(namespace, name, value) {
    var description, keyPath, title;
    keyPath = namespace + "." + name;
    title = getSettingTitle(keyPath, name);
    description = getSettingDescription(keyPath);
    return this.div({
      "class": 'color'
    }, (function(_this) {
      return function() {
        _this.label({
          "for": keyPath
        }, function() {
          _this.input({
            id: keyPath,
            type: 'color'
          });
          return _this.div({
            "class": 'setting-title'
          }, title);
        });
        return _this.div({
          "class": 'setting-description'
        }, function() {
          return _this.raw(description);
        });
      };
    })(this));
  };

  appendEditor = function(namespace, name, value) {
    var description, keyPath, title, type;
    keyPath = namespace + "." + name;
    if (_.isNumber(value)) {
      type = 'number';
    } else {
      type = 'string';
    }
    title = getSettingTitle(keyPath, name);
    description = getSettingDescription(keyPath);
    this.label({
      "class": 'control-label'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'setting-title'
        }, title);
        return _this.div({
          "class": 'setting-description'
        }, function() {
          return _this.raw(description);
        });
      };
    })(this));
    return this.div({
      "class": 'controls'
    }, (function(_this) {
      return function() {
        return _this.div({
          "class": 'editor-container'
        }, function() {
          return _this.subview(keyPath.replace(/\./g, ''), new TextEditorView({
            mini: true,
            attributes: {
              id: keyPath,
              type: type
            }
          }));
        });
      };
    })(this));
  };

  appendArray = function(namespace, name, value) {
    var description, keyPath, title;
    keyPath = namespace + "." + name;
    title = getSettingTitle(keyPath, name);
    description = getSettingDescription(keyPath);
    this.label({
      "class": 'control-label'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'setting-title'
        }, title);
        return _this.div({
          "class": 'setting-description'
        }, function() {
          return _this.raw(description);
        });
      };
    })(this));
    return this.div({
      "class": 'controls'
    }, (function(_this) {
      return function() {
        return _this.div({
          "class": 'editor-container'
        }, function() {
          return _this.subview(keyPath.replace(/\./g, ''), new TextEditorView({
            mini: true,
            attributes: {
              id: keyPath,
              type: 'array'
            }
          }));
        });
      };
    })(this));
  };

  appendObject = function(namespace, name, value) {
    var isCollapsed, keyPath, schema, title;
    if (!_.keys(value).length) {
      return;
    }
    keyPath = namespace + "." + name;
    title = getSettingTitle(keyPath, name);
    schema = atom.config.getSchema(keyPath);
    isCollapsed = schema.collapsed === true;
    return this.section({
      "class": "sub-section" + (isCollapsed ? ' collapsed' : '')
    }, (function(_this) {
      return function() {
        _this.h3({
          "class": 'sub-section-heading has-items'
        }, function() {
          return _this.text(title);
        });
        return _this.div({
          "class": 'sub-section-body'
        }, function() {
          var i, key, len, results, sortedSettings;
          sortedSettings = sortSettings(keyPath, value);
          results = [];
          for (i = 0, len = sortedSettings.length; i < len; i++) {
            key = sortedSettings[i];
            results.push(appendSetting.call(_this, namespace, name + "." + key, value[key]));
          }
          return results;
        });
      };
    })(this));
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9zZXR0aW5ncy1wYW5lbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJRQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsTUFBZ0MsT0FBQSxDQUFRLHNCQUFSLENBQWhDLEVBQUMsU0FBRCxFQUFJLFdBQUosRUFBUSxtQ0FBUixFQUF3Qjs7RUFDeEIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSix1QkFBQSxHQUEwQixPQUFBLENBQVEsNkJBQVI7O0VBRXpCLHdCQUF5QixPQUFBLENBQVEsb0JBQVI7O0VBRTFCLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7SUFDSixhQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsT0FBRCxDQUFTO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx3QkFBUDtPQUFUO0lBRFE7OzRCQUdWLFVBQUEsR0FBWSxTQUFDLFNBQUQsRUFBWSxRQUFaO0FBQ1YsVUFBQTtNQURzQixJQUFDLENBQUEsNkJBQUQsV0FBUztNQUMvQixJQUFDLENBQUEsV0FBRCxHQUFtQixJQUFBLG1CQUFBLENBQUE7TUFDbkIsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVo7UUFDRSxTQUFBLEdBQVk7UUFDWixjQUFBLEdBQWlCLENBQ2YsWUFEZSxFQUVmLG1CQUZlLEVBR2YsWUFIZSxFQUlmLG1CQUplLEVBS2Ysd0JBTGUsRUFNZixxQkFOZSxFQU9mLGVBUGUsRUFRZixpQkFSZSxFQVNmLGdCQVRlLEVBVWYsVUFWZSxFQVdmLCtCQVhlLEVBWWYsdUJBWmUsRUFhZixXQWJlO1FBZWpCLFFBQUEsR0FBVztBQUNYLGFBQUEsZ0RBQUE7O1VB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QyxDQUFBLE9BQUQsQ0FBUztNQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBQSxHQUFhLENBQUksV0FBSCxHQUFvQixZQUFwQixHQUFzQyxFQUF2QyxDQUFwQjtLQUFULEVBQTBFLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtRQUN4RSxLQUFDLENBQUEsRUFBRCxDQUFJO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTywrQkFBUDtTQUFKLEVBQTRDLFNBQUE7aUJBQzFDLEtBQUMsQ0FBQSxJQUFELENBQU0sS0FBTjtRQUQwQyxDQUE1QztlQUVBLEtBQUMsQ0FBQSxHQUFELENBQUs7VUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1NBQUwsRUFBZ0MsU0FBQTtBQUM5QixjQUFBO1VBQUEsY0FBQSxHQUFpQixZQUFBLENBQWEsT0FBYixFQUFzQixLQUF0QjtBQUNqQjtlQUFBLGdEQUFBOzt5QkFDRSxhQUFhLENBQUMsSUFBZCxDQUFtQixLQUFuQixFQUF5QixTQUF6QixFQUF1QyxJQUFELEdBQU0sR0FBTixHQUFTLEdBQS9DLEVBQXNELEtBQU0sQ0FBQSxHQUFBLENBQTVEO0FBREY7O1FBRjhCLENBQWhDO01BSHdFO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExRTtFQVBhO0FBeFRmIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnskLCAkJCwgVGV4dEVkaXRvclZpZXcsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuQ29sbGFwc2libGVTZWN0aW9uUGFuZWwgPSByZXF1aXJlICcuL2NvbGxhcHNpYmxlLXNlY3Rpb24tcGFuZWwnXG5cbntnZXRTZXR0aW5nRGVzY3JpcHRpb259ID0gcmVxdWlyZSAnLi9yaWNoLWRlc2NyaXB0aW9uJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZXR0aW5nc1BhbmVsIGV4dGVuZHMgQ29sbGFwc2libGVTZWN0aW9uUGFuZWxcbiAgQGNvbnRlbnQ6IC0+XG4gICAgQHNlY3Rpb24gY2xhc3M6ICdzZWN0aW9uIHNldHRpbmdzLXBhbmVsJ1xuXG4gIGluaXRpYWxpemU6IChuYW1lc3BhY2UsIEBvcHRpb25zPXt9KSAtPlxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBpZiBAb3B0aW9ucy5zY29wZU5hbWVcbiAgICAgIG5hbWVzcGFjZSA9ICdlZGl0b3InXG4gICAgICBzY29wZWRTZXR0aW5ncyA9IFtcbiAgICAgICAgJ2F1dG9JbmRlbnQnXG4gICAgICAgICdhdXRvSW5kZW50T25QYXN0ZSdcbiAgICAgICAgJ2ludmlzaWJsZXMnXG4gICAgICAgICdub25Xb3JkQ2hhcmFjdGVycydcbiAgICAgICAgJ25vcm1hbGl6ZUluZGVudE9uUGFzdGUnXG4gICAgICAgICdwcmVmZXJyZWRMaW5lTGVuZ3RoJ1xuICAgICAgICAnc2Nyb2xsUGFzdEVuZCdcbiAgICAgICAgJ3Nob3dJbmRlbnRHdWlkZSdcbiAgICAgICAgJ3Nob3dJbnZpc2libGVzJ1xuICAgICAgICAnc29mdFdyYXAnXG4gICAgICAgICdzb2Z0V3JhcEF0UHJlZmVycmVkTGluZUxlbmd0aCdcbiAgICAgICAgJ3NvZnRXcmFwSGFuZ2luZ0luZGVudCdcbiAgICAgICAgJ3RhYkxlbmd0aCdcbiAgICAgIF1cbiAgICAgIHNldHRpbmdzID0ge31cbiAgICAgIGZvciBuYW1lIGluIHNjb3BlZFNldHRpbmdzXG4gICAgICAgIHNldHRpbmdzW25hbWVdID0gYXRvbS5jb25maWcuZ2V0KG5hbWUsIHNjb3BlOiBbQG9wdGlvbnMuc2NvcGVOYW1lXSlcbiAgICBlbHNlXG4gICAgICBzZXR0aW5ncyA9IGF0b20uY29uZmlnLmdldChuYW1lc3BhY2UpXG5cbiAgICBAYXBwZW5kU2V0dGluZ3MobmFtZXNwYWNlLCBzZXR0aW5ncylcblxuICAgIEBiaW5kSW5wdXRGaWVsZHMoKVxuICAgIEBiaW5kU2VsZWN0RmllbGRzKClcbiAgICBAYmluZEVkaXRvcnMoKVxuICAgIEBoYW5kbGVFdmVudHMoKVxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGFwcGVuZFNldHRpbmdzOiAobmFtZXNwYWNlLCBzZXR0aW5ncykgLT5cbiAgICByZXR1cm4gaWYgXy5pc0VtcHR5KHNldHRpbmdzKVxuXG4gICAgdGl0bGUgPSBAb3B0aW9ucy50aXRsZVxuICAgIGluY2x1ZGVUaXRsZSA9IEBvcHRpb25zLmluY2x1ZGVUaXRsZSA/IHRydWVcbiAgICBpZiBpbmNsdWRlVGl0bGVcbiAgICAgIHRpdGxlID89IFwiI3tfLnVuZGFzaGVyaXplKF8udW5jYW1lbGNhc2UobmFtZXNwYWNlKSl9IFNldHRpbmdzXCJcbiAgICBlbHNlXG4gICAgICB0aXRsZSA/PSBcIlNldHRpbmdzXCJcblxuICAgIGljb24gPSBAb3B0aW9ucy5pY29uID8gJ2dlYXInXG4gICAgbm90ZSA9IEBvcHRpb25zLm5vdGVcblxuICAgIHNvcnRlZFNldHRpbmdzID0gQHNvcnRTZXR0aW5ncyhuYW1lc3BhY2UsIHNldHRpbmdzKVxuXG4gICAgQGFwcGVuZCAkJCAtPlxuICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24tY29udGFpbmVyJywgPT5cbiAgICAgICAgQGRpdiBjbGFzczogXCJibG9jayBzZWN0aW9uLWhlYWRpbmcgaWNvbiBpY29uLSN7aWNvbn1cIiwgdGl0bGVcbiAgICAgICAgQHJhdyBub3RlIGlmIG5vdGVcbiAgICAgICAgQGRpdiBjbGFzczogJ3NlY3Rpb24tYm9keScsID0+XG4gICAgICAgICAgZm9yIG5hbWUgaW4gc29ydGVkU2V0dGluZ3NcbiAgICAgICAgICAgIGFwcGVuZFNldHRpbmcuY2FsbCh0aGlzLCBuYW1lc3BhY2UsIG5hbWUsIHNldHRpbmdzW25hbWVdKVxuXG4gIHNvcnRTZXR0aW5nczogKG5hbWVzcGFjZSwgc2V0dGluZ3MpIC0+XG4gICAgc29ydFNldHRpbmdzKG5hbWVzcGFjZSwgc2V0dGluZ3MpXG5cbiAgYmluZElucHV0RmllbGRzOiAtPlxuICAgIEBmaW5kKCdpbnB1dFtpZF0nKS50b0FycmF5KCkuZm9yRWFjaCAoaW5wdXQpID0+XG4gICAgICBpbnB1dCA9ICQoaW5wdXQpXG4gICAgICBuYW1lID0gaW5wdXQuYXR0cignaWQnKVxuICAgICAgdHlwZSA9IGlucHV0LmF0dHIoJ3R5cGUnKVxuXG4gICAgICBAb2JzZXJ2ZSBuYW1lLCAodmFsdWUpIC0+XG4gICAgICAgIGlmIHR5cGUgaXMgJ2NoZWNrYm94J1xuICAgICAgICAgIGlucHV0LnByb3AoJ2NoZWNrZWQnLCB2YWx1ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHZhbHVlID0gdmFsdWU/LnRvSGV4U3RyaW5nPygpID8gdmFsdWUgaWYgdHlwZSBpcyAnY29sb3InXG4gICAgICAgICAgaW5wdXQudmFsKHZhbHVlKSBpZiB2YWx1ZVxuXG4gICAgICBpbnB1dC5vbiAnY2hhbmdlJywgPT5cbiAgICAgICAgdmFsdWUgPSBpbnB1dC52YWwoKVxuICAgICAgICBpZiB0eXBlIGlzICdjaGVja2JveCdcbiAgICAgICAgICB2YWx1ZSA9ICEhaW5wdXQucHJvcCgnY2hlY2tlZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB2YWx1ZSA9IEBwYXJzZVZhbHVlKHR5cGUsIHZhbHVlKVxuXG4gICAgICAgIHNldE5ld1ZhbHVlID0gPT4gQHNldChuYW1lLCB2YWx1ZSlcbiAgICAgICAgaWYgdHlwZSBpcyAnY29sb3InXG4gICAgICAgICAgIyBUaGlzIGlzIGRlYm91bmNlZCBzaW5jZSB0aGUgY29sb3Igd2hlZWwgZmlyZXMgbG90cyBvZiBldmVudHNcbiAgICAgICAgICAjIGFzIHlvdSBhcmUgZHJhZ2dpbmcgaXQgYXJvdW5kXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KEBjb2xvckRlYm91bmNlVGltZW91dClcbiAgICAgICAgICBAY29sb3JEZWJvdW5jZVRpbWVvdXQgPSBzZXRUaW1lb3V0KHNldE5ld1ZhbHVlLCAxMDApXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzZXROZXdWYWx1ZSgpXG5cbiAgb2JzZXJ2ZTogKG5hbWUsIGNhbGxiYWNrKSAtPlxuICAgIHBhcmFtcyA9IHtzb3VyY2VzOiBbYXRvbS5jb25maWcuZ2V0VXNlckNvbmZpZ1BhdGgoKV19XG4gICAgcGFyYW1zLnNjb3BlID0gW0BvcHRpb25zLnNjb3BlTmFtZV0gaWYgQG9wdGlvbnMuc2NvcGVOYW1lP1xuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb25maWcub2JzZXJ2ZShuYW1lLCBwYXJhbXMsIGNhbGxiYWNrKVxuXG4gIGlzRGVmYXVsdDogKG5hbWUpIC0+XG4gICAgcGFyYW1zID0ge3NvdXJjZXM6IFthdG9tLmNvbmZpZy5nZXRVc2VyQ29uZmlnUGF0aCgpXX1cbiAgICBwYXJhbXMuc2NvcGUgPSBbQG9wdGlvbnMuc2NvcGVOYW1lXSBpZiBAb3B0aW9ucy5zY29wZU5hbWU/XG4gICAgZGVmYXVsdFZhbHVlID0gQGdldERlZmF1bHQobmFtZSlcbiAgICB2YWx1ZSA9IGF0b20uY29uZmlnLmdldChuYW1lLCBwYXJhbXMpXG4gICAgbm90IHZhbHVlPyBvciBkZWZhdWx0VmFsdWUgaXMgdmFsdWVcblxuICBnZXREZWZhdWx0OiAobmFtZSkgLT5cbiAgICBpZiBAb3B0aW9ucy5zY29wZU5hbWU/XG4gICAgICBhdG9tLmNvbmZpZy5nZXQobmFtZSlcbiAgICBlbHNlXG4gICAgICBwYXJhbXMgPSB7ZXhjbHVkZVNvdXJjZXM6IFthdG9tLmNvbmZpZy5nZXRVc2VyQ29uZmlnUGF0aCgpXX1cbiAgICAgIHBhcmFtcy5zY29wZSA9IFtAb3B0aW9ucy5zY29wZU5hbWVdIGlmIEBvcHRpb25zLnNjb3BlTmFtZT9cbiAgICAgIGF0b20uY29uZmlnLmdldChuYW1lLCBwYXJhbXMpXG5cbiAgc2V0OiAobmFtZSwgdmFsdWUpIC0+XG4gICAgaWYgQG9wdGlvbnMuc2NvcGVOYW1lXG4gICAgICBpZiB2YWx1ZSBpcyB1bmRlZmluZWRcbiAgICAgICAgYXRvbS5jb25maWcudW5zZXQobmFtZSwgc2NvcGVTZWxlY3RvcjogQG9wdGlvbnMuc2NvcGVOYW1lKVxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQobmFtZSwgdmFsdWUsIHNjb3BlU2VsZWN0b3I6IEBvcHRpb25zLnNjb3BlTmFtZSlcbiAgICBlbHNlXG4gICAgICBhdG9tLmNvbmZpZy5zZXQobmFtZSwgdmFsdWUpXG5cbiAgYmluZFNlbGVjdEZpZWxkczogLT5cbiAgICBAZmluZCgnc2VsZWN0W2lkXScpLnRvQXJyYXkoKS5mb3JFYWNoIChzZWxlY3QpID0+XG4gICAgICBzZWxlY3QgPSAkKHNlbGVjdClcbiAgICAgIG5hbWUgPSBzZWxlY3QuYXR0cignaWQnKVxuXG4gICAgICBAb2JzZXJ2ZSBuYW1lLCAodmFsdWUpIC0+XG4gICAgICAgIHNlbGVjdC52YWwodmFsdWUpXG5cbiAgICAgIHNlbGVjdC5jaGFuZ2UgPT5cbiAgICAgICAgQHNldChuYW1lLCBzZWxlY3QudmFsKCkpXG5cbiAgYmluZEVkaXRvcnM6IC0+XG4gICAgQGZpbmQoJ2F0b20tdGV4dC1lZGl0b3JbaWRdJykudmlld3MoKS5mb3JFYWNoIChlZGl0b3JWaWV3KSA9PlxuICAgICAgZWRpdG9yID0gZWRpdG9yVmlldy5nZXRNb2RlbCgpXG4gICAgICBlZGl0b3JFbGVtZW50ID0gJChlZGl0b3JWaWV3LmVsZW1lbnQpXG4gICAgICBuYW1lID0gZWRpdG9yVmlldy5hdHRyKCdpZCcpXG4gICAgICB0eXBlID0gZWRpdG9yVmlldy5hdHRyKCd0eXBlJylcblxuICAgICAgaWYgZGVmYXVsdFZhbHVlID0gQHZhbHVlVG9TdHJpbmcoQGdldERlZmF1bHQobmFtZSkpXG4gICAgICAgIGlmIEBvcHRpb25zLnNjb3BlTmFtZT9cbiAgICAgICAgICBlZGl0b3Iuc2V0UGxhY2Vob2xkZXJUZXh0KFwiVW5zY29wZWQgdmFsdWU6ICN7ZGVmYXVsdFZhbHVlfVwiKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZWRpdG9yLnNldFBsYWNlaG9sZGVyVGV4dChcIkRlZmF1bHQ6ICN7ZGVmYXVsdFZhbHVlfVwiKVxuXG4gICAgICBlZGl0b3JFbGVtZW50Lm9uICdmb2N1cycsID0+XG4gICAgICAgIGlmIEBpc0RlZmF1bHQobmFtZSlcbiAgICAgICAgICBlZGl0b3JWaWV3LnNldFRleHQoQHZhbHVlVG9TdHJpbmcoQGdldERlZmF1bHQobmFtZSkpID8gJycpXG5cbiAgICAgIGVkaXRvckVsZW1lbnQub24gJ2JsdXInLCA9PlxuICAgICAgICBpZiBAaXNEZWZhdWx0KG5hbWUpXG4gICAgICAgICAgZWRpdG9yVmlldy5zZXRUZXh0KCcnKVxuXG4gICAgICBAb2JzZXJ2ZSBuYW1lLCAodmFsdWUpID0+XG4gICAgICAgIGlmIEBpc0RlZmF1bHQobmFtZSlcbiAgICAgICAgICBzdHJpbmdWYWx1ZSA9ICcnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzdHJpbmdWYWx1ZSA9IEB2YWx1ZVRvU3RyaW5nKHZhbHVlKSA/ICcnXG5cbiAgICAgICAgcmV0dXJuIGlmIHN0cmluZ1ZhbHVlIGlzIGVkaXRvci5nZXRUZXh0KClcbiAgICAgICAgcmV0dXJuIGlmIF8uaXNFcXVhbCh2YWx1ZSwgQHBhcnNlVmFsdWUodHlwZSwgZWRpdG9yLmdldFRleHQoKSkpXG5cbiAgICAgICAgZWRpdG9yVmlldy5zZXRUZXh0KHN0cmluZ1ZhbHVlKVxuXG4gICAgICBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgPT5cbiAgICAgICAgQHNldChuYW1lLCBAcGFyc2VWYWx1ZSh0eXBlLCBlZGl0b3IuZ2V0VGV4dCgpKSlcblxuICB2YWx1ZVRvU3RyaW5nOiAodmFsdWUpIC0+XG4gICAgaWYgXy5pc0FycmF5KHZhbHVlKVxuICAgICAgdmFsdWUuam9pbignLCAnKVxuICAgIGVsc2VcbiAgICAgIHZhbHVlPy50b1N0cmluZygpXG5cbiAgcGFyc2VWYWx1ZTogKHR5cGUsIHZhbHVlKSAtPlxuICAgIGlmIHZhbHVlIGlzICcnXG4gICAgICB2YWx1ZSA9IHVuZGVmaW5lZFxuICAgIGVsc2UgaWYgdHlwZSBpcyAnbnVtYmVyJ1xuICAgICAgZmxvYXRWYWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpXG4gICAgICB2YWx1ZSA9IGZsb2F0VmFsdWUgdW5sZXNzIGlzTmFOKGZsb2F0VmFsdWUpXG4gICAgZWxzZSBpZiB0eXBlIGlzICdhcnJheSdcbiAgICAgIGFycmF5VmFsdWUgPSAodmFsdWUgb3IgJycpLnNwbGl0KCcsJylcbiAgICAgIHZhbHVlID0gKHZhbC50cmltKCkgZm9yIHZhbCBpbiBhcnJheVZhbHVlIHdoZW4gdmFsKVxuXG4gICAgdmFsdWVcblxuIyMjXG4jIFNwYWNlIFBlbiBIZWxwZXJzXG4jIyNcblxuaXNFZGl0YWJsZUFycmF5ID0gKGFycmF5KSAtPlxuICBmb3IgaXRlbSBpbiBhcnJheVxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgXy5pc1N0cmluZyhpdGVtKVxuICB0cnVlXG5cbnNvcnRTZXR0aW5ncyA9IChuYW1lc3BhY2UsIHNldHRpbmdzKSAtPlxuICBfLmNoYWluKHNldHRpbmdzKS5rZXlzKCkuc29ydEJ5KChuYW1lKSAtPiBuYW1lKS5zb3J0QnkoKG5hbWUpIC0+IGF0b20uY29uZmlnLmdldFNjaGVtYShcIiN7bmFtZXNwYWNlfS4je25hbWV9XCIpPy5vcmRlcikudmFsdWUoKVxuXG5hcHBlbmRTZXR0aW5nID0gKG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpIC0+XG4gIGlmIG5hbWVzcGFjZSBpcyAnY29yZSdcbiAgICByZXR1cm4gaWYgbmFtZSBpcyAndGhlbWVzJyAjIEhhbmRsZWQgaW4gdGhlIFRoZW1lcyBwYW5lbFxuICAgIHJldHVybiBpZiBuYW1lIGlzICdkaXNhYmxlZFBhY2thZ2VzJyAjIEhhbmRsZWQgaW4gdGhlIFBhY2thZ2VzIHBhbmVsXG4gICAgcmV0dXJuIGlmIG5hbWUgaXMgJ2N1c3RvbUZpbGVUeXBlcydcblxuICBpZiBuYW1lc3BhY2UgaXMgJ2VkaXRvcidcbiAgICAjIFRoZXJlJ3Mgbm8gZ2xvYmFsIGRlZmF1bHQgZm9yIHRoZXNlLCB0aGV5IGFyZSBkZWZpbmVkIGJ5IGxhbmd1YWdlIHBhY2thZ2VzXG4gICAgcmV0dXJuIGlmIG5hbWUgaW4gWydjb21tZW50U3RhcnQnLCAnY29tbWVudEVuZCcsICdpbmNyZWFzZUluZGVudFBhdHRlcm4nLCAnZGVjcmVhc2VJbmRlbnRQYXR0ZXJuJywgJ2ZvbGRFbmRQYXR0ZXJuJ11cblxuICBAZGl2IGNsYXNzOiAnY29udHJvbC1ncm91cCcsID0+XG4gICAgQGRpdiBjbGFzczogJ2NvbnRyb2xzJywgPT5cbiAgICAgIHNjaGVtYSA9IGF0b20uY29uZmlnLmdldFNjaGVtYShcIiN7bmFtZXNwYWNlfS4je25hbWV9XCIpXG4gICAgICBpZiBzY2hlbWE/LmVudW1cbiAgICAgICAgYXBwZW5kT3B0aW9ucy5jYWxsKHRoaXMsIG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpXG4gICAgICBlbHNlIGlmIHNjaGVtYT8udHlwZSBpcyAnY29sb3InXG4gICAgICAgIGFwcGVuZENvbG9yLmNhbGwodGhpcywgbmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSlcbiAgICAgIGVsc2UgaWYgXy5pc0Jvb2xlYW4odmFsdWUpIG9yIHNjaGVtYT8udHlwZSBpcyAnYm9vbGVhbidcbiAgICAgICAgYXBwZW5kQ2hlY2tib3guY2FsbCh0aGlzLCBuYW1lc3BhY2UsIG5hbWUsIHZhbHVlKVxuICAgICAgZWxzZSBpZiBfLmlzQXJyYXkodmFsdWUpIG9yIHNjaGVtYT8udHlwZSBpcyAnYXJyYXknXG4gICAgICAgIGFwcGVuZEFycmF5LmNhbGwodGhpcywgbmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSkgaWYgaXNFZGl0YWJsZUFycmF5KHZhbHVlKVxuICAgICAgZWxzZSBpZiBfLmlzT2JqZWN0KHZhbHVlKSBvciBzY2hlbWE/LnR5cGUgaXMgJ29iamVjdCdcbiAgICAgICAgYXBwZW5kT2JqZWN0LmNhbGwodGhpcywgbmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgYXBwZW5kRWRpdG9yLmNhbGwodGhpcywgbmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSlcblxuZ2V0U2V0dGluZ1RpdGxlID0gKGtleVBhdGgsIG5hbWU9JycpIC0+XG4gIHRpdGxlID0gYXRvbS5jb25maWcuZ2V0U2NoZW1hKGtleVBhdGgpPy50aXRsZVxuICB0aXRsZSBvciBfLnVuY2FtZWxjYXNlKG5hbWUpLnNwbGl0KCcuJykubWFwKF8uY2FwaXRhbGl6ZSkuam9pbignICcpXG5cbmFwcGVuZE9wdGlvbnMgPSAobmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSkgLT5cbiAga2V5UGF0aCA9IFwiI3tuYW1lc3BhY2V9LiN7bmFtZX1cIlxuICB0aXRsZSA9IGdldFNldHRpbmdUaXRsZShrZXlQYXRoLCBuYW1lKVxuICBkZXNjcmlwdGlvbiA9IGdldFNldHRpbmdEZXNjcmlwdGlvbihrZXlQYXRoKVxuICBvcHRpb25zID0gYXRvbS5jb25maWcuZ2V0U2NoZW1hKGtleVBhdGgpPy5lbnVtID8gW11cblxuICBAbGFiZWwgY2xhc3M6ICdjb250cm9sLWxhYmVsJywgPT5cbiAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy10aXRsZScsIHRpdGxlXG4gICAgQGRpdiBjbGFzczogJ3NldHRpbmctZGVzY3JpcHRpb24nLCA9PlxuICAgICAgQHJhdyhkZXNjcmlwdGlvbilcblxuICBAc2VsZWN0IGlkOiBrZXlQYXRoLCBjbGFzczogJ2Zvcm0tY29udHJvbCcsID0+XG4gICAgZm9yIG9wdGlvbiBpbiBvcHRpb25zXG4gICAgICBpZiBvcHRpb24uaGFzT3duUHJvcGVydHkoJ3ZhbHVlJylcbiAgICAgICAgQG9wdGlvbiB2YWx1ZTogb3B0aW9uLnZhbHVlLCBvcHRpb24uZGVzY3JpcHRpb25cbiAgICAgIGVsc2VcbiAgICAgICAgQG9wdGlvbiB2YWx1ZTogb3B0aW9uLCBvcHRpb25cblxuYXBwZW5kQ2hlY2tib3ggPSAobmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSkgLT5cbiAga2V5UGF0aCA9IFwiI3tuYW1lc3BhY2V9LiN7bmFtZX1cIlxuICB0aXRsZSA9IGdldFNldHRpbmdUaXRsZShrZXlQYXRoLCBuYW1lKVxuICBkZXNjcmlwdGlvbiA9IGdldFNldHRpbmdEZXNjcmlwdGlvbihrZXlQYXRoKVxuXG4gIEBkaXYgY2xhc3M6ICdjaGVja2JveCcsID0+XG4gICAgQGxhYmVsIGZvcjoga2V5UGF0aCwgPT5cbiAgICAgIEBpbnB1dCBpZDoga2V5UGF0aCwgdHlwZTogJ2NoZWNrYm94J1xuICAgICAgQGRpdiBjbGFzczogJ3NldHRpbmctdGl0bGUnLCB0aXRsZVxuICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLWRlc2NyaXB0aW9uJywgPT5cbiAgICAgIEByYXcoZGVzY3JpcHRpb24pXG5cbmFwcGVuZENvbG9yID0gKG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpIC0+XG4gIGtleVBhdGggPSBcIiN7bmFtZXNwYWNlfS4je25hbWV9XCJcbiAgdGl0bGUgPSBnZXRTZXR0aW5nVGl0bGUoa2V5UGF0aCwgbmFtZSlcbiAgZGVzY3JpcHRpb24gPSBnZXRTZXR0aW5nRGVzY3JpcHRpb24oa2V5UGF0aClcblxuICBAZGl2IGNsYXNzOiAnY29sb3InLCA9PlxuICAgIEBsYWJlbCBmb3I6IGtleVBhdGgsID0+XG4gICAgICBAaW5wdXQgaWQ6IGtleVBhdGgsIHR5cGU6ICdjb2xvcidcbiAgICAgIEBkaXYgY2xhc3M6ICdzZXR0aW5nLXRpdGxlJywgdGl0bGVcbiAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy1kZXNjcmlwdGlvbicsID0+XG4gICAgICBAcmF3KGRlc2NyaXB0aW9uKVxuXG5hcHBlbmRFZGl0b3IgPSAobmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSkgLT5cbiAga2V5UGF0aCA9IFwiI3tuYW1lc3BhY2V9LiN7bmFtZX1cIlxuICBpZiBfLmlzTnVtYmVyKHZhbHVlKVxuICAgIHR5cGUgPSAnbnVtYmVyJ1xuICBlbHNlXG4gICAgdHlwZSA9ICdzdHJpbmcnXG5cbiAgdGl0bGUgPSBnZXRTZXR0aW5nVGl0bGUoa2V5UGF0aCwgbmFtZSlcbiAgZGVzY3JpcHRpb24gPSBnZXRTZXR0aW5nRGVzY3JpcHRpb24oa2V5UGF0aClcblxuICBAbGFiZWwgY2xhc3M6ICdjb250cm9sLWxhYmVsJywgPT5cbiAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy10aXRsZScsIHRpdGxlXG4gICAgQGRpdiBjbGFzczogJ3NldHRpbmctZGVzY3JpcHRpb24nLCA9PlxuICAgICAgQHJhdyhkZXNjcmlwdGlvbilcblxuICBAZGl2IGNsYXNzOiAnY29udHJvbHMnLCA9PlxuICAgIEBkaXYgY2xhc3M6ICdlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgIEBzdWJ2aWV3IGtleVBhdGgucmVwbGFjZSgvXFwuL2csICcnKSwgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUsIGF0dHJpYnV0ZXM6IHtpZDoga2V5UGF0aCwgdHlwZTogdHlwZX0pXG5cbmFwcGVuZEFycmF5ID0gKG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpIC0+XG4gIGtleVBhdGggPSBcIiN7bmFtZXNwYWNlfS4je25hbWV9XCJcbiAgdGl0bGUgPSBnZXRTZXR0aW5nVGl0bGUoa2V5UGF0aCwgbmFtZSlcbiAgZGVzY3JpcHRpb24gPSBnZXRTZXR0aW5nRGVzY3JpcHRpb24oa2V5UGF0aClcblxuICBAbGFiZWwgY2xhc3M6ICdjb250cm9sLWxhYmVsJywgPT5cbiAgICBAZGl2IGNsYXNzOiAnc2V0dGluZy10aXRsZScsIHRpdGxlXG4gICAgQGRpdiBjbGFzczogJ3NldHRpbmctZGVzY3JpcHRpb24nLCA9PlxuICAgICAgQHJhdyhkZXNjcmlwdGlvbilcblxuICBAZGl2IGNsYXNzOiAnY29udHJvbHMnLCA9PlxuICAgIEBkaXYgY2xhc3M6ICdlZGl0b3ItY29udGFpbmVyJywgPT5cbiAgICAgIEBzdWJ2aWV3IGtleVBhdGgucmVwbGFjZSgvXFwuL2csICcnKSwgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUsIGF0dHJpYnV0ZXM6IHtpZDoga2V5UGF0aCwgdHlwZTogJ2FycmF5J30pXG5cbmFwcGVuZE9iamVjdCA9IChuYW1lc3BhY2UsIG5hbWUsIHZhbHVlKSAtPlxuICByZXR1cm4gdW5sZXNzIF8ua2V5cyh2YWx1ZSkubGVuZ3RoXG5cbiAga2V5UGF0aCA9IFwiI3tuYW1lc3BhY2V9LiN7bmFtZX1cIlxuICB0aXRsZSA9IGdldFNldHRpbmdUaXRsZShrZXlQYXRoLCBuYW1lKVxuICBzY2hlbWEgPSBhdG9tLmNvbmZpZy5nZXRTY2hlbWEoa2V5UGF0aClcbiAgaXNDb2xsYXBzZWQgPSBzY2hlbWEuY29sbGFwc2VkIGlzIHRydWVcbiAgQHNlY3Rpb24gY2xhc3M6IFwic3ViLXNlY3Rpb24je2lmIGlzQ29sbGFwc2VkIHRoZW4gJyBjb2xsYXBzZWQnIGVsc2UgJyd9XCIsID0+XG4gICAgQGgzIGNsYXNzOiAnc3ViLXNlY3Rpb24taGVhZGluZyBoYXMtaXRlbXMnLCA9PlxuICAgICAgQHRleHQgdGl0bGVcbiAgICBAZGl2IGNsYXNzOiAnc3ViLXNlY3Rpb24tYm9keScsID0+XG4gICAgICBzb3J0ZWRTZXR0aW5ncyA9IHNvcnRTZXR0aW5ncyhrZXlQYXRoLCB2YWx1ZSlcbiAgICAgIGZvciBrZXkgaW4gc29ydGVkU2V0dGluZ3NcbiAgICAgICAgYXBwZW5kU2V0dGluZy5jYWxsKHRoaXMsIG5hbWVzcGFjZSwgXCIje25hbWV9LiN7a2V5fVwiLCB2YWx1ZVtrZXldKVxuIl19
