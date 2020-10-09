/* global browser */

var util = require('./util.js');

module.exports = function(msg) {
	var wrapper = document.createElement('div');
	var pre = document.createElement('pre');
	pre.className = 'message__body';
	wrapper.append(pre);
	browser.xi.getFull(msg.id).then(util.getBody).then(([body, isEncrypted]) => {
		if (isEncrypted){
			wrapper.prepend(util.createAlert(browser.i18n.getMessage('encrypted'), 'x-lock', 'info'));
		}
		pre.textContent = body || browser.i18n.getMessage('emptyBody');
	});

	return wrapper;
};
