/* global browser */

browser.xi.onOpenTab.addListener(uris => {
	browser.tabs.create({url: '/content/main.html?uris=' + encodeURIComponent(uris)});
});
