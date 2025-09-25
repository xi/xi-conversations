/* global ChromeUtils Services ExtensionCommon */

ChromeUtils.defineESModuleGetters(this, {
	Gloda: "resource:///modules/gloda/GlodaPublic.sys.mjs",
	GlodaConstants: "resource:///modules/gloda/GlodaConstants.sys.mjs",
	MailServices: "resource:///modules/MailServices.sys.mjs",
});

var unique = function(l, keyFn) {
	var keys = [];
	return l.filter(function(item) {
		var key = keyFn(item);
		if (!keys.includes(key)) {
			keys.push(key);
			return true;
		}
	});
};

var waitForLoad = function(win) {
	return new Promise(resolve => {
		if (win.document.readyState === 'complete') {
			resolve();
		} else {
			win.addEventListener('load', resolve);
		}
	});
};

var getConversation = function(ids) {
	return new Promise((resolve, reject) => {
		var conversationListener = {
			onItemsAdded: function() {},
			onItemsModified: function() {},
			onItemsRemoved: function() {},
			onQueryCompleted: function(collection) {
				var results = collection.items;
				results = results.filter(glodaMsg => glodaMsg.folderMessage);
				results = unique(results, glodaMsg => glodaMsg.headerMessageID);
				resolve(results);
			},
		};

		var listener = {
			onItemsAdded: function() {},
			onItemsModified: function() {},
			onItemsRemoved: function() {},
			onQueryCompleted: function(collection) {
				if (collection.items.length > 0) {
					var conversation = collection.items[0].conversation;
					conversation.getMessagesCollection(conversationListener, true);
				} else {
					reject();
				}
			},
		};

		var query = Gloda.newQuery(GlodaConstants.NOUN_MESSAGE);
		query.headerMessageID.apply(query, ids);
		query.getCollection(listener, null);
	});
};

var xi = class extends ExtensionCommon.ExtensionAPI {
	getAPI(context) {
		var glodaMsg2msg = function(glodaMsg) {
			var msg = context.extension.messageManager.convert(glodaMsg.folderMessage);
			return Object.assign({}, msg, {
				body: glodaMsg._indexedBodyText,
				canReplyToList: !!glodaMsg.mailingLists,
				attachmentInfos: (glodaMsg.attachmentInfos || []).map(a => ({name: a.name, url: a.url})),
			});
		};

		return {
			xi: {
				getConversation(ids) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1665676
					return getConversation(ids).then(results => results.map(glodaMsg2msg));
				},
				viewSource(id) {
					var win = Services.wm.getMostRecentWindow('mail:3pane');
					var msgHdr = context.extension.messageManager.get(id);
					var uri = msgHdr.folder.getUriForMsg(msgHdr);
					var url = MailServices.mailSession.ConvertMsgURIToMsgURL(uri, null);
					win.openDialog(
						'chrome://messenger/content/viewSource.xhtml',
						'_blank',
						'all,dialog=no',
						{URL: url},
					);
				},
				patchTab(id) {
					var tabObject = context.extension.tabManager.get(id);
					var win = tabObject.nativeTab.chromeBrowser.contentWindow;
					return waitForLoad(win).then(() => {
						win.threadPane._onItemActivate = () => {
							var msgs = win.gDBView.getSelectedMsgHdrs();
							var ids = msgs.map(msgHdr => msgHdr.messageId);
							var url = '/content/main.html?ids=' + encodeURIComponent(ids);
							var tab = win.openTab('contentTab', {
								url: context.uri.resolve(url),
								linkHandler: 'single-page',
								principal: context.extension.principal,
							});
							tab.toolbar.hidden = true;
						};
					});
				},
			},
		};
	}
};
