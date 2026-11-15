/* global browser */

import * as util from './util.js';

const RE_LINK = /(https?:\/\/[^\s<>]*[^\s\])}<>.,:;?!"'])/g;

function createDetails(label, color) {
	const details = document.createElement('details');
	const summary = document.createElement('summary');
	summary.textContent = label;
	summary.style.color = color;
	details.append(summary);
	return details;
}

function renderLinks(parent, text) {
	text.split(RE_LINK).forEach((s, i) => {
		if (i % 2 === 0) {
			parent.append(document.createTextNode(s));
		} else {
			const a = document.createElement('a');
			a.textContent = s;
			a.href = s;
			parent.append(a);
		}
	});
}

function renderQuotes(parent, lines, nested) {
	let quote = [];

	const flushQuote = () => {
		if (quote.length) {
			const blockquote = document.createElement('blockquote');
			renderQuotes(blockquote, quote, true);
			if (nested) {
				parent.append(blockquote);
			} else {
				const details = createDetails(browser.i18n.getMessage('toggleQuote'), 'orange');
				details.append(blockquote);
				parent.append(details);
			}
			quote = [];
		}
	};

	for (const line of lines) {
		if (line.startsWith('>')) {
			quote.push(line.substr(1).trimStart());
		} else {
			flushQuote();
			renderLinks(parent, line + '\n');
		}
	}
	flushQuote();
}

function renderBody(parent, text) {
	// https://www.rfc-editor.org/rfc/rfc3676
	// https://en.wikipedia.org/wiki/Posting_style
	// http://www.asciiribbon.org/

	const [body, ...sig] = text.replaceAll('\r', '').split('\n-- \n');
	renderQuotes(parent, body.split('\n'));

	if (sig.length) {
		const div = document.createElement('div');
		div.className = 'moz-signature';
		renderLinks(div, sig.join('\n-- \n'));

		const details = createDetails(browser.i18n.getMessage('toggleSig'), 'rgb(56, 117, 215)');
		details.append(div);
		parent.append(details);
	}
}

export default function(msg) {
	const wrapper = document.createElement('div');
	const pre = document.createElement('pre');
	pre.className = 'message__body';
	wrapper.append(pre);

	// wrapper if filled async, after we return
	browser.messages.listInlineTextParts(msg.id).then(async parts => {
		let body = '';
		if (parts.some(p => p.contentType.startsWith('text/plain'))) {
			body = parts
				.filter(p => p.contentType.startsWith('text/plain'))
				.map(p => p.content)
				.join('\n\n');
		} else if (parts.some(p => p.contentType.startsWith('text/html'))) {
			const html = parts.find(p => p.contentType.startsWith('text/html')).content;
			body = await browser.messengerUtilities.convertToPlainText(html);
		} else if (parts.length) {
			body = parts[0].content;
		}

		if (msg.full.decryptionStatus !== 'none') {
			wrapper.prepend(util.createAlert(browser.i18n.getMessage('encrypted'), 'lock', 'info'));
		}
		renderBody(pre, body || browser.i18n.getMessage('emptyBody'));
	});

	return wrapper;
}
