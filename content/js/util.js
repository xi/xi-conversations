function trimQuotes(s) {
	const quotes = ['"', "'"];
	return s && s.endsWith(s[0]) && quotes.includes(s[0]) ? s.slice(1, -1) : s;
}

function normalizeName(s) {
	return s.split(', ').reverse().join(' ');
}

export function getParams() {
	const params = {};
	for (const part of location.search.substr(1).split('&')) {
		const [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
}

export function h(tag, attrs, children) {
	const el = document.createElement(tag);
	for (const attr in attrs) {
		if (attr.startsWith('style:')) {
			el.style[attr.substring(6)] = attrs[attr];
		} else {
			el.setAttribute(attr, attrs[attr]);
		}
	}
	for (const child of children) {
		if (child) {
			el.append(child);
		}
	}
	return el;
}

export function createIcon(key, label) {
	const nssvg = 'http://www.w3.org/2000/svg';
	const nsxlink = 'http://www.w3.org/1999/xlink';

	const svg = document.createElementNS(nssvg, 'svg') ;
	const use = document.createElementNS(nssvg, 'use') ;
	svg.setAttribute('class', 'icon');
	svg.setAttribute('viewBox', '0 0 24 24');
	use.setAttributeNS(nsxlink, 'href', `/content/material-icons.svg#${key}`);
	svg.append(use);

	if (label) {
		svg.setAttribute('aria-label', label);
		svg.setAttribute('title', label);
	} else {
		svg.setAttribute('aria-hidden', 'true');
	}

	return svg;
}

export function createDate(date) {
	const now = new Date();
	return h('time', {'class': 'date', 'title': date.toLocaleString('sv')}, [
		date.toDateString() === now.toDateString()
			? date.toLocaleTimeString('sv')
			: date.toLocaleDateString('sv'),
	]);
}

export function createAlert(text, icon, level) {
	return h('div', {'class': `alert alert--${level}`}, [createIcon(icon), text]);
}

export function pseudoRandomColor(s) {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		const chr = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash &= 0xffff;
	}
	const hue = Math.floor(360 * hash / 0xffff);
	return `oklch(53% 0.16 ${hue + 30})`;
}

export function parseContacts(raw) {
	// sync version of messengerUtilities.parseMailboxString()
	const contacts = [];
	for (const r of raw) {
		const match = /(.*) <(.*)>/.exec(r);
		if (match) {
			contacts.push({
				name: normalizeName(trimQuotes(match[1])),
				email: match[2],
			});
		} else {
			contacts.push({
				name: r,
				email: r,
			});
		}
	}
	return contacts;
}
