Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import("resource:///modules/gloda/gloda.js");
Components.utils.import("resource:///modules/mailServices.js");
var Messenger = Components.classes['@mozilla.org/messenger;1'].createInstance(Components.interfaces.nsIMessenger);

var getParams = function() {
	let params = {};
	for (let part of location.search.substr(1).split('&')) {
		var [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
};

var uri2url = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	var _output = {};
	messageService.GetUrlForUri(uri, _output, null);
	return _output.value.spec;
};

var uri2msg = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	return messageService.messageURIToMsgHdr(uri);
};

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
};

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

var compose = function(compType) {
	return function(msg) {
		var mainWindow = window.frameElement.ownerDocument.defaultView;
		mainWindow.ComposeMessage(compType, Ci.nsIMsgCompFormat.Default, msg, [msg2uri(msg)]);
	};
};

var replyToSender = compose(Components.interfaces.nsIMsgCompType.ReplyToSender);
var replyAll = compose(Components.interfaces.nsIMsgCompType.ReplyAll);
var replyToList = compose(Components.interfaces.nsIMsgCompType.ReplyToList);
var editAsNew = compose(Components.interfaces.nsIMsgCompType.Template);
var editDraft = compose(Components.interfaces.nsIMsgCompType.Draft);
var forward = compose(Components.interfaces.nsIMsgCompType.ForwardInline);

var getTags = function(msg) {
	var keywords = msg.getStringProperty('keywords');
	var keywordList = keywords.split(' ');
	var allTags = MailServices.tags.getAllTags({});
	return allTags.filter(tag => keywordList.indexOf(tag.key) !== -1);
}

var createMessageElement = function(glodaMsg) {
	var author       = glodaMsg.folderMessage.author;
	var date         = glodaMsg.folderMessage.date;
	var to           = glodaMsg.folderMessage.recipients;
	var cc           = glodaMsg.folderMessage.ccList;
	var bcc          = glodaMsg.folderMessage.bccList;
	var subject      = glodaMsg.folderMessage.mime2DecodedSubject;
	var isRead       = glodaMsg.folderMessage.isRead;
	var isFlagged    = glodaMsg.folderMessage.isFlagged;  // markFlagged(true)
	var attachments  = glodaMsg.attachmentInfos;
	var isEncrypted  = glodaMsg.isEncrypted;
	var mailingLists = glodaMsg.mailingLists;
	var summary      = glodaMsg._indexedBodyText.substring(0, 100);
	var tags         = getTags(glodaMsg.folderMessage);

	var e = document.createElement('article');
	e.className = 'message is-collapsed';

	var header = document.createElement('header');
	header.className = 'message__header';
	header.textContent = author;
	header.addEventListener('click', function() {
		e.classList.toggle('is-collapsed');
	});
	e.appendChild(header);

	var iframe = document.createElement('iframe');
	iframe.src = uri2url(msg2uri(glodaMsg.folderMessage));
	iframe.className = 'message__body';
	iframe.addEventListener('DOMContentLoaded', function() {
		iframe.style.display = 'block';
		iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
		iframe.style.display = null;
	});
	e.appendChild(iframe);

	return e;
};

var initialUrls = (getParams().urls || '').split(',');
var initialMsgs = initialUrls.map(uri2msg);

getConversation(initialMsgs, function(conversation) {
	var container = document.querySelector('.conversation__main');
	for (let glodaMsg of conversation) {
		container.appendChild(createMessageElement(glodaMsg));
	}
});
