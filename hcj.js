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
	create: function (onValue) {
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

		onValue(pushValue);

		return {
			map: function (f) {
				if (lastValue !== undefined) {
					f(lastValue);
				}
				listeners.push(f);
				
				return Stream.create(function (cb) {
					if (lastValue !== undefined) {
						cb(f(lastValue));
					}
					listeners.push(function (v) {
						cb(f(v));
					});
				});
			},
			end: function () {
				ended = true;
			},
			push: pushValue,
			pushAll: function (s) {
				this.map(function (v) {
					s.push(v);
				});
			},
		};
	},
	once: function (v) {
		return Stream.create(function (cb) {
			cb(v);
		});
	},
	never: function (debounce) {
		return Stream.create(function () {}, debounce);
	},
	combine: function (streams, f) {
		var arr = [];
		return Stream.create(function (cb) {
			var tryRunF = function () {
				for (var i = 0; i < streams.length; i++) {
					if (arr[i] === undefined) {
						return;
					}
				}
				cb(f.apply(null, arr));
			};

			streams.reduce(function (i, stream) {
				stream.map(function (v) {
					arr[i] = v;
					tryRunF();
				});
				return i + 1;
			}, 0);
		});
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
				
				var resultContexts = instance.wireChildren.apply(null, [instance, context].concat(childInstances)) || [];
				
				for (var i = 0; i < childInstances.length; i++) {
					var resultContext = resultContexts[i] || {};
					
					var childInstance = childInstances[i];
					var childContext = childContexts[i];
					
					var applyResult = function (resultContext, childInstance, childContext) {
						resultContext = resultContext || {};
						(resultContext.top || Stream.once(0)).pushAll(childContext.top);
						(resultContext.left || Stream.once(0)).pushAll(childContext.left);
						(resultContext.width || childInstance.minWidth).pushAll(childContext.width);
						(resultContext.height || childInstance.minHeight).pushAll(childContext.height);
						(resultContext.backgroundColor || Stream.never()).pushAll(childContext.backgroundColor);
						(resultContext.fontColor || Stream.never()).pushAll(childContext.fontColor);
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
setInterval(function () {
	updateDomFuncs.map(function (f) {
		f();
	});
	updateDomFuncs = [];
}, 100);
var el = function (name) {
	return component(function (context) {
		var minWidth = Stream.once(0);
		var minHeight = Stream.once(0);

		var updateMinHeight = function () {
			var mh = findMinHeight(i.$el);
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};

		var $el = $(document.createElement(name));
		context.$el.append($el);

		context.top.map(function (t) {
			updateDomFuncs.push(function () {
				$el.css('top', px(t));
			});
		});
		context.left.map(function (l) {
			updateDomFuncs.push(function () {
				$el.css('left', px(l));
			});
		});
		context.width.map(function (w) {
			var optimalHeight = findOptimalHeight($el, w);
			if (optimalHeight !== 0) {
				minHeight.push(optimalHeight);
			}
			updateDomFuncs.push(function () {
				$el.css('width', px(w));
			});
		});
		context.height.map(function (h) {
			updateDomFuncs.push(function () {
				$el.css('height', px(h));
			});
		});
		context.backgroundColor.map(function (bgcolor) {
			$el.css('background-color', bgcolor);
		});
		context.fontColor.map(function (bgcolor) {
			$el.css('color', bgcolor);
		});

		var minWidth = Stream.once(0);
		var minHeight = Stream.once(0);

		var childComponentPs = [];
		
		var scrollStream = Stream.combine([context.scroll, context.top], function (scroll, top) {
			return scroll - top;
		});
		var newCtx = function () {
			return {
				$el: $el,
				scroll: scrollStream,
				top: Stream.once(0),
				left: Stream.once(0),
				width: Stream.never(),
				height: Stream.never(),
				backgroundColor: Stream.never(),
				fontColor: Stream.never(),
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
				minHeight.push(0);

				Q.all(allInstancePs).then(function (allInstances) {
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
					
					$el.remove();
				});
			},
		};
	});
};


// div :: Component
var a = el('a');
var div = el('div');
var img = el('img');
var input = el('input');
var li = el('li');
var textarea = el('textarea');
var ul = el('ul');

var rootContext = function () {
	return {
		$el: $('body'),
		top: Stream.once(0),
		left: Stream.once(0),
		scroll: windowScroll,
		width: windowWidth,
		height: Stream.never(),
		backgroundColor: Stream.never(),
		fontColor: Stream.never(),
	};
};

var rootComponent = function (component) {
	var context = rootContext();
	var instance = component.create(context);
	instance.minHeight.pushAll(context.height);
	instance.minHeight.map(function () {
		updateWindowWidth();
	});
	return instance;
};
