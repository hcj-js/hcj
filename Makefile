.PHONY: docs
all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	cat ./src/waitForWebfonts.js ./src/hcj.js > ./dist/hcj.js
	uglifyjs ./dist/hcj.js -mo ./dist/hcj.min.js
	cp ./dist/hcj.js ./docs/hcj.min.js
	cp ./dist/hcj.css ./docs/hcj.css
