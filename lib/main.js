var createRemoteConnection = _asyncToGenerator(function* (remoteProjectConfig) {
  var RemoteConnection = getRemoteConnection();

  var connection = yield RemoteConnection.createConnectionBySavedConfig(remoteProjectConfig.host, remoteProjectConfig.cwd);

  if (connection) {
    return connection;
  }

  // If connection fails using saved config, open connect dialog.

  var _require = require('nuclide-ssh-dialog');

  var openConnectionDialog = _require.openConnectionDialog;

  return openConnectionDialog({
    initialServer: remoteProjectConfig.host,
    initialCwd: remoteProjectConfig.cwd
  });
});

/**
 * The same TextEditor must be returned to prevent Atom from creating multiple tabs
 * for the same file, because Atom doesn't cache pending opener promises.
 */

var createEditorForNuclide = _asyncToGenerator(function* (connection, uri) {
  var existingEditor = atom.workspace.getTextEditors().filter(function (textEditor) {
    return textEditor.getPath() === uri;
  })[0];
  var buffer = null;
  if (existingEditor) {
    buffer = existingEditor.getBuffer();
  } else {
    var NuclideTextBuffer = require('./NuclideTextBuffer');
    buffer = new NuclideTextBuffer(connection, { filePath: uri });
    buffer.setEncoding(atom.config.get('core.fileEncoding'));
    try {
      yield buffer.load();
    } catch (err) {
      getLogger().warn('buffer load issue:', err);
      throw err;
    }
  }

  var textEditorParams = { buffer: buffer };
  return (0, _nuclideAtomHelpers.createTextEditor)(textEditorParams);
}

/**
 * Check if the remote buffer has already been initialized in editor.
 * This checks if the buffer is instance of NuclideTextBuffer.
 */
);

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _nuclideAtomHelpers = require('nuclide-atom-helpers');

var _utils = require('./utils');

var _atom = require('atom');

/**
 * Stores the host and cwd of a remote connection.
 */
'use babel';

var packageSubscriptions = null;
var controller = null;

var CLOSE_PROJECT_DELAY_MS = 100;
var pendingFiles = {};

var logger = null;
function getLogger() {
  return logger || (logger = require('nuclide-logging').getLogger());
}

var RemoteConnection = null;
function getRemoteConnection() {
  return RemoteConnection || (RemoteConnection = require('nuclide-remote-connection').RemoteConnection);
}

function createSerializableRemoteConnectionConfiguration(config) {
  return {
    host: config.host,
    cwd: config.cwd
  };
}

function addRemoteFolderToProject(connection) {
  var workingDirectoryUri = connection.getUriForInitialWorkingDirectory();
  // If restoring state, then the project already exists with local directory and wrong repo
  // instances. Hence, we remove it here, if existing, and add the new path for which we added a
  // workspace opener handler.
  atom.project.removePath(workingDirectoryUri);

  atom.project.addPath(workingDirectoryUri);

  var subscription = atom.project.onDidChangePaths(function () {
    // Delay closing the underlying socket connection until registered subscriptions have closed.
    // We should never depend on the order of registration of the `onDidChangePaths` event,
    // which also dispose consumed service's resources.
    setTimeout(checkClosedProject, CLOSE_PROJECT_DELAY_MS);
  });

  function checkClosedProject() {
    // The project paths may have changed during the delay time.
    // Hence, the latest project paths are fetched here.
    var paths = atom.project.getPaths();
    if (paths.indexOf(workingDirectoryUri) !== -1) {
      return;
    }
    // The project was removed from the tree.
    subscription.dispose();

    closeOpenFilesForRemoteProject(connection.getConfig());

    var hostname = connection.getRemoteHostname();
    if (getRemoteConnection().getByHostname(hostname).length > 1) {
      getLogger().info('Remaining remote projects using Nuclide Server - no prompt to shutdown');
      connection.close();
      return;
    }

    var buttons = ['Keep It', 'Shutdown'];
    var buttonToActions = new Map();

    buttonToActions.set(buttons[0], function () {
      return connection.close();
    });
    buttonToActions.set(buttons[1], _asyncToGenerator(function* () {
      yield connection.getService('InfoService').shutdownServer();
      connection.close();
      return;
    }));

    if (atom.config.get('nuclide-remote-projects.shutdownServerAfterDisconnection')) {
      // Atom takes the first button in the list as default option.
      buttons.reverse();
    }

    var choice = atom.confirm({
      message: 'No more remote projects on the host: \'' + hostname + '\'. Would you like to shutdown Nuclide server there?',
      buttons: buttons
    });

    buttonToActions.get(buttons[choice])();
  }
}

function closeOpenFilesForRemoteProject(remoteProjectConfig) {
  var openInstances = (0, _utils.getOpenFileEditorForRemoteProject)(remoteProjectConfig);
  for (var openInstance of openInstances) {
    var editor = openInstance.editor;
    var pane = openInstance.pane;

    pane.removeItem(editor);
  }
}

function getRemoteRootDirectories() {
  // TODO: Use nuclide-remote-uri instead.
  return atom.project.getDirectories().filter(function (directory) {
    return directory.getPath().startsWith('nuclide:');
  });
}

/**
 * Removes any Directory (not RemoteDirectory) objects that have Nuclide
 * remote URIs.
 */
function deleteDummyRemoteRootDirectories() {
  var _require2 = require('nuclide-remote-connection');

  var RemoteDirectory = _require2.RemoteDirectory;

  var _require3 = require('nuclide-remote-uri');

  var isRemote = _require3.isRemote;

  for (var directory of atom.project.getDirectories()) {
    if (isRemote(directory.getPath()) && !RemoteDirectory.isRemoteDirectory(directory)) {
      atom.project.removePath(directory.getPath());
    }
  }
}function isRemoteBufferInitialized(editor) {
  var buffer = editor.getBuffer();
  if (buffer && buffer.constructor.name === 'NuclideTextBuffer') {
    return true;
  }
  return false;
}

module.exports = {

  // $FlowIssue https://github.com/facebook/flow/issues/620
  config: require('../package.json').nuclide.config,

  activate: function activate(state) {
    var subscriptions = new _atom.CompositeDisposable();

    var RemoteProjectsController = require('./RemoteProjectsController');
    controller = new RemoteProjectsController();

    subscriptions.add(getRemoteConnection().onDidAddRemoteConnection(function (connection) {
      addRemoteFolderToProject(connection);

      // On Atom restart, it tries to open uri paths as local `TextEditor` pane items.
      // Here, Nuclide reloads the remote project files that have empty text editors open.
      var config = connection.getConfig();
      var openInstances = (0, _utils.getOpenFileEditorForRemoteProject)(config);

      var _loop = function (openInstance) {
        // Keep the original open editor item with a unique name until the remote buffer is loaded,
        // Then, we are ready to replace it with the remote tab in the same pane.
        var pane = openInstance.pane;
        var editor = openInstance.editor;
        var uri = openInstance.uri;
        var filePath = openInstance.filePath;

        // Skip restoring the editer who has remote content loaded.
        if (isRemoteBufferInitialized(editor)) {
          return 'continue';
        }

        // Here, a unique uri is picked to the pending open pane item to maintain the pane layout.
        // Otherwise, the open won't be completed because there exists a pane item with the same
        // uri.
        editor.getBuffer().file.path = uri + '.to-close';
        // Cleanup the old pane item on successful opening or when no connection could be
        // established.
        var cleanupBuffer = function cleanupBuffer() {
          return pane.removeItem(editor);
        };
        if (filePath === config.cwd) {
          cleanupBuffer();
        } else {
          // If we clean up the buffer before the `openUriInPane` finishes,
          // the pane will be closed, because it could have no other items.
          // So we must clean up after.
          atom.workspace.openURIInPane(uri, pane).then(cleanupBuffer, cleanupBuffer);
        }
      };

      for (var openInstance of openInstances) {
        var _ret = _loop(openInstance);

        if (_ret === 'continue') continue;
      }
    }));

    subscriptions.add(atom.commands.add('atom-workspace', 'nuclide-remote-projects:connect', function () {
      return require('nuclide-ssh-dialog').openConnectionDialog();
    }));

    // Subscribe opener before restoring the remote projects.
    subscriptions.add(atom.workspace.addOpener(function () {
      var uri = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      if (uri.startsWith('nuclide:')) {
        var connection = getRemoteConnection().getForUri(uri);
        // On Atom restart, it tries to open the uri path as a file tab because it's not a local
        // directory. We can't let that create a file with the initial working directory path.
        if (connection && uri !== connection.getUriForInitialWorkingDirectory()) {
          if (pendingFiles[uri]) {
            return pendingFiles[uri];
          }
          var textEditorPromise = pendingFiles[uri] = createEditorForNuclide(connection, uri);
          var removeFromCache = function removeFromCache() {
            return delete pendingFiles[uri];
          };
          textEditorPromise.then(removeFromCache, removeFromCache);
          return textEditorPromise;
        }
      }
    }));

    // Don't do require or any other expensive operations in activate().
    subscriptions.add(atom.packages.onDidActivateInitialPackages(function () {
      // RemoteDirectoryProvider will be called before this.
      // If RemoteDirectoryProvider failed to provide a RemoteDirectory for a
      // given URI, Atom will create a generic Directory to wrap that. We want
      // to delete these instead, because those directories aren't valid/useful
      // if they are not true RemoteDirectory objects (connected to a real
      // real remote folder).
      deleteDummyRemoteRootDirectories();

      // Remove remote projects added in case of reloads.
      // We already have their connection config stored.
      var remoteProjectsConfigAsDeserializedJson = state && state.remoteProjectsConfig || [];
      remoteProjectsConfigAsDeserializedJson.forEach(_asyncToGenerator(function* (config) {
        var connection = yield createRemoteConnection(config);
        if (!connection) {
          getLogger().info('No RemoteConnection returned on restore state trial:', config.host, config.cwd);
        }
      }));
      // Clear obsolete config.
      atom.config.set('nuclide.remoteProjectsConfig', []);
    }));

    packageSubscriptions = subscriptions;
  },

  consumeStatusBar: function consumeStatusBar(statusBar) {
    if (controller) {
      controller.consumeStatusBar(statusBar);
    }
  },

  // TODO: All of the elements of the array are non-null, but it does not seem possible to convince
  // Flow of that.
  serialize: function serialize() {
    var remoteProjectsConfig = getRemoteRootDirectories().map(function (directory) {
      var connection = getRemoteConnection().getForUri(directory.getPath());
      return connection ? createSerializableRemoteConnectionConfiguration(connection.getConfig()) : null;
    }).filter(function (config) {
      return config != null;
    });
    return {
      remoteProjectsConfig: remoteProjectsConfig
    };
  },

  deactivate: function deactivate() {
    if (packageSubscriptions) {
      packageSubscriptions.dispose();
      packageSubscriptions = null;
    }

    if (controller != null) {
      controller.destroy();
      controller = null;
    }
  },

  createRemoteDirectoryProvider: function createRemoteDirectoryProvider() {
    var RemoteDirectoryProvider = require('./RemoteDirectoryProvider');
    return new RemoteDirectoryProvider();
  },

  createRemoteDirectorySearcher: function createRemoteDirectorySearcher() {
    var _require4 = require('nuclide-client');

    var getServiceByNuclideUri = _require4.getServiceByNuclideUri;

    var _require5 = require('nuclide-remote-connection');

    var RemoteDirectory = _require5.RemoteDirectory;

    var RemoteDirectorySearcher = require('./RemoteDirectorySearcher');
    return new RemoteDirectorySearcher(function (dir) {
      return getServiceByNuclideUri('FindInProjectService', dir.getPath());
    });
  },

  getHomeFragments: function getHomeFragments() {
    return {
      feature: {
        title: 'Remote Connection',
        icon: 'cloud-upload',
        description: 'Connect to a remote server to edit files.',
        command: 'nuclide-remote-projects:connect'
      },
      priority: 8
    };
  }

};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiSUFxRGUsc0JBQXNCLHFCQUFyQyxXQUNFLG1CQUE4RCxFQUNsQztBQUM1QixNQUFNLGdCQUFnQixHQUFHLG1CQUFtQixFQUFFLENBQUM7O0FBRS9DLE1BQU0sVUFBVSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsNkJBQTZCLENBQ3JFLG1CQUFtQixDQUFDLElBQUksRUFDeEIsbUJBQW1CLENBQUMsR0FBRyxDQUN4QixDQUFDOztBQUVGLE1BQUksVUFBVSxFQUFFO0FBQ2QsV0FBTyxVQUFVLENBQUM7R0FDbkI7Ozs7aUJBRzhCLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzs7TUFBckQsb0JBQW9CLFlBQXBCLG9CQUFvQjs7QUFDM0IsU0FBTyxvQkFBb0IsQ0FBQztBQUMxQixpQkFBYSxFQUFFLG1CQUFtQixDQUFDLElBQUk7QUFDdkMsY0FBVSxFQUFFLG1CQUFtQixDQUFDLEdBQUc7R0FDcEMsQ0FBQyxDQUFDO0NBQ0o7Ozs7Ozs7SUFpR2Msc0JBQXNCLHFCQUFyQyxXQUNFLFVBQTRCLEVBQzVCLEdBQVcsRUFDVTtBQUNyQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUMxRSxXQUFPLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxHQUFHLENBQUM7R0FDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sTUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLE1BQUksY0FBYyxFQUFFO0FBQ2xCLFVBQU0sR0FBRyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7R0FDckMsTUFBTTtBQUNMLFFBQU0saUJBQWlCLEdBQUcs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O0FBRUQsWUFBVSxFQUFBLHNCQUFTO0FBQ2pCLFFBQUksb0JBQW9CLEVBQUU7QUFDeEIsMEJBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDL0IsMEJBQW9CLEdBQUcsSUFBSSxDQUFDO0tBQzdCOztBQUVELFFBQUksVUFBVSxJQUFJLElBQUksRUFBRTtBQUN0QixnQkFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLGdCQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ25CO0dBQ0Y7O0FBRUQsK0JBQTZCLEVBQUEseUNBQTRCO0FBQ3ZELFFBQU0sdUJBQXVCLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDckUsV0FBTyxJQUFJLHVCQUF1QixFQUFFLENBQUM7R0FDdEM7O0FBRUQsK0JBQTZCLEVBQUEseUNBQTRCO29CQUN0QixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O1FBQW5ELHNCQUFzQixhQUF0QixzQkFBc0I7O29CQUNILE9BQU8sQ0FBQywyQkFBMkIsQ0FBQzs7UUFBdkQsZUFBZSxhQUFmLGVBQWU7O0FBQ3RCLFFBQU0sdUJBQXVCLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDckUsV0FBTyxJQUFJLHVCQUF1QixDQUFDLFVBQUMsR0FBRzthQUNyQyxzQkFBc0IsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7S0FBQSxDQUFDLENBQUM7R0FDbEU7O0FBRUQsa0JBQWdCLEVBQUEsNEJBQWtCO0FBQ2hDLFdBQU87QUFDTCxhQUFPLEVBQUU7QUFDUCxhQUFLLEVBQUUsbUJBQW1CO0FBQzFCLFlBQUksRUFBRSxjQUFjO0FBQ3BCLG1CQUFXLEVBQUUsMkNBQTJDO0FBQ3hELGVBQU8sRUFBRSxpQ0FBaUM7T0FDM0M7QUFDRCxjQUFRLEVBQUUsQ0FBQztLQUNaLENBQUM7R0FDSDs7Q0FFRixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIFJlbW90ZVByb2plY3RzQ29udHJvbGxlciBmcm9tICcuL1JlbW90ZVByb2plY3RzQ29udHJvbGxlcic7XG5pbXBvcnQgdHlwZSB7SG9tZUZyYWdtZW50c30gZnJvbSAnbnVjbGlkZS1ob21lLWludGVyZmFjZXMnO1xuaW1wb3J0IHR5cGUge1JlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9ufSBmcm9tICdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL2xpYi9SZW1vdGVDb25uZWN0aW9uJztcblxuaW1wb3J0IHtjcmVhdGVUZXh0RWRpdG9yfSBmcm9tICdudWNsaWRlLWF0b20taGVscGVycyc7XG5pbXBvcnQge2dldE9wZW5GaWxlRWRpdG9yRm9yUmVtb3RlUHJvamVjdH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ2F0b20nO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgaG9zdCBhbmQgY3dkIG9mIGEgcmVtb3RlIGNvbm5lY3Rpb24uXG4gKi9cbnR5cGUgU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gIGhvc3Q6IHN0cmluZztcbiAgY3dkOiBzdHJpbmc7XG59XG5cbmxldCBwYWNrYWdlU3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGUgPSBudWxsO1xubGV0IGNvbnRyb2xsZXI6ID9SZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIgPSBudWxsO1xuXG5jb25zdCBDTE9TRV9QUk9KRUNUX0RFTEFZX01TID0gMTAwO1xuY29uc3QgcGVuZGluZ0ZpbGVzID0ge307XG5cbmxldCBsb2dnZXIgPSBudWxsO1xuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICByZXR1cm4gbG9nZ2VyIHx8IChsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKSk7XG59XG5cbmxldCBSZW1vdGVDb25uZWN0aW9uID0gbnVsbDtcbmZ1bmN0aW9uIGdldFJlbW90ZUNvbm5lY3Rpb24oKSB7XG4gIHJldHVybiBSZW1vdGVDb25uZWN0aW9uIHx8XG4gICAgKFJlbW90ZUNvbm5lY3Rpb24gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJykuUmVtb3RlQ29ubmVjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uKFxuICBjb25maWc6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uLFxuKTogU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24ge1xuICByZXR1cm4ge1xuICAgIGhvc3Q6IGNvbmZpZy5ob3N0LFxuICAgIGN3ZDogY29uZmlnLmN3ZCxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlUmVtb3RlQ29ubmVjdGlvbihcbiAgcmVtb3RlUHJvamVjdENvbmZpZzogU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24sXG4pOiBQcm9taXNlPD9SZW1vdGVDb25uZWN0aW9uPiB7XG4gIGNvbnN0IFJlbW90ZUNvbm5lY3Rpb24gPSBnZXRSZW1vdGVDb25uZWN0aW9uKCk7XG5cbiAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IFJlbW90ZUNvbm5lY3Rpb24uY3JlYXRlQ29ubmVjdGlvbkJ5U2F2ZWRDb25maWcoXG4gICAgcmVtb3RlUHJvamVjdENvbmZpZy5ob3N0LFxuICAgIHJlbW90ZVByb2plY3RDb25maWcuY3dkLFxuICApO1xuXG4gIGlmIChjb25uZWN0aW9uKSB7XG4gICAgcmV0dXJuIGNvbm5lY3Rpb247XG4gIH1cblxuICAvLyBJZiBjb25uZWN0aW9uIGZhaWxzIHVzaW5nIHNhdmVkIGNvbmZpZywgb3BlbiBjb25uZWN0IGRpYWxvZy5cbiAgY29uc3Qge29wZW5Db25uZWN0aW9uRGlhbG9nfSA9IHJlcXVpcmUoJ251Y2xpZGUtc3NoLWRpYWxvZycpO1xuICByZXR1cm4gb3BlbkNvbm5lY3Rpb25EaWFsb2coe1xuICAgIGluaXRpYWxTZXJ2ZXI6IHJlbW90ZVByb2plY3RDb25maWcuaG9zdCxcbiAgICBpbml0aWFsQ3dkOiByZW1vdGVQcm9qZWN0Q29uZmlnLmN3ZCxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW90ZUZvbGRlclRvUHJvamVjdChjb25uZWN0aW9uOiBSZW1vdGVDb25uZWN0aW9uKSB7XG4gIGNvbnN0IHdvcmtpbmdEaXJlY3RvcnlVcmkgPSBjb25uZWN0aW9uLmdldFVyaUZvckluaXRpYWxXb3JraW5nRGlyZWN0b3J5KCk7XG4gIC8vIElmIHJlc3RvcmluZyBzdGF0ZSwgdGhlbiB0aGUgcHJvamVjdCBhbHJlYWR5IGV4aXN0cyB3aXRoIGxvY2FsIGRpcmVjdG9yeSBhbmQgd3JvbmcgcmVwb1xuICAvLyBpbnN0YW5jZXMuIEhlbmNlLCB3ZSByZW1vdmUgaXQgaGVyZSwgaWYgZXhpc3RpbmcsIGFuZCBhZGQgdGhlIG5ldyBwYXRoIGZvciB3aGljaCB3ZSBhZGRlZCBhXG4gIC8vIHdvcmtzcGFjZSBvcGVuZXIgaGFuZGxlci5cbiAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgod29ya2luZ0RpcmVjdG9yeVVyaSk7XG5cbiAgYXRvbS5wcm9qZWN0LmFkZFBhdGgod29ya2luZ0RpcmVjdG9yeVVyaSk7XG5cbiAgY29uc3Qgc3Vic2NyaXB0aW9uID0gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKCkgPT4ge1xuICAgIC8vIERlbGF5IGNsb3NpbmcgdGhlIHVuZGVybHlpbmcgc29ja2V0IGNvbm5lY3Rpb24gdW50aWwgcmVnaXN0ZXJlZCBzdWJzY3JpcHRpb25zIGhhdmUgY2xvc2VkLlxuICAgIC8vIFdlIHNob3VsZCBuZXZlciBkZXBlbmQgb24gdGhlIG9yZGVyIG9mIHJlZ2lzdHJhdGlvbiBvZiB0aGUgYG9uRGlkQ2hhbmdlUGF0aHNgIGV2ZW50LFxuICAgIC8vIHdoaWNoIGFsc28gZGlzcG9zZSBjb25zdW1lZCBzZXJ2aWNlJ3MgcmVzb3VyY2VzLlxuICAgIHNldFRpbWVvdXQoY2hlY2tDbG9zZWRQcm9qZWN0LCBDTE9TRV9QUk9KRUNUX0RFTEFZX01TKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gY2hlY2tDbG9zZWRQcm9qZWN0KCkge1xuICAgIC8vIFRoZSBwcm9qZWN0IHBhdGhzIG1heSBoYXZlIGNoYW5nZWQgZHVyaW5nIHRoZSBkZWxheSB0aW1lLlxuICAgIC8vIEhlbmNlLCB0aGUgbGF0ZXN0IHByb2plY3QgcGF0aHMgYXJlIGZldGNoZWQgaGVyZS5cbiAgICBjb25zdCBwYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xuICAgIGlmIChwYXRocy5pbmRleE9mKHdvcmtpbmdEaXJlY3RvcnlVcmkpICE9PSAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUaGUgcHJvamVjdCB3YXMgcmVtb3ZlZCBmcm9tIHRoZSB0cmVlLlxuICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG5cbiAgICBjbG9zZU9wZW5GaWxlc0ZvclJlbW90ZVByb2plY3QoY29ubmVjdGlvbi5nZXRDb25maWcoKSk7XG5cbiAgICBjb25zdCBob3N0bmFtZSA9IGNvbm5lY3Rpb24uZ2V0UmVtb3RlSG9zdG5hbWUoKTtcbiAgICBpZiAoZ2V0UmVtb3RlQ29ubmVjdGlvbigpLmdldEJ5SG9zdG5hbWUoaG9zdG5hbWUpLmxlbmd0aCA+IDEpIHtcbiAgICAgIGdldExvZ2dlcigpLmluZm8oJ1JlbWFpbmluZyByZW1vdGUgcHJvamVjdHMgdXNpbmcgTnVjbGlkZSBTZXJ2ZXIgLSBubyBwcm9tcHQgdG8gc2h1dGRvd24nKTtcbiAgICAgIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gWydLZWVwIEl0JywgJ1NodXRkb3duJ107XG4gICAgY29uc3QgYnV0dG9uVG9BY3Rpb25zID0gbmV3IE1hcCgpO1xuXG4gICAgYnV0dG9uVG9BY3Rpb25zLnNldChidXR0b25zWzBdLCAoKSA9PiBjb25uZWN0aW9uLmNsb3NlKCkpO1xuICAgIGJ1dHRvblRvQWN0aW9ucy5zZXQoYnV0dG9uc1sxXSwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgY29ubmVjdGlvbi5nZXRTZXJ2aWNlKCdJbmZvU2VydmljZScpLnNodXRkb3duU2VydmVyKCk7XG4gICAgICBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfSk7XG5cbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFxuICAgICAgJ251Y2xpZGUtcmVtb3RlLXByb2plY3RzLnNodXRkb3duU2VydmVyQWZ0ZXJEaXNjb25uZWN0aW9uJyxcbiAgICApKSB7XG4gICAgICAvLyBBdG9tIHRha2VzIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIGxpc3QgYXMgZGVmYXVsdCBvcHRpb24uXG4gICAgICBidXR0b25zLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjaG9pY2UgPSBhdG9tLmNvbmZpcm0oe1xuICAgICAgbWVzc2FnZTogJ05vIG1vcmUgcmVtb3RlIHByb2plY3RzIG9uIHRoZSBob3N0OiBcXCcnICsgaG9zdG5hbWUgK1xuICAgICAgICAnXFwnLiBXb3VsZCB5b3UgbGlrZSB0byBzaHV0ZG93biBOdWNsaWRlIHNlcnZlciB0aGVyZT8nLFxuICAgICAgYnV0dG9ucyxcbiAgICB9KTtcblxuICAgIGJ1dHRvblRvQWN0aW9ucy5nZXQoYnV0dG9uc1tjaG9pY2VdKSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNsb3NlT3BlbkZpbGVzRm9yUmVtb3RlUHJvamVjdChyZW1vdGVQcm9qZWN0Q29uZmlnOiBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbik6IHZvaWQge1xuICBjb25zdCBvcGVuSW5zdGFuY2VzID0gZ2V0T3BlbkZpbGVFZGl0b3JGb3JSZW1vdGVQcm9qZWN0KHJlbW90ZVByb2plY3RDb25maWcpO1xuICBmb3IgKGNvbnN0IG9wZW5JbnN0YW5jZSBvZiBvcGVuSW5zdGFuY2VzKSB7XG4gICAgY29uc3Qge2VkaXRvciwgcGFuZX0gPSBvcGVuSW5zdGFuY2U7XG4gICAgcGFuZS5yZW1vdmVJdGVtKGVkaXRvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVtb3RlUm9vdERpcmVjdG9yaWVzKCk6IEFycmF5PGF0b20kRGlyZWN0b3J5PiB7XG4gIC8vIFRPRE86IFVzZSBudWNsaWRlLXJlbW90ZS11cmkgaW5zdGVhZC5cbiAgcmV0dXJuIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLmZpbHRlcihcbiAgICBkaXJlY3RvcnkgPT4gZGlyZWN0b3J5LmdldFBhdGgoKS5zdGFydHNXaXRoKCdudWNsaWRlOicpKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFueSBEaXJlY3RvcnkgKG5vdCBSZW1vdGVEaXJlY3RvcnkpIG9iamVjdHMgdGhhdCBoYXZlIE51Y2xpZGVcbiAqIHJlbW90ZSBVUklzLlxuICovXG5mdW5jdGlvbiBkZWxldGVEdW1teVJlbW90ZVJvb3REaXJlY3RvcmllcygpIHtcbiAgY29uc3Qge1JlbW90ZURpcmVjdG9yeX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJyk7XG4gIGNvbnN0IHtpc1JlbW90ZX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKTtcbiAgZm9yIChjb25zdCBkaXJlY3Rvcnkgb2YgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkpIHtcbiAgICBpZiAoaXNSZW1vdGUoZGlyZWN0b3J5LmdldFBhdGgoKSkgJiZcbiAgICAgICAgIShSZW1vdGVEaXJlY3RvcnkuaXNSZW1vdGVEaXJlY3RvcnkoZGlyZWN0b3J5KSkpIHtcbiAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKGRpcmVjdG9yeS5nZXRQYXRoKCkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRoZSBzYW1lIFRleHRFZGl0b3IgbXVzdCBiZSByZXR1cm5lZCB0byBwcmV2ZW50IEF0b20gZnJvbSBjcmVhdGluZyBtdWx0aXBsZSB0YWJzXG4gKiBmb3IgdGhlIHNhbWUgZmlsZSwgYmVjYXVzZSBBdG9tIGRvZXNuJ3QgY2FjaGUgcGVuZGluZyBvcGVuZXIgcHJvbWlzZXMuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUVkaXRvckZvck51Y2xpZGUoXG4gIGNvbm5lY3Rpb246IFJlbW90ZUNvbm5lY3Rpb24sXG4gIHVyaTogc3RyaW5nLFxuKTogUHJvbWlzZTxUZXh0RWRpdG9yPiB7XG4gIGNvbnN0IGV4aXN0aW5nRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5maWx0ZXIodGV4dEVkaXRvciA9PiB7XG4gICAgcmV0dXJuIHRleHRFZGl0b3IuZ2V0UGF0aCgpID09PSB1cmk7XG4gIH0pWzBdO1xuICBsZXQgYnVmZmVyID0gbnVsbDtcbiAgaWYgKGV4aXN0aW5nRWRpdG9yKSB7XG4gICAgYnVmZmVyID0gZXhpc3RpbmdFZGl0b3IuZ2V0QnVmZmVyKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgTnVjbGlkZVRleHRCdWZmZXIgPSByZXF1aXJlKCcuL051Y2xpZGVUZXh0QnVmZmVyJyk7XG4gICAgYnVmZmVyID0gbmV3IE51Y2xpZGVUZXh0QnVmZmVyKGNvbm5lY3Rpb24sIHtmaWxlUGF0aDogdXJpfSk7XG4gICAgYnVmZmVyLnNldEVuY29kaW5nKGF0b20uY29uZmlnLmdldCgnY29yZS5maWxlRW5jb2RpbmcnKSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGJ1ZmZlci5sb2FkKCk7XG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIGdldExvZ2dlcigpLndhcm4oJ2J1ZmZlciBsb2FkIGlzc3VlOicsIGVycik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdGV4dEVkaXRvclBhcmFtcyA9IHtidWZmZXJ9O1xuICByZXR1cm4gY3JlYXRlVGV4dEVkaXRvcih0ZXh0RWRpdG9yUGFyYW1zKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgcmVtb3RlIGJ1ZmZlciBoYXMgYWxyZWFkeSBiZWVuIGluaXRpYWxpemVkIGluIGVkaXRvci5cbiAqIFRoaXMgY2hlY2tzIGlmIHRoZSBidWZmZXIgaXMgaW5zdGFuY2Ugb2YgTnVjbGlkZVRleHRCdWZmZXIuXG4gKi9cbmZ1bmN0aW9uIGlzUmVtb3RlQnVmZmVySW5pdGlhbGl6ZWQoZWRpdG9yOiBUZXh0RWRpdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgaWYgKGJ1ZmZlciAmJiBidWZmZXIuY29uc3RydWN0b3IubmFtZSA9PT0gJ051Y2xpZGVUZXh0QnVmZmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLy8gJEZsb3dJc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svZmxvdy9pc3N1ZXMvNjIwXG4gIGNvbmZpZzogcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJykubnVjbGlkZS5jb25maWcsXG5cbiAgYWN0aXZhdGUoc3RhdGU6ID97cmVtb3RlUHJvamVjdHNDb25maWc6IFNlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uW119KTogdm9pZCB7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICBjb25zdCBSZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIgPSByZXF1aXJlKCcuL1JlbW90ZVByb2plY3RzQ29udHJvbGxlcicpO1xuICAgIGNvbnRyb2xsZXIgPSBuZXcgUmVtb3RlUHJvamVjdHNDb250cm9sbGVyKCk7XG5cbiAgICBzdWJzY3JpcHRpb25zLmFkZChnZXRSZW1vdGVDb25uZWN0aW9uKCkub25EaWRBZGRSZW1vdGVDb25uZWN0aW9uKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgYWRkUmVtb3RlRm9sZGVyVG9Qcm9qZWN0KGNvbm5lY3Rpb24pO1xuXG5cbiAgICAgIC8vIE9uIEF0b20gcmVzdGFydCwgaXQgdHJpZXMgdG8gb3BlbiB1cmkgcGF0aHMgYXMgbG9jYWwgYFRleHRFZGl0b3JgIHBhbmUgaXRlbXMuXG4gICAgICAvLyBIZXJlLCBOdWNsaWRlIHJlbG9hZHMgdGhlIHJlbW90ZSBwcm9qZWN0IGZpbGVzIHRoYXQgaGF2ZSBlbXB0eSB0ZXh0IGVkaXRvcnMgb3Blbi5cbiAgICAgIGNvbnN0IGNvbmZpZyA9IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCk7XG4gICAgICBjb25zdCBvcGVuSW5zdGFuY2VzID0gZ2V0T3BlbkZpbGVFZGl0b3JGb3JSZW1vdGVQcm9qZWN0KGNvbmZpZyk7XG4gICAgICBmb3IgKGNvbnN0IG9wZW5JbnN0YW5jZSBvZiBvcGVuSW5zdGFuY2VzKSB7XG4gICAgICAgIC8vIEtlZXAgdGhlIG9yaWdpbmFsIG9wZW4gZWRpdG9yIGl0ZW0gd2l0aCBhIHVuaXF1ZSBuYW1lIHVudGlsIHRoZSByZW1vdGUgYnVmZmVyIGlzIGxvYWRlZCxcbiAgICAgICAgLy8gVGhlbiwgd2UgYXJlIHJlYWR5IHRvIHJlcGxhY2UgaXQgd2l0aCB0aGUgcmVtb3RlIHRhYiBpbiB0aGUgc2FtZSBwYW5lLlxuICAgICAgICBjb25zdCB7cGFuZSwgZWRpdG9yLCB1cmksIGZpbGVQYXRofSA9IG9wZW5JbnN0YW5jZTtcblxuICAgICAgICAvLyBTa2lwIHJlc3RvcmluZyB0aGUgZWRpdGVyIHdobyBoYXMgcmVtb3RlIGNvbnRlbnQgbG9hZGVkLlxuICAgICAgICBpZiAoaXNSZW1vdGVCdWZmZXJJbml0aWFsaXplZChlZGl0b3IpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIZXJlLCBhIHVuaXF1ZSB1cmkgaXMgcGlja2VkIHRvIHRoZSBwZW5kaW5nIG9wZW4gcGFuZSBpdGVtIHRvIG1haW50YWluIHRoZSBwYW5lIGxheW91dC5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB0aGUgb3BlbiB3b24ndCBiZSBjb21wbGV0ZWQgYmVjYXVzZSB0aGVyZSBleGlzdHMgYSBwYW5lIGl0ZW0gd2l0aCB0aGUgc2FtZVxuICAgICAgICAvLyB1cmkuXG4gICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5maWxlLnBhdGggPSBgJHt1cml9LnRvLWNsb3NlYDtcbiAgICAgICAgLy8gQ2xlYW51cCB0aGUgb2xkIHBhbmUgaXRlbSBvbiBzdWNjZXNzZnVsIG9wZW5pbmcgb3Igd2hlbiBubyBjb25uZWN0aW9uIGNvdWxkIGJlXG4gICAgICAgIC8vIGVzdGFibGlzaGVkLlxuICAgICAgICBjb25zdCBjbGVhbnVwQnVmZmVyID0gKCkgPT4gcGFuZS5yZW1vdmVJdGVtKGVkaXRvcik7XG4gICAgICAgIGlmIChmaWxlUGF0aCA9PT0gY29uZmlnLmN3ZCkge1xuICAgICAgICAgIGNsZWFudXBCdWZmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiB3ZSBjbGVhbiB1cCB0aGUgYnVmZmVyIGJlZm9yZSB0aGUgYG9wZW5VcmlJblBhbmVgIGZpbmlzaGVzLFxuICAgICAgICAgIC8vIHRoZSBwYW5lIHdpbGwgYmUgY2xvc2VkLCBiZWNhdXNlIGl0IGNvdWxkIGhhdmUgbm8gb3RoZXIgaXRlbXMuXG4gICAgICAgICAgLy8gU28gd2UgbXVzdCBjbGVhbiB1cCBhZnRlci5cbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lKHVyaSwgcGFuZSkudGhlbihjbGVhbnVwQnVmZmVyLCBjbGVhbnVwQnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgICAnbnVjbGlkZS1yZW1vdGUtcHJvamVjdHM6Y29ubmVjdCcsXG4gICAgICAgICgpID0+IHJlcXVpcmUoJ251Y2xpZGUtc3NoLWRpYWxvZycpLm9wZW5Db25uZWN0aW9uRGlhbG9nKClcbiAgICApKTtcblxuICAgIC8vIFN1YnNjcmliZSBvcGVuZXIgYmVmb3JlIHJlc3RvcmluZyB0aGUgcmVtb3RlIHByb2plY3RzLlxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpID0gJycpID0+IHtcbiAgICAgIGlmICh1cmkuc3RhcnRzV2l0aCgnbnVjbGlkZTonKSkge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gZ2V0UmVtb3RlQ29ubmVjdGlvbigpLmdldEZvclVyaSh1cmkpO1xuICAgICAgICAvLyBPbiBBdG9tIHJlc3RhcnQsIGl0IHRyaWVzIHRvIG9wZW4gdGhlIHVyaSBwYXRoIGFzIGEgZmlsZSB0YWIgYmVjYXVzZSBpdCdzIG5vdCBhIGxvY2FsXG4gICAgICAgIC8vIGRpcmVjdG9yeS4gV2UgY2FuJ3QgbGV0IHRoYXQgY3JlYXRlIGEgZmlsZSB3aXRoIHRoZSBpbml0aWFsIHdvcmtpbmcgZGlyZWN0b3J5IHBhdGguXG4gICAgICAgIGlmIChjb25uZWN0aW9uICYmIHVyaSAhPT0gY29ubmVjdGlvbi5nZXRVcmlGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgaWYgKHBlbmRpbmdGaWxlc1t1cmldKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVuZGluZ0ZpbGVzW3VyaV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHRleHRFZGl0b3JQcm9taXNlID0gcGVuZGluZ0ZpbGVzW3VyaV0gPSBjcmVhdGVFZGl0b3JGb3JOdWNsaWRlKGNvbm5lY3Rpb24sIHVyaSk7XG4gICAgICAgICAgY29uc3QgcmVtb3ZlRnJvbUNhY2hlID0gKCkgPT4gZGVsZXRlIHBlbmRpbmdGaWxlc1t1cmldO1xuICAgICAgICAgIHRleHRFZGl0b3JQcm9taXNlLnRoZW4ocmVtb3ZlRnJvbUNhY2hlLCByZW1vdmVGcm9tQ2FjaGUpO1xuICAgICAgICAgIHJldHVybiB0ZXh0RWRpdG9yUHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8vIERvbid0IGRvIHJlcXVpcmUgb3IgYW55IG90aGVyIGV4cGVuc2l2ZSBvcGVyYXRpb25zIGluIGFjdGl2YXRlKCkuXG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5wYWNrYWdlcy5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzKCgpID0+IHtcbiAgICAgIC8vIFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSB0aGlzLlxuICAgICAgLy8gSWYgUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIgZmFpbGVkIHRvIHByb3ZpZGUgYSBSZW1vdGVEaXJlY3RvcnkgZm9yIGFcbiAgICAgIC8vIGdpdmVuIFVSSSwgQXRvbSB3aWxsIGNyZWF0ZSBhIGdlbmVyaWMgRGlyZWN0b3J5IHRvIHdyYXAgdGhhdC4gV2Ugd2FudFxuICAgICAgLy8gdG8gZGVsZXRlIHRoZXNlIGluc3RlYWQsIGJlY2F1c2UgdGhvc2UgZGlyZWN0b3JpZXMgYXJlbid0IHZhbGlkL3VzZWZ1bFxuICAgICAgLy8gaWYgdGhleSBhcmUgbm90IHRydWUgUmVtb3RlRGlyZWN0b3J5IG9iamVjdHMgKGNvbm5lY3RlZCB0byBhIHJlYWxcbiAgICAgIC8vIHJlYWwgcmVtb3RlIGZvbGRlcikuXG4gICAgICBkZWxldGVEdW1teVJlbW90ZVJvb3REaXJlY3RvcmllcygpO1xuXG4gICAgICAvLyBSZW1vdmUgcmVtb3RlIHByb2plY3RzIGFkZGVkIGluIGNhc2Ugb2YgcmVsb2Fkcy5cbiAgICAgIC8vIFdlIGFscmVhZHkgaGF2ZSB0aGVpciBjb25uZWN0aW9uIGNvbmZpZyBzdG9yZWQuXG4gICAgICBjb25zdCByZW1vdGVQcm9qZWN0c0NvbmZpZ0FzRGVzZXJpYWxpemVkSnNvbjogU2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb25bXSA9XG4gICAgICAgIChzdGF0ZSAmJiBzdGF0ZS5yZW1vdGVQcm9qZWN0c0NvbmZpZykgfHwgW107XG4gICAgICByZW1vdGVQcm9qZWN0c0NvbmZpZ0FzRGVzZXJpYWxpemVkSnNvbi5mb3JFYWNoKGFzeW5jIGNvbmZpZyA9PiB7XG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBjcmVhdGVSZW1vdGVDb25uZWN0aW9uKGNvbmZpZyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbikge1xuICAgICAgICAgIGdldExvZ2dlcigpLmluZm8oXG4gICAgICAgICAgICAnTm8gUmVtb3RlQ29ubmVjdGlvbiByZXR1cm5lZCBvbiByZXN0b3JlIHN0YXRlIHRyaWFsOicsXG4gICAgICAgICAgICBjb25maWcuaG9zdCxcbiAgICAgICAgICAgIGNvbmZpZy5jd2QsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyBDbGVhciBvYnNvbGV0ZSBjb25maWcuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ251Y2xpZGUucmVtb3RlUHJvamVjdHNDb25maWcnLCBbXSk7XG4gICAgfSkpO1xuXG4gICAgcGFja2FnZVN1YnNjcmlwdGlvbnMgPSBzdWJzY3JpcHRpb25zO1xuICB9LFxuXG4gIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnRyb2xsZXIuY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXIpO1xuICAgIH1cbiAgfSxcblxuICAvLyBUT0RPOiBBbGwgb2YgdGhlIGVsZW1lbnRzIG9mIHRoZSBhcnJheSBhcmUgbm9uLW51bGwsIGJ1dCBpdCBkb2VzIG5vdCBzZWVtIHBvc3NpYmxlIHRvIGNvbnZpbmNlXG4gIC8vIEZsb3cgb2YgdGhhdC5cbiAgc2VyaWFsaXplKCk6IHtyZW1vdGVQcm9qZWN0c0NvbmZpZzogQXJyYXk8P1NlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uPn0ge1xuICAgIGNvbnN0IHJlbW90ZVByb2plY3RzQ29uZmlnOiBBcnJheTw/U2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24+ID1cbiAgICAgIGdldFJlbW90ZVJvb3REaXJlY3RvcmllcygpXG4gICAgICAgIC5tYXAoKGRpcmVjdG9yeTogYXRvbSREaXJlY3RvcnkpOiA/U2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24gPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBnZXRSZW1vdGVDb25uZWN0aW9uKCkuZ2V0Rm9yVXJpKGRpcmVjdG9yeS5nZXRQYXRoKCkpO1xuICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uID9cbiAgICAgICAgICAgIGNyZWF0ZVNlcmlhbGl6YWJsZVJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uKGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkpIDogbnVsbDtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbHRlcigoY29uZmlnOiA/U2VyaWFsaXphYmxlUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pID0+IGNvbmZpZyAhPSBudWxsKTtcbiAgICByZXR1cm4ge1xuICAgICAgcmVtb3RlUHJvamVjdHNDb25maWcsXG4gICAgfTtcbiAgfSxcblxuICBkZWFjdGl2YXRlKCk6IHZvaWQge1xuICAgIGlmIChwYWNrYWdlU3Vic2NyaXB0aW9ucykge1xuICAgICAgcGFja2FnZVN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgcGFja2FnZVN1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChjb250cm9sbGVyICE9IG51bGwpIHtcbiAgICAgIGNvbnRyb2xsZXIuZGVzdHJveSgpO1xuICAgICAgY29udHJvbGxlciA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZVJlbW90ZURpcmVjdG9yeVByb3ZpZGVyKCk6IFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyIHtcbiAgICBjb25zdCBSZW1vdGVEaXJlY3RvcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXInKTtcbiAgICByZXR1cm4gbmV3IFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyKCk7XG4gIH0sXG5cbiAgY3JlYXRlUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIoKTogUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIge1xuICAgIGNvbnN0IHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gICAgY29uc3Qge1JlbW90ZURpcmVjdG9yeX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJyk7XG4gICAgY29uc3QgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIgPSByZXF1aXJlKCcuL1JlbW90ZURpcmVjdG9yeVNlYXJjaGVyJyk7XG4gICAgcmV0dXJuIG5ldyBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlcigoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+XG4gICAgICBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGaW5kSW5Qcm9qZWN0U2VydmljZScsIGRpci5nZXRQYXRoKCkpKTtcbiAgfSxcblxuICBnZXRIb21lRnJhZ21lbnRzKCk6IEhvbWVGcmFnbWVudHMge1xuICAgIHJldHVybiB7XG4gICAgICBmZWF0dXJlOiB7XG4gICAgICAgIHRpdGxlOiAnUmVtb3RlIENvbm5lY3Rpb24nLFxuICAgICAgICBpY29uOiAnY2xvdWQtdXBsb2FkJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb25uZWN0IHRvIGEgcmVtb3RlIHNlcnZlciB0byBlZGl0IGZpbGVzLicsXG4gICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLXJlbW90ZS1wcm9qZWN0czpjb25uZWN0JyxcbiAgICAgIH0sXG4gICAgICBwcmlvcml0eTogOCxcbiAgICB9O1xuICB9LFxuXG59O1xuIl19
