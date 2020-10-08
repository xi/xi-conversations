var createMessageElement = require('./message');
var util = require('./util.js');

window.frameElement.setAttribute('tooltip', 'aHTMLTooltip');
window.frameElement.setAttribute('context', 'mailContext');

var initialUrls = (util.getParams().urls || '').split(',');
var initialMsgs = initialUrls.map(util.uri2msg);

var container = document.querySelector('.conversation__main');
var anyExpanded = false;

getConversation(initialMsgs, function(conversation) {
	// ignore any message without a folderMessage
	conversation = conversation.filter(x => x.folderMessage);
	conversation = util.unique(conversation, x => x.headerMessageID);

	var subject = conversation[0].folderMessage.mime2DecodedSubject || '(no subject)';
	document.querySelector('.conversation__subject').textContent = subject;
	document.title = subject;

	for (let i = 0; i < conversation.length; i++) {
		const glodaMsg = conversation[i];

		const only = initialMsgs.length === 1 && initialMsgs[0] === glodaMsg.folderMessage;
		let expanded = only || !glodaMsg.folderMessage.isRead;

		if (!anyExpanded && i === conversation.length - 1) {
			expanded = true;
		}

		const message = createMessageElement(glodaMsg, expanded);
		container.appendChild(message);

		if (!anyExpanded && expanded) {
			message.focus();
			window.scrollY = message.offsetTop - 50;
		}

		anyExpanded = anyExpanded || expanded;
	}
});
