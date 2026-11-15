/* global browser */

import createBody from './body.js';
import * as actions from './actions.js';
import * as util from './util.js';

function autoMarkAsRead(e, msg) {
	let topWasInView = false;
	let bottomWasInView = false;

	const intervalId = window.setInterval(() => {
		const rect = e.getBoundingClientRect();
		const height = window.innerHeight || document.documentElement.clientHeight;

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

	const onAction = event => {
		if (event.target.closest('button')) {
			actions.markAsRead(msg, true);
			clear();
		}
	};
	e.addEventListener('click', onAction);

	const clear = () => {
		window.clearInterval(intervalId);
		e.removeEventListener('click', onAction);
	};
}

function getListUrl(msg, key, prefix) {
	// see https://www.rfc-editor.org/rfc/rfc2369
	for (const header of msg.full.headers[key] || []) {
		for (const item of header.split(', ')) {
			const url = item.slice(item.indexOf('<') + 1, -1);
			if (url.startsWith(prefix)) {
				return url;
			}
		}
	}
}

function template(msg) {
	const h = util.h;
	const _ = browser.i18n.getMessage;

	const canReplyAll = msg.recipients.length + msg.ccList.length + msg.bccList.length > 1;

	const createButton = function(attrs, action, icon, label, labelVisible) {
		const content = labelVisible ? [util.createIcon(icon), ' ', label] : [util.createIcon(icon, label)];
		const button = h('button', Object.assign({'type': 'button'}, attrs), content);
		button.addEventListener('click', event => {
			event.preventDefault();
			action(msg, button);
		});
		return button;
	};

	const createLink = function(attrs, href, icon, label, labelVisible) {
		const content = labelVisible ? [util.createIcon(icon), ' ', label] : [util.createIcon(icon, label)];
		return h('a', Object.assign({'href': href}, attrs), content);
	};

	const listHelp = getListUrl(msg, 'list-help', 'http');
	const listArchive = getListUrl(msg, 'list-archive', 'http');
	const listUnsubscribe = getListUrl(msg, 'list-unsubscribe', 'http') || getListUrl(msg, 'list-unsubscribe', '');

	return h('article', {'class': 'message', 'id': `msg-${msg.id}`, 'tabindex': -1}, [
		h('header', {'class': 'message__header'}, [
			createButton({'class': 'star', 'aria-pressed': msg.flagged}, actions.toggleFlagged, 'star', _('star')),
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
					? createButton({'class': 'button'}, actions.replyAll, 'reply_all', _('replyAll'))
					: msg.canReplyToList
						? createButton({'class': 'button'}, actions.replyToList, 'list', _('replyList'))
						: createButton({'class': 'button'}, actions.replyToSender, 'reply', _('reply')),
				h('button', {'class': 'button', 'popovertarget': `msg-${msg.id}-dropdown`}, [util.createIcon('menu', _('more'))]),
				h('div', {'class': 'dropdown', 'id': `msg-${msg.id}-dropdown`, 'popover': 'auto'}, [
					createButton({'class': 'dropdown-item'}, actions.replyToSender, 'reply', _('reply'), true),
					canReplyAll ? createButton({'class': 'dropdown-item'}, actions.replyAll, 'reply_all', _('replyAll'), true) : null,
					msg.canReplyToList ? createButton({'class': 'dropdown-item'}, actions.replyToList, 'list', _('replyList'), true) : null,
					createButton({'class': 'dropdown-item'}, actions.forward, 'forward', _('forward'), true),
					createButton({'class': 'dropdown-item'}, actions.editAsNew, 'create', _('edit'), true),
					createButton({'class': 'dropdown-item'}, actions.viewClassic, 'open_in_new', _('viewClassic'), true),
					createButton({'class': 'dropdown-item'}, actions.viewSource, 'code', _('viewSource'), true),

					listHelp ? createLink({'class': 'dropdown-item'}, listHelp, 'info', _('listHelp'), true): null,
					listArchive ? createLink({'class': 'dropdown-item'}, listArchive, 'inventory_2', _('listArchive'), true): null,
					listUnsubscribe ? createLink({'class': 'dropdown-item'}, listUnsubscribe, 'unsubscribe', _('listUnsubscribe'), true): null,
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
}

export default function(msg, expanded) {
	const e = template(msg);

	if (expanded) {
		e.classList.add('is-expanded');
	}

	autoMarkAsRead(e, msg);

	// header events
	const header = e.querySelector('.message__header');
	header.addEventListener('click', event => {
		if (!event.defaultPrevented && !event.target.closest('a[href], [popovertarget]')) {
			event.preventDefault();
			e.classList.toggle('is-expanded');
			lazyLoadBody();
		}
	});

	// dropdown events
	const dropdown = e.querySelector('[popover]');
	e.addEventListener('focusout', event => {
		if (!event.relatedTarget || !dropdown.contains(event.relatedTarget)) {
			dropdown.hidePopover();
		}
	});

	// body
	const footer = e.querySelector('.message__footer');
	let bodyLoaded = false;
	const lazyLoadBody = () => {
		if (!bodyLoaded && e.classList.contains('is-expanded')) {
			footer.before(createBody(msg));
			bodyLoaded = true;
		}
	};
	lazyLoadBody();

	return e;
}
