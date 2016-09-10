$(function () {
  var c = window.hcj.component;
  var el = window.hcj.el;

  var stack = c.stack();
  var docStack = c.stack({
	padding: 20,
  });

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
	h2("Install"),
	p("`git clone https://github.com/jeffersoncarpenter/hcj.git`"),
  ]);

  var whatsItLike = docStack([
	h2("What's It Like"),
	stack([
	  p("1. Define Components."),
	  p("2. Layer Components."),
	  p("3. Profit!"),
	]),
	p("Components are the building blocks of this library.  A single piece of text is a component; so is an entire web page.  Components' sizes are measured, and they are positioned using javascript.  This gives us a relatively clean, turing-complete API to use for element positioning, rather than the application of css styles."),
	p("Positioning of child components within parent components happens thusly:  First, the child sends the parent its minimum dimensions.  Second, the parent sends the child its actual dimensions."),
	p("All of this leads to functional, modular code where components can be shuffled and re-shuffled however you want."),
	p("One major thing that this library gives up compared to CSS is the ability to inline arbitrary content into paragraphs.  There is support for styling text using spans, and we do believe this leads to a much more useful layout system overall."),
  ]);

  var widthIsNotHeight = docStack([
	h2("Width !== Height"),
	p("Most elements have a roughly constant area (excepting images, which scale).  When the width changes, the height must change.  Thus, the minimum dimensions send from child to parent cannot simply be two numbers."),
	p("The minimum width sent from child to parent is a number.  The \"minimum height\" sent from child to parent is actually a function which takes a hypothetical width, and returns the required height at that width."),
  ]);

  var definingComponents = docStack([
	h2('Defining Components'),
	p("The function `component` is used to define components.  It is a curried function.  The argument that it takes first is the component's intended tag name.  You usually won't need to call component directly; in the standard library we have defined `var a = component('a')`, `var div = component('div')`, etc."),
	p("Second, a `build` method is passed in.  This function is run each time the component is rendered."),
	p("The build method takes four arguments.  The first, commonly called `$el`, is a jquery selector of the created DOM element, the root element of the component.  The second, commonly called `context`, is the component is being rendered into, described below.  The third and fourth are commonly called `pushMeasureWidth` and `pushMeasureHeight`.  They may be used optionally at your leisure, and they imperatively push values into the instance's minWidth and minHeight streams."),
	p("The build method returns an object with two properties: `minWidth` and `minHeight`.  The minWidth property must be a stream of numbers, and the minHeight property must again be a stream of functions which take a hypothetical width and return the required height at that width.  These properties are optional (and not recommended) if you choose to call the pushMeasureWidth and pushMeasureHeight functions as above."),
	p("Technically, the pushMeasureWidth and pushMeasureHeight functions are implemented in terms of the `measureWidth` and `measureHeight` functions.  The measureWidth function takes an element, and measures and returns the width it requires.  The measureHeight function takes an element, and returns a function which takes a hypothetical width and measures and returns the height required by the element at that width.  Again, the pushMeasureWidth and pushMeasureHeight simply call measureWidth and measureHeight, and push the resulting value into the stream."),
	p("This returns a component.  For example:"),
	codeBlock([
	  "// an example custom component",
	  "&nbsp;",
	  "var captcha = div(function ($el, context, pushMeasureWidth, pushMeasureHeight) {",
	  "  captcha.render($el, {",
	  "    onSuccess: function () {",
	  "      // re-measure the width once the captcha is rendered",
	  "      pushMeasureWidth();",
	  "      ",
	  "      // when the component is removed, destroy the captcha",
	  "      context.unbuild(function () {",
	  "        captcha.destroy();",
	  "      });",
	  "    },",
	  "  });",
	  "  pushMeasureWidth();",
	  "  pushMeasureHeight();",
	  "});",
	]),
  ]);

  var renderingComponents = docStack([
	h2('Rendering Components'),
	p("A component is a function that takes a context and returns an instance.  Contexts should not be constructed by hand.  Contexts are constructed internally as part of the `rootComponent` function, and returned to you from the `context.child` function described in the the Defining Layouts section.  A context is an object with the following properties:"),
	stack([
	  p('* $el: Element to append the instance to.'),
	  p('* width: Stream of numbers, width available to the component.'),
	  p('* height: Stream of numbers, height available to the component.'),
	  p('* left: Stream of numbers, left coordinate of the component.'),
	  p('* top: Stream of numbers, top coordinate of the component.'),
	  p('* leftAccum: Stream of numbers, parent left coordinate relative to left edge of page.'),
	  p('* topAccum: Stream of numbers, parent top coordinate relative to top edge of page.'),
	  p('* onDestroy: Hook to run callbacks when the instance is destroyed.  (A context should only be passed into a component once).'),
	  p('* child: Function to create child contexts (see Defining Layouts section)'),
	]),
	p('When applied to a context, a component returns an instance.  An instance is an object with the following properties:'),
	stack([
	  p('* $el: Root element of the instance.'),
	  p('* minWidth: stream of numbers giving the min width of the instance'),
	  p('* minHeight: stream of functions that, given a width, return the min height of the instance at that width'),
	  p("* destroy: function that, when called, runs all of the context's onDestroy callbacks and removes the instance from the dom"),
	]),
	p("Currently, the only way to actually render a component onto a web page is to append it to `body`, and use the window width and window height as its dimensions.  This is done using the `rootComponent` function."),
	p("(When this is done, the minimum width of the root instance is ignored; the window width is used instead.  The actual height of the component is set to be its minimum height at that width.  (If it so happens that the minimum height of the root component at the window width is greater than the window height, but the minimum height of the root component at the window width minus the width of the scrollbar is smaller than the window height, then 'overflow-y: scroll' is added to the body so that the page can render in a sensical way.))"),

	h3('Rendering a Page'),
	p('To render a page, simply call the rootComponent function.'),
	codeBlock([
	  "var page = all([",
	  "  margin(10),",
	  "  backgroundColor(color({",
	  "    r: 200,",
	  "    g: 253,",
	  "    b: 53,",
	  "  }),",
	  "])(text('Hello World'));",
	  "&nbsp;",
	  "var rootInstance = rootComponent(page);",
	]),
  ]);

  var definingLayouts = docStack([
	h2('Defining Layouts'),
	p("A layout is a function that takes components as arguments and returns a component.  The `layout` function is for making layouts.  You pass it one argument, the layout's `buildLayout` function."),
	p("The arguments to your `buildLayout` function are somewhat dynamic.  The first two arguments, $el and context, are passed through from the layout component's $el and context (see the Defining Components section above).  The remaining arguments are the child components, as they are passed in to the layout."),
	p("The buildLayout function must return an object with `minWidth` and `minHeight` streams.  These streams are then returned from the layout component's build method."),

	h3('Example - Purple Margin'),
	p('`purpleMargin :: Component -> Component`'),
	p("Let's say we want to define a layout that adds a 10px purple margin."),
	p("Here we will quickly go over the `context.child` function mentioned earlier.  The child function takes one optional argument.  This object may be an object with the following properties:"),
	stack([
	  p("* width: stream of numbers that specify the width of the child component, used instead of the parent's own width if present"),
	  p("* widthCSS: stream of string values to use for the width css property, used instead of mapping (+ \"px\") over the width stream if present"),
	  p("* height: stream of numbers that specify the height of the child component, used instead of the parent's own height if present"),
	  p("* heightCSS: stream of string values to use for the height css property, used instead of mapping (+ \"px\") over the height stream if present"),
	  p("* top: stream of numbers specifying the top coordinate of the child component, used instead of `stream.once(0)` if present"),
	  p("* topCSS: stream of string values used for the top css property, used instead of mapping (+ \"px\") over the top property if present"),
	  p("* left: stream of numbers specifying the left coordinate of the child component, used instead of `stream.once(0)` if present"),
	  p("* leftCSS: stream of string values used for the left css property, used instead of mapping (+ \"px\") over the left property if present"),
	]),
	p("These parameters may either be streams, or may be the boolean value `true`.  If a stream, the stream is used as described above.  If `true`, an empty stream is created and returned, and you must manually push values into it.  Thus, like the instance's `minWidth` and `minHeight` streams, these streams may be defined either declaratively or imperatively."),
	p("The `context.child` function returns a context.  Now, here's the code for `purpleMargin` (for info on the stream api that's used, see the Streams section below).  First, the background color is set.  Second, the child instance is defined.  Third, the layout's min size info is returned."),
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
	  "  var instances = cs.map(function (c, index) {",
	  "    var context = context.child({",
	  "      top: true,",
	  "      height: true,",
	  "    });",
	  "    contexts.push(context);",
	  "    return c(contexts[index]);",
	  "  });",
	  "&nbsp;",
	  "  var minWidths = stream.all(instances.map(function (i) {",
	  "    return i.minWidth;",
	  "  }));",
	  "  var minHeights = stream.all(instances.map(function (i) {",
	  "    return i.minHeight;",
	  "  }));",
	  "&nbsp;",
	  "  stream.combine([",
	  "    ctx.width,",
	  "    ctx.height,",
	  "    minHeights,",
	  "  ], function (w, h, minHeights) {",
	  "    minHeights.reduce(function (top, minHeight, index) {",
	  "      var context = contexts[index];",
	  "      var height = minHeight(w);",
	  "      stream.push(context.top, top);",
	  "      stream.push(context.height, height);",
	  "      return top + h;",
	  "    }, 0);",
	  "  });",
	  "&nbsp;",
	  "  return {",
	  "    minWidth: stream.map(minWidths, function (mws) {",
      "      return mws.reduce(function (a, b) {",
	  "        return Math.max(a, b);",
	  "      }, 0);",
	  "    }),",
	  "    minHeight: stream.combine([",
	  "      ctx.width,",
	  "      minHeights,",
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

  var standardLibraryComponents = docStack([
	h2('Standard Library - Components'),
	p('HCJ comes with a standard library of components and layouts.'),

	h3('text'),
	p('`text :: ([SpanConfig], TextConfig) -> Component`'),
	p('Text still has an incomplete and clunky API.'),
	p('It is a two-argument function.  The first argument can either be one `SpanConfig` or an array of `SpanConfigs`.  The second argument is an optional `TextConfig`.'),
	p('A `SpanConfig` may be either a string, or an object with the following properties (all optional except `str` which is required):'),
	stack([
	  p("* str: The string to show."),
	  p("* size: font size"),
	  p("* weight: font weight"),
	  p("* family: font family"),
	  p("* color: font color as an object with `r`, `g`, `b`, and `a` properties"),
	  p("* shadow: font shadow"),
	]),
	p('The `TextConfig` parameter applies globally to all spans within the text component.  It can have all of the same properties as a `SpanConfig`, minus `str`, plus some additional properties:'),
	stack([
	  p("* align: text align"),
	  p("* minWidth: causes the text's width not to be measured; this number is used instead"),
	  p("* minHeight: causes the text's height not to be measured; this number is used instead"),
	  p("* oneLine: causes the text's height not to be measured.  It is assumed to be one line tall.  Its min height value is calculated from its font size and line height."),
	]),
	p("Floating components inside text is currently not supported.  There are no technical barriers, it's only a matter of reworking the API."),
	p('Examples:'),
	codeBlock([
	  "var hello = text('Hello');",
	  "&nbsp;",
	  "var largeText = text('Large Text', {",
	  "  size: '50px',",
	  "});",
	  "&nbsp;",
	  "var spans = text([{",
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
	  p("* src: image source"),
	  p("* minWidth: if present, min width is set to this number instead of the image's natural width"),
	  p("* minHeight: if present, min width of image is set to the quotient of this number and the image's aspect ratio"),
	]),
	p('Caveat: The min width specified by an image is *decidedly not* the actual width and actual height that it displays in.  This means images on their own almost always... get stretched.  For this reason, in this pre-release version of this library it is highly recommended to use the `keepAspectRatio` layout with all images.'),

	h3('keepAspectRatio'),
	p('`keepAspectRatio :: KeepAspectRatioConfig -> Component -> Component`'),
	p('Roughly speaking, behaves much like the `background` CSS property.'),
	p("Positions a component in a space, maintaining its aspect ratio.  The child component's aspect ratio is assumed to be constant, and so `keepAspectRatio` will exhibit strange behavior when used with anything but images.  In the future, `image` and `keepAspectRatio` probably be merged."),
	p('A `KeepAspectRatioConfig` may have any of the following properties:'),
	stack([
	  p("* fill: If set, the child component covers the space and may be cropped.  If not set, the child component is contained within the space and there may be margins."),
	  p("* top: If set, the top of the child component is aligned with the top of the `keepAspectRatio`."),
	  p("* bottom: If set, the bottom of the child component is aligned with the bottom of the `keepAspectRatio`."),
	  p("* left: If set, the left of the child component is aligned with the left of the `keepAspectRatio`."),
	  p("* right: If set, the left of the child component is aligned with the left of the `keepAspectRatio`."),
	]),

	h3('stack'),
	p('`stack :: StackConfig -> [Component] -> Component`'),
	p('Puts components in a stack, one on top of another.'),
	p('A `StackConfig` may have the following properties:'),
	stack([
	  p("* `padding`: Padding amount between components."),
	  p("* `handleSurplusHeight`: There can be surplus height, i.e. the actual height of the stack can be greater than the minimim heights of all of the children.  A `handleSurplusHeight` function takes two arguments.  The first argument is the actual height of the stack (in pixels).  The second argument is an array of objects with `top` and `height` properties, giving the computed top coordinate and min height of each child within the stack (in pixels).  It returns a new array of objects with `top` and `height` properties."),
	]),

	h3('sideBySide'),
	p('`sideBySide :: SideBySideConfig -> [Component] -> Component`'),
	p('Puts components directly side by side.'),
	p('A `SideBySideConfig` may have the following properties:'),
	stack([
	  p("* `padding`: Padding amount between components."),
	  p("* `handleSurplusWidth`: Similar to a `stack`, a `sideBySide` can have surplus width.  A `handleSurplusWidth` function takes two arguments.  The first is the actual width of the `sideBySide`.  The second is an array of objects with `left` and `width` properties, giving the computed left coordinate and min width of each child within the stack.  It returns a new array of objects with `left` and `width` coordinates."),
	]),

	h3('alignLRM'),
	p('`alignLRM :: AlignLRMConfig -> LRMComponents -> Component`'),
	p('Takes up to three components.  Aligns them left, right, and middle within the space available.'),
	p("The `AlignLRMConfig` is not currently used.  However, don't forget to stick in those extra parentheses (see example) or you'll get a weird error!"),
	p('An `LRMComponents` is just an object with up to three properties:'),
	stack([
	  p("* l: component to align left"),
	  p("* r: component to align right"),
	  p("* m: component to align middle"),
	]),
	p('Example:'),
	codeBlock([
	  "var header = alignLRM()({",
	  "  l: logo,",
	  "  r: menu,",
	  "});",
	]),

	h3('alignTBM'),
	p('`alignTBM :: AlignTBMConfig -> TBMComponents -> Component`'),
	p("The `AlignTBMConfig` is not currently used.  However, like `alignLRM` you'll get a weird error if you forget to stick them in."),
	p('A `TBMComponents` is an object with up to three properties:'),
	stack([
	  p("* t: component to align top"),
	  p("* b: component to align bottom"),
	  p("* m: component to align middle"),
	]),

	h3('grid'),
	p('`grid :: GridConfig -> [Component] -> Component`'),
	p('A mobile responsive grid layout.  Child components are placed into rows.'),
	stack([
	  p("* `padding`: padding amount between components"),
	  p("* `handleSurplusWidth`: splits surplus width among components in each row; see `sideBySide`"),
	  p("* `handleSurplusHeight`: splits surplus hegiht among grid rows; see `stack`"),
	  p("* `useFullWidth`: if set, the grid's min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components"),
	]),

	h3('overlays'),
	p('`overlays :: OverlaysConfig -> [Component] -> Component`'),
	p('Places components one directly on top of another.'),
	p('The OverlaysConfig is not currently used.'),

	h3('componentStream'),
	p('`componentStream :: Stream(Component) -> Component`'),
	p('Takes in a stream of components (using the hcj stream library), returns a component.'),
	p('Typical uses include:'),
	stack([
	  p("* showing ajax spinners and replacing them with content"),
	  p('* displaying a "live preview" as your user updates form fields.'),
	]),
  ]);

  var standardLibraryComponentModifiers = docStack([
	h2('Standard Library - Component Modifiers'),
	p('In addition to the layouts that take many components and return a component, there are many layouts that take only a single component and return a component.  Much styling and functionality can be added by applying these functions.'),

	h3('all'),
	p('`all :: [Component -> Component] -> Component -> Component`'),
	p('The `all` function is key.  It enables you to apply multiple functions to a component, one after another.'),
	p('Arguably, `all` should be renamed to `compose`.'),
	p('Example:'),
	codeBlock([
	  "var button = all([",
	  "  margin({",
	  "    all: 10,",
	  "  }),",
	  "  border(color.white, {",
	  "    all: 1,",
	  "  }),",
	  "])(text('Submit'));",
	]),
	p('Composition Example (notice that `all` applied to an array of functions is itself such a function):'),
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

	h3('margin'),
	p('`margin :: MarginConfig -> Component -> Component`'),
	p('Adds some space around a component.'),
	p('A `MarginConfig` may have any of the following properties:'),
	stack([
	  p("* all: margin to apply to all sides"),
	  p("* top: margin to apply to the top"),
	  p("* bottom: margin to apply to bottom"),
	  p("* left: margin to apply to the left side"),
	  p("* right: margin to apply to the right side"),
	]),

	h3('border'),
	p('`border :: Color -> BorderConfig -> Component -> Component`'),
	p('Adds a colored border around a component.'),
	p('A `Color` is an object with `r`, `g`, `b`, and `a` properties.  (see below)'),
	p('A `BorderConfig` may have any of the following properties:'),
	stack([
	  p("* all: border to apply to all sides"),
	  p("* top: border to apply to the top"),
	  p("* bottom: border to apply to bottom"),
	  p("* left: border to apply to the left side"),
	  p("* right: border to apply to the right side"),
	  p("* radius: border radius"),
	]),

	h3('crop'),
	p('Crops a component down to a proportion of its size.'),
	p('`crop :: CropConfig -> Component -> Component`'),
	p("A `CropConfig` can either be a number - which is treated as an object with an 'all' property of that value - or an object with any of the following properties:"),
	stack([
	  p("* all: crop percentage on all sides"),
	  p("* top: crop percentage from the top"),
	  p("* bottom: crop percentage from the bottom"),
	  p("* left: crop percentage from the left"),
	  p("* right: crop percentage from the right"),
	]),

	h3('linkTo'),
	p('`linkTo :: String -> Component -> Component`'),
	p('Takes a URL, then takes a component and wraps it in an `a` tag with that href.'),

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

	h3('withBackgroundColor'),
	p('`withBackgroundColor :: BackgroundColorConfig -> Component -> Component`'),
	p('A `BackgroundColorConfig` is an object with any of the following properties:'),
	stack([
	  p("* backgroundColor: background color"),
	  p("* fontColor: font color"),
	]),
  ]);

  var standardLibraryStreams = docStack([
	h2('Standard Library - Streams'),
	p("All programming is asynchronous.  There is the code that's run when your computer boots, and then there are interrupts."),
	p("The HCJ library provides its own slimy little stream implementation.  The reasons for choosing this over another implementation like Bacon or Reactive Extensions are speed and control over the stream semantics."),
	p("In this implementation, a stream is nothing more than a way to get the most recent available data from point A into point B.  A stream is an object with two properties:"),
	stack([
	  p("* lastValue: the most recent data point"),
	  p("* listeners: array of functions that are run when there is new data (private member, do not access)"),
	]),
	p('Streams can be defined both declaratively and imperatively in this library.  That is, you can let a stream be an operation applied to other streams, or you can let it be an empty stream and push to it.  Unlike in other stream implementations:'),
	stack([
	  p("* The last value is accessible, and may be read off in an imperative manner at your leisure."),
	  p("* If you push one value through a stream multiple times, it will only be hanlded the first time."),
	  p("* If you push multiple values through a stream quickly (synchronously), intermediate values may (and in the future, always will) be skipped."),
	]),
	p('So, the internal stream library is certainly not for aggregating financial transactions, but rather for maintaining output state as lightly as possible.'),
	p('Other stream libraries that you use in your application code will interoperate with HCJ just fine.'),
	p('TODO: finish stream documentation'),
  ]);

  var standardLibraryForms = docStack([
	h2('Standard Library - Forms'),
	p('TODO: add forms documentation'),
  ]);

  var standardLibraryColors = docStack([
	h2('Standard Library - Colors'),
	p('The standard library has a standard notation for colors.  A `Color` is an object with all of the following properties:'),
	stack([
	  p("* r: red value from 0 to 255"),
	  p("* g: green value from 0 to 255"),
	  p("* b: blue value from 0 to 255"),
	  p("* a: alpha value from 0 to 1"),
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

  var csIsNotAFunction = docStack([
	h2('cs is not a function'),
	p("The most common error message you're going to get using this library.  Very uninformative, sorry."),
  ]);

  var version2 = docStack([
	h2('Version 2'),
	p("Version 2 is in progress, and larger in scope.  Really it is a specification system for web pages.  Pages will instead be represented as JSON data structures, which are evaluated as code like what's described above."),
	p('Browsers can implement this specification as javascript code - again, based on actually measuring elements and positioning them through simple APIs.'),
	p('Servers can implement the specification as an HTML and CSS approximation, which leads to easy SEO and can lend itself to a decent UX as the page loads in.'),
	p('Attaching to page using DHTML instead of JS calls'),
  ]);

  var docs = docStack([
	h1('hcj.js'),
	p('Javascript library for web app frontend templating.  Monolithic, like Angular.'),
	install,
	whatsItLike,
	widthIsNotHeight,
	definingComponents,
	renderingComponents,
	definingLayouts,
	standardLibraryComponents,
	standardLibraryComponentModifiers,
	standardLibraryStreams,
	standardLibraryForms,
	standardLibraryColors,
	csIsNotAFunction,
	version2,
  ]);

  window.hcj.rootComponent(docs);
});
