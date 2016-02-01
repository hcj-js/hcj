all: css js

css:
# todo: minify
	cp ./src/*.css ./dist

js:
	mkdir -p tmp
	cd ./src; find -name '*.js' | sed 's/\.\/\(.*\)\.js/\1/' | xargs -I file sed "s/define(/define('file', /" ./file.js > ../tmp/hcj.js
	uglifyjs ./tmp/hcj.js -mo ./dist/hcj.js
