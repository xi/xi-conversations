var createMessageFooter = function(glodaMsg) {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var msg = glodaMsg.folderMessage;

	var footer = document.createElement('footer');
	footer.className = 'message__footer';

	var attachments = document.createElement('ul');
	attachments.className = 'attachments';
	for (let att of glodaMsg.attachmentInfos) {
		let attInfo = new mainWindow.AttachmentInfo(att.contentType, att.url, att.name, msg2uri(msg), att.isExternal, 42);
		let li = document.createElement('li');
		li.className = 'attachment';
		li.textContent = att.name;
		li.appendChild(createActionButton(attInfo, 'open', 'x-open_in_new', function(attInfo) {
			attInfo.open();
		}));
		li.appendChild(createActionButton(attInfo, 'save', 'file', function(attInfo) {
			attInfo.save();
		}));
		attachments.appendChild(li);
	}
	footer.appendChild(attachments);

	return footer;
}
