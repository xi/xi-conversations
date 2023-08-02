/* global browser */

var viewSource = function(msg) {
	browser.xi.viewSource(msg.id);
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

var getIdentity = function(msg) {
	return browser.identities.getDefault(msg.folder.accountId)
		.then(identity => identity || {});
};

var reply = function(msg, replyType) {
	getIdentity(msg).then(identity => {
		browser.compose.beginReply(msg.id, replyType, {identityId: identity.id});
	});
};

module.exports = {
	replyToSender: msg => reply(msg, 'replyToSender'),
	replyAll: msg => reply(msg, 'replyToAll'),
	replyToList: msg => reply(msg, 'replyToList'),
	editAsNew: msg => {
		getIdentity(msg).then(identity => {
			browser.compose.beginNew(msg.id, {'identityId': identity.id});
		});
	},
	forward: msg => {
		getIdentity(msg).then(identity => {
			browser.compose.beginForward(msg.id, null, {'identityId': identity.id});
		});
	},
	viewClassic: msg => browser.messageDisplay.open({messageId: msg.id}),
	viewSource: viewSource,
	markAsRead: markAsRead,
	toggleFlagged: toggleFlagged,
};
