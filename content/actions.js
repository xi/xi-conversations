var compose = function(compType) {
	return function(msg) {
		var mainWindow = window.frameElement.ownerDocument.defaultView;
		mainWindow.ComposeMessage(compType, Components.interfaces.nsIMsgCompFormat.Default, msg, [msg2uri(msg)]);
	};
};

var replyToSender = compose(Components.interfaces.nsIMsgCompType.ReplyToSender);
var replyAll = compose(Components.interfaces.nsIMsgCompType.ReplyAll);
var replyToList = compose(Components.interfaces.nsIMsgCompType.ReplyToList);
var editAsNew = compose(Components.interfaces.nsIMsgCompType.Template);
var editDraft = compose(Components.interfaces.nsIMsgCompType.Draft);
var forward = compose(Components.interfaces.nsIMsgCompType.ForwardInline);

var viewClassic = function(msg) {
	var tabmail = window.frameElement.ownerDocument.getElementById('tabmail');
	tabmail.openTab('message', {msgHdr: msg, background: false});
};

var viewSource = function(msg) {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	mainWindow.ViewPageSource([msg2uri(msg)]);
};

// FIXME broken
var toggleJunk = function(msg) {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var isJunk = msg.getStringProperty('junkscore') === Components.interfaces.nsIJunkMailPlugin.IS_SPAM_SCORE;
	mainWindow.JunkSelectedMessages(!isJunk);
};

var deleteMsg = function(msg) {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var e = document.getElementById(msg2uri(msg));
	e.remove();

	var tmp = Components.classes['@mozilla.org/array;1'].createInstance(Components.interfaces.nsIMutableArray);
	tmp.appendElement(msg, false);
	msg.folder.deleteMessages(tmp, mainWindow.msgWindow, false, false, null, true);

	if (document.querySelectorAll('.message').length === 0) {
		// FIXME: does nothing?
		window.closeTab();
	}
};
