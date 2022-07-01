var Mustache = require('mustache');

var actions = require('./actions.js');
var createBody = require('./body.js');
var util = require('./util.js');

var autoMarkAsRead = function(e, msg) {
	var topWasInView = false;
	var bottomWasInView = false;
	var clear;

	var intervalId = window.setInterval(function() {
		var rect = e.getBoundingClientRect();
		var height = window.innerHeight || document.documentElement.clientHeight;

		if (e.classList.contains('is-expanded')) {
			if (rect.top >= 0 && rect.top < height) {
				topWasInView = true;
			}
			if (rect.bottom >= 0 && rect.bottom < height) {
				bottomWasInView = true;
			}
			if (topWasInView && bottomWasInView) {
				actions.markAsRead(msg, true);
				clear();
			}
		}
	}, 100);

	var onAction = function(event) {
		if (event.target.closest('[data-action]')) {
			actions.markAsRead(msg, true);
			clear();
		}
	}
	e.addEventListener('click', onAction);

	clear = function() {
		window.clearInterval(intervalId);
		e.removeEventListener('click', onAction);
	};
};

var iconFilter = function() {
	return function(text, render) {
		var key = render(text);
		return util.createIcon(key).outerHTML;
	};
};

var dateFilter = function() {
	return function(text, render) {
		var date = new Date(render(text));
		return util.createDate(date).outerHTML;
	};
};

var authorColorFilter = function() {
	return function(text, render) {
		return util.pseudoRandomColor(render(text));
	};
};

var stringFilter = function() {
	return function(text, render) {
		return browser.i18n.getMessage(render(text));
	};
};

module.exports = function(msg, expanded) {
	var tpl = document.getElementById('message-template').innerHTML;
	var html = Mustache.render(tpl, {
		icon: iconFilter,
		dateFilter: dateFilter,
		authorColor: authorColorFilter,
		str: stringFilter,

		id: msg.id,
		isExpanded: expanded,
		isFlagged: msg.flagged,
		isJunk: msg.junk,
		isEncrypted: msg.isEncrypted,
		author: util.parseContacts([msg.author]),
		recipients: util.parseContacts(msg.recipients),
		cc: util.parseContacts(msg.ccList),
		bcc: util.parseContacts(msg.bccList),
		summary: (msg.body || '').substring(0, 150),
		attachments: msg.attachmentInfos,
		hasAttachments: (msg.attachmentInfos || []).length,
		date: msg.date,
		canReplyToList: msg.canReplyToList,
		canReplyAll: (util.parseContacts(msg.recipients).length + util.parseContacts(msg.ccList).length + util.parseContacts(msg.bccList).length) > 1,
	});
	var e = util.html2element(html);

	autoMarkAsRead(e, msg);

	// header events
	var header = e.querySelector('.message__header');
	header.addEventListener('click', function(event) {
		if (!event.defaultPrevented) {
			event.preventDefault();
			e.classList.toggle('is-expanded');
			lazyLoadBody();
		}
	});

	// dropdown events
	var dropdownToggle = e.querySelector('.dropdownToggle');
	var dropdown = e.querySelector('.dropdown');
	dropdownToggle.addEventListener('click', function(event) {
		event.preventDefault();
		dropdown.classList.toggle('is-expanded');
	});
	document.addEventListener('focusout', function(event) {
		if (!event.relatedTarget || !dropdown.contains(event.relatedTarget)) {
			dropdown.classList.remove('is-expanded');
		}
	});

	// action events
	var buttons = e.querySelectorAll('[data-action]');
	for (let i = 0; i < buttons.length; i++) {
		const button = buttons[i];
		const fn = actions[button.dataset.action];
		button.addEventListener('click', function(event) {
			event.preventDefault();
			fn(msg, event.currentTarget);
		});
	}

	// body
	var footer = e.querySelector('.message__footer');
	var details = e.querySelector('.message__details');
	var bodyLoaded = false;
	var lazyLoadBody = function() {
		if (!bodyLoaded && e.classList.contains('is-expanded')) {
			details.insertBefore(createBody(msg), footer);
			bodyLoaded = true;
		}
	};
	lazyLoadBody();

	return e;
};
