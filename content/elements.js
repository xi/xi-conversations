Components.utils.import('resource:///modules/mailServices.js');

var getTags = function(msg) {
	var keywords = msg.getStringProperty('keywords');
	var keywordList = keywords.split(' ');
	var allTags = MailServices.tags.getAllTags({});
	return allTags.filter(tag => keywordList.indexOf(tag.key) !== -1);
};

var createIcon = function(key) {
	var wrapper = document.createElement('div');
	wrapper.innerHTML = '<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="chrome://xi-conversations/content/material-icons.svg#' + key + '"></use></svg>';
	return wrapper.children[0];
};

var createMessageHeader = function(glodaMsg) {
	var msg = glodaMsg.folderMessage;

	// var author       = msg.author;
	// var date         = msg.date;
	// var to           = msg.recipients;
	// var cc           = msg.ccList;
	// var bcc          = msg.bccList;
	// var subject      = msg.mime2DecodedSubject;
	// var isRead       = msg.isRead;
	// var isFlagged    = msg.isFlagged;  // markFlagged(true)
	// var attachments  = glodaMsg.attachmentInfos;
	// var isEncrypted  = glodaMsg.isEncrypted;
	// var mailingLists = glodaMsg.mailingLists;
	// var summary      = glodaMsg._indexedBodyText.substring(0, 100);
	// var tags         = getTags(glodaMsg.folderMessage);

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
	summary.textContent = (glodaMsg._indexedBodyText || '').substring(0, 150);
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

	var _reply = document.createElement('button');
	_reply.className = 'action';
	_reply.textContent = 'reply';
	_reply.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		replyToSender(msg);
	});
	header.appendChild(_reply);

	return header;
};

var createIframe = function(glodaMsg) {
	var iframe = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'iframe');
	iframe.setAttribute('type', 'content');
	iframe.className = 'message__body';

	var onLoad = function(event, charset) {
		iframe.removeEventListener('load', onLoad, true);

		iframe.addEventListener('DOMContentLoaded', function() {
			iframe.style.display = 'block';
			iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
			iframe.style.display = null;
		});

		var uri = msg2uri(glodaMsg.folderMessage);
		var messageService = Messenger.messageServiceFromURI(uri2url(uri));
		var mainWindow = window.frameElement.ownerDocument.defaultView;
		iframe.docShell.contentViewer.forceCharacterSet = 'UTF-8';
		messageService.DisplayMessage(uri, iframe.docShell, mainWindow.msgWindow, {}, charset, {});
	};

	iframe.addEventListener('load', onLoad, true);
	return iframe;
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

	e.appendChild(createIframe(glodaMsg));
	return e;
};
