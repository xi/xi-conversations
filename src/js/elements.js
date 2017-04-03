var Mustache = require('mustache');

var actions = require('./actions.js');
var createIframe = require('./iframe.js');
var util = require('./util.js');

var autoMarkAsRead = function(e, glodaMsg) {
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
				actions.markAsRead(glodaMsg.folderMessage, true);
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
		var nanosecs = parseInt(render(text), 10);
		var date = new Date(nanosecs / 1000);
		return util.createDate(date).outerHTML;
	}
};

module.exports = function(glodaMsg, expanded) {
	var msg = glodaMsg.folderMessage;

	var tpl = document.getElementById('message-template').innerHTML;
	var wrapper = document.createElement('div');
	wrapper.innerHTML = Mustache.render(tpl, {
		icon: iconFilter,
		dateFilter: dateFilter,

		isExpanded: expanded,
		isFlagged: msg.isFlagged,
		isJunk: glodaMsg.folderMessage.getStringProperty('junkscore') == Components.interfaces.nsIJunkMailPlugin.IS_SPAM_SCORE,
		uri: util.msg2uri(msg),
		author: util.parseContacts(msg.author),
		recipients: util.parseContacts(msg.recipients),
		summary: (glodaMsg._indexedBodyText || '').substring(0, 150),
		tags: util.getTags(msg),
		attachments: glodaMsg.attachmentInfos,
		hasAttachments: glodaMsg.attachmentInfos.length,
		date: msg.date,
		canReplyToList: glodaMsg.mailingLists,
		canReplyAll: (util.parseContacts(msg.recipients).length + util.parseContacts(msg.ccList).length + util.parseContacts(msg.bccList).length) > 1,
	});
	var e = wrapper.children[0];

	autoMarkAsRead(e, glodaMsg);

	// header events
	var header = e.querySelector('.message__header');
	header.addEventListener('click', function(event) {
		event.preventDefault();
		e.classList.toggle('is-expanded');
		lazyLoadIframe();
	});

	// dropdown events
	var dropdownToggle = e.querySelector('.dropdownToggle');
	var dropdown = e.querySelector('.dropdown');
	dropdownToggle.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		dropdown.classList.toggle('is-expanded');
	});
	document.addEventListener('click', function() {
		dropdown.classList.remove('is-expanded');
	});

	// action events
	var buttons = e.querySelectorAll('[data-action]');
	for (let i = 0; i < buttons.length; i++) {
		let button = buttons[i];
		let fn = actions[button.dataset.action];
		button.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			fn(msg, event.currentTarget);
		});
	}

	// iframe
	var footer = e.querySelector('.message__footer');
	var details = e.querySelector('.message__details');
	var iframeLoaded = false;
	var lazyLoadIframe = function() {
		if (!iframeLoaded && e.classList.contains('is-expanded')) {
			details.insertBefore(createIframe(glodaMsg), footer);
			iframeLoaded = true;
		}
	};
	lazyLoadIframe();

	return e;
};
