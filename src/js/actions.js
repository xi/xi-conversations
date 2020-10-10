/* global browser */

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
	replyToSender: msg => browser.compose.beginReply(msg.id),
	replyAll: msg => browser.compose.beginReply(msg.id, 'replyToAll'),
	replyToList: msg => browser.compose.beginReply(msg.id, 'replyToList'),
	editAsNew: msg => browser.compose.beginEdit(msg.id),
	forward: msg => browser.compose.beginForward(msg.id),
	viewClassic: msg => browser.xi.viewClassic(msg.id),
	viewSource: viewSource,
	markAsRead: markAsRead,
	toggleFlagged: toggleFlagged,
};
