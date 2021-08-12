/* global browser */

browser.xi.onOpenTab.addListener(ids => {
	browser.xi.createTab('/content/main.html?ids=' + encodeURIComponent(ids));
});
