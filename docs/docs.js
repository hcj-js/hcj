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
  var docStack2 = c.stack({
    padding: 10,
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
    gray: hcj.color.create({
      r: 100,
      g: 95,
      b: 100,
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
    p0: {
      minWidth: 100,
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
  var p0 = text(font.p0);
  var pm = text([font.p, {
    measureWidth: true,
  }]);
  var codeBlock = function (strs) {
    return c.all([
      c.overflowHorizontal({
        minWidth: 300,
      }),
    ])(stack(strs.map(function (str) {
      return c.text(str.split(' ').join('&nbsp;'), [font.code, {
        measureWidth: true,
        oneLine: true,
      }]);
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

  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };

  var objectDefinition = function (props, noBullet, commentString, noGray, noBottomToTop) {
    var maxPropLength = 0;
    var maxTypeLength = 0;
    props.map(function (prop) {
      prop.nameLength = prop.name.replaceAll('&nbsp;', ' ').length;
      prop.typeLength = prop.type.replaceAll('&nbsp;', ' ').length;
      maxPropLength = Math.max(maxPropLength, prop.nameLength);
      maxTypeLength = Math.max(maxTypeLength, prop.typeLength);
    });
    return stack(props.map(function (prop) {
      return c.grid({
          bottomToTop: !noBottomToTop,
          surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
        }, [
          pm((noBullet ? '`' : '&#8226;&nbsp;`') + prop.name + '&nbsp'.repeat(maxPropLength - prop.nameLength) + ' :: ' + prop.type + '&nbsp;'.repeat(maxTypeLength - prop.typeLength) + '`'),
          c.all([
            noGray ? hcj.funcs.id : c.backgroundColor({font: color.gray}),
          ])(c.sideBySide({
            surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
          }, [
            pm('`' + (commentString || '&nbsp;--&nbsp;') + '`'),
            p0(prop.description),
          ])),
        ]);
    }));
  };

  var typeSignatures = function (sigs, noBullet, typeofString) {
    var maxPropLength = 0;
    sigs.map(function (sig) {
      maxPropLength = Math.max(maxPropLength, sig.name.length);
    });
    return stack(sigs.map(function (sig) {
      return c.grid({
          bottomToTop: true,
          surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
        }, [
          pm((noBullet ? '`' : '&#8226;&nbsp;`') + sig.name + '&nbsp'.repeat(maxPropLength - sig.name.length) + '`'),
          c.sideBySide({
            surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
          }, [
            pm(typeofString || '`&nbsp;::&nbsp;`'),
            p0('`' + sig.type + '`'),
          ]),
        ]);
    }));
  };

  var install = docStack([
    p("`git clone https://github.com/hcj-js/hcj.git`"),
    p("Use the files in the dist folder."),
  ]);

  var introduction = [
    p("HCJ.JS's purpose is element positioning.  Many website frameworks control <i>what</i> is displayed, but they do not let you specify <i>how</i> it is displayed."),
    p("A pure Javascript framework, HCJ does not require you to write any CSS or more than 15 lines of HTML.  HCJ websites are fast, easy to compose, mobile-responsive, and do the 'right thing' for absolutely free."),
    p("Components, HCJ's building block, are extraordinarily composable.  Any component at any level can be rendered as a web page, making debugging very simple.  They respond to the size and shape of the page region they are rendered into, so rearranging your page is as easy as copy and paste."),
  ];

  var aLittleVocab = [
    p("The `component` is the building block of the HCJ framework.  Components can be composed to create new components, or rendered as web pages."),
    p("A component technically is a function taking a `context` and returning an `instance`.  The `context` specifies the page area that a component is rendered into, and the `instance` the minimum dimensions of the component."),
    docStack2([
      p("Specifically, a `context` is an object that has all of the following properties.  Here, `$el` is a JQuery object, and the rest are HCJ streams:"),
      objectDefinition([{
        name: '$el',
        type: 'JQuery',
        description: 'Parent element of the instance.',
      }, {
        name: 'width',
        type: 'Stream Number',
        description: 'Width available to the instance.',
      }, {
        name: 'height',
        type: 'Stream Number',
        description: 'Height available to the instance.',
      }, {
        name: 'left',
        type: 'Stream Number',
        description: 'Left position of the instance.',
      }, {
        name: 'top',
        type: 'Stream Number',
        description: 'Top position of the instance.',
      }, {
        name: 'leftOffset',
        type: 'Stream Number',
        description: 'Left position of "$el" relative to the page.',
      }, {
        name: 'topOffset',
        type: 'Stream Number',
        description: 'Top position of "$el" relative to the page.',
      }]),
    ]),
    p('When a component is rendered, it must create an element and append it to the context\'s `$el` property.  The component does not need to size and position itself within its parent; that is done by its parent layout.  The reason the `context` passed to it has `width` and `height` properties and so on is so that it can size and position its children.'),
    docStack2([
      p('An `instance` is an object with the following properties:'),
      objectDefinition([{
        name: '$el',
        type: 'JQuery',
        description: 'Root element of the instance.',
      }, {
        name: 'minWidth',
        type: 'Stream Number',
        description: 'Minimum width of the instance.',
      }, {
        name: 'minHeight',
        type: 'Stream (Number -> Number)',
        description: 'Minimum height of the instance.',
      }, {
        name: 'remove',
        type: 'Function',
        description: 'Removes the instance.',
      }]),
    ]),
    p('`$el` is always given a non-static `position`, and sized and located to match the `context` passed into the component.'),
    p('`minWidth` is a stream of numbers giving the minimum width required by the instance to display sanely.  Likewise, `minHeight` is a stream of functions that, given a hypothetical width, return the height required by the instance at that width.'),
    p('The `remove` property is a function that removes `$el` from the DOM and performs any other cleanup required by the instance, such as closing open connections.'),
    p("In HCJ terminology, a `layout` is a function that takes one or more components and returns a component.  A `style` is a function that takes exactly one component and returns a component.  Therefore, all styles are layouts."),
    c.all([
      c.alignHLeft,
      c.minWidth(300),
    ])(c.image({
      src: './context.png',
      alt: 'Graphic depicting HCJ context attributes',
      minWidth: 600,
    })),
    p("Figure 1: Red arrows depict the context belonging to the blue component inside the green layout."),
    p("In most cases, the `width` and `height` streams are all that are needed.  The other streams are provided so that layouts can position children relative to their overall on-screen location if need be."),
  ];

  var libraryModules = [
    p('The HCJ library pollutes the global window object with the `hcj` object.  Each module is a property of this object.  HCJ modules include:'),
    stack([
      p('&#8226; component: Functions that return components.'),
      p('&#8226; element: Some helper methods for creating custom components.'),
      p('&#8226; rootComponent: The function that bootstraps a component onto a page.'),
      p('&#8226; stream: The hcj stream library.'),
    ]),
  ];

  var definingComponents = [
    p("We provide a handy `hcj.component.component` function for defining components.  It takes two arguments, an optional tag name (which defaults to 'div') and a `build` method, and returns a component."),
    p("`component : (String? , BuildComponent) -> Component`"),
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
  ];

  var renderingComponents = [
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
    p("Font loading is a particular issue for HCJ websites.  Because fonts can change the size taken up by text, text-based components must set their minimum dimensions after fonts are loaded.  It is an unfortunate reality that there are no DOM callbacks that are run when fonts are loaded, so HCJ is shipped with a `window.waitForWebfonts` function.  We recommend that you use this function to run your user script after webfonts are loaded."),
    p("This `waitForWebfonts` function takes three arguments: an array of font families to wait for (these should be defined using @font-face CSS rules), a callback to run when they are all loaded, and an optional max time to wait in the event that a font never loads, which defaults to 10 seconds."),
  ];

  var definingLayouts = [
    p("The `hcj.component.container` method is for defining layouts and other containers.  It takes an optional string argument giving its tag name, followed by a build method."),
    p("`container : (String? , BuildContainer) -> Component`"),
    p("`type BuildContainer = (JQuery, Context, Append) -> {minWidth, minHeight, onRemove}`"),
    p("`type Append = (Component, Viewport, Bool) -> Instance`"),
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
    p("`stack :: [Component] -> Component`"),
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
  ];

  var standardLibraryElements = [
  ];

  var standardLibraryComponents = [
    p('Here are the basic components that ship with hcj.js.'),
    p('Each is a property of the `window.hcj.component` object.'),
    p('Below each function, there is a Haskell-esque "type signature" showing the parameters that each function can take, followed by an English description.  This "type signature" borrows syntax from Haskell and C#, and uses some of its own shorthand.  The function arrow `->` is borrowed from Haskell; `a -> b` is a function taking a parameter of type `a` and returning type `b`.  Additionally, `(a , b) -> c` denotes a two-argument function, while `(a ; b) -> c` denotes a two-argument function that can be curried, i.e. `f :: (a ; b) -> c` can be called either as `f(x, y)` or as `f(x)(y)`.  The type `a?`, is shorthand for `Maybe a`, denoting "Either an `a` or the value `undefined`".  And `a | b` denotes a variable that can have type `a` or type `b`.'),

    h2('Text'),
    p('`text :: (TextConfig? ; SpanConfig | [SpanConfig]) -> Component`'),
    p('The `text` function can take one or two arguments: an optional `TextConfig`, followed by either a single `SpanConfig` or an array of `SpanConfigs`.  It returns a `Component`.'),
    p('By default, a text component has a minimum width of 300px, and its minimum height is computed by measuring the height of the element.  These can be changed by passing in a `TextConfig` object.'),
    docStack2([
      p('The `TextConfig` object applies globally to all spans within the text component.  It can have the same properties as a `SpanConfig`, minus `str`, plus some additional properties:'),
      objectDefinition([{
        name: 'align',
        type: 'String?',
        description: 'Text align.',
      }, {
        name: 'minWidth',
        type: 'Number?',
        description: 'Specifies the min width of the text component, overriding 300px default.',
      }, {
        name: 'measureWidth',
        type: 'Bool?',
        description: 'If set, the text element is measured and its measurement becomes its min width, overriding 300px default.',
      }, {
        name: 'minHeight',
        type: 'Number?',
        description: 'Specifies the min height of the text component as a constant number, overriding `measureHeight` default.',
      }, {
        name: 'oneLine',
        type: 'Bool?',
        description: 'Declares that the text component is always one line tall.  Its min height is calculated from its font size and line height, overriding `measureHeight` default.',
      }]),
    ]),
    docStack2([
      p('A `SpanConfig` may be either a `String`, an object with the following properties:'),
      objectDefinition([{
        name: 'str',
        type: 'String',
        description: 'The text to show.',
      }, {
        name: 'size',
        type: 'String?',
        description: 'Font size.',
      }, {
        name: 'weight',
        type: 'String?',
        description: 'Font weight.',
      }, {
        name: 'family',
        type: 'String?',
        description: 'Font family.',
      }, {
        name: 'color',
        type: 'Color?',
        description: 'Font color (as an HCJ color).',
      }, {
        name: 'shadow',
        type: 'String?',
        description: 'Font shadow.',
      }, {
        name: 'spanCSS',
        type: '[{name: String, value: String}]?',
        description: 'Array of objects with `name` and `value` properties.  Additional CSS styles to apply to the text span.',
      }, {
        name: 'lineHeight',
        type: 'Number?',
        description: 'Line height of the text span.',
      }, {
        name: 'verticalAlign',
        type: 'String?',
        description: 'Vertical align of the text span.',
      }]),
    ]),
    p('Examples:'),
    c.text('Hello'),
    showCodeBlock([
      "hcj.component.text('Hello');",
    ]),
    c.text({
      size: '10px',
    })('hello'),
    showCodeBlock([
      "hcj.component.text({size: '10px'}, 'hello');",
    ]),
    c.text([{
      str: 'BOLD',
      weight: 'bold',
    }, {
      str: '_MONO',
      family: 'Monospace',
    }]),
    showCodeBlock([
      "hcj.component.text([{",
      "  str: 'BOLD',",
      "  weight: 'bold',",
      "}, {",
      "  str: '_MONO',",
      "  family: 'Monospace',",
      "}]);",
    ]),

    h2('Image'),
    p('`image :: ImageConfig -> Component`'),
    p('Creates an image component.  By default, an image\'s minimum width is its native width, and its minimum height function attempts to maintain its aspect ratio.'),
    p("An `ImageConfig` object has the following properties:"),
    objectDefinition([{
      name: 'src',
      type: 'String',
      description: 'Image sorcue.',
    }, {
      name: 'alt',
      type: 'String?',
      description: 'Alt text.',
    }, {
      name: 'minWidth',
      type: 'Number?',
      description: 'If present, min width is set to this number instead of the image\'s natural width.',
    }, {
      name: 'minHegiht',
      type: 'Number?',
      description: 'If present, min width of image is set to the quotient of this number and the image\'s aspect ratio.',
    }]),
    p('Note: When an image is placed into a context whose proportions are not the image\'s aspect ratio, it will stretch.  The most common solution is to wrap images with the `hcj.component.keepAspectRatio` layout.'),

    h2('BarH, BarV, and Rectangle'),
    typeSignatures([{
      name: 'barH',
      type: 'Number -> Component',
    }, {
      name: 'barV',
      type: 'Number -> Component',
    }, {
      name: 'rectangle',
      type: ' {[h, x]: Number, [v, y]: Number} -> Component',
    }]),
    p("`barH` and `barV` create horizontal and vertical separators of the size you specify.  `rectangle` takes an object with `h` and `v` or `x` and `y` properties, and creates a rectangle of that size."),

    h2('Empty'),
    typeSignatures([{
      name: 'empty',
      type: 'String -> Component',
    }, {
      name: 'nothing',
      type: 'Component',
    }]),
    p('The `empty` function takes a tag name and returns a component with zero width and zero height using that tag name.'),
    p('`nothing` is defined as `empty("div")`.'),
  ];

  var standardLibraryLayouts = [
    p('These are the layouts that ship with hcj.js.  All are properties of the `window.hcj.component` object.'),

    h2('AlignHorizontal / AlignH / AlignLRM'),
    typeSignatures([{
      name: 'alignHorizontal',
      type: '{l: Component?, r: Component?, m: Component?} -> Component',
    }, {
      name: 'alignHLeft',
      type: 'Component -> Component',
    }, {
      name: 'alignHRight',
      type: 'Component -> Component',
    }, {
      name: 'alignHMiddle',
      type: 'Component -> Component',
    }]),
    p('Takes an object with optional `l`, `r`, and `m` properties.  Aligns elements left, right, and middle.'),
    docStack2([
      p('Example:'),
      codeBlock([
        "var logo = hcj.component.image({src: 'logo.png'});",
        "var menu = hcj.component.text('menu');",
        "&nbsp;",
        "var header = hcj.component.alignH({",
        "  l: logo,",
        "  r: menu,",
        "});",
      ]),
    ]),

    h2('AlignVertical / AlignV / AlignTBM'),
    typeSignatures([{
      name: 'alignVertical',
      type: '{t: Component?, b: Component?, m: Component?} -> Component',
    }, {
      name: 'alignVTop',
      type: 'Component -> Component',
    }, {
      name: 'alignVBottom',
      type: 'Component -> Component',
    }, {
      name: 'alignVMiddle',
      type: 'Component -> Component',
    }]),
    p('Takes an object with optional `t`, `b`, and `m` properties.  Aligns elements top, bottom, and middle.'),
    docStack2([
      p('Example:'),
      codeBlock([
        "var logo = hcj.component.image({src: 'logo.png'});",
        "var menu = hcj.component.text('menu');",
        "&nbsp;",
        "var header = hcj.component.alignV({",
        "  t: logo,",
        "  m: menu,",
        "});",
      ]),
    ]),

    h2('ComponentStream'),
    p('`componentStream :: Stream Component -> Component`'),
    p('Takes an hcj stream of components and returns a component that displays latest one in the stream.'),
    docStack2([
      p('Example:'),
      codeBlock([
        "var componentS = hcj.stream.map(hcj.viewport.widthS, function (windowWidth) {",
        "  return hcj.component.text('' + windowWidth);",
        "};",
        "var windowWidth = componentStream(componentS);",
      ]),
    ]),

    h2('Grid'),
    p('`grid :: (GridConfig? ; [Component]) -> Component`'),
    p('Responsive grid layout.  Components are placed into rows.'),
    p('A `GridConfig` is an object with the following properties:'),
    objectDefinition([{
      name: 'padding',
      type: 'Number?',
      description: 'Padding amount between components.',
    }, {
      name: 'surplusWidthFunc',
      type: 'SurplusWidthFunc?',
      description: 'Splits any surplus width among components in each row; see `sideBySide`.',
    }, {
      name: 'surplusHeightFunc',
      type: 'SurplusHeightFunc?',
      description: 'Splits surplus height among grid rows; see `stack`.',
    }, {
      name: 'useFullWidth',
      type: 'Bool?',
      description: 'If set, the grid\'s min width is computued as the sum of the min widths of the child components, rather than as the largest of the min widths of the child components.',
    }, {
      name: 'bottomToTop',
      type: 'Bool?',
      description: 'If set, grid rows are arranged in reverse order: they stack upward instead of downward.',
    }, {
      name: 'maxPerRow',
      type: 'Number?',
      description: 'Max components per row.',
    }, {
      name: 'rowOrColumn',
      type: 'Bool?',
      description: 'If set, grid elements will always be arranged in either a single row if they fit horizontally, or a single column if they do not.',
    }]),

    h2('LargestWidthThatFits'),
    p('`largestWidthThatFits :: [Component] -> Component`'),
    p('Chooses the largest-width component that fits, among the components passed in.'),
    p('The minimum width of this component is the smallest of the minimum widths of its children, and the minimum height is of the largest component that fits the given width.'),

    h2('Overlays'),
    p('`overlays :: [Component] -> Component`'),
    p('Places components directly on top of one another.'),
    p('The minimum width and minimum height of the overlay are the max of the minimum widths and minimum heights of its children.'),

    h2('PromiseComponent'),
    p('`promiseComponent :: (Promise Component , Component?) -> Component`'),
    p('Takes a promise that resolves to a component, and an optional initial component.  Displays the initial component until the promise resolves, then switches to the resolved component.'),

    h2('SideBySide'),
    p('`sideBySide :: (SideBySideConfig ; [Component]) -> Component`'),
    p('Places components directly side by side.'),
    p('A `SideBySideConfig` may have the following properties:'),
    objectDefinition([{
      name: 'Padding',
      type: 'Number?',
      description: 'Padding amount between components.',
    }, {
      name: 'surplusWidthFunc',
      type: 'SurplusWidthFunc?',
      description: 'Distribute surplus width among the stacked items.  Surplus width function is always called with a single row.',
    }]),
    p('When the width of a row is greater than its minimum width, it has surplus width.  A `SurplusWidthFunc` takes two parameters: the total width available, and an array of "rows", each an array of "columns".  Each column is an object with a `left` and a `width` property initialized with its left position and width.  The function returns an array of rows (possibly by mutating the input array) giving new left and width values for each column.'),
    h3('surplusWidthFunc'),
    p('`SurplusWidthFunc :: (Number , [[{left: Number, width: Number}]]) -> [[{left: Number, width: Number}]]`'),
    p('HCJ comes with a small number of `SurplusWidthFunc`s for you to use.  These are all members of the `window.hcj.funcs.surplusWidth` object:'),
    objectDefinition([{
      name: 'ignore',
      type: 'SurplusWidthFunc',
      description: 'Ignores surplus width.',
    }, {
      name: 'center',
      type: 'SurplusWidthFunc',
      description: 'Centers rows horizontally.',
    }, {
      name: 'evenSplit',
      type: 'SurplusWidthFunc',
      description: 'Evenly splits each row\'s surplus width among its columns, increasing their widths.',
    }, {
      name: 'justify',
      type: 'SurplusWidthFunc',
      description: 'Repositions each row\'s columns so that they are evenly spaced, but does not increase their widths.',
    }, {
      name: 'giveToNth',
      type: 'Number -> SurplusWidthFunc',
      description: 'Gives all surplus width to the nth column of each row.',
    }, {
      name: 'centerLargestRowThenAlignLeft',
      type: 'SurplusWidthFunc',
      description: 'Centers the largest row.  All rows are then left-aligned together.',
    }]),
    p('Note that unlike a `SurplusHeightFunc`, which only operates on a single column of elements, a `SurplusWidthFunc` operates on multiple rows at once.'),

    h2('Stack'),
    p('`stack :: (StackConfig? ; [Component]) -> Component`'),
    p('Positions components one on top of another.  The minimum width of a stack is the largest of the minimum widths of its children.  The minimum height of a stack is the sum of the minimum heights of its children.'),
    p('A `StackConfig` is an object with the following properties:'),
    objectDefinition([{
      name: 'padding',
      type: 'Number?',
      description: 'Padding amount between components.',
    }, {
      name: 'surplusHeightFunc',
      type: 'SurplusHeightFunc?',
      description: 'Distribute surplus height among the stacked items.',
    }]),
    p('When the height of a stack is greater than its minimum height, it has surplus height.  A `SurplusHeightFunc` takes two parameters: the total height available, and an array of "rows", each an object with a `top` and a `height` property initialized with its top position and height.  It returns an array of rows (possibly by mutating the input array) giving new top and height values for each row.'),
    h3('surplusHeightFunc'),
    p('`SurplusHeightFunc :: (Number , [{top: Number, height: Number}]) -> [{top: Number, height: Number}]`'),
    p('HCJ comes with a small number of `SurplusHeightFunc`s for you to use.  These are all members of the `window.hcj.funcs.surplusHeight` object:'),
    objectDefinition([{
      name: 'ignore',
      type: 'SurplusHeightFunc',
      description: 'Ignores surplus height.',
    }, {
      name: 'center',
      type: 'SurplusHeightFunc',
      description: 'Centers rows vertically.',
    }, {
      name: 'evenSplit',
      type: 'SurplusHeightFunc',
      description: 'Evenly splits surplus height among rows.',
    }, {
      name: 'giveToNth',
      type: 'Number -> SurplusHeightFunc',
      description: 'Gives all surplus height to the nth row.',
    }]),
  ];

  var standardLibraryComponentModifiers = [
    p('While the layouts in the previous section take multiple components and return a component, layouts that take exactly one component and return a component, sometimes called `styles`, can add much customization and functionality.'),
    p('These styles are all properties of the `window.hcj.component` object.'),
    p('A style again is a function that takes one component and returns a component, so the type `Style` is equivalent to the type `(Component -> Component)`.'),

    h2('$$, $addClass, $attr, $css, $on, $prop'),
    objectDefinition([{
      name: '$$',
      type: '((JQuery , Context) -> ())',
      description: '`Style`',
    }, {
      name: '$addClass',
      type: 'String',
      description: '`Style`',
    }, {
      name: '$attr',
      type: '(String , String)',
      description: '`Style`',
    }, {
      name: '$css',
      type: '(String , String)',
      description: '`Style`',
    }, {
      name: '$on',
      type: '(String , (Event -> ()))',
      description: '`Style`',
    }, {
      name: '$prop',
      type: '(String , String)',
      description: '`Style`',
    }], true, '&nbsp;->&nbsp;', true, true),
    p('The `$$` function takes a function that operates on the root element of an instance (and can also read from its context), and returns a style.'),
    p('`$addClass`, `$attr`, `$css`, `$on`, and `$prop` operate on a component using the JQuery methods they are named for.'),

    h2('All'),
    p('`all :: [Style] -> Style`'),
    p('The `hcj.component.all` function performs function composition.  It applies multiple styles, one after another.'),
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

    h2('And'),
    p('`and :: ((Instance , Context) -> ()) -> Component -> Component`'),
    p('The `hcj.component.and` function lets you arbitrarily operate on an instance while reading from its context.  It takes a function that takes an instance and a context, and returns a style.'),
    p('Example:'),
    codeBlock([
      "var turnBlue = and(function (i) {",
      "  i.$el.css('background-color', 'blue');",
      "});",
    ]),

    h2('BackgroundColor'),
    p('`backgroundColor :: (BackgroundColorConfig | Stream BackgroundColorConfig) -> Style`'),
    p('Applies background and font colors to a component.'),
    docStack2([
      p('A `BackgroundColorConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'background',
        type: 'Color?',
        description: 'Background color.',
      }, {
        name: 'font',
        type: 'Color?',
        description: 'Font color.',
      }, {
        name: 'backgroundHover',
        type: 'Color?',
        description: 'Background color on hover.',
      }, {
        name: 'fontHover',
        type: 'Color?',
        description: 'Font color on hover.',
      }]),
    ]),

    h2('Border'),
    p('`border :: (Color , BorderConfig) -> Style`'),
    p('Adds a colored border around a component.'),
    docStack2([
      p('A `BorderConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'all',
        type: 'Number?',
        description: 'Border size on all sides.',
      }, {
        name: 'top',
        type: 'Number?',
        description: 'Border size on top side.',
      }, {
        name: 'bottom',
        type: 'Number?',
        description: 'Border size on bottom side.',
      }, {
        name: 'left',
        type: 'Number?',
        description: 'Border size on left side.',
      }, {
        name: 'right',
        type: 'Number?',
        description: 'Border size on right side.',
      }, {
        name: 'radius',
        type: 'Number?',
        description: 'Border radius.',
      }]),
    ]),

    h2('Crop'),
    p('Crops a component down to a proportion of its size.'),
    p('`crop :: CropConfig -> Style`'),
    docStack2([
      p('A `CropConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'all',
        type: 'Number?',
        description: 'Crop proportion on all sides.',
      }, {
        name: 'top',
        type: 'Number?',
        description: 'Crop proportion on top side.',
      }, {
        name: 'bottom',
        type: 'Number?',
        description: 'Crop proportion on bottom side.',
      }, {
        name: 'left',
        type: 'Number?',
        description: 'Crop proportion on left side.',
      }, {
        name: 'right',
        type: 'Number?',
        description: 'Crop proportion on right side.',
      }]),
    ]),

    h2('KeepAspectRatio'),
    p('`keepAspectRatio :: (KeepAspectRatioConfig? ; Component) -> Component`'),
    p("Actively protects the aspect ratio of a component.  Aspect ratio is defined as the component's minimum width divided by its minimum height at its minimum width.  Component can cover the entire display area, or be contained within the display area."),
    p('A `KeepAspectRatioConfig` may have any of the following properties:'),
    objectDefinition([{
      name: 'fill',
      type: 'Bool?',
      description: 'If set, the child component covers the display area, and is cropped if necessary.  If false or not set, component is contained within the display area.',
    }, {
      name: 'top',
      type: 'Bool?',
      description: 'If set, child component\'s top is aligned with the top of the display area.',
    }, {
      name: 'bottom',
      type: 'Bool?',
      description: 'If set, child component\'s bottom is aligned with the bottom of the display area.',
    }, {
      name: 'left',
      type: 'Bool?',
      description: 'If set, child component\'s left side is aligned with the left side of the display area.',
    }, {
      name: 'right',
      type: 'Bool?',
      description: 'If set, child component\'s right side is aligned with the right side of the display area.',
    }]),

    h2('Link'),
    p('`link :: Style`'),
    p('Sets the `pointer: cursor` CSS style.'),

    h2('LinkTo'),
    p('`linkTo :: LinkConfig -> Style`'),
    p('Wraps component it in an `a` tag with the given href.'),
    docStack2([
      p('A `LinkConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'href',
        type: 'String',
        description: 'Link href.',
      }, {
        name: 'target',
        type: 'String?',
        description: 'Link target.',
      }]),
    ]),

    h2('Margin, Padding'),
    typeSignatures([{
      name: 'margin',
      type: 'MarginConfig -> Style',
    }, {
      name: 'padding',
      type: 'MarginConfig -> Style',
    }]),
    p('Adds some space around a component.'),
    p('In HCJ, there is no difference between the concepts of padding and margin.'),
    docStack2([
      p('A `MarginConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'all',
        type: 'Number?',
        description: 'Margin to apply to all sides.',
      }, {
        name: 'top',
        type: 'Number?',
        description: 'Margin to apply to top side.',
      }, {
        name: 'bottom',
        type: 'Number?',
        description: 'Margin to apply to bottom side.',
      }, {
        name: 'left',
        type: 'Number?',
        description: 'Margin to apply to left side.',
      }, {
        name: 'right',
        type: 'Number?',
        description: 'Margin to apply to right side.',
      }]),
    ]),

    h2('MinHeight'),
    p('`minHeight :: (Number -> Number) -> Style`'),
    p('`minHeightAtLeast :: (Number | Stream Number) -> Style`'),
    p('Overrides the minimum height of a component.'),
    p('The `minHeight` function takes a function from numbers to numbers and sets the component\'s min height to that function.'),
    p('The `minHeightAtLeast` function takes a number or a stream of numbers, and sets the minimum height of a component to be at least that amount.'),

    h2('MinWidth'),
    p('`minWidth :: MinWidth -> Style`'),
    p('`minWidthAtLeast :: (Number | Stream Number) -> Style`'),
    p('Overrides the minimum width of a component.'),
    p('The `minWidth` function takes a number and sets the minimum width of the instance to be that number.'),
    p('The `minWidthAtLeast` function takes a number or a stream of numbers, and sets the minimum width of a component to be at least that amount.'),

    h2('OnThis'),
    p('Signs up an event handler.'),
    typeSignatures([{
      name: 'onThis',
      type: 'String -> (Event -> ()) -> Style',
    }, {
      name: 'changeThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'clickThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'keydownThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'keyupThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'mousedownThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'mousemoveThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'mouseoverThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'mouseoutThis',
      type: '(Event -> ()) -> Style',
    }, {
      name: 'mouseupThis',
      type: '(Event -> ()) -> Style',
    }]),
    p('`changeThis` is defined as `onThis("change")`, etc.'),
  ];

  var standardLibraryStreams = [
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
  ];

  var standardLibraryForms = [
    p("Hcj provides some reactive form components for your convenience."),

    h2('FieldKind, FieldType, FormComponent'),
    p('HCJ\'s standard library has an intricate model of form components and their types.  Logically it is based on some basic dependent types, specifically type families.  HCJ\'s model of form types is extensible, so you can add your own types of form elements by extending the `FieldKind` type and then extending the other types as needed.'),
    p('It is not required to understand this model to display individual form components; the examples in the next section should give you a good picture of how to do that.  However, the highly convenient `FormFor` function described in the section after next does depend on these interrelationships, so for that it may be worthwhile to read this section.'),
    h3('FieldKind'),
    p('The instances of the `FieldKind` type correspond with the kinds of form inputs that can be included in your forms.  A `FieldKind` names the kind of form element, but does not have any additional data about its validation or its contents.'),
    p('The `FieldKind` type can be considered a subset of the `String` type - all `FieldKind` values should be strings.  The HCJ standard library supports the following `FieldKind` values:'),
    typeSignatures([{
      name: '"button"',
      type: '',
    }, {
      name: '"checkbox"',
      type: '',
    }, {
      name: '"date"',
      type: '',
    }, {
      name: '"dropdown"',
      type: '',
    }, {
      name: '"file"',
      type: '',
    }, {
      name: '"hidden"',
      type: '',
    }, {
      name: '"number"',
      type: '',
    }, {
      name: '"password"',
      type: '',
    }, {
      name: '"radios"',
      type: '',
    }, {
      name: '"text"',
      type: '',
    }, {
      name: '"textarea"',
      type: '',
    }, {
      name: '"time"',
      type: '',
    }], true, '&nbsp;'),
    h3('FieldType'),
    p('A `FieldType` is a minimal complete description of a form field, from which the field can be rendered.  (It does not include the field\'s `name` attribute.)'),
    p('For each `FieldKind`, the corresponding `FieldType` is constructed differently.  For instance, a text field doesn\'t require any special data to render, while a dropdown requires a set of options.  To represent this logically, we use a type family `FieldType :: FieldKind -> Type`.  In other words, for each `k :: FieldKind`, we have a type `FieldType k`.'),
    p('Each `FieldType k` is constructed in its own particular way.  The `FieldTypes` corresponding to the `FieldKinds` included with HCJ have the following constructors.  These are all properties of the `hcj.forms.fieldType` object:'),
    objectDefinition([{
      name: 'button',
      type: '(String , OnClick) ->',
      description: '`FieldType "button"`',
    }, {
      name: 'checkbox',
      type: '',
      description: '`FieldType "checkbox"`',
    }, {
      name: 'date',
      type: '',
      description: '`FieldType "date"`',
    }, {
      name: 'dropdown',
      type: '[{name: String, value: String}] ->',
      description: '`FieldType "dropdown"`',
    }, {
      name: 'file',
      type: '',
      description: '`FieldType "file"`',
    }, {
      name: 'hidden',
      type: '',
      description: '`FieldType "hidden"`',
    }, {
      name: 'number',
      type: '',
      description: '`FieldType "number"`',
    }, {
      name: 'password',
      type: '',
      description: '`FieldType "password"`',
    }, {
      name: 'radios',
      type: '[String] ->',
      description: '`FieldType "radios"`',
    }, {
      name: 'text',
      type: '',
      description: '`FieldType "text"`',
    }, {
      name: 'textarea',
      type: '',
      description: '`FieldType "textarea"`',
    }, {
      name: 'time',
      type: '',
      description: '`FieldType "time"`',
    }], true, '&nbsp;', true, true),
    p('Most of these "constructors" are not functions, but literal `FieldTypes`.  The only built-in `FieldTypes` that require additional data are `button`, `dropdown`, and `radios`.'),
    p('`button` takes two parameters: the name to display on the button, and an `OnClick` handler.  This `OnClick` handler receives three parameters: the event object, its value stream (which we will get to later), and a `disable` function that disables the button and returns an `enable` function that re-enables it.'),
    p('`dropdown` takes one parameter: an array of objects with `name` and `value` properties giving the options to display.'),
    p('`radios` also takes one parameter: an array of strings giving the values for each radio.'),
    p('All values of type `FieldType k`, for any `k`, are objects that have a `kind` property with value `k`, plus additional properties as needed.'),
    h3('FormComponent'),
    p('Each form element is displayed in a certain way.  Most form elements can be displayed via single components, but `radios` in particular yields multiple radio buttons that you may want to place separately or into a custom layout.'),
    p('Therefore we introduce another type family, `FormComponent :: FieldKind -> Type`.  This type family gives the type that you can expect when you go to render a certain `FieldType` into components suitable for inclusion on a page.'),
    typeSignatures([{
      name: 'FormComponent "button"',
      type: 'Component',
    }, {
      name: 'FormComponent "checkbox"',
      type: 'Component',
    }, {
      name: 'FormComponent "date"',
      type: 'Component',
    }, {
      name: 'FormComponent "dropdown"',
      type: 'Component',
    }, {
      name: 'FormComponent "file"',
      type: 'Component',
    }, {
      name: 'FormComponent "hidden"',
      type: 'Component',
    }, {
      name: 'FormComponent "number"',
      type: 'Component',
    }, {
      name: 'FormComponent "password"',
      type: 'Component',
    }, {
      name: 'FormComponent "radios"',
      type: '[Component]',
    }, {
      name: 'FormComponent "text"',
      type: 'Component',
    }, {
      name: 'FormComponent "textarea"',
      type: 'Component',
    }, {
      name: 'FormComponent "time"',
      type: 'Component',
    }], true, '`&nbsp;=&nbsp;`'),
    p('The `hcj.forms.formComponent` function converts `FieldTypes` into their corresponding `FormComponents`.'),
    p('`hcj.forms.formComponent :: (FormType k , String? , (Stream String)?) -> FormComponent k`'),
    p('There are three parameters: a `FormType k`, a `name` attribute, and a value stream.  The return value is an array of `Components` when passed a "radios" field type, and a single `Component` for all other field types.'),
    p('The value stream is bi-directional: it receives a value whenever the user edits the field, and the field changes whenever the stream receives a new value.  This stream should be used for field validation.'),
  ];

  var standardLibraryFormExamples = [
    p('These form inputs are all created using `hcj.forms.formComponent` function.'),
    h2('Text Input'),
    p('The first and only required argument to the `hcj.forms.formComponent` function is the `FieldType` of the desired form input.'),
    hcj.forms.formComponent(hcj.forms.fieldType.text),
    codeBlock([
      'hcj.forms.formComponent(hcj.forms.fieldType.text)',
    ]),
    h2('Text Input with Name'),
    p('The second argument that you can pass to `hcj.forms.formComponent` is the "name" attribute of your form input.'),
    hcj.forms.formComponent(hcj.forms.fieldType.text, "name"),
    codeBlock([
      'hcj.forms.formComponent(hcj.forms.fieldType.text, "name")'
    ]),
    h2('Text Input with Name and Value Stream'),
    p('The third argument to `hcj.forms.formComponent` is a value stream.  This stream is updated when the input\'s value changes, and vice versa.'),
    hcj.forms.formComponent(hcj.forms.fieldType.text, "name", stream.create()),
    codeBlock([
      'var textValueS = hcj.stream.create();',
      '&nbsp;',
      'return hcj.forms.formComponent(hcj.forms.fieldType.text, "name", textValueS);'
    ]),
    h2('Button'),
    p('A button that increments a counter.'),
    (function (s) {
      // Counter stream, initialized with 0.
      var countStream = hcj.stream.once(0);
      
      // Button field type.
      var incrementCountStreamButton = hcj.forms.fieldType.button('Push Me', function (ev, countStream, disable) {
        hcj.stream.push(countStream, 1 + countStream.lastValue);

        var enable = disable();
        setTimeout(function () {
          enable();
        }, 1000);
      });
      
      // Render the button, followed by the counter.
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft, // Align the button left
        ])(hcj.forms.formComponent(incrementCountStreamButton, 'button', countStream)),
        hcj.component.componentStream(hcj.stream.map(countStream, function (str) {
          return hcj.component.text(str + ' presses');
        })),
      ]);
    })(),
    showCodeBlock([
      '// Create counter stream initialized with 0.',
      'var countStream = hcj.stream.once(0);',
      '&nbsp;',
      '// Button field type.',
      'var incrementCountStreamButton = hcj.forms.fieldType.button(\'Push Me\', function (ev, countStream, disable) {',
      '  hcj.stream.push(countStream, 1 + countStream.lastValue);',
      '&nbsp;',
      '  var enable = disable();',
      '  setTimeout(function () {',
      '    enable();',
      '  }, 1000);',
      '});',
      '&nbsp;',
      '// Render the button, followed by the counter.',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft, // Align the button left',
      '  ])(hcj.forms.formComponent(incrementCountStreamButton, \'button\', countStream)),',
      '  hcj.component.componentStream(hcj.stream.map(countStream, function (str) {',
      '    return hcj.component.text(str + \' presses\');',
      '  })),',
      ']);',
    ]),
    h2('Checkbox'),
    p('A checkbox that controls a text element.'),
    (function (s) {
      var checkedStream = hcj.stream.once(false);

      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.checkbox, 'checkbox', checkedStream)),
        hcj.component.componentStream(hcj.stream.map(checkedStream, function (checked) {
          return hcj.component.text(checked ? 'checked' : 'unchecked');
        })),
      ]);
    })(),
    showCodeBlock([
      'var checkedStream = hcj.stream.once(false);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.checkbox, \'checkbox\', checkedStream)),',
      '  hcj.component.componentStream(hcj.stream.map(checkedStream, function (checked) {',
      '    return hcj.component.text(checked ? \'checked\' : \'unchecked\');',
      '  })),',
      ']);',
    ]),
    h2('Date'),
    p('Date input that controls a text element.'),
    (function () {
      var dateStream = hcj.stream.once(null);
      
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.date, 'date', dateStream)),
        hcj.component.componentStream(hcj.stream.map(dateStream, function (d) {
          return hcj.component.text(d + '');
        })),
      ]);
    })(),
    showCodeBlock([
      'var dateStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.date, \'date\', dateStream)),',
      '  hcj.component.componentStream(hcj.stream.map(dateStream, function (d) {',
      '    return hcj.component.text(d + \'\');',
      '  })),',
      ']);',
    ]),
    h2('Dropdown'),
    p('Text element shows currently selected option'),
    (function () {
      var dropdownStream = hcj.stream.once('a');

      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.dropdown([{
          name: 'A',
          value: 'a',
        }, {
          name: 'B',
          value: 'b',
        }]), 'dropdown', dropdownStream)),
        hcj.component.componentStream(hcj.stream.map(dropdownStream, function (v) {
          return hcj.component.text(v);
        })),
      ]);
    })(),
    showCodeBlock([
      'var dropdownStream = hcj.stream.once(\'a\');',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.dropdown([{',
      '    name: \'A\',',
      '    value: \'a\',',
      '  }, {',
      '    name: \'B\',',
      '    value: \'b\',',
      '  }]), \'dropdown\', dropdownStream)),',
      '  hcj.component.componentStream(hcj.stream.map(dropdownStream, function (v) {',
      '    return hcj.component.text(v);',
      '  })),',
      ']);',
    ]),
    h2('File'),
    p('File with accept="image/*".'),
    (function () {
      var filesStream = hcj.stream.once(null);

      var previewComponentStream = stream.once(c.nothing);

      hcj.stream.map(filesStream, function (files) {
        var file = files && files.length > 0 && files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function (e) {
            stream.push(previewComponentStream, hcj.component.all([
              hcj.component.alignHLeft,
            ])(hcj.component.image({
              src: e.target.result,
            })));
          };
          reader.readAsDataURL(file);
        }
        else {
          stream.push(previewComponentStream, c.nothing);
        }
      });
      
      return hcj.component.stack([
        hcj.component.all([
          c.$attr('accept', 'image/*'),
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.file, 'image', filesStream)),
        hcj.component.componentStream(previewComponentStream),
      ]);
    })(),
    showCodeBlock([
      'var filesStream = hcj.stream.once(null);',
      '&nbsp;',
      ' var previewComponentStream = hcj.stream.once(hcj.component.nothing);',
      '&nbsp;',
      ' hcj.stream.map(filesStream, function (files) {',
      '  var file = files && files.length > 0 && files[0];',
      '  if (file) {',
      '    var reader = new FileReader();',
      '    reader.onload = function (e) {',
      '      hcj.stream.push(previewComponentStream, hcj.component.all([',
      '        hcj.component.alignHLeft,',
      '      ])(hcj.component.image({',
      '        src: e.target.result,',
      '      })));',
      '    };',
      '    reader.readAsDataURL(file);',
      '  }',
      '  else {',
      '    hcj.stream.push(previewComponentStream, hcj.component.nothing);',
      '  }',
      '});',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.$attr(\'accept\', \'image/*\'),',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.file, \'image\', filesStream)),',
      '  hcj.component.componentStream(previewComponentStream),',
      ']);',
    ]),
    h2('Number'),
    p('Text element shows number currently entered into the input.'),
    (function (s) {
      var numberStream = hcj.stream.once(null);

      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.number, 'number', numberStream)),
        hcj.component.componentStream(hcj.stream.map(numberStream, function (number) {
          return hcj.component.text(number + '');
        })),
      ]);
    })(),
    showCodeBlock([
      'var numberStream = hcj.stream.once(null);',
      '&nbsp;',
      ' return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.number, \'number\', numberStream)),',
      '  hcj.component.componentStream(hcj.stream.map(numberStream, function (number) {',
      '    return hcj.component.text(number + \'\');',
      '  })),',
      ']);',
    ]),
    h2('Password'),
    p('Text element shows an asterisk for each character of the password.'),
    (function () {
      var passwordStream = hcj.stream.once(null);

      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.password, 'password', passwordStream)),
        hcj.component.componentStream(hcj.stream.map(passwordStream, function (password) {
          var str = '';
          if (password) {
            for (var i = 0; i < password.length; i++) {
              str += '*';
            }
          }
          return hcj.component.text(str);
        })),
      ]);
    })(),
    showCodeBlock([
      'var passwordStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.password, \'password\', passwordStream)),',
      '  hcj.component.componentStream(hcj.stream.map(passwordStream, function (password) {',
      '    var str = \'\';',
      '    if (password) {',
      '      for (var i = 0; i < password.length; i++) {',
      '        str += \'*\';',
      '      }',
      '    }',
      '    return hcj.component.text(str);',
      '  })),',
      ']);',
    ]),
    h2('Radios'),
    p('Takes an arrary of strings giving the buttons\' unique values.  `hcj.forms.formComponent` returns an array of radio button components, not a single component.'),
    (function () {
      var valueStream = hcj.stream.once(null);
      
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.component.stack(hcj.forms.formComponent(hcj.forms.fieldType.radios(['first', 'second']), 'radios', valueStream))),
        hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {
          return hcj.component.text(v || '');
        })),
      ]);
    })(),
    showCodeBlock([
      'var valueStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.component.stack(hcj.forms.formComponent(hcj.forms.fieldType.radios([\'first\', \'second\']), \'radios\', valueStream))),',
      '  hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {',
      '    return hcj.component.text(v || \'\');',
      '  })),',
      ']);',
    ]),
    h2('Text'),
    (function () {
      var valueStream = hcj.stream.once(null);
      
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.text, 'text', valueStream)),
        hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {
          return hcj.component.text(v || '');
        })),
      ]);
    })(),
    showCodeBlock([
      'var valueStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.text, \'text\', valueStream)),',
      '  hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {',
      '    return hcj.component.text(v || \'\');',
      '  })),',
      ']);',
    ]),
    h2('Textarea'),
    p('Displays content of a textarea.  Double-newline for paragraph break.'),
    (function (s) {
      var valueStream = hcj.stream.once(null);
      
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.textarea, 'textarea', valueStream)),
        hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {
          return v ? stack({
            padding: 10,
          }, v.split(/[\r\n][\r\n]/).map(hcj.component.text)) : hcj.component.nothing;
        })),
      ]);
    })(),
    showCodeBlock([
      'var valueStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.textarea, \'textarea\', valueStream)),',
      '  hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {',
      '    return v ? stack({',
      '      padding: 10,',
      '    }, v.split(/[\r\n][\r\n]/).map(hcj.component.text)) : hcj.component.nothing;',
      '  })),',
      ']);',
    ]),
    h2('time'),
    p('Text element shows the value of the time input.'),
    (function () {
      var valueStream = hcj.stream.once(null);
      
      return hcj.component.stack([
        hcj.component.all([
          hcj.component.alignHLeft,
        ])(hcj.forms.formComponent(hcj.forms.fieldType.time, 'time', valueStream)),
        hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {
          return hcj.component.text(v || '');
        })),
      ]);
    })(),
    showCodeBlock([
      'var valueStream = hcj.stream.once(null);',
      '&nbsp;',
      'return hcj.component.stack([',
      '  hcj.component.all([',
      '    hcj.component.alignHLeft,',
      '  ])(hcj.forms.formComponent(hcj.forms.fieldType.time, \'time\', valueStream)),',
      '  hcj.component.componentStream(hcj.stream.map(valueStream, function (v) {',
      '    return hcj.component.text(v || \'\');',
      '  })),',
      ']);',
    ]),
  ];

  var standardLibraryFormFor = [
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
    p("Second, `types` the data model and optionally `names` the field names.  The first parameter `types` is an object whose values are form types.  The second parameter `names` is an object whose values are strings - except for `radio`, in which case the value must be an object with a String `name` property and a [String] `options` property."),
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
  ];

  var standardLibraryColors = [
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
  ];

  var standardLibraryJso = [
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
  ];

  var csIsNotAFunction = [
    p("Might be the most common error message you're going to get using this library.  Very uninformative, sorry."),
  ];

  var version2 = [
    p('Improve text measurement by using the canvas measureText method instead of the current strategy of appending the text to an invisible dom element.  Use this to implement a float left/right layout.'),
    p('Figure out how to integrate CSS transitions properly.'),
    p('Remove JQuery dependency, making hcj smaller and more agnostic.'),
    p('Add more comments.'),
    p('Turing-complete JSON subset that can be evaluated server-side to HTML/CSS and client-side to an HCJ component.'),
  ];

  var support = [
    p("Join #hcj on Freenode, or leave a message on the Github repository.  We can't promise that HCJ is the best implementation of what we're going for, nor that we will be the best maintainers of it, but if you should submit an issue or make a pull request we will make some kind of effort to address it properly."),
    p('<iframe src="https://kiwiirc.com/client/irc.freenode.net/?&theme=basic#hcj" style="border:0; width:100%; height:450px;"></iframe>'),
  ];

  var testPage = [
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
    c.sideBySide({
      padding: 10,
    }, [
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
        c.backgroundColor(hcj.color.create({
          r: 10,
          g: 0,
          b: 10,
        })),
        c.minWidth(20),
      ])(c.bar.v(200)),
    ]),
    showCodeBlock([
      'c.sideBySide({',
      '  padding: 10,',
      '}, [',
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
      '    c.backgroundColor(hcj.color.create({',
      '      r: 10,',
      '      g: 0,',
      '      b: 10,',
      '    })),',
      '    c.minWidth(20),',
      '  ])(c.bar.v(200)),',
      ']);',
    ]),
    h2('Show a stream of components.  Text is changed each time you press the button'),
    c.scope(function () {
      var generateRandomLetters = function (count) {
        var result = '';
        for (var i = 0; i < count; i++) {
          result += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        }
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
  ];

  var pages = [{
    title: "Home",
    components: introduction,
  }, {
    title: 'Hello World',
    components: renderingComponents,
  }, {
    title: 'Introduction',
    components: aLittleVocab,
  }, {
    title: 'API - Components',
    components: standardLibraryComponents,
  }, {
    title: 'API - Layouts',
    components: standardLibraryLayouts,
  }, {
    title: 'API - Styles',
    components: standardLibraryComponentModifiers,
  }, {
    title: 'API - Forms',
    components: standardLibraryForms,
  }, {
    title: 'API - Forms Examples',
    components: standardLibraryFormExamples,
  }, {
    title: 'API - FormFor',
    components: standardLibraryFormFor,
  }, {
    title: 'API - Colors',
    components: standardLibraryColors,
  }, {
    title: 'Examples',
    components: testPage,
  }, {
    title: 'Streams',
    components: standardLibraryStreams,
  }, {
    title: 'Defining Componentss',
    components: definingComponents,
  }, {
    title: 'Defining Layouts',
    components: definingLayouts,
  }, {
    title: 'Community',
    components: support,
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
    c.margin(10),
    c.border(color.lightGray, {
      right: 1,
      bottom: 1,
    }),
  ])(docStack([
    c.all([
      c.alignHLeft,
    ])(c.image({
      src: './demo.png',
      minWidth: 240,
      alt: 'HCJ Logo',
    })),
    c.bar.h(20),
    stack(pages.map(function (p, i) {
      return c.all([
        c.margin(2),
        c.linkTo(window.location.origin + window.location.pathname + '#' + i),
        c.backgroundColor({
          background: stream.map(currentPageS, function (index) {
            return index === i ? color.lightGray : color.lighterGray;
          }),
          backgroundHover: color.lightGray,
        }),
      ])(c.text(p.title, font.p0));
    })),
  ]));

  var docs = c.all([
    c.minHeightAtLeast(stream.windowHeight),
    c.backgroundColor({
      background: color.lighterGray,
      font: color.notBlack,
    }),
  ])(c.componentStream(stream.map(currentPageS, function (index) {
    var page = pages[index];
    return c.basicFloat({
      padding: 10,
      // clearHanging: true,
    }, sidebar, [
      h1m('hcj.js'),
      pm('v0.2.1 alpha'),
      pm('It could be worse.'),
      h1m(page.title),
    ].concat(page.components));
  })));

  window.hcj.rootComponent(docs);
});
