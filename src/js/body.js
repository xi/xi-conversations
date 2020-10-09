/* global browser */

var util = require('./util.js');

var RE_LINK = /(https?:\/\/[a-zA-Z0-9./?&%=#:_-]+)/g;

var createDetails = function(label, color) {
	var details = document.createElement('details');
	var summary = document.createElement('summary');
	summary.textContent = label;
	summary.style.color = color;
	details.append(summary);
	return details;
};

var renderLinks = function(parent, text) {
	text.split(RE_LINK).forEach((s, i) => {
		if (i % 2 === 0) {
			parent.append(document.createTextNode(s));
		} else {
			var a = document.createElement('a');
			a.textContent = s;
			a.href = s;
			parent.append(a);
		}
	});
};

var renderQuotes = function(parent, lines, nested) {
	var text = '';
	var quote = [];

	var flushQuote = function() {
		if (quote.length) {
			var blockquote = document.createElement('blockquote');
			renderQuotes(blockquote, quote, true);
			if (nested) {
				parent.append(blockquote);
			} else {
				var details = createDetails(browser.i18n.getMessage('toggleQuote'), 'orange');
				details.append(blockquote);
				parent.append(details);
			}
			quote = [];
		}
	};

	for (var line of lines) {
		if (line.startsWith('>')) {
			quote.push(line.substr(1).trimStart());
		} else {
			flushQuote();
			renderLinks(parent, line + '\n');
		}
	}
	flushQuote();
};

var renderBody = function(parent, text) {
	var [body, ...sig] = text.split('\n-- \n');
	renderQuotes(parent, body.split('\n'));

	if (sig.length) {
		var div = document.createElement('div');
		div.className = 'moz-signature';
		renderLinks(div, sig.join('\n-- \n'));

		var details = createDetails(browser.i18n.getMessage('toggleSig'), 'rgb(56, 117, 215)');
		details.append(div);
		parent.append(details);
	}
};

module.exports = function(msg) {
	var wrapper = document.createElement('div');
	var pre = document.createElement('pre');
	pre.className = 'message__body';
	wrapper.append(pre);
	browser.xi.getFull(msg.id).then(util.getBody).then(([body, isEncrypted]) => {
		if (isEncrypted){
			wrapper.prepend(util.createAlert(browser.i18n.getMessage('encrypted'), 'x-lock', 'info'));
		}
		renderBody(pre, body || browser.i18n.getMessage('emptyBody'));
	});

	return wrapper;
};
