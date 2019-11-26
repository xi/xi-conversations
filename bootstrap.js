ChromeUtils.import('resource://gre/modules/Services.jsm');

var monkeyPatchWindow = function(win) {
	win.ThreadPaneDoubleClick = function() {
		var tabmail = win.document.getElementById('tabmail');

		var msgs = win.gFolderDisplay.selectedMessages;
		var urls = msgs.map(msg => msg.folder.getUriForMsg(msg));
		var queryString = '?urls=' + win.encodeURIComponent(urls);

		tabmail.openTab('chromeTab', {
			chromePage: 'chrome://xi-conversations/content/main.html' + queryString,
		});
	};
};

var observer = function(win, topic) {
	win.addEventListener('load', function() {
		if (topic === 'domwindowopened' && win.location.href === 'chrome://messenger/content/messenger.xul') {
			monkeyPatchWindow(win);
		}
	});
};

function startup(data, reason) {
	Services.ww.registerNotification(observer);

	var e = Services.ww.getWindowEnumerator();
	while (e.hasMoreElements()) {
		observer(e.getNext(), 'domwindowopened');
	}
}

function shutdown(data, reason) {
	Services.ww.unregisterNotification(observer);
}

function install(data, reason) {}
function uninstall(data, reason) {}
