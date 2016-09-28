$(function () {
  var hcj = window.hcj;

  var c = hcj.component;
  var casesplit = hcj.casesplit;
  var el = hcj.element;
  var stream = hcj.stream;

  var stack = c.stack();
  var docStack = c.stack({
	padding: 20,
  });

  var color = {
	lightGray: hcj.color.create({
	  r: 220,
	  g: 210,
	  b: 220,
	}),
	lighterGray: hcj.color.create({
	  r: 250,
	  g: 240,
	  b: 250,
	}),
	notBlack: hcj.color.create({
	  r: 10,
	  g: 0,
	  b: 10,
	}),
  };

  var font = {
	h1: {
	  family: 'sans-serif',
	  size: 40,
	  weight: 'bold',
	},
	h2: {
	  family: 'sans-serif',
	  size: 30,
	},
	h3: {
	  family: 'sans-serif',
	  size: 20,
	},
	p: {
	  family: 'sans-serif',
	  size: 15,
	},
	code: {
	  family: 'monospace',
	},
  };

  // takes a string with backticks
  // outputs a text config
  var processBackticks = function (str) {
	var state = false;
	return str.split('`').map(function (s) {
	  state = !state;
	  if (state) {
		return {
		  str: s,
		};
	  }
	  return {
		str: s,
		font: font.code,
	  };
	});
  };
  var text = function (font) {
	return function (str) {
	  return c.text(processBackticks(str), font);
	};
  };
  var h1 = text(font.h1);
  var h2 = text(font.h2);
  var h3 = text(font.h3);
  var p = text(font.p);
  var codeBlock = function (strs) {
	return c.wrap(el.pre)(stack(strs.map(function (str) {
	  return c.text(str, font.code);
	})));
  };

  var install = docStack([
	p("`git clone https://github.com/hcj-js/hcj.git`"),
	p("Use the CSS file, and either of the JS files, in the dist folder."),
  ]);

  var whatsItLike = docStack([
	stack([
	  p("1. Define Components."),
	  p("2. Combine Components."),
	  p("3. Profit!"),
	]),
	p("HTML and CSS are venerable.  First engineered for simple document layout, today they are technically turing complete."),
	p("HCJ.js provides a simple api for element positioning.  First, minimum dimensions are sent from child to parent.  Second, the actual dimensions are sent from parent to child."),
	p("These docs are written using HCJ.  The source is located at https://hcj-js.github.io/hcj/docs.js"),
	p("Some CSS features are not mirrored in HCJ.  Additionally, page load times are longer.  SEO doesn't come out of the box, but we support rendering using PhantomJS.  This can be done either server-side or as part of your build process."),
	p("One major thing that HCJ does not support is floating items so that text can flow around them.  We would very much like to add this kind of functionality, but recognize that doing this both well and fast will be difficult.  Prior work that we're looking at includes CSS floats, as well as the capabilities of programs like LaTeX and Word.")
  ]);

  var aLittleVocab = docStack([
	p("A `component` is a function that takes a `context` and returns an `instance`.  To render a component is to apply it to a context.  A `layout` is a function that takes components and returns a component."),
	p("A `context` is an object with the following nine properties:"),
	stack([
	  p('&#8226; `$el`: Element the instance will be appended to.'),
	  p('&#8226; `width`: Stream of numbers, width available to the component.'),
	  p('&#8226; `height`: Stream of numbers, height available to the component.'),
	  p('&#8226; `left`: Stream of numbers, left coordinate of the component.'),
	  p('&#8226; `top`: Stream of numbers, top coordinate of the component.'),
	  p('&#8226; `leftAccum`: Stream of numbers, parent left coordinate relative to left edge of page.'),
	  p('&#8226; `topAccum`: Stream of numbers, parent top coordinate relative to top edge of page.'),
	  p('&#8226; `onDestroy`: Sign up callbacks when the instance is destroyed.  (A context should only be passed into a component once).'),
	  p('&#8226; `child`: Returns a new `context` for rendering a child component (see below, and the Defining Layouts section)'),
	]),
	p('An `instance` is an object with the following properties:'),
	stack([
	  p('&#8226; `$el`: The created root element.'),
	  p('&#8226; `minWidth`: stream of numbers giving the element\'s min width in pixels'),
	  p('&#8226; `minHeight`: stream of functions that, given a width, return the min height of the element at that width'),
	  p("&#8226; `destroy`: runs its context's onDestroy methods, and removes $el from the dom"),
	]),
	p("The `Context::child` function takes an optional object with the following properties:"),
	stack([
	  p("&#8226; `width`: Width of the child component in pixels.  If present, used instead of the parent's width."),
	  p("&#8226; `height`: see width"),
	  p("&#8226; `top`: see width"),
	  p("&#8226; `left`: see width"),
	  p("&#8226; `widthCss`: Stream of string values to use for the child component's width property.  If present, used instead of either mapping (+ 'px') over the width stream or using '100%'.  Needed for css transitions to work correctly."),
	  p("&#8226; `heightCss`: see widthCss"),
	  p("&#8226; `topCss`: see widthCss"),
	  p("&#8226; `leftCss`: see widthCss"),
	]),
  ]);

  var libraryModules = docStack([
	p('The HCJ library pollutes the global window object with the `hcj` object.  Each module is a property of this object.  HCJ modules include:'),
	stack([
	  p('&#8226; component: Functions that return components.'),
	  p('&#8226; element: Some helper methods for creating custom components.'),
	  p('&#8226; rootComponent: The function that bootstraps a component onto a page.'),
	  p('&#8226; stream: The hcj stream library.'),
	]),
  ]);

  var definingComponents = docStack([
	p("The function `hcj.component.element` is used to define components.  The first argument of this curried function is the component's tag name."),
	p("Second, a `build` method is passed in.  This function is run each time the component is rendered."),
	p("The build method takes four arguments.  The first, `$el`, is a jquery selector of the created DOM element, the root element of the component.  The second, commonly called `context`, is the component is being rendered into, described below.  The third and fourth, `pushMeasureWidth` and `pushMeasureHeight`, may be used optionally to imperatively push values into the instance's minWidth and minHeight streams."),
	p("The build method may return an object with two properties: `minWidth` and `minHeight`.  The minWidth property is a stream of numbers, and the minHeight property is a stream of functions which take a width and return the required height at that width.  You should either return these properties OR call the pushMeasureWidth and pushMeasureHeight functions, not both."),
	p("Internally, the pushMeasureWidth and pushMeasureHeight functions call the `measureWidth` and `measureHeight` functions.  The measureWidth function takes an element, clones it, appends the clone to a hidden sandbox, removes any width property, measures the clone's width, and then removes it from the sandbox.  Similarly - the measureHeight function returns a function.  This function takes a width, clones the original measureHeight argument, appends it to a sandbox, removes any height property, sets the width to the provided value, measures the height, and then removes the element."),
	p("For example:"),
	codeBlock([
	  "// captcha component",
	  "&nbsp;",
	  "var captcha = div(function ($el, context, pushMeasureWidth, pushMeasureHeight) {",
	  "  captcha.render($el, {",
	  "    onSuccess: function () {",
	  "      pushMeasureWidth();",
	  "      context.unbuild(function () {",
	  "        captcha.destroy();",
	  "      });",
	  "    },",
	  "  });",
	  "  pushMeasureWidth();",
	  "  pushMeasureHeight();",
	  "});",
	]),
	p("This component runs pushMeasureWidth on render for programmer convenience and page load time.  Once the captcha is loaded, the width is measured again."),
  ]);

  var renderingComponents = docStack([
	p('To render a component, pass it to the `rootComponent` function.  For example:'),
	codeBlock([
	  "var c = hcj.component;",
	  "&nbsp;",
	  "var page = c.all([",
	  "  c.margin(10),",
	  "  c.backgroundColor(color({",
	  "    r: 200,",
	  "    g: 253,",
	  "    b: 53,",
	  "  }),",
	  "])(c.text('Hello World'));",
	  "&nbsp;",
	  "var rootInstance = hcj.rootComponent(page);",
	]),
	p("Currently, it's only possible to render a component by making it a root component of the page.  Multiple root components may be used to display some modal dialogs."),
  ]);

  var definingLayouts = docStack([
	p("A layout is any function that takes components as arguments and returns a component.  The `layout` function is a helper method for making layouts, and should almost always be used.  (It adds CSS styles to keep visible content from spilling outside the layout element's boundaries, and to keep it from absorbing pointer events.)  You pass it one argument, the layout's `buildLayout` function."),
	p("The arguments to your `buildLayout` function are somewhat dynamic.  The first two arguments, $el and context, are passed through from the layout component's `build` method (see the Defining Components section above).  The remaining arguments are the child components, as they are passed in to the layout."),
	p("The buildLayout function must return an object with `minWidth` and `minHeight` streams.  These streams are then returned from the layout component's build method."),

	h3('Very Basic Example'),
	p('`someLayout :: Component -> Component`'),
	p("Here is an archetypcial example of a layout.  Basically it wraps a component in a div and pushes it down by five pixels."),
	p(""),
	codeBlock([
	  "var someLayout = layout(function ($el, ctx, c) {",
	  "  var context = ctx.child({",
	  "	top: true,",
	  "  });",
	  "  stream.push(context.top, 5);",
	  "  return c(context);",
	  "});",
	  "&nbsp;",
	  "var someComponent = /* some component */;",
	  "var nestedComponent = someLayout(someComponent);",
	]),

	h3('Basic Example - Purple Margin'),
	p('`purpleMargin :: Component -> Component`'),
	p("Let's say we want to define a layout that adds a 10px purple margin."),
	p("If a stream, it is used as described.  If `true`, an empty stream is created and returned, and you must manually push values into it.  Thus, like the instance's `minWidth` and `minHeight` streams, these streams may be defined either declaratively or imperatively."),
	p("The `context.child` function returns a context.  Now, here's the code for `purpleMargin`.  First, the background color is set.  Second, the child instance is defined.  Last, the layout's min size info is returned."),
	codeBlock([
	  "var purpleMargin = layout(function ($el, context, c) {",
	  "  $el.css('background-color', '#FF00FF');",
	  "  ",
	  "  var instance = c(context.child({",
	  "    width: stream.map(context.width, function (w) {",
	  "      return w - 20;",
	  "    }),",
	  "    height: stream.map(context.height(function (h) {",
	  "      return h - 20;",
	  "    }),",
	  "    top: stream.once(10),",
	  "    left: stream.once(10),",
	  "  });",
	  "  ",
	  "  return {",
	  "    minWidth: stream.map(instance.minWidth, function (mw) {",
	  "      return mw + 20;",
	  "    }),",
	  "    minHeight: stream.map(instance.minHeight, function (mh) {",
	  "      return function (w) {",
	  "        return mh(w - 20) + 20;",
	  "      };",
	  "    }),",
	  "  };",
	  "});",
	]),

	h3('Example - Stack'),
	p("`stack :: [Component] -> Component`"),
	p("Say we want to put components into a vertical stack.  In this example, the `buildLayout` function is called with an array of components because the `stack` is called with an array of components.  Layouts can be called with one or more individual components, arrays, arrays of arrays, etc."),
	p("In this code, first we map over the components argument to create an array of child contexts, and an array of instances.  Next, we create two variables - streams of all the min widths, and all the min heights, of the instances."),
	p("Then we combine some streams together to give tops and heights to the instances."),
	p("Last we return the min width and min height of the stack.  The min width of the stack is set to the maximum of the min widths of the instances, and the min height is set to be the sum of the min heights of the instances."),
	codeBlock([
	  "var stack = layout(function ($el, context, cs) {",
	  "  var contexts = [];",
	  "  var instances = [];",
	  "  cs.map(function (c, index) {",
	  "    var context = context.child({",
	  "      top: true,",
	  "      height: true,",
	  "    });",
	  "    contexts.push(context);",
	  "    instances.push(c(context));",
	  "  });",
	  "&nbsp;",
	  "  var minWidthsS = stream.all(instances.map(function (i) {",
	  "    return i.minWidth;",
	  "  }));",
	  "  var minHeightsS = stream.all(instances.map(function (i) {",
	  "    return i.minHeight;",
	  "  }));",
	  "&nbsp;",
	  "  stream.combine([",
	  "    context.width,",
	  "    context.height,",
	  "    minHeightsS,",
	  "  ], function (w, h, mhs) {",
	  "    var top = 0;",
	  "    mhs.map(function (mh, index) {",
	  "      var context = contexts[index];",
	  "      var height = mh(w);",
	  "      stream.push(context.top, top);",
	  "      stream.push(context.height, height);",
	  "      top += h;",
	  "    });",
	  "  });",
	  "&nbsp;",
	  "  return {",
	  "    minWidth: stream.map(minWidthsS, function (mws) {",
      "      return mws.reduce(function (a, b) {",
	  "        return Math.max(a, b);",
	  "      }, 0);",
	  "    }),",
	  "    minHeight: stream.combine([",
	  "      context.width,",
	  "      minHeightsS,",
	  "    ], function (w, mhs) {",
	  "      return mhs.map(function (mh) {",
	  "        return mh(w);",
	  "      }).reduce(function (a, b) {",
	  "        return a + b;",
	  "      }, 0);",
	  "    }),",
	  "  };",
	  "});",
	]),
  ]);

  var standardLibraryElements = docStack([
  ]);

  var standardLibraryComponents = docStack([
	p('Here, in no particular order, are the primitive components.  These are defined as described in the Defining Components section.  They are found in the `window.hcj.component` object.'),

	h3('text'),
	p('`text :: ([SpanConfig], TextConfig) -> Component`'),
	p("The `text` function has a rather complex API."),
	p('It is a two-argument function.  The first argument can either be one `SpanConfig` or an array of `SpanConfigs`.  The second argument is an optional `TextConfig`.'),
	p('A `SpanConfig` may be either a string, or an object with the following properties (all optional except `str` which is required):'),
	stack([
	  p("&#8226; `str`: The string to show."),
	  p("&#8226; `size`: font size"),
	  p("&#8226; `weight`: font weight"),
	  p("&#8226; `family`: font family"),
	  p("&#8226; `color`: font color as an object with `r`, `g`, `b`, and `a` properties"),
	  p("&#8226; `shadow`: font shadow"),
	]),
	p('The `TextConfig` parameter applies globally to all spans within the text component.  It can have all of the same properties as a `SpanConfig`, minus `str`, plus some additional properties:'),
	stack([
	  p("&#8226; `align`: text align"),
	  p("&#8226; `minWidth`: causes the text's width not to be measured; this number is used instead"),
	  p("&#8226; `minHeight`: causes the text's height not to be measured; this number is used instead"),
	  p("&#8226; `oneLine`: causes the text's height not to be measured.  It is assumed to be one line tall.  Its min height value is calculated from its font size and line height."),
	]),
	p("Each time dimensions may change, `text` first approximates its min width and min height by assuming that a character has a width of 0.5 times its height.  Then, it performs the above operation.  If oneLine is set, then height approximation is not performed."),
	p('Examples:'),
	codeBlock([
	  "var c = window.hcj.component;",
	  "&nbsp;",
	  "var hello = c.text('Hello');",
	  "&nbsp;",
	  "var largeText = c.text('Large Text', {",
	  "  size: '50px',",
	  "});",
	  "&nbsp;",
	  "var spans = c.text([{",
	  "  str: 'SANTIH',",
	  "  weight: 'bold',",
	  "}, {",
	  "  str: '_OEFYCL_OE',",
	  "  family: 'Lato',",
	  "}]);",
	]),

	h3('image'),
	p('`image :: ImageConfig -> Component`'),
	p("An `ImageConfig` may have the following properties, all optional except `src` which is required.  By default, an image's min width is set to its natural width, and its min height is set to maintain aspect ratio."),
	stack([
	  p("&#8226; `src`: image source"),
	  p("&#8226; `minWidth`: if present, min width is set to this number instead of the image's natural width"),
	  p("&#8226; `minHeight`: if present, min width of image is set to the quotient of this number and the image's aspect ratio"),
	]),
	p('Note: Images will almost always stretch.  To solve this, wrap them in the keepAspectRatio layout.'),

	h3('bar.h and bar.v'),
	stack([
	  p('`bar.h :: Number -> Component`'),
	  p('`bar.v :: Number -> Component`'),
	]),
	p("Has the horizontal or vertical size you specify."),

	h3('empty'),
	stack([
	  p('`empty :: String -> Component`'),
	  p('`nothing :: Component`'),
	]),
	p('The `empty` function takes a tag name, for example "p", and returns a component with zero width and zero height using that tag name.'),
	p('The `nothing` component is defined as `empty("div")`.'),
  ]);

  var standardLibraryLayouts = docStack([
	p('Here are some common functions for overall page layout.'),

	h3('alignHorizontal (alignH)'),
	stack([
	  p('`alignHorizontal :: AlignLRMConfig -> {l: Component, r: Component, m: Component} -> Component`'),
	  p('`alignHLeft :: Component -> Component`'),
	  p('`alignHRight :: Component -> Component`'),
	  p('`alignHMiddle :: Component -> Component`'),
	]),
	p('Aligns components left, right, and middle within the space available.  Components are passed in as an object with `l`, `r`, and/or `m` properties.'),
	p("An `AlignLRMConfig` is an object with the following properties:"),
	stack([
	  p("&#8226; `transition`: css transition to apply to elements as w"),
	  p("&#8226; `r`: component to align right"),
	  p("&#8226; `m`: component to align middle"),
	]),
	p('Example:'),
	codeBlock([
	  "var c = window.hcj.component;",
	  "&nbsp;",
	  "var header = c.alignLRM()({",
	  "  l: logo,",
	  "  r: menu,",
	  "});",
	]),

	h3('alignVertical (alignV)'),
	stack([
	  p('`alignVertical :: AlignTBMConfig -> {t: Component, b: Component, m: Component} -> Component`'),
	  p('`alignVTop :: Component -> Component`'),
	  p('`alignVBottom :: Component -> Component`'),
	  p('`alignVMiddle :: Component -> Component`'),
	]),
	p('Takes up to three components.  Aligns them top, bottom, and middle within the space available.  Three functions are also provided that operate on just one component each.'),
	p("The `AlignTBMConfig` is not currently used.  However, like `alignLRM` remember to put in the parentheses.  This will probably be removed."),
	p('A `TBMComponents` is an object with up to three properties:'),
	stack([
	  p("&#8226; `t`: component to align top"),
	  p("&#8226; `b`: component to align bottom"),
	  p("&#8226; `m`: component to align middle"),
	]),

	h3('componentStream'),
	p('`componentStream :: Stream(Component) -> Component`'),
	p('Takes in a stream of components (using the hcj stream library), returns a component.'),
	p('Typical uses include:'),
	stack([
	  p("&#8226; showing ajax spinners and replacing them with content"),
	  p('&#8226; displaying a "live preview" as your user updates form fields.'),
	]),

	h3('grid'),
	p('`grid :: GridConfig -> [Component] -> Component`'),
	p('A mobile responsive grid layout.  Child components are placed into rows.'),
	stack([
	  p("&#8226; `padding`: padding amount between components"),
	  p("&#8226; `surplusWidthFunc`: splits surplus width among components in each row; see `sideBySide`"),
	  p("&#8226; `surplusHeightFunc`: splits surplus hegiht among grid rows; see `stack`"),
	  p("&#8226; `useFullWidth`: if set, the grid's min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components"),
	]),

	h3('keepAspectRatio'),
	p('`keepAspectRatio :: KeepAspectRatioConfig -> Component -> Component`'),
	p('Behaves much like the `background` CSS property.'),
	p("Positions a component in a space, maintaining its aspect ratio.  The child component's aspect ratio is assumed to be constant, and so `keepAspectRatio` will exhibit strange behavior when used with anything but images.  In the future, `image` and `keepAspectRatio` probably be merged."),
	p('A `KeepAspectRatioConfig` may have any of the following properties:'),
	stack([
	  p("&#8226; fill: If set, the child component covers the space and may be cropped.  If not set, the child component is contained within the space and there may be margins."),
	  p("&#8226; top: If set, the top of the child component is aligned with the top of the `keepAspectRatio`."),
	  p("&#8226; bottom: If set, the bottom of the child component is aligned with the bottom of the `keepAspectRatio`."),
	  p("&#8226; left: If set, the left of the child component is aligned with the left of the `keepAspectRatio`."),
	  p("&#8226; right: If set, the left of the child component is aligned with the left of the `keepAspectRatio`."),
	]),

	h3('largestWidthThatFits'),
	p('`margin :: LargestWidthThatFitsConfig -> [Component] -> Component`'),
	p('LargestWidthThatFitsConfig is not currently used.'),
	p('Looking at its own available width and the min widths of components that are passed in, chooses the largest one that fits.'),

	h3('overlays'),
	p('`overlays :: OverlaysConfig -> [Component] -> Component`'),
	p('Places components one directly on top of another.'),
	p('The OverlaysConfig is not currently used.'),

	h3('sideBySide'),
	p('`sideBySide :: SideBySideConfig -> [Component] -> Component`'),
	p('Puts components directly side by side.'),
	p('A `SideBySideConfig` may have the following properties:'),
	stack([
	  p("&#8226; `padding`: Padding amount between components."),
	  p("&#8226; `surplusWidthFunc`: Similar to a `stack`, a `sideBySide` can have surplus width.  A `surplusWidthFunc` function takes two arguments.  The first is the actual width of the `sideBySide`.  The second is an array of objects with `left` and `width` properties, giving the computed left coordinate and min width of each child within the stack.  It returns a new array of objects with `left` and `width` coordinates."),
	]),

	h3('stack'),
	p('`stack :: StackConfig -> [Component] -> Component`'),
	p('Puts components in a stack, one on top of another.'),
	p('A `StackConfig` may have the following properties:'),
	stack([
	  p("&#8226; `padding`: Padding amount between components."),
	  p("&#8226; `surplusHeightFunc`: There can be surplus height, i.e. the actual height of the stack can be greater than the minimim heights of all of the children.  A `surplusHeightFunc` function takes two arguments.  The first argument is the actual height of the stack (in pixels).  The second argument is an array of objects with `top` and `height` properties, giving the computed top coordinate and min height of each child within the stack (in pixels).  It returns a new array of objects with `top` and `height` properties."),
	]),
  ]);

  var standardLibraryComponentModifiers = docStack([
	p('While some layouts take multiple components and return a component, these generally take one component and return a component.  Much styling and functionality can be added by applying these layouts.'),
	p('These are found in the `window.hcj.component` object.'),

	h3('all'),
	p('`all :: [Component -> Component] -> Component -> Component`'),
	p('The `all` function is listed first because it is key to using the other functions listed here.  It performs function composition, i.e. applies multiple functions to a component, one after another.'),
	p('Example:'),
	codeBlock([
	  "var title = all([",
	  "  margin({",
	  "    all: 10,",
	  "  }),",
	  "  border(color.white, {",
	  "    all: 1,",
	  "  }),",
	  "])(text('Star Trek Voyager'));",
	]),
	p('Another example:'),
	codeBlock([
	  "var prettyBorder = all([",
	  "  border(white, {",
	  "    all: 1,",
	  "  });",
	  "  border(gray, {",
	  "    all: 1,",
	  "  });",
	  "  border(black, {",
	  "    all: 1,",
	  "  });",
	  "]);",
	  "&nbsp;",
	  "var button = all([",
	  "  margin({",
	  "    all: 10,",
	  "  }),",
	  "  prettyBorder,",
	  "])(text('Submit'));",
	]),

	h3('and'),
	p('`and :: ((Instance, Context) -> IO ()) -> Component -> Component`'),
	p('The "and" function is listed second because it is.  It takes a function which takes an instance and a context, and returns a function from a component to a component.  Example:'),
	codeBlock([
	  "var turnBlue = and(function (i) {",
	  "  i.$el.css('background-color', 'blue');",
	  "});",
	]),

	h3('$$'),
	p('`$$ :: ($ -> IO ()) -> Component -> Component`'),
	p('Takes a function which takes the JQuery selector of the component and performs arbitrary actions.  Returns a function from a component to a component.'),
	p('Should not affect min width and min height of the element as rendered by the browser.'),

	h3('$addClass, $attr, $css, $on, $prop'),
	stack([
	  p('`$addClass :: String -> Component -> Component`'),
	  p('`$attr :: (String, String) -> Component -> Component`'),
	  p('`$css :: (String, String) -> Component -> Component`'),
	  p('`$on :: (String, (Event -> IO ())) -> Component -> Component`'),
	  p('`$prop :: (String, String) -> Component -> Component`'),
	]),
	p('All defined using `$$`, and simply mimic jquery methods.'),

	h3('backgroundColor'),
	p('`backgroundColor :: BackgroundColorConfig -> Component -> Component`'),
	p('A `BackgroundColorConfig` is an object with any of the following properties, all optional:'),
	stack([
	  p("&#8226; background: background color"),
	  p("&#8226; font: font color"),
	  p("&#8226; backgroundHover: background color on hover"),
	  p("&#8226; fontHover: font color on hover"),
	]),

	h3('border'),
	p('`border :: Color -> BorderConfig -> Component -> Component`'),
	p('Adds a colored border around a component.'),
	p('A `Color` is an object with `r`, `g`, `b`, and `a` properties.  (see below)'),
	p('A `BorderConfig` may have any of the following properties:'),
	stack([
	  p("&#8226; all: border to apply to all sides"),
	  p("&#8226; top: border to apply to the top"),
	  p("&#8226; bottom: border to apply to bottom"),
	  p("&#8226; left: border to apply to the left side"),
	  p("&#8226; right: border to apply to the right side"),
	  p("&#8226; radius: border radius"),
	]),

	h3('crop'),
	p('Crops a component down to a proportion of its size.'),
	p('`crop :: CropConfig -> Component -> Component`'),
	p("A `CropConfig` can either be a number - which is treated as an object with an 'all' property of that value - or an object with any of the following properties:"),
	stack([
	  p("&#8226; all: crop percentage on all sides"),
	  p("&#8226; top: crop percentage from the top"),
	  p("&#8226; bottom: crop percentage from the bottom"),
	  p("&#8226; left: crop percentage from the left"),
	  p("&#8226; right: crop percentage from the right"),
	]),

	h3('link'),
	p('`link :: Component -> Component`'),
	p('Gives an element the `pointer: cursor` css style.'),

	h3('linkTo'),
	p('`linkTo :: LinkConfig -> Component -> Component`'),
	p('Wraps component it in an `a` tag with a particular href.'),
	p('A `LinkConfig` is an object with the following properties:'),
	stack([
	  p("&#8226; href: href property (required)"),
	  p("&#8226; target: link target"),
	]),

	h3('margin'),
	p('`margin :: MarginConfig -> Component -> Component`'),
	p('Adds some space around a component.'),
	p('A `MarginConfig` may have any of the following properties:'),
	stack([
	  p("&#8226; all: margin to apply to all sides"),
	  p("&#8226; top: margin to apply to the top"),
	  p("&#8226; bottom: margin to apply to bottom"),
	  p("&#8226; left: margin to apply to the left side"),
	  p("&#8226; right: margin to apply to the right side"),
	]),

	h3('onThis'),
	stack([
	  p('`onThis :: String -> (Event -> IO ()) -> Component -> Component`'),
	  p('`changeThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`clickThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`keydownThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`keyupThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mousedownThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mousemoveThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseoverThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseoutThis :: (Event -> IO ()) -> Component -> Component`'),
	  p('`mouseupThis :: (Event -> IO ()) -> Component -> Component`'),
	]),
	p('Curried form of the $on function.  We provide additional functions where it is called with its first argument.'),
  ]);

  var standardLibraryStreams = docStack([
	p("All programming is asynchronous.  There is the code that's run when your computer boots, and then there are interrupts."),
	p("HCJ provides its own slimy little stream implementation.  The reasons for choosing this over another implementation like Bacon or Reactive Extensions are speed and control over the stream semantics.  You will only be forced to deal with it if you want to write components (or layouts); HCJ can interoperate with other stream libraries."),
	p("An hcj stream (or just, stream) is nothing more than a way to get the most recent available data from point A into point B.  A stream is an object with two properties:"),
	stack([
	  p("&#8226; lastValue: the most recent data point"),
	  p("&#8226; listeners: array of functions that are run when there is new data (private member, do not access)"),
	]),
	p('Streams can be defined either declaratively or imperatively.  That is, you can let a stream be an operation applied to other streams, or you can just create it and push to it.  Unlike in other stream implementations:'),
	stack([
	  p("&#8226; The most recent data point is accessible through the `lastValue` property, and may be read off at your leisure."),
	  p("&#8226; If you push one value through a stream multiple times, it will only be hanlded the first time."),
	  p("&#8226; If you push multiple values through a stream quickly (synchronously), intermediate values will be skipped."),
	]),
	p('So, the internal stream library is certainly not for aggregating financial transactions, but rather for maintaining output state in terms of input state as lightly as possible.'),
	p('Note: to skip intermediate values, `setTimeout` calls are made.  When streams are defined in terms of each other, multiple `setTimeout` calls are made in sequence.  If you want to run some code after all stream operations have settled, you must call `stream.defer` instead of `setTimeout`.  If you want to defer the execution of a block of code and then push to a stream, call `stream.next` instead of `setTimeout`.  Otherwise, `stream.defer` calls will not know to wait for your code.'),

	p('Here, in alphabetical order, are the stream methods.  Common methods are `create`, `push`, `map`, `reduce`, and `combine`.'),

	h3('combine'),
	p('`combine : map Stream ts -> (ts -> x) -> Stream x`'),
	p('Takes an array of streams, and a function.  Result stream is the application the function onto the latest values from all input streams.'),

	h3('combineInto'),
	p('`combine : map Stream ts -> (ts -> x) -> Stream x -> IO ()`'),
	p('Imperative form of `combine`.  Takes an array of streams, a function, and a target stream, and pushes all values into the target stream.'),

	h3('combineObject'),
	p('`combineObject : {a: Stream x, b: Stream y, ...} -> Stream {a: x, b: y, ...}`'),
	p('Takes an object whose properties are streams, returns a stream of objects.'),

	h3('create'),
	p('`create : a -> Stream a`'),
	p('Creates a stream, and (optionally) initializes it using the argument passed in.  The `push` or `pushAll` functions can be used to push in additional points into the stream.'),
	p('Example:'),
	codeBlock([
	  "var onceFiftyS = stream.create(50);",
	]),

	h3('debounce'),
	p('`debounce : Stream a -> Number -> Stream a`'),
	p('Pushes to output stream no more quickly than the given number of milliseconds.'),

	h3('delay'),
	p('`delay : Stream a -> Number -> Stream a`'),
	p('Pushes to output stream after waiting the given number of milliseconds.'),

	h3('filter'),
	p('`filter : Stream a -> (a -> Bool) -> Stream a`'),
	p('Returns a stream that includes only the values for which the provided predicate returns something truthy.'),

	h3('fromPromise'),
	p('`fromPromise : Promise a -> a -> Stream a`'),
	p('Takes a promise, and an optional initial value.  Returns a stream (optionally initialized with the initial value), which receives the value from the promise when it resolves.'),

	h3('map'),
	p('`map : Stream a -> (a -> b) -> Stream b'),
	p('Applies a function to each data point of a stream.'),
	p('Example:'),
	codeBlock([
	  "var centsS = stream.create();",
	  "var dollarAmountS = stream.map(centsS, function (cents) {",
	  "  return Math.floor(cents / 100) + '.' + (cents % 100);",
	  "})",
	]),

	h3('promise'),
	p('`promise : Stream a -> Promise a`'),
	p('Returns a promise that resolves as soon as there is a data point in the stream.'),

	h3('prop'),
	p('`prop : Stream {p: t} -> (p : String) -> Stream t`'),
	p('Maps over a stream of objects, accessing the specified key.  That type signature uses some made-up notation for polymorphic row types.'),

	h3('push'),
	p('`push : Stream a -> a -> IO ()`'),
	p('Pushes a value onto a stream.'),
	p('Example:'),
	codeBlock([
	  "var clickS = stream.create();",
	  "$el.on('click', function (ev) {",
	  "  stream.push(clickS, ev)",
	  "})",
	]),

	h3('pushAll'),
	p('`pushAll : Stream a -> Stream a -> IO ()`'),
	p('Pushes all values from one stream onto another stream.'),
	p('Example:'),
	codeBlock([
	  "var sourceS = stream.create();",
	  "var targetS = stream.create();",
	  "stream.pushAll(sourceS, targetS);",
	]),

	h3('reduce'),
	p('`reduce : Stream a -> (b -> a -> b) -> b -> Stream b'),
	p('Applies a function to each data point of a stream, keeping a running total.  Like array reduce, but the reduce callback has the orders of the arguments reversed.'),
	p('Example:'),
	codeBlock([
	  "var clickS = stream.create();",
	  "var countClicksS = stream.reduce(clickS, function (x)",
	  "  return x + 1;",
	  "}, 0);",
	]),

	h3('splitObject'),
	p('`splitObject : {a: x, b: y, ...} -> {a: Stream x, b: Stream y, ...}`'),
	p('Takes an object, returns an object where each property is a stream initialized with the value from the input object.'),
  ]);

  var standardLibraryForms = docStack([
	h3('HCJ Forms'),
	p("TODO: add forms documentation"),
	// p("Hcj provides some functionality for generating web forms.  To be frank it's a little haphazard, and will be replaced by something cleaner in the future.  However it definitely works."),

	// h3("hcj.forms.formFor"),
	// p("The formFor function is for generating forms.  It is curried, taking several parameters in sequence.  These paramaters are:"),
	// stack([
	//   p('The form field types and names'),
	//   p('Default values for the form fields'),
	//   p('The on submit function'),
	//   p('Form style'),
	//   p('Display callback'),
	// ]),
	// p("The field types and names are two parameters"),
  ]);

  var standardLibraryColors = docStack([
	p('The standard library has a standard notation for colors.  A `Color` is an object with all of the following properties:'),
	p('These functions are found in `window.hcj.color'),
	stack([
	  p("&#8226; r: red value from 0 to 255"),
	  p("&#8226; g: green value from 0 to 255"),
	  p("&#8226; b: blue value from 0 to 255"),
	  p("&#8226; a: alpha value from 0 to 1"),
	]),

	h3('color'),
	p('`Color` constructor.  Easier than describing further, is pasting the code:'),
	codeBlock([
	  "var color = function (c) {",
	  "  return {",
	  "    r: c.r || 0,",
	  "    g: c.g || 0,",
	  "    b: c.b || 0,",
	  "    a: c.a || 1,",
	  "  };",
	  "};",
	]),

	h3('colorString'),
	p('`Color` destructor.  Takes a color, returns string using rgba format.'),
  ]);

  var standardLibraryJso = docStack([
	p("Jso is an interpreted functional programming language for web design.  It is a subset of JSON, and therefore can be written in Javascript."),
	p("A Jso program has server-side semantics as well as client-side semantics.  These semantics determine how side effects occur as a Jso program is evaluated.  Generally, under server semantics side effects are run directly while under client semantics API calls are made."),
	// p("Some terms are inherited from the host language, including values of the Number type, the Array type, and associated operations."),
  ]);

  var csIsNotAFunction = docStack([
	p("The most common error message you're going to get using this library.  Very uninformative, sorry."),
  ]);

  var version2 = docStack([
	p('JSON data schema to represent pages as lambda terms (will eliminating need for PhantomJS) (see https://github.com/jeffersoncarpenter/casesplit)'),
	p('Float components so that text can float around them (will probably be a layout, unsure just what kind of api to give it)'),
	p('Way to automatically apply CSS transitions in each place they are needed instead of doing that by hand'),
	p('See if using canvas to measure text is faster than placing a DOM element in a sandbox'),
	p('(maybe) CSS approximations of components and layouts for server-side rendering'),
  ]);

  var support = docStack([
	p('For support, join #hcj on Freenode or submit an issue on Github.  It will be answered asap.'),
  ]);

  var pages = [{
	title: "Introduction",
	component: whatsItLike,
  }, {
	title: 'Install',
	component: install,
  }, {
	title: 'Hcj Terminology',
	component: aLittleVocab,
  }, {
	title: 'Rendering Components',
	component: renderingComponents,
  }, {
	title: 'Standard Library - Components',
	component: standardLibraryComponents,
  }, {
	title: 'Standard Library - Layouts',
	component: standardLibraryLayouts,
  }, {
	title: 'Standard Library - More Layouts',
	component: standardLibraryComponentModifiers,
  }, {
	title: 'Standard Library - Streams',
	component: standardLibraryStreams,
  }, {
	title: 'Standard Library - Forms',
	component: standardLibraryForms,
  }, {
	title: 'Standard Library - Colors',
	component: standardLibraryColors,
  }, {
  // 	title: 'Standard Library - Jso',
  // 	component: standardLibraryJso,
  // }, {
	title: 'Defining Components',
	component: definingComponents,
  }, {
	title: 'Defining Layouts',
	component: definingLayouts,
  }, {
	title: 'cs is not a function',
	component: csIsNotAFunction,
  }, {
	title: 'Planned Items',
	component: version2,
  }, {
	title: 'Support',
	component: support,
  }];

  var initialIndex = window.location.hash && parseInt(window.location.hash.substring(1));
  var currentPageS = stream.once(initialIndex || 0);

  stream.map(currentPageS, function (index) {
	window.location.hash = index;
  });

  var sidebar = c.all([
	c.margin(20),
	c.backgroundColor({
	  background: color.lightGray,
	}),
  ])(stack([
	c.image({
	  src: './demo.png',
	  minWidth: 0,
	}),
	c.bar.h(20),
	stack(pages.map(function (p, i) {
	  return c.all([
		c.margin(2),
		c.link,
		c.clickThis(function () {
		  stream.push(currentPageS, i);
		}),
		c.backgroundColor({
		  background: stream.map(currentPageS, function (index) {
			return index === i ? color.lighterGray : color.lightGray;
		  }),
		  backgroundHover: color.lighterGray,
		}),
	  ])(c.text(p.title, font.p));
	})),
  ]));

  var docs = c.all([
	c.minHeightAtLeast(stream.windowHeight),
	c.backgroundColor({
	  font: color.notBlack,
	}),
  ])(c.grid({
	surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
	surplusHeightFunc: hcj.funcs.surplusHeight.giveToNth(0),
  })([
	sidebar,
	c.all([
	  c.margin(20),
	  c.backgroundColor({
		background: color.lighterGray,
	  }),
	])(docStack([
	  h1('hcj.js'),
	  p('Pre-release'),
	  c.componentStream(stream.map(currentPageS, function (index) {
		var p = pages[index];
		return docStack([
		  h2(p.title),
		  p.component,
		]);
	  })),
	])),
  ]));

  window.hcj.rootComponent(docs);
});
