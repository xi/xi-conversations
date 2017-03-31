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

var createIcon = function(key) {
	var wrapper = document.createElement('div');
	wrapper.innerHTML = '<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="chrome://xi-conversations/content/material-icons.svg#' + key + '"></use></svg>';
	return wrapper.children[0];
};

var createMessageHeader = function(glodaMsg) {
	var msg = glodaMsg.folderMessage;

	var author       = msg.author;
	var date         = msg.date;
	var to           = msg.recipients;
	var cc           = msg.ccList;
	var bcc          = msg.bccList;
	var subject      = msg.mime2DecodedSubject;
	var isRead       = msg.isRead;
	var isFlagged    = msg.isFlagged;  // markFlagged(true)
	var attachments  = glodaMsg.attachmentInfos;
	var isEncrypted  = glodaMsg.isEncrypted;
	var mailingLists = glodaMsg.mailingLists;
	var summary      = glodaMsg._indexedBodyText.substring(0, 100);
	var tags         = getTags(glodaMsg.folderMessage);

	var header = document.createElement('header');
	header.className = 'message__header';

	var star = createIcon('star');
	if (msg.isFlagged) {
		star.classList.add('is-active');
	}
	star.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();

		if (msg.isFlagged) {
			star.classList.remove('is-active');
			msg.markFlagged(false);
		} else {
			star.classList.add('is-active');
			msg.markFlagged(true);
		}
	});
	header.appendChild(star);

	var author = document.createElement('span');
	author.className = 'author';
	author.textContent = msg.author;
	header.appendChild(author);

	var recipients = document.createElement('span');
	recipients.className = 'recipients';
	recipients.textContent = ' to ' + msg.recipients;
	header.appendChild(recipients);

	var summary = document.createElement('span');
	summary.className = 'summary';
	summary.textContent = glodaMsg._indexedBodyText.substring(0, 150);
	header.appendChild(summary);

	if (glodaMsg.attachmentInfos.length) {
		var attachments = createIcon('attachment');
		header.appendChild(attachments);
	}

	var date = document.createElement('time');
	var d = new Date(msg.date / 1000);
	date.className = 'date';
	date.textContent = d.toLocaleDateString();  // FIXME something like moment.js
	header.appendChild(date);

	return header;
};

var createMessageElement = function(glodaMsg) {
	var e = document.createElement('article');
	e.className = 'message is-collapsed';

	var header = createMessageHeader(glodaMsg);
	header.addEventListener('click', function(event) {
		event.preventDefault();
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
