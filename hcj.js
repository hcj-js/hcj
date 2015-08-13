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
		
		var lastValue;
		var listeners = [];

		var pushValue = function (v) {
			if (!ended && lastValue !== v) {
				lastValue = v;
				listeners.map(function (f) {
					return f(v);
				});
			}
		};

		return {
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
			end: function () {
				ended = true;
			},
			push: pushValue,
			pushAll: function (s) {
				this.map(function (v) {
					s.push(v);
				}, 'pushing all');
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
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
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
			stream.map(function (v) {
				arr[i] = v;
				tryRunF();
			}, 'combining');
			return i + 1;
		}, 0);

		return stream;
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
			streamsObject[key].map(function (v) {
				obj[key] = v;
				tryRunF();
			});
		});

		return stream;
	},
};

var child = function (component) {
	return function (i) {
		i.child(component);
	};
};
var children = function (components) {
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

			Q.all(instance.childComponentPs).then(function (childComponents) {
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
				
				for (var i = 0; i < childInstances.length; i++) {
					var resultContext = resultContexts[i] || {};
					
					var childInstance = childInstances[i];
					var childContext = childContexts[i];
					
					var applyResult = function (resultContext, childInstance, childContext) {
						resultContext = resultContext || {};
						(resultContext.top || Stream.once(0, 'default top')).pushAll(childContext.top);
						(resultContext.left || Stream.once(0, 'default left')).pushAll(childContext.left);
						(resultContext.width || childInstance.minWidth).pushAll(childContext.width);
						(resultContext.height || childInstance.minHeight).pushAll(childContext.height);
						(resultContext.backgroundColor || Stream.never('default background color')).pushAll(childContext.backgroundColor);
						(resultContext.fontColor || Stream.never('default font color')).pushAll(childContext.fontColor);
					};

					if ($.isArray(childInstance)) {
						for (var j = 0; j < childInstance.length; j++) {
							applyResult(resultContext[j], childInstance[j], childContext[j]);
						}
					}
					else {
						applyResult(resultContext, childInstance, childContext);
					}
				}
			});
			
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
								destroy();
							});
						}
						else {
							destroy();
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
		var minWidth = Stream.once(0, 'el min width');
		var minHeight = Stream.once(0, 'el min height');

		var updateMinHeight = function () {
			var mh = findMinHeight(i.$el);
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};

		var $el = $(document.createElement(name));
		context.$el.append($el);

		context.top.map(function (t) {
			updateDomFunc(function () {
				$el.css('top', px(t));
			});
		}, 'set top css');
		context.left.map(function (l) {
			updateDomFunc(function () {
				$el.css('left', px(l));
			});
		}, 'set left css');
		context.width.map(function (w) {
			var optimalHeight = findOptimalHeight($el, w);
			if (optimalHeight !== 0) {
				minHeight.push(optimalHeight);
			}
			updateDomFunc(function () {
				$el.css('width', px(w));
			});
		}, 'set width css');
		context.height.map(function (h) {
			updateDomFunc(function () {
				$el.css('height', px(h));
			});
		}, 'set height css');
		context.backgroundColor.map(function (bgcolor) {
			$el.css('background-color', bgcolor);
		}, 'set background color css');
		context.fontColor.map(function (bgcolor) {
			$el.css('color', bgcolor);
		}, 'set font color css');

		var childComponentPs = [];
		
		var scrollStream = Stream.combine([context.scroll, context.top], function (scroll, top) {
			return scroll - top;
		});
		var topAccumStream = Stream.combine([context.topAccum, context.top], function (a, b) {
			return a + b;
		});
		var newCtx = function () {
			return {
				$el: $el,
				scroll: scrollStream,
				topAccum: topAccumStream,
				top: Stream.once(0, 'context top'),
				left: Stream.once(0, 'context left'),
				width: Stream.never('context width'),
				height: Stream.never('context height'),
				backgroundColor: Stream.never('context background color'),
				fontColor: Stream.never('context font color'),
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
				minWidth.push(0);
				minWidth.end();
				minHeight.push(0);
				minHeight.end();

				var allInstances = this.childInstances;
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
			updateDimensions: function () {
				var mw = findMinWidth(this.$el);
				var mh = findMinHeight(this.$el);
				this.minWidth.push(mw);
				this.minHeight.push(mh);
			},
		};
	});
};


// div :: Component
var a = el('a');
var div = el('div');
var form = el('form');
var img = el('img');
var input = el('input');
var li = el('li');
var textarea = el('textarea');
var ul = el('ul');

var rootContext = function () {
	return {
		$el: $('body'),
		top: Stream.once(0, 'root top'),
		topAccum: Stream.once(0),
		left: Stream.once(0, 'root left'),
		scroll: windowScroll,
		width: windowWidth,
		height: Stream.never('root height'),
		backgroundColor: Stream.never('root background color'),
		fontColor: Stream.never('root font color'),
	};
};

var rootComponent = function (component) {
	var context = rootContext();
	var instance = component.create(context);
	instance.minHeight.pushAll(context.height);
	return instance;
};
