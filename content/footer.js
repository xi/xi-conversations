var createMessageFooter = function(glodaMsg) {
	var mainWindow = window.frameElement.ownerDocument.defaultView;
	var msg = glodaMsg.folderMessage;

	var footer = document.createElement('footer');
	footer.className = 'message__footer';

	var attachments = document.createElement('ul');
	attachments.className = 'attachments';
	for (let att of glodaMsg.attachmentInfos) {
		let li = document.createElement('li');
		attachments.appendChild(li);

		let a = document.createElement('a');
		a.className = 'attachment';
		a.textContent = att.name;
		a.href = att.url;
		prependChild(a, createIcon('x-attachment'));
		li.appendChild(a);
	}
	footer.appendChild(attachments);

	return footer;
}
