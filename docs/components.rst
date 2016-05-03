Components
==========

Components are the building blocks of the Hcj library.

Basically, here's what happens.  A component tells its environment its
minimum width and minimum height.  Its environment then gives it an
actual width and actual height, and a top / left position.

Technically, a component is a function that takes a DOM element and
returns a `context`.  The context serves as the communication channel
between a component instance and its environment.

Contexts
--------

A "context" is an object with the following properties.  The first
property, ``$el``, is a JQuery selector of the instance's DOM element,
the rest are streams:

* ``$el`` root element of the instance
* ``minWidth`` the minimum width of the instance
* ``minHeight`` the minimum height function of the instance
* ``width`` the actual width of the instance
* ``height`` the actual height of the instance
* ``top`` top coordinate of the instance within its environment
* ``left`` left coordinate of the instance within its environment
* ``topAccum`` distance from top of environment to top of window
* ``leftAccum`` distance from left side of environment to left of window

A context's many streams must be pushed to.  These are the
requirements:

First, the ``minWidth`` and ``minHeight`` streams must be pushed to by
the component instance.

``minWidth`` is a stream of numbers.  It receives the minimum width at
which the component instance will look sane.

``minHeight`` is a stream of functions.  When passed a hypothetical
width, the function should return the height the component instance
needs in order to look sane at that width.

;Second, the ``width``, ``height``, ``left``, and ``top`` streams must
be pushed to from the environment.  For this, it can use the
``minWidth`` and ``minHeight`` values it receives from the instance.


Components
-------------------

Let us create a Hello World component.

The ``el`` function is used to create components.  It takes a type of
DOM element, then a build method, and returns a component.

A ``build method`` is a function that takes a context (and two other
parameters), "initializes" the component, and pushes to the context's
``minWidth`` and ``minHeight`` streams.

The two other parameters are helper methods that push to the
``minWidth`` and ``minHeight`` streams respectively.  Basically, what
they do is remove all size constraints from the element, measure it,
and call the measurement the element's min width or min height.

Although the ``el`` function is fundamentally used to create
components, the library defines ``div = el('div')``, ``input =
el('input')``, ``a = el('a')``, etc.  To define a component you just
choose the element you want, and provide a build method.

::

   var helloWorld = div(function (ctx, mw, mh) {
       ctx.$el.html('hello world');
	   mw();
	   mh();
   });

The ``helloWorld`` component is a div.  When instanced, it sticks the
text "hello world" into its element.  Then it calls ``mw()``, which
measures its width and pushes that into its minWidth stream.  Last, it
calls ``mh()``, which pushes a function into its minHeight stream.
This function sets the text to be a certain width, and returns its
height at that width - which will be one or two lines' worth.

In real code, you don't have to define text components manually like
this 'hello world' one.  There is a library function ``text`` that
takes a string, a font style, and returns a component.

Layouts
-------

A layout is a function that takes one or more components and returns a
component.

At its core, a layout must do the following:

* push a minimum width and height function to its own context, using
  the minimum widths and height functions of its children
* push width, height, top, and left values to each child context,
  given a width and height from its own context

Layouts are created using the function ``layout``.  This
function takes a layout build method and returns a layout.

A ``layout build method`` takes several arguments and returns an array
of objects corresponding to its arguments.  Its first argument is the
layout's context, and the remaining arguments are the child contexts.
The first element of its return value should have ``minWidth`` and
``minHeight`` properties.  The rest of the array should have
``width``, ``height``, ``top``, and ``left`` properties.

The entire return value of your ``layout build method`` is optional.
If you omit any objects or properties, the ``layout`` method will fill
in default behavior.

The defaults are these.  If a ``minWidth`` or a ``minHeight`` is not
specified for the layout, use those from the first child.  If
``width`` or ``height`` is not specified for a child, use those from
the layout.  If ``top`` or ``left`` is not specified for a child,
use 0.

Here is some pseudo-code for two layouts.  The first is for aligning
three components Left, Right, and Center.  The second is for squeezing
as many components as possible side by side, left to right.

::

   var alignLRM = layout(function (ctx, left, right, middle) {
       return [{
           minWidth: // sum of min widths of left, right, and middle
           minHeight: // maximum of min heights of left, right, and middle
       }, {
           width: // minimum width of left component
       }, {
           width: // minimum width of right component
           left: // layout width - minimum width of right component
       }, {
           width: // minimum width of middle component
           left: // (layout width - minimum width of middle component) / 2
       }];
   });


   var sideBySide = layout(function (ctx, children) {
       return [{
           minWidth: // sum of min widths of children
           minHeight: // maximum of min heights of children
       }, children.map(function (child) {
           return {
               width: // minimum width of child
               left: // sum of minimum widths of previous children
           };
       })];
   });

Now, these are called like this:

::

   var foo = alignLRM(left, right, middle);
   var bar = sideBySide([
       c1,
       c2,
   ]);

The ``alignLRM`` layout is passed three components in a certain order.
The ``sideBySide`` layout is passed an array of components.  Arrays of
components (and arrays of arrays, etc.) are recognized, and passed to
your layout build method as arrays of instances.  You must place a
corresponding array in the return value.

The Root Component
------------------

Generally you choose one component to be the "root component" of the
page.  You want it to be appended to the ``body`` element, and just
act like a web page.

The ``rootComponent`` function does this.  It takes a component, and
applies it to the ``body`` element.  It ignores the min width from the
context, setting its width to be the window width.  It sets the height
of the context to be its minimum height at the window width.

Using this and the hello world component,
``rootComponent(helloWorld)`` gives you a working web page.
