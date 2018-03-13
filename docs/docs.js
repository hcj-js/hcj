(function () {
  var hcj = window.hcj;

  var id = hcj.funcs.id;

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


  var mapMinWidths = function (is) {
    return stream.all(is.map(function (i) {
      return i.minWidth;
    }));
  };
  var mapMinHeights = function (is) {
    return stream.all(is.map(function (i) {
      return i.minHeight;
    }));
  };
  var useMinWidth = function (ctx, i) {
    return stream.pushAll(i.minWidth, ctx.width);
  };
  var useMinHeight = function (ctx, i) {
    return stream.combineInto([
      ctx.width,
      i.minHeight,
    ], function (w, mh) {
      return mh(w);
    }, ctx.height);
  };
  var dropdownPanels = function (items, config) {
    config = config || {};
    config.transition = config.transition || 0;
    config.align = config.align || 'left';
    var sources = items.map(function (item) {
      return item.source;
    });
    var panels = items.map(function (item) {
      return item.panel;
    });
    return c.layout(function (el, ctx, sources, panels) {
      el.classList.add('dropdown-panels');
      var panelCtxs = [];
      var sourceCtxs = [];
      var panelIs = [];
      var sourceIs = [];
      for (var i = 0; i < panels.length; i++) {
        var panelCtx = {
          top: stream.create(),
          height: stream.create(),
          left: stream.create(),
          width: stream.create(),
        };
        var sourceCtx = {
          left: stream.create(),
          width: stream.create(),
        };
        panelCtxs.push(panelCtx);
        sourceCtxs.push(sourceCtx);
        var panelI = panels[i](panelCtx);
        var sourceI = sources[i](sourceCtx);
        useMinWidth(panelCtx, panelI);
        useMinHeight(panelCtx, panelI);
        useMinWidth(sourceCtx, sourceI);
        stream.pushAll(ctx.height, panelCtx.top);
        panelIs.push(panelI);
        sourceIs.push(sourceI);
      }
      var panelMinWidths = mapMinWidths(panelIs);
      var panelMinHeights = mapMinHeights(panelIs);
      var sourceMinWidths = mapMinWidths(sourceIs);
      var sourceMinHeights = mapMinHeights(sourceIs);
      var loopStart;
      var loopInc;
      switch (config.align) {
      case 'left':
        loopStart = 0;
        loopInc = 1;
        break;
      case 'right':
        loopStart = items.length - 1;
        loopInc = -1;
        break;
      }
      stream.combine([
        ctx.width,
        ctx.left,
        hcj.viewport.widthS,
        sourceMinWidths,
        panelMinWidths,
      ], function (w, lo, ww, sourceMWs, panelMWs) {
        var left;
        switch (config.align) {
        case 'left':
          left = 0;
          break;
        case 'right':
          left = w;
          break;
        }
        for (var i = loopStart; i >= 0 && i < items.length; i += loopInc) {
          switch (config.align) {
          case 'left':
            stream.push(sourceCtxs[i].left, left);
            if (lo + left + panelMWs[i] <= ww) {
              stream.push(panelCtxs[i].left, left);
            }
            else {
              stream.push(panelCtxs[i].left, ww - lo - panelMWs[i]);
            }
            left += sourceMWs[i];
            break;
          case 'right':
            stream.push(sourceCtxs[i].left, left - sourceMWs[i]);
            if (lo + left >= panelMWs[i]) {
              stream.push(panelCtxs[i].left, left - panelMWs[i]);
            }
            else {
              stream.push(panelCtxs[i].left, -lo);
            }
            left -= sourceMWs[i];
            break;
          }
        }
      });
      return {
        minWidth: stream.combine([
          sourceMinWidths,
        ], function (mws) {
          return mws.reduce(function (a, mw) {
            return a + mw;
          }, 0);
        }),
        minHeight: stream.combine([
          sourceMinHeights,
        ], function (mhs) {
          return function (w) {
            return mhs.reduce(function (a, mh) {
              return Math.max(a, mh(w));
            }, 0);
          };
        }),
      };
    })(sources, panels.map(function (panel, idx) {
      return c.layout(function (el, ctx, panel) {
        el.style.overflow = 'hidden';
        var context = {
          top: stream.combine([
            items[idx].onOffS,
            ctx.height,
          ], function (on, h) {
            return on ? 0 : -h;
          })
        };
        if (config.panelHeightS) {
          stream.pushAll(context.height, config.panelHeightS);
        }
        var i = panel(context);
        hcj.transition(i, 'top ', config.transition + 's');
        return i;
      })(panel);
    }));
  };

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
      size: 40 + 'px',
      weight: 'bold',
    },
    h2: {
      family: 'sans-serif',
      size: 30 + 'px',
    },
    h3: {
      family: 'sans-serif',
      size: 20 + 'px',
    },
    p: {
      family: 'sans-serif',
      size: 15 + 'px',
    },
    p0: {
      minWidth: 100,
      family: 'sans-serif',
      size: 15 + 'px',
    },
    code: {
      family: 'monospace',
      size: 15 + 'px',
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
      return hcj.funcs.extend({
        str: s,
      }, font.code);
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

  String.prototype.repeat = String.prototype.repeat || function (n) {
    var result = '';
    for (var i = 0; i < n; i++) {
      result += this;
    }
    return result;
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
        pm((noBullet ? '`' : '&#8226;&nbsp;`') + prop.name + '&nbsp;'.repeat(maxPropLength - prop.nameLength) + ' :: ' + prop.type + '&nbsp;'.repeat(maxTypeLength - prop.typeLength) + '`'),
        c.all([
          noGray ? hcj.funcs.id : c.backgroundColor({font: color.gray}),
        ])(c.sideBySide({
          surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
        }, [
          pm('`' + (commentString || '&nbsp;&nbsp;') + '`'),
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
        surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
      }, [
        pm((noBullet ? '`' : '&#8226;&nbsp;`') + sig.name + '&nbsp;'.repeat(maxPropLength - sig.name.length) + '`'),
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

  var introduction = function () {
    return [
      p("HCJ is a whole new way to write programs for the browser.  The browser is essentially a virtual machine, just like the JVM.  It just has HTML, CSS, and Javascript bytecode instead of Java bytecode."),
      p("Like any language or runtime, the browser has good parts and bad parts.  HTML declares the static content on the site for search engines to index and text-only browsers to display.  Javascript is a full, turing-complete programming language, which can make pages snazzy and interactive.  CSS, by comparison, the red-headed stepchild.  Like HTML, it is total, however search engines generally have no need to index it, since affects how the content is displayed, but does not change the content that is on the page."),
      p("Because CSS is total, it can be difficult to write CSS programs that caues your page to be displayed just how you want.  CSS provides an enormous zoo of styles that place elements in various ways, including `position` styles, `float` styles, and `display` styles including `block`, `inline-block`, `table`, `grid`, and `flexbox` - in addition to styles that modify the box-sizing properties of individual elements, such as `margin`, `padding`, and `border`.  Each of these styles has a certain set of capabilities.  With css3 flexbox and grid, the capabilities are clearly improving, however there are always layouts that cannot be expressed without Javascript.  Generally speaking, as a CSS programmer one learns a set of incantations to create whatever display mode your designer asks for, and then in 5 years a new feature comes out, invalidating your spellbook, at which point you must begin to write a new one."),
      p("HCJ breaks this cycle.  An HCJ website does not contain any CSS at all.  All styling and positioning is done through javascript.  An interface is specified wherein children report their \"minimum dimensions\" to parents, and then parents report \"actual dimensions\" to their children.  Any function implementing this interface can be used with HCJ.  Almost all current CSS styles have corresponding HCJ layouts in our standard library, and if you need a layout that is not implemented, you can simply write a function implementing the proper interface, and use that as your style."),
      p("Imagine if you could <i>implement</i> flexbox, grid, or even your own display styles, and use them in your websites right now, without waiting for browser support to come along and without worrying about fallbacks or polyfills.  This is exactly what HCJ is for.  Basically, HCJ is a \"polyfill\" for all current and future CSS styles.  More fundamentally, HCJ is not a library at all, but simply an interface.  Any functions implementing this interface can mutually interoperate."),
      p("The framework's building blocks, \"HCJ components\", are extraordinarily composable, compared to standard CSS.  Any component at any level can be rendered as a web page, making debugging and testing very simple.  Components respond to the size and shape of the page region they are rendered into, making mobile-responsive design trivially easy as \"media queries\" are embedded into each and every component as needed, and rearranging your page as easy as copy and paste."),
      p("Source: <a href=\"https://github.com/hcj-js/hcj\">https://github.com/hcj-js/hcj</a>"),
    ];
  };

  var aLittleVocab = function () {
    return [
      p("The basic building block of the HCJ framework is the `component`.  Components can be rendered as web pages, or combined together to create new components."),
      p("A `component` is any function taking a `context` and returning an `instance`.  To `render` a component is to pass it a context."),
      p("Additionally, in HCJ terminology, a `layout` is a function that takes one or more components, and returns a new component.  A `style` is a function that takes exactly one component and returns a component.  Therefore, all styles are layouts."),
      docStack2([
        p("Specifically, a `context` has all of the following properties:"),
        objectDefinition([{
          name: 'el',
          type: 'Node',
          description: 'Parent element of the instance.',
        }, {
          name: 'width',
          type: 'Stream Number',
          description: 'Width of the instance.',
        }, {
          name: 'height',
          type: 'Stream Number',
          description: 'Height of the instance.',
        }, {
          name: 'left',
          type: 'Stream Number',
          description: 'Left position of the instance relative to the page.',
        }, {
          name: 'top',
          type: 'Stream Number',
          description: 'Top position of the instance relative to the page.',
        }]),
      ]),
      docStack2([
        p('An `instance` is an object with all of the following properties:'),
        objectDefinition([{
          name: 'el',
          type: 'Node',
          description: 'Root element of the instance, appended to the `el` node of the context.',
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
          description: 'Removes the instance from the page.',
        }]),
      ]),
      p('A component must create a DOM node, append it to the `el` node of the passed-in context, and return it as the `el` property of the instance, each time it is rendered.'),
      p('Whenever you render a component, you must inform it of its width, height, page-relative top, and page-relative left positions via the context it is passed.  This way, it can display itself in a mobile- (and more generally container-) responsive way.'),
      p('To position the instance, you may set its node\'s `width`, `height`, `top`, `left`, and `position` styles; the instance itself owns all other styles.  The `position` style may not be set to `static`: it must be set to `absolute`, `relative`, or `fixed`, so that the instance can reliably position its own children.'),
      p('The instance\'s `minWidth` property is a stream of numbers giving the minimum width that the instance reports it needs to display sanely.  This is used by its rendering code to give it as much space as it needs.  Likewise, `minHeight` is a stream of functions that, given a hypothetical width, return the height required by the instance at that width.'),
      p('The `remove` property of the instance is a function that removes its `el` node from the DOM and performs any other cleanup required by the instance, such as closing open connections.'),
    ];
  };

  var libraryModules = function () {
    return [
      p('The HCJ library pollutes the global window object with the `hcj` object.  Each module is a property of this object.  HCJ modules include:'),
      stack([
        p('&#8226; component: Functions that return components.'),
        p('&#8226; element: Some helper methods for creating custom components.'),
        p('&#8226; rootComponent: The function that bootstraps a component onto a page.'),
        p('&#8226; stream: The hcj stream library.'),
      ]),
    ];
  };

  var definingComponents = function () {
    return [
      p("One of the core tenents of HCJ is that it should be easy to define new and custom components and layouts.  Again, HCJ is fundamentally just an interface: any functions that implement this interface can interoperate together.  There are some things that virtually all components will do exactly the same way, so we provide a helper method, `hcj.component.component`, for defining new components."),
      p("`component :: (String? , BuildComponent) -> Component`"),
      p('Where `BuildComponent` is defined as:'),
      p("`type BuildComponent = (Node, Context, MeasureWidth, MeasureHeight) -> {minWidth :: Stream Number?, minHeight :: Stream (Number -> Number)?, remove :: Function?}`"),
      p('The `component` function takes two arguments: an optional tag name, followed by a `build` method.  If the tag name is not specified, it defaults to `div`.  The build method initializes the component, and provides its minimum dimensions.  It is passed four arguments: first `el`, the created root node of the component, and `context`, the context as it was passed into the component.  The remaining two arguments are a `MeasureWidth` function and a `MeasureHeight` function, as explained below.  It returns a "pre-instance", which the `component` function upgrades to a full `instance`.'),
      p("The build method can provide the minimum dimensions one of two ways.  It can either call the `MeasureWidth` and `MeasureHeight` functions that it is passed, or (perhaps more commonly) return an object with `minWidth` and `minHeight` properties.  If it calls `MeasureWidth`, its width is measured by cloning the root element, appending it to an invisible sandbox, and reading off various computed DOM styles, and this number is pushed into its `minWidth` stream.  Similarly, if it calls `MeasureHeight`, a function is pushed into its `minHeight` stream that clones the element, appends it to an invisible sandbox, sets its width, measures its height at that width, and returns that height."),
      h3("Example:"),
      codeBlock([
        "// SomeCaptcha component",
        "&nbsp;",
        "var c = hcj.component;",
        "var stream = hcj.stream;",
        "&nbsp;",
        "var captcha = c.component(function (el, context, mw, mh) {",
        "  mw();",
        "  mh();",
        "  var someCaptcha = SomeCaptcha.render(el);",
        "  someCaptcha.promise.then(function () {",
        "    mw();",
        "    mh();",
        "  });",
        "  return {",
        "    remove: function () {",
        "      someCaptcha.remove();",
        "    },",
        "  };",
        "});",
      ]),
      p('The width and height are measured when the captcha component is first rendered, yielding 0 for each.  The 3rd party captcha is rendered into the component\'s root element.  Once the captcha is fully rendered, the width and height are measured again.  Whenever the instance is removed, the captcha is removed first.'),
    ];
  };

  var renderingComponents = function () {
    return [
      p('To help you get started, here is an absolutely minimal HCJ page, which you can modify with the components and layouts described in the next sections:'),
      codeBlock([
        "&lt;html&gt;",
        "    &lt;head&gt;",
        "        &lt;link rel=\"stylesheet\" type=\"text/css\" href=\"hcj.css\"&gt;",
        "    &lt;/head&gt;",
        "    &lt;body&gt;",
        "        &lt;script src=\"hcj.min.js\"&gt;&lt;/script&gt;",
        "&nbsp;",
        "        &lt;script&gt;",
        "         var page = hcj.component.text('Hello World');",
        "         var rootInstance = hcj.rootComponent(page);",
        "        &lt;/script&gt;",
        "    &lt;/body&gt;",
        "&lt;/html&gt;",
      ]),
      p("The page includes two external files, `hcj.css` and `hcj.js`.  The hcj.css file contains a CSS reset.  The hcj.js file contains all of the HCJ framework code.  This file must be included in the body section, not the head section, because it depends on the body element being present for some internal initialization.  Then, inside a `script` tag section, the page defines a component and renders it."),
      p("To render a component, you must pass it to the `hcj.rootComponent` function.  This function places your component in the top-left corner of the window and gives it the window\'s height and width, and returns the instance.  Rendering into a smaller region is not currently supported.  Multiple root components can be used, e.g. to display full-window modal dialogs if you wish."),
      p("Fonts are a particular issue for HCJ websites.  Because fonts can change the size taken up by text, text-based components must set their minimum dimensions after fonts are loaded.  It is an unfortunate reality that there are no DOM callbacks that are run when fonts are loaded, so HCJ is shipped with a `window.waitForWebfonts` function.  We recommend that you use this function to run your page after all fonts are loaded.  The `waitForWebfonts` function takes three arguments: an array of font families to wait for (these should be defined using @font-face CSS rules), a callback to run when they are all loaded, and an optional max time to wait in the event that a font never loads, which defaults to 10 seconds."),
    ];
  };

  var definingLayouts = function () {
    return [
      p("The `hcj.component.container` method is a helper method for defining layouts.  It takes an optional string argument giving tag name of the container, followed by a build method."),
      p("`container :: (String? , BuildContainer) -> Component`"),
      p("`type BuildContainer = (JQuery, Context, Append) -> {minWidth :: Number, minHeight :: Stream (Number -> Number), remove :: Function?}`"),
      p("`type Append = (Component, Viewport?, Bool?) -> Instance`"),
      p("The build method takes three arguments.  The first two, `el` and `context`, are the root element of the container and the context that it is rendered into.  The third argument, `append`, is used to append child components to the container."),
      p("The `append` function takes three arguments: the `Component` to append, a `Viewport`, and a `noRemove` flag."),
      p("The first argument is self-explanatory.  The second argument, `viewport`, is an object that is upgraded to a `context` and then passed into the component being appended.  The `noRemove` flag causes the `remove` function of the returned `instance` not to be run when the container itself is removed.  This should be set to true if you intend the remove the instance yourself, typically at an earlier time than when the container is removed."),
      p('A `Viewport` is an object with the following properties:'),
      objectDefinition([{
        name: 'el',
        type: 'Node',
        description: 'Element to append instance to.  Defaults to the container\'s own root element.',
      }, {
        name: 'width',
        type: 'Stream Number',
        description: 'Stream giving the width of the rendered instance.  Defaults to container width.',
      }, {
        name: 'height',
        type: 'Stream Number',
        description: 'Stream giving the height of the rendered instance.  Defaults to container width.',
      }, {
        name: 'top',
        type: 'Stream Number',
        description: 'Stream giving the top coordinate of the rendered instance, relative to the container.  Defaults to 0.',
      }, {
        name: 'left',
        type: 'Stream Number',
        description: 'Stream giving the left coordinate of the rendered instance.  Defaults to 0.',
      }, {
        name: 'widthCalc',
        type: 'Stream String',
        description: 'CSS calc string to use for the width property of the instance.  This is a "calc-sum" - the "calc(" and ")" are added by `container`.  If not provided, then "px" is appended to the values of the viewport\'s `width` stream.',
      }, {
        name: 'heightCalc',
        type: 'Stream String',
        description: 'CSS calc string to use for the height property of the instance.  This is a "calc-sum" - the "calc(" and ")" are added by `container`.  If not provided, then "px" is appended to the values of the viewport\'s `height` stream.',
      }, {
        name: 'topCalc',
        type: 'Stream String',
        description: 'CSS calc string to use for the top property of the instance.  This is a "calc-sum" - the "calc(" and ")" are added by `container`.  If not provided, then "px" is appended to the values of the viewport\'s `top` stream.',
      }, {
        name: 'leftCalc',
        type: 'Stream String',
        description: 'CSS calc string to use for the left property of the instance.  This is a "calc-sum" - the "calc(" and ")" are added by `container`.  If not provided, then "px" is appended to the values of the viewport\'s `left` stream.',
      }]),

      h2('Example - Top Margin'),
      p('`topMargin :: Component -> Component`'),
      p("Here is an example of a layout that pushes its content down by five pixels.  To do this, it creates a viewport with a `top` stream, and returns a `minHeight` that is increased by five pixels."),
      codeBlock([
        "var c = hcj.component",
        "&nbsp;",
        "var topMargin = function (c) {",
        "  return c.container(function (el, ctx, append) {",
        "    var instance = append(c, {",
        "      top: stream.once(5),",
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
      p("Imagine we want to define a layout that adds a 10px margin and gives a component a purple background.  Here's how we can do it.  Note that there is no use of CSS `margin` or `padding` properties - the child instance is explicitly positioned in a sub-region of the container, and the container's minimum width and minimum height are increased correspondingly.  For completeness, we include `widthCalc` and `heightCalc` streams, which are required in order for any CSS transitions to work properly."),
      codeBlock([
        "var purpleBackground = function (c) {",
        "  return c.container(function (el, context, append) {",
        "    el.style.backgroundColor = '#FF00FF';",
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
        "      widthCalc: stream.once('100% - 20px'),",
        "      heightCalc: stream.once('100% - 20px'),",
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
      p("First we map over the components provided, initializing an array of viewports and an array of instances.  Next, we use the HCJ stream library to change the components' viewports every time the stack's context changes.  Last, we assign the minimum width and minimum height of the stack by combining together the minimum widths and minimum heights of the stacked instances."),
      codeBlock([
        "var stack = function (cs) {",
        "  return c.container(function (el, context, append) {",
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
        "    var instanceMinWidthsS = stream.all(instances.map(function (i) {",
        "      return i.minWidth;",
        "    }));",
        "    var instanceMinHeightsS = stream.all(instances.map(function (i) {",
        "      return i.minHeight;",
        "    }));",
        "  &nbsp;",
        "    stream.combine([",
        "      context.width,",
        "      context.height,",
        "      instanceMinHeightsS,",
        "    ], function (w, h, mhs) {",
        "      var top = 0;",
        "      mhs.map(function (mh, index) {",
        "        var viewport = viewports[index];",
        "        var height = mh(w);",
        "        stream.push(viewport.top, top);",
        "        stream.push(viewport.height, height);",
        "        top += height;",
        "      });",
        "    });",
        "  &nbsp;",
        "    return {",
        "      minWidth: stream.map(instanceMinWidthsS, function (mws) {",
        "        return mws.reduce(function (a, b) {",
        "          return Math.max(a, b);",
        "        }, 0);",
        "      }),",
        "      minHeight: stream.map(instanceMinHeightsS, function (mhs) {",
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
  };

  var standardLibraryElements = function () {
    return [
    ];
  };

  var standardLibraryComponents = function () {
    return [
      p('These are the basic components that ship with hcj.js.'),
      p('Each of these is a property of `window.hcj.component`.'),
      p('There is a Haskell-esque "type signature" below each, showing the parameters that each function can take, followed by a description.  This "type signature" borrows syntax from Haskell and C#, and uses some new shorthand specifically for Javascript.  The function arrow `->` is borrowed from Haskell; `a -> b` is a function taking a parameter of type `a` and returning type `b`.  Additionally, `(a , b) -> c` denotes a two-argument function, while `(a ; b) -> c` denotes a two-argument function that can be curried, i.e. `f :: (a ; b) -> c` can be called either as `f(x, y)` or as `f(x)(y)`.  The type `a?`, is shorthand for `Maybe a`, denoting "Either an `a` or the value `undefined`".  And `a | b` denotes a variable that can have type `a` or type `b`.'),

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
          description: 'Specifies the minimum width of the text component, overriding 300px default.',
        }, {
          name: 'measureWidth',
          type: 'Bool?',
          description: 'If set, the text element is measured and its measurement becomes its minimum width, overriding 300px default.',
        }, {
          name: 'minHeight',
          type: 'Number?',
          description: 'Specifies the minimum height of the text component as a constant number, overriding `measureHeight` default.',
        }, {
          name: 'oneLine',
          type: 'Bool?',
          description: 'Declares that the text component is always one line tall.  Its minimum height is calculated from its font size and line height, overriding `measureHeight` default.',
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
        description: 'If present, minimum width is set to this number instead of the image\'s natural width.',
      }, {
        name: 'minHeight',
        type: 'Number?',
        description: 'If present, minimum width of image is set to the quotient of this number and the image\'s aspect ratio.',
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
        type: '{[h, x]: Number, [v, y]: Number} -> Component',
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
  };

  var standardLibraryLayouts = function () {
    return [
      p('These are the layouts that ship with hcj.js.  All are properties of the `window.hcj.component` object.'),

      h2('AlignHorizontal'),
      typeSignatures([{
        name: 'alignHorizontal',
        type: '{l: Component?, r: Component?, m: Component?} -> Component',
      }, {
        name: 'alignHLeft',
        type: 'Style',
      }, {
        name: 'alignHRight',
        type: 'Style',
      }, {
        name: 'alignHMiddle',
        type: 'Style',
      }]),
      p('Takes an object with optional `l`, `r`, and `m` properties.  Aligns elements left, right, and middle.'),
      p('`alignH` and `alignLRM` are both aliases for `alignHorizontal`.'),
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

      h2('AlignVertical'),
      typeSignatures([{
        name: 'alignVertical',
        type: '{t: Component?, b: Component?, m: Component?} -> Component',
      }, {
        name: 'alignVTop',
        type: 'Style',
      }, {
        name: 'alignVBottom',
        type: 'Style',
      }, {
        name: 'alignVMiddle',
        type: 'Style',
      }]),
      p('Takes an object with optional `t`, `b`, and `m` properties.  Aligns elements top, bottom, and middle.'),
      p('`alignV` and `alignTBM` are both aliases for `alignVertical`.'),
      docStack2([
        p('Example:'),
        codeBlock([
          "var logo = hcj.component.image({src: 'logo.png'});",
          "var menu = hcj.component.text('menu');",
          "&nbsp;",
          "var header = hcj.component.alignV({",
          "  t: logo,",
          "  b: menu,",
          "});",
        ]),
      ]),

      h2('BasicFloat'),
      p('`basicFloat :: (BasicFloatConfig? ; Component , [Component]) -> Component'),
      p('Takes a single component to "float", and an array of components to display around it.'),
      p('A `BasicFloatConfig` is an object with the following properties:'),
      objectDefinition([{
        name: 'padding',
        type: 'Number?',
        description: 'Padding amount between components.  Padding is also applied around the outsides of the stacked components, but not around the outside of the floating component.',
      }, {
        name: 'clearHanging',
        type: 'Bool?',
        description: 'If set, then the first component that extends below the floating component will be "cleared", i.e. placed entirely below the floating component.',
      }, {
        name: 'float',
        type: 'String?',
        description: 'If set to "right" floating component floats right, if "left" floating component floats left.  Default is "left".',
      }]),
      
      h2('ComponentStream'),
      p('`componentStream :: Stream Component -> Component`'),
      p('Takes an hcj stream of components and displays latest one in the stream.'),
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
        description: 'If set, the grid\'s minimum width is computued as the sum of the minimum widths of the child components, rather than as the largest of the minimum widths of the child components.',
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
      p('The minimum width of a `sideBySide` is the sum of the minimum widths of its children, plus any padding.  Its minimum height is the max of the minimum heights of its children at their respective minimum widths.'),
      p('A `SideBySideConfig` may have the following properties:'),
      objectDefinition([{
        name: 'padding',
        type: 'Number?',
        description: 'Padding amount between components.',
      }, {
        name: 'surplusWidthFunc',
        type: 'SurplusWidthFunc?',
        description: 'Distribute surplus width among the instances.',
      }]),
      h3('SurplusWidthFunc'),
      p('`type SurplusWidthFunc = (Number , [[{left: Number, width: Number}]]) -> [[{left: Number, width: Number}]]`'),
      p('Whenever the width of a row is greater than its minimum width, it has surplus width.  A `SurplusWidthFunc` takes two parameters: the total width available, and an array of "rows" - each an array of "columns".  (The `sideBySide` layout always passes in exactly one "row", but other layouts may pass in more.)  Each column is an object with `left` and `width` properties giving the initial left position and width of the column.  The function returns an array of rows (possibly by mutating the input array) giving each column new left and width values.'),
      p('HCJ comes with a number of `SurplusWidthFuncs` for you to use.  These are all members of the `window.hcj.funcs.surplusWidth` object:'),
      objectDefinition([{
        name: 'ignore',
        type: 'SurplusWidthFunc',
        description: 'Returns input columns.',
      }, {
        name: 'center',
        type: 'SurplusWidthFunc',
        description: 'Centers columns horizontally.',
      }, {
        name: 'evenSplit',
        type: 'SurplusWidthFunc',
        description: 'Evenly splits each row\'s surplus width among its columns, increasing their widths each by the same amount.',
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
        description: 'Centers the largest row.  All other rows are left-aligned to it.',
      }]),
      p('Note that unlike a `SurplusHeightFunc`, which only operates on a single column of elements, a `SurplusWidthFunc` operates on multiple rows at once.'),

      h2('Stack'),
      p('`stack :: (StackConfig? ; [Component]) -> Component`'),
      p('Positions components one on top of another.  The minimum width of a stack is the max of the minimum widths of its children.  The minimum height of a stack is the sum of the minimum heights of its children.'),
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
      h3('SurplusHeightFunc'),
      p('Whenever the height given to a column of components is greater than the sum of their minimum heights, the column has surplus height.  A `SurplusHeightFunc` takes two parameters: the total height available, and an array of "rows", each an object with a `top` and a `height` property initialized with its top position and height.  It returns an array of rows (possibly by mutating the input array) giving new top and height values for each row.'),
      p('`type SurplusHeightFunc = (Number , [{top: Number, height: Number}]) -> [{top: Number, height: Number}]`'),
      p('HCJ comes with a small number of `SurplusHeightFunc`s for you to use.  These are all members of the `window.hcj.funcs.surplusHeight` object:'),
      objectDefinition([{
        name: 'ignore',
        type: 'SurplusHeightFunc',
        description: 'Returns input column.',
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
  };

  var standardLibraryComponentModifiers = function () {
    return [
      p('While the layouts in the previous section place multiple components together in various arrangements, the styles in this section apply to a single component, generally glitzing it up.'),
      p('These styles are all properties of the `window.hcj.component` object.'),
      p('Again, a style is a function that takes one component and returns a component, so the type `Style` is equivalent to the type `Component -> Component`.'),

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
        "])(text('Title'));",
      ]),

      h2('And'),
      p('`and :: ((Instance , Context) -> ()) -> Style`'),
      p('The `hcj.component.and` style lets you arbitrarily operate on an instance and read from its context.  It takes a function that takes an instance and a context, and returns a style.  This function may modify or re-assign any properties of the instance object.'),
      p('Example:'),
      codeBlock([
        "var turnBlue = and(function (i) {",
        "  i.el.style.backgroundColor = 'blue';",
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
      p('`linkTo :: LinkToConfig -> Style`'),
      p('Wraps component it in an `a` tag with the given href.'),
      docStack2([
        p('A `LinkToConfig` is an object with the following properties:'),
        objectDefinition([{
          name: 'href',
          type: 'String',
          description: 'Link href.',
        }, {
          name: 'target',
          type: 'String?',
          description: 'Link target.',
        }, {
          name: 'defaultStyle',
          type: 'Bool?',
          description: 'If set, uses browser\'s default color and text decoration for the link instead of leaving the link completely unstyled.',
        }]),
      ]),

      c.makeSticky(h2('MakeSticky')),
      p('`makeSticky :: (Number | Stream Number)? -> Style`'),
      p('Causes a component to stick to the top of the screen instead of scrolling off.'),
      p('A number, or a stream of numbers, can be optionally passed in before applying `makeSticky` to a component.  The component will then become sticky before it scrolls off the screen, at a distance from the top of the screen equal to the number you pass in.  (This can be useful for layering sticky items on top of one another, by passing the context height of the first into the makeSticky style of the second.)'),

      h2('Margin'),
      typeSignatures([{
        name: 'margin',
        type: 'MarginConfig -> Style',
      }]),
      p('Adds some space around a component.'),
      p('`padding` is an alias for `margin`.'),
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
      typeSignatures([{
        name: 'minHeight',
        type: '(Number -> Number) -> Style',
      }, {
        name: 'minHeightAtLeast',
        type: '(Number | Stream Number) -> Style',
      }]),
      p('Overrides the minimum height of a component.'),
      p('The `minHeight` function takes a minimum height function and sets the component\'s minimum height to that function.'),
      p('The `minHeightAtLeast` function takes a number or a stream of numbers and ensures that the minimum height of a component is at least that amount.'),

      h2('MinWidth'),
      typeSignatures([{
        name: 'minWidth',
        type: 'Number -> Style',
      }, {
        name: 'minWidthAtLeast',
        type: '(Number | Stream Number) -> Style',
      }]),
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
      p('`changeThis` is defined as `onThis("change")`, and so on.'),

      h2('OverflowHorizontal'),
      p('`overflowHorizontal :: OverflowHorizontalConfig -> Style`'),
      p('Displays a horizontal scrollbar beneath a component, if its width is less than its minimum width.  Overrides the component\'s minimum width.'),
      objectDefinition([{
        name: 'minWidth',
        type: 'Number',
        description: 'Minimum width of the overflowHorizontal component.',
      }]),

      h2('ToggleHeight'),
      p('`toggleHeight :: Stream Bool -> Style`'),
      p('Toggles the minimum height of a component.  Its own height is used if the stream contains `true`, and 0 is used if the stream contains `false`.'),
    ];
  };

  var standardLibraryStreams = function () {
    return [
      p("HCJ provides a stream library used to pass dimensions from parents to children and minimum dimensions from children to parents."),
      p("A `Stream T` is defined as an object with two properties:"),
      objectDefinition([{
        name: 'lastValue',
        type: 'T',
        description: 'The most recent data point.',
      }, {
        name: 'listeners',
        type: '[T -> ()]',
        description: 'Functions that are run whenever there is a new data point.',
      }]),
      p('Broadly speaking, there are two ways to define HCJ streams.  The first is with `stream.create` or `stream.once`.  Streams created with these methods receive new data points whenever you push to them (see `stream.push` and `stream.pushAll`).'),
      p('The second way is to apply an operation to existing streams.  `stream.map` and `stream.reduce` are the most common such operations.  Streams defined this way generally receive new values whenever their input streams receive new values.'),
      p('HCJ streams are optimized for communicating dimensions between parents and children, not for aggregating data.  If you push a value through a stream multiple times, it is only guaranteed to be handled the first time.  If you push multiple values through a stream synchronously, only the last one is guaranteed to be handled.'),
      p('To run an action after all stream operations have settled, use `hcj.stream.defer` instead of `setTimeout`.  To push to a stream after all synchronous actions are complete, use `hcj.stream.next` instead of `setTimeout` so that `hcj.stream.defer` knows to wait for your pushes.'),

      h1('Stream Methods'),
      p('These are the stream functions included with HCJ.  All are properties of the `window.hcj.stream` object:'),

      h2('Combine'),
      p('`combine :: ([Stream a, Stream b, ...] , (a, b, ...) -> x) -> Stream x`'),
      p('Takes an array of streams, and a function.  Applies the function to the latest values from all input streams, updating output stream whenever any input changes.'),

      h2('CombineInto'),
      p('`combineInto :: ([Stream a, Stream b, ...] , (a, b, ...) -> x , Stream x) -> ()`'),
      p('Like `combine`, but instead of returning a stream, pushes all values into an existing stream created with `create` or `once`.'),

      h2('CombineObject'),
      p('`combineObject :: {x: Stream a, y: Stream b, ...} -> Stream {x: a, y: b, ...}`'),
      p('Takes an object whose properties are streams, returns a stream of objects.'),

      h2('Create'),
      p('`create :: () -> Stream a`'),
      p('Creates a stream with no initial value.'),

      h2('Debounce'),
      p('`debounce :: (Stream a , Number) -> Stream a`'),
      p('Pushes values from its input stream unmodified to its output stream, no more frequently than the given number of milliseconds.'),

      h2('Delay'),
      p('`delay :: Stream a -> Number -> Stream a`'),
      p('Pushes values unmodified to its output stream after waiting the given number of milliseconds.'),

      h2('Filter'),
      p('`filter :: (Stream a , a -> Bool) -> Stream a`'),
      p('Takes a stream and a predicate.  Returns a stream that includes only the values for which the predicate is truthy.'),

      h2('FromPromise'),
      p('`fromPromise :: (Promise a , a?) -> Stream a`'),
      p('Takes a promise, and an optional initial value.  Returns a stream that receives a value when the promise resolves, and initialized with the initial value if one is provided.'),

      h2('Map'),
      p('`map :: (Stream a , a -> b) -> Stream b'),
      p('Applies a function to each point of a stream.'),

      h2('Once'),
      p('`once :: a -> Stream a`'),
      p('Creates a stream with an initial value.'),

      h2('OnValue'),
      p('`onValue :: (Stream a , a -> ()) -> ()'),
      p('Like `map` but does not return a stream.'),

      h2('Prop'),
      p('`prop :: (Stream {x: a, ...} , "x") -> Stream a`'),
      p('Maps over a stream of objects, accessing the specified key.'),

      h2('Push'),
      p('`push : (Stream a , a) -> ()`'),
      p('Pushes a value into an existing stream created with `create` or `once`.'),

      h2('PushAll'),
      p('`pushAll : (Stream a , Stream a) -> ()`'),
      p('Pushes all values from one stream onto an existing stream.  Source stream is first, target second.'),

      h2('Reduce'),
      p('`reduce : (Stream a , b -> a -> b , b) -> Stream b'),
      p('Applies a function to each data point of a stream, keeping a running total.'),

      h2('SplitObject'),
      p('`splitObject : {x: a, y: b, ...} -> {x: Stream a, y: Stream a, ...}`'),
      p('Takes an object, and returns an object whose values are a streams initialized with the values from the input object.'),

      h1('Defined Streams'),
      p('HCJ defines some streams that may be useful in application code.  These streams are all properties of the `hcj.viewport` object.'),

      h2('Height'),
      p('`hcj.viewport.heightS` gives the current height of the window in pixels.'),

      h2('Scroll'),
      p('`hcj.viewport.scrollS` gives the current Y scroll position.'),

      h2('Width and FullWidth'),
      p('`hcj.viewport.widthS` gives the width of the window in pixels, minus the width of the vertical scrollbar if present.'),
      p('`hcj.viewport.fullWidthS` gives the full width of the window in pixels, including the vertical scrollbar if present.'),
    ];
  };

  var standardLibraryForms = function () {
    return [
      p("Hcj provides some reactive form components for your convenience."),

      h2('FieldKind, FieldType, FormComponent'),
      p('HCJ\'s standard library has an intricate model of form components and their types.  Logically it is based on some basic dependent types, specifically type families.  HCJ\'s model of form types is extensible, so you can add your own types of form elements by extending the `FieldKind` type and then extending the other types as needed.'),
      p('It is not required to understand this model to display individual form components; the examples in the next section should give you a good picture of how to do that.  However, the highly convenient `FormFor` function described in the section after next does depend on these interrelationships, so for that it may be worthwhile to read this section.'),
      h3('FieldKind'),
      p('The instances of the `FieldKind` type correspond with the kinds of form inputs that can be included in your forms.  A `FieldKind` names the kind of form element, but does not have any additional data about its validation or its contents.'),
      p('The `FieldKind` type can be considered a subset of the `String` type - all `FieldKind` values should be strings.  The HCJ standard library supports the following `FieldKind` values:'),
      typeSignatures([{
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
      p('Most of these "constructors" are not functions, but literal `FieldTypes`.  The only built-in `FieldTypes` that require additional data are `dropdown` and `radios`.'),
      p('`dropdown` takes one parameter: an array of objects with `name` and `value` properties giving the options to display.'),
      p('`radios` also takes one parameter: an array of strings giving the values for each radio.'),
      p('All values of type `FieldType k`, for any `k`, are objects that have a `kind` property with value `k`, plus additional properties as needed.'),
      h3('FormComponent'),
      p('Each form element is displayed in a certain way.  Most form elements can be displayed via single components, but `radios` in particular yields multiple radio buttons that you may want to place separately or into a custom layout.'),
      p('Therefore we present another type family, `FormComponent :: FieldKind -> Type`.  This formalizes the type produced when you go to convert a `FieldType` of a certain `FieldKind` into objects suitable for display.'),
      typeSignatures([{
        name: 'Component',
        type: 'FormComponent "checkbox"',
      }, {
        name: 'Component',
        type: 'FormComponent "date"',
      }, {
        name: 'Component',
        type: 'FormComponent "dropdown"',
      }, {
        name: 'Component',
        type: 'FormComponent "file"',
      }, {
        name: 'Component',
        type: 'FormComponent "hidden"',
      }, {
        name: 'Component',
        type: 'FormComponent "number"',
      }, {
        name: 'Component',
        type: 'FormComponent "password"',
      }, {
        name: '[Component]',
        type: 'FormComponent "radios"',
      }, {
        name: 'Component',
        type: 'FormComponent "text"',
      }, {
        name: 'Component',
        type: 'FormComponent "textarea"',
      }, {
        name: 'Component',
        type: 'FormComponent "time"',
      }], true),
      p('These form input `Components` are created using the `hcj.forms.formComponent` function.  This function essentially takes `FieldTypes` and optionally additional data, and returns their corresponding `FormComponents`.'),
      p('`hcj.forms.formComponent :: DisplayType k -> FormComponent k`'),
      p('`DisplayType` is another type family predicated on `FieldKind`.  For HCJ\'s built-in form functions, a `DisplayKind k` is an object with a `type` field of type `FieldType k`, along with additional data depending on `k`.  Generally:'),
      p('`{ type: FieldType k, etc. } :: DisplayType k`'),
      p('For completeness\' sake, although repetitive, here is the full list of `DisplayTypes` as implemented by HCJ:'),
      typeSignatures([{
        name: '{ type: FieldType "checkbox", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "checkbox"',
      }, {
        name: '{ type: FieldType "date", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "date"',
      }, {
        name: '{ type: FieldType "dropdown", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "dropdown"',
      }, {
        name: '{ type: FieldType "file", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "file"',
      }, {
        name: '{ type: FieldType "hidden", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "hidden"',
      }, {
        name: '{ type: FieldType "number", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "number"',
      }, {
        name: '{ type: FieldType "password", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "password"',
      }, {
        name: '{ type: FieldType "radios", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "radios"',
      }, {
        name: '{ type: FieldType "text", name: String?, stream: (Stream String)?, placeholder: String? }',
        type: 'DisplayType "text"',
      }, {
        name: '{ type: FieldType "textarea", name: String?, stream: (Stream String)?, placeholder: String? }',
        type: 'DisplayType "textarea"',
      }, {
        name: '{ type: FieldType "time", name: String?, stream: (Stream String)? }',
        type: 'DisplayType "time"',
      }], true),
      p('Basically, `DisplayType k` has properties `type`, `name`, and `stream` for all form kinds, and additionally `placeholder` for text and textarea.'),
      p('The `type` property again gives the `FieldType` of the form element.  The `name` field gives the desired "name" attribute of the input field.  The `stream` property allows you to access the input\'s value stream by passing in a stream.  This value stream is bi-directional: it receives a value whenever the user edits the field, and the field changes whenever the stream receives a new value.  This stream is intended to be used for field validation.  `placeholder`, of course, specifies the input placeholder.'),
      p('When you pass a `DisplayType k` to the `hcj.forms.formComponent` function, it will return a `FormComponent k`.  That is, it returns an array of `Components` for a "radios" field, and a single `Component` for all other fields.'),
      h3('Example'),
      p('There are a lot of different concepts here: `FieldKind`, `FieldType`, `DisplayType`, and `FormComponent`.  So here is an example that hopefully helps clear up the meanings of all these terms.  We will create a simple email address input field with validation.'),
      p('The first step is to construct the `FieldType` that we want.  In the case of a text field, there is only one possible `FieldType` and it is `hcj.forms.fieldType.text`.'),
      p('`var fieldType = hcj.forms.fieldType.text;`'),
      p('The next step is to construct the `DisplayType`.  We want to be able to access the value stream of the created form element, so we make sure to provide this object with a `stream` property.'),
      codeBlock([
        'var valueStream = hcj.stream.once(\'\');',
        'var displayType = {',
        '  type: fieldType,',
        '  stream: valueStream,',
        '};',
      ]),
      p('Before we put everything together, we will define a component that displays an error if the text entered into the input is not a valid email.  For this we will use a `componentStream` that contains `nothing` if the email is valid and a text message if it is not.  Assume we have an `isValidEmail` function that checks whether a string is a valid email address, and returns either `true` or `false`.'),
      codeBlock([
        'var validationMessage = hcj.component.componentStream(hcj.stream.map(valueStream, function (value) {',
        '  if (isValidEmail(value)) {',
        '    return hcj.component.nothing;',
        '  }',
        '  else {',
        '    return hcj.component.text("Please enter a valid email.");',
        '  }',
        '}));',
      ]),
      p('Now we arrange our form input and validation message in a stack together.'),
      codeBlock([
        'return hcj.component.stack([',
        '  hcj.forms.formComponent(displayType),',
        '  validationMessage,',
        ']);',
      ]),
      p('Here\'s a demo:'),
      (function () {
        var isValidEmail = function (str) {
          return str === '' || str.indexOf('@') !== -1;
        };

        var fieldType = hcj.forms.fieldType.text;

        var valueStream = hcj.stream.once('');
        var displayType = {
          type: fieldType,
          stream: valueStream,
        };

        var validationMessage = hcj.component.componentStream(hcj.stream.map(valueStream, function (value) {
          if (isValidEmail(value)) {
            return hcj.component.nothing;
          }
          else {
            return hcj.component.text("Please enter a valid email.");
          }
        }));

        return hcj.component.stack([
          hcj.forms.formComponent(displayType),
          validationMessage,
        ]);
      })(),
      showCodeBlock([
        'var fieldType = hcj.forms.fieldType.text;',
        '&nbsp;',
        'var valueStream = hcj.stream.once(\'\');',
        'var displayType = {',
        '  type: fieldType,',
        '  stream: valueStream,',
        '};',
        '&nbsp;',
        'var validationMessage = hcj.component.componentStream(hcj.stream.map(valueStream, function (value) {',
        '  if (isValidEmail(value)) {',
        '    return hcj.component.nothing;',
        '  }',
        '  else {',
        '    return hcj.component.text("Please enter a valid email.");',
        '  }',
        '}));',
        '&nbsp;',
        'return hcj.component.stack([',
        '  hcj.forms.formComponent(displayType),',
        '  validationMessage,',
        ']);',
      ]),
    ];
  };

  var standardLibraryFormExamples = function () {
    return [
      p('These form inputs are all created using `hcj.forms.formComponent` function.'),
      h2('Text Input'),
      p('The first and only required argument to the `hcj.forms.formComponent` function is the `FieldType` of the desired form input.'),
      hcj.forms.formComponent({
        type: hcj.forms.fieldType.text,
      }),
      codeBlock([
        'hcj.forms.formComponent(hcj.forms.fieldType.text)',
      ]),
      h2('Text Input with Name'),
      p('The second argument that you can pass to `hcj.forms.formComponent` is the "name" attribute of your form input.'),
      hcj.forms.formComponent({
        type: hcj.forms.fieldType.text,
        name: 'name',
      }),
      codeBlock([
        'hcj.forms.formComponent(hcj.forms.fieldType.text, "name")'
      ]),
      h2('Text Input with Name and Value Stream'),
      p('The third argument to `hcj.forms.formComponent` is a value stream.  This stream is updated when the input\'s value changes, and vice versa.'),
      hcj.forms.formComponent({
        type: hcj.forms.fieldType.text,
        name: 'name',
        stream: stream.create(),
      }),
      codeBlock([
        'var textValueS = hcj.stream.create();',
        '&nbsp;',
        'return hcj.forms.formComponent(hcj.forms.fieldType.text, "name", textValueS);'
      ]),
      h2('Checkbox'),
      p('A checkbox that controls a text element.'),
      (function (s) {
        var checkedStream = hcj.stream.once(false);

        return hcj.component.stack([
          hcj.component.all([
            hcj.component.alignHLeft,
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.checkbox,
            stream: checkedStream,
          })),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.date,
            name: 'date',
            stream: dateStream,
          })),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.dropdown([{
              name: 'A',
              value: 'a',
            }, {
              name: 'B',
              value: 'b',
            }]),
            name: 'dropdown',
            stream: dropdownStream,
          })),
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
          c.text('TODO: remove jquery'),
          // hcj.component.all([
          //   c.$attr('accept', 'image/*'),
          //   hcj.component.alignHLeft,
          // ])(hcj.forms.formComponent({
          //   type: hcj.forms.fieldType.file,
          //   name: 'image',
          //   stream: filesStream,
          // })),
          // hcj.component.componentStream(previewComponentStream),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.number,
            name: 'number',
            stream: numberStream,
          })),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.password,
            name: 'password',
            stream: passwordStream,
          })),
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
          ])(hcj.component.stack(hcj.forms.formComponent({
            type: hcj.forms.fieldType.radios(['first', 'second']),
            name: 'radios',
            stream: valueStream,
          }))),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.text,
            name: 'text',
            stream: valueStream,
          })),
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
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.textarea,
            name: 'textarea',
            stream: valueStream,
          })),
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
      h2('Time'),
      p('Text element shows the value of the time input.'),
      (function () {
        var valueStream = hcj.stream.once(null);
        
        return hcj.component.stack([
          hcj.component.all([
            hcj.component.alignHLeft,
          ])(hcj.forms.formComponent({
            type: hcj.forms.fieldType.time,
            stream: valueStream,
          })),
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
  };

  var standardLibraryFormFor = function () {
    return [
      h2('formStyle'),
      p('`formStyle.text : (String, String, Stream, FieldType) -> (Component -> Component)`'),
      p("The `window.hcj.forms.formStyle` object has exactly the same keys as `window.hcj.forms.fieldType`.  Its values are functions that take four paramaters: a field name, the name/id attribute, a stream, and an optional form type.  They return styles that should be applied to the `formComponent` output values."),
      p("Note: the `window.hcj.formStyle.radios` function returns not a style, but a layout taking the entire array of radio buttons."),
      p("Example:"),
      codeBlock([
        "var text = forms.formComponent.text();",
        "var labeledText = forms.formStyle('Field Name')(text);",
      ]),

      // hcj.forms.formFor(hcj.forms.formComponent, hcj.forms.defaultStyle)({
      //   action: 'test.html',
      //   method: 'get',
      // }, {
      //   name: {
      //     type: hcj.forms.fieldType.text,
      //     // default: ,
      //   },
      // }),

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
  };

  var standardLibraryColors = function () {
    return [
      p('HCJ has a standard schema for colors.  A `Color` is an object with all of the following properties:'),
      objectDefinition([{
        name: 'r',
        type: 'Number',
        description: 'Value from 0 to 255.',
      }, {
        name: 'g',
        type: 'Number',
        description: 'Value from 0 to 255.',
      }, {
        name: 'b',
        type: 'Number',
        description: 'Value from 0 to 255.',
      }, {
        name: 'a',
        type: 'Number',
        description: 'Value from 0 to 1.',
      }]),

      p('The following functions are found in `window.hcj.color`:'),
      h2('Color'),
      p('`color :: {r: Number?, g: Number?, b: Number?, a: Number?} -> Color`'),
      p('`Color` constructor.  `r`, `g`, and `b` values default to 0, and `a` value defaults to 1.'),

      h2('ColorString'),
      p('`colorString :: Color -> String`'),
      p('`Color` destructor.  Takes a color, returns string using rgba format.'),
    ];
  };

  var standardLibraryJso = function () {
    return [
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
  };

  var csIsNotAFunction = function () {
    return [
      p("Might be the most common error message you're going to get using this library.  Very uninformative, sorry."),
    ];
  };

  var version2 = function () {
    return [
      p('Improve text measurement by using the canvas measureText method instead of the current strategy of appending the text to an invisible dom element.  Use this to implement a float left/right layout.'),
      p('Figure out how to integrate CSS transitions properly.'),
      p('Add more comments.'),
      p('Turing-complete JSON subset that can be evaluated server-side to HTML/CSS and client-side to an HCJ component.'),
    ];
  };

  var support = function () {
    return [
      p("Join #hcj on Freenode, or leave a message on the Github repository."),
      p('<iframe src="https://kiwiirc.com/client/irc.freenode.net/?&theme=basic#hcj" style="border:0; width:100%; height:450px;"></iframe>'),
    ];
  };

  var testPage = function () {
    return [
      p("Demo of some of the components that come with hcj."),
      p("Conventions used in these examples' code:"),
      codeBlock([
        'var c = hcj.component;',
        'var p = c.text;',
        'var pm = c.text({measureWidth: true});',
        'var h1 = c.text({size: \'40px\'});',
        'var h1m = c.text({size: \'40px\', measureWidth: true});',
      ]),

      h2("Display all kinds of text"),
      c.text({
        size: 50 + 'px',
      }, "big text"),
      showCodeBlock([
        'c.text({',
        '  size: \'50px\',',
        '}, "big text");',
      ]),
      c.text({
        size: 10 + 'px',
      }, "little text"),
      showCodeBlock([
        'c.text({',
        '  size: \'10px\',',
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
        size: 25 + 'px',
      }, {
        str: 'u',
        size: 20 + 'px',
        align: 'top',
      }, {
        str: 'n',
        size: 25 + 'px',
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
        '  size: 25 + \'px\',',
        '}, {',
        '  str: \'u\',',
        '  size: 20 + \'px\',',
        '  align: \'top\',',
        '}, {',
        '  str: \'n\',',
        '  size: 25 + \'px\',',
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
        '    p({',
        '      color: color.red,',
        '    }, \'hi\'),',
        '    p({',
        '      color: color.red,',
        '    }, \'hi\'),',
        '    p({',
        '      color: color.red,',
        '    }, \'hi\'),',
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
            el: el.button,
            measureWidth: true,
          }, {
            str: buttonTextS,
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
        '    el: el.button,',
        '    measureWidth: true,',
        '  }, {',
        '    str: buttonTextS,',
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
  };

  var pages = {
    home: introduction,
    helloWorld: renderingComponents,
    introduction: aLittleVocab,
    apiComponents: standardLibraryComponents,
    apiLayouts: standardLibraryLayouts,
    apiStyles: standardLibraryComponentModifiers,
    apiForms: standardLibraryForms,
    apiFormsExamples: standardLibraryFormExamples,
    apiFormFor: standardLibraryFormFor,
    apiColors: standardLibraryColors,
    apiStreams: standardLibraryStreams,
    apiExamples: testPage,
    definingComponents: definingComponents,
    definingLayouts: definingLayouts,
    community: support,
  };

  var logoC = c.all([
    c.keepAspectRatio({
      left: true,
    }),
    c.minWidth(46.5),
    c.minHeight(0),
    c.padding({
      all: 10,
    }),
  ])(c.image({
    src: './demo.png',
    alt: 'HCJ Logo',
  }));
  var links = [{
    name: 'Home',
    href: '.',
  }, {
    name: 'Tutorial',
    items: [{
      name: '0. Introduction',
      href: 'introduction.html',
    }, {
      name: '1. Hello World',
      href: 'helloWorld.html',
    }],
  }, {
    name: 'Examples',
    href: 'apiExamples.html',
  }, {
    name: 'API',
    items: [{
      name: 'Components',
      href: 'apiComponents.html',
    }, {
      name: 'Layouts',
      href: 'apiLayouts.html',
    }, {
      name: 'Styles',
      href: 'apiStyles.html',
    }, {
      name: 'Colors',
      href: 'apiColors.html',
    }, {
      name: 'Streams',
      href: 'apiStreams.html',
    }, {
      name: 'Custom Components',
      href: 'definingComponents.html',
    }, {
      name: 'Custom Layouts',
      href: 'definingLayouts.html',
    }],
  }];
  var darkPurple = hcj.color.color({
    r: 70,
    g: 0,
    b: 70,
  });
  var darkPurpleHover = hcj.color.color({
    r: 100,
    g: 0,
    b: 100,
  });
  var white = hcj.color.color({
    r: 255,
    g: 255,
    b: 255,
  });
  var notWhite = hcj.color.color({
    r: 255,
    g: 250,
    b: 255,
  });
  var headerText = function (str) {
    return c.all([
      c.padding(20),
      c.backgroundColor({
        background: darkPurple,
        backgroundHover: darkPurpleHover,
      }),
    ])(c.text({
      measureWidth: true,
      family: 'sans-serif',
    }, str));
  };
  var onOffSs = links.map(function () {
    return stream.once(false);
  });
  var linksWideC = dropdownPanels(links.map(function (link, i) {
    var linkC = c.all([
      link.href ? c.linkTo(link.href) : c.link,
      c.clickThis(function (ev) {
        for (var j = 0; j < links.length; j++) {
          if (j === i) {
            stream.push(onOffSs[j], !onOffSs[j].lastValue);
          }
          else {
            stream.push(onOffSs[j], false);
          }
        }
        ev.stopPropagation();
      }),
    ])(headerText(link.name));
    return {
      source: linkC,
      panel: link.items ? c.stack(link.items.map(function (item) {
        return c.all([
          c.linkTo(item.href),
        ])(headerText(item.name));
      })) : c.nothing,
      onOffS: onOffSs[i],
    };
  }), {
    align: 'left'
  });
  var narrowOnOffS = stream.once(false);
  var linksNarrowC = c.all([
  ])(dropdownPanels([{
    source: c.all([
      c.clickThis(function (ev) {
        ev.stopPropagation();
        stream.push(narrowOnOffS, !narrowOnOffS.lastValue);
      }),
    ])(headerText('Menu')),
    panel: c.stack(links.map(function (link) {
      if (link.items) {
        var onOffS = stream.once(false);
        return c.stack([
          c.all([
            c.clickThis(function (ev) {
              ev.stopPropagation();
              stream.push(onOffS, !onOffS.lastValue);
            }),
            c.link,
          ])(headerText(link.name)),
          c.all([
            c.toggleHeight(onOffS),
          ])(c.stack(link.items.map(function (item) {
            return c.all([
              c.linkTo(item.href),
            ])(headerText(item.name));
          }))),
        ]);
      }
      return c.all([
        c.linkTo(link.href),
      ])(headerText(link.name));
    })),
    onOffS: narrowOnOffS,
  }]));

  var header = c.all([
    c.backgroundColor({
      background: darkPurple,
      font: white,
    }),
  ])(c.sideBySide({
    surplusWidthFunc: hcj.funcs.surplusWidth.giveToNth(1),
  }, [
    logoC,
    c.largestWidthThatFits([
      c.all([
        c.alignHRight,
      ])(linksWideC),
      c.all([
        c.alignHRight,
      ])(linksNarrowC),
    ]),
  ]));
  var body = c.text('body');

  window.docsPage = function (page) {
    return c.all([
      c.clickThis(function () {
        for (var j = 0; j < links.length; j++) {
          stream.push(onOffSs[j], false);
        }
        stream.push(narrowOnOffS, false);
      }),
      c.backgroundColor(notWhite),
    ])(c.fixedHeaderBody(header, c.all([
      c.padding(20),
    ])(docStack(pages[page]()))));
  };
})();
