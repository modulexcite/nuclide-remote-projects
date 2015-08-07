
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('nuclide-remote-connection');

var RemoteConnection = _require.RemoteConnection;
var RemoteDirectory = _require.RemoteDirectory;

/**
 * The prefix a URI must have for `RemoteDirectoryProvider` to try to produce a
 * `RemoteDirectory` for it. This should also be the path prefix checked by the
 * handler we register with `atom.project.registerOpener()` to open remote files.
 */
var REMOTE_PATH_URI_PREFIX = 'nuclide://';

var RemoteDirectoryProvider = (function () {
  function RemoteDirectoryProvider() {
    _classCallCheck(this, RemoteDirectoryProvider);
  }

  _createClass(RemoteDirectoryProvider, [{
    key: 'directoryForURISync',
    value: function directoryForURISync(uri) {
      if (!uri.startsWith(REMOTE_PATH_URI_PREFIX)) {
        return null;
      }

      var connection = RemoteConnection.getForUri(uri);
      if (connection) {
        return connection.createDirectory(uri);
      } else {
        // TODO: Handle case where connection is not yet established. This could
        // happen when someone had a nuclide:// file open before and then s/he
        // restarted the workspace and Atom tried to restore the state.
        return null;
      }
    }
  }, {
    key: 'directoryForURI',
    value: function directoryForURI(uri) {
      return Promise.resolve(this.directoryForURISync(uri));
    }
  }]);

  return RemoteDirectoryProvider;
})();

module.exports = RemoteDirectoryProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVc4QixPQUFPLENBQUMsMkJBQTJCLENBQUM7O0lBQXpFLGdCQUFnQixZQUFoQixnQkFBZ0I7SUFBRSxlQUFlLFlBQWYsZUFBZTs7Ozs7OztBQU90QyxJQUFJLHNCQUFzQixHQUFHLFlBQVksQ0FBQzs7SUFFcEMsdUJBQXVCO1dBQXZCLHVCQUF1QjswQkFBdkIsdUJBQXVCOzs7ZUFBdkIsdUJBQXVCOztXQUNSLDZCQUFDLEdBQVcsRUFBb0I7QUFDakQsVUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUMsRUFBRTtBQUMzQyxlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELFVBQUksVUFBVSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqRCxVQUFJLFVBQVUsRUFBRTtBQUNkLGVBQU8sVUFBVSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUN4QyxNQUFNOzs7O0FBSUwsZUFBTyxJQUFJLENBQUM7T0FDYjtLQUNGOzs7V0FFYyx5QkFBQyxHQUFXLEVBQVc7QUFDcEMsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3ZEOzs7U0FuQkcsdUJBQXVCOzs7QUFzQjdCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL2xpYi9SZW1vdGVEaXJlY3RvcnlQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7UmVtb3RlQ29ubmVjdGlvbiwgUmVtb3RlRGlyZWN0b3J5fSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24nKTtcblxuLyoqXG4gKiBUaGUgcHJlZml4IGEgVVJJIG11c3QgaGF2ZSBmb3IgYFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyYCB0byB0cnkgdG8gcHJvZHVjZSBhXG4gKiBgUmVtb3RlRGlyZWN0b3J5YCBmb3IgaXQuIFRoaXMgc2hvdWxkIGFsc28gYmUgdGhlIHBhdGggcHJlZml4IGNoZWNrZWQgYnkgdGhlXG4gKiBoYW5kbGVyIHdlIHJlZ2lzdGVyIHdpdGggYGF0b20ucHJvamVjdC5yZWdpc3Rlck9wZW5lcigpYCB0byBvcGVuIHJlbW90ZSBmaWxlcy5cbiAqL1xudmFyIFJFTU9URV9QQVRIX1VSSV9QUkVGSVggPSAnbnVjbGlkZTovLyc7XG5cbmNsYXNzIFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyIHtcbiAgZGlyZWN0b3J5Rm9yVVJJU3luYyh1cmk6IHN0cmluZyk6ID9SZW1vdGVEaXJlY3Rvcnkge1xuICAgIGlmICghdXJpLnN0YXJ0c1dpdGgoUkVNT1RFX1BBVEhfVVJJX1BSRUZJWCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRGb3JVcmkodXJpKTtcbiAgICBpZiAoY29ubmVjdGlvbikge1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uY3JlYXRlRGlyZWN0b3J5KHVyaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IEhhbmRsZSBjYXNlIHdoZXJlIGNvbm5lY3Rpb24gaXMgbm90IHlldCBlc3RhYmxpc2hlZC4gVGhpcyBjb3VsZFxuICAgICAgLy8gaGFwcGVuIHdoZW4gc29tZW9uZSBoYWQgYSBudWNsaWRlOi8vIGZpbGUgb3BlbiBiZWZvcmUgYW5kIHRoZW4gcy9oZVxuICAgICAgLy8gcmVzdGFydGVkIHRoZSB3b3Jrc3BhY2UgYW5kIEF0b20gdHJpZWQgdG8gcmVzdG9yZSB0aGUgc3RhdGUuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBkaXJlY3RvcnlGb3JVUkkodXJpOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZGlyZWN0b3J5Rm9yVVJJU3luYyh1cmkpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyO1xuIl19
