all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	uglifyjs ./src/hcj.js \
	         ./src/libs.js \
	         -mo ./dist/hcj.min.js
