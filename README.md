# hcj.js #

It could be worse.

## Install ##

`git clone https://github.com/hcj-js/hcj.git`

## Docs ##

Latest docs are located at http://hcj-js.github.io/hcj/index.html

v0.2 docs: http://hcj-js.github.io/hcj/docs-0.2/index.html

## Building from Source ##

To build HCJ from the sources in the `src` directory, run `make`.  You
will need the following software installed (in addition to `make`, of
course):

* uglifyjs

To rebuild the docs' SEO content, run `make docs`.  For this you will
additionally need:

* node
* npm
* phantomjs

## Versioning ##

HCJ follows [semantic versioning](https://semver.org/).

Before the 1.0.0 release we follow semantic versioning shifted down by
one decimal place: breaking changes may occur between 0.2 and 0.3,
feature additions and deprecations between 0.2 and 0.2.1, and patches
between 0.2.1 and 0.2.1.1.
