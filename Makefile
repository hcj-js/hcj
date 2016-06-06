.PHONY: docs
all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	cat ./src/hcj.js \
	    ./src/libs.js \
		> ./dist/hcj.js
	uglifyjs ./dist/hcj.js \
	         -mo ./dist/hcj.min.js

docs:
	cd docs && sphinx-build -ab html -d _build/doctrees   . _build/html
