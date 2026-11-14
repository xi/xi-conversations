/* global ChromeUtils Gloda GlodaConstants ExtensionCommon Services MailServices */

ChromeUtils.defineESModuleGetters(this, {
	Gloda: 'resource:///modules/gloda/GlodaPublic.sys.mjs',
	GlodaConstants: 'resource:///modules/gloda/GlodaConstants.sys.mjs',
	MailServices: 'resource:///modules/MailServices.sys.mjs',
});

function unique(l, keyFn) {
	const keys = [];
	return l.filter(item => {
		const key = keyFn(item);
		if (!keys.includes(key)) {
			keys.push(key);
			return true;
		}
	});
}

function waitForLoad(win) {
	return new Promise(resolve => {
		if (win.document.readyState === 'complete') {
			win.setTimeout(resolve, 100);
		} else {
			win.addEventListener('load', resolve);
		}
	});
}

function getConversation(ids) {
	return new Promise((resolve, reject) => {
		const conversationListener = {
			onItemsAdded() {},
			onItemsModified() {},
			onItemsRemoved() {},
			onQueryCompleted(collection) {
				let results = collection.items;
				results = results.filter(glodaMsg => glodaMsg.folderMessage);
				results = unique(results, glodaMsg => glodaMsg.headerMessageID);
				resolve(results);
			},
		};

		const listener = {
			onItemsAdded() {},
			onItemsModified() {},
			onItemsRemoved() {},
			onQueryCompleted(collection) {
				if (collection.items.length > 0) {
					const conversation = collection.items[0].conversation;
					conversation.getMessagesCollection(conversationListener, true);
				} else {
					reject();
				}
			},
		};

		const query = Gloda.newQuery(GlodaConstants.NOUN_MESSAGE);
		query.headerMessageID.apply(query, ids);
		query.getCollection(listener, null);
	});
}

var xi = class extends ExtensionCommon.ExtensionAPI {
	getAPI(context) {
		const glodaMsg2msg = glodaMsg => {
			const msg = context.extension.messageManager.convert(glodaMsg.folderMessage);
			return Object.assign({}, msg, {
				body: glodaMsg._indexedBodyText,
				canReplyToList: !!glodaMsg.mailingLists,
			});
		};

		return {
			xi: {
				getConversation(ids) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1665676
					return getConversation(ids).then(results => results.map(glodaMsg2msg));
				},
				viewSource(id) {
					const win = Services.wm.getMostRecentWindow('mail:3pane');
					const msgHdr = context.extension.messageManager.get(id);
					const uri = msgHdr.folder.getUriForMsg(msgHdr);
					const url = MailServices.mailSession.ConvertMsgURIToMsgURL(uri, null);
					win.openDialog(
						'chrome://messenger/content/viewSource.xhtml',
						'_blank',
						'all,dialog=no',
						{URL: url},
					);
				},
				async patchTab(id) {
					const tabObject = context.extension.tabManager.get(id);
					const win = tabObject.nativeTab.chromeBrowser.contentWindow;
					await waitForLoad(win);

					win.threadPane._onItemActivate = () => {
						const msgs = win.gDBView.getSelectedMsgHdrs();
						const ids = msgs.map(msgHdr => msgHdr.messageId);
						const url = '/content/main.html?ids=' + encodeURIComponent(ids);
						const tab = win.openTab('contentTab', {
							url: context.uri.resolve(url),
							linkHandler: 'single-page',
							principal: context.extension.principal,
						});
						tab.toolbar.hidden = true;
					};
				},
			},
		};
	}
};
