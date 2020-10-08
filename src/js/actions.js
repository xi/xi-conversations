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
	browser.messages.update(msg.id, {read: read});
};

var toggleFlagged = function(msg, star) {
	msg.flagged = !msg.flagged;
	browser.messages.update(msg.id, {flagged: msg.flagged}).then(() => {
		star.classList.toggle('is-active', msg.flagged);
	});
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
