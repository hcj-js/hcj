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


# docs prerender
docs:
	cd docs-prerender && sh ./prerender.sh
	sed '/.*PRERENDER.*/ r docs-prerender/output' docs/docs.html | sed '/.*PRERENDER.*/d' > docs/index.html
