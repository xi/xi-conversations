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

var adjustHeight = function(iframe) {
	var scrollX = window.scrollX;
	var scrollY = window.scrollY;
	iframe.style.display = 'block';
	iframe.style.height = 'auto';
	iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
	iframe.style.display = null;
	window.scrollTo(scrollX, scrollY);
};

var hideBlocks = function(iframe, test, hideText, showText, color) {
	var doc = iframe.contentDocument;

	walkDOM(doc, test, function(node) {
		var hidden = true;

		var update = function() {
			if (hidden) {
				node.style.display = 'none';
				toggle.textContent = showText;
			} else {
				node.style.display = null;
				toggle.textContent = hideText;
			}
			adjustHeight(iframe);
		};

		var toggle = doc.createElement('button');
		toggle.addEventListener('click', function(event) {
			hidden = !hidden;
			update();
		}, true);

		toggle.style.border = 0;
		toggle.style.padding = 0;
		toggle.style.background = 'none';
		toggle.style.fontSize = '80%';
		toggle.style.color = color;

		node.parentNode.insertBefore(toggle, node);

		update();
	});
};

var createIframe = function(glodaMsg) {
	var iframe = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'iframe');
	iframe.setAttribute('type', 'content');
	iframe.className = 'message__body';

	var onLoad = function(event, charset) {
		iframe.removeEventListener('load', onLoad, true);

		iframe.addEventListener('DOMContentLoaded', function() {
			adjustHeight(iframe);

			hideBlocks(iframe, function(node) {
				if (node.tagName && node.tagName.toLowerCase() === 'blockquote') {
					return node.textContent.length > 200;
				}
			}, '-- hide quote --', '-- show quote --', 'orange');

			hideBlocks(iframe, function(node) {
				return node.classList && node.classList.contains('moz-txt-sig');
			}, '-- hide signature --', '-- show signature --', 'rgb(56, 117, 215)');
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

var createMessageElement = function(glodaMsg, expanded) {
	var e = document.createElement('article');
	e.className = 'message';

	if (!expanded) {
		e.classList.add('is-collapsed');
	}

	var iframeLoaded = false;
	var lazyLoadIframe = function() {
		if (!iframeLoaded && !e.classList.contains('is-collapsed')) {
			e.appendChild(createIframe(glodaMsg));
			iframeLoaded = true;
		}
	};

	var header = createMessageHeader(glodaMsg);
	header.addEventListener('click', function(event) {
		event.preventDefault();
		e.classList.toggle('is-collapsed');
		lazyLoadIframe();
	});
	e.appendChild(header);

	lazyLoadIframe();

	return e;
};
