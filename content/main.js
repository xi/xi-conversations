Components.utils.import('resource://gre/modules/Services.jsm');
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

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
};

var createMessageElement = function(msg) {
	var iframe = document.createElement('iframe');
	iframe.src = uri2url(msg2uri(msg));
	iframe.className = 'message__body';
	iframe.addEventListener('DOMContentLoaded', function() {
		iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
	});
	return iframe;
};

var initialUrls = (getParams().urls || '').split(',');

var container = document.querySelector('.conversation__main');
for (let uri of initialUrls) {
	container.appendChild(createMessageElement(msg));
}
