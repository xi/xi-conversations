var Mustache = require('mustache');

var actions = require('./actions.js');
// var createIframe = require('./iframe.js');
var util = require('./util.js');

var autoMarkAsRead = function(e, msg) {
	var topWasInView = false;
	var bottomWasInView = false;

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
				window.clearInterval(intervalId);
			}
		}
	}, 100);
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
			lazyLoadIframe();
		}
	});

	// dropdown events
	var dropdownToggle = e.querySelector('.dropdownToggle');
	var dropdown = e.querySelector('.dropdown');
	dropdownToggle.addEventListener('click', function(event) {
		event.preventDefault();
		if (!dropdownToggle.classList.contains('is-expanded')) {
			// trigger after the remove handler
			setTimeout(function() {
				dropdown.classList.add('is-expanded');
			});
		}
	});
	document.addEventListener('click', function() {
		dropdown.classList.remove('is-expanded');
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

	// iframe
	var footer = e.querySelector('.message__footer');
	var details = e.querySelector('.message__details');
	var iframeLoaded = false;
	var lazyLoadIframe = function() {
		if (!iframeLoaded && e.classList.contains('is-expanded')) {
			// details.insertBefore(createIframe(msg), footer);
			iframeLoaded = true;
		}
	};
	lazyLoadIframe();

	return e;
};
