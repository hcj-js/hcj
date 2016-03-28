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

var stream = {
	// constructors
	create: function () {
		return {
			listeners: [],
			lastValue: undefined,
			ended: false,
		};
	},
	isStream: function (v) {
		return v.hasOwnProperty('listeners') &&
			v.hasOwnProperty('lastValue') &&
			v.hasOwnProperty('ended');
	},
	once: function (v) {
		var s = stream.create();
		// todo: set timeout, and get rid of last value????
		stream.push(s, v);
		return s;
	},
	push: function (s, v) {
		if (s.lastValue !== v && !s.ended) {
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
	reduce: function (s, f, v) {
		var out = stream.once(v);
		if (s.lastValue !== undefined) {
			stream.push(out, f(s.lastValue, v));
		}
		s.listeners.push(function (v) {
			stream.push(out, f(v, out.lastValue));
		});
		return out;
	},
	filter: function (s, f) {
		var out = stream.create();
		if (s.lastValue !== undefined) {
			f(s.lastValue, out.push);
		}
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
		if (s.lastValue) {
			d.resolve(s.lastValue);
		}
		else {
			stream.map(s, function (v) {
				d.resolve(v);
			});
		}
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
		return stream;
	},
	end: function (s) {
		s.ended = true;
	},
	pushAll: function (source, target) {
		stream.onValue(source, function (v) {
			stream.push(target, v);
		});
	},
	never: function () {
		return stream.create();
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


var child = function (component) {
	if (!component || !component.create) {
		console.error('faulty component');
	}
	return function (i) {
		i.child(component);
	};
};
var children = function (components) {
	components.map(function (component) {
		if (!component || !component.create) {
			console.error('faulty component');
		}
	});
	return function (i) {
		i.children(components);
	};
};
var wireChildren = function (f) {
	return function (i) {
		i.wireChildren = f;
	};
};

// add some syntactic sugar for calling and and all
var component = function (build) {
	var comp = {
		create: function (context) {
			var instance = this.build(context);

			instance.wireChildren = instance.wireChildren || function () {};

			var childComponents = instance.childComponentPs;
			var childContexts = [];
			var childInstances = childComponents.map(function (childComponent) {
				if ($.isArray(childComponent)) {
					var ctxs = [];
					var is = childComponent.map(function (c) {
						var ctx = instance.newCtx();
						ctxs.push(ctx);
						return c.create(ctx);
					});
					childContexts.push(ctxs);
					return is;
				}
				else {
					var ctx = instance.newCtx();
					childContexts.push(ctx);
					return childComponent.create(ctx);
				}
			});

			instance.childInstances = childInstances;

			var resultContexts = instance.wireChildren.apply(null, [instance, context].concat(childInstances)) || [];

			var applyResult = function (resultContext, childInstance, childContext) {
				resultContext = resultContext || {};
				if (resultContext.top) {
					stream.pushAll(resultContext.top, childContext.top);
				}
				if (resultContext.left) {
					stream.pushAll(resultContext.left, childContext.left);
				}
				if (resultContext.width) {
					stream.pushAll(resultContext.width, childContext.width);
				}
				if (resultContext.height) {
					stream.pushAll(resultContext.height, childContext.height);
				}
				if (resultContext.backgroundColor) {
					stream.pushAll(resultContext.backgroundColor, childContext.backgroundColor);
				}
				if (resultContext.fontColor) {
					stream.pushAll(resultContext.fontColor, childContext.fontColor);
				}
			};

			for (var i = 0; i < childInstances.length; i++) {
				var resultContext = resultContexts[i] || {};

				var childInstance = childInstances[i];
				var childContext = childContexts[i];

				if ($.isArray(childInstance)) {
					for (var j = 0; j < childInstance.length; j++) {
						applyResult(resultContext[j], childInstance[j], childContext[j]);
					}
				}
				else {
					applyResult(resultContext, childInstance, childContext);
				}
			}

			return instance;
		},
		build: build,
		and: function (f) {
			var that = this;
			var c = $.extend({}, that);
			c.build = function (context) {
				var i = that.build(context);
				var destroyF = f(i, context);
				var destroy = i.destroy;
				if (destroyF) {
					i.destroy = function () {
						var p = destroyF();
						if (p) {
							p.then(function () {
								destroy.apply(i);
							});
						}
						else {
							destroy.apply(i);
						}
					};
				}
				return i;
			};
			return c;
		},
		all: function (fs) {
			return fs.reduce(function (c, f) {
				return c.and(f);
			}, this);
		},
		compose: function (fs) {
			return fs.reduce(function (c, f) {
				return f(c);
			}, this);
		},
	};
	return comp;
};

// Takes a function that can be used with and or all.  Returns a
// function that can be used with compose.
var liftC = function (f) {
	return function (c) {
		return c.and(f);
	};
};

// Takes a function that takes arguments and returns a function that
// can be used with and or all.  Returns a function that takes those
// same arguments and returns a function that can be used with
// compose.
var liftCF = function (f) {
	return function () {
		var args = arguments;
		return function (c) {
			return c.and(f.apply(null, args));
		};
	};
};

var findOptimalHeight = function ($el, w) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('height', '')
		.css('width', w)
		.appendTo($sandbox);

	var height = parseInt($clone.css('height'));

	$clone.remove();
	return height;
};

var findMinWidth = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', '')
		.css('height', '')
		.appendTo($sandbox);

	var width = parseInt($clone.css('width'));
	$clone.remove();

	return width;
};

var findScrollWidth = function ($el, w) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', w)
		.css('height', '')
		.appendTo($sandbox);

	var width = $clone[0].scrollWidth;
	$clone.remove();

	return width;
};

var findMinHeight = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', '')
		.css('height', '')
		.appendTo($sandbox);

	var height = parseInt($clone.css('height'));

	$clone.remove();

	return height;
};

var updateDomFuncs = [];
var applyFunc = function (f) {
	f.$el.css(f.prop, f.value);
};
var runDomFuncs = function () {
	updateDomFuncs.map(applyFunc);
	updateDomFuncs = [];
	updateWindowWidth();
};
var updateDomFunc = function (func) {
	if (updateDomFuncs.length === 0) {
		setTimeout(runDomFuncs);
	}
	updateDomFuncs.push(func);
};
var el = function (name) {
	return component(function (context) {
		var minWidth = stream.never();
		var minHeight = stream.never();
		var updateMinHeight = function () {
			var mh = findMinHeight(i.$el);
			stream.push(i.minWidth, mw);
			stream.push(i.minHeight, mh);
		};

		var $el = $(document.createElement(name));
		if ($el.prop('tagName').toLowerCase() === 'div') {
			$el.css('pointer-events', 'none');
		}
		else {
			$el.css('pointer-events', 'initial');
		}
		$el.css('position', 'absolute');
		$el.css('visibility', 'hidden');
		context.$el.append($el);

		stream.onValue(context.top, function (t) {
			updateDomFunc({
				$el: $el,
				prop: 'top',
				value: px(t),
			});
		});
		stream.onValue(context.left, function (l) {
			updateDomFunc({
				$el: $el,
				prop: 'left',
				value: px(l),
			});
		});
		stream.onValue(context.width, function (w) {
			updateDomFunc({
				$el: $el,
				prop: 'width',
				value: px(w),
			});
		});
		stream.onValue(context.height, function (h) {
			updateDomFunc({
				$el: $el,
				prop: 'height',
				value: px(h),
			});
		});
		stream.combine([context.width, context.height, context.top, context.left], function () {
			updateDomFunc({
				$el: $el,
				prop: 'visibility',
				value: '',
			});
		});
		stream.onValue(context.backgroundColor, function (backgroundColor) {
			$el.css('background-color', colorString(backgroundColor));
		});
		stream.onValue(context.fontColor, function (fontColor) {
			$el.css('color', colorString(fontColor));
		});

		var childComponentPs = [];

		var scrollStream = stream.combine([context.scroll, context.top], function (scroll, top) {
			return scroll - top;
		});
		var topAccumStream = stream.combine([context.topAccum, context.top], function (a, b) {
			return a + b;
		});
		var leftAccumStream = stream.combine([context.leftAccum, context.left], function (a, b) {
			return a + b;
		});
		var brightnessStream = stream.combine([context.brightness, context.backgroundColor], function (parentBrightness, c) {
			var brightness = colorBrightness(c);
			return c.a * brightness +
				(1 - c.a) * parentBrightness;
		});
		var newCtx = function (ctx) {
			return {
				$el: $el,
				scroll: scrollStream,
				topAccum: topAccumStream,
				top: stream.never(),
				left: stream.never(),
				leftAccum: leftAccumStream,
				width: stream.never(),
				height: stream.never(),
				backgroundColor: stream.once(transparent),
				fontColor: stream.never(),
				brightness: brightnessStream,
			};
		};

		return {
			$el: $el,
			optimalWidth: 0,
			minWidth: minWidth,
			minHeight: minHeight,
			newCtx: newCtx,
			childComponentPs: childComponentPs,
			child: function (component) {
				childComponentPs.push(component);
			},
			children: function (components) {
				childComponentPs.push(components);
			},
			destroy: function () {
				stream.end(minWidth);
				stream.end(minHeight);

				var allInstances = this.childInstances || [];
				for (var i = 0; i < allInstances.length; i++) {
					var instance = allInstances[i];
					if ($.isArray(instance)) {
						var instances = instance;
						instances.map(function (i) {
							i.destroy();
						});
					}
					else {
						instance.destroy();
					}
				}

				this.$el.remove();
			},
			updateDimensions: function (onlyNonzero) {
				var mw = findMinWidth(this.$el);
				var mh = findMinHeight(this.$el);
				// hack to do this - should really improve 'text' and
				// 'paragraph' functions, and call updateDimensions in
				// fewer places
				if (this.$el.prop('tagName') !== 'IMG') {
					if (!onlyNonzero || mw !== 0) {
						stream.push(this.minWidth, mw);
					}
					if (!onlyNonzero || mh !== 0) {
						stream.push(this.minHeight, mh);
					}
				}
			},
		};
	});
};


// div :: Component
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

var rootContext = function () {
	return {
		$el: $('body'),
		top: stream.once(0),
		topAccum: stream.once(0),
		left: stream.once(0),
		leftAccum: stream.once(0),
		scroll: windowScroll,
		width: windowWidth,
		height: stream.never(),
		backgroundColor: stream.once(transparent),
		fontColor: stream.once(black),
		brightness: stream.once(1),
	};
};

var rootComponent = function (component, ctx, setContainerSize) {
	var context = $.extend(rootContext(), ctx);
	var instance = component.create(context);

	stream.pushAll(instance.minHeight, context.height);
	if (setContainerSize) {
		stream.map(context.width, function (w) {
			context.$el.css('width', w);
		});
		stream.map(context.height, function (h) {
			context.$el.css('height', h);
		});
	}
	return instance;
};
