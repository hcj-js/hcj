# hcj.js #

A javascript library for web app frontend templating

## What's it like ##

1. Define Components.
2. ???
3. Profit!

Components are the building blocks of this library.  Layouts glue components together to form new components.  A single piece of text can be a component; so can an entire web page.

This makes it very easy to edit and rearrange your website.  Component you've defined can be moved around wherever you want, placed into any context.  And because they are content-size-aware, edits to them are risk-free.

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

## Coming Soon to This Readme ##

* Getting Started section
* List of the components and layouts currently in the standard library