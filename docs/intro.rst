Intro
=====

Hcj is a declarative library for building web applications.

Now, it runs Javascript to create and position DOM elements.  We plan
to enable it to generate Web Components code as well, as that standard
is finalized.

Streams
-------

Hcj uses FRP, like React.js and Elm do.  Data streams are the
abstraction we use to handle time.

Functions are provided for creating and manipulating data streams.

Generally, dom events and promises are converted into data streams,
mapped and reduced into streams of other values, then passed into Hcj
functions.

Components
----------

Components are what we came here for - this is the big monoid of the
Hcj library.

A component is a web page.  The basic components are text, images, and
form inputs.  These are combined and re-combined using layouts.  A
layout is any function that takes one or more components and returns a
component.
