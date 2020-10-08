/* global Components, ChromeUtils */

var aomStartup = Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);

var {ExtensionCommon} = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');
var {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');

var xi = class extends ExtensionCommon.ExtensionAPI {
	setup() {
		var manifestURI = Services.io.newURI('manifest.json', null, this.extension.rootURI);
		aomStartup.registerChrome(manifestURI, [['content', 'xi-conversations', 'content/']]);
	}

	getAPI(context) {
		return {
			xi: {
				setup: () => this.setup(),
			},
		};
	}
};
