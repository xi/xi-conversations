/* global browser */

export var viewSource = function(msg) {
	browser.xi.viewSource(msg.id);
};

export var markAsRead = function(msg, read) {
	browser.messages.update(msg.id, {read: read});
};

export var toggleFlagged = function(msg, star) {
	msg.flagged = !msg.flagged;
	browser.messages.update(msg.id, {flagged: msg.flagged}).then(() => {
		star.setAttribute('aria-pressed', msg.flagged);
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

export var replyToSender = msg => reply(msg, 'replyToSender');
export var replyAll = msg => reply(msg, 'replyToAll');
export var replyToList = msg => reply(msg, 'replyToList');

export var editAsNew = function(msg) {
	getIdentity(msg).then(identity => {
		browser.compose.beginNew(msg.id, {'identityId': identity.id});
	});
};

export var forward = function(msg) {
	getIdentity(msg).then(identity => {
		browser.compose.beginForward(msg.id, null, {'identityId': identity.id});
	});
};

export var viewClassic = function(msg) {
	return browser.messageDisplay.open({messageId: msg.id});
};
