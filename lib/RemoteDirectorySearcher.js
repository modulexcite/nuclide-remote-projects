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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O2tCQVd3QyxJQUFJOztBQVg1QyxXQUFXLENBQUM7O2VBWVksT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUF2RCxlQUFlLFlBQWYsZUFBZTs7SUF1QmQsdUJBQXVCOzs7OztBQUtoQixXQUxQLHVCQUF1QixDQUtmLGVBQThDLEVBQUU7MEJBTHhELHVCQUF1Qjs7QUFNekIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztHQUN6Qzs7ZUFQRyx1QkFBdUI7O1dBU1QsNEJBQUMsU0FBc0MsRUFBVztBQUNsRSxhQUFPLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNyRDs7O1dBRUssZ0JBQUMsV0FBbUMsRUFBRSxLQUFhLEVBQUUsT0FBZSxFQUF5Qjs7OztBQUVqRyxVQUFJLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDOzs7QUFHMUIsVUFBSSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFBLEdBQUc7ZUFBSSxNQUFLLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztPQUFBLENBQUMsQ0FBQzs7O0FBR2xFLFVBQUksWUFBWSxHQUFHLElBN0NmLFVBQVUsQ0E2Q2dCLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUMsR0FBRyxFQUFFLEtBQUs7ZUFDN0QsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQztPQUFBLENBQUMsQ0FBQyxDQUFDOzs7QUFHbEYsVUFBSSxnQkFBZ0IsR0FBRyxRQWpEUCxhQUFhLEVBaURhLENBQUM7QUFDM0Msc0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7O0FBRTFCLFVBQUksWUFBWSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBQSxJQUFJLEVBQUk7QUFDaEQsZUFBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7QUFLdkIsaUJBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLGVBQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3hDLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDVix3QkFBZ0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDakMsRUFBRSxZQUFNO0FBQ1Asd0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUM7T0FDaEMsQ0FBQyxDQUFDOzs7QUFHSCxVQUFJLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3JELGFBQU87QUFDTCxZQUFJLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztBQUNwRCxjQUFNLEVBQUEsa0JBQUc7O0FBRVAsc0JBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUN4QjtPQUNGLENBQUM7S0FDSDs7O1NBbkRHLHVCQUF1Qjs7O0FBc0Q3QixNQUFNLENBQUMsT0FBTyxHQUFHLHVCQUF1QixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBpMzV6akdwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gJ3J4JztcbnZhciB7UmVtb3RlRGlyZWN0b3J5fSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24nKTtcblxudHlwZSBTZWFyY2hSZXN1bHQgPSB7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIG1hdGNoZXM6IEFycmF5PHtcbiAgICBsaW5lVGV4dDogc3RyaW5nO1xuICAgIGxpbmVUZXh0T2Zmc2V0OiBudW1iZXI7XG4gICAgbWF0Y2hUZXh0OiBzdHJpbmc7XG4gICAgcmFuZ2U6IEFycmF5PEFycmF5PG51bWJlcj4+XG4gIH0+O1xufTtcblxudHlwZSBEaXJlY3RvcnlTZWFyY2hEZWxlZ2F0ZSA9IHtcbiAgZGlkTWF0Y2g6IChyZXN1bHQ6IFNlYXJjaFJlc3VsdCkgPT4gdm9pZDtcbiAgZGlkU2VhcmNoUGF0aHM6IChjb3VudDogbnVtYmVyKSA9PiB2b2lkO1xuICBpbmNsdXNpb25zOiBBcnJheTxzdHJpbmc+O1xufTtcblxudHlwZSBSZW1vdGVEaXJlY3RvcnlTZWFyY2ggPSB7XG4gIHRoZW46IChvbkZ1bGxmaWxsZWQ6IGFueSwgb25SZWplY3RlZDogYW55KSA9PiBQcm9taXNlPGFueT47XG4gIGNhbmNlbDogKCkgPT4gdm9pZDtcbn1cblxuY2xhc3MgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIge1xuICBfc2VydmljZVByb3ZpZGVyOiAoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+IGFueTtcblxuICAvLyBXaGVuIGNvbnN0cnVjdGVkLCBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlciBtdXN0IGJlIHBhc3NlZCBhIGZ1bmN0aW9uIHRoYXRcbiAgLy8gaXQgY2FuIHVzZSB0byBnZXQgYSAnRmluZEluUHJvamVjdFNlcnZpY2UnIGZvciBhIGdpdmVuIHJlbW90ZSBwYXRoLlxuICBjb25zdHJ1Y3RvcihzZXJ2aWNlUHJvdmlkZXI6IChkaXI6IFJlbW90ZURpcmVjdG9yeSkgPT4gYW55KSB7XG4gICAgdGhpcy5fc2VydmljZVByb3ZpZGVyID0gc2VydmljZVByb3ZpZGVyO1xuICB9XG5cbiAgY2FuU2VhcmNoRGlyZWN0b3J5KGRpcmVjdG9yeTogRGlyZWN0b3J5IHwgUmVtb3RlRGlyZWN0b3J5KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIFJlbW90ZURpcmVjdG9yeS5pc1JlbW90ZURpcmVjdG9yeShkaXJlY3RvcnkpO1xuICB9XG5cbiAgc2VhcmNoKGRpcmVjdG9yaWVzOiBBcnJheTxSZW1vdGVEaXJlY3Rvcnk+LCByZWdleDogUmVnRXhwLCBvcHRpb25zOiBPYmplY3QpOiBSZW1vdGVEaXJlY3RvcnlTZWFyY2gge1xuICAgIC8vIFRyYWNrIHRoZSBmaWxlcyB0aGF0IHdlIGhhdmUgc2VlbiB1cGRhdGVzIGZvci5cbiAgICB2YXIgc2VlbkZpbGVzID0gbmV3IFNldCgpO1xuXG4gICAgLy8gR2V0IHRoZSByZW1vdGUgc2VydmljZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGVhY2ggcmVtb3RlIGRpcmVjdG9yeS5cbiAgICB2YXIgc2VydmljZXMgPSBkaXJlY3Rvcmllcy5tYXAoZGlyID0+IHRoaXMuX3NlcnZpY2VQcm92aWRlcihkaXIpKTtcblxuICAgIC8vIFN0YXJ0IHRoZSBzZWFyY2ggaW4gZWFjaCBkaXJlY3RvcnksIGFuZCBtZXJnZSB0aGUgcmVzdWx0aW5nIHN0cmVhbXMuXG4gICAgdmFyIHNlYXJjaFN0cmVhbSA9IE9ic2VydmFibGUubWVyZ2UoZGlyZWN0b3JpZXMubWFwKChkaXIsIGluZGV4KSA9PlxuICAgICAgc2VydmljZXNbaW5kZXhdLmZpbmRJblByb2plY3RTZWFyY2goZGlyLmdldFBhdGgoKSwgcmVnZXgsIG9wdGlvbnMuaW5jbHVzaW9ucykpKTtcblxuICAgIC8vIENyZWF0ZSBhIHN1YmplY3QgdGhhdCB3ZSBjYW4gdXNlIHRvIHRyYWNrIHNlYXJjaCBjb21wbGV0aW9uLlxuICAgIHZhciBzZWFyY2hDb21wbGV0aW9uID0gbmV3IFJlcGxheVN1YmplY3QoKTtcbiAgICBzZWFyY2hDb21wbGV0aW9uLm9uTmV4dCgpO1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlYXJjaFN0cmVhbS5zdWJzY3JpYmUobmV4dCA9PiB7XG4gICAgICBvcHRpb25zLmRpZE1hdGNoKG5leHQpO1xuXG4gICAgICAvLyBDYWxsIGRpZFNlYXJjaFBhdGhzIHdpdGggdGhlIG51bWJlciBvZiB1bmlxdWUgZmlsZXMgd2UgaGF2ZSBzZWVuIG1hdGNoZXMgaW4uIFRoaXMgaXNcbiAgICAgIC8vIG5vdCB0ZWNobmljYWxseSBjb3JyZWN0LCBhcyBkaWRTZWFyY2hQYXRocyBpcyBhbHNvIHN1cHBvc2VkIHRvIGNvdW50IGZpbGVzIGZvciB3aGljaFxuICAgICAgLy8gbm8gbWF0Y2hlcyB3ZXJlIGZvdW5kLiBIb3dldmVyLCB3ZSBjdXJyZW50bHkgaGF2ZSBubyB3YXkgb2Ygb2J0YWluaW5nIHRoaXMgaW5mb3JtYXRpb24uXG4gICAgICBzZWVuRmlsZXMuYWRkKG5leHQuZmlsZVBhdGgpO1xuICAgICAgb3B0aW9ucy5kaWRTZWFyY2hQYXRocyhzZWVuRmlsZXMuc2l6ZSk7XG4gICAgfSwgZXJyb3IgPT4ge1xuICAgICAgc2VhcmNoQ29tcGxldGlvbi5vbkVycm9yKGVycm9yKTtcbiAgICB9LCAoKSA9PiB7XG4gICAgICBzZWFyY2hDb21wbGV0aW9uLm9uQ29tcGxldGVkKCk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb24gc2VhcmNoIGNvbXBsZXRpb24uXG4gICAgdmFyIGNvbXBsZXRpb25Qcm9taXNlID0gc2VhcmNoQ29tcGxldGlvbi50b1Byb21pc2UoKTtcbiAgICByZXR1cm4ge1xuICAgICAgdGhlbjogY29tcGxldGlvblByb21pc2UudGhlbi5iaW5kKGNvbXBsZXRpb25Qcm9taXNlKSxcbiAgICAgIGNhbmNlbCgpIHtcbiAgICAgICAgLy8gQ2FuY2VsIHRoZSBzdWJzY3JpcHRpb24sIHdoaWNoIHNob3VsZCBhbHNvIGtpbGwgdGhlIGdyZXAgcHJvY2Vzcy5cbiAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyO1xuIl19
