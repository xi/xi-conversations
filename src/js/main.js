var createMessageElement = require('./elements');
var util = require('./util.js');

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
		onItemsAdded: function() {},
		onItemsModified: function() {},
		onItemsRemoved: function() {},
		onQueryCompleted: function(collection) {
			if (collection.items.length) {
				var conversation = collection.items[0].conversation;
				conversation.getMessagesCollection(conversationListener, true);
			} else {
				cb(msgs.map(function(msg) {
					return {
						folderMessage: msg,
						attachmentInfos: [],
						mailingLists: null,
						_indexedBodyText: null
					};
				}));
			}
		}
	};

	Gloda.getMessageCollectionForHeaders(msgs, listener, null);
};

window.frameElement.setAttribute('tooltip', 'aHTMLTooltip');
window.frameElement.setAttribute('context', 'mailContext');

var initialUrls = (util.getParams().urls || '').split(',');
var initialMsgs = initialUrls.map(util.uri2msg);

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

		if (!anyExpanded && i === conversation.length - 1) {
			expanded = true;
		}

		let message = createMessageElement(glodaMsg, expanded);
		container.appendChild(message);

		if (!anyExpanded && expanded) {
			message.focus();
			window.scrollY = message.offsetTop - 50;
		}

		anyExpanded = anyExpanded || expanded;
	}
});
