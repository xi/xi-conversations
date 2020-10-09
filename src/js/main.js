/* global browser */

var createMessageElement = require('./message');
var util = require('./util.js');

var initialUris = (util.getParams().uris || '').split(',');

var container = document.querySelector('.conversation__main');
var anyExpanded = false;

browser.xi.getConversation(initialUris).then(async function(ids) {
	ids = util.unique(ids, i => i);
	var conversation = await Promise.all(ids.map(id => browser.messages.get(id)));

	var subject = conversation[0].subject || '(no subject)';
	document.querySelector('.conversation__subject').textContent = subject;
	document.title = subject;

	for (let i = 0; i < conversation.length; i++) {
		const msg = conversation[i];
		const expanded = conversation.length === 1 || !msg.read || (!anyExpanded && i === conversation.length - 1);

		const message = createMessageElement(msg, expanded);
		container.appendChild(message);

		if (!anyExpanded && expanded) {
			message.focus();
		}

		anyExpanded = anyExpanded || expanded;
	}
});
