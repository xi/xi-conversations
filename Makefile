all: content/js/mustache.mjs content/material-icons.svg

content/js/mustache.mjs:
	npm install mustache
	cp node_modules/mustache/mustache.mjs $@

content/material-icons.svg: scripts/get-material-icons.sh
	$< > $@
