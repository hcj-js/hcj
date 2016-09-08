.PHONY: docs
all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	cp ./src/hcj.js ./dist/hcj.js
	uglifyjs ./dist/hcj.js -mo ./dist/hcj.min.js
