var trimQuotes = function(s) {
	var quotes = ['"', "'"];
	return s && s.endsWith(s[0]) && quotes.includes(s[0]) ? s.slice(1, -1) : s;
};

var normalizeName = function(s) {
	return s.split(', ').reverse().join(' ');
}

export var getParams = function() {
	const params = {};
	for (let part of location.search.substr(1).split('&')) {
		let [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
};

export var h = function(tag, attrs, children) {
	var el = document.createElement(tag);
	for (let attr in attrs) {
		if (attr.startsWith('style:')) {
			el.style[attr.substring(6)] = attrs[attr];
		} else {
			el.setAttribute(attr, attrs[attr]);
		}
	}
	for (let child of children) {
		if (child) {
			el.append(child);
		}
	}
	return el;
};

export var createIcon = function(key, label) {
	var nssvg = 'http://www.w3.org/2000/svg';
	var nsxlink = 'http://www.w3.org/1999/xlink';

	var svg = document.createElementNS(nssvg, 'svg') ;
	var use = document.createElementNS(nssvg, 'use') ;
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
};

export var createDate = function(date) {
	var now = new Date();
	return h('time', {'class': 'date', 'title': date.toLocaleString('sv')}, [
		date.toDateString() === now.toDateString()
			? date.toLocaleTimeString('sv')
			: date.toLocaleDateString('sv')
	]);
};

export var createAlert = function(text, icon, level) {
	return h('div', {'class': `alert alert--${level}`}, [createIcon(icon), text]);
};

export var pseudoRandomColor = function(s) {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		const chr = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash &= 0xffff;
	}
	var hue = Math.floor(360 * hash / 0xffff);
	return `oklch(53% 0.16 ${hue + 30})`;
};

export var parseContacts = function(raw) {
	// sync version of messengerUtilities.parseMailboxString()
	var contacts = [];
	for (var r of raw) {
		var match = /(.*) <(.*)>/.exec(r);
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
};
