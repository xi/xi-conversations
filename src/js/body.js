/* global browser */

var util = require('./util.js');

module.exports = function(msg) {
	var pre = document.createElement('pre');
	pre.className = 'message__body';
	browser.xi.getFull(msg.id).then(util.getBody).then(body => {
		pre.textContent = body || browser.i18n.getMessage('emptyBody');
	});
	return pre;
};
