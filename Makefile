all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	uglifyjs ./src/*.js -mo ./dist/hcj.js
