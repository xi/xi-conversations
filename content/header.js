Components.utils.import('resource:///modules/mailServices.js');

var getTags = function(msg) {
	var keywords = msg.getStringProperty('keywords');
	var keywordList = keywords.split(' ');
	var allTags = MailServices.tags.getAllTags({});
	return allTags.filter(tag => keywordList.indexOf(tag.key) !== -1);
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
