all: content/main.js content/material-icons.svg

content/main.js: src/js/main.js src/js/*.js node_modules
	npx browserify $< -o $@

content/material-icons.svg: scripts/get-material-icons.sh
	$< > $@

node_modules:
	npm install mustache
