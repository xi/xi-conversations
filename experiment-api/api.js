/* global Components, ChromeUtils */

var aomStartup = Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');

var msg2uri = function(msg) {
	return msg.folder.getUriForMsg(msg);
};

var xi = class extends ExtensionCommon.ExtensionAPI {
	setup() {
		var manifestURI = Services.io.newURI('manifest.json', null, this.extension.rootURI);
		aomStartup.registerChrome(manifestURI, [['content', 'xi-conversations', 'content/']]);
	}

	getAPI(context) {
		return {
			xi: {
				setup: () => this.setup(),
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
