/* global ChromeUtils */

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Gloda} = ChromeUtils.import('resource:///modules/gloda/GlodaPublic.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
var {MsgHdrToMimeMessage} = ChromeUtils.import('resource:///modules/gloda/MimeMessage.jsm');

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

		var query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
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
				attachmentInfos: glodaMsg.attachmentInfos.map(a => ({name: a.name, url: a.url})),
			});
		};

		return {
			xi: {
				getConversation(ids) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1665676
					return getConversation(ids).then(results => results.map(glodaMsg2msg));
				},
				getFull(id) {
					// the original getFull() is restricted to these fields:
					// body, contentType, headers, name partName, size
					var msgHdr = context.extension.messageManager.get(id);
					return new Promise(resolve => {
						MsgHdrToMimeMessage(msgHdr, null, (aMsgHdr, aMimeMsg) => {
							resolve(aMimeMsg);
						}, false, {examineEncryptedParts: true});
					});
				},
				viewSource(id) {
					var win = Services.wm.getMostRecentWindow('mail:3pane');
					var msgHdr = context.extension.messageManager.get(id);
					var uri = msgHdr.folder.getUriForMsg(msgHdr);
					win.ViewPageSource([uri]);
				},
				// cannot be replaced by messageDisplay.OnMessagesDisplayed because
				// we need to replace the original handler
				patchOpenSelectedMessages() {
					var observer = (win, topic) => {
						if (topic === 'domwindowopened' && win.location.href === 'chrome://messenger/content/messenger.xhtml') {
							win.MsgOpenSelectedMessages = () => {
								var msgs = win.gFolderDisplay.selectedMessages;
								var ids = msgs.map(msgHdr => msgHdr.messageId);
								var url = '/content/main.html?ids=' + encodeURIComponent(ids);
								var tab = win.openTab('contentTab', {
									url: context.uri.resolve(url),
									linkHandler: 'single-page',
									principal: context.extension.principal,
								});
								tab.toolbar.hidden = true;
							};
						}
						win.addEventListener('load', () => observer(win, topic));
					};

					Services.ww.registerNotification(observer);

					var e = Services.ww.getWindowEnumerator();
					while (e.hasMoreElements()) {
						observer(e.getNext(), 'domwindowopened');
					}
				},
			},
		};
	}
};
