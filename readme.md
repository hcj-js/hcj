# hcj.js #

A javascript library for web app frontend templating

## What's it like ##

1. Define Components.
2. ???
3. Profit!

Components are the building blocks of this library.  Layouts glue components together to form new components.  A single piece of text can be a component; so can an entire web page.

This makes it very easy to edit and rearrange your website.  Component you've defined can be moved around wherever you want, placed into any context.  And because they are content-size-aware, edits to them are risk-free.

## Getting Started ##

The `example/example.js` file shows what typical HCJ code looks like.  Components are defined, and then one is taken to be the root component.  Open `example/example.html` in a browser to see this code in action.

The components and layouts used in that file, and more, are described below.

## How it works ##

Basically, two things happen when you render a component onto a page.

First, minimum dimensions bubble up.  The innermost components (text and images) measure themselves, and report their dimensions to their layouts.  The layouts use these to calculate their own minimum dimensions, and report these to their own parents.  This continues until the root component is reached.

Second, actual dimensions bubble down.  A size is given to the root component.  It gives its children positions and sizes based on their minimum dimensions and its own actual size.  This repeats until the innermost components are reached.

## Layouts ##

You have great freedom in how you design layouts.  You can shuffle your child components around, change their sizes on the fly, and fade them in and out, to name a few.

Child components report their minimum dimensions to you; it's your responsibility as a layout to give them enough space.


Minimum dimensions bubble up repeatedly, not just once.  One image can be swapped out for another, or text can change.  Any time this happens, new minimum dimensions are bubbled up.

Actual dimensions bubble down repeatedly too.  When a component's minimum dimensions change, its actual dimensions usually get adjusted.  And whenever the root component's container is resized, a new set of actual dimensions must be computed.

## Broken Symmetry ##

Width and Height are treated differently from each other.

Think of a paragraph of text (or of your favorite website).  How tall it is depends on the width you're viewing it at.  This is true of all components.  Heights can depend on widths.

The minimum dimensions that components bubble up do not consist of a `width : Number` and a `height : Number`.  They consist of a `width : Number` and a function `height : Number -> Number` that takes a width and returns the height that would be required at that width.

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

Image component.  At least one of the `ImageConfig`'s `useNativeSize`, `minWidth`, or `minHeight` properties must be set.

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