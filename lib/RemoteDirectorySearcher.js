
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

      var isCancelled = false;
      var promise = new Promise(function (resolve, reject) {
        var seenFiles = new Set(); // The files that we have seen updates for.
        var onUpdate = function onUpdate(requestId, update) {
          // Ensure that this update is for one of our current requests.
          if (myRequests && myRequests.indexOf(requestId) === -1) {
            return;
          }

          options.didMatch(update);

          // Call didSearchPaths with the number of unique files we have seen matches in. This is
          // not technically correct, as didSearchPaths is also supposed to count files for which
          // no matches were found. However, we currently have no way of obtaining this information.
          seenFiles.add(update.filePath);
          options.didSearchPaths(seenFiles.size);
        };

        var myRequests = null; // We don't yet know what our search ids are.
        var completedRequests = new Set(); // Keep track of completed search ids.
        var onCompleted = function onCompleted(requestId) {
          completedRequests.add(requestId);

          // Check if we've recieved our search id's, and that every search id is completed.
          var complete = myRequests && myRequests.every(function (request) {
            return completedRequests.has(request);
          });
          if (complete) {
            // If all searches are complete.
            // Unsubscribe from events.
            updateDisposables.forEach(function (disposable) {
              return disposable.dispose();
            });
            completionDisposables.forEach(function (disposable) {
              return disposable.dispose();
            });

            // Reject the promise if the search was cancelled, otherwise resolve.
            (isCancelled ? reject : resolve)(null);
          }
        };

        // Get the remote service that corresponds to each remote directory.
        var services = directories.map(function (dir) {
          return _this._serviceProvider(dir);
        });

        // Subscribe to file update and search completion update.
        var updateDisposables = services.map(function (service) {
          return service.onMatchesUpdate(onUpdate);
        });
        var completionDisposables = services.map(function (service) {
          return service.onSearchCompleted(onCompleted);
        });

        // Start the search in each given directory, getting a list of requestIds.
        var searchIdPromises = directories.map(function (dir, index) {
          return services[index].search(dir.getPath(), regex.source, !regex.ignoreCase, options.inclusions);
        });

        // Resolve all of the searchIds, and then wait for their completion.
        Promise.all(searchIdPromises).then(function (searchIds) {
          myRequests = searchIds; // Store our search Ids.
        });
      });

      // Return a thenable object with a 'cancel' function that can end a search.
      return {
        then: promise.then.bind(promise),
        cancel: function cancel() {
          isCancelled = true;
        }
      };
    }
  }]);

  return RemoteDirectorySearcher;
})();

module.exports = RemoteDirectorySearcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdZLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQzs7SUFBdkQsZUFBZSxZQUFmLGVBQWU7O0lBa0JkLHVCQUF1Qjs7Ozs7QUFLaEIsV0FMUCx1QkFBdUIsQ0FLZixlQUE4QyxFQUFFOzBCQUx4RCx1QkFBdUI7O0FBTXpCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7R0FDekM7O2VBUEcsdUJBQXVCOztXQVNULDRCQUFDLFNBQXNDLEVBQVc7QUFDbEUsYUFBTyxlQUFlLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDckQ7OztXQUVLLGdCQUFDLFdBQW1DLEVBQUUsS0FBYSxFQUFFLE9BQWUsRUFBeUI7OztBQUNqRyxVQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDeEIsVUFBSSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQzdDLFlBQUksU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDMUIsWUFBSSxRQUFRLEdBQUcsU0FBWCxRQUFRLENBQUksU0FBUyxFQUFFLE1BQU0sRUFBSzs7QUFFcEMsY0FBSSxVQUFVLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUN0RCxtQkFBTztXQUNSOztBQUVELGlCQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7OztBQUt6QixtQkFBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDL0IsaUJBQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hDLENBQUM7O0FBRUYsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLFlBQUksaUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNsQyxZQUFJLFdBQVcsR0FBRyxTQUFkLFdBQVcsQ0FBRyxTQUFTLEVBQUk7QUFDN0IsMkJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7QUFHakMsY0FBSSxRQUFRLEdBQUcsVUFBVSxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBQSxPQUFPO21CQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7V0FBQSxDQUFDLENBQUM7QUFDekYsY0FBSSxRQUFRLEVBQUU7OztBQUVaLDZCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFBLFVBQVU7cUJBQUksVUFBVSxDQUFDLE9BQU8sRUFBRTthQUFBLENBQUMsQ0FBQztBQUM5RCxpQ0FBcUIsQ0FBQyxPQUFPLENBQUMsVUFBQSxVQUFVO3FCQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUU7YUFBQSxDQUFDLENBQUM7OztBQUdsRSxhQUFDLFdBQVcsR0FBRyxNQUFNLEdBQUcsT0FBTyxDQUFBLENBQUUsSUFBSSxDQUFDLENBQUM7V0FDeEM7U0FDRixDQUFDOzs7QUFHRixZQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRztpQkFBSSxNQUFLLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztTQUFBLENBQUMsQ0FBQzs7O0FBR2xFLFlBQUksaUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLE9BQU87aUJBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUM7U0FBQSxDQUFDLENBQUM7QUFDbkYsWUFBSSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUEsT0FBTztpQkFBSSxPQUFPLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO1NBQUEsQ0FBQyxDQUFDOzs7QUFHNUYsWUFBSSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUMsR0FBRyxFQUFFLEtBQUs7aUJBQ2hELFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUM7U0FBQSxDQUFDLENBQUM7OztBQUc5RixlQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsU0FBUyxFQUFJO0FBQzlDLG9CQUFVLEdBQUcsU0FBUyxDQUFDO1NBQ3hCLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7O0FBR0gsYUFBTztBQUNMLFlBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDaEMsY0FBTSxFQUFBLGtCQUFHO0FBQ1AscUJBQVcsR0FBRyxJQUFJLENBQUM7U0FDcEI7T0FDRixDQUFDO0tBQ0g7OztTQXpFRyx1QkFBdUI7OztBQTRFN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL1JlbW90ZURpcmVjdG9yeVNlYXJjaGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtSZW1vdGVEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xuXG50eXBlIFNlYXJjaFJlc3VsdCA9IHtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgbWF0Y2hlczogQXJyYXk8e2xpbmVUZXh0OiBzdHJpbmc7IGxpbmVUZXh0T2Zmc2V0OiBudW1iZXI7IG1hdGNoVGV4dDogc3RyaW5nOyByYW5nZTogQXJyYXk8QXJyYXk8bnVtYmVyPj59Pjtcbn07XG5cbnR5cGUgRGlyZWN0b3J5U2VhcmNoRGVsZWdhdGUgPSB7XG4gIGRpZE1hdGNoOiAocmVzdWx0OiBTZWFyY2hSZXN1bHQpID0+IHZvaWQ7XG4gIGRpZFNlYXJjaFBhdGhzOiAoY291bnQ6IG51bWJlcikgPT4gdm9pZDtcbiAgaW5jbHVzaW9uczogQXJyYXk8c3RyaW5nPjtcbn07XG5cbnR5cGUgUmVtb3RlRGlyZWN0b3J5U2VhcmNoID0ge1xuICB0aGVuOiAob25GdWxsZmlsbGVkOiBhbnksIG9uUmVqZWN0ZWQ6IGFueSkgPT4gUHJvbWlzZTxhbnk+O1xuICBjYW5jZWw6ICgpID0+IHZvaWQ7XG59XG5cbmNsYXNzIFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyIHtcbiAgX3NlcnZpY2VQcm92aWRlcjogKGRpcjogUmVtb3RlRGlyZWN0b3J5KSA9PiBhbnk7XG5cbiAgLy8gV2hlbiBjb25zdHJ1Y3RlZCwgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIgbXVzdCBiZSBwYXNzZWQgYSBmdW5jdGlvbiB0aGF0XG4gIC8vIGl0IGNhbiB1c2UgdG8gZ2V0IGEgJ0ZpbmRJblByb2plY3RTZXJ2aWNlJyBmb3IgYSBnaXZlbiByZW1vdGUgcGF0aC5cbiAgY29uc3RydWN0b3Ioc2VydmljZVByb3ZpZGVyOiAoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+IGFueSkge1xuICAgIHRoaXMuX3NlcnZpY2VQcm92aWRlciA9IHNlcnZpY2VQcm92aWRlcjtcbiAgfVxuXG4gIGNhblNlYXJjaERpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSB8IFJlbW90ZURpcmVjdG9yeSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBSZW1vdGVEaXJlY3RvcnkuaXNSZW1vdGVEaXJlY3RvcnkoZGlyZWN0b3J5KTtcbiAgfVxuXG4gIHNlYXJjaChkaXJlY3RvcmllczogQXJyYXk8UmVtb3RlRGlyZWN0b3J5PiwgcmVnZXg6IFJlZ0V4cCwgb3B0aW9uczogT2JqZWN0KTogUmVtb3RlRGlyZWN0b3J5U2VhcmNoIHtcbiAgICB2YXIgaXNDYW5jZWxsZWQgPSBmYWxzZTtcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHZhciBzZWVuRmlsZXMgPSBuZXcgU2V0KCk7IC8vIFRoZSBmaWxlcyB0aGF0IHdlIGhhdmUgc2VlbiB1cGRhdGVzIGZvci5cbiAgICAgIHZhciBvblVwZGF0ZSA9IChyZXF1ZXN0SWQsIHVwZGF0ZSkgPT4ge1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIHVwZGF0ZSBpcyBmb3Igb25lIG9mIG91ciBjdXJyZW50IHJlcXVlc3RzLlxuICAgICAgICBpZiAobXlSZXF1ZXN0cyAmJiBteVJlcXVlc3RzLmluZGV4T2YocmVxdWVzdElkKSA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zLmRpZE1hdGNoKHVwZGF0ZSk7XG5cbiAgICAgICAgLy8gQ2FsbCBkaWRTZWFyY2hQYXRocyB3aXRoIHRoZSBudW1iZXIgb2YgdW5pcXVlIGZpbGVzIHdlIGhhdmUgc2VlbiBtYXRjaGVzIGluLiBUaGlzIGlzXG4gICAgICAgIC8vIG5vdCB0ZWNobmljYWxseSBjb3JyZWN0LCBhcyBkaWRTZWFyY2hQYXRocyBpcyBhbHNvIHN1cHBvc2VkIHRvIGNvdW50IGZpbGVzIGZvciB3aGljaFxuICAgICAgICAvLyBubyBtYXRjaGVzIHdlcmUgZm91bmQuIEhvd2V2ZXIsIHdlIGN1cnJlbnRseSBoYXZlIG5vIHdheSBvZiBvYnRhaW5pbmcgdGhpcyBpbmZvcm1hdGlvbi5cbiAgICAgICAgc2VlbkZpbGVzLmFkZCh1cGRhdGUuZmlsZVBhdGgpO1xuICAgICAgICBvcHRpb25zLmRpZFNlYXJjaFBhdGhzKHNlZW5GaWxlcy5zaXplKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBteVJlcXVlc3RzID0gbnVsbDsgLy8gV2UgZG9uJ3QgeWV0IGtub3cgd2hhdCBvdXIgc2VhcmNoIGlkcyBhcmUuXG4gICAgICB2YXIgY29tcGxldGVkUmVxdWVzdHMgPSBuZXcgU2V0KCk7IC8vIEtlZXAgdHJhY2sgb2YgY29tcGxldGVkIHNlYXJjaCBpZHMuXG4gICAgICB2YXIgb25Db21wbGV0ZWQgPSByZXF1ZXN0SWQgPT4ge1xuICAgICAgICBjb21wbGV0ZWRSZXF1ZXN0cy5hZGQocmVxdWVzdElkKTtcblxuICAgICAgICAvLyBDaGVjayBpZiB3ZSd2ZSByZWNpZXZlZCBvdXIgc2VhcmNoIGlkJ3MsIGFuZCB0aGF0IGV2ZXJ5IHNlYXJjaCBpZCBpcyBjb21wbGV0ZWQuXG4gICAgICAgIHZhciBjb21wbGV0ZSA9IG15UmVxdWVzdHMgJiYgbXlSZXF1ZXN0cy5ldmVyeShyZXF1ZXN0ID0+IGNvbXBsZXRlZFJlcXVlc3RzLmhhcyhyZXF1ZXN0KSk7XG4gICAgICAgIGlmIChjb21wbGV0ZSkgeyAvLyBJZiBhbGwgc2VhcmNoZXMgYXJlIGNvbXBsZXRlLlxuICAgICAgICAgIC8vIFVuc3Vic2NyaWJlIGZyb20gZXZlbnRzLlxuICAgICAgICAgIHVwZGF0ZURpc3Bvc2FibGVzLmZvckVhY2goZGlzcG9zYWJsZSA9PiBkaXNwb3NhYmxlLmRpc3Bvc2UoKSk7XG4gICAgICAgICAgY29tcGxldGlvbkRpc3Bvc2FibGVzLmZvckVhY2goZGlzcG9zYWJsZSA9PiBkaXNwb3NhYmxlLmRpc3Bvc2UoKSk7XG5cbiAgICAgICAgICAvLyBSZWplY3QgdGhlIHByb21pc2UgaWYgdGhlIHNlYXJjaCB3YXMgY2FuY2VsbGVkLCBvdGhlcndpc2UgcmVzb2x2ZS5cbiAgICAgICAgICAoaXNDYW5jZWxsZWQgPyByZWplY3QgOiByZXNvbHZlKShudWxsKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gR2V0IHRoZSByZW1vdGUgc2VydmljZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGVhY2ggcmVtb3RlIGRpcmVjdG9yeS5cbiAgICAgIHZhciBzZXJ2aWNlcyA9IGRpcmVjdG9yaWVzLm1hcChkaXIgPT4gdGhpcy5fc2VydmljZVByb3ZpZGVyKGRpcikpO1xuXG4gICAgICAvLyBTdWJzY3JpYmUgdG8gZmlsZSB1cGRhdGUgYW5kIHNlYXJjaCBjb21wbGV0aW9uIHVwZGF0ZS5cbiAgICAgIHZhciB1cGRhdGVEaXNwb3NhYmxlcyA9IHNlcnZpY2VzLm1hcChzZXJ2aWNlID0+IHNlcnZpY2Uub25NYXRjaGVzVXBkYXRlKG9uVXBkYXRlKSk7XG4gICAgICB2YXIgY29tcGxldGlvbkRpc3Bvc2FibGVzID0gc2VydmljZXMubWFwKHNlcnZpY2UgPT4gc2VydmljZS5vblNlYXJjaENvbXBsZXRlZChvbkNvbXBsZXRlZCkpO1xuXG4gICAgICAvLyBTdGFydCB0aGUgc2VhcmNoIGluIGVhY2ggZ2l2ZW4gZGlyZWN0b3J5LCBnZXR0aW5nIGEgbGlzdCBvZiByZXF1ZXN0SWRzLlxuICAgICAgdmFyIHNlYXJjaElkUHJvbWlzZXMgPSBkaXJlY3Rvcmllcy5tYXAoKGRpciwgaW5kZXgpID0+XG4gICAgICAgIHNlcnZpY2VzW2luZGV4XS5zZWFyY2goZGlyLmdldFBhdGgoKSwgcmVnZXguc291cmNlLCAhcmVnZXguaWdub3JlQ2FzZSwgb3B0aW9ucy5pbmNsdXNpb25zKSk7XG5cbiAgICAgIC8vIFJlc29sdmUgYWxsIG9mIHRoZSBzZWFyY2hJZHMsIGFuZCB0aGVuIHdhaXQgZm9yIHRoZWlyIGNvbXBsZXRpb24uXG4gICAgICBQcm9taXNlLmFsbChzZWFyY2hJZFByb21pc2VzKS50aGVuKHNlYXJjaElkcyA9PiB7XG4gICAgICAgIG15UmVxdWVzdHMgPSBzZWFyY2hJZHM7IC8vIFN0b3JlIG91ciBzZWFyY2ggSWRzLlxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gYSB0aGVuYWJsZSBvYmplY3Qgd2l0aCBhICdjYW5jZWwnIGZ1bmN0aW9uIHRoYXQgY2FuIGVuZCBhIHNlYXJjaC5cbiAgICByZXR1cm4ge1xuICAgICAgdGhlbjogcHJvbWlzZS50aGVuLmJpbmQocHJvbWlzZSksXG4gICAgICBjYW5jZWwoKSB7XG4gICAgICAgIGlzQ2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXI7XG4iXX0=
