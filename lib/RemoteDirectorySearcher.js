var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _rx = require('rx');

'use babel';

var _require = require('nuclide-remote-connection');

var RemoteDirectory = _require.RemoteDirectory;

var RemoteDirectorySearcher = (function () {

  // When constructed, RemoteDirectorySearcher must be passed a function that
  // it can use to get a 'FindInProjectService' for a given remote path.

  function RemoteDirectorySearcher(serviceProvider) {
    _classCallCheck(this, RemoteDirectorySearcher);

    this._serviceProvider = serviceProvider;
  }

  _createClass(RemoteDirectorySearcher, [{
    key: 'canSearchDirectory',
    value: function canSearchDirectory(directory) {
      return RemoteDirectory.isRemoteDirectory(directory);
    }
  }, {
    key: 'search',
    value: function search(directories, regex, options) {
      var _this = this;

      // Track the files that we have seen updates for.
      var seenFiles = new Set();

      // Get the remote service that corresponds to each remote directory.
      var services = directories.map(function (dir) {
        return _this._serviceProvider(dir);
      });

      // Start the search in each directory, and merge the resulting streams.
      var searchStream = _rx.Observable.merge(directories.map(function (dir, index) {
        return services[index].findInProjectSearch(dir.getPath(), regex, options.inclusions);
      }));

      // Create a subject that we can use to track search completion.
      var searchCompletion = new _rx.ReplaySubject();
      searchCompletion.onNext();

      var subscription = searchStream.subscribe(function (next) {
        options.didMatch(next);

        // Call didSearchPaths with the number of unique files we have seen matches in. This is
        // not technically correct, as didSearchPaths is also supposed to count files for which
        // no matches were found. However, we currently have no way of obtaining this information.
        seenFiles.add(next.filePath);
        options.didSearchPaths(seenFiles.size);
      }, function (error) {
        searchCompletion.onError(error);
      }, function () {
        searchCompletion.onCompleted();
      });

      // Return a promise that resolves on search completion.
      var completionPromise = searchCompletion.toPromise();
      return {
        then: completionPromise.then.bind(completionPromise),
        cancel: function cancel() {
          // Cancel the subscription, which should also kill the grep process.
          subscription.dispose();
        }
      };
    }
  }]);

  return RemoteDirectorySearcher;
})();

module.exports = RemoteDirectorySearcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O2tCQVd3QyxJQUFJOztBQVg1QyxXQUFXLENBQUM7O2VBWWMsT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUF2RCxlQUFlLFlBQWYsZUFBZTs7SUF1QmhCLHVCQUF1Qjs7Ozs7QUFLaEIsV0FMUCx1QkFBdUIsQ0FLZixlQUE4QyxFQUFFOzBCQUx4RCx1QkFBdUI7O0FBTXpCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7R0FDekM7O2VBUEcsdUJBQXVCOztXQVNULDRCQUFDLFNBQXNDLEVBQVc7QUFDbEUsYUFBTyxlQUFlLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDckQ7OztXQUVLLGdCQUFDLFdBQW1DLEVBQUUsS0FBYSxFQUFFLE9BQWUsRUFBeUI7Ozs7QUFFakcsVUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7O0FBRzVCLFVBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHO2VBQUksTUFBSyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7T0FBQSxDQUFDLENBQUM7OztBQUdwRSxVQUFNLFlBQVksR0FBRyxJQTdDakIsVUFBVSxDQTZDa0IsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHLEVBQUUsS0FBSztlQUMvRCxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDO09BQUEsQ0FBQyxDQUFDLENBQUM7OztBQUdsRixVQUFNLGdCQUFnQixHQUFHLFFBakRULGFBQWEsRUFpRGUsQ0FBQztBQUM3QyxzQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7QUFFMUIsVUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFBLElBQUksRUFBSTtBQUNsRCxlQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7OztBQUt2QixpQkFBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsZUFBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDeEMsRUFBRSxVQUFBLEtBQUssRUFBSTtBQUNWLHdCQUFnQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNqQyxFQUFFLFlBQU07QUFDUCx3QkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztPQUNoQyxDQUFDLENBQUM7OztBQUdILFVBQU0saUJBQWlCLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDdkQsYUFBTztBQUNMLFlBQUksRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO0FBQ3BELGNBQU0sRUFBQSxrQkFBRzs7QUFFUCxzQkFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3hCO09BQ0YsQ0FBQztLQUNIOzs7U0FuREcsdUJBQXVCOzs7QUFzRDdCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcHBmbDUybnB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL2xpYi9SZW1vdGVEaXJlY3RvcnlTZWFyY2hlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSAncngnO1xuY29uc3Qge1JlbW90ZURpcmVjdG9yeX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJyk7XG5cbnR5cGUgU2VhcmNoUmVzdWx0ID0ge1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBtYXRjaGVzOiBBcnJheTx7XG4gICAgbGluZVRleHQ6IHN0cmluZztcbiAgICBsaW5lVGV4dE9mZnNldDogbnVtYmVyO1xuICAgIG1hdGNoVGV4dDogc3RyaW5nO1xuICAgIHJhbmdlOiBBcnJheTxBcnJheTxudW1iZXI+PlxuICB9Pjtcbn07XG5cbnR5cGUgRGlyZWN0b3J5U2VhcmNoRGVsZWdhdGUgPSB7XG4gIGRpZE1hdGNoOiAocmVzdWx0OiBTZWFyY2hSZXN1bHQpID0+IHZvaWQ7XG4gIGRpZFNlYXJjaFBhdGhzOiAoY291bnQ6IG51bWJlcikgPT4gdm9pZDtcbiAgaW5jbHVzaW9uczogQXJyYXk8c3RyaW5nPjtcbn07XG5cbnR5cGUgUmVtb3RlRGlyZWN0b3J5U2VhcmNoID0ge1xuICB0aGVuOiAob25GdWxsZmlsbGVkOiBhbnksIG9uUmVqZWN0ZWQ6IGFueSkgPT4gUHJvbWlzZTxhbnk+O1xuICBjYW5jZWw6ICgpID0+IHZvaWQ7XG59XG5cbmNsYXNzIFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyIHtcbiAgX3NlcnZpY2VQcm92aWRlcjogKGRpcjogUmVtb3RlRGlyZWN0b3J5KSA9PiBhbnk7XG5cbiAgLy8gV2hlbiBjb25zdHJ1Y3RlZCwgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIgbXVzdCBiZSBwYXNzZWQgYSBmdW5jdGlvbiB0aGF0XG4gIC8vIGl0IGNhbiB1c2UgdG8gZ2V0IGEgJ0ZpbmRJblByb2plY3RTZXJ2aWNlJyBmb3IgYSBnaXZlbiByZW1vdGUgcGF0aC5cbiAgY29uc3RydWN0b3Ioc2VydmljZVByb3ZpZGVyOiAoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+IGFueSkge1xuICAgIHRoaXMuX3NlcnZpY2VQcm92aWRlciA9IHNlcnZpY2VQcm92aWRlcjtcbiAgfVxuXG4gIGNhblNlYXJjaERpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSB8IFJlbW90ZURpcmVjdG9yeSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBSZW1vdGVEaXJlY3RvcnkuaXNSZW1vdGVEaXJlY3RvcnkoZGlyZWN0b3J5KTtcbiAgfVxuXG4gIHNlYXJjaChkaXJlY3RvcmllczogQXJyYXk8UmVtb3RlRGlyZWN0b3J5PiwgcmVnZXg6IFJlZ0V4cCwgb3B0aW9uczogT2JqZWN0KTogUmVtb3RlRGlyZWN0b3J5U2VhcmNoIHtcbiAgICAvLyBUcmFjayB0aGUgZmlsZXMgdGhhdCB3ZSBoYXZlIHNlZW4gdXBkYXRlcyBmb3IuXG4gICAgY29uc3Qgc2VlbkZpbGVzID0gbmV3IFNldCgpO1xuXG4gICAgLy8gR2V0IHRoZSByZW1vdGUgc2VydmljZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGVhY2ggcmVtb3RlIGRpcmVjdG9yeS5cbiAgICBjb25zdCBzZXJ2aWNlcyA9IGRpcmVjdG9yaWVzLm1hcChkaXIgPT4gdGhpcy5fc2VydmljZVByb3ZpZGVyKGRpcikpO1xuXG4gICAgLy8gU3RhcnQgdGhlIHNlYXJjaCBpbiBlYWNoIGRpcmVjdG9yeSwgYW5kIG1lcmdlIHRoZSByZXN1bHRpbmcgc3RyZWFtcy5cbiAgICBjb25zdCBzZWFyY2hTdHJlYW0gPSBPYnNlcnZhYmxlLm1lcmdlKGRpcmVjdG9yaWVzLm1hcCgoZGlyLCBpbmRleCkgPT5cbiAgICAgIHNlcnZpY2VzW2luZGV4XS5maW5kSW5Qcm9qZWN0U2VhcmNoKGRpci5nZXRQYXRoKCksIHJlZ2V4LCBvcHRpb25zLmluY2x1c2lvbnMpKSk7XG5cbiAgICAvLyBDcmVhdGUgYSBzdWJqZWN0IHRoYXQgd2UgY2FuIHVzZSB0byB0cmFjayBzZWFyY2ggY29tcGxldGlvbi5cbiAgICBjb25zdCBzZWFyY2hDb21wbGV0aW9uID0gbmV3IFJlcGxheVN1YmplY3QoKTtcbiAgICBzZWFyY2hDb21wbGV0aW9uLm9uTmV4dCgpO1xuXG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc2VhcmNoU3RyZWFtLnN1YnNjcmliZShuZXh0ID0+IHtcbiAgICAgIG9wdGlvbnMuZGlkTWF0Y2gobmV4dCk7XG5cbiAgICAgIC8vIENhbGwgZGlkU2VhcmNoUGF0aHMgd2l0aCB0aGUgbnVtYmVyIG9mIHVuaXF1ZSBmaWxlcyB3ZSBoYXZlIHNlZW4gbWF0Y2hlcyBpbi4gVGhpcyBpc1xuICAgICAgLy8gbm90IHRlY2huaWNhbGx5IGNvcnJlY3QsIGFzIGRpZFNlYXJjaFBhdGhzIGlzIGFsc28gc3VwcG9zZWQgdG8gY291bnQgZmlsZXMgZm9yIHdoaWNoXG4gICAgICAvLyBubyBtYXRjaGVzIHdlcmUgZm91bmQuIEhvd2V2ZXIsIHdlIGN1cnJlbnRseSBoYXZlIG5vIHdheSBvZiBvYnRhaW5pbmcgdGhpcyBpbmZvcm1hdGlvbi5cbiAgICAgIHNlZW5GaWxlcy5hZGQobmV4dC5maWxlUGF0aCk7XG4gICAgICBvcHRpb25zLmRpZFNlYXJjaFBhdGhzKHNlZW5GaWxlcy5zaXplKTtcbiAgICB9LCBlcnJvciA9PiB7XG4gICAgICBzZWFyY2hDb21wbGV0aW9uLm9uRXJyb3IoZXJyb3IpO1xuICAgIH0sICgpID0+IHtcbiAgICAgIHNlYXJjaENvbXBsZXRpb24ub25Db21wbGV0ZWQoKTtcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBvbiBzZWFyY2ggY29tcGxldGlvbi5cbiAgICBjb25zdCBjb21wbGV0aW9uUHJvbWlzZSA9IHNlYXJjaENvbXBsZXRpb24udG9Qcm9taXNlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRoZW46IGNvbXBsZXRpb25Qcm9taXNlLnRoZW4uYmluZChjb21wbGV0aW9uUHJvbWlzZSksXG4gICAgICBjYW5jZWwoKSB7XG4gICAgICAgIC8vIENhbmNlbCB0aGUgc3Vic2NyaXB0aW9uLCB3aGljaCBzaG91bGQgYWxzbyBraWxsIHRoZSBncmVwIHByb2Nlc3MuXG4gICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlcjtcbiJdfQ==
