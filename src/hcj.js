(function () {
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
  var curry = function (arr) {
	throw('the venerable curry, we shall define at a later date');
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

  var pushStreams = [];
  var pushValues = [];
  var pushing = false;
  var pushFlush = function () {
	var ps = pushStreams;
	var pv = pushValues;
	pushStreams = [];
	pushValues = [];
	pushing = false;
	for (var j = 0; j < ps.length; j++) {
	  var s = ps[j];
	  var v = pv[j];
	}
  };
  var pushNow = function (s, v) {
	pushStreams.push(s);
	pushValues.push(v);
	if (pushing === false) {
	  pushing = true;
	  setTimeout(function () {
		setTimeout(pushFlush);
	  });
	}
  };

  var deferFuncContext = function () {
	/*
	 WARNING:

	 This is a hacky implementation of something that already exists.  Do
	 not use this library.  When I find out what it is that I'm crudely
	 implementing here, I will find and use an existing library for it.

	 */
    var nextFunctions = [];
    var deferredFunctions = [];
    var running = false;
    var ensureRunning = function () {
      if (running === false) {
        running = true;
        setTimeout(function () {
          running = false;
          // run nextFunctions now, allowing more next functions to be
          // signed up
          var nowFunctions = nextFunctions;
          nextFunctions = [];
          nowFunctions.map(function (f) {
            f(deferFuncObj);
          });
          // if no next functions were signed up, then go ahead and
          // run the deferred functions
          if (running === false) {
            nextFunctions = deferredFunctions;
            deferredFunctions = [];
            ensureRunning();
          }
        });
      }
    };
    var deferFuncObj = {
      next: function (f) {
        nextFunctions.push(f);
        ensureRunning();
      },
      defer: function (f) {
        deferredFunctions.push(f);
        ensureRunning();
      },
    };
    return deferFuncObj;
  };

  var streamDeferFunc = deferFuncContext();
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
	  if (Number.isNaN(v)) {
		debugger;
	  }
	  streamDeferFunc.next(function () {
		if (s.lastValue !== v) {
		  s.lastValue = v;
		  if (Number.isNaN(v)) {
			debugger;
		  }
		  for (var i = 0; i < s.listeners.length; i++) {
			if (s.listeners[i]) {
			  s.listeners[i](v);
			}
		  }
		}
	  });
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
	  stream.map(s, function (v) {
		f(v);
		return true;
	  });
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
		  setTimeout(function () {
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
  var displayedS = stream.once(false);

  var updateDomEls = [];
  var updateDomProps = [];
  var updateDomValues = [];
  var runDomFuncs = function () {
	for (var i = 0; i < updateDomEls.length; i++) {
	  updateDomEls[i].css(updateDomProps[i], updateDomValues[i]);
	}
	updateDomEls = [];
	updateDomProps = [];
	updateDomValues = [];
  };
  var updateDomFunc = function ($el, ctx, prop, value) {
	if (updateDomEls.length === 0) {
	  stream.defer(runDomFuncs);
	}
	updateDomEls.push($el);
	updateDomProps.push(prop);
	updateDomValues.push(value);
  };

  var measureWidth = function ($el, w) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', w ? px(w) : '')
	  .css('height', '')
	  .css('display', 'inline-block')
	  .appendTo($sandbox);

	var width = parseFloat($clone.css('width'));
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

	  var height = parseFloat($clone.css('height'));
	  ws[w] = height;

	  $clone.remove();

	  return height;
	};
  };

  var elementFunc = function (name, build, context) {
	var $el = $(document.createElement(name));
	$el.css('pointer-events', 'initial');

	if (name === 'textarea') {
	  // give textareas a resize event
	}

	var onDestroy = [];
	context.child = function (ctx) {
	  ctx = ctx || {};
	  ['width', 'height', 'top', 'left', 'widthCss', 'heightCss', 'topCss', 'leftCss'].map(function (prop) {
		if (ctx[prop] === true) {
		  ctx[prop] = stream.create();
		}
		else if (ctx[prop]) {
		  ctx[prop] = stream.clone(ctx[prop]);
		}
	  });
	  try {
		ctx.$el = $el;
		ctx.width = ctx.width || context.width;
		ctx.height = ctx.height || context.height;
		ctx.top = ctx.top || onceZeroS;
		ctx.left = ctx.left || onceZeroS;
		ctx.topAccum = stream.combine([context.topAccum, context.top], add);
		ctx.leftAccum = stream.combine([context.leftAccum, context.left], add);
		ctx.occlusions = stream.combine([
		  ctx.occlusions || context.occlusions,
		  ctx.width,
		  ctx.height,
		  ctx.left,
		  ctx.top,
		], function (os, w, h, t, l) {
		  return os.map(function (o) {
			return {
			  left: o.left - l,
			  top: o.top - t,
			  width: o.width,
			  height: o.height,
			};
		  }).filter(function (o) {
			// throw out occlusion if
			if (o.left + o.width < 0) {
			  // right hand side of occlusion to the left of component
			  return;
			}
			if (o.left > w) {
			  // left hand side of occlusion to the right of component
			  return;
			}
			if (o.top + o.height < 0) {
			  // bottom of occlusion above component
			  return;
			}
			if (o.top > h) {
			  // top of occlusion below component
			  return;
			}
			return true;
		  });
		});
		ctx.onDestroy = onDestroy.push;
		stream = stream;
		return ctx;
	  }
	  catch (e) {
		debugger;
	  }
	};

	$el.css('visibility', 'hidden')
	  .css('pointer-events', 'initial')
	  .css('position', 'absolute');
	stream.onValue(context.widthCss || context.width, function (w) {
	  updateDomFunc($el, context, 'width', w);
	});
	stream.onValue(context.heightCss || context.height, function (h) {
	  updateDomFunc($el, context, 'height', h);
	});
	stream.onValue(context.topCss || context.top, function (t) {
	  updateDomFunc($el, context, 'top', t);
	});
	stream.onValue(context.leftCss || context.left, function (l) {
	  updateDomFunc($el, context, 'left', l);
	});
	stream.combine([
	  context.width,
	  context.height,
	  context.top,
	  context.left,
	], function () {
	  updateDomFunc($el, context, 'visibility', 'initial');
	});

	var instance = {
	  $el: $el,
	};
	var streams = build($el, context, function (wd) {
	  var w = measureWidth($el, wd);
	  if (instance.minWidth) {
		stream.push(instance.minWidth, w);
	  }
	  else {
		instance.initialMinWidth = w;
	  }
	}, function () {
	  var h = measureHeight($el);
	  if (instance.minHeight) {
		stream.push(instance.minHeight, h);
	  }
	  else {
		instance.initialMinHeight = h;
	  }
	}) || {};
	instance.minWidth = streams.minWidth ? streams.minWidth : stream.create();
	instance.minHeight = streams.minHeight ? streams.minHeight : stream.create();
	if (instance.hasOwnProperty('initialMinWidth')) {
	  stream.push(instance.minWidth, instance.initialMinWidth);
	}
	if (instance.hasOwnProperty('initialMinHeight')) {
	  stream.push(instance.minHeight, instance.initialMinHeight);
	}

	if (context.useMinWidth) {
	  stream.pushAll(instance.minWidth, context.width);
	}
	if (context.useMinHeight) {
	  stream.pushAll(stream.combine([
		instance.minHeight,
		context.width,
	  ], function (mh, w) {
		return mh(w);
	  }), context.height);
	}

	$el.appendTo(context.$el);

	instance.destroy = function () {
	  onDestroy.map(apply());
	  $el.remove();
	};
	context.onDestroy(instance.destroy);

	return instance;
  };

  var element = function (name) {
	return function (build) {
	  return function (context) {
		return elementFunc(name, build, context);
	  };
	};
  };

  var a = element('a');
  var button = element('button');
  var div = element('div');
  var form = element('form');
  var iframe = element('iframe');
  var img = element('img');
  var input = element('input');
  var label = element('label');
  var li = element('li');
  var option = element('option');
  var p = element('p');
  var pre = element('pre');
  var select = element('select');
  var textarea = element('textarea');
  var ul = element('ul');

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
  var layoutRecurse = function ($el, ctx, cs) {
	if ($.isArray(cs)) {
	  return cs.map(function (c) {
		return layoutRecurse($el, ctx, c);
	  });
	}
	else {
	  if (!$.isFunction (cs)) {
		console.log('cs is not a function');
		debugger;
	  }
	  return function (context) {
		var i = cs(context);
		// todo: replace with some isInstance function
		if (!i || !i.minWidth || !i.minHeight) {
		  console.log('not a component');
		  debugger;
		}
		return i;
	  };
	}
  };

  var layout = function (elArg, buildLayoutArg) {
	var el = buildLayoutArg ? elArg : div;
	var buildLayout = buildLayoutArg || elArg;
	return function () {
	  var args = Array.prototype.slice.call(arguments);
	  return el(function ($el, ctx) {
		$el.css('pointer-events', 'none');
		return buildLayout.apply(null, [$el, ctx].concat(layoutRecurse($el, ctx, args)));
	  });
	};
  };

  var container = function (elArg, buildContainerArg) {
	var el = buildContainerArg ? elArg : div;
	var buildContainer = buildContainerArg || elArg;
	return div(function ($el, ctx) {
	  return buildContainer($el, ctx, function (cs) {
		return layoutRecurse($el, ctx, cs);
	  });
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
	stream.combine([
	  ctx.width,
	  ctx.height,
	  ctx.top,
	  ctx.left,
	], function () {
	  stream.push(displayedS, true);
	  updateDomFunc($('body'), ctx, 'height', 'auto');
	});
	return c(ctx.child());
  });

  var ensureSandbox = function () {
	if ($('.sandbox').length > 0) {
	  return;
	}
	$(document.createElement('div'))
	  .addClass('sandbox')
	  .css('z-index', -1)
	  .appendTo($('body'));
  };
  var rootComponent = function (c, config) {
	// var debugAndRepeat = function () {
	//   debugger;
	//   stream.defer(debugAndRepeat);
	// };
	// stream.defer(debugAndRepeat);
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
	  if (document.body.scrollHeight > window.innerHeight) {
		// this if statement does not work, document.body.scrollHeight should actually be a stream
		stream.push(width, ww - scrollbarWidth);
		stream.push(height, mhAtScrollbarWW);
		return;
	  }
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
	var onDestroy = [];
	var i = rootLayout(c)({
	  $el: $('body'),
	  width: width,
	  height: height,
	  top: onceZeroS,
	  left: onceZeroS,
	  topAccum: onceZeroS,
	  leftAccum: onceZeroS,
	  occlusions: stream.once([]),
	  onDestroy: onDestroy.push,
	});
	i.$el.css('position', 'absolute')
	  .css('top', '0px')
	  .css('left', '0px')
	  .css('background-color', config.noBackground ? '' : 'white');
	var elHeight = i.$el.css('height');
	stream.map(displayedS, function (displayed) {
	  if (displayed) {
		setTimeout(function () {
		  $('.server-content').css('display', 'none');
		  console.log('did it');
		  console.log('golly look at this endearing debug output');
		}, 500);
	  }
	});
	var destroy = i.destroy;
	i.destroy = function () {
	  onDestroy.map(apply());
	  destroy();
	};
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
	  r: c.r || 0,
	  g: c.g || 0,
	  b: c.b || 0,
	  a: c.a || 1,
	};
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
	  var i = c(ctx.child());
	  return {
		minWidth: stream.once(mw),
		minHeight: i.minHeight,
	  };
	});
  };
  var minHeight = function (mh) {
	return layout(function ($el, ctx, c) {
	  $el.addClass('minHeight');
	  var i = c(ctx.child());
	  return {
		minWidth: i.minWidth,
		minHeight: stream.once(constant(mh)),
	  };
	});
  };
  var withDimensions = function (mw, mh) {
	return layout(function ($el, ctx, c) {
	  $el.addClass('withDimensions');
	  var i = c(ctx.child());
	  return {
		minWidth: stream.once(mw),
		minHeight: stream.once(constant(mh)),
	  };
	});
  };
  var passthrough = function (f, el) {
	return layout(el || div, function ($el, ctx, c) {
	  $el.addClass('passthrough');
	  if (f) {
		f($el);
	  }
	  return c(ctx.child());
	});
  };
  var wrap = function (el) {
	return passthrough(null, el);
  };

  var adjustPosition = function (minSize, position) {
	minSize = minSize || {};
	minSize.minWidth = minSize.minWidth || id;
	minSize.minHeight = minSize.minHeight || id;
	position = position || {};
	position.top = position.top || onceZeroS;
	position.left = position.left || onceZeroS;
	position.width = position.width || id;
	position.height = position.height || id;
	return layout(function ($el, ctx, c) {
	  var context = ctx.child({
		top: true,
		left: true,
		width: true,
		height: true,
	  });
	  var i = c(context);
	  stream.pushAll(position.top, context.top);
	  stream.pushAll(position.left, context.left);
	  stream.pushAll(stream.map(ctx.width, position.width), context.width);
	  stream.pushAll(stream.map(ctx.height, position.height), context.height);
	  return {
		minWidth: stream.map(i.minWidth, function (mw) {
		  return minSize.minWidth(mw);
		}),
		minHeight: stream.map(i.minHeight, function (mh) {
		  return minSize.minHeight(mh);
		}),
	  };
	});
  };

  var adjustMinSize = function (config) {
	return layout(function ($el, ctx, c) {
	  var i = c(ctx.child());
	  return {
		minWidth: stream.map(i.minWidth, function (mw) {
		  return config.mw(mw);
		}),
		minHeight: stream.map(i.minHeight, function (mh) {
		  return config.mh(mh);
		}),
	  };
	});
  };
  var link = all([
	$css('cursor', 'pointer'),
	$css('pointer-events', 'initial'),
  ]);

  // var componentName = function (name) {
  // 	return passthrough(function ($el) {
  // 		$el.addClass(name);
  // 	});
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

  var backgroundColor = function (s) {
	// stream is an object
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
  var withFontColor = function (fc) {
	return passthrough(function ($el) {
	  $el.css('color', colorString(fc));
	});
  };
  var hoverColor = function (config) {
	var backgroundColor = colorString(config.backgroundColor || transparent);
	var hoverBackgroundColor = colorString(config.hoverBackgroundColor || backgroundColor);
	var fontColor = colorString(config.fontColor || black);
	var hoverFontColor = colorString(config.hoverFontColor || fontColor);
	return hoverThis(function (h, $el) {
	  $el.css('transition', 'background-color ease ' + config.transition + 's' + ', color ease ' + config.transition + 's');
	  $el.css('background-color', h ? hoverBackgroundColor : backgroundColor);
	  $el.css('color', h ? hoverFontColor : fontColor);
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
	  $el.css('overflow', 'hidden');
	  var props = stream.create();
	  var i = c(ctx.child({
		top: stream.prop(props, 'top'),
		left: stream.prop(props, 'left'),
		width: stream.prop(props, 'width'),
		height: stream.prop(props, 'height'),
	  }));
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
  var keepAspectRatio = function (config) {
	config = config || {};
	return layout(function ($el, ctx, c) {
	  $el.addClass('keepAspectRatio');
	  $el.css('overflow', 'hidden');
	  var props = stream.create();
	  var i = c(ctx.child({
		top: stream.prop(props, 'top'),
		left: stream.prop(props, 'left'),
		width: stream.prop(props, 'width'),
		height: stream.prop(props, 'height'),
	  }));
	  stream.combineInto([
		i.minWidth,
		i.minHeight,
		ctx.width,
		ctx.height,
	  ], function (mw, mh, w, h) {
		var ar = mw / mh(mw);
		var AR = w / h;
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
		  stream.push(minWidth, config.minHeight * mw / mh(mw));
		}
		else {
		  stream.push(minWidth, mw);
		}
		stream.push(minHeight, function (w) {
		  return w / (mw / mh(mw));
		});
	  });
	  return {
		minWidth: minWidth,
		minHeight: minHeight,
	  };
	});
  };

  var image = function (config) {
	var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
	return img(function ($el, ctx) {
	  var minWidth = stream.create();
	  var minHeight = stream.create();
	  stream.map(srcStream, function (src) {
		$el.prop('src', src);
	  });
	  $el.on('load', function () {
		var aspectRatio = $el[0].naturalWidth / $el[0].naturalHeight;
		var mw = config.minWidth ||
			  (config.minHeight && config.minHeight * aspectRatio) ||
			  $el[0].naturalWidth;
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

  var linkTo = function (config) {
	if ($.type(config) === 'string') {
	  config = {
		href: config,
	  };
	}
	return layout(a, function ($el, ctx, c) {
	  $el.prop('href', config.href);
	  $el.css('pointer-events', 'initial');
	  if (config.targetBlank) {
		$el.prop('target', '_blank');
	  }
	  return c(ctx.child());
	});
  };

  var empty = function (el) {
	return el(function ($el, ctx) {
	  $el.addClass('empty');
	  return {
		minWidth: onceZeroS,
		minHeight: stream.once(constant(0)),
	  };
	});
  };
  var nothing = empty(div);

  var text = function (strs, config) {
	strs = strs || '';
	if (!$.isArray(strs)) {
	  strs = [strs];
	}
	config = config || strs[0];
	if ($.isArray(config)) {
	  config = config.reduce($.extend, {});
	}

	return (config.el || div)(function ($el, ctx) {
	  var didMH = false;
	  var mwS = stream.create();
	  var mhS = stream.create();
	  var spanStreams = [];
	  $el.addClass('text');
	  strs.map(function (c) {
		if ($.type(c) === 'string') {
		  c = {
			str: c,
		  };
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
		$span.html(' ' + c.str + ' ');
		c.size = c.size || config.size;
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
		  var mw = config.minWidth ||
				(config.measureWidth && measureWidth($el)) ||
				300;
		  var mh = (config.oneLine && $el.css('line-height').indexOf('px') !== -1 && constant(parseFloat($el.css('line-height')))) || function (w) {
			var fontSize = parseInt($el.css('font-size'));
			var str = $el.text();
			var lineHeight = ($el.css('line-height').indexOf('px') !== -1 && parseFloat($el.css('line-height')));
			return Math.ceil(fontSize * str.length * 0.5 / w) * lineHeight;
		  };
		  if (!config.oneLine) {
			stream.defer(function () {
			  var mh = (config.minHeight && constant(config.minHeight)) ||
					(measureHeight($el));
			  stream.push(mhS, mh);
			});
		  }
		  stream.push(mwS, mw);
		  stream.push(mhS, mh);
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
	  // 	stream.push(mw, config.minWidth);
	  // }
	  // else if (config.measureWidth) {
	  // 	stream.push(mw, measureWidth($el));
	  // }
	  // else {
	  // 	stream.push(mw, 0);
	  // }

	  // if (config.minHeight) {
	  // 	stream.push(mh, config.minHeight);
	  // }
	  // else if (config.measureHeight) {
	  // 	stream.push(mh, measureHeight($el));
	  // }
	  // else {
	  // 	stream.push(mh, constant(0));
	  // }

	  pushDimensions();

	  return {
		minWidth: mwS,
		minHeight: mhS,
	  };
	});
  };

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

  var slideshow = function (config) {
	config.padding = config.padding || 0;
	config.transitionTime = config.transitionTime || 0;
	return layout(function ($el, ctx, cs) {
	  $el.css('overflow', 'hidden');
	  $el.addClass('slideshow');

	  var contexts = cs.concat(cs).concat(cs).map(function () {
		return ctx.child({
		  left: true,
		});
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
  };
  // var slideshowVertical = function (config, cs) {
  // 	config.padding = config.padding || 0;
  // 	config.topTransition = config.topTransition || 'none';
  // 	config.alwaysFullHeight = config.alwaysFullHeight || false;
  // 	return div.all([
  // 		$css('overflow', 'hidden'),
  // 		componentName('slideshow'),
  // 		children(cs.map(function (c) {
  // 			return c.all([
  // 				$css('transition', 'top ' + config.topTransition),
  // 			]);
  // 		})),
  // 		wireChildren(function (instance, context, is) {
  // 			var allMinWidths = mapMinWidths(is, ctx);
  // 			var allMinHeights = mapMinHeights(is, ctx);

  // 			allMinWidths.map(function (mws) {
  // 				return mws.reduce(mathMax, 0);
  // 			}, instance.minWidth);

  // 			stream.combine([
  // 				context.width,
  // 				allMinHeights,
  // 			], function (w, mhs) {
  // 				stream.push(instance.minHeight, mhs.map(apply(w)).reduce(mathMax, 0));
  // 			});

  // 			var contexts = is.map(function (i) {
  // 				return {
  // 					top: stream.create(),
  // 					left: stream.once(0),
  // 					width: context.width,
  // 					height: i.minHeight,
  // 				};
  // 			});

  // 			stream.combine([
  // 				config.selected,
  // 				context.width,
  // 				context.height,
  // 				allMinWidths,
  // 				allMinHeights,
  // 			], function (selected, width, height, mws, mhs) {
  // 				var selectedTop = 0;
  // 				var selectedHeight = 0;
  // 				var top = 0;
  // 				var positions = mhs.map(function (mh, index) {
  // 					mh = config.alwaysFullHeight ? height : mh(width);
  // 					if (selected === index) {
  // 						selectedTop = top + config.padding * index;
  // 						selectedHeight = mh;
  // 					}
  // 					var position = {
  // 						top: top + config.padding * index,
  // 						height: mh
  // 					};
  // 					top += mh;
  // 					return position;
  // 				});
  // 				var dTop = (height - selectedHeight) / 2 - selectedTop;
  // 				positions.map(function (position) {
  // 					position.top += dTop;
  // 				});

  // 				positions.map(function (position, index) {
  // 					var ctx = contexts[index];
  // 					stream.push(ctx.top, position.top);
  // 					stream.push(ctx.height, position.height);
  // 				});
  // 			});

  // 			return [contexts];
  // 		}),
  // 	]);
  // };

  var sideBySide = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.surplusWidthFunc = config.surplusWidthFunc || ignoreSurplusWidth;
	return layout(function ($el, ctx, cs) {
	  $el.addClass('sideBySide');
	  if (cs.length === 0) {
		return {
		  minWidth: stream.once(0),
		  minHeight: stream.once(constant(0)),
		};
	  }
	  var contexts = [];
	  var is = cs.map(function (c) {
		var context = ctx.child({
		  left: true,
		  width: true,
		});
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
  };

  var slideIn = function (config) {
	config = config || {};
	config.top = config.top || 50;
	config.transition = config.transition || '1s';
	return layout(function ($el, ctx, c) {
	  var context = ctx.child({
		top: true,
	  });
	  var i = c(context);
	  i.$el.css('transition', 'top ' + config.transition);
	  var pushed = false;
	  stream.push(context.top, config.top);
	  stream.combine([
		ctx.topAccum,
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
  };
  var fadeIn = function (config) {
	config = config || {};
	config.transition = config.transition || '1s';
	config.margin = config.margin || 0;
	return layout(function ($el, ctx, c) {
	  var i = c(ctx.child());
	  var pushed = false;
	  i.$el.css('opacity', 0);
	  setTimeout(function () {
		i.$el.css('transition', 'opacity ' + config.transition);
	  });
	  stream.combine([
		ctx.topAccum,
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
  };

  var slider = function (config, cs) {
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
		return ctx.child({
		  top: stream.once(0),
		  left: stream.map(leftsS, function (lefts) {
			return lefts[index];
		  }),
		  width: true,
		  height: ctx.height,
		});
	  });
	  var is = cs.map(function (c, index) {
		var ctx = ctxs[index];
		var i = c(ctx);
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
  };

  var stack = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.surplusHeightFunc = config.surplusHeightFunc || ignoreSurplusHeight;
	return layout(function ($el, ctx, cs) {
	  $el.addClass('stack');
	  if (cs.length === 0) {
		return {
		  minWidth: stream.once(0),
		  minHeight: stream.once(constant(0)),
		};
	  }
	  var contexts = [];
	  var is = cs.map(function (c) {
		var context = ctx.child({
		  widthCss: stream.once('100%'),
		  top: true,
		  height: true,
		});
		contexts.push(context);
		return c(context);
	  });
	  if (config.transition) {
		var transition = config.transition + 's';
		is.map(function (i) {
		  i.$el.css('transition', 'height ' + transition + ', top ' + transition);
		});
	  }
	  var allMinWidths = mapMinWidths(is, ctx);
	  var allMinHeights = mapMinHeights(is, ctx);
	  stream.combine([
		ctx.width,
		ctx.height,
		allMinHeights,
	  ], function (width, height, mhs) {
		var top = 0;
		var positions = mhs.map(function (mh, index) {
		  var position = {
			top: top + config.padding * index,
			height: mh(width),
		  };
		  top += mh(width);
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
			return mhs.map(apply(w)).reduce(add, config.padding * (is.length - 1));
		  };
		}),
	  };
	});
  };

  var stackStream = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.surplusHeightFunc = config.surplusHeightFunc || ignoreSurplusHeight;
	config.transition = config.transition || 0;
	return function (actionS) {
	  return container(function ($el, ctx, child) {
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
		  var context = ctx.child({
			top: true,
			height: true,
		  });
		  var i = child(c)(context);

		  cs[index] = c;
		  mwDeleteListeners[index] = stream.onValue(i.minWidth, tryPushContexts);
		  mhDeleteListeners[index] = stream.onValue(i.minHeight, tryPushContexts);
		  contexts[index] = context;
		  is[index] = i;

		  return index;
		};
		var remove = function (c) {
		  var index = cs.indexOf(c);
		  is[index].destroy();
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
  };

  var tree = function (config, index) {
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
  };

  var intersperse = function (arr, v) {
	var result = [];
	arr.map(function (el) {
	  result.push(el);
	  result.push(v);
	});
	result.pop();
	return result;
  };


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
	  var i = c(ctx.child({
		top: stream.once(top),
		left: stream.once(left),
		width: stream.map(ctx.width, function (w) {
		  return w - left - right;
		}),
		height: stream.map(ctx.height, function (h) {
		  return h - top - bottom;
		}),
		widthCss: stream.once('calc(100% - ' + px(left + right) + ')'),
		heightCss: stream.once('calc(100% - ' + px(top + bottom) + ')'),
	  }));
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
	  var i = c(ctx.child({
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
	  }));
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

  var alignLRM = function (config) {
	config = config || {};
	config.transition = (config.transition || 0) + 's';
	return function (lrm) {
	  return layout(function ($el, ctx, l, r, m) {
		$el.addClass('alignLRM');
		var lCtx = ctx.child({
		  width: true,
		});
		var rCtx = ctx.child({
		  width: true,
		  left: true,
		});
		var mCtx = ctx.child({
		  width: true,
		  left: true,
		});
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
			return [l, r, m].reduce(add);
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
	  })(lrm.l || nothing, lrm.r || nothing, lrm.m || nothing);
	};
  };
  var alignLeft = function (c) {
	return alignLRM()({
	  l: c,
	});
  };
  var alignRight = function (c) {
	return alignLRM()({
	  r: c,
	});
  };
  var center = function (config) {
	return function (c) {
	  return alignLRM(config)({
		m: c,
	  });
	};
  };

  var alignTBM = function (config) {
	config = config || {};
	config.transition = (config.transition || 0) + 's';
	return function (tbm) {
	  return layout(function ($el, ctx, t, b, m) {
		$el.addClass('alignTBM');
		var tCtx = ctx.child({
		  height: true,
		});
		var bCtx = ctx.child({
		  height: true,
		  top: true,
		});
		var mCtx = ctx.child({
		  height: true,
		  top: true,
		});
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
		tI.$el.css('transition', 'top ' + config.transition);
		bI.$el.css('transition', 'top ' + config.transition);
		mI.$el.css('transition', 'top ' + config.transition);
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
		  ], function (t, b, m) {
			return function (w) {
			  return [t, b, m].map(apply(w)).reduce(add);
			};
		  }),
		};
	  })(tbm.t || nothing, tbm.b || nothing, tbm.m || nothing);
	};
  };
  var alignVTop = function (c) {
	return alignTBM()({
	  t: c,
	});
  };
  var alignVBottom = function (c) {
	return alignTBM()({
	  b: c,
	});
  };
  var alignVMiddle = function (c) {
	return alignTBM()({
	  m: c,
	});
  };
  var alignHLeft = function (c) {
	return alignLRM()({
	  l: c,
	});
  };
  var alignHRight = function (c) {
	return alignLRM()({
	  r: c,
	});
  };
  var alignHMiddle = function (c) {
	return alignLRM()({
	  m: c,
	});
  };

  // // var invertOnHover = function (c) {
  // // 	var invert = stream.once(false, 'invert');

  // // 	var choose = function (stream1, stream2) {
  // // 		return stream.combine([invert, stream1, stream2], function (i, v1, v2) {
  // // 			return i ? v2 : v1;
  // // 		}, 'choose stream');
  // // 	};


  // // 	return div.all([
  // // 		componentName('invert-on-hover'),
  // // 		child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
  // // 		wireChildren(function (instance, context, i) {
  // // 			stream.pushAll(i.minHeight, instance.minHeight);
  // // 			stream.pushAll(i.minWidth, instance.minWidth);
  // // 			return [{
  // // 				backgroundColor: choose(context.backgroundColor, context.fontColor),
  // // 				fontColor: choose(context.fontColor, context.backgroundColor),
  // // 				top: stream.once(0),
  // // 				left: stream.once(0),
  // // 				width: context.width,
  // // 				height: context.height,
  // // 			}];
  // // 		}),
  // // 		mouseoverThis(function () {
  // // 			stream.push(invert, true);
  // // 		}),
  // // 		mouseoutThis(function () {
  // // 			stream.push(invert, false);
  // // 		}),
  // // 	]);
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

	return layout(function ($el, ctx, c) {
	  $el.addClass('border');
	  // overflow hidden is necessary to prevent cutting off corners
	  // of border if there is a border radius
	  var i = c(ctx.child({
		width: stream.map(ctx.width, function (w) {
		  return w - left - right;
		}),
		height: stream.map(ctx.height, function (h) {
		  return h - top - bottom;
		}),
		widthCss: stream.once('calc(100% - ' + px(left + right) + ')'),
		heightCss: stream.once('calc(100% - ' + px(top + bottom) + ')'),
	  }));
	  i.$el.css('overflow', 'hidden');
	  i.$el.css('border-radius', px(radius));
	  stream.map(colorStringS, function (colorstring) {
		i.$el.css('border-left', px(left) + ' ' + style + ' ' + colorstring)
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
			return mh(w) + top + bottom;
		  };
		}),
	  };
	});
  };

  var componentStream = function (cStream) {
	var error = new Error();
	return container(function ($el, ctx, child) {
	  $el.addClass('componentStream');
	  var i;
	  var unpushMW;
	  var unpushMH;
	  ctx.onDestroy(function () {
		if (i) {
		  i.destroy();
		}
	  });
	  var minWidth = stream.create();
	  var minHeight = stream.create();
	  var iStream = stream.reduce(cStream, function (i, c) {
		if (i) {
		  i.destroy();
		}
		if (unpushMW) {
		  unpushMW();
		}
		if (unpushMH) {
		  unpushMH();
		}
		i = child(c)(ctx.child({
		  widthCss: stream.once('100%'),
		  heightCss: stream.once('100%'),
		}));
		unpushMW = stream.pushAll(i.minWidth, minWidth);
		unpushMH = stream.pushAll(i.minHeight, minHeight);
		return i;
	  });
	  return {
		minWidth: minWidth,
		minHeight: minHeight,
	  };
	});
  };

  var componentStreamWithExit = function (cStream, exit) {
	var i;
	exit = exit || function () {
	  var d = $.Deferred();
	  d.resolve();
	  return d.promise();
	};
	return container(function ($el, context, child) {
	  $el.addClass('component-stream-with-exit');
	  var localCStream = stream.create();
	  stream.pushAll(cStream, localCStream);
	  var minWidthS = stream.create();
	  var minHeightS = stream.create();
	  var instanceC = function (c) {
		if (i) {
		  (function (i) {
			setTimeout(function () {
			  exit(i).then(function () {
				i.destroy();
			  });
			});
		  })(i);
		}
		i = child(c)(context.child({
		  widthCss: stream.once('100%'),
		  heightCss: stream.once('100%'),
		}));
		i.$el.css('transition', 'inherit');
		i.$el.prependTo($el);
		stream.pushAll(i.minWidth, minWidthS);
		stream.pushAll(i.minHeight, minHeightS);
	  };
	  stream.map(localCStream, function (c) {
		instanceC(c);
	  });
	  context.onDestroy(function () {
		stream.end(localCStream);
		if (i) {
		  i.destroy();
		}
	  });
	  return {
		minWidth: minWidthS,
		minHeight: minHeightS,
	  };
	});
  };

  var promiseComponent = function (cP) {
	// var s = stream.once(nothing);
	var s = stream.create();
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

		var i = c(context.child({
		  top: stream.once(0),
		  left: stream.once(0),
		  width: stream.map(windowWidth, function (ww) {
			return document.body.clientWidth;
		  }),
		  height: windowHeight,
		}));

		$el = i.$el;
		$el.css('z-index', 100);
		$el.appendTo($('body'));
		$el.css('position', 'fixed');
		$el.css('transition', $el.css('transition') + ', opacity ' + transition + 's');
		$el.css('display', 'none');
		$el.css('pointer-events', 'initial');

		stream.onValue(open, function (on) {
		  console.log(on);
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
		  minHeight: stream.once(constant(0)),
		};
	  })(c);
	};
  };

  var toggleHeight = function (open) {
	return layout(function ($el, ctx, c) {
	  $el.css('overflow', 'hidden')
		.addClass('toggle-height');
	  var cCtx = ctx.child();
	  var i = c(cCtx);
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
	  var panelCtx = ctx.child({
		height: true,
		top: true,
	  });
	  var sourceCtx = ctx.child();
	  var panelI = panel(panelCtx);
	  var sourceI = source(sourceCtx);
	  useMinHeight(panelCtx, panelI);
	  stream.pushAll(sourceCtx.height, panelCtx.top);
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
	  var context = ctx.child({
		top: stream.combine([
		  onOffS,
		  ctx.height,
		], function (on, h) {
		  return on ? 0 : -h;
		})
	  });
	  if (config.panelHeightS) {
		stream.pushAll(context.height, config.panelHeightS);
	  }
	  var i = panel(context);
	  $el.css('overflow', 'hidden');
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
	  $el.addClass('dropdown-panel');
	  var panelCtx = ctx.child({
		width: true,
		height: true,
		left: true,
		top: true,
	  });
	  var sourceCtx = ctx.child();
	  var panelI = panel(panelCtx);
	  var sourceI = source(sourceCtx);
	  useMinWidth(panelCtx, panelI);
	  stream.combineInto([
		sourceCtx.height,
		windowHeight,
	  ], function (sh, wh) {
		return wh - sh;
	  }, panelCtx.height);
	  stream.pushAll(sourceCtx.height, panelCtx.top);
	  stream.combineInto([
		sourceCtx.width,
		panelI.minWidth,
	  ], function (w, mw) {
		return w - mw;
	  }, panelCtx.left);
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
	  var i = panel(ctx.child({
		left: stream.combine([
		  onOffS,
		  ctx.width,
		], function (on, w) {
		  return on ? 0 : w;
		})
	  }));
	  $el.css('overflow', 'hidden');
	  i.$el.css('transition', 'left ' + config.transition)
		.css('z-index', 1000);
	  return i;
	})(panel));
  };

  var fixedHeaderBody = function (config) {
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
  };

  var makeSticky = function (str) {
	str = str || onceZeroS;
	return layout(function ($el, context, c) {
	  $el.addClass('makeSticky');

	  var ctx = context.child({
		widthCss: stream.once('100%'),
		heightCss: stream.once('100%'),
	  });
	  var i = c(ctx);
	  stream.combine([
		windowScroll,
		str,
		context.top,
		context.topAccum,
		context.left,
		context.leftAccum,
	  ], function (scroll, diffAmount, top, topAccum, left, leftAccum) {
		if (top + topAccum > scroll + diffAmount) {
		  $el.css('position', 'absolute');
		  $el.css('transition', '');
		  $el.css('left', px(left));
		}
		else if (top + topAccum < scroll + diffAmount) {
		  var leftPosition = left + leftAccum;
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
  // // 	return div.all([
  // // 		componentName('stickyHeaderBody'),
  // // 		child(body1),
  // // 		child(body2),
  // // 		child(header),
  // // 		wireChildren(function (instance, context, body1I, body2I, headerI) {
  // // 			stream.pushAll(stream.map(stream.combine([body1I, body2I, headerI], function (i) {
  // // 				return i.minHeight;
  // // 			}), function () {
  // // 				var args = Array.prototype.slice.call(arguments);
  // // 				return args.reduce(add, 0);
  // // 			}), instance.minHeight);

  // // 			var fixedNow = false;

  // // 			return [{
  // // 				top: stream.once(0),
  // // 				left: stream.once(0),
  // // 				width: context.width,
  // // 				height: body1I.minHeight,
  // // 			}, {
  // // 				top: stream.combine([body1I.minHeight, headerI.minHeight], add),
  // // 				left: stream.once(0),
  // // 				width: context.width,
  // // 				height: body2I.minHeight,
  // // 			}, {
  // // 				top: stream.combine([body1I.minHeight, context.scroll, context.topAccum], function (mh, scroll, topAccum) {
  // // 					var $header = headerI.$el;
  // // 					mh = Math.floor(mh);
  // // 					if (mh > scroll + topAccum) {
  // // 						$header.css('position', 'absolute');
  // // 						$header.css('transition', '');
  // // 						if (fixedNow) {
  // // 							window.scrollTo(0, mh + topAccum);
  // // 						}
  // // 						fixedNow = false;
  // // 						return mh;
  // // 					}
  // // 					else if (mh < scroll + topAccum) {
  // // 						$header.css('position', 'fixed');
  // // 						setTimeout(function () {
  // // 							$header.css('transition', 'inherit');
  // // 						}, 20);
  // // 						if (!fixedNow) {
  // // 							window.scrollTo(0, mh + topAccum);
  // // 						}
  // // 						fixedNow = true;
  // // 						return topAccum;
  // // 					}
  // // 				}),
  // // 				left: stream.once(0),
  // // 				width: context.width,
  // // 				height: headerI.minHeight,
  // // 			}];
  // // 		}),
  // // 	]);
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

  var grid = function (config) {
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
		  var context = ctx.child({
			top: true,
			left: true,
			width: true,
			height: true,
		  });
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
			row.top = top;
			index += row.cells.length;
			top += row.height + config.padding;
		  });
		  if (config.bottomToTop) {
			rows = rows.slice(0).reverse();
		  }
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
  };

  var withMinWidthStream = function (getMinWidthStream) {
	return layout(function ($el, ctx, c) {
	  $el.addClass('withMinWidthStream');
	  var context = ctx.child();
	  var i = c(context);
	  return {
		minWidth: $.isFunction(getMinWidthStream) ? getMinWidthStream(i, context) : getMinWidthStream,
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
	return layout(function ($el, ctx, c) {
	  $el.addClass('withMinHeightStream');
	  var context = ctx.child();
	  var i = c(context);
	  var minHeightS = $.isFunction(getMinHeightStream) ? getMinHeightStream(i, context) : getMinHeightStream;
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
	  var context = ctx.child({
		height: true,
		top: true,
	  });
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
  // // 	distanceStream = distanceStream || stream.once(0);
  // // 	return withMinHeightStream(function (instance, context) {
  // // 		return stream.combine([instance.minHeight,
  // // 							   context.top,
  // // 							   context.topAccum,
  // // 							   distanceStream,
  // // 							   windowResize], function (mh, t, ta, distance) {
  // // 								   return Math.min(mh, window.innerHeight - t - ta - distance);
  // // 							   });
  // // 	}, c);
  // // };

  var largestWidthThatFits = function (config) {
	return layout(function ($el, ctx, cs) {
	  $el.addClass('largest-width-that-fits');
	  var is = cs.map(function (c) {
		return c(ctx.child());
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
  };

  var overlays = function (config) {
	return layout(function ($el, ctx, cs) {
	  $el.addClass('overlays');
	  var is = cs.map(function (c) {
		return c(ctx.child());
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
  };


  // // var table = function (config, css) {
  // // 	config = config || {};
  // // 	var padding = (config.padding || 0) * 2;
  // // 	return div.all(stream.map(css, function (cs) {
  // // 		return children(cs);
  // // 	})).all([
  // // 		componentName('table'),
  // // 		wireChildren(function () {
  // // 			var args = Array.prototype.slice.call(arguments);
  // // 			var instance = args[0];
  // // 			var context = args[1];
  // // 			var iss = args.slice(2);

  // // 			// we blindly assume all rows have the same number of columns

  // // 			// set table min width
  // // 			var maxMWs = stream.combine(iss.reduce(function (a, is) {
  // // 				stream.push(a, stream.combine(is.map(function (i) {
  // // 					return i.minWidth;
  // // 				}), function () {
  // // 					return Array.prototype.slice.call(arguments);
  // // 				}));
  // // 				return a;
  // // 			}, []), function () {
  // // 				var rowMWs = Array.prototype.slice.call(arguments);
  // // 				return rowMWs.reduce(function (a, rowMWs) {
  // // 					return stream.map(rowMWs, function (mw, i) {
  // // 						return Math.max(a[i] || 0, mw);
  // // 					});
  // // 				}, []);
  // // 			});
  // // 			stream.map(maxMWs, function (maxMWs) {
  // // 				var mw = maxMWs.reduce(function (a, mw) {
  // // 					return a + mw + padding;
  // // 				}, -padding);
  // // 				stream.push(instance.minWidth, mw);
  // // 			});

  // // 			// set table min height
  // // 			var rowMinHeights = iss.reduce(function (a, is) {
  // // 				stream.push(a, stream.combine(is.map(function (i) {
  // // 					return i.minHeight;
  // // 				}), function () {
  // // 					var args = Array.prototype.slice.call(arguments);
  // // 					return args.reduce(mathMax, 0);
  // // 				}));
  // // 				return a;
  // // 			}, []);
  // // 			stream.combine(rowMinHeights, function () {
  // // 				var mhs = Array.prototype.slice.call(arguments);
  // // 				var mh = mhs.reduce(function (a, mh) {
  // // 					return a + mh + padding;
  // // 				}, -padding);
  // // 				stream.push(instance.minHeight, mh);
  // // 			});

  // // 			return stream.map(rowMinHeights, function (mh, i) {
  // // 				return stream.map(iss[i], function (_, index) {
  // // 					return {
  // // 						width: stream.map(maxMWs, function (maxMWs) {
  // // 							return maxMWs[index];
  // // 						}),
  // // 						height: rowMinHeights[i],
  // // 						top: stream.combine(rowMinHeights.slice(0, i).concat([stream.once(0)]), function () {
  // // 							var mhs = Array.prototype.slice.call(arguments);
  // // 							return mhs.reduce(function (a, mh) {
  // // 								return a + mh + padding;
  // // 							}, -padding);
  // // 						}),
  // // 						left: stream.map(maxMWs, function (maxMWs) {
  // // 							return maxMWs.reduce(function (a, mw, mwI) {
  // // 								return a + (mwI < index ? mw + padding : 0);
  // // 							}, 0);
  // // 						}),
  // // 					};
  // // 				});
  // // 			});
  // // 		}),
  // // 	]);
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
	  return minHeight(size)(nothing);
	},
	v: function (size) {
	  return minWidth(size)(nothing);
	},
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


  var hcj = {
	color: {
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
	  alignHLeft: alignHLeft,
	  alignHMiddle: alignHMiddle,
	  alignHRight: alignHRight,
	  alignLRM: alignLRM,
	  alignTBM: alignTBM,
	  alignVBottom: alignVBottom,
	  alignVMiddle: alignVMiddle,
	  alignVTop: alignVTop,
	  all: all,
	  and: and,
	  backgroundColor: backgroundColor,
	  bar: bar,
	  border: border,
	  changeThis: changeThis,
	  clickThis: clickThis,
	  componentStream: componentStreamWithExit,
	  dropdownPanel: dropdownPanel,
	  element: element,
	  empty: empty,
	  grid: grid,
	  hoverColor: hoverColor,
	  keepAspectRatio: keepAspectRatio,
	  keydownThis: keydownThis,
	  keyupThis: keyupThis,
	  image: image,
	  largestWidthThatFits: largestWidthThatFits,
	  link: link,
	  linkTo: linkTo,
	  margin: margin,
	  maxHeightStream: withMaxHeightStream,
	  minHeight: minHeight,
	  minHeightStream: withMinHeightStream,
	  minHeightAtLeast: minHeightAtLeast,
	  minWidth: minWidth,
	  mousedownThis: mousedownThis,
	  mousemoveThis: mousemoveThis,
	  mouseoverThis: mouseoverThis,
	  mouseoutThis: mouseoutThis,
	  mouseupThis: mouseupThis,
	  nothing: nothing,
	  onThis: onThis,
	  overlays: overlays,
	  sideBySide: sideBySide,
	  slider: slider,
	  slideshow: slideshow,
	  stack: stack,
	  submitThis: submitThis,
	  tabs: tabs,
	  text: text,
	  wrap: wrap,
	},
	// Remember, elements are not components.  This is why they are
	// under 'el' and not 'c.'  If you want an empty component, use
	// 'c.empty'.
	element: {
	  a: a,
	  button: button,
	  div: div,
	  form: form,
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
	funcs: {
	  constant: constant,
	  id: id,
	  surplusWidth: {
		ignore: ignoreSurplusWidth,
		center: centerSurplusWidth,
		centerFirstRowThenAlignLeft: centerFirstRowThenAlignLeftSurplusWidth,
		evenlySplit: evenlySplitSurplusWidth,
		justify: justifySurplusWidth,
		giveToNth: giveToNth,
	  },
	  surplusHeight: {
		ignore: ignoreSurplusHeight,
		center: centerSurplusHeight,
		giveToNth: giveHeightToNth,
	  },
	},
	rootComponent: rootComponent,
	stream: stream,
	unit: {
	  px: px,
	},
	viewport: {
	  heightS: windowHeight,
	  widthS: windowWidth,
	},
  };

  window.hcj = hcj;
})();
