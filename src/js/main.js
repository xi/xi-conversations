/* global browser */

var createMessageElement = require('./message');
var util = require('./util.js');

var initialIDs = (util.getParams().ids || '').split(',');

var container = document.querySelector('.conversation__main');
var anyExpanded = false;

var getMessageForId = function(id) {
	return browser.messages.query({headerMessageId: id}).then(page => {
		if (!page.messages.length) {
			throw null;
		}
		return page.messages[0];
	});
};

browser.xi.getConversation(initialIDs).catch(() => {
	return Promise.all(initialIDs.map(getMessageForId));
}).then(function(conversation) {
	var subject = conversation[0].subject || '(no subject)';
	document.querySelector('.conversation__subject').textContent = subject;
	document.title = subject;

	for (let i = 0; i < conversation.length; i++) {
		const msg = conversation[i];
		const expanded = (
			conversation.length === 1
			|| !msg.read
			|| (initialIDs.length === 1 && initialIDs.includes(msg.headerMessageId))
			|| (!anyExpanded && i === conversation.length - 1)
		);

		const message = createMessageElement(msg, expanded);
		container.appendChild(message);

		if (!anyExpanded && expanded) {
			message.focus();
		}

		anyExpanded = anyExpanded || expanded;
	}
});
