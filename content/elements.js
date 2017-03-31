var createMessageElement = function(glodaMsg, expanded) {
	var e = document.createElement('article');
	e.className = 'message';
	e.id = msg2uri(glodaMsg.folderMessage);

	if (!expanded) {
		e.classList.add('is-collapsed');
	}

	var iframeLoaded = false;
	var lazyLoadIframe = function() {
		if (!iframeLoaded && !e.classList.contains('is-collapsed')) {
			e.appendChild(createIframe(glodaMsg));
			iframeLoaded = true;
		}
	};

	var header = createMessageHeader(glodaMsg);
	header.addEventListener('click', function(event) {
		event.preventDefault();
		e.classList.toggle('is-collapsed');
		lazyLoadIframe();
	});
	e.appendChild(header);

	lazyLoadIframe();

	return e;
};
