all: content/style.css content/main.js

content/style.css: src/scss/style.scss src/scss/*.scss src/scss/components/*.scss
	node-sass $< $@

content/main.js: src/js/main.js src/js/*.js
	browserify $< -o $@
