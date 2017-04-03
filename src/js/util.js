var Messenger = Components.classes['@mozilla.org/messenger;1'].createInstance(Components.interfaces.nsIMessenger);

Components.utils.import('resource:///modules/mailServices.js');

var getParams = function() {
	let params = {};
	for (let part of location.search.substr(1).split('&')) {
		var [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
};

var uri2url = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	var _output = {};
	messageService.GetUrlForUri(uri, _output, null);
	return _output.value.spec;
};

var uri2msg = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	return messageService.messageURIToMsgHdr(uri);
};

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
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

var createIcon = function(key) {
	var wrapper = document.createElement('div');
	if (key.substring(0, 2) === 'x-') {
		wrapper.innerHTML = '<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="chrome://xi-conversations/content/material-icons.svg#' + key.substring(2) + '"></use></svg>';
	} else {
		wrapper.innerHTML = '<svg class="icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="chrome://messenger/skin/icons/mail-toolbar.svg#' + key + '"></use></svg>';
	}
	return wrapper.children[0];
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

var prependChild = function(parent, child) {
	if (parent.childNodes.length === 0) {
		parent.appendChild(child);
	} else {
		parent.insertBefore(child, parent.childNodes[0]);
	}
};

var contrastColor = function(color) {
	var [, r, g, b] = color.match(/(..)(..)(..)/).map(x => parseInt(x, 16) / 255);
	let l = 0.2126 * Math.pow(r, 2.4) + 0.7152 * Math.pow(g, 2.4) + 0.0722 * Math.pow(b, 2.4);
	return l > 0.3 ? 'black' : 'white';
};

var parseContacts = function(raw) {
	var emails = {};
	var names = {};
	var fullNames = {};
	var n = MailServices.headerParser.parseHeadersWithArray(raw, emails, names, fullNames);

	var contacts = [];
	for (let i = 0; i < n; i++) {
		var email = emails.value[i];
		var name = names.value[i] || email;
		var fullName = fullNames.value[i] || name;

		contacts.push({
			fullName: fullName,
			name: name,
			email: email,
		});
	}

	return contacts;
};

var getTags = function(msg) {
	var keywords = msg.getStringProperty('keywords');
	var keywordList = keywords.split(' ');
	var allTags = MailServices.tags.getAllTags({});
	return allTags
		.filter(tag => keywordList.indexOf(tag.key) !== -1)
		.map(tag => {
			var color = MailServices.tags.getColorForKey(tag.key).substr(1) || 'fff';
			return {
				bgColor: '#' + color,
				fgColor: util.contrastColor(color),
				name: tag.tag,
			};
		});
};

function EventService() {
	this._id = 0;
	this._listeners = {};
};

EventService.prototype.on = function(key, fn, win) {
	var id = this._id++;
	this._listeners[key] = this._listeners[key] || {};
	this._listeners[key][id] = [fn, win];
	this._cleanup();

	var self = this;
	return function() {
		delete self._listeners[key][id];
	};
};

EventService.prototype.trigger = function(key, data) {
	this._cleanup();
	for (let id in this._listeners[key]) {
		if (this._listeners[key].hasOwnProperty(id)) {
			let fn = this._listeners[key][id][0];
			fn(data);
		}
	}
};

EventService.prototype._cleanup = function() {
	for (let key of Object.keys(this._listeners)) {
		let a = this._listeners[key];

		for (let id of Object.keys(a)) {
			if (a[id][1].closed) {
				delete a[id];
			}
		}
		if (Object.keys(a).length === 0) {
			delete this._listeners[key];
		}
	}
};

module.exports = {
	getParams: getParams,
	uri2url: uri2url,
	uri2msg: uri2msg,
	msg2uri: msg2uri,
	walkDOM: walkDOM,
	createIcon: createIcon,
	createDate: createDate,
	prependChild: prependChild,
	contrastColor: contrastColor,
	parseContacts: parseContacts,
	getTags: getTags,
	EventService: EventService
};
