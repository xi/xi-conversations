Components.utils.import('resource:///modules/mailServices.js');

var getTags = function(msg) {
	var keywords = msg.getStringProperty('keywords');
	var keywordList = keywords.split(' ');
	var allTags = MailServices.tags.getAllTags({});
	return allTags
		.filter(tag => keywordList.indexOf(tag.key) !== -1)
		.map(tag => ({
			color: MailServices.tags.getColorForKey(tag.key).substr(1) || 'fff',
			name: tag.tag,
		}));
};

var createTag = function(tag) {
	var e = document.createElement('span');
	e.className = 'tag';
	e.textContent = tag.name;
	e.style.backgroundColor = '#' + tag.color;
	e.style.color = contrastColor(tag.color);
	return e;
};

var parseContacts = function(raw) {
	var emails = {};
	var names = {};
	var fullNames = {};
	var n = MailServices.headerParser.parseHeadersWithArray(raw, emails, names, fullNames);

	var contacts = [];
	for (let i = 0; i < n; i++) {
		var email = emails.value[i];
		var name = names.value[i] || email;
		var fullName = fullNames.value[i] || name;

		contacts.push({
			fullName: fullName,
			name: name,
			email: email,
		});
	}

	return contacts;
}

var formatContacts = function(raw) {
	var contacts = parseContacts(raw);

	var wrapper = document.createElement('span');
	for (let i = 0; i < contacts.length; i++) {
		let a = document.createElement('a');
		a.href = 'mailto:' + contacts[i].email;
		a.textContent = contacts[i].name;
		wrapper.appendChild(a);
	}
	return wrapper;
};

var createActionButton = function(msg, title, icon, action) {
	var button = document.createElement('button');
	button.className = 'button';
	button.title = title;
	button.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		action(msg);
	});
	button.appendChild(createIcon(icon));
	return button;
};

var createActions = function(glodaMsg) {
	var msg = glodaMsg.folderMessage;
	var canReplyAll = (parseContacts(msg.recipients).length + parseContacts(msg.ccList).length + parseContacts(msg.bccList).length) > 1;
	var canReplyToList = glodaMsg.mailingLists;

	var actions = document.createElement('span');
	actions.className = 'actions';

	if (canReplyToList) {
		actions.appendChild(createActionButton(msg, 'reply to list', 'list', replyToList));
	} else if (canReplyAll) {
		actions.appendChild(createActionButton(msg, 'reply all', 'reply_all', replyAll));
	} else {
		actions.appendChild(createActionButton(msg, 'reply', 'reply', replyToSender));
	}

	var dropdown = document.createElement('div');
	dropdown.className = 'dropdown';

	dropdown.appendChild(createActionButton(msg, 'reply', 'reply', replyToSender));
	if (canReplyAll) {
		dropdown.appendChild(createActionButton(msg, 'reply all', 'reply_all', replyAll));
	}
	if (canReplyToList) {
		dropdown.appendChild(createActionButton(msg, 'reply to list', 'list', replyToList));
	}
	dropdown.appendChild(createActionButton(msg, 'forward', 'forward', forward));
	dropdown.appendChild(createActionButton(msg, 'edit as new', 'edit', editAsNew));
	dropdown.appendChild(createActionButton(msg, 'view in classic reader', 'open_in_new', viewClassic));
	dropdown.appendChild(createActionButton(msg, 'view source', 'code', viewSource));
	dropdown.appendChild(createActionButton(msg, 'junk', 'whatshot', toggleJunk));
	dropdown.appendChild(createActionButton(msg, 'delete', 'delete', deleteMsg));

	var dropdownToggle = document.createElement('button');
	dropdownToggle.className = 'button';
	dropdownToggle.appendChild(createIcon('more_vert'));
	dropdownToggle.title = 'more';
	dropdownToggle.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		dropdown.classList.toggle('is-expanded');
	});
	// FIXME
	document.addEventListener('click', function() {
		dropdown.classList.remove('is-expanded');
	});
	actions.appendChild(dropdownToggle);
	actions.appendChild(dropdown);

	return actions;
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

	var author = formatContacts(msg.author);
	author.className = 'author';
	header.appendChild(author);

	var recipients = formatContacts(msg.recipients);
	prependChild(recipients, document.createTextNode(' to '));
	recipients.className = 'recipients';
	header.appendChild(recipients);

	var summary = document.createElement('span');
	summary.className = 'summary';
	summary.textContent = (glodaMsg._indexedBodyText || '').substring(0, 150);
	header.appendChild(summary);

	var _tags = getTags(msg);
	var tags = document.createElement('span');
	tags.className = 'tags';
	for (let tag of _tags) {
		tags.appendChild(createTag(tag));
	}
	header.appendChild(tags);

	if (glodaMsg.attachmentInfos.length) {
		var attachments = createIcon('attachment');
		header.appendChild(attachments);
	}

	var date = document.createElement('time');
	var d = new Date(msg.date / 1000);
	date.className = 'date';
	date.textContent = d.toLocaleDateString();  // FIXME something like moment.js
	header.appendChild(date);

	header.appendChild(createActions(glodaMsg));

	return header;
};
