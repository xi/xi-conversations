/* global Components, ChromeUtils */

var aomStartup = Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);
var Messenger = Components.classes['@mozilla.org/messenger;1'].createInstance(Components.interfaces.nsIMessenger);

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Gloda} = ChromeUtils.import('resource:///modules/gloda/GlodaPublic.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');

var uri2msg = function(uri) {
	var messageService = Messenger.messageServiceFromURI(uri);
	return messageService.messageURIToMsgHdr(uri);
};

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
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
	setup() {
		var manifestURI = Services.io.newURI('manifest.json', null, this.extension.rootURI);
		aomStartup.registerChrome(manifestURI, [['content', 'xi-conversations', 'content/']]);
	}

	getAPI(context) {
		var msgHdr2id = (msg) => context.extension.messageManager.convert(msg).id;

		return {
			xi: {
				setup: () => this.setup(),
				getConversation(uris) {
					return new Promise(resolve => {
						getConversation(uris.map(uri2msg), results => {
							resolve(results.map(glodaMsg => msgHdr2id(glodaMsg.folderMessage)));
						});
					});
				},
				viewClassic(id) {
					var msgHdr = context.extension.messageManager.get(id);
					var mainWindow = Services.wm.getMostRecentWindow('mail:3pane');
					mainWindow.openTab('message', {msgHdr: msgHdr, background: false});
				},
				onOpenTab: new ExtensionCommon.EventManager({
					context,
					name: 'xi.onOpenTab',
					register(fire) {
						var observer = (win, topic) => {
							if (topic === 'domwindowopened' && win.location.href === 'chrome://messenger/content/messenger.xhtml') {
								win.ThreadPaneDoubleClick = () => {
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
