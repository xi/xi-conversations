/* global browser */

export function viewSource(msg) {
	browser.xi.viewSource(msg.id);
}

export function markAsRead(msg, read) {
	browser.messages.update(msg.id, {read: read});
}

export async function toggleFlagged(msg, star) {
	msg.flagged = !msg.flagged;
	await browser.messages.update(msg.id, {flagged: msg.flagged});
	star.setAttribute('aria-pressed', msg.flagged);
}

async function getIdentity(msg) {
	const identity = await browser.identities.getDefault(msg.folder.accountId);
	return identity || {};
}

async function reply(msg, replyType) {
	const identity = await getIdentity(msg);
	await browser.compose.beginReply(msg.id, replyType, {identityId: identity.id});
}

export var replyToSender = msg => reply(msg, 'replyToSender');
export var replyAll = msg => reply(msg, 'replyToAll');
export var replyToList = msg => reply(msg, 'replyToList');

export async function editAsNew(msg) {
	const identity = await getIdentity(msg);
	await browser.compose.beginNew(msg.id, {'identityId': identity.id});
}

export async function forward(msg) {
	const identity = await getIdentity(msg);
	await browser.compose.beginForward(msg.id, null, {'identityId': identity.id});
}

export async function viewClassic(msg) {
	return await browser.messageDisplay.open({messageId: msg.id});
}
