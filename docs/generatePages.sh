#!/bin/bash

pages=(
	"home"
	"helloWorld"
	"introduction"
	"apiComponents"
	"apiLayouts"
	"apiStyles"
	"apiForms"
	"apiFormsExamples"
	"apiFormFor"
	"apiColors"
	"apiStreams"
	"apiExamples"
	"definingComponents"
	"definingLayouts"
	"community blah"
)

index_page="home"

if [[ $1 == "-generate" ]]; then
	for page in "${pages[@]}"
	do
		sed "s/<!-- PAGE -->/var page = \"${page}\";/" docs.html > "${page}.html"
	done
	cp "${index_page}.html" "index.html"
fi

if [[ $1 == "-prerender" ]]; then
	echo TODO
fi
