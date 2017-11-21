# hcj.js #

It Could Be Worse

## Install ##

`git clone https://github.com/hcj-js/hcj.git`

## Contributing ##

To build HCJ from the sources in the `src` directory, run `make`.  You
will need the following software installed (in addition to `make`, of
course):

* uglifyjs

To rebuild the docs' SEO content, run `make docs`.  For this you will
additionally need:

* node
* npm
* phantomjs

## Docs ##

Docs are located at http://hcj-js.github.io/hcj/index.html

The docs are an HCJ example application.  Their source is in the
`docs` directory.  The `docs.html` template file is the root HTML file
that you edit; `index.html` is generated from it by running `make
docs`.

Running `make docs` uses Phantom JS, a headless webkit web browser, to
render each page of the HCJ docs, concatenate the page contents, and
splice it in to `index.html` for SEO purposes.  This extra build step
for SEO is always necessary for HCJ applications, as HCJ a pure
javascript website framework.
