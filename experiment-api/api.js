/* global Components, ChromeUtils */

var aomStartup = Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Gloda} = ChromeUtils.import('resource:///modules/gloda/GlodaPublic.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
var {MsgHdrToMimeMessage} = ChromeUtils.import('resource:///modules/gloda/MimeMessage.jsm');

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
};

var getParams = function(search) {
	const params = {};
	for (let part of search.split('&')) {
		let [key, raw] = part.split('=');
		params[key] = decodeURIComponent(raw);
	}
	return params;
};

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
	return new Promise(resolve => {
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
				var conversation = collection.items[0].conversation;
				conversation.getMessagesCollection(conversationListener, true);
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

				// backport from thunderbird 85
				headerMessageId: glodaMsg.headerMessageID,
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
				viewClassic(id) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1603489
					var msgHdr = context.extension.messageManager.get(id);
					var mainWindow = Services.wm.getMostRecentWindow('mail:3pane');
					mainWindow.openTab('message', {msgHdr: msgHdr, background: false});
				},
				async openAttachment(id, url) {
					// https://bugzilla.mozilla.org/show_bug.cgi?id=1696777
					var msgHdr = context.extension.messageManager.get(id);
					var win = Services.wm.getMostRecentWindow('mail:3pane');
					var params = getParams(url.split('?')[1] || '');
					var attInfo = new win.AttachmentInfo(null, url, params.filename, msg2uri(msgHdr));
					attInfo.open();
				},
				async saveAttachment(id, url) {
					var msgHdr = context.extension.messageManager.get(id);
					var win = Services.wm.getMostRecentWindow('mail:3pane');
					var params = getParams(url.split('?')[1] || '');
					var attInfo = new win.AttachmentInfo(null, url, params.filename, msg2uri(msgHdr));
					attInfo.save();
				},
				createTab(url) {
					let win = Services.wm.getMostRecentWindow("mail:3pane");
					let nativeTabInfo = win.openTab("contentTab", {
						url: context.uri.resolve(url),
						linkHandler: "single-page",
						principal: context.extension.principal,
					});
				},
				onOpenTab: new ExtensionCommon.EventManager({
					context,
					name: 'xi.onOpenTab',
					register(fire) {
						var observer = (win, topic) => {
							if (topic === 'domwindowopened' && win.location.href === 'chrome://messenger/content/messenger.xhtml') {
								win.MsgOpenSelectedMessages = () => {
									var msgs = win.gFolderDisplay.selectedMessages;
									fire.async(msgs.map(msgHdr => msgHdr.messageId));
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
				}).api(),
			},
		};
	}
};
