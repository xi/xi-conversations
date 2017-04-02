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
		mainWindow.xiEnigmail = new EventService();
		patchSecurityInfo();

		var original = mainWindow.messageHeaderSink.enigmailPrepSecurityInfo;
		mainWindow.messageHeaderSink.enigmailPrepSecurityInfo = function() {
			original.apply(this, arguments);
			patchSecurityInfo();
		}
	}
};

monkeyPatchCrypto();
