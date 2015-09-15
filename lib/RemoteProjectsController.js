
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
var TextEditor = _require.TextEditor;

var StatusBarTile = require('./ui/StatusBarTile');
var remoteUri = require('nuclide-remote-uri');
var ConnectionState = require('./ConnectionState');

var RemoteProjectsController = (function () {
  function RemoteProjectsController() {
    _classCallCheck(this, RemoteProjectsController);

    this._statusBarTile = null;
    this._disposables = new CompositeDisposable();

    this._statusSubscription = null;
    this._disposables.add(atom.workspace.observeActivePaneItem(this._updateConnectionStatus.bind(this)));
  }

  _createClass(RemoteProjectsController, [{
    key: '_updateConnectionStatus',
    value: function _updateConnectionStatus(paneItem) {
      var _this = this;

      if (this._statusSubscription) {
        this._statusSubscription.dispose();
        this._disposables.remove(this._statusSubscription);
        this._statusSubscription = null;
      }

      // That may not be generically ideal to check `instanceof`.
      // However, that's the way `pane.coffee` checks in `getActiveEditor()`.
      if (!(paneItem instanceof TextEditor)) {
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

      var _require2 = require('nuclide-client');

      var getClient = _require2.getClient;

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

      this._updateConnectionStatus(atom.workspace.getActiveTextEditor());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBBaFdZYXVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlUHJvamVjdHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFXWixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7ZUFDYyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUE5RCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7SUFBRSxVQUFVLFlBQVYsVUFBVTs7QUFDaEQsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbEQsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDOUMsSUFBSSxlQUFlLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRTdDLHdCQUF3QjtBQUtqQixXQUxQLHdCQUF3QixHQUtkOzBCQUxWLHdCQUF3Qjs7QUFNMUIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDM0IsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7O0FBRTlDLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7QUFDaEMsUUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUN0Rzs7ZUFYRyx3QkFBd0I7O1dBYUwsaUNBQUMsUUFBZ0IsRUFBUTs7O0FBQzlDLFVBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQzVCLFlBQUksQ0FBQyxtQkFBbUIsQ0FB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LEVBQUUsQ0FBQztBQUNwQixlQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbkIsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO0tBQ3BFOzs7V0FFZSwwQkFBQyxlQUF1QixFQUFFLE9BQWdCLEVBQVE7QUFDaEUsVUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdkIsZUFBTztPQUNSOztBQUVELFVBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FDaEMsb0JBQUMsYUFBYTtBQUNaLHVCQUFlLEVBQUUsZUFBZSxBQUFDO0FBQ2pDLGVBQU8sRUFBRSxPQUFPLEFBQUM7UUFDakIsRUFDRixJQUFJLENBQUMsYUFBYSxDQUNuQixDQUFDO0tBQ0g7OztXQUVNLG1CQUFTO0FBQ2QsVUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUM3Qjs7O1NBbkdHLHdCQUF3Qjs7O0FBc0c5QixNQUFNLENBQUMsT0FBTyxHQUFHLHdCQUF3QixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy93MS9fMm1jNm0wNTBxbjIzMm5wc2Y5ejNoZnNoNThfamgvVC90bXBBaFdZYXVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlUHJvamVjdHNDb250cm9sbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgVGV4dEVkaXRvcn0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgU3RhdHVzQmFyVGlsZSA9IHJlcXVpcmUoJy4vdWkvU3RhdHVzQmFyVGlsZScpO1xudmFyIHJlbW90ZVVyaSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xudmFyIENvbm5lY3Rpb25TdGF0ZSA9IHJlcXVpcmUoJy4vQ29ubmVjdGlvblN0YXRlJyk7XG5cbmNsYXNzIFJlbW90ZVByb2plY3RzQ29udHJvbGxlciB7XG4gIF9zdGF0dXNCYXJEaXY6ID9FbGVtZW50O1xuICBfc3RhdHVzQmFyVGlsZTogP0VsZW1lbnQ7XG4gIF9kaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9zdGF0dXNCYXJUaWxlID0gbnVsbDtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0odGhpcy5fdXBkYXRlQ29ubmVjdGlvblN0YXR1cy5iaW5kKHRoaXMpKSk7XG4gIH1cblxuICBfdXBkYXRlQ29ubmVjdGlvblN0YXR1cyhwYW5lSXRlbTogT2JqZWN0KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3N0YXR1c1N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3RhdHVzU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGVzLnJlbW92ZSh0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24pO1xuICAgICAgdGhpcy5fc3RhdHVzU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUaGF0IG1heSBub3QgYmUgZ2VuZXJpY2FsbHkgaWRlYWwgdG8gY2hlY2sgYGluc3RhbmNlb2ZgLlxuICAgIC8vIEhvd2V2ZXIsIHRoYXQncyB0aGUgd2F5IGBwYW5lLmNvZmZlZWAgY2hlY2tzIGluIGBnZXRBY3RpdmVFZGl0b3IoKWAuXG4gICAgaWYgKCEocGFuZUl0ZW0gaW5zdGFuY2VvZiBUZXh0RWRpdG9yKSkge1xuICAgICAgdGhpcy5fcmVuZGVyU3RhdHVzQmFyKENvbm5lY3Rpb25TdGF0ZS5OT05FKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRleHRFZGl0b3IgPSBwYW5lSXRlbTtcbiAgICB2YXIgZmlsZVVyaSA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpO1xuICAgIGlmICghZmlsZVVyaSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVtb3RlVXJpLmlzTG9jYWwoZmlsZVVyaSkpIHtcbiAgICAgIHRoaXMuX3JlbmRlclN0YXR1c0JhcihDb25uZWN0aW9uU3RhdGUuTE9DQUwsIGZpbGVVcmkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB1cGRhdGVTdGF0dXMgPSBpc0Nvbm5lY3RlZCA9PiB7XG4gICAgICB0aGlzLl9yZW5kZXJTdGF0dXNCYXIoaXNDb25uZWN0ZWQgPyBDb25uZWN0aW9uU3RhdGUuQ09OTkVDVEVEIDogQ29ubmVjdGlvblN0YXRlLkRJU0NPTk5FQ1RFRCwgZmlsZVVyaSk7XG4gICAgfTtcblxuICAgIHZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gICAgdmFyIGNsaWVudCA9IGdldENsaWVudChmaWxlVXJpKTtcbiAgICBpZiAoIWNsaWVudCB8fCAhY2xpZW50LmV2ZW50YnVzKSB7XG4gICAgICB1cGRhdGVTdGF0dXMoZmFsc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVwZGF0ZVN0YXR1cyhjbGllbnQuZXZlbnRidXMuc29ja2V0LmlzQ29ubmVjdGVkKCkpO1xuICAgIGNsaWVudC5ldmVudGJ1cy5zb2NrZXQub24oJ3N0YXR1cycsIHVwZGF0ZVN0YXR1cyk7XG5cbiAgICB0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24gPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBjbGllbnQuZXZlbnRidXMuc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdzdGF0dXMnLCB1cGRhdGVTdGF0dXMpO1xuICAgIH0pO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCh0aGlzLl9zdGF0dXNTdWJzY3JpcHRpb24pO1xuICB9XG5cbiAgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGF0dXNCYXJEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9zdGF0dXNCYXJEaXYuY2xhc3NOYW1lID0gJ251Y2xpZGUtcmVtb3RlLXByb2plY3RzIGlubGluZS1ibG9jayc7XG5cbiAgICB2YXIgdG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkKFxuICAgICAgdGhpcy5fc3RhdHVzQmFyRGl2LFxuICAgICAge3RpdGxlOiAnQ2xpY2sgdG8gc2hvdyBkZXRhaWxzIG9mIGNvbm5lY3Rpb24uJ31cbiAgICApO1xuICAgIHZhciByaWdodFRpbGUgPSBzdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgaXRlbTogdGhpcy5fc3RhdHVzQmFyRGl2LFxuICAgICAgcHJpb3JpdHk6IC05OSxcbiAgICB9KTtcblxuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB2YXIgcGFyZW50Tm9kZSA9IHRoaXMuX3N0YXR1c0JhckRpdi5wYXJlbnROb2RlO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9zdGF0dXNCYXJEaXYpO1xuICAgICAgfVxuICAgICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9zdGF0dXNCYXJEaXYpO1xuICAgICAgdGhpcy5fc3RhdHVzQmFyRGl2ID0gbnVsbDtcbiAgICAgIHJpZ2h0VGlsZS5kZXN0cm95KCk7XG4gICAgICB0b29sdGlwLmRpc3Bvc2UoKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLl91cGRhdGVDb25uZWN0aW9uU3RhdHVzKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSk7XG4gIH1cblxuICBfcmVuZGVyU3RhdHVzQmFyKGNvbm5lY3Rpb25TdGF0ZTogbnVtYmVyLCBmaWxlVXJpPzogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9zdGF0dXNCYXJEaXYpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zdGF0dXNCYXJUaWxlID0gUmVhY3QucmVuZGVyKFxuICAgICAgPFN0YXR1c0JhclRpbGVcbiAgICAgICAgY29ubmVjdGlvblN0YXRlPXtjb25uZWN0aW9uU3RhdGV9XG4gICAgICAgIGZpbGVVcmk9e2ZpbGVVcml9XG4gICAgICAvPixcbiAgICAgIHRoaXMuX3N0YXR1c0JhckRpdixcbiAgICApO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5kaXNwb3NlKCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW1vdGVQcm9qZWN0c0NvbnRyb2xsZXI7XG4iXX0=
