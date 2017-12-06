$(function () {
  var hcj = window.hcj;

  var c = hcj.component;
  var casesplit = hcj.casesplit;
  var el = hcj.element;
  var forms = hcj.forms;
  var stream = hcj.stream;

  var stack = c.stack;
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
    red: hcj.color.create({
      r: 255,
      g: 0,
      b: 0,
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
      approximateHeight: true,
      family: 'sans-serif',
      size: 15,
    },
    code: {
      family: 'monospace',
      size: 15,
    },
  };

  // takes a string with backticks
  // outputs a text config
  var processBackticks = function (str) {
    if (!str.split) {
      // TODO: process backticks when str is a stream
      return str;
    }
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
  var h1m = text([font.h1, {
    measureWidth: true,
  }]);
  var h2 = text(font.h2);
  var h2m = text([font.h2, {
    measureWidth: true,
  }]);
  var h3 = text(font.h3);
  var h3m = text([font.h3, {
    measureWidth: true,
  }]);
  var p = text(font.p);
  var pm = text([font.p, {
    measureWidth: true,
  }]);
  var codeBlock = function (strs) {
    return c.wrap('pre')(stack(strs.map(function (str) {
      return c.text(str, font.code);
    })));
  };
  var showCodeBlock = function (strs) {
    var shownS = stream.once(false);
    return c.all([
      c.margin({
        left: 20,
      }),
    ])(c.stack([
      c.all([
        c.link,
        c.clickThis(function () {
          stream.push(shownS, !shownS.lastValue);
        }),
      ])(p({
        str: stream.map(shownS, function (shown) {
          return shown ? '[hide code]' : '[show code]';
        }),
      })),
      c.toggleHeight(shownS)(codeBlock(strs)),
    ]));
  };

  var install = docStack([
    p("`git clone https://github.com/hcj-js/hcj.git`"),
    p("Use the files in the dist folder."),
  ]);

  var introduction = docStack([
    p("HCJ.JS's purpose is element positioning.  Many website frameworks control <i>what</i> is displayed, but they do not let you specify <i>how</i> it is displayed."),
    p("A pure Javascript framework, HCJ does not require you to write any CSS or more than 15 lines of HTML.  HCJ websites are fast, easy to compose, mobile-responsive, and do the 'right thing' for absolutely free."),
    p("Components, HCJ's building block, are extraordinarily composable.  Any component at any level can be rendered as a web page, making debugging very simple.  They respond to the size and shape of the page region they are rendered into, so rearranging your page is as easy as copy and paste."),
  ]);

  var aLittleVocab = docStack([
    p("The `component` is the building block of the HCJ framework.  Components can be composed to create new components, or rendered as web pages."),
    p("A component technically is a function taking a `context` and returning an `instance`.  The `context` and the `instance` give the page area that a component is rendered into, and the minimum dimensions of the component, respectively."),
    p("The `context` is an object that has all of the following properties.  $el is a JQuery object, and the rest are HCJ streams:"),
    stack([
      p("&#8226; `$el`: Parent element of the instance."),
      p('&#8226; `width`: Width available to the instance.'),
      p('&#8226; `height`: Height available to the instance.'),
      p('&#8226; `left`: Left position of the instance.'),
      p('&#8226; `top`: Top position of the instance.'),
      p('&#8226; `leftOffset`: Left position of \"$el\" relative to the page.'),
      p('&#8226; `topOffset`: Top position of \"$el\" relative to the page.'),
    ]),
    p('When a component is passed a context, it must create an element and append it to $el, but it does not need to size and position itself.  That is done by its parent layout.  The properties `width`, `height` and so on are provided so that it can size and position its children.'),
    p('The `instance` is an object with the following properties:'),
    stack([
      p('&#8226; `$el`: Root element of the instance.'),
      p('&#8226; `minWidth`: Gives the instance\'s minimum width.'),
      p('&#8226; `minHeight`: Gives the instance\'s minimum height.'),
      p("&#8226; `remove()`: Removes the instance."),
    ]),
    p('The instances\'s `minWidth` and `minHeight` are both streams: minWidth a stream of numbers specifying the minimum width required by the instance to display sanely, and because the height of a component may depend on the width it is given, minHeight a stream of functions that, given a hypothetical width, specify the height required by the instance at that width.'),
    p("In HCJ terminology, a `layout` is a function that takes one or more components and returns a component.  A `style` is a function that takes exactly one component and returns a component.  Therefore, all styles are layouts."),
    p("Here is a drawing with a component shown in blue and its context shown in red:"),
    c.all([
      c.alignHLeft,
    ])(c.image({
      src: './context.png',
      alt: 'Graphic depicting HCJ context attributes',
    })),
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
    p("We provide a handy `hcj.component.component` function for defining components.  It takes two arguments, an optional tag name (which defaults to 'div') and a `build` method, and returns a component."),
    p("`component : (Maybe String, BuildComponent) -> Component`"),
    stack([
      p("`type BuildComponent = (JQuery, Context) -> {minWidth, minHeight, onRemove}`"),
    ]),
    p("The build method initializes the component and indicates its minimum dimensions.  It is passed two arguments: `$el`, the created root element of the component (as a jquery object), and `context`, the context as it was passed into the component."),
    p("It returns an object with `minWidth` and `minHeight` properties, and an optional `onRemove` property.  The `minWidth` and `minHeight` properties are streams of numbers, and streams of functions from numbers to numbers, respectively.  Any returned `onRemove` function will be called when the instance's `remove` function is called."),
    p("To measure elements' minimum sizes, HCJ provides `hcj.measure.width` and `hcj.measure.height`.  These functions take JQuery selectors of elements, and return numbers and functions from numbers to numbers, respectively.  They clone the element, attach the clone to a sandbox, set a couple CSS properties, measure it, remove the clone, and return the size."),
    h3("Example:"),
    codeBlock([
      "// component for the imaginary SomeCaptcha",
      "&nbsp;",
      "var c = window.hcj.component;",
      "var stream = window.hcj.stream;",
      "&nbsp;",
      "var captcha = c.component(function ($el, context) {",
      "  var minWidthS = stream.once(hcj.measure.width($el));",
      "  var minHeightS = stream.once(hcj.measure.height($el));",
      "  var someCaptcha = SomeCaptcha.render($el).then(function () {",
      "    stream.push(minWidthS, hcj.measure.width($el));",
      "    context.onRemove(function () {",
      "      someCaptcha.remove();",
      "    });",
      "  });",
      "  return {",
      "    minWidth: minWidthS,",
      "    minHeight: minHeightS,",
      "  };",
      "});",
    ]),
  ]);

  var renderingComponents = docStack([
    p('Here is a minimal HCJ page:'),
    codeBlock([
      "&lt;!DOCTYPE HTML&gt;",
      "&lt;html&gt;",
      "    &lt;head&gt;",
      "        &lt;title&gt;Hcj Demo&lt;/title&gt;",
      "        &lt;link rel=\"stylesheet\" type=\"text/css\" href=\"hcj.css\"&gt;",
      "    &lt;/head&gt;",
      "    &lt;body&gt;",
      "        &lt;script src=\"https://code.jquery.com/jquery-3.1.0.js\"&gt;&lt;/script&gt;",
      "        &lt;script src=\"hcj.min.js\"&gt;&lt;/script&gt;",
      "&nbsp;",
      "        &lt;script&gt;",
      "         var page = hcj.component.text('Hello World');",
      "         var rootInstance = hcj.rootComponent(page);",
      "        &lt;/script&gt;",
      "    &lt;/body&gt;",
      "&lt;/html&gt;",
    ]),
    p("This page includes three files: `hcj.css`, `jquery.js`, and `hcj.js`, along with your user script.  The hcj.css file contains a CSS reset, along with some other settings needed by the HCJ framework.  JQuery is a dependency of HCJ.  (See <a href=\"https://github.com/hcj-js/hcj/issues/1\">this issue</a>).  And the hcj.js file, of course, contains all of the HCJ framework code.  This file must be included in the body section, not the head section, because it needs the body element to be present for some internal initialization."),
    p("To render a component, pass it to the `hcj.rootComponent` function.  Rendering components inside any smaller region of the page is not currently supported.  Multiple root components may be used if you wish, to display some modal dialogs."),
    p("Font loading is a particular issue for HCJ websites.  Because fonts can change the size taken up by text, text-based components must update their minimum dimensions after fonts are loaded.  It is an unfortunate reality that there are no DOM callbacks that are run when fonts are loaded, so HCJ is shipped with a `window.waitForWebfonts` function.  We recommend that you use this function to run your user script after webfonts are loaded."),
    p("This `waitForWebfonts` function takes three arguments: an array of font families to wait for (these should be defined using @font-face CSS rules), a callback to run when they are all loaded, and an optional max time to wait in the event that a font never loads, which defaults to 10 seconds."),
  ]);

  var definingLayouts = docStack([
    p("The `hcj.component.container` method is for defining layouts and other containers.  It takes an optional string argument giving its tag name, followed by a build method."),
    p("`container : (Maybe String, BuildContainer) -> Component`"),
    p("`type BuildContainer = (JQuery, Context, Append) -> {minWidth, minHeight, onRemove}`"),
    p("`type Append = (Component, Viewport, Maybe) -> Instance`"),
    p("The build method takes three arguments.  The first two, `$el` and `context`, are passed through from the `component` call that is made internally.  The third argument, `append`, is a function used to append child components to the container."),
    p("The `append` function takes three arguments: the `component` to append, a `viewport`, and a `noPositionChildren` flag."),
    p("The append function's `viewport` argument is an object that is enriched into a `context` and then passed into the append function's `component` argument.  It has the following optional properties:"),
    stack([
      p("&#8226; `$el`: Element to append instance to.  Defaults to the container's root element."),
      p("&#8226; `width`: Stream giving the width of the viewport.  Defaults to container width."),
      p("&#8226; `height`: Stream giving the height of the viewport.  Defaults to container height."),
      p("&#8226; `left`: Stream giving the left coordinate of the viewport.  Defaults to 0."),
      p("&#8226; `top`: Stream giving the top coordinate of the viewport.  Defaults to 0."),
      p("&#8226; `widthCss`: Stream of string values to use to the 'width' property.  Needed for CSS transitions to work correctly.  Defaults to mapping (+ 'px') over the viewport's `width`, or '100%'."),
      p("&#8226; `heightCss`: Stream of string values to use to the 'height' property.  Needed for CSS transitions to work correctly.  Defaults to mapping (+ 'px') over the viewport's `height`, or '100%'."),
      p("&#8226; `topCss`: Stream of string values to use to the 'top' property.  Needed for CSS transitions to work correctly.  Defaults to mapping (+ 'px') over the viewport's `top`, or '0px'."),
      p("&#8226; `leftCss`: Stream of string values to use to the 'left' property.  Needed for CSS transitions to work correctly.  Defaults to mapping (+ 'px') over the viewport's `left`, or '0px'."),
    ]),
    p("If the `noPositionChildren` flag is not undefined, then the child component's `top`, `width`, `left`, and `height` properties will not be set to the CSS values described above.  Indeed, you can write an HCJ container that positions elements using flexbox, as long as it correctly indicates their contexts given its context, as well as its minimum dimensions given theirs."),

    h2('Example - Top Margin'),
    p('`someLayout :: Component -> Component`'),
    p("Here is an example of a layout that pushes its content down by five pixels.  To do this, it creates a viewport with a `top` stream, and returns a min size with a `minHeight` that is increased by five pixels."),
    codeBlock([
      "var c = hcj.component",
      "&nbsp;",
      "var someLayout = function (c) {",
      "  return c.container(function ($el, ctx, append) {",
      "    var instance = append(c, {",
      "      top: stream.create(5),",
      "    });",
      "    return {",
      "      minWidth: instance.minWidth,",
      "      minHeight: stream.map(instance.minHeight, function (mh) {",
      "        return function (w) {",
      "          return mh(w) + 5;",
      "        };",
      "      })",
      "    };",
      "  });",
      "};",
    ]),

    h2('Example - Purple Background'),
    p('`purpleBackground :: Component -> Component`'),
    p("Imagine we want to define a layout that adds a 10px margin and gives a component a purple background.  Here's how we can do it:"),
    codeBlock([
      "var purpleBackground = function (c) {",
      "  return c.container(function ($el, context, append) {",
      "    $el.css('background-color', '#FF00FF');",
      "  &nbsp;",
      "    var instance = append(c, {",
      "      width: stream.map(context.width, function (w) {",
      "        return w - 20;",
      "      }),",
      "      height: stream.map(context.height(function (h) {",
      "        return h - 20;",
      "      }),",
      "      top: stream.once(10),",
      "      left: stream.once(10),",
      "    });",
      "  &nbsp;",
      "    return {",
      "      minWidth: stream.map(instance.minWidth, function (mw) {",
      "        return mw + 20;",
      "      }),",
      "      minHeight: stream.map(instance.minHeight, function (mh) {",
      "        return function (w) {",
      "          return mh(w - 20) + 20;",
      "        };",
      "      }),",
      "    };",
      "  });",
      "};",
    ]),

    h2('Example - Simple Stack'),
    p("`stack :: Array(Component) -> Component`"),
    p("Say we want to put components into a vertical stack."),
    p("In this code, first we map over the components argument to initialize an array of viewports, and an array of instances.  Next, we use the HCJ stream library to combine some streams together so that every time the stack's context changes or an appended component's min size changes, positions are recalculated and pushed into the viewports.  Last, we let the min width of the stack be the max of the min widths of the child components, and the min height be the sum of the min heights of the child components."),
    codeBlock([
      "var stack = function (cs) {",
      "  return c.container(function ($el, context, append) {",
      "    var viewports = [];",
      "    var instances = [];",
      "    cs.map(function (c, index) {",
      "      var viewport = {",
      "        top: stream.create(),",
      "        height: stream.create(),",
      "      };",
      "      viewports.push(viewport);",
      "      instances.push(append(c, viewport));",
      "    });",
      "  &nbsp;",
      "    var minWidthsS = stream.all(instances.map(function (i) {",
      "      return i.minWidth;",
      "    }));",
      "    var minHeightsS = stream.all(instances.map(function (i) {",
      "      return i.minHeight;",
      "    }));",
      "  &nbsp;",
      "    stream.combine([",
      "      context.width,",
      "      context.height,",
      "      minHeightsS,",
      "    ], function (w, h, mhs) {",
      "      var top = 0;",
      "      mhs.map(function (mh, index) {",
      "        var viewport = viewports[index];",
      "        var height = mh(w);",
      "        stream.push(viewport.top, top);",
      "        stream.push(viewport.height, height);",
      "        top += h;",
      "      });",
      "    });",
      "  &nbsp;",
      "    return {",
      "      minWidth: stream.map(minWidthsS, function (mws) {",
      "        return mws.reduce(function (a, b) {",
      "          return Math.max(a, b);",
      "        }, 0);",
      "      }),",
      "      minHeight: stream.map(minHeightsS, function (mhs) {",
      "        return function (w) {",
      "          return mhs.map(function (mh) {",
      "            return mh(w);",
      "          }).reduce(function (a, b) {",
      "            return a + b;",
      "          }, 0);",
      "        };",
      "      }),",
      "    };",
      "  });",
      "};",
    ]),
  ]);

  var standardLibraryElements = docStack([
  ]);

  var standardLibraryComponents = docStack([
    p('Here are the basic components that ship with hcj.js.'),
    p('These are all properties of the `window.hcj.component` object.  Below each, there is an informal, Haskell-esque "type signature" showing the parameters that each function can take.'),

    h2('text'),
    p('`text :: (Maybe TextConfig; SpanConfig | [SpanConfig]) -> Component`'),
    p('The `text` function takes two arguments.  The first is an optional `TextConfig`.  The second is either a single `SpanConfig` or an array of `SpanConfigs`.'),
    p('By default, a text component is given a minimum width of 300px, and its minimum height function measures the height of the element.  These can be changed using the `TextConfig` object.'),
    p('A `SpanConfig` may be either a string, or an object with the following properties (all optional except `str` which is required):'),
    stack([
      p("&#8226; `str`: The text to show."),
      p("&#8226; `size`: Font size."),
      p("&#8226; `weight`: Font weight."),
      p("&#8226; `family`: Font family."),
      p("&#8226; `color`: Font color (as an object with `r`, `g`, `b`, and `a` properties)."),
      p("&#8226; `shadow`: Font shadow."),
      p("&#8226; `spanCSS`: Array of objects with `name` and `value` properties.  Additional CSS styles to apply to the span."),
      p("&#8226; `lineHeight`: Line height of the text span.")
    ]),
    p('The `TextConfig` applies globally to all spans within the text component.  It can have all of the same properties as a `SpanConfig`, minus `str`, plus some additional properties:'),
    stack([
      p("&#8226; `align`: Text align."),
      p("&#8226; `minWidth`: Specifies the min width of the text component, overriding 300px default."),
      p("&#8226; `measureWidth`: If set, the text element is measured and its measurement becomes its min width, overriding 300px default."),
      p("&#8226; `minHeight`: Specifies the min height of the text component as a constant number, overriding `measureHeight` default."),
      p("&#8226; `oneLine`: Declares that the text component is always one line tall.  Its min height is calculated from its font size and line height, overriding `measureHeight` default."),
    ]),
    p('The `text` function can optionally be curried.  That is, if you pass it ONLY a `TextConfig`, it returns a function accepting a single `SpanConfig` or an array of `SpanConfigs`.'),
    h3('Examples:'),
    c.text('Hello'),
    showCodeBlock([
      "var c = window.hcj.component;",
      "return c.text('Hello');",
    ]),
    c.text({
      size: '10px',
    })('hello'),
    showCodeBlock([
      "var c = window.hcj.component;",
      "var smallText = c.text({size: '10px'});",
      "return smallText('hello');",
    ]),
    c.text([{
      str: 'BOLD',
      weight: 'bold',
    }, {
      str: '_MONO',
      family: 'Monospace',
    }]),
    showCodeBlock([
      "var c = window.hcj.component;",
      "return c.text([{",
      "  str: 'BOLD',",
      "  weight: 'bold',",
      "}, {",
      "  str: '_MONO',",
      "  family: 'Monospace',",
      "}]);",
    ]),

    h2('image'),
    p('`image :: ImageConfig -> Component`'),
    p('Creates an image component.  By default, an image\'s minimum width is its native width, and its minimum height function attempts to maintain its aspect ratio.'),
    p("An `ImageConfig` may have the following properties, all optional except `src` which is required."),
    stack([
      p("&#8226; `src`: image source"),
      p("&#8226; `alt`: alt text"),
      p("&#8226; `minWidth`: if present, min width is set to this number instead of the image's natural width"),
      p("&#8226; `minHeight`: if present, min width of image is set to the quotient of this number and the image's aspect ratio"),
    ]),
    p('Note: When an image is placed into a context whose proportions are not the image\'s aspect ratio, it will stretch.  The most common solution is to wrap images with the `hcj.component.keepAspectRatio` layout.'),

    h2('bar.h, bar.v, and rectangle'),
    stack([
      p('`bar.h :: Number -> Component`'),
      p('`bar.v :: Number -> Component`'),
      p('`rectangle :: {[h, x]: Number, [v, y]: Number} -> Component`'),
    ]),
    p("`bar.h` and `bar.v` create horizontal and vertical separators of the size you specify.  `rectangle` takes an object with `h` and `v` or `x` and `y` properties, and creates a rectangle of that size."),

    h2('empty'),
    stack([
      p('`empty :: String -> Component`'),
      p('`nothing :: Component`'),
    ]),
    p('The `empty` function takes a tag name and returns a component with zero width and zero height using that tag name.'),
    p('The `nothing` component is defined as `empty("div")`.'),
  ]);

  var standardLibraryLayouts = docStack([
    p('Here are the hcj.js layouts.  Some take optional configuration objects.  These can be called either curried or not, i.e. you can pass in only the config object and receive a function from components to components.'),
    p('These are found in the `window.hcj.component` object.'),

    h2('alignHorizontal, alignH, alignLRM'),
    stack([
      p('`alignHorizontal :: {l: Component, r: Component, m: Component} -> Component`'),
      p('`alignHLeft :: Component -> Component`'),
      p('`alignHRight :: Component -> Component`'),
      p('`alignHMiddle :: Component -> Component`'),
    ]),
    p('Takes an object with `l`, `r`, and/or `m` properties.  Aligns components left, right, and middle.'),
    p('Example:'),
    codeBlock([
      "var c = window.hcj.component;",
      "&nbsp;",
      "var logo = c.image({src: 'logo.png'});",
      "var menu = c.text('menu');",
      "&nbsp;",
      "var header = c.alignH({",
      "  l: logo,",
      "  r: menu,",
      "});",
    ]),

    h2('alignVertical, alignV, alignTBM'),
    stack([
      p('`alignVertical :: {t: Component, b: Component, m: Component} -> Component`'),
      p('`alignVTop :: Component -> Component`'),
      p('`alignVBottom :: Component -> Component`'),
      p('`alignVMiddle :: Component -> Component`'),
    ]),
    p('Takes up to three components.  Aligns them top, bottom, and middle within the space available.  Three functions are also provided that operate on just one component each.'),

    h2('componentStream'),
    stack([
      p('`componentStream :: Stream(Component) -> Component`'),
      p('`promiseComponent :: (Promise(Component), Component) -> Component`'),
    ]),
    p('`componentStream` takes an hcj stream of components and returns a component that displays the latest one.'),
    p('`promiseComponent` takes a promise that resolves to a component and an optional initial component to display, and returns a corresponding componentStream.'),

    h2('grid'),
    p('`grid :: GridConfig -> Array(Component) -> Component`'),
    p('A responsive grid layout.  Components are placed into rows.'),
    stack([
      p("&#8226; `padding`: padding amount between components"),
      p("&#8226; `surplusWidthFunc`: splits surplus width among components in each row; see `sideBySide`"),
      p("&#8226; `surplusHeightFunc`: splits surplus hegiht among grid rows; see `stack`"),
      p("&#8226; `useFullWidth`: if set, the grid's min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components"),
    ]),

    h2('keepAspectRatio'),
    p('`keepAspectRatio :: KeepAspectRatioConfig -> Component -> Component`'),
    p('Behaves much like the `background` CSS property.'),
    p("Positions a component in a space, maintaining its aspect ratio.  Will exhibit strange behavior when the child component's aspect ratio is not constant."),
    p('A `KeepAspectRatioConfig` may have any of the following properties:'),
    stack([
      p("&#8226; fill: If set, the child component covers the space and may be cropped.  If not set, the child component is contained within the space and there may be margins."),
      p("&#8226; top: If set, the top of the child component is aligned with the top of the keepAspectRatio component."),
      p("&#8226; bottom: If set, the bottom of the child component is aligned with the bottom of the keepAspectRatio component."),
      p("&#8226; left: If set, the left of the child component is aligned with the left of the keepAspectRatio component."),
      p("&#8226; right: If set, the left of the child component is aligned with the left of the keepAspectRatio component."),
    ]),

    h2('largestWidthThatFits'),
    p('`largestWidthThatFits :: Array(Component) -> Component`'),
    p('Chooses the largest-width component that fits inside its own given width, among the components passed in.  (Currently will crash if none fit.)'),

    h2('overlays'),
    p('`overlays :: OverlaysConfig -> Array(Component) -> Component`'),
    p('Places components one directly on top of another.'),
    p('The OverlaysConfig is not currently used.'),

    h2('promiseComponent'),
    p('see componentStream'),

    h2('sideBySide'),
    p('`sideBySide :: SideBySideConfig -> Array(Component) -> Component`'),
    p('Puts components directly side by side.'),
    p('A `SideBySideConfig` may have the following properties:'),
    stack([
      p("&#8226; `padding`: Padding amount between components."),
      p("&#8226; `surplusWidthFunc`: Similar to a `stack`, a `sideBySide` can have surplus width.  A `surplusWidthFunc` function takes two arguments.  The first is the actual width of the `sideBySide`.  The second is an array of objects with `left` and `width` properties, giving the computed left coordinate and min width of each child within the stack.  It returns a new array of objects with `left` and `width` coordinates."),
    ]),

    h2('stack'),
    p('`stack :: StackConfig -> Array(Component) -> Component`'),
    p('Puts components in a stack, one on top of another.'),
    p('A `StackConfig` may have the following properties:'),
    stack([
      p("&#8226; `padding`: Padding amount between components."),
      p("&#8226; `surplusHeightFunc`: There can be surplus height, i.e. the actual height of the stack can be greater than the minimim heights of all of the children.  A `surplusHeightFunc` function takes two arguments.  The first argument is the actual height of the stack (in pixels).  The second argument is an array of objects with `top` and `height` properties, giving the computed top coordinate and min height of each child within the stack (in pixels).  It returns a new array of objects with `top` and `height` properties."),
    ]),
  ]);

  var standardLibraryComponentModifiers = docStack([
    p('While the layouts in the previous section take multiple components and return a component, layouts that take exactly one component and return a component, sometimes called `styles`, can add much customization and functionality.'),
    p('These styles are all properties of the `window.hcj.component` object.'),

    h2('all, compose'),
    p('`all :: Array(Component -> Component) -> Component -> Component`'),
    p('The `hcj.component.all` (aka `hcj.component.compose`) function is listed first because it is real good.  It performs function composition, i.e. applies multiple styles, one after another.'),
    p('Example:'),
    codeBlock([
      "var title = all([",
      "  margin({",
      "    all: 10,",
      "  }),",
      "  border(color.white, {",
      "    all: 1,",
      "  }),",
      "])(text('Text'));",
    ]),
    p('Example showing nesting:'),
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

    h2('$$, $addClass, $attr, $css, $on, $prop'),
    stack([
      p('`$$ :: ($ -> IO ()) -> Component -> Component`'),
      p('`$addClass :: String -> Component -> Component`'),
      p('`$attr :: (String, String) -> Component -> Component`'),
      p('`$css :: (String, String) -> Component -> Component`'),
      p('`$on :: (String, (Event -> IO ())) -> Component -> Component`'),
      p('`$prop :: (String, String) -> Component -> Component`'),
    ]),
    p('These methods demonstrate HCJ\'s jquery dependency.  Defined using `and`, `hcj.component.$$` takes a function of the JQuery selector of an instance.  The rest of these methods are simply defined in terms of `$$`.'),

    h2('and'),
    p('`and :: ((Instance, Context) -> IO ()) -> Component -> Component`'),
    p('The `hcj.component.and` function is a misc method that lets you operate on an instance each time a component is rendered.  It takes a function of an instance and a context, and it returns a function from a component to a component.  Example:'),
    codeBlock([
      "var turnBlue = and(function (i) {",
      "  i.$el.css('background-color', 'blue');",
      "});",
    ]),

    h2('backgroundColor'),
    p('`backgroundColor :: BackgroundColorConfig -> Component -> Component`'),
    p('Applies a background color and a font color to a component'),
    stack([
      p('A `BackgroundColorConfig` is an object or a stream of objects.  If it is an object, then its properties may be streams instead of single values.  In any case, it has the following properties:'),
      p("&#8226; background: background color"),
      p("&#8226; font: font color"),
      p("&#8226; backgroundHover: background color on hover"),
      p("&#8226; fontHover: font color on hover"),
    ]),

    h2('border'),
    p('`border :: Color -> BorderConfig -> Component -> Component`'),
    p('Adds a colored border around a component.'),
    p('A `Color` is an object with `r`, `g`, `b`, and `a` properties.  (see below)'),
    stack([
      p('A `BorderConfig` is an object with the following properties:'),
      p("&#8226; all: border to apply to all sides"),
      p("&#8226; top: border to apply to the top"),
      p("&#8226; bottom: border to apply to bottom"),
      p("&#8226; left: border to apply to the left side"),
      p("&#8226; right: border to apply to the right side"),
      p("&#8226; radius: border radius"),
    ]),

    h2('crop'),
    p('Crops a component down to a proportion of its size.'),
    p('`crop :: CropConfig -> Component -> Component`'),
    stack([
      p("A `CropConfig` can either be a number, which is treated as an object with an 'all' property of that value, or an object with any of the following properties:"),
      p("&#8226; all: crop percentage on all sides"),
      p("&#8226; top: crop percentage from the top"),
      p("&#8226; bottom: crop percentage from the bottom"),
      p("&#8226; left: crop percentage from the left"),
      p("&#8226; right: crop percentage from the right"),
    ]),

    h2('link'),
    p('`link :: Component -> Component`'),
    p('Applies a certain hover effect.'),

    h2('linkTo'),
    p('`linkTo :: LinkConfig -> Component -> Component`'),
    p('Wraps component it in an `a` tag with a particular href.'),
    stack([
      p('A `LinkConfig` is an object with the following properties:'),
      p("&#8226; href: href property (required)"),
      p("&#8226; target: link target"),
    ]),

    h2('margin, padding'),
    p('`margin :: MarginConfig -> Component -> Component`'),
    p('Adds some space around a component.'),
    stack([
      p('A `MarginConfig` may have any of the following properties:'),
      p("&#8226; all: margin to apply to all sides"),
      p("&#8226; top: margin to apply to the top"),
      p("&#8226; bottom: margin to apply to bottom"),
      p("&#8226; left: margin to apply to the left side"),
      p("&#8226; right: margin to apply to the right side"),
    ]),

    h2('minHeight'),
    p('`minHeight :: MinHeight -> Component -> Component`'),
    p('`minHeightAtLeast :: MinHeightAtLeast -> Component -> Component`'),
    p('Overrides the min height of a component.'),
    p('The `MinHeight` can be a function from numbers to numbers, a stream of functions from numbers to numbers, or a function that takes the `Instance` and `Context` and returns a stream of functions from numbers to numbers.'),
    p('minHeightAtLeast takes a number or a stream of numbers, and sets the min height of a component to be at least that great.'),

    h2('minWidth'),
    p('`minWidth :: MinWidth -> Component -> Component`'),
    p('`minWidthAtLeast :: MinWidthAtLeast -> Component -> Component`'),
    p('Overrides the min width of a component.'),
    p('The `MinWidth` can be a number, a stream of numbers, or a function that takes the `Instance` and `Context` and returns a stream of numbers.'),
    p('minWidthAtLeast takes a number or a stream of numbers, and sets the min width of a component to be at least that great.'),

    h2('onThis'),
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
    p('`onThis` is a curried form of the `$on` function.  Additional functions are also provided where it is called with its first argument.'),
  ]);

  var standardLibraryStreams = docStack([
    p("In order for nested elements to communicate dimensions with each other, a common stream interface is needed.  There is no native Javascript stream implementation, and for this kind of application certain performance characteristics are preferred, so HCJ specifies a stream interface to use, and also provides a grimy little implementation of it."),
    p("An hcj stream is an object with two properties:"),
    stack([
      p("&#8226; lastValue: the most recent data point"),
      p("&#8226; listeners: array of functions that are run when there is new data (private member, do not access)"),
    ]),
    p('Streams can be defined either declaratively or imperatively.  That is, you can let a stream be an operation applied to other streams, or you can just create it and push to it like a bus.  Unlike in other stream implementations:'),
    stack([
      p("&#8226; The most recent data point is accessible through the `lastValue` property, and may be read off at your leisure."),
      p("&#8226; If you push one value through a stream multiple times, it will only be hanlded the first time."),
      p("&#8226; If you push multiple values through a stream quickly (synchronously), intermediate values will be skipped."),
    ]),
    p('Note: to skip intermediate values, `setTimeout` calls are made.  When streams are defined in terms of each other, multiple `setTimeout` calls are made in sequence.  If you want to run some code after all stream operations are finished (e.g. after the page has finished rendering in response to some change), you must call `stream.defer` instead of `setTimeout`.  (Furthermore, when writing components and layouts, if you want to defer the execution of a block of code and then push to a stream, call `stream.next` instead of `setTimeout`.  Otherwise, `stream.defer` calls will not know to wait for your code.)'),

    p('Here are the stream functions.  These are all properties of the `window.hcj.stream` object:'),

    h2('combine'),
    p('`combine : ([Stream a, Stream b, ...], ((a, b, ...) -> x)) -> Stream x`'),
    p('Takes an array of streams, and a function.  Result stream applies the function to the latest values from all input streams.'),

    h2('combineInto'),
    p('`combine : ([Stream a, Stream b, ...], ((a, b, ...) -> x), Stream x) -> IO ()`'),
    p('Imperative form of `combine`.  Takes an array of streams, a function, and a target stream, and pushes all values into the target stream.'),

    h2('combineObject'),
    p('`combineObject : {x: Stream a, y: Stream b, ...} -> Stream {x: a, y: b, ...}`'),
    p('Takes an object whose properties are streams, returns a stream of objects.'),

    h2('create'),
    p('`create : Maybe a -> Stream a`'),
    p('Creates a stream, and initializes it using the optional argument passed in.  The `push` or `pushAll` functions can be used to push in additional points into the stream.'),
    p('Example:'),
    codeBlock([
      "var onceFiftyS = stream.create(50);",
    ]),

    h2('debounce'),
    p('`debounce : Stream a -> Number -> Stream a`'),
    p('Pushes to output stream no more quickly than the given number of milliseconds.'),

    h2('delay'),
    p('`delay : Stream a -> Number -> Stream a`'),
    p('Pushes to output stream after waiting the given number of milliseconds.'),

    h2('filter'),
    p('`filter : Stream a -> (a -> Bool) -> Stream a`'),
    p('Returns a stream that includes only the values for which the provided predicate returns something truthy.'),

    h2('fromPromise'),
    p('`fromPromise : Promise a -> a -> Stream a`'),
    p('Takes a promise, and an optional initial value.  Returns a stream (optionally initialized with the initial value), which receives the value from the promise when it resolves.'),

    h2('map'),
    p('`map : Stream a -> (a -> b) -> Stream b'),
    p('Applies a function to each data point of a stream.'),
    p('Example:'),
    codeBlock([
      "var centsS = stream.create();",
      "var dollarAmountS = stream.map(centsS, function (cents) {",
      "  return Math.floor(cents / 100) + '.' + (cents % 100);",
      "})",
    ]),

    h2('promise'),
    p('`promise : Stream a -> Promise a`'),
    p('Returns a promise that resolves as soon as there is a data point in the stream.'),

    h2('prop'),
    p('`prop : Stream {x: a} -> ("x" : String) -> Stream a`'),
    p('Maps over a stream of objects, accessing the specified key.  That type signature uses some made-up notation for polymorphic row types.'),

    h2('push'),
    p('`push : Stream a -> a -> IO ()`'),
    p('Pushes a value onto a stream.'),
    p('Example:'),
    codeBlock([
      "var clickS = stream.create();",
      "$el.on('click', function (ev) {",
      "  stream.push(clickS, ev)",
      "})",
    ]),

    h2('pushAll'),
    p('`pushAll : Stream a -> Stream a -> IO ()`'),
    p('Pushes all values from one stream onto another stream.'),
    p('Example:'),
    codeBlock([
      "var sourceS = stream.create();",
      "var targetS = stream.create();",
      "stream.pushAll(sourceS, targetS);",
    ]),

    h2('reduce'),
    p('`reduce : Stream a -> (b -> a -> b) -> b -> Stream b'),
    p('Applies a function to each data point of a stream, keeping a running total.  Like array reduce, but the reduce callback has the orders of the arguments reversed.'),
    p('Example:'),
    codeBlock([
      "var clickS = stream.create();",
      "var countClicksS = stream.reduce(clickS, function (x)",
      "  return x + 1;",
      "}, 0);",
    ]),

    h2('splitObject'),
    p('`splitObject : {x: a, y: b, ...} -> {x: Stream a, y: Stream a, ...}`'),
    p('Takes an object, returns an object where each property is a stream initialized with the value from the input object.'),
  ]);

  var standardLibraryForms = docStack([
    p("Hcj takes the liberty of providing some reactive form components."),

    h2('fieldType'),
    p('The object `window.hcj.forms.fieldType` is used for specifying form types.  Intuitively, a form type determines both the type that the user inputs, and the form element\'s logical internal type.  An HCJ form component maintains a stream of the latter type, pushing to it and/or updating the user-facing values of the former type(s).'),
    p('Its values are the form type constructors.  These are either literally form types, or functions that take some parameters and return form types.  A form type is a row type, an object with at least a `type` property tagging the form type, and optionally extra properties determined by the tag.'),
    p('Here are the form type constructors, with demos:'),
    c.stream(0, function (s) {
      return docStack([
        h3('button'),
        pm('`button : (String, (Event, Stream, Disable) -> IO ()) -> FormType`'),
        p('Takes a button title and an onClick handler, and returns a button FormType.  The onClick handler receives the click event, the form element\'s stream for pushing to, and a `disable` function, which "disables" the button and returns an `enable` function, which re-enables the button.  Click events will only be processed if the button is enabled.  The returned FormType has three extra properties: `enabledS`, a boolean stream that tells whether the button is enabled and which you may push to, as well as `name` and `onClick`, the passed-in values.'),
        p('The demo pushes 1 + the stream\'s last value onto the stream each time the button is pressed.  It also disables the button for a while.'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.button('button', s, forms.fieldType.button('Button', function (ev, s, disable) {
            var enable = disable();
            stream.push(s, 1 + (s.lastValue || 0));
            setTimeout(function () {
              enable();
            }, 1000);
          }))),
          c.componentStream(stream.map(s, function (str) {
            return p(str + ' presses');
          })),
        ]),
      ]);
    }),
    c.stream(false, function (s) {
      return docStack([
        h3('checkbox'),
        pm('`checkbox : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.checkbox('checkbox', s)),
          c.componentStream(stream.map(s, function (checked) {
            return p(checked ? 'checked' : 'unchecked');
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('date'),
        pm('`date : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.date('date', s)),
          c.componentStream(stream.map(s, function (d) {
            return p(d + '');
          })),
        ]),
      ]);
    }),
    c.stream('a', function (s) {
      return docStack([
        h3('dropdown'),
        pm('`dropdown : Array({name: String, value: String}) -> FormType`'),
        p('Takes an array of objects with `name` and `value` properties giving the options\' names and values.'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.dropdown('dropdown', s, forms.fieldType.dropdown([{
            name: 'A',
            value: 'a',
          }, {
            name: 'B',
            value: 'b',
          }]))),
          c.componentStream(stream.map(s, function (v) {
            return p(v);
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('image'),
        pm('`image : FormType`'),
        p('File with accept="image/*".  Will be changed to `file` function by hcj version 1.0.'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.image('image', s)),
          c.componentStream(stream.map(s, function (file) {
            return file ? c.all([
              c.alignHLeft,
            ])(c.image({
              src: file,
            })) : c.nothing;
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('number'),
        pm('`number : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.number('number', s)),
          c.componentStream(stream.map(s, function (number) {
            return p(number + '');
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('password'),
        pm('`password : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.password('password', s)),
          c.componentStream(stream.map(s, function (password) {
            var str = '';
            if (password) {
              for (var i = 0; i < password.length; i++) {
                str += '*';
              }
            }
            return p(str);
          })),
              ]),
              ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('radios'),
        pm('`radios : Array(String) -> FormType`'),
        p('Takes an arrary of strings giving the buttons\' unique values.'),
        stack([
          c.all([
            c.alignHLeft,
          ])(stack(forms.formComponent.radios('radios', s, forms.fieldType.radios(['first', 'second'])))),
          c.componentStream(stream.map(s, function (v) {
            return p(v || '');
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('text'),
        pm('`text : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.text('text', s)),
          c.componentStream(stream.map(s, function (v) {
            return p(v || '');
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('textarea'),
        pm('`textarea : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.textarea('textarea', s)),
          c.componentStream(stream.map(s, function (v) {
            return v ? docStack(v.split(/[\r\n]+/).map(p)) : c.nothing;
          })),
        ]),
      ]);
    }),
    c.stream(null, function (s) {
      return docStack([
        h3('time'),
        pm('`time : FormType`'),
        stack([
          c.all([
            c.alignHLeft,
          ])(forms.formComponent.time('time', s)),
          c.componentStream(stream.map(s, function (v) {
            return p(v || '');
          })),
        ]),
      ]);
    }),

    h2('formComponent'),
    p('`formStyle.text : (String, Stream, FieldType) -> Component`'),
    p("The `window.hcj.forms.formComponent` object has exactly the same keys as `window.hcj.forms.fieldType`.  Its values are functions that take parameters and return form inputs.  These parameters are the name/id of the element, the value stream, and the form type if needed."),
    p("Note: the `window.hcj.forms.formComponent.radios` function returns not one component but an array of components."),
    p("Example:"),
    codeBlock([
      "var dropdownFormType = forms.fieldType.dropdown([{",
      "  name: 'A',",
      "  value: 'a',",
      "}, {",
      "  name: 'B',",
      "  value: 'b',",
      "}]));",
      "var dropdown = forms.formComponent.dropdown('dropdown', stream.create(), dropdownFormType);",
    ]),

    h2('formStyle'),
    p('`formStyle.text : (String, String, Stream, FieldType) -> (Component -> Component)`'),
    p("The `window.hcj.forms.formStyle` object has exactly the same keys as `window.hcj.forms.fieldType`.  Its values are functions that take four paramaters: a field name, the name/id attribute, a stream, and an optional form type.  They return styles that should be applied to the `formComponent` output values."),
    p("Note: the `window.hcj.formStyle.radios` function returns not a style, but a layout taking the entire array of radio buttons."),
    p("Example:"),
    codeBlock([
      "var text = forms.formComponent.text();",
      "var labeledText = forms.formStyle('Field Name')(text);",
    ]),

    h2('formFor'),
    p("The `formFor` is a large curried function for generating forms.  It takes multiple parameters, and then returns a component."),
    p("First, it takes a `submitButtonFormTypeF` argument and a `formComponent` argument.  The `submitButtonFormTypeF` argument is a function that, when called, returns a form type to use for the submit button.  You can pass in `hcj.forms.fieldType.button` and `hcj.forms.formComponent`, or you can add additional properties to those objects corresponding to your form types first."),
    p("Second, `types` the data model and optionally `names` the field names.  The first parameter `types` is an object whose values are form types.  The second parameter `names` is an object whose values are strings - except for `radio`, in which case the value must be an object with a String `name` property and an Array(String) `options` property."),
    p("Third, it takes an optional `default` object giving default values.  This object should have the same keys as `types` and `names` - these keys are also used as the name/id of the form inputs."),
    p("Fourth, it takes a `mkOnSubmit` method.  This method sets up the submit behavior of the form.  It is passed two parameters: an object of streams streams, and a `disable` method.  The streams object has the same keys as the `types`, `names`, and `defaults` objects, and its values are the streams of form values.  The `disable` method works like the button disable method, disabling the submit button.  The `mkOnSubmit` method should return an object with two properties: `onSubmit` and optionally `resultS`.  The `onSubmit` property is the onSubmit function of the form.  Typical usage might be to inspect the `lastValue` properties of the streams and then make an ajax request.  The optional `resultS` property is the error state of the form."),
    p("Fifth, it takes a `formStyle` object.  This can be `hcj.forms.formStyle`, or your own object using the same API."),
    p("Sixth and last, it takes `f`, the form constructor.  This function takes four parameters.  First is `streams`, the same streams object passed into `mkOnSubmit`.  Second is `inputs`, an object whose keys are the same as the `types`, `names`, `defaults`, etc. objects, and whose values are the input components.  Third is `submit`, a function that takes a string name and returns a submit button component using that button name.  Fourth is `resultS`, the error state stream.  The form constructor returns a component.  The form constructor is immediately applied, and the component is returned."),
    p("So, after six sets of parentheses, `formFor` returns a component."),
    p('Example: Edit Profile Form'),
    codeBlock([
      "var formFor = window.hcj.forms.formFor(window.hcj.forms.fieldType.button, window.hcj.forms.formComponent);",
      "var profileForm = formFor({",
      "  name: fieldType.text,",
      "  imageUrl: fieldType.image,",
      "  email: fieldType.text,",
      "  description: fieldType.textarea,",
      "  phone: fieldType.text,",
      "  address_1: fieldType.text,",
      "  address_2: fieldType.text,",
      "  website: fieldType.text,",
      "}, {",
      "  name: 'Name',",
      "  imageUrl: 'Upload Profile Picture',",
      "  email: 'Email',",
      "  description: 'Description',",
      "  phone: 'Phone',",
      "  address_1: 'Address 1',",
      "  address_2: 'Address 2',",
      "  website: 'Website',",
      "})()(function (streams) {",
      "  return {",
      "    onSubmit: function (ev) {",
      "      ev.preventDefault();",
      "      db.profile.insertOrUpdate(profile, {",
      "        user: me._id,",
      "        name: streams.name.lastValue,",
      "        imageUrl: imageUrl,",
      "        email: streams.email.lastValue,",
      "        description: streams.description.lastValue,",
      "        phone: streams.phone.lastValue,",
      "        address_1: streams.address_1.lastValue,",
      "        address_2: streams.address_2.lastValue,",
      "        website: streams.website.lastValue,",
      "      }).then(function () {",
      "        window.location = '/profile/' + me._id;",
      "      });",
      "    },",
      "  };",
      "})(prettyFormStyle)(function (streams, inputs, submit) {",
      "  return c.stack({",
      "    padding: 20,",
      "  })([",
      "    c.text('Edit Profile', fonts.h1),",
      "    inputs.name,",
      "    inputs.imageUrl,",
      "    inputs.email,",
      "    inputs.description,",
      "    inputs.phone,",
      "    inputs.address_1,",
      "    inputs.address_2,",
      "    inputs.website,",
      "    c.alignLRM()({",
      "      l: submit('Save'),",
      "    }),",
      "  ]);",
      "})",
    ]),
    p('Happy Profile Editing'),
  ]);

  var standardLibraryColors = docStack([
    p('HCJ has a standard notation for colors.  A `Color` is an object with all of the following properties:'),
    p('These functions are found in `window.hcj.color'),
    stack([
      p("&#8226; r: red value from 0 to 255"),
      p("&#8226; g: green value from 0 to 255"),
      p("&#8226; b: blue value from 0 to 255"),
      p("&#8226; a: alpha value from 0 to 1"),
    ]),

    h2('color'),
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

    h2('colorString'),
    p('`Color` destructor.  Takes a color, returns string using rgba format.'),
  ]);

  var standardLibraryJso = docStack([
    p("Jso"),
    p("Jso is a functional programming language for expressing websites."),
    p("Why a programming language?  Because currently multiple languages and programming styles are required to build websites.  While ReactJS can be rendered both client side and server side in some advanced ways, most javascript frameworks must be combined with server side templates.  Additionally, CSS must usually be written."),
    p("The Jso language is very basic.  It does not have a syntax.  You write Jso expression trees in a language of your choice, such as JSON."),
    p("In other words (and ignore this bit if it does not make sense), when you point to a file and say that it is a Jso program, you must have a Jso interpreter in mind that can read the file as Jso and execute it."),
    p("The key innovation of Jso is that a Jso program has two sets of semantics simultaneously, i.e. two interpretations.  It has both server side semantics and client side semantics.  Any new kind of Jso functionality that you add, you must implement twice: once on the server and once on the client."),
    h2("Jso Types"),
    p("Jso is a dynamically typed language; types are not declared in Jso programs.  However, types are as core a concept as in any language.  A Jso type can be `atomic`, a `tagged product`, a `tagged sum`, an `array`, a `promise`, a `stream`, or a `function`."),
    h3("Atomic Types"),
    p("Jso's atomic types are `string`, `number`, `date`, and `boolean`."),
    p("These correspond to string, double, date, and boolean types that you will find in most programming languages.  We take the liberty of not specifying these types any further.  Use your native language's features.  Marshalling between C# dates in the C# jso evaluator and Javascript dates in the Javascript jso evaluator should not be a problem."),
    h3("Tagged Products"),
    p("A tagged product type is a logical `and`.  Specifically it is set of key-type pairs, where the keys are strings.  Values of product types are sets of key-value pairs, where all of the values have the correspoinding types."),
    p("Jso exhibits row polymorphism.  If a program has a certain sum or product type, it will also have any sum or product type with strictly more properties.  However, using this fact is not recommended due to the logical nature of sum and product types."),
    h3("Tagged Sums"),
    p("A tagged sum is a logical `or`.  Like a tagged product, a tagged sum is a set of key-type pairs.  A value of a sum types is a single key-value pair chosen from the set."),
    h3("Arrays"),
    p("A Jso array is a javascript array, see MDN."),
    h3("Promises"),
    p("A Jso promise is a type that has different semantics server side than it does client side.  Client side, a promise is a standard promise, see MDN.  Server side, the server must simply carry out the action as it renders the page, and the Jso value is the resulting value."),
    h3("Streams"),
    p("Streams also have different semantics server side than they do client side.  Client side, a stream value is an HCJ stream.  Server side, a stream value is the initial value on page load."),
    h3("Etc"),
    p("It is easy to define additional types.  All you have to do is specify both client side representations and server side representations, and implement any core functions to the type both client side and server side."),
    h2("Jso Terms"),
    p(""),
    p("The server side is more diverse than the client side, so that is what we will discuss here."),
    p("A jso term can be a `literal`, a `function application`, or an `identifier`."),
    p("A literal is an instance of a type written out by hand.  Usually, literal atomic types are corresponding values from the native language."),
    p("Evaluation is simple.  Literals evaluate to themselves."),
  ]);

  var csIsNotAFunction = docStack([
    p("Might be the most common error message you're going to get using this library.  Very uninformative, sorry."),
  ]);

  var version2 = docStack([
    p('Improve text measurement by using the canvas measureText method instead of the current strategy of appending the text to an invisible dom element.  Use this to implement a float left/right layout.'),
    p('Figure out how to integrate CSS transitions properly.'),
    p('Remove JQuery dependency, making hcj smaller and more agnostic.'),
    p('Add more comments.'),
    p('Turing-complete JSON subset that can be evaluated server-side to HTML/CSS and client-side to an HCJ component.'),
  ]);

  var support = docStack([
    p("Join #hcj on Freenode, or leave a message on the Github repository.  We can't promise that HCJ is the best implementation of what we're going for, nor that we will be the best maintainers of it, but if you should submit an issue or make a pull request we will make some kind of effort to address it properly."),
    p('<iframe src="https://kiwiirc.com/client/irc.freenode.net/?&theme=basic#hcj" style="border:0; width:100%; height:450px;"></iframe>'),
  ]);

  var testPage = docStack([
    p("Demo of some of the components that come with hcj."),
    p("Conventions used in these examples:"),
    codeBlock([
      'var c = window.hcj.component;',
      'var p = c.text;',
      'var pm = c.text({measureWidth: true});',
      'var h1 = c.text({size: 40});',
      'var h1m = c.text({size: 40, measureWidth: true});',
    ]),

    h2("Display all kinds of text"),
    c.text({
      size: 50,
    }, "big text"),
    showCodeBlock([
      'c.text({',
      '  size: 50,',
      '}, "big text");',
    ]),
    c.text({
      size: 10,
    }, "little text"),
    showCodeBlock([
      'c.text({',
      '  size: 10,',
      '}, "little text");',
    ]),
    c.text({
      color: hcj.color.create({
        r: 200,
        g: 0,
        b: 200,
      }),
    }, "colored text"),
    showCodeBlock([
      'c.text({',
      '  color: hcj.color.create({',
      '    r: 200,',
      '    g: 0,',
      '    b: 200,',
      '  }),',
      '}, "colored text");',
    ]),
    c.text([{
      str: 'f',
      size: 25,
    }, {
      str: 'u',
      size: 20,
      align: 'top',
    }, {
      str: 'n',
      size: 25,
    }, {
      str: 'k',
      align: 'sub',
    }, {
      str: 'y',
    }, {
      str: ' ',
    }, {
      str: 't',
      spanCSS: [{
        name: 'display',
        value: 'inline-block',
      }, {
        name: 'transform',
        value: 'scaleX(-1)',
      }],
    }, {
      str: 'e',
      spanCSS: [{
        name: 'display',
        value: 'inline-block',
      }, {
        name: 'transform',
        value: 'scaleY(-1)',
      }],
    }, {
      str: 'x',
    }, {
      str: 't',
    }]),
    showCodeBlock([
      'c.text([{',
      '  str: \'f\',',
      '  size: 25,',
      '}, {',
      '  str: \'u\',',
      '  size: 20,',
      '  align: \'top\',',
      '}, {',
      '  str: \'n\',',
      '  size: 25,',
      '}, {',
      '  str: \'k\',',
      '  align: \'sub\',',
      '}, {',
      '  str: \'y\',',
      '}, {',
      '  str: \' \',',
      '}, {',
      '  str: \'t\',',
      '  spanCSS: [{',
      '    name: \'display\',',
      '    value: \'inline-block\',',
      '  }, {',
      '    name: \'transform\',',
      '    value: \'scaleX(-1)\',',
      '  }],',
      '}, {',
      '  str: \'e\',',
      '  spanCSS: [{',
      '    name: \'display\',',
      '    value: \'inline-block\',',
      '  }, {',
      '    name: \'transform\',',
      '    value: \'scaleY(-1)\',',
      '  }],',
      '}, {',
      '  str: \'x\',',
      '}, {',
      '  str: \'t\',',
      '}]);',
    ]),
    c.text({
      color: hcj.color.create({
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      }),
    }, "secret text"),
    showCodeBlock([
      'c.text({',
      '  color: hcj.color.create({',
      '    r: 0,',
      '    g: 0,',
      '    b: 0,',
      '    a: 0,',
      '  }),',
      '}, "secret text");',
    ]),
    h2("Display images"),
    c.all([
      c.keepAspectRatio,
      c.alignHLeft,
    ])(c.image({
      src: './demo.png',
      minWidth: 300,
    })),
    showCodeBlock([
      'c.all([',
      '  c.keepAspectRatio,',
      '  c.alignHLeft,',
      '])(c.image({',
      '  src: \'./demo.png\',',
      '  minWidth: 300,',
      '}));',
    ]),
    h2("Separate items horizontally and vertically"),
    c.stack([
      c.sideBySide([
        pm('TEXT'),
        c.bar.h(20),
        pm('TEXT'),
      ]),
      c.bar.v(20),
      c.sideBySide([
        pm('TEXT'),
        c.bar.h(20),
        pm('TEXT'),
      ]),
    ]),
    showCodeBlock([
      'c.stack([',
      '  c.sideBySide([',
      '    pm(\'TEXT\'),',
      '    c.bar.h(20),',
      '    pm(\'TEXT\'),',
      '  ]),',
      '  c.bar.v(20),',
      '  c.sideBySide([',
      '    pm(\'TEXT\'),',
      '    c.bar.h(20),',
      '    pm(\'TEXT\'),',
      '  ]),',
      ']);',
    ]),
    h2("Align items horizontally and vertically"),
    c.alignH({
      l: pm('LEFT'),
      r: pm('RIGHT'),
      m: pm('MIDDLE'),
    }),
    showCodeBlock([
      'c.alignH({',
      '  l: pm(\'LEFT\'),',
      '  r: pm(\'RIGHT\'),',
      '  m: pm(\'MIDDLE\'),',
      '});',
    ]),
    c.sideBySide([
      c.alignV({
        t: pm('TOP'),
        b: pm('BOTTOM'),
        m: pm('MIDDLE'),
      }),
      c.alignV({
        t: h3m('LARGE TOP'),
        b: h3m('LARGE BOTTOM'),
        m: h3m('LARGE MIDDLE'),
      }),
      c.alignV({
        t: h1m('LARGER TOP'),
        b: h1m('LARGER BOTTOM'),
        m: h1m('LARGER MIDDLE'),
      }),
      c.all([
        c.backgroundColor(hcj.color.create()),
      ])(c.bar.v(200)),
    ]),
    showCodeBlock([
      'c.sideBySide([',
      '  c.alignV({',
      '    t: pm(\'TOP\'),',
      '    b: pm(\'BOTTOM\'),',
      '    m: pm(\'MIDDLE\'),',
      '  }),',
      '  c.alignV({',
      '    t: h3m(\'LARGE TOP\'),',
      '    b: h3m(\'LARGE BOTTOM\'),',
      '    m: h3m(\'LARGE MIDDLE\'),',
      '  }),',
      '  c.alignV({',
      '    t: h1m(\'LARGER TOP\'),',
      '    b: h1m(\'LARGER BOTTOM\'),',
      '    m: h1m(\'LARGER MIDDLE\'),',
      '  }),',
      '  c.all([',
      '    c.backgroundColor(hcj.color.create()),',
      '  ])(c.bar.v(200)),',
      ']);',
    ]),
    h2('Show a stream of components.  Text is changed each time you press the button'),
    c.scope(function () {
      var generateRandomLetters = function (count) {
        var result = '';
        // for (var i = 0; i < count; i++) {
          result += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        // }
        return result;
      };
      var countLetters = 10;
      var lettersS = stream.once(generateRandomLetters(countLetters));
      return c.stack([
        c.componentStream(stream.map(lettersS, function (letters) {
          return p(letters);
        })),
        c.all([
          c.clickThis(function () {
            stream.push(lettersS, generateRandomLetters(countLetters));
          }),
          c.alignHLeft,
        ])(c.text({
          el: el.button,
          measureWidth: true,
        }, {
          str: 'new string',
        })),
      ]);
    }),
    showCodeBlock([
      'var lettersS = stream.once(generateRandomLetters(countLetters));',
      'return c.stack([',
      '  c.componentStream(stream.map(lettersS, function (letters) {',
      '    return p(letters);',
      '  })),',
      '  c.all([',
      '    c.clickThis(function () {',
      '      stream.push(lettersS, generateRandomLetters());',
      '    }),',
      '    c.alignHLeft,',
      '  ])(c.text({',
      '    el: el.button,',
      '    measureWidth: true,',
      '  }, {',
      '    str: \'new string\',',
      '  })),',
      ']);',
    ]),
    h2('Show a grid of components'),
    c.grid({
      padding: 20,
      surplusWidthFunc: hcj.funcs.surplusWidth.evenlySplitCenter,
    })([
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
      pm('GRID TEXT'),
    ]),
    showCodeBlock([
      'c.grid({',
      '  padding: 20,',
      '  surplusWidthFunc: hcj.funcs.surplusWidth.evenlySplitCenter,',
      '})([',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      '  pm(\'GRID TEXT\'),',
      ']);',
    ]),
    h2('Maintain aspect ratio even in adverse conditions, both by "covering" and by "containing"'),
    c.sideBySide([
      c.all([
        c.keepAspectRatio(),
        c.minWidth(20),
        c.minHeight(200),
        c.alignHLeft,
      ])(c.image({
        src: './demo.png',
        minWidth: 300,
      })),
      c.all([
        c.keepAspectRatio({
          fill: true,
        }),
        c.minWidth(20),
        c.minHeight(200),
        c.alignHLeft,
      ])(c.image({
        src: './demo.png',
        minWidth: 300,
      })),
    ]),
    showCodeBlock([
      'c.sideBySide([',
      '  c.all([',
      '    c.keepAspectRatio(),',
      '    c.minWidth(20),',
      '    c.minHeight(200),',
      '    c.alignHLeft,',
      '  ])(c.image({',
      '    src: \'./demo.png\',',
      '    minWidth: 300,',
      '  })),',
      '  c.all([',
      '    c.keepAspectRatio({',
      '      fill: true,',
      '    }),',
      '    c.minWidth(20),',
      '    c.minHeight(200),',
      '    c.alignHLeft,',
      '  ])(c.image({',
      '    src: \'./demo.png\',',
      '    minWidth: 300,',
      '  })),',
      ']);',
    ]),
    h2('Choose the largest component that fits in the display area'),
    c.all([
      c.minWidth(0),
    ])(c.largestWidthThatFits([
      pm('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      pm('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
      pm('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'),
      pm('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
      pm('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
      pm('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      pm('ggggggggggggggggggggggggggggggggggggggggggggggggggggggg'),
      pm('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'),
      pm('iiiiiiiiiiiii'),
    ])),
    showCodeBlock([
      'c.all([',
      '  c.minWidth(0),',
      '])(c.largestWidthThatFits([',
      '  pm(\'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\'),',
      '  pm(\'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\'),',
      '  pm(\'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\'),',
      '  pm(\'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd\'),',
      '  pm(\'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee\'),',
      '  pm(\'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff\'),',
      '  pm(\'ggggggggggggggggggggggggggggggggggggggggggggggggggggggg\'),',
      '  pm(\'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh\'),',
      '  pm(\'iiiiiiiiiiiii\'),',
      ']));',
    ]),
    h2('Display things on top of each other'),
    c.overlays([
      h1('Some text'),
      h1('Hello'),
      c.stack([
        c.text('hi', [font.p, {
          color: color.red,
        }]),
        c.text('hi', [font.p, {
          color: color.red,
        }]),
        c.text('hi', [font.p, {
          color: color.red,
        }]),
      ]),
    ]),
    showCodeBlock([
      'c.overlays([',
      '  h1(\'Some text\'),',
      '  h1(\'Hello\'),',
      '  c.stack([',
      '    c.text(\'hi\', [font.p, {',
      '      color: color.red,',
      '    }]),',
      '    c.text(\'hi\', [font.p, {',
      '      color: color.red,',
      '    }]),',
      '    c.text(\'hi\', [font.p, {',
      '      color: color.red,',
      '    }]),',
      '  ]),',
      ']);',
    ]),
    h2('Load content asynchoronusly'),
    c.scope(function () {
      var stuffS = stream.once(c.nothing);
      var buttonTextS = stream.once('load stuff');
      var go = function (secondsLeft) {
        if (secondsLeft === 0) {
          stream.push(stuffS, p('stuff!'));
          stream.push(buttonTextS, 'load stuff');
          return;
        }
        stream.push(buttonTextS, secondsLeft + '');
        setTimeout(function () {
          go(secondsLeft - 1);
        }, 1000);
      };
      return stack([
        c.all([
          c.link,
          c.clickThis(function () {
            go(5);
          }),
          c.alignHLeft,
        ])(c.text({
          str: buttonTextS,
          el: el.button,
          measureWidth: true,
        })),
        c.componentStream(stuffS),
      ]);
    }),
    showCodeBlock([
      'var stuffS = stream.once(c.nothing);',
      'var buttonTextS = stream.once(\'load stuff\');',
      'var go = function (secondsLeft) {',
      '  if (secondsLeft === 0) {',
      '    stream.push(stuffS, p(\'stuff!\'));',
      '    stream.push(buttonTextS, \'load stuff\');',
      '    return;',
      '  }',
      '  stream.push(buttonTextS, secondsLeft + \'\');',
      '  setTimeout(function () {',
      '    go(secondsLeft - 1);',
      '  }, 1000);',
      '};',
      'return stack([',
      '  c.all([',
      '    c.link,',
      '    c.clickThis(function () {',
      '      go(5);',
      '    }),',
      '    c.alignHLeft,',
      '  ])(c.text({',
      '    str: buttonTextS,',
      '    el: el.button,',
      '    measureWidth: true,',
      '  })),',
      '  c.componentStream(stuffS),',
      ']);',
    ]),
    h2('Display components side by side and in a stack'),
    c.sideBySide([
      h1m('A'),
      h1m('B'),
      h1m('C'),
    ]),
    showCodeBlock([
      'c.sideBySide([',
      '  h1m(\'A\'),',
      '  h1m(\'B\'),',
      '  h1m(\'C\'),',
      ']);',
    ]),
    c.stack([
      h1('A'),
      h1('B'),
      h1('C'),
    ]),
    showCodeBlock([
      'c.stack([',
      '  h1(\'A\'),',
      '  h1(\'B\'),',
      '  h1(\'C\'),',
      ']);',
    ]),
    h2('Apply font and background colors'),
    c.all([
      c.backgroundColor({
        background: color.lightGray,
        backgroundHover: color.notBlack,
        font: color.red,
      }),
    ])(h1('MERRY CHRISTMAS')),
    showCodeBlock([
      'c.all([',
      '  c.backgroundColor({',
      '    background: color.lightGray,',
      '    backgroundHover: color.notBlack,',
      '    font: color.red,',
      '  }),',
      '])(h1(\'MERRY CHRISTMAS\'));',
    ]),
    h2('Add margins and borders'),
    c.all([
      c.margin(20),
    ])(h1m('HCJ')),
    showCodeBlock([
      'c.all([',
      '  c.margin(20),',
      '])(h1m(\'HCJ\'));',
    ]),
    c.all([
      c.border(color.notBlack, 1),
      c.alignHLeft,
    ])(h1m('HCJ')),
    showCodeBlock([
      'c.all([',
      '  c.border(color.notBlack, 1),',
      '  c.alignHLeft,',
      '])(h1m(\'HCJ\'));',
    ]),
    h2('Crop components'),
    c.all([
      c.crop({
        top: 0.4,
        right: 0.1,
        left: 0.2,
        bottom: 0.2,
      }),
      c.alignHLeft,
    ])(h1m('HALP')),
    showCodeBlock([
      'c.all([',
      '  c.crop({',
      '    top: 0.4,',
      '    right: 0.1,',
      '    left: 0.2,',
      '    bottom: 0.2,',
      '  }),',
      '  c.alignHLeft,',
      '])(h1m(\'HALP\'));',
    ]),
    h2('Link to google'),
    c.all([
      c.linkTo({
        href: 'https://google.com/',
        defaultStyle: true,
      }),
    ])(p('knowledge awaits')),
    showCodeBlock([
      'c.all([',
      '  c.linkTo({',
      '    href: \'https://google.com/\',',
      '    defaultStyle: true,',
      '  }),',
      '])(p(\'knowledge awaits\'));',
    ]),
    h2('Arbitrarily position components and specify their widths and heights'),
    c.sideBySide([
      c.all([
        c.minWidth(20),
      ])(h1('HCJ')),
      c.stack([
        c.all([
          c.minHeight(11),
        ])(h1('HCJ')),
        c.all([
          c.minHeight(11),
        ])(h1('HCJ')),
        c.all([
          c.minHeight(11),
        ])(h1('HCJ')),
      ]),
    ]),
    showCodeBlock([
      'c.sideBySide([',
      '  c.all([',
      '    c.minWidth(20),',
      '  ])(h1(\'HCJ\')),',
      '  c.stack([',
      '    c.all([',
      '      c.minHeight(11),',
      '    ])(h1(\'HCJ\')),',
      '    c.all([',
      '      c.minHeight(11),',
      '    ])(h1(\'HCJ\')),',
      '    c.all([',
      '      c.minHeight(11),',
      '    ])(h1(\'HCJ\')),',
      '  ]),',
      ']);',
    ]),
    h2('Handle events'),
    c.all([
      c.clickThis(function () {
        var name = prompt("What's your name?");
        alert("Hello " + name + "!");
      }),
      c.alignHLeft,
    ])(c.text({
      str: 'push me',
      el: el.button,
      measureWidth: true,
    })),
    showCodeBlock([
      'c.all([',
      '  c.clickThis(function () {',
      '    var name = prompt("What\'s your name?");',
      '    alert("Hello " + name + "!");',
      '  }),',
      '  c.alignHLeft,',
      '])(c.text({',
      '  str: \'push me\',',
      '  el: el.button,',
      '  measureWidth: true,',
      '}));',
    ]),
  ]);

  var pages = [{
    title: "Home",
    component: introduction,
  }, {
    title: 'Hello World',
    component: renderingComponents,
  }, {
    title: 'Introduction',
    component: aLittleVocab,
  }, {
    title: 'API - Components',
    component: standardLibraryComponents,
  }, {
    title: 'API - Layouts',
    component: standardLibraryLayouts,
  }, {
    title: 'API - Styles',
    component: standardLibraryComponentModifiers,
  }, {
    title: 'API - Forms',
    component: standardLibraryForms,
  }, {
    title: 'API - Colors',
    component: standardLibraryColors,
  }, {
    title: 'Examples',
    component: testPage,
  }, {
    title: 'Streams',
    component: standardLibraryStreams,
  }, {
    title: 'Defining Components',
    component: definingComponents,
  }, {
    title: 'Defining Layouts',
    component: definingLayouts,
  }, {
    title: 'Possible Future Development',
    component: version2,
  }, {
    title: 'Community',
    component: support,
  }];

  var initialIndex = window.location.hash && parseInt(window.location.hash.substring(1));
  var currentPageS = stream.once(initialIndex || 0);
  $(window).on('hashchange', function () {
    var index = window.location.hash && parseInt(window.location.hash.substring(1));
    stream.push(currentPageS, index);
  });

  stream.map(currentPageS, function (index) {
    window.location.hash = index;
  });

  var sidebar = c.all([
    c.margin(20),
    c.backgroundColor({
      background: color.lightGray,
    }),
  ])(docStack([
    c.image({
      src: './demo.png',
      minWidth: 0,
      alt: 'HCJ Logo',
    }),
    c.bar.h(20),
    stack(pages.map(function (p, i) {
      return c.all([
        c.margin(2),
        c.linkTo(window.location.origin + window.location.pathname + '#' + i),
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
      p('v0.2.1 alpha'),
      p('It could be worse.'),
      c.componentStream(stream.map(currentPageS, function (index) {
        var p = pages[index];
        return c.all([
          c.$css('transition', 'left 1s'),
        ])(docStack([
          h1(p.title),
          p.component,
        ]));
      })),
    ])),
  ]));

  window.hcj.rootComponent(docs);
});
