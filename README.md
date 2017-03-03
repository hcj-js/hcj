# hcj.js #

Javascript library for web app frontend templating.

Pre-release.

## Install ##

`git clone https://github.com/jeffersoncarpenter/hcj.git`

## Docs ##

Docs are located at http://hcj-js.github.io/hcj/index.html

The docs also happen to be a simple HCJ example application.  Their
source is in the `docs` directory.  In that directory, `docs.html` is
the root HTML file; the `index.html` file is generated from it by
running `make docs`.

Running `make docs` uses Phantom JS, a headless webkit web browser, to
render each page of the HCJ docs, concatenate the page contents, and
splice it in to `index.html` for SEO purposes.  This extra build step
for SEO is always necessary for HCJ applications, as HCJ a pure
javascript website framework.
