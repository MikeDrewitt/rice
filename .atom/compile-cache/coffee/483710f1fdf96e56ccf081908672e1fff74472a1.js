(function() {
  var CompositeDisposable, PackageCard, View, _, marked, ownerFromRepository, shell,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  View = require('atom-space-pen-views').View;

  CompositeDisposable = require('atom').CompositeDisposable;

  shell = require('electron').shell;

  marked = null;

  ownerFromRepository = require('./utils').ownerFromRepository;

  module.exports = PackageCard = (function(superClass) {
    extend(PackageCard, superClass);

    function PackageCard() {
      return PackageCard.__super__.constructor.apply(this, arguments);
    }

    PackageCard.content = function(arg) {
      var description, displayName, gitUrlInfo, name, owner, ref, repository, version;
      name = arg.name, description = arg.description, version = arg.version, repository = arg.repository, gitUrlInfo = arg.gitUrlInfo;
      displayName = (ref = (gitUrlInfo ? gitUrlInfo.project : name)) != null ? ref : '';
      owner = ownerFromRepository(repository);
      if (description == null) {
        description = '';
      }
      return this.div({
        "class": 'package-card col-lg-8'
      }, (function(_this) {
        return function() {
          _this.div({
            outlet: 'statsContainer',
            "class": 'stats pull-right'
          }, function() {
            _this.span({
              outlet: 'packageStars',
              "class": 'stats-item'
            }, function() {
              _this.span({
                outlet: 'stargazerIcon',
                "class": 'icon icon-star'
              });
              return _this.span({
                outlet: 'stargazerCount',
                "class": 'value'
              });
            });
            return _this.span({
              outlet: 'packageDownloads',
              "class": 'stats-item'
            }, function() {
              _this.span({
                outlet: 'downloadIcon',
                "class": 'icon icon-cloud-download'
              });
              return _this.span({
                outlet: 'downloadCount',
                "class": 'value'
              });
            });
          });
          _this.div({
            "class": 'body'
          }, function() {
            _this.h4({
              "class": 'card-name'
            }, function() {
              _this.a({
                "class": 'package-name',
                outlet: 'packageName'
              }, displayName);
              _this.span(' ');
              _this.span({
                "class": 'package-version'
              }, function() {
                return _this.span({
                  outlet: 'versionValue',
                  "class": 'value'
                }, String(version));
              });
              return _this.span({
                "class": 'deprecation-badge highlight-warning inline-block'
              }, 'Deprecated');
            });
            _this.span({
              outlet: 'packageDescription',
              "class": 'package-description'
            }, description);
            return _this.div({
              outlet: 'packageMessage',
              "class": 'package-message'
            });
          });
          return _this.div({
            "class": 'meta'
          }, function() {
            _this.div({
              outlet: 'metaUserContainer',
              "class": 'meta-user'
            }, function() {
              _this.a({
                outlet: 'avatarLink',
                href: "https://atom.io/users/" + owner
              }, function() {
                return _this.img({
                  outlet: 'avatar',
                  "class": 'avatar',
                  src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                });
              });
              return _this.a({
                outlet: 'loginLink',
                "class": 'author',
                href: "https://atom.io/users/" + owner
              }, owner);
            });
            return _this.div({
              "class": 'meta-controls'
            }, function() {
              return _this.div({
                "class": 'btn-toolbar'
              }, function() {
                _this.div({
                  outlet: 'updateButtonGroup',
                  "class": 'btn-group'
                }, function() {
                  return _this.button({
                    type: 'button',
                    "class": 'btn btn-info icon icon-cloud-download install-button',
                    outlet: 'updateButton'
                  }, 'Update');
                });
                _this.div({
                  outlet: 'installAlternativeButtonGroup',
                  "class": 'btn-group'
                }, function() {
                  return _this.button({
                    type: 'button',
                    "class": 'btn btn-info icon icon-cloud-download install-button',
                    outlet: 'installAlternativeButton'
                  }, 'Install Alternative');
                });
                _this.div({
                  outlet: 'installButtonGroup',
                  "class": 'btn-group'
                }, function() {
                  return _this.button({
                    type: 'button',
                    "class": 'btn btn-info icon icon-cloud-download install-button',
                    outlet: 'installButton'
                  }, 'Install');
                });
                return _this.div({
                  outlet: 'packageActionButtonGroup',
                  "class": 'btn-group'
                }, function() {
                  _this.button({
                    type: 'button',
                    "class": 'btn icon icon-gear settings',
                    outlet: 'settingsButton'
                  }, 'Settings');
                  _this.button({
                    type: 'button',
                    "class": 'btn icon icon-trashcan uninstall-button',
                    outlet: 'uninstallButton'
                  }, 'Uninstall');
                  _this.button({
                    type: 'button',
                    "class": 'btn icon icon-playback-pause enablement',
                    outlet: 'enablementButton'
                  }, function() {
                    return _this.span({
                      "class": 'disable-text'
                    }, 'Disable');
                  });
                  return _this.button({
                    type: 'button',
                    "class": 'btn status-indicator',
                    tabindex: -1,
                    outlet: 'statusIndicator'
                  });
                });
              });
            });
          });
        };
      })(this));
    };

    PackageCard.prototype.initialize = function(pack1, packageManager, options) {
      var ref;
      this.pack = pack1;
      this.packageManager = packageManager;
      if (options == null) {
        options = {};
      }
      this.disposables = new CompositeDisposable();
      this.client = this.packageManager.getClient();
      this.type = this.pack.theme ? 'theme' : 'package';
      this.name = this.pack.name;
      this.onSettingsView = options != null ? options.onSettingsView : void 0;
      if (this.pack.latestVersion !== this.pack.version) {
        this.newVersion = this.pack.latestVersion;
      }
      if (((ref = this.pack.apmInstallSource) != null ? ref.type : void 0) === 'git') {
        if (this.pack.apmInstallSource.sha !== this.pack.latestSha) {
          this.newSha = this.pack.latestSha;
        }
      }
      if (!(options != null ? options.stats : void 0)) {
        options.stats = {
          downloads: true
        };
      }
      this.displayStats(options);
      this.handlePackageEvents();
      this.handleButtonEvents(options);
      this.loadCachedMetadata();
      this.packageMessage.on('click', 'a', function() {
        var href;
        href = this.getAttribute('href');
        if (href != null ? href.startsWith('atom:') : void 0) {
          atom.workspace.open(href);
          return false;
        }
      });
      if (this.type === 'theme') {
        this.statusIndicator.remove();
        this.enablementButton.remove();
      }
      if (atom.packages.isBundledPackage(this.pack.name)) {
        this.installButtonGroup.remove();
        this.uninstallButton.remove();
      }
      if (!(this.newVersion || this.newSha)) {
        this.updateButtonGroup.hide();
      }
      this.hasCompatibleVersion = true;
      if (!this.isInstalled()) {
        this.updateForUninstalledCommunityPackage();
      }
      return this.updateInterfaceState();
    };

    PackageCard.prototype.updateForUninstalledCommunityPackage = function() {
      var atomVersion;
      this.uninstallButton.hide();
      atomVersion = this.packageManager.normalizeVersion(atom.getVersion());
      if (!this.packageManager.satisfiesVersion(atomVersion, this.pack)) {
        return this.packageManager.loadCompatiblePackageVersion(this.pack.name, (function(_this) {
          return function(err, pack) {
            var packageVersion;
            if (err != null) {
              return console.error(err);
            }
            packageVersion = pack.version;
            if (packageVersion) {
              _this.versionValue.text(packageVersion);
              if (packageVersion !== _this.pack.version) {
                _this.versionValue.addClass('text-warning');
                _this.packageMessage.addClass('text-warning');
                _this.packageMessage.text("Version " + packageVersion + " is not the latest version available for this package, but it's the latest that is compatible with your version of Atom.");
              }
              return _this.installablePack = pack;
            } else {
              _this.hasCompatibleVersion = false;
              _this.installButtonGroup.hide();
              _this.versionValue.addClass('text-error');
              _this.packageMessage.addClass('text-error');
              _this.packageMessage.append("There's no version of this package that is compatible with your Atom version. The version must satisfy " + _this.pack.engines.atom + ".");
              return console.error("No available version compatible with the installed Atom version: " + (atom.getVersion()));
            }
          };
        })(this));
      }
    };

    PackageCard.prototype.handleButtonEvents = function(options) {
      if (options != null ? options.onSettingsView : void 0) {
        this.settingsButton.hide();
      } else {
        this.on('click', (function(_this) {
          return function() {
            var ref;
            return (ref = _this.parents('.settings-view').view()) != null ? ref.showPanel(_this.pack.name, {
              back: options != null ? options.back : void 0,
              pack: _this.pack
            }) : void 0;
          };
        })(this));
        this.settingsButton.on('click', (function(_this) {
          return function(event) {
            var ref;
            event.stopPropagation();
            return (ref = _this.parents('.settings-view').view()) != null ? ref.showPanel(_this.pack.name, {
              back: options != null ? options.back : void 0,
              pack: _this.pack
            }) : void 0;
          };
        })(this));
      }
      this.installButton.on('click', (function(_this) {
        return function(event) {
          event.stopPropagation();
          return _this.install();
        };
      })(this));
      this.uninstallButton.on('click', (function(_this) {
        return function(event) {
          event.stopPropagation();
          return _this.uninstall();
        };
      })(this));
      this.installAlternativeButton.on('click', (function(_this) {
        return function(event) {
          event.stopPropagation();
          return _this.installAlternative();
        };
      })(this));
      this.updateButton.on('click', (function(_this) {
        return function(event) {
          event.stopPropagation();
          return _this.update().then(function() {
            var buttons;
            buttons = [];
            if (atom.restartApplication != null) {
              buttons.push({
                text: 'Restart',
                onDidClick: function() {
                  return atom.restartApplication();
                }
              });
            }
            return atom.notifications.addSuccess("Restart Atom to complete the update of `" + _this.pack.name + "`.", {
              dismissable: true,
              buttons: buttons
            });
          });
        };
      })(this));
      this.packageName.on('click', (function(_this) {
        return function(event) {
          var packageType;
          event.stopPropagation();
          packageType = _this.pack.theme ? 'themes' : 'packages';
          return shell.openExternal("https://atom.io/" + packageType + "/" + _this.pack.name);
        };
      })(this));
      return this.enablementButton.on('click', (function(_this) {
        return function() {
          if (_this.isDisabled()) {
            atom.packages.enablePackage(_this.pack.name);
          } else {
            atom.packages.disablePackage(_this.pack.name);
          }
          return false;
        };
      })(this));
    };

    PackageCard.prototype.dispose = function() {
      return this.disposables.dispose();
    };

    PackageCard.prototype.loadCachedMetadata = function() {
      this.client.avatar(ownerFromRepository(this.pack.repository), (function(_this) {
        return function(err, avatarPath) {
          if (avatarPath) {
            return _this.avatar.attr('src', "file://" + avatarPath);
          }
        };
      })(this));
      return this.client["package"](this.pack.name, (function(_this) {
        return function(err, data) {
          var ref, ref1, ref2;
          if (!err) {
            if (data == null) {
              data = {};
            }
            if (((ref = _this.pack.apmInstallSource) != null ? ref.type : void 0) === 'git') {
              _this.downloadIcon.removeClass('icon-cloud-download');
              _this.downloadIcon.addClass('icon-git-branch');
              return _this.downloadCount.text(_this.pack.apmInstallSource.sha.substr(0, 8));
            } else {
              _this.stargazerCount.text((ref1 = data.stargazers_count) != null ? ref1.toLocaleString() : void 0);
              return _this.downloadCount.text((ref2 = data.downloads) != null ? ref2.toLocaleString() : void 0);
            }
          }
        };
      })(this));
    };

    PackageCard.prototype.updateInterfaceState = function() {
      var ref, ref1, ref2;
      this.versionValue.text((ref = (ref1 = this.installablePack) != null ? ref1.version : void 0) != null ? ref : this.pack.version);
      if (((ref2 = this.pack.apmInstallSource) != null ? ref2.type : void 0) === 'git') {
        this.downloadCount.text(this.pack.apmInstallSource.sha.substr(0, 8));
      }
      this.updateSettingsState();
      this.updateInstalledState();
      this.updateDisabledState();
      return this.updateDeprecatedState();
    };

    PackageCard.prototype.updateSettingsState = function() {
      if (this.hasSettings() && !this.onSettingsView) {
        return this.settingsButton.show();
      } else {
        return this.settingsButton.hide();
      }
    };

    PackageCard.prototype.updateDisabledState = function() {
      if (this.isDisabled()) {
        return this.displayDisabledState();
      } else if (this.hasClass('disabled')) {
        return this.displayEnabledState();
      }
    };

    PackageCard.prototype.displayEnabledState = function() {
      this.removeClass('disabled');
      if (this.type === 'theme') {
        this.enablementButton.hide();
      }
      this.enablementButton.find('.disable-text').text('Disable');
      this.enablementButton.addClass('icon-playback-pause').removeClass('icon-playback-play');
      return this.statusIndicator.removeClass('is-disabled');
    };

    PackageCard.prototype.displayDisabledState = function() {
      this.addClass('disabled');
      this.enablementButton.find('.disable-text').text('Enable');
      this.enablementButton.addClass('icon-playback-play').removeClass('icon-playback-pause');
      this.statusIndicator.addClass('is-disabled');
      if (this.isDeprecated()) {
        return this.enablementButton.prop('disabled', true);
      } else {
        return this.enablementButton.prop('disabled', false);
      }
    };

    PackageCard.prototype.updateInstalledState = function() {
      if (this.isInstalled()) {
        return this.displayInstalledState();
      } else {
        return this.displayNotInstalledState();
      }
    };

    PackageCard.prototype.displayInstalledState = function() {
      if (this.newVersion || this.newSha) {
        this.updateButtonGroup.show();
        if (this.newVersion) {
          this.updateButton.text("Update to " + this.newVersion);
        } else if (this.newSha) {
          this.updateButton.text("Update to " + (this.newSha.substr(0, 8)));
        }
      } else {
        this.updateButtonGroup.hide();
      }
      this.installButtonGroup.hide();
      this.installAlternativeButtonGroup.hide();
      this.packageActionButtonGroup.show();
      return this.uninstallButton.show();
    };

    PackageCard.prototype.displayNotInstalledState = function() {
      if (!this.hasCompatibleVersion) {
        this.installButtonGroup.hide();
        this.updateButtonGroup.hide();
      } else if (this.newVersion || this.newSha) {
        this.updateButtonGroup.show();
        this.installButtonGroup.hide();
      } else {
        this.updateButtonGroup.hide();
        this.installButtonGroup.show();
      }
      this.installAlternativeButtonGroup.hide();
      return this.packageActionButtonGroup.hide();
    };

    PackageCard.prototype.updateDeprecatedState = function() {
      if (this.isDeprecated()) {
        return this.displayDeprecatedState();
      } else if (this.hasClass('deprecated')) {
        return this.displayUndeprecatedState();
      }
    };

    PackageCard.prototype.displayStats = function(options) {
      var ref, ref1;
      if (options != null ? (ref = options.stats) != null ? ref.downloads : void 0 : void 0) {
        this.packageDownloads.show();
      } else {
        this.packageDownloads.hide();
      }
      if (options != null ? (ref1 = options.stats) != null ? ref1.stars : void 0 : void 0) {
        return this.packageStars.show();
      } else {
        return this.packageStars.hide();
      }
    };

    PackageCard.prototype.displayUndeprecatedState = function() {
      this.removeClass('deprecated');
      this.packageMessage.removeClass('text-warning');
      return this.packageMessage.text('');
    };

    PackageCard.prototype.displayDeprecatedState = function() {
      var alt, info, isInstalled, message, ref;
      this.addClass('deprecated');
      this.settingsButton[0].disabled = true;
      info = this.getDeprecatedPackageMetadata();
      this.packageMessage.addClass('text-warning');
      message = null;
      if (info != null ? info.hasDeprecations : void 0) {
        message = this.getDeprecationMessage(this.newVersion);
      } else if ((info != null ? info.hasAlternative : void 0) && (info != null ? info.alternative : void 0) && (info != null ? info.alternative : void 0) === 'core') {
        message = (ref = info.message) != null ? ref : "The features in `" + this.pack.name + "` have been added to core.";
        message += ' Please uninstall this package.';
        this.settingsButton.remove();
        this.enablementButton.remove();
      } else if ((info != null ? info.hasAlternative : void 0) && (alt = info != null ? info.alternative : void 0)) {
        isInstalled = this.isInstalled();
        if (isInstalled && this.packageManager.isPackageInstalled(alt)) {
          message = "`" + this.pack.name + "` has been replaced by `" + alt + "` which is already installed. Please uninstall this package.";
          this.settingsButton.remove();
          this.enablementButton.remove();
        } else if (isInstalled) {
          message = "`" + this.pack.name + "` has been replaced by [`" + alt + "`](atom://config/install/package:" + alt + ").";
          this.installAlternativeButton.text("Install " + alt);
          this.installAlternativeButtonGroup.show();
          this.packageActionButtonGroup.show();
          this.settingsButton.remove();
          this.enablementButton.remove();
        } else {
          message = "`" + this.pack.name + "` has been replaced by [`" + alt + "`](atom://config/install/package:" + alt + ").";
          this.installButtonGroup.hide();
          this.installAlternativeButtonGroup.hide();
          this.packageActionButtonGroup.hide();
        }
      }
      if (message != null) {
        if (marked == null) {
          marked = require('marked');
        }
        return this.packageMessage.html(marked(message));
      }
    };

    PackageCard.prototype.displayGitPackageInstallInformation = function() {
      var gitUrlInfo;
      this.metaUserContainer.remove();
      this.statsContainer.remove();
      gitUrlInfo = this.pack.gitUrlInfo;
      if (gitUrlInfo["default"] === 'shortcut') {
        this.packageDescription.text(gitUrlInfo.https());
      } else {
        this.packageDescription.text(gitUrlInfo.toString());
      }
      this.installButton.removeClass('icon-cloud-download');
      this.installButton.addClass('icon-git-commit');
      this.updateButton.removeClass('icon-cloud-download');
      return this.updateButton.addClass('icon-git-commit');
    };

    PackageCard.prototype.displayAvailableUpdate = function(newVersion1) {
      this.newVersion = newVersion1;
      return this.updateInterfaceState();
    };

    PackageCard.prototype.getDeprecationMessage = function(newVersion) {
      var info, ref;
      info = this.getDeprecatedPackageMetadata();
      if (!(info != null ? info.hasDeprecations : void 0)) {
        return;
      }
      if (newVersion) {
        if (this.isDeprecated(newVersion)) {
          return "An update to `v" + newVersion + "` is available but still contains deprecations.";
        } else {
          return "An update to `v" + newVersion + "` is available without deprecations.";
        }
      } else {
        if (this.isInstalled()) {
          return (ref = info.message) != null ? ref : 'This package has not been loaded due to using deprecated APIs. There is no update available.';
        } else {
          return 'This package has deprecations and is not installable.';
        }
      }
    };

    PackageCard.prototype.handlePackageEvents = function() {
      this.disposables.add(atom.packages.onDidDeactivatePackage((function(_this) {
        return function(pack) {
          if (pack.name === _this.pack.name) {
            return _this.updateDisabledState();
          }
        };
      })(this)));
      this.disposables.add(atom.packages.onDidActivatePackage((function(_this) {
        return function(pack) {
          if (pack.name === _this.pack.name) {
            return _this.updateDisabledState();
          }
        };
      })(this)));
      this.disposables.add(atom.config.onDidChange('core.disabledPackages', (function(_this) {
        return function() {
          return _this.updateDisabledState();
        };
      })(this)));
      this.subscribeToPackageEvent('package-installing theme-installing', (function(_this) {
        return function() {
          _this.updateInterfaceState();
          _this.installButton.prop('disabled', true);
          return _this.installButton.addClass('is-installing');
        };
      })(this));
      this.subscribeToPackageEvent('package-updating theme-updating', (function(_this) {
        return function() {
          _this.updateInterfaceState();
          _this.updateButton.prop('disabled', true);
          return _this.updateButton.addClass('is-installing');
        };
      })(this));
      this.subscribeToPackageEvent('package-installing-alternative', (function(_this) {
        return function() {
          _this.updateInterfaceState();
          _this.installAlternativeButton.prop('disabled', true);
          return _this.installAlternativeButton.addClass('is-installing');
        };
      })(this));
      this.subscribeToPackageEvent('package-uninstalling theme-uninstalling', (function(_this) {
        return function() {
          _this.updateInterfaceState();
          _this.enablementButton.prop('disabled', true);
          _this.uninstallButton.prop('disabled', true);
          return _this.uninstallButton.addClass('is-uninstalling');
        };
      })(this));
      this.subscribeToPackageEvent('package-installed package-install-failed theme-installed theme-install-failed', (function(_this) {
        return function() {
          var ref, ref1, version;
          if (version = (ref = atom.packages.getLoadedPackage(_this.pack.name)) != null ? (ref1 = ref.metadata) != null ? ref1.version : void 0 : void 0) {
            _this.pack.version = version;
          }
          _this.installButton.prop('disabled', false);
          _this.installButton.removeClass('is-installing');
          return _this.updateInterfaceState();
        };
      })(this));
      this.subscribeToPackageEvent('package-updated theme-updated package-update-failed theme-update-failed', (function(_this) {
        return function() {
          var apmInstallSource, metadata, ref, version;
          metadata = (ref = atom.packages.getLoadedPackage(_this.pack.name)) != null ? ref.metadata : void 0;
          if (version = metadata != null ? metadata.version : void 0) {
            _this.pack.version = version;
          }
          if (apmInstallSource = metadata != null ? metadata.apmInstallSource : void 0) {
            _this.pack.apmInstallSource = apmInstallSource;
          }
          _this.newVersion = null;
          _this.newSha = null;
          _this.updateButton.prop('disabled', false);
          _this.updateButton.removeClass('is-installing');
          return _this.updateInterfaceState();
        };
      })(this));
      this.subscribeToPackageEvent('package-uninstalled package-uninstall-failed theme-uninstalled theme-uninstall-failed', (function(_this) {
        return function() {
          _this.newVersion = null;
          _this.newSha = null;
          _this.enablementButton.prop('disabled', false);
          _this.uninstallButton.prop('disabled', false);
          _this.uninstallButton.removeClass('is-uninstalling');
          return _this.updateInterfaceState();
        };
      })(this));
      return this.subscribeToPackageEvent('package-installed-alternative package-install-alternative-failed', (function(_this) {
        return function() {
          _this.installAlternativeButton.prop('disabled', false);
          _this.installAlternativeButton.removeClass('is-installing');
          return _this.updateInterfaceState();
        };
      })(this));
    };

    PackageCard.prototype.isInstalled = function() {
      return this.packageManager.isPackageInstalled(this.pack.name);
    };

    PackageCard.prototype.isDisabled = function() {
      return atom.packages.isPackageDisabled(this.pack.name);
    };

    PackageCard.prototype.isDeprecated = function(version) {
      return atom.packages.isDeprecatedPackage(this.pack.name, version != null ? version : this.pack.version);
    };

    PackageCard.prototype.getDeprecatedPackageMetadata = function() {
      return atom.packages.getDeprecatedPackageMetadata(this.pack.name);
    };

    PackageCard.prototype.hasSettings = function() {
      return this.packageManager.packageHasSettings(this.pack.name);
    };

    PackageCard.prototype.subscribeToPackageEvent = function(event, callback) {
      return this.disposables.add(this.packageManager.on(event, (function(_this) {
        return function(arg) {
          var error, pack, packageName;
          pack = arg.pack, error = arg.error;
          if (pack.pack != null) {
            pack = pack.pack;
          }
          packageName = pack.name;
          if (packageName === _this.pack.name) {
            return callback(pack, error);
          }
        };
      })(this)));
    };


    /*
    Section: Methods that should be on a Package model
     */

    PackageCard.prototype.install = function() {
      var ref;
      return this.packageManager.install((ref = this.installablePack) != null ? ref : this.pack, (function(_this) {
        return function(error) {
          var ref1;
          if (error != null) {
            return console.error("Installing " + _this.type + " " + _this.pack.name + " failed", (ref1 = error.stack) != null ? ref1 : error, error.stderr);
          } else {
            if (_this.isDisabled()) {
              return atom.packages.enablePackage(_this.pack.name);
            }
          }
        };
      })(this));
    };

    PackageCard.prototype.update = function() {
      var pack, ref, version;
      if (!(this.newVersion || this.newSha)) {
        return;
      }
      pack = (ref = this.installablePack) != null ? ref : this.pack;
      version = this.newVersion ? "v" + this.newVersion : "#" + (this.newSha.substr(0, 8));
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.packageManager.update(pack, _this.newVersion, function(error) {
            var ref1;
            if (error != null) {
              atom.assert(false, "Package update failed", function(assertionError) {
                return assertionError.metadata = {
                  type: _this.type,
                  name: pack.name,
                  version: version,
                  errorMessage: error.message,
                  errorStack: error.stack,
                  errorStderr: error.stderr
                };
              });
              console.error("Updating " + _this.type + " " + pack.name + " to " + version + " failed:\n", error, (ref1 = error.stderr) != null ? ref1 : '');
              return reject(error);
            } else {
              return resolve();
            }
          });
        };
      })(this));
    };

    PackageCard.prototype.uninstall = function() {
      return this.packageManager.uninstall(this.pack, (function(_this) {
        return function(error) {
          var ref;
          if (error != null) {
            return console.error("Uninstalling " + _this.type + " " + _this.pack.name + " failed", (ref = error.stack) != null ? ref : error, error.stderr);
          }
        };
      })(this));
    };

    PackageCard.prototype.installAlternative = function() {
      var alternative, loadedPack, metadata;
      metadata = this.getDeprecatedPackageMetadata();
      loadedPack = atom.packages.getLoadedPackage(metadata != null ? metadata.alternative : void 0);
      if (!((metadata != null ? metadata.hasAlternative : void 0) && metadata.alternative !== 'core' && !loadedPack)) {
        return;
      }
      alternative = metadata.alternative;
      return this.packageManager.installAlternative(this.pack, alternative, (function(_this) {
        return function(error, arg) {
          var alternative, pack, ref;
          pack = arg.pack, alternative = arg.alternative;
          if (error != null) {
            return console.error("Installing alternative `" + alternative + "` " + _this.type + " for " + _this.pack.name + " failed", (ref = error.stack) != null ? ref : error, error.stderr);
          }
        };
      })(this));
    };

    return PackageCard;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3RtcC95YW91cnQtdG1wLW1pY2hhZWwvYXVyLWF0b20tZWRpdG9yLWdpdC9zcmMvYXRvbS9vdXQvYXBwL25vZGVfbW9kdWxlcy9zZXR0aW5ncy12aWV3L2xpYi9wYWNrYWdlLWNhcmQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2RUFBQTtJQUFBOzs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILE9BQVEsT0FBQSxDQUFRLHNCQUFSOztFQUNSLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDdkIsUUFBUyxPQUFBLENBQVEsVUFBUjs7RUFDVixNQUFBLEdBQVM7O0VBQ1Isc0JBQXVCLE9BQUEsQ0FBUSxTQUFSOztFQUV4QixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBRUosV0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEdBQUQ7QUFDUixVQUFBO01BRFUsaUJBQU0sK0JBQWEsdUJBQVMsNkJBQVk7TUFDbEQsV0FBQSxvRUFBa0U7TUFDbEUsS0FBQSxHQUFRLG1CQUFBLENBQW9CLFVBQXBCOztRQUNSLGNBQWU7O2FBRWYsSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sdUJBQVA7T0FBTCxFQUFxQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDbkMsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLE1BQUEsRUFBUSxnQkFBUjtZQUEwQixDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFqQztXQUFMLEVBQTBELFNBQUE7WUFDeEQsS0FBQyxDQUFBLElBQUQsQ0FBTTtjQUFBLE1BQUEsRUFBUSxjQUFSO2NBQXdCLENBQUEsS0FBQSxDQUFBLEVBQU8sWUFBL0I7YUFBTixFQUFtRCxTQUFBO2NBQ2pELEtBQUMsQ0FBQSxJQUFELENBQU07Z0JBQUEsTUFBQSxFQUFRLGVBQVI7Z0JBQXlCLENBQUEsS0FBQSxDQUFBLEVBQU8s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QXpDO01BQ2IsSUFBQSxDQUFBLHFCQUFjLFFBQVEsQ0FBRSx3QkFBVixJQUE2QixRQUFRLENBQUMsV0FBVCxLQUEwQixNQUF2RCxJQUFrRSxDQUFJLFVBQXBGLENBQUE7QUFBQSxlQUFBOztNQUVDLGNBQWU7YUFDaEIsSUFBQyxDQUFBLGNBQWMsQ0FBQyxrQkFBaEIsQ0FBbUMsSUFBQyxDQUFBLElBQXBDLEVBQTBDLFdBQTFDLEVBQXVELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFELEVBQVEsR0FBUjtBQUNyRCxjQUFBO1VBRDhELGlCQUFNO1VBQ3BFLElBQUcsYUFBSDttQkFDRSxPQUFPLENBQUMsS0FBUixDQUFjLDBCQUFBLEdBQTJCLFdBQTNCLEdBQXVDLElBQXZDLEdBQTJDLEtBQUMsQ0FBQSxJQUE1QyxHQUFpRCxPQUFqRCxHQUF3RCxLQUFDLENBQUEsSUFBSSxDQUFDLElBQTlELEdBQW1FLFNBQWpGLHNDQUF5RyxLQUF6RyxFQUFnSCxLQUFLLENBQUMsTUFBdEgsRUFERjs7UUFEcUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXZEO0lBTmtCOzs7O0tBaGZJO0FBUjFCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntWaWV3fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntzaGVsbH0gPSByZXF1aXJlICdlbGVjdHJvbidcbm1hcmtlZCA9IG51bGxcbntvd25lckZyb21SZXBvc2l0b3J5fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhY2thZ2VDYXJkIGV4dGVuZHMgVmlld1xuXG4gIEBjb250ZW50OiAoe25hbWUsIGRlc2NyaXB0aW9uLCB2ZXJzaW9uLCByZXBvc2l0b3J5LCBnaXRVcmxJbmZvfSkgLT5cbiAgICBkaXNwbGF5TmFtZSA9IChpZiBnaXRVcmxJbmZvIHRoZW4gZ2l0VXJsSW5mby5wcm9qZWN0IGVsc2UgbmFtZSkgPyAnJ1xuICAgIG93bmVyID0gb3duZXJGcm9tUmVwb3NpdG9yeShyZXBvc2l0b3J5KVxuICAgIGRlc2NyaXB0aW9uID89ICcnXG5cbiAgICBAZGl2IGNsYXNzOiAncGFja2FnZS1jYXJkIGNvbC1sZy04JywgPT5cbiAgICAgIEBkaXYgb3V0bGV0OiAnc3RhdHNDb250YWluZXInLCBjbGFzczogJ3N0YXRzIHB1bGwtcmlnaHQnLCA9PlxuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdwYWNrYWdlU3RhcnMnLCBjbGFzczogJ3N0YXRzLWl0ZW0nLCA9PlxuICAgICAgICAgIEBzcGFuIG91dGxldDogJ3N0YXJnYXplckljb24nLCBjbGFzczogJ2ljb24gaWNvbi1zdGFyJ1xuICAgICAgICAgIEBzcGFuIG91dGxldDogJ3N0YXJnYXplckNvdW50JywgY2xhc3M6ICd2YWx1ZSdcblxuICAgICAgICBAc3BhbiBvdXRsZXQ6ICdwYWNrYWdlRG93bmxvYWRzJywgY2xhc3M6ICdzdGF0cy1pdGVtJywgPT5cbiAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkb3dubG9hZEljb24nLCBjbGFzczogJ2ljb24gaWNvbi1jbG91ZC1kb3dubG9hZCdcbiAgICAgICAgICBAc3BhbiBvdXRsZXQ6ICdkb3dubG9hZENvdW50JywgY2xhc3M6ICd2YWx1ZSdcblxuICAgICAgQGRpdiBjbGFzczogJ2JvZHknLCA9PlxuICAgICAgICBAaDQgY2xhc3M6ICdjYXJkLW5hbWUnLCA9PlxuICAgICAgICAgIEBhIGNsYXNzOiAncGFja2FnZS1uYW1lJywgb3V0bGV0OiAncGFja2FnZU5hbWUnLCBkaXNwbGF5TmFtZVxuICAgICAgICAgIEBzcGFuICcgJ1xuICAgICAgICAgIEBzcGFuIGNsYXNzOiAncGFja2FnZS12ZXJzaW9uJywgPT5cbiAgICAgICAgICAgIEBzcGFuIG91dGxldDogJ3ZlcnNpb25WYWx1ZScsIGNsYXNzOiAndmFsdWUnLCBTdHJpbmcodmVyc2lvbilcblxuICAgICAgICAgIEBzcGFuIGNsYXNzOiAnZGVwcmVjYXRpb24tYmFkZ2UgaGlnaGxpZ2h0LXdhcm5pbmcgaW5saW5lLWJsb2NrJywgJ0RlcHJlY2F0ZWQnXG4gICAgICAgIEBzcGFuIG91dGxldDogJ3BhY2thZ2VEZXNjcmlwdGlvbicsIGNsYXNzOiAncGFja2FnZS1kZXNjcmlwdGlvbicsIGRlc2NyaXB0aW9uXG4gICAgICAgIEBkaXYgb3V0bGV0OiAncGFja2FnZU1lc3NhZ2UnLCBjbGFzczogJ3BhY2thZ2UtbWVzc2FnZSdcblxuICAgICAgQGRpdiBjbGFzczogJ21ldGEnLCA9PlxuICAgICAgICBAZGl2IG91dGxldDogJ21ldGFVc2VyQ29udGFpbmVyJywgY2xhc3M6ICdtZXRhLXVzZXInLCA9PlxuICAgICAgICAgIEBhIG91dGxldDogJ2F2YXRhckxpbmsnLCBocmVmOiBcImh0dHBzOi8vYXRvbS5pby91c2Vycy8je293bmVyfVwiLCA9PlxuICAgICAgICAgICAgQGltZyBvdXRsZXQ6ICdhdmF0YXInLCBjbGFzczogJ2F2YXRhcicsIHNyYzogJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQUFBQUFQLy8veUg1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlCUkFBNycgIyBBIHRyYW5zcGFyZW50IGdpZiBzbyB0aGVyZSBpcyBubyBcImJyb2tlbiBib3JkZXJcIlxuICAgICAgICAgIEBhIG91dGxldDogJ2xvZ2luTGluaycsIGNsYXNzOiAnYXV0aG9yJywgaHJlZjogXCJodHRwczovL2F0b20uaW8vdXNlcnMvI3tvd25lcn1cIiwgb3duZXJcbiAgICAgICAgQGRpdiBjbGFzczogJ21ldGEtY29udHJvbHMnLCA9PlxuICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tdG9vbGJhcicsID0+XG4gICAgICAgICAgICBAZGl2IG91dGxldDogJ3VwZGF0ZUJ1dHRvbkdyb3VwJywgY2xhc3M6ICdidG4tZ3JvdXAnLCA9PlxuICAgICAgICAgICAgICBAYnV0dG9uIHR5cGU6ICdidXR0b24nLCBjbGFzczogJ2J0biBidG4taW5mbyBpY29uIGljb24tY2xvdWQtZG93bmxvYWQgaW5zdGFsbC1idXR0b24nLCBvdXRsZXQ6ICd1cGRhdGVCdXR0b24nLCAnVXBkYXRlJ1xuICAgICAgICAgICAgQGRpdiBvdXRsZXQ6ICdpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b25Hcm91cCcsIGNsYXNzOiAnYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgQGJ1dHRvbiB0eXBlOiAnYnV0dG9uJywgY2xhc3M6ICdidG4gYnRuLWluZm8gaWNvbiBpY29uLWNsb3VkLWRvd25sb2FkIGluc3RhbGwtYnV0dG9uJywgb3V0bGV0OiAnaW5zdGFsbEFsdGVybmF0aXZlQnV0dG9uJywgJ0luc3RhbGwgQWx0ZXJuYXRpdmUnXG4gICAgICAgICAgICBAZGl2IG91dGxldDogJ2luc3RhbGxCdXR0b25Hcm91cCcsIGNsYXNzOiAnYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgQGJ1dHRvbiB0eXBlOiAnYnV0dG9uJywgY2xhc3M6ICdidG4gYnRuLWluZm8gaWNvbiBpY29uLWNsb3VkLWRvd25sb2FkIGluc3RhbGwtYnV0dG9uJywgb3V0bGV0OiAnaW5zdGFsbEJ1dHRvbicsICdJbnN0YWxsJ1xuICAgICAgICAgICAgQGRpdiBvdXRsZXQ6ICdwYWNrYWdlQWN0aW9uQnV0dG9uR3JvdXAnLCBjbGFzczogJ2J0bi1ncm91cCcsID0+XG4gICAgICAgICAgICAgIEBidXR0b24gdHlwZTogJ2J1dHRvbicsIGNsYXNzOiAnYnRuIGljb24gaWNvbi1nZWFyIHNldHRpbmdzJywgICAgICAgICAgICAgb3V0bGV0OiAnc2V0dGluZ3NCdXR0b24nLCAnU2V0dGluZ3MnXG4gICAgICAgICAgICAgIEBidXR0b24gdHlwZTogJ2J1dHRvbicsIGNsYXNzOiAnYnRuIGljb24gaWNvbi10cmFzaGNhbiB1bmluc3RhbGwtYnV0dG9uJywgb3V0bGV0OiAndW5pbnN0YWxsQnV0dG9uJywgJ1VuaW5zdGFsbCdcbiAgICAgICAgICAgICAgQGJ1dHRvbiB0eXBlOiAnYnV0dG9uJywgY2xhc3M6ICdidG4gaWNvbiBpY29uLXBsYXliYWNrLXBhdXNlIGVuYWJsZW1lbnQnLCBvdXRsZXQ6ICdlbmFibGVtZW50QnV0dG9uJywgPT5cbiAgICAgICAgICAgICAgICBAc3BhbiBjbGFzczogJ2Rpc2FibGUtdGV4dCcsICdEaXNhYmxlJ1xuICAgICAgICAgICAgICBAYnV0dG9uIHR5cGU6ICdidXR0b24nLCBjbGFzczogJ2J0biBzdGF0dXMtaW5kaWNhdG9yJywgdGFiaW5kZXg6IC0xLCBvdXRsZXQ6ICdzdGF0dXNJbmRpY2F0b3InXG5cbiAgaW5pdGlhbGl6ZTogKEBwYWNrLCBAcGFja2FnZU1hbmFnZXIsIG9wdGlvbnM9e30pIC0+XG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgIyBJdCBtaWdodCBiZSB1c2VmdWwgdG8gZWl0aGVyIHdyYXAgQHBhY2sgaW4gYSBjbGFzcyB0aGF0IGhhcyBhIDo6dmFsaWRhdGVcbiAgICAjIG1ldGhvZCwgb3IgYWRkIGEgbWV0aG9kIGhlcmUuIEF0IHRoZSBtb21lbnQgSSB0aGluayBhbGwgY2FzZXMgb2YgbWFsZm9ybWVkXG4gICAgIyBwYWNrYWdlIG1ldGFkYXRhIGFyZSBoYW5kbGVkIGhlcmUgYW5kIGluIDo6Y29udGVudCBidXQgYmVsdCBhbmQgc3VzcGVuZGVycyxcbiAgICAjIHlvdSBrbm93XG4gICAgQGNsaWVudCA9IEBwYWNrYWdlTWFuYWdlci5nZXRDbGllbnQoKVxuXG4gICAgQHR5cGUgPSBpZiBAcGFjay50aGVtZSB0aGVuICd0aGVtZScgZWxzZSAncGFja2FnZSdcblxuICAgIHtAbmFtZX0gPSBAcGFja1xuXG4gICAgQG9uU2V0dGluZ3NWaWV3ID0gb3B0aW9ucz8ub25TZXR0aW5nc1ZpZXdcblxuICAgIEBuZXdWZXJzaW9uID0gQHBhY2subGF0ZXN0VmVyc2lvbiB1bmxlc3MgQHBhY2subGF0ZXN0VmVyc2lvbiBpcyBAcGFjay52ZXJzaW9uXG4gICAgaWYgQHBhY2suYXBtSW5zdGFsbFNvdXJjZT8udHlwZSBpcyAnZ2l0J1xuICAgICAgQG5ld1NoYSA9IEBwYWNrLmxhdGVzdFNoYSB1bmxlc3MgQHBhY2suYXBtSW5zdGFsbFNvdXJjZS5zaGEgaXMgQHBhY2subGF0ZXN0U2hhXG5cbiAgICAjIERlZmF1bHQgdG8gZGlzcGxheWluZyB0aGUgZG93bmxvYWQgY291bnRcbiAgICB1bmxlc3Mgb3B0aW9ucz8uc3RhdHNcbiAgICAgIG9wdGlvbnMuc3RhdHMgPSB7XG4gICAgICAgIGRvd25sb2FkczogdHJ1ZVxuICAgICAgfVxuXG4gICAgQGRpc3BsYXlTdGF0cyhvcHRpb25zKVxuICAgIEBoYW5kbGVQYWNrYWdlRXZlbnRzKClcbiAgICBAaGFuZGxlQnV0dG9uRXZlbnRzKG9wdGlvbnMpXG4gICAgQGxvYWRDYWNoZWRNZXRhZGF0YSgpXG5cbiAgICBAcGFja2FnZU1lc3NhZ2Uub24gJ2NsaWNrJywgJ2EnLCAtPlxuICAgICAgaHJlZiA9IEBnZXRBdHRyaWJ1dGUoJ2hyZWYnKVxuICAgICAgaWYgaHJlZj8uc3RhcnRzV2l0aCgnYXRvbTonKVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGhyZWYpXG4gICAgICAgIGZhbHNlXG5cbiAgICAjIHRoZW1lcyBoYXZlIG5vIHN0YXR1cyBhbmQgY2Fubm90IGJlIGRpcy9lbmFibGVkXG4gICAgaWYgQHR5cGUgaXMgJ3RoZW1lJ1xuICAgICAgQHN0YXR1c0luZGljYXRvci5yZW1vdmUoKVxuICAgICAgQGVuYWJsZW1lbnRCdXR0b24ucmVtb3ZlKClcblxuICAgIGlmIGF0b20ucGFja2FnZXMuaXNCdW5kbGVkUGFja2FnZShAcGFjay5uYW1lKVxuICAgICAgQGluc3RhbGxCdXR0b25Hcm91cC5yZW1vdmUoKVxuICAgICAgQHVuaW5zdGFsbEJ1dHRvbi5yZW1vdmUoKVxuXG4gICAgQHVwZGF0ZUJ1dHRvbkdyb3VwLmhpZGUoKSB1bmxlc3MgQG5ld1ZlcnNpb24gb3IgQG5ld1NoYVxuXG4gICAgQGhhc0NvbXBhdGlibGVWZXJzaW9uID0gdHJ1ZVxuICAgIEB1cGRhdGVGb3JVbmluc3RhbGxlZENvbW11bml0eVBhY2thZ2UoKSB1bmxlc3MgQGlzSW5zdGFsbGVkKClcbiAgICBAdXBkYXRlSW50ZXJmYWNlU3RhdGUoKVxuXG4gIHVwZGF0ZUZvclVuaW5zdGFsbGVkQ29tbXVuaXR5UGFja2FnZTogLT5cbiAgICAjIFRoZSBwYWNrYWdlIGlzIG5vdCBidW5kbGVkIHdpdGggQXRvbSBhbmQgaXMgbm90IGluc3RhbGxlZCBzbyB3ZSdsbCBoYXZlXG4gICAgIyB0byBmaW5kIGEgcGFja2FnZSB2ZXJzaW9uIHRoYXQgaXMgY29tcGF0aWJsZSB3aXRoIHRoaXMgQXRvbSB2ZXJzaW9uLlxuXG4gICAgQHVuaW5zdGFsbEJ1dHRvbi5oaWRlKClcbiAgICBhdG9tVmVyc2lvbiA9IEBwYWNrYWdlTWFuYWdlci5ub3JtYWxpemVWZXJzaW9uKGF0b20uZ2V0VmVyc2lvbigpKVxuICAgICMgVGhlIGxhdGVzdCB2ZXJzaW9uIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggdGhlIGN1cnJlbnQgQXRvbSB2ZXJzaW9uLFxuICAgICMgd2UgbmVlZCB0byBtYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIGxhdGVzdCBjb21wYXRpYmxlIHZlcnNpb24uXG4gICAgdW5sZXNzIEBwYWNrYWdlTWFuYWdlci5zYXRpc2ZpZXNWZXJzaW9uKGF0b21WZXJzaW9uLCBAcGFjaylcbiAgICAgIEBwYWNrYWdlTWFuYWdlci5sb2FkQ29tcGF0aWJsZVBhY2thZ2VWZXJzaW9uIEBwYWNrLm5hbWUsIChlcnIsIHBhY2spID0+XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKGVycikgaWYgZXJyP1xuXG4gICAgICAgIHBhY2thZ2VWZXJzaW9uID0gcGFjay52ZXJzaW9uXG5cbiAgICAgICAgIyBBIGNvbXBhdGlibGUgdmVyc2lvbiBleGlzdCwgd2UgYWN0aXZhdGUgdGhlIGluc3RhbGwgYnV0dG9uIGFuZFxuICAgICAgICAjIHNldCBAaW5zdGFsbGFibGVQYWNrIHNvIHRoYXQgdGhlIGluc3RhbGwgYWN0aW9uIGluc3RhbGxzIHRoZVxuICAgICAgICAjIGNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgcGFja2FnZS5cbiAgICAgICAgaWYgcGFja2FnZVZlcnNpb25cbiAgICAgICAgICBAdmVyc2lvblZhbHVlLnRleHQocGFja2FnZVZlcnNpb24pXG4gICAgICAgICAgaWYgcGFja2FnZVZlcnNpb24gaXNudCBAcGFjay52ZXJzaW9uXG4gICAgICAgICAgICBAdmVyc2lvblZhbHVlLmFkZENsYXNzKCd0ZXh0LXdhcm5pbmcnKVxuICAgICAgICAgICAgQHBhY2thZ2VNZXNzYWdlLmFkZENsYXNzKCd0ZXh0LXdhcm5pbmcnKVxuICAgICAgICAgICAgQHBhY2thZ2VNZXNzYWdlLnRleHQgXCJcIlwiXG4gICAgICAgICAgICBWZXJzaW9uICN7cGFja2FnZVZlcnNpb259IGlzIG5vdCB0aGUgbGF0ZXN0IHZlcnNpb24gYXZhaWxhYmxlIGZvciB0aGlzIHBhY2thZ2UsIGJ1dCBpdCdzIHRoZSBsYXRlc3QgdGhhdCBpcyBjb21wYXRpYmxlIHdpdGggeW91ciB2ZXJzaW9uIG9mIEF0b20uXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICAgIEBpbnN0YWxsYWJsZVBhY2sgPSBwYWNrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaGFzQ29tcGF0aWJsZVZlcnNpb24gPSBmYWxzZVxuICAgICAgICAgIEBpbnN0YWxsQnV0dG9uR3JvdXAuaGlkZSgpXG4gICAgICAgICAgQHZlcnNpb25WYWx1ZS5hZGRDbGFzcygndGV4dC1lcnJvcicpXG4gICAgICAgICAgQHBhY2thZ2VNZXNzYWdlLmFkZENsYXNzKCd0ZXh0LWVycm9yJylcbiAgICAgICAgICBAcGFja2FnZU1lc3NhZ2UuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIFRoZXJlJ3Mgbm8gdmVyc2lvbiBvZiB0aGlzIHBhY2thZ2UgdGhhdCBpcyBjb21wYXRpYmxlIHdpdGggeW91ciBBdG9tIHZlcnNpb24uIFRoZSB2ZXJzaW9uIG11c3Qgc2F0aXNmeSAje0BwYWNrLmVuZ2luZXMuYXRvbX0uXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIGF2YWlsYWJsZSB2ZXJzaW9uIGNvbXBhdGlibGUgd2l0aCB0aGUgaW5zdGFsbGVkIEF0b20gdmVyc2lvbjogI3thdG9tLmdldFZlcnNpb24oKX1cIilcblxuICBoYW5kbGVCdXR0b25FdmVudHM6IChvcHRpb25zKSAtPlxuICAgIGlmIG9wdGlvbnM/Lm9uU2V0dGluZ3NWaWV3XG4gICAgICBAc2V0dGluZ3NCdXR0b24uaGlkZSgpXG4gICAgZWxzZVxuICAgICAgQG9uICdjbGljaycsID0+XG4gICAgICAgIEBwYXJlbnRzKCcuc2V0dGluZ3MtdmlldycpLnZpZXcoKT8uc2hvd1BhbmVsKEBwYWNrLm5hbWUsIHtiYWNrOiBvcHRpb25zPy5iYWNrLCBwYWNrOiBAcGFja30pXG4gICAgICBAc2V0dGluZ3NCdXR0b24ub24gJ2NsaWNrJywgKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBAcGFyZW50cygnLnNldHRpbmdzLXZpZXcnKS52aWV3KCk/LnNob3dQYW5lbChAcGFjay5uYW1lLCB7YmFjazogb3B0aW9ucz8uYmFjaywgcGFjazogQHBhY2t9KVxuXG4gICAgQGluc3RhbGxCdXR0b24ub24gJ2NsaWNrJywgKGV2ZW50KSA9PlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIEBpbnN0YWxsKClcblxuICAgIEB1bmluc3RhbGxCdXR0b24ub24gJ2NsaWNrJywgKGV2ZW50KSA9PlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIEB1bmluc3RhbGwoKVxuXG4gICAgQGluc3RhbGxBbHRlcm5hdGl2ZUJ1dHRvbi5vbiAnY2xpY2snLCAoZXZlbnQpID0+XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgQGluc3RhbGxBbHRlcm5hdGl2ZSgpXG5cbiAgICBAdXBkYXRlQnV0dG9uLm9uICdjbGljaycsIChldmVudCkgPT5cbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICBAdXBkYXRlKCkudGhlbiA9PlxuICAgICAgICBidXR0b25zID0gW11cbiAgICAgICAgIyBUT0RPOiBSZW1vdmUgY29uZGl0aW9uYWwgYWZ0ZXIgMS4xMi4wIGlzIHJlbGVhc2VkIGFzIHN0YWJsZVxuICAgICAgICBpZiBhdG9tLnJlc3RhcnRBcHBsaWNhdGlvbj9cbiAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgdGV4dDogJ1Jlc3RhcnQnLFxuICAgICAgICAgICAgb25EaWRDbGljazogLT4gYXRvbS5yZXN0YXJ0QXBwbGljYXRpb24oKVxuICAgICAgICAgIH0pXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKFwiUmVzdGFydCBBdG9tIHRvIGNvbXBsZXRlIHRoZSB1cGRhdGUgb2YgYCN7QHBhY2submFtZX1gLlwiLCB7XG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsIGJ1dHRvbnM6IGJ1dHRvbnNcbiAgICAgICAgfSlcblxuICAgIEBwYWNrYWdlTmFtZS5vbiAnY2xpY2snLCAoZXZlbnQpID0+XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcGFja2FnZVR5cGUgPSBpZiBAcGFjay50aGVtZSB0aGVuICd0aGVtZXMnIGVsc2UgJ3BhY2thZ2VzJ1xuICAgICAgc2hlbGwub3BlbkV4dGVybmFsKFwiaHR0cHM6Ly9hdG9tLmlvLyN7cGFja2FnZVR5cGV9LyN7QHBhY2submFtZX1cIilcblxuICAgIEBlbmFibGVtZW50QnV0dG9uLm9uICdjbGljaycsID0+XG4gICAgICBpZiBAaXNEaXNhYmxlZCgpXG4gICAgICAgIGF0b20ucGFja2FnZXMuZW5hYmxlUGFja2FnZShAcGFjay5uYW1lKVxuICAgICAgZWxzZVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmRpc2FibGVQYWNrYWdlKEBwYWNrLm5hbWUpXG4gICAgICBmYWxzZVxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuXG4gIGxvYWRDYWNoZWRNZXRhZGF0YTogLT5cbiAgICBAY2xpZW50LmF2YXRhciBvd25lckZyb21SZXBvc2l0b3J5KEBwYWNrLnJlcG9zaXRvcnkpLCAoZXJyLCBhdmF0YXJQYXRoKSA9PlxuICAgICAgQGF2YXRhci5hdHRyICdzcmMnLCBcImZpbGU6Ly8je2F2YXRhclBhdGh9XCIgaWYgYXZhdGFyUGF0aFxuXG4gICAgQGNsaWVudC5wYWNrYWdlIEBwYWNrLm5hbWUsIChlcnIsIGRhdGEpID0+XG4gICAgICAjIFdlIGRvbid0IG5lZWQgdG8gYWN0dWFsbHkgaGFuZGxlIHRoZSBlcnJvciBoZXJlLCB3ZSBjYW4ganVzdCBza2lwXG4gICAgICAjIHNob3dpbmcgdGhlIGRvd25sb2FkIGNvdW50IGlmIHRoZXJlJ3MgYSBwcm9ibGVtLlxuICAgICAgdW5sZXNzIGVyclxuICAgICAgICBkYXRhID89IHt9XG4gICAgICAgIGlmIEBwYWNrLmFwbUluc3RhbGxTb3VyY2U/LnR5cGUgaXMgJ2dpdCdcbiAgICAgICAgICBAZG93bmxvYWRJY29uLnJlbW92ZUNsYXNzKCdpY29uLWNsb3VkLWRvd25sb2FkJylcbiAgICAgICAgICBAZG93bmxvYWRJY29uLmFkZENsYXNzKCdpY29uLWdpdC1icmFuY2gnKVxuICAgICAgICAgIEBkb3dubG9hZENvdW50LnRleHQgQHBhY2suYXBtSW5zdGFsbFNvdXJjZS5zaGEuc3Vic3RyKDAsIDgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc3RhcmdhemVyQ291bnQudGV4dCBkYXRhLnN0YXJnYXplcnNfY291bnQ/LnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgICBAZG93bmxvYWRDb3VudC50ZXh0IGRhdGEuZG93bmxvYWRzPy50b0xvY2FsZVN0cmluZygpXG5cbiAgdXBkYXRlSW50ZXJmYWNlU3RhdGU6IC0+XG4gICAgQHZlcnNpb25WYWx1ZS50ZXh0KEBpbnN0YWxsYWJsZVBhY2s/LnZlcnNpb24gPyBAcGFjay52ZXJzaW9uKVxuICAgIGlmIEBwYWNrLmFwbUluc3RhbGxTb3VyY2U/LnR5cGUgaXMgJ2dpdCdcbiAgICAgIEBkb3dubG9hZENvdW50LnRleHQgQHBhY2suYXBtSW5zdGFsbFNvdXJjZS5zaGEuc3Vic3RyKDAsIDgpXG5cbiAgICBAdXBkYXRlU2V0dGluZ3NTdGF0ZSgpXG4gICAgQHVwZGF0ZUluc3RhbGxlZFN0YXRlKClcbiAgICBAdXBkYXRlRGlzYWJsZWRTdGF0ZSgpXG4gICAgQHVwZGF0ZURlcHJlY2F0ZWRTdGF0ZSgpXG5cbiAgdXBkYXRlU2V0dGluZ3NTdGF0ZTogLT5cbiAgICBpZiBAaGFzU2V0dGluZ3MoKSBhbmQgbm90IEBvblNldHRpbmdzVmlld1xuICAgICAgQHNldHRpbmdzQnV0dG9uLnNob3coKVxuICAgIGVsc2VcbiAgICAgIEBzZXR0aW5nc0J1dHRvbi5oaWRlKClcblxuICAjIFNlY3Rpb246IGRpc2FibGVkIHN0YXRlIHVwZGF0ZXNcblxuICB1cGRhdGVEaXNhYmxlZFN0YXRlOiAtPlxuICAgIGlmIEBpc0Rpc2FibGVkKClcbiAgICAgIEBkaXNwbGF5RGlzYWJsZWRTdGF0ZSgpXG4gICAgZWxzZSBpZiBAaGFzQ2xhc3MoJ2Rpc2FibGVkJylcbiAgICAgIEBkaXNwbGF5RW5hYmxlZFN0YXRlKClcblxuICBkaXNwbGF5RW5hYmxlZFN0YXRlOiAtPlxuICAgIEByZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxuICAgIEBlbmFibGVtZW50QnV0dG9uLmhpZGUoKSBpZiBAdHlwZSBpcyAndGhlbWUnXG4gICAgQGVuYWJsZW1lbnRCdXR0b24uZmluZCgnLmRpc2FibGUtdGV4dCcpLnRleHQoJ0Rpc2FibGUnKVxuICAgIEBlbmFibGVtZW50QnV0dG9uXG4gICAgICAuYWRkQ2xhc3MoJ2ljb24tcGxheWJhY2stcGF1c2UnKVxuICAgICAgLnJlbW92ZUNsYXNzKCdpY29uLXBsYXliYWNrLXBsYXknKVxuICAgIEBzdGF0dXNJbmRpY2F0b3JcbiAgICAgIC5yZW1vdmVDbGFzcygnaXMtZGlzYWJsZWQnKVxuXG4gIGRpc3BsYXlEaXNhYmxlZFN0YXRlOiAtPlxuICAgIEBhZGRDbGFzcygnZGlzYWJsZWQnKVxuICAgIEBlbmFibGVtZW50QnV0dG9uLmZpbmQoJy5kaXNhYmxlLXRleHQnKS50ZXh0KCdFbmFibGUnKVxuICAgIEBlbmFibGVtZW50QnV0dG9uXG4gICAgICAuYWRkQ2xhc3MoJ2ljb24tcGxheWJhY2stcGxheScpXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2ljb24tcGxheWJhY2stcGF1c2UnKVxuICAgIEBzdGF0dXNJbmRpY2F0b3JcbiAgICAgIC5hZGRDbGFzcygnaXMtZGlzYWJsZWQnKVxuXG4gICAgaWYgQGlzRGVwcmVjYXRlZCgpXG4gICAgICBAZW5hYmxlbWVudEJ1dHRvbi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpXG4gICAgZWxzZVxuICAgICAgQGVuYWJsZW1lbnRCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcblxuICAjIFNlY3Rpb246IGluc3RhbGxlZCBzdGF0ZSB1cGRhdGVzXG5cbiAgdXBkYXRlSW5zdGFsbGVkU3RhdGU6IC0+XG4gICAgaWYgQGlzSW5zdGFsbGVkKClcbiAgICAgIEBkaXNwbGF5SW5zdGFsbGVkU3RhdGUoKVxuICAgIGVsc2VcbiAgICAgIEBkaXNwbGF5Tm90SW5zdGFsbGVkU3RhdGUoKVxuXG4gIGRpc3BsYXlJbnN0YWxsZWRTdGF0ZTogLT5cbiAgICBpZiBAbmV3VmVyc2lvbiBvciBAbmV3U2hhXG4gICAgICBAdXBkYXRlQnV0dG9uR3JvdXAuc2hvdygpXG4gICAgICBpZiBAbmV3VmVyc2lvblxuICAgICAgICBAdXBkYXRlQnV0dG9uLnRleHQoXCJVcGRhdGUgdG8gI3tAbmV3VmVyc2lvbn1cIilcbiAgICAgIGVsc2UgaWYgQG5ld1NoYVxuICAgICAgICBAdXBkYXRlQnV0dG9uLnRleHQoXCJVcGRhdGUgdG8gI3tAbmV3U2hhLnN1YnN0cigwLCA4KX1cIilcbiAgICBlbHNlXG4gICAgICBAdXBkYXRlQnV0dG9uR3JvdXAuaGlkZSgpXG5cbiAgICBAaW5zdGFsbEJ1dHRvbkdyb3VwLmhpZGUoKVxuICAgIEBpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b25Hcm91cC5oaWRlKClcbiAgICBAcGFja2FnZUFjdGlvbkJ1dHRvbkdyb3VwLnNob3coKVxuICAgIEB1bmluc3RhbGxCdXR0b24uc2hvdygpXG5cbiAgZGlzcGxheU5vdEluc3RhbGxlZFN0YXRlOiAtPlxuICAgIGlmIG5vdCBAaGFzQ29tcGF0aWJsZVZlcnNpb25cbiAgICAgIEBpbnN0YWxsQnV0dG9uR3JvdXAuaGlkZSgpXG4gICAgICBAdXBkYXRlQnV0dG9uR3JvdXAuaGlkZSgpXG4gICAgZWxzZSBpZiBAbmV3VmVyc2lvbiBvciBAbmV3U2hhXG4gICAgICBAdXBkYXRlQnV0dG9uR3JvdXAuc2hvdygpXG4gICAgICBAaW5zdGFsbEJ1dHRvbkdyb3VwLmhpZGUoKVxuICAgIGVsc2VcbiAgICAgIEB1cGRhdGVCdXR0b25Hcm91cC5oaWRlKClcbiAgICAgIEBpbnN0YWxsQnV0dG9uR3JvdXAuc2hvdygpXG4gICAgQGluc3RhbGxBbHRlcm5hdGl2ZUJ1dHRvbkdyb3VwLmhpZGUoKVxuICAgIEBwYWNrYWdlQWN0aW9uQnV0dG9uR3JvdXAuaGlkZSgpXG5cbiAgIyBTZWN0aW9uOiBkZXByZWNhdGVkIHN0YXRlIHVwZGF0ZXNcblxuICB1cGRhdGVEZXByZWNhdGVkU3RhdGU6IC0+XG4gICAgaWYgQGlzRGVwcmVjYXRlZCgpXG4gICAgICBAZGlzcGxheURlcHJlY2F0ZWRTdGF0ZSgpXG4gICAgZWxzZSBpZiBAaGFzQ2xhc3MoJ2RlcHJlY2F0ZWQnKVxuICAgICAgQGRpc3BsYXlVbmRlcHJlY2F0ZWRTdGF0ZSgpXG5cbiAgZGlzcGxheVN0YXRzOiAob3B0aW9ucykgLT5cbiAgICBpZiBvcHRpb25zPy5zdGF0cz8uZG93bmxvYWRzXG4gICAgICBAcGFja2FnZURvd25sb2Fkcy5zaG93KClcbiAgICBlbHNlXG4gICAgICBAcGFja2FnZURvd25sb2Fkcy5oaWRlKClcblxuICAgIGlmIG9wdGlvbnM/LnN0YXRzPy5zdGFyc1xuICAgICAgQHBhY2thZ2VTdGFycy5zaG93KClcbiAgICBlbHNlXG4gICAgICBAcGFja2FnZVN0YXJzLmhpZGUoKVxuXG4gIGRpc3BsYXlVbmRlcHJlY2F0ZWRTdGF0ZTogLT5cbiAgICBAcmVtb3ZlQ2xhc3MoJ2RlcHJlY2F0ZWQnKVxuICAgIEBwYWNrYWdlTWVzc2FnZS5yZW1vdmVDbGFzcygndGV4dC13YXJuaW5nJylcbiAgICBAcGFja2FnZU1lc3NhZ2UudGV4dCgnJylcblxuICBkaXNwbGF5RGVwcmVjYXRlZFN0YXRlOiAtPlxuICAgIEBhZGRDbGFzcygnZGVwcmVjYXRlZCcpXG4gICAgQHNldHRpbmdzQnV0dG9uWzBdLmRpc2FibGVkID0gdHJ1ZVxuXG4gICAgaW5mbyA9IEBnZXREZXByZWNhdGVkUGFja2FnZU1ldGFkYXRhKClcbiAgICBAcGFja2FnZU1lc3NhZ2UuYWRkQ2xhc3MoJ3RleHQtd2FybmluZycpXG5cbiAgICBtZXNzYWdlID0gbnVsbFxuICAgIGlmIGluZm8/Lmhhc0RlcHJlY2F0aW9uc1xuICAgICAgbWVzc2FnZSA9IEBnZXREZXByZWNhdGlvbk1lc3NhZ2UoQG5ld1ZlcnNpb24pXG4gICAgZWxzZSBpZiBpbmZvPy5oYXNBbHRlcm5hdGl2ZSBhbmQgaW5mbz8uYWx0ZXJuYXRpdmUgYW5kIGluZm8/LmFsdGVybmF0aXZlIGlzICdjb3JlJ1xuICAgICAgbWVzc2FnZSA9IGluZm8ubWVzc2FnZSA/IFwiVGhlIGZlYXR1cmVzIGluIGAje0BwYWNrLm5hbWV9YCBoYXZlIGJlZW4gYWRkZWQgdG8gY29yZS5cIlxuICAgICAgbWVzc2FnZSArPSAnIFBsZWFzZSB1bmluc3RhbGwgdGhpcyBwYWNrYWdlLidcbiAgICAgIEBzZXR0aW5nc0J1dHRvbi5yZW1vdmUoKVxuICAgICAgQGVuYWJsZW1lbnRCdXR0b24ucmVtb3ZlKClcbiAgICBlbHNlIGlmIGluZm8/Lmhhc0FsdGVybmF0aXZlIGFuZCBhbHQgPSBpbmZvPy5hbHRlcm5hdGl2ZVxuICAgICAgaXNJbnN0YWxsZWQgPSBAaXNJbnN0YWxsZWQoKVxuICAgICAgaWYgaXNJbnN0YWxsZWQgYW5kIEBwYWNrYWdlTWFuYWdlci5pc1BhY2thZ2VJbnN0YWxsZWQoYWx0KVxuICAgICAgICBtZXNzYWdlID0gXCJgI3tAcGFjay5uYW1lfWAgaGFzIGJlZW4gcmVwbGFjZWQgYnkgYCN7YWx0fWAgd2hpY2ggaXMgYWxyZWFkeSBpbnN0YWxsZWQuIFBsZWFzZSB1bmluc3RhbGwgdGhpcyBwYWNrYWdlLlwiXG4gICAgICAgIEBzZXR0aW5nc0J1dHRvbi5yZW1vdmUoKVxuICAgICAgICBAZW5hYmxlbWVudEJ1dHRvbi5yZW1vdmUoKVxuICAgICAgZWxzZSBpZiBpc0luc3RhbGxlZFxuICAgICAgICBtZXNzYWdlID0gXCJgI3tAcGFjay5uYW1lfWAgaGFzIGJlZW4gcmVwbGFjZWQgYnkgW2Aje2FsdH1gXShhdG9tOi8vY29uZmlnL2luc3RhbGwvcGFja2FnZToje2FsdH0pLlwiXG4gICAgICAgIEBpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b24udGV4dCBcIkluc3RhbGwgI3thbHR9XCJcbiAgICAgICAgQGluc3RhbGxBbHRlcm5hdGl2ZUJ1dHRvbkdyb3VwLnNob3coKVxuICAgICAgICBAcGFja2FnZUFjdGlvbkJ1dHRvbkdyb3VwLnNob3coKVxuICAgICAgICBAc2V0dGluZ3NCdXR0b24ucmVtb3ZlKClcbiAgICAgICAgQGVuYWJsZW1lbnRCdXR0b24ucmVtb3ZlKClcbiAgICAgIGVsc2VcbiAgICAgICAgbWVzc2FnZSA9IFwiYCN7QHBhY2submFtZX1gIGhhcyBiZWVuIHJlcGxhY2VkIGJ5IFtgI3thbHR9YF0oYXRvbTovL2NvbmZpZy9pbnN0YWxsL3BhY2thZ2U6I3thbHR9KS5cIlxuICAgICAgICBAaW5zdGFsbEJ1dHRvbkdyb3VwLmhpZGUoKVxuICAgICAgICBAaW5zdGFsbEFsdGVybmF0aXZlQnV0dG9uR3JvdXAuaGlkZSgpXG4gICAgICAgIEBwYWNrYWdlQWN0aW9uQnV0dG9uR3JvdXAuaGlkZSgpXG5cbiAgICBpZiBtZXNzYWdlP1xuICAgICAgbWFya2VkID89IHJlcXVpcmUgJ21hcmtlZCdcbiAgICAgIEBwYWNrYWdlTWVzc2FnZS5odG1sIG1hcmtlZChtZXNzYWdlKVxuXG4gIGRpc3BsYXlHaXRQYWNrYWdlSW5zdGFsbEluZm9ybWF0aW9uOiAtPlxuICAgIEBtZXRhVXNlckNvbnRhaW5lci5yZW1vdmUoKVxuICAgIEBzdGF0c0NvbnRhaW5lci5yZW1vdmUoKVxuICAgIHtnaXRVcmxJbmZvfSA9IEBwYWNrXG4gICAgaWYgZ2l0VXJsSW5mby5kZWZhdWx0IGlzICdzaG9ydGN1dCdcbiAgICAgIEBwYWNrYWdlRGVzY3JpcHRpb24udGV4dCBnaXRVcmxJbmZvLmh0dHBzKClcbiAgICBlbHNlXG4gICAgICBAcGFja2FnZURlc2NyaXB0aW9uLnRleHQgZ2l0VXJsSW5mby50b1N0cmluZygpXG4gICAgQGluc3RhbGxCdXR0b24ucmVtb3ZlQ2xhc3MoJ2ljb24tY2xvdWQtZG93bmxvYWQnKVxuICAgIEBpbnN0YWxsQnV0dG9uLmFkZENsYXNzKCdpY29uLWdpdC1jb21taXQnKVxuICAgIEB1cGRhdGVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2ljb24tY2xvdWQtZG93bmxvYWQnKVxuICAgIEB1cGRhdGVCdXR0b24uYWRkQ2xhc3MoJ2ljb24tZ2l0LWNvbW1pdCcpXG5cbiAgZGlzcGxheUF2YWlsYWJsZVVwZGF0ZTogKEBuZXdWZXJzaW9uKSAtPlxuICAgIEB1cGRhdGVJbnRlcmZhY2VTdGF0ZSgpXG5cbiAgZ2V0RGVwcmVjYXRpb25NZXNzYWdlOiAobmV3VmVyc2lvbikgLT5cbiAgICBpbmZvID0gQGdldERlcHJlY2F0ZWRQYWNrYWdlTWV0YWRhdGEoKVxuICAgIHJldHVybiB1bmxlc3MgaW5mbz8uaGFzRGVwcmVjYXRpb25zXG5cbiAgICBpZiBuZXdWZXJzaW9uXG4gICAgICBpZiBAaXNEZXByZWNhdGVkKG5ld1ZlcnNpb24pXG4gICAgICAgIFwiQW4gdXBkYXRlIHRvIGB2I3tuZXdWZXJzaW9ufWAgaXMgYXZhaWxhYmxlIGJ1dCBzdGlsbCBjb250YWlucyBkZXByZWNhdGlvbnMuXCJcbiAgICAgIGVsc2VcbiAgICAgICAgXCJBbiB1cGRhdGUgdG8gYHYje25ld1ZlcnNpb259YCBpcyBhdmFpbGFibGUgd2l0aG91dCBkZXByZWNhdGlvbnMuXCJcbiAgICBlbHNlXG4gICAgICBpZiBAaXNJbnN0YWxsZWQoKVxuICAgICAgICBpbmZvLm1lc3NhZ2UgPyAnVGhpcyBwYWNrYWdlIGhhcyBub3QgYmVlbiBsb2FkZWQgZHVlIHRvIHVzaW5nIGRlcHJlY2F0ZWQgQVBJcy4gVGhlcmUgaXMgbm8gdXBkYXRlIGF2YWlsYWJsZS4nXG4gICAgICBlbHNlXG4gICAgICAgICdUaGlzIHBhY2thZ2UgaGFzIGRlcHJlY2F0aW9ucyBhbmQgaXMgbm90IGluc3RhbGxhYmxlLidcblxuICBoYW5kbGVQYWNrYWdlRXZlbnRzOiAtPlxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5wYWNrYWdlcy5vbkRpZERlYWN0aXZhdGVQYWNrYWdlIChwYWNrKSA9PlxuICAgICAgQHVwZGF0ZURpc2FibGVkU3RhdGUoKSBpZiBwYWNrLm5hbWUgaXMgQHBhY2submFtZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVQYWNrYWdlIChwYWNrKSA9PlxuICAgICAgQHVwZGF0ZURpc2FibGVkU3RhdGUoKSBpZiBwYWNrLm5hbWUgaXMgQHBhY2submFtZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnY29yZS5kaXNhYmxlZFBhY2thZ2VzJywgPT5cbiAgICAgIEB1cGRhdGVEaXNhYmxlZFN0YXRlKClcblxuICAgIEBzdWJzY3JpYmVUb1BhY2thZ2VFdmVudCAncGFja2FnZS1pbnN0YWxsaW5nIHRoZW1lLWluc3RhbGxpbmcnLCA9PlxuICAgICAgQHVwZGF0ZUludGVyZmFjZVN0YXRlKClcbiAgICAgIEBpbnN0YWxsQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgICAgIEBpbnN0YWxsQnV0dG9uLmFkZENsYXNzKCdpcy1pbnN0YWxsaW5nJylcblxuICAgIEBzdWJzY3JpYmVUb1BhY2thZ2VFdmVudCAncGFja2FnZS11cGRhdGluZyB0aGVtZS11cGRhdGluZycsID0+XG4gICAgICBAdXBkYXRlSW50ZXJmYWNlU3RhdGUoKVxuICAgICAgQHVwZGF0ZUJ1dHRvbi5wcm9wKCdkaXNhYmxlZCcsIHRydWUpXG4gICAgICBAdXBkYXRlQnV0dG9uLmFkZENsYXNzKCdpcy1pbnN0YWxsaW5nJylcblxuICAgIEBzdWJzY3JpYmVUb1BhY2thZ2VFdmVudCAncGFja2FnZS1pbnN0YWxsaW5nLWFsdGVybmF0aXZlJywgPT5cbiAgICAgIEB1cGRhdGVJbnRlcmZhY2VTdGF0ZSgpXG4gICAgICBAaW5zdGFsbEFsdGVybmF0aXZlQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgICAgIEBpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b24uYWRkQ2xhc3MoJ2lzLWluc3RhbGxpbmcnKVxuXG4gICAgQHN1YnNjcmliZVRvUGFja2FnZUV2ZW50ICdwYWNrYWdlLXVuaW5zdGFsbGluZyB0aGVtZS11bmluc3RhbGxpbmcnLCA9PlxuICAgICAgQHVwZGF0ZUludGVyZmFjZVN0YXRlKClcbiAgICAgIEBlbmFibGVtZW50QnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgICAgIEB1bmluc3RhbGxCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCB0cnVlKVxuICAgICAgQHVuaW5zdGFsbEJ1dHRvbi5hZGRDbGFzcygnaXMtdW5pbnN0YWxsaW5nJylcblxuICAgIEBzdWJzY3JpYmVUb1BhY2thZ2VFdmVudCAncGFja2FnZS1pbnN0YWxsZWQgcGFja2FnZS1pbnN0YWxsLWZhaWxlZCB0aGVtZS1pbnN0YWxsZWQgdGhlbWUtaW5zdGFsbC1mYWlsZWQnLCA9PlxuICAgICAgQHBhY2sudmVyc2lvbiA9IHZlcnNpb24gaWYgdmVyc2lvbiA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShAcGFjay5uYW1lKT8ubWV0YWRhdGE/LnZlcnNpb25cbiAgICAgIEBpbnN0YWxsQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpXG4gICAgICBAaW5zdGFsbEJ1dHRvbi5yZW1vdmVDbGFzcygnaXMtaW5zdGFsbGluZycpXG4gICAgICBAdXBkYXRlSW50ZXJmYWNlU3RhdGUoKVxuXG4gICAgQHN1YnNjcmliZVRvUGFja2FnZUV2ZW50ICdwYWNrYWdlLXVwZGF0ZWQgdGhlbWUtdXBkYXRlZCBwYWNrYWdlLXVwZGF0ZS1mYWlsZWQgdGhlbWUtdXBkYXRlLWZhaWxlZCcsID0+XG4gICAgICBtZXRhZGF0YSA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShAcGFjay5uYW1lKT8ubWV0YWRhdGFcbiAgICAgIEBwYWNrLnZlcnNpb24gPSB2ZXJzaW9uIGlmIHZlcnNpb24gPSBtZXRhZGF0YT8udmVyc2lvblxuICAgICAgQHBhY2suYXBtSW5zdGFsbFNvdXJjZSA9IGFwbUluc3RhbGxTb3VyY2UgaWYgYXBtSW5zdGFsbFNvdXJjZSA9IG1ldGFkYXRhPy5hcG1JbnN0YWxsU291cmNlXG4gICAgICBAbmV3VmVyc2lvbiA9IG51bGxcbiAgICAgIEBuZXdTaGEgPSBudWxsXG4gICAgICBAdXBkYXRlQnV0dG9uLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpXG4gICAgICBAdXBkYXRlQnV0dG9uLnJlbW92ZUNsYXNzKCdpcy1pbnN0YWxsaW5nJylcbiAgICAgIEB1cGRhdGVJbnRlcmZhY2VTdGF0ZSgpXG5cbiAgICBAc3Vic2NyaWJlVG9QYWNrYWdlRXZlbnQgJ3BhY2thZ2UtdW5pbnN0YWxsZWQgcGFja2FnZS11bmluc3RhbGwtZmFpbGVkIHRoZW1lLXVuaW5zdGFsbGVkIHRoZW1lLXVuaW5zdGFsbC1mYWlsZWQnLCA9PlxuICAgICAgQG5ld1ZlcnNpb24gPSBudWxsXG4gICAgICBAbmV3U2hhID0gbnVsbFxuICAgICAgQGVuYWJsZW1lbnRCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcbiAgICAgIEB1bmluc3RhbGxCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcbiAgICAgIEB1bmluc3RhbGxCdXR0b24ucmVtb3ZlQ2xhc3MoJ2lzLXVuaW5zdGFsbGluZycpXG4gICAgICBAdXBkYXRlSW50ZXJmYWNlU3RhdGUoKVxuXG4gICAgQHN1YnNjcmliZVRvUGFja2FnZUV2ZW50ICdwYWNrYWdlLWluc3RhbGxlZC1hbHRlcm5hdGl2ZSBwYWNrYWdlLWluc3RhbGwtYWx0ZXJuYXRpdmUtZmFpbGVkJywgPT5cbiAgICAgIEBpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b24ucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSlcbiAgICAgIEBpbnN0YWxsQWx0ZXJuYXRpdmVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2lzLWluc3RhbGxpbmcnKVxuICAgICAgQHVwZGF0ZUludGVyZmFjZVN0YXRlKClcblxuICBpc0luc3RhbGxlZDogLT4gQHBhY2thZ2VNYW5hZ2VyLmlzUGFja2FnZUluc3RhbGxlZChAcGFjay5uYW1lKVxuXG4gIGlzRGlzYWJsZWQ6IC0+IGF0b20ucGFja2FnZXMuaXNQYWNrYWdlRGlzYWJsZWQoQHBhY2submFtZSlcblxuICBpc0RlcHJlY2F0ZWQ6ICh2ZXJzaW9uKSAtPiBhdG9tLnBhY2thZ2VzLmlzRGVwcmVjYXRlZFBhY2thZ2UoQHBhY2submFtZSwgdmVyc2lvbiA/IEBwYWNrLnZlcnNpb24pXG5cbiAgZ2V0RGVwcmVjYXRlZFBhY2thZ2VNZXRhZGF0YTogLT4gYXRvbS5wYWNrYWdlcy5nZXREZXByZWNhdGVkUGFja2FnZU1ldGFkYXRhKEBwYWNrLm5hbWUpXG5cbiAgaGFzU2V0dGluZ3M6IC0+IEBwYWNrYWdlTWFuYWdlci5wYWNrYWdlSGFzU2V0dGluZ3MoQHBhY2submFtZSlcblxuICBzdWJzY3JpYmVUb1BhY2thZ2VFdmVudDogKGV2ZW50LCBjYWxsYmFjaykgLT5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBwYWNrYWdlTWFuYWdlci5vbiBldmVudCwgKHtwYWNrLCBlcnJvcn0pID0+XG4gICAgICBwYWNrID0gcGFjay5wYWNrIGlmIHBhY2sucGFjaz9cbiAgICAgIHBhY2thZ2VOYW1lID0gcGFjay5uYW1lXG4gICAgICBjYWxsYmFjayhwYWNrLCBlcnJvcikgaWYgcGFja2FnZU5hbWUgaXMgQHBhY2submFtZVxuXG4gICMjI1xuICBTZWN0aW9uOiBNZXRob2RzIHRoYXQgc2hvdWxkIGJlIG9uIGEgUGFja2FnZSBtb2RlbFxuICAjIyNcblxuICBpbnN0YWxsOiAtPlxuICAgIEBwYWNrYWdlTWFuYWdlci5pbnN0YWxsIEBpbnN0YWxsYWJsZVBhY2sgPyBAcGFjaywgKGVycm9yKSA9PlxuICAgICAgaWYgZXJyb3I/XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbnN0YWxsaW5nICN7QHR5cGV9ICN7QHBhY2submFtZX0gZmFpbGVkXCIsIGVycm9yLnN0YWNrID8gZXJyb3IsIGVycm9yLnN0ZGVycilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBpZiBhIHBhY2thZ2Ugd2FzIGRpc2FibGVkIGJlZm9yZSBpbnN0YWxsaW5nIGl0LCByZS1lbmFibGUgaXRcbiAgICAgICAgYXRvbS5wYWNrYWdlcy5lbmFibGVQYWNrYWdlKEBwYWNrLm5hbWUpIGlmIEBpc0Rpc2FibGVkKClcblxuICB1cGRhdGU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbmV3VmVyc2lvbiBvciBAbmV3U2hhXG4gICAgcGFjayA9IEBpbnN0YWxsYWJsZVBhY2sgPyBAcGFja1xuICAgIHZlcnNpb24gPSBpZiBAbmV3VmVyc2lvbiB0aGVuIFwidiN7QG5ld1ZlcnNpb259XCIgZWxzZSBcIiMje0BuZXdTaGEuc3Vic3RyKDAsIDgpfVwiXG5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgQHBhY2thZ2VNYW5hZ2VyLnVwZGF0ZSBwYWNrLCBAbmV3VmVyc2lvbiwgKGVycm9yKSA9PlxuICAgICAgICBpZiBlcnJvcj9cbiAgICAgICAgICBhdG9tLmFzc2VydCBmYWxzZSwgXCJQYWNrYWdlIHVwZGF0ZSBmYWlsZWRcIiwgKGFzc2VydGlvbkVycm9yKSA9PlxuICAgICAgICAgICAgYXNzZXJ0aW9uRXJyb3IubWV0YWRhdGEgPSB7XG4gICAgICAgICAgICAgIHR5cGU6IEB0eXBlLFxuICAgICAgICAgICAgICBuYW1lOiBwYWNrLm5hbWUsXG4gICAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb24sXG4gICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgZXJyb3JTdGFjazogZXJyb3Iuc3RhY2ssXG4gICAgICAgICAgICAgIGVycm9yU3RkZXJyOiBlcnJvci5zdGRlcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVXBkYXRpbmcgI3tAdHlwZX0gI3twYWNrLm5hbWV9IHRvICN7dmVyc2lvbn0gZmFpbGVkOlxcblwiLCBlcnJvciwgZXJyb3Iuc3RkZXJyID8gJycpXG4gICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVzb2x2ZSgpXG5cbiAgdW5pbnN0YWxsOiAtPlxuICAgIEBwYWNrYWdlTWFuYWdlci51bmluc3RhbGwgQHBhY2ssIChlcnJvcikgPT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5pbnN0YWxsaW5nICN7QHR5cGV9ICN7QHBhY2submFtZX0gZmFpbGVkXCIsIGVycm9yLnN0YWNrID8gZXJyb3IsIGVycm9yLnN0ZGVycilcblxuICBpbnN0YWxsQWx0ZXJuYXRpdmU6IC0+XG4gICAgbWV0YWRhdGEgPSBAZ2V0RGVwcmVjYXRlZFBhY2thZ2VNZXRhZGF0YSgpXG4gICAgbG9hZGVkUGFjayA9IGF0b20ucGFja2FnZXMuZ2V0TG9hZGVkUGFja2FnZShtZXRhZGF0YT8uYWx0ZXJuYXRpdmUpXG4gICAgcmV0dXJuIHVubGVzcyBtZXRhZGF0YT8uaGFzQWx0ZXJuYXRpdmUgYW5kIG1ldGFkYXRhLmFsdGVybmF0aXZlIGlzbnQgJ2NvcmUnIGFuZCBub3QgbG9hZGVkUGFja1xuXG4gICAge2FsdGVybmF0aXZlfSA9IG1ldGFkYXRhXG4gICAgQHBhY2thZ2VNYW5hZ2VyLmluc3RhbGxBbHRlcm5hdGl2ZSBAcGFjaywgYWx0ZXJuYXRpdmUsIChlcnJvciwge3BhY2ssIGFsdGVybmF0aXZlfSkgPT5cbiAgICAgIGlmIGVycm9yP1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5zdGFsbGluZyBhbHRlcm5hdGl2ZSBgI3thbHRlcm5hdGl2ZX1gICN7QHR5cGV9IGZvciAje0BwYWNrLm5hbWV9IGZhaWxlZFwiLCBlcnJvci5zdGFjayA/IGVycm9yLCBlcnJvci5zdGRlcnIpXG4iXX0=
