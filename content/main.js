Components.utils.import("resource:///modules/gloda/gloda.js");

var getConversation = function(msgs, cb) {
	var done = false;

	var conversationListener = {
		onItemsAdded: function() {},
		onItemsModified: function() {},
		onItemsRemoved: function() {},
		onQueryCompleted: function(collection) {
			if (!done) {
				done = true;
				cb(collection.items);
			}
		}
	};

	var listener = {
		onItemsAdded: function(items) {
			if (items.length >= 1) {
				items[0].conversation.getMessagesCollection(conversationListener, true);
			}
		},
		onItemsModified: function() {},
		onItemsRemoved: function() {},
		onQueryCompleted: function() {}
	};

	Gloda.getMessageCollectionForHeaders(msgs, listener, null);
};

window.frameElement.setAttribute('tooltip', 'aHTMLTooltip');
window.frameElement.setAttribute('context', 'mailContext');

var initialUrls = (getParams().urls || '').split(',');
var initialMsgs = initialUrls.map(uri2msg);

getConversation(initialMsgs, function(conversation) {
	var subject = conversation[0].folderMessage.mime2DecodedSubject || '(no subject)';
	document.querySelector('.conversation__subject').textContent = subject;
	document.title = subject;

	var container = document.querySelector('.conversation__main');
	var anyExpanded = false;

	for (let i = 0; i < conversation.length; i++) {
		let glodaMsg = conversation[i];

		let only = initialMsgs.length === 1 && initialMsgs[0] === glodaMsg.folderMessage;
		let expanded = only || !glodaMsg.folderMessage.isRead;

		anyExpanded = anyExpanded || expanded;
		if (!anyExpanded && i === conversation.length - 1) {
			expanded = true;
		}

		container.appendChild(createMessageElement(glodaMsg, expanded));
	}
});
