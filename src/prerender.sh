#!/bin/bash

usage="Usage:
    prerender.sh [options] file1.html file2.html ...

    Pre-renders the specified files.  Files must be present locally
    for HTML content to be injected, and also on a web server for
    javascript content to be executed.  (see Options)

    Places files with pre-rendered content into file1.html.prerender,
    file2.html.prerender, ...

Options:

    Either -s or -u is required.

    -s
	 Static-serve the specified directory.  Always uses HTTP (no HTTPS).
    -p <port>
	Set the port of the static file server. (default ${default_port})
    -n <hostname>
	Hostname to use to access static file server. (default ${default_hostname})

    -u <url>
	 URL to browse for files.

    -d
	Root directory (defaults to .).

    -i
	Overwrite input files, instead of creating .prerender files.

    -h
	Display this message.
"

# default server hostname and port, when static-serving files
default_server_hostname=127.0.0.1
default_server_port=7000

while getopts "sp:n:u:d:ih" o; do
    case "$o" in
	s)
	    static_serve=true
	    : ${server_hostname:="$default_server_hostname"}
	    : ${server_port:="$default_server_port"}
	    ;;
	p)
	    server_port="$OPTARG"
	    ;;
	n)
	    server_hostname="$OPTARG"
	    ;;
	u)
	    host_url="$OPTARG"
	    ;;
	d)
	    file_directory="$OPTARG"
	    ;;
	i)
	    in_place=true
	    ;;
	h)
	    echo "$usage"
	    exit 0
	    ;;
    esac
done

shift $((OPTIND - 1))

if [ $# -eq 0 ]; then
    # Files are required.
    echo "$usage"
    exit 1
fi


if [ "$static_serve" != true ] && [ "$host_url" = "" ]; then
    # Either -s or -u is required.
    echo "$usage"
    exit 1
fi


# Make sure file_directory is defined
: ${file_directory:="."}


# Start a static server if we are doing that
if [ "$static_serve" = true ]; then
    # Server is located in .node_prerender so...
    if [ "${file_directory:0:1}" = "/" ]; then
	# ... the server directory is $file_directory if $file_directory is an absolute path
	server_directory="${file_directory}"
    else
	# ... the server directory is ../$file_directory if $file_directory is a relative path
	server_directory="../${file_directory}"
    fi

    # Set host_url for the local server.
    host_url="http://${server_hostname}:${server_port}/"

    # Bootstrap the NodeJS server.
    echo "Installing a node server into .node_prerender..."
    package_json="{
  \"name\": \"docs\",
  \"version\": \"1.0.0\",
  \"dependencies\": {
    \"express\": \"^4.15.0\"
  }
}"
    index_js="var express = require('express');

var app = express();
app.use(express.static('${server_directory}'));
app.listen(${server_port}, function (foo) {
  console.log('up');
});
"
    mkdir -p .node_prerender
    cd .node_prerender
    echo "${package_json}" > package.json
    npm install --loglevel=error >/dev/null
    echo "${index_js}" > index.js

    # Start the nodejs server.
    echo "Serving files located at ${file_directory} at ${host_url}"
    echo '' > ./nodelog
    node index.js > ./nodelog &
    trap "kill $!" EXIT

    # Wait for the server to be up.
    while ! grep -m1 'up' < ./nodelog >/dev/null; do
	sleep 1
    done
    cd ..
fi


# Make sure host_url ends in a /
if [ "${host_url: -1}" != "/" ]; then
    host_url="${host_url}/"
fi

build_js="// Gets content for all docs pages, concatenates them together, and
// outputs the result to stdout.
var args = require('system').args;
console.error = function () {
  require('system').stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};
var page = require('webpage').create();
var url = args[1];

// output the console message after a special string
var done = false;
page.onConsoleMessage = function (message) {
  if (done) {
    console.log(message);
    phantom.exit();
  }
  else if (message === 'PRERENDER DONE') {
    done = true;
  }
  else if (message.indexOf('Doing page') !== -1) {
    console.error(message);
  }
  else {
    console.error(message);
  }
};

page.open(url, function (status) {
  // just exit if status is not success
  if (status !== 'success') {
    console.log('status: ' + status);
    phantom.exit();
  }

  // do the thing
  page.evaluate(function () {
    hcj.stream.defer(function () {
      console.log('PRERENDER DONE');
      console.log(document.querySelector('.root-component').innerHTML);
    });
  });
});
"

echo "$build_js" > build.js

for i in "$@"; do
    echo "Rendering $i..."

    source_file="$file_directory/$i"
    if [ "$in_place" = true ]; then
	target_file="$source_file"
    else
	target_file="$file_directory/$i.prerender"
    fi

    prerender_content=$(phantomjs -platform offscreen build.js "$host_url$i")
    existing_content=$(cat "$source_file" | sed "/HCJ_PRERENDER_START/,/HCJ_PRERENDER_END/d")
    echo "$existing_content" | sed "/<body>/s/.*/&\n<!-- HCJ_PRERENDER_START -->\n<div style=\"display:none\">${prerender_content//\//\\\/}<\\/div>\n<!-- HCJ_PRERENDER_END -->/" > "$target_file"
done

