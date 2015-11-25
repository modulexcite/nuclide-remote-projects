
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvTnVjbGlkZVRleHRCdWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc4QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0lBRWhDLGlCQUFpQjtZQUFqQixpQkFBaUI7O0FBRVYsV0FGUCxpQkFBaUIsQ0FFVCxVQUE0QixFQUFFLE1BQVcsRUFBRTswQkFGbkQsaUJBQWlCOztBQUduQiwrQkFIRSxpQkFBaUIsNkNBR2IsTUFBTSxFQUFFO0FBQ2QsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDN0IsUUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDL0I7O2VBTkcsaUJBQWlCOztXQVFkLGlCQUFDLFFBQWdCLEVBQVE7QUFDOUIsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Ozs7QUFJcEIsZUFBTztPQUNSO0FBQ0QsVUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO0FBQy9CLGVBQU87T0FDUjtBQUNELFVBQUksUUFBUSxFQUFFO0FBQ1osWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztPQUN4QixNQUFNO0FBQ0wsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7T0FDbEI7QUFDRCxVQUFJLENBQUMsT0FBTyxD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QUFFLE1BQUssT0FBTyxFQUFFLENBQUMsQ0FBQztPQUN0RCxDQUFDLENBQUMsQ0FBQzs7QUFFSixVQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBQyxXQUFXLEVBQUs7QUFDMUUsY0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFdBQVcsQ0FBQyxDQUFDO09BQzFELENBQUMsQ0FBQyxDQUFDO0tBQ0w7Ozs2QkFFZ0IsYUFBcUI7QUFDcEMsVUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDaEIsZUFBTyxLQUFLLENBQUM7T0FDZDtBQUNELFVBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNiLFlBQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN4QyxZQUFJLE1BQU0sRUFBRTtBQUNWLGlCQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLENBQUMsa0JBQWtCLENBQUM7U0FDbkQsTUFBTTtBQUNMLGlCQUFPLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzlGO09BQ0YsTUFBTTtBQUNMLGVBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDeEI7S0FDRjs7O1NBOUdHLGlCQUFpQjtHQUFTLFVBQVU7O0FBaUgxQyxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvTnVjbGlkZVRleHRCdWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5jb25zdCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgVGV4dEJ1ZmZlcn0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmNsYXNzIE51Y2xpZGVUZXh0QnVmZmVyIGV4dGVuZHMgVGV4dEJ1ZmZlciB7XG5cbiAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbiwgcGFyYW1zOiBhbnkpIHtcbiAgICBzdXBlcihwYXJhbXMpO1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgdGhpcy5zZXRQYXRoKHBhcmFtcy5maWxlUGF0aCk7XG4gIH1cblxuICBzZXRQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbikge1xuICAgICAgLy8gSWYgdGhpcy5jb25uZWN0aW9uIGlzIG5vdCBzZXQsIHRoZW4gdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IgaXMgc3RpbGwgZXhlY3V0aW5nLlxuICAgICAgLy8gTnVjbGlkZVRleHRCdWZmZXIncyBjb25zdHJ1Y3RvciB3aWxsIGVuc3VyZSBzZXRQYXRoKCkgaXMgY2FsbGVkIG9uY2UgdGhpcy5jb25zdHJ1Y3RvclxuICAgICAgLy8gaXMgc2V0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZmlsZVBhdGggPT09IHRoaXMuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChmaWxlUGF0aCkge1xuICAgICAgdGhpcy5maWxlID0gdGhpcy5jcmVhdGVGaWxlKGZpbGVQYXRoKTtcbiAgICAgIHRoaXMuZmlsZS5zZXRFbmNvZGluZyh0aGlzLmdldEVuY29kaW5nKCkpO1xuICAgICAgdGhpcy5zdWJzY3JpYmVUb0ZpbGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5maWxlID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtcGF0aCcsIHRoaXMuZ2V0UGF0aCgpKTtcbiAgfVxuXG4gIGNyZWF0ZUZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFJlbW90ZUZpbGUge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlRmlsZShmaWxlUGF0aCk7XG4gIH1cblxuICBhc3luYyBzYXZlQXMoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBzYXZlIGJ1ZmZlciB3aXRoIG5vIGZpbGUgcGF0aCcpO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCd3aWxsLXNhdmUnLCB7cGF0aDogZmlsZVBhdGh9KTtcbiAgICB0aGlzLnNldFBhdGgoZmlsZVBhdGgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmZpbGUud3JpdGUodGhpcy5nZXRUZXh0KCkpO1xuICAgICAgdGhpcy5jYWNoZWREaXNrQ29udGVudHMgPSB0aGlzLmdldFRleHQoKTtcbiAgICAgIHRoaXMuY29uZmxpY3QgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW1pdE1vZGlmaWVkU3RhdHVzQ2hhbmdlZChmYWxzZSk7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNhdmUnLCB7cGF0aDogZmlsZVBhdGh9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBzYXZlIHJlbW90ZSBmaWxlOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVDYWNoZWREaXNrQ29udGVudHNTeW5jKCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXBkYXRlQ2FjaGVkRGlza0NvbnRlbnRzU3luYyBpc25cXCd0IHN1cHBvcnRlZCBpbiBOdWNsaWRlVGV4dEJ1ZmZlcicpO1xuICB9XG5cbiAgc3Vic2NyaWJlVG9GaWxlKCkge1xuICAgIGlmICh0aGlzLmZpbGVTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmZpbGVTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLmZpbGVTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmZpbGUub25EaWRDaGFuZ2UoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaXNNb2RpZmllZCA9IGF3YWl0IHRoaXMuX2lzTW9kaWZpZWQoKTtcbiAgICAgIGlmIChpc01vZGlmaWVkKSB7XG4gICAgICAgIHRoaXMuY29uZmxpY3QgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJldmlvdXNDb250ZW50cyA9IHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzO1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVDYWNoZWREaXNrQ29udGVudHMoKTtcbiAgICAgIGlmIChwcmV2aW91c0NvbnRlbnRzID09PSB0aGlzLmNhY2hlZERpc2tDb250ZW50cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jb25mbGljdCkge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNvbmZsaWN0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbG9hZCgpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuZmlsZVN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZmlsZS5vbkRpZERlbGV0ZSgoKSA9PiB7XG4gICAgICBjb25zdCBtb2RpZmllZCA9IHRoaXMuZ2V0VGV4dCgpICE9PSB0aGlzLmNhY2hlZERpc2tDb250ZW50cztcbiAgICAgIHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgPSBtb2RpZmllZDtcbiAgICAgIGlmIChtb2RpZmllZCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNhY2hlZERpc2tDb250ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uRGlkUmVuYW1lKCgpID0+IHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlLXBhdGgnLCB0aGlzLmdldFBhdGgoKSk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uV2lsbFRocm93V2F0Y2hFcnJvcigoZXJyb3JPYmplY3QpID0+IHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCd3aWxsLXRocm93LXdhdGNoLWVycm9yJywgZXJyb3JPYmplY3QpO1xuICAgIH0pKTtcbiAgfVxuXG4gIGFzeW5jIF9pc01vZGlmaWVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICghdGhpcy5sb2FkZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZmlsZSkge1xuICAgICAgY29uc3QgZXhpc3RzID0gYXdhaXQgdGhpcy5maWxlLmV4aXN0cygpO1xuICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZXh0KCkgIT09IHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgIT0gbnVsbCA/IHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgOiAhdGhpcy5pc0VtcHR5KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAhdGhpcy5pc0VtcHR5KCk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVjbGlkZVRleHRCdWZmZXI7XG4iXX0=
