function waitForWebfonts(fonts, callback, maxTime) {
  if (fonts.length === 0) {
    callback();
    return;
  }
  maxTime = maxTime || 10 * 1000;
  var startTime = new Date().getTime();
  var loadedFonts = 0;
  var callbackIsRun = false;
  for(var i = 0; i < fonts.length; i++) {
    (function(font) {
      var container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = 0;
      document.body.appendChild(container);
      var node = document.createElement('span');
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
      var width = node.getBoundingClientRect().width;
      if (font === 'FontAwesome') {
        node.innerHTML = '<i class="fa fa-facebook-square"></i>';
      }
      else {
        node.style.fontFamily = font;
      }

      var interval;
      function checkFont () {
        // Compare current width with original width
        if (node && (new Date().getTime() - startTime > maxTime || node.getBoundingClientRect().width != width)) {
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
  var deprecate = function (message) {
    console.warn('Deprecated: ' + message);
  };
  var uncurryConfig = function (f, valueIsNotConfig) {
    valueIsNotConfig = valueIsNotConfig || function (obj) {
      return Array.isArray(obj) || typeof(obj) === 'function';
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
            if (typeof cases[key] !== 'function') {
              return cases[key];
            }
            return cases[key](obj[key]);
          }
        }
      };
    }
    for (var key in cases) {
      if (cases.hasOwnProperty(key) && obj.hasOwnProperty(key)) {
        if (typeof(cases[key]) !== 'function') {
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

  // Creates a "meta-setTimeout" function for ordering
  // semi-synchronous execution.  Problem statement: Suppose you are
  // using setTimeout to defer execution of a function, and the
  // deferred function itself passes another function to setTimeout,
  // and so on up to some unknown stopping point.  Further suppose
  // that you ALSO want to run some code after all of this is
  // complete, "as if" these recursive setTimeout calls WERE
  // synchronous code.  (If you knew how many recursive setTimeout
  // calls were going to be made, you could wrap your final function
  // in one plus that many setTimeout calls, but if you do not know,
  // that solution does not work.)  To solve the problem statement,
  // create a context `context` as described below.  Then, instead of
  // recursively calling setTimeout, call `context.next`.  To run a
  // function after all such calls are completed, pass it to
  // `context.defer`.

  // The following function returns an object with three properties:

  // "next" is roughly equivalent to setTimeout.  Functions passed to
  // "next" are run in the order they are passed in, after all
  // synchronous code is finished executing.

  // "createChildContext" returns an object with the same three
  // properties.  However, all functions passed to the "next" function
  // of the child context are run *after* all functions passed to the
  // "next" function of this context are run.  This includes functions
  // passed to the "next" function from inside of a function
  // previously passed to the "next" function.

  // "defer" is just syntactic sugar.  It runs a function in the child
  // context of this context, and also returns that child context.
  // One way to implement is as `defer: function (f) { var ctx =
  // this.createChildContext(); ctx.next(f); return ctx; }`.

  // Example:
  /*
    var context = createDeferFuncContext();
    context.next(() => {
      context.next(() => console.log('Third'));
      console.log('Second');
    });
    context.defer(() => {
      console.log('Fourth');
    });
    console.log('First');
   */

  // For the mathematically inclined, the "setTimeout" hierarchy looks
  // rather like the countable ordinals; it has the same kind of
  // ordering relation.  You can imagine a set of infinite ascending
  // chains, that are also mutually placed in an order with respect to
  // one another.  All functions passed to "next" of a fresh context
  // correspond to the ordinal 0, i.e. they are run first.  If any of
  // those functions themselves call "next", those functions then
  // belong to 1, and so on.  A function passed to "defer" immediately
  // belongs to "omega_0", greater than any natural number, meaning it
  // is run after any "next" function and after any "next" function
  // signed up by another "next" function.  If this function passes
  // another function to "defer" on its parent context, or
  // equivalently "next" on its own context, this assigns a function
  // to "omega_0 + 1" - and so on.
  var createDeferFuncContext = function (runASAP) {
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

  var extend = function (dest) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var key in src) {
        if (src.hasOwnProperty(key)) {
          dest[key] = src[key];
        }
      }
    }
    return dest;
  };

  var streamDeferFunc = createDeferFuncContext();
  var stream = {
    create: function () {
      return {
        listeners: [],
        lastValue: undefined,
        hasValue: false,
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
      var s = stream.create();
      s.lastValue = v;
      s.hasValue = true;
      return s;
    },
    push: function (s, v) {
      if (s.lastValue !== v || !s.hasValue) {
        s.lastValue = v;
        s.hasValue = true;
        for (var i = 0; i < s.listeners.length; i++) {
          if (s.listeners[i]) {
            s.listeners[i](v);
          }
        }
      }
    },
    map: function (s, f) {
      var out = stream.create();
      if (s.hasValue) {
        stream.push(out, f(s.lastValue));
      }
      s.listeners.push(function (v) {
        stream.push(out, f(v));
      });
      return out;
    },
    reduce: function (s, f, v1) {
      var out = stream.once(v1);
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
      if (s.hasValue) {
        f(s.lastValue);
      }
      var index = s.listeners.length - 1;
      return function () {
        delete s.listeners[index];
      };
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
      if (source.hasValue) {
        stream.push(target, source.lastValue);
      }
      return stream.onValue(source, function (v) {
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

      var tryRunF = function () {
        for (var i = 0; i < streams.length; i++) {
          if (arr[i] === undefined) {
            return;
          }
        }
        stream.push(out, f.apply(null, arr));
      };

      streams.reduce(function (i, s) {
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

      var tryRunF = function () {
        for (var i = 0; i < streams.length; i++) {
          if (arr[i] === undefined) {
            return;
          }
        }
        stream.push(out, f.apply(null, arr));
      };

      streams.reduce(function (i, s) {
        stream.onValue(s, function (v) {
          arr[i] = v;
          tryRunF();
        });
        return i + 1;
      }, 0);
    },
    combineMany: function (f) {
      var arr = [];

      var tryRunF = function () {
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] === undefined) {
            return;
          }
        }
        f.apply(null, [arr]);
      };

      return {
        addStream: function (s) {
          var i = arr.length;
          arr.push(undefined);
          stream.onValue(s, function (v) {
            arr[i] = v;
            tryRunF();
          });
        },
      };
    },
    all: function (streams) {
      return stream.combine(streams, function () {
        return Array.prototype.slice.call(arguments);
      });
    },
    combineObject: function (streamsObject) {
      var keys = Object.keys(streamsObject);
      var obj = {};
      var out = stream.create();

      var tryRunF = function () {
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (obj[key] === undefined) {
            return;
          }
        }
        stream.push(out, extend({}, obj));
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
    onNextValue: function (s, f, predicate) {
      predicate = predicate || id;
      if (s.hasValue && predicate(s.lastValue)) {
        f(s.lastValue);
        return function () {};
      }
      var i = s.listeners.length;
      var stopListening = function () {
        delete s.listeners[i];
      };
      s.listeners.push(function (v) {
        if (predicate(v)) {
          f(v);
          stopListening();
        }
      });
      return stopListening();
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
  var onceSizeZeroS = stream.once({
    w: 0,
    h: constant(0),
  });

  var windowWidth = stream.create();
  var windowHeight = stream.create();
  var updateWindowWidth = function () {
    stream.push(windowWidth, window.innerWidth);
  };
  var updateWindowHeight = function () {
    stream.push(windowHeight, window.innerHeight);
  };
  updateWindowWidth();
  updateWindowHeight();
  window.addEventListener('resize', function () {
    updateWindowWidth();
    updateWindowHeight();
  });
  var windowWidthMinusScrollbar = stream.create();

  var windowScroll = stream.create();
  window.addEventListener('scroll', function () {
    stream.push(windowScroll, window.scrollY);
  });
  stream.push(windowScroll, window.scrollY);

  var windowHash = stream.create();
  window.addEventListener('hashchange', function () {
    stream.push(windowHash, location.pathname);
  });
  stream.push(windowHash, location.pathname);

  // this stream assumes only one rootComponent per web page!
  // todo: change this into a promise
  // todo: see if it's possible to replace this with hcj.stream.defer
  var displayedS = stream.once(false);

  var updateDomEls = [];
  var updateDomStyles = [];
  var updateDomValues = [];
  var runDomStyles = function () {
    for (var i = 0; i < updateDomEls.length; i++) {
      updateDomEls[i].style[updateDomStyles[i]] = updateDomValues[i];
    }
    updateDomEls = [];
    updateDomStyles = [];
    updateDomValues = [];
  };
  var updateDomStyle = function (el, style, value) {
    if (updateDomEls.length === 0) {
      stream.defer(runDomStyles);
    }
    updateDomEls.push(el);
    updateDomStyles.push(style);
    updateDomValues.push(value);
  };

  var canvas = document.createElement('canvas');
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

  var outerWidth = function (el) {
    var style = window.getComputedStyle(el);
    return el.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
  }
  var outerHeight = function (el) {
    var style = window.getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  }

  var measureWidth = function (el) {
    var sandbox = document.querySelector('.sandbox');
    var clone = el.cloneNode(true);
    clone.style.width = '';
    clone.style.height = '';
    clone.style.position = 'absolute';
    clone.style.display = 'inline-block';
    sandbox.appendChild(clone);

    var width = outerWidth(clone);
    clone.remove();

    return width;
  };

  var measureHeight = function (el) {
    var ws = {};
    return function (w) {
      if (ws[w]) {
        return ws[w];
      }
      var sandbox = document.querySelector('.sandbox');
      var clone = el.cloneNode(true);
      clone.style.width = px(w);
      clone.style.height = '';
      sandbox.appendChild(clone);

      var height = outerHeight(clone);
      ws[w] = height;

      clone.remove();

      return height;
    };
  };

  var renderComponent = function (tagName, build, context) {
    var el = document.createElement(tagName);
    el.style.visibility = 'hidden';
    context.el.appendChild(el);

    var contextComplete = 0;
    stream.onValue(context.width, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 1;
      if (contextComplete === 15) {
        updateDomStyle(el, 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.height, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 2;
      if (contextComplete === 15) {
        updateDomStyle(el, 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.top, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 4;
      if (contextComplete === 15) {
        updateDomStyle(el, 'visibility', '');
        contextComplete = -1;
      }
    });
    stream.onValue(context.left, function (x) {
      if (contextComplete === -1) {
        return;
      }
      contextComplete = contextComplete | 8;
      if (contextComplete === 15) {
        updateDomStyle(el, 'visibility', '');
        contextComplete = -1;
      }
    });

    var instance = {
      el: el,
      transitions: {},
    };
    var initialMinSize;
    var buildResult = build(el, context, function (config) {
      var size = {
        w: measureWidth(el, config),
        h: measureHeight(el, config),
      };
      if (instance.minSize) {
        stream.push(instance.minSize, size);
      }
      else {
        initialMinSize = size;
      }
    }) || {};
    instance.minSize = buildResult.minSize || stream.create();
    if (initialMinSize !== undefined) {
      stream.push(instance.minSize, initialMinSize);
    }

    instance.remove = function () {
      if (context.remove) {
        context.remove();
      }
      if (buildResult.remove) {
        buildResult.remove();
      }
      el.remove();
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

  // Sets a CSS property transition on an instance.
  var transition = function (i, prop, transition) {
    if (transition) {
      i.transitions[prop] = transition;
    }
    else {
      delete i.transitions[prop];
    }
    var transitionString = '';
    for (var p in i.transitions) {
      if (i.transitions.hasOwnProperty(p)) {
        if (transitionString) {
          transitionString += ', ';
        }
        transitionString += p + ' ' + i.transitions[p];
      }
    }
    i.el.style.transition = transitionString;
  };

  var _scrollbarWidth = function () {
    var parent = document.createElement('div');
    parent.style.width = '50px';
    parent.style.height = '50px';
    parent.style.overflow = 'auto';
    var child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);
    var widthWithoutScrollbar = child.clientWidth;
    child.style.height = '100px';
    var widthWithScrollbar = child.clientWidth;
    parent.remove();
    return widthWithoutScrollbar - widthWithScrollbar;
  };

  var mapPx = function (s) {
    return s && stream.map(s, px);
  };
  var mapCalc = function (s) {
    return s && stream.map(s, function (x) {
      return "calc(" + x + ")";
    });
  };
  var layoutAppend = function (childInstances, el, context, c, ctx, config) {
    ctx = ctx || {};
    var childWidth = stream.create();
    var childWidthCalc = stream.create();
    var childHeight = stream.create();
    var childHeightCalc = stream.create();
    var childTop = stream.create();
    var childTopCalc = stream.create();
    var childLeft = stream.create();
    var childLeftCalc = stream.create();
    var contextTop = stream.create();
    var contextLeft = stream.create();

    var unpushWidth;
    var unpushWidthCalc;
    var unpushHeight;
    var unpushHeightCalc;
    var unpushTop;
    var unpushTopCalc;
    var unpushLeft;
    var unpushLeftCalc;
    var unpushContextTop = stream.pushAll(context.top, contextTop);
    var unpushContextLeft = stream.pushAll(context.left, contextLeft);
    if (!ctx.width) {
      unpushWidth = stream.pushAll(context.width, childWidth);
      stream.push(childWidthCalc, '100%');
    }
    else {
      unpushWidth = stream.pushAll(ctx.width, childWidth);
      if (ctx.widthCalc) {
        unpushWidthCalc = stream.pushAll(ctx.widthCalc, childWidthCalc);
      }
      else {
        unpushWidthCalc = stream.pushAll(mapPx(ctx.width), childWidthCalc);
      }
    }
    if (!ctx.height) {
      unpushHeight = stream.pushAll(context.height, childHeight);
      stream.push(childHeightCalc, '100%');
    }
    else {
      unpushHeight = stream.pushAll(ctx.height, childHeight);
      if (ctx.heightCalc) {
        unpushHeightCalc = stream.pushAll(ctx.heightCalc, childHeightCalc);
      }
      else {
        unpushHeightCalc = stream.pushAll(mapPx(ctx.height), childHeightCalc);
      }
    }
    if (ctx.top) {
      unpushTop = stream.pushAll(ctx.top, childTop);
      if (ctx.topCalc) {
        unpushTopCalc = stream.pushAll(ctx.topCalc, childTopCalc);
      }
      else {
        unpushTopCalc = stream.pushAll(mapPx(ctx.top), childTopCalc);
      }
    }
    else {
      stream.push(childTop, 0);
      stream.push(childTopCalc, '0px');
    }
    if (ctx.left) {
      unpushLeft = stream.pushAll(ctx.left, childLeft);
      if (ctx.leftCalc) {
        unpushLeftCalc = stream.pushAll(ctx.leftCalc, childLeftCalc);
      }
      else {
        unpushLeftCalc = stream.pushAll(mapPx(ctx.left), childLeftCalc);
      }
    }
    else {
      stream.push(childLeft, 0);
      stream.push(childLeftCalc, '0px');
    }

    var i = c({
      el: ctx && ctx.el || el,
      width: childWidth,
      height: childHeight,
      top: stream.combine([
        contextTop,
        childTop,
      ], function (t1, t2) {
        return t1 + t2;
      }),
      left: stream.combine([
        contextLeft,
        childLeft,
      ], function (l1, l2) {
        return l1 + l2;
      }),
      remove: function () {
        if (unpushWidth) {
          unpushWidth();
        }
        if (unpushWidthCalc) {
          unpushWidthCalc();
        }
        if (unpushHeight) {
          unpushHeight();
        }
        if (unpushHeightCalc) {
          unpushHeightCalc();
        }
        if (unpushTop) {
          unpushTop();
        }
        if (unpushTopCalc) {
          unpushTopCalc();
        }
        if (unpushLeft) {
          unpushLeft();
        }
        if (unpushLeftCalc) {
          unpushLeftCalc();
        }
        unpushContextTop();
        unpushContextLeft();
      },
    });
    if (!config || config.noRemove !== true) {
      childInstances.push(i);
    }
    // todo: replace with some isInstance function
    if (!i || !i.minSize) {
      console.log('not a component');
      debugger;
    }
    i.el.style.position = 'absolute';
    stream.onValue(mapCalc(childWidthCalc), function (w) {
      updateDomStyle(i.el, 'width', w);
    });
    stream.onValue(mapCalc(childHeightCalc), function (h) {
      updateDomStyle(i.el, 'height', h);
    });
    stream.onValue(mapCalc(childTopCalc), function (t) {
      updateDomStyle(i.el, 'top', t);
    });
    stream.onValue(mapCalc(childLeftCalc), function (l) {
      updateDomStyle(i.el, 'left', l);
    });
    return i;
  };
  var layoutRecurse = function (childInstances, el, context, cs) {
    if (Array.isArray(cs)) {
      return cs.map(function (c) {
        return layoutRecurse(childInstances, el, context, c);
      });
    }
    if (typeof(cs) !== 'function') {
      console.log('cs is not a function');
      debugger;
    }
    return function (ctx, config) {
      return layoutAppend(childInstances, el, context, cs, ctx, config);
    };
  };

  var layout = function (elArg, buildLayoutArg) {
    var el = buildLayoutArg ? elArg : 'div';
    var buildLayout = buildLayoutArg || elArg;
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return component(el, function (el, ctx) {
        el.style.textDecoration = 'inherit';
        var childInstances = [];
        el.style.position = 'absolute';
        var i = buildLayout.apply(null, [el, ctx].concat(layoutRecurse(childInstances, el, ctx, args)));
        return {
          el: el,
          minSize: i.minSize,
          remove: function () {
            childInstances.map(function (i) {
              return i.remove();
            });
            i.remove && i.remove();
          },
        };
      });
    };
  };

  var container = function (elArg, buildContainerArg) {
    var el = buildContainerArg ? elArg : 'div';
    var buildContainer = buildContainerArg || elArg;
    return component(el, function (el, context) {
      var childInstances = [];
      el.style.position = 'absolute';
      var i = buildContainer(el, context, function (c, ctx, config) {
        return layoutAppend(childInstances, el, context, c, ctx, config);
      });
      return {
        el: el,
        minSize: i.minSize,
        remove: function () {
          childInstances.map(function (i) {
            return i.remove();
          });
          i.remove && i.remove();
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

  var rootLayout = layout(function (el, ctx, c) {
    var i = c();
    // todo: detach from these streams when instance is removed
    stream.combine([
      ctx.widthCalc ? mapCalc(ctx.widthCalc) : mapPx(ctx.width),
      ctx.heightCalc ? mapCalc(ctx.heightCalc) : mapPx(ctx.height),
      ctx.topCalc ? mapCalc(ctx.topCalc) : mapPx(ctx.top),
      ctx.leftCalc ? mapCalc(ctx.leftCalc) : mapPx(ctx.left),
    ], function (w, h, t, l) {
      stream.push(displayedS, true);
    });
    return {
      minSize: i.minSize,
    };
  });

  var ensureSandbox = function () {
    if (document.querySelector('.sandbox')) {
      return;
    }
    var sandbox = document.createElement('div');
    sandbox.classList.add('sandbox');
    sandbox.style.zIndex = '-1';
    sandbox.style.visibility = 'hidden';
    document.body.appendChild(sandbox);
  };
  var countComponentsRendered = 0;
  var rootComponentHeights = [];
  var rootComponent = function (c, config) {
    var nthRootComponent = countComponentsRendered;
    countComponentsRendered += 1;
    config = config || {};
    ensureSandbox();
    var scrollbarWidth = _scrollbarWidth();
    var widthS = stream.create();
    var heightS = stream.create();
    var minSize = stream.create();
    stream.combine([
      windowWidth,
      windowHeight,
      minSize,
    ], function (ww, wh, ms) {
      var mh = ms.h;
      var mhAtWW = mh(ww);
      var mhAtScrollbarWW = mh(ww - scrollbarWidth);
      var componentWidth;
      var componentHeight;
      if (mhAtWW > wh) {
        componentWidth = ww - scrollbarWidth;
        componentHeight = mhAtScrollbarWW;
        if (mhAtScrollbarWW > wh) {
          document.body.style.overflowY = 'initial';
        }
        else {
          document.body.style.overflowY = 'scroll';
        }
      }
      else {
        componentWidth = ww;
        componentHeight = mhAtWW;
        document.body.style.overflowY = 'initial';
      }
      componentHeight = Math.max(wh, componentHeight);
      stream.push(widthS, componentWidth);
      stream.push(windowWidthMinusScrollbar, componentWidth);
      stream.push(heightS, componentHeight);
    });
    var i = rootLayout(c)({
      el: document.body,
      width: widthS,
      height: heightS,
      top: onceZeroS,
      left: onceZeroS,
    });
    i.el.style.position = 'absolute';
    i.el.style.top = '0px';
    i.el.style.left = '0px';
    i.el.classList.add('root-component');
    i.el.classList.add('root-component-' + nthRootComponent);
    stream.pushAll(i.minSize, minSize);
    stream.combine([
      widthS,
      heightS,
    ], function (w, h) {
      i.el.style.width = px(w);
      i.el.style.height = px(h);
    });
    stream.onValue(heightS, function (h) {
      rootComponentHeights[nthRootComponent] = h;
      document.body.style.height = rootComponentHeights.reduce(function (a, x) {
        return Math.max(a, x);
      }, 0) + 'px';
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
    if (typeof c === 'string') {
      return c;
    }
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

  var mapMinSizes = function (is) {
    return stream.all(is.map(function (i) {
      return i.minSize;
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

  var css = function (prop, value) {
    return and(function (i) {
      i.el.style[prop] = value;
    });
  };

  var andTransition = function (prop, value) {
    return and(function (i) {
      return transition(i, prop, value);
    });
  };

  var useMinWidth = function (ctx, i) {
    return stream.onValue(i.minSize, function (ms) {
      stream.push(ctx.width, ms.w);
    });
  };
  var useMinHeight = function (ctx, i) {
    return stream.combineInto([
      ctx.width,
      i.minSize,
    ], function (w, ms) {
      return ms.h(w);
    }, ctx.height);
  };
  var minWidth = function (mw) {
    return layout(function (el, ctx, c) {
      el.classList.add('minWidth');
      var i = c();
      return {
        minSize: stream.map(i.minSize, function (ms) {
          return {
            w: mw,
            h: ms.h,
          };
        }),
      };
    });
  };
  var minHeight = function (mh) {
    return layout(function (el, ctx, c) {
      el.classList.add('minHeight');
      var i = c();
      return {
        minSize: stream.map(i.minSize, function (ms) {
          return {
            w: ms.w,
            h: constant(mh),
          };
        }),
      };
    });
  };
  var withDimensions = function (mw, mh) {
    return layout(function (el, ctx, c) {
      el.classList.add('withDimensions');
      var i = c();
      return {
        minSize: stream.once({
          w: mw,
          h: constant(mh),
        }),
      };
    });
  };
  var passthrough = function (f, el) {
    return layout(el || 'div', function (el, ctx, c) {
      el.classList.add('passthrough');
      if (f) {
        f(el);
      }
      return c();
    });
  };
  var wrap = function (el) {
    return passthrough(null, el);
  };

  var adjustPosition = function (minSize, position) {
    position = position || {};
    return layout(function (el, ctx, c) {
      el.classList.add('adjust-position');
      var adjustedCtx = extend({}, ctx, {
        el: el,
        top: position.top ? stream.create() : onceZeroS,
        left: position.left ? stream.create() : onceZeroS,
        width: position.width ? stream.create() : ctx.width,
        height: position.height ? stream.create() : ctx.height,
        widthCalc: ctx.widthCalc && (position.widthCalc ? stream.create() : ctx.widthCalc),
        heightCalc: ctx.heightCalc && (position.heightCalc ? stream.create() : ctx.heightCalc),
      });
      var i = c(adjustedCtx);
      if (position.top) {
        stream.pushAll(position.top(el.firstChild), adjustedCtx.top);
      }
      if (position.left) {
        stream.pushAll(position.left(el.firstChild), adjustedCtx.left);
      }
      if (position.width) {
        stream.onValue(ctx.width, function (w) {
          stream.push(adjustedCtx.width, position.width(w, el.firstChild));
        });
      }
      if (position.height) {
        stream.onValue(ctx.height, function (h) {
          stream.push(adjustedCtx.height, position.height(h, el.firstChild));
        });
      }
      if (ctx.widthCalc && position.widthCalc) {
        stream.onValue(ctx.widthCalc, function (wc) {
          stream.push(adjustedCtx.widthCalc, position.widthCalc(wc, el.firstChild));
        });
      }
      if (ctx.heightCalc && position.heightCalc) {
        stream.onValue(ctx.heightCalc, function (hc) {
          stream.push(adjustedCtx.heightCalc, position.heightCalc(hc, el.firstChild));
        });
      }
      return {
        minSize: minSize ? minSize(i.minSize, el.firstChild) : i.minSize,
      };
    });
  };

  var link = all([
    css('cursor', 'pointer'),
  ]);

  var onThis = function (event, handler) {
    return and(function (i) {
      i.el.addEventListener(event, function () {
        Array.prototype.push.call(arguments, i);
        handler.apply(null, arguments);
      });
    });
  };
  var onThisCurried = function (event) {
    return function (handler) {
      return onThis(event, handler);
    };
  };
  var changeThis = onThisCurried('change');
  var clickThis = onThisCurried('click');
  var inputPropertychangeThis = onThisCurried('input propertychange');
  var keydownThis = onThisCurried('keydown');
  var keyupThis = onThisCurried('keyup');
  var mousedownThis = onThisCurried('mousedown');
  var mousemoveThis = onThisCurried('mousemove');
  var mouseoverThis = onThisCurried('mouseover');
  var mouseoutThis = onThisCurried('mouseout');
  var mouseupThis = onThisCurried('mouseup');
  var submitThis = onThisCurried('submit');

  var pushOnClick = function (s, f) {
    return clickThis(function (ev) {
      stream.push(s, f(ev));
    });
  };

  var hoverThis = function (cb) {
    return passthrough(function (el) {
      cb(false, el);
      el.addEventListener('mouseover', function (ev) {
        cb(true, el, ev);
      });
      el.addEventListener('mouseout', function (ev) {
        cb(false, el, ev);
      });
    });
  };

  var hoverStream = function (s, f) {
    f = f || function (v) {
      return v;
    };
    return and(function (i) {
      i.el.addEventListener('mouseenter', function (ev) {
        stream.push(s, f(ev));
      });
      i.el.addEventListener('mouseleave', function (ev) {
        stream.push(s, f(false));
      });
    });
  };

  var cssStream = function (style, valueS) {
    return passthrough(function (el) {
      stream.map(valueS, function (value) {
        el.style[style] = value;
      });
    });
  };

  var backgroundColor = function (s, arg2, arg3, arg4) {
    // function may accept four arguments, or an object...
    if (isColor(s)) {
      s = {
        background: s,
        font: arg2,
        backgroundHover: arg3,
        fontHover: arg4,
      };
    }
    s = s || {};
    // or a stream of objects.
    if (!stream.isStream(s)) {
      s = stream.once(s);
    }
    return and(function (i) {
      var bc, fc, bcHover, fcHover, hoverState = false;
      var applyColors = function () {
        var applyBC = hoverState ? (bcHover || bc) : bc;
        var applyFC = hoverState ? (fcHover || fc) : fc;
        if (applyBC) {
          i.el.style.backgroundColor = colorString(applyBC);
        }
        if (applyFC) {
          i.el.style.color = colorString(applyFC);
        }
      };
      stream.map(s, function (colors) {
        bc = colors.background;
        fc = colors.font;
        bcHover = colors.backgroundHover || bc;
        fcHover = colors.fontHover || fc;
        transition(i, 'background-color', (colors.backgroundTransition || colors.transition || 0) + 's');
        transition(i, 'color', (colors.fontTransition || colors.transition || 0) + 's');
        applyColors();
      });
      i.el.addEventListener('mouseover', function () {
        hoverState = true;
        applyColors();
      });
      i.el.addEventListener('mouseout', function () {
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
    if (typeof amount === 'number') {
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
    return layout(function (el, ctx, c) {
      el.classList.add('crop');
      el.style.overflow = 'hidden';
      var props = stream.create();
      var i = c({
        top: stream.prop(props, 'top'),
        left: stream.prop(props, 'left'),
        width: stream.prop(props, 'width'),
        height: stream.prop(props, 'height'),
      });
      stream.combineInto([
        ctx.width,
        ctx.height,
      ], function (w, h) {
        var width = w / (1 - left - right);
        var height = h / (1 - top - bottom);
        return {
          top: -top * height,
          left: -left * width,
          width: width,
          height: height,
        };
      }, props);
      return {
        minSize: stream.map(i.minSize, function (ms) {
          return {
            w: ms.w * (1 - left - right),
            h: function (w) {
              return ms.h(ms.w / (1 - left - right)) * (1 - top - bottom);
            },
          };
        }),
      };
    });
  };
  var aspectRatio = function (w, h) {
    return (h === 0) ? 1 : (w / h);
  };
  var keepAspectRatio = uncurryConfig(function (config) {
    config = config || {};
    return layout(function (el, ctx, c) {
      el.classList.add('keepAspectRatio');
      if (config.fill) {
        el.style.overflow = 'hidden';
      }
      if (!stream.isStream(config.fill)) {
        config.fill = stream.once(config.fill || false);
      }
      var props = stream.create();
      var i = c({
        top: stream.prop(props, 'top'),
        left: stream.prop(props, 'left'),
        width: stream.prop(props, 'width'),
        height: stream.prop(props, 'height'),
      });
      stream.combineInto([
        i.minSize,
        ctx.width,
        ctx.height,
        config.fill,
      ], function (ms, w, h, fill) {
        var ar = aspectRatio(ms.w, ms.h(ms.w));
        var AR = aspectRatio(w, h);
        // container is wider
        if ((!fill && AR > ar) ||
            (fill && AR < ar)) {
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
      return {
        minSize: stream.map(i.minSize, function (ms) {
          var mw;
          if (config.minWidth) {
            mw = config.minWidth;
          }
          else if (config.minHeight) {
            var ar = aspectRatio(ms.w, ms.h(ms.w));
            mw = config.minHeight * ar;
          }
          else {
            mw = ms.w;
          }
          var mh = function (w) {
            return w / aspectRatio(ms.w, ms.h(ms.w));
          };
          return {
            w: mw,
            h: mh,
          };
        }),
      };
    });
  });

  var image = function (config) {
    var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
    return img(function (el, ctx) {
      var minSize = stream.create();
      stream.onValue(srcStream, function (src) {
        el.src = src;
      });
      el.addEventListener('load', function () {
        var aspectRatio = el.naturalWidth / el.naturalHeight;
        var mw = (config.hasOwnProperty('minWidth') && config.minWidth) ||
            (config.hasOwnProperty('minHeight') && config.minHeight && config.minHeight * aspectRatio) ||
            el.naturalWidth;
        if (config.minWidth === 0 || config.minHeight === 0) {
          mw = 0;
        }
        stream.push(minSize, {
          w: mw,
          h: function (w) {
            return w / aspectRatio;
          },
        });
      });
      return {
        minSize: minSize,
      };
    });
  };

  var linkTo = uncurryConfig(function (config) {
    if (typeof config === 'string') {
      config = {
        href: config,
      };
    }
    return layout('a', function (el, ctx, c) {
      el.href = config.href;
      if (config.target) {
        el.target = config.target || '';
      }
      if (!config.defaultStyle) {
        el.classList.add('no-style');
      }
      return c();
    });
  });

  var empty = function (el) {
    return component(el, function (el, ctx) {
      el.classList.add('empty');
      return {
        minSize: onceSizeZeroS,
      };
    });
  };
  var nothing = empty("div");

  var once300S = stream.once(300);
  var bodyStyle = getComputedStyle(document.body);
  var bodyFontSize = bodyStyle.fontSize;
  var bodyLineHeight = bodyStyle.lineHeight;
  var bodyFontFamily = bodyStyle.fontFamily;
  var spanConfigProperties = [
    ['size', 'fontSize'],
    ['style', 'fontStyle'],
    ['weight', 'fontWeight'],
    ['family', 'fontFamily'],
    ['color', 'color'],
    ['shadow', 'textShadow'],
    ['verticalAlign', 'verticalAlign'],
    ['lineHeight', 'lineHeight'],
  ];
  var textConfigProperties = [
    ['size', 'fontSize'],
    ['style', 'fontStyle'],
    ['weight', 'fontWeight'],
    ['family', 'fontFamily'],
    ['color', 'color'],
    ['shadow', 'textShadow'],
    ['align', 'textAlign'],
    ['verticalAlign', 'verticalAlign'],
    ['lineHeight', 'lineHeight'],
  ];
  var text = uncurryConfig(function (config) {
    config = config || {};
    return function (strs) {
      strs = strs || '';
      if (!Array.isArray(strs)) {
        strs = [strs];
      }
      if (Array.isArray(config)) {
        config = config.reduce(extend, {});
      }

      return (config.el || div)(function (el, ctx) {
        el.classList.add('text');
        var removed = false;
        var mwS = (config.hasOwnProperty('minWidth') ||
                   config.measureWidth)
            ? stream.create()
            : once300S;
        var mhS = stream.create();
        var spanStreams = [];
        var pushingDimensions = false;
        var pushDimensions = function () {
          if (pushingDimensions) {
            return;
          }
          pushingDimensions = true;
          stream.next(function () {
            if (removed) {
              return;
            }
            pushingDimensions = false;
            var mw = null;
            if (config.hasOwnProperty('minWidth')) {
              mw = config.minWidth;
            }
            else if (config.measureWidth) {
              // mw = strs.reduce(function (a, c, index) {
              //   var width = measureTextWidth(c.str, c.font);
              //   return a + width;
              // }, 0);
              mw = measureWidth(el);
            }
            if (mw !== null) {
              stream.push(mwS, mw);
            }
            if (config.oneLine || config.approximateHeight) {
              var elStyle = getComputedStyle(el);
              var lineHeightCss = elStyle.lineHeight;
              var fontSize = config.size || parseInt(elStyle.fontSize);
              var lineHeightPx = config.lineHeight && config.lineHeight * fontSize || (lineHeightCss.indexOf('px') !== -1 && parseFloat(lineHeightCss));
              var mh;
              if (config.oneLine) {
                mh = constant(lineHeightPx);
              }
              else if (config.approximateHeight) {
                mh = function (w) {
                  // TODO: loop over spans
                  var str = el.textContent;
                  return Math.ceil(lineHeightPx * str.length * 0.5 / w) * lineHeightPx;
                };
              }
              stream.push(mhS, mh);
            }
            if (!config.oneLine) {
              stream.defer(function () {
              var mh = config.hasOwnProperty('minHeight') ? constant(config.minHeight) : measureHeight(el);
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
          });
        };
        strs.map(function (c, index) {
          if (typeof c === 'string') {
            c = {
              str: c,
            };
            strs[index] = c;
          }
          var updateStr = function (str) {
            if (index === strs.length - 1) {
              str = str + ' ';
            }
            span.innerHTML = str;
            c.words = str.split(' ');
          };
          var span = document.createElement('span');
          if (stream.isStream(c.str)) {
            span = document.createElement('span');
            spanStreams.push(stream.map(c.str, function (x) {
              updateStr(x);
              pushDimensions();
            }));
          }
          else {
            span.innerHTML = c.str;
          }

          // for measuring span size via html5 canvas:
          // var fontStyle = 'normal';
          // var fontVariant = 'normal';
          // var fontWeight = c.weight || config.weight || 'normal';
          // var fontSize = c.size || config.size || bodyFontSize;
          // var lineHeight = c.lineHeight || config.lineHeight || bodyLineHeight;
          // var fontFamily = c.family || config.family || bodyFontFamily;

          // c.font = [
          //   fontStyle,
          //   fontVariant,
          //   fontWeight,
          //   fontSize + '/' + lineHeight,
          //   fontFamily,
          // ].join(' ');

          if (c.color) {
            if (stream.isStream(c.color)) {
              c.color = stream.map(c.color, colorString);
            }
            else {
              c.color = colorString(c.color);
            }
          }

          spanConfigProperties.map(function (property) {
            var value = c[property[0]];
            if (value) {
              if (stream.isStream(value)) {
                spanStreams.push(value);
                stream.onValue(value, function (x) {
                  span.style[property[1]] = x;
                  return x;
                });
              }
              else {
                span.style[property[1]] = value;
              }
            }
          });

          if (c.spanCSS) {
            c.spanCSS.map(function (css) {
              span.style[css.name] = css.value;
            });
          }

          if (c.linkTo) {
            var a = document.createElement('a');
            if (c.linkToNoStyle) {
              a.classList.add('no-style');
            }
            a.href = c.linkTo;
            el.appendChild(a);
            a.appendChild(span);
          }
          else {
            el.appendChild(span);
          }
        });

        if (config.color) {
          if (stream.isStream(config.color)) {
            config.color = stream.map(config.color, colorString);
          }
          else {
            config.color = colorString(config.color);
          }
        }

        textConfigProperties.map(function (property) {
          var value = config[property[0]];
          if (value) {
            if (stream.isStream(value)) {
              spanStreams.push(value);
              stream.onValue(value, function (x) {
                el.style[property[1]] = x;
                return x;
              });
            }
            else {
              el.style[property[1]] = value;
            }
          }
        });

        if (config.spanCSS) {
          config.spanCSS.map(function (css) {
            el.style[css.name] = css.value;
          });
        }

        if (spanStreams.length > 0) {
          stream.combine(spanStreams, function () {
            pushDimensions();
          });
        }
        pushDimensions();

        return {
          minSize: stream.combine([
            mwS,
            mhS,
          ], function (mw, mh) {
            return {
              w: mw,
              h: mh,
            };
          }),
          remove: function () {
            removed = true;
          },
        };
      });
    };
  }, function (obj) {
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return true;
      }
      obj = obj[0];
    }
    return typeof obj === 'string' || (obj && obj.hasOwnProperty('str'));
  });

  var mapSurplusWidthFunc = function (f) {
    return function (width, rows) {
      return rows.map(function (cols, i) {
        return f(width, cols, i);
      });
    };
  };
  var ignoreSurplusWidth = mapSurplusWidthFunc(function (_, cols) {
    return cols;
  });
  var ignoreSurplusHeight = function (_, rows) {
    return rows;
  };
  var centerSurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.left += surplusWidth / 2;
    });
    return positions;
  });
  var evenlySplitSurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.width += widthPerCol;
      position.left += i * widthPerCol;
    });
    return positions;
  });
  var evenlySplitCenterSurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    var widthPerCol = surplusWidth / positions.length;
    positions.map(function (position, i) {
      position.left += (i + 0.5) * widthPerCol;
    });
    return positions;
  });
  var centerAllSameSurplusWidth = mapSurplusWidthFunc(function () {
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
  });
  var centerFirstRowThenAlignLeftSurplusWidth = mapSurplusWidthFunc(function () {
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
  });
  var centerLargestRowThenAlignLeftSurplusWidth = function (gridWidth, rows) {
    var minLeft = 0;
    var rowsSoFar = [];
    return rows.map(function (positions, i) {
      positions = centerSurplusWidth(gridWidth, [positions])[0];
      if (i === 0) {
        minLeft = positions[0].left;
        rowsSoFar = [positions];
      }
      else {
        var thisRowLeft = positions[0].left;
        if (minLeft < thisRowLeft) {
          positions.map(function (position, i) {
            position.left += (minLeft - thisRowLeft);
          });
        }
        else {
          rowsSoFar.map(function (positions) {
            positions.map(function (position, i) {
              position.left += (thisRowLeft - minLeft);
            });
          });
          minLeft = thisRowLeft;
        }
        rowsSoFar.push(positions);
      }
      return positions;
    });
  };
  // don't read this function, please
  var evenlySplitSurplusWidthWithMinPerRow = function (minPerRow) {
    return mapSurplusWidthFunc(function (gridWidth, positions) {
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
    });
  };
  var justifySurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    positions.map(function (position, i) {
      for (var index = 0; index < i; index++) {
        position.left += surplusWidth / (positions.length - 1);
      }
    });
    return positions;
  });
  var justifyAndCenterSurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
    var lastPosition = positions[positions.length - 1];
    var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
    positions.map(function (position, i) {
      position.left += i * surplusWidth / (positions.length) +
        surplusWidth / (2 * positions.length);
    });
    return positions;
  });
  var surplusWidthAlign = function (t) {
    return mapSurplusWidthFunc(function (gridWidth, positions) {
      var lastPosition = positions[positions.length - 1];
      var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
      positions.map(function (position, i) {
        position.left += t * surplusWidth;
      });
      return positions;
    });
  };
  var surplusWidthAlignLeft = surplusWidthAlign(0);
  var surplusWidthAlignCenter = surplusWidthAlign(0.5);
  var surplusWidthAlignRight = surplusWidthAlign(1);
  var superSurplusWidth = mapSurplusWidthFunc(function (gridWidth, positions) {
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
  });

  var giveToNth = function (n) {
    return mapSurplusWidthFunc(function (gridWidth, positions) {
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
    });
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
    return layout(function (el, ctx, cs) {
      el.classList.add('slideshow');

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

      var allMinSizes = mapMinSizes(is);

      var computePositions = function (selected, width, mss, warpIndex) {
        return mss.map(function (ms, index) {
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
          transition(is[index], 'left', position.warp ? '' : 'ease ' + config.transitionTime + 's');
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

      var widthS = stream.once(0);
      stream.pushAll(ctx.width, widthS);
      return {
        minSize: stream.combine([
          selectedIndexS,
          widthS,
          allMinSizes,
        ], function (selectedIndex, width, mss) {
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
            positions = computePositions(selectedIndexModuloCs + cs.length, width, mss, 0);
            moveSlideshow(positions, selectedIndexModuloCs + cs.length);
            break;
          case 1:
            positions = computePositions(selectedIndexModuloCs + cs.length, width, mss);
            moveSlideshow(positions, selectedIndexModuloCs + cs.length);
            break;
          case 2:
            segmentOrder = [
              segmentOrder[1],
              segmentOrder[2],
              segmentOrder[0],
            ];
            positions = computePositions(selectedIndexModuloCs + cs.length, width, mss, 2);
            moveSlideshow(positions, selectedIndexModuloCs + cs.length);
            break;
          }
          return {
            w: mss.reduce(function (a, ms) {
              return a + ms.w;
            }, config.padding * (is.length - 1)),
            h: constant(mhs.map(function (mh, i) {
              return mh(width);
            }).reduce(mathMax, 0)),
          };
        }),
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
    config.surplusWidth = config.surplusWidth || ignoreSurplusWidth;
    return layout(function (el, ctx, cs) {
      el.classList.add('sideBySide');
      if (cs.length === 0) {
        return {
          minSize: onceSizeZeroS,
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
      var allMinSizes = mapMinSizes(is, ctx);
      var computePositions = function (width, mss) {
        var left = 0;
        var positions = mss.map(function (ms, index) {
          var w = Math.min(width, ms.w);
          var position = {
            left: left + config.padding * index,
            width: w,
          };
          left += w;
          return position;
        });
        positions = config.surplusWidth(width, [positions])[0];
        return positions;
      };
      stream.combine([
        ctx.width,
        allMinSizes,
        config.sourcePositionsS || stream.once([]),
      ], function (width, mss, sourcePositions) {
        var positions = computePositions(width, mss);
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
        minSize: stream.map(allMinSizes, function (mss) {
          return {
            w: mss.reduce(function (a, ms) {
              return a + ms.w;
            }, config.padding * (is.length - 1)),
            h: function (w) {
              var positions = computePositions(w, mss);
              return positions.map(function (position, i) {
                return mss[i].h(positions[i].width);
              }).reduce(mathMax, 0);
            },
          };
        }),
      };
    });
  });

  var slideIn = uncurryConfig(function (config) {
    config = config || {};
    config.top = config.top || 50;
    config.transition = config.transition || '1s';
    return layout(function (el, ctx, c) {
      var context = {
        top: stream.create(),
      };
      var i = c(context);
      transition(i, 'top', config.transition);
      var pushed = false;
      stream.push(context.top, config.top);
      stream.combine([
        ctx.top,
        windowHeight,
        windowScroll,
        displayedS,
      ], function (t, wh, ws, d) {
        if (!pushed && d) {
          var visibleUntil = ws + wh;
          if (t <= visibleUntil) {
            stream.push(context.top, 0);
            pushed = true;
          }
        }
      });
      return {
        minSize: i.minSize,
      };
    });
  });
  var fadeIn = uncurryConfig(function (config) {
    config = config || {};
    config.transition = config.transition || '1s';
    config.margin = config.margin || 0;
    return layout(function (el, ctx, c) {
      var i = c();
      var pushed = false;
      i.el.style.opacity = 0;
      setTimeout(function () {
        transition(i, 'opacity ', config.transition);
      });
      stream.combine([
        ctx.top,
        windowHeight,
        windowScroll,
        displayedS,
      ], function (t, wh, ws, d) {
        if (!pushed && d) {
          var visibleUntil = ws + wh;
          if (t + config.margin <= visibleUntil) {
            i.el.style.opacity = 1;
            pushed = true;
          }
        }
      });
      return {
        minSize: i.minSize,
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
    return layout(function (el, ctx, cs) {
      el.classList.add('slider')
      el.style.overflowX = 'hidden';
      el.style.cursor = 'move';

      var allMinSizes = stream.create();

      var leftS = stream.combine([
        ctx.width,
        allMinSizes,
        stateS,
        grabbedS
      ], function (width, mss, state, grabbed) {
        // configure left to be the left parameter of the first article in the slider
        var left = state.edge === 'left' ? 0 : width; // would love to case split
        mss.map(function (ms, index) {
          if (index < state.index) {
            left -= ms.w;
          }
          if (state.edge === 'right' && index === state.index) {
            left -= ms.w;
          }
        });
        if (grabbed !== false) {
          left += grabbed;
        }
        return left;
      });

      var leftsS = stream.combine([
        allMinSizes,
        leftS,
      ], function (mss, left) {
        return mss.reduce(function (acc, ms) {
          acc.arr.push(acc.lastValue);
          acc.lastValue += ms.w;
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
        stream.onValue(i.minSize, function (ms) {
          stream.push(ctxs[index].width, ms.w);
        });
        return i;
      });
      stream.pushAll(mapMinSizes(is, ctx), allMinSizes);

      var totalMinWidthS = stream.onValue(allMinSizes, function (mss) {
        return mss.reduce(function (a, ms) {
          return a + ms.w;
        }, 0);
      });

      el.style.userSelect = 'none';
      el.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        stream.push(grabbedS, 0);
        is.map(function (i) {
          transition(i, 'left', '0s');
        });
      });

      var release = function (ev) {
        is.map(function (i) {
          transition(i, 'left ', config.leftTransition);
        });
        var mss = allMinSizes.lastValue;
        var width = ctx.width.lastValue;
        var grabbed = grabbedS.lastValue;
        if (!grabbed) {
          return;
        }
        var left = leftS.lastValue;
        // array of sums of min widths
        var edgeScrollPoints = mss.reduce(function (a, ms) {
          var last = a[a.length - 1];
          a.push(last - ms.w);
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
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseout', release);
      el.addEventListener('mousemove', function (ev) {
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
        minSize: stream.map(allMinSizes, function (mss) {
          return {
            w: mss.reduce(function (a, ms)  {
              return a + ms.w;
            }),
            h: constant(mss.map(function (ms) {
              return ms.h(ms.w);
            }).reduce(mathMax, 0)),
          }
        }),
      };
    });
  });

  var stack = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusHeight = config.surplusHeight || ignoreSurplusHeight;
    config.collapsePadding = config.collapsePadding || false;
    config.transition = config.transition || 0;
    return layout(function (el, ctx, cs) {
      el.classList.add('stack');
      if (cs.length === 0) {
        return {
          minSize: onceSizeZeroS,
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
        is.map(function (i) {
          transition(i, 'height', config.transition + 's');
          transition(i, 'top', config.transition + 's');
        });
      }
      var allMinSizes = mapMinSizes(is);
      stream.combine([
        ctx.width,
        ctx.height,
        allMinSizes,
      ], function (width, height, mss) {
        var top = 0;
        var positions = mss.map(function (ms, index) {
          var minHeight = ms.h(width);
          var position = {
            top: top,
            height: minHeight,
          };
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
        positions = config.surplusHeight(height, positions);
        positions.map(function (position, index) {
          var context = contexts[index];
          stream.push(context.top, position.top);
          stream.push(context.height, position.height);
        });
      });
      return {
        minSize: stream.map(allMinSizes, function (mss) {
          return {
            w: mss.reduce(function (a, ms) {
              return Math.max(a, ms.w);
            }, 0),
            h: function (w) {
              var mhs = mss.map(function (ms) {
                return ms.h(w);
              });
              return mhs.reduce(add, config.padding * (mhs.filter(function (x) {
                return !config.collapsePadding || x > 0;
              }).length - 1));
            },
          };
        }),
      };
    });
  });

  var stackStream = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusHeight = config.surplusHeight || ignoreSurplusHeight;
    config.transition = config.transition || 0;
    return function (actionS) {
      return container(function (el, ctx, append) {
        var mw = stream.once(0);
        var mh = stream.once(constant(0));
        var contexts = [];
        var is = [];
        var msDeleteListeners = [];
        var tryPushContexts = function () {
          var width = ctx.width.lastValue;
          var height = ctx.height.lastValue;
          var mss = [];
          is.map(function (i, index) {
            mss[index] = i.minSize.lastValue;
          });
          // if children have all provided mss, then provide mw and mh
          if (!mss.reduce(function (a, b) {
            return a && b !== undefined;
          }, true)) {
            return;
          }
          stream.push(mw, mss.reduce(function (a, ms) {
            return a + ms.w;
          }, 0));
          stream.push(mh, function (w) {
            return mss.map(function (ms) {
              return ms.h(w);
            }).reduce(add, config.padding * (is.length - 1));
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
          var positions = mss.map(function (ms) {
            idx += 1;
            var minHeight = ms.h(width);
            var position = {
              top: top + config.padding * idx,
              height: minHeight,
            };
            top += minHeight;
            return position;
          });
          positions = config.surplusHeight(height, positions);
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
            msDeleteListeners[ii+1] = msDeleteListeners[ii];
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
          msDeleteListeners[index] = stream.map(i.minSize, tryPushContexts);
          contexts[index] = context;
          is[index] = i;

          return index;
        };
        var remove = function (c) {
          var index = cs.indexOf(c);
          is[index].remove();
          msDeleteListeners[index]();
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
          minSize: stream.combine([
            mw,
            mh,
          ], function (mw, mh) {
            return {
              w: mw,
              h: mh,
            }
          }),
        };
      });
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
    return layout(function (el, ctx, c) {
      el.style.overflowX = 'auto';
      var widthS = stream.create();
      var heightS = stream.create();
      var i = c({
        width: widthS,
        height: heightS,
      });
      var minWidth;
      if (config.minWidth) {
        if (typeof config.minWidth === 'number') {
          minWidth = stream.once(config.minWidth);
        }
        if (typeof config.minWidth === 'function') {
          minWidth = stream.map(stream.prop(i.minSize, 'w'), config.minWidth);
        }
      }
      else {
        minWidth = stream.prop(i.minSize, 'w');
      }
      stream.combine([
        i.minSize,
        ctx.width,
        ctx.height,
      ], function (ms, ctxW, ctxH) {
        stream.push(widthS, Math.max(ms.w, ctxW));
        stream.push(heightS, ctxH - (ms.w > ctxW ? _scrollbarWidth() : 0));
      });
      var minHeight = stream.combine([
        i.minSize,
      ], function (ms) {
        return function (w) {
          if (ms.w > w) {
            return ms.h(w) + _scrollbarWidth();
          }
          else {
            return ms.h(w);
          }
        };
      });
      return {
        minSize: stream.combine([
          minWidth,
          minHeight,
        ], function (mw, mh) {
          return {
            w: mw,
            h: mh,
          };
        }),
      };
    });
  });

  var overflowVertical = uncurryConfig(function (config) {
    config = config || {};
    return layout(function (el, ctx, c) {
      el.style.overflowY = 'auto';
      var widthS = stream.create();
      var heightS = stream.create();
      var i = c({
        width: widthS,
        height: heightS,
      });
      var minHeight;
      if (config.hasOwnProperty('minHeight')) {
        if (typeof config.minHeight === 'number') {
          minHeight = stream.once(constant(config.minHeight));
        }
        if (typeof config.minHeight === 'function') {
          minHeight = stream.map(stream.prop(i.minSize, 'h'), config.minHeight);
        }
      }
      else {
        minHeight = stream.prop(i.minSize, 'h');
      }
      stream.combine([
        i.minSize,
        ctx.width,
        ctx.height,
      ], function (ms, ctxW, ctxH) {
        var mh = ms.h(ctxW);
        stream.push(widthS, ctxW - (mh > ctxH ? _scrollbarWidth() : 0));
        stream.push(heightS, Math.max(mh, ctxH));
      });
      var minWidth = stream.map(i.minSize, function (ms) {
        return mw + _scrollbarWidth();
      });
      return {
        minSize: stream.combine([
          minWidth,
          minHeight,
        ], function (mw, mh) {
          return {
            w: mw,
            h: mh,
          };
        }),
      };
    });
  });

  var margin = function (amount) {
    if (!amount || typeof amount === 'function') {
      throw 'Margin must be called with 1 argument.\n\n' + new Error().stack;
    }
    var top = amount.all || 0,
        bottom = amount.all || 0,
        left = amount.all || 0,
        right = amount.all || 0;

    // amount may be a single number
    if (typeof amount === 'number') {
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
    return layout(function (el, ctx, c) {
      el.classList.add('margin');
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
        minSize: stream.map(i.minSize, function (ms) {
          return {
            w: ms.w + left + right,
            h: function (w) {
              return ms.h(w - left - right) + top + bottom;
            },
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
      if (typeof amount === 'number') {
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
    return layout(function (el, ctx, c) {
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
        minSize: stream.combine([
          i.minSize,
          leftS,
          rightS,
          topS,
          bottomS,
        ], function (ms, l, r, t, b) {
          return {
            w: ms.w + l + r,
            h: function (w) {
              return ms.h(w) + t + b;
            },
          };
        }),
      };
    });
  };

  var alignLRM = function (lrm) {
    lrm = lrm || {};
    return layout(function (el, ctx, l, r, m) {
      el.classList.add('alignLRM');
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
        lI.minSize,
        rI.minSize,
        mI.minSize,
        ctx.width,
      ], function (lms, rms, mms, w) {
        stream.push(lCtx.width, Math.min(w, lms.w));
        stream.push(rCtx.width, Math.min(w, rms.w));
        stream.push(mCtx.width, Math.min(w, mms.w));
        stream.push(rCtx.left, w - Math.min(w, rms.w));
        stream.push(mCtx.left, (w - Math.min(w, mms.w)) / 2);
      });
      return {
        minSize: stream.combine([
          lI.minSize,
          rI.minSize,
          mI.minSize,
        ], function (lms, rms, mms) {
          var lmw = lms.w;
          var rmw = rms.w;
          var mmw = mms.w;
          var lmh = lms.h;
          var rmh = rms.h;
          var mmh = mms.h;
          return {
            w: (mmw > 0) ?
              mmw + 2 * Math.max(lmw, rmw) :
              lmw + rmw,
            h: function (w) {
              return [lmh(Math.min(w, lmw)), rmh(Math.min(w, rmw)), mmh(Math.min(w, mmw))].reduce(mathMax);
            },
          }
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
    return layout(function (el, ctx, t, b, m) {
      el.classList.add('alignTBM');
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
        tI.minSize,
        bI.minSize,
        mI.minSize,
        ctx.width,
        ctx.height,
      ], function (lms, rms, mms, w, h) {
        stream.push(tCtx.height, Math.min(h, lms.h(w)));
        stream.push(bCtx.height, Math.min(h, rms.h(w)));
        stream.push(mCtx.height, Math.min(h, mms.h(w)));
        stream.push(bCtx.top, Math.max(0, h - Math.min(h, rms.h(w))));
        stream.push(mCtx.top, Math.max(0, (h - Math.min(h, mms.h(w))) / 2));
      });
      return {
        minSize: stream.combine([
          tI.minSize,
          bI.minSize,
          mI.minSize,
        ], function (tms, bms, mms) {
          return {
            w: [tms.w, bms.w, mms.w].reduce(mathMax),
            h: function (w) {
              var tmh = tms.h(w);
              var bmh = bms.h(w);
              var mmh = mms.h(w);
              return (mmh > 0) ?
                mmh + 2 * Math.max(tmh, bmh) :
                tmh + bmh;
            },
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
    if (!colorS || !amount) {
      throw 'Border must be called with at least 2 arguments.\n\n' + new Error().stack;
    }
    var left = amount.left || amount.all || 0;
    var right = amount.right || amount.all || 0;
    var top = amount.top || amount.all || 0;
    var bottom = amount.bottom || amount.all || 0;
    var radius = amount.radius || 0;
    if (typeof amount === 'number') {
      top = bottom = left = right = amount;
    }
    style = style || 'solid';

    if (!stream.isStream(colorS)) {
      colorS = stream.once(colorS);
    }

    var colorStringS = stream.map(colorS, colorString);

    return layout(function (el, ctx, c) {
      var i = c({
        width: stream.map(ctx.width, function (w) {
          return w - left - right;
        }),
        widthCalc: stream.once('100% - ' + px(left + right)),
        height: stream.map(ctx.height, function (h) {
          return h - top - bottom;
        }),
        heightCalc: stream.once('100% - ' + px(top + bottom)),
        left: stream.once(left),
        top: stream.once(top),
      });
      var borderEl = document.createElement('div');
      el.append(borderEl);
      borderEl.style.borderRadius = px(radius);
      stream.map(colorStringS, function (colorString) {
        borderEl.style.borderLeft = px(left) + ' ' + style + ' ' + colorString;
        borderEl.style.borderRight = px(right) + ' ' + style + ' ' + colorString;
        borderEl.style.borderTop = px(top) + ' ' + style + ' ' + colorString;
        borderEl.style.borderBottom = px(bottom) + ' ' + style + ' ' + colorString;
      });
      borderEl.style.position = 'absolute';
      borderEl.style.width = 'calc(100% - ' + px(left + right) + ')';
      borderEl.style.height = 'calc(100% - ' + px(top + bottom) + ')';
      return {
        minSize: stream.map(i.minSize, function (ms) {
          return {
            w: ms.w + left + right,
            h: function (w) {
              return ms.h(w - left - right) + top + bottom;
            },
          };
        }),
      };
    });
  };

  var componentStream = function (cStream) {
    return container(function (el, ctx, append) {
      el.classList.add('componentStream');
      var i;
      var unpushMS;
      var minSize = stream.create();
      var iStream = stream.onValue(cStream, function (c) {
        if (i) {
          i.remove();
        }
        if (unpushMS) {
          unpushMS();
        }
        i = append(c, {
          widthCalc: stream.once('100%'),
          heightCalc: stream.once('100%'),
        }, {
          noRemove: true,
        });
        unpushMS = stream.pushAll(i.minSize, minSize);
        return i;
      });
      return {
        minSize: minSize,
        remove: function () {
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
    return container(function (el, context, append) {
      el.classList.add('component-stream-with-exit');
      var localCStream = stream.create();
      stream.pushAll(cStream, localCStream);
      var minSizeS = stream.create();
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
        i = append(c, ctx, {
          noRemove: true,
        });
        i.el.style.transition = 'inherit';
        i.el.style.display = 'none';
        el.prepend(i.el);
        stream.pushAll(i.minSize, minSizeS);
        stream.defer(function () {
          i.el.style.display = '';
          if (entrance) {
            entrance(i, ctx);
          }
        });
      };
      stream.map(localCStream, function (c) {
        instanceC(c);
      });
      return {
        minSize: minSizeS,
        remove: function () {
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
      stream.push(s, c1 || nothing);
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
    return function (s, transitionTime) {
      var open = stream.once(false);
      stream.pushAll(s, open);

      transitionTime = transitionTime || 0;

      return layout(function (el, context, c) {
        el.classList.add('modalDialog');

        var i = c({
          top: onceZeroS,
          left: onceZeroS,
          width: stream.map(windowWidth, function (ww) {
            return document.body.clientWidth;
          }),
          height: windowHeight,
        });

        el = i.el;
        el.style.zIndex = 100;
        document.body.appendChild(el);
        el.style.position = 'fixed';
        transition(i, 'opacity', transitionTime + 's');
        el.style.display = 'none';

        stream.onValue(open, function (on) {
          if (on) {
            el.style.display = '';
            setTimeout(function () {
              el.style.opacity = 1;
            }, 100);
          }
          else {
            el.style.opacity = 0;
            setTimeout(function () {
              el.style.display = 'none';
            }, transitionTime * 1000);
          }
        });

        return {
          minSize: onceSizeZeroS,
        };
      })(c);
    };
  };

  var toggleHeight = function (open) {
    return layout(function (el, ctx, c) {
      el.classList.add('toggle-height');
      el.style.overflow = 'hidden';
      var context = {
        height: stream.create(),
      };
      var i = c(context);
      stream.pushAll(stream.combine([
        i.minSize,
        ctx.width,
        ctx.height,
      ], function (ms, w, h) {
        return Math.max(h, ms.h(w));
      }), context.height);
      return {
        minSize: stream.combine([
          i.minSize,
          open,
        ], function (ms, onOff) {
          return {
            w: ms.w,
            h: function (w) {
              return onOff ? ms.h(w) : 0;
            },
          }
        }),
      };
    });
  };

  var dropdownPanel = function (source, panel, onOffS, config) {
    config = config || {};
    config.transition = config.transition || 0;
    if (!source || !panel || !onOffS) {
      console.error('dropdownPanel requires 3 arguments');
    }
    return layout(function (el, ctx, source, panel) {
      el.classList.add('dropdown-panel');
      var panelCtx = {
        height: stream.create(),
        top: stream.create(),
      };
      var panelI = panel(panelCtx);
      var sourceI = source();
      useMinHeight(panelCtx, panelI);
      stream.pushAll(ctx.height, panelCtx.top);
      return {
        minSize: stream.combine([
          panelI.minSize,
          sourceI.minSize,
        ], function (pms, sms) {
          return {
            w: Math.max(pms.w, sms.w),
            h: sms.h,
          };
        }),
      };
    })(source, layout(function (el, ctx, panel) {
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
      transition(i, 'top ', config.transition + 's');
      return {
        minSize: i.minSize,
      };
    })(panel));
  };

  // generally for headers
  var sideSlidingPanel = function (source, panel, onOffS, config) {
    config = config || {};
    config.transition = config.transition || 0;
    return layout(function (el, ctx, source, panel) {
      el.classList.add('side-sliding-panel');
      var panelCtx = {
        width: stream.create(),
        height: stream.create(),
        left: stream.create(),
        top: stream.create(),
      };
      var sourceI = source();
      var panelI = panel(panelCtx);
      useMinWidth(panelCtx, panelI);
      stream.combineInto([
        ctx.height,
        windowHeight,
        panelI.minSize,
      ], function (sh, wh, ms) {
        return Math.max(wh - sh, ms.h(ms.w));
      }, panelCtx.height);
      stream.pushAll(ctx.height, panelCtx.top);
      stream.combineInto([
        ctx.width,
        panelI.minSize,
      ], function (w, ms) {
        return w - ms.w;
      }, panelCtx.left);
      return {
        minSize: stream.combine([
          panelI.minSize,
          sourceI.minSize,
        ], function (pms, sms) {
          return {
            w: pms.w + sms.w,
            h: sms.h,
          };
        }),
      };
    })(source, layout(function (el, ctx, panel) {
      var i = panel({
        left: stream.combine([
          onOffS,
          ctx.width,
        ], function (on, w) {
          return on ? 0 : w;
        }),
      });
      transition(i, 'left ', config.transition + 's');
      return {
        minSize: i.minSize,
      };
    })(panel));
  };

  var fixedHeaderBody = uncurryConfig(function (config) {
    config = config || {};
    config.transition = config.transition || "0s";
    return layout(function (el, ctx, headerC, bodyC) {
      el.classList.add('fixed-header-body');

      var headerHeightS = stream.create();
      var bodyHeightS = stream.create();

      var bodyI = bodyC({
        top: headerHeightS,
        width: ctx.width,
        height: bodyHeightS,
        heightCalc: stream.map(headerHeightS, function (h) {
          return '100% - ' + px(h);
        }),
      });
      var headerI = headerC({
        width: ctx.width,
        height: headerHeightS,
      });

      stream.combine([
        ctx.width,
        ctx.height,
        headerI.minSize,
      ], function (w, h, ms) {
        var headerHeight = ms.h(w);
        stream.push(headerHeightS, headerHeight);
        stream.push(bodyHeightS, h - headerHeight);
      });

      headerI.el.style.position = 'fixed';

      setTimeout(function () {
        transition(headerI, 'height', config.transition);
        transition(bodyI, 'top', config.transition);
        transition(bodyI, 'height', config.transition);
      });

      return {
        minSize: stream.combine([
          bodyI.minSize,
          headerI.minSize,
        ], function (bms, hms) {
          return {
            w: bms.w + hms.w,
            h: function (w) {
              return bms.h(w) + hms.h(w);
            },
          };
        }),
      };
    });
  });

  var makeSticky = uncurryConfig(function (distanceS) {
    return layout(function (el, context, c) {
      if (typeof distanceS === 'number') {
        distanceS = stream.once(distanceS);
      }
      distanceS = distanceS || onceZeroS;

      el.classList.add('makeSticky');

      var i = c();
      stream.combine([
        windowScroll,
        distanceS,
        context.top,
        context.left,
      ], function (scroll, distance, top, left) {
        stream.defer(function () {
          if (top > scroll + distance) {
            i.el.style.position = 'absolute';
            i.el.style.top = px(0);
            i.el.style.left = px(0);
          }
          else if (top < scroll + distance) {
            var leftPosition = left;
            i.el.style.position = 'fixed';
            i.el.style.left = px(leftPosition);
            i.el.style.top = px(distance);
          }
        });
      });
      return {
        minSize: i.minSize,
      };
    });
  }, function (c) {
    return !(typeof c === 'number') && !stream.isStream(c);
  });

  var useNthMinHeight = function (n) {
    return function (cells, mss) {
      var index = Math.min(n, cells.length - 1);
      return mss[index].h(cells[index].width);
    };
  };
  var useMaxHeight = function (cells, mss) {
    return cells.reduce(function (a, cell, i) {
      return Math.max(a, mss[i].h(cell.width));
    }, 0);
  };

  var separatorUseMax = function (row1, row2) {
    var rightmostCell1 = row1.cells[row1.cells.length - 1];
    var rightmostCell2 = row2.cells[row2.cells.length - 1];
    return {
      left: Math.min(row1.cells[0].left, rows2.cells[0].left),
      right: Math.max(rightmostCell1.left + rightmostCell1.width, rightmostCell2.left + rightmostCell2.width),
    };
  };
  var separatorUseMin = function (row1, row2) {
    var rightmostCell1 = row1.cells[row1.cells.length - 1];
    var rightmostCell2 = row2.cells[row2.cells.length - 1];
    return {
      left: Math.max(row1.cells[0].left, row2.cells[0].left),
      right: Math.min(rightmostCell1.left + rightmostCell1.width, rightmostCell2.left + rightmostCell2.width),
    };
  };
  var separatorUseAverage = function (row1, row2) {
    var rightmostCell1 = row1.cells[row1.cells.length - 1];
    var rightmostCell2 = row2.cells[row2.cells.length - 1];
    return {
      left: (row1.cells[0].left + row2.cells[0].left) / 2,
      right: (rightmostCell1.left + rightmostCell1.width + rightmostCell2.left + rightmostCell2.width) / 2,
    };
  };

  var grid = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    config.surplusWidth = config.surplusWidth || ignoreSurplusWidth;
    config.surplusHeight = config.surplusHeight || ignoreSurplusHeight;
    config.rowHeight = config.rowHeight || useMaxHeight;
    config.maxPerRow = config.maxPerRow || 0;
    config.rowOrColumn = config.rowOrColumn || false;
    config.splitH = config.splitH || null; // this feature is not stable, do not use :)
    config.splitV = config.splitV || config.splitH; // this feature is not stable, do not use :)
    config.separatorWidth = config.separatorWidth || separatorUseMax;

    var totalPaddingH = config.padding + (config.splitH ? 1 + config.padding : 0);
    var totalPaddingV = config.padding + (config.splitV ? 1 + config.padding : 0);

    return function (cs) {
      return layout(function (el, ctx, cs) {
        el.classList.add('grid');
        var ds = [];
        cs = cs.map(function (c) {
          if (Array.isArray(c)) {
            ds.push(c[1]);
            return c[0];
          }
          else {
            ds.push(undefined);
            return c;
          }
        });
        if (config.splitH || config.splitV) {
          var splitHEls = cs.map(function () {
            var splitHEl = document.createElement('div');
            splitHEl.style.display = 'none';
            splitHEl.style.backgroundColor = colorString(config.splitH);
            splitHEl.style.position = 'absolute';
            splitHEl.style.width = '1px';
            el.appendChild(splitHEl);
            return splitHEl;
          });
          var splitVEls = cs.map(function () {
            var splitVEl = document.createElement('div');
            splitVEl.style.display = 'none';
            splitVEl.style.backgroundColor = colorString(config.splitV);
            splitVEl.style.position = 'absolute';
            splitVEl.style.height = '1px';
            el.appendChild(splitVEl);
            return splitVEl;
          });
        }
        var minSize = stream.create();
        if (cs.length === 0) {
          stream.push(minSize, {
            w: 0,
            h: constant(0),
          });
        }
        var cContexts = [];
        var is = cs.map(function (c) {
          var context = {
            top: stream.create(),
            left: stream.create(),
            width: stream.create(),
            height: stream.create(),
          };
          cContexts.push(context);
          return c(context);
        });
        var dContexts = [];
        var js = ds.map(function (d) {
          if (d) {
            var context = {
              top: stream.create(),
              left: stream.create(),
              width: stream.create(),
              height: stream.create(),
            };
            dContexts.push(context);
            return d(context);
          }
        });
        if (config.transition) {
          is.map(function (i) {
            transition(i, 'top', config.transition);
            transition(i, 'height', config.transition);
          });
          js.map(function (j) {
            transition(j, 'top', config.transition);
            transition(j, 'height', config.transition);
          });
          splitHEls.map(function (splitVEl) {
            splitVEl.style.transition = 'top ' + config.transition + ', height ' + config.transition;
          });
          splitVEls.map(function (splitVEl) {
            splitVEl.style.transition = 'top ' + config.transition;
          });
        }

        var cMinSizesS = stream.all(is.map(function (i) {
          return i.minSize;
        }));
        var dMinSizesS = stream.all(js.map(function (j) {
          return j ? j.minSize : onceSizeZeroS;
        }));

        var computeRows = function (gridWidth, cmss, dmss) {
          var mws = cmss.map(function (cms, i) {
            return Math.max(cms.w, dmss[i].w);
          });
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
              cContexts: [],
              dContexts: [],
              height: 0,
            };
          };

          var rowsAndCurrentRow = mws.reduce(function (a, mw, index) {
            var rows = a.rows;
            var currentRow = a.currentRow;

            var widthUsedThisRow = currentRow.cells.reduce(function (a, cell) {
              return a + cell.width + totalPaddingH;
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
            currentRow.cContexts.push(cContexts[index]);
            currentRow.dContexts.push(dContexts[index]);

            left += widthNeeded + totalPaddingH;
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
                cContexts: [cContexts[index]],
                dContexts: [dContexts[index]],
                height: 0,
              };
            });
          }

          var rowCells = rows.map(function (row) {
            return row.cells;
          });
          config.surplusWidth(gridWidth, rowCells);
          rows.map(function (row, i) {
            row.cells = rowCells[i];
          });

          return rows;
        };

        // todo: fix interaction of allSameWidth and useFullWidth
        stream.combineInto([
          cMinSizesS,
          dMinSizesS,
        ], function (cmss, dmss) {
          return {
            w: config.useFullWidth ? cmss.reduce(function (a, ms, i) {
              return a + Math.max(ms.w, dmss[i].w) + totalPaddingH;
            }, -totalPaddingH) : cmss.reduce(function (a, ms, i) {
              return Math.max(a, Math.max(ms.w, dmss[i].w));
            }, 0),
            h: function (w) {
              var rows = computeRows(w, cmss, dmss);
              var index = 0;
              var h = rows.map(function (row) {
                var ch = config.rowHeight(row.cells, cmss.slice(index, index + row.cells.length));
                var dh = config.rowHeight(row.cells, dmss.slice(index, index + row.cells.length));
                index += row.cells.length;
                return ch + dh + totalPaddingV;
              }).reduce(add, -totalPaddingV);
              return h;
            },
          };
        }, minSize);

        stream.combine([
          ctx.width,
          ctx.height,
          cMinSizesS,
          dMinSizesS,
        ], function (gridWidth, gridHeight, cmss, dmss) {
          var rows = computeRows(gridWidth, cmss, dmss);
          var index = 0;
          var top = 0;
          if (config.splitH) {
            splitHEls.map(function (splitEl) {
              updateDomStyle(splitEl, 'display', 'none');
            });
          }
          if (config.splitV) {
            splitVEls.map(function (splitEl) {
              updateDomStyle(splitEl, 'display', 'none');
            });
          }
          rows.map(function (row) {
            var cHeight = config.rowHeight(row.cells, cmss.slice(index, index + row.cells.length));
            row.dHeights = dmss.slice(index, index + row.cells.length).map(function (dms, i) {
              return dms.h(row.cells[i].width);
            });
            var dHeight = row.dHeights.reduce(mathMax, 0);
            row.height = cHeight + dHeight;
            row.dHeight = dHeight;
            index += row.cells.length;
          });
          if (config.bottomToTop) {
            rows = rows.slice(0).reverse();
          }
          rows.map(function (row) {
            row.top = top;
            top += row.height + totalPaddingV;
          });
          rows = config.surplusHeight(gridHeight, rows, config);
          var elsPositionedH = 0;
          var elsPositionedV = 0;
          rows.map(function (row, i) {
            var positions = row.cells.map(function (cell, i) {
              var position = {
                top: row.top,
                left: cell.left,
                width: cell.width,
                height: row.height,
                dTop: row.top + row.height - row.dHeight,
                dHeight: row.dHeights[i],
              };
              if (config.splitH && i > 0) {
                updateDomStyle(splitHEls[elsPositionedH], 'display', '');
                updateDomStyle(splitHEls[elsPositionedH], 'top', row.top + 'px');
                updateDomStyle(splitHEls[elsPositionedH], 'left', (cell.left - config.padding - 1) + 'px');
                updateDomStyle(splitHEls[elsPositionedH], 'height', row.height + 'px');
                elsPositionedH += 1;
              }
              return position;
            });
            if (config.splitV && i > 0) {
              updateDomStyle(splitVEls[elsPositionedV], 'display', '');
              updateDomStyle(splitVEls[elsPositionedV], 'top', (row.top - config.padding - 1) + 'px');
              var separatorWidth = config.separatorWidth(rows[i-1], rows[i]);
              updateDomStyle(splitVEls[elsPositionedV], 'left', separatorWidth.left + 'px');
              updateDomStyle(splitVEls[elsPositionedV], 'width', (separatorWidth.right - separatorWidth.left) + 'px');
              elsPositionedV += 1;
            }
            positions.map(function (position, index) {
              var cContext = row.cContexts[index];
              stream.push(cContext.top, position.top);
              stream.push(cContext.left, position.left);
              stream.push(cContext.width, position.width);
              stream.push(cContext.height, position.dTop - position.top);
              var dContext = row.dContexts[index];
              if (dContext) {
                stream.push(dContext.top, position.dTop);
                stream.push(dContext.left, position.left);
                stream.push(dContext.width, position.width);
                stream.push(dContext.height, position.dHeight);
              }
            });
          });
        });

        return {
          minSize: minSize,
        };
      })(cs);
    };
  });

  var basicFloat = uncurryConfig(function (config) {
    config = config || {};
    config.padding = config.padding || 0;
    return layout(function (el, ctx, c, cs) {
      // first context belongs to floating element c, rest to cs
      var ccs = [c].concat(cs);
      var contexts = ccs.map(function () {
        return {
          top: stream.create(),
          left: stream.create(),
          width: stream.create(),
          height: stream.create(),
        };
      });
      var iis = ccs.map(function (c, index) {
        return c(contexts[index]);
      });
      var allMinSizes = mapMinSizes(iis);
      var positionItems = function (w, mss) {
        mss = mss.slice(0);
        // shift off min size of floating element
        var ms = mss.shift();
        // size of floating element
        var floatWidth = (mss[0].w > w - ms.w - 2 * config.padding) ? w : ms.w;
        var floatHeight = ms.h(floatWidth);
        var dims = [{
          left: config.float === 'right' ? (w - floatWidth) : 0,
          top: 0,
          width: floatWidth,
          height: floatHeight,
        }];
        // smallest top-value that clears the floating item
        var topBelowFloat = floatHeight + config.padding;
        // compute dimensions of the rest of the items
        var top = 0;
        for (var i = 0; i < mss.length; i++) {
          var msi = mss[i];
          // clear the float if there is not enough width available
          if (top < topBelowFloat && msi.w > w - floatWidth - 2 * config.padding) {
            top = topBelowFloat;
          }
          var dimLeft = top < topBelowFloat ? (config.float === 'right' ? config.padding : floatWidth + config.padding) : config.padding;
          var dimTop = top;
          var dimWidth = top < topBelowFloat ? w - floatWidth - 2 * config.padding : w - 2 * config.padding;
          var dimHeight = msi.h(dimWidth);
          if (config.clearHanging && top < topBelowFloat && top + dimHeight > topBelowFloat) {
            top = topBelowFloat;
            dimLeft = config.padding;
            dimTop = top;
            dimWidth = w - 2 * config.padding;
            dimHeight = msi.h(dimWidth);
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
      stream.combine([
        ctx.width,
        allMinSizes,
      ], function (w, mss) {
        positionItems(w, mss).dims.map(function (dim, i) {
          var context = contexts[i];
          stream.push(context.left, dim.left);
          stream.push(context.top, dim.top);
          stream.push(context.width, dim.width);
          stream.push(context.height, dim.height);
        });
      });
      return {
        minSize: stream.map(allMinSizes, function (mss) {
          return {
            w: mss.reduce(function (a, ms) {
              return Math.max(a, ms.w);
            }, 0),
            h: function (w) {
              return positionItems(w, mss).totalHeight;
            },
          };
        }),
      };
    });
  });

  var withMinWidthStream = function (getMinWidthStream) {
    if (typeof getMinWidthStream === 'number') {
      return minWidth(getMinWidthStream);
    }
    return layout(function (el, ctx, c) {
      el.classList.add('withMinWidthStream');
      var i = c();
      return {
        minSize: stream.combine([
          i.minSize,
          typeof getMinWidthStream === 'function' ? getMinWidthStream(i, ctx) : getMinWidthStream,
        ], function (ms, mw) {
          return {
            w: mw,
            h: ms.h,
          };
        })
      };
    });
  };
  var minWidthAtLeast = function (number) {
    if (!stream.isStream(number)) {
      number = stream.once(number);
    }
    return withMinWidthStream(function (i) {
      return stream.combine([
        i.minSize,
        number,
      ], function (ms, x) {
        return Math.max(ms.w, x);
      });
    });
  };
  var withMinHeightStream = function (getMinHeightStream) {
    if (typeof getMinHeightStream === 'number') {
      return minHeight(getMinHeightStream);
    }
    return layout(function (el, ctx, c) {
      el.classList.add('withMinHeightStream');
      var i = c();
      return {
        minSize: stream.combine([
          i.minSize,
          typeof getMinHeightStream === 'function' ? getMinHeightStream(i, ctx) : getMinHeightStream,
        ], function (ms, mh) {
          return {
            w: ms.w,
            h: mh,
          }
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
        i.minSize,
        number,
      ], function (ms, number) {
        return function (w) {
          return Math.max(ms.h(w), number);
        };
      });
    });
  };
  var withMaxHeightStream = function (heightS) {
    return layout(function (el, ctx, c) {
      el.classList.add('maxHeightStream');
      var context = {
        height: stream.create(),
        top: stream.create(),
      };
      var i = c(context);
      stream.pushAll(stream.combine([
        i.minSize,
        ctx.width,
        ctx.height,
      ], function (ms, w, h) {
        return Math.max(h, ms.h(w));
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
        minSize: stream.combine([
          heightS,
          i.minSize,
        ], function (maxHeight, ms) {
          return {
            w: ms.w,
            h: function (w) {
              return Math.min(maxHeight, mh(w));
            },
          };
        }),
      };
    });
  };

  var largestWidthThatFits = uncurryConfig(function (config) {
    return layout(function (el, ctx, cs) {
      el.classList.add('largest-width-that-fits');
      var is = cs.map(function (c) {
        return c();
      });
      var allMinSizes = mapMinSizes(is);
      var chooseIndex = function (w, mss) {
        var index = mss.reduce(function (a, ms, index) {
          return (a === null || a.mw > w && a.mw > ms.w || a.mw < ms.w && ms.w < w) ? {
            mw: ms.w,
            index: index,
          } : a;
        }, null).index;
        return index;
      };
      stream.combine([
        ctx.width,
        allMinSizes,
      ], function (w, mss) {
        var i = chooseIndex(w, mss);
        is.map(function (instance, index) {
          instance.el.style.display = index === i ? '' : 'none';
        });
      });
      return {
        minSize: stream.map(allMinSizes, function (mss) {
          return {
            w: mss.reduce(function (a, ms) {
              return Math.max(a, ms.w);
            }, 0),
            h: function (w) {
              var i = chooseIndex(w, mss);
              return mss[i].h(w);
            },
          };
        }),
      };
    });
  });

  var overlays = uncurryConfig(function (config) {
    return layout(function (el, ctx, cs) {
      el.classList.add('overlays');
      var is = cs.map(function (c) {
        return c();
      });
      var minSizesS = mapMinSizes(is);
      return {
        minSize: stream.map(minSizesS, function (mss) {
          return {
            w: mss.reduce(function (a, ms) {
              return Math.max(a, ms.w);
            }, 0),
            h: function (w) {
              return mss.reduce(function (a, ms) {
                return Math.max(a, ms.h(w));
              }, 0);
            },
          }
        }),
      };
    });
  });

  var shareMinWidths = function () {
    var greatestMinWidth = stream.create();
    var streams = stream.combineMany(function (mss) {
      stream.push(greatestMinWidth, mss.reduce(function (a, ms) {
        return Math.max(a, ms.w);
      }, 0));
    });
    return adjustPosition(function (minSize) {
      streams.addStream(minSize);
      return stream.combine([
        minSize,
        greatestMinWidth,
      ], function (ms, gmw) {
        return {
          w: gmw,
          h: ms.h,
        };
      });
    });
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
      minWidth(size.h || size.x || 0),
      minHeight(size.v || size.y || 0),
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
        kind: 'button',
        enabledS: stream.once(true),
        name: name || '',
        onClick: onClick,
      };
    },
    checkbox: {
      kind: 'checkbox',
    },
    date: {
      kind: 'date',
    },
    // options is array of strings, or objects with name and value
    // properties
    dropdown: function (options) {
      return {
        kind: 'dropdown',
        options: options,
      };
    },
    file: {
      kind: 'file',
    },
    hidden: {
      kind: 'hidden',
    },
    image: {
      kind: 'image',
    },
    number: {
      kind: 'number',
    },
    password: {
      kind: 'password',
    },
    // options is array of objects with 'name' and 'value' properties
    radios: function (options) {
      return {
        kind: 'radios',
        options: options,
      };
    },
    text: {
      kind: 'text',
    },
    textarea: {
      kind: 'textarea',
    },
    time: {
      kind: 'time',
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
  var getFormElementMarginTop = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginTop) +
      parseFloat(style.paddingTop) +
      parseFloat(style.borderTopWidth);
  };
  var getFormElementMarginBottom = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginBottom) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderBottomWidth);
  };
  var getFormElementMarginLeft = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginLeft) +
      parseFloat(style.paddingLeft) +
      parseFloat(style.borderLeftWidth);
  };
  var getFormElementMarginRight = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginRight) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderRightWidth);
  };
  var applyFormBorder = adjustPosition(null, {
    width: function (w, el) {
      return w - getFormElementMarginLeft(el) - getFormElementMarginRight(el);
    },
    height: function (h, el) {
      return h - getFormElementMarginTop(el) - getFormElementMarginBottom(el);
    },
    widthCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginLeft(el) + getFormElementMarginRight(el));
    },
    heightCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginTop(el) + getFormElementMarginBottom(el));
    },
  });
  var applyTextareaBorder = adjustPosition(null, {
    width: function (w, el) {
      return w - getFormElementMarginLeft(el) - getFormElementMarginRight(el);
    },
    height: function (h, el) {
      return h - getFormElementMarginTop(el) - getFormElementMarginBottom(el);
    },
    widthCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginLeft(el) + getFormElementMarginRight(el));
    },
    heightCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginTop(el) + getFormElementMarginBottom(el));
    },
  });
  var applyCheckboxBorder = adjustPosition(null, {
    width: function (w, el) {
      return w - getFormElementMarginLeft(el) - getFormElementMarginRight(el);
    },
    height: function (h, el) {
      return h - getFormElementMarginTop(el) - getFormElementMarginBottom(el);
    },
    widthCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginLeft(el) + getFormElementMarginRight(el));
    },
    heightCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginTop(el) + getFormElementMarginBottom(el));
    },
  });
  var applyRadioBorder = adjustPosition(null, {
    width: function (w, el) {
      return w - getFormElementMarginLeft(el) - getFormElementMarginRight(el);
    },
    height: function (h, el) {
      return h - getFormElementMarginTop(el) - getFormElementMarginBottom(el);
    },
    widthCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginLeft(el) + getFormElementMarginRight(el));
    },
    heightCalc: function (calc, el) {
      return calc + " - " + (getFormElementMarginTop(el) + getFormElementMarginBottom(el));
    },
  });
  var formComponentObj = {
    button: function (def) {
      var t = def.type;
      var s = def.stream || stream.create();
      return all([
        and(function (i) {
          stream.map(t.enabledS, function (enabled) {
            i.el.disabled = !enabled;
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
      }, {
        el: button,
        measureWidth: true,
      }));
    },
    checkbox: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyCheckboxBorder,
      ])(input(function (el, ctx, mw) {
        el.id = k;
        el.name = k;
        el.type = 'checkbox';
        stream.onValue(s, function (v) {
          el.checked = v ? 'checked' : '';
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.checked);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.checked);
        });
        mw();
      }));
    },
    date: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw) {
        mw();
        el.name = k;
        el.type = 'date';
        stream.onValue(s, function (v) {
          // this if-statement not tested
          if ((v && v.getTime()) !== (el.value && parseDateInputValue(el.value).getTime())) {
            el.value = stringifyDateInputValue(v);
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, parseDateInputValue(el.value));
        });
        el.addEventListener('change', function () {
          stream.push(s, parseDateInputValue(el.value));
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
      }));
    },
    dropdown: function (def) {
      var k = def.name;
      var type = def.type;
      var s = def.stream || stream.create();
      return select(function (el, ctx, mw) {
        el.name = k;
        type.options.map(function (option) {
          if ('string' === typeof option) {
            option = {
              name: option,
              value: option,
            };
          }
          var optionEl = document.createElement('option');
          optionEl.innerHTML = option.name;
          optionEl.value = option.value;
          el.appendChild(optionEl);
        });
        if (!s.lastValue) {
          stream.push(s, el.value);
        }
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        mw();
      });
    },
    file: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return input(function (el, ctx, mw) {
        el.name = k;
        el.type = 'file';
        mw();
        el.addEventListener('change', function (ev) {
          mw();
          stream.push(s, ev.target.files);
        });
      });
    },
    hidden: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return input(function (el) {
        el.name = k;
        el.type = 'hidden';
        stream.onValue(s, function (v) {
          el.value = v;
        });
        return {
          minSize: onceSizeZeroS,
        };
      });
    },
    image: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return input(function (el, ctx, mw) {
        el.name = k;
        el.type = 'file';
        el.accept = 'image/*';
        mw();
        el.addEventListener('change', function (ev) {
          mw();
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
    number: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw) {
        mw();
        if (def.hasOwnProperty('step')) {
          el.step = def.step;
        }
        el.name = k;
        el.type = 'number';
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
      }));
    },
    password: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw) {
        mw();
        el.name = k;
        el.type = 'password';
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
      }));
    },
    radios: function (def) {
      var k = def.name;
      var type = def.type;
      var s = def.stream || stream.create();
      return type.options.map(function (option) {
        return all([
          applyRadioBorder,
        ])(input(function (el, ctx, mw) {
          el.id = option;
          el.value = option;
          el.name = k;
          el.type = 'radio';
          stream.onValue(s, function (v) {
            el.checked = v === option ? 'checked' : '';
          });
          el.addEventListener('change', function () {
            if (el.checked) {
              stream.push(s, option);
            }
          });
          mw();
        }));
      });
    },
    text: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw) {
        mw();
        el.name = k;
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
      }));
    },
    textarea: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyTextareaBorder,
      ])(textarea(function (el, ctx) {
        el.name = k;
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
        var lastOuterWidth = outerWidth(el);
        var lastOuterHeight = outerHeight(el);
        var ms = stream.once({
          w: lastOuterWidth,
          h: constant(lastOuterHeight),
        });
        var afterTextareaResize = function () {
          stream.defer(function () {
            el.style.width = 'calc(' + (ctx.widthCalc ? ctx.widthCalc.lastValue : px(ctx.width.lastValue)) + ')';
            el.style.height = 'calc(' + (ctx.heightCalc ? ctx.heightCalc.lastValue : px(ctx.height.lastValue)) + ')';
          });
        };
        var onTextareaResize = function () {
          var currentOuterWidth = outerWidth(el);
          var currentOuterHeight = outerHeight(el);
          if (lastOuterWidth !== currentOuterWidth || lastOuterHeight !== currentOuterHeight) {
            stream.push(ms, {
              w: currentOuterWidth,
              h: constant(currentOuterHeight)
            });
            lastOuterWidth = currentOuterWidth;
            lastOuterHeight = currentOuterHeight;
          }
        };
        document.body.addEventListener('mousemove', onTextareaResize);
        document.body.addEventListener('mouseup', afterTextareaResize);
        el.addEventListener('click', onTextareaResize);
        return {
          minSize: ms,
          remove: function () {
            document.body.removeEventListener('mousemove', onTextareaResize);
            document.body.removeEventListener('mouseup', afterTextareaResize);
          },
        };
      }));
    },
    time: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw) {
        mw();
        el.name = k;
        el.type = 'time';
        stream.onValue(s, function (v) {
          if (v !== el.value) {
            el.value = v;
          }
        });
        el.addEventListener('blur', function () {
          // added blur as a trigger after autocomplete
          stream.push(s, el.value);
        });
        el.addEventListener('change', function () {
          stream.push(s, el.value);
        });
        el.addEventListener('keyup', function () {
          stream.push(s, el.value);
        });
      }));
    },
  };
  var formComponent = function (def) {
    return formComponentObj[def.type.kind](def);
  };
  for (var key in formComponentObj) {
    // For backward compatibility between v0.2.1 and v0.2.  Can be
    // removed in v0.3.
    if (formComponentObj.hasOwnProperty(key)) {
      formComponent[key] = formComponentObj[key];
    }
  }
  var buttonInput = constant(all([
    minWidth(150),
  ]));
  var textInput = function (field, labelText, validationText) {
    return function (c) {
      return stack([
        field.label ? (labelText || text)(field.label) : nothing,
        alignHLeft(c),
        (validationText || function (strS) {
          return text({
            str: strS,
          });
        })(field.validationMessageS),
      ]);
    };
  };
  var textareaInput = function (field) {
    return all([
      textInput(field),
      minHeightAtLeast(100),
    ]);
  };
  var imageInput = function (field, labelText, validationText) {
    return function (c) {
      return stack([
        field.label ? (labelText || text)(field.label) : nothing,
        alignHLeft(c),
        componentStream(stream.map(field.stream, function (v) {
          return v ? all([
            keepAspectRatio({
              fill: true,
            }),
            minWidth(0),
          ])(image({
            src: v,
          })) : nothing;
        })),
        (validationText || function (strS) {
          return text({
            str: strS,
          });
        })(field.validationMessageS),
      ]);
    };
  };
  var formStyle = {
    button: buttonInput,
    checkbox: textInput,
    date: textInput,
    dropdown: textInput,
    file: textInput,
    hidden: constant(id),
    image: imageInput,
    number: textInput,
    password: textInput,
    radios: textInput,
    text: textInput,
    textarea: textInput,
    time: textInput,
  };
  var defaultStyle = function (formStyle, labelText, validationText) {
    // todo: labelText, validationText should just be arguments
    // instead
    return function (field) {
      return formStyle[field.type.kind](field, labelText, validationText);
    };
  };

  var formFor = function (formComponent, style, customSubmitComponentF) {
    var renderForm = function (mkOnSubmit, fields, f) {
      var fieldStreams = {};
      var fieldInputs = {};
      var validSs = [];
      Object.keys(fields).map(function (name) {
        var field = fields[name];
        field.name = name;
        field.stream = (field.default !== undefined) ? stream.once(field.default) : stream.create();
        fieldStreams[name] = field.stream;
        field.validateS = field.validate ? field.validate(field.stream, fieldStreams) : stream.once('');
        field.validationMessageS = stream.map(field.validateS, function (validate) {
          if (!validate) {
            return '';
          }
          if (typeof validate === 'object') {
            return validate.message || '';
          }
          return validate;
        });
        field.isValidS = stream.map(field.validateS, function (validate) {
          if (!validate) {
            return true;
          }
          if (typeof validate === 'object') {
            return validate.valid;
          }
          return validate.length === 0;
        });
        validSs.push(field.isValidS);
        fieldInputs[name] = style(field)(formComponent[field.type.kind](field));
      });
      var allFieldsValidS = stream.map(stream.all(validSs), function (vs) {
        return vs.reduce(function (a, v) {
          return a && v;
        }, true);
      });
      var submittingS = stream.once(false);
      var disabledS = stream.combine([
        allFieldsValidS,
        submittingS,
      ], function (allFieldsValid, submitting) {
        return !allFieldsValid || submitting;
      });
      var submitComponentF = customSubmitComponentF ? function (name) {
        return customSubmitComponentF(name, disabledS);
      } :  function (name) {
        return all([
          and(function (i) {
            stream.map(disabledS, function (disabled) {
              i.el.disabled = disabled;
            });
          }),
        ])(text({
          el: button,
          measureWidth: true,
        }, {
          str: name,
        }));
      };
      var submitting = function () {
        stream.push(submittingS, true);
        return function () {
          stream.push(submittingS, false);
        };
      };
      if (typeof mkOnSubmit === 'function') {
        var setupFormSubmit = function (el) {
          el.addEventListener('submit', function (ev) {
            mkOnSubmit(ev, submitting(), fieldStreams);
          });
        };
      }
      else {
        var setupFormSubmit = function (el) {
          el.method = mkOnSubmit.method;
          el.action = mkOnSubmit.action;
        };
      }
      return layout('form', function (el, ctx, c) {
        setupFormSubmit(el);
        var i = c();
        return {
          minSize: i.minSize,
        };
      })(f(fieldInputs, submitComponentF, fieldStreams));
    };
    return function (mkOnSubmit, fields, f) {
      if (!f) {
        return function (f) {
          return renderForm(mkOnSubmit, fields, f);
        };
      }
      return renderForm(mkOnSubmit, fields, f);
    };
  };

  var hcj = {
    color: {
      color: color,
      create: color,
      toString: colorString,
    },
    component: {
      adjustPosition: adjustPosition,
      alignH: alignLRM,
      alignHorizontal: alignLRM,
      alignHL: alignHLeft,
      alignHLeft: alignHLeft,
      alignHM: alignHMiddle,
      alignHMiddle: alignHMiddle,
      alignHR: alignHRight,
      alignHRight: alignHRight,
      alignLRM: alignLRM,
      alignMiddle: alignMiddle,
      alignTBM: alignTBM,
      alignV: alignTBM,
      alignVertical: alignTBM,
      alignVB: alignVBottom,
      alignVBottom: alignVBottom,
      alignVM: alignVMiddle,
      alignVMiddle: alignVMiddle,
      alignVT: alignVTop,
      alignVTop: alignVTop,
      all: all,
      and: and,
      backgroundColor: backgroundColor,
      barH: bar.h,
      barV: bar.v,
      basicFloat: basicFloat,
      border: border,
      box: rectangle,
      changeThis: changeThis,
      clickThis: clickThis,
      component: component,
      componentStream: componentStream,
      compose: all,
      container: container,
      crop: crop,
      css: css,
      cssStream: cssStream,
      dimensions: withDimensions,
      dropdownPanel: dropdownPanel,
      empty: empty,
      fadeIn: fadeIn,
      fixedHeaderBody: fixedHeaderBody,
      grid: grid,
      hoverThis: hoverThis,
      hoverStream: hoverStream,
      keepAspectRatio: keepAspectRatio,
      keydownThis: keydownThis,
      keyupThis: keyupThis,
      image: image,
      largestWidthThatFits: largestWidthThatFits,
      layout: layout,
      link: link,
      linkTo: linkTo,
      makeSticky: makeSticky,
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
      overflowVertical: overflowVertical,
      overlays: overlays,
      padding: margin,
      passthrough: passthrough,
      promiseComponent: promiseComponent,
      scope: scope,
      shareMinWidths: shareMinWidths,
      sideBySide: sideBySide,
      sideSlidingPanel: sideSlidingPanel,
      slideIn: slideIn,
      slider: slider,
      slideshow: slideshow,
      stack: stack,
      stream: cStream,
      streams: cStreams,
      submitThis: submitThis,
      text: text,
      toggleHeight: toggleHeight,
      transition: andTransition,
      wrap: wrap,
    },
    displayedS: displayedS,
    // Remember, elements are not components.  This is why they are
    // under 'el' and not 'component'.  If you want an empty
    // component, use 'c.empty'.
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
      defaultStyle: defaultStyle,
      formComponent: formComponentObj,
      formFor: formFor,
      formStyle: formStyle,
      fieldType: fieldType,
    },
    funcs: {
      constant: constant,
      extend: extend,
      id: id,
      rowHeight: {
        useMaxHeight: useMaxHeight,
        useNthMinHeight: useNthMinHeight,
      },
      separatorWidth: {
        useAverage: separatorUseAverage,
        useMax: separatorUseMax,
        useMin: separatorUseMin,
      },
      surplusWidth: {
        ignore: ignoreSurplusWidth,
        center: centerSurplusWidth,
        centerFirstRowThenAlignLeft: centerFirstRowThenAlignLeftSurplusWidth,
        centerLargestRowThenAlignLeft: centerLargestRowThenAlignLeftSurplusWidth,
        evenlySplit: evenlySplitSurplusWidth,
        evenlySplitCenter: evenlySplitCenterSurplusWidth,
        evenSplit: evenlySplitSurplusWidth,
        evenSplitCenter: evenlySplitCenterSurplusWidth,
        justify: justifySurplusWidth,
        justifyAndCenter: justifyAndCenterSurplusWidth,
        giveToNth: giveToNth,
        eachRow: mapSurplusWidthFunc,
      },
      surplusHeight: {
        ignore: ignoreSurplusHeight,
        center: centerSurplusHeight,
        evenSplit: evenlySplitSurplusHeight,
        giveToNth: giveHeightToNth,
      },
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
    stream: stream,
    transition: transition,
    unit: {
      px: px,
    },
    viewport: {
      fullWidthS: windowWidth,
      heightS: windowHeight,
      scrollS: windowScroll,
      widthS: windowWidthMinusScrollbar,
    },
  };

  window.hcj = hcj;
})();
