
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var TextBuffer = _require.TextBuffer;

var NuclideTextBuffer = (function (_TextBuffer) {
  _inherits(NuclideTextBuffer, _TextBuffer);

  function NuclideTextBuffer(connection, params) {
    _classCallCheck(this, NuclideTextBuffer);

    _get(Object.getPrototypeOf(NuclideTextBuffer.prototype), 'constructor', this).call(this, params);
    this.connection = connection;
    this.setPath(params.filePath);
  }

  _createClass(NuclideTextBuffer, [{
    key: 'setPath',
    value: function setPath(filePath) {
      if (!this.connection) {
        // If this.connection is not set, then the superclass constructor is still executing.
        // NuclideTextBuffer's constructor will ensure setPath() is called once this.constructor
        // is set.
        return;
      }
      if (filePath === this.getPath()) {
        return;
      }
      if (filePath) {
        this.file = this.createFile(filePath);
        this.file.setEncoding(this.getEncoding());
        this.subscribeToFile();
      } else {
        this.file = null;
      }
      this.emitter.emit('did-change-path', this.getPath());
    }
  }, {
    key: 'createFile',
    value: function createFile(filePath) {
      return this.connection.createFile(filePath);
    }
  }, {
    key: 'saveAs',
    value: _asyncToGenerator(function* (filePath) {
      if (!filePath) {
        throw new Error('Can\'t save buffer with no file path');
      }

      this.emitter.emit('will-save', { path: filePath });
      this.setPath(filePath);
      try {
        yield this.file.write(this.getText());
        this.cachedDiskContents = this.getText();
        this.conflict = false;
        this.emitModifiedStatusChanged(false);
        this.emitter.emit('did-save', { path: filePath });
      } catch (e) {
        atom.notifications.addError('Failed to save remote file: ' + e.message);
      }
    })
  }, {
    key: 'updateCachedDiskContentsSync',
    value: function updateCachedDiskContentsSync() {
      throw new Error('updateCachedDiskContentsSync isn\'t supported in NuclideTextBuffer');
    }
  }, {
    key: 'subscribeToFile',
    value: function subscribeToFile() {
      var _this = this;

      if (this.fileSubscriptions) {
        this.fileSubscriptions.dispose();
      }
      this.fileSubscriptions = new CompositeDisposable();

      this.fileSubscriptions.add(this.file.onDidChange(_asyncToGenerator(function* () {
        var isModified = yield _this._isModified();
        if (isModified) {
          _this.conflict = true;
        }
        var previousContents = _this.cachedDiskContents;
        yield _this.updateCachedDiskContents();
        if (previousContents === _this.cachedDiskContents) {
          return;
        }
        if (_this.conflict) {
          _this.emitter.emit('did-conflict');
        } else {
          _this.reload();
        }
      })));

      this.fileSubscriptions.add(this.file.onDidDelete(function () {
        var modified = _this.getText() !== _this.cachedDiskContents;
        _this.wasModifiedBeforeRemove = modified;
        if (modified) {
          _this.updateCachedDiskContents();
        } else {
          _this.destroy();
        }
      }));

      this.fileSubscriptions.add(this.file.onDidRename(function () {
        _this.emitter.emit('did-change-path', _this.getPath());
      }));

      this.fileSubscriptions.add(this.file.onWillThrowWatchError(function (errorObject) {
        _this.emitter.emit('will-throw-watch-error', errorObject);
      }));
    }
  }, {
    key: '_isModified',
    value: _asyncToGenerator(function* () {
      if (!this.loaded) {
        return false;
      }
      if (this.file) {
        var exists = yield this.file.exists();
        if (exists) {
          return this.getText() !== this.cachedDiskContents;
        } else {
          return this.wasModifiedBeforeRemove != null ? this.wasModifiedBeforeRemove : !this.isEmpty();
        }
      } else {
        return !this.isEmpty();
      }
    })
  }]);

  return NuclideTextBuffer;
})(TextBuffer);

module.exports = NuclideTextBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvTnVjbGlkZVRleHRCdWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc0QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0lBRTlCLGlCQUFpQjtZQUFqQixpQkFBaUI7O0FBRVYsV0FGUCxpQkFBaUIsQ0FFVCxVQUE0QixFQUFFLE1BQVcsRUFBRTswQkFGbkQsaUJBQWlCOztBQUduQiwrQkFIRSxpQkFBaUIsNkNBR2IsTUFBTSxFQUFFO0FBQ2QsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDN0IsUUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDL0I7O2VBTkcsaUJBQWlCOztXQVFkLGlCQUFDLFFBQWdCLEVBQVE7QUFDOUIsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Ozs7QUFJcEIsZUFBTztPQUNSO0FBQ0QsVUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO0FBQy9CLGVBQU87T0FDUjtBQUNELFVBQUksUUFBUSxFQUFFO0FBQ1osWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztPQUN4QixNQUFNO0FBQ0wsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7T0FDbEI7QUFDRCxVQUFJLENBQUMsT0FBTyxD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QUFFLE1BQUssT0FBTyxFQUFFLENBQUMsQ0FBQztPQUN4RCxDQUFDLENBQUMsQ0FBQzs7QUFFSixVQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBQyxXQUFXLEVBQUs7QUFDeEUsY0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFdBQVcsQ0FBQyxDQUFDO09BQzVELENBQUMsQ0FBQyxDQUFDO0tBQ0w7Ozs2QkFFZ0IsYUFBcUI7QUFDcEMsVUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDaEIsZUFBTyxLQUFLLENBQUM7T0FDZDtBQUNELFVBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNiLFlBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN0QyxZQUFJLE1BQU0sRUFBRTtBQUNWLGlCQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLENBQUMsa0JBQWtCLENBQUM7U0FDbkQsTUFBTTtBQUNMLGlCQUFPLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzlGO09BQ0YsTUFBTTtBQUNMLGVBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDeEI7S0FDRjs7O1NBOUdHLGlCQUFpQjtHQUFTLFVBQVU7O0FBaUgxQyxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvTnVjbGlkZVRleHRCdWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIFRleHRCdWZmZXJ9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG5jbGFzcyBOdWNsaWRlVGV4dEJ1ZmZlciBleHRlbmRzIFRleHRCdWZmZXIge1xuXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IFJlbW90ZUNvbm5lY3Rpb24sIHBhcmFtczogYW55KSB7XG4gICAgc3VwZXIocGFyYW1zKTtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuc2V0UGF0aChwYXJhbXMuZmlsZVBhdGgpO1xuICB9XG5cbiAgc2V0UGF0aChmaWxlUGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3Rpb24pIHtcbiAgICAgIC8vIElmIHRoaXMuY29ubmVjdGlvbiBpcyBub3Qgc2V0LCB0aGVuIHRoZSBzdXBlcmNsYXNzIGNvbnN0cnVjdG9yIGlzIHN0aWxsIGV4ZWN1dGluZy5cbiAgICAgIC8vIE51Y2xpZGVUZXh0QnVmZmVyJ3MgY29uc3RydWN0b3Igd2lsbCBlbnN1cmUgc2V0UGF0aCgpIGlzIGNhbGxlZCBvbmNlIHRoaXMuY29uc3RydWN0b3JcbiAgICAgIC8vIGlzIHNldC5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGZpbGVQYXRoID09PSB0aGlzLmdldFBhdGgoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZmlsZVBhdGgpIHtcbiAgICAgIHRoaXMuZmlsZSA9IHRoaXMuY3JlYXRlRmlsZShmaWxlUGF0aCk7XG4gICAgICB0aGlzLmZpbGUuc2V0RW5jb2RpbmcodGhpcy5nZXRFbmNvZGluZygpKTtcbiAgICAgIHRoaXMuc3Vic2NyaWJlVG9GaWxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZmlsZSA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXBhdGgnLCB0aGlzLmdldFBhdGgoKSk7XG4gIH1cblxuICBjcmVhdGVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBSZW1vdGVGaWxlIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmNyZWF0ZUZpbGUoZmlsZVBhdGgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZUFzKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhblxcJ3Qgc2F2ZSBidWZmZXIgd2l0aCBubyBmaWxlIHBhdGgnKTtcbiAgICB9XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnd2lsbC1zYXZlJywge3BhdGg6IGZpbGVQYXRofSk7XG4gICAgdGhpcy5zZXRQYXRoKGZpbGVQYXRoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5maWxlLndyaXRlKHRoaXMuZ2V0VGV4dCgpKTtcbiAgICAgIHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzID0gdGhpcy5nZXRUZXh0KCk7XG4gICAgICB0aGlzLmNvbmZsaWN0ID0gZmFsc2U7XG4gICAgICB0aGlzLmVtaXRNb2RpZmllZFN0YXR1c0NoYW5nZWQoZmFsc2UpO1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zYXZlJywge3BhdGg6IGZpbGVQYXRofSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGBGYWlsZWQgdG8gc2F2ZSByZW1vdGUgZmlsZTogJHtlLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlQ2FjaGVkRGlza0NvbnRlbnRzU3luYygpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZUNhY2hlZERpc2tDb250ZW50c1N5bmMgaXNuXFwndCBzdXBwb3J0ZWQgaW4gTnVjbGlkZVRleHRCdWZmZXInKTtcbiAgfVxuXG4gIHN1YnNjcmliZVRvRmlsZSgpIHtcbiAgICBpZiAodGhpcy5maWxlU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRoaXMuZmlsZVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uRGlkQ2hhbmdlKGFzeW5jICgpID0+IHtcbiAgICAgIHZhciBpc01vZGlmaWVkID0gYXdhaXQgdGhpcy5faXNNb2RpZmllZCgpO1xuICAgICAgaWYgKGlzTW9kaWZpZWQpIHtcbiAgICAgICAgdGhpcy5jb25mbGljdCA9IHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgcHJldmlvdXNDb250ZW50cyA9IHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzO1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVDYWNoZWREaXNrQ29udGVudHMoKTtcbiAgICAgIGlmIChwcmV2aW91c0NvbnRlbnRzID09PSB0aGlzLmNhY2hlZERpc2tDb250ZW50cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jb25mbGljdCkge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNvbmZsaWN0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbG9hZCgpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZmlsZVN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZmlsZS5vbkRpZERlbGV0ZSgoKSA9PiB7XG4gICAgICB2YXIgbW9kaWZpZWQgPSB0aGlzLmdldFRleHQoKSAhPT0gdGhpcy5jYWNoZWREaXNrQ29udGVudHM7XG4gICAgICB0aGlzLndhc01vZGlmaWVkQmVmb3JlUmVtb3ZlID0gbW9kaWZpZWQ7XG4gICAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDYWNoZWREaXNrQ29udGVudHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZmlsZVN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZmlsZS5vbkRpZFJlbmFtZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXBhdGgnLCB0aGlzLmdldFBhdGgoKSk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uV2lsbFRocm93V2F0Y2hFcnJvcigoZXJyb3JPYmplY3QpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3dpbGwtdGhyb3ctd2F0Y2gtZXJyb3InLCBlcnJvck9iamVjdCk7XG4gICAgfSkpO1xuICB9XG5cbiAgYXN5bmMgX2lzTW9kaWZpZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCF0aGlzLmxvYWRlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5maWxlKSB7XG4gICAgICB2YXIgZXhpc3RzID0gYXdhaXQgdGhpcy5maWxlLmV4aXN0cygpO1xuICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZXh0KCkgIT09IHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgIT0gbnVsbCA/IHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgOiAhdGhpcy5pc0VtcHR5KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAhdGhpcy5pc0VtcHR5KCk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVjbGlkZVRleHRCdWZmZXI7XG4iXX0=
