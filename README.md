# hcj.js #

Javascript library for web app frontend templating

## Install ##

`git clone https://github.com/jeffersoncarpenter/hcj.git`

## What's it like ##

1. Define Components.
2. Layer Components.
3. Profit!

Components are the building blocks of this library.  A single piece of text is a component; so is an entire web page.  Components' sizes are measured, and they are positioned using javascript.  This gives us a relatively clean, turing-complete API to use for element positioning, rather than the application of css styles.

Positioning of child components within parent components happens thusly:  First, the child sends the parent its minimum dimensions.  Second, the parent sends the child its actual dimensions.

All of this leads to functional, modular code where components can be shuffled and re-shuffled however you want.

## Width !== Height ##

Most elements have a roughly constant area (excepting images, which scale).  When the width changes, the height must change.  Thus, the minimum dimensions send from child to parent cannot simply be two numbers.

The minimum width sent from child to parent is a number.  The "minimum height" sent from child to parent is actually a function which takes a hypothetical width, and returns the required height at that width.

## Defining Components ##

The function `component` is used to define components.  It is a curried function.  The argument that it takes first is the component's intended tag name.  You usually won't need to call component directly; in the standard library we have defined `var a = component('a')`, `var div = component('div')`, etc.

Second, a `build` method is passed in.  This function is run each time the component is rendered.

The build method takes four arguments.  The first, commonly called `$el`, is a jquery selector of the created DOM element, the root element of the component.  The second, commonly called `context`, is the component is being rendered into, described below.  The third and fourth are commonly called `pushMeasureWidth` and `pushMeasureHeight`.  They may be used optionally at your leisure, and they imperatively push values into the instance's minWidth and minHeight streams.

The build method returns an object with two properties: `minWidth` and `minHeight`.  The minWidth property must be a stream of numbers, and the minHeight property must again be a stream of functions which take a hypothetical width and return the required height at that width.  These properties are optional (and not recommended) if you choose to call the pushMeasureWidth and pushMeasureHeight functions as above.

Technically, the pushMeasureWidth and pushMeasureHeight functions are implemented in terms of the `measureWidth` and `measureHeight` functions.  The measureWidth function takes an element, and measures and returns the width it requires.  The measureHeight function takes an element, and returns a function which takes a hypothetical width and measures and returns the height required by the element at that width.  Again, the pushMeasureWidth and pushMeasureHeight simply call measureWidth and measureHeight, and push the resulting value into the stream.

This returns a component.  For example:

```
// an example custom component

var captcha = div(function ($el, context, pushMeasureWidth, pushMeasureHeight) {
  captcha.render($el, {
    onSuccess: function () {
      // re-measure the width once the captcha is rendered
      pushMeasureWidth();
      
      // when the component is removed, destroy the captcha
      context.unbuild(function () {
        captcha.destroy();
      });
    },
  });
  pushMeasureWidth();
  pushMeasureHeight();
});
```

## Rendering Components ##

A component is a function that takes a context and returns an instance.  Contexts should not be constructed by hand.  Contexts are constructed internally as part of the `rootComponent` function, and returned to you from the `context.child` function described in the the Defining Layouts section.  A context is an object with the following properties:

* $el: Element to append the instance to.
* width: Stream of numbers, width available to the component.
* height: Stream of numbers, height available to the component.
* left: Stream of numbers, left coordinate of the component.
* top: Stream of numbers, top coordinate of the component.
* leftAccum: Stream of numbers, parent left coordinate relative to left edge of page.
* topAccum: Stream of numbers, parent top coordinate relative to top edge of page.
* onDestroy: Hook to run callbacks when the instance is destroyed.  (A context should only be passed into a component once).
* child: Function to create child contexts (see Defining Layouts section) 

When applied to a context, a component returns an instance.  An instance is an object with the following properties:

* $el: Root element of the instance.
* minWidth: stream of numbers giving the min width of the instance
* minHeight: stream of functions that, given a width, return the min height of the instance at that width
* destroy: function that, when called, runs all of the context's onDestroy callbacks and removes the instance from the dom

Currently, the only way to actually render a component onto a web page is to append it to `body`, and use the window width and window height as its dimensions.  This is done using the `rootComponent` function.

(When this is done, the minimum width of the root instance is ignored; the window width is used instead.  The actual height of the component is set to be its minimum height at that width.  (If it so happens that the minimum height of the root component at the window width is greater than the window height, but the minimum height of the root component at the window width minus the width of the scrollbar is smaller than the window height, then 'overflow-y: scroll' is added to the body so that the page can render in a sensical way.))

### Rendering a Page ###

To render a page, simply call the rootComponent function.

```
var page = all([
  margin(10),
  backgroundColor(color({
    r: 200,
    g: 253,
    b: 53,
  }),
])(text('Hello World'));

var rootInstance = rootComponent(page);
```

## Defining Layouts ##

A layout is a function that takes components as arguments and returns a component.  The `layout` function is for making layouts.  You pass it one argument, the layout's `buildLayout` function.

The arguments to your `buildLayout` function are somewhat dynamic.  The first two arguments, $el and context, are passed through from the layout component's $el and context (see the Defining Components section above).  The remaining arguments are the child components, as they are passed in to the layout.

The buildLayout function must return an object with `minWidth` and `minHeight` streams.  These streams are then returned from the layout component's build method.

## Example - Purple Margin ##

`purpleMargin :: Component -> Component`

Let's say we want to define a layout that adds a 10px purple margin.

Here we will quickly go over the `context.child` function mentioned earlier.  The child function takes one optional argument.  This object may be an object with the following properties:

* width: stream of numbers that specify the width of the child component, used instead of the parent's own width if present
* widthCSS: stream of string values to use for the width css property, used instead of mapping (+ "px") over the width stream if present
* height: stream of numbers that specify the height of the child component, used instead of the parent's own height if present
* heightCSS: stream of string values to use for the height css property, used instead of mapping (+ "px") over the height stream if present
* top: stream of numbers specifying the top coordinate of the child component, used instead of `stream.once(0)` if present
* topCSS: stream of string values used for the top css property, used instead of mapping (+ "px") over the top property if present
* left: stream of numbers specifying the left coordinate of the child component, used instead of `stream.once(0)` if present
* leftCSS: stream of string values used for the left css property, used instead of mapping (+ "px") over the left property if present

These parameters may either be streams, or may be the boolean value `true`.  If a stream, the stream is used as described above.  If `true`, an empty stream is created and returned, and you must manually push values into it.  Thus, like the instance's `minWidth` and `minHeight` streams, these streams may be defined either declaratively or imperatively.

The `context.child` function returns a context.  Now, here's the code for `purpleMargin` (for info on the stream api that's used, see the Streams section below).  First, the background color is set.  Second, the child instance is defined.  Third, the layout's min size info is returned.

```
var purpleMargin = layout(function ($el, context, c) {
  $el.css('background-color', '#FF00FF');
  
  var instance = c(context.child({
    width: stream.map(context.width, function (w) {
      return w - 20;
    }),
    height: stream.map(context.height(function (h) {
      return h - 20;
    }),
    top: stream.once(10),
    left: stream.once(10),
  });
  
  return {
    minWidth: stream.map(instance.minWidth, function (mw) {
      return mw + 20;
    }),
    minHeight: stream.map(instance.minHeight, function (mh) {
      return function (w) {
        return mh(w - 20) + 20;
      };
    }),
  };
});
```

## Example - Stack ##

`stack :: [Component] -> Component`

Say we want to put components into a vertical stack.  In this example, the `buildLayout` function is called with an array of components because the `stack` is called with an array of components.  Layouts can be called with one or more individual components, arrays, arrays of arrays, etc.

In this code, first we map over the components argument to create an array of child contexts, and an array of instances.  Next, we create two variables - streams of all the min widths, and all the min heights, of the instances.

Then we combine some streams together to give tops and heights to the instances.

Last we return the min width and min height of the stack.  The min width of the stack is set to the maximum of the min widths of the instances, and the min height is set to be the sum of the min heights of the instances.

```
var stack = layout(function ($el, context, cs) {
  var contexts = [];
  var instances = cs.map(function (c, index) {
    var context = context.child({
      top: true,
      height: true,
    });
    contexts.push(context);
    return c(contexts[index]);
  });

  var minWidths = stream.all(instances.map(function (i) {
    return i.minWidth;
  }));
  var minHeights = stream.all(instances.map(function (i) {
    return i.minHeight;
  }));

  stream.combine([
    ctx.width,
    ctx.height,
    minHeights,
  ], function (w, h, minHeights) {
    minHeights.reduce(function (top, minHeight, index) {
      var context = contexts[index];
      var height = minHeight(w);
      stream.push(context.top, top);
      stream.push(context.height, height);
      return top + h;
    }, 0);
  });

  return {
    minWidth: stream.map(minWidths, function (mws) {
      return mws.reduce(function (a, b) {
		return Math.max(a, b);
      }, 0);
    }),
    minHeight: stream.combine([
      ctx.width,
      minHeights,
    ], function (w, mhs) {
      return mhs.map(function (mh) {
		return mh(w);
      }).reduce(function (a, b) {
		return a + b;
      }, 0);
    }),
  };
});
```

## Standard Library - Components ##

HCJ comes with a standard library of components and layouts.


### text ###

`text :: ([SpanConfig], TextConfig) -> Component`

Text still has an incomplete and clunky API.

It is a two-argument function.  The first argument can either be one `SpanConfig` or an array of `SpanConfigs`.  The second argument is an optional `TextConfig`.

A `SpanConfig` may be either a string, or an object with the following properties (all optional except `str` which is required):

* str: The string to show.
* size: font size
* weight: font weight
* family: font family
* color: font color as an object with `r`, `g`, `b`, and `a` properties
* shadow: font shadow

The `TextConfig` parameter applies globally to all spans within the text component.  It can have all of the same properties as a `SpanConfig`, minus `str`, plus some additional properties:

* align: text align
* minWidth: causes the text's width not to be measured; this number is used instead
* minHeight: causes the text's height not to be measured; this number is used instead
* oneLine: causes the text's height not to be measured.  It is assumed to be one line tall.  Its min height value is calculated from its font size and line height.

Floating components inside text is currently not supported.  There are no technical barriers, it's only a matter of reworking the API.

Examples:

```
var hello = text('Hello');

var largeText = text('Large Text', {
  size: '50px',
});

var spans = text([{
  str: 'SANTIH',
  weight: 'bold',
}, {
  str: '_OEFYCL_OE',
  family: 'Lato',
}]);
```


### image ###

`image :: ImageConfig -> Component`

An `ImageConfig` may have the following properties, all optional except `src` which is required.  By default, an image's min width is set to its natural width, and its min height is set to maintain aspect ratio.

* src: image source
* minWidth: if present, min width is set to this number instead of the image's natural width
* minHeight: if present, min width of image is set to the quotient of this number and the image's aspect ratio

Caveat: The min width specified by an image is *decidedly not* the actual width and actual height that it displays in.  This means images on their own almost always... get stretched.  For this reason, in this pre-release version of this library it is highly recommended to use the `keepAspectRatio` layout with all images.


### keepAspectRatio ###

`keepAspectRatio :: KeepAspectRatioConfig -> Component -> Component`

Roughly speaking, behaves much like the `background` CSS property.

Positions a component in a space, maintaining its aspect ratio.  The child component's aspect ratio is assumed to be constant, and so `keepAspectRatio` will exhibit strange behavior when used with anything but images.  In the future, `image` and `keepAspectRatio` probably be merged.

A `KeepAspectRatioConfig` may have any of the following properties:

* fill: If set, the child component covers the space and may be cropped.  If not set, the child component is contained within the space and there may be margins.
* top: If set, the top of the child component is aligned with the top of the `keepAspectRatio`.
* bottom: If set, the bottom of the child component is aligned with the bottom of the `keepAspectRatio`.
* left: If set, the left of the child component is aligned with the left of the `keepAspectRatio`.
* right: If set, the left of the child component is aligned with the left of the `keepAspectRatio`.


### stack ###

`stack :: StackConfig -> [Component] -> Component`

Puts components in a stack, one on top of another.

A `StackConfig` may have the following properties:

* `padding`: Padding amount between components.
* `handleSurplusHeight`: There can be surplus height, i.e. the actual height of the stack can be greater than the minimim heights of all of the children.  A `handleSurplusHeight` function takes two arguments.  The first argument is the actual height of the stack (in pixels).  The second argument is an array of objects with `top` and `height` properties, giving the computed top coordinate and min height of each child within the stack (in pixels).  It returns a new array of objects with `top` and `height` properties.

### sideBySide ###

`sideBySide :: SideBySideConfig -> [Component] -> Component`

Puts components directly side by side.

A `SideBySideConfig` may have the following properties:

* `padding`: Padding amount between components.
* `handleSurplusWidth`: Similar to a `stack`, a `sideBySide` can have surplus width.  A `handleSurplusWidth` function takes two arguments.  The first is the actual width of the `sideBySide`.  The second is an array of objects with `left` and `width` properties, giving the computed left coordinate and min width of each child within the stack.  It returns a new array of objects with `left` and `width` coordinates.

### alignLRM ###

`alignLRM :: AlignLRMConfig -> LRMComponents -> Component`

Takes up to three components.  Aligns them left, right, and middle within the space available.

The `AlignLRMConfig` is not currently used.  However, don't forget to stick in those extra parentheses (see example) or you'll get a weird error!

An `LRMComponents` is just an object with up to three properties:

* l: component to align left
* r: component to align right
* m: component to align middle

Example:

```
var header = alignLRM()({
  l: logo,
  r: menu,
});
```

### alignTBM ###

`alignTBM :: AlignTBMConfig -> TBMComponents -> Component`

The `AlignTBMConfig` is not currently used.  However, like `alignLRM` you'll get a weird error if you forget to stick them in.

A `TBMComponents` is an object with up to three properties:

* t: component to align top
* b: component to align bottom
* m: component to align middle

### grid ###

`grid :: GridConfig -> [Component] -> Component`

A mobile responsive grid layout.  Child components are placed into rows.

* `padding`: padding amount between components
* `handleSurplusWidth`: splits surplus width among components in each row; see `sideBySide`
* `handleSurplusHeight`: splits surplus hegiht among grid rows; see `stack`
* `useFullWidth`: if set, the grid's min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components

### overlays ###

`overlays :: OverlaysConfig -> [Component] -> Component`

Places components one directly on top of another.

The OverlaysConfig is not currently used.

### componentStream ###

`componentStream :: Stream(Component) -> Component`

Takes a stream of components, returns a component.

Typical uses include:

* showing ajax spinners and replacing them with content
* displaying a "live preview" as your user updates form fields.


## Standard Library - Component Modifiers ##

In addition to the layouts that take many components and return a component, there are many layouts that take only a single component and return a component.  Much styling and functionality can be added by applying these functions.


### all ###

`all :: [Component -> Component] -> Component -> Component`

The `all` function is key.  It enables you to apply multiple functions to a component, one after another.

Arguably, `all` should be renamed to `compose`.

Example:

```
var button = all([
  margin({
    all: 10,
  }),
  border(color.white, {
    all: 1,
  }),
])(text('Submit'));
```

Composition Example (notice that `all` applied to an array of functions is itself such a function):

```
var prettyBorder = all([
  border(white, {
    all: 1,
  });
  border(gray, {
    all: 1,
  });
  border(black, {
    all: 1,
  });
]);

var button = all([
  margin({
    all: 10,
  }),
  prettyBorder,
])(text('Submit'));
```

### margin ###

`margin :: MarginConfig -> Component -> Component`

Adds some space around a component.

A `MarginConfig` may have any of the following properties:

* all: margin to apply to all sides
* top: margin to apply to the top
* bottom: margin to apply to bottom
* left: margin to apply to the left side
* right: margin to apply to the right side


### border ###

`border :: Color -> BorderConfig -> Component -> Component`

Adds a colored border around a component.

A `Color` is an object with `r`, `g`, `b`, and `a` properties.  (see below)

A `BorderConfig` may have any of the following properties:

* all: border to apply to all sides
* top: border to apply to the top
* bottom: border to apply to bottom
* left: border to apply to the left side
* right: border to apply to the right side
* radius: border radius

### crop ###

Crops a component down to a proportion of its size.

`crop :: CropConfig -> Component -> Component`

A `CropConfig` can either be a number - which is treated as an object with an 'all' property of that value - or an object with any of the following properties:

* all: crop percentage on all sides
* top: crop percentage from the top
* bottom: crop percentage from the bottom
* left: crop percentage from the left
* right: crop percentage from the right

### linkTo ###

`linkTo :: String -> Component -> Component`

Takes a URL, then takes a component and wraps it in an `a` tag with that href.

### $$ ###

`$$ :: ($ -> IO ()) -> Component -> Component`

Takes a function which takes the JQuery selector of the component and performs arbitrary actions.  Returns a function from a component to a component.

Should not affect min width and min height of the element as rendered by the browser.

### $addClass, $attr, $css, $on, $prop ###

`$addClass :: String -> Component -> Component`
`$attr :: (String, String) -> Component -> Component`
`$css :: (String, String) -> Component -> Component`
`$on :: (String, (Event -> IO ())) -> Component -> Component`
`$prop :: (String, String) -> Component -> Component`

All defined using `$$`, and simply mimic jquery methods.

### withBackgroundColor ###

`withBackgroundColor :: BackgroundColorConfig -> Component -> Component`

A `BackgroundColorConfig` is an object with any of the following properties:

* backgroundColor: background color
* fontColor: font color

## Standard Library - Streams ##

So far only static pages are documented.  `componentStream` did hint at greater possibilities.

TODO: add stream documentation

## Standard Library - Forms ##

TODO: add forms documentation

## Standard Library - Colors ##

The standard library has a standard notation for colors.  A `Color` is an object with all of the following properties:

* r: red value from 0 to 255
* g: green value from 0 to 255
* b: blue value from 0 to 255
* a: alpha value from 0 to 1

### color ###

`Color` constructor.  Easier than describing further, is pasting the code:

```
var color = function (c) {
  return {
		r: c.r || 0,
		g: c.g || 0,
		b: c.b || 0,
		a: c.a || 1,
	};
};
```

### colorString ###

`Color` destructor.  Takes a color, returns string using rgba format.

## cs is not a function ##

The most common error message you're going to get using this library.  Very uninformative, sorry.

## Version 2 ##

Version 2 is in progress, and larger in scope.  Really it is a specification system for web pages.  Pages will instead be represented as JSON data structures, which are evaluated as code like what's described above.

Browsers can implement this specification as javascript code - again, based on actually measuring elements and positioning them through simple APIs.

Servers can implement the specification as an HTML and CSS approximation, which leads to easy SEO and can lend itself to a decent UX as the page loads in.
