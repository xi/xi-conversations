var autoMarkAsRead = function(e, glodaMsg) {
	var topWasInView = false;
	var bottomWasInView = false;

	var intervalId = window.setInterval(function() {
		var rect = e.getBoundingClientRect();
		var height = window.innerHeight || document.documentElement.clientHeight;

		if (!e.classList.contains('is-collapsed')) {
			if (rect.top >= 0 && rect.top < height) {
				topWasInView = true;
			}
			if (rect.bottom >= 0 && rect.bottom < height) {
				bottomWasInView = true;
			}
			if (topWasInView && bottomWasInView) {
				markAsRead(glodaMsg.folderMessage, true);
				window.clearInterval(intervalId);
			}
		}
	}, 100);
};

var createMessageElement = function(glodaMsg, expanded) {
	var e = document.createElement('article');
	e.className = 'message';
	e.id = msg2uri(glodaMsg.folderMessage);
	e.tabIndex = -1;

	if (!expanded) {
		e.classList.add('is-collapsed');
	}

	autoMarkAsRead(e, glodaMsg);

	var header = createMessageHeader(glodaMsg);
	header.addEventListener('click', function(event) {
		event.preventDefault();
		e.classList.toggle('is-collapsed');
		lazyLoadIframe();
	});
	e.appendChild(header);

	var footer = createMessageFooter(glodaMsg);
	e.appendChild(footer);

	var iframeLoaded = false;
	var lazyLoadIframe = function() {
		if (!iframeLoaded && !e.classList.contains('is-collapsed')) {
			e.insertBefore(createIframe(glodaMsg), footer);
			iframeLoaded = true;
		}
	};
	lazyLoadIframe();

	return e;
};
