var getParams = function() {
	const params = {};
	for (let part of location.search.substr(1).split('&')) {
		let [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
};

var walkDOM = function(root, test, fn) {
	if (test(root)) {
		fn(root);
	} else {
		for (var i = root.childNodes.length - 1; i >= 0; --i) {
			walkDOM(root.childNodes[i], test, fn);
		}
	}
};

var html2element = function(html) {
	// thunderbird 60 will remove some elements when directly assigning to
	// innerHTML
	var parser = new DOMParser();
	var doc = parser.parseFromString(html, 'text/html');
	return doc.body.children[0];
};

var unique = function(l, keyFn) {
	var keys = [];
	return l.filter(function(item) {
		var key = keyFn(item);
		if (keys.indexOf(key) === -1) {
			keys.push(key);
			return true;
		}
	});
};

var createIcon = function(key) {
	var html;
	if (key.substring(0, 2) === 'x-') {
		html = '<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="/content/material-icons.svg#' + key.substring(2) + '"></use></svg>';
	} else {
		// File no longer exists. Is there a new one?
		html = '<svg class="icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="chrome://messenger/skin/icons/mail-toolbar.svg#' + key + '"></use></svg>';
	}
	return html2element(html);
};

var createDate = function(date) {
	var now = new Date();
	var e = document.createElement('time');
	e.className = 'date';
	if (date.toDateString() === now.toDateString()) {
		e.textContent = date.toLocaleTimeString();
	} else {
		e.textContent = date.toLocaleDateString();
	}
	e.title = date.toLocaleString();
	return e;
};

var createAlert = function(text, icon, level) {
	var e = document.createElement('div');
	e.className = 'alert alert--' + level;
	e.textContent = text;
	e.prepend(createIcon(icon));
	return e;
};

var contrastColor = function(color) {
	const [, r, g, b] = color.match(/(..)(..)(..)/).map(x => parseInt(x, 16) / 255);
	const l = 0.2126 * Math.pow(r, 2.4) + 0.7152 * Math.pow(g, 2.4) + 0.0722 * Math.pow(b, 2.4);
	return l > 0.3 ? 'black' : 'white';
};

var pseudoRandomColor = function(s) {
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

var parseContacts = function(raw) {
	var contacts = [];
	for (let i = 0; i < raw.length; i++) {
		contacts.push({
			name: null,
			email: raw[i],
		});
	}
	return contacts;
};

var getTags = function(msg) {
	// var keywords = msg.getStringProperty('keywords');
	// var keywordList = keywords.split(' ');
	// var allTags = MailServices.tags.getAllTags({});
	// return allTags
	// 	.filter(tag => keywordList.indexOf(tag.key) !== -1)
	// 	.map(tag => {
	// 		var color = MailServices.tags.getColorForKey(tag.key).substr(1) || 'fff';
	// 		return {
	// 			bgColor: '#' + color,
	// 			fgColor: contrastColor(color),
	// 			name: tag.tag,
	// 		};
	// 	});
	return [];
};

module.exports = {
	strings: {get: s => s},
	getParams: getParams,
	walkDOM: walkDOM,
	html2element: html2element,
	unique: unique,
	createIcon: createIcon,
	createDate: createDate,
	createAlert: createAlert,
	contrastColor: contrastColor,
	pseudoRandomColor: pseudoRandomColor,
	parseContacts: parseContacts,
	getTags: getTags,
};
