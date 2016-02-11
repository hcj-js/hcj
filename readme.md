# hcj.js #

Javascript library for web app frontend templating

## Getting Started ##

The `example/example.js` file shows what typical HCJ code looks like.  Open `example.html` in a browser and see what happens.

Read the last part of this readme to see what kinds of components and layouts there are.

Edit `example.js` or compose your own components - and bootstrap them onto your pages with `rootComponent`.  It's really that simple.

## What's it like ##

1. Define Components.
2. Layer Components.
3. Profit!

Components are the building blocks of this library.  Layouts glue components together to form new components.  A single piece of text can be a component; so can an entire web page.

This leads to modular code that's very easy to edit, test, and rearrange.  Components you've defined can be moved around wherever you want, put into any context.

## How it works ##

A `Component` is part of a page.  When you render a component, it can run any code.  It can attach nodes to the page, sign up event handlers, even make network requests.  Importantly, a component's render function returns an "undo" function that, when called, reverts everything done by the render function.

One component can be instanced many times, and each instance can be removed from the page independently using its undo function.


Basically two things happen when you render a component:

First, minimum dimensions bubble up.  The innermost components (text and images) measure themselves, and report their dimensions to their layouts.  The layouts use these to calculate their own minimum dimensions, and report these to their own parents.  This continues until the root component is reached.

Second, actual dimensions bubble down.  You provide a size to the root component.  It gives its children positions and sizes based on their minimum dimensions and its own actual size.  This repeats until the innermost components are reached.


To render a component, you need two things: a parent element, and a way to come up with actual dimensions, taking into account minimum dimensions.

The function `rootComponent` does this.  By default, it uses `body` as the parent element.  Your component's minimum width is ignored; it is given the width of its parent element.  It is given exactly its own minimum height, and the parent element is resized to match.

## Layouts ##

Layouts are functions that take components and return a component.

Layouts can do anything to their child components: shuffle them around, change their sizes on the fly, fade them in and out, and more.

Child components report their minimum dimensions to you; it's your responsibility as a layout to give them enough space.


Minimum dimensions bubble up repeatedly, not just once.  One image can be swapped out for another, or text can change.  Any time this happens, new minimum dimensions are bubbled up.

Actual dimensions bubble down repeatedly too.  When a component's minimum dimensions change, its actual dimensions usually get adjusted.  And whenever the root component's container is resized, a new set of actual dimensions must be computed.

## Broken Symmetry, "oops" ##

Width and Height are treated differently from each other.

Think of a paragraph of text (or of your favorite website).  How tall it is depends on the width you're viewing it at.  This is true of all components.  Heights can depend on widths.

A "minimum dimensions" does not consist of two numbers `width` and `height`.  It consists of a number `width`, and a function `height` that takes a width and returns the height that would be required at that width.

## Standard Library ##

HCJ comes "batteries-included", with a standard library of components and layouts that match or exceed HTML and CSS in both function and brevity.

That said, the HCJ standard library is still very much in flux.  As of the writing of this readme, here are some of the most common components and layouts:


### text ###

`text :: String -> Component`

Single line of text.  Takes the string to display, returns a component.

* minWidth: The width of the line
* minHeight(w): Always returns the height of the line.


### paragraph ###

`paragraph :: Number -> String -> Component`

Multi-line text.  Takes a min-width and some text, returns a component.

* minWidth: The value passed into `paragraph`.
* minHeight(w): Returns the height used by the text at width w.


### image ###

`image :: ImageConfig -> Component`

Image component.  At least one of the ImageConfig's useNativeSize, minWidth, or minHeight properties must be set.

* `src`: source, or stream of image sources
* `useNativeSize`: if truthy, the component's minWidth and minHegiht are set to the image's native width and height
* `minWidth`: if a number, component's minWidth is set to that number, and minHeight is set based on the image's aspect ratio
* `minHeight`: if a number, component's minHeight always returns that number and its minWidth is set based on the image's aspect ratio


### keepAspectRatio ###

`keepAspectRatio :: Component -> Component`

Positions child component to simply be as large as possible within a space, keeping its aspect ratio.  Very useful with images.

* minWidth and minHeight of the `keepAspectRatio` component are set to be the minWidth and minHeight of its child component.
* child component remains centered within the `keepAspectRatio` layout


### padding ###

`padding :: PaddingConfig -> Component -> Component`

Adds some empty space around a component.  `padding` takes an object with any of the following properties:

* `all`: padding to apply to all sides
* `top`: padding to apply to the top
* `bottom`: padding to apply to bottom
* `left`: padding to apply to the left side
* `right`: padding to apply to the right side

minWidth and minHeight of a `padding` component are equal to the minWidth and minHeight of its child component plus the padding amount.


### border ###

`border :: Color -> BorderConfig -> Component -> Component`

Adds a colored border around a component.

A `Color` is an object with `r`, `g`, `b`, and `a` properties.  A `BorderConfig` is the same kind of object as a `PaddingConfig`.

Like `padding`, minimum dimensions of a `border` component are equal to the minimum dimensions of its child plus the border thickness.


### stack ###

`stack :: StackConfig -> [Component] -> Component`

Places components one on top of another.

`StackConfig` may have the following properties:

* `gutterSize`: A margin to place between components in the stack.
* `collapseGutters`: If truthy, adjacent gutters within the stack are collapsed.  Adjacent gutters only happen if a stack element has height 0.

A stack's minimum dimensions are calculated:

* minWidth of a stack is the maximum of the minWidths of the stack's children
* minHeight of a stack is the sum of the minHeights of its children, plus all the gutters


### sideBySide ###

`sideBySide :: SideBySideConfig -> [Component] -> Component`

Places components side by side

`SideBySideConfig` may have the following properties:
* `gutterSize`: Same as in `stack`.
* `collapseGutters`: Same as in `stack`.
* `handleSurplusWidth`: Oftentimes, a `sideBySide` component has more than enough with for its children.  This function lets you configure your `sideBySide` component to divy out excess width how you see fit.

Like `stack`, a sideBySide's minimum dimensions are calculated:

* minWidth of a sideBySide is the sum of the minWidths of its children, plus gutters
* minHeight of a sideBySide returns the max of the minHeights of its children


### alignLRM ###

`alignLRM :: [Component] -> Component`

Takes up to three components.  Aligns them left, right, and middle within the space available.

* minWidth of an `alignLRM` is the sum of the minWidths of its children
* minHeight of an `alignLRM` is the max of the minHeights of its children


### alignTBM ###

`alignTBM :: [Component] -> Component`

Takes up to three components.  Aligns them top, bottom, and middle within the space available.

* minWidth of an `alignTBM` is the max of the minWidths of its children
* minHeight of an `alignTBM` is the sum of the minHeights of its children


### grid ###

`grid :: GridConfig -> [Component] -> Component`

A mobile responsive grid layout.  Child components are broken into rows.  GridConfig may have the following properties:

* `gutterSize`: Margin between components in each row, and between rows in the grid.
* `handleSurplusWidth`: Called for each row.  Like in `sideBySide`.
* `handleSurplusHeight`: Adjusts heights of rows, in case the grid has more than enough height.
* `useFullWidth`: Changes how grid's minWidth is computed (see below).
* `bottomToTop`: If truthy, grid rows are displayed from bottom to top instead of top to bottom.  This option should be removed; a `handleSurplusHeight` function could do this.


### componentStream ###

`componentStream :: Stream Component -> Component`

Takes a stream of components, returns a component.  Each time the stream yields a new component, the `componentStream` destroys the old component and instances the new one.

Useful for displaying ajax spinners and replacing them with content as it arrives.

Minimum dimensions of a `componentStream` are always the minimum dimensions of the latest componment in the stream.


## Version 2 ##

Version 2 is in progress in the v2 branch.  Improvements include:

Require.js is now being used for dependency management.  This library no longer pollutes the window object.

Pages are now represented as data structures.  This makes them easier to edit and render how you choose.  It will enable things like server-side rendering and drag & drop editors.

Core library is more efficient.  Leaks far less memory.  Creates fewer closures.  The `Stream` interface has safer and faster implementations.
