var compose = function(compType) {
	return function(msg) {
		var mainWindow = window.frameElement.ownerDocument.defaultView;
		mainWindow.ComposeMessage(compType, Components.interfaces.nsIMsgCompFormat.Default, msg, [msg2uri(msg)]);
	};
};

var replyToSender = compose(Components.interfaces.nsIMsgCompType.ReplyToSender);
var replyAll = compose(Components.interfaces.nsIMsgCompType.ReplyAll);
var replyToList = compose(Components.interfaces.nsIMsgCompType.ReplyToList);
var editAsNew = compose(Components.interfaces.nsIMsgCompType.Template);
var editDraft = compose(Components.interfaces.nsIMsgCompType.Draft);
var forward = compose(Components.interfaces.nsIMsgCompType.ForwardInline);
