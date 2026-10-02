/* global browser */

export function viewSource(msg) {
	browser.xi.viewSource(msg.id);
}

export function markAsRead(msg, read) {
	browser.messages.update(msg.id, {read: read});
}

export function toggleFlagged(msg, star) {
	msg.flagged = !msg.flagged;
	browser.messages.update(msg.id, {flagged: msg.flagged}).then(() => {
		star.setAttribute('aria-pressed', msg.flagged);
	});
}

function getIdentity(msg) {
	return browser.identities.getDefault(msg.folder.accountId)
		.then(identity => identity || {});
}

function reply(msg, replyType) {
	getIdentity(msg).then(identity => {
		browser.compose.beginReply(msg.id, replyType, {identityId: identity.id});
	});
}

export var replyToSender = msg => reply(msg, 'replyToSender');
export var replyAll = msg => reply(msg, 'replyToAll');
export var replyToList = msg => reply(msg, 'replyToList');

export function editAsNew(msg) {
	getIdentity(msg).then(identity => {
		browser.compose.beginNew(msg.id, {'identityId': identity.id});
	});
}

export function forward(msg) {
	getIdentity(msg).then(identity => {
		browser.compose.beginForward(msg.id, null, {'identityId': identity.id});
	});
}

export function viewClassic(msg) {
	return browser.messageDisplay.open({messageId: msg.id});
}
