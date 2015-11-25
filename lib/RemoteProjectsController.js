
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var React = require('react-for-atom');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var Disposable = _require.Disposable;

var StatusBarTile = require('./ui/StatusBarTile');

var _require2 = require('nuclide-atom-helpers');

var isTextEditor = _require2.isTextEditor;

var remoteUri = require('nuclide-remote-uri');
var ConnectionState = require('./ConnectionState');

var onWorkspaceDidStopChangingActivePaneItem = require('nuclide-atom-helpers').atomEventDebounce.onWorkspaceDidStopChangingActivePaneItem;

var RemoteProjectsController = (function () {
  function RemoteProjectsController() {
    _classCallCheck(this, RemoteProjectsController);

    this._statusBarTile = null;
    this._disposables = new CompositeDisposable();

    this._statusSubscription = null;
    this._disposables.add(atom.workspace.onDidChangeActivePaneItem(this._disposeSubscription.bind(this)), onWorkspaceDidStopChangingActivePaneItem(this._updateConnectionStatus.bind(this)));
  }

  _createClass(RemoteProjectsController, [{
    key: '_disposeSubscription',
    value: function _disposeSubscription() {
      var subscription = this._statusSubscription;
      if (subscription) {
        this._disposables.remove(subscription);
        subscription.dispose();
        this._statusSubscription = null;
      }
    }
  }, {
    key: '_updateConnectionStatus',
    value: function _updateConnectionStatus(paneItem) {
      var _this = this;

      this._disposeSubscription();

      if (!isTextEditor(paneItem)) {
        this._renderStatusBar(ConnectionState.NONE);
        return;
      }
      var textEditor = paneItem;
      var fileUri = textEditor.getPath();
      if (!fileUri) {
        return;
      }
      if (remoteUri.isLocal(fileUri)) {
        this._renderStatusBar(ConnectionState.LOCAL, fileUri);
        return;
      }

      var updateStatus = function updateStatus(isConnected) {
        _this._renderStatusBar(isConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED, fileUri);
      };

      var _require3 = require('nuclide-client');

      var getClient = _require3.getClient;

      var client = getClient(fileUri);
      if (!client || !client.eventbus) {
        updateStatus(false);
        return;
      }

      updateStatus(client.eventbus.socket.isConnected());
      client.eventbus.socket.on('status', updateStatus);

      this._statusSubscription = new Disposable(function () {
        client.eventbus.socket.removeListener('status', updateStatus);
      });
      this._disposables.add(this._statusSubscription);
    }
  }, {
    key: 'consumeStatusBar',
    value: function consumeStatusBar(statusBar) {
      var _this2 = this;

      this._statusBarDiv = document.createElement('div');
      this._statusBarDiv.className = 'nuclide-remote-projects inline-block';

      var tooltip = atom.tooltips.add(this._statusBarDiv, { title: 'Click to show details of connection.' });
      var rightTile = statusBar.addLeftTile({
        item: this._statusBarDiv,
        priority: -99
      });

      this._disposables.add(new Disposable(function () {
        var parentNode = _this2._statusBarDiv.parentNode;
        if (parentNode) {
          parentNode.removeChild(_this2._statusBarDiv);
        }
        React.unmountComponentAtNode(_this2._statusBarDiv);
        _this2._statusBarDiv = null;
        rightTile.destroy();
        tooltip.dispose();
      }));

      var textEditor = atom.workspace.getActiveTextEditor();
      if (textEditor != null) {
        this._updateConnectionStatus(textEditor);
      }
    }
  }, {
    key: '_renderStatusBar',
    value: function _renderStatusBar(connectionState, fileUri) {
      if (!this._statusBarDiv) {
        return;
      }

      this._statusBarTile = React.render(React.createElement(StatusBarTile, {
        connectionState: connectionState,
        fileUri: fileUri
      }), this._statusBarDiv);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this._disposables.dispose();
    }
  }]);

  return RemoteProjectsController;
})();

module.exports = RemoteProjectsController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBwZmw1Mm5wdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlUHJvamVjdHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFXWixJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7ZUFDRSxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBQ3RDLElBQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztnQkFDN0IsT0FBTyxDQUFDLHNCQUFzQixDQUFDOztJQUEvQyxZQUFZLGFBQVosWUFBWTs7QUFDbkIsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDaEQsSUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRTlDLHdDQUF3QyxHQUM3QyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxpQkFBaUIsQ0FENUMsd0NBQXdDOztJQUd6Qyx3QkFBd0I7QUFNakIsV0FOUCx3QkFBd0IsR0FNZDswQkFOVix3QkFBd0I7O0FBTzFCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDOztBQUU5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLFFBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDOUUsd0NBQXdD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QUFNO0FBQ3pDLFlBQU0sVUFBVSxHQUFHLE9BQUssYUFBYSxDQUFDLFVBQVUsQ0FBQztBQUNqRCxZQUFJLFVBQVUsRUFBRTtBQUNkLG9CQUFVLENBQUMsV0FBVyxDQUFDLE9BQUssYUFBYSxDQUFDLENBQUM7U0FDNUM7QUFDRCxhQUFLLENBQUMsc0JBQXNCLENBQUMsT0FBSyxhQUFhLENBQUMsQ0FBQztBQUNqRCxlQUFLLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDMUIsaUJBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQixlQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbkIsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3hELFVBQUksVUFBVSxJQUFJLElBQUksRUFBRTtBQUN0QixZQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7T0FDMUM7S0FDRjs7O1dBRWUsMEJBQUMsZUFBdUIsRUFBRSxPQUFnQixFQUFRO0FBQ2hFLFVBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3ZCLGVBQU87T0FDUjs7QUFFRCxVQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQ2hDLG9CQUFDLGFBQWE7QUFDWix1QkFBZSxFQUFFLGVBQWUsQUFBQztBQUNqQyxlQUFPLEVBQUUsT0FBTyxBQUFDO1FBQ2pCLEVBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FDbkIsQ0FBQztLQUNIOzs7V0FFTSxtQkFBUztBQUNkLFVBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDN0I7OztTQTdHRyx3QkFBd0I7OztBQWdIOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wcGZsNTJucHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL1JlbW90ZVByb2plY3RzQ29udHJvbGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbmNvbnN0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbmNvbnN0IFN0YXR1c0JhclRpbGUgPSByZXF1aXJlKCcuL3VpL1N0YXR1c0JhclRpbGUnKTtcbmNvbnN0IHtpc1RleHRFZGl0b3J9ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbmNvbnN0IHJlbW90ZVVyaSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xuY29uc3QgQ29ubmVjdGlvblN0YXRlID0gcmVxdWlyZSgnLi9Db25uZWN0aW9uU3RhdGUnKTtcblxuY29uc3Qge29uV29ya3NwYWNlRGlkU3RvcENoYW5naW5nQWN0aXZlUGFuZUl0ZW19ID1cbiAgcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKS5hdG9tRXZlbnREZWJvdW5jZTtcblxuY2xhc3MgUmVtb3RlUHJvamVjdHNDb250cm9sbGVyIHtcbiAgX2Rpc3Bvc2FibGVzOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBfc3RhdHVzQmFyRGl2OiA/RWxlbWVudDtcbiAgX3N0YXR1c0JhclRpbGU6ID9FbGVtZW50O1xuICBfc3RhdHVzU3Vic2NyaXB0aW9uOiA/RGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9zdGF0dXNCYXJUaWxlID0gbnVsbDtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZChcbiAgICAgIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0odGhpcy5fZGlzcG9zZVN1YnNjcmlwdGlvbi5iaW5kKHRoaXMpKSxcbiAgICAgIG9uV29ya3NwYWNlRGlkU3RvcENoYW5naW5nQWN0aXZlUGFuZUl0ZW0odGhpcy5fdXBkYXRlQ29ubmVjdGlvblN0YXR1cy5iaW5kKHRoaXMpKVxuICAgICk7XG4gIH1cblxuICBfZGlzcG9zZVN1YnNjcmlwdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb247XG4gICAgaWYgKHN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZGlzcG9zYWJsZXMucmVtb3ZlKHN1YnNjcmlwdGlvbik7XG4gICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3RhdHVzU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQ29ubmVjdGlvblN0YXR1cyhwYW5lSXRlbTogT2JqZWN0KTogdm9pZCB7XG4gICAgdGhpcy5fZGlzcG9zZVN1YnNjcmlwdGlvbigpO1xuXG4gICAgaWYgKCFpc1RleHRFZGl0b3IocGFuZUl0ZW0pKSB7XG4gICAgICB0aGlzLl9yZW5kZXJTdGF0dXNCYXIoQ29ubmVjdGlvblN0YXRlLk5PTkUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0RWRpdG9yID0gcGFuZUl0ZW07XG4gICAgY29uc3QgZmlsZVVyaSA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpO1xuICAgIGlmICghZmlsZVVyaSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVtb3RlVXJpLmlzTG9jYWwoZmlsZVVyaSkpIHtcbiAgICAgIHRoaXMuX3JlbmRlclN0YXR1c0JhcihDb25uZWN0aW9uU3RhdGUuTE9DQUwsIGZpbGVVcmkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZVN0YXR1cyA9IGlzQ29ubmVjdGVkID0+IHtcbiAgICAgIHRoaXMuX3JlbmRlclN0YXR1c0Jhcihpc0Nvbm5lY3RlZCA/IENvbm5lY3Rpb25TdGF0ZS5DT05ORUNURUQgOiBDb25uZWN0aW9uU3RhdGUuRElTQ09OTkVDVEVELCBmaWxlVXJpKTtcbiAgICB9O1xuXG4gICAgY29uc3Qge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xuICAgIGNvbnN0IGNsaWVudCA9IGdldENsaWVudChmaWxlVXJpKTtcbiAgICBpZiAoIWNsaWVudCB8fCAhY2xpZW50LmV2ZW50YnVzKSB7XG4gICAgICB1cGRhdGVTdGF0dXMoZmFsc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVwZGF0ZVN0YXR1cyhjbGllbnQuZXZlbnRidXMuc29ja2V0LmlzQ29ubmVjdGVkKCkpO1xuICAgIGNsaWVudC5ldmVudGJ1cy5zb2NrZXQub24oJ3N0YXR1cycsIHVwZGF0ZVN0YXR1cyk7XG5cbiAgICB0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24gPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBjbGllbnQuZXZlbnRidXMuc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdzdGF0dXMnLCB1cGRhdGVTdGF0dXMpO1xuICAgIH0pO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCh0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24pO1xuICB9XG5cbiAgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGF0dXNCYXJEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9zdGF0dXNCYXJEaXYuY2xhc3NOYW1lID0gJ251Y2xpZGUtcmVtb3RlLXByb2plY3RzIGlubGluZS1ibG9jayc7XG5cbiAgICBjb25zdCB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQoXG4gICAgICB0aGlzLl9zdGF0dXNCYXJEaXYsXG4gICAgICB7dGl0bGU6ICdDbGljayB0byBzaG93IGRldGFpbHMgb2YgY29ubmVjdGlvbi4nfVxuICAgICk7XG4gICAgY29uc3QgcmlnaHRUaWxlID0gc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgIGl0ZW06IHRoaXMuX3N0YXR1c0JhckRpdixcbiAgICAgIHByaW9yaXR5OiAtOTksXG4gICAgfSk7XG5cbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRoaXMuX3N0YXR1c0JhckRpdi5wYXJlbnROb2RlO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9zdGF0dXNCYXJEaXYpO1xuICAgICAgfVxuICAgICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9zdGF0dXNCYXJEaXYpO1xuICAgICAgdGhpcy5fc3RhdHVzQmFyRGl2ID0gbnVsbDtcbiAgICAgIHJpZ2h0VGlsZS5kZXN0cm95KCk7XG4gICAgICB0b29sdGlwLmRpc3Bvc2UoKTtcbiAgICB9KSk7XG5cbiAgICBjb25zdCB0ZXh0RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgIGlmICh0ZXh0RWRpdG9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUNvbm5lY3Rpb25TdGF0dXModGV4dEVkaXRvcik7XG4gICAgfVxuICB9XG5cbiAgX3JlbmRlclN0YXR1c0Jhcihjb25uZWN0aW9uU3RhdGU6IG51bWJlciwgZmlsZVVyaT86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fc3RhdHVzQmFyRGl2KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc3RhdHVzQmFyVGlsZSA9IFJlYWN0LnJlbmRlcihcbiAgICAgIDxTdGF0dXNCYXJUaWxlXG4gICAgICAgIGNvbm5lY3Rpb25TdGF0ZT17Y29ubmVjdGlvblN0YXRlfVxuICAgICAgICBmaWxlVXJpPXtmaWxlVXJpfVxuICAgICAgLz4sXG4gICAgICB0aGlzLl9zdGF0dXNCYXJEaXYsXG4gICAgKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlUHJvamVjdHNDb250cm9sbGVyO1xuIl19
