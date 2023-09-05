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

var createAuthor = function(author) {
	var a = util.h('a', {'class': 'message__author', 'href': `mailto:${author.email}`}, [author.name]);
	a.style.color = util.pseudoRandomColor(author.email);
	return a;
};

var template = function(ctx) {
	var h = util.h;
	var _ = browser.i18n.getMessage;

	return h('article', {'class': ctx.isExpanded ? 'message is-expanded' : 'message', 'id': `msg-${ctx.id}`, 'tabindex': -1}, [
		h('header', {'class': 'message__header'}, [
			h('button', {'class': ctx.isFlagged ? 'star is-active' : 'star', 'data-action': 'toggleFlagged'}, [util.createIcon('star')]),
			createAuthor(ctx.author),
			' ',
			h('span', {'class': 'message__recipients'}, [
				_('to'),
				' ',
				...ctx.recipients.map(r => h('a', {'href': `mailto:${r.email}`}, [r.name])),
				...ctx.cc.map(r => h('a', {'href': `mailto:${r.email}`, 'class': 'message__recipients__cc'}, [r.name])),
				...ctx.bcc.map(r => h('a', {'href': `mailto:${r.email}`, 'class': 'message__recipients__bcc'}, [r.name])),
			]),
			h('span', {'class': 'message__summary'}, [ctx.summary]),
			ctx.hasAttachments ? util.createIcon('attachment') : null,
			util.createDate(ctx.date),
			h('span', {'class': 'message__actions'}, [
				ctx.canReplyAll
					? h('button', {'class': 'button', 'title': _('replyAll'), 'data-action': 'replyAll'}, [util.createIcon('reply_all')])
					: ctx.canReplyToList
						? h('button', {'class': 'button', 'title': _('replyList'), 'data-action': 'replyToList'}, [util.createIcon('list')])
						: h('button', {'class': 'button', 'title': _('reply'), 'data-action': 'replyToSender'}, [util.createIcon('reply')]),
				h('button', {'class': 'button dropdownToggle', 'title': _('more')}, [util.createIcon('menu')]),
				h('div', {'class': 'dropdown'}, [
					h('button', {'class': 'dropdown-item', 'data-action': 'replyToSender'}, [util.createIcon('reply'), ' ', _('reply')]),
					ctx.canReplyAll ? h('button', {'class': 'dropdown-item', 'data-action': 'replyAll'}, [util.createIcon('reply_all'), ' ', _('replyAll')]) : null,
					ctx.canReplyToList ? h('button', {'class': 'dropdown-item', 'data-action': 'replyToList'}, [util.createIcon('list'), ' ', _('replyList')]) : null,
					h('button', {'class': 'dropdown-item', 'data-action': 'forward'}, [util.createIcon('forward'), ' ', _('forward')]),
					h('button', {'class': 'dropdown-item', 'data-action': 'editAsNew'}, [util.createIcon('create'), ' ', _('edit')]),
					h('button', {'class': 'dropdown-item', 'data-action': 'viewClassic'}, [util.createIcon('open_in_new'), ' ', _('viewClassic')]),
					h('button', {'class': 'dropdown-item', 'data-action': 'viewSource'}, [util.createIcon('code'), ' ', _('viewSource')]),
				]),
			]),
		]),
		h('div', {'class': 'message__details'}, [
			ctx.isJunk ? util.createAlert(_('junk'), 'mode_heat', 'warning') : null,
			h('footer', {'class': 'message__footer'}, [
				h('ul', {'class': 'attachments'}, (ctx.attachments || []).map(a => h('li', {}, [
					h('a', {'class': 'attachment', 'href': a.url}, [util.createIcon('attachment'), ' ', a.name]),
				]))),
			]),
		]),
	]);
};

export default function(msg, expanded) {
	var e = template({
		id: msg.id,
		isExpanded: expanded,
		isFlagged: msg.flagged,
		isJunk: msg.junk,
		isEncrypted: msg.isEncrypted,
		author: util.parseContacts([msg.author])[0],
		recipients: util.parseContacts(msg.recipients),
		cc: util.parseContacts(msg.ccList),
		bcc: util.parseContacts(msg.bccList),
		summary: (msg.body || '').substring(0, 150),
		attachments: msg.attachmentInfos,
		hasAttachments: (msg.attachmentInfos || []).length,
		date: msg.date,
		canReplyToList: msg.canReplyToList,
		canReplyAll: (
			util.parseContacts(msg.recipients).length
			+ util.parseContacts(msg.ccList).length
			+ util.parseContacts(msg.bccList).length
		) > 1,
	});

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
