var JQuery = instance($, 'JQuery');

var Point2D = object({
	x: number,
	y: number,
});

var Context = object({
	$el: JQuery,               // contanier
	scroll: stream(number),    // window top, relative to origin
	top: stream(number),       // top coordinate, relative to origin (parent)
	left: stream(number),      // left coordinate, relative to origin (parent)
	width: stream(number),     // set width of element
	height: stream(number),    // set height of element
});

var Instance = object({
	$el: JQuery,               // root element
	minWidth: stream(number),          // parent component may use this to update the width of the instance
	minHeight: stream(number), // parent component may be interested
	destroy: func(),           // completely remove instance
});

var Component = object({
	create: func([Context], Instance),
	and: function () {
		return func([or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		])], Component);
	},
	all: function () {
		return func([list(or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		]))], Component);
	},
});

var Stream = {
	create: function () {
		var ended = false;
		
		var valueD = Q.defer();

		var lastValue;
		var listeners = [];

		var pushValue = function (v) {
			valueD.resolve(v);
			if (!ended && lastValue !== v) {
				lastValue = v;
				listeners.map(function (f) {
					return f(v);
				});
			}
		};

		return {
			lastValue: function () {
				return lastValue;
			},
			map: function (f) {
				var stream = Stream.create();
				if (lastValue !== undefined) {
					stream.push(f(lastValue));
				}
				listeners.push(function (v) {
					stream.push(f(v));
				});
				return stream;
			},
			reduce: function (f, v) {
				var stream = Stream.once(v);
				if (lastValue !== undefined) {
					stream.push(f(stream.lastValue(), lastValue));
				}
				listeners.push(function (v) {
					stream.push(f(stream.lastValue(), v));
				});
				return stream;
			},
			filter: function (f) {
				var stream = Stream.create();
				if (lastValue !== undefined) {
					f(lastValue, stream.push);
				}
				listeners.push(function (v) {
					f(v, stream.push);
				});
				return stream;
			},
			onValue: function (f) {
				return this.map(function (v) {
					f(v);
					return true;
				});
			},
			promise: valueD.promise,
			prop: function (str) {
				return this.map(function (v) {
					return v[str];
				});
			},
			end: function () {
				ended = true;
			},
			push: pushValue,
			pushAll: function (s) {
				this.onValue(function (v) {
					s.push(v);
				});
			},
			test: function () {
				var args = arguments;
				var err = new Error();
				setTimeout(function () {
					if (lastValue === undefined) {
						args;
						err;
						debugger;
					}
				}, 5000);
				return this;
			},
		};
	},
	once: function (v) {
		var stream = Stream.create();
		stream.push(v);
		return stream;
	},
	never: function () {
		return Stream.create();
	},
	combine: function (streams, f) {
		var arr = [];
		var stream = Stream.create();

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
					stream.push(f.apply(null, arr));
				});
			}
		};
		
		streams.reduce(function (i, stream) {
			stream.onValue(function (v) {
				arr[i] = v;
				tryRunF();
			});
			return i + 1;
		}, 0);

		return stream;
	},
	all: function (streams, f) {
		return this.combine(streams, function () {
			f.apply(null, arguments);
			return true;
		});
	},
	combineObject: function (streamsObject) {
		var keys = Object.keys(streamsObject);
		var obj = {};
		var stream = Stream.create();
		
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
					stream.push($.extend({}, obj));
				});
			}
		};
		
		keys.map(function (key, i) {
			streamsObject[key].onValue(function (v) {
				obj[key] = v;
				tryRunF();
			});
		});

		return stream;
	},
	splitObject: function (obj) {
		var keys = Object.keys(obj);
		var streams = {};
		keys.map(function (key) {
			streams[key] = Stream.once(obj[key]);
		});
		return streams;
	},
	fromPromise: function (p, initialValue) {
		var stream = Stream.never();
		if (initialValue) {
			stream.push(initialValue);
		}
		p.then(function (v) {
			stream.push(v);
		});
		return stream;
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
					resultContext.top.pushAll(childContext.top);
				}
				if (resultContext.left) {
					resultContext.left.pushAll(childContext.left);
				}
				if (resultContext.width) {
					resultContext.width.pushAll(childContext.width);
				}
				if (resultContext.height) {
					resultContext.height.pushAll(childContext.height);
				}
				if (resultContext.backgroundColor) {
					resultContext.backgroundColor.pushAll(childContext.backgroundColor);
				}
				if (resultContext.fontColor) {
					resultContext.fontColor.pushAll(childContext.fontColor);
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
	};
	return comp;
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
var updateDomFunc = function (func) {
	if (updateDomFuncs.length === 0) {
		setTimeout(function () {
			updateDomFuncs.map(function (f) {
				f();
			});
			updateDomFuncs = [];
			updateWindowWidth();
		});
	}
	updateDomFuncs.push(func);
};
var el = function (name) {
	return component(function (context) {
		var minWidth = Stream.never();
		var minHeight = Stream.never();
		var updateMinHeight = function () {
			var mh = findMinHeight(i.$el);
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};

		var $el = $(document.createElement(name));
		$el.css('position', 'absolute');
		$el.css('visibility', 'hidden');
		context.$el.append($el);
		
		context.top.onValue(function (t) {
			updateDomFunc(function () {
				$el.css('top', px(t));
			});
		});
		context.left.onValue(function (l) {
			updateDomFunc(function () {
				$el.css('left', px(l));
			});
		});
		context.width.onValue(function (w) {
			updateDomFunc(function () {
				$el.css('width', px(w));
			});
		});
		context.height.onValue(function (h) {
			updateDomFunc(function () {
				$el.css('height', px(h));
			});
		});
		Stream.combine([context.width, context.height, context.top, context.left], function () {
			updateDomFunc(function () {
				$el.css('visibility', '');
			});
		});
		context.backgroundColor.onValue(function (bgcolor) {
			$el.css('background-color', bgcolor);
		});
		context.fontColor.onValue(function (bgcolor) {
			$el.css('color', bgcolor);
		});

		var childComponentPs = [];
		
		var scrollStream = Stream.combine([context.scroll, context.top], function (scroll, top) {
			return scroll - top;
		});
		var topAccumStream = Stream.combine([context.topAccum, context.top], function (a, b) {
			return a + b;
		});
		var newCtx = function (ctx) {
			return {
				$el: $el,
				scroll: scrollStream,
				topAccum: topAccumStream,
				top: Stream.never(),
				left: Stream.never(),
				width: Stream.never(),
				height: Stream.never(),
				backgroundColor: Stream.once('rgba(0,0,0,0)'),
				fontColor: Stream.once('inherit'),
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
				minWidth.end();
				minHeight.end();

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
			updateDimensions: (function () {
				return function (onlyNonzero) {
					var mw = findMinWidth(this.$el);
					var mh = findMinHeight(this.$el);
					if (!onlyNonzero || mw !== 0) {
						this.minWidth.push(mw);
					}
					if (!onlyNonzero || mh !== 0) {
						this.minHeight.push(mh);
					}
				};
			})(),
		};
	});
};


// div :: Component
var a = el('a');
var button = el('button');
var div = el('div');
var form = el('form');
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
		top: Stream.once(0),
		topAccum: Stream.once(0),
		left: Stream.once(0),
		scroll: windowScroll,
		width: windowWidth,
		height: Stream.never(),
		backgroundColor: Stream.once('white'),
		fontColor: Stream.once('black'),
	};
};

var rootComponent = function (component) {
	var context = rootContext();
	var instance = component.create(context);
	instance.minHeight.pushAll(context.height);
	return instance;
};
