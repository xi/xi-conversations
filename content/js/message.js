/* global browser */

import createBody from './body.js';
import * as actions from './actions.js';
import * as util from './util.js';

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
	};
	e.addEventListener('click', onAction);

	clear = function() {
		window.clearInterval(intervalId);
		e.removeEventListener('click', onAction);
	};
};

export default function(msg, expanded) {
	var h = util.h;
	var _ = browser.i18n.getMessage;

	var canReplyAll = msg.recipients.length + msg.ccList.length + msg.bccList.length > 1;

	var createButton = function(attrs, icon, label, labelVisible) {
		if (labelVisible) {
			return h('button', Object.assign({'type': 'button'}, attrs), [util.createIcon(icon), ' ', label]);
		} else {
			return h('button', Object.assign({'type': 'button'}, attrs), [util.createIcon(icon, label)]);
		}
	};

	var e = h('article', {'class': expanded ? 'message is-expanded' : 'message', 'id': `msg-${msg.id}`, 'tabindex': -1}, [
		h('header', {'class': 'message__header'}, [
			createButton({'class': 'star', 'aria-pressed': msg.flagged, 'data-action': 'toggleFlagged'}, 'star', _('star')),
			...util.parseContacts([msg.author]).map(author => h('a', {
				'class': 'message__author',
				'href': `mailto:${author.email}`,
				'style:color': util.pseudoRandomColor(author.email),
			}, [author.name])),
			' ',
			h('span', {'class': 'message__recipients'}, [
				_('to'),
				' ',
				...util.parseContacts(msg.recipients).map(r => h('a', {'href': `mailto:${r.email}`}, [r.name])),
				...util.parseContacts(msg.ccList).map(r => h('a', {'href': `mailto:${r.email}`, 'class': 'message__recipients__cc'}, [r.name])),
				...util.parseContacts(msg.bccList).map(r => h('a', {'href': `mailto:${r.email}`, 'class': 'message__recipients__bcc'}, [r.name])),
			]),
			h('span', {'class': 'message__summary'}, [(msg.body || '').substring(0, 150)]),
			(msg.attachmentInfos || []).length ? util.createIcon('attachment', _('attachment')) : null,
			util.createDate(msg.date),
			h('span', {'class': 'message__actions'}, [
				canReplyAll
					? createButton({'class': 'button', 'data-action': 'replyAll'}, 'reply_all', _('replyAll'))
					: msg.canReplyToList
						? createButton({'class': 'button', 'data-action': 'replyToList'}, 'list', _('replyList'))
						: createButton({'class': 'button', 'data-action': 'replyToSender'}, 'reply', _('reply')),
				createButton({'class': 'button dropdownToggle'}, 'menu', _('more')),
				h('div', {'class': 'dropdown'}, [
					createButton({'class': 'dropdown-item', 'data-action': 'replyToSender'}, 'reply', _('reply'), true),
					canReplyAll ? createButton({'class': 'dropdown-item', 'data-action': 'replyAll'}, 'reply_all', _('replyAll'), true) : null,
					msg.canReplyToList ? createButton({'class': 'dropdown-item', 'data-action': 'replyToList'}, 'list', _('replyList'), true) : null,
					createButton({'class': 'dropdown-item', 'data-action': 'forward'}, 'forward', _('forward'), true),
					createButton({'class': 'dropdown-item', 'data-action': 'editAsNew'}, 'create', _('edit'), true),
					createButton({'class': 'dropdown-item', 'data-action': 'viewClassic'}, 'open_in_new', _('viewClassic'), true),
					createButton({'class': 'dropdown-item', 'data-action': 'viewSource'}, 'code', _('viewSource'), true),
				]),
			]),
		]),
		h('div', {'class': 'message__details'}, [
			msg.junk ? util.createAlert(_('junk'), 'mode_heat', 'warning') : null,
			h('footer', {'class': 'message__footer'}, [
				h('ul', {'class': 'attachments'}, (msg.attachmentInfos || []).map(a => h('li', {}, [
					h('a', {'class': 'attachment', 'href': a.url}, [util.createIcon('attachment'), ' ', a.name]),
				]))),
			]),
		]),
	]);

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
