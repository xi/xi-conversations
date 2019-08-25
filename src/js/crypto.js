var util = require('./util.js');

var parseStatusFlags = function(statusFlags) {
	var nsIEnigmail = Components.interfaces.nsIEnigmail;

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
		encrypted: !!(statusFlags & nsIEnigmail.PGP_MIME_ENCRYPTED)
	};
};

var patchSecurityInfo = function() {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var si = mainWindow.messageHeaderSink.securityInfo;
	var proto = Object.getPrototypeOf(si);
	var original = proto.updateSecurityStatus;

	proto.updateSecurityStatus = function(lastMsgUri, exitCode, statusFlags, keyId, userId, sigDetails, errorMsg, blockSeparation, msgUrl, encToDetails) {
		mainWindow.xiEnigmail.trigger(msgUrl.specIgnoringRef, {
			lastMsgUri: lastMsgUri,
			exitCode: exitCode,
			statusFlags: statusFlags,
			keyId: keyId,
			userId: userId,
			sigDetails: sigDetails,
			errorMsg: errorMsg,
			blockSeparation: blockSeparation,
			msgUrl: msgUrl,
			encToDetails: encToDetails
		});

		original.apply(this, arguments);
	};
};

var monkeyPatchCrypto = function() {
	var mainWindow = window.frameElement.ownerDocument.defaultView;

	if (!mainWindow.xiEnigmail) {
		mainWindow.xiEnigmail = new util.EventService();
		patchSecurityInfo();

		var original = mainWindow.messageHeaderSink.enigmailPrepSecurityInfo;
		mainWindow.messageHeaderSink.enigmailPrepSecurityInfo = function() {
			original.apply(this, arguments);
			patchSecurityInfo();
		}
	}
};

module.exports = {
	parseStatusFlags: parseStatusFlags
};

monkeyPatchCrypto();
