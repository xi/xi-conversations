/* global browser */

browser.tabs.onCreated.addListener(tab => {
	if (tab.mailTab) {
		browser.xi.patchTab(tab.id);
	}
});

browser.tabs.query({mailTab: true}).then(tabs => {
	tabs.forEach(tab => {
		browser.xi.patchTab(tab.id);
	});
});
