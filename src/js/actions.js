var compose = function(compType) {
	// return function(msg) {
	// 	var mainWindow = window.frameElement.ownerDocument.defaultView;
	// 	mainWindow.ComposeMessage(compType, Components.interfaces.nsIMsgCompFormat.Default, msg, [util.msg2uri(msg)]);
	// };
};

var viewClassic = function(msg) {
	// var tabmail = window.frameElement.ownerDocument.getElementById('tabmail');
	// tabmail.openTab('message', {msgHdr: msg, background: false});
};

var viewSource = function(msg) {
	// var mainWindow = window.frameElement.ownerDocument.defaultView;
	// mainWindow.ViewPageSource([util.msg2uri(msg)]);
};

var markAsRead = function(msg, read) {
	// var tmp = Components.classes['@mozilla.org/array;1'].createInstance(Components.interfaces.nsIMutableArray);
	// tmp.appendElement(msg, false);
	// msg.folder.markMessagesRead(tmp, read);
};

var toggleFlagged = function(msg, star) {
	// if (msg.isFlagged) {
	// 	star.classList.remove('is-active');
	// 	msg.markFlagged(false);
	// } else {
	// 	star.classList.add('is-active');
	// 	msg.markFlagged(true);
	// }
};

module.exports = {
	replyToSender: compose('ReplyToSender'),
	replyAll: compose('ReplyAll'),
	replyToList: compose('ReplyToList'),
	editAsNew: compose('Template'),
	forward: compose('ForwardInline'),
	viewClassic: viewClassic,
	viewSource: viewSource,
	markAsRead: markAsRead,
	toggleFlagged: toggleFlagged,
};
