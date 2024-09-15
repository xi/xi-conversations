/* global browser */

browser.tabs.onCreated.addListener(tab => {
	if (tab.type === 'mail') {
		browser.xi.patchTab(tab.id);
	}
});

browser.tabs.query({type: 'mail'}).then(tabs => {
	tabs.forEach(tab => {
		browser.xi.patchTab(tab.id);
	});
});
