var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var createRemoteConnection = _asyncToGenerator(function* (remoteProjectConfig) {
  var RemoteConnection = getRemoteConnection();

  try {
    var connection = new RemoteConnection(restoreClientKey(remoteProjectConfig));
    yield connection.initialize();
    return connection;
  } catch (e) {
    // If connection fails using saved config, open connect dialog.

    var _require2 = require('nuclide-ssh-dialog');

    var openConnectionDialog = _require2.openConnectionDialog;

    return openConnectionDialog({
      initialServer: remoteProjectConfig.host,
      initialCwd: remoteProjectConfig.cwd
    });
  }
});

/**
 * Restore a nuclide project state from a serialized state of the remote connection config.
 */

var restoreNuclideProjectState = _asyncToGenerator(function* (remoteProjectConfig) {
  // TODO use the rest of the config for the connection dialog.
  var projectHostname = remoteProjectConfig.host;
  var projectDirectory = remoteProjectConfig.cwd;

  // try to re-connect, then, add the project to atom.project and the tree.
  var connection = yield createRemoteConnection(remoteProjectConfig);
  if (!connection) {
    getLogger().info('No RemoteConnection returned on restore state trial:', projectHostname, projectDirectory);
  }
  // Reload the project files that have empty text editors/buffers open.
  var closedUris = closeOpenFilesForRemoteProject(remoteProjectConfig);
  // On Atom restart, it tries to open the uri path as a file tab because it's not a local directory.
  // Hence, we close it in the cleanup, because we have the needed connection config saved
  // with the last opened files in the package state.
  if (connection) {
    closedUris.forEach(function (uri) {
      return atom.workspace.open(uri);
    });
  }
});

/**
 * The same TextEditor must be returned to prevent Atom from creating multiple tabs
 * for the same file, because Atom doesn't cache pending opener promises.
 */

var createEditorForNuclide = _asyncToGenerator(function* (connection, uri) {
  var NuclideTextBuffer = require('./NuclideTextBuffer');

  var buffer = new NuclideTextBuffer(connection, { filePath: uri });
  buffer.setEncoding(atom.config.get('core.fileEncoding'));
  try {
    yield buffer.load();
  } catch (err) {
    getLogger().warn('buffer load issue:', err);
    throw err;
  }
  return new TextEditor( /*editorOptions*/{ buffer: buffer, registerEditor: true });
}

/**
 * Encrypts the clientKey of a RemoteConnectionConfiguration.
 * @param remoteProjectConfig - The config with the clientKey we want encrypted.
 * @return returns the passed in config with the clientKey encrypted.
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

'use babel';

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var TextEditor = _require.TextEditor;

var subscriptions = null;
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

function addRemoteFolderToProject(connection) {
  var workingDirectoryUri = connection.getUriForInitialWorkingDirectory();
  // If restoring state, then the project already exists with local directory and wrong repo instances.
  // Hence, we remove it here, if existing, and add the new path for which we added a workspace opener handler.
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
      return connection.close();
    }

    var choice = atom.confirm({
      message: 'No more remote projects on the host: \'' + hostname + '\'. Would you like to shutdown Nuclide server there?',
      buttons: ['Shutdown', 'Keep It']
    });
    if (choice === 1) {
      return connection.close();
    }
    if (choice === 0) {
      connection.getClient().shutdownServer();
      return connection.close();
    }
  }
}

function closeOpenFilesForRemoteProject(remoteProjectConfig) {
  var _require3 = require('nuclide-atom-helpers');

  var closeTabForBuffer = _require3.closeTabForBuffer;

  var _require4 = require('./utils');

  var sanitizeNuclideUri = _require4.sanitizeNuclideUri;
  var projectHostname = remoteProjectConfig.host;
  var projectDirectory = remoteProjectConfig.cwd;

  var closedUris = [];
  atom.workspace.getTextEditors().forEach(function (editor) {
    var rawUrl = editor.getURI();
    if (!rawUrl) {
      return;
    }
    var uri = sanitizeNuclideUri(rawUrl);

    var _require$parse = require('nuclide-remote-uri').parse(uri);

    var fileHostname = _require$parse.hostname;
    var filePath = _require$parse.path;

    if (fileHostname === projectHostname && filePath.startsWith(projectDirectory)) {
      closeTabForBuffer(editor.getBuffer());
      if (filePath !== projectDirectory) {
        closedUris.push(uri);
      }
    }
  });
  return closedUris;
}

function cleanupRemoteNuclideProjects() {
  getRemoteRootDirectories().forEach(function (directory) {
    return atom.project.removePath(directory.getPath());
  });
}

function getRemoteRootDirectories() {
  return atom.project.getDirectories().filter(function (directory) {
    return directory.getPath().startsWith('nuclide:');
  });
}function protectClientKey(remoteProjectConfig) {
  var _require5 = require('nuclide-keytar-wrapper');

  var replacePassword = _require5.replacePassword;

  var crypto = require('crypto');

  var sha1 = crypto.createHash('sha1');
  sha1.update(remoteProjectConfig.host + ':' + remoteProjectConfig.port);
  var sha1sum = sha1.digest('hex');

  var _encryptString = encryptString(remoteProjectConfig.clientKey);

  var salt = _encryptString.salt;
  var password = _encryptString.password;
  var encryptedString = _encryptString.encryptedString;

  replacePassword('nuclide.remoteProjectConfig', sha1sum, '' + password);

  remoteProjectConfig.clientKey = encryptedString + '.' + salt;

  return remoteProjectConfig;
}

/**
 * Decrypts the clientKey of a RemoteConnectionConfiguration.
 * @param remoteProjectConfig - The config with the clientKey we want encrypted.
 * @return returns the passed in config with the clientKey encrypted.
 */
function restoreClientKey(remoteProjectConfig) {
  var _require6 = require('nuclide-keytar-wrapper');

  var getPassword = _require6.getPassword;

  var crypto = require('crypto');

  var sha1 = crypto.createHash('sha1');
  sha1.update(remoteProjectConfig.host + ':' + remoteProjectConfig.port);
  var sha1sum = sha1.digest('hex');

  var password = getPassword('nuclide.remoteProjectConfig', sha1sum);

  if (!password) {
    throw new Error('Cannot find password for encrypted client key');
  }

  var salt;
  var clientKey;

  var _remoteProjectConfig$clientKey$split = remoteProjectConfig.clientKey.split('.');

  var _remoteProjectConfig$clientKey$split2 = _slicedToArray(_remoteProjectConfig$clientKey$split, 2);

  clientKey = _remoteProjectConfig$clientKey$split2[0];
  salt = _remoteProjectConfig$clientKey$split2[1];

  if (!clientKey || !salt) {
    throw new Error('Cannot decrypt client key');
  }

  remoteProjectConfig.clientKey = decryptString(clientKey, password, salt);

  return remoteProjectConfig;
}

function decryptString(text, password, salt) {
  var crypto = require('crypto');

  var decipher = crypto.createDecipheriv('aes-128-cbc', new Buffer(password, 'base64'), new Buffer(salt, 'base64'));

  var decryptedString = decipher.update(text, 'base64', 'utf8');
  decryptedString += decipher.final('utf8');

  return decryptedString;
}

function encryptString(text) {
  var crypto = require('crypto');
  var password = crypto.randomBytes(16).toString('base64');
  var salt = crypto.randomBytes(16).toString('base64');

  var cipher = crypto.createCipheriv('aes-128-cbc', new Buffer(password, 'base64'), new Buffer(salt, 'base64'));

  var encryptedString = cipher.update(text, 'utf8', 'base64');
  encryptedString += cipher.final('base64');

  return {
    password: password,
    salt: salt,
    encryptedString: encryptedString
  };
}

module.exports = {
  __test__: {
    decryptString: decryptString,
    encryptString: encryptString
  },

  activate: function activate(state) {
    subscriptions = new CompositeDisposable();

    var RemoteProjectsController = require('./RemoteProjectsController');
    controller = new RemoteProjectsController();

    subscriptions.add(getRemoteConnection().onDidAddRemoteConnection(function (connection) {
      addRemoteFolderToProject(connection);
    }));

    // Don't do require or any other expensive operations in activate().
    subscriptions.add(atom.packages.onDidActivateInitialPackages(function () {
      // Subscribe opener before restoring the remote projects.
      subscriptions.add(atom.workspace.addOpener(function () {
        var uri = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        if (uri.startsWith('nuclide:')) {
          var connection = getRemoteConnection().getForUri(uri);
          // On Atom restart, it tries to open the uri path as a file tab because it's not a local directory.
          // We can't let that create a file with the initial working directory path.
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
      subscriptions.add(atom.commands.add('atom-workspace', 'nuclide-remote-projects:connect', function () {
        return require('nuclide-ssh-dialog').openConnectionDialog();
      }));

      // Remove remote projects added in case of reloads.
      // We already have their connection config stored.
      var remoteProjectsConfig = state && state.remoteProjectsConfig || [];
      remoteProjectsConfig.forEach(restoreNuclideProjectState);
      // Clear obsolete config.
      atom.config.set('nuclide.remoteProjectsConfig', []);
    }));
  },

  consumeStatusBar: function consumeStatusBar(statusBar) {
    if (controller) {
      controller.consumeStatusBar(statusBar);
    }
  },

  serialize: function serialize() {
    var remoteProjectsConfig = getRemoteRootDirectories().map(function (directory) {
      var connection = getRemoteConnection().getForUri(directory.getPath());
      return connection && protectClientKey(connection.getConfig());
    }).filter(function (config) {
      return !!config;
    });
    return {
      remoteProjectsConfig: remoteProjectsConfig
    };
  },

  deactivate: function deactivate() {
    // This should always be true here, but we do this to appease Flow.
    if (subscriptions) {
      subscriptions.dispose();
      subscriptions = null;
    }
  },

  createRemoteDirectoryProvider: function createRemoteDirectoryProvider() {
    var RemoteDirectoryProvider = require('./RemoteDirectoryProvider');
    return new RemoteDirectoryProvider();
  },

  createRemoteDirectorySearcher: function createRemoteDirectorySearcher() {
    var _require7 = require('nuclide-client');

    var getServiceByNuclideUri = _require7.getServiceByNuclideUri;

    var _require8 = require('nuclide-remote-connection');

    var RemoteDirectory = _require8.RemoteDirectory;

    var RemoteDirectorySearcher = require('./RemoteDirectorySearcher');
    return new RemoteDirectorySearcher(function (dir) {
      return getServiceByNuclideUri('FindInProjectService', dir.getPath());
    });
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBBaFdZYXVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztJQStCZSxzQkFBc0IscUJBQXJDLFdBQXNDLG1CQUFrRCxFQUE4QjtBQUNwSCxNQUFJLGdCQUFnQixHQUFHLG1CQUFtQixFQUFFLENBQUM7O0FBRTdDLE1BQUk7QUFDRixRQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUM3RSxVQUFNLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUM5QixXQUFPLFVBQVUsQ0FBQztHQUNuQixDQUFDLE9BQU8sQ0FBQyxFQUFFOzs7b0JBRW1CLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzs7UUFBckQsb0JBQW9CLGFBQXBCLG9CQUFvQjs7QUFDekIsV0FBTyxvQkFBb0IsQ0FBQztBQUMxQixtQkFBYSxFQUFFLG1CQUFtQixDQUFDLElBQUk7QUFDdkMsZ0JBQVUsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHO0tBQ3BDLENBQUMsQ0FBQztHQUNKO0NBQ0Y7Ozs7OztJQTJFYywwQkFBMEIscUJBQXpDLFdBQTBDLG1CQUFrRCxFQUFFOztNQUVqRixlQUFlLEdBQTJCLG1CQUFtQixDQUFuRSxJQUFJO01BQXdCLGdCQUFnQixHQUFJLG1CQUFtQixDQUE1QyxHQUFHOzs7QUFFL0IsTUFBSSxVQUFVLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25FLE1BQUksQ0FBQyxVQUFVLEVBQUU7QUFDZixhQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0RBQXNELEVBQUUsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7R0FDN0c7O0FBRUQsTUFBSSxVQUFVLEdBQUcsOEJBQThCLENBQUMsbUJBQW1C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O0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMvdzEvXzJtYzZtMDUwcW4yMzJucHNmOXozaGZzaDU4X2poL1QvdG1wQWhXWWF1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSBSZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIgZnJvbSAnLi9SZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXInO1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIFRleHRFZGl0b3J9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG52YXIgc3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGUgPSBudWxsO1xudmFyIGNvbnRyb2xsZXI6ID9SZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIgPSBudWxsO1xudmFyIENMT1NFX1BST0pFQ1RfREVMQVlfTVMgPSAxMDA7XG5cbnZhciBwZW5kaW5nRmlsZXMgPSB7fTtcblxudmFyIGxvZ2dlciA9IG51bGw7XG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIHJldHVybiBsb2dnZXIgfHwgKGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpKTtcbn1cblxudmFyIFJlbW90ZUNvbm5lY3Rpb24gPSBudWxsO1xuZnVuY3Rpb24gZ2V0UmVtb3RlQ29ubmVjdGlvbigpOiBSZW1vdGVDb25uZWN0aW9uIHtcbiAgcmV0dXJuIFJlbW90ZUNvbm5lY3Rpb24gfHwgKFJlbW90ZUNvbm5lY3Rpb24gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJykuUmVtb3RlQ29ubmVjdGlvbik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVJlbW90ZUNvbm5lY3Rpb24ocmVtb3RlUHJvamVjdENvbmZpZzogUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pOiBQcm9taXNlPD9SZW1vdGVDb25uZWN0aW9uPiB7XG4gIHZhciBSZW1vdGVDb25uZWN0aW9uID0gZ2V0UmVtb3RlQ29ubmVjdGlvbigpO1xuXG4gIHRyeSB7XG4gICAgdmFyIGNvbm5lY3Rpb24gPSBuZXcgUmVtb3RlQ29ubmVjdGlvbihyZXN0b3JlQ2xpZW50S2V5KHJlbW90ZVByb2plY3RDb25maWcpKTtcbiAgICBhd2FpdCBjb25uZWN0aW9uLmluaXRpYWxpemUoKTtcbiAgICByZXR1cm4gY29ubmVjdGlvbjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElmIGNvbm5lY3Rpb24gZmFpbHMgdXNpbmcgc2F2ZWQgY29uZmlnLCBvcGVuIGNvbm5lY3QgZGlhbG9nLlxuICAgIHZhciB7b3BlbkNvbm5lY3Rpb25EaWFsb2d9ID0gcmVxdWlyZSgnbnVjbGlkZS1zc2gtZGlhbG9nJyk7XG4gICAgcmV0dXJuIG9wZW5Db25uZWN0aW9uRGlhbG9nKHtcbiAgICAgIGluaXRpYWxTZXJ2ZXI6IHJlbW90ZVByb2plY3RDb25maWcuaG9zdCxcbiAgICAgIGluaXRpYWxDd2Q6IHJlbW90ZVByb2plY3RDb25maWcuY3dkLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW90ZUZvbGRlclRvUHJvamVjdChjb25uZWN0aW9uOiBSZW1vdGVDb25uZWN0aW9uKSB7XG4gIHZhciB3b3JraW5nRGlyZWN0b3J5VXJpID0gY29ubmVjdGlvbi5nZXRVcmlGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpO1xuICAvLyBJZiByZXN0b3Jpbmcgc3RhdGUsIHRoZW4gdGhlIHByb2plY3QgYWxyZWFkeSBleGlzdHMgd2l0aCBsb2NhbCBkaXJlY3RvcnkgYW5kIHdyb25nIHJlcG8gaW5zdGFuY2VzLlxuICAvLyBIZW5jZSwgd2UgcmVtb3ZlIGl0IGhlcmUsIGlmIGV4aXN0aW5nLCBhbmQgYWRkIHRoZSBuZXcgcGF0aCBmb3Igd2hpY2ggd2UgYWRkZWQgYSB3b3Jrc3BhY2Ugb3BlbmVyIGhhbmRsZXIuXG4gIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHdvcmtpbmdEaXJlY3RvcnlVcmkpO1xuXG4gIGF0b20ucHJvamVjdC5hZGRQYXRoKHdvcmtpbmdEaXJlY3RvcnlVcmkpO1xuXG4gIHZhciBzdWJzY3JpcHRpb24gPSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygoKSA9PiB7XG4gICAgLy8gRGVsYXkgY2xvc2luZyB0aGUgdW5kZXJseWluZyBzb2NrZXQgY29ubmVjdGlvbiB1bnRpbCByZWdpc3RlcmVkIHN1YnNjcmlwdGlvbnMgaGF2ZSBjbG9zZWQuXG4gICAgLy8gV2Ugc2hvdWxkIG5ldmVyIGRlcGVuZCBvbiB0aGUgb3JkZXIgb2YgcmVnaXN0cmF0aW9uIG9mIHRoZSBgb25EaWRDaGFuZ2VQYXRoc2AgZXZlbnQsXG4gICAgLy8gd2hpY2ggYWxzbyBkaXNwb3NlIGNvbnN1bWVkIHNlcnZpY2UncyByZXNvdXJjZXMuXG4gICAgc2V0VGltZW91dChjaGVja0Nsb3NlZFByb2plY3QsIENMT1NFX1BST0pFQ1RfREVMQVlfTVMpO1xuICB9KTtcblxuICBmdW5jdGlvbiBjaGVja0Nsb3NlZFByb2plY3QoKSB7XG4gICAgLy8gVGhlIHByb2plY3QgcGF0aHMgbWF5IGhhdmUgY2hhbmdlZCBkdXJpbmcgdGhlIGRlbGF5IHRpbWUuXG4gICAgLy8gSGVuY2UsIHRoZSBsYXRlc3QgcHJvamVjdCBwYXRocyBhcmUgZmV0Y2hlZCBoZXJlLlxuICAgIHZhciBwYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xuICAgIGlmIChwYXRocy5pbmRleE9mKHdvcmtpbmdEaXJlY3RvcnlVcmkpICE9PSAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUaGUgcHJvamVjdCB3YXMgcmVtb3ZlZCBmcm9tIHRoZSB0cmVlLlxuICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG5cbiAgICBjbG9zZU9wZW5GaWxlc0ZvclJlbW90ZVByb2plY3QoY29ubmVjdGlvbi5nZXRDb25maWcoKSk7XG5cbiAgICB2YXIgaG9zdG5hbWUgPSBjb25uZWN0aW9uLmdldFJlbW90ZUhvc3RuYW1lKCk7XG4gICAgaWYgKGdldFJlbW90ZUNvbm5lY3Rpb24oKS5nZXRCeUhvc3RuYW1lKGhvc3RuYW1lKS5sZW5ndGggPiAxKSB7XG4gICAgICBnZXRMb2dnZXIoKS5pbmZvKCdSZW1haW5pbmcgcmVtb3RlIHByb2plY3RzIHVzaW5nIE51Y2xpZGUgU2VydmVyIC0gbm8gcHJvbXB0IHRvIHNodXRkb3duJyk7XG4gICAgICByZXR1cm4gY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgIH1cblxuICAgIHZhciBjaG9pY2UgPSBhdG9tLmNvbmZpcm0oe1xuICAgICAgbWVzc2FnZTogJ05vIG1vcmUgcmVtb3RlIHByb2plY3RzIG9uIHRoZSBob3N0OiBcXCcnICsgaG9zdG5hbWUgKyAnXFwnLiBXb3VsZCB5b3UgbGlrZSB0byBzaHV0ZG93biBOdWNsaWRlIHNlcnZlciB0aGVyZT8nLFxuICAgICAgYnV0dG9uczogWydTaHV0ZG93bicsICdLZWVwIEl0J10sXG4gICAgfSk7XG4gICAgaWYgKGNob2ljZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICB9XG4gICAgaWYgKGNob2ljZSA9PT0gMCkge1xuICAgICAgY29ubmVjdGlvbi5nZXRDbGllbnQoKS5zaHV0ZG93blNlcnZlcigpO1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xvc2VPcGVuRmlsZXNGb3JSZW1vdGVQcm9qZWN0KHJlbW90ZVByb2plY3RDb25maWc6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uKTogQXJyYXk8c3RyaW5nPiB7XG4gIHZhciB7Y2xvc2VUYWJGb3JCdWZmZXJ9ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbiAgdmFyIHtzYW5pdGl6ZU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG4gIHZhciB7aG9zdDogcHJvamVjdEhvc3RuYW1lLCBjd2Q6IHByb2plY3REaXJlY3Rvcnl9ID0gcmVtb3RlUHJvamVjdENvbmZpZztcbiAgdmFyIGNsb3NlZFVyaXMgPSBbXTtcbiAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKGVkaXRvciA9PiB7XG4gICAgdmFyIHJhd1VybCA9IGVkaXRvci5nZXRVUkkoKTtcbiAgICBpZiAoIXJhd1VybCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdXJpID0gc2FuaXRpemVOdWNsaWRlVXJpKHJhd1VybCk7XG4gICAgdmFyIHtob3N0bmFtZTogZmlsZUhvc3RuYW1lLCBwYXRoOiBmaWxlUGF0aH0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKS5wYXJzZSh1cmkpO1xuICAgIGlmIChmaWxlSG9zdG5hbWUgPT09IHByb2plY3RIb3N0bmFtZSAmJiBmaWxlUGF0aC5zdGFydHNXaXRoKHByb2plY3REaXJlY3RvcnkpKSB7XG4gICAgICBjbG9zZVRhYkZvckJ1ZmZlcihlZGl0b3IuZ2V0QnVmZmVyKCkpO1xuICAgICAgaWYgKGZpbGVQYXRoICE9PSBwcm9qZWN0RGlyZWN0b3J5KSB7XG4gICAgICAgIGNsb3NlZFVyaXMucHVzaCh1cmkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBjbG9zZWRVcmlzO1xufVxuXG4vKipcbiAqIFJlc3RvcmUgYSBudWNsaWRlIHByb2plY3Qgc3RhdGUgZnJvbSBhIHNlcmlhbGl6ZWQgc3RhdGUgb2YgdGhlIHJlbW90ZSBjb25uZWN0aW9uIGNvbmZpZy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVzdG9yZU51Y2xpZGVQcm9qZWN0U3RhdGUocmVtb3RlUHJvamVjdENvbmZpZzogUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pIHtcbiAgLy8gVE9ETyB1c2UgdGhlIHJlc3Qgb2YgdGhlIGNvbmZpZyBmb3IgdGhlIGNvbm5lY3Rpb24gZGlhbG9nLlxuICB2YXIge2hvc3Q6IHByb2plY3RIb3N0bmFtZSwgY3dkOiBwcm9qZWN0RGlyZWN0b3J5fSA9IHJlbW90ZVByb2plY3RDb25maWc7XG4gIC8vIHRyeSB0byByZS1jb25uZWN0LCB0aGVuLCBhZGQgdGhlIHByb2plY3QgdG8gYXRvbS5wcm9qZWN0IGFuZCB0aGUgdHJlZS5cbiAgdmFyIGNvbm5lY3Rpb24gPSBhd2FpdCBjcmVhdGVSZW1vdGVDb25uZWN0aW9uKHJlbW90ZVByb2plY3RDb25maWcpO1xuICBpZiAoIWNvbm5lY3Rpb24pIHtcbiAgICBnZXRMb2dnZXIoKS5pbmZvKCdObyBSZW1vdGVDb25uZWN0aW9uIHJldHVybmVkIG9uIHJlc3RvcmUgc3RhdGUgdHJpYWw6JywgcHJvamVjdEhvc3RuYW1lLCBwcm9qZWN0RGlyZWN0b3J5KTtcbiAgfVxuICAvLyBSZWxvYWQgdGhlIHByb2plY3QgZmlsZXMgdGhhdCBoYXZlIGVtcHR5IHRleHQgZWRpdG9ycy9idWZmZXJzIG9wZW4uXG4gIHZhciBjbG9zZWRVcmlzID0gY2xvc2VPcGVuRmlsZXNGb3JSZW1vdGVQcm9qZWN0KHJlbW90ZVByb2plY3RDb25maWcpO1xuICAvLyBPbiBBdG9tIHJlc3RhcnQsIGl0IHRyaWVzIHRvIG9wZW4gdGhlIHVyaSBwYXRoIGFzIGEgZmlsZSB0YWIgYmVjYXVzZSBpdCdzIG5vdCBhIGxvY2FsIGRpcmVjdG9yeS5cbiAgLy8gSGVuY2UsIHdlIGNsb3NlIGl0IGluIHRoZSBjbGVhbnVwLCBiZWNhdXNlIHdlIGhhdmUgdGhlIG5lZWRlZCBjb25uZWN0aW9uIGNvbmZpZyBzYXZlZFxuICAvLyB3aXRoIHRoZSBsYXN0IG9wZW5lZCBmaWxlcyBpbiB0aGUgcGFja2FnZSBzdGF0ZS5cbiAgaWYgKGNvbm5lY3Rpb24pIHtcbiAgICBjbG9zZWRVcmlzLmZvckVhY2godXJpID0+IGF0b20ud29ya3NwYWNlLm9wZW4odXJpKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xlYW51cFJlbW90ZU51Y2xpZGVQcm9qZWN0cygpIHtcbiAgZ2V0UmVtb3RlUm9vdERpcmVjdG9yaWVzKCkuZm9yRWFjaChkaXJlY3RvcnkgPT4gYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgoZGlyZWN0b3J5LmdldFBhdGgoKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRSZW1vdGVSb290RGlyZWN0b3JpZXMoKSB7XG4gIHJldHVybiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5maWx0ZXIoZGlyZWN0b3J5ID0+IGRpcmVjdG9yeS5nZXRQYXRoKCkuc3RhcnRzV2l0aCgnbnVjbGlkZTonKSk7XG59XG5cbi8qKlxuICogVGhlIHNhbWUgVGV4dEVkaXRvciBtdXN0IGJlIHJldHVybmVkIHRvIHByZXZlbnQgQXRvbSBmcm9tIGNyZWF0aW5nIG11bHRpcGxlIHRhYnNcbiAqIGZvciB0aGUgc2FtZSBmaWxlLCBiZWNhdXNlIEF0b20gZG9lc24ndCBjYWNoZSBwZW5kaW5nIG9wZW5lciBwcm9taXNlcy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRWRpdG9yRm9yTnVjbGlkZShjb25uZWN0aW9uOiBSZW1vdGVDb25uZWN0aW9uLCB1cmk6IHN0cmluZyk6IFRleHRFZGl0b3Ige1xuICB2YXIgTnVjbGlkZVRleHRCdWZmZXIgPSByZXF1aXJlKCcuL051Y2xpZGVUZXh0QnVmZmVyJyk7XG5cbiAgdmFyIGJ1ZmZlciA9IG5ldyBOdWNsaWRlVGV4dEJ1ZmZlcihjb25uZWN0aW9uLCB7ZmlsZVBhdGg6IHVyaX0pO1xuICBidWZmZXIuc2V0RW5jb2RpbmcoYXRvbS5jb25maWcuZ2V0KCdjb3JlLmZpbGVFbmNvZGluZycpKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBidWZmZXIubG9hZCgpO1xuICB9IGNhdGNoKGVycikge1xuICAgIGdldExvZ2dlcigpLndhcm4oJ2J1ZmZlciBsb2FkIGlzc3VlOicsIGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIHJldHVybiBuZXcgVGV4dEVkaXRvcigvKmVkaXRvck9wdGlvbnMqLyB7YnVmZmVyLCByZWdpc3RlckVkaXRvcjogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIEVuY3J5cHRzIHRoZSBjbGllbnRLZXkgb2YgYSBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbi5cbiAqIEBwYXJhbSByZW1vdGVQcm9qZWN0Q29uZmlnIC0gVGhlIGNvbmZpZyB3aXRoIHRoZSBjbGllbnRLZXkgd2Ugd2FudCBlbmNyeXB0ZWQuXG4gKiBAcmV0dXJuIHJldHVybnMgdGhlIHBhc3NlZCBpbiBjb25maWcgd2l0aCB0aGUgY2xpZW50S2V5IGVuY3J5cHRlZC5cbiAqL1xuZnVuY3Rpb24gcHJvdGVjdENsaWVudEtleShyZW1vdGVQcm9qZWN0Q29uZmlnOiBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbik6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uIHtcbiAgdmFyIHtyZXBsYWNlUGFzc3dvcmR9ID0gcmVxdWlyZSgnbnVjbGlkZS1rZXl0YXItd3JhcHBlcicpO1xuICB2YXIgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG5cbiAgdmFyIHNoYTEgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpO1xuICBzaGExLnVwZGF0ZShgJHtyZW1vdGVQcm9qZWN0Q29uZmlnLmhvc3R9OiR7cmVtb3RlUHJvamVjdENvbmZpZy5wb3J0fWApO1xuICB2YXIgc2hhMXN1bSA9IHNoYTEuZGlnZXN0KCdoZXgnKTtcblxuICB2YXIge3NhbHQsIHBhc3N3b3JkLCBlbmNyeXB0ZWRTdHJpbmd9ID0gZW5jcnlwdFN0cmluZyhyZW1vdGVQcm9qZWN0Q29uZmlnLmNsaWVudEtleSk7XG4gIHJlcGxhY2VQYXNzd29yZCgnbnVjbGlkZS5yZW1vdGVQcm9qZWN0Q29uZmlnJywgc2hhMXN1bSwgYCR7cGFzc3dvcmR9YCk7XG5cbiAgcmVtb3RlUHJvamVjdENvbmZpZy5jbGllbnRLZXkgPSBlbmNyeXB0ZWRTdHJpbmcgKyAnLicgKyBzYWx0O1xuXG4gIHJldHVybiByZW1vdGVQcm9qZWN0Q29uZmlnO1xufVxuXG4vKipcbiAqIERlY3J5cHRzIHRoZSBjbGllbnRLZXkgb2YgYSBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbi5cbiAqIEBwYXJhbSByZW1vdGVQcm9qZWN0Q29uZmlnIC0gVGhlIGNvbmZpZyB3aXRoIHRoZSBjbGllbnRLZXkgd2Ugd2FudCBlbmNyeXB0ZWQuXG4gKiBAcmV0dXJuIHJldHVybnMgdGhlIHBhc3NlZCBpbiBjb25maWcgd2l0aCB0aGUgY2xpZW50S2V5IGVuY3J5cHRlZC5cbiAqL1xuZnVuY3Rpb24gcmVzdG9yZUNsaWVudEtleShyZW1vdGVQcm9qZWN0Q29uZmlnOiBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbik6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uIHtcbiAgdmFyIHtnZXRQYXNzd29yZH0gPSByZXF1aXJlKCdudWNsaWRlLWtleXRhci13cmFwcGVyJyk7XG4gIHZhciBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcblxuICB2YXIgc2hhMSA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJyk7XG4gIHNoYTEudXBkYXRlKGAke3JlbW90ZVByb2plY3RDb25maWcuaG9zdH06JHtyZW1vdGVQcm9qZWN0Q29uZmlnLnBvcnR9YCk7XG4gIHZhciBzaGExc3VtID0gc2hhMS5kaWdlc3QoJ2hleCcpO1xuXG4gIHZhciBwYXNzd29yZCA9IGdldFBhc3N3b3JkKCdudWNsaWRlLnJlbW90ZVByb2plY3RDb25maWcnLCBzaGExc3VtKTtcblxuICBpZiAoIXBhc3N3b3JkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCBwYXNzd29yZCBmb3IgZW5jcnlwdGVkIGNsaWVudCBrZXknKTtcbiAgfVxuXG4gIHZhciBzYWx0O1xuICB2YXIgY2xpZW50S2V5O1xuXG4gIFtjbGllbnRLZXksIHNhbHRdID0gcmVtb3RlUHJvamVjdENvbmZpZy5jbGllbnRLZXkuc3BsaXQoJy4nKTtcblxuICBpZiAoIWNsaWVudEtleSB8fCAhc2FsdCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGRlY3J5cHQgY2xpZW50IGtleScpO1xuICB9XG5cbiAgcmVtb3RlUHJvamVjdENvbmZpZy5jbGllbnRLZXkgPSBkZWNyeXB0U3RyaW5nKGNsaWVudEtleSwgcGFzc3dvcmQsIHNhbHQpO1xuXG4gIHJldHVybiByZW1vdGVQcm9qZWN0Q29uZmlnO1xufVxuXG5mdW5jdGlvbiBkZWNyeXB0U3RyaW5nKHRleHQ6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgc2FsdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdmFyIGNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuXG4gIHZhciBkZWNpcGhlciA9IGNyeXB0by5jcmVhdGVEZWNpcGhlcml2KFxuICAgICAgJ2Flcy0xMjgtY2JjJyxcbiAgICAgIG5ldyBCdWZmZXIocGFzc3dvcmQsICdiYXNlNjQnKSxcbiAgICAgIG5ldyBCdWZmZXIoc2FsdCwgJ2Jhc2U2NCcpKTtcblxuICB2YXIgZGVjcnlwdGVkU3RyaW5nID0gZGVjaXBoZXIudXBkYXRlKHRleHQsICdiYXNlNjQnLCAndXRmOCcpO1xuICBkZWNyeXB0ZWRTdHJpbmcgKz0gZGVjaXBoZXIuZmluYWwoJ3V0ZjgnKTtcblxuICByZXR1cm4gZGVjcnlwdGVkU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBlbmNyeXB0U3RyaW5nKHRleHQ6IHN0cmluZyk6IGFueSB7XG4gIHZhciBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcbiAgdmFyIHBhc3N3b3JkID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnYmFzZTY0Jyk7XG4gIHZhciBzYWx0ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgdmFyIGNpcGhlciA9IGNyeXB0by5jcmVhdGVDaXBoZXJpdihcbiAgICAnYWVzLTEyOC1jYmMnLFxuICAgIG5ldyBCdWZmZXIocGFzc3dvcmQsICdiYXNlNjQnKSxcbiAgICBuZXcgQnVmZmVyKHNhbHQsICdiYXNlNjQnKSk7XG5cbiAgdmFyIGVuY3J5cHRlZFN0cmluZyA9IGNpcGhlci51cGRhdGUodGV4dCwgJ3V0ZjgnLCAnYmFzZTY0Jyk7XG4gIGVuY3J5cHRlZFN0cmluZyArPSBjaXBoZXIuZmluYWwoJ2Jhc2U2NCcpO1xuXG4gIHJldHVybiB7XG4gICAgcGFzc3dvcmQsXG4gICAgc2FsdCxcbiAgICBlbmNyeXB0ZWRTdHJpbmcsXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBfX3Rlc3RfXzoge1xuICAgIGRlY3J5cHRTdHJpbmcsXG4gICAgZW5jcnlwdFN0cmluZyxcbiAgfSxcblxuICBhY3RpdmF0ZShzdGF0ZTogP2FueSk6IHZvaWQge1xuICAgIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdmFyIFJlbW90ZVByb2plY3RzQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vUmVtb3RlUHJvamVjdHNDb250cm9sbGVyJyk7XG4gICAgY29udHJvbGxlciA9IG5ldyBSZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXIoKTtcblxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGdldFJlbW90ZUNvbm5lY3Rpb24oKS5vbkRpZEFkZFJlbW90ZUNvbm5lY3Rpb24oY29ubmVjdGlvbiA9PiB7XG4gICAgICBhZGRSZW1vdGVGb2xkZXJUb1Byb2plY3QoY29ubmVjdGlvbik7XG4gICAgfSkpO1xuXG4gICAgLy8gRG9uJ3QgZG8gcmVxdWlyZSBvciBhbnkgb3RoZXIgZXhwZW5zaXZlIG9wZXJhdGlvbnMgaW4gYWN0aXZhdGUoKS5cbiAgICBzdWJzY3JpcHRpb25zLmFkZChhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVJbml0aWFsUGFja2FnZXMoKCkgPT4ge1xuICAgICAgLy8gU3Vic2NyaWJlIG9wZW5lciBiZWZvcmUgcmVzdG9yaW5nIHRoZSByZW1vdGUgcHJvamVjdHMuXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSA9ICcnKSA9PiB7XG4gICAgICAgIGlmICh1cmkuc3RhcnRzV2l0aCgnbnVjbGlkZTonKSkge1xuICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gZ2V0UmVtb3RlQ29ubmVjdGlvbigpLmdldEZvclVyaSh1cmkpO1xuICAgICAgICAgIC8vIE9uIEF0b20gcmVzdGFydCwgaXQgdHJpZXMgdG8gb3BlbiB0aGUgdXJpIHBhdGggYXMgYSBmaWxlIHRhYiBiZWNhdXNlIGl0J3Mgbm90IGEgbG9jYWwgZGlyZWN0b3J5LlxuICAgICAgICAgIC8vIFdlIGNhbid0IGxldCB0aGF0IGNyZWF0ZSBhIGZpbGUgd2l0aCB0aGUgaW5pdGlhbCB3b3JraW5nIGRpcmVjdG9yeSBwYXRoLlxuICAgICAgICAgIGlmIChjb25uZWN0aW9uICYmIHVyaSAhPT0gY29ubmVjdGlvbi5nZXRVcmlGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBpZiAocGVuZGluZ0ZpbGVzW3VyaV0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBlbmRpbmdGaWxlc1t1cmldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRleHRFZGl0b3JQcm9taXNlID0gcGVuZGluZ0ZpbGVzW3VyaV0gPSBjcmVhdGVFZGl0b3JGb3JOdWNsaWRlKGNvbm5lY3Rpb24sIHVyaSk7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlRnJvbUNhY2hlID0gKCkgPT4gZGVsZXRlIHBlbmRpbmdGaWxlc1t1cmldO1xuICAgICAgICAgICAgdGV4dEVkaXRvclByb21pc2UudGhlbihyZW1vdmVGcm9tQ2FjaGUsIHJlbW92ZUZyb21DYWNoZSk7XG4gICAgICAgICAgICByZXR1cm4gdGV4dEVkaXRvclByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgICdudWNsaWRlLXJlbW90ZS1wcm9qZWN0czpjb25uZWN0JyxcbiAgICAgICAgKCkgPT4gcmVxdWlyZSgnbnVjbGlkZS1zc2gtZGlhbG9nJykub3BlbkNvbm5lY3Rpb25EaWFsb2coKVxuICAgICkpO1xuXG4gICAgICAvLyBSZW1vdmUgcmVtb3RlIHByb2plY3RzIGFkZGVkIGluIGNhc2Ugb2YgcmVsb2Fkcy5cbiAgICAgIC8vIFdlIGFscmVhZHkgaGF2ZSB0aGVpciBjb25uZWN0aW9uIGNvbmZpZyBzdG9yZWQuXG4gICAgICB2YXIgcmVtb3RlUHJvamVjdHNDb25maWcgPSAoc3RhdGUgJiYgc3RhdGUucmVtb3RlUHJvamVjdHNDb25maWcpIHx8IFtdO1xuICAgICAgcmVtb3RlUHJvamVjdHNDb25maWcuZm9yRWFjaChyZXN0b3JlTnVjbGlkZVByb2plY3RTdGF0ZSk7XG4gICAgICAvLyBDbGVhciBvYnNvbGV0ZSBjb25maWcuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ251Y2xpZGUucmVtb3RlUHJvamVjdHNDb25maWcnLCBbXSk7XG4gICAgfSkpO1xuICB9LFxuXG4gIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBFbGVtZW50KTogdm9pZCB7XG4gICAgaWYgKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnRyb2xsZXIuY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXIpO1xuICAgIH1cbiAgfSxcblxuICBzZXJpYWxpemUoKTogYW55IHtcbiAgICB2YXIgcmVtb3RlUHJvamVjdHNDb25maWcgPSBnZXRSZW1vdGVSb290RGlyZWN0b3JpZXMoKVxuICAgICAgICAubWFwKGRpcmVjdG9yeSA9PiB7XG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBnZXRSZW1vdGVDb25uZWN0aW9uKCkuZ2V0Rm9yVXJpKGRpcmVjdG9yeS5nZXRQYXRoKCkpO1xuICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uICYmIHByb3RlY3RDbGllbnRLZXkoY29ubmVjdGlvbi5nZXRDb25maWcoKSk7XG4gICAgICAgIH0pLmZpbHRlcihjb25maWcgPT4gISFjb25maWcpO1xuICAgIHJldHVybiB7XG4gICAgICByZW1vdGVQcm9qZWN0c0NvbmZpZyxcbiAgICB9O1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgLy8gVGhpcyBzaG91bGQgYWx3YXlzIGJlIHRydWUgaGVyZSwgYnV0IHdlIGRvIHRoaXMgdG8gYXBwZWFzZSBGbG93LlxuICAgIGlmIChzdWJzY3JpcHRpb25zKSB7XG4gICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHN1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICBjcmVhdGVSZW1vdGVEaXJlY3RvcnlQcm92aWRlcigpOiBSZW1vdGVEaXJlY3RvcnlQcm92aWRlciB7XG4gICAgdmFyIFJlbW90ZURpcmVjdG9yeVByb3ZpZGVyID0gcmVxdWlyZSgnLi9SZW1vdGVEaXJlY3RvcnlQcm92aWRlcicpO1xuICAgIHJldHVybiBuZXcgUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIoKTtcbiAgfSxcblxuICBjcmVhdGVSZW1vdGVEaXJlY3RvcnlTZWFyY2hlcigpOiBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlciB7XG4gICAgdmFyIHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gICAgdmFyIHtSZW1vdGVEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xuICAgIHZhciBSZW1vdGVEaXJlY3RvcnlTZWFyY2hlciA9IHJlcXVpcmUoJy4vUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXInKTtcbiAgICByZXR1cm4gbmV3IFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyKChkaXI6IFJlbW90ZURpcmVjdG9yeSkgPT5cbiAgICAgIGdldFNlcnZpY2VCeU51Y2xpZGVVcmkoJ0ZpbmRJblByb2plY3RTZXJ2aWNlJywgZGlyLmdldFBhdGgoKSkpO1xuICB9LFxufTtcbiJdfQ==
