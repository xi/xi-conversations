var pre = document.querySelector('.source');
var id = parseInt(location.search.substr(4), 10);

browser.messages.getRaw(id).then(source => {
	pre.textContent = source;
});
