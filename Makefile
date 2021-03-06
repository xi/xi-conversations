all: content/style.css content/main.js content/material-icons.svg

content/style.css: src/scss/style.scss src/scss/*.scss src/scss/components/*.scss
	sassc $< $@

content/main.js: src/js/main.js src/js/*.js node_modules
	browserify $< -o $@

content/material-icons.svg: scripts/get-material-icons.sh
	$< > $@

node_modules:
	npm install mustache
