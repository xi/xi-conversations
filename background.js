/* global browser */

browser.xi.onOpenTab.addListener(uris => {
	browser.xi.createTab('/content/main.html?uris=' + encodeURIComponent(uris));
});
