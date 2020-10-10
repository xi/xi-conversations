/* global Components, ChromeUtils */

var aomStartup = Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);
var Messenger = Components.classes['@mozilla.org/messenger;1'].createInstance(Components.interfaces.nsIMessenger);

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Gloda} = ChromeUtils.import('resource:///modules/gloda/GlodaPublic.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
var {MsgHdrToMimeMessage} = ChromeUtils.import('resource:///modules/gloda/MimeMessage.jsm');

var uri2msg = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	return messageService.messageURIToMsgHdr(uri);
};

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
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

var getConversation = function(msgs, cb) {
	var conversationListener = {
		onItemsAdded: function() {},
		onItemsModified: function() {},
		onItemsRemoved: function() {},
		onQueryCompleted: function(collection) {
			cb(collection.items);
		},
	};

	var listener = {
		onItemsAdded: function() {},
		onItemsModified: function() {},
		onItemsRemoved: function() {},
		onQueryCompleted: function(collection) {
			if (collection.items.length) {
				var conversation = collection.items[0].conversation;
				conversation.getMessagesCollection(conversationListener, true);
			} else {
				cb(msgs.map(function(msg) {
					return {
						folderMessage: msg,
						attachmentInfos: [],
						mailingLists: null,
						_indexedBodyText: null,
					};
				}));
			}
		},
	};

	Gloda.getMessageCollectionForHeaders(msgs, listener, null);
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
				setup() {
					var manifestURI = Services.io.newURI('manifest.json', null, this.extension.rootURI);
					aomStartup.registerChrome(manifestURI, [['content', 'xi-conversations', 'content/']]);
				},
				getConversation(uris) {
					return new Promise(resolve => {
						getConversation(uris.map(uri2msg), results => {
							resolve(unique(results, glodaMsg => glodaMsg.headerMessageID).map(glodaMsg2msg));
						});
					});
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
					var msgHdr = context.extension.messageManager.get(id);
					var mainWindow = Services.wm.getMostRecentWindow('mail:3pane');
					mainWindow.openTab('message', {msgHdr: msgHdr, background: false});
				},
				async openAttachment(id, url) {
					var msgHdr = context.extension.messageManager.get(id);
					var win = Services.wm.getMostRecentWindow('mail:3pane');
					var attInfo = new win.AttachmentInfo(null, url, null, msg2uri(msgHdr));
					attInfo.open();
				},
				async beginEdit(id) {
					var msgHdr = context.extension.messageManager.get(id);
					var mainWindow = Services.wm.getMostRecentWindow('mail:3pane');
					mainWindow.ComposeMessage(
						Components.interfaces.nsIMsgCompType.EditAsNew,
						Components.interfaces.nsIMsgCompFormat.Default,
						msgHdr.folder,
						[msg2uri(msgHdr)],
					);
				},
				onOpenTab: new ExtensionCommon.EventManager({
					context,
					name: 'xi.onOpenTab',
					register(fire) {
						var observer = (win, topic) => {
							if (topic === 'domwindowopened' && win.location.href === 'chrome://messenger/content/messenger.xhtml') {
								win.MsgOpenSelectedMessages = () => {
									var msgs = win.gFolderDisplay.selectedMessages;
									fire.async(msgs.map(msg2uri));
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
