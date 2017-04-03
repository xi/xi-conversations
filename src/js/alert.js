var util = require('./util.js');

module.exports = function(text, icon, level) {
	var e = document.createElement('div');
	e.className = 'alert alert--' + level;
	e.textContent = text;
	util.prependChild(e, util.createIcon(icon));
	return e;
};
