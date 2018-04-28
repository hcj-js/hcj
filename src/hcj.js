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
  updateWindowWidth();
  updateWindowHeight();
  window.addEventListener('resize', function () {
    updateWindowWidth();
    updateWindowHeight();
  });
  var windowWidthMinusScrollbar = stream.create();

  var windowScroll = stream.create(true);
  window.addEventListener('scroll', function () {
    stream.push(windowScroll, window.scrollY);
  });
  stream.push(windowScroll, window.scrollY);

  var windowHash = stream.create(true);
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
    var buildResult = build(el, context, function (config) {
      var w = measureWidth(el, config);
      if (instance.minWidth) {
        stream.push(instance.minWidth, w);
      }
      else {
        instance.initialMinWidth = w;
      }
    }, function (config) {
      var h = measureHeight(el, config);
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
  var layoutAppend = function (childInstances, el, context, c, ctx, noRemove) {
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
    if (noRemove !== true) {
      childInstances.push(i);
    }
    // todo: replace with some isInstance function
    if (!i || !i.minWidth || !i.minHeight) {
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
    return function (ctx, noRemove) {
      return layoutAppend(childInstances, el, context, cs, ctx, noRemove);
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
          minWidth: i.minWidth,
          minHeight: i.minHeight,
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
      var i = buildContainer(el, context, function (c, ctx, noRemove) {
        return layoutAppend(childInstances, el, context, c, ctx, noRemove);
      });
      return {
        el: el,
        minWidth: i.minWidth,
        minHeight: i.minHeight,
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
    return i;
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
    var minHeight = stream.create();
    stream.combine([
      windowWidth,
      windowHeight,
      minHeight,
    ], function (ww, wh, mh) {
      var mhAtWW = mh(ww);
      var mhAtScrollbarWW = mh(ww - scrollbarWidth);
      var componentMinWidth;
      var componentMinHeight;
      if (mhAtWW > wh) {
        componentMinWidth = ww - scrollbarWidth;
        componentMinHeight = mhAtScrollbarWW;
        if (mhAtScrollbarWW > wh) {
          document.body.style.overflowY = 'initial';
        }
        else {
          document.body.style.overflowY = 'scroll';
        }
      }
      else {
        componentMinWidth = ww;
        componentMinHeight = mhAtWW;
        document.body.style.overflowY = 'initial';
      }
      stream.push(widthS, componentMinWidth);
      stream.push(windowWidthMinusScrollbar, componentMinWidth);
      stream.push(heightS, Math.max(wh, componentMinHeight));
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
    stream.pushAll(i.minHeight, minHeight);
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
    return layout(function (el, ctx, c) {
      el.classList.add('minWidth');
      var i = c();
      return {
        minWidth: stream.once(mw),
        minHeight: i.minHeight,
      };
    });
  };
  var minHeight = function (mh) {
    return layout(function (el, ctx, c) {
      el.classList.add('minHeight');
      var i = c();
      return {
        minWidth: i.minWidth,
        minHeight: stream.once(constant(mh)),
      };
    });
  };
  var withDimensions = function (mw, mh) {
    return layout(function (el, ctx, c) {
      el.classList.add('withDimensions');
      var i = c();
      return {
        minWidth: stream.once(mw),
        minHeight: stream.once(constant(mh)),
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
    minSize = minSize || {};
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
        minWidth: minSize.minWidth ? stream.map(i.minWidth, function (mw) {
          return minSize.minWidth(mw, el.firstChild);
        }) : i.minWidth,
        minHeight: minSize.minHeight ? stream.map(i.minHeight, function (mh) {
          return minSize.minHeight(mh, el.firstChild);
        }) : i.minHeight,
      };
    });
  };

  var adjustMinSize = uncurryConfig(function (config) {
    return layout(function (el, ctx, c) {
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
      deprecate("BackgroundColorConfig 'background', 'font', 'backgroundHover', and 'fontHover' properties as streams.  Your BackgroundColorConfig must instead be a stream of objects.");
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
        i.minWidth,
        i.minHeight,
        ctx.width,
        ctx.height,
        config.fill,
      ], function (mw, mh, w, h, fill) {
        var ar = aspectRatio(mw, mh(mw));
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
          return w / aspectRatio(mw, mh(mw));
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
    return img(function (el, ctx) {
      var minWidth = stream.create();
      var minHeight = stream.create();
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
        minWidth: onceZeroS,
        minHeight: onceConstantZeroS,
      };
    });
  };
  var nothing = empty("div");

  var once300S = stream.once(300);
  var bodyStyle = getComputedStyle(document.body);
  var bodyFontSize = bodyStyle.fontSize;
  var bodyLineHeight = bodyStyle.lineHeight;
  var bodyFontFamily = bodyStyle.fontFamily;
  var text = uncurryConfig(function (config) {
    // config2 is present in v0.2.1 for backward compatibility, it may
    // be removed in a future version
    return function (strs, config2) {
      strs = strs || '';
      if (!Array.isArray(strs)) {
        strs = [strs];
      }
      if (config2) {
        deprecate('hcj.component.text taking TextConfig second.  Optional TextConfig is now the first argument.');
      }
      config = config || config2 || {};
      if (Array.isArray(config)) {
        config = config.reduce(extend, {});
      }

      return (config.el || div)(function (el, ctx) {
        var removed = false;

        var didMH = false;
        var mwS = (config.hasOwnProperty('minWidth') ||
                   config.measureWidth)
            ? stream.create()
            : once300S;
        var mhS = stream.create();
        var spanStreams = [];
        el.classList.add('text');
        var firstPush = true;
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
            if (mw !== null) {
              stream.push(mwS, mw);
            }
            if (config.oneLine || config.approximateHeight) {
              stream.push(mhS, mh);
            }
            firstPush = false;
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
          var fontStyle = 'normal';
          var fontVariant = 'normal';
          var fontWeight = c.weight || config.weight || 'normal';
          var fontSize = c.size || config.size || bodyFontSize;
          var lineHeight = c.lineHeight || config.lineHeight || bodyLineHeight;
          var fontFamily = c.family || config.family || bodyFontFamily;

          // for measuring span size via html5 canvas:
          c.font = [
            fontStyle,
            fontVariant,
            fontWeight,
            fontSize + '/' + lineHeight,
            fontFamily,
          ].join(' ');

          if (c.size) {
            if (stream.isStream(c.size)) {
              spanStreams.push(stream.map(c.size, function (x) {
                span.style.fontSize = x;
                pushDimensions();
              }));
            }
            else {
              span.style.fontSize = c.size;
            }
          }
          if (c.style) {
            if (stream.isStream(c.style)) {
              spanStreams.push(stream.map(c.style, function (x) {
                span.style.fontStyle = x;
                pushDimensions();
              }));
            }
            else {
              span.style.fontStyle = c.style;
            }
          }
          if (c.weight) {
            if (stream.isStream(c.weight)) {
              spanStreams.push(stream.map(c.weight, function (x) {
                span.style.fontWeight = x;
                pushDimensions();
              }));
            }
            else {
              span.style.fontWeight = c.weight;
            }
          }
          if (c.family) {
            if (stream.isStream(c.family)) {
              spanStreams.push(stream.map(c.family, function (x) {
                span.style.fontFamily = x;
                pushDimensions();
              }));
            }
            else {
              span.style.fontFamily = c.family;
            }
          }
          if (c.color) {
            if (stream.isStream(c.color)) {
              spanStreams.push(stream.map(c.color, function (x) {
                span.style.color = colorString(x);
                pushDimensions();
              }));
            }
            else {
              span.style.color = colorString(c.color);
            }
          }
          if (c.shadow) {
            if (stream.isStream(c.shadow)) {
              spanStreams.push(stream.map(c.shadow, function (x) {
                span.style.textShadow = x;
                pushDimensions();
              }));
            }
            else {
              span.style.textShadow = c.shadow;
            }
          }
          if (c.verticalAlign) {
            if (stream.isStream(c.verticalAlign)) {
              spanStreams.push(stream.map(c.verticalAlign, function (x) {
                span.style.verticalAlign = x;
                pushDimensions();
              }));
            }
            else {
              span.style.verticalAlign = c.verticalAlign;
            }
          }
          if (c.spanCSS) {
            c.spanCSS.map(function (css) {
              span.style[css.name] = css.value;
            });
          }
          if (c.lineHeight) {
            if (stream.isStream(c.lineHeight)) {
              spanStreams.push(stream.map(c.lineHeight, function (x) {
                span.style.lineHeight = x;
                pushDimensions();
              }));
            }
            else {
              span.style.lineHeight = c.lineHeight;
            }
          }
          if (c.linkTo) {
            var a = document.createElement('a');
            a.href = c.linkTo;
            el.appendChild(a);
            a.appendChild(span);
          }
          else {
            el.appendChild(span);
          }
        });
        if (spanStreams.length > 0) {
          stream.combine(spanStreams, function () {
            pushDimensions();
          });
        }
        if (config.size) {
          if (stream.isStream(config.size)) {
            stream.map(config.size, function (size) {
              el.style.fontSize = size;
              pushDimensions();
            });
          }
          else {
            el.style.fontSize = config.size;
          }
        }
        if (config.style) {
          if (stream.isStream(config.style)) {
            stream.map(config.style, function (style) {
              el.style.fontStyle = style;
              pushDimensions();
            });
          }
          else {
            el.style.fontStyle = config.style;
          }
        }
        if (config.weight) {
          if (stream.isStream(config.weight)) {
            stream.map(config.weight, function (weight) {
              el.style.fontWeight = weight;
              pushDimensions();
            });
          }
          else {
            el.style.fontWeight = config.weight;
          }
        }
        if (config.family) {
          if (stream.isStream(config.family)) {
            stream.map(config.family, function (family) {
              el.style.fontFamily = family;
              pushDimensions();
            });
          }
          else {
            el.style.fontFamily = config.family;
          }
        }
        if (config.color) {
          if (stream.isStream(config.color)) {
            stream.map(config.color, function (color) {
              el.style.color = colorString(color);
              pushDimensions();
            });
          }
          else {
            el.style.color = colorString(config.color);
          }
        }
        if (config.shadow) {
          if (stream.isStream(config.shadow)) {
            stream.map(config.shadow, function (shadow) {
              el.style.textShadow = shadow;
              pushDimensions();
            });
          }
          else {
            el.style.textShadow = config.shadow;
          }
        }
        if (config.align) {
          if (stream.isStream(config.align)) {
            stream.map(config.align, function (align) {
              el.style.textAlign = align;
              pushDimensions();
            });
          }
          else {
            el.style.textAlign = config.align;
          }
        }
        if (config.verticalAlign) {
          if (stream.isStream(config.verticalAlign)) {
            spanStreams.push(stream.map(config.verticalAlign, function (x) {
              el.style.verticalAlign = x;
            }));
          }
          else {
            el.style.verticalAlign = config.verticalAlign;
          }
        }
        if (config.spanCSS) {
          config.spanCSS.map(function (css) {
            el.style[css.name] = css.value;
          });
        }
        if (config.lineHeight) {
          if (stream.isStream(config.lineHeight)) {
            spanStreams.push(stream.map(c.lineHeight, function (x) {
              el.style.lineHeight = x;
            }));
          }
          else {
            el.style.lineHeight = config.lineHeight;
          }
        }

        pushDimensions();

        return {
          minWidth: mwS,
          minHeight: mhS,
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
    if (config.surplusWidthFunc) {
      deprecate('surplusWidthFunc property of SideBySideConfig.  Now called surplusWidth.')
    }
    config.surplusWidth = config.surplusWidth || config.surplusWidthFunc || ignoreSurplusWidth;
    return layout(function (el, ctx, cs) {
      el.classList.add('sideBySide');
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
        positions = config.surplusWidth(width, [positions])[0];
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
        minWidth: i.minWidth,
        minHeight: i.minHeight,
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
    return layout(function (el, ctx, cs) {
      el.classList.add('slider')
      el.style.overflowX = 'hidden';
      el.style.cursor = 'move';

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
        stream.pushAll(i.minWidth, ctxs[index].width);
        return i;
      });
      stream.pushAll(mapMinWidths(is, ctx), allMinWidths);
      stream.pushAll(mapMinHeights(is, ctx), allMinHeights);

      var totalMinWidthS = stream.map(allMinWidths, function (mws) {
        return mws.reduce(add, 0);
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
    if (config.surplusHeightFunc) {
      deprecate('surplusHeightFunc property of StackConfig.  Now called surplusHeight.')
    }
    config.surplusHeight = config.surplusHeight || config.surplusHeightFunc || ignoreSurplusHeight;
    config.collapsePadding = config.collapsePadding || false;
    config.transition = config.transition || 0;
    return layout(function (el, ctx, cs) {
      el.classList.add('stack');
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
        is.map(function (i) {
          transition(i, 'height', config.transition + 's');
          transition(i, 'top', config.transition + 's');
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
          var minHeight = mh(width);
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
    if (config.surplusHeightFunc) {
      deprecate('surplusHeightFunc property of StackStreamConfig.  Now called surplusHeight.')
    }
    config.surplusHeight = config.surplusHeight || config.surplusHeightFunc || ignoreSurplusHeight;
    config.transition = config.transition || 0;
    return function (actionS) {
      return container(function (el, ctx, append) {
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
            var minHeight = mh(width);
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
          minHeight = stream.map(i.minHeight, config.minHeight);
        }
      }
      else {
        minHeight = i.minHeight;
      }
      stream.combine([
        i.minHeight,
        ctx.width,
        ctx.height,
      ], function (mhF, ctxW, ctxH) {
        var mh = mhF(ctxW);
        stream.push(widthS, ctxW - (mh > ctxH ? _scrollbarWidth() : 0));
        stream.push(heightS, Math.max(mh, ctxH));
      });
      var minWidth = stream.map(i.minWidth, function (mw) {
        return mw + _scrollbarWidth();
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
        lI.minWidth,
        rI.minWidth,
        mI.minWidth,
        ctx.width,
      ], function (lmw, rmw, mmw, w) {
        stream.push(lCtx.width, Math.min(w, lmw));
        stream.push(rCtx.width, Math.min(w, rmw));
        stream.push(mCtx.width, Math.min(w, mmw));
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
        tI.minHeight,
        bI.minHeight,
        mI.minHeight,
        ctx.width,
        ctx.height,
      ], function (lmh, rmh, mmh, w, h) {
        stream.push(tCtx.height, Math.min(h, lmh(w)));
        stream.push(bCtx.height, Math.min(h, rmh(w)));
        stream.push(mCtx.height, Math.min(h, mmh(w)));
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
    if (typeof amount === 'number') {
      top = bottom = left = right = amount;
    }
    style = style || 'solid';

    if (!stream.isStream(colorS)) {
      colorS = stream.once(colorS);
    }

    var colorStringS = stream.map(colorS, colorString);

    var borderLayout = layout(function (el, ctx, c) {
      el.classList.add('border');
      // overflow hidden is necessary to prevent cutting off corners
      // of border if there is a border radius
      var i = c();
      el.style.borderRadius = px(radius);
      stream.map(colorStringS, function (colorString) {
        el.style.borderLeft = px(left) + ' ' + style + ' ' + colorString;
        el.style.borderRight = px(right) + ' ' + style + ' ' + colorString;
        el.style.borderTop = px(top) + ' ' + style + ' ' + colorString;
        el.style.borderBottom = px(bottom) + ' ' + style + ' ' + colorString;
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
          width: function (w, el) {
            return w - left - right;
          },
          height: function (h, el) {
            return h - top - bottom;
          },
          widthCalc: function (calc, el) {
            return calc + " - " + (left + right);
          },
          heightCalc: function (calc, el) {
            return calc + " - " + (top + bottom);
          },
        }),
      ])(borderLayout(c));
    };
  };

  var componentStream = function (cStream) {
    return container(function (el, ctx, append) {
      el.classList.add('componentStream');
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
        i.el.style.transition = 'inherit';
        i.el.style.display = 'none';
        el.prepend(i.el);
        stream.pushAll(i.minWidth, minWidthS);
        stream.pushAll(i.minHeight, minHeightS);
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
        minWidth: minWidthS,
        minHeight: minHeightS,
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
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
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
        i.minHeight,
        ctx.width,
        ctx.height,
      ], function (mh, w, h) {
        return Math.max(h, mh(w));
      }), context.height);
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
        minWidth: stream.map(stream.combine([
          panelI.minWidth,
          sourceI.minWidth,
        ], Math.max), function (mw) {
          return mw;
        }),
        minHeight: sourceI.minHeight,
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
        minWidth: i.minWidth,
        minHeight: i.minHeight,
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
        minWidth: i.minWidth,
        minHeight: i.minHeight,
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
        headerI.minHeight,
      ], function (w, h, mh) {
        var headerHeight = mh(w);
        stream.push(headerHeightS, headerHeight);
        stream.push(bodyHeightS, h - headerHeight);
      });

      headerI.el.style.position = 'fixed';

      setTimeout(function () {
        transition(headerI, 'height', config.transition);
        transition(bodyI, 'top', config.transition);
      });

      return {
        minWidth: stream.combine([bodyI, headerI].map(function (i) {
          return i.minWidth;
        }), function (hw, bw) {
          return hw + bw;
        }),
        minHeight: stream.combine([bodyI, headerI].map(function (i) {
          return i.minHeight;
        }), function (hh, bh) {
          return function (w) {
            return hh(w) + bh(w);
          };
        }),
      };
    });
  });

  var makeSticky = uncurryConfig(function (str) {
    return layout(function (el, context, c) {
      if (typeof str === 'number') {
        str = stream.once(str);
      }
      str = str || onceZeroS;

      el.classList.add('makeSticky');

      var ctx = {
        widthCalc: stream.once('100%'),
        heightCalc: stream.once('100%'),
      };
      var i = c(ctx);
      stream.combine([
        windowScroll,
        str,
        context.top,
        context.left,
      ], function (scroll, diffAmount, top, left) {
        stream.defer(function () {
          if (top > scroll + diffAmount) {
            i.el.style.position = 'absolute';
            i.el.style.transition = '';
            i.el.style.top = px(0);
            i.el.style.left = px(0);
          }
          else if (top < scroll + diffAmount) {
            var leftPosition = left;
            i.el.style.position = 'fixed';
            i.el.style.left = px(leftPosition);
            i.el.style.top = px(diffAmount);
            setTimeout(function () {
              i.el.style.transition = 'inherit';
            }, 20);
          }
        });
      });
      return {
        minWidth: i.minWidth,
        minHeight: i.minHeight,
      };
    });
  }, function (c) {
    return !(typeof c === 'number') && !stream.isStream(c);
  });

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
    if (config.surplusWidthFunc) {
      deprecate('surplusWidthFunc property of GridConfig.  Now called surplusWidth.')
    }
    config.surplusWidth = config.surplusWidth || config.surplusWidthFunc || ignoreSurplusWidth;
    if (config.surplusHeightFunc) {
      deprecate('surplusHeightFunc property of GridConfig.  Now called surplusHeight.')
    }
    config.surplusHeight = config.surplusHeight || config.surplusHeightFunc || ignoreSurplusHeight;
    config.rowHeight = config.rowHeight || useMaxHeight;
    config.maxPerRow = config.maxPerRow || 0;
    config.rowOrColumn = config.rowOrColumn || false;
    config.splitH = config.splitH || null; // this feature is not stable, do not use :)
    config.splitV = config.splitV || config.splitH; // this feature is not stable, do not use :)

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
        var minWidth = stream.create();
        var minHeight = stream.create();
        if (cs.length === 0) {
          stream.push(minWidth, 0);
          stream.push(minHeight, constant(0));
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

        var cMinWidthsS = stream.combine(is.map(function (i) {
          return i.minWidth;
        }), function () {
          return Array.prototype.slice.call(arguments);
        });
        var cMinHeightsS = stream.combine(is.map(function (i) {
          return i.minHeight;
        }), function () {
          return Array.prototype.slice.call(arguments);
        });

        var dMinWidthsS = stream.combine(js.map(function (j) {
          return j ? j.minWidth : stream.once(0);
        }), function () {
          return Array.prototype.slice.call(arguments);
        });
        var dMinHeightsS = stream.combine(js.map(function (j) {
          return j ? j.minHeight : onceConstantZeroS;
        }), function () {
          return Array.prototype.slice.call(arguments);
        });

        var computeRows = function (gridWidth, cmws, dmws) {
          var mws = cmws.map(function (cmw, i) {
            return Math.max(cmw, dmws[i]);
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
        stream.pushAll(stream.combine([
          cMinWidthsS,
          dMinWidthsS,
        ], function (cmws, dmws) {
          if (config.useFullWidth) {
            return cmws.reduce(function (a, mw, i) {
              return a + Math.max(mw, dmws[i]) + totalPaddingH;
            }, -totalPaddingH);
          }
          return cmws.reduce(function (a, mw, i) {
            return Math.max(a, Math.max(mw, dmws[i]));
          }, 0);
        }), minWidth);
        stream.combineInto([
          cMinWidthsS,
          cMinHeightsS,
          dMinWidthsS,
          dMinHeightsS,
        ], function (cmws, cmhs, dmws, dmhs) {
          return function (w) {
            var rows = computeRows(w, cmws, dmws);
            var index = 0;
            var h = rows.map(function (row) {
              var ch = config.rowHeight(row.cells, cmhs.slice(index, index + row.cells.length));
              var dh = config.rowHeight(row.cells, dmhs.slice(index, index + row.cells.length));
              index += row.cells.length;
              return ch + dh + totalPaddingV;
            }).reduce(add, -totalPaddingV);
            return h;
          };
        }, minHeight);

        stream.combine([
          ctx.width,
          ctx.height,
          cMinWidthsS,
          cMinHeightsS,
          dMinWidthsS,
          dMinHeightsS,
        ], function (gridWidth, gridHeight, cmws, cmhs, dmws, dmhs) {
          var rows = computeRows(gridWidth, cmws, dmws);
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
            var cHeight = config.rowHeight(row.cells, cmhs.slice(index, index + row.cells.length));
            row.dHeights = dmhs.slice(index, index + row.cells.length).map(function (dmh, i) {
              return dmh(row.cells[i].width);
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
            var rightmostCell = row.cells[row.cells.length - 1];
            row.right = rightmostCell.left + rightmostCell.width;
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
              var minLeft = Math.min(rows[i-1].cells[0].left, rows[i].cells[0].left);
              var maxRight = Math.max(rows[i-1].right, rows[i].right);
              updateDomStyle(splitVEls[elsPositionedV], 'left', minLeft + 'px');
              updateDomStyle(splitVEls[elsPositionedV], 'width', (maxRight - minLeft) + 'px');
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
          minWidth: minWidth,
          minHeight: minHeight,
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
          left: config.float === 'right' ? (w - floatWidth) : 0,
          top: 0,
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
          var dimLeft = top < topBelowFloat ? (config.float === 'right' ? config.padding : floatWidth + config.padding) : config.padding;
          var dimTop = top;
          var dimWidth = top < topBelowFloat ? w - (floatWidth + 2 * config.padding) : w - 2 * config.padding;
          var dimHeight = mhi(dimWidth);
          if (config.clearHanging && top < topBelowFloat && top + dimHeight + config.padding > topBelowFloat) {
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
          stream.push(context.left, dim.left);
          stream.push(context.top, dim.top);
          stream.push(context.width, dim.width);
          stream.push(context.height, dim.height);
        });
      });
      return {
        minWidth: minWidth,
        minHeight: minHeight,
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
        minWidth: typeof getMinWidthStream === 'function' ? getMinWidthStream(i, ctx) : getMinWidthStream,
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
    if (typeof getMinHeightStream === 'number') {
      return minHeight(getMinHeightStream);
    }
    return layout(function (el, ctx, c) {
      el.classList.add('withMinHeightStream');
      var i = c();
      var minHeightS = typeof getMinHeightStream === 'function' ? getMinHeightStream(i, ctx) : getMinHeightStream;
      return {
        minWidth: i.minWidth,
        minHeight: minHeightS,
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
    return layout(function (el, ctx, c) {
      el.classList.add('maxHeightStream');
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
    return layout(function (el, ctx, cs) {
      el.classList.add('largest-width-that-fits');
      var is = cs.map(function (c) {
        return c();
      });
      var allMinWidths = mapMinWidths(is);
      var allMinHeights = mapMinHeights(is);
      var chooseIndex = function (w, mws) {
        var index = mws.reduce(function (a, mw, index) {
          return (a === null || a.mw > w && a.mw > mw || a.mw < mw && mw < w) ? {
            mw: mw,
            index: index,
          } : a;
        }, null).index;
        return index;
      };
      stream.combine([
        ctx.width,
        allMinWidths,
      ], function (w, mws) {
        var i = chooseIndex(w, mws);
        is.map(function (instance, index) {
          instance.el.style.display = index === i ? '' : 'none';
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
    return layout(function (el, ctx, cs) {
      el.classList.add('overlays');
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
        css('overflow-x', 'scroll'),
        css('overflow-y', 'hidden'),
      ])(stack()([
        sideBySide({
          surplusWidth: centerSurplusWidth,
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
  var barWithDeprecationWarnings = {
    h: function (size) {
      deprecate('hcj.component.bar.h: use hcj.component.barH instead');
      return minWidth(size)(nothing);
    },
    v: function (size) {
      deprecate('hcj.component.bar.v: use hcj.component.barV instead');
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
      parseFloat(style.borderTop);
  };
  var getFormElementMarginBottom = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginBottom) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderBottom);
  };
  var getFormElementMarginLeft = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginLeft) +
      parseFloat(style.paddingLeft) +
      parseFloat(style.borderLeft);
  };
  var getFormElementMarginRight = function (el) {
    var style = window.getComputedStyle(el);
    return parseFloat(style.marginRight) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderRight);
  };
  var applyFormBorder = adjustPosition({}, {
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
    left: function (el) {
      return stream.once(getFormElementMarginLeft(el));
    },
    top: function (el) {
      return stream.once(getFormElementMarginTop(el));
    },
  });
  var applyTextareaBorder = adjustPosition({}, {
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
    left: function (el) {
      return stream.once(getFormElementMarginLeft(el));
    },
    top: function (el) {
      return stream.once(getFormElementMarginTop(el));
    },
  });
  var applyCheckboxBorder = adjustPosition({}, {
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
    left: function (el) {
      return stream.once(getFormElementMarginLeft(el));
    },
    top: function (el) {
      return stream.once(getFormElementMarginTop(el));
    },
  });
  var applyRadioBorder = adjustPosition({}, {
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
    left: function (el) {
      return stream.once(getFormElementMarginLeft(el));
    },
    top: function (el) {
      return stream.once(getFormElementMarginTop(el));
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
      ])(input(function (el, ctx, mw, mh) {
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
        mh();
      }));
    },
    date: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw, mh) {
        mw();
        mh();
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
      }));
    },
    dropdown: function (def) {
      var k = def.name;
      var type = def.type;
      var s = def.stream || stream.create();
      return select(function (el, ctx, mw, mh) {
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
        mh();
      });
    },
    file: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return input(function (el, ctx, mw, mh) {
        el.name = k;
        el.type = 'file';
        mw();
        mh();
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
          minWidth: onceZeroS,
          minHeight: onceConstantZeroS,
        };
      });
    },
    image: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return input(function (el, ctx, mw, mh) {
        el.name = k;
        el.type = 'file';
        el.accept = 'image/*';
        mw();
        mh();
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
      ])(input(function (el, ctx, mw, mh) {
        mw();
        mh();
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
      }));
    },
    password: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw, mh) {
        mw();
        mh();
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
        ])(input(function (el, ctx, mw, mh) {
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
          mh();
        }));
      });
    },
    text: function (def) {
      var k = def.name;
      var s = def.stream || stream.create();
      return all([
        applyFormBorder,
      ])(input(function (el, ctx, mw, mh) {
        mw();
        mh();
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
        var mw = stream.once(lastOuterWidth);
        var mh = stream.once(constant(lastOuterHeight));
        var afterTextareaResize = function () {
          stream.defer(function () {
            el.style.width = 'calc(' + (ctx.widthCalc ? ctx.widthCalc.lastValue : px(ctx.width.lastValue)) + ')';
            el.style.height = 'calc(' + (ctx.heightCalc ? ctx.heightCalc.lastValue : px(ctx.height.lastValue)) + ')';
          });
        };
        var onTextareaResize = function () {
          var currentOuterWidth = outerWidth(el);
          var currentOuterHeight = outerHeight(el);
          if (lastOuterWidth !== currentOuterWidth) {
            stream.push(mw, currentOuterWidth);
            lastOuterWidth = currentOuterWidth;
          }
          if (lastOuterHeight !== currentOuterHeight) {
            stream.push(mh, constant(currentOuterHeight));
            lastOuterHeight = currentOuterHeight;
          }
        };
        document.body.addEventListener('mousemove', onTextareaResize);
        document.body.addEventListener('mouseup', afterTextareaResize);
        el.addEventListener('click', onTextareaResize);
        return {
          minWidth: mw,
          minHeight: mh,
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
      ])(input(function (el, ctx, mw, mh) {
        mw();
        mh();
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
      }));
    },
  };
  var formComponent = function (def) {
    if (def.type.type) {
      deprecate('fieldType type property.  Now use kind property instead.');
    }
    return formComponentObj[def.type.kind || def.type.type](def);
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
    hidden: id,
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

  var formForOld = function (submitButtonFieldTypeF, formComponent) {
    return function (fields, labels) {
      labels = labels || {};
      return function (defaults) {
        defaults = defaults || {};
        return function (mkOnSubmit) {
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
                if (type.type) {
                  deprecate('fieldType type property.  Now use kind property instead.');
                }
                var fieldStyle = (type && style[type.kind || type.type]) || constant(id);
                fieldStreams[name] = fieldStream;
                fieldInputs[name] = fieldStyle(label, name, fieldStream, type)(formComponent[type.kind || type.type]({
                  name: name,
                  stream: fieldStream,
                  type: type,
                }));
              });
              var disabledS = stream.once(false);
              var submit = function (name) {
                var fieldType = submitButtonFieldTypeF();
                if (fieldType.type) {
                  deprecate('fieldType type property.  Now use kind property instead.');
                }
                var fieldStyle = style[fieldType.kind || fieldType.type] || constant(id);
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
                var setupFormSubmit = function (el) {
                  el.addEventListener('submit', function (ev) {
                    if (disabledS.lastValue) {
                      ev.preventDefault();
                      return;
                    }
                    onSubmit.onSubmit(ev);
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
                return c();
              })(f(fieldInputs, submit, fieldStreams, onSubmit && onSubmit.resultS));
            };
          };
        };
      };
    };
  };

  var formFor = function (formComponent, style, customSubmitComponentF) {
    if (typeof style !== 'function') {
      return formForOld(formComponent, style);
    }
    return function (mkOnSubmit, fields) {
      return function (f) {
        var fieldStreams = {};
        var fieldInputs = {};
        Object.keys(fields).map(function (name) {
          var field = fields[name];
          field.name = name;
          field.stream = (field.default !== undefined) ? stream.once(field.default) : stream.create();
          fieldStreams[name] = field.stream;
          field.validateS = field.validate ? field.validate(field.stream, fieldStreams) : stream.once('');
          field.validationMessageS = stream.map(field.validateS, function (validate) {
            if (validate.message) {
              return validate.message;
            }
            return validate;
          });
          field.isValidS = stream.map(field.validateS, function (validate) {
            if (validate.valid) {
              return validate.valid;
            }
            return validate.length === 0;
          });
          fieldInputs[name] = style(field)(formComponent[field.type.kind](field));
        });
        var disabledS = stream.once(false);
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
        var allFieldsValid = function () {
          var allValid = true;
          Object.keys(fields).map(function (name) {
            if (!fields[name].isValidS.lastValue) {
              allValid = false;
            }
          });
          return allValid;
        }
        if (typeof mkOnSubmit === 'function') {
          var onSubmit = mkOnSubmit(fieldStreams, function () {
            stream.push(disabledS, true);
            return function () {
              stream.push(disabledS, false);
            };
          });
          var setupFormSubmit = function (el) {
            el.addEventListener('submit', function (ev) {
              if (disabledS.lastValue) {
                ev.preventDefault();
                return;
              }
              if (!allFieldsValid()) {
                console.log('not all valid');
                ev.preventDefault();
                return;
              }
              onSubmit.onSubmit(ev);
            });
          };
        }
        else {
          var setupFormSubmit = function (el) {
            el.method = mkOnSubmit.method;
            el.action = mkOnSubmit.action;
            el.addEventListener('submit', function (ev) {
              if (!allFieldsValid()) {
                console.log('not all valid');
                ev.preventDefault();
                return;
              }
            });
          };
        }
        return layout('form', function (el, ctx, c) {
          setupFormSubmit(el);
          var i = c();
          return {
            minWidth: i.minWidth,
            minHeight: i.minHeight,
          };
        })(f(fieldInputs, submitComponentF, fieldStreams, onSubmit && onSubmit.resultS));
      };
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
      bar: barWithDeprecationWarnings,
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
