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

var stream = {
	create: function () {
		return {
			listeners: [],
			lastValue: undefined,
			ended: false,
		};
	},
	isStream: function (v) {
		return v &&
			v.hasOwnProperty('listeners') &&
			v.hasOwnProperty('lastValue') &&
			v.hasOwnProperty('ended');
	},
	once: function (v) {
		var s = stream.create();
		stream.push(s, v);
		return s;
	},
	push: function (s, v) {
		if (s.lastValue !== v) {
			s.lastValue = v;
			for (var i = 0; i < s.listeners.length; i++) {
				s.listeners[i](v);
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
			stream.push(out, f(s.lastValue, out.lastValue));
		}
		s.listeners.push(function (v) {
			stream.push(out, f(v, out.lastValue));
		});
		return out;
	},
	filter: function (s, f) {
		var out = stream.create();
		s.listeners.push(function (v) {
			f(v, out.push);
		});
		return stream;
	},
	onValue: function (s, f) {
		return stream.map(s, function (v) {
			f(v);
			return true;
		});
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
	end: function (s) {
		s.ended = true;
	},
	pushAll: function (source, target) {
		if (source.lastValue !== undefined) {
			stream.push(target, source.lastValue);
		}
		stream.onValue(source, function (v) {
			stream.push(target, v);
		});
	},
	combine: function (streams, f) {
		var arr = [];
		var out = stream.create();

		var running = false;
		var err = new Error();
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
					err;
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
	all: function (streams, f) {
		return stream.combine(streams, function () {
			f.apply(null, arguments);
			return true;
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
	fromPromise: function (p, initialValue) {
		var out = stream.never();
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
	updateWindowWidth();
};
var updateDomFunc = function ($el, prop, value) {
	if (updateDomEls.length === 0) {
		setTimeout(runDomFuncs);
	}
	updateDomEls.push($el);
	updateDomProps.push(prop);
	updateDomValues.push(value);
};

var el = function (name) {
	return function (build) {
		return function ($parent) {
			var $el = $(document.createElement(name));
			var context = {
				$el: $el,
				minWidth: stream.create(),
				minHeight: stream.create(),
				width: stream.create(),
				height: stream.create(),
				top: stream.create(),
				left: stream.create(),
				topAccum: stream.create(),
				leftAccum: stream.create(),
				scroll: stream.create(),
			};

			$el.css('pointer-events', 'initial')
				.css('position', 'absolute')
				.css('visibility', 'hidden');

			stream.onValue(context.top, function (t) {
				updateDomFunc($el, 'top', px(t));
			});
			stream.onValue(context.left, function (l) {
				updateDomFunc($el, 'left', px(l));
			});
			stream.onValue(context.width, function (w) {
				updateDomFunc($el, 'width', px(w));
			});
			stream.onValue(context.height, function (h) {
				// console.log($el);
				// console.log(h);
				updateDomFunc($el, 'height', px(h));
			});
			stream.all([
				context.width,
				context.height,
				context.top,
				context.left
			], function () {
				updateDomFunc($el, 'visibility', '');
			});

			var measureWidth = function (w) {
				var $sandbox = $('.sandbox');
				var $clone = $el.clone();
				$clone.css('width', px(w || ''))
					.css('height', '')
					.appendTo($sandbox);

				var width = $clone[0].scrollWidth;
				$clone.remove();

				stream.push(context.minWidth, width);
				return width;
			};

			var measureHeight = function () {
				stream.push(context.minHeight, function (w) {
					var $sandbox = $('.sandbox');
					var $clone = $el.clone();
					$clone.css('width', px(w))
						.css('height', '')
						.appendTo($sandbox);

					var height = parseInt($clone.css('height'));

					$clone.remove();

					return height;
				});
			};

			var unbuild = build(context, measureWidth, measureHeight) || id;
			context.destroy = function () {
				unbuild();
				$el.remove();
			};
			$el.appendTo($parent);

			return context;
		};
	};
};

var a = el('a');
var button = el('button');
var div = el('div');
var form = el('form');
var iframe = el('iframe');
var img = el('img');
var input = el('input');
var li = el('li');
var option = el('option');
var select = el('select');
var textarea = el('textarea');
var ul = el('ul');
var stream = stream || stream;
var apply = apply || apply;
var constant = constant || constant;
var curry = curry || curry;
var id = id || id;
var add = add || add;
var subtract = subtract || subtract;
var mathMax = mathMax || mathMax;
var mathMin = mathMin || mathMin;

var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');
var vw = unit('vw');

var windowWidth = stream.create();
var windowHeight = stream.create();
var updateWindowWidth = function () {
	stream.push(windowWidth, document.documentElement.clientWidth);
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


var build = function ($el, cs) {
	if ($.isArray(cs)) {
		return cs.map(function (c) {
			return build($el, c);
		});
	}
	else {
		return cs($el);
	}
};

var contextsRecurse = function (ctx, is, objs) {
	if ($.isArray(is)) {
		objs = objs || [];
		is.map(function (i, index) {
			return contextsRecurse(ctx, i, objs[index]);
		});
	}
	else {
		objs = objs || {};
		stream.pushAll(objs.width || ctx.width, is.width, true);
		stream.pushAll(objs.height || ctx.height, is.height);
		stream.pushAll(objs.left || stream.once(0), is.left);
		stream.pushAll(objs.top || stream.once(0), is.top);
		stream.pushAll(stream.combine([ctx.leftAccum, ctx.left], add), is.leftAccum);
		stream.pushAll(stream.combine([ctx.topAccum, ctx.top], add), is.topAccum);
		stream.pushAll(stream.combine([ctx.scroll, ctx.top], subtract), is.scroll);
	}
};

var contexts = function (ctx, is, objs) {
	objs = objs || {};
	if ($.isArray(is)) {
		if (!$.isArray(objs)) {
			objs = [{
				minWidth: objs.minWidth || is[0].minWidth,
				minHeight: objs.minHeight || is[0].minHeight,
			}, objs];
		}
		var toCtx = objs.splice(0, 1)[0];
		stream.pushAll(toCtx.minWidth, ctx.minWidth);
		stream.pushAll(toCtx.minHeight, ctx.minHeight);
		contextsRecurse(ctx, is, objs);
	}
	else {
		stream.pushAll(objs.minWidth || is.minWidth, ctx.minWidth);
		stream.pushAll(objs.minHeight || is.minHeight, ctx.minHeight);
		stream.pushAll(objs.width || ctx.width, is.width, true);
		stream.pushAll(objs.height || ctx.height, is.height);
		stream.pushAll(objs.left || stream.once(0), is.left);
		stream.pushAll(objs.top || stream.once(0), is.top);
		stream.pushAll(stream.combine([ctx.leftAccum, ctx.left], add), is.leftAccum);
		stream.pushAll(stream.combine([ctx.topAccum, ctx.top], add), is.topAccum);
		stream.pushAll(stream.combine([ctx.scroll, ctx.top], subtract), is.scroll);
	}
};

var layout = function (elArg, buildLayoutArg) {
	var el = buildLayoutArg ? elArg : div;
	var buildLayout = buildLayoutArg || elArg;
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return el(function (ctx) {
			ctx.$el.css('pointer-events', 'none');
			var is = build(ctx.$el, args);
			contexts(ctx, is, buildLayout.apply(null, [ctx].concat(is)));
		});
	};
};

var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};

var rootComponent = function (ctx) {
	stream.pushAll(windowWidth, ctx.width, true);
	stream.pushAll(stream.combine([
		ctx.width,
		ctx.minHeight,
	], function (w, mh) {
		return mh(w);
	}), ctx.height);
	stream.push(ctx.top, 0);
	stream.push(ctx.left, 0);
	stream.push(ctx.topAccum, 0);
	stream.push(ctx.leftAccum, 0);
	stream.push(windowScroll, ctx.scroll);
};

var color = function (c) {
	return $.extend({
		r: 0,
		g: 0,
		b: 0,
		a: 1,
	}, c);
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

var mapMinWidths = function (is) {
	return stream.combine(is.map(function (i) {
		return i.minWidth;
	}), function () {
		var args = Array.prototype.slice.call(arguments);
		return args;
	});
};
var mapMinHeights = function (is) {
	return stream.combine(is.map(function (i) {
		return i.minHeight;
	}), function () {
		var args = Array.prototype.slice.call(arguments);
		return args;
	});
};

var url = function (str) {
	return 'url("' + str + '")';
};

var and = function (f) {
	return function (c) {
		return function ($p) {
			var i = c($p);
			f(i);
			return i;
		};
	};
};
var $$ = function (f) {
	return function (c) {
		return function ($p) {
			var i = c($p);
			f(i.$el);
			return i;
		};
	};
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

var withMinWidth = function (mw) {
	return layout(function (ctx, i) {
		ctx.$el.addClass('withMinWidth');
		return {
			minWidth: stream.once(mw),
		};
	});
};
var withMinHeight = function (mh) {
	return layout(function (ctx, i) {
		ctx.$el.addClass('withMinHeight');
		return {
			minHeight: stream.once(constant(mh)),
		};
	});
};
var passthrough = function (f) {
	return layout(function (ctx) {
		ctx.$el.addClass('passthrough');
		f(ctx.$el);
	});
};
// var adjustMinSize = function (config) {
// 	return function (c) {
// 		return div.all([
// 			child(c),
// 			wireChildren(function (instance, context, i) {
// 				stream.pushAll(stream.map(i.minWidth, function (mw) {
// 					return config.mw(mw);
// 				}), instance.minWidth);
// 				stream.pushAll(stream.map(i.minHeight, function (mh) {
// 					return config.mh(mh);
// 				}), instance.minHeight);
// 				return [{
// 					top: stream.once(0),
// 					left: stream.once(0),
// 					width: context.width,
// 					height: context.height,
// 				}];
// 			}),
// 		]);
// 	};
// };
var link = $css('cursor', 'pointer');

var componentName = function (name) {
	return passthrough(function ($el) {
		$el.addClass(name);
	});
};

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
	return passthrough(function ($el) {
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

var withBackgroundColor = function (s, arg2) {
	// stream is an object
	if (!stream.isStream(s)) {
		s = stream.once({
			backgroundColor: s,
			fontColor: arg2,
		});
	}
	return passthrough(function ($el) {
		stream.map(s, function (colors) {
			var bc = colors.backgroundColor;
			var fc = colors.fontColor;
			$el.css('color', colorString(fc))
				.css('background-color', colorString(bc));
		});
	});
};
var withFontColor = function (fc) {
	return passthrough(function ($el) {
		$el.css('color', colorString(fc));
	});
};
var hoverColor = function (backgroundColor, hoverBackgroundColor, fontColor, hoverFontColor) {
	backgroundColor = colorString(backgroundColor || transparent);
	hoverBackgroundColor = colorString(hoverBackgroundColor || backgroundColor);
	fontColor = colorString(fontColor || black);
	hoverFontColor = colorString(hoverFontColor || fontColor);
	return hoverThis(function (h, $el) {
		$el.css('background-color', h ? hoverBackgroundColor : backgroundColor);
		$el.css('color', h ? hoverFontColor : fontColor);
	});
};

var keepAspectRatioCorner = function (config) {
	return layout(function (ctx, i) {
		ctx.$el.addClass('keepAspectRatioCorner');
		var aspectRatio = stream.combine([
			i.minWidth,
			i.minHeight,
		], function (w, h) {
			return w / h(w);
		});
		var props = stream.combine([
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
		});
		return [{}, {
			top: stream.prop(props, 'top'),
			left: stream.prop(props, 'left'),
			width: stream.prop(props, 'width'),
			height: stream.prop(props, 'height'),
		}];
	});
};

var keepAspectRatio = keepAspectRatioCorner();
var keepAspectRatioFill = keepAspectRatioCorner({
	fill: true,
});

// var image = function (config) {
// 	var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
// 	return img.all([
// 		componentName('image'),
// 		$css('pointer-events', 'all'),
// 		function (i, context) {
// 			stream.map(srcStream, function (src) {
// 				i.$el.prop('src', src);
// 			});
// 			i.$el.css('display', 'none');

// 			i.$el.on('load', function () {
// 				i.$el.css('display', '');
// 				var nativeWidth = i.$el[0].naturalWidth;
// 				var nativeHeight = i.$el[0].naturalHeight;
// 				var aspectRatio = nativeWidth / nativeHeight;

// 				var initialMinWidth =
// 					config.minWidth ||
// 					config.chooseWidth ||
// 					nativeWidth;
// 				var initialMinHeight =
// 					config.minHeight ||
// 					config.chooseHeight ||
// 					(initialMinWidth / aspectRatio);
// 				stream.push(i.minWidth, initialMinWidth);
// 				stream.push(i.minHeight, constant(initialMinHeight));

// 				var minWidth, minHeight;

// 				if (config.minWidth !== undefined && config.minWidth !== null) {
// 					minWidth = config.minWidth;
// 					minHeight = minWidth / aspectRatio;
// 					stream.push(i.minWidth, minWidth);
// 					stream.push(i.minHeight, constant(minHeight));
// 				}
// 				else if (config.minHeight !== undefined && config.minHeight !== null) {
// 					minHeight = config.minHeight;
// 					minWidth = minHeight * aspectRatio;
// 					stream.push(i.minWidth, minWidth);
// 					stream.push(i.minHeight, constant(minHeight));
// 				}
// 				else if (config.useNativeWidth) {
// 					stream.push(i.minWidth, nativeWidth);
// 					stream.push(i.minHeight, constant(nativeHeight));
// 				}
// 				else {
// 					stream.push(i.minWidth, nativeWidth);
// 				}
// 				if (!config.useNativeWidth) {
// 					stream.pushAll(stream.map(context.width, function (width) {
// 						return constant(width / aspectRatio);
// 					}), i.minHeight);
// 				}
// 			});
// 		},
// 	]);
// };

var linkTo = function (href) {
	return layout(a, function (ctx) {
		ctx.$el.prop('href', href);
	});
};

var nothing = div(function (ctx) {
	stream.push(ctx.minWidth, 0);
	stream.push(ctx.minHeight, constant(0));
});

var text = function (text, minWidth) {
	if (!stream.isStream(text)) {
		text = stream.once(text);
	}
	return div(function (ctx, measureWidth, measureHeight) {
		measureHeight();
		stream.onValue(text, function (str) {
			ctx.$el.html(str);
			measureWidth();
		});
	});
};
// var faIcon = function (str) {
// 	return text('<i class="fa fa-' + str + '"></i>');
// };

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
var evenSplitSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	var widthPerCol = surplusWidth / positions.length;
	positions.map(function (position, i) {
		position.width += widthPerCol;
		position.left += i * widthPerCol;
	});
	return positions;
};
// don't read this function, please
var evenSplitSurplusWidthWithMinPerRow = function (minPerRow) {
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
			return evenSplitSurplusWidth(gridWidth, positions);
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
// var slideshow = function (config, cs) {
// 	config.padding = config.padding || 0;
// 	config.leftTransition = config.leftTransition || 'none';
// 	config.alwaysFullWidth = config.alwaysFullWidth || false;
// 	return div.all([
// 		$css('overflow', 'hidden'),
// 		componentName('slideshow'),
// 		children(cs.map(function (c) {
// 			return c.all([
// 				$css('transition', 'left ' + config.leftTransition),
// 			]);
// 		})),
// 		wireChildren(function (instance, context, is) {
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

// 			stream.onValue(allMinWidths, function (mws) {
// 				stream.push(instance.minWidth, mws.reduce(add, config.padding * (is.length - 1)));
// 			});

// 			var contexts = is.map(function () {
// 				return {
// 					top: stream.once(0),
// 					left: stream.create(),
// 					width: stream.create(),
// 					height: context.height,};});

// 			stream.all([
// 				config.selectedS,
// 				context.width,
// 				allMinWidths,
// 				allMinHeights,
// 			], function (selected, width, mws, mhs) {
// 				var selectedLeft = 0;
// 				var selectedWidth = 0;
// 				var left = 0;
// 				var positions = mws.map(function (mw, index) {
// 					mw = config.alwaysFullWidth ? width : mw;
// 					if (selected === index) {
// 						selectedLeft = left + config.padding * index;
// 						selectedWidth = mw;
// 					}
// 					var position = {
// 						left: left + config.padding * index,
// 						width: mw,
// 					};
// 					left += mw;
// 					return position;
// 				});
// 				var dLeft = (width - selectedWidth) / 2 - selectedLeft;
// 				positions.map(function (position) {
// 					position.left += dLeft;
// 				});

// 				positions.map(function (position, index) {
// 					var ctx = contexts[index];
// 					stream.push(ctx.left, position.left);
// 					stream.push(ctx.width, position.width);
// 				});

// 				stream.push(instance.minHeight, constant(mhs.map(function (mh, i) {
// 					return mh(positions[i].width);
// 				}).reduce(mathMax, 0)));
// 			});

// 			return [contexts];
// 		}),
// 	]);
// };
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
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

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

// 			stream.all([
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
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	return layout(function (ctx, is) {
		var allMinWidths = mapMinWidths(is);
		var allMinHeights = mapMinHeights(is);

		var contexts = is.map(function () {
			return {
				left: stream.create(),
				width: stream.create(),
			};
		});

		stream.all([
			ctx.width,
			allMinWidths,
			allMinHeights,
		], function (width, mws, mhs) {
			var left = 0;
			var positions = mws.map(function (mw, index) {
				var position = {
					left: left + config.padding * index,
					width: mw,
				};
				left += mw;
				return position;
			});
			positions = config.handleSurplusWidth(width, positions);

			positions.map(function (position, index) {
				var ctx = contexts[index];
				stream.push(ctx.left, position.left);
				stream.push(ctx.width, position.width);
			});
		});

		return [{
			minWidth: stream.map(allMinWidths, function (mws) {
				return mws.reduce(add, config.padding * (is.length - 1));
			}),
			minHeight: stream.map(allMinHeights, function (mhs) {
				return function (w) {
					return mhs.map(apply(w)).reduce(mathMax, 0);
				};
			}),
		}, contexts];
	});
};

// var slider = function (config, cs) {
// 	config = config || {};
// 	config.leftTransition = config.leftTransition || '0s';
// 	var grabbedS = stream.once(false);
// 	var edge = {
// 		left: 'left',
// 		right: 'right',
// 	};
// 	var stateS = stream.once({
// 		index: 0,
// 		edge: 'left',
// 	});
// 	var xCoord = 0;
// 	return div.all([
// 		componentName('slider'),
// 		$css('overflow-x', 'hidden'),
// 		$css('cursor', 'move'),
// 		children(cs),
// 		wireChildren(function (instance, context, is) {
// 			var allMinWidths = mapMinWidths(is);
// 			var allMinHeights = mapMinHeights(is);

// 			var totalMinWidthS = stream.map(allMinWidths, function (mws) {
// 				return mws.reduce(add, 0);
// 			});
// 			stream.onValue(allMinWidths, function (mws) {
// 				stream.push(instance.minWidth, mws.reduce(mathMax, 0));
// 			});

// 			stream.combine([
// 				allMinWidths,
// 				allMinHeights,
// 			], function (mws, mhs) {
// 				stream.push(instance.minHeight, constant(mhs.map(function (mh, i) {
// 					return mh(mws[i]);
// 				}).reduce(mathMax, 0)));
// 			});

// 			var leftS = stream.combine([
// 				context.width,
// 				allMinWidths,
// 				stateS,
// 				grabbedS
// 			], function (width, mws, state, grabbed) {
// 				// configure left to be the left parameter of the first article in the slider
// 				var left = state.edge === 'left' ? 0 : width; // would love to case split
// 				mws.map(function (mw, index) {
// 					if (index < state.index) {
// 						left -= mw;
// 					}
// 					if (state.edge === 'right' && index === state.index) {
// 						left -= mw;
// 					}
// 				});
// 				if (grabbed !== false) {
// 					left += grabbed;
// 				}
// 				return left;
// 			});

// 			var leftsS = stream.combine([
// 				allMinWidths,
// 				leftS,
// 			], function (mws, left) {
// 				return mws.reduce(function (acc, v) {
// 					acc.arr.push(acc.lastValue);
// 					acc.lastValue += v;
// 					return acc;
// 				}, {
// 					arr: [],
// 					lastValue: left,
// 				}).arr;
// 			});

// 			instance.$el.css('user-select', 'none');
// 			instance.$el.on('mousedown', function (ev) {
// 				ev.preventDefault();
// 				stream.push(grabbedS, 0);
// 				is.map(function (i) {
// 					i.$el.css('transition', 'left 0s');
// 				});
// 			});
// 			var release = function (ev) {
// 				is.map(function (i) {
// 					i.$el.css('transition', 'left ' + config.leftTransition);
// 				});
// 				var mws = allMinWidths.lastValue;
// 				var width = context.width.lastValue;
// 				var grabbed = grabbedS.lastValue;
// 				if (!grabbed) {
// 					return;
// 				}
// 				var left = leftS.lastValue;
// 				// array of sums of min widths
// 				var edgeScrollPoints = mws.reduce(function (a, mw) {
// 					var last = a[a.length - 1];
// 					a.push(last - mw);
// 					return a;
// 				}, [0]);
// 				var closest = edgeScrollPoints.reduce(function (a, scrollPoint, index) {
// 					var leftDistanceHere = Math.abs(scrollPoint - left);
// 					var rightDistanceHere = Math.abs(scrollPoint - (left - width));
// 					return {
// 						left: leftDistanceHere < a.left.distance ? {
// 							distance: leftDistanceHere,
// 							index: index,
// 						} : a.left,
// 						right: rightDistanceHere < a.right.distance ? {
// 							distance: rightDistanceHere,
// 							index: index - 1,
// 						} : a.right,
// 					};
// 				}, {
// 					left: {
// 						distance: Number.MAX_VALUE,
// 						index: -1,
// 					},
// 					right: {
// 						distance: Number.MAX_VALUE,
// 						index: -1,
// 					},
// 				});
// 				if (closest.left.distance <= closest.right.distance) {
// 					stream.push(stateS, {
// 						index: closest.left.index,
// 						edge: 'left',
// 					});
// 				}
// 				else {
// 					stream.push(stateS, {
// 						index: closest.right.index,
// 						edge: 'right',
// 					});
// 				}
// 				stream.push(grabbedS, false);
// 				ev.preventDefault();
// 			};
// 			instance.$el.on('mouseup', release);
// 			instance.$el.on('mouseout', release);
// 			instance.$el.on('mousemove', function (ev) {
// 				var grabbed = grabbedS.lastValue;
// 				var totalMinWidth = totalMinWidthS.lastValue;
// 				var width = context.width.lastValue;
// 				var left = leftS.lastValue;
// 				if (grabbed !== false) {
// 					var dx = ev.clientX - xCoord;
// 					var left2 = left + dx;
// 					left2 = Math.min(0, left2);
// 					if (totalMinWidth > width) {
// 						left2 = Math.max(width - totalMinWidth, left2);
// 					}
// 					dx = left2 - left;
// 					grabbed = grabbed + dx;
// 					stream.push(grabbedS, grabbed);
// 				}
// 				xCoord = ev.clientX;
// 			});

// 			return [is.map(function (i, index) {
// 				return {
// 					top: stream.once(0),
// 					left: stream.map(leftsS, function (lefts) {
// 						return lefts[index];
// 					}),
// 					width: i.minWidth,
// 					height: context.height,
// 				};
// 			})];
// 		}),
// 	]);
// };

var stack = function (config) {
	config = config || {};
	config.padding = config.padding || 0;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	config.transition = config.transition || 0;
	var transition = config.transition + 's';
	return layout(function (ctx, is) {
		var allMinWidths = mapMinWidths(is);
		var allMinHeights = mapMinHeights(is);
		var contexts = is.map(function () {
			return {
				top: stream.create(),
				height: stream.create(),
			};
		});
		is.map(function (i) {
			i.$el.css('transition', 'height ' + transition + ', top ' + transition);
		});
		stream.all([
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
			positions = config.handleSurplusHeight(height, positions);
			positions.map(function (position, index) {
				var context = contexts[index];
				stream.push(context.top, position.top);
				stream.push(context.height, position.height);
			});
		});
		return [{
			minWidth: stream.map(allMinWidths, function (mws) {
				return mws.reduce(mathMax, 0);
			}),
			minHeight: stream.map(allMinHeights, function (mhs) {
				return function (w) {
					return mhs.map(apply(w)).reduce(add, config.padding * (is.length - 1));
				};
			}),
		}, contexts];
	});
};

// var intersperse = function (arr, v) {
// 	var result = [];
// 	stream.map(arr, function (el) {
// 		stream.push(result, el);
// 		stream.push(result, v);
// 	});
// 	result.pop();
// 	return result;
// };


// var adjustPosition = function (amount, c) {
// 	var top = amount.top || 0;
// 	var left = amount.left || 0;
// 	return div.all([
// 		componentName('adjustPosition'),
// 		child(c),
// 		wireChildren(function (instance, context, i) {
// 			stream.pushAll(i.minWidth, instance.minWidth);
// 			stream.pushAll(i.minHeight, instance.minHeight);
// 			return [{
// 				top: stream.map(context.top, function (t) {
// 					return t + top;
// 				}),
// 				left: stream.map(context.left, function (l) {
// 					return l + left;
// 				}),
// 				width: context.width,
// 				height: context.height,
// 			}];
// 		}),
// 	]);
// };

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
	return layout(function (ctx, i) {
		ctx.$el.addClass('margin');
		return [{
			minWidth: stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}),
			minHeight: stream.map(i.minHeight, function (mh) {
				return function (w) {
					return mh(w) + top + bottom;
				};
			}),
		}, {
			top: stream.once(top),
			left: stream.once(left),
			width: stream.map(ctx.width, function (w) {
				return w - left - right;
			}),
			height: stream.map(ctx.height, function (h) {
				return h - top - bottom;
			}),
		}];
	});
};

// // TODO: change this name quick, before there are too many
// // dependencies on it
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
	return layout(function (ctx, i) {
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
			width: stream.combine([
				ctx.width,
				leftS,
				rightS,
			], function (w, l, r) {
				return w - l - r;
			}),
			height: stream.combine([
				ctx.height,
				topS,
				bottomS,
			], function (h, t, b) {
				return h - t - b;
			}),
			top: topS,
			left: leftS,
		};
	});
};

var alignLRM = function (config) {
	config = config || {};
	config.transition = (config.transition || 0) + 's';
	return function (lrm) {
		return layout(function (ctx, l, r, m) {
			ctx.$el.addClass('alignLRM');
			l.$el.css('transition', 'left ' + config.transition);
			r.$el.css('transition', 'left ' + config.transition);
			m.$el.css('transition', 'left ' + config.transition);
			return [{
				minWidth: stream.combine([
					l.minWidth,
					r.minWidth,
					m.minWidth,
				], function (l, r, m) {
					return [l, r, m].reduce(add);
				}),
				minHeight: stream.combine([
					l.minHeight,
					r.minHeight,
					m.minHeight,
				], function (l, r, m) {
					return function (w) {
						return [l, r, m].map(apply(w)).reduce(mathMax);
					};
				}),
			}, {
				width: l.minWidth,
			}, {
				width: r.minWidth,
				left: stream.combine([
					r.minWidth,
					ctx.width,
				], function (mw, w) {
					return w - mw;
				}),
			}, {
				width: m.minWidth,
				left: stream.combine([
					m.minWidth,
					ctx.width,
				], function (mw, w) {
					return (w - mw) / 2;
				}),
			}];
		})(lrm.l || nothing, lrm.r || nothing, lrm.m || nothing);
	};
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
		return layout(function (ctx, t, b, m) {
			if (config.ctx) {
				config.ctx(ctx, t, b, m);
			}
			ctx.$el.addClass('alignTBM');
			t.$el.css('transition', 'top ' + config.transition);
			b.$el.css('transition', 'top ' + config.transition);
			m.$el.css('transition', 'top ' + config.transition);
			var heightStream = function (i) {
				return stream.combine([
					ctx.width,
					i.minHeight,
				], function (w, mh) {
					return mh(w);
				});
			};
			return [{
				minWidth: stream.combine([
					t.minWidth,
					b.minWidth,
					m.minWidth,
				], function (t, b, m) {
					return [t, b, m].reduce(mathMax);
				}),
				minHeight: stream.combine([
					t.minHeight,
					b.minHeight,
					m.minHeight,
				], function (t, b, m) {
					return function (w) {
						return [t, b, m].map(apply(w)).reduce(add);
					};
				}),
			}, {
				height: heightStream(t),
			}, {
				height: heightStream(b),
				top: stream.combine([
					b.minHeight,
					ctx.height,
					ctx.width,
				], function (mh, h, w) {
					return h - mh(w);
				}),
			}, {
				height: heightStream(m),
				top: stream.combine([
					m.minHeight,
					ctx.height,
					ctx.width,
				], function (mh, h, w) {
					return (h - mh(w)) / 2;
				}),
			}];
		})(tbm.t || nothing, tbm.b || nothing, tbm.m || nothing);
	};
};

// var invertOnHover = function (c) {
// 	var invert = stream.once(false, 'invert');

// 	var choose = function (stream1, stream2) {
// 		return stream.combine([invert, stream1, stream2], function (i, v1, v2) {
// 			return i ? v2 : v1;
// 		}, 'choose stream');
// 	};


// 	return div.all([
// 		componentName('invert-on-hover'),
// 		child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
// 		wireChildren(function (instance, context, i) {
// 			stream.pushAll(i.minHeight, instance.minHeight);
// 			stream.pushAll(i.minWidth, instance.minWidth);
// 			return [{
// 				backgroundColor: choose(context.backgroundColor, context.fontColor),
// 				fontColor: choose(context.fontColor, context.backgroundColor),
// 				top: stream.once(0),
// 				left: stream.once(0),
// 				width: context.width,
// 				height: context.height,
// 			}];
// 		}),
// 		mouseoverThis(function () {
// 			stream.push(invert, true);
// 		}),
// 		mouseoutThis(function () {
// 			stream.push(invert, false);
// 		}),
// 	]);
// };

var border = function (colorS, amount, style) {
	var left = amount.left || amount.all || 0;
	var right = amount.right || amount.all || 0;
	var top = amount.top || amount.all || 0;
	var bottom = amount.bottom || amount.all || 0;
	var radius = amount.radius || 0;
	style = style || 'solid';

	if (!stream.isStream(colorS)) {
		colorS = stream.once(colorS);
	}

	var colorStringS = stream.map(colorS, colorString);

	return layout(function (ctx, i) {
		ctx.$el.addClass('border');
		i.$el.css('border-radius', px(radius));
		stream.map(colorStringS, function (colorstring) {
			i.$el.css('border-left', px(left) + ' ' + style + ' ' + colorstring)
				.css('border-right', px(right) + ' ' + style + ' ' + colorstring)
				.css('border-top', px(top) + ' ' + style + ' ' + colorstring)
				.css('border-bottom', px(bottom) + ' ' + style + ' ' + colorstring);
		});

		return [{
			minWidth: stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}),
			minHeight: stream.map(i.minHeight, function (mh) {
				return function (w) {
					return mh(w) + top + bottom;
				};
			}),
		}, {
			top: stream.once(0),
			left: stream.once(0),
			width: stream.map(ctx.width, function (w) {
				return w - left - right;
			}),
			height: stream.map(ctx.height, function (h) {
				return h - top - bottom;
			}),
		}];
	});
};

var componentStream = function (cStream) {
	var error = new Error();
	return div(function (ctx) {
		ctx.$el.addClass('componentStream');
		var i;
		var iStream = stream.reduce(cStream, function (c, i) {
			if (i) {
				i.destroy();
			}
			i = c(ctx.$el);
			contexts(ctx, i);
			return i;
		});
		return function () {
			if (i) {
				i.destroy();
			}
		};
	});
};

// var componentStreamWithExit = function (cStream, exit) {
// 	var i;
// 	return div.all([
// 		componentName('component-stream'),
// 		function (instance, context) {
// 			var localCStream = stream.create();
// 			stream.pushAll(cStream, localCStream);
// 			stream.map(localCStream, function (c) {
// 				var ctx = instance.newCtx();
// 				stream.push(ctx.top, 0);
// 				stream.push(ctx.left, 0);
// 				stream.pushAll(context.width, ctx.width);
// 				stream.pushAll(context.height, ctx.height);

// 				var instanceC = function (c) {
// 					if (i) {
// 						(function (i) {
// 							setTimeout(function () {
// 								exit(i).then(function () {
// 									i.destroy();
// 								});
// 							});
// 						})(i);
// 					}
// 					i = c.create(ctx);
// 					i.$el.css('transition', 'inherit');
// 					stream.pushAll(i.minWidth, instance.minWidth);
// 					stream.pushAll(i.minHeight, instance.minHeight);
// 				};
// 				if (c.then) {
// 					c.then(function (c) {
// 						instanceC(c);
// 					}, function (error) {
// 						console.error('child components failed to load');
// 						console.log(error);
// 					});
// 				}
// 				else {
// 					instanceC(c);
// 				}
// 			});
// 			return function () {
// 				stream.end(localCstream);
// 				if (i) {
// 					i.destroy();
// 				}
// 			};
// 		},
// 	]);
// };

var promiseComponent = function (cP) {
	var s = stream.once(nothing);
	Q(cP).then(function (c) {
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

// var modalDialog = function (c) {
// 	return function (s, transition) {
// 		var open = stream.once(false);
// 		stream.pushAll(s, open);

// 		transition = transition || 0;

// 		return div.all([
// 			$css('z-index', 100),
// 			componentName('toggle-height'),
// 			child(c),
// 			wireChildren(function (instance, context, i) {
// 				stream.push(instance.minWidth, 0);
// 				stream.push(instance.minHeight, 0);

// 				var $el = i.$el;
// 				$el.css('position', 'fixed');
// 				$el.css('transition', $el.css('transition') + ', opacity ' + transition + 's');
// 				$el.css('display', 'none');
// 				$el.css('pointer-events', 'initial');

// 				stream.onValue(open, function (on) {
// 					if (on) {
// 						$el.css('display', '');
// 						setTimeout(function () {
// 							$el.css('opacity', 1);
// 						}, 100);
// 					}
// 					else {
// 						$el.css('opacity', 0);
// 						setTimeout(function () {
// 							$el.css('display', 'none');
// 						}, transition * 1000);
// 					}
// 				});

// 				return [{
// 					width: stream.map(windowWidth, function () {
// 						return window.innerWidth;
// 					}),
// 					height: windowHeight,
// 					left: stream.once(0),
// 					top: stream.once(0),
// 				}];
// 			}),
// 		]);
// 	};
// };

// var toggleHeight = function (s) {
// 	var open = stream.once(false);
// 	stream.pushAll(s, open);
// 	return function (c) {
// 		return div.all([
// 			$css('overflow', 'hidden'),
// 			componentName('toggle-height'),
// 			child(c),
// 			wireChildren(function (instance, context, i) {
// 				stream.pushAll(i.minWidth, instance.minWidth);
// 				stream.pushAll(stream.combine([i.minHeight, open], function (mh, onOff) {
// 					return onOff ? mh : 0;
// 				}), instance.minHeight);
// 				return [{
// 					top: stream.once(0),
// 					left: stream.once(0),
// 					width: context.width,
// 					height: context.height,
// 				}];
// 			}),
// 		]);
// 	};
// };

// var dropdownPanel = function (source, panel, onOff, config) {
// 	config = config || {};
// 	config.transition = config.transition || "0.5s";
// 	return div.all([
// 		componentName('dropdown-panel'),
// 		child(div.all([
// 			child(panel),
// 			wireChildren(function (instance, context, i) {
// 				stream.pushAll(i.minWidth, instance.minWidth);
// 				stream.pushAll(i.minHeight, instance.minHeight);
// 				i.$el.css('transition', 'top ' + config.transition);
// 				instance.$el.css('pointer-events', 'none');
// 				i.$el.css('pointer-events', 'initial');
// 				i.$el.css('z-index', '1000');
// 				return [{
// 					width: context.width,
// 					height: i.minHeight,
// 					top: stream.combine([onOff, i.minHeight], function (on, mh) {
// 						return on ? 0 : -mh;
// 					}),
// 					left: stream.once(0),
// 				}];
// 			}),
// 			$css('overflow', 'hidden'),
// 		])),
// 		child(source),
// 		wireChildren(function (instance, context, iPanel, iSource) {
// 			stream.pushAll(stream.combine([
// 				iPanel.minWidth,
// 				iSource.minWidth,
// 			], Math.max), instance.minWidth);
// 			stream.pushAll(iSource.minHeight, instance.minHeight);
// 			if (config.panelHeightS) {
// 				stream.pushAll(iPanel.minHeight, config.panelHeightS);
// 			}
// 			return [{
// 				width: context.width,
// 				height: iPanel.minHeight,
// 				top: iSource.minHeight,
// 				left: stream.once(0),
// 			}, {
// 				width: context.width,
// 				height: iSource.minHeight,
// 				top: stream.once(0),
// 				left: stream.once(0),
// 			}];
// 		}),
// 	]);
// };

// var fixedHeaderBody = function (config, header, body) {
// 	config.transition = config.transition || "0.5s";
// 	return div.all([
// 		componentName('fixedHeaderBody'),
// 		child(body),
// 		child(header),
// 		wireChildren(function (instance, ctx, bodyI, headerI) {
// 			headerI.$el.css('position', 'fixed');

// 			setTimeout(function () {
// 				headerI.$el.css('transition', 'height ' + config.transition);
// 				bodyI.$el.css('transition', 'top ' + config.transition);
// 			});

// 			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
// 				return i.minHeight;
// 			}), function () {
// 				var args = Array.prototype.slice.call(arguments);
// 				return args.reduce(add, 0);
// 			}), instance.minHeight);

// 			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
// 				return i.minWidth;
// 			}), function () {
// 				var args = Array.prototype.slice.call(arguments);
// 				return args.reduce(mathMax, 0);
// 			}), instance.minWidth);

// 			return [{
// 				top: headerI.minHeight,
// 				left: stream.once(0),
// 				width: ctx.width,
// 				height: bodyI.minHeight,
// 			}, {
// 				top: stream.once(0),
// 				left: stream.once(0),
// 				width: ctx.width,
// 				height: headerI.minHeight,
// 			}];
// 		}),
// 	]);
// };

// var makeSticky = function (c) {
// 	return div.all([
// 		componentName('stickyHeaderBody'),
// 		child(c),
// 		wireChildren(function (instance, context, i) {
// 			stream.pushAll(i.minWidth, instance.minWidth);
// 			stream.pushAll(i.minHeight, instance.minHeight);

// 			return [{
// 				top: stream.once(0),
// 				left: stream.combine([
// 					i.minHeight,
// 					context.scroll,
// 					context.top,
// 					context.left,
// 					context.leftAccum,
// 				], function (mh, scroll, top, left, leftAccum) {
// 					var $el = i.$el;
// 					if (top > scroll) {
// 						$el.css('position', 'absolute');
// 						$el.css('transition', '');
// 						return 0;
// 					}
// 					else if (top < scroll) {
// 						var leftPosition = left + leftAccum;
// 						$el.css('position', 'fixed');
// 						$el.css('left', px(leftPosition));
// 						setTimeout(function () {
// 							$el.css('transition', 'inherit');
// 						}, 20);
// 						return leftPosition;
// 					}
// 				}),
// 				width: context.width,
// 				height: context.height,
// 			}];
// 		}),
// 	]);
// };

// var stickyHeaderBody = function (body1, header, body2) {
// 	return div.all([
// 		componentName('stickyHeaderBody'),
// 		child(body1),
// 		child(body2),
// 		child(header),
// 		wireChildren(function (instance, context, body1I, body2I, headerI) {
// 			stream.pushAll(stream.map(stream.combine([body1I, body2I, headerI], function (i) {
// 				return i.minHeight;
// 			}), function () {
// 				var args = Array.prototype.slice.call(arguments);
// 				return args.reduce(add, 0);
// 			}), instance.minHeight);

// 			var fixedNow = false;

// 			return [{
// 				top: stream.once(0),
// 				left: stream.once(0),
// 				width: context.width,
// 				height: body1I.minHeight,
// 			}, {
// 				top: stream.combine([body1I.minHeight, headerI.minHeight], add),
// 				left: stream.once(0),
// 				width: context.width,
// 				height: body2I.minHeight,
// 			}, {
// 				top: stream.combine([body1I.minHeight, context.scroll, context.topAccum], function (mh, scroll, topAccum) {
// 					var $header = headerI.$el;
// 					mh = Math.floor(mh);
// 					if (mh > scroll + topAccum) {
// 						$header.css('position', 'absolute');
// 						$header.css('transition', '');
// 						if (fixedNow) {
// 							window.scrollTo(0, mh + topAccum);
// 						}
// 						fixedNow = false;
// 						return mh;
// 					}
// 					else if (mh < scroll + topAccum) {
// 						$header.css('position', 'fixed');
// 						setTimeout(function () {
// 							$header.css('transition', 'inherit');
// 						}, 20);
// 						if (!fixedNow) {
// 							window.scrollTo(0, mh + topAccum);
// 						}
// 						fixedNow = true;
// 						return topAccum;
// 					}
// 				}),
// 				left: stream.once(0),
// 				width: context.width,
// 				height: headerI.minHeight,
// 			}];
// 		}),
// 	]);
// };


// var grid = function (config, cs) {
// 	config.padding = config.padding || 0;
// 	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
// 	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
// 	config.maxPerRow = config.maxPerRow || 0;

// 	return padding(config.outerGutter ? config.padding : 0, div.all([
// 		componentName('grid'),
// 		children(cs),
// 		wireChildren(function (instance, context, is) {
// 			if (is.length === 0) {
// 				stream.push(instance.minWidth, 0);
// 				stream.push(instance.minHeight, 0);
// 			}
// 			var minWidthsS = stream.combine(is.map(function (i) {
// 				return i.minWidth;
// 			}), function () {
// 				return Array.prototype.slice.call(arguments);
// 			});
// 			var minHeightsS = stream.combine(is.map(function (i) {
// 				return i.minHeight;
// 			}), function () {
// 				return Array.prototype.slice.call(arguments);
// 			});

// 			// todo: fix interaction of allSameWidth and useFullWidth
// 			stream.pushAll(stream.map(minWidthsS, function (mws) {
// 				return mws.reduce(function (a, mw) {
// 					return config.useFullWidth ? a + mw + config.padding : Math.max(a, mw) + config.padding;
// 				}, -config.padding);
// 			}), instance.minWidth);

// 			var contexts = is.map(function (i) {
// 				return {
// 					top: stream.create(),
// 					left: stream.create(),
// 					width: stream.create(),
// 					height: stream.create(),
// 				};
// 			});

// 			var rowsStream = stream.combine([
// 				context.width,
// 				minWidthsS], function (gridWidth, mws) {
// 					if (config.allSameWidth) {
// 						var maxMW = mws.reduce(mathMax, 0);
// 						// thank you, keenan simons
// 						for (var ii = 0; ii < mws.length; ii++) {
// 							mws[ii] = maxMW;
// 						}
// 					}
// 					var blankRow = function () {
// 						return {
// 							cells: [],
// 							contexts: [],
// 							height: 0,
// 						};
// 					};

// 					var rowsAndCurrentRow = is.reduce(function (a, i, index) {
// 						var rows = a.rows;
// 						var currentRow = a.currentRow;

// 						var mw = mws[index];
// 						var widthUsedThisRow = currentRow.cells.reduce(function (a, b) {
// 							return a + b + config.padding;
// 						}, 0);
// 						var widthNeeded = Math.min(mw, gridWidth);

// 						if ((config.maxPerRow > 0 &&
// 							currentRow.cells.length === config.maxPerRow) ||
// 							(widthNeeded > 0 &&
// 							 widthNeeded + widthUsedThisRow > gridWidth)) {
// 							rows.push(currentRow);
// 							currentRow = blankRow();
// 						}

// 						currentRow.cells.push(widthNeeded);
// 						currentRow.contexts.push(contexts[index]);

// 						return {
// 							rows: rows,
// 							currentRow: currentRow,
// 						};
// 					}, {
// 						rows: [],
// 						currentRow: blankRow(),
// 					});
// 					var rows = rowsAndCurrentRow.rows;
// 					rows.push(rowsAndCurrentRow.currentRow);

// 					rows.map(function (row, i) {
// 						var widthUsed = 0;
// 						var positions = row.cells.map(function (widthNeeded) {
// 							var position = {
// 								left: widthUsed,
// 								width: widthNeeded,
// 							};
// 							widthUsed += widthNeeded + config.padding;
// 							return position;
// 						});
// 						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
// 						positions.map(function (position, index) {
// 							var ctx = row.contexts[index];
// 							stream.push(ctx.width, position.width);
// 						});
// 					});

// 					return rows;
// 				});

// 			var rowsWithHeights = stream.combine([
// 				minHeightsS,
// 				rowsStream,
// 			], function (mhs, rows) {
// 				var index = 0;
// 				rows.map(function (row) {
// 					row.height = 0;
// 					row.cells.map(function (cell, i) {
// 						row.height = Math.max(row.height, mhs[index + i]);
// 					});
// 					index += row.cells.length;
// 				});

// 				stream.push(instance.minHeight, rows.map(function (r) {
// 					return r.height;
// 				}).reduce(function (a, b) { return a + b + config.padding; }, -config.padding));
// 				return rows;
// 			});


// 			stream.all([
// 				context.width,
// 				context.height,
// 				rowsWithHeights], function (gridWidth, gridHeight, rows) {
// 					if (config.bottomToTop) {
// 						rows = rows.slice(0).reverse();
// 					}
// 					var top = 0;
// 					rows = config.handleSurplusHeight(gridHeight, rows, config);
// 					rows.map(function (row, i) {
// 						var widthUsed = 0;
// 						var positions = row.cells.map(function (widthNeeded) {
// 							var position = {
// 								top: top,
// 								left: widthUsed,
// 								width: widthNeeded,
// 								height: row.height,
// 							};
// 							widthUsed += widthNeeded + config.padding;
// 							return position;
// 						});
// 						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
// 						positions.map(function (position, index) {
// 							var ctx = row.contexts[index];
// 							stream.push(ctx.top, position.top);
// 							stream.push(ctx.left, position.left);
// 							stream.push(ctx.width, position.width);
// 							stream.push(ctx.height, position.height);
// 						});
// 						top += row.height + config.padding;
// 					});
// 				});

// 			return [contexts];
// 		}),
// 	]));
// };

// var withMinWidthStream = function (getMinWidthStream, c) {
// 	return div.all([
// 		componentName('with-min-width-stream'),
// 		child(c),
// 		wireChildren(function (instance, context, i) {
// 			if ($.isFunction(getMinWidthStream)) {
// 				stream.pushAll(getMinWidthStream(i, context), instance.minWidth);
// 			}
// 			else {
// 				stream.pushAll(getMinWidthStream, instance.minWidth);
// 			}
// 			stream.pushAll(i.minHeight, instance.minHeight);
// 			return [{
// 				top: stream.once(0),
// 				left: stream.once(0),
// 				width: context.width,
// 				height: context.height,
// 			}];
// 		}),
// 	]);
// };
var withMinHeightStream = function (getMinHeightStream) {
	return layout(function (ctx, i) {
		ctx.$el.addClass('withMinHeightStream');
		return {
			minHeight: $.isFunction(getMinHeightStream) ? getMinHeightStream(i) : getMinHeightStream,
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

// var atMostWindowBottom = function (c, distanceStream) {
// 	distanceStream = distanceStream || stream.once(0);
// 	return withMinHeightStream(function (instance, context) {
// 		return stream.combine([instance.minHeight,
// 							   context.top,
// 							   context.topAccum,
// 							   distanceStream,
// 							   windowResize], function (mh, t, ta, distance) {
// 								   return Math.min(mh, window.innerHeight - t - ta - distance);
// 							   });
// 	}, c);
// };

var overlays = function (config) {
	return layout(function (ctx, is) {
		var chooseLargest = function (streams) {
			return stream.combine(streams, function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			});
		};
		return [{
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
		}];
	});
};


// var table = function (config, css) {
// 	config = config || {};
// 	var padding = (config.padding || 0) * 2;
// 	return div.all(stream.map(css, function (cs) {
// 		return children(cs);
// 	})).all([
// 		componentName('table'),
// 		wireChildren(function () {
// 			var args = Array.prototype.slice.call(arguments);
// 			var instance = args[0];
// 			var context = args[1];
// 			var iss = args.slice(2);

// 			// we blindly assume all rows have the same number of columns

// 			// set table min width
// 			var maxMWs = stream.combine(iss.reduce(function (a, is) {
// 				stream.push(a, stream.combine(is.map(function (i) {
// 					return i.minWidth;
// 				}), function () {
// 					return Array.prototype.slice.call(arguments);
// 				}));
// 				return a;
// 			}, []), function () {
// 				var rowMWs = Array.prototype.slice.call(arguments);
// 				return rowMWs.reduce(function (a, rowMWs) {
// 					return stream.map(rowMWs, function (mw, i) {
// 						return Math.max(a[i] || 0, mw);
// 					});
// 				}, []);
// 			});
// 			stream.map(maxMWs, function (maxMWs) {
// 				var mw = maxMWs.reduce(function (a, mw) {
// 					return a + mw + padding;
// 				}, -padding);
// 				stream.push(instance.minWidth, mw);
// 			});

// 			// set table min height
// 			var rowMinHeights = iss.reduce(function (a, is) {
// 				stream.push(a, stream.combine(is.map(function (i) {
// 					return i.minHeight;
// 				}), function () {
// 					var args = Array.prototype.slice.call(arguments);
// 					return args.reduce(mathMax, 0);
// 				}));
// 				return a;
// 			}, []);
// 			stream.combine(rowMinHeights, function () {
// 				var mhs = Array.prototype.slice.call(arguments);
// 				var mh = mhs.reduce(function (a, mh) {
// 					return a + mh + padding;
// 				}, -padding);
// 				stream.push(instance.minHeight, mh);
// 			});

// 			return stream.map(rowMinHeights, function (mh, i) {
// 				return stream.map(iss[i], function (_, index) {
// 					return {
// 						width: stream.map(maxMWs, function (maxMWs) {
// 							return maxMWs[index];
// 						}),
// 						height: rowMinHeights[i],
// 						top: stream.combine(rowMinHeights.slice(0, i).concat([stream.once(0)]), function () {
// 							var mhs = Array.prototype.slice.call(arguments);
// 							return mhs.reduce(function (a, mh) {
// 								return a + mh + padding;
// 							}, -padding);
// 						}),
// 						left: stream.map(maxMWs, function (maxMWs) {
// 							return maxMWs.reduce(function (a, mw, mwI) {
// 								return a + (mwI < index ? mw + padding : 0);
// 							}, 0);
// 						}),
// 					};
// 				});
// 			});
// 		}),
// 	]);
// };

// var tabs = function (list, stream) {
// 	var whichTab = stream || stream.once(0);
// 	return stack({}, [
// 		sideBySide({
// 			handleSurplusWidth: centerSurplusWidth,
// 		}, stream.map(list, function (item, index) {
// 			return alignTBM({
// 				bottom: toggleComponent([
// 					item.tab.left,
// 					item.tab.right,
// 					item.tab.selected,
// 				], stream.map(whichTab, function (i) {
// 					if (index < i) {
// 						return 0;
// 					}
// 					if (index > i) {
// 						return 1;
// 					}
// 					return 2;
// 				})).all([
// 					link,
// 					clickThis(function () {
// 						stream.push(whichTab, index);
// 					}),
// 				]),
// 			});
// 		})),
// 		componentStream(stream.map(whichTab, function (i) {
// 			return list[i].content;
// 		})),
// 	]);
// };

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
