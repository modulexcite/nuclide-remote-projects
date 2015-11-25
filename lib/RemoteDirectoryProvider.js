
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
        // Return null here. In response, Atom will create a generic Directory for
        // this URI, and add it to the list of root project paths (atom.project.getPaths()).
        // In remote-projects/main.js, we remove these generic directories.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdnQyxPQUFPLENBQUMsMkJBQTJCLENBQUM7O0lBQXpFLGdCQUFnQixZQUFoQixnQkFBZ0I7SUFBRSxlQUFlLFlBQWYsZUFBZTs7Ozs7OztBQU94QyxJQUFNLHNCQUFzQixHQUFHLFlBQVksQ0FBQzs7SUFFdEMsdUJBQXVCO1dBQXZCLHVCQUF1QjswQkFBdkIsdUJBQXVCOzs7ZUFBdkIsdUJBQXVCOztXQUNSLDZCQUFDLEdBQVcsRUFBb0I7QUFDakQsVUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUMsRUFBRTtBQUMzQyxlQUFPLElBQUksQ0FBQztPQUNiO0FBQ0QsVUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ELFVBQUksVUFBVSxFQUFFO0FBQ2QsZUFBTyxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3hDLE1BQU07Ozs7QUFJTCxlQUFPLElBQUksQ0FBQztPQUNiO0tBQ0Y7OztXQUVjLHlCQUFDLEdBQVcsRUFBVztBQUNwQyxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7OztTQWxCRyx1QkFBdUI7OztBQXFCN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wcGZsNTJucHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL1JlbW90ZURpcmVjdG9yeVByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuY29uc3Qge1JlbW90ZUNvbm5lY3Rpb24sIFJlbW90ZURpcmVjdG9yeX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJyk7XG5cbi8qKlxuICogVGhlIHByZWZpeCBhIFVSSSBtdXN0IGhhdmUgZm9yIGBSZW1vdGVEaXJlY3RvcnlQcm92aWRlcmAgdG8gdHJ5IHRvIHByb2R1Y2UgYVxuICogYFJlbW90ZURpcmVjdG9yeWAgZm9yIGl0LiBUaGlzIHNob3VsZCBhbHNvIGJlIHRoZSBwYXRoIHByZWZpeCBjaGVja2VkIGJ5IHRoZVxuICogaGFuZGxlciB3ZSByZWdpc3RlciB3aXRoIGBhdG9tLnByb2plY3QucmVnaXN0ZXJPcGVuZXIoKWAgdG8gb3BlbiByZW1vdGUgZmlsZXMuXG4gKi9cbmNvbnN0IFJFTU9URV9QQVRIX1VSSV9QUkVGSVggPSAnbnVjbGlkZTovLyc7XG5cbmNsYXNzIFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyIHtcbiAgZGlyZWN0b3J5Rm9yVVJJU3luYyh1cmk6IHN0cmluZyk6ID9SZW1vdGVEaXJlY3Rvcnkge1xuICAgIGlmICghdXJpLnN0YXJ0c1dpdGgoUkVNT1RFX1BBVEhfVVJJX1BSRUZJWCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRGb3JVcmkodXJpKTtcbiAgICBpZiAoY29ubmVjdGlvbikge1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uY3JlYXRlRGlyZWN0b3J5KHVyaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJldHVybiBudWxsIGhlcmUuIEluIHJlc3BvbnNlLCBBdG9tIHdpbGwgY3JlYXRlIGEgZ2VuZXJpYyBEaXJlY3RvcnkgZm9yXG4gICAgICAvLyB0aGlzIFVSSSwgYW5kIGFkZCBpdCB0byB0aGUgbGlzdCBvZiByb290IHByb2plY3QgcGF0aHMgKGF0b20ucHJvamVjdC5nZXRQYXRocygpKS5cbiAgICAgIC8vIEluIHJlbW90ZS1wcm9qZWN0cy9tYWluLmpzLCB3ZSByZW1vdmUgdGhlc2UgZ2VuZXJpYyBkaXJlY3Rvcmllcy5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGRpcmVjdG9yeUZvclVSSSh1cmk6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kaXJlY3RvcnlGb3JVUklTeW5jKHVyaSkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXI7XG4iXX0=
