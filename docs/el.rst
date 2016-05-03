Components
==========

The `component` type 

A `component` is web page.  The basic components are text, images,
and form inputs.  These are combined and re-combined using layouts.

Technically a component is any function that takes a parent element,
appends something to it, and returns a `context`.

To `instance` a component is to apply it to a parent element, and
handle the created context.

The `context` of a component instance represents its environment.

First, the instance `must` inform its enironment of the minimum
dimensions it may be displayed at.  This is done by pushing to the
`minWidth` and `minHeight` properties of its context.

Second, the environment `must` inform the 


Contexts
--------

A context is the environment that a component lives in.  It is an
object with the following properties:

* $el
* minWidth
* minHeight
* width
* height
* top
* left
* topAccum
* leftAccum
* scroll


$el
^^^

JQuery selector of the component.
