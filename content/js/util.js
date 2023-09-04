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

export var getBody = function(msgPart) {
	if (msgPart.body && msgPart.contentType.startsWith('text/plain')) {
		return [msgPart.body, msgPart.isEncrypted];
	} else if (msgPart.parts) {
		var bodies = [];
		var encrypted = (
			msgPart.isEncrypted
			&& !msgPart.contentType.startsWith('multipart/signed')
		);
		for (var part of msgPart.parts) {
			var [body, e] = getBody(part);
			if (body) {
				bodies.push(body);
				encrypted |= e;
			}
		}
		return [bodies.join('\n\n'), encrypted];
	} else {
		return ['', false];
	}
};

export var html2element = function(html) {
	// thunderbird 60 will remove some elements when directly assigning to
	// innerHTML
	var parser = new DOMParser();
	var doc = parser.parseFromString('<!DOCTYPE html>\n' + html, 'text/html');
	return doc.body.children[0];
};

export var createIcon = function(key) {
	var nssvg = 'http://www.w3.org/2000/svg';
	var nsxlink = 'http://www.w3.org/1999/xlink';

	var svg = document.createElementNS(nssvg, 'svg') ;
	var use = document.createElementNS(nssvg, 'use') ;
	svg.setAttribute('class', 'icon');
	svg.setAttribute('viewBox', '0 -960 960 960');
	use.setAttributeNS(nsxlink, 'href', `/content/material-icons.svg#${key}`);
	svg.append(use);

	return svg;
};

export var createDate = function(date) {
	var now = new Date();
	var e = document.createElement('time');
	e.className = 'date';
	if (date.toDateString() === now.toDateString()) {
		e.textContent = date.toLocaleTimeString('sv');
	} else {
		e.textContent = date.toLocaleDateString('sv');
	}
	e.title = date.toLocaleString();
	return e;
};

export var createAlert = function(text, icon, level) {
	var e = document.createElement('div');
	e.className = 'alert alert--' + level;
	e.textContent = text;
	e.prepend(createIcon(icon));
	return e;
};

export var pseudoRandomColor = function(s) {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		const chr = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash &= 0xffff;
	}
	var hue = Math.floor(360 * hash / 0xffff);

	// try to provide a consistent lightness across hues
	var lightnessStops = [48, 25, 28, 27, 62, 42];
	var j = Math.floor(hue / 60);
	var l1 = lightnessStops[j];
	var l2 = lightnessStops[(j + 1) % 6];
	var lightness = Math.floor((hue / 60 - j) * (l2 - l1) + l1);

	return 'hsl(' + hue + ', 70%, ' + Math.floor(lightness) + '%)';
};

export var parseContacts = function(raw) {
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
