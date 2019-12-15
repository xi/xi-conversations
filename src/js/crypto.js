var util = require('./util.js');

const {EnigmailConstants} = ChromeUtils.import('chrome://enigmail/content/modules/constants.jsm');
const {EnigmailSingletons} = ChromeUtils.import('chrome://enigmail/content/modules/singletons.jsm');

var parseStatusFlags = function(statusFlags) {
	var nsIEnigmail = EnigmailConstants;

	var signed = '';
	if (statusFlags & nsIEnigmail.PGP_MIME_SIGNED) {
		signed = 'info';
		if ((statusFlags & nsIEnigmail.BAD_SIGNATURE) && !(statusFlags & nsIEnigmail.GOOD_SIGNATURE)) {
			signed = 'danger';
		} else if (statusFlags & (nsIEnigmail.REVOKED_KEY | nsIEnigmail.EXPIRED_KEY_SIGNATURE | nsIEnigmail.EXPIRED_SIGNATURE)) {
			signed = 'warning';
		} else if (statusFlags & nsIEnigmail.GOOD_SIGNATURE) {
			if (!(statusFlags & nsIEnigmail.TRUSTED_IDENTITY)) {
				signed = 'warning';
			} else {
				signed = 'success';
			}
		}
	}

	return {
		signed: signed,
		encrypted: !!(statusFlags & nsIEnigmail.PGP_MIME_ENCRYPTED),
	};
};

var patchSecurityInfo = function() {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var headerSink = EnigmailSingletons.messageReader;
	var original = headerSink.updateSecurityStatus;
	headerSink.updateSecurityStatus = function(msgUriSpec, exitCode, statusFlags, keyId, userId, sigDetails, errorMsg, blockSeparation, uri, jsonStr, mimePartNumber) {
		mainWindow.xiEnigmail.trigger(uri.uri, {
			statusFlags: statusFlags,
			errorMsg: errorMsg,
		});

		original.apply(this, arguments);
	};
};

var monkeyPatchCrypto = function() {
	var mainWindow = window.frameElement.ownerDocument.defaultView;

	if (!mainWindow.xiEnigmail) {
		mainWindow.xiEnigmail = new util.EventService();
		patchSecurityInfo();
	}
};

module.exports = {
	parseStatusFlags: parseStatusFlags,
};

monkeyPatchCrypto();
