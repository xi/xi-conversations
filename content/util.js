var Messenger = Components.classes['@mozilla.org/messenger;1'].createInstance(Components.interfaces.nsIMessenger);

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
