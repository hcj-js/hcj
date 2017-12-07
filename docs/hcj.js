function waitForWebfonts(fonts, callback, maxTime) {
  if (fonts.length === 0) {
    callback();
    return;
  }
  maxTime = maxTime || 10 * 1000;
  var startTime = new Date().getTime();
  var loadedFonts = 0;
  var callbackIsRun = false;
  for(var i = 0, l = fonts.length; i < l; ++i) {
    (function(font) {
      var container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = 0;
      document.body.appendChild(container);
      var node = document.createElement('span');
      var $node = $(node);
      // Characters that vary significantly among different fonts
      if (font === 'FontAwesome') {
        node.innerHTML = '<i class="fa-facebook-square"></i>';
      }
      else {
        node.innerHTML = " !\"\\#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
      }
      // Visible - so we can measure it - but not on the screen
      node.style.position      = 'absolute';
      node.style.left          = '-10000px';
      node.style.top           = '-10000px';
      // Large font size makes even subtle changes obvious
      node.style.fontSize      = '300px';
      // Reset any font properties
      node.style.fontVariant   = 'normal';
      node.style.fontStyle     = 'normal';
      node.style.fontWeight    = 'normal';
      node.style.letterSpacing = '0';
      container.appendChild(node);

      // Remember width with no applied web font
      var width = $node.outerWidth();
      if (font === 'FontAwesome') {
        node.innerHTML = '<i class="fa fa-facebook-square"></i>';
      }
      else {
        node.style.fontFamily = font;
      }

      var interval;
      function checkFont () {
        // Compare current width with original width
        if (node && (new Date().getTime() - startTime > maxTime || $node.outerWidth() != width)) {
          ++loadedFonts;
          node.parentNode.removeChild(node);
          node = null;
          if (interval) {
            clearInterval(interval);
          }
        }

        // If all fonts have been loaded
        if(loadedFonts >= fonts.length) {
          if(loadedFonts == fonts.length) {
            if (!callbackIsRun) {
              callback();
            }
            callbackIsRun = true;
            return true;
          }
        }
      };

      setTimeout(function () {
        if(!checkFont()) {
          interval = setInterval(checkFont, 50);
        }
      });
    })(fonts[i]);
  }
};
(function () {
  var uncurryConfig = function (f, valueIsNotConfig) {
    valueIsNotConfig = valueIsNotConfig || function (obj) {
      return $.type(obj) === 'array' || $.type(obj) === 'function';
    };
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var firstArgIsConfig = !valueIsNotConfig(args[0]);
      if ((args.length - (firstArgIsConfig ? 1 : 0)) > 0) {
        var args0 = [];
        if (firstArgIsConfig) {
          args0 = args.splice(0, 1);
        }
        return f.apply(null, args0).apply(null, args);
      }
      var arg = args[0];
      return function () {
        var args = Array.prototype.slice.call(arguments);
        return f.apply(null, [arg]).apply(null, args);
      };
    };
  };
  var lrmIsNotConfig = function (obj) {
    return !obj || obj.l || obj.r || obj.m;
  };
  var tbmIsNotConfig = function (obj) {
    return !obj || obj.t || obj.b || obj.m;
  };
  var caseSplit = function (cases, obj) {
    // may curry
    if (!obj) {
      return function (obj) {
        for (var key in cases) {
          if (cases.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
            if (!$.isFunction(cases[key])) {
              return cases[key];
            }
            return cases[key](obj[key]);
          }
        }
      };
    }
    for (var key in cases) {
      if (cases.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
        if (!$.isFunction(cases[key])) {
          return cases[key];
        }
        return cases[key](obj[key]);
      }
    }
  };
  var apply = function (v) {
    return function (f) {
      return f(v);
    };
  };
  var constant = function (b) {
    return function (a) {
      return b;
    };
  };
  var uncurry = function (f, n) {
    n = n || 1;
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var arg0 = [null];
      if (args.length > n) {
        arg0 = args.splice(0, 1);
      }
      return f.apply(null, arg0).apply(null, args);
    };
  };
  var id = function (a) {
    return a;
  };
  var add = function (a, b) {
    return a + b;
  };
  var subtract = function (a, b) {
    return a - b;
  };
  var mathMax = function (a, b) {
    return Math.max(a, b);
  };
  var mathMin = function (a, b) {
    return Math.min(a, b);
  };

  var createDeferFuncContext = function (runASAP) {
    /*

     This is a hacky implementation of something that already exists.
     Do not use this little function.  When I find out what it is that
     this function crudely implements, I will find and use an existing
     library for it.

     */
    runASAP = runASAP || setTimeout;
    var nextFuncs = [];
    var running = false;
    var deferFunc = function (f) {
      runASAP(function () {
        if (nextFuncs.length === 0) {
          f();
        }
        else {
          deferFunc(f);
        }
      });
    };
    var childContext = null;
    var deferFuncContext = {
      next: function (f) {
        nextFuncs.push(f);
        if (running === false) {
          running = true;
          runASAP(function () {
            running = false;
            var runFuncs = nextFuncs;
            nextFuncs = [];
            runFuncs.map(function (f) {
              f();
            });
          });
        }
        return deferFuncContext;
      },
      childContext: function () {
        childContext = childContext || createDeferFuncContext(deferFunc);
        return childContext;
      },
      defer: function (f) {
        var childContext = deferFuncContext.childContext();
        childContext.next(f);
        return childContext;
      },
    };
    return deferFuncContext;
  };

  var streamDeferFunc = createDeferFuncContext();
  var stream = {
    create: function (v) {
      return {
        listeners: [],
        lastValue: v,
      };
    },
    next: streamDeferFunc.next,
    defer: streamDeferFunc.defer,
    isStream: function (v) {
      return v &&
        v.hasOwnProperty('listeners') &&
        v.hasOwnProperty('lastValue');
    },
    once: function (v) {
      return stream.create(v);
    },
    push: function (s, v) {
      if (s.lastValue !== v) {
        s.lastValue = v;
        for (var i = 0; i < s.listeners.length; i++) {
          if (s.listeners[i]) {
            s.listeners[i](v);
          }
        }
      }
    },
    map: function (s, f) {
      var out = stream.create();
      if (s.lastValue !== undefined) {
        stream.push(out, f(s.lastValue));
      }
      s.listeners.push(function (v) {
        stream.push(out, f(v));
      });
      return out;
    },
    reduce: function (s, f, v1) {
      var out = stream.once(v1);
      if (s.lastValue !== undefined) {
        stream.push(out, f(out.lastValue, s.lastValue));
      }
      stream.map(s, function (v) {
        stream.push(out, f(out.lastValue, v));
      });
      return out;
    },
    filter: function (s, f) {
      var out = stream.create();
      s.listeners.push(function (v) {
        if (f(v)) {
          stream.push(out, v);
        }
      });
      return stream;
    },
    onValue: function (s, f) {
      s.listeners.push(function (v) {
        f(v);
      });
      if (s.lastValue !== undefined) {
        f(s.lastValue);
      }
      var index = s.listeners.length - 1;
      return function () {
        delete s.listeners[index];
      };
    },
    promise: function (s) {
      var d = $.Deferred();
      stream.map(s, function (v) {
        d.resolve(v);
      });
      return d.promise;
    },
    prop: function (s, str) {
      return stream.map(s, function (v) {
        return v[str];
      });
    },
    delay: function (s, amount) {
      var out = stream.create();
      stream.map(s, function (v) {
        setTimeout(function () {
          stream.push(out, v);
        }, amount);
      });
      return out;
    },
    debounce: function (s, amount) {
      var out = stream.create();
      var lastPushed = 0;
      var running = false;
      stream.map(s, function (v) {
        if (!running) {
          running = true;
          var d = new Date().getTime();
          setTimeout(function () {
            running = false;
            stream.push(out, s.lastValue);
            lastPushed = Math.max(lastPushed + amount, d);
          }, Math.max(0, (lastPushed + amount) - d));
        }
      });
      return out;
    },
    pushAll: function (source, target) {
      if (source.lastValue !== undefined) {
        stream.push(target, source.lastValue);
      }
      stream.onValue(source, function (v) {
        stream.push(target, v);
      });
    },
    clone: function (s) {
      var out = stream.create();
      stream.pushAll(s, out);
      return out;
    },
    combine: function (streams, f) {
      var arr = [];
      var out = stream.create();

      var running = false;
      var tryRunF = function () {
        if (!running) {
          running = true;
          streamDeferFunc.next(function () {
            running = false;
            for (var i = 0; i < streams.length; i++) {
              if (arr[i] === undefined) {
                return;
              }
            }
            stream.push(out, f.apply(null, arr));
          });
        }
      };

      streams.reduce(function (i, s) {
        if (s.lastValue !== undefined) {
          arr[i] = s.lastValue;
          tryRunF();
        }
        stream.onValue(s, function (v) {
          arr[i] = v;
          tryRunF();
        });
        return i + 1;
      }, 0);

      return out;
    },
    combineInto: function (streams, f, out) {
      var arr = [];

      var running = false;
      var tryRunF = function () {
        if (!running) {
          running = true;
          streamDeferFunc.next(function () {
            running = false;
            for (var i = 0; i < streams.length; i++) {
              if (arr[i] === undefined) {
                return;
              }
            }
            stream.push(out, f.apply(null, arr));
          });
        }
      };

      streams.reduce(function (i, s) {
        if (s.lastValue !== undefined) {
          arr[i] = s.lastValue;
          tryRunF();
        }
        stream.onValue(s, function (v) {
          arr[i] = v;
          tryRunF();
        });
        return i + 1;
      }, 0);
    },
    all: function (streams, f) {
      return stream.combine(streams, function () {
        return Array.prototype.slice.call(arguments);
      });
    },
    combineObject: function (streamsObject) {
      var keys = Object.keys(streamsObject);
      var obj = {};
      var out = stream.create();

      var running = false;
      var tryRunF = function () {
        if (!running) {
          running = true;
          streamDeferFunc.next(function () {
            running = false;
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (obj[key] === undefined) {
                return;
              }
            }
            stream.push(out, $.extend({}, obj));
          });
        }
      };

      keys.map(function (key, i) {
        stream.onValue(streamsObject[key], function (v) {
          obj[key] = v;
          tryRunF();
        });
      });

      return out;
    },
    splitObject: function (obj) {
      var keys = Object.keys(obj);
      var streams = {};
      keys.map(function (key) {
        streams[key] = stream.once(obj[key]);
      });
      return streams;
    },
    fromEvent: function ($el, event) {
      var s = stream.create();
      $el.on('event', function (ev) {
        stream.push(s, ev);
      });
      return s;
    },
    fromPromise: function (p, initialValue) {
      var out = stream.create();
      if (initialValue) {
        stream.push(out, initialValue);
      }
      p.then(function (v) {
        stream.push(out, v);
      });
      return out;
    },
    cases: function (streams, indexS) {
      streams.push(indexS);
      return stream.combine(streams, function () {
        var args = Array.prototype.slice.call(arguments);
        var index = args.pop();
        return args[index];
      });
    },
  };


  var unit = function (unit) {
    return function (number) {
      return number + unit;
    };
  };
  var px = unit('px');
  var vw = unit('vw');

  var onceZeroS = stream.once(0);
  var onceConstantZeroS = stream.once(constant(0));

  var windowWidth = stream.create();
  stream.windowWidth = windowWidth;
  var windowHeight = stream.create();
  stream.windowHeight = windowHeight;
  var updateWindowWidth = function () {
    stream.push(windowWidth, window.innerWidth);
  };
  var updateWindowHeight = function () {
    stream.push(windowHeight, window.innerHeight);
  };
  $(updateWindowWidth);
  $(updateWindowHeight);
  $(window).on('resize', function () {
    updateWindowWidth();
    updateWindowHeight();
  });
  var windowResize = stream.once(null, true);
  $(window).on('resize', function (e) {
    stream.push(windowResize, e);
  });

  var windowScroll = stream.create(true);
  $(window).on('scroll', function () {
    stream.push(windowScroll, window.scrollY);
  });
  stream.push(windowScroll, window.scrollY);

  var windowHash = stream.create(true);
  $(window).on('hashchange', function () {
    stream.push(windowHash, location.pathname);
  });
  stream.push(windowHash, location.pathname);

  // this stream assumes only one rootComponent per web page!
  // todo: change this into a promise
  // todo: see if it's possible to replace this with hcj.stream.defer
  var displayedS = stream.once(false);

  var updateDomEls = [];
  var updateDomKinds = [];
  var updateDomProps = [];
  var updateDomValues = [];
  var runDomFuncs = function () {
    for (var i = 0; i < updateDomEls.length; i++) {
      updateDomEls[i][updateDomKinds[i]](updateDomProps[i], updateDomValues[i]);
    }
    updateDomEls = [];
    updateDomKinds = [];
    updateDomProps = [];
    updateDomValues = [];
  };
  var updateDomFunc = function ($el, kind, prop, value) {
    if (updateDomEls.length === 0) {
      stream.defer(runDomFuncs);
    }
    updateDomEls.push($el);
    updateDomKinds.push(kind);
    updateDomProps.push(prop);
    updateDomValues.push(value);
  };

  var canvas = document.createElement('canvas');
  var $canvas = $(canvas);
  var ctx = canvas.getContext('2d');

  var decodeDiv = document.createElement('div');
  var htmlDecode = function (input) {
    decodeDiv.innerHTML = input;
    return decodeDiv.childNodes.length === 0 ? "" : decodeDiv.childNodes[0].nodeValue;
  };

  var measureTextWidth = function (str, font) {
    if (font) {
      ctx.font = font;
    }
    return ctx.measureText(str).width;
  };
  var measureTextHeight = function (strs, lineHeight) {
    var ws = {};
    var strsOriginal = strs;
    strsOriginal.map(function (str) {
      str.originalWords = str.words;
    });
    return function (w) {
      strs = strsOriginal.slice(0);
      // if (ws[w]) {
      //     return ws[w];
      // }

      var outputLines = 0;
      var thisLineLength = 0;
      var thisLineHeight = 0;
      if (strs.length === 0) {
        return 0;
      }
      var str = strs[0];
      ctx.font = str.font;
      str.words = str.originalWords.slice(0);
      while (strs.length > 0) {
        var word = str.words[0] + ((strs.length > 1 || str.words.length > 1) ? ' ' : '');
        var wordWidth = measureTextWidth(word);
        if (wordWidth + thisLineLength > w) {
          outputLines += thisLineHeight;
          thisLineLength = 0;
          thisLineHeight = 0;
        }
        thisLineLength += wordWidth;
        thisLineHeight = Math.max(thisLineHeight, parseInt(str.size)); // assumes px
        str.words.splice(0, 1);
        if (str.words.length === 0) {
          strs.splice(0, 1);
          if (strs.length > 0) {
            str = strs[0];
            str.words = str.words.slice(0);
            ctx.font = str.font;
          }
        }
      }

      var height = (outputLines + thisLineHeight) * (lineHeight || 1);

      ws[w] = height;
      return height;
    };
  };

  var measureWidth = function ($el) {
    var $sandbox = $('.sandbox');
    var $clone = $el.clone();
    $clone.css('width', '')
      .css('height', '')
      .css('position', 'absolute')
      .css('display', 'inline-block')
      .appendTo($sandbox);

    var width = $clone.outerWidth(true);
    $clone.remove();

    return width;
  };

  var measureHeight = function ($el) {
    var ws = {};
    return function (w) {
      if (ws[w]) {
        return ws[w];
      }
      var $sandbox = $('.sandbox');
      var $clone = $el.clone();
      $clone.css('width', px(w))
        .css('height', '')
        .appendTo($sandbox);

      var height = $clone.outerHeight(true);
      ws[w] = height;

      $clone.remove();

      return height;
    };
  };

  var renderComponent = function (tagName, build, context) {
    var $el = $(document.createElement(tagName))
          .appendTo(context.$el)
          .css('visibility', 'hidden');

    var contextComplete = 0;
    stream.onValue(context.width, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 1;
      if (contextComplete === 15) {
        updateDomFunc($el, 'css', 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.height, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 2;
      if (contextComplete === 15) {
        updateDomFunc($el, 'css', 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.top, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 4;
      if (contextComplete === 15) {
        updateDomFunc($el, 'css', 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.left, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 8;
      if (contextComplete === 15) {
        updateDomFunc($el, 'css', 'visibility', '');
        contextComplete = -1;
      }
    });

    var instance = {
      $el: $el,
    };
    var buildResult = build($el, context, function (config) {
      var w = measureWidth($el, config);
      if (instance.minWidth) {
        stream.push(instance.minWidth, w);
      }
      else {
        instance.initialMinWidth = w;
      }
    }, function (config) {
      var h = measureHeight($el, config);
      if (instance.minHeight) {
        stream.push(instance.minHeight, h);
      }
      else {
        instance.initialMinHeight = h;
      }
    }) || {};
    instance.minWidth = buildResult.minWidth || stream.create();
    instance.minHeight = buildResult.minHeight || stream.create();
    if (instance.hasOwnProperty('initialMinWidth')) {
      stream.push(instance.minWidth, instance.initialMinWidth);
    }
    if (instance.hasOwnProperty('initialMinHeight')) {
      stream.push(instance.minHeight, instance.initialMinHeight);
    }

    instance.remove = function () {
      if (buildResult.onRemove) {
        buildResult.onRemove();
      }
      $el.remove();
    };

    return instance;
  };

  var component = function () {
    var tagName, build;
    if (arguments.length > 1) {
      tagName = arguments[0];
      build = arguments[1];
    }
    else {
      tagName = 'div';
      build = arguments[0];
    }
    return function (context) {
      return renderComponent(tagName, build, context);
    };
  };

  var curryComponent = function (tagName) {
    return function (build) {
      return component(tagName, build);
    };
  };

  var a = curryComponent('a');
  var button = curryComponent('button');
  var div = curryComponent('div');
  var form = curryComponent('form');
  var h1 = curryComponent('h1');
  var h2 = curryComponent('h2');
  var h3 = curryComponent('h3');
  var h4 = curryComponent('h4');
  var h5 = curryComponent('h5');
  var h6 = curryComponent('h6');
  var iframe = curryComponent('iframe');
  var img = curryComponent('img');
  var input = curryComponent('input');
  var label = curryComponent('label');
  var li = curryComponent('li');
  var option = curryComponent('option');
  var p = curryComponent('p');
  var pre = curryComponent('pre');
  var select = curryComponent('select');
  var textarea = curryComponent('textarea');
  var ul = curryComponent('ul');

  var _scrollbarWidth = function () {
    var parent, child, width;

    if(width===undefined) {
      parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
      child=parent.children();
      width=child.innerWidth()-child.height(99).innerWidth();
      parent.remove();
    }

    return width;
  };

  var mapPx = function (s) {
    return s && stream.map(s, px);
  };
  var mapCalc = function (s) {
    return s && stream.map(s, function (x) {
      return "calc(" + x + ")";
    });
  };
  var layoutAppend = function (childInstances, $el, context, c, ctx, noRemove) {
    ctx = ctx || {};
    try {
      ctx.$el = ctx.$el || $el;
      ctx.width = ctx.width || context.width;
      ctx.height = ctx.height || context.height;
      ctx.top = ctx.top || onceZeroS;
      ctx.left = ctx.left || onceZeroS;
      ctx.topOffset = stream.combine([context.topOffset, context.top], add);
      ctx.leftOffset = stream.combine([context.leftOffset, context.left], add);
      var i = c(ctx);
      if (noRemove !== true) {
        childInstances.push(i);
      }
      // todo: replace with some isInstance function
      if (!i || !i.minWidth || !i.minHeight) {
        console.log('not a component');
        debugger;
      }
      i.$el.css('position', 'absolute');
      stream.onValue(ctx.widthCalc ? mapCalc(ctx.widthCalc) : mapPx(ctx.width), function (w) {
        updateDomFunc(i.$el, 'css', 'width', w);
      });
      stream.onValue(ctx.heightCalc ? mapCalc(ctx.heightCalc) : mapPx(ctx.height), function (h) {
        updateDomFunc(i.$el, 'css', 'height', h);
      });
      stream.onValue(ctx.topCalc ? mapCalc(ctx.topCalc) : mapPx(ctx.top), function (t) {
        updateDomFunc(i.$el, 'css', 'top', t);
      });
      stream.onValue(ctx.leftCalc ? mapCalc(ctx.leftCalc) : mapPx(ctx.left), function (l) {
        updateDomFunc(i.$el, 'css', 'left', l);
      });
      return i;
    }
    catch (e) {
      debugger;
    }
  };
  var layoutRecurse = function (childInstances, $el, context, cs) {
    if ($.isArray(cs)) {
      return cs.map(function (c) {
        return layoutRecurse(childInstances, $el, context, c);
      });
    }
    if (!$.isFunction (cs)) {
      console.log('cs is not a function');
      debugger;
    }
    return function (ctx, noRemove) {
      return layoutAppend(childInstances, $el, context, cs, ctx, noRemove);
    };
  };

  var layout = function (elArg, buildLayoutArg) {
    var el = buildLayoutArg ? elArg : 'div';
    var buildLayout = buildLayoutArg || elArg;
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return component(el, function ($el, ctx) {
        var childInstances = [];
        $el.css('position', 'absolute')
          .css('pointer-events', 'none')
          .css('overflow', 'hidden');
        var i = buildLayout.apply(null, [$el, ctx].concat(layoutRecurse(childInstances, $el, ctx, args)));
        return {
          $el: i.$el,
          minWidth: i.minWidth,
          minHeight: i.minHeight,
          remove: function () {
            childInstances.map(function (i) {
              return i.remove();
            });
            i.remove();
          },
        };
      });
    };
  };

  var container = function (elArg, buildContainerArg) {
    var el = buildContainerArg ? elArg : 'div';
    var buildContainer = buildContainerArg || elArg;
    return component(el, function ($el, context) {
      var childInstances = [];
      $el.css('position', 'absolute')
        .css('pointer-events', 'none')
        .css('overflow', 'hidden');
      var i = buildContainer($el, context, function (c, ctx, noRemove) {
        return layoutAppend(childInstances, $el, context, c, ctx, noRemove);
      });
      return {
        $el: i.$el,
        minWidth: i.minWidth,
        minHeight: i.minHeight,
        remove: function () {
          childInstances.map(function (i) {
            return i.remove();
          });
          i.remove();
        },
      };
    });
  };

  var all = function (fs) {
    return function (c) {
      return fs.reduce(function (c, f) {
        return f(c);
      }, c);
    };
  };

  var rootLayout = layout(function ($el, ctx, c) {
    var i = c();
    stream.combine([
      ctx.widthCalc ? mapCalc(ctx.widthCalc) : mapPx(ctx.width),
      ctx.heightCalc ? mapCalc(ctx.heightCalc) : mapPx(ctx.height),
      ctx.topCalc ? mapCalc(ctx.topCalc) : mapPx(ctx.top),
      ctx.leftCalc ? mapCalc(ctx.leftCalc) : mapPx(ctx.left),
    ], function (w, h, t, l) {
      stream.push(displayedS, true);
      updateDomFunc($('body'), 'css', 'height', 'auto');
      updateDomFunc(i.$el, 'css', 'width', w);
      updateDomFunc(i.$el, 'css', 'height', h);
      updateDomFunc(i.$el, 'css', 'top', t);
      updateDomFunc(i.$el, 'css', 'left', l);
    });
    return i;
  });

  var ensureSandbox = function () {
    if ($('.sandbox').length > 0) {
      return;
    }
    $(document.createElement('div'))
      .addClass('sandbox')
      .css('z-index', -1)
      .css('visibility', 'hidden')
      .appendTo($('body'));
  };
  var countComponentsRendered = 0;
  var rootComponent = function (c, config) {
    config = config || {};
    ensureSandbox();
    var scrollbarWidth = _scrollbarWidth();
    var width = stream.create();
    var height = stream.create();
    var minHeight = stream.create();
    stream.combine([
      windowWidth,
      windowHeight,
      minHeight,
    ], function (ww, wh, mh) {
      var mhAtWW = mh(ww);
      var mhAtScrollbarWW = mh(ww - scrollbarWidth);
      if (mhAtWW > wh) {
        if (mhAtScrollbarWW > wh) {
          $('body').css('overflow-y', 'initial');
          stream.push(width, ww - scrollbarWidth);
          stream.push(height, mhAtScrollbarWW);
        }
        else {
          $('body').css('overflow-y', 'scroll');
          stream.push(width, ww - scrollbarWidth);
          stream.push(height, mhAtScrollbarWW);
        }
      }
      else {
        $('body').css('overflow-y', 'initial');
        stream.push(width, ww);
        stream.push(height, mhAtWW);
      }
    });
    var i = rootLayout(c)({
      $el: $('body'),
      width: width,
      height: height,
      top: onceZeroS,
      left: onceZeroS,
      topOffset: onceZeroS,
      leftOffset: onceZeroS,
    });
    i.$el.css('position', 'relative')
      .css('top', '0px')
      .css('left', '0px')
      .css('background-color', config.noBackground ? '' : 'white')
      .addClass('root-component')
      .addClass('root-component-' + countComponentsRendered);
    countComponentsRendered += 1;
    var elHeight = i.$el.css('height');
    stream.pushAll(i.minHeight, minHeight);
    stream.combine([
      width,
      height,
    ], function (w, h) {
      i.$el.css('width', px(w))
        .css('height', px(h));
    });
    return i;
  };

  var color = function (c) {
    c = c || {};
    return {
      r: c.hasOwnProperty('r') ? c.r : 1,
      g: c.hasOwnProperty('g') ? c.g : 1,
      b: c.hasOwnProperty('b') ? c.b : 1,
      a: c.hasOwnProperty('a') ? c.a : 1,
    };
  };
  var isColor = function (x) {
    return x &&
      x.hasOwnProperty('r') &&
      x.hasOwnProperty('g') &&
      x.hasOwnProperty('b') &&
      x.hasOwnProperty('a');
  };
  var multiplyColor = function (amount) {
    return function (c) {
      return {
        r: Math.min(255, c.r * amount),
        g: Math.min(255, c.g * amount),
        b: Math.min(255, c.b * amount),
        a: c.a,
      };
    };
  };
  var desaturate = function (amount) {
    return function (c) {
      var average = (c.r + c.g + c.b) / 3;
      var coAmount = 1 - amount;
      return {
        r: coAmount * c.r + amount * average,
        g: coAmount * c.g + amount * average,
        b: coAmount * c.b + amount * average,
        a: c.a,
      };
    };
  };
  var colorBrightness = function (c) {
    return (c.r + c.g + c.b) / (255 + 255 + 255);
  };
  var colorString = function (c) {
    return 'rgba(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ',' + c.a + ')';
  };
  var rgbColorString = function (c) {
    return 'rgb(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ')';
  };
  var transparent = color({
    a: 0,
  });
  var black = color({
    r: 0,
    g: 0,
    b: 0,
  });
  var white = color({
    r: 255,
    g: 255,
    b: 255,
  });

  var mapMinWidths = function (is, ctx) {
    return stream.all(is.map(function (i) {
      return i.minWidth;
    }));
  };
  var mapMinHeights = function (is, ctx) {
    return stream.all(is.map(function (i) {
      return i.minHeight;
    }));
  };

  var url = function (str) {
    return 'url("' + str + '")';
  };

  var and = function (f) {
    return function (c) {
      return function (ctx) {
        var i = c(ctx);
        f(i, ctx);
        return i;
      };
    };
  };
  var $$ = function (f) {
    return and(function (i, ctx) {
      return f(i.$el, ctx);
    });
  };
  var jqueryMethod = function (func) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return $$(function ($el) {
        $el[func].apply($el, args);
      });
    };
  };
  var $addClass = jqueryMethod('addClass');
  var $attr = jqueryMethod('attr');
  var $css = jqueryMethod('css');
  var $on = jqueryMethod('on');
  var $prop = jqueryMethod('prop');

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
  var minWidth = function (mw) {
    return layout(function ($el, ctx, c) {
      $el.addClass('minWidth');
      var i = c();
      return {
        minWidth: stream.once(mw),
        minHeight: i.minHeight,
      };
    });
  };
  var minHeight = function (mh) {
    return layout(function ($el, ctx, c) {
      $el.addClass('minHeight');
      var i = c();
      return {
        minWidth: i.minWidth,
        minHeight: stream.once(constant(mh)),
      };
    });
  };
  var withDimensions = function (mw, mh) {
    return layout(function ($el, ctx, c) {
      $el.addClass('withDimensions');
      var i = c();
      return {
        minWidth: stream.once(mw),
        minHeight: stream.once(constant(mh)),
      };
    });
  };
  var passthrough = function (f, el) {
    return layout(el || 'div', function ($el, ctx, c) {
      $el.addClass('passthrough');
      if (f) {
        f($el);
      }
      return c();
    });
  };
  var wrap = function (el) {
    return passthrough(null, el);
  };

  var adjustPosition = function (minSize, position) {
    minSize = minSize || {};
    position = position || {};
    return layout(function ($el, ctx, c) {
      ctx = $.extend({}, ctx, {
        $el: $el,
        top: onceZeroS,
        left: onceZeroS,
        width: position.width ? stream.map(ctx.width, function (w) {
          return position.width(w, $el.children());
        }) : ctx.width,
        height: position.height ? stream.map(ctx.height, function (h) {
          return position.height(h, $el.children());
        }) : ctx.height,
        widthCalc: ctx.widthCalc && (position.widthCalc ? stream.map(ctx.widthCalc, function (wc) {
          return position.widthCalc(wc, $el.children());
        }) : ctx.widthCalc),
        heightCalc: ctx.heightCalc && (position.heightCalc ? stream.map(ctx.heightCalc, function (hc) {
          return position.heightCalc(hc, $el.children());
        }) : ctx.heightCalc),
      });
      var i = c(ctx);
      return $.extend({}, i, {
        minWidth: minSize.minWidth ? stream.map(i.minWidth, function (mw) {
          return minSize.minWidth(mw, $el.children());
        }) : i.minWidth,
        minHeight: minSize.minHeight ? stream.map(i.minHeight, function (mh) {
          return minSize.minHeight(mh, $el.children());
        }) : i.minHeight,
      });
    });
  };

  var adjustMinSize = uncurryConfig(function (config) {
    return layout(function ($el, ctx, c) {
      var i = c();
      return {
        minWidth: stream.map(i.minWidth, function (mw) {
          return config.mw(mw);
        }),
        minHeight: stream.map(i.minHeight, function (mh) {
          return config.mh(mh);
        }),
      };
    });
  });
  var link = all([
    $css('cursor', 'pointer'),
    $css('pointer-events', 'initial'),
  ]);

  // var componentName = function (name) {
  //     return passthrough(function ($el) {
  //         $el.addClass(name);
  //     });
  // };

  var onThis = function (event) {
    return function (handler) {
      return $on(event, handler);
    };
  };
  var changeThis = onThis('change');
  var clickThis = onThis('click');
  var inputPropertychangeThis = onThis('input propertychange');
  var keydownThis = onThis('keydown');
  var keyupThis = onThis('keyup');
  var mousedownThis = onThis('mousedown');
  var mousemoveThis = onThis('mousemove');
  var mouseoverThis = onThis('mouseover');
  var mouseoutThis = onThis('mouseout');
  var mouseupThis = onThis('mouseup');
  var submitThis = onThis('submit');

  var pushOnClick = function (s, f) {
    return clickThis(function (ev) {
      stream.push(s, f(ev));
    });
  };

  var hoverThis = function (cb) {
    return passthrough(function ($el) {
      cb(false, $el);
      $el.on('mouseover', function (ev) {
        cb(true, $el, ev);
      });
      $el.on('mouseout', function (ev) {
        cb(false, $el, ev);
      });
    });
  };

  var hoverStream = function (s, f) {
    f = f || function (v) {
      return v;
    };
    return $$(function ($el) {
      $el.css('pointer-events', 'initial');
      $el.on('mouseover', function (ev) {
        stream.push(s, f(ev));
      });
      $el.on('mouseout', function (ev) {
        stream.push(s, f(false));
      });
    });
  };

  var cssStream = function (style, valueS) {
    return passthrough(function ($el) {
      stream.map(valueS, function (value) {
        $el.css(style, value);
      });
    });
  };

  var backgroundColor = function (s, arg2, arg3, arg4) {
    // function may accept four arguments...
    if (isColor(s)) {
      s = {
        background: s,
        font: arg2,
        backgroundHover: arg3,
        fontHover: arg4,
      };
    }
    s = s || {};
    // or it may accept one object whose properties are either colors or streams...
    if (stream.isStream(s.background) ||
        stream.isStream(s.font) ||
        stream.isStream(s.backgroundHover) ||
        stream.isStream(s.fontHover)) {
      if (s.background && !stream.isStream(s.background)) {
        s.background = stream.once(s.background);
      }
      if (s.font && !stream.isStream(s.font)) {
        s.font = stream.once(s.font);
      }
      if (s.backgroundHover && !stream.isStream(s.backgroundHover)) {
        s.backgroundHover = stream.once(s.backgroundHover);
      }
      if (s.fontHover && !stream.isStream(s.fontHover)) {
        s.fontHover = stream.once(s.fontHover);
      }
      s = stream.combineObject(s);
    }
    // or a stream.
    if (!stream.isStream(s)) {
      s = stream.once(s);
    }
    return $$(function ($el) {
      var bc, fc, bcHover, fcHover, hoverState = false;
      var applyColors = function () {
        var applyBC = hoverState ? (bcHover || bc) : bc;
        var applyFC = hoverState ? (fcHover || fc) : fc;
        if (applyBC) {
          $el.css('background-color', colorString(applyBC));
        }
        if (applyFC) {
          $el.css('color', colorString(applyFC));
        }
      };
      stream.map(s, function (colors) {
        bc = colors.background;
        fc = colors.font;
        bcHover = colors.backgroundHover || bc;
        fcHover = colors.fontHover || fc;
        applyColors();
      });
      $el.on('mouseover', function () {
        hoverState = true;
        applyColors();
      });
      $el.on('mouseout', function () {
        hoverState = false;
        applyColors();
      });
    });
  };

  var crop = function (amount) {
    var top = amount.all || 0,
        bottom = amount.all || 0,
        left = amount.all || 0,
        right = amount.all || 0;

    // amount may be a single number
    if ($.isNumeric(amount)) {
      top = bottom = left = right = amount;
    }
    // or an object with properties containing 'top', 'bottom', 'left', and 'right'
    else {
      for (var key in amount) {
        var lcKey = key.toLowerCase();
        if (amount[key] !== null) {
          if (lcKey.indexOf('top') !== -1) {
            top = amount[key];
          }
          if (lcKey.indexOf('bottom') !== -1) {
            bottom = amount[key];
          }
          if (lcKey.indexOf('left') !== -1) {
            left = amount[key];
          }
          if (lcKey.indexOf('right') !== -1) {
            right = amount[key];
          }
        }
      }
    }
    return layout(function ($el, ctx, c) {
      $el.addClass('crop');
      var props = stream.create();
      var i = c({
        top: stream.prop(props, 'top'),
        left: stream.prop(props, 'left'),
        width: stream.prop(props, 'width'),
        height: stream.prop(props, 'height'),
      });
      var minWidth = stream.create();
      var minHeight = stream.create();
      stream.combineInto([
        i.minWidth,
        i.minHeight,
        ctx.width,
        ctx.height,
      ], function (mw, mh, w, h) {
        var width = w / (1 - left - right);
        var height = h / (1 - top - bottom);
        return {
          top: -top * height,
          left: -left * width,
          width: width,
          height: height,
        };
      }, props);
      stream.combine([
        i.minWidth,
        i.minHeight,
      ], function (mw, mh) {
        stream.push(minWidth, mw * (1 - left - right));
        stream.push(minHeight, function (w) {
          return mh(mw / (1 - left - right)) * (1 - top - bottom);
        });
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
      };
    });
  };
  var aspectRatio = function (w, h) {
    return (h === 0) ? 1 : (w / h);
  };
  var keepAspectRatio = uncurryConfig(function (config) {
    config = config || {};
    return layout(function ($el, ctx, c) {
      $el.addClass('keepAspectRatio');
      var props = stream.create();
      var i = c({
        top: stream.prop(props, 'top'),
        left: stream.prop(props, 'left'),
        width: stream.prop(props, 'width'),
        height: stream.prop(props, 'height'),
      });
      stream.combineInto([
        i.minWidth,
        i.minHeight,
        ctx.width,
        ctx.height,
      ], function (mw, mh, w, h) {
        var ar = aspectRatio(mw, mh(mw));
        var AR = aspectRatio(w, h);
        // container is wider
        if ((!config.fill && AR > ar) ||
            (config.fill && AR < ar)) {
          var usedWidth = h * ar;

          var left;
          if (config.left) {
            left = 0;
          }
          else if (config.right) {
            left = w - usedWidth;
          }
          else {
            left = (w - usedWidth) / 2;
          }

          return {
            top: 0,
            left: left,
            width: usedWidth,
            height: h,
          };
        }
        // container is taller
        else {
          var usedHeight = w / ar;

          var top;
          if (config.top) {
            top = 0;
          }
          else if (config.bottom) {
            top = h - usedHeight;
          }
          else {
            top = (h - usedHeight) / 2;
          }

          return {
            top: top,
            left: 0,
            width: w,
            height: usedHeight,
          };
        }
      }, props);
      var minWidth = stream.create();
      var minHeight = stream.create();
      stream.combine([
        i.minWidth,
        i.minHeight,
      ], function (mw, mh) {
        if (config.minWidth) {
          stream.push(minWidth, config.minWidth);
        }
        else if (config.minHeight) {
          var ar = aspectRatio(mw, mh(mw));
          stream.push(minWidth, config.minHeight * ar);
        }
        else {
          stream.push(minWidth, mw);
        }
        stream.push(minHeight, function (w) {
          return w / aspectRatio(w, mh(mw));
        });
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
      };
    });
  });

  var image = function (config) {
    var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
    return img(function ($el, ctx) {
      var minWidth = stream.create();
      var minHeight = stream.create();
      if (srcStream.lastValue) {
        $el.prop('src', srcStream.lastValue);
      }
      $el.prop('alt', config.alt);
      stream.map(srcStream, function (src) {
        updateDomFunc($el, 'prop', 'src', src);
      });
      $el.on('load', function () {
        var aspectRatio = $el[0].naturalWidth / $el[0].naturalHeight;
        var mw = (config.hasOwnProperty('minWidth') && config.minWidth) ||
              (config.hasOwnProperty('minHeight') && config.minHeight && config.minHeight * aspectRatio) ||
              $el[0].naturalWidth;
        if (config.minWidth === 0 || config.minHeight === 0) {
          mw = 0;
        }
        stream.push(minWidth, mw);
        stream.push(minHeight, function (w) {
          return w / aspectRatio;
        });
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
      };
    });
  };

  var linkTo = uncurryConfig(function (config) {
    if ($.type(config) === 'string') {
      config = {
        href: config,
      };
    }
    return layout('a', function ($el, ctx, c) {
      $el.prop('href', config.href);
      $el.css('pointer-events', 'initial');
      if (config.target) {
        $el.prop('target', config.target);
      }
      if (!config.defaultStyle) {
        $el.addClass('no-style');
      }
      return c();
    });
  });

  var empty = function (el) {
    return component(el, function ($el, ctx) {
      $el.addClass('empty');
      return {
        minWidth: onceZeroS,
        minHeight: onceConstantZeroS,
      };
    });
  };
  var nothing = empty("div");

  var once300S = stream.once(300);
  var text = uncurryConfig(function (config) {
    // config2 is present in v0.2.1 for backward compatibility, it may
    // be removed in a future version
    return function (strs, config2) {
      strs = strs || '';
      if (!$.isArray(strs)) {
        strs = [strs];
      }
      config = config || config2 || {};
      if ($.isArray(config)) {
        config = config.reduce($.extend, {});
      }

      config.lineHeight = config.lineHeight || 1;

      return (config.el || div)(function ($el, ctx) {
        var didMH = false;
        var mwS = (config.minWidth ||
                   (config.measureWidth))
              ? stream.create()
              : once300S;
        var mhS = stream.create();
        var spanStreams = [];
        $el.addClass('text');
        strs.map(function (c, index) {
          if ($.type(c) === 'string') {
            c = {
              str: c,
            };
            strs[index] = c;
          }
          if (c.font) {
            c = $.extend(c, c.font);
          }
          if (c.fonts) {
            c.fonts.map(function (font) {
              c = $.extend(c, font);
            });
          }
          var $span = $(document.createElement('span'));
          var updateStr = function (str) {
            if (index === 0) {
              str = ' ' + str;
            }
            if (index === strs.length - 1) {
              str = str + ' ';
            }
            $span.html(str);
            c.words = str.split(' ');
          };
          if (stream.isStream(c.str)) {
            spanStreams.push(stream.map(c.str, function (x) {
              updateStr(x);
            }));
          }
          else {
            updateStr(c.str);
          }
          c.size = c.size || config.size;
          var fontStyle = 'normal';
          var fontVariant = 'normal';
          var fontWeight = c.weight || config.weight || 'normal';
          var fontSize = c.size || config.size || parseInt($el.css('font-size'));
          var lineHeight = c.lineHeight || config.lineHeight || $el.css('line-height');
          var fontFamily = c.family || config.family || 'initial';
          c.font = [
            fontStyle,
            fontVariant,
            fontWeight,
            fontSize + 'px/' + lineHeight,
            fontFamily,
          ].join(' ');

          if (c.size) {
            if (stream.isStream(c.size)) {
              spanStreams.push(stream.map(c.size, function (x) {
                $span.css('font-size', x);
              }));
            }
            else {
              $span.css('font-size', c.size);
            }
          }
          if (c.weight) {
            if (stream.isStream(c.weight)) {
              spanStreams.push(stream.map(c.weight, function (x) {
                $span.css('font-weight', c.x);
              }));
            }
            else {
              $span.css('font-weight', c.weight);
            }
          }
          if (c.family) {
            if (stream.isStream(c.family)) {
              spanStreams.push(stream.map(c.family, function (x) {
                $span.css('font-family', c.x);
              }));
            }
            else {
              $span.css('font-family', c.family);
            }
          }
          if (c.color) {
            if (stream.isStream(c.color)) {
              spanStreams.push(stream.map(c.color, function (x) {
                $span.css('color', colorString(x));
              }));
            }
            else {
              $span.css('color', colorString(c.color));
            }
          }
          if (c.shadow) {
            if (stream.isStream(c.shadow)) {
              spanStreams.push(stream.map(c.shadow, function (x) {
                $span.css('text-shadow', c.x);
              }));
            }
            else {
              $span.css('text-shadow', c.shadow);
            }
          }
          if (c.align) {
            if (stream.isStream(c.align)) {
              spanStreams.push(stream.map(c.align, function (x) {
                $span.css('vertical-align', c.x);
              }));
            }
            else {
              $span.css('vertical-align', c.align);
            }
          }
          if (c.spanCSS) {
            c.spanCSS.map(function (css) {
              $span.css(css.name, css.value);
            });
          }
          if (c.linkTo) {
            var $a = $(document.createElement('a'));
            $a.prop('href', c.linkTo).appendTo($el);
            $span.appendTo($a);
          }
          else {
            $span.appendTo($el);
          }
        });
        var firstPush = true;
        var pushDimensions = function () {
          stream.next(function () {
            // var mw = (config.hasOwnProperty('minWidth') && config.minWidth) ||
            //         (config.measureWidth && strs.reduce(function (a, c, index) {
            //           var width = measureTextWidth(c.str, c.font);
            //           return a + width;
            //         }, 0)) ||
            //         300;
            var mw = config.minWidth ||
                  (config.measureWidth && measureWidth($el)) ||
                  null;
            var mh = (config.oneLine && $el.css('line-height').indexOf('px') !== -1 && constant(parseFloat($el.css('line-height')))) || function (w) {
              // TODO: loop over spans
              var fontSize = config.size || parseInt($el.css('font-size'));
              var str = $el.text();
              var lineHeight = config.lineHeight;
              return Math.ceil(fontSize * str.length * 0.5 / w) * fontSize * config.lineHeight;
            };
            if (!config.oneLine) {
              stream.defer(function () {
                var mh = (config.minHeight && constant(config.minHeight)) ||
                      measureHeight($el);
                // measureTextHeight(strs.map(function (c) {
                //   return {
                //     words: c.words.slice(0),
                //     font: c.font,
                //     size: c.size || config.size,
                //   };
                // }), config.lineHeight);
                stream.push(mhS, mh);
              });
            }
            if (mw !== null) {
              stream.push(mwS, mw);
            }
            if (config.oneLine || config.approximateHeight) {
              stream.push(mhS, mh);
            }
            firstPush = false;
          });
        };
        if (spanStreams.length > 0) {
          stream.combine(spanStreams, function () {
            pushDimensions();
          });
        }
        if (config.size) {
          if (stream.isStream(config.size)) {
            stream.map(config.size, function (size) {
              $el.css('font-size', size);
              pushDimensions();
            });
          }
          else {
            $el.css('font-size', config.size);
          }
        }
        if (config.weight) {
          if (stream.isStream(config.weight)) {
            stream.map(config.weight, function (weight) {
              $el.css('font-weight', weight);
              pushDimensions();
            });
          }
          else {
            $el.css('font-weight', config.weight);
          }
        }
        if (config.family) {
          if (stream.isStream(config.family)) {
            stream.map(config.family, function (family) {
              $el.css('font-family', family);
              pushDimensions();
            });
          }
          else {
            $el.css('font-family', config.family);
          }
        }
        if (config.color) {
          if (stream.isStream(config.color)) {
            stream.map(config.color, function (color) {
              $el.css('color', colorString(color));
              pushDimensions();
            });
          }
          else {
            $el.css('color', colorString(config.color));
          }
        }
        if (config.shadow) {
          if (stream.isStream(config.shadow)) {
            stream.map(config.shadow, function (shadow) {
              $el.css('text-shadow', shadow);
              pushDimensions();
            });
          }
          else {
            $el.css('text-shadow', config.shadow);
          }
        }
        if (config.align) {
          if (stream.isStream(config.align)) {
            stream.map(config.align, function (align) {
              $el.css('text-align', align);
              pushDimensions();
            });
          }
          else {
            $el.css('text-align', config.align);
          }
        }

        // if (config.minWidth) {
        //     stream.push(mw, config.minWidth);
        // }
        // else if (config.measureWidth) {
        //     stream.push(mw, measureWidth($el));
        // }
        // else {
        //     stream.push(mw, 0);
        // }

        // if (config.minHeight) {
        //     stream.push(mh, config.minHeight);
        // }
        // else if (config.measureHeight) {
        //     stream.push(mh, measureHeight($el));
        // }
        // else {
        //     stream.push(mh, constant(0));
        // }

        pushDimensions();

        return {
          minWidth: mwS,
          minHeight: mhS,
        };
      });
    };
  }, function (obj) {
    if ($.isArray(obj)) {
      obj = obj[0];
    }
    return $.type(obj) === 'string' || (obj && obj.hasOwnProperty('str'));
  });

  var ignoreSurplusWidth = function (_, cols) {
    return cols;
  };
  var ignoreSurplusHeight = function (_, rows) {
    return rows;
  };
  var centerSurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.left += surplusWidth / 2;
    });
    return positions;
  };
  var evenlySplitSurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.width += widthPerCol;
      position.left += i * widthPerCol;
    });
    return positions;
  };
  var evenlySplitCenterSurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.left += (i + 0.5) * widthPerCol;
    });
    return positions;
  };
  var centerAllSameSurplusWidth = function () {
    var w = 0;
    return function (gridWidth, positions, _, i) {
      if (i === 0) {
        positions = evenlySplitSurplusWidth(gridWidth, positions);
        w = positions[0].width;
        return positions;
      }
      else {
        positions.map(function (position, i) {
          position.width = w;
          position.left = w * i;
        });
        return centerSurplusWidth(gridWidth, positions);
      }
    };
  };
  var centerFirstRowThenAlignLeftSurplusWidth = function () {
    var left = 0;
    return function (gridWidth, positions, i) {
      if (i === 0) {
        positions = centerSurplusWidth(gridWidth, positions);
        left = positions[0].left;
        return positions;
      }
      else {
        positions.map(function (position, i) {
          position.left += left;
        });
        return positions;
      }
    };
  };
  // don't read this function, please
  var evenlySplitSurplusWidthWithMinPerRow = function (minPerRow) {
    return function (gridWidth, positions) {
      var lastPosition = positions[positions.length - 1];
      var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
      var widthPerCol = gridWidth / Math.max(minPerRow, positions.length);
      positions.map(function (position, i) {
        position.width = widthPerCol;
        position.left = i * widthPerCol;
      });
      lastPosition = positions[positions.length - 1];
      surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
      widthPerCol = surplusWidth / positions.length;
      positions.map(function (position, i) {
        position.left += surplusWidth / 2;
      });
      return positions;
    };
  };
  var justifySurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    positions.map(function (position, i) {
      for (var index = 0; index < i; index++) {
        position.left += surplusWidth / (positions.length - 1);
      }
    });
    return positions;
  };
  var justifyAndCenterSurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    positions.map(function (position, i) {
      position.left += i * surplusWidth / (positions.length) +
        surplusWidth / (2 * positions.length);
    });
    return positions;
  };
  var surplusWidthAlign = function (t) {
    return function (gridWidth, positions) {
      var lastPosition = positions[positions.length - 1];
      var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
      positions.map(function (position, i) {
        position.left += t * surplusWidth;
      });
      return positions;
    };
  };
  var surplusWidthAlignLeft = surplusWidthAlign(0);
  var surplusWidthAlignCenter = surplusWidthAlign(0.5);
  var surplusWidthAlignRight = surplusWidthAlign(1);
  var superSurplusWidth = function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    if (positions.length === 1) {
      // if we're the only thing on the row, stretch up to roughly
      // double our min width
      if (surplusWidth < positions[0].width) {
        return evenlySplitSurplusWidth(gridWidth, positions);
      }
      else {
        return positions;
      }
    }
    if (positions.length === 2) {
      // if there are two things in the row, make two columns each
      // with centered content
      return justifyAndCenterSurplusWidth(gridWidth, positions);
    }
    // if there are 3+ things in the row, then justify
    return justifySurplusWidth(gridWidth, positions);
  };

  var giveToNth = function (n) {
    return function (gridWidth, positions) {
      var lastPosition = positions[positions.length - 1];
      var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
      positions.map(function (position, i) {
        if (i === n || (i === positions.length - 1 && n >= positions.length)) {
          position.width += surplusWidth;
        }
        else if (i > n) {
          position.left += surplusWidth;
        }
      });
      return positions;
    };
  };
  var giveToFirst = giveToNth(0);
  var giveToSecond = giveToNth(1);
  var giveToThird = giveToNth(2);

  var centerSurplusHeight = function (totalHeight, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
    positions.map(function (position, i) {
      position.top += surplusHeight / 2;
    });
    return positions;
  };
  var evenlySplitSurplusHeight = function (totalHeight, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
    var heightPerCol = surplusHeight / positions.length;
    positions.map(function (position, i) {
      position.height += heightPerCol;
      position.top += i * heightPerCol;
    });
    return positions;
  };
  var giveHeightToNth = function (n) {
    return function (totalHeight, positions) {
      var lastPosition = positions[positions.length - 1];
      var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
      positions.map(function (position, i) {
        if (i === n || (i === positions.length - 1 && n >= positions.length)) {
          position.height += surplusHeight;
        }
        else if (i > n) {
          position.top += surplusHeight;
        }
      });
      return positions;
    };
  };
  var giveHeightToLast = function (totalHeight, positions) {
    var n = positions.length - 1;
    var lastPosition = positions[positions.length - 1];
    var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
    positions.map(function (position, i) {
      if (i === n || (i === positions.length - 1 && n >= positions.length)) {
        position.height += surplusHeight;
      }
      else if (i > n) {
        position.top += surplusHeight;
      }
    });
    return positions;
  };

  var slideshow = uncurryConfig(function (config) {
    config.padding = config.padding || 0;
    config.transitionTime = config.transitionTime || 0;
    return layout(function ($el, ctx, cs) {
      $el.addClass('slideshow');

      var contexts = cs.concat(cs).concat(cs).map(function () {
        return {
          left: stream.create(),
        };
      });
      var is = cs.concat(cs).concat(cs).map(function (c, index) {
        return c(contexts[index]);
      });

      // the state
      var segmentOrder = [0, 1, 2];

      var findSegment = function (index) {
        return modulo(Math.floor((index + cs.length) / cs.length), 3);
      };

      var allMinWidths = mapMinWidths(is);
      var allMinHeights = mapMinHeights(is);

      var computePositions = function (selected, width, mws, mhs, warpIndex) {
        return mws.map(function (mw, index) {
          var thisSegment = Math.floor(index / cs.length);
          var thisSegmentIndex = segmentOrder.indexOf(thisSegment);
          var offset = modulo(index, cs.length) - modulo(selected, cs.length);
          return {
            left: (offset + (thisSegmentIndex - 1) * cs.length) * (width + config.padding),
            warp: thisSegmentIndex === warpIndex,
          };
        });
      };

      var moveSlideshow = function (positions, selectedIndex, teleport, cb) {
        positions.map(function (position, index) {
          var ctx = contexts[index];
          is[index].$el.css('transition', position.warp ? '' : 'left ease ' + config.transitionTime + 's');
          stream.push(ctx.left, position.left);
        });
        cb && setTimeout(function () {
          cb();
        }, 500);
      };

      var modulo = function (a, b) {
        return ((a % b) + b) % b;
      };

      var selectedIndexS = stream.reduce(config.moveS, function (a, b) {
        return a + b.amount;
      }, 0);
      var minHeight = stream.combine([
        selectedIndexS,
        ctx.width,
        allMinWidths,
        allMinHeights,
      ], function (selectedIndex, width, mws, mhs) {
        var selectedIndexModuloCs = modulo(selectedIndex, cs.length);
        var targetSegment = findSegment(selectedIndex);
        var targetSegmentIndex = segmentOrder.indexOf(targetSegment);
        var positions;
        switch (targetSegmentIndex) {
        case 0:
          segmentOrder = [
            segmentOrder[2],
            segmentOrder[0],
            segmentOrder[1],
          ];
          positions = computePositions(selectedIndexModuloCs + cs.length, width, mws, mhs, 0);
          moveSlideshow(positions, selectedIndexModuloCs + cs.length);
          break;
        case 1:
          positions = computePositions(selectedIndexModuloCs + cs.length, width, mws, mhs);
          moveSlideshow(positions, selectedIndexModuloCs + cs.length);
          break;
        case 2:
          segmentOrder = [
            segmentOrder[1],
            segmentOrder[2],
            segmentOrder[0],
          ];
          positions = computePositions(selectedIndexModuloCs + cs.length, width, mws, mhs, 2);
          moveSlideshow(positions, selectedIndexModuloCs + cs.length);
          break;
        }
        return constant(mhs.map(function (mh, i) {
          return mh(width);
        }).reduce(mathMax, 0));
      });
      stream.push(minHeight, constant(0));

      return {
        minWidth: stream.map(allMinWidths, function (mws) {
          return mws.reduce(add, config.padding * (is.length - 1));
        }),
        minHeight: minHeight,
      };
    });
  });
  // var slideshowVertical = function (config, cs) {
  //     config.padding = config.padding || 0;
  //     config.topTransition = config.topTransition || 'none';
  //     config.alwaysFullHeight = config.alwaysFullHeight || false;
  //     return div.all([
  //         $css('overflow', 'hidden'),
  //         componentName('slideshow'),
  //         children(cs.map(function (c) {
  //             return c.all([
  //                 $css('transition', 'top ' + config.topTransition),
  //             ]);
  //         })),
  //         wireChildren(function (instance, context, is) {
  //             var allMinWidths = mapMinWidths(is, ctx);
  //             var allMinHeights = mapMinHeights(is, ctx);

  //             allMinWidths.map(function (mws) {
  //                 return mws.reduce(mathMax, 0);
  //             }, instance.minWidth);

  //             stream.combine([
  //                 context.width,
  //                 allMinHeights,
  //             ], function (w, mhs) {
  //                 stream.push(instance.minHeight, mhs.map(apply(w)).reduce(mathMax, 0));
  //             });

  //             var contexts = is.map(function (i) {
  //                 return {
  //                     top: stream.create(),
  //                     left: stream.once(0),
  //                     width: context.width,
  //                     height: i.minHeight,
  //                 };
  //             });

  //             stream.combine([
  //                 config.selected,
  //                 context.width,
  //                 context.height,
  //                 allMinWidths,
  //                 allMinHeights,
  //             ], function (selected, width, height, mws, mhs) {
  //                 var selectedTop = 0;
  //                 var selectedHeight = 0;
  //                 var top = 0;
  //                 var positions = mhs.map(function (mh, index) {
  //                     mh = config.alwaysFullHeight ? height : mh(width);
  //                     if (selected === index) {
  //                         selectedTop = top + config.padding * index;
  //                         selectedHeight = mh;
  //                     }
  //                     var position = {
  //                         top: top + config.padding * index,
  //                         height: mh
  //                     };
  //                     top += mh;
  //                     return position;
  //                 });
  //                 var dTop = (height - selectedHeight) / 2 - selectedTop;
  //                 positions.map(function (position) {
  //                     position.top += dTop;
  //                 });

  //                 positions.map(function (position, index) {
  //                     var ctx = contexts[index];
  //                     stream.push(ctx.top, position.top);
  //                     stream.push(ctx.height, position.height);
  //                 });
  //             });

  //             return [contexts];
  //         }),
  //     ]);
  // };

  var sideBySide = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusWidthFunc = config.surplusWidthFunc || ignoreSurplusWidth;
    return layout(function ($el, ctx, cs) {
      $el.addClass('sideBySide');
      if (cs.length === 0) {
        return {
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
        };
      }
      var contexts = [];
      var is = cs.map(function (c) {
        var context = {
          left: stream.create(),
          width: stream.create(),
        };
        contexts.push(context);
        return c(context);
      });
      var allMinWidths = mapMinWidths(is, ctx);
      var allMinHeights = mapMinHeights(is, ctx);
      var minHeightStreams = [allMinHeights];
      var computePositions = function (width, mws) {
        var left = 0;
        var positions = mws.map(function (mw, index) {
          var w = Math.min(width, mw);
          var position = {
            left: left + config.padding * index,
            width: w,
          };
          left += w;
          return position;
        });
        positions = config.surplusWidthFunc(width, positions);
        return positions;
      };
      stream.combine([
        ctx.width,
        allMinWidths,
        allMinHeights,
        config.sourcePositionsS || stream.once([]),
      ], function (width, mws, mhs, sourcePositions) {
        var positions = computePositions(width, mws);
        if (config.targetPositionsS) {
          stream.push(config.targetPositionsS, positions);
        }
        sourcePositions.map(function (position, index) {
          positions[index] = position;
        });
        positions.map(function (position, index) {
          var ctx = contexts[index];
          stream.push(ctx.left, position.left);
          stream.push(ctx.width, position.width);
        });
      });
      return {
        minWidth: stream.map(allMinWidths, function (mws) {
          return mws.reduce(add, config.padding * (is.length - 1));
        }),
        minHeight: stream.combine([
          allMinWidths,
          allMinHeights,
        ], function (mws, mhs) {
          return function (w) {
            var positions = computePositions(w, mws);
            return positions.map(function (position, i) {
              return mhs[i](positions[i].width);
            }).reduce(mathMax, 0);
          };
        }),
      };
    });
  });

  var slideIn = uncurryConfig(function (config) {
    config = config || {};
    config.top = config.top || 50;
    config.transition = config.transition || '1s';
    return layout(function ($el, ctx, c) {
      var context = {
        top: stream.create(),
      };
      var i = c(context);
      i.$el.css('transition', 'top ' + config.transition);
      var pushed = false;
      stream.push(context.top, config.top);
      stream.combine([
        ctx.topOffset,
        ctx.top,
        windowHeight,
        windowScroll,
        displayedS,
      ], function (ta, t, wh, ws, d) {
        if (!pushed && d) {
          var top = ta + t;
          var visibleUntil = ws + wh;
          if (top <= visibleUntil) {
            stream.push(context.top, 0);
            pushed = true;
          }
        }
      });
      return {
        minWidth: i.minWidth,
        minHeight: i.minHeight,
      };
    });
  });
  var fadeIn = uncurryConfig(function (config) {
    config = config || {};
    config.transition = config.transition || '1s';
    config.margin = config.margin || 0;
    return layout(function ($el, ctx, c) {
      var i = c();
      var pushed = false;
      i.$el.css('opacity', 0);
      setTimeout(function () {
        i.$el.css('transition', 'opacity ' + config.transition);
      });
      stream.combine([
        ctx.topOffset,
        ctx.top,
        windowHeight,
        windowScroll,
        displayedS,
      ], function (ta, t, wh, ws, d) {
        if (!pushed && d) {
          var top = ta + t;
          var visibleUntil = ws + wh;
          if (top + config.margin <= visibleUntil) {
            i.$el.css('opacity', 1);
            pushed = true;
          }
        }
      });
      return {
        minWidth: i.minWidth,
        minHeight: i.minHeight,
      };
    });
  });

  var slider = uncurryConfig(function (config, cs) {
    config = config || {};
    config.leftTransition = config.leftTransition || '0s';
    var grabbedS = stream.once(false);
    var edge = {
      left: 'left',
      right: 'right',
    };
    var stateS = stream.once({
      index: 0,
      edge: 'left',
    });
    var xCoord = 0;
    return layout(function ($el, ctx, cs) {
      $el.addClass('slider')
        .css('overflow-x', 'hidden')
        .css('cursor', 'move');

      var allMinWidths = stream.create();
      var allMinHeights = stream.create();

      var leftS = stream.combine([
        ctx.width,
        allMinWidths,
        stateS,
        grabbedS
      ], function (width, mws, state, grabbed) {
        // configure left to be the left parameter of the first article in the slider
        var left = state.edge === 'left' ? 0 : width; // would love to case split
        mws.map(function (mw, index) {
          if (index < state.index) {
            left -= mw;
          }
          if (state.edge === 'right' && index === state.index) {
            left -= mw;
          }
        });
        if (grabbed !== false) {
          left += grabbed;
        }
        return left;
      });

      var leftsS = stream.combine([
        allMinWidths,
        leftS,
      ], function (mws, left) {
        return mws.reduce(function (acc, v) {
          acc.arr.push(acc.lastValue);
          acc.lastValue += v;
          return acc;
        }, {
          arr: [],
          lastValue: left,
        }).arr;
      });

      var ctxs = cs.map(function (_, index) {
        return {
          top: onceZeroS,
          left: stream.map(leftsS, function (lefts) {
            return lefts[index];
          }),
          width: stream.create(),
          height: ctx.height,
        };
      });
      var is = cs.map(function (c, index) {
        var i = c(ctxs[index]);
        stream.pushAll(i.minWidth, ctx.width);
        return i;
      });
      stream.pushAll(mapMinWidths(is, ctx), allMinWidths);
      stream.pushAll(mapMinHeights(is, ctx), allMinHeights);

      var totalMinWidthS = stream.map(allMinWidths, function (mws) {
        return mws.reduce(add, 0);
      });

      $el.css('user-select', 'none');
      $el.on('mousedown', function (ev) {
        ev.preventDefault();
        stream.push(grabbedS, 0);
        is.map(function (i) {
          i.$el.css('transition', 'left 0s');
        });
      });

      var release = function (ev) {
        is.map(function (i) {
          i.$el.css('transition', 'left ' + config.leftTransition);
        });
        var mws = allMinWidths.lastValue;
        var width = ctx.width.lastValue;
        var grabbed = grabbedS.lastValue;
        if (!grabbed) {
          return;
        }
        var left = leftS.lastValue;
        // array of sums of min widths
        var edgeScrollPoints = mws.reduce(function (a, mw) {
          var last = a[a.length - 1];
          a.push(last - mw);
          return a;
        }, [0]);
        var closest = edgeScrollPoints.reduce(function (a, scrollPoint, index) {
          var leftDistanceHere = Math.abs(scrollPoint - left);
          var rightDistanceHere = Math.abs(scrollPoint - (left - width));
          return {
            left: leftDistanceHere < a.left.distance ? {
              distance: leftDistanceHere,
              index: index,
            } : a.left,
            right: rightDistanceHere < a.right.distance ? {
              distance: rightDistanceHere,
              index: index - 1,
            } : a.right,
          };
        }, {
          left: {
            distance: Number.MAX_VALUE,
            index: -1,
          },
          right: {
            distance: Number.MAX_VALUE,
            index: -1,
          },
        });
        if (closest.left.distance <= closest.right.distance) {
          stream.push(stateS, {
            index: closest.left.index,
            edge: 'left',
          });
        }
        else {
          stream.push(stateS, {
            index: closest.right.index,
            edge: 'right',
          });
        }
        stream.push(grabbedS, false);
        ev.preventDefault();
      };
      $el.on('mouseup', release);
      $el.on('mouseout', release);
      $el.on('mousemove', function (ev) {
        var grabbed = grabbedS.lastValue;
        var totalMinWidth = totalMinWidthS.lastValue;
        var width = ctx.width.lastValue;
        var left = leftS.lastValue;
        if (grabbed !== false) {
          var dx = ev.clientX - xCoord;
          var left2 = left + dx;
          left2 = Math.min(0, left2);
          if (totalMinWidth > width) {
            left2 = Math.max(width - totalMinWidth, left2);
          }
          dx = left2 - left;
          grabbed = grabbed + dx;
          stream.push(grabbedS, grabbed);
        }
        xCoord = ev.clientX;
      });

      return {
        minWidth: stream.map(allMinWidths, function (mws) {
          return mws.reduce(mathMax, 0);
        }),
        minHeight: stream.combine([
          allMinWidths,
          allMinHeights,
        ], function (mws, mhs) {
          return constant(mhs.map(function (mh, i) {
            return mh(mws[i]);
          }).reduce(mathMax, 0));
        }),
      };
    });
  });

  var stack = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusHeightFunc = config.surplusHeightFunc || ignoreSurplusHeight;
    config.collapsePadding = config.collapsePadding || false;
    config.transition = config.transition || 0;
    return layout(function ($el, ctx, cs) {
      $el.addClass('stack');
      if (cs.length === 0) {
        return {
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
        };
      }
      var contexts = [];
      var is = cs.map(function (c) {
        var context = {
          widthCalc: stream.once('100%'),
          top: stream.create(),
          height: stream.create(),
        };
        contexts.push(context);
        return c(context);
      });
      if (config.transition) {
        var transition = config.transition + 's';
        is.map(function (i) {
          i.$el.css('transition', 'height ' + transition + ', top ' + transition);
        });
      }
      var allMinWidths = mapMinWidths(is);
      var allMinHeights = mapMinHeights(is);
      stream.combine([
        ctx.width,
        ctx.height,
        allMinHeights,
      ], function (width, height, mhs) {
        var top = 0;
        var positions = mhs.map(function (mh, index) {
          var position = {
            top: top,
            height: mh(width),
          };
          var minHeight = mh(width);
          if (config.collapsePadding) {
            if (minHeight > 0) {
              top += minHeight + config.padding;
            }
          }
          else {
            top += minHeight + config.padding;
          }
          return position;
        });
        positions = config.surplusHeightFunc(height, positions);
        positions.map(function (position, index) {
          var context = contexts[index];
          stream.push(context.top, position.top);
          stream.push(context.height, position.height);
        });
      });
      return {
        minWidth: stream.map(allMinWidths, function (mws) {
          return mws.reduce(mathMax, 0);
        }),
        minHeight: stream.map(allMinHeights, function (mhs) {
          return function (w) {
            var minHeights = mhs.map(apply(w));
            return minHeights.reduce(add, config.padding * (minHeights.filter(function (x) {
              return !config.collapsePadding || x > 0;
            }).length - 1));
          };
        }),
      };
    });
  });

  var stackStream = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusHeightFunc = config.surplusHeightFunc || ignoreSurplusHeight;
    config.transition = config.transition || 0;
    return function (actionS) {
      return container(function ($el, ctx, append) {
        var mw = stream.once(0);
        var mh = stream.once(constant(0));
        var contexts = [];
        var is = [];
        var mwDeleteListeners = [];
        var mhDeleteListeners = [];
        var tryPushContexts = function () {
          var width = ctx.width.lastValue;
          var height = ctx.height.lastValue;
          var mws = [];
          var mhs = [];
          is.map(function (i, index) {
            mws[index] = i.minWidth.lastValue;
            mhs[index] = i.minHeight.lastValue;
          });
          // if children have all provided mws and mhs, then provide mw and mh
          if (!mws.concat(mhs).reduce(function (a, b) {
            return a && b !== undefined;
          }, true)) {
            return;
          }
          stream.push(mw, mws.reduce(mathMax, 0));
          stream.push(mh, function (w) {
            return mhs.map(apply(w)).reduce(add, config.padding * (is.length - 1));
          });
          // if width and height from context, then position children
          if (width === undefined) {
            return;
          }
          if (height === undefined) {
            return;
          }
          var top = 0;
          var idx = -1;
          var positions = mhs.map(function (mh) {
            idx += 1;
            var position = {
              top: top + config.padding * idx,
              height: mh(width),
            };
            top += mh(width);
            return position;
          });
          positions = config.surplusHeightFunc(height, positions);
          contexts.map(function (context, index) {
            var position = positions[index];
            stream.push(context.top, position.top);
            stream.push(context.height, position.height);
          });
          return true;
        };
        stream.onValue(ctx.width, tryPushContexts);
        stream.onValue(ctx.height, tryPushContexts);
        var cs = [];
        var index = -1;
        var insert = function (c, idx) {
          for (var ii = cs.length; ii > idx; ii--) {
            cs[ii+1] = cs[ii];
            mwDeleteListeners[ii+1] = mwDeleteListeners[ii];
            mhDeleteListeners[ii+1] = mhDeleteListeners[ii];
            contexts[ii+1] = contexts[ii];
            is[ii+1] = is[ii];
          }
          index += 1;
          var context = {
            top: stream.create(),
            height: stream.create(),
          };
          var i = append(c, context);

          cs[index] = c;
          mwDeleteListeners[index] = stream.map(i.minWidth, tryPushContexts);
          mhDeleteListeners[index] = stream.map(i.minHeight, tryPushContexts);
          contexts[index] = context;
          is[index] = i;

          return index;
        };
        var remove = function (c) {
          var index = cs.indexOf(c);
          is[index].remove();
          mwDeleteListeners[index]();
          mhDeleteListeners[index]();
          delete cs[index];
          delete mwDeleteListeners[index];
          delete mhDeleteListeners[index];
          delete contexts[index];
          delete is[index];
          tryPushContexts();
        };
        stream.onValue(actionS, function (action) {
          caseSplit({
            insert: insert,
            insertMany: function (cs) {
              cs.map(insert);
            },
            remove: remove,
          }, action);
        });
        return {
          minWidth: mw,
          minHeight: mh,
        };
      });
    };
  });

  var tree = uncurryConfig(function (config, index) {
    config = config || {};
    config.indent = config.indent || 10;
    return function (actionS) {
      var expandedS = stream.once(true);
      return sideBySide()([
        componentStream(stream.map(expandedS, function (e) {
        })),
        stackStream(config)(stream.map(actionS, caseSplit({
          expand: function (c, i) {
          },
          collapse: function (i) {
          },
        }))),
      ]);
    };
  });

  var intersperse = function (arr, v) {
    var result = [];
    arr.map(function (el) {
      result.push(el);
      result.push(v);
    });
    result.pop();
    return result;
  };

  var overflowHorizontal = uncurryConfig(function (config) {
    config = config || {};
    return layout(function ($el, ctx, c) {
      $el.css('overflow-x', 'auto')
        .css('pointer-events', 'initial');
      var widthS = stream.create();
      var heightS = stream.create();
      var i = c({
        width: widthS,
        height: heightS,
      });
      var minWidth;
      if (config.minWidth) {
        if ($.type(config.minWidth) === 'number') {
          minWidth = stream.once(config.minWidth);
        }
        if ($.type(config.minWidth) === 'function') {
          minWidth = stream.map(i.minWidth, config.minWidth);
        }
      }
      else {
        minWidth = i.minWidth;
      }
      stream.combine([
        i.minWidth,
        ctx.width,
        ctx.height,
      ], function (mw, ctxW, ctxH) {
        stream.push(widthS, Math.max(mw, ctxW));
        stream.push(heightS, ctxH - (mw > ctxW ? _scrollbarWidth() : 0));
      });
      var minHeight = stream.combine([
        i.minHeight,
        i.minWidth,
      ], function (mh, mw) {
        return function (w) {
          if (mw > w) {
            return mh(w) + _scrollbarWidth();
          }
          else {
            return mh(w);
          }
        };
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
      };
    });
  });

  var margin = function (amount) {
    var top = amount.all || 0,
        bottom = amount.all || 0,
        left = amount.all || 0,
        right = amount.all || 0;

    // amount may be a single number
    if ($.isNumeric(amount)) {
      top = bottom = left = right = amount;
    }
    // or an object with properties containing 'top', 'bottom', 'left', and 'right'
    else {
      for (var key in amount) {
        var lcKey = key.toLowerCase();
        if (amount[key] !== null) {
          if (lcKey.indexOf('top') !== -1) {
            top = amount[key] || 0;
          }
          if (lcKey.indexOf('bottom') !== -1) {
            bottom = amount[key] || 0;
          }
          if (lcKey.indexOf('left') !== -1) {
            left = amount[key] || 0;
          }
          if (lcKey.indexOf('right') !== -1) {
            right = amount[key] || 0;
          }
        }
      }
    }
    return layout(function ($el, ctx, c) {
      $el.addClass('margin');
      var i = c({
        top: stream.once(top),
        left: stream.once(left),
        width: stream.map(ctx.width, function (w) {
          return w - left - right;
        }),
        height: stream.map(ctx.height, function (h) {
          return h - top - bottom;
        }),
        widthCalc: stream.once('100% - ' + px(left + right)),
        heightCalc: stream.once('100% - ' + px(top + bottom)),
      });
      return {
        minWidth: stream.map(i.minWidth, function (mw) {
          return mw + left + right;
        }),
        minHeight: stream.map(i.minHeight, function (mh) {
          return function (w) {
            return mh(w - left - right) + top + bottom;
          };
        }),
      };
    });
  };

  // TODO: change this name quick, before there are too many
  // dependencies on it
  var expandoStream = function (amountS) {
    var topS = stream.create();
    var bottomS = stream.create();
    var leftS = stream.create();
    var rightS = stream.create();
    stream.map(amountS, function (amount) {
      var top = amount.all || 0,
          bottom = amount.all || 0,
          left = amount.all || 0,
          right = amount.all || 0;

      // amount may be a single number
      if ($.isNumeric(amount)) {
        top = bottom = left = right = amount;
      }
      // or an object with properties containing 'top', 'bottom', 'left', and 'right'
      else {
        for (var key in amount) {
          var lcKey = key.toLowerCase();
          if (amount[key] !== null) {
            if (lcKey.indexOf('top') !== -1) {
              top = amount[key];
            }
            if (lcKey.indexOf('bottom') !== -1) {
              bottom = amount[key];
            }
            if (lcKey.indexOf('left') !== -1) {
              left = amount[key];
            }
            if (lcKey.indexOf('right') !== -1) {
              right = amount[key];
            }
          }
        }
      }
      stream.push(topS, top);
      stream.push(bottomS, bottom);
      stream.push(leftS, left);
      stream.push(rightS, right);
    });
    return layout(function ($el, ctx, c) {
      var i = c({
        top: topS,
        left: leftS,
        height: stream.combine([
          ctx.height,
          topS,
          bottomS,
        ], function (h, t, b) {
          return h - t - b;
        }),
        width: stream.combine([
          ctx.width,
          leftS,
          rightS,
        ], function (w, l, r) {
          return w - l - r;
        }),
      });
      return {
        minWidth: stream.combine([
          i.minWidth,
          leftS,
          rightS,
        ], function (mw, l, r) {
          return mw + l + r;
        }),
        minHeight: stream.combine([
          i.minHeight,
          topS,
          bottomS,
        ], function (mh, t, b) {
          return function (w) {
            return mh(w) + t + b;
          };
        }),
      };
    });
  };

  var alignLRM = function (lrm) {
    lrm = lrm || {};
    return layout(function ($el, ctx, l, r, m) {
      $el.addClass('alignLRM');
      var lCtx = {
        width: stream.create(),
      };
      var rCtx = {
        width: stream.create(),
        left: stream.create(),
      };
      var mCtx = {
        width: stream.create(),
        left: stream.create(),
      };
      var lI = l(lCtx);
      var rI = r(rCtx);
      var mI = m(mCtx);
      stream.combine([
        lI.minWidth,
        rI.minWidth,
        mI.minWidth,
        ctx.width,
      ], function (lmw, rmw, mmw, w) {
        stream.push(lCtx.width, Math.min(w, lmw));
        stream.push(rCtx.width, Math.min(w, rmw));
        stream.push(mCtx.width, Math.min(w, mmw));
        stream.push(lCtx.left, 0);
        stream.push(rCtx.left, w - Math.min(w, rmw));
        stream.push(mCtx.left, (w - Math.min(w, mmw)) / 2);
      });
      return {
        minWidth: stream.combine([
          lI.minWidth,
          rI.minWidth,
          mI.minWidth,
        ], function (l, r, m) {
          return (m > 0) ?
            Math.max(m + 2 * l, m + 2 * r) :
            l + r;
        }),
        minHeight: stream.combine([
          lI.minWidth,
          rI.minWidth,
          mI.minWidth,
          lI.minHeight,
          rI.minHeight,
          mI.minHeight,
        ], function (lw, rw, mw, lh, rh, mh) {
          return function (w) {
            return [lh(Math.min(w, lw)), rh(Math.min(w, rw)), mh(Math.min(w, mw))].reduce(mathMax);
          };
        }),
      };
    })(lrm.l || nothing, lrm.r || nothing, lrm.m || lrm.c || nothing);
  };
  var alignLeft = function (c) {
    return alignLRM({
      l: c,
    });
  };
  var alignRight = function (c) {
    return alignLRM({
      r: c,
    });
  };
  var center = uncurryConfig(function (config) {
    return function (c) {
      return alignLRM(config)({
        m: c,
      });
    };
  });

  var alignTBM = function (tbm) {
    tbm = tbm || {};
    return layout(function ($el, ctx, t, b, m) {
      $el.addClass('alignTBM');
      var tCtx = {
        height: stream.create(),
      };
      var bCtx = {
        height: stream.create(),
        top: stream.create(),
      };
      var mCtx = {
        height: stream.create(),
        top: stream.create(),
      };
      var tI = t(tCtx);
      var bI = b(bCtx);
      var mI = m(mCtx);
      stream.combine([
        tI.minHeight,
        bI.minHeight,
        mI.minHeight,
        ctx.width,
        ctx.height,
      ], function (lmh, rmh, mmh, w, h) {
        stream.push(tCtx.height, Math.min(h, lmh(w)));
        stream.push(bCtx.height, Math.min(h, rmh(w)));
        stream.push(mCtx.height, Math.min(h, mmh(w)));
        stream.push(tCtx.top, 0);
        stream.push(bCtx.top, Math.max(0, h - Math.min(h, rmh(w))));
        stream.push(mCtx.top, Math.max(0, (h - Math.min(h, mmh(w))) / 2));
      });
      return {
        minWidth: stream.combine([
          tI.minWidth,
          bI.minWidth,
          mI.minWidth,
        ], function (t, b, m) {
          return [t, b, m].reduce(mathMax);
        }),
        minHeight: stream.combine([
          tI.minHeight,
          bI.minHeight,
          mI.minHeight,
        ], function (tH, bH, mH) {
          return function (w) {
            var t = tH(w);
            var b = bH(w);
            var m = mH(w);
            return (m > 0) ?
              Math.max(m + 2 * t, m + 2 * b) :
              t + b;
          };
        }),
      };
    })(tbm.t || nothing, tbm.b || nothing, tbm.m || tbm.c || nothing);
  };
  var alignVTop = function (c) {
    return alignTBM({
      t: c,
    });
  };
  var alignVBottom = function (c) {
    return alignTBM({
      b: c,
    });
  };
  var alignVMiddle = function (c) {
    return alignTBM({
      m: c,
    });
  };
  var alignHLeft = function (c) {
    return alignLRM({
      l: c,
    });
  };
  var alignHRight = function (c) {
    return alignLRM({
      r: c,
    });
  };
  var alignHMiddle = function (c) {
    return alignLRM({
      m: c,
    });
  };
  var alignMiddle = all([
    alignHMiddle,
    alignVMiddle,
  ]);

  // // var invertOnHover = function (c) {
  // //     var invert = stream.once(false, 'invert');

  // //     var choose = function (stream1, stream2) {
  // //         return stream.combine([invert, stream1, stream2], function (i, v1, v2) {
  // //             return i ? v2 : v1;
  // //         }, 'choose stream');
  // //     };


  // //     return div.all([
  // //         componentName('invert-on-hover'),
  // //         child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
  // //         wireChildren(function (instance, context, i) {
  // //             stream.pushAll(i.minHeight, instance.minHeight);
  // //             stream.pushAll(i.minWidth, instance.minWidth);
  // //             return [{
  // //                 backgroundColor: choose(context.backgroundColor, context.fontColor),
  // //                 fontColor: choose(context.fontColor, context.backgroundColor),
  // //                 top: stream.once(0),
  // //                 left: stream.once(0),
  // //                 width: context.width,
  // //                 height: context.height,
  // //             }];
  // //         }),
  // //         mouseoverThis(function () {
  // //             stream.push(invert, true);
  // //         }),
  // //         mouseoutThis(function () {
  // //             stream.push(invert, false);
  // //         }),
  // //     ]);
  // // };

  var border = function (colorS, amount, style) {
    var left = amount.left || amount.all || 0;
    var right = amount.right || amount.all || 0;
    var top = amount.top || amount.all || 0;
    var bottom = amount.bottom || amount.all || 0;
    var radius = amount.radius || 0;
    if ($.isNumeric(amount)) {
      top = bottom = left = right = amount;
    }
    style = style || 'solid';

    if (!stream.isStream(colorS)) {
      colorS = stream.once(colorS);
    }

    var colorStringS = stream.map(colorS, colorString);

    var borderLayout = layout(function ($el, ctx, c) {
      $el.addClass('border');
      // overflow hidden is necessary to prevent cutting off corners
      // of border if there is a border radius
      var i = c();
      $el.css('border-radius', px(radius));
      stream.map(colorStringS, function (colorstring) {
        $el.css('border-left', px(left) + ' ' + style + ' ' + colorstring)
          .css('border-right', px(right) + ' ' + style + ' ' + colorstring)
          .css('border-top', px(top) + ' ' + style + ' ' + colorstring)
          .css('border-bottom', px(bottom) + ' ' + style + ' ' + colorstring);
      });
      return {
        minWidth: stream.map(i.minWidth, function (mw) {
          return mw + left + right;
        }),
        minHeight: stream.map(i.minHeight, function (mh) {
          return function (w) {
            return mh(w - left - right) + top + bottom;
          };
        }),
      };
    });
    return function (c) {
      return all([
        adjustPosition({}, {
          width: function (w, $el) {
            return w - left - right;
          },
          height: function (h, $el) {
            return h - top - bottom;
          },
          widthCalc: function (calc, $el) {
            return calc + " - " + (left + right);
          },
          heightCalc: function (calc, $el) {
            return calc + " - " + (top + bottom);
          },
        }),
      ])(borderLayout(c));
    };
  };

  var componentStream = function (cStream) {
    var error = new Error();
    return container(function ($el, ctx, append) {
      $el.addClass('componentStream');
      var i;
      var unpushMW;
      var unpushMH;
      var minWidth = stream.create();
      var minHeight = stream.create();
      var iStream = stream.reduce(cStream, function (i, c) {
        if (i) {
          i.remove();
        }
        if (unpushMW) {
          unpushMW();
        }
        if (unpushMH) {
          unpushMH();
        }
        i = append(c, {
          widthCalc: stream.once('100%'),
          heightCalc: stream.once('100%'),
        }, true);
        unpushMW = stream.pushAll(i.minWidth, minWidth);
        unpushMH = stream.pushAll(i.minHeight, minHeight);
        return i;
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
        onRemove: function () {
          if (i) {
            i.remove();
          }
        },
      };
    });
  };
  var cStreams = function (initialValues, f) {
    var streams = initialValues.map(stream.once);
    return f.apply(null, streams);
  };
  var cStream = function (initialValue, f) {
    return cStreams([initialValue], f);
  };

  var componentStreamWithExit = function (cStream, exit, entrance) {
    var i;
    var ctx;
    exit = exit || function () {
      var d = $.Deferred();
      d.resolve();
      return d.promise();
    };
    return container(function ($el, context, append) {
      $el.addClass('component-stream-with-exit');
      var localCStream = stream.create();
      stream.pushAll(cStream, localCStream);
      var minWidthS = stream.create();
      var minHeightS = stream.create();
      var instanceC = function (c) {
        if (i) {
          (function (i) {
            setTimeout(function () {
              exit(i, ctx).then(function () {
                i.remove();
              });
            });
          })(i);
        }
        ctx = {
          widthCalc: stream.once('100%'),
          heightCalc: stream.once('100%'),
        };
        i = append(c, ctx, true);
        i.$el.css('transition', 'inherit');
        i.$el.css('display', 'none');
        i.$el.prependTo($el);
        stream.pushAll(i.minWidth, minWidthS);
        stream.pushAll(i.minHeight, minHeightS);
        stream.defer(function () {
          i.$el.css('display', '');
          if (entrance) {
            entrance(i, ctx);
          }
        });
      };
      stream.map(localCStream, function (c) {
        instanceC(c);
      });
      return {
        minWidth: minWidthS,
        minHeight: minHeightS,
        onRemove: function () {
          stream.end(localCStream);
          if (i) {
            i.remove();
          }
        },
      };
    });
  };

  var promiseComponent = function (cP, c1) {
    // var s = stream.once(nothing);
    var s = stream.create();
    if (c1) {
      stream.push(s, c1);
    }
    cP.then(function (c) {
      stream.push(s, c);
    }, function (error) {
      console.log(error);
    }).catch(function (err) {
      console.log(err);
    });
    return componentStream(s);
  };

  var toggleComponent = function (cs, indexStream) {
    return componentStream(stream.map(indexStream, function (i) {
      return cs[i];
    }));
  };

  var modalDialog = function (c) {
    return function (s, transition) {
      var open = stream.once(false);
      stream.pushAll(s, open);

      transition = transition || 0;

      return layout(function ($el, context, c) {
        $el.addClass('modalDialog');

        var i = c({
          top: onceZeroS,
          left: onceZeroS,
          width: stream.map(windowWidth, function (ww) {
            return document.body.clientWidth;
          }),
          height: windowHeight,
        });

        $el = i.$el;
        $el.css('z-index', 100);
        $el.appendTo($('body'));
        $el.css('position', 'fixed');
        $el.css('transition', $el.css('transition') + ', opacity ' + transition + 's');
        $el.css('display', 'none');
        $el.css('pointer-events', 'initial'); // TODO: is this necessary?

        stream.onValue(open, function (on) {
          if (on) {
            $el.css('display', '');
            setTimeout(function () {
              $el.css('opacity', 1);
            }, 100);
          }
          else {
            $el.css('opacity', 0);
            setTimeout(function () {
              $el.css('display', 'none');
            }, transition * 1000);
          }
        });

        return {
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
        };
      })(c);
    };
  };

  var toggleHeight = function (open) {
    return layout(function ($el, ctx, c) {
      $el.addClass('toggle-height');
      var i = c();
      return {
        minWidth: i.minWidth,
        minHeight: stream.combine([
          i.minHeight,
          open,
        ], function (mh, onOff) {
          return function (w) {
            return onOff ? mh(w) : 0;
          };
        }),
      };
    });
  };

  var dropdownPanel = function (source, panel, onOffS, config) {
    config = config || {};
    config.transition = config.transition || "0.5s";
    return layout(function ($el, ctx, source, panel) {
      $el.addClass('dropdown-panel');
      $el.css('overflow', 'visible');
      var panelCtx = {
        height: stream.create(),
        top: stream.create(),
      };
      var panelI = panel(panelCtx);
      var sourceI = source();
      useMinHeight(panelCtx, panelI);
      stream.pushAll(ctx.height, panelCtx.top);
      return {
        minWidth: stream.map(stream.combine([
          panelI.minWidth,
          sourceI.minWidth,
        ], Math.max), function (mw) {
          return mw;
        }),
        minHeight: sourceI.minHeight,
      };
    })(source, layout(function ($el, ctx, panel) {
      var context = {
        top: stream.combine([
          onOffS,
          ctx.height,
        ], function (on, h) {
          return on ? 0 : -h;
        })
      };
      if (config.panelHeightS) {
        stream.pushAll(context.height, config.panelHeightS);
      }
      var i = panel(context);
      i.$el.css('transition', 'top ' + config.transition)
        .css('z-index', 1000);
      return i;
    })(panel));
  };

  // generally for headers
  var sideSlidingPanel = function (source, panel, onOffS, config) {
    config = config || {};
    config.transition = config.transition || "0.5s";
    return layout(function ($el, ctx, source, panel) {
      $el.addClass('side-sliding-panel');
      setTimeout(function () {
        $el.css('overflow', 'visible');
      });
      var panelCtx = {
        width: stream.create(),
        height: stream.create(),
        left: stream.create(),
        top: stream.create(),
      };
      var panelI = panel(panelCtx);
      var sourceI = source();
      useMinWidth(panelCtx, panelI);
      stream.combineInto([
        ctx.height,
        windowHeight,
        panelI.minWidth,
        panelI.minHeight,
      ], function (sh, wh, mw, mh) {
        return Math.max(wh - sh, mh(mw));
      }, panelCtx.height);
      stream.pushAll(ctx.height, panelCtx.top);
      stream.combineInto([
        ctx.width,
        panelI.minWidth,
      ], function (w, mw) {
        return w - mw;
      }, panelCtx.left);
      return {
        minWidth: stream.map(stream.combine([
          panelI.minWidth,
          sourceI.minWidth,
        ], add), function (mw) {
          return mw;
        }),
        minHeight: sourceI.minHeight,
      };
    })(source, layout(function ($el, ctx, panel) {
      var i = panel({
        left: stream.combine([
          onOffS,
          ctx.width,
        ], function (on, w) {
          return on ? 0 : w;
        }),
      });
      i.$el.css('transition', 'left ' + config.transition)
        .css('z-index', 1000);
      return i;
    })(panel));
  };

  var fixedHeaderBody = uncurryConfig(function (config) {
    config.transition = config.transition || "0.5s";
    return layout(function ($el, ctx, bodyC, headerC) {
      var headerHeightS = stream.create();
      var headerI = headerC({
        width: ctx.width,
        height: headerHeightS,
      });
      stream.pushAll(stream.combine([
        ctx.width,
        headerI.minHeight,
      ], function (w, mh) {
        return mh(w);
      }), headerHeightS);
      var bodyHeightS = stream.create();
      var bodyI = bodyC({
        top: headerHeightS,
        width: ctx.width,
        height: bodyHeightS,
      });
      stream.pushAll(stream.combine([
        ctx.width,
        bodyI.minHeight,
      ], function (w, mh) {
        return mh(w);
      }), bodyHeightS);

      headerI.$el.css('position', 'fixed');

      setTimeout(function () {
        headerI.$el.css('transition', 'height ' + config.transition);
        bodyI.$el.css('transition', 'top ' + config.transition);
      });

      return {
        minWidth: stream.map(stream.combine([bodyI, headerI].map(function (i) {
          return i.minWidth;
        })), function (hw, bw) {
          return hw + bw;
        }),
        minHeight: stream.map(stream.combine([bodyI, headerI].map(function (i) {
          return i.minHeight;
        })), function (hh, bh) {
          return function (w) {
            return hh(w) + bh(w);
          };
        }),
      };
    });
  });

  var makeSticky = function (str) {
    str = str || onceZeroS;
    return layout(function ($el, context, c) {
      $el.addClass('makeSticky');

      var ctx = {
        widthCalc: stream.once('100%'),
        heightCalc: stream.once('100%'),
      };
      var i = c(ctx);
      stream.combine([
        windowScroll,
        str,
        context.top,
        context.topOffset,
        context.left,
        context.leftOffset,
      ], function (scroll, diffAmount, top, topOffset, left, leftOffset) {
        if (top + topOffset > scroll + diffAmount) {
          $el.css('position', 'absolute');
          $el.css('transition', '');
          $el.css('left', px(left));
        }
        else if (top + topOffset < scroll + diffAmount) {
          var leftPosition = left + leftOffset;
          $el.css('position', 'fixed');
          $el.css('left', px(leftPosition));
          $el.css('top', px(diffAmount));
          setTimeout(function () {
            $el.css('transition', 'inherit');
          }, 20);
        }
      });
      return i;
    });
  };

  // // var stickyHeaderBody = function (body1, header, body2) {
  // //     return div.all([
  // //         componentName('stickyHeaderBody'),
  // //         child(body1),
  // //         child(body2),
  // //         child(header),
  // //         wireChildren(function (instance, context, body1I, body2I, headerI) {
  // //             stream.pushAll(stream.map(stream.combine([body1I, body2I, headerI], function (i) {
  // //                 return i.minHeight;
  // //             }), function () {
  // //                 var args = Array.prototype.slice.call(arguments);
  // //                 return args.reduce(add, 0);
  // //             }), instance.minHeight);

  // //             var fixedNow = false;

  // //             return [{
  // //                 top: stream.once(0),
  // //                 left: stream.once(0),
  // //                 width: context.width,
  // //                 height: body1I.minHeight,
  // //             }, {
  // //                 top: stream.combine([body1I.minHeight, headerI.minHeight], add),
  // //                 left: stream.once(0),
  // //                 width: context.width,
  // //                 height: body2I.minHeight,
  // //             }, {
  // //                 top: stream.combine([body1I.minHeight, context.scroll, context.topOffset], function (mh, scroll, topOffset) {
  // //                     var $header = headerI.$el;
  // //                     mh = Math.floor(mh);
  // //                     if (mh > scroll + topOffset) {
  // //                         $header.css('position', 'absolute');
  // //                         $header.css('transition', '');
  // //                         if (fixedNow) {
  // //                             window.scrollTo(0, mh + topOffset);
  // //                         }
  // //                         fixedNow = false;
  // //                         return mh;
  // //                     }
  // //                     else if (mh < scroll + topOffset) {
  // //                         $header.css('position', 'fixed');
  // //                         setTimeout(function () {
  // //                             $header.css('transition', 'inherit');
  // //                         }, 20);
  // //                         if (!fixedNow) {
  // //                             window.scrollTo(0, mh + topOffset);
  // //                         }
  // //                         fixedNow = true;
  // //                         return topOffset;
  // //                     }
  // //                 }),
  // //                 left: stream.once(0),
  // //                 width: context.width,
  // //                 height: headerI.minHeight,
  // //             }];
  // //         }),
  // //     ]);
  // // };

  var useNthMinHeight = function (n) {
    return function (cells, mhs) {
      var index = Math.min(n, cells.length - 1);
      return mhs[index](cells[index].width);
    };
  };
  var useMaxHeight = function (cells, mhs) {
    return cells.reduce(function (a, cell, i) {
      return Math.max(a, mhs[i](cell.width));
    }, 0);
  };

  var grid = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusWidthFunc = config.surplusWidthFunc || ignoreSurplusWidth;
    config.surplusHeightFunc = config.surplusHeightFunc || ignoreSurplusHeight;
    config.rowHeight = config.rowHeight || useMaxHeight;
    config.maxPerRow = config.maxPerRow || 0;
    config.rowOrColumn = config.rowOrColumn || false;

    return function (cs) {
      return layout(function ($el, ctx, cs) {
        $el.addClass('grid');
        var minWidth = stream.create();
        var minHeight = stream.create();
        if (cs.length === 0) {
          stream.push(minWidth, 0);
          stream.push(minHeight, constant(0));
        }
        var contexts = [];
        var is = cs.map(function (c) {
          var context = {
            top: stream.create(),
            left: stream.create(),
            width: stream.create(),
            height: stream.create(),
          };
          contexts.push(context);
          return c(context);
        });

        var minWidthsS = stream.combine(is.map(function (i) {
          return i.minWidth;
        }), function () {
          return Array.prototype.slice.call(arguments);
        });
        var minHeightsS = stream.combine(is.map(function (i) {
          return i.minHeight;
        }), function () {
          return Array.prototype.slice.call(arguments);
        });

        var computeRows = function (gridWidth, mws) {
          if (config.allSameWidth) {
            var maxMW = mws.reduce(mathMax, 0);
            // thank you, keenan simons
            for (var ii = 0; ii < mws.length; ii++) {
              mws[ii] = maxMW;
            }
          }
          var left;
          var blankRow = function () {
            left = 0;
            return {
              cells: [],
              contexts: [],
              height: 0,
            };
          };

          var rowsAndCurrentRow = mws.reduce(function (a, mw, index) {
            var rows = a.rows;
            var currentRow = a.currentRow;

            var widthUsedThisRow = currentRow.cells.reduce(function (a, cell) {
              return a + cell.width + config.padding;
            }, 0);
            var widthNeeded = Math.min(mw, gridWidth);

            if ((config.maxPerRow > 0 &&
                 currentRow.cells.length === config.maxPerRow) ||
                (widthNeeded > 0 &&
                 widthNeeded + widthUsedThisRow > gridWidth)) {
              rows.push(currentRow);
              currentRow = blankRow();
            }

            currentRow.cells.push({
              width: widthNeeded,
              left: left,
            });
            currentRow.contexts.push(contexts[index]);

            left += widthNeeded + config.padding;
            return {
              rows: rows,
              currentRow: currentRow,
            };
          }, {
            rows: [],
            currentRow: blankRow(),
          });
          var rows = rowsAndCurrentRow.rows;
          rows.push(rowsAndCurrentRow.currentRow);
          if (config.rowOrColumn && rowsAndCurrentRow.rows.length > 1) {
            rows = mws.map(function (mw, index) {
              return {
                cells: [{
                  width: mw,
                  left: 0,
                }],
                contexts: [contexts[index]],
                height: 0,
              };
            });
          }

          rows.map(function (row, i) {
            row.cells = config.surplusWidthFunc(gridWidth, row.cells, i);
          });

          return rows;
        };

        // todo: fix interaction of allSameWidth and useFullWidth
        stream.pushAll(stream.map(minWidthsS, function (mws) {
          return mws.reduce(function (a, mw) {
            return config.useFullWidth ? a + mw + config.padding : Math.max(a, mw) + config.padding;
          }, -config.padding);
        }), minWidth);
        stream.combineInto([
          minWidthsS,
          minHeightsS,
        ], function (mws, mhs) {
          return function (w) {
            var rows = computeRows(w, mws);
            var index = 0;
            var h = rows.map(function (row) {
              var h = config.rowHeight(row.cells, mhs.slice(index, index + row.cells.length));
              index += row.cells.length;
              return h + config.padding;
            }).reduce(add, -config.padding);
            return h;
          };
        }, minHeight);

        stream.combine([
          ctx.width,
          ctx.height,
          minWidthsS,
          minHeightsS,
        ], function (gridWidth, gridHeight, mws, mhs) {
          var rows = computeRows(gridWidth, mws);
          var index = 0;
          var top = 0;
          rows.map(function (row) {
            row.height = config.rowHeight(row.cells, mhs.slice(index, index + row.cells.length));
            index += row.cells.length;
          });
          if (config.bottomToTop) {
            rows = rows.slice(0).reverse();
          }
          rows.map(function (row) {
            row.top = top;
            top += row.height + config.padding;
          });
          rows = config.surplusHeightFunc(gridHeight, rows, config);
          rows.map(function (row, i) {
            var positions = row.cells.map(function (cell) {
              var position = {
                top: row.top,
                left: cell.left,
                width: cell.width,
                height: row.height,
              };
              return position;
            });
            positions.map(function (position, index) {
              var context = row.contexts[index];
              stream.push(context.top, position.top);
              stream.push(context.left, position.left);
              stream.push(context.width, position.width);
              stream.push(context.height, position.height);
            });
          });
        });

        return {
          minWidth: minWidth,
          minHeight: minHeight,
        };
      })(cs);
    };
  });

  var basicFloat = uncurryConfig(function (config) {
    return layout(function ($el, ctx, c, cs) {
      // first context belongs to floating element c, rest to cs
      var contexts = [{
        width: stream.create(),
        height: stream.create(),
      }];
      cs.map(function () {
        contexts.push({
          top: stream.create(),
          left: stream.create(),
          width: stream.create(),
          height: stream.create(),
        });
      });
      var ccs = [c].concat(cs);
      var iis = ccs.map(function (c, index) {
        return c(contexts[index]);
      });
      var allMinWidths = mapMinWidths(iis);
      var allMinHeights = mapMinHeights(iis);
      var positionItems = function (w, mws, mhs) {
        mws = mws.slice(0);
        mhs = mhs.slice(0);
        // shift off min-dimensions of floating element
        var mw = mws.shift();
        var mh = mhs.shift();
        // size of floating element
        var floatWidth = (!mws[0] || mws[0] > w - mw - 2 * config.padding) ? w : mw;
        var floatHeight = mh(floatWidth);
        var dims = [{
          width: floatWidth,
          height: floatHeight,
        }];
        // smallest top-value that clears the floating item
        var topBelowFloat = floatHeight + config.padding;
        // compute dimensions of the rest of the items
        var top = 0;
        for (var i = 0; i < mws.length; i++) {
          var mwi = mws[i];
          var mhi = mhs[i];
          // clear the float if there is not enough width available
          if (top < topBelowFloat && mwi > w - (floatWidth + 2 * config.padding)) {
            top = topBelowFloat;
          }
          var dimLeft = top < topBelowFloat ? floatWidth + config.padding : config.padding;
          var dimTop = top;
          var dimWidth = top < topBelowFloat ? w - (floatWidth + 2 * config.padding) : w - 2 * config.padding;
          var dimHeight = mhi(dimWidth);
          if (config.clearHanging && top < topBelowFloat && top + dimHeight > topBelowFloat) {
            top = topBelowFloat;
            dimLeft = config.padding;
            dimTop = top;
            dimWidth = w - 2 * config.padding;
            dimHeight = mhi(dimWidth);
          }
          dims.push({
            left: dimLeft,
            top: dimTop,
            width: dimWidth,
            height: dimHeight,
          });
          top += dimHeight + config.padding;
        }
        return {
          dims: dims,
          totalHeight: Math.max(floatHeight, top),
        };
      };
      var minWidth = stream.map(allMinWidths, function (mws) {
        return mws.reduce(mathMax, 0);
      }, minWidth);
      var minHeight = stream.combine([
        allMinWidths,
        allMinHeights,
      ], function (mws, mhs) {
        return function (w) {
          return positionItems(w, mws, mhs).totalHeight;
        };
      });
      stream.combine([
        ctx.width,
        allMinWidths,
        allMinHeights,
      ], function (w, mws, mhs) {
        positionItems(w, mws, mhs).dims.map(function (dim, i) {
          var context = contexts[i];
          stream.push(context.width, dim.width);
          stream.push(context.height, dim.height);
          if (i > 0) {
            stream.push(context.left, dim.left);
            stream.push(context.top, dim.top);
          }
        });
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
      };
    });
  });

  var withMinWidthStream = function (getMinWidthStream) {
    if ($.type(getMinWidthStream) === 'number') {
      return minWidth(getMinWidthStream);
    }
    return layout(function ($el, ctx, c) {
      $el.addClass('withMinWidthStream');
      var i = c();
      return {
        minWidth: $.isFunction(getMinWidthStream) ? getMinWidthStream(i, ctx) : getMinWidthStream,
        minHeight: i.minHeight,
      };
    });
  };
  var minWidthAtLeast = function (number) {
    if (!stream.isStream(number)) {
      number = stream.once(number);
    }
    return withMinWidthStream(function (i) {
      return stream.combine([
        i.minWidth,
        number,
      ], mathMax);
    });
  };
  var withMinHeightStream = function (getMinHeightStream) {
    if ($.type(getMinHeightStream) === 'number') {
      return minHeight(getMinHeightStream);
    }
    return layout(function ($el, ctx, c) {
      $el.addClass('withMinHeightStream');
      var i = c();
      var minHeightS = $.isFunction(getMinHeightStream) ? getMinHeightStream(i, ctx) : getMinHeightStream;
      return {
        minWidth: i.minWidth,
        minHeight: stream.combine([
          i.minHeight,
          minHeightS,
        ], function (mh, minHeight) {
          return function (w) {
            return Math.max(mh(w), minHeight(w));
          };
        }),
      };
    });
  };
  var minHeightAtLeast = function (number) {
    if (!stream.isStream(number)) {
      number = stream.once(number);
    }
    return withMinHeightStream(function (i) {
      return stream.combine([
        i.minHeight,
        number,
      ], function (mh, number) {
        return function (w) {
          return Math.max(mh(w), number);
        };
      });
    });
  };
  var withMaxHeightStream = function (heightS) {
    return layout(function ($el, ctx, c) {
      $el.addClass('maxHeightStream');
      var context = {
        height: stream.create(),
        top: stream.create(),
      };
      var i = c(context);
      stream.pushAll(stream.combine([
        i.minHeight,
        ctx.width,
        ctx.height,
      ], function (mh, w, h) {
        return Math.max(h, mh(w));
      }), context.height);

      var lastScroll = windowScroll.lastValue;
      var scrollS = stream.map(windowScroll, function (s) {
        var dScroll = s - lastScroll;
        lastScroll = s;
        return dScroll;
      });

      var scrollTarget = 0;
      var scrollTargetS = stream.combine([
        ctx.height,
        context.height,
        scrollS,
      ], function (wh, h, s) {
        scrollTarget -= s;
        scrollTarget = Math.min(0, scrollTarget);
        scrollTarget = Math.max(wh - h, scrollTarget);
        return scrollTarget;
      });
      stream.pushAll(scrollTargetS, context.top);

      return {
        minWidth: i.minWidth,
        minHeight: stream.combine([
          heightS,
          i.minHeight,
        ], function (maxHeight, mh) {
          return function (w) {
            return Math.min(maxHeight, mh(w));
          };
        }),
      };
    });
  };

  // // var atMostWindowBottom = function (c, distanceStream) {
  // //     distanceStream = distanceStream || stream.once(0);
  // //     return withMinHeightStream(function (instance, context) {
  // //         return stream.combine([instance.minHeight,
  // //                                context.top,
  // //                                context.topOffset,
  // //                                distanceStream,
  // //                                windowResize], function (mh, t, ta, distance) {
  // //                                    return Math.min(mh, window.innerHeight - t - ta - distance);
  // //                                });
  // //     }, c);
  // // };

  var largestWidthThatFits = uncurryConfig(function (config) {
    return layout(function ($el, ctx, cs) {
      $el.addClass('largest-width-that-fits');
      var is = cs.map(function (c) {
        return c();
      });
      var allMinWidths = mapMinWidths(is);
      var allMinHeights = mapMinHeights(is);
      var chooseIndex = function (w, mws) {
        var index = mws.reduce(function (a, mw, index) {
          return (mw <= w) && (a === null || mw > a.mw) ? {
            mw: mw,
            index: index,
          } : a;
        }, null).index;
        if (index === null) {
          console.log('none small enough, TODO: use smallest');
        }
        return index;
      };
      stream.combine([
        ctx.width,
        allMinWidths,
      ], function (w, mws) {
        var i = chooseIndex(w, mws);
        is.map(function (instance, index) {
          instance.$el.css('display', (index === i) ? '' : 'none');
        });
      });
      return {
        minWidth: stream.map(allMinWidths, function (mws) {
          return mws.reduce(mathMax, 0);
        }),
        minHeight: stream.combine([
          allMinWidths,
          allMinHeights,
        ], function (mws, mhs) {
          return function (w) {
            var i = chooseIndex(w, mws);
            return mhs[i](w);
          };
        }),
      };
    });
  });

  var overlays = uncurryConfig(function (config) {
    return layout(function ($el, ctx, cs) {
      $el.addClass('overlays');
      var is = cs.map(function (c) {
        return c();
      });
      var chooseLargest = function (streams) {
        return stream.combine(streams, function () {
          var args = Array.prototype.slice.call(arguments);
          return args.reduce(mathMax, 0);
        });
      };
      return {
        minWidth: stream.combine(is.map(function (i) {
          return i.minWidth;
        }), function () {
          var args = Array.prototype.slice.call(arguments);
          return args.reduce(mathMax, 0);
        }),
        minHeight: stream.combine(is.map(function (i) {
          return i.minHeight;
        }), function () {
          var args = Array.prototype.slice.call(arguments);
          return function (w) {
            return args.map(apply(w)).reduce(mathMax, 0);
          };
        }),
      };
    });
  });


  // // var table = function (config, css)) {
  // //     config = config || {};
  // //     var padding = (config.padding || 0) * 2;
  // //     return div.all(stream.map(css, function (cs) {
  // //         return children(cs);
  // //     })).all([
  // //         componentName('table'),
  // //         wireChildren(function () {
  // //             var args = Array.prototype.slice.call(arguments);
  // //             var instance = args[0];
  // //             var context = args[1];
  // //             var iss = args.slice(2);

  // //             // we blindly assume all rows have the same number of columns

  // //             // set table min width
  // //             var maxMWs = stream.combine(iss.reduce(function (a, is) {
  // //                 stream.push(a, stream.combine(is.map(function (i) {
  // //                     return i.minWidth;
  // //                 }), function () {
  // //                     return Array.prototype.slice.call(arguments);
  // //                 }));
  // //                 return a;
  // //             }, []), function () {
  // //                 var rowMWs = Array.prototype.slice.call(arguments);
  // //                 return rowMWs.reduce(function (a, rowMWs) {
  // //                     return stream.map(rowMWs, function (mw, i) {
  // //                         return Math.max(a[i] || 0, mw);
  // //                     });
  // //                 }, []);
  // //             });
  // //             stream.map(maxMWs, function (maxMWs) {
  // //                 var mw = maxMWs.reduce(function (a, mw) {
  // //                     return a + mw + padding;
  // //                 }, -padding);
  // //                 stream.push(instance.minWidth, mw);
  // //             });

  // //             // set table min height
  // //             var rowMinHeights = iss.reduce(function (a, is) {
  // //                 stream.push(a, stream.combine(is.map(function (i) {
  // //                     return i.minHeight;
  // //                 }), function () {
  // //                     var args = Array.prototype.slice.call(arguments);
  // //                     return args.reduce(mathMax, 0);
  // //                 }));
  // //                 return a;
  // //             }, []);
  // //             stream.combine(rowMinHeights, function () {
  // //                 var mhs = Array.prototype.slice.call(arguments);
  // //                 var mh = mhs.reduce(function (a, mh) {
  // //                     return a + mh + padding;
  // //                 }, -padding);
  // //                 stream.push(instance.minHeight, mh);
  // //             });

  // //             return stream.map(rowMinHeights, function (mh, i) {
  // //                 return stream.map(iss[i], function (_, index) {
  // //                     return {
  // //                         width: stream.map(maxMWs, function (maxMWs) {
  // //                             return maxMWs[index];
  // //                         }),
  // //                         height: rowMinHeights[i],
  // //                         top: stream.combine(rowMinHeights.slice(0, i).concat([stream.once(0)]), function () {
  // //                             var mhs = Array.prototype.slice.call(arguments);
  // //                             return mhs.reduce(function (a, mh) {
  // //                                 return a + mh + padding;
  // //                             }, -padding);
  // //                         }),
  // //                         left: stream.map(maxMWs, function (maxMWs) {
  // //                             return maxMWs.reduce(function (a, mw, mwI) {
  // //                                 return a + (mwI < index ? mw + padding : 0);
  // //                             }, 0);
  // //                         }),
  // //                     };
  // //                 });
  // //             });
  // //         }),
  // //     ]);
  // // };

  var tabs = function (list, tabIndexS) {
    tabIndexS = tabIndexS || stream.once(0);
    return stack({})([
      all([
        minWidth(0),
        $css('overflow-x', 'scroll'),
        $css('overflow-y', 'hidden'),
        $css('pointer-events', 'initial'),
      ])(stack()([
        sideBySide({
          surplusWidthFunc: centerSurplusWidth,
        })(list.map(function (item, index) {
          return alignTBM()({
            b: all([
              link,
              clickThis(function () {
                stream.push(tabIndexS, index);
              }),
            ])(item.tab(tabIndexS, index)),
          });
        })),
        all([
          minHeight(_scrollbarWidth()) // cheater
        ])(nothing),
      ])),
    ]);
  };

  var bar = {
    h: function (size) {
      return minWidth(size)(nothing);
    },
    v: function (size) {
      return minHeight(size)(nothing);
    },
  };
  var rectangle = function (size) {
    return all([
      minHeight(size.v || size.x || 0),
      minWidth(size.h || size.y || 0),
    ])(nothing);
  };
  var matchStrings = function (stringsAndRouters) {
    return function (str) {
      for (var i = 0; i < stringsAndRouters.length; i++ ) {
        var stringAndRouter = stringsAndRouters[i];
        if (str.indexOf(stringAndRouter.string) === 0) {
          return stringAndRouter.router(str.substring(stringAndRouter.string.length));
        }
      }
    };
  };

  var routeToComponent = function (component) {
    return function () {
      return component;
    };
  };

  var routeToComponentF = function (componentF) {
    return function () {
      return componentF();
    };
  };

  var routeToFirst = function (routers) {
    return function (str) {
      for (var i = 0; i < routers.length; i++) {
        var result = routers[i](str);
        if (result) {
          return result;
        }
      }
    };
  };

  var routeMatchRest = function (f) {
    return function (str) {
      // wrapping in a promise catches any exceptions that f throws
      return promiseComponent(Q(str).then(f));
    };
  };

  var route = function (s, router) {
    return componentStream(stream.map(s, function (hash) {
      return router(hash);
    }));
  };

  var scope = function (f) {
    return function (ctx) {
      return f()(ctx);
    };
  };

  var fieldType = {
    button: function (name, onClick) {
      return {
        type: 'button',
        enabledS: stream.once(true),
        name: name || '',
        onClick: onClick,
      };
    },
    checkbox: {
      type: 'checkbox',
    },
    date: {
      type: 'date',
    },
    // options is array of strings, or objects with name and value
    // properties
    dropdown: function (options) {
      return {
        type: 'dropdown',
        options: options,
      };
    },
    hidden: {
      type: 'hidden',
    },
    image: {
      type: 'image',
    },
    number: {
      type: 'number',
    },
    password: {
      type: 'password',
    },
    // options is array of objects with 'name' and 'value' properties
    radios: function (options) {
      return {
        type: 'radios',
        options: options,
      };
    },
    text: {
      type: 'text',
    },
    textarea: {
      type: 'textarea',
    },
    time: {
      type: 'time',
    },
  };
  var dateInputRegexp = /(\d*)-(\d*)-(\d*)/; // year month day
  var parseDateInputValue = function (val) {
    var match = dateInputRegexp.exec(val);
    if (match) {
      var d = new Date();
      d.setYear(match[1]);
      d.setMonth(parseInt(match[2]) - 1);
      d.setDate(match[3]);
      return d;
    }
  };
  var stringifyDateInputValue = function (date) {
    if (!date) {
      return;
    }
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
      month = "0" + month;
    }
    var day = date.getDate();
    if (day < 10) {
      day = "0" + day;
    }
    return year + '-' + month + '-' + day;
  };
  var getFormElementMarginTop = function ($el) {
    return parseFloat($el.css('margin-top')) +
      parseFloat($el.css('padding-top')) +
      parseFloat($el.css('border-top'));
  };
  var getFormElementMarginBottom = function ($el) {
    return parseFloat($el.css('margin-bottom')) +
      parseFloat($el.css('padding-bottom')) +
      parseFloat($el.css('border-bottom'));
  };
  var getFormElementMarginLeft = function ($el) {
    return parseFloat($el.css('margin-left')) +
      parseFloat($el.css('padding-left')) +
      parseFloat($el.css('border-left'));
  };
  var getFormElementMarginRight = function ($el) {
    return parseFloat($el.css('margin-right')) +
      parseFloat($el.css('padding-right')) +
      parseFloat($el.css('border-right'));
  };
  var applyFormBorder = adjustPosition({}, {
    width: function (w, $el) {
      return w - getFormElementMarginLeft($el) - getFormElementMarginRight($el);
    },
    height: function (h, $el) {
      return h - getFormElementMarginTop($el) - getFormElementMarginBottom($el);
    },
    widthCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginLeft($el) + getFormElementMarginRight($el));
    },
    heightCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginTop($el) + getFormElementMarginBottom($el));
    },
  });
  var applyTextareaBorder = adjustPosition({}, {
    width: function (w, $el) {
      return w - getFormElementMarginLeft($el) - getFormElementMarginRight($el);
    },
    height: function (h, $el) {
      return h - getFormElementMarginTop($el) - getFormElementMarginBottom($el);
    },
    widthCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginLeft($el) + getFormElementMarginRight($el));
    },
    heightCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginTop($el) + getFormElementMarginBottom($el));
    },
  });
  var applyCheckboxBorder = adjustPosition({}, {
    width: function (w, $el) {
      return w - getFormElementMarginLeft($el) - getFormElementMarginRight($el);
    },
    height: function (h, $el) {
      return h - getFormElementMarginTop($el) - getFormElementMarginBottom($el);
    },
    widthCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginLeft($el) + getFormElementMarginRight($el));
    },
    heightCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginTop($el) + getFormElementMarginBottom($el));
    },
  });
  var applyRadioBorder = adjustPosition({}, {
    width: function (w, $el) {
      return w - getFormElementMarginLeft($el) - getFormElementMarginRight($el);
    },
    height: function (h, $el) {
      return h - getFormElementMarginTop($el) - getFormElementMarginBottom($el);
    },
    widthCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginLeft($el) + getFormElementMarginRight($el));
    },
    heightCalc: function (calc, $el) {
      return calc + " - " + (getFormElementMarginTop($el) + getFormElementMarginBottom($el));
    },
  });
  var formComponent = {
    button: function (_, s, t) {
      s = s || stream.create();
      return all([
        and(function (i) {
          stream.map(t.enabledS, function (enabled) {
            i.$el.prop('disabled', !enabled);
          });
        }),
        clickThis(function (ev) {
          if (!t.enabledS.lastValue) {
            ev.preventDefault();
            return;
          }
          t.onClick && t.onClick(ev, s, function () {
            stream.push(t.enabledS, false);
            return function () {
              stream.push(t.enabledS, true);
            };
          });
        }),
      ])(text({
        str: t.name,
        el: button,
        measureWidth: true,
      }));
    },
    checkbox: function (k, s) {
      s = s || stream.create();
      return all([
        applyCheckboxBorder,
      ])(input(function ($el, ctx, mw, mh) {
        $el.prop('id', k);
        $el.prop('name', k);
        $el.prop('type', 'checkbox');
        stream.onValue(s, function (v) {
          $el.prop('checked', v ? 'checked' : '');
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.prop('checked'));
        });
        $el.on('change', function () {
          stream.push(s, $el.prop('checked'));
        });
        mw();
        mh();
      }));
    },
    date: function (k, s) {
      return all([
        applyFormBorder,
      ])(input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        $el.prop('type', 'date');
        stream.onValue(s, function (v) {
          // this if-statement not tested
          if ((v && v.getTime()) !== ($el.val() && parseDateInputValue($el.val()).getTime())) {
            $el.val(stringifyDateInputValue(v));
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, parseDateInputValue($el.val()));
        });
        $el.on('change', function () {
          stream.push(s, parseDateInputValue($el.val()));
        });
      }));
    },
    dropdown: function (k, s, type) {
      return select(function ($el, ctx, mw, mh) {
        $el.prop('name', k);
        type.options.map(function (option) {
          if ('string' === $.type(option)) {
            option = {
              name: option,
              value: option,
            };
          }
          $(document.createElement('option'))
            .html(option.name)
            .prop('value', option.value)
            .appendTo($el);
        });
        if (!s.lastValue) {
          stream.push(s, $el.val());
        }
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
        mw();
        mh();
      });
    },
    hidden: function (k, s) {
      return input(function ($el) {
        $el.prop('name', k);
        $el.prop('type', 'hidden');
        stream.onValue(s, function (v) {
          $el.val(v);
        });
        return {
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
        };
      });
    },
    image: function (k, s) {
      return input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        $el.prop('type', 'file');
        $el.prop('accept', 'image/*');
        $el.on('change', function (ev) {
          var file = ev.target.files.length > 0 && ev.target.files[0];
          if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
              stream.push(s, e.target.result);
            };
            reader.readAsDataURL(ev.target.files[0]);
          }
        });
      });
    },
    number: function (k, s) {
      return all([
        applyFormBorder,
      ])(input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        $el.prop('type', 'number');
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
      }));
    },
    password: function (k, s) {
      return all([
        applyFormBorder,
      ])(input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        $el.prop('type', 'password');
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
        $el.on('keyup', function () {
          stream.push(s, $el.val());
        });
      }));
    },
    radios: function (k, s, type) {
      return type.options.map(function (option) {
        return all([
          applyRadioBorder,
        ])(input(function ($el, ctx, mw, mh) {
          $el.prop('id', option);
          $el.prop('value', option);
          $el.prop('name', k);
          $el.prop('type', 'radio');
          stream.onValue(s, function (v) {
            $el.prop('checked', (v === option) ? 'checked' : '');
          });
          $el.on('change', function () {
            if ($el.prop('checked')) {
              stream.push(s, option);
            }
          });
          mw();
          mh();
        }));
      });
    },
    text: function (k, s) {
      return all([
        applyFormBorder,
      ])(input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
        $el.on('keyup', function () {
          stream.push(s, $el.val());
        });
      }));
    },
    textarea: function (k, s) {
      return all([
        applyTextareaBorder,
      ])(textarea(function ($el, ctx) {
        $el.prop('name', k);
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
        $el.on('keyup', function () {
          stream.push(s, $el.val());
        });
        var lastOuterWidth = $el.outerWidth(true);
        var lastOuterHeight = $el.outerHeight(true);
        var mw = stream.once(lastOuterWidth);
        var mh = stream.once(constant(lastOuterHeight));
        $('body').on('mousemove', function () {
          // this handler is a memory leak, should unbind it on remove
          var currentOuterWidth = $el.outerWidth(true);
          var currentOuterHeight = $el.outerHeight(true);
          if (lastOuterWidth !== currentOuterWidth) {
            stream.push(mw, currentOuterWidth);
            lastOuterWidth = currentOuterWidth;
          }
          if (lastOuterHeight !== currentOuterHeight) {
            stream.push(mh, constant(currentOuterHeight));
            lastOuterHeight = currentOuterHeight;
          }
        });
        $el.on('click', function () {
          var borderWidthH = getFormElementBorderWidthH($el);
          var borderWidthV = getFormElementBorderWidthV($el);
          var currentOuterWidth = $el.outerWidth(true);
          var currentOuterHeight = $el.outerHeight(true);
          if (lastOuterWidth !== currentOuterWidth) {
            stream.push(mw, currentOuterWidth);
            lastOuterWidth = currentOuterWidth;
          }
          if (lastOuterHeight !== currentOuterHeight) {
            stream.push(mh, constant(currentOuterHeight));
            lastOuterHeight = currentOuterHeight;
          }
        });
        return {
          minWidth: mw,
          minHeight: mh,
        };
      }));
    },
    time: function (k, s) {
      return all([
        applyFormBorder,
      ])(input(function ($el, ctx, mw, mh) {
        mw();
        mh();
        $el.prop('name', k);
        $el.prop('type', 'time');
        stream.onValue(s, function (v) {
          if (v !== $el.val()) {
            $el.val(v);
          }
        });
        $el.on('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, $el.val());
        });
        $el.on('change', function () {
          stream.push(s, $el.val());
        });
      }));
    },
  };
  var buttonInput = constant(all([
    minWidth(150),
  ]));
  var textInput = constant(all([
    margin({
      top: 1,
      bottom: 1,
      left: 0,
      right: 0,
    }),
    border(color({
      r: 0,
      g: 0,
      b: 0,
    }), {
      top: 2,
      bottom: 2,
      left: 2,
      right: 2,
    }, 'inset'),
    minWidth(150),
  ]));
  var textareaInput = constant(all([
    textInput(),
    minHeightAtLeast(100),
  ]));
  var formStyle = {
    button: buttonInput,
    checkbox: constant(id),
    date: textInput,
    dropdown: buttonInput,
    image: textInput,
    number: textInput,
    password: textInput,
    radios: id,
    text: textInput,
    textarea: textInput,
    time: textInput,
  };

  // submitButtonFieldTypeF - function returning the field type to use
  // for the submit button.  Can just be hcj.forms.fieldType.button.

  // formComponent - object with one key for each kind of field type.
  // Values are functions that take the field's name, value stream
  // initialized with its default value if there is one, and field
  // type, and return (most often) a Component or an array of
  // Components.

  // TODO: Try to combine formComponent and style into one object.
  var formFor = function (submitButtonFieldTypeF, formComponent) {
    // fields - Object.  Keys become "name" attributes of the form
    // fields, and values are their field types.

    // labels (optional) - Object with same keys as "fields".  Values
    // are give the label for each form element.
    return function (fields, labels) {
      labels = labels || {};

      // defaults (optional) - Same keys as "field".  Gives default
      // values for each field.
      return function (defaults) {
        defaults = defaults || {};
        return function (mkOnSubmit) {

          // style - Object with one key for each kind of field type.
          // Values are functions that take take a field's name, value
          // stream initialized with its default value if provided,
          // field type, and label if present, and return a "form
          // style", which is a function which takes the value
          // returned by formComponent above and returns a Component.
          return function (style) {
            style = style || {};
            var names = Object.keys(fields);
            return function (f) {
              var fieldStreams = {};
              var fieldInputs = {};
              names.map(function (name) {
                var defaultValue = defaults[name];
                var fieldStream = defaultValue ? stream.once(defaultValue) : stream.create();
                var label = labels[name];
                var type = fields[name];
                var fieldStyle = (type && style[type.type]) || constant(id);
                fieldStreams[name] = fieldStream;
                fieldInputs[name] = fieldStyle(label, name, fieldStream, type)(formComponent[type.type](name, fieldStream, type));
              });
              var disabledS = stream.once(false);
              var submit = function (name) {
                var fieldType = submitButtonFieldTypeF();
                var fieldStyle = style[fieldType.type] || constant(id);
                // TODO: use formComponent[fieldType.type] instead of text
                return fieldStyle('', stream.create(), fieldType, name)(text({
                  el: button,
                  measureWidth: true,
                }, {
                  str: name,
                }), name);
              };
              if (typeof mkOnSubmit === 'function') {
                var onSubmit = mkOnSubmit(fieldStreams, function () {
                  stream.push(disabledS, true);
                  return function () {
                    stream.push(disabledS, false);
                  };
                });
                var setupFormSubmit = function ($el) {
                  $el.on('submit', function (ev) {
                    if (disabledS.lastValue) {
                      ev.preventDefault();
                      return;
                    }
                    onSubmit.onSubmit(ev);
                  });
                };
              }
              else {
                var setupFormSubmit = function ($el) {
                  $el.prop('method', mkOnSubmit.method)
                    .prop('action', mkOnSubmit.action);
                };
              }
              return layout('form', function ($el, ctx, c) {
                setupFormSubmit($el);
                return c();
              })(f(fieldInputs, submit, fieldStreams, onSubmit && onSubmit.resultS));
            };
          };
        };
      };
    };
  };

  var shallowCopy = function (oldObj) {
    var newObj = {};
    for(var i in oldObj) {
      if(oldObj.hasOwnProperty(i)) {
        newObj[i] = oldObj[i];
      }
    }
    return newObj;
  };

  var jsoScrollTo = function (position, duration) {
    $('html body').animate({
      scrollTop: position,
    }, duration);
  };
  var runJso = function (bar, bodyColumn, db) {
    return function (me, profile) {
      var evalAllWithContext = function (ns, context) {
        return ns.map(function (n) {
          return evalWithContext(n, context);
        });
      };

      var evalWithContext = function (javVal, context) {
        context = context || {};
        // do a shallow copy first, in case the same variable name is used
        // multiple times, i.e. properties would be overwritten
        var createContext = function (props) {
          var ctx = shallowCopy(context);
          props.map(function (prop) {
            ctx[prop.key] = prop.value;
          });
          return ctx;
        };
        var evalAll = function (javVal) {
          return evalAllWithContext(javVal, context);
        };
        var evalVal = function (javVal) {
          return javVal && evalWithContext(javVal, context);
        };
        var javNull = {
          null: null,
        };
        return caseSplit({
          action: caseSplit({
            scrollTo: function (obj) {
              var positionS = evalVal(obj.positionS);
              var duration = evalVal(obj.duration || javNull);
              return function () {
                jsoScrollTo(positionS.lastValue + 'px', duration);
              };
            },
          }),
          all: function (obj) {
            return obj.fs.reduce(function (v, fVal) {
              return evalVal(fVal)(v);
            }, evalVal(obj.v));
          },
          array: caseSplit({
            evalEach: function (obj) {
              return obj.map(evalVal);
            },
            map: function (obj) {
              return evalVal(obj.source).map(function (item) {
                var ctx = createContext([{
                  key: obj.name,
                  value: item,
                }]);
                return evalWithContext(obj.value, ctx);
              });
            },
          }),
          apply: function (obj) {
            var f = evalVal(obj.f);
            var args = evalAll(obj.args);
            return evalWithContext(f.value, createContext(f.args.map(function (arg, index) {
              return {
                key: arg.identifier,
                value: args[index] || arg.default,
              };
            })));
          },
          auth: caseSplit({
            loggedIn: !!me,
          }),
          bool: caseSplit({
            constant: id,
          }),
          case: function (obj) {
            var result = {};
            result[obj.key] = evalVal(obj.value);
            return result;
          },
          component: caseSplit({
            alignLRM: function (obj) {
              return alignLRM()({
                l: evalVal(obj.l),
                r: evalVal(obj.r),
                m: evalVal(obj.m),
              });
            },
            alignTBM: function (obj) {
              return alignTBM()({
                t: evalVal(obj.t),
                b: evalVal(obj.b),
                m: evalVal(obj.m),
              });
            },
            all: function (obj) {
              return all(evalAll(obj.mods))(evalVal(obj.c));
            },
            bar: caseSplit({
              h: function (x) {
                return bar.h(x);
              },
              v: function (x) {
                return bar.v(x);
              },
            }),
            grid: function (obj) {
              var config = obj.config || {};
              return grid({
                surplusWidthFunc: caseSplit({
                  centerSurplusWidth: constant(hcj.funcs.surplusWidth.center),
                  evenSplitSurplusWidth: constant(hcj.funcs.surplusWidth.evenlySplit),
                  ignoreSurplusWidth: constant(hcj.funcs.surplusWidth.ignore),
                  giveToNth: hcj.funcs.surplusWidth.giveToNth,
                })(config.surplusWidthFunc || {
                  ignoreSurplusWidth: null,
                }),
                surplusHeightFunc: caseSplit({
                  evenSplitSurplusHeight: constant(hcj.funcs.surplusHeight.evenlySplit),
                  ignoreSurplusHeight: constant(hcj.funcs.surplusHeight.ignore),
                  giveToNth: hcj.funcs.surplusHeight.giveToNth,
                })(obj.config.surplusHeightFunc || {
                  ignoreSurplusHeight: null,
                }),
                padding: config.padding,
                useFullWidth: config.useFullWidth,
                rowOrColumn: config.rowOrColumn,
                rowHeight: caseSplit({
                  useMaxHeight: constant(hcj.funcs.rowHeight.useMaxHeight),
                  useNthMinHeight: hcj.funcs.rowHeight.useNthMinHeight,
                })(config.rowHeight || {
                  useMaxHeight: null,
                }),
              })(evalVal(obj.cs));
            },
            image: function (obj) {
              return keepAspectRatio({
                fill: evalVal(obj.fill),
                left: evalVal(obj.left),
                right: evalVal(obj.right),
                top: evalVal(obj.top),
                bottom: evalVal(obj.bottom),
              })(image({
                src: evalVal(obj.src),
                minWidth: evalVal(obj.minWidth),
                minHeight: evalVal(obj.minHeight),
              }));
            },
            overlays: function (obj) {
              return overlays({})(evalVal(obj.cs));
            },
            stack: function (obj) {
              obj.config = obj.config || {};
              return stack({
                surplusHeightFunc: caseSplit({
                  evenSplitSurplusHeight: constant(hcj.funcs.surplusHeight.evenlySplit),
                  ignoreSurplusHeight: constant(hcj.funcs.surplusHeight.ignore),
                  giveToNth: hcj.funcs.surplusHeight.giveToNth,
                })(obj.config.surplusHeightFunc || {
                  ignoreSurplusHeight: null,
                }),
                padding: evalVal(obj.padding || obj.config.padding), // remove first case
              })(evalVal(obj.cs));
            },
            text: function (obj) {
              return text('' + evalVal(obj.str), (obj.fonts || []).concat(obj.font ? [obj.font] : []));
            },
            textSpans: function (obj) {
              return text(obj.spans.map(function (span) {
                var obj = span.font || {};
                obj.str = evalVal(span.str);
                return obj;
              }), (obj.fonts || []).concat(obj.font ? [obj.font] : []));
            },
          }),
          componentMod: caseSplit({
            $css: function (obj) {
              return $css(obj.style, obj.value);
            },
            backgroundColor: function (obj) {
              return backgroundColor(evalVal(obj.backgroundColor), evalVal(obj.fontColor));
            },
            bodyColumn: function () {
              return bodyColumn;
            },
            border: function (obj) {
              var all = evalVal(obj.all);
              return border(evalVal(obj.color), {
                left: evalVal(obj.left) || all,
                right: evalVal(obj.right) || all,
                top: evalVal(obj.top) || all,
                bottom: evalVal(obj.bottom) || all,
                radius: evalVal(obj.radius),
              });
            },
            clickThis: function (obj) {
              return clickThis(evalVal(obj));
            },
            fadeIn: function (obj) {
              return fadeIn({
                margin: evalVal(obj.margin),
              });
            },
            fontColor: function (obj) {
              return backgroundColor({
                font: evalVal(obj),
              });
            },
            keepAspectRatio: function (obj) {
              return keepAspectRatio({
                fill: evalVal(obj.fill),
              });
            },
            link: function () {
              return link;
            },
            linkTo: function (obj) {
              return linkTo(evalVal(obj));
            },
            margin: function (obj) {
              var all = evalVal(obj.all);
              return margin({
                left: evalVal(obj.left) || all,
                right: evalVal(obj.right) || all,
                top: evalVal(obj.top) || all,
                bottom: evalVal(obj.bottom) || all,
              });
            },
            minHeightAtLeast: function (obj) {
              return minHeightAtLeast(evalVal(obj));
            },
            minWidthAtLeast: function (obj) {
              return minWidthAtLeast(evalVal(obj));
            },
            minHeight: function (obj) {
              return minHeight(evalVal(obj));
            },
            minWidth: function (obj) {
              return minWidth(evalVal(obj));
            },
            slideIn: function () {
              return slideIn();
            },
          }),
          constant: id,
          effect: function (effect) {
            return componentStream(stream.map(caseSplit({
              db: caseSplit({
                find: function (obj) {
                  return stream.fromPromise(db[obj.table].find(evalVal(obj.query)).then(function (results) {
                    return results;
                  }));
                },
              }),
              stream: function (obj) {
                return evalVal(obj);
              },
            })(effect.eff), function (r) {
              return evalWithContext(effect.withResult, createContext([{
                key: effect.name,
                value: r,
              }]));
            }));
          },
          id: function () {
            return id;
          },
          letIn: function (obj) {
            var arr = [];
            obj.lets.map(function (l) {
              arr.push({
                key: l.name,
                value: evalWithContext(l.value, createContext(arr)),
              });
            });
            return evalWithContext(obj.value, createContext(arr));
          },
          handler: caseSplit({
            pushToStream: function (obj) {
              var s = evalVal(obj);
              return function (ev) {
                stream.push(s, ev);
              };
            },
          }),
          ifThenElse: function (obj) {
            return evalVal(evalVal(obj.if) ? obj.then : obj.else);
          },
          identifier: function (obj) {
            return context[obj];
          },
          null: function () {
            return null;
          },
          number: caseSplit({
            constant: id,
            difference: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return ns[0] - ns[1];
            },
            max: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return Math.max(ns[0], ns[1]);
            },
            min: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return Math.min(ns[0], ns[1]);
            },
            product: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return ns[0] * ns[1];
            },
            quotient: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return ns[0] / ns[1];
            },
            sum: function (obj) {
              var ns = evalAll([
                obj.a,
                obj.b,
              ]);
              return ns[0] + ns[1];
            },
          }),
          object: caseSplit({
            create: function (objs) {
              var a = {};
              objs.map(function (prop) {
                a[prop.key] = evalVal(prop.value);
              });
              return a;
            },
            dynamicProperties: function () {
              throw 'do later';
            },
          }),
          onEvent: function (obj) {
            return onThis(obj.event)(evalVal(obj.handler));
          },
          prop: function (obj) {
            return evalVal(obj.object)[obj.key];
          },
          stream: caseSplit({
            create: function () {
              return stream.create();
            },
            map: function (obj) {
              return stream.map(evalVal(obj.source), function (value) {
                return evalWithContext(obj.value, createContext([{
                  key: obj.name,
                  value: value,
                }]));
              });
            },
            reduce: function (obj) {
              return stream.reduce(evalVal(obj.source), function (prevValue, currentValue) {
                return evalWithContext(obj.value, createContext([{
                  key: obj.prevName,
                  value: prevValue,
                }, {
                  key: obj.currentName,
                  value: currentValue,
                }]));
              }, evalVal(obj.initialValue));
            },
            windowHeight: function () {
              return hcj.viewport.heightS;
            },
            windowWidth: function () {
              return hcj.viewport.widthS;
            },
          }),
          string: caseSplit({
            constant: id,
          }),
        })(javVal);
      };
      return evalWithContext;
    };
  };

  var hcj = {
    color: {
      color: color,
      create: color,
      toString: colorString,
    },
    component: {
      $$: $$,
      $addClass: $addClass,
      $attr: $attr,
      $css: $css,
      $on: $on,
      $prop: $prop,
      adjustPosition: adjustPosition,
      alignH: alignLRM,
      alignHorizontal: alignLRM,
      alignHLeft: alignHLeft,
      alignHMiddle: alignHMiddle,
      alignHRight: alignHRight,
      alignLRM: alignLRM,
      alignMiddle: alignMiddle,
      alignTBM: alignTBM,
      alignV: alignTBM,
      alignVBottom: alignVBottom,
      alignVertical: alignTBM,
      alignVMiddle: alignVMiddle,
      alignVTop: alignVTop,
      all: all,
      and: and,
      backgroundColor: backgroundColor,
      bar: bar,
      basicFloat: basicFloat,
      border: border,
      box: rectangle,
      changeThis: changeThis,
      clickThis: clickThis,
      component: component,
      componentStream: componentStreamWithExit,
      compose: all,
      container: container,
      crop: crop,
      cssStream: cssStream,
      dimensions: withDimensions,
      dropdownPanel: dropdownPanel,
      empty: empty,
      fadeIn: fadeIn,
      grid: grid,
      hoverThis: hoverThis,
      keepAspectRatio: keepAspectRatio,
      keydownThis: keydownThis,
      keyupThis: keyupThis,
      image: image,
      largestWidthThatFits: largestWidthThatFits,
      layout: layout,
      link: link,
      linkTo: linkTo,
      margin: margin,
      maxHeightStream: withMaxHeightStream,
      minHeight: withMinHeightStream,
      minHeightStream: withMinHeightStream,
      minHeightAtLeast: minHeightAtLeast,
      minWidth: withMinWidthStream,
      minWidthAtLeast: minWidthAtLeast,
      minWidthStream: withMinWidthStream,
      mousedownThis: mousedownThis,
      mousemoveThis: mousemoveThis,
      mouseoverThis: mouseoverThis,
      mouseoutThis: mouseoutThis,
      mouseupThis: mouseupThis,
      nothing: nothing,
      onThis: onThis,
      overflowHorizontal: overflowHorizontal,
      overlays: overlays,
      padding: margin,
      passthrough: passthrough,
      promiseComponent: promiseComponent,
      scope: scope,
      sideBySide: sideBySide,
      sideSlidingPanel: sideSlidingPanel,
      slideIn: slideIn,
      slider: slider,
      slideshow: slideshow,
      stack: stack,
      stream: cStream,
      streams: cStreams,
      submitThis: submitThis,
      tabs: tabs,
      text: text,
      toggleHeight: toggleHeight,
      wrap: wrap,
    },
    displayedS: displayedS,
    // Remember, elements are not components.  This is why they are
    // under 'el' and not 'c'.  If you want an empty component, use
    // 'c.empty'.
    element: {
      a: a,
      button: button,
      div: div,
      form: form,
      h1: h1,
      h2: h2,
      h3: h3,
      h4: h4,
      h5: h5,
      h6: h6,
      iframe: iframe,
      img: img,
      input: input,
      label: label,
      li: li,
      option: option,
      p: p,
      pre: pre,
      select: select,
      textarea: textarea,
      ul: ul,
    },
    forms: {
      formComponent: formComponent,
      formFor: formFor,
      formStyle: formStyle,
      fieldType: fieldType,
    },
    funcs: {
      constant: constant,
      id: id,
      rowHeight: {
        useMaxHeight: useMaxHeight,
        useNthMinHeight: useNthMinHeight,
      },
      surplusWidth: {
        ignore: ignoreSurplusWidth,
        center: centerSurplusWidth,
        centerFirstRowThenAlignLeft: centerFirstRowThenAlignLeftSurplusWidth,
        evenlySplit: evenlySplitSurplusWidth,
        evenlySplitCenter: evenlySplitCenterSurplusWidth,
        justify: justifySurplusWidth,
        justifyAndCenter: justifyAndCenterSurplusWidth,
        giveToNth: giveToNth,
      },
      surplusHeight: {
        ignore: ignoreSurplusHeight,
        center: centerSurplusHeight,
        giveToNth: giveHeightToNth,
      },
    },
    jsoAction: {
      scrollTo: jsoScrollTo,
    },
    measure: {
      height: measureHeight,
      width: measureWidth,
    },
    rootComponent: rootComponent,
    routing: {
      matchStrings: matchStrings,
      route: route,
      routeMatchRest: routeMatchRest,
      routeToComponentF: routeToComponentF,
      routeToFirst: routeToFirst,
    },
    runJso: runJso,
    stream: stream,
    unit: {
      px: px,
    },
    viewport: {
      heightS: windowHeight,
      scrollS: windowScroll,
      widthS: windowWidth,
    },
  };

  window.hcj = hcj;
})();
