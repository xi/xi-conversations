var adjustHeight = function(iframe) {
	iframe.parentElement.style.height = iframe.parentElement.getBoundingClientRect().height + 'px';
	iframe.style.height = 'auto';
	iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
	iframe.parentElement.style.height = null;
};

var hideBlocks = function(iframe, test, hideText, showText, color) {
	var doc = iframe.contentDocument;

	walkDOM(doc, test, function(node) {
		var hidden = true;

		var update = function() {
			if (hidden) {
				node.style.display = 'none';
				toggle.textContent = showText;
			} else {
				node.style.display = null;
				toggle.textContent = hideText;
			}
			adjustHeight(iframe);
		};

		var toggle = doc.createElement('button');
		toggle.addEventListener('click', function(event) {
			hidden = !hidden;
			update();
		}, true);

		toggle.style.border = 0;
		toggle.style.padding = 0;
		toggle.style.background = 'none';
		toggle.style.fontSize = '80%';
		toggle.style.color = color;

		node.parentNode.insertBefore(toggle, node);

		update();
	});
};

var createIframe = function(glodaMsg) {
	var uri = msg2uri(glodaMsg.folderMessage);

	var iframe = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'iframe');
	iframe.setAttribute('type', 'content');
	iframe.className = 'message__body';

	var onLoad = function(event, charset) {
		iframe.removeEventListener('load', onLoad, true);

		var mainWindow = window.frameElement.ownerDocument.defaultView;

		var unregister = mainWindow.xiEnigmail.on(uri2url(uri), function(result) {
			var parsed = parseStatusFlags(result.statusFlags);
			var msg = result.errorMsg.split('\n')[0];

			if (msg) {
				iframe.parentNode.insertBefore(createAlert(msg, 'x-lock', parsed.signed), iframe);
			} else if (parsed.encrypted) {
				iframe.parentNode.insertBefore(createAlert('encrypted message', 'x-lock', 'info'), iframe);
			}

			unregister();
		}, window);

		iframe.addEventListener('DOMContentLoaded', function() {
			adjustHeight(iframe);

			hideBlocks(iframe, function(node) {
				if (node.tagName && node.tagName.toLowerCase() === 'blockquote') {
					return node.textContent.length > 200;
				}
			}, '-- hide quote --', '-- show quote --', 'orange');

			hideBlocks(iframe, function(node) {
				return node.classList && node.classList.contains('moz-txt-sig');
			}, '-- hide signature --', '-- show signature --', 'rgb(56, 117, 215)');
		});

		var messageService = Messenger.messageServiceFromURI(uri2url(uri));
		var mainWindow = window.frameElement.ownerDocument.defaultView;
		iframe.docShell.contentViewer.forceCharacterSet = 'UTF-8';
		messageService.DisplayMessage(uri, iframe.docShell, mainWindow.msgWindow, {}, charset, {});
	};

	iframe.addEventListener('load', onLoad, true);
	return iframe;
};
