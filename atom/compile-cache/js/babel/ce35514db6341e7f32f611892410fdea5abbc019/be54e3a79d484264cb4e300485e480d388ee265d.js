Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _electron = require('electron');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

'use babel';

var FileRecoveryService = (function () {
  function FileRecoveryService(recoveryDirectory) {
    _classCallCheck(this, FileRecoveryService);

    this.recoveryDirectory = recoveryDirectory;
    this.recoveryFilesByFilePath = new Map();
    this.recoveryFilesByWindow = new WeakMap();
    this.windowsByRecoveryFile = new Map();
  }

  _createClass(FileRecoveryService, [{
    key: 'willSavePath',
    value: function willSavePath(window, path) {
      if (!_fsPlus2['default'].existsSync(path)) return;

      var recoveryPath = _path2['default'].join(this.recoveryDirectory, RecoveryFile.fileNameForPath(path));
      var recoveryFile = this.recoveryFilesByFilePath.get(path) || new RecoveryFile(path, recoveryPath);

      try {
        recoveryFile.retain();
      } catch (err) {
        console.log('Couldn\'t retain ' + recoveryFile.recoveryPath + '. Code: ' + err.code + '. Message: ' + err.message);
        return;
      }

      if (!this.recoveryFilesByWindow.has(window)) {
        this.recoveryFilesByWindow.set(window, new Set());
      }
      if (!this.windowsByRecoveryFile.has(recoveryFile)) {
        this.windowsByRecoveryFile.set(recoveryFile, new Set());
      }

      this.recoveryFilesByWindow.get(window).add(recoveryFile);
      this.windowsByRecoveryFile.get(recoveryFile).add(window);
      this.recoveryFilesByFilePath.set(path, recoveryFile);
    }
  }, {
    key: 'didSavePath',
    value: function didSavePath(window, path) {
      var recoveryFile = this.recoveryFilesByFilePath.get(path);
      if (recoveryFile != null) {
        try {
          recoveryFile.release();
        } catch (err) {
          console.log('Couldn\'t release ' + recoveryFile.recoveryPath + '. Code: ' + err.code + '. Message: ' + err.message);
        }
        if (recoveryFile.isReleased()) this.recoveryFilesByFilePath['delete'](path);
        this.recoveryFilesByWindow.get(window)['delete'](recoveryFile);
        this.windowsByRecoveryFile.get(recoveryFile)['delete'](window);
      }
    }
  }, {
    key: 'didCrashWindow',
    value: function didCrashWindow(window) {
      if (!this.recoveryFilesByWindow.has(window)) return;

      for (var recoveryFile of this.recoveryFilesByWindow.get(window)) {
        try {
          recoveryFile.recoverSync();
        } catch (error) {
          var message = 'A file that Atom was saving could be corrupted';
          var detail = 'Error ' + error.code + '. There was a crash while saving "' + recoveryFile.originalPath + '", so this file might be blank or corrupted.\n' + ('Atom couldn\'t recover it automatically, but a recovery file has been saved at: "' + recoveryFile.recoveryPath + '".');
          console.log(detail);
          _electron.dialog.showMessageBox(window.browserWindow, { type: 'info', buttons: ['OK'], message: message, detail: detail });
        } finally {
          for (var _window of this.windowsByRecoveryFile.get(recoveryFile)) {
            this.recoveryFilesByWindow.get(_window)['delete'](recoveryFile);
          }
          this.windowsByRecoveryFile['delete'](recoveryFile);
          this.recoveryFilesByFilePath['delete'](recoveryFile.originalPath);
        }
      }
    }
  }, {
    key: 'didCloseWindow',
    value: function didCloseWindow(window) {
      if (!this.recoveryFilesByWindow.has(window)) return;

      for (var recoveryFile of this.recoveryFilesByWindow.get(window)) {
        this.windowsByRecoveryFile.get(recoveryFile)['delete'](window);
      }
      this.recoveryFilesByWindow['delete'](window);
    }
  }]);

  return FileRecoveryService;
})();

exports['default'] = FileRecoveryService;

var RecoveryFile = (function () {
  _createClass(RecoveryFile, null, [{
    key: 'fileNameForPath',
    value: function fileNameForPath(path) {
      var extension = _path2['default'].extname(path);
      var basename = _path2['default'].basename(path, extension).substring(0, 34);
      var randomSuffix = _crypto2['default'].randomBytes(3).toString('hex');
      return basename + '-' + randomSuffix + extension;
    }
  }]);

  function RecoveryFile(originalPath, recoveryPath) {
    _classCallCheck(this, RecoveryFile);

    this.originalPath = originalPath;
    this.recoveryPath = recoveryPath;
    this.refCount = 0;
  }

  _createClass(RecoveryFile, [{
    key: 'storeSync',
    value: function storeSync() {
      _fsPlus2['default'].copyFileSync(this.originalPath, this.recoveryPath);
    }
  }, {
    key: 'recoverSync',
    value: function recoverSync() {
      _fsPlus2['default'].copyFileSync(this.recoveryPath, this.originalPath);
      this.removeSync();
    }
  }, {
    key: 'removeSync',
    value: function removeSync() {
      _fsPlus2['default'].unlinkSync(this.recoveryPath);
    }
  }, {
    key: 'retain',
    value: function retain() {
      if (this.isReleased()) this.storeSync();
      this.refCount++;
    }
  }, {
    key: 'release',
    value: function release() {
      this.refCount--;
      if (this.isReleased()) this.removeSync();
    }
  }, {
    key: 'isReleased',
    value: function isReleased() {
      return this.refCount === 0;
    }
  }]);

  return RecoveryFile;
})();

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvbWFpbi1wcm9jZXNzL2ZpbGUtcmVjb3Zlcnktc2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3dCQUVxQixVQUFVOztzQkFDWixRQUFROzs7O29CQUNWLE1BQU07Ozs7c0JBQ1IsU0FBUzs7OztBQUx4QixXQUFXLENBQUE7O0lBT1UsbUJBQW1CO0FBQzFCLFdBRE8sbUJBQW1CLENBQ3pCLGlCQUFpQixFQUFFOzBCQURiLG1CQUFtQjs7QUFFcEMsUUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFBO0FBQzFDLFFBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ3hDLFFBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFBO0FBQzFDLFFBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0dBQ3ZDOztlQU5rQixtQkFBbUI7O1dBUXpCLHNCQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDMUIsVUFBSSxDQUFDLG9CQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFNOztBQUVoQyxVQUFNLFlBQVksR0FBRyxrQkFBSyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUMxRixVQUFNLFlBQVksR0FDaEIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUE7O0FBRWhGLFVBQUk7QUFDRixvQkFBWSxDQUFDLE1BQU0sRUFBRSxDQUFBO09BQ3RCLENBQUMsT0FBTyxHQUFHLEVBQUU7QUFDWixlQUFPLENBQUMsR0FBRyx1QkFBb0IsWUFBWSxDQUFD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QyxZQUFZLEdBQUcsWUFBWSxDQUFBO0FBQ2hDLFFBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFBO0dBQ2xCOztlQVpHLFlBQVk7O1dBY04scUJBQUc7QUFDWCwwQkFBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7S0FDdEQ7OztXQUVXLHVCQUFHO0FBQ2IsMEJBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3JELFVBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtLQUNsQjs7O1dBRVUsc0JBQUc7QUFDWiwwQkFBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0tBQ2pDOzs7V0FFTSxrQkFBRztBQUNSLFVBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtBQUN2QyxVQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7S0FDaEI7OztXQUVPLG1CQUFHO0FBQ1QsVUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQ2YsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0tBQ3pDOzs7V0FFVSxzQkFBRztBQUNaLGFBQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUE7S0FDM0I7OztTQXZDRyxZQUFZIiwiZmlsZSI6Ii90bXAveWFvdXJ0LXRtcC1taWNoYWVsL2F1ci1hdG9tLWVkaXRvci1naXQvc3JjL2F0b20vb3V0L2FwcC9zcmMvbWFpbi1wcm9jZXNzL2ZpbGUtcmVjb3Zlcnktc2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7ZGlhbG9nfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJ1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlUmVjb3ZlcnlTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IgKHJlY292ZXJ5RGlyZWN0b3J5KSB7XG4gICAgdGhpcy5yZWNvdmVyeURpcmVjdG9yeSA9IHJlY292ZXJ5RGlyZWN0b3J5XG4gICAgdGhpcy5yZWNvdmVyeUZpbGVzQnlGaWxlUGF0aCA9IG5ldyBNYXAoKVxuICAgIHRoaXMucmVjb3ZlcnlGaWxlc0J5V2luZG93ID0gbmV3IFdlYWtNYXAoKVxuICAgIHRoaXMud2luZG93c0J5UmVjb3ZlcnlGaWxlID0gbmV3IE1hcCgpXG4gIH1cblxuICB3aWxsU2F2ZVBhdGggKHdpbmRvdywgcGF0aCkge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoKSkgcmV0dXJuXG5cbiAgICBjb25zdCByZWNvdmVyeVBhdGggPSBQYXRoLmpvaW4odGhpcy5yZWNvdmVyeURpcmVjdG9yeSwgUmVjb3ZlcnlGaWxlLmZpbGVOYW1lRm9yUGF0aChwYXRoKSlcbiAgICBjb25zdCByZWNvdmVyeUZpbGUgPVxuICAgICAgdGhpcy5yZWNvdmVyeUZpbGVzQnlGaWxlUGF0aC5nZXQocGF0aCkgfHwgbmV3IFJlY292ZXJ5RmlsZShwYXRoLCByZWNvdmVyeVBhdGgpXG5cbiAgICB0cnkge1xuICAgICAgcmVjb3ZlcnlGaWxlLnJldGFpbigpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhgQ291bGRuJ3QgcmV0YWluICR7cmVjb3ZlcnlGaWxlLnJlY292ZXJ5UGF0aH0uIENvZGU6ICR7ZXJyLmNvZGV9LiBNZXNzYWdlOiAke2Vyci5tZXNzYWdlfWApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucmVjb3ZlcnlGaWxlc0J5V2luZG93Lmhhcyh3aW5kb3cpKSB7XG4gICAgICB0aGlzLnJlY292ZXJ5RmlsZXNCeVdpbmRvdy5zZXQod2luZG93LCBuZXcgU2V0KCkpXG4gICAgfVxuICAgIGlmICghdGhpcy53aW5kb3dzQnlSZWNvdmVyeUZpbGUuaGFzKHJlY292ZXJ5RmlsZSkpIHtcbiAgICAgIHRoaXMud2luZG93c0J5UmVjb3ZlcnlGaWxlLnNldChyZWNvdmVyeUZpbGUsIG5ldyBTZXQoKSlcbiAgICB9XG5cbiAgICB0aGlzLnJlY292ZXJ5RmlsZXNCeVdpbmRvdy5nZXQod2luZG93KS5hZGQocmVjb3ZlcnlGaWxlKVxuICAgIHRoaXMud2luZG93c0J5UmVjb3ZlcnlGaWxlLmdldChyZWNvdmVyeUZpbGUpLmFkZCh3aW5kb3cpXG4gICAgdGhpcy5yZWNvdmVyeUZpbGVzQnlGaWxlUGF0aC5zZXQocGF0aCwgcmVjb3ZlcnlGaWxlKVxuICB9XG5cbiAgZGlkU2F2ZVBhdGggKHdpbmRvdywgcGF0aCkge1xuICAgIGNvbnN0IHJlY292ZXJ5RmlsZSA9IHRoaXMucmVjb3ZlcnlGaWxlc0J5RmlsZVBhdGguZ2V0KHBhdGgpXG4gICAgaWYgKHJlY292ZXJ5RmlsZSAhPSBudWxsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZWNvdmVyeUZpbGUucmVsZWFzZSgpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coYENvdWxkbid0IHJlbGVhc2UgJHtyZWNvdmVyeUZpbGUucmVjb3ZlcnlQYXRofS4gQ29kZTogJHtlcnIuY29kZX0uIE1lc3NhZ2U6ICR7ZXJyLm1lc3NhZ2V9YClcbiAgICAgIH1cbiAgICAgIGlmIChyZWNvdmVyeUZpbGUuaXNSZWxlYXNlZCgpKSB0aGlzLnJlY292ZXJ5RmlsZXNCeUZpbGVQYXRoLmRlbGV0ZShwYXRoKVxuICAgICAgdGhpcy5yZWNvdmVyeUZpbGVzQnlXaW5kb3cuZ2V0KHdpbmRvdykuZGVsZXRlKHJlY292ZXJ5RmlsZSlcbiAgICAgIHRoaXMud2luZG93c0J5UmVjb3ZlcnlGaWxlLmdldChyZWNvdmVyeUZpbGUpLmRlbGV0ZSh3aW5kb3cpXG4gICAgfVxuICB9XG5cbiAgZGlkQ3Jhc2hXaW5kb3cgKHdpbmRvdykge1xuICAgIGlmICghdGhpcy5yZWNvdmVyeUZpbGVzQnlXaW5kb3cuaGFzKHdpbmRvdykpIHJldHVyblxuXG4gICAgZm9yIChjb25zdCByZWNvdmVyeUZpbGUgb2YgdGhpcy5yZWNvdmVyeUZpbGVzQnlXaW5kb3cuZ2V0KHdpbmRvdykpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlY292ZXJ5RmlsZS5yZWNvdmVyU3luYygpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gJ0EgZmlsZSB0aGF0IEF0b20gd2FzIHNhdmluZyBjb3VsZCBiZSBjb3JydXB0ZWQnXG4gICAgICAgIGNvbnN0IGRldGFpbCA9XG4gICAgICAgICAgYEVycm9yICR7ZXJyb3IuY29kZX0uIFRoZXJlIHdhcyBhIGNyYXNoIHdoaWxlIHNhdmluZyBcIiR7cmVjb3ZlcnlGaWxlLm9yaWdpbmFsUGF0aH1cIiwgc28gdGhpcyBmaWxlIG1pZ2h0IGJlIGJsYW5rIG9yIGNvcnJ1cHRlZC5cXG5gICtcbiAgICAgICAgICBgQXRvbSBjb3VsZG4ndCByZWNvdmVyIGl0IGF1dG9tYXRpY2FsbHksIGJ1dCBhIHJlY292ZXJ5IGZpbGUgaGFzIGJlZW4gc2F2ZWQgYXQ6IFwiJHtyZWNvdmVyeUZpbGUucmVjb3ZlcnlQYXRofVwiLmBcbiAgICAgICAgY29uc29sZS5sb2coZGV0YWlsKVxuICAgICAgICBkaWFsb2cuc2hvd01lc3NhZ2VCb3god2luZG93LmJyb3dzZXJXaW5kb3csIHt0eXBlOiAnaW5mbycsIGJ1dHRvbnM6IFsnT0snXSwgbWVzc2FnZSwgZGV0YWlsfSlcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGZvciAobGV0IHdpbmRvdyBvZiB0aGlzLndpbmRvd3NCeVJlY292ZXJ5RmlsZS5nZXQocmVjb3ZlcnlGaWxlKSkge1xuICAgICAgICAgIHRoaXMucmVjb3ZlcnlGaWxlc0J5V2luZG93LmdldCh3aW5kb3cpLmRlbGV0ZShyZWNvdmVyeUZpbGUpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53aW5kb3dzQnlSZWNvdmVyeUZpbGUuZGVsZXRlKHJlY292ZXJ5RmlsZSlcbiAgICAgICAgdGhpcy5yZWNvdmVyeUZpbGVzQnlGaWxlUGF0aC5kZWxldGUocmVjb3ZlcnlGaWxlLm9yaWdpbmFsUGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkaWRDbG9zZVdpbmRvdyAod2luZG93KSB7XG4gICAgaWYgKCF0aGlzLnJlY292ZXJ5RmlsZXNCeVdpbmRvdy5oYXMod2luZG93KSkgcmV0dXJuXG5cbiAgICBmb3IgKGxldCByZWNvdmVyeUZpbGUgb2YgdGhpcy5yZWNvdmVyeUZpbGVzQnlXaW5kb3cuZ2V0KHdpbmRvdykpIHtcbiAgICAgIHRoaXMud2luZG93c0J5UmVjb3ZlcnlGaWxlLmdldChyZWNvdmVyeUZpbGUpLmRlbGV0ZSh3aW5kb3cpXG4gICAgfVxuICAgIHRoaXMucmVjb3ZlcnlGaWxlc0J5V2luZG93LmRlbGV0ZSh3aW5kb3cpXG4gIH1cbn1cblxuY2xhc3MgUmVjb3ZlcnlGaWxlIHtcbiAgc3RhdGljIGZpbGVOYW1lRm9yUGF0aCAocGF0aCkge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IFBhdGguZXh0bmFtZShwYXRoKVxuICAgIGNvbnN0IGJhc2VuYW1lID0gUGF0aC5iYXNlbmFtZShwYXRoLCBleHRlbnNpb24pLnN1YnN0cmluZygwLCAzNClcbiAgICBjb25zdCByYW5kb21TdWZmaXggPSBjcnlwdG8ucmFuZG9tQnl0ZXMoMykudG9TdHJpbmcoJ2hleCcpXG4gICAgcmV0dXJuIGAke2Jhc2VuYW1lfS0ke3JhbmRvbVN1ZmZpeH0ke2V4dGVuc2lvbn1gXG4gIH1cblxuICBjb25zdHJ1Y3RvciAob3JpZ2luYWxQYXRoLCByZWNvdmVyeVBhdGgpIHtcbiAgICB0aGlzLm9yaWdpbmFsUGF0aCA9IG9yaWdpbmFsUGF0aFxuICAgIHRoaXMucmVjb3ZlcnlQYXRoID0gcmVjb3ZlcnlQYXRoXG4gICAgdGhpcy5yZWZDb3VudCA9IDBcbiAgfVxuXG4gIHN0b3JlU3luYyAoKSB7XG4gICAgZnMuY29weUZpbGVTeW5jKHRoaXMub3JpZ2luYWxQYXRoLCB0aGlzLnJlY292ZXJ5UGF0aClcbiAgfVxuXG4gIHJlY292ZXJTeW5jICgpIHtcbiAgICBmcy5jb3B5RmlsZVN5bmModGhpcy5yZWNvdmVyeVBhdGgsIHRoaXMub3JpZ2luYWxQYXRoKVxuICAgIHRoaXMucmVtb3ZlU3luYygpXG4gIH1cblxuICByZW1vdmVTeW5jICgpIHtcbiAgICBmcy51bmxpbmtTeW5jKHRoaXMucmVjb3ZlcnlQYXRoKVxuICB9XG5cbiAgcmV0YWluICgpIHtcbiAgICBpZiAodGhpcy5pc1JlbGVhc2VkKCkpIHRoaXMuc3RvcmVTeW5jKClcbiAgICB0aGlzLnJlZkNvdW50KytcbiAgfVxuXG4gIHJlbGVhc2UgKCkge1xuICAgIHRoaXMucmVmQ291bnQtLVxuICAgIGlmICh0aGlzLmlzUmVsZWFzZWQoKSkgdGhpcy5yZW1vdmVTeW5jKClcbiAgfVxuXG4gIGlzUmVsZWFzZWQgKCkge1xuICAgIHJldHVybiB0aGlzLnJlZkNvdW50ID09PSAwXG4gIH1cbn1cbiJdfQ==